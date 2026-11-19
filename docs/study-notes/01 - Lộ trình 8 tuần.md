# Lộ trình 8 tuần: Phỏng vấn Java Spring Boot (~2 năm kinh nghiệm)

> Tổng thời lượng: khoảng 112 giờ. Đây là **lộ trình chính**.
> `LK` = https://luminhkhuong.dev (ghép với đường dẫn phía sau). Các bài Q&A (02–05) nằm cùng thư mục này.
> Tick `[x]` vào từng ngày khi học xong để theo dõi tiến độ.

---

## Nguyên tắc

1. **Học → làm → nói.** Đọc lý thuyết, tự tay chạy code để tái hiện vấn đề, rồi **nói to** câu trả lời. Ở level 2 năm, người phỏng vấn phân biệt ứng viên bằng ví dụ thực tế chứ không bằng định nghĩa.
2. **Khung trả lời:** *Là gì → Hoạt động thế nào → Mình từng gặp/xử lý trong dự án ra sao.*
3. **Lỡ 1 ngày thì không học bù gấp đôi.** Dồn phần dở dang sang Chủ nhật (Chủ nhật có sẵn thời gian dự phòng).
4. **Lab code** để trong thư mục `labs/` của repo này. Mỗi tuần một package hoặc module, commit lại để sau này mở ra ôn.

## Nhịp 2 giờ mỗi ngày

| Ngày | 0:00–1:00 | 1:00–1:40 | 1:40–2:00 |
|---|---|---|---|
| **Thứ 2 – Thứ 6** | Lý thuyết (file Q&A + bài LK) | 1 bài DSA (LeetCode easy/medium) | Nói to 3 câu hỏi của hôm đó, ghi âm |
| **Thứ 7** | **Lab thực hành 2 giờ:** tái hiện và sửa vấn đề của tuần | | |
| **Chủ nhật** | Ôn lại checklist tuần + học bù phần còn dở | Quiz của tuần trong [[07 - Bộ câu hỏi ôn tập hằng tuần]] (15 phút) + mock: tự hỏi và trả lời 10 câu của tuần, bấm giờ | |

**Feynman (20 phút cuối mỗi ngày):** gấp tài liệu → giải thích to như đang dạy người mới, ghi âm → nghe lại và đánh dấu chỗ ấp úng → quay lại tài liệu → nói lại đơn giản hơn kèm 1 ví dụ. Với các cơ chế có luồng chạy (proxy/@Transactional, HashMap, ThreadPool, MVC, N+1, Security), **tự vẽ lại** sơ đồ trong [[06 - Sơ đồ cơ chế cốt lõi]] ra giấy rồi mới so với bản gốc.

DSA bám theo lộ trình trên web: `LK /technical-knowledge/dsa/week-N-...`. Mỗi ngày làm 1 bài, đọc lesson doc trước khi làm. Cả 8 tuần làm được khoảng 40 bài, đủ cho level 2 năm.

---

## THÁNG 1: Nền tảng Java + Spring

### Tuần 1: OOP, equals/hashCode, String, Exception, Collections

