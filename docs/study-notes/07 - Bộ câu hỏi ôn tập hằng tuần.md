# Bộ câu hỏi ôn tập hằng tuần

> Làm vào **Chủ nhật**, khoảng 15 phút. Đi kèm [[01 - Lộ trình 8 tuần]].
> Cách làm: **tự trả lời bằng lời hoặc viết ra giấy trước**, sau đó mới bấm "Đáp án" để đối chiếu. Đừng đọc đáp án trước, vì như vậy chỉ luyện khả năng *nhận ra* chứ không luyện khả năng *nhớ lại*.
> Đánh dấu ❌ vào câu sai và làm lại câu đó ở tuần sau (spaced repetition). Tuần 8 có bài tổng hợp.
> Quiz tập trung vào **con số, bẫy và các trường hợp "sẽ xảy ra gì nếu"**. Phần giải thích cơ chế thì luyện bằng Feynman và xem [[06 - Sơ đồ cơ chế cốt lõi]].

---

## Tuần 1: OOP, equals/hashCode, String, Exception, Collections

**1.** `Integer a = 127, b = 127; Integer c = 128, d = 128;` Hai biểu thức `a == b` và `c == d` cho kết quả gì? Vì sao?
> [!success]- Đáp án
> `true` và `false`. Integer cache giữ sẵn các giá trị từ -128 đến 127, nên `a` và `b` trỏ cùng một object. Với 128, autoboxing tạo 2 object khác nhau. Luôn so sánh wrapper bằng `equals()`.


**2.** Class `User` override `equals` (so theo email) nhưng **không** override `hashCode`. Thêm 2 user có cùng email vào `HashSet`. Size của set là bao nhiêu?
> [!success]- Đáp án
> Thường là **2**. Hai object có hashCode mặc định khác nhau nên rơi vào bucket khác nhau, và `equals` không bao giờ được gọi để so sánh chúng. Vi phạm contract: equals bằng nhau thì hashCode phải bằng nhau.
> Bên trong, `HashSet` chính là một `HashMap`: phần tử làm key, value là một object `PRESENT` dùng chung, và `add(e)` là `map.put(e, PRESENT) == null`. Vì vậy mọi quy tắc của key HashMap (hashCode, equals, key bất biến) áp dụng nguyên cho HashSet.


**3.** Đoạn code sau in ra gì?
```java
static int f() { try { return 1; } finally { return 2; } }
```
> [!success]- Đáp án
> `2`. `return` trong `finally` ghi đè giá trị trả về, và nếu `try` có exception thì exception đó cũng bị nuốt mất. Không bao giờ `return` trong `finally`.


**4.** Từ Java 8/9, interface có thể chứa những loại method nào?
> [!success]- Đáp án
> abstract, `default` (Java 8), `static` (Java 8), `private` (Java 9). Field trong interface luôn là `public static final`.


**5.** HashMap: capacity mặc định, load factor, và resize xảy ra khi thêm phần tử thứ mấy?
> [!success]- Đáp án
> 16, 0.75. Ngưỡng là 16 × 0.75 = 12, nên resize khi size vượt 12, tức lúc thêm phần tử thứ **13**. Capacity tăng gấp đôi lên 32.


**6.** Khi nào một bucket của HashMap chuyển thành red-black tree? Khi nào chuyển ngược lại thành list?
> [!success]- Đáp án
> Khi bucket **vượt quá 8** node (tức lúc thêm node thứ 9) **và** capacity của table ≥ **64**. Nếu capacity < 64 thì HashMap resize thay vì treeify. Khi bucket giảm còn ≤ **6** node thì chuyển lại thành list.


**7.** Vì sao capacity của HashMap luôn là luỹ thừa của 2?
> [!success]- Đáp án
> Để tính index bằng `(n - 1) & hash`, phép AND bit nhanh hơn `%` và cho kết quả tương đương khi n là luỹ thừa của 2. Kết hợp với bước `hash ^ (hash >>> 16)` để các bit cao cũng ảnh hưởng tới index.


**8.** `List<String> l = List.of("a", "b"); l.set(0, "x");` → ? Còn với `Arrays.asList("a", "b")` thì sao?
> [!success]- Đáp án
> `List.of` ném `UnsupportedOperationException` vì list immutable. `Arrays.asList` cho phép `set` nhưng **không** cho `add`/`remove`, vì nó có kích thước cố định và là view của mảng gốc.


