# 匯入外部交回來的「圖規格」：先驗證（角度要量得中、平行要真平行、點要定位到），
# 通過才寫入 data/src/*.json。任何一項不過就整批唔寫，並印出問題。
#
# 用法：
#   python -X utf8 tools/figimport.py patch.json
#   python -X utf8 tools/figimport.py patch.json --check-only    只看結果，不寫檔
#
# patch.json 格式：
# {
#   "part": "ch11-2",                     ← 寫入哪個課題
#   "questions": [
#     { "id": "ch11-2-l1-9",              ← 用 id（比 code 穩）
#       "anim": { "points": {...}, "segments": [...], "steps": [...] } },
#     { "id": "ch11-2-l1-7", "anim": null }   ← 傳 null＝清走圖解
#   ]
# }
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from figcheck import check_anim  # noqa: E402

SRC = "data/src"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def find_question(data, qid):
    for sec in data.get("sections", []):
        for q in sec.get("questions", []):
            if q.get("id") == qid:
                return q, sec
    return None, None


def main():
    if len(sys.argv) < 2:
        print(__doc__ or "用法：python -X utf8 tools/figimport.py patch.json [--check-only]")
        return 1
    patch_path = sys.argv[1]
    check_only = "--check-only" in sys.argv[2:]

    patch = load(patch_path)
    part = patch.get("part")
    if not part:
        print("✗ patch 缺少 \"part\"（例如 \"ch11-2\"）")
        return 1

    data_path = os.path.join(SRC, part + ".json")
    if not os.path.exists(data_path):
        print("✗ 找不到 %s" % data_path)
        return 1

    data = load(data_path)
    problems = []
    applied = []

    for item in patch.get("questions", []):
        qid = item.get("id")
        if not qid:
            problems.append("有一項缺少 id")
            continue
        q, _ = find_question(data, qid)
        if q is None:
            problems.append("%s：這個課題沒有這題" % qid)
            continue
        anim = item.get("anim")
        if anim is None:
            applied.append((qid, None))
            continue
        # 先驗證
        bad = check_anim(anim, qid)
        problems += bad
        applied.append((qid, anim))

    if problems:
        print("✗ 驗證唔過，沒有寫入任何東西：\n")
        for p in problems:
            print("  ·", p)
        return 1

    if check_only:
        print("✓ 驗證通過（--check-only，沒有寫入）：%d 題" % len(applied))
        for qid, anim in applied:
            print("   -", qid, "（清空）" if anim is None else "（%d 拍）" % len(anim.get("steps") or []))
        return 0

    for qid, anim in applied:
        q, _ = find_question(data, qid)
        if anim is None:
            q.pop("anim", None)
        else:
            q["anim"] = anim

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    print("✓ 已寫入 %s：%d 題" % (data_path, len(applied)))
    for qid, anim in applied:
        print("   -", qid)
    print("\n跟住做：python -X utf8 tools/build.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
