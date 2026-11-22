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
    explain:
      "Mỗi instance tự chạy `@Scheduled` của riêng nó, nên email gửi 3 lần. Cần khoá phân tán như ShedLock (một dòng khoá trong DB: instance nào giành được khoá thì chạy job, các instance khác bỏ qua), hoặc tách job ra chỗ riêng.",
  },
  roadmap: [
    "Chặng 1: scale và stateless; reverse proxy, load balancer, API gateway; cache và ba bẫy của nó; message queue.",
    "Chặng 2: replication, sharding, CAP, microservices.",
    "Chặng 3: timeout, retry, circuit breaker; saga, outbox; rate limiting, observability.",
  ],
  sections: [
    {
      id: "scale",
      title: "Phần 1: Scale và stateless",
      scene: "scale",
      intro: [
        "**Scale dọc** là nâng CPU, RAM cho một máy. Đơn giản, nhưng có trần (máy to nhất cũng có giới hạn) và vẫn là một điểm chết: máy đó hỏng là cả hệ thống dừng. Hay dùng cho DB, vì DB khó chia ra nhiều máy.",
        "**Scale ngang** là thêm instance chạy cùng một app, đặt sau một load balancer. Gần như không có trần, nhưng app phải **stateless**: không giữ trong RAM thứ gì mà request sau cần tới. Lý do: request sau của cùng một user có thể rơi vào instance khác, và instance đó không có dữ liệu trong RAM của instance trước.",
        "Vì vậy mỗi request tự mang thông tin của nó (token JWT), còn state dùng chung thì đẩy ra Redis hoặc DB. Những thứ hay sai khi lên nhiều instance: `HttpSession` trong RAM, cache trong RAM, file lưu ở ổ local, job `@Scheduled`. Chọn từng thứ để xem nó còn đúng không.",
      ],
      widget: "stateless-check",
      widgetTitle: "Còn đúng khi chạy 3 instance không",
      quiz: {
        question: "Database có scale ngang dễ như app stateless không?",
        options: ["Có", "Không: DB chính là nơi giữ state; scale đọc bằng replica, scale ghi phải partition hoặc shard", "Chỉ với PostgreSQL", "Chỉ cần thêm load balancer"],
        answer: 1,
        explain:
          "App stateless thì thêm bản sao là xong, vì bản nào cũng như nhau. DB thì mỗi bản phải có cùng dữ liệu, nên không thể chỉ thêm máy rồi chia tải. Thường scale dọc DB trước, thêm cache và replica cho phần đọc (Phần 3), sharding là bước cuối vì đắt nhất.",
      },
      parts: [
        {
          id: "scale-proxy",
          title: "Reverse proxy, load balancer, API gateway",
          intro: [
            "Ba thứ này đều đứng giữa client và app, nên rất dễ lẫn. Phân biệt bằng hai câu hỏi: nó đứng trước ai, và nó làm việc gì. Bấm từng dòng để xem câu nên nói khi phỏng vấn.",
          ],
          widgetTitle: "Đứng trước ai, làm gì",
          cheat: [
            {
              name: "Reverse proxy",
              one: "Đứng trước server. Client chỉ thấy proxy, không biết server thật ở đâu. Hay làm SSL termination: giải mã HTTPS ngay ở proxy, app phía sau chỉ nhận HTTP thường.",
              say: "Nginx đứng trước app làm reverse proxy: ẩn server thật và giải mã HTTPS ở một chỗ.",
            },
            {
              name: "Load balancer",
              one: "Chia tải giữa các bản sao giống nhau của một app. L4 chỉ nhìn IP và port nên rất nhanh; L7 đọc được HTTP (URL, header) nên chia thông minh hơn. Gọi health check như `/actuator/health` định kỳ để loại instance hỏng.",
              say: "Load balancer chia request cho 3 instance order-service và tự bỏ instance nào không trả lời health check.",
            },
            {
              name: "API gateway",
              one: "Cửa vào chung cho nhiều service khác nhau: route theo API (`/orders` sang order-service, `/users` sang user-service), xác thực, rate limit. Không chứa logic nghiệp vụ. Mọi request đều đi qua nó, nên chính nó cũng phải scale ngang.",
              say: "Gateway lo việc chung như xác thực và rate limit, còn nghiệp vụ nằm trong từng service.",
            },
            {
              name: "Forward proxy",
              one: "Ngược với reverse proxy: đứng trước client và thay client đi ra ngoài. Server bên ngoài chỉ thấy proxy.",
              say: "Proxy của công ty để nhân viên ra internet là forward proxy.",
            },
          ],
          quiz: {
            question: "Muốn `/api/orders` đi tới order-service còn `/api/users` đi tới user-service. Thành phần đó phải nhìn được gì?",
            options: ["Chỉ IP và port, như load balancer L4", "Đường dẫn HTTP, tức một API gateway (hoặc load balancer L7)", "Không cần gì, DNS tự lo", "Forward proxy phía client"],
            answer: 1,
            explain: "Đường dẫn `/api/orders` nằm trong HTTP request. L4 chỉ thấy IP và port nên không phân biệt được hai API; phải là thứ đọc được HTTP như API gateway.",
          },
        },
      ],
    },
    {
      id: "cache-queue",
      title: "Phần 2: Cache nhiều tầng",
      scene: "cachequeue",
      intro: [
        "Cache giữ một bản sao dữ liệu ở gần người đọc hơn, để đỡ phải hỏi DB. Một request đi qua nhiều tầng: trình duyệt (`Cache-Control`, {{etag|ETag}}), CDN cho file tĩnh, cache trong app (Caffeine), cache dùng chung giữa các instance (Redis), và buffer pool của chính DB.",
        "Cách hay dùng nhất là **cache-aside**. Đọc: xem Redis trước; nếu miss (không có) thì query DB rồi nạp vào Redis kèm TTL (thời hạn sống của key). Ghi: cập nhật DB trước, rồi **xoá** key; lần đọc sau tự nạp lại giá trị mới.",
        "Vì sao xoá key mà không ghi giá trị mới vào cache? Hai request cùng sửa giá một sản phẩm: A ghi DB giá 10, ngay sau đó B ghi DB giá 12. Nhưng B ghi cache trước A, nên cuối cùng cache giữ 10 trong khi DB là 12, và sai như vậy tới khi hết TTL. Xoá key thì lần đọc sau luôn nạp lại từ DB. Vẫn còn một khe hở nhỏ, nên luôn đặt TTL làm lưới an toàn.",
        "Hai cách ghi khác: **write-through** ghi cache và DB cùng lúc (nhất quán hơn, ghi chậm hơn); **write-behind** ghi cache trước, ghi DB sau (nhanh, nhưng app chết trước khi ghi DB là mất dữ liệu).",
      ],
      after: [
        "Không dùng số tồn kho trong cache để **quyết định bán**. Cache có thể cũ vài giây: cache còn ghi 1 trong khi DB đã về 0, bán theo cache là bán quá số hàng có. Cache dùng để hiển thị thì được; quyết định trừ kho phải dựa trên DB (xem bài System Design Practice, phần checkout).",
      ],
      quiz: {
        question: "Cache-aside: ghi DB xong, vì sao nên xoá key thay vì ghi giá trị mới vào cache?",
        options: [
          "Vì xoá nhanh hơn ghi",
          "Hai request ghi song song có thể cập nhật cache theo thứ tự khác với DB, để lại giá trị sai; xoá key thì lần đọc sau nạp lại từ DB",
          "Vì Redis không cho ghi đè key",
          "Để tiết kiệm RAM",
        ],
        answer: 1,
        explain: "Thứ tự hai request ghi vào DB và thứ tự chúng ghi vào cache có thể khác nhau, nên cache giữ giá trị cũ tới hết TTL. Xoá key thì không còn giá trị nào để sai, lần đọc sau lấy đúng giá trị từ DB.",
      },
      parts: [
        {
          id: "cache-traps",
          title: "Ba bẫy của cache: stampede, penetration, avalanche",
          intro: [
            "Cả ba bẫy có cùng một kết cục: những request đáng lẽ được cache đỡ lại dồn thẳng vào DB, DB quá tải. Chúng khác nhau ở **nguyên nhân**, nên cách chữa cũng khác. Bấm từng dòng để xem cách chữa.",
          ],
          widgetTitle: "Ba bẫy, ba cách chữa",
          cheat: [
            {
              name: "Stampede",
              one: "Một key **nóng** (rất nhiều người đọc, ví dụ sản phẩm bán chạy nhất) vừa hết hạn. Hàng nghìn request cùng miss trong cùng một khoảnh khắc, và cùng query DB để nạp lại đúng một key đó.",
              say: "Chữa bằng khoá: chỉ một request được nạp lại, các request khác chờ nó xong rồi đọc cache. Với cache local như Caffeine, Spring có `@Cacheable(sync = true)` làm đúng việc này cho từng key. Với Redis theo cấu hình mặc định của Spring Boot thì `sync = true` không khoá được (xem bài Redis), phải tự làm khoá.",
            },
            {
              name: "Penetration",
              one: "Liên tục truy vấn một key **không tồn tại**, ví dụ `id = -1`. DB không có, nên cũng không có gì để nạp vào cache: lần nào cũng miss, lần nào cũng hỏi DB.",
              say: "Cache luôn cả kết quả rỗng với TTL ngắn, hoặc dùng Bloom filter (một cấu trúc nhỏ gọn trả lời được \"key này chắc chắn không có\") để chặn trước khi hỏi DB.",
            },
            {
              name: "Avalanche",
              one: "Rất **nhiều key** hết hạn cùng một lúc, ví dụ cùng được nạp khi khởi động với cùng TTL 10 phút. Đúng 10 phút sau, mọi key cùng miss và DB bị đánh dồn.",
              say: "Cộng thêm một độ lệch ngẫu nhiên (jitter) vào TTL của từng key để chúng hết hạn rải rác. Jitter chữa avalanche, không chữa được stampede của một key nóng.",
            },
          ],
          quiz: {
            question: "Key cache của sản phẩm bán chạy nhất hết hạn lúc 9:00, và 5000 request cùng miss rồi cùng query DB. Đây là bẫy gì, chữa thế nào?",
            options: [
              "Avalanche: cộng jitter vào TTL",
              "Stampede: khoá để chỉ một request nạp lại, các request khác chờ",
              "Penetration: cache cả giá trị rỗng",
              "Không phải bẫy, chỉ cần tăng pool DB",
            ],
            answer: 1,
            explain: "Một key nóng hết hạn là stampede. Jitter chỉ rải thời điểm hết hạn của nhiều key khác nhau, nó không giúp gì khi chỉ có một key. Penetration là key không tồn tại, ở đây key có thật.",
          },
        },
        {
          id: "message-queue",
          title: "Message queue",
          intro: [
            "Việc không cần làm ngay thì đẩy qua queue. Ví dụ đặt hàng: order-service lưu đơn, gửi message `OrderCreated` vào queue rồi trả 201 ngay; notification-service đọc message và gửi email sau.",
            "Được gì: **tách rời** (order-service không cần biết ai gửi email), **san tải đỉnh** (giờ cao điểm message xếp hàng, consumer xử lý dần), **chịu lỗi** (notification-service chết thì message vẫn nằm trong queue chờ), và trả lời nhanh hơn. Đổi lại là **eventual consistency**: email tới sau vài giây, không tới ngay.",
            "Kafka là một log lưu lâu: consumer đọc lại được từ đầu, thứ tự chỉ giữ **trong một partition** (nên dùng `orderId` làm key để event của cùng một đơn đi đúng thứ tự). RabbitMQ là broker: message bị xoá sau khi consumer ack (báo đã xử lý xong).",
            "Queue thường giao **at-least-once** (ít nhất một lần): consumer xử lý xong nhưng chết trước khi ack thì message được giao lại. Vì vậy consumer phải {{idempotent|idempotent}}: lưu id event vào bảng `processed_event` có unique constraint, trong cùng transaction với việc xử lý; gặp id đã có thì bỏ qua. Message lỗi mãi thì chuyển vào {{dead-letter|DLQ}} để người xem, thay vì thử lại vô tận và chặn cả hàng.",
          ],
          quiz: {
            question: "@Async khác message queue ở điểm cốt lõi nào?",
            options: ["@Async nhanh hơn", "@Async chạy trong cùng JVM, app crash là mất; queue lưu bền vững ngoài app, có retry", "Queue chỉ dùng cho microservices", "Không khác"],
            answer: 1,
            explain: "@Async chỉ chạy việc trên một thread khác trong cùng app: app crash hay deploy lại thì việc đang chờ mất luôn. Queue giữ message bên ngoài app, consumer chết thì message vẫn còn. Việc phải đảm bảo xảy ra thì dùng queue.",
          },
        },
      ],
    },
    {
      id: "data",
      title: "Phần 3: Replication",
      scene: "data",
      intro: [
        "**Replication**: ghi vào primary, đọc chia sang các replica (bản sao). Primary chết thì nâng (promote) một replica lên thay.",
        "Sao chép **đồng bộ** thì primary chờ replica ghi xong mới trả lời: không mất dữ liệu nhưng ghi chậm. **Bất đồng bộ** thì primary trả lời ngay, replica chép sau: ghi nhanh nhưng có replication lag, tức replica chậm hơn primary một chút.",
        "Lag sinh ra bẫy {{read-your-writes|read-your-own-writes}}: user vừa đặt hàng xong, trang \"đơn của tôi\" đọc từ replica chưa kịp chép nên **không thấy đơn vừa đặt**. Chữa: đọc ngay sau khi ghi thì đọc primary; chỉ đẩy sang replica các truy vấn chấp nhận trễ, như báo cáo, danh sách sản phẩm.",
        "Trong Spring, `AbstractRoutingDataSource` chọn DB theo cờ `@Transactional(readOnly = true)`: có cờ thì sang replica. Phải bọc thêm `LazyConnectionDataSourceProxy`. Lý do: bình thường connection được lấy ngay khi transaction bắt đầu, **trước** khi cờ readOnly được đặt, nên routing chưa thấy cờ và chọn nhầm primary. Proxy này hoãn việc lấy connection tới câu SQL đầu tiên, lúc cờ đã có.",
      ],
      widget: "sd-pick",
      widgetTitle: "Chọn khối xây dựng",
      after: [
        "Replica không giúp scale ghi: mọi lệnh ghi vẫn dồn về một primary.",
      ],
      quiz: {
        question: "Replication và backup khác nhau thế nào?",
        options: ["Giống nhau", "Replication sao chép mọi thay đổi kể cả xoá nhầm; backup là bản chụp để quay lại quá khứ", "Backup nhanh hơn", "Replication chỉ cho MySQL"],
        answer: 1,
        explain: "Lỡ tay `DELETE` trên primary thì replica cũng xoá theo sau vài mili giây. Backup là bản chụp ở một thời điểm, nên quay lại được lúc trước khi xoá. Cần cả hai.",
      },
      parts: [
        {
          id: "sharding",
          title: "Partitioning, sharding, consistent hashing",
          intro: [
            "Replica chỉ giúp phần đọc. Khi một DB không chứa nổi hoặc ghi không kịp, phải chia dữ liệu. **Partitioning** chia một bảng lớn thành nhiều phần trong **cùng một server** (ví dụ theo tháng). **Sharding** chia dữ liệu ra **nhiều server**, mỗi server (shard) giữ một phần.",
            "Dòng nào nằm ở shard nào do **shard key** quyết định, ví dụ `customerId`. Chọn sai là lỗi đắt nhất: query không có shard key phải hỏi mọi shard, và đổi shard key về sau nghĩa là chuyển lại toàn bộ dữ liệu.",
            "Cách chia đơn giản nhất là `hash(key) % N`, với N là số shard. Vấn đề: thêm một shard thì N đổi, và `% N` của hầu hết key đổi theo. Ví dụ key có hash 7: `7 % 3 = 1` nhưng `7 % 4 = 3`, nên nó phải chuyển từ shard 1 sang shard 3. Gần hết dữ liệu phải di chuyển.",
            "**Consistent hashing** đặt cả node và key lên một vòng tròn; mỗi key thuộc về node đầu tiên gặp được khi đi theo chiều kim đồng hồ. Thêm một node thì nó chỉ nhận các key nằm giữa nó và node liền trước, mọi key khác đứng yên.",
          ],
          quiz: {
            question: "Đang có 4 shard chia theo `hash(key) % 4`. Thêm shard thứ 5 thì sao?",
            options: [
              "Chỉ khoảng 1/5 dữ liệu chuyển sang shard mới",
              "Phần lớn key đổi kết quả `% N`, nên phần lớn dữ liệu phải chuyển chỗ",
              "Không key nào phải chuyển",
              "DB tự chia lại, không tốn gì",
            ],
            answer: 1,
            explain: "Một key chỉ ở yên khi `hash % 4` bằng `hash % 5`, tức chỉ khoảng 1/5 số key (với hash từ 0 tới 19 chỉ có 0, 1, 2, 3). Khoảng 4/5 còn lại phải chuyển. Consistent hashing sửa đúng chỗ này.",
          },
        },
        {
          id: "cap",
          title: "CAP: mạng đứt thì chọn gì",
          intro: [
            "Hệ thống chạy trên nhiều node, và mạng giữa các node **luôn có thể đứt** (chữ P trong CAP, partition). Khi đứt, một node không liên lạc được với node kia phải chọn một trong hai cách trả lời.",
            "Chọn **C** (consistency): báo lỗi thay vì trả dữ liệu có thể sai. Hợp với số dư, tồn kho, đặt vé, vì trả số dư cũ còn tệ hơn báo lỗi. Chọn **A** (availability): vẫn trả lời dù dữ liệu có thể cũ. Hợp với feed, lượt xem, giỏ hàng, vì lượt xem lệch vài phút thì không ai thiệt.",
            "Chọn theo **từng chức năng**, không phải một lần cho cả hệ thống: cùng một app có thể CP cho thanh toán và AP cho lượt xem.",
            "C của CAP khác C của {{acid|ACID}}. C của CAP: mọi node thấy cùng một bản mới nhất của dữ liệu. C của ACID: sau transaction, dữ liệu vẫn thoả mọi ràng buộc (khoá ngoại, `CHECK`, số dư không âm).",
          ],
          quiz: {
            question: "Mạng giữa hai data center bị đứt. Chức năng nào nên chọn CP (báo lỗi) thay vì AP (trả dữ liệu có thể cũ)?",
            options: ["Đếm lượt xem video", "Trừ số dư khi chuyển tiền", "Hiển thị feed bài viết", "Gợi ý sản phẩm"],
            answer: 1,
            explain: "Trả số dư cũ có thể cho rút cùng một khoản tiền hai lần. Lượt xem, feed, gợi ý lệch một chút thì không ai thiệt, nên ưu tiên vẫn trả lời.",
          },
        },
      ],
    },
    {
      id: "microservices",
      title: "Phần 4: Monolith và microservices",
      scene: "micro",
      intro: [
        "Microservices deploy độc lập, scale riêng service nóng, hợp nhiều team; trả giá bằng gọi qua mạng, không có transaction chung, debug cần distributed tracing. Monolith một `@Transactional` là xong. **Modular monolith** là điểm giữa: chia module theo domain, chỉ gọi qua interface công khai.",
        "Câu trả lời tốt là \"tuỳ\" kèm lý do. Distributed monolith (chung DB, gọi đồng bộ dây chuyền, phải deploy cùng nhau) có hết nhược điểm của cả hai. Mỗi service sở hữu DB riêng.",
        "Muốn tách thì tách dần theo kiểu **strangler fig** (tên một loài cây mọc quấn quanh cây cũ rồi thay dần nó): dựng service mới cho một module, cho gateway chuyển phần đó sang service mới, phần còn lại vẫn ở monolith. Bắt đầu từ module ít phụ thuộc như notification, không viết lại tất cả một lần.",
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
        "Payment chậm thì mỗi request gọi sang nó giữ một thread Tomcat trong lúc chờ. Hết thread, cả những request không liên quan tới payment của service mình cũng phải xếp hàng: lỗi lan dây chuyền. Ba lớp phòng thủ, theo thứ tự quan trọng:",
        "**Timeout** là bắt buộc (`setConnectTimeout`, `setReadTimeout` cho `RestClient`), vì không có timeout thì thread chờ vô hạn. Đặt theo p99 của bên kia (99% request của nó nhanh hơn mức này), và nhỏ hơn timeout của bên gọi mình: nếu lớn hơn, bên gọi đã bỏ cuộc mà mình vẫn còn ngồi chờ.",
        "**Retry** chỉ cho thao tác {{idempotent|idempotent}}, và phải có {{backoff|backoff và jitter}}: chờ lâu dần giữa các lần thử, cộng thêm một chút ngẫu nhiên để hàng trăm client không thử lại đúng cùng một lúc. Retry không backoff khi bên kia đang quá tải là tự tay đè chết nó (retry storm).",
        "**Circuit breaker** đặt ở bên gọi. Tỉ lệ lỗi vượt ngưỡng thì chuyển CLOSED → OPEN: không gọi nữa, trả lỗi hoặc fallback ngay, cho bên kia thời gian hồi phục. Hết thời gian chờ thì sang HALF_OPEN, cho vài request đi thử; đủ số lần thử mới so tỉ lệ lỗi với ngưỡng: dưới ngưỡng thì CLOSED, từ ngưỡng trở lên thì OPEN lại.",
      ],
      widget: "circuit-breaker",
      widgetTitle: "Điều khiển circuit breaker",
      after: [
        "Dùng cả Retry và CircuitBreaker của Resilience4j trên một method thì ai bọc ai? Mặc định **Retry bọc ngoài CircuitBreaker**: mỗi lần thử lại đi xuyên qua circuit breaker và được đếm như một lời gọi riêng. Hệ quả: một request thử 3 lần, lần nào cũng lỗi, thì breaker đếm 3 lỗi, nên mở nhanh hơn bạn tưởng.",
        "**Bulkhead** (vách ngăn khoang tàu) giới hạn số lời gọi đồng thời tới một dependency, ví dụ tối đa 10: payment chậm thì chỉ chiếm 10 thread, phần còn lại của app vẫn phục vụ được.",
        "Các annotation của Resilience4j chạy qua proxy (một object Spring tạo ra bọc quanh bean, giống cách `@Transactional` hoạt động). Gọi method từ chính class đó (`this.charge()`) thì không đi qua proxy, nên annotation không có tác dụng.",
      ],
      trap: {
        title: "Retry POST /charge",
        text: "Lần gọi đầu thực ra đã trừ tiền thành công, chỉ là response về chậm nên bị timeout. Retry gửi lại thì trừ tiền lần hai. Phải gửi kèm idempotency key để bên payment nhận ra request trùng. Fallback cũng đừng trả dữ liệu giả như thật: trả trạng thái PENDING để đối soát sau, hoặc báo lỗi rõ ràng.",
      },
      quiz: {
        question: "Mặc định trong Resilience4j, Retry và CircuitBreaker bọc nhau thế nào?",
        options: ["CircuitBreaker bọc ngoài Retry", "Retry bọc ngoài CircuitBreaker, nên mỗi lần retry đều được đếm", "Không liên quan", "Chỉ chạy một cái"],
        answer: 1,
        explain: "Thứ tự aspect mặc định của Resilience4j đặt Retry ở ngoài. Mỗi lần thử lại đi qua CircuitBreaker và được đếm, nên một request lỗi 3 lần tính là 3 lỗi và breaker mở nhanh hơn.",
      },
    },
    {
      id: "saga-ops",
      title: "Phần 6: Saga",
      scene: "sagaops",
      intro: [
        "Đặt hàng cần ba việc ở ba service: tạo đơn (order DB), giữ kho (inventory DB), thu tiền (payment). Không có `@Transactional` nào bọc được cả ba DB. Two-phase commit (2PC) làm được nhưng chậm và dễ treo: mọi bên giữ lock trong lúc chờ coordinator quyết định, và coordinator chết giữa chừng thì các bên kẹt nguyên lock.",
        "**Saga** là chuỗi local transaction, mỗi bước commit riêng ở service của nó: tạo đơn PENDING, giữ kho, thu tiền. Một bước lỗi thì chạy **hành động bù** cho các bước trước, theo thứ tự ngược: trả kho, đổi đơn sang CANCELLED.",
        "Hành động bù không phải rollback: các bước trước đã commit thật, nên tiền đã thu thì phải hoàn bằng một lệnh mới. Bước không bù được (gửi email, giao hàng) đặt ở cuối.",
        "Hai cách điều phối. **Choreography**: mỗi service nghe event rồi tự phát event tiếp; không có trung tâm, nhưng luồng rải rác, khó biết đơn đang ở bước nào. **Orchestration**: một orchestrator ra lệnh từng bước; luồng nằm ở một chỗ, dễ đọc và theo dõi.",
      ],
      quiz: {
        question: "Saga đặt hàng: đơn đã tạo, kho đã giữ, thu tiền thất bại. Làm gì?",
        options: [
          "Rollback cả ba DB",
          "Chạy hành động bù theo thứ tự ngược: trả kho, rồi đổi đơn sang CANCELLED",
          "Để đơn PENDING mãi",
          "Thử thu tiền lại vô hạn",
        ],
        answer: 1,
        explain: "Tạo đơn và giữ kho đã commit ở DB riêng, không rollback được nữa. Saga bù bằng các lệnh mới, theo thứ tự ngược với lúc làm.",
      },
      parts: [
        {
          id: "outbox",
          title: "Outbox: lưu DB và gửi event không lệch nhau",
          intro: [
            "Vấn đề: lưu đơn rồi gửi event lên Kafka là hai việc tách rời. DB commit xong mà app crash trước khi gửi thì **mất event**, các service khác không bao giờ biết có đơn. Gửi trước mà DB rollback thì có event cho một đơn không tồn tại.",
            "**Outbox** chữa bằng cách ghi event vào bảng `outbox` **trong cùng transaction** với đơn hàng: hai thứ cùng commit hoặc cùng mất. Một relay (`@Scheduled` hoặc Debezium) đọc bảng outbox rồi gửi lên Kafka.",
            "Relay có thể gửi xong mà chết trước khi đánh dấu đã gửi, lần sau gửi lại. Tức outbox cho at-least-once, nên consumer vẫn phải idempotent.",
          ],
          quiz: {
            question: "Vì sao outbox ghi event vào bảng trong cùng transaction với đơn hàng?",
            options: [
              "Để Kafka nhận nhanh hơn",
              "Để đơn và event cùng commit hoặc cùng mất, không có cảnh lưu đơn xong mà mất event",
              "Để consumer khỏi phải idempotent",
              "Để khỏi cần Kafka",
            ],
            answer: 1,
            explain: "Một transaction là tất cả hoặc không gì. Event đã nằm an toàn trong DB thì relay gửi lúc nào cũng được. Relay có thể gửi trùng, nên consumer vẫn phải idempotent.",
          },
        },
        {
          id: "rate-limit",
          title: "Rate limiting",
          intro: [
            "Rate limiting giới hạn số request của một client trong một khoảng thời gian, để một client (hoặc kẻ tấn công) không làm nghẽn cả hệ thống. Vượt giới hạn thì trả **429 Too Many Requests** kèm header `Retry-After` báo bao lâu nữa thử lại.",
            "Token bucket phổ biến nhất: mỗi client có một xô chứa tối đa N token, token được thêm đều đặn theo thời gian, mỗi request lấy một token, hết token thì 429. Nó cho phép một đợt dồn ngắn (tới N request) nhưng vẫn giữ đúng tốc độ trung bình.",
            "Nhiều instance thì bộ đếm phải nằm ở một chỗ chung, thường là Redis: `INCR` tăng bộ đếm, `EXPIRE` đặt thời hạn cho cửa sổ. Hai lệnh này tách rời: app chết giữa hai lệnh thì key không bao giờ hết hạn và client bị chặn mãi. Vì vậy gộp chúng vào một Lua script; Redis chạy cả script như một thao tác nguyên tử.",
            "Login thì giới hạn theo cả tài khoản lẫn IP: chỉ theo IP thì kẻ tấn công đổi IP để dò mật khẩu một tài khoản; chỉ theo tài khoản thì một IP dò được hàng loạt tài khoản.",
          ],
          quiz: {
            question: "Giới hạn 100 request/phút. App chạy 3 instance, mỗi instance tự đếm trong RAM. Một client thật sự gửi được bao nhiêu?",
            options: ["100", "Tới 300, vì load balancer chia request ra 3 bộ đếm riêng", "33", "Không giới hạn"],
            answer: 1,
            explain: "Mỗi instance chỉ thấy phần request rơi vào nó, nên mỗi bộ đếm cho tới 100. Bộ đếm phải nằm ở chỗ chung như Redis thì giới hạn mới đúng.",
          },
        },
        {
          id: "observability",
          title: "Observability: logs, metrics, traces",
          intro: [
            "Observability là nhìn từ bên ngoài mà biết hệ thống đang làm gì. Có ba nguồn, mỗi nguồn trả lời một câu hỏi khác.",
            "**Metrics** trả lời \"có chuyện từ lúc nào, ở đâu\": số request và thời gian xử lý theo endpoint (Micrometer), p95/p99, pool connection HikariCP. Nhìn p99 chứ không chỉ trung bình: trung bình 100 ms vẫn có thể giấu 1% request chậm 5 giây.",
            "**Traces** theo dấu một request qua nhiều service (Micrometer Tracing + OpenTelemetry, truyền qua header `traceparent`), cho biết chậm ở chặng nào. **Logs** cho chi tiết từng bước; ghi dạng JSON có `traceId` để lọc đúng log của request đó.",
            "Không gắn tag có giá trị vô hạn như `userId` vào metrics: mỗi giá trị tag tạo ra một chuỗi số liệu riêng, một triệu user là một triệu chuỗi, hệ thống metrics hết bộ nhớ.",
          ],
          quiz: {
            question: "API bỗng chậm. Điều tra theo thứ tự nào hợp lý?",
            options: ["Đọc code từ đầu", "Metrics (từ lúc nào, endpoint nào, HikariCP, GC) → trace của request chậm → log theo traceId → EXPLAIN nếu nghi DB", "Restart server", "Tăng RAM"],
            answer: 1,
            explain: "Metrics khoanh vùng (từ lúc nào, endpoint nào, pool có cạn không), trace chỉ ra chặng chậm, log theo traceId cho chi tiết. Nhìn p99, vì latency trung bình dễ giấu những request rất chậm.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Ở level của em, em tập trung vào lý do và trade-off. Muốn scale ngang thì app phải stateless: session, cache trong RAM, @Scheduled và file local đều phải đưa ra chỗ dùng chung. Để giảm tải DB em dùng cache-aside với Redis, khi ghi thì cập nhật DB rồi xoá key, và cẩn thận stampede, penetration, avalanche. Việc không cần làm ngay em đẩy qua message queue, consumer idempotent vì at-least-once. Khi gọi service khác em luôn đặt timeout, chỉ retry thao tác idempotent có backoff, và dùng circuit breaker ở bên gọi. Không có transaction chung giữa các service nên em dùng saga có hành động bù, và outbox để ghi DB và publish event không lệch nhau. Cuối cùng là logs, metrics, traces để biết hệ thống đang chậm ở đâu.",
};
