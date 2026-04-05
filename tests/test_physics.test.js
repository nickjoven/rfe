/* Unit tests for docs/physics.js — uses node:test (no dependencies).
 * Run with: node --test tests/test_physics.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../docs/physics.js');

// ── constants ─────────────────────────────────────────────────────────────

test('PHI satisfies phi^2 = phi + 1', () => {
  assert.ok(Math.abs(P.PHI * P.PHI - P.PHI - 1) < 1e-12);
});

test('IPHI = 1/PHI = PHI - 1', () => {
  assert.ok(Math.abs(P.IPHI - (P.PHI - 1)) < 1e-12);
  assert.ok(Math.abs(P.IPHI * P.PHI - 1) < 1e-12);
});

// ── smoothstep ────────────────────────────────────────────────────────────

test('smoothstep clamps outside [0,1]', () => {
  assert.equal(P.smoothstep(-1), 0);
  assert.equal(P.smoothstep(2), 1);
});

test('smoothstep endpoints and midpoint', () => {
  assert.equal(P.smoothstep(0), 0);
  assert.equal(P.smoothstep(1), 1);
  assert.equal(P.smoothstep(0.5), 0.5);
});

test('smoothstep is monotonic', () => {
  let prev = -1;
  for (let i = 0; i <= 20; i++) {
    const v = P.smoothstep(i / 20);
    assert.ok(v >= prev, `not monotonic at ${i}`);
    prev = v;
  }
});

// ── cobwebIterate ─────────────────────────────────────────────────────────

test('cobweb from 1.0 converges to PHI', () => {
  const seq = P.cobwebIterate(1.0, 100);
  const final = seq[seq.length - 1];
  assert.ok(Math.abs(final - P.PHI) < 1e-6);
});

test('cobweb from 2.0 converges to PHI', () => {
  const seq = P.cobwebIterate(2.0, 100);
  const final = seq[seq.length - 1];
  assert.ok(Math.abs(final - P.PHI) < 1e-6);
});

test('cobweb from PHI stays at PHI (fixed point)', () => {
  const seq = P.cobwebIterate(P.PHI, 10);
  assert.ok(Math.abs(seq[seq.length - 1] - P.PHI) < 1e-9);
});

// ── contractionMap ────────────────────────────────────────────────────────

test('contractionMap fixed point is (1/phi, 1/phi)', () => {
  const fp = P.contractionMap(P.IPHI, P.IPHI);
  assert.ok(Math.abs(fp.x - P.IPHI) < 1e-10);
  assert.ok(Math.abs(fp.y - P.IPHI) < 1e-10);
});

test('contractionMap converges from arbitrary starting points', () => {
  const starts = [[0.1, 0.9], [1.4, 0.1], [0.5, 0.5], [1.0, 1.0]];
  for (const [x0, y0] of starts) {
    let x = x0, y = y0;
    for (let i = 0; i < 50; i++) {
      const next = P.contractionMap(x, y);
      x = next.x; y = next.y;
    }
    assert.ok(Math.abs(x - P.IPHI) < 1e-6, `x didn't converge from (${x0},${y0})`);
    assert.ok(Math.abs(y - P.IPHI) < 1e-6, `y didn't converge from (${x0},${y0})`);
  }
});

// ── mediant ───────────────────────────────────────────────────────────────

test('mediant(0/1, 1/1) = 1/2', () => {
  assert.deepEqual(P.mediant(0, 1, 1, 1), [1, 2]);
});

test('mediant(1/2, 1/1) = 2/3', () => {
  assert.deepEqual(P.mediant(1, 2, 1, 1), [2, 3]);
});

test('Fibonacci path via mediants approaches 1/phi', () => {
  // Fibonacci convergents to 1/phi via Stern-Brocot mediants
  let a = 0, b = 1, c = 1, d = 1;
  for (let i = 0; i < 20; i++) {
    const [p, q] = P.mediant(a, b, c, d);
    // alternate which boundary we replace
    if (i % 2 === 0) { a = p; b = q; } else { c = p; d = q; }
  }
  // the latest mediant should approximate 1/phi
  const [p, q] = P.mediant(a, b, c, d);
  assert.ok(Math.abs(p / q - P.IPHI) < 1e-6);
});

// ── tongue widths ─────────────────────────────────────────────────────────

test('tongueWidthCritical is 1/q^2', () => {
  assert.equal(P.tongueWidthCritical(1, 2), 0.25);
  assert.equal(P.tongueWidthCritical(1, 3), 1/9);
  assert.equal(P.tongueWidthCritical(2, 5), 1/25);
});

test('tongueWidth is zero at K=0 and matches critical at K=1', () => {
  assert.equal(P.tongueWidth(1, 3, 0), 0);
  assert.ok(Math.abs(P.tongueWidth(1, 3, 1) - 1/9) < 1e-12);
});

// ── orderParameter (Kuramoto) ─────────────────────────────────────────────

test('orderParameter of identical phases is r=1', () => {
  const thetas = [0.5, 0.5, 0.5, 0.5];
  const op = P.orderParameter(thetas);
  assert.ok(Math.abs(op.r - 1) < 1e-12);
});

test('orderParameter of uniformly distributed phases is r≈0', () => {
  const N = 100;
  const thetas = [];
  for (let i = 0; i < N; i++) thetas.push((i * 2 * Math.PI) / N);
  const op = P.orderParameter(thetas);
  assert.ok(op.r < 1e-10, `expected r≈0, got ${op.r}`);
});

test('orderParameter of two antipodal phases is r=0', () => {
  const op = P.orderParameter([0, Math.PI]);
  assert.ok(op.r < 1e-12);
});

test('orderParameter empty array returns r=0', () => {
  const op = P.orderParameter([]);
  assert.equal(op.r, 0);
});

// ── gravityMagnitude ──────────────────────────────────────────────────────

test('gravityMagnitude follows inverse square', () => {
  const g1 = P.gravityMagnitude(1, 1, 100);
  const g2 = P.gravityMagnitude(1, 2, 100);
  assert.ok(Math.abs(g1 / g2 - 4) < 1e-12); // 2x distance → 1/4 force
});

test('gravityMagnitude scales linearly with mass', () => {
  const g1 = P.gravityMagnitude(1, 5, 1);
  const g2 = P.gravityMagnitude(3, 5, 1);
  assert.ok(Math.abs(g2 / g1 - 3) < 1e-12);
});

test('gravityMagnitude returns 0 at zero distance', () => {
  assert.equal(P.gravityMagnitude(1, 0, 1), 0);
});

// ── fibonacci convergents ─────────────────────────────────────────────────

test('fibonacciConvergents starts with 1/1, 1/2, 2/3', () => {
  const conv = P.fibonacciConvergents(5);
  assert.deepEqual(conv[0], [1, 1]);
  assert.deepEqual(conv[1], [1, 2]);
  assert.deepEqual(conv[2], [2, 3]);
  assert.deepEqual(conv[3], [3, 5]);
  assert.deepEqual(conv[4], [5, 8]);
});

test('Fibonacci convergents approach 1/phi', () => {
  const conv = P.fibonacciConvergents(20);
  const last = conv[conv.length - 1];
  assert.ok(Math.abs(last[0] / last[1] - P.IPHI) < 1e-6);
});

// ── Basel sum ─────────────────────────────────────────────────────────────

test('baselPartialSum approaches pi^2/6', () => {
  const target = Math.PI * Math.PI / 6;
  const s100 = P.baselPartialSum(100);
  const s10000 = P.baselPartialSum(10000);
  assert.ok(s10000 > s100);
  assert.ok(s10000 < target);
  assert.ok(Math.abs(s10000 - target) < 1e-3);
});

test('baselPartialSum(1) = 1', () => {
  assert.equal(P.baselPartialSum(1), 1);
});
