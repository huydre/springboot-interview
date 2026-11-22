import timeline from "../timelines/testing.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs from a Spring Boot 3.5 project (JUnit 5, Mockito, Testcontainers 1.21) on JDK 21 with real PostgreSQL 16, Redis 7 and
// Kafka 3.9.1 in Docker; see study note 03.12.
export const testing: Lesson = {
  slug: "testing",
  crumb: "Testing Spring Boot",
  videoDir: "/videos/testing-spring-boot",
  // Per-scene clips cut by `video-kit/pipeline.py testing-video publish`, which also rewrites videoVersion.
  videoVersion: "ee7a061c",
  scenes: timeline as Scene[],
  title: "Testing Spring Boot",
  subtitle:
    "Test pyramid, JUnit 5 và Mockito, @WebMvcTest và MockMvc, @MockitoBean, @DataJpaTest và bẫy H2, @SpringBootTest với Testcontainers và @ServiceConnection, và test flaky.",
  openingQuiz: {
    question: "Native query dùng ON CONFLICT (sku) DO NOTHING. Test bằng @DataJpaTest mặc định thì sao?",
    options: [
      "Pass, giống production",
      "Lỗi cú pháp vì @DataJpaTest mặc định thay DataSource bằng H2",
      "Bị bỏ qua",
      "Pass nhưng chậm",
    ],
    answer: 1,
    explain: "Đã chạy: H2 ném InvalidDataAccessResourceUsageException. Trên PostgreSQL 16 qua Testcontainers, lần 1 trả 1, lần 2 trả 0 đúng ý.",
  },
  roadmap: [
    "Chặng 1: test pyramid, unit test với Mockito.",
    "Chặng 2: @WebMvcTest, @MockitoBean, @DataJpaTest và bẫy H2.",
    "Chặng 3: @SpringBootTest với Testcontainers, context caching, test flaky.",
  ],
  sections: [
    {
      id: "pyramid",
      title: "Phần 1: Test pyramid",
      scene: "pyramid",
      intro: [
        "Test càng thật càng chậm và dễ **flaky** (lúc pass lúc fail dù code không đổi, Phần 6) nhưng càng đáng tin: nhiều unit test ở đáy, ít test nặng ở đỉnh. Từ đáy lên:",
        "- **Unit** (Mockito, không Spring): logic nghiệp vụ.",
        "- **`@WebMvcTest`**: URL, validate, JSON, status.",
        "- **`@DataJpaTest`**: query và mapping.",
        "- **`@SpringBootTest`**: luồng xuyên tầng, transaction, cache, Kafka.",
        "Đã đo thời gian từng class test, gồm cả phần khởi động: unit khoảng 1 s, `@WebMvcTest` 0,8 s, `@DataJpaTest` H2 2,1 s, PostgreSQL container 19 s, Redis container 23 s, Kafka container 72 s (có 20 s chờ cố ý). Class unit trông chậm hơn `@WebMvcTest` vì con số tính cả chi phí khởi động một lần như nạp Mockito và sinh class mock, không phải vì từng unit test chậm. Con số tuyệt đối tùy máy; điều đáng nhìn là chênh lệch hàng chục lần giữa đáy và đỉnh.",
        "Viết toàn `@SpringBootTest` thì suite chạy 20 phút và dev bỏ test; mock hết mọi thứ thì test xanh mà query sai vẫn lọt.",
        "Test **hành vi** (behavior), đừng test **cách cài đặt** (implementation): kiểm tra kết quả nhìn thấy từ bên ngoài (giá trị trả về, dữ liệu đã lưu, response), thay vì `verify` từng lời gọi nội bộ. Test cách cài đặt thì refactor một chút là đỏ hàng loạt dù hành vi không đổi.",
      ],
      widget: "test-pyramid",
      widgetTitle: "Kiểm tra này thuộc tầng nào",
      takeaway: {
        lines: ["Mỗi kiểm tra đặt ở tầng thấp nhất còn bắt được lỗi đó. Tầng đỉnh chậm hơn đáy hàng chục lần, nên chỉ để ít."],
      },
      quiz: {
        question: "Test kiểm tra \"implementation\" thay vì \"behavior\" có hại gì?",
        options: ["Không hại gì", "verify từng lời gọi nội bộ nên refactor một chút là đỏ hàng loạt dù hành vi không đổi", "Chạy chậm hơn", "Không biên dịch được"],
        answer: 1,
        explain: "Kiểm tra kết quả quan sát được từ bên ngoài.",
      },
    },
    {
      id: "mockito",
      title: "Phần 2: Unit test với JUnit 5 và Mockito",
      scene: "mockito",
      intro: [
        "Đáy của pyramid là unit test, và công cụ chính ở đó là Mockito. Năm công cụ của Mockito, mỗi cái một việc. **Stub** nghĩa là dặn mock trả gì khi được gọi, ví dụ `when(repo.findById(9L)).thenReturn(Optional.of(p))`.",
        "- **`@Mock`**: object giả hoàn toàn. Method chưa stub trả giá trị rỗng (`Optional.empty`, `0`, `[]`).",
        "- **`@Spy`**: bọc một object thật; method chưa stub chạy code thật.",
        "- **`@InjectMocks`**: tạo object của class cần test và tiêm các mock vào nó.",
        "- **`verify`**: kiểm tra mock đã được gọi đúng cách, ví dụ `verify(repo, times(1)).findById(...)`.",
        "- **`ArgumentCaptor`**: bắt lại tham số đã truyền vào mock để kiểm tra chi tiết.",
        "Ví dụ đã chạy với `ArgumentCaptor`: stub `repo.findById(9L)`, gọi `service.getProduct(9L)`, rồi `verify(repo).findById(idCaptor.capture())`; captor giữ đúng giá trị service đã truyền xuống: `captured id=9`.",
        "Bẫy spy: `when(spy.get(5))` gọi method thật trước khi stub và ném `IndexOutOfBoundsException`; dùng `doReturn(...).when(spy)`.",
        "`MockitoExtension` mặc định **strict**: stub mà code không dùng thì fail với `UnnecessaryStubbingException`. Đây là tính năng: stub thừa thường nghĩa là test đang kiểm tra sai thứ.",
        "Mock ở **ranh giới** (repository, client API ngoài, `Clock`), không mock DTO hay chính class đang test. Tránh `any()` khắp nơi trong `verify`: test vẫn pass dù truyền sai tham số.",
      ],
      predict: {
        question: "Gọi `add(\"a\")` rồi `size()` trên một **mock** `ArrayList` và trên một **spy** bọc `ArrayList` thật. `size()` trả gì?",
        options: ["Mock 1, spy 1", "Mock 0, spy 1", "Mock 1, spy 0", "Cả hai ném exception"],
        answer: 1,
        explain: "Mock không chạy code thật: method chưa stub trả giá trị rỗng, nên `size()` là 0. Spy chạy code thật nên `add` thật sự thêm phần tử.",
      },
      widget: "mock-spy",
      widgetTitle: "Mock và spy trên ArrayList",
      quiz: {
        question: "Có nên unit test interface repository của Spring Data?",
        options: [
          "Có, mock repository rồi verify",
          "Không: query tự viết thì test bằng @DataJpaTest với DB thật; findById, save của framework thì không cần test",
          "Chỉ khi dùng H2",
          "Luôn dùng @SpringBootTest",
        ],
        answer: 1,
        explain: "Mock repository thì chẳng kiểm tra được gì.",
      },
    },
    {
      id: "webmvc",
      title: "Phần 3: @WebMvcTest, MockMvc và @MockitoBean",
      scene: "webmvc",
      intro: [
        "Tầng tiếp theo của pyramid là web. `@WebMvcTest(OrderController.class)` là một **slice test**: chỉ dựng một lát của ứng dụng, ở đây là tầng web: controller, `@RestControllerAdvice`, Jackson, validation, filter, Security; không có service, repository.",
        "Phụ thuộc của controller thay bằng `@MockitoBean` (Spring 6.2, Boot 3.4+). `@MockBean` cũ vẫn chạy nhưng biên dịch báo \"deprecated and marked for removal\". `@Mock` của Mockito không vào context. Mỗi tổ hợp `@MockitoBean` khác nhau tạo một context mới trong **context cache** (Phần 5): gom về base class.",
      ],
      predict: {
        question: "Trong `@WebMvcTest`, class `SecurityConfig` của bạn không được nạp. Gửi `POST /api/orders` **chưa đăng nhập và thiếu CSRF token**. Kết quả?",
        options: ["201, vì slice không có security", "401, vì chưa đăng nhập", "403, vì thiếu CSRF token", "404, vì không có service"],
        answer: 2,
        explain: "Slice vẫn bật security mặc định của Boot, có CSRF. `CsrfFilter` đứng trước `AuthorizationFilter` nên POST thiếu token bị chặn 403 trước cả bước kiểm tra đăng nhập.",
      },
      widget: "webmvc-slice",
      widgetTitle: "POST /api/orders trong slice",
      after: [
        "Đã kiểm tra: class `SecurityConfig` của mình **không** có trong context, nên slice dùng security mặc định của Boot: không user ra 401, POST thiếu CSRF ra 403. Test rule thật thì `@Import(SecurityConfig.class)` và `.with(jwt())`.",
      ],
      quiz: {
        question: "Dùng @Mock thay @MockitoBean trong @WebMvcTest thì sao?",
        options: ["Như nhau", "Mock không được đưa vào context, controller vẫn đòi bean thật: NoSuchBeanDefinitionException", "Nhanh hơn", "Tự chuyển thành MockitoBean"],
        answer: 1,
        explain: "@Mock thuộc Mockito, không liên quan Spring.",
      },
      parts: [
        {
          id: "security-test",
          title: "Test phân quyền: @WithMockUser và jwt()",
          intro: [
            "Slice ở trên đã cho thấy security vẫn chạy trong `@WebMvcTest`. Vậy làm sao test đúng rule \"chỉ ADMIN được xoá đơn\" mà không phải xin token thật?",
            "Thư viện `spring-security-test` (Boot 3 khai báo dependency `spring-security-test` scope test; Boot 4 có sẵn `spring-boot-starter-security-test`) cho ba cách đặt user giả vào request:",
            "- **`@WithMockUser(roles = \"ADMIN\")`** trên method test: user tên `user`, authority `ROLE_ADMIN`. Viết `roles` thì không cần tiền tố `ROLE_`, viết `authorities` thì phải ghi đủ.",
            "- **`@WithAnonymousUser`**: request như chưa đăng nhập, để kiểm tra 401.",
            "- **`.with(jwt().authorities(new SimpleGrantedAuthority(\"ROLE_ADMIN\")))`** trên từng request MockMvc: tạo một `JwtAuthenticationToken` giả, đúng loại mà resource server sinh ra.",
            "POST, PUT, DELETE còn cần `.with(csrf())` nếu chain chưa tắt CSRF. Mỗi rule nên có đủ ba test: không đăng nhập ra **401**, đăng nhập thiếu quyền ra **403**, đủ quyền ra **2xx**.",
          ],
          widgetTitle: "Test DELETE /api/orders/1 chỉ cho ADMIN",
          compare: [
            way(
              "@WithMockUser",
              `@Test @WithMockUser(roles = "USER")
void userBiChan() throws Exception {
  mvc.perform(delete("/api/orders/1").with(csrf()))
     .andExpect(status().isForbidden());           // 403
}

@Test @WithAnonymousUser
void chuaDangNhap() throws Exception {
  mvc.perform(delete("/api/orders/1").with(csrf()))
     .andExpect(status().isUnauthorized());        // 401
}`,
              [
                ask("Kiểm tra `hasRole('ADMIN')`", ok("Đủ: rule chỉ nhìn authority, mà `@WithMockUser` đặt sẵn `ROLE_USER` hay `ROLE_ADMIN`.")),
                ask("Controller đọc `@AuthenticationPrincipal Jwt jwt`", bad("Principal là user giả kiểu `User`, không phải `Jwt`, nên tham số này là `null`.")),
              ],
              "Gọn, đủ cho rule theo role.",
            ),
            way(
              ".with(jwt())",
              `mvc.perform(delete("/api/orders/1")
        .with(jwt()
            .jwt(j -> j.subject("alice").claim("roles", List.of("ADMIN")))
            .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
   .andExpect(status().isNoContent());             // 204`,
              [
                ask("Kiểm tra `hasRole('ADMIN')`", ok("Đủ, authority khai báo trong `.authorities(...)`.")),
                ask("Controller đọc `@AuthenticationPrincipal Jwt jwt`", ok("Có `Jwt` với `sub = alice` và claim `roles`, giống request thật.")),
              ],
              "Dùng khi code đọc claim từ token.",
            ),
          ],
          after: [
            "Nhớ chuyện ở trên: muốn test rule **của bạn** thì `@Import(SecurityConfig.class)`, nếu không slice chạy security mặc định của Boot. `.with(jwt())` đặt authority trực tiếp, **không** chạy converter `roles` → `ROLE_` của bạn; muốn kiểm tra converter đó thì viết test riêng cho nó.",
          ],
          takeaway: {
            lines: ["Mỗi rule phân quyền ba test: 401 (`@WithAnonymousUser`), 403 (thiếu role), 2xx (đủ role). Code đọc claim thì dùng `.with(jwt())`."],
          },
          quiz: {
            question: "Endpoint có `@PreAuthorize(\"hasRole('ADMIN')\")`. Test chạy với `@WithMockUser(roles = \"USER\")` và đã có `.with(csrf())`. Mong đợi mã nào?",
            options: ["200", "401, vì user giả không phải user thật", "403, vì đã xác thực nhưng thiếu `ROLE_ADMIN`", "500"],
            answer: 2,
            explain: "`@WithMockUser` tạo một user **đã xác thực**, nên thiếu quyền là 403 chứ không phải 401. Muốn 401 thì dùng `@WithAnonymousUser`.",
          },
        },
      ],
    },
    {
      id: "datajpa",
      title: "Phần 4: @DataJpaTest và bẫy H2",
      scene: "datajpa",
      intro: [
        "Tầng web xong thì tới tầng dữ liệu. `@DataJpaTest` chỉ load JPA, thay DataSource bằng H2, mỗi test chạy trong transaction rồi rollback: đã thấy URL `jdbc:h2:mem:...`, test kế tiếp đếm ra 0 dòng. Gọi `em.flush(); em.clear();` để SQL chạy thật và không đọc lại object từ persistence context; quên flush thì lỗi constraint không bao giờ nổ vì test rollback.",
        "Transaction của test chỉ bao phủ **thread của test**. Code `@Async` chạy ở thread khác nên không thấy transaction đó: dữ liệu nó ghi được commit thật và không bị rollback.",
        "H2 khác PostgreSQL ở nhiều chỗ:",
        "- **`ON CONFLICT`**: lỗi cú pháp trên H2 nhưng đúng trên PostgreSQL 16.",
        "- **Kiểu và hành vi riêng**: `jsonb`, collation, `FOR UPDATE SKIP LOCKED`.",
        "- **Migration Flyway**: viết cho PostgreSQL thì chưa chắc chạy trên H2.",
        "Test repository trên Testcontainers cùng version production. Chuyển sang container mà quên `ddl-auto` thì gặp `relation \"product\" does not exist`, vì Boot chỉ tự tạo schema cho DB nhúng.",
      ],
      takeaway: {
        lines: ["Test repository trên DB thật cùng version production. H2 xanh không có nghĩa là PostgreSQL xanh."],
      },
      quiz: {
        question: "Code trong @Async ghi dữ liệu khi chạy @DataJpaTest thì sao?",
        options: ["Bị rollback như bình thường", "Thread đó không thấy transaction của test và dữ liệu nó ghi không bị rollback", "Không chạy", "Ném exception"],
        answer: 1,
        explain: "Transaction của test chỉ bao phủ thread của test.",
      },
    },
    {
      id: "testcontainers",
      title: "Phần 5: @SpringBootTest với Testcontainers",
      scene: "containers",
      intro: [
        "Phần 4 cần DB thật, và đỉnh pyramid cần cả Redis, Kafka thật. Testcontainers chạy PostgreSQL, Redis, Kafka thật trong Docker trong lúc test. Từ Boot 3.1, `@ServiceConnection` tự tạo `ConnectionDetails` nên không cần `@DynamicPropertySource` chép URL; `GenericContainer` cho Redis phải ghi `name = \"redis\"`: container generic không có kiểu riêng, nên Boot cần tên để biết phải tạo `ConnectionDetails` loại nào. Đã chạy cả ba: key `product::1` TTL 600, `PostgreSQL 16.14`, `KafkaTemplate` gửi vào broker trong container.",
        "Bốn quy tắc:",
        "- **Container `static`**: không thì mỗi test method khởi động container mới.",
        "- **Ghim version image**: đừng dùng `latest`.",
        "- **Tự dọn dữ liệu**: `@SpringBootTest` không tự rollback; `RANDOM_PORT` gọi HTTP thật chạy trên thread của Tomcat.",
        "- **Tránh `@DirtiesContext`**: rải khắp nơi thì phá context cache.",
        "**Context cache**: Spring Test dùng lại một application context cho mọi test class có cấu hình giống hệt nhau, nên chỉ class đầu tiên phải chờ khởi động. Khác một chút thôi (một `@MockitoBean` khác, một property khác, `@DirtiesContext`) là phải dựng context mới.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Cấu hình test giống hệt nhau → dùng lại một context → chỉ class đầu tiên chờ khởi động. Mỗi `@MockitoBean` hay property khác là thêm một context mới."],
      },
      quiz: {
        question: "@SpringBootTest có tự rollback như @DataJpaTest không?",
        options: ["Có", "Không tự động; thêm @Transactional thì rollback code cùng thread (MockMvc được), RANDOM_PORT thì phải tự dọn", "Chỉ với H2", "Chỉ khi có Testcontainers"],
        answer: 1,
        explain: "Request HTTP thật chạy trên thread khác.",
      },
    },
    {
      id: "flaky",
      title: "Phần 6: Test flaky",
      scene: "flaky",
      intro: [
        "Test flaky lúc pass lúc fail mà code không đổi, nguy hiểm hơn test fail hẳn vì team quen \"chạy lại cho xanh\". Nguyên nhân hay gặp:",
        "- **Thời gian**: `LocalDate.now()` lúc nửa đêm. Sửa bằng `Clock` cố định.",
        "- **Bất đồng bộ**: `Thread.sleep` rồi assert. Sửa bằng Awaitility `await().atMost(10, SECONDS).until(...)`.",
        "- **Thứ tự**: phụ thuộc dữ liệu test khác để lại, thứ tự HashMap.",
        "Mỗi test tự chuẩn bị và dọn dữ liệu, không assert thứ tự khi không được đảm bảo, ghim version container.",
      ],
      quiz: {
        question: "Test kiểm tra consumer Kafka bằng Thread.sleep(1000) rồi assert. Vấn đề và cách sửa?",
        options: [
          "Không vấn đề",
          "Máy chậm thì 1 s chưa đủ, máy nhanh thì phí thời gian; dùng Awaitility chờ tới khi điều kiện đúng hoặc hết hạn",
          "Tăng lên 10 s là xong",
          "Bỏ assert",
        ],
        answer: 1,
        explain: "Awaitility poll điều kiện và dừng ngay khi đúng.",
      },
    },
  ],
  modelAnswer:
    "Em theo test pyramid: nhiều unit test JUnit và Mockito cho logic nghiệp vụ, mock ở ranh giới như repository hay client API ngoài; @WebMvcTest với MockMvc cho controller, validate và format lỗi, nhớ là cấu hình security của mình không tự nạp vào slice nên em @Import nó; @DataJpaTest cho query tự viết, nhưng chạy trên PostgreSQL qua Testcontainers vì em đã gặp native query ON CONFLICT lỗi cú pháp trên H2; và một ít @SpringBootTest với Testcontainers và @ServiceConnection cho luồng xuyên tầng như cache Redis hay Kafka. Em dùng @MockitoBean thay @MockBean đã deprecated, giữ container static và cấu hình test đồng nhất để tận dụng context cache. Test flaky em sửa tận gốc: inject Clock, dùng Awaitility thay sleep, mỗi test tự chuẩn bị dữ liệu.",
};
