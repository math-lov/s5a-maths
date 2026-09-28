# Chapter 10 Quiz · 來源原文與核實記錄

> 這份檔案是**草稿層**（禁止手改題目資料；要改題目／題解請改 `data/src/ch10-test.json`）。
> 作用：保留原始試卷與官方評分參考的文字，將來核對、擴充或重做時可以追溯。

## 1. 來源

| 檔案 | 說明 |
|---|---|
| `C:\Code Buddy\s5a-maths\source\2627 ch10 test.doc` | 試卷（S.5 Mathematics · Chapter Quiz · Chapter 10 Inequalities · 25/9/2026 · 38 分） |
| `C:\Code Buddy\s5a-maths\source\2627 ch10 test marking.doc` | 官方評分參考（部分答案以紅色方程式圖顯示） |

抽取方法（工具見 `tools/doc-extract/`）：

1. Word COM 開 `.doc` → 取 `WordOpenXML`（flat OPC，含 VML 圖形與內嵌 WMF/BMP）。
2. `transcript.py`：把 OMML／`w:sym`（Symbol 字型，例如 `F0A3`＝≤、`F0B3`＝≥、`F0B9`＝≠、`F044`＝Δ、`F0BB`＝≈、`F02D`＝−）
   與內嵌圖片一併輸出成文字稿。
3. `extract_media.py` + `HKDSE/tools/wmf_to_png.py`：把 53 個內嵌 WMF（方程式圖）轉成 PNG，逐幅讀圖轉寫成 LaTeX。
4. `analyze_fig.py`：試卷的三幅圖（數線、兩幅拋物線）是 **VML 向量圖**（不是圖片），
   用 VML 的 `coordorigin`／`coordsize`／`style` 換算成共同座標後，讀出實際幾何：
   - MC Q1：數線，`0` 與 `4` 有刻度標示；`4` 是**實心圓點**，並由 `4` 向右有箭嘴 → **x ≥ 4**。
   - MC Q4：開口向上的拋物線，與 x 軸交於 `p`、`q`（p<q，兩者都在 O 右邊，軸上有刻度）。
   - SecB Q4：開口向上、頂點在 O 右下方（標示 `(2, −6)`），與 x 軸交於約 −0.449 及 4.449。
   （`bonus` 那幅只是 "Bonus" 外框，加分題本身沒有圖。）

## 2. 試卷原文（英文）

### Section A (Multiple choice) (10 marks)

1. The following shows the graphical representation of the solutions of an inequality. ［數線圖：4 為實心圓點，箭嘴向右］
   Which of the following can be the inequality?
   A. 2x + 3 > 3x − 1　B. 8x − 14 ≥ 3(x + 2)　C. 5x − 10 > −3x + 22　D. (x − 8)/6 ≥ x/2
2. The solution of x + 3 < 7 ≤ 2x + 9 is
   A. 6 < x ≤ −1　B. −6 ≤ x < 4　C. −1 ≤ x < 4　D. −1 < x ≤ 6
3. The solution of 6 − x/2 < x or −3x > −12 is
   A. x > 4　B. x < −4 or x > 4　C. no solution　D. all real numbers except 4
4. The figure shows the quadratic graph of y = ax² − bx − c. ［開口向上的拋物線，與 x 軸交於 p、q］
   The solutions of −ax² + bx + c < 0 are
   A. x < p or x > q　B. x ≤ p or x ≥ q　C. p < x < q　D. p ≤ x ≤ q
5. If a > b and c < 0, which of the following must be true?
   I. 1/a < 1/b　II. c²a < c²b　III. ac³ < bc³
   A. III only　B. I and III only　C. II and III only　D. I, II and III

### Section B (Conventional Questions) (28 marks)

1. (a) Solve the inequality 4(x + 3) > 10x + 1.　(b) Hence, solve the compound inequality 4(x + 3) > 10x + 1 and 3 − x ≥ 8.　(4 marks)
2. Consider the compound inequality 4 − x < (32 − 3x)/7 or x + 3 < 2 …………… (*).
   (a) Solve (*).　(b) Write down the greatest negative integer satisfying (*).　(4 marks)
3. Solve the following inequalities.　(a) −2x² + 5 ≤ 9x　(b) x² − 2x + 8 > 0　(c) (4x + 1)(2x − 3) ≤ −8　(9 marks)
4. ［開口向上的拋物線，最低點 (2, −6)］The figure shows the quadratic graph of y = x² + bx + c, where b and c are constants.
   It is given that the minimum point of the graph is (2, −6).
   (a) Find the values of b and c.　(b)(i) Solve the quadratic inequality x² + bx + c ≤ 0.
   (ii) Hence, write down all possible integers satisfying the inequality in (b)(i).
   (Leave the answers in surd form if necessary.)　(6 marks)
5. Let k be a constant and k ≠ −2. Find the range of values of k such that (k + 2)x² + 3x + (k − 2) < 0 for any real number x.　(5 marks)

### Bonus (3 marks)

