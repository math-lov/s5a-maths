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

### 3b. 課本練習（Classwork：章 → 節）

網站另有「課本練習」類別，結構是 **章 → 節**（節數可隨時加減，不一定是 3 節）：

| 檔案／位置 | 要改甚麼 |
|---|---|
| `data/src/site.json` 的 `parts` | 每一「節」一項：`group` 設 `"classwork"`、`chapter` 設章 id（例 `ch17`）；`stats.questions`／`stats.marks` 要對 |
| `data/src/site.json` 的 `classwork.chapters` | 章清單；每章有 `sections`（`part` 指向 `parts` 的 id，未上線寫 `null`，可加 `short` 做頂欄麵包屑） |
| `data/src/<節id>.json`（例 `ch17-2.json`） | 該節題目；`sections` 就是書內分段（課堂例題／判斷題／Level 1／Level 2…），每段可加 `short`（分頁列短標題） |

* 首頁只顯示「章」；點進去是 `chapter.html?ch=<章id>`，再選節（`quiz.html?c=<節id>`）。
* 課本練習**沒有官方評分**：題目分數與 `(1M)/(1A)` 由老師自擬，但 `parts[].marks` 加總＝題目分數、`steps[].marking` 加總亦要對得上（`build.py` S2）。
* 新增一節＝加一個 `parts` 項、加一個 `data/src/<節id>.json`、把 `part` 填回 `classwork.chapters[].sections`；**不用改 HTML／JS**。

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
* **判斷題**（`type: "tf"`）：用 `parts[]` 逐小題列出；`answers[]` 每個小題要有 `part`、`tf`（`true`＝正確／`false`＝錯誤）同 `math`（顯示用，例 `\text{Correct}`）。
  前端會逐小題出「正確／錯誤」兩個按鈕（跟 MC 一樣：錯一次先再試，錯第二次才揭示）；7 小題全對才把整題標記為已掌握。`build.py` S12 會檢查每個小題都有 `tf`。
* **另一個做法（參考）**（選填 `solution.alt`）：`[{ "name": {"zh": "...", "en": "..."}, "zh": "...", "en": "..." }]`。
  前端用 `<details>` 摺疊、**預設收起**、放在題解卡最後（不作為第一解法），標題「另一個做法（參考）」。`build.py` S13 檢查有 `name` 及中英解說（zh ≥ 8 字）。
  用途：計算機核對、坐標法／向量法等補充角度。
* **評分標記風格**：`steps[].marking` 可以在同一步寫多過一個標記（例 `(1M)(1A)`），也可以逐步拆開（一步 `(1M)`、下一步 `(1A)`）。
  兩種都接受 —— **唯一硬要求**是 `steps[].marking` 加總＝題目 `marks`（S2 會查）。現時 `ch17-2` 的 CE1／CE3／CE4 用「逐步拆開」，其餘題目用「串接」，這是老師 2026-09-28 確認的現狀，唔算遺漏。
