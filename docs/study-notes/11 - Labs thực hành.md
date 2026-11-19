# Labs thực hành

> Mỗi **thứ Bảy** là một buổi lab khoảng 2 giờ: tự tay tái hiện vấn đề của tuần rồi sửa nó. Đây là nguồn "ví dụ thật" mạnh nhất khi phỏng vấn: "em đã tự đo, tự sửa" luôn thuyết phục hơn "em đã đọc".
> Lộ trình: [[01 - Lộ trình 8 tuần]] · Tổng quan: [[00 - Tổng quan]]
> Lời giải tham khảo nằm trong thư mục `labs/` của repo `springboot-interview`. Hãy **tự làm trước**, chỉ mở lời giải khi bí hoặc khi đã xong để so sánh.

## Danh sách lab

| Lab | Tuần · Ngày | Nội dung | Lời giải trong repo |
|---|---|---|---|
| [[11.01 - Lab 1 Collections]] | 1 · 6 | LRU cache, lỗi equals thiếu hashCode, ConcurrentModificationException | `labs/java-labs/lab1-collections/` |
| [[11.02 - Lab 2 Stream Queries]] | 2 · 13 | 20 truy vấn Stream trên danh sách Employee | `labs/java-labs/lab2-stream-queries/` |
| [[11.03 - Lab 3 Concurrency]] | 3 · 20 | Race condition, deadlock + jstack, CompletableFuture song song | `labs/java-labs/lab3-concurrency/` |
| [[11.04 - Lab 4 order-service Setup]] | 4 · 27 | Tạo project `order-service`: REST, validation, ProblemDetail, profile, AOP | `labs/order-service/` |
| [[11.05 - Lab 5 Transaction Bugs]] | 5 · 34 | Tái hiện và sửa 5 lỗi transaction | `labs/order-service/` |
| [[11.06 - Lab 6 N+1, Locking & Index]] | 6 · 41 | N+1 và 3 cách sửa, `@Version`, EXPLAIN trước/sau khi thêm index | `labs/order-service/` |
| [[11.07 - Lab 7 JWT, Cache & Tests]] | 7 · 48 | JWT, Redis cache, `@WebMvcTest`, `@DataJpaTest`, Testcontainers | `labs/order-service/` |

## Cách làm một buổi lab

1. Đọc phần **Yêu cầu** của từng bài, tự viết code (Lab 4 trở đi làm trong project `order-service` của riêng bạn).
2. Bí quá 15 phút thì mở **Gợi ý**; vẫn bí thì xem **Lời giải**, hiểu rồi tự viết lại không nhìn.
3. So kết quả của bạn với **Kết quả mong đợi** (đều là số liệu đo thật).
4. Cuối buổi: ghi 3–5 dòng vào [[08 - Nhật ký học tập]] và cập nhật bảng ví dụ trong [[09 - Hồ sơ dự án & STAR]].

## Yêu cầu môi trường

| Công cụ | Dùng cho |
|---|---|
| JDK 21 | Tất cả lab |
| Docker | Lab 4–7 (PostgreSQL, Redis qua Docker Compose hoặc Testcontainers) |
| IDE (IntelliJ IDEA) | Viết code; riêng Lab 2 nên tắt gợi ý code cho ít nhất 5 câu |
