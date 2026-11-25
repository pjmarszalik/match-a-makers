/* Strona Kubki: legenda kolorów. Każdy kubek prowadzi do swojej podstrony. */
document.addEventListener("DOMContentLoaded", function () {
  function drawGrid() {
    document.getElementById("cup-grid").innerHTML = MM.cups().map(function (c) {
      var topic = c.topic
        ? '<div class="topic">' + MM.esc(MM.pick(c.topic)) + "</div>"
        : '<div class="topic tbd">' + MM.t("cups.tbd") + "</div>";
      return '<a class="cup-card" style="--cup:' + c.color + '" href="temat.html?k=' + encodeURIComponent(c.key) + '">' +
        MM.cupSVG(c.color, c.symbol) +
        '<div class="sym">' + MM.esc(c.symbol) + "</div>" +
        '<div class="cname">' + MM.esc(MM.pick(c.name)) + "</div>" + topic +
        (c.placeholder ? '<span class="cup-badge">' + MM.placeholderBadge() + "</span>" : "") + "</a>";
    }).join("");
  }

  drawGrid();
  MM.onLang(drawGrid);
});
