import timeline from "../timelines/exception.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java output quoted below was run on JDK 21; the @Transactional numbers come from the order-service lab test; the logging output used SLF4J 2.0.17 with Logback 1.5.21.
export const exception: Lesson = {
  slug: "exception",
  crumb: "Exception",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/exception-handling",
  videoVersion: "7e69d5fb",
  scenes: timeline as Scene[],
  title: "Exception Handling: bắt lỗi sao cho đúng",
  subtitle:
    "Cây exception, checked hay unchecked (vì sao checked không đi qua lambda, và vì sao nó quyết định @Transactional commit hay rollback), những bẫy của finally, try-with-resources, và cách thiết kế exception cho dự án Spring.",
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
        "Checked là `Exception` và mọi class con, trừ nhánh `RuntimeException`. Unchecked là `RuntimeException` (và con của nó) cộng với `Error`.",
        "**Checked nghĩa là compiler kiểm tra giúp bạn.** `Files.readString(p)` khai báo `throws IOException`, nên nếu bạn gọi nó mà không `catch`, cũng không ghi `throws IOException` ở method của mình, code **không biên dịch được**. Đã chạy `javac`: `error: unreported exception IOException; must be caught or declared to be thrown`.",
        "Unchecked thì compiler bỏ qua: `Integer.parseInt(\"x\")` biên dịch bình thường, chỉ khi chạy mới ném `NumberFormatException`. Chọn từng class để xem nó thuộc nhánh nào.",
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
      title: "Phần 2: Checked hay unchecked?",
      scene: "checked",
      intro: [
        "Nhắc lại Phần 1: với checked, compiler **bắt người gọi phải xử lý** (`catch` hoặc `throws`); với unchecked thì không. Vì vậy câu hỏi thật sự khi chọn là: có nên ép người gọi xử lý lỗi này không?",
        "Chọn **checked** khi người gọi **làm được gì đó** để phục hồi: file không tồn tại thì cho người dùng chọn file khác, mất mạng thì thử lại.",
        "Chọn **unchecked** khi người gọi ở giữa **không làm được gì**: lỗi lập trình như `NullPointerException` hay truyền tham số sai, và vi phạm nghiệp vụ như hết hàng, số dư không đủ. Cứ để lỗi bay lên một chỗ xử lý chung (Phần 5).",
      ],
      widgetTitle: "Lỗi này nên là checked hay unchecked?",
      drill: {
        choices: ["Checked", "Unchecked"],
        summary: "Hỏi: người gọi ngay phía trên có làm được gì để phục hồi không? Có thì checked, không thì unchecked.",
        items: [
          { q: "Đọc file cấu hình do người dùng chọn, file không tồn tại.", a: "Checked", why: "Người gọi xử lý được: báo lỗi và cho chọn file khác. Đó là lý do `IOException` là checked." },
          { q: "Đặt hàng nhưng sản phẩm đã hết.", a: "Unchecked", why: "Vi phạm nghiệp vụ. Controller hay service ở giữa không sửa được, chỉ cần báo về cho client qua chỗ xử lý chung." },
          { q: "Gọi method với tham số `null` trong khi tài liệu ghi rõ không được null.", a: "Unchecked", why: "Lỗi lập trình: sửa code, không phải bắt lỗi. Ví dụ `NullPointerException`, `IllegalArgumentException`." },
          { q: "Thư viện gửi email thử lại được khi mất mạng tạm thời.", a: "Checked", why: "Người gọi có cách phục hồi rõ ràng (thử lại), nên ép họ nghĩ tới nó là hợp lý." },
          { q: "Chuyển tiền nhưng số dư không đủ.", a: "Unchecked", why: "Vi phạm nghiệp vụ. Trong dự án Spring nó là `InsufficientBalanceException extends RuntimeException`, và còn một lý do quan trọng ở mục @Transactional bên dưới." },
        ],
      },
      quiz: {
        question: "Theo quy ước, vì sao `IOException` là checked còn `IllegalArgumentException` là unchecked?",
        options: [
          "Vì IOException chậm hơn",
          "IO lỗi do môi trường bên ngoài, người gọi có thể phục hồi; tham số sai là lỗi lập trình, phải sửa code",
          "Vì IllegalArgumentException kế thừa Error",
          "Không có lý do, chỉ là ngẫu nhiên",
        ],
        answer: 1,
        explain: "Checked dành cho lỗi bên ngoài mà người gọi xử lý được. Lỗi lập trình thì không có gì để bắt, chỉ cần sửa code, nên là unchecked.",
      },
      parts: [
        {
          id: "checked-lambda",
          title: "Checked không đi qua được lambda",
          scene: "lambda",
          intro: [
            "Lambda trong `map()` thật ra là **phần thân của một method**: method `apply` của {{functional-interface|interface}} `Function`. Chữ ký của nó trong JDK là `R apply(T t);`, không có `throws` nào.",
            "Theo luật ở Phần 1, gọi `Files.readString(p)` (có `throws IOException`) thì phải `catch` hoặc khai báo `throws`. Nhưng bạn **không sửa được chữ ký của `apply`**, nên trong lambda không có chỗ nào để khai báo `throws`. Compiler báo lỗi.",
            "Cách sửa: bắt `IOException` ngay trong lambda rồi bọc vào `UncheckedIOException`. Nó là unchecked nên đi qua `apply` được, và vẫn giữ lỗi gốc trong `getCause()`. Chọn từng cách để xem kết quả thật.",
          ],
          widgetTitle: "Đọc nhiều file bằng stream",
          compare: [
            way(
              "Gọi thẳng trong lambda",
              `List<String> readAll(List<Path> paths) {
    return paths.stream()
        .map(p -> Files.readString(p))  // throws IOException
        .toList();
}`,
              [
                ask("Biên dịch", bad("Đã chạy `javac`: `error: unreported exception IOException; must be caught or declared to be thrown`, chỉ đúng vào `Files.readString(p)`.")),
                ask("Thêm throws IOException vào readAll()", bad("Đã chạy: **vẫn lỗi y hệt**. Lỗi nằm trong thân lambda, tức trong `apply()`, chứ không nằm trong `readAll()`.")),
              ],
              "Không biên dịch được.",
            ),
            way(
              "Bọc thành UncheckedIOException",
              `List<String> readAll(List<Path> paths) {
    return paths.stream()
        .map(p -> {
            try { return Files.readString(p); }
            catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        })
        .toList();
}`,
              [
                ask("Một file có nội dung hello", ok("Đã chạy: `[hello]`.")),
                ask("Thêm một file không tồn tại", ok("Đã chạy: bắt được `UncheckedIOException`, và `getCause()` là `java.nio.file.NoSuchFileException: missing.txt`. Lỗi gốc không mất.")),
              ],
              "Biên dịch được, lỗi gốc nằm trong cause.",
            ),
          ],
          quiz: {
            question: "Vì sao `.map(p -> Files.readString(p))` không biên dịch được, kể cả khi method bên ngoài đã khai báo `throws IOException`?",
            options: [
              "Vì stream không hỗ trợ đọc file",
              "Vì lambda là thân của Function.apply, mà apply không khai báo throws",
              "Vì IOException là unchecked",
              "Vì phải dùng parallelStream",
            ],
            answer: 1,
            explain: "Exception checked phải được khai báo ở đúng method chứa lời gọi, ở đây là apply(). Chữ ký R apply(T t) không có throws, nên phải bắt và bọc lại ngay trong lambda.",
          },
        },
        {
          id: "checked-rollback",
          senior: true,
          title: "Checked làm @Transactional commit nhầm",
          scene: "rollback",
          intro: [
            "`@Transactional` biến cả method thành một {{transaction|transaction}}: mọi thao tác database bên trong hoặc cùng được lưu ({{commit|commit}}), hoặc cùng bị huỷ ({{rollback|rollback}}).",
            "Lab `order-service` có `checkout()` làm 3 bước:",
            "- **(1) Lưu đơn hàng**.",
            "- **(2) Trừ kho**: bàn phím từ 10 xuống 8.",
            "- **(3) Thanh toán**: gọi cổng thanh toán `charge()`.",
            "Nếu bước 3 thất bại, ta muốn bước 1 và 2 cũng bị huỷ: không có đơn nào, kho vẫn 10.",
            "Nhưng `charge()` ném `PaymentFailedException extends Exception`, tức là checked. Mà `@Transactional` mặc định **chỉ rollback với `RuntimeException` và `Error`**. Thử đổi loại exception bên dưới.",
          ],
          predict: {
            question: "`charge()` ném `PaymentFailedException extends Exception` (checked) ra khỏi `checkout()`. Database còn lại gì?",
            options: [
              "0 đơn, kho vẫn 10, vì có exception là rollback",
              "1 đơn chưa thanh toán, kho bị trừ còn 8",
              "Transaction treo cho tới timeout",
              "Lỗi biên dịch vì checked trong @Transactional",
            ],
            answer: 1,
            explain: "Gặp checked exception, Spring vẫn commit. Bước 1 và 2 đã làm được lưu lại, dù thanh toán thất bại.",
          },
          board: {
            title: "Checked exception làm @Transactional commit nhầm",
            highlight: "commit nhầm",
            chips: ["Mặc định chỉ rollback RuntimeException và Error", "Checked: Spring vẫn commit"],
            cards: [
              {
                title: "checkout() thất bại ở bước 3",
                diagram: {
                  kind: "flow",
                  steps: ["checkout()", "Lưu đơn hàng", "Trừ kho 10 → 8", "charge() thất bại"],
                  ok: ["Ném unchecked", "ROLLBACK: 0 đơn, kho 10"],
                  bad: ["Ném checked", "COMMIT: 1 đơn, kho 8"],
                },
                notes: ["Test thật trong lab: ném checked thì đơn chưa thanh toán vẫn được lưu, kho bị trừ, khách còn nhận email xác nhận."],
                code: `@Transactional
          public void checkout(Cart cart) throws PaymentFailedException {
            // lưu đơn, trừ kho, rồi charge()
          }`,
                takeaway: "Cùng một lỗi thanh toán, loại exception quyết định commit hay rollback",
              },
              {
                title: "Quy tắc mặc định của Spring",
                diagram: {
                  kind: "hub",
                  inputs: [{ label: "RuntimeException" }, { label: "Error" }, { label: "Exception (checked)" }],
                  center: "@Transactional",
                  rulesTitle: "Mặc định",
                  rules: ["`RuntimeException` và `Error`: rollback", "Checked: **commit**", "`rollbackFor` đổi được quy tắc"],
                },
                notes: ["Hai cách sửa: `@Transactional(rollbackFor = PaymentFailedException.class)`, hoặc cho exception nghiệp vụ `extends RuntimeException` ngay từ đầu."],
                takeaway: "Muốn rollback thì khai báo rollbackFor hoặc dùng unchecked",
              },
            ],
            conclusion: "**Kết luận:** exception nghiệp vụ trong method `@Transactional` nên là unchecked, hoặc phải có `rollbackFor`. Và đừng `catch` rồi nuốt lỗi, vì Spring chỉ thấy exception thoát ra khỏi method.",
          },
          widget: "transaction-rollback",
          widgetTitle: "checkout(): commit hay rollback?",
          after: [
            "Kết quả lấy từ test thật trong lab (`CheckedExceptionRollbackTest`): ném checked thì 1 đơn chưa thanh toán vẫn được lưu, kho bị trừ 10 → 8, và khách còn nhận email xác nhận. Thêm `rollbackFor` thì 0 đơn, kho vẫn 10.",
            "Vì sao Spring mặc định như vậy? Spring giữ quy ước cũ của EJB: checked là một kết quả **đã được báo trước** mà người gọi sẽ tự xử lý, nên phần việc đã làm vẫn được lưu. Còn unchecked là sự cố bất ngờ, nên huỷ hết cho an toàn.",
            "Có hai cách sửa: thêm `@Transactional(rollbackFor = PaymentFailedException.class)` ở từng method, hoặc gọn hơn là cho exception nghiệp vụ `extends RuntimeException` ngay từ đầu. Dự án Spring thường chọn cách thứ hai (Phần 5).",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Exception nghiệp vụ là checked → `@Transactional` mặc định không rollback → đơn đã lưu, kho đã trừ dù thanh toán lỗi.",
            ],
          },
          trap: {
            title: "Bắt exception ngay trong method @Transactional",
            text: "Nếu `checkout()` tự `catch` lỗi rồi không ném lại, Spring không thấy exception nào thoát ra, nên vẫn commit, kể cả khi đó là `RuntimeException`. Muốn rollback thì phải để exception bay ra khỏi method.",
          },
          quiz: {
            question: "Method @Transactional ném IOException (checked) ra ngoài. Mặc định transaction sẽ…",
            options: ["Rollback", "Commit", "Treo cho tới timeout", "Tuỳ database"],
            answer: 1,
            explain: "Quy tắc mặc định chỉ rollback với RuntimeException và Error. Checked exception thì commit, trừ khi khai báo rollbackFor.",
          },
        },
      ],
    },
    {
      id: "finally-traps",
      title: "Phần 3: Những bẫy của finally",
      scene: "finally",
      intro: [
        "Phần 2 chọn loại exception để ném. Giờ xem chỗ exception hay bị mất mà không ai hay: khối `finally`.",
        "`finally` luôn chạy sau `try`/`catch`, kể cả khi có `return` hay exception. Ngoại lệ duy nhất: `System.exit()`, JVM sập, hoặc thread bị kill.",
        "Ba bẫy của finally mà widget bên dưới cho thử:",
        "- **`return` trong `finally` ghi đè** giá trị `return` của `try`.",
        "- **`return` trong `finally` nuốt exception**: exception đang bay ra từ `try` biến mất, bên gọi nhận giá trị bình thường.",
        "- **Sửa biến trong `finally` không đổi kết quả**: giá trị `return` đã được chốt trước khi `finally` chạy, nên `x = 99` trong `finally` không ảnh hưởng.",
        "Chọn từng đoạn code để xem JVM thật sự trả về gì.",
      ],
      widget: "finally",
      widgetTitle: "finally trả về gì?",
      after: [
        "Quy tắc: không bao giờ `return` hay `throw` trong `finally`. `finally` chỉ để dọn tài nguyên, mà từ Java 7 việc đó đã có try-with-resources.",
        "Một quy tắc nhỏ về nhiều `catch`: exception cụ thể đặt trước, exception cha đặt sau. Nếu `catch (IOException)` đứng trước `catch (FileNotFoundException)` thì nhánh sau không bao giờ chạy tới được (mọi `FileNotFoundException` đã bị nhánh trên bắt), nên javac từ chối: `exception FileNotFoundException has already been caught`.",
      ],
      quiz: {
        question: "try ném IllegalStateException, finally có return 0. Bên gọi nhận được gì?",
        options: ["IllegalStateException", "0, và exception biến mất", "Cả hai", "Lỗi biên dịch"],
        answer: 1,
        explain: "return trong finally thay thế mọi kết quả của try, kể cả exception đang bay ra. Đã chạy thật: swallowed() = 0, không có exception nào.",
      },
      parts: [
        {
          id: "final-finally-finalize",
          title: "final, finally, finalize: ba thứ chỉ giống tên",
          intro: [
            "Câu hỏi kinh điển cho junior. Ba từ gần giống nhau nhưng không liên quan gì tới nhau:",
            "- **`final`** là từ khoá khai báo \"không đổi được nữa\". Biến `final` chỉ gán một lần; method `final` không override được; class `final` không kế thừa được (ví dụ `String`).",
            "- **`finally`** là khối đi sau `try`/`catch`, luôn chạy dù có exception hay không, dùng để dọn tài nguyên. Đây là phần bạn vừa học ở trên.",
            "- **`finalize()`** là method của `Object` mà GC từng gọi trước khi thu hồi object. Nó không có hạn chạy, có thể không bao giờ chạy, và làm GC chậm đi, nên đã bị đánh dấu deprecated từ Java 9 và đánh dấu sẽ xoá từ Java 18. Đã chạy `javac -Xlint:removal` trên JDK 21 với một class override nó: `warning: [removal] finalize() in Object has been deprecated and marked for removal`. Dọn tài nguyên thì dùng try-with-resources (Phần 4).",
          ],
          trap: {
            title: "Dùng finalize() để đóng file hay connection",
            text: "Không có gì đảm bảo `finalize()` được gọi, hay được gọi lúc nào: chương trình có thể hết file handle trước khi GC chạy. Đóng tài nguyên bằng try-with-resources.",
          },
        },
      ],
    },
    {
      id: "try-with-resources",
      title: "Phần 4: try-with-resources",
      scene: "twr",
      intro: [
        "Phần 3 kết luận `finally` chỉ nên dùng để dọn tài nguyên. Từ Java 7, việc đó có cách an toàn hơn.",
        "Mọi class implement `AutoCloseable` khai báo trong `try (...)` được tự động `close()`, dù có exception hay không. Nhiều resource đóng theo thứ tự ngược với lúc mở, vì resource mở sau có thể đang dùng resource mở trước (ví dụ `Statement` dùng `Connection`), nên phải đóng nó trước.",
        "Nếu cả thân try và `close()` đều lỗi, lỗi của thân try là lỗi chính, lỗi lúc close được gắn vào `getSuppressed()`. Bật tắt từng loại lỗi và so với cách tự close trong `finally`.",
      ],
      board: {
        title: "try-with-resources đóng ngược thứ tự và không làm mất lỗi gốc",
        highlight: "không làm mất lỗi gốc",
        chips: ["Mở A rồi B, đóng B rồi A", "Lỗi của thân try là lỗi chính"],
        cards: [
          {
            title: "Thứ tự mở và đóng",
            diagram: {
              kind: "flow",
              steps: ["Mở A", "Mở B", "Chạy thân try", "close() B rồi close() A"],
              ok: ["Thân try ổn", "Return bình thường"],
              bad: ["Thân try lỗi", "Lỗi chính + suppressed"],
            },
            notes: ["Nhiều resource đóng theo thứ tự ngược với lúc mở.", "Lỗi lúc `close()` được gắn vào `getSuppressed()` của lỗi chính."],
            code: `try (A a = new A(); B b = new B()) {
        // thân try
      }   // close() b, rồi close() a`,
            takeaway: "Dù có exception hay không, mọi resource đều được close()",
          },
          {
            title: "Tự close trong finally",
            diagram: {
              kind: "flow",
              steps: ["finally: b.close(), a.close()", "b.close() ném lỗi", "Dòng a.close() bị bỏ qua"],
              ok: ["try-with-resources", "Mọi close() đều chạy"],
              bad: ["Tự close trong finally", "A bị rò, mất lỗi gốc"],
            },
            notes: ["Lỗi lúc close đè mất lỗi gốc, và khi `b.close()` lỗi thì `a.close()` không bao giờ chạy."],
            takeaway: "Dọn tài nguyên thì dùng try-with-resources, đừng tự viết finally",
          },
        ],
        conclusion: "**Kết luận:** resource nào implement `AutoCloseable` thì khai báo trong `try (...)`: đóng đủ, đóng đúng thứ tự, giữ được lỗi gốc.",
      },
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
        "Một `@RestControllerAdvice` (một class bắt exception cho mọi controller) map từng loại sang HTTP status, trả format lỗi thống nhất và log đúng một lần kèm `traceId` (mã gắn vào mọi dòng log của một request, để tra đúng request bị lỗi). Chọn exception mà service ném.",
      ],
      widget: "exception-advice",
      widgetTitle: "Service ném gì, client nhận gì?",
      after: [
        "Khi bọc exception kỹ thuật, luôn truyền cause: `new PaymentFailedException(\"...\", e)`. Đã chạy thật: log còn dòng `Caused by: java.io.IOException: timeout`; không truyền thì `getCause()` là null.",
        "Anti-pattern hay gặp:",
        "- **Nuốt exception**: `catch (Exception e) {}` làm lỗi biến mất, không ai biết có chuyện gì.",
        "- **Catch `Exception` ở tầng giữa**: bắt luôn cả lỗi mà tầng ngoài đáng ra phải xử lý hay map sang status, và giấu mất loại lỗi thật.",
        "- **Log rồi ném lại ở mọi tầng**: một lỗi bị in nhiều lần, log rối và khó đếm số lỗi thật.",
        "- **`e.printStackTrace()`**: in ra stderr, không qua logger nên không có level, traceId hay định dạng chung.",
        "- **Dùng exception để điều khiển luồng**: tạo exception tốn kém vì phải thu thập stack trace.",
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
      parts: [
        {
          id: "logging-stacktrace",
          title: "Log exception đúng cách và đọc stack trace",
          intro: [
            "Ta vừa thấy: bọc exception thì luôn truyền cause, để log còn dòng `Caused by`. Nhưng chuỗi cause đó chỉ ra tới log nếu bạn **log đúng cách**.",
            "Sự cố hay gặp: 3 giờ sáng, log chỉ có một dòng `ERROR Settle failed orderId=42: settle failed`. Không có stack trace, không biết lỗi từ ngân hàng, từ database hay từ code mình. Nguyên nhân là câu log viết `ex.getMessage()`: chỉ chuỗi thông báo của exception ngoài cùng được in, toàn bộ stack trace và chuỗi `Caused by` bị bỏ.",
            "Quy tắc của SLF4J (thư viện log mà Spring Boot dùng, mặc định chạy trên Logback): **truyền chính exception làm đối số cuối cùng, không cần `{}` cho nó**. SLF4J thấy đối số cuối là một `Throwable` thì in nó kèm đầy đủ stack trace.",
          ],
          predict: {
            question: "`log.error(\"Settle failed orderId={}\", id, ex)`: chỉ có một `{}` nhưng truyền hai đối số. Chuyện gì xảy ra với `ex`?",
            options: [
              "Bị bỏ qua vì thiếu `{}`",
              "In toàn bộ stack trace và chuỗi `Caused by` ở dưới dòng log",
              "Chỉ in `ex.toString()` vào cuối dòng",
              "Lỗi biên dịch",
            ],
            answer: 1,
            explain: "Đối số cuối là `Throwable` và không có `{}` nào dành cho nó, nên SLF4J coi nó là exception của dòng log và in đủ stack trace.",
          },
          widgetTitle: "Cùng một lỗi, hai cách log",
          compare: [
            way(
              "Log ex.getMessage()",
              `catch (RuntimeException ex) {
  log.error("Settle failed orderId={}: {}", id, ex.getMessage());
}`,
              [
                ask("Lỗi gốc là IOException từ ngân hàng, bọc hai lớp", bad("Đã chạy: chỉ in `ERROR Settle - Settle failed orderId=42: settle failed`. Không stack trace, không `Caused by`, không biết lỗi gốc là `read timeout`.")),
              ],
              "Mất hết thông tin để điều tra.",
            ),
            way(
              "Exception là đối số cuối",
              `catch (RuntimeException ex) {
  log.error("Settle failed orderId={}", id, ex);
}`,
              [
                ask("Cùng lỗi đó", ok("Đã chạy: in dòng log, rồi `java.lang.RuntimeException: settle failed`, rồi `Caused by: java.lang.IllegalStateException: charge failed id=42`, rồi `Caused by: java.io.IOException: read timeout` kèm dòng `at com.shop.Settle.callBank(Settle.java:9)`.")),
              ],
              "Đủ chuỗi nguyên nhân, đi thẳng tới dòng code gây lỗi.",
            ),
          ],
          after: [
            "**Đọc stack trace** từ kết quả trên:",
            "- **Khối đầu tiên** là exception ngoài cùng (`settle failed`), lớp bọc sau cùng.",
            "- **`Caused by` sâu nhất** (cuối cùng) là **nguyên nhân gốc**: `IOException: read timeout`. Bắt đầu điều tra từ đây.",
            "- Trong khối đó, đọc từ trên xuống tới **dòng đầu tiên thuộc package của bạn** (`com.shop...`): đó là dòng code của bạn liên quan tới lỗi.",
            "- **`... 2 common frames omitted`** (Logback) hay **`... 2 more`** (`printStackTrace` của JDK, đã chạy) **không phải bị cắt mất**: đó là các frame trùng với khối ngay phía trên, Java không in lặp lại.",
            "**Chọn level log**, mỗi level một mục đích:",
            "- **ERROR**: lỗi không lường trước, cần người xử lý (5xx), luôn kèm stack trace.",
            "- **WARN**: bất thường nhưng hệ thống tự xử lý được (retry thành công, 4xx do client gửi sai), thường không cần stack trace.",
            "- **INFO**: sự kiện nghiệp vụ quan trọng (đơn đã thanh toán, ứng dụng đã khởi động).",
            "- **DEBUG**: chi tiết để dò lỗi, mặc định tắt ở production. Đã chạy: `log.debug(...)` khi level là INFO không in gì. Viết `{}` thay vì cộng chuỗi để khi DEBUG tắt thì chuỗi không bị ghép; nhưng đối số vẫn được tính, nên đừng truyền lời gọi nặng như `toJson(order)`.",
          ],
          takeaway: {
            lines: [
              "Exception là đối số cuối, không `{}`: `log.error(\"... id={}\", id, ex)`. Đừng log `ex.getMessage()`.",
              "Nguyên nhân gốc là `Caused by` sâu nhất; `... N more` là frame trùng, không phải bị cắt.",
            ],
          },
          trap: {
            title: "Log `ex.getMessage()` hoặc `\"\" + ex`",
            text: "Cả hai chỉ còn một dòng chữ, mất stack trace và chuỗi `Caused by`. Truyền chính `ex` làm đối số cuối của `log.error`.",
          },
          quiz: {
            question: "Stack trace có ba khối: `RuntimeException: settle failed`, `Caused by: IllegalStateException: charge failed`, `Caused by: IOException: read timeout`. Nguyên nhân gốc là gì?",
            options: [
              "RuntimeException: settle failed, vì nó in đầu tiên",
              "IllegalStateException: charge failed",
              "IOException: read timeout, vì là `Caused by` sâu nhất",
              "Không biết được nếu không có `... N more`",
            ],
            answer: 2,
            explain: "Mỗi lớp bọc thêm một khối phía trên. Khối cuối cùng là exception đầu tiên được ném ra, tức nguyên nhân gốc.",
          },
        },
        {
          id: "exception-cost",
          senior: true,
          title: "Tạo exception tốn ở đâu, và OmitStackTraceInFastThrow",
          intro: [
            "Ta đã nghe lời khuyên \"đừng dùng exception để điều khiển luồng\" vì nó tốn. Tốn ở chỗ nào, và vì sao đôi khi log lại có NPE mà **không có stack trace**?",
            "Chi phí nằm ở **lúc tạo** exception, không phải lúc `throw`. Constructor của `Throwable` gọi `fillInStackTrace()`: đi ngược toàn bộ call stack và ghi lại từng frame. Stack càng sâu (Spring, filter, proxy chồng nhau) thì càng đắt.",
            "Với exception nghiệp vụ ném rất thường xuyên mà không ai đọc stack trace, có thể tắt việc thu thập bằng constructor bốn tham số: `super(message, null, false, false)`. Tham số cuối là `writableStackTrace = false`.",
            "Chuyện thứ hai: JVM có cờ `-XX:+OmitStackTraceInFastThrow`, **bật mặc định**. Khi một exception ngầm (NPE, ArrayIndexOutOfBounds, ArithmeticException, ClassCast) bị ném rất nhiều lần ở cùng một chỗ và code đã được JIT biên dịch (JIT = JVM dịch method chạy nhiều thành mã máy, xem bài JVM), JVM thay bằng một exception dựng sẵn **không có stack trace**.",
          ],
          widgetTitle: "Đo chi phí tạo exception và xem NPE mất stack trace",
          compare: [
            way(
              "Exception mặc định",
              `class BizEx extends RuntimeException {
          BizEx(String m) { super(m); }
        }
        // tạo 200.000 object ở độ sâu 100 frame, không ném`,
              [
                ask("Tạo 200.000 object `BizEx` ở độ sâu 100 frame, không ném", bad("Đã chạy: mỗi object phải thu thập cả stack, mất khoảng 650 đến 840 ms (3 lần đo, tuỳ máy).")),
                ask("NPE ở một chỗ code nóng, lặp lại hàng nghìn lần", bad("Đã chạy: ban đầu NPE có stack trace; tới lần thứ 6222 của lần chạy đó thì `getStackTrace().length == 0`. Log chỉ còn `java.lang.NullPointerException` trơ trọi. Chạy lại với `-XX:-OmitStackTraceInFastThrow` thì không bao giờ rỗng.")),
              ],
              "Tạo đắt, và NPE lặp lại có thể mất dấu vết lúc chạy lâu.",
            ),
            way(
              "Tắt stack trace cho exception tần suất cao",
              `class BizEx extends RuntimeException {
          BizEx(String m) { super(m, null, false, false); }
        }`,
              [
                ask("Cùng phép đo: 200.000 object, độ sâu 100 frame", ok("Đã chạy: khoảng 115 ms, nhanh gấp khoảng 6 lần (3 lần đo, tuỳ máy).")),
                ask("`getStackTrace().length`", ok("Đã chạy: bằng 0. Đổi lại log không còn dòng `at ...`, nên chỉ dùng cho exception nghiệp vụ mà `message` và `errorCode` đã đủ để biết chuyện gì xảy ra.")),
              ],
              "Rẻ hơn nhiều, nhưng chấp nhận mất stack trace.",
            ),
          ],
          after: [
            "Cách xử lý khi gặp NPE không stack trace trên production: tìm các lần xuất hiện **sớm hơn** của cùng lỗi trong log (lúc đó stack trace còn đủ), hoặc khởi động với `-XX:-OmitStackTraceInFastThrow` khi cần điều tra.",
            "Không phải lúc nào cũng cần tối ưu. Exception hiếm thì chi phí này không đáng kể; chỉ để ý khi exception nằm trong vòng lặp nóng hoặc ném hàng nghìn lần mỗi giây.",
          ],
          takeaway: {
            lines: [
              "Exception đắt ở `fillInStackTrace()` lúc tạo, không phải lúc ném.",
              "NPE lặp lại ở code nóng có thể mất stack trace vì `-XX:+OmitStackTraceInFastThrow` (mặc định bật).",
            ],
          },
          quiz: {
            question: "Log production có `java.lang.NullPointerException` không kèm dòng `at ...` nào, dù trước đó cùng lỗi từng có stack trace. Nguyên nhân nhiều khả năng nhất?",
            options: [
              "Logback cắt bớt stack trace",
              "JVM đã thay bằng exception dựng sẵn không có stack trace vì lỗi này bị ném lặp lại ở code nóng",
              "NPE luôn không có stack trace",
              "Exception bị nuốt trước khi log",
            ],
            answer: 1,
            explain: "`-XX:+OmitStackTraceInFastThrow` bật mặc định. Xem log sớm hơn, hoặc chạy lại với `-XX:-OmitStackTraceInFastThrow`.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Exception chia thành Error, là lỗi nghiêm trọng của JVM mà em không catch, và Exception. Checked là Exception trừ nhánh RuntimeException, compiler bắt buộc catch hoặc throws, dành cho lỗi bên ngoài phục hồi được như IO. Trong dự án Spring em dùng unchecked cho nghiệp vụ, vì checked làm code rườm rà, không dùng được trong lambda, và @Transactional mặc định chỉ rollback với unchecked: ném checked thì transaction vẫn commit. Em có BusinessException gốc mang mã lỗi, service chỉ ném, còn @RestControllerAdvice map sang HTTP status và log một lần kèm traceId. Khi bọc lỗi kỹ thuật em luôn truyền cause. Em không return trong finally vì nó nuốt exception, và dùng try-with-resources để lỗi lúc close thành suppressed thay vì đè mất lỗi gốc.",
};
