# Learner re-audit: design patterns, LLD, system design, STAR, weekly quiz

Fresh read of the current `src/data/lessons/*.ts` (plus `weekly-quiz-cards.ts` count and the `stateless-check` widget), then compared with `learner-audit-261122-1624-design-sd-report.md`. Nearly every problem from the first audit is fixed. Only the remaining ones are listed.

## 1. Summary

| Lesson | Old | New | Worst remaining section id | Verdict |
|---|---|---|---|---|
| lld-1 | 3 | 4.5 | khung (minor), nothing serious | fixed |
| lld-2 | 4 | 4.5 | movie-ticket | fixed (one confusing outcome) |
| patterns-creational | 4 | 4.5 | builder (predict) | fixed |
| patterns-structural | 3 | 4 | proxy | improved |
| patterns-behavioral-1 | 4 | 4 | state (predict), observer-vs-pubsub | improved |
| patterns-behavioral-2 | 3 | 4 | visitor | improved |
| sd-concepts | 2 | 3.5 | saga-ops (grouping), realtime | improved |
| sd-practice | 3 | 4 | chat / notification (density) | improved |
| star-story | 4 | 4.5 | labs | fixed |
| weekly-quiz | 4 | 4 | method | improved (minor) |

Verified fixed and not repeated below: rate-limiter now has three mechanisms with timeline first; token bucket is its own part; EV outcome, Caramel, "Tắt cache", chain toggle, composite "thêm thao tác" now answer their own questions; Visitor and Decorator mechanism code is shown; DCL and volatile have a why; Holder vs reflection stated; static factory vs GoF fixed; JdbcTemplate no longer called pure Template Method; Proxy vs Decorator intent stated; elevator LOOK and start direction stated; sd-concepts whys added (delete vs update key, CAP, consistent hashing, LazyConnectionDataSourceProxy, read-your-writes, Retry/CB order, outbox problem first); checkout tells the race first and has all three whys; Base62 defined; star-story behavioral is a cheat list; "Vì sao chuyển việc" is taught. Spot-checked arithmetic is correct: 25 vs 13 floors, 9.14 = pi + 6, 7 token-bucket requests, 17 chars / 8 glyphs, 12-vs-13 shard example, Base62 `g8`/`21`, estimate figures, 93 weekly cards.

## 2. Remaining issues per lesson

### lld-1
OK. Nit only: `khung` step 5 says "xem bài LLD 2" for atomic operations, fine; the board code in `parking-lot` has odd indentation (cosmetic).

### lld-2
- **movie-ticket**, good-side outcome "Người giữ chỗ bỏ đi": reads as one run: "u1 xác nhận lúc 200s được. Lúc 301s hết hạn nên u1 không xác nhận được". A learner asks how u1 can confirm at 200s and again fail at 301s. Fix: say "hai lần chạy riêng: (a) u1 xác nhận lúc 200s được; (b) u1 không xác nhận, lúc 301s hold hết hạn nên u1 xác nhận thất bại và u2 giữ được".
- **movie-ticket**: the widget code uses `putIfAbsent(...) == null` before `after` explains it. The predict explain helps, but add one clause in the intro: "`putIfAbsent`: đặt nếu chưa có, trả `null` khi đặt được".

### patterns-creational
- **builder** predict: asks what happens when `Content-Type` is missing on a POST, but no text before it states that POST requires it. Options 2 and 3 can only be told apart by guessing the rule. Fix: put the rule in the intro ("POST bắt buộc có Content-Type, Builder kiểm tra điều này ở `build()`") or reword the predict as "request thiếu trường bắt buộc".
- **factory-method** good side: the outcome says `OrderService` is unchanged but the code never shows `OrderService` using `byChannel`. Fix: add one line `class OrderService { void done(String ch, String m) { byChannel.get(ch).notifyUser(m); } }`.

### patterns-structural
- **proxy** (worst): one section carries Proxy vs Decorator, cache proxy, dynamic proxy lambda, JDK proxy vs CGLIB, self-invocation and `@Transactional`. It is the longest section of the lesson and has no parts. Fix: move the dynamic proxy lambda, JDK vs CGLIB and self-invocation into a part "Proxy động và self-invocation" with its own widget or takeaway; keep the main section to cache proxy and the Decorator difference.
- **proxy** trap/quiz: `CachingProxy` is shown only with `load`, but the trap has the client call `loadTwice(5)` through it. Fix: show the `Service` interface once (`load`, `loadTwice`) so the 2 extra real calls make sense.
- **bridge** trap and the **cheatsheet** quiz name Strategy as the contrast, but Strategy is taught only in Behavioral 1 (next lesson). Fix: gloss in one clause ("Strategy: đóng gói một thuật toán đổi được, sẽ học ở bài sau") or change the quiz to a pair taught in this lesson (Adapter vs Decorator is already used).

