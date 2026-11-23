# Learner audit: web, security and infra lessons

Date: 2026-11-22. I read each lesson as a junior Java dev would, top to bottom, and compared it with its video narration (`*-video/scenes.py`), the study notes 03.08 to 03.12, 11.04 and 11.07, and luminhkhuong.dev (/security, /technical-knowledge/kafka/intro). The site is overview-level and covers less than these lessons, so the comparison found no important gaps. Calibration was the old `exception` section 2: too many ideas in one part, terms never defined, a result shown before its scenario, rules with no "why", and abrupt jumps.

## 1. Summary

| Lesson | Clarity (1-5) | Worst section | Video change |
|---|---|---|---|
| rest | 3 | idempotency | minor (`version`: FAIL_ON_UNKNOWN is only in the video; page needs it) |
| api-reliability | 4 | webhook-retry | no video |
| security | 3 | authn-authz | minor (`jwt` beat 1: "mã hóa base64... Mã hóa không phải là mã hóa bí mật") |
| oauth2-oidc | 3 | flow (OIDC never taught) | no video |
| web-vulns | 4 | idor (403 vs 404 conflicts with security lesson) | no video |
| redis | 3 | incidents | minor (page needs the facts only the video has: delayed double delete, DB=200/cache=100 race) |
| redis-structures | 4 | chon-cau-truc (List never taught) | no video |
| redis-patterns | 4 | atomic | no video |
| kafka | 2 | producer | minor (page lacks facts that only the video has; no scene redo) |
| microservices | 2 | observe-ship | minor (gateway "401 before 404" beat is not on the page) |
| testing | 3 | mockito | minor (`pyramid` "test hành vi", `datajpa` @Async are only in the video) |
| lab-jwt-cache-tests | 4 | cache | minor |
| lab-order-setup | 3 | timed | **redo `errors` and `outro`**: narration says "hai trăm hai mươi hai" (222) instead of 422 four times (scenes.py lines 76, 79, 82, 151) |

## 2. Per-lesson issues

### rest
- **status**: The text puts 422 next to "(một số team dùng 409 cho trường hợp này)" and then defines 409 as something else in the same breath, so the learner can't tell 409 and 422 apart. "exponential backoff và jitter" is used before it is defined (api-reliability defines it later). "không retry 4xx còn lại" gives no why. Fix: give one example per code (409 = duplicate email or wrong `@Version`, 422 = cancelling an order that has already shipped), move the "some teams use 409" note to a footnote, and add: "4xx means the request itself is wrong, so sending it again gives the same result."
- **idempotency**: The section starts with the result "Đã chạy: lần đầu 201... retry 200... cùng key body khác 422... Cổng thanh toán bị gọi đúng 2 lần" before the 4-call scenario is told. Paragraph 2 mentions `findById` from code that is never shown, says "insert key PROCESSING trước" without a why, and uses Redis `SET NX EX` before Redis has been taught. The quiz compares the key with a unique constraint on `orderId`, which the section never teaches. Fix: (1) list the 4 calls (A, A retry, A with a changed body, B) before the outputs; (2) explain why the body hash exists: it catches a client that reuses a key for a different payment; (3) explain PROCESSING: "insert first, so a second request blocks on the PK before the gateway is called"; (4) add one sentence on key vs `orderId` unique.
- **paging**: "trả `Page<T>` trực tiếp (bọc DTO riêng)" and "thiếu `id` làm tie-breaker" have no why. Fix: "If rows tie on the sort column, their order can change between queries, so a row can show up twice or be skipped across pages." For Page: "its JSON shape is an internal detail that Spring can change."
- **versioning**: The quiz asks about `FAIL_ON_UNKNOWN_PROPERTIES`, but the page never mentions it (only the video and study note do). "thêm giá trị enum là nguy hiểm" has no why. Fix: add one sentence on each: the flag makes the client throw on any field it doesn't know; a new enum value breaks clients that deserialize into a fixed enum or `switch` over it.
- **dto**: One sentence lists 5 problems, and `open-in-view` is undefined. Fix: make it a bullet list, and define open-in-view in one line ("keeps the DB session open until the JSON is written").
- **opening quiz**: The explanation quotes "4 lần gọi... cổng thanh toán 2 lần" before the learner knows what the 4 calls were. Fix: keep only the one-line reasoning.

