"""Arnold tongue width computation across all coupling regimes."""

import math


def circle_map_step(theta, omega, K):
    """One iteration of the standard circle map."""
    return theta + omega - K / (2 * math.pi) * math.sin(2 * math.pi * theta)


def winding_number(omega, K, n_transient=2000, n_measure=8000):
    """Compute the winding number W for given (Omega, K)."""
    theta = 0.0
    for _ in range(n_transient):
        theta = circle_map_step(theta, omega, K)
    start = theta
    for _ in range(n_measure):
        theta = circle_map_step(theta, omega, K)
    return (theta - start) / n_measure


def width_perturbative(p, q, K):
    """Perturbative tongue width: valid at small K."""
    if q == 1:
        return K / (2 * math.pi)
    return 2 * (K / 2) ** q / q


def width_critical(p, q):
    """Tongue width at K=1: scales as 1/q^2."""
    if q == 1:
        return 1.0 / (2 * math.pi)
    return 1.0 / (q * q)


def width(p, q, K):
    """Tongue width interpolating between perturbative and critical.

    - K < 0.5: perturbative formula
    - K >= 1.0: critical (1/q^2) formula
    - 0.5 <= K < 1.0: smoothstep interpolation
    """
    if q == 1:
        return min(K / (2 * math.pi), 1.0)
    if K <= 0.5:
        return width_perturbative(p, q, K)
    if K >= 1.0:
        return width_critical(p, q)
    t = (K - 0.5) / 0.5
    t = t * t * (3 - 2 * t)  # smoothstep
    return width_perturbative(p, q, K) * (1 - t) + width_critical(p, q) * t


def width_numerical(p, q, K):
    """Measure tongue width by bisection on the actual circle map."""
    target = p / q
    half_window = max(3.0 / (q * q), 0.005)

    W_center = winding_number(target, K)
    if abs(W_center - target) > 1e-6:
        return 0.0

    lo, hi = target - half_window, target
    for _ in range(40):
        mid = (lo + hi) / 2
        if abs(winding_number(mid, K) - target) < 1e-7:
            hi = mid
        else:
            lo = mid
    left = (lo + hi) / 2

    lo, hi = target, target + half_window
    for _ in range(40):
        mid = (lo + hi) / 2
        if abs(winding_number(mid, K) - target) < 1e-7:
            lo = mid
        else:
            hi = mid
    right = (lo + hi) / 2

    return max(right - left, 0.0)
