/* ── Artemis: Geodesic Archery ───────────────────────────────────────────────
 *  Mode 6. Shoot arrows along geodesics to dissolve anomalies.
 *  Unlocks on reaching phase 7 in any mode, or selecting artemis aesthetic.
 * ────────────────────────────────────────────────────────────────────────── */

let arc = {};

const ARCHERY_LEVELS = [
  { title:"The Golden Target",
    brief:"Find the fixed point of x \u21a6 1 + 1/x",
    eq:"x\u00b2 \u2212 x \u2212 1 = 0  \u2192  \u03c6",
    adds:"Adds: GRAVITY \u2014 a constant force bends the arrow's path",
    hint:"The simplest truth: a map that returns to itself." },
  { title:"Mediant Precision",
    brief:"Hit the mediant: (a+c)/(b+d)\nNavigate the tree toward 1/\u03c6",
    eq:"mediant(a/b, c/d) = (a+c)/(b+d)",
    adds:"Adds: THE TREE \u2014 three mediants, zero gravity, pure aim",
    hint:"Between any two rationals, the mediant waits." },
  { title:"Resonance Lock",
    brief:"Fire when the oscillator synchronizes\nCoupling K increases \u2014 wait for the lock",
    eq:"d\u03b8/dt = \u03c9 + K\u00b7sin(\u0394\u03b8)",
    adds:"Adds: TIME \u2014 the target oscillates as coupling K grows",
    hint:"Oscillators couple. Phases align. Wait for the lock." },
  { title:"Iterate to Convergence",
    brief:"Each arrow warps the field for the next\nConverge on the fixed point \u2014 x = f(x)",
    eq:"N(p/q) = N\u00b7g\u00b7w(K|r|)",
    adds:"Adds: SELF-REFERENCE \u2014 stuck arrows create new gravity wells",
    hint:"Fire into the field. Let the field answer. Iterate." },
  { title:"Three Observables",
    brief:"One arrow, three bands\nFind the geodesic that threads \u03a9_\u039b, a\u2080, n\u209b",
    eq:"\u03a9_\u039b = 0.684 \u00b7 a\u2080 = cH/2\u03c0 \u00b7 n\u209b = 0.965",
    adds:"Adds: MULTIPLICITY \u2014 one geodesic must thread three bands",
    hint:"Three numbers. One arrow. The geodesic knows the way." },
  { title:"Thread the Tongue",
    brief:"Arnold tongue gaps narrow as 1/q\u00b2\nThread the arrow through",
    eq:"\u03a3 1/q\u00b2 = \u03c0\u00b2/6",
    adds:"Adds: TOPOLOGY \u2014 walls with gaps that shrink as 1/q\u00b2",
    hint:"The tongues narrow. Only the irrational path remains." },
  { title:"The Return",
    brief:"The target is the archer\nLet curvature complete the circle",
    eq:"\u03c6 \u00b7 \u03c8 = 1",
    adds:"Adds: CURVATURE \u2014 a central attractor warps all paths home",
    hint:"The target was always here." },
];

// ── init ──────────────────────────────────────────────────────────────────

