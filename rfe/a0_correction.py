"""Compute the a₀ correction from self-consistent g*.

The simple prediction: a₀ = c·H₀/(2π) ≈ 1.04 × 10⁻¹⁰ m/s²
Observed:             a₀ ≈ 1.2 × 10⁻¹⁰ m/s²
Ratio:                1.154

The gap comes from assuming g = uniform in the Kuramoto critical
coupling. With self-consistent g*, the critical coupling shifts,
and a₀ shifts with it.

Approach:
  1. Sweep K from 0 to 1, solve the field equation at each K
  2. Find K_c where |r| first exceeds threshold (synchronization onset)
  3. Compare K_c(g=uniform) vs K_c(g=g*)
  4. The ratio gives the a₀ correction factor

Usage:
    cd /home/njoven/AI/sandbox/rfe
    python -m rfe.a0_correction
"""

import math
from fractions import Fraction
from . import tree, field, tongues
from .constants import C_LIGHT, H0_SI, A0_LOCAL, PHI, INV_PHI


def find_critical_K(nodes, g_func, K_values=None, inner_iter=300,
                    damping=0.3, threshold=0.05):
    """Find the critical coupling K_c where synchronization onset occurs.

    Sweeps K from low to high, finds where |r| first exceeds threshold.
    Returns K_c and the full |r|(K) curve.
    """
    if K_values is None:
        K_values = [i * 0.02 for i in range(1, 51)]  # 0.02 to 1.0

    r_curve = []
    for K in K_values:
        _, r, hist = field.solve(nodes, K0=K, g_func=g_func,
                                 n_iter=inner_iter, damping=damping)
        r_abs = abs(r)
        r_curve.append((K, r_abs))

    # Find K_c by interpolation
    K_c = None
    for i in range(len(r_curve) - 1):
        K1, r1 = r_curve[i]
        K2, r2 = r_curve[i + 1]
        if r1 < threshold <= r2:
            # Linear interpolation
            t = (threshold - r1) / (r2 - r1) if r2 > r1 else 0
            K_c = K1 + t * (K2 - K1)
            break

    return K_c, r_curve


def g_from_dict(g_dict):
    """Make a callable g(omega) from a dict of {Fraction: float}."""
    def g_func(omega):
        best = min(g_dict.keys(), key=lambda f: abs(float(f) - omega))
        return g_dict[best]
    return g_func


