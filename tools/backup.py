#!/usr/bin/env python3
"""改資料前先留一份快照（git 之外的第二重保險）。

用法：
    python tools/backup.py            # 快照，檔名用時間戳
    python tools/backup.py 改題解前    # 自訂標籤

輸出：backups/YYYYMMDD-HHMMSS-<label>/  ← 已加入 .gitignore，不會污染 repo
內容：data/src/*.json（可編輯的資料）、assets/、index.html、quiz.html
"""
from __future__ import annotations

import datetime
import os
import shutil
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = ["data/src", "assets", "index.html", "quiz.html"]


def main() -> int:
    label = sys.argv[1] if len(sys.argv) > 1 else ""
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    name = stamp + ("-" + label if label else "")
    dest = os.path.join(BASE, "backups", name)
    os.makedirs(dest, exist_ok=True)
    n = 0
    for t in TARGETS:
        src = os.path.join(BASE, t)
        if not os.path.exists(src):
            continue
        out = os.path.join(dest, t)
        if os.path.isdir(src):
            shutil.copytree(src, out, dirs_exist_ok=True)
        else:
            os.makedirs(os.path.dirname(out), exist_ok=True)
            shutil.copy2(src, out)
        n += 1
    sys.stdout.reconfigure(encoding="utf-8")
    print("已備份到 backups/%s（%d 個項目）" % (name, n))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
