"""SQL optimize explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-optimize.ts. Every plan and number on screen was run with web/scripts/run-sql.mjs -f (PostgreSQL 18 on PGlite):
scratch_entry = 30000 generated rows, ANALYZE, no index: Seq Scan cost=0.00..695.00 rows=1 width=48 (entry_id = 12345);
with idx_scratch_entry_id: Index Scan cost=0.29..8.30 rows=1; account_id = 'AC00000123' with idx_scratch_account_id: Bitmap Heap Scan 4.37..39.19 rows=10,
Bitmap Index Scan 0.00..4.36 rows=10; ORDER BY booking_date, entry_id LIMIT 5 no index: Limit 1118.29..1118.30, Sort 1118.29..1193.29 rows=30000, Seq Scan 0.00..620.00;
ORDER BY entry_id LIMIT 5 with index: Limit 0.29..0.47 over Index Scan, no Sort; upper(account_id) = 'AC00000123': Seq Scan 0.00..770.00 rows=150;
LIKE '%123': Seq Scan 695.00 rows=3; LIKE 'AC0000012%': Bitmap Heap Scan 5.16..191.70; status REVERSED: Index Scan 0.29..48.26 rows=300, POSTED: Seq Scan 0.00..695.00 rows=29700;
plan_demo (widget table, 3 columns): Seq Scan cost=0.00..567.00 rows=1 width=19, with index Index Scan cost=0.29..8.30 rows=1 width=19;
sizes: table 2621440 bytes (2560 kB), indexes 1245184 bytes (672 + 320 + 224 kB); index (account_id, booking_date): Index Scan 0.29..8.31 for both columns,
only booking_date: Seq Scan 0.00..695.00 rows=82; stmt_entry has one index: stmt_entry_pkey. T24 stmt_entry has 932 rows (from the lesson).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<s>'[^']*')|(?P<k>\b(?:SELECT|FROM|WHERE|AND|ORDER BY|LIMIT|AS|ON|EXPLAIN|CREATE INDEX|CREATE TABLE|ANALYZE|LIKE|DROP INDEX)\b)"
    r"|(?P<f>\b(?:generate_series|upper|lower)\b(?=\())|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff", f="#fcd34d")

PLAN_TOKEN = re.compile(
    r"(?P<r>Seq Scan)|(?P<g>Index Scan|Bitmap Heap Scan|Bitmap Index Scan)|(?P<a>Sort|Limit)|(?P<c>cost=[\d.]+\.\.[\d.]+)"
    r"|(?P<v>Filter|Index Cond|Recheck Cond)|(?P<x>.)", re.S)
PLAN_COLOR = dict(r="#fca5a5", g="#86efac", a="#fcd34d", c="#fcd34d", v="#c4b5fd")


def _hl(rx, colors, line):
    out = []
    for m in rx.finditer(line):
        kind, text = m.lastgroup, esc(m.group())
        out.append(text if kind == "x" else f'<span style="color:{colors[kind]}">{text}</span>')
    return "".join(out)


def sqlbox(id_, x, y, w, lines, size=27):
    """SQL editor card: clause lines are ids <id>-1..n, revealed one by one with IN(..., "type1")."""
    rows = "".join(f'<i id="{id_}-{i}" style="white-space:pre">{_hl(SQL_TOKEN, SQL_COLOR, l)}</i>' for i, l in enumerate(lines, 1))
    return el(id_, x, y, w, None, f"<span>SQL</span>{rows}", "console", f"color:#e6e9f0;font-size:{size}px")


def planbox(id_, x, y, w, lines, size=26, wrap=False):
    """EXPLAIN output card: real plan text, one id per line (<id>-1..n)."""
    ws = "pre-wrap;overflow-wrap:anywhere" if wrap else "pre"
    rows = "".join(f'<i id="{id_}-{i}" style="white-space:{ws}">{_hl(PLAN_TOKEN, PLAN_COLOR, l)}</i>' for i, l in enumerate(lines, 1))
    return el(id_, x, y, w, None, f"<span>QUERY PLAN</span>{rows}", "console", f"color:#e6e9f0;font-size:{size}px")


def tbl(prefix, x, y, cols, head, rows, row_h=60, size=27, tone="#2ec5e8"):
    """Result table: header id <prefix>-h, rows <prefix>-1..n; cols = [(width, mono)]."""
    def cells(vals, bold=False):
        out = []
        for (w, mono), v in zip(cols, vals):
            out.append(f'<span style="width:{w}px;padding:0 16px;white-space:nowrap;overflow:hidden;'
                       f'font-family:{"var(--mono)" if mono else "var(--font)"};font-weight:{700 if bold else 500}">{esc(v)}</span>')
        return "".join(out)
    total = sum(w for w, _ in cols)
    base = f"display:flex;align-items:center;height:{row_h - 6}px;font-size:{size}px;border-radius:10px;"
    parts = [el(f"{prefix}-h", x, y, total, None, cells(head, True), "r",
                base + f"background:rgba(255,255,255,.08);border-bottom:2px solid {tone};color:#fff")]
    for i, vals in enumerate(rows, 1):
        bg = "rgba(255,255,255,.035)" if i % 2 else "rgba(255,255,255,0)"
        parts.append(el(f"{prefix}-{i}", x, y + i * row_h, total, None, cells(vals), "r", base + f"background:{bg};color:#e6e9f0"))
    return "".join(parts)


def sel_tbl(prefix, n):
    return ", ".join([f"#{prefix}-h"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def sel_q(prefix, n):
    return ", ".join([f"#{prefix}"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def type_q(prefix, n, d0=0.3, step=1.2):
    """Reveal an sqlbox/planbox: the card, then each line."""
    return [IN(f"#{prefix}", "up", d0, 0.4)] + [IN(f"#{prefix}-{i}", "type1", d0 + 0.3 + (i - 1) * step, 0.3) for i in range(1, n + 1)]


def show_tbl(prefix, n, d0=0.3, step=0.5):
    return [IN(f"#{prefix}-h", "left", d0)] + [IN(f"#{prefix}-{i}", "left", d0 + 0.5 + (i - 1) * step) for i in range(1, n + 1)]


def title_beat(p):
    return [TYPE(f"#{p}-big", 0.1, 0.06), IN(f"#{p}-bsub", "blur", 0.9), OUT(f"#{p}-big, #{p}-bsub", "zoom", 3.4), IN(f"#{p}-hud", "left", 4.0)]


def node(id_, x, y, w, h, title, sub, tone="cyan"):
    return box(id_, x, y, w, h,
               f'<div style="text-align:center;padding-top:14px"><b style="font:700 32px var(--mono)">{esc(title)}</b>'
               f'<div style="font-size:24px;opacity:.75;margin-top:6px">{esc(sub)}</div></div>', tone)


def bar(id_, x, y, w, color):
    return el(id_, x, y, w, 56, "", "r", f"background:linear-gradient(90deg,{color},rgba(255,255,255,.12));border-radius:12px;transform-origin:left center")


def lbl(id_, x, y, w, text, size=28):
    return el(id_, x, y, w, None, esc(text), "r", f"font:600 {size}px var(--font);color:#e6e9f0;line-height:56px")


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Index và Execution Plan", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Một câu SQL đúng chưa chắc đã nhanh."), "h1 center r"),
        node("hk-a", 300, 470, 560, 130, "Không có index", "Seq Scan · cost 567.00", "red"),
        node("hk-b", 1060, 470, 560, 130, "Có index", "Index Scan · cost 8.30", "green"),
        wires(arrow("hk-w", [(870, 535), (1050, 535)], "cyan")),
        chip("hk-n1", 560, 680, "Bảng thử plan_demo: 30.000 dòng", "amber"),
        tile("hk-tile", 300, 350, 220, "tree"),
        el("hk-word", 570, 380, 1300, None, letters("Index và Execution Plan"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "B-tree · EXPLAIN · Seq Scan · Index Scan · Chi phí của index", "kin-sub r"),
    ]), beats=[
        ("Một câu lệnh SQL đúng chưa chắc đã nhanh. Bảng bút toán lớn dần, mỗi lần tìm một dòng, database có phải đọc cả bảng không?",
         "Một câu SQL đúng chưa chắc đã nhanh. Tìm một dòng, database có phải đọc cả bảng?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-n1", "up", 5.0)]),
        ("Với bảng thử ba mươi nghìn dòng, chi phí ước lượng của cùng một câu tìm kiếm giảm từ năm trăm sáu mươi bảy xuống tám phẩy ba. Chỉ nhờ một Index.",
         "Cùng một câu tìm kiếm: chi phí từ 567.00 xuống 8.30, chỉ nhờ một index.",
         [IN("#hk-a", "left", 0.4), *ARROW("hk-w", 3.0, 0.8), IN("#hk-b", "right", 4.2)]),
        ("Hôm nay ta học Index, và cách đọc kế hoạch thực thi.",
         "Hôm nay: index và cách đọc kế hoạch thực thi.",
         [OUT("#hk-eye, #hk-q, #hk-a, #hk-b, #hk-w, #hk-n1", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ index-idea
    dict(id="index-idea", world=(1920, 1080), hud=hud("ii", "Index là gì", "Mục lục của bảng, và bảng thử 30.000 dòng"), cam="".join([
        big_title("ii", "Index là gì", "Như mục lục cuối cuốn sách"),
        el("ii-l1", 120, 190, 800, None, "Không có index", "lbl r"),
        node("ii-a", 120, 250, 800, 150, "Seq Scan", "đọc lần lượt từ dòng 1 đến dòng 30000", "amber"),
        el("ii-l2", 1000, 190, 800, None, "Có index: cây B-tree", "lbl r"),
        node("ii-t1", 1000, 250, 230, 150, "gốc", "so sánh", "cyan"),
        node("ii-t2", 1300, 250, 230, 150, "nhánh", "đi xuống", "cyan"),
        node("ii-t3", 1600, 250, 230, 150, "lá", "vị trí dòng", "green"),
        wires(arrow("ii-w1", [(1236, 325), (1294, 325)], "cyan"), arrow("ii-w2", [(1536, 325), (1594, 325)], "cyan")),
        sqlbox("ii-q", 120, 480, 1100, ["CREATE TABLE scratch_entry AS", "SELECT g AS entry_id, ...", "FROM generate_series(1, 30000) AS g;", "ANALYZE scratch_entry;"]),
        chip("ii-k1", 1290, 500, "T24 stmt_entry: 932 dòng, quá nhỏ", "amber"),
        chip("ii-k2", 1290, 600, "scratch_entry: 30.000 dòng giả", "green"),
        chip("ii-k3", 1290, 700, "Chỉ để thử, không phải dữ liệu thật", "red"),
        chip("ii-k4", 120, 820, "Khoá chính luôn có index sẵn", "violet"),
    ]), beats=[
        ("Phần một. Index giống mục lục cuối sách. Không có nó, database phải đọc lần lượt từng dòng, gọi là Seq Scan.",
         "Phần 1: index như mục lục. Không có index, database quét tuần tự (Seq Scan).",
         title_beat("ii") + [IN("#ii-l1", "left", 4.6), IN("#ii-a", "left", 5.0)]),
        ("Có Index, nó đi xuống một cây cân bằng gọi là B tree. Chỉ vài tầng là thấy vị trí dòng, dù bảng có hàng chục triệu dòng.",
         "Có index: đi xuống cây B-tree, vài tầng là thấy vị trí dòng.",
         [IN("#ii-l2", "left", 0.3), IN("#ii-t1", "pop", 0.8), *ARROW("ii-w1", 2.0, 0.5), IN("#ii-t2", "pop", 2.6), *ARROW("ii-w2", 4.0, 0.5), IN("#ii-t3", "pop", 4.7)]),
        ("Bảng T hai mươi bốn chỉ có chín trăm ba mươi hai bút toán, quá nhỏ để thấy khác biệt. Nên ta tự dựng bảng thử ba mươi nghìn dòng bằng generate series.",
         "T24 chỉ có 932 bút toán. Ta dựng bảng thử 30.000 dòng bằng generate_series.",
         [DIM("#ii-l1, #ii-a, #ii-l2, #ii-t1, #ii-t2, #ii-t3, #ii-w1-p, #ii-w1-h, #ii-w2-p, #ii-w2-h", 0, 0.12)] + type_q("ii-q", 4, 0.3, 1.2) + [IN("#ii-k1", "left", 1.0), IN("#ii-k2", "left", 5.0)]),
        ("Nhớ rằng đây chỉ là bảng thử. Còn khoá chính thì lúc nào cũng có Index sẵn.",
         "Đây chỉ là bảng thử. Khoá chính luôn có index sẵn.",
         [IN("#ii-k3", "left", 0.3), IN("#ii-k4", "left", 2.8)]),
    ]),
    # ------------------------------------------------------------ explain-plan
    dict(id="explain-plan", world=(1920, 1080), hud=hud("ep", "EXPLAIN", "Xem kế hoạch mà không chạy câu lệnh"), cam="".join([
        big_title("ep", "EXPLAIN", "Xem planner định tìm bằng cách nào"),
        sqlbox("ep-q", 120, 190, 1300, ["EXPLAIN SELECT * FROM scratch_entry WHERE entry_id = 12345;"]),
        planbox("ep-p", 120, 360, 1300, ["Seq Scan on scratch_entry  (cost=0.00..695.00 rows=1 width=48)", "  Filter: (entry_id = 12345)"], 28),
        chip("ep-a1", 120, 620, "Seq Scan: đọc cả bảng", "red"),
        chip("ep-a2", 980, 620, "Filter: kiểm tra từng dòng đã đọc", "violet"),
        chip("ep-a3", 120, 710, "cost 695.00: đơn vị tương đối, không phải giây", "amber"),
        chip("ep-a4", 980, 710, "rows=1: số dòng ước lượng", "cyan"),
        chip("ep-t1", 120, 620, "EXPLAIN ANALYZE chạy câu lệnh thật", "red"),
        chip("ep-t2", 120, 710, "UPDATE, DELETE sẽ sửa dữ liệu thật", "red"),
        chip("ep-t3", 120, 800, "Bọc trong transaction rồi ROLLBACK", "green"),
    ]), beats=[
        ("Phần hai. Trước khi chạy, planner lập kế hoạch thực thi. Thêm Explain phía trước để xem kế hoạch mà không chạy câu lệnh.",
         "Phần 2: EXPLAIN cho xem kế hoạch mà không chạy câu lệnh.",
         title_beat("ep") + type_q("ep-q", 1, 4.6, 1.0)),
        ("Chưa có Index thì thấy Seq Scan, nghĩa là đọc cả bảng, và Filter kiểm tra từng dòng. Cost là chi phí ước lượng, không phải giây. Rows là số dòng dự đoán.",
         "Seq Scan đọc cả bảng. cost là đơn vị tương đối, không phải giây. rows là ước lượng.",
         type_q("ep-p", 2, 0.3, 1.0) + [IN("#ep-a1", "left", 2.6), IN("#ep-a2", "left", 5.0), IN("#ep-a3", "left", 6.4), IN("#ep-a4", "left", 8.2)]),
        ("Bẫy: Explain Analyze chạy câu lệnh thật. Với Update hay Delete nó sửa dữ liệu thật, nên hãy bọc trong transaction rồi Rollback.",
         "EXPLAIN ANALYZE chạy thật: bọc UPDATE, DELETE trong transaction rồi ROLLBACK.",
         [OUT("#ep-a1, #ep-a2, #ep-a3, #ep-a4", "fade", 0, 0.4), DIM(sel_q("ep-q", 1) + ", " + sel_q("ep-p", 2), 0.3, 0.15),
          IN("#ep-t1", "left", 0.6), IN("#ep-t2", "left", 3.0), IN("#ep-t3", "left", 5.6)]),
    ]),
    # ------------------------------------------------------------ create-index
    dict(id="create-index", world=(1920, 1080), hud=hud("ci", "CREATE INDEX", "So sánh kế hoạch trước và sau"), cam="".join([
        big_title("ci", "CREATE INDEX", "Cùng một câu hỏi, hai kế hoạch"),
        sqlbox("ci-q", 120, 190, 900, ["CREATE INDEX idx_plan_demo_entry_id", "ON plan_demo (entry_id);"]),
        chip("ci-k1", 1100, 200, "Bảng thử plan_demo: 30.000 dòng", "amber"),
        chip("ci-k2", 1100, 290, "Kết quả không đổi, chỉ đổi cách tìm", "green"),
        chip("ci-t1", 120, 400, "Không có index", "amber"),
        chip("ci-t2", 1000, 400, "Có index", "green"),
        planbox("ci-p1", 120, 470, 820, ["Seq Scan on plan_demo  (cost=0.00..567.00 rows=1 width=19)", "  Filter: (entry_id = 12345)"], 22, True),
        planbox("ci-p2", 1000, 470, 820, ["Index Scan using idx_plan_demo_entry_id on plan_demo  (cost=0.29..8.30 rows=1 width=19)", "  Index Cond: (entry_id = 12345)"], 22, True),
        chip("ci-r1", 120, 720, "Seq Scan: đọc lần lượt cả bảng", "red", 820),
        chip("ci-r2", 1000, 720, "Index Scan: tra index, nhảy thẳng tới dòng", "green", 820),
        chip("ci-r3", 120, 810, "Filter: mọi dòng vẫn phải được đọc", "red", 820),
        chip("ci-r4", 1000, 810, "Index Cond: điều kiện dùng ngay trong index", "green", 820),
        el("ci-cmp", 0, 720, 1920, None, letters("567.00  →  8.30"), "h1 center r"),
        chip("ci-n", 560, 880, "Có index chưa chắc planner dùng: nó chọn theo chi phí", "violet"),
    ]), beats=[
        ("Phần ba. Tạo Index bằng Create Index, tên bảng, rồi tên cột trong ngoặc. Index không đổi kết quả, chỉ đổi cách tìm.",
         "Phần 3: CREATE INDEX tên ON bảng (cột). Kết quả không đổi.",
         title_beat("ci") + type_q("ci-q", 2, 4.2, 1.0) + [IN("#ci-k1", "left", 5.8), IN("#ci-k2", "left", 7.0)]),
        ("Đây là bảng thử plan demo, ba mươi nghìn dòng. Khi chưa có Index: Seq Scan, chi phí năm trăm sáu mươi bảy, Filter kiểm tra từng dòng.",
         "Chưa có index: Seq Scan, cost 567.00, Filter từng dòng.",
         [OUT("#ci-k1, #ci-k2", "fade", 0, 0.4), DIM(sel_q("ci-q", 2), 0.3, 0.15), IN("#ci-t1", "left", 0.5), *type_q("ci-p1", 2, 1.0, 1.0), IN("#ci-r1", "left", 4.4), IN("#ci-r3", "left", 6.4)]),
        ("Tạo Index xong, Seq Scan thành Index Scan, Filter thành Index Cond, chi phí còn tám phẩy ba.",
         "Có index: Index Scan, Index Cond, cost 8.30.",
         [IN("#ci-t2", "right", 0.3), *type_q("ci-p2", 2, 0.8, 1.0), IN("#ci-r2", "right", 3.2), IN("#ci-r4", "right", 5.0)]),
        ("Nhưng planner chọn theo chi phí, nên có Index chưa chắc nó dùng. Phần năm sẽ nói rõ.",
         "Planner chọn theo chi phí: có index chưa chắc được dùng.",
         [OUT("#ci-r1, #ci-r2, #ci-r3, #ci-r4", "fade", 0, 0.4), DIM(sel_q("ci-p1", 2) + ", " + sel_q("ci-p2", 2) + ", #ci-t1, #ci-t2", 0.3, 0.2),
          TYPE("#ci-cmp", 0.5, 0.08), IN("#ci-n", "up", 3.0)]),
    ]),
    # ------------------------------------------------------------ scan-types
    dict(id="scan-types", world=(1920, 1080), hud=hud("st", "Các kiểu quét", "Index Scan, Bitmap, Seq Scan, Sort, JOIN"), cam="".join([
        big_title("st", "Các kiểu quét", "Planner chọn theo số dòng cần lấy"),
        card4("st-c", 120, 190, 540, 220, 30, [("tree", "Index Scan", "rất ít dòng, ví dụ 1 dòng theo entry_id"),
                                                ("split", "Bitmap Scan", "một nhóm dòng, ví dụ 10 bút toán của 1 tài khoản"),
                                                ("grid", "Seq Scan", "phần lớn bảng, đọc thẳng một lần")]),
        planbox("st-p", 120, 470, 1500, ["Bitmap Heap Scan on scratch_entry  (cost=4.37..39.19 rows=10 width=48)", "  Recheck Cond: (account_id = 'AC00000123'::text)",
                                          "  ->  Bitmap Index Scan on idx_scratch_account_id  (cost=0.00..4.36 rows=10 width=0)", "        Index Cond: (account_id = 'AC00000123'::text)"], 24),
        planbox("st-s", 120, 470, 1500, ["Limit  (cost=1118.29..1118.30 rows=5 width=48)", "  ->  Sort  (cost=1118.29..1193.29 rows=30000 width=48)",
                                          "        Sort Key: booking_date, entry_id", "        ->  Seq Scan on scratch_entry  (cost=0.00..620.00 rows=30000 width=48)"], 24),
        chip("st-s1", 120, 760, "Không có index: đọc cả 30000 dòng rồi Sort", "red"),
        chip("st-s2", 120, 850, "Có index theo entry_id: không còn Sort", "green"),
        chip("st-j1", 120, 500, "Hash Join: nối phần lớn hai bảng", "cyan"),
        chip("st-j2", 120, 590, "Nested Loop: bảng ngoài chỉ còn vài dòng, bảng trong có index", "violet"),
        chip("st-j3", 120, 710, "Planner chọn. Việc của ta là đọc ra nó đã chọn gì", "green"),
    ]), beats=[
        ("Phần bốn. Planner chọn kiểu quét theo số dòng cần lấy. Một dòng thì Index Scan, một nhóm dòng thì Bitmap, gần hết bảng thì Seq Scan.",
         "Phần 4: 1 dòng Index Scan, một nhóm Bitmap, gần hết bảng Seq Scan.",
         title_beat("st") + [IN("#st-c0", "pop", 4.4), IN("#st-c1", "pop", 5.4), IN("#st-c2", "pop", 6.4)]),
        ("Mười bút toán của một tài khoản cho ra Bitmap Index Scan, rồi Bitmap Heap Scan mở đúng những trang đã đánh dấu.",
         "10 bút toán của một tài khoản: Bitmap Index Scan, rồi Bitmap Heap Scan.",
         [DIM("#st-c0, #st-c2", 0, 0.15)] + type_q("st-p", 4, 0.5, 1.2)),
        ("Order By mà không lấy được thứ tự từ Index thì phải Sort: đọc cả ba mươi nghìn dòng rồi sắp xếp để lấy năm dòng. Có Index đúng cột thì không còn Sort.",
         "ORDER BY không dùng được index thì phải Sort. Có index đúng cột: hết Sort.",
         [OUT("#st-c0, #st-c1, #st-c2, " + sel_q("st-p", 4), "fade", 0, 0.4)] + type_q("st-s", 4, 0.6, 1.0) + [IN("#st-s1", "left", 5.6), IN("#st-s2", "left", 8.6)]),
        ("Với Join, Hash Join hợp khi nối phần lớn hai bảng, Nested Loop hợp khi bảng ngoài chỉ còn vài dòng. Ta không chọn, ta đọc xem planner đã chọn gì.",
         "Hash Join: nối phần lớn hai bảng. Nested Loop: bảng ngoài chỉ còn vài dòng.",
         [OUT(sel_q("st-s", 4) + ", #st-s1, #st-s2", "fade", 0, 0.4), IN("#st-j1", "left", 0.6), IN("#st-j2", "left", 3.4), IN("#st-j3", "left", 7.8)]),
    ]),
    # ------------------------------------------------------------ index-not-used
    dict(id="index-not-used", world=(1920, 1080), hud=hud("nu", "Index có mà không dùng", "Bốn tình huống kinh điển"), cam="".join([
        big_title("nu", "Index bị bỏ qua", "Bốn tình huống kinh điển"),
        chip("nu-1", 100, 190, "1 · Bọc cột trong hàm", "amber", 410),
        chip("nu-2", 550, 190, "2 · LIKE '%123'", "amber", 410),
        chip("nu-3", 1000, 190, "3 · Chọn lọc kém", "amber", 410),
        chip("nu-4", 1450, 190, "4 · Bảng quá nhỏ", "amber", 410),
        sqlbox("nu-q", 120, 300, 1200, ["EXPLAIN SELECT * FROM scratch_entry", "WHERE upper(account_id) = 'AC00000123';"]),
        planbox("nu-p", 120, 500, 1500, ["Seq Scan on scratch_entry  (cost=0.00..770.00 rows=150 width=48)", "  Filter: (upper(account_id) = 'AC00000123'::text)"], 26),
        chip("nu-f", 120, 720, "Index lưu giá trị gốc: đã qua hàm thì không biết nằm đâu", "red"),
        planbox("nu-l", 120, 300, 1500, ["Seq Scan on scratch_entry  (cost=0.00..695.00 rows=3 width=48)", "  Filter: (account_id ~~ '%123'::text)"], 26),
        chip("nu-l1", 120, 520, "LIKE '%123': không biết tìm từ đâu, quét cả bảng", "red"),
        chip("nu-l2", 120, 610, "LIKE 'AC0000012%': biết phần đầu, dùng được index", "green"),
        chip("nu-s0", 120, 300, "status = 'REVERSED': 300 dòng", "green"),
        chip("nu-s00", 1000, 300, "status = 'POSTED': 29.700 dòng", "red"),
        planbox("nu-s1", 100, 400, 860, ["Index Scan using idx_scratch_status on scratch_entry  (cost=0.29..48.26 rows=300 width=48)", "  Index Cond: (status = 'REVERSED'::text)"], 22, True),
        planbox("nu-s2", 1000, 400, 820, ["Seq Scan on scratch_entry  (cost=0.00..695.00 rows=29700 width=48)", "  Filter: (status = 'POSTED'::text)"], 22, True),
        chip("nu-g", 120, 700, "Lấy gần hết bảng: đọc thẳng cả bảng rẻ hơn tra index", "amber"),
        chip("nu-m1", 120, 330, "account chỉ có 85 dòng: đọc cả bảng còn rẻ hơn tra index", "amber"),
        chip("nu-m2", 120, 440, "Tin planner, đừng ép nó", "green"),
    ]), beats=[
        ("Phần năm. Có Index mà database vẫn bỏ qua, vì bốn tình huống kinh điển. Ta đi qua từng tình huống một.",
         "Phần 5: có index mà không được dùng, bốn tình huống.",
         title_beat("nu") + [IN("#nu-1", "left", 4.4), IN("#nu-2", "left", 4.7), IN("#nu-3", "left", 5.0), IN("#nu-4", "left", 5.3)]),
        ("Một: bọc cột trong hàm. Upper của account id làm Index vô dụng, kế hoạch vẫn là Seq Scan.",
         "1. upper(account_id) = ...: vẫn Seq Scan.",
         [DIM("#nu-2, #nu-3, #nu-4", 0, 0.2)] + type_q("nu-q", 2, 0.3, 0.9) + type_q("nu-p", 2, 2.4, 1.0) + [IN("#nu-f", "left", 5.0)]),
        ("Hai: Like có dấu phần trăm đứng đầu thì không biết tìm từ đâu nên quét cả bảng. Biết phần đầu thì dùng được Index.",
         "2. LIKE '%123' quét cả bảng. LIKE 'AC0000012%' dùng được index.",
         [OUT(sel_q("nu-q", 2) + ", " + sel_q("nu-p", 2) + ", #nu-f", "fade", 0, 0.4), DIM("#nu-1, #nu-3, #nu-4", 0, 0.2), DIM("#nu-2", 0, 1)]
         + type_q("nu-l", 2, 0.8, 1.0) + [IN("#nu-l1", "left", 3.4), IN("#nu-l2", "left", 7.0)]),
        ("Ba: chọn lọc kém. Tìm trạng thái Reversed, ba trăm dòng, dùng Index Scan. Tìm Posted, gần hết bảng, vẫn Seq Scan.",
         "3. REVERSED (300 dòng): Index Scan. POSTED (29.700 dòng): Seq Scan.",
         [OUT(sel_q("nu-l", 2) + ", #nu-l1, #nu-l2", "fade", 0, 0.4), DIM("#nu-2", 0, 0.2), DIM("#nu-3", 0, 1), IN("#nu-s0", "left", 0.6)] + type_q("nu-s1", 2, 1.0, 1.0)
         + [IN("#nu-s00", "right", 4.6)] + type_q("nu-s2", 2, 5.0, 1.0) + [IN("#nu-g", "up", 6.8)]),
        ("Bốn: bảng quá nhỏ, như bảng account chỉ tám mươi lăm dòng. Hãy tin planner, đừng ép nó.",
         "4. Bảng nhỏ (account: 85 dòng): tin planner, đừng ép.",
         [OUT(sel_q("nu-s1", 2) + ", " + sel_q("nu-s2", 2) + ", #nu-s0, #nu-s00, #nu-g", "fade", 0, 0.4), DIM("#nu-3", 0, 0.2), DIM("#nu-4", 0, 1), IN("#nu-m1", "left", 0.8), IN("#nu-m2", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ index-cost
    dict(id="index-cost", world=(1920, 1080), hud=hud("ic", "Index không miễn phí", "Tốn dung lượng, và làm ghi chậm hơn"), cam="".join([
        big_title("ic", "Index không miễn phí", "Hai cái giá: chỗ chứa và tốc độ ghi"),
        lbl("ic-n0", 120, 200, 400, "scratch_entry (bảng)"),
        bar("ic-b0", 560, 200, 1000, "#2ec5e8"), lbl("ic-v0", 1600, 200, 250, "2560 kB"),
        lbl("ic-n1", 120, 290, 400, "index entry_id"),
        bar("ic-b1", 560, 290, 263, "#fcd34d"), lbl("ic-v1", 850, 290, 250, "672 kB"),
        lbl("ic-n2", 120, 380, 400, "index account_id"),
        bar("ic-b2", 560, 380, 125, "#fcd34d"), lbl("ic-v2", 710, 380, 250, "320 kB"),
        lbl("ic-n3", 120, 470, 400, "index status"),
        bar("ic-b3", 560, 470, 88, "#fcd34d"), lbl("ic-v3", 675, 470, 250, "224 kB"),
        chip("ic-tot", 560, 590, "3 index: 672 + 320 + 224 = 1216 kB", "amber"),
        node("ic-ins", 120, 360, 380, 110, "INSERT", "1 dòng mới", "cyan"),
        node("ic-t0", 900, 200, 560, 90, "bảng", "", "cyan"),
        node("ic-t1", 900, 320, 560, 90, "idx_scratch_entry_id", "", "amber"),
        node("ic-t2", 900, 440, 560, 90, "idx_scratch_account_id", "", "amber"),
        node("ic-t3", 900, 560, 560, 90, "idx_scratch_status", "", "amber"),
        wires(*[arrow(f"ic-w{i}", [(510, 415), (890, 245 + i * 120)], "cyan") for i in range(4)]),
        chip("ic-u1", 120, 720, "UPDATE cột có index: sửa cả index", "red"),
        chip("ic-u2", 120, 810, "DELETE: gỡ dòng khỏi mọi index", "red"),
        chip("ic-g1", 120, 300, "Đặt index cho cột hay nằm trong WHERE, JOIN, ORDER BY", "green"),
        chip("ic-g2", 120, 390, "Của truy vấn chạy thường xuyên và trả ít dòng", "green"),
        chip("ic-g3", 120, 480, "Đừng đặt cho cột chọn lọc kém hay bảng nhỏ", "red"),
        chip("ic-g4", 120, 570, "Định kỳ xoá index không ai dùng: pg_stat_user_indexes, idx_scan", "violet"),
    ]), beats=[
        ("Phần sáu. Index không miễn phí. Nó có hai cái giá, và cái giá thứ nhất là dung lượng, tức là chỗ chứa trên đĩa.",
         "Phần 6: index không miễn phí. Giá thứ nhất: dung lượng.",
         title_beat("ic") + [IN("#ic-n0", "left", 4.4), IN("#ic-b0", "left", 4.6, 0.8), IN("#ic-v0", "fade", 5.2)]),
        ("Trên bảng thử, bảng chiếm hai nghìn năm trăm sáu mươi kilobyte, riêng ba Index đã chiếm thêm hơn một nghìn hai trăm.",
         "Bảng 2560 kB, ba index thêm 1216 kB.",
         [IN("#ic-n1", "left", 0.4), IN("#ic-b1", "left", 0.6, 0.7), IN("#ic-v1", "fade", 1.2), IN("#ic-n2", "left", 2.4), IN("#ic-b2", "left", 2.6, 0.7), IN("#ic-v2", "fade", 3.2),
          IN("#ic-n3", "left", 4.4), IN("#ic-b3", "left", 4.6, 0.7), IN("#ic-v3", "fade", 5.2), IN("#ic-tot", "up", 6.4)]),
        ("Cái giá thứ hai là tốc độ ghi. Mỗi Insert phải thêm giá trị vào mọi Index. Update cột có Index phải sửa Index, Delete phải gỡ khỏi Index.",
         "Giá thứ hai: mỗi INSERT cập nhật mọi index. UPDATE, DELETE cũng vậy.",
         [OUT("#ic-n0, #ic-b0, #ic-v0, #ic-n1, #ic-b1, #ic-v1, #ic-n2, #ic-b2, #ic-v2, #ic-n3, #ic-b3, #ic-v3, #ic-tot", "fade", 0, 0.4), IN("#ic-ins", "left", 0.6),
          IN("#ic-t0", "right", 1.2), *ARROW("ic-w0", 1.4, 0.5), IN("#ic-t1", "right", 2.2), *ARROW("ic-w1", 2.4, 0.5), IN("#ic-t2", "right", 3.2), *ARROW("ic-w2", 3.4, 0.5),
          IN("#ic-t3", "right", 4.2), *ARROW("ic-w3", 4.4, 0.5), IN("#ic-u1", "left", 6.4), IN("#ic-u2", "left", 8.6)]),
        ("Nên chỉ đặt Index cho cột hay nằm trong Where, Join, Order By của truy vấn chạy thường xuyên, và định kỳ xoá Index không ai dùng.",
         "Chỉ đặt index cho cột hay lọc, nối, sắp xếp. Định kỳ xoá index không dùng.",
         [OUT("#ic-ins, #ic-t0, #ic-t1, #ic-t2, #ic-t3, #ic-w0, #ic-w1, #ic-w2, #ic-w3, #ic-u1, #ic-u2", "fade", 0, 0.4), IN("#ic-g1", "left", 0.6), IN("#ic-g2", "left", 3.0),
          IN("#ic-g3", "left", 5.2), IN("#ic-g4", "left", 7.6)]),
    ]),
    # ------------------------------------------------------------ composite-fk
    dict(id="composite-fk", world=(1920, 1080), hud=hud("cf", "Index nhiều cột và khoá ngoại", "Thứ tự cột quan trọng"), cam="".join([
        big_title("cf", "Index nhiều cột", "Và khoá ngoại không tự có index"),
        sqlbox("cf-q", 120, 190, 1100, ["CREATE INDEX idx_scratch_acc_date", "ON scratch_entry (account_id, booking_date);"]),
        chip("cf-t1", 100, 400, "Lọc cả hai cột", "green"),
        chip("cf-t2", 1000, 400, "Chỉ lọc booking_date", "red"),
        planbox("cf-p1", 100, 470, 860, ["Index Scan using idx_scratch_acc_date on scratch_entry  (cost=0.29..8.31 rows=1 width=48)",
                                          "  Index Cond: ((account_id = 'AC00000123'::text) AND (booking_date = '2024-03-15'::date))"], 21, True),
        planbox("cf-p2", 1000, 470, 820, ["Seq Scan on scratch_entry  (cost=0.00..695.00 rows=82 width=48)", "  Filter: (booking_date = '2024-03-15'::date)"], 21, True),
        chip("cf-h", 120, 770, "Như danh bạ xếp theo họ rồi tên: điều kiện phải bắt đầu từ cột đầu", "violet"),
        sqlbox("cf-q2", 120, 190, 1250, ["SELECT indexname FROM pg_indexes WHERE tablename = 'stmt_entry';"]),
        tbl("cf-t", 120, 340, [(560, True)], ["indexname"], [["stmt_entry_pkey"]], 70, 30),
        chip("cf-f1", 120, 560, "stmt_entry.account_id là khoá ngoại, mà chưa có index", "amber"),
        chip("cf-f2", 120, 650, "Chỉ khoá chính được PostgreSQL tự đặt index", "red"),
        sqlbox("cf-q3", 120, 190, 1100, ["CREATE INDEX idx_stmt_entry_account_id", "ON stmt_entry (account_id);"]),
        chip("cf-g", 120, 400, "Khoá ngoại hay nối và lọc: đặt index riêng", "green"),
    ]), beats=[
        ("Phần bảy. Index nhiều cột giống danh bạ xếp theo họ rồi tới tên. Thứ tự cột rất quan trọng.",
         "Phần 7: index nhiều cột như danh bạ họ rồi tên. Thứ tự cột quan trọng.",
         title_beat("cf") + type_q("cf-q", 2, 4.4, 1.0)),
        ("Lọc cả hai cột thì Index Scan, chi phí tám phẩy ba mốt. Chỉ lọc cột thứ hai, booking date, thì Index không giúp được, vẫn Seq Scan.",
         "Lọc cả hai cột: Index Scan 8.31. Chỉ lọc booking_date: Seq Scan.",
         [DIM(sel_q("cf-q", 2), 0, 0.15), IN("#cf-t1", "left", 0.3)] + type_q("cf-p1", 2, 0.8, 1.0) + [IN("#cf-t2", "right", 5.0)] + type_q("cf-p2", 2, 5.4, 1.0) + [IN("#cf-h", "up", 7.2)]),
        ("Sự thật về khoá ngoại: PostgreSQL không tự tạo Index cho khoá ngoại. Bảng stmt entry chỉ có đúng một Index, của khoá chính.",
         "PostgreSQL không tự đặt index cho khoá ngoại. stmt_entry chỉ có stmt_entry_pkey.",
         [OUT("#cf-t1, #cf-t2, #cf-h, " + sel_q("cf-q", 2) + ", " + sel_q("cf-p1", 2) + ", " + sel_q("cf-p2", 2), "fade", 0, 0.4)] + type_q("cf-q2", 1, 0.6, 1.0)
         + show_tbl("cf-t", 1, 2.6) + [IN("#cf-f1", "left", 5.0), IN("#cf-f2", "left", 7.4)]),
        ("Vì vậy khoá ngoại hay dùng để nối hoặc lọc thường nên được đặt Index riêng.",
         "Khoá ngoại hay nối, lọc: đặt index riêng.",
         [OUT(sel_q("cf-q2", 1) + ", " + sel_tbl("cf-t", 1) + ", #cf-f1, #cf-f2", "fade", 0, 0.4)] + type_q("cf-q3", 2, 0.6, 1.0) + [IN("#cf-g", "left", 3.2)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("tree", "Index", "như mục lục, cây B-tree"),
                                                ("grid", "EXPLAIN", "xem kế hoạch, cost không phải giây"),
                                                ("shield", "Không phải lúc nào cũng dùng", "hàm, LIKE %, chọn lọc kém, bảng nhỏ"),
                                                ("lock", "Index có giá", "dung lượng, ghi chậm, khoá ngoại")]),
        chip("ou-next", 460, 650, "Bài tiếp: Bài tập tổng hợp trên dữ liệu T24", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy EXPLAIN trên bảng thử", "cta r"),
    ]), beats=[
        ("Tóm lại: Index như mục lục, giúp database tìm dòng nhanh. Explain cho xem kế hoạch, và cost không phải giây. Index không phải lúc nào cũng được dùng. Và Index có giá, tốn chỗ, làm ghi chậm hơn.",
         "Index như mục lục · EXPLAIN · không phải lúc nào cũng được dùng · index có giá.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.2), IN("#ou-c2", "pop", 8.0), IN("#ou-c3", "pop", 11.5)]),
        ("Bài tiếp: bài tập tổng hợp trên dữ liệu T hai mươi bốn.", "Bài tiếp: bài tập tổng hợp trên dữ liệu T24.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy Explain trên bảng thử nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy EXPLAIN trên bảng thử nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
