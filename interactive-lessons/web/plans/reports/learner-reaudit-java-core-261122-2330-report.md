# Learner re-audit: Java core lessons (2026-11-22, round 2)

Method: fresh top-to-bottom read of the current `src/data/lessons/<slug>.ts` for the 13 lessons, then compared with `learner-audit-261122-1624-java-core-report.md`. Widgets were opened only where prose and widget could disagree (`sealed-switch`, `collection-picker`). Scores are strict (5 = nothing a junior would stumble on). Half points are used.

## 1. Summary

| Lesson | Old | New | Worst remaining section id | Verdict |
|---|---|---|---|---|
| oop | 4 | 4 | generics-pecs | improved (gaps closed, new parts are dense) |
| solid | 3 | 4.5 | srp-limits (predict before code) | fixed |
| equals-hashcode | 4 | 4 | bigdecimal-money | improved |
| exception | 4 | 4 | finally-traps | improved (3 old items still open) |
| hashmap | 4 | 4.5 | map-basics | fixed |
| collections | 4 | 4 | comparator-lists | improved |
| stream | 3 | 4 | stream-or-for | improved |
| collectors | 3 | 4 | maxby | improved |
| optional | 3 | 4 | parallel | improved |
| java21 | 3 | 4 | pattern-switch | improved |
| jvm | 4 | 4 | investigate | improved (new parts good, tail section thin) |
| core-diagrams | 2 | 3 | jpa / java-core (no widget, jargon) | improved, still unclear |
| java-time | 3 | 4.5 | types (same point shown 3 times) | fixed |

Confirmed fixed from the old report: "rỗng" for null in the page text (video not re-checked); collect-downstream dataset now shown; Callable/Supplier taught before its quiz; set-map-order quiz moved to floorKey; sealed reason and forward pointer added; LSP rules each have an example; lsp-strategy no longer teaches sealed/record; DIP "inversion" explained; flatMap and orElse/orElseGet traps well covered; parallel-traps split into 3 parts with the 4x10 arithmetic; JVM terms (GC, throughput/latency, -Xss, carrier thread) defined; java-time DST example and the 01:30/02:30 error fixed.

## 2. Remaining issues per lesson

### oop
- **generics-pecs** (under interface-vs-abstract): about 5 ideas in one intro (what generics are, pre-Java 5 casts, invariance, array covariance with `ArrayStoreException`, 3 wildcards, PECS). The bridge from interfaces is one sentence. Fix: split into 2 parts, "generics + invariance" and "wildcards + PECS", and drop the array paragraph or move it behind a "đọc thêm" note.
- **inner-classes**: the bridge is weak ("Ta vừa dùng `private` để giấu field"). It also uses `GC`, `WeakReference`, "effectively final" and "Activity" (Android) without a gloss, and `Comparator<String>` generics appear before the generics part. Fix: add "GC = thu hồi object không ai tham chiếu (xem bài JVM)", say "Controller" and drop "Activity", and note effectively final = "không bị gán lại".
- **static-init** `after`: "ExceptionInInitializerError / NoClassDefFoundError" are not defined, and "bài ClassLoader, JIT" is a lesson (`java-runtime`), not a JVM part. Fix: one clause each, and point to the correct lesson title.
- **override-vs-overload** and **polymorphism** (Phần 5 and 6): "runtime by real object / compile time by declared type" is taught twice, plus a third time in the overload-resolution part. Fix: keep Phần 6 as the recap and cut the repeated explanation in Phần 5 intro.
- Otherwise OK: access modifiers, constructor rules, overload resolution, erasure and the Phần 11 forward link to java21 are correct and well ordered.

### solid
- **srp-limits** predict: it asks about "tách ra nhiều service, sửa thẳng dữ liệu" and offers "lỗi biên dịch vì field public", but the `OrderData` code is only shown in the compare below it. Fix: show the 4-line `OrderData` code in the intro before the predict.
- "Interface cho mọi service" is repeated as dip-history trap, playbook bullet and card. Fix: keep the dip-history trap and make the playbook bullet a link.
- Otherwise OK.

