/* ==========================================================
   Match(a) Makers - RANKING MATCHA NINJA (klient)
   Kopia js/leaderboard.js (ranking Flappy) dla drugiej gry, żeby rankingu
   Flappy nic tu nie zmieniało. Ten sam adres Apps Script (leaderboardUrl
   w js/config.js), ale z dopiskiem game=ninja: wyniki idą do zakładki "Ninja".

   Bezpiecznik: zanim cokolwiek wyśle, sprawdza, czy skrypt w arkuszu zna
   game=ninja (odpowiada "game":"ninja"). Stary skrypt by tego nie umiał
   i wpisałby wynik do rankingu Flappy, więc wtedy ranking Ninja się nie pokazuje.

   Test bez arkusza: ninja.html?demo=1 (klucze mm-demo-ninja-*, nic nie trafia do arkusza).
   ========================================================== */

(function () {
  var C = window.MM_CONFIG || {};
  var MAX_NAME = 30; // tyle samo co MAX_NAME w skrypcie arkusza i maxlength w gra.html
  var demo = /[?&]demo=1(&|$)/.test(location.search);
  var GAME = "ninja";
  var MAX_SCORE = 9999;  // tyle samo co max dla ninja w skrypcie arkusza
  var cache = null;
  var verified = false;  // skrypt w arkuszu odpowiedział, że zna game=ninja

  /* to samo co w skrypcie arkusza: za dużo punktów na sekundę = „za szybko” */
  function tooFast(score, sec) { return sec <= 0 || score > sec * 8 + 15; }

  function url() { return String(C.leaderboardUrl || "").trim(); }
  function enabled() { return demo || url().length > 0; }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (v) { clearTimeout(timer); resolve(v); }, function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function readJson(r) {
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  }

  /* błędy, przy których ponowne wysłanie nic nie da
     (zły nick, zły wynik, za szybko, nick ukryty w arkuszu) */
  function fail(code) {
    var e = new Error(code || "error");
    e.permanent = /^(name|score|too fast|bad request|banned)$/.test(code || "");
    return e;
  }

  function check(d) {
    if (!d || !d.ok) throw fail(d && d.error);
    if (d.game !== GAME) throw new Error("old script"); // stary skrypt: nie zna rankingu Ninja
    verified = true;
    if (!Array.isArray(d.top)) throw new Error("bad answer");
    if (typeof d.total !== "number") d.total = d.top.length; // starsza wersja skryptu nie podaje total
    cache = d.top;
    return d;
  }

  /* cały ranking: {top: [{name, score}, ...] od najlepszego, total: liczba osób} */
  function load() {
    if (!enabled()) return Promise.reject(new Error("off"));
    if (demo) return Demo.get();
    var u = url() + (url().indexOf("?") >= 0 ? "&" : "?") + "game=" + GAME + "&t=" + Date.now();
    // limit czasu obejmuje też czytanie odpowiedzi, nie tylko połączenie
    return withTimeout(fetch(u).then(readJson), 12000).then(check);
  }

  /* sama lista (strona główna pokazuje z niej rekordzistę) */
  function top() {
    return load().then(function (d) { return d.top; });
  }

  /* zapis wyniku, odpowiedź jak w load() plus saved: czy to nowy rekord nicku.
     Bez nagłówka Content-Type, żeby przeglądarka nie robiła zapytania wstępnego
     (CORS), którego Apps Script nie obsługuje. */
  function submit(name, score, duration) {
    if (!enabled()) return Promise.reject(new Error("off"));
    if (demo) return Demo.post(name, score, duration);
    // nigdy nie wysyłaj, dopóki nie wiadomo, że skrypt zna game=ninja (inaczej wynik trafiłby do Flappy)
    var ready = verified ? Promise.resolve() : load();
    return ready.then(function () {
      var body = JSON.stringify({ game: GAME, name: name, score: score, duration: duration });
      return withTimeout(fetch(url(), { method: "POST", body: body }).then(readJson), 20000).then(check);
    });
  }

  /* te same zasady co w arkuszu: litery z każdego alfabetu, cyfry, spacja, kropka, _ i -,
     bez znaków niewidocznych, max 30 znaków, przynajmniej jedna litera albo cyfra */
  function cleanName(s) {
    // kolejność ma znaczenie: niewidoczne znaki precz, każda spacja (też twarda) to zwykła spacja,
    // reszta niedozwolonych precz, dopiero potem NFC; drugie czyszczenie nic już nie zmienia
    var t = String(s || "").replace(/\p{DI}/gu, "").replace(/\s/g, " ").replace(/[^\p{L}\p{M}\p{N} ._-]/gu, "");
    if (t.normalize) t = t.normalize("NFC");
    t = t.replace(/ +/g, " ").trim();
    var a = Array.from(t);
    if (a.length > MAX_NAME) t = a.slice(0, MAX_NAME).join("").replace(/[ ._-]+$/, "");
    return /[\p{L}\p{N}]/u.test(t) ? t : "";
  }

  /* "Ania" i "ania" to ten sam nick (tak liczy też arkusz) */
  function key(name) { return String(name || "").toLowerCase(); }

  /* ---------- tryb ?demo=1: udawany arkusz w pamięci przeglądarki ---------- */
  var Demo = (function () {
    var KEY = "mm-demo-ninja-board";
    var SEED = [["Kasia", 84], ["Tomek", 61], ["Ania", 55], ["Ola z fizyki", 43], ["Bartek", 38], ["Zuzia", 30],
      ["Michał", 26], ["Wiktoria", 21], ["Kuba", 17], ["Natalia", 12], ["Paweł", 9], ["Iga", 5], ["Staś", 2]];
    var mem = null;

    function rows() {
      var m = null;
      try { m = JSON.parse(localStorage.getItem(KEY)); } catch (e) { m = null; }
      if (Array.isArray(m)) return (mem = m); // czytane za każdym razem: inna karta z demo mogła coś zapisać
      if (!mem) mem = SEED.map(function (r, i) { return { name: r[0], score: r[1], at: i }; });
      return mem;
    }
    function store() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* zostaje w pamięci */ } }
    function answer(extra) {
      var all = rows().slice().sort(function (a, b) { return b.score - a.score || a.at - b.at; });
      var d = { ok: true, game: GAME, top: all.map(function (x) { return { name: x.name, score: x.score }; }), total: all.length };
      for (var k in extra) d[k] = extra[k];
      return d;
    }
    function later(fn) {
      return new Promise(function (resolve) { setTimeout(resolve, 350); }).then(fn);
    }
    return {
      get: function () { return later(function () { return check(answer({})); }); },
      post: function (name, score, duration) {
        return later(function () {
          var n = cleanName(name), s = Math.floor(Number(score)), sec = Number(duration) || 0;
          if (!n) throw fail("name");
          if (!isFinite(s) || s < 1 || s > MAX_SCORE) throw fail("score");
          if (tooFast(s, sec)) throw fail("too fast");
          var list = rows(), k = key(n), cur = null, saved = false, maxAt = 0;
          list.forEach(function (x) { if (key(x.name) === k) cur = x; if (x.at > maxAt) maxAt = x.at; });
          if (!cur) { list.push({ name: n, score: s, at: maxAt + 1 }); saved = true; }
          else if (s > cur.score) { cur.name = n; cur.score = s; cur.at = maxAt + 1; saved = true; }
          store();
          return check(answer({ saved: saved }));
        });
      }
    };
  })();

  window.MM_NINJA_BOARD = {
    enabled: enabled,
    demo: demo,
    load: load,
    top: top,
    submit: submit,
    cleanName: cleanName,
    key: key,
    maxName: MAX_NAME,
    cached: function () { return cache; }
  };
})();
