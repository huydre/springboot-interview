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
        "**Propagation** trả lời một câu hỏi: đã có transaction đang chạy rồi, thì method `@Transactional` này làm gì? Tham gia vào, mở cái mới, hay báo lỗi? Muốn hiểu các lựa chọn, trước hết cần tách hai khái niệm.",
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
        "Mỗi loại trả lời hai trường hợp: **đã có** transaction thì sao, **chưa có** thì sao.",
        "Nhóm hay dùng:",
        "- **REQUIRED** (mặc định): có thì tham gia, chưa có thì tạo mới.",
        "- **REQUIRES_NEW**: có thì tạm dừng cái cũ rồi tạo cái mới độc lập, chưa có thì tạo mới.",
        "- **NESTED**: có thì đặt savepoint bên trong (Phần 5), chưa có thì tạo mới.",
        "- **MANDATORY**: có thì tham gia, chưa có thì ném exception.",
        "Nhóm ít dùng:",
        "- **SUPPORTS**: có thì tham gia, chưa có thì chạy không transaction.",
        "- **NOT_SUPPORTED**: có thì tạm dừng nó và chạy không transaction.",
        "- **NEVER**: có thì ném exception, chưa có thì chạy không transaction.",
        "Exception đo được với MANDATORY: `IllegalTransactionStateException: No existing transaction found for transaction marked with propagation 'mandatory'`. Thực tế:",
        "- **REQUIRED**: đa số trường hợp.",
        "- **REQUIRES_NEW**: cho audit log, lịch sử lỗi, cấp số thứ tự.",
        "- **MANDATORY**: cho method tầng thấp bắt buộc caller mở transaction.",
        "Một điều kiện áp cho cả bảy loại: như mọi `@Transactional`, propagation chỉ có tác dụng khi lời gọi **đi qua proxy**. Gọi `this.audit()` trong cùng class thì không đi qua proxy (bài Transaction Proxy Mechanism), nên annotation bị bỏ qua và method chạy chung transaction của caller.",
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
      senior: true,
      title: "Phần 3: REQUIRED và UnexpectedRollbackException",
      scene: "required",
      intro: [
        "Áp ví von chuyến xe vào code: outer và inner đều REQUIRED ở hai bean khác nhau, mỗi bên lưu một dòng. Inner ném RuntimeException, outer `catch` rồi nuốt, mong ít nhất dòng của outer được lưu.",
      ],
      predict: {
        question: "Outer nuốt exception của inner rồi trả về bình thường. Lúc commit chuyện gì xảy ra?",
        options: [
          "Commit dòng outer, chỉ dòng inner mất",
          "Commit cả hai dòng",
          "`UnexpectedRollbackException`: cả dòng outer và dòng inner đều mất",
          "Inner rollback riêng phần của nó, outer commit",
        ],
        answer: 2,
        explain: "Inner ném qua proxy của nó nên đánh dấu physical transaction là rollback-only. Outer cố commit thì Spring rollback thật và báo `UnexpectedRollbackException`.",
      },
      widget: "inner-outer",
      widgetTitle: "outer nuốt exception của inner",
      after: [
        "Log: `Participating in existing transaction` → `Participating transaction failed - marking existing transaction as rollback-only` → `Initiating transaction commit` → `UnexpectedRollbackException: Transaction silently rolled back`. Cả dòng outer và dòng inner đều mất.",
        "Sửa theo ý định:",
        "- **Inner lỗi thì cả nghiệp vụ thất bại**: đừng nuốt exception.",
        "- **Inner là việc phụ**: REQUIRES_NEW.",
        "- **Chỉ huỷ phần của inner**: NESTED với JDBC hoặc kiểm tra điều kiện trước.",
        "- **Inner không cần transaction**: bỏ `@Transactional` ở inner.",
        "Inner ném checked exception thì không đánh dấu rollback-only, cả hai dòng được lưu.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Inner ném RuntimeException qua proxy → physical transaction bị đánh dấu rollback-only → outer nuốt rồi commit → `UnexpectedRollbackException`, mất cả hai dòng."],
      },
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
      board: {
        title: "REQUIRES_NEW tách một chuyến xe riêng",
        highlight: "chuyến xe riêng",
        chips: ["Hai connection", "Hai physical transaction"],
        cards: [
          {
            title: "Audit vẫn còn",
            diagram: {
              kind: "flow",
              steps: ["Outer ghi dòng nghiệp vụ", "audit() là REQUIRES_NEW", "Tạm dừng outer, connection mới"],
              ok: ["Inner xong", "COMMIT riêng dòng audit"],
              bad: ["Outer ném exception", "ROLLBACK dòng nghiệp vụ"],
            },
            notes: ["Đã đo: dòng nghiệp vụ rollback, dòng audit vẫn còn 1.", "Method phải nằm ở bean khác."],
            code: `@Transactional(propagation = Propagation.REQUIRES_NEW)
public void audit(String msg) {
  auditRepo.save(new Audit(msg));
}`,
            takeaway: "Inner commit hay rollback độc lập với outer",
          },
          {
            title: "Bẫy tự chặn",
            diagram: {
              kind: "flow",
              steps: ["Outer UPDATE một dòng, giữ khoá", "Inner UPDATE đúng dòng đó", "Inner chờ khoá của outer"],
              ok: ["Hai bên khác dòng", "Chạy bình thường"],
              bad: ["Outer chờ inner xong", "Hết lock timeout"],
            },
            notes: ["Inner chạy trên connection khác nên không thấy dữ liệu outer chưa commit."],
            takeaway: "Inner và outer không chia sẻ khoá hay dữ liệu",
          },
        ],
        conclusion: "**Kết luận:** REQUIRES_NEW cho độc lập, đổi lại tốn thêm một connection và có thể tự chờ khoá.",
      },
      scene: "requiresnew",
      intro: [
        "Phần 3 gợi ý REQUIRES_NEW khi inner là việc phụ. Nó tách inner thành một chuyến xe riêng.",
        "REQUIRES_NEW tạm dừng transaction hiện tại (tháo resource khỏi ThreadLocal), mở transaction mới trên connection mới, xong thì commit hoặc rollback riêng rồi resume. Đã đo audit log: outer ném exception, dòng nghiệp vụ rollback, dòng audit **vẫn còn 1**. Log có hai `SessionImpl` khác số: hai connection, hai physical transaction.",
        "Inner REQUIRES_NEW lỗi, outer nuốt: dòng outer có, dòng inner không, không còn `UnexpectedRollbackException`. Phải đặt method ở bean khác, và tốn thêm một connection.",
      ],
      trap: {
        title: "Inner là người lạ với outer",
        text: "Inner chạy trên connection khác, nên **không thấy** dữ liệu outer đã ghi mà chưa commit. Tệ hơn: outer đã `UPDATE` (và đang khoá) một dòng, inner lại `UPDATE` đúng dòng đó thì inner phải chờ khoá, mà outer đang đứng chờ inner xong: request tự chặn chính mình cho tới khi hết lock timeout.",
      },
      quiz: {
        question: "Audit log phải lưu kể cả khi nghiệp vụ rollback. Dùng gì?",
        options: ["REQUIRED", "REQUIRES_NEW ở bean khác (hoặc ghi sau khi transaction kết thúc)", "NESTED", "NEVER"],
        answer: 1,
        explain: "Hoặc @TransactionalEventListener, message queue.",
      },
    },
    {
      id: "nested",
      senior: true,
      title: "Phần 5: NESTED và savepoint",
      scene: "nested",
      intro: [
        "REQUIRED dùng chung hết, REQUIRES_NEW tách hẳn. NESTED nằm giữa: chung một transaction nhưng huỷ được riêng phần của inner.",
        "**Savepoint** là một điểm đánh dấu bên trong một transaction: `SAVEPOINT sp1`, rồi nếu cần thì `ROLLBACK TO sp1` để huỷ phần làm sau điểm đó, phần trước vẫn giữ và transaction chạy tiếp.",
        "NESTED đặt savepoint trong physical transaction hiện tại: inner lỗi thì rollback về savepoint, outer chạy tiếp; outer rollback thì mất cả phần inner. Đã đo với `DataSourceTransactionManager` + JdbcTemplate: inner lỗi, outer commit còn `[outer]`; inner thành công, outer lỗi còn `[]`.",
        "Với `JpaTransactionManager` mặc định: `NestedTransactionNotSupportedException: JpaDialect does not support savepoints`, ném ngay lúc tạo savepoint. Lý do: DB rollback được về savepoint, nhưng Hibernate còn giữ các entity trong bộ nhớ (persistence context, bài Entity Lifecycle) và không quay chúng về trạng thái cũ được, nên Spring từ chối luôn.",
      ],
      takeaway: {
        lines: ["NESTED là savepoint: inner lỗi chỉ mất phần inner, outer rollback thì mất hết. Chạy được với JDBC; `JpaTransactionManager` mặc định từ chối ngay."],
      },
      trap: {
        title: "catch nuốt luôn lỗi NESTED",
        text: "Outer `catch (RuntimeException e)` để bỏ qua lỗi của inner sẽ nuốt luôn `NestedTransactionNotSupportedException`. Nhìn qua có vẻ đúng ý (outer vẫn commit), nhưng **inner chưa bao giờ chạy**.",
      },
      quiz: {
        question: "NESTED khác REQUIRES_NEW thế nào khi outer rollback?",
        options: ["Giống nhau", "REQUIRES_NEW đã commit riêng nên còn; NESTED là savepoint trong outer nên mất theo", "NESTED còn, REQUIRES_NEW mất", "Cả hai đều còn"],
        answer: 1,
        explain: "Đo được với JDBC: bảng rỗng.",
      },
    },
    {
      id: "pool",
      senior: true,
      title: "Phần 6: REQUIRES_NEW và cạn connection pool",
      scene: "pool",
      intro: [
        "Phần 4 nói REQUIRES_NEW tốn thêm một connection. Thêm một connection thì có sao? Đổi pool size bên dưới để xem.",
      ],
      predict: {
        question: "Pool chỉ có 1 connection, timeout 500 ms. Một request vào outer rồi gọi inner REQUIRES_NEW. Chuyện gì xảy ra?",
        options: [
          "Chạy bình thường, vì outer tạm dừng nên trả connection về pool",
          "Inner chờ connection thứ hai rồi timeout sau khoảng 500 ms",
          "Inner dùng chung connection với outer",
          "Spring tự đổi sang REQUIRED",
        ],
        answer: 1,
        explain: "Outer bị tạm dừng nhưng vẫn giữ connection của nó. Inner cần một connection khác, mà pool đã hết.",
      },
      widget: "requires-new-pool",
      widgetTitle: "Một request, hai connection",
      after: [
        "Transaction ngoài bị tạm dừng nhưng **connection vẫn bị giữ**. Đã đo: trong outer 1 connection, trong inner REQUIRES_NEW **2**. Pool 1 connection, timeout 500 ms: `HikariPool-2 - Connection is not available, request timed out after 504ms (total=1, active=1, idle=0, waiting=0)`.",
        "Production: pool 10, 10 request cùng vào, mỗi request giữ 1 rồi cùng chờ connection thứ hai: **pool deadlock**, treo tới `connection-timeout` 30 giây rồi lỗi hàng loạt. Chỉ dùng REQUIRES_NEW khi thật cần, giữ ngắn, tính pool size theo số connection tối đa mỗi request, hoặc ghi audit sau khi transaction kết thúc.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Mỗi request giữ 1 connection rồi chờ connection thứ hai → số request đồng thời bằng pool size là không ai lấy được → pool deadlock tới khi hết `connection-timeout`."],
      },
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
