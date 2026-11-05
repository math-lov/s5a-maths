# 圖形自檢：把每個 anim 畫出來的角、平行線，與它自己寫的標籤核對。
# 用法：python -X utf8 tools/figcheck.py [data/src/ch11-1.json ...]
# 這一支只查「圖同數字唔夾」，查不到「同課本唔同」——後者要用對圖表（figsheet）。
import json
import math
import re
import sys

TOL_ANG = 0.9      # 度
TOL_PAR = 0.02     # 平行：單位向量叉積


def polar(deg):
    t = math.radians(deg)
    return (math.cos(t), math.sin(t))


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def ang(a, v, b):
    u, w = sub(a, v), sub(b, v)
    nu, nw = math.hypot(*u), math.hypot(*w)
    if nu < 1e-9 or nw < 1e-9:
        return None
    c = (u[0] * w[0] + u[1] * w[1]) / (nu * nw)
    return math.degrees(math.acos(max(-1, min(1, c))))


def cross_pt(a, b, c, d):
    rx, ry = b[0] - a[0], b[1] - a[1]
    sx, sy = d[0] - c[0], d[1] - c[1]
    den = rx * sy - ry * sx
    if abs(den) < 1e-12:
        return None
    t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den
    return (a[0] + t * rx, a[1] + t * ry)


def build_points(anim):
    pts = {}
    specs = anim.get("points") or {}
    for name, s in specs.items():
        if s.get("centre"):
            pts[name] = (0.0, 0.0)
        elif "at" in s:
            pts[name] = polar(s["at"])
    for name in specs:
        s = specs[name]
        if "cross" in s:
            c = s["cross"]
            if all(k in pts for k in c):
                p = cross_pt(pts[c[0]], pts[c[1]], pts[c[2]], pts[c[3]])
                if p:
                    pts[name] = p
    for name in specs:
        s = specs[name]
        if "extend" in s:
            a, b = s["extend"]
            if a in pts and b in pts:
                ux, uy = sub(pts[b], pts[a])
                d = math.hypot(ux, uy) or 1
                k = s.get("k", 0.5)
                pts[name] = (pts[b][0] + ux / d * k, pts[b][1] + uy / d * k)
        if "between" in s:
            a, b, t = s["between"][0], s["between"][1], s["between"][2]
            if a in pts and b in pts:
                pts[name] = (pts[a][0] + (pts[b][0] - pts[a][0]) * t,
                             pts[a][1] + (pts[b][1] - pts[a][1]) * t)
    return pts


NUM = re.compile(r"^(-?\d+(?:\.\d+)?)°$")


def check_file(path):
    d = json.load(open(path, encoding="utf-8"))
    bad = []
    for sec in d.get("sections", []):
        for q in sec.get("questions", []):
            anim = q.get("anim")
            if not anim:
                continue
            pts = build_points(anim)
            tag = "%s Q%s" % (path, q.get("code"))
            for i, st in enumerate(anim.get("steps") or [], 1):
                for a in st.get("arcs") or []:
                    v, p1, p2, lab = a[0], a[1], a[2], a[3]
                    for k in (v, p1, p2):
                        if k not in pts:
                            bad.append("%s step %d: 點 %s 不存在" % (tag, i, k))
                    if not all(k in pts for k in (v, p1, p2)):
                        continue
                    real = ang(pts[p1], pts[v], pts[p2])
                    if len(a) > 6 and a[6] == "reflex" and real is not None:
                        real = 360.0 - real      # 第 7 個元素寫 reflex：量的是反角
                    m = NUM.match(str(lab))
                    if m:
                        want = float(m.group(1))
                        if real is None or abs(real - want) > TOL_ANG:
                            bad.append("%s step %d: 標籤 %s 但圖上係 %.1f°"
                                       % (tag, i, lab, real or -1))
                for seg in st.get("parallel") or []:
                    if len(seg) != 2 or seg[0] not in pts or seg[1] not in pts:
                        bad.append("%s step %d: 平行記號的點不存在 %s" % (tag, i, seg))
                        continue
                par = st.get("parallel") or []
                if len(par) >= 2:
                    u = sub(pts[par[0][1]], pts[par[0][0]])
                    w = sub(pts[par[1][1]], pts[par[1][0]])
                    nu, nw = math.hypot(*u), math.hypot(*w)
                    if nu > 1e-9 and nw > 1e-9:
                        cr = (u[0] * w[1] - u[1] * w[0]) / (nu * nw)
                        if abs(cr) > TOL_PAR:
                            bad.append("%s step %d: 標了平行但實際唔平行（sin=%.3f）"
                                       % (tag, i, cr))
    return bad


def main():
    files = sys.argv[1:] or ["data/src/ch11-1.json"]
    total = 0
    for f in files:
        bad = check_file(f)
        total += len(bad)
        for b in bad:
            print("  ✗", b)
        print("%-32s %s" % (f, "OK" if not bad else "%d 個問題" % len(bad)))
    print("\n合共 %d 個問題" % total)


main()
