/* 5A 數學溫習站 · 學生流程 smoke test（jsdom + 真 KaTeX）
 *
 * 用法：
 *   node tools/smoke_test.js
 * 若 jsdom／katex 不在本機 node_modules，先設 NODE_PATH 指向已有安裝的地方：
 *   $env:NODE_PATH="C:\Code Buddy\DSEPass\node_modules"; node tools/smoke_test.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function need(name) {
  try {
    return require(name);
  } catch (e) {
    const extra = (process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean);
    for (const dir of extra) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return require(p);
    }
    throw e;
  }
}
const { JSDOM } = need("jsdom");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const katexJs = read("vendor/katex/katex.min.js");
const autoRenderJs = read("vendor/katex/auto-render.min.js");
const appJs = read("assets/app.js");
const demosJs = read("assets/demos.js");
const indexJs = read("data/index.js");
const figuresJs = read("data/figures.js");
const dataFiles = fs.readdirSync(path.join(root, "data"))
  .filter((f) => /^[a-z0-9-]+\.js$/.test(f) && f !== "index.js" && f !== "figures.js");

const PROG_KEY = "s5a-progress:v1";
const SOL_KEY = "s5a-sol:v2";
const LEGACY_SOL_KEY = "s5a-sol";
let fails = 0;
const ok = (cond, label) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + label);
  if (!cond) fails++;
};

function boot(page, search, storage, solPreference, legacySolPreference) {
  const html = read(page);
  const dom = new JSDOM(html, {
    url: "https://example.test/" + page + (search || ""),
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const ctx = dom.getInternalVMContext();
  ctx.window.confirm = () => true;
  // 假的剪貼簿（jsdom 沒有 clipboard API）
  try {
    Object.defineProperty(ctx.window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: (t) => { ctx.__clip = t; return Promise.resolve(); } },
    });
  } catch (e) { /* ignore */ }
  const scrolls = [];
  ctx.window.scrollTo = (x, y) => { scrolls.push(y); };
  if (storage) ctx.window.localStorage.setItem(PROG_KEY, storage);
  if (solPreference != null) ctx.window.localStorage.setItem(SOL_KEY, solPreference);
  if (legacySolPreference != null) ctx.window.localStorage.setItem(LEGACY_SOL_KEY, legacySolPreference);
  vm.runInContext(katexJs, ctx, { filename: "katex.min.js" });
  vm.runInContext(autoRenderJs, ctx, { filename: "auto-render.min.js" });
  vm.runInContext(indexJs, ctx, { filename: "index.js" });
  vm.runInContext(figuresJs, ctx, { filename: "figures.js" });
  dataFiles.forEach((f) => vm.runInContext(read("data/" + f), ctx, { filename: f }));
  vm.runInContext(demosJs, ctx, { filename: "demos.js" });   // 互動示範（教學卡用）
  vm.runInContext(appJs, ctx, { filename: "app.js" });
  if (typeof ctx.window.__S5A_START === "function") ctx.window.__S5A_START();
  const doc = dom.window.document;
  return {
    dom, ctx, doc, scrolls,
    $: (s) => doc.querySelector(s),
    $$: (s) => Array.prototype.slice.call(doc.querySelectorAll(s)),
    store: () => JSON.parse(ctx.window.localStorage.getItem(PROG_KEY) || "{}"),
    lang: () => doc.body.getAttribute("data-lang"),
  };
}

const INDEX = JSON.parse(
  indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1)
);

/* ── 1. 首頁 ───────────────────────────────────────────────────────────── */
console.log("\n== 首頁 ==");
const home = boot("index.html", "");
const CW_META = (INDEX.site && INDEX.site.classwork) || {};
const CW_CHAPTERS = CW_META.chapters || [];
const QUIZ_PARTS = INDEX.parts.filter((p) => p.group !== "classwork");
ok(home.$$("#parts .part-btn").length === QUIZ_PARTS.length,
  "首頁「測驗檢討」只列 " + QUIZ_PARTS.length + " 份測驗（實際 " + home.$$("#parts .part-btn").length + "）");
ok(home.$$("#classwork .part-btn").length === CW_CHAPTERS.length,
  "首頁「課本練習」只列 " + CW_CHAPTERS.length + " 個章（實際 " + home.$$("#classwork .part-btn").length + "）");
ok(/第 17 章/.test((home.$("#classwork .part-btn .t-name") || {}).textContent || ""),
  "課本練習的按鈕顯示章名（第 17 章）");
ok(home.$("#site-stats") === null, "首頁不再顯示全站統計（共 N 份測驗… 已刪除）");
ok(!!home.$(".hero h1 .l-zh") && /5A 數學溫習站/.test(home.$(".hero h1 .l-zh").textContent) &&
  /5A Maths Revision/.test(home.$(".hero h1 .l-en").textContent), "主標題：中文「5A 數學溫習站」／英文「5A Maths Revision」");
ok(/先試後明白/.test(home.$(".safety-note").textContent), "安全卡載明「先試後明白」讀法");
ok(!!home.$(".part-btn .ring"), "每份測驗都有進度環");
const qMeta = (home.$(".part-btn .t-meta") || {}).textContent || "";
ok(/11 題/.test(qMeta) && /38 分/.test(qMeta), "顯示題數與分數");
ok(home.$$(".part-btn .mchips .mchip").length >= 3 &&
  /11 題/.test(home.$(".part-btn .mchips .mchip").textContent || ""),
  "題數／分數／掌握度改用細 chip 顯示（實際 " + home.$$(".part-btn .mchip").length + " 粒）");
ok(!!home.$(".safety-note") && /沒有分數/.test(home.$(".safety-note").textContent), "有心理安全卡");
ok(home.$$(".langbar button").length === 3, "語言切換有 3 個選項（中／EN／中英）");
ok(home.lang() === "both", "預設語言是「中英」（雙語並列）");
home.$$(".langbar button")[1].click();
ok(home.lang() === "en", "按 EN 後 body[data-lang] 變成 en");
ok(home.ctx.window.localStorage.getItem("s5a-lang") === "en", "語言選擇寫入 localStorage");
ok(!!home.$("#reset"), "有清除進度按鈕");
ok(!!home.$("#coming-soon").textContent.trim(), "有「之後會加」說明");

/* ── 2. 測驗頁：總覽 ─────────────────────────────────────────────────── */
console.log("\n== 測驗頁（總覽）==");
const total = INDEX.parts[0].stats.questions;   // 11 題
const ov = boot("quiz.html", "?c=ch10-test&p=0");
ok(ov.doc.body.getAttribute("data-sol") === "hide", "首次進入測驗時題解預設收起");
ok(/顯示題解/.test(ov.$("#sol-toggle").textContent), "預設收起時按鈕提示可顯示題解");
ok(/第 10 章/.test((ov.$("#quiz-name") || {}).textContent || ""), "顯示測驗名稱");
ok(ov.$$("#pagenav .pg").length === total + 1,
  "分頁列 = 總覽 + " + total + " 題（實際 " + ov.$$("#pagenav .pg").length + "）");