Let k be a constant. Find the range of values of k such that f(x) = x² − (k + 3)x + 3k + 9 > 0 for all x ≥ 3.
(Hint: Consider the vertex of the graph of f(x).)

## 3. 官方評分參考（重點）

- SecB 1(a) 紅字答案：**x < 11/6**（11/6 為紅色方程式圖）。
- SecB 2：紅字為題中的分數 (32 − 3x)/7；(a) 的解為 x > −1 或 x < −1（除 −1 以外的所有實數），(b) 最大負整數 = −2。
- SecB 3(a) 紅字答案：**1/2**（臨界值）。官方評分：（1M）（1M）（1A）。
- SecB 3(b) 官方原句：`(b) x² > 2(x − 4)` → `x² − 2x + 8 > 0` → `x² − 2x + (2/2)² − (2/2)² + 8 > 0 1M` → `(x − 1)² + 7 > 0 1M` → `∴ The solutions are all real numbers. 1A`。
- SecB 3(c)：`8x² − 10x + 5 ≤ 0`，`Δ = (−10)² − 4(8)(5) = −60 < 0` → 無解。（1M）（1M）（1A）
- SecB 4(a)：`y = (x − 2)² − 6`（1M）→ `y = x² − 4x − 2` → `b = −4 and c = −2`（1A+1A）；
  (b)(i)：`(x − (4−√24)/2)(x − (4+√24)/2) ≤ 0`，即 `(4−√24)/2 ≤ x ≤ (4+√24)/2`（1M + 1A），亦可寫 `2 − √6 ≤ x ≤ 2 + √6`；
  (b)(ii)：`0, 1, 2, 3, 4`（1A）。
- SecB 5：`k + 2 < 0 → k < −2`（1A）；`Δ = 3² − 4(k + 2)(k − 2) < 0`（1M）→ `(2k + 5)(2k − 5) > 0`（1M）→ `k < −5/2 or k > 5/2`（1A）→ 與 (1) 取交集：**k < −5/2**（1A）。合共 5 分。
- Bonus：`f(3) = 9`（與 k 無關）→ 頂點 `x = (k + 3)/2`；
  Case 1（k = 3，頂點在 x = 3）、Case 2（k < 3，對稱軸在 3 左邊）、Case 3（k > 3，要 Δ < 0）：
  `Δ = [−(k + 3)]² − 4(3k + 9) < 0 → (k + 3)(k − 9) < 0 → −3 < k < 9`，與 k > 3 取交集得 3 < k < 9；
  綜合得 **k < 9**。

## 4. 答案核實（逐題獨立驗算）

| 題 | 答案 | 驗算 |
|---|---|---|
| A1 | **B** | 8x − 14 ≥ 3(x + 2) → 5x ≥ 20 → x ≥ 4，配合圖中實心圓點＋向右箭嘴 |
| A2 | **C** | x + 3 < 7 → x < 4；7 ≤ 2x + 9 → x ≥ −1 → −1 ≤ x < 4 |
| A3 | **D** | 6 − x/2 < x → x > 4；−3x > −12 → x < 4；「or」取聯集 = 除 4 以外的所有實數 |
| A4 | **A** | 圖：ax² − bx − c < 0 ⇔ p < x < q；題目要 −(ax² − bx − c) < 0 ⇔ ax² − bx − c > 0 ⇔ x < p 或 x > q |
| A5 | **A** | I 反例 a = 1, b = −1；II 因 c² > 0 方向不變；III 因 c³ < 0 要反方向 → 只有 III |
| B1 | (a) x < 11/6；(b) x ≤ −5 | 4x + 12 > 10x + 1 → 11 > 6x；3 − x ≥ 8 → x ≤ −5；取交集 |
| B2 | (a) x > −1 或 x < −1；(b) −2 | 4 − x < (32 − 3x)/7 → 28 − 7x < 32 − 3x → x > −1；x + 3 < 2 → x < −1 |
| B3 | (a) x ≤ −5 或 x ≥ 1/2；(b) 所有實數；(c) 無解 | (a) 2x² + 9x − 5 ≥ 0 → (2x − 1)(x + 5) ≥ 0；(b) (x − 1)² + 7 > 0；(c) Δ = −60 < 0 且 8 > 0 → 恆正 |
| B4 | (a) b = −4, c = −2；(b)(i) 2 − √6 ≤ x ≤ 2 + √6；(b)(ii) 0,1,2,3,4 | y = (x − 2)² − 6 = x² − 4x − 2；(x − 2)² ≤ 6；√6 ≈ 2.449 |
| B5 | k < −5/2 | k + 2 < 0 且 25 − 4k² < 0 → k < −5/2 或 k > 5/2；與 k < −2 取交集 |
| Bonus | k < 9 | f(3) = 9；頂點 (k+3)/2；三種情況合併 |

> 圖（`data/src/figures.json`）是按原始 VML 幾何重建的示意圖：數線的端點（實心／空心）與箭嘴方向、
> 拋物線的開口方向與根的位置都與原卷一致；標籤用平面文字（例如 `x = (k+3)/2`），因為 SVG 內不能排 LaTeX。
