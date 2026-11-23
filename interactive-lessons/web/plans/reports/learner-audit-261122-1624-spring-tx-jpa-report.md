# Learner audit: Spring core, MVC/AOP, transactions, JPA (14 lessons)

Read as a junior Java dev, top to bottom: page text, quizzes, and the narration in `<name>-video/scenes.py`. References: study notes 04.01–05.07 and luminhkhuong.dev (spring-overview and spring-framework-deep-dive; the site has no isolation table and no locking page).

**Problem in every lesson:** every section is two dense `intro` paragraphs. None of these 14 lessons uses `after`, `trap` or `parts`, which the rewritten `exception` lesson uses. Page text shows almost no code, while the study notes have a "Code minh hoạ" block in nearly every section. Many sections give measured results ("Đã đo: ...", meaning "measured: ...") before the reader has been told the scenario. The video often explains things more clearly than the page, so a learner who only reads misses the "why".

## 1. Summary

| lesson | clarity (1-5) | worst section | needs video change |
|---|---|---|---|
| ioc | 3 | component-bean | minor (bean) |
| bean-lifecycle | 3 | lifecycle | minor (lifecycle) |
| auto-config | 3 | properties | no |
| mvc-flow | 3 | components | minor (hook, flow) |
| advice-aop | 2 | aop | minor (aop, async) |
| tx-proxy | 4 | interceptor | no |
| tx-pitfalls | 3 | rule | no |
| propagation | 4 | seven | no |
| isolation | 3 | anomalies | minor (levels: show the 4-level table longer) |
| tx-template | 3 | events | no |
| entity-lifecycle | 3 | states | no |
| n-plus-one | 3 | n-plus-one | minor (proxy: define N+1 before "EAGER cũng gây N+1") |
| lab-tx-bugs | 4 | self-checked | no |
| lab-jpa-perf | 3 | locking | no |

## 2. Per lesson

### ioc
- **context**: Uses "bean definition", "BeanPostProcessor", "eager" and "i18n" without defining them. "Đã đo: AnnotationConfigServletWebServerApplicationContext..." is noise for a junior. **Fix:** define a bean definition as "the recipe: class, scope, dependencies" and eager as "created at startup, not on first use". Drop or footnote the context class names.
- **circular**: The page never shows the cycle. The video says OrderService ↔ PaymentService; the page doesn't. "early reference trong 3 cấp cache" and "proxy CGLIB" are not explained. The opening quiz also mentions "3 cấp cache" before any teaching. **Fix:** start with a two-bean snippet. Add one sentence on early reference: Spring hands out a half-built A to B before A finishes. Add one line on what a proxy is: a stand-in object that forwards calls. Move the @Lazy detail into a `trap`.
- **multi-bean**: Paragraph 2 packs the strategy pattern plus 5 traps. The quiz asks about parameter-name fallback (`PaymentGateway vnpay`), which is never taught; its explanation uses `-parameters` without explaining it. **Fix:** split the strategy pattern into `after` with a code line showing `Map<String, PaymentGateway>` injection. Put the traps in `trap`. Add one sentence on name fallback before the quiz.
- **component-bean**: "gọi `repo()` trong `svc()`" refers to code the page never shows. "lite mode" is asked in the quiz but appears only in the video. There is no "why" for "không được private hay final": CGLIB must override the method. **Fix:** show the 6-line `@Configuration` with `repo()`/`svc()` first, then the true/false result. Define lite mode. Add the override reason.

### bean-lifecycle
- **thread-safe**: The quiz asks about injecting a singleton into a prototype, which is not taught in this section (or anywhere on the page; only the video covers it). The vivid "current user stored in a field → user A sees B's report" bug is only in the video. **Fix:** move that quiz to `prototype` and add the reverse-direction sentence there. Add the current-user example to the page.
- **prototype**: "đo được id 1 rồi vẫn 1 ... (2, 3) (4, 5) (6, 7)" gives results before saying that `Cart` has an incrementing id and is fetched twice. `@Lookup`, scoped proxy and "Service Locator" are undefined. **Fix:** describe the probe first ("Cart lấy id tăng dần, mỗi cách gọi 2 lần"). Give each fix one line on how it works.
- **lifecycle**: A 10-step list that uses "BPP" and "Aware" before the `bpp` section defines them. "BPP after (tạo AOP proxy)" assumes the reader knows what a proxy is. The quiz answer (ApplicationRunner / ApplicationReadyEvent) is taught only in section 6. The opening quiz and this section suggest the timing (proxy not created yet) is why `@PostConstruct` self-calls get no transaction. Self-calls through `this` never go through the proxy, even after startup, so a learner may wrongly conclude "after startup `this.txMethod()` works". **Fix:** swap the order of `lifecycle` and `bpp`, or define BPP inline. Add "`this` luôn là object gốc; timing chỉ là lý do thứ hai". Mention ApplicationReadyEvent before the quiz.
- **bpp**: Two rules come without a why: "`@Bean` trả về BFPP nên `static`", and the "not eligible for getting processed..." log. **Fix:** add the why. A non-static method forces the config class to be created before BPPs exist, so its `@Autowired`/`@Value` are skipped. Beans created that early miss later BPPs, such as the one that creates proxies.

