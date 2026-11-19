# Tổng quan

> Bắt đầu: 13/11/2026 · 2 giờ/ngày · Mục tiêu: phỏng vấn Java Spring Boot ~2 năm kinh nghiệm.
> Mỗi ngày: mở [[01 - Lộ trình 8 tuần|Roadmap]] → học → ghi vào [[08 - Nhật ký học tập]] → tick ô ở phần **Tiến độ** bên dưới.

## Tài liệu

| Tài liệu | Dùng khi |
|---|---|
| [[01 - Lộ trình 8 tuần]] | Xem hôm nay học gì |
| [[02 - Java Core, Collections & Stream API]] | Tuần 1–2 |
| ↳ [[02.01 - OOP & SOLID]] | Ngày 1 |
| ↳ [[02.02 - equals, hashCode & String]] | Ngày 2 |
| ↳ [[02.03 - Exception Handling]] | Ngày 3 |
| ↳ [[02.04 - HashMap Internals]] | Ngày 4 |
| ↳ [[02.05 - Collections Framework]] | Ngày 5 |
| ↳ [[02.06 - Lambda & Stream API]] | Ngày 8 |
| ↳ [[02.07 - Collectors]] | Ngày 9 |
| ↳ [[02.08 - Optional & Parallel Stream]] | Ngày 10 |
| ↳ [[02.09 - Java 17 & 21]] | Ngày 11 |
| ↳ [[02.10 - JVM Memory & GC]] | Ngày 12 |
| [[03 - Concurrency, SQL, REST & Security]] | Tuần 3, 6, 7 |
| ↳ [[03.01 - Thread Basics]] | Ngày 15 |
| ↳ [[03.02 - ThreadPoolExecutor]] | Ngày 16 |
| ↳ [[03.03 - CompletableFuture]] | Ngày 17 |
| ↳ [[03.04 - synchronized, volatile, Atomic & ConcurrentHashMap]] | Ngày 18 |
| ↳ [[03.05 - Deadlock, ThreadLocal & Virtual Threads]] | Ngày 19 |
| ↳ [[03.06 - Index & EXPLAIN]] | Ngày 39 |
| ↳ [[03.07 - SQL Queries & Pagination]] | Ngày 40 |
| ↳ [[03.08 - REST API Design]] | Ngày 43 |
| ↳ [[03.09 - Spring Security & JWT]] | Ngày 44 |
| ↳ [[03.10 - Redis Cache]] | Ngày 45 |
| ↳ [[03.11 - Kafka Basics]] | Ngày 46 |
| ↳ [[03.12 - Testing Spring Boot]] | Ngày 47 |
| [[04 - Spring Core, Boot & MVC]] | Tuần 4 |
| ↳ [[04.01 - IoC & Dependency Injection]] | Ngày 22 |
| ↳ [[04.02 - Bean Scope & Lifecycle]] | Ngày 23 |
| ↳ [[04.03 - Spring Boot Auto-configuration]] | Ngày 24 |
| ↳ [[04.04 - Spring MVC Request Flow]] | Ngày 25 |
| ↳ [[04.05 - Exception Handling, Validation & AOP]] | Ngày 26 |
| [[05 - Transaction & JPA]] | Tuần 5–6 |
| ↳ [[05.01 - Transaction Proxy Mechanism]] | Ngày 29 |
| ↳ [[05.02 - Khi @Transactional không hoạt động]] | Ngày 30 |
| ↳ [[05.03 - Propagation]] | Ngày 31 |
| ↳ [[05.04 - Isolation & readOnly]] | Ngày 32 |
| ↳ [[05.05 - TransactionTemplate & Transaction Events]] | Ngày 33 |
| ↳ [[05.06 - Entity Lifecycle & Persistence Context]] | Ngày 36 |
| ↳ [[05.07 - Lazy Loading & N+1]] | Ngày 37 |
| ↳ [[05.08 - Locking, Batch & Mapping]] | Ngày 38 |
| [[06 - Sơ đồ cơ chế cốt lõi]] | Vẽ lại sơ đồ khi luyện Feynman |
| [[07 - Bộ câu hỏi ôn tập hằng tuần]] | Chủ nhật hằng tuần (bấm vào **Đáp án** để mở) |
| [[08 - Nhật ký học tập]] | Ghi chép hằng ngày (tóm tắt / chỗ hổng / dự án / DSA) |
| [[09 - Hồ sơ dự án & STAR]] | Nguyên liệu trả lời "kể về dự án", hoàn thiện ở tuần 8 |
| [[10 - System Design & Behavioral]] | Tuần 8 |
| ↳ [[10.01 - System Design Concepts]] | Ngày 50 |
| ↳ [[10.02 - System Design Practice]] | Ngày 51 |
| ↳ [[10.03 - Project Story & STAR]] | Ngày 52 |
| [[11 - Labs thực hành]] | Thứ Bảy hằng tuần |
| ↳ [[11.01 - Lab 1 Collections]] | Ngày 6 |
| ↳ [[11.02 - Lab 2 Stream Queries]] | Ngày 13 |
| ↳ [[11.03 - Lab 3 Concurrency]] | Ngày 20 |
| ↳ [[11.04 - Lab 4 order-service Setup]] | Ngày 27 |
| ↳ [[11.05 - Lab 5 Transaction Bugs]] | Ngày 34 |
| ↳ [[11.06 - Lab 6 N+1, Locking & Index]] | Ngày 41 |
| ↳ [[11.07 - Lab 7 JWT, Cache & Tests]] | Ngày 48 |
| [[System Design Interview Guide.pdf]] | Tuần 8 |

