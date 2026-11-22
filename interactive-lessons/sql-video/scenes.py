"""SQL Queries & Pagination explainer: scene layouts and per-beat narration + motion.

Measured on PostgreSQL 16 (dept/employee sample re-run; orders 1,000,000 rows), study note 03.07:
LEFT JOIN count(e.id) -> HR 0, IT 4, Sales 3; INNER JOIN drops HR; WHERE on the right table turns LEFT into INNER;
having count(*) >= 2 after where salary > 2000 -> dept 1: 3, dept 2: 3; salaries 3000, 3000, 2500 -> row_number 1,2,3,
rank 1,1,3, dense_rank 1,1,2; second highest salary 2800 (offset without distinct returns 3000); duplicate email an@x.com 2;
NOT IN with a NULL returns 0 rows, NOT EXISTS returns HR; anti join 648 ms vs LEFT JOIN ... IS NULL 1086 ms (10,004 rows);
offset 0 0.1 ms, 100,000 14 ms, 500,000 100 ms, 900,000 168 ms, keyset 0.09 ms; with status = 'PAID' offset 500,000 1303 ms vs keyset 0.45 ms;
HikariPool "Connection is not available, request timed out after 1006ms (total=2, active=2, idle=0, waiting=0)" (Spring Boot 3.5).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Phòng nào chưa có nhân viên?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["where id not in (select dept_id from employee)", "→ 0 dòng  (sai!)", "where not exists (...)", "→ HR"]),
        tile("hk-tile", 330, 350, 220, "grid"),
        el("hk-word", 600, 380, 1300, None, letters("SQL & Phân trang"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "JOIN · window function · keyset · Hikari pool", "kin-sub r"),
    ]), beats=[
        ("Viết SQL tìm phòng ban chưa có nhân viên nào. Dùng not in thì trả về không dòng nào, dù phòng HR đang trống.",
         "Tìm phòng chưa có nhân viên: NOT IN trả 0 dòng, dù phòng HR đang trống.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Dùng not exists thì ra đúng phòng nhân sự. Vì sao? Đó là bẫy NULL.", "NOT EXISTS ra đúng phòng HR. Vì sao? Bẫy NULL.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 1.5, 0.3), IN("#hk-con-3", "type1", 2.5, 0.3), IN("#hk-con-4", "type1", 3.5, 0.3)]),
        ("Hôm nay ta học các câu SQL kinh điển, và phân trang.", "Hôm nay: SQL & Phân trang.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ JOIN
    dict(id="join", world=(1920, 1080), hud=hud("jn", "JOIN và bẫy NULL", "Đừng để báo cáo mất dòng"), cam="".join([
        big_title("jn", "JOIN", "INNER, LEFT và bẫy NULL"),
        box("jn-r1", 160, 190, 1600, 80, "<b>INNER JOIN + count(*) · HR biến mất: IT 4, Sales 3</b>", "red", "card"),
        box("jn-r2", 160, 290, 1600, 80, "<b>LEFT JOIN + count(*) · HR = 1, vì đếm cả dòng NULL</b>", "red", "card"),
        box("jn-r3", 160, 390, 1600, 80, "<b>LEFT JOIN + count(e.id) · HR 0, IT 4, Sales 3</b>", "green", "card"),
        box("jn-r4", 160, 490, 1600, 80, "<b>điều kiện bảng phải đặt ở WHERE · LEFT JOIN thành INNER JOIN</b>", "red", "card"),
        box("jn-r5", 160, 590, 1600, 80, "<b>đặt điều kiện vào ON · vẫn giữ mọi phòng</b>", "green", "card"),
        chip("jn-u", 160, 710, "Không cần loại trùng: UNION ALL, không phải UNION", "violet"),
        el("jn-fan", 160, 790, 1600, None, "Join 2 quan hệ một-nhiều cùng lúc (3 item × 2 payment = 6 dòng) rồi sum: tổng bị nhân. Aggregate từng bảng trong subquery trước", "warnbox r"),
    ]), beats=[
        ("Phần một: join. Inner join chỉ giữ dòng khớp ở cả hai bảng. Báo cáo đếm theo phòng mà dùng inner join thì phòng HR chưa có ai biến mất.",
         "Phần 1: INNER JOIN chỉ giữ dòng khớp: báo cáo theo phòng làm mất phòng HR chưa có ai.",
         [TYPE("#jn-big", 0.1, 0.06), IN("#jn-bsub", "blur", 0.8), OUT("#jn-big, #jn-bsub", "zoom", 3.2), IN("#jn-hud", "left", 3.8), IN("#jn-r1", "left", 4.2)]),
        ("Left join giữ mọi dòng bảng trái. Nhưng đếm bằng count dấu sao thì phòng nhân sự ra một, vì đếm cả dòng toàn NULL. Phải đếm count của cột bên phải: ra không.",
         "LEFT JOIN giữ mọi dòng bảng trái. count(*) đếm cả dòng NULL: phải đếm count(e.id).",
         [IN("#jn-r2", "left", 0.4), IN("#jn-r3", "left", 5.2)]),
        ("Bẫy nữa: đặt điều kiện của bảng bên phải ở where sẽ biến left join thành inner join. Hãy đặt nó vào on.",
         "Điều kiện của bảng bên phải ở WHERE biến LEFT JOIN thành INNER JOIN: đặt vào ON.",
         [IN("#jn-r4", "left", 0.4), IN("#jn-r5", "left", 4.4)]),
        ("Không cần loại trùng thì dùng union all. Và khi join hai quan hệ một nhiều cùng lúc, tổng bị nhân lên: hãy aggregate từng bảng trước.",
         "Dùng UNION ALL. Join 2 quan hệ một-nhiều cùng lúc làm tổng bị nhân: aggregate trước.",
         [IN("#jn-u", "left", 0.4), IN("#jn-fan", "up", 3.2)]),
    ]),
    # ------------------------------------------------------------ GROUP BY, WHERE, HAVING
    dict(id="groupby", world=(1920, 1080), hud=hud("gb", "GROUP BY, WHERE và HAVING", "Thứ tự logic khác thứ tự viết"), cam="".join([
        gnode("gb-n1", 120, 200, 220, 90, "FROM + JOIN", "muted"), gnode("gb-n2", 360, 200, 220, 90, "WHERE", "cyan"),
        gnode("gb-n3", 600, 200, 220, 90, "GROUP BY", "muted"), gnode("gb-n4", 840, 200, 220, 90, "HAVING", "amber"),
        gnode("gb-n5", 1080, 200, 220, 90, "SELECT", "muted"), gnode("gb-n6", 1320, 200, 220, 90, "ORDER BY", "muted"),
        gnode("gb-n7", 1560, 200, 220, 90, "LIMIT", "muted"),
        box("gb-code", 160, 350, 1000, 200, code("select dept_id, count(*) from employee\nwhere salary > 2000            -- lọc dòng trước\ngroup by dept_id\nhaving count(*) >= 2;          -- lọc nhóm sau"), "cyan", "code"),
        console("gb-res", 1220, 350, 540, ["dept 1 · 3", "dept 2 · 3"]),
        el("gb-note", 160, 590, 1600, None, "IT có 4 người nhưng Dung (lương 2000) bị WHERE loại trước khi đếm, nên còn 3", "note left r"),
        chip("gb-c1", 160, 680, "WHERE lọc từng dòng, không dùng được count(); HAVING lọc từng nhóm", "green"),
        chip("gb-c2", 160, 760, "Điều kiện không dính aggregate thì để ở WHERE: lọc sớm, gom ít hơn", "violet"),
        chip("gb-c3", 160, 840, "PostgreSQL báo lỗi khi SELECT cột không nằm trong GROUP BY", "amber"),
    ]), beats=[
        ("Phần hai: group by, where và having. Database xử lý theo thứ tự logic khác thứ tự bạn viết: from, where, group by, having, select, order by, limit.",
         "Phần 2: thứ tự logic: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.",
         [IN("#gb-hud", "left", 0.1), IN("#gb-n1, #gb-n2, #gb-n3, #gb-n4, #gb-n5, #gb-n6, #gb-n7", "pop", 2.0, 0.4, 0.5)]),
        ("Ví dụ: phòng có ít nhất hai người lương trên hai nghìn. Where lọc dòng trước, having lọc nhóm sau. IT có bốn người nhưng Dung bị loại trước khi đếm, nên còn ba.",
         "Phòng có ít nhất 2 người lương trên 2000: WHERE lọc dòng trước, HAVING lọc nhóm sau.",
         [LIGHT("#gb-n2", 0.4), IN("#gb-code", "up", 0.6), LIGHT("#gb-n4", 4.0), IN("#gb-res", "right", 5.4, 0.4), IN("#gb-res-1", "type1", 5.8, 0.3), IN("#gb-res-2", "type1", 6.4, 0.3), IN("#gb-note", "up", 7.2)]),
        ("Where không dùng được hàm aggregate. Điều kiện nào không cần aggregate thì để ở where, để lọc sớm. Postgres còn báo lỗi nếu select cột không nằm trong group by.",
         "WHERE không dùng count(). Lọc sớm ở WHERE. Postgres báo lỗi nếu SELECT cột ngoài GROUP BY.",
         [IN("#gb-c1", "left", 0.4), IN("#gb-c2", "left", 3.2), IN("#gb-c3", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ window functions
    dict(id="window", world=(1920, 1080), hud=hud("wn", "Window function", "Giữ nguyên từng dòng"), cam="".join([
        box("wn-code", 160, 190, 1000, 120, code("row_number() over w, rank() over w, dense_rank() over w\nwindow w as (order by salary desc)"), "cyan", "code"),
        console("wn-con", 160, 340, 1600, ["An   · 3000 · row_number 1 · rank 1 · dense_rank 1", "Binh · 3000 · row_number 2 · rank 1 · dense_rank 1",
                                          "Chi  · 2500 · row_number 3 · rank 3 · dense_rank 2", "Dung · 2000 · row_number 4 · rank 4 · dense_rank 3"]),
        box("wn-top", 160, 600, 1200, 190, code("select * from (\n  select name, dept_id, salary,\n    dense_rank() over (partition by dept_id order by salary desc) r\n  from employee) t where r <= 2;"), "green", "code"),
        chip("wn-c1", 1400, 610, "N người → ROW_NUMBER", "violet"), chip("wn-c2", 1400, 690, "N mức lương → DENSE_RANK", "violet"),
        chip("wn-c3", 160, 830, "Window function chạy sau WHERE nên phải bọc subquery", "amber"),
    ]), beats=[
        ("Phần ba: window function. Khác group by, nó tính trên một nhóm dòng nhưng giữ nguyên từng dòng.",
         "Phần 3: window function tính trên một nhóm dòng nhưng giữ nguyên từng dòng.",
         [IN("#wn-hud", "left", 0.1), IN("#wn-code", "up", 1.2)]),
        ("Với ba mức lương: ba nghìn, ba nghìn, hai nghìn rưỡi. Row number ra một, hai, ba. Rank ra một, một, ba. Dense rank ra một, một, hai.",
         "Lương 3000, 3000, 2500: ROW_NUMBER 1,2,3 · RANK 1,1,3 · DENSE_RANK 1,1,2.",
         [IN("#wn-con", "up", 0.2, 0.4), IN("#wn-con-1", "type1", 0.6, 0.3), IN("#wn-con-2", "type1", 3.0, 0.3), IN("#wn-con-3", "type1", 5.2, 0.3), IN("#wn-con-4", "type1", 7.0, 0.3)]),
        ("Lấy top mỗi nhóm: dùng dense rank với partition by, trong một subquery, rồi lọc hạng nhỏ hơn hoặc bằng số cần lấy ở ngoài.",
         "Top N mỗi nhóm: dense_rank() over (partition by ...) trong subquery, lọc r <= N ở ngoài.",
         [IN("#wn-top", "up", 0.4), IN("#wn-c3", "left", 5.4)]),
        ("Đề hỏi một số người thì dùng row number, hỏi một số mức lương thì dùng dense rank.",
         "N người → ROW_NUMBER · N mức lương → DENSE_RANK.",
         [IN("#wn-c1", "left", 0.4), IN("#wn-c2", "left", 2.4)]),
    ]),
    # ------------------------------------------------------------ classic questions
    dict(id="classic", world=(1920, 1080), hud=hud("cl", "Các câu SQL kinh điển", "Lương thứ 2, trùng, chưa có"), cam="".join([
        box("cl-a1", 160, 190, 1600, 80, "<b>max(salary) where salary &lt; (select max(salary)) → 2800</b>", "green", "card"),
        box("cl-a2", 160, 290, 1600, 80, "<b>order by salary desc offset 1 limit 1, không distinct → 3000: sai</b>", "red", "card"),
        box("cl-a3", 160, 390, 1600, 80, "<b>group by email having count(*) > 1 → an@x.com · 2</b>", "green", "card"),
        box("cl-a4", 160, 490, 1600, 80, "<b>NOT IN (subquery có NULL) → 0 dòng: sai</b>", "red", "card"),
        box("cl-a5", 160, 590, 1600, 80, "<b>NOT EXISTS → HR: đúng</b>", "green", "card"),
        el("cl-why", 160, 700, 1600, None, "x NOT IN (1, 2, NULL) nghĩa là x <> NULL: UNKNOWN, nên không bao giờ TRUE", "note left r"),
        console("cl-perf", 160, 790, 1600, ["1 triệu order, 10.004 khách chưa đặt: NOT EXISTS 648 ms (Hash Anti Join) · LEFT JOIN ... IS NULL 1086 ms"]),
    ]), beats=[
        ("Phần bốn: các câu kinh điển. Lương cao thứ hai ra hai nghìn tám. Có hai người cùng lương cao nhất, nên cách order by với offset mà không có distinct sẽ trả về ba nghìn, sai.",
         "Phần 4: lương cao thứ 2 = 2800. Offset không có DISTINCT trả 3000, sai vì 2 người cùng lương cao nhất.",
         [IN("#cl-hud", "left", 0.1), IN("#cl-a1", "left", 0.5), IN("#cl-a2", "left", 3.4)]),
        ("Tìm bản ghi trùng: group by email, having count lớn hơn một.", "Tìm trùng: GROUP BY email HAVING count(*) > 1.",
         [IN("#cl-a3", "left", 0.4)]),
        ("Tìm phần tử chưa có: dùng not in với subquery có một NULL sẽ trả về không dòng, vì so sánh với NULL cho kết quả unknown. Hãy dùng not exists, ra đúng phòng nhân sự.",
         "NOT IN với NULL trả 0 dòng vì so sánh với NULL là UNKNOWN. Dùng NOT EXISTS.",
         [IN("#cl-a4", "left", 0.4), IN("#cl-why", "up", 3.0), IN("#cl-a5", "left", 5.6)]),
        ("Trên một triệu order, not exists chạy thành anti join sáu trăm bốn mươi tám mili giây, nhanh hơn dùng left join rồi lọc dòng NULL.",
         "Trên 1 triệu order: NOT EXISTS 648 ms, LEFT JOIN ... IS NULL 1086 ms.",
         [IN("#cl-perf", "up", 0.4, 0.4), IN("#cl-perf-1", "type1", 0.8, 0.3)]),
    ]),
    # ------------------------------------------------------------ pagination
    dict(id="paging", world=(1920, 1080), hud=hud("pg", "Phân trang", "OFFSET đọc rồi bỏ, keyset đi thẳng"), cam="".join([
        el("pg-l", 160, 185, 1600, None, "1 triệu dòng, order by id limit 20:", "lbl r", "text-align:left"),
        box("pg-o0", 160, 235, 380, 70, "<b>offset 0 · 0,1 ms</b>", "green", "card"),
        box("pg-o1", 160, 320, 460, 70, "<b>offset 100.000 · 14 ms</b>", "amber", "card"),
        box("pg-o2", 160, 405, 930, 70, "<b>offset 500.000 · 100 ms</b>", "red", "card"),
        box("pg-o3", 160, 490, 1300, 70, "<b>offset 900.000 · 168 ms · đọc 900.020 dòng</b>", "red", "card"),
        box("pg-k", 160, 585, 520, 70, "<b>keyset · 0,09 ms · 20 dòng</b>", "green", "card"),
        box("pg-code", 160, 690, 1000, 110, code("select * from orders where id > :lastId\norder by id limit 20;"), "green", "code"),
        chip("pg-c1", 1200, 700, "Sort created_at: thêm id phụ", "violet"),
        chip("pg-c2", 1200, 780, "Page chạy thêm COUNT: dùng Slice", "amber"),
        el("pg-t", 160, 840, 1600, None, "Đánh đổi: keyset không nhảy tới trang bất kỳ, hợp infinite scroll và API mobile", "note left r"),
    ]), beats=[
        ("Phần năm: phân trang. Limit hai mươi offset chín trăm nghìn không nhảy tới được: database đọc rồi bỏ chín trăm nghìn dòng. Trang càng sâu càng chậm.",
         "Phần 5: OFFSET 900.000 không nhảy được: DB đọc rồi bỏ 900.000 dòng. Trang càng sâu càng chậm.",
         [IN("#pg-hud", "left", 0.1), IN("#pg-l", "fade", 0.4), IN("#pg-o0", "left", 1.0, 0.4), IN("#pg-o1", "left", 3.0, 0.5), IN("#pg-o2", "left", 4.6, 0.6), IN("#pg-o3", "left", 6.0, 0.8)]),
        ("Key set thì nhớ id cuối của trang trước và đi thẳng tới đó bằng index, nên luôn chỉ đọc hai mươi dòng, dưới một phần mười mili giây.",
         "Keyset nhớ id cuối trang trước, đi thẳng bằng index: luôn đọc 20 dòng, 0,09 ms.",
         [IN("#pg-k", "left", 0.4), IN("#pg-code", "up", 2.6)]),
        ("Sắp theo cột không duy nhất như created at thì thêm id làm cột phụ. Spring Data trả page sẽ chạy thêm câu count, nên không cần tổng số trang thì dùng slice.",
         "Sort theo created_at: thêm id làm cột phụ. Page chạy thêm COUNT; không cần tổng thì Slice.",
         [IN("#pg-c1", "left", 0.4), IN("#pg-c2", "left", 4.2)]),
        ("Đánh đổi: keyset không nhảy tới trang bất kỳ, hợp với infinite scroll và API mobile. Màn admin nhỏ vẫn dùng offset được.",
         "Keyset không nhảy tới trang bất kỳ: hợp infinite scroll, API mobile.",
         [IN("#pg-t", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ Hikari
    dict(id="hikari", world=(1920, 1080), hud=hud("hk", "Hikari pool", "Connection is not available"), cam="".join([
        console("hk-err", 160, 190, 1600, ["HikariPool-1 - Connection is not available, request timed out after 1006ms", "(total=2, active=2, idle=0, waiting=0)"]),
        chip("hk-def", 160, 350, "Mặc định: maximum-pool-size = 10, connection-timeout = 30 giây", "cyan"),
        chip("hk-c1", 160, 440, "Gọi API ngoài trong @Transactional", "red"), chip("hk-c2", 760, 440, "Transaction dài", "red"),
        chip("hk-c3", 1090, 440, "N+1, OSIV", "red"), chip("hk-c4", 160, 520, "REQUIRES_NEW lồng nhau: cần 2 connection", "red"),
        chip("hk-c5", 920, 520, "Leak, query thiếu index", "red"),
        el("hk-big", 160, 620, 1600, None, "Pool lớn hơn không tốt hơn: (số core × 2) + số ổ đĩa; 10 pod × pool 50 = 500 connection, vượt max_connections = 100 của PostgreSQL", "warnbox r"),
        chip("hk-fix", 160, 780, "Tìm chỗ giữ connection lâu trước, tăng pool sau cùng", "green"),
    ]), beats=[
        ("Phần sáu: pool Hikari. Khi báo connection is not available, nghĩa là mọi connection đều đang bị giữ: active bằng total, idle bằng không.",
         "Phần 6: \"Connection is not available\": active = total, idle = 0, mọi connection đang bị giữ.",
         [IN("#hk-hud", "left", 0.1), IN("#hk-err", "up", 0.4, 0.4), IN("#hk-err-1", "type1", 0.8, 0.3), IN("#hk-err-2", "type1", 3.4, 0.3), IN("#hk-def", "left", 6.2)]),
        ("Nguyên nhân thường không phải pool nhỏ, mà là giữ connection quá lâu: gọi API ngoài trong transaction, transaction dài, N cộng một, requires new lồng nhau, leak, hay query thiếu index.",
         "Thường do giữ connection quá lâu: API ngoài trong transaction, N+1, REQUIRES_NEW, leak, thiếu index.",
         [IN("#hk-c1", "left", 0.4), IN("#hk-c2", "left", 3.4), IN("#hk-c3", "left", 4.4), IN("#hk-c4", "left", 5.8), IN("#hk-c5", "left", 8.4)]),
        ("Pool lớn hơn không tốt hơn. Mười pod nhân pool năm mươi là năm trăm connection, vượt mức một trăm mặc định của Postgres. Tìm chỗ giữ lâu trước, tăng pool sau cùng.",
         "Pool lớn không tốt hơn: 10 pod × 50 = 500 connection, vượt max_connections 100. Tăng pool sau cùng.",
         [IN("#hk-big", "up", 0.4), IN("#hk-fix", "left", 7.2)]),
    ]),
    # ------------------------------------------------------------ SQL vs NoSQL
    dict(id="nosql", world=(1920, 1080), hud=hud("ns", "SQL và NoSQL", "Dùng cả hai"), cam="".join([
        gnode("ns-sql", 160, 200, 760, 110, "SQL: quan hệ, ACID nhiều bảng", "cyan"),
        gnode("ns-no", 1000, 200, 760, 110, "NoSQL: biết trước mẫu truy cập", "violet"),
        chip("ns-s1", 160, 350, "Đơn hàng, thanh toán, tồn kho", "green"),
        chip("ns-n1", 1000, 350, "Redis: cache, session, rate limit", "amber"), chip("ns-n2", 1000, 430, "Elasticsearch: tìm kiếm", "amber"),
        chip("ns-n3", 1000, 510, "Cassandra: dữ liệu ghi nhiều", "amber"), chip("ns-n4", 1000, 590, "MongoDB: dữ liệu cấu trúc thay đổi", "amber"),
        box("ns-all", 160, 700, 1600, 110, "<b>PostgreSQL là nguồn dữ liệu chính · Redis làm cache · Elasticsearch phục vụ tìm kiếm</b>", "green", "card"),
    ]), beats=[
        ("Phần bảy: SQL và NoSQL. SQL hợp dữ liệu có quan hệ cần ACID nhiều bảng, như đơn hàng, thanh toán, tồn kho.",
         "Phần 7: SQL hợp dữ liệu có quan hệ cần ACID nhiều bảng: đơn hàng, thanh toán, tồn kho.",
         [IN("#ns-hud", "left", 0.1), IN("#ns-sql", "pop", 0.5), IN("#ns-s1", "left", 4.0)]),
        ("NoSQL hợp khi mẫu truy cập biết trước và cần scale ngang: Redis cho cache, Elasticsearch cho tìm kiếm, Cassandra cho dữ liệu ghi nhiều.",
         "NoSQL: mẫu truy cập biết trước, scale ngang. Redis, Elasticsearch, Cassandra, MongoDB.",
         [IN("#ns-no", "pop", 0.4), IN("#ns-n1", "left", 2.2), IN("#ns-n2", "left", 4.0), IN("#ns-n3", "left", 5.8), IN("#ns-n4", "left", 7.2)]),
        ("Thực tế dùng cả hai: Postgres là nguồn dữ liệu chính, Redis làm cache, Elasticsearch phục vụ tìm kiếm.",
         "Dùng cả hai: PostgreSQL nguồn chính, Redis cache, Elasticsearch tìm kiếm.",
         [IN("#ns-all", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("share", "JOIN & NULL", "NOT EXISTS, không NOT IN"),
                                                ("grid", "Window function", "dense_rank, top N mỗi nhóm"),
                                                ("tree", "Keyset", "đọc 20 dòng ở mọi trang"),
                                                ("plug", "Hikari pool", "tìm chỗ giữ connection lâu")]),
        chip("ou-next", 720, 650, "Bài tiếp: REST API Design", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: dùng not exists thay cho not in. Window function để lấy top mỗi nhóm. Phân trang bảng lớn bằng key set. Và khi hết connection, tìm chỗ giữ connection lâu trước.",
         "NOT EXISTS thay NOT IN · window function cho top N · keyset cho bảng lớn · tìm chỗ giữ connection lâu.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.0), IN("#ou-c3", "pop", 8.8)]),
        ("Bài tiếp: thiết kế rest a p i.", "Bài tiếp: REST API Design.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
