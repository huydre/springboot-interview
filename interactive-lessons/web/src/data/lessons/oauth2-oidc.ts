import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs below were run on JDK 21 (SecDemo.java): PKCE S256 against the RFC 7636 appendix B vector, a hand-written HS256 JWT verifier, and a refresh-token store with reuse detection.
export const oauth2Oidc: Lesson = {
  slug: "oauth2-oidc",
  crumb: "OAuth2, OIDC, JWT",
  videoDir: "/videos/oauth2-oidc",
  videoVersion: "0",
  scenes: [],
  title: "OAuth2, OIDC, PKCE và kiểm tra JWT",
  subtitle:
    "OAuth2 ủy quyền, OIDC xác thực, vì sao cần PKCE, kiểm tra JWT cho đúng, và refresh token rotation. Có code Java chạy thật để thấy từng token bị chặn thế nào.",
  openingQuiz: {
    question: "OAuth2 và OIDC khác nhau cốt lõi ở đâu?",
    options: [
      "OAuth2 ủy quyền truy cập tài nguyên (access token), OIDC thêm lớp xác thực để biết người dùng là ai (ID token)",
      "Hai thứ giống hệt nhau",
      "OIDC cũ hơn OAuth2",
      "OAuth2 chỉ dùng cho mobile",
    ],
    answer: 0,
    explain: "OAuth2 trả lời \"ứng dụng này được phép làm gì\". OIDC xây trên OAuth2 để trả lời \"người dùng này là ai\".",
  },
  roadmap: [
    "Chặng 1: OAuth2 và OIDC. Vì sao không đưa mật khẩu cho ứng dụng khác, và Authorization Code flow.",
    "Chặng 2: PKCE, và các loại token (access, ID, refresh).",
    "Chặng 3: kiểm tra JWT đúng cách, và refresh token rotation.",
  ],
  sections: [
    {
      id: "flow",
      title: "OAuth2 làm gì, và Authorization Code flow",
      intro: [
        "OAuth2 có 4 vai: **resource owner** (người dùng), **client** (ứng dụng muốn truy cập), **authorization server** (cấp token), **resource server** (API giữ dữ liệu).",
        "Luồng chuẩn **Authorization Code**: người dùng đăng nhập ở authorization server, client nhận một **code** ngắn hạn, rồi đổi code lấy token. Mật khẩu không bao giờ đến tay client.",
      ],
      widgetTitle: "Cho ứng dụng đọc danh bạ của bạn",
      compare: [
        way(
          "Đưa mật khẩu cho ứng dụng",
          `// ứng dụng bên thứ ba xin tài khoản và mật khẩu của bạn
login(username, password)   // rồi tự đăng nhập thay bạn`,
          [
            ask("Ứng dụng bị lộ dữ liệu", bad("Mật khẩu của bạn nằm trong tay ứng dụng, lộ là mất cả tài khoản.")),
            ask("Muốn thu hồi quyền", bad("Chỉ còn cách đổi mật khẩu, làm hỏng mọi ứng dụng khác đang dùng.")),
          ],
          "Ứng dụng có quyền toàn phần và không thu hồi riêng được.",
        ),
        way(
          "Authorization Code flow",
          `1. client chuyển người dùng tới authorization server (kèm scope, state)
2. người dùng đăng nhập và đồng ý ở đó
3. authorization server trả về code ngắn hạn
4. client đổi code lấy access token (kèm client authentication hoặc PKCE)`,
          [
            ask("Ứng dụng bị lộ dữ liệu", ok("Client chỉ có access token giới hạn theo **scope** và hết hạn, không có mật khẩu.")),
            ask("Muốn thu hồi quyền", ok("Thu hồi token của đúng ứng dụng đó, các ứng dụng khác không ảnh hưởng.")),
          ],
          "Quyền được cấp theo phạm vi và thu hồi riêng từng ứng dụng.",
        ),
      ],
      after: [
        "Tham số **`state`** là giá trị ngẫu nhiên client gửi đi rồi kiểm tra khi nhận lại, để chống CSRF vào bước chuyển hướng. **`redirect_uri`** phải khớp chính xác danh sách đã đăng ký.",
      ],
      trap: {
        title: "Dùng implicit flow hay password grant",
        text: "Hai luồng cũ này đã bị khuyến cáo bỏ. Hãy dùng **Authorization Code kèm PKCE** cho ứng dụng có người dùng, và **Client Credentials** cho dịch vụ gọi dịch vụ.",
      },
      quiz: {
        question: "Vì sao Authorization Code flow an toàn hơn đưa mật khẩu cho ứng dụng?",
        options: [
          "Client chỉ nhận token giới hạn quyền và thu hồi được, không bao giờ thấy mật khẩu",
          "Vì code dài hơn mật khẩu",
          "Vì dùng HTTPS",
          "Vì không cần authorization server",
        ],
        answer: 0,
        explain: "Mật khẩu chỉ nhập ở authorization server. Client giữ token có phạm vi và thời hạn.",
      },
    },
    {
      id: "pkce",
      title: "PKCE: chống chặn authorization code",
      intro: [
        "Ứng dụng mobile và SPA là **public client**: không giữ được bí mật. Kẻ tấn công chặn được `code` có thể đổi lấy token. **PKCE** buộc người đổi code phải chứng minh chính là người đã xin code.",
        "Client sinh `code_verifier` ngẫu nhiên, gửi `code_challenge = BASE64URL(SHA256(verifier))` lúc xin code, rồi gửi `code_verifier` thật lúc đổi token.",
      ],
      widgetTitle: "Kẻ tấn công có được code",
      compare: [
        way(
          "Không PKCE (public client)",
          `# đổi code lấy token chỉ cần code
POST /token  code=abc&client_id=app`,
          [
            ask("Kẻ tấn công chặn được code", bad("Chỉ cần `code` và `client_id` (công khai) là đổi được token. Public client không có secret để chặn.")),
          ],
          "Code bị lộ là token bị lộ.",
        ),
        way(
          "PKCE (S256)",
          `verifier  = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
challenge = BASE64URL(SHA256(verifier))      // gửi lúc xin code
POST /token  code=abc&code_verifier=<verifier>   // server so lại`,
          [
            ask("Kiểm tra cách tính", ok("Đã chạy: `S256` của ví dụ trong RFC 7636 ra `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`, khớp RFC.")),
            ask("Kẻ tấn công chặn được code", ok("Đã chạy: verifier đoán bừa cho ra challenge **không khớp**. Không có `code_verifier` thật thì đổi token bị từ chối.")),
          ],
          "Chỉ client đã sinh `code_verifier` mới đổi được code.",
        ),
      ],
      after: [
        "Nay PKCE được khuyến nghị cho **mọi** client dùng Authorization Code, kể cả server-side. Spring Security `oauth2Login()` bật sẵn cho public client.",
      ],
      trap: {
        title: "Dùng phương thức plain",
        text: "PKCE có hai phương thức: `plain` (gửi verifier thẳng) và `S256`. Hãy dùng **`S256`**: với `plain`, kẻ chặn được yêu cầu đầu tiên biết luôn verifier.",
      },
      quiz: {
        question: "PKCE ngăn điều gì?",
        options: [
          "Kẻ chặn được authorization code đổi nó lấy token",
          "Mật khẩu bị lộ",
          "Token hết hạn",
          "Tấn công DDoS",
        ],
        answer: 0,
        explain: "Đổi code cần `code_verifier` mà chỉ client gốc biết, nên code bị chặn trở nên vô dụng.",
      },
    },
    {
      id: "tokens",
      title: "Access token, ID token, refresh token",
      intro: [
        "Ba loại token hay bị lẫn. Bấm từng dòng để xem câu nên nói khi phỏng vấn.",
      ],
      widgetTitle: "Ba token và scope",
      cheat: [
        { name: "Access token", one: "Gửi cho API để chứng minh được phép truy cập.", say: "Access token dành cho resource server. Nó ngắn hạn, mang scope, và client không nên đọc nội dung nó. API kiểm tra chữ ký, hạn, iss, aud rồi dùng scope để phân quyền." },
        { name: "ID token", one: "Cho client biết người dùng là ai (OIDC).", say: "ID token là JWT của OIDC chứa danh tính như sub, email, thời điểm đăng nhập, dành cho client. Không gửi nó cho API làm bằng chứng truy cập, vì audience của nó là client." },
        { name: "Refresh token", one: "Đổi lấy access token mới khi hết hạn.", say: "Refresh token dài hạn, chỉ gửi tới authorization server. Vì nhạy cảm nên em dùng rotation: mỗi lần dùng cấp token mới và phát hiện dùng lại token cũ." },
        { name: "Scope", one: "Phạm vi quyền được cấp.", say: "Scope giới hạn client được làm gì, ví dụ read:contacts. Người dùng đồng ý theo scope, và API kiểm tra scope trước khi trả dữ liệu." },
        { name: "Client Credentials", one: "Dịch vụ gọi dịch vụ, không có người dùng.", say: "Khi một job hay service gọi API mà không có người dùng, em dùng Client Credentials: client xác thực bằng secret để lấy access token cho chính nó." },
      ],
      quiz: {
        question: "Client cần biết email và tên người vừa đăng nhập. Dùng token nào?",
        options: ["ID token", "Access token gửi cho API", "Refresh token", "Authorization code"],
        answer: 0,
        explain: "ID token (OIDC) chứa danh tính cho client. Access token dành cho API, không dành cho client đọc danh tính.",
      },
    },
    {
      id: "jwt-validate",
      title: "Kiểm tra JWT: đừng tin payload",
      intro: [
        "JWT gồm `header.payload.signature`, payload chỉ được **mã hoá base64**, ai cũng đọc và sửa được. Tính tin cậy đến từ **chữ ký**. Khi nhận JWT phải kiểm tra: chữ ký, thuật toán, hạn (`exp`), nơi phát hành (`iss`) và đối tượng (`aud`).",
      ],
      widgetTitle: "5 JWT, 5 kết quả",
      compare: [
        way(
          "Giải mã payload rồi tin luôn",
          `String payload = base64Decode(parts[1]);
if (payload.role.equals("ADMIN")) allow();      // không kiểm tra chữ ký`,
          [
            ask("Kẻ tấn công đổi role thành ADMIN, giữ nguyên chữ ký", bad("Hệ thống tin payload đã bị sửa, kẻ tấn công thành ADMIN.")),
            ask("Token alg none, không có chữ ký", bad("Nếu thư viện chấp nhận `alg: none` thì token không ký vẫn qua.")),
          ],
          "Payload không có gì bảo vệ, tin nó là mở cửa cho giả mạo.",
        ),
        way(
          "Kiểm tra đủ",
          `parts = jwt.split(".");
if (!header.alg.equals("HS256")) reject;          // chỉ chấp nhận thuật toán định trước
if (!MessageDigest.isEqual(hmac(parts[0]+"."+parts[1]), signature)) reject;   // so sánh hằng thời gian
if (payload.exp < now) reject;`,
          [
            ask("Token hợp lệ", ok("Đã chạy: `ok: {\"sub\":\"an\",\"role\":\"USER\",...}`.")),
            ask("Đổi role thành ADMIN, giữ chữ ký", ok("Đã chạy: `rejected: bad signature`.")),
            ask("alg none, hết hạn, sai khoá", ok("Đã chạy: `alg none` bị `rejected: alg not allowed (none)`, quá hạn bị `rejected: expired`, đổi khoá bị `rejected: bad signature`.")),
          ],
          "Chữ ký, thuật toán và hạn đều được kiểm tra trước khi tin.",
        ),
      ],
      after: [
        "Trong thực tế dùng thư viện (Spring Security Resource Server, Nimbus) cấu hình `iss`, `aud`, và khoá công khai (JWK Set). Nhưng hãy hiểu rõ thư viện đang kiểm tra những gì.",
      ],
      trap: {
        title: "Để token tự chọn thuật toán",
        text: "Cho phép header quyết định `alg` dẫn tới tấn công nhầm thuật toán (ví dụ nhận `HS256` dùng khoá công khai RS256 làm bí mật) và `alg: none`. Luôn **cố định** thuật toán được chấp nhận ở phía server.",
      },
      quiz: {
        question: "Vì sao không được tin payload của JWT chưa kiểm tra chữ ký?",
        options: [
          "Vì payload chỉ mã hoá base64, ai cũng sửa được",
          "Vì payload quá dài",
          "Vì payload được mã hoá mạnh",
          "Vì payload luôn rỗng",
        ],
        answer: 0,
        explain: "Đã chạy: đổi role thành ADMIN mà giữ chữ ký cũ thì bị `bad signature`. Không kiểm tra thì kẻ tấn công tự phong ADMIN.",
      },
    },
    {
      id: "rotation",
      title: "Refresh token rotation và phát hiện dùng lại",
      intro: [
        "Refresh token sống lâu nên bị đánh cắp là nguy hiểm. **Rotation**: mỗi lần dùng refresh token, server cấp token mới và **vô hiệu token cũ**. Nếu token cũ xuất hiện lại, nghĩa là có người đã chép nó, nên server thu hồi cả nhóm token.",
      ],
      widgetTitle: "Kẻ tấn công chép được refresh token R1",
      compare: [
        way(
          "Refresh token dùng đi dùng lại",
          `POST /refresh  token=R1   # luôn trả access token mới, R1 vẫn còn hiệu lực`,
          [
            ask("Kẻ tấn công chép được R1", bad("Dùng R1 được mãi mãi, và người dùng thật không hề biết.")),
          ],
          "Token bị đánh cắp dùng được cho tới khi hết hạn.",
        ),
        way(
          "Rotation và phát hiện dùng lại",
          `refresh(R1) -> R2, R1 đánh dấu đã dùng
refresh(R1) lần nữa -> REUSE DETECTED, thu hồi cả nhóm`,
          [
            ask("Người dùng thật refresh R1", ok("Đã chạy: `new token R2`.")),
            ask("Kẻ tấn công dùng lại R1", ok("Đã chạy: `REUSE DETECTED: family revoked`. Cả nhóm bị thu hồi.")),
            ask("Người dùng thật dùng R2 sau đó", bad("Đã chạy: `invalid`. Người dùng phải đăng nhập lại, đây là cái giá chấp nhận được để chặn kẻ đánh cắp.")),
          ],
          "Đánh cắp bị phát hiện ngay lần dùng lại, đổi lại là người dùng thật phải đăng nhập lại.",
        ),
      ],
      after: [
        "Kết hợp: access token ngắn (khoảng 15 phút), refresh token xoay vòng, và lưu refresh token trong cookie `HttpOnly` thay vì `localStorage` để JavaScript không đọc được.",
      ],
      trap: {
        title: "Xoay vòng nhưng không phát hiện dùng lại",
        text: "Chỉ cấp token mới mà không nhớ token cũ đã dùng thì kẻ tấn công vẫn dùng được token cũ. Phải lưu trạng thái (đã dùng hay chưa) theo nhóm token.",
      },
      quiz: {
        question: "Refresh token R1 đã được đổi lấy R2. Có người gửi lại R1. Server nên làm gì?",
        options: [
          "Thu hồi cả nhóm token vì R1 bị dùng lại, có thể đã bị đánh cắp",
          "Cấp R3 cho người đó",
          "Bỏ qua",
          "Xoá tài khoản",
        ],
        answer: 0,
        explain: "R1 đã dùng rồi mà vẫn xuất hiện nghĩa là có bản sao. Thu hồi cả nhóm buộc cả hai bên phải xác thực lại.",
      },
    },
    {
      id: "chon-luong",
      title: "Bài tập: dùng luồng và token nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn đáp án phù hợp."],
      widgetTitle: "Chọn luồng và token",
      drill: {
        choices: ["Authorization Code + PKCE", "Client Credentials", "Access token", "ID token", "Refresh token"],
        summary: "Hỏi: có người dùng không, ai là người nhận token, và token sống bao lâu.",
        items: [
          { q: "Ứng dụng mobile cho người dùng đăng nhập bằng Google.", a: "Authorization Code + PKCE", why: "Có người dùng, client công khai không giữ được bí mật." },
          { q: "Job chạy đêm gọi API nội bộ, không có người dùng.", a: "Client Credentials", why: "Dịch vụ xác thực bằng secret để lấy token cho chính nó." },
          { q: "Gửi kèm mỗi request tới resource server để chứng minh được phép truy cập.", a: "Access token", why: "Ngắn hạn, mang scope." },
          { q: "Client cần biết người vừa đăng nhập là ai (sub, email).", a: "ID token", why: "OIDC cung cấp danh tính cho client." },
          { q: "Access token vừa hết hạn, muốn lấy cái mới mà không bắt đăng nhập lại.", a: "Refresh token", why: "Dài hạn, chỉ gửi tới authorization server." },
        ],
      },
    },
  ],
  cards: [
    { q: "OAuth2 và OIDC khác nhau thế nào?", a: "OAuth2 ủy quyền truy cập (access token). OIDC xây trên OAuth2, thêm xác thực: ID token cho biết người dùng là ai." },
    { q: "Authorization Code flow gồm những bước nào?", a: "Client chuyển người dùng tới authorization server, người dùng đăng nhập và đồng ý, client nhận code ngắn hạn, đổi code lấy token. Dùng state chống CSRF và redirect_uri khớp chính xác." },
    { q: "PKCE hoạt động thế nào?", a: "Client sinh code_verifier, gửi challenge = BASE64URL(SHA256(verifier)) lúc xin code, rồi gửi verifier lúc đổi token. Kẻ chặn code không có verifier nên không đổi được. Dùng S256, không dùng plain." },
    { q: "Access token và ID token khác nhau thế nào?", a: "Access token cho API, ngắn hạn, mang scope. ID token cho client biết danh tính người dùng. Không dùng ID token để gọi API." },
    { q: "Cần kiểm tra gì khi nhận JWT?", a: "Chữ ký (so hằng thời gian), thuật toán cố định phía server (loại alg none), exp, iss, aud. Payload chỉ base64 nên không tin khi chưa kiểm tra chữ ký." },
    { q: "Refresh token rotation là gì?", a: "Mỗi lần dùng cấp token mới và vô hiệu token cũ. Token cũ bị dùng lại thì thu hồi cả nhóm. Người dùng thật phải đăng nhập lại, đó là cái giá để chặn kẻ đánh cắp." },
  ],
  modelAnswer:
    "OAuth2 ủy quyền truy cập bằng access token có scope, OIDC thêm ID token để biết người dùng là ai. Em dùng Authorization Code kèm PKCE S256 cho ứng dụng có người dùng, nên kẻ chặn được code không đổi được token, và Client Credentials cho dịch vụ gọi dịch vụ. Khi nhận JWT em kiểm tra chữ ký, thuật toán cố định, exp, iss, aud, không tin payload chưa kiểm tra. Refresh token em xoay vòng và phát hiện dùng lại để thu hồi cả nhóm, lưu trong cookie HttpOnly, còn access token sống ngắn.",
};
