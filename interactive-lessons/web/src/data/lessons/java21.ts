import timeline from "../timelines/java21.json";
import type { Lesson, Scene } from "../types";

// Every Java output and compiler message quoted below was produced by JDK 21 (java / javac).
export const java21: Lesson = {
  slug: "java21",
  crumb: "Java 17 & 21",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/java-17-21",
  videoVersion: "6250f908",
  scenes: timeline as Scene[],
  title: "Java 17 & 21: record, sealed, pattern matching, virtual threads",
  subtitle:
    "Bản đồ các bản LTS, var và text block, record sinh ra gì và dùng ở đâu trong Spring, sealed đóng hệ phân cấp, switch expression, pattern matching cho switch, Sequenced Collections và virtual threads.",
  openingQuiz: {
    question: "sealed interface Shape permits Circle, Square, Rect. switch (shape) có case cho cả 3 loại, không có default. Thêm Triangle vào permits mà không sửa switch thì sao?",
    options: [
      "Chạy bình thường, Triangle trả về 0",
      "Lỗi biên dịch: the switch expression does not cover all possible input values",
      "Ném MatchException lúc chạy",
      "Compile được nhưng có warning",
    ],
    answer: 1,
    explain:
      "Shape là sealed nên compiler biết đủ các loại và kiểm tra switch đã phủ hết. Đã biên dịch thật với javac 21: báo đúng lỗi này. Nếu có default thì lại compile được và Triangle âm thầm rơi vào default.",
  },
  roadmap: [
    "Chặng 1: bản đồ phiên bản LTS, var, text block.",
    "Chặng 2: record sinh ra gì, compact constructor, dùng record ở đâu trong dự án Spring.",
    "Chặng 3: sealed, switch expression, pattern matching cho switch; Sequenced Collections và virtual threads.",
  ],
  sections: [
    {
      id: "versions",
      title: "Phần 1: Bản đồ phiên bản",
      scene: "lts",
      intro: [
        "LTS (Long-Term Support) là các bản được hỗ trợ dài hạn, và doanh nghiệp gần như chỉ dùng LTS: **8, 11, 17, 21, 25**. Spring Boot 3 yêu cầu tối thiểu Java 17.",
        "Giữa các bản LTS: `var` (10), switch expression (14), text block (15), record và pattern matching `instanceof` (16). Java 21 có virtual threads, pattern matching cho switch, record pattern và Sequenced Collections.",
      ],
      widget: "java-version",
      widgetTitle: "Tính năng này có từ bản nào?",
      quiz: {
        question: "Spring Boot 3 yêu cầu tối thiểu Java bản nào?",
        options: ["8", "11", "17", "21"],
        answer: 2,
        explain: "Spring Boot 3 (và Spring Framework 6) cần Java 17 trở lên, nên record, sealed, switch expression xuất hiện trong code hằng ngày.",
      },
    },
    {
      id: "var-textblock",
      title: "Phần 2: var và text block",
      scene: "var",
      intro: [
        "`var` để compiler tự suy kiểu từ vế phải, nhưng kiểu vẫn được xác định lúc compile: bytecode y hệt khi viết kiểu đầy đủ. Chỉ dùng cho biến local có khởi tạo ngay; không dùng cho field, tham số hay kiểu trả về. Nên dùng khi kiểu đã hiển nhiên từ vế phải.",
        "Text block (`\"\"\"...\"\"\"`) viết chuỗi nhiều dòng không cần `\\n` và `+`; phần thụt lề chung tự bị loại bỏ. Hợp cho JSON trong test, câu SQL dài.",
      ],
      widget: "var-check",
      widgetTitle: "Dòng nào compile được?",
      quiz: {
        question: "var n = 10; n = \"ten\"; thì sao?",
        options: ["Chạy được, n thành String", "Lỗi biên dịch: incompatible types: String cannot be converted to int", "Lỗi lúc chạy ClassCastException", "Warning"],
        answer: 1,
        explain: "var không làm Java thành kiểu động: n được suy là int ngay lúc compile. javac báo đúng câu này.",
      },
    },
    {
      id: "record",
      title: "Phần 3: record",
      scene: "record",
      intro: [
        "`public record Money(BigDecimal amount, String currency) {}`: compiler sinh field `private final`, constructor đủ tham số, accessor `amount()` và `currency()` (không có tiền tố `get`), cùng `equals`, `hashCode`, `toString` dựa trên mọi field.",
        "Validate trong compact constructor (không lặp lại tham số). Record là `final` và ngầm `extends java.lang.Record`, nên không kế thừa class khác; vẫn implement được interface, có method thường và static.",
      ],
      widget: "record-play",
      widgetTitle: "Thử record Money",
      quiz: {
        question: "Accessor của record Money(BigDecimal amount, String currency) là gì?",
        options: ["getAmount()", "amount()", "amount (field public)", "Không có, phải tự viết"],
        answer: 1,
        explain: "Accessor trùng tên component. Gọi m.getAmount() là lỗi biên dịch cannot find symbol.",
      },
    },
    {
      id: "record-spring",
      title: "Phần 4: Dùng record ở đâu trong dự án Spring",
      scene: "where",
      intro: [
        "Nên dùng: DTO request/response của REST API (Jackson hỗ trợ record từ 2.12), projection trong Spring Data JPA, `@ConfigurationProperties`, value object như `Money`, `Address`.",
        "Không dùng làm JPA entity: Hibernate cần constructor rỗng, field sửa được, và tạo proxy bằng cách kế thừa class, trong khi record là final với field final. Record thay được Lombok `@Data` cho class dữ liệu immutable; Lombok vẫn hữu ích cho `@Builder`, `@Slf4j`, `@RequiredArgsConstructor`.",
      ],
      quiz: {
        question: "Vì sao record không làm được JPA entity?",
        options: [
          "Vì record không có annotation",
          "Vì Hibernate cần constructor rỗng, field sửa được và proxy kế thừa class, mà record là final với field final",
          "Vì record không có equals",
          "Vì JPA chỉ hỗ trợ Java 8",
        ],
        answer: 1,
        explain: "Entity có vòng đời được Hibernate quản lý (tạo rỗng rồi set field, lazy proxy). Record là data carrier bất biến, hợp cho DTO và projection hơn.",
      },
    },
    {
      id: "sealed",
      title: "Phần 5: sealed",
      scene: "sealed",
      intro: [
        "`sealed interface Shape permits Circle, Square, Rect` liệt kê chính xác những class được kế thừa: hệ phân cấp bị đóng lại. Class không có trong `permits` mà cố implement là lỗi: `class is not allowed to extend sealed class: Shape (as it is not listed in its 'permits' clause)`.",
        "Class con phải là `final`, `sealed` hoặc `non-sealed`; record mặc định đã final. Use case: kết quả thanh toán `sealed interface PaymentResult permits Success, Failed, Pending`, trạng thái đơn hàng, các loại event.",
      ],
      quiz: {
        question: "Lợi ích lớn nhất của sealed khi kết hợp với switch là gì?",
        options: [
          "Chạy nhanh hơn",
          "Compiler biết đủ các loại con nên kiểm tra được switch đã phủ hết các case",
          "Không cần viết class con",
          "Cho phép đa kế thừa",
        ],
        answer: 1,
        explain: "Thêm một loại mới mà quên xử lý thì lỗi biên dịch ngay, thay vì lỗi lúc chạy.",
      },
    },
    {
      id: "switch",
      title: "Phần 6: switch hiện đại",
      scene: "switch",
      intro: [
        "Pattern matching cho `instanceof` (Java 16) kiểm tra và ép kiểu trong một bước, kèm điều kiện: `if (obj instanceof String s && s.length() > 3)` in `HELLO`.",
        "Switch expression (Java 14) trả về giá trị, dùng mũi tên `->` nên không fall-through, gộp nhiều nhãn bằng dấu phẩy, và dùng `yield` khi một case có nhiều lệnh: `hours(\"SAT\")` ra 0, `hours(\"MON\")` ra 8.",
      ],
      quiz: {
        question: "yield dùng khi nào?",
        options: [
          "Để thoát vòng lặp",
          "Để trả giá trị từ một case có nhiều lệnh trong switch expression",
          "Để nhường thread",
          "Thay cho return trong lambda",
        ],
        answer: 1,
        explain: "case \"X\" -> giá trị dùng cho một biểu thức; khi cần một khối nhiều lệnh thì trả giá trị bằng yield.",
      },
    },
    {
      id: "pattern-switch",
      title: "Phần 7: Pattern matching cho switch",
      scene: "pattern",
      intro: [
        "Java 21 cho phép `case Circle c ->`, record pattern `case Rect(double w, double h) ->` tách luôn field, và `when` thêm điều kiện. Kết quả đã chạy: `area(new Rect(2, 3))` = 6.0, `area(new Rect(2, 2))` = 4.0 (nhánh `when w == h`), `area(new Square(3))` = 9.0.",
        "Ba thứ phối hợp: sealed (biết đủ các loại) + record (dữ liệu rõ ràng) + pattern switch (xử lý từng loại, compiler kiểm tra thiếu sót). Đừng thêm `default` khi switch đã đủ case. Thử bật tắt hai nút bên dưới để thấy vì sao.",
      ],
      widget: "sealed-switch",
      widgetTitle: "Thêm Triangle, thêm default",
      quiz: {
        question: "Vì sao không nên thêm default vào switch trên sealed interface đã đủ case?",
        options: [
          "Vì default làm code chạy chậm",
          "Vì khi thêm loại mới, code vẫn compile và loại mới âm thầm rơi vào default",
          "Vì Java 21 cấm default",
          "Vì default gây NullPointerException",
        ],
        answer: 1,
        explain: "Đã chạy thử: có default thì Triangle compile được và area(new Triangle(4, 3)) ra 0.0, một lỗi logic lọt qua compiler.",
      },
    },
    {
      id: "modern",
      title: "Phần 8: Sequenced Collections và Virtual Threads",
      scene: "modern",
      intro: [
        "Sequenced Collections (Java 21): `List`, `Deque`, `LinkedHashSet` có chung `getFirst()`, `getLast()`, `addFirst()`, `addLast()`, `removeFirst()`, `removeLast()`, `reversed()`. Map thì qua `SequencedMap`: `LinkedHashMap` có `firstEntry()`, `lastEntry()`, `putFirst()`, `pollFirstEntry()`, `reversed()` (không có `getFirst()`). `List.of(1, 2, 3).getFirst()` là 1, `reversed()` ra `[3, 2, 1]`. Trước đó phải viết `list.get(list.size() - 1)`, còn `LinkedHashSet` thì phải duyệt hết iterator mới lấy được phần tử cuối.",
        "Virtual threads: thread nhẹ do JVM quản lý, tạo được hàng triệu cái, hợp cho tác vụ chờ I/O. Đã đo: 100.000 virtual thread, mỗi thread `sleep(1000)`, xong sau 1.6 giây. Spring Boot 3.2+ bật bằng `spring.threads.virtual.enabled=true`; chi tiết ở tuần 3.",
      ],
      quiz: {
        question: "Virtual threads hợp nhất với loại tác vụ nào?",
        options: ["Tính toán nặng CPU", "Tác vụ chờ I/O như gọi DB, gọi HTTP", "Vẽ giao diện", "Thay cho parallel stream"],
        answer: 1,
        explain: "Khi một virtual thread chờ I/O, JVM tháo nó khỏi carrier thread để chạy việc khác; với tác vụ CPU-bound thì không lợi gì thêm.",
      },
    },
  ],
  modelAnswer:
    "Dự án em chạy Java 17 hoặc 21 vì Spring Boot 3 yêu cầu tối thiểu 17. Em dùng record cho DTO và projection: một dòng khai báo thì compiler sinh field final, constructor, accessor, equals, hashCode và toString, có thể validate trong compact constructor; em không dùng record làm JPA entity vì Hibernate cần constructor rỗng, field sửa được và proxy. Em dùng text block cho JSON trong test và SQL dài, switch expression để tránh quên break. Với Java 21 em dùng pattern matching cho switch kết hợp sealed interface để xử lý các loại kết quả thanh toán; compiler kiểm tra giúp em đã xử lý đủ trường hợp, nên em không thêm default. Ngoài ra em biết virtual threads giúp xử lý nhiều request chờ I/O mà không cần chuyển sang reactive.",
};