ok(ov.$$("#pagenav .pg-sec").length === 2, "分頁列有甲部／乙部兩個分隔");
ok(/甲部/.test(ov.$("#pagenav .pg-sec").textContent), "第一個分隔寫「甲部」");
ok(ov.$$("#quiz-body .btn").length >= total, "總覽有跳去各題的按鈕");
ok(!!ov.$("#sol-toggle"), "有收起題解的按鈕");
ok(!!ov.$(".mark-legend") && /method mark/.test(ov.$(".mark-legend").textContent),
  "總覽有評分代號圖例（(1M)/(1A)）");

/* ── 3. 測驗頁：MC 第 1 題 ───────────────────────────────────────────── */
console.log("\n== 測驗頁（A1 多項選擇題）==");
const q1 = boot("quiz.html", "?c=ch10-test&p=1");
ok(q1.doc.body.getAttribute("data-sol") === "hide", "新瀏覽器首次進入 A1 時題解收起");
q1.$("#sol-toggle").click();
ok(q1.doc.body.getAttribute("data-sol") === "show", "按「顯示題解」後題解出現");
ok(q1.ctx.window.localStorage.getItem(SOL_KEY) === "show", "顯示題解的選擇寫入 localStorage");
const q1Reload = boot("quiz.html", "?c=ch10-test&p=1", null,
  q1.ctx.window.localStorage.getItem(SOL_KEY));
ok(q1Reload.doc.body.getAttribute("data-sol") === "show", "重新載入後保留明確選擇的顯示狀態");
const card1 = q1.$('.q-card[data-qid="ch10-A1"]');
ok(!!card1, "渲染出 A1 題目卡");
ok(/A1/.test((q1.$(".q-code") || {}).textContent || ""), "題號顯示 A1");
ok(/2 marks/.test((q1.$(".q-marks") || {}).textContent || ""), "顯示分數 2 marks");
ok(q1.$$(".opt").length === 4, "有 4 個選項");
ok(q1.$$(".opt .katex").length >= 4, "選項經 KaTeX 渲染");
ok(!!q1.$(".fig svg"), "題目圖（數線）已插入");
ok(!!q1.$(".kw .k"), "有「題目字眼」提示");
const stem1 = q1.$(".q-stem");
ok(!!stem1 && !/\$/.test(stem1.textContent) && stem1.textContent.length > 10,
  "題幹文字已渲染（沒有殘留 $）");
ok(!!q1.$(".q-stem .l-zh") && !!q1.$(".q-stem .l-en") &&
   /下圖表示/.test(q1.$(".q-stem .l-zh").textContent) &&
   /graphical representation/.test(q1.$(".q-stem .l-en").textContent),
  "題幹有中英兩份（可一鍵切換）");
ok(!!q1.$(".q-marks .l-zh") && /2 分/.test(q1.$(".q-marks .l-zh").textContent),
  "分數 chip 有中文版");
ok(!!q1.$(".sol-card"), "題解卡與題目同時出現（一併展示）");
ok(/答案/.test((q1.$(".answer-box .ah") || {}).textContent || ""), "有答案欄");
ok(/^B\.$/.test((q1.$(".answer-box .a-row span") || {}).textContent || ""),
  "答案欄顯示 B");
ok(q1.$$(".sol-card .steps .step").length === 3, "A1 有 3 個解題步驟");
ok(q1.$$(".sol-card .trap").length === 3, "A1 列出 3 個陷阱解說");
ok(!!q1.$(".sol-card .tip"), "A1 有「帶得走的技巧」");
ok(q1.$$(".step .why .l-zh").length === 3 && q1.$$(".step .why .l-en").length === 3,
  "每個步驟都有中、英兩份解釋（可切換）");
ok(!!q1.$(".step .marking") === false, "選擇題不顯示步驟分（只長題才有）");

/* 作答：KA 式「選取 → 檢查答案 → 回饋」 */
const q1b = boot("quiz.html", "?c=ch10-test&p=1");
ok(q1b.$("[data-check]").disabled === true, "未選取時「檢查答案」不可按");
q1b.$$(".opt").find((b) => b.dataset.opt === "C").click();
ok(q1b.$$(".opt.picked").length === 1, "選取後該選項標成 picked");
ok(q1b.$("[data-check]").disabled === false, "選取後「檢查答案」可按");
q1b.$("[data-check]").click();
ok(q1b.$$(".opt.wrong").length === 1, "第一次答錯：該選項標成 wrong");
ok(!q1b.$("[data-feedback=ok]"), "第一次答錯不立即揭示答案（先叫學生再試）");
ok(!!q1b.$("[data-feedback=bad]"), "第一次答錯有回饋橫幅");
ok(q1b.store().picked["ch10-A1"] === "C", "作答記錄寫入 localStorage");
ok(!q1b.store().done["ch10-A1"], "答錯不會標記為已掌握");
// 第二次答錯 → 揭示正確答案
q1b.$$(".opt").find((b) => b.dataset.opt === "A").click();
q1b.$("[data-check]").click();
ok(q1b.$$(".opt.correct").length === 1, "第二次答錯後揭示正確答案");

const q1c = boot("quiz.html", "?c=ch10-test&p=1");
q1c.$$(".opt").find((b) => b.dataset.opt === "B").click();
q1c.$("[data-check]").click();
ok(q1c.store().done["ch10-A1"] === true, "答對會標記為已掌握");
ok(!!q1c.$("[data-feedback=ok]"), "答對有綠色正確橫幅");
ok(q1c.$$("#pagenav .pg")[1].classList.contains("done"), "分頁列的 A1 打勾");
ok(!q1c.$(".answer-box").classList.contains("on"),
  "答對後答案欄不會自動揭曉（要自己按「顯示答案」）");
ok(/已掌握 1 \/ 11 題/.test((q1c.$("#quiz-progress") || {}).textContent || ""),
  "進度文字正常（不再是 [object Object]）");

/* 中英並列：語言中立的符號（箭頭／✓）唔可以寫入 {zh, en} 字串，否則會出兩次 */
const countOf = (s, ch) => (s.match(new RegExp(ch, "g")) || []).length;
const footFresh = (boot("quiz.html", "?c=ch10-test&p=1").$(".foot-nav") || {}).textContent || "";
ok(countOf(footFresh, "←") === 2,
  "底欄「←」只出現 2 次（上一題、主目錄），並列模式不會重複（實際 " + countOf(footFresh, "←") + "）");
ok(countOf(footFresh, "→") === 1, "底欄「→」只出現 1 次（下一題）");
ok(countOf(footFresh, "✓") === 0, "未標記時底欄不會出現 ✓");
const donePage = boot("quiz.html", "?c=ch10-test&p=1",
  JSON.stringify({ done: { "ch10-A1": true }, picked: { "ch10-A1": "B" }, hints: {} }));
const doneFoot = (donePage.$(".foot-nav") || {}).textContent || "";
ok(countOf(doneFoot, "✓") === 1,
  "已掌握的題目：底欄「✓」只出現 1 次，不會中英各出一次（實際 " + countOf(doneFoot, "✓") + "）");
