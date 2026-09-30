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

  /* ── 組合（Combination）示範：為何要除 r! ──────────────────────────────
     步驟 0 · 題目：5 人選 3 人組隊（唔計次序）；點人即移落「隊伍列」
     步驟 1 · 同一隊 3 人有 3! = 6 種寫法（123、132、213、231、312、321）
     步驟 2 · 有次序：5 × 4 × 3 = P(5,3) = 60
     步驟 3 · 6 種寫法合併成一隊 → 60 ÷ 3! = C(5,3) = 10（附「已找到 n / 10 隊」）
     ───────────────────────────────────────────────────────────────────── */
  var COMB_STEPS = 3;
  var COMB_PICK = 3;
  function combination(host, opts) {
    var o = opts || {};
    var PEOPLE = [1, 2, 3, 4, 5];

    var root = el("div", "demo");
    root.setAttribute("data-demo", "combination");

    var head = el("div", "demo-head");
    var title = el("div", "demo-title");
    title.appendChild(biInline("組合示範", "Combination demo"));
    head.appendChild(title);
    var stepTag = el("div", "demo-step");
    head.appendChild(stepTag);
    root.appendChild(head);

    var q = el("div", "demo-q");
    q.appendChild(bi("5 名學生中選 3 人組隊（唔計次序）。",
      "Choose 3 of 5 students to form a team (order does not matter)."));
    root.appendChild(q);

    var guide = el("div", "demo-guide");
    var guideTxt = el("div", "guide-txt");
    guide.appendChild(guideTxt);
    root.appendChild(guide);
    var GUIDES = [
      ["點上面 3 位學生，佢哋會移落下面嘅「隊伍列」；點隊伍成員可以放返出去。",
        "Tap 3 students above and they move down into the team row; tap a team member to send them back."],
      ["同一隊 3 個人有 3! = 6 種寫法（123、132、213…），但全部都係同一隊。",
        "The same 3-person team has 3! = 6 writings (123, 132, 213 ...) — all the same team."],
      ["如果計次序：第一位 5 個選擇、第二位 4 個、第三位 3 個 → P(5,3) = 5 × 4 × 3 = 60。",
        "If order counted: 5 choices, then 4, then 3 → P(5,3) = 5 × 4 × 3 = 60."],
      ["6 種寫法其實同一隊 → 60 ÷ 3! = 10。試點不同的人，睇下可以找到幾多隊（共 10 隊）。",
        "The 6 writings are one team → 60 ÷ 3! = 10. Tap different students to find all 10 teams."]
    ];

    /* 兩行：上＝候選（5 人），下＝隊伍（3 人，有序） */
    var poolLab = el("div", "row-lab");
    poolLab.appendChild(biInline("候選（5 人）", "Candidates (5)"));
    root.appendChild(poolLab);
    var poolRow = el("div", "pick-row");
    root.appendChild(poolRow);

    var teamLab = el("div", "row-lab");
    teamLab.appendChild(biInline("你的隊伍（3 人）", "Your team (3)"));
    var orderBtn = button("btn-ghost", "打亂次序", "Shuffle the order", "⇄", "start");
    orderBtn.setAttribute("data-order", "1");
    teamLab.appendChild(orderBtn);
    root.appendChild(teamLab);
    var teamRow = el("div", "team-row");
    root.appendChild(teamRow);

    var note = el("div", "order-note");
    note.appendChild(bi("按下「⇄ 打亂次序」會換成另一個次序，睇完會自動排返 1,2,3 —— 因為唔計次序，次序唔同唔算新一隊。",
      "Press Shuffle the order to show another order; it then snaps back to 1,2,3 — with order ignored, a different order is not a new team."));
    root.appendChild(note);

    var ordRow = el("div", "ord-row");
    root.appendChild(ordRow);

    var countLine = el("div", "demo-count");
    countLine.appendChild(biInline("已找到隊伍：", "Teams found:"));
    var countTxt = el("span", "order-txt");
    countLine.appendChild(countTxt);
    root.appendChild(countLine);

    var eq = el("div", "demo-eq");
    eq.setAttribute("aria-live", "polite");
    var rowA = el("div", "eqrow eqrow-p");
    var boxP = el("span", "eqbox");
    boxP.appendChild(el("span", "eq", "5 × 4 × 3 = 60"));
    rowA.appendChild(boxP);
    rowA.appendChild(biInline("有次序（P(5,3)）", "with order (P(5,3))"));
    var rowB = el("div", "eqrow eqrow-total");
    rowB.appendChild(el("span", "eq eq-chain", "60 ÷ 3! ="));
    var boxC = el("span", "eqbox eq-total");
    boxC.appendChild(el("span", "eq", "10"));
    rowB.appendChild(boxC);
    rowB.appendChild(biInline("組合（C(5,3)）", "combination (C(5,3))"));
    eq.appendChild(rowA);
    eq.appendChild(rowB);
    root.appendChild(eq);

    var ctrl = el("div", "demo-ctrl");
    var prev = button("btn-ghost", "上一步", "Previous", "←", "start");
    var next = button("btn-primary", "下一步", "Next", "→", "end");
    var replay = button("btn-ghost", "重播", "Replay");
    ctrl.appendChild(prev);
    ctrl.appendChild(next);
    ctrl.appendChild(replay);
    root.appendChild(ctrl);

    var team = [];             /* 已選的學生（有序；預設空，等學生自己揀） */
    var tried = {};
    var step = 0;
    var orderTimer = null;     /* 「換次序」自動還原的 timer */

    function pool() {
      return PEOPLE.filter(function (n) { return team.indexOf(n) < 0; });
    }
    function markTried() {
      if (team.length !== COMB_PICK) return;
      tried[team.slice().sort(function (a, b) { return a - b; }).join("-")] = true;
      countTxt.textContent = Object.keys(tried).length + " / 10";
    }
    /* 6 種寫法：把隊伍由細至大排好，再列出所有排列 */
    function perms(arr) {
      if (arr.length <= 1) return [arr.slice()];
      var out = [];
      arr.forEach(function (v, i) {
        var rest = arr.slice(0, i).concat(arr.slice(i + 1));
        perms(rest).forEach(function (p) { out.push([v].concat(p)); });
      });
      return out;
    }
    function chip(n, cls) {
      var b = el("button", "unit unit-dot" + (cls ? " " + cls : ""));
      b.setAttribute("type", "button");
      b.appendChild(el("div", "pnode" + (cls ? " pnode-picked" : ""), String(n)));
      return b;
    }
    function paint() {
      /* 候選列：未入隊的學生（滿 3 人後唔可以再加） */
      poolRow.innerHTML = "";
      pool().forEach(function (n) {
        var b = chip(n);
        b.setAttribute("data-person", String(n));
        b.disabled = team.length >= COMB_PICK;
        b.onclick = function () {
          if (team.length >= COMB_PICK) return;
          team.push(n);
          markTried();
          paint();
        };
        poolRow.appendChild(b);
      });
      /* 隊伍列：3 人，有序；點一下可以放返出去 */
      teamRow.innerHTML = "";
      team.forEach(function (n) {
        var b = chip(n, "unit-team");
        b.setAttribute("data-team", String(n));
        b.onclick = function () {
          var k = team.indexOf(n);
          if (k >= 0) team.splice(k, 1);
          if (orderTimer) restoreOrder();
          note.classList.remove("order-live");
          paint();
        };
        teamRow.appendChild(b);
      });
      orderBtn.disabled = team.length !== COMB_PICK || !!orderTimer;
      /* 6 種寫法（第 2 步起） */
      ordRow.innerHTML = "";
      if (step >= 1 && team.length === COMB_PICK) {
        var sorted = team.slice().sort(function (a, b) { return a - b; });
        perms(sorted).forEach(function (p) {
          var on = p.join("-") === team.join("-");
          var c = el("div", "ord-card" + (step >= 3 ? " ord-dim" : (on ? " ord-on" : "")), p.join(""));
          c.setAttribute("data-perm", p.join("-"));
          ordRow.appendChild(c);
        });
        if (step >= 3) {
          ordRow.appendChild(el("span", "eqtimes", "="));
          ordRow.appendChild(el("div", "ord-card ord-merged", "{" + sorted.join(",") + "}"));
        }
        markTried();
      }
      if (team.length !== COMB_PICK) countTxt.textContent = "";
    }
    /* 換次序：3 個隊員滑去對方位置（FLIP），睇完自動排返 1,2,3 */
    function animateOrder(next) {
      var pos = {};
      Array.prototype.slice.call(teamRow.querySelectorAll("[data-team]")).forEach(function (b) {
        pos[b.getAttribute("data-team")] = b.getBoundingClientRect().left;
      });
      team = next.slice();
      paint();
      Array.prototype.slice.call(teamRow.querySelectorAll("[data-team]")).forEach(function (b) {
        var x0 = pos[b.getAttribute("data-team")];
        if (x0 == null) return;
        b.style.transition = "none";
        b.style.transform = "translateX(" + (x0 - b.getBoundingClientRect().left) + "px)";
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () {
            b.style.transition = "transform .3s ease";
            b.style.transform = "";
          });
        } else {
          b.style.transform = "";
        }
      });
    }
    function restoreOrder() {
      if (orderTimer) { clearTimeout(orderTimer); orderTimer = null; }
      note.classList.remove("order-live");
      if (team.length === COMB_PICK) {
        animateOrder(team.slice().sort(function (a, b) { return a - b; }));
      }
      orderBtn.disabled = team.length !== COMB_PICK;
    }
    orderBtn.onclick = function () {
      if (team.length !== COMB_PICK || orderTimer) return;
      var next = team.slice();
      var last = next[COMB_PICK - 1];
      next[COMB_PICK - 1] = next[COMB_PICK - 2];
      next[COMB_PICK - 2] = last;
      animateOrder(next);
      note.classList.add("order-live");
      orderTimer = setTimeout(restoreOrder, 1200);
    };
    /* 供測試用：立即還原（jsdom 唔等 timer） */
    root.__demoOrder = {
      restore: restoreOrder,
      playing: function () { return !!orderTimer; }
    };

    function setStep(n) {
      step = Math.max(0, Math.min(COMB_STEPS, n | 0));
      if (orderTimer) restoreOrder();
      /* 入到第 2 步仍然未揀夠 3 人 → 保留已揀嘅，再補齊（令示範可以繼續） */
      if (step >= 1 && team.length !== COMB_PICK) {
        var avail = PEOPLE.filter(function (n) { return team.indexOf(n) < 0; });
        while (team.length < COMB_PICK && avail.length) team.push(avail.shift());
        markTried();
      }
      root.setAttribute("data-step", String(step));
      stepTag.innerHTML = "";
      stepTag.appendChild(biInline("第 " + (step + 1) + " / " + (COMB_STEPS + 1) + " 步",
        "Step " + (step + 1) + " / " + (COMB_STEPS + 1)));
      guideTxt.innerHTML = "";
      guideTxt.appendChild(bi(GUIDES[step][0], GUIDES[step][1]));
      prev.disabled = step === 0;
      next.disabled = step === COMB_STEPS;
      paint();
    }
    prev.onclick = function () { setStep(step - 1); };
    next.onclick = function () { setStep(step + 1); };
    replay.onclick = function () {
      if (orderTimer) restoreOrder();
      team = [];
      tried = {};
      setStep(0);
    };

    host.appendChild(root);
    setStep(o.step || 0);
    return root;
  }

  /* ── 路徑（Grid path）示範：路徑 ＝ 選哪幾步向東 ────────────────────────
     4 步向東、3 步向北（共 7 步）→ C(7,4) = 35，亦等於 C(7,3)
     ───────────────────────────────────────────────────────────────────── */
  var PATH_STEPS = 3;
  var GRID_E = 4;
  var GRID_N = 3;
  var CELL = 22, PAD = 9;
  function svgEl(tag, attrs) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function pathDemo(host, opts) {
    var o = opts || {};
    var TOTAL = GRID_E + GRID_N;                 /* 7 步 */
    var DEMO_SEQ = ["E", "N", "E", "N", "E", "N", "E"];

    var root = el("div", "demo");
    root.setAttribute("data-demo", "path");

    var head = el("div", "demo-head");
    var title = el("div", "demo-title");
    title.appendChild(biInline("路徑示範", "Grid-path demo"));
    head.appendChild(title);
    var stepTag = el("div", "demo-step");
    head.appendChild(stepTag);
    root.appendChild(head);

    var q = el("div", "demo-q");
    q.appendChild(bi("由 P 走到 Q：只可以向右（東）或向上（北），共 7 步（4 東、3 北）。",
      "Walk from P to Q using only east and north moves: 7 steps in total (4 east, 3 north)."));
    root.appendChild(q);

    var guide = el("div", "demo-guide");
    var guideTxt = el("div", "guide-txt");
    guide.appendChild(guideTxt);
    root.appendChild(guide);
    var GUIDES = [
      ["按「下一步」先睇一條合法路徑。", "Press Next to see one valid path."],
      ["呢條路徑＝東北東北東北東。留意：7 步之中只要揀邊 4 步向東，路徑就唯一決定。",
        "This path is E N E N E N E. Note: choosing which 4 of the 7 steps go east decides the whole path."],
      ["點任何一格切換「東／北」，要保持 4 東 3 北 —— 每個合法組合就係一條路徑。C(7,4) = 35。",
        "Tap a box to switch east/north; keep 4 east and 3 north — each valid choice is one path. C(7,4) = 35."],
      ["換個角度：揀 3 步向北一樣得 → C(7,3) = 35，答案相同。",
        "Another view: choose the 3 north steps instead → C(7,3) = 35, the same answer."]
    ];

    var stage = el("div", "demo-stage stage-path");
    var svg = svgEl("svg", { viewBox: "0 0 104 82", class: "grid-svg", role: "img" });
    var GX = GRID_E * CELL, GY = GRID_N * CELL;
    function gx(i) { return PAD + i * CELL; }
    function gy(j) { return PAD + GY - j * CELL; }
    var g = svgEl("g", {});
    for (var i = 0; i <= GRID_E; i++) {
      g.appendChild(svgEl("line", { x1: gx(i), y1: gy(0), x2: gx(i), y2: gy(GRID_N), class: "grid-line" }));
    }
    for (var j = 0; j <= GRID_N; j++) {
      g.appendChild(svgEl("line", { x1: gx(0), y1: gy(j), x2: gx(GRID_E), y2: gy(j), class: "grid-line" }));
    }
    for (var a = 0; a <= GRID_E; a++) {
      for (var b = 0; b <= GRID_N; b++) {
        g.appendChild(svgEl("circle", { cx: gx(a), cy: gy(b), r: 1.6, class: "grid-dot" }));
      }
    }
    var poly = svgEl("polyline", { points: "", class: "grid-path" });
    g.appendChild(poly);
    var pLab = svgEl("text", { x: gx(0) - 7, y: gy(0) + 4, class: "grid-lab" });
    pLab.textContent = "P";
    var qLab = svgEl("text", { x: gx(GRID_E) + 3, y: gy(GRID_N) + 4, class: "grid-lab" });
    qLab.textContent = "Q";
    g.appendChild(pLab);
    g.appendChild(qLab);
    svg.appendChild(g);
    stage.appendChild(svg);
    root.appendChild(stage);

    var stepRow = el("div", "path-steps");
    root.appendChild(stepRow);
    var countLine = el("div", "demo-count");
    countLine.appendChild(biInline("向東的步數：", "East steps:"));
    var countTxt = el("span", "order-txt");
    countLine.appendChild(countTxt);
    var okTxt = el("span", "path-ok");
    countLine.appendChild(okTxt);
    root.appendChild(countLine);

    var eq = el("div", "demo-eq");
    eq.setAttribute("aria-live", "polite");
    var rowA = el("div", "eqrow eqrow-p");
    var boxA = el("span", "eqbox");
    boxA.appendChild(el("span", "eq", "C(7,4) = 35"));
    rowA.appendChild(boxA);
    rowA.appendChild(biInline("（揀 4 步向東）", "(choose 4 east steps)"));
    var rowB = el("div", "eqrow eqrow-total");
    var boxB = el("span", "eqbox eq-total");
    boxB.appendChild(el("span", "eq", "35"));
    rowB.appendChild(el("span", "eq eq-chain", "C(7,4) = C(7,3) ="));
    rowB.appendChild(boxB);
    rowB.appendChild(biInline("（揀 3 步向北，答案一樣）", "(choose 3 north steps: same answer)"));
    eq.appendChild(rowA);
    eq.appendChild(rowB);
    root.appendChild(eq);

    var ctrl = el("div", "demo-ctrl");
    var prev = button("btn-ghost", "上一步", "Previous", "←", "start");
    var next = button("btn-primary", "下一步", "Next", "→", "end");
    var replay = button("btn-ghost", "重播", "Replay");
    ctrl.appendChild(prev);
    ctrl.appendChild(next);
    ctrl.appendChild(replay);
    root.appendChild(ctrl);

    var seq = DEMO_SEQ.slice();
    var step = 0;

    function pts() {
      var x = 0, y = 0, out = [gx(0) + "," + gy(0)];
      seq.forEach(function (s) {
        if (s === "E") x++; else y++;
        out.push(gx(x) + "," + gy(y));
      });
      return out.join(" ");
    }
    function eastCount() {
      return seq.filter(function (s) { return s === "E"; }).length;
    }
    function paint() {
      stepRow.innerHTML = "";
      seq.forEach(function (s, k) {
        var box = el("button", "pstep " + (s === "E" ? "pstep-e" : "pstep-n"));
        box.setAttribute("type", "button");
        box.setAttribute("data-step-i", String(k));
        box.textContent = s === "E" ? "東" : "北";
        box.disabled = step < 2;
        box.onclick = function () {
          if (step < 2) return;
          seq[k] = seq[k] === "E" ? "N" : "E";
          paint();
        };
        stepRow.appendChild(box);
      });
      var e = eastCount();
      countTxt.textContent = e + " / " + GRID_E;
      okTxt.textContent = e === GRID_E ? "✓ 合法路徑" : "（要向東走 " + GRID_E + " 步）";
      okTxt.classList.toggle("path-bad", e !== GRID_E);
      poly.setAttribute("points", step >= 1 ? pts() : "");
      poly.setAttribute("data-seq", seq.join(""));
    }
    function setStep(n) {
      step = Math.max(0, Math.min(PATH_STEPS, n | 0));
      if (step === 0) seq = DEMO_SEQ.slice();
      if (step === 1) seq = DEMO_SEQ.slice();
      root.setAttribute("data-step", String(step));
      stepTag.innerHTML = "";
      stepTag.appendChild(biInline("第 " + (step + 1) + " / " + (PATH_STEPS + 1) + " 步",
        "Step " + (step + 1) + " / " + (PATH_STEPS + 1)));
      guideTxt.innerHTML = "";
      guideTxt.appendChild(bi(GUIDES[step][0], GUIDES[step][1]));
      prev.disabled = step === 0;
      next.disabled = step === PATH_STEPS;
      paint();
    }
    prev.onclick = function () { setStep(step - 1); };
    next.onclick = function () { setStep(step + 1); };
    replay.onclick = function () { seq = DEMO_SEQ.slice(); setStep(0); };

    host.appendChild(root);
    setStep(o.step || 0);
    return root;
  }

  /* ── 至少／至多（Complement）示範：反面計數 ────────────────────────────
     6 男 7 女中選 5 人，至少 1 男 1 女
     步驟 1 · 直接分類：4 個 case（1男4女 … 4男1女）合共 1260
     步驟 2 · 反面計數：只有 2 個唔合法 case（全男 6、全女 21）→ 1287 − 27 = 1260
     步驟 3 · 兩條路都得，反面只數 2 個 case，唔怕漏
     ───────────────────────────────────────────────────────────────────── */
  var COMP_STEPS = 3;
  function complement(host, opts) {
    var o = opts || {};
    var BOYS = 6, GIRLS = 7;

    var root = el("div", "demo");
    root.setAttribute("data-demo", "complement");

    var head = el("div", "demo-head");
    var title = el("div", "demo-title");
    title.appendChild(biInline("至少／至多示範", "At least / at most demo"));
    head.appendChild(title);
    var stepTag = el("div", "demo-step");
    head.appendChild(stepTag);
    root.appendChild(head);

    var q = el("div", "demo-q");
    q.appendChild(bi("6 男 7 女中選 5 人，要求至少 1 男 1 女。",
      "Choose 5 people from 6 boys and 7 girls, with at least 1 boy and 1 girl."));
    var legend = el("div", "demo-legend");
    legend.appendChild(el("span", "lg-dot lg-boy"));
    legend.appendChild(biInline("男生（6 人）", "boys (6)"));
    legend.appendChild(el("span", "lg-dot lg-girl"));
    legend.appendChild(biInline("女生（7 人）", "girls (7)"));
    q.appendChild(legend);
    root.appendChild(q);

    var guide = el("div", "demo-guide");
    var guideTxt = el("div", "guide-txt");
    guide.appendChild(guideTxt);
    root.appendChild(guide);
    var GUIDES = [
      ["按「下一步」睇直接分類要數幾多個 case。", "Press Next to see how many cases a direct count needs."],
      ["直接分類有 4 個 case（1男4女、2男3女、3男2女、4男1女），加起來 1260。點任何一行可以睇嗰個 case 係點揀。",
        "A direct count has 4 cases (1 boy 4 girls, 2+3, 3+2, 4+1), totalling 1260. Tap a row to see that case."],
      ["反面計數：只有 2 個唔合法 case（全男、全女）→ 1287 − 6 − 21 = 1260。",
        "Counting the complement: only 2 failing cases (all boys, all girls) → 1287 − 6 − 21 = 1260."],
      ["兩條路都得到 1260，但反面只數 2 個 case，唔怕漏。切記唔可以用「先揀一男一女再揀其餘」——同一隊會重複計。",
        "Both routes give 1260, but the complement needs only 2 cases and cannot miss any. Never use 'pick one boy and one girl first': the same team is counted many times."]
    ];

    var stage = el("div", "demo-stage stage-dots");
    root.appendChild(stage);
    var list = el("div", "case-list");
    root.appendChild(list);
    var eq = el("div", "demo-eq");
    eq.setAttribute("aria-live", "polite");
    var rowA = el("div", "eqrow eqrow-direct");
    rowA.appendChild(el("span", "eq eq-chain", "直接分類 ＝"));
    var boxA = el("span", "eqbox");
    boxA.appendChild(el("span", "eq", "210 + 525 + 420 + 105 = 1260"));
    rowA.appendChild(boxA);
    var rowB = el("div", "eqrow eqrow-comp");
    rowB.appendChild(el("span", "eq eq-chain", "反面計數 ＝ C(13,5) − C(6,5) − C(7,5) = 1287 − 6 − 21 ="));
    var boxB = el("span", "eqbox eq-total");
    boxB.appendChild(el("span", "eq", "1260"));
    rowB.appendChild(boxB);
    eq.appendChild(rowA);
    eq.appendChild(rowB);
    root.appendChild(eq);

    var ctrl = el("div", "demo-ctrl");
    var prev = button("btn-ghost", "上一步", "Previous", "←", "start");
    var next = button("btn-primary", "下一步", "Next", "→", "end");
    var replay = button("btn-ghost", "重播", "Replay");
    ctrl.appendChild(prev);
    ctrl.appendChild(next);
    ctrl.appendChild(replay);
    root.appendChild(ctrl);

    var CASES = {
      direct: [
        { id: "d1", b: 1, g: 4, zh: "1 男 4 女", en: "1 boy, 4 girls", calc: "C(6,1) × C(7,4) = 6 × 35", n: 210 },
        { id: "d2", b: 2, g: 3, zh: "2 男 3 女", en: "2 boys, 3 girls", calc: "C(6,2) × C(7,3) = 15 × 35", n: 525 },
        { id: "d3", b: 3, g: 2, zh: "3 男 2 女", en: "3 boys, 2 girls", calc: "C(6,3) × C(7,2) = 20 × 21", n: 420 },
        { id: "d4", b: 4, g: 1, zh: "4 男 1 女", en: "4 boys, 1 girl", calc: "C(6,4) × C(7,1) = 15 × 7", n: 105 }
      ],
      comp: [
        { id: "c1", b: 5, g: 0, zh: "全男（5 人）", en: "all boys", calc: "C(6,5)", n: 6 },
        { id: "c2", b: 0, g: 5, zh: "全女（5 人）", en: "all girls", calc: "C(7,5)", n: 21 }
      ]
    };
    var active = null;
    var step = 0;

    function dotEl(kind, n) {
      var d = el("span", "pdot pdot-" + kind, String(n));
      d.setAttribute("data-dot-kind", kind);
      return d;
    }
    function paintDots() {
      stage.innerHTML = "";
      for (var b = 1; b <= BOYS; b++) {
        var db = dotEl("boy", b);
        if (active && active.b >= b) db.classList.add("pdot-on");
        stage.appendChild(db);
      }
      for (var g = 1; g <= GIRLS; g++) {
        var dg = dotEl("girl", g);
        if (active && active.g >= g) dg.classList.add("pdot-on");
        stage.appendChild(dg);
      }
    }
    function paintList() {
      list.innerHTML = "";
      var cls = step === 1 ? "direct" : step >= 2 ? "comp" : null;
      if (!cls) return;
      var items = CASES[cls];
      var total = 0;
      items.forEach(function (c) {
        var row = el("button", "case-row" + (active && active.id === c.id ? " case-on" : ""));
        row.setAttribute("type", "button");
        row.setAttribute("data-case", c.id);
        row.appendChild(el("span", "case-n", c.calc));
        row.appendChild(el("span", "case-tag", "= " + c.n));
        row.appendChild(biInline("（" + c.zh + "）", "(" + c.en + ")"));
        row.onclick = function () {
          active = active && active.id === c.id ? null : c;
          paintDots();
          paintList();
        };
        list.appendChild(row);
        total += c.n;
      });
      var sum = el("div", "case-sum");
      sum.appendChild(biInline(step === 1 ? "4 個 case 合共：" : "2 個唔合法 case 合共：",
        step === 1 ? "All 4 cases:" : "Both failing cases:"));
      sum.appendChild(el("span", "eq", String(total)));
      list.appendChild(sum);
    }
    function paint() {
      paintDots();
      paintList();
    }
    function setStep(n) {
      step = Math.max(0, Math.min(COMP_STEPS, n | 0));
      active = null;
      root.setAttribute("data-step", String(step));
      stepTag.innerHTML = "";
      stepTag.appendChild(biInline("第 " + (step + 1) + " / " + (COMP_STEPS + 1) + " 步",
        "Step " + (step + 1) + " / " + (COMP_STEPS + 1)));
      guideTxt.innerHTML = "";
      guideTxt.appendChild(bi(GUIDES[step][0], GUIDES[step][1]));
      prev.disabled = step === 0;
      next.disabled = step === COMP_STEPS;
      paint();
    }
    prev.onclick = function () { setStep(step - 1); };
    next.onclick = function () { setStep(step + 1); };
    replay.onclick = function () { setStep(0); };

    host.appendChild(root);
    setStep(o.step || 0);
    return root;
  }

  global.S5A_DEMO = {
    types: {
      "tie-up": tieUp, "slot-in": slotIn, grouping: grouping,
      combination: combination, path: pathDemo, complement: complement
    },
    tieUp: tieUp,
    slotIn: slotIn,
    grouping: grouping,
    combination: combination,
    path: pathDemo,
    complement: complement,
    tieUp: tieUp,
    slotIn: slotIn,
    grouping: grouping,
    langBar: langBar,
    setLang: setLang
  };
})(window);
