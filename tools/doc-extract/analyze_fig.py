"""把 VML 圖形換算到共同坐標，輸出圖形語意摘要（線、圓、文字、曲線走向）。"""
import json, re, sys, math


def parse_style(s):
    d = {}
    if not s:
        return d
    for part in s.split(";"):
        if ":" in part:
            k, v = part.split(":", 1)
            d[k.strip()] = v.strip()
    return d


def parse_pair(v, default=(0.0, 0.0)):
    if v is None:
        return default
    v = v.strip()
    if not v:
        return default
    if "," in v:
        a, b = v.split(",", 1)
    else:
        a, b = v, str(default[1])
    def num(t):
        t = t.strip()
        if not t:
            return None
        return float(t)
    x = num(a)
    y = num(b)
    return (x if x is not None else default[0], y if y is not None else default[1])


def num_pt(s, default=0.0):
    if s is None:
        return default
    m = re.match(r"\s*(-?[\d.]+)", str(s))
    return float(m.group(1)) if m else default


class Node:
    def __init__(self, raw, parent_tf):
        self.raw = raw
        self.tag = raw.get("tag")
        st = parse_style(raw.get("style"))
        self.style = st
        self.flipx = "flip" in st and "x" in st["flip"]
        self.flipy = "flip" in st and "y" in st["flip"]
        self.left = num_pt(st.get("left"), 0.0)
        self.top = num_pt(st.get("top"), 0.0)
        self.width = num_pt(st.get("width"), 0.0)
        self.height = num_pt(st.get("height"), 0.0)
        self.co = parse_pair(raw.get("coordorigin"), (0.0, 0.0))
        self.cs = parse_pair(raw.get("coordsize"), (None, None))
        # 若 coordsize 缺某維 → 用 width/height 當 1:1
        if self.cs == (None, None) or (self.cs[0] is None):
            self.cs = (self.width or 1.0, self.height or 1.0)
        self.parent_tf = parent_tf
        self.text = raw.get("text", "")
        # 把子節點文字收集（textbox 內文字）
        self.all_text = self.collect_text(raw)

    def collect_text(self, r):
        out = []
        if r.get("tag") == "t":
            out.append(r.get("text") or "")
        for k in r.get("kids", []):
            out.append(self.collect_text(k))
        return "".join(out)

    def to_parent(self, x, y):
        """本節點坐標空間 (x,y) → 父層坐標"""
        fx = (x - self.co[0]) / self.cs[0] if self.cs[0] else 0
        fy = (y - self.co[1]) / self.cs[1] if self.cs[1] else 0
        if self.flipx:
            fx = 1 - fx
        if self.flipy:
            fy = 1 - fy
        return (self.left + fx * self.width, self.top + fy * self.height)

    def to_root(self, x, y):
        px, py = self.to_parent(x, y)
        tf = self.parent_tf
        while tf is not None:
            px, py = tf.to_parent(px, py)
            tf = tf.parent_tf
        return (px, py)


def children(node):
    return node.raw.get("kids", [])


def root_of(node, x, y):
    """(x,y) 在「父群組坐標系」→ 最外層坐標"""
    tf = node.parent_tf
    while tf is not None:
        x, y = tf.to_parent(x, y)
        tf = tf.parent_tf
    return (x, y)