**9.** Xoá phần tử bên trong vòng `for-each` của một `ArrayList` gây ra exception gì? Nêu 2 cách đúng.
> [!success]- Đáp án
> `ConcurrentModificationException`, do iterator fail-fast kiểm tra `modCount`. Cách đúng: `list.removeIf(...)`, hoặc dùng `Iterator` rồi gọi `it.remove()`.


**10.** Mỗi lần đầy, ArrayList tăng capacity thêm bao nhiêu? Capacity mặc định là bao nhiêu?
> [!success]- Đáp án
> Tăng khoảng **1.5 lần** (`old + (old >> 1)`). Mặc định **10**, cấp phát khi `add` lần đầu.


**11.** `Comparator` viết `(a, b) -> a.getAge() - b.getAge()` có rủi ro gì?
> [!success]- Đáp án
> Tràn số `int` khi giá trị lớn hoặc trái dấu, dẫn đến sắp xếp sai. Dùng `Integer.compare(...)` hoặc `Comparator.comparingInt(User::getAge)`.


**12.** Java là pass-by-value hay pass-by-reference? Method gán `param = new User()` có ảnh hưởng biến bên ngoài không?
> [!success]- Đáp án
> Luôn là **pass-by-value**. Với object, giá trị được truyền là bản sao của tham chiếu. Gán lại tham số **không** ảnh hưởng biến bên ngoài; nhưng gọi `param.setName()` thì có, vì cả hai cùng trỏ tới một object.


---

## Tuần 2: Stream, Optional, Java 17/21, JVM & GC

**1.** Đoạn sau in ra gì? `Stream.of(1,2,3).filter(x -> { System.out.println(x); return x > 1; });`
> [!success]- Đáp án
> **Không in gì**. Không có terminal operation thì stream không chạy, vì các intermediate operation là lazy.


**2.** Gọi terminal operation 2 lần trên cùng một stream thì sao?
> [!success]- Đáp án
> Lần thứ hai ném `IllegalStateException: stream has already been operated upon or closed`. Mỗi stream chỉ dùng được 1 lần.


**3.** `Collectors.toMap(User::getDept, User::getName)` khi có 2 user cùng dept thì sao? Sửa thế nào?
> [!success]- Đáp án
> Ném `IllegalStateException: Duplicate key`. Sửa bằng cách truyền merge function: `toMap(k, v, (a, b) -> a)`. Nếu muốn giữ tất cả thì dùng `groupingBy`.


**4.** `opt.orElse(loadFromDb())` khi `opt` **có giá trị**: `loadFromDb()` có được gọi không?
> [!success]- Đáp án
> **Có**. Tham số của `orElse` luôn được tính trước khi gọi. Dùng `orElseGet(() -> loadFromDb())` để chỉ gọi khi Optional rỗng.


**5.** Kể 3 chỗ **không nên** dùng `Optional`.
> [!success]- Đáp án
> Field của class (entity/DTO), tham số method, phần tử collection (`List<Optional<T>>`). Optional dành cho **kiểu trả về** có thể không có giá trị.


**6.** Parallel stream chạy trên thread pool nào? Vì sao không nên dùng nó để gọi DB hoặc HTTP trong web app?
> [!success]- Đáp án
> `ForkJoinPool.commonPool()`, dùng chung cả JVM với kích thước khoảng số CPU - 1. Tác vụ I/O chặn các thread của pool này và làm chậm mọi nơi khác cũng đang dùng commonPool, kể cả `CompletableFuture` không truyền executor.


**7.** `stream.toList()` (Java 16) và `collect(Collectors.toList())` khác nhau thế nào?
> [!success]- Đáp án
> `toList()` trả về list **unmodifiable**. `Collectors.toList()` hiện trả về `ArrayList` sửa được, dù spec không cam kết kiểu cụ thể.


**8.** `map` và `flatMap` khác nhau thế nào? Cho ví dụ với `List<Order>` mà mỗi order có `List<Item>`.
> [!success]- Đáp án
> `map` biến đổi 1 phần tử thành 1 phần tử: `orders.stream().map(Order::getItems)` cho ra `Stream<List<Item>>`. `flatMap` biến đổi 1 phần tử thành một stream rồi làm phẳng: `flatMap(o -> o.getItems().stream())` cho ra `Stream<Item>`.


**9.** `record` tự sinh những gì? Field của record có thể thay đổi giá trị không?
> [!success]- Đáp án
> Constructor đầy đủ, accessor `name()` (không có tiền tố `get`), `equals`, `hashCode`, `toString`. Field là `private final` nên không gán lại được. Tuy nhiên nếu field là `List` thì bản thân list vẫn sửa được, cần defensive copy (`List.copyOf`).


