/* ── RFE Game Engine ─────────────────────────────────────────────────────────
 *  Four modes over the same 7-phase content.
 *  Wireframe MVP — no dependencies.
 * ──────────────────────────────────────────────────────────────────────────── */

"use strict";

// ── aesthetic ──────────────────────────────────────────────────────────────
function setAesthetic(name) {
  document.documentElement.setAttribute("data-aesthetic", name);
  document.querySelectorAll("#aesthetic-bar button").forEach(b => {
    if (!isNaN(+b.textContent.trim())) return;
    b.classList.toggle("active", (b.textContent.trim() === (name || "wire")));
  });
  try { localStorage.setItem("rfe-aesthetic", name); } catch(e) {}
  if (name === "artemis") unlockArchery();
}
// restore saved aesthetic
try { const saved = localStorage.getItem("rfe-aesthetic");
  if (saved !== null) setAesthetic(saved);
} catch(e) {}

// ── font size ─────────────────────────────────────────────────────────────
const FONT_SIZES = [12, 14, 16, 18, 22];

function setFontSize(size) {
  document.documentElement.style.setProperty("--user-size", size + "px");
  document.querySelectorAll("#aesthetic-bar button").forEach(b => {
    if (FONT_SIZES.includes(+b.textContent)) {
      b.classList.toggle("active", +b.textContent === size);
    }
  });
  try { localStorage.setItem("rfe-fontsize", size); } catch(e) {}
}
try { const s = localStorage.getItem("rfe-fontsize");
  if (s) setFontSize(+s);
} catch(e) {}

// ── font face ─────────────────────────────────────────────────────────────
const FONT_FACES = {
  "": "default", "Courier New": "Courier", "Consolas": "Consolas",
  "Monaco": "Monaco", "Menlo": "Menlo", "SF Mono": "SF Mono",
  "Fira Code": "Fira Code", "Source Code Pro": "Source Code Pro",
  "JetBrains Mono": "JetBrains", "IBM Plex Mono": "IBM Plex"
};

function setFontFace(face) {
  if (face) {
    document.documentElement.style.setProperty("--user-face", `'${face}', monospace`);
  } else {
    document.documentElement.style.removeProperty("--user-face");
  }
  const label = FONT_FACES[face] ?? "default";
  document.querySelectorAll("#font-bar button").forEach(b =>
    b.classList.toggle("active", b.textContent.trim() === label)
  );
  try { localStorage.setItem("rfe-fontface", face); } catch(e) {}
}
try { const f = localStorage.getItem("rfe-fontface");
  if (f !== null) setFontFace(f);
} catch(e) {}

// ── state ──────────────────────────────────────────────────────────────────
let currentPhase = 0;
let currentMode  = null;
let phaseReached  = 0;   // highest phase unlocked
let _archeryRAF   = null;
let archeryUnlocked = false;
try { if (localStorage.getItem("rfe-archery-unlocked") === "1") archeryUnlocked = true; } catch(e) {}