ok(!!donePage.$('.foot-nav .btn .arw[aria-hidden="true"]'),
  "符號寫成 .arw 且標為 aria-hidden（裝飾，唔會被螢幕閱讀器讀出）");
ok(!/\{ zh: "[^"]*[←→✓✗]/.test(appJs),
  "UI 字串不含箭頭／✓／✗（一律用 setPairArrow 放在雙語之外）");


/* 逐步提示（KA hint 模式） */
const qh = boot("quiz.html", "?c=ch10-test&p=1");
ok(qh.doc.body.getAttribute("data-sol") === "hide", "新瀏覽器進入題目時已自動收起題解");
ok(qh.$$(".sol-card .steps .step").length === 0, "收起題解後先不顯示步驟");
ok(!!qh.$("[data-hint]"), "有「顯示提示」按鈕");
qh.$("[data-hint]").click();
ok(qh.$$(".sol-card .steps .step").length === 1, "按一次提示 → 顯示第 1 步");
qh.$("[data-hint]").click();
ok(qh.$$(".sol-card .steps .step").length === 2, "再按一次 → 顯示第 2 步");
ok(!!qh.$(".sol-card .sol-extra"),
  "陷阱與技巧放在 .sol-extra（收起題解時由 CSS 隱藏，揭曉完才出現）");
ok(!!qh.$(".answer-box.sol-answer") && !qh.$(".answer-box").classList.contains("on"),
  "收起題解且未作答時，答案欄未揭曉（收起題解不再顯示答案）");
const cssText = read("assets/style.css");
ok(!/\.sol-card \.sol-body\s*\{\s*display:\s*none/.test(cssText),
  "style.css 不再收起 .sol-body（否則按「顯示提示」無反應）");
ok(/\[data-sol="hide"\] \.sol-card \.sol-answer\b/.test(cssText),
  "style.css 有「收起題解時一併收起答案欄」的規則");

/* ── 收起題解：把真的 style.css 注入 jsdom，驗證 computed style ──────────
   （上一版只做 DOM class 檢查，CSS 出錯照樣「測試通過」→ 要用真 CSS 驗） */
console.log("\n== 收起題解（真 CSS 驗證）==");
function bootCss(page, search, storage) {
  const d = boot(page, search, storage);
  const st = d.doc.createElement("style");
  st.textContent = cssText;
  d.doc.head.appendChild(st);
  return d;
}
const cssDisp = (d, sel) => {
  const n = d.$(sel);
  return n ? d.ctx.window.getComputedStyle(n).display : "MISSING";
};

const sc = bootCss("quiz.html", "?c=ch10-test&p=1");
ok(cssDisp(sc, ".answer-box.sol-answer") === "none", "首次進入時答案欄預設隱藏");
sc.$("#sol-toggle").click();
ok(cssDisp(sc, ".answer-box.sol-answer") !== "none", "按「顯示題解」後答案欄可見");
sc.$("#sol-toggle").click();
ok(cssDisp(sc, ".answer-box.sol-answer") === "none", "收起題解 → 答案欄隱藏（不再露答案）");
ok(cssDisp(sc, ".sol-card .sol-body") !== "none", "收起題解 → .sol-body 仍可見（提示出得來）");
ok(cssDisp(sc, ".sol-card .sol-extra") === "none", "收起題解 → 陷阱／技巧隱藏");
ok(!!sc.$("[data-peek]"), "收起題解時有「顯示答案」按鈕");
sc.$("[data-peek]").click();
ok(cssDisp(sc, ".answer-box.sol-answer") !== "none", "按「顯示答案」→ 答案欄出現");
ok(sc.$$(".sol-card .steps .step").length === 0, "「顯示答案」只揭答案，不揭步驟");
sc.$("[data-hint]").click();
ok(cssDisp(sc, ".answer-box.sol-answer") !== "none", "按下提示後（重畫）答案欄仍保持揭曉");
sc.$("[data-peek]").click();
ok(cssDisp(sc, ".answer-box.sol-answer") === "none", "再按一次 → 答案欄收起");

const sc2 = bootCss("quiz.html", "?c=ch10-test&p=1",
  JSON.stringify({ done: { "ch10-A1": true }, picked: { "ch10-A1": "B" }, hints: {} }));
ok(cssDisp(sc2, ".answer-box.sol-answer") === "none",
  "曾答對過的題目：收起題解後答案欄仍然隱藏（上一版在此漏了答案）");

/* 版本戳：由 build.py 依內容寫入，內容一變就要變 */
ok(/window\.__V = "[0-9a-f]{8}"/.test(read("index.html")), "index.html 有 build 版本戳");
ok(/window\.__V = "[0-9a-f]{8}"/.test(read("quiz.html")), "quiz.html 有 build 版本戳");
ok(/window\.__V = "[0-9a-f]{8}"/.test(read("chapter.html")), "chapter.html 有 build 版本戳");

/* ── 一鍵複製 LLM 提問 Prompt ────────────────────────────────────────── */
console.log("\n== LLM 提問 Prompt ==");
const idx = JSON.parse(indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1));
ok(!!(idx.promptTemplates && idx.promptTemplates.zh && idx.promptTemplates.en),
  "模板檔已內嵌（中英各一份）");
ok(idx.site.llmPrompt === true, "site.json 有 LLM prompt 開關");

const pm = boot("quiz.html", "?c=ch10-test&p=1", null, "show");
ok(!!pm.$("[data-pm-main]"), "每題有 1 個主按鈕（整題 prompt）");
ok(pm.$$("[data-pm-step]").length === 3, "每個步驟都有小按鈕（A1 有 3 步 → 3 個）");

const btnMain = pm.$("[data-pm-main]");
btnMain.click();
const modal = pm.$(".prompt-modal");
ok(!!modal, "按主按鈕會開面板");
ok(pm.$$(".pm-opt input").length === 5, "面板有 5 個可勾選項");
const preview1 = pm.$("[data-pm-preview]").value;
ok(/A1/.test(preview1), "prompt 帶有題號 A1");
ok(/繁體中文/.test(preview1), "prompt 指定繁體中文及香港用語");
ok(/由淺入深/.test(preview1), "prompt 有解釋風格要求（由淺入深）");
ok(/未填寫/.test(preview1), "疑惑位未填時有提示（請 AI 估計最常犯的錯）");
ok(/不要用我下面提供的解法照抄|換另一個角度/.test(preview1),
  "prompt 要求換角度講，避免重複現有解釋");
ok(/自我檢查題/.test(preview1), "prompt 指定輸出格式（含自我檢查題）");

// 勾選「更簡單說法」
const cb0 = pm.$('.pm-opt input[data-opt="simpler"]');
cb0.checked = true;
cb0.dispatchEvent(new pm.dom.window.Event("change"));
ok(/最簡單/.test(pm.$("[data-pm-preview]").value), "勾選後 prompt 加入「更簡單說法」要求");
// 填寫疑惑
const db = pm.$(".pm-doubt");
db.value = "點解兩邊除以負數要轉向？";
db.dispatchEvent(new pm.dom.window.Event("input"));
ok(/除以負數要轉向/.test(pm.$("[data-pm-preview]").value), "填寫的疑惑會放進 prompt");

