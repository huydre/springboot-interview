import timeline from "../timelines/rest.json";
import type { Lesson, Scene } from "../types";

// Outputs from a Spring Boot 3.5 project on JDK 21 (MockMvc on real controllers, H2 for the idempotency table); see study note 03.08.
//
export const rest: Lesson = {
  slug: "rest",
  crumb: "REST API Design",
  videoDir: "/videos/rest-api",
  // Per-scene clips cut by `video-kit/pipeline.py rest-video publish`, which also rewrites videoVersion.
  videoVersion: "bc33179a",
  scenes: timeline as Scene[],
  title: "REST API Design",
  subtitle:
    "Resource và URL, safe và idempotent, status code cần nói đúng, Idempotency-Key cho thanh toán, phân trang, versioning, ProblemDetail, và vì sao không trả entity.",
  openingQuiz: {
    question: "App gọi POST /payments, server đã trừ tiền nhưng response bị timeout. App retry. Làm sao không trừ tiền 2 lần?",
    options: [
      "Đổi sang GET",
      "Client gửi Idempotency-Key và dùng lại đúng key khi retry; server gặp lại key thì trả kết quả cũ",
      "Server tự sinh key cho mỗi request",
      "Tăng timeout",
    ],
    answer: 1,
    explain: "Key do client sinh và giữ nguyên khi retry, nên server nhận ra đây là cùng một lần thanh toán. Server tự sinh key thì mỗi lần retry ra key mới, vô nghĩa.",
  },
  roadmap: [
    "Chặng 1: resource, URL, HTTP method, safe và idempotent.",
    "Chặng 2: status code và Idempotency-Key cho POST thanh toán.",
    "Chặng 3: phân trang, versioning, ProblemDetail và DTO.",
  ],
  sections: [
    {
      id: "resource",
      title: "Phần 1: Resource, URL và HTTP method",
      scene: "resource",
      intro: [
        "URL là địa chỉ của **resource**, dùng danh từ số nhiều: `GET /api/v1/orders/42`, `POST /api/v1/orders`, `GET /api/v1/customers/7/orders`. Hành động nghiệp vụ không map vào CRUD thì `POST /api/v1/orders/42/cancel`. Đừng dùng GET để thay đổi dữ liệu: crawler, prefetch, proxy có thể gọi GET bất cứ lúc nào. Đừng để token hay số thẻ trên URL vì URL vào access log.",
        "Mỗi method có hai tính chất cần nói được:",
        "- **Safe**: không đổi trạng thái server.",
        "- **Idempotent**: gọi 1 lần hay N lần trạng thái cuối như nhau (response có thể khác). Giống nút gọi thang máy: bấm 1 lần hay 5 lần thì thang vẫn chỉ đến một lần.",
        "Áp vào từng method:",
        "- **GET, PUT, DELETE**: idempotent.",
        "- **POST**: không idempotent.",
        "- **PATCH**: tuỳ nội dung. `{\"price\": 90}` gọi lại vẫn 90, còn \"tăng stock 1\" thì không.",
        "PUT thay **toàn bộ** resource, field thiếu bị coi là bỏ; PATCH chỉ sửa field được gửi.",
      ],
      takeaway: {
        lines: ["GET chỉ để đọc. Muốn đổi dữ liệu thì dùng POST, PUT, PATCH hoặc DELETE."],
      },
      quiz: {
        question: "DELETE /orders/42 lần đầu 204, lần hai 404. DELETE còn idempotent không?",
        options: ["Không, vì response khác nhau", "Có: idempotent nói về trạng thái server, sau cả hai lần đơn 42 đều không tồn tại", "Chỉ khi trả 204 cả hai lần", "Tuỳ database"],
        answer: 1,
        explain: "Trả 204 cả hai lần cũng hợp lệ, quan trọng là nhất quán.",
      },
    },
    {
      id: "status",
      title: "Phần 2: Status code cần nói đúng",
      scene: "status",
      intro: [
        "Đã có URL và method, giờ server cần báo kết quả. Status code là hợp đồng: retry, gateway, dashboard đều dựa vào nó. Trả `200` kèm `{\"success\": false}` làm hỏng hết.",
        "Các code hay bị hỏi:",
        "- **201 / 204**: 201 kèm `Location` khi tạo mới, 204 khi xoá.",
        "- **401**: chưa xác thực (thiếu token, token sai, hết hạn).",
        "- **403**: đã biết bạn nhưng không đủ quyền.",
        "- **400**: request sai định dạng (JSON hỏng, thiếu field bắt buộc).",
        "- **409**: xung đột với trạng thái hiện tại của resource. Ví dụ: đăng ký email đã có người dùng, hoặc cập nhật với `@Version` cũ vì người khác vừa sửa trước.",
        "- **422**: request đúng cú pháp nhưng nghiệp vụ không cho. Ví dụ: huỷ một đơn đã giao.",
        "- **429**: vượt rate limit, kèm header `Retry-After` báo bao lâu nữa thử lại.",
        "Đã quan sát với Spring Security: token hết hạn ra 401 `invalid_token`, token USER gọi API admin ra 403 `insufficient_scope`.",
        "Client thường retry 429, 503, 504 và lỗi mạng, với **exponential backoff** (mỗi lần chờ lâu gấp đôi lần trước) và **jitter** (cộng thêm một khoảng ngẫu nhiên để các client không retry cùng lúc). Không retry các 4xx còn lại: 4xx nghĩa là chính request sai, gửi lại y hệt thì ra y hệt.",
      ],
      after: [
        "Ghi chú: một số team dùng 409 cho cả trường hợp vi phạm nghiệp vụ như huỷ đơn đã giao. Chấp nhận được, miễn cả API dùng nhất quán.",
      ],
      takeaway: {
        lines: ["Retry 429, 503, 504 và lỗi mạng, có backoff và jitter. Các 4xx còn lại thì sửa request, đừng gửi lại y hệt."],
      },
      widget: "status-code",
      widgetTitle: "Chọn status cho từng tình huống",
      quiz: {
        question: "Token hết hạn mà API trả 403 thì hậu quả gì?",
        options: ["Không sao", "Client tưởng thiếu quyền nên không gọi refresh token, user bị kẹt", "Server bị quá tải", "Token tự gia hạn"],
        answer: 1,
        explain: "Hết hạn là chưa xác thực: 401.",
      },
    },
    {
      id: "idempotency",
      title: "Phần 3: Idempotency-Key cho POST thanh toán",
      scene: "idem",
      intro: [
        "Phần 1 nói POST không idempotent. Vậy server đã trừ tiền, response bị timeout, app retry POST thì sao? Cách giải: client sinh một UUID cho **mỗi ý định thanh toán**, gửi trong header `Idempotency-Key`, và dùng lại đúng key đó khi retry. Server lưu key (PRIMARY KEY), hash của body và kết quả.",
        "Vì sao lưu cả hash của body: để bắt client dùng lại một key cho một khoản thanh toán **khác** (do bug). Cùng key mà body khác thì từ chối, thay vì trả nhầm kết quả của khoản cũ.",
        "Thử nghiệm gồm 4 lần gọi:",
        "- **A**: key K1, body X.",
        "- **B**: retry đúng K1, body X.",
        "- **C**: K1 nhưng body đổi thành Y.",
        "- **D**: key mới K2.",
        "Hai request cùng key đến đồng thời: nếu server đọc trước (tìm key theo id) thì cả hai đều thấy chưa có. Unique constraint trên key chặn request ghi sau (trả 409). Tốt hơn nữa là **insert key với trạng thái `PROCESSING` trước** rồi mới gọi cổng thanh toán: request thứ hai đụng PRIMARY KEY ngay lúc insert, trước khi cổng thanh toán bị gọi lần nữa.",
        "Giữ key 24 giờ đến 7 ngày. Thanh toán thì ưu tiên lưu key trong DB cùng transaction. Có thể thêm Redis phía trước làm lớp lọc nhanh (lệnh `SET key value NX EX` chỉ ghi khi key chưa có, kèm thời hạn; xem bài Redis).",
        "Key khác gì unique constraint trên `orderId`? Unique `orderId` cấm thanh toán một đơn lần thứ hai, kể cả khi lần đầu thất bại thật. Key đại diện cho một lần thử cụ thể, nên thanh toán lại với key mới vẫn được.",
      ],
      predict: {
        question: "Lần gọi **C** dùng lại key K1 nhưng body đổi thành Y. Server trả gì?",
        options: [
          "201, tạo một khoản thanh toán mới",
          "200, trả lại kết quả của lần A",
          "422, vì cùng key mà body khác",
          "500, vì trùng PRIMARY KEY",
        ],
        answer: 2,
        explain: "Server so hash body với hash đã lưu cho K1. Khác nhau nghĩa là client dùng nhầm key cho một khoản khác, nên từ chối thay vì trả nhầm kết quả cũ.",
      },
      widget: "idempotency-key",
      widgetTitle: "Gửi lại POST /api/payments",
      after: [
        "Kết quả đã chạy: A ra 201 `paymentId 1001`; B ra 200 `replayed true`, trả lại kết quả cũ; C ra 422; D ra 201 `paymentId 1002`. Cổng thanh toán chỉ bị gọi 2 lần (A và D).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Insert key `PROCESSING` trước → request trùng đụng PRIMARY KEY ngay lúc insert → cổng thanh toán không bị gọi lần hai."],
      },
      quiz: {
        question: "Idempotency-Key khác unique constraint trên orderId thế nào?",
        options: [
          "Giống nhau",
          "Unique orderId cấm thanh toán lại một đơn; key đại diện cho một ý định cụ thể nên vẫn cho thanh toán lại sau khi lần trước thất bại thật",
          "Key chỉ dùng cho GET",
          "orderId không unique được",
        ],
        answer: 1,
        explain: "Hai cách có thể dùng cùng nhau.",
      },
    },
    {
      id: "paging",
      title: "Phần 4: Phân trang, filter, sort",
      scene: "paging",
      intro: [
        "Đọc danh sách cũng cần hợp đồng rõ như ghi. Không bao giờ trả toàn bộ collection. Filter, sort, paging đi qua query param: `GET /api/v1/orders?status=PAID&sort=createdAt,desc&page=0&size=20`; Spring Data `Pageable` đọc sẵn `page`, `size`, `sort`. Offset nhảy trang được nhưng trang sâu chậm; keyset `after=<id cuối>` nhanh đều nhưng không nhảy trang (xem bài SQL).",
        "Bốn bẫy hay gặp:",
        "- **Không giới hạn `size`**: đặt `spring.data.web.pageable.max-page-size`.",
        "- **Nối thẳng tên field sort của client vào SQL**: chỉ cho danh sách field cố định.",
        "- **Trả `Page<T>` của Spring trực tiếp**: bọc DTO riêng, vì JSON của `Page` là chi tiết nội bộ mà Spring có thể đổi giữa các phiên bản.",
        "- **Sort theo cột không duy nhất mà thiếu `id` làm tie-breaker**: các dòng bằng nhau ở cột sort có thể đổi thứ tự giữa hai lần query, nên một dòng hiện ở cả hai trang hoặc bị mất.",
      ],
      quiz: {
        question: "Client gửi size=1000000. Phòng thủ thế nào?",
        options: ["Không cần", "Đặt max-page-size để giới hạn", "Trả 500", "Tăng heap"],
        answer: 1,
        explain: "Không giới hạn thì một request kéo sập DB.",
      },
    },
    {
      id: "versioning",
      title: "Phần 5: Versioning và backward compatibility",
      scene: "version",
      intro: [
        "API đã có client dùng thì mỗi thay đổi đều có thể làm vỡ họ. Versioning bằng URL (`/api/v1`) phổ biến nhất vì dễ thấy, dễ route ở gateway; header hoặc media type ít dùng hơn. Chỉ tăng version khi **breaking**.",
        "Phân loại thay đổi:",
        "- **An toàn**: thêm field response, thêm endpoint, thêm param tuỳ chọn.",
        "- **Phá client cũ**: thêm field bắt buộc vào request, xoá hoặc đổi tên field, đổi kiểu, đổi nghĩa.",
        "- **Nguy hiểm**: thêm giá trị enum. Client deserialize vào enum cố định hoặc `switch` trên enum sẽ lỗi khi gặp giá trị nó không biết.",
        "Cần đổi `price` từ số sang `{amount, currency}` thì thêm `priceDetail` song song, giữ `price`, chờ app cũ giảm rồi mới bỏ.",
        "Thêm field response an toàn là nhờ client bỏ qua field lạ. Jackson có cờ `FAIL_ON_UNKNOWN_PROPERTIES`: bật thì client ném lỗi khi gặp bất kỳ field nào nó không biết. Spring Boot mặc định tắt cờ này.",
      ],
      widget: "api-compat",
      widgetTitle: "Thay đổi nào an toàn",
      takeaway: {
        lines: ["Chỉ thêm, không xoá hay đổi nghĩa. Cần đổi kiểu thì thêm field mới song song rồi mới bỏ field cũ."],
      },
      quiz: {
        question: "Service Java phía client bật FAIL_ON_UNKNOWN_PROPERTIES thì sao?",
        options: ["An toàn hơn", "Server chỉ cần thêm một field là client vỡ", "Không ảnh hưởng", "Chạy nhanh hơn"],
        answer: 1,
        explain: "Spring Boot mặc định tắt cờ này, đừng bật lại.",
      },
    },
    {
      id: "problem-detail",
      title: "Phần 6: Format lỗi thống nhất với ProblemDetail",
      scene: "problem",
      intro: [
        "Status code cho biết loại lỗi, nhưng client còn cần biết chi tiết, theo một format chung cho mọi endpoint. RFC 9457 định nghĩa `application/problem+json` với `type`, `title`, `status`, `detail`, `instance`; Spring 6 có sẵn class `ProblemDetail`. Gom về một `@RestControllerAdvice` kế thừa `ResponseEntityExceptionHandler` để lỗi chuẩn của Spring MVC cũng ra ProblemDetail. Đã chạy: `404 {\"title\":\"Resource not found\",\"status\":404,\"detail\":\"Order 1 not found\",\"instance\":\"/api/orders/1\"}`.",
        "Lỗi validate mặc định chỉ có `\"Invalid request content.\"`, không nói field nào sai: override `handleMethodArgumentNotValid` và thêm property `errors`. Với 500 đừng trả `e.getMessage()` (lộ tên bảng, SQL); trả message chung kèm traceId.",
      ],
      quiz: {
        question: "Vì sao không nên trả e.getMessage() cho mọi lỗi 500?",
        options: ["Vì quá dài", "Có thể lộ tên bảng, câu SQL, chi tiết nội bộ; trả message chung kèm traceId", "Vì client không đọc", "Vì Spring cấm"],
        answer: 1,
        explain: "traceId đủ để tra log.",
      },
    },
    {
      id: "dto",
      title: "Phần 7: DTO, không trả entity",
      scene: "dto",
      intro: [
        "Trả JPA entity ra JSON gặp năm vấn đề:",
        "- **Lộ field nội bộ**: như `passwordHash`.",
        "- **Lazy loading**: Jackson gọi getter của quan hệ LAZY khi đã ra ngoài transaction: lỗi `LazyInitializationException`. Nếu bật **open-in-view** (giữ session DB mở tới khi ghi xong JSON) thì không lỗi nhưng mỗi getter là một query, thành N+1.",
        "- **Vòng lặp vô tận**: khi serialize `Order.customer.orders...`.",
        "- **API dính DB**: đổi cột DB là đổi luôn API.",
        "- **Mass assignment**: nhận entity ở request thì client gửi thêm `\"role\": \"ADMIN\"` là được set.",
        "Dùng **record** làm DTO: `record ProductDto(Long id, String name, BigDecimal price)`, request DTO có validation như `record CreateOrder(@NotBlank String customer, @Positive int quantity)`. Tắt `spring.jpa.open-in-view` để buộc load đủ dữ liệu trong service.",
      ],
      quiz: {
        question: "Dùng @JsonIgnore trên entity thay cho DTO được không?",
        options: [
          "Hoàn toàn tốt hơn DTO",
          "Chạy được cho trường hợp nhỏ, nhưng entity gánh 2 trách nhiệm, mỗi API cần góc nhìn khác, và vẫn còn rủi ro lazy loading và mass assignment",
          "Không chạy được",
          "Chỉ được với Kotlin",
        ],
        answer: 1,
        explain: "DTO là hợp đồng API độc lập với DB.",
      },
    },
  ],
  modelAnswer:
    "URL là danh từ chỉ resource, method nói hành động. GET, PUT, DELETE là idempotent, POST thì không, PATCH tuỳ nội dung; PUT thay toàn bộ, PATCH sửa một phần. Em trả status đúng nghĩa: 401 khi chưa xác thực hoặc token hết hạn, 403 khi không đủ quyền, 409 khi xung đột trạng thái, 422 khi vi phạm nghiệp vụ, 429 kèm Retry-After. Với POST thanh toán em yêu cầu Idempotency-Key do client sinh và dùng lại khi retry, server lưu key có unique constraint cùng hash body; em đã thử 4 lần gọi gồm một lần retry thì cổng thanh toán chỉ bị gọi 2 lần. Em giới hạn page size, versioning bằng /api/v1 và chỉ thêm chứ không xoá hay đổi nghĩa field. Lỗi trả theo ProblemDetail từ một RestControllerAdvice, và em luôn map sang DTO bằng record thay vì trả entity.",
};