function unlockArchery() {
  if (archeryUnlocked) return;
  archeryUnlocked = true;
  try { localStorage.setItem("rfe-archery-unlocked", "1"); } catch(e) {}
  const b = document.getElementById("btn-archery");
  if (b) b.classList.remove("locked");
  const bf = document.getElementById("btn-field");
  if (bf) bf.classList.remove("locked");
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const $stage     = document.getElementById("stage");
const $hud       = document.getElementById("hud");
const $phaseBar  = document.getElementById("phase-bar");
const $footPhase = document.getElementById("footer-phase");
const $footMode  = document.getElementById("footer-mode");

// build phase pips
PHASES.forEach((_, i) => {
  const pip = document.createElement("div");
  pip.className = "phase-pip";
  pip.dataset.idx = i;
  pip.title = PHASES[i].title;
  pip.onclick = () => { if (i <= phaseReached) goPhase(i); };
  $phaseBar.appendChild(pip);
});

function updatePips() {
  document.querySelectorAll(".phase-pip").forEach(p => {
    const i = +p.dataset.idx;
    p.classList.toggle("reached", i <= phaseReached);
    p.classList.toggle("current", i === currentPhase);
  });
  $footPhase.textContent = `Phase ${currentPhase + 1}/${PHASES.length}: ${PHASES[currentPhase].title}`;
}

function goPhase(i) {
  currentPhase = Math.max(0, Math.min(PHASES.length - 1, i));
  if (currentPhase > phaseReached) phaseReached = currentPhase;
  if (phaseReached >= PHASES.length - 1) unlockArchery();
  updatePips();
  if (currentMode) setMode(currentMode);
}

function advancePhase() {
  if (currentPhase < PHASES.length - 1) goPhase(currentPhase + 1);
}

// ── mode switching ─────────────────────────────────────────────────────────
function setMode(mode) {
  if (mode === "archery" && !archeryUnlocked) return;
  if (mode === "field" && !archeryUnlocked) return;
  currentMode = mode;
  // hide all
  ["typewriter","bricks","reader","puzzle","archery","field"].forEach(m => {
    document.getElementById(m).style.display = "none";
  });
  document.querySelectorAll("#topbar .modes button").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("btn-" + mode);
  if (btn) btn.classList.add("active");
  $footMode.textContent = "MODE: " + mode.toUpperCase();

  // teardown
  document.onkeydown = null;
  if (_bricksRAF) { cancelAnimationFrame(_bricksRAF); _bricksRAF = null; }
  if (_archeryRAF) { cancelAnimationFrame(_archeryRAF); _archeryRAF = null; }
  if (_fieldRAF) { cancelAnimationFrame(_fieldRAF); _fieldRAF = null; }

  // init
  switch (mode) {
    case "typewriter": initTypewriter(); break;
    case "bricks":     initBricks();     break;
    case "reader":     initReader();     break;
    case "puzzle":     initPuzzle();     break;
    case "archery":    initArchery();    break;
    case "field":      initField();      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE 1: TYPEWRITER / WPM
// ═══════════════════════════════════════════════════════════════════════════

let tw = { pos: 0, errors: 0, startTime: null, text: "" };

function initTypewriter() {
  const $tw = document.getElementById("typewriter");
  $tw.style.display = "flex";
  const phase = PHASES[currentPhase];
  tw.text = phase.text.trim();
  tw.pos = 0; tw.errors = 0; tw.startTime = null;

  $tw.innerHTML = `
    <div id="tw-display"></div>
    <div id="tw-stats">WPM: — | Errors: 0 | Phase ${currentPhase+1}/${PHASES.length}</div>
    <input id="tw-input" autofocus>
  `;
  renderTypewriter();
  const inp = document.getElementById("tw-input");
  inp.focus();
  inp.onkeydown = handleTypewriterKey;
  // refocus on click anywhere in stage
  $tw.onclick = () => inp.focus();
}

function handleTypewriterKey(e) {
  if (e.key === "Tab") { e.preventDefault(); advancePhase(); return; }
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key.length > 1 && e.key !== "Enter") return;
  e.preventDefault();

  const ch = e.key === "Enter" ? "\n" : e.key;
  if (!tw.startTime) tw.startTime = Date.now();

  var expected = tw.text[tw.pos];
  // accept hyphen for em/en dash, and common keyboard substitutes
  var match = (ch === expected) ||
    (ch === "-" && (expected === "\u2014" || expected === "\u2013")) ||
    (ch === "'" && (expected === "\u2018" || expected === "\u2019")) ||
    (ch === '"' && (expected === "\u201c" || expected === "\u201d"));
  if (match) {
    tw.pos++;
  } else {
    tw.errors++;
  }
  renderTypewriter();
  updateTwStats();

  if (tw.pos >= tw.text.length) {
    // phase complete
    setTimeout(() => {
      if (currentPhase < PHASES.length - 1) advancePhase();
    }, 600);
  }
}

function renderTypewriter() {
  const $d = document.getElementById("tw-display");
  if (!$d) return;
  const done = tw.text.slice(0, tw.pos);
  const cur  = tw.text[tw.pos] || "";
  const rest = tw.text.slice(tw.pos + 1);
  $d.innerHTML =
    `<span class="done">${escHtml(done)}</span>` +
    `<span class="cursor-char">${escHtml(cur || " ")}</span>` +
    `<span class="pending">${escHtml(rest)}</span>`;
  // auto-scroll to keep cursor visible
  const cursor = $d.querySelector('.cursor-char');
  if (cursor) cursor.scrollIntoView({ block: 'center', behavior: 'instant' });
}

function updateTwStats() {
  const $s = document.getElementById("tw-stats");
  if (!$s) return;
  let wpm = "—";
  if (tw.startTime && tw.pos > 4) {
    const mins = (Date.now() - tw.startTime) / 60000;
    wpm = Math.round((tw.pos / 5) / mins);
  }
  const pct = Math.round(100 * tw.pos / tw.text.length);
  $s.textContent = `WPM: ${wpm} | Errors: ${tw.errors} | ${pct}% | Phase ${currentPhase+1}/${PHASES.length} [Tab→next]`;
}


// ═══════════════════════════════════════════════════════════════════════════
// MODE 2: BRICK BREAK
// ═══════════════════════════════════════════════════════════════════════════

let _bricksRAF = null;
let bk = {};

function _css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function _fontFace() { return _css("--user-face") || _css("--mono"); }

// key concepts per phase for brick labels
const BRICK_CONCEPTS = [
  ["x = f(x)","fixed point","\u03c6","1/\u03c6","self-consistent","golden ratio","x\u00b2-x-1=0","observer"],
  ["mediant","Stern-Brocot","(a+c)/(b+d)","Fibonacci","1/q\u00b2","rational","binary tree","p/q"],
  ["Kuramoto","coupling K","synchronize","Arnold tongue","\u0394\u03b8","phase lock","U(1)","resonance"],
  ["N(p/q)","g(\u03c9)","w(p,q,K)","order r","self-referential","iterate","Banach","scale-free"],
  ["\u03a9_\u039b=0.684","a\u2080=cH/2\u03c0","n\u209b=0.965","Born rule","P=|\u03c8|\u00b2","dark energy","MOND","RAR"],
  ["1/q\u00b2","Basel sum","\u03c0\u00b2/6","KAM tori","tongue width","continuum","G\u03bcv","curvature"],
  ["\u03c6\u00b7\u03c8=1","dissolution","one tree","one coupling","fixed point","no free params","x=f(x)","the map"],
];

function initBricks() {
  const $s = document.getElementById("bricks");
  $s.style.display = "block";
  const canvas = document.getElementById("bricks-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = $s.clientWidth;
  canvas.height = $s.clientHeight;
  const W = canvas.width, H = canvas.height;

  const phase = PHASES[currentPhase];
  const concepts = BRICK_CONCEPTS[currentPhase] || BRICK_CONCEPTS[0];
  const cols = Math.min(8, concepts.length);
  const rows = Math.ceil(concepts.length / cols);
  const brickW = (W - 40) / cols;
  const brickH = 20;
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= concepts.length) break;
      bricks.push({
        x: 20 + c * brickW, y: 50 + r * (brickH + 6),
        w: brickW - 3, h: brickH,
        label: concepts[idx], alive: true, flash: 0,
      });
    }
  }

  bk = {
    ctx, canvas, W, H,
    paddleX: W / 2, paddleW: 90, paddleH: 8, paddleY: H - 36,
    ballX: W / 2, ballY: H - 48,
    ballVX: 0, ballVY: 0, ballR: 4,
    speed: 4.5 + currentPhase * 0.3,
    launched: false,
    bricks: bricks,
    lives: 3,
    eq: phase.equation,
    gravity: [0, 0.008 * currentPhase],
    phaseComplete: false,
    revealed: [],
    // gravity-assist: effects spawned by destroyed bricks
    wells: [],       // {x, y, strength, life, maxLife, label}
    attractors: [],  // {x, y, strength, life, maxLife, label}
    repulsors: [],   // {x, y, strength, life, maxLife, label}
    oscillators: [], // {x, y, amp, freq, phase, life, maxLife, label}
    trail: [],       // ball trail for geodesic visualization
    maxTrail: 120,
  };

  canvas.onmousemove = bricksMouseMove;
  canvas.ontouchmove = function(e) { e.preventDefault(); bricksMouseMove(e.touches[0]); };
  canvas.onclick = function() { if (!bk.launched) launchBall(); };
  document.onkeydown = bricksKey;

  bricksLoop();
}

