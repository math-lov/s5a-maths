#!/usr/bin/env python3
"""第三輪教學審查修訂（ch10-test.json）：
1. B4(a) 說明 a=1 才可用頂點式；增補「方法二 · 對稱軸公式反推」
2. B3(a) 配方法步驟統一（(−2/2)²）；B3 tip 增補計數機 EQN 驗證技巧
3. B1 Step 2 兩種移項習慣（含變號高亮）
4. B5 trap 強化「不可直接開方」（|k| > 5/2）
5. Bonus 情況 3：頂點＝區間內絕對最小值 → Δ<0
6. 變號步驟加上 flip 旗標（前端會顯示雙語高亮標籤）
"""
from __future__ import annotations

import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

B4_STEP0 = {
    "title": {
        "zh": "第 1 步 · 觀察 x² 係數並由頂點寫出頂點式",
        "en": "Step 1 · Identify the leading coefficient and write the vertex form"
    },
    "math": "a=1 \\implies y=1\\cdot(x-2)^{2}+(-6)=(x-2)^{2}-6",
    "marking": "(1M)",
    "zh": "題目的二次式為 $y=x^{2}+bx+c$，可知 $x^{2}$ 的係數為 $a=1$。已知最低點（頂點）坐標為 $(h,\\ k)=(2,\\ -6)$，代入頂點式 $y=a(x-h)^{2}+k$，可得 $y=(x-2)^{2}-6$。注意：必須先確認 $a=1$；若 $a\\ne 1$，頂點式前面要保留 $a$。",
    "en": "The equation is $y=x^{2}+bx+c$, so the coefficient of $x^{2}$ is $a=1$. Given the minimum point (vertex) is $(h,\\ k)=(2,\\ -6)$, substitute into the vertex form $y=a(x-h)^{2}+k$ to get $y=(x-2)^{2}-6$. Note: this only works because $a=1$; otherwise the factor $a$ must stay in front."
}

B4_METHOD2 = {
    "part": "(a)",
    "title": {
        "zh": "方法二 · 對稱軸公式反推（適合習慣用公式的同學）",
        "en": "Method 2 · Use the axis of symmetry formula (for students who prefer formulas)"
    },
    "math": "x=-\\frac{b}{2(1)}=2 \\implies b=-4;\\quad -6=(2)^{2}+(-4)(2)+c \\implies c=-2",
    "zh": "【一題多解 · 對稱軸公式法】\n1. 頂點的 $x$ 坐標（對稱軸）公式是 $x=-\\frac{b}{2a}$。代入 $a=1$ 及 $x=2$：$-\\frac{b}{2(1)}=2$，即 $-b=4$，得 $b=-4$。\n2. 再把頂點 $(2,\\ -6)$ 與 $b=-4$ 代入 $y=x^{2}+bx+c$：$-6=(2)^{2}+(-4)(2)+c=-4+c$，得 $c=-2$。\n（這個方法不必記頂點式，只要記對稱軸公式。）",
    "en": "【Alternative method · axis of symmetry formula】\n1. The axis of symmetry is $x=-\\frac{b}{2a}$. With $a=1$ and $x=2$: $-\\frac{b}{2(1)}=2$, so $-b=4$ and $b=-4$.\n2. Substitute the vertex $(2,\\ -6)$ and $b=-4$ into $y=x^{2}+bx+c$: $-6=(2)^{2}+(-4)(2)+c=-4+c$, giving $c=-2$.\n(No need to remember the vertex form — just the axis formula.)"
}

B3_STEP3 = {
    "part": "(b)",
    "title": {
        "zh": "第 4 步 · 方法一：配方法（先加再減）",
        "en": "Step 4 · Method 1: Completing the square"
    },
    "math": "x^{2}-2x+8=x^{2}-2x+\\left(\\frac{-2}{2}\\right)^{2}-\\left(\\frac{-2}{2}\\right)^{2}+8",
    "marking": "(1M)",
    "zh": "配方法關鍵：看 $x$ 的係數 $-2$，取它一半的平方，即 $\\left(\\frac{-2}{2}\\right)^{2}=(-1)^{2}=1$。在式中「加上 $1$，隨即減去 $1$」以保持數值不變：$x^{2}-2x+1-1+8$。",
    "en": "Completing the square: take half of the $x$-coefficient and square it: $\\left(\\frac{-2}{2}\\right)^{2}=(-1)^{2}=1$. Add 1 and immediately subtract 1 to keep the value unchanged: $x^{2}-2x+1-1+8$."
}

B3_TIP_ZH = ("\n【計數機快速驗證技巧（fx-50FH II／fx-5100 等 DSE 認可計數機）】"
             "遇到二次方程／不等式要找臨界值，可按【MODE】【MODE】【1】進入 EQN 模式，輸入 $a$、$b$、$c$："
             "若答案出現虛數符號「$i$」，即代表無實根（$\\Delta<0$）；若顯示實數，那就是臨界根，"
             "可用來檢查因式分解或十字相乘有沒有計錯。")
B3_TIP_EN = ("\n【Calculator checking tip (fx-50FH II / fx-5100 or any DSE-approved calculator)】 "
             "Use EQN mode (e.g. MODE MODE 1) and enter a, b, c. If the roots are displayed with an "
             "imaginary unit 'i', there are no real roots (Δ < 0); real values shown are the critical "
             "values, which let you check your factorization.")

