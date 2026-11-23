# Learner audit: SQL course and DB lessons (2026-11-22)

Scope: sql, sql-foundation, sql-erd, sql-select, sql-filter, sql-aggregate, sql-join, sql-transform, sql-subquery, sql-set, sql-window, sql-dml, sql-optimize, sql-capstone, index, locking, db-design. Sources read: lesson `.ts`, video `scenes.py`, study notes 03.06 / 03.07 / 05.08, luminhkhuong.dev (database pages). Counts in sql-foundation/erd/select/filter were re-run against `t24-bank.sql`.

## 0. Cross-cutting issues (affect many lessons)

- **Trap box renders after the exercises.** `App.tsx` renders intro → widget → SqlLab → after → **trap** → quiz. Many intros say "(xem khung bẫy)", and some traps hold the only explanation of an idea the exercises need (sql-dml `update`, `acid-transfer`; sql-optimize `index-cost`, `index-not-used`, `composite-fk`; sql-subquery `exists`; sql-join `anti-join`; sql-aggregate `group-rules`). Fix: move the needed facts into the intro, or render the trap before `sql` exercises.
- **Narration says "rỗng" / "giá trị rỗng" for NULL** in the foundation, select, filter, aggregate, join, transform, subquery and window videos. That contradicts the page ("NULL không phải ... chuỗi rỗng"). It is actively wrong in two places: filter `is-null` "Where mobile bằng rỗng lại ra không dòng nào" and transform `string-functions` "một mảnh rỗng làm cả chuỗi thành rỗng" (`'a'||''||'b'` = `ab`). Fix: say "NULL" for the value and "không dòng nào" for an empty result, and add this as a narration style rule.

## 1. Summary

| Lesson | Clarity (1-5) | Worst section | Video change |
|---|---|---|---|
| sql-foundation | 4 | null-value | minor (null-value, outro) |
| sql-erd | 3 | normalization | minor (cardinality) |
| sql-select | 4 | execution-order | minor (arithmetic, distinct) |
| sql-filter | 4 | in-between-like | minor (is-null, order-by, limit-offset) |
| sql-aggregate | 4 | group-rules | minor (sum-avg, count-basics, outro) |
| sql-join | 4 | fan-out | minor (join-types, fan-out, anti-join) |
| sql-transform | 3 | case-when | minor (date-functions, string-functions, coalesce-nullif) |
| sql-subquery | 4 | exists | minor (exists, outro) |
| sql-set | 4 | union-practice | minor (union-practice) |
| sql-window | 4 | running-total | minor (running-total, lag-lead) |
| sql-dml | 4 | update | minor (insert, transaction) |
| sql-optimize | 3 | index-cost | minor (hook, explain-plan) |
| sql-capstone | 3 | warm-up (plus factual error in analysis) | no |
| index | 4 | cost | minor (cost) |
| sql (Java track) | 3 | join | minor (join, hikari) |
| locking | 2 | locks | redo `locks` (split into 3-4 scenes); minor bulk, equals, outro |
| db-design | 4 | atomicity | n/a (no video) |

## 2. Per-lesson issues

### sql-foundation
- **null-value**: the trap uses `WHERE mobile = NULL` before WHERE is taught. The page counts `mobile` (6) but the video counts `email` (9), so the "same" trap shows two numbers. Fix: use one column in both, and add "(WHERE học ở bài Lọc)".
- **database-table ex. 2**: the starter uses `ORDER BY` with no explanation; the hint covers only LIMIT. Fix: one clause in the prompt.
- Other sections: OK (counts verified).

