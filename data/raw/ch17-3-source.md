# Chapter 17.3 Combinations · Source and Verification Notes

> Transcribed from `source/SMS_bkexe_5B17_e.docx` and checked against `source/SMS_sol_5B17_e.docx`.
> The DOCX files are local-only; student-facing stems and explanations are maintained in `data/src/ch17-3.json`.

## Sections

| Section | Questions |
|---|---:|
| Class Exercise 17.3 | 1–4 |
| Section Check | (a)–(f) |
| Level 1 | 1–15 |
| Level 2 | 16–27 |
| SMART CORNER | 28–29 |
| Cross Topics | 30 |

## Official Answers

| Question | Answer |
|---|---|
| CE1 | (a) $C^{18}_8=43758$; (b) $C^{18}_{10}=43758$ |
| CE2 | (a) $C^8_2C^{15}_4=38220$; (b) $C^8_3C^{15}_2=5880$ |
| CE3 | (a) $C^{14}_6=3003$; (b) $C^{14}_6+C^{12}_6=3927$; (c) $C^{26}_6-C^{14}_6-C^{12}_6=226303$ |
| CE4 | (a)(i) $C^{13}_4=715$; (ii) $C^{11}_2=55$; (b) $C^6_2C^7_2 4!=7560$ |
| SC | Correct: (a), (b), (e); incorrect: (c), (d), (f) |
| L1-1–6 | $21,56,15,28,20/84,792/924$ |
| L1-7–12 | $126/3024,2024/12144,45/21,177100/42504,70,376740/490314$ |
| L1-13–15 | $275,210672,6006/2730$ |
| L2-16 | (a) $167960$; (b)(i) $48620$; (ii) $1847560$ |
| L2-17–20 | $10/70,25/30,593775/179520/323340,65780/18012/47768$ |
| L2-21–24 | $95/874/913,141/1215,60/9/21,286/1144/8788/52$ |
| L2-25 | (a) $15$; (b) official answer $540$; see verification note below |
| L2-26–27 | $4/108/112,120/1920$ |
| SM-28 | (a) $16$; (b) $20$ |
| SM-29 | (a) $126$; (b) $60$ |
| CT-30 | (a) $n=20$; (b)(i) $162^\circ$; (ii) $1140$ |

## Independent Verification Note

For L2-25(b), the question asks for three pairs to visit **in order**. Choosing the first pair, then the second from the remaining four, and finally the last pair gives
$C^6_2 C^4_2 C^2_2=15\cdot6\cdot1=90$.
Equivalently, there are $6!/(2!)^3=90$ ordered schedules of three pairs. The printed solution multiplies this already ordered count by an additional $3!$, giving 540; that counts each schedule six times. The website therefore uses 90 and explains the discrepancy in the solution.

For SMART CORNER 29, the source diagram is represented as a 4-by-5 east/north grid with $R$ two steps east and three steps north of $P$. Thus there are $C^9_4=126$ paths from $P$ to $Q$, and $C^5_2C^4_2=60$ paths passing through $R$.