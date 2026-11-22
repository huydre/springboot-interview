import timeline from "../timelines/lab-tx-bugs.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.05: five transaction bugs reproduced in order-service on PostgreSQL Testcontainers, with
// JpaTransactionManager DEBUG logs. Solution: labs/order-service/. Video not rendered yet: scenes stay empty until publish.
export const labTxBugs: Lesson = {
  slug: "lab-tx-bugs",
  crumb: "Lab 5: Transaction Bugs",
  videoDir: "/videos/lab-tx-bugs",
  videoVersion: "416eb3ad",
  scenes: timeline as Scene[],
  title: "Lab 5: Transaction Bugs",
  subtitle:
    "Tái hiện rồi sửa 5 lỗi transaction trong order-service: self-invocation, checked exception, audit log, UnexpectedRollbackException, email sau commit. Mỗi bài có bản lỗi, bản sửa và log làm bằng chứng.",
  openingQuiz: {
    question: "Vì sao lớp test gốc Lab5TestBase KHÔNG được gắn @Transactional?",
    options: ["Cho nhanh", "Transaction của test sẽ che hành vi lúc commit: AFTER_COMMIT, UnexpectedRollbackException, rollback thật", "Vì Testcontainers không hỗ trợ", "Không có lý do"],
    answer: 1,
    explain: "Mỗi test tự seed lại dữ liệu thay vì dựa vào rollback của test.",
  },
  roadmap: [
    "Chặng 1: chuẩn bị, self-invocation, checked exception.",
    "Chặng 2: audit REQUIRES_NEW, UnexpectedRollbackException.",
    "Chặng 3: email sau commit và checklist.",
  ],
  sections: [
    {
      id: "setup",
      title: "Phần 1: Chuẩn bị",
      scene: "setup",
      intro: [
        "Dùng tiếp project Lab 4. Package `lab5` chứa service bản lỗi và bản sửa đặt cạnh nhau, mọi bean `@Profile(\"lab5\")`. Thêm:",
        "- **`AuditService`**: REQUIRES_NEW.",
        "- **`OrderEmailListener`**: AFTER_COMMIT.",
        "- **`EmailSender`** giả: giữ danh sách email để assert.",
        "- **`PostgresTestcontainersConfig`**: với `@ServiceConnection`.",
        "`Lab5TestBase` chạy profile `test, lab5` trên PostgreSQL thật qua Testcontainers, bật log `JpaTransactionManager` mức DEBUG để thấy chỗ transaction được tạo, tham gia, tạm dừng, commit, rollback.",
        "Lớp test gốc này cố ý **không** gắn `@Transactional`. Nếu gắn, service sẽ tham gia transaction của test và transaction đó không bao giờ commit (test rollback ở cuối), nên các lỗi chỉ lộ ra lúc commit thật như `UnexpectedRollbackException` hay listener AFTER_COMMIT sẽ không xảy ra. Thay vào đó, mỗi test tự xoá và seed lại dữ liệu: kho **Keyboard bắt đầu là 10**, Monitor chỉ còn 1.",
        "Hai request dùng lại trong mọi bài: `validOrder()` 2 Keyboard total 200.00; `orderFailingOnSecondLine()` dòng 1 lấy 2 Keyboard, dòng 2 đòi 5 Monitor khi kho chỉ còn 1, nên dòng 2 ném `InsufficientStockException`. Chạy `./mvnw test -Dtest='com.shop.orderservice.lab5.*Test'`.",
      ],
      widget: "tx-bug-board",
      widgetTitle: "5 lỗi: bản lỗi và bản sửa",
      quiz: {
        question: "Chạy orderFailingOnSecondLine() qua một service có transaction đúng. Kho Keyboard sau đó phải là bao nhiêu?",
        options: ["8, vì dòng 1 đã trừ 2", "10: dòng 2 lỗi nên cả đơn rollback, kể cả phần trừ kho của dòng 1", "5", "0"],
        answer: 1,
        explain: "Một transaction thì cùng thành công hoặc cùng thất bại. Kho còn 8 là dấu hiệu dòng 1 đã commit riêng.",
      },
    },
    {
      id: "self-checked",
      title: "Phần 2: Self-invocation và checked exception",
      scene: "selfchecked",
      intro: [
        "**Bài 1:** `placeOrderBuggy(req)` gọi `this.reserveStock(req)`, method này có `@Transactional` và trừ kho từng dòng. Gửi request `orderFailingOnSecondLine()`: dòng 1 trừ 2 Keyboard, dòng 2 ném lỗi hết kho. Mong đợi: cả đơn rollback, kho vẫn 10.",
        "Đã đo: `txActive=false`, mỗi lời gọi repository là một transaction riêng, nên dòng 1 đã commit trước khi dòng 2 lỗi: kho Keyboard còn **8** dù đơn thất bại. Log không có dòng nào nhắc tới `reserveStock`: annotation bị bỏ qua, không lỗi, không cảnh báo. Bản sửa `placeOrderFixed` không gọi qua `this` mà gọi `orderService.placeOrder(req)` trên bean `OrderService` khác, nên lời gọi đi qua proxy có transaction: kho 10, 0 đơn.",
        "**Bài 2:** lỗi thứ hai không nằm ở proxy mà ở rollback rules. `checkoutBuggy` đặt hàng rồi `charge()` ném `PaymentFailedException extends Exception`. Đã đo: **1 đơn**, kho 8, và khách bị từ chối thẻ vẫn nhận email \"Order #1 confirmed\". `rollbackFor = PaymentFailedException.class` đưa về 0 đơn, kho 10, không email.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Bài 1: gọi qua `this` → không qua proxy → mỗi lời gọi repository một transaction → dòng 1 commit riêng, kho còn 8.",
          "Bài 2: checked exception → interceptor commit → đơn được lưu và listener AFTER_COMMIT gửi email.",
        ],
      },
      quiz: {
        question: "Ở bài 2, ngoài số đơn sai, hậu quả nào hay bị quên?",
        options: ["Không có", "Email xác nhận vẫn gửi vì listener AFTER_COMMIT chạy sau khi transaction commit", "Kho tăng", "Log biến mất"],
        answer: 1,
        explain: "Checked exception mặc định commit, nên mọi thứ gắn vào commit đều chạy.",
      },
    },
    {
      id: "audit-loyalty",
      title: "Phần 3: Audit log và UnexpectedRollbackException",
      scene: "auditloyalty",
      intro: [
        "**Bài 3:** mọi lần thử đặt hàng phải có dòng audit `ORDER_ATTEMPT`. Ghi cùng transaction: **0 dòng**. `AuditService.record` REQUIRES_NEW: **1 dòng**, đã commit trước khi transaction ngoài rollback (đọc được `Suspending current transaction` rồi `Resuming suspended transaction`).",
      ],
      trap: {
        title: "REQUIRES_NEW tốn thêm connection",
        text: "Trong lúc `AuditService.record` chạy, transaction ngoài bị tạm dừng nhưng vẫn giữ connection của nó, nên mỗi request chiếm 2 connection cùng lúc. Tải cao có thể cạn pool (bài Propagation). Giữ phần REQUIRES_NEW thật ngắn, hoặc ghi audit sau khi transaction kết thúc.",
      },
      quiz: {
        question: "Rủi ro của audit log bằng REQUIRES_NEW?",
        options: ["Không có", "Mỗi request chiếm thêm một connection; tải cao có thể cạn pool", "Mất dữ liệu", "Chậm hơn 10 lần"],
        answer: 1,
        explain: "Giữ phần REQUIRES_NEW ngắn, hoặc ghi audit sau transaction.",
      },
      parts: [
        {
          id: "loyalty-rollback-only",
          title: "Bài 4: nuốt exception của bean khác",
          intro: [
            "Bài 3 dùng REQUIRES_NEW để tách transaction. Bài 4 là trường hợp ngược lại: bean khác chạy REQUIRED, chung transaction với caller.",
            "Một service checkout gọi `loyaltyService.addPoints()` ở bean `LoyaltyService` khác, propagation REQUIRED nên tham gia cùng transaction. `addPoints` luôn ném, outer `try/catch` chỉ log warning rồi chạy tiếp. Exception đi qua proxy của `addPoints` đã kịp đánh dấu transaction chung là rollback-only.",
            "Đã đo: log vẫn ghi `Committing JPA transaction on EntityManager`, nhưng caller nhận `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`, và DB có **0 đơn**. Vì vậy đừng tin chữ Committing trong log, luôn assert trên DB. Cho `addPoints` chạy REQUIRES_NEW thì 1 đơn, kho 8.",
          ],
          quiz: {
            question: "Dòng log \"Committing JPA transaction\" có chắc nghĩa là dữ liệu bạn mong muốn đã lưu?",
            options: ["Có", "Không chắc: ở bài 4 log có Committing nhưng thực tế rollback vì rollback-only", "Chỉ với PostgreSQL", "Chỉ khi có @Version"],
            answer: 1,
            explain: "Phải assert trên DB, không chỉ đọc log.",
          },
        },
      ],
    },
    {
      id: "email",
      title: "Phần 4: Email sau commit",
      scene: "email",
      intro: [
        "`OrderEmailListener` dùng `@TransactionalEventListener(AFTER_COMMIT)`, `EagerEmailListener` dùng `@EventListener` thường để so sánh. Commit: cả hai gửi. Rollback (`Payment provider timeout for order 6`): AFTER_COMMIT `[]`, còn `@EventListener` đã gửi `[EAGER] Order #6 confirmed` cho **đơn không tồn tại**.",
        "Bẫy: ghi `NotificationLog` trong AFTER_COMMIT bằng `save()` REQUIRED được **0 dòng**, không cảnh báo, vì listener vẫn thấy `txActive=true` và tham gia đúng EntityManager cũ (cùng số `1650792202`). REQUIRES_NEW mở EntityManager mới và commit thật: 1 dòng.",
      ],
      takeaway: {
        lines: ["Email gửi bằng `@TransactionalEventListener(AFTER_COMMIT)`, vì `@EventListener` thường gửi cả cho đơn đã rollback. Ghi DB trong listener đó thì phải REQUIRES_NEW."],
      },
      widget: "event-phase",
      widgetTitle: "Listener nào chạy khi commit và rollback",
      quiz: {
        question: "Trong listener AFTER_COMMIT, isActualTransactionActive() trả gì?",
        options: ["false", "true, tên vẫn là placeOrder: resource chưa unbind", "Ném exception", "null"],
        answer: 1,
        explain: "Đó là lý do save() REQUIRED tham gia rồi mất.",
      },
    },
    {
      id: "checklist",
      title: "Phần 5: Checklist hoàn thành",
      scene: "checklist",
      intro: [
        "Ghi vào nhật ký bảng 5 lỗi với số liệu của bạn, chỗ đoán sai, rồi tìm trong code thật:",
        "- **Self-invocation**: method `@Transactional` bị gọi qua `this`.",
        "- **Checked exception**: không có `rollbackFor`.",
        "- **Email**: listener gửi email bằng `@EventListener` thường.",
      ],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 5",
    },
  ],
  modelAnswer:
    "Em tái hiện 5 lỗi transaction trong order-service trên PostgreSQL Testcontainers, không đặt @Transactional ở test để thấy hành vi commit thật. Self-invocation làm reserveStock không có transaction, kho bị trừ dở còn 8. Checked exception làm đơn vẫn commit và khách bị từ chối thẻ vẫn nhận email, sửa bằng rollbackFor. Audit log ghi cùng transaction thì mất, chuyển sang REQUIRES_NEW thì còn. Bắt exception của bean REQUIRED khác rồi nuốt thì caller nhận UnexpectedRollbackException và không có đơn nào được lưu. Email em gửi bằng @TransactionalEventListener AFTER_COMMIT vì @EventListener thường gửi cả cho đơn đã rollback, và ghi DB trong listener phải dùng REQUIRES_NEW.",
};
