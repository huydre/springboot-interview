# Learner re-audit: I/O, runtime, concurrency, labs 1-3

Fresh read of the current `src/data/lessons/*.ts` (10 lessons), compared with `learner-audit-261122-1624-io-concurrency-report.md`. Read-only: no project file was edited. Widgets and videos were not opened; "board/widget text matches prose" was checked only through the text embedded in the lesson files.

## 1. Scores

| Lesson | Old | New | Worst remaining section | Verdict |
|---|---|---|---|---|
| java-io | 4 | 5 | serialization (long intro) | fixed |
| java-runtime | 3 | 4 | jit (claim "hàng chục lần"), course order | improved |
| thread | 3 | 4 | interrupt | improved |
| threadpool | 4 | 4 | why-pool (quiz ahead of content) | improved |
| completablefuture | 3 | 4 | errors | improved |
| sync | 3 | 4 | atomic | improved |
| deadlock | 3 | 4 | pinning (latch/barrier tacked on in `after`) | improved |
| lab-collections | 3 | 4 | mutable-key / checklist | improved |
| lab-concurrency | 4 | 4 | race (duplicates sync/atomic) | improved |
| lab-streams | 2 | 3 | medium | improved |

Calibration: nothing here is unclear in the old "result before scenario, undefined prerequisite" way any more. The old calibration problems (lab setup scenarios, `maxBy`/`collectingAndThen` direction, `synchronized` overload, `threadlocal` cause reversal, quizzes on untaught facts) are fixed. What remains is mostly density, a few forward-referencing quizzes, and some duplication.

## 2. Remaining issues per lesson

### java-io
OK. Minor only: `serialization` intro is 7 paragraphs (3 bullets, then two "Vì sao" paragraphs). Acceptable because the board and compare card repeat it cleanly. Optional fix: move the gadget-chain paragraph into the compare card's second `ask`.

### java-runtime
- **jit, compare "Mặc định (có JIT)" footer**: "nhanh hơn hàng chục lần so với thông dịch" contradicts the measured data on the same page (1350 µs vs 170 µs, 55-65 ms vs 6-8 ms, which is about 8-9x). Fix: "nhanh hơn khoảng 9 lần".
- **jit intro**: the predict asks "lần 8 so với lần 1" before any numbers appear; fine as a guess, but the `explain` is the first time the numbers are given. OK to keep, just note the options (9x, 10%) are only guessable. No change needed.
- **aqs / stamped / chon-khoa**: still sit in Java Core, before the Concurrency course. Mitigated with "Cần biết trước" banners and inline glosses (CAS, reentrant, `ReadWriteLock`, `CountDownLatch`), so a learner in order can follow. Remaining gap: the `aqs` compare card uses `{{race-condition}}`, and the `tryAcquire`/`state` story still assumes the learner has seen a lock. Fix (product choice): move the lesson after `deadlock` in `course.ts`, or keep the banner. I rate the banner as acceptable, not ideal.
- **aqs intro**: "với khoá, 0 là chưa ai giữ và 1 là đang bị giữ" is true for the 10-line Mutex but not for `ReentrantLock` (state counts holds). Fix: add "(với `ReentrantLock`, `state` đếm số lần vào lại)".
- **jvm-jre-jdk, cnfe-vs-ncdfe**: OK. Both are well scoped, with scenario then result.

### thread
- **interrupt**: first paragraph packs five ideas (no safe kill, flag, blocking methods clear the flag, `isInterrupted` vs `interrupted()`, results of two experiments). Fix: split into (a) "interrupt chỉ bật cờ" and (b) "hai cách đọc cờ" with the `true,true` vs `true,false` output as a short two-line list. The second paragraph (restore the flag) is fine.
- **runnable-callable**: five paragraphs and `ExecutorService` shown before the widget. It works now (what `ex` is, `execute` vs `submit`), but the last paragraph (uncaught exception in a child thread does not kill `main`) is still a different idea. Fix: move it to the start of the `submit()` trap paragraph or drop it, since the predict already covers "lỗi nằm im".
- **states**: "Đã dẫn một thread đi qua đủ 6 trạng thái" reads like a typo ("Đã chạy"/"Đã đo"). The bullets "WAITING: sau `lock.wait()`" use `wait()` one section before `sleep-wait` teaches it. Fix: add "(`wait()` học ở phần sau)".
- **thread-vs-runnable**: the code in the compare cards has stray 8-space indentation on lines 2+ (rendering artifact in the file). The first bullet claims `class T extends Base, Thread` "báo `'{' expected`", which is correct but opaque. Optional: say "javac từ chối vì Java không có đa kế thừa class".
- **sleep-wait / wait-while**: OK (the old `state-traps` overload is fixed, and the `while` vs `if` scenario is shown before the result).

