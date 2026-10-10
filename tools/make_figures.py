#!/usr/bin/env python3
"""把 data/src/figures.json 的圖形規格畫成 SVG（純字串，無外部依賴）。

圖形：
  numline  數線（端點實心／空心、箭嘴、粗線段）
  graph    二次函數圖像（拋物線、對稱軸、頂點、根、螢光標示）
  grid     方格圖（座標平面上的格數，第 17.3 節路徑題用）
  venn     文氏圖（兩個相交圓、可加一個內圈 C、可填色與放元素）
所有座標都是「數學座標」，由這裡換算成像素，所以調範圍不會走位。
箭嘴用實心三角形自己畫（不用 SVG marker），確保任何渲染器都看到。
"""

from __future__ import annotations

import re

INK = "#1A202C"
MUTED = "#A0AEC0"
HL = "#F6E05E"
VENN_FILL = "#F5A9C0"
FONT = "system-ui, &quot;Noto Sans TC&quot;, &quot;Segoe UI&quot;, Arial, sans-serif"


def _c(node, key: str = "color") -> str:
    """節點可指定 color: muted（輔助線／次要條件用灰色）"""
    return MUTED if node.get(key) == "muted" else INK


def _n(v: float) -> str:
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return s if s else "0"


def _arrow(x: float, y: float, dx: float, dy: float, size: float = 10.0,
           color: str = INK) -> str:
    """在 (x, y) 畫一個指向 (dx, dy) 的實心箭嘴"""
    n = (dx * dx + dy * dy) ** 0.5 or 1.0
    ux, uy = dx / n, dy / n
    bx, by = x - ux * size, y - uy * size
    px, py = -uy, ux
    w = size * 0.42
    pts = "%.1f,%.1f %.1f,%.1f %.1f,%.1f" % (
        x, y, bx + px * w, by + py * w, bx - px * w, by - py * w)
    return '<polygon points="%s" fill="%s"/>' % (pts, color)


# ── 數線 ────────────────────────────────────────────────────────────────────
def numline(spec) -> str:
    lo, hi = float(spec["min"]), float(spec["max"])
    W, H = 720.0, 124.0
    pad = 34.0
    y = 66.0

    def px(v):
        return pad + (float(v) - lo) / (hi - lo) * (W - 2 * pad)

    out = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img">' % (W, H)]
    # 主軸線（兩端箭嘴）
    out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="2"/>'
               % (pad + 6, y, W - pad - 6, y, INK))
    out.append(_arrow(pad, y, -1, 0))
    out.append(_arrow(W - pad, y, 1, 0))
    # 刻度
    for t in spec.get("ticks", []):
        x = px(t)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="2"/>'
                   % (x, y - 7, x, y + 7, INK))
    # 標籤
    labels = [{"v": t, "text": _n(t)} for t in spec.get("ticks", [])]
    labels += spec.get("labels", [])
    for lab in labels:
        out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="17" font-family="%s" '
                   'text-anchor="middle">%s</text>' % (px(lab["v"]), y + 32, INK, FONT, lab["text"]))
    # 粗線段
    for seg in spec.get("segments", []):
        a, b = px(seg["from"]), px(seg["to"])
        c = _c(seg)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="4" '
                   'stroke-linecap="round"/>' % (a, y, b, y, c))
        if seg.get("arrowLeft"):
            out.append(_arrow(a, y, -1, 0, color=c))
        if seg.get("arrowRight"):
            out.append(_arrow(b, y, 1, 0, color=c))
        for end, key in ((a, "startClosed"), (b, "endClosed")):
            if seg.get(key) is not None:
                fill = c if seg[key] else "#FFFFFF"
                out.append('<circle cx="%.1f" cy="%.1f" r="6.5" fill="%s" stroke="%s" '
                           'stroke-width="2"/>' % (end, y, fill, c))
    # 射線（由一點向一邊伸延）
    for ray in spec.get("rays", []):
        a, b = px(ray["from"]), px(ray["to"])
        c = _c(ray)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="4" '
                   'stroke-linecap="round"/>' % (a, y, b, y, c))
        out.append(_arrow(b, y, 1 if b > a else -1, 0, color=c))
    # 端點圓點
    for pt in spec.get("points", []):
        if pt.get("hideDot"):
            continue
        c = _c(pt)
        fill = c if pt.get("closed") else "#FFFFFF"
        out.append('<circle cx="%.1f" cy="%.1f" r="6.5" fill="%s" stroke="%s" stroke-width="2"/>'
                   % (px(pt["v"]), y, fill, c))
    out.append("</svg>")
    return "".join(out)


