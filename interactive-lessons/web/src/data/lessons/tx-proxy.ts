import timeline from "../timelines/tx-proxy.json";
import type { Lesson, Scene } from "../types";

// Measured with @SpringBootTest on Spring Boot 3.5 (Spring 6.2, Hibernate 6.6, H2 2.3), JDK 21; see study note 05.01.
export const txProxy: Lesson = {
  slug: "tx-proxy",
  crumb: "Transaction Proxy Mechanism",
  videoDir: "/videos/tx-proxy",
  videoVersion: "8aad1985",
  scenes: timeline as Scene[],
  title: "Transaction Proxy Mechanism",
  subtitle:
    "Từ JDBC autocommit tới @Transactional: annotation chỉ là metadata, proxy CGLIB hay JDK, TransactionInterceptor chạy từng bước, PlatformTransactionManager và ThreadLocal.",
  openingQuiz: {
    question: "Service có @Transactional. Class thật sự được inject vào controller là gì?",
    options: ["OrderService", "Một subclass sinh lúc runtime: OrderService$$SpringCGLIB$$1", "TransactionInterceptor", "PlatformTransactionManager"],
    answer: 1,
    explain: "Đã in ra: demo.ProbeService$$SpringCGLIB$$1, isCglibProxy = true, advice bên trong là TransactionInterceptor.",
  },
  roadmap: [
    "Chặng 1: JDBC autocommit và vai trò thật của @Transactional.",
    "Chặng 2: proxy CGLIB và JDK, TransactionInterceptor chạy từng bước.",
    "Chặng 3: PlatformTransactionManager và ThreadLocal.",
  ],
  sections: [
    {
      id: "autocommit",
      title: "Phần 1: Transaction bắt đầu từ JDBC autocommit",
      scene: "autocommit",
      intro: [
        "Transaction là nhóm thao tác thành công cùng nhau hoặc thất bại cùng nhau. JDBC `Connection` mặc định `autocommit = true`: **mỗi câu SQL là một transaction riêng**. Gom nhiều câu thì phải `setAutoCommit(false)`, chạy, rồi `commit()` hoặc `rollback()`. `@Transactional` chính là Spring làm hộ 3 bước này.",
        "Đã đo: hai insert, câu thứ hai trùng khoá. Autocommit để lại **1 dòng** (dữ liệu nửa vời); tự quản lý transaction rồi rollback còn **0 dòng**. Không có `@Transactional` vẫn có transaction, chỉ là mỗi câu một transaction; method của `SimpleJpaRepository` như `save` tự có `@Transactional` riêng.",
      ],
      widget: "autocommit",
      widgetTitle: "Lỗi ở câu thứ hai",
      quiz: {
        question: "Service không có @Transactional gọi orderRepo.save() rồi stockRepo.save() bị lỗi. Kết quả?",
        options: ["Cả hai rollback", "Order đã lưu, vì mỗi save là một transaction riêng", "Không lưu gì", "Lỗi biên dịch"],
        answer: 1,
        explain: "Muốn hai save đi cùng nhau thì đặt @Transactional ở method service.",
      },
    },
    {
      id: "proxy",
      title: "Phần 2: Annotation là metadata, proxy mới làm việc",
      scene: "proxy",
      intro: [
        "`@Transactional` không chứa code: chỉ ghi propagation, isolation, readOnly, timeout, rollbackFor. Lúc khởi động Spring đưa một **proxy** bọc bean thay cho bean thật; như lễ tân khách sạn làm thủ tục nhận và trả phòng. Đã đo: class inject là `ProbeService$$SpringCGLIB$$1`, advisor `BeanFactoryTransactionAttributeSourceAdvisor`, advice `TransactionInterceptor`.",
        "Chỉ lời gọi đi qua proxy mới có transaction: `this.method()` đi thẳng vào object thật (self-invocation, bài sau). Cùng cơ chế với `@Async`, `@Cacheable`, `@PreAuthorize`. Spring Boot tự bật quản lý transaction qua `TransactionAutoConfiguration`, không cần `@EnableTransactionManagement`.",
      ],
      quiz: {
        question: "Đặt @Transactional(readOnly = true) ở class và @Transactional ở một method thì sao?",
        options: ["Method bị readOnly", "Cấu hình ở method ghi đè cấu hình ở class", "Lỗi xung đột", "Class thắng"],
        answer: 1,
        explain: "Pattern phổ biến: class readOnly, method ghi gắn @Transactional thường.",
      },
    },
    {
      id: "cglib-jdk",
      title: "Phần 3: CGLIB và JDK dynamic proxy",
      scene: "cglib",
      intro: [
        "**JDK proxy** tạo class implement cùng interface, chỉ chặn method của interface, không inject được theo class impl. **CGLIB** tạo subclass, chặn mọi method override được, class không được `final`. Spring Boot mặc định CGLIB (`spring.aop.proxy-target-class=true`).",
        "Đã đo với `proxy-target-class=false`: bean có interface thành `demo.$Proxy149`, bean không interface vẫn CGLIB, `getBean(PaymentServiceImpl.class)` ném `NoSuchBeanDefinitionException`. Repository của Spring Data luôn là JDK proxy (`demo.$Proxy116`). CGLIB không override được method `final`: gọi method `final` trên proxy thì field `repo` là null.",
      ],
      widget: "proxy-kind",
      widgetTitle: "Proxy nào cho bean nào",
      quiz: {
        question: "Service của em có interface. Spring Boot dùng proxy nào?",
        options: ["JDK proxy", "CGLIB, vì Boot đặt proxy-target-class=true mặc định", "Không proxy", "Tuỳ JVM"],
        answer: 1,
        explain: "Chỉ khi đặt proxy-target-class=false thì bean có interface mới dùng JDK proxy.",
      },
    },
    {
      id: "interceptor",
      title: "Phần 4: TransactionInterceptor chạy từng bước",
      scene: "interceptor",
      intro: [
        "Đọc metadata thành `TransactionAttribute`, gọi `PlatformTransactionManager.getTransaction()`, bind tài nguyên vào ThreadLocal, gọi method thật, rồi commit hoặc rollback, cuối cùng dọn dẹp. Trả về bình thường thì commit; `RuntimeException` hoặc `Error` thì rollback; **checked exception mặc định vẫn commit**.",
        "Bật `logging.level.org.springframework.orm.jpa.JpaTransactionManager: DEBUG` để thấy `Creating new transaction with name [demo.ProbeService.inTx]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT`, `Opened new EntityManager`, `Initiating transaction commit`. Không thấy dòng `Creating new transaction` là proxy không chạy.",
      ],
      widget: "tx-steps",
      widgetTitle: "Đi qua từng bước",
      quiz: {
        question: "getTransaction() có luôn mở transaction mới không?",
        options: ["Có", "Không: với REQUIRED mà thread đã có transaction thì chỉ tham gia (Participating in existing transaction)", "Chỉ khi readOnly", "Chỉ với JDBC"],
        answer: 1,
        explain: "Chi tiết ở bài Propagation.",
      },
    },
    {
      id: "manager",
      title: "Phần 5: PlatformTransactionManager",
      scene: "manager",
      intro: [
        "Interface chung `getTransaction`, `commit`, `rollback`, mỗi công nghệ một implementation: `DataSourceTransactionManager` cho JDBC, `JpaTransactionManager` cho JPA (bind cả `EntityManagerHolder` và `ConnectionHolder`), `JtaTransactionManager` cho XA, `R2dbcTransactionManager` cho reactive (dùng Reactor Context, không ThreadLocal). Đây là Strategy pattern.",
        "Đã đo: bean là `JpaTransactionManager`, DataSource là `HikariDataSource`. Có 2 DataSource thì có 2 transaction manager: `@Transactional` không ghi tên dùng bean `@Primary`, ghi vào DB thứ hai mà quên `transactionManager = \"reportTm\"` thì không nằm trong transaction bạn nghĩ.",
      ],
      quiz: {
        question: "Vì sao JdbcTemplate trong method @Transactional chạy chung transaction với repository JPA?",
        options: ["Trùng hợp", "JpaTransactionManager expose connection JDBC bên dưới qua ConnectionHolder trên cùng thread", "JdbcTemplate tự mở transaction", "Không chạy chung"],
        answer: 1,
        explain: "Log: Exposing JPA transaction as JDBC.",
      },
    },
    {
      id: "threadlocal",
      title: "Phần 6: ThreadLocal",
      scene: "threadlocal",
      intro: [
        "`TransactionSynchronizationManager` giữ một `ThreadLocal<Map>`: transaction manager bỏ connection và EntityManager vào ngăn tủ của thread hiện tại, repository nào chạy sau trên cùng thread thì lấy đúng connection đó. Đã đo: trong transaction có `EntityManagerHolder`, `ConnectionHolder`, `autoCommit = false`, 1 connection mượn; sau transaction map rỗng, 0 connection.",
        "**Đổi thread là mất transaction**: method `@Async` chạy trên `task-1` có `active = false` và không thấy dòng transaction ngoài vừa `saveAndFlush`. Transaction giữ connection suốt thời gian method chạy: chờ API ngoài 5 giây là giữ connection 5 giây. Hai request đồng thời có hai transaction riêng vì trạng thái nằm ở thread, không nằm trong bean.",
      ],
      quiz: {
        question: "Vì sao bên trong @Async, repo.save() vẫn lưu được?",
        options: [
          "Vì dùng chung transaction với caller",
          "Vì save() có @Transactional riêng nên tự mở transaction mới trên task-1; caller rollback thì dữ liệu này không rollback theo",
          "Vì @Async tự copy ThreadLocal",
          "Vì không cần transaction",
        ],
        answer: 1,
        explain: "Hai transaction khác nhau trên hai thread khác nhau.",
      },
    },
  ],
  modelAnswer:
    "Annotation chỉ là metadata. Spring tạo một AOP proxy bọc bean, mặc định trong Spring Boot là CGLIB, em in class ra thấy dạng OrderService$$SpringCGLIB$$. Khi gọi method qua proxy, TransactionInterceptor đọc propagation, isolation, readOnly, rồi gọi PlatformTransactionManager, với JPA là JpaTransactionManager, để lấy connection và tắt autocommit. Connection và EntityManager được bind vào ThreadLocal qua TransactionSynchronizationManager nên mọi repository trên cùng thread dùng chung transaction. Method trả về bình thường thì commit, ném RuntimeException hoặc Error thì rollback, checked exception mặc định vẫn commit. Từ đó suy ra các bẫy: this.method() không qua proxy, method private hay final không bị chặn, đổi sang thread khác như @Async thì mất transaction. Khi debug em bật log DEBUG của JpaTransactionManager.",
};
