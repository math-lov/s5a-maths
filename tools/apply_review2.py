#!/usr/bin/env python3
"""一次性修補：按第二輪教學審查報告替換各題 traps（ch10-test.json）。"""
import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

A1_TRAPS = [
    {
        "opt": "A",
        "zh": "A 的解集是 $x<4$。解 $2x+3>3x-1$ 移項得 $-x>-4$，若兩邊同除以 $-1$ 時忘記反方向，便會誤算為 $x>4$。此外，A 原式是不帶等號的嚴格不等號「$>$」，解出來絕不可能包含圖中的「實心圓點」（即包括端點）。",
        "en": "A gives $x<4$. Solving $2x+3>3x-1$ leads to $-x>-4$; forgetting to reverse the sign when dividing by $-1$ leads to $x>4$. Furthermore, A has a strict inequality '>', which can never represent the closed circle (inclusive endpoint) shown in the figure."
    },
    {
        "opt": "C",
        "zh": "C 的解集是 $x>4$：雖然方向同樣向右，但 $x>4$ 不包括端點 $4$，在數線上必須畫成空心圓點。圖中的 $4$ 是實心圓點，因此不選 C。",
        "en": "C gives $x>4$: although the arrow points right, $x>4$ does not include 4, which must be represented by an open circle. The figure shows a closed circle at 4, so C is incorrect."
    },
    {
        "opt": "D",
        "zh": "D 的解集是 $x\\le -4$。很多同學看見原式有「$\\ge$」就以為對應圖中的實心圓點，但解 $\\frac{x-8}{6}\\ge\\frac{x}{2}$ 兩邊乘 $6$ 得 $x-8\\ge 3x$，移項後是 $-8\\ge 2x$，除以 $2$ 得 $x\\le -4$，圖形是向左的箭嘴且端點在 $-4$ 而非 $4$。",
        "en": "D gives $x\\le -4$. Many students hastily pick D merely because it contains '$\\ge$' matching the closed circle; however, clearing the fraction gives $x-8\\ge 3x$, leading to $-8\\ge 2x$, i.e. $x\\le -4$, which is an arrow pointing left from $-4$."
    }
]

A2_TRAP_B = {
    "opt": "B",
    "zh": "B 的 $-6$ 源於常犯的「跨項配對」錯誤：有同學錯誤地把連環不等式的最左和最右配成一對，即解 $x+3\\le 2x+9$，得出 $-6\\le x$；再與前半部的 $x<4$ 拼湊，便會誤得出 $-6\\le x<4$。連環不等式必須拆成相鄰的兩組（$x+3<7$ 及 $7\\le 2x+9$）。",
    "en": "The $-6$ in B comes from an incorrect cross-pairing: some students mistakenly pair the very first and last expressions, solving $x+3\\le 2x+9$ to get $x\\ge -6$, and then combine it with $x<4$ to get $-6\\le x<4$. Compound inequalities must always be split into adjacent pairs."
}

A5_TRAP_B = {
    "opt": "B",
    "zh": "B 誤以為 I 必然成立。由 $a>b$ 推出 $\\frac{1}{a}<\\frac{1}{b}$ 的先決條件是 $a$ 與 $b$ 必須「同號」（同正或同負）。若 $a$ 與 $b$ 一正一負（例如 $a=1, b=-1$，滿足 $a>b$），倒數後 $\\frac{1}{a}=1 > -1=\\frac{1}{b}$，不等號方向維持不變，因此 I 並非必然成立。",
    "en": "B assumes I must be true. The inequality $a>b$ implies $\\frac{1}{a}<\\frac{1}{b}$ if and only if $a$ and $b$ share the same sign (both positive or both negative). If $a$ and $b$ have opposite signs (e.g. $a=1, b=-1$ where $a>b$), their reciprocals satisfy $\\frac{1}{a}=1 > -1=\\frac{1}{b}$, so the inequality sign does not reverse, making I not necessarily true."
}