function initArchery() {
  var $a = document.getElementById("archery");
  $a.style.display = "block";
  var canvas = document.getElementById("archery-canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = $a.clientWidth;
  canvas.height = $a.clientHeight;

  arc = {
    ctx: ctx, canvas: canvas,
    W: canvas.width, H: canvas.height,
    lvl: Math.min(currentPhase, 6),
    state: "intro", time: 0,
    artemisX: 60, artemisY: canvas.height / 2,
    aimAngle: -0.3,
    arrows: [], targets: [], posts: [], walls: [],
    stuckArrows: [],
    gravity: [0, 0.07], attractor: null,
    speed: 8, round: 0, maxRounds: 1,
    bandsHit: new Set(), canFire: true,
    shotsTotal: 0, shotsHit: 0,
  };

  setupArcheryLevel();

  canvas.onmousemove = archeryMove;
  canvas.ontouchmove = function(e) { e.preventDefault(); archeryMove(e.touches[0]); };
  canvas.onmousedown = archeryDown;
  canvas.ontouchstart = function(e) { e.preventDefault(); archeryDown(e.touches[0]); };
  document.onkeydown = archeryKey;

  if (_archeryRAF) cancelAnimationFrame(_archeryRAF);
  archeryLoop();
}

function setupArcheryLevel() {
  var W = arc.W, H = arc.H;
  arc.targets = []; arc.posts = []; arc.walls = [];
  arc.stuckArrows = []; arc.arrows = [];
  arc.round = 0; arc.bandsHit = new Set();
  arc.canFire = true; arc.attractor = null; arc.maxRounds = 1;

  switch (arc.lvl) {
    case 0:
      arc.gravity = [0, 0.07]; arc.speed = 8;
      arc.targets = [{x:W*0.78, y:H*0.382, r:24, label:"\u03c6", hit:false}];
      break;
    case 1:
      arc.gravity = [0, 0]; arc.speed = 10;
      arc.maxRounds = 3; setupMediantRound();
      break;
    case 2:
      arc.gravity = [0, 0.05]; arc.speed = 8;
      arc.targets = [{x:W*0.78, y:H*0.5, r:26, label:"sync", hit:false}];
      break;
    case 3:
      arc.gravity = [0, 0.06]; arc.speed = 7;
      arc.targets = [{x:W*0.72, y:H*0.4, r:30, label:"x=f(x)", hit:false}];
      break;
    case 4:
      arc.gravity = [0, 0.02]; arc.speed = 8;
      arc.targets = [
        {x:W*0.52, y:H*0.25, r:16, bandH:40, label:"n\u209b", hit:false},
        {x:W*0.68, y:H*0.22, r:16, bandH:40, label:"a\u2080", hit:false},
        {x:W*0.84, y:H*0.40, r:16, bandH:40, label:"\u03a9_\u039b", hit:false},
      ];
      break;
    case 5:
      arc.gravity = [0, 0.04]; arc.speed = 9;
      arc.maxRounds = 3; setupTongueRound();
      break;
    case 6:
      arc.gravity = [0, 0]; arc.speed = 5;
      arc.attractor = {x:W*0.5, y:H*0.5, strength:15000};
      arc.targets = [{x:80, y:arc.artemisY-40, r:28, label:"\u03c8=1/\u03c6", hit:false}];
      break;
  }
}

function setupMediantRound() {
  var W = arc.W, H = arc.H;
  var rounds = [{a:[0,1],b:[1,1]},{a:[1,2],b:[1,1]},{a:[2,3],b:[1,1]}];
  var r = rounds[arc.round];
  var med = [r.a[0]+r.b[0], r.a[1]+r.b[1]];
  arc.targets = [{x:W*0.78, y:H*(1-med[0]/med[1]), r:22, label:med[0]+"/"+med[1], hit:false}];
  arc.posts = [
    {y: H*(1 - (r.a[1]?r.a[0]/r.a[1]:0)), label: r.a[0]+"/"+r.a[1]},
    {y: H*(1 - r.b[0]/r.b[1]), label: r.b[0]+"/"+r.b[1]},
  ];
}

function setupTongueRound() {
  var W = arc.W, H = arc.H;
  var tongues = [{q:2,py:0.5},{q:3,py:0.333},{q:5,py:0.4}];
  var t = tongues[arc.round];
  var gapH = Math.max(30, H/(t.q*t.q)*3);
  arc.walls = [{x:W*0.55, w:8, gaps:[{y:H*t.py-gapH/2, h:gapH}]}];
  arc.targets = [{x:W*0.85, y:H*t.py, r:22, label:"1/"+t.q+"\u00b2", hit:false}];
}

// ── input ─────────────────────────────────────────────────────────────────

function archeryMove(e) {
  var rect = arc.canvas.getBoundingClientRect();
  var mx = (e.clientX||e.pageX) - rect.left;
  var my = (e.clientY||e.pageY) - rect.top;
  arc.aimAngle = Math.atan2(my - arc.artemisY, mx - arc.artemisX);
}

function archeryDown() {
  if (arc.state === "intro")   { arc.state = "playing"; return; }
  if (arc.state === "cleared") { if (arc.lvl < 6) advancePhase(); return; }
  if (arc.canFire) fireArrow();
}

function archeryKey(e) {
  if (currentMode !== "archery") return;
  if (arc.state === "intro" && (e.key===" "||e.key==="Enter"))
    { e.preventDefault(); arc.state = "playing"; return; }
  if (arc.state === "cleared" && (e.key===" "||e.key==="Enter"))
    { e.preventDefault(); if (arc.lvl<6) advancePhase(); return; }
  if (e.key === "Tab")       { e.preventDefault(); advancePhase(); }
  if (e.key === "r" && arc.state === "playing") initArchery();
  if (e.key === "ArrowUp")   arc.aimAngle -= 0.04;
  if (e.key === "ArrowDown") arc.aimAngle += 0.04;
  if (e.key === " " && arc.state === "playing")
    { e.preventDefault(); if (arc.canFire) fireArrow(); }
}

function fireArrow() {
  var a = {
    x: arc.artemisX + 32*Math.cos(arc.aimAngle),
    y: arc.artemisY + 32*Math.sin(arc.aimAngle),
    vx: arc.speed*Math.cos(arc.aimAngle),
    vy: arc.speed*Math.sin(arc.aimAngle),
    trail: [], active: true, hit: false, age: 0,
  };
  a.trail.push({x:a.x, y:a.y});
  arc.arrows.push(a);
  arc.canFire = false;
  arc.shotsTotal++;
}

// ── physics ───────────────────────────────────────────────────────────────

function getForces(x, y) {
  var fx = arc.gravity[0], fy = arc.gravity[1];
  if (arc.attractor) {
    var dx = arc.attractor.x-x, dy = arc.attractor.y-y;
    var d2 = dx*dx+dy*dy, d = Math.sqrt(d2)||1;
    if (d>15) { var s=arc.attractor.strength/d2; fx+=s*dx/d; fy+=s*dy/d; }
  }
  if (arc.lvl === 3) {
    arc.stuckArrows.forEach(function(sa) {
      var dx=sa.x-x, dy=sa.y-y, d=Math.sqrt(dx*dx+dy*dy)||1;
      if (d>8) { var s=600/(d*d); fx+=s*dx/d; fy+=s*dy/d; }
    });
  }
  return [fx, fy];
}

function stepArrow(a) {
  if (!a.active) return;
  a.age++;
  var f = getForces(a.x, a.y);
  a.vx += f[0]; a.vy += f[1];
  a.x += a.vx; a.y += a.vy;
  a.trail.push({x:a.x, y:a.y});
  if (a.trail.length > 500) a.trail.shift();
  if (a.x<-80||a.x>arc.W+80||a.y<-150||a.y>arc.H+150) a.active = false;
  arc.walls.forEach(function(w) {
    if (a.x>=w.x && a.x<=w.x+w.w)
      if (!w.gaps.some(function(g){return a.y>=g.y&&a.y<=g.y+g.h;})) a.active=false;
  });
}

function checkHits(a) {
  if (!a.active) return;
  if (arc.lvl===6 && a.age<80) return;
  arc.targets.forEach(function(t, i) {
    if (t.hit) return;
    if (t.bandH != null) {
      if (a.x>t.x-25 && a.x<t.x+25 && Math.abs(a.y-t.y)<t.bandH) {
        arc.bandsHit.add(i);
        if (arc.bandsHit.size===arc.targets.length) {
          a.hit=true; a.active=false;
          arc.targets.forEach(function(tt){tt.hit=true;});
          arc.shotsHit++; levelCleared();
        }
      }
      return;
    }
    if (Math.hypot(a.x-t.x, a.y-t.y) < t.r) {
      t.hit=true; a.hit=true; a.active=false; arc.shotsHit++;
      if (arc.maxRounds>1) {
        arc.round++;
        if (arc.round>=arc.maxRounds) { levelCleared(); }
        else { setTimeout(function(){
          arc.canFire=true; arc.arrows=[];
          if(arc.lvl===1) setupMediantRound();
          if(arc.lvl===5) setupTongueRound();
        },400); }
      } else { levelCleared(); }
    }
  });
}

function onArrowStopped(a) {
  if (a.hit) return;
  if (arc.lvl===3 && a.x>30 && a.x<arc.W-30 && a.y>30 && a.y<arc.H-30) {
    arc.stuckArrows.push({x:a.x, y:a.y});
    if (arc.stuckArrows.length>=2) {
      var l=arc.stuckArrows[arc.stuckArrows.length-1];
      var p=arc.stuckArrows[arc.stuckArrows.length-2];
      if (Math.hypot(l.x-p.x, l.y-p.y)<40) {
        arc.targets[0].hit=true; arc.shotsHit++;
        levelCleared(); return;
      }
    }
  }
  arc.canFire = true;
}

function levelCleared() { arc.state = "cleared"; }

// ── rendering ─────────────────────────────────────────────────────────────

function archeryLoop() {
  var ctx=arc.ctx, W=arc.W, H=arc.H, lvl=arc.lvl;
  var accent=_css("--accent"), dim=_css("--dim");
  var grid=_css("--grid"), fg=_css("--fg"), bg=_css("--bg");
  var font=_fontFace();
  ctx.clearRect(0,0,W,H); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // ── intro ──
  if (arc.state==="intro") {
    drawArcheryGrid(ctx,W,H,grid);
    drawGoldenSpiral(ctx,W*0.15,H*0.8,dim,0.8);
    drawGoldenSpiral(ctx,W*0.85,H*0.2,dim,-0.8);
    var lv=ARCHERY_LEVELS[lvl];
    ctx.textAlign="center";
    ctx.fillStyle=accent; ctx.font="bold 22px "+font;
    ctx.fillText("\u00a7"+(lvl+1)+"  "+lv.title, W/2, H*0.28);
    ctx.fillStyle=fg; ctx.font="15px "+font;
    var briefLines=lv.brief.split("\n");
    briefLines.forEach(function(l,i){ctx.fillText(l,W/2,H*0.36+i*24);});
    ctx.fillStyle=accent; ctx.font="bold 12px "+font;
    ctx.fillText(lv.adds, W/2, H*0.36+briefLines.length*24+14);
    ctx.fillStyle=dim; ctx.font="13px "+font;
    ctx.fillText(lv.eq, W/2, H*0.58);
    drawArtemis(ctx,W/2-80,H*0.73,0,accent,true);
    // crescent moon
    ctx.fillStyle=accent; ctx.beginPath();
    ctx.arc(W/2+60,H*0.73,18,0,Math.PI*2);
    ctx.arc(W/2+67,H*0.73,16,0,Math.PI*2,true);
    ctx.fill();
    ctx.fillStyle=dim; ctx.font="11px "+font;
    ctx.fillText("click or SPACE to begin",W/2,H*0.90);
    _archeryRAF=requestAnimationFrame(archeryLoop); return;
  }

  // ── cleared ──
  if (arc.state==="cleared") {
    drawArcheryGrid(ctx,W,H,grid);
    arc.arrows.forEach(function(a){drawTrail(ctx,a.trail,_css("--ok"));});
    drawGoldenSpiral(ctx,W*0.5,H*0.5,_css("--ok"),1.2);
    var lv2=ARCHERY_LEVELS[lvl];
    ctx.textAlign="center";
    ctx.fillStyle=_css("--ok"); ctx.font="bold 20px "+font;
    ctx.fillText("\u2713  "+lv2.title, W/2, H*0.35);
    ctx.fillStyle=fg; ctx.font="16px "+font;
    ctx.fillText(lv2.eq, W/2, H*0.48);
    ctx.fillStyle=accent; ctx.font="13px "+font;
    ctx.fillText('"'+lv2.hint+'"', W/2, H*0.58);
    ctx.fillStyle=dim; ctx.font="11px "+font;
    ctx.fillText(lvl<6?"click or SPACE \u2192 next":"\u03c6 \u00b7 \u03c8 = 1 \u2014 the map contains the territory",W/2,H*0.72);
    _archeryRAF=requestAnimationFrame(archeryLoop); return;
  }

  // ── playing ──
  arc.time++;

  // oscillating target (phase 2)
  if (lvl===2 && arc.targets[0]) {
    var K=Math.min(1,arc.time*0.0003);
    var amp=arc.H*0.3*(1-K*0.9);
    var freq=0.04*(1-K*0.8);
    arc.targets[0].y = arc.H*0.5 + amp*Math.sin(arc.time*freq);
  }

  // step arrows
  arc.arrows.forEach(function(a) {
    if (!a.active) return;
    var was = a.active;
    stepArrow(a);
    if (a.active) checkHits(a);
    if (was && !a.active && !a.hit) onArrowStopped(a);
  });

  // draw
  drawArcheryGrid(ctx,W,H,grid);

  // golden spirals for artemis aesthetic
  var aes = document.documentElement.getAttribute("data-aesthetic");
  if (aes==="artemis") {
    drawGoldenSpiral(ctx,W*0.12,H*0.85,grid,0.6);
    drawGoldenSpiral(ctx,W*0.88,H*0.15,grid,-0.6);
  }

  // posts (mediants)
  arc.posts.forEach(function(p) {
    ctx.strokeStyle=dim; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(arc.W*0.6,p.y); ctx.lineTo(arc.W*0.95,p.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=dim; ctx.font="12px "+font; ctx.textAlign="right";
    ctx.fillText(p.label, arc.W*0.58, p.y+4);
  });

  // walls
  arc.walls.forEach(function(w) {
    ctx.fillStyle=dim;
    var y=0;
    w.gaps.forEach(function(g) { if(g.y>y) ctx.fillRect(w.x,y,w.w,g.y-y); y=g.y+g.h; });
    if (y<H) ctx.fillRect(w.x,y,w.w,H-y);
  });

  // stuck arrows (gravity wells)
  arc.stuckArrows.forEach(function(sa,i) {
    ctx.strokeStyle=accent; ctx.lineWidth=0.5;
    [25,50,80].forEach(function(r) {
      ctx.globalAlpha=0.15; ctx.beginPath(); ctx.arc(sa.x,sa.y,r,0,Math.PI*2); ctx.stroke();
    });
    ctx.globalAlpha=1; ctx.fillStyle=accent;
    ctx.beginPath(); ctx.arc(sa.x,sa.y,4,0,Math.PI*2); ctx.fill();
    ctx.font="9px "+font; ctx.textAlign="center";
    ctx.fillText("x"+(i+1), sa.x, sa.y-10);
  });

  // attractor rings (phase 6)
  if (arc.attractor) {
    ctx.strokeStyle=accent; ctx.lineWidth=0.5;
    for (var r=20;r<250;r+=35) {
      ctx.globalAlpha=0.1; ctx.beginPath();
      ctx.arc(arc.attractor.x,arc.attractor.y,r,0,Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  // targets
  var ok = _css("--ok");
  arc.targets.forEach(function(t, i) {
    if (t.hit) {
      ctx.strokeStyle=ok; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(t.x,t.y,t.r,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=ok; ctx.font="11px "+font; ctx.textAlign="center";
      ctx.fillText("\u2713 "+t.label, t.x, t.y-t.r-8);
    } else {
      var pulse = 1+0.08*Math.sin(arc.time*0.08);
      ctx.strokeStyle=accent; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(t.x,t.y,t.r*pulse,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(t.x,t.y,t.r*0.35,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=accent; ctx.font="11px "+font; ctx.textAlign="center";
      ctx.fillText(t.label, t.x, t.y-t.r-8);
    }
    // band overlay
    if (t.bandH!=null) {
      ctx.fillStyle=accent;
      ctx.globalAlpha=arc.bandsHit.has(i)?0.12:0.04;
      ctx.fillRect(0,t.y-t.bandH,W,t.bandH*2);
      ctx.globalAlpha=1;
      ctx.strokeStyle=arc.bandsHit.has(i)?ok:dim;
      ctx.lineWidth=0.5; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(0,t.y-t.bandH); ctx.lineTo(W,t.y-t.bandH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,t.y+t.bandH); ctx.lineTo(W,t.y+t.bandH); ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // arrow trails
  arc.arrows.forEach(function(a) { drawTrail(ctx,a.trail,a.hit?ok:accent); });

  // active arrow head
  var active = arc.arrows.find(function(a){return a.active;});
  if (active) {
    ctx.fillStyle=accent;
    ctx.beginPath(); ctx.arc(active.x,active.y,3,0,Math.PI*2); ctx.fill();
  }

  // Artemis
  drawArtemis(ctx, arc.artemisX, arc.artemisY, arc.aimAngle, accent, arc.canFire);

  // geodesic preview
  if (arc.canFire) {
    var px=arc.artemisX+32*Math.cos(arc.aimAngle);
    var py=arc.artemisY+32*Math.sin(arc.aimAngle);
    var pvx=arc.speed*Math.cos(arc.aimAngle);
    var pvy=arc.speed*Math.sin(arc.aimAngle);
    ctx.fillStyle=accent;
    for (var pi=0;pi<70;pi++) {
      var pf=getForces(px,py); pvx+=pf[0]; pvy+=pf[1]; px+=pvx; py+=pvy;
      if (px<0||px>W||py<0||py>H) break;
      if (pi%3===0) {
        ctx.globalAlpha=0.25*(1-pi/70);
        ctx.beginPath(); ctx.arc(px,py,1.5,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  }

  // HUD
  var lv3=ARCHERY_LEVELS[lvl];
  ctx.fillStyle=accent; ctx.font="11px "+font; ctx.textAlign="left";
  ctx.fillText(lv3.eq, 12, 18);
  ctx.textAlign="right"; ctx.fillStyle=dim;
  ctx.fillText("\u00a7"+(lvl+1)+" "+lv3.title, W-12, 18);
  if (arc.maxRounds>1) ctx.fillText("round "+(arc.round+1)+"/"+arc.maxRounds, W-12, 32);
  if (lvl===2) ctx.fillText("K = "+Math.min(1,arc.time*0.0003).toFixed(3), W-12, 32);
  if (lvl===3) ctx.fillText("iterations: "+arc.stuckArrows.length, W-12, 32);
  ctx.fillStyle=dim; ctx.font="11px "+font; ctx.textAlign="center";
  ctx.fillText(lv3.hint, W/2, H-12);
  ctx.textAlign="left"; ctx.fillText("[R] reset  [Tab] skip", 12, H-12);

  _archeryRAF = requestAnimationFrame(archeryLoop);
}

// ── draw helpers ──────────────────────────────────────────────────────────

function drawArcheryGrid(ctx, W, H, color) {
  ctx.strokeStyle=color; ctx.lineWidth=0.5;
  if (arc.attractor) {
    var ax=arc.attractor.x, ay=arc.attractor.y, st=arc.attractor.strength;
    var gy, gx;
    for (gy=0;gy<=H;gy+=50) {
      ctx.beginPath();
      for (gx=0;gx<=W;gx+=6) {
        var dx=gx-ax,dy=gy-ay,d=Math.sqrt(dx*dx+dy*dy)||1;
        var warp=Math.min(45,st*0.07/d);
        var wy=gy+dy/d*warp;
        gx===0?ctx.moveTo(gx,wy):ctx.lineTo(gx,wy);
      }
      ctx.stroke();
    }
    for (gx=0;gx<=W;gx+=50) {
      ctx.beginPath();
      for (gy=0;gy<=H;gy+=6) {
        var dx2=gx-ax,dy2=gy-ay,d2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
        var warp2=Math.min(45,st*0.07/d2);
        var wx=gx+dx2/d2*warp2;
        gy===0?ctx.moveTo(wx,gy):ctx.lineTo(wx,gy);
      }
      ctx.stroke();
    }
  } else {
    for (var y=50;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    for (var x=50;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  }
}

function drawGoldenSpiral(ctx, cx, cy, color, scale) {
  ctx.strokeStyle=color; ctx.lineWidth=0.8; ctx.globalAlpha=0.12;
  ctx.beginPath();
  var b=Math.log(1.618)/(Math.PI/2), dir=scale>0?1:-1, s=Math.abs(scale);
  for (var t=0;t<Math.PI*10;t+=0.04) {
    var r=s*Math.exp(b*t);
    var x=cx+r*Math.cos(t*dir), y=cy+r*Math.sin(t*dir);
    t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    if(r>900) break;
  }
  ctx.stroke(); ctx.globalAlpha=1;
}

function drawTrail(ctx, trail, color) {
  if (trail.length<2) return;
  var len=trail.length;
  ctx.strokeStyle=color;
  for (var i=1;i<len;i++) {
    ctx.globalAlpha=(i/len)*0.5;
    ctx.lineWidth=0.5+1.5*(i/len);
    ctx.beginPath();
    ctx.moveTo(trail[i-1].x, trail[i-1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}

function drawArtemis(ctx, x, y, angle, color, armed) {
  ctx.save(); ctx.translate(x,y);
  ctx.strokeStyle=color; ctx.lineWidth=1.5;
  // head
  ctx.beginPath(); ctx.arc(0,-20,5,0,Math.PI*2); ctx.stroke();
  // crescent moon diadem
  ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(0,-20,7,Math.PI+0.5,-0.5); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6,-24); ctx.lineTo(-4,-33);
  ctx.moveTo(6,-24); ctx.lineTo(4,-33);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1.5,-26); ctx.lineTo(0,-38); ctx.lineTo(1.5,-26); ctx.stroke();
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(0,-37,3.5,0,Math.PI*2);
  ctx.arc(1.2,-38,3,0,Math.PI*2,true);
  ctx.fill();
  // body
  ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(0,8); ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(0,8); ctx.lineTo(-5,20);
  ctx.moveTo(0,8); ctx.lineTo(5,20);
  ctx.stroke();
  // bow arm
  ctx.save(); ctx.translate(0,-5); ctx.rotate(angle);
  ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(10,0,14,-0.65,0.65); ctx.stroke();
  var sx=10+14*Math.cos(0.65), sy=14*Math.sin(0.65);
  ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(sx,-sy); ctx.lineTo(armed?-2:5,0); ctx.lineTo(sx,sy); ctx.stroke();
  if (armed) {
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(28,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(22,-3); ctx.moveTo(28,0); ctx.lineTo(22,3); ctx.stroke();
  }
  ctx.restore(); ctx.restore();
}
