# Learner audit: I/O, runtime, concurrency, labs 1–3

Scope: java-io, java-runtime, thread, threadpool, completablefuture, sync, deadlock, lab-collections, lab-concurrency, lab-streams.
Sources read: lesson `.ts` files, `*-video/scenes.py` narration (java-io and java-runtime have no video), study notes 03.01–03.05 and 11.01–11.03, and luminhkhuong.dev (Java Concurrency, Collections, JVM pages).
Calibration: the `exception` section 2 problems (packed ideas, undefined prerequisites, result shown before the scenario, rules with no "why", quiz on untaught content).

## 1. Summary

| Lesson | Clarity (1-5) | Worst section | Video change |
|---|---|---|---|
| java-io | 4 | serialization | n/a (no video) |
| java-runtime | 3 | aqs (prereqs taught later in course) | n/a (no video) |
| thread | 3 | state-traps | no |
| threadpool | 4 | flow (quiz ahead of content), factory | no |
| completablefuture | 3 | why / executor | no |
| sync | 3 | synchronized | minor: `traps` |
| deadlock | 3 | threadlocal | no |
| lab-collections | 3 | setup | minor: `mutable` |
| lab-concurrency | 4 | race | minor: `race` |
| lab-streams | 2 | medium | minor: `medium` |

## 2. Per lesson

### java-io (no video)
- **twr**: The page says "tự gọi `close()` theo thứ tự ngược" but never says reverse of what, and never explains `getSuppressed()`. Fix: add "ngược với thứ tự khai báo: mở A rồi B thì đóng B trước, vì B thường dựa trên A". Add one line saying a suppressed exception is an extra exception attached to the main one.
- **charset**: The sentence "Ở bản cũ nó phụ thuộc máy, ví dụ Windows" is unfinished, and `cp1252` is never defined. Fix: "trước JDK 18, charset mặc định lấy theo hệ điều hành, ví dụ Windows tiếng Anh là cp1252". The quiz explanation "các byte nhiều byte" is garbled. Reword it to "ký tự dùng nhiều byte trong UTF-8 bị tách thành nhiều ký tự lạ". Use the existing `{{mojibake}}` glossary term.
- **bytebuffer**: "NIO" and "kênh/channel" are used without a definition. The trap says forgetting `flip()` reads "rỗng", but the compare card correctly says `get()` reads position 3 of the unwritten area. That returns a stale or zero byte, not "empty". Fix the trap text so it matches. `transferTo`/zero-copy in `after` comes out of nowhere. Either add one line on what a channel is or drop it.
- **serialization**: Three ideas are packed into one compare card.
  - The bad-way error message shows `serialVersionUID = N … = N`, which reads as two equal values. Use `N1` and `N2`, or real numbers.
  - The "why" behind the UID change is missing: the default UID is a hash of the class structure, so adding a field changes it.
  - The danger of deserialization is only "tạo object tuỳ ý". Add the mechanism: `readObject` of classes already on the classpath can run code (gadget chain).
  - The ok bullet mixes the filter result with `transient`. Split it. The filter pattern `"com.myapp.*;!*"` needs a gloss: allow `com.myapp`, reject everything else.
- **Gaps vs interview norms**: byte streams vs char streams (`InputStream` vs `Reader`), the Buffered decorator wrapping, and BIO vs NIO. One short section or `after` note would cover them.

### java-runtime (no video)
- **aqs, stamped, chon-khoa (biggest issue)**: The lesson sits in the Java Core course *before* the Concurrency course. It relies on race condition/`counter++`, CAS (`compareAndSetState`), `ReentrantLock`, `Semaphore`, `CountDownLatch`, "reentrant", `ReadWriteLock` and `synchronized`, all of which are taught later in `sync`. A learner reading in order meets "ép khoá", "fair", "await() chờ trong hàng đợi" with no base. Fix: move the lesson after `deadlock` in the Concurrency course, or split AQS/StampedLock out and keep only ClassLoader and JIT in Java Core. At minimum, add a prerequisite line linking `sync`.
- **aqs**: The quiz asks for the "hai thành phần cốt lõi" (state + queue), but the intro never names `state`. Only the glossary tooltip does. Fix: say in the intro "AQS = một số nguyên `state` + hàng đợi thread chờ; `compareAndSetState(0,1)` nghĩa là 'nếu đang 0 (chưa ai giữ) thì đặt 1'".
- **classloader**: OK. Gap vs luminhkhuong.dev: the load phases (loading, linking, initialization) and breaking parent-first (TCCL for JDBC/SPI, Tomcat webapp loader). Add one `after` line.
- **jit**: OK. C1/C2 and "tier 3/4" are named but never explained. One clause would do: "C1 biên dịch nhanh, ít tối ưu; C2 chậm hơn nhưng tối ưu mạnh".

