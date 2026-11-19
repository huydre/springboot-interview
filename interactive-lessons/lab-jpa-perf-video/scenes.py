"""Lab 6 (N+1, Locking & Index) explainer: scene layouts and per-beat narration + motion.

Numbers come from study note 11.06 on order-service (Spring Boot 3.5.16, Hibernate 6.6, JDK 21, PostgreSQL 16 via Testcontainers):
GET /orders with 10 orders x 3 lines on 5 products: NAIVE 16 statements = 1 + 10 + 5, JOIN_FETCH 1, ENTITY_GRAPH 1 (same SQL),
NAIVE + default_batch_fetch_size=50 -> 3 (= any (?)); counted with Statistics.getPrepareStatementCount().
Two threads, stock 10, CyclicBarrier outside the transactions: @Version -> 1 committed + ObjectOptimisticLockingFailureException
(cause StaleObjectStateException), stock 9; decreaseStockAtomically (stock >= ?) -> stock 8; 20 threads, stock 10 -> 10 succeed, stock 0.
100,000 orders (60% PAID), query "PAID orders of customer 42, newest first, limit 20": no index Seq Scan 846 pages 5.2-6.0 ms;
(customer_id) Bitmap scan, status stays a Filter, 98 pages, 0.10-0.25 ms; (customer_id, status, created_at) Index Scan Backward,
no Sort, 23 pages, 0.027-0.082 ms. Theme: mono. No Java output is shown that was not already in the note (no Docker re-run).
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Lab 6 · order-service", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Đoán trước, chạy, rồi so sánh"), "h1 center r"),
        console("hk-con", 460, 420, 1000, ["GET /orders: ? câu SQL", "2 thread cùng trừ kho 10: stock = ?", "Query 100 000 đơn: ? page"]),
        chip("hk-p1", 330, 470, "1. Đoán", "amber"), chip("hk-p2", 760, 470, "2. Chạy", "cyan"), chip("hk-p3", 1190, 470, "3. So sánh", "green"),
        tile("hk-tile", 400, 350, 220, "tree"),
        el("hk-word", 670, 380, 1200, None, letters("N+1, Locking & Index"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Hibernate statistics · @Version · EXPLAIN ANALYZE", "kin-sub r"),
    ]), beats=[
        ("Ba câu hỏi hay gặp ở tầng J P A. Gọi một API thì chạy bao nhiêu câu SQL? Hai người cùng trừ kho thì còn bao nhiêu? Và index đổi plan ra sao?",
         "Gọi API chạy bao nhiêu câu SQL? Hai người cùng trừ kho còn bao nhiêu? Index đổi plan ra sao?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-con", "up", 3.0, 0.4), IN("#hk-con-1", "type1", 3.3, 0.3), IN("#hk-con-2", "type1", 5.5, 0.3), IN("#hk-con-3", "type1", 8.0, 0.3)]),
        ("Bài lab này làm theo một vòng: đoán trước, chạy thật, rồi so sánh với số đo.",
         "Một vòng: đoán trước, chạy thật, so sánh với số đo.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-p1", "pop", 0.8), IN("#hk-p2", "pop", 2.4), IN("#hk-p3", "pop", 4.0)]),
        ("Lab sáu: N cộng một, locking, và index.", "Lab 6: N+1, Locking & Index.",
         [OUT("#hk-p1, #hk-p2, #hk-p3", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.8)]),
    ]),
    # ------------------------------------------------------------ N+1
    dict(id="nplusone", world=(1920, 1080), hud=hud("np", "N+1 ở GET /orders", "Đếm bằng statistics, không đếm bằng mắt"), cam="".join([
        el("np-q", 160, 190, 1600, None, "Seed 10 đơn × 3 dòng hàng, 5 sản phẩm. Đoán: GET /orders ngây thơ chạy bao nhiêu câu SQL?", "note left r"),
        box("np-r1", 160, 300, 1600, 80, "<b>NAIVE: 16 câu = 1 + 10 + 5</b>", "red", "card"),
        chip("np-a", 160, 400, "1 câu: danh sách đơn", "cyan"), chip("np-b", 700, 400, "10 câu: dòng hàng mỗi đơn", "amber"), chip("np-c", 1300, 400, "5 câu: product", "violet"),
        box("np-r2", 160, 500, 1600, 80, "<b>JOIN FETCH: 1 câu</b>", "green", "card"),
        box("np-r3", 160, 600, 1600, 80, "<b>@EntityGraph: 1 câu, cùng một câu SQL</b>", "green", "card"),
        box("np-r4", 160, 700, 1600, 80, "<b>NAIVE + batch size 50: 3 câu, dùng = any (?)</b>", "violet", "card"),
        box("np-code", 160, 810, 1600, 150, code("stats.clear();\nmvc.perform(get(\"/orders\"));\nlong count = stats.getPrepareStatementCount();"), "cyan", "code"),
    ]), beats=[
        ("Phần một: N cộng một ở GET orders. Seed mười đơn, mỗi đơn ba dòng hàng, trên năm sản phẩm. Hãy đoán trước: bản ngây thơ chạy bao nhiêu câu SQL?",
         "Phần 1: 10 đơn × 3 dòng, 5 sản phẩm. Đoán trước: bản ngây thơ chạy bao nhiêu câu SQL?",
         [IN("#np-hud", "left", 0.1), IN("#np-q", "up", 0.5)]),
        ("Chạy thật thì ra mười sáu câu. Một câu lấy danh sách đơn, mười câu lấy dòng hàng của từng đơn, và năm câu lấy sản phẩm. Thêm một cấp quan hệ là thêm một nhóm query.",
         "Đo được 16 câu = 1 + 10 + 5. Thêm một cấp quan hệ là thêm một nhóm query.",
         [IN("#np-r1", "left", 0.4, 0.7), IN("#np-a", "pop", 3.0), IN("#np-b", "pop", 6.0), IN("#np-c", "pop", 9.0)]),
        ("Sửa bằng Join Fetch hay Entity Graph đều còn đúng một câu. Hai cách này sinh cùng một câu SQL, chỉ khác cách viết.",
         "JOIN FETCH và @EntityGraph: 1 câu, cùng một câu SQL, khác cách viết.",
         [IN("#np-r2", "left", 0.4), IN("#np-r3", "left", 3.8)]),
        ("Cách thứ ba là batch fetch size năm mươi, không cần sửa code gọi. Còn ba câu, vì mỗi cấp quan hệ chỉ cần một câu.",
         "default_batch_fetch_size=50: còn 3 câu, số query theo số cấp quan hệ.",
         [IN("#np-r4", "left", 0.4)]),
        ("Còn đếm bằng gì để assert được? Bật Hibernate statistics, clear trước request, rồi đọc số statement.",
         "Bật generate_statistics, stats.clear(), rồi assert getPrepareStatementCount().",
         [IN("#np-code", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ locking
    dict(id="locking", world=(1920, 1080), hud=hud("lk", "Hai thread cùng trừ kho", "@Version và UPDATE nguyên tử"), cam="".join([
        gnode("lk-a", 160, 190, 420, 90, "Thread A: đọc stock 10", "amber"),
        gnode("lk-b", 160, 310, 420, 90, "Thread B: đọc stock 10", "amber"),
        gnode("lk-bar", 740, 230, 420, 130, "CyclicBarrier", "violet"),
        gnode("lk-db", 1340, 230, 420, 130, "Mỗi bên trừ 1", "cyan"),
        wires(trace("lk-w1", [(580, 235), (660, 235), (660, 270), (740, 270)], "amber"),
              trace("lk-w2", [(580, 355), (660, 355), (660, 320), (740, 320)], "amber"),
              trace("lk-w3", [(1160, 295), (1340, 295)], "violet")),
        box("lk-r1", 160, 450, 1600, 80, "<b>@Version: 1 commit, 1 ObjectOptimisticLockingFailureException · stock 9</b>", "amber", "card"),
        box("lk-r2", 160, 550, 1600, 80, "<b>UPDATE ... stock >= ?: cả 2 thành công · stock 8</b>", "green", "card"),
        box("lk-r3", 160, 650, 1600, 80, "<b>20 thread, kho còn 10: đúng 10 thành công · stock 0, không âm</b>", "green", "card"),
        chip("lk-trap", 160, 780, "Bẫy: barrier trong transaction, pool 10 connection cạn, test treo", "red"),
        chip("lk-pick", 160, 870, "Tranh chấp cao: UPDATE nguyên tử · @Version hợp form sửa thông tin", "violet"),
    ]), beats=[
        ("Phần hai: hai thread cùng trừ kho. Sản phẩm còn mười cái. Hai thread cùng đọc, chờ nhau ở một barrier, rồi mỗi bên trừ một. Hãy đoán kho còn bao nhiêu.",
         "Kho còn 10. Hai thread cùng đọc, chờ nhau ở CyclicBarrier, rồi mỗi bên trừ 1. Còn bao nhiêu?",
         [IN("#lk-hud", "left", 0.1), IN("#lk-a", "pop", 1.0), IN("#lk-b", "pop", 2.0), DRAW("#lk-w1-p", 3.6, 0.5), DRAW("#lk-w2-p", 3.6, 0.5),
          IN("#lk-bar", "pop", 4.2), DRAW("#lk-w3-p", 6.0, 0.5), IN("#lk-db", "pop", 6.6)]),
        ("Với Version, một bên thắng. Bên kia nhận lỗi Optimistic Locking Failure. Kho còn chín: không mất lượt mua nào một cách im lặng, nhưng bên thua phải thử lại hoặc báo lỗi.",
         "@Version: 1 bên commit, bên kia nhận ObjectOptimisticLockingFailureException, stock 9.",
         [IN("#lk-r1", "left", 0.4, 0.7)]),
        ("Câu update nguyên tử có điều kiện stock lớn hơn hoặc bằng số mua. Database tự khoá dòng rồi tính lại, nên cả hai thread thành công, kho còn tám.",
         "UPDATE ... where stock >= ?: DB khoá dòng, cả 2 thành công, stock 8.",
         [IN("#lk-r2", "left", 0.4)]),
        ("Hai mươi thread cùng mua khi chỉ còn mười cái: đúng mười thread thành công, kho về không, không bao giờ âm.",
         "20 thread, kho còn 10: đúng 10 thành công, stock 0, không âm.",
         [IN("#lk-r3", "left", 0.4)]),
        ("Một bẫy đã gặp: đặt barrier bên trong transaction. Mỗi thread giữ connection rồi chờ nhau, pool chỉ có mười connection nên cạn và test treo.",
         "Barrier trong transaction: mỗi thread giữ connection rồi chờ nhau, cạn pool, test treo.",
         [IN("#lk-trap", "left", 0.4), SHAKE("#lk-trap", 1.4)]),
        ("Khi tranh chấp cao, chọn update nguyên tử. Version hợp hơn với form sửa thông tin, như hai admin cùng sửa một sản phẩm.",
         "Tranh chấp cao: UPDATE nguyên tử. @Version hợp với form sửa thông tin.",
         [IN("#lk-pick", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ explain
    dict(id="explain", world=(1920, 1080), hud=hud("ex", "100 000 đơn và composite index", "Đọc plan trước và sau"), cam="".join([
        el("ex-q", 160, 190, 1600, None, "Query: đơn PAID của khách 42, mới nhất trước, 20 dòng · 100 000 đơn", "note left r"),
        box("ex-s1", 160, 290, 1600, 90, "<b>Không index: Seq Scan + Sort · 846 page · 5,2–6,0 ms</b>", "red", "card"),
        box("ex-s2", 160, 400, 1600, 90, "<b>(customer_id): Bitmap scan, status là Filter · 98 page · 0,10–0,25 ms</b>", "amber", "card"),
        box("ex-s3", 160, 510, 1600, 90, "<b>Composite: Index Scan Backward, không Sort · 23 page · 0,027–0,082 ms</b>", "green", "card"),
        chip("ex-c1", 160, 650, "Ít hơn khoảng 37 lần số page so với Seq Scan", "green"),
        chip("ex-c2", 160, 730, "Cột = đặt trước (customer_id, status), cột sort đặt sau (created_at)", "violet"),
        chip("ex-c3", 160, 810, "So tỉ lệ và hình plan, đừng so mili giây giữa các máy", "amber"),
        chip("ex-c4", 160, 890, "Khai báo trên entity: @Table(indexes = @Index(...))", "cyan"),
    ]), beats=[
        ("Phần ba: một trăm nghìn đơn và composite index. Query là đơn đã thanh toán của một khách, mới nhất trước, hai mươi dòng. Hãy đoán plan trước khi chạy.",
         "Phần 3: đơn PAID của một khách, mới nhất trước, 20 dòng, trên 100 000 đơn. Đoán plan trước khi chạy.",
         [IN("#ex-hud", "left", 0.1), IN("#ex-q", "up", 0.5)]),
        ("Không có index: sequential scan đọc cả bảng, tám trăm bốn mươi sáu page, khoảng năm đến sáu mili giây, rồi còn phải sắp xếp.",
         "Không index: Seq Scan đọc cả bảng, 846 page, 5,2–6,0 ms, rồi phải sắp xếp (Sort).",
         [IN("#ex-s1", "left", 0.4, 0.7)]),
        ("Index chỉ trên customer id: bitmap scan, còn chín mươi tám page. Nhưng status vẫn chỉ là filter, lọc sau khi đã lấy dòng, và vẫn phải sort.",
         "Index (customer_id): 98 page, nhưng status vẫn là Filter, vẫn Sort.",
         [IN("#ex-s2", "left", 0.4, 0.7)]),
        ("Composite index customer id, status, created at: index scan backward, không còn sort, chỉ hai mươi ba page. Cả hai điều kiện đều là index cond.",
         "Composite: Index Scan Backward, không Sort, 23 page, cả hai điều kiện là Index Cond.",
         [IN("#ex-s3", "left", 0.4, 0.7), IN("#ex-c1", "left", 8.0)]),
        ("Cột so sánh bằng đặt trước, cột sắp xếp đặt sau. Và hãy so tỉ lệ cùng hình dạng kế hoạch, đừng so thời gian giữa các máy.",
         "Cột = trước, cột sắp xếp sau. So tỉ lệ và hình dạng kế hoạch, đừng so thời gian.",
         [IN("#ex-c2", "left", 0.4), IN("#ex-c3", "left", 4.4)]),
        ("Khai báo index ngay trên entity, để Hibernate tự tạo khi chạy test.",
         "Khai báo index ngay trên entity bằng @Table(indexes = ...).",
         [IN("#ex-c4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ checklist
    dict(id="checklist", world=(1920, 1080), hud=hud("ck", "Checklist hoàn thành", "Mỗi bài một dòng trong nhật ký"), cam="".join([
        box("ck-r1", 160, 190, 1600, 80, "<b>Log SQL và statistics: getPrepareStatementCount()</b>", "cyan", "card"),
        box("ck-r2", 160, 290, 1600, 80, "<b>N+1: 16 → 1 → 1 → 3 câu</b>", "green", "card"),
        box("ck-r3", 160, 390, 1600, 80, "<b>Trừ kho: stock 9 · 8 · 0</b>", "green", "card"),
        box("ck-r4", 160, 490, 1600, 80, "<b>Index: 846 → 98 → 23 page, node Sort biến mất</b>", "green", "card"),
        box("ck-r5", 160, 590, 1600, 80, "<b>Việc cuối: EXPLAIN ANALYZE query chậm nhất trong slow log</b>", "violet", "card"),
        chip("ck-t1", 160, 740, "Mỗi bài: đoán trước, chạy, so sánh với số đo", "amber"),
        chip("ck-t2", 160, 820, "Trả lời to 5 câu phỏng vấn, có số liệu của mình", "cyan"),
    ]), beats=[
        ("Phần bốn: checklist hoàn thành. Bật được log SQL và statistics, rồi ghi vào nhật ký ba bảng số liệu.",
         "Phần 4: bật log SQL và statistics, ghi ba bảng số liệu vào nhật ký.",
         [IN("#ck-hud", "left", 0.1), IN("#ck-r1", "left", 0.5)]),
        ("Mười sáu, một, một, ba câu SQL. Kho chín, tám, không. Page tám trăm bốn mươi sáu, chín mươi tám, hai mươi ba.",
         "16 → 1 → 1 → 3 câu · stock 9, 8, 0 · 846 → 98 → 23 page.",
         [IN("#ck-r2", "left", 0.4), IN("#ck-r3", "left", 3.2), IN("#ck-r4", "left", 5.8)]),
        ("Việc cuối: chạy explain analyze cho query chậm nhất trong slow log của dự án thật, và trả lời to năm câu phỏng vấn bằng số liệu của chính mình.",
         "EXPLAIN ANALYZE query chậm nhất trong slow log; trả lời to 5 câu phỏng vấn.",
         [IN("#ck-r5", "left", 0.4), IN("#ck-t1", "left", 4.0), IN("#ck-t2", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 3 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 440, 280, 40, [("share", "N+1", "16 câu còn 1 câu"),
                                                ("lock", "Trừ kho", "stock 9, 8, 0"),
                                                ("tree", "Index", "846 page còn 23")]),
        chip("ou-next", 660, 650, "Bài tiếp: Lab 7 JWT, Cache & Tests", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: đếm statement để thấy N cộng một, và sửa còn một câu. Trừ kho thì dùng Version hoặc update nguyên tử. Index đúng thứ tự cột kéo plan từ tám trăm page xuống hai mươi ba.",
         "Đếm statement: 16 câu còn 1 · Version hoặc UPDATE nguyên tử · composite index: 846 page còn 23.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.5), IN("#ou-c2", "pop", 8.5)]),
        ("Bài tiếp: Lab bảy, token đăng nhập, cache và test.", "Bài tiếp: Lab 7, token đăng nhập, cache và test.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
