"""Rational field equation solver.

    N(p/q) = N_total * g(p/q) * w(p/q, K0 * |r|)

Iterates to fixed point. Returns populations, order parameter, history.
"""

import math
from . import tongues


def solve(tree, K0, g_func, n_iter=400, width_func=None, damping=0.3):
    """Solve the rational field equation by damped fixed-point iteration.

    Parameters:
        tree: list of Fraction — Stern-Brocot nodes
        K0: bare coupling strength
        g_func: callable(float) -> float — frequency distribution
        n_iter: max iterations
        width_func: callable(p, q, K) -> float — tongue width function
                    (default: tongues.width)
        damping: mixing weight for new values (0 = no update, 1 = no damping)

    Returns:
        populations: dict {Fraction: float}
        r: complex order parameter at fixed point
        history: list of |r| at each iteration
    """
    if width_func is None:
        width_func = tongues.width

    N_total = len(tree)
    populations = {f: 1.0 for f in tree}
    history = []

    for _ in range(n_iter):
        # Order parameter
        pop_sum = sum(populations.values())
        r = sum(populations[f] * math.e ** (2j * math.pi * float(f))
                for f in tree) / pop_sum
        r_abs = abs(r)
        history.append(r_abs)

        K_eff = K0 * max(r_abs, 1e-15)

        # Update
        new_pop = {}
        for f in tree:
            p, q = f.numerator, f.denominator
            w = width_func(p, q, K_eff)
            new_pop[f] = N_total * g_func(float(f)) * w

        # Normalize
        total = sum(new_pop.values())
        if total > 0:
            scale = N_total / total
            new_pop = {f: v * scale for f, v in new_pop.items()}

        # Damped update: mix old and new
        populations = {f: (1 - damping) * populations[f] + damping * new_pop.get(f, 0)
                       for f in tree}

    # Final order parameter
    pop_sum = sum(populations.values())
    r = sum(populations[f] * math.e ** (2j * math.pi * float(f))
            for f in tree) / pop_sum

    return populations, r, history


# ── Frequency distributions ──────────────────────────────────────────────────

def g_uniform(omega):
    """Flat frequency distribution."""
    return 1.0


def g_golden(omega, sigma=10.0):
    """Gaussian peaked at 1/phi."""
    from .constants import INV_PHI
    return math.exp(-sigma * (omega - INV_PHI) ** 2)