function launchBall() {
  bk.launched = true;
  var angle = -Math.PI/2 + (Math.random()-0.5)*0.6;
  bk.ballVX = bk.speed * Math.cos(angle);
  bk.ballVY = bk.speed * Math.sin(angle);
}

function bricksMouseMove(e) {
  var rect = bk.canvas.getBoundingClientRect();
  bk.paddleX = (e.clientX||e.pageX) - rect.left;
  bk.paddleX = Math.max(bk.paddleW/2, Math.min(bk.W - bk.paddleW/2, bk.paddleX));
  if (!bk.launched) bk.ballX = bk.paddleX;
}

function bricksKey(e) {
  if (currentMode !== "bricks") return;
  if (e.key === "ArrowLeft")  bk.paddleX = Math.max(bk.paddleW/2, bk.paddleX - 24);
  if (e.key === "ArrowRight") bk.paddleX = Math.min(bk.W - bk.paddleW/2, bk.paddleX + 24);
  if (e.key === " " && !bk.launched) { e.preventDefault(); launchBall(); }
  if (e.key === "Tab") { e.preventDefault(); advancePhase(); }
  if (e.key === "r") initBricks();
  if (!bk.launched) bk.ballX = bk.paddleX;
}

// ── gravity-assist effects ─────────────────────────────────────────────────
// Map concept labels to physics effects when their brick is destroyed

