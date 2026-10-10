# Chapter 18.2 Addition Law of Probability · Source and Verification Notes

> Transcribed from `source/SMS_bkexe_5B18_e.docx` and checked against `source/SMS_sol_5B18_e.docx`
> (working extracts kept in `C:\temp\ch18\q182.txt` for questions and `s182.txt` for solutions).
> The DOCX files are local-only; student-facing stems and explanations are maintained in `data/src/ch18-2.json`.

## Extraction notes (why the raw text looks broken)

- Almost every fraction in the exercises and solutions is a **WMF picture**, not text
  (`【IMG:imageNN.wmf】`). The fractions were converted to PNG (`exe_png/`, `sol_png/`) and read
  one by one; the values are recorded in the official-answer table below.
- One table in Level 2 Q20 and one in the Cross Topics Q33 are pictures as well
  (`image28`, `image27.png` stem-and-leaf diagram). The stem-and-leaf diagram (CT Q32) is **not**
  included on the site — see "Omitted" below.
- No Venn diagram or other figure is needed for 18.2, so `data/src/figures.json` has **no**
  `ch18-2` entries.

## Sections

| Section | Site id | Source questions | Site marks |
|---|---|---|---|
| Class Exercise | CE1–CE4 | Class Exercise 18.2 | 12 |
| Section Check | SC | Section Check 18.2 (a)–(f) | 6 |
| Level 1 | 1–14 | Exercise 18.2 Level 1 | 38 |
| Level 2 | 15–28 | Exercise 18.2 Level 2 | 58 |
| SMART CORNER | 29–31 | Exercise 18.2 SMART CORNER | 14 |
| Cross Topics | 32–34 | Exercise 18.2 Cross Topics (33, 35, 36) | 18 |

Total: **39 questions, 146 marks** (the Section Check counts as one question with six parts).

* The printed Cross Topics set is 32–37. **CT Q32 (stem-and-leaf diagram) is omitted** because the
  diagram itself is a picture and the question is really a statistics/frequency question rather than
  an addition-law one. Q33/Q35/Q36 → site CT-32/CT-33/CT-34 (renumbered continuously).
* Section titles on the site are descriptive: the DOCX prints no titles for 18.2.
* 18.2 does **not** overlap 18.1: 18.1 is set notation and $P = n(A)/n(S)$ only, 18.2 is the
  addition law, mutual exclusion and complements. Nothing was dropped as "already covered".

## Official Answers