B1_STEP1 = {
    "part": "(a)",
    "title": {
        "zh": "第 2 步 · 移項並化簡（提供兩種常見移項習慣）",
        "en": "Step 2 · Rearrange and solve (two standard approaches)"
    },
    "math": "\\text{法一（移向正係數）：} 12-1>10x-4x \\Rightarrow 11>6x \\Rightarrow x<\\frac{11}{6}\n\\text{法二（未知數置左）：} 4x-10x>1-12 \\Rightarrow -6x>-11 \\Rightarrow x<\\frac{11}{6}",
    "zh": "方法一（推薦，避免負號）：把未知數移到係數較大的一方。兩邊減 $4x$、減 $1$，得 $11>6x$，即 $x<\\frac{11}{6}$。\n方法二（一般習慣）：把 $x$ 移到左邊，得 $-6x>-11$。【注意：兩邊除以負數 $-6$，不等號必須轉向】得 $x<\\frac{11}{6}$。",
    "en": "Method 1 (recommended, avoids negatives): move $x$ to the side with the larger coefficient — subtract $4x$ and 1 to get $11>6x$, i.e. $x<\\frac{11}{6}$.\nMethod 2 (standard): move $x$ to the left to get $-6x>-11$. [Note: dividing by the negative number $-6$ reverses the inequality sign] giving $x<\\frac{11}{6}$.",
    "marking": "(1A)",
    "highlight": ["x<\\frac{11}{6}"],
    "flip": True
}

B5_TRAP1 = {
    "label": "解 4k² − 25 > 0 時直接開方（常見致命錯誤）",
    "labelEn": "Taking square roots directly in 4k² − 25 > 0 (common fatal error)",
    "zh": "很多同學會直接寫成 $4k^{2}>25 \\Rightarrow k>\\pm\\frac{5}{2}$。切記：不等式絕對不能這樣直接開方！正確做法有兩個：一是因式分解成 $(2k+5)(2k-5)>0$；二是理解為「距離原點大於 $\\frac{5}{2}$」，即 $|k|>\\frac{5}{2}$。兩者都得出兩根外側：$k<-\\frac{5}{2}$ 或 $k>\\frac{5}{2}$。若直接開方只保留正數，會完全漏掉負數區間。",
    "en": "Many students write $4k^{2}>25 \\Rightarrow k>\\pm\\frac{5}{2}$. Never take square roots across an inequality this way. Either factorize into $(2k+5)(2k-5)>0$, or read it as 'distance from the origin greater than $\\frac{5}{2}$', i.e. $|k|>\\frac{5}{2}$. Both give the outside intervals: $k<-\\frac{5}{2}$ or $k>\\frac{5}{2}$. Taking only the positive root loses the whole negative interval."
}

BONUS_STEP4 = {
    "title": {
        "zh": "第 5 步 · 情況 3：對稱軸在 x = 3 右邊（頂點成為區間內的最低點）",
        "en": "Step 5 · Case 3: axis of symmetry is to the right of x = 3 (vertex is the minimum)"
    },
    "math": "\\frac{k+3}{2}>3 \\implies k>3",
    "zh": "情況 3：對稱軸在 $x=3$ 的右邊（$k>3$）。\n因為拋物線開口向上，頂點是整條拋物線的最低點；當對稱軸 $>3$ 時，這個最低點剛好落在題目要求的定義域 $x\\ge 3$ 之內。\n因此，要保證在 $x\\ge 3$ 時「每一點都 $f(x)>0$」，最低點（頂點）的 $y$ 坐標就必須嚴格大於 $0$。\n開口向上的拋物線頂點 $>0$，等價於整條曲線懸浮在 $x$ 軸上方（不與 $x$ 軸相交），因此必須滿足判別式 $\\Delta<0$。",
    "en": "Case 3: the axis of symmetry lies to the right of $x=3$ ($k>3$). Since the parabola opens upwards, the vertex is the absolute minimum of the graph; with the axis $>3$, this minimum falls inside the required domain $x\\ge 3$.\nSo to guarantee $f(x)>0$ for every $x\\ge 3$, the minimum value (the vertex) must be strictly positive.\nAn upward parabola with its vertex above the x-axis means the whole curve floats above the x-axis (no intersection), which is exactly $\\Delta<0$.",
    "figure": "bonus-case3"
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

    b4 = find_question(data, "ch10-B4")
    b4["solution"]["steps"][0] = B4_STEP0
    b4["solution"]["steps"].insert(3, B4_METHOD2)          # (a) 對比係數之後加入方法二

    b3 = find_question(data, "ch10-B3")
    b3["solution"]["steps"][3] = B3_STEP3
    b3["solution"]["tip"]["zh"] += B3_TIP_ZH
    b3["solution"]["tip"]["en"] += B3_TIP_EN

    b1 = find_question(data, "ch10-B1")
    b1["solution"]["steps"][1] = B1_STEP1

    b5 = find_question(data, "ch10-B5")
    b5["solution"]["traps"][1] = B5_TRAP1

    bonus = find_question(data, "ch10-bonus")
    bonus["solution"]["steps"][4] = BONUS_STEP4

    # 變號步驟加上 flip 旗標（前端顯示雙語高亮標籤）
    flips = {
        "ch10-A1": [1],
        "ch10-A3": [1],
        "ch10-B1": [3],
        "ch10-B3": [0],
    }
    n_flip = 0
    for qid, idxs in flips.items():
        q = find_question(data, qid)
        for i in idxs:
            q["solution"]["steps"][i]["flip"] = True
            n_flip += 1

    io.open(path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("已套用第三輪修訂（含 %d 個 flip 高亮步驟）" % n_flip)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
