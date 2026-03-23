"""Stern-Brocot tree construction and navigation."""

from fractions import Fraction
from .constants import PHI


def build(depth):
    """Build the Stern-Brocot tree on (0,1) to given depth.

    Returns sorted list of Fraction objects (interior nodes only).
    """
    fracs = [Fraction(0, 1), Fraction(1, 1)]
    for _ in range(depth):
        new = [fracs[0]]
        for i in range(len(fracs) - 1):
            a, b = fracs[i], fracs[i + 1]
            med = Fraction(a.numerator + b.numerator,
                           a.denominator + b.denominator)
            new.append(med)
            new.append(b)
        fracs = new
    return sorted(f for f in set(fracs) if Fraction(0) < f < Fraction(1))


def fibonacci_backbone(max_level=25):
    """Return Fibonacci convergents F_n/F_{n+1} to 1/phi.

    Returns list of (level, Fraction) pairs.
    """
    fibs = [1, 1]
    for _ in range(max_level):
        fibs.append(fibs[-1] + fibs[-2])
    return [(i, Fraction(fibs[i], fibs[i + 1]))
            for i in range(1, len(fibs) - 1)]


def backbone_in_tree(tree_nodes, max_level=25):
    """Return only the backbone convergents present in the tree."""
    tree_set = set(tree_nodes)
    return [(lvl, f) for lvl, f in fibonacci_backbone(max_level)
            if f in tree_set]
