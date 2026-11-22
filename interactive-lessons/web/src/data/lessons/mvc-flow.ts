import timeline from "../timelines/mvc-flow.json";
import type { Lesson, Scene } from "../types";

// Execution order printed from real requests on Spring Boot 3.5 (embedded Tomcat 10.1), JDK 21; see study note 04.04.
//
export const mvcFlow: Lesson = {
  slug: "mvc-flow",
  crumb: "Spring MVC Request Flow",
  videoDir: "/videos/mvc-request-flow",
  // Per-scene clips cut by `video-kit/pipeline.py mvc-video publish`, which also rewrites videoVersion.
  videoVersion: "daf7ce5e",
  scenes: timeline as Scene[],
  title: "Spring MVC Request Flow",
  subtitle:
    "Một request đi qua Tomcat, Filter, DispatcherServlet, HandlerMapping, Interceptor, HandlerAdapter và Controller; các thành phần bên trong; Filter, Interceptor hay AOP; lấy dữ liệu từ request và trả 201.",
  openingQuiz: {
    question: "POST /orders với body sai, có @Valid @RequestBody và một @Around aspect bọc controller. Aspect có chạy không?",
    options: [
      "Có, aspect luôn chạy trước controller",
      "Không: validate xảy ra lúc HandlerAdapter chuẩn bị tham số, trước khi gọi method và trước proxy AOP",
      "Chạy sau khi controller trả lỗi",
      "Tuỳ thứ tự @Order",
    ],
    answer: 1,
    explain: "Đã in ra từ request thật: Filter và preHandle chạy, aspect và controller không chạy, @RestControllerAdvice trả 400.",
  },
  roadmap: [
    "Chặng 1: bức tranh tổng thể và thứ tự thực thi đo thực tế.",
    "Chặng 2: các thành phần bên trong DispatcherServlet, Filter với Interceptor với AOP.",
    "Chặng 3: @RestController, lấy dữ liệu từ request, ResponseEntity và 201.",
  ],
  sections: [
    {
      id: "flow",
      title: "Phần 1: Bức tranh tổng thể",
      scene: "flow",
      intro: [
        "Tomcat cấp một worker thread cho request, rồi request đi qua lần lượt:",
        "- **Filter chain** (Security, CORS, logging): chỉ thấy request thô.",
        "- **DispatcherServlet**: là Front Controller, tức là mọi request đều đi qua một điểm vào duy nhất này, nên việc chung chỉ cần viết một lần.",
        "- **HandlerMapping**: DispatcherServlet hỏi nó xem URL và method thuộc handler nào.",
        "- **Interceptor `preHandle`**: chạy ngay trước handler.",
        "- **HandlerAdapter**: đọc body, convert, validate và gọi controller.",
        "- **Ghi kết quả**: qua `HttpMessageConverter`, rồi `postHandle`, `afterCompletion`.",
        "Thí nghiệm: một Filter, một Interceptor và một aspect (code bọc quanh method controller, học ở bài AOP) cùng in log, rồi gửi 3 request. (1) `GET /orders/7`: đơn tồn tại. (2) `GET /orders/0`: controller ném `OrderNotFoundException`, và một `@RestControllerAdvice` (class gom các `@ExceptionHandler`) map nó sang 404. (3) `POST /orders` với body vi phạm `@Valid`.",
      ],
      predict: {
        question: "Request (2): controller ném `OrderNotFoundException`, `@RestControllerAdvice` map sang 404. Tham số `ex` mà Interceptor `afterCompletion` nhận được là gì?",
        options: [
          "`OrderNotFoundException`",
          "`null`, vì exception đã được `@ExceptionHandler` xử lý",
          "`afterCompletion` không chạy khi có exception",
          "Một `ServletException` bọc ngoài",
        ],
        answer: 1,
        explain: "Exception đã được xử lý xong trước khi tới `afterCompletion`, nên nó nhận `ex=null`. Muốn đếm lỗi thì dựa vào status của response.",
      },
      widget: "mvc-trace",
      widgetTitle: "Ba request, thứ tự thật",
      after: [
        "Kết quả đã in: request (1) đi đủ các bước. Request (2) thì `postHandle` bị bỏ qua, `@RestControllerAdvice` trả 404. Request (3) thì aspect và controller không chạy, vì validate xảy ra lúc HandlerAdapter chuẩn bị tham số, trước khi gọi method; `@RestControllerAdvice` trả 400. `afterCompletion` nhận `ex=null` khi exception đã được `@ExceptionHandler` xử lý, nên muốn đếm lỗi thì dựa vào status của response.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["`@Valid` chạy lúc HandlerAdapter chuẩn bị tham số → body sai thì dừng trước khi gọi method → controller và aspect quanh controller không chạy, Filter và `preHandle` vẫn chạy."],
      },
      quiz: {
        question: "Code dọn ThreadLocal sau mỗi request nên đặt ở đâu trong Interceptor?",
        options: ["preHandle", "postHandle", "afterCompletion, vì postHandle bị bỏ qua khi có exception", "Không đặt được"],
        answer: 2,
        explain: "afterCompletion luôn chạy.",
      },
    },
    {
      id: "components",
      title: "Phần 2: Các thành phần bên trong DispatcherServlet",
      scene: "components",
      intro: [
        "Phần 1 nhìn DispatcherServlet như một hộp. Mở hộp ra thì có bảy thành phần, mỗi cái một việc:",
        "- **`HandlerMapping`**: từ URL và HTTP method tìm ra controller method (`RequestMappingHandlerMapping` đọc `@GetMapping`).",
        "- **`HandlerAdapter`**: biết cách gọi method đó.",
        "- **`HandlerMethodArgumentResolver`**: tạo giá trị cho từng tham số (`@PathVariable`, `@RequestBody`, `Pageable`).",
        "- **`HttpMessageConverter`**: chuyển body thành object và ngược lại (Jackson cho JSON).",
        "- **`HandlerMethodReturnValueHandler`**: xử lý giá trị method trả về.",
        "- **`HandlerExceptionResolver`**: tìm `@ExceptionHandler` khi có exception.",
        "- **`ViewResolver`**: tìm template, chỉ dùng khi trả view.",
        "Converter đọc body theo `Content-Type`, ghi theo `Accept`: đo được response thường là `application/json`, `ProblemDetail` là `application/problem+json`. Triệu chứng hay gặp:",
        "- **415**: thiếu hoặc sai Content-Type.",
        "- **406**: Accept không khớp.",
        "- **400**: JSON hỏng, sai kiểu.",
        "- **405**: đúng URL sai method.",
      ],
      widget: "mvc-status",
      widgetTitle: "Lỗi trước khi tới controller",
      quiz: {
        question: "Ai chuyển JSON thành object OrderRequest?",
        options: ["DispatcherServlet", "RequestResponseBodyMethodProcessor chọn MappingJackson2HttpMessageConverter, bên trong dùng ObjectMapper", "Tomcat", "Controller"],
        answer: 1,
        explain: "Có @Valid thì validate luôn tại đây.",
      },
    },
    {
      id: "filter-interceptor-aop",
      title: "Phần 3: Filter, Interceptor hay AOP",
      scene: "layers",
      intro: [
        "Ba tầng đều chen được code vào quanh request, nhưng mỗi tầng thấy một thứ khác:",
        "- **Filter** (Servlet API): đứng trước DispatcherServlet, chạy cho mọi request kể cả 404 sai URL. Dùng cho security, CORS, gắn traceId vào MDC (Mapped Diagnostic Context: một map riêng cho từng thread, logger tự đọc từ đó để in traceId vào mọi dòng log).",
        "- **Interceptor** (Spring MVC): quanh handler và biết controller method nào. Dùng để đọc annotation trên handler, locale, đo theo endpoint.",
        "- **AOP**: bọc method của mọi bean. Dùng cho log nghiệp vụ, transaction, cache, retry.",
        "Chặn request ở mỗi tầng:",
        "- **Filter**: không gọi `chain.doFilter`.",
        "- **Interceptor**: `preHandle` trả `boolean`, trả `false` là dừng chuỗi và DispatcherServlet không gọi controller nữa (nhớ set status, ví dụ 403, trước khi trả).",
        "- **AOP**: không gọi `proceed()`.",
      ],
      trap: {
        title: "Bẫy của Filter",
        text: "Filter là `@Component` được tự đăng ký cho mọi URL, dùng `FilterRegistrationBean` để giới hạn. Một request có thể đi qua Filter nhiều lần khi server chuyển tiếp nội bộ (forward, include, async dispatch), nên kế thừa `OncePerRequestFilter` để chạy đúng một lần. Exception trong Filter không tới `@RestControllerAdvice`. Quên `MDC.remove` trong `finally` thì traceId dính sang request sau trên cùng thread, vì Tomcat tái sử dụng thread.",
      },
      widget: "filter-interceptor-aop",
      widgetTitle: "Chọn tầng cho từng việc",
      takeaway: {
        lines: ["Việc HTTP thô cho mọi request: **Filter**. Việc cần biết handler: **Interceptor**. Việc nghiệp vụ trên method của bean: **AOP**."],
      },
      quiz: {
        question: "Interceptor muốn chặn request không có quyền thì làm thế nào?",
        options: ["Ném exception trong postHandle", "Trong preHandle set status, ghi body nếu cần rồi return false", "Gọi chain.doFilter", "Không chặn được"],
        answer: 1,
        explain: "Kiểm tra quyền nên ưu tiên Spring Security.",
      },
    },
    {
      id: "request-data",
      title: "Phần 4: @RestController và lấy dữ liệu từ request",
      scene: "request",
      intro: [
        "`@RestController = @Controller + @ResponseBody`: giá trị trả về ghi thẳng vào body, không qua `ViewResolver`. Dùng `@Controller` cho API mà quên `@ResponseBody` thì chuỗi trả về bị coi là tên view.",
        "Mỗi phần của request có một annotation riêng:",
        "- **`@PathVariable`**: định danh (`/orders/{id}`).",
        "- **`@RequestParam`**: lọc, sort, phân trang. Mặc định `required = true`.",
        "- **`@RequestBody`**: JSON tạo hoặc sửa. Chỉ một lần mỗi method vì body là stream.",
        "- **`@RequestHeader`**: trace id.",
        "Field JSON sai tên (gửi `custmer` thay vì `customer`) thì Jackson **bỏ qua im lặng**, field trong object là `null`. Vì vậy hãy kèm `@NotNull`/`@NotBlank` cho field bắt buộc để lỗi thành 400 rõ ràng.",
        "Từ Spring 6.1 có **method validation** sẵn có: ràng buộc như `@Min(0)` đặt thẳng lên `@RequestParam` hay `@PathVariable` có hiệu lực mà không cần `@Validated` trên class. Đã đo: `?page=-1` với `@Min(0)` trả 400 \"Validation failure\".",
      ],
      quiz: {
        question: "@Min(0) trên @RequestParam có hiệu lực khi class không có @Validated không?",
        options: ["Không", "Có, nhờ built-in method validation từ Spring 6.1: ?page=-1 trả 400 \"Validation failure\"", "Chỉ với @PathVariable", "Chỉ khi có Hibernate"],
        answer: 1,
        explain: "Đã đo với problemdetails bật.",
      },
    },
    {
      id: "response",
      title: "Phần 5: ResponseEntity và 201 Created",
      scene: "created",
      intro: [
        "API tạo mới trả `ResponseEntity.created(location).body(body)`, `location` build từ request hiện tại bằng `ServletUriComponentsBuilder.fromCurrentRequest().path(\"/{id}\")`. Đã đo: `HTTP/1.1 201`, `Location: http://localhost:53961/orders/42`, body `{\"id\":42,\"customer\":\"An\"}`.",
        "Trả object trực tiếp thì mặc định 200. Các dạng thường dùng:",
        "- **`ok(body)`**: 200 kèm body.",
        "- **`created(uri)`**: 201 kèm Location.",
        "- **`noContent().build()`**: cho DELETE.",
        "- **`status(HttpStatus.ACCEPTED)`**: cho xử lý async.",
      ],
      quiz: {
        question: "@ResponseStatus(HttpStatus.CREATED) khác ResponseEntity.created(...) ở đâu?",
        options: ["Giống nhau", "@ResponseStatus chỉ đặt status cố định, không thêm được header động như Location", "@ResponseStatus nhanh hơn", "ResponseEntity không đặt được status"],
        answer: 1,
        explain: "ResponseEntity điều khiển status, header và body theo logic.",
      },
    },
  ],
  modelAnswer:
    "Request vào Tomcat được cấp một worker thread, đi qua filter chain như Spring Security và CORS, tới DispatcherServlet. DispatcherServlet hỏi HandlerMapping để tìm controller method theo URL và HTTP method, gọi preHandle của interceptor, rồi HandlerAdapter dùng argument resolver và HttpMessageConverter đọc body JSON, validate, và gọi controller. Kết quả được ghi ra JSON qua converter, rồi postHandle và afterCompletion. Có exception thì HandlerExceptionResolver chuyển cho @RestControllerAdvice, và postHandle bị bỏ qua. Em đã in thứ tự từ request thật: body sai thì controller và aspect quanh controller không chạy vì validate xảy ra lúc chuẩn bị tham số. Việc HTTP thô cho mọi request em đặt ở Filter, việc cần biết handler ở Interceptor, việc nghiệp vụ ở AOP. API tạo mới em trả 201 kèm Location.",
};