### thread
- **process-thread**: Three ideas in two paragraphs: memory model, stateless singleton bean, and "exception in a child thread does not kill main". The last one is unrelated and abrupt. `ThreadLocal` is used before it is taught (deadlock part 4). Fix: move the crasher fact to `runnable-callable` (next to swallowed exceptions) and add "(học ở bài Deadlock & ThreadLocal)".
- **runnable-callable**: `ex`, executor and `Future` appear with no setup (`ex.submit(...)`: what is `ex`?). The page never says what `execute()` does differently. Only the video and widget do. The quiz asks about `ExecutionException`, which the intro never mentions. Fix: add one line for `ExecutorService ex = Executors.newFixedThreadPool(2)` ("pool, học bài sau"). Add "execute() để lỗi bay ra và được in; submit() cất lỗi vào Future, get() ném lại dưới dạng `ExecutionException` bọc lỗi gốc".
- **states**: BLOCKED/`synchronized`/`wait()` assume locks are known, but `sync` comes later. Fix: one-line gloss "`synchronized` = chỉ một thread được vào đoạn code đó; thread khác đứng chờ (BLOCKED)".
- **state-traps (worst)**: Four separate ideas in two paragraphs:
  - I/O shows as RUNNABLE
  - `ReentrantLock` waiting shows as WAITING (not yet taught)
  - `sleep` vs `wait` and the lock
  - reading a thread dump (`getTask`, `HikariPool.getConnection`)

  "Thread dump" is never defined. "wait() phải gọi trong synchronized" has no "why", and `notify` is never introduced. Fix: split into (a) "trạng thái không nói lên CPU" (I/O, ReentrantLock) and (b) "sleep vs wait". Define a thread dump as "ảnh chụp mọi thread với trạng thái và dòng code đang dừng, lấy bằng jstack". Give the why: wait() releases the monitor, so it must hold the monitor first; notify() wakes it.
- **interrupt**: The quiz asks about `Thread.interrupted()` vs `isInterrupted()`, but `interrupted()` never appears in the intro. Add one sentence. The "why restore the flag" is half there. Make it explicit: "code phía trên call stack (vòng lặp, executor) chỉ biết phải dừng nhờ cờ này".
- **Gaps vs notes/site**: wait/notify and producer-consumer are not covered anywhere in this track (luminhkhuong.dev lists them).

### threadpool
- **why-pool**: "platform thread" is never contrasted with anything. Add "(thread thường, đối lập với virtual thread ở bài 5)". "workQueue quyết định gần như toàn bộ hành vi" is a rule stated before the flow that justifies it. Add "(xem vì sao ở phần sau)" or move the claim into `flow`.
- **flow**: The quiz asks about `newFixedThreadPool`/`LinkedBlockingQueue`, which is only taught in `factory`. Move that quiz to `factory` and use a flow-only quiz here, for example "task thứ 3 đi đâu?". The title "Phần 2 và 3" is odd because `sim` exists separately. The start-order fact (1, 2, 13, 14, 3…) sits here on the page but in `sim` in the video. Move it to `sim` so `sim` has real content (it is currently one sentence that points to "widget phía trên").
- **factory**: `SynchronousQueue` is undefined, yet the whole newCachedThreadPool explanation depends on it. Add "queue 0 chỗ: mỗi task phải trao tay ngay cho một thread rảnh, không có thì tạo thread mới".
- **policy/sizing**: "back-pressure", "bulkhead" and "downstream" are undefined. One clause each.
- **spring**: "@Async gọi từ chính class đó không chạy bất đồng bộ" is a rule with no why, and proxies are taught later (tx-proxy). Add "vì @Async chạy qua proxy; gọi `this.method()` đi thẳng, không qua proxy". MDC is undefined: "context gắn vào mỗi dòng log, ví dụ requestId".

