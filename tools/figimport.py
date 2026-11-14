# 匯入外部交回來的「圖規格」：先驗證（角度要量得中、平行要真平行、點要定位到），
# 通過才寫入 data/src/*.json。任何一項不過就整批唔寫，並印出問題。
#
# 支援兩種格式（第二種是 prompt.md 叫 LLM 回的那種，最常用）：
#
#   1) { "part": "ch11-2",
#        "questions": [ {"id": "ch11-2-l1-8", "anim": {...}}, ... ] }
#
#   2) { "id": "ch11-2-l1-8", "same": false, "diff": [...], "anim": {...} }
#      → 會自動由 data/src/*.json 找出這個 id 屬於哪個課題
#      → "anim": null 或 "same": true 代表不變，直接略過
#
# 用法：
#   python -X utf8 tools/figimport.py patch.json
#   python -X utf8 tools/figimport.py patch.json --check-only   只看結果，不寫檔
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from figcheck import check_anim  # noqa: E402

SRC = "data/src"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def data_files():
    return [f for f in sorted(os.listdir(SRC)) if f.endswith(".json")]


def find_question(data, qid):
    for sec in data.get("sections", []):
        for q in sec.get("questions", []):
            if q.get("id") == qid:
                return q
    return None


def locate(qid):
    """找出這個 id 屬於哪個資料檔。"""
    for fn in data_files():
        d = load(os.path.join(SRC, fn))
        if find_question(d, qid) is not None:
            return fn
    return None


def normalise(patch):
    """把兩種格式都變成 {part: {qid: anim}}。"""
    if "questions" in patch:
        part = patch.get("part")
        if not part:
            raise SystemExit('✗ patch 缺少 "part"（例如 "ch11-2"）')
        return {part: {it["id"]: it.get("anim") for it in patch["questions"]}}

    qid = patch.get("id")
    if not qid:
        raise SystemExit('✗ patch 既不是 {"part","questions"} 也不是 {"id","anim"}')
    if patch.get("same") or patch.get("anim") is None:
        return {}                      # 一致／不用改
    fn = locate(qid)
    if not fn:
        raise SystemExit("✗ 找不到 %s 屬於哪個課題" % qid)
    return {fn[:-5]: {qid: patch["anim"]}}


def main():
    if len(sys.argv) < 2:
        print("用法：python -X utf8 tools/figimport.py patch.json [--check-only]")
        return 1
    patch = load(sys.argv[1])
    check_only = "--check-only" in sys.argv[2:]

    plan = normalise(patch)
    if not plan:
        print("✓ 沒有任何要改的（same = true）")
        return 0

    problems = []
    todo = []
    for part, items in plan.items():
        path = os.path.join(SRC, part + ".json")
        if not os.path.exists(path):
            problems.append("找不到 %s" % path)
            continue
        for qid, anim in items.items():
            data = load(path)
            q = find_question(data, qid)
            if q is None:
                problems.append("%s：%s 沒有這題" % (part, qid))
                continue
            if anim is not None:
                problems += check_anim(anim, qid)
            todo.append((path, qid, anim))

    if problems:
        print("✗ 驗證唔過，沒有寫入任何東西：\n")
        for p in problems:
            print("  ·", p)
        return 1

    if check_only:
        print("✓ 驗證通過（--check-only，沒有寫入）：%d 題" % len(todo))
        for _, qid, anim in todo:
            print("   -", qid, "（清空）" if anim is None else "（%d 拍）" % len(anim.get("steps") or []))
        return 0

    for path, qid, anim in todo:
        data = load(path)
        q = find_question(data, qid)
        if anim is None:
            q.pop("anim", None)
        else:
            q["anim"] = anim
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        print("✓ 已寫入 %s：%s" % (path, qid))

    print("\n跟住做：python -X utf8 tools/build.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