* **教學卡**（選填，`<節>.json` 頂層 `cards[]`）：顯示在**該節總覽頁（p=0）**，排在簡介卡之後。
  ```json
  "cards": [
    { "id": "ch17-c02", "topic": "ch17-2",
      "title": { "zh": "...", "en": "..." },
      "body":  { "zh": "...用 {{math:0}} 插入顯示數式...", "en": "..." },
      "math":  [ "\\text{Total}\n= (\\text{...})\n\\times (\\text{...})" ],
      "demo":  { "type": "tie-up",
                 "caption": { "zh": "示範用數字：…", "en": "Demo figures: …" } },
      "warn":  { "zh": "常犯錯誤…", "en": "..." },
      "vocab": [ { "zh": "綑綁法", "en": "Bundling method" } ] }
  ]
  ```
  * **互動示範**（選填 `card.demo`）：前端由 `assets/demos.js` 建立，插在**內文之後、「常犯錯誤」之前**。
    `type` 必須在 `build.py` 的 `DEMO_TYPES` 白名單內（S14 會查），`caption` 選填但**建議填**。
    加了示範就要**同步正文的例子**（例：`ch17-c02` 由「3 男 2 女」改成「5 名學生 A–E、A 與 B 相鄰」，兩處數字一致）。
    現況（白名單 `build.py` 的 `DEMO_TYPES`）：`tie-up`（綑綁法，`ch17-2` `ch17-c02`）、`slot-in`（插空法，`ch17-2` `ch17-c03`）、`grouping`（分組，`ch17-3` `ch17-3-c03`）、`combination`、`path`、`complement`（`ch17-3`）、`menu`／`venn`／`code`（`ch17-1` §9.6）；各有獨立頁 `demos/<type>.html`。
  * **加／改教學卡時的必問一句（老師拍板 2026-09-30）**：AI **一定要主動提醒**「這張卡要唔要互動示範去深化學習？」
    - 若清楚知道「學生為甚麼會不明白」，就直接提出**具體**示範方案（分步按鈕、可點擊對象、即時公式／計數回饋、唔可以劇透答案、跟 `demo` 機制的成本）
    - 若不太明白難點喺邊，就**只提醒老師自己設計**，唔好硬塞一個無意義的動畫
    - 現時 `ch17-2`、`ch17-3` 與 `ch17-1` 的 9 張卡全部都有示範（`tie-up`／`slot-in`／`grouping`／`combination`／`path`／`complement`／`menu`／`venn`／`code`）；`ch10-test`（測驗檢討）暫時未有教學卡
    示範的**數字要同正文例子一致**（今次三張卡都已同步：48、1440、20／10 與 3150／1575）。
  內文用 `{{math:N}}` 佔位符（跟四個站的 learn 內容同一套寫法），前端會換成 `math[N]` 的顯示數式；`math` 條目可以內含 `\n` 斷行。
  **內文逐行處理**：行首 `- ` ＝ 清單項目（「第一步／第二步」分行用），其餘為段落 —— 想步驟分行就在每步前面加 `- `。
  卡內數式區已改為**左對齊、緊湊**（`.cc .formula`）；題解步驟的 `.formula`（居中）不受影響。
  `build.py` **S14** 會查：中英標題／內文、`{{math:N}}` 對得上 `math[]`、數式不可有 `$` 或中文（規則 1）。
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
5. **運算次序要用中括號寫明**（2026-09-30 老師同意複檢建議，17.1 已全節套用）：凡涉及「先加後減」「先乘再加」「反面減一項」「由方程反求未知」，用 `[ ]` 括住要先算的那一組，並盡量附中間值：
   - `20 + 30 - 3 = 47` → `[20 + 30] - 3 = 50 - 3 = 47`
   - `150 - (60 + 56 - 45) = 79` → `150 - [(60 + 56) - 45] = 150 - 71 = 79`（若整行超過約 44 顯示字，省略中間那步，把中間值寫在詳解文字內）
   - 反求未知：`40 + 30 - x = 60 \implies x = [40 + 30] - 60 = 70 - 60 = 10`（`\implies` KaTeX 支援）
   - 純乘積（`5 \times 5 \times 4 \times 3 = 300`）只有一種運算，唔需要括號。
   `highlight` 跟同一規則，而且**只可以放數式，唔可以有中文字**（17.1 原本有一項寫「供應 250000 = 需求 250000」，已改為 `250000 = 250000`）。
6. **計算機核對／另一種做法放 `solution.alt`，唔好塞入 `tip`**（2026-09-30 複檢後定案）：`tip` 講「帶得走的數學技巧」（例如「$k$ 為底、$n$ 為指數」、「0 是偶數」）；`alt` 放「另一個做法（參考）」，前端用 `<details>` 摺疊顯示，用途包括計算機核對、互斥區域核對等。例：`ch17-1-ct-32` 的 `alt` 用換底公式 $\frac{\log 1024}{\log 2}$ 求 $n$。**唔好用「保底／補底」等字眼命名方法**（規則 3 不標籤學生），一律寫「另一個做法：…」。

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

## 9. 目前狀態與待辦（2026-09-30）

### 9.1 內容進度

| 課題 | 狀態 | 備註 |
|---|---|---|
| `ch10-test` 第 10 章測驗檢討 | 已完成（11 題 · 38 分） | 校本 Chapter Quiz 2026-09-25 |
| `ch17-2` 17.2 排列 | 已完成（36 題 · 185 分） | 課本 Exercise 17.2，含 Class Exercise／SC／L1／L2／SM／CT |
| `ch17-3` 17.3 組合 | 已完成（35 題 · 102 分） | 課本 Exercise 17.3；2026-09-29 完成解釋修訂（見 9.2） |
| `ch17-1` 17.1 計數基本原理 | 已完成（37 題 · 133 分） | 課本 Exercise 17.1；2026-09-30 上線，見 9.6 |

### 9.2 17.3 已拍板的處理（唔好再改返轉頭）

- **L2-25(b)**：站上答案係 **90**（官方答案 540 係重複計算咗 3!，老師確認「官方是錯的」）。題解**唔會再提官方 540**，只保留 $6!/(2!)^3 = 90$ 作驗算步驟。
- **SC (e)「8 人分成兩隊」**：跟課本判為正確（$C^8_4C^4_4 = 70$），並加註「兩隊不編號要除以 $2!$，得 35」。
- **數式過長**（CE3(c)、CT-30(a)、L2-22(b)）：老師決定**暫不改**，維持原狀。
- **SMART Q28(b)／Q29(a)** 已加入官方 Alternative Solution（用 `solution.alt`）。
- **17.3 全部 79 個步驟**都已補 `highlight` 重點框；教學卡共 4 張（組合、至少／至多、分組、路徑與幾何）。

### 9.3 課本來源檔位置

課本 docx 已經搬咗入 repo：

