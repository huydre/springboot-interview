# Learner re-audit: web, security and infra lessons

Date: 2026-11-22. Fresh read of the current `src/data/lessons/*.ts` for 13 lessons, then compared with `learner-audit-261122-1624-web-security-infra-report.md`. Nearly every old finding is fixed (terms defined, scenario before result, whys added, quizzes on taught facts). The biggest new problem is a merge defect: **the same part is pasted twice in 6 lessons**.

## 1. Summary

| Lesson | Old | New | Worst remaining section | Verdict |
|---|---|---|---|---|
| rest | 3 | 4 | paging > cursor-pagination (part duplicated) | fixed (one defect) |
| api-reliability | 4 | 4 | etag (predict asks 428 before it is taught) | fixed |
| security | 3 | 4 | cors-csrf > csrf-cookie ("Ba lớp" but 4 bullets) | fixed |
| oauth2-oidc | 3 | 4 | tokens > scope-vs-role (part duplicated) | fixed (one defect) |
| web-vulns | 4 | 5 | none | fixed |
| redis | 3 | 4 | ttl (3 config topics in one section) | improved |
| redis-structures | 4 | 4 | hash > big-key (part duplicated) | fixed (one defect) |
| redis-patterns | 4 | 4 | ha > redis-persistence / redis-cluster-slots (duplicated), stale cards | improved |
| kafka | 2 | 4 | log (about 12 terms in one intro), kafka-retention and kafka-transactions duplicated | improved |
| microservices | 2 | 4 | config-security (two topics) | improved |
| testing | 3 | 4 | testcontainers (dense), webmvc predict | improved |
| lab-jwt-cache-tests | 4 | 4 | cache (quiz on `@class`, not taught here) | fixed |
| lab-order-setup | 3 | 5 | none | fixed |

## 2. Remaining issues per lesson

### rest
- **paging > parts**: part `cursor-pagination` appears twice, word for word (ts lines 268 and 323, same id). The learner reads the offset-vs-cursor scenario, widget, takeaway and quiz two times in a row. Fix: delete the second copy.
- Everything else from the old audit is fixed (409 vs 422 examples, 4 calls listed before results, PROCESSING why, FAIL_ON_UNKNOWN, open-in-view, tie-breaker why).

### api-reliability
- **etag predict**: it asks for 428 ("server bắt buộc điều kiện... quên If-Match") but the intro never mentions 428 or 412 for a missing header. The answer is only in the explanation. Fix: add one line to the intro: "Server có thể bắt buộc If-Match: thiếu header thì 428, sai phiên bản thì 412."
- Otherwise OK. Backoff numbers (863 ... 30453 ms) fit `random(ceiling/2, ceiling)`; the in-memory `Set` caveat is now explained.

### security
- **csrf-cookie**: says "Ba lớp chặn, nên dùng cùng nhau" and then lists four bullets (CSRF token, SPA cookie, SameSite, no GET for writes). The SPA bullet is a variant of the first. Fix: say "bốn điều" or fold the SPA bullet into the token bullet.
- **filter-chain**: still the densest first section (3 proxy layers, 4 filters, 401 vs 403 rule, advice limit). Acceptable thanks to bullets and the board. Optional fix: move the 401/403 paragraph into a part.
- Fixed since the old audit: JWT preview before the roles trap, authority defined, jti/JWKS/kid/origin/preflight defined, 88 ms model answer, IDOR 403/404 note.

### oauth2-oidc
- **tokens > parts**: part `scope-vs-role` appears twice, identical (ts lines 205 and 257). Fix: delete the second copy.
- **flow**: the intro says "bằng chứng client (bước 4 bên dưới)" and "state chống CSRF" before the four steps and CSRF are shown. Fix: put the 4-step list before that paragraph, or say "(bước 4 trong danh sách dưới)" and gloss CSRF in one clause.
- **jwt-validate > after**: "Nimbus" and "JWK Set" are not defined in this lesson (only in security). Fix: "JWK Set (danh sách khoá công khai của auth server, xem bài Security)".
- OIDC is now taught (openid scope, ID token, userinfo) and the "why code first" is explained.

### web-vulns
- OK. Consistent with the security lesson (SHA-256 now "hàng triệu/giây" in both, 403 vs 404 reconciled).

