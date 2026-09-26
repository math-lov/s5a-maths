#!/usr/bin/env python3
"""一次性修補：為長題 traps 補上 labelEn（英文標籤）。跑一次即可。"""
import io
import json
import sys

LABEL_EN = {
    "忘記「Hence」的要求": "Forgetting the 'Hence' instruction",
    "除負數忘記反方向": "Forgetting to flip when dividing by a negative",
    "把「and」當成「or」": "Treating 'and' as 'or'",
    "把「or」當成「and」": "Treating 'or' as 'and'",
    "忘記 −1 被排除": "Forgetting that −1 is excluded",
    "乘 7 時漏乘某一項": "Missing a term when multiplying by 7",
    "(a) 乘 −1 時忘記反方向": "(a) Forgetting to flip when multiplying by −1",
    "(a) 「中間」與「外面」搞錯": "(a) Mixing up 'between' and 'outside'",
    "(b) 誤以為 Δ<0 就無解": "(b) Assuming Δ < 0 means no solution",
    "(c) 展開時漏項": "(c) Missing a term when expanding",
    "把最低點當成 y 截距": "Mistaking the minimum point for the y-intercept",
    "(b) 沒有用 (a) 的答案": "(b) Not using the result of (a)",
    "把根號答案寫成小數": "Writing decimals instead of surd form",
    "(b)(ii) 忘記端點是否包括": "(b)(ii) Ignoring whether endpoints are included",
    "只寫 Δ<0 就收工": "Stopping after Δ < 0 only",
    "忘記 k ≠ −2 的條件": "Ignoring the condition k ≠ −2",
    "最後沒有取交集": "Not intersecting at the end",
    "忽略「x ≥ 3」這限制": "Ignoring the restriction x ≥ 3",
    "漏了 f(3) = 9 的關鍵": "Missing the key step f(3) = 9",
    "情況 3 忘記加上 k > 3": "Case 3: forgetting to add k > 3",
}


def walk(node, out):
    if isinstance(node, dict):
        traps = node.get("traps")
        if isinstance(traps, list):
            for tr in traps:
                if isinstance(tr, dict) and tr.get("label") in LABEL_EN:
                    out.append(tr)
        for v in node.values():
            walk(v, out)
    elif isinstance(node, list):
        for v in node:
            walk(v, out)


def main() -> int:
    path = "data/src/ch10-test.json"
    data = json.load(io.open(path, encoding="utf-8"))
    traps = []
    walk(data, traps)
    missing = []
    for tr in traps:
        en = LABEL_EN.get(tr.get("label"))
        if en:
            tr["labelEn"] = en
        else:
            missing.append(tr.get("label"))
    io.open(path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    sys.stdout.reconfigure(encoding="utf-8")
    print("更新 %d 個 trap 標籤" % len(traps))
    if missing:
        print("缺少翻譯：", missing)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
