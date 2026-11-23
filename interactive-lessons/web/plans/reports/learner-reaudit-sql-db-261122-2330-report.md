# Learner re-audit: SQL course and DB lessons (2026-11-22, 23:30)

Fresh read of the current `src/data/lessons/*.ts` (prose, traps, predicts, quizzes, boards; widget internals not run). Compared with `learner-audit-261122-1624-sql-db-report.md`. Scores are strict: 5 = no learner would stumble.

## 1. Summary

| Lesson | Old | New | Worst remaining section | Verdict |
|---|---|---|---|---|
| sql-foundation | 4 | 4.5 | fk-on-delete | fixed |
| sql-erd | 3 | 4.5 | cardinality | fixed |
| sql-select | 4 | 4.5 | execution-order | fixed |
| sql-filter | 4 | 4.5 | order-by | fixed |
| sql-aggregate | 4 | 4.5 | sum-avg | fixed |
| sql-join | 4 | 4.5 | anti-join | fixed |
| sql-subquery | 4 | 4 | exists | improved |
| sql-set | 4 | 4 | set-rules | improved |
| sql-window | 4 | 4 | running-total | improved |
| sql-transform | 3 | 3.5 | case-when | improved |
| sql-dml | 4 | 4 | delete-truncate-drop | improved |
| sql-optimize | 3 | 3.5 | scan-types parts, func-index-safety, plan-cache | improved |
| sql-capstone | 3 | 4.5 | analysis (one wrong cross-ref) | fixed |
| index | 4 | 4 | heap-order, covering | improved |
| locking | 2 | 4 | mapping | improved |
| db-design | 4 | 4 | migration | improved |
| sql (Java track) | 3 | 4 | keyset-tiebreak | improved |

All old factual errors I re-checked are gone: RANK hint in capstone, DISTINCT + ORDER BY, `::bigint` rounding, RANGE default frame, LIMIT tie explanation, UNION money example, ON-vs-WHERE evidence placed before the rule, `NOT IN` 0/32/38 chain, DISTINCT ON in window, atomicity setup in db-design. Trap-after-exercise problem is largely resolved because each intro now states the rule.

## 2. Remaining issues per lesson

### sql-foundation
- **fk-on-delete**: uses `DEFERRABLE` and "transaction" (lesson 1, neither taught) and the `after` aside on JPA `cascade = REMOVE` / "persistence context" is a forward reference to unseen material. Fix: drop the DEFERRABLE clause, move the JPA aside to the Java JPA lesson or end it with "(học ở module JPA)".
- **null-value** trap: `WHERE` is glossed now, OK.

### sql-erd
- **cardinality**: second paragraph still packs "junction table, PK = both columns, account_holder, account and funds_transfer as full entities" in one block. Fix: split off "T24 có hai bảng đóng vai trò nối N-N" into its own short part or bullet.
- Rest OK (normalization split into 1NF/2NF/3NF parts with bad table, why, fix).

### sql-select
- **execution-order**: exercise uses `DESC`, only glossed in the `after` text (after the widget, before the exercise, so acceptable). The intro still says "(phần 3 học kỹ)" for alias in `after`, fine. Minor: `LIMIT` is "chạy sau cùng" but `ORDER BY` + `LIMIT` example for top N is only in part 6. OK overall; no change required.

### sql-filter
- **order-by**: the collation aside ("Đà Nẵng xếp sau cùng vì so theo mã ký tự") is an unprompted side topic. Fix: delete it or move to a one-line note; it distracts from NULL ordering.
- **limit-offset** intro paragraph 3 (large OFFSET, keyset) is out-of-scope noise but short. OK.

### sql-aggregate
- **sum-avg**: `ccy` and "tài khoản vay có số dư âm" are used with no gloss (`ccy` = loại tiền; first meets in foundation only as a column). Fix: one clause "(`ccy` là loại tiền)".
- **group-by** intro has four paragraphs (concept, numbers, widget, category_id aside). The category_id aside belongs in `group-rules`. Fix: move it.

### sql-join
- **anti-join**: three dense paragraphs (anti-join, ON vs WHERE evidence, rule plus combined case with 28). Fix: make the ON/WHERE evidence its own part (`parts`) so anti-join and the ON/WHERE rule are separate ideas.
- **multi-join** paragraph 3 lists many sums (765/104/63, five city counts) with no exercise; trim to one example.

### sql-subquery
- **exists**: four paragraphs and three ideas (EXISTS, NOT EXISTS 20 accounts, NOT IN NULL mechanism, two fixes 32 vs 38). Chain is now correct, but too long for one section. Fix: split "Bẫy NOT IN với NULL" into a part with the 0 / 32 / 38 table.
- **correlated**: four paragraphs (definition, per-branch average, widget, top-N-per-group). Fix: move top-N-per-group to a part or to `after`; it is a different idea from "correlated".
- **four-ways**: the JOIN bullet repeats the fan-out trap almost word for word. Fix: keep it in the trap only.