### api-reliability
- **etag trap**: "nên kèm `@Version` ở database cho chắc" has no why. Fix: "Two PUTs carrying the same If-Match can both pass the check before either one writes. `@Version` in the UPDATE closes that gap."
- **webhook-sign**: The text never says that a replay inside the 5-minute window still passes. Fix: add a link: "inside the window, the event id dedupe in the next part catches it."
- **webhook-retry**: "evt_1 xử lý một lần, hai lần gửi lại bị duplicate ignored, tổng 2 sự kiện cho 4 lần nhận" never states what the 4 deliveries were. The sample `seen.add(id)` is an in-memory Set, and it marks the event as seen *before* `applyPayment`. A learner may copy that, but a restart or a second instance loses the set, and a failed apply drops the event for good. Fix: state the 4 deliveries (evt_1 ×3, evt_2), and add "in production this is a DB unique key written in the same transaction as the payment."

### security
- **authn-authz** (worst): This section asks about JWT claims (`roles`, `scope`, `SCOPE_`) and has a quiz on them, but the JWT structure is only taught in Phần 3. Paragraph 2 also packs one long list: removal of the adapter, lambda DSL, `csrf.disable()` (why: Phần 6), `STATELESS` (undefined), matcher order, `oauth2ResourceServer` (undefined) and the authority trap. "authority" vs "role" is never defined. Fix: either move the roles/scope trap and its quiz after Phần 3, or add a one-line JWT preview. Split the config list into bullets, each with a short why. Define authority ("a string such as ROLE_ADMIN or SCOPE_read; `hasRole('X')` looks for `ROLE_X`").
- **filter-chain**: Paragraph 2 packs 3 unrelated ideas: how ExceptionTranslationFilter decides 401/403, why `@RestControllerAdvice` doesn't see filter exceptions, and ThreadLocal with `@Async`. That is the calibration pattern. The quiz explanation ("Một app có thể có nhiều SecurityFilterChain...") does not explain the answer. Fix: one idea per paragraph (move the ThreadLocal note to a trap), and rewrite the explanation as "the servlet container creates filters before Spring beans exist; the proxy looks up the bean later."
- **jwt**: "tin `alg` do token tự khai" has no why, and `jti` is undefined. Fix: one clause on `alg: none` and algorithm confusion (or a link to oauth2-oidc jwt-validate), and "jti = unique token id".
- **tokens**: `jwk-set-uri`, JWKS and `kid` are undefined. Fix: "JWKS = the URL where the auth server publishes its public keys; kid tells which key signed this token."
- **cors-csrf**: "origin" and "preflight" are never defined, and neither is why `Authorization` triggers a preflight. Fix: "origin = scheme + host + port"; "a request with custom headers is not a 'simple request', so the browser first asks with OPTIONS."
- **method-security**: This mixes `@PreAuthorize`, SQL injection and an OWASP list. The quiz explanation uses "IDOR", which the text never mentions. Fix: name IDOR in the Broken Access Control sentence.
- **modelAnswer**: "strength 10 mất khoảng 110 ms" contradicts the section's 88 ms. Fix: 88 ms.
- **Cross-lesson**: SHA-256 speed here is 100k hashes in 165.7 ms (about 600k per second); web-vulns says about 10 million per second. Fix: say these come from different machines or code paths, or use one number in both.
- **Video `jwt` beat 1**: "mã hóa base sáu bốn. Mã hóa không phải là mã hóa bí mật" uses one Vietnamese word for both encode and encrypt, so the line contradicts itself when heard. Fix the narration: "base64 chỉ là encode, không phải mã hoá bí mật (encrypt)."

