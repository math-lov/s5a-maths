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
ok(soonBtns.length === 0 && liveBtns.length === 3,
  "三節全部上線（沒有「即將推出」；實際上線 " + liveBtns.length + " 節）");
const secBtn = (n) => liveBtns.filter((b) => new RegExp("17\\." + n).test(b.textContent))[0];
secBtn(1).click();
ok(/c=ch17-1/.test(chPage.ctx.window.__S5A_LAST_NAV || ""),
  "按「17.1」會去 quiz.html?c=ch17-1");
secBtn(2).click();
ok(/c=ch17-2/.test(chPage.ctx.window.__S5A_LAST_NAV || ""),
  "按「17.2」會去 quiz.html?c=ch17-2");
secBtn(3).click();
ok(/c=ch17-3/.test(chPage.ctx.window.__S5A_LAST_NAV || ""),
  "按「17.3」會去 quiz.html?c=ch17-3");

/* ── 第 17.1 節（課本練習頁）：官方答案核對 ＋ 頁面渲染 ───────────────── */
console.log("\n== 第 17.1 節（課本練習頁）==");
const P171 = INDEX.parts.filter((p) => p.id === "ch17-1")[0] || {};
ok(P171.stats && P171.stats.questions === 37 && P171.stats.marks === 133,
  "第 17.1 節 37 題 · 133 分（實際 " +
  (P171.stats ? P171.stats.questions + " 題 · " + P171.stats.marks + " 分" : "缺 stats") + "）");
ok((P171.sections || []).length === 6 && (P171.qids || []).length === 37,
  "第 17.1 節分 6 段且 qids 數目正確");
const P171_JS = read("data/ch17-1.js");
const P171_DATA = JSON.parse(P171_JS.slice(P171_JS.indexOf("{"), P171_JS.lastIndexOf("}") + 1));
const q171 = (id) => P171_DATA.sections
  .reduce((a, s) => a.concat(s.questions || []), []).filter((q) => q.id === id)[0] || {};
ok(P171_DATA.sections.map((s) => s.id).join(",") === "CE,SC,L1,L2,SM,CT",
  "17.1 分段順序＝課堂例題／判斷／L1／L2／挑戰／跨課題");
ok((P171_DATA.cards || []).length === 3, "17.1 有 3 張教學卡");

/* 官方答案（source/SMS_sol_5B17_e.docx 逐題核對，見 data/raw/ch17-1-source.md） */
ok(q171("ch17-1-ce1").answers[1].math === "[36 + 54] - 15 = 90 - 15 = 75",
  "CE1(b) 官方答案 75（中括號寫明「先加後減」，附中間值）");
ok(q171("ch17-1-ce2").answers[1].math === "5 \\times 3 \\times 8 = 120",
  "CE2(b) 官方答案 120（每類各一支＝分步）");
ok(q171("ch17-1-ce3").answers[0].math === "10^4 = 10000" &&
  q171("ch17-1-ce3").answers[1].math === "10 \\times 9 \\times 8 \\times 7 = 5040",
  "CE3 官方答案 10000／5040");
ok(q171("ch17-1-ce4").answers[0].math === "(5 + 7) \\times 9 = 108",
  "CE4 官方答案 108（先分類再乘）");
const sc171 = q171("ch17-1-sc");
ok(sc171.answers.filter((a) => a.tf === false).map((a) => a.part).join(",") === "(b),(d)",
  "判斷題：只有 (b)、(d) 是錯（實際錯 " +
  sc171.answers.filter((a) => a.tf === false).length + " 項）");
ok(q171("ch17-1-l1-7").answers[0].math === "[20 + 25] - 15 = 45 - 15 = 30",
  "L1-7 官方答案 30（兩樣都會，同樣用中括號寫明次序）");
ok(q171("ch17-1-l1-13").answers[0].math === "4^5 = 1024", "L1-13 官方答案 4^5 = 1024（5 題 4 選項）");
ok(q171("ch17-1-l2-16").answers[0].math === "[40 + 30] - 60 = 70 - 60 = 10" &&
  /\\implies/.test(q171("ch17-1-l2-16").solution.steps[0].math),
  "L2-16(a) 反求重疊 = 10（用 \\implies 由方程推到答案）");
ok(q171("ch17-1-l2-24").answers[3].math === "13 \\times 13 \\times 2 = 338",
  "L2-24(d) 兩個次序都要計（338）");
ok(q171("ch17-1-l2-27").answers[1].math === "20000 - [150 \\times 50] = 20000 - 7500 = 12500",
  "L2-27(b) 反面計數 12500（要減的那一項用中括號括住）");
ok(q171("ch17-1-sm-31").answers[2].math.indexOf("108") >= 0 &&
  q171("ch17-1-sm-31").answers[1].math === "300 - [4 \\times 4 \\times 3 \\times 1] = 300 - 48 = 252",
  "SM-31(b)(c) 官方答案 252／108（先處理首位；352 的奇數項用中括號寫明）");
ok((q171("ch17-1-sm-31").solution.alt || []).length === 1,
  "SM-31 有官方 Alternative Solution（偶數分兩類）");
ok(q171("ch17-1-ct-32").answers[0].math === "n = 10", "CT-32 官方答案 n = 10");
ok(P171_DATA.sections.every((s) => s.questions.every((q) =>
  q.solution.steps.every((st) => (st.highlight || []).length === 1))),
  "17.1 每個步驟都有 highlight 重點框（資料層）");
ok(P171_DATA.sections.every((s) => s.questions.every((q) => (q.parts || []).length >= 1 &&
  q.parts.reduce((t, p) => t + p.marks, 0) === q.marks)),
  "17.1 每題都有 parts，而且分數加總＝題目分數（單一答案用 label \"\"）");