B1_TRAP_AND_OR = {
    "label": "把「and」當成「or」",
    "zh": "題目要求兩個條件同時成立，必須取交集（重疊部分）。若誤當成「or」取聯集，由於 $x\\le -5$ 與 $x<\\frac{11}{6}$ 均為向左指的射線，且 $-5 < \\frac{11}{6}$，合起來只會得到較大的範圍 $x<\\frac{11}{6}$，依然無法覆蓋大於等於 $\\frac{11}{6}$ 的數（絕非所有實數）。文憑試中混淆 and 與 or 會導致解集完全錯誤。",
    "en": "The question requires both conditions to hold simultaneously, meaning intersection is required. If treated as 'or' (union), since both $x\\le -5$ and $x<\\frac{11}{6}$ point to the left and $-5 < \\frac{11}{6}$, combining them gives $x<\\frac{11}{6}$ (not all real numbers). Confusing 'and' with 'or' completely invalidates the final solution.",
    "labelEn": "Treating 'and' as 'or'"
}

B3_TRAPS = [
    {
        "label": "(a) 乘 −1 時忘記反方向",
        "zh": "$-2x^{2}+5\\le 9x$ 移項後是 $-2x^{2}-9x+5\\le 0$；兩邊同乘 $-1$ 得 $2x^{2}+9x-5\\ge 0$，不等號方向一定要倒轉。此外，最終答案必須用「or」連接，不可寫成逗號或「and」。",
        "en": "After rearranging: $-2x^{2}-9x+5\\le 0$. Multiplying by $-1$ gives $2x^{2}+9x-5\\ge 0$ — the inequality sign must flip. Furthermore, the two intervals must be joined by 'or', never a comma or 'and'.",
        "labelEn": "(a) Forgetting to flip when multiplying by −1"
    },
    {
        "label": "(a) 「中間」與「外面」搞錯",
        "zh": "當拋物線開口向上時：「$\\ge 0$」代表在 $x$ 軸上方或在軸上，取兩根外面（$x\\le -5$ 或 $x\\ge\\frac{1}{2}$）；「$\\le 0$」才取兩根中間（$-5\\le x\\le\\frac{1}{2}$）。",
        "en": "For an upward-opening parabola: '$\\ge 0$' means on or above the x-axis, taking the outside ($x\\le -5$ or $x\\ge\\frac{1}{2}$); '$\\le 0$' takes between the roots ($-5\\le x\\le\\frac{1}{2}$).",
        "labelEn": "(a) Mixing up 'between' and 'outside'"
    },
    {
        "label": "(b) 誤以為 Δ < 0 就必定是無解",
        "zh": "$\\Delta<0$ 僅代表對應方程「沒有實根」（圖像完全不與 $x$ 軸相交）。因為開口向上且不相交，整條拋物線恆在 $x$ 軸上方，故 (b) 的「$>0$」解為所有實數；相反，在 (c) 中問「$\\le 0$」，因為圖像不可能落在 $x$ 軸或其下方，才得出「無解」。必須同時考慮開口方向與不等號。",
        "en": "$\\Delta<0$ only means the equation has no real roots (the curve never touches the x-axis). With an upward parabola staying entirely above the x-axis, '> 0' in (b) is satisfied by all real numbers; in contrast, '$\\le 0$' in (c) has no solution. Always consider both the opening direction and the inequality sign.",
        "labelEn": "(b) Assuming Δ < 0 always means no solution"
    },
    {
        "label": "(c) 右方非零時胡亂拆項分解",
        "zh": "解 $(4x+1)(2x-3)\\le -8$ 時，切忌拆成 $4x+1\\le -8$ 或 $2x-3\\le -8$。因式分解符號法只適用於右邊為 $0$ 的情況。本題必須先展開左式，將 $-8$ 移至左方化成 $8x^{2}-10x+5\\le 0$，才能使用判別式或配方法判斷。",
        "en": "Do not split $(4x+1)(2x-3)\\le -8$ into $4x+1\\le -8$ or $2x-3\\le -8$. Factoring logic applies only when the RHS is 0. You must expand the brackets and move $-8$ over to form $8x^{2}-10x+5\\le 0$ before testing with the discriminant or completing the square.",
        "labelEn": "(c) Splitting factors when RHS is not zero"
    }
]