| Question | Answer |
|---|---|
| CE1 | (a) $\frac{18}{32}+\frac{23}{32}-\frac{11}{32}=\frac{15}{16}$; (b) $\frac{23-11}{32}=\frac{3}{8}$ |
| CE2 | (a) $\frac{3+4}{16}=\frac{7}{16}$; (b) $\frac{6}{16}+\frac{7}{16}-\frac{3}{16}=\frac{5}{8}$ |
| CE3 | (a) $\frac{5}{30}=\frac{1}{6}$; (b) $1-\frac{1}{6}=\frac{5}{6}$ |
| CE4 | (a) $\frac{21}{50}+\frac{15}{50}=\frac{18}{25}$; (b) $1-\frac{18}{25}=\frac{7}{25}$ |
| SC | Correct: (a), (b), (d), (e); incorrect: (c), (f) |
| L1-1 | $P(>6 \text{ or multiple of } 3)=\frac{6}{12}+\frac{4}{12}-\frac{2}{12}=\frac{2}{3}$ |
| L1-2 | $\frac{15}{36}+\frac{21}{36}-\frac{6}{36}=\frac{5}{6}$ |
| L1-3 | (a) J or Q: $\frac{4}{52}+\frac{4}{52}=\frac{2}{13}$; (b) club or $<4$: $\frac{13}{52}+\frac{8}{52}-\frac{2}{52}=\frac{19}{52}$ |
| L1-4 | (a) odd $\frac{1}{2}$; (b) prime $\frac{2}{5}$; (c) $\frac{5}{10}+\frac{4}{10}-\frac{3}{10}=\frac{3}{5}$ |
| L1-5 | $0.4+0.3=0.7$ |
| L1-6 | (a) $P(E \text{ or } R)=\frac{4}{11}$; (b) $P(\text{vowel or consonant})=\frac{9}{11}$ |
| L1-7 | (a) Level 4 or 5** $\frac{25}{90}=\frac{5}{18}$; (b) Level 4 or above $\frac{7}{10}$ |
| L1-8 | (a) cube $\frac{6}{15}=\frac{2}{5}$; (b) $\frac{8}{15}+\frac{3}{15}-\frac{0}{15}=\frac{11}{15}$ |
| L1-9 | $1-0.1=0.9$ |
| L1-10 | $1-\frac{2}{50}=\frac{24}{25}$ |
| L1-11 | not peanut: $1-\frac{3}{10}=\frac{7}{10}$ |
| L1-12 | (a) upper or middle $\frac{7}{10}$; (b) lower $\frac{3}{10}$ |
| L1-13 | (a) white or yellow $\frac{9}{16}$; (b) neither $\frac{7}{16}$ |
| L1-14 | (a) singing or dancing $\frac{75}{80}=\frac{15}{16}$; (b) neither $\frac{1}{16}$ |
| L2-15 | (a) $0.35+0.5=0.85$; (b) $1-0.85=0.15$ |
| L2-16 | (a) $0.2+0.4=0.6$; (b) $0.1+0.1+0.4=0.6$ |
| L2-17 | $\frac{20}{60}+\frac{12}{60}-\frac{4}{60}=\frac{7}{15}$ |
| L2-18 | (a) not a king $\frac{3}{4}$; (b) $\frac{18}{52}+\frac{16}{52}-\frac{8}{52}=\frac{1}{2}$; (c) $1-\frac{16}{52}=\frac{9}{13}$ |
| L2-19 | (a) $x=0.1$; (b)(i) $0.45$; (b)(ii) $1-0.3=0.7$ |
| L2-20 | (a) $y=25$; (b)(i) $1-0.25=0.75$; (b)(ii) $1-0.25-0.3=0.45$ |
| L2-21 | (a) $\frac{10}{32}=\frac{5}{16}$; (b) $\frac{12}{32}=\frac{3}{8}$; (c) $\frac{26}{32}=\frac{13}{16}$; (d) $\frac{7}{8}$ |
| L2-22 | (a) $\frac{11}{45}$; (b) $\frac{18}{45}=\frac{2}{5}$; (c) $\frac{39}{45}=\frac{13}{15}$ |
| L2-23 | (a) $\frac{1}{8}$; (b) $\frac{3}{8}$; (c) $\frac{1}{2}$ |
| L2-24 | (a) $\frac{1}{4}$; (b) $\frac{3}{16}$; (c) $\frac{5}{16}$ |
| L2-25 | (a) $(43-8)/75=\frac{7}{15}$; (b) $(32-8)/75=\frac{8}{25}$ |
| L2-26 | (a) $1-0.15=0.85$; (b) $[0.55+0.4]-0.85=0.1$ |
| L2-27 | (a)(i) $\frac{1}{4}$; (a)(ii) $\frac{2}{3}$; (b) $\frac{11}{12}\ne1$ so **not** the whole class |
| L2-28 | orange or yellow: $\left(1-\frac{2}{3}\right)+\left(1-\frac{1}{2}\right)=\frac{5}{6}$ |
| SM-29 | (a) $\frac{1}{4}$; (b) $\frac{1}{5}$; (c) $\frac{1}{4}+\frac{1}{5}-\frac{1}{20}=\frac{2}{5}$ |
| SM-30 | $\frac{2+1}{20}=\frac{3}{20}$ |
| SM-31 | (a) $\frac{1}{6}$; (b) $\frac{1}{12}$; (c) $\frac{31}{36}$ |
| CT-32 | (a) $\frac{4}{9}$; (b) $\frac{1}{3}$; (c) $\frac{2}{3}$ |
| CT-33 | (a) $\frac{4}{25}$; (b) $x=2$, $y=6$ |
| CT-34 | (a) $\frac{7+m}{7+m+n}=\frac45$, $\frac{7+n}{7+m+n}=\frac23$; (b) $m=5$, $n=3$ |

