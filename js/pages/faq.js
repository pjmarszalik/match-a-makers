/* FAQ - pytania w js/data/faq.js */
document.addEventListener("DOMContentLoaded", function () {
  var C = window.MM_CONFIG;

  function fill(s) {
    var and = MM.lang === "pl" ? " i " : " and ";
    var days = C.days.map(function (d) { return MM.fmtDay(d.start); }).join(and);
    var time = MM.fmtTime(C.days[0].start) + "–" + MM.fmtTime(C.days[0].end);
    return s.replace("{days}", days).replace("{time}", time).replace("{place}", MM.pick(C.place));
  }

  function draw() {
    var open = [];
    document.querySelectorAll("#faq details").forEach(function (d, i) { if (d.open) open.push(i); });
    document.getElementById("faq").innerHTML = (window.MM_FAQ || []).map(function (f, i) {
      return "<details" + (open.indexOf(i) >= 0 ? " open" : "") + "><summary>" + MM.esc(MM.pick(f.q)) + "</summary><p>" +
        MM.esc(fill(MM.pick(f.a))) + "</p></details>";
    }).join("");
  }

  draw();
  MM.onLang(draw);
});
