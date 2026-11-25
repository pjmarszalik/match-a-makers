/* Podstrona jednego kubka: temat.html?k=h */
document.addEventListener("DOMContentLoaded", function () {
  var key = new URLSearchParams(location.search).get("k");

  function draw() {
    var root = document.getElementById("topic");
    var c = MM.cupByKey(key);
    if (!c) {
      root.innerHTML = '<div class="page-head"><h1>?</h1><p class="lead">' + MM.t("topic.notFound") +
        '</p><a class="btn" href="kubki.html">' + MM.t("topic.back") + "</a></div>";
      return;
    }
    document.title = c.symbol + " · Match(a) Makers";
    var topic = c.topic ? MM.esc(MM.pick(c.topic)) : MM.t("cups.tbd");
    var qs = (c.questions || []);
    var list = qs.length
      ? '<ul class="q-list" style="--cup:' + c.color + '">' + qs.map(function (q) {
          return "<li>" + MM.esc(MM.pick(q)) + (q.sample ? ' <span class="badge">' + MM.t("topic.sample") + "</span>" : "") + "</li>";
        }).join("") + "</ul>"
      : '<p class="note">' + MM.t("topic.noQuestions") + "</p>";

    var others = MM.cups().filter(function (o) { return o.key !== c.key; }).map(function (o) {
      return '<a href="temat.html?k=' + encodeURIComponent(o.key) + '" class="mix-dot" style="--cup:' + o.color +
        ';text-decoration:none" aria-label="' + MM.esc(MM.pick(o.name)) + '">' + MM.esc(o.symbol) + "</a>";
    }).join("");

    root.innerHTML =
      '<p style="margin:18px 0 0"><a href="kubki.html">← ' + MM.t("topic.back") + "</a></p>" +
      '<div class="topic-hero" style="--cup:' + c.color + '">' +
      '<div class="sym">' + MM.esc(c.symbol) + "</div>" +
      '<div class="value">' + MM.esc(MM.pick(c.name)) + " · " + MM.esc(c.value || "") + "</div>" +
      "<h1>" + topic + "</h1>" +
      MM.cupSVG("#ffffff", "", "cup", 0.7) +
      "</div>" +
      '<div class="section"><h2>' + MM.t("topic.questions") + "</h2>" + list + "</div>" +
      "<div><h3>" + MM.t("topic.others") + '</h3><div class="mix-row" style="justify-content:flex-start">' + others + "</div></div>";
  }

  draw();
  MM.onLang(draw);
});
