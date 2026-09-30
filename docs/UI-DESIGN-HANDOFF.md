# 5A 數學溫習站 · 介面設計交接文件

> 最近更新：2026-09-30（P0 換皮完成 → 再加一輪「中英並列可讀性」修正：雙語分段／標題層次／對比／箭頭與符號不重複／CSS 版本戳；P1 未開始）
> 適用：任何改 `assets/style.css`／`assets/app.js`／三個 HTML 的工作
> 相關：`docs/ADD-CONTENT-HANDOFF.md`（加題目內容）、`README.md`（整體流程）

---

## 1. 設計系統（Design tokens）

全部定義喺 `assets/style.css` 嘅 `:root`，**改顏色／圓角／間距請改 token，唔好直接寫死色碼**。

| 角色 | Token | 值 |
|---|---|---|
| 主色（唯一） | `--primary` / `--primary-dark` / `--primary-ink` / `--primary-soft` / `--primary-line` | `#4f46e5` / `#4338ca` / `#3730a3` / `#eef0fe` / `#c9cdf7` |
| 強調色（唯一） | `--accent` / `--accent-ink` / `--accent-soft` / `--accent-line` | `#f97316` / `#b45309` / `#fff4e8` / `#f7d9b8` |
| 淡化主色（引用／提示左線） | `--primary-bar` | `#8b8df0` |
| 底色 / 卡 | `--bg` / `--card` / `--band` | `#faf7f3`（米白）/ `#ffffff` / `#f5f0e9` |
| 文字 / 邊線 | `--text` / `--muted` / `--line` / `--line-soft` / `--chip-bg` | `#221f1c` / `#6f6a64` / `#e3ddd5` / `#f0ebe4` / `#f2ede6` |
| 狀態（只此三） | `--ok` / `--ok-dark` / `--ok-soft`；`--err` / `--err-soft`；`--warn` / `--warn-soft` | 綠 `#15a05a`；紅 `#d92d20`；琥珀 `#b45309` |
| 色條 | `--bar-doing` / `--bar-done` / `--bar-idle` / `--bar-off` | 靛藍 / 綠 / `#ded7cd` / `#efe9e1` |
| 間距級 | `--sp-1..--sp-7` | 4 / 8 / 12 / 16 / 20 / 24 / 32（全部 8 的倍數） |
| 圓角 | `--radius` / `--radius-sm` / `--radius-xs` / `--btn-radius` | 16 / 12 / 10 / 12 |
| 陰影 | `--shadow` / `--shadow-lift` | 暖色 `rgba(52,38,25,…)` |

**色盤紀律**：全站只有「1 主色 + 1 強調色 + 狀態三色」。飽和色只留作狀態／角色，唔好當裝飾用。

---

## 2. 元件規則

### 2.1 左側色條（狀態指示）—— 只加在「有狀態」的卡

```css
.part-btn::before {                     /* 做法 B：內縮小色條 */
  content: ""; position: absolute; left: 0; top: 16px; bottom: 16px; width: 4px;
  border-radius: 0 999px 999px 0; background: transparent;   /* 未開始＝唔顯示 */
}
.part-btn.doing::before { background: var(--bar-doing); }   /* 進行中＝靛藍 */
.part-btn.done::before  { background: var(--bar-done); }    /* 已完成＝綠 */
.part-btn:disabled::before { background: transparent; }     /* 未上線＝唔顯示 */
```

- 適用：`.part-btn`（首頁課題卡、章節頁節卡）
- **唔適用**：`.card`／`.cc`／`.fig`／`.tf-item` 等內容卡 —— 否則會同「角色色帶」語意混淆
- 用 `::before` 而**唔用** `border-left`：border 會令內容盒縮 4px，2 欄 grid 下文字起點就唔對齊
- 上下內縮 16px ＝ 卡片圓角半徑 → 完全避開圓角，唔會變錐形
- **老師拍板（2026-09-30）**：只有「有進度」才顯示色條；0%（未開始）與未上線**一律唔顯示**

