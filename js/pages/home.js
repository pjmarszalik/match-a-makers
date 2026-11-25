/* Strona główna: odliczanie, kafelki, kubki w nagłówku */
document.addEventListener("DOMContentLoaded", function () {
  var C = window.MM_CONFIG;
  var d1 = C.days[0], d2 = C.days[1];

  var ICONS = {
    cups: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 5h14l-1.6 14.2a2 2 0 0 1-2 1.8H8.6a2 2 0 0 1-2-1.8z"/><path d="M5.6 10h12.8"/></svg>',
    dress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 3h6l-1 5 4 13H6l4-13z"/><path d="M10 8h4"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7"/><path d="M12 17h.01"/></svg>',
    matcha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-5 0-8-3.5-8-8 6 0 8 3 8 8z"/><path d="M12 21c5 0 8-3.5 8-8-6 0-8 3-8 8z"/><path d="M12 21V9"/><path d="M12 9c0-3 1.5-5 4-6"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 11v3M6.5 12.5h3"/><path d="M15.5 12h.01M18 13.5h.01"/></svg>',
    faq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>'
  };

  var TILES = [
    ["kubki.html", "cups", "nav.cups", "home.tile.cups"],
    ["sukienka.html", "dress", "nav.dress", "home.tile.dress"],
    ["quiz.html", "quiz", "nav.quiz", "home.tile.quiz"],
    ["matcha.html", "matcha", "nav.matcha", "home.tile.matcha"],
    ["gra.html", "game", "nav.game", "home.tile.game"],
    ["faq.html", "faq", "nav.faq", "home.tile.faq"]
  ];

  function drawTiles() {
    document.getElementById("tiles").innerHTML = TILES.map(function (t) {
      return '<a class="tile" href="' + t[0] + '"><div class="tile-ico">' + ICONS[t[1]] + "</div><h3>" +
        MM.t(t[2]) + "</h3><p>" + MM.t(t[3]) + "</p></a>";
    }).join("");
  }

  function drawMeta() {
    var cal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
    var clock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    document.getElementById("hero-meta").innerHTML =
      '<span class="chip">' + cal + MM.esc(MM.fmtDay(d1.start)) + "</span>" +
      '<span class="chip">' + cal + MM.esc(MM.fmtDay(d2.start)) + "</span>" +
      '<span class="chip">' + clock + MM.fmtTime(d1.start) + "–" + MM.fmtTime(d1.end) + "</span>" +
      '<a class="chip" style="text-decoration:none;color:inherit" href="' + C.mapUrl + '" target="_blank" rel="noopener">' + MM.ICON.pin + MM.esc(MM.pick(C.place)) + "</a>";
  }

  function drawArt() {
    var cups = MM.cups();
    var pick = [cups[1], cups[0], cups[2]].filter(Boolean);
    var pos = [
      "position:absolute;left:0;top:28%;width:42%;transform:rotate(-8deg)",
      "position:relative;width:52%;z-index:2",
      "position:absolute;right:0;top:24%;width:42%;transform:rotate(8deg)"
    ];
    document.getElementById("hero-art").innerHTML =
      '<div style="position:relative;width:100%;max-width:400px;display:flex;justify-content:center;aspect-ratio:1/0.85">' +
      pick.map(function (c, i) {
        return '<div style="' + pos[i] + '">' + MM.cupSVG(c.color, c.symbol, "cup", 0.6 + i * 0.08).replace('class="cup"', 'class="cup" style="width:100%;height:auto"') + "</div>";
      }).join("") + "</div>";
  }

  function block(el, label, ms) {
    el.classList.remove("hidden");
    el.innerHTML = '<div class="label">' + MM.t(label) + "</div>" + MM.digitsHTML(ms);
  }
  function live(el, label) {
    el.classList.remove("hidden");
    el.innerHTML = '<div class="live"><span class="pulse"></span>' + MM.t(label) + "</div>";
  }
  function text(el, label) {
    el.classList.remove("hidden");
    el.innerHTML = '<div class="live">' + MM.t(label) + "</div>";
  }

  function tick() {
    var now = MM.now();
    var big = document.getElementById("cd-big");
    var small = document.getElementById("cd-small");
    var s1 = Date.parse(d1.start), e1 = Date.parse(d1.end);
    var s2 = Date.parse(d2.start), e2 = Date.parse(d2.end);

    if (now < s1) { block(big, "home.day1", s1 - now); block(small, "home.day2", s2 - now); }
    else if (now < e1) { live(big, "home.live1"); block(small, "home.day2", s2 - now); }
    else if (now < s2) { block(big, "home.day2", s2 - now); text(small, "home.done1"); }
    else if (now < e2) { live(big, "home.live2"); small.classList.add("hidden"); }
    else { text(big, "home.over"); small.classList.add("hidden"); }
  }

  document.getElementById("ics").setAttribute("href", MM.icsUrl());

  function all() { drawTiles(); drawMeta(); tick(); }
  drawArt();
  all();
  setInterval(tick, 1000);
  MM.onLang(all);
});
