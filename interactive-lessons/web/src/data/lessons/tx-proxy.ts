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
        "Thí nghiệm: hai insert, câu thứ hai trùng khoá. Chọn autocommit hoặc tự quản lý transaction rồi xem bảng còn lại gì.",
      ],
      predict: {
        question: "Để autocommit mặc định. Insert thứ nhất thành công, insert thứ hai trùng khoá. Bảng còn bao nhiêu dòng?",
        options: ["0 dòng, vì câu thứ hai lỗi nên huỷ hết", "1 dòng: câu thứ nhất đã commit riêng", "2 dòng", "Tuỳ database"],
        answer: 1,
        explain: "Autocommit nghĩa là mỗi câu SQL là một transaction riêng: câu thứ nhất đã commit xong trước khi câu thứ hai chạy.",
      },
      widget: "autocommit",
      widgetTitle: "Lỗi ở câu thứ hai",
      after: [
        "Đã đo: hai insert, câu thứ hai trùng khoá. Autocommit để lại **1 dòng** (dữ liệu nửa vời); tự quản lý transaction rồi rollback còn **0 dòng**. Không có `@Transactional` vẫn có transaction, chỉ là mỗi câu một transaction; method của `SimpleJpaRepository` như `save` tự có `@Transactional` riêng.",
      ],
      takeaway: {
        lines: ["Không có `@Transactional` vẫn có transaction, nhưng **mỗi câu một transaction**. Muốn nhiều câu cùng thành công hoặc cùng huỷ thì phải gom chúng vào một transaction."],
      },
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
        "Phần 1 nói `@Transactional` làm hộ 3 bước tắt autocommit, chạy, commit hoặc rollback. Nhưng ai thật sự chạy 3 bước đó?",
        "`@Transactional` không chứa code: chỉ ghi propagation, isolation, readOnly, timeout, rollbackFor. Lúc khởi động Spring đưa một **proxy** bọc bean thay cho bean thật; như lễ tân khách sạn làm thủ tục nhận và trả phòng. Đã đo: class inject là `ProbeService$$SpringCGLIB$$1`, advisor `BeanFactoryTransactionAttributeSourceAdvisor`, advice `TransactionInterceptor`.",
        "Chỉ lời gọi đi qua proxy mới có transaction: `this.method()` đi thẳng vào object thật (self-invocation, bài sau). Cùng cơ chế với `@Async`, `@Cacheable`, `@PreAuthorize`. Spring Boot tự bật quản lý transaction qua `TransactionAutoConfiguration`, không cần `@EnableTransactionManagement`.",
        "Đặt `@Transactional` ở class thì áp cho mọi method public; đặt thêm ở một method thì **cấu hình ở method thắng** cấu hình ở class. Pattern hay gặp: class `@Transactional(readOnly = true)`, còn method ghi gắn `@Transactional` thường.",
      ],
      takeaway: {
        lines: ["Annotation chỉ là metadata, **proxy** mới mở và đóng transaction. Lời gọi không đi qua proxy thì không có transaction."],
      },
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
        "Đã đo với `proxy-target-class=false`: bean có interface thành `demo.$Proxy149`, bean không interface vẫn CGLIB, `getBean(PaymentServiceImpl.class)` ném `NoSuchBeanDefinitionException`. Repository của Spring Data luôn là JDK proxy (`demo.$Proxy116`). ",
      ],
      trap: {
        title: "Method final trên proxy CGLIB: field là null",
        text: "Proxy CGLIB là một object riêng, được tạo mà **không chạy constructor và không được inject gì** (Spring dùng thư viện Objenesis để tạo nó), nên mọi field của chính proxy là null. Bình thường proxy chỉ chuyển lời gọi sang object thật, nơi field `repo` đã được inject. Nhưng method `final` không override được, nên lời gọi chạy luôn code gốc **trên object proxy**: đọc `repo` của proxy, là null, và không có transaction.",
      },
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
      board: {
        title: "Proxy bọc method trong transaction",
        highlight: "transaction",
        chips: ["Annotation chỉ là metadata", "TransactionInterceptor làm 6 bước"],
        cards: [
          {
            title: "Commit hay rollback",
            diagram: {
              kind: "flow",
              steps: ["Đọc @Transactional", "getTransaction()", "Bind connection vào ThreadLocal", "Gọi method thật"],
              ok: ["Trả về bình thường", "COMMIT"],
              bad: ["RuntimeException / Error", "ROLLBACK"],
            },
            notes: ["Sau khi kết thúc, interceptor dọn ThreadLocal.", "Không thấy log `Creating new transaction` là proxy không chạy."],
            code: `@Transactional
public void place(Order order) {
  repo.save(order);
}`,
            takeaway: "Proxy mở và đóng transaction quanh method thật",
          },
          {
            title: "Checked exception",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["Method thật ném exception", "Interceptor xét loại exception"],
              ok: ["Checked exception", "COMMIT (mặc định)"],
              bad: ["RuntimeException / Error", "ROLLBACK"],
            },
            notes: ["Spring giữ quy ước EJB: checked là kết quả nghiệp vụ đã báo trước, unchecked là sự cố bất ngờ."],
            takeaway: "Muốn rollback với checked thì phải khai báo rõ",
          },
        ],
        conclusion: "**Kết luận:** `@Transactional` chỉ có tác dụng nhờ proxy gọi `TransactionInterceptor` bao quanh method thật.",
      },
      scene: "interceptor",
      intro: [
        "Proxy đã có, giờ nhìn vào bên trong nó. `TransactionInterceptor` (advice nằm trong proxy) làm 6 bước:",
        "- **(1) Đọc annotation**: thành `TransactionAttribute` (propagation, isolation, readOnly...).",
        "- **(2) Lấy transaction**: gọi `PlatformTransactionManager.getTransaction()`.",
        "- **(3) Bind connection**: vào ThreadLocal của thread hiện tại (ngăn tủ riêng của từng thread, Phần 6 nói kỹ).",
        "- **(4) Gọi method thật**.",
        "- **(5) Kết thúc**: commit hoặc rollback.",
        "- **(6) Dọn dẹp**: xoá ThreadLocal.",
        "Ở bước 2, với propagation mặc định `REQUIRED`: thread chưa có transaction thì mở mới; đã có rồi thì chỉ **tham gia** transaction đó (log ghi `Participating in existing transaction`). Bài Propagation nói kỹ các lựa chọn khác.",
        "Ở bước 5:",
        "- **Trả về bình thường**: commit.",
        "- **`RuntimeException` hoặc `Error`**: rollback.",
        "- **Checked exception**: mặc định **vẫn commit**.",
        "Lý do: Spring giữ quy ước của EJB, coi checked là kết quả nghiệp vụ đã được báo trước mà caller sẽ tự xử lý, còn unchecked là sự cố bất ngờ nên huỷ hết.",
        "Bật `logging.level.org.springframework.orm.jpa.JpaTransactionManager: DEBUG` để thấy `Creating new transaction with name [demo.ProbeService.inTx]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT`, `Opened new EntityManager`, `Initiating transaction commit`. Không thấy dòng `Creating new transaction` là proxy không chạy.",
      ],
      takeaway: {
        lines: ["Unchecked (`RuntimeException`, `Error`) thì rollback, checked thì mặc định vẫn commit. Không thấy log `Creating new transaction` là proxy không chạy."],
      },
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
        "Interface chung `getTransaction`, `commit`, `rollback`, mỗi công nghệ một implementation (Strategy pattern: cùng một interface, thay cách làm bên dưới):",
        "- **`DataSourceTransactionManager`**: cho JDBC.",
        "- **`JpaTransactionManager`**: cho JPA, bind cả `EntityManagerHolder` và `ConnectionHolder`.",
        "- **`JtaTransactionManager`**: cho transaction phân tán qua nhiều tài nguyên (ít gặp).",
        "- **`R2dbcTransactionManager`**: cho lập trình reactive (ít gặp).",
        "Vì `JpaTransactionManager` bind cả `ConnectionHolder`, một `JdbcTemplate` gọi trong cùng method `@Transactional` lấy đúng connection nằm trong ThreadLocal đó, nên chung transaction với repository JPA.",
        "Đã đo: bean là `JpaTransactionManager`, DataSource là `HikariDataSource`. Có 2 DataSource thì có 2 transaction manager: `@Transactional` không ghi tên dùng bean `@Primary`, ghi vào DB thứ hai mà quên `transactionManager = \"reportTm\"` thì không nằm trong transaction bạn nghĩ.",
      ],
      quiz: {
        question: "Vì sao JdbcTemplate trong method @Transactional chạy chung transaction với repository JPA?",
        options: ["Trùng hợp", "JpaTransactionManager expose connection JDBC bên dưới qua ConnectionHolder trên cùng thread", "JdbcTemplate tự mở transaction", "Không chạy chung"],
        answer: 1,
        explain: "Log: Exposing JPA transaction as JDBC. JdbcTemplate lấy connection từ ConnectionHolder của thread hiện tại, cùng connection mà JPA dùng.",
      },
    },
    {
      id: "threadlocal",
      title: "Phần 6: ThreadLocal",
      scene: "threadlocal",
      intro: [
        "`TransactionSynchronizationManager` giữ một `ThreadLocal<Map>`: transaction manager bỏ connection và EntityManager vào ngăn tủ của thread hiện tại, repository nào chạy sau trên cùng thread thì lấy đúng connection đó. Đã đo: trong transaction có `EntityManagerHolder`, `ConnectionHolder`, `autoCommit = false`, 1 connection mượn; sau transaction map rỗng, 0 connection.",
        "Vì trạng thái transaction nằm trong ThreadLocal, bốn hệ quả:",
        "- **Đổi thread là mất transaction**: method `@Async` chạy trên `task-1` có `active = false` và không thấy dòng transaction ngoài vừa `saveAndFlush`.",
        "- **Giữ connection suốt method**: chờ API ngoài 5 giây là giữ connection 5 giây.",
        "- **`repo.save()` bên trong `@Async`**: method `@Async` chạy trên thread khác, nên không thấy transaction của caller. `save()` có `@Transactional` riêng nên tự mở transaction mới trên thread đó; caller rollback thì dữ liệu này không rollback theo.",
        "- **Mỗi request một transaction**: hai request đồng thời có hai transaction riêng vì trạng thái nằm ở thread, không nằm trong bean.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Connection và EntityManager nằm trong ThreadLocal → code trên cùng thread dùng chung transaction → sang thread khác (như `@Async`) là không còn transaction của caller."],
      },
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
