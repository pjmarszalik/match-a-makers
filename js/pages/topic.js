/* Podstrona jednego kubka: temat.html?k=pi
   Pytanie na start rozmowy (z przyciskiem "Inne pytanie"),
   czym jest stała i jedna ciekawostka. Dane w js/data/cups.js */
document.addEventListener("DOMContentLoaded", function () {
  /* biały tekst na kolorze kubka, chyba że kolor jest za jasny (kontrast poniżej 3:1), wtedy ciemny */
  function onCup(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return "#fff";
    var n = parseInt(m[1], 16);
    var lum = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
    return 1.05 / (L + 0.05) < 3 ? "#1f2a1b" : "#fff";
  }

  var key = new URLSearchParams(location.search).get("k");
  var qIndex = -1;

  function pickQuestion(c) {
    var qs = c.questions || [];
    if (qs.length === 0) { qIndex = -1; return; }
    if (qs.length === 1) { qIndex = 0; return; }
    var next = qIndex;
    while (next === qIndex) next = Math.floor(Math.random() * qs.length);
    qIndex = next;
  }

  function questionHTML(c) {
    var qs = c.questions || [];
    if (qIndex < 0 || !qs[qIndex]) return '<p class="note">' + MM.t("topic.noQuestions") + "</p>";
    var q = qs[qIndex];
    return '<div class="q-big">' + MM.esc(MM.pick(q)) + "</div>" +
      (q.sample ? '<span class="badge">' + MM.t("topic.sample") + "</span>" : "");
  }

  function draw() {
    var root = document.getElementById("topic");
    var c = MM.cupByKey(key);
    if (!c) {
      root.innerHTML = '<div class="page-head"><h1>?</h1><p class="lead">' + MM.t("topic.notFound") +
        '</p><a class="btn" href="kubki.html">' + MM.t("topic.back") + "</a></div>";
      return;
    }
    document.title = c.symbol + " · " + MM.pick(c.name) + " · Match(a) Makers";
    if (qIndex < 0) pickQuestion(c);

    var topic = c.topic ? MM.esc(MM.pick(c.topic)) : MM.t("cups.tbd");
    var many = (c.questions || []).length > 1;

    var others = MM.cups().filter(function (o) { return o.key !== c.key; }).map(function (o) {
      return '<a href="temat.html?k=' + encodeURIComponent(o.key) + '" class="mix-dot" style="--cup:' + o.color +
        ';text-decoration:none" aria-label="' + MM.esc(MM.pick(o.name)) + '" title="' + MM.esc(MM.pick(o.name)) + '">' + MM.esc(o.symbol) + "</a>";
    }).join("");

    var source = c.source && c.source.url
      ? '<p class="source">' + MM.t("topic.source") + ': <a href="' + MM.esc(c.source.url) + '" target="_blank" rel="noopener">' + MM.esc(c.source.label || c.source.url) + "</a></p>"
      : "";

    root.innerHTML =
      '<p style="margin:18px 0 0"><a href="kubki.html">← ' + MM.t("topic.back") + "</a></p>" +
      '<div class="topic-hero" style="--cup:' + c.color + ";--on-cup:" + onCup(c.color) + '">' +
      (c.placeholder ? '<div class="topic-badge">' + MM.placeholderBadge() + "</div>" : "") +
      '<div class="sym">' + MM.esc(c.symbol) + "</div>" +
      '<div class="value">' + MM.esc(MM.pick(c.name)) + " · " + MM.esc(c.value || "") + "</div>" +
      "<h1>" + topic + "</h1>" +
      MM.cupSVG("#ffffff", "", "cup", 0.7) +
      "</div>" +

      '<div class="question-card" style="--cup:' + c.color + '">' +
      '<span class="eyebrow">' + MM.t("topic.question") + "</span>" +
      '<div id="q-box" aria-live="polite">' + questionHTML(c) + "</div>" +
      (many ? '<button type="button" class="btn green" id="q-next">' + MM.t("topic.another") + "</button>" : "") +
      "</div>" +

      '<div class="grid grid-2 topic-info">' +
      (c.about ? '<div class="card"><h3>' + MM.t("topic.about") + "</h3><p>" + MM.esc(MM.pick(c.about)) + "</p></div>" : "") +
      (c.fact ? '<div class="card fact-card" style="--cup:' + c.color + '"><h3>' + MM.t("topic.fact") + "</h3><p>" + MM.esc(MM.pick(c.fact)) + "</p>" + source + "</div>" : "") +
      "</div>" +

      '<div class="section" style="padding-bottom:0"><h3>' + MM.t("topic.others") + '</h3><div class="mix-row" style="justify-content:flex-start">' + others + "</div></div>";

    var next = document.getElementById("q-next");
    if (next) next.addEventListener("click", function () {
      pickQuestion(c);
      document.getElementById("q-box").innerHTML = questionHTML(c);
    });
  }

  draw();
  MM.onLang(draw);
});
