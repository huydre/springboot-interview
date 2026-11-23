# Learner re-audit: Spring core, MVC/AOP, transactions, JPA (14 lessons)

Fresh read of the current `src/data/lessons/*.ts` as a junior Java dev, compared with `learner-audit-261122-1624-spring-tx-jpa-report.md`. Widgets spot-checked against prose (flush-timing, orders-fetch, n-plus-one, readonly, tx-active): numbers match. The old "problem in every lesson" (dense intro, no parts/trap/predict/takeaway) is gone. What remains is mostly local.

## 1. Summary

| lesson | old | new | worst remaining section | verdict |
|---|---|---|---|---|
| ioc | 3 | 4.5 | circular (bridge) | fixed |
| bean-lifecycle | 3 | 4 | prototype (quiz vs part) | improved |
| auto-config | 3 | 4 | graceful-shutdown | improved |
| mvc-flow | 3 | 4 | components (quiz) | improved |
| advice-aop | 2 | 4 | pointcut-designators | improved |
| tx-proxy | 4 | 4.5 | manager (quiz) | fixed |
| tx-pitfalls | 3 | 4 | thread (grab bag) | improved |
| propagation | 4 | 4.5 | seven (quiz) | fixed |
| isolation | 3 | 4 | mysql-next-key | improved |
| tx-template | 3 | 4 | testing | improved |
| entity-lifecycle | 3 | 4 | repo-auditing | improved |
| n-plus-one | 3 | 4 | osiv | improved |
| lab-tx-bugs | 4 | 4.5 | checklist | fixed |
| lab-jpa-perf | 3 | 4.5 | explain | fixed |

No lesson is "still unclear". Several lessons that got extra interview parts now have one overlong or internally inconsistent part (see section 3).

## 2. Remaining issues per lesson

### ioc
- **circular**: Opens "Constructor injection có một hệ quả: hai bean cần nhau", then the example uses `@Autowired` **fields**. The bridge does not match the example. Fix: "Hai bean cần nhau thì không bên nào tạo trước được" and name the field/constructor split in the third paragraph.
- **openingQuiz**: Uses "3 cấp cache" and `allow-circular-references` before anything is taught. Low severity (it is a pre-test). Fix: drop "3 cấp cache" from the option, or accept.
- Other sections OK.

### bean-lifecycle
- **prototype**: The section quiz asks about a request-scoped bean in a singleton controller. That is taught only in part `prototype-reverse`, which comes after the quiz. That part also repeats the quiz text, and the request-scope paragraph is off its title ("singleton vào prototype"). Fix: move the request-scope paragraph and the quiz into the section's `after`, and keep the part about the reverse direction only.
- **scopes**: "`@RequestScope` ... kèm proxy `TARGET_CLASS`" uses "proxy" before the term is defined (the `{{proxy}}` gloss first appears in Phần 3). Fix: drop "kèm proxy TARGET_CLASS" here, or add the gloss.
- **lifecycle**: Heavy page: board, 3 intro paragraphs, `after`, predict. The predict ("`this.txMethod()` có transaction không?") needs "`this` luôn là object gốc", which `after` teaches only after the guess. Fix: add one sentence to the intro: "lời gọi qua `this` không đi qua proxy".
- **bpp**: The quiz packs three facts into its correct option ("PropertySourcesPlaceholderConfigurer ... pha populate bởi AutowiredAnnotationBeanPostProcessor"). Fix: shorten the options to the BFPP-versus-BPP distinction.

### auto-config
- **graceful-shutdown**: The most overloaded part in the group (11 intro lines, Kubernetes flow, `PID 1`, `SIGTERM`/`SIGKILL`, `preStop`, shell versus exec form). The predict asks about `ENTRYPOINT java -jar` "dạng chuỗi" and the `/bin/sh` PID 1 effect, which no text before it teaches (only the explanation does). "PID 1", "SIGTERM" and "SIGKILL" are never glossed. Fix: add 3 lines before the predict (PID 1 is the process that receives the signal; shell form wraps `java` in `/bin/sh -c`), or split into two parts (probes/signals, then packaging).
- **graceful-shutdown (accuracy)**: "Graceful shutdown không bao giờ được kích hoạt" is too strong. Some `sh` implementations exec the last command, so the result depends on the base image. Fix: say "thường", and say the lesson did not measure it.
- **actuator**: Six paragraphs. They cover exposure, the two probes, why not DB in liveness, why not shared DB in readiness, Boot's defaults, and `web-application-type=none`. The last item does not belong under "Actuator" even though the title says "ứng dụng không có web". Fix: move the probe rationale into a part, and move `web-application-type=none` to the `server.port=-1` trap.
- **properties**: "Boot coi `payment.url`, env var `PAYMENT_URL` và `paymentUrl` là cùng một key" is wrong for a one-word property. `paymentUrl` is a different key. Only multi-word names (`maxRetry`, `max-retry`) are equivalent. Fix: use `max-retry`, `maxRetry`, `PAYMENT_MAXRETRY`.
- **profile-yaml**: The intro lists the four measured results, which already gives away the answer to both the predict (`prod` gives empty `app.region`) and the quiz. Fix: keep the setup in the intro, and move the result bullets into `after`.
- **Versions**: `precedence` says "Spring Boot 4.1.1", other parts say 3.5.16, and the file header says "Every output from Spring Boot 3.5". Fix: one sentence saying which results were measured on which version, or re-run on one.