### auto-config
- **auto-config**: Lists 4 `@Conditional*` names with no plain meaning; the video gives plain meanings. There is no worked example, and the opening ObjectMapper case is never tied back. The custom-starter experiment appears only in the video. **Fix:** add one line per condition. Add an `after` that walks through the ObjectMapper case: `@ConditionalOnMissingBean` sees your bean, so Boot backs off.
- **run**: Nine event names to memorise with no "why it matters". The quiz's "chạy async" appears only in the video. **Fix:** keep 3 milestones: refresh (beans + web server), runners, Ready. Explain that a slow runner delays Ready, so readiness/traffic waits.
- **properties**: Shows the bind result `PaymentProperties[url=..., timeout=PT3S, retry=2]` before showing the yml or the record, which is the calibration problem exactly. "relaxed binding", "SpEL" and "PT3S" are undefined. **Fix:** show the yml + record first, then the result. Define relaxed binding (`payment.url` = `PAYMENT_URL` = `paymentUrl`) and PT3S (ISO-8601 for 3s).
- **precedence**: The quiz assumes `PAYMENT_URL` maps to `payment.url`, but the env-var naming rule is never taught. **Fix:** add the rule: uppercase, dots → `_`, dashes removed.
- **actuator**: "Đừng đưa kiểm tra DB vào liveness" ("don't put the DB check in liveness") has no why on the page; only the quiz and video give it. "pod", "liveness" and "readiness" are undefined. **Fix:** define the two probes in one line each. Add the cascade-restart reason. Drop `server.port=-1`, or put it in `trap`.

### mvc-flow
- **(lesson-wide)**: "advice" is used for `@RestControllerAdvice` ("advice trả 404"). The next lesson uses "advice" for AOP advice, and `@ExceptionHandler`/aspects aren't taught until advice-aop. **Fix:** always write "`@RestControllerAdvice`". Add a one-line forward note for aspect/AOP. The hook narration says "Advice trả về bốn trăm"; change it to "Controller Advice".
- **flow**: The three-request results ("exception → advice trả 404; body sai → 400") come before saying which exception (OrderNotFound) or which body. "Front Controller" is defined only in the video. **Fix:** state the three requests first (`GET /orders/1`, `GET /orders/0` throws NotFound, `POST` with blank customer), then the outcomes.
- **components**: Seven class names in one sentence with no role each; the video gives the roles. **Fix:** make it a list of "class: what it does", or a table.
- **filter-interceptor-aop**: The quiz answer (`preHandle` returns false) is never taught on the page. "MDC" and "forward/include/async dispatch" are undefined. **Fix:** add "preHandle trả boolean; false = dừng chuỗi". Define MDC as a per-thread map that logs read for traceId.
- **request-data**: The quiz on `@Min` without `@Validated` (Spring 6.1 method validation) is not on the page. The video's "unknown JSON field is silently ignored → null" is missing from the page. **Fix:** add both.