// 複製
pm.$("[data-pm-copy]").click();
ok(pm.ctx.__clip && pm.ctx.__clip === pm.$("[data-pm-preview]").value,
  "按複製會把 prompt 寫入剪貼簿");

// 步驟按鈕：只聚焦該步驟
pm.$(".pm-x").click();
ok(!pm.$(".prompt-modal"), "關閉後面板移除");
const pm2 = boot("quiz.html", "?c=ch10-test&p=1", null, "show");
pm2.$$("[data-pm-step]")[1].click();
ok(/第 2 步/.test(pm2.$("[data-pm-preview]").value), "步驟按鈕的 prompt 聚焦該一步");

// 英文模式 → 英文 prompt
const pm3 = boot("quiz.html", "?c=ch10-test&p=1");
pm3.$$(".langbar button")[1].click();
pm3.$("[data-pm-main]").click();
const enPrompt = pm3.$("[data-pm-preview]").value;
ok(/HKDSE/.test(enPrompt) && /step by step|Step /.test(enPrompt), "EN 模式產生英文 prompt");
ok(!/由淺入深/.test(enPrompt), "英文 prompt 內不含中文要求");

// 語言與題解開關
q1c.$$(".langbar button")[0].click();
ok(q1c.lang() === "zh", "切回中文");
ok(q1c.doc.body.getAttribute("data-sol") === "hide", "首次載入的題目預設收起題解");
q1c.$("#sol-toggle").click();
ok(q1c.doc.body.getAttribute("data-sol") === "show", "按一次顯示題解：body[data-sol=show]");
ok(/收起題解/.test(q1c.$("#sol-toggle").textContent), "顯示時按鈕可收起題解");
q1c.$("#sol-toggle").click();
ok(q1c.doc.body.getAttribute("data-sol") === "hide", "再按一次收起題解：body[data-sol=hide]");
ok(!!q1c.$(".sol-hint"), "收起時題目卡有提示（做完才對答案）");
ok(!!q1c.$(".sol-card"), "題解卡仍在 DOM（由 CSS 收起，切回即見）");

/* ── 4. 測驗頁：長題目（B3）──────────────────────────────────────────── */
console.log("\n== 測驗頁（B3 長題目）==");
const b3 = boot("quiz.html", "?c=ch10-test&p=8", null, "show");
ok(!!b3.$('.q-card[data-qid="ch10-B3"]'), "渲染出 B3 題目卡");
ok(b3.$$(".q-parts li").length === 3, "B3 有 (a)(b)(c) 三小題");
ok(b3.$$(".q-parts .mk").length === 3, "每小題都顯示分數");
ok(b3.$$(".answer-box .a-row").length === 3, "答案欄有三個答案");
ok(b3.$$(".sol-card .steps .step").length === 12, "B3 有 12 個解題步驟（含方法二）");
ok(b3.$$(".step .part-chip").length >= 3, "步驟標明屬於哪一小題");
ok(b3.$$(".step .marking").length === 9, "步驟分標記齊全（9 個）");
ok(b3.$$(".sol-card .trap").length === 4, "B3 列出 4 個常見錯誤");
ok(b3.$$(".sol-card .trap .l-zh").length === 8 && b3.$$(".sol-card .trap .l-en").length === 8,
  "每個錯誤提示都有中英兩版（標籤＋內文）");
ok(/flip|negative|Forgetting/.test(b3.$$(".sol-card .trap .l-en")[0].textContent),
  "錯誤提示的英文標籤已渲染");
ok(!!b3.$(".sol-card .fig svg"), "答案圖（數線）已插入題解");
ok(b3.$$(".step .hl").length >= 2, "重點答案有高亮 chip");
ok(b3.$$(".step .flip-note").length >= 1 && /轉向/.test(b3.$(".flip-note").textContent),
  "變號步驟有雙語高亮標籤（注意：不等號必須轉向）");
ok(/EQN/.test(b3.$(".sol-card .tip").textContent), "B3 貼士含計數機 EQN 驗證技巧");

/* ── B4：頂點式 + 方法二（對稱軸公式）───────────────────────────────── */
console.log("\n== 測驗頁（B4 長題目）==");
const b4p = boot("quiz.html", "?c=ch10-test&p=9", null, "show");
ok(!!b4p.$('.q-card[data-qid="ch10-B4"]'), "渲染出 B4 題目卡");
ok(b4p.$$(".sol-card .steps .step").length === 9, "B4 有 9 個步驟（含方法二）");
ok(/a\s*=\s*1/.test(b4p.$$(".sol-card .steps .step")[0].textContent),
  "B4(a) 第 1 步講明 $x^2$ 係數 a = 1");
ok(b4p.$$(".sol-card .steps .step").some((s) => /對稱軸公式/.test(s.textContent)),
  "B4(a) 有「方法二 · 對稱軸公式反推」");

/* ── 5. 加分題：逐步出圖 ─────────────────────────────────────────────── */
console.log("\n== 測驗頁（加分題）==");
const bo = boot("quiz.html", "?c=ch10-test&p=11", null, "show");
ok(!!bo.$('.q-card[data-qid="ch10-bonus"]'), "渲染出加分題");
ok(/加分題/.test((bo.$(".q-bonus") || {}).textContent || ""), "有加分題標籤");
ok(bo.$$(".sol-card .fig svg").length === 3, "三個情況各有一幅圖（實際 " +
  bo.$$(".sol-card .fig svg").length + "）");
ok(bo.$$(".sol-card .steps .step").length === 8, "加分題有 8 個解題步驟");

/* ── 6. 全部題目都要有題解、圖、答案 ─────────────────────────────────── */
console.log("\n== 全卷體檢 ==");
const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((p) => boot("quiz.html", "?c=ch10-test&p=" + p, null, "show"));
ok(all.every((t) => t.$$(".sol-card").length === 1), "每題都有題解卡");
ok(all.every((t) => t.$$(".sol-card .steps .step").length >= 3), "每題至少 3 個步驟");
ok(all.every((t) => !/\$/.test(t.$(".q-stem").textContent)), "所有題幹都已渲染（無殘留 $）");
ok(all.every((t) => !!t.$(".q-stem .l-zh") && !!t.$(".q-stem .l-en")), "所有題幹都有中英兩版");
ok(all.every((t) => !!t.$(".sol-card .tip")), "每題都有「帶得走的技巧」");
ok(all.every((t) => t.$$(".sol-card .trap").length >= 3), "每題至少 3 個錯誤提示");
ok(all.every((t) => t.body === undefined || t.doc.body.getAttribute("data-lang")),
  "每頁都有語言設定");

const figs = JSON.parse(figuresJs.slice(figuresJs.indexOf("{"), figuresJs.lastIndexOf("}") + 1));
ok(Object.keys(figs).length === 14, "圖共 14 幅（實際 " + Object.keys(figs).length + "）");
ok(Object.keys(figs).every((k) => /<svg [^>]*viewBox/.test(figs[k].svg)),
  "每幅圖都是合法的 SVG（有 viewBox）");