**10.** Object, biến local primitive và metadata của class lần lượt nằm ở vùng nhớ nào?
> [!success]- Đáp án
> Object nằm trên **heap**. Biến local primitive và tham chiếu nằm trên **stack** của thread. Metadata class nằm ở **Metaspace** (native memory, thay PermGen từ Java 8).


**11.** GC mặc định từ Java 9 là gì? Đặc điểm chính?
> [!success]- Đáp án
> **G1**: chia heap thành nhiều region, ưu tiên thu gom region nhiều rác nhất, đặt mục tiêu thời gian pause (`MaxGCPauseMillis`, mặc định 200ms).


**12.** Hai object A ↔ B tham chiếu vòng nhau và không còn gì trỏ tới chúng. GC có thu hồi được không?
> [!success]- Đáp án
> **Có**. Java GC dùng reachability tính từ GC roots chứ không dùng reference counting.


**13.** Kể 3 nguyên nhân memory leak phổ biến trong ứng dụng Java/Spring.
> [!success]- Đáp án
> Static collection hoặc cache không giới hạn lớn dần; `ThreadLocal` không `remove()` trong thread pool; listener hoặc callback không huỷ đăng ký; giữ tham chiếu tới object lớn trong session; load toàn bộ bảng vào memory.


---

## Tuần 3: Concurrency

**1.** ThreadPoolExecutor có core = 2, max = 4, queue = `ArrayBlockingQueue(10)`. Submit liên tục 20 task chạy lâu. Bao nhiêu task được chạy ngay, bao nhiêu nằm trong queue, bao nhiêu bị reject?
> [!success]- Đáp án
> Task 1–2 tạo thread core. Task 3–12 vào queue (10 chỗ). Task 13–14 tạo thêm thread vì queue đầy và chưa đạt max. Task 15–20 bị **reject** (6 task, mặc định `AbortPolicy` ném `RejectedExecutionException`). Tổng cộng: 4 task đang chạy, 10 task trong queue.


**2.** Vì sao `Executors.newFixedThreadPool(10)` nguy hiểm trong production?
> [!success]- Đáp án
> Pool này dùng `LinkedBlockingQueue` **không giới hạn**. Khi task đến nhanh hơn tốc độ xử lý, queue phình mãi và gây OOM. Pool này có core = max = 10 nên không bao giờ reject; task chỉ dồn vào queue. Pool tự cấu hình core nhỏ hơn max mà dùng queue không giới hạn thì không bao giờ tạo thread ngoài core, vì queue không bao giờ đầy.


**3.** `volatile int count; count++` trên 10 thread có cho kết quả đúng không?
> [!success]- Đáp án
> **Không**. `volatile` chỉ đảm bảo visibility, còn `count++` gồm 3 bước đọc → cộng → ghi, không nguyên tử. Đo thực tế (100 thread × 1000 lần): `volatile int` còn sai **nhiều lần hơn** `int` thường. Dùng `AtomicInteger`/`LongAdder` hoặc `synchronized`. Xem [[03.04 - synchronized, volatile, Atomic & ConcurrentHashMap]].


**4.** Java có những trạng thái thread nào? Có trạng thái "RUNNING" không?
> [!success]- Đáp án
> NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED. **Không** có RUNNING. Thread đang chạy hay đang chờ CPU đều ở trạng thái RUNNABLE.


**5.** `CompletableFuture.supplyAsync(task)` không truyền executor thì chạy ở đâu? Rủi ro là gì?
> [!success]- Đáp án
> Chạy trên `ForkJoinPool.commonPool()`. Với tác vụ I/O, nó chặn pool dùng chung với parallel stream và các nơi khác. Nên luôn truyền executor riêng.


**6.** `thenApply` và `thenCompose` khác nhau thế nào?
> [!success]- Đáp án
> `thenApply(fn)`: hàm trả về giá trị thường, tương tự `map`. `thenCompose(fn)`: hàm trả về một `CompletableFuture` khác và được làm phẳng, tương tự `flatMap`. Nếu dùng `thenApply` với hàm trả về CF thì sẽ thu được `CF<CF<T>>`.


**7.** `join()` và `get()` của CompletableFuture khác nhau thế nào?
> [!success]- Đáp án
> `get()` ném checked exception (`InterruptedException`, `ExecutionException`). `join()` ném unchecked `CompletionException`.


