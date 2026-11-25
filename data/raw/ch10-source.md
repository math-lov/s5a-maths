# Chapter 10 · Inequalities: source and verification record

Updated 25 November 2026 (Hong Kong).

Sources are the user-supplied `source/SMS_bkexe_4B10_e.docx` and
`source/SMS_sol_4B10_e.docx`. The source folder remains local and ignored.
MathType OLE equations were decoded alongside Word text, symbol-font characters
and superscripts; diagrams and ambiguous expressions were checked against the
original images. Media order is not question order: revision graph image110
belongs to Q42, while image109 belongs to Q43.

| Part | Class Exercise | Section Check | Exercise / revision | MC | Total pages |
|---|---:|---:|---:|---:|---:|
| 10.1 | A1–6, B1–5, C1–5: 16 | (a)–(f): 6 | 1–50 | 0 | 72 |
| 10.2 | 1–4 | (a)–(d): 4 | 1–19 | 0 | 27 |
| 10.3 | A1–6, B1–3: 9 | (a)–(e): 5 | 1–43 | 0 | 57 |
| Revision Exercise 10 | 0 | 0 | 1–69 | 1–14 | 83 |

Total: **239 question pages**, **12 teaching cards**, **35 selectable card examples**.
Solution-only Warm-up/Quick Check exercises are excluded because they are absent
from the supplied question document. Each source Section Check item gets its own
page. The existing `ch10-test` remains a separate school assessment.

## Confirmed source conflicts

- **CE 10.1A Q5:** the original equation image has denominator **8** in
  `(9−5x)/8 > 2(6−x)`; the solution uses **4**. The original gives `x > 87/11`;
  `x > 13` answers the altered denominator. At x = 8 only the original holds.
- **10.1 Q14:** original numerator `2(2x+7)` becomes `2(x+7)` in the official
  working. Both combined systems happen to have no solution. Retain the original.
- **10.1 Q36(b):** “both” conflicts with OR in (*). The official count **7**
  follows OR; a literal AND reading gives **0 positive integers**. Both readings
  are explained, and no ambiguous numeric input is graded.
- **10.1 Q45:** the official unbounded union omits the stated nonnegative scores.
  Include `0 ≤ x ≤ 136`, giving `[0,42] ∪ [94,136]`.
- **CE 10.3B Q1:** ABCD is 36 by 25, AE = x and FD = 2x, with E and F on AB
  and AD. Triangle EFC has area `x²−36x+450`. The algebraic area bound gives
  `18−2√6 ≤ x ≤ 18+2√6`, while F on AD requires `0 ≤ x ≤ 12.5`.
  Their intersection is empty. The official integers **14–22** place F outside
  the rectangle. Even at x = 12.5 the area is 156.25, exceeding 150.
- **CE 10.3B Q2:** original constant term is **k+2**, but the solution uses
  **k−2**. The original requires `k²−12k−24 < 0`, hence
  `6−2√15 < k < 6+2√15`, rather than `6±2√3`.
- **Revision Q68:** use the correct root sum `α+β = 2k+6`; an official sign error
  does not affect the squared sum or final minimum integer **−5**.
- **Revision Q69:** the original MathType equation gives area **less than π/4**;
  the official solution uses **25π/4**. With D = (k+7)²−32, diameter PQ = √D/2
  and area πD/16, the original requires `32 < (k+7)² < 36`: **no integral k**.
  Even with the official changed bound, there are **12**, not 11, integers;
  its list omits **k = 0**. Keep the original and show both discrepancies.

## Transcription and domain decisions

- 10.3 Q39 is **5 raised to n(3n−68)**. The entire product is the exponent.
  The least positive integer n is **23**.
- 10.3 Q40 is `f(x) = m·6^(x+1)`: m = **48**, least k = **11**.
- 10.3 Q41 has `114·1.2^(n−1)`: greatest n = **5**.
- Revision Q42 uses the given **downward** curve `y = −8x²+24x−18`;
  multiply the target expression by −2 and reverse the sign. Q43 uses the given
  `y = 2x²+2x−6`. Do not silently replace either by a different normalised curve.
- Unknown-coefficient graphs retain their given roots and orientation. Do not
  invent numeric a, b, c in a worked solution. A schematic curve can represent
  those features with hidden coefficients and no numerical scale.
- Revision Q64 recreates the original dot arrangement: n columns by n−1 rows,
  then one extra dot below the leftmost column. Counts are 1, 3, 7, 13;
  `a_n = n²−n+1`. The first term exceeding 211 has index **16**.
- Revision Q67 includes **k = 0**: the equation becomes linear with admissible
  root x = −3/2. Exclude x = ±3 before clearing denominators; all real k work.
- Counts, lengths, speeds, rates and points on segments retain their physical
  domains. For example 10.3 Q36 needs x > 5 and has **8** integer solutions.
- Graphical bounds are rounded only where requested. Interval geometry retains
  exact numeric boundaries; α, β, … are keyed by approximate labels beneath the
  diagram. Algebraic answers retain exact fractions and surds.

Revision MC order: **A B C D B C A C B D C C A B**.
Section Checks: 10.1 **T F F T T F**; 10.2 **F F T F**;
10.3 **T F T F T**.

## Verification

Run `python3 tools/build.py`, `python3 tools/verify_ch10.py`, and
`node --max-old-space-size=8192 tools/smoke_test.js`. Figure rendering uses
`python tools/preview_figures.py` with PyMuPDF installed.

The independent standard-library verifier samples all 348 polynomial conditions
at and between their roots and interval endpoints. Separate arithmetic ledgers
check source-sensitive integer answers, physical counterexamples, exponential
thresholds, source MC/TF order and caption/formula correspondence. Build S22
validates inequality players and selectable examples. Smoke tests render all
239 pages and exercise every player frame, Back, Restart, rapid clicks, choices
and numeric input, including signed equivalent fractions.

Real Chromium checks cover each question and overview at 1280, 390 and 320 px,
all three language modes, every interactive step at 390 px, visible SVG labels
and responsive reading order. Long original formulas scroll inside the question,
while part marks wrap to their own line. Proofs and arithmetic that have no
meaningful range diagram keep their complete written solutions without an empty
player. Website marks are **teaching allocations**, not official marking schemes.
