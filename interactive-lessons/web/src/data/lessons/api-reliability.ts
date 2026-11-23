import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs below were run on JDK 21 (ApiDemo.java): lost update vs If-Match, HMAC-SHA256 webhook signature with a 5 minute window, exponential backoff with jitter (seed 42), and a deduplicating receiver.
export const apiReliability: Lesson = {
  slug: "api-reliability",
  crumb: "API: ETag, Webhook, OpenAPI",
  videoDir: "/videos/api-reliability",
  videoVersion: "0",
  scenes: [],
  title: "API đáng tin: ETag, webhook và OpenAPI",
  subtitle:
    "Bổ sung cho bài REST: chống ghi đè mất dữ liệu bằng ETag và If-Match, gửi và nhận webhook an toàn (chữ ký, thử lại, chống trùng), và tài liệu OpenAPI.",
  openingQuiz: {
    question: "Hai người cùng mở một đơn hàng, cùng sửa rồi cùng bấm lưu. Điều gì xảy ra nếu API chỉ có `PUT` đơn giản?",
    options: [
      "Người lưu sau ghi đè người lưu trước, mất thay đổi của người đầu (lost update)",
      "Cả hai thay đổi được gộp lại",
      "Người lưu sau bị từ chối",
      "Server tự chọn bản đúng",
    ],
    answer: 0,
    explain: "`PUT` thay cả resource, không biết người kia đã sửa. Cần điều kiện phiên bản (ETag và If-Match) để phát hiện xung đột.",
  },
  roadmap: [
    "Chặng 1: ETag và If-Match. Chống ghi đè mất dữ liệu ở tầng HTTP.",
    "Chặng 2: webhook. Ký để chứng minh nguồn gốc, và thử lại an toàn.",
    "Chặng 3: OpenAPI. Tài liệu và hợp đồng của API.",
  ],
  sections: [
    {
      id: "etag",
      title: "ETag và If-Match: không để ghi đè mất dữ liệu",
      intro: [
        "Bài REST dùng `PUT` để thay cả resource. Nhưng hai người cùng mở một đơn rồi cùng lưu thì người lưu sau ghi đè im lặng. {{etag}} là nhãn phiên bản của resource, server trả kèm khi `GET`. Client gửi lại trong header **`If-Match`** khi `PUT`; nếu resource đã đổi, server trả **412 Precondition Failed**.",
        "Đây là {{optimistic-lock|khoá lạc quan}} ở tầng HTTP, cùng ý với `@Version` của JPA. Nếu không có nó sẽ xảy ra {{lost-update}}.",
        "Server cũng có thể **bắt buộc** điều kiện này: thiếu header `If-Match` thì trả **428 Precondition Required**, có header nhưng sai phiên bản thì trả **412**.",
      ],
      predict: {
        question: "Server **bắt buộc** điều kiện phiên bản. Client gửi `PUT` mà quên header `If-Match`. Server trả gì?",
        options: ["200 OK, ghi bình thường", "412 Precondition Failed", "428 Precondition Required", "404 Not Found"],
        answer: 2,
        explain: "412 là có gửi điều kiện nhưng phiên bản đã đổi. 428 là không gửi điều kiện nào, để không ai ghi mù.",
      },
      widgetTitle: "A và B cùng sửa đơn hàng",
      compare: [
        way(
          "PUT không điều kiện",
          `PUT /orders/1
{ "name": "Order A (A edit)" }          # ghi đè, không biết ai đã sửa trước`,
          [
            ask("A lưu, rồi B lưu (cùng mở từ phiên bản v1)", bad("Đã chạy: cả hai đều nhận `200`, tên cuối cùng là bản của B. **Thay đổi của A mất** mà không ai biết.")),
          ],
          "Người lưu sau ghi đè im lặng.",
        ),
        way(
          "If-Match với ETag",
          `GET /orders/1      ->  ETag: "v1"
PUT /orders/1
If-Match: "v1"           # chỉ lưu nếu phiên bản hiện tại còn là v1`,
          [
            ask("A lưu, rồi B lưu (cùng mở từ v1)", ok("Đã chạy: A nhận `200` (nay là `v2`), B nhận `412 Precondition Failed (current \"v2\")`. B phải tải lại rồi quyết định.")),
            ask("Client quên gửi If-Match", ok("Đã chạy: `428 Precondition Required`. Server có thể **bắt buộc** điều kiện để không ai ghi mù.")),
          ],
          "Xung đột bị phát hiện thay vì ghi đè im lặng.",
        ),
      ],
      after: [
        "`ETag` cũng dùng cho cache: client gửi `If-None-Match`, nếu không đổi server trả `304 Not Modified` không kèm nội dung. Trong Spring: `ShallowEtagHeaderFilter`, hoặc trả `ResponseEntity.eTag(...)`.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["`GET` nhận ETag → `PUT` gửi lại trong `If-Match` → phiên bản đã đổi thì `412`, client tải lại rồi quyết định."],
      },
      trap: {
        title: "Dùng ETag nhưng quên kiểm tra khi ghi",
        text: "Chỉ phát ETag mà không kiểm tra `If-Match` ở `PUT` thì không chống được gì. Kiểm tra phải nằm ở server, và nên kèm khoá lạc quan (`@Version`) ở database. Lý do: hai `PUT` mang cùng `If-Match` có thể cùng qua bước kiểm tra trước khi một trong hai kịp ghi. `@Version` nằm ngay trong câu `UPDATE` nên chặn được khe hở đó.",
      },
      quiz: {
        question: "Client gửi `PUT` với `If-Match: \"v1\"` nhưng resource hiện đã là `v2`. Server trả gì?",
        options: ["412 Precondition Failed", "200 OK và ghi đè", "404 Not Found", "500 Internal Server Error"],
        answer: 0,
        explain: "Đã chạy: `412 Precondition Failed (current \"v2\")`. Client cần tải lại phiên bản mới.",
      },
    },
    {
      id: "webhook-sign",
      title: "Webhook: ký để chứng minh nguồn gốc",
      intro: [
        "ETag bảo vệ khi client gọi vào API của bạn. Còn chiều ngược lại: **webhook** là server của bạn gọi ngược về URL của khách khi có sự kiện (ví dụ thanh toán xong). Bên nhận phải biết yêu cầu **đến thật từ bạn** và **chưa bị sửa**.",
        "Cách chuẩn: ký bằng {{hmac|HMAC-SHA256}} với bí mật dùng chung, ký cả **mốc thời gian** và nội dung. Bên nhận làm 3 bước:",
        "- **Tính lại chữ ký**: từ body nhận được, mốc thời gian và bí mật.",
        "- **So sánh hằng thời gian**: với chữ ký trong header.",
        "- **Kiểm tra mốc thời gian**: từ chối mốc quá cũ.",
      ],
      board: {
        title: "Bên nhận webhook kiểm tra chữ ký thế nào",
        highlight: "kiểm tra chữ ký",
        chips: ["Đến thật từ bạn", "Chưa bị sửa"],
        cards: [
          {
            title: "Ba bước của bên nhận",
            diagram: {
              kind: "flow",
              steps: ["Nhận body + header", "Tính lại HMAC-SHA256", "So sánh hằng thời gian", "Kiểm tra mốc thời gian"],
              ok: ["Khớp và còn mới", "Xử lý webhook"],
              bad: ["Sai chữ ký hoặc quá cũ", "Từ chối"],
            },
            notes: ["Chữ ký tính trên mốc thời gian và nội dung, với bí mật dùng chung."],
            code: `String sig = hmacSha256(secret, timestamp + "." + body);
if (!MessageDigest.isEqual(expected, given)) reject;`,
            takeaway: "Sửa body mà giữ nguyên chữ ký thì không khớp",
          },
          {
            title: "Cách so sánh",
            diagram: {
              kind: "pipe",
              from: "Chữ ký tính lại",
              via: "MessageDigest.isEqual",
              to: "Khớp hoặc không",
              skipped: ["String.equals"],
              skippedLabel: "Tránh",
            },
            notes: ["`String.equals` dừng ở ký tự khác đầu tiên, có thể lộ thông tin qua thời gian phản hồi."],
            takeaway: "So sánh chữ ký phải hằng thời gian",
          },
        ],
        conclusion: "**Kết luận:** ký cả mốc thời gian và nội dung, rồi bên nhận tính lại và so sánh hằng thời gian.",
      },
      predict: {
        question: "Kẻ tấn công bắt được một yêu cầu thật, sửa `paid` thành `refunded` nhưng giữ nguyên header chữ ký. Bên nhận có HMAC sẽ làm gì?",
        options: [
          "Chấp nhận, vì chữ ký là thật",
          "Từ chối vì sai chữ ký: chữ ký tính lại từ body mới không khớp",
          "Từ chối vì mốc thời gian quá cũ",
          "Chấp nhận nếu gửi trong 5 phút",
        ],
        answer: 1,
        explain: "Chữ ký được tính trên cả nội dung. Sửa một ký tự của body là chữ ký tính lại khác hẳn, và kẻ tấn công không có bí mật để ký lại.",
      },
      widgetTitle: "Nhận sự kiện thanh toán",
      compare: [
        way(
          "Nhận mọi yêu cầu POST",
          `@PostMapping("/webhook")
void handle(@RequestBody String body) { process(body); }     // ai gọi cũng được`,
          [
            ask("Kẻ lạ gửi sự kiện \"paid\" giả", bad("Đơn hàng bị đánh dấu đã thanh toán dù chưa ai trả tiền.")),
            ask("Kẻ tấn công gửi lại một yêu cầu thật đã bắt được", bad("Không có gì ngăn việc phát lại (replay).")),
          ],
          "Không có bằng chứng nguồn gốc, và không chống phát lại.",
        ),
        way(
          "HMAC với mốc thời gian",
          `String sig = hmacSha256(secret, timestamp + "." + body);    // phía gửi, đặt vào header
// phía nhận: tính lại, so hằng thời gian, kiểm tra mốc thời gian
if (Math.abs(now - timestamp) > 300) reject;
if (!MessageDigest.isEqual(expected, given)) reject;`,
          [
            ask("Chữ ký đúng", ok("Đã chạy: `accepted`.")),
            ask("Nội dung bị sửa (paid thành refunded)", ok("Đã chạy: `rejected: bad signature`.")),
            ask("Phát lại sau 10 phút", ok("Đã chạy: `rejected: timestamp outside 5 minute window`.")),
            ask("Sai bí mật", ok("Đã chạy: `rejected: bad signature`.")),
          ],
          "Chữ ký chứng minh nguồn gốc và nội dung, mốc thời gian chặn phát lại.",
        ),
      ],
      after: [
        "Phát lại **trong** cửa sổ 5 phút thì vẫn qua bước này. Bước chống trùng theo `event id` ở phần tiếp theo sẽ bắt nó.",
        "Phải ký trên **chuỗi byte gốc** của body (trước khi parse JSON), vì parse rồi serialize lại có thể đổi thứ tự hay khoảng trắng. Nên hỗ trợ **xoay vòng bí mật** (nhiều bí mật hợp lệ trong lúc chuyển).",
      ],
      takeaway: {
        lines: [
          "Chữ ký chứng minh **nguồn gốc và nội dung**. Mốc thời gian chặn phát lại yêu cầu cũ.",
          "Phát lại trong cửa sổ thời gian thì cần thêm chống trùng theo `event id`.",
        ],
      },
      trap: {
        title: "So sánh chữ ký bằng equals",
        text: "`String.equals` dừng ở ký tự khác đầu tiên, có thể lộ thông tin qua thời gian phản hồi. Dùng `MessageDigest.isEqual` (so sánh hằng thời gian).",
      },
      quiz: {
        question: "Vì sao chữ ký webhook nên bao gồm cả mốc thời gian?",
        options: [
          "Để từ chối các yêu cầu cũ bị phát lại",
          "Để chữ ký ngắn hơn",
          "Để không cần bí mật",
          "Để chạy nhanh hơn",
        ],
        answer: 0,
        explain: "Đã chạy: cùng chữ ký đúng nhưng gửi lại sau 10 phút bị từ chối vì mốc thời gian quá cũ.",
      },
    },
    {
      id: "webhook-retry",
      title: "Webhook: thử lại và chống trùng",
      intro: [
        "Chữ ký cho biết yêu cầu là thật, nhưng chưa nói gì về chuyện gửi thất bại. Bên nhận có thể tạm lỗi nên bên gửi phải **thử lại** bằng {{backoff}}, để không dồn thêm tải vào hệ thống đang ốm.",
        "Vì thử lại nên cùng một sự kiện có thể đến nhiều lần: bên nhận phải {{idempotent}}, lưu `event id` đã xử lý và bỏ qua bản trùng.",
      ],
      predict: {
        question: "Bên nhận idempotent nhận 4 lần: `evt_1` ba lần, `evt_2` một lần. Có bao nhiêu sự kiện được áp dụng?",
        options: ["1", "2", "3", "4"],
        answer: 1,
        explain: "Mỗi `event id` chỉ được xử lý một lần: `evt_1` một lần, `evt_2` một lần. Hai lần gửi lại của `evt_1` bị bỏ qua.",
      },
      widgetTitle: "Gửi lại khi bên nhận lỗi",
      compare: [
        way(
          "Thử lại liên tục, nhận không chống trùng",
          `while (!send(event)) { /* thử lại ngay */ }
void handle(String id) { applyPayment(id); }       // nhận hai lần là cộng tiền hai lần`,
          [
            ask("Bên nhận đang quá tải", bad("Mọi người gửi lại cùng lúc làm tải tăng thêm, bên nhận càng khó hồi phục.")),
            ask("Sự kiện đến hai lần", bad("Xử lý hai lần: ví dụ cộng tiền hai lần.")),
          ],
          "Thử lại dồn dập và xử lý lặp.",
        ),
        way(
          "Backoff có jitter và nhận idempotent",
          `delay = random(ceiling / 2, ceiling)     // ceiling = min(cap, base * 2^attempt)
void handle(String id) { if (!seen.add(id)) return; applyPayment(id); }`,
          [
            ask("Bên nhận đang quá tải", ok("Đã chạy (gốc 1s, trần 60s): các lần chờ khoảng `863, 1683, 2617, 5108, 13324, 30453` ms, tăng dần và có ngẫu nhiên nên các bên không đồng loạt dồn vào cùng một lúc.")),
            ask("Sự kiện đến hai lần", ok("Đã chạy với 4 lần nhận: `evt_1` ba lần, `evt_2` một lần. `evt_1` xử lý một lần, hai lần gửi lại bị `duplicate ignored`; tổng chỉ áp dụng **2** sự kiện.")),
          ],
          "Thử lại nhẹ nhàng, và an toàn khi trùng.",
        ),
      ],
      after: [
        "Đoạn code trên dùng `Set` trong bộ nhớ cho gọn. Đừng chép vào production:",
        "- **Restart**: mất danh sách đã thấy.",
        "- **Nhiều instance**: mỗi instance có `Set` riêng, không thấy của nhau.",
        "- **Thứ tự sai**: `seen.add` chạy **trước** `applyPayment` nên apply lỗi thì sự kiện bị bỏ luôn.",
        "Production lưu `event id` vào một bảng có unique key, ghi **cùng transaction** với thay đổi thanh toán.",
        "Sau nhiều lần thất bại, đưa sự kiện vào {{dead-letter}} để xem tay. Trả `2xx` nhanh rồi xử lý ở nền.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Bên nhận tạm lỗi → bên gửi thử lại với backoff → cùng sự kiện đến nhiều lần → bên nhận chống trùng theo `event id`."],
      },
      trap: {
        title: "Nhận webhook rồi xử lý nặng ngay trong request",
        text: "Xử lý lâu làm bên gửi tưởng bạn lỗi (timeout) rồi gửi lại. Hãy lưu sự kiện, trả `200` ngay, rồi xử lý ở nền, vẫn kèm kiểm tra trùng.",
      },
      quiz: {
        question: "Vì sao bên nhận webhook phải idempotent?",
        options: [
          "Vì bên gửi có thể gửi cùng một sự kiện nhiều lần khi thử lại",
          "Vì webhook luôn gửi hai lần",
          "Vì HTTP không cho gửi một lần",
          "Vì cần tiết kiệm băng thông",
        ],
        answer: 0,
        explain: "Đã chạy: 4 lần nhận chỉ áp dụng 2 sự kiện duy nhất nhờ lưu `event id` đã xử lý.",
      },
    },
    {
      id: "openapi",
      title: "OpenAPI: tài liệu và hợp đồng của API",
      intro: ["ETag và webhook giữ dữ liệu đúng. Còn để người khác biết gọi API thế nào thì cần một hợp đồng viết ra giấy. **OpenAPI** mô tả API bằng một file chuẩn (YAML/JSON): đường dẫn, tham số, kiểu dữ liệu, mã lỗi. Bấm từng dòng để xem câu nên nói."],
      widgetTitle: "OpenAPI trong thực tế",
      cheat: [
        { name: "Sinh từ code (springdoc)", one: "Tài liệu theo code đang có.", say: "Với Spring Boot em dùng springdoc-openapi: nó đọc controller và DTO để sinh OpenAPI và giao diện Swagger UI. Nhanh và luôn khớp code, nhưng hợp đồng bị code quyết định." },
        { name: "Hợp đồng trước (contract-first)", one: "Viết spec rồi sinh code.", say: "Em viết file OpenAPI trước, thống nhất với nhóm frontend và đối tác, rồi dùng openapi-generator sinh interface hay client. Hợp đồng là nguồn sự thật, code phải theo." },
        { name: "Phát hiện thay đổi phá vỡ", one: "So sánh hai phiên bản spec.", say: "Em đưa bước so sánh spec (ví dụ openapi-diff) vào CI để phát hiện thay đổi phá vỡ như xoá field, đổi kiểu, đổi mã lỗi, trước khi lên production." },
        { name: "Mô tả lỗi", one: "Mã lỗi và schema lỗi.", say: "Em khai báo rõ các mã trả về (400, 401, 403, 404, 409, 429) và dạng lỗi thống nhất ProblemDetail trong spec để client xử lý đúng." },
        { name: "Bảo mật trong spec", one: "Khai báo cách xác thực.", say: "Em khai báo security scheme (Bearer JWT, OAuth2) trong spec để tài liệu và client sinh ra biết cách gửi token. Không đưa bí mật thật vào ví dụ." },
      ],
      quiz: {
        question: "Ưu điểm của contract-first so với sinh spec từ code?",
        options: [
          "Hợp đồng được thống nhất trước và là nguồn sự thật, nhiều nhóm làm song song được",
          "Không cần viết code",
          "Luôn nhanh hơn",
          "Không cần kiểm thử",
        ],
        answer: 0,
        explain: "Frontend và backend cùng dựa vào spec ngay từ đầu. Đổi lại cần kỷ luật giữ spec và code đồng bộ.",
      },
    },
  ],
  cards: [
    { q: "ETag và If-Match chống điều gì?", a: "Lost update: hai client cùng sửa từ một phiên bản. Server trả 412 Precondition Failed khi phiên bản đã đổi, 428 nếu bắt buộc điều kiện mà client không gửi. Cùng ý với @Version của JPA." },
    { q: "ETag dùng cho cache thế nào?", a: "Client gửi If-None-Match, nếu không đổi server trả 304 Not Modified không kèm nội dung." },
    { q: "Ký webhook thế nào?", a: "HMAC-SHA256 trên timestamp + '.' + body gốc với bí mật dùng chung. Bên nhận tính lại, so sánh hằng thời gian (MessageDigest.isEqual), từ chối timestamp quá cũ để chống phát lại." },
    { q: "Thử lại webhook thế nào cho đúng?", a: "Backoff luỹ thừa có jitter (ceiling = min(cap, base x 2^n), chờ ngẫu nhiên trong nửa trên), sau nhiều lần thì chuyển vào dead-letter queue." },
    { q: "Bên nhận webhook cần gì?", a: "Idempotent: lưu event id đã xử lý và bỏ qua bản trùng. Kiểm tra chữ ký trước. Trả 2xx nhanh rồi xử lý ở nền." },
    { q: "Contract-first và code-first khác nhau thế nào?", a: "Contract-first viết OpenAPI trước rồi sinh code, spec là nguồn sự thật. Code-first (springdoc) sinh spec từ code, nhanh nhưng hợp đồng theo code. Đưa so sánh spec vào CI để bắt thay đổi phá vỡ." },
  ],
  modelAnswer:
    "Để chống ghi đè mất dữ liệu, em dùng ETag kèm If-Match: nếu phiên bản đã đổi thì trả 412, và có thể bắt buộc điều kiện bằng 428. Với webhook em ký HMAC-SHA256 trên mốc thời gian cộng body, so sánh hằng thời gian và từ chối mốc quá cũ để chặn phát lại. Bên gửi thử lại với backoff luỹ thừa có jitter và dead-letter queue, bên nhận idempotent bằng cách lưu event id. Em dùng OpenAPI làm hợp đồng, sinh từ springdoc hoặc viết trước, và đưa so sánh spec vào CI.",
};
