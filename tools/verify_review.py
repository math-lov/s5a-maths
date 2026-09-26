#!/usr/bin/env python3
"""驗證教學審查報告的每一項修訂是否已在資料內生效。"""
import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

f = json.load(io.open("data/src/figures.json", encoding="utf-8"))
d = json.load(io.open("data/src/ch10-test.json", encoding="utf-8"))
A = d["sections"][0]["questions"]
B = d["sections"][1]["questions"]

checks = [
    ("1  numline-a2 右端點=4、max=6", f["numline-a2"]["max"] == 6
     and any(p["v"] == 4 for p in f["numline-a2"]["points"])),
    ("2  A2 step2 視角引導（$2x\\ge -2$）", "以未知數" in A[1]["solution"]["steps"][1]["zh"]),
    ("3  A4 step2 「乘 −1 方向倒轉」", "方向必須倒轉" in A[3]["solution"]["steps"][1]["zh"]),
    ("4  B1 step2 兩種移項方法", "方法二" in B[0]["solution"]["steps"][1]["zh"]),
    ("5  B2 step4 補 (1A)", B[1]["solution"]["steps"][3].get("marking") == "(1A)"),
    ("6  B3(b) 方法二 Δ=−28", any("(-2)^{2}-4(1)(8)" in s.get("math", "")
                                  for s in B[2]["solution"]["steps"])),
    ("7  B4(b)(i) surd form 指示", "surd form" in B[3]["parts"][1]["en"]),
    ("8  B5 stem 改 for all real values", "for all real values of" in B[4]["stem"]["en"]),
    ("9  Bonus step5 頂點＝最低點橋樑", "最低點" in B[5]["solution"]["steps"][4]["zh"]),
    ("10 numline-b5 灰色顯示兩條件交集", any(s.get("color") == "muted"
                                             for s in f["numline-b5"]["segments"])),
    ("11 A1 step2 補中間步驟（−x>−4）", "-x>-4" in A[0]["solution"]["steps"][1]["math"]),
    ("12 A3 改為乘 2 消分母（12−x<2x）", "12-x<2x" in A[2]["solution"]["steps"][0]["math"]),
    ("13 B1 題幹精簡", B[0]["stem"]["en"] == "Solve the following."),
    ("14 B2 提醒保留 or 字", "保留「or」" in B[1]["solution"]["steps"][3]["zh"]),
    ("15 長題 traps 全部有 labelEn", all(t.get("labelEn") for q in B
                                         for t in q["solution"]["traps"])),
]

ok = 0
for name, passed in checks:
    print(("PASS  " if passed else "FAIL  ") + name)
    ok += bool(passed)
print("--- %d / %d 項已生效" % (ok, len(checks)))
raise SystemExit(0 if ok == len(checks) else 1)
