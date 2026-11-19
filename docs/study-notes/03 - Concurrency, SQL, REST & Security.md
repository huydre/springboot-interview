# Concurrency, SQL, REST, Security, Cache/Kafka & Testing

> Concurrency (Tuần 3), SQL (Tuần 6) và REST, Security, Redis, Kafka, Testing (Tuần 7).
> Lộ trình: [[01 - Lộ trình 8 tuần]] · Tổng quan: [[00 - Tổng quan]]

## Bài học

| Bài | Tuần | Ngày |
|---|---|---|
| [[03.01 - Thread Basics]] | 3 | 15 |
| [[03.02 - ThreadPoolExecutor]] | 3 | 16 |
| [[03.03 - CompletableFuture]] | 3 | 17 |
| [[03.04 - synchronized, volatile, Atomic & ConcurrentHashMap]] | 3 | 18 |
| [[03.05 - Deadlock, ThreadLocal & Virtual Threads]] | 3 | 19 |
| [[03.06 - Index & EXPLAIN]] | 6 | 39 |
| [[03.07 - SQL Queries & Pagination]] | 6 | 40 |
| [[03.08 - REST API Design]] | 7 | 43 |
| [[03.09 - Spring Security & JWT]] | 7 | 44 |
| [[03.10 - Redis Cache]] | 7 | 45 |
| [[03.11 - Kafka Basics]] | 7 | 46 |
| [[03.12 - Testing Spring Boot]] | 7 | 47 |

## Checklist tự kiểm tra

- [ ] Giải thích thứ tự core → queue → max → reject của ThreadPoolExecutor
- [ ] Vì sao `newFixedThreadPool` nguy hiểm
- [ ] Viết CompletableFuture gọi song song 2 API + timeout + fallback
- [ ] `volatile` vs `synchronized` vs `AtomicInteger`
- [ ] 4 điều kiện deadlock + cách phòng tránh
- [ ] Leftmost prefix; 5 trường hợp index không được dùng; đọc EXPLAIN
- [ ] Viết top-N-mỗi-nhóm bằng window function
- [ ] PUT vs PATCH, idempotency key, 401 vs 403
- [ ] Vẽ luồng Spring Security filter chain + JWT
- [ ] Cache-aside + 3 sự cố cache
- [ ] Kafka: partition, consumer group, ordering, idempotent consumer
- [ ] Phân biệt @WebMvcTest / @DataJpaTest / @SpringBootTest; Testcontainers
