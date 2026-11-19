"""Locking, Batch & Mapping explainer: scene layouts and per-beat narration + motion.

Measured on Spring Boot 3.5.16 + Hibernate ORM 6.6.53 + PostgreSQL 16.14 (Docker), JDK 21, JDBC round trips counted with a
DataSource proxy, study note 05.08 and web lesson locking.ts: no @Version, balance 100, withdraw 50 and 30 interleaved -> 50
(expected 20); 10 threads minus 1 from 100 -> 99 (expected 90); @Version -> update ... where id=? and version=?, 0 rows ->
ObjectOptimisticLockingFailureException (cause StaleObjectStateException); PESSIMISTIC_WRITE -> for no key update, B waited
1125 ms, final balance 20; atomic update stock >= :q, stock 10, 20 threads -> 10 succeed, 10 return 0 rows, final stock 0;
batch_size 50, 1000 entities: IDENTITY 1000 INSERT 0 batches, SEQUENCE allocationSize 50 20 nextval + 20 executeBatch;
flush + clear every 50: 50000 entities -> 0 left in the context instead of 50000; @Modifying bulk update: findById still
sees 10 (same instance), clearAutomatically sees 0; setStock(stock - 1) on the stale entity -> stock 9, version 1;
outside a transaction -> InvalidDataAccessApiUsageException; orphanRemoval removeItem -> 1 DELETE;
@Data parent/child: hashCode and toString -> StackOverflowError, HashSet contains(child) false with size 1.
The @Data and safe equals/hashCode behaviour was re-run as plain Java on JDK 21.0.12 (no Hibernate): StackOverflowError on
hashCode and toString, contains=false size=1 for an all-field hashCode, contains=true size=1 for a constant hashCode.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Hai người cùng mua sản phẩm cuối cùng?"), "h1 center r"),
        console("hk-con", 460, 420, 1000, ["10 thread · đọc balance 100 · trừ 1", "Kỳ vọng: 90", "Đo được: 99 · mất 9 lần trừ"]),
        tile("hk-tile", 230, 360, 200, "lock"),
        el("hk-word", 480, 400, 1400, None, letters("Locking, Batch & Mapping"), "h1 wordmark r",
           "text-align:left;white-space:nowrap;font-size:96px"),
        el("hk-sub", 0, 680, 1920, None, "@Version · FOR UPDATE · batch insert · @Modifying · equals", "kin-sub r"),
    ]), beats=[
        ("Hai người cùng mua sản phẩm cuối cùng. Chuyện gì xảy ra?",
         "Hai người cùng mua sản phẩm cuối cùng. Chuyện gì xảy ra?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đã đo thật: mười thread cùng đọc số dư một trăm, rồi trừ một. Đúng phải còn chín mươi, nhưng database còn chín mươi chín.",
         "Đã đo: 10 thread cùng trừ 1 từ 100. Đúng là 90, đo được 99.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.6, 0.3), IN("#hk-con-2", "type1", 4.4, 0.3),
          IN("#hk-con-3", "type1", 6.4, 0.3)]),
        ("Hôm nay ta học locking, batch, và mapping.", "Hôm nay: Locking, Batch & Mapping.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.04),
          IN("#hk-sub", "blur", 1.2)]),
    ]),
    # ------------------------------------------------------------ lost update and three fixes
    dict(id="locks", world=(1920, 1080), hud=hud("lk", "Lost update và ba cách giải", "Đọc, sửa trong Java, ghi lại"), cam="".join([
        big_title("lk", "Lost update", "Đọc, sửa trong Java, ghi lại"),
        gnode("lk-t1", 160, 200, 440, 100, "Tx 1 · rút 50", "amber"),
        gnode("lk-db", 740, 200, 440, 100, "DB · balance 100", "cyan"),
        gnode("lk-t2", 1320, 200, 440, 100, "Tx 2 · rút 30", "amber"),
        console("lk-con", 160, 360, 1000, ["Tx 1: SELECT balance → 100", "Tx 2: SELECT balance → 100",
                                           "Tx 2: UPDATE balance = 70, COMMIT", "Tx 1: UPDATE balance = 50, COMMIT"]),
        el("lk-st", 1240, 430, None, None, "Đúng 20 · đo được 50", "stamp red r"),
        el("lk-rc", 160, 680, 1600, None, "READ COMMITTED mặc định (PostgreSQL, Oracle, SQL Server) không chặn được lost update", "note left r"),
        box("lk-o", 160, 190, 500, 320, "<b>Optimistic</b><b>@Version</b><small>update ... where id=? and version=?</small>"
            "<small>Không khoá lúc đọc</small>", "cyan", "card"),
        box("lk-p", 710, 190, 500, 320, "<b>Pessimistic</b><b>PESSIMISTIC_WRITE</b><small>PostgreSQL: for no key update</small>"
            "<small>B chờ 1125 ms · balance cuối 20</small>", "violet", "card"),
        box("lk-a3", 1260, 190, 500, 320, "<b>UPDATE nguyên tử</b><small>set stock = stock - :q</small>"
            "<small>where id = :id and stock >= :q</small><small>20 thread tranh 10: đúng 10 thành công</small>", "green", "card"),
        chip("lk-x1", 160, 570, "0 dòng: ObjectOptimisticLockingFailureException", "red"),
        chip("lk-x2", 160, 650, "Hợp xung đột hiếm · form web: gửi version về client", "cyan"),
        chip("lk-x3", 160, 730, "@Lock cần transaction · khoá theo thứ tự id để tránh deadlock", "violet"),
        chip("lk-x4", 160, 810, "Kiểm tra số dòng bị ảnh hưởng: 0 là hết hàng, stock cuối 0", "green"),
        wires(trace("lk-a", [(600, 250), (732, 250)], "amber"), trace("lk-b", [(1320, 250), (1188, 250)], "amber")),
    ]), beats=[
        ("Phần một: lost update. Code kiểu đọc, sửa trong Java, rồi ghi lại rất phổ biến. Nhưng khi hai transaction chạy cùng lúc, bên ghi sau sẽ đè bên ghi trước.",
         "Phần 1: đọc, sửa trong Java, ghi lại: bên ghi sau đè bên ghi trước.",
         [TYPE("#lk-big", 0.1, 0.06), IN("#lk-bsub", "blur", 0.8), OUT("#lk-big, #lk-bsub", "zoom", 4.0), IN("#lk-hud", "left", 4.6),
          IN("#lk-t1, #lk-db, #lk-t2", "pop", 5.2, 0.5, 0.15), DRAW("#lk-a-p", 6.6, 0.4), DRAW("#lk-b-p", 6.6, 0.4)]),
        ("Số dư một trăm. Transaction một rút năm mươi, transaction hai rút ba mươi. Cả hai cùng đọc một trăm, bên hai ghi bảy mươi, rồi bên một ghi năm mươi.",
         "Số dư 100. Cả hai cùng đọc 100, Tx 2 ghi 70, rồi Tx 1 ghi 50.",
         [IN("#lk-con", "up", 0.3, 0.4), COMET("lk-a", 4.6, 0.5), IN("#lk-con-1", "type1", 4.8, 0.3), COMET("lk-b", 5.2, 0.5),
          IN("#lk-con-2", "type1", 5.4, 0.3), IN("#lk-con-3", "type1", 6.8, 0.3), IN("#lk-con-4", "type1", 8.6, 0.3)]),
        ("Đúng phải còn hai mươi, nhưng đo được năm mươi: khoản rút ba mươi bị mất. Read Committed mặc định không chặn được chuyện này.",
         "Đúng là 20, đo được 50: mất khoản rút 30. READ COMMITTED không chặn được.",
         [IN("#lk-st", "stamp", 0.3), SHAKE("#lk-st", 1.0), IN("#lk-rc", "up", 3.4)]),
        ("Có ba cách giải. Một: optimistic lock với cột Version. Khi ghi, Hibernate thêm điều kiện version vào where. Bên khác đã sửa trước thì khớp không dòng, và Spring ném exception.",
         "Cách 1: @Version thêm and version=? vào WHERE. Khớp 0 dòng thì ném exception.",
         [OUT("#lk-t1, #lk-db, #lk-t2, #lk-a, #lk-b, #lk-con, #lk-st, #lk-rc", "blur", 0, 0.45), IN("#lk-o", "up", 1.0),
          IN("#lk-x1", "left", 9.6)]),
        ("Cách này hợp khi xung đột hiếm, như form sửa sản phẩm. Nhớ gửi version về client, để so lại lúc lưu.",
         "Hợp khi xung đột hiếm. Form web: gửi version về client, so lại khi lưu.",
         [IN("#lk-x2", "left", 0.4)]),
        ("Hai: pessimistic lock, khoá dòng ngay lúc đọc. Trên Postgres, Hibernate thêm vào cuối câu select: for no key update. Đo được: bên sau chờ một nghìn một trăm hai mươi lăm mili giây, và số dư cuối đúng hai mươi.",
         "Cách 2: FOR NO KEY UPDATE khoá lúc đọc. B chờ 1125 ms, balance cuối 20.",
         [IN("#lk-p", "up", 0.3)]),
        ("Khoá chỉ sống trong transaction. Khi khoá nhiều dòng, luôn khoá theo thứ tự id để tránh deadlock.",
         "@Lock cần transaction. Khoá nhiều dòng theo thứ tự id để tránh deadlock.",
         [IN("#lk-x3", "left", 0.4)]),
        ("Ba: một câu update nguyên tử, trừ kho kèm điều kiện còn đủ hàng. Hai mươi thread tranh mười sản phẩm: đúng mười thành công. Kiểm tra số dòng bị ảnh hưởng, bằng không là hết hàng.",
         "Cách 3: UPDATE ... and stock >= :q. 20 thread tranh 10: đúng 10 thành công.",
         [IN("#lk-a3", "up", 0.3), IN("#lk-x4", "left", 6.8)]),
    ]),
    # ------------------------------------------------------------ batch insert
    dict(id="batch", world=(1920, 1080), hud=hud("ba", "Batch insert", "Bẫy IDENTITY"), cam="".join([
        big_title("ba", "Batch insert", "Và bẫy IDENTITY"),
        box("ba-cfg", 160, 190, 1000, 160, code("hibernate.jdbc.batch_size=50\nhibernate.order_inserts=true\nhibernate.order_updates=true"),
            "cyan", "code"),
        el("ba-why", 1230, 210, 530, None, "JDBC batching: gom nhiều INSERT cùng dạng vào một round trip", "note left r"),
        el("ba-n", 160, 375, 1600, None, "persist 1 000 entity, batch_size = 50:", "lbl r", "text-align:left"),
        box("ba-id", 160, 425, 760, 240, "<b>IDENTITY</b><small>DB sinh id lúc INSERT, Hibernate cần id ngay khi persist</small>"
            "<b>1 000 INSERT · 0 batch</b>", "red", "card"),
        box("ba-sq", 1000, 425, 760, 240, "<b>SEQUENCE · allocationSize 50</b><small>1 lần nextval cấp 50 id trong memory</small>"
            "<b>20 nextval · 20 executeBatch</b>", "green", "card"),
        chip("ba-c1", 160, 710, "flush() + clear() mỗi 50: 50 000 entity → 0 trong context", "cyan"),
        chip("ba-c2", 160, 790, "Hàng triệu dòng: JdbcTemplate.batchUpdate hoặc COPY", "violet"),
        chip("ba-c3", 160, 870, "allocationSize phải khớp INCREMENT BY của sequence", "amber"),
    ]), beats=[
        ("Phần hai: Batch Insert. Bật Batch Size năm mươi, cùng Order Inserts và Order Updates, thì Hibernate gom nhiều câu insert vào một lần gửi.",
         "Phần 2: batch_size = 50, order_inserts, order_updates: gom INSERT theo lô.",
         [TYPE("#ba-big", 0.1, 0.06), IN("#ba-bsub", "blur", 0.8), OUT("#ba-big, #ba-bsub", "zoom", 3.6), IN("#ba-hud", "left", 4.2),
          IN("#ba-cfg", "up", 4.6), IN("#ba-why", "right", 7.4)]),
        ("Bẫy nằm ở Identity. Id do database sinh lúc insert, mà Hibernate cần id ngay khi persist, nên phải insert từng dòng. Một nghìn entity là một nghìn câu insert.",
         "IDENTITY: cần id ngay khi persist, nên INSERT từng dòng: 1 000 câu INSERT.",
         [IN("#ba-n", "fade", 0.3), IN("#ba-id", "left", 0.8), SHAKE("#ba-id", 8.4)]),
        ("Đổi sang Sequence với allocation size năm mươi: một lần lấy sequence cấp năm mươi id trong bộ nhớ. Một nghìn entity chỉ còn hai mươi lần gửi batch.",
         "SEQUENCE, allocationSize 50: 20 nextval và chỉ 20 executeBatch.",
         [IN("#ba-sq", "right", 0.4)]),
        ("Batch lớn thì flush và clear mỗi năm mươi dòng. Năm mươi nghìn entity, cuối transaction context còn không, thay vì năm mươi nghìn.",
         "flush() + clear() mỗi 50 dòng: 50 000 entity còn 0 trong context thay vì 50 000.",
         [IN("#ba-c1", "left", 0.4)]),
        ("Hàng triệu dòng thì không đi qua entity nữa, mà gọi Batch Update trực tiếp, hoặc lệnh Copy của Postgres. Allocation size cũng phải khớp bước tăng của Sequence.",
         "Triệu dòng: JdbcTemplate.batchUpdate hoặc COPY. allocationSize khớp INCREMENT BY.",
         [IN("#ba-c2", "left", 0.4), IN("#ba-c3", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ bulk update
    dict(id="bulk", world=(1920, 1080), hud=hud("bu", "Bulk update với @Modifying", "Chạy thẳng xuống DB"), cam="".join([
        box("bu-code", 160, 190, 1000, 170, code('@Modifying\n@Query("update Product p set p.stock = 0")\nint resetAll();'), "cyan", "code"),
        gnode("bu-ctx", 160, 430, 600, 110, "Persistence context · stock 10", "violet"),
        gnode("bu-db", 1200, 430, 560, 110, "DB · stock 0", "cyan"),
        console("bu-con", 160, 590, 1600, ["findById sau bulk → stock 10 · cùng instance: true",
                                           "@Modifying(clearAutomatically = true) → stock 0 · cùng instance: false"]),
        chip("bu-c1", 160, 590, "clearAutomatically xoá thay đổi chưa flush: thêm flushAutomatically = true", "amber"),
        chip("bu-c2", 160, 670, "Ngoài transaction: InvalidDataAccessApiUsageException", "red"),
        box("bu-bad", 160, 780, 1600, 80, "<b>setStock(stock - 1) trên entity cũ → DB cuối: stock 9, version 1</b>", "red", "card"),
        wires(trace("bu-t", [(1160, 275), (1480, 275), (1480, 422)], "cyan", r=28)),
    ]), beats=[
        ("Phần ba: bulk update với Modifying. Câu update này chạy thẳng xuống database, không đi qua Persistence Context.",
         "Phần 3: @Modifying chạy thẳng xuống DB, không qua persistence context.",
         [IN("#bu-hud", "left", 0.1), IN("#bu-code", "up", 0.4), IN("#bu-ctx", "pop", 3.4), IN("#bu-db", "pop", 3.8),
          DRAW("#bu-t-p", 4.4, 0.6), COMET("bu-t", 5.2, 0.7), LIGHT("#bu-db", 5.9)]),
        ("Đã đo: load sản phẩm tồn kho mười, bulk update về không, rồi Find By Id lại. Vẫn thấy mười, và vẫn là cùng một instance, lấy từ cache cấp một.",
         "Load stock 10, bulk về 0, findById lại: vẫn thấy 10, cùng instance.",
         [IN("#bu-con", "up", 0.3, 0.4), IN("#bu-con-1", "type1", 4.6, 0.3), PULSE("#bu-ctx", 6.0)]),
        ("Thêm Clear Automatically bằng true thì context được xoá, và đọc lại thấy không.",
         "clearAutomatically = true: context bị xoá, đọc lại thấy 0.",
         [IN("#bu-con-2", "type1", 0.6, 0.3)]),
        ("Bẫy nguy hiểm nhất: trừ một trên entity cũ. Dirty checking ghi chín, dựa trên giá trị mười cũ. Bulk update bị ghi đè, vì nó không tăng Version.",
         "Bẫy: setStock(stock - 1) trên entity cũ → stock 9, version 1: bulk bị ghi đè.",
         [IN("#bu-bad", "left", 0.4), SHAKE("#bu-bad", 5.0)]),
        ("Clear Automatically còn xoá thay đổi chưa flush, nên thêm Flush Automatically. Và gọi ngoài transaction thì bị exception.",
         "Thêm flushAutomatically. Ngoài transaction: InvalidDataAccessApiUsageException.",
         [OUT("#bu-con", "fade", 0, 0.4), IN("#bu-c1", "left", 0.5), IN("#bu-c2", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ relationship mapping
    dict(id="mapping", world=(1920, 1080), hud=hud("mp", "Mapping quan hệ", "Owner quyết định khoá ngoại"), cam="".join([
        big_title("mp", "Mapping", "Owner quyết định khoá ngoại"),
        gnode("mp-item", 160, 200, 620, 120, "OrderItem · @ManyToOne<br>owner: giữ cột order_id", "cyan"),
        gnode("mp-ord", 1140, 200, 620, 120, "Order · @OneToMany(mappedBy)<br>inverse: bị bỏ qua khi ghi", "violet"),
        box("mp-code", 160, 370, 1600, 130, code("public void addItem(OrderItem i) { items.add(i); i.setOrder(this); }\n"
                                                 "public void removeItem(OrderItem i) { items.remove(i); i.setOrder(null); }"), "green", "code"),
        chip("mp-null", 160, 540, "Chỉ items.add(item), quên item.setOrder(order): order_id = null", "red"),
        chip("mp-r1", 160, 620, "Mọi association LAZY · ưu tiên @ManyToOne một chiều", "cyan"),
        chip("mp-r2", 160, 700, "cascade = ALL + orphanRemoval chỉ cho composition: removeItem → 1 DELETE", "green"),
        chip("mp-r3", 160, 780, "Không cascade trên @ManyToOne, @ManyToMany · @ManyToMany dùng Set", "amber"),
        chip("mp-r4", 160, 860, "Bảng trung gian có cột thêm: entity riêng · không trả entity ra JSON", "violet"),
        wires(trace("mp-t", [(1140, 260), (780, 260)], "violet")),
    ]), beats=[
        ("Phần bốn: mapping quan hệ. Trong quan hệ hai chiều, chỉ một phía quyết định khoá ngoại: phía Many To One có Join Column, gọi là owner.",
         "Phần 4: phía @ManyToOne có @JoinColumn là owner, quyết định khoá ngoại.",
         [TYPE("#mp-big", 0.1, 0.06), IN("#mp-bsub", "blur", 0.8), OUT("#mp-big, #mp-bsub", "zoom", 3.4), IN("#mp-hud", "left", 4.0),
          IN("#mp-item", "pop", 6.4), LIGHT("#mp-item", 8.4)]),
        ("Phía mapped by bị bỏ qua khi ghi. Chỉ thêm item vào danh sách mà quên set order, thì cột order id bị bỏ trống.",
         "Phía mappedBy bị bỏ qua: chỉ items.add(item) thì order_id = null.",
         [IN("#mp-ord", "pop", 0.3), DRAW("#mp-t-p", 1.0, 0.5), IN("#mp-null", "left", 3.6), SHAKE("#mp-null", 6.6)]),
        ("Vì vậy luôn viết hàm add item và remove item để đồng bộ cả hai phía.",
         "Luôn có helper addItem, removeItem đồng bộ hai phía.",
         [IN("#mp-code", "up", 0.4)]),
        ("Quy tắc: mọi association để lazy, ưu tiên Many To One một chiều. Cascade all với orphan removal chỉ dùng cho quan hệ sở hữu: gỡ item khỏi order sinh một câu delete.",
         "Mọi association LAZY. cascade ALL + orphanRemoval chỉ cho composition: 1 DELETE.",
         [IN("#mp-r1", "left", 0.4), IN("#mp-r2", "left", 4.4)]),
        ("Không cascade trên Many To One hay Many To Many, và Many To Many thì dùng Set. Bảng trung gian có thêm cột thì map thành entity riêng. Và đừng trả entity ra JSON.",
         "Không cascade trên @ManyToOne, @ManyToMany. Bảng trung gian có cột: entity riêng.",
         [IN("#mp-r3", "left", 0.4), IN("#mp-r4", "left", 6.2)]),
    ]),
    # ------------------------------------------------------------ equals, hashCode, Lombok @Data
    dict(id="equals", world=(1920, 1080), hud=hud("eq", "equals, hashCode và Lombok @Data", "Mọi field, kể cả association"), cam="".join([
        box("eq-data", 160, 190, 760, 250, code("@Data @Entity\nclass LomParent {\n  @OneToMany(mappedBy = \"parent\")\n  Set<LomChild> children;\n}"),
            "violet", "code"),
        console("eq-con", 980, 190, 780, ["parent.hashCode() → StackOverflowError", "parent.toString() → StackOverflowError",
                                          "contains(child) = false · size = 1"]),
        card4("eq-k", 160, 490, 510, 220, 35, [("split", "StackOverflowError", "hashCode, toString gọi vòng"),
                                                ("plug", "Lazy load", "toString() trong câu log"),
                                                ("hash", "hashCode đổi", "id null → có giá trị sau persist")], "red"),
        box("eq-safe", 160, 190, 1100, 290, code("public boolean equals(Object o) {\n  if (this == o) return true;\n"
                                                 "  if (!(o instanceof Product other)) return false;\n"
                                                 "  return id != null && id.equals(other.getId());\n}\n"
                                                 "public int hashCode() { return getClass().hashCode(); }"), "green", "code"),
        chip("eq-s1", 160, 540, "instanceof: an toàn với proxy Hibernate (subclass)", "cyan"),
        chip("eq-s2", 160, 620, "hashCode hằng số: gán id sau khi add, contains vẫn true", "green"),
        chip("eq-s3", 160, 700, "Có business key bất biến (SKU, email chuẩn hoá): dùng cho cả hai", "violet"),
    ]), beats=[
        ("Phần năm: equals và hash code. Lombok Data sinh equals, hash code và to string trên mọi field, kể cả association.",
         "Phần 5: @Data sinh equals, hashCode, toString trên mọi field, kể cả association.",
         [IN("#eq-hud", "left", 0.1), IN("#eq-data", "up", 0.5)]),
        ("Cha và con trỏ vào nhau, nên hash code gọi qua lại mãi: Stack Overflow Error. To String cũng vậy.",
         "Cha và con trỏ vào nhau: hashCode và toString ném StackOverflowError.",
         [IN("#eq-con", "up", 0.3, 0.4), IN("#eq-con-1", "type1", 2.6, 0.3), IN("#eq-con-2", "type1", 5.4, 0.3), IN("#eq-k0", "pop", 5.8)]),
        ("Còn to string, khi in ra log, có thể kích hoạt lazy load.",
         "toString() trong log có thể kích hoạt lazy load.",
         [IN("#eq-k1", "pop", 0.4)]),
        ("Và hash code đổi khi id được gán. Thêm một đối tượng con chưa có id vào tập hợp, lưu xuống, rồi tìm lại thì không thấy, dù tập hợp vẫn có một phần tử.",
         "Con chưa có id vào HashSet, lưu xong: contains(child) = false dù size = 1.",
         [IN("#eq-con-3", "type1", 7.0, 0.3), IN("#eq-k2", "pop", 7.6)]),
        ("Cách an toàn: equals dùng instance of để an toàn với proxy, và chỉ bằng nhau khi id đã có và trùng nhau.",
         "equals: instanceof (an toàn với proxy) và id != null && id.equals(other.getId()).",
         [OUT("#eq-data, #eq-con, #eq-k0, #eq-k1, #eq-k2", "blur", 0, 0.45), IN("#eq-safe", "up", 0.8), IN("#eq-s1", "left", 3.4)]),
        ("Hash code trả hằng số theo class, nên không đổi sau persist. Có business key bất biến, như mã sản phẩm, thì dùng nó cho cả hai.",
         "hashCode hằng số theo class. Có business key bất biến thì dùng nó cho cả hai.",
         [IN("#eq-s2", "left", 0.4), IN("#eq-s3", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("lock", "Lost update", "@Version, FOR UPDATE hoặc UPDATE nguyên tử"),
                                                ("grid", "Batch", "SEQUENCE thay IDENTITY: 20 batch, không phải 1 000 INSERT"),
                                                ("split", "Bulk update", "bỏ qua persistence context và @Version"),
                                                ("hash", "Entity", "không dùng @Data, equals theo id")]),
        chip("ou-next", 725, 650, "Bài tiếp: Index & EXPLAIN", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: lost update có ba cách giải, Version, For Update, và update nguyên tử. Batch thì dùng Sequence thay Identity. Bulk update bỏ qua context và Version. Và entity thì đừng dùng Lombok Data.",
         "Lost update: 3 cách · SEQUENCE thay IDENTITY · bulk bỏ qua context · không @Data.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.6), IN("#ou-c2", "pop", 8.4), IN("#ou-c3", "pop", 11.6)]),
        ("Bài tiếp: index, và explain.", "Bài tiếp: Index & EXPLAIN.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
