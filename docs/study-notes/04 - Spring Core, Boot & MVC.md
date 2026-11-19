# Spring Core, Spring Boot & Spring MVC

> Spring Core, Spring Boot và Spring MVC (Tuần 4).
> Lộ trình: [[01 - Lộ trình 8 tuần]] · Tổng quan: [[00 - Tổng quan]]

## Bài học

| Bài | Tuần | Ngày |
|---|---|---|
| [[04.01 - IoC & Dependency Injection]] | 4 | 22 |
| [[04.02 - Bean Scope & Lifecycle]] | 4 | 23 |
| [[04.03 - Spring Boot Auto-configuration]] | 4 | 24 |
| [[04.04 - Spring MVC Request Flow]] | 4 | 25 |
| [[04.05 - Exception Handling, Validation & AOP]] | 4 | 26 |

## Checklist tự kiểm tra

- [ ] Giải thích được vì sao chọn constructor injection
- [ ] Singleton có thread-safe không; prototype trong singleton
- [ ] Liệt kê vòng đời bean, biết proxy được tạo ở bước nào
- [ ] Auto-configuration: file `.imports` + `@ConditionalOnMissingBean`
- [ ] Vẽ luồng request: Filter → DispatcherServlet → … → HttpMessageConverter
- [ ] Filter vs Interceptor vs AOP
- [ ] Viết được `@RestControllerAdvice` + validation
- [ ] Self-invocation ảnh hưởng những annotation nào
- [ ] `@Async`/`@Scheduled` gặp vấn đề gì khi scale nhiều instance
