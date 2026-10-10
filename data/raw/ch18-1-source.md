# Chapter 18.1 Sets · Source and Verification Notes

> Transcribed from `source/SMS_bkexe_5B18_e.docx` and checked against `source/SMS_sol_5B18_e.docx`.
> The DOCX files are local-only; student-facing stems and explanations are maintained in `data/src/ch18-1.json`.
> Chapter title taken from the solutions DOCX: **Chapter 18 More about Probability**.

## Extraction notes (why the raw text looks broken)

- Set operations live in the Symbol font (`w:sym`), so a plain text dump loses them:
  `F0C7` = ∩, `F0C8` = ∪, `F0C6` = ∅, `F0CE` = ∈, `F0CF` = ∉, `F0CC` = ⊂.
  The dumper used here maps these codes back before transcription.
- Fractions and a few expressions are WMF pictures (e.g. `4 / 52`, `21 / 26`, `3 / 5`).
  They were converted to PNG (`_probe/wmf_to_png.py` style GDI+ conversion) and read individually;
  the values are recorded in the official-answer table below.
- Venn diagrams in the question figures are PNG images; the site redraws them from
  `data/src/figures.json` using the `venn` figure type (see `tools/make_figures.py`).

## Sections

| Section | Questions |
|---|---|
| Section Check | (a)–(f) |
| Level 1 | 1–11 |
| Level 2 | 12–19 |
| SMART CORNER | 20 |

* Class Exercise 18.1 is **not** in the teacher's DOCX: the exercise file starts at Exercise 18.1,
  and the solutions file starts at Exercise 18.1 (p.18.9) after two practice questions.
  Nothing from Class Exercise 18.1 is therefore included.
* The DOCX contains no printed section titles for 18.1–18.4, so the website uses descriptive titles
  (18.1 集合 / 18.2 概率 / 18.3 概率的乘法 / 18.4 概率與計數); 18.2–18.4 are marked 即將推出 and their
  titles can be renamed to match the book once那些 sections are built.

## Official Answers

| Question | Answer |
|---|---|
| SC | Correct: (b), (d), (e); incorrect: (a), (c), (f) |
| SC (a) | $n(A) = 4$ (the statement says 10) |
| SC (c) | $P \cup Q = \{3, 4, 5, 6, 7\}$ so $6 \in P \cup Q$ |
| SC (f) | $A \cup B = B$ when $A \subset B$ |
| L1-1 | (a) $A' = \{1, 3, 5\}$; (b) $B' = \{2, 4, 5, 6\}$; (c) $A \cap B = \varnothing$; (d) $A \cup B = \{1, 2, 3, 4, 6\}$ |
| L1-2 | (a) $\{4, 5, 7, 9\}$; (b) $\{6, 7, 9\}$; (c) $\{1, 2\}$; (d) $\{1, 2, 4, 5, 6\}$ |
| L1-3 | (a) $A = \{a, d, e, f\}$; (b) $S = \{a, b, c, d, e, f\}$; (c) $B' = \{a, d, f\}$; (d) $A \cap B = \{e\}$ |
| L1-4 | (a) $S = \{1, \ldots, 9\}$; (b) $A' = \{1, 2, 5, 7, 8\}$; (c) $A \cup B = \{2, 3, 4, 5, 6, 8, 9\}$; (d) $A \cap C = \{3, 9\}$ |
| L1-5 | (a) $\{3, 5\}$; (b) $\{1, 2, 3, 4, 5, 6\}$; (c) $\varnothing$; (d) $\{1, 3, 5, 6, 8\}$ |
| L1-6 | (a) $\{1, 2, 3, 7, 9\}$; (b) $\{4, 7, 9\}$; (c) $\{8\}$; (d) $\{1, 2, 3, 4, 8\}$ |
| L1-7 | (a) $\{17, 18, 19, 20\}$; (b) $\{4, 8, 12, 16, 20\}$; (c) $\{1, 2, 4, 5, 10, 20\}$ |
| L1-8 | (a) $S = \{\text{Alfred}, \text{Belle}, \text{Chloe}, \text{Daniel}, \text{Eden}\}$; (b) $A = \{\text{Chloe}\}$, $B = \{\text{Alfred}, \text{Belle}, \text{Chloe}, \text{Daniel}\}$ |
| L1-9 | (a) $n(S) = 26$; (b)(i) $n(A) = 26 - 5 = 21$; (b)(ii) $P(A) = \frac{21}{26}$ |
| L1-10 | (a) $n(S) = 7$; (b)(i) $n(E) = 5$, $n(F) = 2$; (b)(ii) $P(E) = \frac{5}{7}$, $P(F) = \frac{2}{7}$ |
| L1-11 | (a) $n(A) = 4$, $n(B) = 13$; (b) $P(A) = \frac{4}{52} = \frac{1}{13}$, $P(B) = \frac{13}{52} = \frac{1}{4}$ |
| L2-12 | (a) shade $A \cap B'$; (b) shade $A' \cap B$; (c) shade everything except $A \cap B$; (d) shade outside $A \cup B$ |
| L2-13 | (a)(i) $P \cup Q = \{a, b, c, d, e, f, h\}$; (a)(ii) $P \cap Q = \{d\}$; (b) Venn diagram with $d$ in the overlap, $a, b, f$ in $P$ only, $c, e, h$ in $Q$ only, $g$ outside both |
| L2-14 | (a) $S = \{PPP, PPF, PFP, FPP, PFF, FPF, FFP, FFF\}$; (b)(i) $\frac{3}{8}$; (b)(ii) $\frac{7}{8}$ |
| L2-15 | (a) $n(S) = 12$; (b) $E = \{1, \ldots, 8\}$, $F = \{6, \ldots, 12\}$; (c) $E \cap F = \{6, 7, 8\}$, $P(E \cap F) = \frac{3}{12} = \frac{1}{4}$ |
| L2-16 | (a) $n(S) = 4 \times 3 = 12$; (b)(i) $n(E) = 3$; (b)(ii) $\frac{3}{12} = \frac{1}{4}$ |
| L2-17 | (a) $n(S) = C^5_2 = \frac{5 \times 4}{2} = 10$; (b)(i) $n(E) = 3$; (b)(ii) $\frac{3}{10}$ |
| L2-18 | (a) $A$ = the six doubles, $B = \{(1, 5), (2, 4), (3, 3), (4, 2), (5, 1)\}$; (b) $P(A \cap B) = \frac{1}{36}$, $P(A \cup B) = \frac{(6 + 5) - 1}{36} = \frac{10}{36} = \frac{5}{18}$ |
| L2-19 | (a) Physics only 6, both 12, Chemistry only 3, neither 9; (b)(i) $\frac{12}{30} = \frac{2}{5}$; (b)(ii) $\frac{(6 + 12 + 3)}{30} = \frac{21}{30} = \frac{7}{10}$ |
| SM-20 | (a) $m = \frac{3}{2}n$; (b) any pair with $m : n = 3 : 2$, e.g. $(3, 2)$ and $(6, 4)$ |