### mvc-flow
- **components**: The quiz option names `RequestResponseBodyMethodProcessor` and `MappingJackson2HttpMessageConverter`. The page never mentions either; the learner can answer only by elimination. Fix: add one line, "`@RequestBody` do `RequestResponseBodyMethodProcessor` xử lý, nó chọn converter Jackson", or simplify the options to the roles the page lists.
- **components / request-data**: `ProblemDetail`, `application/problem+json` and "problemdetails bật" appear with no definition. They are taught in the next lesson. Fix: "(chuẩn lỗi JSON, bài sau)" or remove.
- **response**: The quiz contrasts `@ResponseStatus(HttpStatus.CREATED)` with `ResponseEntity.created`. `@ResponseStatus` is never mentioned on the page. Fix: add one line to the intro: "`@ResponseStatus` đặt status cố định lên method".
- **flow (quiz)**: "Dọn ThreadLocal trong `afterCompletion`" depends on "afterCompletion luôn chạy", which is never stated (it is only implied by "`ex=null`"). Fix: add that to the `after` text.
- **request-data**: Packs three ideas (annotations, silently ignored JSON fields, method validation). Fix: make method validation a part.

### advice-aop
- **pointcut-designators (contradiction)**: The setup says `pay(String)` **and** `refund(String)` are annotated `@Audited`. The results then say `pay("p1")` is matched by aspect A, which excludes `@Audited`. The compare block says only `refund` is `@Audited`. Fix: "chỉ `refund(String)` đánh `@Audited`".
- **pointcut-designators (density and predict)**: Four selectors, `@Pointcut` naming, a 3-bean / 4-aspect setup in one paragraph, and the 4-line result list all sit in the intro. The result line for `PayRepo.load` is the answer to the predict that follows. Fix: split into two parts (selectors, then "four aspects on four calls"), and move the result bullets into `after`.
- **validation**: One intro with 12 lines: `@Valid` versus `@Validated`, three exceptions, groups, and three extra details (`@VnPhone` custom constraint, `payload`, `@NotBlank`). Fix: groups and custom constraint go into parts. The quiz option about "Kafka consumer" is not on the page.
- **problem-detail**: `after` says "Đã thử với cùng body sai", but no body is shown in this lesson (it comes from mvc-flow). No `@ExceptionHandler` code appears anywhere. Fix: one 4-line handler snippet, and name the request.
- **async**: The quiz needs `CompletableFuture<T>` as the return type, but the page only says `String` throws. Fix: add "trả `CompletableFuture<T>` hoặc `void`".
- **proxy-limits**: "inject chính mình qua `@Lazy`/`ObjectProvider`" is never explained. Fix: "gọi qua chính proxy được inject".
- **scheduled (part)**: No bridge line from `@Async` to `@Scheduled`.

### tx-proxy
- **manager**: The quiz asks why `JdbcTemplate` shares the JPA transaction. `JdbcTemplate` is not mentioned on the page, and the "Exposing JPA transaction as JDBC" log is only in the explanation. "XA", "Strategy pattern" and "Reactor Context" are also unexplained. Fix: one line "`JdbcTemplate` lấy đúng connection nằm trong ThreadLocal nên chung transaction", and trim the reactive/XA bullets to "(ít gặp)".
- **interceptor**: Step (3) says "ThreadLocal" six lines before the idea is explained (Phần 6). Fix: add "(ngăn tủ riêng của thread, Phần 6)" to step (3).
- **threadlocal (quiz)**: The scenario "`repo.save()` bên trong `@Async`" is not set up in the page text. Fix: add one sentence on it.
- Other sections OK.

