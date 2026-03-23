"""Smoke tests for the rational field equation engine."""

import math
from fractions import Fraction
from rfe import tree, tongues, field, observables
from rfe.constants import PHI, INV_PHI, PHI_SQ, N_S, A0_LOCAL


def test_tree_build():
    nodes = tree.build(5)
    assert len(nodes) == 31  # 2^5 - 1
    assert all(Fraction(0) < f < Fraction(1) for f in nodes)
    # Mediants are sorted
    for i in range(len(nodes) - 1):
        assert nodes[i] < nodes[i + 1]


def test_backbone():
    nodes = tree.build(8)
    bb = tree.backbone_in_tree(nodes)
    assert len(bb) >= 6
    # Each convergent alternates above/below 1/phi
    for lvl, f in bb:
        assert abs(float(f) - INV_PHI) < 0.5


def test_tongue_critical_sums_toward_1():
    nodes = tree.build(8)
    total = sum(tongues.width_critical(f.numerator, f.denominator)
                for f in nodes)
    # Finite tree doesn't reach 1.0 but should exceed 0.5
    assert total > 0.5


def test_tongue_interpolation():
    # At K=0 all tongues have zero width
    assert tongues.width(1, 3, 0.0) == 0.0
    # At K=1 should match critical
    w1 = tongues.width(1, 5, 1.0)
    wc = tongues.width_critical(1, 5)
    assert abs(w1 - wc) < 1e-10


def test_field_equation_converges():
    nodes = tree.build(8)
    pops, r, hist = field.solve(nodes, K0=1.0, g_func=field.g_uniform, n_iter=400)
    # Should converge (last values stable)
    assert abs(hist[-1] - hist[-2]) < 1e-6
    # Order parameter should be positive
    assert abs(r) > 0.1
    # All populations positive
    assert all(v >= 0 for v in pops.values())


def test_scale_invariance():
    """The density along the backbone should be approximately flat."""
    nodes = tree.build(10)
    pops, _, _ = field.solve(nodes, K0=1.0, g_func=field.g_uniform)
    _, _, _, asym_slope = observables.power_spectrum(pops)
    # Asymptotic slope should be near zero (scale-invariant)
    assert asym_slope is not None
    assert abs(asym_slope) < 0.1


def test_a0_increases_with_z():
    table = observables.a0_table([0, 1, 2, 3])
    for i in range(len(table) - 1):
        assert table[i + 1]["a0"] > table[i]["a0"]


def test_a0_local():
    a0 = observables.a0_of_z(0)
    # Should be within 20% of observed 1.2e-10
    assert 0.8e-10 < a0 < 1.5e-10


def test_rar_limits():
    # Deep MOND: g_obs -> sqrt(g_bar * a0)
    g_bar = A0_LOCAL * 1e-3
    g_obs = observables.rar(g_bar)
    assert g_obs > g_bar  # boosted

    # Newtonian: g_obs -> g_bar
    g_bar = A0_LOCAL * 1e3
    g_obs = observables.rar(g_bar)
    assert abs(g_obs / g_bar - 1) < 0.01


def test_collapse_uncertainty():
    """tau * Delta_theta should be approximately constant."""
    products = [observables.uncertainty_product(10 ** e)
                for e in range(-4, 0)]
    # All should be equal (= 1/sqrt(K) = 1)
    for p in products:
        assert abs(p - 1.0) < 1e-10


def test_n_efolds():
    N = observables.n_efolds(0.9649)
    assert 59 < N < 63  # sqrt(5) / rate ~ 61.3


if __name__ == "__main__":
    import sys
    failures = 0
    for name, func in sorted(globals().items()):
        if name.startswith("test_") and callable(func):
            try:
                func()
                print(f"  PASS  {name}")
            except Exception as e:
                print(f"  FAIL  {name}: {e}")
                failures += 1
    sys.exit(1 if failures else 0)
