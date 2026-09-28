/* 預覽「複製提問 Prompt」會生成甚麼內容（給老師檢查用）
 *
 * 用法：
 *   node tools/preview_prompt.js                 # 預設 ch10-A1（中文）
 *   node tools/preview_prompt.js ch10-B3 en      # 指定題目與語言（zh | en | both）
 * jsdom 不在本機時：$env:NODE_PATH="C:\Code Buddy\DSEPass\node_modules"
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function need(name) {
  try {
    return require(name);
  } catch (e) {
    for (const dir of (process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean)) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return require(p);
    }
    throw e;
  }
}
const { JSDOM } = need("jsdom");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const indexJs = read("data/index.js");
const INDEX = JSON.parse(indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1));

const qid = process.argv[2] || "ch10-A1";
const lang = process.argv[3] || "zh";

function boot(search) {
  const dom = new JSDOM(read("quiz.html"), {
    url: "https://example.test/quiz.html" + search,
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const ctx = dom.getInternalVMContext();
  ctx.window.confirm = () => true;
  vm.runInContext(read("vendor/katex/katex.min.js"), ctx);
  vm.runInContext(read("vendor/katex/auto-render.min.js"), ctx);
  vm.runInContext(indexJs, ctx);
  vm.runInContext(read("data/figures.js"), ctx);
  vm.runInContext(read("data/ch10-test.js"), ctx);
  vm.runInContext(read("assets/app.js"), ctx);
  ctx.window.localStorage.setItem("s5a-lang", lang);
  ctx.window.__S5A_START();
  return { ctx, doc: dom.window.document, $: (s) => dom.window.document.querySelector(s),
           $$: (s) => Array.from(dom.window.document.querySelectorAll(s)) };
}

let found = null;
for (let p = 1; p <= 20 && !found; p++) {
  const t = boot("?c=ch10-test&p=" + p);
  if (t.$('.q-card[data-qid="' + qid + '"]')) found = t;
}
if (!found) {
  console.log("找不到題目 " + qid);
  process.exit(1);
}
found.$("[data-pm-main]").click();
console.log("──────── " + qid + "（" + lang + "）────────");
console.log(found.$("[data-pm-preview]").value);
