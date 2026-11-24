import timeline from "../timelines/rest.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

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
    "Resource và URL, safe và idempotent, status code cần nói đúng, 202 cho việc chạy lâu, Idempotency-Key cho thanh toán, phân trang, versioning, ProblemDetail, và vì sao không trả entity.",
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
        "- **202**: đã nhận yêu cầu nhưng xử lý chưa xong, dùng cho việc chạy lâu (phần nhỏ bên dưới).",
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
      parts: [
        {
          id: "async-job",
          title: "Việc chạy lâu: 202 Accepted và URL trạng thái",
          intro: [
            "Các status ở trên đều trả kết quả ngay trong request. Còn `POST /api/reports` xuất báo cáo mất 3 phút thì sao?",
            "Giữ request suốt 3 phút gặp ba vấn đề:",
            "- **Bị cắt giữa chừng**: nhiều load balancer và reverse proxy mặc định cắt request im lặng khoảng 60 giây. Client nhận `504` trong khi server vẫn đang chạy.",
            "- **Chiếm thread**: mỗi request giữ một thread Tomcat (mặc định tối đa 200) suốt thời gian chạy.",
            "- **Tạo việc trùng**: client thấy lỗi thì retry, server chạy thêm một báo cáo nữa.",
            "Cách làm chuẩn là tách \"nhận việc\" khỏi \"làm việc\":",
            "- **Nhận việc**: `POST` lưu job trạng thái `PENDING`, đẩy vào queue, trả **`202 Accepted`** kèm header `Location: /api/jobs/42` (nơi xem trạng thái) và có thể `Retry-After: 5` (bao lâu nữa nên hỏi lại).",
            "- **Xem trạng thái**: `GET /api/jobs/42` trả `PENDING`, `RUNNING` (kèm tiến độ), `SUCCEEDED` (kèm link kết quả) hoặc `FAILED` (kèm lý do).",
            "- **Worker nhận job**: `UPDATE jobs SET status = 'RUNNING' WHERE id = ? AND status = 'PENDING'`. Cập nhật 0 dòng nghĩa là worker khác đã nhận, nên không có hai worker chạy cùng một job.",
          ],
          predict: {
            question: "Báo cáo chạy 3 phút, load balancer cắt request im lặng sau 60 giây. Client gọi `POST /api/reports` kiểu đồng bộ (chờ tới khi xong). Client nhận gì?",
            options: [
              "`200` kèm file sau 3 phút",
              "`504` từ load balancer sau khoảng 60 giây, trong khi server vẫn chạy tiếp",
              "`202` tự động",
              "`408` từ server",
            ],
            answer: 1,
            explain: "Load balancer không biết server sắp xong, nó chỉ thấy kết nối im lặng quá lâu. Server vẫn làm tiếp nhưng kết quả không còn ai nhận.",
          },
          widgetTitle: "Xuất báo cáo mất 3 phút",
          compare: [
            way(
              "Giữ request tới khi xong",
              `POST /api/reports
... chờ 3 phút ...
200 OK + file`,
              [
                ask("Load balancer cắt sau 60 giây", bad("Client nhận `504`; báo cáo vẫn chạy nhưng không ai nhận. Client retry, server chạy thêm một báo cáo nữa.")),
                ask("100 người cùng xuất báo cáo", bad("100 thread Tomcat bị giữ vài phút, các API khác bắt đầu phải xếp hàng.")),
              ],
              "Thời gian xử lý bị trói vào thời gian sống của một kết nối HTTP.",
            ),
            way(
              "202 và URL trạng thái",
              `POST /api/reports            (kèm Idempotency-Key)
-> 202 Accepted
   Location: /api/jobs/42
   Retry-After: 5

GET /api/jobs/42  -> 200 {"status":"RUNNING","progress":40}
GET /api/jobs/42  -> 200 {"status":"SUCCEEDED","result":"/api/reports/42/file"}`,
              [
                ask("Load balancer cắt sau 60 giây", ok("Không ảnh hưởng: mỗi request chỉ mất vài mili giây.")),
                ask("100 người cùng xuất báo cáo", ok("Thread trả về ngay; job xếp hàng trong queue, worker chạy theo sức của nó.")),
              ],
              "Nhận việc nhanh, làm việc riêng, client hỏi trạng thái.",
            ),
          ],
          after: [
            "Client hỏi trạng thái có backoff (2, 4, 8 giây...), đừng hỏi mỗi 100 ms. Trạng thái đang chạy có thể để trong Redis cho nhẹ DB. Cần đẩy kết quả về ngay thì dùng SSE, hoặc {{webhook|webhook}} khi bên gọi là một hệ thống khác (xem bài System Design Concepts, phần realtime).",
            "`POST` tạo job vẫn cần `Idempotency-Key` (Phần 3), nếu không client retry sẽ tạo hai job. Job kẹt ở `RUNNING` vì worker chết thì cần hạn chót (`heartbeat_at`) và một job định kỳ trả nó về `PENDING`, quá N lần thì `FAILED`.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Việc lâu hơn vài giây → `202 Accepted` + `Location` tới URL trạng thái → worker nhận job bằng `UPDATE` có điều kiện → client hỏi có backoff, hoặc nhận đẩy qua SSE.",
            ],
          },
          quiz: {
            question: "Vì sao trả `202` chứ không phải `201` khi nhận yêu cầu xuất báo cáo?",
            options: [
              "Hai mã như nhau",
              "`201` nghĩa là resource đã được tạo xong; `202` nghĩa là đã nhận yêu cầu, xử lý chưa xong",
              "`202` nhanh hơn",
              "`201` chỉ dùng cho GET",
            ],
            answer: 1,
            explain: "Lúc trả lời, báo cáo chưa tồn tại. `202` nói đúng điều đó, và `Location` chỉ tới nơi theo dõi kết quả.",
          },
        },
      ],
    },
    {
      id: "idempotency",
      senior: true,
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
      board: {
        title: "Idempotency-Key: retry không trừ tiền hai lần",
        highlight: "retry không trừ tiền hai lần",
        chips: ["Một key cho mỗi ý định thanh toán", "Lưu key, hash body và kết quả"],
        cards: [
          {
            title: "Lần đầu và đồng thời",
            diagram: {
              kind: "flow",
              steps: ["POST /api/payments + K1", "INSERT key = PROCESSING"],
              ok: ["Insert được", "Gọi cổng, trả 201"],
              bad: ["Đụng PRIMARY KEY", "Không gọi cổng lần nữa"],
            },
            notes: ["Insert trước khi gọi cổng thanh toán để request thứ hai đụng khoá ngay lúc insert."],
            takeaway: "Insert key trước, rồi mới gọi cổng thanh toán",
          },
          {
            title: "Retry cùng key",
            diagram: {
              kind: "flow",
              steps: ["Retry với key K1", "Server thấy K1 đã có", "So hash body"],
              ok: ["Hash khớp", "200, trả kết quả cũ"],
              bad: ["Hash khác", "422, từ chối"],
            },
            notes: ["Cùng key mà body khác nghĩa là client dùng nhầm key cho khoản khác."],
            takeaway: "Trả lại kết quả cũ, không tạo khoản thanh toán mới",
          },
        ],
        conclusion: "**Kết luận:** key đại diện cho một lần thử cụ thể, hash body bắt lỗi dùng nhầm key.",
      },
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
      parts: [
        {
          id: "cursor-pagination",
          senior: true,
          title: "Cursor pagination: trang không lệch khi dữ liệu đổi",
          intro: [
            "Offset chậm ở trang sâu, nhưng còn một lỗi nằm ở **hợp đồng API**: dữ liệu thay đổi giữa hai lần gọi.",
            "Danh sách đơn mới nhất trước, `size=3`. Trang 1 (`page=0`) trả `o10, o9, o8`. Lúc đó có đơn `o11` mới. Trang 2 (`page=1`, tức bỏ qua 3 dòng đầu) lúc này bỏ qua `o11, o10, o9` và trả `o8, o7, o6`: **`o8` xuất hiện hai lần**. Xoá một đơn thì ngược lại, một dòng bị nhảy mất.",
            "**Cursor** dựa vào vị trí dòng cuối đã thấy thay vì số thứ tự trang. Client gửi `GET /orders?limit=20&cursor=<chuỗi>`; server lấy các dòng **sau** vị trí đó, thường là `WHERE (created_at, id) < (:t, :id) ORDER BY created_at DESC, id DESC LIMIT 21`. Lấy `limit + 1` dòng để biết còn trang sau mà không cần `COUNT`.",
            "Hợp đồng response:",
            "- `items`: các dòng của trang.",
            "- `nextCursor`: chuỗi để gọi trang kế tiếp, `null` khi hết.",
            "- **Cursor là opaque**: server mã hoá (ví dụ Base64 của `createdAt` và `id`), client chỉ chuyển nguyên văn, không tự ghép. Nhờ vậy server đổi cách tính vị trí sau này mà không phá client.",
            "Đổi lại: không nhảy tới trang N và không có tổng số trang. Hợp với feed, cuộn vô hạn, export; bảng quản trị cần nhảy trang thì offset vẫn dùng được.",
          ],
          widgetTitle: "Có đơn mới chen vào giữa hai trang",
          compare: [
            way(
              "Offset",
              `GET /orders?page=0&size=3     -> o10, o9, o8
(đơn o11 mới tới)
GET /orders?page=1&size=3     -> o8, o7, o6`,
              [
                ask("Có đơn mới chen vào giữa hai lần gọi", bad("Trang 2 lặp lại `o8`: mọi dòng bị đẩy xuống một vị trí.")),
                ask("Nhảy thẳng tới trang 50", ok("Được, nhưng DB phải bỏ qua 1000 dòng đầu mới trả trang đó.")),
              ],
              "Vị trí theo số thứ tự sẽ lệch khi dữ liệu thay đổi.",
            ),
            way(
              "Cursor",
              `GET /orders?limit=3              -> o10, o9, o8   nextCursor=c8
(đơn o11 mới tới)
GET /orders?limit=3&cursor=c8    -> o7, o6, o5`,
              [
                ask("Có đơn mới chen vào giữa hai lần gọi", ok("Trang 2 bắt đầu sau vị trí của `o8`: không lặp, không sót.")),
                ask("Nhảy thẳng tới trang 50", bad("Không có: chỉ đi tiếp trang kế, và không có tổng số trang.")),
              ],
              "Vị trí neo vào dòng cuối đã thấy, nên không bị lệch.",
            ),
          ],
          takeaway: {
            lines: [
              "Feed và cuộn vô hạn dùng cursor opaque (`nextCursor`, `null` khi hết); bảng cần nhảy trang thì offset. Sắp xếp theo cột không duy nhất thì thêm `id` làm tie-breaker.",
            ],
          },
          quiz: {
            question: "Vì sao cursor nên là chuỗi opaque thay vì để client tự gửi `createdAt` và `id`?",
            options: [
              "Để server đổi cách tính vị trí mà không phá client",
              "Để response nhỏ hơn",
              "Vì SQL không nhận tham số thô",
              "Để tăng tốc truy vấn",
            ],
            answer: 0,
            explain: "Cursor chỉ là vé mà client giữ nguyên văn. Nếu client tự ghép các cột sort thì cột sort trở thành một phần của hợp đồng và đổi nó sẽ phá client.",
          },
        },
      ],
    },
    {
      id: "versioning",
      senior: true,
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
      parts: [
        {
          id: "dto-mapping",
          senior: false,
          title: "Map entity sang DTO: tự viết, MapStruct, ModelMapper hay convertValue",
          intro: [
            "Đã chọn trả DTO thay vì entity. Câu hỏi tiếp theo trong phỏng vấn: chuyển `Order` sang `OrderDto` bằng cách nào, và cách đó sai thì ai báo?",
            "Tình huống: entity `Order` có `customer` lồng bên trong (`customer.name`, `customer.email`), còn DTO là record phẳng `OrderDto(id, customerName, customerEmail, total, createdAt, status, note)`. Viết tay cho 30 entity thì nhàm, nên team muốn dùng thư viện. Điều cần biết là thư viện map **lúc nào** và khi tên field không khớp thì **báo ở đâu**: lúc build, lúc chạy, hay không báo gì.",
            "Bốn cách hay gặp:",
            "- **Tự viết**: `new OrderDto(o.getId(), o.getCustomer().getName(), ...)`. Rõ ràng, compiler kiểm tra kiểu, không phụ thuộc thư viện; đổi lại là nhiều code lặp.",
            "- **MapStruct**: annotation processor **sinh code Java thường lúc compile** (gọi getter, gọi constructor). Chạy nhanh như viết tay, sai kiểu là lỗi compile, field đích không ai map thì build in cảnh báo.",
            "- **ModelMapper**: dùng **reflection lúc chạy**, tự đoán cặp field theo tên (tách tên thành từ: `customerName` thành `customer` và `name`). Không cần khai báo, nhưng đoán sai hay đoán trượt đều không báo lúc build.",
            "- **`ObjectMapper.convertValue`**: Jackson serialize object thành cây JSON rồi đọc lại thành kiểu đích. Chậm, kiểu dữ liệu đi qua dạng JSON, và không tự làm phẳng `customer.name` thành `customerName`.",
          ],
          predict: {
            question: "DTO có một field mà không ai map (đổi tên, hoặc field mới). MapStruct và ModelMapper (cấu hình mặc định) báo ở đâu?",
            options: [
              "Cả hai báo lỗi lúc build",
              "MapStruct cảnh báo lúc build; ModelMapper im lặng để `null`",
              "Cả hai ném exception lúc chạy",
              "MapStruct im lặng; ModelMapper ném exception",
            ],
            answer: 1,
            explain: "MapStruct biết hết field lúc compile nên in `Unmapped target property`. ModelMapper chỉ đoán lúc chạy: không tìm được nguồn thì để `null`, trừ khi gọi `validate()`.",
          },
          widgetTitle: "Cùng entity Order, hai thư viện (đã chạy: MapStruct 1.6.3, ModelMapper 3.2.4, JDK 21)",
          compare: [
            way(
              "ModelMapper",
              `ModelMapper mm = new ModelMapper();
OrderView v = mm.map(order, OrderView.class);
// OrderView là class có setter:
// id, customerName, customerFullName`,
              [
                ask("Field `customerName`, nguồn là `customer.name`", ok("Tự đoán đúng, ra `An`, không cần khai báo.")),
                ask("Field đích không có nguồn (`customerFullName`)", bad("Ra `null`, không lỗi, không cảnh báo. Chỉ khi gọi `mm.validate()` mới thấy `Unmapped destination properties found in TypeMap[Order -> ...]`.")),
                ask("DTO là record", bad("`MappingException: Failed to instantiate instance of destination demo.map.OrderDto. Ensure that demo.map.OrderDto has a non-private no-argument constructor.`")),
                ask("200.000 lần map (vòng lặp thô, không phải JMH)", bad("296 đến 532 ms mỗi vòng.")),
              ],
              "Ít code nhưng mọi sai lệch chỉ lộ ra lúc chạy, và thường là `null` im lặng.",
            ),
            way(
              "MapStruct",
              `@Mapper
public interface OrderMapper {
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "customerEmail", source = "customer.email")
    OrderDto toDto(Order order);
}`,
              [
                ask("Field `customerName`, nguồn là `customer.name`", ok("Khai báo `@Mapping` một lần; code sinh ra gọi `customer.getName()` và tự kiểm tra `customer == null`.")),
                ask("Field đích không có nguồn (`note`)", ok("Build in `[WARNING] OrderMapper.java:[10,14] Unmapped target property: \"note\".` Với `@Mapper(unmappedTargetPolicy = ReportingPolicy.ERROR)` thì BUILD FAILURE: `Unmapped target properties: \"customerEmail, note\".`")),
                ask("DTO là record", ok("Code sinh ra gọi thẳng constructor: `new OrderDto( id, customerName, customerEmail, total, createdAt, status, note )`.")),
                ask("200.000 lần map (vòng lặp thô, không phải JMH)", ok("Dưới 5 ms mỗi vòng: chỉ là lời gọi getter.")),
              ],
              "Phải khai báo field lồng, nhưng mọi sai lệch bị bắt lúc build.",
            ),
          ],
          after: [
            "Code MapStruct sinh ra (file `target/generated-sources/annotations/.../OrderMapperImpl.java`) đọc được như code tự viết: `id = order.getId(); total = order.getTotal(); ...` rồi `return new OrderDto(...)`. Debug được, đặt breakpoint được, không có reflection.",
            "Hai lỗi ModelMapper đã chạy được, đáng kể khi phỏng vấn:",
            "- **Đoán nhầm field**: bật `MatchingStrategies.LOOSE` (chỉ cần khớp từ cuối của tên), DTO có `sellerName` và `sellerEmail` nhận `sellerName=An, sellerEmail=an@shop.vn`, tức là tên và email của **người mua** bị đổ vào người bán, không một dòng cảnh báo. Ở chế độ STANDARD mặc định thì hai field này ra `null`.",
            "- **Hai nguồn cùng khớp**: entity có cả field `customerName` (bản sao cũ) lẫn `customer.name`. Lần `map` đầu tiên ném `ConfigurationException: The destination property ...setCustomerName() matches multiple source property hierarchies`, ở lúc chạy chứ không phải lúc build.",
            "Còn `convertValue`, đã chạy với Jackson 2.21:",
            "- **Sang `Map`**: `createdAt` thành `[2026, 11, 24, 9, 30]` (`ArrayList`), `customer` thành `LinkedHashMap`: kiểu gốc mất, chỉ còn dạng JSON.",
            "- **Sang `OrderDto`**: `IllegalArgumentException: Unrecognized field \"customer\" (class demo.map.OrderDto), not marked as ignorable`. Tắt `FAIL_ON_UNKNOWN_PROPERTIES` thì hết lỗi nhưng `customerName=null, customerEmail=null` im lặng.",
            "- **Tốc độ**: 133 đến 455 ms cho 200.000 lần trong cùng vòng lặp thô, vì mỗi lần đều đi qua cây JSON.",
            "**Lombok cùng MapStruct**: cả hai đều là annotation processor, và MapStruct cần thấy getter mà Lombok sinh ra. Đã chạy: đặt `mapstruct-processor` trước `lombok` trong `annotationProcessorPaths` mà thiếu `lombok-mapstruct-binding` thì build fail với `No property named \"customer.name\" exists in source parameter(s). Type \"Order\" has no properties.` Thêm `org.projectlombok:lombok-mapstruct-binding:0.2.0` vào `annotationProcessorPaths` thì build qua bất kể thứ tự.",
          ],
          takeaway: {
            lines: [
              "MapStruct sinh code Java lúc compile: nhanh như viết tay, hợp với record, thiếu field thì build cảnh báo hoặc fail (`ReportingPolicy.ERROR`).",
              "ModelMapper và `convertValue` đoán lúc chạy: sai tên thì ra `null` im lặng hoặc exception khi đang chạy.",
            ],
          },
          trap: {
            title: "ModelMapper LOOSE map nhầm mà không báo",
            text: "Bật LOOSE để \"map được nhiều hơn\" thì `sellerName` nhận tên người mua. Nếu vẫn dùng ModelMapper, giữ STANDARD hoặc STRICT và gọi `modelMapper.validate()` trong một test để field đích không có nguồn bị phát hiện trước khi lên production.",
          },
          quiz: {
            question: "Vì sao nhiều team chọn MapStruct thay vì ModelMapper?",
            options: [
              "MapStruct không cần khai báo gì, tự đoán mọi field lồng",
              "MapStruct sinh code Java lúc compile: không reflection, kiểm tra kiểu, field đích không ai map thì build cảnh báo hoặc fail",
              "ModelMapper không map được field lồng",
              "MapStruct dùng JSON nên hỗ trợ mọi kiểu",
            ],
            answer: 1,
            explain: "Lỗi mapping bị bắt lúc build thay vì thành `null` lúc chạy. ModelMapper map được field lồng (`customerName` từ `customer.name`), nhưng đoán bằng reflection lúc chạy.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "URL là danh từ chỉ resource, method nói hành động. GET, PUT, DELETE là idempotent, POST thì không, PATCH tuỳ nội dung; PUT thay toàn bộ, PATCH sửa một phần. Em trả status đúng nghĩa: 401 khi chưa xác thực hoặc token hết hạn, 403 khi không đủ quyền, 409 khi xung đột trạng thái, 422 khi vi phạm nghiệp vụ, 429 kèm Retry-After. Với POST thanh toán em yêu cầu Idempotency-Key do client sinh và dùng lại khi retry, server lưu key có unique constraint cùng hash body; em đã thử 4 lần gọi gồm một lần retry thì cổng thanh toán chỉ bị gọi 2 lần. Em giới hạn page size, versioning bằng /api/v1 và chỉ thêm chứ không xoá hay đổi nghĩa field. Lỗi trả theo ProblemDetail từ một RestControllerAdvice, và em luôn map sang DTO bằng record thay vì trả entity.",
};
