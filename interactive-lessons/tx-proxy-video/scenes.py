"""Transaction Proxy Mechanism explainer: scene layouts and per-beat narration + motion.

Source: study note 05.01 (Spring Boot 3.5.16, Spring 6.2, Hibernate 6.6, H2 2.3, JDK 21). On-screen outputs were re-run on JDK 21
before writing this file:
- plain JDBC on H2 2.3.232: autocommit -> getAutoCommit() = true, second insert JdbcSQLIntegrityConstraintViolationException, rows = 1;
  setAutoCommit(false) + rollback() -> rows = 0.
- @SpringBootTest on Boot 3.5.16 (data-jpa + H2): injected class demo.ProbeService$$SpringCGLIB$$0, isCglibProxy true, advisor
  BeanFactoryTransactionAttributeSourceAdvisor, advice org.springframework.transaction.interceptor.TransactionInterceptor; repository
  demo.$Proxy103 (JDK proxy); transaction manager org.springframework.orm.jpa.JpaTransactionManager, DataSource
  com.zaxxer.hikari.HikariDataSource; JpaTransactionManager DEBUG: "Creating new transaction with name [demo.ProbeService.inTx]:
  PROPAGATION_REQUIRED,ISOLATION_DEFAULT", "Opened new EntityManager [SessionImpl(...)] for JPA transaction", "Initiating transaction
  commit"; resources in the transaction: EntityManagerHolder, ConnectionHolder; autoCommit false, 1 active connection; after: map 0,
  0 connections; @Async on task-1: active=false, count 0 (caller saw 1 after saveAndFlush); final @Transactional method on proxy: repo=null.
- proxy-target-class=false: PaymentService -> demo.$Proxy127 (the note measured $Proxy149; the number is a per-run counter),
  ProbeService still demo.ProbeService$$SpringCGLIB$$0, getBean(PaymentServiceImpl.class) -> NoSuchBeanDefinitionException:
  No qualifying bean of type 'demo.PaymentServiceImpl' available.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring Boot", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("@Transactional hoạt động thế nào?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["probe.getClass() → demo.ProbeService$$SpringCGLIB$$0", "AopUtils.isCglibProxy(probe) → true",
                                          "advice → TransactionInterceptor"]),
        tile("hk-tile", 300, 350, 220, "shield"),
        el("hk-word", 570, 380, 1350, None, letters("Transaction Proxy"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "metadata · proxy CGLIB · TransactionInterceptor · ThreadLocal", "kin-sub r"),
    ]), beats=[
        ("Service của bạn có Transactional. Vậy object được inject vào controller thật ra thuộc class nào?",
         "Service có @Transactional. Object được inject vào controller thật ra thuộc class nào?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("In class ra thì thấy: không phải Probe Service, mà là một subclass do Spring tạo lúc chạy. Bên trong nó là Transaction Interceptor.",
         "Đã in ra: một subclass sinh lúc runtime, bên trong là TransactionInterceptor.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.6, 0.3), IN("#hk-con-2", "type1", 3.6, 0.3), IN("#hk-con-3", "type1", 5.6, 0.3)]),
        ("Hôm nay ta mổ xẻ cơ chế proxy của transaction.", "Hôm nay: Transaction Proxy Mechanism.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ JDBC autocommit
    dict(id="autocommit", world=(1920, 1080), hud=hud("ac", "Transaction bắt đầu từ JDBC", "Autocommit mặc định bật"), cam="".join([
        big_title("ac", "Autocommit", "Mỗi câu SQL là một transaction riêng"),
        gnode("ac-s1", 160, 200, 480, 100, "1 · setAutoCommit(false)", "violet"),
        gnode("ac-s2", 720, 200, 480, 100, "2 · Chạy các câu SQL", "cyan"),
        gnode("ac-s3", 1280, 200, 480, 100, "3 · commit / rollback", "green"),
        box("ac-r", 160, 370, 760, 130, "<b>Autocommit mặc định</b><small>câu 2 trùng khoá · còn 1 dòng, dữ liệu nửa vời</small>", "red", "card"),
        box("ac-g", 1000, 370, 760, 130, "<b>setAutoCommit(false) + rollback()</b><small>câu 2 trùng khoá · còn 0 dòng</small>", "green", "card"),
        el("ac-tx", 160, 550, 1600, None, "@Transactional chính là Spring làm hộ 3 bước này, ở bên ngoài method của bạn", "note green r"),
        chip("ac-c1", 160, 640, "Không có @Transactional vẫn có transaction: mỗi câu SQL một transaction", "amber"),
        chip("ac-c2", 160, 720, "SimpleJpaRepository.save() tự có @Transactional riêng", "cyan"),
        wires(trace("ac-a", [(640, 250), (712, 250)], "violet"), trace("ac-b", [(1200, 250), (1272, 250)], "cyan")),
    ]), beats=[
        ("Phần một: transaction là nhóm thao tác cùng thành công, hoặc cùng thất bại. Connection của JDBC mặc định bật auto commit: mỗi câu SQL là một transaction riêng.",
         "Phần 1: JDBC Connection mặc định autocommit = true: mỗi câu SQL là một transaction riêng.",
         [TYPE("#ac-big", 0.1, 0.06), IN("#ac-bsub", "blur", 0.8), OUT("#ac-big, #ac-bsub", "zoom", 4.4), IN("#ac-hud", "left", 5.0)]),
        ("Muốn gom nhiều câu thành một khối, phải tự làm ba bước: tắt auto commit, chạy các câu, rồi commit, hoặc rollback nếu lỗi.",
         "Gom nhiều câu: setAutoCommit(false), chạy SQL, rồi commit() hoặc rollback().",
         [IN("#ac-s1", "pop", 3.6), DRAW("#ac-a-p", 4.6, 0.4), IN("#ac-s2", "pop", 4.9), DRAW("#ac-b-p", 5.7, 0.4), IN("#ac-s3", "pop", 6.0),
          COMET("ac-a", 7.0, 0.5), COMET("ac-b", 7.4, 0.5), LIGHT("#ac-s3", 7.9)]),
        ("Đã chạy thật, câu insert thứ hai trùng khoá. Auto commit để lại một dòng, dữ liệu nửa vời. Tự quản lý rồi rollback thì còn không dòng.",
         "Câu 2 trùng khoá. Autocommit còn 1 dòng (nửa vời); setAutoCommit(false) + rollback() còn 0 dòng.",
         [IN("#ac-r", "left", 3.0), SHAKE("#ac-r", 5.4), IN("#ac-g", "right", 6.6)]),
        ("Transactional chính là Spring làm hộ ba bước này. Không có nó vẫn có transaction, chỉ là mỗi câu một transaction. Còn save của repository tự có Transactional riêng.",
         "@Transactional = Spring làm hộ 3 bước. Không có nó: mỗi câu SQL một transaction.",
         [IN("#ac-tx", "up", 0.3), IN("#ac-c1", "left", 3.6), IN("#ac-c2", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ annotation = metadata, proxy does the work
    dict(id="proxy", world=(1920, 1080), hud=hud("px", "Annotation chỉ là metadata", "Proxy mới làm việc"), cam="".join([
        box("px-tag", 160, 190, 1600, 100, code("@Transactional   // chỉ ghi cấu hình: propagation, isolation, readOnly, timeout, rollbackFor"), "violet", "code"),
        gnode("px-c", 160, 340, 400, 100, "Controller", "amber"),
        gnode("px-p", 700, 340, 520, 100, "Proxy · lễ tân", "violet"),
        gnode("px-s", 1360, 340, 400, 100, "ProbeService thật", "cyan"),
        el("px-note", 160, 470, 1600, None, "Nhận phòng: mở transaction · dẫn khách vào: gọi method thật · trả phòng: commit hoặc rollback", "note r"),
        console("px-con", 160, 540, 1300, ["class → demo.ProbeService$$SpringCGLIB$$0", "advisor → BeanFactoryTransactionAttributeSourceAdvisor",
                                          "advice → TransactionInterceptor"]),
        chip("px-self", 160, 790, "this.method() bên trong class đi thẳng vào object thật: không có transaction", "red"),
        chip("px-same", 160, 870, "@Async, @Cacheable, @PreAuthorize chạy cùng cơ chế proxy", "violet"),
        wires(trace("px-a", [(560, 390), (692, 390)], "amber"), trace("px-b", [(1220, 390), (1352, 390)], "violet")),
    ]), beats=[
        ("Phần hai: bản thân Transactional không chứa dòng code nào. Nó chỉ là nhãn dán ghi cấu hình, như propagation, isolation, hay read only.",
         "Phần 2: @Transactional không chứa code, chỉ ghi cấu hình: propagation, isolation, readOnly...",
         [IN("#px-hud", "left", 0.1), IN("#px-tag", "up", 3.4)]),
        ("Lúc khởi động, Spring đưa cho controller một proxy bọc ngoài bean thật. Như lễ tân khách sạn: nhận phòng, dẫn khách vào, rồi trả phòng.",
         "Spring đưa cho controller một proxy bọc bean thật. Như lễ tân: nhận phòng, dẫn khách vào, trả phòng.",
         [IN("#px-c", "pop", 1.4), DRAW("#px-a-p", 2.4, 0.4), IN("#px-p", "pop", 2.8), DRAW("#px-b-p", 4.0, 0.4), IN("#px-s", "pop", 4.4),
          COMET("px-a", 5.6, 0.5), LIGHT("#px-p", 6.1), COMET("px-b", 6.8, 0.5), LIGHT("#px-s", 7.3), IN("#px-note", "up", 7.8)]),
        ("Đã in ra: class được inject có hậu tố Spring CGLIB, tức một subclass. Bên trong có một advisor, và advice của nó là Transaction Interceptor.",
         "Class được inject: ProbeService$$SpringCGLIB$$0. Advice bên trong: TransactionInterceptor.",
         [IN("#px-con", "up", 0.3, 0.4), IN("#px-con-1", "type1", 0.8, 0.3), IN("#px-con-2", "type1", 4.8, 0.3), IN("#px-con-3", "type1", 7.2, 0.3)]),
        ("Vì vậy chỉ lời gọi đi qua proxy mới có transaction. Gọi this chấm method bên trong class thì đi thẳng vào object thật. Async và Cacheable cũng chạy bằng cơ chế này.",
         "Chỉ lời gọi qua proxy mới có transaction; this.method() đi thẳng vào object thật.",
         [IN("#px-self", "left", 3.4), SHAKE("#px-self", 5.6), IN("#px-same", "left", 7.8)]),
    ]),
    # ------------------------------------------------------------ CGLIB vs JDK dynamic proxy
    dict(id="cglib", world=(1920, 1080), hud=hud("cg", "CGLIB và JDK dynamic proxy", "Spring Boot mặc định CGLIB"), cam="".join([
        box("cg-jdk", 160, 190, 760, 190, "<b>JDK dynamic proxy</b><small>class mới implement cùng interface<br>chỉ chặn method của interface<br>không inject được theo class impl</small>", "violet", "card"),
        box("cg-cg", 1000, 190, 760, 190, "<b>CGLIB</b><small>subclass của class gốc<br>chặn mọi method override được<br>class không được final</small>", "cyan", "card"),
        chip("cg-def", 160, 420, "Spring Boot mặc định: spring.aop.proxy-target-class=true → CGLIB", "green"),
        console("cg-con", 160, 500, 1600, ["spring.aop.proxy-target-class=false", "PaymentService (có interface) → demo.$Proxy127",
                                          "ProbeService (không interface) → demo.ProbeService$$SpringCGLIB$$0",
                                          "getBean(PaymentServiceImpl.class) → NoSuchBeanDefinitionException"]),
        chip("cg-repo", 160, 780, "Repository của Spring Data luôn là JDK proxy: demo.$Proxy103", "violet"),
        chip("cg-fin", 160, 860, "Method final: CGLIB không override được, field repo trên proxy là null", "red"),
    ]), beats=[
        ("Phần ba: có hai loại proxy. JDK dynamic proxy tạo class mới implement cùng interface, nên chỉ chặn được method của interface.",
         "Phần 3: JDK proxy implement cùng interface, chỉ chặn method của interface.",
         [IN("#cg-hud", "left", 0.1), IN("#cg-jdk", "left", 2.0)]),
        ("Còn CGLIB tạo subclass của class gốc, chặn mọi method override được, miễn class không final. Spring Boot mặc định dùng CGLIB.",
         "CGLIB tạo subclass: chặn mọi method override được, class không final. Boot mặc định dùng CGLIB.",
         [IN("#cg-cg", "right", 0.3), IN("#cg-def", "left", 6.0)]),
        ("Đã thử tắt mặc định này. Service có interface thành JDK proxy, service không interface vẫn là CGLIB. Và lấy theo class cài đặt thì ném lỗi không tìm thấy bean.",
         "Tắt mặc định: bean có interface thành $Proxy, getBean theo class impl lỗi.",
         [IN("#cg-con", "up", 0.3, 0.4), IN("#cg-con-1", "type1", 0.6, 0.3), IN("#cg-con-2", "type1", 1.8, 0.3), IN("#cg-con-3", "type1", 4.0, 0.3),
          IN("#cg-con-4", "type1", 6.8, 0.3)]),
        ("Repository của Spring Data luôn là JDK proxy, vì ta chỉ khai báo interface. Còn method final thì CGLIB không override được: gọi nó trên proxy, field repo chưa hề được inject.",
         "Repository luôn là JDK proxy. Method final: field repo trên proxy là null.",
         [IN("#cg-repo", "left", 0.4), IN("#cg-fin", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ TransactionInterceptor step by step
    dict(id="interceptor", world=(1920, 1080), hud=hud("ic", "TransactionInterceptor", "Chạy từng bước"), cam="".join([
        gnode("ic-1", 160, 190, 480, 90, "1 · Đọc metadata", "violet"),
        gnode("ic-2", 720, 190, 480, 90, "2 · getTransaction()", "violet"),
        gnode("ic-3", 1280, 190, 480, 90, "3 · Bind ThreadLocal", "cyan"),
        gnode("ic-4", 160, 340, 480, 90, "4 · Gọi method thật", "amber"),
        gnode("ic-5", 720, 340, 480, 90, "5 · Commit / Rollback", "green"),
        gnode("ic-6", 1280, 340, 480, 90, "6 · Dọn dẹp ThreadLocal", "cyan"),
        box("ic-ok", 160, 465, 480, 120, "<b>commit</b><small>trả về bình thường</small>", "green", "card"),
        box("ic-rt", 720, 465, 480, 120, "<b>rollback</b><small>RuntimeException, Error</small>", "red", "card"),
        box("ic-ck", 1280, 465, 480, 120, "<b>vẫn commit</b><small>checked exception</small>", "amber", "card"),
        console("ic-con", 160, 610, 1600, ["Creating new transaction with name [demo.ProbeService.inTx]:", "PROPAGATION_REQUIRED,ISOLATION_DEFAULT",
                                          "Opened new EntityManager [SessionImpl(...)] for JPA transaction", "Initiating transaction commit"]),
        chip("ic-tip", 160, 870, "Không thấy dòng Creating new transaction: proxy không chạy", "amber"),
        wires(trace("ic-a", [(640, 235), (712, 235)], "violet"), trace("ic-b", [(1200, 235), (1272, 235)], "violet"),
              trace("ic-c", [(1520, 280), (1520, 310), (400, 310), (400, 340)], "cyan", r=14),
              trace("ic-d", [(640, 385), (712, 385)], "amber"), trace("ic-e", [(1200, 385), (1272, 385)], "green")),
    ]), beats=[
        ("Phần bốn: lời gọi vào proxy thì Transaction Interceptor chạy sáu bước. Đọc metadata. Gọi get Transaction của transaction manager. Rồi bind connection vào Thread Local.",
         "Phần 4: đọc metadata → getTransaction() → bind tài nguyên vào ThreadLocal.",
         [IN("#ic-hud", "left", 0.1), IN("#ic-1", "pop", 4.6), DRAW("#ic-a-p", 5.6, 0.4), IN("#ic-2", "pop", 5.9), DRAW("#ic-b-p", 8.8, 0.4), IN("#ic-3", "pop", 9.1)]),
        ("Tiếp theo, gọi method thật của bạn. Xong thì commit hoặc rollback. Cuối cùng dọn dẹp, trả connection về pool.",
         "Gọi method thật → commit hoặc rollback → dọn dẹp, trả connection về pool.",
         [DRAW("#ic-c-p", 0.2, 0.6), IN("#ic-4", "pop", 0.8), DRAW("#ic-d-p", 2.6, 0.4), IN("#ic-5", "pop", 2.9), DRAW("#ic-e-p", 4.9, 0.4), IN("#ic-6", "pop", 5.2)]),
        ("Luật mặc định: trả về bình thường thì commit. Runtime Exception hoặc Error thì rollback. Còn checked exception thì vẫn commit, một bẫy rất hay gặp.",
         "Bình thường → commit · RuntimeException, Error → rollback · checked → vẫn commit.",
         [IN("#ic-ok", "up", 1.2), IN("#ic-rt", "up", 3.4), IN("#ic-ck", "up", 6.4), SHAKE("#ic-ck", 7.6)]),
        ("Muốn thấy tận mắt, bật log debug của Jpa Transaction Manager. Dòng Creating new transaction chứng minh proxy đã mở transaction. Không thấy dòng này nghĩa là proxy không chạy.",
         "Log DEBUG của JpaTransactionManager: không có Creating new transaction là proxy không chạy.",
         [IN("#ic-con", "up", 0.3, 0.4), IN("#ic-con-1", "type1", 3.6, 0.3), IN("#ic-con-2", "type1", 4.2, 0.3), IN("#ic-con-3", "type1", 5.4, 0.3),
          IN("#ic-con-4", "type1", 6.4, 0.3), IN("#ic-tip", "left", 8.6)]),
    ]),
    # ------------------------------------------------------------ PlatformTransactionManager
    dict(id="manager", world=(1920, 1080), hud=hud("tm", "PlatformTransactionManager", "Strategy pattern"), cam="".join([
        gnode("tm-i", 160, 200, 480, 100, "TransactionInterceptor", "amber"),
        gnode("tm-p", 760, 200, 700, 100, "PlatformTransactionManager", "violet"),
        el("tm-m", 760, 315, 700, None, "getTransaction() · commit() · rollback()", "note r"),
        box("tm-d", 160, 380, 760, 100, "<b>DataSourceTransactionManager</b><small>JDBC, JdbcTemplate · bind ConnectionHolder</small>", "cyan", "card"),
        box("tm-j", 1000, 380, 760, 100, "<b>JpaTransactionManager</b><small>JPA · EntityManagerHolder + ConnectionHolder</small>", "green", "card"),
        box("tm-t", 160, 500, 760, 100, "<b>JtaTransactionManager</b><small>transaction phân tán nhiều tài nguyên (XA)</small>", "violet", "card"),
        box("tm-r", 1000, 500, 760, 100, "<b>R2dbcTransactionManager</b><small>reactive · Reactor Context, không ThreadLocal</small>", "amber", "card"),
        console("tm-con", 160, 640, 1600, ["transactionManager → org.springframework.orm.jpa.JpaTransactionManager", "dataSource → com.zaxxer.hikari.HikariDataSource"]),
        chip("tm-w1", 160, 800, "2 DataSource → 2 transaction manager · không ghi tên thì dùng bean @Primary", "amber"),
        chip("tm-w2", 160, 875, "Ghi DB thứ hai mà quên transactionManager = \"reportTm\": ngoài transaction", "red"),
        wires(trace("tm-a", [(640, 250), (752, 250)], "amber")),
    ]), beats=[
        ("Phần năm: interceptor không tự biết commit cho từng công nghệ. Nó chỉ nói chuyện với một interface, Platform Transaction Manager, gồm get Transaction, commit, và rollback.",
         "Phần 5: interceptor chỉ nói chuyện với interface PlatformTransactionManager.",
         [IN("#tm-hud", "left", 0.1), IN("#tm-i", "pop", 1.6), DRAW("#tm-a-p", 5.4, 0.4), IN("#tm-p", "pop", 5.8), IN("#tm-m", "fade", 8.6)]),
        ("Mỗi công nghệ một implementation: JDBC thuần có Data Source Transaction Manager, còn JPA có bản riêng. Ngoài ra có bản cho transaction phân tán, và bản reactive.",
         "Mỗi công nghệ một implementation: JDBC, JPA, JTA (phân tán), R2DBC (reactive).",
         [IN("#tm-d", "left", 2.6), IN("#tm-j", "right", 5.4), IN("#tm-t", "left", 8.6), IN("#tm-r", "right", 10.4)]),
        ("Đây là Strategy pattern. Đã đo với Spring Data: transaction manager là bản cho JPA, data source là Hikari.",
         "Strategy pattern. Đã đo: bean là JpaTransactionManager, DataSource là HikariDataSource.",
         [PULSE("#tm-p", 0.6), IN("#tm-con", "up", 1.8, 0.4), IN("#tm-con-1", "type1", 2.4, 0.3), IN("#tm-con-2", "type1", 5.4, 0.3)]),
        ("Bẫy: hai data source thì có hai transaction manager. Không ghi tên sẽ dùng bean Primary, nên ghi vào database thứ hai mà quên chỉ định là nằm ngoài transaction.",
         "2 DataSource: không ghi tên thì dùng @Primary; quên chỉ định cho DB thứ hai là ngoài transaction.",
         [IN("#tm-w1", "left", 0.4), IN("#tm-w2", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ ThreadLocal
    dict(id="threadlocal", world=(1920, 1080), hud=hud("tl", "ThreadLocal", "Vì sao mọi repository dùng chung transaction"), cam="".join([
        gnode("tl-tm", 160, 250, 460, 100, "JpaTransactionManager", "violet"),
        box("tl-map", 740, 180, 600, 240, "<b>ThreadLocal&lt;Map&gt;</b><small>ngăn tủ riêng của thread này<br>EntityManagerHolder<br>ConnectionHolder</small>", "cyan", "card"),
        gnode("tl-r1", 1460, 180, 300, 64, "orderRepo", "amber"),
        gnode("tl-r2", 1460, 268, 300, 64, "stockRepo", "amber"),
        gnode("tl-r3", 1460, 356, 300, 64, "JdbcTemplate", "amber"),
        console("tl-con", 160, 470, 1040, ["trong tx: EntityManagerHolder, ConnectionHolder", "autoCommit = false · connection đang mượn: 1",
                                          "sau tx: map rỗng · connection đang mượn: 0"]),
        box("tl-async", 1260, 470, 500, 195, "<b>@Async trên task-1</b><small>active = false<br>không thấy dòng caller vừa saveAndFlush</small>", "red", "card"),
        chip("tl-c1", 160, 710, "Đổi thread là mất transaction: @Async, supplyAsync, parallelStream, new Thread", "red"),
        chip("tl-c2", 160, 790, "Transaction giữ connection suốt method: chờ API ngoài 5 giây là giữ 5 giây", "amber"),
        chip("tl-c3", 160, 870, "2 request đồng thời: 2 thread, 2 transaction · trạng thái ở thread, không ở bean", "green"),
        wires(trace("tl-a", [(620, 300), (732, 300)], "violet"), trace("tl-b", [(1460, 212), (1348, 212)], "amber"),
              trace("tl-c", [(1460, 300), (1348, 300)], "amber"), trace("tl-d", [(1460, 388), (1348, 388)], "amber")),
    ]), beats=[
        ("Phần sáu: ba object khác nhau, không ai truyền connection cho ai. Sao lại chung một transaction? Nhờ Thread Local.",
         "Phần 6: ba object, không ai truyền connection cho ai, vẫn chung transaction. Nhờ ThreadLocal.",
         [IN("#tl-hud", "left", 0.1), IN("#tl-r1, #tl-r2, #tl-r3", "pop", 0.8, 0.5, 0.25), IN("#tl-map", "zoomin", 6.6, 0.7)]),
        ("Transaction manager bỏ connection và Entity Manager vào ngăn tủ riêng của thread hiện tại. Repository nào chạy sau trên cùng thread thì lấy đúng connection đó.",
         "Connection, EntityManager nằm trong ngăn tủ của thread; repository cùng thread lấy ra dùng.",
         [IN("#tl-tm", "pop", 0.3), DRAW("#tl-a-p", 1.2, 0.4), COMET("tl-a", 2.0, 0.5), PULSE("#tl-map", 2.6),
          DRAW("#tl-b-p", 6.2, 0.4), DRAW("#tl-c-p", 6.5, 0.4), DRAW("#tl-d-p", 6.8, 0.4), COMET("tl-b", 7.8, 0.5), COMET("tl-c", 8.0, 0.5), COMET("tl-d", 8.2, 0.5)]),
        ("Đã đo: trong transaction có hai resource, auto commit bằng false, một connection đang mượn. Sau transaction, map rỗng, không còn connection nào.",
         "Trong transaction: 2 resource, autoCommit = false, 1 connection. Sau đó: map rỗng, 0 connection.",
         [IN("#tl-con", "up", 0.3, 0.4), IN("#tl-con-1", "type1", 1.6, 0.3), IN("#tl-con-2", "type1", 3.4, 0.3), IN("#tl-con-3", "type1", 6.4, 0.3)]),
        ("Hệ quả: đổi thread là mất transaction. Method Async chạy trên task một có active bằng false, và không thấy dòng mà transaction ngoài vừa ghi.",
         "Đổi thread là mất transaction: @Async trên task-1 có active = false, không thấy dòng vừa ghi.",
         [IN("#tl-c1", "left", 0.4), IN("#tl-async", "right", 3.0), SHAKE("#tl-async", 5.0)]),
        ("Transaction giữ connection suốt lúc method chạy: chờ api ngoài năm giây là giữ năm giây. Hai request đồng thời thì có hai transaction riêng, vì trạng thái nằm ở thread.",
         "Chờ API ngoài 5 giây là giữ connection 5 giây. 2 request đồng thời: 2 transaction riêng.",
         [IN("#tl-c2", "left", 0.4), IN("#tl-c3", "left", 6.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("quote", "Metadata", "annotation không chứa code"),
                                                ("shield", "Proxy CGLIB", "chỉ lời gọi qua proxy"),
                                                ("split", "Interceptor", "checked exception vẫn commit"),
                                                ("share", "ThreadLocal", "đổi thread là mất transaction")]),
        chip("ou-next", 600, 650, "Bài tiếp: Khi @Transactional không hoạt động", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: annotation chỉ là metadata. Proxy CGLIB bọc bean, chỉ lời gọi qua proxy mới có transaction. Checked exception mặc định vẫn commit. Và Thread Local giữ connection, nên đổi thread là mất transaction.",
         "Metadata · chỉ lời gọi qua proxy · checked exception vẫn commit · đổi thread là mất transaction.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 2.8), IN("#ou-c2", "pop", 7.4), IN("#ou-c3", "pop", 10.2)]),
        ("Bài tiếp: khi Transactional không hoạt động.", "Bài tiếp: Khi @Transactional không hoạt động.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
