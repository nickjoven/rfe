"""Extract physical observables from the field equation solution.

All observables come from one population distribution N(p/q).
"""

import math
from fractions import Fraction
from .constants import (
    PHI, INV_PHI, PHI_SQ, LN_PHI_SQ,
    N_S, A_S, K_PIVOT, RATE,
    C_LIGHT, H0_SI, OMEGA_LAMBDA, A0_LOCAL,
)
from . import tongues, tree


# ── CMB power spectrum ───────────────────────────────────────────────────────

def power_spectrum(populations, n_pivot_level=5):
    """Extract P(k) from the population distribution.

    Returns:
        spectrum: list of dicts with keys
            k, P_field, P_planck, level, omega, density
        n_s_extracted: spectral index from linear fit
        density_slope: slope of ln(density) per Fibonacci level
    """
    backbone = tree.fibonacci_backbone(25)
    rows = []

    for level, f in backbone:
        if f not in populations or populations[f] <= 0:
            continue
        q = f.denominator
        w = tongues.width_critical(f.numerator, q)
        density = populations[f] / w if w > 0 else 0
        rows.append(dict(level=level, frac=f, pop=populations[f],
                         w=w, density=density, omega=float(f)))

    if len(rows) < 3:
        return [], None, None

    # Normalize: pivot density = A_s
    pivot_idx = min(range(len(rows)),
                    key=lambda j: abs(rows[j]["level"] - n_pivot_level))
    pivot_d = rows[pivot_idx]["density"]
    norm = A_S / pivot_d if pivot_d > 0 else 1

    spectrum = []
    ln_P, ln_k = [], []
    levels, ln_dens = [], []

    for r in rows:
        dn = r["level"] - n_pivot_level
        k = K_PIVOT * math.exp(dn / RATE)
        P_f = r["density"] * norm
        P_p = A_S * (k / K_PIVOT) ** (N_S - 1)

        spectrum.append(dict(
            k=k, P_field=P_f, P_planck=P_p,
            level=r["level"], omega=r["omega"],
        ))

        if P_f > 0:
            ln_P.append(math.log(P_f))
            ln_k.append(math.log(k))
        if r["density"] > 0:
            levels.append(r["level"])
            ln_dens.append(math.log(r["density"]))

    n_s_extracted = _slope(ln_k, ln_P, offset=1)
    density_slope = _slope(levels, ln_dens)

    # Asymptotic slope: use only levels where density has converged
    # (last 2/3 of levels, excluding the non-self-similar shallow region)
    cutoff = len(levels) // 3
    asym_slope = _slope(levels[cutoff:], ln_dens[cutoff:]) if len(levels) > 3 else density_slope

    return spectrum, n_s_extracted, density_slope, asym_slope


def _slope(xs, ys, offset=0):
    """Linear regression slope, optionally offset for n_s = 1 + slope."""
    n = len(xs)
    if n < 3:
        return None
    mx = sum(xs) / n
    my = sum(ys) / n
    vx = sum((x - mx) ** 2 for x in xs) / n
    if vx < 1e-30:
        return None
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / n
    return offset + cov / vx


def physical_n_s(density_slope):
    """Compute physical n_s from density slope + mapping tilt."""
    ds = density_slope or 0
    return 1 + ds * LN_PHI_SQ + (N_S - 1)


# ── MOND acceleration scale ─────────────────────────────────────────────────

def H_of_z(z):
    """Hubble parameter H(z) in s^{-1} for flat LCDM."""
    return H0_SI * math.sqrt(OMEGA_LAMBDA + (1 - OMEGA_LAMBDA) * (1 + z) ** 3)


def a0_of_z(z):
    """MOND acceleration scale a0(z) = c * H(z) / (2 * pi)."""
    return C_LIGHT * H_of_z(z) / (2 * math.pi)


def a0_table(z_values=None):
    """Compute a0(z) for a range of redshifts.

    Returns list of dicts with z, H, a0, a0_ratio (to local).
    """
    if z_values is None:
        z_values = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 6.0]
    return [dict(
        z=z, H=H_of_z(z), a0=a0_of_z(z),
        a0_ratio=a0_of_z(z) / A0_LOCAL,
    ) for z in z_values]


# ── RAR interpolating function (Derivation 9) ───────────────────────────────

def rar(g_bar, a0=None):
    """Radial acceleration relation from fidelity bound.

    g_obs = g_bar / (1 - exp(-sqrt(g_bar / a0)))

    Derived from self-referential frequency measurement (Derivation 9).
    """
    if a0 is None:
        a0 = A0_LOCAL
    x = math.sqrt(g_bar / a0) if g_bar > 0 else 0
    return g_bar / (1 - math.exp(-x)) if x > 1e-10 else g_bar + a0 / 2


# ── Collapse dynamics (Derivation 7) ────────────────────────────────────────

def collapse_duration(epsilon, K=1.0):
    """Collapse duration tau ~ 1/sqrt(epsilon) from Floquet convergence."""
    if epsilon <= 0:
        return float('inf')
    return 1.0 / math.sqrt(epsilon * K)


def basin_width(epsilon):
    """Born rule basin width Delta_theta ~ sqrt(epsilon)."""
    return math.sqrt(max(epsilon, 0))


def uncertainty_product(epsilon, K=1.0):
    """tau * Delta_theta = const (from Cassini / |phi*psi| = 1)."""
    return collapse_duration(epsilon, K) * basin_width(epsilon)


# ── N_efolds prediction ─────────────────────────────────────────────────────

def n_efolds(n_s=N_S):
    """N_efolds = sqrt(5) / rate, where rate = (1 - n_s) / ln(phi^2)."""
    rate = (1 - n_s) / LN_PHI_SQ
    return math.sqrt(5) / rate if rate > 0 else float('inf')