### 2.2 角色色帶（左邊粗線＝「呢格有角色」）

| 元素 | 樣式 | 意思 |
|---|---|---|
| `.step` | 左 5px `--primary`，**四角都用 `--radius-sm`** | 解題步驟 |
| `.trap` / `.cc-warn` / `.trap-head` | 左 4–5px `--accent` | 陷阱、要留意 |
| `.tip` / `.answer-box` | 左 5px `--ok` | 貼士、答案 |
| `.sol-hint` / `.alt-box` | 左 4px `--primary-bar`（淡化） | 提示、另一個做法 |

⚠️ 呢啲係**語意**，唔係裝飾。內容卡唔可以加色條，否則學生分唔清。

### 2.3 資料 chips（`.mchips` / `.mchip`）

課題卡嘅數字（題數／分數／掌握度）一律用 chip，唔好寫成長句（英文會換成 3 行）。

- 中英並列時自動加淡分隔號「·」，英文縮一級（11px）做次層次
- `.part-btn.done` 上嘅 chip 轉白底（配合綠底卡）
- 由 `app.js` 嘅 `mchip()`／`mchips()` helper 建立

### 2.4 eyebrow（小節標題）

`.section-title` ＝ 12.5px / 800 / 字距 `.14em` / 靛藍 / 後面一條幼線。
英文會自動大寫（`text-transform: uppercase`），中文唔受影響。

---

## 3. 中英顯示規則（最容易出錯的地方）

- 靜態文字：`<span class="l-zh">…</span><span class="l-en">…</span>`，由 `body[data-lang]` 控制
- **短標籤**（按鈕、chip、題號）：用 `setPair()`（inline 配對）→ 一版只顯示一語，並列時需要 CSS 分隔
- **句子／段落**（圖例、meta、小節標題）：用 **`setPairLines()`**（div 版配對）→ 中英各佔一行，**唔好用 `setPair()`**（否則會黏成「…答案分（Accuracy mark）Marking codes:…」）
- 頁首標題 `#quiz-name` / `#chapter-name`：CSS 已設兩語上下兩行（英文做次標題）；`#chapter-en` 唔可以再寫英文（會重複）
- 語言中立的文字（例如試卷來源 `S.5 Mathematics · Chapter Quiz`）用普通元素，**唔好**用 `setPair`（否則並列模式會顯示兩次）
- **箭頭／狀態符號**（`←` `→` `✓` `✗`）同屬語言中立，**唔可以寫入 `{zh, en}` 字串**：並列模式會出兩次（「← 主目錄 ← Home」、「已掌握 ✓ Mastered ✓」）。用 `setPairArrow()` 把符號放到雙語之外：

  ```js
  setPairArrow(prev, UI.prev, "←", "start");    // 符號在前
  setPairArrow(next, UI.next, "→", "end");      // 符號在後
  setPairArrow(marked, UI.marked, "✓", "end");  // 狀態符號（未標記時照舊 setPair(marked, UI.mark)）
  toast(UI.okToast, "✓");                       // toast 同樣支援
  ```

  - 符號會寫成 `<span class="arw" aria-hidden="true">`（裝飾，唔會被螢幕閱讀器讀出），並且係雙語 span 之外嘅兄弟節點
  - 箭頭唔夠位時 `arrow` 傳 `""`／`undefined` → 自動等同 `setPair()`
  - 靜態 HTML（`quiz.html`／`chapter.html` 頂欄「主目錄」）用同一寫法：
    `<span class="arw" aria-hidden="true">←</span><span class="l-zh">主目錄</span><span class="l-en">Home</span>`
  - 新增／修改 `{zh, en}` 字串時，先睇下內容有冇箭頭、`✓`、`✗`、`·` 之類符號

---

## 4. 截圖預覽流程（改 UI 必做）

