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
      board: {
        title: "Vì sao @Transactional không chạy",
        highlight: "không chạy",
        chips: ["3 nhóm nguyên nhân", "Self-invocation hay gặp nhất"],
        cards: [
          {
            title: "Self-invocation",
            diagram: {
              kind: "flow",
              steps: ["importOrders(file)", "this.importOne(row)", "importOne có @Transactional"],
              ok: ["Gọi qua bean khác", "active=true"],
              bad: ["Gọi qua this", "active=false"],
            },
            notes: ["`this` là object thật, không phải proxy, nên annotation không bao giờ được đọc.", "Cách sửa: tách sang bean khác, dùng `TransactionTemplate` hoặc inject chính mình bằng `@Lazy`."],
            code: `void importOrders(File file) {
  for (var row : read(file)) {
    this.importOne(row); // bỏ qua proxy
  }
}`,
            takeaway: "Lời gọi không đi qua proxy thì annotation vô tác dụng",
          },
          {
            title: "Ba nhóm nguyên nhân",
            diagram: {
              kind: "hub",
              inputs: [{ label: "Không đi qua proxy" }, { label: "Interceptor vẫn commit" }, { label: "Thread khác" }],
              center: "Không có rollback",
              rulesTitle: "Ví dụ từng nhóm",
              rules: ["self-invocation, `private`, `final`, tự new", "checked exception, exception bị nuốt", "`@Async`, `CompletableFuture`"],
            },
            takeaway: "Xác định nhóm trước, rồi mới sửa",
          },
        ],
        conclusion: "**Kết luận:** đo bằng `isActualTransactionActive()` trong method để biết chắc có transaction hay không.",
      },
      scene: "self",
      intro: [
        "Cách đo trong cả bài: ngay trong method, in `TransactionSynchronizationManager.isActualTransactionActive()`. In ra `active=true` là đang có transaction, `active=false` là không có. Nhãn `repoNull` (Phần 2) là kiểm tra field `repo` có bị null không.",
        "Mọi trường hợp \"`@Transactional` không hoạt động\" thuộc 3 nhóm:",
        "- **Không đi qua proxy**: self-invocation, private, final, tự new.",
        "- **Đi qua proxy nhưng interceptor commit**: checked exception, exception bị nuốt.",
        "- **Code chạy ở thread khác**: `@Async`, `CompletableFuture`.",
      ],
      after: [
        "Nhóm đầu tiên hay gặp nhất là **self-invocation** (tự gọi method của chính mình). Tình huống: `importOrders(file)` đọc từng dòng rồi gọi `this.importOne(row)` có `@Transactional`, mong **mỗi dòng một transaction**, dòng lỗi thì chỉ dòng đó rollback.",
        "Nhưng `this` là object thật, không phải proxy, nên `@Transactional` trên `importOne` không bao giờ được đọc. Đã đo: gọi qua proxy `active=true`, qua `this` **`active=false`**, qua `@Lazy` self `active=true`.",
        "Cách sửa:",
        "- **Tách `importOne` sang bean khác**: ưu tiên.",
        "- **Dùng `TransactionTemplate`**.",
        "- **Inject chính mình bằng `@Lazy`**.",
        "Chuyển annotation lên `importOrders` thì thành một transaction cho cả lô: một dòng lỗi là cả file rollback, khác ý định.",
      ],
      predict: {
        question: "Spring 6, method `@Transactional` là `protected` (không phải public), gọi từ bean khác qua proxy. Có transaction không?",
        options: [
          "Không, `@Transactional` chỉ chạy trên method public",
          "Có, `active=true`: Spring 6 với CGLIB chặn được cả protected và package-private",
          "App fail khi start",
          "Chỉ có khi đặt `readOnly = true`",
        ],
        answer: 1,
        explain: "\"Chỉ public\" là hành vi Spring 5. Spring 6 chặn mọi method mà class con CGLIB override được; chỉ `private` và `final` là không.",
      },
      widget: "tx-active",
      widgetTitle: "Có transaction không",
      quiz: {
        question: "importOrders() không có @Transactional, gọi this.importOne(row) có @Transactional. Mỗi dòng có transaction riêng không?",
        options: ["Có, mỗi dòng một transaction", "Không: lời gọi qua this không đi qua proxy, importOne chạy với active=false", "Có, nhưng chỉ dòng đầu", "Lỗi khởi động"],
        answer: 1,
        explain: "Annotation chỉ có tác dụng khi lời gọi đi qua proxy. Tách importOne sang bean khác hoặc dùng TransactionTemplate.",
      },
    },
    {
      id: "visibility",
      title: "Phần 2: private, final, protected và object tự new",
      scene: "final",
      intro: [
        "CGLIB proxy là subclass, chỉ chặn method override được. Đã đo: `public`, `protected`, package-private gọi qua proxy đều `active=true` (Spring 6). `public final` thì **`active=false` và `repoNull=true`**.",
        "Vì sao field null: proxy là một object riêng, được tạo bằng thư viện **Objenesis**, tức là **không chạy constructor và không được inject gì**, nên field của chính proxy đều null. Method thường thì proxy chuyển lời gọi sang object thật. Method `final` không override được, nên code gốc chạy ngay trên object proxy, đọc field null, dễ NullPointerException.",
        "`private` chỉ gọi được nội bộ nên luôn là self-invocation, và không có cảnh báo nào. `new ProbeService().inTx()` không phải bean nên `active=false`. Khi phỏng vấn: \"Spring 6 hỗ trợ protected và package-private, nhưng em vẫn để public cho rõ ràng\".",
      ],
      trap: {
        title: "Kotlin: mặc định mọi thứ là final",
        text: "Kotlin mặc định final cả class lẫn method. Class final thì CGLIB không tạo được subclass, app không khởi động được; method final thì rơi đúng vào trường hợp field null ở trên. Cần plugin `kotlin-spring` để tự mở các class có annotation của Spring.",
      },
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
        "Điểm nguy hiểm: caller **nhận được exception** nên tưởng thao tác đã thất bại, có khi còn báo lỗi cho người dùng hay thử lại, trong khi dòng dữ liệu đã được lưu thật.",
        "Business exception nên extends `RuntimeException`, hoặc thống nhất `rollbackFor = Exception.class`. Thêm vài quy tắc:",
        "- **`rollbackFor` chỉ thêm**: thêm loại cần rollback và khớp cả subclass, không bỏ rule mặc định.",
        "- **Kotlin**: không có checked exception, nhưng class extends `Exception` vẫn bị Spring coi là checked.",
        "- **Cùng khớp `rollbackFor` và `noRollbackFor`**: rule gần nhất trong cây kế thừa thắng.",
      ],
      predict: {
        question: "Method `@Transactional` lưu một dòng, rồi ném `RuntimeException` nhưng chính nó `catch` và chỉ log, không ném lại. Dòng đó còn trong DB không?",
        options: [
          "Không, `RuntimeException` luôn làm rollback",
          "Còn: exception không bay ra khỏi method nên interceptor commit",
          "Tuỳ isolation level",
          "Transaction bị treo",
        ],
        answer: 1,
        explain: "Interceptor chỉ thấy exception khi nó bay ra khỏi method. Bắt rồi nuốt thì với interceptor, method đã trả về bình thường.",
      },
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
        "Phần 3 là exception bay ra nhưng interceptor vẫn commit. Trường hợp còn lại của nhóm hai: exception không bay ra chút nào.",
        "Interceptor chỉ biết có lỗi khi exception bay ra khỏi method. `catch` rồi chỉ log thì commit: đã đo dòng vẫn còn. Sửa: ném lại hoặc bọc vào exception nghiệp vụ; nếu thật sự muốn trả về bình thường mà vẫn rollback thì `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` (log `Transactional code has requested rollback`).",
        "Ngoại lệ: exception ném từ method `@Transactional` của **bean khác** mà method đó tham gia cùng transaction với bạn (propagation `REQUIRED`, mặc định) đã đánh dấu transaction rollback-only trước khi tới tay bạn; nuốt nó thì lúc commit nổ `UnexpectedRollbackException` (bài Propagation).",
      ],
      takeaway: {
        lines: ["Interceptor chỉ quyết định rollback khi exception **bay ra khỏi method**. Bắt thì ném lại; muốn trả về bình thường mà vẫn rollback thì `setRollbackOnly()`."],
      },
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
      ],
      after: [
        "Nguyên nhân khác cần kiểm tra:",
        "- **Sai transaction manager**: khi có nhiều DataSource.",
        "- **Bảng MyISAM** của MySQL: không hỗ trợ transaction.",
        "- **`@PostConstruct`** gọi method của chính bean (gọi qua `this`).",
        "Về `jakarta.transaction.Transactional`: Spring **vẫn hiểu** annotation này và mở transaction bình thường, nhưng nó không có `readOnly`, `isolation`, `timeout`, và rollback được cấu hình bằng `rollbackOn` chứ không phải `rollbackFor`. Import nhầm thì mất các tuỳ chọn đó mà không có cảnh báo, nên dùng `org.springframework.transaction.annotation.Transactional`.",
        "Debug theo thứ tự:",
        "- **Log DEBUG `JpaTransactionManager`**: có dòng `Creating new transaction` không.",
        "- **In `isActualTransactionActive()`**: đang có transaction không.",
        "- **In `getClass()`**: có phải proxy không.",
        "- **Xem exception**: có thật sự bay ra khỏi method không.",
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
