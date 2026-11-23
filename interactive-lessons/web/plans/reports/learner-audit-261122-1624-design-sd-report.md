# Learner audit: design patterns, LLD, system design, STAR, weekly quiz

Scope: lld-1, lld-2, patterns-creational, patterns-structural, patterns-behavioral-1, patterns-behavioral-2, sd-concepts, sd-practice, star-story, weekly-quiz. I read them as a junior Java dev going top to bottom. Sources: `web/src/data/lessons/*.ts`, the `*-video/scenes.py` files, study notes 10.01, 10.02 and 07, and the luminhkhuong.dev design-patterns overview.

Course order matters here. The "Patterns và LLD" course comes straight after Java Core and **before** the Concurrency, Spring and JPA courses. So any mention of `@Transactional`, CGLIB, `synchronized`, `AtomicLong`, `ConcurrentHashMap.compute`, `@Version`, Redis `INCR/SET NX EX` or Lua in these lessons is a forward reference for a learner who follows the course order.

## 1. Summary

| Lesson | Clarity (1-5) | Worst section | Video change |
|---|---|---|---|
| lld-1 | 3 | rate-limiter | no (no video) |
| lld-2 | 4 | elevator | no (no video) |
| patterns-creational | 4 | singleton | no (no video) |
| patterns-structural | 3 | proxy | no (no video) |
| patterns-behavioral-1 | 4 | template-method | no (no video) |
| patterns-behavioral-2 | 3 | visitor | no (no video) |
| sd-concepts | 2 | cache-queue (data is close behind) | no. The video is clearer than the page, so port its wording to the page. |
| sd-practice | 3 | checkout | no. Same as above: the video tells the race before the fix, the page does not. |
| star-story | 4 | behavioral | no |
| weekly-quiz | 4 | cards | minor: scene `cards` |

Recurring problem in all four pattern lessons and lld-1: in the change-impact cards, the "ok" outcome often reports a run result that does not answer the scenario's question. Examples are listed below. A learner reads "Thêm Caramel → Espresso + Milk + Sugar = 4.5" and cannot connect the answer to the question.

## 2. Per lesson

### lld-1
- **khung**: Step 5 says "nhiều tầng em dùng Composite, nhiều cổng... đồng bộ, nhiều server... Redis". Composite was taught one lesson earlier, so that part is fine. "Đồng bộ trên tập chỗ" is vague, though. Fix: add one clause, e.g. "hai cổng cùng chọn chỗ M1, nên chọn chỗ và đánh dấu đã dùng phải là một thao tác nguyên tử (xem lld-2)".
- **parking-lot**: The "Thêm xe điện" ok outcome reports the spot-allocation run ("xe máy vào S1, ô tô vào M1 và M2..."). It says nothing about an electric car. Fix: put that run result under a separate scenario ("Chọn chỗ khi chỗ vừa đã đầy"), and make the EV outcome only "thêm `EV(MEDIUM)` vào enum, `park()` không đổi". Also, the bad-side code uses `hours`, which is never defined (`int min` is the parameter). Use `ceil(min/60.0)` so it matches the rounding trap.
- **rate-limiter** (worst):
  - The intro names three algorithms and only *labels* their trade-offs. It never says how each one works.
  - The second card is titled "Sliding log hoặc Token bucket", but its code shows only the token bucket. The sliding log is never shown or described beyond "nhớ mọi mốc thời gian".
  - "Burst" is used before it is defined.
  - The token bucket result "lúc 0s được 5 trong 6, lúc 2s được thêm 2 trong 3" has no setup. The learner was never told that 6 requests arrive at 0s and 3 at 2s.

  Fix: split into three cards (fixed window / sliding log / token bucket). Give each a one-line mechanism in plain words, e.g. "log: giữ timestamp của mỗi request, bỏ cái cũ hơn 60s, đếm phần còn lại", and state the request timeline before each result. Define burst once ("nhiều request dồn vào một khoảnh khắc").
