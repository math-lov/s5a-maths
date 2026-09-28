#!/usr/bin/env python3
"""補回替換步驟時漏掉的步驟分標記（(1M)）。"""
import io
import json
import sys


def find_question(node, qid):
    if isinstance(node, dict):
        if node.get("id") == qid:
            return node
        for v in node.values():
            r = find_question(v, qid)
            if r is not None:
                return r
    elif isinstance(node, list):
        for v in node:
            r = find_question(v, qid)
            if r is not None:
                return r
    return None


def main() -> int:
    path = "data/src/ch10-test.json"
    data = json.load(io.open(path, encoding="utf-8"))
    b3 = find_question(data, "ch10-B3")
    b3["solution"]["steps"][3]["marking"] = "(1M)"
    b4 = find_question(data, "ch10-B4")
    b4["solution"]["steps"][0]["marking"] = "(1M)"
    io.open(path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    sys.stdout.reconfigure(encoding="utf-8")
    print("已補回 (1M)：B3 step 4、B4 step 1")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