ok(P171_DATA.sections.every((s) => s.questions.every((q) => (q.solution.traps || []).length >= 1)),
  "17.1 每題都有常犯錯誤（traps）");
/* 三張教學卡各有互動示範（2026-09-30 老師拍板：全部都加） */
ok(P171_DATA.cards.map((c) => (c.demo || {}).type).join(",") === "menu,venn,code",
  "17.1 三張卡各有示範：menu、venn、code（實際 " +
  P171_DATA.cards.map((c) => (c.demo || {}).type).join(",") + "）");
const C171d = bootCss("quiz.html", "?c=ch17-1&p=0");
ok(C171d.$$(".cc .demo").length === 3, "17.1 總覽渲染出 3 個示範");
const vis171 = (rootNode, sel) => {
  const n = rootNode.querySelector(sel);
  return n ? C171d.ctx.window.getComputedStyle(n).display : "MISSING";
};

/* ── menu 示範：分類用加、分步用乘 ─────────────────────────────────────── */
const demoM = C171d.$('.demo[data-demo="menu"]');
const mBtns = demoM.querySelectorAll(".demo-ctrl .btn");
const mOpts = () => demoM.querySelectorAll(".menu-opt");
ok(mOpts().length === 9, "午餐示範有 2 + 4 + 3 = 9 個選項（實際 " + mOpts().length + "）");
ok(Array.from(mOpts()).every((b) => b.disabled), "第 1 步未可以揀（先睇餐牌）");
ok(vis171(demoM, '.menu-prod [data-lvl="2"]') === "none" &&
  vis171(demoM, '.menu-prod [data-lvl="3"]') === "none", "第 1 步只顯示 2，未顯示 × 4／× 3");
mBtns[1].click();
ok(demoM.getAttribute("data-step") === "1" && !mOpts()[0].disabled, "第 2 步開始可以揀");
ok(vis171(demoM, '.menu-prod [data-lvl="2"]') !== "none" &&
  vis171(demoM, '.menu-prod [data-lvl="3"]') === "none" &&
  /2× 4 =8/.test(demoM.querySelector(".menu-prod").textContent.replace(/\s+/g, " ")),
  "第 2 步：亮起 2 × 4 = 8");
mOpts()[0].click();
mOpts()[2].click();
mOpts()[7].click();
ok(demoM.querySelectorAll(".menu-opt-on").length === 3, "一前菜、一主菜、一飲品各自亮起");
ok(/沙律/.test(demoM.querySelector(".demo-count").textContent), "計數行寫出已砌出的套餐（沙律…）");
mBtns[1].click();
ok(demoM.getAttribute("data-step") === "2" && vis171(demoM, '.menu-prod [data-lvl="3"]') !== "none",
  "第 3 步：亮起 × 3 = 24（一路乘落去）");
ok(/2 × 4 × 3 = 24/.test(demoM.querySelector(".demo-eq").textContent) &&
  vis171(demoM, ".eqrow-total") === "none", "算式區已有 2 × 4 × 3 = 24（對照未出現）");
mBtns[1].click();
ok(demoM.getAttribute("data-step") === "3" && vis171(demoM, ".eqrow-total") !== "none" &&
  /2 \+ 4 \+ 3 = 9/.test(demoM.querySelector(".demo-eq").textContent),
  "第 4 步：對照「只買一樣」2 + 4 + 3 = 9");

/* ── venn 示範：加完要減重複 ───────────────────────────────────────────── */
const demoV = C171d.$('.demo[data-demo="venn"]');
const vBtns = demoV.querySelectorAll(".demo-ctrl .btn");
const vNum = (cls) => demoV.querySelector("." + cls).textContent;
const vX = () => demoV.querySelector(".venn-x").textContent;
const vTotal = () => demoV.querySelector(".venn-total").textContent;
ok(demoV.getAttribute("data-step") === "0" && vX() === "0" && vTotal() === "45" &&
  vis171(demoV, ".demo-count") === "none", "第 1 步：未重疊 20 + 25 = 45（未顯示重疊控制）");
ok(vNum("venn-onlyA") === "20" && vNum("venn-onlyB") === "25",
  "表內「只排球」20、「只籃球」25");
vBtns[1].click();
ok(demoV.getAttribute("data-step") === "1" && vX() === "15" && vTotal() === "30" &&
  vNum("venn-both") === "15" && vNum("venn-onlyA") === "5" && vNum("venn-onlyB") === "10",
  "第 2 步：15 人兩樣都會 → 20 + 25 − 15 = 30（圈內 5／15／10）");
const vPlus = demoV.querySelector('[data-venn="1"]');
const vMinus = demoV.querySelector('[data-venn="-1"]');
vPlus.click();
ok(vX() === "16" && vTotal() === "29", "按＋：重疊多 1 人，總數少 1（29）");
vMinus.click();
vMinus.click();
ok(vX() === "14" && vTotal() === "31", "按−：重疊少，總數回升（31）");
for (let i = 0; i < 10; i++) vPlus.click();
ok(vX() === "20" && vPlus.disabled && vTotal() === "25",
  "重疊最多 20（排球 20 人全部都識籃球）→ 總數 25");
vBtns[1].click();
ok(demoV.getAttribute("data-step") === "2" && /−／＋/.test(demoV.querySelector(".demo-guide").textContent),
  "第 3 步：提醒可以自己改重疊人數");
/* 用 2×2 表（唔用相交圓）：三格相加一定等於總數，唔會出現「唔相交但有共同元素」 */
ok(!demoV.querySelector(".venn-svg") && !!demoV.querySelector(".venn-tbl"),
  "重疊示範用 2×2 表，唔再用兩個圓");
const vCell = (cls) => Number(demoV.querySelector("." + cls).textContent);
ok(vCell("venn-both") + vCell("venn-onlyA") + vCell("venn-onlyB") === vCell("venn-total"),
  "2×2 表三格相加 = 總數（5 + 15 + 10 = 30）");