- **rate-limiter after/trap**: `synchronized`, `AtomicLong`, Redis `INCR`+`EXPIRE` and Lua are forward references (see the course-order note). Fix: add a short gloss or a "xem bài sync / redis-patterns" pointer. Also say *why* `INCR` then `EXPIRE` needs Lua: the two commands are not atomic, so if the app crashes between them, the key stays forever without a TTL.

### lld-2
- **movie-ticket**:
  - `putIfAbsent`, `compute`, `@Version`, `UPDATE ... WHERE status='FREE'` and `SET NX EX` are all forward references.
  - The `compute` line packs the expiry logic into one ternary with no walk-through.

  Fix: read the `compute` lambda in words ("nếu chưa ai giữ hoặc hold cũ đã hết hạn thì tạo hold mới, ngược lại giữ nguyên"). Add a pointer to the sync, locking and redis-patterns lessons.
- **elevator** (worst):
  - The trap "Luôn chọn tầng gần nhất có thể bỏ quên tầng xa" describes a third strategy (shortest-seek-first) that was never introduced. The learner wonders where it came from.
  - The starting direction (UP) is assumed but not stated, even though `[5,7,9,3,1]` depends on it.
  - Minor fact: what the code does (turn around at the last request) is strictly LOOK. SCAN goes to the end floor. Not wrong for an interview, but a one-line note avoids a "gotcha".

  Fix: state "thang đang đi lên", name the nearest-first strategy before the trap, and add "(chính xác là LOOK, biến thể của SCAN)".
- **elevator after**: It says "Mô hình hoá bằng State", but the code uses a plain `dir` enum. Fix: say that the `dir` enum is the simple form, and the State pattern is needed once each state handles requests differently (e.g. DOOR_OPEN ignores move).
- connect-four and ghep-pattern: OK.

### patterns-creational
- **singleton** (worst):
  - The trap is about double-checked locking + `volatile`, but DCL code is never shown, and "thấy object chưa khởi tạo xong" has no why (instruction reordering).
  - The reflection scenario is shown only for `LazyBad` and enum. The learner may infer that Holder also blocks reflection, but it does not.
  - "Serialization" in the verdict is unexplained.

  Fix: show the 5-line DCL snippet in the trap, plus one sentence ("`new` gồm cấp phát, gán tham chiếu, chạy constructor; CPU/JIT có thể gán trước khi constructor xong"). Add "Holder vẫn bị reflection phá, chỉ enum chặn được". Either explain serialization ("deserialize tạo object mới") or drop it.
- **factory-method**:
  - The roadmap says "để class con quyết định tạo gì", but the intro never says it. The intro only says "đưa `new` vào một method".
  - The good side does not show where the `if (channel...)` went. A learner asks: who picks `EmailNotifier`?
  - The JDK examples `Calendar.getInstance()`, `List.of()` and `Integer.valueOf()` are *static factory methods*, not the GoF subclass-based Factory Method. Interviewers do pick on this.

  Fix: one intro sentence on the subclass decision. Show `Map<String, Notifier>` or a config/DI choosing the notifier in one place. Relabel the JDK list as "static factory (dạng simple factory)" and give the GoF example as `Collection.iterator()`.
- abstract-factory, builder, prototype, cheatsheet, chon-pattern: OK.

### patterns-structural
- **proxy** (worst):
  1. Proxy and Decorator both "bọc, cùng giao diện", and the lesson never says how they differ. Worse, the proxy example adds *logging*, which is the decorator's job. Fix: add a trap or after line: "khác ở ý định: Decorator thêm tính năng, client tự bọc; Proxy kiểm soát truy cập (cache, quyền, lazy, remote), thường do framework tạo, client không biết."
  2. The "Tắt cache khi test" ok outcome reports "3 lần load nhưng chỉ 2 lần gọi thật", which is the cache effect, not disabling it. Fix: move that result to a "Gọi load 3 lần" scenario.
  3. The `Proxy.newProxyInstance(loader, ..., (p, m, args) -> ...)` lambda is unexplained, and CGLIB is undefined. Fix: add "`m` là method được gọi, `args` là tham số; JDK proxy cần interface, CGLIB tạo class con khi không có interface".
  4. The trap and quiz on `@Transactional` self-invocation rely on Spring and transaction lessons that come later in the course. Fix: add a one-line explanation of what a bean proxy is, plus a link to tx-pitfalls. Alternatively, ask the quiz in pattern terms ("gọi `this.load()` bên trong RealService có qua CachingProxy không?").