### patterns-behavioral-1
- **state** predict: asks what `PENDING.ship()` does before the enum code is shown (it only appears in the widget below). The learner is asked about code they have not seen. Fix: show the 6-line enum (or at least the sentence "mỗi trạng thái chỉ override thao tác nó cho phép, còn lại ném exception") in the intro.
- **observer-vs-pubsub**: the Observer section above already calls the parts "publisher" and "subscriber" and uses `bus.publish`, then this part defines Observer as "subject biết observer" and contrasts it with Pub/Sub. The vocabulary shift is confusing. Fix: in the Observer intro call them "subject / observer" (or say "publisher = subject"). Also "subscriber tự retry theo offset" and "giao ít nhất một lần: idempotent" are unexplained here (Kafka offset, at-least-once). Fix: one gloss each or a pointer to sd-concepts message-queue.
- **state** takeaway/after: "State tự chuyển theo sự kiện" but the enum example is driven by the client calling `pay()` / `ship()`. Fix: say "trạng thái hiện tại quyết định chuyển sang đâu, client không chọn trạng thái".

### patterns-behavioral-2
- **visitor** (worst): the same snippet holds the classic Visitor (`Circle`, `Rect`) and a second, unrelated hierarchy for sealed + switch (`Fig`, `Circ`, `Rec`) with `...` bodies. A learner cannot tell if they are the same types. The intro is four dense paragraphs. Fix: split into two parts: "Visitor cổ điển và double dispatch" and "Java 21: sealed + switch", each reusing `Circle`/`Rect`, and give the `switch` its real bodies.
- **visitor** predict: asks what happens when a `Triangle` is added without a `switch` branch. The page only says "sealed kết hợp switch theo kiểu"; exhaustiveness checking is not taught before the question (only in its explain). Fix: add "compiler biết `sealed` có đúng những loại nào" to the intro before the predict.
- **mediator** after: lists "message broker" as a Mediator example, while Behavioral 1 just contrasted brokers with Observer/Pub-Sub. Fix: drop it or say "broker là Pub/Sub, không phải Mediator thuần".

### sd-concepts
- **saga-ops** (grouping): the section is titled "Phần 6: Saga" but its parts are outbox, rate limiting and observability. Rate limiting and observability have nothing to do with saga. Likewise "Phần 3: Replication" holds sharding and CAP. Fix: retitle ("Phần 6: Saga, outbox" and a new "Phần 7: Rate limiting và observability"; "Phần 3: Nhân bản và chia dữ liệu: replication, sharding, CAP").
- **cache-queue** part order: parts are cache-traps, message-queue, http-cache. The HTTP cache part belongs with the cache tiers, and the queue part interrupts the cache story ("Browser, CDN" were listed in the section intro). Fix: order cache-traps, http-cache, then message-queue (or move queue to its own section).
- **scale** predict: asks about the Caffeine province list, but "sticky session" appears in option 4 and is never defined. The predict also gives away the first `stateless-check` widget item (same Caffeine example) before the learner reaches it. Fix: define sticky session in one clause (or drop the option) and change the predict example to a different "cache in RAM" case.
- **realtime**: the part has four methods plus three shared concerns in 10 bullets. Terms used without gloss: heartbeat, `Last-Event-ID`, `proxy_buffering`, `onCompletion`, Redis Pub/Sub. Fix: keep the four methods in the intro and move the three shared concerns into a second short part "Chạy nhiều instance: ba điều phải lo", with a one-line gloss for heartbeat.
- **rate-limit** part repeats almost word for word the `INCR` + `EXPIRE` + Lua passage in lld-1 `token-bucket` after. Not wrong, but a learner doing both lessons reads the same paragraph twice. Fix: keep the full explanation in one lesson and link from the other.
- **microservices** quiz explain ("Đổi lại, join dữ liệu nhiều service trở nên khó.") does not justify the answer; the page does say the reason in the option. Fix: put the "đổi schema của A làm hỏng B" reason into the explain.
- **observability**: Micrometer, HikariCP, OpenTelemetry, `traceparent` are named without a gloss. Acceptable for an overview, but add "(thư viện đo)" style one-word glosses for Micrometer and HikariCP.

