/* 圓形幾何逐步圖解（Circle geometry, one step per click）
   資料放在題目的 anim 欄或教學卡的 demo.opts.anim：
   {
     "points": { "O": {"centre": true}, "A": {"at": 112}, "C": {"at": 232},
                 "E": {"cross": ["A","C","O","D"]}, "Q": {"at": 270, "hidden": true} },
     "segments": [["O","A"],["A","C"]],
     "steps": [ { "zh": "…", "en": "…",
                  "show":  ["Q"],                       // 隱藏的點，到這一步才出現
                  "lines": [["P","Q","ink"]],
                  "arcs":  [["O","A","B","112°","given"]],   // 會同時描出角的兩條射線
                  "circleArcs": [["A","B","P","accent"]],     // 圓周上的一段弧（可給避開的點）
                  "ticks": [["O","A"]],
                  "notes": [["…", x, y]] } ]
   }
   angle 一律用「度」。座標由角度算出，所以畫出來的角就是題目寫的角。 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var SIZE = 420, CX = 210, CY = 210, R = 150;

  /* 每幅圖可以有自己的圓心與半徑（anim.cx / anim.cy / anim.r）：
     有些題目的點在圓外（例如 AB 與 DC 延長後交於 F），圓要縮細才畫得下。 */
  function setFrame(f) {
    CX = f.cx; CY = f.cy; R = f.r;
  }

  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function polar(deg) {
    var t = deg * Math.PI / 180;
    return { x: Math.cos(t), y: Math.sin(t) };
  }

  function screen(p) {
    return { x: CX + p.x * R, y: CY - p.y * R };
  }

  function unit(v) {
    var d = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / d, y: v.y / d };
  }

  /* 兩條直線（a-b 與 c-d）的交點；沒有交點就退回中點 */
  function cross(a, b, c, d) {
    var r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
    var den = r.x * s.y - r.y * s.x;
    if (Math.abs(den) < 1e-9) return { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 };
    var t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
    return { x: a.x + t * r.x, y: a.y + t * r.y };
  }

  /* 角度弧：在頂點 v 上，由 p1 掃到 p2 */
  function arcPath(v, p1, p2, radius) {
    var u = unit({ x: p1.x - v.x, y: p1.y - v.y });
    var w = unit({ x: p2.x - v.x, y: p2.y - v.y });
    var a = { x: v.x + u.x * radius, y: v.y + u.y * radius };
    var b = { x: v.x + w.x * radius, y: v.y + w.y * radius };
    var cr = u.x * w.y - u.y * w.x;
    var d = "M" + a.x + " " + a.y + "A" + radius + " " + radius + " 0 0 " +
      (cr > 0 ? 1 : 0) + " " + b.x + " " + b.y;
    var sum = { x: u.x + w.x, y: u.y + w.y };
    var bis = Math.hypot(sum.x, sum.y) < 0.02 ? { x: -u.y, y: u.x } : unit(sum);
    return { d: d, label: { x: v.x + bis.x * (radius + 16), y: v.y + bis.y * (radius + 16) + 4 } };
  }

  /* 直角符號：在頂點 v 上，兩邊各取 s 長，畫一個小方角 */
  function squarePath(v, p1, p2, s) {
    var u = unit({ x: p1.x - v.x, y: p1.y - v.y });
    var w = unit({ x: p2.x - v.x, y: p2.y - v.y });
    var a = { x: v.x + u.x * s, y: v.y + u.y * s };
    var c = { x: v.x + w.x * s, y: v.y + w.y * s };
    var b = { x: a.x + w.x * s, y: a.y + w.y * s };
    return "M" + a.x + " " + a.y + "L" + b.x + " " + b.y + "L" + c.x + " " + c.y;
  }

  /* 平行記號：在線段中點畫一個「>>」 */
  function parallelPath(a, b) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    var ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    var s = 6;
    var p1 = { x: mx - ux * s + nx * s, y: my - uy * s + ny * s };
    var p3 = { x: mx - ux * s - nx * s, y: my - uy * s - ny * s };
    return "M" + p1.x + " " + p1.y + "L" + mx + " " + my + "L" + p3.x + " " + p3.y;
  }

  /* 圓周上由 A 到 B 的一段弧（screen 座標）；有 avoid 就選不穿越它的那一邊 */
  function circuitArc(a, b, avoid) {
    function heading(p) { return Math.atan2(p.y - CY, p.x - CX); }
    function norm(t) { while (t < 0) t += 2 * Math.PI; while (t >= 2 * Math.PI) t -= 2 * Math.PI; return t; }
    var aA = heading(a), aB = heading(b);
    var d1 = norm(aB - aA);
    var sweep, delta;
    if (avoid) {
      var aV = heading(avoid);
      if (norm(aV - aA) <= d1) { sweep = 0; delta = 2 * Math.PI - d1; }
      else { sweep = 1; delta = d1; }
    } else {
      sweep = 1; delta = d1;
    }
    return "M" + a.x + " " + a.y + "A" + R + " " + R + " 0 " + (delta > Math.PI ? 1 : 0) +
      " " + sweep + " " + b.x + " " + b.y;
  }

  function mount(host, anim) {
    anim = anim || {};
    var frame = { cx: anim.cx || 210, cy: anim.cy || 210, r: anim.r || 150 };
    setFrame(frame);
    var wrap = document.createElement("div");
    wrap.className = "cg";

    var svg = el("svg", {
      class: "cg-svg", viewBox: "0 0 " + SIZE + " " + SIZE,
      role: "img", "aria-label": (anim.label && anim.label.en) || "circle figure"
    });
    var gBase = el("g"), gStep = el("g");
    /* 每一步「正在講」的兩條線放在 gPulse：下一步會清走，底圖的線保持中性色，
       不會愈疊愈花（舊做法會把弦、半徑逐隻色染上去）。 */
    var gPulse = el("g", { class: "cg-pulse" });
    svg.appendChild(gBase);
    svg.appendChild(gStep);
    svg.appendChild(gPulse);

    /* 圓與點：座標由角度算出 */
    var pts = {};
    var specs = anim.points || {};
    var centreName = null;
    Object.keys(specs).forEach(function (name) {
      var s = specs[name] || {};
      if (s.centre) { pts[name] = { x: 0, y: 0 }; centreName = name; }
      else if (typeof s.at === "number") pts[name] = polar(s.at);
    });
    Object.keys(specs).forEach(function (name) {
      var s = specs[name] || {};
      if (s.cross) {
        var c = s.cross;
        pts[name] = cross(pts[c[0]], pts[c[1]], pts[c[2]], pts[c[3]]);
      }
    });

    if (anim.circle !== false && centreName) {
      var o = screen(pts[centreName]);
      gBase.appendChild(el("circle", { class: "cg-circle", cx: o.x, cy: o.y, r: R }));
    }

    (anim.segments || []).forEach(function (s) {
      var a = screen(pts[s[0]]), b = screen(pts[s[1]]);
      if (!a || !b) return;
      gBase.appendChild(el("line", { class: "cg-seg", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    });

    var pointGroups = {};
    Object.keys(pts).forEach(function (name) {
      var p = screen(pts[name]);
      var isCentre = name === centreName;
      var g = el("g", { class: "cg-pt" });
      g.appendChild(el("circle", {
        class: "cg-dot" + (isCentre ? " centre" : ""),
        cx: p.x, cy: p.y, r: isCentre ? 3 : 3.4
      }));
      var d = Math.hypot(p.x - CX, p.y - CY) || 1;
      var off = isCentre ? { x: -13, y: -9 } : { x: (p.x - CX) / d * 14, y: (p.y - CY) / d * 14 + 4 };
      g.appendChild(el("text", {
        class: "cg-label", x: p.x + off.x, y: p.y + off.y, "text-anchor": "middle"
      }, name));
      if (specs[name].hidden) g.style.opacity = "0";
      gBase.appendChild(g);
      pointGroups[name] = g;
    });

    /* 字幕與按鈕 */
    var say = document.createElement("div");
    say.className = "cg-say";
    var sayZh = document.createElement("p");
    sayZh.className = "cg-zh";
    var sayEn = document.createElement("p");
    sayEn.className = "cg-en";
    say.appendChild(sayZh);
    say.appendChild(sayEn);

    var row = document.createElement("div");
    row.className = "cg-row";
    var back = document.createElement("button");
    back.type = "button";
    back.className = "btn btn-sm cg-back";
    back.textContent = "← 上一步 Back";
    back.disabled = true;
    var next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn-sm btn-primary cg-next";
    var restart = document.createElement("button");
    restart.type = "button";
    restart.className = "btn btn-sm cg-restart";
    restart.textContent = "重播 Restart";
    restart.disabled = true;
    var count = document.createElement("span");
    count.className = "cg-count";
    row.appendChild(back);
    row.appendChild(next);
    row.appendChild(restart);
    row.appendChild(count);

    wrap.appendChild(svg);
    wrap.appendChild(say);
    wrap.appendChild(row);
    host.appendChild(wrap);

    var steps = anim.steps || [];
    var at = 0;

    /* 描線：先設 dash，再放行；jsdom 沒有 getTotalLength 就只淡入。
       instant：回看時一次過畫好，不再逐格動。 */
    function drawOn(node, delay, instant) {
      var len = typeof node.getTotalLength === "function" ? node.getTotalLength() : 0;
      if (instant) {
        node.style.opacity = "1";
        if (len) node.style.strokeDashoffset = "0";
        return;
      }
      if (len) {
        node.style.strokeDasharray = len;
        node.style.strokeDashoffset = len;
      }
      node.style.opacity = "0";
      setTimeout(function () {
        node.style.opacity = "1";
        if (len) node.style.strokeDashoffset = "0";
      }, delay || 0);
    }

    function ray(a, b, colour, delay, instant) {
      var A = screen(pts[a]), B = screen(pts[b]);
      if (!A || !B) return;
      var ln = el("line", { class: "cg-ray " + colour, x1: A.x, y1: A.y, x2: B.x, y2: B.y });
      gPulse.appendChild(ln);
      drawOn(ln, delay, instant);
    }

    /* 等長記號：在線段中點畫一條小橫線（cls 可以指定顏色，例如半徑用 radii） */
    function tick(a, b, cls, delay, instant) {
      var A = screen(pts[a]), B = screen(pts[b]);
      if (!A || !B) return;
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      var nx = -dy / d, ny = dx / d;
      var k = el("line", {
        class: "cg-tick" + (cls ? " " + cls : ""),
        x1: mx - nx * 5, y1: my - ny * 5, x2: mx + nx * 5, y2: my + ny * 5
      });
      gStep.appendChild(k);
      if (instant) {
        k.style.opacity = "1";
        return k;
      }
      k.style.opacity = "0";
      setTimeout(function () { k.style.opacity = "1"; }, delay || 140);
      return k;
    }

    function label(txt, T, delay, instant) {
      var t = el("text", {
        class: "cg-val " + (T.colour || "claim"), x: T.label.x, y: T.label.y, "text-anchor": "middle"
      }, txt);
      gStep.appendChild(t);
      if (instant) {
        t.style.opacity = "1";
        return t;
      }
      t.style.opacity = "0";
      setTimeout(function () { t.style.opacity = "1"; }, delay || 0);
      return t;
    }

    function draw(i, instant) {
      setFrame(frame);   // 同一頁可能有多幅圖，各自用自己的圓心與半徑
      var st = steps[i] || {};

      (st.show || []).forEach(function (name) {
        var g = pointGroups[name];
        if (g) g.style.opacity = "1";
      });

      /* 同一隻角之前畫過（例如先寫 ½ × 180°，之後改寫 90°）：
         先把舊的弧與數值拿走，免得兩個標籤疊在一起 */
      (st.clearAngle || []).forEach(function (name) {
        Array.prototype.slice.call(gStep.querySelectorAll('[data-angle="' + name + '"]'))
          .forEach(function (n) { n.parentNode.removeChild(n); });
      });

      /* 每一步只顯示「這一步正在講」的線：先清走上一條，底圖保持中性 */
      gPulse.innerHTML = "";

      (st.rays || []).forEach(function (R, j) {
        ray(R[0], R[1], R[2] || "claim", j * 220, instant);
      });

      /* 半徑相等的一段放在畫角之後（見下面）：同一條線同時屬於角與半徑時，
         綠色（半徑相等）要壓在最上面，才不會被橙色的邊蓋過。 */

      /* 平行記號：一組線段各畫一個「>>」 */
      (st.parallel || []).forEach(function (S, j) {
        var A = screen(pts[S[0]]), B = screen(pts[S[1]]);
        if (!A || !B) return;
        var p = el("path", { class: "cg-par", d: parallelPath(A, B) });
        gStep.appendChild(p);
        drawOn(p, 280 + j * 180, instant);
      });

      (st.lines || []).forEach(function (L) {
        var a = screen(pts[L[0]]), b = screen(pts[L[1]]);
        if (!a || !b) return;
        var ln = el("line", { class: "cg-draw " + (L[2] || "given"), x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        gStep.appendChild(ln);
        drawOn(ln, 0, instant);
      });

      (st.ticks || []).forEach(function (t) {
        tick(t[0], t[1], "", 140, instant);
      });

      /* 每一個角：先描兩條射線，再畫角弧，最後才寫上數值（慢一點，睇得清）。
         直角（標籤剛好是 90°）改用直角符號，跟課本一致。 */
      (st.arcs || []).forEach(function (A, j) {
        var v = screen(pts[A[0]]), p1 = screen(pts[A[1]]), p2 = screen(pts[A[2]]);
        if (!v || !p1 || !p2) return;
        var colour = A[4] || "claim";
        var lead = j * 520;
        if (!st.noRays) {
          ray(A[0], A[1], colour, lead, instant);
          ray(A[0], A[2], colour, lead + 300, instant);
        }
        var radius = A[5] || 26;
        var isRight = A[3] === "90°" || A[6] === "sq";
        /* 同一個頂點、同一個半徑 = 同一個位置：新的角會取代舊的（例如 56° 拆成 26° + 30°） */
        Array.prototype.slice.call(
          gStep.querySelectorAll('[data-angle="' + A[0] + '"][data-r="' + radius + '"]')
        ).forEach(function (n) { n.parentNode.removeChild(n); });
        var path, geo;
        if (isRight) {
          path = el("path", { class: "cg-arc " + colour, d: squarePath(v, p1, p2, 13) });
        } else {
          geo = arcPath(v, p1, p2, radius);
          path = el("path", { class: "cg-arc " + colour, d: geo.d });
        }
        path.setAttribute("data-angle", A[0]);
        path.setAttribute("data-r", radius);
        gStep.appendChild(path);
        drawOn(path, lead + 560, instant);
        if (A[3] && !isRight) {
          var lab = label(A[3], { label: geo.label, colour: colour }, lead + 900, instant);
          lab.setAttribute("data-angle", A[0]);
          lab.setAttribute("data-r", radius);
        }
      });

      (st.circleArcs || []).forEach(function (C, j) {
        var A = screen(pts[C[0]]), B = screen(pts[C[1]]);
        if (!A || !B) return;
        var avoid = C[2] ? screen(pts[C[2]]) : null;
        var p = el("path", { class: "cg-arc " + (C[3] || "accent"), d: circuitArc(A, B, avoid) });
        gStep.appendChild(p);
        drawOn(p, 260 + j * 220, instant);
      });

      /* 半徑相等：由圓心拉出的都是半徑，長度相同 → 等腰三角形。
         畫綠色等長記號，並把這幾條半徑拉出來閃一閃（畫在角之後，壓在最上層）。 */
      (st.radii || []).forEach(function (name, j) {
        if (!centreName || !pts[name]) return;
        ray(centreName, name, "radii", 420 + j * 180, instant);
        tick(centreName, name, "radii", 560 + j * 180, instant);
      });

      (st.notes || []).forEach(function (N) {
        var t = el("text", { class: "cg-note", x: N[1], y: N[2], "text-anchor": "middle" }, N[0]);
        gStep.appendChild(t);
        if (instant) {
          t.style.opacity = "1";
          return;
        }
        t.style.opacity = "0";
        setTimeout(function () { t.style.opacity = "1"; }, 420);
      });
    }

    /* 字幕內可以有 $...$：交給全站的 KaTeX 渲染（與題解同一個機制） */
    function setSay(node, txt) {
      node.textContent = txt || "";
      if (!txt || !window.renderMathInElement) return;
      try {
        window.renderMathInElement(node, {
          delimiters: [{ left: "$", right: "$", display: false }],
          throwOnError: false, strict: false
        });
      } catch (e) { /* 退回純文字 */ }
    }

    /* 重畫到第 n 步（n = 已畫的步數）：回看與重播都用這一個 */
    function renderUpTo(n) {
      gStep.innerHTML = "";
      gPulse.innerHTML = "";
      Object.keys(pointGroups).forEach(function (k) {
        pointGroups[k].style.opacity = specs[k].hidden ? "0" : "1";
      });
      for (var i = 0; i < n; i++) draw(i, true);
      if (n > 0) {
        setSay(sayZh, steps[n - 1].zh);
        setSay(sayEn, steps[n - 1].en);
      } else {
        setSay(sayZh, "");
        setSay(sayEn, "");
      }
      at = n;
      update();
    }

    function update() {
      next.textContent = at >= steps.length ? "完成 Done" : "下一步 Next step →";
      next.disabled = at >= steps.length;
      back.disabled = at === 0;
      restart.disabled = at === 0;
      count.textContent = at + " / " + steps.length;
    }

    next.onclick = function () {
      if (at >= steps.length) return;
      draw(at);
      setSay(sayZh, steps[at].zh);
      setSay(sayEn, steps[at].en);
      at += 1;
      update();
    };

    back.onclick = function () {
      if (at <= 0) return;
      renderUpTo(at - 1);
    };

    restart.onclick = function () { renderUpTo(0); };

    update();
    return wrap;
  }

  window.S5A_CIRCLE = { mount: mount };
})();
