import timeline from "../timelines/microservices.json";
import type { Lesson, Scene } from "../types";

// Builds on sd-concepts (Phần 4-6): circuit breaker, outbox and rate limiting are only referenced here, not retold.
// Spring facts are for Spring Boot 3.x and Spring Cloud 2023.x/2024.x. Video not rendered yet: scenes stay empty until publish.
export const microservices: Lesson = {
  slug: "microservices",
  crumb: "Microservices",
  videoDir: "/videos/microservices",
  videoVersion: "301b98ec",
  scenes: timeline as Scene[],
  title: "Microservices",
  subtitle:
    "Chia service theo domain, chọn gọi đồng bộ hay qua event, discovery và API Gateway, saga thay cho transaction chung, bảo mật giữa các service, và tracing, test, triển khai khi một request đi qua nhiều service.",
  openingQuiz: {
    question: "Order-service gọi đồng bộ lần lượt 4 service, mỗi service sẵn sàng 99,9%. Cả chuỗi sẵn sàng khoảng bao nhiêu?",
    options: ["99,9%, bằng service yếu nhất", "99,6%, vì tỉ lệ nhân với nhau", "99,99%, vì có nhiều service", "Không tính được"],
    answer: 1,
    explain: "0,999^4 ≈ 0,996: mỗi tháng thêm khoảng 2,9 giờ lỗi. Càng nhiều lời gọi đồng bộ nối tiếp, càng dễ hỏng.",
  },
  roadmap: [
    "Chặng 1: chia service và dữ liệu.",
    "Chặng 2: giao tiếp đồng bộ và bất đồng bộ.",
    "Chặng 3: discovery, load balancing, API Gateway.",
    "Chặng 4: dữ liệu phân tán: saga, 2PC, CQRS.",
    "Chặng 5: config và bảo mật giữa service.",
    "Chặng 6: tracing, contract test, triển khai.",
  ],
  sections: [
    {
      id: "boundaries",
      title: "Phần 1: Chia service và dữ liệu",
      scene: "split",
      intro: [
        "Chia theo **năng lực nghiệp vụ** (bounded context trong DDD): order, inventory, payment, notification. Không chia theo tầng kỹ thuật (service \"DAO\", service \"validation\"), vì một tính năng nhỏ sẽ phải sửa và deploy nhiều service cùng lúc. Mỗi service **sở hữu dữ liệu của mình**: service khác chỉ đọc qua API hoặc event, không đọc thẳng bảng.",
        "Dấu hiệu **distributed monolith**: dùng chung một database, phải deploy nhiều service cùng lúc, một request kéo theo chuỗi dài lời gọi đồng bộ, đổi một DTO trong thư viện chung là phải build lại tất cả. Lúc đó có đủ nhược điểm của cả hai kiểu kiến trúc. Ở level 2-3 năm, nói được \"khi nào **không** nên tách\" (team nhỏ, domain chưa rõ, chưa có CI/CD và monitoring tốt) ăn điểm hơn kể tên công nghệ. Phần so sánh monolith và microservices nằm ở bài System Design Concepts, Phần 4.",
      ],
      widget: "service-boundary",
      widgetTitle: "Tách đúng hay distributed monolith",
      quiz: {
        question: "Report-service cần dữ liệu đơn hàng để thống kê. Cách nào giữ được ranh giới service?",
        options: [
          "Report-service đọc thẳng bảng orders của order-service",
          "Order-service publish event, report-service tự lưu bản sao để đọc",
          "Gộp hai service dùng chung một schema cho tiện",
          "Report-service gọi API order-service cho từng dòng báo cáo",
        ],
        answer: 1,
        explain: "Bản sao do event cập nhật là eventual consistency nhưng không khoá schema của order-service. Gọi API cho từng dòng thì thành N+1 qua mạng.",
      },
    },
    {
      id: "communication",
      title: "Phần 2: Gọi đồng bộ hay qua event",
      scene: "comm",
      intro: [
        "**Đồng bộ** (HTTP, gRPC) khi bên gọi cần kết quả ngay để trả lời người dùng: kiểm tra tồn kho trước khi tạo đơn. **Bất đồng bộ** (Kafka, RabbitMQ) khi chỉ cần báo \"việc này đã xảy ra\": đơn đã thanh toán thì gửi email, cộng điểm, cập nhật báo cáo. Gọi đồng bộ nối tiếp thì độ trễ **cộng** lại và độ sẵn sàng **nhân** lại; event giúp service bên kia chết một lúc cũng không làm hỏng request, đổi lại dữ liệu chỉ nhất quán sau một khoảng.",
        "HTTP client trong Spring: `RestClient` (Spring 6.1+, đồng bộ, dùng cho code mới), `WebClient` (reactive, không chặn thread), `RestTemplate` (chế độ bảo trì), HTTP interface `@HttpExchange` (khai báo interface như Feign). Spring Cloud **OpenFeign** đã được đánh dấu feature-complete và chính Spring Cloud khuyên chuyển sang HTTP interface. **gRPC** chạy trên HTTP/2 với protobuf: nhanh, hợp đồng chặt, hợp cho gọi nội bộ, nhưng trình duyệt không gọi thẳng được. Lời gọi nào cũng phải có timeout; retry và circuit breaker xem bài System Design Concepts, Phần 5.",
      ],
      widget: "call-chain",
      widgetTitle: "Chuỗi lời gọi: độ trễ và độ sẵn sàng",
      quiz: {
        question: "Đặt hàng xong cần gửi email, cộng điểm thưởng, cập nhật báo cáo. Gọi thế nào?",
        options: [
          "Gọi đồng bộ cả ba trước khi trả 201 cho người dùng",
          "Publish một event OrderPlaced, ba service tự consume",
          "Gọi song song cả ba bằng CompletableFuture rồi chờ hết",
          "Ghi thẳng vào database của ba service",
        ],
        answer: 1,
        explain: "Ba việc này không ảnh hưởng câu trả lời cho người dùng. Event thì service email chết cũng không làm hỏng việc đặt hàng; nhớ dùng outbox để không mất event.",
      },
    },
    {
      id: "discovery-gateway",
      title: "Phần 3: Service discovery, load balancing, API Gateway",
      scene: "gateway",
      intro: [
        "Instance lên xuống liên tục nên không ghi cứng IP. **Service discovery**: instance tự đăng ký vào registry (Eureka, Consul) và bên gọi hỏi registry; trên Kubernetes thì `Service` đã có tên DNS ổn định và kube-proxy chia tải, thường không cần Eureka. **Client-side load balancing**: bên gọi tự chọn instance (Spring Cloud LoadBalancer, đánh dấu `@LoadBalanced` trên `RestClient.Builder` rồi gọi `http://inventory-service/...`). **Server-side**: gọi qua một địa chỉ chung, load balancer hoặc Kubernetes Service chọn giúp. Ribbon, Hystrix, Zuul đã bị gỡ khỏi Spring Cloud từ 2020.0; thay bằng LoadBalancer, Resilience4j và Spring Cloud Gateway.",
        "**API Gateway** là cửa vào duy nhất từ bên ngoài: định tuyến theo path, xác thực JWT, rate limit, CORS, gắn traceId, gom nhiều lời gọi cho từng loại client (BFF). Spring Cloud Gateway: không route nào khớp thì **404**, `RequestRateLimiter` vượt hạn mức thì **429**, quá `response-timeout` thì **504**, filter `CircuitBreaker` đang OPEN mà không có fallback thì **503**. Gateway không chứa logic nghiệp vụ, và các service phía sau vẫn tự kiểm tra JWT, không tin mạng nội bộ.",
      ],
      widget: "gateway-filters",
      widgetTitle: "Một request đi qua gateway",
      quiz: {
        question: "Gateway đã kiểm tra JWT rồi. Order-service phía sau có cần kiểm tra lại không?",
        options: [
          "Không cần, gateway đã chặn hết request lạ",
          "Có, mỗi service vẫn xác thực token vì không tin mạng nội bộ",
          "Chỉ cần kiểm tra khi chạy ngoài Kubernetes",
          "Không, chỉ cần đọc header X-User-Id do gateway gắn",
        ],
        answer: 1,
        explain: "Nếu một pod trong cụm bị chiếm hoặc ai đó gọi thẳng service, header tự khai không chứng minh gì. Resource server kiểm tra chữ ký JWT bằng JWKS đã cache nên rất rẻ.",
      },
    },
    {
      id: "distributed-data",
      title: "Phần 4: Dữ liệu phân tán: saga, 2PC, CQRS",
      scene: "saga",
      intro: [
        "Không có `@Transactional` chung cho ba database. **2PC** (XA) giữ lock suốt hai vòng gọi qua mạng, coordinator chết thì các bên treo chờ, và Kafka hay phần lớn NoSQL không tham gia XA, nên gần như không dùng giữa các microservice. **Saga** là chuỗi local transaction, mỗi bước có **hành động bù**. **Orchestration**: một orchestrator (thường là order-service với state machine) ra lệnh từng bước, dễ đọc luồng. **Choreography**: mỗi service nghe event rồi phát event tiếp, ít phụ thuộc nhưng luồng nằm rải rác, khó debug khi có nhiều bước.",
        "Bẫy: saga không có isolation, service khác có thể thấy trạng thái dở dang, nên dùng trạng thái trung gian như `PENDING` (semantic lock). Hành động bù phải idempotent và không được \"thất bại\": nó retry đến khi xong. Bước không bù được (gửi hàng, gửi email) đặt sau bước quyết định cuối cùng. Cần join dữ liệu nhiều service: **API composition** (gọi từng service rồi ghép) hoặc **CQRS** (dựng read model riêng từ event, đọc nhanh nhưng trễ một chút).",
      ],
      widget: "saga-run",
      widgetTitle: "Chạy saga đặt hàng",
      quiz: {
        question: "Saga đặt hàng: tạo đơn, giữ kho, thu tiền. Thu tiền thất bại. Điều gì xảy ra?",
        options: [
          "Database tự rollback cả ba bước như một transaction",
          "Chạy bù ngược lại: trả kho, rồi chuyển đơn sang CANCELLED",
          "Giữ nguyên kho đã trừ, chỉ huỷ đơn",
          "Thử thu tiền lại vô hạn cho tới khi thành công",
        ],
        answer: 1,
        explain: "Mỗi bước đã commit ở database riêng, nên chỉ có thể bù bằng một transaction mới, theo thứ tự ngược lại. Đơn để CANCELLED, không xoá, để còn dấu vết.",
      },
    },
    {
      id: "config-security",
      title: "Phần 5: Config và bảo mật giữa service",
      scene: "auth",
      intro: [
        "**Config tập trung**: Spring Cloud Config Server đọc từ Git, client khai báo `spring.config.import=configserver:...` (từ Spring Cloud 2020.0, `bootstrap.yml` không còn bật mặc định). Đổi config lúc chạy bằng `@RefreshScope` và `/actuator/refresh`, nhiều instance thì dùng Spring Cloud Bus. Trên Kubernetes thường dùng ConfigMap; **secret** để trong Secret hoặc Vault, không commit vào repo config.",
        "**Gọi thay mặt người dùng**: chuyển tiếp access token của user (token relay) để service sau còn biết ai đang gọi và kiểm tra quyền. **Service tự gọi** (job đêm, consumer Kafka): dùng grant **client credentials**, token mang danh tính của service, scope hẹp. **mTLS**: hai bên cùng trình chứng chỉ, thường do service mesh (Istio, Linkerd) lo qua sidecar, nên code không phải đổi. Không dùng một API key chung cho mọi service.",
      ],
      widget: "service-auth",
      widgetTitle: "Chọn cách xác thực và cấu hình",
      quiz: {
        question: "Job chạy lúc 2 giờ sáng gọi invoice-service. Không có người dùng nào. Lấy token thế nào?",
        options: [
          "Dùng lại token của tài khoản admin đã lưu sẵn",
          "Grant client credentials, token mang danh tính của job với scope hẹp",
          "Bỏ xác thực cho các lời gọi nội bộ",
          "Ghi cứng một API key dùng chung cho mọi service",
        ],
        answer: 1,
        explain: "Token admin lưu sẵn vừa quá quyền vừa hết hạn; API key chung lộ một chỗ là lộ tất cả. Client credentials cho từng service để thu hồi và giới hạn riêng được.",
      },
    },
    {
      id: "observe-ship",
      title: "Phần 6: Tracing, contract test, triển khai",
      scene: "trace",
      intro: [
        "**Distributed tracing**: request vào gateway được gán một traceId, mỗi chặng là một span. Micrometer Tracing (bridge sang Brave hoặc OpenTelemetry) truyền qua header W3C `traceparent` và đưa `traceId` vào MDC để mọi dòng log có cùng mã. Trace chỉ nối được khi client được instrument: `RestClient` tạo từ `RestClient.Builder` do Boot cấu hình, còn tự `new` thì mất header. Kafka cần bật `spring.kafka.template.observation-enabled` và `spring.kafka.listener.observation-enabled`; `@Async` cần `ContextPropagatingTaskDecorator`. Mặc định Boot chỉ lấy mẫu 10% (`management.tracing.sampling.probability=0.1`).",
        "**Contract test**: consumer ghi lại kỳ vọng với API (Pact, hoặc Spring Cloud Contract phía provider), provider chạy kiểm tra trong CI, nên đổi tên field làm vỡ build thay vì vỡ production. Test phía consumer giả lập HTTP bằng WireMock. **Thay đổi tương thích**: chỉ thêm field; client bỏ qua field lạ (Jackson trong Boot mặc định tắt `FAIL_ON_UNKNOWN_PROPERTIES`); đổi schema theo expand và contract. **Triển khai**: rolling (mặc định của Kubernetes), blue-green (hai môi trường, chuyển traffic và quay lại ngay, tốn gấp đôi tài nguyên), canary (thả vài phần trăm traffic, theo dõi tỉ lệ lỗi rồi tăng dần).",
      ],
      widget: "trace-propagation",
      widgetTitle: "traceId có đi hết đường không",
      quiz: {
        question: "Đổi tên field totalPrice thành total mà không làm vỡ client cũ. Làm thế nào?",
        options: [
          "Đổi luôn rồi báo các team khác sửa theo",
          "Thêm total, trả cả hai field, chờ client chuyển hết rồi mới bỏ totalPrice",
          "Tăng version API lên v2 cho mọi endpoint",
          "Giữ totalPrice nhưng đổi ý nghĩa của nó",
        ],
        answer: 1,
        explain: "Expand rồi contract. Contract test cho biết khi nào không còn consumer nào đọc totalPrice. Lên v2 cho mọi endpoint chỉ cần khi thay đổi lớn.",
      },
    },
  ],
  modelAnswer:
    "Em chia service theo năng lực nghiệp vụ, mỗi service sở hữu database riêng, và chỉ tách khi team và hạ tầng đủ sức, vì dùng chung database hoặc phải deploy cùng nhau là thành distributed monolith. Khi cần kết quả ngay em gọi đồng bộ bằng RestClient có timeout, retry chỉ cho thao tác idempotent và circuit breaker ở phía gọi; còn việc chỉ cần báo đã xảy ra thì em publish event qua outbox, consumer idempotent, vì chuỗi gọi đồng bộ cộng độ trễ và nhân xác suất lỗi. Bên ngoài vào qua API Gateway để định tuyến, xác thực, rate limit, nhưng mỗi service vẫn tự kiểm tra JWT. Không có transaction chung nên em dùng saga, mỗi bước có hành động bù idempotent, trạng thái PENDING để người khác không đọc nhầm dữ liệu dở dang, và không dùng 2PC. Gọi thay mặt user thì chuyển tiếp token, service tự gọi thì dùng client credentials. Để vận hành được, em có traceId xuyên suốt qua HTTP và Kafka, contract test trong CI, đổi API theo kiểu chỉ thêm, và triển khai canary hoặc blue-green để quay lại nhanh.",
};