本機有 Chrome，可以離線截圖，**未 push 先睇**：

```powershell
$ch = "C:\Program Files\Google\Chrome\Application\chrome.exe"
& $ch --headless=new --disable-gpu --hide-scrollbars `
      --force-prefers-reduced-motion --force-device-scale-factor=1 `
      --window-size=900,820 --virtual-time-budget=4000 `
      --screenshot="C:\Code Buddy\_shots\my-shot.png" `
      "file:///C:/Code%20Buddy/s5a-maths/index.html"
```

- 檔名用空格時要寫成 `%20`
- `--force-prefers-reduced-motion` 一定要加（否則卡片入場動畫會被拍到半透明）
- 截圖放 **`C:\Code Buddy\_shots\`**（repo 之外，唔會入 git；IDE 檔案樹可直接點開）
- 已知限制：**headless Chrome 喺 Windows 有最細視窗闊度（約 500 DIP）**。直接拍 `--window-size=390` 只會得到「500px 版面被裁成 390px」嘅圖——文字看似被切，**唔係橫向溢出**，唔好誤判（要證實就掃描圖右緣像素：卡片係 `#ffffff`、頁底係 `#faf7f3`；右緣一直係卡片色先至係真溢出）
- **驗手機版面（390px）**：用 `tools/mobile-harness.html`。iframe 有自己嘅 390px viewport，媒體查詢（620px 斷點）照樣生效：

  ```powershell
  $ch = "C:\Program Files\Google\Chrome\Application\chrome.exe"
  & $ch --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion `
        --virtual-time-budget=4000 --window-size=520,2450 `
        --screenshot="C:\Code Buddy\_shots\s5a-ui\mobile390.png" `
        "file:///C:/Code%20Buddy/s5a-maths/tools/mobile-harness.html?src=index.html&h=2400"
  ```

  - `src=` 要驗嘅頁（相對 repo 根）；帶 query 嘅頁要 encode，例如 `quiz.html%3Fc%3Dch10-test`
  - `h=` iframe 高度，長頁可以加大（截圖 window 高度要 ≥ `h` + 約 50）
  - 視窗闊度用 520（> 500 就唔會被夾硬擴闊），iframe 本身仍然係 390px

---

## 5. 待辦（下一次接手先睇呢段）

### 5.1 介面（P1，未開始，老師已同意方向）

1. 首頁加 **KPI stat tiles**（未完成題數／已掌握 %／已上線節數／待複習）
2. **章節頁改兩欄**卡片
3. 加 **inline SVG icon**（唔用 emoji）
4. 每張卡右邊加 **CTA pill**

做法建議：拆成 3–4 個獨立 commit，每個都可單獨 `git revert`；先出 PNG 畀老師睇才 push。

### 5.2 其他

- `C:\Code Buddy\S5A\site` 改名（一直被檔案鎖擋住，未做）—— 唔影響本站
- 課題卡 meta 嘅英文行長、`.how-t`（已加 64ch 上限）等細節已完成

---

## 6. 操作守則

1. **題目頁（`quiz.html`）維持手機優先單欄**，唔好照搬 dashboard 分欄
2. 改 UI 時：**盡量只動 CSS**，要改 HTML／app.js 就先講清楚影響
3. 每次改完必跑：
   ```
   python -X utf8 tools/build.py            # 要 0 錯 0 警
   $env:NODE_PATH = "C:\Code Buddy\DSEPass\node_modules"; node tools\smoke_test.js
   ```
   smoke test 有 200+ 斷言，包括把真 `style.css` 注入 jsdom 驗 computed style，以及 `.part-btn::before`／四狀態 token 等 CSS 斷言 —— **改 CSS 前要留意呢啲斷言**
4. 加新斷言時跟隨現有風格（`ok(...)` + 中文說明）
5. `build.py` 會依內容寫快取戳（`window.__V`），改咗檔案學生 Ctrl+F5 就一定見到新版