## Independent Verification Notes

- **L2-25 — denominator kept at 75 (follows the official key).** "App A has 43 choices, app B has 32
  choices, 8 appear on both." Read as "how many of the 75 listed choices are A only / B only", the
  official answers are $(43-8)/75 = 7/15$ and $(32-8)/75 = 8/25$. Read instead as a union
  ("43 restaurants serve on A, 32 on B, 8 both" → union 67), the answers would be $35/67$ and
  $24/67$. The site **follows the official key (75)** and the stem is worded as "choices"; a trap and
  a tip on this question point out the 67 reading explicitly so students who spot it are not marked
  down for the right reason. **Teacher to confirm which reading is intended.**
- **L2-16(b)** needs $P(1) + P(2) = 0.1 + 0.1$, which the printed dice picture supplies; the site
  states the three non-5/non-6 faces are 0.1 each.
- **L2-27(b)** is deliberately a "not the whole class" conclusion: $\frac{1}{2}+\frac{2}{3}-\frac{1}{4}
  = \frac{11}{12} < 1$, so at least one student is in neither club.
- **L1-8(b)** the prism colour (white) and the ball colour (blue) never coincide, so
  $P(A \cap B) = 0$ — the site keeps the $-0$ term visible on purpose to show that "0" is a real
  intersection value, not a missing term.
- **SM-30** the two conditions (sum $>15$, sum $<5$) cannot both hold, so the probabilities add
  directly. The boundaries 15 and 5 themselves are **not** counted ("greater than 15", "less than 5").
- **SM-31(c)** intersection of "different" and "product $<3$" is exactly $(1,2)$ and $(2,1)$;
  $(1,1)$ is excluded even though its product is below 3.
- **CT-34** the official equations were read from the solutions picture (`sol_png/image261.png`) and
  are identical to the site version; substituting $m=5$, $n=3$ gives total 15 and checks both
  given probabilities.
- **CT-32(c)** the official key uses the complement $1 - P(\text{unmarried female})$ and prints an
  "Alternative Solution" with the addition law $P(\text{male}) + P(\text{married}) -
  P(\text{married male})$. The site shows the complement as the main line and mentions the
  alternative in a trap, so both routes are visible.

## Build notes (rules enforced by `tools/build.py`)

- **DSE grade 5\*\*** is written `$5^{\ast\ast}$`, not `5**` and not `5^{**}`: rule S6 rejects the
  literal two-character sequence `**` anywhere in a text field, and the front end has no Markdown.
- **`difficulty` must be 1–3.** `app.js` draws `3 - difficulty` hollow stars, so a value of 4 throws
  `RangeError: Invalid count value: -1` and blanks the page. The three Cross Topics questions are
  therefore `difficulty: 3` (hardest on the site), same as the hardest Level 2 questions.
- **Rule S5** requires every `steps[].zh` to have at least 8 Chinese characters, so the short
  "evaluate the fraction" steps spell out the reasoning (分子是…所以所求概率為…) rather than just
  showing the arithmetic.
- Every fraction was re-rendered with real KaTeX (`throwOnError`) — 819 expressions, 0 errors.

## Marks

Book-exercise questions carry no official marks. Teacher-set marks, each question's `parts[].marks`
and each step's `(1M)`/`(1A)` summing to the same total (enforced by `tools/build.py`):

Class Exercise 12 · Section Check 6 · Level 1 38 · Level 2 58 · SMART CORNER 14 · Cross Topics 18
→ **146 marks over 39 questions**.
