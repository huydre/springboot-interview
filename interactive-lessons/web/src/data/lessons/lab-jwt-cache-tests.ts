import timeline from "../timelines/lab-jwt-cache-tests.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.07 on order-service: JWT resource server, Redis cache, three kinds of tests, all on Testcontainers.
// Solution: labs/order-service/. Video not rendered yet: scenes stay empty until publish.
export const labJwtCacheTests: Lesson = {
  slug: "lab-jwt-cache-tests",
  crumb: "Lab 7: JWT, Cache & Tests",
  videoDir: "/videos/lab-jwt-cache-tests",
  videoVersion: "c0976e4d",
  scenes: timeline as Scene[],
  title: "Lab 7: JWT, Cache & Tests",
  subtitle:
    "JWT HS256 với phân quyền và 401 so với 403, @Cacheable với Redis thật có TTL và evict, ba loại test @WebMvcTest, @DataJpaTest và integration test Testcontainers. Lab cuối của lộ trình.",
  openingQuiz: {
    question: "Payload của JWT HS256 có được mã hoá không?",
    options: ["Có, bằng HS256", "Không: chỉ được ký; giải mã base64url là đọc được", "Chỉ phần roles", "Tuỳ thư viện"],
    answer: 1,
    explain: "Không bao giờ đặt dữ liệu nhạy cảm vào payload.",
  },
  roadmap: [
    "Chặng 1: JWT, phân quyền, 401 và 403.",
    "Chặng 2: Redis cache, TTL, evict.",
    "Chặng 3: ba loại test và checklist.",
  ],
  sections: [
    {
      id: "jwt",
      title: "Phần 1: JWT, phân quyền và 401 so với 403",
      scene: "jwt",
      intro: [
        "Thêm `spring-boot-starter-security`, `oauth2-resource-server` (verify JWT, `NimbusJwtEncoder` để ký), data-redis, cache, `spring-security-test`. Hai user trong bộ nhớ, BCrypt: `admin` (ADMIN, USER) và `user` (USER). `POST /auth/login` trả `accessToken`, `tokenType`, `expiresIn: 900`; token HS256 có `iss`, `sub`, `iat`, `exp` và claim `roles`.",
        "Luật phân quyền:",
        "- **Công khai**: login, health, `GET /products/**`.",
        "- **Cần ADMIN**: ghi products và customers.",
        "- **Còn lại**: cần token hợp lệ.",
        "Bẫy login sai ra 500: login sai làm Spring ném `BadCredentialsException`. Nếu `@RestControllerAdvice` có handler bắt `Exception.class` chung, nó nuốt luôn lỗi này và trả 500. Cần một handler riêng cho `AuthenticationException`, trả 401.",
        "Profile test đặt `spring.cache.type: none` để test cũ không vỡ: các test viết trước lab này không có Redis chạy, bật cache Redis thì chúng lỗi kết nối.",
      ],
      predict: {
        question: "User `user` (chỉ có role USER) đăng nhập đúng, dùng token hợp lệ để tạo product. Server trả gì?",
        options: ["201", "401 `invalid_token`", "403 `insufficient_scope`", "500"],
        answer: 2,
        explain: "Token hợp lệ nên xác thực qua. Ghi products cần ADMIN mà user chỉ có USER, nên thiếu quyền: 403.",
      },
      widget: "auth-matrix",
      widgetTitle: "Ai gọi gì thì ra mã nào",
      after: [
        "Đã đo qua HTTP thật:",
        "- **Không token**: **401** `Bearer`.",
        "- **Token sửa chữ ký**: **401** `invalid_token`.",
        "- **USER tạo product**: **403** `insufficient_scope`.",
        "- **USER đặt hàng**: **201**.",
        "- **Login sai**: **401** ProblemDetail.",
      ],
      quiz: {
        question: "Login sai mật khẩu nên trả gì?",
        options: ["500", "401 ProblemDetail \"Invalid username or password\"", "403", "200 với token rỗng"],
        answer: 1,
        explain: "Sai mật khẩu là xác thực thất bại, nên là 401. Ra 500 thường do advice bắt Exception chung đã nuốt BadCredentialsException.",
      },
    },
    {
      id: "cache",
      title: "Phần 2: @Cacheable với Redis, TTL và evict",
      scene: "cache",
      intro: [
        "Đã có phân quyền, giờ thêm cache cho product. `findById` có `@Cacheable(cacheNames = \"product\", key = \"#id\")`, `update` và `delete` có `@CacheEvict`; TTL 10 phút, lưu JSON vì DTO là record không `Serializable`. Không cache null: nếu cache kết quả \"không có\" cho một id, product tạo sau đó với id này vẫn hiện là không tồn tại tới hết TTL.",
        "Test với Redis và PostgreSQL thật, đếm **tổng số câu SQL tích luỹ** sau mỗi bước: GET, GET, GET, PUT, GET.",
      ],
      predict: {
        question: "Ba lần GET đầu cho tổng 1 câu SQL. PUT chạy SELECT rồi UPDATE và evict cache, tổng thành 3. GET cuối cùng đưa tổng lên bao nhiêu?",
        options: ["3, vì GET trúng cache", "4, vì cache đã bị evict nên phải SELECT lại", "5", "6"],
        answer: 1,
        explain: "`@CacheEvict` xoá entry khi PUT, nên GET tiếp theo miss cache và chạy thêm một SELECT.",
      },
      widget: "cache-steps",
      widgetTitle: "Đi từng bước, đếm SQL",
      after: [
        "Kết quả đã đo: GET 1, GET 1, GET 1, PUT 3, GET 4.",
        "- **GET đầu**: chạy 1 SELECT, tổng 1.",
        "- **Hai GET sau**: trúng cache nên tổng vẫn 1.",
        "- **PUT**: thêm 2 câu (SELECT rồi UPDATE) và evict cache, tổng 3.",
        "- **GET cuối**: miss cache, thêm 1 SELECT, tổng 4.",
        "TTL đọc được là **600**.",
        "Chỗ khác làm đổi dữ liệu đang cache: đặt hàng trừ kho. Đã đo: cache giữ stock 10, đặt 2 cái, GET trả **8** nhờ `OrderService` evict từng product nó trừ kho.",
      ],
      takeaway: {
        lines: ["Mọi chỗ sửa dữ liệu đang cache đều phải evict, kể cả chỗ ngoài `ProductService` như đặt hàng trừ kho."],
      },
      quiz: {
        question: "Vì sao giá trị trong Redis có \"@class\" lại là rủi ro khi deploy?",
        options: ["Tốn bộ nhớ", "Đổi tên hoặc package DTO thì cache cũ không đọc được; cần đổi tên cache hoặc thêm tiền tố version", "Lộ mật khẩu", "Làm chậm"],
        answer: 1,
        explain: "Giá trị thật: {\"@class\":\"com.shop.orderservice.product.ProductDtos$ProductResponse\", ...}.",
      },
    },
    {
      id: "tests",
      title: "Phần 3: Ba loại test",
      scene: "tests",
      intro: [
        "JWT và cache đã chạy, giờ khoá chúng lại bằng test. Ba loại:",
        "- **`@WebMvcTest` + `@MockitoBean`**: kiểm luật security của `ProductController` (phải `@Import(SecurityConfig.class)`).",
        "- **`@DataJpaTest`**: kiểm `decreaseStockAtomically` trên PostgreSQL thật.",
        "- **`@SpringBootTest(RANDOM_PORT)` với `@ServiceConnection`**: chính là test luồng JWT.",
        "Hai bẫy đã đo:",
        "- **`@WebMvcTest` không import `SecurityConfig`**: `GET /products/1` ra **401** dù luật cho phép.",
        "- **`@DataJpaTest` trên PostgreSQL**: lần đầu lỗi `relation \"products_seq\" does not exist` vì `ddl-auto` mặc định chỉ là `create-drop` cho DB nhúng.",
      ],
      widget: "test-slices",
      widgetTitle: "Test này nạp gì, ra gì",
      quiz: {
        question: "@DataJpaTest nên chạy trên H2 hay DB thật?",
        options: ["Luôn H2", "DB thật qua Testcontainers khi có native query, lock hoặc hành vi riêng của DB; cần profile hoặc Flyway để tạo bảng", "Không cần DB", "Chỉ MySQL"],
        answer: 1,
        explain: "H2 khác PostgreSQL về dialect, lock, index.",
      },
    },
    {
      id: "checklist",
      title: "Phần 4: Checklist hoàn thành",
      scene: "checklist",
      intro: [
        "Kiểm tra trong code thật:",
        "- **Khoá ký JWT**: lấy từ đâu.",
        "- **Login sai**: trả 401 hay 500.",
        "- **TTL**: cache nào không có TTL.",
        "- **Evict**: chỗ nào sửa dữ liệu mà không evict.",
        "Lab xong thì chuyển sang System Design & Behavioral.",
      ],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 7",
    },
  ],
  modelAnswer:
    "Trong order-service em làm luồng JWT bằng resource server của Spring Security: login kiểm tra BCrypt rồi ký token HS256 có roles và hạn 15 phút, mỗi request đi qua filter verify chữ ký và exp. Em đo đủ các trường hợp: không token hoặc token sửa chữ ký là 401, user thường tạo product là 403, login sai là 401 chứ không phải 500. Cache product bằng Redis: ba lần GET chỉ một SELECT, TTL 600 giây, cập nhật thì evict, và đặt hàng cũng evict product bị trừ kho để không hiển thị stock cũ. Em viết ba loại test: WebMvcTest phải import SecurityConfig nếu không sẽ ra 401, DataJpaTest trên PostgreSQL thật cần profile để tạo bảng, và integration test Testcontainers cho cả luồng.",
};
