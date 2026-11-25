/* Podstrona z grą - łączy silnik gry z kolorami kubków, językiem i rankingiem.
   Ranking działa tylko, gdy w js/config.js jest wpisany leaderboardUrl. */
document.addEventListener("DOMContentLoaded", function () {
  var B = window.MM_BOARD;
  var boardOn = !!(B && B.enabled());
  var board = null;        // top 10 z arkusza albo null, dopóki się nie wczyta
  var boardError = false;
  var panelOpen = false;
  var pending = null;      // {score, duration} czekający na zapis
  var note = null;         // komunikat pod nickiem: {key, vars, cls}, tłumaczony przy zmianie języka
  var round = 0;           // numer gry, żeby spóźnione odpowiedzi nie trafiały do nowej gry

  var canvas = document.getElementById("game");
  var bar = document.getElementById("record-bar");
  var wrap = document.getElementById("board-wrap");
  var list = document.getElementById("board");
  var panel = document.getElementById("save-panel");
  var title = document.getElementById("save-title");
  var input = document.getElementById("nick");
  var saveBtn = document.getElementById("save-btn");
  var skipBtn = document.getElementById("skip-btn");
  var msg = document.getElementById("save-msg");

  var TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4"/></svg>';

  function myNick() { return String(MM.load("mm-nick", "") || ""); }

  function renderRecord() {
    if (!boardOn) return;
    bar.classList.remove("hidden");
    if (board === null) {
      bar.innerHTML = TROPHY + "<span>" + MM.t(boardError ? "game.boardOff" : "game.loading") + "</span>";
    } else if (!board.length) {
      bar.innerHTML = TROPHY + "<span>" + MM.t("game.noRecord") + "</span>";
    } else {
      bar.innerHTML = TROPHY + "<span>" + MM.esc(MM.tf("game.recordShort", { name: board[0].name, n: board[0].score })) + "</span>";
    }
  }

  function renderBoard() {
    if (!boardOn) return;
    wrap.classList.remove("hidden");
    if (board === null) {
      list.innerHTML = '<li class="board-note">' + MM.t(boardError ? "game.boardOff" : "game.loading") + "</li>";
      return;
    }
    if (!board.length) {
      list.innerHTML = '<li class="board-note">' + MM.t("game.boardEmpty") + "</li>";
      return;
    }
    var me = myNick().toLowerCase();
    list.innerHTML = board.map(function (e, i) {
      var mine = me && String(e.name).toLowerCase() === me;
      return '<li class="' + (mine ? "me" : "") + '"><span class="rank">' + (i + 1) + '</span><span class="who">' +
        MM.esc(e.name) + '</span><span class="pts">' + MM.esc(e.score) + "</span></li>";
    }).join("");
  }

  function renderNote() {
    msg.className = "save-msg" + (note && note.cls ? " " + note.cls : "");
    msg.textContent = !note ? "" : note.vars ? MM.tf(note.key, note.vars) : MM.t(note.key);
  }
  function setNote(key, vars, cls) {
    note = key ? { key: key, vars: vars || null, cls: cls || "" } : null;
    renderNote();
  }

  function renderAll() {
    renderRecord();
    renderBoard();
    if (panelOpen && pending) {
      title.textContent = MM.tf("game.saveTitle", { n: pending.score });
      renderNote();
    }
  }

  function loadBoard() {
    if (!boardOn) return Promise.resolve();
    return B.top().then(function (l) {
      board = l; boardError = false; renderAll();
    }).catch(function () {
      boardError = true; renderAll();
    });
  }

  function showPanel(score, duration) {
    pending = { score: score, duration: duration };
    panelOpen = true;
    title.textContent = MM.tf("game.saveTitle", { n: score });
    setNote(null);
    input.value = myNick();
    saveBtn.disabled = false;
    panel.classList.remove("hidden");
    // na komputerze od razu kursor w polu nicku; na telefonie nie wyskakuje klawiatura
    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
      setTimeout(function () { input.focus(); }, 60);
    }
  }

  function hidePanel() {
    panelOpen = false;
    pending = null;
    note = null;
    panel.classList.add("hidden");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  panel.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!pending) return;
    var name = B.cleanName(input.value);
    if (!name) {
      setNote("game.nickBad", null, "bad");
      return;
    }
    var p = pending;
    saveBtn.disabled = true;
    setNote("game.saving");
    B.submit(name, p.score, Math.round(p.duration * 10) / 10).then(function (d) {
      MM.save("mm-nick", name);
      if (Array.isArray(d.top)) { board = d.top; boardError = false; }
      // panel zamknięty albo już nowa gra: tylko odśwież tabelę
      if (pending !== p) { renderAll(); return; }
      var key = name.toLowerCase(), idx = -1;
      (board || []).forEach(function (en, i) { if (idx < 0 && String(en.name).toLowerCase() === key) idx = i; });
      if (idx < 0) setNote("game.savedOut", null, "ok");
      // ten nick ma już w rankingu lepszy wynik (ranking trzyma najlepszy wynik każdego nicku)
      else if (Number(board[idx].score) > p.score) setNote("game.savedBetter", { n: idx + 1 }, "ok");
      else setNote("game.saved", { n: idx + 1 }, "ok");
      renderAll();
      setTimeout(function () { if (pending === p) hidePanel(); }, 1600);
    }).catch(function () {
      if (pending !== p) return;
      saveBtn.disabled = false;
      setNote("game.saveError", null, "bad");
    });
  });

  skipBtn.addEventListener("click", hidePanel);

  function offerSave(score, duration, r) {
    if (r === round && !panelOpen && B.qualifies(score, board || [])) showPanel(score, duration);
  }

  window.MM_GAME = MatchaFlap.start(canvas, {
    colors: MM.cups().map(function (c) { return c.color; }),
    text: function (k) { return MM.t(k); },
    loadBest: function () { return MM.load("mm-flap-best", 0); },
    saveBest: function (v) { MM.save("mm-flap-best", String(v)); },
    onStart: function () {
      round++;
      if (panelOpen) hidePanel();
      if (boardOn && boardError) loadBoard(); // ranking chwilowo nie działał: spróbuj jeszcze raz
    },
    onGameOver: function (score, duration) {
      if (!boardOn) return;
      var r = round;
      if (!boardError) { offerSave(score, duration, r); return; }
      loadBoard().then(function () { if (!boardError) offerSave(score, duration, r); });
    },
    canRestart: function () { return !panelOpen; }
  });

  renderAll();
  loadBoard();
  MM.onLang(renderAll);
});
