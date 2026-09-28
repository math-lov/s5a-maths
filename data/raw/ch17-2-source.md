# Chapter 17.2 Permutations · 來源原文與核實記錄

> 這份檔案是**草稿層**（禁止手改題目資料；要改題目／題解請改 `data/src/ch17-2.json`）。
> 作用：保留課本原文與解答的文字，將來核對、擴充或重做時可以追溯。

## 1. 來源

| 檔案 | 說明 |
|---|---|
| `C:\Code Buddy\s5a-maths\source\SMS_bkexe_5B17_e.docx` | 課本習題（Book 5B Chapter 17，含 Class Exercise 17.2 與 Exercise 17.2） |
| `C:\Code Buddy\s5a-maths\source\SMS_sol_5B17_e.docx` | 課本解答（數式以 MathType／WMF 圖片顯示） |

抽取方法（工具見 `tools/doc-extract/`）：

1. `.docx` 直接開 `word/document.xml`，逐段抽 `w:t`／`m:t` 文字。
2. 數式是 **MathType OLE 物件**（`v:imagedata r:id` 指向 WMF）：以 VML `r:id` 掃出每段引用的圖片，
   `HKDSE/tools/wmf_to_png.py` 轉成 PNG 後逐幅讀圖。已確認排列符號為 **$P^n_r$**（例 `8P4`），
   方塊題用 $n!$、重複排列用 $n^r$。
3. 「Class Exercise 17.2」＝課本頁 17.26；「Exercise 17.2」＝課本頁 17.27。

## 2. Class Exercise 17.2（課本頁 17.26）

1. Isabel prepares 8 different stickers for a group of children. If each child gets one sticker,
   find the number of ways of distributing the stickers to (a) 4 children, (b) 5 children.
2. In how many ways can 6 different handbags be arranged in a row if (a) there are no restrictions?
   (b) a particular handbag is placed on the leftmost?
3. Find the number of ways of rearranging the letters in the word 'EDUCATION' if
   (a) the first letter is a vowel, (b) the vowels are next to each other.
4. In a wedding party, 5 groomsmen and 5 bridesmaids are arranged in a row to take a photo.
   Find the number of arrangements if (a) there are no restrictions,
   (b) all the groomsmen stand on the left and all the bridesmaids stand on the right,
   (c) the groomsmen and the bridesmaids stand alternately.

## 3. Exercise 17.2（課本頁 17.27）

### Section Check（判斷對錯）

Determine whether each of the following is correct. Put a tick in the box if it is correct and a cross if it is not.

- (a) The number of permutations of $n$ distinct objects is $n!$.
- (b) For any positive integer $n$, we have $P^n_n = n!$.
- (c) The number of ways to distribute 9 different gifts to 9 children is $9^2$.
- (d) There are 7 different coins. The number of ways of selecting 3 coins to arrange in a row is $P^7_3$.
- (e) 4 couples are arranged to sit in a row. If all men sit together and all women sit together,
  the number of arrangements is $4! \times 4! = 576$.
- (f) The number of ways to arrange 8 students in a row and the number of ways to arrange them
  in 2 rows of 4 are different.
- (g) The number of permutations of 6 distinct objects is the same as the number of permutations
  of selecting 5 objects from 6 distinct objects.

### Level 1

1. In how many ways can 4 different pots of plants be arranged in a row?
2. In a concert, 8 children are going to play solo piano pieces. Find the number of ways to arrange their order of performances.
3. A food delivery rider is delivering meals to 6 different places. Find the number of ways to arrange the order of delivery.
4. In how many ways can 2 cars be parked in 9 parking spaces of a car park?
5. In a committee of 10 members, find the number of ways to select 4 members to be the chairperson,
   the vice chairperson, the treasurer and the secretary.
6. In a violin competition, there are 12 participants. In how many ways can 3 of them be selected
   and awarded the gold, silver and bronze medals?
7. There are 8 characters in a role-playing game. In the game, each player must select a character
   without repetition. Find the number of arrangements of the roles if there are (a) 6 players, (b) 7 players.
8. The editor of a magazine is selecting $n$ photos of an artist to be included in an article.
   There are 11 different photos of the artist. In how many ways can the editor select the photos
   and arrange them in order if (a) $n = 4$? (b) $n = 5$?
