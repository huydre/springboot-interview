import timeline from "../timelines/security.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs from a Spring Boot 3.5 project (Spring Security 6, oauth2-resource-server, HS256 tokens signed in tests) on JDK 21;
// see study note 03.09. RS256 is described, not run.
export const security: Lesson = {
  slug: "security",
  crumb: "Spring Security & JWT",
  videoDir: "/videos/spring-security-jwt",
  // Per-scene clips cut by `video-kit/pipeline.py security-video publish`, which also rewrites videoVersion.
  videoVersion: "1fa80eb0",
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
    "Chặng 1: filter chain, filter tự viết, 401 với 403, cấu hình SecurityFilterChain, session hay JWT.",
    "Chặng 2: JWT, HS256 với RS256, access và refresh token, BCrypt.",
    "Chặng 3: CORS với CSRF, chống CSRF khi dùng cookie, @PreAuthorize, OWASP cơ bản.",
  ],
  sections: [
    {
      id: "filter-chain",
      title: "Phần 1: Filter chain",
      scene: "chain",
      intro: [
        "Mọi request tới controller đều phải đi qua Spring Security trước. Giống cửa an ninh sân bay: phải qua lần lượt từng chốt rồi mới tới cửa lên máy bay.",
        "Spring Security là chuỗi **Servlet Filter** đứng trước `DispatcherServlet`, đi qua 3 lớp:",
        "- **`DelegatingFilterProxy`**: filter của container, lazy tìm bean.",
        "- **`FilterChainProxy`**: nhận việc từ proxy và chuyển tiếp.",
        "- **`SecurityFilterChain`**: chain khớp URL, chứa các filter thật.",
        "Project demo in ra 14 filter, trong đó có:",
        "- **`CorsFilter`**: xử lý CORS (Phần 6).",
        "- **`BearerTokenAuthenticationFilter`**: verify JWT, đặt Authentication.",
        "- **`ExceptionTranslationFilter`**: quyết định mã lỗi 401 hay 403.",
        "- **`AuthorizationFilter`**: kiểm tra quyền.",
        "`ExceptionTranslationFilter` đứng **trước** `AuthorizationFilter` và bọc nó trong try/catch. Khi `AuthorizationFilter` ném `AccessDeniedException`, nó quyết định mã lỗi: trả 401 nếu request đang anonymous (chưa đăng nhập), 403 nếu đã đăng nhập mà thiếu quyền.",
        "Exception ném trong filter không đi qua `@RestControllerAdvice`, vì advice chỉ bắt lỗi bên trong `DispatcherServlet`, mà filter chạy trước nó. Muốn body ProblemDetail cho 401 và 403 thì cấu hình `AuthenticationEntryPoint` (cho 401) và `AccessDeniedHandler` (cho 403).",
      ],
      board: {
        title: "Request đi qua Spring Security thế nào",
        highlight: "Spring Security",
        chips: ["Filter chạy trước DispatcherServlet", "Exception trong filter không tới @RestControllerAdvice"],
        cards: [
          {
            title: "Chuỗi filter",
            diagram: {
              kind: "flow",
              steps: ["Request", "CorsFilter", "Bearer: verify JWT", "AuthorizationFilter"],
              ok: ["Đủ quyền", "Tới controller"],
              bad: ["Thiếu quyền", "AccessDeniedException"],
            },
            notes: ["`BearerTokenAuthenticationFilter` verify JWT và đặt `Authentication`.", "`ExceptionTranslationFilter` đứng trước `AuthorizationFilter` và bọc nó trong try/catch."],
            takeaway: "Mọi request phải qua từng chốt trước khi tới controller",
          },
          {
            title: "401 hay 403",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["AuthorizationFilter ném lỗi", "ExceptionTranslationFilter bắt"],
              ok: ["Đã đăng nhập, thiếu quyền", "403"],
              bad: ["Anonymous", "401"],
            },
            notes: ["Cùng một `AccessDeniedException`, mã lỗi tuỳ request đã đăng nhập hay chưa."],
            takeaway: "401 là chưa biết bạn là ai, 403 là biết rồi nhưng không đủ quyền",
          },
          {
            title: "Body lỗi của filter",
            diagram: {
              kind: "pipe",
              from: "Lỗi trong filter",
              via: "AuthenticationEntryPoint",
              to: "Body ProblemDetail",
              skipped: ["@RestControllerAdvice"],
              skippedLabel: "Không bắt được",
            },
            notes: ["Advice chỉ bắt lỗi bên trong `DispatcherServlet`, mà filter chạy trước nó.", "Body cho 403 thì cấu hình `AccessDeniedHandler`."],
            takeaway: "Muốn body lỗi cho 401 và 403 thì cấu hình đúng hai handler của filter",
          },
        ],
        conclusion: "**Kết luận:** security nằm trong chuỗi filter trước controller, nên lỗi của nó cũng phải xử lý ở tầng filter.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Filter chạy trước `DispatcherServlet` → `@RestControllerAdvice` không bắt được lỗi 401 và 403 → dùng `AuthenticationEntryPoint` và `AccessDeniedHandler`."],
      },
      trap: {
        title: "@Async không tự có user",
        text: "`SecurityContextHolder` lưu user trong ThreadLocal, tức gắn với thread đang chạy request. Method `@Async` chạy ở thread khác nên không thấy user đó.",
      },
      quiz: {
        question: "Vì sao cần DelegatingFilterProxy?",
        options: [
          "Để chạy nhanh hơn",
          "Container khởi tạo filter độc lập với Spring context; proxy lazy tìm bean springSecurityFilterChain nên logic security là Spring bean, dùng được DI",
          "Để thay DispatcherServlet",
          "Để bật CSRF",
        ],
        answer: 1,
        explain: "Servlet container tạo filter trước khi Spring tạo xong bean. DelegatingFilterProxy là filter của container, tới lúc có request mới tìm bean springSecurityFilterChain và chuyển việc cho nó.",
      },
      parts: [
        {
          id: "custom-filter",
          title: "Tự viết một filter: OncePerRequestFilter",
          intro: [
            "Chain có sẵn 14 filter. Đôi khi cần thêm một filter của mình, ví dụ đối tác gọi API bằng header `X-API-Key` thay vì JWT.",
            "Khung chuẩn là kế thừa `OncePerRequestFilter`: Spring bảo đảm nó chạy **một lần cho mỗi request**, kể cả khi request bị forward hay chuyển sang trang lỗi. Việc của filter xác thực chỉ có ba bước:",
            "- **Đọc thông tin đăng nhập** từ request (header, cookie).",
            "- **Hợp lệ thì đặt `Authentication`** vào `SecurityContextHolder`.",
            "- **Luôn gọi `chain.doFilter(...)`**: thiếu header thì không tự trả 401, cứ để request đi tiếp; `AuthorizationFilter` thấy anonymous sẽ từ chối, và `ExceptionTranslationFilter` trả 401 như mọi chỗ khác.",
            "Đăng ký vào chain bằng `http.addFilterBefore(new ApiKeyFilter(keys), UsernamePasswordAuthenticationFilter.class)`, tức chạy trước filter đăng nhập có sẵn.",
            "Với JWT thì khác: Spring đã có `oauth2ResourceServer`. So hai cách:",
          ],
          widgetTitle: "Xác thực JWT: tự viết filter hay dùng cái có sẵn",
          compare: [
            way(
              "Tự viết OncePerRequestFilter",
              `public class JwtFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                  FilterChain chain) throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      Claims c = jwtService.parse(h.substring(7));     // tự verify chữ ký, exp, alg
      var auth = new UsernamePasswordAuthenticationToken(
          c.getSubject(), null, toAuthorities(c));     // 3 tham số = đã xác thực
      SecurityContextHolder.getContext().setAuthentication(auth);
    }
    chain.doFilter(req, res);                          // luôn đi tiếp
  }
}`,
              [
                ask("Verify chữ ký, `exp`, chặn `alg: none`", bad("Tự làm hết. Quên một bước là lỗ hổng.")),
                ask("Token sai thì trả gì", bad("Tự quyết: ném exception trong filter không tới được `@RestControllerAdvice`, phải tự ghi 401 hoặc để chain xử lý.")),
                ask("Header kiểu riêng, như `X-API-Key`", ok("Đây mới là chỗ nên tự viết filter.")),
              ],
              "Hợp với cơ chế xác thực riêng, không hợp để tự làm lại JWT.",
            ),
            way(
              "oauth2ResourceServer có sẵn",
              `http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));

# application.yml
spring.security.oauth2.resourceserver.jwt.jwk-set-uri: https://auth.shop.vn/jwks`,
              [
                ask("Verify chữ ký, `exp`, chặn `alg: none`", ok("`BearerTokenAuthenticationFilter` và `JwtDecoder` làm sẵn, thuật toán cố định theo cấu hình.")),
                ask("Token sai thì trả gì", ok("401 kèm header `WWW-Authenticate`, đi qua `AuthenticationEntryPoint`.")),
                ask("Đọc claim `roles` thành `ROLE_`", ok("Cấu hình `JwtGrantedAuthoritiesConverter` (Phần 2).")),
              ],
              "JWT chuẩn thì dùng cái có sẵn.",
            ),
          ],
          trap: {
            title: "Filter đánh `@Component` bị đăng ký hai chỗ",
            text: "Spring Boot tự đăng ký **mọi bean kiểu `Filter`** vào servlet container. Filter của bạn có `@Component` và cũng được `addFilterBefore` vào security chain, nên nó còn chạy thêm một lần ở ngoài chain, sai vị trí. Hoặc đừng đánh `@Component` (tạo bằng `new` như trên), hoặc khai báo `FilterRegistrationBean` cho nó với `setEnabled(false)`.",
          },
          takeaway: {
            lines: [
              "Filter xác thực: đọc thông tin, hợp lệ thì đặt `Authentication`, **luôn** gọi `chain.doFilter`. Để `AuthorizationFilter` quyết định 401 hay 403.",
            ],
          },
          quiz: {
            question: "Trong `JwtFilter` tự viết, request không có header `Authorization`. Filter nên làm gì?",
            options: [
              "Ghi 401 rồi return ngay",
              "Không đặt Authentication, gọi `chain.doFilter` để request đi tiếp; endpoint công khai vẫn chạy, endpoint cần đăng nhập sẽ bị chain trả 401",
              "Ném `RuntimeException` để `@RestControllerAdvice` bắt",
              "Đặt một Authentication rỗng có role USER",
            ],
            answer: 1,
            explain: "Filter chạy cho mọi URL, kể cả `/login` hay `/actuator/health`. Tự trả 401 là chặn luôn các endpoint công khai.",
          },
        },
      ],
    },
    {
      id: "authn-authz",
      title: "Phần 2: Authentication, authorization và cấu hình",
      scene: "config",
      intro: [
        "Filter chain trả lời hai câu hỏi khác nhau:",
        "- **Authentication**: bạn là ai (password, chữ ký token), thất bại ra **401**.",
        "- **Authorization**: bạn được làm gì (role, permission), thất bại ra **403**.",
        "Login bằng password: `AuthenticationManager` → `DaoAuthenticationProvider` → `UserDetailsService` + `PasswordEncoder`.",
        "Spring Security 6 đã xoá `WebSecurityConfigurerAdapter`. Giờ bạn khai báo một bean `SecurityFilterChain` bằng lambda DSL. Các dòng cấu hình hay gặp cho một REST API:",
        "- **`csrf.disable()`**: API dùng Bearer token thì không bị CSRF (lý do ở Phần 6).",
        "- **`sessionCreationPolicy(STATELESS)`**: server không tạo HTTP session; mỗi request tự mang token để xác thực.",
        "- **`requestMatchers(...)`** theo thứ tự: rule đầu tiên khớp thắng, nên rule cụ thể đặt trước, `anyRequest()` đặt cuối.",
        "- **`oauth2ResourceServer(o -> o.jwt(...))`**: bật `BearerTokenAuthenticationFilter`, đọc header `Authorization: Bearer <token>` và verify JWT.",
        "Quyền của user trong Spring Security là một danh sách **authority**: chuỗi như `ROLE_ADMIN` hay `SCOPE_read`. `hasRole('X')` thực chất tìm authority `ROLE_X`.",
      ],
      trap: {
        title: "Token có roles nhưng vẫn 403",
        text: "Xem trước Phần 3: payload của JWT là một JSON gồm các **claim** (cặp khoá và giá trị), ví dụ `\"sub\": \"alice\"`, `\"roles\": [\"ADMIN\"]`. Resource server mặc định chỉ đọc claim `scope` và đổi mỗi giá trị thành authority `SCOPE_...`; nó không biết claim `roles`. Vì vậy token có `\"roles\": [\"ADMIN\"]` không sinh ra `ROLE_ADMIN`, và `hasRole(\"ADMIN\")` luôn 403. Sửa: cấu hình `JwtGrantedAuthoritiesConverter` đọc claim `roles` với prefix `ROLE_`.",
      },
      quiz: {
        question: "Token có claim \"roles\": [\"ADMIN\"], không cấu hình converter, gọi API có hasRole(\"ADMIN\"). Kết quả?",
        options: ["200", "403 vì authority chỉ có SCOPE_..., không có ROLE_ADMIN", "401", "500"],
        answer: 1,
        explain: "Cấu hình JwtGrantedAuthoritiesConverter: setAuthoritiesClaimName(\"roles\"), setAuthorityPrefix(\"ROLE_\").",
      },
      parts: [
        {
          id: "session-vs-jwt",
          title: "Đăng nhập bằng session hay JWT",
          intro: [
            "Phần trên đặt `STATELESS` cho REST API. Nhưng trước JWT, web đăng nhập thế nào, và khi nào cách cũ vẫn tốt hơn?",
            "**Session** (stateful, server nhớ trạng thái):",
            "- **Đăng nhập**: server kiểm tra mật khẩu, tạo một session lưu user, trả `Set-Cookie: JSESSIONID=<id ngẫu nhiên>; HttpOnly; Secure; SameSite=Lax`.",
            "- **Mỗi request sau**: browser **tự gửi** cookie, server tra id đó ra user.",
            "- **Session lưu ở đâu**: mặc định trong RAM của từng instance. Chạy nhiều instance thì dùng **Spring Session** lưu vào Redis hoặc DB, để instance nào cũng tra được.",
            "**JWT** (stateless): token tự chứa user và quyền, server chỉ verify chữ ký, không tra gì.",
            "Đổi qua đổi lại:",
            "- **Thu hồi**: session xoá ở server là hết hiệu lực ngay; JWT còn sống tới khi hết hạn, trừ khi thêm blacklist.",
            "- **Mở rộng**: session cần kho chung (Redis); JWT thì instance nào cũng verify được bằng key.",
            "- **CSRF**: session đi bằng cookie nên phải chống CSRF; JWT gửi trong header `Authorization` thì không.",
            "- **Kích thước**: cookie session chỉ là một id ngắn; JWT mang theo claim nên to hơn.",
            "Chọn: web app một domain (render ở server, hoặc SPA đi qua backend của chính nó) thì session là đủ và thu hồi dễ. API cho mobile, cho đối tác, hay nhiều service cùng verify thì JWT.",
            "`sessionCreationPolicy` quyết định Spring Security có tạo session không: mặc định `IF_REQUIRED` (tạo khi cần), API dùng `STATELESS`.",
          ],
          trap: {
            title: "Session fixation",
            text: "Kẻ tấn công lấy một session id hợp lệ (chưa đăng nhập) rồi tìm cách cài nó vào browser nạn nhân. Nạn nhân đăng nhập, nếu server giữ nguyên id thì session đó giờ đã đăng nhập, và kẻ tấn công dùng chính id đó là vào được. Cách chặn: **đổi session id ngay khi đăng nhập**. Spring Security làm sẵn: chiến lược mặc định là `changeSessionId` (gọi `HttpServletRequest.changeSessionId()` của Servlet 3.1, giữ dữ liệu, đổi id). Đừng tắt nó bằng `sessionFixation(f -> f.none())`.",
          },
          takeaway: {
            lines: [
              "Session: server nhớ, thu hồi ngay, cần kho chung và chống CSRF. JWT: server không nhớ, scale dễ, thu hồi khó.",
              "Đăng nhập thành công thì session id phải đổi, Spring Security làm mặc định.",
            ],
          },
          quiz: {
            question: "Admin khoá tài khoản một nhân viên và muốn người đó bị đăng xuất **ngay lập tức** trên mọi thiết bị. Cách nào làm được dễ nhất?",
            options: [
              "JWT access token 1 giờ, không có blacklist",
              "Session lưu ở server (Spring Session + Redis): xoá các session của user đó là xong",
              "JWT với HS256 thay vì RS256",
              "Lưu JWT trong localStorage",
            ],
            answer: 1,
            explain: "Session nằm ở server nên xoá là hết hiệu lực ngay. JWT phải chờ hết hạn, hoặc thêm blacklist hay token version, tức lại cần tra cứu ở server.",
          },
        },
      ],
    },
    {
      id: "jwt",
      title: "Phần 3: JWT: cấu trúc và luồng",
      scene: "jwt",
      intro: [
        "Phần 2 bật `oauth2ResourceServer` để verify JWT. Vậy bên trong JWT có gì? JWT = `header.payload.signature`, mỗi phần base64url. Đã decode không cần key: `{\"alg\":\"HS256\"}` và `{\"sub\":\"alice\",\"exp\":1794572543,\"iat\":1794571043,\"roles\":[\"USER\"]}`. Chữ ký tính trên `header.payload` nên sửa payload là bị phát hiện. Server không lưu session: mỗi request tự mang đủ thông tin, hợp scale ngang và microservices.",
        "Các bẫy hay gặp:",
        "- **Dữ liệu cá nhân trong payload**: email, số điện thoại ai cũng đọc được.",
        "- **Token quá to**: gửi kèm mọi request.",
        "- **Tin `alg` do token tự khai**: kẻ tấn công ghi `alg: none` để bỏ chữ ký, hoặc đổi thuật toán để lừa server. Decoder của Spring cố định thuật toán, xem thêm bài OAuth2 và OIDC.",
        "- **Secret HS256 ngắn**: bị brute-force offline.",
        "- **Role cũ trong token cũ**: đổi role của user thì token cũ vẫn mang role cũ tới khi hết hạn. Giữ access token ngắn, thu hồi bằng blacklist `jti` (claim chứa id duy nhất của từng token) hoặc token version.",
      ],
      predict: {
        question: "Token của alice có `roles: [\"USER\"]`. Kẻ tấn công sửa thành `ADMIN`, giữ nguyên chữ ký cũ, rồi gọi `/api/admin/stats`. Kết quả?",
        options: [
          "200, vì payload giờ ghi ADMIN",
          "403, vì alice không phải admin",
          "401, chữ ký không khớp nên token bị từ chối",
          "500, vì token hỏng",
        ],
        answer: 2,
        explain: "Chữ ký tính trên `header.payload` bằng secret, sửa một chữ là lệch. Token không qua bước xác thực nên ra 401, chưa tới bước kiểm tra quyền.",
      },
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
        "Chữ ký JWT ở Phần 3 có hai kiểu:",
        "- **HS256** (đối xứng): service nào verify được cũng ký được token giả; hợp monolith.",
        "- **RS256/ES256** (bất đối xứng): auth server ký bằng private key, service verify bằng public key; hợp microservices, Keycloak, Auth0.",
        "Service lấy public key ở đâu: **JWKS** (JSON Web Key Set) là URL nơi auth server công bố các public key của nó, khai báo trong Spring bằng `jwk-set-uri`. Header của token có `kid` (key id) cho biết key nào đã ký, nên auth server đổi key mới (xoay key) mà token cũ vẫn verify được bằng key cũ.",
        "Hai loại token:",
        "- **Access token**: 5–15 phút, gửi mọi request, không lưu ở server.",
        "- **Refresh token**: dài ngày, chỉ gửi khi refresh, **lưu ở server** để thu hồi, kèm **rotation**: refresh token đã dùng mà bị gửi lại là dấu hiệu bị đánh cắp, thu hồi cả phiên.",
        "Lưu ở client:",
        "- **`localStorage`**: bị XSS đọc được.",
        "- **Cookie `HttpOnly`**: JS không đọc được, nhưng cần chống CSRF.",
        "- **Cách SPA hay dùng**: access token trong memory, refresh token trong cookie HttpOnly.",
      ],
      takeaway: {
        lines: ["HS256 thì ai verify được cũng ký được. Nhiều service thì dùng RS256 với JWKS."],
      },
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
        "Token cấp sau khi đăng nhập, còn mật khẩu dùng để đăng nhập thì lưu thế nào? Mật khẩu phải hash một chiều, nhưng SHA-256 quá nhanh: project demo đo 100.000 hash mất 165,7 ms ngay sau khi JVM khởi động; khi JVM đã chạy nóng, một luồng CPU băm được cỡ hàng triệu lần mỗi giây (con số cụ thể tùy phần cứng, GPU còn nhanh hơn nhiều). BCrypt có **salt** ngẫu nhiên (cùng mật khẩu ra hash khác) và **cost** chậm có chủ đích: strength 10 khoảng 88 ms, 12 khoảng 386 ms, 14 khoảng 1,5 giây: mỗi bậc chậm gấp đôi.",
        "Ba điều khi dùng BCrypt:",
        "- **So bằng `matches`**: salt nằm ngay trong chuỗi `$2a$10$...`, nên `encode(raw).equals(hash)` luôn false.",
        "- **Giới hạn 72 byte**: BCrypt chỉ dùng 72 byte đầu. Spring Security 6.5 ném lỗi khi encode mật khẩu 73 byte, nhưng `matches(72 ký tự + \"x\", hash)` vẫn true; giới hạn độ dài ở tầng validate.",
        "- **Đổi thuật toán sau này**: dùng `DelegatingPasswordEncoder` (`{bcrypt}`, `{argon2}`).",
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
        "Phần 2 tắt CSRF cho API Bearer. Để hiểu vì sao, cần tách ba khái niệm hay bị nhầm:",
        "- **Origin**: scheme + host + port, ví dụ `https://shop.vn:443`; khác một trong ba là khác origin.",
        "- **CORS**: cơ chế browser **cho phép** JS ở origin A đọc response từ origin B, dựa vào header server trả.",
        "- **CSRF**: **tấn công** lợi dụng browser tự gửi cookie.",
        "Bearer token không bị CSRF vì browser không tự gửi; token trong cookie thì CSRF quay lại.",
        "Request có header tự thêm như `Authorization` không còn là \"simple request\", nên trước khi gửi thật, browser hỏi server bằng một request `OPTIONS` gọi là **preflight**: origin này, method này, header này có được phép không.",
      ],
      predict: {
        question: "Preflight `OPTIONS /api/me` từ origin được phép, **không kèm token**, trong khi `/api/me` cần đăng nhập. Server trả gì?",
        options: [
          "401, vì không có token",
          "200, vì `CorsFilter` trả lời preflight trước filter xác thực",
          "403, vì preflight luôn bị chặn",
          "404, vì không có handler cho OPTIONS",
        ],
        answer: 1,
        explain: "Preflight không mang token, vì browser chỉ đang hỏi xin phép. `CorsFilter` đứng trước filter xác thực nên trả lời được ngay.",
      },
      widget: "cors-preflight",
      widgetTitle: "Preflight theo origin",
      after: [
        "Đã quan sát: preflight từ origin được phép ra 200 dù không có token, vì `CorsFilter` đứng trước filter xác thực; origin lạ ra 403 `Invalid CORS request`. Quên `.cors()` trong Security thì preflight chết 401 và `@CrossOrigin` ở controller vô dụng. `allowedOrigins(\"*\")` cùng `allowCredentials(true)` bị spec cấm.",
      ],
      takeaway: {
        lines: ["Bearer token trong header thì không bị CSRF. Token trong cookie thì phải chống CSRF."],
      },
      quiz: {
        question: "CORS có chặn được kẻ tấn công gọi API bằng curl không?",
        options: ["Có", "Không: request không có Origin thì CORS không áp dụng; CORS chỉ bảo vệ người dùng trong browser", "Chỉ khi bật CSRF", "Chỉ với HTTPS"],
        answer: 1,
        explain: "Bảo vệ API là việc của authentication và authorization.",
      },
      parts: [
        {
          id: "csrf-cookie",
          title: "Chống CSRF khi đăng nhập bằng cookie",
          intro: [
            "Ta đã biết Bearer token trong header thì không bị CSRF. Còn app dùng session cookie, hoặc để JWT trong cookie `HttpOnly`, thì chống thế nào?",
            "Tấn công: bạn đang đăng nhập `bank.vn`. Trang `evil.com` có một form ẩn tự submit `POST https://bank.vn/transfer`. Browser tự gắn cookie của `bank.vn`, server thấy session hợp lệ và chuyển tiền. `evil.com` không đọc được response, nhưng nó không cần đọc.",
            "Ba lớp chặn, nên dùng cùng nhau:",
            "- **CSRF token**: server cấp một chuỗi ngẫu nhiên, mỗi request đổi dữ liệu phải gửi lại chuỗi đó trong header hoặc field của form. `evil.com` không đọc được chuỗi này (same-origin policy), nên request giả thiếu token và bị 403. Spring Security bật sẵn khi bạn không gọi `csrf.disable()`.",
            "- **SPA đọc token từ cookie**: `CookieCsrfTokenRepository.withHttpOnlyFalse()` đặt token vào cookie `XSRF-TOKEN` mà JS đọc được, JS gửi lại trong header `X-XSRF-TOKEN`. Spring Security 7 gom sẵn thành `csrf(c -> c.spa())`; bản 6.x cấu hình tay theo mục SPA trong tài liệu.",
            "- **Cookie `SameSite`**: `Lax` không gửi cookie theo request POST từ site khác, nhưng vẫn gửi khi người dùng bấm link (GET). `Strict` không gửi trong mọi request từ site khác.",
            "- **Không đổi dữ liệu bằng GET**: `SameSite=Lax` vẫn gửi cookie với GET từ site khác, nên `GET /transfer?to=...` là mở cửa cho CSRF.",
          ],
          trap: {
            title: "Cùng site chưa chắc cùng origin",
            text: "`SameSite` so **site** (scheme + tên miền chính, ví dụ `https://example.com`), không so origin. Request từ `evil.example.com` tới `app.example.com` là **cùng site**, nên cookie `SameSite=Strict` vẫn được gửi. Subdomain do người khác kiểm soát thì vẫn cần CSRF token.",
          },
          takeaway: {
            lines: [
              "Cookie thì browser tự gửi → cần CSRF token (cộng `SameSite`). Token trong header `Authorization` thì không tự gửi → `csrf.disable()` an toàn.",
            ],
          },
          quiz: {
            question: "SPA đăng nhập bằng session cookie, backend Spring Security đã `csrf.disable()` \"cho tiện\". Rủi ro là gì?",
            options: [
              "Không có rủi ro vì đã dùng HTTPS",
              "Trang khác có thể tạo POST tới API, browser tự gắn session cookie, và request được chấp nhận như của người dùng",
              "CORS sẽ chặn hết nên không sao",
              "Chỉ rủi ro với GET",
            ],
            answer: 1,
            explain: "CORS chỉ chặn việc **đọc** response; form POST từ site khác vẫn được gửi đi kèm cookie. Bật lại CSRF với `CookieCsrfTokenRepository`, và đặt `SameSite` cho cookie.",
          },
        },
      ],
    },
    {
      id: "method-security",
      title: "Phần 7: @PreAuthorize và OWASP cơ bản",
      scene: "owasp",
      intro: [
        "Rule theo URL ở Phần 2 chưa đủ khi quyền phụ thuộc vào từng method hay từng bản ghi. `@PreAuthorize(\"hasRole('ADMIN')\")` kiểm tra quyền ngay tại method, cần `@EnableMethodSecurity` (quên thì annotation im lặng không tác dụng). Đã chạy: token USER gọi `DELETE /api/orders/1` ra 403, ADMIN ra 200. Chạy bằng AOP proxy nên dính self-invocation như `@Transactional`.",
        "SQL injection: luôn bind tham số (JPQL `:param`, derived query, JdbcTemplate `?`), không nối chuỗi kể cả native query, whitelist cột sort.",
        "OWASP hay hỏi:",
        "- **Broken Access Control**: dạng hay gặp nhất là **IDOR** (Insecure Direct Object Reference): đổi `/orders/42` thành 43 xem được đơn người khác; sửa bằng query theo cả id và owner.",
        "- **Lưu mật khẩu MD5**: dùng BCrypt (Phần 5).",
        "- **Actuator `/env` public**: lộ cấu hình.",
        "- **Thư viện có CVE**.",
        "- **Log token hay mật khẩu**.",
      ],
      quiz: {
        question: "User chỉ được xem đơn của mình. Cách chắc nhất?",
        options: ["Ẩn nút trên UI", "Query theo cả id và ownerId lấy từ authentication, không có thì 404", "Kiểm tra đã đăng nhập là đủ", "Mã hoá id trên URL"],
        answer: 1,
        explain: "Đây là IDOR, thuộc Broken Access Control đứng đầu OWASP Top 10. Trả 403 cũng đúng; 404 còn giấu luôn việc đơn đó có tồn tại, nên kẻ dò không đếm được đơn. Chọn một cách và dùng nhất quán.",
      },
    },
  ],
  modelAnswer:
    "Spring Security là chuỗi filter đứng trước DispatcherServlet; với JWT, BearerTokenAuthenticationFilter verify chữ ký và exp rồi đặt Authentication, AuthorizationFilter kiểm tra quyền, ExceptionTranslationFilter biến lỗi thành 401 khi chưa xác thực hoặc 403 khi thiếu quyền. Em cấu hình bằng bean SecurityFilterChain, stateless, tắt CSRF cho API Bearer, và nhớ cấu hình converter để claim roles thành ROLE_. JWT chỉ được ký chứ không mã hoá: em đã decode payload không cần key, và sửa USER thành ADMIN thì bị 401 invalid signature, nên em không đặt dữ liệu nhạy cảm vào token. Microservices em dùng RS256 với JWKS; access token ngắn, refresh token lưu ở server có rotation để thu hồi được. Mật khẩu em hash bằng BCrypt và so bằng matches; em đo strength 10 mất khoảng 88 ms mỗi hash. CORS là browser cho phép đọc response khác origin, CSRF là tấn công dựa vào cookie; cuối cùng em kiểm tra quyền sở hữu ở server và luôn bind tham số SQL.",
};
