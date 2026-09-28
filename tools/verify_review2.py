#!/usr/bin/env python3
"""驗證第二輪審查修訂是否生效。"""
import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
d = json.load(io.open("data/src/ch10-test.json", encoding="utf-8"))


def traps(qid):
    for s in d["sections"]:
        for q in s["questions"]:
            if q["id"] == qid:
                return q["solution"]["traps"]
    return []


checks = [
    ("B1 不再宣稱「所有實數」", "絕非所有實數" in traps("ch10-B1")[2]["zh"]),
    ("B1 指出聯集 = x < 11/6", "frac{11}{6}" in traps("ch10-B1")[2]["zh"]),
    ("A1 optA 嚴格不等號不可能對應實心", "嚴格不等號" in traps("ch10-A1")[0]["zh"]),
    ("A1 optD 診斷「≥ 對應實心」心理", "以為對應圖中的實心圓點" in traps("ch10-A1")[2]["zh"]),
    ("A2 optB 跨項配對", "跨項配對" in traps("ch10-A2")[1]["zh"]),
    ("A5 optB 同號（同正或同負）", "同正或同負" in traps("ch10-A5")[0]["zh"]),
    ("B3(c) 非零拆項警告", any("切忌拆成" in t["zh"] for t in traps("ch10-B3"))),
    ("B5 直接開方陷阱", any("開方" in t["zh"] and "5}{2}" in t["zh"]
                            for t in traps("ch10-B5"))),
    ("B4(ii) 列整數遺漏 0", any("漏掉 $0$" in t["zh"] for t in traps("ch10-B4"))),
    ("B4(i) 解集區間而非方程根", any("方程根" in t["zh"] for t in traps("ch10-B4"))),
    ("Bonus Δ 全域誤用", any("盲目要求" in t["zh"] for t in traps("ch10-bonus"))),
    ("全部 traps 都有 labelEn", all(t.get("labelEn") for qid in
                                    ("ch10-B1", "ch10-B3", "ch10-B4", "ch10-B5", "ch10-bonus")
                                    for t in traps(qid))),
]
ok = 0
for name, passed in checks:
    print(("PASS  " if passed else "FAIL  ") + name)
    ok += bool(passed)
print("--- %d / %d" % (ok, len(checks)))
raise SystemExit(0 if ok == len(checks) else 1)
