import timeline from "../timelines/propagation.json";
import type { Lesson, Scene } from "../types";

// Measured with @SpringBootTest on Spring Boot 3.5 (Spring 6.2, Hibernate 6.6, H2 2.3, HikariCP), JDK 21; log lines verbatim from
// JpaTransactionManager at DEBUG. See study note 05.03. Video not rendered yet: scenes stay empty until publish.
export const propagation: Lesson = {
  slug: "propagation",
  crumb: "Propagation",
  videoDir: "/videos/propagation",
  videoVersion: "9018e6c5",
  scenes: timeline as Scene[],
  title: "Propagation",
  subtitle:
    "Logical và physical transaction, bảy loại propagation, REQUIRED và UnexpectedRollbackException, REQUIRES_NEW độc lập, NESTED với savepoint và bất ngờ với JPA, nguy cơ cạn connection pool.",
  openingQuiz: {
    question: "outer() và inner() đều REQUIRED, ở hai bean khác nhau. inner ném RuntimeException, outer bắt lại và chạy tiếp. Kết quả?",
    options: ["outer commit bình thường", "UnexpectedRollbackException: cả hai dòng đều mất", "Chỉ dòng inner mất", "inner commit riêng"],
    answer: 1,
    explain: "Đã đo: Transaction silently rolled back because it has been marked as rollback-only. Exception đi qua proxy của inner đã đánh dấu cả physical transaction.",
  },
  roadmap: [
    "Chặng 1: logical và physical transaction, bảy loại propagation.",
    "Chặng 2: REQUIRED với UnexpectedRollbackException, REQUIRES_NEW độc lập.",
    "Chặng 3: NESTED và savepoint, REQUIRES_NEW làm cạn connection pool.",
  ],
  sections: [
    {
      id: "logical",
      title: "Phần 1: Logical và physical transaction",
      scene: "logical",
      intro: [
        "**Physical transaction** gắn với một connection, có một lần COMMIT hoặc ROLLBACK thật. **Logical transaction** là phạm vi của mỗi method `@Transactional` mà proxy chặn được; nhiều logical có thể nằm trên một physical.",
        "Ví von: physical là một chuyến xe, mỗi method là một hành khách. Với REQUIRED, hành khách sau lên chung xe. Chỉ người mở chuyến (method ngoài cùng) mới quyết định về bến; hành khách gặp sự cố chỉ có thể gắn biển \"xe hỏng\" (rollback-only), và cả chuyến phải quay đầu.",
      ],
      quiz: {
        question: "Logical transaction bên trong (REQUIRED) gặp RuntimeException thì làm được gì?",
        options: ["Rollback thật ngay", "Chỉ đánh dấu physical transaction là rollback-only", "Commit phần của nó", "Mở connection mới"],
        answer: 1,
        explain: "Chỉ logical ngoài cùng mới commit hoặc rollback thật.",
      },
    },
    {
      id: "seven",
      title: "Phần 2: Bảy loại propagation",
      scene: "seven",
      intro: [
        "REQUIRED (mặc định) tham gia hoặc tạo mới. REQUIRES_NEW tạm dừng cái cũ, tạo cái mới độc lập. NESTED đặt savepoint. SUPPORTS tham gia nếu có. NOT_SUPPORTED tạm dừng và chạy không transaction. MANDATORY ném exception nếu chưa có. NEVER ném exception nếu đã có. Exception đo được: `IllegalTransactionStateException: No existing transaction found for transaction marked with propagation 'mandatory'`.",
        "Thực tế: REQUIRED cho 95%; REQUIRES_NEW cho audit log, lịch sử lỗi, cấp số thứ tự; MANDATORY cho method tầng thấp bắt buộc caller mở transaction. SUPPORTS khi không có tx vẫn có tên (`demo.InnerService.supports`) nhưng `isActualTransactionActive()` là false.",
      ],
      widget: "propagation-table",
      widgetTitle: "Có và không có transaction",
      quiz: {
        question: "this.audit() với REQUIRES_NEW trong cùng class thì sao?",
        options: ["Có transaction riêng", "Vẫn chạy chung transaction của caller vì không qua proxy", "Lỗi khởi động", "Không chạy"],
        answer: 1,
        explain: "Đặt method REQUIRES_NEW ở bean khác.",
      },
    },
    {
      id: "required",
      title: "Phần 3: REQUIRED và UnexpectedRollbackException",
      scene: "required",
      intro: [
        "outer và inner đều REQUIRED ở hai bean khác nhau, inner ném RuntimeException, outer nuốt. Log: `Participating in existing transaction` → `Participating transaction failed - marking existing transaction as rollback-only` → `Initiating transaction commit` → `UnexpectedRollbackException: Transaction silently rolled back`. Cả dòng outer và dòng inner đều mất.",
        "Sửa theo ý định: inner lỗi thì cả nghiệp vụ thất bại → đừng nuốt exception; inner là việc phụ → REQUIRES_NEW; chỉ huỷ phần của inner → NESTED với JDBC hoặc kiểm tra điều kiện trước; inner không cần transaction → bỏ `@Transactional` ở inner. Inner ném checked exception thì không đánh dấu rollback-only, cả hai dòng được lưu.",
      ],
      widget: "inner-outer",
      widgetTitle: "outer nuốt exception của inner",
      quiz: {
        question: "Vì sao Spring ném UnexpectedRollbackException thay vì rollback im lặng?",
        options: ["Để log đẹp", "Để báo caller: anh tưởng commit nhưng thực ra đã rollback", "Vì lỗi DB", "Vì hết connection"],
        answer: 1,
        explain: "Im lặng thì caller tưởng dữ liệu đã lưu.",
      },
    },
    {
      id: "requires-new",
      title: "Phần 4: REQUIRES_NEW: transaction độc lập",
      scene: "requiresnew",
      intro: [
        "REQUIRES_NEW tạm dừng transaction hiện tại (tháo resource khỏi ThreadLocal), mở transaction mới trên connection mới, xong thì commit hoặc rollback riêng rồi resume. Đã đo audit log: outer ném exception, dòng nghiệp vụ rollback, dòng audit **vẫn còn 1**. Log có hai `SessionImpl` khác số: hai connection, hai physical transaction.",
        "Inner REQUIRES_NEW lỗi, outer nuốt: dòng outer có, dòng inner không, không còn `UnexpectedRollbackException`. Phải đặt method ở bean khác, và tốn thêm một connection.",
      ],
      quiz: {
        question: "Audit log phải lưu kể cả khi nghiệp vụ rollback. Dùng gì?",
        options: ["REQUIRED", "REQUIRES_NEW ở bean khác (hoặc ghi sau khi transaction kết thúc)", "NESTED", "NEVER"],
        answer: 1,
        explain: "Hoặc @TransactionalEventListener, message queue.",
      },
    },
    {
      id: "nested",
      title: "Phần 5: NESTED và savepoint",
      scene: "nested",
      intro: [
        "NESTED đặt savepoint trong physical transaction hiện tại: inner lỗi thì rollback về savepoint, outer chạy tiếp; outer rollback thì mất cả phần inner. Đã đo với `DataSourceTransactionManager` + JdbcTemplate: inner lỗi, outer commit còn `[outer]`; inner thành công, outer lỗi còn `[]`.",
        "Với `JpaTransactionManager` mặc định: `NestedTransactionNotSupportedException: JpaDialect does not support savepoints`, ném ngay lúc tạo savepoint. Bẫy: outer `catch (RuntimeException e)` nuốt luôn exception này, nhìn qua có vẻ đúng nhưng **inner chưa bao giờ chạy**. Hibernate không quay lại được persistence context khi rollback về savepoint.",
      ],
      quiz: {
        question: "NESTED khác REQUIRES_NEW thế nào khi outer rollback?",
        options: ["Giống nhau", "REQUIRES_NEW đã commit riêng nên còn; NESTED là savepoint trong outer nên mất theo", "NESTED còn, REQUIRES_NEW mất", "Cả hai đều còn"],
        answer: 1,
        explain: "Đo được với JDBC: bảng rỗng.",
      },
    },
    {
      id: "pool",
      title: "Phần 6: REQUIRES_NEW và cạn connection pool",
      scene: "pool",
      intro: [
        "Transaction ngoài bị tạm dừng nhưng **connection vẫn bị giữ**. Đã đo: trong outer 1 connection, trong inner REQUIRES_NEW **2**. Pool 1 connection, timeout 500 ms: `HikariPool-2 - Connection is not available, request timed out after 504ms (total=1, active=1, idle=0, waiting=0)`.",
        "Production: pool 10, 10 request cùng vào, mỗi request giữ 1 rồi cùng chờ connection thứ hai: **pool deadlock**, treo tới `connection-timeout` 30 giây rồi lỗi hàng loạt. Chỉ dùng REQUIRES_NEW khi thật cần, giữ ngắn, tính pool size theo số connection tối đa mỗi request, hoặc ghi audit sau khi transaction kết thúc.",
      ],
      widget: "requires-new-pool",
      widgetTitle: "Một request, hai connection",
      quiz: {
        question: "Vì sao lỗi cạn pool do REQUIRES_NEW thường không lộ ra ở máy local?",
        options: ["Vì local nhanh", "Local chỉ có 1 request mỗi lúc, pool 10 luôn còn connection thứ hai", "Vì H2 không có pool", "Vì local không có transaction"],
        answer: 1,
        explain: "Chỉ lộ khi số request đồng thời xấp xỉ pool size.",
      },
    },
  ],
  modelAnswer:
    "Propagation quyết định method transactional làm gì khi đã có transaction. REQUIRED là mặc định: tham gia transaction đang có, nên trong và ngoài là một physical transaction; nếu method trong ném RuntimeException qua proxy của nó, transaction bị đánh dấu rollback-only, ngoài có bắt exception thì lúc commit vẫn bị UnexpectedRollbackException, em đã tái hiện được. REQUIRES_NEW tạm dừng transaction cũ và mở transaction mới trên connection mới, hai bên độc lập, em dùng cho audit log; nhưng một request chiếm hai connection, em đo được pool 1 connection thì timeout, nên dễ gây pool deadlock lúc tải cao. NESTED dùng savepoint để rollback một phần, chạy được với JDBC, còn với JpaTransactionManager mặc định thì ném NestedTransactionNotSupportedException. Và propagation chỉ có tác dụng khi gọi qua proxy, tức method ở bean khác.",
};
