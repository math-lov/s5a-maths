# Chapter 18.3 Multiplication of Probabilities · Source and Verification Notes

> Transcribed from `source/SMS_bkexe_5B18_e.docx` and checked against `source/SMS_sol_5B18_e.docx`
> (working extracts kept in `C:\temp\ch18\q183.txt` for questions and `s183.txt` for solutions).
> The DOCX files are local-only; student-facing stems and explanations live in `data/src/ch18-3.json`.

## Extraction notes (why the raw text looks broken)

- Most fractions in the exercises and in the solutions are **WMF pictures** rather than text
  (`【IMG:imageNN.wmf】`). They were converted to PNG (`exe_png/`, `sol_png/`) and read one by one;
  the values are recorded in the official-answer table below.
- Pictures that carry actual data (not just a fraction): the season table in Level 2 Q29 and the
  piercing table in Level 1 Q13 are plain text tables in the extract; the interview rates in
  Level 2 Q27 (`image40`, `image41`, `image42`) are pictures and were read as $\frac{3}{4}$,
  $\frac{1}{2}$, $\frac{1}{5}$.
- The Level 2 Q25 baseball rate (`image39`) and the Level 1 Q4 answering rates (`image37`,
  `image38`) are also pictures; the values used are recorded below.
- No Venn diagram or other figure is needed for 18.3, so `data/src/figures.json` has **no**
  `ch18-3` entries.

## Sections

| Section | Site id | Source questions | Site marks |
|---|---|---|---|
| Class Exercise | CE1–CE4 | Class Exercise 18.3 | 12 |
| Section Check | SC | Section Check 18.3 (a)–(f) | 6 |
| Level 1 | 1–14 | Exercise 18.3 Level 1 Q1, 2, 3, 4, 5, 6, 8, 10, 12, 13, 14, 19, 20, 21 | 45 |
| Level 2 | 15–28 | Exercise 18.3 Level 2 Q22, 23, 24, 27, 28, 29, 30, 31, 33, 34, 35, 36, 38, 40 | 55 |
| SMART CORNER | 29–31 | Exercise 18.3 SMART CORNER Q42, 44, 45 | 14 |
| Cross Topics | 32–34 | Exercise 18.3 Cross Topics Q46, 47, 49 | 11 |

Total: **39 questions, 143 marks** (the Section Check counts as one question with six parts).

* The printed Level 1 set is Q1–Q21 and Level 2 is Q22–Q41; 14 from each were selected so that
  every structural type of the section appears at least once (independent repeated trials, with /
  without replacement, given-that conditional probability, tables, transfers, "at least / at most",
  "exactly k of n", "repeat until …").
* **SM Q43** (numbered balls 1, 1, 2, 2, 2, 3, 5, 5 with replacement) is omitted: it is a single
  one-line "different numbers" complement that adds nothing that L1 Q2 and L2 Q34 do not already
  drill. Q42 / Q44 / Q45 → site SM-29 / SM-30 / SM-31.
* The printed Cross Topics set is Q46–Q50. **Q48** (heads and tails alternating) is omitted
  because it needs the general term for $n$ tosses, which is outside this section.
  **Q50** (stem-and-leaf diagram) is omitted because the diagram itself is a picture and the
  question is really a statistics/frequency question. Q46 / Q47 / Q49 → site CT-32 / CT-33 / CT-34.
* Section titles on the site are descriptive; the DOCX prints no titles for 18.3.
* 18.3 does **not** overlap 18.2: 18.2 is the addition law over unions, 18.3 is the product rule
  over intersections plus conditional probability. 18.3 deliberately reuses the addition law
  wherever a case analysis is needed (SC (a), L2 Q28, SM Q45), because mixing the two laws is the
  main difficulty of this section.

## Official Answers

