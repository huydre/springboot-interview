import timeline from "../timelines/advice-aop.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every JSON body, exception message and thread name from Spring Boot 3.5 (Hibernate Validator 8) on JDK 21; see study note 04.05.
//
export const adviceAop: Lesson = {
  slug: "advice-aop",
  crumb: "Exception Handling, Validation & AOP",
  videoDir: "/videos/advice-validation-aop",
  // Per-scene clips cut by `video-kit/pipeline.py advice-video publish`, which also rewrites videoVersion.
  videoVersion: "ef4958d6",
  scenes: timeline as Scene[],
  title: "Exception Handling, Validation & AOP",
  subtitle:
    "@RestControllerAdvice với ProblemDetail, Bean Validation và validation groups, custom constraint, Spring AOP và aspect đo thời gian, giới hạn của proxy, và @Async.",
  openingQuiz: {
    question: "placeOrder() gọi nội bộ sendMail() có @Async. sendMail chạy trên thread nào?",
    options: ["task-1 của executor", "main: self-invocation không qua proxy nên chạy đồng bộ", "Virtual thread", "ForkJoinPool"],
    answer: 1,
    explain: "Đã đo: [main] sendMail to self@x. Gọi từ bean khác thì [task-1] nhưng MDC=null.",
  },
  roadmap: [
    "Chặng 1: xử lý exception tập trung với ProblemDetail.",
    "Chặng 2: validation, groups và custom constraint.",
    "Chặng 3: Spring AOP, giới hạn của proxy, @Async.",
  ],
  sections: [
    {
      id: "problem-detail",
      title: "Phần 1: Xử lý exception tập trung với ProblemDetail",
      scene: "advice",
      intro: [
        "`@RestControllerAdvice` gom mọi `@ExceptionHandler` về một chỗ. `ProblemDetail` (RFC 9457) có `type`, `title`, `status`, `detail`, `instance` (Spring tự điền path), content type `application/problem+json`. Đã chạy: `GET /orders/0` ra 404 `{\"title\":\"Order not found\",\"detail\":\"Order 0 not found\",\"instance\":\"/orders/0\"}`.",
        "Một handler trông như sau: `@ExceptionHandler(OrderNotFoundException.class) ProblemDetail notFound(OrderNotFoundException e)` tạo `ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage())`, rồi `setTitle(\"Order not found\")` và trả về.",
        "Thêm `@ExceptionHandler(Exception.class)` làm lưới cuối: log đầy đủ kèm traceId ở server, trả client một thông điệp chung.",
      ],
      after: [
        "Không có `@RestControllerAdvice` thì sao? Đã thử với `POST /orders` có body vi phạm `@Valid` (ví dụ `customer` rỗng): Boot mặc định trả 400 nhưng **không nói field nào sai**; bật `spring.mvc.problemdetails.enabled` thì có ProblemDetail nhưng chỉ \"Invalid request content.\"; exception nghiệp vụ không có handler thì ra **500**. Vì vậy API cho frontend vẫn phải có advice.",
      ],
      takeaway: {
        lines: ["Exception nghiệp vụ: map ra đúng status trong một `@RestControllerAdvice`. Lỗi không lường trước: log đầy đủ kèm traceId ở server, client chỉ nhận thông điệp chung."],
      },
      trap: {
        title: "Trùng handler khi kế thừa ResponseEntityExceptionHandler",
        text: "`ResponseEntityExceptionHandler` đã có sẵn handler cho các exception của Spring MVC, trong đó có `MethodArgumentNotValidException`. Khai báo thêm `@ExceptionHandler(MethodArgumentNotValidException.class)` trong cùng class là hai handler cho một exception: Spring không biết chọn cái nào và báo lỗi `Ambiguous @ExceptionHandler method` khi khởi động. Muốn tuỳ biến thì override method `handleMethodArgumentNotValid`.",
      },
      quiz: {
        question: "Vì sao không trả ex.getMessage() của SQLException ra client?",
        options: ["Vì quá dài", "Lộ thông tin nội bộ như tên bảng, câu SQL: log ở server kèm traceId, trả thông điệp chung", "Vì Jackson không serialize được", "Vì Spring cấm"],
        answer: 1,
        explain: "Lỗi không lường trước nên có thông điệp chung.",
      },
    },
    {
      id: "validation",
      title: "Phần 2: Validation",
      scene: "validation",
      intro: [
        "Phần 1 lo việc trả lỗi cho đẹp. Loại lỗi hay gặp nhất là dữ liệu client gửi lên sai, và đó là việc của validation.",
        "`@Valid` (Jakarta) validate object và nested object; `@Validated` (Spring) thêm validation groups và bật **method validation** trên class, tức là kiểm tra ràng buộc đặt thẳng trên tham số của method (`find(@NotBlank String email)`), không chỉ trên field của DTO.",
        "Ba chỗ validate, ba exception khác nhau (đã đo):",
        "- **`@Valid @RequestBody`** ở controller: ném `MethodArgumentNotValidException`, ra 400.",
        "- **`@RequestParam @Min(0)`** ở controller: ném `HandlerMethodValidationException`, ra 400, không cần `@Validated` từ Spring 6.1.",
        "- **Service `@Validated`** với `find(@NotBlank email)`: ném `ConstraintViolationException: find.email: must not be blank`, không có handler thì thành **500**.",
        "Hai chi tiết hay bị hỏi thêm:",
        "- **Quên `@Valid`** trước `@RequestBody`: annotation trên DTO không có tác dụng.",
        "- **`@NotBlank`**: mới chặn được cả `\"\"` và `\"  \"`.",
      ],
      widget: "validation-errors",
      widgetTitle: "Validate ở đâu, client nhận gì",
      after: [
        "Vì sao còn phải validate ở service và DB? Service có thể được gọi từ nơi không đi qua controller, ví dụ Kafka consumer hay job chạy nền, nên `@Valid` ở controller chưa chặn được các đường đó. DB constraint (`NOT NULL`, `UNIQUE`) là lớp cuối cùng.",
      ],
      takeaway: {
        lines: ["Lỗi validate ở controller tự thành 400. Lỗi validate ở service là `ConstraintViolationException`: không có handler riêng thì client nhận **500**."],
      },
      quiz: {
        question: "Validate ở controller rồi, có cần validate ở service và DB không?",
        options: ["Không", "Có: controller chặn định dạng, service kiểm tra quy tắc nghiệp vụ, DB constraint là lớp cuối vì service còn được gọi từ Kafka consumer, job", "Chỉ cần DB", "Chỉ cần service"],
        answer: 1,
        explain: "Nhiều lớp bảo vệ.",
      },
      parts: [
        {
          id: "validation-groups",
          title: "Validation groups và custom constraint",
          intro: [
            "Groups giải quyết tình huống: cùng một DTO, khi tạo thì `id` phải trống, khi sửa thì `id` bắt buộc. Đánh `@NotNull(groups = OnUpdate.class) Long id`, rồi ở endpoint PUT ghi `@Validated({OnUpdate.class, Default.class})`. Đã đo: `PUT /orders/5` với body `{\"customer\":\"An\"}` trả 400 `id: must not be null`. Quên `Default.class` thì các ràng buộc không có group (như `@NotBlank customer`) bị bỏ qua.",
            "**Custom constraint** như `@VnPhone` (kiểm tra số điện thoại Việt Nam) cần ba thuộc tính chuẩn `message`, `groups`, `payload`; validator nên trả `true` khi giá trị là null để `@NotNull` lo việc bắt buộc.",
          ],
          quiz: {
            question: "Endpoint PUT dùng `@Validated(OnUpdate.class)` mà không có `Default.class`. Ràng buộc `@NotBlank customer` (không group) có chạy không?",
            options: ["Có, luôn chạy", "Không: chỉ ràng buộc thuộc group OnUpdate được kiểm tra", "Chỉ khi customer null", "Lỗi lúc start"],
            answer: 1,
            explain: "Ràng buộc không ghi group thuộc group Default; chỉ định group khác mà bỏ Default thì chúng bị bỏ qua.",
          },
        },
        {
          id: "notnull-notempty-notblank",
          title: "@NotNull, @NotEmpty, @NotBlank khác nhau thế nào",
          intro: [
            "Phần trên đã nhắc `@NotBlank` chặn được `\"  \"`. Câu phỏng vấn hay gặp là đặt ba annotation cạnh nhau: `@NotNull`, `@NotEmpty`, `@NotBlank` khác nhau thế nào?",
            "Tình huống: request tạo đơn có field `customer`. Client gửi `\"customer\": \"   \"` (ba dấu cách). Chọn sai annotation thì đơn được lưu với tên khách là chuỗi trắng, và báo cáo cuối tháng có một khách hàng không tên.",
            "Mỗi annotation chặn thêm một mức so với cái trước:",
            "- **`@NotNull`**: chỉ chặn `null`. Chuỗi rỗng `\"\"` vẫn qua.",
            "- **`@NotEmpty`**: chặn `null` và độ dài 0. Dùng được cho `String`, `Collection`, `Map` và mảng.",
            "- **`@NotBlank`**: chặn `null` và chuỗi chỉ có khoảng trắng (bỏ khoảng trắng hai đầu rồi độ dài phải lớn hơn 0). **Chỉ dùng cho chuỗi** (`CharSequence`).",
            "Đã chạy với Hibernate Validator 8.0.3 (`Validator.validate`) trên một record có ba field `@NotNull String`, `@NotEmpty String`, `@NotBlank String` cùng nhận một giá trị. Ràng buộc bị vi phạm:",
            "- **`null`**: cả ba fail (`must not be null`, `must not be empty`, `must not be blank`).",
            "- **`\"\"`**: `@NotEmpty` và `@NotBlank` fail, `@NotNull` qua.",
            "- **`\"   \"`**: chỉ `@NotBlank` fail.",
            "- **`\"a\"`**: cả ba qua.",
            "Với collection (`List<String>`), cũng đã chạy:",
            "- **`null`**: `@NotNull` và `@NotEmpty` fail.",
            "- **`List.of()`**: chỉ `@NotEmpty` fail (`must not be empty`), `@NotNull` qua.",
            "- **`List.of(\"\")`**: cả hai qua, vì list có một phần tử. Muốn kiểm tra từng phần tử thì đặt ràng buộc lên kiểu phần tử: `List<@NotBlank String>` báo `items[0].<list element>: must not be blank`.",
            "- **`@NotBlank` trên `List`**: không phải lỗi validate mà là lỗi cấu hình: `UnexpectedTypeException: HV000030: No validator could be found for constraint 'jakarta.validation.constraints.NotBlank' validating type 'java.util.List<java.lang.String>'`.",
          ],
          predict: {
            question: "Field `@NotEmpty String customer`, client gửi `\"   \"` (ba dấu cách). Kết quả?",
            options: ["Bị chặn: must not be empty", "Qua validate: chuỗi dài 3 nên không rỗng", "Bị chặn: must not be blank", "Lỗi cấu hình"],
            answer: 1,
            explain: "`@NotEmpty` chỉ xem độ dài. Ba dấu cách có độ dài 3 nên qua. Chỉ `@NotBlank` mới bỏ khoảng trắng trước khi kiểm tra.",
          },
          widgetTitle: "Cùng field customer, đổi annotation",
          compare: [
            way(
              "@NotEmpty",
              `record CreateOrder(
    @NotEmpty String customer,
    @NotEmpty List<String> items) {}`,
              [
                ask("Gửi `\"customer\": \"\"`", ok("Bị chặn: `must not be empty`.")),
                ask("Gửi `\"customer\": \"   \"`", bad("Qua validate: đơn được lưu với tên khách là ba dấu cách.")),
                ask("Gửi `\"items\": []`", ok("Bị chặn: `must not be empty`.")),
              ],
              "Hợp với collection và Map; với chuỗi thì để lọt chuỗi toàn khoảng trắng.",
            ),
            way(
              "@NotBlank",
              `record CreateOrder(
    @NotBlank String customer,
    @NotBlank List<String> items) {}`,
              [
                ask("Gửi `\"customer\": \"\"`", ok("Bị chặn: `must not be blank`.")),
                ask("Gửi `\"customer\": \"   \"`", ok("Bị chặn: `must not be blank`.")),
                ask("Gửi `\"items\": []`", bad("Không phải lỗi dữ liệu mà là lỗi cấu hình: validator ném `UnexpectedTypeException` (HV000030) vì `@NotBlank` không có validator cho `List`.")),
              ],
              "Lựa chọn đúng cho chuỗi bắt buộc; đặt lên collection là sai cấu hình.",
            ),
          ],
          after: [
            "Ba ràng buộc hay đi kèm đều **coi `null` là hợp lệ**. Đã chạy: object có `@Size`, `@Email`, `@Min` mà cả ba field đều `null` thì không vi phạm gì. Field bắt buộc phải ghép thêm `@NotNull` hoặc `@NotBlank`.",
            "- **`@Size(min = 2, max = 5)`**: độ dài chuỗi hoặc số phần tử collection. `\"a\"` fail với `size must be between 2 and 5`; `\"   \"` qua vì `@Size` đếm cả khoảng trắng.",
            "- **`@Min(1)`**: cho số. `0` fail với `must be greater than or equal to 1`; `null` qua.",
            "- **`@Email`**: `\"abc\"` fail với `must be a well-formed email address`, nhưng `\"\"` qua và `\"a@b\"` cũng qua (không bắt buộc dấu chấm trong tên miền). Cần chặt hơn thì thêm `regexp`: `@Email(regexp = \".+@.+\\\\..+\")` chặn được `\"a@b\"`.",
          ],
          takeaway: {
            lines: [
              "`@NotNull` chặn null; `@NotEmpty` chặn thêm độ dài 0 (chuỗi, collection, Map); `@NotBlank` chặn thêm chuỗi toàn khoảng trắng và chỉ dùng cho chuỗi.",
              "`@Size`, `@Min`, `@Email` bỏ qua `null`: field bắt buộc phải ghép với `@NotNull` hoặc `@NotBlank`.",
            ],
          },
          trap: {
            title: "@NotBlank trên List chỉ nổ khi validate",
            text: "Code vẫn compile. Lỗi `UnexpectedTypeException` (HV000030) chỉ xuất hiện khi validator chạy trên field đó (đã chạy: build thành công, exception ném ra ở `validate`), và đó là lỗi cấu hình chứ không phải lỗi dữ liệu nên không nên trông chờ nó thành 400 như các lỗi validate khác. Với collection dùng `@NotEmpty`, còn kiểm tra từng phần tử thì `List<@NotBlank String>`.",
          },
          quiz: {
            question: "Field `@Email String email` (không có annotation nào khác), client gửi `\"email\": \"\"`. Kết quả?",
            options: ["Bị chặn: must be a well-formed email address", "Qua validate", "Lỗi cấu hình", "Bị chặn: must not be blank"],
            answer: 1,
            explain: "Đã chạy: `@Email` cho qua cả `null` và chuỗi rỗng. Muốn bắt buộc có email thì ghép `@NotBlank @Email`.",
          },
        },
      ],
    },
    {
      id: "aop",
      title: "Phần 3: Spring AOP và aspect đo thời gian",
      scene: "aop",
      intro: [
        "Bài toán: muốn đo thời gian của 30 method service. Chép đoạn đo vào từng method thì code nghiệp vụ lẫn với code đo, và sửa cách đo là sửa 30 chỗ. Việc lặp lại ở nhiều nơi như vậy gọi là **cross-cutting concern**: log, transaction, security, cache, đo thời gian. AOP (lập trình hướng khía cạnh) tách nó ra một chỗ.",
        "Năm thuật ngữ, từng cái một:",
        "- **Join point**: một điểm trong lúc chương trình chạy có thể chèn code vào. Với Spring AOP, join point luôn là **một lời gọi method** trên bean.",
        "- **Pointcut**: biểu thức chọn ra những join point nào cần chặn. Hai kiểu hay dùng: theo annotation, `@annotation(com.shop.Timed)` (method có `@Timed`); và theo tên, `execution(* com.shop..*Service.*(..))`, đọc là: kiểu trả về bất kỳ, mọi class có tên kết thúc bằng `Service` trong `com.shop` và package con, mọi method, mọi tham số.",
        "- **Advice**: đoạn code chạy tại join point, kèm thời điểm chạy: `@Before` (trước), `@AfterReturning` (sau khi trả về bình thường), `@AfterThrowing` (sau khi ném exception), `@After` (sau, dù thế nào), `@Around` (bọc cả trước lẫn sau, tự quyết định có gọi method thật hay không).",
        "- **Aspect**: class gom pointcut và advice lại, đánh `@Aspect @Component`. Ví dụ `TimingAspect`.",
        "- **Target và proxy**: target là object gốc bị bọc (`ReportService`), còn **proxy** là object đứng ngoài nhận lời gọi, chạy advice rồi chuyển cho target.",
      ],
      widgetTitle: "Đo thời gian: chép tay hay dùng aspect",
      compare: [
        way(
          "Chép code đo vào từng method",
          `public void build() {
    long start = System.nanoTime();
    try {
        // ... nghiệp vụ ...
    } finally {
        log.info("build took {} ms",
            (System.nanoTime() - start) / 1_000_000);
    }
}
// lặp lại ở 29 method khác`,
          [
            ask("Thêm đo thời gian cho method mới", bad("Phải nhớ chép lại khối try/finally.")),
            ask("Đổi cách log (thêm traceId)", bad("Sửa ở mọi method đã chép.")),
          ],
          "Code đo lẫn vào nghiệp vụ.",
        ),
        way(
          "Một aspect @Around",
          `@Aspect @Component
public class TimingAspect {
    @Around("@annotation(com.shop.Timed)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();   // gọi method thật
        } finally {
            log.info("{} took {} ms",
                pjp.getSignature().toShortString(),
                (System.nanoTime() - start) / 1_000_000);
        }
    }
}
// method nghiệp vụ chỉ cần thêm @Timed`,
          [
            ask("Gọi reportService.build() từ bean khác", ok("Đã chạy: `TIMING ReportService.build() took 62 ms`, bean trong context là `ReportService$$SpringCGLIB$$0`.")),
            ask("Đổi cách log", ok("Sửa đúng một chỗ trong aspect.")),
          ],
          "Nghiệp vụ sạch, việc đo nằm một chỗ.",
        ),
      ],
      after: [
        "`ProceedingJoinPoint` (thường đặt tên `pjp`) là tham số Spring đưa vào advice `@Around`: nó đại diện cho lời gọi đang bị chặn. `pjp.proceed()` chạy method thật, `pjp.getSignature()` cho biết method nào. Đo trong `finally` để vẫn ghi được thời gian khi method ném exception.",
      ],
      trap: {
        title: "Quên proceed hoặc nuốt exception",
        text: "Quên `return pjp.proceed()` thì method thật không chạy, caller nhận `null`. Bắt exception trong `@Around` mà không ném lại là nuốt lỗi, và `@Transactional` bên ngoài sẽ không rollback.",
      },
      quiz: {
        question: "Trong Spring AOP, join point là gì?",
        options: [
          "Một class có @Aspect",
          "Một lời gọi method trên bean, chỗ có thể chèn advice vào",
          "Biểu thức execution(...) chọn method",
          "Proxy CGLIB",
        ],
        answer: 1,
        explain: "Pointcut là biểu thức chọn join point, advice là code chạy tại đó, aspect là class gom cả hai.",
      },
      parts: [
        {
          id: "aop-proxy",
          senior: true,
          title: "Aspect chạy được nhờ proxy",
          intro: [
            "Spring AOP tạo proxy lúc runtime, ở bước BPP after trong vòng đời bean (bài Bean Lifecycle): `AnnotationAwareAspectJAutoProxyCreator` thấy bean có method khớp pointcut, liền thay bean bằng proxy. Boot mặc định dùng {{cglib|CGLIB}}: sinh một **class con** của `ReportService` và override các method để chèn advice.",
            "Vì proxy là class con, nó chỉ chặn được method mà class con override được. Method `private` và `final` không override được, nên lời gọi chạy thẳng code gốc, không có advice. Lời gọi `this.build()` bên trong chính class cũng không qua proxy (Phần 4).",
            "**AspectJ** làm khác: sửa thẳng bytecode của class lúc compile hoặc lúc load (gọi là weaving), nên chặn được cả self-call, method private, constructor và truy cập field. Đổi lại phải cấu hình build phức tạp hơn.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Proxy CGLIB là class con → chỉ chặn được method override được → method `private`, `final` và lời gọi qua `this` chạy thẳng code gốc, không có advice."],
          },
          quiz: {
            question: "Khi nào cần AspectJ thay Spring AOP?",
            options: ["Luôn luôn", "Khi cần chặn self-call, method private, constructor hay truy cập field; thực tế hiếm, tách bean là đủ", "Khi dùng Boot 3", "Khi có @Transactional"],
            answer: 1,
            explain: "AspectJ cần cấu hình build phức tạp hơn.",
          },
        },
        {
          id: "aop-order",
          senior: true,
          title: "Nhiều aspect trên một method: @Order",
          intro: [
            "Một method có thể khớp nhiều aspect, ví dụ `TimingAspect` và một `AuditAspect`. Không khai báo gì thì thứ tự giữa chúng không được đảm bảo.",
            "Đặt `@Order(n)` lên class aspect: số **nhỏ hơn** là ưu tiên cao hơn, đứng **ngoài** hơn. Nó chạy phần \"trước\" sớm nhất và phần \"sau\" muộn nhất, giống các lớp vỏ hành bọc quanh method.",
            "Ví dụ: muốn thời gian đo được tính cả phần audit thì cho `TimingAspect` `@Order(1)`, `AuditAspect` `@Order(2)`. Lời gọi đi: Timing bắt đầu, Audit, method, Audit xong, Timing kết thúc.",
          ],
          quiz: {
            question: "TimingAspect có @Order(1), AuditAspect có @Order(2). Phần trước của aspect nào chạy trước?",
            options: ["AuditAspect, vì số lớn hơn", "TimingAspect, vì số nhỏ hơn là ưu tiên cao hơn và đứng ngoài", "Ngẫu nhiên", "Chạy song song"],
            answer: 1,
            explain: "Aspect ưu tiên cao bọc ngoài: vào trước, ra sau.",
          },
        },
        {
          id: "pointcut-designators",
          title: "Pointcut: within, @within, bean, args và ghép điều kiện",
          intro: [
            "Phần trước chọn method bằng `execution` hoặc `@annotation`. Nhưng \"áp aspect lên mọi class trong package service, trừ method đã đánh `@Audited`\" thì viết thế nào? Pointcut có thêm các bộ chọn khác, và ghép được bằng `&&`, `||`, `!`:",
            "- **`within(demo.service..*)`**: mọi method của class trong package đó và package con.",
            "- **`@within(demo.Marker)`**: method của class mang annotation `@Marker` (annotation ở **class**). Khác `@annotation(...)` là annotation ở **method**.",
            "- **`bean(order*)`**: theo **tên bean** (chỉ Spring AOP có), hỗ trợ ký tự `*`.",
            "- **`args(String)`**: method có tham số truyền vào là `String` lúc chạy.",
            "Muốn dùng lại thì đặt tên bằng một method rỗng gắn `@Pointcut(\"...\")`, rồi tham chiếu `@Before(\"inService() && !audited()\")`.",
          ],
          takeaway: {
            title: "Điều rút ra",
            lines: ["`within` chọn theo package, `@within` theo annotation trên class, `@annotation` theo annotation trên method, `bean` theo tên bean, `args` theo kiểu tham số. Ghép bằng `&&`, `||`, `!` và đặt tên bằng `@Pointcut` để dùng lại."],
          },
          quiz: {
            question: "Muốn aspect chạy trên mọi method của class đánh `@Marker` ở cấp class. Dùng bộ chọn nào?",
            options: ["`@annotation(Marker)`", "`@within(Marker)`", "`bean(Marker)`", "`args(Marker)`"],
            answer: 1,
            explain: "`@within` nhìn annotation ở class chứa method; `@annotation` nhìn annotation đặt trực tiếp trên method.",
          },
        },
        {
          id: "pointcut-four-aspects",
          title: "Bốn aspect chạy trên bốn lời gọi",
          intro: [
            "Giờ dùng bốn bộ chọn trên một ví dụ cụ thể. Đã chạy trên Spring Framework 6.2.19 với AspectJ weaver 1.9.25. Ba bean:",
            "- **`PayService`**: class có `@Marker`, trong package `demo.service`. Chỉ `refund(String)` đánh `@Audited`; `pay(String)` thì không.",
            "- **`OrderService`**: cùng package `demo.service`, có `find(long)`.",
            "- **Bean tên `orderRepo`**: thuộc class `PayRepo` (có `@Marker`, ở package `demo.repo`), có `load(String)`.",
            "Bốn aspect: A `within(demo.service..*) && !@annotation(Audited)`, B `@within(Marker)`, C `bean(order*)`, D `args(String)`. Với mỗi lời gọi bên dưới, aspect nào chạy?",
          ],
          predict: {
            question: "Bean tên `orderRepo` thuộc class `PayRepo` (có `@Marker`, ngoài package service) với method `load(String)`. Trong ba pointcut `@within(Marker)`, `bean(order*)`, `args(String)`, mấy cái khớp?",
            options: ["Chỉ `bean(order*)`", "Hai cái", "Cả ba", "Không cái nào, vì class không có tên Order"],
            answer: 2,
            explain: "Đã chạy: `PayRepo.load` được B, C và D chạy cùng lúc. `bean()` khớp theo tên bean chứ không theo tên class, `@within` theo annotation trên class, `args` theo kiểu tham số.",
          },
          widgetTitle: "Aspect nào chạy trên bốn lời gọi",
          compare: [
            way(
              "within + loại trừ bằng !@annotation",
              `@Pointcut("within(demo.service..*)") void inService() {}
@Pointcut("@annotation(demo.Audited)") void audited() {}

@Before("inService() && !audited()")
void a(JoinPoint j) { ... }`,
              [
                ask("`PayService.pay(String)`", ok("Chạy: trong package service và không có `@Audited`.")),
                ask("`PayService.refund(String)` có `@Audited`", ok("Không chạy: bị `!audited()` loại.")),
                ask("`PayRepo.load(String)` ở `demo.repo`", ok("Không chạy: nằm ngoài `demo.service..*`.")),
              ],
              "Chọn theo vị trí package, loại trừ bằng annotation trên method.",
            ),
            way(
              "@within, bean và args",
              `@Before("@within(demo.Marker)")  void b(JoinPoint j) { ... }
@Before("bean(order*)")           void c(JoinPoint j) { ... }
@Before("args(String)")           void d(JoinPoint j) { ... }`,
              [
                ask("`PayService.pay(String)`", ok("B và D chạy (class có `@Marker`, tham số `String`). C không chạy vì bean tên `payService`.")),
                ask("`OrderService.find(long)`", ok("Chỉ C chạy (bean `orderService`). Không có `@Marker`, tham số là `long` nên B và D không khớp.")),
                ask("`PayRepo.load(String)` qua bean `orderRepo`", ok("Cả B, C, D đều chạy.")),
              ],
              "Chọn theo annotation trên class, tên bean hoặc kiểu tham số.",
            ),
          ],
          after: [
            "Kết quả đã chạy cho mỗi lời gọi:",
            "- **`PayService.pay(\"p1\")`**: A, B, D.",
            "- **`PayService.refund(\"p2\")`** (có `@Audited`): B, D. A bị loại bởi `!@annotation(Audited)`.",
            "- **`OrderService.find(7)`**: A, C.",
            "- **`PayRepo.load(\"r1\")`** (bean `orderRepo`): B, C, D. A không khớp vì class nằm ngoài `demo.service`.",
          ],
          quiz: {
            question: "`OrderService.find(7)` (tham số kiểu `long`, class không có `@Marker`, bean tên `orderService`). Aspect nào chạy?",
            options: ["Chỉ A", "A và C", "B và D", "A, B, C, D"],
            answer: 1,
            explain: "A khớp (package service, không `@Audited`), C khớp (`orderService` bắt đầu bằng `order`). B cần `@Marker`, D cần tham số `String`.",
          },
        },
      ],
    },
    {
      id: "proxy-limits",
      senior: true,
      title: "Phần 4: Giới hạn của proxy",
      board: {
        title: "Proxy chỉ chặn lời gọi từ bên ngoài",
        highlight: "từ bên ngoài",
        chips: ["Đã đo: có dòng TIMING hay không", "Chung điểm yếu với @Transactional"],
        cards: [
          {
            title: "Qua proxy tới target",
            diagram: {
              kind: "pipe",
              from: "Bean khác gọi build()",
              via: "Proxy + TimingAspect",
              to: "ReportService (target)",
              skipped: ["Lời gọi bằng this", "Method private, final", "Object tự new"],
              skippedLabel: "Proxy không chặn được",
            },
            notes: ["Proxy chạy advice rồi mới chuyển lời gọi cho target."],
            takeaway: "Advice chỉ chạy khi lời gọi đi qua proxy",
          },
          {
            title: "Gọi nội bộ",
            diagram: {
              kind: "flow",
              steps: ["buildAll() trong ReportService", "Gọi build()"],
              ok: ["Gọi từ bean khác", "Có dòng TIMING"],
              bad: ["Gọi bên trong class", "Không có dòng nào"],
            },
            notes: ["Cách sửa: tách method sang bean khác (tốt nhất), gọi qua chính proxy được inject vào bean (`@Lazy`/`ObjectProvider`), hoặc dùng AspectJ."],
            takeaway: "Tách method sang bean khác là cách sửa tốt nhất",
          },
        ],
        conclusion: "**Kết luận:** `@Transactional`, `@Async`, `@Cacheable` đều dựa vào proxy nên cùng chịu giới hạn này.",
      },
      scene: "selfcall",
      intro: [
        "Proxy chỉ chặn lời gọi đi từ bên ngoài qua proxy. Đã đo: `reportService.build()` từ bean khác có dòng TIMING; `buildAll()` bên trong gọi `build()` thì không có dòng nào. Proxy cũng không chặn được:",
        "- **Method `private`, `final`**: class con không override được.",
        "- **Object tự `new`**: không phải bean, không có proxy.",
        "- **Lời gọi trong `@PostConstruct`**: proxy chưa được tạo.",
        "`@Transactional`, `@Async`, `@Cacheable`, `@Retryable`, `@PreAuthorize`, method validation đều chung các điểm yếu này. Cách sửa:",
        "- **Tách method sang bean khác**: tốt nhất.",
        "- **Inject chính mình** qua `@Lazy`/`ObjectProvider`: bean giữ một tham chiếu tới chính proxy của nó, rồi gọi method qua tham chiếu đó thay vì `this`, nên lời gọi đi qua proxy.",
        "- **AspectJ**.",
      ],
      widget: "proxy-reach",
      widgetTitle: "Advice có chạy không",
      quiz: {
        question: "Method validation trên service bị gọi nội bộ trong cùng class thì sao?",
        options: ["Vẫn validate", "Không validate vì không qua proxy", "Ném lỗi biên dịch", "Validate hai lần"],
        answer: 1,
        explain: "Cùng cơ chế proxy.",
      },
    },
    {
      id: "async",
      title: "Phần 5: @Async",
      scene: "async",
      intro: [
        "Phần 4 chỉ ra mọi annotation chạy bằng proxy đều chung giới hạn. `@Async` là một trong số đó, và còn thêm bẫy riêng vì nó đổi thread.",
        "`@Async` (cần `@EnableAsync`) chạy method trên thread khác qua proxy.",
        "Gửi mail xác nhận sau khi lưu order: đừng gọi `@Async sendMail()` ngay trong method `@Transactional`. Mail có thể đi trước khi transaction commit, và nếu sau đó transaction rollback thì khách nhận mail cho một đơn không tồn tại; thread gửi mail cũng có thể đọc DB khi đơn chưa commit nên không thấy. Dùng `@TransactionalEventListener(phase = AFTER_COMMIT)`: chỉ gửi khi đơn **đã commit thật**, và lúc đó thread khác đọc được dòng đã commit (xem bài TransactionTemplate & Transaction Events).",
        "Chọn từng kiểu gọi bên dưới để xem output thật.",
      ],
      predict: {
        question: "Caller đặt `MDC traceId=abc-123`, rồi gọi `@Async sendMail()` của một bean khác, executor mặc định. Bên trong `sendMail()`, MDC có traceId không?",
        options: [
          "Có, `abc-123`, vì Spring copy MDC sang thread mới",
          "Không, MDC là `null`: MDC gắn với ThreadLocal của thread gọi",
          "Có, vì `sendMail()` vẫn chạy trên thread gọi",
          "Lỗi khi khởi động",
        ],
        answer: 1,
        explain: "`sendMail()` chạy trên `task-1`, một thread khác, nên không thấy MDC của thread gọi. Cần `TaskDecorator` để chụp MDC và đặt lại trên thread pool.",
      },
      after: [
        "Đã đo với caller đặt `MDC traceId=abc-123`:",
        "- **Gọi từ bean khác**: `[task-1] ... MDC=null`, mất context.",
        "- **Gọi nội bộ**: `[main]`, chạy đồng bộ.",
        "- **Method `void` ném exception**: caller không biết, chỉ `AsyncUncaughtExceptionHandler` thấy.",
        "- **Có `TaskDecorator` copy MDC**: `[task-1] ... MDC=abc-123`.",
        "Method `@Async` chỉ được trả `void`, `Future<T>` hoặc `CompletableFuture<T>`: trả `String` ném `IllegalArgumentException: Invalid return type for async method`.",
        "Executor mặc định của Boot 3.5: `ThreadPoolTaskExecutor` core 8, queue 2147483647, nên không bao giờ vượt 8 thread và task xếp hàng vô tận. Production tự cấu hình core, max, queue, tên thread, `TaskDecorator` (copy MDC sang thread mới), `CallerRunsPolicy` (queue đầy thì thread gọi tự chạy task).",
      ],
      widget: "async-trace",
      widgetTitle: "Lời gọi @Async và output thật",
      quiz: {
        question: "@Async method trả gì để caller lấy được kết quả?",
        options: ["String", "CompletableFuture<T> (hoặc Future<T>), hoặc void nếu không cần kết quả", "Optional<T>", "Object"],
        answer: 1,
        explain: "Spring 6.2 ném lỗi ngay với kiểu trả về khác.",
      },
      parts: [
        {
          id: "scheduled",
          title: "@Scheduled: một thread mặc định",
          intro: [
            "`@Async` đưa việc sang thread khác; `@Scheduled` cũng chạy việc ngoài luồng request nhưng theo lịch, và cũng có bẫy về thread. `@Scheduled` (cần `@EnableScheduling`) chạy method theo lịch: `fixedRate` (cách nhau N ms tính từ lúc **bắt đầu** lần trước), `fixedDelay` (N ms tính từ lúc **kết thúc** lần trước), hoặc `cron`.",
            "Đã đo với hai job: `fast` chạy mỗi 200 ms, job `slow` ngủ 1000 ms. Với cấu hình mặc định, mọi job chạy trên **một thread** `scheduling-1`, nên trong 1 giây `slow` chạy, `fast` chạy **0 lần**; `slow` xong thì `fast` chạy dồn 5 lần để bù. Tăng `spring.task.scheduling.pool.size=4` thì `fast` chạy đều trên thread riêng.",
          ],
          trap: {
            title: "Chạy nhiều pod thì job chạy nhiều lần",
            text: "`@Scheduled` không biết gì về các instance khác. Scale lên 3 pod thì mỗi pod đều chạy job: khách nhận 3 email. Dùng ShedLock (giành một bản ghi lock trong DB trước khi chạy, `lockAtMostFor` để tự nhả khi pod chết), hoặc tách job ra worker một replica, và viết job {{idempotent|idempotent}}.",
          },
          quiz: {
            question: "Hai @Scheduled job, một job chậm 1 giây. Cấu hình mặc định thì job còn lại thế nào?",
            options: [
              "Chạy bình thường trên thread khác",
              "Bị chặn tới khi job chậm xong, vì scheduler mặc định chỉ có một thread",
              "Bị huỷ vĩnh viễn",
              "Chạy song song trên ForkJoinPool",
            ],
            answer: 1,
            explain: "Mặc định chỉ có scheduling-1. Tăng spring.task.scheduling.pool.size hoặc tự khai báo ThreadPoolTaskScheduler.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Em gom xử lý lỗi vào một @RestControllerAdvice trả ProblemDetail: exception nghiệp vụ map ra đúng status, MethodArgumentNotValidException trả danh sách field sai, và có một handler Exception làm lưới cuối trả thông điệp chung kèm traceId. Em đã thử bỏ advice thì lỗi validate không nói field nào sai và exception nghiệp vụ thành 500. Validation em đặt @Valid trên request body, dùng groups khi tạo và sửa khác nhau, viết custom constraint khi cần; ConstraintViolationException từ service cần handler riêng nếu không sẽ ra 500. AOP em dùng cho việc lặp lại như đo thời gian, và nhớ Spring AOP chạy bằng proxy nên self-invocation, method private hay final, object tự new và @PostConstruct đều không được chặn; điều này đúng cho cả @Transactional, @Cacheable và @Async. Với @Async em tự cấu hình executor có queue giới hạn, dùng TaskDecorator để mang MDC sang thread mới, và AsyncUncaughtExceptionHandler cho method void.",
};
