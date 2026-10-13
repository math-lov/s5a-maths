# -*- coding: utf-8 -*-
"""由網站資料檔 data/src/<part>.json 生成 Word 工作紙（實體列印用）。

用法：
    python -X utf8 tools/make_worksheet_docx.py                  # 預設 ch17-test
    python -X utf8 tools/make_worksheet_docx.py --part ch17-test --out docs/worksheets/xxx.docx

為甚麼由資料檔生成：工作紙與網站題目共用同一份 data/src/<part>.json，
所以改題目（字句、分數、題數）只要改 JSON 再跑一次，兩邊永遠一致，不會抄錯。

工作紙內容（依 part 的 sections／questions 而定）：
    · 抬頭：課題標題（中英）、姓名／班別／日期、滿分與時限
    · 甲部多項選擇題：題目＋A–D 選項＋獨立作答格（O 形格）
    · 乙部長題目：題目＋各小問＋足夠書寫的橫線
    · 尾頁：公式速查與常犯陷阱（取自網站資料檔的 math／traps）
    · 頁尾：頁碼
"""
import argparse
import json
import os

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INK = (0x1F, 0x29, 0x37)
GREY = (0x6B, 0x72, 0x80)
LINE = (0xBF, 0xBF, 0xBF)
BLUE = (0x1D, 0x4E, 0xD8)

ASCII_FONT = "Segoe UI"
EA_FONT = "Microsoft JhengHei"

# LaTeX → 純文字（工作紙唔跑 KaTeX，數式用 Unicode 就夠）
SUBS = {"0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
        "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
        "n": "ₙ", "r": "ᵣ", "a": "ₐ", "k": "ₖ"}
SUP = {"0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
       "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
       "n": "ⁿ", "(": "⁽", ")": "⁾"}
REPL = {"\\,": " ", "\\;": " ", "\\!": "", "\\times": "×", "\\div": "÷",
        "\\cdot": "×", "\\le": "≤", "\\ge": "≥", "\\cdots": "…", "\\ldots": "…",
        "\\dots": "…", "\\lfloor": "⌊", "\\rfloor": "⌋", "\\pi": "π",
        "\\left": "", "\\right": "", "\\quad": "  ", "\\binom": "C"}


def plain(s):
    """把 KaTeX 字串變成可以列印的純文字。"""
    if s is None:
        return ""
    t = str(s)
    for k, v in REPL.items():
        t = t.replace(k, v)
    t = t.replace("$", "")
    # 上標／下標
    res = []
    i = 0
    while i < len(t):
        ch = t[i]
        if ch in "^{_" and i + 1 < len(t):
            kind = SUP if ch == "^" else SUBS
            group = t[i + 1]
            if group == "{":
                j = t.find("}", i + 2)
                if j > 0:
                    group, i = t[i + 2:j], j
            res.append("".join(kind.get(c, c) for c in group))
            i += 2
            continue
        res.append(ch)
        i += 1
    return "".join(res)


def style_run(run, size=10.5, bold=False, color=INK, italic=False):
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color)
    run.font.name = ASCII_FONT
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi"):
        rfonts.set(qn(attr), ASCII_FONT)
    rfonts.set(qn("w:eastAsia"), EA_FONT)
    return run


