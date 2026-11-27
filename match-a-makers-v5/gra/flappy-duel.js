/* ==========================================================
   MATCHA FLAP - DUEL (kopia silnika tylko dla podzakładki Duel)
   Zwykła gra solo to gra/flappy.js i ten plik jej NIE zmienia.
   Fizyka, wygląd i trudność są te same co w flappy.js.
   Różnice:
   - bambusy losuje "ziarno" (seed), więc obie osoby mają ten sam tor,
   - start daje strona duela (go), nie stuknięcie; po końcu nie ma restartu,
   - na torze widać półprzezroczysty kubek przeciwnika (setGhost),
   - nie zapisuje rekordu i nie dotyka rankingu.
   Ustawienia trudności bierze z flappy.js (MatchaFlap.TUNING), jeśli jest
   wczytany, więc zmiana trudności w flappy.js działa też w duelu.
   ========================================================== */

(function () {
  var TUNING = (window.MatchaFlap && window.MatchaFlap.TUNING) || {
    H: 600,              // wysokość świata gry (szerokość liczy się z ekranu)
    gravity: 1550,       // px/s²
    flap: -440,          // prędkość po stuknięciu (minus = w górę)
    maxFall: 720,
    speed: 150,          // prędkość bambusów na starcie
    speedPerPoint: 3,
    speedMax: 235,
    gap: 178,            // przerwa między bambusami na starcie
    gapPerPoint: 1.6,
    gapMin: 138,
    spacing: 225,        // odstęp między kolejnymi parami bambusów
    pipeW: 62,
    ground: 70
  };

  var STEP = 1 / 120;

  function hexToRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," + Math.round(A[1] + (B[1] - A[1]) * t) + "," + Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  }
  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* losowanie z ziarna: to samo ziarno = te same bambusy u obu osób */
  function makeRng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function start(canvas, opts) {
    var ctx = canvas.getContext("2d");
    var T = TUNING;
    var text = opts.text || function (k) { return k; };
    var palette = (opts.colors && opts.colors.length) ? opts.colors : ["#e2654a", "#e8a13a", "#3f8fd6", "#8b62c2", "#de5f97", "#38557f"];
    var onFlap = opts.onFlap || function () {};

    var W = 360, H = T.H, scale = 1, dpr = 1;
    var state, player, pipes, particles, leaves, score, colorIdx, colorFrom, colorT, deadTime, flash, groundX, hillX, time, readyBob, playStart;
    var onStart = opts.onStart || function () {};
    var onGameOver = opts.onGameOver || function () {};

    // duel: tor z ziarna, przebyta droga (do ustawienia ducha) i duch przeciwnika
    var FIRST = 292;      // pierwszy bambus tyle przed kubkiem (jak w grze solo przy zwykłej ramce)
    var rng = makeRng(1), pipeCount = 0, dist = 0;
    var ghost = null, ghostDraw = null;

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      scale = canvas.height / H;
      W = canvas.width / scale;
      if (player && state === "ready") player.x = W * 0.3;
    }

    function reset() {
      state = "ready";
      player = { x: W * 0.3, y: H * 0.42, vy: 0, angle: 0, slosh: 0, sloshV: 0 };
      pipes = [];
      particles = [];
      score = 0;
      colorIdx = 0;
      colorFrom = palette[0];
      colorT = 1;
      deadTime = 0;
      flash = 0;
      pipeCount = 0;
      dist = 0;
      ghostDraw = null;
      readyBob = 0;
    }

    function initLeaves() {
      leaves = [];
      for (var i = 0; i < 7; i++) {
        leaves.push({ x: rand(0, 600), y: rand(30, H - 180), s: rand(0.6, 1.2), rot: rand(0, 6.28), vr: rand(-0.6, 0.6), v: rand(12, 26) });
      }
    }

    function currentGap() { return Math.max(T.gapMin, T.gap - score * T.gapPerPoint); }
    function currentSpeed() { return Math.min(T.speedMax, T.speed + score * T.speedPerPoint); }

    /* w duelu przerwa zależy od numeru bambusa, nie od chwili pojawienia się,
       żeby tor był identyczny na każdym ekranie (w zwykłej ramce wychodzi to samo co w solo) */
    function spawnPipe() {
      var last = pipes[pipes.length - 1];
      var k = pipeCount++;
      var g = Math.max(T.gapMin, T.gap - Math.max(0, k - 1) * T.gapPerPoint);
      var minY = 70 + g / 2, maxY = H - T.ground - 50 - g / 2;
      var y = minY + rng() * (maxY - minY);
      if (last) y = clamp(y, last.gapY - 170, last.gapY + 170);
      pipes.push({ x: last ? last.x + T.spacing : player.x + FIRST, gapY: y, gap: g, passed: false, seed: rng() });
    }

    /* start rundy daje strona duela (odliczanie), więc stuknięcie przed startem nic nie robi */
    function go() {
      if (state !== "ready") return;
      state = "play";
      playStart = time;
      dist = 0;
      player.y = H * 0.42;
      player.vy = T.flap;
      player.sloshV += 6;
      spawnPipe();
      onStart();
    }

    function flapAction() {
      if (state === "play") {
        player.vy = T.flap;
        player.sloshV += 6;
        for (var i = 0; i < 3; i++) {
          particles.push({ x: player.x - 6, y: player.y + 20, vx: rand(-60, 20), vy: rand(40, 120), life: 0.45, max: 0.45, r: rand(1.5, 3), c: "#cfe3a0" });
        }
        onFlap();
      }
    }

    function burst(color) {
      for (var i = 0; i < 18; i++) {
        var a = rand(0, Math.PI * 2), s = rand(80, 260);
        particles.push({ x: player.x, y: player.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: rand(0.5, 0.9), max: 0.9, r: rand(2, 4.5), c: i % 3 === 0 ? "#7a9a3a" : color });
      }
    }

    function die() {
      if (state !== "play") return;
      state = "dead";
      deadTime = time;
      flash = 1;
      player.vy = Math.min(player.vy, -220);
      var finalScore = score, duration = Math.max(0, time - playStart), finalDist = dist;
      setTimeout(function () { onGameOver(finalScore, duration, finalDist); }, 0);
    }

    function update(dt) {
      time += dt;
      readyBob += dt;
      if (colorT < 1) colorT = Math.min(1, colorT + dt * 4);
      if (flash > 0) flash = Math.max(0, flash - dt * 3);

      var moving = state !== "dead";
      var spd = state === "play" ? currentSpeed() : 90;
      if (moving) {
        groundX = (groundX + spd * dt) % 48;
        hillX += spd * dt;
      }

      leaves.forEach(function (l) {
        l.x -= (l.v + (moving ? spd * 0.15 : 0)) * dt;
        l.rot += l.vr * dt;
        l.y += Math.sin(time + l.s * 10) * 8 * dt;
        if (l.x < -30) { l.x = W + rand(10, 200); l.y = rand(30, H - 180); }
      });

      // sprężyna "chlupania" płynu w kubku
      var prevAngle = player.angle;

      if (state === "ready") {
        player.y = H * 0.42 + Math.sin(readyBob * 3) * 8;
        player.angle = Math.sin(readyBob * 3) * 0.06;
      } else {
        player.vy = Math.min(T.maxFall, player.vy + T.gravity * dt);
        player.y += player.vy * dt;
        var target = clamp(player.vy / 900, -0.35, state === "dead" ? 1.4 : 0.8);
        player.angle += (target - player.angle) * Math.min(1, dt * 10);
        if (player.y < 30) { player.y = 30; player.vy = Math.max(0, player.vy); }
        var groundY = H - T.ground;
        if (player.y + 31 > groundY) {
          player.y = groundY - 31;
          if (state === "play") die();
          player.vy = 0;
        }
      }

      var dAngle = (player.angle - prevAngle) / dt;
      player.sloshV += (-player.slosh * 90 - player.sloshV * 6 - dAngle * 4) * dt;
      player.slosh += player.sloshV * dt;
      player.slosh = clamp(player.slosh, -0.6, 0.6);

      if (state === "play") {
        var speed = currentSpeed();
        dist += speed * dt;
        pipes.forEach(function (p) { p.x -= speed * dt; });
        while (pipes.length && pipes[0].x < -T.pipeW - 20) pipes.shift();
        if (!pipes.length || pipes[pipes.length - 1].x < W - T.spacing + 10) spawnPipe();

        var hx = 19, hy = 27;
        for (var i = 0; i < pipes.length; i++) {
          var p = pipes[i];
          if (!p.passed && p.x + T.pipeW < player.x - hx) {
            p.passed = true;
            score++;
            colorFrom = palette[colorIdx % palette.length];
            colorIdx++;
            colorT = 0;
            burst(palette[colorIdx % palette.length]);
          }
          if (player.x + hx > p.x + 4 && player.x - hx < p.x + T.pipeW - 4) {
            if (player.y - hy < p.gapY - p.gap / 2 || player.y + hy > p.gapY + p.gap / 2) die();
          }
        }
      }

      for (var j = particles.length - 1; j >= 0; j--) {
        var q = particles[j];
        q.life -= dt;
        if (q.life <= 0) { particles.splice(j, 1); continue; }
        q.vy += 600 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }
    }

    /* ---------- rysowanie ---------- */
    function cupColor() {
      var to = palette[colorIdx % palette.length];
      return colorT >= 1 ? to : mix(colorFrom, to, colorT);
    }

    function drawBackground() {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#f7f2e6");
      g.addColorStop(1, "#e3ecc8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // słońce
      ctx.fillStyle = "rgba(255, 225, 160, 0.55)";
      ctx.beginPath();
      ctx.arc(W * 0.78, 110, 46, 0, Math.PI * 2);
      ctx.fill();

      // dwa pasma wzgórz (paralaksa)
      hills(0.15, H - T.ground - 120, 40, "#d3e0ab", 0.011);
      hills(0.35, H - T.ground - 60, 34, "#bccf8a", 0.017);

      // liście herbaty w tle
      leaves.forEach(function (l) {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.scale(l.s, l.s);
        ctx.fillStyle = "rgba(122, 154, 58, 0.28)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(79, 107, 34, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();
      });
    }

    function hills(par, base, amp, color, freq) {
      var off = hillX * par;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var x = 0; x <= W + 10; x += 10) {
        var X = x + off;
        var y = base - Math.sin(X * freq) * amp - Math.sin(X * freq * 2.3 + 1.7) * amp * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }

    function drawBamboo(x, y0, y1, seed, capAt) {
      var w = T.pipeW;
      var g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, "#7f9f3a");
      g.addColorStop(0.35, "#b5cc6a");
      g.addColorStop(0.7, "#93b04a");
      g.addColorStop(1, "#6b8a2e");
      ctx.fillStyle = g;
      ctx.fillRect(x, y0, w, y1 - y0);

      // węzły bambusa
      ctx.fillStyle = "rgba(70, 95, 25, 0.55)";
      var step = 64;
      var startN = Math.floor(seed * step);
      for (var y = y0 + startN; y < y1; y += step) {
        ctx.fillRect(x - 2, y, w + 4, 5);
        ctx.fillStyle = "rgba(230, 240, 190, 0.5)";
        ctx.fillRect(x, y + 5, w, 2);
        ctx.fillStyle = "rgba(70, 95, 25, 0.55)";
      }
      // pionowy połysk
      ctx.fillStyle = "rgba(255, 255, 230, 0.22)";
      ctx.fillRect(x + w * 0.22, y0, 6, y1 - y0);

      // zakończenie przy przerwie
      ctx.fillStyle = "#6b8a2e";
      var capH = 14;
      var cy = capAt === "bottom" ? y1 - capH : y0;
      ctx.fillRect(x - 5, cy, w + 10, capH);
      ctx.fillStyle = "rgba(230, 240, 190, 0.55)";
      ctx.fillRect(x - 5, capAt === "bottom" ? y1 - capH : y0 + capH - 3, w + 10, 3);
    }

    function drawPipes() {
      var groundY = H - T.ground;
      pipes.forEach(function (p) {
        drawBamboo(p.x, -10, p.gapY - p.gap / 2, p.seed, "bottom");
        drawBamboo(p.x, p.gapY + p.gap / 2, groundY, p.seed * 0.7, "top");
      });
    }

    function drawGround() {
      var y = H - T.ground;
      ctx.fillStyle = "#c99d6c";
      ctx.fillRect(0, y, W, T.ground);
      ctx.fillStyle = "#a97c4f";
      ctx.fillRect(0, y, W, 5);
      ctx.strokeStyle = "rgba(120, 80, 40, 0.25)";
      ctx.lineWidth = 2;
      for (var x = -groundX; x < W + 48; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.lineTo(x + 18, H);
        ctx.stroke();
      }
    }

    function cupPath() {
      ctx.beginPath();
      ctx.moveTo(-20, -25);
      ctx.lineTo(20, -25);
      ctx.lineTo(15, 22);
      ctx.quadraticCurveTo(14.5, 25, 11, 25);
      ctx.lineTo(-11, 25);
      ctx.quadraticCurveTo(-14.5, 25, -15, 22);
      ctx.closePath();
    }

    function drawCup() {
      drawCupAt(player.x, player.y, player.angle, player.slosh, cupColor(), 1);
    }

    /* ten sam kubek co w grze solo, w dowolnym miejscu i z przezroczystością (duch przeciwnika) */
    function drawCupAt(px, py, angle, slosh, col, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.scale(1.35, 1.35);

      // słomka
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(8, -38);
      ctx.lineTo(3, -6);
      ctx.stroke();

      ctx.save();
      cupPath();
      ctx.clip();
      // szkło
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(-30, -30, 60, 60);
      // matcha (powierzchnia zostaje pozioma, jak prawdziwy płyn)
      ctx.save();
      ctx.rotate(-angle + slosh);
      ctx.fillStyle = "#7a9a3a";
      ctx.fillRect(-45, -9, 90, 70);
      ctx.fillStyle = "#cfe0a0";
      ctx.fillRect(-45, -11, 90, 5);
      ctx.restore();
      // przezroczysty kolor kubka
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.25 * alpha;
      ctx.fillRect(-30, -30, 60, 60);
      ctx.globalAlpha = alpha;
      // opaska w kolorze kubka
      ctx.fillStyle = col;
      ctx.fillRect(-30, 4, 60, 11);
      // odblask
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(-13, -22, 4, 40);
      ctx.restore();

      // obrys i rant
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      cupPath();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-22, -28, 44, 4, 2); else ctx.rect(-22, -28, 44, 4);
      ctx.fill();

      ctx.restore();
    }

    function drawParticles() {
      particles.forEach(function (q) {
        ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
        ctx.fillStyle = q.c;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    /* ---------- duch przeciwnika ----------
       Strona duela podaje ostatnią znaną pozycję (setGhost). Między wiadomościami
       kubek przeciwnika leci dalej według tej samej fizyki, a obraz jest lekko
       wygładzany, żeby nie skakał. Pozycję w poziomie wyznacza różnica przebytej drogi. */
    function ghostTarget() {
      var g = ghost;
      var age = clamp((performance.now() - g.at) / 1000, 0, 0.6);
      var y = g.y, vy = g.vy, groundY = H - T.ground;
      for (var t = 0; t < age; t += 1 / 60) {
        var h = Math.min(1 / 60, age - t);
        vy = Math.min(T.maxFall, vy + T.gravity * h);
        y += vy * h;
      }
      y = clamp(y, 30, groundY - 31);
      var d = g.d;
      if (g.alive) d += Math.min(T.speedMax, T.speed + g.s * T.speedPerPoint) * age;
      var mine = state === "ready" ? 0 : dist;
      return { x: player.x + (d - mine), y: y, a: clamp(vy / 900, -0.35, g.alive ? 0.8 : 1.4) };
    }

    function drawGhost() {
      if (!ghost) return;
      var t = ghostTarget();
      if (!ghostDraw || Math.abs(ghostDraw.x - t.x) > 140 || Math.abs(ghostDraw.y - t.y) > 140) ghostDraw = { x: t.x, y: t.y, a: t.a };
      else {
        ghostDraw.x += (t.x - ghostDraw.x) * 0.35;
        ghostDraw.y += (t.y - ghostDraw.y) * 0.35;
        ghostDraw.a += (t.a - ghostDraw.a) * 0.35;
      }
      var gx = ghostDraw.x, gy = ghostDraw.y;
      if (gx < -60 || gx > W + 60) return;
      var col = ghost.alive ? palette[(ghost.s || 0) % palette.length] : "#8a9384";
      drawCupAt(gx, gy, ghostDraw.a, 0, col, ghost.alive ? 0.5 : 0.35);
      if (ghost.name) {
        ctx.font = "600 13px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        var label = ghost.name.length > 16 ? ghost.name.slice(0, 15) + "…" : ghost.name;
        var tw = ctx.measureText(label).width + 16;
        var ly = gy - 62;
        ctx.globalAlpha = ghost.alive ? 0.85 : 0.6;
        ctx.fillStyle = "rgba(255, 253, 247, 0.92)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx - tw / 2, ly - 11, tw, 22, 11); else ctx.rect(gx - tw / 2, ly - 11, tw, 22);
        ctx.fill();
        ctx.fillStyle = "#1f2a1b";
        ctx.fillText(label, gx, ly + 1);
        ctx.globalAlpha = 1;
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

    function drawHUD() {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (state === "play") {
        outlinedText(String(score), W / 2, 62, 52);
      }
      if (state === "ready") {
        outlinedText(text("game.title"), W / 2, 110, 40, "#e6edc9");
      }
      if (state === "dead") {
        var pw = Math.min(260, W - 40), ph = 130;
        var px = (W - pw) / 2, py = H * 0.18;
        panel(px, py, pw, ph);
        ctx.fillStyle = "#1f2a1b";
        ctx.font = "700 28px Fraunces, Georgia, serif";
        ctx.fillText(text("game.over"), W / 2, py + 38);
        ctx.font = "500 15px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#4b5745";
        ctx.fillText(text("game.score"), W / 2, py + 72);
        ctx.font = "700 34px Fraunces, Georgia, serif";
        ctx.fillStyle = "#1f2a1b";
        ctx.fillText(String(score), W / 2, py + 104);
      }
      if (flash > 0) {
        ctx.fillStyle = "rgba(255,255,255," + (flash * 0.7) + ")";
        ctx.fillRect(0, 0, W, H);
      }
    }

    function render() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawBackground();
      drawPipes();
      drawGround();
      drawGhost();
      drawParticles();
      drawCup();
      drawHUD();
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

    /* ---------- sterowanie ---------- */
    canvas.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      // klik w grę zabiera fokus z przycisku (np. EN/PL), żeby spacja dalej sterowała kubkiem
      var a = document.activeElement;
      if (a && a !== document.body && a.blur) a.blur();
      flapAction();
    });
    window.addEventListener("keydown", function (e) {
      // nie przeszkadzaj w wpisywaniu nicku ani w klikaniu przycisków klawiaturą
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable || (t.tagName === "BUTTON" && t.form))) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
        if (t && t.tagName === "BUTTON" && t.offsetParent !== null) return; // spacja na widocznym przycisku (np. Gotowe) ma go wcisnąć
        e.preventDefault();
        if (!e.repeat) flapAction();
      }
    });
    document.addEventListener("visibilitychange", function () { last = 0; acc = 0; });

    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    window.addEventListener("resize", resize);

    time = 0; groundX = 0; hillX = 0;
    resize();
    reset();
    initLeaves();
    requestAnimationFrame(frame);

    return {
      setColors: function (c) { if (c && c.length) palette = c; },
      flap: flapAction,
      go: go,
      /* nowa runda: kubek wraca na start, tor z nowego ziarna */
      newRound: function (seed) { reset(); rng = makeRng(seed); },
      /* poddanie rundy (np. ktoś schował kartę w trakcie gry) */
      forfeit: function () { die(); },
      state: function () { return { state: state, y: player.y, vy: player.vy, d: dist, score: score }; },
      /* g = { name, y, vy, d, s, alive, at } albo null; at = performance.now() chwili pomiaru */
      setGhost: function (g) { ghost = g; if (!g) ghostDraw = null; },
      _debug: function () {
        var next = pipes.filter(function (p) { return p.x + T.pipeW > player.x - 20; })[0];
        return { state: state, score: score, y: player.y, vy: player.vy, d: dist, pipes: pipes.length, gapY: next ? next.gapY : null, gaps: pipes.map(function (p) { return Math.round(p.gapY); }) };
      }
    };
  }

  window.MatchaFlapDuel = { start: start };
})();
