/* ==========================================================
   Match(a) Makers - UDAWANA BAZA DUELA (tylko duel.html?demo=1)
   Mały kawałek Firebase Realtime Database, który trzyma dane w tej
   przeglądarce (localStorage). Dwie karty tej samej przeglądarki mogą
   zagrać duel bez internetu i bez Firebase, do testów.
   Prawdziwy duel (bez ?demo=1) tego pliku nie używa.
   ========================================================== */

(function () {
  // każdy zapis ma własny klucz w localStorage (np. mm-demo-duel:rooms/K7QX/p/h/st), więc
  // dwie karty piszące różne miejsca naraz nie nadpisują sobie danych, a jeden zapis
  // to jeden klucz (inna karta nie zobaczy go w połowie). Głębszy klucz wygrywa z płytszym.
  var PREFIX = "mm-demo-duel:";
  var listeners = [];
  var leaveOps = [];

  function parts(path) { return String(path || "").split("/").filter(Boolean); }
  function copy(v) { return v === null || v === undefined ? null : JSON.parse(JSON.stringify(v)); }

  function readTree() {
    var entries = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) entries.push([parts(k.slice(PREFIX.length)), JSON.parse(localStorage.getItem(k))]);
      }
    } catch (e) { return null; }
    entries.sort(function (a, b) { return a[0].length - b[0].length; });
    var tree = null;
    entries.forEach(function (en) {
      var p = en[0], v = en[1];
      if (!p.length) { tree = v; return; }
      if (!tree || typeof tree !== "object") tree = {};
      var cur = tree;
      for (var j = 0; j < p.length - 1; j++) {
        if (!cur[p[j]] || typeof cur[p[j]] !== "object") cur[p[j]] = {};
        cur = cur[p[j]];
      }
      cur[p[p.length - 1]] = v;
    });
    return tree;
  }
  /* zapis pod ścieżką: znikają starsze klucze pod nią, potem jeden nowy klucz */
  function writePath(path, value) {
    var base = parts(path).join("/");
    value = clean(value);
    try {
      var drop = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(PREFIX) !== 0) continue;
        var kp = k.slice(PREFIX.length);
        if (!base || kp.indexOf(base + "/") === 0) drop.push(k);
      }
      if (value === null) {
        // najpierw sam klucz, potem głębsze: inna karta od razu widzi, że całości już nie ma
        localStorage.removeItem(PREFIX + base);
        drop.forEach(function (k) { localStorage.removeItem(k); });
        // płytszy klucz może dalej trzymać tę wartość: zapisz go bez niej
        var p = parts(base);
        for (var n = p.length - 1; n >= 1; n--) {
          var anc = p.slice(0, n).join("/");
          var raw = localStorage.getItem(PREFIX + anc);
          if (raw === null) continue;
          var obj = JSON.parse(raw), cur = obj;
          for (var j = n; j < p.length - 1 && cur; j++) cur = cur[p[j]];
          if (cur && typeof cur === "object") {
            delete cur[p[p.length - 1]];
            localStorage.setItem(PREFIX + anc, JSON.stringify(obj));
          }
        }
      } else {
        drop.forEach(function (k) { localStorage.removeItem(k); });
        localStorage.setItem(PREFIX + base, JSON.stringify(value));
      }
    } catch (e) { /* tryb prywatny */ }
  }

  function getAt(tree, path) {
    var p = parts(path), cur = tree;
    for (var i = 0; i < p.length; i++) {
      if (cur === null || typeof cur !== "object") return null;
      cur = cur[p[i]];
      if (cur === undefined) return null;
    }
    return cur === undefined ? null : cur;
  }

  /* jak w Firebase: {".sv":"timestamp"} = czas serwera, null usuwa, puste obiekty znikają */
  function clean(v) {
    if (v && typeof v === "object") {
      if (v[".sv"] === "timestamp") return Date.now();
      var out = {}, any = false;
      for (var k in v) {
        var c = clean(v[k]);
        if (c !== null && c !== undefined) { out[k] = c; any = true; }
      }
      return any ? out : null;
    }
    return v === undefined ? null : v;
  }



  function snap(v) {
    var val = copy(v);
    return {
      val: function () { return copy(val); },
      exists: function () { return val !== null; }
    };
  }

  function valueFor(path, tree) {
    if (path === ".info/serverTimeOffset") return 0;
    if (path === ".info/connected") return true;
    return getAt(tree, path);
  }
  function fire(l, tree) {
    var v = valueFor(l.path, tree);
    var j = JSON.stringify(v);
    if (j === l.last) return;
    l.last = j;
    try { l.cb(snap(v)); } catch (e) { setTimeout(function () { throw e; }, 0); }
  }
  function notify() {
    var tree = readTree();
    listeners.slice().forEach(function (l) { if (listeners.indexOf(l) >= 0) fire(l, tree); });
  }
  window.addEventListener("storage", function (e) { if (!e.key || e.key.indexOf(PREFIX) === 0) notify(); });
  // jak onDisconnect w Firebase: po zamknięciu karty jej zaplanowane zmiany się wykonują
  window.addEventListener("pagehide", function () {
    var ops = leaveOps;
    leaveOps = [];
    ops.forEach(function (op) { writePath(op.path, op.value); });
  });

  function Ref(path) { this.path = parts(path).join("/"); }
  Ref.prototype.child = function (p) { return new Ref(this.path + "/" + p); };
  Ref.prototype.set = function (v) { writePath(this.path, v); notify(); return Promise.resolve(); };
  Ref.prototype.update = function (obj) {
    for (var k in obj) writePath(this.path + "/" + k, obj[k]);
    notify();
    return Promise.resolve();
  };
  Ref.prototype.remove = function () { return this.set(null); };
  Ref.prototype.once = function () { return Promise.resolve(snap(valueFor(this.path, readTree()))); };
  Ref.prototype.on = function (ev, cb) {
    var l = { path: this.path, cb: cb, last: undefined };
    listeners.push(l);
    setTimeout(function () { if (listeners.indexOf(l) >= 0) fire(l, readTree()); }, 0);
    return cb;
  };
  Ref.prototype.off = function (ev, cb) {
    var path = this.path;
    listeners = listeners.filter(function (l) { return !(l.path === path && (!cb || l.cb === cb)); });
  };
  /* jak w Firebase: funkcja może najpierw dostać null (pusta pamięć podręczna),
     a dopiero potem prawdziwą wartość; liczy się ostatnie wywołanie */
  Ref.prototype.transaction = function (fn) {
    var path = this.path;
    return new Promise(function (resolve) {
      setTimeout(function () {
        var tree = readTree();
        var cur = getAt(tree, path);
        var res = fn(null);
        if (res === undefined) { resolve({ committed: false, snapshot: snap(cur) }); return; } // Firebase też tu przerywa
        if (cur !== null) res = fn(copy(cur));
        if (res === undefined) { resolve({ committed: false, snapshot: snap(cur) }); return; }
        writePath(path, res);
        notify();
        resolve({ committed: true, snapshot: snap(getAt(readTree(), path)) });
      }, 5);
    });
  };
  Ref.prototype.onDisconnect = function () {
    var path = this.path;
    return {
      remove: function () { leaveOps.push({ path: path, value: null }); return Promise.resolve(); },
      set: function (v) { leaveOps.push({ path: path, value: v }); return Promise.resolve(); },
      cancel: function () { leaveOps = leaveOps.filter(function (o) { return o.path !== path; }); return Promise.resolve(); }
    };
  };

  window.MM_DUEL_DEMO_DB = { ref: function (p) { return new Ref(p); }, dump: function () { return readTree(); } };
})();
