"""Self-consistent frequency distribution.

The field equation has two levels of self-consistency:

  Level 1 (D11): N(p/q) = N_total * g(p/q) * w(p/q, K0 * F[N])
    Given g, find N* such that N* = f(N*).

  Level 2 (this): g* = h(g*)
    Find g such that when you solve the field equation with g,
    the resulting population distribution IS g (up to normalization).

If both converge, there are zero free inputs. The theory determines
itself completely.

Usage:
    cd /home/njoven/AI/sandbox/rfe
    python -m rfe.self_consistent_g
"""

import math
from fractions import Fraction
from . import tree, field, tongues, observables
from .constants import PHI, INV_PHI, LN_PHI_SQ, N_S, A_S


def solve_self_consistent_g(nodes, K0=1.0, outer_iter=50, inner_iter=400,
                             damping_inner=0.3, damping_outer=0.5):
    """Find the self-consistent g* by iterating the outer loop.

    Outer loop:
      1. Start with g = uniform
      2. Solve field equation: N* = f(N*; g)
      3. Extract population density rho(p/q) = N*(p/q) / w(p/q)
      4. Normalize rho to get new g
      5. Mix: g_new = (1-alpha)*g_old + alpha*g_from_rho
      6. Repeat until g converges

    Returns:
        g_star: dict {Fraction: float} — the self-consistent distribution
        populations: dict {Fraction: float} — final populations
        r: complex order parameter
        outer_history: list of (iteration, g_change, |r|)
    """
    # Initialize: non-uniform g (peaked at 1/3 to avoid bias toward answer)
    g_values = {f: 1.0 + 2.0 * math.exp(-20 * (float(f) - 1/3) ** 2)
                for f in nodes}

    outer_history = []

    for outer in range(outer_iter):
        # Make g_func from current g_values
        def g_func(omega, _gv=dict(g_values)):
            # Find nearest node
            best = min(_gv.keys(), key=lambda f: abs(float(f) - omega))
            return _gv[best]

        # Solve inner field equation
        populations, r, _ = field.solve(
            nodes, K0=K0, g_func=g_func,
            n_iter=inner_iter, damping=damping_inner
        )

        # Extract density: rho(p/q) = N(p/q) / w(p/q)
        new_g = {}
        for f in nodes:
            p, q = f.numerator, f.denominator
            w = tongues.width(p, q, K0 * abs(r))
            pop = populations.get(f, 0)
            new_g[f] = pop / w if w > 1e-30 else 0

        # Normalize new_g
        total = sum(new_g.values())
        if total > 0:
            scale = len(nodes) / total
            new_g = {f: v * scale for f, v in new_g.items()}

        # Measure change
        delta = sum(abs(new_g[f] - g_values[f]) for f in nodes) / len(nodes)

        outer_history.append((outer, delta, abs(r)))

        # Damped outer update
        g_values = {f: (1 - damping_outer) * g_values[f] + damping_outer * new_g[f]
                    for f in nodes}

        if delta < 1e-8:
            break

    # Final solve with converged g
    def g_final(omega, _gv=dict(g_values)):
        best = min(_gv.keys(), key=lambda f: abs(float(f) - omega))
        return _gv[best]

    populations, r, _ = field.solve(
        nodes, K0=K0, g_func=g_final,
        n_iter=inner_iter, damping=damping_inner
    )

    return g_values, populations, r, outer_history


