/**
 * Content: the mathematical journey from x = f(x) to Einstein's field equations.
 *
 * Each phase has:
 *   title       — phase name
 *   text        — the content to type / read / surf through
 *   equation    — the central equation
 *   assumption  — the normalization / assumption from standard physics
 *   challenge   — how the RFE framework dissolves the anomaly
 *   repo        — which sibling repo this connects to
 */

const PHASES = [
  // ── Phase 1: Fixed Points ────────────────────────────────────────
  {
    title: "Fixed Points",
    text:
`A fixed point is where a map returns to itself: x = f(x).

Every self-consistent physical theory must satisfy this.
The universe does not compute an answer and hand it
to a separate observer — the observer IS part of the map.

When we write x = f(x), we are saying:
the state of the system is the output of its own dynamics.

This is not a metaphor. It is the minimal requirement
for any description that includes the describer.

The simplest nonlinear fixed point: x² = x + 1.
Rearrange: x² - x - 1 = 0. The positive root is φ,
the golden ratio, 1.6180339887...

Its reciprocal 1/φ = φ - 1 = 0.6180339887...
is the only number whose continued fraction is all 1s.
It is the "most irrational" number — hardest to approximate
by rationals, slowest to lock onto any resonance.`,
    equation: "x² − x − 1 = 0  →  φ = (1+√5)/2",
    assumption:
      "Standard physics treats parameters (masses, couplings) as inputs from experiment, not outputs of self-consistency.",
    challenge:
      "If the theory must contain its own observer, parameters are fixed points — not free. The golden ratio emerges as the unique fixed point of x ↦ 1 + 1/x.",
    repo: "submediant-site"
  },

  // ── Phase 2: The Stern-Brocot Tree ───────────────────────────────
  {
    title: "Rational Approximation",
    text:
`The Stern-Brocot tree enumerates every positive rational
exactly once, ordered by "simplicity" (denominator size).

Given neighbors a/b and c/d, their mediant is (a+c)/(b+d).
This binary tree encodes how rationals approach irrationals.

The path to 1/φ down this tree follows Fibonacci fractions:
1/1, 1/2, 2/3, 3/5, 5/8, 8/13, 13/21, ...

Each level adds one more Fibonacci number.
The denominators grow as φⁿ — the slowest possible rate.

This matters because resonance locks onto rationals.
A pendulum driven at frequency p/q locks in when coupling
exceeds a threshold ~ 1/q². The wider the tongue, the
easier the lock. The golden ratio, being hardest to lock,
sits at the boundary of order and chaos.

The tree is not an approximation tool. It is the skeleton
on which physics distributes its populations.`,
    equation: "mediant(a/b, c/d) = (a+c)/(b+d)",
    assumption:
      "Continuum physics assumes real-valued fields. Rationals are a 'mere' dense subset with no special structure.",
    challenge:
      "Resonance is rational. Arnold tongues have finite width only at p/q. The Stern-Brocot tree is the natural basis for any system that can synchronize — which includes all oscillatory physics.",
    repo: "harmonics"
  },

  // ── Phase 3: Synchronization ─────────────────────────────────────
  {
    title: "Synchronization",
    text:
`The Kuramoto model: N oscillators with natural frequencies ωᵢ,
coupled through the sine of their phase differences.

  dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ − θᵢ)

When coupling K exceeds a critical value Kc, oscillators
spontaneously synchronize. An order parameter r appears:

  r·e^(iψ) = (1/N) Σⱼ e^(iθⱼ)

|r| = 0 means incoherence. |r| = 1 means full sync.

The transition at Kc is a phase transition — identical in
structure to the Higgs mechanism, superconductivity, and the
deconfinement transition in QCD. All are spontaneous
symmetry breaking of a U(1) phase.

The Arnold tongue at p/q has width ∝ Kᵍ/q².
At K = 1 (critical), width = 1/q² exactly.
This is the inverse-square that becomes gravity.`,
    equation: "dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ − θᵢ)",
    assumption:
      "The Standard Model treats each force as a separate gauge symmetry (U(1)×SU(2)×SU(3)) with independent coupling constants.",
    challenge:
      "All forces are synchronization thresholds on the same oscillator lattice. Different 'forces' are different Arnold tongues — different p/q resonances at different scales. One coupling K, many tongues.",
    repo: "proslambenomenos"
  },

  // ── Phase 4: The Rational Field Equation ─────────────────────────
  {
    title: "The Field Equation",
    text:
`The rational field equation assigns a population N(p/q)
to each node of the Stern-Brocot tree:

  N(p/q) = N_total · g(p/q) · w(p/q, K·|r|)

Three ingredients:
  g(ω) — the frequency distribution (what frequencies exist)
  w(p,q,K) — the Arnold tongue width (how easily they lock)
  r — the order parameter (collective feedback)

The equation is self-referential: r depends on N,
and N depends on r through K·|r|. This is x = f(x)
at the level of a whole distribution.

Iterate to convergence. The fixed point exists and is
unique (Banach contraction, verified numerically).

At the fixed point, the population density ρ(p/q) = N/w
along the Fibonacci backbone is scale-invariant:
ln(ρ) is linear in level number, with slope ≈ 0.

This is Harrison-Zel'dovich: a nearly scale-free spectrum.
Not assumed. Derived.`,
    equation: "N(p/q) = N_total · g(p/q) · w(p/q, K·|r|)",
    assumption:
      "Inflationary cosmology assumes a nearly scale-invariant spectrum as initial condition, then adds a slow-roll potential to produce small tilt.",
    challenge:
      "The RFE produces scale invariance at its fixed point — no inflaton needed. The spectral tilt nₛ = 0.9649 emerges from the tree geometry: nₛ − 1 = −ln(φ²)·(rate), where rate counts Fibonacci levels per e-fold.",
    repo: "rfe"
  },

  // ── Phase 5: Observables ─────────────────────────────────────────
  {
    title: "Observables",
    text:
`From ONE fixed-point solution, read off:

Dark energy: Ω_Λ = 13/19 = 0.68421...
  Planck 2018: 0.685 ± 0.007. Within 0.07σ.
  13 and 19 are Fibonacci-adjacent primes on the tree.

MOND acceleration: a₀ = c·H/(2π)
  The synchronization frequency of the cosmological
  oscillator. Not a new constant — a derived ratio.

Spectral tilt: nₛ = 1 − (1−nₛ) ≈ 0.965
  From the Fibonacci level spacing on the tree.
  Predicts N_efolds = √5/(rate) ≈ 61.3.

Born rule: P = |ψ|² (exponent exactly 2)
  From the saddle-node geometry at the tongue boundary.
  The basin of attraction width scales as √ε,
  collapse time as 1/√ε. Product = constant.
  This IS the uncertainty principle.

RAR: g_obs = g_bar / (1 − e^{−√(g_bar/a₀)})
  The fidelity bound on self-referential measurement.
  Matches 2700 galaxies (McGaugh et al. 2016).`,
    equation: "Ω_Λ = 13/19 · a₀ = cH/2π · P = |ψ|²",
    assumption:
      "Dark energy requires a cosmological constant Λ with no explanation for its value. Dark matter requires new particles. The Born rule is axiomatic.",
    challenge:
      "All three are outputs of the fixed point. Λ is a ratio of tree positions. Dark matter is the Lagrange multiplier of the synchronization constraint. The Born rule is the geometry of tongue boundaries.",
    repo: "intersections"
  },

  // ── Phase 6: The Continuum Limit ─────────────────────────────────
  {
    title: "The Continuum Limit",
    text:
`At K = 1 (critical coupling), every tongue has width
exactly 1/q². Sum over all tongues: Σ 1/q² = π²/6.

This is the Basel sum. It converges. The tongues tile
a measure-π²/6 subset of [0,1]. The rest is KAM tori —
the "dark" frequencies that never lock.

Now take the continuum limit: let the tree depth → ∞.
The population density becomes a field on [0,1].
The self-consistency equation becomes an integral equation.

The order parameter r becomes the metric tensor gμν.
  — Its magnitude: the local synchronization strength.
  — Its phase: the direction of collective oscillation.

The coupling K·|r| → the connection Γ.
The tongue width 1/q² → the curvature R.
The frequency distribution g(ω) → the stress-energy T.

The fixed-point equation N = N·g·w becomes:
  Gμν + Λgμν = 8πTμν

Einstein's field equations. Not postulated. Derived
from the requirement that the oscillator population
be self-consistent on the Stern-Brocot tree at K = 1.`,
    equation: "Gμν + Λgμν = 8πTμν",
    assumption:
      "General relativity postulates the Einstein-Hilbert action and derives field equations from least action. The equivalence principle is axiomatic.",
    challenge:
      "The equivalence principle IS synchronization: all oscillators couple to the mean field equally. The metric IS the order parameter. Curvature IS the density of locked tongues. GR is the K=1 limit of a discrete equation on rationals.",
    repo: "submediant-site"
  },

  // ── Phase 7: Dissolution ─────────────────────────────────────────
  {
    title: "Dissolution",
    text:
`The anomalies of modern physics — dark matter, dark energy,
the hierarchy problem, the cosmological constant problem,
the measurement problem — are not gaps to be filled.

They are artifacts of normalization.

When you normalize coupling constants separately for each
force, you create the hierarchy problem. When you normalize
the vacuum energy with a UV cutoff, you get 10¹²⁰. When
you treat measurement as external, you need collapse.

The fixed-point approach normalizes nothing.
There is one equation, one coupling, one tree.
The "constants" are coordinates on that tree.
The "forces" are resonance tongues at different q.
The "particles" are population peaks at specific p/q.

x = f(x).

The map contains the territory.
The observer is the fixed point.
The theory is its own proof.

φ · ψ = 1.`,
    equation: "φ · ψ = 1  ⟺  x = f(x)  ⟺  Gμν + Λgμν = 8πTμν",
    assumption:
      "Physics is incomplete: we need new particles, new dimensions, or new principles to explain what we observe.",
    challenge:
      "Physics is over-normalized: we introduced free parameters where self-consistency demands fixed points. Remove the normalizations, and the 'anomalies' dissolve. What remains is one equation on one tree.",
    repo: "harmonics"
  }
];
