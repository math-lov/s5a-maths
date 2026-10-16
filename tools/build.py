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
  S12 判斷題（type=tf）：每個小題都要有答案，而且要有 tf: true／false
  S13 solution.alt（另一個做法／參考）：每項要有 name，中英解說齊全（zh ≥ 8 字）
  S14 教學卡（part 的 cards[]）：中英標題與內文，{{math:N}} 要對得上 math[]，
      數式不可有 $、不可有中文（規則 1）
  S17 拆句層（question 的 parse[]）：每列要有英文原句、中文意思、這句要做的
      數學動作（中英）；同一段（題幹或某個 part）的 en 串起來要一字不差等於原文，
      所以改了題目一定要同步改拆句；step 要指向真存在的題解步驟
  S18 常見錯誤（traps）的次序：MC 依選項 A→B→C→D，長題依小題 (a)→(b)→(c)；
      冇標籤的（整題性）提示唔受限，但慣例排最後
  S19 長題的「可核對數字答案」：data/src/site.json 的 parts[] 該項寫 "answerInput": true 就開；
      每小題的答案會自動由 answers[].math 最後一段抽出（該段只有一個數、而且冇未知數
      才抽得準；不等式／代數式例如 "x\\le -5"、"\\frac{n}{2^n}" 一律抽唔到），
      抽唔到就要明寫 answers[].input（唔設輸入格就寫 null）；input 的數字要對得上 math