def analyze_g_star(g_values, nodes):
    """Analyze the shape of the self-consistent g*."""
    backbone = tree.backbone_in_tree(nodes)

    print(f"\n  g* along Fibonacci backbone:")
    print(f"  {'lvl':>3s}  {'p/q':>8s}  {'g*(p/q)':>12s}  {'ln(g*)':>10s}")
    print("  " + "-" * 40)

    g_backbone = []
    for lvl, f in backbone:
        g = g_values.get(f, 0)
        ln_g = f"{math.log(g):.4f}" if g > 0 else "-inf"
        print(f"  {lvl:3d}  {str(f):>8s}  {g:12.6e}  {ln_g:>10s}")
        if g > 0:
            g_backbone.append((lvl, g))

    # Is g* flat? Measure slope
    if len(g_backbone) >= 3:
        levels = [x[0] for x in g_backbone]
        ln_gs = [math.log(x[1]) for x in g_backbone]
        n = len(levels)
        mx = sum(levels) / n
        my = sum(ln_gs) / n
        vx = sum((x - mx) ** 2 for x in levels) / n
        if vx > 0:
            cov = sum((x - mx) * (y - my) for x, y in zip(levels, ln_gs)) / n
            slope = cov / vx
            print(f"\n  g* slope along backbone: {slope:.6f} per level")
            if abs(slope) < 0.01:
                print(f"  g* is FLAT → self-consistent g* = uniform")
            else:
                print(f"  g* is NOT flat → self-consistent g* has structure")
            return slope
    return None


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 80)
    print("  SELF-CONSISTENT g*: the second fixed point")
    print("  Does the frequency distribution determine itself?")
    print("=" * 80)

    DEPTH = 9  # balance speed vs resolution
    nodes = tree.build(DEPTH)
    backbone = tree.backbone_in_tree(nodes)
    print(f"\n  Tree: depth={DEPTH}, nodes={len(nodes)}, "
          f"backbone levels={len(backbone)}")

    print(f"\n{'─' * 80}")
    print("  OUTER LOOP: g_{n+1} = h(g_n)")
    print(f"{'─' * 80}")

    g_star, populations, r, history = solve_self_consistent_g(
        nodes, K0=1.0, outer_iter=60, inner_iter=300,
        damping_inner=0.3, damping_outer=0.3
    )

    print(f"\n  {'iter':>4s}  {'Δg':>12s}  {'|r|':>10s}")
    print("  " + "-" * 30)
    for it, delta, r_abs in history[::5]:
        print(f"  {it:4d}  {delta:12.6e}  {r_abs:10.6f}")
    it, delta, r_abs = history[-1]
    print(f"  {it:4d}  {delta:12.6e}  {r_abs:10.6f}  ← final")

    converged = delta < 1e-6
    print(f"\n  Converged: {'YES' if converged else 'NO'} (Δg = {delta:.2e})")
    print(f"  Fixed point |r| = {abs(r):.6f}")

    # Analyze g*
    print(f"\n{'─' * 80}")
    print("  SHAPE OF g*")
    print(f"{'─' * 80}")

    g_slope = analyze_g_star(g_star, nodes)

    # Now check: does g* produce the right n_s?
    print(f"\n{'─' * 80}")
    print("  POWER SPECTRUM WITH g*")
    print(f"{'─' * 80}")

    n_pivot = backbone[len(backbone) // 2][0]
    spectrum, n_s_ext, d_slope_all, d_slope_asym = observables.power_spectrum(
        populations, n_pivot_level=n_pivot
    )

    n_s_phys = observables.physical_n_s(d_slope_asym)

    print(f"\n  Density slope (all):  {d_slope_all:.6f}" if d_slope_all else "")
    print(f"  Density slope (asym): {d_slope_asym:.6f}" if d_slope_asym else "")
    print(f"  n_s (physical):       {n_s_phys:.6f}")
    print(f"  n_s (Planck):         {N_S}")
    print(f"  Delta:                {n_s_phys - N_S:+.6f}")

    # Verdict
    print(f"\n{'=' * 80}")
    print("  VERDICT")
    print(f"{'=' * 80}")

    if converged and abs(n_s_phys - N_S) < 0.02:
        print(f"""
  g* EXISTS and CONVERGES.

  The frequency distribution is NOT a free input.
  It is the unique self-consistent solution to both fixed-point conditions:

    Level 1: N* = f(N*; g*)     (populations, D11)
    Level 2: g* = h(g*)         (distribution itself)

  Physical n_s = {n_s_phys:.4f} vs Planck {N_S} (Δ = {n_s_phys - N_S:+.4f})

  Zero free parameters. Zero free functions.
  The theory determines itself completely.
""")
    elif converged:
        print(f"""
  g* EXISTS and CONVERGES, but n_s = {n_s_phys:.4f} (Planck: {N_S}).

  The self-consistent distribution exists but the spectral index
  has a residual Δ = {n_s_phys - N_S:+.4f}. This may be a finite-depth
  artifact (d={DEPTH}) or a genuine prediction.
""")
    else:
        print(f"""
  g* did NOT converge after {len(history)} outer iterations (Δg = {delta:.2e}).

  Possible interpretations:
    1. The outer loop needs more iterations or different damping
    2. g* is not unique (multiple self-consistent distributions exist)
    3. g(ω) is genuinely free (the universe has initial conditions)
""")
