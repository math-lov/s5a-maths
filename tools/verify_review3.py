#!/usr/bin/env python3
"""驗證第三輪審查修訂是否生效。"""
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import marking_count  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
d = json.load(io.open("data/src/ch10-test.json", encoding="utf-8"))
f = json.load(io.open("data/src/figures.json", encoding="utf-8"))


def q(qid):
    for s in d["sections"]:
        for item in s["questions"]:
            if item["id"] == qid:
                return item
    raise KeyError(qid)


b4, b3, b1, b5, bonus = q("ch10-B4"), q("ch10-B3"), q("ch10-B1"), q("ch10-B5"), q("ch10-bonus")

checks = [
    ("B4(a) 說明 a=1", "a=1" in b4["solution"]["steps"][0]["zh"]),
    ("B4(a) 增補方法二（對稱軸公式）",
     any("對稱軸公式" in s.get("zh", "") for s in b4["solution"]["steps"])),
    ("B3(b) 配方法步驟統一 (−2/2)²",
     "left(\\frac{-2}{2}\\right)^{2}" in b3["solution"]["steps"][3]["math"]),
    ("B3 tip 含計數機 EQN 技巧", "EQN" in b3["solution"]["tip"]["zh"]
     and "EQN" in b3["solution"]["tip"]["en"]),
    ("B1 Step2 兩種移項＋變號高亮",
     "方法二" in b1["solution"]["steps"][1]["zh"] and b1["solution"]["steps"][1].get("flip")),
    ("B5 trap 開方陷阱含 |k|>5/2",
     "|k|>\\frac{5}{2}" in b5["solution"]["traps"][1]["zh"]),
    ("Bonus 情況3 頂點＝區間內絕對最小值",
     "絕對最低點" in bonus["solution"]["steps"][4]["zh"]
     or "最低點" in bonus["solution"]["steps"][4]["zh"]),
    ("Bonus 情況3 保留圖（bonus-case3）",
     bonus["solution"]["steps"][4].get("figure") == "bonus-case3"),
    ("變號步驟已加 flip 旗標（4 處）",
     sum(1 for qid, i in (("ch10-A1", 1), ("ch10-A3", 1), ("ch10-B1", 3), ("ch10-B3", 0))
         if q(qid)["solution"]["steps"][i].get("flip")) == 4),
    ("步驟分標記完整（B3=9、B4=6）",
     sum(marking_count(s.get("marking", "")) for s in b3["solution"]["steps"]) == 9
     and sum(marking_count(s.get("marking", "")) for s in b4["solution"]["steps"]) == 6),
    ("數線圖說明統一 inclusive / exclusive",
     all("inclusive" in f[k]["caption"]["en"] or "exclusive" in f[k]["caption"]["en"]
         for k in ("numline-a1", "numline-a2", "numline-a3", "numline-b1b", "numline-b2a"))),
]

ok = 0
for name, passed in checks:
    print(("PASS  " if passed else "FAIL  ") + name)
    ok += bool(passed)
print("--- %d / %d" % (ok, len(checks)))
raise SystemExit(0 if ok == len(checks) else 1)
