# Revision Exercise 12 — source audit

Checked on 2026-11-24 against the supplied local originals:

- `source/SMS_bkexe_5A12_e.docx`: Revision Exercise 12, printed pp. 12.42–12.50.
- `source/SMS_sol_5A12_e.docx`: Revision Exercise 12 and Multiple Choice Questions.

The exercise ends before **Exam Zone (12.51)** and **Further Mathematics (12.54)**. It contains Level 1 Q1–18, Level 2 Q19–38, Smart Corner Q39, Cross Topics Q40–41, and MC1–MC14: **55 questions**. There is no section 12.3 in these sources. The website entry is `ch12-revision` / `12R`.

All 41 conventional questions retain their original parts. All 14 MCs retain their A–D order. The 190 website marks are teaching allocations, not a publisher's marking scheme. The six revision cards reuse the established theorem constructions from 12.1 and 12.2, with new IDs and local caption/line-break refinements.

## Image and formula checks

Word text extraction omits equations and arc hats. The native diagrams and equation images were inspected directly. In particular:

- The first three diagram pairs occur in reversed media order: Q1→image101, Q2→100, Q3→103, Q4→102, Q5→105, Q6→104.
- Q10 gives **arc AC : arc CB = 7 : 5**, not chord lengths.
- Q23(b)(ii) gives **81π cm²**. The π disappears from plain-text extraction.
- Q38 gives **arc BE = arc DE** in circle BCDE. Both arc hats and the equality were checked in image140.wmf; there is no factor of 2.
- MC5 options are 2√6, 4√2, 4√6 and 8√2 cm.
- MC7 options A and C include a/2; the answer is 135° − a/2.
- MC9 gives **arc AB : arc AC = 3 : 2**.
- MC13 option C is (8, −10/3).

All figures are native geometric constructions rather than published image copies. Original documents, extracted images, browser screenshots and temporary authoring scripts remain local.

## Verified answer ledger

| Q | Answer / conclusion |
|---|---|
| 1 | x = 22° |
| 2 | x = 24 cm |
| 3 | reflex AOB = 242° |
| 4 | x = 54° |
| 5 | x = 37° |
| 6 | x = 49° |
| 7 | BAP = 139° |
| 8 | area = 576π cm² |
| 9 | PA is tangent at A |
| 10 | BTO = 15° |
| 11 | QC = 19 cm |
| 12 | (a) ABC = 72°; (b) BOQ = 54° |
| 13 | Yes; POQ = 90° |
| 14 | ACB = 78° |
| 15 | CAP = 78° |
| 16 | CBR = 53° |
| 17 | CDB = 43° |
| 18 | PR is tangent at B; ABP = ADB = 49° |
| 19 | ABC = 24° |
| 20 | (a) OCP ~ QMP; (b) CBP = 119° |
| 21 | BC = 65 cm |
| 22 | ACB = 66° |
| 23 | (a) DEF equilateral; (b)(i) BF = 27 cm; (ii) sector = 81π cm² |
| 24 | BAC = 90° |
| 25 | ACQP is cyclic |
| 26 | BCP = 95° |
| 27 | ABC = 98° |
| 28 | (a) AEB = x + y; (b) PA is tangent at A |
| 29 | CBD = 69° |
| 30 | AEB = 19° |
| 31 | ABD = CBD = 48°, so DB bisects ABC |
| 32 | CDO = 48° |
| 33 | BFE = 62° |
| 34 | OP = 4.5 cm |
| 35 | (a) AOBP cyclic; (b) PB tangent at B |
| 36 | (a) QBC = 30°; (b) PBCQ cyclic |
| 37 | BCEF cyclic |
| 38 | (a) BE tangent to circle ABC at B; (b) BAC = 120° |
| 39 | (a) APCQ cyclic; (b) PAC ~ QAE |
| 40 | (a)(i) OAC ~ QAP; (ii) Yes, Q is the new centre; (b) Q = (−10, 5) |
| 41 | (a)(i) P = (25, 12); (ii) r = 15; (b) k = 49 |

MC1–MC14: **D, B, C, B, C, B, C, B, B, C, D, B, B, D**.

Numerical inputs are explicit. Proofs, coordinate pairs and exact π expressions opt out of scalar input rather than requesting an unexplained coefficient or accepting an accidental number extracted from a proof.

## Proof and geometry decisions

