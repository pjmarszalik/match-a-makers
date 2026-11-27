/* Podstrona z grą - łączy silnik gry z kolorami kubków, językiem i rankingiem.
   Ranking działa, gdy w js/config.js jest wpisany leaderboardUrl (albo w adresie jest ?demo=1).
   Z rankingiem nick wpisuje się przed pierwszą grą, a każdy nowy rekord nicku zapisuje się sam.
   Na komputerze (np. laptop przy stoisku) gra pyta „Kto gra teraz?” po otwarciu strony,
   po 30 s bez gry i przy nowej rundzie po przerwie, żeby kolejna osoba nie grała na cudzy nick.
   Samej gry (gra/flappy.js) ten plik nie zmienia. */
document.addEventListener("DOMContentLoaded", function () {
  var B = window.MM_BOARD;
  var boardOn = !!(B && B.enabled());
  var P = B && B.demo ? "mm-demo-" : "mm-"; // tryb ?demo=1 trzyma nick i wyniki osobno

  var wrapEl = document.getElementById("game-wrap");
  var frame = document.getElementById("game-frame");
  var canvas = document.getElementById("game");
  var pill = document.getElementById("frame-status");
  var pillText = pill.firstElementChild;
  var bar = document.getElementById("record-bar");
  var panel = document.getElementById("nick-panel");
  var panelTitle = document.getElementById("nick-title");
  var panelText = document.getElementById("nick-text");
  var input = document.getElementById("nick");
  var playBtn = document.getElementById("play-btn");
  var nickMsg = document.getElementById("nick-msg");
  var cancelBtn = document.getElementById("nick-cancel");
  var playerBar = document.getElementById("player-bar");
  var playerName = document.getElementById("player-name");
  var changeBtn = document.getElementById("change-nick");
  var statusEl = document.getElementById("player-status");
  var boardWrap = document.getElementById("board-wrap");
  var countEl = document.getElementById("board-count");
  var list = document.getElementById("board");
  var moreBtn = document.getElementById("board-more");

  var TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4"/></svg>';
  var COMPACT = 10;          // ile pierwszych miejsc widać w skrócie rankingu
  var IDLE_MS = 30000;       // po tylu ms bez nowej gry komputer pyta „Kto gra teraz?”
  var ASK_MS = 4000;         // nowa runda po dłuższej przerwie niż tyle ms: najpierw „Kto gra teraz?”
  var REFRESH_MS = 45000;    // co tyle odświeżamy ranking, gdy nikt nie gra
  var RETRY_MS = 20000;      // co tyle ponawiamy wysłanie wyników, które nie doszły
  var fine = !!(window.matchMedia && window.matchMedia("(pointer: fine)").matches); // mysz albo touchpad = komputer

  var board = null;          // cały ranking [{name, score}] od najlepszego albo null, dopóki się nie wczyta
  var total = 0;             // ile osób jest w rankingu
  var boardError = false;
  var lastLoad = 0;          // kiedy ostatnio przyszedł ranking
  var loading = null;        // trwające wczytywanie rankingu
  var syncing = null;        // trwające wysyłanie wyników
  var syncAgain = false;
  var reqNo = 0, shownNo = 0; // numery zapytań: starsza odpowiedź nie nadpisze nowszego rankingu
  var bannedNo = 0;          // numer zapisu, na który arkusz odpowiedział, że nick jest ukryty
  var showAll = false;       // cały ranking czy skrót (top 10 i okolice twojego miejsca)
  var panelOpen = false;
  var warned = "";           // nick, przy którym pokazaliśmy „ten nick jest w rankingu”
  var warnedAt = 0;
  var msg = null;            // komunikat w okienku nicku: {key, vars, cls}
  var playing = false;       // trwa runda
  var trying = false;        // pierwsza próba zapisu („Zapisuję wynik…”); kolejne idą po cichu
  var idleTimer = 0;
  var deadAt = 0;            // kiedy był ostatni ruch po końcu rundy (0 = runda trwa albo już zapytaliśmy)
  var panelNo = 0;           // rośnie przy zamknięciu okienka: to, na co okienko czekało, wtedy odpada
  var lastSave = Object.create(null); // ostatni zapis każdego nicku: {score, saved}
  var rejected = Object.create(null); // nicki, których wyniku arkusz nie przyjął, i powód

  var nick = boardOn ? B.cleanName(MM.load(P + "nick", "")) : "";
  function myKey() { return B.key(nick); }
  function bestKey(n) { return P + "flap-best:" + B.key(n); }
  function localBest(n) { return +MM.load(bestKey(n), 0) || 0; }
  // rekord pokazywany w grze: z rankingiem osobno dla każdego nicku (wspólny laptop przy stoisku)
  var engineBest = boardOn ? (nick ? localBest(nick) : 0) : (+MM.load("mm-flap-best", 0) || 0);

  /* ---------- wyniki czekające na wysłanie (przetrwają odświeżenie strony) ---------- */
  var queue = (function () {
    var q = null, ok = Object.create(null);
    try { q = JSON.parse(MM.load(P + "unsent", "{}")); } catch (e) { q = null; }
    if (q && typeof q === "object") {
      Object.keys(q).forEach(function (k) {
        var it = q[k];
        if (it && typeof it.name === "string" && it.score > 0 && it.duration > 0) ok[k] = it;
      });
    }
    return ok;
  })();
  function queued() { return Object.keys(queue).length > 0; }
  function persist() { MM.save(P + "unsent", JSON.stringify(queue)); }
  function enqueue(name, score, duration) {
    var k = B.key(name);
    if (!queue[k] || queue[k].score < score) queue[k] = { name: name, score: score, duration: duration };
    persist();
  }
  function drop(k, score) {
    if (queue[k] && queue[k].score <= score) { delete queue[k]; persist(); }
  }

  function indexOf(n) {
    if (!board || !n) return -1;
    var k = B.key(n);
    for (var i = 0; i < board.length; i++) if (B.key(board[i].name) === k) return i;
    return -1;
  }

  /* ---------- rysowanie (zmieniamy stronę tylko wtedy, gdy coś się zmieniło,
     żeby czytnik ekranu nie powtarzał tych samych komunikatów) ---------- */
  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }
  function setHTML(el, h) { if (el.mmHtml !== h) { el.mmHtml = h; el.innerHTML = h; } }
  function setCls(el, c) { if (el.className !== c) el.className = c; }
  function setI18n(el, k) { if (el.getAttribute("data-i18n") !== k) el.setAttribute("data-i18n", k); setText(el, MM.t(k)); }
  function show(el, on) { el.classList.toggle("hidden", !on); }

  function renderRecord() {
    show(bar, true);
    var t;
    if (board === null) t = MM.t(boardError ? "game.boardOff" : "game.loading");
    else if (!board.length) t = MM.t("game.noRecord");
    else t = MM.tf("game.recordShort", { name: "⁨" + board[0].name + "⁩", n: board[0].score });
    setHTML(bar, TROPHY + "<span>" + MM.esc(t) + "</span>");
  }

  /* komunikat o graczu: wynik ostatniego zapisu albo miejsce w rankingu (zawsze z aktualnego rankingu) */
  function statusNow() {
    var k = myKey();
    if (queue[k]) return trying ? { key: "game.saving" } : { key: "game.saveLater", cls: "bad" };
    if (rejected[k]) return { key: rejected[k] === "banned" ? "game.nickBanned" : "game.saveRejected", cls: "bad" };
    if (board === null) return { key: boardError ? "game.boardOff" : "game.loading" };
    var i = indexOf(nick);
    if (i < 0) return { key: "game.unranked" };
    var v = { r: i + 1, t: total, n: board[i].score }, last = lastSave[k];
    if (last && last.saved && last.score === board[i].score) return { key: "game.newRecord", vars: v, cls: "ok" };
    return { key: "game.rank", vars: v };
  }

  function renderPlayer() {
    show(playerBar, !!nick);
    var t = "", cls = "";
    if (nick) {
      var parts = MM.t("game.playingAs").split("{name}");
      setHTML(playerName, MM.esc(parts[0]) + "<strong>⁨" + MM.esc(nick) + "⁩</strong>" + MM.esc(parts.slice(1).join("")));
      var s = statusNow();
      t = MM.tf(s.key, s.vars || {});
      cls = s.cls || "";
      setCls(statusEl, "player-status" + (cls ? " " + cls : ""));
      setText(statusEl, t);
    }
    // ten sam komunikat w ramce gry, bo na telefonie pasek pod grą bywa poza ekranem
    var on = !!(nick && t && !playing && !panelOpen);
    setCls(pill, "frame-status" + (cls ? " " + cls : "") + (on ? "" : " hidden"));
    setText(pillText, t);
  }

  function noteRow(key) { return '<li class="board-note">' + MM.esc(MM.t(key)) + "</li>"; }

  function renderBoard() {
    show(boardWrap, true);
    setText(countEl, board && board.length ? MM.tf("game.boardCount", { n: total }) : "");
    var more = !!(board && board.length > COMPACT + 2);
    show(moreBtn, more);
    if (more) {
      setText(moreBtn, showAll ? MM.t("game.showLess") : MM.tf("game.showAll", { n: total }));
      moreBtn.setAttribute("aria-expanded", showAll ? "true" : "false");
    }
    if (board === null) { setHTML(list, noteRow(boardError ? "game.boardOff" : "game.loading")); return; }
    if (!board.length) { setHTML(list, noteRow("game.boardEmpty")); return; }
    var me = indexOf(nick);
    var compact = !showAll && more;
    var html = "", prev = -1;
    for (var i = 0; i < board.length; i++) {
      if (compact && i >= COMPACT && Math.abs(i - me) > 1) continue;
      if (i > prev + 1) html += '<li class="board-gap" aria-hidden="true">⋯</li>';
      var e = board[i], mine = i === me;
      html += '<li class="' + (mine ? "me " : "") + (i < 3 ? "top" + (i + 1) : "") + '">' +
        '<span class="rank">' + (i + 1) + "</span>" +
        '<span class="who"><span class="nm">' + MM.esc(e.name) + "</span>" +
        (mine ? '<span class="you">' + MM.esc(MM.t("game.you")) + "</span>" : "") + "</span>" +
        '<span class="pts">' + MM.esc(e.score) + "</span></li>";
      prev = i;
    }
    if (compact && prev < board.length - 1) html += '<li class="board-gap" aria-hidden="true">⋯</li>';
    setHTML(list, html);
  }

  function renderMsg() {
    setCls(nickMsg, "nick-msg" + (msg && msg.cls ? " " + msg.cls : ""));
    setText(nickMsg, msg ? MM.tf(msg.key, msg.vars || {}) : "");
  }
  function setMsg(key, vars, cls) { msg = key ? { key: key, vars: vars, cls: cls } : null; renderMsg(); }

  function renderAll() {
    if (!boardOn) return;
    renderRecord();
    renderPlayer();
    renderBoard();
    renderMsg();
  }

  /* ---------- rozmowa z arkuszem ---------- */
  function applyBoard(d, no) {
    if (no < shownNo) return; // ta odpowiedź jest starsza niż ranking, który już widać
    shownNo = no;
    board = d.top;
    total = d.total;
    boardError = false;
    lastLoad = Date.now();
    // ktoś usunął x w arkuszu i nick znowu jest w rankingu: nie pokazuj już, że jest ukryty
    var k = myKey();
    if (rejected[k] === "banned" && no > bannedNo && indexOf(nick) >= 0) delete rejected[k];
  }

  /* odśwież ranking, chyba że jest świeższy niż maxAge ms */
  function refresh(maxAge) {
    if (!boardOn) return Promise.resolve();
    if (syncing) return syncing;
    if (loading) return loading;
    if (maxAge && board && Date.now() - lastLoad < maxAge) return Promise.resolve();
    var no = ++reqNo;
    loading = B.load().then(function (d) { applyBoard(d, no); }, function () { boardError = true; }).then(function () {
      loading = null;
      renderAll();
    });
    return loading;
  }

  function sendNext() {
    var keys = Object.keys(queue);
    if (!keys.length) return Promise.resolve();
    var k = keys[0], item = queue[k], no = ++reqNo;
    return B.submit(item.name, item.score, item.duration).then(function (d) {
      applyBoard(d, no);
      lastSave[k] = { score: item.score, saved: !!d.saved };
      delete rejected[k];
      drop(k, item.score);
      return sendNext();
    }, function (err) {
      if (!err || !err.permanent) throw err;
      if (err.message === "banned") bannedNo = no;
      rejected[k] = err.message; // np. "too fast" albo "banned": tego nie da się zapisać, nie próbuj w kółko
      drop(k, item.score);
      return sendNext();
    });
  }

  /* wyślij wszystko z kolejki; true = wysłane, false = nie wyszło (zostaje w kolejce na potem).
     Czekający dostają wynik tej próby, a dodatkowa próba (syncAgain) idzie już osobno,
     więc przy zawieszonym internecie „Zapisuję wynik…” nie wisi bez końca. */
  function sync() {
    if (!boardOn || !queued()) return Promise.resolve(true);
    if (syncing) { syncAgain = true; return syncing; }
    syncing = sendNext().then(function () { return true; }, function () { return false; }).then(function (ok) {
      syncing = null;
      renderAll();
      if (syncAgain) { syncAgain = false; sync(); }
      return ok;
    });
    return syncing;
  }

  /* do kolejki idzie tylko nowy rekord nicku (albo wynik, gdy rankingu jeszcze nie znamy) */
  function offer(score, duration) {
    var i = indexOf(nick);
    if (score > 0 && (board === null || i < 0 || score > board[i].score)) { enqueue(nick, score, duration); return true; }
    return false;
  }

  function send() {
    trying = true;
    renderPlayer();
    sync().then(function () { trying = false; renderPlayer(); });
  }

  function gameOver(score, duration) {
    playing = false;
    deadAt = Date.now();
    if (!boardOn || !nick) return;
    var k = myKey();
    delete lastSave[k];
    delete rejected[k];
    armIdle();
    if (offer(score, duration)) { send(); return; }
    renderPlayer();
    if (queued()) sync(); // przy okazji to, czego wcześniej nie udało się wysłać
    // ranking w pamięci mógł być nieaktualny (np. ktoś usunął wiersze w arkuszu): sprawdź jeszcze raz
    if (score > 0) refresh(15000).then(function () { if (myKey() === k && !playing && offer(score, duration)) send(); });
  }

  /* ---------- okienko z nickiem ----------
     mode: "first" = pierwszy raz, "change" = przycisk Zmień nick, "again" = komputer pyta, kto gra teraz */
  function armIdle() {
    clearTimeout(idleTimer);
    if (!boardOn || !fine) return;
    idleTimer = setTimeout(function () {
      if (!panelOpen && !playing && nick) openPanel("again", true);
    }, IDLE_MS);
  }

  /* komputer: pierwsza próba nowej rundy po przerwie dłuższej niż ASK_MS (np. gracz odszedł,
     a podeszła kolejna osoba) najpierw pyta „Kto gra teraz?” i gra wtedy nie startuje.
     Szybkie kliknięcia tej samej osoby liczą przerwę od nowa, więc jej nie przeszkadzają. */
  function askFirst(e) {
    if (!boardOn || !fine || !nick || panelOpen || playing || !deadAt) return;
    if (Date.now() - deadAt <= ASK_MS) { deadAt = Date.now(); return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    openPanel("again", true);
  }

  function openPanel(mode, quiet) {
    clearTimeout(idleTimer);
    deadAt = 0;
    panelOpen = true;
    warned = "";
    input.value = nick;
    playBtn.disabled = false;
    setI18n(playBtn, "game.play");
    setI18n(panelTitle, mode === "again" ? "game.whoNext" : "game.who");
    setI18n(panelText, mode === "again" ? "game.whoNextText" : "game.whoText");
    msg = null;
    renderMsg();
    show(cancelBtn, !!nick);
    show(panel, true);
    renderPlayer();
    refresh(10000); // świeży ranking, żeby sprawdzić, czy nick jest wolny
    // na komputerze od razu kursor w polu; na telefonie klawiatura tylko po stuknięciu w „Zmień nick”
    if (mode === "change" || fine) {
      try { input.focus(quiet ? { preventScroll: true } : undefined); } catch (e) { input.focus(); }
      input.select();
    }
  }

  function closePanel() {
    panelNo++;
    panelOpen = false;
    show(panel, false);
    var a = document.activeElement;
    if (a && a !== document.body && panel.contains(a) && a.blur) a.blur();
    renderPlayer();
    if (!playing) armIdle(); // następna osoba może podejść także bez nowej gry
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (v) { clearTimeout(timer); resolve(v); }, function (e) { clearTimeout(timer); reject(e); });
    });
  }

  /* nowy nick = strona wczytuje się od nowa (żeby gra pokazała rekord tego nicku),
     ale tylko gdy jest internet; bez niego zamiast gry byłaby strona błędu.
     Anuluj albo Escape w tym czasie odwołuje przeładowanie (zostaje ta strona, nick już nowy). */
  function reloadSoon() {
    var no = panelNo;
    playBtn.disabled = true;
    setMsg("game.loading");
    var t0 = Date.now();
    (function wait() {
      if (no !== panelNo) return;
      if (syncing && Date.now() - t0 < 2500) { setTimeout(wait, 100); return; }
      withTimeout(fetch(location.href, { method: "HEAD", cache: "no-store" }), 4000).then(function () {
        if (no !== panelNo || playing) return;
        try { sessionStorage.setItem(P + "nick-reload", "1"); } catch (e) { /* bez pamięci */ }
        location.reload();
      }, function () {
        if (no !== panelNo) return;
        playBtn.disabled = false;
        setMsg(null);
        closePanel();
        renderAll();
      });
    })();
  }

  function blurOnTouch() { if (!fine) input.blur(); } // telefon: chowa klawiaturę, żeby było widać komunikat

  function choose() {
    var name = B.cleanName(input.value);
    if (!name) { setMsg("game.nickBad", null, "bad"); blurOnTouch(); return; }
    var k = B.key(name), changed = k !== myKey(), i = indexOf(name);
    if (changed && i >= 0) {
      if (warned !== k) {
        // ktoś już gra tym nickiem: ostrzeżenie, a przycisk zmienia się na „To ja”
        warned = k;
        warnedAt = Date.now();
        setMsg("game.nickTaken", { name: "⁨" + board[i].name + "⁩", n: board[i].score }, "warn");
        setI18n(playBtn, "game.itsMe");
        blurOnTouch();
        return;
      }
      if (Date.now() - warnedAt < 1000) return; // drugi klik z podwójnego kliknięcia to jeszcze nie „to ja”
    }
    if (i >= 0) name = board[i].name; // zostaje pisownia z rankingu (Bartek, nie bartek)
    nick = name;
    MM.save(P + "nick", name);
    // rekord w samej grze ma należeć do tego nicku, a gra wczytuje go tylko na starcie strony
    if (changed && localBest(name) !== engineBest && MM.load(P + "nick", "") === name) { reloadSoon(); return; }
    setMsg(null);
    closePanel();
    renderAll();
  }

  panel.addEventListener("submit", function (e) {
    e.preventDefault();
    if (playBtn.disabled) return;
    var nm = B.cleanName(input.value);
    if (board === null && nm && B.key(nm) !== myKey()) {
      // nowy nick, a ranking jeszcze się nie wczytał: chwilę poczekaj, żeby sprawdzić, czy nick jest wolny
      // (trwające wczytywanie samo kończy się po 12 s, nowa próba czeka najwyżej 4 s)
      var no = panelNo;
      playBtn.disabled = true;
      setMsg("game.loading");
      (loading || withTimeout(refresh(), 4000)).catch(function () {}).then(function () {
        if (no !== panelNo) return; // okienko zamknięte w międzyczasie
        playBtn.disabled = false;
        setMsg(null);
        choose();
      });
      return;
    }
    choose();
  });

  input.addEventListener("input", function () {
    if (warned) { warned = ""; setI18n(playBtn, "game.play"); }
    if (msg && !playBtn.disabled) setMsg(null);
  });
  panel.addEventListener("click", function (e) { if (e.target === panel) input.focus(); }); // stuknięcie obok okienka
  cancelBtn.addEventListener("click", closePanel);
  changeBtn.addEventListener("click", function () { openPanel("change"); });
  moreBtn.addEventListener("click", function (e) {
    showAll = !showAll;
    renderBoard();
    if (e.detail) moreBtn.blur(); // po kliknięciu myszą spacja znowu steruje grą
  });

  /* spacja i strzałka w górę: przy otwartym okienku nie startują gry pod spodem (Escape je zamyka),
     a gdy gra jest prawie poza ekranem albo fokus jest na przycisku rankingu, działają jak zwykle na stronie */
  window.addEventListener("keydown", function (e) {
    if (!boardOn) return;
    var space = e.code === "Space" || e.code === "ArrowUp" || e.key === " ";
    var t = e.target, tag = t && t.tagName;
    var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!(t && t.isContentEditable);
    if (!panelOpen) {
      if (!space || typing || (tag === "BUTTON" && t.form)) return; // tych klawiszy gra i tak nie bierze
      var r = frame.getBoundingClientRect();
      var seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (seen < r.height * 0.4 || t === moreBtn || t === changeBtn) { e.stopImmediatePropagation(); return; }
      if (!e.repeat) askFirst(e);
      return;
    }
    if (e.key === "Escape" && nick) { closePanel(); return; }
    // cały podpowiedziany nick zaznaczony: spacja (klawisz gry) go nie kasuje, Enter albo Graj gra dalej
    if (t === input && space && !e.isComposing && input.value &&
        input.selectionStart === 0 && input.selectionEnd === input.value.length) { e.preventDefault(); return; }
    if (typing) return;
    if (space) {
      e.stopImmediatePropagation();
      if (tag !== "BUTTON") e.preventDefault();
    }
  }, true);

  // klik w grę po przerwie: najpierw „Kto gra teraz?” (ten klik nie dochodzi do gry)
  frame.addEventListener("pointerdown", function (e) { if (e.target === canvas) askFirst(e); }, true);

  window.MM_GAME = MatchaFlap.start(canvas, {
    colors: MM.cups().map(function (c) { return c.color; }),
    text: function (k) { return MM.t(k); },
    loadBest: function () { return engineBest; },
    saveBest: function (v) {
      engineBest = v;
      if (!boardOn) MM.save("mm-flap-best", String(v));
      else if (nick) MM.save(bestKey(nick), String(v));
    },
    onStart: function () {
      playing = true;
      deadAt = 0;
      clearTimeout(idleTimer);
      if (!boardOn) return;
      renderPlayer();
      if (board === null && !loading) refresh(); // ranking chwilowo nie działał: spróbuj jeszcze raz
    },
    onGameOver: gameOver,
    canRestart: function () { return !panelOpen; }
  });

  if (boardOn) {
    wrapEl.classList.add("has-board");
    var afterReload = false;
    try {
      afterReload = sessionStorage.getItem(P + "nick-reload") === "1";
      sessionStorage.removeItem(P + "nick-reload");
    } catch (e) { /* bez pamięci */ }
    if (!nick) openPanel("first");
    else if (fine && !afterReload) openPanel("again");
    else armIdle();
    if (queue[myKey()]) trying = true;
    renderAll();
    refresh().then(function () { return sync(); }).then(function () { trying = false; renderPlayer(); });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible") return;
      if (queued()) sync(); else refresh(30000);
    });
    window.addEventListener("online", function () { if (queued()) sync(); else refresh(5000); });
    setInterval(function () { // ponawianie zapisu (np. gdy wróci internet); trwającej próby nie przedłuża
      if (document.visibilityState === "visible" && !playing && queued() && !syncing) sync();
    }, RETRY_MS);
    setInterval(function () { // świeży ranking, gdy strona jest otwarta, a nikt nie gra
      if (document.visibilityState === "visible" && !playing) refresh(REFRESH_MS - 5000);
    }, REFRESH_MS);
    MM.onLang(renderAll);
  }
});
