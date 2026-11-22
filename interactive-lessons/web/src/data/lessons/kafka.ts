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
        "Kafka chạy trên nhiều máy chủ, mỗi máy gọi là một **broker**. Mỗi partition được chép thành nhiều bản (**replica**) trên các broker khác nhau, để một broker chết thì dữ liệu không mất. Một replica làm **leader**: producer ghi vào và consumer đọc từ nó. Các replica còn lại là **follower**, liên tục chép từ leader.",
        "Follower nào đang theo kịp leader thì gọi là **in-sync**; tập các replica đó là **ISR** (in-sync replicas). Leader chết thì Kafka chọn leader mới trong ISR, vì chỉ các bản đó chắc chắn có đủ dữ liệu. Phần 5 dùng lại các khái niệm này khi nói về `acks`.",
        "Consumer chủ động **poll** (hỏi broker xin message mới) và nhớ đã đọc tới đâu bằng **committed offset**, lưu trong topic nội bộ `__consumer_offsets`.",
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
        "Xử lý message và commit offset là hai bước riêng. Commit trước rồi xử lý: **at-most-once**, crash giữa hai bước là mất message. Xử lý trước rồi commit: **at-least-once**, crash giữa hai bước là message được giao lại và xử lý lần nữa.",
        "**Exactly-once** của Kafka chỉ trọn vẹn khi kết quả cũng ghi vào Kafka. Lý do: Kafka transaction commit message đầu ra và offset cùng lúc, nhưng nó không bao được database hay API của bạn. Ghi DB hay gọi API thì vẫn cần consumer idempotent (Phần 5).",
        "Thử nghiệm: group `billing`, `enable.auto.commit=false`. Vòng 1 xử lý 20 message nhưng không commit rồi đóng consumer. Vòng 2, cùng group, nhận lại đủ 20 message vì offset chưa được commit. Consumer idempotent (cách làm ở Phần 5) bỏ qua cả 20 vì đã thấy rồi, nên bảng `processed_event` vẫn đúng 20 dòng.",
        "Spring Kafka tắt auto commit của client và tự commit theo `AckMode`, tức chế độ quyết định khi nào commit (mặc định `BATCH`: commit sau khi listener xử lý xong cả lô vừa poll). Vì commit xảy ra **sau khi listener trả về**, nếu listener đẩy việc sang thread pool rồi trả về ngay thì offset được commit khi việc thật chưa xong. Crash lúc đó là mất message.",
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
      title: "Phần 5: Producer an toàn",
      scene: "idem",
      intro: [
        "`acks` là số xác nhận producer chờ trước khi coi là gửi xong. `acks=0`: không chờ gì. `acks=1`: chờ leader ghi xong. `acks=all`: chờ leader và mọi replica in-sync (ISR, Phần 1) ghi xong. Trong code và log, `all` được viết là `-1`: hai cách ghi là một.",
        "`acks=all` chỉ thật sự an toàn khi topic có replication factor 3 và `min.insync.replicas=2` (cấu hình của topic). Lý do: nếu ISR chỉ còn mỗi leader thì \"mọi replica in-sync\" cũng chỉ là một máy, và `min.insync.replicas=2` bắt broker từ chối ghi trong trường hợp đó.",
        "Đã đọc mặc định của `kafka-clients` 3.9.2: `acks=-1  enable.idempotence=true`, tức `acks=all` và idempotent producer bật sẵn. Tài liệu cũ ghi mặc định `acks=1` là hành vi trước 3.0.",
        "**Idempotent producer** chỉ chống trùng do retry nội bộ của producer (mất ack rồi gửi lại), không chống việc ứng dụng tự gọi `send` lần nữa.",
      ],
      quiz: {
        question: "Log cấu hình producer in ra `acks=-1`. Nghĩa là gì?",
        options: [
          "Không chờ xác nhận nào",
          "Giống acks=all: chờ leader và mọi replica in-sync ghi xong",
          "Cấu hình lỗi, Kafka sẽ dùng acks=1",
          "Chỉ chờ một follower",
        ],
        answer: 1,
        explain: "-1 là cách Kafka ghi giá trị all. Từ kafka-clients 3.0 đây là mặc định.",
      },
      parts: [
        {
          id: "idempotent-consumer",
          title: "Consumer idempotent",
          intro: [
            "Phần 4 cho thấy at-least-once nghĩa là một message có thể được giao lại. Consumer **idempotent** là consumer xử lý cùng một message hai lần mà kết quả vẫn như một lần.",
            "Cách làm: producer sinh một `eventId` duy nhất cho mỗi event. Consumer insert `eventId` (PRIMARY KEY) vào bảng `processed_event` **cùng transaction** với thay đổi nghiệp vụ. Insert bị trùng khoá nghĩa là đã xử lý rồi, bỏ qua. Cùng transaction để không có chuyện ghi nghiệp vụ xong mà chưa ghi `eventId`, hoặc ngược lại.",
            "Đừng SELECT xem có chưa rồi mới INSERT: hai consumer cùng SELECT thấy chưa có, rồi cả hai cùng xử lý. Khoá chính thì database chặn giúp bạn.",
            "Đừng dùng offset làm id: một message bị ứng dụng gửi lại sẽ có **offset mới**, nên so offset không phát hiện được bản trùng. `eventId` đi theo nội dung event nên bản gửi lại vẫn mang id cũ.",
            "Cách khác khi nghiệp vụ có trạng thái: `UPDATE ... WHERE status = 'CREATED'`. Lần chạy thứ hai thấy status đã đổi nên cập nhật 0 dòng, thành không làm gì.",
            "Dọn bảng: xoá các dòng cũ hơn retention của topic cộng một biên an toàn, vì message cũ hơn thế không thể được giao lại nữa.",
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
      ],
    },
    {
      id: "dlt",
      title: "Phần 6: Retry và Dead Letter Topic",
      scene: "dlt",
      intro: [
        "Retry mãi một message lỗi vĩnh viễn chặn cả partition phía sau. Cách chuẩn: retry vài lần có backoff, vẫn lỗi thì đẩy sang `<topic>.DLT` để xem xét, rồi đi tiếp. Spring Kafka: `DefaultErrorHandler` với `DeadLetterPublishingRecoverer` và `FixedBackOff`, đánh dấu lỗi dữ liệu là not-retryable (phần này mô tả, chưa chạy).",
        "Blocking retry giữ thứ tự nhưng chặn partition; `@RetryableTopic` (non-blocking) chạy tiếp nhưng mất thứ tự. `DefaultErrorHandler` không có recoverer thử tổng 10 lần rồi chỉ log và bỏ qua: mất message nếu không cấu hình DLT. DLT phải có alert và quy trình replay.",
        "Chỉ số cần theo dõi là **consumer lag**: số message còn tồn, tức khoảng cách giữa offset mới nhất của partition và offset group đã commit. Lag tăng mãi nghĩa là consumer xử lý chậm hơn tốc độ ghi, hoặc đang kẹt ở một message lỗi retry mãi.",
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
        "So sánh nhanh. Kafka: log phân tán, consumer kéo theo offset, message còn tới hết retention, replay được, throughput rất cao; hợp event streaming, nhiều service cùng nghe, CDC. RabbitMQ: broker đẩy message, xoá sau ack, routing linh hoạt (exchange direct, topic, fanout); hợp task queue, RPC, ưu tiên message.",
        "Vấn đề tiếp theo không liên quan tới so sánh trên: lưu đơn và gửi `OrderCreated` trong `@Transactional`. Gửi rồi DB rollback thì có **event ma** (event của đơn không tồn tại). Commit rồi crash trước khi gửi thì **mất event**.",
        "Cách nửa vời: `@TransactionalEventListener(phase = AFTER_COMMIT)` chỉ gửi sau khi DB commit, nên hết event ma. Nhưng app crash ngay sau commit, trước khi gửi, thì event vẫn mất.",
        "**Outbox**: insert đơn và một dòng vào bảng `outbox` trong cùng transaction. Một tiến trình khác đọc bảng `outbox` và publish lên Kafka: hoặc poller định kỳ query bảng, hoặc **CDC** (change data capture: đọc log thay đổi của database, ví dụ công cụ Debezium). Event được gửi ít nhất một lần khi và chỉ khi DB đã commit, nên consumer vẫn phải idempotent.",
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
