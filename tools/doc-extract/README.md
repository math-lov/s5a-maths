# .doc 試卷抽取工具（Windows + Word + Python）

用途：把校內試卷 `.doc`（Word 97 格式、含 Equation 3.0 方程式與 VML 圖形）變成
可以閱讀／轉寫的文字稿與圖片，方便整理成 `data/src/*.json`。

## 流程

```powershell
# 0) 先在 PowerShell 把 .doc 的 WordOpenXML（flat OPC）倒出來
$w = New-Object -ComObject Word.Application; $w.Visible = $false; $w.DisplayAlerts = 0
$d = $w.Documents.Open("C:\Code Buddy\s5a-maths\source\2627 ch10 test.doc", $false, $true)
[System.IO.File]::WriteAllText("C:\temp\ch10.xml", [string]$d.WordOpenXML, [System.Text.Encoding]::UTF8)
$d.Close(0); $w.Quit()

# 1) 文字稿（含 w:sym 符號、內嵌圖片位置）＋圖片
python tools/doc-extract/transcript.py C:\temp\ch10.xml C:\temp\mm ch10.txt
python tools/doc-extract/extract_media.py C:\temp\ch10.xml C:\temp\mm

# 2) WMF（方程式圖）→ PNG（用 HKDSE 專案已驗證的轉換器）
python "C:\Code Buddy\HKDSE\tools\wmf_to_png.py" --dir C:\temp\mm --recursive --scale 4

# 3) 逐段落、逐 run 看（圖片位置最清楚，用來對版面）
python tools/doc-extract/runs.py C:\temp\ch10.xml 50 120 C:\temp\mm

# 4) 圖形（VML 向量圖）幾何分析：線、圓點（實心／空心）、箭嘴、拋物線
python tools/doc-extract/vml_dump.py C:\temp\ch10.xml C:\temp\vml.json
python tools/doc-extract/analyze_fig.py C:\temp\vml.json 24,25,26
```

## 要點

* **方程式是圖片**：Equation 3.0 物件在 `.doc` 內存成 WMF（顯示用）＋ OLE（資料用）。
  抽取時只有 WMF，所以要用「讀圖」方式轉寫成 LaTeX（本專案的做法）。
* **`w:sym` 要自己對映**：Symbol 字型的 `≤ ≥ ≠ Δ ≈ −` 等會存成 `F0A3`／`F0B3`／`F0B9`／`F044`／`F0BB`／`F02D`。
* **示意圖是 VML**：`v:group`（`coordorigin`／`coordsize`／`style` 的 left/top/width/height，可 `flip:x/y`）
  內有 `v:line`（`from`／`to`，`stroke` 的 `startarrow`／`endarrow`＝箭嘴）、`v:oval`（`fillcolor="black"` ＝實心圓點）、
  `v:shape`（`v:path` 的 `connectlocs` 是曲線取樣點，`coordsize` 是其自身座標）。
  `analyze_fig.py` 已處理「群組自己的座標空間 vs 子元素的父群組座標空間」這個差異
  （線／圓／矩形用父群組座標，只有 freeform 曲線用自身座標）。
* Word 沒有把舊式方程式轉成 OMML 的方法（`ConvertEquationToOfficeMath` 不存在），所以一定要讀圖。
