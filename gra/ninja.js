/* ==========================================================
   MATCHA NINJA - silnik gry
   Do góry lecą liście herbaty, kubki i miotełki do matchy.
   Przeciągasz palcem (albo myszą z wciśniętym przyciskiem),
   żeby je pociąć na proszek. Kostek cukru nie tnij!
   - liść = 1 pkt, kubek = 2 pkt, miotełka = 3 pkt
   - 3 lub więcej rzeczy jednym cięciem = bonus (combo)
   - 3 życia: tracisz je za każdą rzecz, która spadnie niepocięta,
     i za każdą przeciętą kostkę cukru
   Fizyka liczona w stałym kroku 1/120 s (tak samo na każdym ekranie).
   Ustawienia trudności są w obiekcie TUNING poniżej.
   ========================================================== */

(function () {
  var TUNING = {
    H: 600,              // wysokość świata gry (szerokość liczy się z ekranu)
    gravity: 560,        // px/s²
    lives: 3,
    waveEvery: 1.7,      // s między rzutami na starcie
    waveEveryMin: 0.8,
    waveFaster: 0.012,   // o tyle s szybciej za każdy punkt
    maxPerWave: 5,
    sugarFrom: 8,        // od tylu punktów pojawia się cukier
    sugarChance: 0.22,   // najwyższa szansa na cukier w rzucie
    comboMin: 3,         // tyle rzeczy jednym cięciem daje bonus
    points: { leaf: 1, cup: 2, whisk: 3 },
    radius: { leaf: 26, cup: 30, whisk: 30, sugar: 24 }
  };

  var STEP = 1 / 120;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* odległość punktu (px, py) od odcinka a-b */
  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
    var x = ax + dx * t - px, y = ay + dy * t - py;
    return Math.sqrt(x * x + y * y);
  }

  function start(canvas, opts) {
    var ctx = canvas.getContext("2d");
    var T = TUNING;
    var text = opts.text || function (k) { return k; };
    var palette = (opts.colors && opts.colors.length) ? opts.colors : ["#e8a13a", "#3f8fd6", "#8b62c2", "#de5f97"];
    var storeBest = opts.saveBest || function () {};
    var best = +(opts.loadBest ? opts.loadBest() : 0) || 0;
    var onStart = opts.onStart || function () {};
    var onGameOver = opts.onGameOver || function () {};
    var canRestart = opts.canRestart || function () { return true; };
    var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    var W = 360, H = T.H, scale = 1, dpr = 1;
    var state, items, halves, particles, puffs, stains, popups, misses, score, lives, newBest;
    var time = 0, playStart = 0, deadTime = 0, nextWave = 0, shake = 0, flash = 0, flashColor = "255,255,255";
    var startLeaf = null, bg = [];
    var blade = [], down = false, strokeCut = 0, strokePts = 0, strokeX = 0, strokeY = 0, lastMove = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      scale = canvas.height / H;
      W = canvas.width / scale;
      if (startLeaf) { startLeaf.x = W / 2; }
    }

    function reset() {
      state = "ready";
      items = [];
      halves = [];
      particles = [];
      puffs = [];
      stains = [];
      popups = [];
      misses = [];
      score = 0;
      lives = T.lives;
      newBest = false;
      startLeaf = { type: "leaf", x: W / 2, y: H * 0.5, r: 44, rot: -0.4, vr: 0, big: 1.7, cut: false };
    }

    function initBg() {
      bg = [];
      for (var i = 0; i < 6; i++) bg.push({ x: rand(0, 500), y: rand(0, H), s: rand(0.6, 1.2), rot: rand(0, 6.28), vr: rand(-0.4, 0.4), v: rand(8, 18) });
    }

    /* ---------- rzuty ---------- */
    function pickType() {
      var sugarP = score < T.sugarFrom ? 0 : Math.min(T.sugarChance, 0.08 + (score - T.sugarFrom) * 0.004);
      var r = Math.random();
      if (r < sugarP) return "sugar";
      r = Math.random();
      if (r < 0.14) return "whisk";
      if (r < 0.45) return "cup";
      return "leaf";
    }

    function toss(type) {
      var g = currentGravity();
      var x = rand(W * 0.12, W * 0.88);
      var apex = rand(H * 0.12, H * 0.42);
      var y0 = H + 40;
      var vy = -Math.sqrt(2 * g * (y0 - apex));
      var flight = 2 * (-vy) / g;
      var tx = rand(W * 0.25, W * 0.75);
      var vx = clamp((tx - x) / flight * 1.6, -140, 140);
      items.push({
        type: type, x: x, y: y0, vx: vx, vy: vy, rot: rand(0, 6.28), vr: rand(-3, 3),
        r: T.radius[type], color: palette[Math.floor(Math.random() * palette.length)], cut: false
      });
    }

    function currentGravity() { return T.gravity * (1 + Math.min(0.35, score * 0.004)); }

    function wave() {
      var n = 1 + Math.floor(Math.random() * Math.min(T.maxPerWave, 1 + score / 12));
      var sugars = 0;
      for (var i = 0; i < n; i++) {
        var t = pickType();
        if (t === "sugar" && (sugars >= 1 + Math.floor(score / 60) || n === 1)) t = "leaf";
        if (t === "sugar") sugars++;
        // rzuty w jednej fali odrobinę po sobie, żeby nie leciały jak jeden klocek
        (function (type, delay) { pendingTosses.push({ at: time + delay, type: type }); })(t, i * rand(0.08, 0.22));
      }
      nextWave = time + Math.max(T.waveEveryMin, T.waveEvery - score * T.waveFaster) + rand(-0.15, 0.25);
    }
    var pendingTosses = [];

    function begin() {
      reset();
      startLeaf = null;
      state = "play";
      playStart = time;
      nextWave = time + 0.5;
      pendingTosses = [];
      onStart();
    }

    function die() {
      if (state !== "play") return;
      state = "dead";
      deadTime = time;
      if (score > best) { best = score; newBest = true; storeBest(best); }
      var finalScore = score, duration = Math.max(0, time - playStart);
      setTimeout(function () { onGameOver(finalScore, duration); }, 0);
    }

    function loseLife(x, y) {
      lives = Math.max(0, lives - 1);
      misses.push({ x: clamp(x, 30, W - 30), y: y, life: 1.2 });
      if (!calm) shake = Math.max(shake, 0.35);
      if (lives <= 0) die();
    }

    /* ---------- cięcie ---------- */
    function slice(it, ax, ay, bx, by) {
      it.cut = true;
      var ang = Math.atan2(by - ay, bx - ax);
      var nx = -Math.sin(ang), ny = Math.cos(ang);
      for (var s = -1; s <= 1; s += 2) {
        halves.push({
          type: it.type, color: it.color, x: it.x, y: it.y, r: it.r, rot: it.rot, side: s, cutAng: ang,
          vx: it.vx * 0.6 + nx * s * 70, vy: Math.min(it.vy, 0) * 0.4 + ny * s * 70 - 60, vr: it.vr + s * 2, spin: 0, life: 1.6
        });
      }
      if (it.type === "sugar") {
        for (var i = 0; i < 16; i++) {
          var a = rand(0, 6.28), sp = rand(60, 240);
          particles.push({ x: it.x, y: it.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: rand(0.4, 0.8), max: 0.8, r: rand(1.5, 3.5), c: i % 2 ? "#ffffff" : "#f1e7d0" });
        }
        flash = 1; flashColor = "178,69,46";
        popups.push({ x: it.x, y: it.y - 30, t: text("ninja.noSugar"), life: 1.2, c: "#b2452e", size: 26 });
        if (state === "play") loseLife(it.x, it.y);
        return 0;
      }
      // proszek matchy
      for (var j = 0; j < 22; j++) {
        var b = rand(0, 6.28), v = rand(40, 230);
        particles.push({ x: it.x, y: it.y, vx: Math.cos(b) * v, vy: Math.sin(b) * v - 50, life: rand(0.5, 1), max: 1, r: rand(1.5, 4), c: j % 3 === 0 ? "#cfe0a0" : j % 3 === 1 ? "#7a9a3a" : "#5f7d2a" });
      }
      puffs.push({ x: it.x, y: it.y, r: it.r * 0.8, life: 0.6, max: 0.6 });
      stains.push({ x: it.x, y: it.y, r: rand(18, 30), life: 3, max: 3, seed: Math.random() * 6.28 });
      if (stains.length > 14) stains.shift();
      var pts = T.points[it.type] || 1;
      if (state === "play") {
        score += pts;
        popups.push({ x: it.x, y: it.y - 26, t: "+" + pts, life: 0.8, c: "#4f6b22", size: 22 });
      }
      return 1;
    }

    function cutSegment(ax, ay, bx, by) {
      var len = Math.hypot(bx - ax, by - ay);
      if (len < 1.5) return;
      strokePts += len;
      if (state === "ready" || state === "dead") {
        if (startLeaf && !startLeaf.cut && strokePts > 25 && segDist(startLeaf.x, startLeaf.y, ax, ay, bx, by) < startLeaf.r) {
          if (state === "dead") { if (time - deadTime < 0.8 || !canRestart()) return; }
          slice(startLeaf, ax, ay, bx, by);
          halves.forEach(function (h) { if (h.r === startLeaf.r) h.big = startLeaf.big; });
          begin();
        }
        return;
      }
      if (state !== "play") return;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.cut || it.y > H + 10) continue;
        if (segDist(it.x, it.y, ax, ay, bx, by) < it.r + 4) {
          var ok = slice(it, ax, ay, bx, by);
          if (ok) { strokeCut++; strokeX = it.x; strokeY = it.y; }
          if (state !== "play") return;
        }
      }
    }

    function endStroke() {
      if (strokeCut >= T.comboMin && state === "play") {
        var bonus = strokeCut - 1;
        score += bonus;
        popups.push({ x: clamp(strokeX, 80, W - 80), y: clamp(strokeY - 60, 80, H - 80), t: text("ninja.combo").replace("{n}", strokeCut) + " +" + bonus, life: 1.3, c: "#e8a13a", size: 30 });
      }
      strokeCut = 0;
      strokePts = 0;
    }

    /* ---------- aktualizacja ---------- */
    function update(dt) {
      time += dt;
      if (shake > 0) shake = Math.max(0, shake - dt);
      if (flash > 0) flash = Math.max(0, flash - dt * 2.5);

      bg.forEach(function (l) {
        l.y += l.v * dt;
        l.x += Math.sin(time * 0.7 + l.s * 10) * 10 * dt;
        l.rot += l.vr * dt;
        if (l.y > H + 30) { l.y = -30; l.x = rand(0, W); }
      });

      if (startLeaf) {
        startLeaf.rot = -0.4 + Math.sin(time * 2) * 0.12;
        startLeaf.y = H * 0.5 + Math.sin(time * 2.4) * 8;
        if (state === "dead" && !startLeaf.cut) startLeaf.y = H * 0.68 + Math.sin(time * 2.4) * 6;
      }

      if (state === "play") {
        if (time >= nextWave) wave();
        for (var p = pendingTosses.length - 1; p >= 0; p--) {
          if (time >= pendingTosses[p].at) { toss(pendingTosses[p].type); pendingTosses.splice(p, 1); }
        }
      }

      var g = currentGravity();
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.vy += g * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
        if (it.x < it.r && it.vx < 0) it.vx = -it.vx * 0.6;
        if (it.x > W - it.r && it.vx > 0) it.vx = -it.vx * 0.6;
        if (it.cut) { items.splice(i, 1); continue; }
        if (it.vy > 0 && it.y > H + it.r + 10) {
          items.splice(i, 1);
          if (it.type !== "sugar" && state === "play") loseLife(it.x, H - 40);
        }
      }

      for (var h = halves.length - 1; h >= 0; h--) {
        var q = halves[h];
        q.vy += g * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.spin += q.vr * dt * 0.5;
        q.life -= dt;
        if (q.life <= 0 || q.y > H + 80) halves.splice(h, 1);
      }

      for (var j = particles.length - 1; j >= 0; j--) {
        var z = particles[j];
        z.life -= dt;
        if (z.life <= 0) { particles.splice(j, 1); continue; }
        z.vy += 420 * dt;
        z.vx *= 1 - dt * 1.5;
        z.x += z.vx * dt;
        z.y += z.vy * dt;
      }
      for (var k = puffs.length - 1; k >= 0; k--) { puffs[k].life -= dt; puffs[k].r += 90 * dt; if (puffs[k].life <= 0) puffs.splice(k, 1); }
      for (var s = stains.length - 1; s >= 0; s--) { stains[s].life -= dt; if (stains[s].life <= 0) stains.splice(s, 1); }
      for (var m = popups.length - 1; m >= 0; m--) { popups[m].life -= dt; popups[m].y -= 30 * dt; if (popups[m].life <= 0) popups.splice(m, 1); }
      for (var n = misses.length - 1; n >= 0; n--) { misses[n].life -= dt; if (misses[n].life <= 0) misses.splice(n, 1); }

      // ślad ostrza znika po chwili; po przerwie w ruchu liczymy nowe cięcie (combo)
      while (blade.length && time - blade[0].t > 0.16) blade.shift();
      if (strokeCut && time - lastMove > 0.25) endStroke();

      // po końcu gry pojawia się nowy liść do przecięcia
      if (state === "dead" && !startLeaf && time - deadTime > 0.8) {
        startLeaf = { type: "leaf", x: W / 2, y: H * 0.68, r: 40, rot: -0.4, vr: 0, big: 1.55, cut: false };
      }
    }

    /* ---------- rysowanie przedmiotów ---------- */
    function leafShape(c) {
      c.beginPath();
      c.moveTo(-26, 0);
      c.bezierCurveTo(-14, -16, 12, -17, 27, 0);
      c.bezierCurveTo(12, 17, -14, 16, -26, 0);
      c.closePath();
    }
    function drawLeaf(c) {
      leafShape(c);
      var g = c.createLinearGradient(0, -16, 0, 16);
      g.addColorStop(0, "#9dbb52");
      g.addColorStop(1, "#5f8a2c");
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = "#4f6b22";
      c.lineWidth = 2;
      c.stroke();
      c.strokeStyle = "rgba(230, 240, 190, 0.85)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-24, 0); c.quadraticCurveTo(0, -2, 25, 0);
      for (var i = -12; i <= 12; i += 8) { c.moveTo(i, -1); c.lineTo(i + 6, -9); c.moveTo(i, 0); c.lineTo(i + 6, 8); }
      c.stroke();
      // ogonek
      c.strokeStyle = "#4f6b22";
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.beginPath(); c.moveTo(-26, 0); c.lineTo(-33, 3); c.stroke();
    }

    function cupPath(c) {
      c.beginPath();
      c.moveTo(-20, -25);
      c.lineTo(20, -25);
      c.lineTo(15, 22);
      c.quadraticCurveTo(14.5, 25, 11, 25);
      c.lineTo(-11, 25);
      c.quadraticCurveTo(-14.5, 25, -15, 22);
      c.closePath();
    }
    function drawCup(c, col) {
      c.save();
      cupPath(c);
      c.clip();
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.fillRect(-30, -30, 60, 60);
      c.fillStyle = "#7a9a3a";
      c.fillRect(-30, -9, 60, 40);
      c.fillStyle = "#cfe0a0";
      c.fillRect(-30, -11, 60, 4);
      c.fillStyle = col;
      c.globalAlpha = 0.25;
      c.fillRect(-30, -30, 60, 60);
      c.globalAlpha = 1;
      c.fillRect(-30, 4, 60, 11);
      c.fillStyle = "rgba(255,255,255,0.45)";
      c.fillRect(-13, -22, 4, 40);
      c.restore();
      c.strokeStyle = col;
      c.lineWidth = 2.5;
      c.lineJoin = "round";
      cupPath(c);
      c.stroke();
      c.fillStyle = col;
      c.beginPath();
      if (c.roundRect) c.roundRect(-22, -28, 44, 4, 2); else c.rect(-22, -28, 44, 4);
      c.fill();
    }

    /* miotełka do matchy (chasen): bambusowa rączka i cienkie wąsy */
    function drawWhisk(c) {
      c.lineCap = "round";
      // wąsy
      c.strokeStyle = "#d9c08a";
      c.lineWidth = 1.6;
      for (var i = -7; i <= 7; i++) {
        var x = i * 2.3;
        c.beginPath();
        c.moveTo(x * 0.35, -2);
        c.quadraticCurveTo(x * 1.5, 12, x * 1.1, 28);
        c.stroke();
      }
      c.strokeStyle = "#b89a5a";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 26, 15, 4, 0, 0, Math.PI * 2);
      c.stroke();
      // rączka
      var g = c.createLinearGradient(-6, 0, 6, 0);
      g.addColorStop(0, "#b8975a");
      g.addColorStop(0.5, "#e6d1a0");
      g.addColorStop(1, "#a7854b");
      c.fillStyle = g;
      c.beginPath();
      if (c.roundRect) c.roundRect(-6, -30, 12, 30, 4); else c.rect(-6, -30, 12, 30);
      c.fill();
      c.fillStyle = "#8f6f3a";
      c.fillRect(-7, -16, 14, 3);
      c.fillStyle = "#7a9a3a";
      c.fillRect(-6, -4, 12, 3);
    }

    /* kostka cukru: biała, z kryształkami i czerwonym znakiem „nie” */
    function drawSugar(c) {
      c.fillStyle = "#ffffff";
      c.strokeStyle = "#c9bfae";
      c.lineWidth = 2;
      c.beginPath();
      if (c.roundRect) c.roundRect(-18, -18, 36, 36, 6); else c.rect(-18, -18, 36, 36);
      c.fill();
      c.stroke();
      c.fillStyle = "#ece5d6";
      c.beginPath();
      c.moveTo(-18, -8); c.lineTo(-8, -18); c.lineTo(18, -18); c.lineTo(18, -12); c.lineTo(-12, -12); c.closePath();
      c.fill();
      c.fillStyle = "#dcd3c2";
      [[-8, 2], [6, -2], [-2, 10], [10, 9], [-11, -4]].forEach(function (p) { c.fillRect(p[0], p[1], 2.5, 2.5); });
      c.strokeStyle = "#b2452e";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, 25, 0, Math.PI * 2);
      c.moveTo(-17, -17); c.lineTo(17, 17);
      c.stroke();
    }

    function drawThing(c, it) {
      if (it.type === "leaf") drawLeaf(c);
      else if (it.type === "cup") drawCup(c, it.color);
      else if (it.type === "whisk") drawWhisk(c);
      else drawSugar(c);
    }

    function drawItem(it) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      var s = (it.big || 1) * (it.r / T.radius[it.type]);
      if (it.big) s = it.big;
      ctx.scale(s, s);
      drawThing(ctx, it);
      ctx.restore();
    }

    function drawHalf(q) {
      ctx.save();
      ctx.globalAlpha = clamp(q.life / 0.5, 0, 1);
      ctx.translate(q.x, q.y);
      ctx.rotate(q.cutAng + q.spin * q.side);
      ctx.beginPath();
      ctx.rect(-80, q.side < 0 ? -80 : 0, 160, 80);
      ctx.clip();
      ctx.rotate(-q.cutAng + q.rot);
      var s = q.big || 1;
      ctx.scale(s, s);
      drawThing(ctx, q);
      ctx.restore();
    }

    /* ---------- tło ---------- */
    function drawBackground() {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#f7f2e6");
      g.addColorStop(1, "#e3ecc8");
      ctx.fillStyle = g;
      ctx.fillRect(-20, -20, W + 40, H + 40);
      // mata z bambusa (poziome listewki na dole)
      for (var y = H - 120, i = 0; y < H + 10; y += 12, i++) {
        ctx.fillStyle = i % 2 ? "rgba(185, 160, 105, 0.22)" : "rgba(160, 135, 85, 0.22)";
        ctx.fillRect(-20, y, W + 40, 12);
      }
      // duże koło (jak miseczka z góry)
      ctx.strokeStyle = "rgba(122, 154, 58, 0.12)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.42, Math.min(W, H) * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      bg.forEach(function (l) {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.scale(l.s * 0.5, l.s * 0.5);
        ctx.globalAlpha = 0.18;
        drawLeaf(ctx);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      // plamy proszku po cięciu
      stains.forEach(function (s) {
        ctx.globalAlpha = clamp(s.life / s.max, 0, 1) * 0.35;
        ctx.fillStyle = "#7a9a3a";
        ctx.beginPath();
        for (var a = 0; a < 6.28; a += 0.5) {
          var rr = s.r * (0.75 + 0.25 * Math.sin(a * 3 + s.seed));
          ctx.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawParticles() {
      puffs.forEach(function (p) {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1) * 0.45;
        ctx.fillStyle = "#a9c46a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      particles.forEach(function (q) {
        ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
        ctx.fillStyle = q.c;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawBlade() {
      if (blade.length < 2) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 1; i < blade.length; i++) {
          var a = blade[i - 1], b = blade[i];
          var f = i / blade.length;
          ctx.strokeStyle = pass === 0 ? "rgba(79, 107, 34, " + (0.55 * f) + ")" : "rgba(255, 255, 255, " + (0.95 * f) + ")";
          ctx.lineWidth = (pass === 0 ? 11 : 5) * f + 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    function outlinedText(str, x, y, size, fill) {
      ctx.font = "700 " + size + "px Fraunces, Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(3, size / 9);
      ctx.strokeStyle = "rgba(31, 42, 27, 0.85)";
      ctx.lineJoin = "round";
      ctx.strokeText(str, x, y);
      ctx.fillStyle = fill || "#ffffff";
      ctx.fillText(str, x, y);
    }

    function panel(x, y, w, h) {
      ctx.fillStyle = "rgba(255, 253, 247, 0.94)";
      ctx.strokeStyle = "rgba(31, 42, 27, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, 18); else ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
    }

    function drawLives() {
      for (var i = 0; i < T.lives; i++) {
        var x = W - 26 - i * 30, y = 34, on = i < lives;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.5, 0.5);
        ctx.globalAlpha = on ? 1 : 0.3;
        drawCup(ctx, on ? "#7a9a3a" : "#9aa08f");
        ctx.restore();
        if (!on) {
          ctx.strokeStyle = "#b2452e";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9);
          ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9);
          ctx.stroke();
        }
      }
    }

    function drawHUD() {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (state === "play" || state === "dead") {
        ctx.textAlign = "left";
        outlinedText(String(score), 0, 0, 0); // ustawia czcionkę; właściwy napis niżej
        ctx.font = "700 44px Fraunces, Georgia, serif";
        ctx.textAlign = "left";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(31, 42, 27, 0.85)";
        ctx.strokeText(String(score), 18, 40);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(score), 18, 40);
        ctx.textAlign = "center";
        drawLives();
      }
      misses.forEach(function (m) {
        ctx.globalAlpha = clamp(m.life, 0, 1);
        ctx.strokeStyle = "#b2452e";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x - 12, m.y - 12); ctx.lineTo(m.x + 12, m.y + 12);
        ctx.moveTo(m.x + 12, m.y - 12); ctx.lineTo(m.x - 12, m.y + 12);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      popups.forEach(function (p) {
        ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
        outlinedText(p.t, p.x, p.y, p.size, p.c === "#4f6b22" ? "#e6edc9" : p.c);
      });
      ctx.globalAlpha = 1;

      if (state === "ready") {
        outlinedText(text("ninja.title"), W / 2, 110, 40, "#e6edc9");
        var pulse = 0.6 + 0.4 * Math.sin(time * 4);
        ctx.globalAlpha = pulse;
        ctx.font = "600 18px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#1f2a1b";
        ctx.fillText(text("ninja.start"), W / 2, H * 0.5 + 80);
        ctx.globalAlpha = 1;
        if (best > 0) {
          ctx.font = "500 15px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#4b5745";
          ctx.fillText(text("game.best") + ": " + best, W / 2, H * 0.5 + 108);
        }
        drawLegend(H * 0.5 + 150);
      }
      if (state === "dead") {
        var pw = Math.min(280, W - 40), ph = 160;
        var px = (W - pw) / 2, py = H * 0.16;
        panel(px, py, pw, ph);
        ctx.fillStyle = "#1f2a1b";
        ctx.font = "700 28px Fraunces, Georgia, serif";
        ctx.fillText(text("game.over"), W / 2, py + 36);
        ctx.font = "500 15px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#4b5745";
        ctx.fillText(text("game.score"), W / 2 - pw / 4, py + 74);
        ctx.fillText(text("game.best"), W / 2 + pw / 4, py + 74);
        ctx.font = "700 34px Fraunces, Georgia, serif";
        ctx.fillStyle = "#1f2a1b";
        ctx.fillText(String(score), W / 2 - pw / 4, py + 106);
        ctx.fillText(String(best), W / 2 + pw / 4, py + 106);
        if (newBest) {
          ctx.font = "700 14px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#4f6b22";
          ctx.fillText(text("game.newBest"), W / 2, py + 138);
        }
        if (startLeaf && !startLeaf.cut && canRestart()) {
          ctx.font = "600 16px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#1f2a1b";
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 4);
          ctx.fillText(text("ninja.again"), W / 2, startLeaf.y + 62);
          ctx.globalAlpha = 1;
        }
      }
      if (flash > 0) {
        ctx.fillStyle = "rgba(" + flashColor + "," + (flash * 0.35) + ")";
        ctx.fillRect(-20, -20, W + 40, H + 40);
      }
    }

    /* mała legenda na ekranie startowym: co ile punktów i czego nie ciąć */
    function drawLegend(y) {
      var list = [["leaf", "+1"], ["cup", "+2"], ["whisk", "+3"], ["sugar", "✕"]];
      var gap = Math.min(78, (W - 30) / 4);
      var x0 = W / 2 - gap * 1.5;
      list.forEach(function (e, i) {
        var x = x0 + i * gap;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.62, 0.62);
        drawThing(ctx, { type: e[0], color: palette[1 % palette.length] });
        ctx.restore();
        ctx.font = "700 15px Inter, system-ui, sans-serif";
        ctx.fillStyle = e[0] === "sugar" ? "#b2452e" : "#4f6b22";
        ctx.fillText(e[1], x, y + 32);
      });
    }

    function render() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      if (shake > 0) ctx.translate(rand(-5, 5) * shake * 2, rand(-5, 5) * shake * 2);
      drawBackground();
      halves.forEach(drawHalf);
      items.forEach(drawItem);
      if (startLeaf && !startLeaf.cut && (state === "ready" || (state === "dead" && canRestart()))) drawItem(startLeaf);
      drawParticles();
      drawHUD();
      drawBlade();
    }

    /* ---------- pętla ---------- */
    var acc = 0, last = 0, running = true;
    function frame(ts) {
      if (!running) return;
      if (!last) last = ts;
      var dt = Math.min(0.1, (ts - last) / 1000);
      last = ts;
      acc += dt;
      while (acc >= STEP) { update(STEP); acc -= STEP; }
      render();
      requestAnimationFrame(frame);
    }

    /* ---------- sterowanie: przeciąganie palcem albo myszą z wciśniętym przyciskiem ---------- */
    function toWorld(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }
    function move(p) {
      var prev = blade[blade.length - 1];
      blade.push({ x: p.x, y: p.y, t: time });
      if (blade.length > 24) blade.shift();
      lastMove = time;
      if (prev) cutSegment(prev.x, prev.y, p.x, p.y);
    }

    canvas.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var a = document.activeElement;
      if (a && a !== document.body && a.blur) a.blur();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* stary przeglądarka */ }
      down = true;
      endStroke();
      blade = [];
      move(toWorld(e));
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!down) return;
      e.preventDefault();
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (list && list.length) list.forEach(function (ev) { move(toWorld(ev)); });
      else move(toWorld(e));
    });
    function up() { if (down) { down = false; endStroke(); } }
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false }); // żadnego przewijania ani lupy przy cięciu
    document.addEventListener("visibilitychange", function () { last = 0; acc = 0; });

    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    window.addEventListener("resize", resize);

    resize();
    reset();
    initBg();
    requestAnimationFrame(frame);

    return {
      setColors: function (c) { if (c && c.length) palette = c; },
      /* rekord do pokazania w grze (np. po zmianie nicku), bez przeładowania strony */
      setBest: function (v) { best = +v || 0; newBest = false; },
      _debug: function () {
        return { state: state, score: score, lives: lives, items: items.map(function (i) { return { type: i.type, x: i.x, y: i.y, r: i.r }; }), start: startLeaf && !startLeaf.cut ? { x: startLeaf.x, y: startLeaf.y } : null, W: W, H: H };
      }
    };
  }

  window.MatchaNinja = { start: start, TUNING: TUNING };
})();
