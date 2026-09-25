# 5A 數學溫習站

中五A班的校內測驗檢討網站。**每題一頁**：題目（英文，跟試卷一樣）＋ 逐步題解（中英對照，可切換）。
純靜態（HTML／CSS／JS，無框架、無 build step），KaTeX 自托管，可以離線開啟，也可以放上 GitHub Pages。

線上版：`https://math-lov.github.io/s5a-maths/`（部署後）

## 目錄

```
index.html              首頁（測驗清單、進度環、語言切換）
quiz.html               測驗檢討頁（?c=ch10-test&p=0；p=0 是總覽，1 起是各題）
assets/style.css        樣式（沿用 DSEPass「自學追上站」的設計語言）
assets/app.js           前端（兩頁共用；KaTeX 兩路渲染、語言切換、進度）
data/index.js           生成檔：網站資料（勿手改）
data/figures.js         生成檔：所有圖的 SVG（勿手改）
data/ch10-test.js       生成檔：第 10 章測驗題目＋題解（勿手改）
data/src/site.json      手改：網站資料與測驗清單
data/src/ch10-test.json 手改：題目與題解
data/src/figures.json   手改：圖形規格（數線／拋物線）
data/raw/               來源原文與核實記錄（草稿層，只讀）
tools/build.py          檢查 + 生成 data/*.js
tools/make_figures.py   圖形規格 → SVG
tools/smoke_test.js     學生流程測試（jsdom + 真 KaTeX）
tools/preview_figures.py 把 SVG 畫成 PNG，方便肉眼檢查圖形
tools/doc-extract/      把 .doc 試卷抽成文字稿／圖片的工具
vendor/katex/           自托管 KaTeX（0.16.x）
```

## 日常流程

```powershell
cd "C:\Code Buddy\S5A\site"
$py = "python"

# 1) 改完 data/src/*.json 之後：檢查 + 生成
& $py tools/build.py            # 0 錯誤 0 警告才繼續
& $py tools/build.py --check    # 只想檢查，不寫檔

# 2) 圖（改過 figures.json 或 make_figures.py 之後）
& $py tools/preview_figures.py  # → tools/_preview/*.png，逐幅肉眼檢查

# 3) 學生流程測試（jsdom；jsdom／katex 可以借用 DSEPass 的 node_modules）
$env:NODE_PATH = "C:\Code Buddy\DSEPass\node_modules"
node tools\smoke_test.js        # 要見到 all smoke tests passed

# 4) 本機預覽（直接開檔案也可以，因為沒有 fetch）
start index.html
```

## 檢查器（`tools/build.py`）會擋的事

| 代號 | 內容 |
|---|---|
| S1 | 課題／小節／題目的結構齊全，題數與 `site.json` 一致 |
| S2 | 長題 `parts[].marks` 加總 = 題目分數；`steps[].marking` 加總也要對得上 |
| S3 | MC 一定剛好 A–D 四個選項，`answer` 必須是其中之一 |
| S4 | MC 的 `traps` 要指向真實選項，**不可指向正確答案**；長題 `traps` 用 `label` |
| S5 | 每個 step 都有中英標題與中英詳解（中文詳解 ≥ 8 字，避免只寫算式） |
| S6 | 文字欄位 `$` 要成對、不可有 Markdown `**`（前端不支援） |
| S7 | **角度一律用「度」**：不可出現 `rad`／`\frac{\pi}{}`（本章無角度，閘門照樣保留） |
| S8 | 引用的圖一定存在 |
| S9 | 每題都有答案欄、每題都有「帶得走的技巧」 |

## 加一份新測驗（網站擴充方法）

1. 把新試卷抽成文字稿：見 `tools/doc-extract/README.md`（`.doc`／`.docx` 都可以），
   原文放到 `data/raw/<id>-source.md` 並在裡面記下官方評分與逐題驗算。
2. 在 `data/src/` 新增 `<id>.json`（照 `ch10-test.json` 的結構），
   並在 `data/src/site.json` 的 `parts` 加一項（`id` 要與檔名相同，`stats.questions` 要對）。
3. 有新圖就寫進 `data/src/figures.json`（`numline` 或 `graph` 兩種規格）。
4. 跑 `tools/build.py`、`tools/preview_figures.py`、`tools/smoke_test.js`，全綠就可以發佈。
5. `tools/smoke_test.js` 內的頁數／題數斷言要同步更新（照樣加一組斷言，別刪舊的）。

## 內容原則

* **題目與選項一律英文**（跟試卷一致）；題解中英齊全，學生可按「中文／EN／中英」切換。
* 每題都有：答案欄、逐步題解（含步驟分 `(1M)`／`(1A)`，跟官方評分參考）、
  「為甚麼會選錯」或「常見錯誤」、以及「帶得走的技巧」。
* 資料與生成檔分開：**只改 `data/src/`**，`data/*.js` 是生成檔，下一次生成會覆蓋。
* 進度只存學生自己的瀏覽器（`localStorage`：`s5a-progress:v1`），不上傳、不計分、不排名。
