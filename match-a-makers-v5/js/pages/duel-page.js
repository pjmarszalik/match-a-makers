/* ==========================================================
   Match(a) Makers - DUEL NA ŻYWO (zakładka Gra → Duel)
   Dwie osoby lecą w tej samej chwili przez identyczne bambusy i widzą się
   nawzajem (druga osoba = półprzezroczysty kubek). Wygrywa dłuższy lot.

   Jak się spotkać:
   - Szybki duel: łączy dwie osoby, które kliknęły go mniej więcej w tym samym
     czasie (np. po zeskanowaniu tego samego kodu QR przy stoisku),
   - Duel ze znajomą osobą: strona pokazuje kod QR i 4-znakowy kod do wpisania.

   Dane lecą przez Firebase Realtime Database (ustawienia: duel w js/config.js,
   reguły bezpieczeństwa: Firebase → Realtime Database → Rules, treść w pliku
   duel-firebase-rules.json). Gry solo, jej pliku
   gra/flappy.js i rankingu ten plik nie dotyka; duel ma własny silnik
   gra/flappy-duel.js.

   Test bez Firebase: duel.html?demo=1 w dwóch kartach tej samej przeglądarki.
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  var MM = window.MM;
  var C = window.MM_CONFIG || {};
  var FB = C.duel || {};
  var params = new URLSearchParams(location.search);
  var demo = params.get("demo") === "1";
  var enabled = demo || !!(FB.apiKey && FB.databaseURL);
  var P = demo ? "mm-demo-" : "mm-";

  var NAME_MAX = 20;
  var CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bez I, L, O, 0, 1 (łatwo pomylić)
  var CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
  var COUNT_MS = 3600;          // odliczanie przed rundą
  var SEND_MS = 100;            // co ile wysyłamy swoją pozycję w trakcie lotu
  var LOBBY_FRESH_MS = 30000;   // miejsce w kolejce szybkiego duela starsze niż to = porzucone
  var LOBBY_REFRESH_MS = 8000;  // co ile czekająca osoba odświeża swoje miejsce
  var SILENT_MS = 6000;         // druga osoba nic nie wysyła tyle w trakcie rundy = koniec jej lotu

  function $(id) { return document.getElementById(id); }
  var canvas = $("duel-game"), panel = $("duel-panel");
  var oppPill = $("duel-opp"), oppDot = oppPill.firstElementChild, oppText = oppPill.lastElementChild;
  var countEl = $("duel-count"), statusEl = $("duel-status"), statusText = statusEl.firstElementChild;
  var nickIn = $("duel-nick"), joinNick = $("join-nick"), codeIn = $("code-in");
  var homeMsg = $("home-msg"), joinMsg = $("join-msg"), hostMsg = $("host-msg");
  var btnReady = $("btn-ready"), btnRematch = $("btn-rematch"), btnJoin = $("btn-join");
  var CARDS = ["home", "wait", "host", "join", "lobby", "result", "msg", "off"];

  var colors = MM.cups().map(function (c) { return c.color; });
  if (!colors.length) colors = ["#e2654a", "#e8a13a", "#3f8fd6", "#8b62c2", "#de5f97", "#38557f"];

  function fmt(key, vars) {
    return MM.t(key).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }
  function cleanName(s) {
    var t = String(s || "").replace(/\p{DI}/gu, "").replace(/\s/g, " ").replace(/[^\p{L}\p{M}\p{N} ._-]/gu, "");
    if (t.normalize) t = t.normalize("NFC");
    t = t.replace(/ +/g, " ").trim();
    return Array.from(t).slice(0, NAME_MAX).join("").trim();
  }
  function savedName() {
    var n = cleanName(MM.load(P + "duel-name", ""));
    if (!n) n = cleanName(MM.load(P + "nick", "")); // nick z gry solo (tylko odczyt)
    return n;
  }
  function randomCode() {
    var s = "";
    for (var i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  }
  function randomSeed() { return 1 + Math.floor(Math.random() * 2147483000); }
  function joinUrl(code) {
    return location.origin + location.pathname + "?r=" + code + (demo ? "&demo=1" : "");
  }

  /* ---------- silnik (kopia gry tylko dla duela) ---------- */
  var engine = window.MatchaFlapDuel.start(canvas, {
    colors: colors,
    text: function (k) { return MM.t(k); },
    onFlap: function () { sendState(); },
    onGameOver: function (score, duration, dist) { myDone(score, dist); }
  });
  engine.newRound(randomSeed());
  window.MM_DUEL_GAME = engine; // do testów w konsoli przeglądarki
  window.MM_DUEL_NOW = function () { return D; }; // j.w.: bieżący duel

  /* ---------- połączenie ---------- */
  var db = null, offset = 0, online = false, offlineTimer = 0;
  function connect() {
    if (db) return db;
    if (demo) db = window.MM_DUEL_DEMO_DB;
    else {
      var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FB);
      db = app.database();
    }
    db.ref(".info/serverTimeOffset").on("value", function (s) { offset = +s.val() || 0; });
    db.ref(".info/connected").on("value", function (s) {
      online = !!s.val();
      clearTimeout(offlineTimer);
      if (online) { if (statusEl.dataset.kind === "offline") hideStatus(); return; }
      offlineTimer = setTimeout(function () { if (!online && D) setStatus(MM.t("duel.offline"), "bad", "offline"); }, 4000);
    });
    return db;
  }
  function serverNow() { return Date.now() + offset; }
  /* bez połączenia z bazą przez 12 s (np. brak internetu) = komunikat zamiast wiecznego czekania */
  function watchdog(my) {
    setTimeout(function () { if (my === flow && !online && (!D || !D.matched)) end("error"); }, 12000);
  }

  /* ---------- widoki ---------- */
  function show(name) {
    CARDS.forEach(function (n) { $("card-" + n).classList.toggle("hidden", n !== name); });
    panel.classList.toggle("hidden", !name);
    if (name) panel.scrollTop = 0;
  }
  function setStatus(text, cls, kind) {
    statusText.textContent = text;
    statusEl.className = "frame-status" + (cls ? " " + cls : "");
    statusEl.dataset.kind = kind || "";
  }
  function hideStatus() { statusEl.className = "frame-status hidden"; statusEl.dataset.kind = ""; }
  function showMsg(titleKey, textKey) {
    $("msg-title").textContent = MM.t(titleKey);
    $("msg-text").textContent = MM.t(textKey);
    show("msg");
  }
  function showWait(titleKey, textKey) {
    $("wait-title").textContent = MM.t(titleKey);
    $("wait-text").textContent = textKey ? MM.t(textKey) : "";
    $("wait-text").classList.toggle("hidden", !textKey);
    show("wait");
  }
  function setMsg(el, text, cls) { el.textContent = text || ""; el.className = "nick-msg" + (cls ? " " + cls : ""); }
  function blurActive() {
    var a = document.activeElement;
    if (a && a !== document.body && a.blur) a.blur();
  }
  function cleanUrl() {
    var q = new URLSearchParams(location.search);
    q.delete("r");
    var s = q.toString();
    try { history.replaceState(null, "", location.pathname + (s ? "?" + s : "")); } catch (e) { /* nic */ }
  }

  /* ---------- stan duela ---------- */
  var D = null;      // bieżący duel albo null
  var flow = 0;      // numer bieżącej akcji; stare odpowiedzi z bazy są ignorowane

  function newDuel(code, role, quick, name) {
    return {
      code: code, role: role, quick: quick, myName: name, oppName: "",
      ref: db.ref("rooms/" + code), cb: null,
      matched: false, round: 0, phase: "lobby", starting: false,
      myFinal: null, oppFinal: null, oppLast: null, oppSeen: 0,
      wins: [0, 0], lastRes: 0, lastByDist: false,
      timers: []
    };
  }
  function later(d, fn, ms) { d.timers.push(setTimeout(fn, ms)); }
  function every(d, fn, ms) { d.timers.push(setInterval(fn, ms)); }

  function leaveLobby(code) {
    db.ref("lobby").transaction(function (cur) {
      if (cur === null) return null;
      if (cur.r === code) return null;
      return; // ktoś inny czeka, nie ruszamy
    }).catch(function () {});
    db.ref("lobby").onDisconnect().cancel();
  }

  /* zamyka bieżący duel: wyłącza nasłuch i liczniki, usuwa po sobie dane */
  function cleanup() {
    flow++;
    var d = D;
    D = null;
    countEl.classList.add("hidden");
    oppPill.classList.add("hidden");
    hideStatus();
    engine.setGhost(null);
    engine.newRound(randomSeed());
    if (!d) return;
    d.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    if (d.cb) d.ref.off("value", d.cb);
    if (d.role === "h") {
      d.ref.onDisconnect().cancel();
      d.ref.remove().catch(function () {});
      if (d.quick && !d.matched) leaveLobby(d.code);
    } else {
      d.ref.child("p/g").onDisconnect().cancel();
      d.ref.child("p/g").remove().catch(function () {});
    }
  }

  function goHome(msg) {
    cleanup();
    cleanUrl();
    nickIn.value = savedName();
    setMsg(homeMsg, msg || "", msg ? "bad" : "");
    show("home");
  }

  function end(reason) {
    cleanup();
    cleanUrl();
    if (reason === "left") showMsg("duel.leftTitle", "duel.leftText");
    else if (reason === "gone") showMsg("duel.goneTitle", "duel.goneText");
    else if (reason === "full") showMsg("duel.fullTitle", "duel.fullText");
    else if (reason === "error") showMsg("duel.errTitle", "duel.errText");
    else showMsg("duel.lostTitle", "duel.lostText");
  }

  function takeName(input, msgEl) {
    var n = cleanName(input.value);
    if (!n) { setMsg(msgEl, MM.t("duel.nameBad"), "bad"); input.focus(); return null; }
    input.value = n;
    MM.save(P + "duel-name", n);
    setMsg(msgEl, "");
    return n;
  }

  /* ---------- zakładanie i wchodzenie do pokoju ---------- */
  function createRoom(name, quick) {
    var tries = 0;
    function attempt() {
      var code = randomCode();
      var ref = db.ref("rooms/" + code);
      return ref.transaction(function (cur) {
        if (cur === null) return { c: serverNow(), q: quick ? 1 : 0, n: 0, p: { h: { n: name, rd: 0 } } };
        return; // ten kod jest zajęty
      }).then(function (res) {
        if (res.committed) { ref.onDisconnect().remove(); return code; }
        if (++tries >= 6) throw new Error("code");
        return attempt();
      });
    }
    return attempt();
  }

  /* "ok" | "gone" | "full" */
  function joinRoom(code, name) {
    var ref = db.ref("rooms/" + code);
    return ref.once("value").then(function (snap) {
      var room = snap.val();
      if (!room || !room.p || !room.p.h) return "gone";
      if (room.p.g) return "full";
      return ref.child("p/g").transaction(function (cur) {
        return cur === null ? { n: name, rd: 0 } : undefined;
      }).then(function (res) {
        if (!res.committed) return "full";
        ref.child("p/g").onDisconnect().remove();
        D = newDuel(code, "g", !!room.q, name);
        watchRoom(D);
        return "ok";
      }, function () { return "gone"; }); // pokój zniknął w międzyczasie (reguły nie pozwolą na pół-pokój)
    });
  }

  function watchRoom(d) {
    d.cb = d.ref.on("value", function (snap) {
      if (D === d) onRoom(d, snap.val());
    }, function () {
      if (D === d) end("lost");
    });
  }

  /* ---------- szybki duel ---------- */
  function startQuick(tries) {
    var name = takeName(nickIn, homeMsg);
    if (!name) return;
    tries = tries || 0;
    cleanup();
    var my = flow;
    showWait("duel.searching", "duel.searchingText");
    try { connect(); } catch (e) { end("error"); return; }
    watchdog(my);
    var code = null;
    createRoom(name, true).then(function (c) {
      code = c;
      if (my !== flow) { db.ref("rooms/" + c).remove(); return null; }
      return claimOrWait(c);
    }).then(function (claimed) {
      if (my !== flow || code === null) return;
      if (claimed) {
        // ktoś już czekał: oddajemy swój pokój i wchodzimy do niego
        var mine = db.ref("rooms/" + code);
        mine.onDisconnect().cancel();
        mine.remove();
        return joinRoom(claimed, name).then(function (r) {
          if (my !== flow) return;
          if (r === "ok") return;
          if (tries < 3) startQuick(tries + 1); else end("error");
        });
      }
      // nikt nie czekał: czekamy w swoim pokoju
      D = newDuel(code, "h", true, name);
      db.ref("lobby").onDisconnect().remove();
      watchRoom(D);
      var d = D;
      every(d, function () { refreshLobby(d); }, LOBBY_REFRESH_MS);
    }).catch(function () {
      if (my === flow) end("error");
    });
  }

  /* jedno miejsce "lobby": albo bierzemy osobę, która tam czeka, albo sami tam stajemy */
  function claimOrWait(code) {
    var claimed = null;
    var now = serverNow();
    return db.ref("lobby").transaction(function (cur) {
      claimed = null;
      if (cur && cur.r && cur.r !== code && now - (+cur.t || 0) < LOBBY_FRESH_MS) {
        claimed = cur.r;
        return null;
      }
      return { r: code, t: now };
    }).then(function (res) {
      if (!res.committed) throw new Error("lobby");
      return claimed;
    });
  }

  function refreshLobby(d) {
    if (D !== d || d.matched) return;
    var claimed = null;
    var now = serverNow();
    db.ref("lobby").transaction(function (cur) {
      claimed = null;
      if (cur && cur.r && cur.r !== d.code && now - (+cur.t || 0) < LOBBY_FRESH_MS) {
        claimed = cur.r; // ktoś inny też czeka (np. po zerwanym połączeniu): łączymy się
        return null;
      }
      return { r: d.code, t: now };
    }).then(function (res) {
      if (!res.committed || !claimed || D !== d || d.matched) return;
      var name = d.myName;
      cleanup();
      var my = flow;
      showWait("duel.connecting", null);
      joinRoom(claimed, name).then(function (r) {
        if (my !== flow || r === "ok") return;
        startQuick(1);
      });
    }).catch(function () {});
  }

  /* ---------- duel ze znajomą osobą ---------- */
  function startFriend() {
    var name = takeName(nickIn, homeMsg);
    if (!name) return;
    cleanup();
    var my = flow;
    $("host-qr").innerHTML = "";
    $("host-code").textContent = "····";
    setMsg(hostMsg, "");
    show("host");
    try { connect(); } catch (e) { end("error"); return; }
    watchdog(my);
    createRoom(name, false).then(function (code) {
      if (my !== flow) { db.ref("rooms/" + code).remove(); return; }
      D = newDuel(code, "h", false, name);
      watchRoom(D);
      $("host-code").textContent = code;
      drawQr(joinUrl(code));
    }).catch(function () {
      if (my === flow) end("error");
    });
  }

  function drawQr(url) {
    var box = $("host-qr");
    try {
      var qr = window.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) { box.innerHTML = ""; }
  }

  function share() {
    if (!D) return;
    var url = joinUrl(D.code);
    if (navigator.share) {
      navigator.share({ title: "Match(a) Makers", text: MM.t("duel.shareText"), url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        setMsg(hostMsg, MM.t("duel.copied"));
      }, function () { setMsg(hostMsg, fmt("duel.copyFail", { url: url })); });
    } else setMsg(hostMsg, fmt("duel.copyFail", { url: url }));
  }

  /* ---------- wejście z kodu QR / linku / wpisanego kodu ---------- */
  var joinCode = null;
  function openJoin(code) {
    cleanup();
    var my = flow;
    joinCode = code;
    $("join-title").textContent = MM.t("duel.checking") + "…";
    joinNick.value = savedName();
    setMsg(joinMsg, "");
    btnJoin.disabled = true;
    show("join");
    try { connect(); } catch (e) { end("error"); return; }
    watchdog(my);
    db.ref("rooms/" + code).once("value").then(function (snap) {
      if (my !== flow) return;
      var room = snap.val();
      if (!room || !room.p || !room.p.h) { end("gone"); return; }
      if (room.p.g) { end("full"); return; }
      $("join-title").textContent = fmt("duel.joinTitle", { name: room.p.h.n });
      btnJoin.disabled = false;
      if (!joinNick.value && matchMedia("(pointer: fine)").matches) joinNick.focus();
    }).catch(function () { if (my === flow) end("error"); });
  }

  function doJoin(code, input, msgEl) {
    var name = takeName(input, msgEl);
    if (!name) return;
    cleanup();
    var my = flow;
    showWait("duel.connecting", null);
    try { connect(); } catch (e) { end("error"); return; }
    watchdog(my);
    joinRoom(code, name).then(function (r) {
      if (my !== flow) return;
      if (r !== "ok") end(r);
    }).catch(function () { if (my === flow) end("error"); });
  }

  /* ---------- pokój: wszystko, co przychodzi z bazy ---------- */
  function onRoom(d, room) {
    var me = room && room.p && room.p[d.role];
    var host = room && room.p && room.p.h;
    if (!room || !me || !host) {
      // gość bez pokoju albo bez gospodarza = druga osoba wyszła;
      // zniknął nasz pokój (gospodarz) albo nasze miejsce = zerwane połączenie
      if (d.role === "g" && (!room || (me && !host))) end(d.matched ? "left" : "gone");
      else end("lost");
      return;
    }
    var opp = room.p[d.role === "h" ? "g" : "h"];
    d.me = me;
    d.opp = opp || null;

    if (!opp) {
      if (d.matched) { end("left"); return; }
      return; // dalej czekamy (karta „Szukam…” albo kod QR)
    }
    d.oppName = opp.n;
    if (!d.matched) {
      d.matched = true;
      if (d.role === "h" && d.quick) leaveLobby(d.code);
      if (navigator.vibrate) { try { navigator.vibrate(80); } catch (e) { /* nic */ } }
      cleanUrl();
      show("lobby");
    }

    // nowa runda (pole n rośnie, go = chwila startu na zegarze serwera)
    var n = +room.n || 0;
    if (n > d.round && room.go) startRound(d, n, room.seed, room.go);

    // gospodarz rusza rundę, gdy obie osoby kliknęły Gotowe / Rewanż
    var next = n + 1;
    if (d.role === "h" && !d.starting && (d.phase === "lobby" || d.phase === "done") && me.rd === next && opp.rd === next) {
      d.starting = true;
      d.ref.update({ seed: randomSeed(), go: serverNow() + COUNT_MS, n: next }).then(function () {
        d.starting = false;
      }, function () { d.starting = false; });
    }

    if (d.phase === "play" || d.phase === "out") seeOpponent(d, opp.st);
    if (d.phase === "lobby") renderLobby(d, me, opp, next);
    if (d.phase === "done") renderResultNote(d, me, opp, next);
  }

  function renderLobby(d, me, opp, next) {
    $("lobby-title").textContent = d.myName + " vs " + d.oppName;
    var list = $("lobby-list");
    list.innerHTML = "";
    [[d.myName + " (" + MM.t("duel.you") + ")", me.rd === next], [d.oppName, opp.rd === next]].forEach(function (row) {
      var li = document.createElement("li");
      if (row[1]) li.className = "ok";
      var nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = row[0];
      var st = document.createElement("span");
      st.className = "st";
      st.textContent = MM.t(row[1] ? "duel.stReady" : "duel.stWaiting");
      li.appendChild(nm);
      li.appendChild(st);
      list.appendChild(li);
    });
    btnReady.disabled = me.rd === next;
    btnReady.textContent = MM.t(me.rd === next ? "duel.readyDone" : "duel.ready");
  }

  function renderResultNote(d, me, opp, next) {
    if (d.phase !== "done") return;
    var note = "";
    if (opp.rd === next && me.rd !== next) note = fmt("duel.oppRematch", { name: d.oppName });
    else if (me.rd === next) note = fmt("duel.rematchWait", { name: d.oppName });
    $("res-opp").textContent = note;
    btnRematch.disabled = me.rd === next;
  }

  function pressReady() {
    var d = D;
    if (!d || !d.matched) return;
    blurActive();
    btnReady.disabled = true;
    btnRematch.disabled = true;
    d.ref.child("p/" + d.role + "/rd").set(d.round + 1).catch(function () {
      btnReady.disabled = false;
      btnRematch.disabled = false;
    });
  }

  /* ---------- runda ---------- */
  function startRound(d, n, seed, go) {
    d.round = n;
    d.phase = "count";
    d.myFinal = null;
    d.oppFinal = null;
    d.oppLast = null;
    d.oppSeen = 0;
    engine.setGhost(null);
    engine.newRound(+seed || 1);
    show(null);
    blurActive();
    hideStatus();
    setOppPill(d, 0, true);
    oppPill.classList.remove("hidden");
    function tick() {
      if (D !== d || d.round !== n || d.phase !== "count") return;
      var left = go - serverNow();
      if (left <= 0) { countEl.classList.add("hidden"); beginPlay(d); return; }
      countEl.textContent = String(Math.min(3, Math.ceil(left / 1000)));
      countEl.classList.remove("hidden");
      later(d, tick, Math.min(100, left));
    }
    tick();
  }

  function beginPlay(d) {
    d.phase = "play";
    d.playAt = Date.now();
    engine.go();
    sendState();
    every(d, sendState, SEND_MS);
    every(d, function () { checkSilent(d); }, 500);
  }

  function sendState() {
    var d = D;
    if (!d || (d.phase !== "play" && d.phase !== "out")) return;
    var s = engine.state();
    d.ref.child("p/" + d.role + "/st").set({
      r: d.round,
      y: Math.round(s.y * 10) / 10,
      v: Math.round(s.vy),
      d: Math.round(s.d * 10) / 10,
      s: s.score,
      a: s.state === "play" ? 1 : 0,
      t: serverNow()
    }).catch(function () {});
  }

  function setOppPill(d, score, alive) {
    oppText.textContent = d.oppName + " · " + score;
    oppDot.style.background = alive ? colors[score % colors.length] : "#8a9384";
    oppPill.classList.toggle("out", !alive);
  }

  function seeOpponent(d, st) {
    if (!st || st.r !== d.round || d.phase === "count") return;
    d.oppLast = st;
    d.oppSeen = Date.now();
    var localAt = performance.now() - Math.max(0, serverNow() - (+st.t || 0));
    engine.setGhost({ name: d.oppName, y: +st.y, vy: +st.v, d: +st.d, s: +st.s, alive: !!st.a, at: localAt });
    setOppPill(d, +st.s || 0, !!st.a);
    if (!st.a && !d.oppFinal) {
      d.oppFinal = { s: +st.s || 0, d: +st.d || 0 };
      if (d.phase === "out") hideStatus();
      maybeFinish(d);
    }
  }

  /* druga osoba zamknęła kartę albo straciła zasięg w trakcie rundy */
  function checkSilent(d) {
    if (D !== d || d.oppFinal || (d.phase !== "play" && d.phase !== "out")) return;
    var last = d.oppSeen || d.playAt;
    if (Date.now() - last < SILENT_MS) return;
    var st = d.oppLast || { s: 0, d: 0 };
    d.oppFinal = { s: +st.s || 0, d: +st.d || 0 };
    engine.setGhost(null);
    setOppPill(d, d.oppFinal.s, false);
    if (d.phase === "out") setStatus(fmt("duel.oppSilent", { name: d.oppName }), "bad");
    maybeFinish(d);
  }

  function myDone(score, dist) {
    var d = D;
    if (!d || d.phase !== "play") return;
    d.phase = "out";
    d.myFinal = { s: score, d: Math.round(dist * 10) / 10 }; // zaokrąglone jak w wiadomości do drugiej osoby
    sendState(); // ostatnia wiadomość: a = 0, czyli koniec lotu
    if (!d.oppFinal) setStatus(fmt("duel.oppStill", { name: d.oppName }));
    maybeFinish(d);
  }

  function maybeFinish(d) {
    if (D !== d || !d.myFinal || !d.oppFinal || d.phase === "done") return;
    d.phase = "done";
    var m = d.myFinal, o = d.oppFinal, res = 0;
    d.lastByDist = false;
    if (m.s !== o.s) res = m.s > o.s ? 1 : -1;
    else if (Math.abs(m.d - o.d) > 2) { res = m.d > o.d ? 1 : -1; d.lastByDist = true; }
    if (res > 0) d.wins[0]++;
    else if (res < 0) d.wins[1]++;
    d.lastRes = res;
    later(d, function () {
      if (D !== d || d.phase !== "done") return;
      hideStatus();
      renderResult(d);
      show("result");
    }, 1200);
  }

  function renderResult(d) {
    var m = d.myFinal, o = d.oppFinal;
    $("res-title").textContent = MM.t(d.lastRes > 0 ? "duel.win" : d.lastRes < 0 ? "duel.lose" : "duel.draw");
    var box = $("res-score");
    box.innerHTML = "";
    function cell(cls, text) {
      var el = document.createElement("div");
      el.className = cls;
      el.textContent = text;
      box.appendChild(el);
    }
    cell("pts", String(m.s));
    cell("sep", ":");
    cell("pts", String(o.s));
    cell("who me", MM.t("duel.you"));
    cell("", "");
    cell("who", d.oppName);
    var lines = [];
    if (d.lastByDist) lines.push(MM.t("duel.byDistance"));
    if (d.round > 1) lines.push(fmt("duel.series", { a: d.wins[0], b: d.wins[1], name: d.oppName }));
    $("res-series").textContent = lines.join(" ");
    $("res-series").classList.toggle("hidden", !lines.length);
    btnRematch.disabled = false;
    $("res-opp").textContent = "";
    if (d.me && d.opp) renderResultNote(d, d.me, d.opp, d.round + 1);
  }

  /* ---------- zdarzenia ---------- */
  $("btn-quick").addEventListener("click", function () { startQuick(0); });
  $("btn-friend").addEventListener("click", startFriend);
  nickIn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); startQuick(0); }
  });
  $("code-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var code = String(codeIn.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!CODE_RE.test(code)) { setMsg(homeMsg, MM.t("duel.codeBad"), "bad"); codeIn.focus(); return; }
    doJoin(code, nickIn, homeMsg);
  });
  $("btn-cancel-wait").addEventListener("click", function () { goHome(); });
  $("btn-cancel-host").addEventListener("click", function () { goHome(); });
  $("btn-share").addEventListener("click", share);
  $("card-join").addEventListener("submit", function (e) {
    e.preventDefault();
    if (joinCode) doJoin(joinCode, joinNick, joinMsg);
  });
  $("btn-join-back").addEventListener("click", function () { goHome(); });
  btnReady.addEventListener("click", pressReady);
  btnRematch.addEventListener("click", pressReady);
  $("btn-leave").addEventListener("click", function () { goHome(); });
  $("btn-leave2").addEventListener("click", function () { goHome(); });
  $("btn-msg").addEventListener("click", function () { goHome(); });

  // schowanie karty w trakcie lotu (telefon, inna aplikacja) = koniec swojego lotu
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && D && D.phase === "play") engine.forfeit();
  });
  window.addEventListener("pagehide", function () { if (D) cleanup(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted && enabled) goHome(); });

  MM.onLang(function () {
    var d = D;
    if (d && d.matched && d.phase === "lobby" && d.me && d.opp) renderLobby(d, d.me, d.opp, d.round + 1);
    if (d && d.phase === "done" && d.myFinal && d.oppFinal) renderResult(d);
    if (d && d.matched && (d.phase === "play" || d.phase === "out") && !d.oppFinal && statusEl.dataset.kind === "") setStatus(fmt("duel.oppStill", { name: d.oppName }));
  });

  /* ---------- start strony ---------- */
  if (!enabled) { show("off"); return; }
  var r = String(params.get("r") || "").toUpperCase();
  if (CODE_RE.test(r)) openJoin(r);
  else goHome();
});
