# Learner audit: Java core lessons (2026-11-22)

Scope: oop, solid, equals-hashcode, exception, hashmap, collections, stream, collectors, optional, java21, jvm, core-diagrams, java-time.
Method: read each `web/src/data/lessons/<slug>.ts` top to bottom as a junior learner, extract narration from `<name>-video/scenes.py`, compare with `docs/study-notes/02.0x-02.10` and luminhkhuong.dev (OOP, JVM pages).

## 1. Summary

| Lesson | Clarity (1-5) | Worst section | Video change |
|---|---|---|---|
| oop | 4 | lsp-strategy | minor (inh, poly, ibas) |
| solid | 3 | lsp-rules | minor (srp-limits) |
| equals-hashcode | 4 | contract | minor (immut) |
| exception | 4 | finally-traps | no |
| hashmap | 4 | key-to-bucket | no |
| collections | 4 | set-map-order | no |
| stream | 3 | functional-interface | no |
| collectors | 3 | collect-downstream | minor (tomap) |
| optional | 3 | parallel-traps | redo box; minor anti, tomap-style "rỗng" fixes |
| java21 | 3 | sealed | minor (var) |
| jvm | 4 | memory-areas | no |
| core-diagrams | 2 | transaction | no |
| java-time | 3 | types | n/a (no video: `videoVersion "0"`, `scenes: []`) |

Cross-cutting video issue: TTS narration says **"rỗng" (empty) for `null`**. This hurts most in `optional`, where the whole point is that null is not the same as an empty Optional. Seen in optional-video lines 82, 89, 169, 173, collectors-video 142/146 and java21-video 89.

## 2. Per lesson

### oop
- **lsp-strategy**: one part covers 4 ideas (LSP definition, Square/Rectangle, the `sealed`/`record`/`withWidth`/exhaustive-`switch` rewrite, Strategy). `sealed`, `record` and switch exhaustiveness are only taught later in java21. Fix: drop the sealed/record paragraph, or turn it into a one-line forward link to java21. Make Strategy its own part (the video already skips the sealed part).
- **abstraction**: says "Open/Closed principle" without explaining it. Fix: add a half-sentence ("thêm mới bằng class mới, không sửa code cũ; xem bài SOLID").
- **interface-vs-abstract**: "chỉ có hằng số và method `default`" is incomplete. Interfaces also have abstract, `static` and (Java 9+) `private` methods, and the classify widget and trap rely on this list. Fix: list all of them. Also add the diamond problem with two `default` methods (in study note 02.01 §4, and a common follow-up question).
- **override-vs-overload**: gap vs the study note. It is missing the override rules (cannot narrow access, covariant return, checked exception not wider) and static-method hiding. Add both, as a trap and one paragraph.
- Video: `inh` starts again with "Thứ hai: kế thừa... Chó là một động vật", and `poly` starts with "Thứ ba: đa hình". Both repeat ibas/pbas, which already taught these ideas, so the numbering feels like a restart. Re-voice the first beat of each as a bridge ("Giờ xem cái giá của kế thừa..."). `ibas` says "ba chấm in ra trước, rồi mới tới Gâu", but the page never says that Dog's `speak()` calls `super.speak()` first. Add that sentence to the page.