### redis
- **ttl**: one section still carries TTL default, the bean-override trap, key design, serializer, `@class` versioning and DTO-vs-entity, with a quiz only on TTL. This is the old calibration pattern, now with whys but not split. Fix: make "Key và serializer" a part with its own quiz (for example "đổi package DTO thì cache cũ thế nào").
- **incidents**: the predict and explanation name `lockingRedisCacheWriter` (3090 ms) but the page never shows how to enable it, while the model answer says "em làm single-flight". Fix: add a 2-line config snippet or say "xem tài liệu RedisCacheWriter.lockingRedisCacheWriter".
- **incidents > hot-key**: long part (situation, three ways to find, measured counters, four fixes). OK but at the limit; the LFU counter note could move to a trap.
- **cache-aside intro**: "Đó là cái `@Cacheable` làm" follows "ghi thì UPDATE DB rồi xoá cache", but evict is `@CacheEvict`. Fix: "Phần đọc là `@Cacheable`, phần xoá là `@CacheEvict`."
- **local-vs-redis**: "pub/sub" is used without a definition (it is taught in redis-structures). Fix: one clause.
- Fixed: delayed double delete, two-writer race, CDC, single-flight, Bloom filter, circuit breaker, CGLIB quiz moved to part.

### redis-structures
- **hash > parts**: part `big-key` appears twice, identical (ts lines 140 and 194). Fix: delete the second copy.
- **hash trap vs big-key**: the Hash trap ("HGETALL ... dùng HSCAN") repeats what the big-key part teaches. Fix: shorten the trap to "xem big key bên dưới" or drop it.
- **string-incr trap**: `SETNX` is named without a definition. Fix: add "(SETNX: ghi nếu key chưa có)".
- List is now taught in `stream > after`. OK.

### redis-patterns
- **ha > parts**: parts `redis-persistence` and `redis-cluster-slots` each appear twice (ts lines 400/523 and 468/591). Fix: delete both second copies.
- **ha cheat sheet vs parts**: "RDB và AOF" and "Cluster" cheat rows repeat what the two parts teach in full. Fix: keep only Replication, Sentinel and "Khi nào dùng cái nào" in the cheat sheet.
- **cards**: the MULTI card still says "đo: INCR, LPUSH sai kiểu, INCR ra 3", but the lesson now shows `DECR, LPUSH, DECR` giving `1, WRONGTYPE, -1`. The card contradicts the page. Fix: "đo: DECR, LPUSH sai kiểu, DECR ra 1, WRONGTYPE, -1".
- **rate-limit**: "Giống bài LLD" refers to a lesson that is not linked or taught here, and the sentence has a typo ("nên nên gộp"). Fix: replace with one explanatory clause ("5 yêu cầu cuối cửa sổ cộng 5 yêu cầu đầu cửa sổ sau là 10 trong vài giây") and fix the typo.
- **roadmap**: the three chặng omit pipelining, persistence and cluster. Fix: add them to chặng 3.
- Fixed: the `atomic` demo now uses the stock key and shows WATCH steps; Lua, critical section and unique ZSET member are explained.

### kafka
- **kafka-retention** and **kafka-transactions** (both parts) appear twice, identical (ts lines 89/152 and 496/558). Fix: delete the second copies.
- **log**: the intro now defines about 12 terms in one section (topic, partition, offset, retention, broker, replica, leader, follower, in-sync, ISR, poll, committed offset, `__consumer_offsets`) before a single quiz. This is the right content, but too much for one section. Fix: keep topic, partition, offset and retention in the intro; move broker, replica, leader, follower and ISR into a part "Broker, replica và ISR" with a one-line quiz.
- **kafka-fast**: says a naive queue is slow "vì ba thứ" and "Kafka né cả ba", then lists five bullets (the last, "Partition", is not a fix for any of the three). Fix: "năm kỹ thuật" or drop the Partition bullet.
- **outbox**: Kafka vs RabbitMQ and the outbox are still two topics in one section. The bridge sentence helps; the quiz covers only the outbox. Fix: move the comparison to a part, or rename the section "Outbox" and leave the comparison as a short intro note.
- Fixed: broker/leader/ISR, `acks=-1 (= all)`, `AckMode`, thread-pool rule, AFTER_COMMIT, lag, CDC, idempotent consumer in its own part. "Đã chạy" claims are separated from the described-only parts (retention, transactions, DLT are marked in the file header and text).