- Q3: the target is a reflex angle. The goal renderer now passes the existing `reflex` flag to the common arc construction, just as ordinary step arcs already do. The initial target and the derived minor angle must lie on opposite sides of O. Other existing goal data do not use this flag.
- Q8: do not assume AB is a diameter from the picture. First use 48² + 14² = 50² to prove AB perpendicular to AP, then use the contact normal through the centre.
- Q9, Q18, Q28, Q35(b), Q38(a): tangency is established with the applicable converse. Their proofs never first assume the property they are trying to establish.
- Q20: the 58° premise appears only in part (b). Its similarity uses the tangent–radius right angle, the perpendicular to the midpoint of DE, and the common angle at P.
- Q21 and MC5: obtain the tangent–secant length relation through AA similarity with the correct vertex order. The whole secant includes both inside and outside portions.
- Q23: the perimeter 54 cm appears only in part (b). FA and FB are the two rays from F, with D and E on them; the sector is the 120° sector through A, C, B. Radius 9√3 gives exactly 81π cm².
- Q24: D is introduced as the intersection of the common tangent at A with BC. DA = DB = DC comes from the two separate circles, not an assumed right angle.
- Q25: the official solution has vertex-label slips. The quadrilateral called OAPQ should be OAPB; the fourth interior angle printed OPB should be PBO. The website identifies these errors and uses the valid quadrilateral angle sum. OP = OP is a common side, not a newly proved fact.
- Q30: ABC subtends the **major** arc AC, so it is (360° − 114°)/2 = 123°, not 57°. The smaller circle has centre C and radii CB = CE.
- Q31: BA is tangent to the smaller circle only. The larger circle establishes BAD = 111°; the smaller diameter DE gives DAE = 90°; then the smaller-circle tangent theorem yields ADB = 21°.
- Q32: the two tangent–chord applications belong to different circles. An equivalent shorter solution uses ABC = 66°, BAC = 24°, COB = 48°, and CDO = COB in circle OCD.
- Q34: E is the smaller circle's top contact and D its bottom contact. Their distance is the smaller diameter, 25 cm; OP = 12.5 − 8 = 4.5 cm.
- Q37: G lies on AC and RS. ABC = CAQ = CGS and CBD = CDS = CDG; subtract to obtain ECF = EBF. All point orders and the two different circumcircles were checked.
- Q38(a): BCE and DBE are both circumference angles in BCDE. Equal arcs directly give their equality; the website uses `(equal arcs, equal ∠s)` rather than the central/circumference reason printed in the official explanation. The extra tangent DC and diameter BC are reserved for part (b).
- Q39: use the established cyclic APCQ relation only after completing part (a). The similarity order is PAC ~ QAE.
- Q40: the proposed new centre must lie both on PQ (normal at P) and on the perpendicular bisector of chord AP. QA = QP locates their intersection at Q. Coordinates are introduced only in part (b).
- Q41: the diagram satisfies both given line equations exactly. The incircle touches the right-hand side x = k at R, so k = 34 + 15, not 19.
- MC11: prove all three statements. Equal tangent lengths and AB // EF establish TE = TF; O and T lie on the perpendicular bisector of AB; hence TM perpendicular to EF, and CM = DM.
- MC12: only II is guaranteed. A valid two-circle counterexample has ACB = 65°, ADB = 95°, BAD ≈ 32.393°, DBQ ≈ 62.393°. Thus I and III need not hold. The true tangent–chord correspondence for BD in the smaller circle is DBQ = BED.
- MC13: the incentre is in the fourth quadrant at (r, −r), not at the origin or the centroid. The hypotenuse is 26 and equal tangents give r = 4.
- MC14: the representative figure has a:b = 5:12, while the proof remains symbolic. The incentre is (r,r), 5r = 2a and AB = b + a/5; Pythagoras gives 10ab = 24a². Cancelling a is valid because a > 0.

## Verification

`tools/verify_ch12_revision.py` independently checks the source angle/length ledger, circle incidence, ordered collinearity, tangency, equal lengths, parallel lines, similarity correspondences, proof conclusions, arc ratios, symbolic angle relations, coordinate conditions, MC counterexamples, answer inputs, shared reasons and bilingual formula consistency. `figcheck.py` separately checks the actual drawn angle labels.

The browser audit uses 1280, 390 and 320 px widths; all 56 pages in Chinese, English and bilingual modes; all 61 players and 238 forward states per width; Back through all states and Restart. It checks SVG labels, clipping, formulas and page overflow. Normal-motion controls, rapid input, later-part condition boundaries and MC/input submission are checked separately. Validation results are recorded in the handoff after the final run.
