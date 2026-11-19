import timeline from "../timelines/exception.json";
import type { Lesson, Scene } from "../types";

// Every Java output quoted below was run on JDK 21; the @Transactional numbers come from the order-service lab test.
export const exception: Lesson = {
  slug: "exception",
  crumb: "Exception",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/exception-handling",
  videoVersion: "97149456",
  scenes: timeline as Scene[],
  title: "Exception Handling: bắt lỗi sao cho đúng",
  subtitle:
    "Cây exception, checked hay unchecked (và vì sao nó quyết định @Transactional commit hay rollback), những bẫy của finally, try-with-resources, và cách thiết kế exception cho dự án Spring.",
  openingQuiz: {
    question: "static int f() { try { return 1; } finally { return 2; } } trả về gì?",
    options: ["1", "2", "Lỗi biên dịch", "Ném exception"],
    answer: 1,
    explain:
      "finally luôn chạy sau try, và return trong finally ghi đè giá trị return của try. Đã chạy thật: f() = 2. Vì vậy không bao giờ return trong finally.",
  },
  roadmap: [
    "Chặng 1: cây exception, và checked hay unchecked. Vì sao checked không dùng được trong lambda, và vì sao nó làm @Transactional commit nhầm.",
    "Chặng 2: finally và try-with-resources. Các bẫy nuốt exception, và cách giữ lỗi gốc khi close() cũng lỗi.",
    "Chặng 3: thiết kế exception trong dự án Spring. BusinessException, @RestControllerAdvice, exception chaining và các anti-pattern.",
  ],
  sections: [
    {
      id: "hierarchy",
      title: "Phần 1: Cây exception",
      scene: "tree",
      intro: [
        "Chỉ `Throwable` và các class con của nó mới `throw` được. Cây tách hai nhánh: `Error` là lỗi nghiêm trọng của JVM như `OutOfMemoryError`, còn `Exception` là lỗi chương trình có thể xử lý.",
        "Checked là `Exception` và mọi class con, trừ nhánh `RuntimeException`. Unchecked là `RuntimeException` (và con của nó) cộng với `Error`. Chọn từng class để xem nó thuộc nhánh nào.",
      ],
      widget: "exception-tree",
      widgetTitle: "Class này checked hay unchecked?",
      after: [
        "Có nên catch `OutOfMemoryError`? Nói chung là không: JVM đang ở trạng thái không đáng tin. Để process dừng, bật `-XX:+HeapDumpOnOutOfMemoryError` rồi điều tra.",
      ],
      quiz: {
        question: "UncheckedIOException là checked hay unchecked?",
        options: ["Checked, vì có chữ IO", "Unchecked, vì nó extends RuntimeException", "Là Error", "Tuỳ nơi ném"],
        answer: 1,
        explain: "UncheckedIOException kế thừa RuntimeException, nên unchecked. Nó sinh ra đúng để bọc IOException khi cần ném qua lambda.",
      },
    },
    {
      id: "checked-unchecked",
      title: "Phần 2: Checked hay unchecked, và chuyện @Transactional",
      scene: "checked",
      intro: [
        "Checked dành cho lỗi bên ngoài có thể phục hồi: file không tồn tại, mất kết nối. Unchecked dành cho lỗi lập trình và vi phạm nghiệp vụ.",
        "Checked không dùng được trong lambda: `paths.stream().map(p -> Files.readString(p))` báo lỗi biên dịch *unreported exception IOException*, vì `Function.apply` không khai báo `throws`. Phải bọc thành `UncheckedIOException`.",
        "Điểm quan trọng nhất: `@Transactional` mặc định chỉ rollback với `RuntimeException` và `Error`. Thử đổi loại exception mà `charge()` ném.",
      ],
      widget: "transaction-rollback",
      widgetTitle: "checkout(): commit hay rollback?",
      after: [
        "Kết quả lấy từ test thật trong lab `order-service` (`CheckedExceptionRollbackTest`): ném checked thì 1 đơn chưa thanh toán vẫn được lưu và kho bị trừ 10 → 8; thêm `rollbackFor` thì 0 đơn, kho vẫn 10. Vì vậy exception nghiệp vụ nên `extends RuntimeException`.",
      ],
      quiz: {
        question: "Method @Transactional ném IOException (checked) ra ngoài. Mặc định transaction sẽ…",
        options: ["Rollback", "Commit", "Treo cho tới timeout", "Tuỳ database"],
        answer: 1,
        explain: "Quy tắc mặc định chỉ rollback với RuntimeException và Error. Checked exception thì commit, trừ khi khai báo rollbackFor.",
      },
    },
    {
      id: "finally-traps",
      title: "Phần 3: Những bẫy của finally",
      scene: "finally",
      intro: [
        "`finally` luôn chạy sau `try`/`catch`, kể cả khi có `return` hay exception. Ngoại lệ duy nhất: `System.exit()`, JVM sập, hoặc thread bị kill.",
        "Nhiều `catch` thì exception cụ thể đặt trước; đặt ngược sẽ lỗi biên dịch. Chọn từng đoạn code để xem JVM thật sự trả về gì.",
      ],
      widget: "finally",
      widgetTitle: "finally trả về gì?",
      after: [
        "Quy tắc: không bao giờ `return` hay `throw` trong `finally`. `finally` chỉ để dọn tài nguyên, mà từ Java 7 việc đó đã có try-with-resources.",
      ],
      quiz: {
        question: "try ném IllegalStateException, finally có return 0. Bên gọi nhận được gì?",
        options: ["IllegalStateException", "0, và exception biến mất", "Cả hai", "Lỗi biên dịch"],
        answer: 1,
        explain: "return trong finally thay thế mọi kết quả của try, kể cả exception đang bay ra. Đã chạy thật: swallowed() = 0, không có exception nào.",
      },
    },
    {
      id: "try-with-resources",
      title: "Phần 4: try-with-resources",
      scene: "twr",
      intro: [
        "Mọi class implement `AutoCloseable` khai báo trong `try (...)` được tự động `close()`, dù có exception hay không. Nhiều resource đóng theo thứ tự ngược với lúc mở.",
        "Nếu cả thân try và `close()` đều lỗi, lỗi của thân try là lỗi chính, lỗi lúc close được gắn vào `getSuppressed()`. Bật tắt từng loại lỗi và so với cách tự close trong `finally`.",
      ],
      widget: "resources",
      widgetTitle: "try-with-resources vs tự close trong finally",
      after: [
        "Mọi tổ hợp trong mô phỏng là output thật trên JDK 21. Tự close trong finally có hai lỗi: lỗi lúc close đè mất lỗi gốc, và khi `b.close()` lỗi thì `a.close()` không bao giờ chạy, tức resource A bị rò.",
      ],
      quiz: {
        question: "try-with-resources mở A rồi B; thân try và cả hai close() đều lỗi. Exception chính là gì?",
        options: ["close failed A", "close failed B", "body failed, kèm 2 suppressed", "Chỉ exception cuối cùng"],
        answer: 2,
        explain: "Lỗi của thân try là exception chính; close failed B rồi close failed A nằm trong getSuppressed(), đúng thứ tự đóng.",
      },
    },
    {
      id: "spring-design",
      title: "Phần 5: Thiết kế exception trong dự án Spring",
      scene: "custom",
      intro: [
        "Mẫu phổ biến: một `BusinessException extends RuntimeException` mang `errorCode`, và các lớp con cụ thể như `ResourceNotFoundException`, `InsufficientBalanceException`. Service chỉ ném, không tự bắt bừa.",
        "Một `@RestControllerAdvice` map từng loại sang HTTP status, trả format lỗi thống nhất và log đúng một lần kèm traceId. Chọn exception mà service ném.",
      ],
      widget: "exception-advice",
      widgetTitle: "Service ném gì, client nhận gì?",
      after: [
        "Khi bọc exception kỹ thuật, luôn truyền cause: `new PaymentFailedException(\"...\", e)`. Đã chạy thật: log còn dòng `Caused by: java.io.IOException: timeout`; không truyền thì `getCause()` là null.",
        "Anti-pattern hay gặp: nuốt exception `catch (Exception e) {}`, catch `Exception` ở tầng giữa, log rồi ném lại ở mọi tầng, `e.printStackTrace()`, và dùng exception để điều khiển luồng (tạo exception tốn kém vì phải thu thập stack trace).",
      ],
      quiz: {
        question: "Vì sao không nên log rồi ném lại exception ở mọi tầng?",
        options: [
          "Vì Spring cấm",
          "Một lỗi bị in nhiều lần trong log, rất rối; nên log một lần ở tầng ngoài cùng",
          "Vì làm mất stack trace",
          "Vì exception sẽ thành checked",
        ],
        answer: 1,
        explain: "Hoặc xử lý, hoặc ném tiếp. Log tập trung một lần ở @RestControllerAdvice, kèm traceId để tra cứu.",
      },
    },
  ],
  modelAnswer:
    "Exception chia thành Error, là lỗi nghiêm trọng của JVM mà em không catch, và Exception. Checked là Exception trừ nhánh RuntimeException, compiler bắt buộc catch hoặc throws, dành cho lỗi bên ngoài phục hồi được như IO. Trong dự án Spring em dùng unchecked cho nghiệp vụ, vì checked làm code rườm rà, không dùng được trong lambda, và @Transactional mặc định chỉ rollback với unchecked: ném checked thì transaction vẫn commit. Em có BusinessException gốc mang mã lỗi, service chỉ ném, còn @RestControllerAdvice map sang HTTP status và log một lần kèm traceId. Khi bọc lỗi kỹ thuật em luôn truyền cause. Em không return trong finally vì nó nuốt exception, và dùng try-with-resources để lỗi lúc close thành suppressed thay vì đè mất lỗi gốc.",
};
