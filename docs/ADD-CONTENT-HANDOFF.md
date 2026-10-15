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
| `data/src/figures.json` | ✅ 圖形規格（`numline`／`graph`／`grid`／`venn`；`venn` 係第 18 章用嘅文氏圖，見 9.7） |
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
    現況（白名單 `build.py` 的 `DEMO_TYPES`）：`tie-up`（綑綁法，`ch17-2` `ch17-c02`）、`slot-in`（插空法，`ch17-2` `ch17-c03`）、`grouping`（分組，`ch17-3` `ch17-3-c03`）、`combination`、`path`、`complement`（`ch17-3`）、`menu`／`venn`／`code`／`venncalc`（`ch17-1` §9.6）、`floor`（下捨入，`ch18-2` `ch18-2-c02`，見 §9.8）；各有獨立頁 `demos/<type>.html`。
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
6. **`{{math:N}}` 一定要放在每一點的最後**（2026-10-05 加入守門斷言）：教學卡內文的數式區會獨立成一行，若它後面還有標點或文字，就會出現「只剩下一個。」的孤行。寫法：把推導與解釋寫在前面，最後才 `：{{math:0}}`，之後直接換行。`smoke_test.js` 有斷言檢查教學卡內沒有「只剩標點」的段落。
7. **計算機核對／另一種做法放 `solution.alt`，唔好塞入 `tip`**（2026-09-30 複檢後定案）：`tip` 講「帶得走的數學技巧」（例如「$k$ 為底、$n$ 為指數」、「0 是偶數」）；`alt` 放「另一個做法（參考）」，前端用 `<details>` 摺疊顯示，用途包括計算機核對、互斥區域核對等。例：`ch17-1-ct-32` 的 `alt` 用換底公式 $\frac{\log 1024}{\log 2}$ 求 $n$。**唔好用「保底／補底」等字眼命名方法**（規則 3 不標籤學生），一律寫「另一個做法：…」。

> ⚠️ 規則 1–4 目前**靠人手遵守** —— `tools/build.py` 的 S1–S9 未覆蓋這四條。
> 如要加自動防線，可參考 `DSEPass/tools/learn_check.py` 的 **I9（`**`）／I10（數式內中文）／I11（單行過長）**做法。

## 7. 發佈

```powershell
git add -A; git commit -m "ch11：加第 11 章測驗檢討"; git push
```

GitHub Pages 約 1 分鐘生效；學生第一次要 **Ctrl+F5**。

## 8. 三個站的關係（首頁有互相跳轉列）

| 站 | 網址 |
|---|---|
| 自學追上站 DSE Pass | `https://math-lov.github.io/dse-pass/` |
| **5A 數學溫習站**（本站） | `https://math-lov.github.io/s5a-maths/` |
| Endeavour 研習站 | `https://math-lov.github.io/endeavour/` |

## 9. 目前狀態與待辦（2026-10-15）

### 9.1 內容進度

| 課題 | 狀態 | 備註 |
|---|---|---|
| `ch10-test` 第 10 章測驗檢討 | 已完成（11 題 · 38 分） | 校本 Chapter Quiz 2026-09-25 |
| `ch17-quiz` 第 17 章測驗檢討 | 已完成（11 題 · 37 分 ＋ 3 分加分題） | 校本 Chapter Quiz 第 17 章 2026-10-15，官方題解；2026-10-15 上線，見 9.11 |
| `ch17-2` 17.2 排列 | 已完成（36 題 · 185 分） | 課本 Exercise 17.2，含 Class Exercise／SC／L1／L2／SM／CT |
| `ch17-3` 17.3 組合 | 已完成（35 題 · 102 分） | 課本 Exercise 17.3；2026-09-29 完成解釋修訂（見 9.2） |
| `ch17-1` 17.1 計數基本原理 | 已完成（37 題 · 133 分） | 課本 Exercise 17.1；2026-09-30 上線，見 9.6 |
| `ch18-1` 18.1 集合 | 已完成（21 題 · 87 分） | 課本 Exercise 18.1（SC／L1／L2／SMART CORNER）；2026-10-10 上線，見 9.7 |
| `ch18-2`／`ch18-3`／`ch18-4` | 已完成（146／143／140 分） | 第 18 章其餘三節（39／39／36 題）已上線；18.2 c02 另有下捨入示範，見 9.8 |
| `ch17-test` 17 測前溫習 | 已完成（15 題 · 35 分） | 卷頭 5 題快測（老師自擬，即時對錯）＋ 4 MC ＋ 6 長題（改編自 EPH WS22），2026-10-13 上線，2026-10-14 併入快測，見 9.9／9.10 |


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

