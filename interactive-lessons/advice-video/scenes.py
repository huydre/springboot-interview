"""Exception Handling, Validation & AOP explainer: scene layouts and per-beat narration + motion.

Outputs from Spring Boot 3.5 (Hibernate Validator 8) on JDK 21, study note 04.05:
GET /orders/0 -> 404 application/problem+json {"title":"Order not found","status":404,"detail":"Order 0 not found","instance":"/orders/0"};
invalid body with advice -> 400 "Validation failed" + errors list; without advice -> default 400 without field names, 500 for an unhandled custom exception;
@Valid @RequestBody -> MethodArgumentNotValidException 400, @RequestParam @Min(0) -> HandlerMethodValidationException 400 "Validation failure",
service @Validated find(@NotBlank email) -> ConstraintViolationException "find.email: must not be blank" (500 without a handler);
TimingAspect: "TIMING ReportService.build() took 62 ms" from outside, no line for buildAll() calling build() (self-invocation);
@Async: [task-1] sendMail MDC=null from another bean, [main] MDC=abc-123 when called internally, void exception only seen by AsyncUncaughtExceptionHandler,
TaskDecorator keeps MDC=abc-123; default applicationTaskExecutor core 8, queue 2147483647, thread prefix task-; String return type -> IllegalArgumentException.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("placeOrder gọi sendMail @Async: chạy ở thread nào?"), "h1 center r"),
        console("hk-con", 300, 420, 1320, ["gọi từ bean khác   → [task-1] sendMail MDC=null", "gọi nội bộ placeOrder → [main] sendMail MDC=abc-123", "→ self-invocation: @Async chạy đồng bộ"]),
        tile("hk-tile", 330, 350, 220, "shield"),
        el("hk-word", 600, 380, 1300, None, letters("Advice & AOP"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "ProblemDetail · Bean Validation · AOP proxy · @Async", "kin-sub r"),
    ]), beats=[
        ("Một hàm đặt hàng gọi nội bộ hàm gửi mail có Async. Hàm gửi mail chạy ở thread nào?",
         "placeOrder gọi nội bộ sendMail có @Async. sendMail chạy ở thread nào?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Thread main, chạy đồng bộ, vì gọi nội bộ không đi qua proxy. Gọi từ bean khác thì chạy ở một thread của pool, nhưng mất M D C.",
         "Thread main, đồng bộ: gọi nội bộ không qua proxy. Gọi từ bean khác: task-1 nhưng MDC = null.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.6, 0.3), IN("#hk-con-2", "type1", 3.0, 0.3), IN("#hk-con-3", "type1", 5.2, 0.3)]),
        ("Hôm nay ta học xử lý exception, validation, và lập trình hướng khía cạnh.", "Hôm nay: Exception Handling, Validation & AOP.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ advice
    dict(id="advice", world=(1920, 1080), hud=hud("ad", "Exception với ProblemDetail", "Gom về một chỗ"), cam="".join([
        big_title("ad", "ProblemDetail", "RFC 9457 · application/problem+json"),
        console("ad-404", 160, 190, 1600, ["GET /orders/0 → 404 application/problem+json", "{\"title\":\"Order not found\",\"status\":404,\"detail\":\"Order 0 not found\",\"instance\":\"/orders/0\"}"]),
        box("ad-w1", 160, 450, 760, 100, "<b>Không có advice, body sai</b><br>400 mặc định: không nói field nào sai", "red", "card"),
        box("ad-w2", 1000, 450, 760, 100, "<b>Có advice</b><br>400 \"Validation failed\" + danh sách errors", "green", "card"),
        box("ad-w3", 160, 570, 1600, 76, "<b>exception nghiệp vụ không có handler → 500 Internal Server Error</b>", "red", "card"),
        chip("ad-c1", 160, 680, "@RestControllerAdvice gom mọi @ExceptionHandler · instance được Spring điền sẵn", "violet"),
        chip("ad-c2", 160, 750, "Thêm @ExceptionHandler(Exception.class) làm lưới cuối: log kèm traceId, trả thông điệp chung", "green"),
        chip("ad-c3", 160, 820, "Đừng trả e.getMessage() của SQLException ra client: lộ tên bảng, câu SQL", "red"),
        chip("ad-c4", 160, 885, "Kế thừa ResponseEntityExceptionHandler: đừng khai báo trùng handler MethodArgumentNotValidException", "amber"),
    ]), beats=[
        ("Phần một: xử lý exception. Không xử lý tập trung thì mỗi controller tự bắt lỗi, mỗi api trả lỗi một kiểu. Rest controller advice gom về một chỗ.",
         "Phần 1: không xử lý tập trung thì mỗi API trả lỗi một kiểu. @RestControllerAdvice gom về một chỗ.",
         [TYPE("#ad-big", 0.1, 0.06), IN("#ad-bsub", "blur", 0.8), OUT("#ad-big, #ad-bsub", "zoom", 4.4), IN("#ad-hud", "left", 5.0), IN("#ad-c1", "left", 6.0)]),
        ("Problem Detail theo chuẩn chín bốn năm bảy có type, title, status, detail, instance. Đã chạy: lấy đơn số không trả bốn không bốn, dạng Problem JSON, instance tự điền.",
         "ProblemDetail (RFC 9457): type, title, status, detail, instance. GET /orders/0 → 404 problem+json.",
         [IN("#ad-404", "up", 4.0, 0.4), IN("#ad-404-1", "type1", 4.4, 0.3), IN("#ad-404-2", "type1", 6.4, 0.3)]),
        ("Thử bỏ advice: body sai ra bốn trăm mặc định mà không nói field nào sai. Có advice thì có danh sách errors. Exception nghiệp vụ không có handler thì thành năm trăm.",
         "Bỏ advice: body sai ra 400 không nói field nào; exception nghiệp vụ thành 500. Có advice: có danh sách errors.",
         [IN("#ad-w1", "pop", 0.4), IN("#ad-w2", "pop", 4.6), IN("#ad-w3", "left", 8.4)]),
        ("Thêm một handler exception làm lưới cuối: log đầy đủ kèm trace id, trả client thông điệp chung. Đừng trả message của S Q L exception, vì lộ tên bảng và câu SQL.",
         "Thêm handler Exception làm lưới cuối, log kèm traceId. Đừng trả message của SQLException ra client.",
         [IN("#ad-c2", "left", 0.4), IN("#ad-c3", "left", 5.8)]),
        ("Nếu kế thừa Response Entity Exception Handler thì đừng khai báo trùng handler cho Method Argument Not Valid.",
         "Kế thừa ResponseEntityExceptionHandler: đừng khai báo trùng handler.", [IN("#ad-c4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ validation
    dict(id="validation", world=(1920, 1080), hud=hud("vl", "Validation", "Exception nào, status nào"), cam="".join([
        box("vl-a", 160, 190, 1600, 76, "<b>@Valid @RequestBody → MethodArgumentNotValidException → 400</b>", "green", "card"),
        box("vl-b", 160, 280, 1600, 76, "<b>@RequestParam @Min(0) → HandlerMethodValidationException → 400 \"Validation failure\"</b>", "green", "card"),
        box("vl-c", 160, 370, 1600, 76, "<b>service @Validated → ConstraintViolationException → 500 nếu thiếu handler</b>", "red", "card"),
        box("vl-code", 160, 480, 1000, 160, code("public interface OnUpdate {}\npublic record UpdateOrderRequest(\n    @NotNull(groups = OnUpdate.class) Long id,\n    @NotBlank String customer) {}"), "cyan", "code"),
        console("vl-con", 1230, 490, 530, ["PUT /orders/5", "{\"customer\":\"An\"}", "→ 400 id: must not be null"]),
        chip("vl-g", 160, 680, "@Validated({OnUpdate.class, Default.class}): quên Default thì ràng buộc không group bị bỏ qua", "amber"),
        chip("vl-p", 160, 760, "Custom constraint @VnPhone: validator trả true khi null, để @NotNull lo việc bắt buộc", "violet"),
        chip("vl-n", 160, 840, "Quên @Valid trước @RequestBody: annotation trên DTO không có tác dụng · @NotBlank chặn cả \"\" lẫn \"  \"", "red"),
    ]), beats=[
        ("Phần hai: validation. Valid trên Request Body ném Method Argument Not Valid exception, ra bốn trăm. Min không trên Request Param ném Handler Method Validation Exception, cũng bốn trăm.",
         "Phần 2: @Valid @RequestBody → MethodArgumentNotValidException 400. @RequestParam @Min(0) → HandlerMethodValidationException 400.",
         [IN("#vl-hud", "left", 0.1), IN("#vl-a", "left", 0.8), IN("#vl-b", "left", 5.0)]),
        ("Service có Validated, truyền vào chuỗi rỗng thì ném Constraint Violation Exception. Đây không phải exception web, nên không có handler thì thành năm trăm.",
         "Service @Validated: ConstraintViolationException không phải exception web: thiếu handler thì thành 500.",
         [IN("#vl-c", "left", 0.4)]),
        ("Validation groups: cùng một D T O, khi sửa thì id bắt buộc. Put thiếu id ra bốn trăm. Nhưng khi chỉ định group thì các ràng buộc không group bị bỏ qua, trừ khi ghi cả Default.",
         "Validation groups: sửa thì id bắt buộc. Chỉ định group thì ràng buộc không group bị bỏ qua, trừ khi ghi cả Default.",
         [IN("#vl-code", "up", 0.4), IN("#vl-con", "right", 2.4, 0.4), IN("#vl-con-1", "type1", 2.8, 0.3), IN("#vl-con-2", "type1", 3.6, 0.3), IN("#vl-con-3", "type1", 4.4, 0.3), IN("#vl-g", "left", 7.4)]),
        ("Custom constraint: validator trả true khi giá trị null, để Not Null lo việc bắt buộc. Quên valid trước Request Body thì annotation trên D T O không có tác dụng.",
         "Custom constraint: validator trả true khi null. Quên @Valid thì annotation trên DTO không có tác dụng.",
         [IN("#vl-p", "left", 0.4), IN("#vl-n", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ AOP
    dict(id="aop", world=(1920, 1080), hud=hud("ap", "Spring AOP", "Tách cross-cutting concern"), cam="".join([
        card4("ap-c", 160, 190, 360, 170, 30, [("box", "Aspect", "module chứa logic chung"), ("split", "Advice", "@Before, @Around, ..."), ("hash", "Pointcut", "chọn method"), ("shield", "Proxy", "bọc target")]),
        box("ap-code", 160, 400, 1300, 170, code("@Aspect @Component\npublic class TimingAspect {\n    @Around(\"@annotation(com.shop.Timed)\")\n    public Object time(ProceedingJoinPoint pjp) { ... pjp.proceed() ... }\n}"), "cyan", "code"),
        console("ap-con", 160, 610, 1000, ["TIMING ReportService.build() took 62 ms", "bean trong context: ReportService$$SpringCGLIB$$0"]),
        chip("ap-n1", 160, 780, "Proxy tạo lúc runtime ở BPP after · Boot mặc định dùng CGLIB · AspectJ thì weave bytecode", "violet"),
        chip("ap-n2", 160, 860, "@Around quên return pjp.proceed(): method thật không chạy · bắt exception rồi không ném lại: nuốt lỗi", "red"),
    ]), beats=[
        ("Phần ba: lập trình hướng khía cạnh trong Spring. Cơ chế này tách những việc lặp lại như log, transaction, security, cache, đo thời gian ra khỏi code nghiệp vụ.",
         "Phần 3: AOP tách việc lặp lại (log, transaction, cache, đo thời gian) ra khỏi code nghiệp vụ.",
         [IN("#ap-hud", "left", 0.1), IN("#ap-c0", "pop", 3.4), IN("#ap-c1", "pop", 4.4), IN("#ap-c2", "pop", 5.4), IN("#ap-c3", "pop", 6.4)]),
        ("Aspect là module chứa logic chung. Advice là đoạn code và thời điểm chạy. Pointcut chọn method. Proxy bọc ngoài object gốc.",
         "Aspect: module logic chung · Advice: code + thời điểm · Pointcut: chọn method · Proxy: bọc object gốc.",
         [PULSE("#ap-c0", 0.4), PULSE("#ap-c1", 2.8), PULSE("#ap-c2", 5.2), PULSE("#ap-c3", 7.2)]),
        ("Ví dụ aspect đo thời gian với Around. Đã chạy: build mất sáu mươi hai mili giây, và bean trong context là một proxy.",
         "Aspect đo thời gian bằng @Around: build() mất 62 ms; bean trong context là proxy CGLIB.",
         [IN("#ap-code", "up", 0.4), IN("#ap-con", "up", 4.6, 0.4), IN("#ap-con-1", "type1", 5.0, 0.3), IN("#ap-con-2", "type1", 6.4, 0.3)]),
        ("Spring tạo proxy lúc runtime, mặc định dùng CGLIB. Aspect J thì sửa bytecode. Quên Proceed thì method thật không chạy, bắt exception mà không ném lại là nuốt lỗi.",
         "Spring AOP: proxy lúc runtime (CGLIB). Quên proceed: method thật không chạy.",
         [IN("#ap-n1", "left", 0.4), IN("#ap-n2", "left", 5.8)]),
    ]),
    # ------------------------------------------------------------ self-invocation
    dict(id="selfcall", world=(1920, 1080), hud=hud("sf", "Giới hạn của proxy", "Self-invocation"), cam="".join([
        box("sf-r1", 160, 190, 1600, 76, "<b>reportService.build() từ bean khác → có dòng TIMING (62 ms)</b>", "green", "card"),
        box("sf-r2", 160, 280, 1600, 76, "<b>buildAll() bên trong gọi this.build() → KHÔNG có dòng TIMING</b>", "red", "card"),
        chip("sf-c1", 160, 400, "Proxy chỉ chặn lời gọi đi từ bên ngoài, qua proxy", "violet"),
        chip("sf-n1", 160, 480, "method private · method final, class final", "red"), chip("sf-n2", 860, 480, "object tự new, không phải bean", "red"),
        chip("sf-n3", 160, 560, "gọi trong @PostConstruct của chính bean (proxy chưa được tạo)", "red"),
        el("sf-all", 160, 650, 1600, None, "@Transactional, @Async, @Cacheable, @Retryable, @PreAuthorize, method validation đều chạy bằng proxy: chung các điểm yếu này", "note left r"),
        chip("sf-f1", 160, 740, "Sửa tốt nhất: tách method sang bean khác", "green"),
        chip("sf-f2", 160, 820, "Hoặc inject chính mình bằng @Lazy / ObjectProvider, hoặc AspectJ weaving", "amber"),
    ]), beats=[
        ("Phần bốn: giới hạn của proxy. Gọi build từ bean khác thì có dòng Timing. Nhưng build all bên trong gọi this build thì không có dòng nào.",
         "Phần 4: gọi build() từ bean khác có dòng TIMING; buildAll() gọi this.build() thì không có dòng nào.",
         [IN("#sf-hud", "left", 0.1), IN("#sf-r1", "left", 0.8), IN("#sf-r2", "left", 5.0)]),
        ("Proxy chỉ chặn được lời gọi đi từ bên ngoài qua proxy. Method private, final, object tự new, và lời gọi trong Post Construct cũng không được chặn.",
         "Proxy chỉ chặn lời gọi từ bên ngoài. Không chặn: private, final, tự new, @PostConstruct.",
         [IN("#sf-c1", "left", 0.4), IN("#sf-n1", "left", 3.6), IN("#sf-n2", "left", 5.4), IN("#sf-n3", "left", 7.2)]),
        ("Transactional, Async, Cacheable, Retryable, Pre Authorize và method validation đều chạy bằng proxy, nên chung các điểm yếu này.",
         "@Transactional, @Async, @Cacheable, @PreAuthorize đều chạy bằng proxy: chung điểm yếu.", [IN("#sf-all", "up", 0.4)]),
        ("Cách sửa tốt nhất là tách method sang một bean khác. Hoặc inject chính mình, hoặc dùng Aspect J, nhưng ít khi đáng.",
         "Sửa tốt nhất: tách method sang bean khác. Hoặc inject chính mình, hoặc AspectJ.", [IN("#sf-f1", "left", 0.4), IN("#sf-f2", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ Async
    dict(id="async", world=(1920, 1080), hud=hud("as", "@Async", "Chạy trên thread khác qua proxy"), cam="".join([
        console("as-con", 160, 190, 1600, ["sendMail() từ bean khác           → [task-1] MDC=null", "placeOrder() gọi nội bộ sendMail() → [main] MDC=abc-123", "boom() (void, ném exception)       → caller không biết gì",
                                          "sendMail() + TaskDecorator copy MDC → [task-1] MDC=abc-123", "@Async String compute()           → IllegalArgumentException"]),
        box("as-ex", 160, 560, 1600, 80, "<b>Executor mặc định: ThreadPoolTaskExecutor core 8 · queue 2147483647 · thread \"task-\"</b>", "amber", "card"),
        chip("as-c1", 160, 670, "Queue gần như không giới hạn: task xếp hàng vô tận, pool không vượt 8 thread", "red"),
        chip("as-c2", 160, 740, "Tự cấu hình: core, max, queue, tên thread, TaskDecorator, CallerRunsPolicy", "green"),
        chip("as-c3", 160, 810, "Exception của method void: AsyncUncaughtExceptionHandler · trả CompletableFuture thì nằm trong future", "violet"),
        chip("as-c4", 160, 880, "Gửi mail sau khi lưu order: @TransactionalEventListener(AFTER_COMMIT)", "cyan"),
    ]), beats=[
        ("Phần năm: Async chạy method trên thread khác, cũng qua proxy. Gọi từ bean khác thì chạy ở thread Task một, nhưng mất M D C.",
         "Phần 5: @Async chạy trên thread khác qua proxy. Gọi từ bean khác: task-1, mất MDC.",
         [IN("#as-hud", "left", 0.1), IN("#as-con", "up", 0.6, 0.4), IN("#as-con-1", "type1", 1.0, 0.3)]),
        ("Gọi nội bộ thì chạy đồng bộ trên thread main. Method void ném exception thì caller không biết gì, chỉ Async uncaught exception handler thấy.",
         "Gọi nội bộ: chạy đồng bộ trên main. Method void ném exception: caller không biết, chỉ AsyncUncaughtExceptionHandler thấy.",
         [IN("#as-con-2", "type1", 0.4, 0.3), IN("#as-con-3", "type1", 3.4, 0.3), IN("#as-c3", "left", 6.4)]),
        ("Task Decorator sửa được việc mất context: copy M D C sang thread mới trước khi chạy. Trả về kiểu String thì ném lỗi ngay, chỉ hỗ trợ void và Future.",
         "TaskDecorator copy MDC sang thread mới. Trả về String: lỗi ngay, chỉ hỗ trợ void và Future.",
         [IN("#as-con-4", "type1", 0.4, 0.3), IN("#as-con-5", "type1", 4.8, 0.3)]),
        ("Executor mặc định của Boot là Thread Pool Task Executor, core tám, queue gần như vô hạn, nên pool không bao giờ vượt tám thread.",
         "Executor mặc định: core 8, queue ~vô hạn: pool không bao giờ vượt 8 thread.",
         [IN("#as-ex", "left", 0.4), IN("#as-c1", "left", 4.6)]),
        ("Production nên tự cấu hình: số thread, queue giới hạn, tên thread, decorator. Gửi mail sau khi lưu order thì dùng After Commit Listener.",
         "Production tự cấu hình executor. Gửi mail sau khi lưu order: AFTER_COMMIT.",
         [IN("#as-c2", "left", 0.4), IN("#as-c4", "left", 5.6)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("shield", "ProblemDetail", "một Advice, lưới cuối cho 500"),
                                                ("grid", "Validation", "ConstraintViolation cần handler"),
                                                ("split", "Proxy", "self-invocation, private, final"),
                                                ("share", "@Async", "executor riêng, TaskDecorator")]),
        chip("ou-next", 660, 650, "Phần tiếp theo: Transaction & JPA", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: gom lỗi về một advice dạng Problem Detail. Validation từ service cần handler riêng. Proxy không chặn được gọi nội bộ, method private hay final. Và Async nên có executor riêng với Task Decorator.",
         "Một Advice dạng ProblemDetail · ConstraintViolation cần handler · proxy không chặn self-invocation · @Async cần executor riêng.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.6), IN("#ou-c2", "pop", 7.0), IN("#ou-c3", "pop", 10.4)]),
        ("Phần tiếp theo: giao dịch và truy cập dữ liệu.", "Phần tiếp theo: Transaction & JPA.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