### oauth2-oidc
- **Lesson-wide**: The opening quiz and the title promise OAuth2 vs OIDC, but no section explains OIDC: the `openid` scope, the ID token, the userinfo endpoint, or "login with Google = OIDC". OIDC only shows up inside the tokens cheat sheet. Fix: add 2-3 sentences at the end of **flow**: "add scope `openid` and the same flow also returns an ID token, which tells the client who logged in."
- **flow**: The key "why" is missing: why use a code instead of sending the token directly? (The code travels through the browser URL; the token is fetched server-to-server, so it never appears in the browser.) This is also the reason implicit flow is deprecated, which the trap states without explaining. "client authentication" is undefined. Fix: add that sentence, and "client authentication = the client proves itself with its client_secret".
- **pkce**: The text never says *how* an attacker gets the code. Fix: "on mobile, another app can register the same redirect URL scheme; on the web, the code can leak through logs or history."
- **jwt-validate**: The trap "nhận HS256 dùng khoá công khai RS256 làm bí mật" is too compressed. Fix: "the public key is public, so if the server accepts HS256 and uses that key as the HMAC secret, anyone can sign tokens." The "Kiểm tra đủ" code also skips `iss`/`aud`, which the intro says are required. Add a comment line.
- **rotation**: "nhóm token" (family) is undefined. Fix: "all refresh tokens that came from one login."

### web-vulns
- **idor**: The fixed code returns `403 forbidden`, but the security lesson's quiz says "không có thì 404". The learner sees two different answers. Fix: one sentence: "404 also hides that the object exists; both are fine if the API is consistent."
- **ssrf**: "DNS rebinding" is undefined. Fix: "the domain resolves to a public IP at check time and to an internal IP at connect time."
- **password**: The SHA-256 rate differs from the security lesson (see above).
- Otherwise OK. This is the clearest lesson in the set.

### redis
- **cache-aside**: The quiz asks about `private` methods and CGLIB, but proxies and self-invocation are only taught in Phần 3, and CGLIB is never explained. Fix: move this quiz to **self-invocation**.
- **ttl**: Too many ideas in one place: default TTL, a custom bean that silently overrides properties, key design, the JDK serializer, `@class` and version prefixes, and DTO vs entity. "Cache DTO, không cache entity" has no why. Fix: split into TTL / key / serializer bullets, and add "entities carry lazy proxies and Hibernate types that don't serialize cleanly."
- **self-invocation**: The `service.dbLoads` NPE detail is off-topic and unexplained (why would a field on a proxy be null?). Fix: drop it, or add "the proxy is a subclass whose fields were never initialised; only method calls are forwarded."
- **invalidation**: The quiz asks about "Delayed double delete", which the page never teaches (only the video does). "SET lệch thứ tự để lại giá trị cũ" doesn't tell the scenario, though the video does (DB=200, cache=100). `binlog (CDC)` is undefined. Fix: copy the video's two-writer scenario into the text, add one sentence on delayed double delete and the remaining race it targets, and define CDC.
- **incidents** (worst): Three incidents plus measurements in two paragraphs. "single-flight", "Bloom filter" and "circuit breaker" are undefined. "lockingRedisCacheWriter còn 1 nhưng tổng 3090 ms" gives no why. Fix: one bullet per incident (cause, symptom, fix). Define single-flight ("only one request loads, the others wait for its result"). Explain the 3090 ms: "the waiting threads poll the lock with sleeps, so they finish late."

### redis-structures
- **chon-cau-truc**: The drill asks for **List** (`RPUSH`/`LPOP`), but no section teaches List. Fix: add a 2-line List note in **stream**, or drop the item.
- **string-incr**: "check-then-act" and "Lua" are used without definitions. Fix: one clause each, or a link to redis-patterns.
- **stream**: "`XLEN orders` ra `2`" appears, but only one `XADD` is shown. Fix: show the two XADDs.

### redis-patterns
- **atomic** (worst): The widget title is "Trừ kho khi chỉ còn 1 sản phẩm", but the MULTI example is `INCR a / LPUSH a` and has nothing to do with stock. The WATCH result ("bal bị client khác đổi thành 999") has no setup. Fix: put the MULTI/WATCH demo on the stock key too, and show the WATCH steps (WATCH bal, another client sets 999, EXEC → nil).
- **lock**: Lua/`EVAL` appears without saying what it is. Fix: "EVAL runs a small script on the Redis server as one atomic command." "đoạn găng" should get "(critical section)".
- **rate-limit**: The sliding-window code `ZADD sw:u1 now now` uses the timestamp as the member, so two requests in the same millisecond collapse into one entry and under-count. Fix: use a unique member (timestamp plus a random suffix) and say why.