### 9.7 17.2／17.3 的「重要提醒」卡（2026-10-05）

老師要求在兩節總覽頁加入快速複習用的提醒，全部以文字表述（附推導與應用場景），暫時**沒有**互動示範：

| 卡 | 位置 | 內容 |
|---|---|---|
| `ch17-c04` | 17.2 總覽（第 3 張） | 階乘：$0! = 1$、$1! = 1$（「甚麼都不排」只有一個做法）；$\frac{n!}{(n-2)!} = n(n-1)$ 的約簡；進深 $\frac{(n+3)!}{(n+1)!} = (n+3)(n+2)$；與二次方程結合（$n(n-1)=30 \Rightarrow n=6$）；$P^n_0 = 1$、$P^n_1 = n$、$P^n_n = n!$ |
| `ch17-3-c05` | 17.3 總覽（第 5 張） | 組合：$C^n_0 = 1$、$C^n_1 = n$、$C^n_n = 1$；對稱 $C^n_r = C^n_{n-r}$ 的意義（揀走 r 件＝決定留下 n−r 件）與化簡技巧（$C^{10}_8 = C^{10}_2 = 45$）；邊界情況與 $0! = 1$ 的接駁 |

若日後要加示範，建議方向：（1）階乘比例「分子比分母多幾個因數」的逐步展開／約簡動畫；（2）對稱性質左右並列顯示 $C^{10}_8$ 與 $C^{10}_2$ 的乘法步驟。

**2026-10-05 內容修正（老師指出）**：`ch17-c04` 的常犯錯誤原本寫「否則 $P^n_0$ 與 $C^n_n$ 會全部變成 0」，這是錯的。正確講法是：若 $0! = 0$，$C^n_n = \frac{n!}{n!\,0!}$ 與 $C^n_0 = \frac{n!}{0!\,n!}$ 會**除以 0（無定義）**，不是等於 0；而 $P^n_0$ 本身是 $\frac{n!}{n!} = 1$，**不涉及 $0!$**。$0! = 1$ 真正撐住的是 $C^n_n$、$C^n_0$，以及 $P^n_n = \frac{n!}{0!}$ 這幾條分母含 $0!$ 的公式。已加測試斷言防止講錯。

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
（**2026-10-10 補充**：這條只適用於 **17.1**（計數原理，當時未學集合）。第 **18.1** 節本身就是教集合語言 —— 課本 Exercise 18.1 每一題都用 $S$、$A'$、$A \cap B$、$A \cup B$ —— 所以 18.1 一律照用集合符號，唔可以改寫成中文；18.2 之後（概率加／乘法）才逐步回到文字與四區講法。）

### 9.7 18.1 集合（2026-10-10 上線）

