# Section 12.1 source and verification record

Sources: `source/SMS_bkexe_5A12_e.docx` (original exercises) and
`source/SMS_sol_5A12_e.docx` (official solutions), section 12.1, pp.12.9–12.25.
Read on 2026-11-17. Source files and extracted images remain local and are not published.

## Coverage and transcription

54 question pages: six subfigures in Class Exercise 12.1A, three questions in
Class Exercise 12.1B, four Section Check items, Level 1 Q1–22, Level 2 Q23–39,
Smart Corner Q40 and Cross Topics Q41. The original codes are preserved; multi-figure
class exercises and Section Check statements have separate pages so every figure
can use the Chapter 11 synchronised step player. Practice marks (126 total) are
teacher-set, not publisher marking allocations.

Word's anchored multi-column images are not in reading order. Official answers and
image contents establish the mapping: A1(a,b,c) = image3, image2, image1;
A2(a,b,c) = image6, image5, image4; Q1–3 = image16, image15, image14;
Q4–6 = image19, image18, image17; Q12 = image26, Q13 = image25.
All numerical givens embedded in these images are included explicitly in the bilingual stems.
The missing embedded formula in Q37(a) is AB = 72/k + 6, verified by the official
tangent-length derivation. Q39 has no given diameter: choosing AC as a diameter is
explicitly described as one valid construction, not added as a premise.

## Verified editorial corrections

- Q26: official last line says CBE; the original question asks CDE. The correct angle
  CDE is 91°. The website states this correction in both languages.
- Q38(b): the official solution repeats PQR instead of naming all three distinct
  angles PQR, PRQ, QPR. The conclusion (equilateral) is unchanged. Part (a)'s
  representative figure uses a = 35°, b = 25° so it does not assume a = b.

## Answer ledger

| Original code | Verified answer(s) |
|---|---|
| A1(a) | x=26^\circ |
| A1(b) | x=36^\circ |
| A1(c) | x=21\text{ cm} |
| A2(a) | \text{Yes} |
| A2(b) | \text{No} |
| A2(c) | \text{Yes} |
| B1 | x=7\text{ cm}; y=32^\circ |
| B2 | x=52^\circ; y=26^\circ |
| B3 | 56\text{ cm} |
| SC(a) | \text{Correct} |
| SC(b) | \text{Incorrect} |
| SC(c) | \text{Correct} |
| SC(d) | \text{Correct} |
| 1 | x=21^\circ |
| 2 | x=45^\circ |
| 3 | x=61^\circ |
| 4 | x=18\text{ cm} |
| 5 | x=9\text{ cm} |
| 6 | x=22\text{ cm} |
| 7 | \angle APO=28^\circ |
| 8 | AC\,//\,PQ |
| 9 | \angle APO=36^\circ |
| 10 | \angle OAB=13^\circ; \angle AOC=106^\circ |
| 11 | \angle ACD=113^\circ |
| 12 | \text{Yes} |
| 13 | \text{No} |
| 14 | OA\perp AP; BD=CD |
| 15 | x=84^\circ |
| 16 | x=35^\circ |
| 17 | x=121^\circ |
| 18 | \angle BOC=122^\circ |
| 19 | AP=(x+4)\text{ cm}; 134\text{ cm} |
| 20 | \angle CTD=2\angle ABD |
| 21 | \angle POC=63^\circ |
| 22 | \angle CBA=\angle ABT=62^\circ |
| 23 | \angle BAP=45^\circ-\frac{x}{2}; x=30^\circ |
| 24 | \angle AOC=130^\circ |
| 25 | \angle AOB=74^\circ |
| 26 | \angle CDE=91^\circ |
| 27 | OA\perp AP |
| 28 | \triangle ABC\sim\triangle TAC; 15\pi\text{ cm}<50\text{ cm} |
| 29 | OA\perp AP |
| 30 | OA\perp AP |
| 31 | \triangle ADE\sim\triangle BOE; CE=6\text{ cm} |
| 32 | \angle OCB=34^\circ |
| 33 | \angle AOE=\angle EOD=76^\circ |
| 34 | OD\perp DP |
| 35 | OM=AM |
| 36 | \angle OAP+\angle OCP=180^\circ |
| 37 | AB=\frac{72}{k}+6; k=3 |
| 38 | \angle COE=2a+2b; \angle QPR=\angle PQR=\angle PRQ=60^\circ |
| 39 | (a,b,c,d,e)=(12,9,15,20,25),\ (16,12,20,48,52) |
| 40 | \angle PTR=60^\circ |
| 41 | r=15\text{ cm}; \text{Area}\approx289.780\text{ cm}^2<300\text{ cm}^2 |

## Geometry and interaction checks

`tools/verify_ch12_1.py` checks coverage against original codes, the source's given
angles and lengths independently of SVG annotations, radius–tangent perpendicularity,
parallelism, representative symbolic identities, and matching bilingual formulas.
It also checks both explicit integer constructions for Q39 and the unrounded sector
area for Q41 (289.7797556 cm², using radius 25 cm, not 15 cm).

All 54 questions and five teaching cards reuse `assets/circle.js` without changing
its rendering code: tangent intersections, constructed points, multiple circles,
right-angle marks and the Chapter 11 player already cover this section. Numerical
answer checks are enabled where the answer is a single number (30 pages). Proofs,
symbolic expressions, the non-unique Q39 and qualitative conclusions use worked
answers without forcing numerical grading. Section Check retains interactive
true/false answers (true, false, true, true).

The build's angle-target warning now matches the word “angle” or “angles” rather
than the substring in “triangle”. The degree/radian guards are preserved. In Q41,
the angle and sector-area calculations are separate steps; theta is explicitly
measured in degrees before applying theta/360 × pi × R².

Final validation: build/check 0 errors and 0 warnings; full smoke suite; all five
Chapter 11 geometry verifiers; combined figcheck; browser checks at 1280/390/320
(165 page-width combinations, 465 forward states and all Back/Restart states),
three languages, no label collisions, bounds or formula overflow; all 59 players
with normal motion, rapid clicks, stale timers, keyboard and enlarged text.