B4_TRAPS = [
    {
        "label": "把最低點當成 y 截距",
        "zh": "$(2,\\ -6)$ 是頂點，不是 $y$ 截距。$y$ 截距是 $x=0$ 時的函數值，即常數項 $c=-2$。",
        "en": "$(2,\\ -6)$ is the vertex, not the y-intercept. The y-intercept is the value at $x=0$, which corresponds to the constant term $c=-2$.",
        "labelEn": "Mistaking the minimum point for the y-intercept"
    },
    {
        "label": "(b)(i) 誤將不等式的解寫成方程的根",
        "zh": "解二次不等式必須給出變數 $x$ 的範圍區間 $2-\\sqrt{6}\\le x\\le 2+\\sqrt{6}$。考生常習慣寫成方程根 $x = 2\\pm\\sqrt{6}$，這在文憑試會被扣除答案分。同時題目指明以根式表示，切勿寫成小數。",
        "en": "Solving an inequality requires stating the interval $2-\\sqrt{6}\\le x\\le 2+\\sqrt{6}$. Writing the equation roots $x=2\\pm\\sqrt{6}$ loses the answer mark in the DSE. Furthermore, leave answers in exact surd form as instructed.",
        "labelEn": "(b)(i) Writing equation roots instead of an inequality range"
    },
    {
        "label": "(b)(ii) 列舉整數時遺漏 0",
        "zh": "在 $-0.449$ 至 $4.449$ 之間的整數包括 $0,\\ 1,\\ 2,\\ 3,\\ 4$。後進生極易直覺地只列出正整數而漏掉 $0$。另外不等式帶有等號，若端點剛好是整數也必須納入。",
        "en": "The integers inside $[-0.449, 4.449]$ are $0,\\ 1,\\ 2,\\ 3,\\ 4$. Students frequently overlook 0 and only list positive integers. Also ensure endpoints are checked if they happen to be integers.",
        "labelEn": "(b)(ii) Forgetting 0 when listing integers"
    }
]

B5_TRAPS = [
    {
        "label": "只寫 Δ < 0 就收工",
        "zh": "只計算 $\\Delta<0$ 並不完整。若開口向上（$k+2>0$）配上 $\\Delta<0$，式子會變成「恆正」。題目要求「恆負」，因此必須同時列出開口向下（$k+2<0$）與判別式 $\\Delta<0$ 兩個條件求交集。",
        "en": "Checking $\\Delta<0$ alone is insufficient. An upward parabola with $\\Delta<0$ becomes always positive. The question requires it to be strictly negative for all $x$, requiring both $k+2<0$ and $\\Delta<0$.",
        "labelEn": "Stopping after Δ < 0 only"
    },
    {
        "label": "解 4k² − 25 > 0 時直接開方",
        "zh": "後進生解 $4k^{2}-25>0$ 時極常寫成 $4k^{2} > 25 \\Rightarrow k > \\pm\\frac{5}{2}$ 或單純寫 $k > \\frac{5}{2}$。不等式兩邊不能隨意開平方，必須透過因式分解 $(2k+5)(2k-5)>0$ 取兩根外側：$k<-\\frac{5}{2}$ 或 $k>\\frac{5}{2}$，否則會丟失整個負數解區間。",
        "en": "When solving $4k^{2}-25>0$, weaker students often take square roots directly, erroneously writing $k > \\pm\\frac{5}{2}$ or $k > \\frac{5}{2}$. You must factorize into $(2k+5)(2k-5)>0$ to get the outside intervals: $k<-\\frac{5}{2}$ or $k>\\frac{5}{2}$, avoiding the loss of the negative range.",
        "labelEn": "Taking square roots directly when solving 4k² − 25 > 0"
    },
    {
        "label": "最後沒有取交集",
        "zh": "開口向下的條件 $k<-2$ 必須與判別式的解（$k<-\\frac{5}{2}$ 或 $k>\\frac{5}{2}$）取「交集」。因為 $k>\\frac{5}{2}$ 與 $k<-2$ 沒有任何重疊，必須捨去，最後答案僅為 $k<-\\frac{5}{2}$。",
        "en": "The condition $k<-2$ must be intersected with $k<-\\frac{5}{2}$ or $k>\\frac{5}{2}$. Since $k>\\frac{5}{2}$ shares no overlap with $k<-2$, it must be rejected, leaving only $k<-\\frac{5}{2}$.",
        "labelEn": "Not intersecting conditions at the end"
    }
]