## Independent Verification Notes

- **SC (a) transcription fix**: the DOCX text reads "then $n(B) = 10$", but $B$ is only defined in (b)
  and the official answer keys on $n(A) = 4$. The website therefore prints the statement as
  "then $n(A) = 10$" and marks it incorrect. (Treat the $B$ in the DOCX as a typo.)
- **L1-1 / L1-3 / L1-4 / L1-6**: figures are redrawn as SVG; the element letters/numbers placed in each
  region of `figures.json` match the printed diagrams (e.g. L1-4 has $C$ completely inside $A$, with
  $a$ in $A$ only for L1-3).
- **L2-12**: the four shaded answers were checked against the four shaded pictures in the solutions DOCX;
  (c) is the whole rectangle except the overlap (De Morgan reading of $A' \cup B'$), while (d) is only the
  region outside both circles — a common mix-up, so both are shown side by side in the solution.
- **L2-16(b)(i)**: sum greater than 9 excludes the pair $(3, 6)$ with sum exactly 9; three pairs qualify
  ($3+7$, $4+6$, $4+7$), matching the official list.
- **L2-17(a)**: "drawn at the same time" means order is irrelevant, so the sample space is
  $C^5_2 = 10$, not $P^5_2 = 20$; the official answer uses the combination.
- **L2-18(b)**: the official solution writes $6 + 5 - 1 = 10$; the website adds brackets
  ($[6 + 5] - 1 = 10$) per the site's "add before subtract" convention.
- **L2-19(a)**: the printed figure already labels Physics only 6, both 12, Chemistry only 3; the final
  cell uses $30 - [6 + 12 + 3] = 9$, which the site writes with brackets.
- **SM-20(b)**: the official answer gives two pairs; the site writes $(3, 2)$ and $(6, 4)$ and notes that
  every pair with the ratio $3 : 2$ works.

## Marks

Classwork questions carry no official marks. The teacher-set marks are:
SC 6 · Level 1 41 · Level 2 36 · SMART CORNER 4 → **87 marks over 21 questions** (the Section Check counts
as one question with six parts).