| Question | Answer |
|---|---|
| CE1 | (a) $\frac{5}{9}\times\frac{3}{10}=\frac{1}{6}$; (b) $1-\frac{1}{6}=\frac{5}{6}$ |
| CE2 | (a) $0.8^3=0.512$; (b) $1-0.512=0.488$ |
| CE3 | (a) $\frac{5}{20}\times\frac{4}{19}=\frac{1}{19}$; (b) $\frac{5}{20}\times\frac{15}{19}=\frac{15}{76}$ |
| CE4 | (a) $\frac{6}{9}=\frac{2}{3}$; (b) $\frac{5}{9}$; (c) $\frac{2}{6}\times\frac{6}{9}+\frac{4}{6}\times\frac{5}{9}=\frac{16}{27}$ |
| SC | Correct: (c), (d), (f); incorrect: (a), (b), (e) |
| L1-1 | $\frac{1}{2}\times\frac{1}{6}=\frac{1}{12}$ |
| L1-2 | $\frac{5}{10}\times\frac{5}{10}=\frac{1}{4}$ (card replaced) |
| L1-3 | $\frac{9}{10}\times\frac{9}{10}=\frac{81}{100}$ |
| L1-4 | Asha $\frac{1}{2}$, Luna $\frac{1}{3}$; (a) only Asha $\frac{1}{3}$; (b) only Luna $\frac{1}{6}$ |
| L1-5 | (a) $0.9\times0.4=0.36$; (b) $0.6\times0.1=0.06$; (c) $1-0.36-0.06=0.58$ |
| L1-6 | (a) $0.5\times0.6=0.3$; (b) $0.5\times0.4+0.5\times0.6=0.5$; (c) $0.3+0.5=0.8$ |
| L1-8 | (a) $\frac{1}{6}\times\frac{6}{9}=\frac{1}{9}$; (b) $\frac{3}{6}\times\frac{6}{9}=\frac{1}{3}$; (c) $1-\frac{1}{3}=\frac{2}{3}$ |
| L1-10 | (a) $\frac{1}{6}\times\frac{1}{4}+\frac{3}{6}\times\frac{1}{4}=\frac{1}{6}$; (b) $\frac{5}{6}$ |
| L1-12 | (a) $\frac{9}{13}$; (b) $\frac{9}{36}=\frac{1}{4}$ |
| L1-13 | (a) $\frac{21}{63}=\frac{1}{3}$; (b) $\frac{18}{75}=\frac{6}{25}$; (c) $\frac{18}{60}=\frac{3}{10}$ |
| L1-14 | (a) $\frac{4}{12}=\frac{1}{3}$; (b) $\frac{4}{11}$ |
| L1-19 | (a) replaced $\frac{7}{13}\times\frac{7}{13}=\frac{49}{169}$; (b) not replaced $\frac{7}{13}\times\frac{6}{12}=\frac{7}{26}$ |
| L1-20 | (a) $\frac{2}{9}$; (b) $\frac{7}{9}\times\frac{2}{8}=\frac{7}{36}$ |
| L1-21 | (a) $0.7\times0.6=0.42$; (b) $0.7\times0.4\times0.8=0.224$ |
| L2-15 | $1-6\times\frac{1}{6}\times\frac{1}{6}=\frac{5}{6}$ |
| L2-16 | (a) $(\frac{1}{2})^{4}=\frac{1}{16}$; (b) $1-\frac{1}{16}=\frac{15}{16}$ |
| L2-17 | (a) $(\frac{4}{6})^{3}=\frac{8}{27}$; (b) $1-\frac{8}{27}=\frac{19}{27}$ |
| L2-18 | rates $\frac{3}{4},\frac{1}{2},\frac{1}{5}$; (a) $\frac{1}{4}\times\frac{1}{2}\times\frac{4}{5}=\frac{1}{10}$; (b) $\frac{9}{10}$ |
| L2-19 | (a) exactly two late $0.2\times0.7\times0.1+0.2\times0.3\times0.9+0.8\times0.7\times0.9=0.572$; (b) at most one late $0.302$ |
| L2-20 | (a) $\frac{75}{150}=\frac{1}{2}$; (b) $\frac{20}{48}=\frac{5}{12}$; (c) $\frac{50}{75}=\frac{2}{3}$ |
| L2-21 | (a) $\frac{5}{9}$; (b) $\frac{4}{9}$ |
| L2-22 | (a) $\frac{96}{120}=\frac{4}{5}$; (b) $\frac{96}{138}=\frac{16}{23}$; (c) $\frac{96}{162}=\frac{16}{27}$ |
| L2-23 | (a) $\frac{9}{15}\times\frac{8}{14}\times\frac{7}{13}=\frac{12}{65}$; (b) $1-\frac{12}{65}-\frac{4}{91}=\frac{27}{35}$ |
| L2-24 | (a) $(\frac{3}{6})^{3}+(\frac{2}{6})^{3}+(\frac{1}{6})^{3}=\frac{1}{6}$; (b) $3\times(\frac{3}{6})^{2}\times\frac{2}{6}=\frac{1}{4}$ |
| L2-25 | (a) $\frac{10}{12}\times\frac{9}{11}\times\frac{2}{10}=\frac{3}{22}$; (b) $2\times\frac{2}{12}\times\frac{10}{11}\times\frac{1}{10}=\frac{1}{33}$ |
| L2-26 | (a) $\frac{12}{16}\times\frac{11}{15}\times\frac{4}{14}=\frac{11}{70}$; (b) at most 3 draws $\frac{17}{28}$ |
| L2-27 | (a) $\frac{1}{2}\times\frac{1}{7}=\frac{1}{14}$; (b) $\frac{1}{2}\times\frac{2}{7}+\frac{1}{2}\times\frac{5}{7}=\frac{1}{2}$ |
| L2-28 | (a) $\frac{5}{8}\times\frac{3}{7}+\frac{3}{8}\times\frac{2}{7}=\frac{3}{8}$; (b) $\frac{5}{8}\times\frac{4}{7}+\frac{3}{8}\times\frac{2}{7}=\frac{13}{28}$ |
| SM-29 | (a) $\frac{5}{7}\times0.6+\frac{2}{7}\times0.1=\frac{16}{35}$; (b) $\frac{\frac{5}{7}\times0.6}{\frac{16}{35}}=\frac{15}{16}$ |
| SM-30 | (a) $\frac{3}{10}$; (b) $2\times\frac{2}{11}\times\frac{9}{10}=\frac{18}{55}$ |
| SM-31 | (a) Helena $\frac{17}{28}$; (b) Kathy $\frac{11}{28}$, so the first player is indeed better off |
| CT-32 | (a) $0.6$; (b) $0.4\times0.45=0.18$ |
| CT-33 | (a) $0.6\times0.75=0.45$; (b) $0.4\times0.15=0.06$ |
| CT-34 | (a) $\frac{2}{28}=\frac{1}{14}$; (b) expected gain $56\times\frac{1}{14}+14\times\frac{1}{7}=6$ dollars |