**8.** Kể 4 điều kiện để xảy ra deadlock. Cách phổ biến nhất để phòng tránh là gì?
> [!success]- Đáp án
> Mutual exclusion, hold-and-wait, no preemption, circular wait. Cách phổ biến nhất là **lấy các lock theo một thứ tự cố định** (ví dụ theo id), cùng với `tryLock(timeout)`.


**9.** `ReentrantLock` làm được gì mà `synchronized` không làm được?
> [!success]- Đáp án
> `tryLock()` (có timeout), `lockInterruptibly()`, fair lock, nhiều `Condition`. Đổi lại phải tự `unlock()` trong `finally`.


**10.** Vì sao phải `ThreadLocal.remove()` khi chạy trong thread pool?
> [!success]- Đáp án
> Thread được tái sử dụng, nên dữ liệu của request trước rò sang request sau (sai user hoặc sai tenant) và gây memory leak.


**11.** Virtual threads giúp ích cho loại tác vụ nào? Kể 2 lưu ý khi dùng.
> [!success]- Đáp án
> Hợp với tác vụ **I/O-bound** có số lượng lớn; không giúp gì cho CPU-bound. Lưu ý: không pool virtual thread; DB connection pool vẫn là giới hạn thật; ở Java 21–23, `synchronized` quanh I/O ghim (pin) virtual thread vào carrier (Java 24 đã sửa qua JEP 491).


**12.** Vì sao `synchronized` không đủ để chống bán vượt tồn kho khi chạy 3 instance service?
> [!success]- Đáp án
> `synchronized` chỉ khoá trong phạm vi một JVM. Phải xử lý ở tầng DB (update nguyên tử có điều kiện, `@Version`, `SELECT FOR UPDATE`) hoặc dùng distributed lock.


**13.** `ConcurrentHashMap` có cho phép `null` key hoặc value không? Vì sao?
> [!success]- Đáp án
> **Không**. Khi `get()` trả `null`, trong môi trường đồng thời không phân biệt được "không có key" hay "value là null", vì không thể kiểm tra `containsKey` một cách nguyên tử cùng lúc.


---

## Tuần 4: Spring Core, Boot, MVC

**1.** `@SpringBootApplication` gộp những annotation nào?
> [!success]- Đáp án
> `@SpringBootConfiguration` (một dạng `@Configuration`), `@EnableAutoConfiguration`, `@ComponentScan`.


