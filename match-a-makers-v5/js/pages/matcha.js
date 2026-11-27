/* Matcha w liczbach + prawda/fałsz - dane w js/data/matcha.js */
document.addEventListener("DOMContentLoaded", function () {
  var D = window.MM_MATCHA || { numbers: [], trueFalse: [] };
  var order = D.trueFalse.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
  var pos = 0, score = 0, answered = false, lastOk = null;

  function drawNumbers() {
    document.getElementById("numbers").innerHTML = D.numbers.map(function (x) {
      return '<div class="num-card">' + (x.draft ? '<span class="badge">' + MM.t("matcha.draft") + "</span>" : "") +
        '<div><span class="n">' + MM.esc(x.n) + '</span><span class="u">' + MM.esc(MM.pick(x.unit)) + "</span></div>" +
        "<h3>" + MM.esc(MM.pick(x.title)) + "</h3><p>" + MM.esc(MM.pick(x.text)) + "</p></div>";
    }).join("");
  }

  function drawTF() {
    var count = document.getElementById("tf-count");
    var qEl = document.getElementById("tf-q");
    var btns = document.getElementById("tf-btns");
    var msg = document.getElementById("tf-msg");
    if (!order.length) { qEl.textContent = ""; btns.innerHTML = ""; return; }

    if (pos >= order.length) {
      count.textContent = "";
      qEl.textContent = MM.t("matcha.score") + ": " + score + " / " + order.length;
      msg.textContent = "";
      msg.className = "tf-msg";
      btns.innerHTML = '<button class="btn green" type="button" id="tf-restart">' + MM.t("quiz.again") + "</button>";
      document.getElementById("tf-restart").addEventListener("click", function () {
        pos = 0; score = 0; answered = false;
        order.sort(function () { return Math.random() - 0.5; });
        drawTF();
      });
      return;
    }

    var item = D.trueFalse[order[pos]];
    count.textContent = (pos + 1) + " / " + order.length;
    qEl.textContent = MM.pick(item.q);

    if (!answered) {
      msg.textContent = "";
      msg.className = "tf-msg";
      btns.innerHTML =
        '<button class="btn green" type="button" data-a="1">' + MM.t("matcha.true") + "</button>" +
        '<button class="btn ghost" type="button" data-a="0">' + MM.t("matcha.false") + "</button>";
      btns.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          var guess = b.getAttribute("data-a") === "1";
          lastOk = guess === item.answer;
          if (lastOk) score++;
          answered = true;
          drawTF();
        });
      });
    } else {
      msg.className = "tf-msg " + (lastOk ? "ok" : "no");
      msg.textContent = (lastOk ? MM.t("matcha.ok") : MM.t("matcha.no")) + " " + MM.pick(item.why);
      btns.innerHTML = '<button class="btn" type="button" id="tf-next">' + MM.t("matcha.next") + " →</button>";
      document.getElementById("tf-next").addEventListener("click", function () {
        pos++; answered = false; drawTF();
      });
    }
  }

  function all() { drawNumbers(); drawTF(); }
  all();
  MM.onLang(all);
});
