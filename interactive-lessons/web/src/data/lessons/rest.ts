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
    explain: "Đã chạy 4 lần gọi gồm 1 lần retry: cổng thanh toán chỉ bị gọi 2 lần. Server tự sinh key thì retry ra key mới, vô nghĩa.",
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
        "**Safe**: không đổi trạng thái server. **Idempotent**: gọi 1 lần hay N lần trạng thái cuối như nhau (response có thể khác). GET, PUT, DELETE idempotent; POST không; PATCH tuỳ nội dung: `{\"price\": 90}` gọi lại vẫn 90, còn \"tăng stock 1\" thì không. PUT thay **toàn bộ** resource, field thiếu bị coi là bỏ; PATCH chỉ sửa field được gửi.",
      ],
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
        "Status code là hợp đồng: retry, gateway, dashboard đều dựa vào nó. Trả `200` kèm `{\"success\": false}` làm hỏng hết. 201 kèm `Location` khi tạo mới, 204 khi xoá. **401** là chưa xác thực (thiếu token, token sai, hết hạn), **403** là đã biết bạn nhưng không đủ quyền. Đã quan sát với Spring Security: token hết hạn ra 401 `invalid_token`, token USER gọi API admin ra 403 `insufficient_scope`.",
        "**400** request sai định dạng; **422** đúng cú pháp nhưng nghiệp vụ không cho (huỷ đơn đã giao; một số team dùng 409 cho trường hợp này, miễn nhất quán); **409** xung đột trạng thái (trùng email, sai `@Version`); **429** vượt rate limit, kèm `Retry-After`. Client thường retry 429, 503, 504 và lỗi mạng với exponential backoff và jitter; không retry 4xx còn lại.",
      ],
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
        "Client sinh một UUID cho **mỗi ý định thanh toán**, gửi header `Idempotency-Key`, dùng lại đúng key khi retry. Server lưu key (PRIMARY KEY), hash của body và kết quả. Đã chạy: lần đầu 201 `paymentId 1001`; retry cùng key 200 `replayed true`; cùng key body khác 422; key mới 201 `paymentId 1002`. Cổng thanh toán bị gọi đúng 2 lần.",
        "Hai request trùng key đến đồng thời đều `findById` thấy chưa có: unique constraint chặn request sau (trả 409), tốt hơn nữa là insert key trạng thái `PROCESSING` trước rồi mới gọi cổng thanh toán. Đặt TTL 24 giờ đến 7 ngày. Thanh toán thì ưu tiên lưu key trong DB cùng transaction; Redis `SET NX EX` làm lớp lọc nhanh phía trước.",
      ],
      widget: "idempotency-key",
      widgetTitle: "Gửi lại POST /api/payments",
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
        "Không bao giờ trả toàn bộ collection. Filter, sort, paging đi qua query param: `GET /api/v1/orders?status=PAID&sort=createdAt,desc&page=0&size=20`; Spring Data `Pageable` đọc sẵn `page`, `size`, `sort`. Offset nhảy trang được nhưng trang sâu chậm; keyset `after=<id cuối>` nhanh đều nhưng không nhảy trang (xem bài SQL).",
        "Bẫy: không giới hạn `size` (đặt `spring.data.web.pageable.max-page-size`); nối thẳng tên field sort của client vào SQL (chỉ cho danh sách field cố định); trả `Page<T>` của Spring trực tiếp (bọc DTO riêng); sort theo cột không duy nhất mà thiếu `id` làm tie-breaker.",
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
        "Versioning bằng URL (`/api/v1`) phổ biến nhất vì dễ thấy, dễ route ở gateway; header hoặc media type ít dùng hơn. Chỉ tăng version khi **breaking**.",
        "An toàn: thêm field response, thêm endpoint, thêm param tuỳ chọn. Phá client cũ: thêm field bắt buộc vào request, xoá hoặc đổi tên field, đổi kiểu, đổi nghĩa; thêm giá trị enum là nguy hiểm. Cần đổi `price` từ số sang `{amount, currency}` thì thêm `priceDetail` song song, giữ `price`, chờ app cũ giảm rồi mới bỏ.",
      ],
      widget: "api-compat",
      widgetTitle: "Thay đổi nào an toàn",
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
        "RFC 9457 định nghĩa `application/problem+json` với `type`, `title`, `status`, `detail`, `instance`; Spring 6 có sẵn class `ProblemDetail`. Gom về một `@RestControllerAdvice` kế thừa `ResponseEntityExceptionHandler` để lỗi chuẩn của Spring MVC cũng ra ProblemDetail. Đã chạy: `404 {\"title\":\"Resource not found\",\"status\":404,\"detail\":\"Order 1 not found\",\"instance\":\"/api/orders/1\"}`.",
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
        "Trả JPA entity ra JSON: lộ `passwordHash`; Jackson gọi getter LAZY ngoài transaction gây `LazyInitializationException` hoặc N+1 nếu bật open-in-view; vòng lặp `Order.customer.orders...`; đổi cột DB là đổi API; nhận entity ở request thì client gửi thêm `\"role\": \"ADMIN\"` là được set (mass assignment).",
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
