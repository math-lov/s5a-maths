# 5A 數學溫習站 · 加新內容交接文件

> 撰寫：2026-09-28｜對象：下一個 chat／下一位老師
> 先讀 `README.md`（設計、S1–S9 檢查器、視覺風格）；本檔只集中「**加新內容**」的實務。

## 0. 一句話流程

改 `data/src/*.json` → `python tools/build.py`（**0 錯 0 警**）→ 有改圖就 `preview_figures.py` →
`node tools/smoke_test.js`（**all smoke tests passed**）→ `git add/commit/push` → 約 1 分鐘上線。

## 1. 站點資料

| 項目 | 值 |
|---|---|
| 線上 | `https://math-lov.github.io/s5a-maths/` |
| Repo | `https://github.com/math-lov/s5a-maths` |
| 本機 | `C:\Code Buddy\s5a-maths`（舊文件寫 `C:\Code Buddy\S5A\site`，**已過時**） |
| 進度 | 只存學生瀏覽器：`localStorage` key = `s5a-progress:v1` |
| 風格 | 每題一頁；題目英文（跟試卷）；題解中英對照可切換 |

## 2. 檔案地圖（只改 `data/src/`）

| 檔案 | 可否手改 |
|---|---|
| `data/src/site.json` | ✅ 網站資料 ＋ 測驗清單（`parts`、`stats`） |
| `data/src/<id>.json`（例 `ch10-test.json`） | ✅ 題目與題解（主要工作檔） |
| `data/src/figures.json` | ✅ 圖形規格（`numline`／`graph`） |
| `data/src/prompt-templates.json` | ✅ AI 提問模板（改一次＝全站生效） |
| `data/*.js`（`index.js`／`figures.js`／`<id>.js`） | ❌ **生成檔**，下次 build 會覆蓋 |
| `data/raw/<id>-source.md` | ✅ 原文／官方評分／逐題驗算記錄 |
| `index.html`／`quiz.html`／`assets/` | ⚠️ 只有改版面或行為才動 |

## 3. 加一份新測驗（5 步）

1. 試卷抽文字稿 → `data/raw/<id>-source.md`（記下**官方評分**與**逐題驗算**；`.doc/.docx` 抽取見 `tools/doc-extract/README.md`）
2. 新增 `data/src/<id>.json`（照 `ch10-test.json` 的結構）
3. `data/src/site.json` 的 `parts` 加一項 —— `id` 必須同檔名一樣、`stats.questions` 要對得上
4. 有新圖 → 寫入 `data/src/figures.json`
5. 跑齊檢查（§5）→ **同步更新 `tools/smoke_test.js` 的頁數／題數斷言（只能加，不要刪舊的）**

## 4. 題目 JSON 骨架（真實欄位，跟住填）

```json
{
 "id": "ch11-A1", "code": "A1", "type": "mc", "marks": 2, "difficulty": 1,
 "stem": { "en": "…（英文，跟試卷）", "zh": "…（中文）" },
 "keywords": [ { "en": "closed / open circle", "zh": "實心圓點＝包括該數" } ],
 "figures": ["numline-a1"],
 "options": { "A": "$…$", "B": "$…$", "C": "$…$", "D": "$…$" },
 "answer": "B",
 "answers": [ { "math": "x \\ge 4", "note": { "zh": "即選項 B", "en": "Option B" } } ],
 "solution": {
  "steps": [
   { "title": { "zh": "第 1 步 · 讀圖…", "en": "Step 1 · Read the figure…" },
     "math": "x \\ge 4",
     "zh": "…（中文詳解 ≥ 8 字，要講「為甚麼」）",
     "en": "…",
     "marking": "(1M)" }
  ],
  "traps": [ { "opt": "A", "zh": "…", "en": "…" } ],
  "tip": { "zh": "帶得走的技巧", "en": "…" }
 }
}
```

* **MC**：`options` 一定 A–D 四個、`answer` 必須是其中一個、`traps` 只可指向**錯**選項。
* **長題**：`parts[]`（每個 `marks`，加總＝題目 `marks`）＋ 同樣的 `solution.steps`（`marking` 加總亦要對得上）。
* 純數學式直接寫字串（`"$2x+3>3x-1$"`）；**有文字的選項**寫成 `{"en": "...", "zh": "..."}`。

## 5. 檢查（加完內容必跑）

```powershell
cd "C:\Code Buddy\s5a-maths"

python -X utf8 tools/build.py            # 檢查 + 生成 data/*.js → 要 0 錯誤 0 警告
python -X utf8 tools/build.py --check    # 只想檢查，不寫檔

python -X utf8 tools/preview_figures.py  # 改過 figures.json／make_figures.py 才需要 → tools/_preview/*.png 肉眼睇

$env:NODE_PATH = "C:\Code Buddy\DSEPass\node_modules"
node tools\smoke_test.js                 # 要見到 all smoke tests passed
node tools/preview_prompt.js ch10-A1 zh  # 想睇某題生成的 AI 提問內容
```

改動前想保險：`python tools/backup.py 改題解前`（複製到 `backups/`，不入 git）。

## 6. 內容規則（2026-09-28 老師指示；四個站共用）

1. **數式一律英文** —— `math` 欄位與散文中的 `$…$` 內**不可有中文**（「或」寫 `\text{or}`）；
   中文只出現在**解說文字**。
2. **數式不可以過長** —— 一行過長要分行：先按 `;` 分段（例如 (a)／(b) 的答案各自一行），
   再在 `=`／`\Rightarrow` **之前**斷行，運算符留在續行開頭（每行 ≤ 約 44 顯示字）。
3. **不標籤學生** —— 不寫「補底／落後／後進生／基礎較弱」等字眼；改為描述做法
   （例：「常見直覺：…」「最穩做法」「請把步驟講得夠細」）。
4. **不可用 Markdown `**`**（前端不 render，會原樣顯示）。

> ⚠️ 規則 1–4 目前**靠人手遵守** —— `tools/build.py` 的 S1–S9 未覆蓋這四條。
> 如要加自動防線，可參考 `DSEPass/tools/learn_check.py` 的 **I9（`**`）／I10（數式內中文）／I11（單行過長）**做法。

## 7. 發佈

```powershell
git add -A; git commit -m "ch11：加第 11 章測驗檢討"; git push
```

GitHub Pages 約 1 分鐘生效；學生第一次要 **Ctrl+F5**。

## 8. 四個站的關係（首頁有互相跳轉列）

| 站 | 網址 |
|---|---|
| 每日三題 Daily 3 | `https://math-lov.github.io/daily.math/` |
| 自學追上站 DSE Pass | `https://math-lov.github.io/dse-pass/` |
| **5A 數學溫習站**（本站） | `https://math-lov.github.io/s5a-maths/` |
| Endeavour 研習站 | `https://math-lov.github.io/endeavour/` |

⚠️ **不要連去 `https://math-lov.github.io/daily.math/learn/`** —— 該站計劃砍掉重做。
