import timeline from "../timelines/tx-pitfalls.json";
import type { Lesson, Scene } from "../types";

// Measured with @SpringBootTest on Spring Boot 3.5 (Spring 6.2, Hibernate 6.6, H2 2.3), JDK 21; "active" is
// TransactionSynchronizationManager.isActualTransactionActive() read inside the method. See study note 05.02.
export const txPitfalls: Lesson = {
  slug: "tx-pitfalls",
  crumb: "Khi @Transactional không hoạt động",
  videoDir: "/videos/tx-pitfalls",
  videoVersion: "1923f711",
  scenes: timeline as Scene[],
  title: "Khi @Transactional không hoạt động",
  subtitle:
    "Ba nhóm nguyên nhân suy ra từ proxy: self-invocation, private và final, object tự new; checked exception và exception bị nuốt; code chạy trên thread khác.",
  openingQuiz: {
    question: "Method @Transactional lưu một dòng rồi ném IOException. Dòng đó còn trong DB không?",
    options: ["Không, vì có exception", "Có: checked exception mặc định commit", "Tuỳ database", "Chỉ khi readOnly"],
    answer: 1,
    explain: "Đã đo: dòng vẫn còn và log in \"Initiating transaction commit\". Chỉ RuntimeException và Error rollback mặc định.",
  },
  roadmap: [
    "Chặng 1: quy tắc gốc và self-invocation.",
    "Chặng 2: private, final, protected, object tự new.",
    "Chặng 3: rollback rules, exception bị nuốt, thread khác và cách debug.",
  ],
  sections: [
    {
      id: "rule",
      title: "Phần 1: Quy tắc gốc và self-invocation",
      scene: "self",
      intro: [
        "Mọi trường hợp \"không hoạt động\" thuộc 3 nhóm: **không đi qua proxy** (self-invocation, private, final, tự new), **đi qua proxy nhưng interceptor commit** (checked exception, exception bị nuốt), **code chạy ở thread khác** (`@Async`, `CompletableFuture`).",
        "Self-invocation: `this.inTx()` đi thẳng vào object thật. Đã đo: qua proxy `active=true`, qua `this` **`active=false`**, qua `@Lazy` self `active=true`. Ví dụ hay gặp: `importOrders` gọi `this::importOne` có `@Transactional`, mỗi dòng không có transaction riêng. Sửa: tách method sang bean khác (ưu tiên), `TransactionTemplate`, hoặc inject chính mình bằng `@Lazy`. Chuyển annotation lên method ngoài thì thành một transaction cho cả lô, khác ý định.",
      ],
      widget: "tx-active",
      widgetTitle: "Có transaction không",
      quiz: {
        question: "Method A @Transactional gọi this.b() mà b có REQUIRES_NEW. b có transaction riêng không?",
        options: ["Có", "Không: lời gọi không qua proxy nên REQUIRES_NEW bị bỏ qua, b chạy trong transaction của A", "b không chạy", "Lỗi khởi động"],
        answer: 1,
        explain: "Audit log trong b sẽ mất khi A rollback: bẫy kép self-invocation và propagation.",
      },
    },
    {
      id: "visibility",
      title: "Phần 2: private, final, protected và object tự new",
      scene: "final",
      intro: [
        "CGLIB proxy là subclass, chỉ chặn method override được. Đã đo: `public`, `protected`, package-private gọi qua proxy đều `active=true` (Spring 6). `public final` thì **`active=false` và `repoNull=true`**: method chạy trên chính proxy, nơi field không được inject, dễ NullPointerException; Kotlin mặc định final cả class lẫn method: class final thì app không khởi động được, method final thì field null; cần plugin `kotlin-spring`.",
        "`private` chỉ gọi được nội bộ nên luôn là self-invocation, và không có cảnh báo nào. `new ProbeService().inTx()` không phải bean nên `active=false`. Khi phỏng vấn: \"Spring 6 hỗ trợ protected và package-private, nhưng em vẫn để public cho rõ ràng\".",
      ],
      quiz: {
        question: "Vì sao gọi method final trên proxy lại thấy field null?",
        options: [
          "Vì GC dọn field",
          "Proxy được tạo bằng Objenesis và không được inject field; method final không override được nên chạy thẳng trên proxy",
          "Vì field là static",
          "Vì lazy loading",
        ],
        answer: 1,
        explain: "Đo được repoNull=true.",
      },
    },
    {
      id: "rollback",
      title: "Phần 3: Rollback rules",
      scene: "rollback",
      intro: [
        "Mặc định chỉ rollback khi gặp `RuntimeException` hoặc `Error`; checked exception được coi là kết quả nghiệp vụ dự kiến (quy ước từ EJB) nên **commit**. Đã đo: `IOException` để lại dòng trong DB; thêm `rollbackFor = Exception.class` thì không; `noRollbackFor = IllegalArgumentException.class` thì giữ dòng.",
        "Business exception nên extends `RuntimeException`, hoặc thống nhất `rollbackFor = Exception.class`. `rollbackFor` chỉ **thêm** loại cần rollback và khớp cả subclass. Kotlin không có checked exception nhưng class extends `Exception` vẫn bị Spring coi là checked. `rollbackFor` và `noRollbackFor` cùng khớp thì rule gần nhất trong cây kế thừa thắng.",
      ],
      widget: "rollback-rules",
      widgetTitle: "Exception nào thì rollback",
      quiz: {
        question: "@Transactional(rollbackFor = Exception.class) có rollback khi gặp Error không?",
        options: ["Không", "Có: rule mặc định vẫn còn, rollbackFor chỉ thêm", "Chỉ OutOfMemoryError", "Tuỳ JVM"],
        answer: 1,
        explain: "rollbackFor không thay thế rule mặc định.",
      },
    },
    {
      id: "swallow",
      title: "Phần 4: Exception bị nuốt",
      scene: "swallow",
      intro: [
        "Interceptor chỉ biết có lỗi khi exception bay ra khỏi method. `catch` rồi chỉ log thì commit: đã đo dòng vẫn còn. Sửa: ném lại hoặc bọc vào exception nghiệp vụ; nếu thật sự muốn trả về bình thường mà vẫn rollback thì `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` (log `Transactional code has requested rollback`).",
        "Ngoại lệ: exception ném từ method `@Transactional` của **bean khác** đã đánh dấu transaction rollback-only trước khi tới tay bạn; nuốt nó thì lúc commit nổ `UnexpectedRollbackException` (bài Propagation).",
      ],
      quiz: {
        question: "Cách nên dùng khi bắt exception trong method @Transactional?",
        options: ["Log rồi bỏ qua", "Log rồi ném lại hoặc bọc vào exception nghiệp vụ", "Gọi System.exit", "Đổi sang checked exception"],
        answer: 1,
        explain: "setRollbackOnly chỉ khi thật sự cần trả về bình thường.",
      },
    },
    {
      id: "thread",
      title: "Phần 5: Thread khác và cách debug",
      scene: "thread",
      intro: [
        "Transaction nằm trong ThreadLocal của thread đã mở nó. Đã đo: caller trên `main` `active=true` thấy dòng vừa `saveAndFlush`; method `@Async` trên `task-1` **`active=false` và không thấy** dòng đó vì chưa commit. Lỗi thực tế: lưu đơn rồi `@Async sendConfirmation(orderId)` thì `findById` ra rỗng. Sửa: thread mới tự mở transaction, hoặc `@TransactionalEventListener(AFTER_COMMIT)` kết hợp `@Async`.",
        "Nguyên nhân khác: sai transaction manager khi có nhiều DataSource, bảng MyISAM không có transaction, `@PostConstruct` gọi method của chính bean, nhầm `jakarta.transaction.Transactional` (không có readOnly, isolation). Debug: log DEBUG `JpaTransactionManager`, in `isActualTransactionActive()`, in `getClass()`, xem exception có ra khỏi method.",
      ],
      widget: "tx-group",
      widgetTitle: "Xếp từng tình huống vào nhóm",
      quiz: {
        question: "Lưu đơn hàng trong @Transactional rồi gọi @Async gửi mail, mail đọc findById ra rỗng. Vì sao?",
        options: ["Lỗi Hibernate", "Thread @Async không có transaction của caller và không thấy dữ liệu chưa commit", "Cache sai", "DB chậm"],
        answer: 1,
        explain: "Dùng @TransactionalEventListener(phase = AFTER_COMMIT).",
      },
    },
  ],
  modelAnswer:
    "Em chia làm ba nhóm, đều suy ra từ cơ chế proxy. Nhóm một là lời gọi không đi qua proxy: self-invocation qua this, method private, method final, hoặc object tự new; em đã đo gọi qua this thì isActualTransactionActive là false, method final còn tệ hơn vì chạy trên chính proxy nên field inject bị null; Spring 6 thì protected và package-private đã chạy được. Nhóm hai là đi qua proxy nhưng interceptor quyết định commit: checked exception không khai báo rollbackFor, em đo thấy dòng vẫn được lưu, hoặc exception bị nuốt. Nhóm ba là code chạy trên thread khác như @Async, vì transaction gắn vào ThreadLocal. Ở dự án em từng gặp self-invocation khi import file và sửa bằng cách tách method sang bean riêng.",
};