# ── 二次函數圖像 ────────────────────────────────────────────────────────────
def graph(spec) -> str:
    x0, x1 = spec["x"]
    y0, y1 = spec["y"]
    W, H = 470.0, 400.0
    padL, padR, padT, padB = 46.0, 34.0, 38.0, 46.0

    def px(v):
        return padL + (float(v) - x0) / (x1 - x0) * (W - padL - padR)

    def py(v):
        return padT + (y1 - float(v)) / (y1 - y0) * (H - padT - padB)

    out = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img">' % (W, H)]

    ax_y = py(0) if y0 <= 0 <= y1 else py(y0)
    ax_x = px(0) if x0 <= 0 <= x1 else px(x0)
    # x 軸（箭嘴在右）
    out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.6"/>'
               % (px(x0) + 2, ax_y, px(x1) - 6, ax_y, INK))
    out.append(_arrow(px(x1), ax_y, 1, 0, 8))
    # y 軸（箭嘴在上）
    out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.6"/>'
               % (ax_x, py(y0) - 2, ax_x, py(y1) + 6, INK))
    out.append(_arrow(ax_x, py(y1), 0, -1, 8))
    # 軸標籤
    out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="16" font-family="%s" '
               'font-style="italic">x</text>' % (px(x1) + 2, ax_y + 18, INK, FONT))
    out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="16" font-family="%s" '
               'font-style="italic" text-anchor="middle">y</text>' % (ax_x, py(y1) - 10, INK, FONT))
    if not spec.get("hideO"):
        out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="16" font-family="%s" '
                   'text-anchor="end">O</text>' % (ax_x - 8, ax_y + 20, INK, FONT))

    # 對稱軸（虛線）
    for vl in spec.get("vlines", []):
        x = px(vl["x"])
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.6" '
                   'stroke-dasharray="7 5"/>' % (x, py(y1), x, py(y0), INK))
        if vl.get("label"):
            out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="14" font-family="%s">%s</text>'
                       % (x + 7, py(y1) + 16, INK, FONT, vl["label"]))

    # 拋物線
    for par in spec.get("parabolas", []):
        a, b, c = par["a"], par["b"], par["c"]

        def f(v):
            return a * v * v + b * v + c

        pts = []
        n = 240
        for i in range(n + 1):
            xv = x0 + (x1 - x0) * i / n
            yv = f(xv)
            pts.append((xv, yv, y0 <= yv <= y1))
        seg = []
        for item in pts + [(None, None, False)]:
            if item[2]:
                seg.append(item)
            elif seg:
                if len(seg) > 1:
                    d = "M " + " L ".join("%.1f %.1f" % (px(u), py(v)) for u, v, _ in seg)
                    out.append('<path d="%s" fill="none" stroke="%s" stroke-width="2.4"/>' % (d, INK))
                seg = []
        hl = None
        if spec.get("hlFrom") is not None:
            hl = [p for p in pts if p[2] and p[0] >= spec["hlFrom"]]
        elif spec.get("hlBetween"):
            lo, hi = spec["hlBetween"]
            hl = [p for p in pts if p[2] and lo <= p[0] <= hi]
        if hl and len(hl) > 1:
            d = "M " + " L ".join("%.1f %.1f" % (px(u), py(v)) for u, v, _ in hl)
            out.append('<path d="%s" fill="none" stroke="%s" stroke-width="11" '
                       'stroke-linecap="round" stroke-opacity="0.75"/>' % (d, HL))
            out.append('<path d="%s" fill="none" stroke="%s" stroke-width="2.4"/>' % (d, INK))
        if par.get("label"):
            out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="15" font-family="%s" '
                       'text-anchor="end">%s</text>' % (px(x1) - 4, py(y1) + 20, INK, FONT,
                                                        par["label"]))

    # 根（與 x 軸交點）
    for rt in spec.get("roots", []):
        x = px(rt["x"])
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.4"/>'
                   % (x, ax_y - 5, x, ax_y + 5, INK))
        side = "end" if rt["x"] < (x0 + x1) / 2 else "start"
        dx = -6 if side == "end" else 6
        out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="15" font-family="%s" '
                   'text-anchor="%s">%s</text>' % (x + dx, ax_y + 28, INK, FONT, side, rt["label"]))

    # 標示點
    for dot in spec.get("dots", []):
        x, y = px(dot["x"]), py(dot["y"])
        out.append('<circle cx="%.1f" cy="%.1f" r="5" fill="%s"/>' % (x, y, INK))
        if dot.get("label"):
            out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="15" font-family="%s">%s</text>'
                       % (x + dot.get("dx", 8), y + dot.get("dy", 20), INK, FONT, dot["label"]))

    out.append("</svg>")
    return "".join(out)


