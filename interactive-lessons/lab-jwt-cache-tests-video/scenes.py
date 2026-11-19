"""Lab 7 explainer (JWT, Cache & Tests): scene layouts and per-beat narration + motion.

Numbers come from study note 11.07 (Spring Boot 3.5.16, Spring Security 6.5, JDK 21, PostgreSQL 16 and Redis 7 via Testcontainers) and
03.09 / 03.10 / 05.02:
token payload {"iss":"order-service","sub":"user","roles":["USER"]}, exp - iat = 900; no token 401 Bearer, tampered signature 401 invalid_token,
USER POST /products 403 insufficient_scope, USER POST /orders 201, wrong password 401 ProblemDetail; BCrypt (re-measured, spring-security-crypto 6.5)
strength 10/12/14 = 88/386/1521 ms; cache statements GET 1, GET 1, GET 1, PUT 3, GET 4, TTL 600, order of 2 against cached stock 10 then GET = 8;
@WebMvcTest without SecurityConfig: bean false, GET /products/1 401, POST without CSRF 403 (CsrfFilter runs before authentication), with CSRF and
no user 401; @DataJpaTest on PostgreSQL: relation "products_seq" does not exist; @Cacheable on protected/package-private works since Spring 6 (05.02 measured).
Nothing re-run for this video (needs Docker). Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Lab 7 · Dự đoán, chạy, so sánh", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Payload của JWT có được mã hoá không?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ['header  = {"alg":"HS256"}', 'payload = {"iss":"order-service","sub":"user","roles":["USER"]}',
                                          "exp - iat = 900 giây   ← chỉ được ký, ai cũng đọc được"]),
        tile("hk-tile", 330, 350, 220, "shield"),
        el("hk-word", 600, 380, 1300, None, letters("JWT, Cache & Tests"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "401 và 403 · Redis TTL và evict · ba loại test", "kin-sub r"),
    ]), beats=[
        ("Payload của token có được mã hóa không? Hãy đoán trước, rồi chạy thật, rồi so sánh.",
         "Payload của JWT có được mã hoá không? Đoán trước, chạy thật, so sánh.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Giải mã hai phần đầu bằng base64 là đọc được hết. Token chỉ được ký, không được mã hóa. Hạn chín trăm giây, tức mười lăm phút.",
         "Giải mã base64 là đọc được: chỉ được ký, không mã hoá. Hạn 900 giây.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 2.4, 0.3), IN("#hk-con-3", "type1", 5.0, 0.3)]),
        ("Hôm nay là lab bảy: token, cache, và test.", "Hôm nay: Lab 7, JWT, Cache & Tests.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ jwt
    dict(id="jwt", world=(1920, 1080), hud=hud("jw", "JWT, phân quyền", "401 so với 403"), cam="".join([
        big_title("jw", "JWT và phân quyền", "Đoán mã trạng thái trước khi nhìn kết quả"),
        console("jw-con", 160, 190, 1600, ["không token                    →  401  WWW-Authenticate: Bearer",
                                          "token sửa chữ ký               →  401  error=\"invalid_token\"",
                                          "USER tạo product               →  403  error=\"insufficient_scope\"",
                                          "USER đặt hàng                  →  201",
                                          "login sai mật khẩu             →  401  ProblemDetail"]),
        chip("jw-c1", 160, 520, "401: chưa biết bạn là ai · 403: biết bạn là ai nhưng không đủ quyền", "green"),
        chip("jw-c2", 160, 600, "Advice bắt Exception.class sẽ biến BadCredentialsException thành 500", "red"),
        chip("jw-c3", 160, 680, "Cần handler riêng cho AuthenticationException, trả 401", "green"),
        chip("jw-c4", 160, 760, "BCrypt mỗi bậc chậm gấp đôi: strength 10 = 88 ms · 12 = 386 ms · 14 = 1521 ms", "amber"),
        chip("jw-c5", 160, 840, "Không tự viết JwtFilter: oauth2ResourceServer đã verify chữ ký, exp và header chuẩn", "cyan"),
    ]), beats=[
        ("Phần một: token và phân quyền. Hãy đoán: người dùng thường tạo sản phẩm thì ra mã nào?",
         "Phần 1: USER thường tạo product thì ra mã nào?",
         [TYPE("#jw-big", 0.1, 0.06), IN("#jw-bsub", "blur", 0.8), OUT("#jw-big, #jw-bsub", "zoom", 4.0), IN("#jw-hud", "left", 4.4)]),
        ("Chạy thật qua request. Không có token, hoặc token bị sửa chữ ký: bốn không một. Người dùng thường tạo sản phẩm: bốn không ba. Nhưng đặt hàng thì vẫn hai không một.",
         "Không token hoặc sửa chữ ký: 401. USER tạo product: 403. USER đặt hàng: 201.",
         [IN("#jw-con", "up", 0.3, 0.4), IN("#jw-con-1", "type1", 0.8, 0.3), IN("#jw-con-2", "type1", 2.4, 0.3), IN("#jw-con-3", "type1", 5.2, 0.3),
          IN("#jw-con-4", "type1", 8.6, 0.3), IN("#jw-con-5", "type1", 10.0, 0.3)]),
        ("Câu nói phỏng vấn: bốn không một là chưa biết bạn là ai. Bốn không ba là biết rồi, nhưng không đủ quyền.",
         "401: chưa biết bạn là ai. 403: biết nhưng không đủ quyền.", [IN("#jw-c1", "left", 0.4)]),
        ("Bẫy: login sai mật khẩu. Nếu advice bắt cả exception chung, nó biến lỗi xác thực thành năm trăm. Cần handler riêng, trả bốn không một.",
         "Bẫy: advice bắt Exception biến login sai thành 500. Cần handler riêng, trả 401.",
         [IN("#jw-c2", "left", 0.4), IN("#jw-c3", "left", 6.4)]),
        ("Mật khẩu băm bằng B crypt, mỗi bậc strength chậm gấp đôi. Đo lại: mười là tám mươi tám mili giây, mười hai là ba trăm tám mươi sáu, mười bốn là một nghìn năm trăm hai mươi mốt.",
         "BCrypt strength 10 = 88 ms, 12 = 386 ms, 14 = 1521 ms.", [IN("#jw-c4", "left", 0.6)]),
        ("Và đừng tự viết filter cho token. Resource server của Spring Security đã verify chữ ký, hạn dùng, và trả header đúng chuẩn.",
         "Đừng tự viết JwtFilter: resource server đã verify sẵn.", [IN("#jw-c5", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ cache
    dict(id="cache", world=(1920, 1080), hud=hud("ca", "@Cacheable với Redis", "Đếm SQL từng bước"), cam="".join([
        big_title("ca", "Cache với Redis", "Đoán số câu SQL sau mỗi bước"),
        console("ca-con", 160, 190, 1600, ["GET lần 1      →  1 câu SQL   miss, TTL = 600 giây",
                                          "GET lần 2, 3   →  vẫn 1       hit, không SQL nào",
                                          "PUT giá 90     →  tổng 3     key bị xoá",
                                          "GET lần 4      →  tổng 4     miss, giá mới 90.0"]),
        chip("ca-c1", 160, 460, "Đặt hàng trừ kho: cache giữ stock 10, đặt 2 cái, GET trả 8 nhờ evict", "amber"),
        chip("ca-c2", 160, 540, "Quên evict ở chỗ khác sửa dữ liệu: GET trả stock cũ tới 10 phút", "red"),
        chip("ca-c3", 160, 620, "Giá trị JSON có @class: đổi tên hoặc package DTO là cache cũ không đọc được", "red"),
        chip("ca-c4", 160, 700, "Khi deploy: đổi tên cache hoặc thêm tiền tố version", "green"),
        chip("ca-c5", 160, 780, "Chạy bằng proxy: self-invocation vẫn đọc DB, protected và package-private chạy được từ Spring 6", "violet"),
        chip("ca-c6", 160, 860, "Quên @EnableCaching thì annotation im lặng, không có tác dụng", "cyan"),
    ]), beats=[
        ("Phần hai: cache sản phẩm bằng Redis. Hãy đoán: ba lần GET thì có mấy câu SQL?",
         "Phần 2: 3 lần GET thì có mấy câu SQL?",
         [TYPE("#ca-big", 0.1, 0.06), IN("#ca-bsub", "blur", 0.8), OUT("#ca-big, #ca-bsub", "zoom", 4.0), IN("#ca-hud", "left", 4.4)]),
        ("Chạy với Redis và PostgreSQL thật. Lần một là một câu, thời gian sống sáu trăm giây. Lần hai và ba vẫn một câu, cache trúng. Cập nhật giá thì key bị xóa, lần bốn đọc lại giá mới.",
         "GET: 1, 1, 1. PUT xoá key (tổng 3). GET lần 4 (tổng 4) ra giá mới. TTL 600.",
         [IN("#ca-con", "up", 0.3, 0.4), IN("#ca-con-1", "type1", 0.8, 0.3), IN("#ca-con-2", "type1", 4.6, 0.3), IN("#ca-con-3", "type1", 8.0, 0.3), IN("#ca-con-4", "type1", 10.6, 0.3)]),
        ("Câu hỏi hay bị quên: chỗ nào khác sửa dữ liệu đang cache? Đặt hàng trừ kho. Cache giữ mười, đặt hai cái, và nhờ evict, GET trả tám.",
         "Chỗ khác sửa dữ liệu đang cache: đặt hàng trừ kho. Cache 10, đặt 2, GET trả 8.",
         [IN("#ca-c1", "left", 4.6), IN("#ca-c2", "left", 8.6)]),
        ("Giá trị trong Redis có tên class đầy đủ. Đổi tên hay package của DTO thì cache cũ đọc không được. Khi deploy, đổi tên cache hoặc thêm tiền tố version.",
         "Giá trị có @class: đổi tên DTO là cache cũ hỏng. Deploy: đổi tên cache hoặc thêm version.",
         [IN("#ca-c3", "left", 0.4), IN("#ca-c4", "left", 6.0)]),
        ("Cache chạy bằng proxy, nên gọi trong cùng class vẫn đọc database. Từ Spring sáu, method protected và package private đã chạy được. Và quên bật caching thì annotation im lặng không làm gì.",
         "Self-invocation vẫn đọc DB; Spring 6 hỗ trợ protected. Quên @EnableCaching: im lặng.",
         [IN("#ca-c5", "left", 0.4), IN("#ca-c6", "left", 8.6)]),
    ]),
    # ------------------------------------------------------------ tests
    dict(id="tests", world=(1920, 1080), hud=hud("ts", "Ba loại test", "Test này nạp gì, ra gì"), cam="".join([
        big_title("ts", "Ba loại test", "Mỗi loại nạp một phần của ứng dụng"),
        box("ts-a", 160, 190, 520, 130, "<b>@WebMvcTest</b><br>controller và security của mình, service là mock", "violet", "card"),
        box("ts-b", 700, 190, 520, 130, "<b>@DataJpaTest</b><br>repository và PostgreSQL thật, mỗi test rollback", "cyan", "card"),
        box("ts-c", 1240, 190, 520, 130, "<b>@SpringBootTest</b><br>RANDOM_PORT: toàn bộ app, luồng JWT thật", "green", "card"),
        console("ts-con", 160, 360, 1600, ["không import SecurityConfig: bean securityConfig = false",
                                          "GET /products/1 (luật của mình: public)  →  401",
                                          "POST không CSRF, ẩn danh  →  403  ·  có CSRF, không user  →  401",
                                          "@DataJpaTest: relation \"products_seq\" does not exist"]),
        chip("ts-c1", 160, 640, "Sửa: @Import(SecurityConfig.class), rồi jwt().authorities(...) hoặc @WithMockUser", "green"),
        chip("ts-c2", 160, 720, "ddl-auto chỉ mặc định create-drop cho DB nhúng: dùng profile test hoặc Flyway", "amber"),
        chip("ts-c3", 160, 800, "Có native query, lock, hành vi riêng của DB: test trên PostgreSQL thật, không phải H2", "cyan"),
    ]), beats=[
        ("Phần ba: ba loại test. Mỗi loại nạp một phần khác nhau của ứng dụng.",
         "Phần 3: mỗi loại test nạp một phần khác nhau.",
         [TYPE("#ts-big", 0.1, 0.06), IN("#ts-bsub", "blur", 0.8), OUT("#ts-big, #ts-bsub", "zoom", 3.4), IN("#ts-hud", "left", 3.8)]),
        ("Web M V C test nạp controller và security của mình, service là mock. Data JPA test nạp repository trên PostgreSQL thật. Spring Boot test chạy cả ứng dụng ở cổng ngẫu nhiên.",
         "@WebMvcTest: controller + security. @DataJpaTest: repository + DB. @SpringBootTest: cả app.",
         [IN("#ts-a", "pop", 0.4), IN("#ts-b", "pop", 4.6), IN("#ts-c", "pop", 9.0)]),
        ("Hãy đoán: Web M V C test không import cấu hình security, gọi GET products một, đường dẫn công khai. Ra mã nào? Bốn không một. Vì slice không nạp cấu hình của bạn, nó dùng security mặc định.",
         "WebMvcTest không import SecurityConfig: GET /products/1 công khai vẫn ra 401.",
         [IN("#ts-con", "up", 0.3, 0.4), IN("#ts-con-1", "type1", 0.8, 0.3), IN("#ts-con-2", "type1", 6.0, 0.3)]),
        ("POST không có token chống giả mạo thì ra bốn không ba, dù chưa đăng nhập, vì bộ lọc đó chạy trước bước xác thực. Có token đó nhưng không có user thì mới là bốn không một.",
         "POST không CSRF: 403 dù ẩn danh (CsrfFilter chạy trước). Có CSRF, không user: 401.",
         [IN("#ts-con-3", "type1", 0.4, 0.3), IN("#ts-c1", "left", 9.0)]),
        ("Data JPA test trên PostgreSQL lần đầu lỗi, thiếu bảng. Vì Boot chỉ tự tạo bảng cho database nhúng. Dùng profile test hoặc Flyway. Và có query riêng của database thì đừng test trên H2.",
         "@DataJpaTest lỗi thiếu bảng: ddl-auto chỉ tự bật cho DB nhúng. Dùng profile test hoặc Flyway.",
         [IN("#ts-con-4", "type1", 0.4, 0.3), IN("#ts-c2", "left", 3.4), IN("#ts-c3", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ checklist
    dict(id="checklist", world=(1920, 1080), hud=hud("ck", "Checklist hoàn thành", "Tự kiểm tra trước khi qua phần tiếp"), cam="".join([
        chip("ck-1", 160, 190, "Login trả token HS256, tự giải mã được header và payload", "green"),
        chip("ck-2", 160, 270, "Đủ 4 trường hợp: 401, 401 invalid_token, 403, 201", "green"),
        chip("ck-3", 160, 350, "Login sai trả 401 ProblemDetail, không phải 500", "green"),
        chip("ck-4", 160, 430, "Cache: 1 SELECT cho 3 lần GET, TTL 600, PUT xoá key, đặt hàng làm mới stock", "green"),
        chip("ck-5", 160, 510, "Đủ 3 loại test, giải thích được vì sao thiếu import SecurityConfig thì ra 401", "green"),
        chip("ck-6", 160, 590, "./mvnw test xanh toàn bộ, test cũ của Lab 4 và 5 vẫn chạy", "green"),
        el("ck-w", 160, 720, 1600, None, "Trong code thật: khoá ký lấy từ đâu? Cache nào thiếu TTL? Chỗ nào sửa dữ liệu mà không evict?", "warnbox r"),
    ]), beats=[
        ("Phần bốn: checklist. Token HS256 tự giải mã được. Đủ bốn trường hợp: bốn không một, invalid token, bốn không ba, và hai không một. Login sai trả bốn không một, không phải năm trăm.",
         "Phần 4: token giải mã được, đủ 4 trường hợp, login sai là 401 chứ không phải 500.",
         [IN("#ck-hud", "left", 0.1), IN("#ck-1", "left", 2.6), IN("#ck-2", "left", 5.0), IN("#ck-3", "left", 11.0)]),
        ("Cache: một câu SQL cho ba lần GET, thời gian sống sáu trăm, cập nhật thì xóa key, đặt hàng làm mới tồn kho. Đủ ba loại test, và test cũ vẫn xanh.",
         "Cache: 1 SELECT cho 3 GET, TTL 600, evict. Đủ 3 loại test, test cũ vẫn xanh.",
         [IN("#ck-4", "left", 0.4), IN("#ck-5", "left", 6.0), IN("#ck-6", "left", 9.4)]),
        ("Rồi nhìn lại mã nguồn thật của bạn: khóa ký lấy từ đâu, cache nào thiếu thời gian sống, chỗ nào sửa dữ liệu mà không evict.",
         "Soi code thật: khoá ký, cache thiếu TTL, chỗ sửa dữ liệu không evict.", [IN("#ck-w", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("lock", "Token", "chỉ ký, không mã hoá"),
                                                ("shield", "401 và 403", "chưa biết ai, và không đủ quyền"),
                                                ("box", "Cache", "evict mọi chỗ sửa dữ liệu"),
                                                ("grid", "Test", "import SecurityConfig, DB thật")]),
        chip("ou-next", 560, 650, "Tiếp theo: System Design và Behavioral", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay chạy lab", "cta r"),
    ]), beats=[
        ("Tóm lại: token chỉ được ký, không mã hóa. Bốn không một là chưa biết bạn là ai, bốn không ba là không đủ quyền. Cache phải evict ở mọi chỗ sửa dữ liệu. Và test security thì nhớ import cấu hình của mình.",
         "Token chỉ ký · 401 và 403 · evict mọi chỗ sửa dữ liệu · test nhớ import SecurityConfig.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 7.4), IN("#ou-c3", "pop", 10.8)]),
        ("Đây là lab cuối. Tiếp theo là system design và behavioral.", "Lab cuối. Tiếp theo: System Design và Behavioral.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy lab nhé.",
         "Mở bài học tương tác để làm quiz và tự tay chạy lab nhé.", [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
