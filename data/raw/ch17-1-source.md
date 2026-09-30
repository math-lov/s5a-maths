# Chapter 17.1 Basic Counting Principles · Source and Verification Notes

> Transcribed from `source/SMS_bkexe_5B17_e.docx` and checked against `source/SMS_sol_5B17_e.docx`.
> The DOCX files are local-only; student-facing stems and explanations are maintained in `data/src/ch17-1.json`.
> Multiplication signs and superscripts are pictures in the DOCX, so the extracted text loses them
> (e.g. `5 3 8` means $5\times3\times8$, `10n` means $10^n$); they are restored below.

## Sections

| Section | Questions |
|---|---|
| Class Exercise 17.1 | 1–4 |
| Section Check | (a)–(d) |
| Level 1 | 1–14 |
| Level 2 | 15–28 |
| SMART CORNER | 29–31 |
| Cross Topics | 32 |

## Official Answers

| Question | Answer |
|---|---|
| CE1 | (a) $36+54=90$; (b) $36+54-15=75$ |
| CE2 | (a) $5+3+8=16$; (b) $5\times3\times8=120$ |
| CE3 | (a) $10^4=10000$; (b) $10\times9\times8\times7=5040$ |
| CE4 | $(5+7)\times9=108$ |
| SC | Correct: (a), (c); incorrect: (b), (d) |
| SC (b) | $5+2-1=6$ (10 同時係偶數同 5 的倍數，要減 1) |
| SC (d) | $10^n$，題目寫 $9^n$ 所以錯 |
| L1-1 | $16+10=26$ |
| L1-2 | $3+5+1=9$ |
| L1-3 | $9+22+18+6=55$ |
| L1-4 | $20+30-3=47$ |
| L1-5 | (a) $12+24=36$; (b) $36+5=41$ |
| L1-6 | $3+5-2=6$ |
| L1-7 | $20+25-15=30$ |
| L1-8 | $3\times9=27$ |
| L1-9 | $8\times11=88$ |
| L1-10 | $2\times4\times3=24$ |
| L1-11 | $8\times3\times5=120$ |
| L1-12 | (a) $12\times8=96$; (b) $12\times4\times8=384$ |
| L1-13 | $4^5=1024$ |
| L1-14 | $6^3=216$ |
| L2-15 | (a) $8+6+10+4=28$; (b) $28-2-1=25$ |
| L2-16 | (a) $x=40+30-60=10$; (b) $40-10=30$ |
| L2-17 | (a) $56-45=11$; (b) $150-(60+56-45)=79$ |
| L2-18 | (a) $4+4=8$; (b) $26+4-2=28$; (c) $13+12-3=22$ |
| L2-19 | (a) $28+30+32+30=120$; (b) $28\times30\times32\times30=806400$ |
| L2-20 | (a) $8+18+25=51$; (b) $18+20=38$; (c) $8+18+25+20=71$ |
| L2-21 | (a) $5^4=625$; (b) $5\times4\times3\times2=120$ |
| L2-22 | (a) $10^6=1000000$; (b) $5\times10^4\times5=250000$ |
| L2-23 | (a) $5\times5\times10^4=250000$; (b) 同意：$1000\times250=250000$，剛好夠 |
| L2-24 | (a) $52\times51=2652$; (b) $26\times25=650$; (c) $13\times13=169$; (d) $13\times13\times2=338$ |
| L2-25 | $20\times(8+12)=400$ |
| L2-26 | (a) $4\times3+2=14$; (b) $14\times5=70$ |
| L2-27 | (a) $(100+150)\times(30+50)=20000$; (b) $20000-150\times50=12500$ |
| L2-28 | (a) $(8+5+2)\times(4+6+8)=270$; (b) $8\times4+5\times6+2\times8=78$ |
| SM-29 | (a) $2^4=16$; (b) $2+2^2+2^3+2^4+2^5=62$ |
| SM-30 | $8\times4+8\times5+4\times5=92$ |
| SM-31 | (a) $5\times5\times4\times3=300$; (b) $300-48=252$; (c) $60+48=108$ |
| CT-32 | $2^n=1024=2^{10}$，$n=10$ |

## Independent Verification Notes

- **SM-29(b)** "at most 5" must include lengths 1–5: the textbook shorthand $2+2^2+\cdots+2^5$ is correct, but a student who uses $2^5-2$ or $2^6-2$ gets the wrong value; the website therefore writes the sum out in full.
- **SM-31(b) odd case**: units digit must be 5 (1 way), thousands digit cannot be 0 or 5 ({2,4,6,8}, 4 ways), then $4\times3$ for the middle two digits → $4\times4\times3\times1=48$. Even numbers are found by subtracting from 300 rather than by cases, which avoids double counting the units-0 case.
- **L2-23(b)**: number of ID numbers needed for 250 years is at most $1000\times250=250000$, and the supply is $5\times5\times10^4=250000$; the supply is exactly enough, so the claim is agreed (the official solution writes the two quantities then concludes "greater"; the website states "just enough" to avoid an incorrect strict inequality).
- **L2-27(b) at least one from zone A**: complement is both from zone B ($150\times50$); the official alternative solution splits into three cases and agrees at 12500.
- **L2-21(b)/SM-31**: repetition not allowed means the available digits shrink by one after each place — the "shrink by one" idea is the Level-1 core skill, so the teaching card makes it explicit.
