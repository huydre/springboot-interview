import timeline from "../timelines/advice-aop.json";
import type { Lesson, Scene } from "../types";

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
        "Không có advice: body sai ra 400 mặc định không nói field nào sai; bật `spring.mvc.problemdetails.enabled` thì có ProblemDetail nhưng chỉ \"Invalid request content.\"; exception nghiệp vụ không có handler ra **500**. Thêm `@ExceptionHandler(Exception.class)` làm lưới cuối, log đầy đủ kèm traceId, trả client thông điệp chung. Kế thừa `ResponseEntityExceptionHandler` thì đừng khai báo trùng handler cho `MethodArgumentNotValidException`.",
      ],
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
        "`@Valid` (Jakarta) validate object và nested object; `@Validated` (Spring) thêm validation groups và bật method validation trên class. Đã đo: `@Valid @RequestBody` ném `MethodArgumentNotValidException` (400); `@RequestParam @Min(0)` ném `HandlerMethodValidationException` (400, không cần `@Validated` từ Spring 6.1); service `@Validated find(@NotBlank email)` ném `ConstraintViolationException: find.email: must not be blank`, không có handler thì thành **500**.",
        "Groups: `@Validated({OnUpdate.class, Default.class})`, quên `Default.class` thì các ràng buộc không group bị bỏ qua. Custom constraint `@VnPhone` cần `message`, `groups`, `payload`; validator trả true khi null để `@NotNull` lo việc bắt buộc. Quên `@Valid` trước `@RequestBody` thì annotation trên DTO không có tác dụng; `@NotBlank` mới chặn được cả `\"\"` và `\"  \"`.",
      ],
      widget: "validation-errors",
      widgetTitle: "Validate ở đâu, client nhận gì",
      quiz: {
        question: "Validate ở controller rồi, có cần validate ở service và DB không?",
        options: ["Không", "Có: controller chặn định dạng, service kiểm tra quy tắc nghiệp vụ, DB constraint là lớp cuối vì service còn được gọi từ Kafka consumer, job", "Chỉ cần DB", "Chỉ cần service"],
        answer: 1,
        explain: "Nhiều lớp bảo vệ.",
      },
    },
    {
      id: "aop",
      title: "Phần 3: Spring AOP và aspect đo thời gian",
      scene: "aop",
      intro: [
        "AOP tách cross-cutting concern (log, transaction, security, cache, đo thời gian). **Aspect** là module, **advice** là code và thời điểm (`@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around`), **pointcut** chọn method (`@annotation(com.shop.Timed)`), **proxy** bọc **target**. Spring AOP tạo proxy lúc runtime ở BPP after; Boot mặc định dùng CGLIB. AspectJ thì weave vào bytecode, chặn được cả self-call, private, constructor.",
        "Aspect `@Around(\"@annotation(Timed)\")` đo trong `finally`: đã chạy ra `TIMING ReportService.build() took 62 ms`, bean trong context là `ReportService$$SpringCGLIB$$0`. Quên `return pjp.proceed()` thì method thật không chạy; bắt exception mà không ném lại là nuốt lỗi và `@Transactional` bên ngoài không rollback.",
      ],
      quiz: {
        question: "Khi nào cần AspectJ thay Spring AOP?",
        options: ["Luôn luôn", "Khi cần chặn self-call, method private, constructor hay truy cập field; thực tế hiếm, tách bean là đủ", "Khi dùng Boot 3", "Khi có @Transactional"],
        answer: 1,
        explain: "AspectJ cần cấu hình build phức tạp hơn.",
      },
    },
    {
      id: "proxy-limits",
      title: "Phần 4: Giới hạn của proxy",
      scene: "selfcall",
      intro: [
        "Proxy chỉ chặn lời gọi đi từ bên ngoài qua proxy. Đã đo: `reportService.build()` từ bean khác có dòng TIMING; `buildAll()` bên trong gọi `build()` thì không có dòng nào. Proxy cũng không chặn được method `private`, `final`, object tự `new`, và lời gọi trong `@PostConstruct`.",
        "`@Transactional`, `@Async`, `@Cacheable`, `@Retryable`, `@PreAuthorize`, method validation đều chung các điểm yếu này. Sửa: tách method sang bean khác (tốt nhất), inject chính mình qua `@Lazy`/`ObjectProvider`, hoặc AspectJ.",
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
        "`@Async` (cần `@EnableAsync`) chạy method trên thread khác qua proxy. Đã đo với caller đặt `MDC traceId=abc-123`: gọi từ bean khác ra `[task-1] ... MDC=null` (mất context); gọi nội bộ ra `[main]` (chạy đồng bộ); method `void` ném exception thì caller không biết, chỉ `AsyncUncaughtExceptionHandler` thấy; có `TaskDecorator` copy MDC thì `[task-1] ... MDC=abc-123`. Method `@Async` trả `String` ném `IllegalArgumentException: Invalid return type for async method`.",
        "Executor mặc định của Boot 3.5: `ThreadPoolTaskExecutor` core 8, queue 2147483647, nên không bao giờ vượt 8 thread và task xếp hàng vô tận. Production tự cấu hình core, max, queue, tên thread, `TaskDecorator`, `CallerRunsPolicy`. Gửi mail sau khi lưu order: `@TransactionalEventListener(phase = AFTER_COMMIT)` vì thread mới không có transaction của caller.",
      ],
      widget: "async-trace",
      widgetTitle: "Lời gọi @Async và output thật",
      quiz: {
        question: "@Async method trả gì để caller lấy được kết quả?",
        options: ["String", "CompletableFuture<T> (hoặc Future<T>), hoặc void nếu không cần kết quả", "Optional<T>", "Object"],
        answer: 1,
        explain: "Spring 6.2 ném lỗi ngay với kiểu trả về khác.",
      },
    },
  ],
  modelAnswer:
    "Em gom xử lý lỗi vào một @RestControllerAdvice trả ProblemDetail: exception nghiệp vụ map ra đúng status, MethodArgumentNotValidException trả danh sách field sai, và có một handler Exception làm lưới cuối trả thông điệp chung kèm traceId. Em đã thử bỏ advice thì lỗi validate không nói field nào sai và exception nghiệp vụ thành 500. Validation em đặt @Valid trên request body, dùng groups khi tạo và sửa khác nhau, viết custom constraint khi cần; ConstraintViolationException từ service cần handler riêng nếu không sẽ ra 500. AOP em dùng cho việc lặp lại như đo thời gian, và nhớ Spring AOP chạy bằng proxy nên self-invocation, method private hay final, object tự new và @PostConstruct đều không được chặn; điều này đúng cho cả @Transactional, @Cacheable và @Async. Với @Async em tự cấu hình executor có queue giới hạn, dùng TaskDecorator để mang MDC sang thread mới, và AsyncUncaughtExceptionHandler cho method void.",
};