ok(demoV.querySelector(".venn-neither").textContent === "？",
  "「兩樣都唔會」那格係 ？：未知道全隊人數就計唔到（反面計數的起點）");
vMinus.click();
ok(vCell("venn-both") + vCell("venn-onlyA") + vCell("venn-onlyB") === vCell("venn-total"),
  "改變 x 之後，三格相加仍然等於總數（x = 13）");
vBtns[1].click();
ok(demoV.getAttribute("data-step") === "3" &&
  /40 \+ 30/.test(demoV.querySelector(".demo-eq").textContent) &&
  /= 60 → x =/.test(demoV.querySelector(".demo-eq").textContent) &&
  demoV.querySelector(".eqrow-total .eq-total").textContent === "10" &&
  vis171(demoV, ".eqrow-total") !== "none",
  "第 4 步：反求 40 + 30 − x = 60 → x = 10");
ok(vCell("venn-sumA") === 40 && vCell("venn-sumB") === 30 && vCell("venn-both") === 10 &&
  demoV.querySelector(".venn-neither").textContent === "0" &&
  demoV.querySelector(".venn-neither").classList.contains("venn-zero"),
  "第 4 步：2×2 表換成另一題（40／30），「兩樣都唔會」那格減到 0");
ok(vis171(demoV, ".venn-case") !== "none", "第 4 步顯示另一題的說明");
ok(vCell("venn-both") + vCell("venn-onlyA") + vCell("venn-onlyB") === vCell("venn-total"),
  "第 4 步：三格相加 = 總數（10 + 30 + 20 = 60）");

/* ── code 示範：可重複／不可重複／首位限制 ─────────────────────────────── */
const demoK = C171d.$('.demo[data-demo="code"]');
const kBtns = demoK.querySelectorAll(".demo-ctrl .btn");
const kSlots = () => demoK.querySelectorAll(".code-slot");
const kCounts = () => Array.from(demoK.querySelectorAll(".code-c")).map((n) => n.textContent).join("·");
const kKey = (d) => demoK.querySelector('[data-key="' + d + '"]');
ok(kSlots().length === 4 && kCounts() === "10·10·10·10" && demoK.getAttribute("data-prod") === "10000",
  "第 1 步：可重複 → 每位 10 個選擇，10^4 = 10000");
kKey(7).click();
kKey(7).click();
ok(kSlots()[0].textContent === "7" && kSlots()[1].textContent === "7" && kCounts() === "10·10·10·10",
  "可重複：同一數字可以再用，選擇數目不變");
kBtns[1].click();
ok(demoK.getAttribute("data-step") === "1" && kSlots()[0].textContent === "–" &&
  /10 × 9 × 8 × 7 = 5040/.test(demoK.querySelector(".demo-eq").textContent) && kCounts() === "10·9·8·7",
  "第 2 步：不可重複 → 10 · 9 · 8 · 7 = 5040");
kKey(7).click();
ok(kCounts() === "10·9·8·7" && demoK.getAttribute("data-prod") === "5040" &&
  kKey(7).disabled && kKey(7).classList.contains("code-key-off") && kSlots()[0].textContent === "7",
  "填了 7：7 變灰唔可以再按，密碼第一位是 7");
kBtns[1].click();
ok(demoK.getAttribute("data-step") === "2" && kCounts() === "9·10·10·10" &&
  /9 × 10 × 10 × 10 = 9000/.test(demoK.querySelector(".demo-eq").textContent),
  "第 3 步：四位數首位不可為 0 → 9 · 10 · 10 · 10 = 9000");
ok(kKey(0).disabled && !kKey(9).disabled, "首位限制：第一步 0 唔可以按（其餘 9 個都可以）");
kBtns[1].click();
kKey(2).click();
ok(demoK.getAttribute("data-step") === "3" && kCounts() === "5·5·4·3" &&
  demoK.getAttribute("data-prod") === "300" &&
  /5 × 5 × 4 × 3 = 300/.test(demoK.querySelector(".demo-eq").textContent),
  "第 4 步：用 2、4、5、6、8、0 → 5 · 5 · 4 · 3 = 300（跟 SM-31(a) 一致）");
ok(kKey(1).disabled && kKey(3).disabled && kKey(0).disabled === false,
  "這一題的數字池只有 0、2、4、5、6、8（1、3 唔可以按）");

/* 示範文字唔經 KaTeX：漏出 $ 或 \times 會原樣顯示（2026-09-30 修正過的顯示問題） */
ok(!/[\\$]/.test(demoM.textContent + demoV.textContent + demoK.textContent),
  "三個示範的文字冇 $ 或反斜線（唔會顯示 $20 + 25$、\\times 之類）");
ok(C171d.$$(".cc .demo").every((n) => !/[\\$]/.test(n.textContent)),
  "站內三張卡的所有示範文字同樣冇 $ 或反斜線");

const C171 = boot("quiz.html", "?c=ch17-1&p=0");
ok(C171.$$("#pagenav .pg").length === 38,
  "17.1 分頁列 = 總覽 + 37 題（實際 " + C171.$$("#pagenav .pg").length + "）");
ok(C171.$$("#pagenav .pg-sec").length === 6, "17.1 分頁列有 6 個分段標題");
ok(C171.$$(".cc").length === 3, "17.1 總覽渲染出 3 張教學卡");
ok(/分類/.test((C171.$(".cc .cc-title") || {}).textContent || ""), "第一張教學卡講分類／分步");
const ce1Page = boot("quiz.html", "?c=ch17-1&p=1");
ok(/36 students are learning Chinese chess/.test((ce1Page.$(".q-stem") || {}).textContent || ""),
  "17.1 第 1 題（CE1）渲染出題幹");
