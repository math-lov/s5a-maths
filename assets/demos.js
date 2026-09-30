/* ==========================================================================
   5A 數學溫習站 · 互動示範（教學卡用）
   --------------------------------------------------------------------------
   用法一（站內 inline）：卡片寫 "demo": { "type": "tie-up" }，
     app.js 的 renderCards() 就會呼叫 S5A_DEMO.tieUp(host)，直接嵌在教學卡內。
   用法二（獨立頁）：demos/tie-up.html 薄外殼載入本檔 ＋ 同一份 style.css，
     可單獨開啟、亦可複製去其他站。?step=N 可直接跳到第 N 步（方便截圖）。

   規則（跟 docs/UI-DESIGN-HANDOFF.md）：
     · 文字用 .l-zh／.l-en，由 body[data-lang] 控制（中／EN／中英）
     · 符號、數字、公式係語言中立 → 一律放雙語之外（唔會出兩次）
     · 顏色只用 style.css 的 token；尊重 prefers-reduced-motion
     · 唔用拖放（手機友善＋可測試）：全部用按鈕／點擊
     · 數學用純文字（4!、P(5,3)），唔需要 KaTeX，textContent 可以直接斷言
   ========================================================================== */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  /* 句子級雙語：div.bi（兩語各自成行） */
  function bi(zh, en) {
    var box = el("div", "bi");
    box.appendChild(el("div", "l-zh", zh));
    box.appendChild(el("div", "l-en", en));
    return box;
  }
  /* 短標籤雙語：span.bi.bi-inline（同一行，靠 CSS 分隔） */
  function biInline(zh, en) {
    var box = el("span", "bi bi-inline");
    box.appendChild(el("span", "l-zh", zh));
    box.appendChild(el("span", "l-en", en));
    return box;
  }
  /* 按鈕：箭頭／符號係語言中立 → 放雙語之外，並列模式只會出一次
     （同 docs/UI-DESIGN-HANDOFF.md 第 3 節、app.js setPairArrow 同一規則） */
  function button(cls, zh, en, arrow, side) {
    var b = el("button", "btn btn-sm " + (cls || ""));
    b.setAttribute("type", "button");
    var a = null;
    if (arrow) {
      a = el("span", "arw", arrow);
      a.setAttribute("aria-hidden", "true");
      if (side === "start") b.appendChild(a);
    }
    b.appendChild(biInline(zh, en));
    if (a && side !== "start") b.appendChild(a);
    return b;
  }
  /* 語言切換：只供獨立外殼用（站內有自己的 #lang-slot） */
  function langBar() {
    var bar = el("span", "langbar");
    [["zh", "中文"], ["en", "EN"], ["both", "中英"]].forEach(function (p) {
      var b = el("button", null, p[1]);
      b.setAttribute("type", "button");
      b.setAttribute("data-lang-btn", p[0]);
      b.onclick = function () { setLang(p[0]); };
      bar.appendChild(b);
    });
    function paint() {
      var cur = document.body.getAttribute("data-lang");
      Array.prototype.slice.call(bar.querySelectorAll("[data-lang-btn]")).forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-lang-btn") === cur);
      });
    }
    bar.__paint = paint;
    return bar;
  }
  function setLang(code) {
    document.body.setAttribute("data-lang", code);
    try { localStorage.setItem("s5a-lang", code); } catch (e) { /* 私密模式 */ }
    Array.prototype.slice.call(document.querySelectorAll(".langbar")).forEach(function (b) {
      if (b.__paint) b.__paint();
    });
  }

  /* ── 綑綁法（Tie-up / Bundling）示範 ────────────────────────────────────
     步驟 0 · 題目：5 個學生 A–E 排成一列，A 與 B 必須相鄰
     步驟 1 · 把 A、B 綑綁成 1 個大單位 → 4 個主體 · 4! = 24
     步驟 2 · 大單位可以同 C、D、E 換位（點兩個單位交換）→ 位置共 4! 種
     步驟 3 · 框內 A、B 可以互換（AB／BA）→ 2! = 2
     步驟 4 · 組裝公式 4! × 2! = 24 × 2 = 48
     ───────────────────────────────────────────────────────────────────── */
  var TIE_STEPS = 4;   /* 0..4，共 5 步 */

  function tieUp(host, opts) {
    var o = opts || {};
    var LETTERS = ["A", "B", "C", "D", "E"];

    var root = el("div", "demo");
    root.setAttribute("data-demo", "tie-up");

    /* 頂列：標題 ＋ 第 n / N 步 */
    var head = el("div", "demo-head");
    var title = el("div", "demo-title");
    title.appendChild(biInline("綑綁法示範", "Bundling demo"));
    head.appendChild(title);
    var stepTag = el("div", "demo-step");
    head.appendChild(stepTag);
    root.appendChild(head);

    /* 題目 */
    var q = el("div", "demo-q");
    q.appendChild(bi("5 個學生排成一列；A 與 B 必須相鄰。",
      "Five students in a row; A and B must be adjacent."));
    root.appendChild(q);

    /* 舞台：5 個學生 → 綑綁後變成 4 個單位（大單位可以同 C、D、E 換位） */
    var stage = el("div", "demo-stage");
    root.appendChild(stage);
    var hint = el("div", "demo-hint");
    hint.appendChild(biInline("按「下一步」開始", "Press Next to start"));
    root.appendChild(hint);   /* 放喺舞台之後：窄屏都唔會壓住啲節點 */

    /* 目前排列（語言中立：A+B · C · D · E） */
    var orderLine = el("div", "demo-order");
    orderLine.setAttribute("aria-live", "polite");
    orderLine.appendChild(biInline("目前排列：", "Current order:"));
    var orderTxt = el("span", "order-txt");
    orderLine.appendChild(orderTxt);
    root.appendChild(orderLine);

    /* 4 個主體 */
    var units = el("div", "demo-units");
    units.appendChild(biInline("4 個主體：", "4 units:"));
    units.appendChild(el("span", "eq", "4! = 24"));
    root.appendChild(units);

    /* 已試過的排列（目標 24 = 4!，令學生感覺「唔止 4 種」） */
    var countLine = el("div", "demo-count");
    countLine.appendChild(biInline("已試排列：", "Tried so far:"));
    var countTxt = el("span", "order-txt");
    countLine.appendChild(countTxt);
    root.appendChild(countLine);

    /* 換位提示（第 3 步）：＋自動示範按鈕 */
    var tip = el("div", "demo-tip");
    tip.appendChild(bi("點兩個單位可以互換位置：大單位可以放喺第 1、2、3、4 位，C、D、E 之間一樣可以交換 —— 四個單位全部排列共 4! = 24 種。",
      "Tap two units to swap them: the block can sit in position 1, 2, 3 or 4, and C, D, E can swap with each other too — all four units together give 4! = 24 arrangements."));
    var autoBtn = button("btn-ghost", "示範 4 種位置", "Auto-play 4 positions", "▶", "start");
    tip.appendChild(autoBtn);
    root.appendChild(tip);

    /* 框內：A ⇄ B */
    var inner = el("div", "demo-inner");
    var innerTitle = el("div", "demo-inner-h");
    innerTitle.appendChild(biInline("框內部排列", "Inside the block"));
    inner.appendChild(innerTitle);
    var innerRow = el("div", "demo-inner-row");
    var chipA = el("div", "ichip", "A");
    var chipB = el("div", "ichip", "B");
    var swap = button("btn-ghost", "A、B 對調", "Swap A and B", "⇄", "end");
    var flipped = false;
    swap.onclick = function () {
      flipped = !flipped;
      innerRow.classList.toggle("flipped", flipped);
      swap.setAttribute("aria-pressed", flipped ? "true" : "false");
    };
    swap.setAttribute("aria-pressed", "false");
    innerRow.appendChild(chipA);
    innerRow.appendChild(chipB);
    innerRow.appendChild(swap);
    inner.appendChild(innerRow);
    var innerEq = el("div", "demo-eqline");
    innerEq.appendChild(biInline("內部 2 種次序：", "2 internal orders:"));
    innerEq.appendChild(el("span", "eq", "2! = 2"));
    inner.appendChild(innerEq);
    root.appendChild(inner);

    /* 公式列（aria-live：每一步讀出目前的算式）
       第一行＝逐步亮起的零件，第二行＝第 5 步才組裝出來的完整算式 */
    var eq = el("div", "demo-eq");
    eq.setAttribute("aria-live", "polite");
    var rowParts = el("div", "eqrow");
    var eqUnits = el("span", "eqbox eq-units");
    eqUnits.appendChild(el("span", "eq", "4! = 24"));
    var eqInner = el("span", "eqbox eq-inner");
    eqInner.appendChild(el("span", "eq", "2! = 2"));
    rowParts.appendChild(eqUnits);
    rowParts.appendChild(el("span", "eqtimes", "×"));
    rowParts.appendChild(eqInner);
    var rowTotal = el("div", "eqrow eqrow-total");
    rowTotal.appendChild(el("span", "eq eq-chain", "4! × 2! = 24 × 2 ="));
    var eqTotal = el("span", "eqbox eq-total");
    eqTotal.appendChild(el("span", "eq", "48"));
    rowTotal.appendChild(eqTotal);
    eq.appendChild(rowParts);
    eq.appendChild(rowTotal);
    root.appendChild(eq);

    /* 控制列 */
    var ctrl = el("div", "demo-ctrl");
    var prev = button("btn-ghost", "上一步", "Previous", "←", "start");
    var next = button("btn-primary", "下一步", "Next", "→", "end");
    var replay = button("btn-ghost", "重播", "Replay");
    ctrl.appendChild(prev);
    ctrl.appendChild(next);
    ctrl.appendChild(replay);
    root.appendChild(ctrl);

    /* ── 舞台狀態：order 係目前由左至右的單位；step 0 時 A、B 分開，其餘時候綑成一個 ---- */
    var order = ["A", "B", "C", "D", "E"];   /* 單位 id：A、B、C、D、E、"AB" */
    var picked = null;
    var step = 0;
    var tried = {};      /* 已試過的排列（key ＝ order 串埋一齊） */
    var auto = null;     /* 自動播放的 timer */
    var autoLeft = 0;

    function isBundled() { return step >= 1; }
    function canSwap() { return step === 2 || step === 3; }

    function unitNode(id) {
      var b = el("button", "unit");
      b.setAttribute("type", "button");
      b.setAttribute("data-unit", id);
      if (id === "AB") {
        b.classList.add("unit-block");
        b.appendChild(el("div", "pnode pnode-fixed pnode-in", "A"));
        b.appendChild(el("div", "pnode pnode-fixed pnode-in", "B"));
      } else {
        b.appendChild(el("div", "pnode" + (id === "A" || id === "B" ? " pnode-fixed" : ""), id));
      }
      b.onclick = function () { onUnit(id); };
      return b;
    }

    function paintStage() {
      Array.prototype.slice.call(stage.querySelectorAll(".unit")).forEach(function (u) {
        stage.removeChild(u);
      });
      order.forEach(function (id) {
        var u = unitNode(id);
        u.disabled = !canSwap();
        if (canSwap()) u.classList.add("unit-live");
        if (picked === id) {
          u.classList.add("unit-picked");
          u.setAttribute("aria-pressed", "true");
        }
        stage.appendChild(u);
      });
      orderTxt.textContent = order.join(" · ").replace("AB", "A+B");
      if (canSwap()) markTried();
    }

    function markTried() {
      tried[order.join("")] = true;
      countTxt.textContent = Object.keys(tried).length + " / 24";
    }
    function swapUnits(i, j) {
      var t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    function pulseAll() {
      Array.prototype.slice.call(stage.querySelectorAll(".unit")).forEach(function (u) {
        u.classList.add("unit-moved");
        setTimeout(function () { u.classList.remove("unit-moved"); }, 450);
      });
    }

    /* 點兩個單位 → 交換位置（唔用拖放：手機＋鍵盤都一樣）
       任何兩個單位都可以換，包括 C、D、E 之間 */
    function onUnit(id) {
      if (!canSwap() || auto) return;
      if (picked === null) { picked = id; paintStage(); return; }
      if (picked === id) { picked = null; paintStage(); return; }
      var i = order.indexOf(picked);
      var j = order.indexOf(id);
      picked = null;
      if (i < 0 || j < 0) { paintStage(); return; }
      swapUnits(i, j);
      paintStage();
      pulseAll();
    }

    /* 自動示範：先將大單位放返最左，再逐格向右行一圈（位置 1 → 2 → 3 → 4） */
    function moveBlockRight() {
      var i = order.indexOf("AB");
      if (i < 0) return;
      swapUnits(i, (i + 1) % order.length);
      paintStage();
      pulseAll();
    }
    function stopAuto() {
      if (auto) { clearInterval(auto); auto = null; }
      autoBtn.disabled = false;
      root.removeAttribute("data-auto");
    }
    autoBtn.onclick = function () {
      if (auto) { stopAuto(); return; }
      var i = order.indexOf("AB");
      if (i > 0) {
        order.splice(i, 1);
        order.unshift("AB");
        paintStage();
      }
      autoLeft = 0;
      root.setAttribute("data-auto", "1");
      autoBtn.disabled = true;          /* 播放中唔可以再按（避免同學亂按） */
      auto = setInterval(function () {
        moveBlockRight();
        autoLeft++;
        if (autoLeft >= order.length) stopAuto();
      }, 850);
    };
    /* 供測試用（jsdom 唔會等 timer）：手動 tick 一格、停止、查詢是否播放中 */
    root.__demoAuto = {
      tick: moveBlockRight,
      stop: stopAuto,
      playing: function () { return !!auto; }
    };

    function applyBundling() {
      if (isBundled()) {
        if (order.indexOf("AB") < 0) {
          /* 由 A、B 各自一個單位，變成一個大單位（保留 A、B 原本在最左的位置） */
          var merged = ["AB"];
          order.forEach(function (id) {
            if (id !== "A" && id !== "B") merged.push(id);
          });
          order = merged;
        }
      } else if (order.indexOf("AB") >= 0) {
        /* 回到第 1 步：拆返開，題目重新開始 */
        order = ["A", "B", "C", "D", "E"];
      }
      picked = null;
    }

    function setStep(n) {
      stopAuto();                                  /* 換步時一定要停自動播放 */
      step = Math.max(0, Math.min(TIE_STEPS, n | 0));
      applyBundling();
      root.setAttribute("data-step", String(step));
      stepTag.innerHTML = "";
      stepTag.appendChild(biInline("第 " + (step + 1) + " / " + (TIE_STEPS + 1) + " 步",
        "Step " + (step + 1) + " / " + (TIE_STEPS + 1)));
      prev.disabled = step === 0;
      next.disabled = step === TIE_STEPS;
      eq.setAttribute("data-eq", ["none", "4! = 24", "4! = 24", "4! = 24 × 2! = 2", "48"][step]);
      paintStage();
    }
    prev.onclick = function () { setStep(step - 1); };
    next.onclick = function () { setStep(step + 1); };
    replay.onclick = function () {
      flipped = false;
      innerRow.classList.remove("flipped");
      swap.setAttribute("aria-pressed", "false");
      order = ["A", "B", "C", "D", "E"];
      setStep(0);
    };

    host.appendChild(root);
    setStep(o.step || 0);
    return root;
  }

  global.S5A_DEMO = {
    types: { "tie-up": tieUp },
    tieUp: tieUp,
    langBar: langBar,
    setLang: setLang
  };
})(window);