### completablefuture
- **why**: There is no code at all. The learner never sees what a chain looks like, and `supplyAsync` first appears in the next title undefined. "thenApply ≈ map, thenCompose ≈ flatMap" assumes the map/flatMap intuition. Fix: add a 3-line chain `supplyAsync(() -> loadUser(id)).thenApply(User::name).thenAccept(System.out::println)` and say `supplyAsync` = "chạy hàm này trên thread khác, trả về ngay một CF". Cover `thenAccept`/`thenRun` in one line.
- **executor**: Two dense ideas: the commonPool size, and which thread runs non-Async stages. The "why" behind 7 threads (CPU − 1) and why sharing is bad (parallel streams and every library use the same pool) is missing. Split the non-Async thread rule into its own short paragraph with the `main` example first.
- **then**: "làm phẳng thay vì cho ra CF lồng nhau" is never shown. The video says `thenApply` with a future-returning function gives `CF<CF<T>>`. Put that on the page with the type. The "join() giữa chuỗi" trap uses `join` before part 7 teaches it.
- **allof**: Uses `exceptionally` before part 5 teaches it. Add "(học ở phần 5)" or reorder errors before allOf.
- **timeout**: "cancel(true) … task không nhận interrupt" has no why. Add "CF không giữ tham chiếu tới thread đang chạy nó nên không interrupt được".
- **join-get / dashboard**: "Controller trả thẳng CompletableFuture để giải phóng thread Tomcat" and "circuit breaker (Resilience4j)" are unexplained asides. Gloss them or mark them "tìm hiểu thêm".

### sync
- **race**: The quiz says "thường vẫn ra đúng 100.000" while the intro says it fails 10/20 times. That is half, not "thường". Reword to "đôi khi". "check-then-act" is introduced and later relied on (roadmap, chm-traps) without a definition. Add "kiểm tra điều kiện rồi hành động dựa trên nó; giữa hai bước thread khác có thể chen vào".
- **synchronized (worst)**: Seven ideas in two paragraphs:
  - monitor
  - mutual exclusion + visibility
  - three lock targets
  - `private final Object`
  - reentrant
  - release on exception
  - `@Transactional` trap

  Missing whys: why lock on `private final Object` (outside code can lock on `this`/the class and block you), and why reentrancy matters (a synchronized method calling another would deadlock itself). The `@Transactional` trap needs transaction/commit, which belongs to a later course. Fix: split into "synchronized làm gì" and "khoá trên cái gì + bẫy". Use the video's fitting-room/key analogy on the page. Use the `{{commit}}` glossary term.
- **volatile**: "chống reorder" and "double-checked locking" are undefined. The quiz uses happens-before, which is only taught in the next section. Define reorder in one line ("compiler/CPU được đổi thứ tự lệnh nếu một thread không thấy khác biệt") and swap the order of volatile and happens-before, or reword the quiz.
- **happens-before**: Five rules in one sentence, and "Java Memory Model" is undefined. Make the rules a bullet list and keep the `data/ready` example first.
- **atomic**: The quiz asks about the ABA problem, which is not taught. Add one sentence to the intro or change the quiz. The "why LongAdder is faster" is missing: under contention every thread fights over one memory slot. Page and video disagree: the video says `sum()` is not an atomic snapshot, the page omits it. Add it.
- **locks**: `Condition` and fair lock are undefined. "Không nâng cấp được read lock lên write lock" has no why: the write lock waits for all readers, including yourself, so it deadlocks.
- **chm-internals**: The quiz "vì sao Java 8 bỏ Segment" is answered only in the quiz itself. Add the reason to the intro.
- **chm-traps**: Four ideas (compound ops, the null ban, weakly consistent iteration, CopyOnWriteArrayList). The null ban has no why: `get()` returning null would be ambiguous between "absent" and "value null". The video warns that the `computeIfAbsent` function runs under the lock, but the page does not. Add it. The quiz on 3 instances/Caffeine/Redis is not taught here.
- **Video `traps`**: "cấm giá trị rỗng" should say null. Empty strings are allowed, so the narration is misleading.
- **Cross-lesson**: `sync/atomic` says AtomicInteger beat synchronized ("rank changes per run"). `lab-concurrency/race` says AtomicInteger lost all 3 runs. Add one reconciling sentence in the lab: 100 threads is far higher contention than 8.