**來源**：`source/SMS_bkexe_5B18_e.docx` ＋ `source/SMS_sol_5B18_e.docx`（第 18 章 *More about Probability*）；逐題核實記錄在 `data/raw/ch18-1-source.md`。
- DOCX 的集合符號係 Symbol 字型（`F0C7`／`F0C8`／`F0C6` ＝ ∩／∪／∅），分數係 WMF 圖 → 抽取時要先還原符號、再把圖轉 PNG 逐幅讀（`C:\temp\ch18\` 的臨時腳本，唔入 repo）。
- 老師的 docx **冇 Class Exercise 18.1**（檔案由 Exercise 18.1 開始），所以呢節只有 SC／L1／L2／SMART CORNER。
- 課本冇印 18.1–18.4 的節名 → 站上先用「18.1 集合／18.2 概率／18.3 概率的乘法／18.4 概率與計數」，18.2–18.4 標「即將推出」；之後拿到書就可以改 `site.json` 的節名。
- **SC (a) 校正**：docx 原文寫「then $n(B) = 10$」，但官方答案以 $n(A) = 4$ 判錯，$B$ 亦只在 (b) 才定義 → 站上照官方答案改印「then $n(A) = 10$」，並在 raw notes 記錄（當係課本／docx 手民之誤）。

**圖：新增 `venn` 類型（`tools/make_figures.py`）**，13 幅（`ch18-1-*`）。spec：

```json
{ "type": "venn", "frame": "S", "sets": ["A", "B"], "nest": "A", "cLabel": "C",
  "regions": { "aOnly": ["4"], "both": ["8"], "bOnly": ["1"], "outside": ["7"], "cOnly": ["3"] },
  "shade": ["aOnly"], "caption": { "zh": "…", "en": "…" } }
