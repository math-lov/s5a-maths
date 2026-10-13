# Chapter 18.4 Probability by Counting · Source and Verification Notes

> Transcribed from `source/SMS_bkexe_5B18_e.docx` and checked against `source/SMS_sol_5B18_e.docx`
> (working extracts kept in `C:\temp\ch18\q184.txt` for questions and `s184.txt` for solutions).
> The DOCX files are local-only; student-facing stems and explanations live in `data/src/ch18-4.json`.

## Extraction notes (why the raw text looks broken)

- Almost every fraction in the exercises and in the solutions is a **WMF picture**
  (`【IMG:imageNN.wmf】`) with no text layer: `tools/wmftext.py` returns "(no text)" for them, so
  they were converted to PNG (`exe_png/`, `sol_png/`) and read one by one. The Chapter 18.4 answers
  are `sol_png/image678.png` – `image753.png`; the whole range was re-read in batches of nine
  (montages `C:\temp\ch18\m_678.png` … `m_750.png`) and the values are recorded in the
  official-answer table below.
- The only picture that carries data (not just an algebra step) is the 6-cup pyramid in
  SMART CORNER Q30 (`image51.png`): three rows of 1, 2 and 3 cups. It is described in words in the
  stem ("1 cup on the top row, 2 on the middle row and 3 on the bottom row") instead of shipping a
  figure, so `data/src/figures.json` has **no** `ch18-4` entries.
- The "Explain" speech bubble next to Q31(b) (`image24.png`) is decorative and is not transcribed.
- The textbook prints no section titles for 18.4; the site titles are descriptive.

## Sections

| Section | Site id | Source questions | Site marks |
|---|---|---|---|
| Class Exercise | CE1–CE4 | Class Exercise 18.4 | 14 |
| Section Check | SC | Section Check 18.4 (a)–(f) | 6 |
| Level 1 | 1–16 | Exercise 18.4 Level 1 Q1–Q16 | 48 |
| Level 2 | 17–28 | Exercise 18.4 Level 2 Q17–Q28 | 52 |
| SMART CORNER | 29–31 | Exercise 18.4 SMART CORNER Q29–Q31 | 20 |

Total: **36 questions, 140 marks** (the Section Check counts as one question with six parts).

* Unlike 18.2 and 18.3, this section is **complete**: the printed Level 1 (Q1–Q16), Level 2
  (Q17–Q28) and SMART CORNER (Q29–Q31) sets are all included, and so is Class Exercise 18.4.
  Nothing is omitted, so there is no "skipped questions" list.
* 18.4 has **no Cross Topics** section, so the site's part has five sections rather than six.
* The section drills the same two tools side by side — "drawn at the same time" (combinations) and
  "drawn one by one" (permutations or products) — plus the symmetry short cut, which is why the
  teaching cards lead with "probability = favourable count ÷ total count" and "symmetry saves the
  counting".

## Official Answers

