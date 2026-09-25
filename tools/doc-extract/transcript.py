"""從 WordOpenXML（flat OPC）抽出圖片並輸出「帶圖片檔名」的可讀文字稿。

用法：python transcript.py <file.xml> <media_out_dir> > out.txt
"""
import base64, os, re, sys, json
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
PKG = "{http://schemas.microsoft.com/office/2006/xmlPackage}"
VML = "{urn:schemas-microsoft-com:vml}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
RELNS = "{http://schemas.openxmlformats.org/package/2006/relationships}"

EXT = {"image/x-wmf": ".wmf", "image/x-emf": ".emf", "image/png": ".png",
       "image/jpeg": ".jpg", "image/gif": ".gif", "image/bmp": ".bmp",
       "image/tiff": ".tif"}


def math_text(node):
    return "".join(t.text or "" for t in node.iter(M + "t")).strip()


class Pkg:
    def __init__(self, path):
        self.root = ET.parse(path).getroot()
        self.parts = {}
        for part in self.root.findall(PKG + "part"):
            self.parts[part.get(PKG + "name")] = part

    def xml(self, name):
        p = self.parts.get(name)
        if p is None:
            return None
        for d in p.findall(PKG + "xmlData"):
            for c in d:
                return c
        return None

    def rels(self, doc_name):
        rel_name = os.path.dirname(doc_name) + "/_rels/" + os.path.basename(doc_name) + ".rels"
        node = self.xml(rel_name)
        out = {}
        if node is None:
            return out
        for rel in node.findall(RELNS + "Relationship"):
            out[rel.get("Id")] = rel.get("Target")
        return out


def main(path, outdir):
    os.makedirs(outdir, exist_ok=True)
    pkg = Pkg(path)
    doc_name, doc = None, None
    for name in pkg.parts:
        if name == "/word/document.xml":
            doc = pkg.xml(name)
            doc_name = name
            break
    if doc is None:
        for name, part in pkg.parts.items():
            ct = part.get(PKG + "contentType") or ""
            if "wordprocessingml.document.main" in ct:
                doc = pkg.xml(name)
                doc_name = name
                break
    rels = pkg.rels(doc_name) if doc_name else {}

    def resolve(target):
        if target.startswith("/"):
            return target
        return os.path.normpath(os.path.join(os.path.dirname(doc_name), target)).replace("\\", "/")

    # 抽圖（記住 part name → 檔名）
    img_map = {}
    n = 0
    for name, part in sorted(pkg.parts.items()):
        ct = part.get(PKG + "contentType") or ""
        if not ct.startswith("image/"):
            continue
        for data in part.findall(PKG + "binaryData"):
            raw = (data.text or "").strip()
            if not raw:
                continue
            try:
                blob = base64.b64decode(raw)
            except Exception:
                continue
            ext = EXT.get(ct, ".bin")
            fn = "%03d%s" % (n, ext)
            open(os.path.join(outdir, fn), "wb").write(blob)
            img_map[name] = fn
            n += 1
    json.dump(img_map, open(os.path.join(outdir, "_map.json"), "w"), indent=1)

    def img_tag(node):
        """從 w:object / w:pict 找出圖片檔名"""
        for sub in node.iter():
            rid = sub.get(RNS + "id") or sub.get(RNS + "embed") or sub.get(RNS + "pict")
            if rid and rid in rels:
                t = resolve(rels[rid])
                if t in img_map:
                    return "[IMG:%s]" % img_map[t]
            rid2 = sub.get(VML + "title")  # 忽略
        return "[IMG:?]"

    def para_text(p):
        out = []
        for child in p:
            tag = child.tag
            if tag == W + "r":
                for sub in child:
                    if sub.tag == W + "t":
                        out.append(sub.text or "")
                    elif sub.tag == M + "oMath":
                        out.append("[M]" + math_text(sub) + "[/M]")
                    elif sub.tag == W + "object":
                        out.append(img_tag(sub))
                    elif sub.tag == W + "pict":
                        tp = img_tag(sub)
                        out.append(tp if tp != "[IMG:?]" else "[PICT]")
                    elif sub.tag == W + "drawing":
                        tp = img_tag(sub)
                        out.append(tp if tp != "[IMG:?]" else "[DRAW]")
                    elif sub.tag == W + "sym":
                        out.append("[SYM:%s:%s]" % (sub.get(W + "font"), sub.get(W + "char")))
            elif tag == M + "oMath":
                out.append("[M]" + math_text(child) + "[/M]")
            elif tag == W + "hyperlink":
                for sub in child.iter(W + "t"):
                    out.append(sub.text or "")
        return "".join(out).strip()

    def walk(body, lines):
        for node in body:
            if node.tag == W + "p":
                t = para_text(node)
                if t:
                    lines.append(t)
            elif node.tag == W + "tbl":
                lines.append("--- TABLE ---")
                for tr in node.findall(W + "tr"):
                    cells = []
                    for tc in tr.findall(W + "tc"):
                        ct = []
                        for p in tc.findall(W + "p"):
                            t = para_text(p)
                            if t:
                                ct.append(t)
                        cells.append(" / ".join(ct))
                    lines.append(" | ".join(cells))
                lines.append("--- END TABLE ---")
            elif node.tag == W + "sdt":
                c = node.find(W + "sdtContent")
                if c is not None:
                    walk(c, lines)

    lines = []
    walk(doc.find(W + "body"), lines)
    txt = "\n".join(lines)
    if len(sys.argv) > 3:
        open(sys.argv[3], "w", encoding="utf-8").write(txt)
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(txt)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