### tx-pitfalls
- **rollback**: The predict ("catch rồi chỉ log, dòng còn không?") is the exact case Part 4 teaches. Part 4 then says the same thing again ("đã đo dòng vẫn còn"). Fix: move the predict to `swallow`, and keep Part 3 on checked versus unchecked.
- **rule**: The `importOrders` scenario sits in `after`, after the widget. Fix: move the scenario into the intro. The three fixes ("TransactionTemplate", "`@Lazy` self") have no pointer to where they are explained (tx-template, bean-lifecycle).
- **thread**: `after` is still a grab bag (wrong transaction manager, MyISAM, `@PostConstruct`, `jakarta.transaction.Transactional`, a 4-step debug list) under a section titled "Thread khác". Fix: make "Nguyên nhân khác và cách debug" a part.
- **visibility / swallow**: The Objenesis explanation repeats the tx-proxy `cglib-jdk` trap almost word for word. Link to it, or shorten. "rollback-only" appears in `swallow` before propagation defines it (the "bài Propagation" pointer is there; one gloss would be enough).

### propagation
- **seven**: The quiz asks about `this.audit()` with REQUIRES_NEW in the same class. Self-invocation is not taught in this lesson before this point (only "Phải đặt method ở bean khác" in Phần 4). The "REQUIRED cho 95% trường hợp" figure has no source. Fix: add "gọi qua `this` không qua proxy, như bài trước" and say "đa số". The seven types are a bullet list while the widget is named "table"; a 7×2 table would be clearer.
- Other sections OK.

### isolation
- **mysql-next-key (part of Phần 1)**: Placed before `FOR UPDATE`, atomic UPDATE and write skew are taught (Phần 3 and 4). It uses "snapshot" and "SELECT ... FOR UPDATE" with only inline glosses, and is dense (record, gap, next-key, deadlock, `ON DUPLICATE KEY`). It is honestly marked "chưa chạy", but a junior meets it before the basics. Fix: move it after `write-skew-missing-row` (or to the end as "nâng cao"). Also note that `ON DUPLICATE KEY` itself takes locks and can still deadlock under contention.
- **readonly**: The intro adds a long paragraph on `AbstractRoutingDataSource` and `LazyConnectionDataSourceProxy` with undefined "read replica" and "routing DataSource". The widget text says readOnly "có thể route sang read replica", which reads against "tự nó không chuyển". Fix: move the replica paragraph into a part. Say in the widget "chỉ khi cấu hình routing".
- **lost-update**: "ba cách sửa thật nằm ở phần tiếp theo" is read as Phần 4 (write skew). Fix: "ngay bên dưới (phần con)".
- **mvcc**: "snapshot" is used with no gloss. Fix: "bản chụp dữ liệu tại một thời điểm".
- **readonly (quiz)**: The correct option mentions "dùng chung một connection và persistence context", which is not stated in the section.

### tx-template
- **testing**: Two traps (SEQUENCE hides the unique violation; a service joining the test transaction hides AFTER_COMMIT, `UnexpectedRollbackException`, `LazyInitializationException`) plus `MockMvc` and `RANDOM_PORT`, all in one intro. `@DataJpaTest`, `TestTransaction`, `@Commit`, `RANDOM_PORT` and `LazyInitializationException` (taught later in n-plus-one) are undefined. Fix: split into two parts (one per trap), and gloss or drop the names.
- **after-commit-write**: The mechanism is opaque to a junior: "resource chưa unbind", "tham gia vào đó". Fix: one line: "callback AFTER_COMMIT chạy trước khi Spring dọn ThreadLocal, nên `save()` thấy transaction cũ và nhập vào".
- **events**: The `@Order` ordering trap for AFTER_* phases is deeper than a junior needs. Keep it, or cut it.
- **outbox**: "Debezium", "relay", "dual write" and Kafka are used with minimal gloss. Fix: a 3-line list: write a row, the relay reads and sends, the receiver is idempotent.

### entity-lifecycle
- **Lesson scope**: The lesson is about 31 KB with 7 sections and 5 parts. Phần 7 (derived query, `@Query`, paging, projection, auditing, soft delete) is a different topic from the persistence context. Consider a separate "Spring Data repository" lesson, or at least a clear "Phần 2 của bài" divider in the roadmap.
- **repo-auditing (part)**: Two ideas (auditing, soft delete) and ~20 lines: four annotations, listener, `@EnableJpaAuditing`, `AuditorAware`, `@PrePersist`, `@SQLDelete`, `@SQLRestriction`, a unique partial index, and 3 costs. Fix: split into `repo-auditing` and `repo-soft-delete`. The "Đã chạy trên PGlite" claim is fine, but say it was PostgreSQL SQL, not Hibernate.
- **states**: Defines persistence context, dirty checking, lazy load, flush and OSIV in the same intro. The glosses are there, but 5 new terms in one section is a lot. Fix: move the OSIV paragraph into `after`.
- **persist-merge**: `Persistable<ID>` and "`@Version` kiểu wrapper thì xét version null" are cryptic. Fix: drop the `isNew()` parenthesis or move it into `trap`.

