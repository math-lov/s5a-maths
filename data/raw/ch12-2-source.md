# Section 12.2 source and verification record

Sources: `source/SMS_bkexe_5A12_e.docx` (original questions) and
`source/SMS_sol_5A12_e.docx` (official solutions), Class Exercise 12.2 and
Exercise 12.2, pp.12.33–12.40. Read on 2026-11-19. The source files and images
remain local; published figures are reconstructed SVG geometry.

## Coverage and transcription

36 question pages: Class Exercise CE1–CE3; Section Check (a)–(c); Level 1
Q1–17; Level 2 Q18–28; Smart Corner Q29; Cross Topics Q30. Four interactive
teaching cards cover the tangent–chord theorem, its converse, a false candidate
and similarity. The 120 practice marks are teacher-set, not publisher allocations.

Word's embedded formulas and anchored figures were checked visually in an exported
PDF as well as against the official solution text. In particular, SC(c) gives
BC = CD and three angles (46°, 41°, 46°); Q23 and Q29 give AD = BC;
Q25 gives the **arc** ratio PQR : PSR = 4 : 5. Q27's original smaller circle
passes through A, C and D; the concyclicity of A, C, B and E is a new conclusion,
not one of the two given circles. Q28's second circle is CEDF. Q30's 16 is AC,
9 is AP and 15 is BP, with C–A–P in that order.

## Answer ledger

| Code | Verified answer(s) |
|---|---|
| CE1 | \angle APB=29^\circ |
| CE2 | \angle CAP=66^\circ |
| CE3 | \text{PA is tangent at A} |
| SC(a) | \text{Correct} |
| SC(b) | \text{Correct} |
| SC(c) | \text{Incorrect} |
| 1 | x=38^\circ |
| 2 | x=67^\circ |
| 3 | x=118^\circ |
| 4 | \text{PQ is tangent at A} |
| 5 | \text{PQ is tangent at A} |
| 6 | \text{PQ is not tangent at A} |
| 7 | \angle ACB=68^\circ |
| 8 | \angle BAP=107^\circ |
| 9 | \angle BAD=51^\circ |
| 10 | \angle ADC=70^\circ |
| 11 | \angle BCD=111^\circ |
| 12 | \angle CAT=116^\circ |
| 13 | \angle ACB=180^\circ-x-y; \angle ACB=118^\circ |
| 14 | \angle ABC=73^\circ |
| 15 | \text{PQ is tangent at C} |
| 16 | \text{QB is tangent at B} |
| 17 | \text{QC is tangent at C} |
| 18 | \triangle ABD\sim\triangle BCD; [ABC]:[BCD]=5:4 |
| 19 | DB\parallel PQ |
| 20 | \angle DCQ=124^\circ-\theta; AD=CD |
| 21 | \angle APD=33^\circ |
| 22 | \angle ADC=102^\circ |
| 23 | \angle DCQ=74^\circ |
| 24 | \angle AOC=2x,\quad\angle BOE=x; \angle ABC=22^\circ |
| 25 | \text{TR is tangent at R} |
| 26 | \text{BC is tangent at E} |
| 27 | A,C,B,E\text{ are concyclic}; BD=DE |
| 28 | \angle CFE=\angle EFD; EF\text{ is a diameter} |
| 29 | AE=BE; \text{Yes, DB is tangent at B} |
| 30 | \triangle BAP\sim\triangle CBP; PB\text{ is tangent at B}; C=(6,21),\quad P=(-9,1); 3x+4y=22 |

## Geometry, givens and proof pacing

All question figures use exact numerical geometry satisfying the source angles,
collinearity, parallel lines, equal chords and tangent perpendicularity. The false
candidates SC(c) and Q6 are deliberately not drawn as tangents. Both circles are
fully framed in Q24 and Q26–29. F is an auxiliary point on the larger circle in
Q29 and appears only when used in part (b).

Every given angle, equal-side mark, parallel pair and Q30 length is visible before
Next. The extra conditions in Q13 (56°), Q18 (3:2), Q20 (theta = 62°), Q24 (66°),
Q27 (angle ADC = angle ATB) and Q30 (coordinates/diameter) appear when their own
part begins. Back and Restart remove those future conditions. Initial given
labels remain orange; deductions use the existing purple style.

Changes of theorem are separated in the main multi-theorem proofs. For example,
Q27 first establishes equal tangents, then equal base angles, then the angle in
the alternate segment. Q28 separates equal tangents, equal base angles and
same-segment angles. Formal bilingual solutions use the same formulas and sequence
as the interactive player. Initial and derived length ticks use different counts
when the corresponding lengths are different (Q12 and Q29).

The existing circle renderer is reused without changes. Two approved theorem
abbreviations are added for the tangent–chord theorem and its converse. Numerical
answer input is enabled for the 17 pages with a single numerical answer; proofs,
ratios and coordinate pairs retain worked answers. All three Section Check items
support interactive true/false answers (true, true, false).

## Validation

- `python3 tools/build.py --check`: no errors or warnings.
- `python3 tools/verify_ch12_2.py`: all source codes, given/derived angles,
  tangent perpendicularity, equal sides, collinearity, parallel lines, both circles,
  initial-givens ledger, numeric answers, staged conditions and formula matching.
  Independent checks include Q18's area ratio, Q27's new cyclic quadrilateral,
  Q28's diameter, and Q30's scaled lengths, coordinates and line equation.
- `python3 tools/figcheck.py data/src/ch12-2.json`: no geometry-label mismatches.
- `tools/smoke_test.js`: all question pages, four cards, valid KaTeX, wrong-first
  numeric/true-false retries, every forward state, given-label persistence, and
  exact restored geometry/explanation on Back/Restart (reduced motion).
- Real Chromium: 573 initial/forward figure states across widths 1280/390/320,
  with no overlapping text labels or labels outside the SVG. Nested angle labels
  use separate radii and a few deliberate offsets rather than hiding the givens.

Normal-motion Chromium checks also rapidly advance and restart all 40 players;
after pending animation delays expire, no stale label, line or answer reappears.
Final full smoke suite: 1,138 assertions passed.
