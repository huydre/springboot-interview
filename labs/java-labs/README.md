# Java Labs (Tuần 1–3)

Lời giải tham khảo cho 3 lab Java Core trong lộ trình 8 tuần. Mỗi file là một chương trình
Java độc lập, không cần thư viện ngoài, tự in `PASS`/`FAIL` cho từng kiểm tra.

Yêu cầu: JDK 21 (chạy file nguồn trực tiếp bằng `java File.java`, không cần `javac`).

| Thư mục | Lab | File |
|---|---|---|
| `lab1-collections/` | Lab 1: Collections | `LruCacheLab`, `EqualsHashCodeLab`, `ConcurrentModificationLab`, `MutableKeyLab` |
| `lab2-stream-queries/` | Lab 2: Stream Queries | `StreamQueriesLab` (50 Employee, 20 truy vấn) |
| `lab3-concurrency/` | Lab 3: Concurrency | `RaceConditionLab`, `DeadlockLab`, `CompletableFutureLab` |

## Cách chạy

```bash
cd labs/java-labs/lab1-collections
java LruCacheLab.java

# Chạy tất cả
cd labs/java-labs
for f in */*.java; do echo "== $f"; java "$f"; done

# Giữ deadlock 60 giây để xem bằng jstack (mở terminal khác)
java lab3-concurrency/DeadlockLab.java --hold
jstack <pid>
```

Thời gian đo trong lab 3 phụ thuộc máy và lần chạy; chỉ so sánh tương đối, đo chuẩn thì dùng JMH.