### advice-aop
- **problem-detail**: Paragraph 2 packs 4 ideas. "đừng khai báo trùng handler cho MethodArgumentNotValidException" ("don't declare a duplicate handler for MethodArgumentNotValidException") has no why: startup fails with an ambiguous @ExceptionHandler. **Fix:** split the "không có advice thì sao" part into `after` and add the why.
- **validation**: Three exceptions from three layers in one sentence. The groups scenario ("id required on update") is only in the video. "method validation" is undefined. **Fix:** a 3-row table (where → exception → status). Tell the OnUpdate scenario before `@Validated({OnUpdate.class, Default.class})`.
- **aop**: The worst section. One sentence defines aspect, advice (5 types), pointcut, proxy, target, BPP, CGLIB and AspectJ weaving. `pjp`/`ProceedingJoinPoint` is used undefined. Join point is never mentioned, though it is a standard interview term and is named on luminhkhuong.dev. The pointcut DSL (`execution(...)`) and aspect ordering (`@Order`) are missing. **Fix:** split into a `parts` item. (a) Terms, one line each including join point, with the `@Around` code snippet. (b) How the proxy works, with the "why CGLIB can't touch private/final" reason. Add `execution(* com.shop..*Service.*(..))` and `@Order` on aspects.
- **async**: Five measurements in one paragraph. The text says "`@TransactionalEventListener(AFTER_COMMIT)` vì thread mới không có transaction của caller" ("because the new thread has no transaction of the caller"); that reason is a non sequitur. The real reason is: send only if the order actually committed, and so the async thread can read the committed row. That listener is also not taught until tx-template. **Fix:** correct the reason and add "(xem bài TransactionTemplate)". Move the executor defaults into `after`.
- **Gap**: The study note 04.05 §6 `@Scheduled` (single thread by default) is not covered.

### tx-proxy
- **proxy**: The quiz asks whether method-level settings override class-level ones; this is not taught on the page. **Fix:** add one sentence: method beats class; the pattern is a readOnly class with writable methods.
- **cglib-jdk**: "gọi method final trên proxy thì field repo là null" ("call a final method on the proxy and field repo is null") has no why; the video doesn't give one either. **Fix:** the proxy is a separate instance built without running constructors or injection, and a final method runs on that instance instead of being forwarded to the target.
- **interceptor**: Starts with "Đọc metadata thành..." and has no subject. "checked exception mặc định vẫn commit" ("checked exceptions commit by default") is a rule with no why; tx-pitfalls gives the EJB reason. The quiz about "Participating in existing transaction" is not taught here ("Chi tiết ở bài Propagation", "details in the Propagation lesson"). **Fix:** begin "TransactionInterceptor làm 6 bước:" and number them. Add the one-line EJB reason. Replace the quiz or teach REQUIRED-joins in one sentence.

### tx-pitfalls
- **rule**: The `active=true/false` and `repoNull` probe labels are used everywhere but defined only at the end (`isActualTransactionActive()`). The quiz uses REQUIRES_NEW, which is only taught in the next lesson. The import scenario ("mong mỗi dòng một transaction", "expect one transaction per row") is only in the video. **Fix:** open with "Probe: in `isActualTransactionActive()` ngay trong method". Split the 3-group taxonomy and self-invocation into two blocks. Tell the importOrders goal first. Change the quiz to plain `@Transactional`.
- **visibility**: The quiz answer cites Objenesis, which the page never mentions. The Kotlin details are noise for Java juniors. **Fix:** add the "proxy built without constructor/injection" sentence (same as tx-proxy). Move Kotlin into `trap`.
- **rollback**: Good. It lacks the video's sharpest point: the caller sees an exception and thinks it failed while the row is saved. Add it.
- **swallow**: "exception từ bean khác đã đánh dấu rollback-only" ("an exception from another bean has already marked rollback-only") only holds when that bean's method joined the same transaction (REQUIRED), and the page doesn't say so. **Fix:** add "(khi bean đó tham gia cùng transaction, REQUIRED)".
- **thread**: Paragraph 2 is a grab bag. "nhầm `jakarta.transaction.Transactional`" ("mistakenly using `jakarta.transaction.Transactional`") reads as if it doesn't work. Spring does honour it; it only lacks readOnly/isolation. **Fix:** reword. Move the other causes into a checklist `after`.

### propagation
- **logical**: The page never defines "propagation". The video does: "đã có transaction đang chạy thì method làm gì?" ("a transaction is already running, so what does this method do?"). **Fix:** add that as the first sentence.
- **seven**: A dense list of 7. The line "SUPPORTS ... vẫn có tên (`demo.InnerService.supports`)" confuses more than it helps. **Fix:** a 7-row table (có tx / chưa có tx) and drop the SUPPORTS name detail.
- **requires-new**: Missing from the page, though the video has it: inner cannot see outer's uncommitted data. Missing everywhere: inner updating a row the outer has locked waits on itself (lock wait / self-deadlock). **Fix:** add both to a `trap`.
- **nested**: "savepoint" is undefined. The why ("Hibernate không quay lại được persistence context", "Hibernate can't roll back its in-memory state") comes last, after the trap. **Fix:** define a savepoint as a bookmark you can `ROLLBACK TO` inside one transaction. Put the Hibernate reason right after the exception.

