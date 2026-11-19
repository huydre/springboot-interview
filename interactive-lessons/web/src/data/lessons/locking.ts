import timeline from "../timelines/locking.json";
import type { Lesson, Scene } from "../types";

// Measured on Spring Boot 3.5 + Hibernate ORM 6.6 + PostgreSQL 16.14 (Docker), JDK 21; JDBC round trips counted with a proxy around
// the DataSource. See study note 05.08. Video not rendered yet: scenes stay empty until publish.
export const locking: Lesson = {
  slug: "locking",
  crumb: "Locking, Batch & Mapping",
  videoDir: "/videos/locking",
  videoVersion: "fcc793ab",
  scenes: timeline as Scene[],
  title: "Locking, Batch & Mapping",
  subtitle:
    "Lost update và ba cách giải: @Version, SELECT FOR UPDATE, UPDATE nguyên tử; batch insert và bẫy IDENTITY; bulk update với @Modifying; mapping quan hệ; equals, hashCode và Lombok @Data.",
  openingQuiz: {
    question: "Stock 10, 20 thread cùng chạy update ... set stock = stock - 1 where id = ? and stock >= 1. Kết quả?",
    options: ["Stock âm", "10 thành công, 10 trả về 0 dòng, stock cuối 0", "Deadlock", "Chỉ 1 thành công"],
    answer: 1,
    explain: "Đã đo. DB khoá dòng trong lúc update và đánh giá lại điều kiện trên giá trị mới.",
  },
  roadmap: [
    "Chặng 1: lost update, optimistic, pessimistic, UPDATE nguyên tử.",
    "Chặng 2: batch insert và bulk update.",
    "Chặng 3: mapping quan hệ, equals và hashCode.",
  ],
  sections: [
    {
      id: "locks",
      title: "Phần 1: Lost update và ba cách giải",
      scene: "locks",
      intro: [
        "Đọc, sửa trong Java, ghi lại: hai transaction cùng đọc 100, bên sau đè bên trước. Đã đo không có `@Version`: rút 50 và 30 từ 100 còn **50** (đúng là 20); 10 thread trừ 1 còn **99** (đúng là 90).",
        "`@Version` sinh `where id=? and version=?`, khớp 0 dòng thì `ObjectOptimisticLockingFailureException` (cause `StaleObjectStateException`), hợp xung đột hiếm và form web (gửi version về client). `PESSIMISTIC_WRITE` sinh `for no key update` trên PostgreSQL: B chờ 1125 ms, balance cuối 20; cần transaction, khoá theo thứ tự id để tránh deadlock. UPDATE nguyên tử có điều kiện `stock >= :q`, kiểm tra số dòng bị ảnh hưởng: nhanh và đơn giản nhất cho trừ kho.",
      ],
      widget: "lock-race",
      widgetTitle: "Cùng tranh một dòng",
      quiz: {
        question: "Chuyển tiền A sang B và B sang A cùng lúc với FOR UPDATE. Tránh deadlock thế nào?",
        options: ["Dùng SERIALIZABLE", "Luôn khoá theo thứ tự id tăng dần bất kể chiều chuyển", "Thêm @Version", "Tăng timeout"],
        answer: 1,
        explain: "Cùng thứ tự thì bên sau chỉ chờ, không vòng chờ nhau.",
      },
    },
    {
      id: "batch",
      title: "Phần 2: Batch insert và bẫy IDENTITY",
      scene: "batch",
      intro: [
        "Bật `hibernate.jdbc.batch_size=50`, `order_inserts`, `order_updates`. Nhưng `IDENTITY` để DB sinh id lúc INSERT, mà Hibernate cần id ngay khi persist, nên INSERT từng dòng và **batching bị tắt**. Đã đo 1 000 entity: IDENTITY 1 000 INSERT, 0 batch; SEQUENCE (allocationSize 50) 20 nextval và **20** executeBatch.",
        "Batch lớn: `flush()` + `clear()` mỗi 50 dòng: 50 000 entity còn 0 trong context thay vì 50 000; thời gian đo trên máy tải cao không kết luận được. Hàng triệu dòng: `JdbcTemplate.batchUpdate` hoặc `COPY`. `allocationSize` phải khớp `INCREMENT BY` của sequence.",
      ],
      widget: "batch-insert",
      widgetTitle: "IDENTITY và SEQUENCE",
      quiz: {
        question: "Vì sao IDENTITY làm hỏng JDBC batching?",
        options: ["Vì chậm", "Hibernate cần id ngay khi persist mà IDENTITY chỉ có id sau INSERT, nên phải INSERT ngay từng dòng", "Vì PostgreSQL không hỗ trợ", "Vì thiếu order_inserts"],
        answer: 1,
        explain: "Đổi sang SEQUENCE với allocationSize.",
      },
    },
    {
      id: "bulk",
      title: "Phần 3: Bulk update với @Modifying",
      scene: "bulk",
      intro: [
        "`@Modifying @Query(\"update ...\")` chạy thẳng xuống DB, không qua persistence context. Đã đo: load stock 10, bulk về 0, `findById` lại vẫn thấy **10** và cùng instance; `clearAutomatically = true` thì thấy 0.",
        "Bẫy nguy hiểm nhất: sau bulk update, `setStock(stock - 1)` trên entity cũ cho DB cuối **stock 9, version 1**: bulk update bị ghi đè vì nó không tăng `@Version`. Gọi ngoài transaction: `InvalidDataAccessApiUsageException: Executing an update/delete query`.",
      ],
      widget: "bulk-update",
      widgetTitle: "Bulk update và entity đã load",
      quiz: {
        question: "clearAutomatically = true có rủi ro gì?",
        options: ["Không có", "Xoá luôn thay đổi chưa flush của entity khác; thêm flushAutomatically = true", "Làm chậm DB", "Tắt @Version"],
        answer: 1,
        explain: "Flush trước rồi mới chạy bulk.",
      },
    },
    {
      id: "mapping",
      title: "Phần 4: Mapping quan hệ",
      scene: "mapping",
      intro: [
        "Phía có `@JoinColumn` (thường `@ManyToOne`) là **owner** quyết định khoá ngoại; phía `mappedBy` bị bỏ qua khi ghi. Chỉ `items.add(item)` mà không `item.setOrder(order)` thì `order_id` là null: luôn có helper `addItem`/`removeItem` đồng bộ hai phía.",
        "Mọi association LAZY; ưu tiên `@ManyToOne` một chiều; `cascade = ALL` + `orphanRemoval` chỉ cho composition (đo được `removeItem` sinh 1 DELETE); không cascade trên `@ManyToOne`/`@ManyToMany`; bảng trung gian có cột thêm thì map thành entity riêng; `@ManyToMany` dùng `Set`; không trả entity ra JSON.",
      ],
      quiz: {
        question: "orphanRemoval = true khác CascadeType.REMOVE ở đâu?",
        options: ["Giống nhau", "Ngoài xoá cha thì xoá con, gỡ con khỏi collection cũng xoá con", "orphanRemoval chỉ cho ManyToOne", "REMOVE xoá cả cha"],
        answer: 1,
        explain: "Đo được 1 DELETE khi removeItem mà không gọi delete.",
      },
    },
    {
      id: "equals",
      title: "Phần 5: equals, hashCode và Lombok @Data",
      scene: "equals",
      intro: [
        "`@Data` dùng mọi field kể cả association. Đã đo: `parent.hashCode()` và `toString()` khi parent và child trỏ vào nhau ném **`StackOverflowError`**; thêm child id null vào `HashSet`, persist, rồi `contains(child)` ra **false** dù size là 1. Thêm nữa, `toString()` trong log có thể kích hoạt lazy load.",
        "Cách an toàn: equals dùng `instanceof` (an toàn với proxy) và `id != null && id.equals(other.getId())`; hashCode trả hằng số `getClass().hashCode()` để không đổi sau persist. Có business key bất biến (SKU, email chuẩn hoá) thì dùng nó cho cả hai.",
      ],
      quiz: {
        question: "Vì sao equals của entity không nên so getClass()?",
        options: ["Vì chậm", "Entity có thể là proxy Hibernate (subclass), so với entity thật ra false", "Vì getClass là final", "Không sao"],
        answer: 1,
        explain: "Dùng instanceof hoặc Hibernate.getClass(), đọc id qua getter.",
      },
    },
  ],
  modelAnswer:
    "Hai người cùng mua sản phẩm cuối cùng là bài toán lost update: đọc, tính trong Java, ghi lại thì bên sau đè bên trước, em đo 10 thread trừ 1 từ 100 chỉ còn 99. Có ba cách: optimistic lock bằng @Version, update kèm where version, xung đột thì ObjectOptimisticLockingFailureException, hợp khi xung đột hiếm; pessimistic lock bằng PESSIMISTIC_WRITE, trên PostgreSQL ra for no key update, bên sau chờ, cần khoá theo thứ tự để tránh deadlock; và câu UPDATE nguyên tử có điều kiện stock >= q, em đo 20 thread tranh 10 sản phẩm thì đúng 10 thành công. Với batch insert em dùng SEQUENCE thay IDENTITY vì IDENTITY tắt JDBC batching, 1000 INSERT so với 20 batch, và flush, clear theo lô. Bulk update bỏ qua persistence context và @Version nên dễ bị ghi đè. Entity em không dùng @Data: StackOverflowError, lazy load ngoài ý muốn và hashCode đổi sau persist.",
};