### solid
- **srp**: two sentences, then the widget. "Lý do thay đổi = một người yêu cầu" is given but never explained. Fix: add the reason (different stakeholders change at different times, so edits collide) before the widget. The video has this; the page does not.
- **srp-limits**: the intro sets up only the aggregate case. The board then adds Transaction (COMMIT/ROLLBACK, `@Transactional`) and Performance (GC pressure) cards without any setup. The video adds "entity bị detach, LazyInitializationException" and "CPU cache", none of which is defined in this lesson. Fix: in the intro, say "3 trường hợp: aggregate, transaction, hiệu năng" and add one plain-language line each. Cut detach/LazyInitializationException from the video beat (minor re-voice) or link it to the JPA lesson.
- **ocp**: the after-text ends with "Muốn chặn mở rộng thì dùng `sealed` interface (Java 17)". `sealed` has not been taught, and right after OCP ("open for extension") it reads like a contradiction. Fix: remove it, or explain that sealed gives a closed set plus compiler-checked switches, as a trade-off with OCP.
- **lsp-rules**: 6 rules in one paragraph, made of glossary terms only ("đầu vào không chặt hơn, kết quả không yếu hơn, history constraint"). The page has no examples, so the rules must be memorised. The video gives an example per rule ("cha nhận mọi số nguyên thì con không được đòi > 0", "cha hứa không trả null..."). Fix: copy the video's examples into the page as a 6-row list or table. Name precondition/postcondition. Note that the checked-exception rule depends on the exception lesson.
- **dip**: never says what is "inverted". This is a common interview follow-up. Fix: add one line: the high-level module defines the interface and the low-level module implements it, so the dependency arrow points the other way.
- **dip-history**: "JDK proxy", "CGLIB" and "proxy" are introduced only as tooltips. Add one sentence on what a proxy is (a wrapper object Spring places in front of the bean to add transactions). "Bắt buộc có interface" overstates it: Spring 1.x/2.x could already proxy classes via `proxyTargetClass=true`, while JDK proxy was the default when an interface existed. Soften to "mặc định".

### equals-hashcode
- **integer-cache**: "Integer x = 127 thực chất gọi Integer.valueOf" and "Java unbox bằng `count.intValue()`" do not name autoboxing/unboxing. These terms come back in stream ("tránh boxing"). Fix: define both here.
- **contract**: "bucket" is used before the HashMap lesson explains it. Add "bucket = một ô của mảng bên trong". The 5 equals properties get a single line with no example, and the quiz explanation mentions "bucket chuyển thành cây", which is not taught yet. Fix: add one counter-example for symmetry (a case-insensitive equals that one class implements and the other does not). The section has no widget and no "how to write equals" part. The study note §3 (`getClass()` vs `instanceof`, null check, `Objects.equals`) is missing and is asked often. Add it as a part.
- **forgot-hashcode**: "Với JPA entity, đừng dùng `@Data`" is given without a reason. Fix: explain that `@Data` puts every field, including lazy relations and the generated id, into equals/hashCode/toString. The hash then changes after persist, and two-way relations cause StackOverflow (the jvm quiz relies on this).
- **immutable**: gap. StringBuffer is missing (study note §5, a classic "String vs StringBuilder vs StringBuffer" question), and so is "new String("java") tạo mấy object".
- Video `immut`, first beat: "Vì sao kết quả lại phụ thuộc như vậy? Vì String là immutable." This is a wrong causal link: whether `==` is true depends on compile-time vs runtime concatenation, not on immutability. Re-voice it as a bridge ("Pool chia sẻ được là nhờ String immutable").

### exception
- **hierarchy**, **checked-unchecked**, **checked-lambda**, **checked-rollback**: OK (already rewritten).
- **finally-traps**: the page intro states "finally luôn chạy" and then the catch-ordering rule. Catch ordering is unrelated and has no reason given: a subclass catch placed after its parent can never run, so javac rejects it. The page never lists the traps that the widget tests. The video does: (1) return in finally overrides try's return, (2) it swallows the exception, (3) changing a variable in finally does not change the value already returned. Fix: put those 3 traps on the page before the widget, and move the catch-order rule to the after-text with its reason.
- **try-with-resources**: "Nhiều resource đóng theo thứ tự ngược" has no reason (B may depend on A, e.g. a statement on a connection). Add it.
- **spring-design**: `@RestControllerAdvice`, traceId and HTTP status mapping are new to a Java-core learner. The after-text packs cause-chaining plus 5 anti-patterns. Fix: one line defining ControllerAdvice ("một class bắt exception cho mọi controller"), and anti-patterns as a bullet list with a one-line reason each.
- Gap: `final` / `finally` / `finalize` (study note §7) is missing. It is a classic junior question; add a card or trap.