### n-plus-one
- **osiv**: The "Nên tắt OSIV, vì:" bullets are three bare labels ("Lỗi bị che", "Giữ connection cả request") with no explanation. The quiz answer (log SQL in test, integration tests, then turn off) is not taught on the page. Fix: one sentence per bullet (e.g. lazy load errors do not appear in dev because OSIV hides them, then appear after it is turned off). Add the safe rollout steps to `after`.
- **fetch-type**: Still packs the N+1 definition, the entity model, LAZY/EAGER, proxies, EAGER N+1 and `getReferenceById`. Fix: make "EAGER cũng gây N+1" and `getReferenceById` into parts.
- **traps**: "bag", "tích Descartes" and "Hibernate trả `content=3, total=10`" appear with no setup (page size 3?). Fix: define bag (a `List` without order column), say "PageRequest.of(0, 3)", and name "tích Descartes (Cartesian product)".
- **n-plus-one**: The prose uses `join fetch o.items` (inner join), while the widget says an inner join drops orders with no items and recommends `left join fetch`. The `@EntityGraph` line says "giống JOIN FETCH (sinh left join)". Fix: use `left join fetch` in the prose snippet.

### lab-tx-bugs
- **checklist**: "Ghi vào nhật ký bảng 5 lỗi" but only 3 bullets (self-invocation, checked exception, email). Audit log and `UnexpectedRollbackException` are missing. Fix: add the two bullets.
- **self-checked**: "gọi `orderService.placeOrder(req)` trên bean `OrderService` khác" is ambiguous. The page never says which class holds `placeOrderBuggy` and `placeOrderFixed`. Fix: name the class, e.g. "`placeOrderFixed` nằm ở `OrderFacade`, gọi `OrderService.placeOrder`".
- **audit-loyalty (Bài 3)**: Gives "0 dòng" and "1 dòng" with no request named. Fix: "với `orderFailingOnSecondLine()`".
- **email**: `NotificationLog` appears here for the first time (not in setup). The quiz explanation mentions "tên vẫn là placeOrder", which the page does not say. Fix: add `NotificationLog` to the setup list.

### lab-jpa-perf
- **explain**: "page" (846 / 98 / 23) is never defined (a block of about 8 KB the DB reads). "Bitmap scan" and "Index Scan Backward" are not explained. The query's SQL is described but not shown. Fix: gloss "page" in one line, and print the query.
- **n-plus-one**: Good. The 16 versus 3 explanation (three levels) resolves the old conflict.
- **locking**: Good. "9 là kết quả đúng" is now explicit.

## 3. Top 5 remaining fixes

1. **advice-aop `pointcut-designators`**: Fix the contradiction (`pay` and `refund` both marked `@Audited`, yet `pay` matches aspect A), move the result list out of the intro (it gives away the predict), and split into two parts.
2. **auto-config `graceful-shutdown` + `actuator`**: The predict tests PID 1 / shell form before it is taught, there are undefined terms (PID 1, SIGTERM, SIGKILL), the claim "không bao giờ" is overstated, and the part is too long. Split it, and move `web-application-type=none` out of the Actuator section.
3. **Quizzes that test untaught facts** (add one sentence or change the option): mvc-flow `components` (class names), `response` (`@ResponseStatus`); bean-lifecycle `prototype` (request scope after the quiz); tx-proxy `manager` (`JdbcTemplate`); propagation `seven` (self-invocation); n-plus-one `osiv` (safe rollout); advice-aop `async` (`CompletableFuture`); tx-pitfalls `rollback` (predict teaches swallow before Part 4).
4. **entity-lifecycle `repo-auditing` + lesson scope**: Split auditing from soft delete, and consider moving Phần 7 into its own lesson. In the same style, split tx-template `testing` (two traps in one intro) and isolation `mysql-next-key` (move after write skew, since it uses `FOR UPDATE` before it is taught).
5. **Small factual or consistency fixes**: auto-config relaxed binding (`paymentUrl` is not `payment.url`) and Boot 4.1.1 versus 3.5.16; n-plus-one inner `join fetch` in prose versus `left join fetch` in widget; lab-tx-bugs checklist (3 of 5 bugs); isolation readOnly widget ("có thể route sang replica") against prose; propagation "95%" figure.

Report path: /Users/hnam/orca/projects/springboot-interview/interactive-lessons/web/plans/reports/learner-reaudit-spring-tx-jpa-261122-2330-report.md