def para(doc, text="", size=10.5, bold=False, color=INK, space_after=4,
         space_before=0, align=None, indent=0, line=1.25, keep=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    pf.line_spacing = line
    pf.keep_with_next = keep          # 唔好將同一題拆到兩頁
    if indent:
        pf.left_indent = Cm(indent)
    if align is not None:
        p.alignment = align
    if text:
        style_run(p.add_run(text), size, bold, color)
    return p


def first_sentence(text):
    """工作紙只要引言第一句，唔想印五六行說明。"""
    if not text:
        return ""
    for sep in ("。", "．", ". "):
        if sep in text:
            return text.split(sep)[0].strip() + ("。" if sep == "。" else ". ")
    return text


def cell_borders(cell, bottom=True, box=False):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement("w:" + edge)
        if (edge == "bottom" and bottom) or (box and edge in ("top", "left", "right")):
            el.set(qn("w:val"), "single")
            el.set(qn("w:sz"), "4")
            el.set(qn("w:color"), "BFBFBF")
        else:
            el.set(qn("w:val"), "nil")
        borders.append(el)
    tc_pr.append(borders)


def ruled_lines(doc, rows, row_cm=0.9):
    """書寫用橫線（只有下邊線）。"""
    t = doc.add_table(rows=rows, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    for r in t.rows:
        r.height = Cm(row_cm)
        cell_borders(r.cells[0], bottom=True)
        r.cells[0].width = Cm(17.0)
    return t


def option_box(cell):
    """作答用小方格。"""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(p.add_run("○"), 11, False, GREY)


def header_block(doc, part, site_part):
    t = part["title"]
    para(doc, "%s ／ %s" % (t["zh"], t["en"]), size=16, bold=True,
         space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER)
    meta = site_part.get("meta") or {}
    bits = []
    if meta.get("paper"):
        bits.append(plain(meta["paper"]))
    if meta.get("marks"):
        bits.append("滿分 %s 分 Total %s marks" % (meta["marks"], meta["marks"]))
    if bits:
        para(doc, " · ".join(bits), size=10, color=GREY, space_after=8,
             align=WD_ALIGN_PARAGRAPH.CENTER)

    tb = doc.add_table(rows=1, cols=1)
    cell = tb.rows[0].cells[0]
    cell_borders(cell, bottom=True, box=True)
    cell.width = Cm(17.0)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    style_run(p.add_run("姓名 Name：____________　班別 Class：________　"
                        "日期 Date：________　得分 Score：______ ／ %s"
                        % meta.get("marks", "")), 10, False, INK)

    intro = part.get("intro") or {}
    para(doc, first_sentence((intro.get("zh") or "").replace("{{math:0}}", "")),
         size=9.5, color=GREY, space_before=6, space_after=0)
    para(doc, first_sentence((intro.get("en") or "").replace("{{math:0}}", "")),
         size=9, color=GREY, space_after=10)


def section_heading(doc, text_zh, text_en, marks):
    p = para(doc, "", size=12.5, bold=True, space_before=8, space_after=4, keep=True)
    style_run(p.add_run("%s　%s" % (text_zh, text_en)), 12.5, True, BLUE)
    style_run(p.add_run("　（共 %s 分 · %s marks）" % (marks, marks)), 10, False, GREY)


def add_mc(doc, qs):
    section_heading(doc, "甲部", "Section A · Multiple choice",
                    (qs[0]["marks"] * len(qs)))
    for q in qs:
        p = para(doc, "", space_after=1, space_before=6, keep=True)
        style_run(p.add_run("%s " % q["code"]), 11, True, INK)
        style_run(p.add_run("[%d 分]" % q["marks"]), 9.5, False, GREY)
        para(doc, plain(q["stem"]["en"]), size=10.5, space_after=1, indent=0.6, keep=True)
        if q["stem"].get("zh"):
            para(doc, plain(q["stem"]["zh"]), size=9.5, color=GREY,
                 space_after=3, indent=0.6, keep=True)
        opts = q["options"]
        keys = sorted(opts.keys())
        t = doc.add_table(rows=2, cols=2)
        for i, k in enumerate(keys):
            c = t.rows[i // 2].cells[i % 2]
            cell_borders(c, bottom=False)
            c.width = Cm(8.5)
            pp = c.paragraphs[0]
            pp.paragraph_format.space_after = Pt(1)
            pp.paragraph_format.left_indent = Cm(0.6)
            style_run(pp.add_run("(%s) %s" % (k, plain(opts[k]))), 10.5)

    # 獨立作答格
    para(doc, "作答格 Answer sheet", size=10.5, bold=True, space_before=8,
         space_after=3, keep=True)
    t = doc.add_table(rows=1 + len(qs), cols=5)
    heads = ["題號 Q.", "A", "B", "C", "D"]
    for j, h in enumerate(heads):
        c = t.rows[0].cells[j]
        cell_borders(c, bottom=True, box=True)
        c.width = Cm(3.4)
        pp = c.paragraphs[0]
        pp.paragraph_format.space_after = Pt(0)
        pp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style_run(pp.add_run(h), 10, True, GREY)
    for i, q in enumerate(qs, start=1):
        row = t.rows[i]
        c = row.cells[0]
        cell_borders(c, bottom=True, box=True)
        pp = c.paragraphs[0]
        pp.paragraph_format.space_after = Pt(0)
        pp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style_run(pp.add_run(q["code"]), 10, True, INK)
        for j in range(1, 5):
            cc = row.cells[j]
            cell_borders(cc, bottom=True, box=True)
            cc.width = Cm(3.4)
            option_box(cc)
        for j in range(5):
            row.cells[j].height = Cm(0.75)


def add_long(doc, qs):
    total = sum(q["marks"] for q in qs)
    section_heading(doc, "乙部", "Section B · Conventional questions", total)
    for q in qs:
        p = para(doc, "", space_after=1, space_before=8, keep=True)
        style_run(p.add_run("%s " % q["code"]), 11, True, INK)
        style_run(p.add_run("[%d 分]" % q["marks"]), 9.5, False, GREY)
        para(doc, plain(q["stem"]["en"]), size=10.5, space_after=1, indent=0.6, keep=True)
        if q["stem"].get("zh"):
            para(doc, plain(q["stem"]["zh"]), size=9.5, color=GREY,
                 space_after=2, indent=0.6, keep=True)
        for part in q.get("parts") or []:
            txt = " ".join(x for x in [part.get("label"), plain(part.get("en", ""))] if x)
            sub = para(doc, "", space_after=1, indent=0.9, keep=True)
            style_run(sub.add_run(txt), 10.5)
            style_run(sub.add_run("  [%d 分]" % part.get("marks", 0)), 9.5, False, GREY)
            if part.get("zh"):
                para(doc, plain(part["zh"]), size=9.5, color=GREY,
                     space_after=2, indent=0.9, keep=True)
        rows = max(5, q["marks"] + 2)
        ruled_lines(doc, rows)
        para(doc, "", size=6, space_after=0)


def add_formula_page(doc, part):
    doc.add_page_break()
    para(doc, "公式速查與常犯陷阱 ／ Formula sheet and common traps",
         size=14, bold=True, color=BLUE, space_after=8)
    para(doc, "排列 Permutations", size=11.5, bold=True, space_before=4, space_after=2)
    for s in ["n 件全部排一次： n!",
              "從 n 件揀 r 件排： P(n,r) = n! ÷ (n − r)!",
              "綑綁（必須相鄰）：(人數 − 1) 件排 × 框內排列",
              "插空（唔可以相鄰）：先排其他人，空隙 = 人數 + 1，每個空隙最多放一人"]:
        para(doc, "・" + s, size=10, space_after=2, indent=0.4)
    para(doc, "組合 Combinations", size=11.5, bold=True, space_before=8, space_after=2)
    for s in ["從 n 件揀 r 件（次序唔緊要）： C(n,r) = n! ÷ (r! × (n − r)!)",
              "P(n,r) = C(n,r) × r!（排法 = 揀法 × 排列）",
              "分類相加：case 之間用加法，case 之內用乘法",
              "「至少⋯⋯」：全部 − 完全唔合條件嗰組（反面）",
              "「至多 n 個」：0、1、⋯、n 共 n + 1 個 case"]:
        para(doc, "・" + s, size=10, space_after=2, indent=0.4)
    para(doc, "計數基本原理 Counting principles", size=11.5, bold=True,
         space_before=8, space_after=2)
    for s in ["分類（揀一種做法）：加法；步驟（做一件接一件）：乘法",
              "「或」＝分類用加法，但要先問兩類會否重疊（重疊就減交集）",
              "密碼／號碼：次序緊要，用排列；有位置限制就先處理受限制嗰個位"]:
        para(doc, "・" + s, size=10, space_after=2, indent=0.4)


def add_footer(section):
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(p.add_run("第 "), 9, False, GREY)
    r = p.add_run()
    style_run(r, 9, False, GREY)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    r._element.addnext(fld)
    style_run(p.add_run(" 頁 Page"), 9, False, GREY)


def main():
    ap = argparse.ArgumentParser(description="由網站資料檔生成 Word 工作紙")
    ap.add_argument("--part", default="ch17-test", help="課題 id（預設 ch17-test）")
    ap.add_argument("--out", default=None, help="輸出 .docx 路徑")
    args = ap.parse_args()

    src = os.path.join(ROOT, "data", "src", args.part + ".json")
    data = json.load(open(src, encoding="utf-8"))
    site = json.load(open(os.path.join(ROOT, "data", "src", "site.json"), encoding="utf-8"))
    site_part = next(p for p in site["site"]["parts"] if p["id"] == args.part)

    doc = Document()
    normal = doc.styles["Normal"]
    normal.font.name = ASCII_FONT
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), EA_FONT)

    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2.0)
    sec.top_margin = Cm(1.6)
    sec.bottom_margin = Cm(1.6)
    add_footer(sec)

    header_block(doc, data, site_part)
    for s in data.get("sections", []):
        qs = s.get("questions", [])
        if not qs:
            continue
        if qs[0]["type"] == "mc":
            add_mc(doc, qs)
        else:
            add_long(doc, qs)
    add_formula_page(doc, data)

    out = args.out or os.path.join(ROOT, "docs", "worksheets",
                                   "%s-worksheet.docx" % args.part)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    doc.save(out)
    print("已生成：%s（%d 題）" % (out, sum(len(s.get("questions", []))
                                        for s in data.get("sections", []))))


if __name__ == "__main__":
    main()