### equals-hashcode
- **bigdecimal-money**: off-topic for "Integer cache" (the bridge sentence is thin) and packs double error, binary representation, 4 BigDecimal rules and rounding in one intro. It also uses `HashSet`/`TreeSet` sizes before Phần 3-4 explain hashing: the takeaway "`HashSet` coi `2.0` và `2.00` là hai phần tử" cannot be understood yet. Fix: promote it to its own section after Phần 6, or at least move the HashSet/TreeSet row to after the contract section. Also "phí 0,1 nghìn đồng" is odd, say "phí 0,1 đồng".
- **immutable** `after`: 4 topics (String/StringBuilder/StringBuffer, `new String("java")`, immutable class recipe). Fix: move "immutable class" and `new String` into a part.
- Otherwise OK: contract, write-equals (getClass vs instanceof), `@Data` reasoning, pool and cache are clear. I checked the `CIString` symmetry example and the `new String` object count; both are right.

### exception
- **finally-traps** (old item still open): the intro states catch ordering ("đặt ngược sẽ lỗi biên dịch") with no reason, and the three finally traps the widget tests (return overrides try's return, exception swallowed, variable change not returned) are never stated on the page. The quiz asks about the swallow trap. Fix: add the 3 traps as bullets before the widget, and put the catch rule after the widget with the reason ("catch con đặt sau catch cha thì không bao giờ chạy tới nên javac từ chối").
- **try-with-resources** (old item still open): "đóng theo thứ tự ngược" has no why. Fix: "B có thể dùng A (statement dùng connection), nên B phải đóng trước".
- **spring-design** (old item still open): `@RestControllerAdvice` and `traceId` are still undefined, and 4 of 5 anti-patterns have no reason. Fix: "`@RestControllerAdvice` = một class bắt exception cho mọi controller", "traceId = mã gắn vào mọi dòng log của một request", and a one-clause reason per bullet.
- **exception-cost**: "code đã được JIT biên dịch" uses JIT with no gloss (this lesson has no link to jvm). Fix: add "JIT = JVM dịch method nóng sang mã máy, xem bài JVM".
- OK: hierarchy, checked-lambda, checked-rollback, logging-stacktrace.

### hashmap
- **map-basics** predict/explain: uses "bucket" and "hash của key" before Phần 2 defines them. Fix: in the explain, say "bucket (ô của mảng bên trong, học ở Phần 2)".
- **null-order-threads**: 4 topics, readable only because they are bulleted. Fine, but "ConcurrentHashMap khoá từng bucket" is only a claim here. Optional: one clause.
- Verified: hash 99163451, bucket 11, `-786636006 % 16 = -6` vs `& 15 = 10`, resize counts (16 to 256 for 100 items), treeify 9 to 32, 10 to 64, 11 tree. All consistent. Otherwise OK.

### collections
- **comparator-lists**: 5 unrelated topics (a-b overflow, 3 list kinds, Comparable vs Comparator, `Arrays.asList(int[])`, Java 21 sequenced methods). Quiz tests only unmodifiableList vs copyOf. Fix: split into "Comparator" and "List chỉ đọc"; move the Java 21 sequenced sentence out (it is repeated in java21 Phần 8).
- **collection-map**: the quiz asks Stack vs ArrayDeque but the page text never mentions them (only the widget row does). Fix: add one line to the intro.
- Part id `lru` is titled "Phần 3b" with no scene: fine, but renumber for consistency.
- Otherwise OK. I verified the top-K trace (drops 1, 3, 5, 2), the PriorityQueue iteration `[1, 3, 9, 5]` and the LRU `[c, a, d]`.

### stream
- **compose-and-then**: the compare row uses `toMap(Function.identity(), String::length, (p, q) -> p)`, but `toMap` and merge functions are only taught in collectors. Orphan reference. Fix: delete that row, keep the `identity()` line in the takeaway.
- **stream-or-for**: no "why" for any of the 4 for-loop cases and no widget or board. The quiz depends on "checked exception in lambda", which is not linked to the exception lesson. Fix: one clause per bullet and "xem bài Exception, Phần 2".
- **find-first-any**: `parallelStream` is used with no definition (it is only defined in optional). Fix: one clause "chia dữ liệu cho nhiều thread".
- **flatmap**: the `summaryStatistics` result (`count=2, sum=3`) shows no input list. Fix: state `["a", "bb"]`.
- **lazy**: the count/peek point appears in both the board card and `after`. Remove one.
- Callable `after` mentions "thread pool" and `executor.submit` before the concurrency lessons. Acceptable, but a clause "(học ở tuần concurrency)" would help.

### collectors
- **maxby**: shows no code. The page gives `maxBy(comparator)` and a result `{HR=Dũng, IT=Bình, Sales=Em}` but never the full expression, and never says the comparator is salary. Fix: add the 3-line `groupingBy(Employee::dept, TreeMap::new, collectingAndThen(maxBy(Comparator.comparingDouble(Employee::salary)), o -> o.get().name()))` and say "cao lương nhất".
- **tomap**: the why is now correct, but `Map.merge` is not taught anywhere in the java-core path (hashmap lists `merge` only in a bullet). Fix: one-line `merge` example in the null explanation.
- **joining-teeing** and **reduce-collect**: each titled with 2 unrelated ideas. Minor; split if the page feels long.
- **collect-downstream**: `groupingBy` is used in the examples before Phần 3 defines it. One clause "groupingBy chia nhóm theo key" fixes it. `record` is assumed known.

### optional
- **parallel**: the intro is still the densest block: thread pool, CPU-bound, I/O-bound, commonPool size formula, ForkJoinPool, CompletableFuture, supplyAsync, all in 6 items before any code. Everything is glossed, but nothing is shown. Fix: move the `ForkJoinPool` / `CompletableFuture` sentences to after the quiz, or into `when-parallel`.
- **optional-chain** `after`: `User[name=Bình, address=null]` outputs appear without the sample users; the widget has them, the prose does not. Fix: list the 2 users in one line.
- **when-parallel**: the quiz and last paragraph teach an undocumented hack (custom `ForkJoinPool`) to a junior. Correct, but advanced; mark it as "đọc thêm".
- OK: the 3-part split of parallel-traps, the 4 × 10 arithmetic, the identity and associativity definitions. I checked the subtraction examples (-10 sequential, 0 parallel); both are right.

### java21
- **pattern-switch**: prose and widget disagree. The text says "`area(new Rect(2, 2))` = 4.0 (nhánh `when w == h`)", but the widget code has no `when` branch, and 4.0 is the same as the normal `w * h`, so a learner cannot see what `when` does. The `Shape` records are never shown on the page. Fix: put the 6-line `sealed interface` and `record` declarations plus a `case Rect(double w, double h) when w == h -> ...` branch with a distinguishable result (for example "hình vuông" text or a different value), or drop the `when` claim.
- **switch**: still bundles `instanceof` patterns with switch expressions (the old finding). The fall-through example is now shown, which is good. Fix: move the `instanceof` sentence into var-textblock or a short part.
- **modern**: still 2 unrelated topics. Sequenced Collections repeats collections Phần 6; make it one sentence with a link.
- **java-8-11** is 17 bullets, structured but long. Fine for an interview-list part.
- OK: versions, record, record-spring (projection, `@ConfigurationProperties`, proxy defined), sealed (reason plus Open/Closed trade-off).

### jvm
- **investigate** (Phần 9): terse 5-step list with unglossed "dominator tree", "leak suspects", "Micrometer", "heap dump"; the last line lists 8 tools. Fix: one clause per step, and 2 lines on what a heap dump is.
- **"Pod"** is used from Phần 5 (G1 on a 1 CPU pod) and Phần 8, never explained. Fix: "pod = một container chạy app trên Kubernetes" at first use.
- **classloading-jit**: 4 ideas in one intro (3 loaders, parent delegation, JIT tiers, warm-up). It also duplicates the `java-runtime` lesson ("ClassLoader, JIT, AQS") with no cross-link. Fix: split into "class loading" and "JIT", and link to `java-runtime`.
- **cpu-high**: the claim "JDK 21 jstack prints `nid` in decimal" was measured on macOS (header comment), but the commands taught are Linux (`top -H`). I am not confident Linux JDK 21 behaves the same. Fix: say "đã chạy trên macOS; trên Linux hãy kiểm tra dạng `nid` của JDK bạn dùng".
- **gc-roots**: "tham chiếu JNI" and "p99" are not glossed. **oom**: "off-heap" is used before container-offheap defines it. Minor, add clauses.
- Minor: Phần 1 says a thread stack is "khoảng 1 MB" (500 threads, a few hundred MB) while the NMT run shows 439 MB for 200 threads. The "phụ thuộc hệ điều hành" note covers it, but add the one-line reconciliation.

### core-diagrams
- Big improvement in format (numbered steps, trap in bold, fixes for the three cache incidents). Still the weakest for a junior because it is a recap of other lessons and it uses terms no Java-core learner has met: CGLIB, TransactionInterceptor, rollback-only, `REQUIRES_NEW`, dirty checking, flush, `@EntityGraph`, `FilterChainProxy`, `AuthorizationFilter`, BCrypt, `HandlerAdapter`. A line says "chi tiết ở bài X" but there is no prerequisite warning.
- **jpa** and **java-core** have no widget and one quiz each. **spring** and **security-cache** each have a single quiz for 3 and 2 diagrams. Quizzes cover one step only.
- Each section still holds 2 to 3 diagrams of 5 to 13 steps. Fix: label the lesson "ôn tập, học sau các bài Spring/JPA" at the top, add a quiz per diagram (at least the bold trap step), and give the two no-widget sections the same `diagram-rebuild` drill.
- Opening quiz is about the study method (Feynman), not a diagram, so it does not hook anything.
- Claims checked and correct: proxy created after `@PostConstruct`, `postHandle` skipped on exception, 401 vs 403, ThreadPoolExecutor order core, queue, max, reject.

### java-time
- **types**: the same 14:00 vs 02:00 example is repeated in the board, compare, trap and quiz (4 times). Trim to board plus compare. "`now()` trả về gì" is assumed.
- **store** `after` is a single line about Hibernate 6 with no explanation. Fix: delete it or merge into the trap.
- **formatter**: "Chữa bằng synchronized" is marked `bad` though it is correct, only slow. Use a neutral mark.
- OK otherwise. I verified the DST arithmetic (12:00 EST + 24h = 13:00 EDT, `PT23H`), the gap and overlap `getTransition` strings, the 01:30 overlap default (earlier offset), and the `Clock` example.

## 3. Top 5 remaining fixes (ranked)

1. **java21 `pattern-switch`**: prose says a `when w == h` branch exists, but the widget code has none and the result is identical to the normal branch. Show the sealed/record code on the page and make the `when` branch observable (or remove the claim).
2. **exception `finally-traps` + `try-with-resources` + `spring-design`**: add the three finally traps and the catch-order reason on the page, the reverse-close reason, and define `@RestControllerAdvice` and `traceId`. These were in the first audit and are still open.
3. **core-diagrams**: mark it as a recap with prerequisites, gloss or defer the Spring/JPA terms, and add a quiz or drill per diagram (jpa and java-core have none).
4. **collectors `maxby`** (show the full expression and the comparator) together with **stream `compose-and-then`** (remove the `toMap` orphan) and **stream `stream-or-for`** (add whys and the exception link): three places where the learner sees a result or term without the scenario.
5. **Density of new parts**: oop `generics-pecs` (split into two), equals-hashcode `bigdecimal-money` (move after the contract section, it needs HashSet), collections `comparator-lists` (split), jvm `classloading-jit` (split and link `java-runtime`), jvm `investigate` and "pod" (gloss).

Status: DONE
Summary: Re-read all 13 current lessons; 12 improved (solid, hashmap and java-time are essentially fixed), core-diagrams is still the weakest at 3/5. Main leftovers are the unresolved exception items from round 1, the java21 `when` prose/widget mismatch, and a few over-dense new parts.