**2.** Trong Spring Boot 3, danh sách class auto-configuration được đọc từ file nào?
> [!success]- Đáp án
> `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. File `spring.factories` không còn được dùng cho auto-config ở Boot 3.


**3.** Bạn tự khai báo một bean `ObjectMapper`. Vì sao bean `ObjectMapper` mặc định của Boot không được tạo nữa?
> [!success]- Đáp án
> Vì auto-config của Boot dùng `@ConditionalOnMissingBean`: chỉ tạo bean khi chưa có bean cùng kiểu. Auto-config được xử lý **sau** bean của người dùng.


**4.** Singleton bean có thread-safe không?
> [!success]- Đáp án
> **Không tự động**. Mọi request dùng chung một instance, nên bean phải stateless hoặc dùng cấu trúc thread-safe.


**5.** Inject một bean prototype vào một bean singleton. Mỗi lần gọi có nhận được instance mới không? Sửa thế nào?
> [!success]- Đáp án
> **Không**, vì bean chỉ được inject 1 lần lúc tạo singleton. Sửa bằng `ObjectProvider<T>.getObject()`, `@Lookup`, hoặc scoped proxy.


**6.** Từ Spring Boot 2.6, ứng dụng có circular dependency thì điều gì xảy ra mặc định?
> [!success]- Đáp án
> **Fail khi khởi động** (`BeanCurrentlyInCreationException`), vì `spring.main.allow-circular-references=false`, và điều này đúng với **cả field injection lẫn constructor injection** (đã đo). Cách xử lý đúng là thiết kế lại; `@Lazy` chỉ là giải pháp tạm thời. Xem [[04.01 - IoC & Dependency Injection]].


**7.** AOP proxy được tạo ở bước nào trong vòng đời bean?
> [!success]- Đáp án
> Ở `BeanPostProcessor.postProcessAfterInitialization`, sau `@PostConstruct` và `afterPropertiesSet`.


**8.** Có 2 bean implement `PaymentGateway`, một bean đánh `@Primary`. Tại điểm inject có `@Qualifier("vnpay")`. Bean nào được inject?
> [!success]- Đáp án
> Bean `vnpay`. `@Qualifier` có ưu tiên cao hơn `@Primary`.


**9.** Sắp xếp theo thứ tự xử lý request: `HandlerInterceptor.preHandle`, Servlet `Filter`, `DispatcherServlet`, `HttpMessageConverter` đọc body, `HandlerMapping`.
> [!success]- Đáp án
> Filter → DispatcherServlet → HandlerMapping → preHandle → HttpMessageConverter (trong lúc resolve `@RequestBody`) → controller.


**10.** Request body không hợp lệ với `@Valid @RequestBody` ném exception gì, kèm HTTP status gì?
> [!success]- Đáp án
> `MethodArgumentNotValidException`, trả **400**. Xử lý tập trung bằng `@RestControllerAdvice`.


**11.** `server.port=-1` có phải cách tắt hoàn toàn web server không?
> [!success]- Đáp án
> Không. Cấu hình này chỉ tắt HTTP endpoint, web application context vẫn được tạo. Để tắt hẳn dùng `spring.main.web-application-type=none`.


**12.** Mặc định Actuator expose những endpoint nào qua HTTP? Kể 2 endpoint không nên public.
> [!success]- Đáp án
> Chỉ có `health`. Không nên public `env` và `heapdump` (cùng với `configprops`, `threaddump`).


**13.** `@Scheduled` job chạy trên 3 instance thì vấn đề gì xảy ra? Mặc định scheduler có bao nhiêu thread?
> [!success]- Đáp án
> Job chạy **3 lần** (mỗi instance một lần). Dùng ShedLock hoặc distributed lock để khắc phục. Scheduler mặc định chỉ có **1 thread**.


---

## Tuần 5: @Transactional

**1.** `placeOrder()` không có annotation, bên trong gọi `this.saveOrder()` có `@Transactional`. Có transaction không?
> [!success]- Đáp án
> **Không**. Đây là self-invocation: lời gọi đi qua `this` chứ không đi qua proxy.


**2.** Method `@Transactional` ném `IOException`. Transaction bị rollback hay commit?
> [!success]- Đáp án
> **Commit**. Mặc định chỉ rollback với `RuntimeException` và `Error`. Sửa bằng `rollbackFor = Exception.class`.


**3.** Method bắt `RuntimeException`, log rồi **không ném lại**. Transaction bị rollback hay commit?
> [!success]- Đáp án
> **Commit**, vì proxy không thấy exception nào. Trừ khi exception đó đã đi qua proxy của một method transactional bên trong; khi đó xem câu 5.


**4.** Kể 5 lý do `@Transactional` không có tác dụng.
> [!success]- Đáp án
> Self-invocation; method `private`; method `final` (đo được: không có transaction và field được inject còn là `null`); object không phải Spring bean; exception bị nuốt; checked exception; chạy trong thread khác (`@Async`, `CompletableFuture`). Lưu ý: từ Spring 6, method `protected`/package-private **vẫn có** transaction. Xem [[05.02 - Khi @Transactional không hoạt động]].


**5.** `outer()` (REQUIRED) gọi `inner()` (REQUIRED, ở bean khác). `inner()` ném RuntimeException và `outer()` bắt lại rồi tiếp tục chạy. Kết quả?
> [!success]- Đáp án
> `UnexpectedRollbackException` khi `outer()` commit. Hai method dùng chung một physical transaction, và exception đi qua proxy của `inner()` đã đánh dấu transaction là rollback-only.


**6.** Ghi audit log sao cho log vẫn được lưu kể cả khi nghiệp vụ chính bị rollback. Dùng propagation nào? Có lưu ý gì?
> [!success]- Đáp án
> `REQUIRES_NEW`, đặt method ghi log ở **bean khác** để tránh self-invocation. Lưu ý method này chiếm thêm 1 connection trong khi transaction ngoài vẫn giữ connection của nó, nên có nguy cơ cạn connection pool.


**7.** `NESTED` khác `REQUIRES_NEW` thế nào?
> [!success]- Đáp án
> `NESTED` tạo **savepoint** trong cùng physical transaction. Rollback phần trong chỉ quay về savepoint; nếu transaction ngoài rollback thì phần trong cũng mất. `REQUIRES_NEW` tạo transaction độc lập hoàn toàn, commit riêng.
> **Bẫy đã đo:** với cấu hình JPA mặc định (`JpaTransactionManager` + Hibernate), `NESTED` ném `NestedTransactionNotSupportedException`; chỉ chạy được với `DataSourceTransactionManager` (JDBC). Xem [[05.03 - Propagation]].


**8.** Default isolation level của MySQL InnoDB và PostgreSQL là gì?
> [!success]- Đáp án
> MySQL InnoDB: **REPEATABLE READ**. PostgreSQL: **READ COMMITTED**.


**9.** Isolation level nào chặn được dirty read nhưng **không** chặn được non-repeatable read?
> [!success]- Đáp án
> READ COMMITTED.


**10.** `@Transactional(readOnly = true)` giúp gì với Hibernate? Nó có đảm bảo chặn được mọi thao tác ghi không?
> [!success]- Đáp án
> Hibernate bỏ dirty checking (không lưu snapshot, flush mode MANUAL), nên tiết kiệm memory và CPU. Không đảm bảo chặn ghi ở mọi DB; đây chỉ là hint.


**11.** Vì sao không nên gọi API thanh toán bên ngoài trong method `@Transactional`?
> [!success]- Đáp án
> Transaction giữ DB connection và lock suốt thời gian chờ API, dẫn tới cạn pool khi tải cao. Ngoài ra rollback DB không thu hồi được lời gọi API đã thực hiện. Nên gọi API ngoài transaction, hoặc dùng `@TransactionalEventListener(AFTER_COMMIT)` hay outbox pattern.


**12.** Test có `@Transactional` (hoặc `@DataJpaTest`) thì dữ liệu sau test sẽ thế nào? Bẫy là gì?
> [!success]- Đáp án
> Mặc định được **rollback**. Bẫy: SQL có thể chưa bao giờ được flush nên lỗi constraint không lộ ra. Gọi `entityManager.flush()` để ép SQL chạy.


---

## Tuần 6: JPA/Hibernate + SQL

**1.** FetchType mặc định của `@ManyToOne`, `@OneToOne`, `@OneToMany`, `@ManyToMany` là gì?
> [!success]- Đáp án
> `@ManyToOne` và `@OneToOne` là **EAGER**. `@OneToMany` và `@ManyToMany` là **LAZY**.


**2.** Load một entity trong transaction, gọi setter, **không** gọi `save()`. Sau khi commit, DB có được cập nhật không?
> [!success]- Đáp án
> **Có**. Entity đang ở trạng thái managed, và dirty checking tự sinh UPDATE khi flush lúc commit.


**3.** `merge(detachedUser)` trả về gì? `detachedUser` có trở thành managed không?
> [!success]- Đáp án
> Trả về một **bản managed khác**. Object truyền vào vẫn ở trạng thái detached.


**4.** `LazyInitializationException` xảy ra khi nào? OSIV mặc định bật hay tắt trong Spring Boot?
> [!success]- Đáp án
> Xảy ra khi truy cập association LAZY sau khi persistence context đã đóng. OSIV mặc định **bật** (`spring.jpa.open-in-view=true`), và Boot log WARN khi khởi động.


**5.** Load 100 order, mỗi order truy cập `getItems()`. Tổng cộng có bao nhiêu query? Kể 4 cách sửa.
> [!success]- Đáp án
> **101** query (1 + N). Cách sửa: `JOIN FETCH`, `@EntityGraph`, `@BatchSize` hoặc `hibernate.default_batch_fetch_size`, DTO projection.


**6.** `JOIN FETCH` một collection kết hợp với `Pageable` thì có vấn đề gì?
> [!success]- Đáp án
> Hibernate cảnh báo `HHH90003004` và **phân trang trong memory**: load toàn bộ kết quả rồi mới cắt trang. Sửa bằng cách query danh sách id theo trang trước, rồi fetch theo các id đó; hoặc dùng batch fetching.


**7.** Fetch join 2 collection kiểu `List` cùng lúc gây exception gì?
> [!success]- Đáp án
> `MultipleBagFetchException`.


**8.** Vì sao `GenerationType.IDENTITY` làm mất JDBC batch insert?
> [!success]- Đáp án
> Hibernate cần id ngay sau khi persist, nên phải INSERT từng dòng để DB sinh id. Dùng `SEQUENCE` với `allocationSize` phù hợp để batch được.


**9.** `@Version` hoạt động thế nào? Spring bọc lỗi xung đột thành exception gì?
> [!success]- Đáp án
> Câu UPDATE có thêm `WHERE id = ? AND version = ?` và tăng version. Nếu 0 row bị ảnh hưởng thì Hibernate ném `OptimisticLockException`, Spring bọc thành `ObjectOptimisticLockingFailureException`.


**10.** `@Lock(LockModeType.PESSIMISTIC_WRITE)` sinh ra câu SQL gì?
> [!success]- Đáp án
> Về ý nghĩa là khoá ghi kiểu `SELECT ... FOR UPDATE`. Câu SQL cụ thể **tuỳ dialect**: đo trên PostgreSQL với Hibernate 6.6 ra `for no key update` (thêm timeout 0 thì ra `... nowait`). Xem [[05.08 - Locking, Batch & Mapping]].


**11.** Vì sao không nên dùng Lombok `@Data` cho entity?
> [!success]- Đáp án
> `equals`, `hashCode` và `toString` dùng mọi field, kể cả lazy association. Điều này kích hoạt lazy load, gây `LazyInitializationException` hoặc vòng lặp vô hạn (`StackOverflowError`), và hashCode thay đổi sau khi persist.


**12.** Có index `(status, created_at)`. Query nào dùng được index: (a) `WHERE status = 'PAID'`; (b) `WHERE created_at > ?`; (c) `WHERE status = 'PAID' ORDER BY created_at`?
> [!success]- Đáp án
> (a) và (c) dùng được. (b) không dùng hiệu quả vì vi phạm quy tắc leftmost prefix.


**13.** `WHERE YEAR(created_at) = 2026` có dùng được index trên `created_at` không? Viết lại thế nào?
> [!success]- Đáp án
> Không, vì có hàm bọc lên cột. Viết lại: `created_at >= '2026-01-01' AND created_at < '2027-01-01'`.


**14.** `WHERE` và `HAVING` khác nhau thế nào? `RANK` và `DENSE_RANK` khác nhau thế nào với dãy giá trị 100, 100, 90?
> [!success]- Đáp án
> `WHERE` lọc dòng trước khi group; `HAVING` lọc sau khi group, trên kết quả aggregate. `RANK` cho 1, 1, **3**; `DENSE_RANK` cho 1, 1, **2**.


**15.** Vì sao `LIMIT 20 OFFSET 500000` chậm? Giải pháp?
> [!success]- Đáp án
> DB vẫn phải đọc rồi bỏ qua 500000 dòng. Giải pháp là keyset pagination: `WHERE id > :lastId ORDER BY id LIMIT 20`.


---

## Tuần 7: REST, Security, Redis, Kafka, Testing

**1.** Trong các method GET, POST, PUT, PATCH, DELETE, method nào là idempotent?
> [!success]- Đáp án
> GET, PUT, DELETE (cùng HEAD và OPTIONS). POST không idempotent; PATCH không được đảm bảo idempotent.


**2.** Client gọi POST `/payments` bị timeout rồi retry. Làm sao tránh trừ tiền 2 lần?
> [!success]- Đáp án
> Client gửi header `Idempotency-Key`. Server lưu key cùng kết quả (có unique constraint); request lặp lại thì trả về kết quả cũ thay vì xử lý lần nữa.


**3.** 401 và 403 khác nhau thế nào?
> [!success]- Đáp án
> **401**: chưa xác thực, hoặc token sai/hết hạn. **403**: đã xác thực nhưng không đủ quyền.


**4.** Trong Spring Security 6, class nào đã bị bỏ? Cấu hình bảo mật bằng gì?
> [!success]- Đáp án
> `WebSecurityConfigurerAdapter` đã bị bỏ. Cấu hình bằng bean `SecurityFilterChain` (dùng lambda DSL).


**5.** Payload của JWT có được mã hoá không?
> [!success]- Đáp án
> **Không**, chỉ được base64url encode và **ký** để chống sửa đổi. Ai cũng đọc được payload, nên không đặt dữ liệu nhạy cảm vào đó.


**6.** HS256 và RS256 khác nhau thế nào? Với microservices nên chọn loại nào?
> [!success]- Đáp án
> HS256 dùng một secret chung cho cả ký và verify. RS256 dùng private key để ký và public key để verify. Với microservices nên chọn RS256 (hoặc ES256): chỉ auth server giữ private key, các service khác chỉ cần public key.


**7.** Nên lưu mật khẩu người dùng như thế nào?
> [!success]- Đáp án
> Hash bằng BCrypt hoặc Argon2 (có salt, chậm có chủ đích). Không dùng MD5 hay SHA trần, không mã hoá 2 chiều.


**8.** API stateless dùng Bearer token thì có cần CSRF protection không? Vì sao?
> [!success]- Đáp án
> Thường **không**, vì token không được browser tự động gửi kèm như cookie. Nếu lưu token trong cookie thì **cần** bật CSRF protection.


**9.** Cache stampede (cache breakdown) là gì? Cách xử lý?
> [!success]- Đáp án
> Một key nóng hết hạn, rất nhiều request cùng lúc bị miss và cùng đánh vào DB. Xử lý bằng lock hoặc single-flight (chỉ một request load lại), hoặc refresh trước khi hết hạn; key rất nóng có thể không đặt TTL cứng. TTL có jitter là cách chữa avalanche (nhiều key hết hạn cùng lúc), không cứu được một key nóng.
> **Bẫy đã đo:** `@Cacheable(sync = true)` với Redis theo cấu hình mặc định của Spring Boot **không** chặn được stampede (50 request vẫn gọi DB 50 lần), vì `RedisCacheManager` mặc định của Boot dùng cache writer **không khoá** (non-locking). Với Caffeine (cache local), `sync = true` mới cho single-flight theo từng key. Xem [[03.10 - Redis Cache]].


**10.** Khi update dữ liệu trong pattern cache-aside, nên **update** cache hay **xoá** cache? Vì sao?
> [!success]- Đáp án
> Thường là **xoá** (evict) sau khi ghi DB. Update cache dễ gây sai lệch khi có nhiều thao tác ghi đồng thời theo thứ tự lệch nhau. Lần đọc sau sẽ load lại dữ liệu mới nhất từ DB.


**11.** Kafka đảm bảo thứ tự message ở phạm vi nào? Làm sao để các event của cùng một order luôn đúng thứ tự?
> [!success]- Đáp án
> Chỉ trong **một partition**. Dùng `orderId` làm message key để mọi event của order đó vào cùng một partition.


**12.** Topic có 4 partition, consumer group có 6 consumer. Có bao nhiêu consumer đứng không?
> [!success]- Đáp án
> **2**. Mỗi partition chỉ được một consumer trong group đọc.


**13.** Vì sao consumer Kafka phải idempotent?
> [!success]- Đáp án
> Với ngữ nghĩa at-least-once (commit offset sau khi xử lý), message có thể bị giao lại khi consumer lỗi hoặc rebalance, dẫn tới xử lý trùng.


**14.** `@WebMvcTest` load những gì? Trong Boot 3.4+, dùng annotation nào để mock service?
> [!success]- Đáp án
> Chỉ load tầng MVC (controller, advice, converter, filter), không load service hay repository. Dùng `@MockitoBean`; `@MockBean` cũ đã deprecated.


**15.** Vì sao Testcontainers tốt hơn H2 cho integration test?
> [!success]- Đáp án
> H2 khác DB thật về dialect, kiểu dữ liệu, cách lock, native query và hành vi index. Testcontainers chạy đúng PostgreSQL hoặc MySQL thật trong Docker.


---

## Tuần 8: Tổng hợp (trộn ngẫu nhiên, bấm giờ 20 phút)

Trả lời mỗi câu trong 1–2 câu nói. Đáp án nằm ở các tuần trước (số tuần ghi trong ngoặc).

1. Treeify của HashMap xảy ra ở ngưỡng nào? (T1)
2. `orElse` và `orElseGet` khác nhau thế nào? (T2)
3. Pool core = 2, max = 4, queue = 10, submit 20 task: bao nhiêu task bị reject? (T3)
4. `@ConditionalOnMissingBean` dùng để làm gì? (T4)
5. Checked exception trong `@Transactional` thì commit hay rollback? (T5)
6. `UnexpectedRollbackException` xuất hiện trong tình huống nào? (T5)
7. Default isolation của DB bạn đang dùng ở dự án là gì? (T5)
8. N+1: có mấy query và 4 cách sửa? (T6)
9. Vì sao IDENTITY làm mất batch insert? (T6)
10. Index `(a, b)`, `WHERE b = ?`: có dùng được index không? (T6)
11. 401 và 403 khác nhau thế nào? (T7)
12. Kafka đảm bảo thứ tự ở phạm vi nào? (T7)
13. `volatile` có làm `count++` an toàn không? (T3)
14. `HashSet` dùng cấu trúc nào bên trong? (T1)
15. Singleton bean có thread-safe không? (T4)
16. `readOnly = true` làm gì với Hibernate? (T5)
17. OSIV là gì, mặc định bật hay tắt? (T6)
18. Payload JWT có được mã hoá không? (T7)
19. Parallel stream chạy trên thread pool nào? (T2)
20. Cách phổ biến nhất để phòng deadlock là gì? (T3)

**Chấm điểm:** ≥ 17/20 là sẵn sàng. 14–16: ôn lại các tuần có câu sai. < 14: làm lại quiz của những tuần đó và luyện Feynman thêm cho các chủ đề tương ứng.