```
s5a-maths\source\SMS_bkexe_5B17_e.docx   （題目）
s5a-maths\source\SMS_sol_5B17_e.docx     （官方答案）
```

舊路徑 `C:\Code Buddy\S5A\source\` 已唔存在。抽取段落嘅做法見 `C:\Code Buddy\_probe\dump_book.py`（用 `zipfile` ＋ `ElementTree` 讀 `word/document.xml`，取 `w:t`／`m:t` 文字；數式係 WMF 圖片，抽唔到字）。**注意**：唔可以用 `<w:t[^>]*>` 之類 regex 抓文字 —— `<w:tabs>` 這類標籤會被誤認成 `<w:t>`，令抽取結果夾雜原始 XML。

### 9.4 介面（UI）

已換皮為「靛藍主色 + 橙色強調 + 米白底」，並加咗狀態色條／資料 chips。
詳細嘅 token、元件規則、中英顯示規則、截圖預覽流程與 P1 待辦，全部寫喺：

**`docs/UI-DESIGN-HANDOFF.md`**（改介面前一定要睇）

### 9.5 其他待辦

- `C:\Code Buddy\S5A\site` 改名：一直被檔案鎖擋住，仍未做（唔影響本站）。

### 9.6 17.1 的互動示範（2026-09-30 上線）

四張卡各有一個示範，全部有獨立頁（`?step=N` 可跳步；`venncalc` 係單頁工具，唔分步）：

| 示範 | 卡 | 步驟 | 教學點 |
|---|---|---|---|
| `menu` 午餐套裝 | `ch17-1-c01` | 4 | 餐牌 2／4／3：`2 × 4 = 8` → `× 3 = 24`（分步用乘）；第 4 步對照「只買一樣」`2 + 4 + 3 = 9`（分類用加） |
| `venn` 兩類重疊 | `ch17-1-c02` | 4 | **用 2×2 表，唔用相交圓**（圓會出現「唔相交但仍寫住有共同元素」的假象）：中間格 x 用「−／＋」改（0–20），三格（x、20−x、25−x）即時更新，總數 `20 + 25 − x`；「兩樣都唔會」那格一直係 ？（未知）。第 4 步換成另一題 40／30／60，調到該格變 0（綠色）就係 `x = 10` |
| `code` 密碼逐位 | `ch17-1-c03` | 4 | 按數字填 4 個位，逐位顯示可揀數目：可重複 `10·10·10·10`；不可重複 `10·9·8·7`；首位不可為 0 `9·10·10·10`；數字池 2、4、5、6、8、0 則 `5·5·4·3` |
| `venncalc` 文氏圖計算器 | `ch17-1-c04` | 單頁工具 | 六個輸入格（A／B／A and B／A or B／Total／not A nor B）：輸入幾個，其餘按 `A or B = A + B − A and B`、`Total = A or B + not A nor B` 自動算出；**自動格唯讀＋灰底**，要改就按「重新輸入」。圖形係固定長方形＋兩個相交圓（唔會移動），交集為 0 就顯示 0。數據矛盾（負數、`A and B > min(A, B)`、`or < A`）會出警告。例：A=20、B=15、A and B=5 → A or B=30；Total=50 → not A nor B=20 |

實作注意（同其他示範一致）：文字用 `bi()`／`biInline()`、符號（`−`／`＋`／`·`）放雙語之外、顏色只用 token、`data-step` 控制顯示、`?step=N` 跳步。
`code` 示範在**每次換步會清空已填數字**（否則上一個模式的數字可能唔在這個模式的數字池內）；「每一位可揀幾個」用 `countAt()` 計：`pool.length − (首位唔可以係 0 ? 1 : 0) − (唔可以重複 ? 位序 : 0)`，所以關鍵數字必定係 10·9·8·7（不可重複）與 5·5·4·3（2、4、5、6、8、0）。
三個示範的獨立頁 `demos/menu.html`、`demos/venn.html`、`demos/code.html` 的 `<p class="lead">` **唔可以用 `$…$`**（示範頁冇 KaTeX auto-render，會原樣顯示 `$`）；站內教學卡內文則照常用 `$…$`。

**示範內文一律唔可以寫 `$…$` 或 LaTeX 指令**（`\times` 之類）：`demos.js` 的示範文字（`demo-q`／`demo-guide`／計數行）係純文字，唔經 KaTeX，會原樣顯示 `$20 + 25$`、`\times`。要用 `×`、`−`、`=` 直接寫。2026-09-30 已在 menu／venn／code 修正，`smoke_test.js` 有兩條斷言（示範文字冇 `$` 或反斜線）防止再犯。

**中學生未學 `∪`／`∩`**：唔好用集合符號，文字一律用 or／and 表達，例如「排球 or 籃球 ＝ 排球 ＋ 籃球 − both」。17.1 的教學卡 math 與 tip 已全部改寫（原本 `|A \cup B| = |A| + |B| - |A \cap B|`）。