### sql-erd
- **normalization**: the same problem as the exception calibration case. 1NF/2NF/3NF share one paragraph, it relies on "phụ thuộc" without defining it, and "phụ thuộc qua một cột thường khác" (a transitive dependency) is never explained. Fix: define "A phụ thuộc B = biết B suy ra A", then give three blocks of bad table → why → fixed table.
- **cardinality**: a junction table is defined as "mỗi dòng là một cặp", PK = both columns, but the examples given are `account` and `funds_transfer`, which have their own single PK. Fix: one sentence saying these are full entities that also act as the junction, with their own id because a pair can repeat. Use `account_holder` as the clean example.
- **cardinality ex. 2**: labelled "Bản số N-N" but it shows only one direction (one sender → many receivers). Fix: add the reverse query (1000000055 receives from 6 senders).
- **cardinality trap**: says "vi phạm 1NF" before 1NF is defined. Fix: say "một ô chứa nhiều giá trị".
- **keys-schema**: "bảng phụ" in the 1-1 rule is undefined. Fix: show `customer` → `customer_kyc(customer_id PK FK)` inline.

### sql-select
- **execution-order**: uses alias `AS so_du` before the `alias` section ("phần sau sẽ học alias"). Fix: put `alias` first.
- **execution-order (factual)**: "ORDER BY by an unselected column works because the base table is still there" is false with DISTINCT. `SELECT DISTINCT city ... ORDER BY customer_id` errors (verified). Fix: add "trừ khi có DISTINCT" plus the reason (one output row can stand for many source rows).
- **execution-order trap**: teaches a WHERE-alias error before WHERE is taught. Fix: move it to sql-filter `where-basic`.
- **arithmetic**: `::numeric` is used with no explanation, and "NULL + 1 ra NULL" has no exercise. Fix: show `7::numeric / 2`, and add `SELECT NULL + 1`.

### sql-filter
- **in-between-like**: IN, BETWEEN, LIKE `%`/`_`, case sensitivity, ILIKE, reversed BETWEEN and timestamp range advice are packed into two paragraphs and a trap. The timestamp tip relies on a type never taught (every dataset column is `date`). Fix: split into "IN/BETWEEN" and "LIKE/ILIKE". Move the timestamp tip to sql-transform, or explain it ("'2024-03-31' là 00:00").
- **in-between-like**: `'NGO _N%'` needs the learner to count the space. Fix: spell it out letter by letter.
- **limit-offset (page and video)**: the stated reason "hai khoản 800 triệu bằng nhau" is wrong. Both 800M loans are in the top 3 anyway; the ambiguous rows are the two 400M loans fighting for third place (LD2400014/LD2400012, verified). Fix: name that tie.
- **and-or-not**: `DORMANT` is never glossed. Fix: "(ngủ đông: lâu không giao dịch)".

### sql-aggregate
- **group-rules**: the core rule (every non-aggregated SELECT column must be in GROUP BY) and its reason appear only in the trap, yet exercise 2 asks the learner to fix exactly that error. The intro covers side topics instead. Fix: open the intro with the rule, the "which category_id should the DB show?" reason, and the two fixes (add to GROUP BY / MIN-MAX).
- **sum-avg**: the trap uses `COALESCE(SUM(...),0)` without saying it is taught later. Fix: add "(COALESCE, học ở bài 7)".