ok(ce1Page.$$(".q-parts li").length === 2, "CE1 有 (a)(b) 兩小題");
ok(ce1Page.$$(".sol-card .steps .step").length === 0, "CE1 題解預設收起（跟全站一致）");
ce1Page.$("#sol-toggle").click();
ok(ce1Page.$$(".sol-card .steps .step").length === 2, "CE1 展開題解後有 2 個步驟（逐步 marking）");
ok(/\[36 \+ 54\] - 15 = 90 - 15 = 75/.test((ce1Page.$(".answer-box") || {}).textContent || ""),
  "CE1 答案欄顯示 (b) 的 75（連中間值 90 − 15）");
/* 中括號與 \implies 都要真 KaTeX 過得（渲染失敗會出現 .katex-error） */
ok(ce1Page.$$(".katex-error").length === 0, "CE1 全部數式 KaTeX 渲染成功（含 [36 + 54]）");
const l216Page = boot("quiz.html", "?c=ch17-1&p=21", null, "show");
ok(!!l216Page.$('.q-card[data-qid="ch17-1-l2-16"]') &&
  l216Page.$$(".katex-error").length === 0 &&
  /\[40 \+ 30\] - 60 = 70 - 60 = 10/.test(l216Page.$(".answer-box").textContent),
  "L2-16 反求題渲染正常（\\implies 與中括號都有效）");
const l217Page = boot("quiz.html", "?c=ch17-1&p=22", null, "show");
ok(!!l217Page.$('.q-card[data-qid="ch17-1-l2-17"]') &&
  l217Page.$$(".katex-error").length === 0 &&
  /\[\(60 \+ 56\) - 45\]/.test(l217Page.$(".answer-box").textContent),
  "L2-17 雙層中括號 [(60 + 56) − 45] 渲染正常");
/* 中括號約定（2026-09-30 複檢後拍板）：先加後減／先乘再加／反面減一項，一律用 [ ] 寫明次序 */
/* 判斷題的「答案」是 Correct／Incorrect，算式在 note 與 step 內 */
ok(/\[5 \+ 2\] - 1 = 7 - 1 = 6/.test(q171("ch17-1-sc").solution.steps[1].math +
  q171("ch17-1-sc").answers[1].note.zh),
  "判斷題 (b) 的算式同樣用中括號（答案欄與題解一致）");
