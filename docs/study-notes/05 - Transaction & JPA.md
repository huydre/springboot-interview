# Transaction Management & Spring Data JPA / Hibernate

> Transaction (Tuần 5) và JPA/Hibernate (Tuần 6): nhóm chủ đề quan trọng nhất khi phỏng vấn Spring Boot.
> Lộ trình: [[01 - Lộ trình 8 tuần]] · Tổng quan: [[00 - Tổng quan]]

## Bài học

| Bài | Tuần | Ngày |
|---|---|---|
| [[05.01 - Transaction Proxy Mechanism]] | 5 | 29 |
| [[05.02 - Khi @Transactional không hoạt động]] | 5 | 30 |
| [[05.03 - Propagation]] | 5 | 31 |
| [[05.04 - Isolation & readOnly]] | 5 | 32 |
| [[05.05 - TransactionTemplate & Transaction Events]] | 5 | 33 |
| [[05.06 - Entity Lifecycle & Persistence Context]] | 6 | 36 |
| [[05.07 - Lazy Loading & N+1]] | 6 | 37 |
| [[05.08 - Locking, Batch & Mapping]] | 6 | 38 |

## Checklist tự kiểm tra

- [ ] Vẽ được luồng proxy → TransactionInterceptor → TransactionManager → ThreadLocal
- [ ] Kể được ≥5 lý do @Transactional không hoạt động
- [ ] Giải thích REQUIRED vs REQUIRES_NEW kèm ví dụ audit log
- [ ] Giải thích UnexpectedRollbackException
- [ ] Biết default isolation của DB đang dùng ở dự án
- [ ] 4 trạng thái entity, persist vs merge
- [ ] N+1: cách phát hiện + 4 cách sửa + bẫy phân trang
- [ ] OSIV là gì, vì sao nên tắt
- [ ] @Version hoạt động thế nào
- [ ] Vì sao IDENTITY làm hỏng batch insert
- [ ] Có 1–2 câu chuyện thật trong dự án về transaction/N+1
