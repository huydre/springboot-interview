# Java Core, Collections, Stream API & JVM

> Java Core cho phỏng vấn: OOP, equals/hashCode, String, exception, collections, Stream, Java 17/21, JVM.
> Lộ trình: [[01 - Lộ trình 8 tuần]] · Tổng quan: [[00 - Tổng quan]]

## Bài học

| Bài | Tuần | Ngày |
|---|---|---|
| [[02.01 - OOP & SOLID]] | 1 | 1 |
| [[02.02 - equals, hashCode & String]] | 1 | 2 |
| [[02.03 - Exception Handling]] | 1 | 3 |
| [[02.04 - HashMap Internals]] | 1 | 4 |
| [[02.05 - Collections Framework]] | 1 | 5 |
| [[02.06 - Lambda & Stream API]] | 2 | 8 |
| [[02.07 - Collectors]] | 2 | 9 |
| [[02.08 - Optional & Parallel Stream]] | 2 | 10 |
| [[02.09 - Java 17 & 21]] | 2 | 11 |
| [[02.10 - JVM Memory & GC]] | 2 | 12 |

## Checklist tự kiểm tra

- [ ] Giải thích HashMap: hash → index → collision → treeify (8/64) → resize (0.75)
- [ ] Vì sao override equals phải override hashCode
- [ ] ConcurrentHashMap khác synchronizedMap thế nào; vì sao cấm null
- [ ] Viết tay groupingBy/counting/toMap/partitioningBy không cần IDE
- [ ] `orElse` vs `orElseGet`
- [ ] Parallel stream: commonPool và vì sao không dùng cho I/O
- [ ] Interface Java 8+ có những loại method nào
- [ ] Heap vs stack; GC generational; G1 là default
- [ ] Kể 1 lần debug memory leak / OOM (nếu có)
