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

    /* 框內部排列：直接喺舞台嘅大單位上對調（唔會另外畫一組 A、B），
       下面一行只負責講「AB ⇄ BA ⇒ 2! = 2」 */
    var innerLine = el("div", "demo-innerline");
    innerLine.appendChild(biInline("框內部排列（大單位內）：", "Inside the block:"));
    var tagAB = el("span", "itag", "AB");
    var tagBA = el("span", "itag", "BA");
    innerLine.appendChild(tagAB);
    innerLine.appendChild(el("span", "eqtimes", "⇄"));
    innerLine.appendChild(tagBA);
    innerLine.appendChild(el("span", "eq", "2! = 2"));
    var swap = button("btn-ghost", "對調框內 A、B", "Swap A and B inside the block", "⇄", "end");
    swap.setAttribute("data-swap", "ab");
    swap.setAttribute("aria-pressed", "false");
    swap.onclick = function () { setFlipped(!flipped); };
    innerLine.appendChild(swap);
    root.appendChild(innerLine);

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
    var flipped = false; /* 大單位內 A、B 有冇對調 */

    function isBundled() { return step >= 1; }
    function canSwap() { return step === 2 || step === 3; }

    function unitNode(id) {
      var b = el("button", "unit");
      b.setAttribute("type", "button");
      b.setAttribute("data-unit", id);
      if (id === "AB") {
        b.classList.add("unit-block");
        /* 對調時，兩個圓圈直接喺大單位內交換次序（跟 flipped 狀態） */
        (flipped ? ["B", "A"] : ["A", "B"]).forEach(function (ch) {
          b.appendChild(el("div", "pnode pnode-fixed pnode-in", ch));
        });
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
      orderTxt.textContent = order.map(function (id) {
        return id === "AB" ? (flipped ? "B+A" : "A+B") : id;
      }).join(" · ");
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
    /* 對調大單位內 A、B：兩個圓圈喺原位滑去對方位置（FLIP），
       唔會另外畫一組 A、B —— 學生一眼睇到「框入面換咗次序」 */
    function flipInner() {
      var oldBlk = root.querySelector('[data-unit="AB"]');
      var oldNodes = oldBlk ? Array.prototype.slice.call(oldBlk.querySelectorAll(".pnode")) : [];
      var x = oldNodes.map(function (n) { return n.getBoundingClientRect().left; });
      var names = oldNodes.map(function (n) { return n.textContent; });
      paintStage();
      var blk = root.querySelector('[data-unit="AB"]');
      if (!blk) return;
      Array.prototype.slice.call(blk.querySelectorAll(".pnode")).forEach(function (n) {
        var k = names.indexOf(n.textContent);
        if (k < 0) return;
        var dx = x[k] - n.getBoundingClientRect().left;
        n.style.transition = "none";
        n.style.transform = "translateX(" + dx + "px)";
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () {
            n.style.transition = "transform .3s ease";
            n.style.transform = "";
          });
        } else {
          n.style.transform = "";
        }
      });
    }
    function setFlipped(v) {
      flipped = !!v;
      swap.setAttribute("aria-pressed", flipped ? "true" : "false");
      tagAB.classList.toggle("itag-on", !flipped);
      tagBA.classList.toggle("itag-on", flipped);
      flipInner();
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
      setFlipped(false);
      order = ["A", "B", "C", "D", "E"];
      setStep(0);
    };

    host.appendChild(root);
    setStep(o.step || 0);
    /* opts.swap = true：先對調大單位內 A、B（獨立頁 ?swap=1 用，方便截圖） */
    if (o.swap) setFlipped(true);
    return root;
  }

  /* 組合記法：用 sup/sub 顯示 C^n_r（同站內 KaTeX 的 C^{n}_{r} 一致） */
  function ncr(n, r) {
    var s = el("span", "ncr");
    s.setAttribute("data-ncr", "C(" + n + "," + r + ")");
    s.appendChild(el("span", "ncr-c", "C"));
    s.appendChild(el("sup", null, String(n)));
    s.appendChild(el("sub", null, String(r)));
    return s;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ── 插空法（Slot-in）示範 ──────────────────────────────────────────────
     步驟 0 · 題目：4 男 3 女排成一列，3 位女生互不相鄰
     步驟 1 · 先排 4 位男生 → 4! = 24（男生可以互換位置）
     步驟 2 · 4 位男生形成 5 個空隙（頭、中間 3 個、尾）
     步驟 3 · 3 位女生逐一放入空隙 → 5 × 4 × 3 = P(5,3) = 60
     步驟 4 · 組裝 4! × P(5,3) = 24 × 60 = 1440
     ───────────────────────────────────────────────────────────────────── */
  var SLOT_STEPS = 4;
  function slotIn(host, opts) {
    var o = opts || {};
    var BOYS = ["B1", "B2", "B3", "B4"];
    var GIRLS = ["G1", "G2", "G3"];

    var root = el("div", "demo");
    root.setAttribute("data-demo", "slot-in");

    var head = el("div", "demo-head");
    var title = el("div", "demo-title");
    title.appendChild(biInline("插空法示範", "Slot-in demo"));
    head.appendChild(title);
    var stepTag = el("div", "demo-step");
    head.appendChild(stepTag);
    root.appendChild(head);

    var q = el("div", "demo-q");
    q.appendChild(bi("4 名男生與 3 名女生排成一列；3 名女生互不相鄰。",
      "Four boys and three girls in a row; no two girls may be adjacent."));
    var legend = el("div", "demo-legend");
    legend.appendChild(el("span", "lg-dot lg-boy"));
    legend.appendChild(biInline("男生（4 人）", "boys (4)"));
    legend.appendChild(el("span", "lg-dot lg-girl"));
    legend.appendChild(biInline("女生（3 人）", "girls (3)"));
    q.appendChild(legend);
    root.appendChild(q);

    /* 每步的清晰指示：學生唔會唔知「下一步要做咩」 */
    var guide = el("div", "demo-guide");
    var guideTxt = el("div", "guide-txt");
    guide.appendChild(guideTxt);
    var shuffleBtn = button("btn-ghost", "打亂男生", "Shuffle the boys", "⇄", "end");
    shuffleBtn.setAttribute("data-shuffle", "1");
    guide.appendChild(shuffleBtn);
    root.appendChild(guide);
    var GUIDES = [
      ["按「下一步」，先排好 4 位男生。",
        "Press Next to arrange the 4 boys first."],
      ["男生排成一排（4!）：點兩位男生可以互換位置，或按「打亂男生」看自動示範。做好就按「下一步」。",
        "Arrange the boys (4!): tap two boys to swap them, or press Shuffle the boys. Then press Next."],
      ["數一數空隙：4 位男生形成 5 個空隙（頭、中間 3 個、尾）—— 這就是 P(5,3) 的 5。按「下一步」開始放女生。",
        "Count the gaps: 4 boys create 5 gaps (before, three in between, after) — the 5 in P(5,3). Press Next to place the girls."],
      ["【現在做】點一個虛線空隙，放入下一位女生；每放一位，可以揀的空隙就少一個（5 → 4 → 3）。放好 3 位就按「下一步」。",
        "NOW: tap a dashed gap to place the next girl. Each placement leaves one fewer gap (5 to 4 to 3). With all 3 placed, press Next."],
      ["完成：4! × P(5,3) = 24 × 60 = 1440 種排法。按「重播」可以再試一次。",
        "Done: 4! × P(5,3) = 24 × 60 = 1440 arrangements. Press Replay to try again."]
    ];

    var stage = el("div", "demo-stage stage-slots");
    root.appendChild(stage);

    var hold = el("div", "demo-hold");
    hold.appendChild(biInline("等候放入空隙的女生：", "Girls waiting for a gap:"));
    var holdRow = el("div", "hold-row");
    hold.appendChild(holdRow);
    root.appendChild(hold);

    /* 空隙的選擇數：5 × 4 × 3 = 60（逐位遞減） */
    var choice = el("div", "demo-choice");
    choice.setAttribute("aria-live", "polite");
    [["1", "5"], ["2", "× 4"], ["3", "× 3"], ["4", "= 60"]].forEach(function (p) {
      var b = el("span", "eqbox eq-c" + p[0]);
      b.appendChild(el("span", "eq", p[1]));
      choice.appendChild(b);
    });
    choice.appendChild(biInline("每放一位女生，可揀的空隙就少一個", "Each girl placed leaves one fewer gap"));
    root.appendChild(choice);

    /* 4! × P(5,3) */
    var eq = el("div", "demo-eq");
    eq.setAttribute("aria-live", "polite");
    var rowParts = el("div", "eqrow");
    var eqBoys = el("span", "eqbox eq-units");
    eqBoys.appendChild(el("span", "eq", "4! = 24"));
    var eqGaps = el("span", "eqbox eq-inner");
    eqGaps.appendChild(el("span", "eq ncr-line", "P(5,3) = 60"));
    rowParts.appendChild(eqBoys);
    rowParts.appendChild(el("span", "eqtimes", "×"));
    rowParts.appendChild(eqGaps);
    var rowTotal = el("div", "eqrow eqrow-total");
    rowTotal.appendChild(el("span", "eq eq-chain", "4! × P(5,3) = 24 × 60 ="));
    var eqTotal = el("span", "eqbox eq-total");
    eqTotal.appendChild(el("span", "eq", "1440"));
    rowTotal.appendChild(eqTotal);
    eq.appendChild(rowParts);
    eq.appendChild(rowTotal);
    root.appendChild(eq);

    var ctrl = el("div", "demo-ctrl");
    var prev = button("btn-ghost", "上一步", "Previous", "←", "start");
    var next = button("btn-primary", "下一步", "Next", "→", "end");
    var replay = button("btn-ghost", "重播", "Replay");
    ctrl.appendChild(prev);
    ctrl.appendChild(next);
    ctrl.appendChild(replay);
    root.appendChild(ctrl);

    var boys = BOYS.slice();
    var placed = [];            /* [{slot: i, girl: k}] 由先到後 */
    var pickedBoy = null;
    var tried = {};
    var step = 0;
    var shuffleTimer = null;    /* 打亂男生的 timer */

    function canSwapBoys() { return step >= 1 && step <= 3; }
    function girlsLeft() { return GIRLS.filter(function (g, k) { return !placedHolds(k); }); }
    function placedHolds(k) {
      return placed.some(function (p) { return p.girl === k; });
    }
    function markTried() {
      tried[boys.join("")] = true;
      var c = root.querySelector(".demo-count .order-txt");
      if (c) c.textContent = Object.keys(tried).length + " / 24";
    }
    function swapUnits(i, j) {
      var t = boys[i];
      boys[i] = boys[j];
      boys[j] = t;
    }
    function pulse(nodes) {
      nodes.forEach(function (n) {
        n.classList.add("unit-moved");
        setTimeout(function () { n.classList.remove("unit-moved"); }, 450);
      });
    }

    function boyUnit(id) {
      var b = el("button", "unit");
      b.setAttribute("type", "button");
      b.setAttribute("data-boy", id);
      /* 號碼跟「身份」而唔係位置：換位／打亂時個號碼會跟住郁，學生先睇得到次序改變 */
      b.appendChild(el("div", "pnode pnode-boy", id.replace(/^B/, "")));
      b.disabled = !canSwapBoys();
      if (canSwapBoys()) b.classList.add("unit-live");
      if (pickedBoy === id) {
        b.classList.add("unit-picked");
        b.setAttribute("aria-pressed", "true");
      }
      b.onclick = function () {
        if (!canSwapBoys()) return;
        if (pickedBoy === null) { pickedBoy = id; paintStage(); return; }
        var x = boys.indexOf(pickedBoy);
        var y = boys.indexOf(id);
        pickedBoy = null;
        if (x < 0 || y < 0) { paintStage(); return; }
        swapUnits(x, y);
        paintStage();
        pulse(Array.prototype.slice.call(stage.querySelectorAll(".unit")));
      };
      return b;
    }

    function slotEl(i) {
      var s = el("button", "slot");
      s.setAttribute("type", "button");
      s.setAttribute("data-slot", String(i));
      var here = placed.filter(function (p) { return p.slot === i; })[0];
      if (here) {
        s.classList.add("slot-filled");
        var g = el("span", "gchip", String(here.girl + 1));
        g.setAttribute("data-girl", GIRLS[here.girl]);
        if (here.fresh) g.classList.add("g-in");
        s.appendChild(g);
        /* 只可以拎返最後放入嘅一位（保持「逐位遞減」的推理一致） */
        var last = placed[placed.length - 1];
        if (step === 3 && last && last.slot === i) {
          s.classList.add("slot-live");
          s.onclick = function () {
            placed.pop();
            paintStage();
          };
        } else {
          s.disabled = true;
        }
      } else {
        var open = step === 3 && placed.length < GIRLS.length;
        if (step >= 2) s.classList.add("slot-on");
        if (open) {
          s.classList.add("slot-live");
          s.onclick = function () {
            var left = GIRLS.map(function (g, k) { return k; })
              .filter(function (k) { return !placedHolds(k); });
            placed.push({ slot: i, girl: left[0], fresh: true });
            paintStage();
          };
        } else {
          s.disabled = true;
        }
      }
      return s;
    }

    function paintStage() {
      Array.prototype.slice.call(stage.querySelectorAll(".unit, .slot")).forEach(function (n) {
        stage.removeChild(n);
      });
      for (var i = 0; i < boys.length; i++) {
        stage.appendChild(slotEl(i));
        stage.appendChild(boyUnit(boys[i]));
      }
      stage.appendChild(slotEl(boys.length));
      holdRow.innerHTML = "";
      GIRLS.forEach(function (g, k) {
        if (placedHolds(k)) return;
        holdRow.appendChild(el("span", "gchip gchip-hold", String(k + 1)));
      });
      choice.setAttribute("data-placed", String(placed.length));
      markTried();
    }

    /* 打亂男生：隨機抽兩個位置互換（FLIP：由舊位滑去新位），令「4! 有咁多排法」睇得到 */
    function flipSwap(i, j) {
      var before = boyEls();
      var x0 = before[i] ? before[i].getBoundingClientRect().left : 0;
      var x1 = before[j] ? before[j].getBoundingClientRect().left : 0;
      swapUnits(i, j);
      paintStage();
      var after = boyEls();
      [[after[i], x0], [after[j], x1]].forEach(function (p) {
        var n = p[0];
        if (!n) return;
        var now = n.getBoundingClientRect().left;
        n.style.transition = "none";
        n.style.transform = "translateX(" + (p[1] - now) + "px)";
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () {
            n.style.transition = "transform .34s ease";
            n.style.transform = "";
          });
        } else {
          n.style.transform = "";
        }
      });
    }
    function boyEls() { return Array.prototype.slice.call(stage.querySelectorAll(".unit")); }
    function shuffleTick() {
      if (boys.length < 2) return;
      var i = Math.floor(Math.random() * boys.length);
      var j = Math.floor(Math.random() * boys.length);
      if (i === j) j = (j + 1) % boys.length;
      flipSwap(i, j);
    }
    function stopShuffle() {
      if (shuffleTimer) { clearInterval(shuffleTimer); shuffleTimer = null; }
      shuffleBtn.disabled = false;
      root.removeAttribute("data-shuffle");
    }
    shuffleBtn.onclick = function () {
      if (!canSwapBoys()) return;
      if (shuffleTimer) { stopShuffle(); return; }
      pickedBoy = null;
      root.setAttribute("data-shuffle", "1");
      shuffleBtn.disabled = true;
      var left = 5;
      shuffleTimer = setInterval(function () {
        shuffleTick();
        left--;
        if (left <= 0) stopShuffle();
      }, 380);
    };
    /* 供測試用：手動 tick 一次、停止、查詢是否播放中 */
    root.__demoShuffle = {
      tick: shuffleTick,
      stop: stopShuffle,
      playing: function () { return !!shuffleTimer; }
    };

    function setStep(n) {
      stopShuffle();                                 /* 換步時一定要停打亂動畫 */
      step = Math.max(0, Math.min(SLOT_STEPS, n | 0));
      if (step < 3) placed = [];
      pickedBoy = null;
      root.setAttribute("data-step", String(step));
      guideTxt.innerHTML = "";
      guideTxt.appendChild(bi(GUIDES[step][0], GUIDES[step][1]));
      stepTag.innerHTML = "";
      stepTag.appendChild(biInline("第 " + (step + 1) + " / " + (SLOT_STEPS + 1) + " 步",
        "Step " + (step + 1) + " / " + (SLOT_STEPS + 1)));
      prev.disabled = step === 0;
      next.disabled = step === SLOT_STEPS;
      paintStage();
    }
    prev.onclick = function () { setStep(step - 1); };
    next.onclick = function () { setStep(step + 1); };
    replay.onclick = function () {
      boys = BOYS.slice();
      placed = [];
      tried = {};
      setStep(0);
    };

    /* 男生排列的計數（同綑綁法一致的「已試 n / 24 種」） */
    var countLine = el("div", "demo-count");
    countLine.appendChild(biInline("男生已試排列：", "Boy orders tried:"));
    var countTxt = el("span", "order-txt");
    countLine.appendChild(countTxt);
    root.insertBefore(countLine, eq);

    host.appendChild(root);
    /* opts.place = n：先放好 n 位女生（獨立頁 ?place=N 用，方便截圖或直接跳到某一狀態） */
    if (o.place) {
      for (var pk = 0; pk < Math.min(o.place, GIRLS.length); pk++) {
        placed.push({ slot: pk, girl: pk, fresh: false });
      }
    }
    setStep(o.step || 0);
    /* opts.shuffle = n：先打亂 n 次（獨立頁 ?shuffle=N 用，方便截圖或跳去已打亂的狀態） */
    if (o.shuffle) {
      for (var sk = 0; sk < o.shuffle; sk++) shuffleTick();
    }
    return root;
  }

  /* ── 分組問題（Grouping）示範 ────────────────────────────────────────────
     情境一 · 6 人分 2 組（每組 3 人）
       有組名（一隊去數學賽、一隊去科學賽）：C(6,3) × C(3,3) = 20
       無組名（分兩隊打街頭籃球）：兩隊對調係同一場 → ÷ 2! → 10
     情境二 · 10 人分 4、4、2 三組
       指定營地 A／B／C：有標籤 → C(10,4) × C(6,4) × C(2,2) = 3150
       4 人房 2 間＋2 人房 1 間／純粹分堆：只有兩個 4 人組會重複 → ÷ 2! → 1575
     ───────────────────────────────────────────────────────────────────── */
  function grouping(host, opts) {
    var o = opts || {};
    var root = el("div", "demo");
    root.setAttribute("data-demo", "grouping");

    var head = el("div", "demo-head");
    var title = el("div", "demo-title");
    title.appendChild(biInline("分組問題示範", "Grouping demo"));
    head.appendChild(title);
    root.appendChild(head);

    var people6 = [1, 2, 3, 4, 5, 6];
    var people10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var state = { scene: o.scene === 2 ? 2 : 1, one: "label", two: "camp" };

    /* 情境切換 */
    var segScene = el("div", "demo-seg");
    var s1 = button("", "情境一 · 6 人分 2 組", "Scene 1 · 6 into 2 groups");
    var s2 = button("", "情境二 · 10 人分 3 組", "Scene 2 · 10 into 3 groups");
    segScene.appendChild(s1);
    segScene.appendChild(s2);
    root.appendChild(segScene);

    /* 情境一 */
    var panelOne = el("div", "demo-panel");
    var segOne = el("div", "demo-seg");
    var o1 = button("", "數理比賽（有組名）", "Maths / Science (labelled)");
    var o2 = button("", "3 打 3 籃球（無組名）", "3-on-3 basketball (unlabelled)");
    segOne.appendChild(o1);
    segOne.appendChild(o2);
    panelOne.appendChild(segOne);
    var stageOne = el("div", "demo-stage stage-groups");
    panelOne.appendChild(stageOne);
    var ncrLineOne = el("div", "demo-eqline");
    panelOne.appendChild(ncrLineOne);
    var dupOne = el("div", "demo-dup");
    panelOne.appendChild(dupOne);
    var eqOne = el("div", "demo-eq");
    eqOne.setAttribute("aria-live", "polite");
    panelOne.appendChild(eqOne);
    var randOne = button("btn-ghost", "隨機再分一次", "Shuffle again");
    randOne.setAttribute("data-rand", "1");
    panelOne.appendChild(randOne);
    root.appendChild(panelOne);

    /* 情境二 */
    var panelTwo = el("div", "demo-panel");
    var segTwo = el("div", "demo-seg");
    var t1 = button("", "指定營地 A／B／C", "Camps A / B / C");
    var t2 = button("", "4 人房 2 間＋2 人房 1 間", "Two 4-bed + one 2-bed room");
    var t3 = button("", "純粹分堆", "Plain piles, no labels");
    segTwo.appendChild(t1);
    segTwo.appendChild(t2);
    segTwo.appendChild(t3);
    panelTwo.appendChild(segTwo);
    var stageTwo = el("div", "demo-stage stage-groups");
    panelTwo.appendChild(stageTwo);
    var dupTwo = el("div", "demo-dup");
    panelTwo.appendChild(dupTwo);
    var eqTwo = el("div", "demo-eq");
    eqTwo.setAttribute("aria-live", "polite");
    panelTwo.appendChild(eqTwo);
    var randTwo = button("btn-ghost", "隨機再分一次", "Shuffle again");
    randTwo.setAttribute("data-rand", "2");
    panelTwo.appendChild(randTwo);
    root.appendChild(panelTwo);

    /* ── 細部：建立每個組別容器 ─────────────────────────────────────────── */
    function gbox(labelZh, labelEn, members, cls) {
      var box = el("div", "gbox" + (cls ? " " + cls : ""));
      if (labelZh) {
        var h = el("div", "gbox-h");
        h.appendChild(biInline(labelZh, labelEn));
        box.appendChild(h);
      } else {
        box.appendChild(el("div", "gbox-h gbox-h-bare"));
      }
      var row = el("div", "gmembers");
      members.forEach(function (m) {
        row.appendChild(el("span", "gmember", String(m)));
      });
      box.appendChild(row);
      return box;
    }
    function split(arr, sizes) {
      var out = [];
      var k = 0;
      sizes.forEach(function (n) {
        out.push(arr.slice(k, k + n));
        k += n;
      });
      return out;
    }
    function dupNote(zh, en) {
      var d = el("div", "dup-note");
      d.appendChild(bi(zh, en));
      return d;
    }

    function renderOne() {
      var gs = split(people6, [3, 3]);
      stageOne.innerHTML = "";
      var named = state.one === "label";
      stageOne.appendChild(gbox(named ? "數學隊" : "", named ? "Maths team" : "", gs[0]));
      stageOne.appendChild(gbox(named ? "科學隊" : "", named ? "Science team" : "", gs[1]));
      ncrLineOne.innerHTML = "";
      ncrLineOne.appendChild(biInline(
        named ? "兩隊有分別（一隊去數學賽、一隊去科學賽）："
          : "兩隊無分別（同一場球賽）：",
        named ? "The two teams differ (maths vs science):" : "The two teams are interchangeable:"));
      ncrLineOne.appendChild(ncr(6, 3));
      ncrLineOne.appendChild(el("span", "eqtimes", "×"));
      ncrLineOne.appendChild(ncr(3, 3));
      ncrLineOne.appendChild(el("span", "eq", named ? "= 20" : "÷ 2! = 10"));

      dupOne.innerHTML = "";
      eqOne.innerHTML = "";
      if (named) {
        var row = el("div", "eqrow");
        row.appendChild(el("span", "eq", "20"));
        row.appendChild(biInline("種（兩隊有組名，對調係兩個唔同結果）",
          "ways (labelled teams: swapping them is a different outcome)"));
        eqOne.appendChild(row);
      } else {
        dupOne.appendChild(dupNote(
          "以下兩個寫法其實係同一場球賽：(1,2,3) 對 (4,5,6) 與 (4,5,6) 對 (1,2,3)。兩個 3 人組人數相同又無組名，對調無效，所以要除以 2!。",
          "These two writings are the same match: (1,2,3) vs (4,5,6) and (4,5,6) vs (1,2,3). The two 3-person groups are the same size and carry no label, so swapping them changes nothing — divide by 2!."));
        var swap = button("btn-ghost", "示範對調", "Swap the two groups", "⇄", "end");
        swap.onclick = function () {
          var a = people6.slice(0, 3);
          var b = people6.slice(3, 6);
          people6 = b.concat(a);
          renderOne();
        };
        dupOne.appendChild(swap);
        var r2 = el("div", "eqrow");
        var box = el("span", "eqbox eq-total");
        box.appendChild(el("span", "eq", "10"));
        r2.appendChild(el("span", "eq-chain", "20 ÷ 2! ="));
        r2.appendChild(box);
        r2.appendChild(biInline("種", "ways"));
        eqOne.appendChild(r2);
      }
    }

    function renderTwo() {
      var sizes = [4, 4, 2];
      var gs = split(people10, sizes);
      var mode = state.two;                       /* camp | room | pile */
      stageTwo.innerHTML = "";
      var labels = {
        camp: [["營地 A", "Camp A"], ["營地 B", "Camp B"], ["營地 C", "Camp C"]],
        room: [["4 人房（1）", "4-bed room (1)"], ["4 人房（2）", "4-bed room (2)"], ["2 人房", "2-bed room"]],
        pile: [["", ""], ["", ""], ["", ""]]
      }[mode];
      var same4 = mode !== "camp";
      gs.forEach(function (members, i) {
        var cls = "";
        if (same4 && i < 2) cls = "gbox-twin";
        else if (same4 && i === 2) cls = "gbox-single";
        stageTwo.appendChild(gbox(labels[i][0], labels[i][1], members, cls));
      });
      dupTwo.innerHTML = "";
      eqTwo.innerHTML = "";
      if (mode === "camp") {
        eqTwo.appendChild(ncrRow(["C(10,4)", "×", "C(6,4)", "×", "C(2,2)", "= 3150"], "種（三個營地有名字，各自唔同）", "ways (three named camps, all different)"));
      } else {
        dupTwo.appendChild(dupNote(
          "只有兩個 4 人組會互相重複：對調之後完全一樣 → 除以 2!。2 人組人數獨特，唔會同其他組混淆，所以唔使除 3!。",
          "Only the two 4-person groups duplicate each other: swapping them gives the same division → divide by 2!. The 2-person group has a unique size, so it can never be confused with the others — no need to divide by 3!."));
        var swap2 = button("btn-ghost", "示範對調兩個 4 人組", "Swap the two 4-person groups", "⇄", "end");
        swap2.onclick = function () {
          var a = people10.slice(0, 4);
          var b = people10.slice(4, 8);
          people10 = b.concat(a).concat(people10.slice(8));
          renderTwo();
        };
        dupTwo.appendChild(swap2);
        eqTwo.appendChild(ncrRow(["C(10,4)", "×", "C(6,4)", "×", "C(2,2)", "÷ 2! = 1575"],
          "種（只有兩個 4 人組對調重複，所以除 2! 而唔係 3!）",
          "ways (only the two 4-person groups duplicate, so divide by 2!, not 3!)"));
      }
    }
    /* 一行 C^n_r 算式（最後一段＝結果，用綠色） */
    function ncrRow(parts, zhTail, enTail) {
      var row = el("div", "eqrow");
      parts.forEach(function (p, i) {
        if (/^C\(/.test(p)) {
          var m = p.match(/C\((\d+),(\d+)\)/);
          row.appendChild(ncr(m[1], m[2]));
        } else if (p === "×") {
          row.appendChild(el("span", "eqtimes", "×"));
        } else {
          var box = el("span", "eqbox eq-total");
          box.appendChild(el("span", "eq", p.replace("= ", "").replace("÷ 2! = ", "")));
          if (/÷ 2!/.test(p)) row.appendChild(el("span", "eq-chain", "÷ 2! ="));
          else row.appendChild(el("span", "eq-chain", "= "));
          row.appendChild(box);
        }
      });
      row.appendChild(biInline(zhTail, enTail));
      return row;
    }

    function paint() {
      segScene.querySelectorAll(".btn").forEach(function (b, i) {
        b.classList.toggle("on", (i === 0) === (state.scene === 1));
        b.setAttribute("aria-pressed", state.scene === 1 ? (i === 0 ? "true" : "false") : (i === 1 ? "true" : "false"));
      });
      segOne.querySelectorAll(".btn").forEach(function (b, i) {
        var on = (i === 0) === (state.one === "label");
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      ["camp", "room", "pile"].forEach(function (m, i) {
        var b = segTwo.querySelectorAll(".btn")[i];
        b.classList.toggle("on", state.two === m);
        b.setAttribute("aria-pressed", state.two === m ? "true" : "false");
      });
      panelOne.style.display = state.scene === 1 ? "" : "none";
      panelTwo.style.display = state.scene === 2 ? "" : "none";
      renderOne();
      renderTwo();
    }

    s1.onclick = function () { state.scene = 1; paint(); };
    s2.onclick = function () { state.scene = 2; paint(); };
    o1.onclick = function () { state.one = "label"; paint(); };
    o2.onclick = function () { state.one = "bare"; paint(); };
    t1.onclick = function () { state.two = "camp"; paint(); };
    t2.onclick = function () { state.two = "room"; paint(); };
    t3.onclick = function () { state.two = "pile"; paint(); };
    randOne.onclick = function () {
      people6 = shuffle([1, 2, 3, 4, 5, 6]);
      renderOne();
    };
    randTwo.onclick = function () {
      people10 = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      renderTwo();
    };

    host.appendChild(root);
    paint();
    return root;
  }

  global.S5A_DEMO = {
    types: { "tie-up": tieUp, "slot-in": slotIn, grouping: grouping },
    tieUp: tieUp,
    slotIn: slotIn,
    grouping: grouping,
    langBar: langBar,
    setLang: setLang
  };
})(window);