if __name__ == "__main__":
    print("=" * 80)
    print("  a₀ CORRECTION FROM SELF-CONSISTENT g*")
    print("=" * 80)

    DEPTH = 8  # faster for K sweep
    nodes = tree.build(DEPTH)
    print(f"\n  Tree: depth={DEPTH}, nodes={len(nodes)}")

    # ── 1. K_c with uniform g ────────────────────────────────────────────
    print(f"\n{'─' * 80}")
    print("  1. CRITICAL COUPLING: g = uniform")
    print(f"{'─' * 80}\n")

    K_values = [i * 0.01 for i in range(1, 101)]
    K_c_uniform, curve_uniform = find_critical_K(
        nodes, field.g_uniform, K_values=K_values
    )

    print(f"  {'K':>6s}  {'|r|':>10s}")
    print("  " + "-" * 20)
    for K, r in curve_uniform[::5]:
        marker = " ← K_c" if K_c_uniform and abs(K - K_c_uniform) < 0.03 else ""
        print(f"  {K:6.2f}  {r:10.6f}{marker}")
    print(f"\n  K_c (uniform) = {K_c_uniform:.4f}" if K_c_uniform else "  K_c not found")

    # ── 2. Get g* from self-consistent solve ─────────────────────────────
    print(f"\n{'─' * 80}")
    print("  2. SELF-CONSISTENT g*")
    print(f"{'─' * 80}\n")

    from .self_consistent_g import solve_self_consistent_g
    g_star, _, r_star, _ = solve_self_consistent_g(
        nodes, K0=1.0, outer_iter=60, inner_iter=200,
        damping_inner=0.3, damping_outer=0.3
    )

    # Show g* statistics
    g_vals = list(g_star.values())
    g_mean = sum(g_vals) / len(g_vals)
    g_min = min(g_vals)
    g_max = max(g_vals)
    print(f"  g* statistics: mean={g_mean:.4f}, min={g_min:.4f}, max={g_max:.4f}")
    print(f"  |r| at K=1: {abs(r_star):.6f}")

    # ── 3. K_c with g* ──────────────────────────────────────────────────
    print(f"\n{'─' * 80}")
    print("  3. CRITICAL COUPLING: g = g*")
    print(f"{'─' * 80}\n")

    g_star_func = g_from_dict(g_star)
    K_c_star, curve_star = find_critical_K(
        nodes, g_star_func, K_values=K_values
    )

    print(f"  {'K':>6s}  {'|r|':>10s}")
    print("  " + "-" * 20)
    for K, r in curve_star[::5]:
        marker = " ← K_c" if K_c_star and abs(K - K_c_star) < 0.03 else ""
        print(f"  {K:6.2f}  {r:10.6f}{marker}")
    print(f"\n  K_c (g*) = {K_c_star:.4f}" if K_c_star else "  K_c not found")

    # ── 4. Correction factor ─────────────────────────────────────────────
    print(f"\n{'─' * 80}")
    print("  4. a₀ CORRECTION")
    print(f"{'─' * 80}")

    if K_c_uniform and K_c_star:
        ratio = K_c_star / K_c_uniform
        a0_simple = C_LIGHT * H0_SI / (2 * math.pi)
        a0_corrected = a0_simple * ratio

        print(f"""
  K_c (uniform):  {K_c_uniform:.4f}
  K_c (g*):       {K_c_star:.4f}
  Ratio:          {ratio:.4f}

  a₀ (simple):    {a0_simple:.4e} m/s²
  a₀ (corrected): {a0_corrected:.4e} m/s²
  a₀ (observed):  1.2e-10 m/s²

  Correction brings a₀ from {a0_simple:.2e} to {a0_corrected:.2e}
  Observed: 1.20e-10
  Residual: {abs(a0_corrected - 1.2e-10) / 1.2e-10 * 100:.1f}%
""")
    else:
        # If K_c not found by threshold, use Kuramoto analytical formula
        print("\n  K_c not found by threshold method.")
        print("  Using Kuramoto analytical formula: K_c = 2/(π·g(ω₀))")

        # For uniform g on [0,1], g(ω₀) = 1
        K_c_analytic_uniform = 2 / math.pi
        # For g*, evaluate at 1/φ (the MOND transition frequency)
        g_at_phi = g_star_func(INV_PHI)
        K_c_analytic_star = 2 / (math.pi * g_at_phi)

        ratio = K_c_analytic_star / K_c_analytic_uniform
        a0_simple = C_LIGHT * H0_SI / (2 * math.pi)
        a0_corrected = a0_simple * ratio

        print(f"""
  Kuramoto K_c = 2/(π·g(ω₀)):
    K_c (uniform, g=1):     {K_c_analytic_uniform:.4f}
    g*(1/φ):                {g_at_phi:.6f}
    K_c (g*):               {K_c_analytic_star:.4f}
    Ratio:                  {ratio:.4f}

  a₀ (simple):    {a0_simple:.4e} m/s²
  a₀ (corrected): {a0_corrected:.4e} m/s²
  a₀ (observed):  1.2e-10 m/s²

  Residual: {abs(a0_corrected - 1.2e-10) / 1.2e-10 * 100:.1f}%
""")

    # ── 5. Also check: does |r|(K) curve give the RAR shape? ─────────────
    print(f"{'─' * 80}")
    print("  5. |r|(K) CURVE → RAR SHAPE CHECK")
    print(f"{'─' * 80}\n")

    print(f"  The order parameter |r| as a function of K should trace")
    print(f"  the RAR interpolating function when mapped to accelerations.\n")

    print(f"  {'K':>6s}  {'|r|_unif':>10s}  {'|r|_g*':>10s}  {'K/K_c':>8s}")
    print("  " + "-" * 40)
    for i in range(len(curve_uniform)):
        K_u, r_u = curve_uniform[i]
        K_s, r_s = curve_star[i]
        kk = K_u / K_c_uniform if K_c_uniform else 0
        if i % 5 == 0:
            print(f"  {K_u:6.2f}  {r_u:10.6f}  {r_s:10.6f}  {kk:8.3f}")