9. A teacher is making a seating plan for a class of $n$ students. Find the number of ways to select
   5 students and arrange them in a column if (a) $n = 20$, (b) $n = 25$.
10. How many 3-digit numbers can be formed using the digits 2, 3, 5, 6, 8 and 9
    (a) without repetition of numbers? (b) if repetition of numbers is allowed?
11. There are 5 cards marked with the letters 'M', 'A', 'T', 'H' and 'S' respectively.
    (a) Find the number of ways to arrange the cards in a row.
    (b) Gigi draws 4 cards from the 5 cards at random. (i) In how many ways can she draw the 4 cards
    at the same time and arrange them in a row? (ii) In how many ways can she draw the 4 cards
    one by one with replacement?
12. A tutor prepared 4 different gifts to be given to 8 students. In how many ways can the tutor give
    the gifts to the students if (a) 1 gift is given to 1 student? (b) 1 particular gift is to be given
    to 1 particular student?
13. Tyler is selecting 5 toys from 10 different toys to arrange in a row in a showcase.
    Find the number of arrangements if (a) a particular toy must not be included in the showcase,
    (b) a particular toy must be included in the showcase.

### Level 2

14. There are 30 different pieces of artworks created by a class of students. The Art teacher wants to
    select 6 pieces of artworks to be posted in a row on a display board. Find the number of arrangements
    if 2 particular pieces must be selected and displayed in the middle.
15. In an ice-skating competition, there are 10 contestants, including Cassy and Debby. In how many ways
    can the order of performances be arranged if (a) Cassy is the first one to perform and Debby is the
    second to perform? (b) Cassy performs right before Debby?
16. In a room, there are 9 chairs. In how many ways can 5 children be seated if
    (a) there is an empty chair between any two adjacent children? (b) they sit in consecutive chairs?
17. In a party, there are 8 men and 8 ladies. In how many ways can (a) all men be paired with all ladies
    to dance with each other? (b) 3 men be selected and paired with 3 ladies to dance with each other?
18. The product code in a shop consists of 2 letters followed by 6 digits. The first 2 letters are chosen
    from the 4 letters 'A', 'B', 'C' and 'D' without repetition, and the last 6 digits are formed by a
    permutation of 1, 2, 3, 4, 5 and 6. How many different product codes can be formed?
19. The organizing team of a summer camp prepared 5 different games to be played in the morning, and
    10 different games to be played in the afternoon. Due to time constraints, only 2 games and 4 games
    can be played in the morning and in the afternoon respectively. (a) Find the number of arrangements
    of the order of the games. (b) If a particular game must be selected as the first game to be played
    in the morning and a particular game must be selected as the last game to be played in the afternoon,
    find the number of arrangements of the order of the games.
20. Helen sets a 6-digit password for her bank card using the numbers 0 to 9 inclusive without repetition.
    How many different passwords can be set if (a) the first digit is '3'? (b) the first and the last
    digit are odd numbers?
21. A 4-digit number is formed using the digits 0, 1, 3, 5, 8 and 9 without repetition. How many
    4-digit numbers can be formed if (a) there are no restrictions? (b) the number is even?
    (c) the number is not smaller than 8000?
22. Amy, Ben and 3 other friends stand in a row to take a photo. How many different arrangements are
    there if (a) there are no restrictions? (b) Amy and Ben stand next to each other?
    (c) Amy and Ben do not stand next to each other?
23. In a pet shop, 2 grey rabbits and 5 white rabbits are arranged in a row. Find the number of
    arrangements if (a) the white rabbits are on the left and the grey rabbits are on the right,
    (b) rabbits of the same colour are arranged next to each other, (c) no grey rabbits are next to each other?
24. In each of the following cases, find the number of ways to arrange the given numbers of boys and
    girls to stand in a row such that the boys and girls are standing alternately.
    (a) 3 boys and 4 girls (b) 4 boys and 3 girls (c) 3 boys and 3 girls
25. Mary has 6 different fictions and 8 different magazines. She wants to choose 3 fictions and
    4 magazines to be put in a row on a bookshelf. Find the number of arrangements if (a) the 3 fictions
    are put on the left and the 4 magazines are put on the right, (b) the books of the same type are put
    next to each other.