### deadlock
- **deadlock**: The four Coffman conditions are listed as bare English terms. The study note has a table with the meaning and how to break each one. Bring that table in. The quiz asks deadlock vs livelock, but livelock first appears in part 3. Define livelock here or move the quiz.
- **avoid**: Two topics (Java tryLock retry and DB deadlock) in one section. DB row locks, transaction and rollback appear with no setup, and there is no "why DB deadlocks happen" (two transactions update rows in opposite order). "Đừng gọi callback hay HTTP khi đang giữ lock" has no why. Split the DB part into its own paragraph with that scenario. Use `{{rollback}}`. Give the why: holding a lock while waiting on slow or unknown code stretches the hold time and that code can take other locks.
- **threadlocal (worst)**:
  - Paragraph 1 names four Spring internals (`TransactionSynchronizationManager`, `RequestContextHolder`, MDC…) before the concept has sunk in.
  - "đó là lý do một request gắn với một thread" reverses the cause. It should be: because Tomcat serves one request per thread, Spring can keep request data in a ThreadLocal.
  - Paragraph 2 packs four ideas (reuse leak, remove in finally, async propagation, InheritableThreadLocal). "InheritableThreadLocal không giải quyết được với pool" has no why: it copies only when a thread is created.
  - The memory-leak angle from the notes (value lives as long as the pool thread) is missing.
  - The quiz depends on transaction knowledge.

  Fix: use the note's "ngăn tủ cá nhân" analogy and the `static final ThreadLocal` code first, then the leak, then the async copy.
- **virtual-threads / pinning**: "carrier thread" is never defined: "platform thread mà JVM gắn virtual thread lên để chạy". Pinning has no why: the monitor of `synchronized` belongs to the carrier, so the JVM cannot unmount. "Không pool virtual thread" has no why: they are cheap, pooling defeats the point. `Semaphore` is not taught in this track. The page example "1000 virtual thread qua `Semaphore(10)`" does not say the Semaphore stands in for a 10-connection pool. The video says "mười connection".
- **multi-instance**: OK as a preview, since it already says "học sâu ở tuần 5–6".
- **Gaps vs luminhkhuong.dev**: CountDownLatch, CyclicBarrier, Semaphore, ForkJoin/work stealing, ScopedValue and structured concurrency are not taught anywhere in the Concurrency track, only name-dropped. These are frequent interview questions.

### lab-collections
- **setup (worst)**: This is the calibration problem exactly. The results `[B, C, D]`, `[C, A, D]`, `[C, A, D]`, `[B, C]`, `[B, C, D]` are listed without the test scenarios that produce them. "LRU" is never expanded. `accessOrder` and `(16, 0.75f, true)` are not explained, and there is no why for `removeEldestEntry`. Fix:
  - Expand LRU: "Least Recently Used: xoá phần tử lâu nhất không được dùng".
  - Explain the args: capacity, load factor, `true` = order by access instead of insertion.
  - Show the scenario before the result, as the video does: "cap 3, put A, B, C, get A, put D → B bị xoá → [C, A, D]".
  - Add the two traps from the video: overwriting a key counts as an access, `containsKey` does not.
- **equals**: Missing the why that the video gives: HashSet picks the bucket by hash first, so the two objects are never compared with equals. "Chạy 6 lần đều như vậy" is noise. The Lombok `@EqualsAndHashCode` on entities warning needs a why, or should go.
- **cme**: The second example silently changes the removal rule. The first removes evens. The second removes the penultimate element (3 in `[1, 2, 3, 4]`), which is never stated. `modCount`, `expectedModCount` and `cursor` are internals with no explanation. The `orphanRemoval` aside uses JPA, which is taught later. Fix: state "xoá số 3". Explain that after the removal `cursor == size`, so `hasNext()` returns false and the loop ends before 4. Drop the JPA aside or mark it.
- **Video `mutable`**: "trả về rỗng" should say null.