### isolation
- **anomalies**: The page never defines "isolation level" and never lists the 4 levels with the anomalies each one prevents. That table is the classic interview question and is study note 05.04 §2; it is also absent on luminhkhuong.dev. The quiz (SERIALIZABLE → retry) is taught only in write-skew. The H2 dirty read "B đọc 999" gives a result with no setup (which level, who wrote 999). **Fix:** add the 4×3 table plus a one-line definition. Tell the H2 setup (READ_UNCOMMITTED, A sets 999 without committing). Move the quiz to write-skew.
- **mvcc**: Uses "persistence context" (taught later in entity-lifecycle). **Fix:** define it inline: Hibernate's per-transaction map of loaded entities.
- **lost-update**: Five outcomes in one sentence. "optimistic/pessimistic lock" are named only in the video. The atomic UPDATE SQL is never shown. **Fix:** a 3-row table (atomic `UPDATE ... SET stock = stock - 1 WHERE id=? AND stock >= 1`; `@Version` = optimistic; `FOR UPDATE` = pessimistic) giving the result and when to use each.
- **readonly**: Uses dirty checking and flush mode (taught later). The quiz mentions LazyInitializationException/open-in-view (taught in n-plus-one). **Fix:** define dirty checking in one line. Remove the OSIV part of the quiz answer.
- **long-tx**: "idempotency key" and "outbox" are undefined. Add one line each, or link forward.

### tx-template
- **template**: "`ok=3 failed=1`, `b-3` sau dòng lỗi vẫn lưu" ("b-3 after the failing row is still saved") gives a result with no setup. The video says "4 rows, row 3 duplicates row 1", and the label "b-3" doesn't match that. There is no `execute(status -> ...)` snippet, so `status.setRollbackOnly()` appears out of nowhere. The quiz (template inside `@Transactional` joins it) is only in the video. **Fix:** show the snippet, tell the batch first, align the labels, and add the joining sentence.
- **events**: How to publish (`ApplicationEventPublisher.publishEvent`) is never shown. The `@Order`/`afterCompletion` ordering detail is too deep. The quiz's `fallbackExecution` is not taught. **Fix:** add a publish + listener snippet. Move the ordering detail to `trap` or drop it. Teach fallbackExecution.
- **testing**: "id sequence chưa INSERT tới khi flush" ("id sequence: no INSERT until flush") is garbled. The point is that with SEQUENCE ids the INSERT waits until flush; with IDENTITY it runs at `save`. **Fix:** reword, and say the trap depends on the id strategy.

### entity-lifecycle
- **states**: "persistence context" is the core concept of the lesson, but it is defined only in section 4. "OSIV" is never expanded on the page. "lazy load" comes before n-plus-one. The quiz (findById then copy DTO fields, versus merge) is taught only in the next section. **Fix:** move the one-line persistence context definition into section 1 or 2. Expand OSIV. Move the quiz to persist-merge.
- **first-level**: The quiz about `clear()` vs `detach()` is not taught; detach is never mentioned. `HHH000026` is noise. **Fix:** add one sentence on detach.
- **flush**: The measurement "persist 0; JPQL bảng khác 0; JPQL Customer 1; native 2" comes without a setup (what was persisted). "IDENTITY" is undefined and has no why: the DB must generate the id, so the INSERT runs now. It also contradicts "try/catch quanh save không bắt được vì INSERT lúc commit" ("try/catch around save can't catch it because the INSERT runs at commit"), since with IDENTITY it does catch it. **Fix:** tell the setup. Define the id strategies. Qualify the try/catch claim as "với SEQUENCE / khi INSERT bị hoãn".

