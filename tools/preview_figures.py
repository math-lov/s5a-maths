#!/usr/bin/env python3
"""把 data/figures.js 內每幅 SVG 畫成 PNG（用 PyMuPDF），方便肉眼檢查。

用法：python tools/preview_figures.py [輸出目錄]
需要：pip install pymupdf
"""
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main() -> int:
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "tools", "_preview")
    os.makedirs(out, exist_ok=True)
    txt = open(os.path.join(BASE, "data", "figures.js"), encoding="utf-8").read()
    figs = json.loads(txt[txt.index("{"):txt.rindex("}") + 1])
    try:
        import pymupdf  # noqa: PLC0415
    except ImportError:
        print("需要 pymupdf：pip install pymupdf")
        return 1
    for fid, f in figs.items():
        svg = f["svg"]
        doc = pymupdf.open(stream=svg.encode("utf-8"), filetype="svg")
        page = doc[0]
        pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
        pix.save(os.path.join(out, fid + ".png"))
        print("寫出", os.path.join(out, fid + ".png"), pix.width, "x", pix.height)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
