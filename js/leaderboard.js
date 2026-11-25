/* ==========================================================
   Match(a) Makers - RANKING GRY (klient)
   Rozmawia z arkuszem Google przez Apps Script.
   Adres aplikacji wpisujesz w js/config.js (leaderboardUrl).
   Bez adresu ranking po prostu się nie pokazuje.
   ========================================================== */

(function () {
  var C = window.MM_CONFIG || {};
  var cache = null;

  function url() { return String(C.leaderboardUrl || "").trim(); }
  function enabled() { return url().length > 0; }

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

  /* top 10: [{name, score}, ...] od najlepszego */
  function top() {
    if (!enabled()) return Promise.reject(new Error("off"));
    var u = url() + (url().indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
    return withTimeout(fetch(u), 12000).then(readJson).then(function (d) {
      if (!d || !d.ok || !Array.isArray(d.top)) throw new Error("bad answer");
      cache = d.top;
      return d.top;
    });
  }

  /* zapis wyniku. Bez nagłówka Content-Type, żeby przeglądarka nie robiła
     zapytania wstępnego (CORS), którego Apps Script nie obsługuje. */
  function submit(name, score, duration) {
    if (!enabled()) return Promise.reject(new Error("off"));
    var body = JSON.stringify({ name: name, score: score, duration: duration });
    return withTimeout(fetch(url(), { method: "POST", body: body }), 20000).then(readJson).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || "error");
      if (Array.isArray(d.top)) cache = d.top;
      return d;
    });
  }

  /* te same zasady co w arkuszu: litery z każdego alfabetu, cyfry, spacja, kropka, _ i -,
     max 12 znaków, przynajmniej jedna litera albo cyfra */
  function cleanName(s) {
    var t = String(s || "");
    if (t.normalize) t = t.normalize("NFC");
    t = t.replace(/[^\p{L}\p{M}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim();
    t = Array.from(t).slice(0, 12).join("").trim();
    return /[\p{L}\p{N}]/u.test(t) ? t : "";
  }

  /* czy wynik wejdzie do top 10 */
  function qualifies(score, list) {
    if (!(score > 0)) return false;
    if (!list || list.length < 10) return true;
    return score > list[list.length - 1].score;
  }

  window.MM_BOARD = {
    enabled: enabled,
    top: top,
    submit: submit,
    cleanName: cleanName,
    qualifies: qualifies,
    cached: function () { return cache; }
  };
})();
