import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs below were run on JDK 21 (SecDemo.java): query text, HTML escaping, IDOR owner check, InetAddress checks for SSRF, Path.normalize for traversal, SHA-256 vs PBKDF2 (600000 iterations) timings on the author's machine.
export const webVulns: Lesson = {
  slug: "web-vulns",
  crumb: "Web Vulnerabilities",
  videoDir: "/videos/web-vulns",
  videoVersion: "0",
  scenes: [],
  title: "Lỗ hổng web hay bị hỏi: SQL injection, XSS, IDOR, SSRF",
  subtitle:
    "Mỗi lỗ hổng đi theo một khuôn: đầu vào không tin cậy, vì sao nguy hiểm, và cách chặn ở đúng chỗ. Kèm code Java chạy thật cho SQL injection, XSS, IDOR, SSRF, path traversal và lưu mật khẩu.",
  openingQuiz: {
    question: "Nguyên tắc chung chặn hầu hết lỗ hổng injection là gì?",
    options: [
      "Coi mọi dữ liệu từ ngoài là dữ liệu, không bao giờ để nó thành lệnh (tham số hoá, mã hoá đầu ra)",
      "Lọc bỏ các ký tự lạ ở form",
      "Giấu thông báo lỗi",
      "Dùng HTTPS",
    ],
    answer: 0,
    explain: "Injection xảy ra khi dữ liệu bị diễn giải như lệnh. Cách bền vững là tách rõ hai thứ: câu lệnh cố định, dữ liệu truyền riêng.",
  },
  roadmap: [
    "Chặng 1: SQL injection và XSS. Dữ liệu bị diễn giải thành lệnh.",
    "Chặng 2: IDOR và SSRF. Kiểm tra quyền theo object, và server bị lừa gọi nội bộ.",
    "Chặng 3: path traversal và lưu mật khẩu, rồi bài tập ghép lỗ hổng với cách chặn.",
  ],
  sections: [
    {
      id: "sqli",
      title: "SQL injection: dữ liệu thành câu lệnh",
      intro: [
        "Nối chuỗi đầu vào của người dùng vào câu SQL cho phép họ **sửa câu lệnh**. Đầu vào `' OR '1'='1` làm điều kiện luôn đúng và trả về mọi dòng.",
        "Cách chặn bền vững: **câu lệnh tham số hoá** (prepared statement). Câu SQL cố định, giá trị truyền riêng và luôn được coi là dữ liệu.",
      ],
      board: {
        title: "SQL injection: nối chuỗi với tham số hoá",
        highlight: "tham số hoá",
        chips: ["Dữ liệu không được thành câu lệnh"],
        cards: [
          {
            title: "Cùng đầu vào, hai kết quả",
            diagram: {
              kind: "flow",
              steps: ["Nhập ' OR '1'='1", "Truy vấn theo name"],
              ok: ["Tham số hoá", "Chỉ là dữ liệu"],
              bad: ["Nối chuỗi", "Trả mọi dòng"],
            },
            notes: ["Nối chuỗi làm điều kiện luôn đúng và sửa cả câu lệnh."],
            takeaway: "Câu SQL cố định, giá trị truyền riêng",
          },
          {
            title: "Prepared statement",
            diagram: {
              kind: "pipe",
              from: "Đầu vào người dùng",
              via: "Câu SQL cố định + ?",
              to: "Giá trị là dữ liệu",
              skipped: ["Nối chuỗi vào SQL", "Tự escape dấu nháy"],
              skippedLabel: "Không làm",
            },
            code: `var ps = con.prepareStatement("SELECT * FROM users WHERE name = ?");
ps.setString(1, name);`,
            takeaway: "Giá trị truyền riêng luôn được coi là dữ liệu",
          },
        ],
        conclusion: "**Kết luận:** chặn bền vững bằng câu lệnh tham số hoá, không bằng tự escape.",
      },
      predict: {
        question: "Câu SQL được ghép bằng cách nối chuỗi đầu vào vào `WHERE name = '...'`, người dùng nhập `' OR '1'='1`. Truy vấn trả về gì?",
        options: [
          "Không dòng nào, vì không ai tên như vậy",
          "Mọi người dùng, vì điều kiện luôn đúng",
          "Lỗi cú pháp SQL",
          "Đúng một người dùng đầu tiên",
        ],
        answer: 1,
        explain: "Đầu vào đóng dấu nháy rồi thêm `OR '1'='1'`, nên câu lệnh bị sửa thành điều kiện luôn đúng.",
      },
      widgetTitle: "Đăng nhập với tên ' OR '1'='1",
      compare: [
        way(
          "Nối chuỗi",
          `String sql = "SELECT * FROM users WHERE name = '" + input + "'";`,
          [
            ask("Đầu vào là ' OR '1'='1", bad("Đã chạy, câu SQL thành `SELECT * FROM users WHERE name = '' OR '1'='1'`. Điều kiện luôn đúng nên trả về **mọi người dùng**.")),
          ],
          "Đầu vào trở thành một phần của câu lệnh.",
        ),
        way(
          "Prepared statement",
          `PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE name = ?");
ps.setString(1, input);        // giá trị truyền riêng, luôn là dữ liệu`,
          [
            ask("Đầu vào là ' OR '1'='1", ok("Câu SQL vẫn là `... WHERE name = ?`, giá trị `' OR '1'='1` chỉ là một chuỗi cần so khớp, không thể đổi cấu trúc câu lệnh.")),
            ask("Trong Spring Data JPA", ok("Dùng tham số có tên: `@Query(\"... where u.name = :name\")` kèm `@Param(\"name\")`, hoặc query method như `findByName`.")),
          ],
          "Cấu trúc câu lệnh và dữ liệu được tách riêng.",
        ),
      ],
      after: [
        "Phần không bind được là **tên cột, tên bảng, hướng sắp xếp** (`ORDER BY`). Với chúng hãy so khớp trong một danh sách cho phép (allowlist) rồi mới đưa vào câu lệnh.",
      ],
      trap: {
        title: "Tự \"escape\" ký tự nháy thay cho tham số hoá",
        text: "Tự thay `'` bằng `''` dễ sót trường hợp (encoding, kiểu số, ngữ cảnh khác). Dùng tham số hoá của driver hay ORM, đừng tự chế.",
      },
      quiz: {
        question: "Phần nào của truy vấn KHÔNG thể bind bằng tham số `?`?",
        options: ["Tên cột và hướng `ORDER BY`", "Giá trị so sánh", "Giá trị `LIMIT`", "Giá trị `IN`"],
        answer: 0,
        explain: "Tham số chỉ thay được **giá trị**. Tên cột hay hướng sắp xếp phải kiểm tra bằng allowlist.",
      },
    },
    {
      id: "xss",
      title: "XSS: dữ liệu thành mã chạy trên trình duyệt",
      intro: [
        "SQL injection biến dữ liệu thành lệnh chạy trên database. XSS là cùng kiểu lỗi đó, nhưng chạy trên trình duyệt. {{xss}} xảy ra khi dữ liệu người dùng được in ra HTML mà **không mã hoá**, nên trình duyệt chạy nó như mã. Kẻ tấn công lấy được phiên đăng nhập hay thao tác thay nạn nhân.",
        "Cách chặn chính: **mã hoá đầu ra** theo ngữ cảnh (HTML, thuộc tính, JavaScript, URL). Thêm **Content-Security-Policy** làm lớp phòng thủ thứ hai.",
      ],
      widgetTitle: "Bình luận chứa thẻ script",
      compare: [
        way(
          "In thẳng dữ liệu vào HTML",
          `out.print("<p>" + comment + "</p>");     // comment = <script>alert(1)</script>`,
          [
            ask("Bình luận là <script>alert(1)</script>", bad("Trình duyệt thực thi đoạn script cho **mọi người xem** bình luận đó.")),
          ],
          "Dữ liệu được hiểu là mã HTML.",
        ),
        way(
          "Mã hoá đầu ra",
          `static String esc(String s) {
  return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
          .replace("\\"","&quot;").replace("'","&#x27;");
}`,
          [
            ask("Bình luận là <script>alert(1)</script>", ok("Đã chạy: ra `&lt;script&gt;alert(1)&lt;/script&gt;`, trình duyệt hiển thị thành chữ chứ không chạy.")),
            ask("Chèn vào thuộc tính HTML", ok("Đã chạy: `\" onmouseover=\"x()` thành `&quot; onmouseover=&quot;x()`, không thoát khỏi thuộc tính được.")),
          ],
          "Ký tự đặc biệt được đổi thành thực thể, trình duyệt coi là chữ.",
        ),
      ],
      after: [
        "Template engine hiện đại (Thymeleaf `th:text`, React) mã hoá mặc định. Nguy hiểm khi bạn **tự tắt** nó (Thymeleaf `th:utext`, React `dangerouslySetInnerHTML`). Cookie đặt `HttpOnly` để script không đọc được session.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Dữ liệu in thẳng ra HTML → trình duyệt chạy nó như mã → kẻ tấn công lấy phiên hoặc thao tác thay nạn nhân."],
      },
      trap: {
        title: "Chỉ mã hoá một chỗ, hoặc sai ngữ cảnh",
        text: "Mã hoá HTML không đủ khi chèn vào JavaScript hay URL: mỗi ngữ cảnh có quy tắc riêng. Dùng thư viện của framework theo đúng ngữ cảnh thay vì tự viết.",
      },
      quiz: {
        question: "Cách chặn XSS chính là gì?",
        options: [
          "Mã hoá đầu ra theo ngữ cảnh khi in dữ liệu ra HTML",
          "Chặn từ khoá `script` ở form",
          "Dùng POST thay GET",
          "Tắt JavaScript trên server",
        ],
        answer: 0,
        explain: "Lọc từ khoá luôn có cách vượt qua. Mã hoá đầu ra làm dữ liệu không bao giờ được hiểu là mã.",
      },
    },
    {
      id: "idor",
      title: "IDOR (BOLA): đổi id để xem dữ liệu người khác",
      intro: [
        "Hai lỗi trước là dữ liệu bị hiểu thành mã. IDOR thì khác: mã chạy đúng, nhưng thiếu kiểm tra quyền. {{idor}}: API trả dữ liệu chỉ nhờ biết **id**, không kiểm tra người gọi có **sở hữu** object. Đổi `/orders/1` thành `/orders/2` là xem được đơn người khác.",
        "Đứng đầu danh sách rủi ro API của OWASP (gọi là Broken Object Level Authorization).",
      ],
      widgetTitle: "An xem đơn hàng số 2 của Bình",
      compare: [
        way(
          "Chỉ kiểm tra đã đăng nhập",
          `@GetMapping("/orders/{id}")
Order get(@PathVariable long id) { return repo.findById(id); }   // ai đăng nhập cũng xem được mọi đơn`,
          [
            ask("An gọi /orders/2", bad("Đã chạy: trả về đơn hàng của **Bình**. Chỉ cần đoán id là xem được dữ liệu người khác.")),
          ],
          "Xác thực (là ai) có nhưng thiếu phân quyền theo object (được xem cái nào).",
        ),
        way(
          "Kiểm tra sở hữu ở mọi truy cập",
          `@GetMapping("/orders/{id}")
@PreAuthorize("@orderSecurity.isOwner(#id, authentication)")
Order get(@PathVariable long id) { return repo.findById(id); }
// hoặc truy vấn kèm chủ sở hữu: findByIdAndOwner(id, currentUser)`,
          [
            ask("An gọi /orders/2", ok("Đã chạy: `403 forbidden` vì đơn 2 thuộc về Bình.")),
            ask("Dùng id khó đoán (UUID)", bad("UUID chỉ làm khó việc đoán, **không thay thế** việc kiểm tra quyền: id bị lộ ở đâu đó là xem được.")),
          ],
          "Quyền được kiểm tra theo từng object ở mọi endpoint.",
        ),
      ],
      after: [
        "Trả **403** hay **404** khi không phải chủ? Cả hai đều chấp nhận được, miễn API dùng nhất quán. 403 nói thẳng là không có quyền. 404 giấu luôn việc đơn đó có tồn tại, nên kẻ dò không biết id nào có thật; truy vấn `findByIdAndUserId` không ra dòng nào thì tự nhiên thành 404.",
        "Cách gọn nhất: luôn truy vấn **kèm chủ sở hữu** (`findByIdAndUserId`) thay vì tìm theo id rồi mới kiểm tra, để không quên.",
      ],
      takeaway: {
        lines: ["Xác thực trả lời \"là ai\", còn IDOR cần thêm \"được xem object nào\". Luôn truy vấn kèm chủ sở hữu."],
      },
      trap: {
        title: "Tin vào việc id khó đoán",
        text: "UUID hay id ngẫu nhiên không phải cơ chế phân quyền. Nó lộ qua log, URL chia sẻ, hay đối tác. Luôn kiểm tra quyền theo object.",
      },
      quiz: {
        question: "Cách phòng IDOR hiệu quả nhất là gì?",
        options: [
          "Kiểm tra người gọi có quyền với object đó ở mọi endpoint",
          "Dùng id ngẫu nhiên dài",
          "Ẩn id khỏi giao diện",
          "Giới hạn số request",
        ],
        answer: 0,
        explain: "Id ngẫu nhiên hay ẩn id chỉ che giấu. Quyền theo object mới là phòng thủ thật.",
      },
    },
    {
      id: "ssrf",
      title: "SSRF: server bị lừa gọi vào mạng nội bộ",
      intro: [
        "IDOR là người dùng đọc dữ liệu không phải của mình. SSRF là người dùng mượn chính server để gọi tới chỗ họ không với tới được. {{ssrf}} xảy ra khi server gọi một URL do người dùng đưa (xem trước liên kết, tải ảnh, webhook). Kẻ tấn công trỏ URL vào **dịch vụ nội bộ** hay địa chỉ metadata của cloud (`169.254.169.254`).",
      ],
      predict: {
        question: "Server chỉ cho gọi URL có chứa chuỗi `good.com`. Kẻ tấn công gửi `http://good.com@127.0.0.1/x`. Server thật ra gọi tới host nào?",
        options: ["good.com", "127.0.0.1", "Không gọi được vì URL sai cú pháp", "Cả hai host"],
        answer: 1,
        explain: "Phần trước `@` là userinfo (tên đăng nhập), không phải host. Host thật là `127.0.0.1`, nên kiểm tra chuỗi bị qua mặt.",
      },
      widgetTitle: "Chức năng xem trước liên kết",
      compare: [
        way(
          "Gọi thẳng URL người dùng đưa",
          `String url = request.getParameter("url");
http.get(url);         // có thể là http://169.254.169.254/ hay http://localhost:8080/admin`,
          [
            ask("URL trỏ vào metadata của cloud", bad("Server tự gọi và trả nội dung nhạy cảm (thường chứa thông tin xác thực tạm thời) về cho kẻ tấn công.")),
            ask("Lừa kiểm tra chuỗi bằng userinfo", bad("Đã chạy: host của `http://good.com@127.0.0.1/x` thực ra là `127.0.0.1`. Kiểm tra chuỗi \"chứa good.com\" bị qua mặt.")),
          ],
          "Server dùng quyền mạng của nó thay cho kẻ tấn công.",
        ),
        way(
          "Allowlist và chặn địa chỉ nội bộ",
          `URI u = URI.create(url);
InetAddress ad = InetAddress.getByName(u.getHost());     // phân giải DNS rồi mới kiểm tra
if (ad.isLoopbackAddress() || ad.isSiteLocalAddress() || ad.isLinkLocalAddress()) reject;
// chỉ cho phép host trong allowlist, tắt tự động theo redirect`,
          [
            ask("Địa chỉ nội bộ", ok("Đã chạy: `127.0.0.1` là loopback, `10.0.0.5` là private, `169.254.169.254` là link-local, đều bị chặn. `8.8.8.8` thì không bị cờ nào.")),
            ask("Đổi qua redirect hay DNS", bad("Kiểm tra ở bước đầu chưa đủ: redirect và DNS rebinding (tên miền trả IP công khai lúc kiểm tra, rồi trả IP nội bộ lúc kết nối thật) có thể đổi đích sau đó. Phải kiểm tra IP thật của **mỗi** kết nối và tắt theo dõi redirect tự động.")),
          ],
          "Kiểm tra địa chỉ IP sau khi phân giải, không kiểm tra chuỗi URL.",
        ),
      ],
      after: [
        "Phòng thủ nhiều lớp:",
        "- **Allowlist**: chỉ cho tên miền được phép.",
        "- **Chặn dải IP nội bộ**: kiểm tra IP thật sau khi phân giải.",
        "- **Tách mạng**: mạng của dịch vụ này không với được dịch vụ nhạy cảm.",
        "- **IMDSv2**: trên cloud bật phiên bản metadata yêu cầu token.",
      ],
      trap: {
        title: "Chỉ kiểm tra chuỗi URL",
        text: "Kiểm tra bằng `contains` hay regex dễ bị qua mặt (userinfo, mã hoá IP dạng số, redirect). Phân giải ra địa chỉ IP thật rồi kiểm tra mới đáng tin.",
      },
      quiz: {
        question: "Vì sao SSRF nguy hiểm trên cloud?",
        options: [
          "Server có thể bị lừa gọi tới dịch vụ metadata nội bộ và lộ thông tin xác thực",
          "Vì làm chậm mạng",
          "Vì làm đầy ổ đĩa",
          "Vì lộ mật khẩu người dùng",
        ],
        answer: 0,
        explain: "Địa chỉ `169.254.169.254` chỉ truy cập được từ bên trong máy chủ. SSRF để kẻ tấn công mượn quyền đó.",
      },
    },
    {
      id: "traversal",
      title: "Path traversal: thoát khỏi thư mục cho phép",
      intro: [
        "SSRF lừa server gọi ra mạng; path traversal lừa server đọc file. Khi server đọc file theo tên người dùng đưa, đầu vào kiểu `../../etc/passwd` có thể thoát khỏi thư mục gốc. Cách chặn: **chuẩn hoá đường dẫn** (`normalize`) rồi kiểm tra vẫn **nằm trong** thư mục gốc.",
      ],
      widgetTitle: "Tải file theo tên",
      compare: [
        way(
          "Ghép thẳng đường dẫn",
          `Path p = base.resolve(userInput);     // userInput = "../../etc/passwd"
Files.readAllBytes(p);`,
          [
            ask("Đầu vào ../../etc/passwd", bad("Đã chạy: đường dẫn thành `/etc/passwd`, **nằm ngoài** thư mục `/srv/files`. File hệ thống bị đọc.")),
          ],
          "Không kiểm tra đích cuối cùng.",
        ),
        way(
          "normalize rồi kiểm tra startsWith",
          `Path p = base.resolve(userInput).normalize();
if (!p.startsWith(base)) throw new SecurityException("outside base");`,
          [
            ask("Đầu vào ../../etc/passwd", ok("Đã chạy: `inside base: false`, bị từ chối.")),
            ask("Đầu vào report.pdf", ok("Đã chạy: `/srv/files/report.pdf`, `inside base: true`, cho phép.")),
          ],
          "Kiểm tra trên đường dẫn đã chuẩn hoá, không phải chuỗi gốc.",
        ),
      ],
      after: [
        "Tốt hơn nữa: không dùng tên file của người dùng, mà lưu bằng id sinh ra và tra tên thật trong database. Liên kết tượng trưng (symlink) cũng cần xử lý (`toRealPath`).",
      ],
      trap: {
        title: "Kiểm tra chuỗi có chứa \"..\"",
        text: "Chặn chuỗi `..` bằng so khớp chuỗi dễ bị qua mặt (mã hoá URL, đường dẫn tuyệt đối). Chuẩn hoá rồi kiểm tra thư mục gốc mới chắc chắn.",
      },
      quiz: {
        question: "Cách kiểm tra path traversal đáng tin nhất?",
        options: [
          "Chuẩn hoá đường dẫn rồi kiểm tra còn nằm trong thư mục gốc",
          "Tìm chuỗi `..` trong tên file",
          "Chỉ cho phép đuôi `.pdf`",
          "Đổi tên file thành chữ hoa",
        ],
        answer: 0,
        explain: "Đã chạy: `base.resolve(\"../../etc/passwd\").normalize()` ra `/etc/passwd` và `startsWith(base)` là `false`.",
      },
    },
    {
      id: "password",
      title: "Lưu mật khẩu: hash phải chậm",
      intro: [
        "Không lưu mật khẩu thô, cũng không dùng hash nhanh như SHA-256: kẻ trộm dữ liệu thử được **hàng triệu mật khẩu mỗi giây**. Dùng hash **chậm** có {{salt}}: bcrypt, PBKDF2, Argon2.",
        "Bài Spring Security đã nói BCrypt. Ở đây xem vì sao độ chậm là điều cốt lõi.",
      ],
      widgetTitle: "Một lần băm mất bao lâu",
      compare: [
        way(
          "SHA-256 thường",
          `MessageDigest.getInstance("SHA-256").digest(password.getBytes());`,
          [
            ask("Kẻ trộm thử mật khẩu hàng loạt", bad("Đã chạy (máy tác giả, một luồng, JVM đã chạy nóng): khoảng **10 triệu** lần băm mỗi giây. Con số tùy phần cứng, nhưng luôn ở mức hàng triệu mỗi giây trên CPU, và GPU còn nhanh hơn nhiều. Mật khẩu yếu bị dò ra rất nhanh.")),
          ],
          "Nhanh là điểm yếu khi dùng cho mật khẩu.",
        ),
        way(
          "PBKDF2 nhiều vòng và có salt",
          `SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    .generateSecret(new PBEKeySpec(password, salt, 600_000, 256));`,
          [
            ask("Kẻ trộm thử mật khẩu hàng loạt", ok("Đã chạy: mỗi lần băm mất khoảng **200 ms** với 600.000 vòng, tức chậm hơn SHA-256 cỡ hàng triệu lần cho mỗi lần thử.")),
            ask("Hai người dùng cùng mật khẩu", ok("Salt riêng cho mỗi người nên hai hash khác nhau, không dùng được bảng tra sẵn (rainbow table).")),
          ],
          "Tốn thời gian có chủ đích, mỗi lần thử của kẻ tấn công đắt hơn rất nhiều.",
        ),
      ],
      after: [
        "Trong Spring dùng `PasswordEncoder` (`BCryptPasswordEncoder`, `Argon2PasswordEncoder`, hoặc `DelegatingPasswordEncoder`) thay vì tự viết. Số vòng nên tăng theo thời gian khi phần cứng mạnh lên.",
      ],
      trap: {
        title: "Mã hoá hai chiều hoặc hash nhanh cho mật khẩu",
        text: "Mật khẩu không cần giải mã ngược, chỉ cần so sánh. Dùng hash một chiều chậm có salt. Số trên đây là của một máy, chỉ để thấy tương quan.",
      },
      quiz: {
        question: "Vì sao hash mật khẩu cần chậm?",
        options: [
          "Để kẻ trộm cơ sở dữ liệu không thử được hàng triệu mật khẩu mỗi giây",
          "Để người dùng chờ lâu hơn",
          "Để tiết kiệm bộ nhớ",
          "Để dùng được salt",
        ],
        answer: 0,
        explain: "Đã chạy: SHA-256 thử khoảng 10 triệu mật khẩu mỗi giây, PBKDF2 600.000 vòng chỉ khoảng 5 lần mỗi giây trên một luồng.",
      },
    },
    {
      id: "ghep-chan",
      title: "Bài tập: lỗ hổng nào, chặn thế nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn cách chặn phù hợp nhất."],
      widgetTitle: "Chọn cách chặn",
      drill: {
        choices: [
          "Prepared statement",
          "Mã hoá đầu ra",
          "Kiểm tra quyền theo object",
          "Allowlist và chặn IP nội bộ",
          "Chuẩn hoá đường dẫn rồi kiểm tra",
          "Hash chậm có salt",
        ],
        summary: "Mỗi lỗ hổng có một cách chặn đúng chỗ: tách dữ liệu khỏi lệnh, mã hoá đầu ra, quyền theo object, kiểm tra đích, chuẩn hoá, hay làm chậm kẻ dò.",
        items: [
          { q: "Ô tìm kiếm ghép chuỗi vào câu SQL, đầu vào `' OR '1'='1` trả về mọi dòng.", a: "Prepared statement", why: "Câu SQL cố định, giá trị truyền riêng." },
          { q: "Bình luận chứa `<script>` chạy trên trình duyệt của mọi người xem.", a: "Mã hoá đầu ra", why: "Ký tự đặc biệt thành thực thể, được hiển thị chứ không chạy." },
          { q: "Đổi `/orders/1` thành `/orders/2` xem được đơn của người khác.", a: "Kiểm tra quyền theo object", why: "Phải kiểm tra người gọi sở hữu object ở mọi endpoint." },
          { q: "Chức năng xem trước liên kết bị trỏ tới `http://169.254.169.254/`.", a: "Allowlist và chặn IP nội bộ", why: "Phân giải DNS rồi chặn loopback, private, link-local." },
          { q: "Tải file theo tên bị dùng với `../../etc/passwd`.", a: "Chuẩn hoá đường dẫn rồi kiểm tra", why: "`normalize` rồi `startsWith(base)`." },
          { q: "Cơ sở dữ liệu bị lộ, kẻ trộm dò mật khẩu hàng loạt.", a: "Hash chậm có salt", why: "bcrypt, PBKDF2, Argon2 làm mỗi lần thử đắt." },
        ],
      },
    },
  ],
  cards: [
    { q: "SQL injection chặn thế nào?", a: "Prepared statement hoặc tham số có tên: câu SQL cố định, giá trị truyền riêng. Tên cột và ORDER BY không bind được nên dùng allowlist. Đừng tự escape." },
    { q: "XSS chặn thế nào?", a: "Mã hoá đầu ra theo ngữ cảnh (HTML, thuộc tính, JS, URL), dùng template engine mã hoá mặc định, thêm Content-Security-Policy, cookie HttpOnly. Cẩn thận th:utext và dangerouslySetInnerHTML." },
    { q: "IDOR là gì, chặn thế nào?", a: "Biết id là xem được dữ liệu người khác vì thiếu kiểm tra quyền theo object. Kiểm tra sở hữu ở mọi endpoint, truy vấn kèm chủ sở hữu. UUID không thay thế phân quyền." },
    { q: "SSRF là gì, chặn thế nào?", a: "Server bị lừa gọi URL do người dùng đưa, tới dịch vụ nội bộ hay metadata cloud (169.254.169.254). Allowlist, phân giải DNS rồi chặn IP loopback/private/link-local, tắt redirect, IMDSv2." },
    { q: "Path traversal chặn thế nào?", a: "base.resolve(input).normalize() rồi kiểm tra startsWith(base). Tốt hơn: dùng id sinh ra thay cho tên file của người dùng." },
    { q: "Vì sao không dùng SHA-256 thường cho mật khẩu?", a: "Quá nhanh (khoảng 10 triệu lần mỗi giây một luồng). Dùng bcrypt, PBKDF2, Argon2 có salt: mỗi lần băm mất cỡ trăm mili giây, kẻ dò đắt hơn hàng triệu lần." },
  ],
  modelAnswer:
    "Hầu hết lỗ hổng injection đến từ việc để dữ liệu bị hiểu thành lệnh. SQL injection em chặn bằng prepared statement, tên cột thì allowlist. XSS em chặn bằng mã hoá đầu ra theo ngữ cảnh và Content-Security-Policy. IDOR em chặn bằng kiểm tra quyền theo object ở mọi endpoint, id ngẫu nhiên không thay được phân quyền. SSRF em allowlist, phân giải DNS rồi chặn IP nội bộ và tắt redirect. Path traversal thì normalize rồi kiểm tra startsWith thư mục gốc. Mật khẩu em dùng hash chậm có salt như bcrypt hay Argon2 qua PasswordEncoder.",
};