### sql-join
- **fan-out**: fix (2) and exercise 2 replace `SUM(a.working_balance)` with `SUM(e.amount)`. That is correct only because of this dataset ("với dữ liệu này ... đúng bằng số dư"), so learners will generalise "sum the child column". Fix: state that it answers a different question. Teach the real fixes (don't join when you only need parent values; pre-aggregate the child, then join, with a forward pointer to CTE), and reframe exercise 2.
- **anti-join**: the ON-vs-WHERE rule is given as "Quy tắc nhớ". The evidence (40 vs 12 rows) and the reason (WHERE runs after the join; unmatched rows have NULL `status` and are dropped) are only in the trap and the quiz. Fix: put the demo and the reason before the rule, or split it into its own part.
- **self-cross**: "205 = 85 + 120, mỗi cặp hai lần" comes before any rows are shown. Fix: show the 3 rows for customer 100001 first.
- **Video join-types**: "ra đúng không" sounds like "right?". Fix: "ra số 0".

### sql-transform
- **case-when**: five paragraphs, about six ideas (searched/simple CASE, branch order, no-ELSE gives NULL, CASE as GROUP BY key, SUM(CASE), THEN type rule). Fix: split into "CASE basics" and "CASE in reports".
- **case-when**: says an alias works in GROUP BY "nhưng trong HAVING thì không". Under the logical order just taught (GROUP BY runs before SELECT), this looks contradictory and has to be memorised. Fix: say it is a PostgreSQL convenience, not standard SQL, and that repeating the expression is the portable form.
- **cast-type (factual)**: "`working_balance::bigint` (cắt phần lẻ `.00`)". PostgreSQL rounds numeric to integer (`3.5::int` = 4); it does not truncate, and this sits right after "integer division truncates". Fix: "làm tròn", plus a `3.7::int → 4` example.
- **coalesce-nullif**: uses date subtraction (part 5) and `::text` (part 3, called "bài sau") early. Exercise 3 nests ROUND/SUM(CASE)/NULLIF at once. Fix: add part pointers and a simpler NULLIF step first (show the division-by-zero error, then the fix).
- **Video date-functions**: "Thứ được đánh số, không là Chủ nhật" is heard as "Sunday not included". Fix: "Chủ nhật là số 0".

### sql-subquery
- **exists**: the title promises the NOT IN trap, but the mechanism (`x <> NULL` gives UNKNOWN) is only in the trap, and exercise 3 starts "Trap NOT IN" without it. The three counts never line up: page 38 vs 0, video "ba mươi hai" not on the page. Fix: an intro paragraph that expands `NOT IN (a, NULL)` to `x<>a AND x<>NULL`, then 0 / 32 (`IS NOT NULL`) / 38 (NOT EXISTS), and explain that 38 − 32 = customers whose own mobile is NULL.
- **correlated**: one paragraph mixes the widget, "phép nối bán phần" (undefined) and the top-N-per-group count trick (no reasoning). Fix: drop or define semi-join, and move top-N into its own block with "0 larger → rank 1, so `< 2` keeps top 2". Note that ties can return more rows.
- **derived-table**: "từ bản 16" vs the quiz's "PostgreSQL 18". Fix: state the runtime version once.
- **four-ways**: the trap repeats the intro. The `NOT IN (SELECT ft_id …)` distractor compares the wrong column. Fix: cut the repeat and fix the distractor.

### sql-set
- **union-practice**: the trap claims UNION "nuốt dòng ... tổng tiền thiếu", but its example only dedupes account ids (246 → 49, which is the correct answer). The money case the quiz asks about is never shown. Fix: show `sum(amount)` over UNION vs UNION ALL with different totals, and add "include ft_id if you must dedupe".
- **union-basics**: "JOIN ở bài trước" is wrong; the previous lesson is subquery. Fix: "bài 6".
- **set-rules**: five rules and the label trick in one block; "bọc nhánh trong ngoặc" has no example. Fix: group the rules, and add `(SELECT … LIMIT 3) UNION ALL (…)`.
- **set-vs-join**: the quiz numbers (15/18, 32/25) are only in the trap. Fix: move one sentence into the intro.
- **Gap**: set operations treat NULLs as equal (EXCEPT is NULL-safe, unlike NOT IN), a useful contrast with the previous lesson. Add one line in `except`.

### sql-window
- **running-total (factual)**: the page says the default frame with ORDER BY is "dòng đầu tới dòng hiện tại" and offers `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` as the explicit form. The real default is `RANGE ...`, which includes peers. That difference is exactly why the same-day trap (both rows show 54.000.000) happens, so the trap has to be memorised. Fix: state the RANGE default and peers, contrast with ROWS, and link the trap. The same applies to video beat 4.
- **ranking quiz**: "Ba tài khoản có số dư 500, 300, 300, 100" lists four values. Fix: "Bốn".
- **over-basics**: "(xem khung bẫy)" points to an idea (WHERE runs before window functions) that is in neither intro paragraph. Fix: one sentence in the intro.
- **top-n-where**: "DENSE_RANK để đồng hạng không làm lệch" is vague, and ex. 2's `ROW_NUMBER … ORDER BY working_balance DESC` has no tie-breaker right after the text says to add one. Fix: "N người → ROW_NUMBER, N mức → DENSE_RANK", and add `, account_id`.
- **Gap vs 03.07**: dedupe with `row_number() > 1` and `DISTINCT ON`. Add an `after` note.

### sql-dml
- **update**: "`SET interest_rate = interest_rate + 0.5` ... chạm đúng 12 khoản vay" has no WHERE, which contradicts the section's own point. The forgotten-WHERE demo (83 → 85) is only in the trap. Fix: show the full statement with `WHERE status = 'LIVE'`, and move the demo into the intro.
- **delete-returning ex. 2-3**: they ask the learner to add RETURNING "để nhìn các dòng vừa xoá", but SqlLab shows the `verify` SELECT, not the RETURNING rows. Fix: drop `verify` for these exercises, or reword them.
- **delete-returning**: `TRUNCATE` is undefined. Fix: one clause, or delete it.
- **insert**: "thêm một dòng vào cuối bảng" contradicts "tables have no order" (the video says the same). The trap introduces `GENERATED ALWAYS AS IDENTITY` and `DEFAULT` undefined. Fix: reword, and add one intro sentence on identity/DEFAULT.
- **constraint-errors**: five full error messages in two paragraphs. Fix: a table (constraint / trigger / message / fix).
- **acid-transfer**: the "insert funds_transfer before stmt_entry" FK-order rule is only in the trap. Fix: move it into the intro.
- **Video transaction**: "lệnh Roll back huỷ cả khối" implies a manual rollback. Fix: "PostgreSQL tự huỷ cả khối". Also "bảy mươi triệu" vs 70.666.000 on the page.

### sql-optimize
- **index-cost**: "mỗi index có hai chi phí" explains only storage; the write cost is only in the trap (the video has both). `pg_relation_size` / `pg_indexes_size` / `pg_indexes` are unexplained, and the output is in bytes while the text says kB. Fix: add the write-cost paragraph, one line per function, and the bytes → kB conversion.
- **explain-plan**: EXPLAIN ANALYZE appears only in the trap and its output is never shown (actual vs estimated rows, Rows Removed by Filter, Execution Time). This is the core of note 03.06 §2. Fix: an intro paragraph with a real output and how to read it.
- **scan-types**: three topics (scan types, Sort, join algorithms). Fix: give joins their own part.
- **scan-types (factual)**: an index on `entry_id` is said to remove the Sort for `ORDER BY booking_date, entry_id`. It does not; the exercise silently switches to `ORDER BY entry_id`. Fix: make both `ORDER BY entry_id`, or index `(booking_date, entry_id)`.
- **scan-types ex. 3**: calls stmt_entry the "bảng ngoài" because of FROM order, but the planner chooses the outer side. Fix: remove that label.
- **composite-fk**: "đặt cột lọc bằng = lên đầu" has no why. Fix: after an equality on col 1, col 2 is already sorted within that group, so a range/ORDER BY still uses the index. Add the `a = ? ORDER BY b` case from 03.06 §3.
- **index-not-used**: needed numbers are only in the trap. Move them into the intro.
- **Factual nuance**: "lọc riêng booking_date thì không dùng index" no longer always holds; PostgreSQL 18 has B-tree skip scan, and the course runs on PG 18. Add a caveat.
- **Gaps vs 03.06**: covering index / INCLUDE demo, rewriting `col::date =` as a range, `CREATE INDEX CONCURRENTLY`, stale statistics.
- **Video hook**: 567 → 8.30 vs 695 in exercise 1. Note that the video uses the widget's table.

### sql-capstone
- **analysis ex. 7 hint (factual, verified in source)**: "...cùng một hạng và **không để trống số thứ tự phía sau** là hàm RANK (khác DENSE_RANK ở chỗ nhảy hạng)" is backwards. RANK leaves gaps (1,1,3). Fix: "cùng hạng rồi nhảy hạng (1,1,3) là RANK".
- **reconcile-fix ex. 10**: needs `UPDATE account a SET col = (SELECT … WHERE s.account_id = a.account_id)`, which is taught nowhere. Fix: add it to sql-dml `update`, or teach it in this intro.
- **warm-up / approach**: the opening quiz and video start from "define the result grain first", but `approach` is the last section. The step count is inconsistent (roadmap "ba bước", intro six steps, card "Bốn bước"). The self-check maps exercises to lesson numbers the UI never shows. Fix: move `approach` first, use one step count, and use a table with lesson titles.
- **combine-tables**: the third paragraph repeats the trap and adds a distracting aside. The ex. 5 hint "nối nó với cột tài khoản có ghi nợ ngược lại: credit_account" is garbled. Fix: delete the aside, and write "c là tài khoản nhận: nối `f.credit_account`".
- **reconcile-fix trap**: argues LEFT JOIN catches accounts with no entries, but every account has entries. Fix: say the +2.5M test checks HAVING, and LEFT JOIN protects future accounts with no entries.

### index (Java track)
- **composite**: the quiz explanation uses "độ chọn lọc" (selectivity), which is only taught in `no-index`. Fix: define it here, or move the quiz.
- **explain**: scan types are listed but not told apart, and "đọc từ trong ra ngoài" comes with no sample plan. Fix: one line per scan type, and a 3-line plan with the inner node marked.
- **no-index**: six traps in one paragraph, and `text_pattern_ops` comes with no why. Fix: a list (pattern / why skipped / rewrite), and explain that under a non-C collation a plain btree can't serve prefix LIKE.
- **covering**: "visibility map", "heap" and "page split" are undefined. Fix: one clause each.
- **cost**: ACID is tacked onto the index-cost paragraph, and the quiz tests CAP vs ACID consistency, which is never taught. Fix: move ACID to db-design, or give it its own part with a CAP sentence. The video `cost` beat 4 needs the same change.

### sql (Java track: SQL Queries & Pagination)
- **join / group-by / window / classic**: the dept/employee data is never shown, yet results like "Khoa chưa có phòng", "IT có 4 người", "Sales ra 2800, 5000, 7200" appear. This is exactly the "result before the scenario" problem. Fix: open `join` with the two small base tables and refer back to them.
- **join**: an unrelated "dùng UNION ALL" line, and a fan-out quiz (3×2 = 6) that is never taught. Fix: drop the line, and add a fan-out sentence with a tiny example.
- **window**: the `DISTINCT ON` quiz is never taught, and "window chạy sau WHERE" needs a one-line reason. Fix: add both.
- **pagination**: the quiz relies on "deferred join", which is not taught (it is in note 03.07). Fix: one sentence.
- **hikari**: assumes `@Transactional`, `REQUIRES_NEW`, OSIV and N+1, all taught later in the JPA module, and it duplicates db-design pool sizing. Fix: gloss each term with a forward link, or move the section into db-design.

### locking
- **locks**: lost update, @Version, PESSIMISTIC_WRITE and atomic UPDATE share two paragraphs. They also bring two exception names, "for no key update", 1125 ms and deadlock ordering, all with no Java code and no timeline. Note 05.08 and the site use four sections with code and sequence diagrams. Fix: split into four parts (problem / optimistic / pessimistic / atomic). For each, show the read-modify-write code and the 100 → 70 → 50 race first, then the SQL each fix generates, the "same lock order means no wait cycle" why, and conflict handling (retry outside `@Transactional` or 409). Explain "for no key update" (a lighter lock that doesn't block FK checks) and the re-check after the lock wait that the opening quiz relies on. Redo the video `locks` scene as 3-4 scenes.
- **batch**: persistence context, flush/clear, nextval, COPY and allocationSize/INCREMENT BY are crammed together, and the timing remark is noise. Fix: explain 1000 / 50 = 20 nextval and what `clear()` frees, and drop the timing remark.
- **bulk**: "stock 9, version 1" is stated with no steps, and the quiz asks about `flushAutomatically`, which is never mentioned. Fix: a 4-step trace (load 10/v0 → bulk 0, version untouched → setStock(9) → `where version=0` matches, so 9/v1). Add a flushAutomatically line.
- **mapping**: seven rules in one sentence, none with a why, and "composition" is undefined. Fix: a rule / why list.
- **equals**: "hashCode trả hằng số `getClass().hashCode()`" sits next to a quiz saying equals must not use getClass(), which reads as a contradiction. Fix: explain that hashCode only needs to stay stable across persist, and that the equals issue is proxy subclass comparison. Explain why `contains` returns false (the object sits in the old bucket).
- **Video outro**: says "Bài tiếp: index và explain", but the next lesson is db-design. Also, the `locking.ts` comment "Video not rendered yet" is stale.
- **Gap**: `SKIP LOCKED` / `NOWAIT`. Add one line in the pessimistic part.

### db-design
- **atomicity**: the setup (`CHECK (bal <= 500)`, balances 100/0) appears only inside the results. The code transfers 60 but runs `bal + 600` to force the error, which reads as a typo. "Cả hai bước đúng" claims a COMMIT this code can't produce. Fix: show the table first, say plainly that 600 is a deliberate bug, and show the `+60` COMMIT version.
- **normalize**: 1NF/2NF/3NF are one-line rules to memorise; "phụ thuộc cả khoá chính" needs a composite key. Fix: one tiny example each, e.g. `order_items(order_id, product_id, product_name)` for 2NF.
- **pool**: "chạy song song được bằng số lõi" contradicts `lõi × 2 + số ổ đĩa` a few lines later. Fix: "khoảng số lõi, nhiều hơn khi query chờ I/O, vì thế có × 2 và số ổ đĩa".
- **Course order**: this is the most basic DB lesson (normalisation, constraints, what a transaction is), but it comes last, after index, sql, isolation and locking, which already use ACID and pooling. Fix: move it before `index`, and remove the duplicates from index `cost` and sql `hikari`.

## 3. Top 5 highest-impact fixes

1. **Stop hiding prerequisite content in trap boxes that render after the exercises.** Either change the render order in `App.tsx` (trap before `sql` exercises) or move the facts into intros. This fixes about 10 sections across dml, optimize, subquery, join, aggregate and window at once.
2. **Fix the three confident factual errors and the quiz typo.**
   - Capstone ex. 7 RANK/DENSE_RANK hint is reversed.
   - Window `running-total`: the default frame is RANGE with peers, not ROWS. This is also the missing "why" of its trap.
   - Transform `::bigint` rounds, it does not "cắt".
   - Select: ORDER BY on an unselected column fails with DISTINCT.
   - Window ranking quiz: "Ba" should be "Bốn".
   - Optimize: the `entry_id` index does not remove the Sort for `ORDER BY booking_date, entry_id`.
3. **Rewrite locking › locks** into four parts with Java code, generated SQL, the race timeline and a why for each fix, and redo its video scene. This is the only lesson scored 2.
4. **Narration-wide "rỗng" → "NULL"** in 8 SQL videos, starting with filter `is-null` and transform `string-functions`, where the wording is actually wrong.
5. **Show the data before the results, and define terms before using them.**
   - sql (Java track): show the dept/employee tables first.
   - db-design `atomicity`: show the setup first.
   - sql-erd `normalization`: define "phụ thuộc" and give bad → fixed examples.
   - sql-subquery `exists`: explain the NOT IN mechanism and reconcile 0/32/38.
