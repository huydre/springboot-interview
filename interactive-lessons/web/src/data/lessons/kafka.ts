import timeline from "../timelines/kafka.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs from Kafka 3.9.1 via Testcontainers, kafka-clients 3.9.2 and Spring Kafka 3.3 on JDK 21; see study note 03.11.
// Retry/DLT and RabbitMQ are described, not run.
// auto.offset.reset, --reset-offsets and --describe ran with the CLI tools in the apache/kafka:3.9.1 Docker image.
// Manual ack, nack and the poison-pill runs used a standalone KafkaMessageListenerContainer (Spring Kafka 3.3.16, no Boot) against that broker.
// "Why Kafka is fast" and async send() are described, not measured.
export const kafka: Lesson = {
  slug: "kafka",
  crumb: "Kafka Basics",
  videoDir: "/videos/kafka-basics",
  // Per-scene clips cut by `video-kit/pipeline.py kafka-video publish`, which also rewrites videoVersion.
  videoVersion: "ca053f25",
  scenes: timeline as Scene[],
  title: "Kafka Basics",
  subtitle:
    "Topic, partition, offset, vì sao Kafka nhanh, thứ tự theo key, consumer group, auto.offset.reset và replay, commit offset, manual ack, delivery semantics, producer an toàn, send() bất đồng bộ, idempotent consumer, retry, DLT và poison pill, consumer lag, Kafka với RabbitMQ, transactional outbox.",
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
        "Kafka là **log chỉ ghi thêm**, không phải hàng đợi xoá message sau khi đọc. Giống một cuốn sổ chỉ viết thêm vào trang cuối: đọc xong không ai xé trang nào, mỗi người tự kẹp đánh dấu trang mình đang đọc.",
        "Ba khái niệm gốc:",
        "- **Topic**: tên luồng sự kiện.",
        "- **Partition**: log con có thứ tự, đơn vị song song.",
        "- **Offset**: số thứ tự trong một partition.",
        "Message giữ theo **retention** (mặc định 7 ngày) dù đã có ai đọc, nên nhiều group đọc độc lập và replay được.",
        "Kafka chạy trên nhiều máy chủ:",
        "- **Broker**: mỗi máy chủ Kafka.",
        "- **Replica**: mỗi partition được chép thành nhiều bản trên các broker khác nhau, để một broker chết thì dữ liệu không mất.",
        "- **Leader**: một replica mà producer ghi vào và consumer đọc từ nó.",
        "- **Follower**: các replica còn lại, liên tục chép từ leader.",
        "Follower nào đang theo kịp leader thì gọi là **in-sync**; tập các replica đó là **ISR** (in-sync replicas). Leader chết thì Kafka chọn leader mới trong ISR, vì chỉ các bản đó chắc chắn có đủ dữ liệu. Phần 5 dùng lại các khái niệm này khi nói về `acks`.",
        "Consumer chủ động **poll** (hỏi broker xin message mới) và nhớ đã đọc tới đâu bằng **committed offset**, lưu trong topic nội bộ `__consumer_offsets`.",
      ],
      quiz: {
        question: "Khác biệt lớn nhất giữa Kafka và một queue truyền thống?",
        options: ["Kafka nhanh hơn", "Message vẫn còn sau khi đọc tới hết retention, nhiều group đọc độc lập và replay được", "Kafka không có thứ tự", "Kafka chỉ dùng cho log"],
        answer: 1,
        explain: "Queue truyền thống xoá message sau khi consumer ack.",
      },
      parts: [
        {
          id: "kafka-fast",
          title: "Vì sao Kafka nhanh dù ghi xuống đĩa",
          intro: [
            "Ta đã biết Kafka giữ mọi message trên đĩa tới hết retention. Đĩa chậm hơn RAM rất nhiều, vậy sao Kafka vẫn được chọn cho hệ thống throughput cao? Câu này gần như luôn được hỏi.",
            "Một queue ngây thơ trên đĩa sẽ chậm vì ba thứ: ghi vào chỗ ngẫu nhiên trên đĩa, xoá từng message sau khi đọc, và copy dữ liệu qua lại nhiều lần trong bộ nhớ ứng dụng. Kafka né cả ba:",
            "- **Chỉ ghi nối đuôi**: mỗi partition là các file segment, message mới luôn ghi vào cuối file. Ghi tuần tự rẻ hơn nhiều so với ghi ngẫu nhiên. Không có update hay delete từng message: hết retention thì xoá nguyên segment cũ.",
            "- **Dựa vào page cache của OS**: broker không tự cache message trong heap JVM. Dữ liệu vừa ghi nằm trong page cache (RAM do OS quản lý), nên consumer đọc gần đuôi log thường đọc từ RAM. Heap broker nhỏ nên GC nhẹ, và restart process broker thì page cache vẫn còn.",
            "- **Zero-copy**: gửi dữ liệu từ page cache thẳng ra socket bằng lời gọi `sendfile` của OS (Java: `FileChannel.transferTo`), không copy qua bộ nhớ của process. Khi bật TLS thì mất lợi thế này, vì dữ liệu phải được mã hoá bên trong process.",
            "- **Batching và nén**: producer gom nhiều message thành một batch (`batch.size`, chờ thêm `linger.ms` để gom), nén cả batch (`compression.type` như `lz4`, `zstd`). Broker thường giữ nguyên batch đã nén, consumer fetch cả batch. Ít request mạng hơn, ít byte hơn.",
            "- **Partition**: chia một topic ra nhiều broker và nhiều consumer chạy song song.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Ghi nối đuôi → đĩa làm việc tuần tự. Page cache → đọc message mới từ RAM. Zero-copy → gửi ra mạng không qua heap. Batch và nén → ít request, ít byte.",
            ],
          },
          quiz: {
            question: "Máy broker có 64 GB RAM, nhưng heap JVM của broker thường chỉ vài GB. Vì sao?",
            options: [
              "Vì Kafka không cần RAM",
              "Vì broker dựa vào page cache của OS để cache dữ liệu log; để RAM cho OS, heap nhỏ thì GC nhẹ",
              "Vì JVM không dùng được quá vài GB",
              "Vì message bị nén nên không cần RAM",
            ],
            answer: 1,
            explain: "Dữ liệu log nằm trong page cache do OS quản lý, ngoài heap. Heap lớn không giúp đọc nhanh hơn mà chỉ làm GC nặng hơn.",
          },
        },
      ],
    },
    {
      id: "ordering",
      title: "Phần 2: Thứ tự chỉ trong một partition",
      scene: "order",
      intro: [
        "Mỗi partition có thứ tự riêng. Nhưng topic có nhiều partition thì thứ tự giữa chúng ra sao? Producer chọn partition bằng `hash(key) % số partition`, nên **cùng key luôn vào cùng partition**. Dùng `orderId` làm key để `CREATED → PAID → SHIPPED` của một đơn đúng thứ tự.",
        "Ba bẫy:",
        "- **Gửi không có key**: event của một đơn rải nhiều partition, có thể xử lý `PAID` trước `CREATED`.",
        "- **Tăng số partition của topic đang chạy**: làm đổi mapping key.",
        "- **Key nóng**: làm một partition quá tải.",
      ],
      board: {
        title: "Cùng key thì cùng partition, nên giữ thứ tự",
        highlight: "cùng partition",
        chips: ["Thứ tự chỉ có trong một partition"],
        cards: [
          {
            title: "Chọn partition theo key",
            diagram: {
              kind: "pipe",
              from: "Event có key = orderId",
              via: "hash(key) % số partition",
              to: "Cùng một partition",
              skipped: ["Gửi không có key"],
              skippedLabel: "Bẫy",
            },
            notes: ["`CREATED`, `PAID`, `SHIPPED` của một đơn vào cùng partition nên đúng thứ tự.", "Tăng số partition của topic đang chạy làm đổi mapping key."],
            takeaway: "Muốn đúng thứ tự theo đơn thì dùng orderId làm key",
          },
        ],
        conclusion: "**Kết luận:** Kafka chỉ bảo đảm thứ tự trong một partition, nên chọn key đúng.",
      },
      predict: {
        question: "Gửi xen kẽ 5 key (A, B, C, D, E), mỗi key 4 message, vào topic 4 partition. Đọc lại thì thứ tự thế nào?",
        options: [
          "Giữ nguyên thứ tự gửi của toàn bộ 20 message",
          "Thứ tự toàn cục mất, nhưng mỗi key vẫn đúng thứ tự",
          "Mất cả thứ tự toàn cục lẫn thứ tự theo key",
          "Ngẫu nhiên mỗi lần đọc",
        ],
        answer: 1,
        explain: "Cùng key vào cùng partition, và trong một partition thứ tự được giữ. Giữa các partition thì không có thứ tự chung.",
      },
      widget: "kafka-ordering",
      widgetTitle: "Gửi xen kẽ, nhận theo partition",
      after: [
        "Đã chạy 5 key gửi xen kẽ vào topic 4 partition: thứ tự toàn cục mất, thứ tự theo từng key giữ nguyên.",
      ],
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
        "Partition là đơn vị song song, vậy ai đọc partition nào? Consumer cùng `group.id` chia nhau partition, **mỗi partition đúng 1 consumer** trong group nên thứ tự trong partition được giữ. Các group khác nhau đọc độc lập với offset riêng: `billing` và `notification` đều nhận đủ event. Consumer vào hoặc ra thì **rebalance**.",
        "Số consumer có ích tối đa bằng số partition; muốn song song hơn thì tăng partition. Xử lý một batch lâu hơn `max.poll.interval.ms` (mặc định 5 phút) thì bị coi là chết, rebalance, message bị xử lý lại. Spring Kafka `concurrency = 3` là 3 consumer trong cùng group.",
      ],
      board: {
        title: "Mỗi partition đúng một consumer trong group",
        highlight: "đúng một consumer",
        chips: ["Group khác nhau đọc độc lập"],
        cards: [
          {
            title: "Chia partition trong group",
            diagram: {
              kind: "hub",
              inputs: [{ label: "partition 0" }, { label: "partition 1" }, { label: "partition 2" }],
              center: "Group billing",
              rulesTitle: "Luật của group",
              rules: ["Mỗi partition đúng 1 consumer", "Consumer vào hoặc ra: rebalance", "Consumer có ích tối đa = số partition"],
            },
            notes: ["`billing` và `notification` là hai group nên đều nhận đủ event, offset riêng.", "Xử lý batch lâu hơn `max.poll.interval.ms` bị coi là chết và gây rebalance."],
            takeaway: "Muốn song song hơn thì tăng partition",
          },
        ],
        conclusion: "**Kết luận:** partition là đơn vị song song, và group quyết định ai đọc partition nào.",
      },
      widget: "consumer-group",
      predict: {
        question: "Topic có 4 partition. Chạy **6 consumer** cùng `group.id`. Chuyện gì xảy ra?",
        options: [
          "Cả 6 consumer cùng chia việc, nhanh hơn 4 consumer",
          "4 consumer mỗi người một partition, 2 consumer ngồi chơi",
          "Kafka từ chối 2 consumer thừa",
          "Mỗi partition được 2 consumer đọc chung",
        ],
        answer: 1,
        explain: "Mỗi partition chỉ giao cho đúng 1 consumer trong group, nên số consumer có ích tối đa bằng số partition.",
      },
      widgetTitle: "Số consumer so với số partition",
      quiz: {
        question: "Muốn một event tới cả service billing và service email?",
        options: ["Gửi 2 lần", "Cho hai service khác group.id, mỗi group có offset riêng nên đều nhận đủ", "Dùng chung group.id", "Không làm được"],
        answer: 1,
        explain: "Đây là điểm khác lớn với queue truyền thống.",
      },
      parts: [
        {
          id: "offset-reset",
          title: "auto.offset.reset và cách đọc lại (replay)",
          intro: [
            "Mỗi group nhớ vị trí bằng committed offset. Nhưng một group **mới tinh** chưa commit gì thì bắt đầu đọc từ đâu?",
            "Tình huống: topic `orders` đã có 6 đơn. Team deploy service mới với group `g-latest`, không cấu hình gì thêm. Service chạy, không lỗi, nhưng không xử lý đơn nào.",
            "Cấu hình quyết định chuyện này là `auto.offset.reset`. Nó **chỉ** được dùng khi group không có committed offset cho partition đó: group mới, hoặc offset đã commit không còn hợp lệ (ví dụ message ở đó đã bị xoá theo retention).",
            "- **`latest`**: mặc định của kafka-clients, và Spring Boot không đổi mặc định này. Bắt đầu từ cuối log, chỉ đọc message gửi **sau** khi group vào.",
            "- **`earliest`**: đọc từ message cũ nhất còn giữ.",
            "- **`none`**: ném exception, buộc bạn tự quyết. Đã chạy: `NoOffsetForPartitionException: Undefined offset with no reset policy`.",
            "Một điểm hay bị quên: offset của group không còn consumer nào sẽ bị xoá sau `offsets.retention.minutes` (mặc định 7 ngày). Service tắt lâu hơn thế rồi bật lại thì `auto.offset.reset` lại được áp dụng.",
          ],
          predict: {
            question: "Topic `orders` đã có 6 message. Group mới `g-latest` không cấu hình gì, group mới `g-early` đặt `auto.offset.reset=earliest`. Mỗi group đọc được bao nhiêu message?",
            options: ["6 và 6", "0 và 6", "6 và 0", "0 và 0"],
            answer: 1,
            explain: "Đã chạy: `g-latest` in `Processed a total of 0 messages`, `g-early` đọc đủ 6. Mặc định `latest` bắt đầu từ cuối log nên bỏ qua mọi thứ gửi trước đó.",
          },
          widgetTitle: "Muốn group đọc lại từ đầu",
          compare: [
            way(
              "Đổi auto.offset.reset",
              `# group g-latest đã commit offset, giờ đổi cấu hình rồi chạy lại
spring.kafka.consumer.auto-offset-reset=earliest`,
              [
                ask("Group đã có committed offset", bad("Đã chạy: sau khi gửi thêm `o7..o10`, `g-latest` với `earliest` chỉ nhận 4 message mới, không đọc lại 6 message cũ. Group đã có offset nên cấu hình này bị bỏ qua.")),
              ],
              "Chỉ có tác dụng với group chưa có offset. Không phải công cụ để replay.",
            ),
            way(
              "Reset offset của group",
              `# 1. Dừng mọi consumer của group
# 2. Xem trước (không có --execute thì chỉ in kế hoạch)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\
  --group g-early --topic orders --reset-offsets --to-earliest
# 3. Chạy thật
kafka-consumer-groups.sh ... --reset-offsets --to-earliest --execute
# khác: --to-offset 42, --to-datetime 2026-11-22T09:00:00.000, --shift-by -100`,
              [
                ask("Chạy `--execute` khi consumer còn đang chạy", bad("Đã chạy: `Error: Assignments can only be reset if the group 'g-early' is inactive, but the current state is Stable.`")),
                ask("Dừng consumer rồi chạy `--to-earliest --execute`", ok("Đã chạy: `NEW-OFFSET` về `0` ở cả 2 partition. Bật consumer lên, group đọc lại đủ 10 message `o1..o10`.")),
              ],
              "Đổi chính committed offset của group, nên lần chạy sau đọc lại đúng từ chỗ muốn.",
            ),
          ],
          after: [
            "Trong code cũng seek được: `consumer.seek(partition, offset)`, `seekToBeginning(...)`, hoặc `offsetsForTimes(...)` để tìm offset theo thời điểm. Spring Kafka có `AbstractConsumerSeekAware` để seek khi consumer vừa được giao partition.",
            "Replay nghĩa là xử lý lại message cũ: consumer phải idempotent (Phần 5), và cẩn thận với tác dụng phụ như gửi lại email.",
          ],
          takeaway: {
            lines: [
              "`auto.offset.reset` chỉ dùng khi group **chưa có** offset. Muốn đọc lại thì dừng consumer rồi reset offset của group, hoặc `seek` trong code.",
            ],
          },
          trap: {
            title: "Service mới với `latest` mặc định",
            text: "Group mới vào sau khi producer đã gửi thì các message trước đó không bao giờ được xử lý, và không có lỗi nào báo. Service cần xử lý cả dữ liệu đã có thì đặt `spring.kafka.consumer.auto-offset-reset=earliest` **trước** lần chạy đầu tiên.",
          },
          quiz: {
            question: "Group `billing` đang chạy ổn, đã commit offset. Đổi `auto.offset.reset` từ `latest` sang `earliest` rồi restart. Chuyện gì xảy ra?",
            options: [
              "Group đọc lại toàn bộ topic từ đầu",
              "Không đổi gì: group đã có committed offset nên đọc tiếp từ đó",
              "Kafka báo lỗi cấu hình",
              "Group bỏ qua message mới",
            ],
            answer: 1,
            explain: "Cấu hình này chỉ dùng khi không có offset. Muốn đọc lại thì dùng `kafka-consumer-groups.sh --reset-offsets` khi group đã dừng.",
          },
        },
      ],
    },
    {
      id: "delivery",
      title: "Phần 4: Commit offset và delivery semantics",
      scene: "delivery",
      intro: [
        "Consumer nhớ vị trí bằng committed offset (Phần 1). Xử lý message và commit offset là hai bước riêng, nên thứ tự hai bước quyết định chuyện gì xảy ra khi crash:",
        "- **At-most-once**: commit trước rồi xử lý. Crash giữa hai bước là mất message.",
        "- **At-least-once**: xử lý trước rồi commit. Crash giữa hai bước là message được giao lại và xử lý lần nữa.",
        "**Exactly-once** của Kafka chỉ trọn vẹn khi kết quả cũng ghi vào Kafka. Lý do: Kafka transaction commit message đầu ra và offset cùng lúc, nhưng nó không bao được database hay API của bạn. Ghi DB hay gọi API thì vẫn cần consumer idempotent (Phần 5).",
        "Spring Kafka tắt auto commit của client và tự commit theo `AckMode`, tức chế độ quyết định khi nào commit (mặc định `BATCH`: commit sau khi listener xử lý xong cả lô vừa poll). Vì commit xảy ra **sau khi listener trả về**, nếu listener đẩy việc sang thread pool rồi trả về ngay thì offset được commit khi việc thật chưa xong. Crash lúc đó là mất message.",
      ],
      predict: {
        question: "Group `billing`, `enable.auto.commit=false`. Vòng 1 xử lý 20 message nhưng **không commit** rồi đóng consumer. Vòng 2, cùng group, nhận bao nhiêu message?",
        options: ["0, vì đã xử lý rồi", "Đủ 20, vì offset chưa được commit", "10", "Chỉ message cuối"],
        answer: 1,
        explain: "Kafka chỉ biết group đã đọc tới đâu qua committed offset. Chưa commit thì vòng 2 đọc lại từ đầu.",
      },
      widget: "delivery-semantics",
      widgetTitle: "Crash giữa xử lý và commit",
      after: [
        "Thử nghiệm: group `billing`, `enable.auto.commit=false`. Vòng 1 xử lý 20 message nhưng không commit rồi đóng consumer. Vòng 2, cùng group, nhận lại đủ 20 message vì offset chưa được commit. Consumer idempotent (cách làm ở Phần 5) bỏ qua cả 20 vì đã thấy rồi, nên bảng `processed_event` vẫn đúng 20 dòng.",
      ],
      takeaway: {
        lines: ["Commit trước thì có thể mất. Xử lý trước thì có thể trùng, nên consumer phải idempotent."],
      },
      quiz: {
        question: "Listener đẩy việc sang thread pool rồi trả về ngay. Rủi ro gì?",
        options: ["Không rủi ro", "Offset được commit trong khi việc thật chưa xong: crash là mất message", "Chạy chậm hơn", "Mất thứ tự là duy nhất"],
        answer: 1,
        explain: "Xử lý xong rồi mới để listener trả về.",
      },
      parts: [
        {
          id: "manual-ack",
          title: "Không gọi ack.acknowledge() thì message có được giao lại không",
          intro: [
            "Phần trên dùng `AckMode` mặc định `BATCH`. Một số team chọn `AckMode.MANUAL`: listener nhận thêm tham số `Acknowledgment` và tự gọi `ack.acknowledge()` khi xử lý xong.",
            "Nhiều người nghĩ: xử lý lỗi thì không gọi `acknowledge()`, Kafka sẽ giao lại message, giống RabbitMQ khi không ack. Với Kafka thì không phải vậy, vì consumer có hai con số khác nhau:",
            "- **Position**: offset mà lần `poll` tiếp theo sẽ đọc, nằm trong bộ nhớ của consumer. Mỗi lần poll trả record là position tiến lên, có ack hay không.",
            "- **Committed offset**: vị trí lưu trên broker. Nó chỉ được đọc khi consumer **bắt đầu lại**: restart, hoặc partition được giao cho consumer khác sau rebalance.",
            "Kafka chỉ lưu **một con số** cho mỗi partition, không lưu từng message đã ack hay chưa. Commit offset 6 nghĩa là \"mọi thứ trước 6 đã xong\".",
          ],
          predict: {
            question: "Topic 1 partition có `o0..o5`. Listener `MANUAL` gọi `acknowledge()` cho mọi record **trừ `o2`**. Trong cùng phiên chạy, `o2` có được giao lại không?",
            options: [
              "Có, Kafka giao lại o2 ở lần poll sau",
              "Không: listener nhận o0..o5 đúng một lần, ack của o5 commit offset 6 và che luôn o2",
              "Consumer dừng ở o2 chờ ack",
              "o2 tự chuyển sang DLT",
            ],
            answer: 1,
            explain: "Đã chạy: listener nhận `[o0, o1, o2, o3, o4, o5]`, committed offset sau đó là `6`. Position đã qua o2 từ lúc poll, và ack của o5 commit vượt qua nó.",
          },
          widgetTitle: "Xử lý lỗi với AckMode.MANUAL",
          compare: [
            way(
              "Không ack, chờ Kafka giao lại",
              `@KafkaListener(topics = "acks")
void on(ConsumerRecord<String, String> r, Acknowledgment ack) {
  if (!process(r)) return;     // lỗi: bỏ ack, tưởng sẽ được giao lại
  ack.acknowledge();
}`,
              [
                ask("Bỏ ack `o2`, ack các record khác", bad("Đã chạy: nhận `[o0, o1, o2, o3, o4, o5]`, `o2` không được giao lại, committed offset = `6`. `o2` coi như mất.")),
                ask("Bỏ ack record **cuối** `o7`, dừng rồi chạy lại", bad("Đã chạy: committed offset dừng ở `7`, nên lần chạy sau nhận lại `o7` trước tiên. Chỉ restart hoặc rebalance mới giao lại.")),
              ],
              "Không ack không phải là retry: chỉ committed offset đứng lại, và ack của record sau sẽ đè qua.",
            ),
            way(
              "nack hoặc ném exception",
              `void on(ConsumerRecord<String, String> r, Acknowledgment ack) {
  try {
    process(r);
    ack.acknowledge();
  } catch (TransientException e) {
    ack.nack(Duration.ofMillis(200));   // seek lại record này, giao lại sau 200 ms
  }
}
// hoặc ném exception: DefaultErrorHandler seek lại, retry có giới hạn, rồi sang DLT`,
              [
                ask("`nack` `o8` một lần, lần sau ack", ok("Đã chạy: listener nhận `[o7, o8, o8]`, `o8` được giao lại trong cùng phiên; committed offset = `9`.")),
                ask("Lỗi mãi không hết", ok("Ném exception để `DefaultErrorHandler` retry có giới hạn rồi đẩy sang DLT (Phần 6), thay vì `nack` mãi và chặn partition.")),
              ],
              "Muốn giao lại thì phải nói rõ: `nack`, hoặc ném exception để error handler seek lại.",
            ),
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Poll trả record → position tiến lên → bỏ ack chỉ làm committed offset đứng lại → ack record sau commit vượt qua → record bị bỏ ack coi như mất. Muốn giao lại: `nack` hoặc ném exception.",
            ],
          },
          quiz: {
            question: "Listener `MANUAL` không gọi ack cho một record lỗi, các record sau vẫn ack bình thường. Record lỗi được xử lý lại khi nào?",
            options: [
              "Ngay ở lần poll sau",
              "Không bao giờ: ack của record sau đã commit vượt qua nó",
              "Sau `max.poll.interval.ms`",
              "Khi broker hết retention",
            ],
            answer: 1,
            explain: "Committed offset là một con số cho cả partition. Ack record đứng sau là nói \"mọi thứ trước đây đã xong\", kể cả record bị bỏ ack.",
          },
        },
      ],
    },
    {
      id: "producer",
      title: "Phần 5: Producer an toàn",
      scene: "idem",
      intro: [
        "Phần 4 lo chuyện mất và trùng phía consumer; phía producer cũng có câu hỏi tương tự. `acks` là số xác nhận producer chờ trước khi coi là gửi xong:",
        "- **`acks=0`**: không chờ gì.",
        "- **`acks=1`**: chờ leader ghi xong.",
        "- **`acks=all`**: chờ leader và mọi replica in-sync (ISR, Phần 1) ghi xong.",
        "Trong code và log, `all` được viết là `-1`: hai cách ghi là một.",
        "`acks=all` chỉ thật sự an toàn khi topic có replication factor 3 và `min.insync.replicas=2` (cấu hình của topic). Lý do: nếu ISR chỉ còn mỗi leader thì \"mọi replica in-sync\" cũng chỉ là một máy, và `min.insync.replicas=2` bắt broker từ chối ghi trong trường hợp đó.",
        "Đã đọc mặc định của `kafka-clients` 3.9.2: `acks=-1  enable.idempotence=true`, tức `acks=all` và idempotent producer bật sẵn. Tài liệu cũ ghi mặc định `acks=1` là hành vi trước 3.0.",
        "**Idempotent producer** chỉ chống trùng do retry nội bộ của producer (mất ack rồi gửi lại), không chống việc ứng dụng tự gọi `send` lần nữa.",
      ],
      takeaway: {
        lines: ["`acks=all` chỉ thật sự an toàn khi topic có replication factor 3 và `min.insync.replicas=2`."],
      },
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
          id: "async-send",
          title: "send() trả về ngay, chưa phải đã gửi xong",
          intro: [
            "`acks=all` chỉ có ích khi bạn đọc kết quả ack. Nhưng `kafkaTemplate.send(...)` trả về **ngay**, trước khi broker xác nhận gì cả.",
            "`send()` chỉ đặt record vào buffer trong bộ nhớ của producer; một thread nền gom batch rồi gửi. Kết quả về sau, qua `CompletableFuture<SendResult>` (Spring Kafka 3.x; bản 2.x trả `ListenableFuture`).",
            "Vấn đề: code gọi `send()` rồi trả `201` cho user, không nhìn future. Broker không nhận được (producer retry tới hết `delivery.timeout.ms`, mặc định 2 phút), thì lỗi chỉ nằm trong future. `KafkaTemplate` mặc định chỉ ghi một dòng log lỗi (qua `LoggingProducerListener`); code nghiệp vụ không biết event đã mất.",
            "Ba cách xử lý:",
            "- **Callback**: `send(...).whenComplete((res, ex) -> ...)`. Không chặn thread; lỗi thì log kèm key, tăng metric để alert, hoặc lưu lại để gửi lại.",
            "- **Chờ kết quả**: `send(...).get(10, SECONDS)`. Chắc chắn, nhưng mỗi lần gửi phải chờ một vòng mạng nên throughput giảm mạnh. Hợp khi gửi ít và cần biết ngay.",
            "- **Outbox** (Phần 7): khi event phải đi cùng việc ghi DB, đừng dựa vào callback.",
            "`send()` cũng có thể **chặn ngay tại chỗ** tới `max.block.ms` (mặc định 60 giây) khi chưa lấy được metadata của topic hoặc buffer đã đầy.",
          ],
          widgetTitle: "Gửi event sau khi lưu đơn",
          compare: [
            way(
              "Gửi rồi quên",
              `public Order place(Order o) {
  repo.save(o);
  kafkaTemplate.send("orders", o.id(), event(o));   // trả về ngay
  return o;                                         // user nhận 201
}`,
              [
                ask("Broker không tới được trong 3 phút", bad("Hết `delivery.timeout.ms`, future thất bại. Chỉ có một dòng log của `LoggingProducerListener`; user đã nhận 201, event mất.")),
                ask("Cần biết bao nhiêu event gửi lỗi", bad("Không có số liệu nào, trừ khi đi đọc log.")),
              ],
              "Không ai biết khi gửi thất bại.",
            ),
            way(
              "Callback xử lý kết quả",
              `kafkaTemplate.send("orders", o.id(), event(o))
    .whenComplete((res, ex) -> {
      if (ex != null) {
        log.error("send failed key={}", o.id(), ex);
        sendFailures.increment();                   // metric để alert
      }
    });`,
              [
                ask("Broker không tới được trong 3 phút", ok("Callback chạy với `ex`: có log kèm key và metric để alert. Event quan trọng thì dùng outbox để gửi lại được.")),
                ask("Hiệu năng", ok("Không chặn thread gọi; producer vẫn gom batch như bình thường.")),
              ],
              "Biết được lỗi mà không phải chờ từng lần gửi.",
            ),
          ],
          after: [
            "Một bẫy liên quan tới thứ tự: retry có thể **đảo thứ tự** trong một partition nếu tắt idempotence mà `max.in.flight.requests.per.connection` lớn hơn 1. Batch 1 lỗi, batch 2 thành công, batch 1 gửi lại nên nằm sau batch 2. Idempotent producer (bật sẵn từ kafka-clients 3.0) giữ đúng thứ tự với tối đa 5 request đang gửi dở.",
          ],
          takeaway: {
            lines: [
              "`send()` chỉ đưa record vào buffer. Luôn xử lý kết quả trong future (`whenComplete`), hoặc dùng outbox khi event không được phép mất.",
            ],
          },
          quiz: {
            question: "`kafkaTemplate.send(...)` vừa trả về. Điều đó nghĩa là gì?",
            options: [
              "Broker đã ghi xong vào mọi replica",
              "Record mới vào buffer của producer; broker chưa chắc đã nhận, kết quả nằm trong future",
              "Consumer đã nhận message",
              "Message đã được commit offset",
            ],
            answer: 1,
            explain: "Gửi là bất đồng bộ. Kết quả (thành công kèm offset, hoặc exception) chỉ có trong `CompletableFuture<SendResult>`.",
          },
        },
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
          board: {
            title: "Consumer idempotent: bản trùng bị khoá chính chặn",
            highlight: "khoá chính chặn",
            chips: ["At-least-once nên message có thể đến hai lần"],
            cards: [
              {
                title: "Cùng một transaction",
                diagram: {
                  kind: "flow",
                  steps: ["Message có eventId", "INSERT eventId (PK)", "Ghi thay đổi nghiệp vụ"],
                  ok: ["Insert được", "COMMIT cả hai"],
                  bad: ["Trùng khoá", "Đã xử lý, bỏ qua"],
                },
                notes: ["Cùng transaction để không có chuyện ghi nghiệp vụ mà chưa ghi `eventId`, hoặc ngược lại."],
                code: `INSERT INTO processed_event(event_id) VALUES (?);
-- trùng khoá: bỏ qua message
-- rồi ghi thay đổi nghiệp vụ, cùng transaction`,
                takeaway: "Lần giao lại đụng trùng khoá nên không xử lý lần hai",
              },
              {
                title: "Dùng id nào",
                diagram: {
                  kind: "pipe",
                  from: "Message gửi lại",
                  via: "eventId (PRIMARY KEY)",
                  to: "Nhận ra bản trùng",
                  skipped: ["So offset", "SELECT rồi INSERT"],
                  skippedLabel: "Không dùng",
                },
                notes: ["Bản gửi lại có offset mới nhưng `eventId` cũ.", "SELECT rồi INSERT: hai consumer cùng thấy chưa có."],
                takeaway: "Để database chặn bản trùng, đừng tự kiểm tra",
              },
            ],
            conclusion: "**Kết luận:** at-least-once cộng consumer idempotent cho kết quả như xử lý đúng một lần.",
          },
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Insert `eventId` (PRIMARY KEY) cùng transaction với nghiệp vụ → lần giao lại đụng trùng khoá → bỏ qua, kết quả vẫn như xử lý một lần."],
          },
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
        "Consumer idempotent lo được message bị giao lại. Còn message lỗi mãi không xử lý được thì sao? Retry mãi một message lỗi vĩnh viễn chặn cả partition phía sau. Cách chuẩn: retry vài lần có backoff, vẫn lỗi thì đẩy sang `<topic>.DLT` để xem xét, rồi đi tiếp. Spring Kafka: `DefaultErrorHandler` với `DeadLetterPublishingRecoverer` và `FixedBackOff`, đánh dấu lỗi dữ liệu là not-retryable (phần này mô tả, chưa chạy).",
        "Blocking retry giữ thứ tự nhưng chặn partition; `@RetryableTopic` (non-blocking) chạy tiếp nhưng mất thứ tự. `DefaultErrorHandler` không có recoverer thử tổng 10 lần rồi chỉ log và bỏ qua: mất message nếu không cấu hình DLT. DLT phải có alert và quy trình replay.",
        "Chỉ số cần theo dõi là **consumer lag**: số message còn tồn, tức khoảng cách giữa offset mới nhất của partition và offset group đã commit. Lag tăng mãi nghĩa là consumer xử lý chậm hơn tốc độ ghi, hoặc đang kẹt ở một message lỗi retry mãi.",
      ],
      takeaway: {
        lines: ["Retry có giới hạn rồi đẩy sang DLT, kèm alert và quy trình replay. Không cấu hình DLT thì message lỗi bị bỏ qua và mất."],
      },
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
      parts: [
        {
          id: "poison-pill",
          title: "Poison pill: message không đọc nổi",
          intro: [
            "`DefaultErrorHandler` bắt lỗi ném ra **từ listener**. Nhưng có loại lỗi xảy ra trước khi listener được gọi.",
            "Message được lưu dưới dạng byte; consumer dùng một **deserializer** để đổi byte thành object. Gặp một message hỏng (JSON sai, sai kiểu, producer đổi format), deserializer ném lỗi ngay trong `poll()`. Listener không bao giờ chạy, nên try/catch trong listener vô dụng. Message như vậy gọi là **poison pill**.",
            "Cách chữa: bọc deserializer thật bằng `ErrorHandlingDeserializer`. Lỗi deserialize trở thành một record mang thông tin lỗi, được chuyển cho error handler. `DeserializationException` nằm sẵn trong danh sách **không retry** của `DefaultErrorHandler`, nên nó đi thẳng tới recoverer (DLT nếu bạn cấu hình) thay vì thử lại vô ích.",
            "Nhân tiện, phân loại lỗi trước khi retry:",
            "- **Tạm thời** (timeout, `503`, DB đang failover): retry có backoff.",
            "- **Vĩnh viễn** (dữ liệu hỏng, sai schema, validate không qua): retry bao nhiêu cũng vậy, đánh dấu bằng `addNotRetryableExceptions(...)` để đi thẳng DLT.",
          ],
          predict: {
            question: "Topic có 3 message kiểu Long: `1`, `abc` (3 byte, không phải Long), `3`. Consumer dùng `LongDeserializer`, listener có try/catch bọc toàn bộ. Listener nhận gì?",
            options: [
              "`[1, 3]`: try/catch bắt được `abc`",
              "`[1]` rồi kẹt: lỗi xảy ra trong `poll()`, trước khi listener chạy",
              "`[1, abc, 3]`",
              "Không nhận gì",
            ],
            answer: 1,
            explain: "Đã chạy: listener chỉ nhận `[1]`, trong 15 giây chạy thử `3` không bao giờ tới. Lỗi xảy ra lúc deserialize `abc`, listener không có cơ hội bắt.",
          },
          widgetTitle: "Cùng 3 message, hai cách cấu hình",
          compare: [
            way(
              "Deserializer thường",
              `spring.kafka.consumer.value-deserializer=\\
  org.apache.kafka.common.serialization.LongDeserializer`,
              [
                ask("Topic có `1`, `abc`, `3`", bad("Đã chạy: listener chỉ nhận `[1]`; `3` không tới trong 15 giây. Partition kẹt ở `abc`, lag tăng dần.")),
              ],
              "Một message hỏng chặn cả partition phía sau.",
            ),
            way(
              "ErrorHandlingDeserializer",
              `spring.kafka.consumer.value-deserializer=\\
  org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
spring.kafka.consumer.properties.spring.deserializer.value.delegate.class=\\
  org.apache.kafka.common.serialization.LongDeserializer`,
              [
                ask("Topic có `1`, `abc`, `3`", ok("Đã chạy: listener nhận `[1, 3]`. `abc` đi sang error handler; ở đây chưa cấu hình DLT nên nó chỉ bị log rồi bỏ qua.")),
                ask("Muốn giữ lại `abc` để xem", ok("Thêm `DeadLetterPublishingRecoverer` vào `DefaultErrorHandler`: `abc` sang `<topic>.DLT` kèm header ghi lý do lỗi.")),
              ],
              "Message hỏng được tách ra, partition chạy tiếp.",
            ),
          ],
          trap: {
            title: "DLT phá thứ tự theo key",
            text: "Đẩy một message sang DLT rồi đi tiếp nghĩa là các message sau của **cùng key** được xử lý trước nó. Với dữ liệu cần đúng thứ tự tuyệt đối như sổ cái hay số dư, dừng partition và alert thay vì đẩy DLT.",
          },
          takeaway: {
            lines: [
              "Lỗi deserialize xảy ra trong `poll()`, trước listener. Luôn bọc bằng `ErrorHandlingDeserializer` và cấu hình DLT; lỗi vĩnh viễn thì không retry.",
            ],
          },
          quiz: {
            question: "Vì sao try/catch trong `@KafkaListener` không bắt được message JSON hỏng?",
            options: [
              "Vì Spring nuốt mọi exception",
              "Vì deserialize chạy trong `poll()` trước khi listener được gọi; cần `ErrorHandlingDeserializer`",
              "Vì JSON hỏng không phải exception",
              "Vì listener chạy trên thread khác",
            ],
            answer: 1,
            explain: "`ErrorHandlingDeserializer` biến lỗi deserialize thành record mang lỗi, để error handler xử lý và partition không bị kẹt.",
          },
        },
        {
          id: "lag-monitor",
          title: "Xem consumer lag ở đâu và khi nào báo động",
          intro: [
            "Phần trên định nghĩa consumer lag. Nhưng xem nó ở đâu, và lag bao nhiêu thì đáng lo?",
            "Cách nhanh nhất: `kafka-consumer-groups.sh --bootstrap-server ... --describe --group billing`. Mỗi partition một dòng:",
            "- **`CURRENT-OFFSET`**: offset group đã commit.",
            "- **`LOG-END-OFFSET`**: offset mà message tiếp theo sẽ được ghi vào.",
            "- **`LAG`**: hiệu hai số trên, số message chưa xử lý.",
            "Đã chạy: group `g-early` đã đọc 6 message rồi dừng, producer gửi thêm 4. `--describe` in partition 1 với `CURRENT-OFFSET 6`, `LOG-END-OFFSET 10`, `LAG 4`, kèm dòng `Consumer group 'g-early' has no active members`.",
            "Theo dõi liên tục:",
            "- **Metric từ chính consumer**: ví dụ `records-lag-max`. Spring Boot có Micrometer thì xuất các metric của Kafka client ra Actuator.",
            "- **Đo từ bên ngoài**: exporter (như Kafka Exporter cho Prometheus) hoặc Burrow đọc offset của group trên broker. Cần có, vì consumer chết thì metric trong consumer cũng mất, đúng lúc lag tăng.",
            "Báo động theo **xu hướng**, không theo một con số tuyệt đối: lag tăng liên tục trong 10 phút mới đáng lo; lag cao một lúc rồi giảm sau đợt cao điểm là bình thường. Lag tính theo thời gian (message cũ nhất chưa xử lý đã chờ bao lâu) dễ đặt ngưỡng hơn số message.",
            "Đọc theo từng partition:",
            "- **Mọi partition cùng tăng**: consumer xử lý chậm hơn tốc độ ghi, hoặc thiếu consumer.",
            "- **Chỉ một partition tăng**: nó đang kẹt ở một poison pill hay message retry mãi, hoặc nhận một key nóng. Thêm consumer không giúp, vì mỗi partition chỉ có một consumer.",
          ],
          takeaway: {
            lines: [
              "`LAG = LOG-END-OFFSET - CURRENT-OFFSET`, theo từng partition. Báo động khi lag tăng liên tục, và đo từ bên ngoài consumer.",
            ],
          },
          quiz: {
            question: "`--describe` cho thấy partition 3 lag tăng mãi, các partition khác lag 0. Nghi gì trước tiên?",
            options: [
              "Cần thêm consumer",
              "Partition 3 đang kẹt (poison pill, message retry mãi) hoặc nhận một key nóng",
              "Broker chứa partition 3 hết đĩa",
              "Retention quá ngắn",
            ],
            answer: 1,
            explain: "Các partition khác chạy tốt nên consumer không thiếu sức. Một partition mà mỗi lúc một chậm thì nhìn vào message đang xử lý ở đó.",
          },
        },
      ],
    },
    {
      id: "outbox",
      title: "Phần 7: Kafka với RabbitMQ và transactional outbox",
      scene: "outbox",
      intro: [
        "So sánh nhanh:",
        "- **Kafka**: log phân tán, consumer kéo theo offset, message còn tới hết retention, replay được, throughput rất cao; hợp event streaming, nhiều service cùng nghe, CDC.",
        "- **RabbitMQ**: broker đẩy message, xoá sau ack, routing linh hoạt (exchange direct, topic, fanout); hợp task queue, RPC, ưu tiên message.",
        "Vấn đề tiếp theo không liên quan tới so sánh trên: lưu đơn và gửi `OrderCreated` trong `@Transactional`. Gửi rồi DB rollback thì có **event ma** (event của đơn không tồn tại). Commit rồi crash trước khi gửi thì **mất event**.",
        "Cách nửa vời: `@TransactionalEventListener(phase = AFTER_COMMIT)` chỉ gửi sau khi DB commit, nên hết event ma. Nhưng app crash ngay sau commit, trước khi gửi, thì event vẫn mất.",
        "**Outbox**: insert đơn và một dòng vào bảng `outbox` trong cùng transaction. Một tiến trình khác đọc bảng `outbox` và publish lên Kafka: hoặc poller định kỳ query bảng, hoặc **CDC** (change data capture: đọc log thay đổi của database, ví dụ công cụ Debezium). Event được gửi ít nhất một lần khi và chỉ khi DB đã commit, nên consumer vẫn phải idempotent.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Ghi đơn và dòng `outbox` cùng transaction → poller hoặc CDC publish lên Kafka → event gửi ít nhất một lần khi DB đã commit → consumer vẫn phải idempotent."],
      },
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