- **decorator**:
  - The core mechanism is never shown. The learner sees `new Sugar(new Milk(new Espresso()))` but not that `Milk implements Coffee` holds a `Coffee` and delegates `cost() + 1`.
  - The "Thêm Caramel" outcome prints a Milk+Sugar result, with no Caramel in it.

  Fix: add the 4-line `Milk` class, and use a result that includes Caramel, or separate the two.
- **composite**: The bad side has "Thêm thao tác mới". The good side swaps that scenario for "Tính tổng dung lượng", which quietly hides that Composite also needs every class edited when you add an operation (the Visitor problem). Fix: keep the same scenario and answer honestly ("thêm method vào `Node` và mọi class; nếu hay thêm thao tác thì xem Visitor").
- **flyweight**: The intro says extrinsic state (position) is passed in from outside, but the code never shows it. Fix: show `draw(glyph, x, y)` or a `record Pos(Glyph g, int x)`.
- adapter, facade, bridge: OK.

### patterns-behavioral-1
- **template-method** (worst):
  - The section says "Template Method dùng kế thừa, Strategy dùng composition", then cites `JdbcTemplate` as the example. A card repeats "JdbcTemplate là Template Method". In fact `JdbcTemplate` is used by passing callbacks (`RowMapper`, `PreparedStatementCreator`), not by subclassing. That is composition, so the example contradicts the rule just taught.
  - The hook example: "Json override `validate()` trả `false` nên ra `[open, read json, save]`". This reads as "invalid data still saved", which is confusing.
  - "Hollywood Principle" is undefined.

  Fix: use `HttpServlet.service()` / `AbstractList` as the pure examples, and describe JdbcTemplate as "template + callback, gần Strategy". Rename the hook to `shouldValidate()`. Gloss Hollywood as "đừng gọi tôi, tôi sẽ gọi bạn: class cha gọi xuống class con".
- **strategy**: "Rule of Three" is not defined. The "Thêm loại Hoả tốc" outcome lists only existing types. Fix: define it in-line ("lặp lại lần thứ ba mới tách"), and add `"SAME_DAY", w -> ...` to the run result.
- observer, command, state: OK.

### patterns-behavioral-2
- **visitor** (worst):
  - The Visitor mechanism (double dispatch) is never shown. The only code is `interface Shape { <R> R accept(Visitor<R> v); }`. A junior cannot work out how `accept` reaches the right method, and "Ngược với kế thừa thông thường" is vague.
  - The "9.14" total has no setup (which shapes, which sizes).
  - The bad-side scenario "Class thuộc thư viện, không sửa được" is never answered. Classic Visitor also needs `accept()` in each class.

  Fix: show a `Visitor<R>` with `visitCircle` and `visitRect`, plus `Circle.accept(v) { return v.visitCircle(this); }`. Add one sentence: "hai lần chọn method: theo kiểu shape, rồi theo kiểu visitor". State the shapes before the result. Drop or answer the library scenario.
- **chain**: The "Bật tắt một bước" ok outcome lists the four run outputs (401, 429, 400, 200) instead of how to toggle. Fix: answer "bỏ handler khỏi list theo profile/config", and move the run outputs to a "Chạy 4 request mẫu" scenario.
- **interpreter**: The bad side is about *parsing a string*. The good side builds the tree by hand, so the parsing problem is not solved and the comparison is apples to oranges. Fix: add "Interpreter không lo phân tích chuỗi; cần một parser dựng cây, rồi cây tự tính".
- **mediator after**: `ExecutorService` as a Mediator example is a stretch, and `DispatcherServlet` is usually called Front Controller. Fix: keep the chat room and air-traffic control examples, and drop ExecutorService.
- **iterator trap**: It says removing the second-to-last element does not throw, with no why. Fix: "vì `hasNext()` thấy cursor == size và dừng trước khi kiểm tra modCount".
- memento: OK. Nit: the public `record` accessor technically exposes state. Acceptable.

