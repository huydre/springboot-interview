"""Khi @Transactional không hoạt động: scene layouts and per-beat narration + motion.

Measured with @SpringBootTest on Spring Boot 3.5.16 (Spring 6.2, Hibernate 6.6, H2 2.3), JDK 21, study note 05.02;
"active" is TransactionSynchronizationManager.isActualTransactionActive() read inside the method:
probe.inTx() active=true, this.inTx() (callSelfTx) active=false, @Lazy self proxy active=true;
public / protected / package-private via proxy active=true (Spring 6); public final active=false repoNull=true;
private called internally active=false; new ProbeService().inTx() active=false;
IllegalStateException and AssertionError -> row gone; IOException -> row kept, log "Initiating transaction commit";
IOException + rollbackFor = Exception.class -> row gone; noRollbackFor = IllegalArgumentException.class -> row kept;
swallow -> row kept; swallowButMark (setRollbackOnly) -> row gone, log "Transactional code has requested rollback";
@Async probe: caller main active=true sees the row, task-1 active=false does not see the uncommitted row.
Kotlin (audited): final class -> startup fails "Cannot subclass final class"; open class + final method -> null fields.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Lưu một dòng rồi ném IOException: dòng còn không?"), "h1 center r"),
        console("hk-con", 360, 440, 1200, ["@Transactional void checked() throws IOException",
                                           "repo.save(item); throw new IOException(\"checked\");",
                                           "Initiating transaction commit → dòng vẫn còn trong DB"]),
        tile("hk-tile", 330, 350, 220, "shield"),
        el("hk-word", 600, 380, 1300, None, letters("@Transactional"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "self-invocation · final · rollback rules · @Async", "kin-sub r"),
    ]), beats=[
        ("Một method Transactional lưu một dòng, rồi ném một checked exception, như lỗi đọc file. Dòng đó còn trong database không?",
         "Method @Transactional lưu một dòng rồi ném IOException. Dòng đó còn trong DB không?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Còn. Đã đo: log ghi initiating transaction commit, và dòng vẫn nằm trong bảng.",
         "Còn. Đã đo: log in \"Initiating transaction commit\", dòng vẫn nằm trong bảng.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 1.4, 0.3), IN("#hk-con-3", "type1", 2.4, 0.3)]),
        ("Hôm nay ta học những trường hợp Transactional không hoạt động, và cách sửa.", "Hôm nay: khi @Transactional không hoạt động.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.8)]),
    ]),
    # ------------------------------------------------------------ the root rule and self-invocation
    dict(id="self", world=(1920, 1080), hud=hud("sf", "Quy tắc gốc và self-invocation", "Chỉ lời gọi qua proxy mới có transaction"), cam="".join([
        big_title("sf", "Proxy", "Transaction được mở bởi interceptor nằm trong proxy"),
        card4("sf-g", 160, 200, 506, 210, 41, [("split", "Không qua proxy", "this · private · final · new"),
                                                ("shield", "Qua proxy nhưng commit", "checked · exception bị nuốt"),
                                                ("share", "Thread khác", "@Async · thread mới")]),
        gnode("sf-caller", 160, 230, 340, 100, "Bean khác", "amber"),
        gnode("sf-proxy", 620, 230, 560, 100, "Proxy + Interceptor", "violet"),
        gnode("sf-target", 1300, 230, 460, 100, "ProbeService thật", "cyan"),
        el("sf-ln", 1060, 440, 700, None, "this.inTx(): đi thẳng, bỏ qua proxy", "note red r"),
        console("sf-con", 160, 540, 1100, ["qua proxy: probe.inTx() → active=true",
                                           "qua this: probe.callSelfTx() → active=false",
                                           "qua @Lazy self: callViaSelfProxy() → active=true"]),
        box("sf-code", 160, 190, 1600, 270, code("public void importOrders(List<OrderDto> rows) {\n"
                                                 "    rows.forEach(this::importOne);   // không transaction nào cả\n}\n"
                                                 "@Transactional\n"
                                                 "public void importOne(OrderDto row) { ... }   // mong mỗi dòng một transaction"), "cyan", "code"),
        chip("sf-f1", 160, 510, "Ưu tiên: tách importOne sang bean khác (OrderImporter)", "green"),
        chip("sf-f2", 160, 590, "TransactionTemplate: ranh giới transaction ngay trong method", "violet"),
        chip("sf-f3", 160, 670, "Inject chính mình bằng @Lazy: sửa nhanh nhưng khó đọc", "amber"),
        el("sf-warn", 160, 770, 1600, None, "Chuyển @Transactional lên importOrders: cả lô chung một transaction, khác ý định mỗi dòng một transaction", "warnbox r"),
        wires(trace("sf-a", [(500, 280), (612, 280)], "amber"), trace("sf-b", [(1180, 280), (1292, 280)], "violet"),
              arrow("sf-loop", [(1460, 330), (1430, 455), (1650, 455), (1620, 338)], "red")),
    ]), beats=[
        ("Phần một: quy tắc gốc. Transaction được mở bởi interceptor nằm trong proxy. Suy ra mọi trường hợp không hoạt động chỉ thuộc ba nhóm.",
         "Phần 1: transaction được mở bởi interceptor trong proxy. Mọi trường hợp hỏng thuộc 3 nhóm.",
         [TYPE("#sf-big", 0.1, 0.06), IN("#sf-bsub", "blur", 0.9), OUT("#sf-big, #sf-bsub", "zoom", 5.0), IN("#sf-hud", "left", 5.4),
          IN("#sf-g0", "pop", 5.8), IN("#sf-g1", "pop", 6.2), IN("#sf-g2", "pop", 6.6)]),
        ("Một: lời gọi không đi qua proxy. Hai: đi qua proxy, nhưng interceptor quyết định commit. Ba: code chạy trên thread khác.",
         "1: không đi qua proxy · 2: qua proxy nhưng interceptor commit · 3: code chạy trên thread khác.",
         [PULSE("#sf-g0", 0.8), PULSE("#sf-g1", 2.8), PULSE("#sf-g2", 6.0)]),
        ("Bắt đầu với self invocation. Bean khác gọi vào thì đi qua proxy, có transaction. Nhưng bên trong class, gọi qua this thì đi thẳng vào object thật.",
         "Self-invocation: bean khác gọi thì qua proxy. Trong class gọi qua this thì đi thẳng vào object thật.",
         [OUT("#sf-g0, #sf-g1, #sf-g2", "fade", 0, 0.4), IN("#sf-caller", "pop", 1.6), DRAW("#sf-a-p", 2.4, 0.4), IN("#sf-proxy", "pop", 2.8),
          DRAW("#sf-b-p", 3.6, 0.4), IN("#sf-target", "pop", 4.0), DRAW("#sf-loop-p", 6.6, 0.6), IN("#sf-loop-h", "pop", 7.2, 0.25),
          IN("#sf-ln", "up", 7.6)]),
        ("Đã đo ngay bên trong method: qua proxy, active bằng true. Qua this, active bằng false. Inject chính mình bằng Lazy, lại là true.",
         "Đo bên trong method: qua proxy active=true · qua this active=false · qua @Lazy self active=true.",
         [IN("#sf-con", "up", 0.3, 0.4), IN("#sf-con-1", "type1", 1.4, 0.3), IN("#sf-con-2", "type1", 3.6, 0.3), IN("#sf-con-3", "type1", 5.6, 0.3)]),
        ("Ví dụ hay gặp: import orders gọi this import one cho từng dòng. Mong mỗi dòng một transaction, nhưng thực tế không có transaction nào.",
         "importOrders gọi this::importOne: mong mỗi dòng một transaction, thực tế không có transaction nào.",
         [OUT("#sf-caller, #sf-proxy, #sf-target, #sf-a, #sf-b, #sf-loop, #sf-ln, #sf-con", "fade", 0, 0.4), IN("#sf-code", "up", 0.6)]),
        ("Cách sửa ưu tiên là tách method sang bean khác. Hoặc dùng Transaction Template, hoặc inject chính mình bằng Lazy. Đừng chuyển annotation lên method ngoài, vì cả lô sẽ chung một transaction.",
         "Ưu tiên tách bean, hoặc TransactionTemplate, @Lazy self. Đừng dồn cả lô vào một transaction.",
         [IN("#sf-f1", "left", 0.4), IN("#sf-f2", "left", 3.0), IN("#sf-f3", "left", 4.8), IN("#sf-warn", "up", 8.0)]),
    ]),
    # ------------------------------------------------------------ private, final, protected, new
    dict(id="final", world=(1920, 1080), hud=hud("fn", "private, final và object tự new", "Proxy là subclass"), cam="".join([
        box("fn-cls", 160, 360, 1600, 150, "<b>class ProbeService$$SpringCGLIB$$ extends ProbeService</b>"
            "<small>override được: public, protected, package-private · không override được: private, final</small>", "violet", "card"),
        box("fn-r1", 160, 190, 1600, 76, "<b>public · protected · package-private, gọi qua proxy → active=true</b>", "green", "card"),
        box("fn-r2", 160, 280, 1600, 76, "<b>public final, gọi qua proxy → active=false · repoNull=true</b>", "red", "card"),
        box("fn-r3", 160, 370, 1600, 76, "<b>private, gọi từ method khác trong class → active=false</b>", "red", "card"),
        box("fn-r4", 160, 460, 1600, 76, "<b>new ProbeService().inTx() → active=false</b>", "red", "card"),
        chip("fn-n1", 160, 580, "Spring 6: protected và package-private đã chạy; tài liệu cũ ghi \"chỉ public\"", "violet"),
        chip("fn-n2", 160, 660, "@Transactional trên private: không warning, không exception, im lặng", "red"),
        chip("fn-n3", 160, 740, "Object tự new không phải bean: không proxy, không field nào được inject", "amber"),
        gnode("fn-px", 160, 220, 620, 110, "Proxy · repo = null", "violet"),
        gnode("fn-tg", 1140, 220, 620, 110, "Object thật · repo đã inject", "cyan"),
        el("fn-fwl", 790, 214, 340, None, "method thường", "lbl r"),
        el("fn-ll", 160, 450, 620, None, "method final: chạy ngay trên proxy", "note red r"),
        chip("fn-npe", 160, 525, "repo.save(...) trên proxy → NullPointerException", "red"),
        chip("fn-k1", 160, 605, "Kotlin: class final → app không khởi động (Cannot subclass final class)", "red"),
        chip("fn-k2", 160, 685, "Kotlin: mở class nhưng quên mở method → method final, field null", "amber"),
        chip("fn-k3", 160, 765, "Cần plugin kotlin-spring", "green"),
        el("fn-tk", 160, 850, 1600, None, "\"Spring 6 hỗ trợ protected và package-private, nhưng em vẫn để public cho rõ ràng\"", "note left green r"),
        wires(trace("fn-fw", [(780, 275), (1132, 275)], "green"),
              arrow("fn-loop", [(380, 330), (350, 455), (590, 455), (560, 338)], "red")),
    ]), beats=[
        ("Phần hai: private, final, và object tự new. Proxy là một lớp con, nên chỉ chặn được method mà lớp con override được.",
         "Phần 2: proxy là một subclass, chỉ chặn được method override được.",
         [IN("#fn-hud", "left", 0.1), IN("#fn-cls", "up", 2.6)]),
        ("Đã đo: public, protected và package private gọi qua proxy đều có transaction. Còn method final, method private, và object tự new thì không.",
         "Đã đo: public, protected, package-private qua proxy đều active=true. final, private, tự new: active=false.",
         [OUT("#fn-cls", "fade", 0, 0.4), IN("#fn-r1", "left", 0.6), IN("#fn-r2", "left", 4.6), IN("#fn-r3", "left", 5.8), IN("#fn-r4", "left", 7.4)]),
        ("Spring sáu đã hỗ trợ protected. Nhiều tài liệu cũ ghi chỉ public, đó là Spring năm. Transactional trên method private thì im lặng không làm gì. Object tự new không phải bean, nên không có proxy.",
         "Spring 6 hỗ trợ protected. @Transactional trên private im lặng không làm gì. Tự new: không phải bean.",
         [IN("#fn-n1", "left", 0.4), IN("#fn-n2", "left", 5.4), IN("#fn-n3", "left", 9.6)]),
        ("Method final nguy hiểm hơn bạn nghĩ. Proxy không override được, nên method chạy ngay trên object proxy. Mà proxy thì không được inject field.",
         "Method final: proxy không override được, nên method chạy ngay trên proxy, nơi field không được inject.",
         [OUT("#fn-r1, #fn-r2, #fn-r3, #fn-r4, #fn-n1, #fn-n2, #fn-n3", "fade", 0, 0.4), IN("#fn-px", "pop", 0.8), DRAW("#fn-fw-p", 1.6, 0.5),
          IN("#fn-fwl", "fade", 1.8), IN("#fn-tg", "pop", 2.2), DRAW("#fn-loop-p", 4.6, 0.6), IN("#fn-loop-h", "pop", 5.2, 0.25), IN("#fn-ll", "up", 5.6)]),
        ("Kết quả không chỉ mất transaction. Đụng tới repository là Null Pointer Exception.",
         "Không chỉ mất transaction: đụng tới repo là NullPointerException.",
         [IN("#fn-npe", "left", 0.4), SHAKE("#fn-npe", 2.6)]),
        ("Bẫy này hay gặp với Kotlin, vì class và method mặc định là final. Class final thì app không khởi động được. Mở class mà quên mở method thì gặp field bị rỗng. Cần plugin Kotlin Spring.",
         "Kotlin mặc định final: class final thì app không khởi động; method final thì field null. Cần kotlin-spring.",
         [IN("#fn-k1", "left", 2.8), IN("#fn-k2", "left", 6.0), IN("#fn-k3", "left", 9.6)]),
        ("Khi phỏng vấn, nói: Spring sáu hỗ trợ protected và package private, nhưng em vẫn để public cho rõ ràng.",
         "\"Spring 6 hỗ trợ protected và package-private, nhưng em vẫn để public cho rõ ràng.\"",
         [IN("#fn-tk", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ rollback rules
    dict(id="rollback", world=(1920, 1080), hud=hud("rb", "Rollback rules", "Checked exception vẫn commit"), cam="".join([
        box("rb-g", 160, 190, 760, 120, "<b>RuntimeException · Error</b><b>→ rollback</b>", "green", "card"),
        box("rb-r", 1000, 190, 760, 120, "<b>Checked exception</b><b>→ COMMIT</b>", "red", "card"),
        el("rb-why", 160, 345, 1600, None, "Quy ước từ EJB: checked exception là kết quả nghiệp vụ dự kiến (\"số dư không đủ\"), unchecked là lỗi hệ thống", "note left r"),
        console("rb-con", 160, 440, 1600, ["IllegalStateException · mặc định → dòng mất (rollback)",
                                           "AssertionError · mặc định → dòng mất (rollback)",
                                           "IOException · mặc định → dòng CÒN · Initiating transaction commit",
                                           "IOException · rollbackFor = Exception.class → dòng mất",
                                           "IllegalArgumentException · noRollbackFor = IllegalArgumentException.class → còn"]),
        chip("rb-c1", 160, 770, "Business exception extends RuntimeException, hoặc rollbackFor = Exception.class", "green"),
        chip("rb-c2", 160, 850, "rollbackFor chỉ thêm, khớp cả subclass · Kotlin extends Exception vẫn là checked", "violet"),
    ]), beats=[
        ("Phần ba: rollback rules. Mặc định Spring chỉ rollback khi gặp Runtime Exception hoặc Error. Checked exception thì commit.",
         "Phần 3: mặc định chỉ rollback với RuntimeException và Error. Checked exception: commit.",
         [IN("#rb-hud", "left", 0.1), IN("#rb-g", "pop", 2.6), IN("#rb-r", "pop", 6.6)]),
        ("Vì sao? Quy ước này kế thừa từ Enterprise Java Beans: checked exception là kết quả nghiệp vụ dự kiến, ví dụ số dư không đủ.",
         "Quy ước từ EJB: checked exception là kết quả nghiệp vụ dự kiến, ví dụ số dư không đủ.",
         [IN("#rb-why", "up", 0.6)]),
        ("Đã đo: ném Runtime Exception hay Error thì dòng bị rollback. Ném checked exception thì dòng vẫn còn. Thêm rollback for Exception thì mất. Còn no rollback for thì giữ dòng.",
         "Runtime, Error: rollback · checked: dòng còn · rollbackFor: mất · noRollbackFor: giữ dòng.",
         [IN("#rb-con", "up", 0.3, 0.4), IN("#rb-con-1", "type1", 1.4, 0.3), IN("#rb-con-2", "type1", 2.4, 0.3), IN("#rb-con-3", "type1", 4.6, 0.3),
          IN("#rb-con-4", "type1", 7.4, 0.3), IN("#rb-con-5", "type1", 9.6, 0.3)]),
        ("Nguy hiểm ở chỗ exception vẫn ném ra cho caller. Caller tưởng đã thất bại, trong khi dữ liệu đã được lưu.",
         "Exception vẫn ném ra: caller tưởng đã thất bại, trong khi dữ liệu đã được lưu.",
         [PULSE("#rb-r", 0.6)]),
        ("Cách làm: business exception kế thừa Runtime Exception, hoặc thống nhất rollback for Exception. Rollback for chỉ thêm, không thay rule mặc định. Và Kotlin, class kế thừa Exception vẫn bị coi là checked.",
         "Business exception extends RuntimeException, hoặc rollbackFor = Exception.class. rollbackFor chỉ thêm.",
         [IN("#rb-c1", "left", 0.4), IN("#rb-c2", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ swallowed exceptions
    dict(id="swallow", world=(1920, 1080), hud=hud("sw", "Exception bị nuốt", "Interceptor chỉ thấy exception bay ra"), cam="".join([
        box("sw-code", 160, 190, 1100, 250, code("@Transactional public void swallow(String n) {\n"
                                                 "    repo.save(new Item(n));\n"
                                                 "    try { throw new IllegalStateException(\"boom\"); }\n"
                                                 "    catch (RuntimeException e) { }   // nuốt\n}"), "cyan", "code"),
        gnode("sw-ic", 1340, 220, 420, 100, "Interceptor", "violet"),
        el("sw-st", 1340, 360, 420, None, "Không thấy lỗi → commit", "stamp red r"),
        chip("sw-res", 160, 490, "Đã đo: không có exception ra ngoài → dòng vẫn còn (commit)", "red"),
        chip("sw-fix", 160, 570, "Sửa: catch (X e) { log; throw new OrderFailedException(e); }", "green"),
        box("sw-code2", 160, 190, 1600, 170, code("catch (RuntimeException e) {\n"
                                                  "    TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();\n}"), "cyan", "code"),
        console("sw-log", 160, 400, 1600, ["Transactional code has requested rollback → dòng mất"]),
        el("sw-warn", 160, 580, 1600, None, "Ngoại lệ: exception ném từ method @Transactional của bean khác đã đánh dấu rollback-only. Nuốt nó → UnexpectedRollbackException lúc commit", "warnbox r"),
        chip("sw-next", 160, 760, "Đo chi tiết ở bài Propagation", "violet"),
    ]), beats=[
        ("Phần bốn: exception bị nuốt. Interceptor chỉ biết có lỗi khi exception bay ra khỏi method.",
         "Phần 4: interceptor chỉ biết có lỗi khi exception bay ra khỏi method.",
         [IN("#sw-hud", "left", 0.1), IN("#sw-code", "up", 2.4), IN("#sw-ic", "pop", 4.2)]),
        ("Bắt rồi chỉ ghi log, interceptor thấy method trả về bình thường, và commit. Đã đo: dòng vẫn còn.",
         "Catch rồi chỉ log: method trả về bình thường, interceptor commit. Dòng vẫn còn.",
         [IN("#sw-st", "stamp", 2.6), IN("#sw-res", "left", 5.2)]),
        ("Cách sửa nên dùng: ném lại, hoặc bọc vào exception nghiệp vụ.",
         "Sửa: ném lại, hoặc bọc vào exception nghiệp vụ.",
         [IN("#sw-fix", "left", 0.4)]),
        ("Nếu thật sự muốn trả về bình thường mà vẫn rollback, gọi set rollback only. Log sẽ ghi transactional code has requested rollback.",
         "Muốn trả về bình thường mà vẫn rollback: setRollbackOnly().",
         [OUT("#sw-code, #sw-ic, #sw-st, #sw-res, #sw-fix", "fade", 0, 0.4), IN("#sw-code2", "up", 0.6), IN("#sw-log", "up", 5.0, 0.4), IN("#sw-log-1", "type1", 5.4, 0.3)]),
        ("Có một ngoại lệ. Exception ném từ method Transactional của bean khác đã đánh dấu transaction rollback only. Nuốt nó thì lúc commit nổ Unexpected Rollback Exception.",
         "Bean khác đã đánh dấu rollback-only: nuốt exception → UnexpectedRollbackException.",
         [IN("#sw-warn", "up", 0.6), IN("#sw-next", "left", 8.4)]),
    ]),
    # ------------------------------------------------------------ another thread, other causes, debugging
    dict(id="thread", world=(1920, 1080), hud=hud("th", "Thread khác và cách debug", "Transaction nằm trong ThreadLocal"), cam="".join([
        gnode("th-main", 160, 220, 700, 110, "main · active=true", "amber"),
        gnode("th-task", 1060, 220, 700, 110, "task-1 · @Async · active=false", "red"),
        el("th-ml", 160, 350, 700, None, "saveAndFlush: thấy dòng vừa lưu", "note green r"),
        el("th-tl", 1060, 350, 700, None, "không thấy dòng: chưa commit", "note red r"),
        el("th-rule", 160, 430, 1600, None, "Transaction nằm trong ThreadLocal của thread đã mở nó", "note left r"),
        chip("th-bug", 160, 520, "Lưu đơn rồi @Async sendConfirmation(orderId): findById ra rỗng", "red"),
        chip("th-f1", 160, 600, "Thread mới tự mở transaction (bean khác hoặc TransactionTemplate)", "green"),
        chip("th-f2", 160, 680, "@TransactionalEventListener(phase = AFTER_COMMIT) + @Async", "green"),
        chip("th-o1", 160, 200, "Nhiều DataSource: dùng nhầm transaction manager", "amber"),
        chip("th-o2", 160, 280, "MySQL bảng MyISAM không có transaction: dùng InnoDB", "amber"),
        chip("th-o3", 160, 360, "@PostConstruct gọi method @Transactional của chính bean", "amber"),
        chip("th-o4", 160, 440, "jakarta.transaction.Transactional: không có readOnly, isolation", "amber"),
        card4("th-d", 160, 560, 377, 250, 30, [("grid", "Log DEBUG", "Creating new transaction"),
                                                ("eq", "Trạng thái", "isActualTransactionActive"),
                                                ("box", "getClass()", "có $$SpringCGLIB$$ không"),
                                                ("split", "Exception", "có bay ra khỏi method")]),
        wires(trace("th-a", [(860, 275), (1052, 275)], "violet", dashed=True)),
    ]), beats=[
        ("Phần năm: code chạy trên thread khác. Transaction nằm trong Thread Local của thread đã mở nó.",
         "Phần 5: transaction nằm trong ThreadLocal của thread đã mở nó.",
         [IN("#th-hud", "left", 0.1), IN("#th-main", "pop", 1.6), IN("#th-rule", "up", 3.4)]),
        ("Đã đo: caller trên thread main lưu và flush một dòng, thấy dòng đó. Method Async trên thread task một không có transaction, và không thấy dòng đó, vì chưa commit.",
         "main: active=true, thấy dòng · task-1 (@Async): active=false, không thấy dòng.",
         [IN("#th-ml", "up", 2.6), DRAW("#th-a-p", 4.6, 0.5), IN("#th-task", "pop", 5.0), IN("#th-tl", "up", 8.4)]),
        ("Lỗi thực tế: lưu đơn hàng rồi gọi Async gửi xác nhận, method async tìm đơn ra rỗng. Sửa: thread mới tự mở transaction, hoặc dùng Transactional Event Listener after commit, kết hợp Async.",
         "@Async gửi xác nhận: findById rỗng. Sửa: tự mở transaction, hoặc AFTER_COMMIT + @Async.",
         [IN("#th-bug", "left", 0.4), IN("#th-f1", "left", 6.2), IN("#th-f2", "left", 9.4)]),
        ("Còn vài nguyên nhân khác: dùng nhầm transaction manager khi có nhiều database, bảng không hỗ trợ transaction, gọi trong Post Construct, hoặc nhầm annotation Transactional của Jakarta.",
         "Khác: nhầm transaction manager · bảng MyISAM · @PostConstruct · nhầm annotation jakarta.",
         [OUT("#th-main, #th-task, #th-a, #th-ml, #th-tl, #th-rule, #th-bug, #th-f1, #th-f2", "fade", 0, 0.4),
          IN("#th-o1", "left", 1.6), IN("#th-o2", "left", 4.6), IN("#th-o3", "left", 7.0), IN("#th-o4", "left", 9.2)]),
        ("Cách debug: bật log debug của transaction manager, in trạng thái active ngay trong method, in tên class của bean, và xem exception có bay ra khỏi method không.",
         "Debug: log DEBUG · isActualTransactionActive · getClass() · exception có ra ngoài không.",
         [IN("#th-d0", "pop", 0.4), IN("#th-d1", "pop", 3.4), IN("#th-d2", "pop", 6.0), IN("#th-d3", "pop", 8.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt: 3 nhóm"), "h1 center r"),
        card4("ou-c", 200, 290, 480, 280, 40, [("split", "Không qua proxy", "this · private · final · new"),
                                                ("shield", "Qua proxy nhưng commit", "checked · exception bị nuốt"),
                                                ("share", "Thread khác", "ThreadLocal không theo sang")]),
        chip("ou-next", 797, 650, "Bài tiếp: Propagation", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại ba nhóm: lời gọi không qua proxy, đi qua proxy nhưng interceptor commit, và code chạy trên thread khác. Cả ba đều suy ra từ cơ chế proxy.",
         "3 nhóm: không qua proxy · qua proxy nhưng commit · thread khác. Đều suy ra từ cơ chế proxy.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 1.6), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.4)]),
        ("Bài tiếp: Propagation.", "Bài tiếp: Propagation.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