ok(Object.keys(figs).every((k) => (figs[k].caption || {}).zh && (figs[k].caption || {}).en),
  "每幅圖都有中英說明");

/* ── 6b. 課本練習：章 → 節，以及第 17.2 節 ───────────────────────────── */
console.log("\n== 課本練習（章 → 節）==");
const CH17 = CW_CHAPTERS[0] || {};
const chPage = boot("chapter.html", "?ch=ch17");
ok(!!chPage.$("#chapter-body"), "章節頁有內容區");
ok(/第 17 章/.test((chPage.$("#chapter-name") || {}).textContent || ""), "章節頁顯示章名（第 17 章）");
ok(chPage.$$("#chapter-body .part-btn").length === (CH17.sections || []).length,
  "章節頁列出 " + (CH17.sections || []).length + " 節（實際 " +
  chPage.$$("#chapter-body .part-btn").length + "）");
const soonBtns = chPage.$$("#chapter-body .part-btn[disabled]");
const liveBtns = chPage.$$("#chapter-body .part-btn").filter((b) => !b.disabled);
ok(soonBtns.length === 1, "未上線的節（17.1）標示為即將推出且不可按");
ok(liveBtns.length === 2, "已上線的節有 2 個（17.2、17.3）");
liveBtns[0].click();
ok(/c=ch17-2/.test(chPage.ctx.window.__S5A_LAST_NAV || ""),
  "按「17.2」會去 quiz.html?c=ch17-2");
const section173 = liveBtns.filter((b) => /17\.3/.test(b.textContent))[0];
section173.click();
ok(/c=ch17-3/.test(chPage.ctx.window.__S5A_LAST_NAV || ""),
  "按「17.3」會去 quiz.html?c=ch17-3");

console.log("\n== 第 17.2 節（課本練習頁）==");
const P172 = INDEX.parts.filter((p) => p.id === "ch17-2")[0] || {};
ok(P172.stats && P172.stats.questions === 36, "第 17.2 節共 36 題");
ok((P172.sections || []).length === 6, "第 17.2 節分 6 段（例題／判斷／L1／L2／挑戰／跨課題）");
ok((P172.qids || []).length === 36, "qids 與題數一致");
ok(P172.stats && P172.stats.marks === 185, "全節 185 分");