### sd-concepts (lowest clarity)
This lesson repeats the `exception` part-2 problem at a larger scale. Each section is two paragraphs carrying 8 to 15 concepts. Many terms are only named. Rules are stated without a why.
- **scale**: Paragraph 2 packs reverse proxy, SSL termination, LB, L4/L7, health check, API gateway, forward proxy and gateway scaling into one sentence chain. Fix: split it into a 3-row compare or cheat list (reverse proxy / LB / gateway: who it stands in front of, what it does, one example).
- **cache-queue** (worst):
  - Five cache tiers, cache-aside, write-through, write-behind, an inventory rule, queue benefits, Kafka vs RabbitMQ, at-least-once, idempotency, `processed_event` and DLQ, all in two paragraphs.
  - Rules without a why: "ghi thì cập nhật DB rồi **xoá** key" (why not update the key: two concurrent writers can leave a stale value) and "Không dùng số tồn kho trong cache để quyết định bán" (the cache can be stale, so it can oversell).
  - Stampede and avalanche are explained in the video (scene `cachequeue`) and appear in the model answer together with penetration. The page text never covers them.

  Fix: split into two sections (cache / queue), add the two whys, and add stampede, penetration and avalanche from note 10.01 lines 143-145.
- **data**:
  - "CP/AP" is only labelled. The video explains it well: "chọn C là báo lỗi thay vì trả dữ liệu sai". The page does not.
  - "C của CAP khác C của ACID" has no explanation.
  - "Consistent hashing" is undefined.
  - "hash % N chuyển gần hết dữ liệu" has no why.
  - `LazyConnectionDataSourceProxy` has no why. Note 10.01 line 250 has it: the connection must be taken after the readOnly flag is set.
  - "Read-your-own-writes" is named but not described.

  Fix: port the video's CAP sentence. Add one line each: CAP-C means every node sees the latest write, ACID-C means constraints hold; consistent hashing places nodes and keys on a ring, so adding a node moves only its neighbour's keys; and the read-your-own-writes example from the note.
- **resilience**:
  - The quiz asks for the Resilience4j default Retry/CircuitBreaker order, which the page text never teaches. Its explain is "Theo thứ tự aspect mặc định", which gives no reason.
  - p99, jitter and bulkhead are undefined.

  Fix: add the order to the intro, with the consequence that each retry attempt counts as a failure for the breaker, so the breaker opens faster. Gloss p99 and jitter.
- **saga-ops**: Saga, outbox, 2PC, rate limiting and observability are four topics in one section. "2PC chậm và dễ treo" has no why, and choreography vs orchestration is only named. Fix: split saga+outbox from rate-limit+observability. Describe the outbox *problem* first ("ghi DB xong rồi gửi Kafka, nếu crash ở giữa thì mất event"), then the fix.
- **microservices**: OK, though "strangler fig" deserves a gloss.
- Opening quiz: ShedLock is unexplained. Add "khoá trong DB để chỉ một instance chạy job".