### hashmap
- **key-to-bucket**: `^`, `>>>`, `&` are used with no worked binary example. A junior will not see why `(n-1) & hash` equals `hash % n`. Fix: add a 4-bit example (n=16, n-1=`1111`, so AND keeps the last 4 bits, which is the remainder mod 16). Also add the second reason: the result is never negative even when hashCode is.
- **resize**: `(hash & oldCap) == 0` is given without a reason. Add "oldCap là đúng 1 bit mới được thêm vào mask".
- **mutable-key**: the title already admits it covers 2 topics, and the after-text adds 4 more (JPA id hashCode, null key, iteration order, thread-safety). Fix: split thread-safety and null/order into their own part. Give thread-safety a reason (lost updates when two puts hit the same bucket or a resize happens; Java 7 head insertion could create a cycle). The Java 7 vs 8 question is also a gap vs the study note.
- **treeify**: "hash flooding" is undefined. One clause is enough.

### collections
- **set-map-order**: the quiz asks about `LinkedHashMap(16, 0.75f, true)` + `removeEldestEntry`, which is only taught in the next part (`lru`). Fix: move the quiz into `lru` and give set-map-order a TreeSet or `floorKey` quiz.
- **lru**: "LRU" is never spelled out (Least Recently Used), and the third constructor argument `true` is not named as `accessOrder`. Add both.
- **queues**: "binary heap" and "min-heap" are undefined. Top-K by min-heap is counter-intuitive, and the reason is only in the quiz explanation. Fix: move "đỉnh heap là số nhỏ nhất trong top-K hiện tại, nên có số lớn hơn thì loại nó" into the intro.
- **fail-fast**: "cursor" is undefined ("hasNext() chỉ so cursor != size"). Add "cursor = vị trí phần tử kế tiếp sẽ trả về".
- **comparator-lists**: gap. Comparable vs Comparator (study note §7, a very common question) is never contrasted. Add 2 sentences.

### stream
- **functional-interface**: the quiz asks Callable vs Supplier, but Callable and `executor.submit` are never mentioned. "Anonymous class" is also undefined, and lambda vs anonymous class is never shown side by side. Fix: add a 3-line before/after snippet, plus one line on `Callable.call() throws Exception`, or change the quiz.
- **lambda**: the title promises method reference, but the intro does not explain it or list the 4 kinds; only the widget does. "Mẹo `int[] counter = {0}` vẫn chạy (ra 6)" gives a result before saying what code produces 6. The after-text ("invokedynamic", "`Outer$1.class`", `this`) is jargon. Fix: list the 4 method-reference kinds with the equivalent lambda, show the counter snippet before its result, and reduce the after-text to the one point interviewers ask ("`this` trong lambda là object bao ngoài").
- **flatmap**: "tránh boxing" is undefined (see equals-hashcode). Link to the definition added there.
- modelAnswer says "Stream không sửa collection gốc", which no section teaches. Add one line in `lazy`.

### collectors
- **collect-downstream**: the 5-employee dataset (name, dept, salary, years) is never shown on the page, yet every result (`{Sales=2500.0, HR=3300.0...}`, "HR=Dũng") depends on it. This is the calibration problem of a result appearing before its scenario. The video shows the dataset; the page does not. Fix: add a small table at the top. The intro also packs the downstream idea plus 5 SQL mappings (WHERE, ORDER BY, LIMIT), and the quiz explanation cites the toMap duplicate-key trap from the next part. Trim to GROUP BY/COUNT/AVG/SUM.
- **tomap**: trap 2 explains internals (`requireNonNull`, `Map.merge`) but not the reason. Fix: lead with "toMap dùng `merge`, mà `merge` coi null là 'xoá key', nên cấm null".
- **maxby**: this lesson comes before optional, so `Optional` and `Optional::get` are used before Optional is taught. Add one line ("hộp có thể rỗng, xem bài Optional"). The after-text (`Function.identity()`, `BinaryOperator.maxBy`) is dense; move it to a collapsible extra.
- Video `tomap`: "value rỗng" / "giá trị rỗng" should say null.

