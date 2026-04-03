/* ── RFE Game Engine ─────────────────────────────────────────────────────────
 *  Four modes over the same 7-phase content.
 *  Wireframe MVP — no dependencies.
 * ──────────────────────────────────────────────────────────────────────────── */

"use strict";

// ── aesthetic ──────────────────────────────────────────────────────────────
function setAesthetic(name) {
  document.documentElement.setAttribute("data-aesthetic", name);
  document.querySelectorAll("#aesthetic-bar button").forEach(b =>
    b.classList.toggle("active", (b.textContent.trim() === (name || "wire")))
  );
  try { localStorage.setItem("rfe-aesthetic", name); } catch(e) {}
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
  updatePips();
  if (currentMode) setMode(currentMode);
}

function advancePhase() {
  if (currentPhase < PHASES.length - 1) goPhase(currentPhase + 1);
}

// ── mode switching ─────────────────────────────────────────────────────────
function setMode(mode) {
  currentMode = mode;
  // hide all
  ["typewriter","surfer","reader","puzzle"].forEach(m => {
    document.getElementById(m).style.display = "none";
  });
  document.querySelectorAll("#topbar .modes button").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("btn-" + mode);
  if (btn) btn.classList.add("active");
  $footMode.textContent = "MODE: " + mode.toUpperCase();

  // teardown
  if (_surferRAF) { cancelAnimationFrame(_surferRAF); _surferRAF = null; }

  // init
  switch (mode) {
    case "typewriter": initTypewriter(); break;
    case "surfer":     initSurfer();     break;
    case "reader":     initReader();     break;
    case "puzzle":     initPuzzle();     break;
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

  if (ch === tw.text[tw.pos]) {
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
  // auto-scroll
  $d.scrollTop = $d.scrollHeight;
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
// MODE 2: SUBWAY SURFER
// ═══════════════════════════════════════════════════════════════════════════

let _surferRAF = null;
let surf = {};

function initSurfer() {
  const $s = document.getElementById("surfer");
  $s.style.display = "block";
  const canvas = document.getElementById("surfer-canvas");
  const ctx = canvas.getContext("2d");

  // size
  canvas.width  = $s.clientWidth;
  canvas.height = $s.clientHeight;
  const W = canvas.width, H = canvas.height;

  const phase = PHASES[currentPhase];
  const lines = phase.text.trim().split("\n");

  surf = {
    ctx, W, H, lines,
    scroll: 0,
    speed: 1.2,
    lane: 1,       // 0,1,2
    laneW: W / 3,
    playerY: H - 60,
    playerW: 20,
    playerH: 30,
    obstacles: [],
    textY: 0,
    lineH: 22,
    score: 0,
    alive: true,
    eq: phase.equation,
    phaseComplete: false,
  };

  // generate obstacles
  surf.obstacles = [];
  for (let i = 0; i < 30; i++) {
    surf.obstacles.push({
      lane: Math.floor(Math.random() * 3),
      y: -(200 + i * 180 + Math.random() * 100),
      w: 40 + Math.random() * 40,
      h: 12,
      passed: false,
    });
  }

  // controls
  document.onkeydown = surferKey;
  canvas.ontouchstart = surferTouch;

  surferLoop();
}

function surferKey(e) {
  if (currentMode !== "surfer") return;
  if (e.key === "ArrowLeft"  || e.key === "a") surf.lane = Math.max(0, surf.lane - 1);
  if (e.key === "ArrowRight" || e.key === "d") surf.lane = Math.min(2, surf.lane + 1);
  if (e.key === "Tab") { e.preventDefault(); advancePhase(); }
  if (!surf.alive && e.key === " ") initSurfer(); // restart
}

function surferTouch(e) {
  const x = e.touches[0].clientX;
  if (x < surf.W / 3) surf.lane = Math.max(0, surf.lane - 1);
  else if (x > 2 * surf.W / 3) surf.lane = Math.min(2, surf.lane + 1);
}

function _css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function _fontFace() { return _css("--user-face") || _css("--mono"); }

function surferLoop() {
  const { ctx, W, H } = surf;
  ctx.clearRect(0, 0, W, H);

  // background fill (for non-default aesthetics)
  ctx.fillStyle = _css("--bg");
  ctx.fillRect(0, 0, W, H);

  // background grid
  ctx.strokeStyle = _css("--grid");
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += surf.laneW) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }

  if (surf.alive) {
    surf.scroll += surf.speed;
    surf.speed += 0.001; // gentle acceleration
  }

  // ── scrolling text (the content) ──
  const _dim = _css("--dim"), _gridC = _css("--grid");
  ctx.font = "13px " + _fontFace();
  ctx.textAlign = "center";
  const textStartY = H + 40 - surf.scroll * 0.6;
  surf.lines.forEach((line, i) => {
    const y = textStartY + i * surf.lineH;
    if (y > -20 && y < H + 20) {
      ctx.fillStyle = y < H / 2 ? _dim : _gridC;
      ctx.fillText(line.trim(), W / 2, y);
    }
  });

  // check if all text has scrolled past
  const lastLineY = textStartY + surf.lines.length * surf.lineH;
  if (lastLineY < 0 && !surf.phaseComplete) {
    surf.phaseComplete = true;
    setTimeout(() => { if (currentPhase < PHASES.length - 1) advancePhase(); }, 1000);
  }

  // ── obstacles ──
  ctx.fillStyle = _dim;
  surf.obstacles.forEach(ob => {
    const oy = ob.y + surf.scroll;
    if (oy < -50 || oy > H + 50) return;
    const ox = ob.lane * surf.laneW + (surf.laneW - ob.w) / 2;
    ctx.fillRect(ox, oy, ob.w, ob.h);

    // collision
    if (surf.alive) {
      const px = surf.lane * surf.laneW + (surf.laneW - surf.playerW) / 2;
      if (
        px < ox + ob.w && px + surf.playerW > ox &&
        surf.playerY < oy + ob.h && surf.playerY + surf.playerH > oy
      ) {
        surf.alive = false;
      }
      if (!ob.passed && oy > surf.playerY) {
        ob.passed = true;
        surf.score++;
      }
    }
  });

  // ── player ──
  const px = surf.lane * surf.laneW + (surf.laneW - surf.playerW) / 2;
  const _accent = _css("--accent"), _err = _css("--err");
  ctx.fillStyle = surf.alive ? _accent : _err;
  ctx.fillRect(px, surf.playerY, surf.playerW, surf.playerH);
  ctx.strokeStyle = surf.alive ? _accent : _err;
  ctx.strokeRect(px, surf.playerY, surf.playerW, surf.playerH);

  // ── HUD ──
  $hud.innerHTML = `SCORE: ${surf.score}<br>SPEED: ${surf.speed.toFixed(1)}` +
    (surf.alive ? "" : "<br><br>SPACE to retry");

  // ── equation at top ──
  ctx.fillStyle = _accent;
  ctx.font = "11px " + _fontFace();
  ctx.textAlign = "left";
  ctx.fillText(surf.eq, 12, 18);

  if (surf.alive) {
    _surferRAF = requestAnimationFrame(surferLoop);
  }
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
setMode("reader");   // default mode
