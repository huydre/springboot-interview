import timeline from "../timelines/tx-template.json";
import type { Lesson, Scene } from "../types";

// Measured with @SpringBootTest on Spring Boot 3.5 (Spring 6.2, Hibernate 6.6, H2 2.3), JDK 21. See study note 05.05.
export const txTemplate: Lesson = {
  slug: "tx-template",
  crumb: "TransactionTemplate & Events",
  videoDir: "/videos/tx-template",
  videoVersion: "eb922fa5",
  scenes: timeline as Scene[],
  title: "TransactionTemplate & Transaction Events",
  subtitle:
    "Transaction bằng code với TransactionTemplate, làm việc phụ sau commit bằng @TransactionalEventListener, bẫy ghi DB trong AFTER_COMMIT, outbox pattern, và test code có transaction.",
  openingQuiz: {
    question: "Listener AFTER_COMMIT gọi auditRepo.save(...) (REQUIRED). Dòng audit có được lưu không?",
    options: ["Có", "Không: save tham gia transaction đã commit và mất im lặng", "Lỗi exception", "Chỉ khi có @Async"],
    answer: 1,
    explain: "Đã đo 0 dòng. Resource chưa được unbind khỏi ThreadLocal nên save() thấy \"đang có transaction\". Dùng REQUIRES_NEW thì ra 1 dòng.",
  },
  roadmap: [
    "Chặng 1: TransactionTemplate và batch từng phần tử.",
    "Chặng 2: @TransactionalEventListener, bẫy AFTER_COMMIT, outbox.",
    "Chặng 3: test code có transaction.",
  ],
  sections: [
    {
      id: "template",
      title: "Phần 1: TransactionTemplate: transaction bằng code",
      scene: "template",
      intro: [
        "`@Transactional` là khai báo: ranh giới là cả method và cần proxy. `TransactionTemplate` là lập trình: truyền lambda, template mở transaction, chạy, rồi commit hoặc rollback. Cùng `PlatformTransactionManager`, cùng ThreadLocal, cùng propagation, chỉ là **không cần proxy**. Đã đo: trong lambda `active=true newTx=true`; `status.setRollbackOnly()` thì không lưu; ném RuntimeException thì không lưu và exception bay ra.",
        "Use case: batch mỗi phần tử một transaction (đo được `ok=3 failed=1`, `b-3` sau dòng lỗi vẫn lưu), chia transaction ngắn xen giữa việc chậm như gọi cổng thanh toán, và sửa self-invocation không cần tách bean. Template thread-safe sau khi cấu hình: tạo một lần rồi dùng lại.",
      ],
      widget: "batch-tx",
      widgetTitle: "Một dòng lỗi trong lô",
      quiz: {
        question: "Gọi TransactionTemplate mặc định bên trong một method @Transactional khác thì sao?",
        options: ["Luôn tạo transaction mới", "Tham gia transaction ngoài (REQUIRED); muốn riêng thì PROPAGATION_REQUIRES_NEW", "Lỗi", "Chạy không transaction"],
        answer: 1,
        explain: "Template vẫn tôn trọng propagation.",
      },
    },
    {
      id: "events",
      title: "Phần 2: @TransactionalEventListener: việc phụ sau commit",
      scene: "events",
      intro: [
        "Gửi email ngay trong `@Transactional` có thể gửi cho đơn hàng sau đó bị rollback. `@TransactionalEventListener` giữ event lại và chỉ chạy ở pha bạn chọn: `BEFORE_COMMIT`, **`AFTER_COMMIT`** (mặc định), `AFTER_ROLLBACK`, `AFTER_COMPLETION`.",
        "Đã đo: commit thì `EventListener → BEFORE_COMMIT`, rồi `AFTER_COMMIT` và `AFTER_COMPLETION`; rollback thì `EventListener`, rồi `AFTER_ROLLBACK` và `AFTER_COMPLETION`. Ba pha AFTER_* cùng chạy trong callback `afterCompletion`, nên thứ tự giữa chúng theo `@Order` (cùng order thì theo thứ tự đăng ký listener), không theo tên pha; publish ngoài transaction thì chỉ `EventListener`. `@EventListener` thường chạy ngay lúc publish, kể cả khi sau đó rollback. AFTER_COMMIT chạy đồng bộ trên cùng thread nên thêm `@Async` nếu chậm.",
      ],
      widget: "event-phase",
      widgetTitle: "Listener nào chạy",
      quiz: {
        question: "Publish event khi không có transaction thì @TransactionalEventListener làm gì?",
        options: ["Chạy ngay", "Bị bỏ qua im lặng, trừ khi fallbackExecution = true", "Ném exception", "Chờ transaction sau"],
        answer: 1,
        explain: "Đo được: chỉ @EventListener chạy.",
      },
    },
    {
      id: "after-commit-write",
      title: "Phần 3: Bẫy ghi DB bên trong AFTER_COMMIT",
      scene: "aftercommit",
      intro: [
        "Đã đo: listener AFTER_COMMIT ghi audit bằng `auditRepo.save()` ra **0 dòng**; gọi method `REQUIRES_NEW` ở bean khác ra **1 dòng**. Bên trong listener `isActualTransactionActive()=true`, tên vẫn là `demo.OrderService.place`: transaction đã commit nhưng resource chưa unbind, nên `save()` tham gia vào đó và không còn ai commit nữa. Không lỗi, không cảnh báo.",
        "Listener có `@Async` thì chạy thread khác, ThreadLocal trống, `save()` tự mở transaction. Listener lỗi ở AFTER_COMMIT không rollback được gì; app sập ngay sau commit thì event trong bộ nhớ mất.",
      ],
      quiz: {
        question: "App sập ngay sau commit, trước khi listener AFTER_COMMIT gửi email. Chuyện gì xảy ra?",
        options: ["Email gửi khi khởi động lại", "Email mất: event chỉ nằm trong bộ nhớ", "Transaction rollback", "Spring retry"],
        answer: 1,
        explain: "Đó là lý do có outbox pattern.",
      },
    },
    {
      id: "outbox",
      title: "Phần 4: Outbox pattern",
      scene: "outbox",
      intro: [
        "Dual write: lưu DB và gửi Kafka không có transaction chung. Gửi trong transaction thì Kafka nhận rồi DB rollback; gửi sau commit thì app sập là mất. Outbox biến \"gửi message\" thành **ghi một dòng vào bảng outbox** cùng transaction với nghiệp vụ: cùng có hoặc cùng không.",
        "Một relay (scheduler hoặc Debezium) đọc dòng PENDING, gửi Kafka, đánh dấu SENT. Relay sập thì đọc tiếp, không mất; đổi lại có thể gửi hơn một lần nên bên nhận phải idempotent theo event id (at-least-once). Mất vài email chấp nhận được thì AFTER_COMMIT + @Async; không được mất (thanh toán, tồn kho) thì outbox.",
      ],
      quiz: {
        question: "Vì sao bên nhận message từ outbox phải idempotent?",
        options: ["Vì Kafka chậm", "Relay có thể gửi xong mà chưa kịp đánh dấu SENT rồi sập, nên gửi lại", "Vì outbox xoá dòng", "Không cần"],
        answer: 1,
        explain: "At-least-once delivery.",
      },
    },
    {
      id: "testing",
      title: "Phần 5: Test code có transaction",
      scene: "testtx",
      intro: [
        "`@Transactional` trên class test (hoặc `@DataJpaTest`) rollback sau mỗi test. Đã đo: trong test `isActive=true flaggedForRollback=true`, sau test 0 dòng; `@Commit` để lại 1 dòng. Bẫy 1: save 2 lần trùng unique vẫn **PASS** vì id sequence chưa INSERT tới khi flush, mà test không bao giờ flush; gọi `em.flush()` thì ra `ConstraintViolationException`.",
        "Bẫy 2: service REQUIRED tham gia transaction của test nên AFTER_COMMIT, `UnexpectedRollbackException`, `LazyInitializationException` đều không xảy ra; `TestTransaction.flagForCommit()` + `end()` mới thấy listener commit. MockMvc chạy cùng thread nên bị rollback; `RANDOM_PORT` qua HTTP thật thì commit thật. Test hành vi transaction: không để `@Transactional` trên test, tự dọn dữ liệu.",
      ],
      widget: "test-tx",
      widgetTitle: "Test trong transaction",
      quiz: {
        question: "Test @Transactional gọi API qua MockMvc, controller lưu dữ liệu. Có bị rollback không?",
        options: ["Không", "Có: MockMvc chạy cùng thread nên service tham gia transaction của test", "Tuỳ DB", "Chỉ khi có @Commit"],
        answer: 1,
        explain: "RANDOM_PORT qua HTTP thật chạy trên thread server nên commit thật.",
      },
    },
  ],
  modelAnswer:
    "TransactionTemplate cho phép mở transaction bằng code quanh một khối bất kỳ, dùng cùng transaction manager nhưng không cần proxy; em dùng cho batch mỗi dòng một transaction, đo được một dòng lỗi thì các dòng sau vẫn lưu, và để chia transaction ngắn quanh lời gọi API ngoài. Việc phụ sau commit như gửi email em dùng @TransactionalEventListener AFTER_COMMIT, vì @EventListener thường chạy cả khi sau đó rollback. Có một bẫy: ghi DB trong AFTER_COMMIT bằng save thường thì mất im lặng, em đo được 0 dòng, phải dùng REQUIRES_NEW. Event trong bộ nhớ sẽ mất nếu app sập, nên với message không được mất em dùng outbox pattern: ghi event vào bảng outbox cùng transaction, relay gửi đi, bên nhận idempotent. Khi test, transaction của test che mất hành vi lúc commit và lỗi constraint chưa flush, nên test hành vi transaction em không đặt @Transactional trên test.",
};
