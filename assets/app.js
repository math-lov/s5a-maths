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
    missToast: { zh: "差一點 —— 看看下面「為甚麼會選錯」", en: "Close — see why the other options are wrong below" }
  };

  /* ── 儲存 ───────────────────────────────────────────────────────────── */
  function loadStore() {
    try {
      var s = JSON.parse(localStorage.getItem(PROG_KEY)) || {};
      s.done = s.done || {};      // { qid: true }
      s.picked = s.picked || {};  // { qid: "A" | "B" | ... }
      return s;
    } catch (e) {
      return { done: {}, picked: {} };
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
      var pages = buildPages(part);
      var cur = Math.min(pageFromUrl(), pages.length - 1);

      var nameEl = qs("#quiz-name");
      if (nameEl) nameEl.textContent = (part.title && part.title.zh) || part.id;
      var enEl = qs("#quiz-en");
      if (enEl) enEl.textContent = (part.title && part.title.en) || "";
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
    head.appendChild(el("span", "q-code", "總覽"));
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

    // MC 選項（可按，即時對答案；題解一樣照顯示）
    if (q.type === "mc") {
      var opts = el("div", "opts");
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
        b.onclick = function () { pickOption(q, L, opts); };
        opts.appendChild(b);
      });
      card.appendChild(opts);
      var prevPick = store.picked[q.id];
      if (prevPick) lockOptions(q, prevPick, opts);
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

  function solutionCard(q) {
    var card = el("div", "card sol-card");
    var head = el("div", "sol-head");
    var h2 = el("h2");
    h2.appendChild(pairSpan(UI.solution));
    head.appendChild(h2);
    var sp = el("span", "small muted");
    sp.textContent = q.code + " · " + (q.marks || 0) + " marks";
    head.appendChild(sp);
    card.appendChild(head);
    card.appendChild(answerBox(q));

    var sol = q.solution || {};
    var stepsHost = el("div", "steps");
    var lastPart = null;
    (sol.steps || []).forEach(function (st) {
      var box = el("div", "step");
      var h = el("h4");
      if (st.part && st.part !== lastPart) {
        h.appendChild(el("span", "part-chip", st.part));
        lastPart = st.part;
      }
      var titleBox = el("span");
      titleBox.appendChild(pairSpan(st.title || {}));
      h.appendChild(titleBox);
      box.appendChild(h);
      if (st.math) {
        var f = el("div", "formula");
        formulaBlock(f, st.math, true);
        box.appendChild(f);
      }
      box.appendChild(pair({ zh: st.zh, en: st.en }, "div", "why bi"));
      if (st.marking) box.appendChild(el("span", "marking", st.marking));
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

    (sol.figures || []).forEach(function (fid) {
      var f = figureNode(fid);
      if (f) card.appendChild(f);
    });

    if ((sol.traps || []).length) {
      var isMc = q.type === "mc";
      var th = el("div", "trap-head");
      th.appendChild(pairSpan(isMc ? UI.whyWrong : UI.commonErr));
      card.appendChild(th);
      var traps = el("div", "traps");
      (sol.traps || []).forEach(function (tr) {
        var t = el("div", "trap");
        var tag = isMc ? ("選 " + tr.opt + " 的話：") : ((tr.label || "") + "：");
        if (tr.label || tr.opt) t.appendChild(el("b", null, tag));
        t.appendChild(rich(tr.zh || ""));
        traps.appendChild(t);
      });
      card.appendChild(traps);
    }

    if (sol.tip && (sol.tip.zh || sol.tip.en)) {
      var tip = el("div", "tip");
      var tb = el("b");
      tb.appendChild(pairSpan(UI.tip));
      tip.appendChild(tb);
      tip.appendChild(pair(sol.tip, "div", "bi"));
      card.appendChild(tip);
    }
    return card;
  }

  function renderQuestion(body, p, pages, cur, id, part) {
    var q = p.q;
    var qc = questionCard(q);
    qc.appendChild(pair(UI.hint, "div", "sol-hint bi"));
    body.appendChild(qc);
    body.appendChild(solutionCard(q));

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