### optional
- **optional-box**: OK on the page. Video `box` (redo): it says "rỗng" for null in 3 of 4 beats ("trả về giá trị rỗng khi không tìm thấy", "truyền rỗng vào là ném lỗi", "of nullable biến giá trị rỗng thành Optional empty"). That equates null with empty, which is exactly the distinction the scene teaches. Re-voice with a pronounceable "null" (e.g. "giá trị null", spelled "nồ").
- **optional-chain**: the after-text packs 5 APIs (`filter`, `flatMap`, `ifPresentOrElse`, `or`, `stream`), and the quiz tests `flatMap`, which appears only inside that list. Fix: give `flatMap` its own paragraph with the `Optional<Optional<User>>` example, and keep the rest as a short list.
- **anti-pattern**: "không làm tham số method" has no reason. Add: callers must wrap the value, the parameter can still be null (three states), so use overloading instead. Video `anti`: "kiểm tra rỗng kiểu cũ" and "trả về rỗng cho kiểu Optional" mean null. Re-voice.
- **parallel**: the jump from Optional to parallel stream has no bridge. ForkJoinPool, CompletableFuture, CPU-bound and I/O-bound are undefined, and concurrency comes in a later week. Fix: add a one-line bridge plus one-line definitions of thread pool and CPU-bound vs I/O-bound.
- **parallel-traps**: 3 ideas in 2 paragraphs (race condition, ordering, reduce identity/associativity). "`forEach` in `54762310`" gives output with no code. "`reduce(10, Integer::sum)` ... 50 khi song song" gives no reason. Terms "phần tử đơn vị" and "tính kết hợp" are undefined. Fix: split into 3 parts. Show the code for each output. Explain 50 = the 4 chunks each start from 10 (4×10 + 1+2+3+4). Define identity (x + 0 = x).
- **when-parallel**: the quiz asks about submitting the stream to a custom ForkJoinPool, which is not taught. Add one sentence to the intro or replace the quiz.

### java21
- **versions**: the intro omits `sealed` (Java 17), the main LTS feature for Spring Boot 3, even though the quiz explanation mentions it. Add "sealed (17)".
- **sealed**: the quiz asks about switch exhaustiveness, which is only taught 2 parts later. The section gives the syntax but not the reason (a closed set of domain states lets the compiler check every case). Fix: add the reason sentence with a forward pointer, or move the quiz to pattern-switch.
- **switch**: `instanceof` pattern matching sits inside "switch hiện đại". "fall-through" is undefined. `hours("SAT")` → 0 is shown without the code. Fix: show the snippet and define fall-through in a clause.
- **record-spring**: projection, `@ConfigurationProperties` and "proxy kế thừa class" (lazy loading) are undefined for a Java-core learner. One clause each.
- **modern**: Sequenced Collections repeats collections/comparator-lists and is one very long paragraph. The quiz explanation uses "carrier thread", which is not taught. Fix: shorten to 2 sentences that link back, and define carrier thread in one line.
- Video `var`: "gán rỗng" means `var x = null`. Re-voice.

### jvm
- **memory-areas**: uses GC, Young Gen/Eden/Survivor/Old Gen before part 4 explains generations, and has no widget. Fix: spell out GC on first use and say "chi tiết ở Phần 4" for the generations.
- **stack-heap**: "58.130 tầng ở lần chạy đầu và 42.569 ở lần sau" has no explanation of why the depth varies (JIT, frame size), so it reads like noise. `-Xss` is undefined. The quiz requires knowing that Lombok `@Data` generates toString, which is not taught here. Fix: give a range, define `-Xss`, and add one line in the quiz stem.
- **collectors (GC types)**: "Parallel ưu tiên throughput" uses throughput vs latency, which is undefined. That trade-off is the core of every "which GC" answer. Add 1-2 sentences.
- **leak**: 7 leak sources in one sentence. Several are undefined here (ThreadLocal, listener, `clear()` in a transaction). Make it a list with a one-line cause each.
- Gap vs luminhkhuong.dev and interview expectations: class loading and parent delegation, JIT (C1/C2, warm-up), and soft/weak references are absent. Consider adding one short part for class loading and JIT.

