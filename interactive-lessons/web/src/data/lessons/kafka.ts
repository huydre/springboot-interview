import timeline from "../timelines/kafka.json";
import type { Lesson, Scene } from "../types";

// Outputs from Kafka 3.9.1 via Testcontainers, kafka-clients 3.9.2 and Spring Kafka 3.3 on JDK 21; see study note 03.11.
// Retry/DLT and RabbitMQ are described, not run.
export const kafka: Lesson = {
  slug: "kafka",
  crumb: "Kafka Basics",
  videoDir: "/videos/kafka-basics",
  // Per-scene clips cut by `video-kit/pipeline.py kafka-video publish`, which also rewrites videoVersion.
  videoVersion: "ca053f25",
  scenes: timeline as Scene[],
  title: "Kafka Basics",
  subtitle:
    "Topic, partition, offset, thứ tự theo key, consumer group, commit offset và delivery semantics, producer an toàn, idempotent consumer, retry và DLT, Kafka với RabbitMQ, transactional outbox.",
  openingQuiz: {
    question: "Topic có 4 partition, scale service lên 6 pod cùng group.id. Chuyện gì xảy ra?",
    options: ["6 pod chia đều message", "4 pod mỗi pod 1 partition, 2 pod ngồi chơi", "Kafka tự tạo thêm 2 partition", "Lỗi khởi động"],
    answer: 1,
    explain: "Đã chạy 6 consumer: consumer-4 và consumer-5 nhận []. Mỗi partition chỉ giao cho đúng 1 consumer trong group.",
  },
  roadmap: [
    "Chặng 1: topic, partition, offset, thứ tự theo key, consumer group.",
    "Chặng 2: commit offset, delivery semantics, producer an toàn, idempotent consumer.",
    "Chặng 3: retry và DLT, Kafka với RabbitMQ, transactional outbox.",
  ],
  sections: [
    {
      id: "log",
      title: "Phần 1: Topic, partition, offset",
      scene: "log",
      intro: [
        "Kafka là **log chỉ ghi thêm**, không phải hàng đợi xoá message sau khi đọc. **Topic** là tên luồng sự kiện; **partition** là log con có thứ tự, đơn vị song song; **offset** là số thứ tự trong một partition. Message giữ theo **retention** (mặc định 7 ngày) dù đã có ai đọc, nên nhiều group đọc độc lập và replay được.",
        "Consumer chủ động **poll** và nhớ vị trí bằng committed offset, lưu trong topic nội bộ `__consumer_offsets`.",
      ],
      quiz: {
        question: "Khác biệt lớn nhất giữa Kafka và một queue truyền thống?",
        options: ["Kafka nhanh hơn", "Message vẫn còn sau khi đọc tới hết retention, nhiều group đọc độc lập và replay được", "Kafka không có thứ tự", "Kafka chỉ dùng cho log"],
        answer: 1,
        explain: "Queue truyền thống xoá message sau khi consumer ack.",
      },
    },
    {
      id: "ordering",
      title: "Phần 2: Thứ tự chỉ trong một partition",
      scene: "order",
      intro: [
        "Producer chọn partition bằng `hash(key) % số partition`, nên **cùng key luôn vào cùng partition**. Dùng `orderId` làm key để `CREATED → PAID → SHIPPED` của một đơn đúng thứ tự. Đã chạy 5 key gửi xen kẽ vào topic 4 partition: thứ tự toàn cục mất, thứ tự theo từng key giữ nguyên.",
        "Bẫy: gửi không có key thì event của một đơn rải nhiều partition, có thể xử lý `PAID` trước `CREATED`; tăng số partition của topic đang chạy làm đổi mapping key; key nóng làm một partition quá tải.",
      ],
      widget: "kafka-ordering",
      widgetTitle: "Gửi xen kẽ, nhận theo partition",
      quiz: {
        question: "Vì sao không nên tăng số partition của topic đang chạy một cách tuỳ tiện?",
        options: ["Vì Kafka cấm", "Công thức hash % N đổi nên key cũ có thể sang partition khác, mất thứ tự giữa message cũ và mới của cùng key", "Vì tốn ổ đĩa", "Vì consumer phải restart"],
        answer: 1,
        explain: "Chọn số partition dư từ đầu.",
      },
    },
    {
      id: "group",
      title: "Phần 3: Consumer group",
      scene: "group",
      intro: [
        "Consumer cùng `group.id` chia nhau partition, **mỗi partition đúng 1 consumer** trong group nên thứ tự trong partition được giữ. Các group khác nhau đọc độc lập với offset riêng: `billing` và `notification` đều nhận đủ event. Consumer vào hoặc ra thì **rebalance**.",
        "Số consumer có ích tối đa bằng số partition; muốn song song hơn thì tăng partition. Xử lý một batch lâu hơn `max.poll.interval.ms` (mặc định 5 phút) thì bị coi là chết, rebalance, message bị xử lý lại. Spring Kafka `concurrency = 3` là 3 consumer trong cùng group.",
      ],
      widget: "consumer-group",
      widgetTitle: "Số consumer so với số partition",
      quiz: {
        question: "Muốn một event tới cả service billing và service email?",
        options: ["Gửi 2 lần", "Cho hai service khác group.id, mỗi group có offset riêng nên đều nhận đủ", "Dùng chung group.id", "Không làm được"],
        answer: 1,
        explain: "Đây là điểm khác lớn với queue truyền thống.",
      },
    },
    {
      id: "delivery",
      title: "Phần 4: Commit offset và delivery semantics",
      scene: "delivery",
      intro: [
        "Xử lý và commit offset là hai bước. Commit trước rồi xử lý: **at-most-once**, crash là mất. Xử lý trước rồi commit: **at-least-once**, crash là xử lý lại. Exactly-once của Kafka chỉ trọn vẹn khi kết quả cũng ghi vào Kafka; ghi DB hay gọi API thì vẫn cần consumer idempotent.",
        "Đã chạy group `billing`, `enable.auto.commit=false`: vòng 1 xử lý 20 message không commit rồi đóng; vòng 2 cùng group nhận lại đủ 20, cả 20 bị bỏ qua vì trùng, bảng `processed_event` đúng 20 dòng. Spring Kafka tắt auto commit của client và commit theo `AckMode` (mặc định `BATCH`).",
      ],
      widget: "delivery-semantics",
      widgetTitle: "Crash giữa xử lý và commit",
      quiz: {
        question: "Listener đẩy việc sang thread pool rồi trả về ngay. Rủi ro gì?",
        options: ["Không rủi ro", "Offset được commit trong khi việc thật chưa xong: crash là mất message", "Chạy chậm hơn", "Mất thứ tự là duy nhất"],
        answer: 1,
        explain: "Xử lý xong rồi mới để listener trả về.",
      },
    },
    {
      id: "producer",
      title: "Phần 5: Producer an toàn và idempotent consumer",
      scene: "idem",
      intro: [
        "`acks=0` không chờ, `acks=1` chờ leader, `acks=all` chờ mọi replica in-sync (kết hợp replication factor 3 và `min.insync.replicas=2` của topic). Đã đọc mặc định của `kafka-clients` 3.9.2: `acks=-1  enable.idempotence=true`; tài liệu cũ ghi `acks=1` là hành vi trước 3.0. Idempotent producer chỉ chống trùng do retry nội bộ của producer, không chống ứng dụng gửi lại.",
        "Consumer idempotent: insert `eventId` (PRIMARY KEY, do producer sinh) vào `processed_event` **cùng transaction** với thay đổi nghiệp vụ, trùng thì bỏ qua; hoặc `UPDATE ... WHERE status = 'CREATED'`. Đừng SELECT rồi mới INSERT, đừng dùng offset làm id. Xoá dòng cũ hơn retention cộng biên an toàn.",
      ],
      quiz: {
        question: "Đã bật idempotent producer, sao consumer vẫn phải idempotent?",
        options: [
          "Không cần nữa",
          "Producer idempotent chỉ chống trùng khi ghi vào Kafka; trùng phía consumer đến từ crash hoặc rebalance trước khi commit",
          "Vì Kafka không tin producer",
          "Vì consumer chậm",
        ],
        answer: 1,
        explain: "Hai lớp trùng khác nhau, hai biện pháp khác nhau.",
      },
    },
    {
      id: "dlt",
      title: "Phần 6: Retry và Dead Letter Topic",
      scene: "dlt",
      intro: [
        "Retry mãi một message lỗi vĩnh viễn chặn cả partition phía sau. Cách chuẩn: retry vài lần có backoff, vẫn lỗi thì đẩy sang `<topic>.DLT` để xem xét, rồi đi tiếp. Spring Kafka: `DefaultErrorHandler` với `DeadLetterPublishingRecoverer` và `FixedBackOff`, đánh dấu lỗi dữ liệu là not-retryable (phần này mô tả, chưa chạy).",
        "Blocking retry giữ thứ tự nhưng chặn partition; `@RetryableTopic` (non-blocking) chạy tiếp nhưng mất thứ tự. `DefaultErrorHandler` không có recoverer thử tổng 10 lần rồi chỉ log và bỏ qua: mất message nếu không cấu hình DLT. DLT phải có alert và quy trình replay.",
      ],
      quiz: {
        question: "Consumer lag tăng mãi, nên làm gì?",
        options: [
          "Thêm consumer vượt số partition",
          "Tối ưu xử lý, tăng consumer tới tối đa bằng số partition hoặc tăng partition, và kiểm tra message lỗi đang retry chặn partition",
          "Tắt commit",
          "Giảm retention",
        ],
        answer: 1,
        explain: "Lag là số message còn tồn giữa offset mới nhất và offset đã commit.",
      },
    },
    {
      id: "outbox",
      title: "Phần 7: Kafka với RabbitMQ và transactional outbox",
      scene: "outbox",
      intro: [
        "Kafka: log phân tán, consumer kéo theo offset, message còn tới hết retention, replay được, throughput rất cao; hợp event streaming, nhiều service cùng nghe, CDC. RabbitMQ: broker đẩy message, xoá sau ack, routing linh hoạt (exchange direct, topic, fanout); hợp task queue, RPC, ưu tiên message.",
        "Lưu đơn và gửi `OrderCreated` trong `@Transactional`: gửi rồi DB rollback là event ma; commit rồi crash trước khi gửi là mất event. **Outbox**: insert đơn và một dòng `outbox` trong cùng transaction; poller hoặc CDC (Debezium) publish lên Kafka. Event được gửi ít nhất một lần khi và chỉ khi DB đã commit, nên consumer vẫn phải idempotent.",
      ],
      quiz: {
        question: "@TransactionalEventListener(phase = AFTER_COMMIT) so với outbox?",
        options: ["Giống hệt", "Không có event ma nhưng vẫn có thể mất event nếu crash ngay sau commit; outbox thì không mất", "Outbox kém an toàn hơn", "AFTER_COMMIT là exactly-once"],
        answer: 1,
        explain: "Outbox biến gửi event thành ghi một dòng DB trong cùng transaction.",
      },
    },
  ],
  modelAnswer:
    "Kafka là log phân tán: topic chia partition, mỗi partition có thứ tự và offset riêng, message giữ theo retention nên nhiều group đọc độc lập. Thứ tự chỉ đảm bảo trong một partition, nên em dùng orderId làm key; em đã gửi xen kẽ 5 key vào topic 4 partition và thấy thứ tự theo từng key được giữ. Mỗi partition chỉ giao cho một consumer trong group, em chạy 6 consumer cho 4 partition thì 2 consumer ngồi chơi. Em dùng at-least-once: xử lý xong mới commit, và consumer idempotent bằng bảng processed_event có eventId là khoá chính trong cùng transaction; em thử crash trước khi commit thì 20 message được giao lại và cả 20 bị bỏ qua. Producer mới mặc định đã acks=all và idempotence nhưng em vẫn ghi tường minh. Message lỗi em retry có giới hạn rồi đẩy sang DLT, và để gửi event cùng với ghi DB em dùng transactional outbox.",
};
