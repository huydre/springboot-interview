"""Isolation & readOnly explainer: scene layouts and per-beat narration + motion.

Measured with @SpringBootTest on Spring Boot 3.5.16, JDK 21; isolation on PostgreSQL 16.14 (Testcontainers), some on H2 2.3 and
MySQL 8.4.13 as marked (study note 05.04, web lesson isolation.ts):
defaults: PostgreSQL "read committed", MySQL InnoDB "REPEATABLE-READ", H2 getTransactionIsolation() = 2 (READ_COMMITTED);
dirty read on H2 (READ_UNCOMMITTED) reads 999 uncommitted, PostgreSQL reads 10; stock read twice, 10 -> 50 in between:
READ_COMMITTED first=10 second=50, REPEATABLE_READ first=10 second=10; count(*) 1 -> 2 vs 1 -> 1; findById twice at READ_COMMITTED
10 and 10, sameInstance=true, JDBC 50; lost update (stock 10, should be 8): READ_COMMITTED final stock=9, REPEATABLE_READ
CannotAcquireLockException "could not serialize access due to concurrent update", atomic UPDATE 8, @Version
ObjectOptimisticLockingFailureException, SELECT ... FOR UPDATE 8 with thread B waiting 306 ms (plain SELECT 9, 6 ms);
write skew: REPEATABLE_READ both commit "on call now=0", SERIALIZABLE "could not serialize access due to read/write dependencies
among transactions"; readOnly = true: flush mode MANUAL (AUTO), session/entity read-only true, Connection.isReadOnly() true,
changed field -> no UPDATE, stock stays 10 (normal tx: 555); H2 save() silently not saved, saveAndFlush/jdbcTemplate.update saved;
PostgreSQL "cannot execute INSERT in a read-only transaction" (SQL state 25006); checkout() payment call 2-5 s.
No standalone Java program is shown: every output on screen is quoted from those measurements.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def grid_row(id_, y, cells, cols, tone="cyan", h=60):
    """One table line: first cell in bold mono, the rest in the body font; cells may carry a colour via (text, css-colour)."""
    spans = []
    for i, c in enumerate(cells):
        text, color = c if isinstance(c, tuple) else (c, "")
        style = "font:700 28px var(--mono);color:#fff" if i == 0 else (f"color:{color}" if color else "")
        spans.append(f'<span style="{style}">{esc(text)}</span>')
    return el(id_, 160, y, 1600, h, "".join(spans), f"gbox {tone} r",
              f"display:grid;grid-template-columns:{cols};align-items:center;justify-items:start;padding:0 28px;font-size:28px")


def grid_head(id_, y, cells, cols):
    return el(id_, 160, y, 1600, None, "".join(f"<span>{esc(c)}</span>" for c in cells), "lbl r",
              f"display:grid;grid-template-columns:{cols};justify-items:start;padding:0 28px")


def swap_chip(id_, x, y, text, tone):
    """A chip that replaces another chip in the same spot (the first one is faded out first)."""
    return el(id_, x, y, None, None, esc(text), f"chip {tone} r", attrs=" data-layout-allow-overlap")


OK, NO = ("chặn", "var(--green)"), ("có thể", "var(--red)")
LV_COLS = "520px 330px 330px 330px"
RO_COLS = "560px 480px 480px"

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Hai người cùng mua, kho còn bao nhiêu?"), "h1 center r"),
        console("hk-con", 410, 420, 1100, ["stock = 10 · hai request cùng mua 1 sản phẩm", "A: findById → 10 · setStock(9)",
                                           "B: findById → 10 · setStock(9)", "PostgreSQL READ COMMITTED: final stock=9"]),
        tile("hk-tile", 300, 350, 220, "lock"),
        el("hk-word", 570, 380, 1400, None, letters("Isolation & readOnly"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "anomaly · MVCC · lost update · write skew · readOnly", "kin-sub r"),
    ]), beats=[
        ("Kho còn mười sản phẩm, hai người cùng mua một lúc. Kho còn bao nhiêu?",
         "Kho còn 10, hai người cùng mua một lúc. Kho còn bao nhiêu?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đo thật trên Postgres với level mặc định: còn chín. Mất hẳn một lần trừ.",
         "Đo thật trên PostgreSQL, level mặc định: còn 9. Mất hẳn một lần trừ.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 1.3, 0.3),
          IN("#hk-con-3", "type1", 2.0, 0.3), IN("#hk-con-4", "type1", 3.0, 0.3)]),
        ("Hôm nay ta học Isolation và Read Only.", "Hôm nay: Isolation & readOnly.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.5, 0.03), IN("#hk-sub", "blur", 1.0)]),
    ]),
    # ------------------------------------------------------------ anomalies and isolation levels
    dict(id="levels", world=(1920, 1080), hud=hud("lv", "Anomaly và isolation level", "Chặn bao nhiêu anomaly, đổi lại chậm bao nhiêu"), cam="".join([
        big_title("lv", "Isolation level", "Chạy song song thì cái gì có thể sai?"),
        grid_row("lv-a1", 190, ["Dirty read", "đọc dữ liệu chưa commit: thấy 999 rồi bên kia rollback"], "520px 1000px", h=66),
        grid_row("lv-a2", 272, ["Non-repeatable read", "đọc 1 dòng 2 lần ra 2 giá trị: 10 rồi 50"], "520px 1000px", h=66),
        grid_row("lv-a3", 354, ["Phantom read", "cùng query, số dòng thay đổi: count(*) 1 rồi 2"], "520px 1000px", h=66),
        grid_row("lv-a4", 436, ["Lost update", "hai bên ghi đè nhau: stock 10 còn 9 thay vì 8"], "520px 1000px", "red", h=66),
        grid_row("lv-a5", 518, ["Write skew", "mỗi bên ghi 1 dòng khác, gộp lại sai quy tắc"], "520px 1000px", "red", h=66),
        grid_head("lv-th", 190, ["Level", "Dirty read", "Non-repeatable", "Phantom"], LV_COLS),
        grid_row("lv-l1", 240, ["READ_UNCOMMITTED", NO, NO, NO], LV_COLS, "amber"),
        grid_row("lv-l2", 310, ["READ_COMMITTED", OK, NO, NO], LV_COLS, "cyan"),
        grid_row("lv-l3", 380, ["REPEATABLE_READ", OK, OK, ("PostgreSQL: chặn", "var(--green)")], LV_COLS, "violet"),
        grid_row("lv-l4", 450, ["SERIALIZABLE", OK, OK, OK], LV_COLS, "green"),
        box("lv-d0", 160, 550, 494, 130, "<b>PostgreSQL</b><small>read committed</small>", "cyan", "card"),
        box("lv-d1", 713, 550, 494, 130, "<b>MySQL InnoDB</b><small>REPEATABLE-READ</small>", "violet", "card"),
        box("lv-d2", 1266, 550, 494, 130, "<b>H2</b><small>2 = READ_COMMITTED</small>", "cyan", "card"),
        el("lv-def", 160, 705, 1600, None, "Isolation.DEFAULT = dùng default của DB: cùng code, đổi DB có thể khác kết quả", "note left r"),
        chip("lv-h2", 160, 780, "H2, READ_UNCOMMITTED: B đọc 999 chưa commit", "red"),
        chip("lv-pg", 160, 860, "PostgreSQL: B đọc 10, không có dirty read ở level nào", "green"),
    ]), beats=[
        ("Phần một: isolation level là mức bạn chọn, chặn bao nhiêu hiện tượng lạ khi chạy song song, đổi lại chậm hơn bao nhiêu.",
         "Phần 1: isolation level = chặn bao nhiêu anomaly khi chạy song song, đổi lại chậm hơn bao nhiêu.",
         [TYPE("#lv-big", 0.1, 0.06), IN("#lv-bsub", "blur", 1.0), OUT("#lv-big, #lv-bsub", "zoom", 5.8), IN("#lv-hud", "left", 6.4)]),
        ("Chuẩn SQL có ba anomaly: dirty read, đọc dữ liệu chưa commit. Non repeatable read, đọc một dòng hai lần ra hai giá trị. Phantom, cùng câu query mà số dòng thay đổi.",
         "Chuẩn SQL: dirty read, non-repeatable read, phantom read.",
         [IN("#lv-a1", "left", 1.9), IN("#lv-a2", "left", 4.3), IN("#lv-a3", "left", 8.1)]),
        ("Còn hai thứ hay gây lỗi thật là lost update và Write Skew.",
         "Hai thứ hay gây bug thật: lost update và write skew.",
         [IN("#lv-a4", "left", 0.3), IN("#lv-a5", "left", 1.1)]),
        ("Bốn level từ yếu tới mạnh. Riêng Repeatable Read của Postgres chặn luôn cả phantom.",
         "Bốn level từ yếu tới mạnh. REPEATABLE READ của PostgreSQL chặn cả phantom.",
         [OUT("#lv-a1, #lv-a2, #lv-a3, #lv-a4, #lv-a5", "fade", 1.4, 0.4), IN("#lv-th", "fade", 1.9),
          IN("#lv-l1, #lv-l2, #lv-l3, #lv-l4", "left", 2.1, 0.5, 0.2), PULSE("#lv-l3", 4.6)]),
        ("Default đã đo: Postgres là Read Committed, MySQL InnoDB là Repeatable Read. Spring mặc định dùng default của database, nên đổi database phải xem lại.",
         "Default đo được: PostgreSQL READ COMMITTED, MySQL InnoDB REPEATABLE READ. Isolation.DEFAULT dùng default của DB.",
         [IN("#lv-d0", "pop", 1.0), IN("#lv-d1", "pop", 3.0), IN("#lv-d2", "pop", 4.8), IN("#lv-def", "up", 5.8)]),
        ("Trên H hai, đo được cả dữ liệu chưa commit: đọc ra chín trăm chín mươi chín. Postgres thì không bao giờ đọc dữ liệu chưa commit, ở level nào cũng vậy.",
         "Dirty read đo được trên H2: đọc ra 999 chưa commit. PostgreSQL không có dirty read ở level nào.",
         [IN("#lv-h2", "left", 0.6), IN("#lv-pg", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ MVCC and repeated reads
    dict(id="mvcc", world=(1920, 1080), hud=hud("mv", "MVCC và đọc lặp lại", "Đọc theo snapshot, đọc không chặn ghi"), cam="".join([
        gnode("mv-v1", 160, 190, 620, 100, "stock = 10 · bản cũ", "cyan"),
        gnode("mv-v2", 1140, 190, 620, 100, "stock = 50 · bản mới", "green"),
        el("mv-tl", 800, 256, 320, None, "update, commit", "lbl r"),
        el("mv-note", 160, 325, 1600, None, "Snapshot = ảnh chụp bảng giá lúc bước vào cửa hàng · đọc không chặn ghi · ghi vẫn cần khoá", "note left r"),
        box("mv-rc", 160, 400, 760, 150, "<b>READ COMMITTED</b><small>chụp snapshot mỗi câu lệnh</small>", "amber", "card"),
        box("mv-rr", 1000, 400, 760, 150, "<b>REPEATABLE READ (PostgreSQL)</b><small>chụp một lần, ở câu lệnh đầu tiên</small>", "green", "card"),
        chip("mv-rc1", 160, 575, "first=10 second=50 · count(*) 1 → 2", "amber"),
        chip("mv-rr1", 1000, 575, "first=10 second=10 · count(*) 1 → 1", "green"),
        console("mv-con", 160, 670, 1000, ["findById lần 1: stock=10", "findById lần 2: stock=10 · sameInstance=true", "JDBC cùng lúc: stock=50"]),
        el("mv-fix", 1220, 680, 540, None, "Hibernate trả entity có sẵn trong persistence context, không chạy SQL", "note left r"),
        chip("mv-fx", 1220, 830, "refresh() hoặc JPQL", "violet"),
        wires(trace("mv-t", [(780, 240), (1132, 240)], "green")),
    ]), beats=[
        ("Phần hai: Multi Version Concurrency Control. Khi update, database không ghi đè dòng cũ mà tạo phiên bản mới.",
         "Phần 2: MVCC. Update không ghi đè dòng cũ mà tạo phiên bản mới.",
         [IN("#mv-hud", "left", 0.1), IN("#mv-v1", "pop", 3.4), DRAW("#mv-t-p", 5.0, 0.5), IN("#mv-tl", "fade", 5.2),
          IN("#mv-v2", "pop", 5.6), COMET("mv-t", 6.0, 0.6), LIGHT("#mv-v2", 6.6)]),
        ("Mỗi transaction đọc theo một snapshot, như ảnh chụp bảng giá lúc bước vào cửa hàng. Nên đọc không chặn ghi. Ghi thì vẫn cần khoá.",
         "Mỗi transaction đọc theo snapshot, như ảnh chụp bảng giá. Đọc không chặn ghi; ghi vẫn cần khoá.",
         [IN("#mv-note", "up", 0.6), PULSE("#mv-v1", 2.6)]),
        ("Khác biệt nằm ở lúc chụp. Read Committed chụp mỗi câu lệnh: đọc lại ra mười rồi năm mươi, đếm ra một rồi hai.",
         "READ COMMITTED chụp mỗi câu lệnh: đọc lại ra 10 rồi 50, đếm ra 1 rồi 2.",
         [IN("#mv-rc", "left", 1.8), IN("#mv-rc1", "left", 4.4)]),
        ("Repeatable Read của Postgres chụp một lần ở câu lệnh đầu tiên: vẫn mười và mười, một và một.",
         "REPEATABLE READ (PostgreSQL) chụp một lần ở câu lệnh đầu tiên: 10 và 10, 1 và 1.",
         [IN("#mv-rr", "right", 0.3), IN("#mv-rr1", "right", 3.8)]),
        ("Bẫy: find by id hai lần ở Read Committed vẫn ra mười và mười, vì Hibernate trả entity có sẵn trong persistence context, không chạy SQL. Muốn giá trị mới thì refresh.",
         "Bẫy: findById hai lần ở READ COMMITTED vẫn ra 10 và 10: Hibernate trả entity trong persistence context. Muốn giá trị mới: refresh().",
         [IN("#mv-con", "up", 0.3, 0.4), IN("#mv-con-1", "type1", 0.8, 0.3), IN("#mv-con-2", "type1", 2.6, 0.3), IN("#mv-con-3", "type1", 4.4, 0.3),
          IN("#mv-fix", "right", 5.8), IN("#mv-fx", "left", 10.4)]),
    ]),
    # ------------------------------------------------------------ lost update and three fixes
    dict(id="lostupdate", world=(1920, 1080), hud=hud("lu", "Lost update và ba cách sửa", "Stock 10, hai người mua: đúng phải còn 8"), cam="".join([
        gnode("lu-ta", 160, 190, 300, 90, "Tx A", "amber"),
        gnode("lu-tb", 160, 300, 300, 90, "Tx B", "violet"),
        box("lu-a1", 520, 190, 280, 90, "<b>đọc 10</b>", "cyan", "card"),
        box("lu-a2", 840, 190, 280, 90, "<b>tính 9</b>", "cyan", "card"),
        box("lu-a3", 1160, 190, 280, 90, "<b>ghi 9</b>", "cyan", "card"),
        box("lu-b1", 520, 300, 280, 90, "<b>đọc 10</b>", "cyan", "card"),
        box("lu-b2", 840, 300, 280, 90, "<b>tính 9</b>", "cyan", "card"),
        box("lu-b3", 1160, 300, 280, 90, "<b>ghi 9</b>", "cyan", "card"),
        el("lu-st", 1500, 262, None, None, "stock = 9", "stamp red r"),
        box("lu-r1", 160, 440, 1600, 66, "<b>READ COMMITTED · read-modify-write → final stock=9</b>", "red", "card"),
        box("lu-r2", 160, 522, 1600, 66, "<b>REPEATABLE READ → could not serialize access due to concurrent update</b>", "amber", "card"),
        box("lu-r3", 160, 604, 1600, 66, "<b>Atomic UPDATE: set stock = stock - 1 where id = 1 and stock > 0 → 8</b>", "green", "card"),
        box("lu-r4", 160, 686, 1600, 66, "<b>@Version → ObjectOptimisticLockingFailureException, bên thua rollback</b>", "green", "card"),
        box("lu-r5", 160, 768, 1600, 66, "<b>SELECT ... FOR UPDATE → 8 · thread B chờ 306 ms (SELECT thường: 6 ms)</b>", "green", "card"),
        card4("lu-k", 160, 200, 500, 260, 50, [("box", "Atomic UPDATE", "phép tính đơn giản · nhanh nhất · kiểm tra số dòng"),
                                                ("eq", "@Version", "xung đột hiếm · bắt exception rồi retry"),
                                                ("lock", "FOR UPDATE", "xung đột thường xuyên · transaction thật ngắn")]),
        chip("lu-fs", 160, 520, "Flash sale: ưu tiên atomic UPDATE", "green"),
        chip("lu-mq", 160, 600, "@Version bị bỏ qua với @Modifying @Query tự viết", "red"),
    ]), beats=[
        ("Phần ba: lost update. Kho còn mười. Hai bên cùng đọc mười, cùng tính ra chín, cùng ghi chín. Mất một lần trừ.",
         "Phần 3: cả hai cùng đọc 10, cùng tính 9, cùng ghi 9. Mất một lần trừ.",
         [IN("#lu-hud", "left", 0.1), IN("#lu-ta, #lu-tb", "pop", 1.0, 0.5, 0.15), IN("#lu-a1, #lu-b1", "left", 2.6, 0.5, 0.1),
          IN("#lu-a2, #lu-b2", "left", 3.9, 0.5, 0.1), IN("#lu-a3, #lu-b3", "left", 5.2, 0.5, 0.1), IN("#lu-st", "stamp", 6.6)]),
        ("Read Committed không chặn được. Lên Repeatable Read thì Postgres ném lỗi could not serialize: chưa đúng, chỉ thành exception phải retry.",
         "READ COMMITTED: còn 9. REPEATABLE READ: chỉ biến thành exception (CannotAcquireLockException), phải retry.",
         [IN("#lu-r1", "left", 0.4), IN("#lu-r2", "left", 2.4)]),
        ("Cách một: atomic update, trừ ngay trong câu SQL, ra đúng tám. Cách hai: optimistic lock với Version, bên thua nhận exception và bị rollback.",
         "Cách 1: atomic UPDATE trừ ngay trong SQL, ra 8. Cách 2: @Version, bên thua nhận exception và rollback.",
         [IN("#lu-r3", "left", 0.4), IN("#lu-r4", "left", 4.6)]),
        ("Cách ba: select For Update khoá dòng lúc đọc. Ra đúng tám, thread thứ hai chờ ba trăm lẻ sáu mili giây.",
         "Cách 3: SELECT ... FOR UPDATE khoá dòng lúc đọc. Ra 8, thread thứ hai chờ 306 ms.",
         [IN("#lu-r5", "left", 0.4), PULSE("#lu-r5", 4.4)]),
        ("Phép tính đơn giản thì atomic update. Xung đột hiếm thì Version. Xung đột thường xuyên thì For Update, transaction thật ngắn. Flash sale, ưu tiên atomic update.",
         "Tính đơn giản: atomic UPDATE · xung đột hiếm: @Version · xung đột nhiều: FOR UPDATE, tx ngắn.",
         [OUT("#lu-ta, #lu-tb, #lu-a1, #lu-a2, #lu-a3, #lu-b1, #lu-b2, #lu-b3, #lu-st, #lu-r1, #lu-r2, #lu-r3, #lu-r4, #lu-r5", "fade", 0, 0.4),
          IN("#lu-k0", "pop", 0.6), IN("#lu-k1", "pop", 2.6), IN("#lu-k2", "pop", 4.3), IN("#lu-fs", "left", 8.6)]),
        ("Lưu ý: Version bị bỏ qua với câu update tự viết bằng Modifying Query.",
         "@Version bị bỏ qua với câu update tự viết bằng @Modifying @Query.",
         [IN("#lu-mq", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ write skew
    dict(id="writeskew", world=(1920, 1080), hud=hud("ws", "Write skew", "Mỗi bên đúng, gộp lại sai"), cam="".join([
        chip("ws-rule", 160, 190, "Quy tắc: luôn có ít nhất 1 bác sĩ trực", "amber"),
        gnode("ws-da", 160, 290, 300, 100, "Bác sĩ A", "cyan"),
        gnode("ws-db", 160, 420, 300, 100, "Bác sĩ B", "cyan"),
        swap_chip("ws-sa1", 500, 312, "đang trực", "green"), swap_chip("ws-sa2", 500, 312, "nghỉ", "red"),
        swap_chip("ws-sb1", 500, 442, "đang trực", "green"), swap_chip("ws-sb2", 500, 442, "nghỉ", "red"),
        box("ws-ta", 900, 290, 860, 100, "<b>Tx A: đếm thấy 2 người → nghỉ được</b>", "amber", "card"),
        box("ws-tb", 900, 420, 860, 100, "<b>Tx B: đếm thấy 2 người → nghỉ được</b>", "violet", "card"),
        box("ws-res", 160, 560, 1600, 80, "<b>REPEATABLE READ: cả hai commit · on call now=0</b>", "red", "card"),
        console("ws-con", 160, 670, 1600, ["SERIALIZABLE: tx còn lại lỗi ngay ở câu update",
                                           "could not serialize access due to read/write dependencies among transactions"]),
        chip("ws-f1", 160, 670, "SERIALIZABLE + retry, chỉ cho nghiệp vụ này", "violet"),
        chip("ws-f2", 160, 750, "SELECT ... FOR UPDATE các dòng dùng để kiểm tra điều kiện", "green"),
        chip("ws-f3", 160, 830, "Đưa quy tắc xuống DB: constraint, hoặc một dòng tổng", "cyan"),
        wires(trace("ws-wa", [(892, 340), (712, 340)], "amber"), trace("ws-wb", [(892, 470), (712, 470)], "violet")),
    ]), beats=[
        ("Phần bốn: write skew. Quy tắc: luôn có ít nhất một bác sĩ trực. Hiện có hai người, và cả hai cùng xin nghỉ.",
         "Phần 4: luôn có ít nhất 1 bác sĩ trực. Hiện có 2 người, cả hai cùng xin nghỉ.",
         [IN("#ws-hud", "left", 0.1), IN("#ws-rule", "left", 1.6), IN("#ws-da, #ws-db", "pop", 4.6, 0.5, 0.15),
          IN("#ws-sa1, #ws-sb1", "pop", 5.4, 0.4, 0.1)]),
        ("Mỗi transaction đếm thấy hai người, nghỉ được. Mỗi bên update dòng của chính mình, không đụng khoá của nhau.",
         "Mỗi tx đếm thấy 2 người. Mỗi bên update dòng của mình, không đụng khoá của nhau.",
         [IN("#ws-ta", "right", 0.3), IN("#ws-tb", "right", 0.9), DRAW("#ws-wa-p", 3.6, 0.4), DRAW("#ws-wb-p", 3.6, 0.4),
          COMET("ws-wa", 4.0, 0.5), COMET("ws-wb", 4.0, 0.5), OUT("#ws-sa1, #ws-sb1", "fade", 4.6, 0.3), IN("#ws-sa2, #ws-sb2", "pop", 4.9, 0.4)]),
        ("Ở Repeatable Read, cả hai cùng commit: ca trực còn không người. Không ai ghi đè ai, nhưng gộp lại thì sai quy tắc.",
         "REPEATABLE READ: cả hai commit, còn 0 người trực. Không ai ghi đè ai, gộp lại thì sai.",
         [IN("#ws-res", "left", 0.4), SHAKE("#ws-res", 2.6)]),
        ("Serializable mới chặn được: Postgres huỷ transaction còn lại. Cái giá là phải retry, nên đừng đặt Serializable cho mọi thứ.",
         "SERIALIZABLE chặn được: transaction còn lại bị huỷ. Cái giá là phải retry, đừng dùng cho mọi thứ.",
         [IN("#ws-con", "up", 0.2, 0.4), IN("#ws-con-1", "type1", 0.6, 0.3), IN("#ws-con-2", "type1", 2.0, 0.3)]),
        ("Cách sửa: Serializable kèm retry cho riêng nghiệp vụ này, For Update các dòng dùng để kiểm tra, hoặc đưa quy tắc xuống database.",
         "Sửa: SERIALIZABLE + retry · FOR UPDATE các dòng kiểm tra · đưa quy tắc xuống DB.",
         [OUT("#ws-con", "fade", 0, 0.4), IN("#ws-f1", "left", 0.6), IN("#ws-f2", "left", 3.8), IN("#ws-f3", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ readOnly = true
    dict(id="readonly", world=(1920, 1080), hud=hud("ro", "readOnly = true thực sự làm gì", "Một gợi ý, mỗi tầng tự quyết"), cam="".join([
        grid_head("ro-h", 190, ["Đo được", "readOnly = true", "@Transactional thường"], RO_COLS),
        grid_row("ro-r1", 240, ["Hibernate flush mode", ("MANUAL", "var(--green)"), "AUTO"], RO_COLS),
        grid_row("ro-r2", 310, ["Session, entity read-only", ("true", "var(--green)"), "false"], RO_COLS),
        grid_row("ro-r3", 380, ["Connection.isReadOnly()", ("true", "var(--green)"), "false"], RO_COLS),
        grid_row("ro-r4", 450, ["Sửa field entity", ("không có UPDATE, giữ 10", "var(--green)"), "UPDATE, thành 555"], RO_COLS, "violet"),
        chip("ro-gain", 160, 540, "Lợi ích chính: bỏ dirty checking · có thể route sang read replica", "green"),
        box("ro-h2", 160, 630, 760, 175, "<b>H2</b><small>save(): im lặng không lưu</small><small>saveAndFlush(), jdbcTemplate.update(): lưu được</small>", "red", "card"),
        box("ro-pg", 1000, 630, 760, 175, "<b>PostgreSQL chặn ghi</b><small>cannot execute INSERT in a read-only transaction</small><small>SQL state 25006</small>", "green", "card"),
        chip("ro-sec", 160, 840, "readOnly không phải bảo mật", "red"),
        chip("ro-pat", 720, 840, "Class readOnly · method ghi: @Transactional", "violet"),
    ]), beats=[
        ("Phần năm: Read Only bằng true thực sự làm gì? Hibernate chuyển flush mode sang Manual, entity load ở chế độ chỉ đọc, và connection được đặt read only.",
         "Phần 5: flush mode MANUAL, entity read-only, Connection.isReadOnly() = true.",
         [IN("#ro-hud", "left", 0.1), IN("#ro-h", "fade", 2.4), IN("#ro-r1", "left", 3.6), IN("#ro-r2", "left", 6.4), IN("#ro-r3", "left", 8.8)]),
        ("Sửa field của entity rồi kết thúc method: không có câu update nào. Lợi ích chính là bỏ Dirty Checking, và có thể chuyển truy vấn sang bản sao chỉ đọc.",
         "Sửa field entity: không có UPDATE. Lợi ích chính: bỏ dirty checking, có thể route sang read replica.",
         [IN("#ro-r4", "left", 0.4), IN("#ro-gain", "left", 4.8)]),
        ("Còn ghi thẳng thì sao? Trên H hai, save im lặng không lưu, nhưng save and flush vẫn lưu được. Postgres thì chặn, báo lỗi không thể insert trong transaction chỉ đọc.",
         "Ghi thẳng: H2 save() im lặng không lưu, saveAndFlush() vẫn lưu. PostgreSQL chặn: cannot execute INSERT in a read-only transaction.",
         [IN("#ro-h2", "left", 1.6), IN("#ro-pg", "right", 7.0)]),
        ("Vậy Read Only không phải cơ chế bảo mật. Hay dùng nhất: đặt Read Only cho cả class, method ghi thì gắn Transactional thường.",
         "readOnly không phải bảo mật. Pattern: class readOnly = true, method ghi gắn @Transactional thường.",
         [IN("#ro-sec", "left", 0.4), IN("#ro-pat", "left", 3.6)]),
    ]),
    # ------------------------------------------------------------ no external calls inside a transaction
    dict(id="longtx", world=(1920, 1080), hud=hud("lt", "Không gọi API ngoài trong transaction", "Transaction ngắn, gọi mạng ở giữa"), cam="".join([
        box("lt-code", 160, 190, 1000, 290, code("@Transactional\npublic void checkout(Order order) {\n    orderRepo.save(order);\n"
                                                 "    paymentClient.charge(order);     // HTTP 2–5 giây\n"
                                                 "    emailClient.sendConfirmation();  // HTTP\n}"), "cyan", "code"),
        box("lt-p1", 1220, 190, 540, 135, "<b>Giữ connection</b><small>suốt lúc chờ mạng · pool cạn</small>", "red", "card"),
        box("lt-p2", 1220, 345, 540, 135, "<b>Rollback không thu hồi</b><small>tiền đã trừ ở cổng thanh toán</small>", "red", "card"),
        gnode("lt-n1", 160, 540, 350, 100, "Tx: lưu PENDING", "amber"),
        gnode("lt-n2", 570, 540, 350, 100, "Gọi thanh toán", "violet"),
        gnode("lt-n3", 980, 540, 350, 100, "Tx: PAID/FAILED", "amber"),
        gnode("lt-n4", 1390, 540, 350, 100, "Email sau commit", "green"),
        chip("lt-c1", 160, 690, "Gọi thanh toán ngoài transaction, kèm idempotency key", "violet"),
        chip("lt-c2", 160, 770, "Email: @TransactionalEventListener(AFTER_COMMIT) hoặc outbox", "cyan"),
        chip("lt-c3", 160, 850, "@Transactional(timeout = 5) · theo dõi hikaricp.connections.active, pending", "amber"),
        wires(trace("lt-w1", [(510, 590), (562, 590)], "violet"), trace("lt-w2", [(920, 590), (972, 590)], "amber"),
              trace("lt-w3", [(1330, 590), (1382, 590)], "green")),
    ]), beats=[
        ("Phần sáu: đừng gọi Api bên ngoài trong transaction. Method checkout lưu đơn, gọi cổng thanh toán mất hai tới năm giây, rồi gửi email.",
         "Phần 6: checkout() lưu đơn, gọi cổng thanh toán 2–5 giây, rồi gửi email, tất cả trong một transaction.",
         [IN("#lt-hud", "left", 0.1), IN("#lt-code", "up", 3.4)]),
        ("Một: connection bị giữ suốt thời gian chờ mạng, tải cao là pool cạn. Hai: đã trừ tiền rồi email lỗi làm rollback, đơn biến mất nhưng tiền vẫn bị trừ.",
         "1: giữ connection suốt lúc chờ mạng, pool cạn. 2: rollback DB không thu hồi được tiền đã trừ.",
         [IN("#lt-p1", "left", 0.4), IN("#lt-p2", "left", 5.0), SHAKE("#lt-p2", 8.4)]),
        ("Cách đúng: transaction ngắn lưu đơn chờ thanh toán. Gọi thanh toán ở ngoài, kèm idempotency key. Transaction ngắn cập nhật kết quả. Email gửi sau commit.",
         "Cách đúng: tx ngắn lưu PENDING · gọi thanh toán ngoài tx · tx ngắn cập nhật PAID/FAILED · email sau commit.",
         [IN("#lt-n1", "pop", 0.8), DRAW("#lt-w1-p", 3.0, 0.4), IN("#lt-n2", "pop", 3.4), IN("#lt-c1", "left", 5.0),
          DRAW("#lt-w2-p", 6.4, 0.4), IN("#lt-n3", "pop", 6.8), DRAW("#lt-w3-p", 8.8, 0.4), IN("#lt-n4", "pop", 9.2), IN("#lt-c2", "left", 9.8)]),
        ("Transaction dài còn giữ lock, và bắt Postgres giữ phiên bản cũ lâu. Hãy đặt timeout, và theo dõi số connection của Hikari.",
         "Transaction dài giữ lock, giữ phiên bản cũ lâu. Đặt timeout, theo dõi connection active và pending.",
         [IN("#lt-c3", "left", 4.6)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 190, 290, 360, 280, 30, [("split", "Level & MVCC", "RC chụp mỗi câu, RR chụp một lần"),
                                                ("lock", "Lost update", "atomic UPDATE · @Version · FOR UPDATE"),
                                                ("shield", "Write skew", "RR không chặn, cần SERIALIZABLE"),
                                                ("box", "readOnly", "bỏ dirty checking, không phải bảo mật")]),
        chip("ou-next", 592, 650, "Bài tiếp: TransactionTemplate & Transaction Events", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: Read Committed chụp mỗi câu lệnh, Repeatable Read chụp một lần. Lost update sửa bằng atomic update, Version, hoặc For Update. Write skew cần Serializable. Read Only bỏ Dirty Checking, nhưng không chặn ghi ở mọi database.",
         "RC chụp mỗi câu, RR chụp một lần · lost update: atomic UPDATE, @Version, FOR UPDATE · write skew: SERIALIZABLE · readOnly không phải bảo mật.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.0), IN("#ou-c2", "pop", 9.7), IN("#ou-c3", "pop", 11.7)]),
        ("Bài tiếp: Transaction Template và transaction events.", "Bài tiếp: TransactionTemplate & Transaction Events.",
         [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