var EFFECT_MAP = {
  // attractors: pull the ball toward this point
  "\u03c6": "attractor", "golden ratio": "attractor", "fixed point": "attractor",
  "x = f(x)": "attractor", "x\u00b2-x-1=0": "attractor", "\u03c6\u00b7\u03c8=1": "attractor",
  "self-consistent": "attractor", "fixed point": "attractor",
  // gravity wells: bend the ball's path (like slingshot)
  "1/q\u00b2": "well", "curvature": "well", "G\u03bcv": "well",
  "coupling K": "well", "gravity": "well", "MOND": "well",
  "dark energy": "well", "\u03a9_\u039b=0.684": "well",
  // repulsors: push ball away
  "observer": "repulsor", "dissolution": "repulsor",
  "no free params": "repulsor",
  // oscillators: sinusoidal force region
  "resonance": "oscillator", "synchronize": "oscillator",
  "phase lock": "oscillator", "Kuramoto": "oscillator",
  "Arnold tongue": "oscillator", "\u0394\u03b8": "oscillator",
  "U(1)": "oscillator",
};

function brickSpawnEffect(brick) {
  var cx = brick.x + brick.w / 2;
  var cy = brick.y + brick.h / 2;
  var life = 600; // ~10 seconds at 60fps
  var type = EFFECT_MAP[brick.label];
  if (!type) {
    // default: mild well for any unrecognized concept
    type = "well";
    life = 300;
  }
  switch (type) {
    case "attractor":
      bk.attractors.push({x: cx, y: cy, strength: 0.15, life: life, maxLife: life, label: brick.label});
      break;
    case "well":
      bk.wells.push({x: cx, y: cy, strength: 0.08, life: life, maxLife: life, label: brick.label});
      break;
    case "repulsor":
      bk.repulsors.push({x: cx, y: cy, strength: 0.12, life: life, maxLife: life, label: brick.label});
      break;
    case "oscillator":
      bk.oscillators.push({x: cx, y: cy, amp: 0.2, freq: 0.06, phase: 0, life: life, maxLife: life, label: brick.label});
      break;
  }
}

function brickForces() {
  // apply forces from active effects to ball
  var fx = 0, fy = 0;

  bk.wells.forEach(function(w) {
    var dx = w.x - bk.ballX, dy = w.y - bk.ballY;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d > 10) {
      var fade = w.life / w.maxLife;
      var s = w.strength * fade / Math.max(d * 0.02, 1);
      fx += s * dx / d; fy += s * dy / d;
    }
  });

  bk.attractors.forEach(function(a) {
    var dx = a.x - bk.ballX, dy = a.y - bk.ballY;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d > 8) {
      var fade = a.life / a.maxLife;
      var s = a.strength * fade / Math.max(d * 0.015, 1);
      fx += s * dx / d; fy += s * dy / d;
    }
  });

  bk.repulsors.forEach(function(r) {
    var dx = bk.ballX - r.x, dy = bk.ballY - r.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d > 8 && d < 200) {
      var fade = r.life / r.maxLife;
      var s = r.strength * fade / Math.max(d * 0.02, 1);
      fx += s * dx / d; fy += s * dy / d;
    }
  });

  bk.oscillators.forEach(function(o) {
    var dx = o.x - bk.ballX, dy = o.y - bk.ballY;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < 150) {
      var fade = o.life / o.maxLife;
      var wave = Math.sin(o.phase) * o.amp * fade * (1 - d / 150);
      fy += wave;
    }
  });

  bk.ballVX += fx;
  bk.ballVY += fy;
}