const c0 = boot("quiz.html", "?c=ch17-2&p=0");
ok(c0.$$("#pagenav .pg").length === 37, "分頁列 = 總覽 + 36 題（實際 " + c0.$$("#pagenav .pg").length + "）");
ok(c0.$$("#pagenav .pg-sec").length === 6, "分頁列有 6 個分段標題");
ok(/課堂例題/.test(c0.$("#pagenav .pg-sec").textContent), "第一個分段寫「課堂例題」");
ok(c0.$$("#quiz-body .btn").length >= 36, "總覽有跳去各題的按鈕");
ok(c0.$$(".cc").length === 2, "17.2 總覽有 2 張教學卡（實際 " + c0.$$(".cc").length + "）");
ok(/綑綁法/.test(c0.$(".cc .cc-title").textContent), "第一張教學卡是綑綁法");
ok(/插空法/.test(c0.$$(".cc .cc-title")[1].textContent), "第二張教學卡是插空法");
ok(!!c0.$(".cc .formula .katex"), "教學卡的 {{math:0}} 已代入並經 KaTeX 渲染");
ok(!/\{\{math:/.test(c0.$("#quiz-body").textContent), "總覽沒有殘留 {{math:}} 佔位符");
ok(c0.$$(".cc-warn").length === 2, "兩張卡都有「常犯錯誤」");
ok(!!c0.$(".cc-vocab .cc-chip"), "教學卡有詞彙 chips");
ok(!!c0.$(".cc .l-zh") && !!c0.$(".cc .l-en"), "教學卡有中英兩版");
ok(c0.$$(".cc-ul").length >= 8, "步驟已分行：中英合共至少 8 個清單（實際 " + c0.$$(".cc-ul").length + "）");
ok(/第一步/.test(c0.$(".cc-ul li").textContent), "第一個清單項目是「第一步 …」");
ok(c0.$$(".cc .formula").length === 4, "兩張卡各自中英都有一個數式區（{{math}} 已代入）");
ok(c0.$$(".cc-warn .cc-ul li").length >= 4, "常犯錯誤用清單逐項列出");

/* 綑綁法互動示範（assets/demos.js）：資料 → DOM → 互動 */
const demo = c0.$('.cc .demo[data-demo="tie-up"]');
ok(!!demo && !!c0.$(".cc .demo-host"), "綑綁法卡有互動示範（app.js 掛在 .demo-host 內）");
ok(demo.getAttribute("data-step") === "0", "示範預設停在第 1 步");
ok(demo.querySelectorAll(".pnode").length === 5, "舞台有 5 個學生節點");
ok(demo.querySelectorAll(".pnode-fixed").length === 2, "A 與 B 標示為「必須相鄰」的指定人物");
ok(!!demo.querySelector(".bi .l-zh") && !!demo.querySelector(".bi .l-en"), "示範文字有中英兩版");
ok(countOf(demo.textContent, "←") === 1 && countOf(demo.textContent, "→") === 1,
  "示範的箭頭各只出現一次（語言中立符號放雙語之外）");
const demoBtns = demo.querySelectorAll(".demo-ctrl .btn");
ok(demoBtns[0].disabled === true, "第 1 步「上一步」不可按");
demoBtns[1].click();
ok(demo.getAttribute("data-step") === "1", "第 2 步：把 A、B 綑綁成一個主體");
ok(/4! = 24/.test(demo.querySelector(".demo-units").textContent),
  "第 2 步同步顯示「4 個主體 · 4! = 24」");
ok(demo.querySelectorAll(".unit").length === 4 && !!demo.querySelector(".unit-block"),
  "綑綁後舞台變成 4 個單位（A＋B 合成一個大單位）");
demoBtns[1].click();
ok(demo.getAttribute("data-step") === "2", "第 3 步：大單位可與 C、D、E 換位");
const unitAt = () => Array.prototype.slice.call(demo.querySelectorAll(".unit"));
ok(unitAt().map((u) => u.getAttribute("data-unit")).join(",") === "AB,C,D,E",
  "起初大單位在最左（實際 " + unitAt().map((u) => u.getAttribute("data-unit")).join(",") + "）");
unitAt()[0].click();
ok(!!demo.querySelector(".unit-picked"), "點一下單位會標示為已揀選");
unitAt()[1].click();                                   /* 把大單位同 C 對調 */
const orderAfter = unitAt().map((u) => u.getAttribute("data-unit")).join(",");
ok(orderAfter === "C,AB,D,E", "再點另一個單位 → 兩者交換位置（實際 " + orderAfter + "）");
ok(demo.querySelector(".order-txt").textContent === "C · A+B · D · E",
  "「目前排列」同步更新（實際 " + demo.querySelector(".order-txt").textContent + "）");
unitAt()[1].click();
unitAt()[0].click();                                   /* 換返原位，方便之後斷言 */
ok(unitAt().map((u) => u.getAttribute("data-unit")).join(",") === "AB,C,D,E",
  "可以再換返轉頭（學生可以自由試位）");
/* 「示範 4 種位置」自動播放（jsdom 唔等 timer → 按一下之後手動 tick） */
const autoBtn = demo.querySelector(".demo-tip .btn");
ok(!!autoBtn, "第 3 步有「示範 4 種位置」按鈕");
autoBtn.click();
ok(demo.getAttribute("data-auto") === "1" && autoBtn.disabled === true,
  "播放中：標記 data-auto 並鎖定按鈕（避免同學亂按）");
ok(demo.__demoAuto.playing() === true, "自動播放進行中");
demo.__demoAuto.stop();
ok(!demo.getAttribute("data-auto") && autoBtn.disabled === false, "可以停得返");
demo.__demoAuto.tick();
ok(unitAt().map((u) => u.getAttribute("data-unit")).join(",") === "C,AB,D,E",
  "每格 tick = 大單位向右移一格");
demo.__demoAuto.tick();
demo.__demoAuto.tick();
ok(unitAt().map((u) => u.getAttribute("data-unit")).join(",") === "C,D,E,AB",
  "行到最右（大單位在第 4 位）");
ok(/4 \/ 24/.test(demo.querySelector(".demo-count").textContent),
  "「已試排列」會累加，指向 24 而唔係 4（實際 " + demo.querySelector(".demo-count").textContent + "）");
/* C、D、E 自己都可以換位（唔止大單位可以動） */
unitAt()[0].click();
unitAt()[1].click();
ok(unitAt().map((u) => u.getAttribute("data-unit")).join(",") === "D,C,E,AB",
  "C、D、E 之間一樣可以互換位置");
ok(/5 \/ 24/.test(demo.querySelector(".demo-count").textContent),
  "換出新組合會計入「已試排列」（實際 " + demo.querySelector(".demo-count").textContent + "）");
demo.__demoAuto.stop();
demoBtns[1].click();
ok(demo.getAttribute("data-step") === "3", "第 4 步：框內部對調");
const swapBtn = demo.querySelector(".demo-inner .btn");
swapBtn.click();
ok(swapBtn.getAttribute("aria-pressed") === "true" &&
  demo.querySelector(".demo-inner-row").classList.contains("flipped"),
  "框內 A、B 可對調（AB／BA），並標註 2! = 2");
ok(/2! = 2/.test(demo.querySelector(".demo-inner").textContent), "框內標註內部排列 2! = 2");
demoBtns[1].click();
ok(demo.getAttribute("data-step") === "4", "第 5 步：組裝公式");
ok(/4! = 24/.test(demo.querySelector(".demo-eq").textContent) &&
  /2! = 2/.test(demo.querySelector(".demo-eq").textContent) &&
  demo.querySelector(".eq-total .eq").textContent === "48",
  "最終公式 4! × 2! = 24 × 2 = 48");
ok(/4! × 2! = 24 × 2 =/.test(demo.querySelector(".demo-eq").textContent),
  "第 5 步才組裝出完整算式（之前只亮起零件）");
ok(demoBtns[1].disabled === true, "最後一步「下一步」不可按");
demoBtns[2].click();
ok(demo.getAttribute("data-step") === "0" &&
  !demo.querySelector(".demo-inner-row").classList.contains("flipped"),
  "「重播」回到第 1 步並還原對調狀態");
ok(demo.querySelector(".demo-eq").getAttribute("aria-live") === "polite",
  "算式列用 aria-live 播報目前步驟（螢幕閱讀器讀得到）");
const cssDemo = read("assets/style.css");
ok(/@media print\s*\{\s*\.demo \{ display: none/.test(cssDemo), "列印時收起示範");
ok(/prefers-reduced-motion[\s\S]{0,200}\.demo \.bundle/.test(cssDemo),
  "系統「減少動態效果」時示範停用過場");
ok(/24/.test(c0.$$(".cc-warn")[0].textContent), "綑綁法的常犯錯誤有計算例子（24 對 48）");
ok(/12/.test(c0.$$(".cc-warn")[1].textContent) && /84/.test(c0.$$(".cc-warn")[1].textContent),
  "插空法的常犯錯誤有計算例子（正確 12 對錯誤 84）");
ok(!/\{\{math:/.test(c0.$$(".cc-warn")[0].textContent), "常犯錯誤內沒有殘留佔位符");

const c17Default = boot("quiz.html", "?c=ch17-2&p=1");
ok(c17Default.doc.body.getAttribute("data-sol") === "hide", "第 17.2 節首次進入時題解預設收起");
const c17Legacy = boot("quiz.html", "?c=ch17-2&p=1", null, null, "show");
ok(c17Legacy.doc.body.getAttribute("data-sol") === "hide", "第 17.2 節忽略舊版自動儲存的顯示偏好");
const c1 = boot("quiz.html", "?c=ch17-2&p=1", null, "show");
ok(!!c1.$('.q-card[data-qid="ch17-2-ce1"]'), "第 1 頁渲染出 CE1");
ok(c1.$$(".opt").length === 0, "課本練習不是選擇題（沒有 A–D 選項）");
ok(c1.$$(".answer-box .a-row").length >= 1, "有答案欄");

/* 拆步：每個步驟只帶一個 (1M)／(1A) */
const oneToken = (s) => {
  const m = s.querySelector(".marking");
  return !!m && (m.textContent.match(/\(\d*[MA]\)/g) || []).length === 1;
};
ok(c1.$$(".sol-card .steps .step").length === 4, "CE1 拆成 4 個步驟（(a) 1M+1A、(b) 1M+1A）");
const cCe3 = boot("quiz.html", "?c=ch17-2&p=3", null, "show");
ok(cCe3.$$(".sol-card .steps .step").length === 6, "CE3 拆成 6 個步驟（(a)3 分、(b)3 分）");
const cCe4 = boot("quiz.html", "?c=ch17-2&p=4", null, "show");
ok(cCe4.$$(".sol-card .steps .step").length === 5, "CE4 拆成 5 個步驟（a2＋b2＋c3＝7 分）");
ok(c1.$$(".sol-card .steps .step").every(oneToken), "CE1 每個步驟只有一個評分標記");
ok(cCe3.$$(".sol-card .steps .step").every(oneToken), "CE3 每個步驟只有一個評分標記");
ok(cCe4.$$(".sol-card .steps .step").slice(2).every(oneToken),
  "CE4 (c) 的三個步驟各只有一個評分標記");
ok(c1.$$(".sol-card .marking").length === 4 && cCe3.$$(".sol-card .marking").length === 6 &&
  cCe4.$$(".sol-card .marking").length === 5, "三題的評分標記數目與步驟數一致");

/* solution.alt：另一個做法（參考），預設收起 */
ok(!!c1.$(".sol-card .alt-box"), "CE1 有「另一個做法（參考）」摺疊區");
ok((c1.$(".sol-card .alt-box") || {}).tagName === "DETAILS", "摺疊區用 <details>（可開合）");
ok(c1.$(".sol-card .alt-box").open === false, "摺疊區預設收起，不搶第一解法");
ok(/計算機/.test(c1.$(".sol-card .alt-box").textContent), "摺疊區載有計算機核對做法");
ok(!!c1.$(".sol-card .alt-box .l-zh") && !!c1.$(".sol-card .alt-box .l-en"),
  "摺疊區內容有中英兩版");
ok(c1.$$(".cc").length === 0, "教學卡只出現在總覽頁，不會重複在每一題");
const crumb = c1.$("#crumb-slot a");
ok(!!crumb && /chapter\.html\?ch=ch17/.test(crumb.getAttribute("href") || ""),
  "頂欄有返回第 17 章的連結");

const cSc = boot("quiz.html", "?c=ch17-2&p=5");
ok(!!cSc.$('.q-card[data-qid="ch17-2-sc"]'), "第 5 頁是 Section Check 判斷題");
ok(cSc.$$(".answer-box .a-row").length === 7, "判斷題有 7 個答案 (a)–(g)");
ok(cSc.$$(".tf-item").length === 7, "判斷題有 7 個可作答小題");
ok(cSc.$$(".tf-opt").length === 14, "每小題有「正確／錯誤」兩個按鈕");
ok(cSc.$$(".tf-opt[disabled]").length === 0, "未作答前按鈕可以按");

/* 判斷題互動：答對、答錯兩次、全對、重開頁面 */
const P172_JS = read("data/ch17-2.js");
const P172_DATA = JSON.parse(P172_JS.slice(P172_JS.indexOf("{"), P172_JS.lastIndexOf("}") + 1));
const scQ = P172_DATA.sections
  .reduce((acc, s) => acc.concat(s.questions || []), [])
  .filter((q) => q.id === "ch17-2-sc")[0] || { parts: [], answers: [] };
const scAns = {};
(scQ.answers || []).forEach((a) => { scAns[a.part] = a.tf; });
const card3 = (P172_DATA.cards || []).filter((c) => c.id === "ch17-c03")[0] || {};
ok(card3.warn && !/C\^/.test((card3.warn.zh || "") + (card3.warn.en || "")),
  "ch17-c03 的常犯錯誤只用排列記法（不引入組合 C^n_r）");
/* 教學卡正文與示範用同一組數字（避免學生看到兩套例子） */
const card2 = (P172_DATA.cards || []).filter((c) => c.id === "ch17-c02")[0] || {};
ok(card2.demo && card2.demo.type === "tie-up", "綑綁法卡資料有 demo.type = tie-up");
ok(/5 名學生/.test((card2.body || {}).zh || "") &&
  /5 students/.test((card2.body || {}).en || "") &&
  !/3 名男生/.test((card2.body || {}).zh || "") &&
  !/3 boys/.test((card2.body || {}).en || ""),
  "綑綁法卡正文已同步為「5 名學生」（與示範一致）");
ok(/A 與 B/.test((card2.body || {}).zh || "") && /A and B/.test((card2.body || {}).en || ""),
  "綑綁法卡正文改用 A、B（不再用男生／女生）");
ok(Object.keys(scAns).length === 7 && scQ.parts.length === 7,
  "判斷題資料齊全（7 小題、每個都有 tf 答案）");

const scT = boot("quiz.html", "?c=ch17-2&p=5");
const scItem0 = scT.$$(".tf-item")[0];
const scBtn0 = Array.prototype.slice.call(scItem0.querySelectorAll(".tf-opt"))
  .filter((b) => b.dataset.tf === (scAns[scQ.parts[0].label] ? "T" : "F"))[0];
scBtn0.click();
ok(scT.store().tf && scT.store().tf["ch17-2-sc/(a)"] === true, "答對小題會記錄在 localStorage");
ok(scItem0.querySelectorAll(".tf-opt[disabled]").length === 2, "答對後該小題的按鈕鎖定");
ok(!!scItem0.querySelector(".tf-opt.correct"), "答對的按鈕標綠");
ok(!scT.store().done["ch17-2-sc"], "只答對 1 小題，未算整題已掌握");

const scW = boot("quiz.html", "?c=ch17-2&p=5");
const scWItem = scW.$$(".tf-item")[1];
const scWrong = Array.prototype.slice.call(scWItem.querySelectorAll(".tf-opt"))
  .filter((b) => b.dataset.tf === (scAns[scQ.parts[1].label] ? "F" : "T"))[0];
scWrong.click();
ok(scWrong.classList.contains("wrong"), "第一次答錯標紅");
ok(!scWItem.querySelector(".tf-opt.correct"), "第一次答錯不揭示正確答案");
scWrong.click();
ok(!!scWItem.querySelector(".tf-opt.correct"), "第二次答錯揭示正確答案");

const scAll = boot("quiz.html", "?c=ch17-2&p=5");
scAll.$$(".tf-item").forEach((it, i) => {
  const want = scAns[scQ.parts[i].label] ? "T" : "F";
  Array.prototype.slice.call(it.querySelectorAll(".tf-opt"))
    .filter((b) => b.dataset.tf === want)[0].click();
});
ok(scAll.store().done["ch17-2-sc"] === true, "7 小題全對 → 整題標記為已掌握");
ok(scAll.$$("#pagenav .pg")[5].classList.contains("done"), "分頁列的 SC 打勾");
/* toast 的符號同樣放雙語之外（中英並列只出一次） */
const scToast = (scAll.$("#toast") || {}).textContent || "";
ok(/都答對了/.test(scToast) && countOf(scToast, "✓") === 1,
  "判斷題全對的 toast 只有一個 ✓（實際 " + countOf(scToast, "✓") + "）");

const scBack = boot("quiz.html", "?c=ch17-2&p=5", JSON.stringify({
  done: { "ch17-2-sc": true }, picked: {}, hints: {},
  tf: { "ch17-2-sc/(a)": true }
}));
ok(scBack.$$(".tf-item")[0].querySelectorAll(".tf-opt[disabled]").length === 2,
  "重開頁面：已答對的小題保持鎖定");

const cLast = boot("quiz.html", "?c=ch17-2&p=36");
ok(!!cLast.$('.q-card[data-qid="ch17-2-ct-31"]'), "最後一頁是第 31 題（跨課題）");

const allC = [];
for (let i = 1; i <= 36; i++) allC.push(boot("quiz.html", "?c=ch17-2&p=" + i, null, "show"));
ok(allC.every((t) => t.$$(".sol-card").length === 1), "第 17.2 節每題都有題解卡");
ok(allC.every((t) => t.$$(".sol-card .steps .step").length >= 1), "每題至少 1 個步驟");
ok(allC.every((t) => !!t.$(".sol-card .tip")), "每題都有「帶得走的技巧」");
ok(allC.every((t) => t.$$(".sol-card .trap").length >= 1), "每題至少 1 個常見錯誤");
ok(allC.every((t) => !/\$/.test(t.$(".q-stem").textContent)), "所有題幹已渲染（無殘留 $）");
ok(allC.every((t) => !!t.$(".q-stem .l-zh") && !!t.$(".q-stem .l-en")), "所有題幹都有中英兩版");

console.log("\n== 第 17.3 節（課本練習頁）==");
const P173 = INDEX.parts.filter((p) => p.id === "ch17-3")[0] || {};
ok(P173.stats && P173.stats.questions === 35 && P173.stats.marks === 102,
  "第 17.3 節共 35 題、102 分");
ok((P173.sections || []).length === 6 && (P173.qids || []).length === 35,
  "第 17.3 節有 6 段且 qids 數目正確");
const P173_JS = read("data/ch17-3.js");
const P173_DATA = JSON.parse(P173_JS.slice(P173_JS.indexOf("{"), P173_JS.lastIndexOf("}") + 1));
const p173Questions = P173_DATA.sections.reduce((all, section) => all.concat(section.questions || []), []);
const p173Trap = (qid) => {
  const question = p173Questions.find((q) => q.id === qid) || {};
  return (question.solution && question.solution.traps || [])
    .map((trap) => (trap.zh || "") + " " + (trap.en || "")).join(" ");
};
ok(/C\^5_1C\^4_1C\^7_1=140/.test(p173Trap("ch17-3-l2-17")) &&
  /twice/.test(p173Trap("ch17-3-l2-17")), "17(b) explains why the anchor-first product double-counts");
ok(/C\^\{14\}_1C\^\{12\}_1C\^\{24\}_4/.test(p173Trap("ch17-3-ce3")) &&
  /repeatedly/.test(p173Trap("ch17-3-ce3")), "CE3(c) explains duplicate mixed-team counts");
ok(/C\^8_1C\^7_1C\^\{17\}_1/.test(p173Trap("ch17-3-l2-21")) &&
  /missing valid/.test(p173Trap("ch17-3-l2-21")), "L2-21(b) explains omitted and duplicated colour selections");
ok(/C\^6_1C\^7_1C\^\{11\}_3=6930/.test(p173Trap("ch17-3-sc")) &&
  /b\(5-b\)/.test(p173Trap("ch17-3-sc")), "Section Check (f) explains anchor-pair overcounting");
ok(p173Questions.every((q) => q.solution.steps.every((st) => (st.highlight || []).length === 1)),
  "17.3 每個步驟都有 highlight 重點框（資料層）");
ok(p173Questions.filter((q) => (q.solution.alt || []).length > 0).map((q) => q.id).join(",") ===
  "ch17-3-sm-28,ch17-3-sm-29", "SMART Q28／Q29 有另一個做法（alt）");
ok((P173_DATA.cards || []).length === 4, "17.3 有 4 張教學卡（資料層）");
const scEAns = ((p173Questions.find((q) => q.id === "ch17-3-sc") || {}).answers || [])[4] || {};
ok(/35/.test(((scEAns.note || {}).zh) || "") && /unlabelled/.test(((scEAns.note || {}).en) || ""),
  "Section Check (e) 補充「兩隊不編號要除以 2!」");
const p173Overview = boot("quiz.html", "?c=ch17-3&p=0");
ok(p173Overview.$$("#pagenav .pg").length === 36,
  "17.3 分頁列 = 總覽 + 35 題（實際 " + p173Overview.$$("#pagenav .pg").length + "）");
const p173Cards = p173Overview.$$(".cc");
ok(p173Cards.length === 4, "17.3 總覽有 4 張教學卡（實際 " + p173Cards.length + "）");
ok(/組合/.test(p173Cards[0].textContent) && /至少/.test(p173Cards[1].textContent) &&
  /分組/.test(p173Cards[2].textContent) && /路徑/.test(p173Cards[3].textContent),
  "17.3 教學卡依次為組合、至少／至多、分組、路徑");
const p173Sc = boot("quiz.html", "?c=ch17-3&p=5");
ok(!!p173Sc.$('.q-card[data-qid="ch17-3-sc"]') && p173Sc.$$(".tf-item").length === 6,
  "17.3 Section Check 有 6 個互動判斷項");
const p173Q25 = boot("quiz.html", "?c=ch17-3&p=30", null, "show");
ok(!!p173Q25.$('.q-card[data-qid="ch17-3-l2-25"]') && /90/.test(p173Q25.$(".answer-box").textContent),
  "L2-25(b) 依次探訪的答案為 90");
ok(!/540/.test(p173Q25.$(".sol-card").textContent) && /6!/.test(p173Q25.$(".sol-card").textContent),
  "L2-25 只寫 90，並以 6!/(2!)^3 作驗算（不再提官方 540）");
const p173Q29 = boot("quiz.html", "?c=ch17-3&p=34", null, "show");
ok(!!p173Q29.$('.q-card[data-qid="ch17-3-sm-29"] .fig svg') &&
  /126/.test(p173Q29.$(".answer-box").textContent) && /60/.test(p173Q29.$(".answer-box").textContent),
  "SMART Q29 顯示路徑圖及 126／60 答案");
const p173Last = boot("quiz.html", "?c=ch17-3&p=35");
ok(!!p173Last.$('.q-card[data-qid="ch17-3-ct-30"]'), "17.3 最後一頁是第 30 題跨課題");
const all173 = [];
for (let i = 1; i <= 35; i++) all173.push(boot("quiz.html", "?c=ch17-3&p=" + i, null, "show"));
ok(all173.every((t) => t.$$(".sol-card").length === 1 && t.$$(".sol-card .steps .step").length > 0),
  "17.3 每題都有逐步題解");
ok(all173.every((t) => !!t.$(".sol-card .tip") && t.$$(".sol-card .trap").length > 0),
  "17.3 每題都有技巧與常見錯誤");
ok(all173.every((t) => t.$$(".sol-card .hl").length > 0), "17.3 每題都顯示步驟重點框");
ok(all173.every((t) => !!t.$(".q-stem .l-zh") && !!t.$(".q-stem .l-en")),
  "17.3 所有題幹均有中英版本");

/* ── 7. 進度記錄（新開頁面仍記得）────────────────────────────────────── */
console.log("\n== 進度 ==");
const saved = JSON.stringify({ done: { "ch10-A1": true, "ch10-A2": true }, picked: { "ch10-A1": "B" } });
const back = boot("index.html", "", saved);
ok(!!back.$(".part-btn.doing") && back.$$(".part-btn.done").length === 0,
  "有進度但未完成的卡會標 .doing（左側色條轉靛藍）");
const cssBar = read("assets/style.css");
ok(/\.part-btn::before\b/.test(cssBar) && /\.part-btn\.doing::before/.test(cssBar) &&
  /--bar-idle/.test(cssBar) && /--bar-off/.test(cssBar),
  "style.css 有狀態色條（四狀態：idle／doing／done／off）");
ok(/已掌握 18%/.test((back.$(".part-btn .t-meta") || {}).textContent || ""),
  "首頁顯示已掌握百分比（2/11 = 18%）");
ok(back.$$(".part-btn .ring.full").length === 0, "未完成時進度環不是 full");

console.log("\n" + (fails ? "有 " + fails + " 項未通過" : "全部通過 all smoke tests passed"));
process.exit(fails ? 1 : 0);
