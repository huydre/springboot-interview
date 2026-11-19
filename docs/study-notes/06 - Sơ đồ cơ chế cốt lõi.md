# Sơ đồ cơ chế cốt lõi

> Xem trực tiếp trên GitHub, trong VS Code (extension "Markdown Preview Mermaid Support"), IntelliJ hoặc tại https://mermaid.live.
> **Cách học theo Feynman:** xem sơ đồ 2 phút → gấp lại → **tự vẽ lại ra giấy** và giải thích to từng mũi tên → so sánh với bản gốc. Chỗ vẽ sai là chỗ chưa hiểu.
> Giải thích chi tiết nằm trong các bài Q&A 02–05 (được dẫn ở từng sơ đồ).

Mục lục:
1. [[#1. @Transactional: proxy và TransactionInterceptor|@Transactional: proxy và TransactionInterceptor]]
2. [[#2. Self-invocation: vì sao transaction bị mất|Self-invocation: vì sao transaction bị mất]]
3. [[#3. Propagation REQUIRED vs REQUIRES_NEW + UnexpectedRollbackException|Propagation REQUIRED vs REQUIRES_NEW + UnexpectedRollbackException]]
4. [[#4. Trạng thái entity JPA|Trạng thái entity JPA]]
5. [[#5. N+1 và cách sửa|N+1 và cách sửa]]
6. [[#6. HashMap.put()|HashMap.put()]]
7. [[#7. ThreadPoolExecutor: xử lý khi submit task|ThreadPoolExecutor: xử lý khi submit task]]
8. [[#8. Luồng request Spring MVC|Luồng request Spring MVC]]
9. [[#9. Vòng đời Spring bean|Vòng đời Spring bean]]
10. [[#10. Auto-configuration của Spring Boot|Auto-configuration của Spring Boot]]
11. [[#11. Spring Security + JWT|Spring Security + JWT]]
12. [[#12. Cache-aside với Redis|Cache-aside với Redis]]

---

## 1. @Transactional: proxy và TransactionInterceptor

Chi tiết: [[05 - Transaction & JPA]] câu 1.

```mermaid
sequenceDiagram
    autonumber
    participant C as OrderController
    participant P as OrderService Proxy (CGLIB)
    participant TI as TransactionInterceptor
    participant TM as JpaTransactionManager
    participant TL as TransactionSynchronizationManager (ThreadLocal)
    participant S as OrderService (target thật)
    participant R as OrderRepository

    C->>P: placeOrder(req)
    P->>TI: invoke()
    TI->>TM: getTransaction(propagation, isolation, readOnly)
    TM->>TM: lấy connection, setAutoCommit(false)
    TM->>TL: bind connection + EntityManager vào thread hiện tại
    TI->>S: placeOrder(req)
    S->>R: save(order)
    R->>TL: lấy EntityManager đang bind (dùng chung transaction)
    S-->>TI: return / throw
    alt thành công
        TI->>TM: commit() (flush rồi COMMIT)
    else RuntimeException hoặc Error
        TI->>TM: rollback()
    else Checked exception (không cấu hình rollbackFor)
        TI->>TM: commit(): bẫy!
    end
    TM->>TL: unbind, trả connection về pool
    TI-->>C: kết quả / exception
```

**Ý chính cần nói:** annotation chỉ là metadata; proxy mới làm việc; transaction gắn vào **ThreadLocal**, nên đổi sang thread khác là mất transaction.

---

## 2. Self-invocation: vì sao transaction bị mất

Chi tiết: [[05 - Transaction & JPA]] câu 2.

```mermaid
flowchart LR
    Caller["Controller"] -->|"gọi qua proxy ✓"| Proxy["Proxy<br/>(có TransactionInterceptor)"]
    Proxy -->|"mở transaction"| A["target.createOrders()<br/>(không có @Transactional)"]
    A -->|"this.createOne() ✗<br/>gọi thẳng target, KHÔNG qua proxy"| B["target.createOne()<br/>@Transactional bị bỏ qua"]

    Caller2["Controller"] -->|"gọi qua proxy ✓"| Proxy2["Proxy của OrderService"]
    Proxy2 --> A2["OrderService.createOrders()"]
    A2 -->|"orderWriter.createOne() ✓<br/>đi qua proxy của bean khác"| Proxy3["Proxy của OrderWriter"]
    Proxy3 -->|"mở transaction"| B2["OrderWriter.createOne()"]

    style B fill:#ffd6d6,stroke:#c00
    style B2 fill:#d6ffd6,stroke:#090
```

**Cách sửa:** tách sang bean khác (như nửa dưới của sơ đồ); dùng `TransactionTemplate`; hoặc tự inject chính bean với `@Lazy`. Bẫy này cũng áp dụng cho `@Async`, `@Cacheable`, `@Retryable`, `@PreAuthorize`.

---

## 3. Propagation REQUIRED vs REQUIRES_NEW + UnexpectedRollbackException

Chi tiết: [[05 - Transaction & JPA]] câu 4–5.

```mermaid
sequenceDiagram
    participant O as outer() REQUIRED
    participant I as inner() REQUIRED (bean khác)
    participant A as auditLog() REQUIRES_NEW (bean khác)
    participant DB as Database

    Note over O,DB: Tx1 (physical) bắt đầu: connection #1
    O->>I: gọi inner()
    Note over I: tham gia Tx1 (cùng connection #1)
    I--xO: throw RuntimeException
    Note over O,I: exception đi qua proxy của inner() → Tx1 bị đánh dấu ROLLBACK-ONLY
    O->>O: catch exception, chỉ log rồi bỏ qua (nuốt exception)

    O->>A: gọi auditLog()
    Note over A,DB: SUSPEND Tx1 → mở Tx2 độc lập: connection #2
    A->>DB: INSERT audit
    A->>DB: COMMIT Tx2 ✓ (audit được lưu)
    Note over A,DB: RESUME Tx1

    O->>DB: commit Tx1?
    DB-->>O: Tx1 đang rollback-only → ROLLBACK
    Note over O: ném UnexpectedRollbackException
```

**Ý chính cần nói:**
- REQUIRED dùng chung **một** physical transaction, nên lỗi ở trong làm hỏng cả transaction ngoài.
- REQUIRES_NEW dùng transaction riêng **và chiếm connection riêng**, nên có nguy cơ cạn connection pool.

---

## 4. Trạng thái entity JPA

Chi tiết: [[05 - Transaction & JPA]] câu 12–13.

```mermaid
stateDiagram-v2
    [*] --> Transient: new User()
    Transient --> Managed: persist() / save() khi entity mới
    [*] --> Managed: find() / query trong transaction
    Managed --> Managed: setter → dirty checking → UPDATE khi flush
    Managed --> Detached: transaction kết thúc / clear() / detach()
    Detached --> Managed: merge() trả về BẢN MANAGED MỚI
    Managed --> Removed: remove()
    Removed --> [*]: flush → DELETE
    Detached --> [*]: GC
```

**Ý chính cần nói:** chỉ entity ở trạng thái **Managed** mới được dirty checking. Truy cập lazy association khi entity đã **Detached** thì gặp `LazyInitializationException`.

---

## 5. N+1 và cách sửa

Chi tiết: [[05 - Transaction & JPA]] câu 14–16.

```mermaid
sequenceDiagram
    participant S as OrderService
    participant H as Hibernate
    participant DB as Database

    rect rgb(255, 230, 230)
    Note over S,DB: ❌ N+1: items là LAZY
    S->>H: orderRepo.findAll()
    H->>DB: SELECT * FROM orders  (1 query)
    loop với mỗi order (N lần)
        S->>H: order.getItems().size()
        H->>DB: SELECT * FROM order_item WHERE order_id = ?
    end
    Note over DB: tổng 1 + N query
    end

    rect rgb(230, 255, 230)
    Note over S,DB: ✓ JOIN FETCH / @EntityGraph
    S->>H: findAllWithItems()
    H->>DB: SELECT o.*, i.* FROM orders o JOIN order_item i ...  (1 query)
    end

    rect rgb(230, 240, 255)
    Note over S,DB: ✓ default_batch_fetch_size = 50
    S->>H: findAll() rồi truy cập items
    H->>DB: SELECT * FROM orders
    H->>DB: SELECT * FROM order_item WHERE order_id IN (?, ?, ... 50 id)
    Note over DB: 1 + N/50 query
    end
```

**Bẫy:** `JOIN FETCH` collection kết hợp `Pageable` làm Hibernate phân trang trong memory (HHH90003004).

---

## 6. HashMap.put()

Chi tiết: [[02 - Java Core, Collections & Stream API]] câu 10.

```mermaid
flowchart TD
    Start(["put(key, value)"]) --> H["hash = key.hashCode() ^ (h >>> 16)"]
    H --> I["index = (n - 1) & hash"]
    I --> E{"bucket[index] rỗng?"}
    E -->|Có| New["Tạo Node mới tại bucket"]
    E -->|Không| Loop{"Có node nào có<br/>cùng hash và key.equals()?"}
    Loop -->|Có| Replace["Ghi đè value<br/>(trả về value cũ)"]
    Loop -->|Không| Type{"Bucket là<br/>list hay tree?"}
    Type -->|Tree| TreeAdd["Thêm vào red-black tree<br/>O(log n)"]
    Type -->|List| ListAdd["Thêm vào cuối list"]
    ListAdd --> T{"Bucket vượt quá 8 node?<br/>(vừa thêm node thứ 9)"}
    T -->|Không| Size
    T -->|Có| Cap{"capacity ≥ 64?"}
    Cap -->|Có| Treeify["TREEIFY bucket<br/>list → red-black tree"]
    Cap -->|Không| Resize
    Treeify --> Size
    TreeAdd --> Size
    New --> Size{"++size > capacity × 0.75?"}
    Size -->|Có| Resize["RESIZE: capacity × 2<br/>phân bố lại node"]
    Size -->|Không| Done(["Xong"])
    Resize --> Done
    Replace --> Done
```

**Con số cần nhớ:** capacity mặc định 16, load factor 0.75, treeify khi bucket vượt quá 8 node (thêm node thứ 9) và capacity ≥ 64, untreeify khi ≤ 6.

---

## 7. ThreadPoolExecutor: xử lý khi submit task

Chi tiết: [[03 - Concurrency, SQL, REST & Security]] câu 4.

```mermaid
flowchart TD
    S(["execute(task)"]) --> C{"Số thread đang chạy<br/>< corePoolSize?"}
    C -->|Có| NC["Tạo thread core mới<br/>chạy task"]
    C -->|Không| Q{"Queue còn chỗ?"}
    Q -->|Có| EQ["Đưa task vào queue<br/>chờ thread rảnh"]
    Q -->|Không| M{"Số thread<br/>< maximumPoolSize?"}
    M -->|Có| NM["Tạo thread non-core<br/>chạy task"]
    M -->|Không| R["RejectedExecutionHandler"]
    R --> R1["AbortPolicy (mặc định):<br/>ném RejectedExecutionException"]
    R --> R2["CallerRunsPolicy:<br/>thread gọi tự chạy (back-pressure)"]
    R --> R3["DiscardPolicy / DiscardOldestPolicy"]

    style EQ fill:#fff3cd
    style R fill:#ffd6d6
```

**Bẫy:** queue **không giới hạn** (`newFixedThreadPool`) khiến nhánh "Queue còn chỗ?" luôn là Có. Pool không bao giờ tăng lên max, task dồn mãi và cuối cùng gây OOM.

---

## 8. Luồng request Spring MVC

Chi tiết: [[04 - Spring Core, Boot & MVC]] câu 16–18.

```mermaid
sequenceDiagram
    autonumber
    participant Cl as Client
    participant T as Tomcat (worker thread)
    participant F as Filter chain (Security, CORS, logging)
    participant DS as DispatcherServlet
    participant HM as HandlerMapping
    participant HI as HandlerInterceptor
    participant HA as HandlerAdapter
    participant MC as HttpMessageConverter (Jackson)
    participant Ctl as @RestController
    participant Adv as @RestControllerAdvice

    Cl->>T: POST /api/orders (JSON)
    T->>F: doFilter()
    F->>DS: doDispatch()
    DS->>HM: tìm handler theo URL + method
    HM-->>DS: OrderController.create()
    DS->>HI: preHandle()
    DS->>HA: handle()
    HA->>MC: đọc body → OrderRequest (@RequestBody)
    HA->>HA: @Valid validation
    HA->>Ctl: create(request)
    Ctl-->>HA: OrderResponse
    HA->>MC: ghi OrderResponse → JSON
    DS->>HI: postHandle() (bỏ qua nếu có exception)
    alt có exception
        DS->>Adv: @ExceptionHandler → ProblemDetail
    end
    DS->>HI: afterCompletion()
    DS-->>F: response
    F-->>Cl: HTTP 201 + JSON
```

**Ý chính cần nói:** Filter thuộc Servlet API và đứng trước DispatcherServlet; Interceptor thuộc Spring MVC và bao quanh handler; JSON được chuyển đổi bởi `HttpMessageConverter`.

---

## 9. Vòng đời Spring bean

Chi tiết: [[04 - Spring Core, Boot & MVC]] câu 5.

```mermaid
flowchart TD
    A["1. Instantiate<br/>(gọi constructor: constructor injection)"] --> B["2. Populate properties<br/>(setter / field injection)"]
    B --> C["3. Aware callbacks<br/>BeanNameAware, ApplicationContextAware"]
    C --> D["4. BeanPostProcessor<br/>postProcessBeforeInitialization<br/>(xử lý @PostConstruct)"]
    D --> E["5. InitializingBean.afterPropertiesSet()<br/>→ custom initMethod"]
    E --> F["6. BeanPostProcessor<br/>postProcessAfterInitialization<br/>⚡ TẠO AOP PROXY tại đây"]
    F --> G(["7. Bean sẵn sàng sử dụng"])
    G --> H["8. Context đóng:<br/>@PreDestroy → DisposableBean.destroy()<br/>→ custom destroyMethod"]

    style F fill:#fff3cd,stroke:#c90
```

**Ý chính cần nói:** proxy (`@Transactional`, `@Async`, `@Cacheable`) được tạo **sau** `@PostConstruct`. Vì vậy logic cần transaction lúc khởi động nên đặt trong `ApplicationRunner` hoặc `@EventListener(ApplicationReadyEvent.class)`. Prototype bean không được gọi bước 8.

---

## 10. Auto-configuration của Spring Boot

Chi tiết: [[04 - Spring Core, Boot & MVC]] câu 9–10.

```mermaid
flowchart TD
    App["@SpringBootApplication"] --> EA["@EnableAutoConfiguration"]
    App --> CS["@ComponentScan<br/>(bean của bạn: xử lý TRƯỚC)"]
    EA --> Sel["AutoConfigurationImportSelector"]
    Sel --> File["Đọc META-INF/spring/<br/>...AutoConfiguration.imports<br/>trong mọi JAR"]
    File --> AC["DataSourceAutoConfiguration,<br/>JacksonAutoConfiguration, ..."]
    AC --> C1{"@ConditionalOnClass<br/>class có trên classpath?"}
    C1 -->|Không| Skip["Bỏ qua"]
    C1 -->|Có| C2{"@ConditionalOnProperty<br/>property thoả?"}
    C2 -->|Không| Skip
    C2 -->|Có| C3{"@ConditionalOnMissingBean<br/>bạn CHƯA tự khai báo bean?"}
    C3 -->|"Đã có bean của bạn"| Skip
    C3 -->|Chưa có| Create["Tạo bean mặc định"]

    style C3 fill:#fff3cd,stroke:#c90
```

**Debug:** chạy với `--debug` để xem Condition Evaluation Report, hoặc gọi `/actuator/conditions`.

---

## 11. Spring Security + JWT

Chi tiết: [[03 - Concurrency, SQL, REST & Security]] câu 23–24.

```mermaid
sequenceDiagram
    autonumber
    participant Cl as Client
    participant Auth as AuthController /auth/login
    participant AM as AuthenticationManager
    participant UDS as UserDetailsService + BCrypt
    participant FCP as FilterChainProxy (SecurityFilterChain)
    participant JF as BearerTokenAuthenticationFilter
    participant SC as SecurityContextHolder (ThreadLocal)
    participant AF as AuthorizationFilter
    participant API as OrderController

    rect rgb(240, 240, 255)
    Note over Cl,UDS: Đăng nhập
    Cl->>Auth: POST username + password
    Auth->>AM: authenticate()
    AM->>UDS: loadUserByUsername + so khớp hash BCrypt
    UDS-->>AM: OK
    Auth-->>Cl: access token (ngắn hạn) + refresh token
    end

    rect rgb(240, 255, 240)
    Note over Cl,API: Gọi API
    Cl->>FCP: GET /api/orders, header Authorization Bearer token
    FCP->>JF: kiểm tra token
    JF->>JF: verify chữ ký + exp, đọc claims (sub, roles)
    alt token hợp lệ
        JF->>SC: set Authentication
        FCP->>AF: kiểm tra quyền theo URL / role
        alt đủ quyền
            AF->>API: cho đi tiếp → 200
        else thiếu quyền
            AF-->>Cl: 403 Forbidden
        end
    else token sai / hết hạn
        JF-->>Cl: 401 Unauthorized
    end
    end
```

---

## 12. Cache-aside với Redis

Chi tiết: [[03 - Concurrency, SQL, REST & Security]] câu 26.

```mermaid
sequenceDiagram
    participant S as ProductService
    participant R as Redis
    participant DB as Database

    Note over S,DB: Đọc: @Cacheable
    S->>R: GET product:42
    alt cache hit
        R-->>S: dữ liệu
    else cache miss
        R-->>S: null
        S->>DB: SELECT ... WHERE id = 42
        DB-->>S: dữ liệu
        S->>R: SET product:42 (kèm TTL + jitter)
    end

    Note over S,DB: Ghi: @CacheEvict
    S->>DB: UPDATE product 42
    S->>R: DEL product:42
    Note over S,R: lần đọc sau sẽ load lại dữ liệu mới
```

**3 sự cố cần nhớ:** penetration (key không tồn tại; xử lý bằng cache giá trị rỗng hoặc Bloom filter), stampede (key nóng hết hạn; xử lý bằng lock hoặc single-flight), avalanche (nhiều key hết hạn cùng lúc; xử lý bằng TTL có jitter).