def grid(spec) -> str:
    cols, rows = int(spec["width"]), int(spec["height"])
    W, H = 440.0, 410.0
    left, top = 42.0, 32.0
    step_x, step_y = (W - 2 * left) / cols, (H - 2 * top) / rows

    def px(x):
        return left + float(x) * step_x

    def py(y):
        return H - top - float(y) * step_y

    out = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img">' % (W, H)]
    for x in range(cols + 1):
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#A0AEC0" stroke-width="1.4"/>'
                   % (px(x), py(0), px(x), py(rows)))
    for y in range(rows + 1):
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#A0AEC0" stroke-width="1.4"/>'
                   % (px(0), py(y), px(cols), py(y)))
    for y in range(rows + 1):
        for x in range(cols + 1):
            out.append('<circle cx="%.1f" cy="%.1f" r="2.5" fill="%s"/>'
                       % (px(x), py(y), INK))
    for mark in spec.get("labels", []):
        out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="18" font-family="%s" font-weight="600">%s</text>'
                   % (px(mark["x"]) + mark.get("dx", 9), py(mark["y"]) + mark.get("dy", -9),
                      INK, FONT, mark["text"]))
    out.append("</svg>")
    return "".join(out)


# ── 文氏圖 ──────────────────────────────────────────────────────────────────
def venn(spec) -> str:
    """兩個相交圓（可加一個完全在 A 之內的 C）、可填色、可在各區域放元素。

    regions：aOnly／both／bOnly／outside／cOnly（每個是元素字串陣列）
    shade  ：aOnly／both／bOnly／outside／cOnly／all（要填色的區域）
    """
    W, H = 520.0, 380.0
    fx0, fy0, fx1, fy1 = 20.0, 16.0, 500.0, 364.0
    ax, ay, r = 190.0, 205.0, 112.0
    bx, by = 330.0, 205.0
    cx, cy, cr = 168.0, 240.0, 52.0
    uid = re.sub(r"[^A-Za-z0-9]", "", spec.get("id") or "venn")
    names = list(spec.get("sets") or ["A", "B"])
    a_lbl = names[0] if names else "A"
    b_lbl = names[1] if len(names) > 1 else "B"
    c_lbl = spec.get("cLabel") or "C"
    has_c = bool(spec.get("nest"))
    shade = list(spec.get("shade") or [])
    out = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img">' % (W, H)]

    def circ(x, y, rr, fill, extra=""):
        return ('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"%s/>'
                % (x, y, rr, fill, extra))

    out.append("<defs>")
    out.append('<mask id="%s-aonly" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f">%s%s</mask>'
               % (uid, W, H, circ(ax, ay, r, "#fff"), circ(bx, by, r, "#000")))
    out.append('<mask id="%s-bonly" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f">%s%s</mask>'
               % (uid, W, H, circ(bx, by, r, "#fff"), circ(ax, ay, r, "#000")))
    out.append('<mask id="%s-inA" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f">%s</mask>'
               % (uid, W, H, circ(ax, ay, r, "#fff")))
    out.append('<mask id="%s-inB" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f">%s</mask>'
               % (uid, W, H, circ(bx, by, r, "#fff")))
    out.append('<mask id="%s-out" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f">'
               '<rect x="0" y="0" width="%.0f" height="%.0f" fill="#fff"/>%s%s</mask>'
               % (uid, W, H, W, H, circ(ax, ay, r, "#000"), circ(bx, by, r, "#000")))
    out.append("</defs>")

    out.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#FFFFFF" stroke="%s" stroke-width="1.6"/>'
               % (fx0, fy0, fx1 - fx0, fy1 - fy0, INK))

    def band(mask=None):
        m = ' mask="url(#%s)"' % mask if mask else ""
        return ('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s"%s/>'
                % (fx0, fy0, fx1 - fx0, fy1 - fy0, VENN_FILL, m))

    if "outside" in shade:
        out.append(band(uid + "-out"))
    if "aOnly" in shade:
        out.append(band(uid + "-aonly"))
    if "bOnly" in shade:
        out.append(band(uid + "-bonly"))
    if "both" in shade:
        out.append('<g mask="url(#%s-inB)">%s</g>' % (uid, band(uid + "-inA")))
    if "cOnly" in shade:
        out.append(circ(cx, cy, cr, VENN_FILL))
    if "all" in shade:
        out.append(band())

    out.append(circ(ax, ay, r, "none", ' stroke="%s" stroke-width="2"' % INK))
    out.append(circ(bx, by, r, "none", ' stroke="%s" stroke-width="2"' % INK))
    if has_c:
        out.append(circ(cx, cy, cr, "none", ' stroke="%s" stroke-width="2"' % INK))
    out.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" stroke="%s" stroke-width="1.6"/>'
               % (fx0, fy0, fx1 - fx0, fy1 - fy0, INK))

    def txt(x, y, s, size=17, weight="400"):
        return ('<text x="%.1f" y="%.1f" fill="%s" font-size="%d" font-weight="%s" '
                'font-family="%s" text-anchor="middle">%s</text>'
                % (x, y, INK, size, weight, FONT, s))

    if spec.get("frame"):
        out.append(txt(fx0 + 20, fy0 + 28, spec["frame"], 18, "600"))
    out.append(txt(ax - r * 0.45, ay - r * 0.55, a_lbl, 18, "600"))
    out.append(txt(bx + r * 0.45, by - r * 0.55, b_lbl, 18, "600"))
    if has_c:
        out.append(txt(cx - cr * 0.42, cy - cr * 0.34, c_lbl, 16, "600"))

    regions = spec.get("regions") or {}
    if regions:
        buckets = {"aOnly": [], "both": [], "bOnly": [], "outside": [], "cOnly": []}
        # 先建立一個細網格，逐點判斷它落在哪一區。落在「貼近圓邊的灰帶」的點
        # 一律不用（避免文字壓住圓周或看起來不屬於那一區）。
        pad_a = 22.0
        pad_c = 18.0
        pad_out = 12.0
        s_pt = (fx0 + 20, fy0 + 28)
        cols, rows = 11, 8
        step_x = (fx1 - fx0 - 52) / (cols - 1)
        step_y = (fy1 - fy0 - 78) / (rows - 1)
        for j in range(rows):
            yy = fy0 + 56 + j * step_y
            for i in range(cols):
                xx = fx0 + 26 + i * step_x
                if (xx - s_pt[0]) ** 2 + (yy - s_pt[1]) ** 2 <= 46 ** 2:
                    continue                      # 太貼近 S 標籤
                d_a = ((xx - ax) ** 2 + (yy - ay) ** 2) ** 0.5
                d_b = ((xx - bx) ** 2 + (yy - by) ** 2) ** 0.5
                d_c = ((xx - cx) ** 2 + (yy - cy) ** 2) ** 0.5 if has_c else 1e9
                if r - pad_a < d_a <= r or r - pad_a < d_b <= r:
                    continue                      # 貼近 A／B 圓周的灰帶
                if has_c and cr - pad_c < d_c <= cr:
                    continue                      # 貼近 C 圓周的灰帶
                if has_c and d_c <= cr - pad_c:
                    buckets["cOnly"].append((xx, yy))
                elif d_a <= r - pad_a and d_b <= r - pad_a:
                    buckets["both"].append((xx, yy))
                elif d_a <= r - pad_a:
                    buckets["aOnly"].append((xx, yy))
                elif d_b <= r - pad_a:
                    buckets["bOnly"].append((xx, yy))
                elif d_a >= r + pad_out and d_b >= r + pad_out:
                    buckets["outside"].append((xx, yy))
        order = {
            "aOnly": lambda p: (p[0], p[1]),
            "both": lambda p: (p[1], p[0]),
            "bOnly": lambda p: (-p[0], p[1]),
            "outside": lambda p: (-p[1], p[0]),
            "cOnly": lambda p: (p[1], p[0]),
        }
        # 文字之間要留位：先放 S／A／B／C 標籤，再逐個元素揀最接近而且夠遠的位置
        placed = [s_pt, (ax - r * 0.45, ay - r * 0.55), (bx + r * 0.45, by - r * 0.55)]
        if has_c:
            placed.append((cx - cr * 0.42, cy - cr * 0.34))
        used = set()
        for key in ("aOnly", "both", "bOnly", "outside", "cOnly"):
            items = [str(v) for v in regions.get(key, [])]
            spots = sorted(buckets[key], key=order[key])
            for item in items:
                chosen = None
                for sp in spots:
                    if sp in used:
                        continue
                    if all((sp[0] - q[0]) ** 2 + (sp[1] - q[1]) ** 2 >= 44 ** 2 for q in placed):
                        chosen = sp
                        break
                if chosen is None:
                    for sp in spots:
                        if sp not in used:
                            chosen = sp
                            break
                if chosen is None:
                    continue
                used.add(chosen)
                placed.append(chosen)
                out.append(txt(chosen[0], chosen[1] + 6, item))
    out.append("</svg>")
    return "".join(out)


def render(fig_id: str, spec) -> dict:
    kind = spec.get("type")
    if isinstance(spec, dict):
        spec = dict(spec)
        spec["id"] = fig_id
    if kind == "numline":
        svg = numline(spec)
    elif kind == "graph":
        svg = graph(spec)
    elif kind == "grid":
        svg = grid(spec)
    elif kind == "venn":
        svg = venn(spec)
    else:
        raise ValueError("未知圖形類型：%s（%s）" % (kind, fig_id))
    return {"id": fig_id, "svg": svg, "caption": spec.get("caption", {})}
