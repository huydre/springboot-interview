import type { Lesson } from "../types";

// Foundation layer under the REST, MVC flow and Security lessons. The curl -v outputs below were run against a minimal
// JDK 21 com.sun.net.httpserver server (curl 8.7.1, localhost:8089); the HTTP/2 lines come from `curl -v https://example.com`.
// Outputs are trimmed (some User-Agent, Accept and Date lines removed). The JDK server prints header names as "Content-type" and "Set-cookie": header names are case-insensitive.
export const httpBasics: Lesson = {
  slug: "http-basics",
  crumb: "HTTP nhập môn",
  videoDir: "/videos/http-basics",
  videoVersion: "0",
  scenes: [],
  title: "HTTP nhập môn: request và response thật sự trông thế nào",
  subtitle:
    "Một request và response trên dây gồm những gì, method an toàn và idempotent, các họ status code, những header phải biết, cookie với session và token, debug bằng curl -v và DevTools, keep-alive với HTTP/2, HTTPS.",
  openingQuiz: {
    question: "Bạn gọi `POST /orders` và nhận `HTTP/1.1 201 Created`. Thông tin nào cho biết đơn vừa tạo nằm ở đâu?",
    options: ["Header `Host`", "Header `Location`", "Header `Content-Length`", "Không có, phải gọi `GET /orders` để tìm"],
    answer: 1,
    explain:
      "Response `201` thường kèm header `Location` trỏ tới resource mới, ví dụ `Location: /orders/43`. `Host` là header của request, nói client gọi tới máy nào.",
  },
  roadmap: [
    "Chặng 1: một request và response trên dây gồm start line, header, dòng trống, body; method nào an toàn, method nào idempotent.",
    "Chặng 2: các họ status code 1xx tới 5xx và những code hay gặp; các header quan trọng; cookie, session và token ở mức nhập môn.",
    "Chặng 3: debug bằng `curl -v` và tab Network của DevTools; HTTP/1.1 keep-alive với HTTP/2; HTTPS trong một đoạn.",
  ],
  sections: [
    {
      id: "wire-format",
      title: "Phần 1: Request và response trên dây",
      intro: [
        "Bạn đã viết `@GetMapping` và gọi API bằng Postman. Nhưng giữa client và server thật ra chỉ có **chữ**: HTTP/1.1 là một giao thức dạng văn bản, gửi qua một kết nối TCP.",
        "Một **request** có bốn phần, theo đúng thứ tự:",
        "- **Start line (request line)**: method, path, phiên bản. Ví dụ `GET /orders/42 HTTP/1.1`.",
        "- **Header**: mỗi dòng một cặp `Tên: giá trị`, ví dụ `Host: localhost:8089`, `Accept: */*`. Tên header **không phân biệt hoa thường**.",
        "- **Dòng trống**: báo hết phần header.",
        "- **Body** (có thể không có): dữ liệu gửi kèm, ví dụ JSON của `POST`. `GET` thường không có body.",
        "Một **response** có cùng hình dạng, chỉ khác start line: thay vì method và path, nó là **status line** gồm phiên bản, mã số và lý do, ví dụ `HTTP/1.1 200 OK`.",
        "Header bắt buộc duy nhất trong HTTP/1.1 là `Host`: một máy chủ có thể phục vụ nhiều tên miền trên cùng IP, nên server cần biết bạn gọi tên miền nào.",
        "Server biết body dài bao nhiêu nhờ `Content-Length` (số byte), hoặc `Transfer-Encoding: chunked` khi gửi từng khúc mà chưa biết trước tổng độ dài.",
      ],
      predict: {
        question: "Gọi `curl -v http://localhost:8089/orders/42`. Dòng nào curl in ra là dòng **đầu tiên** server nhận được?",
        options: ["`Host: localhost:8089`", "`GET /orders/42 HTTP/1.1`", "`HTTP/1.1 200 OK`", "`{\"id\":42,\"status\":\"PAID\"}`"],
        answer: 1,
        explain:
          "Request luôn mở đầu bằng request line: method, path, phiên bản. Header đứng sau. `HTTP/1.1 200 OK` là dòng đầu của response, server gửi về chứ không nhận.",
      },
      board: {
        title: "Một request và response thật, in bằng curl -v",
        highlight: "curl -v",
        chips: ["Request line", "Header", "Dòng trống", "Body", "Status line"],
        cards: [
          {
            title: "GET một đơn hàng",
            diagram: {
              kind: "flow",
              steps: ["Request line: GET /orders/42 HTTP/1.1", "Header: Host, User-Agent, Accept", "Dòng trống: hết header", "Server xử lý"],
              ok: ["Status line", "HTTP/1.1 200 OK"],
              bad: ["Header và body", "Content-Type, Content-Length, rồi JSON"],
              neutral: true,
            },
            notes: [
              "Dòng bắt đầu bằng `>` là curl **gửi đi**, dòng bắt đầu bằng `<` là server **trả về**, dòng `{ [25 bytes data]` là curl báo nhận body.",
              "Đây là output thật từ một server Java tối giản (JDK 21 `HttpServer`). Server này in `Content-type` chữ thường, vẫn đúng vì tên header không phân biệt hoa thường.",
            ],
            code: `$ curl -v http://localhost:8089/orders/42
> GET /orders/42 HTTP/1.1
> Host: localhost:8089
> User-Agent: curl/8.7.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Thu, 26 Nov 2026 10:28:23 GMT
< Content-type: application/json
< Content-length: 25
< Cache-control: private, max-age=60
<
{"id":42,"status":"PAID"}`,
            takeaway: "Start line, header, dòng trống, body: cả request lẫn response",
          },
          {
            title: "POST có body",
            diagram: {
              kind: "flow",
              steps: ["POST /orders HTTP/1.1", "Content-Type: application/json", "Content-Length: 30", "Dòng trống, rồi 30 byte JSON"],
              ok: ["Status line", "HTTP/1.1 201 Created"],
              bad: ["Header Location", "/orders/43: đơn mới nằm ở đây"],
              neutral: true,
            },
            notes: ["`Content-Type` nói body là gì, `Content-Length` nói body dài bao nhiêu byte. Thiếu `Content-Type: application/json` thì Spring không biết đọc body thành object."],
            code: `$ curl -v -X POST -H 'Content-Type: application/json' \\
       -d '{"product":"Keyboard","qty":1}' http://localhost:8089/orders
> POST /orders HTTP/1.1
> Host: localhost:8089
> Content-Type: application/json
> Content-Length: 30
>
< HTTP/1.1 201 Created
< Content-type: application/json
< Content-length: 24
< Location: /orders/43
<
{"id":43,"status":"NEW"}`,
            takeaway: "Body đi kèm Content-Type và Content-Length",
          },
        ],
        conclusion: "**Kết luận:** mọi thứ Spring cho bạn (`@RequestBody`, `@RequestHeader`, `ResponseEntity`) chỉ là cách đọc và viết mấy dòng chữ này.",
      },
      takeaway: {
        lines: [
          "Request: request line, header, dòng trống, body. Response: status line, header, dòng trống, body.",
          "`Host` là header bắt buộc của HTTP/1.1. Tên header không phân biệt hoa thường.",
        ],
      },
      quiz: {
        question: "Server đọc tới đâu thì biết phần header của request đã hết?",
        options: ["Khi gặp header `Content-Length`", "Khi gặp một dòng trống", "Sau đúng 10 dòng", "Khi kết nối TCP đóng"],
        answer: 1,
        explain:
          "Một dòng trống ngăn header với body. Sau dòng trống, server dùng `Content-Length` (hoặc `chunked`) để biết đọc body bao nhiêu byte.",
      },
    },
    {
      id: "methods",
      title: "Phần 2: Method, safe và idempotent",
      intro: [
        "Request line mở đầu bằng **method**: nó nói bạn muốn làm gì với resource. Cách đặt URL và chọn method cho API được bàn kỹ trong bài REST API Design, ở đây ta chỉ cần nắm bảng gốc.",
        "Hai tính chất của method, định nghĩa trong chuẩn HTTP:",
        "- **Safe**: client không yêu cầu đổi gì trên server, chỉ đọc. Trình duyệt, crawler, cache được phép gọi lại tùy ý.",
        "- **Idempotent**: gửi 1 lần hay N lần, **trạng thái cuối** trên server như nhau. Mạng chập chờn thì client có thể tự gửi lại mà không sợ hậu quả.",
        "Bảng cần thuộc:",
        "- **GET, HEAD, OPTIONS**: safe, và vì vậy cũng idempotent. `HEAD` giống `GET` nhưng chỉ trả header, không có body. `OPTIONS` hỏi server cho phép method nào (trình duyệt dùng nó cho CORS preflight).",
        "- **PUT, DELETE**: không safe vì có đổi dữ liệu, nhưng idempotent: đặt lại cùng giá trị hay xoá lại cùng resource thì kết quả cuối như nhau.",
        "- **POST**: không safe, không idempotent. Gửi hai lần có thể tạo hai đơn.",
        "- **PATCH**: không safe, idempotent hay không tùy nội dung sửa.",
        "Gọi một method mà resource không hỗ trợ thì server trả **`405 Method Not Allowed`**, kèm header `Allow` liệt kê method được phép. Trong Spring Boot, gọi `DELETE` vào một URL chỉ có `@PostMapping` cũng ra 405.",
      ],
      board: {
        title: "Gọi sai method: 405 và header Allow",
        highlight: "405",
        chips: ["Safe", "Idempotent", "Allow"],
        cards: [
          {
            title: "DELETE vào URL chỉ nhận POST",
            diagram: {
              kind: "pipe",
              from: "DELETE /orders",
              via: "Server: /orders chỉ nhận POST",
              to: "405 Method Not Allowed + Allow: POST",
              skipped: ["404 (URL có tồn tại)", "500 (server không hỏng)"],
              skippedLabel: "Không phải",
            },
            notes: ["URL có thật, chỉ method sai, nên không phải 404. Header `Allow` giúp client biết phải gọi gì."],
            code: `$ curl -v -X DELETE http://localhost:8089/orders
> DELETE /orders HTTP/1.1
> Host: localhost:8089
>
< HTTP/1.1 405 Method Not Allowed
< Allow: POST
< Content-type: application/json
< Content-length: 30
<
{"error":"Method Not Allowed"}`,
            takeaway: "URL đúng, method sai: 405 kèm Allow",
          },
        ],
        conclusion: "**Kết luận:** safe là chỉ đọc, idempotent là gửi lại không gây thêm hậu quả. Mọi method safe đều idempotent, chiều ngược lại thì không.",
      },
      cheat: [
        { name: "GET", one: "Đọc resource. Safe, idempotent", say: "GET chỉ để đọc, không được đổi dữ liệu, nên cache và retry thoải mái." },
        { name: "HEAD", one: "Như GET nhưng chỉ lấy header", say: "HEAD dùng để kiểm tra resource có tồn tại, kích thước hay thời điểm sửa mà không tải body." },
        { name: "OPTIONS", one: "Hỏi server cho phép những gì", say: "OPTIONS trả các method được phép; trình duyệt gửi nó làm preflight trước request CORS phức tạp." },
        { name: "POST", one: "Tạo mới hoặc chạy một hành động. Không idempotent", say: "POST gửi hai lần có thể tạo hai bản ghi, nên retry POST cần thêm cơ chế như Idempotency-Key." },
        { name: "PUT", one: "Thay toàn bộ resource. Idempotent", say: "PUT gửi lại cùng nội dung thì trạng thái cuối vẫn vậy." },
        { name: "PATCH", one: "Sửa một phần. Tùy nội dung", say: "PATCH đặt giá trị thì idempotent, PATCH kiểu tăng thêm 1 thì không." },
        { name: "DELETE", one: "Xoá resource. Idempotent", say: "DELETE lần hai có thể trả 404 nhưng trạng thái cuối vẫn là resource không còn." },
      ],
      takeaway: {
        lines: ["Safe: GET, HEAD, OPTIONS. Idempotent: thêm PUT và DELETE. POST thì không cả hai."],
      },
      quiz: {
        question: "Vì sao trình duyệt được phép tự gửi lại một `GET` khi kết nối đứt giữa chừng, nhưng lại hỏi người dùng trước khi gửi lại form `POST`?",
        options: [
          "Vì GET nhanh hơn POST",
          "Vì GET là safe và idempotent, còn POST không idempotent nên gửi lại có thể tạo thêm một đơn hay trừ tiền lần nữa",
          "Vì POST không có header",
          "Vì GET luôn được cache",
        ],
        answer: 1,
        explain: "Retry chỉ an toàn khi gửi lại không gây thêm hậu quả. POST không có bảo đảm đó, nên trình duyệt hỏi \"Gửi lại biểu mẫu?\".",
      },
    },
    {
      id: "status-codes",
      title: "Phần 3: Status code: năm họ và những code hay gặp",
      intro: [
        "Response mở đầu bằng status line, và con số trong đó là thứ client, gateway, dashboard nhìn vào trước tiên. Chữ số đầu cho biết **họ**:",
        "- **1xx (thông tin)**: hiếm gặp khi viết API. Ví dụ `101 Switching Protocols` khi nâng cấp lên WebSocket.",
        "- **2xx (thành công)**: `200 OK` có body; `201 Created` khi tạo mới, kèm `Location`; `204 No Content` thành công mà không có body (xoá, đăng xuất).",
        "- **3xx (chuyển hướng)**: `301` chuyển vĩnh viễn, `302` chuyển tạm, cả hai kèm `Location` tới địa chỉ mới. `304 Not Modified`: bản client đang giữ vẫn còn mới, server không gửi lại body.",
        "- **4xx (lỗi phía client)**: request có vấn đề, gửi lại y hệt vẫn hỏng. `400` request sai định dạng, `401` chưa xác thực, `403` không đủ quyền, `404` không có resource, `405` sai method, `409` xung đột trạng thái, `415` sai `Content-Type`, `429` gọi quá nhiều.",
        "- **5xx (lỗi phía server)**: request có thể đúng nhưng server hỏng. `500` lỗi chưa bắt trong code, `502 Bad Gateway` proxy nhận về response hỏng từ service phía sau, `503` service tạm không phục vụ (quá tải, đang bảo trì), `504 Gateway Timeout` proxy chờ service phía sau quá lâu.",
        "Cách nhớ nhanh: **4xx là lỗi của người gọi, 5xx là lỗi của người được gọi**. Cách phân biệt 401 với 403, khi nào dùng 409 hay 422, và retry code nào, xem tiếp ở bài REST API Design.",
      ],
      board: {
        title: "Ba status thật: 201, 404, 204",
        highlight: "status",
        chips: ["2xx", "3xx", "4xx", "5xx"],
        cards: [
          {
            title: "201 Created kèm Location",
            diagram: {
              kind: "flow",
              steps: ["POST /orders với body JSON", "Server lưu đơn, cấp id 43"],
              ok: ["201 Created", "Location: /orders/43"],
              bad: ["Không phải 200", "200 không nói rằng có resource mới"],
            },
            notes: ["Client đọc `Location` để biết URL của đơn mới, không cần đoán id."],
            code: `< HTTP/1.1 201 Created
< Content-type: application/json
< Content-length: 24
< Location: /orders/43
<
{"id":43,"status":"NEW"}`,
            takeaway: "Tạo mới: 201 và Location",
          },
          {
            title: "404 Not Found",
            diagram: {
              kind: "flow",
              steps: ["GET /orders/99", "Server không tìm thấy đơn 99"],
              ok: ["404 Not Found", "Lỗi của client: id không tồn tại"],
              bad: ["Không phải 200 + body rỗng", "Client tưởng thành công"],
            },
            code: `$ curl -v http://localhost:8089/orders/99
> GET /orders/99 HTTP/1.1
>
< HTTP/1.1 404 Not Found
< Content-type: application/json
< Content-length: 21
<
{"error":"Not Found"}`,
            takeaway: "Không có resource: 404",
          },
        ],
        conclusion: "**Kết luận:** chọn status theo câu hỏi \"lỗi của ai, và gửi lại có khác gì không\". Body lỗi chỉ để giải thích thêm, không thay được status.",
      },
      drill: {
        choices: ["200", "201", "204", "304", "400", "401", "403", "404", "405", "415", "500", "502", "503", "504"],
        items: [
          { q: "`POST /orders` tạo đơn thành công, trả về đơn mới", a: "201", why: "Tạo mới resource: 201 Created, kèm `Location` tới đơn vừa tạo." },
          { q: "`DELETE /orders/42` xoá xong, không cần trả body", a: "204", why: "Thành công, không có gì để trả: 204 No Content." },
          { q: "`GET /orders/42` trả về JSON của đơn", a: "200", why: "Đọc thành công, có body: 200 OK." },
          { q: "Client gửi `{\"qty\": \"abc\"` (JSON thiếu ngoặc đóng)", a: "400", why: "Request sai định dạng, server không đọc được: 400 Bad Request." },
          { q: "Gọi API không kèm header `Authorization`", a: "401", why: "Chưa xác thực, server không biết bạn là ai: 401." },
          { q: "User thường gọi `DELETE /admin/users/7`, token hợp lệ", a: "403", why: "Đã biết là ai nhưng không đủ quyền: 403 Forbidden." },
          { q: "`GET /orders/99999`, đơn này không tồn tại", a: "404", why: "Resource không có: 404 Not Found." },
          { q: "`PUT /orders` trong khi URL này chỉ nhận `POST`", a: "405", why: "URL có, method không được hỗ trợ: 405, kèm header `Allow`." },
          { q: "Gửi body XML với `Content-Type: application/xml` vào API chỉ nhận JSON", a: "415", why: "Server không hỗ trợ kiểu nội dung này: 415 Unsupported Media Type." },
          { q: "Trình duyệt gửi `If-None-Match` với ETag cũ, file chưa đổi", a: "304", why: "Bản trong cache còn dùng được, server không gửi lại body: 304 Not Modified." },
          { q: "Code ném `NullPointerException` chưa ai bắt", a: "500", why: "Lỗi bên trong server: 500 Internal Server Error." },
          { q: "Nginx đứng trước app, app đã chết nên Nginx không nối được tới nó", a: "502", why: "Proxy không nhận được response hợp lệ từ phía sau: 502 Bad Gateway." },
          { q: "Nginx chờ app trả lời quá 60 giây, hết thời gian chờ", a: "504", why: "Phía sau còn sống nhưng không trả lời kịp: 504 Gateway Timeout." },
          { q: "Service đang quá tải, chủ động từ chối và báo `Retry-After: 30`", a: "503", why: "Tạm thời không phục vụ được: 503 Service Unavailable." },
        ],
        summary: "2xx thành công, 3xx đi chỗ khác hoặc dùng bản cache, 4xx người gọi sai, 5xx người được gọi hỏng. 502 và 504 là lỗi do proxy báo về service phía sau.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Chữ số đầu là họ: 2xx ổn, 3xx chuyển hướng, 4xx lỗi người gọi, 5xx lỗi server.",
          "Trả `200` kèm `{\"error\": ...}` làm client, gateway và monitoring đều tưởng thành công.",
        ],
      },
      trap: {
        title: "502 và 504 không phải lỗi của gateway",
        text: "Thấy `502` hay `504` từ Nginx hoặc API gateway, đừng vội đi sửa gateway. Hai code này là gateway báo rằng **service phía sau** chết, trả response hỏng (502) hoặc trả lời quá chậm (504). Xem log của app trước.",
      },
      quiz: {
        question: "Status nào nói rằng request **có thể đúng** nhưng phía server gặp sự cố?",
        options: ["404", "401", "503", "405"],
        answer: 2,
        explain: "Họ 5xx là lỗi phía server. 503 nghĩa là service tạm không phục vụ, thử lại sau có thể được. Ba code còn lại đều là 4xx, lỗi phía client.",
      },
    },
    {
      id: "headers-state",
      title: "Phần 4: Header quan trọng; cookie, session và token",
      intro: [
        "Ta đã thấy vài header trong output curl. Đây là những header gặp hằng ngày, chia theo việc chúng làm:",
        "- **`Content-Type`**: body này là gì. `application/json`, `application/x-www-form-urlencoded` (form HTML), `multipart/form-data` (upload file). Có ở cả request lẫn response.",
        "- **`Accept`**: client muốn nhận kiểu gì, ví dụ `Accept: application/json`. curl mặc định gửi `Accept: */*` (nhận gì cũng được). Server không trả được kiểu client đòi thì trả `406 Not Acceptable`.",
        "- **`Authorization`**: chứng minh bạn là ai, thường là `Authorization: Bearer <token>`. Thiếu hoặc sai thì `401`.",
        "- **`Cache-Control`**: response được cache ở đâu, bao lâu. `private, max-age=60` (chỉ trình duyệt được giữ, trong 60 giây), `no-store` (không lưu ở đâu cả, hợp cho dữ liệu nhạy cảm).",
        "- **`Location`**: địa chỉ cần biết tiếp theo: resource mới với `201`, địa chỉ chuyển tới với `301`/`302`.",
        "- **`Set-Cookie`**: server bảo trình duyệt lưu một cookie. Từ đó trình duyệt **tự gửi** header `Cookie` cho mỗi request tới cùng site.",
        "HTTP là **stateless**: mỗi request đứng riêng, server không tự nhớ request trước. Muốn biết \"đây vẫn là người vừa đăng nhập\" thì mỗi request phải mang theo một thứ gì đó. Ba khái niệm hay bị trộn lẫn:",
        "- **Cookie** là **cách chuyên chở**: một cặp tên và giá trị trình duyệt lưu lại và tự đính vào request. Nó chỉ là cái túi, bên trong đựng gì cũng được.",
        "- **Session** là **trạng thái lưu ở server**: server giữ thông tin user trong bộ nhớ hoặc Redis, đưa cho client một **session id** (thường đựng trong cookie, ví dụ `JSESSIONID` của Tomcat). Server tra id để biết là ai.",
        "- **Token** (ví dụ JWT) là **giấy tờ client tự mang**: thông tin user nằm trong token đã ký, server chỉ cần kiểm tra chữ ký, không phải tra session. Thường gửi qua `Authorization: Bearer`, cũng có thể đựng trong cookie.",
        "Cấu trúc JWT, so sánh đăng nhập bằng session với JWT, và chống CSRF khi dùng cookie được đi sâu trong bài Spring Security & JWT.",
      ],
      board: {
        title: "Server đặt cookie bằng Set-Cookie",
        highlight: "Set-Cookie",
        chips: ["Content-Type", "Accept", "Authorization", "Cache-Control", "Location", "Set-Cookie"],
        cards: [
          {
            title: "Đăng nhập trả về một session cookie",
            diagram: {
              kind: "flow",
              steps: ["POST /login với form u, p", "Server kiểm tra, tạo session", "204 kèm Set-Cookie: SESSION=abc123"],
              ok: ["Request sau", "Trình duyệt tự gửi Cookie: SESSION=abc123"],
              bad: ["JavaScript đọc cookie", "Bị chặn vì HttpOnly"],
            },
            notes: [
              "Không cần `-H`: khi dùng `-d`, curl tự thêm `Content-Type: application/x-www-form-urlencoded`.",
              "`HttpOnly`: JavaScript không đọc được cookie, giảm thiệt hại khi bị XSS. `Secure`: chỉ gửi qua HTTPS. `SameSite=Lax`: không gửi kèm phần lớn request do site khác khởi tạo, giảm rủi ro CSRF.",
            ],
            code: `$ curl -v -X POST -d 'u=an&p=x' http://localhost:8089/login
> POST /login HTTP/1.1
> Host: localhost:8089
> Content-Length: 8
> Content-Type: application/x-www-form-urlencoded
>
< HTTP/1.1 204 No Content
< Set-cookie: SESSION=abc123; Path=/; HttpOnly; Secure; SameSite=Lax
<`,
            takeaway: "Set-Cookie đặt cookie, trình duyệt tự gửi lại bằng Cookie",
          },
        ],
        conclusion: "**Kết luận:** cookie là cái túi, session là dữ liệu nằm ở server, token là giấy tờ đã ký client tự mang. Một hệ thống có thể dùng session id trong cookie, hoặc JWT trong header, hoặc JWT trong cookie.",
      },
      cheat: [
        { name: "Cookie", one: "Trình duyệt lưu và tự gửi kèm request", say: "Cookie là cơ chế chuyên chở: server đặt bằng Set-Cookie, trình duyệt tự gửi lại bằng header Cookie. Nên bật HttpOnly, Secure, SameSite." },
        { name: "Session", one: "Trạng thái user giữ ở server, client cầm id", say: "Session lưu thông tin đăng nhập ở server, client chỉ giữ session id, thường trong cookie. Thu hồi dễ, nhưng nhiều instance thì cần nơi lưu chung như Redis." },
        { name: "Token (JWT)", one: "Thông tin user đã ký, client tự mang", say: "Token chứa sẵn thông tin và chữ ký, server chỉ verify chữ ký nên không cần tra session. Đổi lại, thu hồi trước hạn khó hơn." },
      ],
      takeaway: {
        lines: [
          "`Content-Type` nói mình gửi gì, `Accept` nói mình muốn nhận gì.",
          "HTTP stateless: cookie chở, session nằm ở server, token client tự mang.",
        ],
      },
      quiz: {
        question: "Câu nào đúng về quan hệ giữa cookie và session?",
        options: [
          "Cookie và session là một thứ",
          "Session nằm ở server; cookie thường chỉ chở session id để server tra ra session",
          "Session lưu trong trình duyệt, cookie lưu ở server",
          "Dùng session thì không bao giờ cần cookie",
        ],
        answer: 1,
        explain: "Cookie là cách chuyên chở, session là dữ liệu ở server. Cách phổ biến nhất là cookie `JSESSIONID` chở session id. Gửi session id qua URL hay header cũng được nhưng ít dùng.",
      },
    },
    {
      id: "debug-versions",
      title: "Phần 5: Debug bằng curl và DevTools; HTTP/2 và HTTPS",
      intro: [
        "Khi frontend báo \"API lỗi\", việc đầu tiên là **xem request và response thật**, không đoán. Hai công cụ:",
        "- **`curl -v`**: in đủ request line, header gửi đi (`>`), status và header nhận về (`<`). Thêm `-X` chọn method, `-H` thêm header, `-d` gửi body, `-i` chỉ in header response kèm body, `-I` gửi `HEAD`.",
        "- **DevTools của trình duyệt**, tab **Network**: bấm vào một request để xem Headers (request và response), Payload (body gửi đi), Response, Timing (chờ DNS, kết nối, chờ server bao lâu). Bật **Preserve log** để không mất request khi trang chuyển hướng. Chuột phải chọn **Copy as cURL** để chạy lại đúng request đó trong terminal.",
        "Cách đọc nhanh khi có lỗi: nhìn **status** trước (họ nào), rồi **header** (`Content-Type` có đúng không, có `Authorization` không, có `Location` không), cuối cùng mới đọc body lỗi.",
        "Có một việc cần biết thêm: mỗi request cần một kết nối TCP, và mở kết nối tốn thời gian (với HTTPS còn thêm bước TLS). **HTTP/1.1 keep-alive** giữ kết nối mở sau response để request sau dùng lại. curl in rõ điều này khi gọi hai URL trong một lệnh.",
        "Nhưng trên một kết nối HTTP/1.1, request phải đi **lần lượt**: response trước chưa xong thì request sau phải chờ. Trình duyệt bù lại bằng cách mở vài kết nối song song tới mỗi host (thường khoảng 6).",
        "**HTTP/2** giữ nguyên method, header, status, nhưng đổi cách gửi trên dây: dạng nhị phân thay vì văn bản, nén header, và **multiplexing**, nhiều request chạy đan xen trên **một** kết nối mà không phải chờ nhau. Client và server thỏa thuận dùng HTTP/2 trong lúc bắt tay TLS (ALPN). HTTP/3 đi xa hơn, chạy trên QUIC (UDP).",
        "**HTTPS** là HTTP chạy bên trong một kết nối **TLS**, cổng mặc định 443. Khi bắt đầu, server gửi **certificate** chứng minh nó đúng là tên miền bạn gọi (được một CA tin cậy ký), hai bên thỏa thuận khóa, rồi mọi thứ sau đó (path, header, cookie, `Authorization`, body) đều được mã hóa và chống sửa đổi trên đường đi. Người ở giữa vẫn thấy bạn kết nối tới IP và tên miền nào, nhưng không đọc được nội dung. Vì vậy cookie có `Secure` và token Bearer chỉ nên đi qua HTTPS.",
      ],
      board: {
        title: "Dùng lại kết nối, và HTTP/2 qua TLS",
        highlight: "kết nối",
        chips: ["curl -v", "DevTools", "keep-alive", "HTTP/2", "TLS"],
        cards: [
          {
            title: "HTTP/1.1 keep-alive: hai request, một kết nối",
            diagram: {
              kind: "flow",
              steps: ["Mở kết nối TCP tới localhost:8089", "Request 1: GET /orders/42", "Giữ kết nối mở (left intact)"],
              ok: ["Request 2", "Re-using existing connection"],
              bad: ["Không keep-alive", "Mỗi request mở kết nối mới"],
            },
            notes: ["Dòng bắt đầu bằng `*` là curl kể việc nó làm với kết nối. Request thứ hai không mở kết nối mới."],
            code: `$ curl -v http://localhost:8089/orders/42 http://localhost:8089/orders/42
* Connected to localhost (::1) port 8089
* Connection #0 to host localhost left intact
* Re-using existing connection with host localhost
* Connection #0 to host localhost left intact`,
            takeaway: "Keep-alive tiết kiệm bước mở kết nối",
          },
          {
            title: "HTTPS chọn HTTP/2 lúc bắt tay TLS",
            diagram: {
              kind: "flow",
              steps: ["Bắt tay TLS, kiểm tra certificate", "ALPN: curl đề nghị h2 và http/1.1", "Server chọn h2"],
              ok: ["Request đi bằng HTTP/2", "GET / HTTP/2, nhận HTTP/2 200"],
              bad: ["Server không hỗ trợ h2", "Quay về HTTP/1.1"],
              neutral: true,
            },
            code: `$ curl -v https://example.com -o /dev/null
* ALPN: curl offers h2,http/1.1
* SSL connection using TLSv1.3 / AEAD-CHACHA20-POLY1305-SHA256
* ALPN: server accepted h2
> GET / HTTP/2
< HTTP/2 200`,
            takeaway: "HTTP/2 được thỏa thuận ngay trong bắt tay TLS",
          },
        ],
        conclusion: "**Kết luận:** HTTP/1.1, HTTP/2 hay HTTPS thì method, header và status vẫn y nguyên. Cái đổi là cách bytes đi trên dây: dùng lại kết nối, đan xen nhiều request, và mã hóa.",
      },
      takeaway: {
        lines: [
          "Debug: xem status, rồi header, rồi body. Dùng `curl -v` hoặc tab Network, Copy as cURL để chạy lại.",
          "Keep-alive dùng lại kết nối nhưng request đi lần lượt; HTTP/2 cho nhiều request chạy song song trên một kết nối.",
          "HTTPS = HTTP trong TLS: certificate chứng minh danh tính server, nội dung được mã hóa.",
        ],
      },
      trap: {
        title: "Postman chạy được, trình duyệt thì lỗi",
        text: "Gọi bằng curl hay Postman thành công nhưng trên trình duyệt lại lỗi: mở tab Network xem request thật. Thường là trình duyệt gửi thêm thứ mà Postman không gửi (header `Origin` dẫn tới CORS, cookie, preflight `OPTIONS`), hoặc thiếu thứ Postman tự thêm (header `Authorization`). Dùng Copy as cURL để so hai request.",
      },
      quiz: {
        question: "Điểm khác chính của HTTP/2 so với HTTP/1.1 keep-alive là gì?",
        options: [
          "HTTP/2 có thêm method mới",
          "HTTP/2 cho nhiều request và response đan xen trên một kết nối (multiplexing), không phải chờ nhau lần lượt",
          "HTTP/2 không dùng status code",
          "HTTP/1.1 không thể dùng lại kết nối",
        ],
        answer: 1,
        explain: "Keep-alive của HTTP/1.1 đã dùng lại kết nối, nhưng mỗi lúc chỉ một request đang chờ trên kết nối đó. HTTP/2 đổi sang khung nhị phân nên nhiều stream chạy song song. Method, header và status giữ nguyên.",
      },
    },
  ],
  modelAnswer:
    "Em hiểu HTTP là giao thức request và response dạng văn bản chạy trên TCP. Request gồm request line như `GET /orders/42 HTTP/1.1`, các header như `Host`, `Accept`, `Authorization`, một dòng trống, rồi body nếu có. Response cũng vậy nhưng mở đầu bằng status line như `HTTP/1.1 201 Created`. Về method, GET, HEAD, OPTIONS là safe; PUT và DELETE thêm vào nhóm idempotent; POST thì không, nên retry POST phải cẩn thận. Status code em chia theo họ: 2xx thành công, 3xx chuyển hướng hoặc dùng cache, 4xx lỗi của người gọi như 400, 401, 403, 404, 405, còn 5xx lỗi phía server như 500, 502, 503, 504. Header em hay dùng là `Content-Type` và `Accept` cho định dạng, `Authorization` cho token, `Cache-Control`, `Location` khi trả 201, và `Set-Cookie`. HTTP stateless nên phải mang trạng thái theo: cookie là cách chở, session lưu ở server, token thì client tự mang. Khi debug em dùng `curl -v` hoặc tab Network để xem status, header rồi mới đến body. Cuối cùng, HTTP/2 cho nhiều request song song trên một kết nối, và HTTPS là HTTP chạy trong TLS để xác thực server và mã hóa nội dung.",
  cards: [
    { q: "Bốn phần của một HTTP request?", a: "Request line (method, path, phiên bản), header, dòng trống, body (có thể không có)." },
    { q: "Header bắt buộc trong HTTP/1.1?", a: "`Host`, vì một IP có thể phục vụ nhiều tên miền." },
    { q: "Safe khác idempotent thế nào?", a: "Safe: chỉ đọc, không đổi server. Idempotent: gửi N lần trạng thái cuối như 1 lần. Safe thì luôn idempotent." },
    { q: "Method nào idempotent nhưng không safe?", a: "PUT và DELETE." },
    { q: "405 và 404 khác nhau thế nào?", a: "404: không có resource ở URL đó. 405: URL có, nhưng method không được hỗ trợ; kèm header `Allow`." },
    { q: "502 với 504?", a: "Cả hai do proxy báo về service phía sau. 502: nhận về response hỏng hoặc không nối được. 504: chờ quá lâu, hết thời gian." },
    { q: "`Content-Type` với `Accept`?", a: "`Content-Type`: body mình gửi là gì. `Accept`: mình muốn nhận kiểu gì." },
    { q: "Response 201 nên có header gì?", a: "`Location` trỏ tới resource vừa tạo." },
    { q: "Cookie, session, token khác nhau thế nào?", a: "Cookie là cách chuyên chở trong trình duyệt. Session là trạng thái lưu ở server, client giữ id. Token là thông tin đã ký client tự mang." },
    { q: "Ba thuộc tính cookie nên bật cho session?", a: "`HttpOnly` (JS không đọc được), `Secure` (chỉ đi HTTPS), `SameSite` (giảm CSRF)." },
    { q: "Keep-alive và HTTP/2 multiplexing?", a: "Keep-alive dùng lại kết nối nhưng request đi lần lượt. HTTP/2 chạy nhiều request đan xen trên một kết nối." },
    { q: "HTTPS bảo vệ những gì?", a: "Xác thực server qua certificate, mã hóa và chống sửa path, header, cookie, body. Tên miền và IP đích vẫn lộ." },
  ],
};