const BRACKETED = [
  ["ch17-1-ce1", "answers", 1],
  ["ch17-1-l1-4", "answers", 0],
  ["ch17-1-l1-6", "answers", 0],
  ["ch17-1-l1-7", "answers", 0],
  ["ch17-1-l2-15", "answers", 1],
  ["ch17-1-l2-16", "answers", 0],
  ["ch17-1-l2-17", "answers", 1],
  ["ch17-1-l2-18", "answers", 2],
  ["ch17-1-l2-20", "answers", 2],
  ["ch17-1-l2-26", "answers", 0],
  ["ch17-1-l2-27", "answers", 1],
  ["ch17-1-sm-31", "answers", 1]
];
ok(BRACKETED.every(([id, kind, i]) => /\[/.test(q171(id)[kind][i].math)),
  "先加後減／先乘再加／反面減一項的答案全部用中括號（" + BRACKETED.length + " 題）");

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
const swapBtn = demo.querySelector('[data-swap="ab"]');
const blockSeq = () => Array.prototype.slice.call(
  demo.querySelectorAll('[data-unit="AB"] .pnode')).map((n) => n.textContent).join(",");
const stageSeq = () => Array.prototype.slice.call(
  demo.querySelectorAll(".demo-stage .pnode")).map((n) => n.textContent).join(",");
ok(blockSeq() === "A,B", "大單位內起初係 A 然後 B");
swapBtn.click();
ok(swapBtn.getAttribute("aria-pressed") === "true" && blockSeq() === "B,A",
  "對調後：舞台大單位內真的變成 B 然後 A（唔係另外畫一組）");
ok(!demo.querySelector(".ichip"), "唔會另畫一組 A、B（框內直接用舞台嗰兩個圓圈）");
ok(/B\+A/.test(demo.querySelector(".order-txt").textContent),
  "「目前排列」同步顯示 B+A（實際 " + demo.querySelector(".order-txt").textContent + "）");
ok(/2! = 2/.test(demo.querySelector(".demo-innerline").textContent), "框內標註內部排列 2! = 2");
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
ok(demo.getAttribute("data-step") === "0" && stageSeq() === "A,B,C,D,E",
  "「重播」回到第 1 步並還原對調（大單位拆返 A、B）");
ok(demo.querySelector(".demo-eq").getAttribute("aria-live") === "polite",
  "算式列用 aria-live 播報目前步驟（螢幕閱讀器讀得到）");
const cssDemo = read("assets/style.css");
ok(/@media print\s*\{\s*\.demo \{ display: none/.test(cssDemo), "列印時收起示範");
ok(/prefers-reduced-motion[\s\S]{0,220}\.demo \.unit-block/.test(cssDemo),
  "系統「減少動態效果」時示範停用過場");

/* 插空法示範 */
const demoS = c0.$('.demo[data-demo="slot-in"]');
ok(!!demoS, "插空法卡有互動示範");
const sGuide = () => (demoS.querySelector(".demo-guide") || {}).textContent || "";
ok(/下一步/.test(sGuide()), "第 1 步有清晰指示：叫學生按「下一步」");
ok(!!demoS.querySelector(".demo-guide [data-shuffle]"), "指示列有「打亂男生」按鈕");
ok(demoS.querySelectorAll(".pnode-boy").length === 4, "舞台上有 4 位男生");
ok(demoS.querySelectorAll(".slot").length === 5, "4 位男生形成 5 個空隙（頭、中間 3 個、尾）");
const sBtns = demoS.querySelectorAll(".demo-ctrl .btn");
sBtns[1].click();
ok(demoS.getAttribute("data-step") === "1", "第 2 步：先排好 4 位男生");
ok(/4! = 24/.test(demoS.querySelector(".demo-eq").textContent), "顯示 4! = 24");
const boyAt = () => Array.prototype.slice.call(demoS.querySelectorAll(".unit"));
const firstBoy = boyAt()[0].getAttribute("data-boy");
boyAt()[0].click();
boyAt()[1].click();
ok(boyAt()[1].getAttribute("data-boy") === firstBoy, "男生一樣可以點兩下互換位置");
/* 號碼要跟「身份」：唔係嘅話換位後畫面完全一樣，學生以為冇反應 */
const boyLabels = () => boyAt().map((u) => u.querySelector(".pnode").textContent).join(",");
ok(boyLabels() === "2,1,3,4",
  "男生的號碼跟住身份郁（實際 " + boyLabels() + "，唔會永遠 1,2,3,4）");
ok(/打亂男生/.test(sGuide()), "第 2 步指示講明可以點男生換位或打亂");
/* 打亂男生（自動動畫；jsdom 唔等 timer → 手動 tick） */
const bSeq = () => boyAt().map((u) => u.getAttribute("data-boy")).join(",");
const cntBoys = () => parseInt(
  (demoS.querySelector(".demo-count .order-txt") || {}).textContent || "0", 10);
const beforeShuffle = bSeq();
const shBtn = demoS.querySelector(".demo-guide [data-shuffle]");
shBtn.click();
ok(demoS.getAttribute("data-shuffle") === "1" && shBtn.disabled === true,
  "按「打亂男生」會開始自動打亂（播放中鎖定按鈕）");
ok(demoS.__demoShuffle.playing() === true, "打亂動畫進行中");
demoS.__demoShuffle.stop();
ok(!demoS.getAttribute("data-shuffle") && shBtn.disabled === false, "打亂可以停得返");
demoS.__demoShuffle.tick();
ok(bSeq() !== beforeShuffle, "每 tick 會真的換位（" + beforeShuffle + " → " + bSeq() + "）");
demoS.__demoShuffle.tick();
ok(cntBoys() >= 2, "打亂後「男生已試排列」會累加（實際 " + cntBoys() + " / 24）");
demoS.__demoShuffle.stop();
sBtns[1].click();
ok(demoS.getAttribute("data-step") === "2", "第 3 步：5 個空隙亮起");
ok(demoS.querySelectorAll(".slot-on").length === 5, "5 個空隙同步亮起（頭、中間 3 個、尾）");
sBtns[1].click();
ok(demoS.getAttribute("data-step") === "3", "第 4 步：女生逐一放入空隙");
ok(/點一個虛線空隙/.test(sGuide()), "第 4 步明確指示：點空隙放入女生（唔會唔知做咩）");
ok(demoS.querySelectorAll(".hold-row .gchip").length === 3, "等候區有 3 位女生");
ok(demoS.querySelectorAll(".slot-live").length === 5, "5 個空隙都可以揀（第一位女生有 5 個選擇）");
const slotsAt = () => Array.prototype.slice.call(demoS.querySelectorAll(".slot"));
const choice = demoS.querySelector(".demo-choice");
slotsAt()[0].click();
ok(demoS.querySelectorAll(".slot-filled").length === 1 &&
  demoS.querySelector(".slot-filled .gchip").textContent === "1",
  "點空隙就放入一位女生");
ok(choice.getAttribute("data-placed") === "1", "放置數＝1（選擇數開始遞減）");
slotsAt()[1].click();
slotsAt()[2].click();
ok(demoS.querySelectorAll(".slot-filled").length === 3, "3 位女生放好，而且互不相鄰");
ok(choice.getAttribute("data-placed") === "3", "5 × 4 × 3 = 60 全部亮起");
slotsAt()[2].click();
ok(demoS.querySelectorAll(".slot-filled").length === 2, "再點最後一位可以拎返（只限最後放入）");
slotsAt()[2].click();
sBtns[1].click();
ok(demoS.getAttribute("data-step") === "4", "第 5 步：組裝公式");
ok(/P\(5,3\) = 60/.test(demoS.querySelector(".demo-eq").textContent) &&
  demoS.querySelector(".eq-total .eq").textContent === "1440",
  "最終公式 4! × P(5,3) = 24 × 60 = 1440");
sBtns[2].click();
ok(demoS.getAttribute("data-step") === "0" && demoS.querySelectorAll(".slot-filled").length === 0,
  "「重播」回到第 1 步並清空已放的女生");
ok(/4!/.test(read("data/src/ch17-2.json")) &&
  /1440/.test(read("data/src/ch17-2.json")),
  "插空法卡片正文已同步為 4 男 3 女（1440）");
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

/* 分組示範：有組名 vs 無組名；10 人分 4、4、2 只除 2! 而唔係 3! */
const demoG = p173Overview.$('.demo[data-demo="grouping"]');
ok(!!demoG, "分組卡有互動示範");
const gSegs = () => Array.prototype.slice.call(demoG.querySelectorAll(".demo-seg .btn"));
const gPanel = (i) => demoG.querySelectorAll(".demo-panel")[i];
ok(gSegs().length === 7, "示範有 7 個切換按鈕（情境 2 ＋ 情境一 2 ＋ 情境二 3）");
ok(!!demoG.querySelector(".ncr"), "組合記法用 C^n_r（sup/sub）顯示");
ok(/20/.test(gPanel(0).querySelector(".demo-eq").textContent),
  "情境一（有組名）：C(6,3) × C(3,3) = 20");
gSegs()[3].click();                                   /* 切到「籃球（無組名）」 */
ok(!!gPanel(0).querySelector(".demo-dup .dup-note"), "無組名時顯示「兩個寫法係同一場球賽」");
ok(/10/.test(gPanel(0).querySelector(".demo-eq").textContent) &&
  /2!/.test(gPanel(0).querySelector(".demo-eq").textContent),
  "無組名：÷ 2! 得 10");
const firstMember = () => gPanel(0).querySelectorAll(".gbox .gmember")[0].textContent;
const beforeSwap = firstMember();
gPanel(0).querySelector(".demo-dup .btn").click();
ok(firstMember() !== beforeSwap, "「示範對調」真的把兩組對調（" + beforeSwap + " → " + firstMember() + "）");
gSegs()[1].click();                                   /* 切到情境二 */
ok(gPanel(1).querySelectorAll(".gbox").length === 3, "情境二：10 人分成 3 個組別（4、4、2）");
ok(/3150/.test(gPanel(1).querySelector(".demo-eq").textContent),
  "指定營地（有標籤）：C(10,4) × C(6,4) × C(2,2) = 3150");
gSegs()[6].click();                                   /* 切到「純粹分堆」 */
ok(/1575/.test(gPanel(1).querySelector(".demo-eq").textContent), "純粹分堆：÷ 2! = 1575");
ok(demoG.querySelectorAll(".gbox-twin").length === 2 &&
  demoG.querySelectorAll(".gbox-single").length === 1,
  "兩個 4 人組標為會互相重複（twin），2 人組標為獨特（single）");
const dupTwo = gPanel(1).querySelector(".dup-note").textContent;
ok(/2!/.test(dupTwo) && /3!/.test(dupTwo), "說明只除 2!，唔使除 3!（2 人組人數獨特）");
const sizesTwo = () => Array.prototype.slice.call(gPanel(1).querySelectorAll(".gbox"))
  .map((b) => b.querySelectorAll(".gmember").length).join(",");
demoG.querySelector('[data-rand="2"]').click();
ok(sizesTwo() === "4,4,2", "「隨機再分一次」後仍然是 4、4、2（實際 " + sizesTwo() + "）");
ok(gPanel(1).querySelectorAll(".gmember").length === 10, "10 個人都分到組，無漏無重");
ok(/4, 4, 2|4、4、2/.test(read("data/src/ch17-3.json")), "分組卡正文已同步為 4、4、2 的例子");

/* ── 組合示範：揀 3 人會移落隊伍列；換次序會自動還原（5C3）───────────── */
const demoC = p173Overview.$('.demo[data-demo="combination"]');
ok(!!demoC, "組合卡有互動示範");
ok(demoC.querySelectorAll(".pick-row .unit-dot").length === 5, "候選列有 5 位學生");
ok(demoC.querySelectorAll(".team-row .unit-dot").length === 0, "第 1 步隊伍列空空（等學生自己揀）");
ok(!demoC.querySelector('[data-order="1"]'), "第 1 步未見 6 格，唔會出現「打亂次序」按鈕");
ok(/選 3 人/.test(demoC.querySelector(".demo-q").textContent), "題目寫明 5 人選 3 人");
ok(/3! = 6/.test(demoC.querySelector(".demo-guide").textContent + read("assets/demos.js")), "示範以 3! = 6 種寫法講解");
const cBtns = demoC.querySelectorAll(".demo-ctrl .btn");
const poolNums = () => Array.prototype.slice.call(demoC.querySelectorAll(".pick-row .pnode"))
  .map((n) => n.textContent).join(",");
const teamNums = () => Array.prototype.slice.call(demoC.querySelectorAll(".team-row .pnode"))
  .map((n) => n.textContent).join(",");
demoC.querySelector('[data-person="2"]').click();
ok(teamNums() === "2" && poolNums() === "1,3,4,5", "點學生 → 移落隊伍列（候選列同時少一個）");
demoC.querySelector('[data-person="4"]').click();
demoC.querySelector('[data-person="5"]').click();
ok(teamNums() === "2,4,5" && poolNums() === "1,3", "揀夠 3 人：隊伍 2,4,5、候選只剩 1,3");
ok(/1 \/ 10/.test(demoC.querySelector(".demo-count").textContent), "「已找到隊伍」+1");
demoC.querySelector('[data-team="4"]').click();
ok(teamNums() === "2,5" && /4/.test(poolNums()), "點隊伍成員 → 放返候選列");
cBtns[1].click();
ok(demoC.getAttribute("data-step") === "1" && teamNums() === "2,5,1",
  "第 2 步：保留已揀嘅人再補齊 3 個（2,5 → 2,5,1）");
const orderCards = () => Array.prototype.slice.call(demoC.querySelectorAll(".ord-row .ord-card"));
ok(orderCards().length === 6, "列出 3! = 6 種寫法");
ok(orderCards().filter((c) => c.classList.contains("ord-on")).length === 1 &&
  orderCards().filter((c) => c.classList.contains("ord-on"))[0].getAttribute("data-perm") === "2-5-1",
  "6 種寫法之中，目前次序（2-5-1）會亮起");
ok(!demoC.querySelector(".order-note"), "已移除「自動排返 1,2,3」那句話（語意不明）");
const beforeOrder = teamNums();
const orderBtn = demoC.querySelector('[data-order="1"]');
ok(!!orderBtn, "去到出現 6 格時，才出現「打亂次序」按鈕");
const litNow = () => {
  const on = orderCards().filter((c) => c.classList.contains("ord-on"));
  return on.length === 1 ? on[0].getAttribute("data-perm") : "（" + on.length + " 格亮起）";
};
orderBtn.click();
const afterOrder = teamNums();
ok(afterOrder !== beforeOrder, "按下會隨機換一個次序（" + beforeOrder + " → " + afterOrder + "）");
ok(afterOrder.split(",").slice().sort().join(",") === beforeOrder.split(",").slice().sort().join(","),
  "換嘅只係次序，3 個人一樣（仍然係同一隊）");
ok(litNow() === afterOrder.replace(/,/g, "-"),
  "下面對應嘅一格會亮起（亮起 " + litNow() + "，目前 " + afterOrder + "）");
orderBtn.click();
ok(litNow() === teamNums().replace(/,/g, "-"), "再按一次：亮起嘅格跟住新次序走");
cBtns[1].click();
ok(demoC.getAttribute("data-step") === "2" &&
  /5 × 4 × 3 = 60/.test(demoC.querySelector(".demo-eq").textContent), "第 3 步：有次序 5 × 4 × 3 = 60");
ok(!!demoC.querySelector('[data-order="1"]'), "第 3 步 6 格仍然亮起，按鈕仍然可用");
cBtns[1].click();
ok(demoC.getAttribute("data-step") === "3" &&
  demoC.querySelectorAll(".ord-row .ord-card.ord-dim").length === 6 &&
  !!demoC.querySelector(".ord-merged"), "第 4 步：6 種寫法一齊變灰並合併成一隊");
ok(!demoC.querySelector('[data-order="1"]'), "第 4 步（6 格變灰合併）就收起「打亂次序」按鈕");
ok(teamNums() === "1,2,5", "最後隊伍回歸單一次序（由細至大：" + teamNums() + "）");
ok(/60 ÷ 3! =/.test(demoC.querySelector(".demo-eq").textContent) &&
  demoC.querySelector(".eq-total .eq").textContent === "10", "算式 60 ÷ 3! = 10");
cBtns[2].click();
ok(demoC.getAttribute("data-step") === "0" && teamNums() === "" &&
  (demoC.querySelector(".demo-count .order-txt") || {}).textContent === "",
  "「重播」回到第 1 步：隊伍清空、計數清空");

/* ── 路徑示範：路徑＝揀邊幾步向東 ───────────────────────────────────────── */
const demoP = p173Overview.$('.demo[data-demo="path"]');
ok(!!demoP, "路徑卡有互動示範");
const pChips = () => demoP.querySelectorAll(".pstep");
ok(pChips().length === 7, "7 個步驟格");
ok(Array.from(pChips()).map((c) => c.textContent).join("") === "ENENENE",
  "預設 4 個 E、3 個 N（一格一格已排好）");
const pPoly = () => demoP.querySelector(".grid-path");
ok(pPoly().getAttribute("data-seq") === "ENENENE", "預設示範路徑＝E N E N E N E");
ok(!pPoly().getAttribute("points"), "第 1 步未畫路徑");
ok(Array.from(pChips()).every((c) => c.disabled), "第 1 步未可以拖（路線未出現）");
const pBtns = demoP.querySelectorAll(".demo-ctrl .btn");
pBtns[1].click();
ok(demoP.getAttribute("data-step") === "1" && !!pPoly().getAttribute("points"), "第 2 步：畫出示範路徑");
ok(!pChips()[0].disabled && pChips()[0].classList.contains("pstep-move"), "第 2 步開始可以拖動調位");
ok(/1 \/ 35/.test(demoP.querySelector(".demo-count").textContent), "已找到路線 1 / 35");
/* 語言中立：格仔文字中英模式都係 E／N，唔會出「東／北」 */
ok(!/東|北/.test(Array.from(pChips()).map((c) => c.textContent).join("")),
  "步驟格只用 E／N（英文模式唔會顯示中文）");
ok(!/\? "東" : "北"/.test(read("assets/demos.js")), "格仔內容唔再寫死「東／北」（一律 E／N）");
/* 鍵盤調位＝真實使用者路徑（jsdom 冇 pointer 事件，用 ←→ 驗同一個 moveChip） */
const pKey = (node, key) => node.dispatchEvent(new node.ownerDocument.defaultView.KeyboardEvent("keydown",
  { key, bubbles: true, cancelable: true }));
pKey(pChips()[0], "ArrowRight");
ok(pPoly().getAttribute("data-seq") === "NEENENE", "按 → 把第 1 格移到第 2 位（N E E N E N E）");
ok(/2 \/ 35/.test(demoP.querySelector(".demo-count").textContent), "新次序＝新路線，計數加到 2 / 35");
ok(pChips()[0].textContent === "N" && pChips()[1].textContent === "E", "格仔文字跟住次序更新");
pKey(pChips()[1], "ArrowLeft");
ok(pPoly().getAttribute("data-seq") === "ENENENE" && /2 \/ 35/.test(demoP.querySelector(".demo-count").textContent),
  "移返原位：路線變回 ENENENE，但同一條路線唔會重複計（仍然 2 / 35）");
ok(Array.from(pChips()).filter((c) => c.textContent === "E").length === 4 &&
  Array.from(pChips()).filter((c) => c.textContent === "N").length === 3,
  "無論點調位，永遠保持 4 個 E、3 個 N（一定合法）");
/* 真正嘅拖曳（pointer）：jsdom 冇佈局，這裡假造每格位置，驗同一段拖動邏輯
   （真實瀏覽器另有 headless Chrome 驗證，見 docs/UI-DESIGN-HANDOFF.md） */
const pRow = demoP.querySelector(".path-steps");
const pSlot = (i) => ({ left: i * 34 + 2, top: 0, right: i * 34 + 32, bottom: 30, width: 30, height: 30 });
pRow.getBoundingClientRect = () => ({ left: 0, top: 0, right: 238, bottom: 30, width: 238, height: 30 });
Array.from(pChips()).forEach((c, i) => { c.getBoundingClientRect = () => pSlot(i); });
const pMv = (target, type, i, y) => {
  const r = pSlot(i);
  target.dispatchEvent(new (target.ownerDocument.defaultView.MouseEvent)(type,
    { clientX: r.left + 15, clientY: y == null ? 15 : y, bubbles: true, cancelable: true }));
};
pMv(pChips()[0], "pointerdown", 0);
ok(pRow.classList.contains("dragging") && pPoly().classList.contains("no-draw"),
  "開始拖：加了 dragging，並停用畫線動畫（跟住手指即時更新）");
pMv(pRow, "pointermove", 3);
ok(pPoly().getAttribute("data-seq") === "NENEENE",
  "拖第 1 格到第 4 位（E N E N E N E → N E N E E N E）");
ok(/3 \/ 35/.test(demoP.querySelector(".demo-count").textContent), "拖出新路線 → 3 / 35");
const pSeqBeforeFar = pPoly().getAttribute("data-seq");
pMv(pRow, "pointermove", 3, 400);
ok(pPoly().getAttribute("data-seq") === pSeqBeforeFar, "拖到遠離整行（y=400）唔會亂跳");
pMv(pRow, "pointerup", 3);
ok(!pRow.classList.contains("dragging") && !pPoly().classList.contains("no-draw"), "放手後還原狀態");
pBtns[1].click();
ok(demoP.getAttribute("data-step") === "2", "第 3 步：可以自己拖路線");
ok(/3 \/ 35/.test(demoP.querySelector(".demo-count").textContent), "已找到路線繼續累計（3 / 35）");
pKey(pChips()[0], "ArrowRight");
ok(pPoly().getAttribute("data-seq") === "ENNEENE" && /4 \/ 35/.test(demoP.querySelector(".demo-count").textContent),
  "第 3 步仍然可以調位，再多一條路線（4 / 35）");
pBtns[1].click();
ok(demoP.getAttribute("data-step") === "3" &&
  /C\(7,3\)/.test(demoP.querySelector(".demo-eq").textContent), "第 4 步：C(7,4) = C(7,3) = 35");
ok(/7 × 6 × 5 × 4 = 840/.test(demoP.querySelector(".demo-eq").textContent) &&
  /840 ÷ 4! = 35/.test(demoP.querySelector(".demo-eq").textContent),
  "下圖有數字例子（7 × 6 × 5 × 4 = 840 → ÷ 4! = 35，同其他示範一致）");
/* 英文模式（真 CSS 驗證）：步驟格一律 E／N，唔會殘留中文「東／北」
   （示範頁的掛載在 inline script；jsdom 唔會行 inline script，所以這裡照做一次） */
const pEn = bootCss("demos/path.html", "?step=1");
pEn.ctx.window.S5A_DEMO.path(pEn.$("#demo-slot"), { step: 1 });
pEn.doc.body.setAttribute("data-lang", "en");
const pEnSel = '.demo[data-demo="path"]';
const pEnChips = pEn.$$(pEnSel + " .pstep");
ok(cssDisp(pEn, pEnSel + " .pstep") !== "none", "英文模式：步驟格仍然顯示");
ok(pEnChips.length === 7 && pEnChips.every((c) => /^[EN]$/.test(c.textContent)),
  "英文模式：7 格只有 E／N（唔會顯示東／北）");
ok(cssDisp(pEn, pEnSel + " .l-zh") === "none" && cssDisp(pEn, pEnSel + " .l-en") !== "none",
  "英文模式：中文說明收起、英文說明顯示");
const pEnCount = pEn.$(pEnSel + " .demo-count");
ok(!!pEnCount && /Paths found/.test(pEnCount.textContent) && /1 \/ 35/.test(pEnCount.textContent),
  "英文模式：計數行用英文（Paths found 1 / 35）");
ok(/4 步向東、3 步向北/.test(read("data/src/ch17-3.json")), "路徑卡正文已加入 4 東 3 北的例子");

/* ── 至少／至多示範：反面計數 ──────────────────────────────────────────── */
const demoX = p173Overview.$('.demo[data-demo="complement"]');
ok(!!demoX, "至少／至多卡有互動示範");
ok(demoX.querySelectorAll(".pdot").length === 13 &&
  demoX.querySelectorAll(".pdot-boy").length === 6 &&
  demoX.querySelectorAll(".pdot-girl").length === 7, "舞台上 6 男 7 女共 13 點");
const xBtns = demoX.querySelectorAll(".demo-ctrl .btn");
xBtns[1].click();
ok(demoX.getAttribute("data-step") === "1" && demoX.querySelectorAll(".case-row").length === 4,
  "第 2 步：直接分類 4 個 case");
ok(/1260/.test(demoX.querySelector(".case-sum").textContent), "4 個 case 合共 1260");
demoX.querySelector('[data-case="d1"]').click();
ok(demoX.querySelector('[data-case="d1"]').classList.contains("case-on") &&
  demoX.querySelectorAll(".pdot-on").length === 5, "點 case → 亮起該 5 人（1 男 4 女）");
demoX.querySelector('[data-case="d1"]').click();
ok(demoX.querySelectorAll(".pdot-on").length === 0, "再點一次取消標示");
xBtns[1].click();
ok(demoX.getAttribute("data-step") === "2" && demoX.querySelectorAll(".case-row").length === 2,
  "第 3 步：反面只有 2 個唔合法 case");
ok(/27/.test(demoX.querySelector(".case-sum").textContent), "全男 6 + 全女 21 = 27");
ok(/1287/.test(demoX.querySelector(".demo-eq").textContent) &&
  demoX.querySelector(".eq-total .eq").textContent === "1260", "1287 − 6 − 21 = 1260");
xBtns[1].click();
ok(demoX.getAttribute("data-step") === "3" &&
  /唔可以/.test(demoX.querySelector(".demo-guide").textContent), "第 4 步提醒唔可以用 anchor-first 重複計");
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
