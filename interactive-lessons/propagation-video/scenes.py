"""Propagation explainer: scene layouts and per-beat narration + motion.

Outputs from @SpringBootTest on Spring Boot 3.5.16 (Spring 6.2, Hibernate 6.6, H2 2.3, HikariCP) on JDK 21, study note 05.03,
log lines verbatim from JpaTransactionManager at DEBUG:
REQUIRED outer swallows inner RuntimeException -> UnexpectedRollbackException "Transaction silently rolled back because it has been
marked as rollback-only", rows rq and rq-inner both gone; log "Participating in existing transaction", "Participating transaction failed -
marking existing transaction as rollback-only", "Initiating transaction commit"; inner checked exception -> both rows saved;
MANDATORY without tx -> IllegalTransactionStateException "No existing transaction found for transaction marked with propagation 'mandatory'";
SUPPORTS without tx: name demo.InnerService.supports, isActualTransactionActive() false;
REQUIRES_NEW audit: outer IllegalStateException, row au rolled back, audit "attempt au" = 1 row, SessionImpl(85284187) commits,
SessionImpl(1860900345) rolls back; inner REQUIRES_NEW fails, outer swallows -> outer row committed, no UnexpectedRollbackException;
NESTED with DataSourceTransactionManager + JdbcTemplate: inner fails, outer commits -> [outer]; inner ok, outer throws -> [];
NESTED with JpaTransactionManager -> NestedTransactionNotSupportedException "JpaDialect does not support savepoints" at savepoint creation;
active connections: outer 1, inner REQUIRES_NEW 2; pool size 1, connection-timeout 500 -> "HikariPool-2 - Connection is not available,
request timed out after 504ms (total=1, active=1, idle=0, waiting=0)"; HikariCP default connection-timeout 30 s.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def row(id_, name, have, none, tone="cyan"):
    """One line of the propagation table: name | already in a transaction | no transaction yet."""
    inner = (f'<span style="font:700 28px var(--mono);color:#fff">{esc(name)}</span>'
             f'<span>{esc(have)}</span><span>{esc(none)}</span>')
    return el(id_, 160, 0, 1600, 62, inner, f"gbox {tone} r",
              "display:grid;grid-template-columns:470px 600px 470px;align-items:center;justify-items:start;padding:0 28px;font-size:28px")


def rows(prefix, y0, step, items):
    out = []
    for i, (name, have, none, tone) in enumerate(items, 1):
        out.append(row(f"{prefix}{i}", name, have, none, tone).replace("top:0px", f"top:{y0 + (i - 1) * step}px"))
    return "".join(out)


SEVEN = [
    ("REQUIRED", "Tham gia", "Tạo mới", "green"),
    ("REQUIRES_NEW", "Tạm dừng, tạo mới độc lập", "Tạo mới", "amber"),
    ("NESTED", "Savepoint trong tx hiện tại", "Tạo mới", "violet"),
    ("SUPPORTS", "Tham gia", "Chạy không transaction", "cyan"),
    ("NOT_SUPPORTED", "Tạm dừng, chạy không tx", "Chạy không transaction", "cyan"),
    ("MANDATORY", "Tham gia", "Ném exception", "red"),
    ("NEVER", "Ném exception", "Chạy không transaction", "red"),
]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Đã catch exception, sao vẫn rollback?"), "h1 center r"),
        console("hk-con", 300, 420, 1320, ["outer() catch RuntimeException của inner() rồi commit", "UnexpectedRollbackException: Transaction silently",
                                           "rolled back because it has been marked as rollback-only"]),
        tile("hk-tile", 400, 350, 220, "share"),
        el("hk-word", 670, 380, 1200, None, letters("Propagation"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "REQUIRED · REQUIRES_NEW · NESTED · connection pool", "kin-sub r"),
    ]), beats=[
        ("Method ngoài đã bắt exception của method bên trong, vậy mà Spring vẫn rollback, và còn ném thêm một exception nữa. Vì sao?",
         "Method ngoài đã bắt exception của method trong, vậy mà vẫn rollback. Vì sao?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đây là kết quả đo thật: transaction đã bị âm thầm rollback, vì nó bị đánh dấu rollback only.",
         "Đo thật: transaction bị âm thầm rollback vì đã bị đánh dấu rollback-only.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 2.4, 0.3), IN("#hk-con-3", "type1", 4.0, 0.3)]),
        ("Hôm nay ta học propagation trong Spring.", "Hôm nay: Propagation.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.1)]),
    ]),
    # ------------------------------------------------------------ logical vs physical
    dict(id="logical", world=(1920, 1080), hud=hud("lo", "Logical và physical transaction", "Một chuyến xe, nhiều hành khách"), cam="".join([
        big_title("lo", "Propagation", "Đã có transaction đang chạy thì method làm gì?"),
        gnode("lo-phy", 160, 200, 1600, 96, "Physical transaction · 1 connection · 1 COMMIT hoặc ROLLBACK thật", "violet"),
        gnode("lo-o", 160, 380, 560, 100, "outer() · mở chuyến", "amber"),
        gnode("lo-i", 840, 380, 520, 100, "inner() · REQUIRED", "cyan"),
        el("lo-st", 1420, 405, 340, None, "rollback-only", "stamp red r"),
        chip("lo-c1", 160, 550, "Logical: mỗi method @Transactional mà proxy chặn được", "cyan"),
        chip("lo-c2", 160, 630, "Chỉ logical ngoài cùng mới COMMIT hoặc ROLLBACK thật", "green"),
        chip("lo-c3", 160, 710, "Logical bên trong lỗi: chỉ đánh dấu rollback-only", "red"),
        el("lo-note", 160, 810, 1600, None, "Hành khách gặp sự cố chỉ gắn biển \"xe hỏng\", cả chuyến phải quay đầu", "note left r"),
        wires(trace("lo-a", [(720, 430), (832, 430)], "cyan"),
              trace("lo-b", [(440, 296), (440, 372)], "violet"), trace("lo-c", [(1100, 296), (1100, 372)], "violet")),
    ]), beats=[
        ("Phần một: logical và physical transaction. Propagation trả lời câu hỏi: đã có transaction đang chạy, thì method transactional làm gì?",
         "Phần 1: propagation quyết định method @Transactional làm gì khi đã có transaction đang chạy.",
         [TYPE("#lo-big", 0.1, 0.06), IN("#lo-bsub", "blur", 1.0), OUT("#lo-big, #lo-bsub", "zoom", 5.6), IN("#lo-hud", "left", 6.2)]),
        ("Physical transaction là transaction thật ở database, gắn với một connection, và chỉ có một lần commit hoặc rollback thật.",
         "Physical: transaction thật ở DB, gắn với một connection, một lần COMMIT hoặc ROLLBACK.",
         [IN("#lo-phy", "pop", 0.4)]),
        ("Logical transaction là phạm vi của mỗi method mà proxy chặn được. Nhiều logical có thể nằm trên cùng một physical.",
         "Logical: phạm vi của mỗi method mà proxy chặn được. Nhiều logical nằm trên một physical.",
         [IN("#lo-o", "pop", 0.4), DRAW("#lo-b-p", 0.9, 0.4), IN("#lo-c1", "left", 1.6), DRAW("#lo-a-p", 4.6, 0.4), IN("#lo-i", "pop", 5.0),
          DRAW("#lo-c-p", 5.6, 0.4)]),
        ("Ví von: physical là một chuyến xe, mỗi method là một hành khách. Với Required, hành khách sau lên chung xe. Chỉ người mở chuyến mới quyết định về bến.",
         "Physical là chuyến xe, mỗi method là hành khách. Chỉ người mở chuyến (method ngoài cùng) quyết định về bến.",
         [PULSE("#lo-phy", 0.6), PULSE("#lo-o", 6.4), IN("#lo-c2", "left", 6.8)]),
        ("Hành khách bên trong gặp sự cố chỉ có thể gắn biển xe hỏng, tức rollback only, và cả chuyến phải quay đầu.",
         "Hành khách gặp sự cố chỉ gắn biển \"xe hỏng\" (rollback-only), cả chuyến phải quay đầu.",
         [IN("#lo-st", "stamp", 1.4), IN("#lo-c3", "left", 2.6), IN("#lo-note", "up", 3.0)]),
    ]),
    # ------------------------------------------------------------ seven propagation types
    dict(id="seven", world=(1920, 1080), hud=hud("sv", "Bảy loại propagation", "Đã có hoặc chưa có transaction"), cam="".join([
        el("sv-h", 160, 190, 1600, None,
           '<span>Propagation</span><span>Đã có transaction</span><span>Chưa có transaction</span>', "lbl r",
           "display:grid;grid-template-columns:470px 600px 470px;justify-items:start;padding:0 28px"),
        rows("sv-r", 240, 74, SEVEN),
        chip("sv-u1", 160, 190, "REQUIRED: 95% trường hợp", "green"),
        chip("sv-u2", 160, 270, "REQUIRES_NEW: audit log, lịch sử lỗi, cấp số thứ tự", "amber"),
        chip("sv-u3", 160, 350, "MANDATORY: method tầng thấp bắt caller mở transaction trước", "violet"),
        console("sv-con", 160, 440, 1600, ["IllegalTransactionStateException: No existing transaction found",
                                           "for transaction marked with propagation 'mandatory'"]),
        chip("sv-w1", 160, 650, "this.audit() với REQUIRES_NEW: không qua proxy, vẫn chung transaction", "red"),
        chip("sv-w2", 160, 730, "SUPPORTS ngoài tx: có tên demo.InnerService.supports nhưng không có tx thật", "amber"),
        el("sv-w3", 160, 820, 1600, None, "Kiểm tra bằng isActualTransactionActive(), không dựa vào tên: ở đây nó trả về false", "note left r"),
    ]), beats=[
        ("Phần hai: bảy loại propagation. Mặc định là Required: đã có transaction thì tham gia, chưa có thì tạo mới.",
         "Phần 2: REQUIRED (mặc định): đã có thì tham gia, chưa có thì tạo mới.",
         [IN("#sv-hud", "left", 0.1), IN("#sv-h", "fade", 0.6), IN("#sv-r1", "left", 2.6)]),
        ("Requires New tạm dừng transaction cũ, mở một cái mới độc lập. Nested đặt một save point trong transaction hiện tại.",
         "REQUIRES_NEW tạm dừng cái cũ, mở cái mới độc lập. NESTED đặt savepoint trong transaction hiện tại.",
         [IN("#sv-r2", "left", 0.3), IN("#sv-r3", "left", 4.4)]),
        ("Supports và Not Supported dành cho việc không cần transaction. Mandatory bắt buộc phải có sẵn, Never bắt buộc không có. Sai là ném exception.",
         "SUPPORTS, NOT_SUPPORTED: không cần transaction. MANDATORY phải có sẵn, NEVER phải không có, sai là ném exception.",
         [IN("#sv-r4", "left", 0.3), IN("#sv-r5", "left", 1.4), IN("#sv-r6", "left", 4.6), IN("#sv-r7", "left", 6.6)]),
        ("Thực tế, Required cho chín mươi lăm phần trăm trường hợp. Requires New cho audit log và lịch sử lỗi. Mandatory bắt caller mở transaction trước.",
         "REQUIRED cho 95%. REQUIRES_NEW cho audit log, lịch sử lỗi. MANDATORY bắt caller mở transaction trước.",
         [OUT("#sv-h, #sv-r1, #sv-r2, #sv-r3, #sv-r4, #sv-r5, #sv-r6, #sv-r7", "fade", 0, 0.4), IN("#sv-u1", "left", 0.6), IN("#sv-u2", "left", 3.8),
          IN("#sv-u3", "left", 6.8), IN("#sv-con", "up", 8.0, 0.4), IN("#sv-con-1", "type1", 8.4, 0.3), IN("#sv-con-2", "type1", 8.9, 0.3)]),
        ("Bẫy: propagation chỉ có tác dụng khi gọi qua proxy. Và Supports ngoài transaction vẫn có tên, nhưng không có transaction thật.",
         "Bẫy: chỉ có tác dụng khi gọi qua proxy. SUPPORTS ngoài tx vẫn có tên nhưng không có transaction thật.",
         [IN("#sv-w1", "left", 0.4), IN("#sv-w2", "left", 3.8), IN("#sv-w3", "up", 5.0)]),
    ]),
    # ------------------------------------------------------------ REQUIRED and UnexpectedRollbackException
    dict(id="required", world=(1920, 1080), hud=hud("rq", "REQUIRED và UnexpectedRollbackException", "Đã bắt exception, vẫn rollback"), cam="".join([
        box("rq-code", 160, 190, 1060, 210, code("@Transactional public void requiredSwallow(String n) {\n    repo.save(new Item(n));\n"
                                                 "    try { inner.requiredThrows(n + \"-inner\"); }  // bean khác\n"
                                                 "    catch (RuntimeException e) { }               // nuốt\n}"), "cyan", "code"),
        box("rq-db", 1280, 190, 480, 210, "<b>Trong DB</b><small>rq (outer): không</small><small>rq-inner: không</small>", "red", "card"),
        console("rq-con", 160, 440, 1600, ["Creating new transaction with name [demo.OuterService.requiredSwallow]",
                                           "Participating in existing transaction",
                                           "Participating transaction failed - marking existing transaction as rollback-only",
                                           "Initiating transaction commit",
                                           "UnexpectedRollbackException: Transaction silently rolled back"]),
        box("rq-i1", 160, 190, 700, 76, "<b>Inner lỗi thì cả nghiệp vụ hỏng</b>", "amber", "card"), el("rq-a1", 870, 205, 120, None, "→", "lbl r"),
        box("rq-f1", 1000, 190, 760, 76, "<b>Đừng nuốt, ném tiếp ra</b>", "green", "card"),
        box("rq-i2", 160, 290, 700, 76, "<b>Inner là việc phụ</b>", "amber", "card"), el("rq-a2", 870, 305, 120, None, "→", "lbl r"),
        box("rq-f2", 1000, 290, 760, 76, "<b>Cho inner REQUIRES_NEW</b>", "green", "card"),
        box("rq-i3", 160, 390, 700, 76, "<b>Chỉ huỷ phần của inner</b>", "amber", "card"), el("rq-a3", 870, 405, 120, None, "→", "lbl r"),
        box("rq-f3", 1000, 390, 760, 76, "<b>NESTED với JDBC, hoặc kiểm tra trước</b>", "green", "card"),
        box("rq-i4", 160, 490, 700, 76, "<b>Inner không cần transaction</b>", "amber", "card"), el("rq-a4", 870, 505, 120, None, "→", "lbl r"),
        box("rq-f4", 1000, 490, 760, 76, "<b>Bỏ @Transactional ở inner</b>", "green", "card"),
        chip("rq-ck", 160, 620, "Inner ném checked exception: không đánh dấu rollback-only, cả hai dòng được lưu", "violet"),
    ]), beats=[
        ("Phần ba: Required và Unexpected Rollback Exception. Outer và inner đều Required, ở hai bean khác nhau. Inner ném lỗi, outer bắt lại rồi chạy tiếp.",
         "Phần 3: outer và inner đều REQUIRED, ở hai bean khác nhau. Inner ném RuntimeException, outer bắt lại.",
         [IN("#rq-hud", "left", 0.1), IN("#rq-code", "up", 4.0)]),
        ("Inner tham gia transaction của outer. Exception đi qua proxy của inner, nên cả transaction bị đánh dấu rollback only.",
         "Inner tham gia transaction của outer. Exception đi qua proxy của inner: cả transaction bị đánh dấu rollback-only.",
         [IN("#rq-con", "up", 0.2, 0.4), IN("#rq-con-1", "type1", 0.5, 0.3), IN("#rq-con-2", "type1", 1.2, 0.3), IN("#rq-con-3", "type1", 3.8, 0.3)]),
        ("Outer trả về bình thường và gọi commit. Transaction manager thấy cờ rollback only, nên rollback thật, rồi ném exception để báo cho caller.",
         "Outer gọi commit. Thấy cờ rollback-only nên rollback thật, rồi ném UnexpectedRollbackException.",
         [IN("#rq-con-4", "type1", 0.4, 0.3), IN("#rq-con-5", "type1", 4.6, 0.3), SHAKE("#rq-con", 5.4)]),
        ("Cả dòng của outer lẫn dòng của inner đều mất. Spring phải báo lỗi, vì nếu im lặng, caller sẽ tưởng dữ liệu đã được lưu.",
         "Cả hai dòng đều mất. Im lặng thì caller sẽ tưởng dữ liệu đã được lưu.",
         [IN("#rq-db", "pop", 0.4)]),
        ("Cách sửa tuỳ ý định. Lỗi phải làm hỏng cả luồng thì đừng nuốt exception. Việc phụ thì dùng Requires New. Chỉ huỷ phần inner thì dùng Nested với JDBC. Không cần transaction thì bỏ annotation ở inner.",
         "Sửa theo ý định: đừng nuốt · REQUIRES_NEW · NESTED với JDBC · bỏ @Transactional ở inner.",
         [OUT("#rq-code, #rq-db, #rq-con", "fade", 0, 0.4), IN("#rq-i1", "left", 0.6), IN("#rq-a1", "fade", 2.0), IN("#rq-f1", "right", 2.3),
          IN("#rq-i2", "left", 4.6), IN("#rq-a2", "fade", 5.4), IN("#rq-f2", "right", 5.7),
          IN("#rq-i3", "left", 7.6), IN("#rq-a3", "fade", 8.6), IN("#rq-f3", "right", 8.9),
          IN("#rq-i4", "left", 11.0), IN("#rq-a4", "fade", 12.0), IN("#rq-f4", "right", 12.3)]),
        ("Lưu ý: nếu method bên trong ném checked exception, thì không bị đánh dấu rollback only, cả hai dòng đều được lưu.",
         "Inner ném checked exception: không đánh dấu rollback-only, cả hai dòng được lưu.",
         [IN("#rq-ck", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ REQUIRES_NEW
    dict(id="requiresnew", world=(1920, 1080), hud=hud("rn", "REQUIRES_NEW", "Transaction độc lập, connection riêng"), cam="".join([
        gnode("rn-o", 160, 190, 700, 100, "outer · connection 1", "amber"),
        gnode("rn-i", 1060, 190, 700, 100, "audit.log() · connection 2", "green"),
        chip("rn-sus", 160, 320, "Tạm dừng outer: tháo resource khỏi ThreadLocal, xong thì resume", "amber"),
        console("rn-con", 160, 410, 1600, ["Suspending current transaction, creating new transaction",
                                           "Committing JPA transaction on EntityManager [SessionImpl(85284187<open>)]",
                                           "Resuming suspended transaction after completion of inner transaction",
                                           "Rolling back JPA transaction on EntityManager [SessionImpl(1860900345<open>)]"]),
        box("rn-r1", 160, 670, 760, 86, "<b>Dòng nghiệp vụ: rollback</b>", "red", "card"),
        box("rn-r2", 1000, 670, 760, 86, "<b>Audit \"attempt au\": còn 1 dòng</b>", "green", "card"),
        chip("rn-c1", 160, 790, "Inner REQUIRES_NEW lỗi, outer nuốt: outer vẫn commit, không có UnexpectedRollbackException", "green"),
        chip("rn-c2", 160, 870, "Bean khác · không thấy dữ liệu chưa commit của outer · tốn thêm 1 connection", "red"),
        wires(trace("rn-a", [(860, 240), (1052, 240)], "green")),
    ]), beats=[
        ("Phần bốn: Requires New. Nó tạm dừng transaction hiện tại, rồi mở transaction mới trên một connection mới.",
         "Phần 4: REQUIRES_NEW tạm dừng transaction hiện tại, mở transaction mới trên connection mới.",
         [IN("#rn-hud", "left", 0.1), IN("#rn-o", "pop", 1.6), IN("#rn-sus", "left", 3.0), DRAW("#rn-a-p", 4.8, 0.5), IN("#rn-i", "pop", 5.4)]),
        ("Ví dụ ghi audit: outer gọi audit ở một bean khác, rồi ném exception. Màn hình in ra hai Session khác số, tức hai physical transaction.",
         "Audit log: outer gọi audit ở bean khác, rồi ném exception. Hai SessionImpl khác số: hai physical transaction.",
         [IN("#rn-con", "up", 0.2, 0.4), IN("#rn-con-1", "type1", 0.6, 0.3), IN("#rn-con-2", "type1", 3.0, 0.3), IN("#rn-con-3", "type1", 4.6, 0.3),
          IN("#rn-con-4", "type1", 5.8, 0.3)]),
        ("Kết quả: dòng nghiệp vụ bị rollback, nhưng dòng audit vẫn còn một, vì nó đã commit riêng.",
         "Dòng nghiệp vụ rollback, audit vẫn còn 1 dòng vì đã commit riêng.",
         [IN("#rn-r1", "left", 0.4), IN("#rn-r2", "right", 2.8)]),
        ("Ngược lại, inner Requires New lỗi và outer nuốt exception: dòng của outer vẫn commit, không còn Unexpected Rollback Exception.",
         "Inner REQUIRES_NEW lỗi, outer nuốt: outer vẫn commit, không còn UnexpectedRollbackException.",
         [IN("#rn-c1", "left", 0.4)]),
        ("Cái giá: phải đặt ở bean khác, inner không thấy dữ liệu chưa commit của outer, và tốn thêm một connection.",
         "Cái giá: bean khác, không thấy dữ liệu chưa commit của outer, tốn thêm 1 connection.",
         [IN("#rn-c2", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ NESTED
    dict(id="nested", world=(1920, 1080), hud=hud("ne", "NESTED và savepoint", "Rollback một phần, cùng một connection"), cam="".join([
        gnode("ne-bar", 160, 190, 1600, 90, "1 physical transaction · 1 connection", "violet"),
        box("ne-o", 160, 330, 560, 90, "<b>insert 'outer'</b>", "amber", "card"),
        el("ne-sp", 790, 345, 300, None, "SAVEPOINT", "stamp violet r"),
        box("ne-i", 1160, 330, 600, 90, "<b>insert 'inner' · lỗi</b>", "red", "card"),
        el("ne-back", 160, 495, 1600, None, "Inner lỗi: rollback về savepoint, phần outer vẫn giữ", "note left r"),
        box("ne-r1", 160, 575, 760, 110, "<b>Inner lỗi, outer commit</b><small>còn [outer]</small>", "green", "card"),
        box("ne-r2", 1000, 575, 760, 110, "<b>Inner xong, outer lỗi</b><small>còn [] (mất cả phần inner)</small>", "red", "card"),
        el("ne-lbl", 160, 705, 1600, None, "Đo với DataSourceTransactionManager + JdbcTemplate", "lbl r", "text-align:left"),
        console("ne-con", 160, 190, 1600, ["NestedTransactionNotSupportedException:", "JpaDialect does not support savepoints"]),
        chip("ne-w1", 160, 380, "outer catch (RuntimeException e) nuốt luôn: inner chưa bao giờ chạy", "red"),
        chip("ne-w2", 160, 460, "Hibernate không quay lại được persistence context khi về savepoint", "amber"),
        box("ne-c1", 160, 580, 760, 110, "<b>Outer rollback · REQUIRES_NEW</b><small>đã commit riêng: vẫn còn</small>", "green", "card"),
        box("ne-c2", 1000, 580, 760, 110, "<b>Outer rollback · NESTED</b><small>savepoint trong outer: mất theo</small>", "red", "card"),
        wires(trace("ne-a", [(720, 375), (782, 375)], "violet"), trace("ne-b", [(1094, 375), (1152, 375)], "violet"),
              arrow("ne-ar", [(1460, 424), (1400, 478), (1000, 478), (940, 424)], "red")),
    ]), beats=[
        ("Phần năm: Nested. Nó không mở transaction mới, mà đặt một save point trong transaction hiện tại.",
         "Phần 5: NESTED không mở transaction mới, mà đặt savepoint trong transaction hiện tại.",
         [IN("#ne-hud", "left", 0.1), IN("#ne-bar", "pop", 1.4), IN("#ne-o", "left", 3.4), DRAW("#ne-a-p", 4.4, 0.3), IN("#ne-sp", "stamp", 4.8)]),
        ("Inner lỗi thì rollback về save point, phần outer vẫn giữ. Nhưng outer rollback thì mất tất cả.",
         "Inner lỗi: rollback về savepoint, outer vẫn giữ. Outer rollback: mất tất cả.",
         [DRAW("#ne-b-p", 0.2, 0.3), IN("#ne-i", "right", 0.5), SHAKE("#ne-i", 1.4), DRAW("#ne-ar-p", 2.0, 0.7), IN("#ne-ar-h", "pop", 2.65, 0.25), IN("#ne-back", "up", 3.2)]),
        ("Đo với JDBC Template: inner lỗi, outer commit, còn đúng dòng outer. Inner thành công, outer lỗi, bảng rỗng.",
         "Đo với JdbcTemplate: inner lỗi, outer commit → [outer]. Inner xong, outer lỗi → [].",
         [IN("#ne-lbl", "fade", 0.3), IN("#ne-r1", "pop", 1.4), IN("#ne-r2", "pop", 4.8)]),
        ("Bất ngờ với JPA: Jpa Transaction Manager mặc định ném Nested Transaction Not Supported Exception, ngay lúc tạo save point.",
         "Với JpaTransactionManager mặc định: NestedTransactionNotSupportedException ngay lúc tạo savepoint.",
         [OUT("#ne-bar, #ne-o, #ne-sp, #ne-i, #ne-back, #ne-r1, #ne-r2, #ne-lbl, #ne-a, #ne-b, #ne-ar", "fade", 0, 0.4),
          IN("#ne-con", "up", 0.6, 0.4), IN("#ne-con-1", "type1", 3.4, 0.3), IN("#ne-con-2", "type1", 4.4, 0.3)]),
        ("Bẫy khó thấy: outer bắt runtime exception, nên nuốt luôn lỗi này. Trông có vẻ đúng, nhưng inner chưa bao giờ chạy.",
         "Bẫy: outer catch RuntimeException nuốt luôn lỗi này. Trông có vẻ đúng, nhưng inner chưa bao giờ chạy.",
         [IN("#ne-w1", "left", 0.4), SHAKE("#ne-w1", 5.6)]),
        ("Lý do: Hibernate không quay lại được persistence context. Và khi outer rollback, Requires New vẫn còn, còn Nested mất theo.",
         "Hibernate không quay lại được persistence context. Outer rollback: REQUIRES_NEW còn, NESTED mất theo.",
         [IN("#ne-w2", "left", 0.4), IN("#ne-c1", "pop", 4.6), IN("#ne-c2", "pop", 6.6)]),
    ]),
    # ------------------------------------------------------------ connection pool
    dict(id="pool", world=(1920, 1080), hud=hud("po", "REQUIRES_NEW và connection pool", "Một request, hai connection"), cam="".join([
        box("po-m1", 160, 190, 760, 110, "<b>Trong outer</b><small>1 connection đang mượn</small>", "amber", "card"),
        box("po-m2", 1000, 190, 760, 110, "<b>Trong inner REQUIRES_NEW</b><small>2 connection đang mượn</small>", "red", "card"),
        el("po-lbl", 160, 340, 1600, None, "Pool 1 connection, connection-timeout = 500 ms:", "lbl r", "text-align:left"),
        console("po-con", 160, 390, 1600, ["HikariPool-2 - Connection is not available,", "request timed out after 504ms",
                                           "(total=1, active=1, idle=0, waiting=0)"]),
        chip("po-f1", 160, 340, "Chỉ dùng REQUIRES_NEW khi thật cần, và giữ nó thật ngắn", "green"),
        chip("po-f2", 160, 420, "Pool size tính theo số connection tối đa mỗi request", "amber"),
        chip("po-f3", 160, 500, "Audit: ghi sau khi transaction kết thúc, hoặc qua message queue", "violet"),
        gnode("po-q1", 160, 640, 760, 64, "Request 1 · giữ A · chờ thêm 1", "amber"),
        gnode("po-q2", 160, 724, 760, 64, "Request 2 · giữ B · chờ thêm 1", "amber"),
        gnode("po-q3", 160, 808, 760, 64, "Request 10 · giữ J · chờ thêm 1", "amber"),
        gnode("po-pool", 1300, 660, 460, 120, "Pool 10: rỗng", "red"),
        el("po-st", 1300, 810, 460, None, "treo 30 s · pool deadlock", "stamp red r"),
        wires(trace("po-a", [(920, 672), (1100, 672), (1100, 720), (1292, 720)], "amber", r=24),
              trace("po-b", [(920, 756), (1100, 756), (1100, 720)], "amber", r=24),
              trace("po-c", [(920, 840), (1100, 840), (1100, 720)], "amber", r=24)),
    ]), beats=[
        ("Phần sáu: connection pool. Transaction ngoài chỉ tạm dừng, connection vẫn bị giữ. Đo được: trong outer có một connection đang mượn, vào inner là hai.",
         "Phần 6: transaction ngoài bị tạm dừng nhưng vẫn giữ connection. Outer: 1 connection, inner REQUIRES_NEW: 2.",
         [IN("#po-hud", "left", 0.1), IN("#po-m1", "pop", 6.2), IN("#po-m2", "pop", 8.8)]),
        ("Chạy lại với pool chỉ một connection, timeout năm trăm mili giây. Inner chờ connection mà chính outer đang giữ, nên hết giờ thì lỗi.",
         "Pool 1 connection, timeout 500 ms: inner chờ connection mà chính outer đang giữ.",
         [IN("#po-lbl", "fade", 0.3), IN("#po-con", "up", 1.2, 0.4), IN("#po-con-1", "type1", 1.6, 0.3), IN("#po-con-2", "type1", 3.4, 0.3),
          IN("#po-con-3", "type1", 5.4, 0.3)]),
        ("Ở production, pool mười connection, mười request cùng vào. Mỗi request giữ một, rồi cùng chờ cái thứ hai. Tất cả treo ba mươi giây, rồi lỗi hàng loạt.",
         "Pool 10, 10 request cùng vào: mỗi request giữ 1, cùng chờ cái thứ hai. Treo 30 s rồi lỗi hàng loạt.",
         [IN("#po-q1, #po-q2, #po-q3", "left", 0.4, 0.5, 0.15), IN("#po-pool", "pop", 3.0), DRAW("#po-a-p", 4.2, 0.5), DRAW("#po-b-p", 4.4, 0.5),
          DRAW("#po-c-p", 4.6, 0.5), PULSE("#po-pool", 5.6), IN("#po-st", "stamp", 7.6)]),
        ("Đó là pool deadlock. Ở máy local hiếm khi lộ ra, vì chỉ có một request mỗi lúc, pool luôn còn connection thứ hai.",
         "Pool deadlock. Ở local hiếm khi lộ: một request mỗi lúc, pool luôn còn connection thứ hai.",
         [SHAKE("#po-st", 0.4)]),
        ("Cách tránh: chỉ dùng Requires New khi thật cần, giữ thật ngắn. Tính pool size theo số connection mỗi request. Hoặc ghi audit sau khi transaction kết thúc.",
         "Chỉ dùng REQUIRES_NEW khi thật cần, giữ ngắn; pool size theo số connection mỗi request; ghi audit sau commit.",
         [OUT("#po-lbl, #po-con", "fade", 0, 0.4), IN("#po-f1", "left", 0.6), IN("#po-f2", "left", 4.4), IN("#po-f3", "left", 7.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("share", "REQUIRED", "lỗi trong là rollback-only cả chuyến"),
                                                ("split", "REQUIRES_NEW", "độc lập, nhưng tốn 2 connection"),
                                                ("box", "NESTED", "savepoint, JPA không hỗ trợ"),
                                                ("shield", "Proxy", "chỉ có tác dụng khi gọi bean khác")]),
        chip("ou-next", 730, 650, "Bài tiếp: Isolation & readOnly", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: Required dùng chung chuyến, lỗi bên trong làm cả chuyến rollback. Requires New độc lập nhưng tốn hai connection. Nested dùng save point, JPA không hỗ trợ. Và chỉ có tác dụng khi gọi qua proxy.",
         "REQUIRED: lỗi trong làm cả chuyến rollback · REQUIRES_NEW: tốn 2 connection · NESTED: JPA không hỗ trợ · chỉ qua proxy.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.0), IN("#ou-c2", "pop", 8.6), IN("#ou-c3", "pop", 12.0)]),
        ("Bài tiếp: mức cô lập của transaction, và Read Only.", "Bài tiếp: Isolation & readOnly.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
