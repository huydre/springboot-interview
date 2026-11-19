import timeline from "../timelines/sd-concepts.json";
import type { Lesson, Scene } from "../types";

// Concepts from study note 10.01. The note is conceptual: no performance numbers, configuration values are examples.
export const sdConcepts: Lesson = {
  slug: "sd-concepts",
  crumb: "System Design Concepts",
  videoDir: "/videos/sd-concepts",
  videoVersion: "dea7c5fc",
  scenes: timeline as Scene[],
  title: "System Design Concepts",
  subtitle:
    "Scale và stateless, load balancer và API gateway, cache nhiều tầng, message queue, replication, sharding, CAP, microservices, timeout, retry, circuit breaker, saga, outbox, rate limiting, observability.",
  openingQuiz: {
    question: "Scale order-service từ 1 lên 3 instance. Job @Scheduled gửi email mỗi giờ sẽ thế nào?",
    options: ["Chạy 1 lần như cũ", "Chạy trên cả 3 instance: gửi 3 lần", "Không chạy", "Load balancer tự chọn một"],
    answer: 1,
    explain: "Cần distributed lock như ShedLock, hoặc tách job ra chỗ riêng.",
  },
  roadmap: [
    "Chặng 1: scale, stateless, load balancer, cache, queue.",
    "Chặng 2: replication, sharding, CAP, microservices.",
    "Chặng 3: resilience, saga và outbox, rate limiting, observability.",
  ],
  sections: [
    {
      id: "scale",
      title: "Phần 1: Scale, stateless, load balancer",
      scene: "scale",
      intro: [
        "**Scale dọc** tăng CPU, RAM một máy: đơn giản nhưng có trần và vẫn là single point of failure, hay dùng cho DB. **Scale ngang** thêm máy chạy cùng app: cần load balancer và app phải **stateless**, tức mỗi request tự mang đủ thông tin (JWT), state dùng chung đẩy ra Redis hoặc DB.",
        "Reverse proxy ẩn server, SSL termination; load balancer chia tải giữa các bản sao giống nhau (L4 nhìn IP và port, L7 đọc HTTP), loại instance qua health check `/actuator/health`; API gateway route theo API, xác thực, rate limit. Forward proxy thì đứng trước client. Gateway cũng phải scale ngang và không chứa logic nghiệp vụ.",
      ],
      widget: "stateless-check",
      widgetTitle: "Còn đúng khi chạy 3 instance không",
      quiz: {
        question: "Database có scale ngang dễ như app stateless không?",
        options: ["Có", "Không: DB chính là nơi giữ state; scale đọc bằng replica, scale ghi phải partition hoặc shard", "Chỉ với PostgreSQL", "Chỉ cần thêm load balancer"],
        answer: 1,
        explain: "Thường scale dọc DB trước, thêm cache và replica, sharding là bước cuối.",
      },
    },
    {
      id: "cache-queue",
      title: "Phần 2: Cache nhiều tầng và message queue",
      scene: "cachequeue",
      intro: [
        "Tầng cache: browser (`Cache-Control`, `ETag`), CDN, local (Caffeine), distributed (Redis), buffer pool của DB. Cache-aside: miss thì đọc DB rồi nạp; ghi thì cập nhật DB rồi **xoá** key. Write-through ghi cả hai cùng lúc, write-behind ghi DB sau. Không dùng số tồn kho trong cache để quyết định bán.",
        "Queue mang lại decoupling, load leveling, chịu lỗi, response nhanh hơn; đổi lại là eventual consistency. Kafka là log lưu lâu, đọc lại được, thứ tự trong partition; RabbitMQ là broker, xoá sau ack. At-least-once nên consumer phải idempotent (bảng `processed_event` có unique constraint cùng transaction), message lỗi mãi thì đưa vào DLQ.",
      ],
      quiz: {
        question: "@Async khác message queue ở điểm cốt lõi nào?",
        options: ["@Async nhanh hơn", "@Async chạy trong cùng JVM, app crash là mất; queue lưu bền vững ngoài app, có retry", "Queue chỉ dùng cho microservices", "Không khác"],
        answer: 1,
        explain: "Việc phải đảm bảo xảy ra thì dùng queue.",
      },
    },
    {
      id: "data",
      title: "Phần 3: Replication, sharding, CAP",
      scene: "data",
      intro: [
        "Replication: ghi vào primary, đọc chia sang replica, primary chết thì promote replica. Đồng bộ thì không mất dữ liệu nhưng ghi chậm; bất đồng bộ thì có replication lag. Spring: `AbstractRoutingDataSource` đưa `readOnly = true` sang replica, bọc `LazyConnectionDataSourceProxy`. Bẫy read-your-own-writes; replica không scale ghi và không thay được backup.",
        "Partitioning chia bảng trong một server; sharding chia ra nhiều server: chọn shard key sai là lỗi đắt nhất, `hash % N` chuyển gần hết dữ liệu khi thêm node, consistent hashing thì không. CAP: mạng luôn có thể đứt, nên khi đứt chọn **CP** (số dư, tồn kho) hay **AP** (feed, lượt xem), theo từng chức năng. C của CAP khác C của ACID.",
      ],
      widget: "sd-pick",
      widgetTitle: "Chọn khối xây dựng",
      quiz: {
        question: "Replication và backup khác nhau thế nào?",
        options: ["Giống nhau", "Replication sao chép mọi thay đổi kể cả xoá nhầm; backup là bản chụp để quay lại quá khứ", "Backup nhanh hơn", "Replication chỉ cho MySQL"],
        answer: 1,
        explain: "Cần cả hai.",
      },
    },
    {
      id: "microservices",
      title: "Phần 4: Monolith và microservices",
      scene: "micro",
      intro: [
        "Microservices deploy độc lập, scale riêng service nóng, hợp nhiều team; trả giá bằng gọi qua mạng, không có transaction chung, debug cần distributed tracing. Monolith một `@Transactional` là xong. **Modular monolith** là điểm giữa: chia module theo domain, chỉ gọi qua interface công khai.",
        "Câu trả lời tốt là \"tuỳ\" kèm lý do. Distributed monolith (chung DB, gọi đồng bộ dây chuyền, phải deploy cùng nhau) có hết nhược điểm của cả hai. Mỗi service sở hữu DB riêng. Tách dần theo strangler fig, bắt đầu từ module ít phụ thuộc như notification.",
      ],
      quiz: {
        question: "Vì sao mỗi microservice nên có DB riêng?",
        options: ["Để rẻ hơn", "Dùng chung DB thì đổi schema của A làm hỏng B, không deploy độc lập được", "Vì bắt buộc", "Để nhanh hơn"],
        answer: 1,
        explain: "Đổi lại, join dữ liệu nhiều service trở nên khó.",
      },
    },
    {
      id: "resilience",
      title: "Phần 5: Timeout, retry, circuit breaker",
      scene: "resilience",
      intro: [
        "Service bên kia chậm thì mỗi request giữ một thread Tomcat, pool cạn và lỗi lan dây chuyền. **Timeout** bắt buộc (`setConnectTimeout`, `setReadTimeout` cho `RestClient`), dựa trên p99 của bên kia và nhỏ hơn timeout của bên gọi mình. **Retry** có backoff và jitter, chỉ cho thao tác idempotent. **Circuit breaker** ở bên gọi: CLOSED → OPEN khi lỗi nhiều → HALF_OPEN cho vài request thử.",
        "Bẫy: retry `POST /charge` không có idempotency key có thể trừ tiền hai lần; retry không backoff thành retry storm; fallback trả dữ liệu giả như thật; annotation Resilience4j qua proxy nên self-invocation không có tác dụng. Bulkhead giới hạn số lời gọi đồng thời tới một dependency.",
      ],
      widget: "circuit-breaker",
      widgetTitle: "Điều khiển circuit breaker",
      quiz: {
        question: "Mặc định trong Resilience4j, Retry và CircuitBreaker bọc nhau thế nào?",
        options: ["CircuitBreaker bọc ngoài Retry", "Retry bọc ngoài CircuitBreaker, nên mỗi lần retry đều được đếm", "Không liên quan", "Chỉ chạy một cái"],
        answer: 1,
        explain: "Theo thứ tự aspect mặc định.",
      },
    },
    {
      id: "saga-ops",
      title: "Phần 6: Saga, outbox, rate limiting, observability",
      scene: "sagaops",
      intro: [
        "**Saga**: chuỗi local transaction, mỗi bước có hành động bù (đơn PENDING → CANCELLED, giữ kho → trả kho, thu tiền → hoàn tiền); choreography qua event hoặc orchestration bằng orchestrator. Hành động bù không phải rollback; bước không bù được đặt cuối. **Outbox**: ghi event vào bảng outbox cùng transaction, relay (`@Scheduled` hoặc Debezium) gửi đi, consumer vẫn idempotent. 2PC chậm và dễ treo.",
        "Rate limiting trả **429** kèm `Retry-After`; token bucket phổ biến nhất; nhiều instance thì đếm trên Redis, làm `INCR` + `EXPIRE` nguyên tử bằng Lua; login giới hạn theo tài khoản và IP. Observability: logs (JSON, có traceId), metrics (Micrometer, p95/p99, HikariCP), traces (Micrometer Tracing + OpenTelemetry, header `traceparent`). Không gắn tag metrics có giá trị vô hạn như `userId`.",
      ],
      quiz: {
        question: "API bỗng chậm. Điều tra theo thứ tự nào hợp lý?",
        options: ["Đọc code từ đầu", "Metrics (từ lúc nào, endpoint nào, HikariCP, GC) → trace của request chậm → log theo traceId → EXPLAIN nếu nghi DB", "Restart server", "Tăng RAM"],
        answer: 1,
        explain: "Chỉ nhìn latency trung bình dễ bỏ sót p99 tệ.",
      },
    },
  ],
  modelAnswer:
    "Ở level của em, em tập trung vào lý do và trade-off. Muốn scale ngang thì app phải stateless: session, cache trong RAM, @Scheduled và file local đều phải đưa ra chỗ dùng chung. Để giảm tải DB em dùng cache-aside với Redis, khi ghi thì cập nhật DB rồi xoá key, và cẩn thận stampede, penetration, avalanche. Việc không cần làm ngay em đẩy qua message queue, consumer idempotent vì at-least-once. Khi gọi service khác em luôn đặt timeout, chỉ retry thao tác idempotent có backoff, và dùng circuit breaker ở bên gọi. Không có transaction chung giữa các service nên em dùng saga có hành động bù, và outbox để ghi DB và publish event không lệch nhau. Cuối cùng là logs, metrics, traces để biết hệ thống đang chậm ở đâu.",
};