### sd-practice
- **framework**, **estimate**: Both quiz explains are unrelated to their questions ("Ước lượng phải dẫn tới quyết định" under a question about design choice, "Đừng quên tính peak" under a question about what to do with low RPS). Fix: rewrite the explains to justify the answer.
- **shortener**:
  - One paragraph covers API, table, cache flow, three code-generation methods and Base62 outputs. Base62 is never defined, and the alphabet order behind `encode(1e9) = 15FTGg` (0-9, a-z, A-Z) is not stated.
  - "Sequence" is undefined, and "đoán được" has no why (people can enumerate other users' links).

  Fix: split API+flow from code generation. Add "Base62 = 0-9, a-z, A-Z; viết số id theo cơ số 62" and the enumeration risk. The outputs check out (verified by hand).
- **checkout** (worst):
  - The page shows the conditional `UPDATE` before telling the race. The video tells it first ("Hai request cùng đọc tồn kho bằng một, cùng trừ, là bán hai cái"). This is the calibration problem: the result appears before the scenario.
  - Rules without a why on the page:
    - sort by `productId` (video: to avoid deadlock);
    - catch `DataIntegrityViolationException` *outside* `@Transactional` (the transaction is already marked rollback-only, so the re-read must happen in a new one);
    - "Không gọi payment trong transaction" (it would hold a DB connection and row locks during a slow network call).
  - The quiz on reserving stock at order time with an expiry job is only in the video ("Đơn quá hạn thì job huỷ đơn và trả kho"), not in the page.

  Fix: open with the race sentence. Split into oversell / idempotency / payment+webhook. Add the three whys and the reservation sentence.

### star-story
- **behavioral** (worst): Eight topics with their "what they look for" sit in one comma-separated paragraph that is hard to scan. The video uses cards. Fix: render it as a `cheat` list (topic → what to show → one pitfall).
- **intro / labs**: References to "note 09" and "dòng Dự án trong nhật ký học tập" mean nothing to a web-only learner. The labs section leans on `@Version` and Testcontainers. Fix: link the lab lessons or replace the note references with on-page wording. Port the video's concrete concurrency example (lost update, then `OptimisticLockException`) into the labs text. The labs quiz explain ("Nhấn vào chỗ em tự quan sát...") does not justify the answer.
- **reverse**: The quiz "Vì sao em muốn chuyển việc?" is not taught anywhere on the page. Fix: add one sentence on it to the intro.
- Non-learner nit: the file comment says "Video not rendered yet", but the lesson has a `videoVersion` and scenes, so the comment is stale.

### weekly-quiz
- **method**: "Spaced repetition" is defined as "làm lại ở tuần sau", which is a fixed one-week interval. Fix: "khoảng cách ôn tăng dần: sai thì tuần sau, đúng lại thì 2 tuần sau", or call it simply "ôn lại câu sai".
- **cards**: The video (scene `cards`) calls the HashSet, fixed-pool and stampede cards "thẻ đầu tiên / thứ hai / thứ ba". In the widget they are week 1 card 2, a week 3 card and a week 7 card. Minor video fix: say "một thẻ tuần 1 / tuần 3 / tuần 7".
- final: OK. The thread-pool arithmetic is correct.

## 3. Top 5 fixes, ranked by impact

1. **sd-concepts, every section**: split the dense paragraphs (cache vs queue, saga+outbox vs ops) and add the missing whys (delete vs update key, CAP meaning, consistent hashing, LazyConnectionDataSourceProxy, read-your-own-writes). Add stampede, penetration and avalanche, which are in the video and model answer but not the page. Teach the Retry/CB order before quizzing it.
2. **sd-practice `checkout`**: tell the oversell race before the `UPDATE` fix, and add the whys for the productId ordering, catching outside `@Transactional`, and no payment call inside the transaction. Add the reservation-with-expiry sentence the quiz depends on.
3. **Fix mismatched change-impact outcomes across the pattern and LLD lessons**: lld-1 EV, structural Caramel, structural "Tắt cache", behavioral-2 "Bật tắt một bước", composite "Thêm thao tác mới". Each ok text must answer its own question.
4. **Show the missing mechanism code**: the Visitor double dispatch (`accept` → `visitX(this)`), the Decorator class body (`Milk` holding a `Coffee`), and the three rate-limiter algorithms as separate cards with their request timelines stated first.
5. **Proxy vs Decorator, and the JdbcTemplate contradiction**: add the intent difference to the proxy section. Stop calling JdbcTemplate a pure Template Method in a section whose rule is "Template Method = kế thừa". Also fix the static-factory vs GoF Factory Method labelling. Add short glosses or links for the forward references to Spring, transaction and concurrency topics, since these lessons come before those courses.