### lab-concurrency
- **race**: "Dòng `count++` in PASS nghĩa là đã tái hiện được lỗi" confuses learners, because PASS on a bug looks wrong. Say "check này kiểm tra *có sai*, nên PASS = đã thấy lỗi". It needs the cross-lesson reconciliation with `sync` (see above).
  - Accuracy nuance (fairly confident): on HotSpot, `AtomicInteger.incrementAndGet` is compiled to a single atomic add instruction (`lock xadd` on x86), not a CAS loop that retries. The slowdown comes from cache-line contention on one slot.
  - Fix: reword the page and the video `race` scene ("thất bại và thử lại liên tục") to "100 thread tranh một ô nhớ".
- **deadlock**: `CountDownLatch` is used with no prior teaching. Add "bộ đếm lùi: `await()` chờ tới khi đủ N lần `countDown()`". `--hold` is undefined: "cờ để chương trình không tự thoát, đủ thời gian chạy jstack".
- **cf**: OK (recap of the CF lesson).

### lab-streams
- **setup**: The Q01–Q06 results (`1539`, `Nguyen Chi`, `true,false`) are given without the questions or units (triệu). The quiz on `reversed().thenComparingInt` is explained only in the video, not on the page. The why for the tie-breaker (two people at 47) is also video-only. Fix: list the six questions in one short table (question → key API → expected output) and add the `reversed()` placement sentence.
- **medium (worst)**: One sentence carries 8 queries with outputs but no questions. "lương cao thứ 2 cần `distinct()`" has no why (duplicate top salaries). Number formats are mixed ("25,625 thành 25.63"). The video's `toMap` null-value NPE is missing. Fix: the same table format, one row per query. Give the distinct why: without it, two people at the top salary make "thứ 2" equal to the max.
- **hard**: "`maxBy` bọc `collectingAndThen`" reverses the actual nesting. It should be `collectingAndThen(maxBy(...), Optional::get)`, where collectingAndThen wraps maxBy. The model answer is ambiguous too. `teeing` is undefined: "collector Java 12 chạy hai collector trong một lần duyệt rồi gộp". The Q20 two-pass why is video-only.
- **Video `medium`**: "Email null qua Optional map cho ra rỗng" conflicts with the page output `N/A`. Make it say "ra giá trị mặc định N/A".

## 3. Top 5 fixes (ranked)
1. **Move java-runtime's AQS/StampedLock/lock drill after `sync`** (or split the lesson). It currently depends on about eight concepts the course teaches later, so it fails for anyone reading in order.
2. **Rewrite `lab-streams` setup/medium and `lab-collections` setup as question → API → output tables.** Results currently appear before or without their scenarios, which is the exact calibration failure. Also fix the reversed `maxBy`/`collectingAndThen` wording.
3. **Split the overloaded sections and add the missing whys:** `thread/state-traps`, `sync/synchronized`, `deadlock/threadlocal`, `deadlock/avoid`. Each packs 4–7 ideas and states rules (private lock object, wait inside synchronized, no read→write upgrade, InheritableThreadLocal, pinning) without the reason.
4. **Fix quizzes that test untaught content:**
   - thread: `ExecutionException`, `interrupted()`
   - threadpool: the flow quiz about newFixedThreadPool
   - sync: ABA, why Segment was dropped, the Caffeine/Redis quiz, and the volatile quiz that relies on happens-before
   - deadlock: livelock

   Either add one teaching sentence to the intro or move the quiz.
5. **Fill the definition gaps that block understanding:** a minimal CF chain plus a `supplyAsync` definition in `completablefuture/why`, `SynchronousQueue`, carrier thread, `CountDownLatch`, Coffman condition meanings (the table from the note), and `@Async` self-invocation (proxy). Then add a short coverage item for CountDownLatch/CyclicBarrier/Semaphore and producer-consumer (wait/notify, BlockingQueue), which luminhkhuong.dev covers and this track only name-drops.

Unresolved: should the course order change (fix 1), or would a prerequisite banner be enough? That is a product decision.