### sql-set
- **set-rules**: still five things (shape rules, error messages, parenthesised branches, ORDER BY name rule, label column). Fix: split "cột nhãn" and "ngoặc quanh nhánh" into a part.
- **union-practice** quiz ("cộng số tiền ghi nợ và ghi có của hai bảng") says "hai bảng" but the taught example is one table (`funds_transfer`). Fix: reword to "hai cột".

### sql-window
- **running-total**: three long paragraphs (running total, RANGE default and peers, ROWS contrast with numbers). Correct now, but two ideas. Fix: split "khung ROWS vs RANGE" into a part after the plain running total.
- **ranking** intro is one example paragraph; the three function definitions come only as short bullets. OK, but the predict (RANK of the two 0-balance accounts) needs the "bỏ hạng" rule, which is in those bullets. Verify the bullets render before the predict. They do (intro precedes predict).

### sql-transform
- **case-when**: the intro is four paragraphs and six ideas (searched CASE, order, no ELSE, simple CASE, GROUP BY alias note, `SUM(CASE)` counting). The alias note is now correct but belongs in the aggregate/`group by` context. Fix: split into "CASE cơ bản" and "CASE trong báo cáo" parts; move the alias-in-GROUP-BY remark to the second.
- **coalesce-nullif**: trap uses date subtraction (taught in part 5) and the intro uses `::text` (part 3). Pointers are given ("phần 5", "phần 3"), but exercise 3 still nests three functions. Fix: add one NULLIF-only exercise (show `division by zero`, then the fix) before the combined one.
- **cast-type**: rounding fixed. The `::bigint` and `::int` overflow bullet comes before the "làm tròn" note; reorder so the note follows the integer-division paragraph directly.

### sql-dml
- **delete-truncate-drop** part (inside Phần 3): uses `BEGIN; ... ROLLBACK` and "DDL tự commit" before transactions are taught (Phần 5). Fix: say "(ROLLBACK học ở Phần 5)" or move this part after Phần 5.
- **insert** intro: five paragraphs; "Cột NOT NULL không có mặc định" appears before `DEFAULT` is defined (it is defined in the last paragraph). Fix: reorder DEFAULT/identity paragraph before the "Hai lưu ý" paragraph and delete the repeated nháy đơn remark.
- **insert-upsert** part: the quiz asks about `SELECT ... FOR UPDATE` and "race", only glossed in one sentence each. Fix: one-line gloss of `FOR UPDATE` ("khoá các dòng đang có, học ở bài Locking") or drop the quiz.

### sql-optimize
- **scan-types** now has eight parts (order-index-match, esr-rule, join-methods, merge-join, merge-pointers, hash-spill, join-order and the base section). It is much better than one block, but the lesson is very long (116 KB) and part titles hide the sequence. Fix: group join-related parts under a "Phần 4b: Cách nối" divider or make join methods their own top-level section.
- **order-index-match** (first use of `Buffers`): "Buffers 320 / Buffers 7" appears with no definition (the definition is in the other Java-track `index` lesson). Fix: one sentence "Buffers = số page (8 KB) chạm tới, ít hơn là tốt" at the first use.
- **func-index-safety**: heavy (PL/pgSQL, VOLATILE, `citext`, `pg_trgm`) and says three results ran "trên PostgreSQL 18.3 cài sẵn trên máy chứ không chạy được trong ô SQL". A learner cannot reproduce them, and "Đã chạy trên máy" is unsupported from the page. Fix: cut to the IMMUTABLE rule plus `lower()` example (runnable), and demote citext/trigram to one sentence each marked "chưa chạy ở đây".
- **plan-cache**: ten paragraphs. Core idea (custom vs generic plan, rule of 5 runs) is fine, but the LIKE-with-parameter trap and `plan_cache_mode` are further ideas. Fix: split the LIKE bẫy into `index-not-used` or a trailing part.
- **join-order**: first person ("Tôi chưa dựng được ví dụ nhỏ nào...") is out of tone and says the setting is not useful. Fix: either cut the part or rewrite as "ví dụ nhỏ không cho thấy khác biệt".
- **index-write-cost**: bullets introduce MVCC, HOT, `fillfactor`, VACUUM in one part, with "đã chạy trên PostgreSQL 18.3 cài sẵn trên máy". Fix: define "heap/page/MVCC" in one clause each or reduce to "UPDATE chạm index nào".
- **composite-fk** trap says Postgres creates indexes only for the primary key; UNIQUE constraints also get one. Fix: "chỉ cho khoá chính và UNIQUE".

