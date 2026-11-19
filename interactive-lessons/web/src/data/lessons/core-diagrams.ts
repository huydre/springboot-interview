import timeline from "../timelines/core-diagrams.json";
import type { Lesson, Scene } from "../types";

// Review of the twelve core-mechanism diagrams in study note 06; details and measurements live in the lessons of parts 2–5.
export const coreDiagrams: Lesson = {
  slug: "core-diagrams",
  crumb: "Sơ đồ cơ chế cốt lõi",
  videoDir: "/videos/core-diagrams",
  videoVersion: "6d7ffd45",
  scenes: timeline as Scene[],
  title: "Sơ đồ cơ chế cốt lõi",
  subtitle:
    "Mười hai sơ đồ hay bị yêu cầu vẽ lại khi phỏng vấn: transaction, self-invocation, propagation, entity state, N+1, HashMap.put, ThreadPoolExecutor, luồng MVC, vòng đời bean, auto-configuration, Security + JWT, cache-aside.",
  openingQuiz: {
    question: "Cách ôn sơ đồ hiệu quả nhất theo Feynman là gì?",
    options: ["Đọc lại nhiều lần", "Xem 2 phút, gấp lại, tự vẽ ra giấy và nói to từng mũi tên, rồi so với bản gốc", "Chép lại sơ đồ", "Học thuộc tên class"],
    answer: 1,
    explain: "Chỗ vẽ sai là chỗ chưa hiểu. Widget bên dưới làm đúng việc đó: dựng lại thứ tự từng bước.",
  },
  roadmap: [
    "Chặng 1: transaction và JPA (sơ đồ 1–5).",
    "Chặng 2: Java core và Spring (sơ đồ 6–10).",
    "Chặng 3: Security, cache, và tự kiểm tra các nhánh rẽ.",
  ],
  sections: [
    {
      id: "transaction",
      title: "Phần 1: @Transactional, self-invocation, propagation",
      scene: "transaction",
      intro: [
        "**Sơ đồ 1:** Controller gọi proxy CGLIB → `TransactionInterceptor` → `JpaTransactionManager` lấy connection, `setAutoCommit(false)`, bind connection và EntityManager vào **ThreadLocal** → gọi target thật → commit, rollback khi RuntimeException/Error, **commit khi checked exception** → unbind, trả connection. **Sơ đồ 2:** `this.createOne()` gọi thẳng target nên `@Transactional` bị bỏ qua; gọi qua bean khác thì đi qua proxy của bean đó. Bẫy này áp dụng cả cho `@Async`, `@Cacheable`, `@Retryable`, `@PreAuthorize`.",
        "**Sơ đồ 3:** inner REQUIRED dùng chung physical transaction, exception qua proxy của inner đánh dấu rollback-only, outer nuốt rồi commit thì nhận `UnexpectedRollbackException`. Trong khi đó `auditLog()` REQUIRES_NEW suspend Tx1, mở Tx2 trên connection #2, commit riêng: audit vẫn được lưu, nhưng mỗi request chiếm hai connection.",
      ],
      widget: "diagram-rebuild",
      widgetTitle: "Dựng lại sơ đồ từ trí nhớ",
      quiz: {
        question: "Vì sao chuyển code sang thread khác thì mất transaction?",
        options: ["Vì proxy bị huỷ", "Vì connection và EntityManager được bind vào ThreadLocal của thread đã mở transaction", "Vì Spring cấm", "Vì DB khoá"],
        answer: 1,
        explain: "TransactionSynchronizationManager giữ resource theo thread.",
      },
    },
    {
      id: "jpa",
      title: "Phần 2: Entity state và N+1",
      scene: "jpa",
      intro: [
        "**Sơ đồ 4:** `new` là Transient → `persist()` hoặc `find()` thành **Managed** (setter → dirty checking → UPDATE lúc flush) → hết transaction, `clear()`, `detach()` thành Detached → `merge()` trả về **bản managed mới** → `remove()` thành Removed, flush sinh DELETE. Chỉ Managed mới dirty checking; chạm lazy association khi Detached thì `LazyInitializationException`.",
        "**Sơ đồ 5:** `findAll()` 1 query, rồi mỗi order một `SELECT ... WHERE order_id = ?`: 1 + N. JOIN FETCH hoặc `@EntityGraph` còn 1 query; `default_batch_fetch_size = 50` còn 1 + N/50. Bẫy: JOIN FETCH collection với `Pageable` phân trang trong memory (HHH90003004).",
      ],
      quiz: {
        question: "merge(detached) trả về gì?",
        options: ["Chính object truyền vào, đã managed", "Một bản managed mới; object truyền vào vẫn detached", "null", "Một bản transient"],
        answer: 1,
        explain: "Luôn dùng giá trị trả về.",
      },
    },
    {
      id: "java-core",
      title: "Phần 3: HashMap.put() và ThreadPoolExecutor",
      scene: "javacore",
      intro: [
        "**Sơ đồ 6:** `hash = h ^ (h >>> 16)`, `index = (n - 1) & hash`; bucket rỗng thì tạo Node; có node cùng hash và `equals` thì ghi đè; không thì thêm vào list hoặc tree. Bucket vượt 8 node: capacity ≥ 64 thì treeify, chưa thì resize. `++size > capacity × 0.75` thì resize gấp đôi. Số cần nhớ: 16, 0.75, 8, 64, 6.",
        "**Sơ đồ 7:** thread < core thì tạo thread core; không thì vào queue nếu còn chỗ; queue đầy và thread < max thì tạo thread non-core; đủ max thì `RejectedExecutionHandler` (mặc định AbortPolicy, CallerRunsPolicy tạo back-pressure). Queue không giới hạn làm pool không bao giờ lên max, task dồn tới OOM.",
      ],
      quiz: {
        question: "Thứ tự ThreadPoolExecutor xử lý khi submit task?",
        options: ["Tạo tới max rồi mới xếp hàng", "core → queue → tạo tới max → reject", "queue → core → max", "Luôn tạo thread mới"],
        answer: 1,
        explain: "Đây là điểm hay bị hiểu ngược.",
      },
    },
    {
      id: "spring",
      title: "Phần 4: Luồng MVC, vòng đời bean, auto-configuration",
      scene: "spring",
      intro: [
        "**Sơ đồ 8:** Tomcat worker thread → Filter chain → `DispatcherServlet` → `HandlerMapping` → `preHandle()` → `HandlerAdapter` đọc body bằng `HttpMessageConverter`, `@Valid` → controller → ghi JSON → `postHandle()` (bỏ qua khi có exception) → `@RestControllerAdvice` nếu lỗi → `afterCompletion()`. **Sơ đồ 9:** instantiate → populate → Aware → before-init (`@PostConstruct`) → `afterPropertiesSet()` → after-init **tạo AOP proxy** → sẵn sàng → `@PreDestroy`.",
        "**Sơ đồ 10:** `@EnableAutoConfiguration` → `AutoConfigurationImportSelector` đọc `META-INF/spring/...AutoConfiguration.imports` → mỗi auto-config qua `@ConditionalOnClass`, `@ConditionalOnProperty`, `@ConditionalOnMissingBean`. Bean của bạn được `@ComponentScan` xử lý trước nên auto-config lùi lại. Debug bằng `--debug` hoặc `/actuator/conditions`.",
      ],
      widget: "diagram-outcome",
      widgetTitle: "Đi theo nhánh rẽ của sơ đồ",
      quiz: {
        question: "AOP proxy được tạo ở bước nào của vòng đời bean?",
        options: ["Khi gọi constructor", "postProcessAfterInitialization, sau @PostConstruct", "Khi context đóng", "Trong @PostConstruct"],
        answer: 1,
        explain: "Vì vậy logic cần transaction lúc khởi động đặt ở ApplicationReadyEvent.",
      },
    },
    {
      id: "security-cache",
      title: "Phần 5: Spring Security + JWT và cache-aside",
      scene: "securitycache",
      intro: [
        "**Sơ đồ 11:** đăng nhập: `AuthenticationManager` → `UserDetailsService` + BCrypt → trả access token ngắn hạn và refresh token. Gọi API: `FilterChainProxy` → `BearerTokenAuthenticationFilter` verify chữ ký và `exp`, đọc claims → set `Authentication` vào `SecurityContextHolder` (ThreadLocal) → `AuthorizationFilter`. Token sai hoặc hết hạn: **401**; thiếu quyền: **403**.",
        "**Sơ đồ 12:** đọc `@Cacheable`: GET key, hit thì trả, miss thì SELECT rồi SET kèm TTL và jitter. Ghi `@CacheEvict`: UPDATE DB rồi DEL key. Ba sự cố: penetration (key không tồn tại), stampede (key nóng hết hạn), avalanche (nhiều key hết hạn cùng lúc).",
      ],
      widget: "cache-incident",
      widgetTitle: "Sự cố cache nào",
      quiz: {
        question: "Vì sao ghi theo cache-aside là UPDATE DB rồi DEL key, thay vì SET giá trị mới?",
        options: ["Vì SET chậm", "Xoá để lần đọc sau tự load bản mới từ DB, tránh hai request ghi xen nhau để lại giá trị cũ trong cache", "Vì Redis không cho SET", "Không có lý do"],
        answer: 1,
        explain: "Chi tiết race khi ghi ở bài Redis Cache.",
      },
    },
  ],
  modelAnswer:
    "Khi được yêu cầu vẽ cơ chế @Transactional, em vẽ: controller gọi proxy CGLIB, TransactionInterceptor nhờ transaction manager lấy connection, tắt autocommit và bind connection cùng EntityManager vào ThreadLocal, rồi gọi method thật; thành công thì commit, RuntimeException hoặc Error thì rollback, còn checked exception mặc định vẫn commit; cuối cùng unbind và trả connection về pool. Từ sơ đồ này em suy ra các bẫy: gọi qua this thì không qua proxy, đổi thread thì mất transaction, và inner REQUIRED lỗi thì cả transaction ngoài bị đánh dấu rollback-only. Em ôn mười hai sơ đồ bằng cách gấp tài liệu lại, tự vẽ ra giấy và nói to từng mũi tên.",
};
