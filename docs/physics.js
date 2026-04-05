/* ── Physics: pure math helpers ─────────────────────────────────────────────
 *  Shared by game modes. Works in both browser (window.Physics) and
 *  Node (module.exports) so the same code runs in unit tests.
 *  No rendering, no state — pure functions only.
 * ────────────────────────────────────────────────────────────────────────── */

(function(global) {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;    // 1.6180339887...
  var IPHI = PHI - 1;                   // 1/phi = 0.6180339887...

  // Smooth Hermite interpolation, clamped to [0,1]
  function smoothstep(x) {
    x = Math.max(0, Math.min(1, x));
    return x * x * (3 - 2 * x);
  }

  // Fixed-point iteration: x -> 1 + 1/x converges to PHI.
  // Returns the sequence [x0, x1, x2, ...].
  function cobwebIterate(x0, maxIter, eps) {
    maxIter = maxIter || 50;
    eps = eps || 1e-9;
    var x = x0, seq = [x0];
    for (var i = 0; i < maxIter; i++) {
      if (x === 0) break;
      x = 1 + 1 / x;
      seq.push(x);
      if (Math.abs(x - PHI) < eps) break;
    }
    return seq;
  }

  // 2D Banach contraction mapping with fixed point (1/phi, 1/phi).
  // f(x,y) = (1/(1+y), 1/(1+x)) — each component is the golden-ratio
  // iteration x -> 1/(1+x) which has fixed point satisfying x^2+x-1=0.
  function contractionMap(x, y) {
    var dy = 1 + y, dx = 1 + x;
    if (Math.abs(dy) < 0.01) dy = 0.01;
    if (Math.abs(dx) < 0.01) dx = 0.01;
    return { x: 1 / dy, y: 1 / dx };
  }

  // Mediant of two fractions a/b and c/d: (a+c)/(b+d).
  function mediant(a, b, c, d) {
    return [a + c, b + d];
  }

  // Arnold tongue width at critical K=1: inverse-square in q.
  function tongueWidthCritical(p, q) {
    return 1 / (q * q);
  }

  // Tongue width as a function of K, interpolated via smoothstep.
  function tongueWidth(p, q, K) {
    return (1 / (q * q)) * smoothstep(K);
  }

  // Kuramoto order parameter from array of phases.
  // Returns { r: magnitude in [0,1], psi: mean phase }.
  function orderParameter(thetas) {
    var n = thetas.length;
    if (n === 0) return { r: 0, psi: 0 };
    var sc = 0, ss = 0;
    for (var i = 0; i < n; i++) {
      sc += Math.cos(thetas[i]);
      ss += Math.sin(thetas[i]);
    }
    return {
      r: Math.sqrt(sc * sc + ss * ss) / n,
      psi: Math.atan2(ss, sc),
    };
  }

  // Inverse-square gravity magnitude at distance d for a body of given mass.
  function gravityMagnitude(mass, distance, strength) {
    strength = strength != null ? strength : 1;
    if (distance <= 0) return 0;
    return strength * mass / (distance * distance);
  }

  // Fibonacci convergents to 1/phi: [1/1, 1/2, 2/3, 3/5, 5/8, ...].
  // Returns array of [p, q] pairs.
  function fibonacciConvergents(n) {
    var out = [], a = 1, b = 1;
    for (var i = 0; i < n; i++) {
      out.push([a, b]);
      var c = a + b; a = b; b = c;
    }
    return out;
  }

  // Basel-style partial sum: sum of 1/q^2 for q=1..N.
  // Limit is pi^2/6 ≈ 1.6449.
  function baselPartialSum(N) {
    var s = 0;
    for (var q = 1; q <= N; q++) s += 1 / (q * q);
    return s;
  }

  var Physics = {
    PHI: PHI,
    IPHI: IPHI,
    smoothstep: smoothstep,
    cobwebIterate: cobwebIterate,
    contractionMap: contractionMap,
    mediant: mediant,
    tongueWidthCritical: tongueWidthCritical,
    tongueWidth: tongueWidth,
    orderParameter: orderParameter,
    gravityMagnitude: gravityMagnitude,
    fibonacciConvergents: fibonacciConvergents,
    baselPartialSum: baselPartialSum,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Physics;
  } else {
    global.Physics = Physics;
  }
})(typeof window !== 'undefined' ? window : globalThis);