BONUS_TRAPS = [
    {
        "label": "誤以為全題都需要 Δ < 0",
        "zh": "題目只限制在 $x\\ge 3$ 的區間。若一開始就盲目要求 $\\Delta<0$，只會得出 $-3<k<9$，因而錯誤排除了 $k\\le -3$ 的有效情況。事實上，只要頂點落在 $x=3$ 的左側（$k<3$），由於函數在 $x\\ge 3$ 單調遞增且 $f(3)=9>0$，圖像在 $x<3$ 處即使跌穿 $x$ 軸也完全符合題目要求。",
        "en": "The condition applies strictly to $x\\ge 3$. Applying $\\Delta<0$ indiscriminately yields $-3<k<9$, mistakenly excluding valid cases where $k\\le -3$. When the vertex lies to the left of 3 ($k<3$), $f(x)$ is increasing on $x\\ge 3$ with $f(3)=9>0$, so the curve dipping below the x-axis for $x<3$ is completely acceptable.",
        "labelEn": "Assuming Δ < 0 applies globally across the entire domain"
    },
    {
        "label": "忽略 f(3) = 9 與 k 無關的特性",
        "zh": "計算 $f(3)=9$ 是整題的突破口。若未能看出點 $(3, 9)$ 恆在 $x$ 軸上方且與 $k$ 無關，便無法確立函數在對稱軸位於 $x=3$ 左側時「最低點必為 $f(3)$」的核心幾何關係。",
        "en": "Evaluating $f(3)=9$ is the decisive step. Recognizing that $(3, 9)$ is a fixed point above the x-axis independent of $k$ establishes that $f(3)$ serves as the minimum on $x\\ge 3$ whenever the vertex is to the left of 3.",
        "labelEn": "Overlooking that f(3) = 9 is independent of k"
    },
    {
        "label": "情況 3 遺漏交集條件",
        "zh": "在情況 3 中，對稱軸在 $x=3$ 右側本身已預設了 $k>3$。由 $\\Delta<0$ 所解出的 $-3<k<9$ 必須與 $k>3$ 取交集，得出 $3<k<9$，不可直接抄下 $-3<k<9$。",
        "en": "In Case 3, having the axis of symmetry to the right of $x=3$ inherently requires $k>3$. The solution $-3<k<9$ from $\\Delta<0$ must be intersected with $k>3$ to yield $3<k<9$.",
        "labelEn": "Case 3: omitting the intersection with k > 3"
    }
]

PATCH = {
    "ch10-A1": A1_TRAPS,
    "ch10-A2": None,          # traps[1]（opt B）單獨替換
    "ch10-A5": None,          # traps[0]（opt B）單獨替換
    "ch10-B1": None,          # traps[2]（label 把「and」當成「or」）單獨替換
    "ch10-B3": B3_TRAPS,
    "ch10-B4": B4_TRAPS,
    "ch10-B5": B5_TRAPS,
    "ch10-bonus": BONUS_TRAPS,
}


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
    n = 0
    for qid, traps in PATCH.items():
        q = find_question(data, qid)
        if q is None:
            print("找不到題目", qid)
            return 1
        if traps is not None:
            q["solution"]["traps"] = traps
            n += 1
    # 單一陷阱替換
    a2 = find_question(data, "ch10-A2")
    a2["solution"]["traps"][1] = A2_TRAP_B
    n += 1
    a5 = find_question(data, "ch10-A5")
    a5["solution"]["traps"][0] = A5_TRAP_B
    n += 1
    b1 = find_question(data, "ch10-B1")
    b1["solution"]["traps"][2] = B1_TRAP_AND_OR
    n += 1

    io.open(path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("已替換 %d 處 traps" % n)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