### kafka
- **Lesson-wide prerequisite gap**: Broker, replica, leader, follower and "in-sync" are never defined, yet **producer** depends on all of them. The study note defines them; the lesson dropped them. Fix: add 2 sentences in **log**: "each partition lives on one broker (the leader) and is copied to other brokers (followers); followers that are caught up are 'in-sync'."
- **delivery**: The run result ("cả 20 bị bỏ qua vì trùng, bảng `processed_event` đúng 20 dòng") uses the idempotent-consumer idea before Phần 5 explains it. The quiz (listener hands work to a thread pool) is not taught on the page, only in the video. "Exactly-once chỉ trọn vẹn khi kết quả ghi vào Kafka" has no why. `AckMode` is undefined. Fix: add "skipped by the idempotent consumer, see Phần 5", add the video's thread-pool sentence, and add the why: "Kafka transactions commit the output and the offset together, but they can't include your DB."
- **producer** (worst): Two unrelated topics share one section (producer acks, idempotent consumer). "`acks=-1`" is shown without saying that -1 means `all`, so the learner thinks the default is something odd. "đừng dùng offset làm id" and "UPDATE ... WHERE status='CREATED'" have no why. Fix: split into "Producer an toàn" and "Consumer idempotent", as the study note does. Write "`acks=-1` (= `all`)". Add: "a re-sent duplicate gets a new offset, so offsets can't detect it"; "the WHERE turns a second run into a no-op."
- **dlt**: The quiz asks about consumer lag, which the page never defines (only the explanation and the video do). Fix: define lag in the text.
- **outbox**: Kafka vs RabbitMQ and the outbox are unrelated and share one section. The quiz asks about `@TransactionalEventListener(AFTER_COMMIT)`, which the page never mentions (the video does). CDC/Debezium is undefined. Fix: add the video's AFTER_COMMIT sentence, and define CDC ("reads the DB change log").

### microservices
- **Lesson-wide**: Every intro paragraph has 5-8 named technologies. Many terms are undefined: bounded context/DDD, eventual consistency (quiz explanation), BFF, kube-proxy, semantic lock, MDC, span, token relay, sidecar, expand and contract. The meta line "Ở level 2-3 năm, nói được... ăn điểm hơn" reads as an aside.
- **communication**: Paragraph 2 is a client catalogue (RestClient, WebClient, RestTemplate, @HttpExchange, OpenFeign, gRPC). Fix: keep RestClient plus the timeout rule; move the rest to a cheat list.
- **discovery-gateway**: Discovery, client-side vs server-side load balancing, Kubernetes, removed libraries and 4 gateway status codes, all in two paragraphs. The video's best point ("Spring Security runs before routing, so a missing token on an unknown path gives 401, not 404") is not on the page. Fix: split discovery and gateway, and add the 401-before-404 line.
- **distributed-data**: "Bước không bù được đặt sau bước quyết định cuối cùng" never says which step decides. The video says payment is the pivot. Fix: name payment as the pivot step.
- **observe-ship** (worst): Three unrelated topics (tracing config, contract tests, deployment strategies), dense with property names. "expand và contract" is undefined, but the quiz explanation depends on it. Fix: split into tracing and "change and ship"; define expand/contract ("add the new field, migrate clients, then remove the old one").

### testing
- **pyramid**: The quiz (implementation vs behaviour) is not taught on the page; only video beat 4 says "test hành vi". "flaky" is used before Phần 6 defines it. The timings show unit tests at 1 s, slower than `@WebMvcTest` at 0.8 s, which contradicts the pyramid the section just drew. Fix: add one sentence on behaviour vs implementation; define flaky inline. Explain that per-class time includes JVM or Mockito warm-up, or show per-test times.
- **mockito** (worst): One sentence defines 5 things (`@Mock`, `@Spy`, `@InjectMocks`, `verify`, `ArgumentCaptor`) and never defines "stub". "Đã chạy: `captured id=9`" has no scenario. "strict" has no why, while the video gives it ("usually means the test checks the wrong thing"). Fix: use a small table of the 5 tools; "stub = tell the mock what to return"; give the captor scenario; copy the video's why.
- **webmvc**: "slice" and "context cache" are undefined. Context caching is never explained anywhere in the lesson, though the study note has a section on it. Fix: add 2 sentences in **testcontainers**: "Spring reuses one context for test classes with identical config; any difference (`@MockitoBean`, property, `@DirtiesContext`) starts a new one."
- **datajpa**: The quiz asks about `@Async` writes, which only the video covers. Fix: add one sentence to the page.
- **testcontainers**: "`GenericContainer` cho Redis phải ghi `name = \"redis\"`" has no why. Fix: "a generic container has no type, so Boot needs the name to know which ConnectionDetails to build."

