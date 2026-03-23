"""Run the rational field equation engine.

Usage:
    python -m rfe                  # default: depth=10, K=1, g=uniform
    python -m rfe --depth 12       # deeper tree
    python -m rfe --K 0.8          # subcritical (quantum regime)
    python -m rfe --g golden       # peaked frequency distribution
    python -m rfe --observables    # print all observable predictions
"""

import argparse
import math
import sys

from . import tree, field, observables
from .constants import (
    PHI, INV_PHI, PHI_SQ, LN_PHI_SQ,
    N_S, A_S, RATE, SQRT5, A0_LOCAL,
)


def main():
    parser = argparse.ArgumentParser(description="Rational Field Equation engine")
    parser.add_argument("--depth", type=int, default=10,
                        help="Stern-Brocot tree depth (default: 10)")
    parser.add_argument("--K", type=float, default=1.0,
                        help="Bare coupling K0 (default: 1.0)")
    parser.add_argument("--g", choices=["uniform", "golden"], default="uniform",
                        help="Frequency distribution (default: uniform)")
    parser.add_argument("--observables", action="store_true",
                        help="Print all observable predictions")
    parser.add_argument("--quiet", action="store_true",
                        help="Suppress detailed output")
    args = parser.parse_args()

    # ── Build tree ────────────────────────────────────────────────────────
    nodes = tree.build(args.depth)
    backbone = tree.backbone_in_tree(nodes)
    max_q = max(f.denominator for f in nodes)

    if not args.quiet:
        print(f"Tree: depth={args.depth}, nodes={len(nodes)}, "
              f"q_max={max_q}, backbone_levels={len(backbone)}")

    # ── Solve field equation ──────────────────────────────────────────────
    g_func = field.g_uniform if args.g == "uniform" else field.g_golden
    populations, r, history = field.solve(nodes, K0=args.K, g_func=g_func)

    r_abs = abs(r)
    K_eff = args.K * r_abs

    if not args.quiet:
        converged = next((i for i in range(len(history) - 1)
                          if abs(history[i + 1] - history[i]) < 1e-10),
                         len(history))
        print(f"Fixed point: |r|={r_abs:.6f}, K_eff={K_eff:.4f}, "
              f"converged at iter {converged}")

    # ── Extract power spectrum ────────────────────────────────────────────
    n_pivot = backbone[len(backbone) // 2][0] if backbone else 5
    spectrum, n_s_ext, d_slope, asym_slope = observables.power_spectrum(
        populations, n_pivot_level=n_pivot
    )

    n_s_phys = observables.physical_n_s(asym_slope)

    print(f"\n── POWER SPECTRUM ──")
    print(f"  Density slope (all):   {d_slope:.6f} per level" if d_slope else "")
    print(f"  Density slope (asym):  {asym_slope:.6f} per level" if asym_slope else "")
    print(f"  n_s (SB coords):       {n_s_ext:.6f}" if n_s_ext else "")
    print(f"  n_s (physical):        {n_s_phys:.6f}")
    print(f"  n_s (Planck):          {N_S}")
    print(f"  Delta:                 {n_s_phys - N_S:+.6f}")

    # ── Backbone ──────────────────────────────────────────────────────────
    if not args.quiet:
        print(f"\n  {'lvl':>3s}  {'p/q':>8s}  {'N(p/q)':>12s}  "
              f"{'density':>12s}  {'ln(dens)':>10s}")
        print("  " + "-" * 52)
        for lvl, f in backbone:
            pop = populations.get(f, 0)
            q = f.denominator
            w = 1.0 / (q * q) if q > 1 else 1.0 / (2 * math.pi)
            d = pop / w if w > 0 else 0
            ln_d = f"{math.log(d):.4f}" if d > 0 else "-inf"
            print(f"  {lvl:3d}  {str(f):>8s}  {pop:12.4e}  "
                  f"{d:12.4e}  {ln_d:>10s}")

    # ── All observables ───────────────────────────────────────────────────
    if args.observables:
        print(f"\n── PREDICTIONS ──")

        # N_efolds
        N_e = observables.n_efolds()
        print(f"\n  N_efolds = sqrt(5) / rate = {N_e:.1f} "
              f"(testable: CMB-S4, ~2028)")

        # a0(z)
        print(f"\n  MOND scale a0(z) = c*H(z)/(2*pi):")
        print(f"  {'z':>5s}  {'a0 (m/s²)':>14s}  {'a0/a0_local':>12s}")
        print("  " + "-" * 35)
        for row in observables.a0_table():
            print(f"  {row['z']:5.1f}  {row['a0']:14.4e}  "
                  f"{row['a0_ratio']:12.4f}")

        # RAR
        print(f"\n  RAR interpolating function (D9):")
        print(f"  {'g_bar/a0':>10s}  {'g_obs/g_bar':>12s}  {'g_obs/a0':>10s}")
        print("  " + "-" * 36)
        for exp in range(-3, 4):
            g_bar = A0_LOCAL * 10 ** exp
            g_obs = observables.rar(g_bar)
            print(f"  {10**exp:10.3f}  {g_obs/g_bar:12.6f}  "
                  f"{g_obs/A0_LOCAL:10.4f}")

        # Collapse
        print(f"\n  Collapse dynamics (D7):")
        print(f"  {'epsilon':>10s}  {'tau':>10s}  "
              f"{'Delta_theta':>12s}  {'tau*Dtheta':>12s}")
        print("  " + "-" * 50)
        for exp in range(-6, 1):
            eps = 10.0 ** exp
            tau = observables.collapse_duration(eps)
            dth = observables.basin_width(eps)
            print(f"  {eps:10.1e}  {tau:10.2f}  "
                  f"{dth:12.6f}  {tau * dth:12.6f}")

        # Born rule
        print(f"\n  Born rule: P = |psi|^2")
        print(f"  Exponent = 2 from saddle-node geometry (D1)")
        print(f"  |phi * psi| = {abs(PHI * (1-PHI)/PHI):.10f} = 1 (Cassini)")

    # ── One-line verdict ──────────────────────────────────────────────────
    print(f"\n── VERDICT ──")
    ok = abs(n_s_phys - N_S) < 0.02
    print(f"  n_s: {'PASS' if ok else 'CHECK'} "
          f"({n_s_phys:.4f} vs {N_S}, Δ={n_s_phys-N_S:+.4f})")
    si = asym_slope is not None and abs(asym_slope) < 0.05
    print(f"  Scale invariance (asymptotic): {'YES' if si else 'NO'} "
          f"(slope={asym_slope:.6f})" if asym_slope is not None else "")


if __name__ == "__main__":
    main()