### threadpool
- **why-pool quiz**: "Tham số nào quyết định gần như toàn bộ hành vi?" is still asked in Phần 1, where the page only says "xem vì sao ở Phần 2". The `explain` uses bounded vs unbounded queue ideas that are taught later. Fix: move this quiz to `flow` (where "workQueue quyết định mọi thứ" is justified) and use a Phần 1 quiz on "vì sao không `new Thread()` mỗi việc".
- **flow vs sim**: the fact "task 13 được trao thẳng cho thread mới, chạy trước các task đang xếp hàng" appears four times (board note, board takeaway, predict `explain`, `sim` intro). `sim` mostly restates the `flow` board. Fix: keep the start-order sentence in `sim` only, and fold the 1-2-13-14-3 order into one board note.
- **forkjoin-work-stealing** is nested under "Phần 5: Bẫy của các factory trong Executors" but is not a factory trap (and `factory-cached` is the only related part). A learner scanning the outline will not find it. It is also dense (4 paragraphs, 2 compare cards, `after`). Fix: make it its own section "Phần 5b: ForkJoinPool" or move it to after `sizing`, and cut the "Mẹo: chỉ fork một nửa" line unless needed.
- **pool-ceiling**: long (6 intro paragraphs, 2 lists of defaults, Little's law, then 4-bullet `after`). It also uses `@Transactional`, N+1 and `max_connections` in `after` without gloss. Fix: split "Little's law" into a short part of its own, or gloss `@Transactional` as "giữ connection suốt cả transaction (học ở khoá Transaction)".
- **"Spring Boot 3.5 metadata" defaults** (`accept-count=100`, `max-connections=8192`, Hikari `maximum-pool-size=10`, `connection-timeout=30000`) match what I know; no factual error found.

### completablefuture
- **errors**: no code at all, only three bullets. `exceptionally`, `handle`, `whenComplete` differ in what the lambda receives and returns; a learner cannot see that. Fix: add one 3-line example per method, e.g. `.exceptionally(ex -> "fallback")`, `.handle((v, ex) -> ex == null ? v : "fallback")`, `.whenComplete((v, ex) -> log(ex))`, and one sentence on "lambda nhận gì, trả gì".
- **executor intro**: "thread gọi cũng tự làm một phần" as the reason for `CPU - 1` is true for parallel streams but not for `supplyAsync` (the caller does not help). Fix: "vì nó được thiết kế cho việc tính toán; `parallelStream` còn dùng cả thread gọi".
- **dashboard**: "order-service lỗi vẫn trả về sau 511 ms" never says when/how the service fails (instantly or after 500 ms?). Fix: state the failing scenario ("order-service ném lỗi sau 500 ms").
- **dashboard quiz explain**: "`@ControllerAdvice` trả 503" is unexplained here. Fix: drop or gloss ("lớp xử lý lỗi chung của Spring MVC").
- **join-get**: lists "Ba cách" correctly, but the Spring MVC aside is marked "tìm hiểu thêm" and is fine. OK.
- Earlier problems (`supplyAsync` undefined, `CF<CF<T>>` not shown, `join()` used before taught, `cancel(true)` no why) are all fixed.

### sync
- **race, predict**: asks which correct approach is fastest among `synchronized`, `AtomicInteger`, `LongAdder` before the page has said what the last two are ("Phần 5 giải thích"). It is a pure guess with no basis yet. Fix: either move the predict to Phần 5, or add one line in Phần 1: "`AtomicInteger`, `LongAdder` là hai cách sửa không dùng lock, học ở Phần 5".
- **volatile quiz**: asks about `println` making a non-volatile flag stop, but `println` is never mentioned in the intro (it is only in the quiz and its `explain`). Fix: add the scenario ("thêm `System.out.println` vào vòng lặp thì cờ thường tự dưng dừng") to the intro, or swap the quiz for "volatile có làm `count++` nguyên tử không?".
- **atomic (worst)**: five paragraphs and three ideas: CAS and `updateAndGet`, `incrementAndGet` as one CPU instruction plus cache-line contention, `LongAdder` plus benchmark ranking plus ABA. "cache line" is not defined ("ô nhớ" is used loosely). ABA is a third topic stuck at the end. Fix: split into parts "CAS và AtomicInteger", "LongAdder và tranh chấp", "ABA". Define cache line in one clause ("khối nhớ nhỏ mà CPU đọc ghi một lần").
- **locks**: "Đổi lại phải `unlock()` trong `finally` (gọi `lock()` ngay trước `try`)" has no why; the quiz asks it. Fix: add "vì nếu `lock()` nằm trong `try` và nó lỗi, `finally` sẽ unlock một lock chưa giữ".
- **lock-fairness-ownership part**: duplicates the parent (parent bullet already says fair lock; part's first bullet restates it), and mixes three ideas (fairness, ownership/hold count, `tryLock`). The second compare card is titled "synchronized không có tryLock" but its code is `ReentrantLock.tryLock`, and the parent already shows `tryLock(500 ms)`. Fix: rename card to "tryLock" or drop it, and remove the duplicate fair-lock bullet from the part.
- **chm-traps**: still 5 ideas (compound ops, `computeIfAbsent` under lock, null ban, weakly consistent iterator, `CopyOnWriteArrayList`) in four paragraphs. The old "why null" and "computeIfAbsent under lock" are added correctly. Fix: move `CopyOnWriteArrayList` and the weakly-consistent paragraph to a separate part.
- **The "Lab 3" cross-reference** ("còn ở Lab 3 với 100 thread ...") is correct and consistent with `lab-concurrency`.

### deadlock
- **pinning (worst)**: three ideas (pinning, "không pool virtual thread", DB pool/Semaphore) and then `after` introduces `Semaphore`, `CountDownLatch`, `CyclicBarrier` as "Ba công cụ phối hợp thread hay bị hỏi" with one line each and no example. This content has nothing to do with pinning and is easy to miss. Fix: move to its own part "Semaphore, CountDownLatch, CyclicBarrier" with a 4-line example each (limit 10, main waits for 3 services, 3 threads meet at a barrier), and keep pinning to pinning. Note `Semaphore` is used in the pinning section before this part explains it, though a one-line gloss is given inline.
- **threadlocal-async**: four ideas (lost data, transaction in ThreadLocal, `TaskDecorator`, `InheritableThreadLocal`). `TaskDecorator` is named but not defined. Fix: one clause ("hook của executor, chạy trên thread gọi để chụp context, rồi đặt lại trên thread của pool") and move `InheritableThreadLocal` into a one-line "Hỏi xoáy" note.
- **avoid**: first sentence ("khoá tài khoản id nhỏ trước: hai giao dịch 1→2 và 2→1") shows the fix and result with no scenario; "tài khoản" and the transfer are never introduced on this page (the scenario only appears in the `avoid-db` quiz). Fix: one sentence first: "Chuyển tiền: giao dịch 1 chuyển từ tài khoản 1 sang 2 (khoá 1 rồi 2), giao dịch 2 chuyển ngược (khoá 2 rồi 1)".
- **deadlock quiz**: the `explain` mentions "Starvation" without a definition. Fix: define it or remove it.
- **multi-instance**: `@Version`, `FOR UPDATE`, `TTL` are listed without gloss; it already says "sẽ học sâu ở tuần 5-6", so acceptable as a preview.
- The old "carrier thread", "Coffman table", "livelock before quiz", ThreadLocal cause reversal are all fixed.

### lab-collections
- **opening quiz**: asks for the lab rule ("tự viết trước; bí quá 15 phút ...") which appears nowhere in the sections (grep confirms "15 phút" is only in the quiz). Fix: add one line of the rule to `setup` intro.
- **setup quiz** (O(1) for LinkedHashMap): the page never says LinkedHashMap is a hash map plus a doubly linked list; the `explain` is the first mention. Fix: add "`LinkedHashMap` = `HashMap` + danh sách liên kết hai chiều nối các entry theo thứ tự" in the intro.
- **cme**: "Ba cách sửa đều ra `[1, 3, 5]`" comes after scenario 2 (`[1, 2, 3, 4]`), so it is ambiguous which list is being fixed. Fix: "Ba cách sửa cho kịch bản 1 (xoá số chẵn của `[1..6]`) đều ra `[1, 3, 5]`".
- **mutable-key**: the value `"shop A"` and the put call are never shown, yet `containsValue("shop A")` is used. Fix: show `map.put(key, "shop A")` first.
- **checklist**: "ghi ngày 6 vào nhật ký học tập" refers to a day plan that does not exist in this lesson. Fix: remove "ngày 6" or link the plan.
- Old problems (results before scenarios, `LRU` undefined, `accessOrder` args, JPA aside, hidden removal rule) are fixed. The 5 LRU results check out when traced by hand.

### lab-concurrency
- **race**: the `incrementAndGet` / `lock xadd` / `ldadd` explanation is duplicated word for word from `sync/atomic` (same HotSpot claim, same cache-line story). Fix: keep the full explanation in `sync`, and here say one sentence plus a link ("xem lại bài sync, Phần 5").
- **race quiz**: "Vì sao LongAdder nhanh" is not taught on this page (only "LongAdder nhanh nhất"). It is a lab after `sync`, so acceptable, but the `explain` is the only place the cell idea appears. Fix: add "(LongAdder chia nhiều cell, bài sync)" in the intro.
- **deadlock, cf**: OK. `CountDownLatch` and `--hold` are now glossed.

### lab-streams
- **medium (worst)**: the question → API → output format is a big improvement, but the section is a 9-bullet list plus three error bullets plus an explanation paragraph (Q08 `distinct()`) inserted between Q08 and Q09. It reads as a wall. Fix: put the Q08 "vì sao" paragraph after the list, group Q07-Q10 (grouping/maps) and Q11-Q15 (strings/flatMap/Optional) as two short parts with a quiz each, and use a table (question | API | output) instead of long bullets.
- **Q14**: "Ba từ xuất hiện nhiều nhất trong một đoạn văn" never shows the paragraph, so the output `[spring=4, java=3, learn=3]` cannot be checked by the learner (and the tie `java=3, learn=3` depends on the text). Fix: show the sentence or link the file path; state the tie-break (key A-Z).
- **Q07**: "làm tròn" has no API (`Math.round(x * 100) / 100.0`? `String.format`?). The result in the parenthesis mentions 25.625 → 25.63, which depends on the method used. Fix: name the rounding call.
- **TreeMap::new** (opening quiz and `medium` last bullet): the reason (HashMap prints in hash order, so a string comparer fails) is only in the quiz `explain`. Fix: one clause in `setup`: "bộ chấm so chuỗi, nên thứ tự key phải cố định: dùng `TreeMap::new`".
- **setup**: the intro lists `groupingBy`, `counting`, `collectingAndThen`, `partitioningBy`, `averagingInt` with no gloss. This is a lab and the earlier lessons teach them, so I only flag it: add "(xem bài Collectors)".
- **hard**: Q16 output is a long line with five nested lists; Q20's "hai lần duyệt" is explained well. Fix: show Q16 output one group per line.
- Old problems (results with no questions, `distinct` why, reversed `maxBy` wording, `teeing` undefined, `reversed()` placement, `toMap` null NPE) are fixed.

## 3. Top 5 remaining fixes (ranked)

1. **Split the densest remaining sections**: `sync/atomic` (CAS, contention, LongAdder, ABA), `thread/interrupt`, `deadlock/pinning` (move Semaphore/CountDownLatch/CyclicBarrier into their own part with examples), `completablefuture/errors` (add code), `lab-streams/medium` (two parts, tables). These are the only places a learner still has to hold 4+ ideas at once.
2. **Fix quizzes and predicts that jump ahead**: `threadpool/why-pool` quiz (move to `flow`), `sync/race` predict (names `AtomicInteger`/`LongAdder` before they are taught), `sync/volatile` quiz (`println` is not in the intro), `lab-collections` opening quiz (rule not on the page) and setup O(1) quiz.
3. **Correct unsupported or wrong claims**: `java-runtime/jit` "nhanh hơn hàng chục lần" vs measured ~9x, `completablefuture/executor` "thread gọi cũng tự làm một phần" (true for parallel streams, not `supplyAsync`), `java-runtime/aqs` `state` 0/1 vs `ReentrantLock` hold count.
4. **Remove duplication and misplacement**: `threadpool` ForkJoin nested under "factory", the task-13 fact repeated 4 times across `flow`/`sim`; `sync/lock-fairness-ownership` repeats fair lock and mislabels its `tryLock` card; `lab-concurrency/race` copies the `lock xadd` explanation from `sync/atomic`.
5. **Add missing scenario sentences**: `deadlock/avoid` (the transfer scenario), `completablefuture/dashboard` (when the order service fails), `lab-collections/mutable-key` (the `put` with `"shop A"`), `lab-streams` Q14 (the paragraph) and Q07 (rounding API), `lab-collections/cme` fix list ("cho kịch bản 1").

Unresolved: whether to move `java-runtime` after `deadlock` in `course.ts` (product decision; banners currently cover it). Not verified here: widget behaviour and video narration, which were outside the text read.