### sql-capstone
- **analysis**: paragraph 3 ends "là cầu nối sang phần 4" but this is already phần 4; the reconciliation is phần 5. Fix: "sang phần 5".
- **warm-up**: title says "khởi động, một hai bảng" yet the intro maps all ten exercises to lesson titles; fine, but the count is inconsistent ("mười bài toán, cộng một bài khởi động" in `approach`, "Bài 1..10" later). Fix: say "một bài khởi động rồi mười bài đánh số".
- Everything else OK (approach first, RANK hint corrected, UPDATE-with-subquery taught in the intro).

### index (Java track)
- **heap-order** part: six paragraphs (heap vs index order, random_page_cost, correlation, bitmap with `lossy`/`Recheck Cond`, measured table, planner choice). Fix: move `Recheck Cond`/lossy to a one-line aside and keep the random I/O chain.
- **covering**: two very dense paragraphs: visibility map, VACUUM, INCLUDE, clustered index, page split, heap. Fix: split into "covering index / Index Only Scan" and "clustered vs heap (InnoDB)" parts.
- **explain-buffers**: `Nested Loop` and `enable_hashjoin` appear before join algorithms are explained in this lesson (explained in sql-optimize). Fix: one-line gloss or pointer to "bài Index và Execution Plan".
- Many "Đã chạy trên PostgreSQL 18.3 cài sẵn trên máy" claims (buffers 4, 103, 108 vs 5) are plausible but unverifiable by the learner, and the header says PG 16. Fix: state the version once at the top of each part and say "số đo của tác giả, không chạy được trong trang".

### locking
- **mapping**: seven rules, each with a short why now, but `LAZY/EAGER`, `N+1`, `mappedBy` and `composition` appear with little or no gloss, and there is no entity code/timeline for the owner-side bug. Fix: add a 6-line `Order/OrderItem` snippet and one clause for N+1 ("1 câu lấy cha + N câu lấy con").
- **Scope**: the lesson is a grab-bag (lost update, batch, bulk, mapping, equals). Locks is now clear (three parts with code, SQL, why, retry, deadlock ordering, SKIP LOCKED). Fix: none required; consider splitting mapping/equals into their own lesson.
- **bulk**: 4-step trace added, `flushAutomatically` mentioned. OK.

### db-design
- **migration**: one section covers Flyway naming, rolling deploy, expand/contract, `NOT VALID`, `ACCESS EXCLUSIVE`. "pod" and "rolling deploy" are not defined. Fix: gloss pod ("một bản chạy của app") and split into "Flyway cơ bản" and "đổi schema không dừng hệ thống".
- **Ordering**: still the basic DB lesson with the most basic ideas; surrogate-key part and ACID repeat material from sql-erd / sql-dml (normalization, atomicity). Fix: add pointers ("bài 2", "bài 11") instead of re-explaining, or move earlier in the course.

### sql (Java track)
- **keyset-tiebreak**: seven paragraphs, including row-value, three equivalent forms, and a paragraph on SQL Server/Oracle/MySQL support ("tôi chưa chạy", ORA-01796 from a reference). Fix: keep the bug demo (id 6 disappears) and the `(created_at, id)` fix, cut the engine survey to one sentence.
- **hikari**: terms are glossed with lesson pointers now. The last paragraph (200 req/s ceiling, ThreadPoolExecutor pointer) is a second idea. Fix: split or trim.
- Others OK (dept/employee data shown before results, fan-out example, DISTINCT ON in context).

## 3. Top 5 remaining fixes

1. **sql-optimize**: trim and regroup. Define `Buffers` at first use, cut or flag unreproducible "chạy trên máy" claims in func-index-safety and index-write-cost, split plan-cache, and give join algorithms their own section (lesson is still the densest in the course).
2. **sql-transform case-when**: split into "CASE cơ bản" and "CASE trong báo cáo"; add a NULLIF-only exercise before the nested one in coalesce-nullif.
3. **sql-subquery exists and correlated**: split the NOT IN / 0-32-38 chain into its own part and move top-N-per-group out of correlated.
4. **sql-dml delete-truncate-drop / insert**: remove the ROLLBACK / DDL-autocommit dependency before transactions are taught, reorder DEFAULT before its first use.
5. **index (Java track) covering and heap-order, locking mapping**: split the covering paragraph, shorten heap-order, and add code plus N+1 gloss to the mapping rules.

(Trivial one-liners worth batching: capstone "sang phần 4" typo to "phần 5", sql-join/sql-set duplicate-with-trap paragraphs, composite-fk "chỉ khoá chính" nuance.)