### core-diagrams
- **transaction**, **jpa**, **java-core**, **spring**, **security-cache**: each intro paragraph strings 2-3 diagrams into a single arrow chain ("proxy CGLIB → TransactionInterceptor → JpaTransactionManager ... → unbind"). It is unreadable on iPad and impossible to follow as a learner. Fix: one numbered list per diagram, a link to the source lesson per diagram, and bold only the trap step. Drop noise such as "HHH90003004".
- **security-cache**: the page names penetration/stampede/avalanche with no fixes. The video gives fixes for stampede and avalanche; add them plus the penetration fix (cache nulls or use a Bloom filter). Quiz explanations are one-word stubs ("Luôn dùng giá trị trả về.", "Đây là điểm hay bị hiểu ngược."); expand each into a reason.

### java-time
- **types**: the "bad" example uses `Instant 2026-03-08T07:00:00Z` → "03:00 ở New York". That is the exact DST switch instant. A learner who computes UTC-5 gets 02:00 and is confused, and the example shows Instant values while illustrating a LocalDateTime problem. Fix: use a normal date (e.g. 2026-02-10T07:00Z → 02:00 NY), framed as "2 server cùng gọi `LocalDateTime.now()` cùng lúc ra 14:00 và 02:00". "UTC" is never defined. Also give the reason for `OffsetDateTime` "hay dùng khi lưu database" (a fixed offset maps to `TIMESTAMP WITH TIME ZONE`; a zone rule does not).
- **dst**: the snippets use `start` without saying it is a `ZonedDateTime` in America/New_York. This matters because `LocalDateTime.plus(24h)` would not shift. "Thời gian máy" is vague. Fix: show `ZonedDateTime start = ZonedDateTime.of(2026,3,7,12,0,0,0, NY);` first.
- **gap**: the trap says a job at "02:30 mỗi ngày" can be skipped one day and "chạy hai lần vào một ngày khác". In New York, 02:30 falls in the March gap but not in the November overlap (01:00-01:59), so it is skipped and never doubled. Use 01:30 for the double run. "Dùng UTC cho lịch của hệ thống" also hides a trade-off: a business job meant for 02:30 local then drifts 1 hour across DST. Mention cron with an explicit zone.
- **formatter**: never says why SimpleDateFormat has state (it holds an internal `Calendar` field). Add it.
- **store**: the trap (`plusMonths` at month end) repeats dst's after-text and does not belong to "lưu và truyền". Replace it with a Jackson/DB zone trap.
- Gap: injecting `Clock` for testable time (a common interview and testing topic) is missing. The lesson has no video at all.

## 3. Top 5 fixes (ranked)

1. **optional video `box` + `anti` (and collectors `tomap`, java21 `var`)**: re-voice "rỗng" → "null". The narration teaches the opposite of the lesson's core distinction.
2. **core-diagrams, all sections**: turn the arrow-chain paragraphs into one numbered list per diagram with source-lesson links. This is the lowest-clarity lesson (2/5).
3. **collectors `collect-downstream`**: show the 5-employee dataset before any result. Every result in 7 sections depends on it.
4. **Quizzes on untaught content**: stream `functional-interface` (Callable), collections `set-map-order` (LRU), java21 `sealed` (exhaustiveness), optional `when-parallel` (custom pool). Move or replace each quiz, or teach the point first.
5. **solid `lsp-rules` + optional `parallel-traps`**: split the crammed lists, and add the per-rule examples (already in the solid video) and the reduce-identity arithmetic. These are the two sections closest to the exception-section-2 calibration problem.
