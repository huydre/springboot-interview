import timeline from "../timelines/isolation.json";
import type { Lesson, Scene } from "../types";

// Measured with @SpringBootTest on Spring Boot 3.5, JDK 21; isolation runs on PostgreSQL 16.14 (Testcontainers), some on H2 2.3 and
// MySQL 8.4 as marked. See study note 05.04. Video not rendered yet: scenes stay empty until publish.
export const isolation: Lesson = {
  slug: "isolation",
  crumb: "Isolation & readOnly",
  videoDir: "/videos/isolation",
  videoVersion: "27c5d554",
  scenes: timeline as Scene[],
  title: "Isolation & readOnly",
  subtitle:
    "Các anomaly, bốn isolation level và default của từng DB, MVCC, tái hiện non-repeatable read và phantom, lost update và ba cách sửa, write skew, readOnly thật sự làm gì, và không gọi API ngoài trong transaction.",
  openingQuiz: {
    question: "Stock = 10, hai người cùng mua bằng findById rồi setStock(stock - 1), PostgreSQL READ COMMITTED. Stock cuối?",
    options: ["8", "9: mất một lần trừ (lost update)", "Lỗi deadlock", "10"],
    answer: 1,
    explain: "Đã đo final stock = 9. READ COMMITTED không chặn read-modify-write; sửa bằng atomic UPDATE, @Version hoặc FOR UPDATE.",
  },
  roadmap: [
    "Chặng 1: anomaly, isolation level, MVCC.",
    "Chặng 2: non-repeatable read, phantom, lost update, write skew.",
    "Chặng 3: readOnly và long transaction.",
  ],
  sections: [
    {
      id: "anomalies",
      title: "Phần 1: Anomaly và isolation level",
      scene: "levels",
      intro: [
        "Dirty read (đọc dữ liệu chưa commit), non-repeatable read (một dòng đọc 2 lần ra 2 giá trị), phantom (cùng query, số dòng thay đổi), và hai thứ hay gây bug thật: **lost update** (hai bên cùng đọc rồi ghi đè nhau) và **write skew** (mỗi bên ghi một dòng khác, gộp lại vi phạm quy tắc).",
        "Default đo được: PostgreSQL `read committed`, MySQL InnoDB `REPEATABLE-READ`, H2 READ_COMMITTED. Spring `Isolation.DEFAULT` dùng default của DB, nên cùng code chạy hai DB có thể khác kết quả. Dirty read đo được thật trên H2 (B đọc 999 chưa commit); PostgreSQL không có dirty read ở level nào, đọc ra 10.",
      ],
      quiz: {
        question: "Vì sao không đặt SERIALIZABLE cho mọi thứ?",
        options: ["Vì không chạy", "PostgreSQL phát hiện xung đột và huỷ transaction (could not serialize access), ứng dụng phải retry, tải cao thì throughput giảm", "Vì bị cấm", "Vì chậm gấp 100 lần"],
        answer: 1,
        explain: "Thường chỉ dùng cho vài nghiệp vụ nhạy cảm, còn lại READ COMMITTED kèm lock có chủ đích.",
      },
    },
    {
      id: "mvcc",
      title: "Phần 2: MVCC và đọc lặp lại",
      scene: "mvcc",
      intro: [
        "MVCC: update tạo phiên bản mới thay vì ghi đè, mỗi transaction đọc theo một snapshot nên đọc không chặn ghi. READ COMMITTED chụp snapshot **mỗi câu lệnh**; REPEATABLE READ của PostgreSQL chụp ở **câu lệnh đầu tiên** rồi dùng tới cuối. Ghi thì vẫn cần khoá.",
        "Đã đo trên PostgreSQL: đọc stock 2 lần, giữa chừng tx khác đổi 10 thành 50: READ COMMITTED `first=10 second=50`, REPEATABLE READ `first=10 second=10`; `count(*)` 1 rồi 2, so với 1 rồi 1. Bẫy: `findById` hai lần ở READ COMMITTED ra 10 và 10, `sameInstance=true`, vì persistence context không chạy SQL lần hai.",
      ],
      widget: "isolation-read",
      widgetTitle: "Đọc hai lần, giữa chừng có người sửa",
      quiz: {
        question: "Vì sao findById hai lần lại \"repeatable\" ở READ COMMITTED?",
        options: ["Vì DB khoá dòng", "Vì Hibernate trả entity trong persistence context mà không chạy SQL", "Vì READ COMMITTED chặn non-repeatable read", "Vì cache Redis"],
        answer: 1,
        explain: "Muốn giá trị mới: refresh() hoặc JPQL, native query.",
      },
    },
    {
      id: "lost-update",
      title: "Phần 3: Lost update và ba cách sửa",
      scene: "lostupdate",
      intro: [
        "Mẫu read-modify-write: cả hai đọc 10, cùng tính 9, cùng ghi 9. Đã đo: READ COMMITTED ra 9; REPEATABLE READ biến thành `CannotAcquireLockException: could not serialize access due to concurrent update`; atomic UPDATE ra 8; `@Version` ném `ObjectOptimisticLockingFailureException`; `SELECT ... FOR UPDATE` ra 8 với thread B chờ 306 ms.",
        "Atomic UPDATE cho phép tính đơn giản (nhanh nhất, kiểm tra số dòng bị ảnh hưởng). `@Version` cho xung đột hiếm (sửa hồ sơ). `FOR UPDATE` cho xung đột thường xuyên, transaction thật ngắn. `@Version` bị bỏ qua với `@Modifying @Query` tự viết. Flash sale: ưu tiên atomic UPDATE.",
      ],
      widget: "lost-update",
      widgetTitle: "Hai người mua, đúng phải còn 8",
      quiz: {
        question: "Đổi lên REPEATABLE READ trên PostgreSQL có giải quyết lost update không?",
        options: ["Có, hoàn toàn", "Không làm bài toán đúng, chỉ biến lost update thành exception phải bắt và retry", "Làm chậm gấp đôi", "Gây dirty read"],
        answer: 1,
        explain: "Đừng dựa vào isolation level để chống lost update.",
      },
    },
    {
      id: "write-skew",
      title: "Phần 4: Write skew",
      scene: "writeskew",
      intro: [
        "Quy tắc: luôn có ít nhất 1 bác sĩ trực, hiện có 2. A và B cùng đếm thấy 2, cùng xin nghỉ, mỗi bên update **dòng của mình**: không đụng khoá của nhau, cùng commit, còn 0 người trực. Không ai ghi đè ai nhưng gộp lại vi phạm quy tắc.",
        "Đã đo trên PostgreSQL: REPEATABLE READ cả hai commit, `on call now=0`; SERIALIZABLE thì tx còn lại lỗi `could not serialize access due to read/write dependencies among transactions`. Sửa: SERIALIZABLE kèm retry cho riêng nghiệp vụ này, `FOR UPDATE` các dòng dùng để kiểm tra điều kiện, hoặc đưa quy tắc xuống DB.",
      ],
      quiz: {
        question: "Write skew khác lost update ở đâu?",
        options: ["Giống nhau", "Lost update ghi đè cùng một dòng; write skew mỗi bên ghi một dòng khác nhưng tổng thể vi phạm quy tắc", "Write skew chỉ có ở MySQL", "Lost update chỉ có ở SERIALIZABLE"],
        answer: 1,
        explain: "REPEATABLE READ không chặn được write skew.",
      },
    },
    {
      id: "readonly",
      title: "Phần 5: readOnly = true thực sự làm gì",
      scene: "readonly",
      intro: [
        "Đã đo: Hibernate flush mode `MANUAL`, session và entity read-only, `Connection.isReadOnly() = true`; sửa field entity rồi kết thúc method thì **không có UPDATE**. Lợi ích chính là bỏ dirty checking, nhẹ hơn khi load nhiều entity; có thể route sang read replica.",
        "Ghi trong method readOnly: H2 `save()` im lặng không lưu, `saveAndFlush()` và `jdbcTemplate.update()` **lưu được**; PostgreSQL chặn: `cannot execute INSERT in a read-only transaction` (SQL state 25006). readOnly không phải cơ chế bảo mật. Pattern: class `readOnly = true`, method ghi gắn `@Transactional` thường.",
      ],
      widget: "readonly",
      widgetTitle: "Ghi trong method readOnly",
      quiz: {
        question: "Method chỉ đọc có nên đặt @Transactional(readOnly = true)?",
        options: [
          "Không cần",
          "Nên: dùng chung một connection và persistence context, Hibernate bỏ dirty checking, có thể route sang replica, tránh LazyInitializationException khi open-in-view tắt",
          "Chỉ khi dùng MySQL",
          "Chỉ để bảo mật",
        ],
        answer: 1,
        explain: "Để trống thì mỗi lần gọi repository là một transaction riêng.",
      },
    },
    {
      id: "long-tx",
      title: "Phần 6: Không gọi API ngoài trong transaction",
      scene: "longtx",
      intro: [
        "`@Transactional checkout()` lưu order rồi gọi cổng thanh toán 2–5 giây và dịch vụ email: giữ connection suốt thời gian chờ mạng, và rollback DB không thu hồi được tiền đã trừ ở cổng thanh toán.",
        "Cách đúng: transaction ngắn lưu order PENDING, gọi thanh toán ngoài transaction (có idempotency key), transaction ngắn cập nhật PAID hoặc FAILED, gửi email sau commit bằng `AFTER_COMMIT` hoặc outbox. Long transaction giữ connection, giữ lock, làm MVCC giữ phiên bản cũ lâu: đặt `@Transactional(timeout = 5)`, theo dõi `hikaricp.connections.active` và `pending`.",
      ],
      quiz: {
        question: "Đã trừ tiền ở cổng thanh toán, sau đó gửi email lỗi làm transaction rollback. Hậu quả?",
        options: ["Không sao", "Đơn hàng biến mất nhưng tiền đã bị trừ", "Tiền được hoàn tự động", "Email được gửi lại"],
        answer: 1,
        explain: "Rollback DB không thu hồi được việc đã làm bên ngoài.",
      },
    },
  ],
  modelAnswer:
    "Isolation level quyết định chặn những anomaly nào: dirty read, non-repeatable read, phantom; PostgreSQL mặc định READ COMMITTED, MySQL InnoDB REPEATABLE READ. Các DB này dùng MVCC: READ COMMITTED chụp snapshot mỗi câu lệnh, REPEATABLE READ của PostgreSQL chụp một lần nên chặn cả phantom; em đã tái hiện cả hai. Bug hay gặp thật là lost update: em đo hai người mua thì stock còn 9 thay vì 8 ở READ COMMITTED; em sửa bằng atomic UPDATE cho phép trừ đơn giản, @Version khi xung đột hiếm, FOR UPDATE khi xung đột nhiều. Write skew như ví dụ bác sĩ trực thì REPEATABLE READ không chặn được, cần SERIALIZABLE hoặc khoá có chủ đích. readOnly = true làm Hibernate bỏ dirty checking và đặt connection read-only; PostgreSQL chặn ghi còn H2 thì không, nên nó không phải cơ chế bảo mật. Và em không gọi API ngoài trong transaction.",
};