def dump(node, depth, out):
    pad = "  " * depth
    tag = node.tag
    if tag == "group":
        out.append("%sGROUP %s cs=%s co=%s" % (pad, (node.style.get("left"), node.style.get("top"),
                                                     node.style.get("width"), node.style.get("height")),
                                               node.raw.get("coordsize"), node.raw.get("coordorigin")))
        for k in children(node):
            dump(Node(k, node), depth + 1, out)
    elif tag == "line":
        f = parse_pair(node.raw.get("from"))
        t = parse_pair(node.raw.get("to"))
        a1 = a2 = ""
        for k in children(node):
            if k.get("tag") == "stroke":
                a1, a2 = k.get("startarrow", ""), k.get("endarrow", "")
        r1 = root_of(node, *f)
        r2 = root_of(node, *t)
        out.append("%sLINE x=%.0f→%.0f y=%.0f→%.0f arrows=(%s,%s)" %
                   (pad, r1[0], r1[1], r2[0], r2[1], a1 or "-", a2 or "-"))
    elif tag == "oval":
        st = node.style
        cx = node.left + node.width / 2.0
        cy = node.top + node.height / 2.0
        rc = root_of(node, cx, cy)
        out.append("%sOVAL center_root=(%.0f,%.0f) d=%.0f fill=%s" %
                   (pad, rc[0], rc[1], node.width, node.raw.get("fillcolor", "(default white)")))
    elif tag in ("rect", "roundrect"):
        c1 = root_of(node, node.left, node.top)
        c2 = root_of(node, node.left + node.width, node.top + node.height)
        out.append("%s%s from_root=(%.0f,%.0f) to_root=(%.0f,%.0f) fill=%s" %
                   (pad, tag.upper(), c1[0], c1[1], c2[0], c2[1], node.raw.get("filled", "?")))
    elif tag == "shape":
        cl = node.raw.get("connectlocs")
        for k in children(node):
            if k.get("tag") == "path" and k.get("connectlocs"):
                cl = k.get("connectlocs")
        if cl:
            pts = [parse_pair(p) for p in cl.split(";") if p.strip()]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            mnx, mxx = min(xs), max(xs)
            mny, mxy = min(ys), max(ys)
            norm = []
            for (x, y) in pts:
                nx = (x - mnx) / (mxx - mnx) if mxx > mnx else 0
                ny = (y - mny) / (mxy - mny) if mxy > mny else 0
                ax = (1 - nx) if node.flipx else nx
                ay = (1 - ny) if node.flipy else ny
                rx, ry = root_of(node, node.left + ax * node.width, node.top + ay * node.height)
                norm.append((rx, ry))
            # 判斷頂點方向（screen coords: y 向下）
            imin = min(range(len(norm)), key=lambda i: norm[i][1])
            imax = max(range(len(norm)), key=lambda i: norm[i][1])
            out.append("%sSHAPE %d pts; y極小(screen 最上) idx=%d (%.0f,%.0f); y極大 idx=%d (%.0f,%.0f)  vertex_is_%s" %
                       (pad, len(norm), imin, norm[imin][0], norm[imin][1], imax, norm[imax][0],
                        norm[imax][1], "TOP" if imin > 0 and imin < len(norm) - 1 else ("END" if imin in (0, len(norm) - 1) else "?")))
            out.append("%s  curve pts: %s" % (pad, " ".join("%.0f,%.0f" % p for p in norm)))
        else:
            c1 = root_of(node, node.left, node.top)
            c2 = root_of(node, node.left + node.width, node.top + node.height)
            out.append("%sSHAPE(no curve) from_root=(%.0f,%.0f) to_root=(%.0f,%.0f) flip=%s%s" %
                       (pad, c1[0], c1[1], c2[0], c2[1],
                        ("x" if node.flipx else "") + ("y" if node.flipy else ""), node.all_text))
        for k in children(node):
            if k.get("tag") == "textbox":
                out.append("%s  TEXTBOX text=%r" % (pad, node.collect_text(k)))
    elif tag == "textbox":
        out.append("%sTEXTBOX text=%r" % (pad, node.collect_text(node.raw)))
    else:
        for k in children(node):
            dump(Node(k, node), depth, out)


def main():
    d = json.load(open(sys.argv[1], encoding="utf-8"))
    idxs = [int(x) for x in sys.argv[2].split(",")]
    sys.stdout.reconfigure(encoding="utf-8")
    for e in d:
        if e["para_index"] not in idxs:
            continue
        print("========== para %d  raw_text=%r" % (e["para_index"], e["text"][:90]))
        out = []
        for p in e["picts"]:
            for kid in p.get("kids", []):
                # 最外層 group 自己就是繪圖空間 → 直接以它為根
                dump(Node(kid, None), 0, out)
        print("\n".join(out))


main()