26. Cherry wants to arrange 5 red gems and 3 yellow gems in a row in a showcase. All the gems are of
    different shapes. Find the number of arrangements if (a) all the red gems are next to each other,
    (b) no yellow gems are next to each other, (c) a red gem is placed at one end and a yellow gem is
    placed at the other end.
27. Jimmy has 4 different toy buses and 4 different toy taxis. (a) Find the number of ways to arrange
    these toy cars in a row. (b) Find the number of ways to arrange these toy cars in two rows of 4 if
    (i) all the toy taxis are arranged in the front row, (ii) all the toy taxis are arranged in the same row.
28. A boutique has 3 different red dresses, 5 different white dresses and 4 different black dresses.
    In how many ways can these dresses be arranged in a row on the shelf if (a) the dresses of the same
    colour are put next to each other? (b) no black dresses are put next to each other?

### SMART CORNER

29. In a dance competition, both the red team and the white team have 5 members. For each round of battle,
    the red team and the white team each assigns 1 member to battle with the other team without repetition.
    In how many ways can the two teams assign the battle order if (a) there are no restrictions?
    (b) the red team must assign 1 particular member and the white team must assign 1 particular member
    in the first round? (c) 2 particular members in the red team must not be assigned to battle in
    2 consecutive rounds?
30. There are $m$ boys and $n$ girls. The boys and girls are arranged in a row such that the boys and
    girls are standing alternately. Someone claims that there are two possible relationships between
    $m$ and $n$. Do you agree? Explain your answer.

### Cross Topics

31. A password consists of $n$ digits chosen from 0 to 9 inclusive, where $1 < n < 10$.
    (a) If $n = 4$, find the percentage of passwords with no repetition of digits.
    (b) Write down the possible values of $n$ such that the percentage of passwords with no repetition
    of digits is less than 50%.

## 4. 官方解答（課本答案，逐題）

| 題 | 課本答案 |
|---|---|
| CE1 | (a) $P^8_4 = 1680$；(b) $P^8_5 = 6720$ |
| CE2 | (a) $6! = 720$；(b) $5! = 120$ |
| CE3 | (a) $5 \times 8! = 201600$；(b) $5! \times 5! = 14400$ |
| CE4 | (a) $10! = 3628800$；(b) $5! \times 5! = 14400$；(c) $5! \times 5! \times 2 = 28800$ |
| SC(a) | 正確（定義） |
| SC(b) | 正確（$P^n_n = n!$） |
| SC(c) | 錯誤（應為 $9!$） |
| SC(d) | 正確（$P^7_3$） |
| SC(e) | 錯誤（應為 $4! \times 4! \times 2 = 1152$） |
| SC(f) | 錯誤（兩者同為 $8!$） |
| SC(g) | 正確（同為 $720$） |
| L1-1 | $4! = 24$ |
| L1-2 | $8! = 40320$ |
| L1-3 | $6! = 720$ |
| L1-4 | $P^9_2 = 72$ |
| L1-5 | $P^{10}_4 = 5040$ |
| L1-6 | $P^{12}_3 = 1320$ |
| L1-7 | (a) $P^8_6 = 20160$；(b) $P^8_7 = 40320$ |
| L1-8 | (a) $P^{11}_4 = 7920$；(b) $P^{11}_5 = 55440$ |
| L1-9 | (a) $P^{20}_5 = 1860480$；(b) $P^{25}_5 = 6375600$ |
| L1-10 | (a) $P^6_3 = 120$；(b) $6^3 = 216$ |
| L1-11 | (a) $5! = 120$；(b)(i) $P^5_4 = 120$；(ii) $5^4 = 625$ |
| L1-12 | (a) $P^8_4 = 1680$；(b) $P^7_3 = 210$ |
| L1-13 | (a) $P^9_5 = 15120$；(b) $5 \times P^9_4 = 15120$ |
| L2-14 | $2! \times P^{28}_4 = 982800$ |
| L2-15 | (a) $8! = 40320$；(b) $9! = 362880$ |
| L2-16 | (a) $5! = 120$；(b) $5 \times 5! = 600$ |
| L2-17 | (a) $8! = 40320$；(b) $P^8_3 \times P^8_3 = 112896$ |
| L2-18 | $P^4_2 \times 6! = 8640$ |
| L2-19 | (a) $P^5_2 \times P^{10}_4 = 100800$；(b) $4 \times P^9_3 = 2016$ |
| L2-20 | (a) $P^9_5 = 15120$；(b) $5 \times 4 \times P^8_4 = 33600$ |
| L2-21 | (a) $300$；(b) $108$；(c) $120$ |
| L2-22 | (a) $120$；(b) $4! \times 2! = 48$；(c) $120 - 48 = 72$ |
| L2-23 | (a) $5! \times 2! = 240$；(b) $5! \times 2! \times 2 = 480$；(c) $3600$ |
| L2-24 | (a) $3! \times 4! = 144$；(b) $4! \times 3! = 144$；(c) $3! \times 3! \times 2 = 72$ |
| L2-25 | (a) $P^6_3 \times P^8_4 = 201600$；(b) $\times 2 = 403200$ |
| L2-26 | (a) $4! \times 5! = 2880$；(b) $14400$；(c) $21600$ |
| L2-27 | (a) $8! = 40320$；(b)(i) $4! \times 4! = 576$；(ii) $1152$ |
| L2-28 | (a) $3! \times 5! \times 4! \times 3! = 103680$；(b) $121927680$ |
| SM-29 | (a) $5! \times 5! = 14400$；(b) $4! \times 4! = 576$；(c) $(5! - 4! \times 2!) \times 5! = 8640$ |
| SM-30 | 不同意；$m$ 與 $n$ 有三種可能關係：$m = n$、$m - n = 1$、$n - m = 1$ |
| CT-31 | (a) $50.4\%$；(b) $n = 5, 6, 7, 8, 9$ |

