"""Lab 4 order-service Setup explainer: scene layouts and per-beat narration + motion.

Numbers and outputs come from the lesson web/src/data/lessons/lab-order-setup.ts and study note 11.04 (real runs of labs/order-service/,
Spring Boot 3.5.16, JDK 21, PostgreSQL 16 via Docker): POST /orders 2 Keyboard -> 201, Location /orders/1, total 200.00, Keyboard stock 10 -> 8;
422 for 2 Keyboard + 5 Monitor (Monitor stock 1) leaves Keyboard stock at 8 (rollback); 400 errors "customerId: must not be null" and
"items[0].quantity: must be greater than or equal to 1"; 404 "Order 999 not found"; 422 "Product 2 has only 1 in stock, requested 5" code
INSUFFICIENT_STOCK; /actuator/health 200 UP (db PostgreSQL), /actuator/health/liveness UP, /actuator/env 404; "Port 8080 was already in use"
-> --server.port=8088; TIMED log placeOrder 48 ms (ok), 3 ms (ResourceNotFoundException), 44 ms (InsufficientStockException),
findAll() 99 ms (ok), 2-3 ms after warm-up; Condition Evaluation Report lines from the note. No Java is shown with computed output, nothing re-run.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Đoán trước, chạy thật, so sánh", "eyebrow r"),
        el("hk-q", 0, 220, 1920, None, letters("Kho Keyboard sau request 422 còn bao nhiêu?"), "h1 center r"),
        console("hk-con", 360, 400, 1200, ["POST /orders  ·  2 Keyboard + 5 Monitor", "Kho Monitor chỉ còn 1  →  422 INSUFFICIENT_STOCK", "Kho Keyboard trước request: 8"]),
        box("hk-o0", 360, 660, 240, 90, "<b>6</b>", "violet", "card"), box("hk-o1", 680, 660, 240, 90, "<b>8</b>", "green", "card"),
        box("hk-o2", 1000, 660, 240, 90, "<b>10</b>", "violet", "card"), box("hk-o3", 1320, 660, 240, 90, "<b>0</b>", "violet", "card"),
        el("hk-ans", 360, 800, 1200, None, "Vẫn là 8: transaction rollback", "note left r"),
        tile("hk-tile", 330, 350, 220, "box"),
        el("hk-word", 600, 380, 1300, None, letters("order-service"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Lab 4 · entity · ProblemDetail · Actuator · @Timed", "kin-sub r"),
    ]), beats=[
        ("Đặt hai Keyboard và năm Monitor, nhưng kho Monitor chỉ còn một. Hãy đoán: kho Keyboard sau request đó còn bao nhiêu? Trước đó là tám.",
         "Đặt 2 Keyboard và 5 Monitor, kho Monitor còn 1. Kho Keyboard còn bao nhiêu?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-con", "up", 2.6, 0.4), IN("#hk-con-1", "type1", 3.0, 0.3), IN("#hk-con-2", "type1", 4.2, 0.3),
          IN("#hk-con-3", "type1", 5.2, 0.3), IN("#hk-o0", "pop", 5.6), IN("#hk-o1", "pop", 5.9), IN("#hk-o2", "pop", 6.2), IN("#hk-o3", "pop", 6.5)]),
        ("Đã đo trên Postgres: vẫn là tám. Dòng Keyboard bị trừ trong bộ nhớ, nhưng transaction rollback nên không có gì được lưu.",
         "Đã đo trên PostgreSQL: vẫn là 8. Dòng Keyboard bị trừ trong bộ nhớ nhưng transaction rollback.",
         [DIM("#hk-o0, #hk-o2, #hk-o3", 0.3, 0.2), PULSE("#hk-o1", 0.5), IN("#hk-ans", "up", 1.5)]),
        ("Hôm nay ta dựng order-service, project dùng cho các lab sau.", "Hôm nay: dựng order-service.",
         [OUT("#hk-eye, #hk-q, #hk-con, #hk-o0, #hk-o1, #hk-o2, #hk-o3, #hk-ans", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ project
    dict(id="project", world=(1920, 1080), hud=hud("pj", "Project, entity và API tạo đơn", "Package theo tính năng"), cam="".join([
        box("pj-p0", 160, 190, 240, 80, "<b>common</b>", "violet", "card"), box("pj-p1", 420, 190, 240, 80, "<b>customer</b>", "violet", "card"),
        box("pj-p2", 680, 190, 240, 80, "<b>product</b>", "violet", "card"), box("pj-p3", 940, 190, 240, 80, "<b>order</b>", "violet", "card"),
        box("pj-p4", 1200, 190, 240, 80, "<b>audit</b>", "violet", "card"), box("pj-p5", 1460, 190, 300, 80, "<b>notification</b>", "violet", "card"),
        gnode("pj-a", 160, 350, 360, 100, "POST /orders", "cyan"), gnode("pj-b", 620, 350, 560, 100, "OrderService · @Transactional", "violet"),
        gnode("pj-c", 1280, 350, 360, 100, "PostgreSQL 16", "green"),
        wires(trace("pj-x", [(520, 400), (612, 400)], "cyan"), trace("pj-y", [(1180, 400), (1272, 400)], "violet")),
        console("pj-con", 160, 520, 1600, ["201 Created  ·  Location: /orders/1", "total 200.00  ·  status CREATED", "Kho Keyboard: 10  →  8"]),
        chip("pj-c1", 160, 760, "id SEQUENCE, increment by 50: IDENTITY tắt batch insert, mà Lab 6 cần seed nhiều", "amber"),
        chip("pj-c2", 160, 840, "Trả thẳng entity Order: Jackson chạm LAZY ngoài transaction → LazyInitializationException", "red"),
    ]), beats=[
        ("Phần một: project, entity và API tạo đơn. Tự viết pom với parent Spring Boot ba chấm năm, và chia package theo tính năng, không chia theo tầng.",
         "Phần 1: Spring Boot 3.5, package chia theo tính năng, không theo tầng.",
         [IN("#pj-hud", "left", 0.1), IN("#pj-p0", "pop", 5.0), IN("#pj-p1", "pop", 5.4), IN("#pj-p2", "pop", 5.8), IN("#pj-p3", "pop", 6.2), IN("#pj-p4", "pop", 6.6), IN("#pj-p5", "pop", 7.0)]),
        ("Bốn entity, quan hệ lazy, và controller chỉ trả record, không trả entity. Hãy đoán: gọi post orders với hai Keyboard thì nhận được gì?",
         "4 entity, quan hệ LAZY, controller trả record. Đoán: POST /orders 2 Keyboard nhận gì?",
         [IN("#pj-a", "pop", 5.0), DRAW("#pj-x-p", 6.0, 0.4), IN("#pj-b", "pop", 6.4), DRAW("#pj-y-p", 7.4, 0.4), IN("#pj-c", "pop", 7.8), LIGHT("#pj-c", 8.2)]),
        ("Chạy thật: trả về hai không một, header Location là orders một, tổng tiền hai trăm, và kho Keyboard từ mười xuống tám.",
         "Chạy thật: 201, Location /orders/1, total 200.00, kho Keyboard 10 → 8.",
         [IN("#pj-con", "up", 0.3, 0.4), IN("#pj-con-1", "type1", 0.8, 0.3), IN("#pj-con-2", "type1", 3.4, 0.3), IN("#pj-con-3", "type1", 5.2, 0.3)]),
        ("Id dùng sequence, tăng năm mươi mỗi lần, vì identity tắt batch insert, mà lab sáu cần seed nhiều đơn.",
         "SEQUENCE increment 50: IDENTITY tắt batch insert, Lab 6 cần seed nhiều.", [IN("#pj-c1", "left", 0.4)]),
        ("Bẫy phỏng vấn: trả thẳng entity ra JSON khi open in view tắt. Jackson chạm vào quan hệ lazy ngoài transaction, và ném Lazy Initialization Exception.",
         "Bẫy: trả thẳng entity → LazyInitializationException.", [IN("#pj-c2", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ errors
    dict(id="errors", world=(1920, 1080), hud=hud("er", "Validation, ProblemDetail", "Profile và Actuator"), cam="".join([
        box("er-k0", 160, 190, 480, 100, "<b>400</b><br>request sai ràng buộc", "amber", "card"), box("er-k1", 720, 190, 480, 100, "<b>404</b><br>không tìm thấy", "cyan", "card"),
        box("er-k2", 1280, 190, 480, 100, "<b>422</b><br>vi phạm nghiệp vụ", "red", "card"),
        console("er-con", 160, 350, 1600, ["400  Validation failed  ·  customerId: must not be null", "400  items[0].quantity: must be greater than or equal to 1",
                                          "404  Order 999 not found", "422  Product 2 has only 1 in stock, requested 5  ·  code: INSUFFICIENT_STOCK"]),
        chip("er-c1", 160, 640, "400: sai định dạng hoặc ràng buộc · 422: request đúng nhưng nghiệp vụ không cho, kèm code", "violet"),
        chip("er-c2", 160, 720, "POST /products sai cả 3 field: một response 400 chứa 3 lỗi", "cyan"),
        console("er-ac", 160, 230, 1600, ["GET /actuator/health            200  UP  ·  db: PostgreSQL", "GET /actuator/health/liveness  200  UP", "GET /actuator/env               404  endpoint không expose"]),
        chip("er-d1", 160, 470, "application.yml chung · application-dev.yml trỏ PostgreSQL · application-test.yml cho test", "violet"),
        chip("er-d2", 160, 550, "Actuator chỉ expose health và info, bật probes liveness và readiness", "green"),
        chip("er-d3", 160, 630, "Port 8080 was already in use → chạy với --server.port=8088", "amber"),
    ]), beats=[
        ("Phần hai: validation và Problem Detail. Có ba loại lỗi. Bốn trăm là request sai ràng buộc, bốn trăm linh bốn là không tìm thấy, hai trăm hai mươi hai là vi phạm nghiệp vụ.",
         "Phần 2: 400 sai ràng buộc, 404 không tìm thấy, 422 vi phạm nghiệp vụ.",
         [IN("#er-hud", "left", 0.1), IN("#er-k0", "pop", 4.2), IN("#er-k1", "pop", 6.6), IN("#er-k2", "pop", 8.6)]),
        ("Body thật đo được: bốn trăm liệt kê từng field lỗi. Bốn trăm linh bốn nói rõ order chín trăm chín mươi chín không tồn tại. Hai trăm hai mươi hai nói kho chỉ còn một, kèm mã insufficient stock.",
         "Body thật: 400 liệt kê field lỗi, 404 nói rõ id, 422 kèm code INSUFFICIENT_STOCK.",
         [IN("#er-con", "up", 0.3, 0.4), IN("#er-con-1", "type1", 0.8, 0.3), IN("#er-con-2", "type1", 3.4, 0.3), IN("#er-con-3", "type1", 6.4, 0.3), IN("#er-con-4", "type1", 9.0, 0.3)]),
        ("Hai trăm hai mươi hai kèm code, để client xử lý theo mã. Và product sai cả ba field thì nhận về ba lỗi trong một response.",
         "422 kèm code để client xử lý. Product sai 3 field: 3 lỗi trong một response.",
         [IN("#er-c1", "left", 0.4), IN("#er-c2", "left", 5.4)]),
        ("Giờ đến profile và Actuator. Có file chung, file dev trỏ Postgres, và file cho test. Actuator chỉ mở health và info.",
         "Profile: chung, dev, test. Actuator chỉ expose health và info.",
         [OUT("#er-k0, #er-k1, #er-k2, #er-con, #er-c1, #er-c2", "blur", 0, 0.45), IN("#er-d1", "left", 1.2), IN("#er-d2", "left", 5.0)]),
        ("Đã đo: health trả hai trăm, liveness cũng trả hai trăm, còn env trả bốn trăm linh bốn. Lần đầu còn gặp cổng tám không tám không đã bị dùng, nên đổi sang cổng tám không tám tám.",
         "health 200, liveness 200, env 404. Port 8080 đã dùng: --server.port=8088.",
         [IN("#er-ac", "up", 0.3, 0.4), IN("#er-ac-1", "type1", 0.8, 0.3), IN("#er-ac-2", "type1", 3.2, 0.3), IN("#er-ac-3", "type1", 4.6, 0.3), IN("#er-d3", "left", 7.0)]),
    ]),
    # ------------------------------------------------------------ timed
    dict(id="timed", world=(1920, 1080), hud=hud("tm", "@Timed và Condition Evaluation Report", "Đo, rồi đọc vì sao"), cam="".join([
        console("tm-con", 160, 190, 1600, ["TIMED OrderService.placeOrder(..) took 48 ms (ok)", "TIMED OrderService.placeOrder(..) took 3 ms (ResourceNotFoundException)",
                                          "TIMED OrderService.placeOrder(..) took 44 ms (InsufficientStockException)", "TIMED ProductService.findAll() took 99 ms (ok)"]),
        chip("tm-c1", 160, 470, "Lần đầu chậm: JIT, query plan, pool mở connection · sau warm-up chỉ còn 2–3 ms", "amber"),
        chip("tm-c2", 160, 550, "Đo nghiêm túc: Micrometer, xem p95, p99, không dựa vào một lần log", "green"),
        chip("tm-c3", 160, 630, "Gọi this.placeOrder() trong cùng class không được đo: self-invocation", "red"),
        box("tm-r0", 160, 190, 380, 110, "<b>Positive matches</b>", "green", "card"), box("tm-r1", 580, 190, 380, 110, "<b>Negative matches</b>", "red", "card"),
        box("tm-r2", 1000, 190, 380, 110, "<b>Exclusions</b>", "amber", "card"), box("tm-r3", 1420, 190, 340, 110, "<b>Unconditional</b>", "violet", "card"),
        chip("tm-d1", 160, 380, "DataSourceAutoConfiguration matched: có JDBC trên classpath nên tạo DataSource", "green"),
        chip("tm-d2", 160, 460, "H2ConsoleAutoConfiguration không chạy: thiếu class JakartaWebServlet", "red"),
        chip("tm-d3", 160, 540, "ProblemDetailsErrorHandlingConfiguration không chạy: thiếu property problemdetails.enabled", "amber"),
        chip("tm-d4", 160, 620, "CglibAutoProxyConfiguration matched → TimingAspect bọc được class không có interface", "cyan"),
    ]), beats=[
        ("Phần ba: aspect Timed. Gọi lần lượt bốn lần, đây là nhật ký thật. Tạo đơn bốn mươi tám mili giây, đơn không tồn tại ba mili giây, đơn hết hàng bốn mươi bốn, và find all chín mươi chín.",
         "Phần 3: log thật: 48 ms, 3 ms, 44 ms, và findAll() 99 ms.",
         [IN("#tm-hud", "left", 0.1), IN("#tm-con", "up", 0.5, 0.4), IN("#tm-con-1", "type1", 4.4, 0.3), IN("#tm-con-2", "type1", 6.2, 0.3), IN("#tm-con-3", "type1", 8.6, 0.3), IN("#tm-con-4", "type1", 11.2, 0.3)]),
        ("Lần gọi đầu chậm hơn vì warm-up. Sau đó chỉ hai đến ba mili giây. Muốn đo nghiêm túc thì dùng Micrometer và xem p chín mươi lăm, p chín mươi chín, không dựa vào một lần log.",
         "Lần đầu chậm vì warm-up; sau đó 2–3 ms. Đo nghiêm túc: Micrometer, p95, p99.",
         [IN("#tm-c1", "left", 0.4), IN("#tm-c2", "left", 5.4)]),
        ("Bẫy: gọi hàm ngay trong cùng class thì không đi qua proxy, nên không được đo.",
         "Bẫy: self-invocation không qua proxy, không được đo.", [IN("#tm-c3", "left", 0.4)]),
        ("Giờ chạy với debug và tìm Condition Evaluation Report. Report có bốn phần: positive matches, negative matches, exclusions, và unconditional classes.",
         "Chạy --debug: Condition Evaluation Report có 4 phần.",
         [OUT("#tm-con, #tm-c1, #tm-c2, #tm-c3", "blur", 0, 0.45), IN("#tm-r0", "pop", 2.0), IN("#tm-r1", "pop", 3.4), IN("#tm-r2", "pop", 5.0), IN("#tm-r3", "pop", 6.4)]),
        ("Hãy giải thích ba dòng. Data source chạy vì có JDBC. H2 console không chạy vì thiếu class. Problem detail của Boot không chạy vì không bật property, advice của mình đã xử lý lỗi.",
         "Giải thích 3 dòng: có chạy, thiếu class, thiếu property.",
         [IN("#tm-d1", "left", 0.4), IN("#tm-d2", "left", 4.4), IN("#tm-d3", "left", 7.4)]),
        ("Vì sao timing aspect bọc được class không có interface? Vì report cho thấy proxy kế thừa class đã được bật.",
         "Vì sao bọc được class không có interface? CGLIB proxy matched.", [IN("#tm-d4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ checklist
    dict(id="checklist", world=(1920, 1080), hud=hud("ck", "Checklist hoàn thành", "Ghi vào nhật ký lab"), cam="".join([
        gnode("ck-n0", 160, 190, 400, 100, "Đoán trước", "violet"), gnode("ck-n1", 760, 190, 400, 100, "Chạy thật", "cyan"), gnode("ck-n2", 1360, 190, 400, 100, "So sánh", "green"),
        wires(trace("ck-x", [(560, 240), (752, 240)], "violet"), trace("ck-y", [(1160, 240), (1352, 240)], "cyan")),
        chip("ck-c1", 160, 400, "Cấu trúc package theo tính năng, không theo tầng", "green"),
        chip("ck-c2", 160, 480, "3 body lỗi 400, 404, 422 do chính bạn nhận được", "green"),
        chip("ck-c3", 160, 560, "Thời gian @Timed: lần đầu và lần sau", "green"),
        chip("ck-c4", 160, 680, "Kiểm tra API thật ở công ty: có trả entity ra ngoài hay để lộ endpoint Actuator không?", "amber"),
    ]), beats=[
        ("Phần bốn: checklist. Lab nào cũng theo một vòng: đoán trước, chạy thật, rồi so sánh với dự đoán.",
         "Phần 4: vòng lặp đoán trước, chạy thật, so sánh.",
         [IN("#ck-hud", "left", 0.1), IN("#ck-n0", "pop", 2.2), DRAW("#ck-x-p", 3.0, 0.4), IN("#ck-n1", "pop", 3.4), DRAW("#ck-y-p", 4.0, 0.4), IN("#ck-n2", "pop", 4.4)]),
        ("Ghi vào nhật ký cấu trúc package, ba body lỗi bạn tự nhận được, và thời gian Timed lần đầu với lần sau.",
         "Ghi nhật ký: package, 3 body lỗi, thời gian @Timed lần đầu và sau.",
         [IN("#ck-c1", "left", 1.0), IN("#ck-c2", "left", 2.6), IN("#ck-c3", "left", 4.4)]),
        ("Cuối cùng, kiểm tra api thật ở công ty: có trả entity ra ngoài, hay để lộ endpoint Actuator không?",
         "Kiểm tra API thật: trả entity ra ngoài? Lộ endpoint Actuator?", [IN("#ck-c4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("tree", "Package", "theo tính năng"),
                                                ("shield", "ProblemDetail", "400 · 404 · 422"),
                                                ("lock", "Rollback", "kho Keyboard vẫn là 8"),
                                                ("grid", "Actuator", "chỉ health và info")]),
        chip("ou-next", 700, 650, "Bài tiếp: Lab 5, Transaction Bugs", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: chia package theo tính năng. Chuẩn hóa lỗi bằng Problem Detail cho các mã bốn trăm, bốn trăm linh bốn, và hai trăm hai mươi hai. Rollback giữ kho Keyboard vẫn là tám. Và Actuator chỉ mở health với info.",
         "Package theo tính năng · ProblemDetail 400/404/422 · rollback giữ kho · Actuator tối thiểu.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 7.2), IN("#ou-c3", "pop", 10.2)]),
        ("Bài tiếp: lab năm, các lỗi transaction.", "Bài tiếp: Lab 5, các lỗi transaction.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
