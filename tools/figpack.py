# 對圖包：把一個課題的每題整理成一個資料夾，內含
#   spec.json    現時的圖規格（可以直接交回 figimport.py 修改）
#   note.md      題目原文、指示、以及要對照的課本圖（mapping.json 有對到就會有 book.png）
# 另外把 Word 檔的圖抽出來放 book/ 並排一張有編號的 contact.png，
# 方便另一個（視覺）模型或你自己指出「邊幅才是這題的圖」。
#
# 用法：
#   python -X utf8 tools/figpack.py --part ch11-2 --images 56-84
#   node tools/figshots.js "http://127.0.0.1:8788/quiz.html?c=ch11-2" 1 5
#     （截圖會存到 tools/_figshots/pN.png，複製到對應的題目資料夾即可）
import json
import os
import shutil
import sys
from xml.etree import ElementTree

OUT = "tools/_audit"

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def arg(name, default=None):
    if name in sys.argv:
        i = sys.argv.index(name)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return default


def extract_book_images(lo, hi, dest):
    """由 docx 抽出第 lo..hi 幅圖（Word 內的次序），回傳 [(index, path)]。"""
    from docx import Document
    from docx.oxml.ns import qn

    os.makedirs(dest, exist_ok=True)
    doc = Document("source/SMS_bkexe_5A11_e.docx")
    n = 0
    got = []
    for p in doc.paragraphs:
        for blip in p._p.findall(".//" + qn("a:blip")):
            n += 1
            if lo <= n <= hi:
                rid = blip.get(qn("r:embed"))
                img = doc.part.related_parts[rid]
                fn = os.path.join(dest, "b%02d.%s" % (n, img.partname.ext))
                with open(fn, "wb") as f:
                    f.write(img.blob)
                got.append((n, fn))
    return got


def contact_sheet(images, dest):
    from PIL import Image, ImageDraw
    if not images:
        return None
    cell = (360, 320)
    cols = 4
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGB", (cell[0] * cols + 20, cell[1] * rows + 40), "white")
    dr = ImageDraw.Draw(sheet)
    for i, (idx, fn) in enumerate(images):
        im = Image.open(fn).convert("RGB")
        r = min((cell[0] - 16) / im.width, (cell[1] - 36) / im.height)
        im = im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
        cx = (i % cols) * cell[0] + 8
        cy = (i // cols) * cell[1] + 28
        dr.text((cx + 2, cy - 16), "#%d" % idx, fill="#b00")
        sheet.paste(im, (cx + (cell[0] - 16 - im.width) // 2, cy + (cell[1] - 36 - im.height) // 2))
    sheet.save(dest)
    return dest


def main():
    part = arg("--part")
    if not part:
        print("用法：python -X utf8 tools/figpack.py --part ch11-2 [--images 56-84]")
        return 1
    src = os.path.join("data/src", part + ".json")
    if not os.path.exists(src):
        print("✗ 找不到", src)
        return 1
    data = json.load(open(src, encoding="utf-8"))

    root = os.path.join(OUT, part)
    if os.path.isdir(root):
        shutil.rmtree(root)
    os.makedirs(root)

    qs = []
    for sec in data.get("sections", []):
        for q in sec.get("questions", []):
            qs.append((sec.get("id"), q))

    mapping_path = os.path.join(root, "mapping.json")
    mapping = {}
    if os.path.exists(mapping_path):
        mapping = json.load(open(mapping_path, encoding="utf-8"))

    for sec_id, q in qs:
        qid = q["id"]
        d = os.path.join(root, qid)
        os.makedirs(d, exist_ok=True)
        anim = q.get("anim")
        with open(os.path.join(d, "spec.json"), "w", encoding="utf-8") as f:
            json.dump({"part": part, "questions": [{"id": qid, "anim": anim}]},
                      f, ensure_ascii=False, indent=1)

        stem = (q.get("stem") or {}).get("en", "")
        note = [
            "# %s（%s）" % (qid, sec_id),
            "",
            "**題目**：" + stem,
            "",
            "## 要你看的事",
            "1. 這幅圖與課本的圖是否同一個排法（哪點在上面、哪條線連住）？",
            "2. 已知的角、等長、平行記號是否都在對應的位置？",
            "3. 解題步驟有沒有提到某條線，但圖上沒有畫？",
            "",
            "## 交回格式",
            "在 spec.json 裏直接改 `anim`（points / segments / steps），或者只寫差異：",
            "```json",
            "{\"part\": \"%s\", \"questions\": [{\"id\": \"%s\", \"anim\": { … }}]}" % (part, qid),
            "```",
            "然後跑：`python -X utf8 tools/figimport.py <檔案>`（會先驗證角度與平行，通過才寫入）",
            "",
            "## 圖的五種寫法",
            "```",
            "\"O\": {\"centre\": true}                       圓心",
            "\"A\": {\"at\": 112}                            圓上的點（角度，逆時針，0 = 右）",
            "\"D\": {\"at\": 0, \"r\": 2}                     圓外的點（r = 半徑倍數）",
            "\"E\": {\"cross\": [\"A\",\"C\",\"B\",\"D\"]}         直線 AC 與 BD 的交點",
            "\"P\": {\"extend\": [\"B\",\"A\"], \"k\": 0.4}       由 B 經 A 再走 0.4 個半徑",
            "\"M\": {\"between\": [\"A\",\"B\", 0.5]}            線段上的點（t = 0..1）",
            "```",
        ]
        with open(os.path.join(d, "note.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(note))

        idx = mapping.get(qid)
        book_dir = os.path.join(root, "book")
        if idx:
            for fn in os.listdir(book_dir) if os.path.isdir(book_dir) else []:
                if fn.startswith("b%02d." % int(idx)):
                    shutil.copy(os.path.join(book_dir, fn), os.path.join(d, "book.png"))
                    break

    images = []
    spec = arg("--images")
    if spec and "-" in spec:
        lo, hi = spec.split("-")
        images = extract_book_images(int(lo), int(hi), os.path.join(root, "book"))
        cs = contact_sheet(images, os.path.join(root, "book", "contact.png"))
        print("課本圖：%d 幅" % len(images), "｜contact:", cs)

    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump({q["id"]: mapping.get(q["id"]) for _, q in qs}, f,
                  ensure_ascii=False, indent=1)

    print("✓ 對圖包：%s（%d 題）" % (root, len(qs)))
    print("  每題一個資料夾：spec.json ＋ note.md")
    if not spec:
        print("  想連課本圖一齊放：加 --images 56-84（Word 內的圖片次序）")
    print("\n截圖：node tools/figshots.js \"http://127.0.0.1:8788/quiz.html?c=%s\" 1 %d"
          % (part, len(qs)))
    print("      再把 tools/_figshots/pN.png 複製成 <qid>/site.png")
    return 0


if __name__ == "__main__":
    sys.exit(main())
