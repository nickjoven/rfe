/* ── Field Lab: Gravity Assist, Convergence & Spectra ────────────────────────
 *  Mode 7. Interactive levels exploring fixed-point convergence,
 *  gravity-assist dynamics, wave spectra, and dimensional metaphors.
 *  Unlocks alongside Artemis (phase 7 reached or artemis aesthetic).
 * ────────────────────────────────────────────────────────────────────────── */

var fd = {};
var _fieldRAF = null;

var FIELD_LEVELS = [
  { title:"Cobweb to \u03c6",
    brief:"Choose x\u2080 and watch f(x)=1+1/x iterate to the golden ratio.\nThe wave function narrows as the fixed point emerges.",
    eq:"x\u00b2 \u2212 x \u2212 1 = 0  \u2192  \u03c6",
    adds:"CONVERGENCE \u2014 cobweb diagram + \u03c8\u00b2 probability density",
    hint:"Every orbit finds \u03c6. Click to choose where to begin." },
  { title:"Gravity Slingshot",
    brief:"Bodies sit at Stern-Brocot rationals.\nSlingshot through them to reach 1/\u03c6.",
    eq:"mediant(a/b, c/d) = (a+c)/(b+d)",
    adds:"GRAVITY ASSIST \u2014 \u0394v from each body ~ 1/q",
    hint:"Chain the convergents. Each rational bends your path." },
  { title:"Phase Lock Spectrum",
    brief:"Oscillators on a circle. Drag to set coupling K.\nWatch synchronization emerge in the frequency spectrum.",
    eq:"d\u03b8/dt = \u03c9 + K\u00b7sin(\u0394\u03b8)",
    adds:"SPECTRUM \u2014 real-time frequency distribution + order parameter",
    hint:"Increase K. Watch the spectrum collapse to a peak." },
  { title:"Contraction Mapping",
    brief:"Place points in phase space.\nWatch the Banach contraction spiral to x=f(x).",
    eq:"N(p/q) = N\u00b7g\u00b7w(K|r|)",
    adds:"ITERATION \u2014 phase-space trajectories showing contraction",
    hint:"Every starting point converges. The basin is the whole space." },
  { title:"Three Spectra",
    brief:"One coupling constant K. Three observable windows.\nFind the value where all three align.",
    eq:"\u03a9_\u039b = 13/19 \u00b7 a\u2080 = cH/2\u03c0 \u00b7 n\u209b = 0.965",
    adds:"MULTIPLICITY \u2014 power spectrum + rotation curve + Born rule",
    hint:"One parameter. Three windows. They agree at K = 1." },
  { title:"Tongue Navigation",
    brief:"Steer a wave packet between Arnold tongues as K rises.\nStay irrational \u2014 avoid resonance lock.",
    eq:"\u03a3 1/q\u00b2 = \u03c0\u00b2/6",
    adds:"TOPOLOGY \u2014 tongues grow, gaps shrink, only \u03c6 survives",
    hint:"The golden frequency is the last to lock." },
  { title:"Orbital Return",
    brief:"Chain gravity assists into a closed orbit.\nThe orbit that closes is \u03c6 \u00b7 \u03c8 = 1.",
    eq:"\u03c6 \u00b7 \u03c8 = 1",
    adds:"CURVATURE \u2014 wave-trail interference + orbital closure",
    hint:"The map contains the territory. Fire and return." },
];

/* ── constants ──────────────────────────────────────────────────────────── */
var PHI = (1 + Math.sqrt(5)) / 2;   // 1.618...
var IPHI = PHI - 1;                   // 1/phi = 0.618...


/* ── init ────────────────────────────────────────────────────────────────── */

