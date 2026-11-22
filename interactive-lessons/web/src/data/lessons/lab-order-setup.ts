import timeline from "../timelines/lab-order-setup.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.04 (Spring Boot 3.5, PostgreSQL via docker compose, profile dev); responses and logs are real runs.
// Solution: labs/order-service/. Video not rendered yet: scenes stay empty until publish.
export const labOrderSetup: Lesson = {
  slug: "lab-order-setup",
  crumb: "Lab 4: order-service Setup",
  videoDir: "/videos/lab-order-setup",
  videoVersion: "5bb3581a",
  scenes: timeline as Scene[],
  title: "Lab 4: order-service Setup",
  subtitle:
    "Dựng project order-service dùng cho các lab sau: entity và DTO record, API tạo đơn trong một transaction, validation và ProblemDetail 400/404/422, profile và Actuator, aspect @Timed, đọc Condition Evaluation Report.",
  openingQuiz: {
    question: "Đặt 2 Keyboard và 5 Monitor (kho Monitor chỉ còn 1). Kho Keyboard sau request 422 là bao nhiêu (trước đó 8)?",
    options: ["6", "8: dòng Keyboard đã trừ trong bộ nhớ nhưng transaction rollback", "10", "0"],
    answer: 1,
    explain: "Đã đo trên PostgreSQL: vẫn 8.",
  },
  roadmap: [
    "Chặng 1: project, entity, API tạo đơn.",
    "Chặng 2: validation và ProblemDetail, profile và Actuator.",
    "Chặng 3: @Timed, Condition Evaluation Report, checklist.",
  ],
  sections: [
    {
      id: "project",
      title: "Phần 1: Project, entity và API tạo đơn",
      scene: "project",
      intro: [
        "JDK 21, Docker, Maven wrapper. start.spring.io hiện chỉ tạo Boot 4 nên tự viết `pom.xml` với parent **3.5.16**: web, validation, data-jpa, actuator, aop, postgresql, h2 cho test, testcontainers. Package theo **tính năng** (`common`, `customer`, `product`, `order`, `audit`, `notification`), không theo tầng.",
        "4 entity `Customer`, `Product`, `Order`, `OrderItem`, quan hệ LAZY và `mappedBy`. Id dùng `SEQUENCE` (DDL `create sequence orders_seq start with 1 increment by 50`), không dùng IDENTITY. Lý do: với IDENTITY, Hibernate phải chạy từng câu INSERT ngay lập tức để database trả id về, nên không gom được nhiều INSERT thành một batch, mà Lab 6 cần seed nhiều dữ liệu.",
        "Controller không trả entity, request và response là record. Dữ liệu ban đầu: Keyboard (giá 100.00, kho 10), Monitor (giá 50.00, kho 1). `POST /orders` đặt 2 Keyboard, chạy trong một transaction, trả `201` kèm `Location: /orders/1`, total 200.00, kho Keyboard từ 10 xuống 8.",
        "Thử rollback: đặt 2 Keyboard và 5 Monitor trong một đơn. Dòng Keyboard được trừ trước (trong bộ nhớ), tới Monitor thì thiếu hàng nên ném lỗi, trả **422** `INSUFFICIENT_STOCK`. Đã đo trên PostgreSQL: kho Keyboard **vẫn là 8**, vì cả transaction rollback, kể cả phần đã trừ.",
        "Project tắt **open-in-view** (`spring.jpa.open-in-view: false`). Bật thì Spring giữ session DB mở tới khi ghi xong JSON response, che mất lỗi lazy loading; tắt thì mọi dữ liệu cần dùng phải được load trong service.",
      ],
      widget: "order-api",
      widgetTitle: "Gửi request tới order-service",
      quiz: {
        question: "Trả thẳng entity Order ra JSON với open-in-view: false thì sao?",
        options: ["Chạy bình thường", "Jackson chạm vào association LAZY ngoài transaction: LazyInitializationException", "Trả {}", "Lỗi compile"],
        answer: 1,
        explain: "Ngoài ra còn lộ cấu trúc DB và vòng lặp quan hệ hai chiều.",
      },
    },
    {
      id: "errors",
      title: "Phần 2: Validation, ProblemDetail, profile và Actuator",
      scene: "errors",
      intro: [
        "`@RestControllerAdvice` trả `ProblemDetail`: **400** `Validation failed` kèm mảng `errors`; **404** với `detail` nói rõ cái gì, id nào; **422** vi phạm nghiệp vụ kèm `code: INSUFFICIENT_STOCK`; 500 thông điệp chung và log chi tiết.",
        "`@WebMvcTest(OrderController.class)` mock service, assert cả status lẫn body. Product sai cả 3 field trả 3 lỗi.",
      ],
      quiz: {
        question: "400 và 422 khác nhau thế nào?",
        options: ["Giống nhau", "400: request sai định dạng hoặc validation; 422: request hợp lệ nhưng vi phạm quy tắc nghiệp vụ", "422 là lỗi server", "400 chỉ cho GET"],
        answer: 1,
        explain: "422 kèm code để client xử lý theo mã.",
      },
      parts: [
        {
          id: "profiles-actuator",
          title: "Profile và Actuator",
          intro: [
            "Profile: `application.yml` chứa cấu hình chung, `application-dev.yml` trỏ PostgreSQL, `application-test.yml` cho test.",
            "Actuator chỉ expose `health` và `info`, và bật **probes**: hai endpoint `liveness` (app còn sống không, nếu không thì Kubernetes restart) và `readiness` (app sẵn sàng nhận traffic chưa) mà Kubernetes gọi định kỳ.",
            "Đã đo: `/actuator/health` 200 UP với db PostgreSQL, `/actuator/health/liveness` UP, `/actuator/env` **404** vì không expose (endpoint này lộ biến môi trường và cấu hình).",
          ],
        },
      ],
    },
    {
      id: "timed",
      title: "Phần 3: Aspect @Timed và Condition Evaluation Report",
      scene: "timed",
      intro: [
        "`@Timed` ở đây là annotation **tự viết** của lab (`common/Timed.java`), không phải `@Timed` của Micrometer dù trùng tên. Một `@Aspect` với advice `@Around` bọc các method có `@Timed`, log tên method, số ms và kết quả. Log thật: `placeOrder took 48 ms (ok)`, `3 ms (ResourceNotFoundException)`, `44 ms (InsufficientStockException)`, `findAll() took 99 ms (ok)`. Lần đầu chậm hơn (JIT, query plan, pool mở connection); sau warm-up chỉ 2–3 ms. Đo nghiêm túc trong production thì dùng thư viện Micrometer (có `@Timed` riêng của nó) và xem p95, p99.",
        "Aspect chạy qua proxy. Spring Boot mặc định đặt `spring.aop.proxy-target-class=true`, tức dùng **CGLIB proxy** (class con sinh lúc chạy, kế thừa class của bạn) thay vì JDK proxy (chỉ bọc được interface). Vì vậy aspect bọc được cả class không implement interface nào.",
        "Chạy `--debug`, tìm `CONDITIONS EVALUATION REPORT` với 4 phần: Positive matches, Negative matches, Exclusions, Unconditional classes. Giải thích ít nhất 3 dòng: một có chạy, một không chạy vì thiếu class, một không chạy vì property.",
        "Ví dụ ba dòng: `DataSourceAutoConfiguration` matched vì có JDBC trên classpath nên Boot tạo DataSource; `H2ConsoleAutoConfiguration` không chạy vì thiếu class `JakartaWebServlet`; `ProblemDetailsErrorHandlingConfiguration` không chạy vì chưa bật property `spring.mvc.problemdetails.enabled` (advice của mình đã tự trả ProblemDetail).",
      ],
      widget: "conditions-report",
      widgetTitle: "Vì sao chạy, vì sao không",
      quiz: {
        question: "Vì sao TimingAspect bọc được class không có interface?",
        options: ["Vì dùng JDK proxy", "Boot mặc định proxy-target-class=true nên dùng CGLIB", "Vì AspectJ weaving", "Vì class là final"],
        answer: 1,
        explain: "Thấy trong report: CglibAutoProxyConfiguration matched.",
      },
    },
    {
      id: "checklist",
      title: "Phần 4: Checklist hoàn thành",
      scene: "checklist",
      intro: ["Ghi vào nhật ký: cấu trúc package, 3 body lỗi bạn tự nhận được, thời gian @Timed lần đầu và lần sau; và kiểm tra API thật ở công ty có trả entity ra ngoài hay để lộ endpoint Actuator không."],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 4",
    },
  ],
  modelAnswer:
    "Em tự dựng order-service bằng Spring Boot 3.5 với PostgreSQL qua docker compose, chia package theo tính năng. Entity dùng quan hệ LAZY và id SEQUENCE, controller chỉ trả DTO record. API tạo đơn chạy trong một transaction: em kiểm tra được khi item thứ hai hết hàng thì trả 422 và kho của item đầu không bị trừ vì rollback. Lỗi được chuẩn hoá bằng ProblemDetail: 400 có danh sách lỗi field, 404 nói rõ id, 422 có mã nghiệp vụ. Actuator chỉ expose health và info, endpoint env trả 404. Em viết một aspect đo thời gian và thấy lần gọi đầu chậm hơn nhiều do warm-up, và đọc Condition Evaluation Report để giải thích vì sao từng auto-config chạy hay không.",
};