### n-plus-one
- **fetch-type**: Uses "N+1" before section 3 defines it. EAGER/LAZY have no plain definition. `Invoice` appears with no model, and there is no why for EAGER causing N+1 (JPQL ignores fetch type, then loads each EAGER association separately). **Fix:** move the N+1 definition into the lesson intro. Define LAZY as "loaded on first access" and EAGER as "loaded with the parent". Show the entity model (Order→items, Order→customer, Invoice→customer EAGER). Add the why.
- **osiv**: "OSIV" is never expanded on the page. "200, body 3, 2 query" has no setup. **Fix:** expand it and describe the endpoint.
- **n-plus-one**: The four fixes are only numbers ("JOIN FETCH 1, @EntityGraph 1, batch 4 → 4, 50 → 2"). The page never says what each fix is or how batch fetching works, and the quiz depends on it. "Hibernate 6 không còn nhân bản parent" ("Hibernate 6 no longer duplicates the parent") lacks context (the old DISTINCT need). **Fix:** use `parts` with one block per fix (a code line plus the resulting SQL). Explain batch fetching: it loads lazy children for up to N ids in one `IN (...)` query.
- **traps**: Why pagination is done in memory ("LIMIT cắt theo dòng join", "LIMIT cuts on joined rows") appears only in the quiz options. **Fix:** put it in the page text.

### lab-tx-bugs
- **setup**: The quiz cites "bài 4" (bug 4) before bug 4 is shown. Why the test base has no `@Transactional` appears only in the opening quiz and the video. The initial stock (Keyboard 10) is not stated. **Fix:** add the why sentence and the stock 10, and move the quiz to audit-loyalty.
- **self-checked**: Bug 1 doesn't say which request was used. It needs: "orderFailingOnSecondLine: line 1 deducts 2 Keyboard and commits, line 2 fails". "Bản sửa qua `OrderService`" ("the fix goes through OrderService") is unclear. **Fix:** name the request and say "gọi `reserveStock` qua bean `StockService` khác" ("call `reserveStock` through another bean").
- email, audit-loyalty: OK. The Kotlin notes in the checklist video are not on the page (minor).

### lab-jpa-perf
- **n-plus-one**: The "batch 50 → 3" result conflicts with "50 → 2" in the n-plus-one lesson, and the page doesn't explain it. **Fix:** say there is one query per level: orders, items, products.
- **locking**: Stock 9 appears without saying it is the correct outcome. In the isolation lesson, 9 was the lost-update bug, so learners will read it as a failure. Why the atomic UPDATE works (row lock, then re-check) is only in the video. **Fix:** add "9 là đúng: bên thua bị từ chối, không mất lượt im lặng; phải retry" ("9 is correct: the loser was rejected, not silently lost; it must retry"). Add the atomic UPDATE mechanism and the pool arithmetic for the barrier hang.
- **explain**: The key composite-index rule ("cột so sánh bằng trước, cột sắp xếp sau", "equality columns first, sort column last") is only in the video. Filter vs Index Cond is explained only in the quiz. **Fix:** add both to the page.

## 3. Top 5 fixes, ranked

1. **Define each concept before it is used, across lessons.** Proxy is used from ioc and bean-lifecycle onward but explained only in advice-aop/tx-proxy. Persistence context, dirty checking and flush are used in isolation but taught in entity-lifecycle. N+1 is used before it is defined in n-plus-one. OSIV, BPP and savepoint are never expanded on the page. Add one-line inline definitions at first use.
2. **advice-aop `aop`: split the terminology dump.** Use `parts`: terms including join point with an `@Around` snippet, then how the proxy works and why private/final fail. Add `execution(...)` and aspect `@Order`. Fix the wrong `AFTER_COMMIT` reason in `async`.
3. **isolation `anomalies`: add the 4-level × 3-anomaly table and a definition of isolation level.** Add the lost-update 3-fix table naming optimistic/pessimistic. This is the top interview gap against the study note, and luminhkhuong.dev doesn't cover it either.
4. **Tell the setup before showing measured results.** Worst cases: auto-config `properties`, bean-lifecycle `prototype`, tx-template `template`, entity-lifecycle `flush`, mvc-flow `flow`, lab-tx-bugs bug 1, isolation H2 dirty read. Show a short code/scenario line first, then the result. Add the "stock 9 is correct" note in lab-jpa-perf.
5. **Align quizzes with the page text.** About 14 quizzes test facts that appear only in the video or a later lesson: ioc multi-bean and component-bean, bean-lifecycle thread-safe and lifecycle, mvc filter and request-data, tx-proxy proxy and interceptor, tx-pitfalls rule, isolation anomalies and readonly, tx-template template and events, entity-lifecycle states and first-level, lab-tx-bugs setup. Add the missing sentence or move the quiz. Also move the video-only "why"s into the page text, e.g. the liveness cascade, the ApplicationRunner delaying Ready, and why LIMIT is skipped.
