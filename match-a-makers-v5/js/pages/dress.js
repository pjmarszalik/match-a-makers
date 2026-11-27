/* Sukienka: głosowanie, odliczanie do odsłonięcia i samo odsłonięcie.
   Przycisk "Zobacz oryginalne zdjęcie" prowadzi do Wikipedii (dressPhotoUrl w config.js).
   Własne zdjęcie: wpisz jego ścieżkę w config.js (dressImage), pokaże się zamiast rysunku.
   Podgląd odsłonięcia przed czasem: sukienka.html?reveal=1 */
document.addEventListener("DOMContentLoaded", function () {
  var C = window.MM_CONFIG;
  var revealAt = Date.parse(C.dressRevealAt);
  var forceReveal = new URLSearchParams(location.search).get("reveal") === "1";
  var vote = MM.load("mm-dress", null);
  var timer = null;

  var OPT = {
    bb: { key: "dress.bb", sw: ["#2d3f8f", "#1a1a1a"] },
    wg: { key: "dress.wg", sw: ["#f4f1ea", "#c9a24f"] }
  };

  function swatch(k) {
    return '<span class="swatch"><span style="background:' + OPT[k].sw[0] + '"></span><span style="background:' + OPT[k].sw[1] + '"></span></span>';
  }

  function dressArt() {
    // Rysunek sukienki: lewa połowa niebiesko-czarna, prawa biało-złota.
    var body = "M80 22 L88 22 Q100 36 112 22 L120 22 L124 66 Q123 76 117 82 Q148 150 164 232 L36 232 Q52 150 83 82 Q77 76 76 66 Z";
    var stripes = [74, 118, 158, 198];
    function half(main, stripe, clip) {
      return '<g clip-path="url(#' + clip + ')"><g clip-path="url(#dbody)"><rect x="0" y="0" width="200" height="250" fill="' + main + '"/>' +
        stripes.map(function (y) { return '<rect x="0" y="' + y + '" width="200" height="' + (y === 74 ? 9 : 13) + '" fill="' + stripe + '"/>'; }).join("") +
        "</g></g>";
    }
    return '<svg viewBox="0 0 200 250" width="240" aria-hidden="true">' +
      '<defs><clipPath id="dl"><rect x="0" y="0" width="100" height="250"/></clipPath><clipPath id="dr"><rect x="100" y="0" width="100" height="250"/></clipPath>' +
      '<clipPath id="dbody"><path d="' + body + '"/></clipPath></defs>' +
      '<path d="M90 22 Q100 2 110 22" fill="none" stroke="#999" stroke-width="2"/>' +
      half("#2f4597", "#161616", "dl") +
      half("#f2eee4", "#c6a04c", "dr") +
      '<path d="' + body + '" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>' +
      '<line x1="100" y1="30" x2="100" y2="232" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/>' +
      "</svg>";
  }

  function creditText() {
    return MM.t("dress.photoCredit") + (!vote && !revealed() ? " " + MM.t("dress.photoVote") : "");
  }
  function drawCredit() {
    var p = document.getElementById("photo-credit");
    if (p) p.textContent = creditText();
  }

  function drawImage() {
    var box = document.getElementById("dress-img");
    var link = C.dressPhotoUrl
      ? '<a class="btn photo-btn" href="' + MM.esc(C.dressPhotoUrl) + '" target="_blank" rel="noopener">' + MM.t("dress.photoBtn") + ' ↗</a>' +
        '<p class="photo-credit" id="photo-credit">' + MM.esc(creditText()) + "</p>"
      : "";
    function sketch() {
      box.innerHTML = '<div class="dress-figure">' + dressArt() + '<div class="note">' + MM.t("dress.imgNote") + "</div></div>" + link;
    }
    if (!C.dressImage) { sketch(); return; }
    var img = new Image();
    img.alt = "The dress";
    img.onload = function () {
      box.innerHTML = "";
      box.appendChild(img);
      box.insertAdjacentHTML("beforeend", link);
    };
    img.onerror = sketch;
    img.src = C.dressImage;
  }

  function revealed() { return forceReveal || MM.now() >= revealAt; }

  function voteButtons() {
    return '<div class="vote-btns">' + ["bb", "wg"].map(function (k) {
      return '<button type="button" class="vote-btn' + (vote === k ? " chosen" : "") + '" data-v="' + k + '">' + swatch(k) + MM.t(OPT[k].key) + "</button>";
    }).join("") + '</div><p class="note">' + MM.t("dress.saved") + "</p>";
  }

  function resultsHTML() {
    var r = C.dressResults || {};
    if (r.blueBlack === null || r.whiteGold === null || r.blueBlack === undefined || r.whiteGold === undefined) {
      return '<p class="note">' + MM.t("dress.noResults") + "</p>";
    }
    var total = r.blueBlack + r.whiteGold || 1;
    var a = Math.round((r.blueBlack / total) * 100);
    return '<div class="bar"><div class="a" style="width:' + a + '%"></div><div class="b" style="width:' + (100 - a) + '%"></div></div>' +
      '<div class="legend-row"><span>' + MM.t("dress.bb") + ": " + a + "% (" + r.blueBlack + ")</span><span>" +
      MM.t("dress.wg") + ": " + (100 - a) + "% (" + r.whiteGold + ")</span></div>";
  }

  function draw() {
    var panel = document.getElementById("dress-panel");
    if (timer) { clearInterval(timer); timer = null; }
    drawCredit();

    if (revealed()) {
      var mine = vote ? '<p>' + MM.t("dress.youPicked") + ": <strong>" + MM.t(OPT[vote].key) + "</strong>" + (vote === "bb" ? " ✓" : "") + "</p>" : "";
      panel.innerHTML =
        '<div class="card reveal-box">' +
        '<span class="eyebrow">' + MM.t("dress.revealed") + "</span>" +
        '<div class="big">' + swatch("bb") + " " + MM.t("dress.answer") + "</div>" + mine +
        "</div>" +
        '<div class="card" style="margin-top:18px"><h3>' + MM.t("dress.whyTitle") + "</h3><p>" + MM.t("dress.why1") + "</p><p>" +
        MM.t("dress.why2") + "</p><p style=\"margin:0\">" + MM.t("dress.why3") + "</p></div>" +
        '<div class="card" style="margin-top:18px"><h3>' + MM.t("dress.results") + "</h3>" + resultsHTML() + "</div>";
      return;
    }

    if (!vote) {
      panel.innerHTML = voteButtons();
    } else {
      panel.innerHTML =
        '<div class="card"><p style="margin-bottom:6px">' + MM.t("dress.youPicked") + ":</p>" +
        '<div style="display:flex;align-items:center;gap:12px;font-size:1.3rem;font-weight:600;font-family:var(--font-head)">' + swatch(vote) + MM.t(OPT[vote].key) + "</div>" +
        '<p style="margin:16px 0 0;color:var(--ink-soft)">' + MM.t("dress.revealWhen") + "</p></div>" +
        '<div class="countdown" style="margin-top:16px"><div class="label">' + MM.t("dress.revealIn") + '</div><div id="reveal-digits"></div></div>' +
        '<p style="margin-top:16px"><button type="button" class="btn ghost" id="change">' + MM.t("dress.change") + "</button></p>";
      var digits = document.getElementById("reveal-digits");
      var update = function () {
        if (revealed()) { draw(); return; }
        digits.innerHTML = MM.digitsHTML(revealAt - MM.now());
      };
      update();
      timer = setInterval(update, 1000);
      document.getElementById("change").addEventListener("click", function () {
        vote = null;
        draw();
      });
    }

    panel.querySelectorAll(".vote-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        vote = b.getAttribute("data-v");
        MM.save("mm-dress", vote);
        draw();
      });
    });
  }

  drawImage();
  draw();
  MM.onLang(function () { draw(); drawImage(); });
});
