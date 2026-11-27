/* ==========================================================
   Match(a) Makers - PODZAKŁADKI W ZAKŁADCE GRA
   Przełącznik obok tytułu gry, np. Solo | Duel. Nową grę lub tryb
   dopisujesz jedną linijką w TABS (href = plik strony, text = klucz z i18n.js).
   Przełącznik pokazuje się dopiero, gdy włączone są co najmniej 2 zakładki.
   Duel liczy się jako włączony, gdy w js/config.js jest duel.databaseURL
   (albo w adresie jest ?demo=1). Bez tego gra solo wygląda jak dotąd.
   Gdy przełącznik nie mieści się obok tytułu (wąski telefon), tytuł chowa się
   wizualnie (czytnik ekranu dalej go czyta), żeby ramka gry nie zjechała niżej.
   ========================================================== */
(function () {
  var C = window.MM_CONFIG || {};
  var D = C.duel || {};
  var demo = /[?&]demo=1(&|$)/.test(location.search);

  var TABS = [
    { href: "gra.html", text: "tabs.flap" },
    { href: "duel.html", text: "tabs.duel", on: demo || !!(D.apiKey && D.databaseURL) },
    { href: "ninja.html", text: "tabs.ninja" }
  ];

  var nav = document.getElementById("game-tabs");
  if (!nav) return;
  var row = nav.parentNode;
  var h1 = row.querySelector("h1");
  var page = location.pathname.split("/").pop() || "index.html";
  var list = TABS.filter(function (t) { return t.on !== false; });
  if (list.length < 2) return;

  nav.innerHTML = list.map(function (t) {
    var here = t.href === page;
    return '<a href="' + t.href + (demo ? "?demo=1" : "") + '" data-i18n="' + t.text + '"' +
      (here ? ' class="on" aria-current="page"' : "") + "></a>";
  }).join("");
  nav.classList.remove("hidden");

  function fit() {
    if (!h1) return;
    row.classList.remove("compact");
    if (nav.offsetTop > h1.offsetTop + h1.offsetHeight / 2) row.classList.add("compact");
  }
  document.addEventListener("DOMContentLoaded", fit); // po wpisaniu tekstów (common.js)
  window.addEventListener("load", fit);               // po wczytaniu czcionek
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if (window.MM && window.MM.onLang) window.MM.onLang(fit);
})();
