"""逐 run（w:r）印出段落內容，讓圖片位置與文字順序一目了然。

用法：python runs.py <xml> <start_line> <end_line> <media_dir>
"""
import os, re, sys, json
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
PKG = "{http://schemas.microsoft.com/office/2006/xmlPackage}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
RELNS = "{http://schemas.openxmlformats.org/package/2006/relationships}"

SYM = {"F0A3": "≤", "F0B3": "≥", "F0B9": "≠", "F02D": "−", "F044": "Δ",
       "F0BB": "≈", "F0B0": "°", "F0B1": "±"}


def main():
    path, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    media = sys.argv[4] if len(sys.argv) > 4 else None
    pkg_root = ET.parse(path).getroot()
    parts = {p.get(PKG + "name"): p for p in pkg_root.findall(PKG + "part")}
    doc = None
    docname = None
    for n, p in parts.items():
        if "document.main" in (p.get(PKG + "contentType") or ""):
            doc = list(p.findall(PKG + "xmlData"))[0][0]
            docname = n
    rels = {}
    rn = docname.replace("/word/", "/word/_rels/") + ".rels"
    if rn in parts:
        r = list(parts[rn].findall(PKG + "xmlData"))[0][0]
        for rel in r.findall(RELNS + "Relationship"):
            rels[rel.get("Id")] = rel.get("Target")
    img_map = json.load(open(os.path.join(media, "_map.json"), encoding="utf-8")) if media else {}

    # 建 part name → 索引
    def resolve(t):
        if t.startswith("/"):
            return t
        return os.path.normpath(os.path.join("/word", t)).replace("\\", "/")

    lines = []

    def run_text(r):
        out = []
        for sub in r:
            if sub.tag == W + "t":
                out.append(sub.text or "")
            elif sub.tag == W + "sym":
                c = (sub.get(W + "char") or "").upper()
                out.append(SYM.get(c, "‹%s›" % c))
            elif sub.tag == W + "tab":
                out.append("\t")
            elif sub.tag in (W + "object", W + "pict", W + "drawing"):
                got = "?"
                for e in sub.iter():
                    rid = e.get(RNS + "id")
                    if rid and rid in rels:
                        t = resolve(rels[rid])
                        if t in img_map:
                            got = img_map[t]
                            break
                out.append("{%s}" % got)
            elif sub.tag == M + "oMath":
                out.append("[M]" + "".join(x.text or "" for x in sub.iter(M + "t")) + "[/M]")
        return "".join(out)

    def para(p):
        out = []
        for child in p:
            if child.tag == W + "r":
                t = run_text(child)
                if t:
                    out.append(t)
        return "".join(out)

    def walk(node):
        for n in node:
            if n.tag == W + "p":
                t = para(n)
                if t.strip():
                    lines.append(t)
            elif n.tag == W + "tbl":
                for tr in n.findall(W + "tr"):
                    cells = []
                    for tc in tr.findall(W + "tc"):
                        cells.append(" / ".join(para(p) for p in tc.findall(W + "p") if para(p).strip()))
                    lines.append(" | ".join(cells))
            elif n.tag == W + "sdt":
                c = n.find(W + "sdtContent")
                if c is not None:
                    walk(c)

    walk(doc.find(W + "body"))
    sys.stdout.reconfigure(encoding="utf-8")
    for i in range(a - 1, min(b, len(lines))):
        print("%3d| %s" % (i + 1, lines[i]))


main()
