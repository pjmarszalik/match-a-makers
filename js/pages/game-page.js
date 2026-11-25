/* Podstrona z grą - łączy silnik gry z kolorami kubków i językiem */
document.addEventListener("DOMContentLoaded", function () {
  var canvas = document.getElementById("game");
  window.MM_GAME = MatchaFlap.start(canvas, {
    colors: MM.cups().map(function (c) { return c.color; }),
    text: function (k) { return MM.t(k); },
    loadBest: function () { return MM.load("mm-flap-best", 0); },
    saveBest: function (v) { MM.save("mm-flap-best", String(v)); }
  });
});