```

- 圓位固定（A 圓心 190,205、B 圓心 330,205、半徑 112；`nest` 時 C 圓心 168,240、半徑 52 完全在 A 內）；`regions` 的元素會自動排位：細網格逐點判斷區域，**跳過貼近圓周的灰帶**（A／B 距圓邊 22px、C 18px、圓外 12px），再按「同其他文字至少相距 44px」貪心放置，所以文字唔會壓住圓周或 S／A／B／C 標籤。唔夠位時會退回最近可用格（唔會漏字）。
- `shade` 用 SVG `<mask>` 做：`aOnly`（A 減 B）、`bOnly`、`both`（雙 mask 疊）、`outside`、`cOnly`、`all`；唔改圖形只改填色，所以著色題（L2-12）四個答案可以直接用同一底圖出四個版本。
- 排版用 `tools/preview_figures.py`（要 `pymupdf`）睇 PNG，再拼圖肉眼檢查；`smoke_test.js` 有斷言查圖數（27 幅）＋ 13 幅 18.1 圖。

**教學卡**：4 張（集合符號／文氏圖四區／等可能求概率／空集與互斥提醒）。**現階段全部係靜態**（老師 2026-10-10 指示：動畫之後由老師加），所以 4 張卡都冇 `demo`，`smoke_test.js` 有一條斷言（`cards.every(c => !c.demo)`）——**日後加示範就要拆走呢條斷言**。
- 內部已按「加卡必問示範」的規矩向老師提出建議（未拍板）：集合符號卡 → 逐格亮起 $A'$／$A \cap B$／$A \cup B$ 的成員；四區卡 → 2×2 表版（沿用 `venncalc` 的做法，唔用相交圓）；$P(A) = \frac{n(A)}{n(S)}$ 卡 → 抽卡機（n(S) 變 → 概率即時變）。
- 呢節係**第一次用 `∪`／`∩`**（見上面 9.6 末的補充），所以教學卡 math 直接寫集合符號，唔再拆成 or／and。

### 9.8 下捨入：18.2 L2-17 的講解 ＋ 18.4 的小示範（2026-10-13）

**起因**：學生問「1 到 60 之中 3 的倍數有幾個」（`ch18-2-l2-17`）—— 要把 ⌊n ÷ x⌋ 這個工具講清楚，並給學生一個可以自己改數字試的小示範。

- `ch18-2-l2-17`（18.2 加法定律）新增**第一步（不佔步驟分，`marking` 留空）**：1 到 $n$ 之中 $x$ 的倍數＝⌊n ÷ x⌋，即先除再「下捨入」，**唔可以四捨五入**；例 62 ÷ 3 = 20.66… → 20（第 21 個 63 已超出 62）、99 ÷ 5 = 19.8 → 19。
- 同題 `tip` 推廣到由 $m$ 到 $n$：$\lfloor n/x \rfloor - \lfloor (m-1)/x \rfloor$（例：100 到 200 之中 3 的倍數＝66 − 33 = 33）；`traps` 補「未整除時四捨五入」與「忘記減去 $m$ 之前的倍數」兩項。
- **新示範 `floor`**（`assets/demos.js` 的 `floorDemo` ＋ `style.css` 的 `.df-*` 區塊）：4 步 —— ① 題目 ② 62 ÷ 3 = 20.66…（除唔盡）③ 逐個數：3、6、…、60 共 20 個，第 21 個 **63 畫成灰色刪線**（超出 62，唔算數）→ ⌊62 ÷ 3⌋ = 20 ④ 計算器：改 n、x 即時睇 ⌊n ÷ x⌋，另有 60 ÷ 3／62 ÷ 3／99 ÷ 5 三個一按即試的例子（整除時會亮起「唔使捨」提示）。
- 示範掛在 **`ch18-2` · `ch18-2-c02`**（抽 n(A)、n(B)、n(A∩B) 與反求交集 —— L2-17 就係靠佢把 1 到 60 之中 3／5／15 的倍數數出來）：正文加一點「有時候 $n(A)$、$n(B)$ 要自己數」＋ `math[2] = \left\lfloor \frac{n}{x} \right\rfloor`，數字同示範一致（62 ÷ 3 → 20；60 ÷ 3 剛好整除）。獨立頁 `demos/floor.html?step=N`；白名單 `DEMO_TYPES` 已加 `floor`。
- **2026-10-13 由 `ch18-4-c01` 搬回 `ch18-2-c02`**（老師指示）：18.4 的內容完全冇出現「倍數／下捨入」（三張卡＋36 題都搜過），唔應該掛在那裡；18.2（尤其 L2-17）才是用到 ⌊n ÷ x⌋ 的一節。18.4 三張卡保持靜態，`smoke_test.js` 有一條反向斷言（`P184_DATA.cards.every(c => !c.demo)`）。
- `smoke_test.js` 新增 16 條斷言（步驟與指示、chips 內容與 `data-off`、⌊ ⌋ 結論、計算器三組例子、格仔輸入的範圍保護、`aria-live`、獨立頁的真 CSS 顯示切換）＋ 上述 18.4 的 1 條。
- 示範文字一律唔可以出 `$` 或反斜線（見 9.6 末），所以 ⌊ ⌋、÷、… 全部用純文字寫；已加斷言。

### 9.9 第 17 章「17 測前溫習」（2026-10-13）

**來源**：`source/EPH_DSEL5_WS22_e.docx`（Key Concepts & DSE Paper 1 Typed Questions，22.1 Permutation and Combination）＋ `source/EPH_DSEL5_WS22_e_sol.docx` 官方答案。抽取文字用 `python C:/Code Buddy/_probe/dump_docx_endeavour.py <docx…> --out <資料夾>`（公式係 WMF 圖，文字抽取唔到，答案要對住官方答案檔核實）。

**選題（10 題 · 30 分，覆蓋全課）**

| 題 | 內容 | 對應重點 | 分 |
|---|---|---|---|
| A1 | 六位密碼：首四位由 1–4 排列、末兩位由 8–9 排列 | 排列、分段相乘 | 2 |
| A2 | 籃球隊 14 人選 5 人正選（1 隊長 ＋ 4 球員） | 組合 ＋ 職位 | 2 |
| A3 | 22 名中五A ＋ 18 名中五B，選 5 名同班 | 分類相加（互斥兩類） | 2 |
| A4 | 15 中四 ＋ 18 中五 ＋ 7 導師，選 8 人、導師至多 3 | 「至多」四個 case | 2 |
| B1 | 52 張牌：4／6／9；7 或紅桃 | 分類用加、避免重複計算（7♥） | 3 |
| B2 | 九位密碼（1–9）：全部；首末位為偶數 | $9!$、位置限制 | 3 |
| B3 | 5 男 6 女／6 男 6 女相間排列 | 相間排列、多一方做兩端 | 4 |
| B4 | H、I、J 與 5 朋友：(a) 坐埋一齊 (b) 任何兩人唔相鄰 | 綑綁、插空（官方 4 320／14 400） | 5 |
| B5 | 天文學會 18 初中 ＋ 12 高中，選 4 人至少 1 高中 | 「至少」用反面（＝2019 P1 Q15） | 3 |
| B6 | 12 中文書 ＋ 8 英文書，選 5 本英文至多 2 本 | 「至多」分類相加（＝2016 P2 Q43） | 4 |

- 答案全部對過官方答案檔；A1 48、A2 10 010、A3 34 902、A4 75 354 180、B1 12／16、B2 362 880／60 480、B3 86 400／1 036 800、B4 4 320／14 400、B5 24 345、B6 10 912。
- **分數是老師自擬**（MC 每題 2 分、長題 3/3/4/5/3/4），要改就改 `data/src/ch17-test.json` 的 `marks`／`parts[].marks`，build.py 會檢查加總。
- `difficulty` **只可以用 1–3**：網站得 3 顆星，`"☆".repeat(3 - difficulty)` 遇到 4 會拋 RangeError（已加斷言）。

**上架方式**

- 新課題 `ch17-test`：`group: "quiz"`、`kind: 測前溫習`、`unit: 第 17 章 · 排列與組合`；`site.json` 的 `parts` 加多一條，`site.classwork.chapters[ch17].sections` 再加一條 `{ "code": "17R", "part": "ch17-test", … }`，所以**第 17 章章節頁**同**首頁「測驗檢討」**兩邊都見到（章節頁統計係 4 節 · 118 題 · 450 分）。章首簡介已加一句講明「17 測前溫習」。
- 資料檔結構要跟 build.py：`sections[].questions[]`（唔可以將題目放在頂層）。

**Word 工作紙（實體列印 · 全英）**

- `tools/make_worksheet_docx.py` **由 `data/src/<part>.json` 生成** `docs/worksheets/<part>-worksheet.docx`：`python -X utf8 tools/make_worksheet_docx.py --part ch17-test`。改題目只要改 JSON 再跑一次，網站同工作紙永遠一致。
- **全英，唔中英對照**（2026-10-14 老師要求）：生成器完全唔讀 `zh` 欄（smoke 斷言會檢查 `make_worksheet_docx.py` 內冇 `"zh"`），抬頭、Name／Class／Date／Score、section 標題、題幹、分數、書寫格、公式頁、頁碼全部英文；選項如果係「插空法 Slot-in」咁中英混排，會用 `ascii_only()` 洗走中文（網站仍然中英對照）。
- 內容：抬頭（英文課題名、Total marks、Name/Class/Date/Score）、**全份一張作答格**（Answer sheet 印喺卷頭，收集所有選擇題；單選 ○／多選 ☐）、MC 題目與選項、長題目＋小問＋書寫橫線、尾頁 Formula sheet and common traps、頁碼 Page N。引言只印第一句；同一題同表格唔會跨頁分斷（`keep_with_next` ＋ `w:cantSplit`）。
- 快測題（`question.quick`）特別支援：`input` → 印 `Number of arrangements: ______` 填數格（唔入 Answer sheet）；`rows` → 印紅／藍／剔表格，每行一個 ☐（`head` 最後一欄係剔欄就自動當作打勾欄）。
- 環境：本機已裝 `python-docx`（`python -m pip install python-docx`）。檢查版面用 Word COM 匯出 PDF 再用 pymupdf 轉圖（`tools/_preview/*.png`）。
- KaTeX → 純文字轉換器 `plain()` 喺同一個檔案（處理 `$`、`\,`、`\times`、`\div`、上下標、`\lfloor` 等）。

### 9.10 第 17 章卷頭「快測 · 5 題」（2026-10-14）

**用途**：老師要求喺「17 測前溫習」卷**最前面**加 5 題快測（每題 1 分，共 5 分）做 warming up：**同學做完快測（有即時對錯）之後，跟住的甲部、乙部就自己做**。

**已經合併入 `ch17-test`（唔係獨立課題）**
- `data/src/ch17-test.json` 的第一節就係快測：`sections[0].id = "Q"`（`marks: 5`，5 條題全部有 `quick`），跟住 `"A"`（4 MC 8 分）、`"B"`（6 長題 22 分）。全卷 **15 題 35 分**，課題標題改成「17 測前溫習 · 快測 ＋ 精選題」。
- **冇 `ch17-qc` 呢個課題**（已刪 `data/src/ch17-qc.json`、`data/ch17-qc.js`、`docs/worksheets/ch17-qc-worksheet.docx`），首頁卡片同章節頁（`17R`）都只得一個入口；smoke 有斷言守住 `data/index.js` 唔可以再出現 `ch17-qc`。
- 工作紙只有一份 `ch17-test-worksheet.docx`：卷頭一張 Answer sheet（Q1、Q2、Q5、Ａ1–Ａ4），再依次印快測、甲部、乙部。
- 網站總覽頁：16 頁（總覽 ＋ 15 題），三個分隔（快測／甲部／乙部）。

| 題 | 內容 | 互動 | 答案 |
|---|---|---|---|
| Q1 | 30 人揀 3 人做班長／副班長／財政 | MC，即時回饋 | B `P³⁰ = 24 360` |
| Q2 | 30 人揀 3 人組成數學壁報小組 | MC，即時回饋 | A `C³⁰ = 4 060` |
| Q3 | 5 男 3 女排一列，兩男必須相鄰 | 揀方法 ＋ 填數 → 提交 | B 綑綁法，`7!×2! = 10 080` |
| Q4 | 5 男 3 女排一列，女的不能相鄰 | 揀方法 ＋ 填數 → 提交 | A 插空法，`5!×P⁶₃ = 14 400` |
| Q5 | 5 紅 4 藍抽 3 粒，至少 1 粒紅 | 表格多選 → 提交 | A、B、C（`C⁹₃−C⁴₃ = 80`） |

**`question.quick` 欄位（前端機制）**

- `mode: "instant"`：一揀即出對錯（MC 用）；`mode: "submit"`：要按「提交答案」先評。
- `input: { answer, label }`：加一個填數格，數字會 `replace(/[\s,]/g,"")` 正規化（`10080`、`10 080`、`14,400` 全部接受）。有輸入格就唔可以用 `instant`（build.py 會報錯）。
- `multi: true` + `head` + `rows`：表格多選（紅／藍／剔），`answer` 寫成 `["A","B","C"]`；build.py 會檢查 `rows` 剛好覆蓋 A–D。`head` 冇「剔」欄時前端會自動補 `UI.quickTick`。
- 提交按鈕一開始係停用，揀完選項或者填到數先解封；錯兩次就鎖住並顯示正確答案（`[data-feedback="ok"|"bad"]`）。
- 回饋副標：方法啱數字錯＝`quickMethodOnly`、數字啱方法錯＝`quickNumberOnly`、兩樣都錯＝`quickMissBoth`、純選擇題＝`fbRetrySub`（唔會講「數字」）。
- build.py 對 MC 選項數目的例外：`quick` 題可以只有 A／B 兩個（例如插空法／綑綁法），其餘 MC 一律要 A–D。
- 樣式：`assets/style.css` 的 `.quick-in / .quick-lab / .quick-field`、`.opts.multi .opt .letter`（圓→方）、`.quick-grid`、`.opt.cell`。

### 9.11 總覽頁引言可讀性：摘要 ＋ introSteps（2026-10-14）

**問題**：總覽頁（`quiz.html?c=<part>&p=0`）原本只得一整段 `intro`，1719 章嘅引言長到 500–700 字，變成一大段「牆」，學生根本讀唔晒，而且工作紙只印得到第一句。

**做法**：每個課題嘅 `data/src/<part>.json` 都改成
- `intro`：**一句摘要**（中英各 ≤ 200 字，實務 30–60 字）。
- `introSteps: [{ zh, en }]`：原本嘅內容拆成 **2–5 個編號步驟**（中英各一行，\n 會變成第二行）。字串裏可以用 `·` 做子項。

**前端**：`renderOverview()` 見到 `introSteps` 就喺引言下面出 `.how-paper` 區塊——沿用首頁「用法步驟」嘅視覺（編號圓點 ＋ 中英兩行），標題用 `UI.paperHowTo`（點做這份卷／How to work through this paper）。樣式係 `assets/style.css` 嘅 `.how-paper / .how-label`（字細一級、淺米色底、圓角框）。

**build.py（規則 S16 `check_intro`）**
- `intro` 或 `introSteps` 中英都唔准空、唔准用 Markdown `**`。
- `intro` 過 200 字而冇 `introSteps` → **警告**（CI 要 0 警，所以寫長引言會被擋）。
- `introSteps` 必須係非空陣列、最多 8 條，每條 zh ≥ 8 中文字、en ≥ 20 字。

**工作紙**：`make_worksheet_docx.py` 的 `header_block()` 會印 `How to work through this paper` ＋ 編號步驟（只有英文，`\n` 後嘅子項縮排成灰色小行），所以紙本同網站講法一致。

**現況**：9 個課題全部有 `introSteps`（ch17-test 4 步、ch18-1 5 步、其餘 2–4 步），smoke 有 6 條斷言守住（渲染、編號、中英兩行、全部課題都有、build 規則、工作紙都有列印）。

### 9.11 第 17 章測驗檢討 `ch17-quiz`（2026-10-15）

**來源**：`source/S.5 chapter 17 quiz.docx`（題目卷）＋ `source/S.5 chapter 17 quiz solution.docx`（官方題解）。兩份都要用 **OMML 感知**嘅抽取器才讀得齊（`C:\Code Buddy\_probe\dump_docx_omml.py`：純文字 dumper 會漏 `m:oMath` 內嘅數字；Q6–Q11 嘅式重係 Word 方程式物件 WMF，要 Word COM 匯 PDF → pymupdf 轉 PNG 睇）。

**卷面**：`Marks: ____/37`；甲部 5 MC（每題 2 分，共 10 分）、乙部第 6–10 題（4・4・8・4・7，共 27 分）、加分題第 11 題（3 分，唔計入 37）。

| 網站題號 | 原卷 | 答案（已對官方題解） |
|---|---|---|
| A1–A5 | 1–5 | C（1 106）、C（720）、A（4 620）、B（37 128）、D（604 800） |
| B1 | 6 | (a) 16、(b) 6 |
| B2 | 7 | (a) 1 440、(b) 3 600 |
| B3 | 8 | (a)(i) 40 320、(ii) 14 400、(b)(i) 14 400、(ii) 720 |
| B4 | 9 | (a) 12 600、(b) 302 400 |
| B5 | 10 | (a) 784、(b) 180、(c) 549 |
| Bonus | 11 | 不同意，正確 488 864 376（÷ 4!） |

- **題號對應**：跟 `ch10-test` 用 A1–A5／B1–B5／Bonus（唔用原卷嘅 1–11），所以每題中文題幹尾加「（原卷第 N 題）」，`introSteps` 第 1、2 條亦寫明對應。
- **分數**：`parts[].marks` 跟卷面小問分數（2／2／2／2／2／2／3…）；`steps[].marking` 用官方題解嘅 (1M)(1A) 逐個標，build.py 檢查每題加總＝題目分數。
- **甲部 A4 的選項 A（17 160）**：對唔上任何一個情況嘅數目，題解寫明「唔屬於三種正確情況，亦唔係反面『老師少過學生』的 $12600+3150+252=16002$」，冇硬編一個假原因（2026-10-15 老師覆核後改成這個講法）。若日後拿到官方評卷參考，可以補返。
- **B5(c) 另有方法二**（直接數六個互斥情況，150＋120＋225＋15＋36＋3＝549），放喺 `solution.alt`，前端以「進階解法（參考）」摺疊顯示。
- **位置**：只掛首頁「測驗檢討」（`site.json` 的 `parts` 加喺 `ch10-test` 之後，保持 `parts[0]` 仍係 `ch10-test`）；**冇**加入章節頁 `ch17` 嘅 `sections`（章節頁仍係 4 節 · 118 題 · 450 分）。要放埋上章節頁就加 `{ "code": "17Q", "part": "ch17-quiz" }`。
- **smoke**：新增 6b-3 段（課題註冊、37＋3 分、官方答案字串、parts/marking 加總、difficulty 1–3、總覽 12 頁 2 個分隔、A1／B5／Bonus 渲染、11 題 KaTeX 零錯誤且中英對照、每題有重點框與常見錯誤提示）。