## Nhịp 2 giờ

- **T2–T6:** 60' lý thuyết (iPad) → 40' DSA (laptop) → 20' Feynman (nói to + ghi âm + vẽ lại sơ đồ)
- **T7:** lab thực hành 2 giờ · **CN:** ôn + quiz + mock
- **Ngày mệt:** bản tối thiểu 20–30' (10 câu quiz, hoặc nghe lại ghi âm, hoặc vẽ lại 1 sơ đồ). Bỏ 1 ngày không sao, đừng bỏ 3 ngày liên tiếp.
- Bật **Focus mode "Học"** trên iPad, để điện thoại ở phòng khác.

## Tiến độ

### Tuần 1: OOP, equals/hashCode, String, Exception, Collections
- [ ] Ngày 1: OOP, interface vs abstract, overload/override, pass-by-value → [[02.01 - OOP & SOLID]]
- [ ] Ngày 2: `==` vs equals, equals/hashCode, String, immutable class → [[02.02 - equals, hashCode & String]]
- [ ] Ngày 3: Exception, try-with-resources, final/finally/finalize → [[02.03 - Exception Handling]]
- [ ] Ngày 4: HashMap internals, mutable key, HashSet → [[02.04 - HashMap Internals]]
- [ ] Ngày 5: ArrayList/LinkedList, TreeMap, LinkedHashMap, fail-fast, Comparator, List.of → [[02.05 - Collections Framework]]
- [ ] Ngày 6: 🛠 Lab: LRU cache, lỗi equals thiếu hashCode, ConcurrentModificationException → [[11.01 - Lab 1 Collections]]
- [ ] Ngày 7: Ôn + quiz tuần 1 + mock

### Tuần 2: Stream, Optional, Java 17/21, JVM & GC
- [ ] Ngày 8: Lambda, functional interface, Stream lazy → [[02.06 - Lambda & Stream API]]
- [ ] Ngày 9: Collectors → [[02.07 - Collectors]]
- [ ] Ngày 10: Optional, parallel stream → [[02.08 - Optional & Parallel Stream]]
- [ ] Ngày 11: Record, sealed, pattern matching → [[02.09 - Java 17 & 21]]
- [ ] Ngày 12: JVM memory, GC, memory leak → [[02.10 - JVM Memory & GC]]
- [ ] Ngày 13: 🛠 Lab: 20 truy vấn Stream trên Employee → [[11.02 - Lab 2 Stream Queries]]
- [ ] Ngày 14: Ôn + quiz tuần 2 + mock

### Tuần 3: Concurrency
- [ ] Ngày 15: Process/thread, Runnable/Callable, thread state → [[03.01 - Thread Basics]]
- [ ] Ngày 16: ThreadPoolExecutor → [[03.02 - ThreadPoolExecutor]]
- [ ] Ngày 17: CompletableFuture → [[03.03 - CompletableFuture]]
- [ ] Ngày 18: synchronized/volatile/Atomic/Lock, happens-before → [[03.04 - synchronized, volatile, Atomic & ConcurrentHashMap]]
- [ ] Ngày 19: Deadlock, ThreadLocal, virtual threads, ConcurrentHashMap → [[03.05 - Deadlock, ThreadLocal & Virtual Threads]]
- [ ] Ngày 20: 🛠 Lab: race condition, deadlock + jstack, CompletableFuture → [[11.03 - Lab 3 Concurrency]]
- [ ] Ngày 21: Ôn + quiz tuần 3 + mock