function tickEffects() {
  // age and remove expired effects
  function tick(arr) {
    for (var i = arr.length - 1; i >= 0; i--) {
      arr[i].life--;
      if (arr[i].phase !== undefined) arr[i].phase += arr[i].freq;
      if (arr[i].life <= 0) arr.splice(i, 1);
    }
  }
  tick(bk.wells); tick(bk.attractors); tick(bk.repulsors); tick(bk.oscillators);
}

function drawEffects(ctx, W, H) {
  var accent = _css("--accent"), ok = _css("--ok");
  var err = _css("--err"), dim = _css("--dim");
  var font = _fontFace();

  // ball trail (geodesic visualization)
  if (bk.trail.length > 1) {
    for (var i = 1; i < bk.trail.length; i++) {
      ctx.globalAlpha = (i / bk.trail.length) * 0.25;
      ctx.strokeStyle = accent; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bk.trail[i - 1].x, bk.trail[i - 1].y);
      ctx.lineTo(bk.trail[i].x, bk.trail[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // wells: concentric rings
  bk.wells.forEach(function(w) {
    var fade = w.life / w.maxLife;
    ctx.strokeStyle = accent; ctx.lineWidth = 0.5;
    [20, 40, 65].forEach(function(r) {
      ctx.globalAlpha = 0.08 * fade;
      ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = fade * 0.5;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(w.x, w.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // attractors: pulsing dot + rings
  bk.attractors.forEach(function(a) {
    var fade = a.life / a.maxLife;
    var pulse = 1 + 0.15 * Math.sin(a.life * 0.1);
    ctx.strokeStyle = ok; ctx.lineWidth = 0.8;
    [15, 30, 50].forEach(function(r) {
      ctx.globalAlpha = 0.12 * fade;
      ctx.beginPath(); ctx.arc(a.x, a.y, r * pulse, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = fade * 0.7;
    ctx.fillStyle = ok;
    ctx.beginPath(); ctx.arc(a.x, a.y, 4 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.font = "8px " + font; ctx.textAlign = "center";
    ctx.fillText(a.label, a.x, a.y - 10);
    ctx.globalAlpha = 1;
  });

  // repulsors: outward rays
  bk.repulsors.forEach(function(r) {
    var fade = r.life / r.maxLife;
    ctx.strokeStyle = err; ctx.lineWidth = 0.5;
    for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.globalAlpha = 0.15 * fade;
      ctx.beginPath();
      ctx.moveTo(r.x + 6 * Math.cos(a), r.y + 6 * Math.sin(a));
      ctx.lineTo(r.x + (25 + 10 * Math.sin(r.life * 0.08)) * Math.cos(a),
                 r.y + (25 + 10 * Math.sin(r.life * 0.08)) * Math.sin(a));
      ctx.stroke();
    }
    ctx.globalAlpha = fade * 0.5;
    ctx.fillStyle = err;
    ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // oscillators: wave rings
  bk.oscillators.forEach(function(o) {
    var fade = o.life / o.maxLife;
    var wave = Math.sin(o.phase);
    ctx.strokeStyle = accent; ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.12 * fade;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 30 + 20 * Math.abs(wave), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.08 * fade;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 60 + 30 * Math.abs(wave), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = fade * 0.4;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(o.x, o.y, 3 + 2 * Math.abs(wave), 0, Math.PI * 2); ctx.fill();
    ctx.font = "8px " + font; ctx.textAlign = "center";
    ctx.fillText(o.label, o.x, o.y - 10);
    ctx.globalAlpha = 1;
  });
}

function bricksLoop() {
  var ctx = bk.ctx, W = bk.W, H = bk.H;
  var accent = _css("--accent"), dim = _css("--dim");
  var grid = _css("--grid"), fg = _css("--fg"), bg = _css("--bg");
  var ok = _css("--ok"), font = _fontFace();

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
  for (var y = 50; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for (var x = 50; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }

  // draw active effects (behind ball)
  drawEffects(ctx, W, H);

  // ball physics
  if (bk.launched) {
    bk.ballVX += bk.gravity[0];
    bk.ballVY += bk.gravity[1];
    brickForces();
    bk.ballX += bk.ballVX;
    bk.ballY += bk.ballVY;
    // trail for geodesic viz
    bk.trail.push({x: bk.ballX, y: bk.ballY});
    if (bk.trail.length > bk.maxTrail) bk.trail.shift();
    tickEffects();

    // wall bounces
    if (bk.ballX - bk.ballR < 0) { bk.ballX = bk.ballR; bk.ballVX = Math.abs(bk.ballVX); }
    if (bk.ballX + bk.ballR > W) { bk.ballX = W - bk.ballR; bk.ballVX = -Math.abs(bk.ballVX); }
    if (bk.ballY - bk.ballR < 0) { bk.ballY = bk.ballR; bk.ballVY = Math.abs(bk.ballVY); }

    // paddle bounce
    if (bk.ballVY > 0 &&
        bk.ballY + bk.ballR >= bk.paddleY &&
        bk.ballY + bk.ballR <= bk.paddleY + bk.paddleH + 4 &&
        bk.ballX >= bk.paddleX - bk.paddleW/2 &&
        bk.ballX <= bk.paddleX + bk.paddleW/2) {
      bk.ballY = bk.paddleY - bk.ballR;
      var off = (bk.ballX - bk.paddleX) / (bk.paddleW / 2);
      var angle = off * Math.PI * 0.4 - Math.PI/2;
      bk.ballVX = bk.speed * Math.cos(angle);
      bk.ballVY = bk.speed * Math.sin(angle);
    }

    // ball lost
    if (bk.ballY > H + 20) {
      bk.lives--;
      bk.launched = false;
      bk.ballX = bk.paddleX;
      bk.ballY = bk.paddleY - 12;
      bk.ballVX = 0; bk.ballVY = 0;
      bk.trail = [];
      if (bk.lives <= 0) {
        bk.bricks.forEach(function(b) { b.alive = true; });
        bk.lives = 3;
        bk.revealed = [];
        bk.wells = []; bk.attractors = []; bk.repulsors = []; bk.oscillators = [];
      }
    }

    // brick collisions
    bk.bricks.forEach(function(b) {
      if (!b.alive) return;
      if (bk.ballX + bk.ballR > b.x && bk.ballX - bk.ballR < b.x + b.w &&
          bk.ballY + bk.ballR > b.y && bk.ballY - bk.ballR < b.y + b.h) {
        b.alive = false; b.flash = 30;
        bk.revealed.push(b.label);
        brickSpawnEffect(b);
        var dx = bk.ballX - (b.x + b.w/2);
        var dy = bk.ballY - (b.y + b.h/2);
        if (Math.abs(dx / b.w) > Math.abs(dy / b.h)) bk.ballVX = -bk.ballVX;
        else bk.ballVY = -bk.ballVY;
      }
    });

    // check win
    if (bk.bricks.every(function(b){return !b.alive;}) && !bk.phaseComplete) {
      bk.phaseComplete = true;
      setTimeout(function() { if (currentPhase < PHASES.length - 1) advancePhase(); }, 1200);
    }
  }

  // draw bricks
  bk.bricks.forEach(function(b) {
    if (b.flash > 0) b.flash--;
    if (b.alive) {
      ctx.fillStyle = accent; ctx.globalAlpha = 0.12;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent; ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = dim; ctx.font = "9px " + font; ctx.textAlign = "center";
      ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2 + 3, b.w - 4);
    } else if (b.flash > 0) {
      ctx.fillStyle = ok; ctx.globalAlpha = b.flash / 30 * 0.3;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalAlpha = 1;
    }
  });

  // revealed concepts trail
  if (bk.revealed.length > 0) {
    ctx.fillStyle = dim; ctx.font = "10px " + font; ctx.textAlign = "center";
    ctx.globalAlpha = 0.6;
    var trail = bk.revealed.slice(-12).join("  \u00b7  ");
    ctx.fillText(trail, W/2, H - 52, W - 40);
    ctx.globalAlpha = 1;
  }

  // paddle
  ctx.fillStyle = accent;
  ctx.fillRect(bk.paddleX - bk.paddleW/2, bk.paddleY, bk.paddleW, bk.paddleH);

  // ball
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(bk.ballX, bk.ballY, bk.ballR, 0, Math.PI*2); ctx.fill();

  // HUD
  ctx.fillStyle = accent; ctx.font = "11px " + font; ctx.textAlign = "left";
  ctx.fillText(bk.eq, 12, 18);
  var alive = bk.bricks.filter(function(b){return b.alive;}).length;
  var nEffects = bk.wells.length + bk.attractors.length + bk.repulsors.length + bk.oscillators.length;
  ctx.textAlign = "right"; ctx.fillStyle = dim;
  ctx.fillText("bricks: " + alive + "  lives: " + bk.lives + (nEffects ? "  fields: " + nEffects : ""), W - 12, 18);
  if (!bk.launched) {
    ctx.textAlign = "center"; ctx.fillStyle = dim; ctx.font = "11px " + font;
    ctx.fillText("SPACE or click to launch", W/2, H - 8);
  }
  ctx.textAlign = "left"; ctx.fillStyle = dim; ctx.font = "10px " + font;
  ctx.fillText("[R] reset  [Tab] skip", 12, H - 8);

  _bricksRAF = requestAnimationFrame(bricksLoop);
}


// ═══════════════════════════════════════════════════════════════════════════
// MODE 3: READER (press-to-continue + growing plant)
// ═══════════════════════════════════════════════════════════════════════════

let reader = { section: 0 };

function initReader() {
  const $r = document.getElementById("reader");
  $r.style.display = "flex";
  reader.section = 0;
  renderReader();
}

function renderReader() {
  const $r = document.getElementById("reader");
  const phase = PHASES[currentPhase];
  const paragraphs = phase.text.trim().split("\n\n");
  const sec = reader.section;

  // visible paragraphs up to current section
  const visible = paragraphs.slice(0, sec + 1);
  const progress = (sec + 1) / paragraphs.length;
  const totalProgress = (currentPhase + progress) / PHASES.length;

  $r.innerHTML = `
    <div id="reader-plant">${renderPlant(totalProgress)}</div>
    <div id="reader-text">
      <span class="phase-title">§${currentPhase+1} ${phase.title}</span>
      ${visible.map(p => `<p style="margin-bottom:12px">${escHtml(p)}</p>`).join("")}
      ${sec >= paragraphs.length - 1 ? `<span class="eq">${escHtml(phase.equation)}</span>` : ""}
    </div>
    <div id="reader-prompt">${sec < paragraphs.length - 1 ? "press SPACE or click to continue" : ""}</div>
    <div id="reader-choices">
      ${sec >= paragraphs.length - 1 && currentPhase < PHASES.length - 1
        ? `<button onclick="advancePhase()">→ Next phase</button>`
        : ""}
      ${sec >= paragraphs.length - 1 && currentPhase === PHASES.length - 1
        ? `<button onclick="setMode('puzzle')">→ Enter Puzzle</button>`
        : ""}
    </div>
  `;

  // scroll text to bottom
  const $rt = document.getElementById("reader-text");
  if ($rt) $rt.scrollTop = $rt.scrollHeight;

  // input handler
  const advance = (e) => {
    if (e && e.key && e.key !== " " && e.key !== "Enter" && e.key !== "ArrowDown" && e.key !== "Tab") return;
    if (e && e.key === "Tab") { e.preventDefault(); advancePhase(); return; }
    if (e) e.preventDefault();
    if (sec < paragraphs.length - 1) {
      reader.section++;
      renderReader();
    }
  };
  document.onkeydown = advance;
  $r.onclick = advance;
}

function renderPlant(progress) {
  // ASCII growing plant, 0..1 progress
  const h = Math.max(1, Math.floor(progress * 8));
  const stages = [
    // seed
    [`    .    `],
    // sprout
    [`    |    `,
     `   \\|/   `,
     `    |    `],
    // small
    [`   \\|/   `,
     `    |    `,
     `   /|\\   `,
     `    |    `],
    // medium
    [`  \\ | /  `,
     `   \\|/   `,
     `    |    `,
     `   /|\\   `,
     `    |    `,
     `    |    `],
    // growing
    [`    *    `,
     `  \\ | /  `,
     `   \\|/   `,
     `    |    `,
     `  --|--  `,
     `    |    `,
     `    |    `],
    // tall
    [`   ✧ ✧   `,
     `  \\   /  `,
     `   \\ | /  `,
     `    \\|/   `,
     `     |    `,
     `   --|--  `,
     `     |    `,
     `     |    `],
    // flowering
    [`  ✧   ✧  `,
     `   \\ /   `,
     `  --*--  `,
     `   / \\   `,
     `  \\ | /  `,
     `   \\|/   `,
     `    |    `,
     `  --|--  `,
     `    |    `,
     `    |    `],
    // full bloom
    [`    ◇    `,
     `  ✧ | ✧  `,
     `   \\|/   `,
     `  --*--  `,
     `   /|\\   `,
     `  / | \\  `,
     `   \\|/   `,
     `    |    `,
     `  --|--  `,
     `    |    `,
     `    |    `,
     `   ===   `],
  ];
  const idx = Math.min(stages.length - 1, Math.floor(progress * stages.length));
  const plant = stages[idx];
  return `<pre style="color:var(--accent);font-size:11px;line-height:1.2">${plant.join("\n")}</pre>`;
}


// ═══════════════════════════════════════════════════════════════════════════
// MODE 4: PUZZLE
// ═══════════════════════════════════════════════════════════════════════════

let puzzle = { dissolved: new Set() };

function initPuzzle() {
  const $p = document.getElementById("puzzle");
  $p.style.display = "flex";
  renderPuzzle();
}

function renderPuzzle() {
  const $p = document.getElementById("puzzle");
  const dissolved = puzzle.dissolved.size;

  $p.innerHTML = `
    <div id="puzzle-status">
      Anomalies dissolved: ${dissolved}/${PHASES.length} — click an assumption to challenge it
    </div>
    <div id="puzzle-grid">
      ${PHASES.map((ph, i) => {
        const isDissolved = puzzle.dissolved.has(i);
        const isRevealed  = isDissolved; // could add intermediate state
        return `
          <div class="puzzle-card ${isDissolved ? "dissolved" : ""} ${isRevealed ? "revealed" : ""}"
               onclick="puzzleClick(${i})" data-idx="${i}">
            <div style="font-size:10px;color:var(--dim);margin-bottom:4px">
              §${i+1} ${ph.title} · <em>${ph.repo}</em>
            </div>
            <div class="assumption">
              ${isDissolved ? "✓ " : "▸ "}${escHtml(ph.assumption)}
            </div>
            <div class="challenge">
              → ${escHtml(ph.challenge)}
            </div>
          </div>`;
      }).join("")}
    </div>
    ${dissolved === PHASES.length ? `
      <div style="text-align:center;padding:16px;color:var(--accent)">
        All anomalies dissolved. φ · ψ = 1.
      </div>` : ""}
  `;

  document.onkeydown = (e) => {
    if (e.key === "Tab") { e.preventDefault(); advancePhase(); }
  };
}

function puzzleClick(i) {
  const card = document.querySelector(`.puzzle-card[data-idx="${i}"]`);
  if (puzzle.dissolved.has(i)) return;

  if (!card.classList.contains("revealed")) {
    card.classList.add("revealed");
    card.querySelector(".challenge").style.display = "block";
  } else {
    // second click dissolves
    puzzle.dissolved.add(i);
    renderPuzzle();
    if (puzzle.dissolved.size >= PHASES.length) unlockArchery();
  }
}

// ── utils ──────────────────────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── keyboard shortcut for phase nav ────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "ArrowRight") { e.preventDefault(); advancePhase(); }
  if (e.ctrlKey && e.key === "ArrowLeft")  { e.preventDefault(); goPhase(currentPhase - 1); }
});

// ── init ───────────────────────────────────────────────────────────────────
updatePips();
if (archeryUnlocked) {
  const ab = document.getElementById("btn-archery");
  if (ab) ab.classList.remove("locked");
  const fb = document.getElementById("btn-field");
  if (fb) fb.classList.remove("locked");
}
setMode("bricks");   // default mode