### lab-jwt-cache-tests
- **jwt**: The quiz says login with a wrong password should give 401 and justifies it only with "Checklist lab 7 yêu cầu rõ", a rule without a why. The video gives the cause ("an advice that catches generic Exception turns the auth error into 500"). "spring.cache.type: none để test cũ không vỡ" has no why. Fix: copy the video's cause; add "old tests have no Redis running."
- **cache**: "GET 1, GET 1, GET 1, PUT 3, GET 4" reads as per-step counts but is a running total. Fix: "tổng số câu SQL tích luỹ sau mỗi bước: ..." plus "PUT adds 2 statements (SELECT + UPDATE)". "không cache null" has no why.

### lab-order-setup
- **Video `errors` + `outro`**: Spoken "hai trăm hai mươi hai" (222) where it means 422, in 4 beats, while the captions say 422. This is a factual error a learner will hear. Redo the audio for these two scenes.
- **project**: The rollback case from the opening quiz (2 Keyboard + 5 Monitor → stock stays 8) is never covered in a section, so a core lab finding exists only in the quiz and the model answer. "IDENTITY tắt batch insert" has no why. The quiz depends on `open-in-view`, which is undefined. Fix: add the 422 rollback run to **project**; "with IDENTITY, Hibernate must run each INSERT immediately to learn the id, so it can't batch"; define open-in-view in one line.
- **errors**: Error handling and profiles/Actuator are unrelated and share one section. The port-8080 aside is noise. "bật probes" is undefined. Fix: split the section or add a heading line; "probes = liveness/readiness endpoints Kubernetes uses".
- **timed** (worst): `@Timed` here is a custom annotation (`labs/order-service/.../common/Timed.java`), but Micrometer has a well-known `@Timed`. The page doesn't say so, and the next sentence recommends Micrometer, which adds to the confusion. The quiz (proxy-target-class / CGLIB) is not taught on the page. The page asks the learner to explain 3 report lines but gives no example, though the video does (DataSource, H2 console, ProblemDetail). Fix: "`@Timed` tự viết (không phải của Micrometer)"; add one sentence on Boot defaulting to CGLIB class proxies; copy the video's 3 example lines.

## 3. Top 5 fixes by impact

1. **lab-order-setup video `errors` + `outro`**: re-record the 4 beats that say 222 instead of 422. It is a factual error, and it is about status codes, the topic being taught.
2. **Quizzes testing material that is only in the video**: rest/versioning (FAIL_ON_UNKNOWN), redis/invalidation (delayed double delete), kafka/delivery (thread pool), kafka/outbox (AFTER_COMMIT), kafka/dlt (lag), testing/pyramid (behaviour) and testing/datajpa (@Async), lab-order-setup/timed (CGLIB). Plus redis-structures drill (List never taught) and redis cache-aside (CGLIB before Phần 3). Add one sentence of page text each.
3. **kafka**: define broker, leader, replica and in-sync in **log**; split **producer** into producer safety and idempotent consumer; write `acks=-1 (= all)`.
4. **security/authn-authz ordering**: the roles/scope claim trap and its quiz come before JWT is explained. Move them after Phần 3 or add a JWT preview. Also break up the config list.
5. **oauth2-oidc**: add the missing OIDC explanation, and the "why a code rather than the token" sentence that also explains why implicit flow is deprecated.

Also worth a pass: microservices density (split observe-ship and discovery-gateway; define the jargon), rest/idempotency (tell the 4-call scenario before its results), and small cross-lesson contradictions (BCrypt 110 vs 88 ms in the security model answer; SHA-256 rate in security vs web-vulns; IDOR 403 vs 404).
