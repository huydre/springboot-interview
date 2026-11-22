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
        "Bài trước cho thấy hầu hết bẫy của `@Transactional` đến từ proxy. Có cách mở transaction mà không cần proxy không?",
        "`@Transactional` là khai báo: ranh giới là cả method và cần proxy. `TransactionTemplate` là lập trình: truyền lambda, template mở transaction, chạy, rồi commit hoặc rollback. Cùng `PlatformTransactionManager`, cùng ThreadLocal, cùng propagation, chỉ là **không cần proxy**.",
        "Cách dùng: tạo `TransactionTemplate tt = new TransactionTemplate(transactionManager)`, rồi `tt.execute(status -> repo.save(item).getId())` khi cần kết quả, hoặc `tt.executeWithoutResult(status -> { ... })` khi không cần. Tham số `status` là trạng thái của transaction đang chạy: gọi `status.setRollbackOnly()` để yêu cầu rollback mà không cần ném exception.",
        "Đã đo: trong lambda `active=true newTx=true`; `status.setRollbackOnly()` thì không lưu; ném RuntimeException thì không lưu và exception bay ra.",
        "Use case 1, batch mỗi phần tử một transaction: lô 4 tên `b-1`, `b-2`, `b-1`, `b-3`, cột tên là unique, nên dòng thứ 3 trùng dòng 1. Vòng lặp gọi `tt.executeWithoutResult(s -> repo.saveAndFlush(new Item(name)))` cho từng tên, bắt exception rồi chạy tiếp.",
        "Chuyển qua lại giữa hai cách bên dưới để so kết quả.",
      ],
      predict: {
        question: "Mỗi tên một transaction riêng qua `TransactionTemplate`, dòng thứ 3 (`b-1` lần hai) lỗi trùng unique. Bảng còn những tên nào?",
        options: [
          "Không còn gì, một dòng lỗi làm mất cả lô",
          "`b-1`, `b-2`, `b-3`: chỉ dòng lỗi mất, `b-3` sau nó vẫn được lưu",
          "Chỉ `b-1`, `b-2`, vòng lặp dừng ở dòng lỗi",
          "Cả 4 dòng, vì lỗi bị bắt",
        ],
        answer: 1,
        explain: "Mỗi dòng có transaction riêng nên dòng lỗi chỉ rollback chính nó, và vòng lặp bắt exception rồi chạy tiếp.",
      },
      after: [
        "Đã đo: `ok=3 failed=1`, dòng `b-1` thứ hai lỗi trùng unique, còn `b-3` sau dòng lỗi vẫn được lưu. Bọc cả vòng lặp trong một `@Transactional` thì một dòng lỗi làm mất cả lô.",
        "Use case khác: chia transaction ngắn xen giữa việc chậm như gọi cổng thanh toán, và sửa self-invocation không cần tách bean. Template thread-safe sau khi cấu hình: tạo một lần rồi dùng lại.",
        "Gọi template bên trong một method `@Transactional` khác thì sao? Template mặc định dùng propagation `REQUIRED`, nên nó **tham gia** transaction ngoài chứ không mở mới. Muốn transaction riêng thì `tt.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW)`.",
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
      board: {
        title: "Việc phụ chỉ chạy sau commit",
        highlight: "sau commit",
        chips: ["Mặc định AFTER_COMMIT", "Cùng thread, đồng bộ"],
        cards: [
          {
            title: "Publish rồi chờ commit",
            diagram: {
              kind: "flow",
              steps: ["place(): repo.save(order)", "publishEvent(OrderPlaced)", "Event được giữ lại"],
              ok: ["Transaction commit", "AFTER_COMMIT: onPlaced()"],
              bad: ["Transaction rollback", "Không gửi gì"],
            },
            notes: ["`@EventListener` thường chạy ngay lúc publish, kể cả khi sau đó rollback."],
            code: `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
void onPlaced(OrderPlaced e) {
  // gửi email
}`,
            takeaway: "Không gửi email cho đơn đã rollback",
          },
          {
            title: "Publish ngoài transaction",
            diagram: {
              kind: "flow",
              steps: ["publishEvent() không có transaction"],
              ok: ["fallbackExecution = true", "Listener vẫn chạy"],
              bad: ["Mặc định", "Bị bỏ qua im lặng"],
            },
            notes: ["Đã đo: chỉ `@EventListener` chạy, `@TransactionalEventListener` thì không."],
            takeaway: "Không có transaction thì listener bị bỏ qua",
          },
        ],
        conclusion: "**Kết luận:** `@TransactionalEventListener` gắn việc phụ vào kết quả của transaction, nhưng chỉ khi có transaction.",
      },
      scene: "events",
      intro: [
        "Gửi email ngay trong `@Transactional` có thể gửi cho đơn hàng sau đó bị rollback. `@TransactionalEventListener` giữ event lại và chỉ chạy ở pha bạn chọn:",
        "- **`BEFORE_COMMIT`**: ngay trước commit.",
        "- **`AFTER_COMMIT`** (mặc định): sau khi commit thành công.",
        "- **`AFTER_ROLLBACK`**: sau khi rollback.",
        "- **`AFTER_COMPLETION`**: sau commit hoặc rollback.",
        "Cách dùng: inject `ApplicationEventPublisher publisher`, trong method `@Transactional place(...)` gọi `repo.save(order)` rồi `publisher.publishEvent(new OrderPlaced(id))`. Ở bean khác, method `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT) void onPlaced(OrderPlaced e)` sẽ nhận event, nhưng chỉ sau khi transaction commit thành công.",
        "Đã đo: commit thì `EventListener → BEFORE_COMMIT`, rồi `AFTER_COMMIT` và `AFTER_COMPLETION`; rollback thì `EventListener`, rồi `AFTER_ROLLBACK` và `AFTER_COMPLETION`. `@EventListener` thường chạy ngay lúc publish, kể cả khi sau đó rollback. AFTER_COMMIT chạy đồng bộ trên cùng thread nên thêm `@Async` nếu chậm.",
        "Publish khi **không có transaction** thì `@TransactionalEventListener` bị **bỏ qua im lặng**: đã đo, chỉ `@EventListener` chạy. Muốn listener vẫn chạy trong trường hợp đó thì đặt `@TransactionalEventListener(fallbackExecution = true)`.",
      ],
      trap: {
        title: "Thứ tự giữa các pha AFTER_*",
        text: "Ba pha AFTER_* cùng chạy trong một callback `afterCompletion`, nên thứ tự giữa chúng theo `@Order` (cùng order thì theo thứ tự đăng ký listener), không theo tên pha. Đừng viết code dựa vào việc AFTER_COMMIT chạy trước AFTER_COMPLETION.",
      },
      widget: "event-phase",
      widgetTitle: "Listener nào chạy",
      takeaway: {
        lines: ["`@EventListener` chạy ngay lúc publish, kể cả khi sau đó rollback. `@TransactionalEventListener` AFTER_COMMIT chỉ chạy khi đã commit thật, và bị bỏ qua nếu không có transaction."],
      },
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
        "AFTER_COMMIT là chỗ đúng cho việc phụ. Nhưng nếu việc phụ đó lại là ghi DB thì sao?",
        "Đã đo: listener AFTER_COMMIT ghi audit bằng `auditRepo.save()` ra **0 dòng**; gọi method `REQUIRES_NEW` ở bean khác ra **1 dòng**. Bên trong listener `isActualTransactionActive()=true`, tên vẫn là `demo.OrderService.place`: transaction đã commit nhưng resource chưa unbind, nên `save()` tham gia vào đó và không còn ai commit nữa. Không lỗi, không cảnh báo.",
        "Listener có `@Async` thì chạy thread khác, ThreadLocal trống, `save()` tự mở transaction. Listener lỗi ở AFTER_COMMIT không rollback được gì; app sập ngay sau commit thì event trong bộ nhớ mất.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Transaction đã commit nhưng resource chưa unbind → `save()` trong listener tham gia vào transaction đó → không còn ai commit → 0 dòng, không lỗi. Ghi DB ở đây thì gọi method `REQUIRES_NEW` ở bean khác."],
      },
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
        "Phần 3 kết thúc bằng một lỗ hổng: app sập ngay sau commit thì event trong bộ nhớ mất. Với message không được mất, cần cách khác.",
        "Dual write: lưu DB và gửi Kafka không có transaction chung. Gửi trong transaction thì Kafka nhận rồi DB rollback; gửi sau commit thì app sập là mất. Outbox biến \"gửi message\" thành **ghi một dòng vào bảng outbox** cùng transaction với nghiệp vụ: cùng có hoặc cùng không.",
        "Một relay (scheduler hoặc Debezium) đọc dòng PENDING, gửi Kafka, đánh dấu SENT. Relay sập thì đọc tiếp, không mất; đổi lại có thể gửi hơn một lần nên bên nhận phải idempotent theo event id (at-least-once). Mất vài email chấp nhận được thì AFTER_COMMIT + @Async; không được mất (thanh toán, tồn kho) thì outbox.",
      ],
      takeaway: {
        lines: ["Mất vài email chấp nhận được: AFTER_COMMIT + `@Async`. Không được mất (thanh toán, tồn kho): outbox, và bên nhận idempotent theo event id."],
      },
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
        "`@Transactional` trên class test (hoặc `@DataJpaTest`) rollback sau mỗi test. Đã đo: trong test `isActive=true flaggedForRollback=true`, sau test 0 dòng; `@Commit` để lại 1 dòng.",
        "**Bẫy 1**: save 2 lần trùng unique mà test vẫn **PASS**. Lý do: entity dùng id kiểu SEQUENCE (mặc định của `@GeneratedValue` với H2 và PostgreSQL) thì `save()` chỉ lấy id từ sequence rồi đưa entity vào persistence context, **INSERT được hoãn tới lúc flush**, mà flush thường chỉ xảy ra lúc commit. Test rollback nên không bao giờ flush, lỗi unique không bao giờ lộ ra. Gọi `em.flush()` thì ra `ConstraintViolationException`. Với id kiểu IDENTITY thì khác: INSERT chạy ngay lúc `save()` để DB sinh id, nên lỗi lộ ra ngay.",
        "**Bẫy 2**: service REQUIRED tham gia transaction của test, nên ba thứ sau đều không xảy ra trong test:",
        "- **AFTER_COMMIT listener**: `TestTransaction.flagForCommit()` + `end()` mới thấy listener commit.",
        "- **`UnexpectedRollbackException`**.",
        "- **`LazyInitializationException`**.",
        "MockMvc chạy cùng thread nên bị rollback; `RANDOM_PORT` qua HTTP thật thì commit thật. Test hành vi transaction: không để `@Transactional` trên test, tự dọn dữ liệu.",
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