DSA tuần này: [week-1-arrays-strings-prefix-sums](https://luminhkhuong.dev/technical-knowledge/dsa/week-1-arrays-strings-prefix-sums), [week-4-hash-tables-sets](https://luminhkhuong.dev/technical-knowledge/dsa/week-4-hash-tables-sets)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | 4 tính chất OOP, interface vs abstract class (Java 8+), overloading/overriding, pass-by-value | [[02.01 - OOP & SOLID]] · LK [java-oop](https://luminhkhuong.dev/technical-knowledge/java/java-oop) |
| [ ] T3 | `==` vs `equals`, contract equals/hashCode, String immutable, String pool, immutable class | [[02.02 - equals, hashCode & String]] |
| [ ] T4 | Exception: checked/unchecked, try-with-resources, final/finally/finalize | [[02.03 - Exception Handling]] |
| [ ] T5 | **HashMap internals**, mutable key, HashSet | [[02.04 - HashMap Internals]] · LK [java-collections](https://luminhkhuong.dev/technical-knowledge/java/java-collections) (mục 3) |
| [ ] T6 | ArrayList/LinkedList, TreeMap, LinkedHashMap, fail-fast, Comparator, `List.of` | [[02.05 - Collections Framework]] |
| [ ] T7 | [[11.01 - Lab 1 Collections]] · **Lab:** (1) viết LRU cache bằng `LinkedHashMap` + unit test; (2) tạo class có equals mà thiếu hashCode, cho vào HashSet và quan sát lỗi; (3) tái hiện `ConcurrentModificationException` rồi sửa bằng `removeIf` | |
| [ ] CN | Ôn + mock 10 câu tuần 1 | LK [java-collections-interview](https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-collections-interview) |

### Tuần 2: Java 8+, Stream API, Optional, Java 17/21, JVM & GC

DSA tuần này: [week-2-two-pointers-sliding-window](https://luminhkhuong.dev/technical-knowledge/dsa/week-2-two-pointers-sliding-window)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | Functional interface, lambda, method reference; Stream lazy, intermediate vs terminal | [[02.06 - Lambda & Stream API]] |
| [ ] T3 | **Collectors**: groupingBy, counting, partitioningBy, toMap (key trùng), joining | [[02.07 - Collectors]] |
| [ ] T4 | Optional dùng đúng cách, `orElse` vs `orElseGet`; parallel stream và commonPool | [[02.08 - Optional & Parallel Stream]] · LK [java-8-tricky-interview-questions](https://luminhkhuong.dev/technical-knowledge/interview-questions/java/java-8-tricky-interview-questions) |
| [ ] T5 | Record, sealed, pattern matching switch, text block, `var` | [[02.09 - Java 17 & 21]] |
| [ ] T6 | JVM memory (heap/stack/metaspace), GC generational, G1/ZGC, memory leak | [[02.10 - JVM Memory & GC]] · LK [java-jvm](https://luminhkhuong.dev/technical-knowledge/java/java-jvm), [java-gc](https://luminhkhuong.dev/technical-knowledge/java/java-gc) |
| [ ] T7 | [[11.02 - Lab 2 Stream Queries]] · **Lab:** tạo list khoảng 50 `Employee` (record), viết 20 truy vấn stream: lương trung bình theo phòng, top 3 mỗi phòng, lương cao thứ 2, đếm tần suất từ… Viết **không dùng IDE gợi ý** cho ít nhất 5 truy vấn | |
| [ ] CN | Ôn + mock tuần 1–2 | |

### Tuần 3: Concurrency

DSA tuần này: [week-3-linked-lists-pointers](https://luminhkhuong.dev/technical-knowledge/dsa/week-3-linked-lists-pointers), [week-5-stacks-queues-monotonic](https://luminhkhuong.dev/technical-knowledge/dsa/week-5-stacks-queues-monotonic)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | Process vs thread, Runnable/Callable, trạng thái thread | [[03.01 - Thread Basics]] |
| [ ] T3 | **ThreadPoolExecutor** (core → queue → max → reject), lý do `newFixedThreadPool` nguy hiểm | [[03.02 - ThreadPoolExecutor]] · LK [java-concurrency](https://luminhkhuong.dev/technical-knowledge/java/java-concurrency) (mục 5) |
| [ ] T4 | **CompletableFuture**: thenApply/Compose/Combine, allOf, exceptionally, timeout | [[03.03 - CompletableFuture]] · LK [java-concurrency](https://luminhkhuong.dev/technical-knowledge/java/java-concurrency) (mục 7) |
| [ ] T5 | synchronized/volatile/Atomic/ReentrantLock, happens-before | [[03.04 - synchronized, volatile, Atomic & ConcurrentHashMap]] |
| [ ] T6 | Deadlock, ThreadLocal, virtual threads, ConcurrentHashMap | [[03.05 - Deadlock, ThreadLocal & Virtual Threads]] · LK [java-virtual-threads](https://luminhkhuong.dev/technical-knowledge/java/java-virtual-threads) |
| [ ] T7 | [[11.03 - Lab 3 Concurrency]] · **Lab:** (1) cho 100 thread cùng `count++` để thấy sai, sửa lần lượt bằng `synchronized`, `AtomicInteger`, `LongAdder`; (2) tạo deadlock 2 lock, bắt bằng `jstack`, sửa bằng lock theo thứ tự cố định; (3) gọi song song 2 "service" giả (`Thread.sleep`) bằng CompletableFuture + executor riêng + timeout + fallback | |
| [ ] CN | Ôn + mock tuần 3 | |

### Tuần 4: Spring Core, Spring Boot, Spring MVC

DSA tuần này: [week-9-binary-search](https://luminhkhuong.dev/technical-knowledge/dsa/week-9-binary-search)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | IoC/DI, constructor injection, circular dependency, nhiều bean cùng kiểu | [[04.01 - IoC & Dependency Injection]] · LK [spring-framework](https://luminhkhuong.dev/technical-knowledge/spring/spring-framework) |
| [ ] T3 | Bean scope (singleton có thread-safe không, prototype trong singleton), vòng đời bean | [[04.02 - Bean Scope & Lifecycle]] · LK [spring-framework-deep-dive](https://luminhkhuong.dev/technical-knowledge/spring/spring-framework-deep-dive) |
| [ ] T4 | **Auto-configuration**, `SpringApplication.run`, `@ConfigurationProperties`, profiles, Actuator | [[04.03 - Spring Boot Auto-configuration]] · LK [spring-boot-internals](https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-internals), [spring-boot-configuration-properties](https://luminhkhuong.dev/technical-knowledge/spring/spring-boot-configuration-properties) |
| [ ] T5 | **Luồng request MVC**, Filter vs Interceptor vs AOP | [[04.04 - Spring MVC Request Flow]] · LK [spring-mvc](https://luminhkhuong.dev/technical-knowledge/spring/spring-mvc) |
| [ ] T6 | Exception handling (`ProblemDetail`), validation, AOP, bẫy `@Async`/`@Scheduled` | [[04.05 - Exception Handling, Validation & AOP]] · LK [spring-exception-handling](https://luminhkhuong.dev/technical-knowledge/spring/spring-exception-handling), [spring-aop](https://luminhkhuong.dev/technical-knowledge/spring/spring-aop) |
| [ ] T7 | [[11.04 - Lab 4 order-service Setup]] · **Lab (dùng tiếp đến hết khoá học):** tạo project Spring Boot 3 `order-service`: entity `Customer`, `Order`, `OrderItem`, `Product` (PostgreSQL qua Docker); CRUD API với DTO record, validation, `@RestControllerAdvice` + `ProblemDetail`, profile `dev`/`test`, Actuator; viết 1 `@Aspect` đo thời gian chạy method. Chạy với `--debug` và đọc Condition Evaluation Report | |
| [ ] CN | **Checkpoint tháng 1:** làm hết checklist cuối [[02 - Java Core, Collections & Stream API]] và [[04 - Spring Core, Boot & MVC]]. Câu nào chưa trả lời trơn tru thì ghi lại để ôn thêm ở tuần 8 | |

---

## THÁNG 2: Dữ liệu, bảo mật, hệ thống, luyện phỏng vấn

### Tuần 5: @Transactional (chủ đề quan trọng nhất)

DSA tuần này: [week-6-binary-trees-bst](https://luminhkhuong.dev/technical-knowledge/dsa/week-6-binary-trees-bst)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | Cơ chế proxy, `TransactionInterceptor`, ThreadLocal; JDK proxy vs CGLIB | [[05.01 - Transaction Proxy Mechanism]] · LK [spring-transactional-deep-dive](https://luminhkhuong.dev/technical-knowledge/spring/spring-transactional-deep-dive) (Part 1) |
| [ ] T3 | 7 lý do @Transactional không chạy; rollback rules | [[05.02 - Khi @Transactional không hoạt động]] · LK [spring-transactional-deep-dive](https://luminhkhuong.dev/technical-knowledge/spring/spring-transactional-deep-dive) (Part 5, 6) |
| [ ] T4 | **Propagation**: REQUIRED/REQUIRES_NEW/NESTED; `UnexpectedRollbackException` | [[05.03 - Propagation]] · LK [spring-transactional-deep-dive](https://luminhkhuong.dev/technical-knowledge/spring/spring-transactional-deep-dive) (Part 2) |
| [ ] T5 | Isolation level và các anomaly; `readOnly`; không gọi API ngoài trong transaction | [[05.04 - Isolation & readOnly]] · LK [isolation-levels](https://luminhkhuong.dev/technical-knowledge/database/isolation-levels) |
| [ ] T6 | `TransactionTemplate`, `@TransactionalEventListener`, transaction trong test | [[05.05 - TransactionTemplate & Transaction Events]] |
| [ ] T7 | [[11.05 - Lab 5 Transaction Bugs]] · **Lab trên `order-service`:** viết test tái hiện từng lỗi: (1) self-invocation làm mất transaction; (2) checked exception vẫn commit; (3) audit log `REQUIRES_NEW` vẫn được lưu khi transaction ngoài rollback; (4) `UnexpectedRollbackException`; (5) gửi "email" sau commit bằng `@TransactionalEventListener(AFTER_COMMIT)` | |
| [ ] CN | Ôn + mock: giải thích @Transactional trong 3 phút không cần nhìn tài liệu | |

### Tuần 6: JPA/Hibernate + SQL

DSA tuần này: [week-7-graph-foundations](https://luminhkhuong.dev/technical-knowledge/dsa/week-7-graph-foundations)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | Entity state, persist vs merge, persistence context, dirty checking, flush | [[05.06 - Entity Lifecycle & Persistence Context]] · LK [spring-data-jpa](https://luminhkhuong.dev/technical-knowledge/spring/spring-data-jpa) |
| [ ] T3 | LAZY/EAGER, `LazyInitializationException`, OSIV, **N+1** và cách sửa | [[05.07 - Lazy Loading & N+1]] · LK [hibernate-association-best-practices](https://luminhkhuong.dev/technical-knowledge/spring/hibernate-association-best-practices) |
| [ ] T4 | Optimistic/pessimistic lock, batch insert, mapping quan hệ, equals/hashCode của entity | [[05.08 - Locking, Batch & Mapping]] · LK [optimistic-vs-pessimistic-lock-deep-dive](https://luminhkhuong.dev/technical-knowledge/database/optimistic-vs-pessimistic-lock-deep-dive) |
| [ ] T5 | **Index**: B+Tree, clustered, composite/leftmost prefix, khi nào index không được dùng, EXPLAIN | [[03.06 - Index & EXPLAIN]] · LK [indexing-query-optimization](https://luminhkhuong.dev/technical-knowledge/database/indexing-query-optimization) |
| [ ] T6 | Viết SQL (window function, JOIN, HAVING), pagination, HikariCP, projection, Specification | [[03.07 - SQL Queries & Pagination]] · LK [sql-interview-questions](https://luminhkhuong.dev/technical-knowledge/interview-questions/java/sql-interview-questions) |
| [ ] T7 | [[11.06 - Lab 6 N+1, Locking & Index]] · **Lab trên `order-service`:** (1) bật log SQL, tái hiện N+1 ở API `GET /orders`, sửa lần lượt bằng `JOIN FETCH`, `@EntityGraph`, `default_batch_fetch_size` và ghi lại số query mỗi cách; (2) thêm `@Version` vào `Product`, viết test 2 thread cùng trừ kho để thấy `OptimisticLockException`; (3) seed khoảng 100k đơn hàng, chạy `EXPLAIN` trước và sau khi thêm composite index | |
| [ ] CN | Ôn + mock tuần 5–6 (2 tuần quan trọng nhất) | LK [spring-data-jpa-interview-questions](https://luminhkhuong.dev/technical-knowledge/spring/spring-data-jpa-interview-questions) |

### Tuần 7: REST, Security/JWT, Redis, Kafka, Testing

DSA tuần này: [week-12-heaps-greedy](https://luminhkhuong.dev/technical-knowledge/dsa/week-12-heaps-greedy), [week-11-intervals-sweep-line](https://luminhkhuong.dev/technical-knowledge/dsa/week-11-intervals-sweep-line)

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | REST: safe/idempotent, idempotency key, status code, versioning, backward compatibility | [[03.08 - REST API Design]] · LK [api-design](https://luminhkhuong.dev/technical-knowledge/system-design/api-design) |
| [ ] T3 | **Spring Security** filter chain, `SecurityFilterChain`, luồng JWT, BCrypt, CORS/CSRF | [[03.09 - Spring Security & JWT]] · LK [spring-security](https://luminhkhuong.dev/technical-knowledge/spring/spring-security) |
| [ ] T4 | Redis cache-aside, `@Cacheable`, các sự cố penetration/stampede/avalanche | [[03.10 - Redis Cache]] · LK [caching-strategies](https://luminhkhuong.dev/technical-knowledge/system-design/caching-strategies) |
| [ ] T5 | Kafka: partition, consumer group, ordering, offset, idempotent consumer | [[03.11 - Kafka Basics]] · LK [intro](https://luminhkhuong.dev/technical-knowledge/kafka/intro) |
| [ ] T6 | Testing: unit + Mockito, `@WebMvcTest`, `@DataJpaTest`, `@SpringBootTest`, Testcontainers | [[03.12 - Testing Spring Boot]] · LK [spring-test-annotations](https://luminhkhuong.dev/technical-knowledge/test/spring-test-annotations) |
| [ ] T7 | [[11.07 - Lab 7 JWT, Cache & Tests]] · **Lab trên `order-service`:** (1) thêm JWT (login cấp token, phân quyền `ADMIN`/`USER`); (2) `@Cacheable` cho `GET /products/{id}` với Redis + TTL, evict khi update; (3) viết 1 `@WebMvcTest`, 1 `@DataJpaTest` và 1 integration test dùng Testcontainers PostgreSQL. *(Kafka chỉ cần thêm nếu còn thời gian: publish event `OrderCreated`.)* | |
| [ ] CN | Ôn + mock tuần 7 | |

### Tuần 8: System design nhẹ, Behavioral, Mock interview

DSA tuần này: [week-10-recursion-backtracking](https://luminhkhuong.dev/technical-knowledge/dsa/week-10-recursion-backtracking), [week-13-dynamic-programming-1d](https://luminhkhuong.dev/technical-knowledge/dsa/week-13-dynamic-programming-1d) (chỉ bài cơ bản), ôn lại các bài sai

| | Chủ đề | Tài liệu |
|---|---|---|
| [ ] T2 | System design khái niệm: scaling, load balancer, cache, queue, CAP, consistency, sharding | [[10.01 - System Design Concepts]] · [[System Design Interview Guide.pdf]] · LK [microservices-patterns](https://luminhkhuong.dev/technical-knowledge/system-design/microservices-patterns) (circuit breaker, saga ở mức khái niệm) |
| [ ] T3 | Thiết kế nhẹ: URL shortener, hệ thống đặt hàng; trình bày yêu cầu → API → DB → cache → scale | [[10.02 - System Design Practice]] · LK [common-interview-questions](https://luminhkhuong.dev/technical-knowledge/system-design/common-interview-questions) |
| [ ] T4 | **Câu chuyện dự án** (xem mục bên dưới) + 8–10 câu chuyện STAR | [[10.03 - Project Story & STAR]] · LK [behavioral-story-bank](https://luminhkhuong.dev/technical-knowledge/interview-questions/behavioral/behavioral-story-bank), [behavioral-star-method](https://luminhkhuong.dev/technical-knowledge/interview-questions/behavioral/behavioral-star-method) |
| [ ] T5 | **Mock 1:** đọc to và trả lời toàn bộ bài mock (bấm giờ 60 phút) | LK [tcs-java-springboot-interview-3-years](https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/mock/tcs-java-springboot-interview-3-years) |
| [ ] T6 | **Mock 2** + 1 bài DSA medium bấm giờ 30 phút | LK [scenario-based-springboot-interview-questions](https://luminhkhuong.dev/technical-knowledge/interview-questions/genz-career/spring-boot/scenario-based-springboot-interview-questions) |
| [ ] T7 | Ôn các câu đã ghi lại ở checkpoint tháng 1 và câu trả lời yếu trong mock; chuẩn bị câu hỏi ngược cho nhà tuyển dụng | LK [behavioral-questions-to-ask](https://luminhkhuong.dev/technical-knowledge/interview-questions/behavioral/behavioral-questions-to-ask) |
| [ ] CN | **Checkpoint cuối:** làm hết checklist của 4 bài Q&A (02–05). Nhờ bạn bè hoặc đồng nghiệp phỏng vấn thử 1 buổi nếu được | |

---

## Câu chuyện dự án: chuẩn bị ở tuần 8, bổ sung dần từ tuần 1

Mỗi khi học xong một chủ đề, ghi 1–2 câu về **chỗ chủ đề đó xuất hiện trong dự án thật của bạn** vào một file riêng. Đến tuần 8, gom lại thành:

1. **Giới thiệu dự án** (1 phút): domain, quy mô, kiến trúc, tech stack, vai trò của bạn.
2. **Vấn đề kỹ thuật khó nhất** đã giải quyết: bối cảnh → cách điều tra → giải pháp → kết quả có số liệu.
3. **Một sự cố hoặc sai lầm** và bài học rút ra.
4. **Nếu làm lại** thì sẽ cải thiện gì.

Nếu dự án thật thiếu ví dụ, lấy từ project `order-service` ở các lab (N+1, optimistic lock, cache, JWT). Đó cũng là trải nghiệm thật do chính tay bạn làm.

## Mốc đánh giá

| Mốc | Phải đạt |
|---|---|
| Hết tuần 2 | Giải thích HashMap trơn tru; viết tay được 10 truy vấn Collectors |
| Hết tuần 4 | Vẽ được luồng request MVC và giải thích auto-configuration; `order-service` chạy được |
| Hết tuần 6 | Giải thích @Transactional và N+1 trong 3 phút, kèm demo từ lab |
| Hết tuần 8 | Hoàn thành 2 buổi mock; khoảng 40 bài DSA; câu chuyện dự án đã sẵn sàng |

## Không cần học ở level 2 năm

Kubernetes nâng cao, multi-cloud, chaos engineering, SIEM, chi tiết service mesh, AQS internals, LMAX Disruptor, tuning GC/WAL sâu, DP 2D khó, Trie/Union-Find/MST (chỉ cần biết khái niệm). Phần lớn `question.md` thuộc nhóm DevOps/Cloud cũng nằm ngoài phạm vi này.
