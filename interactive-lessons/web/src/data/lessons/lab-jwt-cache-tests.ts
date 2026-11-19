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
        "Luật: login, health, `GET /products/**` công khai; ghi products và customers cần ADMIN; còn lại cần token hợp lệ. Đã đo qua HTTP thật: không token **401** `Bearer`; token sửa chữ ký **401** `invalid_token`; USER tạo product **403** `insufficient_scope`; USER đặt hàng **201**; login sai **401** ProblemDetail. Profile test đặt `spring.cache.type: none` để test cũ không vỡ.",
      ],
      widget: "auth-matrix",
      widgetTitle: "Ai gọi gì thì ra mã nào",
      quiz: {
        question: "Login sai mật khẩu nên trả gì?",
        options: ["500", "401 ProblemDetail \"Invalid username or password\"", "403", "200 với token rỗng"],
        answer: 1,
        explain: "Checklist lab 7 yêu cầu rõ: 401, không phải 500.",
      },
    },
    {
      id: "cache",
      title: "Phần 2: @Cacheable với Redis, TTL và evict",
      scene: "cache",
      intro: [
        "`findById` có `@Cacheable(cacheNames = \"product\", key = \"#id\")`, `update` và `delete` có `@CacheEvict`; TTL 10 phút, lưu JSON vì DTO là record không `Serializable`, không cache null. Test với Redis và PostgreSQL thật, đếm statement sau từng bước: GET 1, GET 1, GET 1, PUT 3, GET 4. TTL đọc được là **600**.",
        "Chỗ khác làm đổi dữ liệu đang cache: đặt hàng trừ kho. Đã đo: cache giữ stock 10, đặt 2 cái, GET trả **8** nhờ `OrderService` evict từng product nó trừ kho.",
      ],
      widget: "cache-steps",
      widgetTitle: "Đi từng bước, đếm SQL",
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
        "`@WebMvcTest` + `@MockitoBean` kiểm luật security của `ProductController` (phải `@Import(SecurityConfig.class)`); `@DataJpaTest` kiểm `decreaseStockAtomically` trên PostgreSQL thật; `@SpringBootTest(RANDOM_PORT)` với `@ServiceConnection` chính là test luồng JWT.",
        "Hai bẫy đã đo: `@WebMvcTest` không import `SecurityConfig` thì `GET /products/1` ra **401** dù luật cho phép; `@DataJpaTest` trên PostgreSQL lần đầu lỗi `relation \"products_seq\" does not exist` vì `ddl-auto` mặc định chỉ là `create-drop` cho DB nhúng.",
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
      intro: ["Kiểm tra trong code thật: khoá ký JWT lấy từ đâu, login sai trả 401 hay 500, cache nào không có TTL, chỗ nào sửa dữ liệu mà không evict. Lab xong thì chuyển sang System Design & Behavioral."],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 7",
    },
  ],
  modelAnswer:
    "Trong order-service em làm luồng JWT bằng resource server của Spring Security: login kiểm tra BCrypt rồi ký token HS256 có roles và hạn 15 phút, mỗi request đi qua filter verify chữ ký và exp. Em đo đủ các trường hợp: không token hoặc token sửa chữ ký là 401, user thường tạo product là 403, login sai là 401 chứ không phải 500. Cache product bằng Redis: ba lần GET chỉ một SELECT, TTL 600 giây, cập nhật thì evict, và đặt hàng cũng evict product bị trừ kho để không hiển thị stock cũ. Em viết ba loại test: WebMvcTest phải import SecurityConfig nếu không sẽ ra 401, DataJpaTest trên PostgreSQL thật cần profile để tạo bảng, và integration test Testcontainers cho cả luồng.",
};
