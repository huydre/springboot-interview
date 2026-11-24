import timeline from "../timelines/sd-concepts.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Concepts from study note 10.01. The note is conceptual: no performance numbers, configuration values are examples.
export const sdConcepts: Lesson = {
  slug: "sd-concepts",
  crumb: "System Design Concepts",
  videoDir: "/videos/sd-concepts",
  videoVersion: "dea7c5fc",
  scenes: timeline as Scene[],
  title: "System Design Concepts",
  subtitle:
    "Scale và stateless, load balancer và API gateway, polling, SSE và WebSocket, cache nhiều tầng, message queue, replication, sharding, CAP, microservices, timeout, retry, circuit breaker, saga, outbox, rate limiting, observability.",
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
        "Vì vậy mỗi request tự mang thông tin của nó (token JWT), còn state dùng chung thì đẩy ra Redis hoặc DB. Những thứ hay sai khi lên nhiều instance:",
        "- **`HttpSession` trong RAM**",
        "- **Cache trong RAM**",
        "- **File lưu ở ổ local**",
        "- **Job `@Scheduled`**",
        "Chọn từng thứ để xem nó còn đúng không.",
      ],
      predict: {
        question: "Trang hiển thị \"số lượt xem\" lấy từ một biến `AtomicLong` trong RAM của app, mỗi lần mở trang thì tăng 1. App chạy 3 instance sau load balancer, bạn F5 liên tục. Bạn thấy gì?",
        options: [
          "Số tăng đều 1, 2, 3, 4... vì `AtomicLong` an toàn với nhiều thread",
          "Số nhảy qua lại giữa ba dãy đếm riêng, vì mỗi instance có biến của nó",
          "App báo lỗi vì nhiều instance cùng ghi một biến",
          "Số luôn đứng yên ở 0",
        ],
        answer: 1,
        explain: "`AtomicLong` chỉ an toàn giữa các thread **trong một JVM**. Mỗi instance là một JVM riêng với biến riêng, nên load balancer chuyển bạn sang instance nào thì thấy dãy đếm của instance đó. Muốn một bộ đếm chung thì đặt ở Redis (`INCR`) hoặc DB.",
      },
      widget: "stateless-check",
      widgetTitle: "Còn đúng khi chạy 3 instance không",
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Scale ngang → request sau có thể rơi vào instance khác → state không được nằm trong RAM của một instance, phải đẩy ra Redis hoặc DB.",
        ],
      },
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
            "Scale ngang cần một thứ đứng trước các instance để chia request. Ba thứ này đều đứng giữa client và app, nên rất dễ lẫn. Phân biệt bằng hai câu hỏi: nó đứng trước ai, và nó làm việc gì. Bấm từng dòng để xem câu nên nói khi phỏng vấn.",
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
        {
          id: "realtime",
          title: "Server báo tin cho client: polling, long polling, SSE, WebSocket",
          intro: [
            "HTTP bình thường là client hỏi, server trả lời. Nhưng có tin nhắn mới, giá đổi, đơn vừa giao thì làm sao **server báo** cho client?",
            "Bốn cách, từ đơn giản tới mạnh:",
            "- **Short polling**: client gọi `GET /notifications?since=...` mỗi N giây. Đơn giản nhất, chạy qua mọi proxy; nhưng tin tới trễ tối đa N giây, và phần lớn request về tay không.",
            "- **Long polling**: server giữ request tới khi có dữ liệu hoặc hết hạn (ví dụ 30 giây), trả về, rồi client gọi lại ngay. Gần realtime mà vẫn là HTTP thường; đổi lại mỗi client đang chờ giữ một request mở.",
            "- **SSE (Server-Sent Events)**: một response HTTP không đóng, `Content-Type: text/event-stream`, server ghi từng event vào đó. **Một chiều**, từ server tới client. Trình duyệt (`EventSource`) tự kết nối lại và gửi header `Last-Event-ID` (id của event cuối đã nhận) để server gửi tiếp từ đó. Spring MVC: `SseEmitter`.",
            "- **WebSocket**: nâng cấp kết nối HTTP thành một kênh **hai chiều** sống lâu. Hợp chat, game, cùng sửa tài liệu. Phải tự lo reconnect, heartbeat (tin nhỏ gửi đều đặn để kết nối không bị coi là chết), và cấu hình proxy cho phép nâng cấp kết nối.",
            "Chọn cách hợp với từng tình huống bên dưới.",
          ],
          after: [
            "Chạy nhiều instance thì SSE và WebSocket có thêm ba điều phải lo, xem phần ngay bên dưới.",
          ],
          widgetTitle: "Chọn cách server báo tin",
          drill: {
            choices: ["Short polling", "Long polling", "SSE", "WebSocket"],
            summary: "Hỏi hai câu: tin cần tới nhanh cỡ nào, và client có cần gửi lên liên tục không. Chậm được thì polling; server đẩy một chiều thì SSE; hai chiều liên tục thì WebSocket.",
            items: [
              { q: "Trang admin xem doanh thu, số liệu cập nhật 5 phút một lần là đủ.", a: "Short polling", why: "Trễ vài phút không sao, và gọi mỗi phút một lần là rẻ. Không cần giữ kết nối nào." },
              { q: "Ứng dụng chat: hai người gõ qua lại liên tục, cần hiện \"đang gõ...\".", a: "WebSocket", why: "Cả hai chiều đều gửi liên tục, độ trễ thấp. Đúng việc của một kênh hai chiều." },
              { q: "Bảng giá chứng khoán: server đẩy giá mới liên tục, người xem chỉ xem.", a: "SSE", why: "Chỉ một chiều từ server, nhiều event. SSE là HTTP thường, trình duyệt tự kết nối lại." },
              { q: "Theo dõi tiến độ một job export chạy vài phút, muốn đẩy % hoàn thành về trình duyệt.", a: "SSE", why: "Server báo tiến độ một chiều cho tới khi xong. Không cần WebSocket." },
              { q: "Ứng dụng mobile cũ chỉ có HTTP client đơn giản, cần biết kết quả thanh toán trong vài giây sau khi trả.", a: "Long polling", why: "Một request chờ tới khi có kết quả, không cần thư viện SSE hay WebSocket, và tin tới gần như ngay." },
            ],
          },
        },
        {
          id: "realtime-multi",
          senior: true,
          title: "SSE và WebSocket khi chạy nhiều instance: ba điều phải lo",
          intro: [
            "SSE và WebSocket giữ kết nối mở rất lâu, nên khi chạy thật sau load balancer có ba điều phải lo:",
            "- **Kết nối nằm trên một instance**: user A nối vào instance 1, user B nối vào instance 3. Instance 1 không gửi thẳng cho B được. Cần một kênh chung (Redis Pub/Sub: kênh publish/subscribe của Redis, hoặc Kafka): instance nhận tin thì publish, mọi instance nghe và đẩy cho client đang nối với mình.",
            "- **Timeout của LB và proxy**: kết nối im lặng lâu bị cắt. Gửi heartbeat với chu kỳ ngắn hơn timeout đó. Nginx mặc định gom response vào bộ đệm rồi mới gửi, nên với SSE phải tắt (`proxy_buffering off`), không thì event bị giữ lại.",
            "- **Dọn dẹp**: `SseEmitter` có ba callback `onCompletion`, `onTimeout`, `onError` (gọi khi kết nối xong, hết giờ hoặc lỗi). Gỡ emitter khỏi danh sách đang giữ trong cả ba, không thì rò bộ nhớ.",
          ],
          takeaway: {
            lines: [
              "SSE cho server đẩy một chiều, WebSocket cho hai chiều. Chạy nhiều instance thì cần kênh pub/sub chung, vì mỗi kết nối chỉ nằm trên một instance.",
            ],
          },
          quiz: {
            question: "Chat dùng WebSocket, chạy 3 instance sau load balancer. A (nối vào instance 1) gửi tin cho B (nối vào instance 3), B không nhận được. Vì sao, sửa thế nào?",
            options: [
              "WebSocket không chạy được sau load balancer",
              "Instance 1 không giữ kết nối của B; cho các instance publish tin qua kênh chung (Redis Pub/Sub, Kafka), instance 3 nhận rồi đẩy cho B",
              "Bật sticky session (load balancer luôn đưa một client về cùng một instance) là đủ",
              "Đổi sang SSE",
            ],
            answer: 1,
            explain: "Sticky session chỉ giữ một client ở một instance, không giúp hai client ở hai instance nói chuyện với nhau. Cần một kênh mà mọi instance cùng nghe.",
          },
        },
      ],
    },
    {
      id: "cache-queue",
      title: "Phần 2: Cache nhiều tầng và message queue",
      scene: "cachequeue",
      intro: [
        "App stateless thì thêm instance là xong, còn DB thì khó scale (Phần 1). Cách rẻ nhất để đỡ tải cho DB là cache.",
        "Cache giữ một bản sao dữ liệu ở gần người đọc hơn, để đỡ phải hỏi DB. Một request đi qua nhiều tầng:",
        "- **Trình duyệt**: `Cache-Control`, {{etag|ETag}}.",
        "- **CDN**: cho file tĩnh.",
        "- **Cache trong app**: Caffeine.",
        "- **Cache dùng chung giữa các instance**: Redis.",
        "- **Buffer pool**: của chính DB.",
        "Cách hay dùng nhất là **cache-aside**. Đọc: xem Redis trước; nếu miss (không có) thì query DB rồi nạp vào Redis kèm TTL (thời hạn sống của key). Ghi: cập nhật DB trước, rồi **xoá** key; lần đọc sau tự nạp lại giá trị mới.",
        "Vì sao xoá key mà không ghi giá trị mới vào cache? Hai request cùng sửa giá một sản phẩm: A ghi DB giá 10, ngay sau đó B ghi DB giá 12. Nhưng B ghi cache trước A, nên cuối cùng cache giữ 10 trong khi DB là 12, và sai như vậy tới khi hết TTL. Xoá key thì lần đọc sau luôn nạp lại từ DB. Vẫn còn một khe hở nhỏ, nên luôn đặt TTL làm lưới an toàn.",
        "Hai cách ghi khác: **write-through** ghi cache và DB cùng lúc (nhất quán hơn, ghi chậm hơn); **write-behind** ghi cache trước, ghi DB sau (nhanh, nhưng app chết trước khi ghi DB là mất dữ liệu).",
      ],
      board: {
        title: "Cache-aside: đọc và ghi",
        highlight: "đọc và ghi",
        chips: ["Đọc: Redis trước", "Ghi: DB trước, rồi xoá key"],
        cards: [
          {
            title: "Luồng đọc",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["Request đọc", "Xem key trong Redis"],
              ok: ["Hit", "Trả ngay"],
              bad: ["Miss", "Query DB, nạp Redis"],
            },
            notes: ["Nạp vào Redis kèm TTL, tức thời hạn sống của key."],
            takeaway: "Miss thì hỏi DB rồi nạp lại cache",
          },
          {
            title: "Luồng ghi",
            diagram: {
              kind: "flow",
              steps: ["Cập nhật DB", "Xoá key trong Redis"],
              ok: ["Xoá key", "Lần đọc sau nạp lại"],
              bad: ["Ghi giá trị vào cache", "Có thể sai tới hết TTL"],
            },
            notes: ["Hai request ghi song song có thể cập nhật cache theo thứ tự khác với DB. Xoá key thì không còn giá trị nào để sai."],
            takeaway: "Ghi DB trước, xoá key, luôn đặt TTL",
          },
        ],
        conclusion: "**Kết luận:** cache để hiển thị, còn quyết định quan trọng như trừ kho thì dựa trên DB.",
      },
      after: [
        "Không dùng số tồn kho trong cache để **quyết định bán**. Cache có thể cũ vài giây: cache còn ghi 1 trong khi DB đã về 0, bán theo cache là bán quá số hàng có. Cache dùng để hiển thị thì được; quyết định trừ kho phải dựa trên DB (xem bài System Design Practice, phần checkout).",
      ],
      takeaway: {
        lines: [
          "Cache để **hiển thị**. Quyết định quan trọng như trừ kho thì dựa trên **DB**.",
        ],
      },
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
          id: "http-cache",
          title: "Cache-Control: browser và CDN lưu gì, bao lâu",
          intro: [
            "Hai tầng cache đầu tiên (trình duyệt, CDN) không do code app điều khiển mà do **header của response**. Chọn sai thì hoặc người dùng thấy file cũ sau khi deploy, hoặc mọi lượt tải đều đập vào server.",
            "Các giá trị hay dùng của `Cache-Control`:",
            "- **`max-age=31536000, immutable`**: dùng lại một năm mà không hỏi server. Hợp với file có hash trong tên (`app.3f9a1c.js`): nội dung đổi thì tên đổi, nên URL mới không bao giờ trùng bản cache cũ.",
            "- **`no-cache`**: **vẫn được lưu**, nhưng mỗi lần dùng phải hỏi server xác nhận bằng {{etag|ETag}}; chưa đổi thì server trả `304 Not Modified` không kèm body. Hợp với `index.html`.",
            "- **`no-store`**: không lưu ở đâu cả. Hợp với dữ liệu nhạy cảm (số dư, thông tin cá nhân).",
            "- **`private`**: chỉ trình duyệt của chính người dùng được lưu. **`public`** cho phép cả CDN và proxy lưu dùng chung. Response cá nhân hoá theo người dùng không được để CDN lưu chung.",
            "- **`s-maxage`**: thời hạn riêng cho cache dùng chung như CDN, tách khỏi `max-age` của trình duyệt.",
            "`no-cache` **không** có nghĩa là \"không cache\", đó là nhầm lẫn rất hay gặp.",
          ],
          widgetTitle: "Deploy bản mới",
          compare: [
            way(
              "Một chính sách cho mọi file",
              `index.html          Cache-Control: max-age=31536000
app.js              Cache-Control: max-age=31536000`,
              [
                ask("Deploy bản mới, người dùng mở lại trang", bad("`index.html` cũ nằm trong cache một năm, vẫn trỏ tới `app.js` cũ: người dùng không thấy bản mới.")),
              ],
              "Cache dài chỉ an toàn khi URL đổi theo nội dung.",
            ),
            way(
              "Theo từng loại file",
              `index.html            Cache-Control: no-cache
app.3f9a1c.js         Cache-Control: public, max-age=31536000, immutable
GET /api/me           Cache-Control: private, no-store`,
              [
                ask("Deploy bản mới", ok("`index.html` hỏi lại, nhận bản mới trỏ tới `app.8b21de.js` (tên mới nên tải mới); file cũ không còn được dùng.")),
                ask("Người dùng mở lại khi chưa deploy gì", ok("`index.html` nhận `304`, file JS lấy từ cache, không tải lại.")),
                ask("CDN và `/api/me`", ok("`no-store` và `private`: CDN không lưu dữ liệu của người dùng.")),
              ],
              "File bất biến cache dài, điểm vào luôn xác nhận lại, dữ liệu cá nhân không cache chung.",
            ),
          ],
          takeaway: {
            lines: [
              "File có hash trong tên: cache một năm, `immutable`. Điểm vào như `index.html`: `no-cache`. Dữ liệu cá nhân: `private` hoặc `no-store`.",
            ],
          },
          quiz: {
            question: "`Cache-Control: no-cache` có nghĩa là gì?",
            options: [
              "Không bao giờ lưu response",
              "Được lưu, nhưng mỗi lần dùng phải xác nhận lại với server (thường qua ETag)",
              "Chỉ CDN được lưu",
              "Lưu một năm",
            ],
            answer: 1,
            explain: "`no-store` mới là \"đừng lưu\". `no-cache` cho lưu nhưng bắt xác nhận lại trước khi dùng; chưa đổi thì server trả 304.",
          },
        },
        {
          id: "message-queue",
          title: "Message queue",
          intro: [
            "Cache đỡ việc đọc. Còn việc chậm mà không cần xong ngay, như gửi email, thì đẩy ra khỏi luồng chính.",
            "Việc không cần làm ngay thì đẩy qua queue. Ví dụ đặt hàng: order-service lưu đơn, gửi message `OrderCreated` vào queue rồi trả 201 ngay; notification-service đọc message và gửi email sau.",
            "Được gì:",
            "- **Tách rời**: order-service không cần biết ai gửi email.",
            "- **San tải đỉnh**: giờ cao điểm message xếp hàng, consumer xử lý dần.",
            "- **Chịu lỗi**: notification-service chết thì message vẫn nằm trong queue chờ.",
            "- **Trả lời nhanh hơn**: order-service không chờ email gửi xong.",
            "Đổi lại là **eventual consistency**: email tới sau vài giây, không tới ngay.",
            "Kafka là một log lưu lâu: consumer đọc lại được từ đầu, thứ tự chỉ giữ **trong một partition** (nên dùng `orderId` làm key để event của cùng một đơn đi đúng thứ tự). RabbitMQ là broker: message bị xoá sau khi consumer ack (báo đã xử lý xong).",
            "Queue thường giao **at-least-once** (ít nhất một lần): consumer xử lý xong nhưng chết trước khi ack thì message được giao lại. Vì vậy consumer phải {{idempotent|idempotent}}: lưu id event vào bảng `processed_event` có unique constraint, trong cùng transaction với việc xử lý; gặp id đã có thì bỏ qua. Message lỗi mãi thì chuyển vào {{dead-letter|DLQ}} để người xem, thay vì thử lại vô tận và chặn cả hàng.",
          ],
          board: {
            title: "Message queue: tách việc chậm khỏi luồng chính",
            highlight: "tách việc chậm",
            chips: ["Tách rời", "San tải đỉnh", "Chịu lỗi"],
            cards: [
              {
                title: "Producer, queue, consumer",
                diagram: {
                  kind: "pipe",
                  from: "order-service",
                  via: "Queue: OrderCreated",
                  to: "notification-service",
                  skipped: ["Chờ gửi email xong"],
                  skippedLabel: "Không phải chờ",
                },
                notes: ["order-service lưu đơn, gửi message rồi trả 201 ngay. Email gửi sau, nên nhất quán cuối cùng (eventual consistency)."],
                takeaway: "Việc không cần làm ngay thì đẩy qua queue",
              },
              {
                title: "Giao at-least-once",
                diagram: {
                  kind: "flow",
                  steps: ["Consumer nhận message", "Xử lý xong"],
                  ok: ["Ack kịp", "Message xong việc"],
                  bad: ["Chết trước khi ack", "Message giao lại"],
                },
                notes: ["Vì có thể giao hai lần, consumer phải idempotent: lưu id event vào bảng `processed_event` có unique constraint, gặp id đã có thì bỏ qua."],
                takeaway: "Giao ít nhất một lần, nên consumer idempotent",
              },
            ],
            conclusion: "**Kết luận:** queue giao at-least-once, nên cùng một message có thể tới hai lần.",
          },
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Queue giao at-least-once → cùng một message có thể tới hai lần → consumer phải idempotent (bảng `processed_event` có unique constraint).",
            ],
          },
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
      title: "Phần 3: Nhân bản và chia dữ liệu: replication, sharding, CAP",
      scene: "data",
      intro: [
        "Cache vẫn chưa đỡ đủ phần đọc thì chia việc đọc sang các bản sao của DB.",
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
      takeaway: {
        lines: [
          "Đọc ngay sau khi ghi thì đọc **primary**. Chỉ truy vấn chấp nhận trễ mới sang replica.",
        ],
      },
      quiz: {
        question: "Replication và backup khác nhau thế nào?",
        options: ["Giống nhau", "Replication sao chép mọi thay đổi kể cả xoá nhầm; backup là bản chụp để quay lại quá khứ", "Backup nhanh hơn", "Replication chỉ cho MySQL"],
        answer: 1,
        explain: "Lỡ tay `DELETE` trên primary thì replica cũng xoá theo sau vài mili giây. Backup là bản chụp ở một thời điểm, nên quay lại được lúc trước khi xoá. Cần cả hai.",
      },
      parts: [
        {
          id: "sharding",
          senior: true,
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
          senior: true,
          title: "CAP: mạng đứt thì chọn gì",
          intro: [
            "Hệ thống chạy trên nhiều node, và mạng giữa các node **luôn có thể đứt** (chữ P trong CAP, partition). Khi đứt, một node không liên lạc được với node kia phải chọn một trong hai cách trả lời.",
            "Chọn **C** (consistency): báo lỗi thay vì trả dữ liệu có thể sai. Hợp với số dư, tồn kho, đặt vé, vì trả số dư cũ còn tệ hơn báo lỗi. Chọn **A** (availability): vẫn trả lời dù dữ liệu có thể cũ. Hợp với feed, lượt xem, giỏ hàng, vì lượt xem lệch vài phút thì không ai thiệt.",
            "Chọn theo **từng chức năng**, không phải một lần cho cả hệ thống: cùng một app có thể CP cho thanh toán và AP cho lượt xem.",
            "C của CAP khác C của {{acid|ACID}}. C của CAP: mọi node thấy cùng một bản mới nhất của dữ liệu. C của ACID: sau transaction, dữ liệu vẫn thoả mọi ràng buộc (khoá ngoại, `CHECK`, số dư không âm).",
          ],
          takeaway: {
            lines: [
              "Mạng đứt thì chọn CP hay AP **theo từng chức năng**: sai số liệu có thiệt hại (số dư, tồn kho) thì CP, lệch một chút không sao (feed, lượt xem) thì AP.",
            ],
          },
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
        "Các phần trước nói nhiều về chuyện gọi giữa các service. Nhưng có nên chia thành nhiều service ngay từ đầu không?",
        "- **Microservices**: deploy độc lập, scale riêng service nóng, hợp nhiều team; trả giá bằng gọi qua mạng, không có transaction chung, debug cần distributed tracing.",
        "- **Monolith**: một `@Transactional` là xong.",
        "- **Modular monolith**: điểm giữa, chia module theo domain, chỉ gọi qua interface công khai.",
        "Câu trả lời tốt là \"tuỳ\" kèm lý do. Distributed monolith (chung DB, gọi đồng bộ dây chuyền, phải deploy cùng nhau) có hết nhược điểm của cả hai. Mỗi service sở hữu DB riêng.",
        "Muốn tách thì tách dần theo kiểu **strangler fig** (tên một loài cây mọc quấn quanh cây cũ rồi thay dần nó): dựng service mới cho một module, cho gateway chuyển phần đó sang service mới, phần còn lại vẫn ở monolith. Bắt đầu từ module ít phụ thuộc như notification, không viết lại tất cả một lần.",
      ],
      quiz: {
        question: "Vì sao mỗi microservice nên có DB riêng?",
        options: ["Để rẻ hơn", "Dùng chung DB thì đổi schema của A làm hỏng B, không deploy độc lập được", "Vì bắt buộc", "Để nhanh hơn"],
        answer: 1,
        explain: "Dùng chung một DB thì đổi schema của service A có thể làm hỏng service B đang đọc cùng bảng, nên hai service không deploy độc lập được. Đổi lại, join dữ liệu giữa nhiều service trở nên khó.",
      },
    },
    {
      id: "resilience",
      senior: true,
      title: "Phần 5: Timeout, retry, circuit breaker",
      scene: "resilience",
      intro: [
        "Payment chậm thì mỗi request gọi sang nó giữ một thread Tomcat trong lúc chờ. Hết thread, cả những request không liên quan tới payment của service mình cũng phải xếp hàng: lỗi lan dây chuyền. Ba lớp phòng thủ, theo thứ tự quan trọng:",
        "- **Timeout** là bắt buộc (`setConnectTimeout`, `setReadTimeout` cho `RestClient`), vì không có timeout thì thread chờ vô hạn. Đặt theo p99 của bên kia (99% request của nó nhanh hơn mức này), và nhỏ hơn timeout của bên gọi mình: nếu lớn hơn, bên gọi đã bỏ cuộc mà mình vẫn còn ngồi chờ.",
        "- **Retry** chỉ cho thao tác {{idempotent|idempotent}}, và phải có {{backoff|backoff và jitter}}: chờ lâu dần giữa các lần thử, cộng thêm một chút ngẫu nhiên để hàng trăm client không thử lại đúng cùng một lúc. Retry không backoff khi bên kia đang quá tải là tự tay đè chết nó (retry storm).",
        "- **Circuit breaker** đặt ở bên gọi. Tỉ lệ lỗi vượt ngưỡng thì chuyển CLOSED → OPEN: không gọi nữa, trả lỗi hoặc fallback ngay, cho bên kia thời gian hồi phục. Hết thời gian chờ thì sang HALF_OPEN, cho vài request đi thử; đủ số lần thử mới so tỉ lệ lỗi với ngưỡng: dưới ngưỡng thì CLOSED, từ ngưỡng trở lên thì OPEN lại.",
      ],
      predict: {
        question: "Circuit breaker đang **OPEN**. Một request mới cần gọi payment. Chuyện gì xảy ra?",
        options: [
          "Vẫn gọi payment như bình thường",
          "Không gọi payment, trả lỗi hoặc chạy fallback ngay",
          "Chờ payment hồi phục rồi mới gọi",
          "Tự retry 3 lần",
        ],
        answer: 1,
        explain: "OPEN nghĩa là ngừng gọi để bên kia có thời gian hồi phục. Chỉ khi hết thời gian chờ, breaker mới sang HALF_OPEN và cho vài request đi thử.",
      },
      widget: "circuit-breaker",
      widgetTitle: "Điều khiển circuit breaker",
      after: [
        "Dùng cả Retry và CircuitBreaker của Resilience4j trên một method thì ai bọc ai? Mặc định **Retry bọc ngoài CircuitBreaker**: mỗi lần thử lại đi xuyên qua circuit breaker và được đếm như một lời gọi riêng. Hệ quả: một request thử 3 lần, lần nào cũng lỗi, thì breaker đếm 3 lỗi, nên mở nhanh hơn bạn tưởng.",
        "**Bulkhead** (vách ngăn khoang tàu) giới hạn số lời gọi đồng thời tới một dependency, ví dụ tối đa 10: payment chậm thì chỉ chiếm 10 thread, phần còn lại của app vẫn phục vụ được.",
        "Các annotation của Resilience4j chạy qua proxy (một object Spring tạo ra bọc quanh bean, giống cách `@Transactional` hoạt động). Gọi method từ chính class đó (`this.charge()`) thì không đi qua proxy, nên annotation không có tác dụng.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Không timeout → thread chờ vô hạn → hết thread Tomcat → cả request không liên quan cũng xếp hàng, lỗi lan dây chuyền.",
        ],
      },
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
      senior: true,
      title: "Phần 6: Saga và outbox",
      scene: "sagaops",
      intro: [
        "Microservices không có transaction chung (Phần 4). Vậy một việc trải qua ba DB thì giữ đúng bằng cách nào?",
        "Đặt hàng cần ba việc ở ba service: tạo đơn (order DB), giữ kho (inventory DB), thu tiền (payment). Không có `@Transactional` nào bọc được cả ba DB. Two-phase commit (2PC) làm được nhưng chậm và dễ treo: mọi bên giữ lock trong lúc chờ coordinator quyết định, và coordinator chết giữa chừng thì các bên kẹt nguyên lock.",
        "**Saga** là chuỗi local transaction, mỗi bước commit riêng ở service của nó: tạo đơn PENDING, giữ kho, thu tiền. Một bước lỗi thì chạy **hành động bù** cho các bước trước, theo thứ tự ngược: trả kho, đổi đơn sang CANCELLED.",
        "Hành động bù không phải rollback: các bước trước đã commit thật, nên tiền đã thu thì phải hoàn bằng một lệnh mới. Bước không bù được (gửi email, giao hàng) đặt ở cuối.",
        "Hai cách điều phối. **Choreography**: mỗi service nghe event rồi tự phát event tiếp; không có trung tâm, nhưng luồng rải rác, khó biết đơn đang ở bước nào. **Orchestration**: một orchestrator ra lệnh từng bước; luồng nằm ở một chỗ, dễ đọc và theo dõi.",
      ],
      board: {
        title: "Saga: bước lỗi thì bù ngược lại",
        highlight: "bù ngược lại",
        chips: ["Mỗi bước commit riêng", "Bù không phải rollback"],
        cards: [
          {
            title: "Đặt hàng qua ba service",
            diagram: {
              kind: "flow",
              steps: ["Tạo đơn PENDING", "Giữ kho", "Thu tiền"],
              ok: ["Cả ba thành công", "Đơn hoàn tất"],
              bad: ["Thu tiền lỗi", "Bù: trả kho, CANCELLED"],
            },
            notes: ["Các bước trước đã commit thật, nên phải bù bằng lệnh mới, theo thứ tự ngược. Bước không bù được (gửi email) đặt ở cuối."],
            takeaway: "Hành động bù chạy ngược thứ tự",
          },
          {
            title: "Orchestration",
            diagram: {
              kind: "hub",
              inputs: [{ label: "order" }, { label: "inventory" }, { label: "payment" }],
              center: "Orchestrator",
              rulesTitle: "Orchestrator lo",
              rules: ["Ra lệnh từng bước", "Luồng nằm ở một chỗ", "Dễ đọc và theo dõi"],
            },
            notes: ["Choreography thì mỗi service nghe event rồi tự phát event tiếp: không có trung tâm nhưng khó biết đơn đang ở bước nào."],
            takeaway: "Một nơi điều phối thì dễ theo dõi",
          },
        ],
        conclusion: "**Kết luận:** không có transaction chung thì dùng chuỗi local transaction kèm hành động bù.",
      },
      takeaway: {
        lines: [
          "Bù không phải rollback: bước trước đã commit, nên phải bù bằng **lệnh mới**.",
          "Bước không bù được (gửi email, giao hàng) đặt ở **cuối** saga.",
        ],
      },
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
          senior: true,
          title: "Outbox: lưu DB và gửi event không lệch nhau",
          intro: [
            "Vấn đề: lưu đơn rồi gửi event lên Kafka là hai việc tách rời. DB commit xong mà app crash trước khi gửi thì **mất event**, các service khác không bao giờ biết có đơn. Gửi trước mà DB rollback thì có event cho một đơn không tồn tại.",
            "**Outbox** chữa bằng cách ghi event vào bảng `outbox` **trong cùng transaction** với đơn hàng: hai thứ cùng commit hoặc cùng mất. Một relay (`@Scheduled` hoặc Debezium) đọc bảng outbox rồi gửi lên Kafka.",
            "Relay có thể gửi xong mà chết trước khi đánh dấu đã gửi, lần sau gửi lại. Tức outbox cho at-least-once, nên consumer vẫn phải idempotent.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Event ghi cùng transaction với đơn → không còn cảnh mất event → nhưng relay có thể gửi trùng → consumer vẫn phải idempotent.",
            ],
          },
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
      ],
    },
    {
      id: "ops",
      title: "Phần 7: Rate limiting và observability",
      intro: [
        "Hệ thống chạy được rồi thì còn hai việc vận hành: chặn một client dùng quá phần của mình, và nhìn được hệ thống đang làm gì khi có sự cố.",
      ],
      parts: [
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
            "Observability là nhìn từ bên ngoài mà biết hệ thống đang làm gì. Có ba nguồn, mỗi nguồn trả lời một câu hỏi khác:",
            "- **Metrics** trả lời \"có chuyện từ lúc nào, ở đâu\": số request và thời gian xử lý theo endpoint (Micrometer: thư viện đo số liệu của Spring), p95/p99 (95% hoặc 99% request nhanh hơn mức này), pool connection HikariCP (thư viện quản lý nhóm connection tới DB). Nhìn p99 chứ không chỉ trung bình: trung bình 100 ms vẫn có thể giấu 1% request chậm 5 giây.",
            "- **Traces** theo dấu một request qua nhiều service (Micrometer Tracing + OpenTelemetry, chuẩn chung để thu trace; mã định danh request truyền qua header `traceparent`), cho biết chậm ở chặng nào.",
            "- **Logs** cho chi tiết từng bước; ghi dạng JSON có `traceId` để lọc đúng log của request đó.",
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
