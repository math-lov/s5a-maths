# 對圖表：課本圖（左）vs 網站圖（右），每張紙三題。
#
# 用法：
#   1) node tools/figshots.js "http://127.0.0.1:8788/quiz.html?c=ch11-1" 2 10
#      （逐題開頁、按到最後一步，圖存到 tools/_figshots/pN.png）
#   2) python -X utf8 tools/figsheet.py
#      → tools/_figsheet1..3.png，每行左邊是課本圖、右邊是網站圖
#
# PAIRS = (題號, 課本第幾幅圖, 網站第幾頁)；
# 課本圖的次序與題號不一致（Word 內的圖片是浮動的），所以要人手對一次。
import os

from docx import Document
from docx.oxml.ns import qn
from PIL import Image, ImageDraw

OUT = "tools/_figshots"
os.makedirs(OUT, exist_ok=True)

doc = Document("source/SMS_bkexe_5A11_e.docx")
n = 0
imgs = {}
for p in doc.paragraphs:
    for blip in p._p.findall(".//" + qn("a:blip")):
        n += 1
        if 7 <= n <= 16:
            rid = blip.get(qn("r:embed"))
            im = doc.part.related_parts[rid]
            fn = os.path.join(OUT, "bk%02d.%s" % (n, im.partname.ext))
            open(fn, "wb").write(im.blob)
            imgs[n] = fn

# 題號 → (課本圖 index, 網站頁 index)
PAIRS = [
    (1, 10, 2), (2, 8, 3), (3, 9, 4),
    (4, 12, 5), (5, 11, 6), (6, 13, 7),
    (7, 16, 8), (8, 14, 9), (9, 15, 10),
]

ROW_H = 420
for k in range(0, 9, 3):
    rows = PAIRS[k:k + 3]
    cells = []
    for code, bi, pi in rows:
        a = Image.open(imgs[bi]).convert("RGB")
        b = Image.open(os.path.join(OUT, "p%d.png" % pi)).convert("RGB")
        def fit(im, w, h):
            r = min(w / im.width, h / im.height)
            return im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
        cells.append((code, fit(a, 460, ROW_H - 40), fit(b, 460, ROW_H - 40)))

    w = 40 + 460 + 30 + 460 + 40
    sheet = Image.new("RGB", (w, (ROW_H + 20) * len(cells) + 30), "white")
    dr = ImageDraw.Draw(sheet)
    y = 20
    for code, a, b in cells:
        dr.text((14, y + 4), "Q%d" % code, fill="#111")
        dr.rectangle([40, y, 40 + 460, y + ROW_H - 40], outline="#ddd")
        sheet.paste(a, (40 + (460 - a.width) // 2, y + (ROW_H - 40 - a.height) // 2))
        dr.rectangle([530, y, 530 + 460, y + ROW_H - 40], outline="#ddd")
        sheet.paste(b, (530 + (460 - b.width) // 2, y + (ROW_H - 40 - b.height) // 2))
        y += ROW_H + 20
    out = "tools/_figsheet%d.png" % (k // 3 + 1)
    sheet.save(out)
    print("wrote", out, sheet.size)