### microservices
- **config-security**: Config Server, `@RefreshScope`, Bus, ConfigMap, Vault plus three auth cases (token relay, client credentials, mTLS) in one section, with a quiz only on auth. Fix: split into "Config" and "Xác thực giữa service"; gloss `@RefreshScope` and Bus in one clause each.
- **discovery-gateway > api-gateway predict**: asks which status the gateway returns on a slow service (504) before the status list (404/429/504/503) and `response-timeout` appear in `after`. Fix: move the status list above the predict.
- **discovery-gateway**: the section itself has no quiz or widget, so the discovery and load-balancing half is never checked. Fix: add a small quiz (client-side vs server-side) or a takeaway.
- Fixed: bounded context, eventual consistency, BFF, kube-proxy, semantic lock, pivot, token relay, sidecar, MDC, span, expand/contract, 401-before-404, observe/ship split into parts.

### testing
- **webmvc predict**: asks 401/403 for a slice without `SecurityConfig` ("CsrfFilter đứng trước AuthorizationFilter"), but that fact is only in the explanation and `after`. Fix: put the "slice dùng security mặc định của Boot, có CSRF" sentence in the intro before the predict.
- **pyramid**: uses `verify` ("thay vì verify từng lời gọi") before Mockito is taught in Phần 2. Fix: "kiểm tra từng lời gọi nội bộ (verify, Phần 2)".
- **testcontainers**: the first paragraph packs `@ServiceConnection`, the `GenericContainer` name rule and three measured results; then four rules and the context cache. Fix: make "Context cache" a part with its own quiz.
- Fixed: stub defined, Mockito table, captor scenario, strict why, behaviour vs implementation, flaky defined, timings explained, `@Async`, `name = "redis"` why, context cache. New parts (matcher-rule, test-doubles, security-test) are clean and each ends with a quiz on what it taught.

### lab-jwt-cache-tests
- **cache quiz**: asks why `@class` in the Redis value is a deploy risk, but this lab never mentions `@class` (it is taught in the redis lesson ttl section; the explanation only shows an example value). Fix: add one sentence to the cache intro ("JSON serializer ghi thêm field `@class` chứa tên class đầy đủ") or switch the quiz to the evict point.
- **jwt intro**: `NimbusJwtEncoder` is named without a gloss. Fix: "(class của Spring dùng để ký JWT)".
- Fixed: the login 401-vs-500 cause, test cache type why, cumulative SQL count, null cache why, evict on order.

### lab-order-setup
- OK. The rollback run, IDENTITY why, open-in-view, probes, custom `@Timed` vs Micrometer, CGLIB and the three condition-report examples are all on the page now. I did not re-check the video audio for the "222" error; that was a video issue, outside the page text.

## 3. Top 5 remaining fixes in this group

1. **Delete the 7 duplicated parts**: rest `cursor-pagination`, oauth2-oidc `scope-vs-role`, redis-structures `big-key`, redis-patterns `redis-persistence` and `redis-cluster-slots`, kafka `kafka-retention` and `kafka-transactions` (each id appears twice in one section; found with a duplicate-id scan). Learners read the same part, widget and quiz twice, and React keys collide.
2. **redis-patterns**: fix the stale MULTI card (INCR/LPUSH/INCR ra 3 vs the page's DECR ... `1, WRONGTYPE, -1`), the orphan "Giống bài LLD", the typo, and drop the cheat-sheet rows that repeat the RDB/AOF and Cluster parts.
3. **kafka `log`**: split the 12-term glossary; move broker/replica/leader/follower/ISR into their own part with a quiz; fix the "ba thứ / năm bullet" mismatch in `kafka-fast`.
4. **redis `ttl` and `incidents`**: split key and serializer into a part with a quiz; show how `lockingRedisCacheWriter` is enabled so the "single-flight" in the model answer has a taught implementation.
5. **microservices `config-security` and gateway predict**: split config from service-to-service auth; move the gateway status list above the 504 predict; add a check for the discovery half.

Unresolved questions: none that block the fixes. I did not run the app, so I could not see whether the duplicated parts render twice or React only warns about the repeated key.