### Tuần 4: Spring Core, Boot, MVC
- [ ] Ngày 22: IoC/DI, constructor injection, circular dependency → [[04.01 - IoC & Dependency Injection]]
- [ ] Ngày 23: Bean scope, lifecycle → [[04.02 - Bean Scope & Lifecycle]]
- [ ] Ngày 24: Auto-configuration, config, profiles, Actuator → [[04.03 - Spring Boot Auto-configuration]]
- [ ] Ngày 25: Luồng request MVC, Filter/Interceptor/AOP → [[04.04 - Spring MVC Request Flow]]
- [ ] Ngày 26: Exception handling, validation, AOP, @Async/@Scheduled → [[04.05 - Exception Handling, Validation & AOP]]
- [ ] Ngày 27: 🛠 Lab: tạo project `order-service` → [[11.04 - Lab 4 order-service Setup]]
- [ ] Ngày 28: ✅ Checkpoint tháng 1

### Tuần 5: @Transactional
- [ ] Ngày 29: Proxy, TransactionInterceptor, CGLIB vs JDK proxy → [[05.01 - Transaction Proxy Mechanism]]
- [ ] Ngày 30: 7 lý do @Transactional không chạy, rollback rules → [[05.02 - Khi @Transactional không hoạt động]]
- [ ] Ngày 31: Propagation, UnexpectedRollbackException → [[05.03 - Propagation]]
- [ ] Ngày 32: Isolation, readOnly, gọi API ngoài transaction → [[05.04 - Isolation & readOnly]]
- [ ] Ngày 33: TransactionTemplate, @TransactionalEventListener, transaction trong test → [[05.05 - TransactionTemplate & Transaction Events]]
- [ ] Ngày 34: 🛠 Lab: tái hiện 5 lỗi transaction → [[11.05 - Lab 5 Transaction Bugs]]
- [ ] Ngày 35: Ôn + quiz tuần 5 + mock

### Tuần 6: JPA/Hibernate + SQL
- [ ] Ngày 36: Entity state, persistence context, dirty checking → [[05.06 - Entity Lifecycle & Persistence Context]]
- [ ] Ngày 37: LAZY/EAGER, LazyInitializationException, OSIV, N+1 → [[05.07 - Lazy Loading & N+1]]
- [ ] Ngày 38: Locking, batch insert, mapping, equals/hashCode của entity → [[05.08 - Locking, Batch & Mapping]]
- [ ] Ngày 39: Index, composite index, EXPLAIN → [[03.06 - Index & EXPLAIN]]
- [ ] Ngày 40: SQL (window function, JOIN), pagination, HikariCP → [[03.07 - SQL Queries & Pagination]]
- [ ] Ngày 41: 🛠 Lab: N+1, @Version, EXPLAIN + index → [[11.06 - Lab 6 N+1, Locking & Index]]
- [ ] Ngày 42: Ôn + quiz tuần 6 + mock

### Tuần 7: REST, Security, Redis, Kafka, Testing
- [ ] Ngày 43: REST, idempotency, status code → [[03.08 - REST API Design]]
- [ ] Ngày 44: Spring Security, JWT → [[03.09 - Spring Security & JWT]]
- [ ] Ngày 45: Redis cache → [[03.10 - Redis Cache]]
- [ ] Ngày 46: Kafka → [[03.11 - Kafka Basics]]
- [ ] Ngày 47: Testing, Testcontainers → [[03.12 - Testing Spring Boot]]
- [ ] Ngày 48: 🛠 Lab: JWT + Redis cache + test → [[11.07 - Lab 7 JWT, Cache & Tests]]
- [ ] Ngày 49: Ôn + quiz tuần 7 + mock

### Tuần 8: System design, Behavioral, Mock
- [ ] Ngày 50: System design khái niệm → [[10.01 - System Design Concepts]]
- [ ] Ngày 51: Thiết kế nhẹ (URL shortener, đặt hàng) → [[10.02 - System Design Practice]]
- [ ] Ngày 52: Câu chuyện dự án + STAR → [[10.03 - Project Story & STAR]]
- [ ] Ngày 53: Mock 1
- [ ] Ngày 54: Mock 2 + DSA bấm giờ
- [ ] Ngày 55: Ôn chỗ hổng trong [[08 - Nhật ký học tập]]
- [ ] Ngày 56: ✅ Checkpoint cuối + quiz tổng hợp