| Question | Answer |
|---|---|
| CE1 | $\frac{6!}{8!}=\frac{1}{56}$ |
| CE2 | (a) $\frac{C^{10}_4}{C^{16}_4}=\frac{210}{1820}=\frac{3}{26}$; (b) $\frac{C^{10}_4+C^{10}_3C^6_1}{C^{16}_4}=\frac{93}{182}$ |
| CE3 | (a) $\frac{6!\times2}{8!}=\frac{1}{28}$; (b) $1-\frac{2\times7!}{8!}=\frac{3}{4}$ |
| CE4 | (a) $\frac{C^2_1C^4_1C^6_1}{C^{12}_3}=\frac{48}{220}=\frac{12}{55}$; (b) $1-\frac{C^2_2C^{10}_1}{C^{12}_3}=\frac{21}{22}$ |
| SC | Correct: (a), (c), (d), (f); incorrect: (b), (e) |
| L1-1 | (a) $4!=24$; (b) $\frac{1}{24}$ |
| L1-2 | $\frac{C^3_3}{C^6_3}=\frac{1}{20}$ |
| L1-3 | $\frac{1}{C^{10}_5}=\frac{1}{252}$ |
| L1-4 | (a) $\frac{C^2_2}{C^7_2}=\frac{1}{21}$; (b) $\frac{C^5_2}{C^7_2}=\frac{10}{21}$ |
| L1-5 | $\frac{1}{P^{10}_4}=\frac{1}{5040}$ |
| L1-6 | $\frac{6\times5\times4}{6^3}=\frac{5}{9}$ |
| L1-7 | (a) $P^9_5=15120$; (b) $\frac{P^7_3}{P^9_5}=\frac{1}{72}$ |
| L1-8 | (a) $\frac{4!}{P^{26}_4}=\frac{1}{14950}$; (b) $\frac{1}{P^{26}_4}=\frac{1}{358800}$ |
| L1-9 | $\frac{7!}{8!}=\frac{1}{8}$ |
| L1-10 | (a) $\frac{5!}{7!}=\frac{1}{42}$; (b) $\frac{1}{7}$ |
| L1-11 | (a) $\frac{C^6_3}{C^{10}_3}=\frac{1}{6}$; (b) $\frac{C^6_3+C^4_3}{C^{10}_3}=\frac{1}{5}$ |
| L1-12 | (a) $\frac{C^8_2C^7_2}{C^{15}_4}=\frac{28}{65}$; (b) $\frac{C^8_1C^7_3}{C^{15}_4}=\frac{8}{39}$ |
| L1-13 | (a) $\frac{C^4_4C^9_1}{C^{13}_5}=\frac{1}{143}$; (b) $\frac{C^4_3C^9_2}{C^{13}_5}=\frac{16}{143}$; (c) $\frac{9+144}{1287}=\frac{17}{143}$ |
| L1-14 | (a) $\frac{C^{14}_3}{C^{16}_3}=\frac{13}{20}$; (b) $1-\frac{13}{20}=\frac{7}{20}$ |
| L1-15 | (a) $\frac{C^{22}_4}{C^{24}_4}=\frac{95}{138}$; (b) $\frac{C^{22}_4+C^2_1C^{22}_3}{C^{24}_4}=\frac{45}{46}$ |
| L1-16 | (a) $\frac{C^7_3}{C^{11}_3}=\frac{7}{33}$; (b) $\frac{C^4_1C^5_1C^2_1}{C^{11}_3}=\frac{8}{33}$ |
| L2-17 | (a) $\frac{C^9_4\times4!}{9^4}=\frac{112}{243}$; (b) $1-\frac{112}{243}=\frac{131}{243}$ |
| L2-18 | (a) $\frac{3!\times6!}{9!}=\frac{1}{84}$; (b) $\frac{3!\times6!\times2}{9!}=\frac{1}{42}$ |
| L2-19 | (a) $\frac{P^4_2\times6!}{8!}=\frac{3}{14}$; (b) $\frac{4!\times4!\times2}{8!}=\frac{1}{35}$ |
| L2-20 | (a) $\frac{3!\times5!}{7!}=\frac{1}{7}$; (b) $\frac{5!\times P^6_2}{7!}=\frac{5}{7}$ |
| L2-21 | (a) $\frac{P^6_4+P^2_1\times P^5_3}{P^7_5}=\frac{4}{21}$; (b) $\frac{P^5_3+P^2_1\times P^5_3}{P^7_5}=\frac{1}{14}$ |
| L2-22 | (a) $\frac{C^5_3C^{10}_1}{C^{15}_4}=\frac{20}{273}$; (b) $\frac{C^5_4+C^5_3C^{10}_1}{C^{15}_4}=\frac{1}{13}$ |
| L2-23 | (a) $\frac{C^3_3C^{14}_2}{C^{17}_5}=\frac{1}{68}$; (b) $\frac{C^3_2C^{14}_3}{C^{17}_5}=\frac{3}{17}$; (c) $1-\frac{1}{68}-\frac{3}{17}=\frac{55}{68}$ |
| L2-24 | (a) $\frac{4\times C^4_3}{C^{16}_3}=\frac{1}{35}$; (b) $1-\frac{1}{35}=\frac{34}{35}$ |
| L2-25 | (a)(i) $\frac{C^{16}_3C^{14}_2}{C^{30}_5}=\frac{280}{783}$; (a)(ii) $1-\frac{C^{16}_5}{C^{30}_5}=\frac{253}{261}$; (b) $\frac{280}{783}\div\frac{253}{261}=\frac{280}{759}$ |
| L2-26 | (a) $\frac{10!\times P^{11}_4}{14!}=\frac{30}{91}$; (b) $\frac{4!\times3!\times7!\times3!}{14!}=\frac{1}{20020}$ |
| L2-27 | (a) $\frac{C^6_5\times2^5}{C^{12}_5}=\frac{8}{33}$; (b) $1-\frac{8}{33}=\frac{25}{33}$ |
| L2-28 | (a) $\frac{C^8_6\times2^6}{C^{16}_6}=\frac{32}{143}$; (b) $\frac{C^8_1C^7_4\times2^4}{C^{16}_6}=\frac{80}{143}$; (c) $1-\frac{32}{143}-\frac{80}{143}=\frac{31}{143}$ |
| SM-29 | (a) $\frac{8!\times2!\times6!}{14!}=\frac{2}{3003}$; (b) $\frac{8!\times3!\times P^4_4}{14!}=\frac{1}{15015}$ |
| SM-30 | (a) $P^9_6=60480$; (b)(i) $\frac{3!\times3^3\times P^6_3}{P^9_6}=\frac{9}{28}$; (b)(ii) $\frac{3!\times P^3_1\times P^3_2\times3!}{P^9_6}=\frac{3}{280}$ |
| SM-31 | (a)(i) $\left(\frac{1}{2}\right)^n=\frac{1}{2^n}$; (a)(ii) $C^n_{n-1}\left(\frac{1}{2}\right)^{n-1}\left(\frac{1}{2}\right)=\frac{n}{2^n}$; (b) agreed, $C^n_1\left(\frac{1}{2}\right)^n=\frac{n}{2^n}=C^n_{n-1}\left(\frac{1}{2}\right)^n$ |

