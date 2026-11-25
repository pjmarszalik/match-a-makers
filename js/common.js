/* ==========================================================
   Match(a) Makers - WSPÓLNY SILNIK STRONY
   Menu, stopka, przełącznik języka, rysowanie kubków,
   daty i odliczanie. Zwykle nie trzeba tu nic zmieniać.
   ========================================================== */

(function () {
  var C = window.MM_CONFIG;
  var TEXT = window.MM_TEXT;
  var listeners = [];
  var svgCounter = 0;

  /* ---------- bezpieczny localStorage ---------- */
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* tryb prywatny */ }
  }

  /* ---------- język ---------- */
  function detectLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "pl" || q === "en") { save("mm-lang", q); return q; }
    var stored = load("mm-lang", null);
    if (stored === "pl" || stored === "en") return stored;
    return "en";
  }

  /* ?now=2026-12-16T12:31:00%2B01:00 w adresie udaje inną datę (do testów) */
  var timeOffset = 0;
  (function () {
    var q = new URLSearchParams(location.search).get("now");
    if (q) {
      var t = Date.parse(q.replace(" ", "+"));
      if (!isNaN(t)) timeOffset = t - Date.now();
    }
  })();

  var MM = {
    lang: detectLang(),
    now: function () { return Date.now() + timeOffset; },
    load: load,
    save: save,

    t: function (key) {
      var dict = TEXT[MM.lang] || TEXT.en;
      if (dict[key] !== undefined) return dict[key];
      if (TEXT.en[key] !== undefined) return TEXT.en[key];
      return key;
    },

    /* tekst z danych: {en: "...", pl: "..."} albo zwykły napis */
    pick: function (v) {
      if (v === null || v === undefined) return "";
      if (typeof v === "string") return v;
      return v[MM.lang] || v.en || "";
    },

    setLang: function (lang) {
      MM.lang = lang;
      save("mm-lang", lang);
      MM.apply();
      listeners.forEach(function (fn) { fn(lang); });
    },

    onLang: function (fn) { listeners.push(fn); },

    apply: function () {
      document.documentElement.lang = MM.lang;
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        el.textContent = MM.t(el.getAttribute("data-i18n"));
      });
      document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
        el.setAttribute("placeholder", MM.t(el.getAttribute("data-i18n-ph")));
      });
      document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
        el.setAttribute("aria-label", MM.t(el.getAttribute("data-i18n-aria")));
      });
      document.querySelectorAll(".lang-toggle button").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-lang") === MM.lang);
        b.setAttribute("aria-pressed", b.getAttribute("data-lang") === MM.lang ? "true" : "false");
      });
      var title = document.body.getAttribute("data-title");
      if (title) document.title = MM.t(title) + " · " + C.name;
      else document.title = C.name;
    },

    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },

    /* ---------- daty ---------- */
    fmtDate: function (iso, opts) {
      var o = Object.assign({ timeZone: "Europe/Warsaw" }, opts || {});
      return new Intl.DateTimeFormat(MM.lang === "pl" ? "pl-PL" : "en-GB", o).format(new Date(iso));
    },
    fmtDay: function (iso) {
      return MM.fmtDate(iso, { weekday: "long", day: "numeric", month: "long" });
    },
    fmtTime: function (iso) {
      return MM.fmtDate(iso, { hour: "2-digit", minute: "2-digit" });
    },
    splitMs: function (ms) {
      if (ms < 0) ms = 0;
      var s = Math.floor(ms / 1000);
      return {
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60
      };
    },
    /* HTML z cyframi odliczania */
    digitsHTML: function (ms) {
      var p = MM.splitMs(ms);
      function pad(n) { return n < 10 ? "0" + n : "" + n; }
      var units = [["d", p.d], ["h", pad(p.h)], ["m", pad(p.m)], ["s", pad(p.s)]];
      return '<div class="digits">' + units.map(function (u) {
        return '<div class="unit"><div class="num">' + u[1] + '</div><div class="cap">' + MM.t("units." + u[0]) + "</div></div>";
      }).join("") + "</div>";
    },

    /* krótki napis z datami, np. "Tue 15 & Wed 16 Dec" / "wt. 15 i śr. 16 grudnia" */
    datesShort: function () {
      var d1 = C.days[0].start, d2 = C.days[C.days.length - 1].start;
      function wd(iso) { return MM.fmtDate(iso, { weekday: "short" }); }
      function day(iso) { return MM.fmtDate(iso, { day: "numeric" }); }
      var sameMonth = MM.fmtDate(d1, { month: "numeric" }) === MM.fmtDate(d2, { month: "numeric" });
      if (MM.lang === "pl") {
        var dm = function (iso) { return MM.fmtDate(iso, { day: "numeric", month: "long" }); };
        return wd(d1) + " " + (sameMonth ? day(d1) : dm(d1)) + " i " + wd(d2) + " " + dm(d2);
      }
      var mon = function (iso) { return MM.fmtDate(iso, { month: "short" }); };
      return wd(d1) + " " + day(d1) + (sameMonth ? "" : " " + mon(d1)) + " & " + wd(d2) + " " + day(d2) + " " + mon(d2);
    },

    /* link "dodaj do Kalendarza Google" dla jednego dnia (i = 0 albo 1) */
    googleCalUrl: function (i) {
      var d = C.days[i];
      function stamp(iso) {
        return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      }
      var title = C.name + (C.days.length > 1 ? (MM.lang === "pl" ? " (dzień " : " (day ") + (i + 1) + ")" : "");
      return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(title) +
        "&dates=" + stamp(d.start) + "/" + stamp(d.end) +
        "&location=" + encodeURIComponent(MM.pick(C.place) + ", " + C.address) +
        "&details=" + encodeURIComponent(MM.t("home.sub"));
    },

    /* {n}, {name} w tekstach */
    tf: function (key, vars) {
      var s = MM.t(key);
      Object.keys(vars || {}).forEach(function (k) { s = s.split("{" + k + "}").join(String(vars[k])); });
      return s;
    },

    /* etykieta "placeholder" / "robocze" */
    placeholderBadge: function () {
      return '<span class="badge">' + MM.t("placeholder") + "</span>";
    },

    /* ---------- kubek SVG ----------
       color = kolor kubka, label = napis na opasce (np. "h")
       fill = poziom matchy 0..1 */
    cupSVG: function (color, label, cls, fill) {
      var id = "cupclip" + (++svgCounter);
      var level = fill === undefined ? 0.72 : fill;
      var top = 20, bottom = 104;
      var liquidY = bottom - (bottom - top) * level;
      var body = "M12 18 L88 18 L78 104 Q77 108 72 108 L28 108 Q23 108 22 104 Z";
      return (
        '<svg class="' + (cls || "cup") + '" viewBox="0 0 100 114" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        "<defs><clipPath id=\"" + id + "\"><path d=\"" + body + "\"/></clipPath></defs>" +
        '<path d="M60 4 L52 40" stroke="' + color + '" stroke-width="5" stroke-linecap="round" opacity="0.85"/>' +
        '<g clip-path="url(#' + id + ')">' +
        '<rect x="0" y="0" width="100" height="114" fill="#ffffff" opacity="0.55"/>' +
        '<rect x="0" y="' + liquidY + '" width="100" height="114" fill="#86a83f"/>' +
        '<rect x="0" y="' + (liquidY - 3) + '" width="100" height="7" rx="3" fill="#c9dc8a"/>' +
        '<rect x="0" y="0" width="100" height="114" fill="' + color + '" opacity="0.2"/>' +
        '<rect x="0" y="58" width="100" height="24" fill="' + color + '"/>' +
        '<rect x="20" y="22" width="7" height="80" fill="#ffffff" opacity="0.35" transform="rotate(-6 23 60)"/>' +
        "</g>" +
        '<path d="' + body + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<rect x="8" y="14" width="84" height="6" rx="3" fill="' + color + '"/>' +
        (label ? '<text x="50" y="76" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="17" fill="#ffffff">' + MM.esc(label) + "</text>" : "") +
        "</svg>"
      );
    },

    cups: function () { return window.MM_CUPS || []; },
    cupByKey: function (key) {
      return MM.cups().filter(function (c) { return c.key === key; })[0];
    }
  };

  window.MM = MM;

  /* ---------- ikony ---------- */
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };
  MM.ICON = ICON;

  var NAV = [
    ["index.html", "nav.home", "home"],
    ["kubki.html", "nav.cups", "cups"],
    ["sukienka.html", "nav.dress", "dress"],
    ["quiz.html", "nav.quiz", "quiz"],
    ["matcha.html", "nav.matcha", "matcha"],
    ["gra.html", "nav.game", "game"],
    ["faq.html", "nav.faq", "faq"]
  ];

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var page = document.body.getAttribute("data-page");
    el.className = "site-header";
    el.innerHTML =
      '<div class="wrap header-row">' +
      '<a class="logo" href="index.html">' + MM.cupSVG("#7a9a3a", "", "logo-cup", 0.75) +
      '<span>Match<span class="paren">(a)</span> Makers</span></a>' +
      '<nav class="nav" id="nav">' +
      NAV.map(function (n) {
        return '<a href="' + n[0] + '"' + (n[2] === page ? ' class="active" aria-current="page"' : "") +
          ' data-i18n="' + n[1] + '"></a>';
      }).join("") +
      "</nav>" +
      '<div class="lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" data-lang="en">EN</button><button type="button" data-lang="pl">PL</button></div>' +
      '<button class="menu-btn" type="button" data-i18n-aria="menu" aria-expanded="false" aria-controls="nav">' + ICON.menu + "</button>" +
      "</div>";

    el.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.addEventListener("click", function () { MM.setLang(b.getAttribute("data-lang")); });
    });
    var btn = el.querySelector(".menu-btn");
    var nav = el.querySelector(".nav");
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    function draw() {
      var insta = C.instagram
        ? '<a href="' + C.instagram + '" target="_blank" rel="noopener">' + MM.t("footer.follow") + (C.instagramHandle ? " " + MM.esc(C.instagramHandle) : "") + "</a>"
        : "<span>" + MM.t("footer.soon") + "</span>";
      var mail = C.email ? '<a href="mailto:' + C.email + '">' + MM.t("footer.write") + "</a>" : "";
      el.innerHTML =
        '<div class="wrap footer-row">' +
        "<div><strong>Match(a) Makers</strong><br>" + MM.esc(MM.pick(C.place)) + "<br>" + MM.esc(C.address) + "</div>" +
        '<div style="display:flex;flex-direction:column;gap:4px">' + insta + mail + "</div>" +
        '<div style="max-width:320px">' + MM.t("footer.project") + "</div>" +
        "</div>";
    }
    draw();
    MM.onLang(draw);
  }

  function start() {
    renderHeader();
    renderFooter();
    MM.apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
