/* 圓的各部分（Parts of a circle）
   兩個固定圖（弦與弧、弓形與角），每個圖上面有自己的按鈕。
   按一下：其餘變淡，對應的部分亮起並由左至右畫出來，下面一句中英說明。
   座標是固定的，所以不經 build；中英並用全站的 .l-zh / .l-en 機制。 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var A = { x: 180, y: 158, r: 104 };   // 圖一：弦與弧
  var B = { x: 180, y: 158, r: 104 };   // 圖二：弓形與角

  function pt(o, deg, rr) {
    var t = deg * Math.PI / 180;
    return {
      x: o.x + Math.cos(t) * (rr === undefined ? o.r : rr),
      y: o.y - Math.sin(t) * (rr === undefined ? o.r : rr)
    };
  }

  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function seg(a, b, cls) {
    return el("line", { class: cls, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }

  function circleArc(o, deg, sweep, cls) {
    var a = pt(o, deg), b = pt(o, deg + sweep);
    var large = Math.abs(sweep) > 180 ? 1 : 0;
    var flag = sweep > 0 ? 0 : 1;
    return el("path", {
      class: cls,
      d: "M" + a.x + " " + a.y + "A" + o.r + " " + o.r + " 0 " + large + " " + flag + " " + b.x + " " + b.y
    });
  }

  function angleArc(v, p1, p2, R, cls) {
    var u = { x: p1.x - v.x, y: p1.y - v.y }, w = { x: p2.x - v.x, y: p2.y - v.y };
    var l1 = Math.hypot(u.x, u.y) || 1, l2 = Math.hypot(w.x, w.y) || 1;
    u.x /= l1; u.y /= l1; w.x /= l2; w.y /= l2;
    var a = { x: v.x + u.x * R, y: v.y + u.y * R };
    var b = { x: v.x + w.x * R, y: v.y + w.y * R };
    var cross = u.x * w.y - u.y * w.x;
    return el("path", {
      class: cls,
      d: "M" + a.x + " " + a.y + "A" + R + " " + R + " 0 0 " + (cross > 0 ? 1 : 0) + " " + b.x + " " + b.y
    });
  }

  function label(x, y, text, cls) {
    return el("text", { class: cls || "p-name", x: x, y: y, "text-anchor": "middle" }, text);
  }

  function letter(p, o, name) {
    var dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1;
    return label(p.x + dx / d * 16, p.y + dy / d * 16 + 5, name, "p-letter");
  }

  function dot(p, cls) {
    return el("circle", { class: cls || "p-dot", cx: p.x, cy: p.y, r: 3.4 });
  }

  function circle(o) {
    return el("circle", { class: "p-circle", cx: o.x, cy: o.y, r: o.r });
  }

  function group(key, nodes) {
    var g = el("g", { class: "part", "data-part": key });
    nodes.forEach(function (n) { g.appendChild(n); });
    return g;
  }

  /* ---------- 圖一：弦、直徑、劣弧、優弧 ---------- */

  function figureA(svg) {
    var o = A;
    var P = { A: pt(o, 160), B: pt(o, 20), C: pt(o, 280), D: pt(o, 100) };

    svg.appendChild(circle(o));
    svg.appendChild(seg(P.A, P.B, "p-chord"));
    svg.appendChild(seg(P.C, P.D, "p-chord"));

    var chordMid = { x: (P.A.x + P.B.x) / 2, y: (P.A.y + P.B.y) / 2 };
    svg.appendChild(group("chord", [
      seg(P.A, P.B, "p-line"),
      label(chordMid.x, chordMid.y - 16, "chord AB")
    ]));

    var diamLabel = pt(o, 280, 54);
    svg.appendChild(group("diameter", [
      seg(P.C, P.D, "p-line"),
      label(diamLabel.x - 4, diamLabel.y + 4, "diameter CD", "p-name end")
    ]));

    svg.appendChild(group("minor-arc", [
      circleArc(o, 160, -140, "p-arc"),
      label(pt(o, 90, o.r + 30).x, pt(o, 90, o.r + 30).y, "minor arc AB")
    ]));

    svg.appendChild(group("major-arc", [
      circleArc(o, 160, 220, "p-arc"),
      label(pt(o, 232, o.r + 30).x, pt(o, 232, o.r + 30).y, "major arc AB")
    ]));

    ["A", "B", "C", "D"].forEach(function (k) {
      svg.appendChild(dot(P[k]));
      svg.appendChild(letter(P[k], o, k));
    });
    svg.appendChild(dot({ x: o.x, y: o.y }, "p-dot centre"));
    svg.appendChild(label(o.x - 15, o.y + 19, "O", "p-letter"));
  }

  /* ---------- 圖二：劣弓形、優弓形、圓心角、圓周角 ---------- */

  function figureB(svg) {
    var o = B;
    var P = { A: pt(o, 205), B: pt(o, 335), P: pt(o, 90) };

    svg.appendChild(circle(o));

    var minor = circleArc(o, 205, 130, "p-region");
    minor.setAttribute("d", minor.getAttribute("d") + "Z");
    var major = circleArc(o, 335, 230, "p-region");
    major.setAttribute("d", major.getAttribute("d") + "Z");

    svg.appendChild(group("minor-segment", [
      minor,
      label(pt(o, 268, o.r - 26).x, pt(o, 268, o.r - 26).y + 4, "minor segment", "p-name small")
    ]));

    svg.appendChild(group("major-segment", [
      major,
      label(pt(o, 118, o.r * 0.46).x, pt(o, 118, o.r * 0.46).y, "major segment")
    ]));

    svg.appendChild(group("angle-centre", [
      seg(o, P.A, "p-line"), seg(o, P.B, "p-line"),
      angleArc(o, P.A, P.B, 26, "p-arc"),
      label(o.x, o.y + 40, "angle at the centre")
    ]));

    svg.appendChild(group("angle-circumference", [
      seg(P.P, P.A, "p-line"), seg(P.P, P.B, "p-line"),
      angleArc(P.P, P.A, P.B, 26, "p-arc"),
      label(P.P.x, P.P.y + 44, "angle at the circumference")
    ]));

    svg.appendChild(seg(P.A, P.B, "p-chord"));

    ["A", "B", "P"].forEach(function (k) {
      svg.appendChild(dot(P[k]));
      svg.appendChild(letter(P[k], o, k));
    });
    svg.appendChild(dot({ x: o.x, y: o.y }, "p-dot centre"));
    svg.appendChild(label(o.x - 13, o.y - 9, "O", "p-letter"));
  }

  /* ---------- 八個名詞 ---------- */

  var PARTS = [
    { key: "chord", fig: "a", zh: "弦", en: "Chord",
      sayZh: "連接圓上兩點的線段，圖中是弦 AB。",
      sayEn: "A chord joins two points on a circle — here AB." },
    { key: "diameter", fig: "a", zh: "直徑", en: "Diameter",
      sayZh: "穿過圓心的弦，是最長的弦；圖中是 CD。",
      sayEn: "A chord through the centre — here CD; it is the longest chord." },
    { key: "minor-arc", fig: "a", zh: "劣弧", en: "Minor arc",
      sayZh: "比半圓短的弧：由 A 到 B 較短的一邊。",
      sayEn: "Shorter than half the circle: the short way from A to B." },
    { key: "major-arc", fig: "a", zh: "優弧", en: "Major arc",
      sayZh: "比半圓長的弧：由 A 經 C 到 B 較長的一邊。",
      sayEn: "Longer than half the circle: the long way from A to B, past C." },
    { key: "minor-segment", fig: "b", zh: "劣弓形", en: "Minor segment",
      sayZh: "弦與弧圍成的較小部分。",
      sayEn: "The smaller region cut off by the chord." },
    { key: "major-segment", fig: "b", zh: "優弓形", en: "Major segment",
      sayZh: "弦切出來的較大部分。",
      sayEn: "The larger region the chord cuts off." },
    { key: "angle-centre", fig: "b", zh: "圓心角", en: "Angle at the centre",
      sayZh: "頂點在圓心 O：∠AOB 對着弧 AB。",
      sayEn: "Vertex at the centre O: ∠AOB stands on arc AB." },
    { key: "angle-circumference", fig: "b", zh: "圓周角", en: "Angle at the circumference",
      sayZh: "頂點在圓上：∠APB 對着同一條弧 AB。",
      sayEn: "Vertex on the circle: ∠APB stands on the same arc AB." }
  ];

  function pairSpan(cls, zh, en) {
    var s = document.createElement("span");
    s.className = cls;
    var a = document.createElement("span");
    a.className = "l-zh";
    a.textContent = zh;
    var b = document.createElement("span");
    b.className = "l-en";
    b.textContent = en;
    s.appendChild(a);
    s.appendChild(b);
    return s;
  }

  function mount(host) {
    var wrap = document.createElement("div");
    wrap.className = "parts";

    var grid = document.createElement("div");
    grid.className = "parts-grid";

    function figCard(id, labelZh, labelEn) {
      var fig = document.createElement("figure");
      fig.className = "parts-fig";
      var chips = document.createElement("div");
      chips.className = "parts-chips";
      chips.setAttribute("role", "group");
      var svg = el("svg", {
        viewBox: "0 0 360 320", class: "parts-svg", "aria-label": labelEn
      });
      var cap = document.createElement("figcaption");
      cap.appendChild(pairSpan("parts-cap", labelZh, labelEn));
      fig.appendChild(chips);
      fig.appendChild(svg);
      fig.appendChild(cap);
      grid.appendChild(fig);
      return { chips: chips, svg: svg };
    }

    var fa = figCard("parts-a", "弦與弧", "Chords and arcs");
    var fb = figCard("parts-b", "弓形與角", "Segments and angles");

    var say = document.createElement("p");
    say.className = "parts-say";
    say.setAttribute("role", "status");

    wrap.appendChild(grid);
    wrap.appendChild(say);
    host.appendChild(wrap);

    figureA(fa.svg);
    figureB(fb.svg);

    var buttons = {};
    PARTS.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "parts-chip";
      b.setAttribute("aria-pressed", "false");
      b.appendChild(pairSpan("parts-chip-t", p.zh, p.en));
      b.onclick = function () { pick(p); };
      (p.fig === "a" ? fa.chips : fb.chips).appendChild(b);
      buttons[p.key] = b;
    });

    var current = null;

    function setSay(zh, en) {
      say.innerHTML = "";
      say.appendChild(pairSpan("parts-say-t", zh, en));
    }

    function pick(p) {
      if (current === p.key) { clear(); return; }
      current = p.key;
      Object.keys(buttons).forEach(function (k) {
        buttons[k].setAttribute("aria-pressed", k === p.key ? "true" : "false");
      });
      [[fa.svg, "a"], [fb.svg, "b"]].forEach(function (pair) {
        var svg = pair[0], mine = pair[1] === p.fig;
        svg.classList.toggle("dim", !mine);
        Array.prototype.forEach.call(svg.querySelectorAll(".part"), function (g) {
          var on = mine && g.getAttribute("data-part") === p.key;
          g.classList.toggle("on", on);
          if (on) shine(g);
        });
      });
      setSay(p.sayZh, p.sayEn);
    }

    function clear() {
      current = null;
      [fa.svg, fb.svg].forEach(function (svg) {
        svg.classList.remove("dim");
        Array.prototype.forEach.call(svg.querySelectorAll(".part"), function (g) {
          g.classList.remove("on");
        });
      });
      Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute("aria-pressed", "false"); });
      setSay("按圖上方的名詞，或按 Tab 再按 Enter。", "Pick a term above its figure, or press Tab then Enter.");
    }

    /* 亮起時由左至右畫線。圖未貼上畫布時 getTotalLength 會拋錯（卡片未 append），
       所以逐條包 try：失敗就只做淡入，不影響其餘部分。 */
    function shine(g) {
      Array.prototype.forEach.call(g.querySelectorAll(".p-line, .p-arc"), function (path) {
        try {
          if (typeof path.getTotalLength !== "function") return;
          var L = path.getTotalLength();
          path.style.strokeDasharray = L;
          path.style.strokeDashoffset = L;
          void path.getBoundingClientRect();
          path.style.strokeDashoffset = 0;
        } catch (e) { /* 未上畫布：跳過描線 */ }
      });
    }

    pick(PARTS[0]);
    return wrap;
  }

  window.S5A_PARTS = { mount: mount };
})();
