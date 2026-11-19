import timeline from "../timelines/security.json";
import type { Lesson, Scene } from "../types";

// Outputs from a Spring Boot 3.5 project (Spring Security 6, oauth2-resource-server, HS256 tokens signed in tests) on JDK 21;
// see study note 03.09. RS256 is described, not run.
export const security: Lesson = {
  slug: "security",
  crumb: "Spring Security & JWT",
  videoDir: "/videos/spring-security-jwt",
  // Per-scene clips cut by `video-kit/pipeline.py security-video publish`, which also rewrites videoVersion.
  videoVersion: "277656fd",
  scenes: timeline as Scene[],
  title: "Spring Security & JWT",
  subtitle:
    "Filter chain, authentication và authorization, cấu hình SecurityFilterChain, cấu trúc JWT, HS256 với RS256, access và refresh token, BCrypt, CORS với CSRF, @PreAuthorize và OWASP cơ bản.",
  openingQuiz: {
    question: "Ai có JWT trong tay thì đọc được gì?",
    options: [
      "Không đọc được gì vì JWT được mã hoá",
      "Đọc được toàn bộ header và payload bằng base64url decode, nhưng không sửa được mà không bị phát hiện",
      "Chỉ đọc được header",
      "Đọc và sửa được tuỳ ý",
    ],
    answer: 1,
    explain: "Encode không phải encrypt. Đã thử đổi USER thành ADMIN và giữ chữ ký cũ: 401 Invalid signature.",
  },
  roadmap: [
    "Chặng 1: filter chain, 401 với 403, cấu hình SecurityFilterChain.",
    "Chặng 2: JWT, HS256 với RS256, access và refresh token, BCrypt.",
    "Chặng 3: CORS với CSRF, @PreAuthorize, OWASP cơ bản.",
  ],
  sections: [
    {
      id: "filter-chain",
      title: "Phần 1: Filter chain",
      scene: "chain",
      intro: [
        "Spring Security là chuỗi **Servlet Filter** đứng trước `DispatcherServlet`: `DelegatingFilterProxy` (filter của container, lazy tìm bean) chuyển cho `FilterChainProxy`, rồi tới `SecurityFilterChain` khớp URL. Project demo in ra 14 filter, trong đó `CorsFilter`, `BearerTokenAuthenticationFilter` (verify JWT, đặt Authentication), `ExceptionTranslationFilter` và `AuthorizationFilter`.",
        "`ExceptionTranslationFilter` đứng **trước** `AuthorizationFilter` và bọc nó trong try/catch: gặp `AccessDeniedException` thì trả 401 nếu đang anonymous, 403 nếu đã đăng nhập. Exception trong filter không đi qua `@RestControllerAdvice`: muốn body ProblemDetail thì cấu hình `AuthenticationEntryPoint` và `AccessDeniedHandler`. `SecurityContextHolder` lưu trong ThreadLocal nên `@Async` không tự có user.",
      ],
      quiz: {
        question: "Vì sao cần DelegatingFilterProxy?",
        options: [
          "Để chạy nhanh hơn",
          "Container khởi tạo filter độc lập với Spring context; proxy lazy tìm bean springSecurityFilterChain nên logic security là Spring bean, dùng được DI",
          "Để thay DispatcherServlet",
          "Để bật CSRF",
        ],
        answer: 1,
        explain: "Một app có thể có nhiều SecurityFilterChain, chọn bằng securityMatcher và @Order.",
      },
    },
    {
      id: "authn-authz",
      title: "Phần 2: Authentication, authorization và cấu hình",
      scene: "config",
      intro: [
        "**Authentication**: bạn là ai (password, chữ ký token), thất bại ra **401**. **Authorization**: bạn được làm gì (role, permission), thất bại ra **403**. Login bằng password: `AuthenticationManager` → `DaoAuthenticationProvider` → `UserDetailsService` + `PasswordEncoder`.",
        "Spring Security 6 đã xoá `WebSecurityConfigurerAdapter`: khai báo bean `SecurityFilterChain` với lambda DSL, `csrf.disable()` cho API Bearer, `STATELESS`, `requestMatchers` theo thứ tự (rule đầu khớp thắng, `anyRequest()` ở cuối), `oauth2ResourceServer().jwt()`. Bẫy: `hasRole(\"ADMIN\")` kiểm tra authority `ROLE_ADMIN`, còn resource server mặc định đọc claim `scope` với tiền tố `SCOPE_`; token có `\"roles\": [\"ADMIN\"]` phải cấu hình `JwtGrantedAuthoritiesConverter` đọc claim `roles`, prefix `ROLE_`, không thì luôn 403.",
      ],
      quiz: {
        question: "Token có claim \"roles\": [\"ADMIN\"], không cấu hình converter, gọi API có hasRole(\"ADMIN\"). Kết quả?",
        options: ["200", "403 vì authority chỉ có SCOPE_..., không có ROLE_ADMIN", "401", "500"],
        answer: 1,
        explain: "Cấu hình JwtGrantedAuthoritiesConverter: setAuthoritiesClaimName(\"roles\"), setAuthorityPrefix(\"ROLE_\").",
      },
    },
    {
      id: "jwt",
      title: "Phần 3: JWT: cấu trúc và luồng",
      scene: "jwt",
      intro: [
        "JWT = `header.payload.signature`, mỗi phần base64url. Đã decode không cần key: `{\"alg\":\"HS256\"}` và `{\"sub\":\"alice\",\"exp\":1794572543,\"iat\":1794571043,\"roles\":[\"USER\"]}`. Chữ ký tính trên `header.payload` nên sửa payload là bị phát hiện. Server không lưu session: mỗi request tự mang đủ thông tin, hợp scale ngang và microservices.",
        "Bẫy: đặt email, số điện thoại vào payload; token quá to; tin `alg` do token tự khai (decoder của Spring cố định thuật toán); secret HS256 ngắn bị brute-force offline. Đổi role của user thì token cũ vẫn mang role cũ tới khi hết hạn: access token ngắn, thu hồi bằng blacklist `jti` hoặc token version.",
      ],
      widget: "jwt-lab",
      widgetTitle: "Gửi token khác nhau",
      quiz: {
        question: "Muốn ẩn nội dung payload thì sao?",
        options: ["Đổi sang HS512", "Dùng JWE, nhưng tốt hơn là đừng đặt dữ liệu nhạy cảm vào token và luôn dùng HTTPS", "Nén payload", "Không thể"],
        answer: 1,
        explain: "Chỉ để sub, role cơ bản, exp, jti; thông tin khác tra ở server.",
      },
    },
    {
      id: "tokens",
      title: "Phần 4: HS256 với RS256, access và refresh token",
      scene: "tokens",
      intro: [
        "**HS256** đối xứng: service nào verify được cũng ký được token giả; hợp monolith. **RS256/ES256** bất đối xứng: auth server ký bằng private key, service verify bằng public key tải qua `jwk-set-uri` (JWKS), xoay key theo `kid`; hợp microservices, Keycloak, Auth0.",
        "Access token 5–15 phút, gửi mọi request, không lưu ở server. Refresh token dài ngày, chỉ gửi khi refresh, **lưu ở server** để thu hồi, kèm **rotation**: refresh token đã dùng mà bị gửi lại là dấu hiệu bị đánh cắp, thu hồi cả phiên. Lưu ở client: `localStorage` bị XSS đọc được; cookie `HttpOnly` thì cần chống CSRF; SPA hay giữ access token trong memory và refresh token trong cookie HttpOnly.",
      ],
      quiz: {
        question: "Logout với JWT làm thế nào?",
        options: [
          "Không cần làm gì",
          "Client xoá token, server thu hồi refresh token; cần cắt ngay thì đưa jti vào blacklist Redis với TTL bằng thời gian còn lại",
          "Đổi secret mỗi lần logout",
          "Gọi DELETE /token",
        ],
        answer: 1,
        explain: "Access token còn sống tới khi hết hạn nếu không có blacklist.",
      },
    },
    {
      id: "bcrypt",
      title: "Phần 5: Lưu mật khẩu: BCrypt",
      scene: "bcrypt",
      intro: [
        "Mật khẩu phải hash một chiều, nhưng SHA-256 quá nhanh: đã đo 100.000 hash mất 165,7 ms. BCrypt có **salt** ngẫu nhiên (cùng mật khẩu ra hash khác) và **cost** chậm có chủ đích: strength 10 khoảng 88 ms, 12 khoảng 386 ms, 14 khoảng 1,5 giây: mỗi bậc chậm gấp đôi.",
        "Salt nằm ngay trong chuỗi `$2a$10$...` nên dùng `matches`, đừng `encode(raw).equals(hash)` (luôn false). BCrypt chỉ dùng 72 byte đầu: Spring Security 6.5 ném lỗi khi encode mật khẩu 73 byte, nhưng `matches(72 ký tự + \"x\", hash)` vẫn true; giới hạn độ dài ở tầng validate. Đổi thuật toán sau này bằng `DelegatingPasswordEncoder` (`{bcrypt}`, `{argon2}`).",
      ],
      widget: "bcrypt-cost",
      widgetTitle: "Đổi strength",
      quiz: {
        question: "Đặt BCrypt strength thật cao (16) cho an toàn có ổn không?",
        options: ["Càng cao càng tốt", "Login chậm và dễ bị DoS vì mỗi request login đốt CPU; nhắm khoảng 100–500 ms, đo rồi chọn", "Không ảnh hưởng", "BCrypt không cho đặt"],
        answer: 1,
        explain: "Mỗi lần tăng 1 thì chậm gấp đôi.",
      },
    },
    {
      id: "cors-csrf",
      title: "Phần 6: CORS và CSRF",
      scene: "cors",
      intro: [
        "**CORS** là cơ chế browser **cho phép** JS ở origin A đọc response từ origin B, dựa vào header server trả. **CSRF** là **tấn công** lợi dụng browser tự gửi cookie. Bearer token không bị CSRF vì browser không tự gửi; token trong cookie thì CSRF quay lại.",
        "Request có header `Authorization` khiến browser gửi preflight `OPTIONS`. Đã quan sát: preflight từ origin được phép ra 200 dù không có token, vì `CorsFilter` đứng trước filter xác thực; origin lạ ra 403 `Invalid CORS request`. Quên `.cors()` trong Security thì preflight chết 401 và `@CrossOrigin` ở controller vô dụng. `allowedOrigins(\"*\")` cùng `allowCredentials(true)` bị spec cấm.",
      ],
      widget: "cors-preflight",
      widgetTitle: "Preflight theo origin",
      quiz: {
        question: "CORS có chặn được kẻ tấn công gọi API bằng curl không?",
        options: ["Có", "Không: request không có Origin thì CORS không áp dụng; CORS chỉ bảo vệ người dùng trong browser", "Chỉ khi bật CSRF", "Chỉ với HTTPS"],
        answer: 1,
        explain: "Bảo vệ API là việc của authentication và authorization.",
      },
    },
    {
      id: "method-security",
      title: "Phần 7: @PreAuthorize và OWASP cơ bản",
      scene: "owasp",
      intro: [
        "`@PreAuthorize(\"hasRole('ADMIN')\")` kiểm tra quyền ngay tại method, cần `@EnableMethodSecurity` (quên thì annotation im lặng không tác dụng). Đã chạy: token USER gọi `DELETE /api/orders/1` ra 403, ADMIN ra 200. Chạy bằng AOP proxy nên dính self-invocation như `@Transactional`.",
        "SQL injection: luôn bind tham số (JPQL `:param`, derived query, JdbcTemplate `?`), không nối chuỗi kể cả native query, whitelist cột sort. OWASP hay hỏi: **Broken Access Control** (đổi `/orders/42` thành 43 xem được đơn người khác: query theo cả id và owner), lưu mật khẩu MD5, actuator `/env` public, thư viện có CVE, log token hay mật khẩu.",
      ],
      quiz: {
        question: "User chỉ được xem đơn của mình. Cách chắc nhất?",
        options: ["Ẩn nút trên UI", "Query theo cả id và ownerId lấy từ authentication, không có thì 404", "Kiểm tra đã đăng nhập là đủ", "Mã hoá id trên URL"],
        answer: 1,
        explain: "Đây là IDOR, thuộc Broken Access Control đứng đầu OWASP Top 10.",
      },
    },
  ],
  modelAnswer:
    "Spring Security là chuỗi filter đứng trước DispatcherServlet; với JWT, BearerTokenAuthenticationFilter verify chữ ký và exp rồi đặt Authentication, AuthorizationFilter kiểm tra quyền, ExceptionTranslationFilter biến lỗi thành 401 khi chưa xác thực hoặc 403 khi thiếu quyền. Em cấu hình bằng bean SecurityFilterChain, stateless, tắt CSRF cho API Bearer, và nhớ cấu hình converter để claim roles thành ROLE_. JWT chỉ được ký chứ không mã hoá: em đã decode payload không cần key, và sửa USER thành ADMIN thì bị 401 invalid signature, nên em không đặt dữ liệu nhạy cảm vào token. Microservices em dùng RS256 với JWKS; access token ngắn, refresh token lưu ở server có rotation để thu hồi được. Mật khẩu em hash bằng BCrypt và so bằng matches; em đo strength 10 mất khoảng 110 ms mỗi hash. CORS là browser cho phép đọc response khác origin, CSRF là tấn công dựa vào cookie; cuối cùng em kiểm tra quyền sở hữu ở server và luôn bind tham số SQL.",
};
