"""Lazy Loading & N+1 explainer: scene layouts and per-beat narration + motion.

Measured on Spring Boot 3.5.16 + Hibernate ORM 6.6.53 + PostgreSQL 16.14 (Docker), JDK 21, study note 05.07.
Data: 10 orders, 3 items each, 10 customers; query counts from Hibernate statistics.
getCustomer() class Customer$HibernateProxy, c.getId() 0 queries, c.getName() 1, getItems() PersistentBag;
EAGER @ManyToOne: invoiceRepo.findAll() and JPQL select i from Invoice i both 11 queries; getReferenceById 0 SELECT;
LazyInitializationException "failed to lazily initialize a collection of role: demo.Order.items: could not initialize proxy - no Session";
same controller via MockMvc: OSIV on -> 200, body 3, 2 queries; open-in-view=false -> LazyInitializationException;
loop getItems().size() 11 queries, getCustomer().getName() 11; JOIN FETCH 1, @EntityGraph 1, default_batch_fetch_size=4 -> 4,
=50 -> 2, DTO projection 1; JOIN FETCH collection + Pageable: WARN HHH90003004 ... applying in memory, no LIMIT, content=3 total=10;
page ids first then fetch by ids: 3 queries, 3 orders 9 items, no WARN; two List fetch joins: MultipleBagFetchException
"cannot simultaneously fetch multiple bags"; Set removes the error but keeps the Cartesian product (50 x 20 = 1000 rows per order).
No Java on screen prints output of its own: all outputs above come from the study note's measured runs.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def bar(id_, y, label, n, tone, note=""):
    """One row of the query-count chart: a label on the left, a bar 100 px per query, an optional note after the bar."""
    out = el(f"{id_}-l", 160, y + 14, 420, None, esc(label), "lbl r", "text-align:left;white-space:nowrap")
    out += box(f"{id_}-b", 600, y, 100 * n, 70, f"<b>{n}</b>", tone, "card")
    if note:
        out += el(f"{id_}-n", 600 + 100 * n + 24, y + 16, 900, None, esc(note), "note left r", "white-space:nowrap")
    return out


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn JPA", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("findAll() 10 order: bao nhiêu query?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["select ... from orders o1_0", "select ... from order_item i1_0 where i1_0.order_id=?",
                                           "select ... from order_item i1_0 where i1_0.order_id=?", "... lặp 10 lần · tổng 11 query"]),
        tile("hk-tile", 330, 350, 220, "split"),
        el("hk-word", 600, 380, 1300, None, letters("Lazy Loading & N+1"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "proxy · OSIV · JOIN FETCH · batch fetching", "kin-sub r"),
    ]), beats=[
        ("Lấy mười order bằng find all, rồi đếm số item của từng order. Hỏi: Hibernate chạy bao nhiêu câu query?",
         "findAll() 10 order rồi đếm items của từng order: Hibernate chạy bao nhiêu query?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đã đo thật: mười một query. Một câu lấy order, rồi mỗi order thêm một câu lấy item.",
         "Đã đo: 11 query. 1 câu lấy order, mỗi order thêm 1 câu lấy items.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 2.6, 0.3),
          IN("#hk-con-3", "type1", 3.2, 0.3), IN("#hk-con-4", "type1", 4.0, 0.3)]),
        ("Hôm nay ta học lazy loading, và lỗi N cộng một.", "Hôm nay: Lazy Loading & N+1.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ FetchType defaults and proxy
    dict(id="proxy", world=(1920, 1080), hud=hud("px", "FetchType mặc định và proxy", "Vật thế chỗ, chỉ load khi cần"), cam="".join([
        big_title("px", "Lazy", "Đặt vật thế chỗ, chỉ load khi cần"),
        box("px-d1", 160, 190, 740, 76, "<b>@ManyToOne · EAGER</b>", "amber", "card"),
        box("px-d2", 160, 280, 740, 76, "<b>@OneToOne · EAGER</b>", "amber", "card"),
        box("px-d3", 160, 370, 740, 76, "<b>@OneToMany · LAZY</b>", "green", "card"),
        box("px-d4", 160, 460, 740, 76, "<b>@ManyToMany · LAZY</b>", "green", "card"),
        gnode("px-ord", 1000, 250, 240, 90, "Order", "cyan"),
        gnode("px-cus", 1320, 190, 440, 90, "Customer$HibernateProxy", "violet"),
        gnode("px-bag", 1320, 310, 440, 90, "PersistentBag", "violet"),
        console("px-con", 1000, 430, 760, ["c.getId()   → 0 query", "c.getName() → 1 query"]),
        chip("px-e", 160, 610, "EAGER cũng N+1: findAll() 10 invoice = 11 query, không tắt được ở mức query", "red"),
        chip("px-l", 160, 690, "Mọi association LAZY, fetch theo từng use case", "green"),
        chip("px-r", 160, 770, "getReferenceById để gán khoá ngoại: 0 SELECT", "cyan"),
        chip("px-q", 160, 850, "Proxy là subclass: getClass() == Customer.class là false → equals dùng instanceof", "amber"),
        wires(trace("px-a", [(1240, 280), (1280, 280), (1280, 235), (1312, 235)], "violet", r=20),
              trace("px-b", [(1240, 310), (1280, 310), (1280, 355), (1312, 355)], "violet", r=20)),
    ]), beats=[
        ("Phần một: fetch type mặc định. Theo spec, phía một như Many To One và One To One là eager. Phía nhiều như One To Many là lazy.",
         "Phần 1: @ManyToOne, @OneToOne mặc định EAGER; @OneToMany, @ManyToMany mặc định LAZY.",
         [TYPE("#px-big", 0.1, 0.06), IN("#px-bsub", "blur", 0.8), OUT("#px-big, #px-bsub", "zoom", 3.6), IN("#px-hud", "left", 4.2),
          IN("#px-d1", "left", 4.8), IN("#px-d2", "left", 5.4), IN("#px-d3", "left", 7.0), IN("#px-d4", "left", 7.5)]),
        ("Lazy không load ngay, mà đặt vào một vật thế chỗ. Với to one là proxy, một subclass do Hibernate sinh ra, chỉ biết id. Với collection là Persistent Bag.",
         "LAZY đặt vật thế chỗ: to-one là proxy chỉ biết id, collection là PersistentBag.",
         [IN("#px-ord", "pop", 0.4), DRAW("#px-a-p", 3.0, 0.4), IN("#px-cus", "pop", 3.3), COMET("px-a", 3.6, 0.5), LIGHT("#px-cus", 4.1),
          DRAW("#px-b-p", 8.2, 0.4), IN("#px-bag", "pop", 8.5), COMET("px-b", 8.8, 0.5), LIGHT("#px-bag", 9.3)]),
        ("Gọi get id trên proxy không tốn query nào. Gọi get name mới chạy một câu select, và chỉ khi persistence context còn mở.",
         "c.getId(): 0 query. c.getName(): 1 query, khi persistence context còn mở.",
         [IN("#px-con", "up", 0.2, 0.4), IN("#px-con-1", "type1", 0.5, 0.3), IN("#px-con-2", "type1", 2.8, 0.3)]),
        ("Bẫy: eager cũng gây N cộng một. Find all mười invoice ra mười một query, và không tắt được ở mức query. Nên đặt mọi association là lazy, rồi fetch theo từng use case.",
         "EAGER cũng N+1: 10 invoice = 11 query. Mọi association LAZY, fetch theo use case.",
         [IN("#px-e", "left", 0.4), SHAKE("#px-e", 1.4), IN("#px-l", "left", 7.4)]),
        ("Thêm hai điểm. Get reference by id để gán khoá ngoại không tốn select nào. Và proxy là subclass, nên equals hãy dùng instance of.",
         "getReferenceById: 0 SELECT. Proxy là subclass: equals dùng instanceof.",
         [IN("#px-r", "left", 0.4), IN("#px-q", "left", 4.8)]),
    ]),
    # ------------------------------------------------------------ LazyInitializationException and OSIV
    dict(id="osiv", world=(1920, 1080), hud=hud("ov", "LazyInitializationException và OSIV", "Persistence context đã đóng"), cam="".join([
        gnode("ov-c", 160, 190, 380, 90, "Controller", "amber"),
        gnode("ov-s", 770, 190, 380, 90, "Service · tx", "violet"),
        gnode("ov-db", 1380, 190, 380, 90, "Database", "cyan"),
        console("ov-con", 160, 330, 1600, ["LazyInitializationException: failed to lazily initialize",
                                           "  a collection of role: demo.Order.items:", "  could not initialize proxy - no Session"]),
        box("ov-on", 160, 560, 780, 90, "<b>OSIV bật (mặc định) · 200 · body 3 · 2 query</b>", "amber", "card"),
        box("ov-off", 980, 560, 780, 90, "<b>open-in-view=false · exception</b>", "red", "card"),
        chip("ov-w", 160, 690, "Nên tắt: N+1 ẩn ngoài transaction · giữ connection cả request · che lỗi", "amber"),
        chip("ov-ok", 160, 770, "Sửa đúng: fetch đủ trong service (JOIN FETCH, @EntityGraph) hoặc map sang DTO", "green"),
        chip("ov-no", 160, 850, "Không: đổi sang EAGER · enable_lazy_load_no_trans · @Transactional lên controller", "red"),
        wires(trace("ov-a", [(540, 235), (762, 235)], "amber"), trace("ov-b", [(1150, 235), (1372, 235)], "violet")),
    ]), beats=[
        ("Phần hai: Lazy Initialization Exception. Lỗi này xảy ra khi chạm vào proxy hoặc collection lazy sau khi persistence context đã đóng.",
         "Phần 2: chạm vào proxy hoặc collection LAZY sau khi persistence context đóng.",
         [IN("#ov-hud", "left", 0.1), IN("#ov-c", "pop", 0.5), DRAW("#ov-a-p", 1.0, 0.4), IN("#ov-s", "pop", 1.3), DRAW("#ov-b-p", 1.8, 0.4),
          IN("#ov-db", "pop", 2.1), COMET("ov-a", 3.0, 0.5), LIGHT("#ov-s", 3.5), COMET("ov-b", 3.7, 0.5), LIGHT("#ov-db", 4.2),
          IN("#ov-con", "up", 6.0, 0.4), IN("#ov-con-1", "type1", 6.4, 0.3)]),
        ("Đọc message là biết ngay association nào: ở đây là Order chấm items, và không còn session.",
         "Đọc message là biết association nào: demo.Order.items, no Session.",
         [IN("#ov-con-2", "type1", 1.2, 0.3), IN("#ov-con-3", "type1", 3.6, 0.3)]),
        ("Open Session In View giữ Entity Manager mở suốt request, và Spring Boot bật nó mặc định. Cùng một controller: bật thì trả hai trăm với hai query, tắt thì ném exception.",
         "OSIV giữ EntityManager mở suốt request, bật mặc định. Bật: 200, 2 query. Tắt: exception.",
         [IN("#ov-on", "left", 5.6), IN("#ov-off", "right", 9.4), SHAKE("#ov-off", 10.2)]),
        ("Nên tắt nó: query lazy chạy ngầm ngoài transaction dễ thành N cộng một, connection bị giữ cả request, và lỗi bị che.",
         "Nên tắt: N+1 ẩn ngoài transaction, giữ connection cả request, che lỗi.",
         [IN("#ov-w", "left", 0.4)]),
        ("Cách sửa đúng là fetch đủ trong service, hoặc map sang DTO. Đừng đổi sang eager, đừng bật lazy load no trans, và đừng đặt Transactional lên controller.",
         "Fetch đủ trong service hoặc map DTO. Không EAGER, no_trans, @Transactional ở controller.",
         [IN("#ov-ok", "left", 0.4), IN("#ov-no", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ N+1 and four fixes
    dict(id="nplusone", world=(1920, 1080), hud=hud("np", "N+1 và bốn cách sửa", "10 order, đếm query"), cam="".join([
        console("np-con", 160, 190, 1100, ["select ... from orders o1_0", "select ... from order_item i1_0 where i1_0.order_id=?",
                                           "select ... from order_item i1_0 where i1_0.order_id=?", "... lặp 10 lần"]),
        chip("np-m1", 160, 470, "o.getItems().size() → 11 query", "red"),
        chip("np-m2", 160, 550, "o.getCustomer().getName() → 11 query", "red"),
        chip("np-t1", 160, 660, "Dev: logging.level.org.hibernate.SQL=DEBUG", "cyan"),
        chip("np-t2", 160, 740, "Test: Hibernate statistics, assert số query", "violet"),
        chip("np-t3", 160, 820, "Production: APM thấy hàng trăm span SQL", "amber"),
        bar("np-r0", 190, "Không sửa", 11, "red"),
        bar("np-r1", 280, "JOIN FETCH", 1, "green"),
        bar("np-r2", 370, "@EntityGraph", 1, "green"),
        bar("np-r3", 460, "batch_fetch_size=4", 4, "amber", "1 + 3 câu = any (?)"),
        bar("np-r4", 550, "batch_fetch_size=50", 2, "green", "1 + 1 câu = any (?)"),
        bar("np-r5", 640, "DTO projection", 1, "green", "chỉ lấy cột cần"),
        chip("np-h6", 160, 760, "Hibernate 6 không còn nhân bản order khi fetch collection", "violet"),
        chip("np-pj", 160, 840, "Dự án: batch size 50–100 · @EntityGraph màn chi tiết · DTO cho API danh sách", "green"),
    ]), beats=[
        ("Phần ba: N cộng một. Một query lấy danh sách cha, rồi N query nữa, mỗi query lấy association của một phần tử.",
         "Phần 3: 1 query lấy danh sách cha, rồi N query lấy association của từng phần tử.",
         [IN("#np-hud", "left", 0.1), IN("#np-con", "up", 0.4, 0.4), IN("#np-con-1", "type1", 1.0, 0.3),
          IN("#np-con-2", "type1", 3.6, 0.3), IN("#np-con-3", "type1", 4.4, 0.3), IN("#np-con-4", "type1", 5.2, 0.3)]),
        ("Đã đo với mười order: get items size ra mười một query. Get customer get name cũng mười một. Dấu hiệu là cùng một câu select lặp lại, chỉ khác tham số.",
         "10 order: getItems().size() 11 query, getCustomer().getName() cũng 11. Một câu lặp lại.",
         [IN("#np-m1", "left", 0.4), IN("#np-m2", "left", 3.6), PULSE("#np-con-2, #np-con-3", 7.4)]),
        ("Phát hiện bằng log SQL của Hibernate ở máy dev, đếm số query bằng Hibernate statistics trong test, và công cụ giám sát ở production.",
         "Phát hiện: log org.hibernate.SQL · statistics assert số query trong test · APM ở production.",
         [IN("#np-t1", "left", 0.4), IN("#np-t2", "left", 3.0), IN("#np-t3", "left", 6.4)]),
        ("Bốn cách sửa, đã đo. Không sửa là mười một query. Join Fetch còn một. Entity Graph cũng một.",
         "Không sửa: 11 query. JOIN FETCH: 1 query. @EntityGraph: 1 query.",
         [OUT("#np-con, #np-m1, #np-m2, #np-t1, #np-t2, #np-t3", "blur", 0, 0.45),
          IN("#np-r0-l", "fade", 0.6), IN("#np-r0-b", "left", 0.8, 0.7),
          IN("#np-r1-l", "fade", 2.6), IN("#np-r1-b", "pop", 2.9), IN("#np-r2-l", "fade", 4.4), IN("#np-r2-b", "pop", 4.7)]),
        ("Batch fetching gom nhiều id vào một câu. Cỡ batch bốn ra bốn query, cỡ năm mươi chỉ còn hai. DTO projection chỉ lấy cột cần, một query.",
         "Batch fetching: cỡ 4 ra 4 query, cỡ 50 ra 2 query. DTO projection: 1 query.",
         [IN("#np-r3-l", "fade", 2.4), IN("#np-r3-b", "left", 2.6), IN("#np-r3-n", "fade", 3.2),
          IN("#np-r4-l", "fade", 4.4), IN("#np-r4-b", "left", 4.6), IN("#np-r4-n", "fade", 5.2),
          IN("#np-r5-l", "fade", 6.6), IN("#np-r5-b", "pop", 6.8), IN("#np-r5-n", "fade", 7.4)]),
        ("Hibernate sáu không còn nhân bản order khi fetch collection. Ở dự án: batch size năm mươi đến một trăm làm lưới an toàn, Entity Graph cho màn chi tiết, DTO cho API danh sách.",
         "Dự án: batch size 50–100 làm lưới an toàn, @EntityGraph cho màn chi tiết, DTO cho API danh sách.",
         [IN("#np-h6", "left", 0.4), IN("#np-pj", "left", 4.0)]),
    ]),
    # ------------------------------------------------------------ JOIN FETCH traps
    dict(id="traps", world=(1920, 1080), hud=hud("tp", "JOIN FETCH: phân trang và nhiều collection", "Hai bẫy hay bị hỏi"), cam="".join([
        box("tp-code", 160, 190, 1100, 122, code('@Query("select o from Order o join fetch o.items")\nPage<Order> pageWithItems(Pageable p);'), "cyan", "code"),
        console("tp-con", 160, 350, 1600, ["WARN HHH90003004: firstResult/maxResults specified",
                                           "  with collection fetch; applying in memory",
                                           "select ... from orders o1_0 join order_item i1_0 ...   (không LIMIT)",
                                           "content=3, total=10"]),
        chip("tp-oom", 160, 640, "Production: kéo cả bảng lên RAM → OutOfMemoryError", "red"),
        chip("tp-fail", 160, 720, "Test: fail_on_pagination_over_collection_fetch=true", "amber"),
        chip("tp-fix", 160, 800, "Sửa: phân trang id trước, rồi fetch theo id · 3 query, 3 order 9 item, không WARN", "green"),
        box("tp-code2", 160, 190, 1300, 84, code("select o from Order o join fetch o.items join fetch o.payments"), "cyan", "code"),
        console("tp-con2", 160, 310, 1600, ["MultipleBagFetchException:", "  cannot simultaneously fetch multiple bags:",
                                            "  [demo.Order.items, demo.Order.payments]"]),
        box("tp-set", 160, 540, 1600, 90, "<b>Đổi sang Set: hết lỗi, nhưng tích Descartes còn · 50 × 20 = 1000 dòng cho một order</b>", "amber", "card"),
        chip("tp-q1", 160, 680, "Mỗi collection một query riêng, cùng transaction", "green"),
        chip("tp-q2", 160, 760, "Hoặc: một collection fetch join, collection kia batch fetching", "green"),
    ]), beats=[
        ("Phần bốn: hai cái bẫy của Join Fetch. Bẫy thứ nhất: fetch join một collection cùng với phân trang.",
         "Phần 4: bẫy 1, JOIN FETCH collection cùng Pageable.",
         [IN("#tp-hud", "left", 0.1), IN("#tp-code", "up", 3.0)]),
        ("Limit trên câu join sẽ cắt theo dòng order nhân item. Nên Hibernate bỏ limit, load hết rồi cắt trang trong bộ nhớ, kèm cảnh báo applying in memory.",
         "LIMIT cắt theo dòng join, nên Hibernate bỏ LIMIT và cắt trang trong memory: HHH90003004.",
         [IN("#tp-con", "up", 0.3, 0.4), IN("#tp-con-3", "type1", 4.0, 0.3), IN("#tp-con-1", "type1", 7.2, 0.3), IN("#tp-con-2", "type1", 8.0, 0.3)]),
        ("Kết quả vẫn đúng: ba order, tổng mười. Nhưng ở production, cả bảng bị kéo lên RAM, dễ tràn bộ nhớ. Ở môi trường test, hãy bật fail on pagination over collection fetch.",
         "Vẫn đúng content=3, total=10, nhưng production dễ OutOfMemoryError. Ở test: bật fail_on_pagination.",
         [IN("#tp-con-4", "type1", 0.4, 0.3), IN("#tp-oom", "left", 3.4), SHAKE("#tp-oom", 4.4), IN("#tp-fail", "left", 7.2)]),
        ("Cách sửa: phân trang trên id trước, rồi fetch join theo danh sách id. Đã đo: ba query, ba order chín item, không còn cảnh báo.",
         "Sửa: phân trang id trước, rồi fetch theo id: 3 query, 3 order 9 item, không WARN.",
         [IN("#tp-fix", "left", 0.4)]),
        ("Bẫy thứ hai: fetch join hai collection kiểu List cùng lúc thì bị ném lỗi Multiple Bag Fetch Exception.",
         "Bẫy 2: fetch join hai List cùng lúc thì ném MultipleBagFetchException.",
         [OUT("#tp-code, #tp-con, #tp-oom, #tp-fail, #tp-fix", "blur", 0, 0.45), IN("#tp-code2", "up", 0.6),
          IN("#tp-con2", "up", 2.6, 0.4), IN("#tp-con2-1", "type1", 3.0, 0.3), IN("#tp-con2-2", "type1", 3.6, 0.3), IN("#tp-con2-3", "type1", 4.2, 0.3)]),
        ("Đổi sang Set thì hết lỗi, nhưng tích Descartes vẫn còn: năm mươi item nhân hai mươi payment là một nghìn dòng cho một order.",
         "Đổi sang Set hết lỗi, nhưng tích Descartes còn: 50 × 20 = 1000 dòng cho một order.",
         [IN("#tp-set", "left", 0.4)]),
        ("Nên fetch từng collection bằng query riêng trong cùng transaction, hoặc fetch join một cái, cái kia để batch fetching.",
         "Sửa: mỗi collection một query riêng, hoặc fetch join một cái, cái kia batch fetching.",
         [IN("#tp-q1", "left", 0.4), IN("#tp-q2", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("shield", "Mọi association LAZY", "EAGER cũng N+1"),
                                                ("lock", "Tắt OSIV", "fetch đủ trong service"),
                                                ("grid", "N+1: 11 → 1", "JOIN FETCH, EntityGraph, DTO"),
                                                ("split", "Phân trang", "id trước, fetch sau")]),
        chip("ou-next", 695, 650, "Bài tiếp: Locking, Batch & Mapping", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: đặt mọi association là lazy. Tắt Open Session In View, fetch đủ trong service. Sửa N cộng một bằng join fetch, entity graph hoặc DTO. Và phân trang trên id trước khi fetch collection.",
         "Mọi association LAZY · tắt OSIV · N+1: 11 → 1 query · phân trang id trước khi fetch.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.6), IN("#ou-c3", "pop", 10.4)]),
        ("Bài tiếp: locking, batch, và mapping.", "Bài tiếp: Locking, Batch & Mapping.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