function initField() {
  var $f = document.getElementById("field");
  $f.style.display = "block";
  var canvas = document.getElementById("field-canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = $f.clientWidth;
  canvas.height = $f.clientHeight;

  fd = {
    ctx: ctx, canvas: canvas,
    W: canvas.width, H: canvas.height,
    lvl: Math.min(currentPhase, 6),
    state: "intro", time: 0,
    // shared state containers — each level populates its own
    points: [], trails: [], targets: [],
    oscillators: [], probe: null,
    param: 0, paramTarget: 0,
    mouseX: 0, mouseY: 0,
    cleared: false,
  };

  setupFieldLevel();

  canvas.onmousemove = fieldMove;
  canvas.ontouchmove = function(e) { e.preventDefault(); fieldMove(e.touches[0]); };
  canvas.onmousedown = fieldDown;
  canvas.ontouchstart = function(e) { e.preventDefault(); fieldDown(e.touches[0]); };
  document.onkeydown = fieldKey;

  if (_fieldRAF) cancelAnimationFrame(_fieldRAF);
  fieldLoop();
}

function setupFieldLevel() {
  fd.points = []; fd.trails = []; fd.targets = [];
  fd.oscillators = []; fd.probe = null;
  fd.param = 0; fd.paramTarget = 0;
  fd.cleared = false; fd.time = 0;

  switch (fd.lvl) {
    case 0: setupCobweb(); break;
    case 1: setupSlingshot(); break;
    case 2: setupSpectrum(); break;
    case 3: setupContraction(); break;
    case 4: setupThreeSpectra(); break;
    case 5: setupTongues(); break;
    case 6: setupOrbital(); break;
  }
}

/* ── input ────────────────────────────────────────────────────────────────── */

function fieldMove(e) {
  var rect = fd.canvas.getBoundingClientRect();
  fd.mouseX = (e.clientX || e.pageX) - rect.left;
  fd.mouseY = (e.clientY || e.pageY) - rect.top;
}

function fieldDown(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (fd.state === "intro") { fd.state = "playing"; return; }
  if (fd.state === "cleared") {
    if (fd.time - fd.clearedAt < 120) return; // mandatory 2s pause
    if (fd.lvl < 6) advancePhase(); return;
  }

  switch (fd.lvl) {
    case 0: cobwebClick(); break;
    case 1: slingshotClick(); break;
    case 2: /* spectrum uses mouse position directly */ break;
    case 3: contractionClick(); break;
    case 4: /* three spectra uses mouse position */ break;
    case 5: /* tongue nav uses mouse position */ break;
    case 6: orbitalClick(); break;
  }
}

function fieldKey(e) {
  if (currentMode !== "field") return;
  if (fd.state === "intro" && (e.key === " " || e.key === "Enter"))
    { e.preventDefault(); fd.state = "playing"; return; }
  if (fd.state === "cleared" && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    if (fd.time - fd.clearedAt < 120) return; // mandatory 2s pause
    if (fd.lvl < 6) advancePhase(); return;
  }
  if (e.key === "Tab") { e.preventDefault(); advancePhase(); }
  if (e.key === "r" && fd.state === "playing") initField();
}

function fieldCleared() {
  fd.state = "cleared"; fd.cleared = true;
  fd.clearedAt = fd.time; // timestamp for pause timer
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 0: COBWEB TO φ
   Click to choose x₀. Watch f(x)=1+1/x iterate via cobweb diagram.
   Side panel shows |ψ(x)|² narrowing around φ as iterations proceed.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupCobweb() {
  fd.cobweb = {
    x0: null,          // starting value (set on click)
    iterates: [],      // sequence x0, x1, x2, ...
    cobwebPts: [],     // cobweb line segments for drawing
    maxIter: 30,
    animStep: 0,       // how many cobweb segments drawn so far
    animSpeed: 2,      // segments per frame
    converged: false,
    // plot bounds
    xMin: 0.3, xMax: 3.2, yMin: 0.3, yMax: 3.2,
  };
}

function cobwebClick() {
  var cw = fd.cobweb;
  var W = fd.W, H = fd.H;
  // map click X to x-value (left 70% is plot area)
  var plotW = W * 0.65;
  var x0 = cw.xMin + (fd.mouseX / plotW) * (cw.xMax - cw.xMin);
  if (x0 < 0.4 || x0 > 3.0) return; // out of range

  cw.x0 = x0;
  cw.iterates = [x0];
  cw.cobwebPts = [];
  cw.animStep = 0;
  cw.converged = false;

  // compute iteration
  var x = x0;
  for (var i = 0; i < cw.maxIter; i++) {
    var fx = 1 + 1 / x;
    // cobweb: vertical to curve, horizontal to y=x
    cw.cobwebPts.push({ x1: x, y1: x, x2: x, y2: fx });       // vertical
    cw.cobwebPts.push({ x1: x, y1: fx, x2: fx, y2: fx });      // horizontal
    cw.iterates.push(fx);
    x = fx;
    if (Math.abs(x - PHI) < 0.001) { cw.converged = true; break; }
  }
}

function drawCobweb(ctx, W, H) {
  var cw = fd.cobweb;
  var accent = _css("--accent"), dim = _css("--dim");
  var fg = _css("--fg"), ok = _css("--ok"), grid = _css("--grid");
  var font = _fontFace();
  var plotW = W * 0.65, plotH = H * 0.85;
  var plotX = 30, plotY = 30;

  // ── axes ──
  ctx.strokeStyle = dim; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY); ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  // helper: value → pixel
  function xPx(v) { return plotX + (v - cw.xMin) / (cw.xMax - cw.xMin) * plotW; }
  function yPx(v) { return plotY + plotH - (v - cw.yMin) / (cw.yMax - cw.yMin) * plotH; }

  // ── grid lines ──
  ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
  for (var g = Math.ceil(cw.xMin); g <= cw.xMax; g += 0.5) {
    ctx.beginPath(); ctx.moveTo(xPx(g), plotY); ctx.lineTo(xPx(g), plotY + plotH); ctx.stroke();
  }
  for (g = Math.ceil(cw.yMin); g <= cw.yMax; g += 0.5) {
    ctx.beginPath(); ctx.moveTo(plotX, yPx(g)); ctx.lineTo(plotX + plotW, yPx(g)); ctx.stroke();
  }

  // ── y = x line ──
  ctx.strokeStyle = dim; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xPx(cw.xMin), yPx(cw.xMin));
  ctx.lineTo(xPx(cw.xMax), yPx(cw.xMax)); ctx.stroke();
  ctx.setLineDash([]);

  // ── f(x) = 1 + 1/x curve ──
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.beginPath();
  var first = true;
  for (var xv = Math.max(cw.xMin, 0.35); xv <= cw.xMax; xv += 0.01) {
    var yv = 1 + 1 / xv;
    if (yv < cw.yMin || yv > cw.yMax) { first = true; continue; }
    if (first) { ctx.moveTo(xPx(xv), yPx(yv)); first = false; }
    else ctx.lineTo(xPx(xv), yPx(yv));
  }
  ctx.stroke();

  // ── fixed point marker ──
  ctx.fillStyle = ok; ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.arc(xPx(PHI), yPx(PHI), 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "left";
  ctx.fillText("\u03c6=" + PHI.toFixed(4), xPx(PHI) + 10, yPx(PHI) + 4);

  // ── cobweb animation ──
  if (cw.cobwebPts.length > 0) {
    // advance animation
    if (cw.animStep < cw.cobwebPts.length) {
      cw.animStep = Math.min(cw.animStep + cw.animSpeed, cw.cobwebPts.length);
    }
    var nDraw = Math.floor(cw.animStep);
    for (var i = 0; i < nDraw; i++) {
      var seg = cw.cobwebPts[i];
      var progress = i / cw.cobwebPts.length;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.3 + 0.7 * progress;
      ctx.lineWidth = 0.8 + progress;
      ctx.beginPath();
      ctx.moveTo(xPx(seg.x1), yPx(seg.y1));
      ctx.lineTo(xPx(seg.x2), yPx(seg.y2));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // check convergence for clear
    if (cw.converged && cw.animStep >= cw.cobwebPts.length && !fd.cleared) {
      fieldCleared();
    }
  }

  // ── axis labels ──
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("x", plotX + plotW / 2, plotY + plotH + 20);
  ctx.save(); ctx.translate(12, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2); ctx.fillText("f(x) = 1 + 1/x", 0, 0);
  ctx.restore();

  // ── wave function panel (right side) ──
  var waveX = plotX + plotW + 30, waveW = W - waveX - 20;
  var waveY = plotY, waveH = plotH;

  ctx.strokeStyle = dim; ctx.lineWidth = 0.5;
  ctx.strokeRect(waveX, waveY, waveW, waveH);
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("|\u03c8(x)|\u00b2", waveX + waveW / 2, waveY - 6);

  if (cw.iterates.length > 1) {
    // compute probability density from iterates so far
    var nVisible = Math.min(cw.iterates.length, Math.floor(cw.animStep / 2) + 1);
    var bins = 40;
    var counts = new Array(bins).fill(0);
    var total = 0;
    for (var j = 0; j < nVisible; j++) {
      var bin = Math.floor((cw.iterates[j] - cw.xMin) / (cw.xMax - cw.xMin) * bins);
      if (bin >= 0 && bin < bins) { counts[bin]++; total++; }
    }
    var maxCount = 0;
    for (j = 0; j < bins; j++) if (counts[j] > maxCount) maxCount = counts[j];

    // draw histogram
    var barW = waveW / bins;
    for (j = 0; j < bins; j++) {
      if (counts[j] === 0) continue;
      var barH = (counts[j] / Math.max(maxCount, 1)) * waveH * 0.8;
      ctx.fillStyle = accent; ctx.globalAlpha = 0.25;
      ctx.fillRect(waveX + j * barW, waveY + waveH - barH, barW - 1, barH);
    }
    ctx.globalAlpha = 1;

    // gaussian envelope narrowing toward φ
    var sigma = 0.5 / Math.sqrt(nVisible);
    ctx.strokeStyle = ok; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var px = 0; px < waveW; px++) {
      var xVal = cw.xMin + (px / waveW) * (cw.xMax - cw.xMin);
      var gauss = Math.exp(-0.5 * Math.pow((xVal - PHI) / sigma, 2));
      var py = waveY + waveH - gauss * waveH * 0.85;
      px === 0 ? ctx.moveTo(waveX + px, py) : ctx.lineTo(waveX + px, py);
    }
    ctx.stroke();

    // φ marker on wave panel
    var phiPx = waveX + (PHI - cw.xMin) / (cw.xMax - cw.xMin) * waveW;
    ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(phiPx, waveY); ctx.lineTo(phiPx, waveY + waveH); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── prompt ──
  if (!cw.x0) {
    ctx.fillStyle = dim; ctx.font = "12px " + font; ctx.textAlign = "center";
    ctx.fillText("click anywhere on the plot to choose x\u2080", plotX + plotW / 2, plotY + plotH + 40);
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 1: GRAVITY SLINGSHOT
   Bodies at Stern-Brocot rational positions. Launch probe, slingshot
   around them. Δv from each body ~ 1/q. Target: reach 1/φ region.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupSlingshot() {
  var W = fd.W, H = fd.H;
  // bodies at Fibonacci convergent positions: 1/1, 1/2, 2/3, 3/5, 5/8
  var rats = [
    {p:1,q:1}, {p:1,q:2}, {p:2,q:3}, {p:3,q:5}, {p:5,q:8}
  ];
  var bodies = [];
  for (var i = 0; i < rats.length; i++) {
    var r = rats[i];
    var val = r.p / r.q;
    bodies.push({
      x: W * 0.2 + (i / (rats.length - 1)) * W * 0.6,
      y: H * (1 - val) * 0.7 + H * 0.15,
      mass: 1 / r.q,
      label: r.p + "/" + r.q,
      val: val,
      r: 12 + 20 * (1 / r.q),
      lit: false,
    });
  }

  fd.sling = {
    bodies: bodies,
    probes: [],       // multiple simultaneous probes
    targetVal: IPHI,
    targetY: H * (1 - IPHI) * 0.7 + H * 0.15,
    targetBand: 30,
    aimAngle: -0.3,
    speed: 4,
    gravity: 800,
    hit: false,
    launchX: 40, launchY: H * 0.85,
  };
}

function slingshotClick() {
  var sl = fd.sling;
  if (sl.hit) return;
  // fire a new probe (keep existing ones flying)
  var probe = {
    x: sl.launchX, y: sl.launchY,
    vx: sl.speed * Math.cos(sl.aimAngle),
    vy: sl.speed * Math.sin(sl.aimAngle),
    trail: [{x: sl.launchX, y: sl.launchY}],
    active: true, hit: false, id: sl.probes.length,
  };
  sl.probes.push(probe);
  // each new probe slightly perturbs body positions (geometry responds)
  sl.bodies.forEach(function(b) { b.lit = false; });
}

function stepSlingshot() {
  var sl = fd.sling;
  sl.probes.forEach(function(p) {
    if (!p.active) return;

    // accumulate gravity from each body
    var fx = 0, fy = 0;
    sl.bodies.forEach(function(b) {
      var dx = b.x - p.x, dy = b.y - p.y;
      var d2 = dx * dx + dy * dy;
      var d = Math.sqrt(d2) || 1;
      if (d > b.r * 0.8) {
        var strength = sl.gravity * b.mass / d2;
        fx += strength * dx / d;
        fy += strength * dy / d;
      }
      if (d < b.r * 2.5) b.lit = true;
    });

    // probe-probe repulsion (nearby probes deflect each other)
    sl.probes.forEach(function(p2) {
      if (p2 === p || !p2.active) return;
      var dx = p.x - p2.x, dy = p.y - p2.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < 80 && d > 5) {
        var rep = 30 / (d * d);
        fx += rep * dx / d; fy += rep * dy / d;
      }
    });

    p.vx += fx; p.vy += fy;
    p.x += p.vx; p.y += p.vy;
    p.trail.push({x: p.x, y: p.y});
    if (p.trail.length > 600) p.trail.shift();

    // check target band
    if (p.x > fd.W * 0.8 && Math.abs(p.y - sl.targetY) < sl.targetBand) {
      sl.hit = true; p.active = false; p.hit = true;
      fieldCleared();
    }

    // out of bounds
    if (p.x < -50 || p.x > fd.W + 50 || p.y < -50 || p.y > fd.H + 50) {
      p.active = false;
    }
  });
}

function drawSlingshot(ctx, W, H) {
  var sl = fd.sling;
  var accent = _css("--accent"), dim = _css("--dim");
  var ok = _css("--ok"), grid = _css("--grid"), fg = _css("--fg");
  var font = _fontFace();

  // target band
  ctx.fillStyle = ok; ctx.globalAlpha = 0.08;
  ctx.fillRect(W * 0.8, sl.targetY - sl.targetBand, W * 0.2, sl.targetBand * 2);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(W * 0.8, sl.targetY - sl.targetBand); ctx.lineTo(W, sl.targetY - sl.targetBand);
  ctx.moveTo(W * 0.8, sl.targetY + sl.targetBand); ctx.lineTo(W, sl.targetY + sl.targetBand);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = ok; ctx.font = "11px " + font; ctx.textAlign = "right";
  ctx.fillText("1/\u03c6 = " + IPHI.toFixed(4), W - 8, sl.targetY + 4);

  // bodies
  sl.bodies.forEach(function(b) {
    // gravity well rings
    ctx.strokeStyle = b.lit ? accent : dim; ctx.lineWidth = 0.5;
    [1.5, 2.5, 4].forEach(function(m) {
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * m, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // body
    ctx.fillStyle = b.lit ? accent : dim;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    // label
    ctx.fillStyle = fg; ctx.font = "11px " + font; ctx.textAlign = "center";
    ctx.fillText(b.label, b.x, b.y - b.r - 8);
    // value
    ctx.fillStyle = dim; ctx.font = "9px " + font;
    ctx.fillText(b.val.toFixed(3), b.x, b.y + b.r + 14);
  });

  // probe trails
  var probeColors = [accent, "#ff8844", "#88aaff", "#ffaa44", "#aa88ff"];
  sl.probes.forEach(function(p, pi) {
    if (p.trail.length < 2) return;
    var color = p.hit ? ok : probeColors[pi % probeColors.length];
    for (var i = 1; i < p.trail.length; i++) {
      ctx.globalAlpha = (i / p.trail.length) * 0.45;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5 + 1.5 * (i / p.trail.length);
      ctx.beginPath();
      ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
      ctx.lineTo(p.trail[i].x, p.trail[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // active probe head
    if (p.active) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
  });

  // aim line (always available unless cleared)
  if (!sl.hit) {
    sl.aimAngle = Math.atan2(fd.mouseY - sl.launchY, fd.mouseX - sl.launchX);
    ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sl.launchX, sl.launchY);
    ctx.lineTo(sl.launchX + 60 * Math.cos(sl.aimAngle), sl.launchY + 60 * Math.sin(sl.aimAngle));
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(sl.launchX, sl.launchY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dim; ctx.font = "11px " + font; ctx.textAlign = "center";
    var nActive = sl.probes.filter(function(p){return p.active;}).length;
    ctx.fillText("click to fire" + (nActive ? " (+" + nActive + " in flight)" : ""), sl.launchX + 80, sl.launchY + 20);
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 2: PHASE LOCK SPECTRUM
   Oscillators on a circle. Mouse Y controls coupling K.
   Watch synchronization; frequency spectrum shows Arnold tongues emerging.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupSpectrum() {
  var N = 24;
  var oscs = [];
  for (var i = 0; i < N; i++) {
    oscs.push({
      theta: Math.random() * Math.PI * 2,
      omega: 0.5 + Math.random() * 1.0, // natural frequency in [0.5, 1.5]
    });
  }
  fd.spec = {
    oscs: oscs,
    K: 0,
    orderR: 0, orderPsi: 0,
    rHistory: [],
    maxHistory: 200,
    cleared: false,
  };
}

function stepSpectrum() {
  var sp = fd.spec;
  // K tracks mouse Y: top=0, bottom=2
  sp.K = Math.max(0, Math.min(2, (fd.mouseY / fd.H) * 2));

  var N = sp.oscs.length;
  // compute order parameter
  var sumCos = 0, sumSin = 0;
  for (var i = 0; i < N; i++) {
    sumCos += Math.cos(sp.oscs[i].theta);
    sumSin += Math.sin(sp.oscs[i].theta);
  }
  sp.orderR = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / N;
  sp.orderPsi = Math.atan2(sumSin, sumCos);

  // Kuramoto step
  var dt = 0.05;
  for (i = 0; i < N; i++) {
    var oi = sp.oscs[i];
    var coupling = 0;
    for (var j = 0; j < N; j++) {
      coupling += Math.sin(sp.oscs[j].theta - oi.theta);
    }
    oi.theta += dt * (oi.omega + (sp.K / N) * coupling);
    // wrap
    oi.theta = oi.theta % (Math.PI * 2);
    if (oi.theta < 0) oi.theta += Math.PI * 2;
  }

  sp.rHistory.push(sp.orderR);
  if (sp.rHistory.length > sp.maxHistory) sp.rHistory.shift();

  // clear condition: sustained r > 0.92
  if (!sp.cleared && sp.orderR > 0.92) {
    var recent = sp.rHistory.slice(-30);
    if (recent.length >= 30 && recent.every(function(v) { return v > 0.85; })) {
      sp.cleared = true;
      fieldCleared();
    }
  }
}

function drawSpectrum(ctx, W, H) {
  var sp = fd.spec;
  var accent = _css("--accent"), dim = _css("--dim");
  var ok = _css("--ok"), fg = _css("--fg"), grid = _css("--grid");
  var font = _fontFace();
  var N = sp.oscs.length;

  // ── left: oscillator circle ──
  var cx = W * 0.25, cy = H * 0.42, cr = Math.min(W * 0.2, H * 0.32);

  ctx.strokeStyle = dim; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();

  // order parameter arrow
  ctx.strokeStyle = ok; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + cr * 0.9 * sp.orderR * Math.cos(sp.orderPsi),
             cy + cr * 0.9 * sp.orderR * Math.sin(sp.orderPsi));
  ctx.stroke();

  // oscillator dots
  for (var i = 0; i < N; i++) {
    var ox = cx + cr * Math.cos(sp.oscs[i].theta);
    var oy = cy + cr * Math.sin(sp.oscs[i].theta);
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // r label
  ctx.fillStyle = ok; ctx.font = "bold 14px " + font; ctx.textAlign = "center";
  ctx.fillText("r = " + sp.orderR.toFixed(3), cx, cy + cr + 30);
  ctx.fillStyle = dim; ctx.font = "11px " + font;
  ctx.fillText("K = " + sp.K.toFixed(2), cx, cy + cr + 48);

  // ── right top: frequency spectrum ──
  var specX = W * 0.52, specW = W * 0.44, specY = 30, specH = H * 0.35;
  ctx.strokeStyle = dim; ctx.lineWidth = 0.5;
  ctx.strokeRect(specX, specY, specW, specH);
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("frequency spectrum", specX + specW / 2, specY - 6);

  // histogram of effective frequencies (dtheta/dt)
  var freqs = [];
  for (i = 0; i < N; i++) {
    var coupling = 0;
    for (var j = 0; j < N; j++) {
      coupling += Math.sin(sp.oscs[j].theta - sp.oscs[i].theta);
    }
    freqs.push(sp.oscs[i].omega + (sp.K / N) * coupling);
  }
  // bin into histogram
  var bins = 30, fMin = 0, fMax = 2;
  var counts = new Array(bins).fill(0);
  for (i = 0; i < freqs.length; i++) {
    var bin = Math.floor((freqs[i] - fMin) / (fMax - fMin) * bins);
    if (bin >= 0 && bin < bins) counts[bin]++;
  }
  var maxC = 0;
  for (i = 0; i < bins; i++) if (counts[i] > maxC) maxC = counts[i];

  var barW = specW / bins;
  for (i = 0; i < bins; i++) {
    if (counts[i] === 0) continue;
    var barH = (counts[i] / Math.max(maxC, 1)) * specH * 0.8;
    ctx.fillStyle = accent; ctx.globalAlpha = 0.4;
    ctx.fillRect(specX + i * barW, specY + specH - barH, barW - 1, barH);
  }
  ctx.globalAlpha = 1;

  // ── right bottom: r history ──
  var histY = specY + specH + 30, histH = H * 0.3, histW = specW;
  ctx.strokeStyle = dim; ctx.lineWidth = 0.5;
  ctx.strokeRect(specX, histY, histW, histH);
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("order parameter r(t)", specX + histW / 2, histY - 6);

  // threshold line
  ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([3, 3]);
  var threshY = histY + histH * (1 - 0.92);
  ctx.beginPath(); ctx.moveTo(specX, threshY); ctx.lineTo(specX + histW, threshY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ok; ctx.font = "9px " + font; ctx.textAlign = "left";
  ctx.fillText("0.92", specX + histW + 4, threshY + 3);

  // plot r history
  if (sp.rHistory.length > 1) {
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (i = 0; i < sp.rHistory.length; i++) {
      var hx = specX + (i / sp.maxHistory) * histW;
      var hy = histY + histH * (1 - sp.rHistory[i]);
      i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.stroke();
  }

  // K slider visual (left edge)
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("\u2191 K=0", 16, 20);
  ctx.fillText("\u2193 K=2", 16, H - 10);
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  var sliderY = (sp.K / 2) * H;
  ctx.beginPath(); ctx.moveTo(8, sliderY); ctx.lineTo(24, sliderY); ctx.stroke();
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 3: CONTRACTION MAPPING
   Click to place points in 2D phase space. Watch Banach iteration
   spiral them toward the fixed point. Shows contraction factor shrinking.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupContraction() {
  fd.contraction = {
    seeds: [],        // {x, y, trail: [{x,y}], animStep, converged}
    needed: 3,        // need 3 converged seeds to clear
    converged: 0,
    // the 2D contraction map: (x,y) -> (0.5*(1+1/x), 0.5*(1+1/y))
    // fixed point: (PHI/2+0.5/PHI, PHI/2+0.5/PHI) ... or simpler:
    // use f(x,y) = (1+y)/(1+x+y), g(x,y) = (1+x)/(1+x+y) — contracts to (IPHI, IPHI)
    fixedPt: {x: IPHI, y: IPHI},
    // plot bounds
    xMin: -0.1, xMax: 1.5, yMin: -0.1, yMax: 1.5,
    maxIter: 40,
  };
}

function contractionMap(x, y) {
  // contraction map: rotational + contractive toward (1/φ, 1/φ)
  // f(x,y) = ((1+y)/(1+x+y), (1+x)/(1+x+y))
  var denom = 1 + x + y;
  if (Math.abs(denom) < 0.01) denom = 0.01;
  return {x: (1 + y) / denom, y: (1 + x) / denom};
}

function contractionClick() {
  var ct = fd.contraction;
  if (ct.converged >= ct.needed) return;
  var plotW = fd.W * 0.65, plotH = fd.H * 0.85;
  var plotX = 40, plotY = 30;

  var xVal = ct.xMin + ((fd.mouseX - plotX) / plotW) * (ct.xMax - ct.xMin);
  var yVal = ct.yMax - ((fd.mouseY - plotY) / plotH) * (ct.yMax - ct.yMin);
  if (xVal < 0.01 || yVal < 0.01 || xVal > 1.4 || yVal > 1.4) return;

  var seed = {x: xVal, y: yVal, trail: [{x: xVal, y: yVal}], animStep: 0, converged: false};
  // iterate
  var px = xVal, py = yVal;
  for (var i = 0; i < ct.maxIter; i++) {
    var next = contractionMap(px, py);
    seed.trail.push({x: next.x, y: next.y});
    px = next.x; py = next.y;
    if (Math.hypot(px - ct.fixedPt.x, py - ct.fixedPt.y) < 0.005) {
      seed.converged = true; break;
    }
  }
  ct.seeds.push(seed);
}

function stepContraction() {
  var ct = fd.contraction;
  var allDone = true;
  ct.converged = 0;
  ct.seeds.forEach(function(s) {
    if (s.animStep < s.trail.length - 1) {
      s.animStep += 0.5;
      allDone = false;
    }
    if (s.converged && s.animStep >= s.trail.length - 1) ct.converged++;
  });
  if (ct.converged >= ct.needed && !fd.cleared) {
    fieldCleared();
  }
}

function drawContraction(ctx, W, H) {
  var ct = fd.contraction;
  var accent = _css("--accent"), dim = _css("--dim");
  var ok = _css("--ok"), fg = _css("--fg"), grid = _css("--grid");
  var font = _fontFace();
  var plotW = W * 0.65, plotH = H * 0.85;
  var plotX = 40, plotY = 30;

  function xPx(v) { return plotX + (v - ct.xMin) / (ct.xMax - ct.xMin) * plotW; }
  function yPx(v) { return plotY + plotH - (v - ct.yMin) / (ct.yMax - ct.yMin) * plotH; }

  // axes
  ctx.strokeStyle = dim; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY); ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH); ctx.stroke();

  // grid
  ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
  for (var gv = 0; gv <= 1.5; gv += 0.25) {
    ctx.beginPath(); ctx.moveTo(xPx(gv), plotY); ctx.lineTo(xPx(gv), plotY + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(plotX, yPx(gv)); ctx.lineTo(plotX + plotW, yPx(gv)); ctx.stroke();
  }

  // contraction circles (showing basin shrinking)
  var radii = [0.6, 0.4, 0.2, 0.1];
  var fpx = xPx(ct.fixedPt.x), fpy = yPx(ct.fixedPt.y);
  radii.forEach(function(r) {
    ctx.strokeStyle = dim; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(fpx, fpy, r / (ct.xMax - ct.xMin) * plotW, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // fixed point
  ctx.fillStyle = ok; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(fpx, fpy, 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = ok; ctx.font = "10px " + font; ctx.textAlign = "left";
  ctx.fillText("(1/\u03c6, 1/\u03c6)", fpx + 10, fpy - 8);

  // seed trails
  var colors = [accent, "#ff8844", "#88aaff"];
  ct.seeds.forEach(function(s, si) {
    var nDraw = Math.min(Math.floor(s.animStep) + 1, s.trail.length);
    var col = colors[si % colors.length];
    // trail line
    ctx.strokeStyle = col; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var i = 0; i < nDraw; i++) {
      var px = xPx(s.trail[i].x), py = yPx(s.trail[i].y);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    // dots at each iterate
    for (i = 0; i < nDraw; i++) {
      ctx.fillStyle = col; ctx.globalAlpha = 0.4 + 0.6 * (i / s.trail.length);
      ctx.beginPath();
      ctx.arc(xPx(s.trail[i].x), yPx(s.trail[i].y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // start marker
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(xPx(s.trail[0].x), yPx(s.trail[0].y), 5, 0, Math.PI * 2);
    ctx.stroke();
  });

  // ── convergence rate panel (right) ──
  var panelX = plotX + plotW + 20, panelW = W - panelX - 10;
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("distance to (1/\u03c6, 1/\u03c6)", panelX + panelW / 2, plotY - 6);
  ctx.strokeStyle = dim; ctx.lineWidth = 0.5;
  ctx.strokeRect(panelX, plotY, panelW, plotH);

  ct.seeds.forEach(function(s, si) {
    var col = colors[si % colors.length];
    var nDraw = Math.min(Math.floor(s.animStep) + 1, s.trail.length);
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < nDraw; i++) {
      var dist = Math.hypot(s.trail[i].x - ct.fixedPt.x, s.trail[i].y - ct.fixedPt.y);
      var logDist = Math.log10(Math.max(dist, 1e-6));
      // map log distance: -4..1 to plotH
      var py = plotY + plotH * (1 - (logDist + 4) / 5);
      var px = panelX + (i / ct.maxIter) * panelW;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  });

  // progress
  ctx.fillStyle = dim; ctx.font = "11px " + font; ctx.textAlign = "center";
  ctx.fillText("converged: " + ct.converged + "/" + ct.needed, panelX + panelW / 2, plotY + plotH + 20);
  if (ct.seeds.length < ct.needed) {
    ctx.fillText("click to place point " + (ct.seeds.length + 1), W / 2, H - 12);
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 4: THREE SPECTRA
   Mouse X controls coupling K (0..2). Three panels show observables.
   At K=1, all three simultaneously produce correct values.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupThreeSpectra() {
  fd.tspec = {
    K: 0.5,
    locked: false,
  };
}

function stepThreeSpectra() {
  var ts = fd.tspec;
  if (ts.locked) return;
  // K tracks mouse X
  ts.K = Math.max(0.01, Math.min(2, (fd.mouseX / fd.W) * 2));

  // check lock: click when K is near 1.0
  if (!fd.cleared && Math.abs(ts.K - 1.0) < 0.03) {
    // check if mouse was clicked recently (handled by fieldDown setting a flag)
    // We'll use a simpler approach: auto-clear when held near K=1 for 60 frames
    if (!ts._nearCount) ts._nearCount = 0;
    ts._nearCount++;
    if (ts._nearCount > 60) {
      ts.locked = true;
      ts.K = 1.0;
      fieldCleared();
    }
  } else {
    ts._nearCount = 0;
  }
}

function drawThreeSpectra(ctx, W, H) {
  var ts = fd.tspec;
  var accent = _css("--accent"), dim = _css("--dim");
  var ok = _css("--ok"), fg = _css("--fg"), grid = _css("--grid");
  var font = _fontFace();
  var K = ts.K;

  var panelH = (H - 80) / 3;
  var panelW = W - 80;
  var panelX = 50;

  // K slider at top
  ctx.fillStyle = dim; ctx.font = "11px " + font; ctx.textAlign = "center";
  ctx.fillText("K = " + K.toFixed(3) + (ts.locked ? "  \u2713 LOCKED" : "  (move mouse \u2194)"), W / 2, 16);
  ctx.strokeStyle = dim; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(panelX, 24); ctx.lineTo(panelX + panelW, 24); ctx.stroke();
  // K marker
  var kPx = panelX + (K / 2) * panelW;
  ctx.fillStyle = Math.abs(K - 1) < 0.05 ? ok : accent;
  ctx.beginPath(); ctx.arc(kPx, 24, 5, 0, Math.PI * 2); ctx.fill();
  // K=1 marker
  var k1Px = panelX + 0.5 * panelW;
  ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(k1Px, 20); ctx.lineTo(k1Px, 28); ctx.stroke();
  ctx.setLineDash([]);

  var panels = [
    {title: "Power Spectrum  n\u209b", target: 0.965, valueFn: function(K) {
      // spectral tilt: approaches 0.965 at K=1
      return 1 - 0.035 * Math.pow(K, 1.5) / (1 + 0.2 * Math.pow(K - 1, 2));
    }},
    {title: "Rotation Curve  a\u2080/a\u2080\u2080", target: 1.0, valueFn: function(K) {
      // MOND scale: peaks at K=1
      return Math.exp(-0.5 * Math.pow(K - 1, 2) / 0.15);
    }},
    {title: "Born Rule  exponent", target: 2.0, valueFn: function(K) {
      // P=|ψ|^p, p=2 at K=1
      return 2 * K / (1 + 0.3 * Math.pow(K - 1, 2));
    }},
  ];

  panels.forEach(function(panel, pi) {
    var py = 38 + pi * (panelH + 8);
    ctx.strokeStyle = dim; ctx.lineWidth = 0.5;
    ctx.strokeRect(panelX, py, panelW, panelH);
    ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "left";
    ctx.fillText(panel.title, panelX + 6, py + 14);

    // draw curve across K range
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var kv = (i / 100) * 2;
      var val = panel.valueFn(kv);
      var px = panelX + (i / 100) * panelW;
      var vy = py + panelH - (val / (panel.target * 1.5)) * panelH;
      i === 0 ? ctx.moveTo(px, vy) : ctx.lineTo(px, vy);
    }
    ctx.stroke();

    // target line
    var targetY = py + panelH - (panel.target / (panel.target * 1.5)) * panelH;
    ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(panelX, targetY); ctx.lineTo(panelX + panelW, targetY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ok; ctx.font = "9px " + font; ctx.textAlign = "right";
    ctx.fillText(panel.target.toFixed(3), panelX + panelW - 4, targetY - 4);

    // current value marker
    var curVal = panel.valueFn(K);
    var curY = py + panelH - (curVal / (panel.target * 1.5)) * panelH;
    var match = Math.abs(curVal - panel.target) < panel.target * 0.05;
    ctx.fillStyle = match ? ok : accent;
    ctx.beginPath(); ctx.arc(kPx, curY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fg; ctx.font = "11px " + font; ctx.textAlign = "left";
    ctx.fillText(curVal.toFixed(4) + (match ? " \u2713" : ""), kPx + 10, curY + 4);
  });

  if (!ts.locked) {
    ctx.fillStyle = dim; ctx.font = "11px " + font; ctx.textAlign = "center";
    ctx.fillText("hold K near 1.0 to lock all three observables", W / 2, H - 10);
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 5: TONGUE NAVIGATION
   Arnold tongue diagram. Mouse controls a wave-packet's frequency.
   K rises automatically. Stay between tongues (irrational = safe).
   Golden ratio path is the last to close — reach K=1 to win.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupTongues() {
  // Arnold tongues at p/q for small q
  var tongues = [];
  var qs = [[0,1],[1,1],[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5]];
  qs.forEach(function(pq) {
    if (pq[1] === 0) return;
    tongues.push({p: pq[0], q: pq[1], val: pq[0] / pq[1]});
  });

  fd.tongue = {
    tongues: tongues,
    K: 0,              // current coupling, rises automatically
    Krate: 0.0008,
    omega: IPHI,       // wave packet frequency (mouse X)
    trail: [],         // path taken: [{omega, K}]
    alive: true,
    won: false,
  };
}

function stepTongues() {
  var tg = fd.tongue;
  if (!tg.alive || tg.won) return;

  // K rises
  tg.K += tg.Krate;
  if (tg.K > 1.05) { tg.won = true; fieldCleared(); return; }

  // omega tracks mouse X
  tg.omega = Math.max(0.01, Math.min(0.99, fd.mouseX / fd.W));
  tg.trail.push({omega: tg.omega, K: tg.K});
  if (tg.trail.length > 2000) tg.trail.shift();

  // check if inside any tongue
  tg.tongues.forEach(function(t) {
    if (t.q === 0) return;
    // tongue width at coupling K: w = (K/2)^q / q at low K, 1/q² at K=1
    // interpolate: w(K) = (1/q²) * smoothstep(K)  (simplified)
    var fullWidth = 1 / (t.q * t.q);
    var width = fullWidth * smoothstep(tg.K);
    if (Math.abs(tg.omega - t.val) < width / 2) {
      tg.alive = false;
    }
  });
}

function smoothstep(x) {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
}

function drawTongues(ctx, W, H) {
  var tg = fd.tongue;
  var accent = _css("--accent"), dim = _css("--dim");
  var ok = _css("--ok"), fg = _css("--fg"), grid = _css("--grid");
  var err = _css("--err");
  var font = _fontFace();

  var plotX = 50, plotY = 30, plotW = W - 80, plotH = H - 70;

  // axes
  ctx.strokeStyle = dim; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY); ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH); ctx.stroke();

  function omPx(v) { return plotX + v * plotW; }
  function kPx(v) { return plotY + plotH - v * plotH; }

  // axis labels
  ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText("\u03c9 (frequency)", plotX + plotW / 2, plotY + plotH + 18);
  ctx.save(); ctx.translate(14, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2); ctx.fillText("K (coupling)", 0, 0);
  ctx.restore();

  // draw tongues as filled wedges
  tg.tongues.forEach(function(t) {
    if (t.q === 0) return;
    var fullWidth = 1 / (t.q * t.q);
    ctx.fillStyle = dim; ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(omPx(t.val), kPx(0));
    // draw tongue boundary from K=0 to K=1
    for (var k = 0; k <= 1; k += 0.02) {
      var w = fullWidth * smoothstep(k) / 2;
      ctx.lineTo(omPx(t.val + w), kPx(k));
    }
    for (k = 1; k >= 0; k -= 0.02) {
      var w2 = fullWidth * smoothstep(k) / 2;
      ctx.lineTo(omPx(t.val - w2), kPx(k));
    }
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // label
    if (t.q <= 5) {
      ctx.fillStyle = dim; ctx.font = "9px " + font; ctx.textAlign = "center";
      ctx.fillText(t.p + "/" + t.q, omPx(t.val), kPx(0) + 12);
    }
  });

  // 1/φ line (golden path)
  ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(omPx(IPHI), plotY); ctx.lineTo(omPx(IPHI), plotY + plotH);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = ok; ctx.font = "9px " + font; ctx.textAlign = "left";
  ctx.fillText("1/\u03c6", omPx(IPHI) + 4, plotY + 10);

  // K=1 line
  ctx.strokeStyle = ok; ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(plotX, kPx(1)); ctx.lineTo(plotX + plotW, kPx(1));
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = ok; ctx.font = "9px " + font; ctx.textAlign = "right";
  ctx.fillText("K=1", plotX - 4, kPx(1) + 4);

  // trail
  if (tg.trail.length > 1) {
    var color = tg.won ? ok : (tg.alive ? accent : err);
    for (var i = 1; i < tg.trail.length; i++) {
      ctx.globalAlpha = (i / tg.trail.length) * 0.6;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(omPx(tg.trail[i - 1].omega), kPx(tg.trail[i - 1].K));
      ctx.lineTo(omPx(tg.trail[i].omega), kPx(tg.trail[i].K));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // current position marker
  if (tg.alive && !tg.won) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(omPx(tg.omega), kPx(tg.K), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // sum display
  // at current K, compute total tongue coverage
  var totalWidth = 0;
  tg.tongues.forEach(function(t) {
    if (t.q > 0) totalWidth += (1 / (t.q * t.q)) * smoothstep(tg.K);
  });
  ctx.fillStyle = fg; ctx.font = "11px " + font; ctx.textAlign = "right";
  ctx.fillText("K = " + tg.K.toFixed(3), W - 12, 18);
  ctx.fillText("\u03a3 w = " + totalWidth.toFixed(3) + " (limit: \u03c0\u00b2/6 \u2248 " + (Math.PI * Math.PI / 6).toFixed(3) + ")", W - 12, 34);

  if (!tg.alive && !tg.won) {
    ctx.fillStyle = err; ctx.font = "bold 14px " + font; ctx.textAlign = "center";
    ctx.fillText("LOCKED \u2014 resonance captured. [R] to retry", W / 2, H - 10);
  }
  if (tg.won) {
    ctx.fillStyle = ok; ctx.font = "bold 14px " + font; ctx.textAlign = "center";
    ctx.fillText("\u2713 Survived to K=1. The irrational path remains.", W / 2, H - 10);
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL 6: ORBITAL RETURN
   Bodies on a golden spiral. Chain gravity assists to make a closed orbit.
   Wave trail shows interference. Orbit that closes satisfies φ·ψ = 1.
   ═══════════════════════════════════════════════════════════════════════════ */

function setupOrbital() {
  var W = fd.W, H = fd.H;
  var cx = W * 0.5, cy = H * 0.5;
  // place 5 bodies on a golden spiral
  var bodies = [];
  var b = Math.log(PHI) / (Math.PI / 2);
  for (var i = 0; i < 5; i++) {
    var angle = i * Math.PI * 2 / PHI; // golden angle spacing
    var r = 50 + i * 40;
    bodies.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      mass: 0.4 + 0.1 * i,
      r: 10 + 4 * i,
      label: ["1/1","1/2","2/3","3/5","5/8"][i],
    });
  }

  fd.orbital = {
    bodies: bodies,
    cx: cx, cy: cy,
    probes: [],       // multiple simultaneous probes
    aimAngle: -0.8,
    speed: 3.5,
    gravity: 600,
    launchX: 50, launchY: H * 0.5,
    returnR: 40,
    hit: false,
    minAge: 120,
  };
}

function orbitalClick() {
  var orb = fd.orbital;
  if (orb.hit) return;
  orb.aimAngle = Math.atan2(fd.mouseY - orb.launchY, fd.mouseX - orb.launchX);
  var probe = {
    x: orb.launchX, y: orb.launchY,
    vx: orb.speed * Math.cos(orb.aimAngle),
    vy: orb.speed * Math.sin(orb.aimAngle),
    trail: [{x: orb.launchX, y: orb.launchY}],
    waveTrail: [],
    active: true, hit: false, age: 0, id: orb.probes.length,
  };
  orb.probes.push(probe);
}

function stepOrbital() {
  var orb = fd.orbital;
  orb.probes.forEach(function(p) {
    if (!p.active) return;
    p.age++;

    var fx = 0, fy = 0;
    // central attractor
    var dx0 = orb.cx - p.x, dy0 = orb.cy - p.y;
    var d0 = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
    if (d0 > 10) { var s0 = 3000 / (d0 * d0); fx += s0 * dx0 / d0; fy += s0 * dy0 / d0; }

    // body gravity
    orb.bodies.forEach(function(b) {
      var dx = b.x - p.x, dy = b.y - p.y;
      var d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
      if (d > b.r) {
        var s = orb.gravity * b.mass / d2;
        fx += s * dx / d; fy += s * dy / d;
      }
    });

    // probe-probe gravitational interaction
    orb.probes.forEach(function(p2) {
      if (p2 === p || !p2.active) return;
      var dx = p2.x - p.x, dy = p2.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > 8 && d < 200) {
        var s = 200 / (d * d);
        fx += s * dx / d; fy += s * dy / d;
      }
    });

    p.vx += fx; p.vy += fy;
    p.x += p.vx; p.y += p.vy;
    p.trail.push({x: p.x, y: p.y});
    if (p.trail.length > 1200) p.trail.shift();

    var phase = (p.age * 0.15) % (Math.PI * 2);
    p.waveTrail.push({x: p.x, y: p.y, phase: phase});
    if (p.waveTrail.length > 1200) p.waveTrail.shift();

    // check return
    if (p.age > orb.minAge) {
      var distReturn = Math.hypot(p.x - orb.launchX, p.y - orb.launchY);
      if (distReturn < orb.returnR) {
        orb.hit = true; p.active = false; p.hit = true;
        fieldCleared();
      }
    }

    // out of bounds or timeout
    if (p.x < -100 || p.x > fd.W + 100 || p.y < -100 || p.y > fd.H + 100) p.active = false;
    if (p.age > 2000) p.active = false;
  });
}

function drawOrbital(ctx, W, H) {
  var orb = fd.orbital;
  var accent = _css("--accent"), dim = _css("--dim");
  var ok = _css("--ok"), fg = _css("--fg"), grid = _css("--grid");
  var font = _fontFace();

  // golden spiral background
  drawGoldenSpiral(ctx, orb.cx, orb.cy, grid, 1.0);

  // central attractor
  ctx.strokeStyle = dim; ctx.lineWidth = 0.5;
  [30, 60, 100, 150].forEach(function(r) {
    ctx.globalAlpha = 0.1;
    ctx.beginPath(); ctx.arc(orb.cx, orb.cy, r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent; ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.arc(orb.cx, orb.cy, 8, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // bodies
  orb.bodies.forEach(function(b) {
    ctx.strokeStyle = accent; ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = dim;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fg; ctx.font = "9px " + font; ctx.textAlign = "center";
    ctx.fillText(b.label, b.x, b.y - b.r - 6);
  });

  // probe wave trails with interference coloring
  var probeColors = [accent, "#ff8844", "#88aaff", "#ffaa44", "#aa88ff"];
  orb.probes.forEach(function(p, pi) {
    var color = p.hit ? ok : probeColors[pi % probeColors.length];
    if (p.waveTrail.length > 1) {
      for (var i = 1; i < p.waveTrail.length; i++) {
        var wt = p.waveTrail[i];
        var brightness = 0.5 + 0.5 * Math.sin(wt.phase);
        ctx.globalAlpha = (i / p.waveTrail.length) * 0.35 * brightness;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + brightness;
        ctx.beginPath();
        ctx.moveTo(p.waveTrail[i - 1].x, p.waveTrail[i - 1].y);
        ctx.lineTo(wt.x, wt.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (p.active) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
  });

  // launch point + return zone
  ctx.strokeStyle = orb.hit ? ok : accent; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(orb.launchX, orb.launchY, orb.returnR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = orb.hit ? ok : accent; ctx.font = "10px " + font; ctx.textAlign = "center";
  ctx.fillText(orb.hit ? "\u03c6\u00b7\u03c8=1" : "return here", orb.launchX, orb.launchY - orb.returnR - 8);

  // aim line (always available until cleared)
  if (!orb.hit) {
    orb.aimAngle = Math.atan2(fd.mouseY - orb.launchY, fd.mouseX - orb.launchX);
    ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(orb.launchX, orb.launchY);
    ctx.lineTo(orb.launchX + 50 * Math.cos(orb.aimAngle), orb.launchY + 50 * Math.sin(orb.aimAngle));
    ctx.stroke(); ctx.setLineDash([]);
  }

  // probe marker at launch
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(orb.launchX, orb.launchY, 4, 0, Math.PI * 2); ctx.fill();
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LOOP + DRAW DISPATCH
   ═══════════════════════════════════════════════════════════════════════════ */

function fieldLoop() {
  var ctx = fd.ctx, W = fd.W, H = fd.H, lvl = fd.lvl;
  var accent = _css("--accent"), dim = _css("--dim");
  var fg = _css("--fg"), bg = _css("--bg"), grid = _css("--grid");
  var ok = _css("--ok");
  var font = _fontFace();
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // ── intro ──
  if (fd.state === "intro") {
    // grid
    ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
    for (var y = 50; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (var x = 50; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }

    var lv = FIELD_LEVELS[lvl];
    ctx.textAlign = "center";
    ctx.fillStyle = accent; ctx.font = "bold 20px " + font;
    ctx.fillText("\u00a7" + (lvl + 1) + "  " + lv.title, W / 2, H * 0.26);
    ctx.fillStyle = fg; ctx.font = "14px " + font;
    var lines = lv.brief.split("\n");
    lines.forEach(function(l, i) { ctx.fillText(l, W / 2, H * 0.36 + i * 22); });
    ctx.fillStyle = accent; ctx.font = "bold 11px " + font;
    ctx.fillText(lv.adds, W / 2, H * 0.36 + lines.length * 22 + 14);
    ctx.fillStyle = dim; ctx.font = "13px " + font;
    ctx.fillText(lv.eq, W / 2, H * 0.58);
    ctx.fillStyle = dim; ctx.font = "11px " + font;
    ctx.fillText("click or SPACE to begin", W / 2, H * 0.88);

    _fieldRAF = requestAnimationFrame(fieldLoop); return;
  }

  // ── cleared ──
  if (fd.state === "cleared") {
    fd.time++; // keep timer running for pause tracking
    ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
    for (var y2 = 50; y2 < H; y2 += 50) { ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(W, y2); ctx.stroke(); }
    for (var x2 = 50; x2 < W; x2 += 50) { ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2, H); ctx.stroke(); }

    // draw the level one last time behind the clear screen
    switch (lvl) {
      case 0: drawCobweb(ctx, W, H); break;
      case 1: drawSlingshot(ctx, W, H); break;
      case 2: drawSpectrum(ctx, W, H); break;
      case 3: drawContraction(ctx, W, H); break;
      case 4: drawThreeSpectra(ctx, W, H); break;
      case 5: drawTongues(ctx, W, H); break;
      case 6: drawOrbital(ctx, W, H); break;
    }

    // overlay
    ctx.fillStyle = bg; ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

    var lv2 = FIELD_LEVELS[lvl];
    ctx.textAlign = "center";
    ctx.fillStyle = ok; ctx.font = "bold 20px " + font;
    ctx.fillText("\u2713  " + lv2.title, W / 2, H * 0.38);
    ctx.fillStyle = fg; ctx.font = "15px " + font;
    ctx.fillText(lv2.eq, W / 2, H * 0.48);
    ctx.fillStyle = accent; ctx.font = "13px " + font;
    ctx.fillText('"' + lv2.hint + '"', W / 2, H * 0.58);
    // deliberate pause before allowing continue
    var elapsed = fd.time - fd.clearedAt;
    if (elapsed < 120) {
      // breathing dots during mandatory pause
      var dots = ".".repeat(Math.floor(elapsed / 20) % 4);
      ctx.fillStyle = dim; ctx.font = "11px " + font;
      ctx.fillText(dots, W / 2, H * 0.72);
    } else {
      // fade in continue prompt
      var fadeIn = Math.min(1, (elapsed - 120) / 60);
      ctx.globalAlpha = fadeIn;
      ctx.fillStyle = dim; ctx.font = "11px " + font;
      ctx.fillText(lvl < 6 ? "click or SPACE \u2192 next" : "\u03c6 \u00b7 \u03c8 = 1 \u2014 the field contains itself", W / 2, H * 0.72);
      ctx.globalAlpha = 1;
    }

    _fieldRAF = requestAnimationFrame(fieldLoop); return;
  }

  // ── playing ──
  fd.time++;

  // grid
  ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
  for (var y3 = 50; y3 < H; y3 += 50) { ctx.beginPath(); ctx.moveTo(0, y3); ctx.lineTo(W, y3); ctx.stroke(); }
  for (var x3 = 50; x3 < W; x3 += 50) { ctx.beginPath(); ctx.moveTo(x3, 0); ctx.lineTo(x3, H); ctx.stroke(); }

  // step + draw per level
  switch (lvl) {
    case 0: drawCobweb(ctx, W, H); break;
    case 1: stepSlingshot(); drawSlingshot(ctx, W, H); break;
    case 2: stepSpectrum(); drawSpectrum(ctx, W, H); break;
    case 3: stepContraction(); drawContraction(ctx, W, H); break;
    case 4: stepThreeSpectra(); drawThreeSpectra(ctx, W, H); break;
    case 5: stepTongues(); drawTongues(ctx, W, H); break;
    case 6: stepOrbital(); drawOrbital(ctx, W, H); break;
  }

  // HUD
  var lv3 = FIELD_LEVELS[lvl];
  ctx.fillStyle = accent; ctx.font = "11px " + font; ctx.textAlign = "left";
  ctx.fillText(lv3.eq, 12, 18);
  ctx.textAlign = "right"; ctx.fillStyle = dim;
  ctx.fillText("\u00a7" + (lvl + 1) + " " + lv3.title, W - 12, 18);
  ctx.fillStyle = dim; ctx.font = "11px " + font; ctx.textAlign = "center";
  ctx.fillText(lv3.hint, W / 2, H - 12);
  ctx.textAlign = "left"; ctx.fillText("[R] reset  [Tab] skip", 12, H - 12);

  _fieldRAF = requestAnimationFrame(fieldLoop);
}
