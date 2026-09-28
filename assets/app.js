/* ==========================================================================
   5A 數學溫習站 · 前端
   純靜態、無框架、無 build step。兩種頁面共用這一支檔案：
     body[data-page="index"]  首頁（測驗／課題按鈕牆）
     body[data-page="quiz"]   測驗檢討頁（每題一頁：題目 + 題解）

   數學渲染沿用「自學追上站」（DSEPass）已驗證的兩路機制：
     data-tex        → katex.render（整串 LaTeX）
     data-tex-inline → renderMathInElement（文字中的 $...$）
   語言：body[data-lang] = zh | en | both，由 CSS 決定顯示哪一份文字。
   進度：localStorage（s5a-progress:v1），只存在學生自己的瀏覽器。
   ========================================================================== */
(function () {
  "use strict";

  var LANG_KEY = "s5a-lang";
  var PROG_KEY = "s5a-progress:v1";
  var SOL_KEY = "s5a-sol";
  var INDEX = window.S5A_INDEX || { site: { parts: [] }, parts: [] };
  var FIGS = window.S5A_FIGURES || {};
  var PART = null;
  var PAGE = document.body.getAttribute("data-page") || "index";
  var LANGS = ["zh", "en", "both"];

  /* 介面文字（跟 body[data-lang] 一起切換） */
  var UI = {
    solHide: { zh: "收起題解", en: "Hide solutions" },
    solShow: { zh: "顯示題解", en: "Show solutions" },
    backHome: { zh: "← 主目錄", en: "← Home" },
    overview: { zh: "總覽", en: "Overview" },
    prev: { zh: "← 上一題", en: "← Previous" },
    next: { zh: "下一題 →", en: "Next →" },
    backOverview: { zh: "回總覽", en: "Overview" },
    mark: { zh: "標記為已掌握", en: "Mark as mastered" },
    marked: { zh: "已掌握 ✓", en: "Mastered ✓" },
    secA: { zh: "甲部", en: "Sec A" },
    secB: { zh: "乙部", en: "Sec B" },
    qList: { zh: "題目一覽", en: "Question list" },
    answer: { zh: "答案", en: "Answer" },
    solution: { zh: "題解", en: "Solution" },
    whyWrong: { zh: "為甚麼會選錯？（看看偏差出在哪一步）", en: "Why the other options are wrong — see where the slip is" },
    commonErr: { zh: "常見錯誤（做完之後，檢查自己有沒有踩中）", en: "Common mistakes — check these after finishing" },
    tip: { zh: "帶得走的技巧：", en: "Take-away tip: " },
    bonus: { zh: "加分題", en: "Bonus" },
    hint: {
      zh: "題解已收起 —— 先自己在紙上做一次，做完再按右上角「顯示題解」對答案。",
      en: "Solutions are hidden — try it on paper first, then press 'Show solutions' at the top right to check."
    },
    usage: {
      zh: "每題一頁 —— 先自己動手做一次（可以按選項即時對答案），再向下看逐步題解。想先做完整份卷的話，按右上角「收起題解」。",
      en: "One question per page — try it yourself first (click an option to check instantly), then read the worked steps below. To attempt the whole paper first, press 'Hide solutions' at the top right."
    },
    usageLabel: { zh: "用法：", en: "How to use: " },
    resetAsk: {
      zh: "要清除這部裝置上的「已掌握」記錄嗎？",
      en: "Clear the 'mastered' records on this device?"
    },
    okToast: { zh: "答對了 ✓", en: "Correct ✓" },
    missToast: { zh: "差一點 —— 看看下面「為甚麼會選錯」", en: "Close — see why the other options are wrong below" },
    /* 後進生鷹架：乘／除以負數要轉向的高亮標籤 */
    flipNote: {
      zh: "【注意】兩邊乘以／除以負數，不等號必須轉向",
      en: "Note: reverse the inequality sign when multiplying or dividing by a negative number"
    },
    /* 評分代號圖例（DSE marking scheme codes） */
    markLegend: {
      zh: "步驟分圖例：(1M)＝方法分（Method mark）；(1A)＝答案分（Accuracy mark）",
      en: "Marking codes: (1M) = method mark; (1A) = accuracy (answer) mark"
    },
    /* 「一鍵複製 LLM 提問 Prompt」介面文字 */
    copyPrompt: { zh: "複製提問 Prompt（整題）", en: "Copy prompt (whole question)" },
    askStep: { zh: "問 AI", en: "Ask AI" },
    pmTitle: {
      zh: "複製提問 Prompt —— 可貼到任何 AI 再追問",
      en: "Copy a prompt — paste it into any AI and keep asking"
    },
    pmDoubt: { zh: "我唔明白的地方（可留空，越具體越好）", en: "What I don't understand (optional — be specific)" },
    pmCopy: { zh: "複製", en: "Copy" },
    pmClose: { zh: "關閉", en: "Close" },
    pmCopied: { zh: "已複製 —— 可以貼去 AI 再問", en: "Copied — paste it into your AI" },
    pmCopyFail: { zh: "複製失敗，請手動選取下面的文字複製", en: "Copy failed — please select the text below and copy manually" },
    /* P1：Khan Academy 式「檢查答案」與回饋 */
    check: { zh: "檢查答案", en: "Check answer" },
    fbCorrect: { zh: "正確！", en: "Correct!" },
    fbCorrectSub: {
      zh: "做得好 —— 向下睇題解，確認自己每一步都真係明。",
      en: "Nice work — read the steps below and check that you really understand each one."
    },
    fbWrong: { zh: "唔係這一個", en: "Not quite" },
    fbRetrySub: {
      zh: "再試一次 —— 先睇清楚題目問甚麼，再選過。",
      en: "Try again — re-read what the question asks, then choose another option."
    },
    fbRevealSub: {
      zh: "正確答案已標成綠色，請向下睇題解，找出偏差喺邊一步。",
      en: "The correct answer is highlighted in green — read the steps below to see where you went wrong."
    },
    /* P1：逐步提示（hint）模式 */
    showAllSol: { zh: "顯示全部題解", en: "Show all steps" },
    hintsDone: { zh: "提示已全部顯示 —— 再按一次可睇埋陷阱與技巧。", en: "All hints shown — press again to see the traps and tips too." },
    pmHint: {
      zh: "先寫下你卡住的地方，勾選想要的選項，再按「複製」。下面的內容可以直接修改。",
      en: "Write where you are stuck, tick the options you want, then press Copy. You can edit the text below directly."
    }
  };

  /* ── 儲存 ───────────────────────────────────────────────────────────── */
  function loadStore() {
    try {
      var s = JSON.parse(localStorage.getItem(PROG_KEY)) || {};
      s.done = s.done || {};      // { qid: true }
      s.picked = s.picked || {};  // { qid: "A" | "B" | ... }
      s.hints = s.hints || {};    // { qid: 已顯示的提示步數 }
      return s;
    } catch (e) {
      return { done: {}, picked: {}, hints: {} };
    }
  }
  var store = loadStore();
  function saveStore() {
    try { localStorage.setItem(PROG_KEY, JSON.stringify(store)); } catch (e) {}
  }

  /* ── 語言 ───────────────────────────────────────────────────────────── */
  function getLang() {
    var v = null;
    try { v = localStorage.getItem(LANG_KEY); } catch (e) {}
    return LANGS.indexOf(v) >= 0 ? v : "both";
  }
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    applyLang();
  }
  function applyLang() {
    var l = getLang();
    document.body.setAttribute("data-lang", l);
    qsa(".langbar button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === l);
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false");
    });
  }
  function langBar() {
    var bar = el("div", "langbar");
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "語言 / Language");
    [["zh", "中文"], ["en", "EN"], ["both", "中英"]].forEach(function (p) {
      var b = el("button", null, p[1]);
      b.setAttribute("data-lang", p[0]);
      b.onclick = function () { setLang(p[0]); };
      bar.appendChild(b);
    });
    return bar;
  }

  /* ── 題解顯示／隱藏 ─────────────────────────────────────────────────── */
  function solHidden() {
    var v = null;
    try { v = localStorage.getItem(SOL_KEY); } catch (e) {}
    return v === "hide";
  }
  function setSolHidden(h) {
    try { localStorage.setItem(SOL_KEY, h ? "hide" : "show"); } catch (e) {}
    document.body.setAttribute("data-sol", h ? "hide" : "show");
    qsa("[data-sol-toggle]").forEach(function (b) {
      setPair(b, h ? UI.solShow : UI.solHide);
    });
    if (refreshCurrent) refreshCurrent();   // 重畫，讓「逐步提示」與全部步驟同步
  }
  /* 把一個 {zh, en} 物件寫進節點（兩份都寫入，由 CSS 決定顯示哪份） */
  function setPair(node, obj) {
    node.innerHTML = "";
    node.appendChild(pairSpan(obj));
    return node;
  }

  /* ── DOM 小工具 ─────────────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function go(url) {
    window.__S5A_LAST_NAV = url;
    try { location.href = url; } catch (e) {}
  }
  function toast(msg) {
    var t = qs("#toast");
    if (!t) { t = el("div", "toast"); t.id = "toast"; document.body.appendChild(t); }
    if (msg && typeof msg === "object") { t.innerHTML = ""; t.appendChild(pairSpan(msg)); }
    else t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t.__timer);
    t.__timer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }
  function scrollToTopOf(node) {
    if (!node || typeof window.scrollTo !== "function") return;
    var bar = qs(".topbar");
    var off = (bar ? bar.getBoundingClientRect().height : 0) + 12;
    var y = node.getBoundingClientRect().top + (window.pageYOffset || 0) - off;
    try { window.scrollTo(0, Math.max(0, y)); } catch (e) {}
  }

  /* ── 數學渲染（沿用每日三題站的兩路機制）────────────────────────────── */
  function tex(node, src, display) {
    if (!src) { node.textContent = "—"; return; }
    node.setAttribute("data-tex", src);
    node.setAttribute("data-display", display ? "1" : "0");
    if (window.katex) {
      try {
        katex.render(src, node, { displayMode: !!display, throwOnError: false, strict: false });
        return;
      } catch (e) { /* 退回純文字 */ }
    }
    node.textContent = src;
  }
  /* 長公式放唔落：math 字串內用 \n 斷行 → 每行一個 .formula-line */
  function formulaBlock(host, src, display) {
    var lines = String(src == null ? "" : src).split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; });
    if (lines.length <= 1) { tex(host, src, display); return; }
    host.classList.add("formula-multi");
    lines.forEach(function (ln) {
      var row = el("div", "formula-line");
      tex(row, ln, display);
      host.appendChild(row);
    });
  }
  function autoRender(node) {
    if (!window.renderMathInElement || !node) return;
    try {
      renderMathInElement(node, {
        delimiters: [{ left: "$", right: "$", display: false }],
        ignoredClasses: ["cur"],
        throwOnError: false, strict: false
      });
    } catch (e) {}
  }
  function rerenderAll() {
    if (!window.katex) return false;
    qsa("[data-tex]").forEach(function (n) {
      try {
        katex.render(n.getAttribute("data-tex"), n, {
          displayMode: n.getAttribute("data-display") === "1",
          throwOnError: false, strict: false
        });
      } catch (e) {}
    });
    qsa("[data-tex-inline]").forEach(autoRender);
    return true;
  }
  var CURRENCY_RE = /\\\$/g;
  function htmlWithCurrency(escapedHtml) {
    return escapedHtml.replace(CURRENCY_RE, '<span class="cur">$</span>');
  }
  function richInto(node, s) {
    node.setAttribute("data-tex-inline", "1");
    node.innerHTML = htmlWithCurrency(esc(s)).replace(/\n/g, "<br>");
    return node;
  }
  function rich(s) {
    var d = el("div");
    richInto(d, s || "");
    autoRender(d);
    return d;
  }
  function isProse(s) {
    if (s.indexOf("$") >= 0 || s.indexOf("\\") >= 0) return false;
    return /(^|[^A-Za-z])[A-Za-z]{2,}\s+[A-Za-z]{2,}(?![A-Za-z])/.test(s);
  }
  function mathInto(node, s) {
    if (!s) { node.textContent = "—"; return; }
    if (s.indexOf("$") >= 0 || isProse(s)) { richInto(node, s); autoRender(node); }
    else tex(node, s, false);
  }
  /* 中英雙語文字：兩份都寫入 DOM，由 body[data-lang] 決定顯示哪一份 */
  function pair(obj, tag, cls) {
    var box = el(tag || "div", cls || "bi");
    var zh = el("div", "l-zh");
    var en = el("div", "l-en");
    box.appendChild(richInto(zh, (obj && obj.zh) || ""));
    box.appendChild(richInto(en, (obj && obj.en) || ""));
    autoRender(box);
    return box;
  }
  function pairSpan(obj) {
    var box = el("span", "bi");
    var zh = el("span", "l-zh");
    var en = el("span", "l-en");
    box.appendChild(richInto(zh, (obj && obj.zh) || ""));
    box.appendChild(richInto(en, (obj && obj.en) || ""));
    autoRender(box);
    return box;
  }

  /* ── 圖 ─────────────────────────────────────────────────────────────── */
  function figureNode(fid) {
    var f = FIGS[fid];
    if (!f || !f.svg) return null;
    var box = el("div", "fig" + (f.wide ? " fig-wide" : ""));
    box.innerHTML = f.svg;
    var wrap = el("div");
    wrap.appendChild(box);
    if (f.caption && (f.caption.zh || f.caption.en)) {
      wrap.appendChild(pair(f.caption, "div", "fig-cap bi"));
    }
    return wrap;
  }

  /* ── 首頁 ───────────────────────────────────────────────────────────── */
  function partProgress(part) {
    var total = (part.stats && part.stats.questions) || 0;
    if (!total) return 0;
    var done = 0;
    (part.qids || []).forEach(function (qid) { if (store.done[qid]) done++; });
    return Math.min(100, Math.round(done / total * 100));
  }
  function renderIndex() {
    var host = qs("#parts");
    if (!host) return;
    var bar = qs("#lang-slot");
    if (bar) bar.appendChild(langBar());

    (INDEX.parts || []).forEach(function (part) {
      var pct = partProgress(part);
      var btn = el("button", "part-btn" + (pct >= 100 ? " done" : ""));
      var ring = el("div", "ring" + (pct >= 100 ? " full" : ""));
      ring.style.setProperty("--p", pct);
      ring.setAttribute("data-label", pct + "%");
      btn.appendChild(ring);

      var body = el("div", "t-body");
      var nm = el("div", "t-name", (part.title && part.title.zh) || part.id);
      body.appendChild(nm);
      var en = el("span", "t-en", (part.title && part.title.en) || "");
      nm.appendChild(en);
      var meta = el("div", "t-meta");
      var s = part.stats || {};
      setPair(meta, {
        zh: (part.meta && part.meta.paper ? part.meta.paper + " · " : "") +
          (s.questions || 0) + " 題 · " + (s.marks || 0) + " 分" +
          (s.bonus ? "（另加 " + s.bonus + " 分加分題）" : "") + " · 已掌握 " + pct + "%",
        en: (part.meta && part.meta.paper ? part.meta.paper + " · " : "") +
          (s.questions || 0) + " questions · " + (s.marks || 0) + " marks" +
          (s.bonus ? " (+" + s.bonus + " bonus)" : "") + " · " + pct + "% mastered"
      });
      body.appendChild(meta);
      btn.appendChild(body);
      btn.onclick = function () { go("quiz.html?c=" + encodeURIComponent(part.id)); };
      host.appendChild(btn);
    });

    var site = INDEX.site || {};
    var n = qs("#site-stats");
    if (n) {
      var tq = 0, tm = 0;
      (INDEX.parts || []).forEach(function (p) {
        tq += (p.stats && p.stats.questions) || 0;
        tm += (p.stats && p.stats.marks) || 0;
      });
      setPair(n, {
        zh: "共 " + (INDEX.parts || []).length + " 份測驗 · " + tq + " 題 · " + tm + " 分",
        en: (INDEX.parts || []).length + " quiz review(s) · " + tq + " questions · " + tm + " marks"
      });
    }
    var note = qs("#coming-soon");
    if (note && site.comingSoon) richInto(note, site.comingSoon.zh), autoRender(note);
    var cn = qs("#coming-soon-en");
    if (cn && site.comingSoon) richInto(cn, site.comingSoon.en), autoRender(cn);

    var rb = qs("#reset");
    if (rb) rb.onclick = function () {
      var ask = getLang() === "en" ? UI.resetAsk.en : UI.resetAsk.zh;
      if (!confirm(ask)) return;
      store = { done: {}, picked: {} };
      saveStore();
      location.reload();
    };
  }

  /* ── 測驗頁 ─────────────────────────────────────────────────────────── */
  function partFromUrl() {
    var p = new URLSearchParams(location.search);
    var id = (p.get("c") || ((INDEX.parts || [])[0] || {}).id || "").toLowerCase();
    return id;
  }
  function pageFromUrl() {
    var p = new URLSearchParams(location.search);
    var n = parseInt(p.get("p") || "0", 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }
  function metaOf(id) {
    var out = null;
    (INDEX.parts || []).forEach(function (p) { if (p.id === id) out = p; });
    return out;
  }
  function loadPartScript(meta, cb) {
    var g = meta && meta.globalName;
    if (g && window[g]) { cb(window[g]); return; }
    var s = document.createElement("script");
    s.src = (meta && meta.dataFile) || ("data/" + partFromUrl() + ".js");
    s.onload = function () { cb(g ? window[g] : null); };
    s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  }

  function buildPages(part) {
    var pages = [{ kind: "overview" }];
    (part.sections || []).forEach(function (sec) {
      (sec.questions || []).forEach(function (q) {
        pages.push({ kind: "q", q: q, sec: sec });
      });
    });
    return pages;
  }

  function renderQuiz() {
    var id = partFromUrl();
    var meta = metaOf(id);
    if (!meta) {
      qs("#quiz-body").appendChild(el("div", "empty", "找不到這份測驗（" + id + "）"));
      return;
    }
    loadPartScript(meta, function (part) {
      if (!part) {
        qs("#quiz-body").appendChild(el("div", "empty", "載入資料時出錯：" + id));
        return;
      }
      PART = part;
      META = meta;
      var pages = buildPages(part);
      var cur = Math.min(pageFromUrl(), pages.length - 1);

      var nameEl = qs("#quiz-name");
      if (nameEl && part.title) setPair(nameEl, part.title);
      var enEl = qs("#quiz-en");
      if (enEl) enEl.textContent = "";
      document.title = ((part.title && part.title.zh) || part.id) + " · 5A 數學溫習站";

      var bar = qs("#lang-slot");
      if (bar) bar.appendChild(langBar());
      var tgl = qs("#sol-toggle");
      if (tgl) {
        tgl.setAttribute("data-sol-toggle", "1");
        tgl.onclick = function () { setSolHidden(!solHidden()); };
      }
      setSolHidden(solHidden());

      // 分頁列
      var nav = qs("#pagenav");
      nav.innerHTML = "";
      pages.forEach(function (p, i) {
        if (p.kind === "q" && (i === 1 || pages[i - 1].sec !== p.sec)) {
          var secSpan = el("span", "pg-sec");
          secSpan.appendChild(pairSpan(p.sec.id === "A" ? UI.secA : UI.secB));
          nav.appendChild(secSpan);
        }
        var b = el("button", "pg" + (i === cur ? " current" : "") +
          (p.kind === "q" && store.done[p.q.id] ? " done" : ""));
        if (p.kind === "overview") b.appendChild(pairSpan(UI.overview));
        else b.textContent = p.q.code;
        b.title = p.kind === "overview" ? "測驗資料與用法"
          : ((p.q.stem && p.q.stem.en) || "").replace(/\$[^$]*\$/g, "").slice(0, 40);
        b.dataset.page = String(i);
        b.onclick = function () { gotoPage(id, i); };
        nav.appendChild(b);
      });

      renderPage(pages, cur, id, part);
      setProgress(qs("#quiz-progress"), part);
      var curBtn = qsa("#pagenav .pg")[cur];
      if (curBtn && typeof curBtn.scrollIntoView === "function") {
        try { curBtn.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {}
      }
      applyLang();
    });
  }

  function gotoPage(id, n) { go("quiz.html?c=" + encodeURIComponent(id) + "&p=" + n); }

  function progressText(part) {
    var total = 0, done = 0;
    (part.sections || []).forEach(function (sec) {
      (sec.questions || []).forEach(function (q) {
        total++;
        if (store.done[q.id]) done++;
      });
    });
    return {
      zh: "已掌握 " + done + " / " + total + " 題",
      en: done + " / " + total + " mastered"
    };
  }
  function setProgress(node, part) {
    if (!node || !part) return;
    setPair(node, progressText(part));
  }

  function renderPage(pages, cur, id, part) {
    var body = qs("#quiz-body");
    body.innerHTML = "";
    var p = pages[cur];
    if (!p) { body.appendChild(el("div", "empty", "這一頁沒有內容")); return; }

    if (p.kind === "overview") renderOverview(body, part, pages, id);
    else renderQuestion(body, p, pages, cur, id, part);

    var stat = qs("#quiz-progress");
    if (stat) stat.textContent = progressText(part);
  }

  function renderOverview(body, part, pages, id) {
    var card = el("div", "card");
    var head = el("div", "q-head");
    var oc = el("span", "q-code");
    oc.appendChild(pairSpan(UI.overview));
    head.appendChild(oc);
    card.appendChild(head);
    if (part.intro) card.appendChild(pair(part.intro, "div", "bi"));
    var meta = part.meta || {};
    var ul = el("div", "small muted");
    ul.style.marginTop = "10px";
    setPair(ul, {
      zh: [meta.paper, meta.date, meta.marks ? "全卷 " + meta.marks + " 分" : ""].filter(Boolean).join(" · "),
      en: [meta.paper, meta.date, meta.marks ? "Total " + meta.marks + " marks" : ""].filter(Boolean).join(" · ")
    });
    card.appendChild(ul);
    var legend = el("div", "mark-legend");
    setPair(legend, UI.markLegend);
    card.appendChild(legend);

    var row = el("div", "row");
    row.style.marginTop = "12px";
    (part.sections || []).forEach(function (sec) {
      var b = el("button", "btn btn-sm btn-ghost");
      b.appendChild(pairSpan({
        zh: (sec.id === "A" ? "甲部" : "乙部") + " · " + (sec.questions || []).length +
          " 題（" + sec.marks + " 分）",
        en: (sec.id === "A" ? "Section A" : "Section B") + " · " + (sec.questions || []).length +
          " questions (" + sec.marks + " marks)"
      }));
      b.onclick = function () {
        var idx = 0;
        pages.forEach(function (pg, i) { if (pg.kind === "q" && pg.sec === sec && !idx) idx = i; });
        gotoPage(id, idx);
      };
      row.appendChild(b);
    });
    card.appendChild(row);
    body.appendChild(card);

    var tip = el("div", "card safety-note");
    var tb = el("b");
    tb.appendChild(pairSpan(UI.usageLabel));
    tip.appendChild(tb);
    tip.appendChild(pair(UI.usage, "div", "bi"));
    body.appendChild(tip);

    var list = el("div", "card");
    var st = el("div", "section-title");
    st.appendChild(pairSpan(UI.qList));
    list.appendChild(st);
    (part.sections || []).forEach(function (sec) {
      var h = el("div", "small muted");
      h.style.marginTop = "8px";
      setPair(h, sec.title || { zh: sec.id, en: sec.id });
      list.appendChild(h);
      var grid = el("div", "row");
      grid.style.marginTop = "6px";
      (sec.questions || []).forEach(function (q, i) {
        var idx = 0;
        pages.forEach(function (pg, j) { if (pg.kind === "q" && pg.q === q) idx = j; });
        var b = el("button", "btn btn-sm" + (store.done[q.id] ? "" : " btn-ghost"),
          q.code + (store.done[q.id] ? " ✓" : ""));
        b.onclick = function () { gotoPage(id, idx); };
        grid.appendChild(b);
      });
      list.appendChild(grid);
    });
    body.appendChild(list);
  }

  function questionCard(q) {
    var card = el("div", "card q-card");
    card.setAttribute("data-qid", q.id);
    var head = el("div", "q-head");
    head.appendChild(el("span", "q-code", q.code));
    if (q.marks) {
      var mk = el("span", "q-marks");
      mk.appendChild(pairSpan({ zh: q.marks + " 分", en: q.marks + " marks" }));
      head.appendChild(mk);
    }
    head.appendChild(el("span", "q-diff",
      "★".repeat(q.difficulty || 1) + "☆".repeat(3 - (q.difficulty || 1))));
    if (q.bonus) {
      var bn = el("span", "q-bonus");
      bn.appendChild(pairSpan(UI.bonus));
      head.appendChild(bn);
    }
    card.appendChild(head);

    // 題目字眼（讀題提示）
    if ((q.keywords || []).length) {
      var kw = el("div", "kw");
      (q.keywords || []).forEach(function (k) {
        var c = el("span", "k");
        var b = el("b");
        richInto(b, k.en || "");
        c.appendChild(b);
        var z = el("span", "l-zh");
        richInto(z, "　" + (k.zh || ""));
        c.appendChild(z);
        kw.appendChild(c);
        autoRender(c);
      });
      card.appendChild(kw);
    }

    var stem = el("div", "q-stem");
    if (q.stem && q.stem.zh) {
      stem.appendChild(pair(q.stem, "div", "bi"));
    } else {
      richInto(stem, (q.stem && q.stem.en) || "");
      autoRender(stem);
    }
    card.appendChild(stem);

    // 題目圖
    (q.figures || []).forEach(function (fid) {
      var f = figureNode(fid);
      if (f) card.appendChild(f);
    });

    // I / II / III
    if ((q.statements || []).length) {
      var box = el("div", "statements");
      q.statements.forEach(function (st) {
        var row = el("div", "st-row");
        row.appendChild(el("span", "st-lab", st.label + "."));
        var v = el("span", "st-val");
        tex(v, st.math, false);
        row.appendChild(v);
        box.appendChild(row);
      });
      card.appendChild(box);
    }

    // 長題分項
    if ((q.parts || []).length && q.type === "long") {
      var ul = el("ul", "q-parts");
      q.parts.forEach(function (pt) {
        var li = el("li");
        li.appendChild(el("span", "lab", pt.label || ""));
        var v;
        if (pt.zh) {
          v = pair(pt, "div", "bi");
        } else {
          v = el("div");
          richInto(v, pt.en || "");
          autoRender(v);
        }
        li.appendChild(v);
        if (pt.marks) {
          var m = el("span", "mk");
          m.appendChild(pairSpan({ zh: "(" + pt.marks + " 分)", en: "(" + pt.marks + " marks)" }));
          li.appendChild(m);
        }
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    /* MC 選項：先選一個 → 按「檢查答案」→ 綠／紅回饋橫幅（KA 式）
       題解仍然同頁顯示（學生亦可以先睇題解，兩者不衝突） */
    if (q.type === "mc") {
      var opts = el("div", "opts");
      var state = { picked: null, locked: false, tries: 0 };
      ["A", "B", "C", "D"].forEach(function (L) {
        var b = el("button", "opt");
        b.dataset.opt = L;
        b.appendChild(el("span", "letter", L));
        var v = el("span", "val");
        var val = (q.options || {})[L];
        if (val && typeof val === "object") {
          var vz = el("div", "l-zh");
          mathInto(vz, val.zh || val.en || "");
          var ve = el("div", "l-en");
          mathInto(ve, val.en || "");
          v.appendChild(vz);
          v.appendChild(ve);
        } else {
          mathInto(v, val);
        }
        b.appendChild(v);
        b.onclick = function () {
          if (state.locked) return;
          state.picked = L;
          markPicked();
          btnCheck.disabled = false;
        };
        opts.appendChild(b);
      });
      card.appendChild(opts);

      var checkRow = el("div", "check-row");
      var btnCheck = el("button", "btn btn-primary");
      btnCheck.setAttribute("data-check", "1");
      setPair(btnCheck, UI.check);
      btnCheck.disabled = true;
      var fbHost = el("div");
      checkRow.appendChild(btnCheck);
      checkRow.appendChild(fbHost);
      card.appendChild(checkRow);

      function markPicked() {
        qsa(".opt", opts).forEach(function (b) {
          b.classList.toggle("picked", b.dataset.opt === state.picked);
        });
      }
      function lockAll(ans) {
        state.locked = true;
        qsa(".opt", opts).forEach(function (b) {
          b.disabled = true;
          b.classList.remove("picked");
          if (b.dataset.opt === ans) b.classList.add("correct");
        });
        btnCheck.disabled = true;
      }
      function showFeedback(ok, revealed) {
        fbHost.innerHTML = "";
        var box = el("div", "feedback " + (ok ? "ok" : "bad"));
        box.setAttribute("data-feedback", ok ? "ok" : "bad");
        box.appendChild(el("span", "fb-icon", ok ? "✅" : "✖"));
        var txt = el("div");
        var main = el("div");
        main.appendChild(pairSpan(ok ? UI.fbCorrect : UI.fbWrong));
        var sub = el("span", "fb-sub");
        sub.appendChild(pairSpan(ok ? UI.fbCorrectSub : (revealed ? UI.fbRevealSub : UI.fbRetrySub)));
        txt.appendChild(main);
        txt.appendChild(sub);
        box.appendChild(txt);
        fbHost.appendChild(box);
      }
      btnCheck.onclick = function () {
        if (!state.picked || state.locked) return;
        var correct = state.picked === q.answer;
        state.tries++;
        store.picked[q.id] = state.picked;
        if (correct) {
          store.done[q.id] = true;
          saveStore();
          lockAll(q.answer);
          showFeedback(true);
          var curBtn = qs("#pagenav .pg.current");
          if (curBtn) curBtn.classList.add("done");
          setProgress(qs("#quiz-progress"), PART);
        } else {
          delete store.done[q.id];
          saveStore();
          qsa(".opt", opts).forEach(function (b) {
            if (b.dataset.opt === state.picked) b.classList.add("wrong");
          });
          if (state.tries >= 2) {
            lockAll(q.answer);
            showFeedback(false, true);
          } else {
            state.picked = null;
            markPicked();
            btnCheck.disabled = true;
            showFeedback(false, false);
          }
        }
      };
      /* 之前答對過 → 回到這一題時直接顯示正確答案 */
      if (store.done[q.id]) {
        lockAll(q.answer);
        btnCheck.disabled = true;
      }
    }
    return card;
  }

  function lockOptions(q, picked, opts) {
    qsa(".opt", opts).forEach(function (b) {
      b.disabled = true;
      if (b.dataset.opt === q.answer) b.classList.add("correct");
      else if (b.dataset.opt === picked) b.classList.add("wrong");
    });
  }
  function pickOption(q, L, opts) {
    var correct = L === q.answer;
    store.picked[q.id] = L;
    if (correct) store.done[q.id] = true;
    saveStore();
    lockOptions(q, L, opts);
    if (correct) {
      toast(UI.okToast);
      var curBtn = qs("#pagenav .pg.current");
      if (curBtn) curBtn.classList.add("done");
    } else {
      toast(UI.missToast);
    }
    var stat = qs("#quiz-progress");
    setProgress(stat, PART);
  }

  function answerBox(q) {
    var box = el("div", "answer-box");
    var ah = el("span", "ah");
    ah.appendChild(pairSpan(UI.answer));
    box.appendChild(ah);
    (q.answers || []).forEach(function (a) {
      var row = el("div", "a-row");
      if (a.part) row.appendChild(el("span", "a-part", a.part));
      if (q.type === "mc") {
        var t = el("span");
        t.style.fontWeight = "700";
        t.textContent = q.answer + ".";
        row.appendChild(t);
      }
      var m = el("span");
      tex(m, a.math, false);
      row.appendChild(m);
      if (a.note && (a.note.zh || a.note.en)) row.appendChild(pairSpan(a.note));
      box.appendChild(row);
    });
    return box;
  }

  function solutionCard(q, sec, refresh) {
    var card = el("div", "card sol-card");
    var head = el("div", "sol-head");
    var h2 = el("h2");
    h2.appendChild(pairSpan(UI.solution));
    head.appendChild(h2);
    var sp = el("span", "small muted");
    sp.appendChild(pairSpan({
      zh: q.code + " · " + (q.marks || 0) + " 分",
      en: q.code + " · " + (q.marks || 0) + " marks"
    }));
    head.appendChild(sp);
    card.appendChild(head);
    card.appendChild(answerBox(q));

    var sol = q.solution || {};
    /* 收起題解時：逐步要提示（KA hint 模式），只顯示已揭曉的步驟 */
    var all = sol.steps || [];
    var total = all.length;
    var shown = solHidden() ? Math.min(store.hints[q.id] || 0, total) : total;
    var stepsHost = el("div", "steps sol-body");
    var lastPart = null;
    all.slice(0, shown).forEach(function (st, i) {
      var box = el("div", "step");
      var h = el("h4");
      if (st.part && st.part !== lastPart) {
        h.appendChild(el("span", "part-chip", st.part));
        lastPart = st.part;
      }
      var titleBox = el("span");
      titleBox.appendChild(pairSpan(st.title || {}));
      h.appendChild(titleBox);
      /* 每個步驟旁的小按鈕：只聚焦這一步（prompt 即時生成，不額外維護） */
      if (llmOn()) {
        var sb = el("button", "pm-step");
        sb.setAttribute("data-pm-step", String(i));
        sb.appendChild(pairSpan(UI.askStep));
        sb.onclick = function () { openPrompt({ q: q, sec: sec, step: st, index: i }); };
        h.appendChild(sb);
      }
      box.appendChild(h);
      if (st.math) {
        var f = el("div", "formula");
        formulaBlock(f, st.math, true);
        box.appendChild(f);
      }
      box.appendChild(pair({ zh: st.zh, en: st.en }, "div", "why bi"));
      if (st.marking) box.appendChild(el("span", "marking", st.marking));
      /* 變號步驟：加一個雙語高亮標籤（後進生最容易失分的地方） */
      if (st.flip) {
        var fn = el("div", "flip-note");
        fn.appendChild(pairSpan(UI.flipNote));
        box.appendChild(fn);
      }
      (st.highlight || []).forEach(function (hv) {
        var hl = el("div", "hl");
        tex(hl, hv, false);
        box.appendChild(hl);
      });
      if (st.figure) {
        var fg = figureNode(st.figure);
        if (fg) box.appendChild(fg);
      }
      stepsHost.appendChild(box);
    });
    card.appendChild(stepsHost);

    /* 圖／陷阱／技巧：收起題解時一併收起（提示揭曉完才出現） */
    var extra = el("div", "sol-extra");
    card.appendChild(extra);

    (sol.figures || []).forEach(function (fid) {
      var f = figureNode(fid);
      if (f) extra.appendChild(f);
    });

    if ((sol.traps || []).length) {
      var isMc = q.type === "mc";
      var th = el("div", "trap-head");
      th.appendChild(pairSpan(isMc ? UI.whyWrong : UI.commonErr));
      extra.appendChild(th);
      var traps = el("div", "traps");
      (sol.traps || []).forEach(function (tr) {
        var t = el("div", "trap");
        if (isMc && tr.opt) {
          var bt = el("b");
          bt.appendChild(pairSpan({ zh: "選 " + tr.opt + " 的話：", en: "If you chose " + tr.opt + ": " }));
          t.appendChild(bt);
        } else if (tr.label) {
          var bl = el("b");
          bl.appendChild(pairSpan({ zh: tr.label + "：", en: (tr.labelEn || tr.label) + ": " }));
          t.appendChild(bl);
        }
        t.appendChild(pair({ zh: tr.zh, en: tr.en || tr.zh }, "div", "bi"));
        traps.appendChild(t);
      });
      extra.appendChild(traps);
    }

    if (sol.tip && (sol.tip.zh || sol.tip.en)) {
      var tip = el("div", "tip");
      var tb = el("b");
      tb.appendChild(pairSpan(UI.tip));
      tip.appendChild(tb);
      tip.appendChild(pair(sol.tip, "div", "bi"));
      extra.appendChild(tip);
    }

    /* 收起題解時：逐步提示 + 一次顯示全部 */
    if (solHidden()) {
      var hr = el("div", "hint-row");
      if (shown < total) {
        var hb = el("button", "btn btn-sm btn-primary");
        hb.setAttribute("data-hint", String(shown + 1));
        hb.appendChild(pairSpan({
          zh: "顯示提示（第 " + (shown + 1) + " / " + total + " 步）",
          en: "Show hint (step " + (shown + 1) + " / " + total + ")"
        }));
        hb.onclick = function () {
          store.hints[q.id] = shown + 1;
          saveStore();
          if (refresh) refresh();
        };
        hr.appendChild(hb);
      } else {
        var hc = el("div", "hint-count");
        hc.appendChild(pairSpan(UI.hintsDone));
        hr.appendChild(hc);
      }
      var ab = el("button", "btn btn-sm btn-ghost");
      ab.appendChild(pairSpan(UI.showAllSol));
      ab.onclick = function () {
        setSolHidden(false);
        if (refresh) refresh();
      };
      hr.appendChild(ab);
      card.appendChild(hr);
    }
    return card;
  }

  function renderQuestion(body, p, pages, cur, id, part) {
    var q = p.q;
    var qc = questionCard(q);
    qc.appendChild(pair(UI.hint, "div", "sol-hint bi"));
    /* 每題的主按鈕：涵蓋整題的 prompt */
    if (llmOn()) {
      var pb = el("button", "btn btn-sm btn-prompt");
      pb.setAttribute("data-pm-main", "1");
      pb.appendChild(pairSpan(UI.copyPrompt));
      pb.onclick = function () { openPrompt({ q: q, sec: p.sec }); };
      qc.appendChild(pb);
    }
    function redraw() { renderPage(pages, cur, id, part); }
    refreshCurrent = redraw;
    body.appendChild(qc);
    body.appendChild(solutionCard(q, p.sec, redraw));

    var foot = el("div", "card foot-nav");
    var row = el("div", "row");
    var prev = el("button", "btn btn-sm");
    setPair(prev, UI.prev);
    prev.disabled = cur <= 0;
    prev.onclick = function () { gotoPage(id, cur - 1); };
    var marked = el("button", "btn btn-sm" + (store.done[q.id] ? " btn-primary" : " btn-ghost"));
    setPair(marked, store.done[q.id] ? UI.marked : UI.mark);
    marked.onclick = function () {
      if (store.done[q.id]) delete store.done[q.id];
      else store.done[q.id] = true;
      saveStore();
      marked.className = "btn btn-sm" + (store.done[q.id] ? " btn-primary" : " btn-ghost");
      setPair(marked, store.done[q.id] ? UI.marked : UI.mark);
      var nb = qsa("#pagenav .pg")[cur];
      if (nb) nb.classList.toggle("done", !!store.done[q.id]);
      setProgress(qs("#quiz-progress"), part);
    };
    var next = el("button", "btn btn-sm btn-primary");
    setPair(next, UI.next);
    next.disabled = cur >= pages.length - 1;
    next.onclick = function () { gotoPage(id, cur + 1); };
    row.appendChild(prev);
    row.appendChild(marked);
    row.appendChild(next);
    foot.appendChild(row);
    var row2 = el("div", "row");
    row2.style.marginTop = "8px";
    var home = el("button", "btn btn-sm btn-ghost");
    setPair(home, UI.backOverview);
    home.onclick = function () { gotoPage(id, 0); };
    var idx = el("button", "btn btn-sm btn-ghost");
    setPair(idx, UI.backHome);
    idx.onclick = function () { go("index.html"); };
    row2.appendChild(home);
    row2.appendChild(idx);
    foot.appendChild(row2);
    body.appendChild(foot);

    if (solHidden()) scrollToTopOf(body);
  }

  /* ── 一鍵複製 LLM 提問 Prompt ─────────────────────────────────────────
     設計：所有 prompt 都由「一份模板 + 題目資料」即時生成
     （模板在 data/src/prompt-templates.json，中英各一份，跟隨語言切換）。
     所以步驟增減、文字改動都不需要另外維護 prompt。
       每題 1 個主按鈕（整題）＋ 每個步驟 1 個小按鈕（聚焦該步）
  ──────────────────────────────────────────────────────────────────────── */
  var META = null;                                   // 目前這份測驗的 meta
  var refreshCurrent = null;                         // 重畫目前這一題（提示／顯示題解用）
  var TPLS = (INDEX && INDEX.promptTemplates) || null;
  var PM_OPTS = ["simpler", "examples", "examTips", "visual", "practice"];

  function llmOn() {
    return !!(TPLS && (INDEX.site || {}).llmPrompt !== false);
  }
  function tpl() {
    return TPLS ? TPLS[getLang() === "en" ? "en" : "zh"] : null;
  }
  /* 取值：字串直接用；{zh,en} 物件按語言取 */
  function biText(v, en) {
    if (!v) return "";
    if (typeof v === "object") {
      var s = en ? (v.en || v.zh) : (v.zh || v.en);
      return s || "";
    }
    return v;
  }

  /* 步驟標題本身已含「第 N 步／Step N」，不要再補一次編號 */
  function stepLabel(st, no, en) {
    var ttl = biText(st && st.title, en) || "";
    var hasNo = en ? /^Step\s*\d/i.test(ttl) : /^第\s*\d/.test(ttl);
    if (hasNo) return ttl;
    return (en ? "Step " : "第 ") + no + (en ? "：" : " 步：") + ttl;
  }

  function buildPrompt(o) {
    var t = tpl();
    if (!t) return "";
    var en = getLang() === "en";
    var h = t.headings || {};
    var L = [];
    L.push(t.role);
    L.push("");
    L.push(t.student);
    L.push("");
    // 出處與題號
    var src = [];
    if (META && META.title) src.push(biText(META.title, en));
    if (PART && PART.meta) src.push([PART.meta.paper, PART.meta.date].filter(Boolean).join(en ? ", " : "，"));
    L.push("## " + h.source);
    if (src.length) L.push("- " + src.join(en ? " · " : " · "));
    L.push("- " + h.question + (en ? ": " : "：") + o.q.code +
      (en ? " (" : "（") + biText(o.sec && o.sec.title, en) +
      (en ? ", " : "，") + o.q.marks + (en ? " marks)" : " 分）"));
    L.push("");
    // 題目
    L.push("## " + h.stemEn);
    L.push(biText(o.q.stem && o.q.stem.en, en));
    L.push("");
    L.push("## " + h.stemZh);
    L.push(biText(o.q.stem && o.q.stem.zh, en));
    L.push("");
    // 選項／小題
    var items = [];
    if (o.q.type === "mc") {
      ["A", "B", "C", "D"].forEach(function (k) {
        var v = (o.q.options || {})[k];
        if (v) items.push(k + ". " + biText(v, en));
      });
      items.push((en ? "Given answer: " : "標準答案：") + o.q.answer);
    } else {
      (o.q.parts || []).forEach(function (p) {
        var line = (p.label ? p.label + " " : "") + biText({ zh: p.zh, en: p.en }, en);
        if (p.marks) line += " (" + p.marks + (en ? " marks" : " 分") + ")";
        items.push(line);
      });
    }
    if (items.length) {
      L.push("## " + h.items);
      items.forEach(function (s) { L.push("- " + s); });
      L.push("");
    }
    // 聚焦範圍
    L.push("## " + h.focus);
    if (o.step) {
      L.push(t.focusStep.replace("{n}", String(o.index + 1))
        .replace("{title}", stepLabel(o.step, o.index + 1, en)));
    } else {
      L.push(t.focusAll);
    }
    L.push("");
    // 學生目前的理解（整題＝全部步驟；步驟模式＝只有該步）
    L.push("## " + h.existing);
    var steps = o.step ? [o.step] : ((o.q.solution && o.q.solution.steps) || []);
    steps.forEach(function (st, i) {
      var no = o.step ? (o.index + 1) : (i + 1);
      L.push(stepLabel(st, no, en));
      if (st.math) L.push("$$" + st.math + "$$");
      var body = biText({ zh: st.zh, en: st.en }, en) || biText(st.title, en);
      if (body) L.push(body);
      L.push("");
    });
    // 疑惑點
    L.push("## " + h.doubt);
    var dt = (o.doubt || "").trim();
    L.push(dt || (en
      ? "(Not filled in — please guess the two mistakes I am most likely to make here and explain them.)"
      : "（未填寫 —— 請你估計我喺呢一步最常犯嘅兩個錯誤，並解釋清楚。）"));
    L.push("");
    // 要求（含勾選項）
    L.push("## " + h.requirements);
    (t.requirements || []).forEach(function (s) { L.push("- " + s); });
    (o.opts || []).forEach(function (k) { if (t.options && t.options[k]) L.push("- " + t.options[k]); });
    L.push("");
    // 輸出格式
    L.push("## " + h.format);
    (t.format || []).forEach(function (s) { L.push(s); });
    return L.join("\n");
  }

  function copyText(s) {
    function ok() { toast(UI.pmCopied); }
    function legacy() {
      try {
        var ta = el("textarea");
        ta.value = s;
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        document.body.appendChild(ta);
        ta.select();
        var done = document.execCommand ? document.execCommand("copy") : false;
        document.body.removeChild(ta);
        if (done) ok(); else toast(UI.pmCopyFail);
      } catch (e) {
        toast(UI.pmCopyFail);
      }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(s).then(ok, legacy);
        return;
      }
    } catch (e) { /* 退回手動複製 */ }
    legacy();
  }

  function openPrompt(o) {
    var t = tpl();
    var wrap = el("div", "prompt-modal");
    var box = el("div", "pm-box");
    var chosen = {};
    var doubt, ta;

    var head = el("div", "pm-head");
    var ht = el("h3");
    ht.appendChild(pairSpan(UI.pmTitle));
    head.appendChild(ht);
    var x = el("button", "pm-x", "×");
    x.setAttribute("aria-label", "close");
    x.onclick = close;
    head.appendChild(x);
    box.appendChild(head);

    var hint = el("div", "pm-hint");
    hint.appendChild(pairSpan(UI.pmHint));
    box.appendChild(hint);

    var optsBox = el("div", "pm-opts");
    PM_OPTS.forEach(function (k) {
      var lab = el("label", "pm-opt");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.setAttribute("data-opt", k);
      cb.onchange = function () { chosen[k] = cb.checked; refresh(); };
      var sp = el("span");
      sp.appendChild(pairSpan({ zh: (t.optionLabels || {})[k] || k, en: (t.optionLabels || {})[k] || k }));
      lab.appendChild(cb);
      lab.appendChild(sp);
      optsBox.appendChild(lab);
    });
    box.appendChild(optsBox);

    doubt = el("textarea", "pm-doubt");
    doubt.rows = 2;
    doubt.placeholder = t.doubtPlaceholder || "";
    doubt.oninput = refresh;
    box.appendChild(doubt);

    ta = el("textarea", "pm-preview");
    ta.rows = 12;
    ta.setAttribute("data-pm-preview", "1");
    box.appendChild(ta);

    var acts = el("div", "pm-actions");
    var bc = el("button", "btn btn-primary");
    bc.setAttribute("data-pm-copy", "1");
    bc.appendChild(pairSpan(UI.pmCopy));
    bc.onclick = function () { copyText(ta.value); };
    var bx = el("button", "btn btn-ghost");
    bx.appendChild(pairSpan(UI.pmClose));
    bx.onclick = close;
    acts.appendChild(bc);
    acts.appendChild(bx);
    box.appendChild(acts);

    wrap.appendChild(box);
    document.body.appendChild(wrap);
    wrap.onclick = function (e) { if (e.target === wrap) close(); };

    function refresh() {
      o.opts = Object.keys(chosen).filter(function (k) { return chosen[k]; });
      o.doubt = doubt.value;
      ta.value = buildPrompt(o);
    }
    function close() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
    refresh();
    return wrap;
  }

  /* ── 啟動 ───────────────────────────────────────────────────────────── */
  var started = false;
  function start() {
    if (started) return;
    started = true;
    applyLang();
    if (PAGE === "index") renderIndex();
    else if (PAGE === "quiz") renderQuiz();

    if (!window.katex) {
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (rerenderAll() || tries > 80) clearInterval(timer);
      }, 125);
    } else {
      rerenderAll();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  window.__S5A_START = start;
})();
