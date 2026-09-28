#!/usr/bin/env python3
"""檢查 data/src/ 的資料，然後生成網站用的 data/*.js。

用法：
    python tools/build.py            # 檢查 + 生成
    python tools/build.py --check    # 只檢查，不寫檔

檢查重點（違反就當錯誤，不讓它上線）：
  S1  每個課題（part）的 id、檔案、section／question 結構
  S2  長題 parts[].marks 加總 = question.marks；steps[].marking 加總 = marks
  S3  MC 一定有 A–D 四個選項、answer 是其中之一、每個選項不可空
  S4  MC 的 traps 指向真實選項、而且不可指向正確答案；長題 traps 用 label
  S5  每個 step 有 title.zh / title.en、zh / en 詳解（zh ≥ 8 字）
  S6  文字欄位不可有裸 `$`（$ 要成對）、不可有 Markdown `**`
  S7  角度一律用「度」：不可出現 rad／\\frac{\\pi}{}（本章無角度，仍保留閘門）
  S8  引用的圖（figures / steps[].figure）一定存在於 figures.json
  S9  每個課題都要有 answer / tip，tip 中英齊全
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "data", "src")
OUT = os.path.join(BASE, "data")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_figures  # noqa: E402

ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def load(name: str):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return json.load(f)


# ── 文字欄位檢查 ─────────────────────────────────────────────────────────────
MARK_RE = re.compile(r"\(([^)]*)\)")


def marking_count(marking: str) -> int:
    """"(1M)(1A)" → 2；"(1A+1A)" → 2；"(1M: Use the result of (a).)" → 1"""
    total = 0
    for inner in MARK_RE.findall(marking or ""):
        for token in inner.split("+"):
            token = token.strip()
            if re.fullmatch(r"\d*\s*[MA]", token):
                total += int(re.match(r"\d*", token).group(0) or 1)
    return total


def check_text(label: str, s: str, min_len: int = 0, need_zh: bool = False) -> None:
    if not isinstance(s, str) or not s.strip():
        err("S5 %s：文字不可空" % label)
        return
    if "**" in s:
        err("S6 %s：不可用 Markdown `**`（前端不支援）" % label)
    # $ 要成對（貨幣寫 \\$ 不在此限）
    cleaned = s.replace("\\$", "")
    if cleaned.count("$") % 2:
        err("S6 %s：`$` 不成對，KaTeX 會渲染出錯：%s" % (label, s[:60]))
    if re.search(r"\brad\b|\\frac\{\\pi\}", s):
        err("S7 %s：角度一律用度（°），不可用弧度：%s" % (label, s[:60]))
    if "\\pi" in s:
        warn("S7 %s：出現 \\pi，請確認不是角度（角度要用度）" % label)
    if need_zh:
        zh = [c for c in s if "\u4e00" <= c <= "\u9fff"]
        if len(zh) < min_len:
            err("S5 %s：中文詳解太短（少於 %d 個中文字）" % (label, min_len))


PROMPT_KEYS = ["role", "student", "headings", "focusAll", "focusStep",
               "requirements", "format", "doubtPlaceholder", "optionLabels", "options"]
PROMPT_HEADINGS = ["source", "question", "stemEn", "stemZh", "items", "focus",
                   "existing", "doubt", "requirements", "format"]
PROMPT_OPTS = ["simpler", "examples", "examTips", "visual", "practice"]


def check_prompt_templates(tpl) -> None:
    """S11 prompt 模板：中英對稱、欄位齊全（改一次模板＝全部 prompt 更新）"""
    if not isinstance(tpl, dict) or "zh" not in tpl or "en" not in tpl:
        err("S11 prompt-templates.json：必須同時有 zh 與 en 兩份模板")
        return
    for lang in ("zh", "en"):
        node = tpl.get(lang) or {}
        for key in PROMPT_KEYS:
            if key not in node:
                err("S11 prompt 模板 %s 缺少欄位 %s" % (lang, key))
        h = node.get("headings") or {}
        for key in PROMPT_HEADINGS:
            if not h.get(key):
                err("S11 prompt 模板 %s headings 缺少 %s" % (lang, key))
        for key in ("requirements", "format"):
            items = node.get(key)
            if not isinstance(items, list) or not items:
                err("S11 prompt 模板 %s 的 %s 必須是非空陣列" % (lang, key))
        for key in PROMPT_OPTS:
            if not (node.get("options") or {}).get(key):
                err("S11 prompt 模板 %s 缺少可選項 options.%s" % (lang, key))
            if not (node.get("optionLabels") or {}).get(key):
                err("S11 prompt 模板 %s 缺少可選項標籤 optionLabels.%s" % (lang, key))
        if "{n}" not in (node.get("focusStep") or ""):
            err("S11 prompt 模板 %s 的 focusStep 必須包含 {n}（步驟編號）" % lang)


# ── 單題檢查 ────────────────────────────────────────────────────────────────
def check_question(q: dict, where: str, fig_ids: set) -> None:
    qid = q.get("id") or "?"
    tag = "%s / %s" % (where, qid)
    for key in ("id", "code", "type", "marks"):
        if key not in q:
            err("S1 %s：缺少 %s" % (tag, key))
            return
    if q["type"] not in ("mc", "long"):
        err("S1 %s：type 只可以是 mc 或 long" % tag)
    stem = q.get("stem") or {}
    check_text(tag + " stem.en", stem.get("en", ""), need_zh=False)
    if not stem.get("zh"):
        err("S5 %s：缺少 stem.zh（全站要中英雙語題目）" % tag)
    else:
        check_text(tag + " stem.zh", stem.get("zh", ""), min_len=2, need_zh=True)

    for fid in q.get("figures", []):
        if fid not in fig_ids:
            err("S8 %s：引用了不存在的圖 %s" % (tag, fid))

    sol = q.get("solution") or {}
    steps = sol.get("steps") or []
    if not steps:
        err("S1 %s：solution.steps 不可空" % tag)
    mark_total = 0
    for i, st in enumerate(steps, 1):
        s_tag = "%s step %d" % (tag, i)
        title = st.get("title") or {}
        check_text(s_tag + ".title.zh", title.get("zh", ""))
        check_text(s_tag + ".title.en", title.get("en", ""))
        check_text(s_tag + ".zh", st.get("zh", ""), min_len=8, need_zh=True)
        check_text(s_tag + ".en", st.get("en", ""))
        math = st.get("math")
        if math is not None:
            if "$" in math:
                err("S6 %s.math：math 欄不可有 `$`（這是 KaTeX 純 LaTeX 欄）" % s_tag)
            if re.search(r"\brad\b|\\frac\{\\pi\}", math or ""):
                err("S7 %s.math：角度要用度" % s_tag)
        if st.get("marking"):
            mark_total += marking_count(st["marking"])
        if st.get("figure") and st["figure"] not in fig_ids:
            err("S8 %s：引用了不存在的圖 %s" % (s_tag, st["figure"]))
        for h in st.get("highlight", []):
            if "$" in h:
                err("S6 %s.highlight：不可有 `$`" % s_tag)

    traps = sol.get("traps") or []
    if not traps:
        warn("S4 %s：沒有 traps（可以接受，但弱生較難知道錯在哪一步）" % tag)
    for tr in traps:
        if q["type"] == "mc":
            opt = tr.get("opt")
            if opt not in (q.get("options") or {}):
                err("S4 %s：trap 指向不存在的選項 %s" % (tag, opt))
            elif opt == q.get("answer"):
                err("S4 %s：trap 不可指向正確答案 %s" % (tag, opt))
        else:
            if not tr.get("label"):
                err("S4 %s：長題 trap 要用 label（自由標籤）" % tag)
            if not tr.get("labelEn"):
                err("S4 %s：長題 trap 缺 labelEn（全站雙語）" % tag)
        check_text(tag + " trap.zh", tr.get("zh", ""), min_len=6, need_zh=True)
        check_text(tag + " trap.en", tr.get("en", ""))

    tip = sol.get("tip") or {}
    check_text(tag + " tip.zh", tip.get("zh", ""), min_len=6, need_zh=True)
    check_text(tag + " tip.en", tip.get("en", ""))

    for f in sol.get("figures", []):
        if f not in fig_ids:
            err("S8 %s：solution.figures 引用了不存在的圖 %s" % (tag, f))

    if q["type"] == "mc":
        opts = q.get("options") or {}
        if sorted(opts.keys()) != ["A", "B", "C", "D"]:
            err("S3 %s：選項必須剛好是 A、B、C、D（現時：%s）" % (tag, sorted(opts.keys())))
        for L, v in opts.items():
            if isinstance(v, dict):
                check_text("%s option %s.en" % (tag, L), v.get("en", ""))
                check_text("%s option %s.zh" % (tag, L), v.get("zh", ""), need_zh=True)
            else:
                check_text("%s option %s" % (tag, L), v)
        if q.get("answer") not in opts:
            err("S3 %s：answer 必須是 A–D 之一（現時 %r）" % (tag, q.get("answer")))
        if not (q.get("answers") or []):
            err("S9 %s：缺少 answers（答案欄）" % tag)
    else:
        parts = q.get("parts") or []
        if not parts:
            err("S1 %s：長題要有 parts" % tag)
        total = 0
        for p in parts:
            if not p.get("label") and p.get("label") != "":
                err("S1 %s：part 缺 label" % tag)
            check_text("%s part %s" % (tag, p.get("label")), p.get("en", ""))
            if p.get("zh"):
                check_text("%s part %s.zh" % (tag, p.get("label")), p.get("zh", ""),
                           need_zh=True)
            total += int(p.get("marks") or 0)
        if total != q["marks"]:
            err("S2 %s：parts 分數加總 %d ≠ 題目分數 %d" % (tag, total, q["marks"]))
        if mark_total and mark_total != q["marks"]:
            err("S2 %s：steps[].marking 加總 %d ≠ 題目分數 %d" % (tag, mark_total, q["marks"]))
        if not (q.get("answers") or []):
            err("S9 %s：缺少 answers（答案欄）" % tag)

    for a in q.get("answers") or []:
        if not a.get("math"):
            err("S9 %s：answers[].math 不可空" % tag)


# ── 生成 JS ─────────────────────────────────────────────────────────────────
HEADER = "// 自動生成，請勿手改：改 data/src/*.json 後跑 python tools/build.py\n"


def js_dump(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只檢查，不生成檔案")
    args = ap.parse_args()

    site = load("site.json")
    figures = load("figures.json")
    fig_ids = set(figures.keys())
    templates = load("prompt-templates.json")
    check_prompt_templates(templates)

    rendered_figs = {}
    for fid, spec in figures.items():
        try:
            rendered_figs[fid] = make_figures.render(fid, spec)
        except Exception as e:  # noqa: BLE001
            err("S8 圖 %s 無法生成：%s" % (fid, e))

    parts_out = []
    for part in site["site"]["parts"]:
        pid = part["id"]
        fname = pid + ".json"
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            err("S1 課題 %s 找不到資料檔 data/src/%s" % (pid, fname))
            continue
        data = load(fname)
        total_q = 0
        for sec in data.get("sections", []):
            for q in sec.get("questions", []):
                check_question(q, "%s %s" % (pid, sec.get("id")), fig_ids)
                total_q += 1
        if total_q != part["stats"]["questions"]:
            err("S1 課題 %s：實際題數 %d ≠ site.json 的 %d" % (pid, total_q, part["stats"]["questions"]))
        global_name = "S5A_PART_" + re.sub(r"[^A-Za-z0-9]", "_", pid).upper()
        part = dict(part)
        part["dataFile"] = "data/%s.js" % pid
        part["globalName"] = global_name
        part["qids"] = [q["id"] for s in data.get("sections", []) for q in s.get("questions", [])]
        part["sections"] = [{"id": s["id"], "title": s.get("title", {}), "marks": s.get("marks", 0),
                             "questions": len(s.get("questions", []))} for s in data.get("sections", [])]
        parts_out.append(part)
        if not args.check:
            with open(os.path.join(OUT, pid + ".js"), "w", encoding="utf-8", newline="\n") as f:
                f.write(HEADER)
                f.write("window.%s = %s;\n" % (global_name, js_dump(data)))

    index = {
        "site": site["site"],
        "parts": parts_out,
        "promptTemplates": templates,
    }
    if not args.check:
        with open(os.path.join(OUT, "index.js"), "w", encoding="utf-8", newline="\n") as f:
            f.write(HEADER)
            f.write("window.S5A_INDEX = %s;\n" % js_dump(index))
        with open(os.path.join(OUT, "figures.js"), "w", encoding="utf-8", newline="\n") as f:
            f.write(HEADER)
            f.write("window.S5A_FIGURES = %s;\n" % js_dump(rendered_figs))

    for w in WARNINGS:
        print("警告 " + w)
    for e in ERRORS:
        print("錯誤 " + e)
    print("\n檢查結果：%d 個錯誤、%d 個警告（課題 %d 個）" % (len(ERRORS), len(WARNINGS), len(parts_out)))
    if args.check:
        print("（--check：沒有寫入檔案）")
    return 1 if ERRORS else 0


if __name__ == "__main__":
    raise SystemExit(main())
