"""TransactionTemplate & Transaction Events explainer: scene layouts and per-beat narration + motion.

Source: study note 05.05 and web lesson tx-template (Spring Boot 3.5.16, Spring 6.2, Hibernate 6.6, H2 2.3, JDK 21).
On-screen outputs were re-run with @SpringBootTest on Boot 3.5.16 + H2 2.3.232, JDK 21, before writing this file:
- TransactionTemplate: inside the lambda active=true newTx=true; execute() returns the id and the row exists;
  status.setRollbackOnly() -> row not saved; RuntimeException in the lambda -> row not saved, exception propagates.
- batch b-1, b-2, b-1, b-3 with one template call per item (saveAndFlush): ok=3 failed=1, the second b-1 fails with
  DataIntegrityViolationException, b-3 after it is saved.
- listeners: commit -> EventListener, BEFORE_COMMIT, then AFTER_COMMIT and AFTER_COMPLETION (their relative order follows
  listener registration order, so the screen does not rank them); rollback -> EventListener, AFTER_ROLLBACK, AFTER_COMPLETION;
  publish outside a transaction -> only EventListener.
- AFTER_COMMIT listener writing audit: auditRepo.save() (REQUIRED) -> 0 rows; REQUIRES_NEW method on another bean -> 1 row;
  inside the listener isActualTransactionActive() = true, transaction name still demo.OrderService.<method>.
- @SpringBootTest @Transactional test: isActive=true flaggedForRollback=true exists=true, 0 rows after; @Commit leaves 1 row;
  two saves violating unique -> test PASSES; em.flush() -> org.hibernate.exception.ConstraintViolationException;
  orders.place() inside the test tx -> only EventListener; after TestTransaction.flagForCommit() + end() ->
  BEFORE_COMMIT, AFTER_COMMIT, AFTER_COMPLETION are added.
Outbox, MockMvc vs RANDOM_PORT, @Async and fallbackExecution are described from the note, not run.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def phase(id_, x, name, sub, tone):
    """One phase card of @TransactionalEventListener; mono title so the long constant names fit the card."""
    return box(id_, x, 340, 386, 130,
               f'<b style="font:700 27px var(--mono)">{esc(name)}</b><small>{esc(sub)}</small>', tone, "card")


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Ghi audit sau commit, bảng vẫn trống?"), "h1 center r"),
        console("hk-con", 300, 420, 1320, ["@TransactionalEventListener          // AFTER_COMMIT",
                                           "void saveAudit(...) { auditRepo.save(log); }   // REQUIRED",
                                           "audit rows = 0 · không lỗi · không cảnh báo"]),
        tile("hk-tile", 200, 350, 220, "split"),
        el("hk-word", 470, 380, 1400, None, letters("TransactionTemplate"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Transaction Events · AFTER_COMMIT · outbox · test có transaction", "kin-sub r"),
    ]), beats=[
        ("Đặt hàng xong, một listener chạy sau commit gọi save để ghi audit. Không lỗi, không cảnh báo. Vậy mà bảng audit vẫn trống. Vì sao?",
         "Listener chạy sau commit gọi save() để ghi audit. Không lỗi, không cảnh báo, mà bảng audit vẫn trống. Vì sao?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đã đo thật: không có dòng audit nào được lưu. Dữ liệu mất im lặng.",
         "Đo thật: 0 dòng audit. Dữ liệu mất im lặng.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 1.4, 0.3), IN("#hk-con-3", "type1", 2.4, 0.3)]),
        ("Hôm nay ta học Transaction Template và transaction event.", "Hôm nay: TransactionTemplate & Transaction Events.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ TransactionTemplate
    dict(id="template", world=(1920, 1080), hud=hud("tp", "TransactionTemplate", "Transaction bằng code, không cần proxy"), cam="".join([
        big_title("tp", "TransactionTemplate", "Transaction bằng code, không cần proxy"),
        box("tp-d", 160, 190, 760, 140, "<b>@Transactional</b><small style=\"font-size:26px\">khai báo · ranh giới là cả method · cần proxy</small>", "violet", "card"),
        box("tp-p", 1000, 190, 760, 140, "<b>TransactionTemplate</b><small style=\"font-size:26px\">lập trình · ranh giới là một khối lambda · không proxy</small>", "cyan", "card"),
        box("tp-code", 160, 360, 1600, 290, code(
            'TransactionTemplate tt = new TransactionTemplate(transactionManager);\n'
            'Long id = tt.execute(status -> repo.save(new Item("tt-1")).id);   // commit\n'
            'tt.executeWithoutResult(status -> {\n'
            '    repo.save(new Item("tt-2"));\n'
            '    status.setRollbackOnly();                                      // rollback bằng tay\n'
            '});'), "cyan", "code"),
        chip("tp-m1", 160, 690, "Trong lambda: active=true newTx=true · cùng transaction manager, cùng ThreadLocal", "cyan"),
        chip("tp-m2", 160, 770, "setRollbackOnly(): không lưu · ném RuntimeException: không lưu, exception bay ra", "red"),
        gnode("tp-b1", 160, 200, 340, 100, "b-1 · commit", "green"),
        gnode("tp-b2", 580, 200, 340, 100, "b-2 · commit", "green"),
        gnode("tp-b3", 1000, 200, 340, 100, "b-1 · rollback", "red"),
        gnode("tp-b4", 1420, 200, 340, 100, "b-3 · commit", "green"),
        console("tp-bc", 160, 350, 1600, ["ok=3 failed=1",
                                          "b-1 lần hai: DataIntegrityViolationException (trùng unique)",
                                          "b-3 sau dòng lỗi vẫn được lưu"]),
        el("tp-bw", 160, 590, 1600, None, "Bọc cả vòng lặp trong một @Transactional: một dòng lỗi làm mất cả lô", "warnbox r"),
        chip("tp-u1", 160, 700, "tx 1 lưu đơn · gọi cổng thanh toán ngoài transaction · tx 2 markPaid", "amber"),
        chip("tp-u2", 160, 780, "Sửa self-invocation: không cần tách bean, vì template không dựa vào proxy", "violet"),
        chip("tp-u3", 160, 860, "Gọi trong @Transactional khác: tham gia (REQUIRED) · muốn riêng: REQUIRES_NEW", "cyan"),
    ]), beats=[
        ("Phần một: Transaction Template. Annotation Transactional là khai báo: ranh giới là cả method, và cần proxy. "
         "Còn Transaction Template là lập trình: truyền một lambda, template mở transaction, chạy, rồi commit hoặc rollback.",
         "Phần 1: @Transactional là khai báo, ranh giới cả method, cần proxy. TransactionTemplate là lập trình: truyền lambda, mở tx, chạy, commit hoặc rollback.",
         [TYPE("#tp-big", 0.1, 0.06), IN("#tp-bsub", "blur", 0.8), OUT("#tp-big, #tp-bsub", "zoom", 4.0), IN("#tp-hud", "left", 4.6),
          IN("#tp-d", "pop", 5.0), IN("#tp-p", "pop", 9.0)]),
        ("Bên trong vẫn là cùng transaction manager, cùng Thread Local. Đã đo: trong lambda có một transaction mới đang chạy.",
         "Cùng transaction manager, cùng ThreadLocal. Đo được trong lambda: active=true newTx=true.",
         [IN("#tp-code", "up", 0.4), IN("#tp-m1", "left", 4.6)]),
        ("Gọi set rollback only thì không lưu. Ném runtime exception trong lambda thì cũng không lưu, và exception bay ra ngoài.",
         "status.setRollbackOnly(): không lưu. Ném RuntimeException: không lưu, exception bay ra ngoài.",
         [IN("#tp-m2", "left", 0.4)]),
        ("Ứng dụng đầu tiên: xử lý lô, mỗi phần tử một transaction riêng. Lô có bốn dòng, và dòng thứ ba trùng với dòng đầu.",
         "Use case 1: batch, mỗi phần tử một transaction. Dòng thứ ba trùng unique với dòng đầu.",
         [OUT("#tp-d, #tp-p, #tp-code, #tp-m1, #tp-m2", "fade", 0, 0.4), IN("#tp-b1", "pop", 3.6), IN("#tp-b2", "pop", 4.4),
          IN("#tp-b3", "pop", 5.4), SHAKE("#tp-b3", 6.0), IN("#tp-b4", "pop", 6.8)]),
        ("Đã đo: ba dòng thành công, một dòng lỗi vì trùng dữ liệu, và dòng sau dòng lỗi vẫn được lưu. Nếu bọc cả vòng lặp trong một Transactional, một dòng lỗi làm mất cả lô.",
         "Đo được: ok=3 failed=1, b-3 sau dòng lỗi vẫn lưu. Bọc cả vòng lặp trong một @Transactional thì mất cả lô.",
         [IN("#tp-bc", "up", 0.2, 0.4), IN("#tp-bc-1", "type1", 0.6, 0.3), IN("#tp-bc-2", "type1", 2.6, 0.3), IN("#tp-bc-3", "type1", 4.4, 0.3),
          IN("#tp-bw", "up", 7.2)]),
        ("Ứng dụng thứ hai: chia hai transaction ngắn, gọi cổng thanh toán ở giữa, bên ngoài transaction. Nó cũng sửa lỗi tự gọi method mà không cần tách bean.",
         "Use case 2: hai tx ngắn, gọi cổng thanh toán ở giữa, ngoài tx. Sửa self-invocation không cần tách bean.",
         [IN("#tp-u1", "left", 0.4), IN("#tp-u2", "left", 6.4)]),
        ("Lưu ý: gọi bên trong một method Transactional khác thì template mặc định tham gia transaction ngoài. Muốn riêng thì dùng requires new.",
         "Trong @Transactional khác: mặc định tham gia (REQUIRED); muốn riêng thì REQUIRES_NEW.",
         [IN("#tp-u3", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ @TransactionalEventListener
    dict(id="events", world=(1920, 1080), hud=hud("ev", "@TransactionalEventListener", "Việc phụ chỉ chạy sau commit"), cam="".join([
        gnode("ev-s", 160, 190, 560, 100, "place(): save + publishEvent", "amber"),
        gnode("ev-h", 800, 190, 440, 100, "event được giữ lại", "violet"),
        gnode("ev-c", 1320, 190, 440, 100, "commit thành công", "green"),
        phase("ev-p1", 160, "BEFORE_COMMIT", "trước commit, trong tx", "violet"),
        phase("ev-p2", 564, "AFTER_COMMIT", "mặc định · email, notify", "green"),
        phase("ev-p3", 968, "AFTER_ROLLBACK", "rollback · log, cảnh báo", "red"),
        phase("ev-p4", 1372, "AFTER_COMPLETION", "sau cả hai · dọn dẹp", "cyan"),
        console("ev-con", 160, 510, 1600, ["commit:   EventListener → BEFORE_COMMIT → AFTER_COMMIT, AFTER_COMPLETION",
                                           "rollback: EventListener → AFTER_ROLLBACK, AFTER_COMPLETION",
                                           "ngoài tx: chỉ EventListener (trừ khi fallbackExecution = true)"]),
        chip("ev-w1", 160, 740, "@EventListener thường chạy ngay lúc publish, kể cả khi sau đó rollback", "red"),
        chip("ev-w2", 160, 815, "AFTER_COMMIT chạy đồng bộ, cùng thread: email chậm 3 s thì response chậm 3 s · thêm @Async", "amber"),
        wires(trace("ev-a", [(720, 240), (792, 240)], "amber"), trace("ev-b", [(1240, 240), (1312, 240)], "violet")),
    ]), beats=[
        ("Phần hai: transaction event. Gửi email ngay trong method transactional thì có thể gửi cho một đơn hàng sau đó bị rollback.",
         "Phần 2: gửi email ngay trong @Transactional có thể gửi cho đơn hàng sau đó bị rollback.",
         [IN("#ev-hud", "left", 0.1), IN("#ev-s", "pop", 2.4)]),
        ("Với Transactional Event Listener, event được giữ lại, và listener chỉ chạy ở pha bạn chọn. Mặc định là after commit.",
         "@TransactionalEventListener: event được giữ lại, listener chỉ chạy ở pha bạn chọn. Mặc định AFTER_COMMIT.",
         [DRAW("#ev-a-p", 0.6, 0.4), IN("#ev-h", "pop", 1.0), DRAW("#ev-b-p", 4.4, 0.4), IN("#ev-c", "pop", 4.8)]),
        ("Có bốn pha: before commit, after commit, after rollback, và after completion, chạy dù commit hay rollback.",
         "4 pha: BEFORE_COMMIT, AFTER_COMMIT (mặc định), AFTER_ROLLBACK, AFTER_COMPLETION (commit hoặc rollback).",
         [IN("#ev-p1", "up", 1.2), IN("#ev-p2", "up", 2.4), IN("#ev-p3", "up", 3.6), IN("#ev-p4", "up", 5.0)]),
        ("Đã đo: commit thành công thì after commit chạy. Rollback thì chỉ có after rollback và after completion. Publish ngoài transaction thì listener này bị bỏ qua im lặng.",
         "Đo được: commit thì có AFTER_COMMIT; rollback thì chỉ AFTER_ROLLBACK, AFTER_COMPLETION; ngoài tx thì bị bỏ qua im lặng.",
         [IN("#ev-con", "up", 0.2, 0.4), IN("#ev-con-1", "type1", 0.6, 0.3), IN("#ev-con-2", "type1", 3.6, 0.3), IN("#ev-con-3", "type1", 7.4, 0.3)]),
        ("Còn Event Listener thường chạy ngay lúc publish, kể cả khi sau đó rollback. Và after commit chạy đồng bộ trên cùng thread, nên việc chậm thì thêm Async.",
         "@EventListener thường chạy ngay lúc publish, kể cả khi rollback. AFTER_COMMIT chạy đồng bộ, cùng thread: việc chậm thì thêm @Async.",
         [IN("#ev-w1", "left", 0.4), IN("#ev-w2", "left", 5.6)]),
    ]),
    # ------------------------------------------------------------ write inside AFTER_COMMIT
    dict(id="aftercommit", world=(1920, 1080), hud=hud("ac", "Bẫy ghi DB trong AFTER_COMMIT", "Dữ liệu mất im lặng"), cam="".join([
        box("ac-code", 160, 190, 900, 210, code(
            '@TransactionalEventListener            // AFTER_COMMIT\n'
            'void saveAudit(SaveAuditAfterCommit e) {\n'
            '    auditRepo.save(new AuditLog(e.msg())); // REQUIRED\n'
            '}'), "cyan", "code"),
        box("ac-r1", 1120, 190, 640, 96, "<b style=\"font:700 28px var(--mono)\">auditRepo.save()</b><b style=\"font-size:32px\">0 dòng</b>", "red", "row"),
        box("ac-r2", 1120, 304, 640, 96, "<b style=\"font:700 28px var(--mono)\">REQUIRES_NEW, bean khác</b><b style=\"font-size:32px\">1 dòng</b>", "green", "row"),
        gnode("ac-t1", 160, 450, 360, 100, "đã commit", "green"),
        gnode("ac-t2", 600, 450, 520, 100, "resource chưa unbind", "amber"),
        gnode("ac-t3", 1200, 450, 560, 100, "save() tham gia vào đó", "red"),
        console("ac-con", 160, 590, 1600, ["isActualTransactionActive()  = true",
                                           "getCurrentTransactionName()  = demo.OrderService.place"]),
        chip("ac-c1", 160, 780, "@Async: thread khác, ThreadLocal trống, save() tự mở transaction", "green"),
        chip("ac-c2", 160, 860, "App sập ngay sau commit: event trong bộ nhớ mất", "red"),
        wires(trace("ac-a", [(520, 500), (592, 500)], "green"), trace("ac-b", [(1120, 500), (1192, 500)], "amber")),
    ]), beats=[
        ("Phần ba: bẫy ghi database trong after commit. Nhiều người ghi audit bằng repo save thường, ngay trong listener after commit.",
         "Phần 3: ghi audit bằng auditRepo.save() (REQUIRED) bên trong listener AFTER_COMMIT.",
         [IN("#ac-hud", "left", 0.1), IN("#ac-code", "up", 3.6)]),
        ("Đã đo: không có dòng nào. Chuyển sang gọi một method requires new ở bean khác thì được một dòng.",
         "Đo được: save() REQUIRED ra 0 dòng. Gọi method REQUIRES_NEW ở bean khác ra 1 dòng.",
         [IN("#ac-r1", "pop", 0.4), SHAKE("#ac-r1", 1.2), IN("#ac-r2", "pop", 4.4)]),
        ("Vì sao? Transaction đã commit, nhưng resource chưa được gỡ khỏi Thread Local. Bên trong listener vẫn thấy có transaction, tên vẫn là order service chấm place.",
         "Transaction đã commit nhưng resource chưa unbind khỏi ThreadLocal: trong listener vẫn active=true, tên demo.OrderService.place.",
         [IN("#ac-t1", "pop", 1.0), DRAW("#ac-a-p", 2.6, 0.4), IN("#ac-t2", "pop", 3.0),
          IN("#ac-con", "up", 5.6, 0.4), IN("#ac-con-1", "type1", 6.0, 0.3), IN("#ac-con-2", "type1", 8.0, 0.3)]),
        ("Nên save tham gia vào transaction đó, và không còn ai commit lần nữa. Không lỗi, không cảnh báo, dữ liệu mất im lặng. Muốn ghi thì dùng requires new.",
         "save() tham gia vào đó, không còn ai commit nữa: mất im lặng. Muốn ghi thì dùng REQUIRES_NEW.",
         [DRAW("#ac-b-p", 0.4, 0.4), IN("#ac-t3", "pop", 0.8), SHAKE("#ac-t3", 4.6), PULSE("#ac-r2", 8.4)]),
        ("Listener có Async thì chạy ở thread khác, nên save tự mở transaction. Còn app sập ngay sau commit thì event trong bộ nhớ sẽ mất.",
         "@Async: thread khác, save() tự mở tx. App sập ngay sau commit: event trong bộ nhớ mất.",
         [IN("#ac-c1", "left", 0.4), IN("#ac-c2", "left", 4.8)]),
    ]),
    # ------------------------------------------------------------ outbox
    dict(id="outbox", world=(1920, 1080), hud=hud("ob", "Outbox pattern", "Gửi message thành ghi một dòng DB"), cam="".join([
        box("ob-r1", 160, 190, 760, 140, "<b>Gửi Kafka trong transaction</b><small style=\"font-size:26px\">Kafka nhận rồi DB rollback: đơn không tồn tại</small>", "red", "card"),
        box("ob-r2", 1000, 190, 760, 140, "<b>Gửi Kafka sau commit</b><small style=\"font-size:26px\">app sập giữa chừng: message mất</small>", "red", "card"),
        gnode("ob-a", 160, 360, 520, 90, "INSERT orders", "green"),
        gnode("ob-b", 160, 470, 520, 90, "INSERT outbox · PENDING", "green"),
        gnode("ob-c", 780, 415, 300, 90, "COMMIT", "green"),
        gnode("ob-d", 1180, 415, 260, 90, "Relay", "violet"),
        gnode("ob-e", 1540, 415, 220, 90, "Kafka", "cyan"),
        el("ob-n", 160, 585, 940, None, "Một transaction: cùng có hoặc cùng không", "note green left r"),
        chip("ob-sent", 1180, 530, "gửi xong, đánh dấu SENT", "violet"),
        chip("ob-c1", 160, 680, "Relay sập thì đọc tiếp, không mất · đổi lại có thể gửi hơn một lần (at-least-once)", "amber"),
        chip("ob-c2", 160, 760, "Bên nhận phải idempotent: bỏ qua message trùng theo event id", "green"),
        chip("ob-c3", 160, 840, "Mất vài email được: AFTER_COMMIT + @Async · không được mất (thanh toán, tồn kho): outbox", "violet"),
        wires(trace("ob-x", [(680, 405), (730, 405), (730, 460), (772, 460)], "green", r=20),
              trace("ob-y", [(680, 515), (730, 515), (730, 460)], "green", r=20),
              trace("ob-z", [(1080, 460), (1172, 460)], "violet"), trace("ob-w", [(1440, 460), (1532, 460)], "cyan")),
    ]), beats=[
        ("Phần bốn: outbox pattern. Bài toán ghi kép: lưu database và gửi Kafka, hai hệ thống không có transaction chung. "
         "Gửi trong transaction thì Kafka nhận rồi database rollback. Gửi sau commit thì app sập là mất.",
         "Phần 4: dual write, không có transaction chung. Gửi Kafka trong tx: Kafka nhận rồi DB rollback. Gửi sau commit: app sập là mất.",
         [IN("#ob-hud", "left", 0.1), IN("#ob-r1", "pop", 7.4), IN("#ob-r2", "pop", 11.0)]),
        ("Outbox biến việc gửi message thành ghi một dòng vào bảng outbox, cùng transaction với nghiệp vụ. Cùng có, hoặc cùng không.",
         "Outbox: gửi message thành ghi một dòng vào bảng outbox, cùng tx với nghiệp vụ. Cùng có hoặc cùng không.",
         [IN("#ob-a", "pop", 0.6), IN("#ob-b", "pop", 3.0), DRAW("#ob-x-p", 5.0, 0.4), DRAW("#ob-y-p", 5.0, 0.4), IN("#ob-c", "pop", 5.4),
          IN("#ob-n", "up", 7.0)]),
        ("Một relay, là scheduler hoặc Debezium, đọc các dòng pending, gửi sang Kafka, và đánh dấu là đã gửi.",
         "Relay (scheduler hoặc Debezium) đọc dòng PENDING, gửi Kafka, và đánh dấu đã gửi (SENT).",
         [DRAW("#ob-z-p", 0.3, 0.4), IN("#ob-d", "pop", 0.7), DRAW("#ob-w-p", 3.6, 0.4), IN("#ob-e", "pop", 4.0), IN("#ob-sent", "up", 5.0)]),
        ("Relay sập thì khởi động lại đọc tiếp, không mất. Đổi lại, gửi xong mà chưa kịp đánh dấu thì sập, nên message có thể gửi hơn một lần. Bên nhận phải idempotent theo event id.",
         "Relay sập thì đọc tiếp, không mất. Đổi lại có thể gửi hơn một lần: bên nhận idempotent theo event id.",
         [IN("#ob-c1", "left", 0.4), IN("#ob-c2", "left", 8.6)]),
        ("Chọn thế nào? Mất vài email chấp nhận được thì dùng after commit với Async. Không được mất, như thanh toán hay tồn kho, thì dùng outbox.",
         "Mất vài email được: AFTER_COMMIT + @Async. Không được mất (thanh toán, tồn kho): outbox.",
         [IN("#ob-c3", "left", 1.4)]),
    ]),
    # ------------------------------------------------------------ testing transactional code
    dict(id="testtx", world=(1920, 1080), hud=hud("tt", "Test code có transaction", "Test xanh, production đỏ"), cam="".join([
        box("tt-code", 160, 190, 1000, 340, code(
            '@SpringBootTest\n'
            '@Transactional                 // rollback sau mỗi test\n'
            'class ItemTest {\n'
            '    @Test void dup() {\n'
            '        repo.save(new Item("tm-dup"));\n'
            '        repo.save(new Item("tm-dup"));   // trùng unique\n'
            '    }\n'
            '}'), "cyan", "code"),
        el("tt-st", 1240, 200, 520, None, "PASS giả", "stamp red r"),
        el("tt-why", 1240, 290, 520, None, "save() chưa chạy INSERT. INSERT chạy lúc flush, mà test rollback nên không bao giờ flush", "note left r"),
        console("tt-con", 160, 570, 1600, ["trong test: isActive=true  flaggedForRollback=true",
                                           "sau test: 0 dòng   ·   có @Commit: 1 dòng",
                                           "save trùng unique: PASS · gọi em.flush(): ConstraintViolationException"]),
        gnode("tt-t", 160, 190, 1600, 90, "Transaction của test · cuối test rollback", "violet"),
        gnode("tt-s", 160, 340, 760, 90, "orders.place() · REQUIRED tham gia", "amber"),
        console("tt-c2", 160, 480, 1600, ["ngay sau place(): chỉ EventListener",
                                          "flagForCommit() + end(): thêm BEFORE_COMMIT, AFTER_COMMIT, AFTER_COMPLETION"]),
        chip("tt-x1", 160, 670, "Bị che: AFTER_COMMIT · UnexpectedRollbackException · LazyInitializationException", "red"),
        chip("tt-x2", 160, 750, "MockMvc cùng thread: bị rollback · RANDOM_PORT qua HTTP thật: commit thật", "amber"),
        chip("tt-x3", 160, 830, "Test hành vi transaction: không để @Transactional trên test, tự dọn dữ liệu", "green"),
        wires(trace("tt-a", [(540, 280), (540, 332)], "violet")),
    ]), beats=[
        ("Phần năm: test code có transaction. Đặt Transactional trên class test, hoặc dùng Data JPA Test, thì mỗi test được rollback sau khi chạy.",
         "Phần 5: @Transactional trên class test (hoặc @DataJpaTest): rollback sau mỗi test.",
         [IN("#tt-hud", "left", 0.1), IN("#tt-code", "up", 3.4)]),
        ("Đã đo: trong test, transaction đang chạy và đã bị đánh dấu rollback. Sau test còn không dòng. Thêm annotation Commit thì còn một dòng.",
         "Đo được: isActive=true flaggedForRollback=true; sau test 0 dòng. Có @Commit thì còn 1 dòng.",
         [IN("#tt-con", "up", 0.2, 0.4), IN("#tt-con-1", "type1", 0.6, 0.3), IN("#tt-con-2", "type1", 5.4, 0.3)]),
        ("Bẫy một: lưu hai lần trùng unique mà test vẫn pass. Insert chỉ chạy khi flush, mà test rollback thì không bao giờ flush. Gọi flush mới thấy lỗi.",
         "Bẫy 1: save trùng unique vẫn PASS: INSERT chỉ chạy khi flush, test không bao giờ flush. Gọi em.flush() mới thấy lỗi.",
         [IN("#tt-st", "stamp", 1.6), IN("#tt-why", "right", 3.6), IN("#tt-con-3", "type1", 8.0, 0.3)]),
        ("Bẫy hai: service tham gia transaction của test, nên after commit không chạy. Phải flag for commit rồi end thì mới thấy.",
         "Bẫy 2: service tham gia tx của test, AFTER_COMMIT không chạy. Phải flagForCommit() + end() mới thấy.",
         [OUT("#tt-code, #tt-st, #tt-why, #tt-con", "fade", 0, 0.4), IN("#tt-t", "pop", 0.6), DRAW("#tt-a-p", 1.6, 0.4), IN("#tt-s", "pop", 2.0),
          IN("#tt-c2", "up", 4.0, 0.4), IN("#tt-c2-1", "type1", 4.4, 0.3), IN("#tt-c2-2", "type1", 6.4, 0.3)]),
        ("Tương tự, Unexpected Rollback Exception cũng bị che. MockMvc chạy cùng thread nên bị rollback, còn random port qua HTTP thật thì commit thật.",
         "UnexpectedRollbackException cũng bị che. MockMvc cùng thread: rollback. RANDOM_PORT qua HTTP thật: commit thật.",
         [IN("#tt-x1", "left", 0.4), IN("#tt-x2", "left", 4.2)]),
        ("Vì vậy, test hành vi transaction thì đừng để Transactional trên test, và tự dọn dữ liệu.",
         "Test hành vi transaction: không để @Transactional trên test, tự dọn dữ liệu.",
         [IN("#tt-x3", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 184, 290, 370, 280, 24, [("split", "Template", "ranh giới bằng code, không cần proxy"),
                                                ("share", "AFTER_COMMIT", "việc phụ sau commit · ghi DB thì REQUIRES_NEW"),
                                                ("box", "Outbox", "message không được mất"),
                                                ("shield", "Test", "nhớ flush, đừng để tx che lỗi")]),
        chip("ou-next", 533, 650, "Bài tiếp: Entity Lifecycle & Persistence Context", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: template cho ranh giới bằng code. After commit cho việc phụ, ghi database trong đó thì dùng requires new. Outbox khi message không được mất. Và khi test, nhớ flush.",
         "Template: ranh giới bằng code · AFTER_COMMIT: việc phụ, ghi DB thì REQUIRES_NEW · outbox: không mất message · test: nhớ flush.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.6), IN("#ou-c2", "pop", 8.2), IN("#ou-c3", "pop", 10.6)]),
        ("Bài tiếp: Entity Lifecycle và Persistence Context.", "Bài tiếp: Entity Lifecycle & Persistence Context.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
