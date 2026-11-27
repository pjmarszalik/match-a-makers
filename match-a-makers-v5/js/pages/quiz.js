/* Quiz "Jaką jesteś stałą?" - pytania i opisy wyników są w js/data/quiz.js */
document.addEventListener("DOMContentLoaded", function () {
  var Q = window.MM_QUIZ || [];
  var R = window.MM_QUIZ_RESULTS || {};
  var state = { step: -1, answers: [] }; // -1 = ekran startowy
  var root = document.getElementById("quiz");

  function result() {
    var score = {}, max = 0, key = null, best = null;
    MM.cups().forEach(function (c) { score[c.key] = 0; });
    state.answers.forEach(function (cup) { if (score.hasOwnProperty(cup)) score[cup]++; });
    Object.keys(score).forEach(function (k) { if (score[k] > max) max = score[k]; });
    // remis: wygrywa stała z najpóźniejszej odpowiedzi, żeby żadna nie była faworyzowana
    for (var i = state.answers.length - 1; i >= 0 && key === null; i--) {
      if (score[state.answers[i]] === max) key = state.answers[i];
    }
    MM.cups().forEach(function (c) { if (c.key === key) best = c; });
    return best || MM.cups()[0] || null;
  }

  function draw() {
    if (state.step === -1) {
      root.innerHTML =
        '<div class="quiz-cups">' +
        MM.cups().map(function (c) { return MM.cupSVG(c.color, c.symbol, "cup").replace('class="cup"', 'class="cup" style="width:52px;height:59px"'); }).join("") +
        '</div><div style="text-align:center"><button class="btn green" type="button" id="go">' + MM.t("quiz.start") + "</button></div>";
      document.getElementById("go").addEventListener("click", function () { state.step = 0; state.answers = []; draw(); });
      return;
    }

    if (state.step >= Q.length) {
      var c = result();
      if (!c) { state.step = -1; draw(); return; }
      MM.save("mm-quiz", c.key);
      var character = R[c.key] ? '<p class="result-text">' + MM.esc(MM.pick(R[c.key])) + "</p>" : "";
      root.innerHTML =
        '<span class="eyebrow">' + MM.t("quiz.result") + "</span>" +
        '<div class="result-cup">' + MM.cupSVG(c.color, c.symbol) +
        '<div style="min-width:0"><div class="result-sym">' + MM.esc(c.symbol) + "</div>" +
        '<div class="result-name">' + MM.esc(MM.pick(c.name)) + "</div></div></div>" +
        character +
        '<div class="quiz-actions">' +
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
