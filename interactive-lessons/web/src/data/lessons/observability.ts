import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Builds on microservices.ts (Phần 6 "observe-ship"): traceId, MDC, RestClient.Builder, Kafka observation and the 10% default
// sampling are only referenced here, not retold.
// Run on a copy of labs/order-service (Spring Boot 3.5.16, Java 21) with micrometer-registry-prometheus,
// micrometer-tracing-bridge-otel and opentelemetry-exporter-otlp added, H2 in memory, sampling 1.0, and Jaeger all-in-one 1.62
// as the OTLP receiver. Every log line, /actuator/prometheus line and Jaeger span quoted below comes from those runs.
// The p99 incident in Phần 5 is a worked scenario, not something that was run.
export const observability: Lesson = {
  slug: "observability",
  crumb: "Observability",
  videoDir: "/videos/observability",
  videoVersion: "0",
  scenes: [],
  title: "Observability: log, metric, trace trong Spring Boot 3",
  subtitle:
    "Ba trụ cột và thứ tự dùng khi có sự cố, log có cấu trúc với MDC và traceId, metric bằng Micrometer và Actuator, cardinality, RED và USE, SLO và error budget, distributed tracing với OpenTelemetry, và cách debug một API chậm ở p99.",
  openingQuiz: {
    question: "Dashboard báo API checkout có thời gian phản hồi trung bình 80 ms, nhưng khách vẫn kêu chậm. Con số nào nên nhìn tiếp?",
    options: ["Số request mỗi giây", "p99 (99% request nhanh hơn mức này)", "CPU trung bình của máy", "Số dòng log mỗi phút"],
    answer: 1,
    explain:
      "Trung bình bị kéo xuống bởi số đông request nhanh, nên giấu mất nhóm khách gặp 3 giây. p99 cho biết 1% request chậm nhất chậm cỡ nào (Phần 3 và Phần 5).",
  },
  roadmap: [
    "Chặng 1: ba trụ cột log, metric, trace, và thứ tự dùng khi có sự cố; log có cấu trúc, MDC, log level, dữ liệu nhạy cảm.",
    "Chặng 2: metric với Micrometer và Actuator: counter, gauge, timer, histogram; cardinality; RED, USE, SLI, SLO, error budget.",
    "Chặng 3: distributed tracing: span, header traceparent, sampling, OTLP, mất context ở thread khác; alert theo triệu chứng và debug p99.",
  ],
  sections: [
    {
      id: "three-pillars",
      title: "Phần 1: Ba trụ cột: log, metric, trace",
      intro: [
        "Monitoring trả lời câu hỏi đã biết trước: CPU có quá 80% không, service có sống không. **Observability** là khả năng trả lời cả những câu chưa nghĩ ra, chỉ bằng dữ liệu hệ thống tự phát ra: vì sao riêng khách dùng ví MoMo bị chậm từ 14 giờ?",
        "Dữ liệu đó có ba loại, mỗi loại trả lời một câu hỏi khác:",
        "- **Metric**: con số theo thời gian, đã gộp sẵn (số request mỗi giây, tỉ lệ lỗi, p99). Trả lời **có vấn đề không, từ lúc nào, nặng cỡ nào**. Rẻ để lưu lâu, hợp để vẽ dashboard và đặt alert.",
        "- **Trace**: đường đi của **một** request qua các service và các bước, mỗi bước kèm thời gian. Trả lời **chậm hay lỗi ở chặng nào**.",
        "- **Log**: sự kiện chi tiết tại một thời điểm, kèm ngữ cảnh (orderId, thông báo lỗi, stack trace). Trả lời **chính xác chuyện gì đã xảy ra**.",
        "Ba thứ phải nối được với nhau. Metric trỏ tới trace mẫu (Prometheus gọi là **exemplar**), trace mang `traceId`, và mỗi dòng log cũng in `traceId` đó. Nhờ vậy khi có sự cố ta đi theo một hướng cố định: **metric, rồi trace, rồi log**.",
        "Lý do đi theo thứ tự này là chi phí và độ rộng: metric nhìn được toàn hệ thống trong một biểu đồ, trace thu hẹp về một request và một chặng, log chỉ đọc khi đã biết cần tìm gì. Bắt đầu bằng grep log trên 20 pod là cách chậm nhất.",
      ],
      board: {
        title: "Khi có sự cố: đi từ rộng tới hẹp",
        highlight: "rộng tới hẹp",
        chips: ["Metric", "Trace", "Log", "traceId"],
        cards: [
          {
            title: "Ba bước điều tra",
            diagram: {
              kind: "flow",
              steps: [
                "Metric: p99 checkout tăng từ 14:05, chỉ ở /orders",
                "Trace: request chậm dừng 1,8 s ở span gọi DB",
                "Log theo traceId: câu SQL nào, tham số gì, lỗi gì",
              ],
              ok: ["Đã có traceId trong log", "Nối ngay từ trace sang log"],
              bad: ["Log không có traceId", "Phải đoán theo giờ và grep"],
            },
            notes: ["Metric cho biết có chuyện và ở đâu, trace cho biết chặng nào, log cho biết vì sao."],
            takeaway: "Metric, rồi trace, rồi log",
          },
        ],
        conclusion: "**Kết luận:** mỗi trụ cột trả lời một câu hỏi. Thiếu `traceId` để nối thì ba thứ thành ba hòn đảo riêng.",
      },
      drill: {
        choices: ["Metric", "Trace", "Log"],
        items: [
          { q: "Tỉ lệ lỗi 5xx của order-service trong 1 giờ qua có tăng không?", a: "Metric", why: "Câu hỏi về xu hướng và tổng thể, cần con số đã gộp theo thời gian." },
          { q: "Một request checkout mất 4 giây: 4 giây đó nằm ở payment-service hay ở database?", a: "Trace", why: "Cần thấy từng chặng của đúng một request và thời gian của mỗi chặng." },
          { q: "Đơn ord-42 bị từ chối: lỗi validate nào, giá trị nào gửi lên?", a: "Log", why: "Cần chi tiết của một sự kiện cụ thể, có ngữ cảnh và thông báo lỗi." },
          { q: "Đặt cảnh báo khi p99 của /checkout vượt 500 ms trong 10 phút", a: "Metric", why: "Alert chạy trên metric: rẻ, liên tục, có ngưỡng rõ ràng." },
        ],
        summary: "Metric hỏi có vấn đề không, trace hỏi ở chặng nào, log hỏi chính xác chuyện gì.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Alert từ metric, mở trace mẫu để thấy chặng chậm, lấy traceId đọc log của đúng request đó."],
      },
      quiz: {
        question: "Vì sao khi có sự cố nên nhìn metric trước, rồi mới tới trace và log?",
        options: [
          "Vì log thường bị mất",
          "Vì metric cho cái nhìn toàn hệ thống với chi phí thấp, rồi trace và log thu hẹp dần về đúng request và nguyên nhân",
          "Vì trace chỉ dùng được sau khi đọc log",
          "Vì Spring Boot chỉ bật metric mặc định",
        ],
        answer: 1,
        explain: "Đi từ rộng tới hẹp: metric khoanh vùng thời điểm và endpoint, trace chỉ ra chặng chậm, log giải thích vì sao. Grep log trước là tìm kim đáy bể.",
      },
    },
    {
      id: "logging",
      title: "Phần 2: Logging đúng cách",
      intro: [
        "Ta đã biết log trả lời câu hỏi chính xác chuyện gì đã xảy ra. Nhưng với 20 pod và hàng triệu dòng mỗi giờ, log dạng câu văn tự do như `Checkout ok for order 42 by user abc` rất khó lọc: muốn tìm mọi đơn của user abc phải viết regex cho từng kiểu câu.",
        "**Structured logging**: mỗi dòng log là một object JSON với các field có tên (`message`, `traceId`, `orderId`...). Hệ thống gom log (ELK, Loki, Datadog) lọc theo field như truy vấn database: `orderId = \"ord-42\"`.",
        "Từ Spring Boot 3.4 có sẵn structured logging, không cần thêm thư viện. Chỉ cần một property:",
        "- `logging.structured.format.console=ecs`: định dạng Elastic Common Schema.",
        "- Hai giá trị khác: `logstash` và `gelf` (Graylog). Muốn ghi JSON ra file thì dùng `logging.structured.format.file`.",
        "Khi có Micrometer Tracing, `traceId` và `spanId` được đặt vào **MDC** (bài Microservices, Phần 6), nên tự có mặt trong JSON. Field riêng của mình thêm bằng `MDC.put` hoặc bằng API fluent của SLF4J 2 `addKeyValue`. Bảng dưới là dòng log thật khi chạy.",
      ],
      board: {
        title: "Một dòng log có cấu trúc",
        highlight: "có cấu trúc",
        chips: ["ECS", "traceId", "MDC", "addKeyValue"],
        cards: [
          {
            title: "Code ghi log",
            diagram: {
              kind: "hub",
              inputs: [{ label: "MDC.put(\"orderId\", ...)" }, { label: "addKeyValue(\"paymentMethod\", ...)" }, { label: "traceId, spanId từ tracing" }],
              center: "Một object JSON",
              rulesTitle: "Mỗi giá trị thành một field",
              rules: ["Lọc theo field, không cần regex", "MDC phải xoá trong finally", "traceId tự có, không tự đặt"],
            },
            code: `MDC.put("orderId", "ord-42");
try {
    log.atInfo().addKeyValue("paymentMethod", method).log("Checkout ok");
} finally {
    MDC.remove("orderId");   // thread của Tomcat được dùng lại cho request sau
}`,
            takeaway: "Ngữ cảnh đi vào field, không nhét vào câu văn",
          },
          {
            title: "Kết quả thật với logging.structured.format.console=ecs",
            diagram: {
              kind: "pipe",
              from: "log.atInfo()...log(\"Checkout ok\")",
              via: "Boot 3.5 structured logging (ECS)",
              to: "JSON một dòng",
              skipped: ["logstash-logback-encoder", "logback.xml tự viết"],
              skippedLabel: "Không cần nữa từ Boot 3.4",
            },
            code: `{"@timestamp":"2026-11-24T15:10:13.085174Z","log":{"level":"INFO","logger":"com.shop.orderservice.demo.DemoController"},
 "process":{"pid":5667,"thread":{"name":"http-nio-8099-exec-2"}},"service":{"name":"order-service","node":{}},
 "message":"Checkout ok","traceId":"11de9b7c283ca840df1fbc4ac632da54","spanId":"08e0b1fad81c9a91",
 "orderId":"ord-42","paymentMethod":"momo","ecs":{"version":"8.11"}}`,
            notes: ["Đã chạy trên Spring Boot 3.5.16 (in ra một dòng, ở đây ngắt dòng cho dễ đọc). Không bật structured logging thì pattern mặc định in `[traceId-spanId]` sau tên thread."],
            takeaway: "traceId, orderId, paymentMethod đều là field lọc được",
          },
        ],
        conclusion: "**Kết luận:** log JSON có `traceId` là cầu nối từ trace sang log. Ở local vẫn có thể giữ log dạng chữ cho dễ đọc, chỉ bật JSON ở môi trường chạy thật.",
      },
      takeaway: {
        lines: [
          "Boot 3.4+: `logging.structured.format.console=ecs` (hoặc `logstash`, `gelf`) là có log JSON.",
          "Ngữ cảnh đặt bằng MDC hoặc `addKeyValue`, và luôn xoá MDC trong `finally`.",
        ],
      },
      trap: {
        title: "Quên xoá MDC",
        text: "MDC gắn với thread. Tomcat dùng lại thread cho request kế tiếp, nên `MDC.put` mà không `remove` thì request sau mang `orderId` của request trước. Log sai còn tệ hơn không có log.",
      },
      quiz: {
        question: "Spring Boot 3.5 cần gì để in log console dạng JSON theo Elastic Common Schema?",
        options: [
          "Thêm thư viện logstash-logback-encoder và viết logback-spring.xml",
          "Đặt `logging.structured.format.console=ecs`",
          "Đặt `logging.pattern.console=json`",
          "Không làm được, phải dùng Log4j2",
        ],
        answer: 1,
        explain: "Structured logging có sẵn từ Boot 3.4 với ba định dạng ecs, logstash, gelf. Đã chạy: mỗi dòng log thành một object JSON có cả traceId và field MDC.",
      },
      parts: [
        {
          id: "log-level-safety",
          title: "Log level, dữ liệu nhạy cảm và chi phí log",
          intro: [
            "Log có cấu trúc rồi, còn ba câu hỏi phỏng vấn hay gặp: log ở mức nào, cái gì không được log, và log nhiều thì tốn gì.",
            "**Log level** từ thấp tới cao: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`. Production thường để `INFO`:",
            "- **ERROR**: một thao tác thất bại và cần người xem (thanh toán lỗi, không ghi được DB). Mỗi dòng ERROR nên đáng để ai đó đọc.",
            "- **WARN**: bất thường nhưng hệ thống tự xử lý được (retry lần 2 thành công, dùng giá trị mặc định).",
            "- **INFO**: mốc nghiệp vụ quan trọng (đơn tạo xong, job chạy xong). Không log mỗi vòng lặp.",
            "- **DEBUG**: chi tiết để dò lỗi, tắt ở production. Bật tạm cho một package qua `POST /actuator/loggers/{tên}` mà không cần restart (nhớ bảo vệ endpoint này).",
            "**Không log dữ liệu nhạy cảm**: mật khẩu, token, số thẻ, CVV, OTP, số CCCD, và hạn chế email, số điện thoại. Log được copy sang nhiều hệ thống, giữ hàng tháng, nhiều người đọc được, nên lộ ở log là lộ rộng nhất. Cách làm: không log cả object request hay entity (`toString()` của entity in hết mọi field), chỉ log id; che bớt (`****1234`) khi thật cần.",
            "**Chi phí log**: ghi log tốn CPU (format chuỗi, serialize JSON), tốn I/O, và tốn tiền lưu trữ theo GB ở hệ thống gom log. Một dòng `INFO` trong vòng lặp xử lý 10.000 phần tử, nhân 20 pod, có thể thành hóa đơn lớn hơn cả tiền máy chạy app. Dùng placeholder `log.debug(\"x={}\", x)` thay vì nối chuỗi, để khi level tắt thì không tốn công format.",
            "Câu cần nói được: log để giải thích sự kiện, còn đếm thì dùng metric. Đừng log mỗi request chỉ để sau này đếm số request.",
          ],
          trap: {
            title: "Log nguyên entity hoặc request body",
            text: "`log.info(\"Login {}\", request)` với record có field `password` sẽ in mật khẩu ra log. Tương tự `toString()` do Lombok sinh cho entity Customer in cả số điện thoại và địa chỉ. Chỉ log id và những field đã chọn.",
          },
          quiz: {
            question: "Cần đếm số đơn tạo thành công mỗi phút để vẽ dashboard. Cách nào hợp lý?",
            options: [
              "Log INFO mỗi đơn rồi đếm số dòng log trong hệ thống gom log",
              "Tăng một Counter của Micrometer mỗi khi tạo đơn",
              "Log ERROR mỗi đơn cho dễ thấy",
              "Ghi vào một bảng đếm trong database",
            ],
            answer: 1,
            explain: "Đếm là việc của metric: một con số trong bộ nhớ, gửi đi định kỳ, gần như không tốn gì. Đếm bằng log tốn I/O, tiền lưu trữ, và chậm khi truy vấn.",
          },
        },
      ],
    },
    {
      id: "metrics",
      title: "Phần 3: Metric với Micrometer và Actuator",
      intro: [
        "Log giải thích từng sự kiện, nhưng để biết hệ thống có đang khoẻ không thì cần con số. **Micrometer** là lớp API trung gian cho metric, giống SLF4J cho log: code ghi metric một lần, chọn backend (Prometheus, Datadog, CloudWatch) bằng cách thêm một dependency `micrometer-registry-*`.",
        "Bốn loại meter cần phân biệt:",
        "- **Counter**: chỉ tăng (số đơn đã tạo, số lỗi). Thứ cần xem là tốc độ tăng, không phải giá trị tuyệt đối.",
        "- **Gauge**: giá trị hiện tại, lên xuống được (số phần tử trong queue, số connection đang dùng). Micrometer đọc giá trị lúc thu thập.",
        "- **Timer**: đo thời gian và đếm số lần. Xuất ra `count`, `sum`, `max`.",
        "- **DistributionSummary**: như Timer nhưng cho giá trị không phải thời gian (kích thước payload, số tiền).",
        "Với Spring Boot: `spring-boot-starter-actuator` cộng `micrometer-registry-prometheus`, rồi mở endpoint bằng `management.endpoints.web.exposure.include=health,info,prometheus`. Boot tự đo sẵn `http_server_requests_seconds` cho mọi controller, cùng JVM, HikariCP, Tomcat.",
        "Prometheus **pull**: cứ vài chục giây gọi `GET /actuator/prometheus` của mỗi instance. Tên metric đổi từ dấu chấm sang gạch dưới, Counter có thêm hậu tố `_total`, Timer có đơn vị `_seconds`. Bảng dưới là code và output thật.",
      ],
      board: {
        title: "Từ code tới /actuator/prometheus",
        highlight: "/actuator/prometheus",
        chips: ["Counter", "Timer", "Histogram", "Prometheus"],
        cards: [
          {
            title: "Timer và Counter tự định nghĩa",
            diagram: {
              kind: "hub",
              inputs: [{ label: "Timer checkout.duration", mark: "calc" }, { label: "Counter orders.placed", mark: "plus" }, { label: "tag payment_method" }],
              center: "MeterRegistry",
              rulesTitle: "Registry lo phần còn lại",
              rules: ["Đổi tên sang kiểu Prometheus", "Giữ giá trị trong bộ nhớ", "Trả về khi Prometheus gọi"],
            },
            code: `Timer checkoutTimer = Timer.builder("checkout.duration")
        .description("Thời gian xử lý checkout")
        .publishPercentileHistogram()          // xuất bucket cho p95, p99
        .register(registry);

checkoutTimer.recordCallable(() -> {
    // ... xử lý checkout
    Counter.builder("orders.placed").tag("payment_method", method)
           .register(registry).increment();
    return "ok";
});`,
            takeaway: "Ghi metric một lần, backend chọn bằng dependency",
          },
          {
            title: "Output thật sau 4 request (3 card, 1 momo)",
            diagram: {
              kind: "pipe",
              from: "GET /actuator/prometheus",
              via: "PrometheusMeterRegistry",
              to: "Text format của Prometheus",
              skipped: ["Tự viết endpoint", "Ghi metric vào DB"],
              skippedLabel: "Không cần",
            },
            code: `# TYPE orders_placed_total counter
orders_placed_total{payment_method="card"} 3.0
orders_placed_total{payment_method="momo"} 1.0
# TYPE checkout_duration_seconds histogram
checkout_duration_seconds_bucket{le="0.022369621"} 2
checkout_duration_seconds_bucket{le="0.027962026"} 3
checkout_duration_seconds_bucket{le="+Inf"} 4
checkout_duration_seconds_count 4
checkout_duration_seconds_sum 0.130600999
checkout_duration_seconds_max 0.062756541
http_server_requests_seconds_count{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/demo/checkout"} 4`,
            notes: ["Đã chạy trên Spring Boot 3.5.16, đã lược bớt các bucket ở giữa. Bucket là luỹ kế: `le=\"0.027962026\"} 3` nghĩa là 3 request xong trong 28 ms."],
            takeaway: "Trung bình 32,7 ms (sum/count), chậm nhất 62,8 ms",
          },
        ],
        conclusion: "**Kết luận:** `uri` trong `http_server_requests` là **template** (`/orders/{id}`), không phải đường dẫn thật, chính là để tránh vấn đề ở phần sau.",
      },
      takeaway: {
        lines: [
          "Counter chỉ tăng, Gauge lên xuống, Timer đo thời gian và đếm, DistributionSummary cho giá trị khác thời gian.",
          "Actuator + `micrometer-registry-prometheus` + mở `prometheus` trong exposure là có `/actuator/prometheus`.",
        ],
      },
      trap: {
        title: "Gauge trỏ vào object bị dọn",
        text: "`registry.gauge(\"queue.size\", new ArrayList<>(), List::size)` chỉ giữ **tham chiếu yếu** tới object. Không ai khác giữ list đó thì GC dọn và gauge trả `NaN`. Truyền vào object đang được giữ ở nơi khác (một field của bean).",
      },
      quiz: {
        question: "Muốn biết số message đang chờ trong một queue nội bộ (lên xuống liên tục). Dùng loại meter nào?",
        options: ["Counter", "Gauge", "Timer", "Không cần metric, log là đủ"],
        answer: 1,
        explain: "Giá trị hiện tại, tăng giảm được là Gauge. Counter chỉ tăng nên chỉ hợp cho số lần một việc đã xảy ra.",
      },
      parts: [
        {
          id: "cardinality",
          title: "Tag và cardinality explosion",
          intro: [
            "Tag (Prometheus gọi là label) giúp tách một metric theo chiều: `payment_method=\"card\"` và `\"momo\"`. Nhưng mỗi **tổ hợp giá trị tag** là một **time series** riêng mà Prometheus phải lưu.",
            "**Cardinality** là số time series đó. Tag có ít giá trị (method, status, payment_method) thì ổn. Tag theo `userId`, `orderId`, email, hay URL thô thì mỗi giá trị mới là một series mới. 1 triệu user thì 1 triệu series cho riêng một counter.",
            "Với Timer có histogram còn nặng hơn: đã chạy, một Timer không có tag nào đã xuất **69 dòng** `_bucket`. Nhân với số giá trị tag là ra số series thật.",
            "Hậu quả: RAM của Prometheus tăng vọt, truy vấn chậm, app cũng tốn bộ nhớ vì giữ từng meter. Cách đúng: tag chỉ dùng giá trị có giới hạn và biết trước; muốn tra theo user thì tra log hoặc trace bằng `userId`.",
          ],
          compare: [
            way(
              "Tag theo userId",
              `Counter.builder("orders.by.user")
       .tag("user_id", userId)      // mỗi user một series
       .register(registry).increment();`,
              [
                ask("5 user khác nhau gọi, mỗi người 1 lần", bad("Đã chạy: `/actuator/prometheus` có 5 dòng `orders_by_user_total{user_id=\"user-1\"} 1.0` tới `user-5`. Mỗi user mới là một series mới.")),
                ask("Hệ thống có 1 triệu user", bad("1 triệu series cho một counter. Prometheus hết RAM, dashboard truy vấn không nổi.")),
              ],
              "Số series tăng theo số user: cardinality explosion.",
            ),
            way(
              "Tag có giới hạn",
              `Counter.builder("orders.placed")
       .tag("payment_method", method)   // card, momo, cod
       .register(registry).increment();`,
              [
                ask("4 đơn từ nhiều user", ok("Đã chạy: chỉ 2 dòng, `payment_method=\"card\"} 3.0` và `\"momo\"} 1.0`.")),
                ask("Cần biết user nào đặt đơn nào", ok("Tra log JSON theo field `userId` hoặc trace. Metric không phải nơi lưu từng user.")),
              ],
              "Số series cố định theo số phương thức thanh toán.",
            ),
          ],
          widgetTitle: "Chọn cách gắn tag, xem số series",
          takeaway: {
            lines: ["Tag chỉ nhận giá trị có giới hạn và biết trước. userId, orderId, email, URL thô thuộc về log và trace."],
          },
          trap: {
            title: "Tag theo userId",
            text: "Câu hỏi phỏng vấn kinh điển: “Muốn đo latency theo từng user thì sao?”. Trả lời: không gắn tag userId vào metric. Gắn tag theo nhóm có giới hạn (gói dịch vụ, khu vực), còn từng user thì tìm qua log và trace.",
          },
          quiz: {
            question: "Tag nào an toàn để gắn vào metric `http_server_requests`?",
            options: ["`orderId`", "`status` (200, 404, 500...)", "Đường dẫn thô `/orders/12345`", "`email` của khách"],
            answer: 1,
            explain: "status có vài chục giá trị là cùng. orderId, email và URL thô có số giá trị không giới hạn, mỗi giá trị là một time series mới.",
          },
        },
        {
          id: "percentiles",
          senior: true,
          title: "Histogram và percentile: vì sao không dùng trung bình",
          intro: [
            "Trung bình giấu mất nhóm chậm. 99 request 50 ms và 1 request 5 giây cho trung bình gần 100 ms, trông ổn, trong khi cứ 100 khách có 1 người chờ 5 giây. Một trang gọi 20 API thì xác suất ít nhất một lời gọi rơi vào nhóm 1% chậm là khoảng 18%.",
            "**Percentile** p99 là mức mà 99% request nhanh hơn. Micrometer có hai cách xuất:",
            "- **`publishPercentiles(0.95, 0.99)`**: app tự tính p99 và xuất sẵn con số. Nhưng p99 của từng instance **không cộng hay lấy trung bình được** ra p99 của cả cụm.",
            "- **`publishPercentileHistogram()`**: app xuất các bucket đếm luỹ kế (như output ở trên). Prometheus cộng bucket của mọi instance rồi mới tính, nên ra p99 đúng cho cả cụm: `histogram_quantile(0.99, sum by (le) (rate(checkout_duration_seconds_bucket[5m])))`.",
            "Cho metric có sẵn của Boot, bật bằng property: `management.metrics.distribution.percentiles-histogram.http.server.requests=true`. Đổi lại mỗi timer thêm vài chục series bucket, nên lại quay về chuyện cardinality ở phần trước.",
            "Giá trị `_max` cũng hữu ích nhưng chỉ là lớn nhất trong một cửa sổ thời gian ngắn, không thay được percentile.",
          ],
          takeaway: {
            lines: ["Nhìn p95, p99 thay vì trung bình. Chạy nhiều instance thì xuất histogram và tính percentile ở Prometheus, đừng lấy trung bình các p99."],
          },
          quiz: {
            question: "Có 5 instance, mỗi instance tự xuất p99 bằng `publishPercentiles(0.99)`. Lấy trung bình 5 con số đó có ra p99 của cả cụm không?",
            options: [
              "Có, vì 5 instance nhận tải như nhau",
              "Không, percentile không cộng hay lấy trung bình được; cần xuất histogram rồi tính trên tổng bucket",
              "Có, nếu lấy max thay vì trung bình",
              "Không cần quan tâm, p99 nào cũng như nhau",
            ],
            answer: 1,
            explain: "Percentile là giá trị trên phân phối. Gộp phân phối (cộng bucket) rồi mới tính được percentile; gộp các percentile đã tính thì sai.",
          },
        },
        {
          id: "red-use-slo",
          senior: true,
          title: "RED, USE, SLI, SLO và error budget",
          intro: [
            "Có hàng trăm metric, nên đo cái gì trước? Hai bộ khung dễ nhớ:",
            "- **RED** cho **service** (thứ nhận request): **R**ate (số request mỗi giây), **E**rrors (tỉ lệ lỗi), **D**uration (phân phối thời gian, p99). Cả ba lấy được từ `http_server_requests_seconds`.",
            "- **USE** cho **tài nguyên** (CPU, connection pool, thread pool, ổ đĩa): **U**tilization (đang dùng bao nhiêu phần trăm), **S**aturation (đã có hàng chờ chưa), **E**rrors. Ví dụ pool HikariCP: `hikaricp_connections_active` là utilization, `hikaricp_connections_pending` lớn hơn 0 là saturation.",
            "Từ metric đi tới cam kết với người dùng:",
            "- **SLI** (Service Level Indicator): một tỉ lệ đo được, ví dụ phần trăm request checkout thành công và xong dưới 500 ms.",
            "- **SLO** (Objective): mục tiêu nội bộ cho SLI, ví dụ 99,9% trong 30 ngày. **SLA** là hợp đồng với khách, có phạt, thường lỏng hơn SLO.",
            "- **Error budget**: phần được phép hỏng, bằng 100% trừ SLO. 99,9% trong 30 ngày là 0,1% của 43.200 phút, tức **43,2 phút**. Còn budget thì được deploy nhanh, thử nghiệm; đốt hết budget thì dừng tính năng mới, ưu tiên độ ổn định.",
          ],
          drill: {
            choices: ["RED", "USE"],
            items: [
              { q: "Số request mỗi giây vào /orders tăng gấp đôi", a: "RED", why: "Rate của một service nhận request." },
              { q: "`hikaricp_connections_pending` đứng ở 15 suốt 10 phút", a: "USE", why: "Saturation của tài nguyên connection pool: request đang xếp hàng chờ connection." },
              { q: "Tỉ lệ 5xx của payment-service lên 3%", a: "RED", why: "Errors của một service." },
              { q: "Thread pool của @Async dùng 100% thread và queue bắt đầu đầy", a: "USE", why: "Utilization và saturation của một tài nguyên bên trong." },
            ],
            summary: "RED nhìn service từ phía người gọi, USE nhìn tài nguyên bên trong. Triệu chứng thấy ở RED, nguyên nhân thường lộ ra ở USE.",
          },
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["SLI đo được, SLO là mục tiêu, error budget = 100% trừ SLO. 99,9% trong 30 ngày cho 43,2 phút hỏng."],
          },
          quiz: {
            question: "SLO 99,9% request checkout thành công trong 30 ngày. Error budget là bao nhiêu?",
            options: ["0,1% số request, tương đương khoảng 43,2 phút nếu tính theo thời gian", "8,76 giờ", "1% số request", "Không có, SLO 99,9% nghĩa là không được lỗi"],
            answer: 0,
            explain: "Budget = 100% trừ 99,9% = 0,1%. 30 ngày là 43.200 phút, 0,1% là 43,2 phút. 8,76 giờ là 0,1% của cả một năm.",
          },
        },
      ],
    },
    {
      id: "tracing",
      title: "Phần 4: Distributed tracing đi sâu",
      intro: [
        "Bài Microservices (Phần 6) đã nói traceId nối log của nhiều service, và client phải được instrument mới truyền được. Phần này đi vào bên trong: một trace trông thế nào, header mang gì, và Spring gửi dữ liệu đi đâu.",
        "- **Trace**: toàn bộ hành trình của một request, định danh bằng `traceId` 32 ký tự hex.",
        "- **Span**: một đoạn việc trong trace (xử lý HTTP, một câu SQL, một lời gọi sang service khác), có `spanId` 16 ký tự hex, thời điểm bắt đầu, thời lượng, và **parent span**. Các span xếp thành cây.",
        "**Context propagation** theo chuẩn W3C Trace Context: header `traceparent: 00-<traceId>-<parentSpanId>-<flags>`. `00` là version, flags `01` nghĩa là trace này đã được chọn lấy mẫu. Service nhận header thì **tiếp tục trace đó** thay vì tạo trace mới.",
        "Phía Spring Boot 3: **Micrometer Tracing** là API (giống SLF4J cho tracing), **bridge** chọn thư viện thật: `micrometer-tracing-bridge-otel` (OpenTelemetry) hoặc `micrometer-tracing-bridge-brave`. Thêm `opentelemetry-exporter-otlp` để gửi span theo giao thức **OTLP** tới collector (Jaeger, Tempo, OpenTelemetry Collector), địa chỉ đặt ở `management.otlp.tracing.endpoint`.",
        "Bảng dưới gửi một request kèm `traceparent` tự đặt, rồi xem log và Jaeger.",
      ],
      board: {
        title: "Một header traceparent đi qua app",
        highlight: "traceparent",
        chips: ["W3C", "traceId", "spanId", "OTLP", "Jaeger"],
        cards: [
          {
            title: "Gửi request với traceId có sẵn",
            diagram: {
              kind: "flow",
              steps: ["Client gửi traceparent", "Tracing filter đọc header", "Span mới, cùng traceId, parent là span của client", "Log in traceId đó"],
              ok: ["Có header hợp lệ", "Tiếp tục trace của bên gọi"],
              bad: ["Không có header", "Bắt đầu trace mới"],
              neutral: true,
            },
            code: `$ curl -H 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' \\
       localhost:8099/demo/checkout

... "message":"Checkout ok method=card","traceId":"4bf92f3577b34da6a3ce929d0e0e4736","spanId":"67906c1b470aba3e" ...`,
            notes: ["Đã chạy: traceId trong log đúng bằng traceId gửi trong header. spanId thì mới, vì đây là span của order-service."],
            takeaway: "Cùng traceId, span mới, parent là bên gọi",
          },
          {
            title: "Span mà Jaeger nhận qua OTLP",
            diagram: {
              kind: "pipe",
              from: "Span trong app",
              via: "OTLP HTTP tới :4318/v1/traces",
              to: "Jaeger, Tempo, OTel Collector",
              skipped: ["Gửi đồng bộ trong request", "Ghi span vào log"],
              skippedLabel: "Exporter gửi theo lô ở thread riêng",
            },
            code: `span                         spanID            parent            thời lượng
http get /demo/checkout      6d065a517449c948  00f067aa0ba902b7  167141 µs
security filterchain before  287875d40ddffaad  6d065a517449c948    1503 µs
authorize request            c47e724e4b4b9cf4  287875d40ddffaad     647 µs
secured request              67906c1b470aba3e  6d065a517449c948  141342 µs
security filterchain after   96bda908415f5a77  6d065a517449c948     387 µs`,
            notes: ["Đã chạy: lấy từ API của Jaeger 1.62 theo traceId trên. Span gốc của app có parent là `00f067aa0ba902b7`, đúng spanId của client trong header."],
            takeaway: "Cây span cho thấy thời gian nằm ở đâu",
          },
        ],
        conclusion: "**Kết luận:** `traceparent` mang traceId và span cha qua ranh giới service. Exporter gửi span ra ngoài bất đồng bộ, collector chết thì app vẫn chạy.",
      },
      after: [
        "Khi chạy mà chưa có collector ở địa chỉ cấu hình, app vẫn trả lời bình thường, chỉ in `ERROR ... HttpExporter : Failed to export spans` (đã chạy). Đó là lý do tracing không được làm request chậm hay lỗi: exporter gom span theo lô và gửi ở thread riêng.",
      ],
      takeaway: {
        lines: [
          "Micrometer Tracing là API, bridge OTel hoặc Brave là bản cài đặt, OTLP exporter gửi span tới collector.",
          "`traceparent` = version, traceId, span cha, flags. Có header thì tiếp tục trace, không có thì tạo trace mới.",
        ],
      },
      quiz: {
        question: "Service B nhận request có header `traceparent: 00-4bf9...4736-00f0...02b7-01`. Span đầu tiên B tạo ra có đặc điểm gì?",
        options: [
          "traceId mới, không liên quan tới A",
          "Cùng traceId 4bf9...4736, spanId mới, parent là 00f0...02b7",
          "Cùng traceId và cùng spanId 00f0...02b7",
          "B không tạo span vì A đã tạo rồi",
        ],
        answer: 1,
        explain: "Đã chạy: log và Jaeger đều cho thấy cùng traceId, span mới 6d06...c948 với parent là 00f067aa0ba902b7 từ header.",
      },
      parts: [
        {
          id: "sampling",
          senior: true,
          title: "Sampling: lấy mẫu bao nhiêu trace",
          intro: [
            "Ghi span cho mọi request tốn CPU, băng thông và tiền lưu trữ. Nên Boot mặc định chỉ lấy mẫu 10% (`management.tracing.sampling.probability=0.1`). Trong bài lab ta đặt `1.0` để request nào cũng có trace.",
            "Hai kiểu sampling hay được hỏi:",
            "- **Head-based**: quyết định ngay ở đầu trace (service đầu tiên), rồi ghi vào flags của `traceparent`. Các service sau **tôn trọng quyết định của cha** (parent-based), nên một trace hoặc đủ mọi span, hoặc không có span nào. Rẻ, đơn giản, đây là kiểu của Micrometer Tracing.",
            "- **Tail-based**: giữ mọi span tạm ở collector, đợi trace xong mới quyết định giữ hay bỏ. Nhờ vậy giữ được **mọi trace lỗi hoặc chậm** và chỉ lấy mẫu ít trace bình thường. Đổi lại collector phải đệm nhiều dữ liệu; làm ở OpenTelemetry Collector, không phải trong app.",
            "Hệ quả quan trọng: với head-based 10%, request bị lỗi mà bạn đang tìm có 90% khả năng **không có trace**. Log vẫn có traceId (traceId được tạo dù không lấy mẫu), nên vẫn nối được các dòng log với nhau. Đã chạy với `probability=0.0`: dòng log vẫn in `[aa5a90f0c27bbde0462a98886ed9a131-e564c10f9c003a42]`.",
          ],
          takeaway: {
            lines: ["Head-based: quyết định ở đầu, rẻ, có thể bỏ sót trace lỗi. Tail-based: quyết định ở cuối tại collector, giữ được trace lỗi và chậm."],
          },
          quiz: {
            question: "Muốn chắc chắn giữ lại mọi trace có lỗi nhưng chỉ lưu 5% trace bình thường. Dùng cách nào?",
            options: [
              "Đặt `management.tracing.sampling.probability=0.05`",
              "Tail-based sampling ở OpenTelemetry Collector",
              "Đặt probability bằng 1.0 ở service đầu và 0.05 ở các service sau",
              "Tắt tracing, chỉ dùng log",
            ],
            answer: 1,
            explain: "Head-based quyết định trước khi biết request có lỗi hay không. Chỉ tail-based, đợi trace xong, mới chọn được theo kết quả.",
          },
        },
        {
          id: "async-context",
          title: "Thread khác thì mất context",
          intro: [
            "Trace context (và MDC) nằm trong **ThreadLocal** của thread đang xử lý request. Đẩy việc sang thread khác bằng `@Async`, `CompletableFuture.supplyAsync`, hay một `ExecutorService` tự tạo thì thread mới không có gì, nên log ở đó mất `traceId` và span con không nối vào trace.",
            "Cách sửa trong Spring Boot 3: khai báo một bean `ContextPropagatingTaskDecorator` (Spring Framework 6.1). Executor do Boot tự cấu hình (thứ `@Async` dùng) sẽ áp decorator này: chụp context lúc submit, khôi phục trong thread chạy task, dọn khi xong.",
            "Executor tự `new` thì Boot không biết tới, phải tự gắn decorator hoặc bọc bằng `ContextExecutorService.wrap(...)` của Micrometer Context Propagation.",
            "Chọn một cách, rồi xem dòng log thật ở thread `task-1`.",
          ],
          compare: [
            way(
              "Không có decorator",
              `@Async
public void send() {
    log.info("Sending confirmation mail");
}`,
              [
                ask("Log trong controller", ok("Đã chạy: `[nio-8099-exec-4] [0f94c550cbd92a3e742c0b6e049fd33f-1e19c70261c6af7a] ... Checkout ok method=card`")),
                ask("Log trong @Async ở thread task-1", bad("Đã chạy: `[task-1] [                                                 ] ... Sending confirmation mail`. Ô traceId trống.")),
              ],
              "Thread của executor không thừa hưởng context.",
            ),
            way(
              "Bean ContextPropagatingTaskDecorator",
              `@Bean
ContextPropagatingTaskDecorator contextPropagatingTaskDecorator() {
    return new ContextPropagatingTaskDecorator();
}`,
              [
                ask("Log trong controller", ok("Đã chạy: `\"thread\":{\"name\":\"http-nio-8099-exec-2\"} ... \"traceId\":\"4bf92f3577b34da6a3ce929d0e0e4736\"`")),
                ask("Log trong @Async ở thread task-1", ok("Đã chạy: `\"thread\":{\"name\":\"task-1\"} ... \"traceId\":\"4bf92f3577b34da6a3ce929d0e0e4736\"`. Cùng traceId với controller.")),
              ],
              "Executor của Boot tự áp decorator, context đi theo task.",
            ),
          ],
          widgetTitle: "Chọn cấu hình, xem log ở thread task-1",
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Context nằm trong ThreadLocal → task chạy ở thread khác không có → cần decorator chụp và khôi phục context."],
          },
          trap: {
            title: "Executor tự new",
            text: "Bean `ContextPropagatingTaskDecorator` chỉ được Boot áp vào executor do Boot tự cấu hình (hoặc builder của Boot). `Executors.newFixedThreadPool(10)` tự tạo thì vẫn mất context, phải tự bọc.",
          },
          quiz: {
            question: "Log trong method `@Async` không có traceId dù log ở controller có. Nguyên nhân là gì?",
            options: [
              "Sampling chỉ 10% nên log bị mất traceId",
              "Trace context nằm trong ThreadLocal của thread request; thread của executor không có nếu không dùng decorator",
              "Logback không in được MDC ở thread khác",
              "@Async tắt tracing",
            ],
            answer: 1,
            explain: "Đã chạy: không decorator thì dòng log ở `task-1` trống traceId; thêm bean ContextPropagatingTaskDecorator thì cùng traceId với controller.",
          },
        },
      ],
    },
    {
      id: "alerting-debug",
      senior: true,
      title: "Phần 5: Alerting và debug sự cố thật",
      intro: [
        "Đã có đủ log, metric, trace. Câu hỏi senior: alert cái gì, và khi alert kêu thì làm gì theo thứ tự nào.",
        "**Alert theo triệu chứng, không theo nguyên nhân.** Triệu chứng là thứ người dùng cảm nhận: tỉ lệ lỗi tăng, p99 vượt SLO, error budget cháy nhanh. Nguyên nhân là CPU 90%, một pod restart, GC dài.",
        "- Alert theo nguyên nhân gây **ồn**: CPU 90% lúc chạy batch nhưng khách không bị gì, vẫn đánh thức người trực lúc 3 giờ sáng. Kêu nhiều lần không có gì thì người ta bắt đầu bỏ qua.",
        "- Alert theo nguyên nhân còn **bỏ sót**: không thể liệt kê hết nguyên nhân. Lock DB, DNS chậm, đối tác chậm đều không làm CPU tăng.",
        "- Metric nguyên nhân (CPU, pool, GC) vẫn cần, nhưng nằm trên **dashboard** để chẩn đoán, không phải để gọi người dậy.",
        "Alert tốt có: ngưỡng gắn với SLO, thời gian kéo dài (`for: 10m` để bỏ qua nhiễu ngắn), và đường dẫn tới dashboard hoặc runbook. Cách nâng cao là **burn rate**: alert khi error budget đang cháy nhanh gấp nhiều lần mức cho phép.",
        "**Dashboard** cho mỗi service nên có hàng trên là RED (rate, error, p50, p95, p99 theo endpoint), hàng dưới là USE của các tài nguyên (connection pool, thread, heap, GC), cùng mốc deploy để đối chiếu thời điểm.",
      ],
      drill: {
        choices: ["Nên alert (triệu chứng)", "Chỉ để trên dashboard (nguyên nhân)"],
        items: [
          { q: "p99 của /checkout trên 1 giây trong 10 phút liên tục, SLO là 500 ms", a: "Nên alert (triệu chứng)", why: "Người dùng đang chờ lâu, và vi phạm SLO." },
          { q: "CPU của một pod lên 92% trong lúc job đối soát chạy", a: "Chỉ để trên dashboard (nguyên nhân)", why: "Nếu latency và lỗi vẫn bình thường thì khách không bị ảnh hưởng." },
          { q: "Tỉ lệ 5xx của API đặt hàng vượt 2% trong 5 phút", a: "Nên alert (triệu chứng)", why: "Lỗi người dùng thấy trực tiếp." },
          { q: "Heap dùng 75%", a: "Chỉ để trên dashboard (nguyên nhân)", why: "Heap cao là bình thường với JVM; chỉ thành vấn đề khi kéo theo GC dài và latency tăng, lúc đó alert latency sẽ kêu." },
        ],
        summary: "Alert gọi người dậy khi người dùng bị ảnh hưởng. Nguyên nhân để trên dashboard, dùng lúc chẩn đoán.",
      },
      takeaway: {
        lines: ["Alert theo triệu chứng gắn với SLO, có thời gian kéo dài và link runbook. Nguyên nhân để trên dashboard."],
      },
      trap: {
        title: "Alert theo trung bình",
        text: "Alert “latency trung bình lớn hơn 1 giây” gần như không bao giờ kêu, vì đa số request nhanh kéo trung bình xuống. Alert theo p99 hoặc theo tỉ lệ request chậm hơn ngưỡng SLO.",
      },
      quiz: {
        question: "Vì sao không nên đặt alert gọi người trực khi CPU lớn hơn 85%?",
        options: [
          "Vì CPU không đo được trong Spring Boot",
          "Vì đó là nguyên nhân, có thể không ảnh hưởng người dùng (gây ồn), và nhiều sự cố không làm CPU tăng (bỏ sót)",
          "Vì Prometheus không lưu metric CPU",
          "Vì CPU luôn dưới 85%",
        ],
        answer: 1,
        explain: "Alert theo triệu chứng (lỗi, latency so với SLO) vừa ít ồn vừa bắt được cả những nguyên nhân chưa nghĩ tới. CPU để trên dashboard.",
      },
      parts: [
        {
          id: "debug-p99",
          senior: true,
          title: "Tình huống: API chậm ở p99",
          intro: [
            "Đây là tình huống mẫu để luyện cách trả lời, không phải một sự cố đã chạy lại. Đề: 14:10 alert báo p99 của `POST /orders` lên 2,5 giây, SLO là 500 ms. p50 vẫn 60 ms. Trả lời từng bước:",
            "- **Bước 1, khoanh vùng bằng metric**: chậm ở mọi endpoint hay chỉ `/orders`? Mọi instance hay một pod? Bắt đầu từ lúc nào, trùng mốc deploy hay đợt tải tăng không? Ở đây: chỉ `/orders`, mọi pod, từ 14:05, rate tăng gấp 3 vì khuyến mãi, không có deploy.",
            "- **Bước 2, nhìn USE**: `hikaricp_connections_active` chạm max 10, `hikaricp_connections_pending` lên 40, `hikaricp_connections_acquire_seconds` tăng. CPU và GC bình thường. Nghi: request đang **xếp hàng chờ connection**.",
            "- **Bước 3, mở trace của request chậm** (exemplar trên biểu đồ p99, hoặc lọc trace theo thời lượng lớn hơn 2 giây): span HTTP 2,4 giây, trong đó gần 2 giây là khoảng trống trước span SQL đầu tiên (chờ lấy connection), và một span gọi payment-service 300 ms nằm **bên trong** transaction.",
            "- **Bước 4, đọc log theo traceId**: thấy câu `SELECT ... FOR UPDATE` trên bảng stock và lời gọi payment đều chạy trong cùng `@Transactional`. Mỗi đơn giữ connection và lock suốt lúc chờ payment.",
            "- **Bước 5, sửa và kiểm chứng**: chuyển lời gọi payment ra ngoài transaction (hoặc tách bước), đặt timeout cho client gọi payment; tạm thời có thể nâng pool nhưng không phải cách sửa gốc. Sau deploy, xác nhận trên chính biểu đồ p99 và `pending` trở về 0. Cuối cùng viết postmortem và thêm panel hoặc alert còn thiếu.",
            "Vì sao p50 không đổi mà p99 tăng: phần lớn request vẫn lấy được connection ngay, chỉ những request tới lúc pool đã hết mới phải xếp hàng. Trung bình và p50 đều giấu điều đó.",
          ],
          board: {
            title: "Debug p99 theo năm bước",
            highlight: "năm bước",
            chips: ["RED", "USE", "Trace", "Log", "Kiểm chứng"],
            cards: [
              {
                title: "Đi từ triệu chứng tới nguyên nhân gốc",
                diagram: {
                  kind: "flow",
                  steps: [
                    "Metric RED: chỉ /orders, mọi pod, từ 14:05, tải gấp 3",
                    "Metric USE: Hikari pending 40, active chạm max",
                    "Trace: 2 s chờ trước span SQL, payment nằm trong transaction",
                    "Log theo traceId: FOR UPDATE và gọi payment cùng một transaction",
                  ],
                  ok: ["Sửa gốc", "Gọi payment ngoài transaction, có timeout"],
                  bad: ["Chỉ chữa triệu chứng", "Tăng pool lên 100 rồi thôi"],
                },
                notes: ["Mỗi bước dùng đúng một trụ cột và thu hẹp phạm vi. Kết thúc bằng kiểm chứng trên chính metric đã báo động."],
                takeaway: "Khoanh vùng, chẩn đoán, sửa gốc, kiểm chứng",
              },
            ],
            conclusion: "**Kết luận:** câu trả lời tốt kể theo thứ tự metric, trace, log, và luôn kết thúc bằng việc chứng minh đã hết bằng số liệu.",
          },
          trap: {
            title: "Tăng pool là xong",
            text: "Nâng pool từ 10 lên 100 làm `pending` giảm lúc đầu, nhưng database phải gánh 100 connection mỗi pod nhân số pod, và lock vẫn bị giữ trong lúc chờ payment. Sửa gốc là rút ngắn thời gian giữ connection.",
          },
          quiz: {
            question: "p99 tăng từ 200 ms lên 2,5 s nhưng p50 vẫn 60 ms, `hikaricp_connections_pending` lên 40. Giả thuyết hợp lý nhất?",
            options: [
              "Mạng giữa client và server chậm đều",
              "Một phần request phải xếp hàng chờ connection vì pool đã hết, do mỗi request giữ connection quá lâu",
              "JVM thiếu CPU",
              "Logback ghi log quá nhiều",
            ],
            answer: 1,
            explain: "pending lớn hơn 0 là saturation của pool. Chỉ những request tới lúc pool đầy mới chậm, nên p99 tăng còn p50 không đổi. Trace sẽ cho thấy khoảng chờ trước span SQL.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Em chia observability thành ba trụ cột. Metric cho biết có vấn đề không và từ lúc nào, trace cho biết chậm ở chặng nào, log cho biết chính xác chuyện gì đã xảy ra; ba thứ nối với nhau bằng traceId. Trong Spring Boot 3, em dùng Actuator với Micrometer và registry Prometheus: Boot đã đo sẵn http.server.requests, em thêm Counter và Timer cho nghiệp vụ, tag chỉ dùng giá trị có giới hạn để tránh cardinality explosion, không bao giờ tag theo userId. Latency em nhìn p95, p99 bằng histogram chứ không nhìn trung bình. Tracing dùng Micrometer Tracing với bridge OpenTelemetry, header W3C traceparent, gửi span qua OTLP; với @Async em khai báo ContextPropagatingTaskDecorator để không mất traceId. Log em bật structured logging dạng ECS, thêm field qua MDC, không log mật khẩu hay token. Alert em đặt theo triệu chứng gắn với SLO và error budget. Khi API chậm ở p99, em đi metric RED, rồi USE như connection pool, mở trace của request chậm, đọc log theo traceId, sửa gốc và kiểm chứng lại trên chính metric đó.",
  cards: [
    { q: "Ba trụ cột của observability và câu hỏi mỗi cái trả lời?", a: "Metric: có vấn đề không, từ lúc nào. Trace: chậm hay lỗi ở chặng nào. Log: chính xác chuyện gì. Nối bằng traceId." },
    { q: "Thứ tự điều tra khi có sự cố?", a: "Metric để khoanh vùng, trace để tìm chặng, log theo traceId để biết nguyên nhân. Đi từ rộng tới hẹp." },
    { q: "Bật log JSON trong Spring Boot 3.4+ thế nào?", a: "`logging.structured.format.console=ecs` (hoặc logstash, gelf). traceId, spanId và giá trị MDC tự thành field." },
    { q: "Vì sao phải xoá MDC trong finally?", a: "MDC gắn với thread, Tomcat dùng lại thread, không xoá thì request sau mang giá trị của request trước." },
    { q: "Counter, Gauge, Timer khác nhau thế nào?", a: "Counter chỉ tăng. Gauge là giá trị hiện tại, lên xuống được. Timer đo thời gian và đếm số lần (count, sum, max, bucket)." },
    { q: "Cardinality explosion là gì?", a: "Mỗi tổ hợp giá trị tag là một time series. Tag theo userId, orderId, URL thô làm số series tăng không giới hạn, Prometheus hết RAM." },
    { q: "publishPercentiles khác publishPercentileHistogram?", a: "publishPercentiles tính p99 trong app, không gộp được giữa instance. Histogram xuất bucket, Prometheus cộng rồi tính bằng histogram_quantile." },
    { q: "RED và USE?", a: "RED cho service: Rate, Errors, Duration. USE cho tài nguyên: Utilization, Saturation, Errors (ví dụ Hikari active và pending)." },
    { q: "Error budget của SLO 99,9% trong 30 ngày?", a: "0,1%, khoảng 43,2 phút. Hết budget thì dừng tính năng mới, ưu tiên ổn định." },
    { q: "Header traceparent gồm gì?", a: "version-traceId(32 hex)-parentSpanId(16 hex)-flags. Flags 01 là đã được lấy mẫu." },
    { q: "Head-based và tail-based sampling?", a: "Head quyết định ở đầu trace, rẻ, có thể bỏ sót trace lỗi; mặc định Boot 10%. Tail quyết định ở collector sau khi trace xong, giữ được trace lỗi và chậm." },
    { q: "@Async làm mất traceId, sửa thế nào?", a: "Khai báo bean ContextPropagatingTaskDecorator; executor của Boot tự áp. Executor tự new thì phải tự bọc." },
  ],
};
