/* Strona Kubki: legenda kolorów + losowanie pytania */
document.addEventListener("DOMContentLoaded", function () {
  var selected = null; // null = wszystkie kolory
  var lastText = null;

  function drawGrid() {
    document.getElementById("cup-grid").innerHTML = MM.cups().map(function (c) {
      var topic = c.topic
        ? '<div class="topic">' + MM.esc(MM.pick(c.topic)) + "</div>"
        : '<div class="topic tbd">' + MM.t("cups.tbd") + "</div>";
      return '<a class="cup-card" style="--cup:' + c.color + '" href="temat.html?k=' + encodeURIComponent(c.key) + '">' +
        MM.cupSVG(c.color, c.symbol) +
        '<div class="sym">' + MM.esc(c.symbol) + "</div>" +
        '<div class="cname">' + MM.esc(MM.pick(c.name)) + "</div>" + topic + "</a>";
    }).join("");
  }

  function drawDots() {
    var row = document.getElementById("mix-row");
    var html = '<button type="button" class="mix-dot' + (selected === null ? " on" : "") +
      '" style="--cup:conic-gradient(' + MM.cups().map(function (c) { return c.color; }).join(",") + ')" data-k="" title="' + MM.t("cups.all") + '" aria-label="' + MM.t("cups.all") + '"></button>';
    html += MM.cups().map(function (c) {
      return '<button type="button" class="mix-dot' + (selected === c.key ? " on" : "") + '" style="--cup:' + c.color +
        '" data-k="' + c.key + '" aria-label="' + MM.esc(MM.pick(c.name)) + '">' + MM.esc(c.symbol) + "</button>";
    }).join("");
    row.innerHTML = html;
    row.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        selected = b.getAttribute("data-k") || null;
        drawDots();
      });
    });
  }

  function pool() {
    var list = [];
    MM.cups().forEach(function (c) {
      if (selected && c.key !== selected) return;
      (c.questions || []).forEach(function (q) { list.push({ cup: c, q: q }); });
    });
    return list;
  }

  var current = null;
  function showCurrent() {
    var el = document.getElementById("drawn");
    if (!current) { el.innerHTML = '<span style="color:var(--ink-soft)">' + MM.t("cups.drawEmpty") + "</span>"; return; }
    el.innerHTML = '<div><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + current.cup.color +
      ';margin-right:8px;vertical-align:middle"></span>' + MM.esc(MM.pick(current.q)) + "</div>";
  }

  document.getElementById("draw-btn").addEventListener("click", function () {
    var p = pool();
    if (!p.length) { current = null; showCurrent(); return; }
    var next;
    var guard = 0;
    do { next = p[Math.floor(Math.random() * p.length)]; guard++; }
    while (p.length > 1 && next.q === lastText && guard < 20);
    lastText = next.q;
    current = next;
    showCurrent();
  });

  function all() { drawGrid(); drawDots(); showCurrent(); }
  all();
  MM.onLang(all);
});
