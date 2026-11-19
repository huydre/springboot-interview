"""Lab 5: Transaction Bugs explainer: scene layouts and per-beat narration + motion.

Numbers come from study note 11.05 and the lesson lab-tx-bugs.ts, measured on the order-service solution
(labs/order-service/): Spring Boot 3.5.16 (Spring 6.2, Hibernate 6.6), JDK 21, PostgreSQL 16 via Testcontainers, JpaTransactionManager DEBUG logs.
Bug 1: txActive=false, Keyboard stock 10 -> 8, fix 10 and 0 orders. Bug 2: PaymentFailedException (checked): 1 order, stock 8, email "Order #1 confirmed";
rollbackFor -> 0 orders, stock 10, no email. Bug 3: audit ORDER_ATTEMPT 0 rows (same tx) vs 1 row (REQUIRES_NEW). Bug 4: UnexpectedRollbackException,
0 orders; addPoints REQUIRES_NEW -> 1 order, stock 8. Bug 5: rollback -> AFTER_COMMIT [], @EventListener [EAGER] Order #6 confirmed; AFTER_COMMIT txActive=true,
save() REQUIRED 0 rows (same EntityManager 1650792202), REQUIRES_NEW 1 row. Final Kotlin class: startup failure "Cannot subclass final class";
open class with a final method: null fields inside that method (audited tx-pitfalls facts). No JDK snippet with output is shown; no database was started for this video.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Log ghi Committing, vậy sao đơn hàng biến mất?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["Committing JPA transaction on EntityManager", "Số đơn trong database: 0", "UnexpectedRollbackException: Transaction silently rolled back"]),
        tile("hk-tile", 330, 350, 220, "split"),
        el("hk-word", 600, 380, 1300, None, letters("Lab 5: Transaction Bugs"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "đoán · chạy · so sánh · 5 lỗi transaction", "kin-sub r"),
    ]), beats=[
        ("Log ghi là đang commit, nhưng trong database lại không có đơn hàng nào. Bạn tin log, hay tin dữ liệu?",
         "Log ghi đang commit, nhưng database không có đơn nào. Tin log hay tin dữ liệu?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-con", "up", 3.6, 0.4), IN("#hk-con-1", "type1", 4.0, 0.3), IN("#hk-con-2", "type1", 5.4, 0.3), IN("#hk-con-3", "type1", 6.4, 0.3)]),
        ("Đáp án nằm trong bài thực hành số năm. Ta tái hiện năm lỗi transaction trên cơ sở dữ liệu thật, và đo từng con số.",
         "Bài thực hành 5: tái hiện 5 lỗi transaction trên cơ sở dữ liệu thật, đo từng con số.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ setup
    dict(id="setup", world=(1920, 1080), hud=hud("su", "Chuẩn bị", "Mỗi bài một vòng: đoán, chạy, so sánh"), cam="".join([
        gnode("su-n1", 160, 190, 420, 100, "1 · Đoán trước", "amber"), gnode("su-n2", 700, 190, 420, 100, "2 · Chạy test", "cyan"),
        gnode("su-n3", 1240, 190, 420, 100, "3 · So sánh số liệu", "green"),
        chip("su-c1", 160, 350, "PostgreSQL 16 qua Testcontainers, không dùng H2 · Spring Boot 3.5", "cyan"),
        chip("su-c2", 160, 430, "Lab5TestBase KHÔNG gắn @Transactional: mỗi test tự xoá và seed lại dữ liệu", "red"),
        chip("su-c3", 160, 510, "Có @Transactional ở test: không bao giờ commit, nên lỗi 4 và 5 không xảy ra", "amber"),
        chip("su-c4", 160, 590, "Log JpaTransactionManager mức DEBUG: tạo, tham gia, tạm dừng, commit, rollback", "violet"),
        console("su-con", 160, 690, 1600, ["validOrder()                 2 Keyboard · total 200.00", "orderFailingOnSecondLine()   2 Keyboard, rồi 5 Monitor khi kho còn 1"]),
        el("su-take", 160, 850, 1600, None, "Đừng tin chữ Committing trong log: assert trên database", "note left r"),
        wires(trace("su-a", [(580, 240), (692, 240)], "cyan"), trace("su-b", [(1120, 240), (1232, 240)], "green")),
    ]), beats=[
        ("Phần một: chuẩn bị. Mỗi bài trong lab theo một vòng. Đoán trước kết quả, chạy test, rồi so với số liệu thật.",
         "Phần 1: mỗi bài một vòng: đoán trước, chạy test, so với số liệu thật.",
         [IN("#su-hud", "left", 0.1), IN("#su-n1", "pop", 2.4), DRAW("#su-a-p", 4.0, 0.4), IN("#su-n2", "pop", 4.4), DRAW("#su-b-p", 5.6, 0.4), IN("#su-n3", "pop", 6.0)]),
        ("Test chạy trên PostgreSQL thật qua Testcontainers. Lớp test gốc cố ý không gắn Transactional. Nếu gắn, service tham gia transaction của test và không bao giờ commit, nên lỗi bốn và lỗi năm sẽ không xảy ra.",
         "Test gốc KHÔNG gắn @Transactional: nếu gắn, lỗi 4 và 5 biến mất.",
         [IN("#su-c1", "left", 0.4), IN("#su-c2", "left", 4.2), IN("#su-c3", "left", 8.0)]),
        ("Bật log debug của Jpa Transaction Manager để thấy transaction được tạo, tạm dừng, commit, rollback. Hai request dùng lại: đơn hợp lệ hai Keyboard, và đơn mà dòng hai đòi năm Monitor khi kho chỉ còn một.",
         "Log DEBUG cho thấy vòng đời transaction. Hai request: đơn hợp lệ, và đơn dòng 2 hết kho.",
         [IN("#su-c4", "left", 0.4), IN("#su-con", "up", 5.6, 0.4), IN("#su-con-1", "type1", 6.0, 0.3), IN("#su-con-2", "type1", 8.0, 0.3)]),
        ("Nhớ một điều: chữ Committing trong log chưa chắc nghĩa là dữ liệu đã lưu. Luôn assert trên database.",
         "Chữ Committing trong log chưa chắc là dữ liệu đã lưu. Assert trên database.",
         [IN("#su-take", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ self-invocation + checked exception
    dict(id="selfchecked", world=(1920, 1080), hud=hud("sc", "Bài 1 và bài 2", "Self-invocation · checked exception"), cam="".join([
        chip("sc-l1", 160, 170, "Bài 1 · placeOrderBuggy gọi this.reserveStock(): đi vòng qua proxy", "amber"),
        console("sc-c1", 160, 245, 1600, ["Đơn dòng 2 hết kho → InsufficientStockException", "reserveStock txActive=false · mỗi lệnh repository tự commit", "Kho Keyboard 10 → 8 · log không có dòng nào nhắc tới reserveStock"]),
        chip("sc-f1", 160, 450, "Sửa: gọi qua OrderService.placeOrder → kho 10, 0 đơn", "green"),
        chip("sc-l2", 160, 540, "Bài 2 · PaymentFailedException là checked exception: mặc định vẫn commit", "amber"),
        console("sc-c2", 160, 615, 1600, ["checkoutBuggy → Card declined for order 1, amount 200.00", "Số đơn 1 · kho Keyboard 8", "EMAIL to=an@example.com subject=\"Order #1 confirmed\""]),
        chip("sc-f2", 160, 820, "Sửa: rollbackFor = PaymentFailedException.class → 0 đơn, kho 10, không email", "green"),
    ]), beats=[
        ("Phần hai. Bài một, self invocation. Method gọi this chấm reserve stock, nên đi vòng qua proxy và annotation bị bỏ qua. Không lỗi, không cảnh báo.",
         "Bài 1: this.reserveStock() bỏ qua proxy, không lỗi, không cảnh báo.",
         [IN("#sc-hud", "left", 0.1), IN("#sc-l1", "left", 2.0)]),
        ("Đã đo: transaction active là false, mỗi lệnh repository tự commit. Dòng hai hết kho ném lỗi, nhưng dòng một đã commit rồi, nên kho Keyboard từ mười còn tám.",
         "Đã đo: txActive=false, dòng 1 đã commit riêng: kho Keyboard từ 10 còn 8.",
         [IN("#sc-c1", "up", 0.3, 0.4), IN("#sc-c1-1", "type1", 0.8, 0.3), IN("#sc-c1-2", "type1", 2.6, 0.3), IN("#sc-c1-3", "type1", 6.0, 0.3)]),
        ("Cách sửa là gọi qua bean khác. Khi đó kho giữ nguyên mười, và không có đơn nào.",
         "Sửa: gọi qua bean khác. Kho giữ 10, 0 đơn.",
         [IN("#sc-f1", "left", 0.4)]),
        ("Bài hai, checked exception. Rule mặc định chỉ rollback với runtime exception và error. Payment Failed Exception là checked, nên transaction vẫn commit.",
         "Bài 2: mặc định chỉ rollback RuntimeException và Error. Checked exception vẫn commit.",
         [IN("#sc-l2", "left", 0.5)]),
        ("Kết quả: một đơn hàng, kho bị trừ còn tám, và khách bị từ chối thẻ vẫn nhận email đơn đã xác nhận. Vì listener sau commit chạy khi transaction đã commit.",
         "1 đơn, kho 8, và khách bị từ chối thẻ vẫn nhận email xác nhận.",
         [IN("#sc-c2", "up", 0.3, 0.4), IN("#sc-c2-1", "type1", 0.8, 0.3), IN("#sc-c2-2", "type1", 2.6, 0.3), IN("#sc-c2-3", "type1", 5.2, 0.3)]),
        ("Sửa bằng rollback for. Số đơn về không, kho về mười, và không có email nào.",
         "rollbackFor đưa về 0 đơn, kho 10, không email.",
         [IN("#sc-f2", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ audit + UnexpectedRollback
    dict(id="auditloyalty", world=(1920, 1080), hud=hud("al", "Bài 3 và bài 4", "Audit REQUIRES_NEW · UnexpectedRollbackException"), cam="".join([
        chip("al-l3", 160, 170, "Bài 3 · mọi lần thử đặt hàng phải có dòng audit ORDER_ATTEMPT", "amber"),
        console("al-c3", 160, 245, 1600, ["Ghi audit cùng transaction (REQUIRED): 0 dòng", "AuditService.record REQUIRES_NEW: 1 dòng · đơn 0 · kho 10", "Log: Suspending current transaction → Committing → Resuming suspended"]),
        chip("al-f3", 160, 450, "Cái giá: mỗi request giữ 2 connection, tải cao có thể cạn pool", "violet"),
        chip("al-l4", 160, 540, "Bài 4 · addPoints REQUIRED luôn ném, outer chỉ catch và log warning", "amber"),
        console("al-c4", 160, 615, 1600, ["UnexpectedRollbackException: Transaction silently rolled back", "because it has been marked as rollback-only", "Số đơn 0 · log vẫn ghi Committing JPA transaction", "Sửa: addPoints REQUIRES_NEW → 1 đơn, kho 8"]),
    ]), beats=[
        ("Bài ba, audit log. Mọi lần thử đặt hàng phải để lại một dòng audit, kể cả khi thất bại. Ghi audit cùng transaction thì rollback là mất: không dòng nào.",
         "Bài 3: audit ghi cùng transaction thì rollback là mất: 0 dòng.",
         [IN("#al-hud", "left", 0.1), IN("#al-l3", "left", 2.0), IN("#al-c3", "up", 5.0, 0.4), IN("#al-c3-1", "type1", 5.4, 0.3)]),
        ("Cho record chạy Requires New, ở bean riêng. Spring tạm dừng transaction ngoài, commit dòng audit trên connection khác, rồi mới tiếp tục. Đơn vẫn rollback, nhưng còn một dòng audit.",
         "REQUIRES_NEW: suspend transaction ngoài, audit commit trước, còn 1 dòng.",
         [IN("#al-c3-2", "type1", 0.3, 0.3), IN("#al-c3-3", "type1", 4.4, 0.3)]),
        ("Cái giá: mỗi request chiếm hai connection cùng lúc, tải cao có thể cạn pool.",
         "Cái giá: 2 connection mỗi request, có thể cạn pool.",
         [IN("#al-f3", "left", 0.4)]),
        ("Bài bốn. Add Points chạy Required và luôn ném lỗi, còn outer bắt lại rồi chỉ log. Inner và outer chung một transaction, nên lỗi đánh dấu nó là rollback only.",
         "Bài 4: inner và outer REQUIRED chung một transaction, lỗi đánh dấu rollback-only.",
         [IN("#al-l4", "left", 0.5)]),
        ("Bên ngoài xin commit, và caller nhận Unexpected Rollback Exception, không có đơn nào. Log vẫn ghi Committing, nên đừng tin log, hãy tin dữ liệu.",
         "Caller nhận UnexpectedRollbackException, 0 đơn, dù log ghi Committing.",
         [IN("#al-c4", "up", 0.3, 0.4), IN("#al-c4-1", "type1", 0.8, 0.3), IN("#al-c4-2", "type1", 1.4, 0.3), IN("#al-c4-3", "type1", 5.4, 0.3)]),
        ("Nếu tích điểm chỉ là việc phụ, cho nó Requires New: khi đó một đơn được lưu, kho còn tám.",
         "Việc phụ: REQUIRES_NEW → 1 đơn, kho 8.",
         [IN("#al-c4-4", "type1", 0.4, 0.3)]),
    ]),
    # ------------------------------------------------------------ email after commit
    dict(id="email", world=(1920, 1080), hud=hud("em", "Bài 5", "Email sau commit"), cam="".join([
        chip("em-h1", 160, 170, "@TransactionalEventListener · phase = AFTER_COMMIT", "green"),
        chip("em-h2", 1000, 170, "@EventListener thường · chạy ngay lúc publish", "red"),
        chip("em-r1", 160, 260, "Commit → [Order #7 confirmed]", "green"),
        chip("em-r2", 1000, 260, "Commit → [[EAGER] Order #7 confirmed]", "cyan"),
        chip("em-r3", 160, 350, "Rollback (timeout order 6) → []", "green"),
        chip("em-r4", 1000, 350, "Rollback (timeout order 6) → [[EAGER] Order #6 confirmed]", "red"),
        el("em-st", 1000, 440, 560, None, "email cho đơn không tồn tại", "stamp red r"),
        console("em-con", 160, 600, 1600, ["AFTER_COMMIT txActive=true txName=...OrderService.placeOrder", "save() REQUIRED tham gia EntityManager 1650792202 cũ → 0 dòng, không lỗi", "REQUIRES_NEW mở EntityManager 1611262123 mới → commit thật, 1 dòng"]),
        chip("em-c1", 160, 810, "Ghi DB trong AFTER_COMMIT: bắt buộc REQUIRES_NEW", "green"),
    ]), beats=[
        ("Bài năm, gửi email sau commit. Ta so sánh hai listener. After Commit chỉ chạy khi commit thành công. Event Listener thường chạy ngay lúc publish, bên trong transaction.",
         "Bài 5: AFTER_COMMIT chỉ chạy khi commit xong. @EventListener thường chạy ngay lúc publish.",
         [IN("#em-hud", "left", 0.1), IN("#em-h1", "pop", 4.2), IN("#em-h2", "pop", 8.6)]),
        ("Khi commit, cả hai đều gửi email. Nhưng khi rollback vì provider timeout, After Commit gửi danh sách rỗng.",
         "Commit: cả hai gửi. Rollback: AFTER_COMMIT gửi [].",
         [IN("#em-r1", "pop", 0.4), IN("#em-r2", "pop", 0.9), IN("#em-r3", "pop", 4.0)]),
        ("Còn Event Listener thường đã gửi mất email xác nhận cho đơn số sáu, một đơn không hề tồn tại.",
         "@EventListener thường đã gửi email xác nhận cho đơn #6 không tồn tại.",
         [IN("#em-r4", "pop", 0.4), IN("#em-st", "pop", 2.4), SHAKE("#em-st", 3.0)]),
        ("Bẫy cuối: ghi database trong listener After Commit. Transaction đã commit nhưng vẫn còn gắn vào luồng, nên save kiểu Required tham gia lại đúng Entity Manager cũ, và dòng ghi mất im lặng. Không lỗi, không cảnh báo, không dòng nào.",
         "Bẫy: save() REQUIRED trong AFTER_COMMIT tham gia EntityManager cũ, mất dòng ghi, không cảnh báo.",
         [IN("#em-con", "up", 0.3, 0.4), IN("#em-con-1", "type1", 0.8, 0.3), IN("#em-con-2", "type1", 5.4, 0.3)]),
        ("Dùng Requires New thì mở Entity Manager mới và commit thật: một dòng. Nên ghi database ở đây phải dùng Requires New.",
         "REQUIRES_NEW mở EntityManager mới, commit thật: 1 dòng.",
         [IN("#em-con-3", "type1", 0.4, 0.3), IN("#em-c1", "left", 3.8)]),
    ]),
    # ------------------------------------------------------------ checklist
    dict(id="checklist", world=(1920, 1080), hud=hud("ck", "Checklist hoàn thành", "5 lỗi, mỗi lỗi một con số"), cam="".join([
        console("ck-con", 160, 170, 1600, ["1 self-invocation · txActive=false · kho 10 → 8 → gọi qua bean khác", "2 checked exception · 1 đơn + email → rollbackFor", "3 audit · 0 dòng → REQUIRES_NEW 1 dòng", "4 rollback-only · UnexpectedRollbackException, 0 đơn → REQUIRES_NEW 1 đơn", "5 AFTER_COMMIT · rollback không gửi email · ghi DB cần REQUIRES_NEW"]),
        chip("ck-g1", 160, 490, "Tìm trong code thật: method @Transactional bị gọi qua this", "amber"),
        chip("ck-g2", 160, 570, "Tìm: checked exception ném trong transaction mà không có rollbackFor", "amber"),
        chip("ck-g3", 160, 650, "Tìm: listener gửi email bằng @EventListener thường", "amber"),
        chip("ck-k1", 160, 770, "Cùng họ proxy: class final của Kotlin lỗi lúc khởi động \"Cannot subclass final class\"", "violet"),
        chip("ck-k2", 160, 850, "Class open có method final: field null bên trong method đó", "violet"),
    ]), beats=[
        ("Phần năm: checklist. Ghi vào nhật ký bảng năm lỗi với số liệu của chính bạn, và cả chỗ bạn đoán sai.",
         "Phần 5: ghi bảng 5 lỗi với số liệu của bạn, và chỗ đoán sai.",
         [IN("#ck-hud", "left", 0.1), IN("#ck-con", "up", 1.8, 0.4), IN("#ck-con-1", "type1", 2.2, 0.3), IN("#ck-con-2", "type1", 3.2, 0.3), IN("#ck-con-3", "type1", 4.2, 0.3), IN("#ck-con-4", "type1", 5.2, 0.3), IN("#ck-con-5", "type1", 6.2, 0.3)]),
        ("Rồi tìm trong code thật: method Transactional bị gọi qua this, checked exception không có rollback for, và listener gửi email bằng Event Listener thường.",
         "Tìm trong code thật: gọi qua this, checked exception thiếu rollbackFor, @EventListener gửi email.",
         [IN("#ck-g1", "left", 0.4), IN("#ck-g2", "left", 3.4), IN("#ck-g3", "left", 7.4)]),
        ("Cùng họ với bẫy proxy còn hai điều nữa. Class final của Kotlin làm ứng dụng báo lỗi ngay lúc khởi động. Class open có method final thì field là null bên trong method đó.",
         "Cùng họ proxy: Kotlin class final lỗi lúc khởi động; method final trong class open: field null.",
         [IN("#ck-k1", "left", 4.0), IN("#ck-k2", "left", 8.2)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("plug", "Self-invocation", "gọi qua bean khác"),
                                                ("shield", "Checked exception", "thêm rollbackFor"),
                                                ("split", "REQUIRES_NEW", "audit và việc phụ"),
                                                ("box", "AFTER_COMMIT", "ghi DB cần REQUIRES_NEW")]),
        chip("ou-next", 600, 650, "Bài tiếp: Lab 6: N+1, Locking & Index", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: gọi qua this thì mất transaction, nên gọi qua bean khác. Checked exception cần rollback for. Audit và việc phụ dùng Requires New. Và ghi database trong After Commit cũng phải dùng Requires New.",
         "Qua bean khác · rollbackFor · REQUIRES_NEW cho audit và ghi DB sau commit.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.2), IN("#ou-c2", "pop", 6.6), IN("#ou-c3", "pop", 10.0)]),
        ("Bài tiếp: Lab sáu, N cộng một, locking và index.", "Bài tiếp: Lab 6: N+1, Locking & Index.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