## Verification notes (points that are easy to get wrong)

- **SC (a)** the statement gives only one of the two "late exactly once" orderings, so the printed
  $0.05\times0.95$ is not the full answer $0.095$.
- **SC (b)** "at least one 5" has complement "neither is a 5", i.e. $\frac{5}{6}$ per dice, not
  $\frac{1}{6}$; the printed $\frac{35}{36}$ is wrong.
- **SC (e)** the setup $\frac{3}{9}\times\frac{3}{9}$ is correct (with replacement) — only the
  simplification $\frac{9}{81}=\frac{1}{4}$ is wrong.
- **L1-19(b)** without replacement the second denominator is $12$, not $13$: the first blue block
  has already been removed.
- **L2-21(a)** given the first block is 7, the remaining nine blocks are
  $\{0,1,2,3,4,5,6,8,9\}$; 7 itself is gone, so only $4,5,6,8,9$ work → $\frac{5}{9}$.
- **L2-22(c)** "at least one paper" is $120+138-96=162$ (18.2 addition law), not $258$ and not $160$.
- **L2-23(b)** the complement has **two** cases (all chocolate / all butter), so both are subtracted.
- **L2-25(b)** the third student faces $1$ gold bar in $10$, because one has already been drawn.
- **L2-26(b)** "at most 3 draws" is the sum of the 1-, 2- and 3-draw cases, not $1-\frac{11}{70}$
  (that complement includes 4, 5 and 6 draws as well).
- **L2-28** the transferred cup changes box B from 6 cups to 7 **before** the conditional
  probability is written; after a black cup moves in, box B has 3 black; after a white cup, still 2.
- **SM-31** Helena can only win on draws 1, 3 and 5 (the game must end by draw 6 because there are
  only 5 green marbles), giving $\frac{21}{56}+\frac{10}{56}+\frac{3}{56}=\frac{17}{28}$. The tempting
  three-term sum that stops after draw 3 gives $\frac{23}{28}$ and is wrong — the official answer is
  $\frac{17}{28}$, confirmed from `sol_png/image505.png`.
- **CT-34** "at the same time" means unordered draws, so there are $\binom{8}{2}=28$ outcomes, not
  $8\times7=56$; the largest possible sum is $7+8=15$.

## Build notes (rules enforced by `tools/build.py`)

- **Currency must not use `$`.** `$` is the front end's math delimiter, so `$56` in an English
  field either pairs with the wrong `$` later in the paragraph or renders as a broken formula.
  Rule S6 rejects it. English text writes "56 dollars" and the `math` field ends with
  `= 6 \text{ dollars}`; the Chinese side may still use `$56$` inside a paired math span.
- **No Markdown.** Rule S6 rejects the literal `**` anywhere in a text field; the front end has no
  Markdown. Emphasis is written out in words instead.
- **`difficulty` must be 1–3.** `app.js` draws `3 - difficulty` hollow stars, so a value of 4 throws
  `RangeError: Invalid count value: -1` and blanks the page. The hardest 18.3 questions (L2 Q34,
  Q35, Q36, Q40) are therefore `difficulty: 3`.
- **Rule S5** requires every `steps[].zh` to have at least 8 Chinese characters, so the short
  "evaluate the fraction" steps spell out the reasoning (分子分母同除以…所以…) rather than only
  showing the arithmetic.
- **Rule S2** requires `parts[].marks` and `steps[].marking` to sum to the same total. Where a
  part is worth 1 mark but needed two explanatory steps, the steps were merged into one `(1A)`
  instead of inflating the question's marks.
- Every fraction was re-rendered with real KaTeX (`throwOnError`) in `tools/smoke_test.js` —
  all 39 pages of 18.3, 0 errors.

## Marks

Book-exercise questions carry no official marks. Teacher-set marks, with each question's
`parts[].marks` and each step's `(1M)`/`(1A)` summing to the same total
(enforced by `tools/build.py`):

Class Exercise 12 · Section Check 6 · Level 1 45 · Level 2 55 · SMART CORNER 14 · Cross Topics 11
→ **143 marks over 39 questions**.