### sd-practice
- **checkout** (intro, before the first board): still nine paragraphs: oversell, hot row, ordering by `productId` and deadlock, `CHECK`, reservation with expiry. Scenario-before-result and whys are now correct, but one idea per section is not. Fix: move "đơn nhiều sản phẩm trừ theo `productId`" and the reservation-with-expiry paragraph into a part "Nhiều sản phẩm và giữ chỗ có hạn", leaving the section with the race and the conditional `UPDATE`.
- **chat** part: five ideas in seven paragraphs (connection map, message flow, ordering with `seq`, resend with `clientMsgId`, storage key and read marker). Fix: split "thứ tự và gửi lại an toàn" from "kết nối và luồng tin"; drop or defer `last_read_seq` and the Kafka key sentence.
- **notification** part: "DLT" is never defined (sd-concepts uses "DLQ"), and "outbox" and "at-least-once" are only referenced. Fix: write "DLT (dead-letter topic, giống DLQ ở bài System Design Concepts)" once.
- **news-feed**: `ZADD`, `ZREVRANGE`, `ZREMRANGEBYRANK` appear without a line saying what they do. Fix: one sentence ("Sorted Set: tập hợp có điểm, tự sắp xếp theo điểm; `ZADD` thêm, `ZREVRANGE` lấy từ điểm cao nhất").
- **search** after: "CDC" is undefined (and "GIN", `tsvector` only half-glossed). Fix: gloss CDC as "đọc log thay đổi của DB và phát thành event" and GIN as "kiểu index cho tìm theo từ".
- **seat-hold** repeats lld-2 movie-ticket (same conditional-`UPDATE` / `SET NX EX` idea). Not wrong; add a pointer in one of them.

### star-story
- **labs**: "Lab 5 / Lab 6 / Lab 7" are mentioned as if the learner knows them; the web has no page called that. Fix: link to the real lesson slugs (e.g. n-plus-one, tx-pitfalls) or write "bài lab N+1".
- **star** "Ví dụ mạnh": uses `JOIN FETCH`, `@EntityGraph`, batch size with no gloss. Since JPA is earlier in the course this is fine, but one pointer ("xem bài JPA fetch") would close the gap.
- Several quiz explains are fragments that do not give the why: opening of `intro` ("Ví dụ: ..."), `star` ("Và thừa nhận nếu..."), `reverse` ("Không nói xấu công ty cũ."). Fix: one sentence of reason each (e.g. reverse: "người nghe lo bạn sẽ nói xấu họ sau này, và câu trả lời về điều muốn có cho thấy động lực").

### weekly-quiz
- **method** and **final** intro: "luyện Feynman" is never defined and "bài Sơ đồ cơ chế cốt lõi" is not linked. Fix: one gloss ("Feynman: tự giải thích cơ chế bằng lời đơn giản như dạy người khác") and link `core-diagrams`.
- The three section quizzes (Integer cache, HashMap resize, thread-pool reject) test facts that this page does not teach (they come from other lessons). That is acceptable for a review page, but the explain for the thread-pool question does the arithmetic; add "xem bài thread pool" to make the origin clear.

## 3. Top 5 remaining fixes (ranked)

1. **sd-concepts structure**: regroup `saga-ops` and `data` (rate limiting and observability do not belong under "Saga"; sharding and CAP under "Replication"), reorder cache parts (http-cache before message-queue), and split the realtime part. This is still the least clear lesson.
2. **patterns-behavioral-2 `visitor`**: split classic Visitor from sealed + switch, use the same `Circle`/`Rect` types in both, and teach exhaustiveness before the predict.
3. **patterns-structural `proxy`**: move dynamic proxy, JDK vs CGLIB and self-invocation into a part, and show the `Service` interface that `loadTwice` belongs to.
4. **Predicts asked before their scenario is shown**: behavioral-1 `state` (enum code not yet seen), creational `builder` (POST rule not stated), behavioral-2 `visitor` (exhaustiveness), sd-concepts `scale` (sticky session undefined, Caffeine example repeated in the widget).
5. **sd-practice density**: split `checkout` intro (ordering by `productId` and reservation into a part), split `chat`, and define DLT / CDC / Sorted Set commands. Also fix the lld-2 movie-ticket "giữ chỗ" outcome that reads as contradictory.
