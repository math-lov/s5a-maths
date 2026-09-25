"""抽出文件內的 VML 圖形（w:pict），以 JSON 結構輸出（去掉 gfxdata）。"""
import json, sys, re
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
PKG = "{http://schemas.microsoft.com/office/2006/xmlPackage}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
RELNS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def strip_ns(t):
    return t.split("}")[-1]


def main(path):
    root = ET.parse(path).getroot()
    parts = {p.get(PKG + "name"): p for p in root.findall(PKG + "part")}
    doc = None
    for n, p in parts.items():
        if "document.main" in (p.get(PKG + "contentType") or ""):
            doc = list(p.findall(PKG + "xmlData"))[0][0]
            docname = n
    # rels
    rels = {}
    rn = docname.replace("/word/", "/word/_rels/") + ".rels"
    if rn in parts:
        r = list(parts[rn].findall(PKG + "xmlData"))[0][0]
        for rel in r.findall(RELNS + "Relationship"):
            rels[rel.get("Id")] = rel.get("Target")

    def node(n):
        d = {"tag": strip_ns(n.tag)}
        for k, v in n.attrib.items():
            if k.endswith("gfxdata"):
                continue
            if len(v) > 20000:
                v = v[:20000]
            d[strip_ns(k)] = v
        if n.text and n.text.strip():
            d["text"] = n.text.strip()
        kids = [node(c) for c in n]
        if kids:
            d["kids"] = kids
        return d

    body = doc.find(W + "body")
    out = []
    idx = 0
    for p in body.iter():
        if p.tag != W + "p":
            continue
        picts = [c for c in p.iter() if strip_ns(c.tag) == "pict"]
        if not picts:
            continue
        # 段落前後的文字
        txt = "".join(t.text or "" for t in p.iter(W + "t")).strip()
        prev_txt = ""
        entry = {"para_index": idx, "text": txt, "rels_used": [], "picts": []}
        for pi in picts:
            entry["picts"].append(node(pi))
            for e in pi.iter():
                rid = e.get(RNS + "id")
                if rid and rid in rels:
                    entry["rels_used"].append(rid + "->" + rels[rid])
        out.append(entry)
        idx += 1
    txt = json.dumps(out, ensure_ascii=False, indent=1)
    if len(sys.argv) > 2:
        open(sys.argv[2], "w", encoding="utf-8").write(txt)
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(txt)


if __name__ == "__main__":
    main(sys.argv[1])
