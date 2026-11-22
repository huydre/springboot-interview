"""Spring Security & JWT explainer: scene layouts and per-beat narration + motion.

Outputs from a Spring Boot 3.5 project (Spring Security 6, oauth2-resource-server, HS256 tokens signed in tests) on JDK 21, study note 03.09:
14 filters in the chain (CorsFilter, BearerTokenAuthenticationFilter, ExceptionTranslationFilter, AuthorizationFilter ...);
no token 401 WWW-Authenticate: Bearer; expired 401 invalid_token; USER on /api/admin/stats 403 insufficient_scope; ADMIN 200;
token decodes to {"alg":"HS256"} and {"sub":"alice","exp":...,"roles":["USER"]}; roles changed to ADMIN with the old signature -> 401 "Invalid signature";
BCrypt strength 10 88 ms, 12 386 ms, 14 1521 ms per hash (re-measured; an earlier 113.6/590.4/4410 run was noisy) vs 100,000 SHA-256 hashes in 165.7 ms; hash equals false, matches true;
CORS: OPTIONS /api/me from shop.example.com 200, from evil.example 403 "Invalid CORS request"; @PreAuthorize: USER 403, ADMIN 200.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Ai có token cũng đọc được nội dung?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["payload = {\"sub\":\"alice\",\"roles\":[\"USER\"]}", "đổi USER thành ADMIN, giữ chữ ký cũ", "→ 401  Signed JWT rejected: Invalid signature"]),
        tile("hk-tile", 330, 350, 220, "shield"),
        el("hk-word", 600, 380, 1300, None, letters("Security & JWT"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "filter chain · JWT · BCrypt · CORS · OWASP", "kin-sub r"),
    ]), beats=[
        ("Có người cầm được token đăng nhập của bạn. Họ đọc được gì bên trong?", "Ai cầm được JWT thì đọc được gì bên trong?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đọc được hết, chỉ cần giải mã. Nhưng không sửa được: đổi quyền từ user sang admin là bị từ chối ngay.",
         "Đọc được hết, nhưng không sửa được: đổi USER thành ADMIN là bị từ chối.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 2.2, 0.3), IN("#hk-con-3", "type1", 4.0, 0.3)]),
        ("Hôm nay ta học spring security, và jay son web token.", "Hôm nay: Spring Security & JWT.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ filter chain
    dict(id="chain", world=(1920, 1080), hud=hud("fc", "Filter chain", "Đứng trước DispatcherServlet"), cam="".join([
        big_title("fc", "Filter chain", "Spring Security nằm ngoài controller"),
        gnode("fc-n1", 110, 200, 330, 100, "Request", "cyan"), gnode("fc-n2", 500, 200, 380, 100, "FilterChainProxy", "violet"),
        gnode("fc-n3", 940, 200, 420, 100, "SecurityFilterChain", "violet"), gnode("fc-n4", 1420, 200, 390, 100, "DispatcherServlet", "muted"),
        el("fc-dp", 110, 340, 1700, None, "DelegatingFilterProxy là filter của Tomcat, lazy tìm bean springSecurityFilterChain: logic security là Spring bean, dùng được DI", "note left r"),
        chip("fc-f1", 110, 430, "CorsFilter: xử lý CORS, cả preflight", "cyan"),
        chip("fc-f2", 110, 510, "BearerTokenAuthenticationFilter: verify JWT, đặt Authentication", "green"),
        chip("fc-f3", 110, 590, "ExceptionTranslationFilter: biến lỗi thành 401 hoặc 403", "amber"),
        chip("fc-f4", 110, 670, "AuthorizationFilter: kiểm tra quyền theo URL", "violet"),
        el("fc-w", 110, 770, 1700, None, "Exception trong filter không tới @RestControllerAdvice · SecurityContextHolder lưu ở ThreadLocal nên @Async không tự có user", "warnbox r"),
        wires(trace("fc-a", [(440, 250), (492, 250)], "cyan"), trace("fc-b", [(880, 250), (932, 250)], "violet"), trace("fc-c", [(1360, 250), (1412, 250)], "violet")),
    ]), beats=[
        ("Phần một: filter chain. Spring security không nằm trong controller. Nó là một chuỗi servlet filter đứng trước dispatcher servlet.",
         "Phần 1: Spring Security là chuỗi Servlet Filter đứng trước DispatcherServlet.",
         [TYPE("#fc-big", 0.1, 0.06), IN("#fc-bsub", "blur", 0.8), OUT("#fc-big, #fc-bsub", "zoom", 3.4), IN("#fc-hud", "left", 4.0),
          IN("#fc-n1", "pop", 4.4), DRAW("#fc-a-p", 5.0, 0.4), IN("#fc-n2", "pop", 5.4), DRAW("#fc-b-p", 6.0, 0.4), IN("#fc-n3", "pop", 6.4),
          DRAW("#fc-c-p", 7.0, 0.4), IN("#fc-n4", "pop", 7.4)]),
        ("Filter của Tom cat không có sẵn bin của spring, nên delegating filter proxy tìm bin security chain theo kiểu lazy.",
         "DelegatingFilterProxy lazy tìm bean springSecurityFilterChain, nên logic security là Spring bean.",
         [IN("#fc-dp", "up", 0.4), COMET("fc-a", 3.0, 0.5), COMET("fc-b", 3.4, 0.5), COMET("fc-c", 3.8, 0.5)]),
        ("Trong chuỗi có cors filter, bearer token authentication filter để kiểm tra token, exception translation filter để biến lỗi thành bốn không một hoặc bốn không ba, và authorization filter.",
         "CorsFilter, BearerTokenAuthenticationFilter, ExceptionTranslationFilter, AuthorizationFilter.",
         [IN("#fc-f1", "left", 0.4), IN("#fc-f2", "left", 2.2), IN("#fc-f3", "left", 5.8), IN("#fc-f4", "left", 10.2)]),
        ("Lưu ý: exception ném trong filter không tới rest controller advice. Và security context lưu ở thread local, nên code chạy async không tự có người dùng hiện tại.",
         "Exception trong Filter không tới @RestControllerAdvice; @Async không tự có user.",
         [IN("#fc-w", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ authentication, authorization, config
    dict(id="config", world=(1920, 1080), hud=hud("cf", "Authentication và authorization", "401 khác 403"), cam="".join([
        gnode("cf-an", 160, 190, 760, 100, "Authentication: bạn là ai → 401", "red"),
        gnode("cf-az", 1000, 190, 760, 100, "Authorization: được làm gì → 403", "amber"),
        box("cf-code", 160, 340, 1300, 270, code(
            "http.csrf(c -> c.disable())\n    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))\n"
            "    .authorizeHttpRequests(a -> a\n        .requestMatchers(\"/api/admin/**\").hasRole(\"ADMIN\")\n        .anyRequest().authenticated())\n"
            "    .oauth2ResourceServer(o -> o.jwt(...));"), "cyan", "code"),
        chip("cf-c1", 160, 640, "Bean SecurityFilterChain, WebSecurityConfigurerAdapter đã bị xoá", "violet"),
        chip("cf-c2", 160, 710, "Rule đầu tiên khớp thắng: anyRequest() phải ở cuối", "green"),
        chip("cf-c3", 160, 780, "hasRole(\"ADMIN\") kiểm tra authority ROLE_ADMIN, mặc định lại đọc claim scope với SCOPE_", "red"),
        chip("cf-c4", 160, 850, "Token có roles: [ADMIN] → cấu hình JwtGrantedAuthoritiesConverter", "amber"),
    ]), beats=[
        ("Phần hai: authentication là bạn là ai, thất bại ra bốn không một. Authorization là bạn được làm gì, thất bại ra bốn không ba.",
         "Phần 2: authentication (bạn là ai) thất bại → 401. Authorization (được làm gì) thất bại → 403.",
         [IN("#cf-hud", "left", 0.1), IN("#cf-an", "pop", 0.5), IN("#cf-az", "pop", 4.2)]),
        ("Spring security sáu đã xoá web security configurer adapter. Giờ ta khai báo một bean security filter chain: tắt C S R F cho api dùng token, chế độ stateless, và phân quyền theo url.",
         "Khai báo bean SecurityFilterChain: tắt CSRF cho API Bearer, STATELESS, phân quyền theo URL.",
         [IN("#cf-code", "up", 0.4), IN("#cf-c1", "left", 4.6)]),
        ("Rule đầu tiên khớp sẽ thắng, nên any request phải ở cuối.", "Rule đầu tiên khớp thắng: anyRequest() ở cuối.", [IN("#cf-c2", "left", 0.3)]),
        ("Bẫy: has role admin thực chất kiểm tra authority role admin. Nhưng resource server mặc định đọc claim scope. Token có claim roles thì phải cấu hình converter, không thì luôn bị bốn không ba.",
         "hasRole(ADMIN) cần ROLE_ADMIN. Token có roles: cấu hình converter, không thì luôn 403.",
         [IN("#cf-c3", "left", 0.4), IN("#cf-c4", "left", 6.4), PULSE("#cf-c3", 7.0)]),
    ]),
    # ------------------------------------------------------------ JWT
    dict(id="jwt", world=(1920, 1080), hud=hud("jw", "JWT: cấu trúc và luồng", "Encode không phải encrypt"), cam="".join([
        gnode("jw-h", 160, 190, 440, 100, "header", "cyan"), gnode("jw-p", 700, 190, 440, 100, "payload", "violet"), gnode("jw-s", 1240, 190, 440, 100, "signature", "amber"),
        console("jw-con", 160, 340, 1600, ["header  = {\"alg\":\"HS256\"}", "payload = {\"sub\":\"alice\",\"exp\":1794572543,\"iat\":1794571043,\"roles\":[\"USER\"]}", "đổi USER → ADMIN, giữ chữ ký cũ → 401 Invalid signature"]),
        chip("jw-t1", 160, 550, "Chữ ký tính trên header.payload bằng secret: sửa một chữ là lệch", "green"),
        chip("jw-t2", 160, 630, "Server không lưu session: mỗi request tự mang đủ thông tin", "cyan"),
        chip("jw-t3", 160, 710, "Đừng đặt email, số điện thoại vào payload · alg do token tự khai: decoder cố định thuật toán", "red"),
        chip("jw-t4", 160, 790, "Đổi role mà token cũ còn hạn: access token ngắn, blacklist jti", "amber"),
        wires(trace("jw-a", [(600, 240), (692, 240)], "cyan"), trace("jw-b", [(1140, 240), (1232, 240)], "violet")),
    ]), beats=[
        ("Phần ba: jay son web token gồm ba phần: header, payload và chữ ký, mỗi phần chỉ được chuyển sang dạng base sáu bốn.",
         "Phần 3: JWT gồm header, payload, signature; mỗi phần base64url.",
         [IN("#jw-hud", "left", 0.1), IN("#jw-h", "pop", 0.8), DRAW("#jw-a-p", 1.6, 0.4), IN("#jw-p", "pop", 2.0), DRAW("#jw-b-p", 2.8, 0.4), IN("#jw-s", "pop", 3.2)]),
        ("Base sáu bốn chỉ là đổi cách viết, không phải mã hoá bí mật. Ai cũng đọc ngược lại được mà không cần khoá, ta đọc được cả payload. Nhưng chữ ký tính trên cả header và payload, nên sửa một chữ là lệch, và bị từ chối.",
         "Encode không phải encrypt: payload đọc được. Nhưng sửa một chữ là chữ ký lệch, bị từ chối.",
         [IN("#jw-con", "up", 0.3, 0.4), IN("#jw-con-1", "type1", 0.8, 0.3), IN("#jw-con-2", "type1", 3.0, 0.3), IN("#jw-con-3", "type1", 6.4, 0.3), IN("#jw-t1", "left", 9.0)]),
        ("Server không lưu session, nên hợp với scale ngang và microservice. Đừng nhét dữ liệu nhạy cảm vào payload.",
         "Không lưu session: hợp scale ngang. Đừng đặt dữ liệu nhạy cảm vào payload.",
         [IN("#jw-t2", "left", 0.4), IN("#jw-t3", "left", 3.6)]),
        ("Cái giá của stateless: đổi quyền người dùng mà token cũ còn hạn thì vẫn mang quyền cũ. Vì vậy access token phải ngắn, và có thể thu hồi bằng blacklist.",
         "Đổi quyền mà token cũ còn hạn vẫn mang quyền cũ: access token ngắn, thu hồi bằng blacklist.",
         [IN("#jw-t4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ tokens
    dict(id="tokens", world=(1920, 1080), hud=hud("tk", "HS256 với RS256", "Access token và refresh token"), cam="".join([
        gnode("tk-hs", 160, 190, 760, 100, "HS256: một secret dùng chung", "amber"), gnode("tk-rs", 1000, 190, 760, 100, "RS256: private key ký, public key verify", "green"),
        chip("tk-h1", 160, 320, "Service nào verify được cũng ký được token giả", "red"),
        chip("tk-r1", 1000, 320, "Public key qua jwk-set-uri (JWKS), xoay key theo kid", "green"),
        box("tk-ac", 160, 430, 760, 120, "<b>Access token</b><br>5–15 phút · gửi mọi request · không lưu ở server", "cyan", "card"),
        box("tk-rf", 1000, 430, 760, 120, "<b>Refresh token</b><br>vài ngày · chỉ gửi khi refresh · lưu ở server", "violet", "card"),
        chip("tk-rot", 160, 590, "Rotation: refresh token đã dùng mà bị gửi lại là bị đánh cắp, thu hồi cả phiên", "amber"),
        chip("tk-ls", 160, 670, "localStorage: XSS đọc được token", "red"), chip("tk-ck", 760, 670, "Cookie HttpOnly: cần chống CSRF", "amber"),
        chip("tk-lo", 160, 750, "Logout: xoá refresh token ở server; cần cắt ngay thì blacklist jti trong Redis, TTL bằng thời gian còn lại", "green"),
    ]), beats=[
        ("Phần bốn: hai họ thuật toán ký. H S hai năm sáu dùng một bí mật chung, nên service nào verify được cũng ký được token giả. Hợp với monolith.",
         "Phần 4: HS256 dùng một secret chung: service nào verify được cũng ký được token giả.",
         [IN("#tk-hud", "left", 0.1), IN("#tk-hs", "pop", 0.8), IN("#tk-h1", "left", 5.0)]),
        ("R S hai năm sáu dùng khóa riêng để ký, khóa công khai để verify, lấy qua một endpoint. Hợp với microservice và key cloak.",
         "RS256: private key ký, public key verify qua JWKS. Hợp microservice, Keycloak.",
         [IN("#tk-rs", "pop", 0.4), IN("#tk-r1", "left", 4.2)]),
        ("Access token sống năm đến mười lăm phút và không lưu ở server. Refresh token sống vài ngày, chỉ gửi khi làm mới, và lưu ở server để thu hồi được.",
         "Access token 5–15 phút, không lưu. Refresh token vài ngày, lưu ở server để thu hồi.",
         [IN("#tk-ac", "up", 0.4), IN("#tk-rf", "up", 5.0)]),
        ("Refresh token nên xoay vòng: một token đã dùng mà bị gửi lại là dấu hiệu bị đánh cắp. Lưu ở local storage thì bị X S S đọc được, còn cookie http only thì cần chống C S R F.",
         "Rotation: token đã dùng mà bị gửi lại = bị đánh cắp. localStorage bị XSS đọc; cookie HttpOnly cần chống CSRF.",
         [IN("#tk-rot", "left", 0.4), IN("#tk-ls", "left", 5.4), IN("#tk-ck", "left", 7.6)]),
        ("Logout thì xóa refresh token ở server. Cần cắt ngay thì đưa mã token vào blacklist trong redis.",
         "Logout: xoá refresh token; cắt ngay thì blacklist jti trong Redis.", [IN("#tk-lo", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ BCrypt
    dict(id="bcrypt", world=(1920, 1080), hud=hud("bc", "Lưu mật khẩu: BCrypt", "Chậm có chủ đích"), cam="".join([
        el("bc-l", 160, 185, 1600, None, "Thời gian cho một lần hash:", "lbl r", "text-align:left"),
        box("bc-sha", 160, 235, 520, 70, "<b>SHA-256: 0,0017 ms</b>", "red", "card"),
        box("bc-b10", 160, 320, 560, 70, "<b>BCrypt 10: 88 ms</b>", "green", "card"),
        box("bc-b12", 160, 405, 760, 70, "<b>BCrypt 12: 386 ms</b>", "green", "card"),
        box("bc-b14", 160, 490, 1550, 70, "<b>BCrypt 14: 1521 ms</b>", "amber", "card"),
        console("bc-h", 160, 600, 1600, ["$2a$10$C38mwtoaKAO72ovSTPijP.x8TNjXNu6OcsezPoEcqbtDes4LeECWO", "$2a$ phiên bản · 10$ = 2^10 vòng · 22 ký tự salt · phần còn lại là hash"]),
        chip("bc-c1", 160, 760, "Dùng matches, không dùng encode(raw).equals(hash): salt mỗi lần khác", "violet"),
        chip("bc-c2", 160, 840, "Chỉ dùng 72 byte đầu: giới hạn độ dài mật khẩu · strength vừa phải, đo rồi chọn", "amber"),
    ]), beats=[
        ("Phần năm: lưu mật khẩu. Phải hash một chiều, nhưng sha hai năm sáu quá nhanh: một trăm nghìn hash chỉ mất một trăm sáu mươi lăm mili giây, kẻ tấn công thử được hàng tỷ mật khẩu.",
         "Phần 5: SHA-256 quá nhanh: 100.000 hash chỉ 165,7 ms. Kẻ tấn công thử được hàng tỷ mật khẩu.",
         [IN("#bc-hud", "left", 0.1), IN("#bc-l", "fade", 0.4), IN("#bc-sha", "left", 3.2, 0.5)]),
        ("B crypt có salt ngẫu nhiên và chậm có chủ đích. Mức mười mất khoảng chín mươi mili giây, mức mười hai gần bốn trăm, mức mười bốn hơn một giây rưỡi. Tăng một bậc là chậm gấp đôi.",
         "BCrypt: strength 10 = 88 ms, 12 = 386 ms, 14 = 1521 ms. Tăng 1 bậc là chậm gấp đôi.",
         [IN("#bc-b10", "left", 3.0), IN("#bc-b12", "left", 5.4), IN("#bc-b14", "left", 7.0, 0.8)]),
        ("Salt nằm ngay trong chuỗi hash, nên dùng matches để so sánh, đừng encode rồi equals, vì luôn ra false.",
         "Salt nằm trong chuỗi hash: dùng matches, không encode().equals().",
         [IN("#bc-h", "up", 0.3, 0.4), IN("#bc-h-1", "type1", 0.7, 0.3), IN("#bc-h-2", "type1", 2.2, 0.3), IN("#bc-c1", "left", 4.4)]),
        ("B crypt chỉ dùng bảy mươi hai byte đầu, nên hãy giới hạn độ dài mật khẩu. Đặt mức quá cao thì login chậm và dễ bị tấn công từ chối dịch vụ.",
         "Chỉ dùng 72 byte đầu: giới hạn độ dài. Strength quá cao: login chậm, dễ bị DoS.",
         [IN("#bc-c2", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ CORS and CSRF
    dict(id="cors", world=(1920, 1080), hud=hud("co", "CORS và CSRF", "Hai chuyện khác nhau"), cam="".join([
        gnode("co-c", 160, 190, 760, 100, "CORS: browser cho phép đọc response", "cyan"), gnode("co-s", 1000, 190, 760, 100, "CSRF: tấn công dựa vào cookie", "red"),
        console("co-con", 160, 340, 1600, ["OPTIONS /api/me · Origin shop.example.com → 200", "OPTIONS /api/me · Origin evil.example → 403  Invalid CORS request",
                                           "GET /api/public/ping · Origin evil.example → 403"]),
        chip("co-t1", 160, 560, "Preflight hợp lệ trả 200 dù không có token: CorsFilter đứng trước filter xác thực", "green"),
        chip("co-t2", 160, 640, "Quên .cors() trong Security: preflight chết 401; @CrossOrigin ở controller vô dụng", "red"),
        chip("co-t3", 160, 720, "Không có Origin (curl, Postman): CORS không áp dụng, không phải bảo mật cho API", "amber"),
        chip("co-t4", 160, 800, "Bearer token không bị CSRF; token trong cookie thì CSRF quay lại", "violet"),
    ]), beats=[
        ("Phần sáu: C O R S và C S R F, hai chuyện khác nhau. C O R S là cơ chế trình duyệt cho phép trang ở origin này đọc response từ origin khác. C S R F là tấn công lợi dụng việc trình duyệt tự gửi cookie.",
         "Phần 6: CORS là browser cho phép đọc response khác origin. CSRF là tấn công lợi dụng cookie tự gửi.",
         [IN("#co-hud", "left", 0.1), IN("#co-c", "pop", 0.8), IN("#co-s", "pop", 6.6)]),
        ("Request có header authorization khiến trình duyệt gửi preflight trước. Origin được phép thì ra hai trăm, origin lạ thì bị từ chối bốn không ba.",
         "Có header Authorization → preflight OPTIONS. Origin được phép: 200; origin lạ: 403.",
         [IN("#co-con", "up", 0.3, 0.4), IN("#co-con-1", "type1", 0.8, 0.3), IN("#co-con-2", "type1", 3.4, 0.3), IN("#co-con-3", "type1", 6.4, 0.3)]),
        ("Preflight hợp lệ trả hai trăm dù không có token, vì filter C O R S đứng trước. Quên bật C O R S trong security thì preflight bị chặn.",
         "Preflight 200 dù không có token vì CorsFilter đứng trước. Quên .cors() thì preflight bị chặn.",
         [IN("#co-t1", "left", 0.3), IN("#co-t2", "left", 4.8)]),
        ("C O R S không phải bảo mật cho api: request không có origin, như curl, thì C O R S không áp dụng. Token bearer thì không bị C S R F, còn token để trong cookie thì C S R F quay lại.",
         "CORS không phải bảo mật cho API. Bearer token không bị CSRF; token trong cookie thì có.",
         [IN("#co-t3", "left", 0.4), IN("#co-t4", "left", 5.6)]),
    ]),
    # ------------------------------------------------------------ PreAuthorize and OWASP
    dict(id="owasp", world=(1920, 1080), hud=hud("ow", "@PreAuthorize và OWASP", "Kiểm tra quyền ở server"), cam="".join([
        box("ow-code", 160, 190, 1000, 130, code("@PreAuthorize(\"hasRole('ADMIN')\")\n@DeleteMapping(\"/api/orders/{id}\")\npublic void delete(@PathVariable Long id) {}"), "cyan", "code"),
        console("ow-con", 1230, 200, 530, ["USER  → 403", "ADMIN → 200"]),
        chip("ow-n1", 160, 360, "Quên @EnableMethodSecurity: annotation im lặng không tác dụng", "red"),
        box("ow-sqlbad", 160, 430, 1600, 80, code("\"select * from users where name = '\" + name + \"'\""), "red", "code"),
        box("ow-sqlok", 160, 525, 1600, 80, code("@Query(\"select u from User u where u.name = :name\")"), "green", "code"),
        chip("ow-o1", 160, 640, "Broken Access Control: đổi /orders/42 thành 43 xem được đơn người khác", "amber"),
        chip("ow-o2", 160, 715, "Query theo cả id và ownerId lấy từ authentication, không có thì 404", "green"),
        chip("ow-o3", 160, 790, "Không log token, mật khẩu · không public actuator /env, heapdump · cập nhật thư viện có CVE", "violet"),
    ]), beats=[
        ("Phần bảy: kiểm tra quyền ngay tại method bằng pre authorize. Người dùng thường gọi xóa đơn bị bốn không ba, admin được hai trăm. Quên bật method security thì annotation im lặng, không có tác dụng.",
         "Phần 7: @PreAuthorize: USER gọi xoá đơn → 403, ADMIN → 200. Quên @EnableMethodSecurity thì không tác dụng.",
         [IN("#ow-hud", "left", 0.1), IN("#ow-code", "up", 0.5), IN("#ow-con", "right", 2.0, 0.4), IN("#ow-con-1", "type1", 2.4, 0.3), IN("#ow-con-2", "type1", 3.4, 0.3), IN("#ow-n1", "left", 7.4)]),
        ("Chống sql injection: luôn bind tham số, không nối chuỗi, kể cả trong native query.",
         "Chống SQL injection: luôn bind tham số, không nối chuỗi.",
         [IN("#ow-sqlbad", "left", 0.3), SHAKE("#ow-sqlbad", 1.0), IN("#ow-sqlok", "right", 2.4)]),
        ("Lỗi hay gặp nhất là broken access control: đổi id trên url là xem được đơn người khác. Hãy query theo cả id và chủ sở hữu.",
         "Broken Access Control: đổi id trên URL xem được đơn người khác. Query theo cả id và owner.",
         [IN("#ow-o1", "left", 0.4), IN("#ow-o2", "left", 4.8)]),
        ("Ngoài ra đừng log token hay mật khẩu, đừng public actuator, và cập nhật thư viện có lỗ hổng.",
         "Đừng log token, mật khẩu · đừng public actuator · cập nhật thư viện có CVE.",
         [IN("#ow-o3", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("shield", "401 và 403", "chưa xác thực, không đủ quyền"),
                                                ("lock", "JWT", "ký chứ không mã hoá"),
                                                ("hash", "BCrypt", "matches, strength vừa phải"),
                                                ("share", "CORS", "chỉ bảo vệ người dùng browser")]),
        chip("ou-next", 760, 650, "Bài tiếp: Redis Cache", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: bốn không một là chưa xác thực, bốn không ba là không đủ quyền. Token chỉ được ký, không được mã hóa. Mật khẩu hash bằng B crypt. Và C O R S chỉ bảo vệ người dùng trong trình duyệt.",
         "401 chưa xác thực, 403 không đủ quyền · JWT chỉ ký · mật khẩu BCrypt · CORS chỉ bảo vệ người dùng browser.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.0), IN("#ou-c2", "pop", 6.8), IN("#ou-c3", "pop", 9.4)]),
        ("Bài tiếp: cache với Redis.", "Bài tiếp: Redis Cache.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
