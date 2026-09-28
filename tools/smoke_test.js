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
const indexJs = read("data/index.js");
const figuresJs = read("data/figures.js");
const dataFiles = fs.readdirSync(path.join(root, "data"))
  .filter((f) => /^[a-z0-9-]+\.js$/.test(f) && f !== "index.js" && f !== "figures.js");

const PROG_KEY = "s5a-progress:v1";
let fails = 0;
const ok = (cond, label) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + label);
  if (!cond) fails++;
};

function boot(page, search, storage) {
  const html = read(page);
  const dom = new JSDOM(html, {
    url: "https://example.test/" + page + (search || ""),
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const ctx = dom.getInternalVMContext();
  ctx.window.confirm = () => true;
  const scrolls = [];
  ctx.window.scrollTo = (x, y) => { scrolls.push(y); };
  if (storage) ctx.window.localStorage.setItem(PROG_KEY, storage);
  vm.runInContext(katexJs, ctx, { filename: "katex.min.js" });
  vm.runInContext(autoRenderJs, ctx, { filename: "auto-render.min.js" });
  vm.runInContext(indexJs, ctx, { filename: "index.js" });
  vm.runInContext(figuresJs, ctx, { filename: "figures.js" });
  dataFiles.forEach((f) => vm.runInContext(read("data/" + f), ctx, { filename: f }));
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
ok(home.$$(".part-btn").length === INDEX.parts.length,
  "首頁列出 " + INDEX.parts.length + " 份測驗（實際 " + home.$$(".part-btn").length + "）");
ok(/共 \d+ 份測驗/.test((home.$("#site-stats") || {}).textContent || ""), "顯示全站統計");
ok(!!home.$(".part-btn .ring"), "每份測驗都有進度環");
ok(/11 題 · 38 分/.test((home.$(".part-btn .t-meta") || {}).textContent || ""), "顯示題數與分數");
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

// 作答：先答錯，再答對
const q1b = boot("quiz.html", "?c=ch10-test&p=1");
const wrongBtn = q1b.$$(".opt").find((b) => b.dataset.opt === "C");
wrongBtn.click();
ok(q1b.$$(".opt.wrong").length === 1, "答錯的選項標成 wrong");
ok(q1b.$$(".opt.correct").length === 1, "正確答案同時標成 correct");
ok(q1b.store().picked["ch10-A1"] === "C", "作答記錄寫入 localStorage");
ok(!q1b.store().done || !q1b.store().done["ch10-A1"], "答錯不會標記為已掌握");
const q1c = boot("quiz.html", "?c=ch10-test&p=1");
q1c.$$(".opt").find((b) => b.dataset.opt === "B").click();
ok(q1c.store().done["ch10-A1"] === true, "答對會標記為已掌握");
ok(q1c.$$("#pagenav .pg")[1].classList.contains("done"), "分頁列的 A1 打勾");

// 語言與題解開關
q1c.$$(".langbar button")[0].click();
ok(q1c.lang() === "zh", "切回中文");
q1c.$("#sol-toggle").click();
ok(q1c.doc.body.getAttribute("data-sol") === "hide", "收起題解：body[data-sol=hide]");
ok(/顯示題解/.test(q1c.$("#sol-toggle").textContent), "按鈕文字變成「顯示題解」");
ok(!!q1c.$(".sol-hint"), "收起時題目卡有提示（做完才對答案）");
ok(!!q1c.$(".sol-card"), "題解卡仍在 DOM（由 CSS 收起，切回即見）");
q1c.$("#sol-toggle").click();
ok(q1c.doc.body.getAttribute("data-sol") === "show", "再按一次顯示題解");

/* ── 4. 測驗頁：長題目（B3）──────────────────────────────────────────── */
console.log("\n== 測驗頁（B3 長題目）==");
const b3 = boot("quiz.html", "?c=ch10-test&p=8");
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
const b4p = boot("quiz.html", "?c=ch10-test&p=9");
ok(!!b4p.$('.q-card[data-qid="ch10-B4"]'), "渲染出 B4 題目卡");
ok(b4p.$$(".sol-card .steps .step").length === 9, "B4 有 9 個步驟（含方法二）");
ok(/a\s*=\s*1/.test(b4p.$$(".sol-card .steps .step")[0].textContent),
  "B4(a) 第 1 步講明 $x^2$ 係數 a = 1");
ok(b4p.$$(".sol-card .steps .step").some((s) => /對稱軸公式/.test(s.textContent)),
  "B4(a) 有「方法二 · 對稱軸公式反推」");

/* ── 5. 加分題：逐步出圖 ─────────────────────────────────────────────── */
console.log("\n== 測驗頁（加分題）==");
const bo = boot("quiz.html", "?c=ch10-test&p=11");
ok(!!bo.$('.q-card[data-qid="ch10-bonus"]'), "渲染出加分題");
ok(/加分題/.test((bo.$(".q-bonus") || {}).textContent || ""), "有加分題標籤");
ok(bo.$$(".sol-card .fig svg").length === 3, "三個情況各有一幅圖（實際 " +
  bo.$$(".sol-card .fig svg").length + "）");
ok(bo.$$(".sol-card .steps .step").length === 8, "加分題有 8 個解題步驟");

/* ── 6. 全部題目都要有題解、圖、答案 ─────────────────────────────────── */
console.log("\n== 全卷體檢 ==");
const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((p) => boot("quiz.html", "?c=ch10-test&p=" + p));
ok(all.every((t) => t.$$(".sol-card").length === 1), "每題都有題解卡");
ok(all.every((t) => t.$$(".sol-card .steps .step").length >= 3), "每題至少 3 個步驟");
ok(all.every((t) => !/\$/.test(t.$(".q-stem").textContent)), "所有題幹都已渲染（無殘留 $）");
ok(all.every((t) => !!t.$(".q-stem .l-zh") && !!t.$(".q-stem .l-en")), "所有題幹都有中英兩版");
ok(all.every((t) => !!t.$(".sol-card .tip")), "每題都有「帶得走的技巧」");
ok(all.every((t) => t.$$(".sol-card .trap").length >= 3), "每題至少 3 個錯誤提示");
ok(all.every((t) => t.body === undefined || t.doc.body.getAttribute("data-lang")),
  "每頁都有語言設定");

const figs = JSON.parse(figuresJs.slice(figuresJs.indexOf("{"), figuresJs.lastIndexOf("}") + 1));
ok(Object.keys(figs).length === 13, "圖共 13 幅（實際 " + Object.keys(figs).length + "）");
ok(Object.keys(figs).every((k) => /<svg [^>]*viewBox/.test(figs[k].svg)),
  "每幅圖都是合法的 SVG（有 viewBox）");
ok(Object.keys(figs).every((k) => (figs[k].caption || {}).zh && (figs[k].caption || {}).en),
  "每幅圖都有中英說明");

/* ── 7. 進度記錄（新開頁面仍記得）────────────────────────────────────── */
console.log("\n== 進度 ==");
const saved = JSON.stringify({ done: { "ch10-A1": true, "ch10-A2": true }, picked: { "ch10-A1": "B" } });
const back = boot("index.html", "", saved);
ok(/已掌握 18%/.test((back.$(".part-btn .t-meta") || {}).textContent || ""),
  "首頁顯示已掌握百分比（2/11 = 18%）");
ok(back.$$(".part-btn .ring.full").length === 0, "未完成時進度環不是 full");

console.log("\n" + (fails ? "有 " + fails + " 項未通過" : "全部通過 all smoke tests passed"));
process.exit(fails ? 1 : 0);