## Verification notes (points that are easy to get wrong)

- **SC (b)** the printed $\frac{C^4_2}{C^8_2}=\frac{3}{14}$ counts only "both even". An even product
  also comes from one odd and one even: $\frac{C^4_1C^4_1+C^4_2}{C^8_2}=\frac{22}{28}=\frac{11}{14}$.
- **SC (e)** the printed $\frac{P^4_2}{6!}$ places the two odd digits but forgets the middle four
  positions, which can be filled in $4!$ ways: the answer is $\frac{P^4_2\times4!}{6!}=\frac{2}{5}$.
- **L1-13** all three parts share the denominator $C^{13}_5=1287$, so the step that computes it is a
  shared set-up step and carries **no** marking code; the marks sit on the three answers
  ((a) 1A, (b) 1A, (c) 1M + 1A). Marking the shared denominator as well would make the step marks
  add to 5 against a 4-mark question.
- **L1-16** "blue or black" merges the two colours into one group of 7 ($C^7_3$); it is *not* the
  sum of "all blue" and "all black". Part (b) is the "one of each colour" type: $4\times5\times2$.
- **L2-19(b)** with 4 boys and 4 girls, "no two of the same sex adjacent" forces alternation and
  there are **two** patterns (B G B G … and G B G B …), hence the factor 2.
- **L2-21(a)** "less than 35 000" is not "leading digit 1 or 3": when the leading digit is 3 the
  second digit must be below 5, i.e. 1 or 4.
- **L2-25(b)** the event (a)(i) already implies "at least one girl", so $A\cap B=A$ and the
  conditional probability is (a)(i) ÷ (a)(ii) $=\frac{280}{759}$, which is larger than the
  unconditional $\frac{280}{783}$ — a useful sanity check.
- **L2-26(a)** the four plastic chairs go into the $10+1=11$ gaps left by the other ten chairs;
  the gaps are distinguishable, so $P^{11}_4$, not $C^{11}_4$.
- **L2-28(b)** after the couple that is invited in full, the other four people come from the
  **remaining 7** couples, each contributing one person of two: $C^7_4\times2^4$.
- **SM-29** the lanterns are treated as distinct objects (as in the key), so the row has $14!$
  arrangements and the bundles keep their internal factorials.
- **SM-30(b)(ii)** the three rows need 1, 2 and 3 cups while every colour has exactly 3, so every
  colour-to-row assignment works; inside a row the cups are still arranged
  ($P^3_1\times P^3_2\times3!$ per assignment).
- **SM-31(b)** "exactly 1 head" and "exactly $n-1$ heads" are equal because $C^n_1=C^n_{n-1}$ and
  the denominator $2^n$ is the same; the explanation mark is for saying this, not for "yes".

## Build notes (rules enforced by `tools/build.py`)

- **Rule S5** requires every `steps[].zh` to have at least 8 Chinese characters. Two closing
  "evaluate the fraction" steps tripped over this (L2 Q23(c) and L2 Q25(b)) and were rewritten so
  that they spell out the cancelling and the check.
- **Rule S2** requires `parts[].marks` and `steps[].marking` to sum to the same total. Where a part
  is worth 1 mark but needed two explanatory steps, the steps were merged into one `(1A)` rather
  than inflating the question's marks; where a 3-mark part had only a method and an answer, the
  counting step was split out to carry its own mark (L2 Q19(b), Q23(b), Q23(c)).
- **No Markdown.** Rule S6 rejects the literal `**` anywhere in a text field; the front end has no
  Markdown. Three fields had to be rewritten with 「」 quotes instead.
- **`math` fields carry no `$`.** They are pure LaTeX for KaTeX (`highlight` entries too).
- **No angles, no radians** in this section, so rule S7 never triggers.
- Every expression was rendered with real KaTeX (`throwOnError`) — 1029 expressions over the whole
  file, 0 errors; `tools/smoke_test.js` additionally renders all 36 question pages.

## Marks

Book-exercise questions carry no official marks. Teacher-set marks, with each question's
`parts[].marks` and each step's `(1M)`/`(1A)` summing to the same total (enforced by
`tools/build.py`):

Class Exercise 14 · Section Check 6 · Level 1 48 · Level 2 52 · SMART CORNER 20
→ **140 marks over 36 questions**.

Level 2 is slightly dearer per question than Level 1 (52 marks over 12 questions against 48 over
16) because every Level 2 part needs a counted set-up before the fraction can be formed. The
"complement of the previous part" answers are the exception and are worth 1 mark each — L2 Q17(b),
Q22(b), Q24(b), Q27(b) and Q28(c) follow the same pattern as the Level 1 questions.