"""

from __future__ import annotations

import argparse
import hashlib
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


# ── 常見錯誤（traps）的排序：S18 用 ─────────────────────────────────────────
_TRAP_PART_RE = re.compile(r"^\(([a-z])\)")


def trap_order_key(tr: dict):
    """MC 睇選項字母，長題睇 label 開頭的 (a)／(b)／(c)…；整題性提示回 None。"""
    opt = tr.get("opt")
    if isinstance(opt, str) and len(opt) == 1 and opt.isalpha():
        return ord(opt.upper()) - 65
    m = _TRAP_PART_RE.match(tr.get("label") or "")
    return ord(m.group(1)) - 97 if m else None


def trap_order_label(tr: dict) -> str:
    return tr.get("opt") or (tr.get("label") or "")[:14]


# ── 可核對數字答案（S19）：答案由 math 自動抽 ───────────────────────────────
TEXT_GROUP_RE = re.compile(r"\\(?:text|mathrm|mathbf)\s*\{[^{}]*\}")   # \text{dollars} 之類
CMD_RE = re.compile(r"\\[a-zA-Z]+")
LETTER_RE = re.compile(r"[A-Za-z]")


def seg_is_numeric(seg: str) -> bool:
    """最後一段係唔係「單一數值」（2026-10-16 加嚴）？

    丟走 \\text{…}（單位／說明）同 LaTeX 指令名之後，如果仍有英文字母（x、n、k），
    即係符號式答案 —— 裡面就算有數字，都唔係「學生打得出的答案」：
    例 "x\\le -5"（抽 5 會連負號都唔見）、"m = \\frac{3}{2}n"、"\\frac{n}{2^n}"（抽 2 或 1/2 都錯）。
    呢類一定要作者明寫 answers[].input，唔想有輸入格就寫 null。
    """
    s = TEXT_GROUP_RE.sub("", seg)
    s = CMD_RE.sub("", s)
    return not LETTER_RE.search(s)


def derive_input(mathstr: str):
    """抽「學生可以打出來的答案」：只看最後一個 = 之後那一段。

    該段只有一個數字（或一個 \\frac）**而且冇未知數**才抽得準；有歧義（例如
    "488864376 \\ne 11732745024"、"n = 5, 6, 7, 8, 9"）或符號式答案（見 seg_is_numeric）
    就回 None，要求作者在 answers[].input 明寫。
    """
    seg = mathstr.split("=")[-1].replace("\\,", "").replace("\\!", "")
    if not seg_is_numeric(seg):
        return None
    fracs = re.findall(r"\\frac\s*\{([0-9]+)\}\s*\{([0-9]+)\}", seg)
    if fracs:
        return "%s/%s" % fracs[-1] if len(fracs) == 1 else None
    nums = re.findall(r"\d[\d,]*(?:\.\d+)?", seg)
    if len(nums) != 1:
        return None
    return nums[0].replace(",", "")


# ── 單題檢查 ────────────────────────────────────────────────────────────────
def check_question(q: dict, where: str, fig_ids: set, need_input: bool = False) -> None:
    qid = q.get("id") or "?"
    tag = "%s / %s" % (where, qid)
    for key in ("id", "code", "type", "marks"):
        if key not in q:
            err("S1 %s：缺少 %s" % (tag, key))
            return
    if q["type"] not in ("mc", "long", "tf"):
        err("S1 %s：type 只可以是 mc、long 或 tf" % tag)
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
    ans_set = set(q.get("answer")) if isinstance(q.get("answer"), list) else {q.get("answer")}
    last_key, last_lab = None, ""
    for tr in traps:
        if q["type"] == "mc":
            opt = tr.get("opt")
            if opt not in (q.get("options") or {}):
                err("S4 %s：trap 指向不存在的選項 %s" % (tag, opt))
            elif opt in ans_set:
                err("S4 %s：trap 不可指向正確答案 %s" % (tag, opt))
        else:
            if not tr.get("label"):
                err("S4 %s：長題 trap 要用 label（自由標籤）" % tag)
            if not tr.get("labelEn"):
                err("S4 %s：長題 trap 缺 labelEn（全站雙語）" % tag)
        check_text(tag + " trap.zh", tr.get("zh", ""), min_len=6, need_zh=True)
        check_text(tag + " trap.en", tr.get("en", ""))

        # S18：常見錯誤的次序要跟題目（MC 跟選項 A→B→C→D，長題跟小題 (a)→(b)→(c)）；
        # 冇標籤的（整題性）提示不限，但慣例排在最後。
        cur_key = trap_order_key(tr)
        if cur_key is not None:
            if last_key is not None and cur_key < last_key:
                err("S18 %s：traps 次序不對 —— %s 排在 %s 後面；要按 %s 次序排"
                    % (tag, trap_order_label(tr), last_lab,
                       "選項 A→B→C→D" if q["type"] == "mc" else "小題 (a)→(b)→(c)"))
            last_key = cur_key
            last_lab = trap_order_label(tr)

    tip = sol.get("tip") or {}
    check_text(tag + " tip.zh", tip.get("zh", ""), min_len=6, need_zh=True)
    check_text(tag + " tip.en", tip.get("en", ""))

    for f in sol.get("figures", []):
        if f not in fig_ids:
            err("S8 %s：solution.figures 引用了不存在的圖 %s" % (tag, f))

    if q["type"] == "mc":
        opts = q.get("options") or {}
        quick = q.get("quick") or {}
        if sorted(opts.keys()) != ["A", "B", "C", "D"]:
            # 快測「揀方法」題可以得兩個選項（例如插空法／綑綁法），其餘 MC 一律要 A–D
            two = sorted(opts.keys()) == ["A", "B"] and bool(quick)
            if not two:
                err("S3 %s：選項必須剛好是 A、B、C、D（現時：%s）" % (tag, sorted(opts.keys())))
        for L, v in opts.items():
            if isinstance(v, dict):
                check_text("%s option %s.en" % (tag, L), v.get("en", ""))
                check_text("%s option %s.zh" % (tag, L), v.get("zh", ""), need_zh=True)
            else:
                check_text("%s option %s" % (tag, L), v)
        if q.get("answer") is None:
            err("S3 %s：缺少 answer" % tag)
        elif isinstance(q.get("answer"), list):
            # 快測多選題：answer 係代碼列表（quick.multi = true），每一個都要係真選項
            if not ((q.get("quick") or {}).get("multi")):
                err("S3 %s：answer 係列表就必須 quick.multi = true" % tag)
            if not q["answer"] or any(a not in opts for a in q["answer"]):
                err("S3 %s：多選題的 answer 必須全部係 A–D（現時 %r）" % (tag, q["answer"]))
        elif q.get("answer") not in opts:
            err("S3 %s：answer 必須是 A–D 之一（現時 %r）" % (tag, q.get("answer")))
        if quick.get("input"):
            pin = quick["input"]
            if not pin.get("answer"):
                err("S3 %s：quick.input 要有 answer（學生要填的數字）" % tag)
            if pin.get("mode") == "instant" or quick.get("mode") == "instant":
                err("S3 %s：有輸入框就唔可以用 instant（即時回饋）" % tag)
        if quick.get("rows"):
            ropts = [r.get("opt") for r in quick["rows"]]
            if sorted(str(o) for o in ropts) != ["A", "B", "C", "D"]:
                err("S3 %s：quick.rows 要剛好覆蓋 A、B、C、D（現時 %r）" % (tag, ropts))
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

    # S19 長題每小題的「可核對數字答案」：學生做完要自己輸入數字才知道對唔對。
    #   answers[].input 明寫最好；冇寫就由 math 最後一段自動抽（只有一個數才抽得準）。
    if q["type"] == "long":
        ans_list = q.get("answers") or []
        parts_list = q.get("parts") or []
        if need_input and len(ans_list) != len(parts_list):
            err("S19 %s：開了 answerInput 就要 answers 與 parts 一對一（現在 %d 對 %d）"
                % (tag, len(ans_list), len(parts_list)))
        for i, a in enumerate(ans_list, 1):
            # 冇寫 part 就按次序由 parts[i].label 補上（輸入格與答案欄都要知道屬哪一小題）
            if need_input and not a.get("part") and len(ans_list) == len(parts_list):
                label = parts_list[i - 1].get("label") or ""
                if label:
                    a["part"] = label
            if "input" in a:
                val = a["input"]
                if val is None or val is False:
                    continue                       # 明示：這小題唔設輸入格
                if not isinstance(val, str) or not val.strip():
                    err("S19 %s：answers %d 的 input 要係非空字串（唔設輸入格就寫 null）" % (tag, i))
                    continue
                if "$" in val or "\\" in val or re.search(r"[\u4e00-\u9fff]", val):
                    err("S19 %s：answers %d 的 input 只可以有數字同 . , / 空格"
                        "（唔可以 LaTeX／中文；現時 %r）" % (tag, i, val))
                elif not re.search(r"\d", val):
                    err("S19 %s：answers %d 的 input 要有數字（現時 %r）" % (tag, i, val))
            elif need_input:
                got = derive_input(a.get("math", ""))
                if got is None:
                    err("S19 %s：answers %d 抽唔到答案數字 —— 要見到最后一段只有一個數，"
                        "否則明寫 \"input\": \"…\"（唔設輸入格就寫 null）：%r"
                        % (tag, i, a.get("math", "")))
                    continue
                a["input"] = got
            else:
                continue
            val = a.get("input")
            if isinstance(val, str) and val:
                if re.sub(r"[^0-9]", "", val) not in re.sub(r"[^0-9]", "", a.get("math", "")):
                    err("S19 %s：answers %d 的 input（%r）在 math（%r）裡面搵唔到，"
                        "數字一定要對得上" % (tag, i, val, a.get("math", "")))

    if q["type"] == "tf":
        ans_by_part = {}
        for a in q.get("answers") or []:
            ans_by_part[a.get("part")] = a
        for p in q.get("parts") or []:
            a = ans_by_part.get(p.get("label"))
            if not a:
                err("S12 %s：判斷題每個小題都要有答案（缺少 %s）" % (tag, p.get("label")))
            elif not isinstance(a.get("tf"), bool):
                err("S12 %s：判斷題的答案要有 tf: true 或 false（%s）" % (tag, p.get("label")))

    for i, a in enumerate(sol.get("alt") or [], 1):
        a_tag = "%s alt %d" % (tag, i)
        nm = a.get("name")
        if isinstance(nm, dict):
            check_text(a_tag + ".name.zh", nm.get("zh", ""))
            check_text(a_tag + ".name.en", nm.get("en", ""))
        elif nm:
            check_text(a_tag + ".name", str(nm))
        else:
            err("S13 %s：alt 缺少 name" % a_tag)
        check_text(a_tag + ".zh", a.get("zh", ""), min_len=8, need_zh=True)
        check_text(a_tag + ".en", a.get("en", ""))

    check_parse(q, tag)


# ── 拆句層（逐句讀題）──────────────────────────────────────────────────────
# 串接拆句時：下一行由標點開頭（例如 ","）就唔補空格，其餘補一個，
# 令「行尾有冇打空格」唔會影響驗證結果。
_NO_SPACE_BEFORE = ",.;:!?)]}%"


def _flat_join(rows) -> str:
    out = ""
    for r in rows:
        s = r.get("en", "")
        if (out and s and not out[-1:].isspace() and not s[:1].isspace()
                and s[:1] not in _NO_SPACE_BEFORE):
            out += " "
        out += s
    return " ".join(out.split())


def check_parse(q: dict, tag: str) -> None:
    """S17 question.parse[]：英文原句 → 中文意思 → 這句要做的數學動作 → 第幾步。

    最重要的守門是「串接」：同一段（題幹，或某一個 part）的所有 en 順序串起來，
    要逐字等於該段原文（行與行之間的空格唔計，見 _flat_join）。改了題目而忘了
    改拆句就會立刻在這裡爆出來，而且每一段都必須有覆蓋（唔可以只拆一半）。
    """
    rows = q.get("parse")
    if rows is None:
        return
    if not isinstance(rows, list) or not rows:
        err("S17 %s：parse 要是非空陣列（唔要拆句就成個欄位刪掉）" % tag)
        return

    parts = q.get("parts") or []
    sources = {"": (q.get("stem") or {}).get("en", "")}
    for p in parts:
        sources[p.get("label") or ""] = p.get("en", "")
    groups = dict((k, []) for k in sources)

    n_steps = len((q.get("solution") or {}).get("steps") or [])
    for i, row in enumerate(rows, 1):
        r_tag = "%s parse %d" % (tag, i)
        if not isinstance(row, dict):
            err("S17 %s：每一列都要是物件" % r_tag)
            continue
        src = row.get("from", "")
        if src not in groups:
            err("S17 %s：from 只可以是題幹（留空）或其中一個 part 標籤"
                "（現時 %r；題目有 %r）" % (r_tag, src, [k for k in sources if k]))
            continue
        groups[src].append(row)
        check_text(r_tag + ".en", row.get("en", ""))
        if row.get("en", "").count("$") % 2:
            err("S17 %s：en 的 `$` 不成對（唔可以喺一條數式中間切開）" % r_tag)
        check_text(r_tag + ".zh", row.get("zh", ""), min_len=2, need_zh=True)
        mv = row.get("move") or {}
        if not isinstance(mv, dict):
            err("S17 %s：move 要是 {zh, en} 物件" % r_tag)
        else:
            check_text(r_tag + ".move.zh", mv.get("zh", ""), min_len=4, need_zh=True)
            check_text(r_tag + ".move.en", mv.get("en", ""))
        st = row.get("step")
        if st is not None and (not isinstance(st, int) or isinstance(st, bool)
                               or not 1 <= st <= n_steps):
            err("S17 %s：step 要係 1–%d 的整數（現時 %r）" % (r_tag, n_steps, st))

    for label, text in sources.items():
        joined = _flat_join(groups[label])
        want = " ".join((text or "").split())
        if joined == want:
            continue
        d = 0
        while d < min(len(joined), len(want)) and joined[d] == want[d]:
            d += 1
        err("S17 %s 拆句[%s]：en 串起來（%d 字）要等於原文（%d 字；行間空格唔計）；"
            "第 %d 個字起唔同 —— 拆句 %r vs 原文 %r"
            % (tag, label or "題幹", len(joined), len(want), d + 1,
               joined[d:d + 24], want[d:d + 24]))


# ── 教學卡（part 的 cards[]）────────────────────────────────────────────────
MATH_PLACEHOLDER_RE = re.compile(r"\{\{math:(\d+)\}\}")
CJK_RE = re.compile(r"[\u4e00-\u9fff]")
# 互動示範：卡片可寫 "demo": { "type": "tie-up" }，由 assets/demos.js 建立
# （新增示範：先在 demos.js 的 S5A_DEMO.types 註冊，再把 type 加落這裡）
DEMO_TYPES = ("tie-up", "slot-in", "grouping", "combination", "path", "complement",
              "menu", "venn", "code", "venncalc", "floor")


def check_intro(data: dict, where: str) -> None:
    """S16 總覽頁引言：一句摘要 + introSteps[] 編號步驟（唔好寫成一大段）"""
    intro = data.get("intro") or {}
    for lang in ("zh", "en"):
        s = intro.get(lang, "")
        if not s:
            continue
        check_text("%s intro.%s" % (where, lang), s)
        if len(s) > 200 and not data.get("introSteps"):
            warn("S16 %s intro.%s 太長（%d 字）：總覽頁會變一大段，"
                 "建議 intro 收成一句摘要，內容搬去 introSteps[]" % (where, lang, len(s)))
    steps = data.get("introSteps")
    if steps is None:
        return
    if not isinstance(steps, list) or not steps:
        err("S16 %s：introSteps 必須是非空陣列" % where)
        return
    if len(steps) > 8:
        err("S16 %s：introSteps 最多 8 條（現時 %d）" % (where, len(steps)))
    for i, st in enumerate(steps, 1):
        st = st or {}
        check_text("%s introStep %d.zh" % (where, i), st.get("zh", ""), min_len=8, need_zh=True)
        check_text("%s introStep %d.en" % (where, i), st.get("en", ""), min_len=20)


def check_cards(cards, where: str) -> None:
    """S14 教學卡：顯示在該節的總覽頁（p=0）"""
    if cards is None:
        return
    if not isinstance(cards, list):
        err("S14 %s：cards 必須是陣列" % where)
        return
    for c in cards:
        c = c or {}
        tag = "%s card %s" % (where, c.get("id") or "?")
        if not c.get("id"):
            err("S14 %s：缺少 id" % tag)
        title = c.get("title") or {}
        check_text(tag + ".title.zh", title.get("zh", ""))
        check_text(tag + ".title.en", title.get("en", ""))
        body = c.get("body") or {}
        maths = c.get("math") or []
        for lang in ("zh", "en"):
            s = body.get(lang, "")
            check_text(tag + ".body." + lang, s, min_len=20 if lang == "zh" else 0,
                       need_zh=(lang == "zh"))
            for n in MATH_PLACEHOLDER_RE.findall(s or ""):
                if int(n) >= len(maths):
                    err("S14 %s：body.%s 引用了不存在的 {{math:%s}}（math 只有 %d 項）"
                        % (tag, lang, n, len(maths)))
        for i, mm in enumerate(maths):
            mm = mm or ""
            if "$" in mm:
                err("S14 %s.math[%d]：不可有 `$`" % (tag, i))
            if CJK_RE.search(mm):
                err("S14 %s.math[%d]：數式不可有中文（規則 1）" % (tag, i))
            if re.search(r"\brad\b|\\frac\{\\pi\}", mm):
                err("S14 %s.math[%d]：角度要用度" % (tag, i))
        demo = c.get("demo")
        if demo is not None:
            if not isinstance(demo, dict):
                err("S14 %s：demo 必須是物件，例如 { \"type\": \"tie-up\" }" % tag)
            else:
                if demo.get("type") not in DEMO_TYPES:
                    err("S14 %s：demo.type「%s」不在白名單（%s）"
                        % (tag, demo.get("type"), "、".join(DEMO_TYPES)))
                cap = demo.get("caption")
                if cap is not None:
                    if not isinstance(cap, dict):
                        err("S14 %s：demo.caption 必須是 { zh, en }" % tag)
                    else:
                        check_text(tag + ".demo.caption.zh", cap.get("zh", ""),
                                   min_len=4, need_zh=True)
                        check_text(tag + ".demo.caption.en", cap.get("en", ""))
        warn = c.get("warn") or {}
        if warn:
            check_text(tag + ".warn.zh", warn.get("zh", ""), min_len=6, need_zh=True)
            check_text(tag + ".warn.en", warn.get("en", ""))
            for lang in ("zh", "en"):
                for n in MATH_PLACEHOLDER_RE.findall(warn.get(lang, "") or ""):
                    if int(n) >= len(maths):
                        err("S14 %s：warn.%s 引用了不存在的 {{math:%s}}（math 只有 %d 項）"
                            % (tag, lang, n, len(maths)))
        for v in c.get("vocab") or []:
            v = v or {}
            check_text(tag + ".vocab.zh", v.get("zh", ""))
            check_text(tag + ".vocab.en", v.get("en", ""))


# ── 生成 JS ─────────────────────────────────────────────────────────────────
HEADER = "// 自動生成，請勿手改：改 data/src/*.json 後跑 python tools/build.py\n"


def js_dump(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


# ── 版本戳（cache stamp）──────────────────────────────────────────────────────
# 之前的做法是「按小時」產生 ?v=，一小時內再部署，瀏覽器見到同一個 URL 就繼續用
# 快取的舊檔（＝改了但學生看不到）。現在改成依內容算 hash：內容一變，HTML 內的
# window.__V 就變，URL 亦變，瀏覽器與 GitHub Pages 的 CDN 都必然取到新檔。
STAMP_RE = re.compile(r"window\.__V\s*=\s*[^;]+;")
# style.css 亦要帶版本戳：HTML／app.js／data 都是新 URL，只有 CSS 的 href 不變，
# 學生就可能沿用快取的舊樣式（＝改了 CSS 但看不到）。這裡一併把 href 加上 ?v=。
CSS_RE = re.compile(r'href="assets/style\.css(\?v=[0-9a-f]+)?"')
STAMP_HTML = ("index.html", "quiz.html", "chapter.html")
STAMP_ASSETS = ("assets/app.js", "assets/demos.js", "assets/style.css", "data/index.js", "data/figures.js")


def content_stamp(part_files) -> str:
    h = hashlib.sha1()
    for rel in list(STAMP_ASSETS) + list(part_files):
        path = os.path.join(BASE, rel)
        if not os.path.exists(path):
            continue
        h.update(rel.encode("utf-8"))
        with open(path, "rb") as f:
            h.update(f.read())
    return h.hexdigest()[:8]


def write_stamp(stamp: str) -> list[str]:
    changed = []
    for name in STAMP_HTML:
        path = os.path.join(BASE, name)
        with open(path, encoding="utf-8") as f:
            src = f.read()
        new = STAMP_RE.sub('window.__V = "%s";' % stamp, src, count=1)
        new = CSS_RE.sub('href="assets/style.css?v=%s"' % stamp, new)
        if new != src:
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(new)
            changed.append(name)
    return changed


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
        check_cards(data.get("cards"), pid)
        check_intro(data, pid)
        total_q = 0
        for sec in data.get("sections", []):
            for q in sec.get("questions", []):
                check_question(q, "%s %s" % (pid, sec.get("id")), fig_ids,
                               bool(part.get("answerInput")))
                total_q += 1
        if total_q != part["stats"]["questions"]:
            err("S1 課題 %s：實際題數 %d ≠ site.json 的 %d" % (pid, total_q, part["stats"]["questions"]))
        global_name = "S5A_PART_" + re.sub(r"[^A-Za-z0-9]", "_", pid).upper()
        part = dict(part)
        part["dataFile"] = "data/%s.js" % pid
        part["globalName"] = global_name
        part["qids"] = [q["id"] for s in data.get("sections", []) for q in s.get("questions", [])]
        part["sections"] = [{"id": s["id"], "short": s.get("short", {}), "title": s.get("title", {}),
                             "marks": s.get("marks", 0),
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
        stamp = content_stamp([p["dataFile"] for p in parts_out])
        touched = write_stamp(stamp)
        print("版本戳（cache stamp）%s → %s" % (stamp, "、".join(touched) if touched else "HTML 無變動"))

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
