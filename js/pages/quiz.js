/* Quiz "Jakim kubkiem jesteś?" - pytania są w js/data/quiz.js */
document.addEventListener("DOMContentLoaded", function () {
  var Q = window.MM_QUIZ || [];
  var state = { step: -1, answers: [] }; // -1 = ekran startowy
  var root = document.getElementById("quiz");

  function result() {
    var score = {};
    MM.cups().forEach(function (c) { score[c.key] = 0; });
    state.answers.forEach(function (cup) { if (cup in score) score[cup]++; });
    var best = null;
    MM.cups().forEach(function (c) { if (best === null || score[c.key] > score[best.key]) best = c; });
    return best;
  }

  function draw() {
    if (state.step === -1) {
      root.innerHTML =
        '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:18px">' +
        MM.cups().map(function (c) { return MM.cupSVG(c.color, c.symbol, "cup").replace('class="cup"', 'class="cup" style="width:44px;height:50px"'); }).join("") +
        '</div><div style="text-align:center"><button class="btn green" type="button" id="go">' + MM.t("quiz.start") + "</button></div>";
      document.getElementById("go").addEventListener("click", function () { state.step = 0; state.answers = []; draw(); });
      return;
    }

    if (state.step >= Q.length) {
      var c = result();
      MM.save("mm-quiz", c.key);
      var topic = c.topic ? MM.esc(MM.pick(c.topic)) : MM.t("cups.tbd");
      root.innerHTML =
        '<span class="eyebrow">' + MM.t("quiz.result") + "</span>" +
        '<div class="result-cup">' + MM.cupSVG(c.color, c.symbol) +
        '<div><div style="font-family:var(--font-head);font-size:2.4rem;font-weight:600;line-height:1;color:' + c.color + '">' + MM.esc(c.symbol) + "</div>" +
        '<div style="color:var(--ink-soft);margin:4px 0 8px">' + MM.esc(MM.pick(c.name)) + "</div>" +
        "<div><strong>" + topic + "</strong></div></div></div>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">' +
        '<a class="btn green" href="temat.html?k=' + encodeURIComponent(c.key) + '">' + MM.t("quiz.seeCup") + "</a>" +
        '<button class="btn ghost" type="button" id="again">' + MM.t("quiz.again") + "</button></div>";
      document.getElementById("again").addEventListener("click", function () { state.step = 0; state.answers = []; draw(); });
      return;
    }

    var q = Q[state.step];
    var pct = Math.round((state.step / Q.length) * 100);
    root.innerHTML =
      '<div class="progress"><div style="width:' + pct + '%"></div></div>' +
      '<span class="eyebrow">' + MM.t("quiz.q") + " " + (state.step + 1) + " " + MM.t("quiz.of") + " " + Q.length + "</span>" +
      '<h2 style="margin:0">' + MM.esc(MM.pick(q.q)) + "</h2>" +
      '<div class="answers">' + q.a.map(function (a, i) {
        return '<button type="button" class="answer" data-i="' + i + '">' + MM.esc(MM.pick(a)) + "</button>";
      }).join("") + "</div>" +
      (state.step > 0 ? '<p style="margin:18px 0 0"><button type="button" class="btn ghost" id="back" style="padding:8px 16px">← ' + MM.t("quiz.back") + "</button></p>" : "");

    root.querySelectorAll(".answer").forEach(function (b) {
      b.addEventListener("click", function () {
        state.answers[state.step] = q.a[+b.getAttribute("data-i")].cup;
        state.step++;
        draw();
      });
    });
    var back = document.getElementById("back");
    if (back) back.addEventListener("click", function () { state.step--; state.answers.length = state.step; draw(); });
  }

  draw();
  MM.onLang(draw);
});
