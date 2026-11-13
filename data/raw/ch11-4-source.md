# Exercise 11.4 — source verification (2026-11-13)

Sources: `source/5A11_E.pdf`, printed pp. 11.59–11.75 (teaching and exercises),
`source/SMS_bkexe_5A11_e.docx`, and `source/SMS_sol_5A11_e.docx`, Class Exercise
11.4 and Exercise 11.4. Theorem abbreviations follow the independently verified
shared table for printed pp. 11.76–11.78.

Coverage: **42 question pages**: CE1–CE4, one Section Check page with five
statements, Q1–Q35 and Smart Corner Q36–Q37. Q37 is present in **all three**
sources and must not be omitted. Six bilingual teaching cards cover the two
forward properties, three converse tests, and choosing the correct four points.
The site uses 107 teacher-set practice marks, not publisher assessment marks.

## Checked answers and reasoning

| Item | Result / proof route checked against official solution |
|---|---|
| CE1 | CBD=44°, BDC=44°, BCD=92°, DAB=88° |
| CE2 | BDC=90°, ADC=112°, ABD=CBD=34° |
| CE3 | BEC=105°, CBE=36°, ABD=ACD=24°; converse same segment |
| CE4 | ABC=ACB=AED=DBC; exterior equals interior opposite angle for BCED |
| SC | True, False, False, False, True; four corresponding vector figures retained |
| 1 | x=118°, y=94°; separate answer boxes |
| 2 | ABC=ACB=69°, x=42° |
| 3 | ADC=104°, x=76°, y=89°; ADR and PBCQ straight |
| 4 | ABC=104°, x=104°; AB parallel CD |
| 5 | ABD=ADB=38°, ABC+ADC=180°; concyclic |
| 6 | ABC=121°, ADC=58°, sum=179°; not concyclic |
| 7 | ADE=69°−38°=31°=ACB; converse same segment |
| 8 | ABD=ACD=43° establishes cyclicity; BCD=98°, x=55° |
| 9 | BAD=83°, BCD=97° establishes cyclicity; ADB=46°, x=AEB=94° |
| 10 | ABC=CDE=107° establishes cyclicity; BCD=124°, CDB=28°, x=45° |
| 11 | OCB=29°, BCD=69°, OCD=40° |
| 12 | ABD=83°, ADB=ACB=29° |
| 13 | EAD=EDA; ABC=BCD; BE=CE; subtract AE=DE to obtain AB=CD |
| 14 | CBE=CEB=DAB; ADC+DAB=180°, BA parallel CD; ADCE parallelogram, AD=CE=BC |
| 15 | ACD=80°, CAD=20°, BAC=BCA=40°; opposite angles sum to 180° |
| 16 | DCA=DAC=BAC=32°; opposite angles 64°+116°=180° |
| 17 | ABE=BDC=BAC=36° establishes cyclicity; with BE=EC, ECB=54°, BCD=90°; BD diameter |
| 18 | Reflex AOC=210°, minor AOC=150°; ADCO opposite angles 150°+30°=180° |
| 19 | BCE=78°, CBE=54°, BEC=48° |
| 20 | DCF=124°−x, DAE=56°+x; with ACEF cyclic, DAE=DCF gives x=34° |
| 21 | DCF=BAF; DEF+DCF=180°; AB parallel ED |
| 22 | BOD=144°, COD=38°, OCD=71°; OBD=18°, OED=106°+18°=124° |
| 23 | AED=112°, ADE=50°; if AB=AE, ACB=50°, BAD=62° |
| 24 | CA=CD, ACB=DCE=90°, CAB congruent CDE (RHS); EAB=EDB establishes ABED cyclic |
| 25 | Equal **arcs** AB and BC, not a chord-length ratio; EDC=EOC establishes OECD cyclic |
| 26 | **Arc** CE=2 arc BC. Let BDC=x; CAE=2x, BAE=CDE=3x; 5x=180°, BAC=36° |
| 27 | BC is the semicircle diameter; ABC=57°, BAC=90°, ACB=ACD=33°, CAD=24° |
| 28 | **Arc** AD:DC=2:1; CAD=CBD=29°. With **arc** BC:CD=3:1, BDC=BAC=87°, BAD=116° |
| 29 | 2 arc PQ=2 arc QR=arc RS means 1:1:2; QPS=84°, PSR=56°, PQR=124° |
| 30 | A,B,O,D concyclic is given; ADB=AOB=2ACB; CBD=BCD=BDC=60°; equilateral |
| 31 | In-centre gives CAD=BAC=18°; BED=36°, AEF=EAF=54°; BAE+AED=180°, AB parallel ED |
| 32 | Join AD; opposite angles in ABCD and ADEF give two sums of 180°; total 360° |
| 33 | Both actual circles and ADF/BCE/CDG/EFG point order checked; GCE=DFG=x, CDF=y, CGE=y−x |
| 34 | BDE=BCE=CED=180°−θ; DFE=2θ−180°. With perpendicular diagonals θ=135°; ABFE not cyclic |
| 35 | ACB=ACD=35°, CBD=55°, ABD=35° establishes cyclicity. AC diameter, M centre; BMD=140°, MBD=20° |
| 36 | PQS=75°, RQS=40°, QPS=70°, TPS=25°, QSP=35°, PST=50°, RSQ=30°; arc ratio 7:6:8:5:10 |
| 37 | Equal **arcs** AB=BC=CD, AD diameter; ADB=BDC=CBD=x, BAD=90°−x; x=30°, BCD=120° |

## Verified editorial corrections

* Q22(b): the official Word solution repeats `OBE + OBE`. The exterior angle
  at E is **BOE + OBE**, giving 106°+18°=124°. The numerical answer in all
  supplied sources is consistent. Corrected angle names are used on the site.
* Q30: the official solution repeats CBD in its three-angle sum and conclusion.
  The three distinct angles are **CBD, BDC, BCD**. The conclusion (equilateral)
  is unchanged and is independently checked with coordinates.
* These are solution notation errors, not missing givens. No extra geometric
  condition is silently added. For multi-part figures the model satisfies the
  additional part (b) conditions, but the proof of (a) never uses those conditions.
* The DOCX plain-text extraction drops the curved arc marks and some angle
  glyphs. The PDF figures and original equation content were used to distinguish
  arcs from chords in Q25–Q29, Q36 and Q37. Do not import these as chord ratios.

## Maintenance checks

`python3 tools/verify_ch11_4.py` verifies all original numeric angle givens,
equality marks, given parallel lines, straight-line incidence, the two actual
circle centres/radii, proved cyclic configurations, arc ratios, official numeric
answers, in-centre angle bisectors, bilingual formula identity and approved
reason abbreviations. `tools/figcheck.py` separately verifies every numeric
animation annotation. Full smoke tests cover every question page and every
forward/backward/restart state in the 46 players. Browser checks include three
languages and desktop/mobile/narrow layouts; see the handoff for final evidence.