## 5. 答案核實（逐題獨立重算）

| 題 | 驗算 |
|---|---|
| CE1 | $P^8_4 = 8 \times 7 \times 6 \times 5 = 1680$；$P^8_5 = 1680 \times 4 = 6720$ |
| CE3 | EDUCATION 有 9 個字母（5 母音 E,U,A,I,O；4 子音 D,C,T,N）。(a) 首字母 5 選 1，其餘 $8!$；(b) 5 個母音綁成一塊，與 4 子音共 5 件，$5! \times 5!$ |
| CE4 | (c) 男女交替：可「男先」或「女先」，$5! \times 5! \times 2$ |
| SC(b) | $P^n_n = n!$，正確 |
| SC(f) | 排成 2 行各 4 人仍只是 8 個位置的排列，同為 $8! = 40320$ |
| L1-4 | 9 個車位泊 2 車，$9 \times 8 = 72$ |
| L1-13 | (a) 排除某件：$P^9_5 = 15120$；(b) 必須包含某件：先放該件（5 個位置）再從 9 件選 4 件排餘下 4 位，$5 \times P^9_4 = 5 \times 3024 = 15120$ |
| L2-16(a) | 5 童之間最少 4 個空位，共需 $5 + 4 = 9$ 張椅，恰好用盡；只有 $5!$ 種坐法 |
| L2-16(b) | 連續 5 張椅有 $9 - 5 + 1 = 5$ 種位置，$5 \times 5! = 600$ |
| L2-21(b) | 個位為 0：$5 \times 4 \times 3 = 60$；個位為 8：首位 $4$ 選 1（不可為 0、8）再 $4 \times 3$，$48$；共 $108$ |
| L2-23(c) | 先排 5 白兔（$5!$），6 個空隙選 2 個放灰兔並排列（$C^6_2 \times 2! = 30$），$120 \times 30 = 3600$ |
| L2-26(c) | 兩端一紅一黃：$2 \times 5 \times 3 \times 6! = 21600$ |
| L2-28(b) | 先排 3 紅 5 白（$8!$），9 個空隙選 4 個放黑裙並排列（$C^9_4 \times 4! = 3024$），$40320 \times 3024 = 121927680$ |
| SM-29(c) | 紅隊 5 人全排列 $5!$；其中某 2 人相鄰（連續兩輪出戰）的排法 $4! \times 2!$；故紅隊合法次序 $5! - 4! \times 2! = 72$，再配白隊 $5!$ |
| CT-31(a) | $\dfrac{10 \times 9 \times 8 \times 7}{10^4} = \dfrac{5040}{10000} = 50.4\%$ |

> 所有數值與課本解答一致。本站題解用課本符號 $P^n_r$，並補上逐步推導、
> 常見錯誤與「帶得走的技巧」；分數與 (1M)/(1A) 為老師自擬（課本練習本無評分）。
