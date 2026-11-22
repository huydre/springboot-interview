"""SQL capstone explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-capstone.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
Bai 1 top 5 VND OPEN balance by customer: 100036 3235868789.00, 100035 3225133015.00, 100039 2058051672.00, 100033 2004536793.00, 100034 1265336450.00;
Bai 2 OPEN accounts with no entry in Q4 2024: 18 rows (1000000002/100001, 1000000020/100012, 1000000026/100016), date in WHERE gives 0 rows;
Bai 3 first rows VN0010001 2024-10..12; Bai 4 per branch loans 4/2/3/5/1, overdue 50000000 at VN0010001 (21.74) and VN0010002 (5.88), others 0;
Bai 5 top route VN0010002 -> VN0010005 9 transfers 122000000.00, then 86000000, 71000000, 69000000, 46000000;
Bai 6 INTERSECT 6 customers 100011, 100017, 100024, 100035, 100036, 100039; Bai 7 RANK 7 rows, 2024-10-12 tie FT240000101/102 5000000.00;
Bai 8 running balance of 1000000044 23 rows, last 120923000.00; Bai 9 reconciliation 0 rows clean, 1 row after +2500000 (123423000.00 vs 120923000.00);
Bai 10 UPDATE ... RETURNING 1000000044 120923000.00; approach: count(*) 33 vs count(DISTINCT customer_id) 12 for LIVE loans.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

KEYWORDS = ["SELECT", "FROM", "WHERE", "AND", "AS", "IN", "ON", "JOIN", "LEFT", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "DESC",
            "INTERSECT", "WITH", "OVER", "PARTITION BY", "RANK", "SUM", "COUNT", "ROUND", "COALESCE", "CASE", "WHEN", "THEN", "END", "ELSE",
            "DISTINCT", "BETWEEN", "IS", "NULL", "UPDATE", "SET", "RETURNING", "DATE"]
KW = "|".join(sorted((k.replace(" ", r"\s") for k in KEYWORDS), key=len, reverse=True))
SQL_TOKEN = re.compile(rf"(?P<s>'[^']*')|(?P<k>\b(?:{KW})\b)|(?P<n>\b\d+\b)|(?P<x>.)", re.S | re.I)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff")


def sqlhl(line):
    out = []
    for m in SQL_TOKEN.finditer(line):
        kind, text = m.lastgroup, esc(m.group())
        out.append(text if kind == "x" else f'<em style="color:{SQL_COLOR[kind]};font-style:normal">{text}</em>')
    return "".join(out)


def sqlbox(id_, x, y, w, lines, size=28):
    """SQL editor card: clause lines are ids <id>-1..n, revealed one by one with IN(..., "type1")."""
    rows = "".join(f'<i id="{id_}-{i}" style="white-space:pre">{sqlhl(l)}</i>' for i, l in enumerate(lines, 1))
    return el(id_, x, y, w, None, f"<span>SQL</span>{rows}", "console", f"color:#e6e9f0;font-size:{size}px")


def tbl(prefix, x, y, cols, head, rows, row_h=60, size=27, tone="#2ec5e8"):
    """Result table: header id <prefix>-h, rows <prefix>-1..n; cols = [(width, mono)]; NULL is dim italic."""
    def cells(vals, bold=False):
        out = []
        for (w, mono), v in zip(cols, vals):
            if v == "NULL" and not bold:
                v = '<span style="opacity:.45;font-style:italic">NULL</span>'
            else:
                v = esc(v)
            out.append(f'<span style="width:{w}px;padding:0 16px;white-space:nowrap;overflow:hidden;'
                       f'font-family:{"var(--mono)" if mono else "var(--font)"};font-weight:{700 if bold else 500}">{v}</span>')
        return "".join(out)
    total = sum(w for w, _ in cols)
    base = f"display:flex;align-items:center;height:{row_h - 6}px;font-size:{size}px;border-radius:10px;"
    parts = [el(f"{prefix}-h", x, y, total, None, cells(head, True), "r",
                base + f"background:rgba(255,255,255,.08);border-bottom:2px solid {tone};color:#fff")]
    for i, vals in enumerate(rows, 1):
        bg = "rgba(255,255,255,.035)" if i % 2 else "rgba(255,255,255,0)"
        parts.append(el(f"{prefix}-{i}", x, y + i * row_h, total, None, cells(vals), "r", base + f"background:{bg};color:#e6e9f0"))
    return "".join(parts)


def errbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r")


def okbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r",
              "color:#9be37a;border-color:var(--green);background:linear-gradient(165deg,rgba(74,222,128,.16),rgba(6,24,12,.85));box-shadow:none")


def sel_tbl(prefix, n):
    return ", ".join([f"#{prefix}-h"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def sel_q(prefix, n):
    return ", ".join([f"#{prefix}"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def type_q(prefix, n, d0=0.3, step=1.0):
    return [IN(f"#{prefix}", "up", d0, 0.4)] + [IN(f"#{prefix}-{i}", "type1", d0 + 0.3 + (i - 1) * step, 0.3) for i in range(1, n + 1)]


def show_tbl(prefix, n, d0=0.3, step=0.5):
    return [IN(f"#{prefix}-h", "left", d0)] + [IN(f"#{prefix}-{i}", "left", d0 + 0.5 + (i - 1) * step) for i in range(1, n + 1)]


def title_beat(p):
    return [TYPE(f"#{p}-big", 0.1, 0.06), IN(f"#{p}-bsub", "blur", 0.9), OUT(f"#{p}-big, #{p}-bsub", "zoom", 2.2), IN(f"#{p}-hud", "left", 2.8)]


def step(id_, y, text):
    return el(id_, 300, y, 1320, None, esc(text), "r",
              "box-sizing:border-box;padding:16px 30px;font-size:34px;font-weight:600;color:#e6e9f0;border-radius:16px;"
              "background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.28)")


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Bài tập tổng hợp trên dữ liệu T24", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Mỗi chi nhánh có bao nhiêu khoản vay quá hạn?"), "h1 center r"),
        chip("hk-c1", 300, 500, "Mỗi dòng kết quả là gì?", "amber"),
        chip("hk-c2", 300, 600, "Dữ liệu nằm ở những bảng nào?", "cyan"),
        chip("hk-c3", 300, 700, "Chưa gõ chữ SELECT vội", "green"),
        tile("hk-tile", 360, 350, 220, "grid"),
        el("hk-word", 630, 380, 1250, None, letters("Bài tập tổng hợp"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Lọc · Gom nhóm · JOIN · Cửa sổ · Đối soát", "kin-sub r"),
    ]), beats=[
        ("Sếp hỏi: mỗi chi nhánh có bao nhiêu khoản vay quá hạn. Bạn gõ gì đầu tiên?",
         "Mỗi chi nhánh có bao nhiêu khoản vay quá hạn? Bạn gõ gì đầu tiên?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Chưa phải chữ Select. Trước hết hãy nói rõ mỗi dòng kết quả là gì, và dữ liệu nằm ở những bảng nào.",
         "Trước hết: mỗi dòng kết quả là gì, dữ liệu ở bảng nào.",
         [IN("#hk-c1", "left", 0.3), IN("#hk-c2", "left", 2.6), IN("#hk-c3", "left", 5.0)]),
        ("Bài này ôn cả khoá qua mười bài toán ngân hàng. Ta xem cách đọc câu hỏi, rồi câu lệnh cuối cùng và kết quả đã chạy thật.",
         "Mười bài toán ngân hàng: cách đọc câu hỏi, câu lệnh và kết quả đã chạy thật.",
         [OUT("#hk-eye, #hk-q, #hk-c1, #hk-c2, #hk-c3", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ warm-up
    dict(id="warm-up", world=(1920, 1080), hud=hud("wu", "Khởi động", "Một hai bảng"), cam="".join([
        big_title("wu", "Khởi động", "Một hai bảng"),
        sqlbox("wu-q", 60, 190, 900, ["SELECT customer_id,", "       sum(working_balance) AS tong_so_du", "FROM account", "WHERE status = 'OPEN' AND ccy = 'VND'",
                                      "GROUP BY customer_id", "ORDER BY tong_so_du DESC LIMIT 5;"], 25),
        chip("wu-g1", 60, 560, "Hạt: một dòng cho mỗi khách", "amber"),
        chip("wu-g2", 60, 650, "Bảng account: lọc rồi gom nhóm", "cyan"),
        tbl("wu-t", 1010, 190, [(230, True), (450, True)], ["customer_id", "tong_so_du"],
            [["100036", "3235868789.00"], ["100035", "3225133015.00"], ["100039", "2058051672.00"], ["100033", "2004536793.00"], ["100034", "1265336450.00"]], 64, 27),
        chip("wu-n1", 1010, 650, "Tài khoản vay mang số dư âm, tự trừ vào tổng", "violet"),
        sqlbox("wu-q2", 60, 190, 900, ["SELECT a.account_id, a.customer_id", "FROM account a", "LEFT JOIN stmt_entry s", "       ON s.account_id = a.account_id",
                                       "      AND s.booking_date BETWEEN DATE '2024-10-01'", "                             AND DATE '2024-12-31'",
                                       "WHERE a.status = 'OPEN' AND s.stmt_entry_id IS NULL", "ORDER BY a.account_id;"], 24),
        chip("wu-g3", 60, 640, "Hạt: một dòng cho mỗi tài khoản", "amber"),
        chip("wu-g4", 60, 730, "LEFT JOIN rồi giữ dòng NULL", "cyan"),
        tbl("wu-t2", 1010, 190, [(270, True), (250, True)], ["account_id", "customer_id"],
            [["1000000002", "100001"], ["1000000020", "100012"], ["1000000026", "100016"], ["...", "..."]], 64, 27),
        chip("wu-n2", 1010, 560, "Tổng cộng 18 tài khoản không có bút toán", "green"),
        chip("wu-n3", 1010, 650, "Ngày trong WHERE: kết quả 0 dòng", "red"),
        chip("wu-n4", 1010, 740, "Điều kiện ngày phải nằm trong ON", "amber"),
    ]), beats=[
        ("Phần một. Khởi động với những bài toán gọn, chỉ cần một hai bảng, để làm quen với dữ liệu.",
         "Phần 1: khởi động, một hai bảng.", title_beat("wu")),
        ("Bài một: năm khách có tổng số dư đồng lớn nhất. Mỗi dòng kết quả là một khách, nên ta lọc, rồi gom nhóm theo mã khách.",
         "Bài 1: top 5 khách. Hạt là một dòng mỗi khách: lọc rồi GROUP BY.",
         [*type_q("wu-q", 6, 0.3, 0.9), IN("#wu-g1", "left", 6.0), IN("#wu-g2", "left", 7.4)]),
        ("Khách ba sáu dẫn đầu, với hơn ba tỷ hai trăm triệu. Tài khoản vay mang số dư âm, nên tự trừ vào tổng.",
         "100036 dẫn đầu với 3.235.868.789. Số dư âm tự trừ vào tổng.",
         [*show_tbl("wu-t", 5, 0.3, 0.6), DIM("#wu-t-2, #wu-t-3, #wu-t-4, #wu-t-5", 4.0, 0.3), IN("#wu-n1", "left", 5.0)]),
        ("Bài hai: tài khoản đang mở mà quý bốn không có bút toán nào. Dùng Left Join giữa tài khoản và bút toán, rồi giữ những dòng mà bên bút toán là NULL.",
         "Bài 2: tài khoản mở không có bút toán quý 4. LEFT JOIN rồi giữ dòng NULL.",
         [OUT(sel_q("wu-q", 6) + ", #wu-g1, #wu-g2, " + sel_tbl("wu-t", 5) + ", #wu-n1", "fade", 0, 0.4), *type_q("wu-q2", 8, 0.6, 0.55), IN("#wu-g3", "left", 5.4), IN("#wu-g4", "left", 6.8)]),
        ("Có mười tám tài khoản như vậy, dòng đầu là tài khoản của khách số một. Bẫy là điều kiện ngày phải nằm ngay trong phần nối. Đặt nó ở phần lọc thì kết quả rỗng.",
         "18 tài khoản. Điều kiện ngày trong ON; để ở WHERE thì ra 0 dòng.",
         [*show_tbl("wu-t2", 4, 0.3, 0.5), IN("#wu-n2", "left", 3.4), IN("#wu-n3", "left", 5.6), SHAKE("#wu-n3", 6.2), IN("#wu-n4", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ combine-tables
    dict(id="combine-tables", world=(1920, 1080), hud=hud("ct", "Nối bảng và gom nhóm", "Theo chi nhánh"), cam="".join([
        big_title("ct", "Nối bảng và gom nhóm", "Theo chi nhánh"),
        el("ct-h", 0, 150, 1920, None, "Trước khi viết: mỗi dòng kết quả là gì?", "kin-sub r"),
        chip("ct-g1", 260, 290, "Bài 3: mỗi (chi nhánh, tháng)  ·  CASE trong SUM", "cyan"),
        chip("ct-g2", 260, 410, "Bài 4: mỗi chi nhánh  ·  JOIN và COALESCE", "amber"),
        chip("ct-g3", 260, 530, "Bài 5: mỗi (chi nhánh chuyển, chi nhánh nhận)  ·  JOIN account hai lần", "violet"),
        sqlbox("ct-q", 40, 190, 920, ["SELECT a.company_id, count(*) AS so_khoan,", "       sum(l.principal) AS tong_goc,",
                                      "       COALESCE(sum(CASE WHEN l.status = 'OVERDUE'", "                THEN l.principal END), 0) AS goc_qua_han,",
                                      "       ... AS ty_le_pct", "FROM loan l", "JOIN account a ON a.account_id = l.account_id", "GROUP BY a.company_id;"], 24),
        chip("ct-n1", 40, 640, "Khoản vay không có chi nhánh: đi qua tài khoản vay", "cyan"),
        tbl("ct-t", 1000, 190, [(200, True), (160, True), (240, True), (170, True)], ["company_id", "so_khoan", "goc_qua_han", "ty_le_pct"],
            [["VN0010001", "4", "50000000.00", "21.74"], ["VN0010002", "2", "50000000.00", "5.88"], ["VN0010003", "3", "0", "0.00"],
             ["VN0010004", "5", "0", "0.00"], ["VN0010005", "1", "0", "0.00"]], 64, 24),
        chip("ct-n2", 1000, 650, "COALESCE đổi tổng NULL thành 0", "green"),
        chip("ct-n3", 1000, 740, "Bài 5 còn lại: tuyến top VN0010002 sang VN0010005, 9 lệnh", "violet"),
    ]), beats=[
        ("Phần hai. Nối nhiều bảng lại với nhau, rồi gom nhóm theo từng chi nhánh.",
         "Phần 2: nối bảng và gom nhóm theo chi nhánh.", title_beat("ct")),
        ("Trước khi viết, hỏi mỗi dòng kết quả là gì. Bài ba là mỗi cặp chi nhánh và tháng, bài bốn là mỗi chi nhánh, bài năm là mỗi cặp chi nhánh chuyển và nhận. Biết điều đó là biết ngay cột nào vào Group By.",
         "Hạt của kết quả cho biết cột nào vào GROUP BY.",
         [IN("#ct-h", "blur", 0.2), IN("#ct-g1", "left", 2.2), IN("#ct-g2", "left", 5.5), IN("#ct-g3", "left", 8.0)]),
        ("Ta xem bài bốn, dư nợ quá hạn theo chi nhánh. Khoản vay không có cột chi nhánh, nên đi qua tài khoản vay của nó. Mỗi chi nhánh một dòng.",
         "Bài 4: dư nợ quá hạn theo chi nhánh, JOIN qua tài khoản vay.",
         [OUT("#ct-h, #ct-g1, #ct-g2, #ct-g3", "fade", 0, 0.4), *type_q("ct-q", 8, 0.6, 0.8), IN("#ct-n1", "left", 7.4)]),
        ("Chi nhánh một có năm mươi triệu quá hạn, tỷ lệ hai mốt phẩy bảy bốn phần trăm. Ba chi nhánh không có khoản quá hạn, nên Sum ra NULL. Bọc Coalesce để báo cáo hiện số không.",
         "VN0010001 quá hạn 50 triệu, 21,74%. COALESCE đổi NULL thành 0.",
         [*show_tbl("ct-t", 5, 0.3, 0.5), DIM("#ct-t-2, #ct-t-3, #ct-t-4, #ct-t-5", 3.5, 0.3), IN("#ct-n2", "left", 5.5), IN("#ct-n3", "left", 8.5)]),
    ]),
    # ------------------------------------------------------------ analysis
    dict(id="analysis", world=(1920, 1080), hud=hud("an", "INTERSECT, xếp hạng, số dư chạy", "Kỹ thuật nâng cao"), cam="".join([
        big_title("an", "INTERSECT · RANK · OVER", "Kỹ thuật nâng cao"),
        sqlbox("an-q", 40, 190, 920, ["SELECT a.customer_id FROM account a", "JOIN category c ON c.category_id = a.category_id",
                                      "WHERE c.product_group = 'SAVINGS'", "  AND a.status = 'OPEN'", "INTERSECT",
                                      "SELECT customer_id FROM loan", "WHERE status IN ('LIVE', 'OVERDUE')", "ORDER BY customer_id;"], 24),
        chip("an-g1", 40, 640, "Hạt: một dòng cho mỗi khách, giao hai danh sách", "amber"),
        chip("an-n1", 40, 730, "Điều kiện trạng thái ở từng vế", "violet"),
        tbl("an-t", 1100, 190, [(300, True)], ["customer_id"],
            [["100011"], ["100017"], ["100024"], ["100035"], ["100036"], ["100039"]], 64, 27),
        sqlbox("an-q2", 40, 190, 960, ["WITH xep_hang AS (", "  SELECT processing_date, ft_id, amount,", "    rank() OVER (PARTITION BY processing_date",
                                       "                 ORDER BY amount DESC) AS hang", "  FROM funds_transfer", "  WHERE status = 'DONE' AND ccy = 'VND'",
                                       "    AND processing_date BETWEEN DATE '2024-10-01'", "                            AND DATE '2024-10-31')",
                                       "SELECT processing_date, ft_id, amount", "FROM xep_hang WHERE hang = 1", "ORDER BY processing_date, ft_id;"], 24),
        tbl("an-t2", 1040, 190, [(270, True), (250, True), (230, True)], ["processing_date", "ft_id", "amount"],
            [["2024-10-02", "FT240000096", "8000000.00"], ["2024-10-10", "FT240000100", "15000000.00"], ["2024-10-12", "FT240000101", "5000000.00"],
             ["2024-10-12", "FT240000102", "5000000.00"], ["...", "...", "..."]], 64, 24),
        chip("an-n2", 1040, 590, "Hai lệnh cùng hạng 1: RANK giữ cả hai", "green"),
        chip("an-n3", 40, 800, "Hàm cửa sổ không đứng trong WHERE: bọc CTE rồi lọc", "amber"),
        el("an-r0", 40, 170, 1800, None, "Bài 8: số dư chạy của tài khoản 1000000044", "kin-sub r", "text-align:left"),
        sqlbox("an-q3", 40, 260, 1100, ["SELECT stmt_entry_id, booking_date, amount,",
                                        "       sum(amount) OVER (ORDER BY booking_date, stmt_entry_id) AS so_du_chay", "FROM stmt_entry WHERE account_id = '1000000044';"], 24),
        tbl("an-r", 40, 520, [(230, True), (230, True), (270, True), (300, True)], ["stmt_entry_id", "booking_date", "amount", "so_du_chay"],
            [["770", "2024-10-21", "2000000.00", "128923000.00"], ["797", "2024-10-31", "-5000000.00", "123923000.00"], ["827", "2024-11-14", "-3000000.00", "120923000.00"]], 64, 26),
        chip("an-n4", 1180, 560, "Dòng cuối = working_balance", "green"),
    ]), beats=[
        ("Phần ba. Ba bài khó hơn, mỗi bài dùng một kỹ thuật nâng cao của cả khoá học.",
         "Phần 3: INTERSECT, xếp hạng và số dư chạy.", title_beat("an")),
        ("Bài sáu: khách vừa gửi tiết kiệm vừa đang vay. Đây là phép giao hai danh sách khách, nên dùng Intersect. Điều kiện trạng thái nằm ở từng vế, nếu bỏ đi sẽ thừa một khách đã tất toán.",
         "Bài 6: khách vừa có tiết kiệm vừa có vay. INTERSECT, trạng thái ở từng vế.",
         [*type_q("an-q", 8, 0.3, 0.6), *show_tbl("an-t", 6, 5.4, 0.4), IN("#an-g1", "left", 5.2), IN("#an-n1", "left", 8.0)]),
        ("Bài bảy: khoản chuyển lớn nhất mỗi ngày. Đây là bài top mỗi nhóm. Tính hạng theo từng ngày bằng Rank trong một C T E, rồi giữ hạng một.",
         "Bài 7: lớn nhất mỗi ngày. RANK() OVER (PARTITION BY ngày) trong CTE.",
         [OUT(sel_q("an-q", 8) + ", #an-g1, #an-n1, " + sel_tbl("an-t", 6), "fade", 0, 0.4), *type_q("an-q2", 11, 0.6, 0.7), IN("#an-n3", "left", 8.4)]),
        ("Ngày mười hai có hai lệnh cùng năm triệu, nên Rank giữ cả hai. Row Number sẽ bỏ mất một lệnh một cách tuỳ tiện.",
         "Ngày 2024-10-12 có hai lệnh cùng hạng 1.",
         [*show_tbl("an-t2", 5, 0.3, 0.5), DIM("#an-t2-1, #an-t2-2, #an-t2-5", 3.5, 0.3), IN("#an-n2", "left", 4.0)]),
        ("Bài tám là số dư chạy: Sum Over, sắp theo ngày rồi mã bút toán. Dòng cuối phải bằng số dư của tài khoản, đó là cách đối soát nhanh bằng mắt.",
         "Bài 8: số dư chạy SUM() OVER. Dòng cuối 120.923.000 = working_balance.",
         [OUT(sel_q("an-q2", 11) + ", " + sel_tbl("an-t2", 5) + ", #an-n2, #an-n3", "fade", 0, 0.4), IN("#an-r0", "blur", 0.5), *type_q("an-q3", 3, 0.8, 0.9),
          *show_tbl("an-r", 3, 4.2, 0.5), DIM("#an-r-1, #an-r-2", 6.0, 0.3), IN("#an-n4", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ reconcile-fix
    dict(id="reconcile-fix", world=(1920, 1080), hud=hud("rf", "Đối soát và sửa dữ liệu", "Thử bằng cách gây lệch"), cam="".join([
        big_title("rf", "Đối soát và sửa dữ liệu", "Thử bằng cách gây lệch"),
        sqlbox("rf-q", 40, 190, 1000, ["SELECT a.account_id, a.working_balance,", "       COALESCE(sum(s.amount), 0) AS tong_but_toan,",
                                       "       a.working_balance - COALESCE(sum(s.amount), 0) AS chenh_lech", "FROM account a",
                                       "LEFT JOIN stmt_entry s ON s.account_id = a.account_id", "GROUP BY a.account_id, a.working_balance",
                                       "HAVING a.working_balance <> COALESCE(sum(s.amount), 0);"], 24),
        chip("rf-g", 1100, 200, "Số dư phải bằng tổng bút toán", "amber"),
        chip("rf-g2", 1100, 290, "LEFT JOIN: không mất tài khoản trống", "cyan"),
        okbox("rf-ok", 40, 590, 1000, "0 dòng: cả 85 tài khoản đều khớp"),
        chip("rf-w", 40, 730, "Rỗng chưa chứng minh truy vấn đúng", "red"),
        sqlbox("rf-u", 1100, 200, 700, ["UPDATE account", "SET working_balance =", "    working_balance + 2500000", "WHERE account_id = '1000000044';"], 24),
        tbl("rf-t", 40, 590, [(230, True), (280, True), (270, True), (250, True)], ["account_id", "working_balance", "tong_but_toan", "chenh_lech"],
            [["1000000044", "123423000.00", "120923000.00", "2500000.00"]], 66, 24),
        chip("rf-n1", 40, 730, "Đúng 1 dòng: truy vấn bắt được lỗi", "green"),
        sqlbox("rf-f", 40, 190, 860, ["UPDATE account a", "SET working_balance = (", "  SELECT sum(s.amount) FROM stmt_entry s", "  WHERE s.account_id = a.account_id)",
                                      "WHERE a.account_id = '1000000044'", "RETURNING account_id, working_balance;"], 24),
        tbl("rf-ft", 960, 190, [(260, True), (320, True)], ["account_id", "working_balance"], [["1000000044", "120923000.00"]], 66, 26),
        chip("rf-f1", 960, 400, "Sổ bút toán là bản gốc", "green"),
        chip("rf-f2", 960, 490, "UPDATE luôn có WHERE", "red"),
        chip("rf-f3", 960, 580, "Thực tế: chạy trong transaction, xem rồi mới COMMIT", "amber"),
    ]), beats=[
        ("Phần bốn. Đối soát số dư với bút toán, và sửa dữ liệu bị lệch.",
         "Phần 4: đối soát và sửa dữ liệu.", title_beat("rf")),
        ("Số dư tài khoản phải bằng tổng bút toán của nó. Ghép mỗi tài khoản với tổng bút toán bằng Left Join, rồi dùng Having để giữ những tài khoản lệch.",
         "Bài 9: số dư phải bằng tổng bút toán. LEFT JOIN, rồi HAVING giữ tài khoản lệch.",
         [*type_q("rf-q", 7, 0.3, 0.9), IN("#rf-g", "left", 6.0), IN("#rf-g2", "left", 8.4)]),
        ("Trên dữ liệu sạch, truy vấn trả về không dòng, cả tám mươi lăm tài khoản đều khớp. Nhưng truy vấn sai cũng có thể ra không dòng, nên phải thử nó.",
         "Dữ liệu sạch: 0 dòng. Truy vấn sai cũng có thể ra 0 dòng.",
         [IN("#rf-ok", "up", 0.4), IN("#rf-w", "left", 5.0), SHAKE("#rf-w", 5.6)]),
        ("Ta cố tình làm lệch số dư tài khoản một tỷ lẻ bốn mươi bốn thêm hai triệu rưỡi. Chạy lại, đúng một dòng hiện ra, chênh lệch hai triệu năm trăm nghìn.",
         "Gây lệch +2.500.000: truy vấn trả về đúng 1 dòng.",
         [OUT("#rf-ok, #rf-w, #rf-g, #rf-g2", "fade", 0, 0.4), *type_q("rf-u", 4, 0.6, 0.6), *show_tbl("rf-t", 1, 3.6, 0.5), IN("#rf-n1", "left", 5.4)]),
        ("Khi hai nguồn lệch, sổ bút toán là bản gốc, nên ta sửa số dư theo tổng bút toán. Update luôn có Where, và Returning cho thấy dòng vừa sửa. Số dư về một trăm hai mươi triệu chín trăm hai mươi ba nghìn.",
         "Sửa số dư theo tổng bút toán. UPDATE luôn có WHERE; RETURNING cho thấy dòng đã sửa.",
         [OUT(sel_q("rf-q", 7) + ", #rf-u, " + sel_tbl("rf-t", 1) + ", #rf-n1", "fade", 0, 0.4), *type_q("rf-f", 6, 0.6, 0.8), *show_tbl("rf-ft", 1, 5.6, 0.4),
          IN("#rf-f1", "left", 7.4), IN("#rf-f2", "left", 9.0), IN("#rf-f3", "left", 11.0)]),
    ]),
    # ------------------------------------------------------------ approach
    dict(id="approach", world=(1920, 1080), hud=hud("ap", "Câu hỏi SQL lạ", "Sáu bước"), cam="".join([
        big_title("ap", "Câu hỏi SQL lạ", "Sáu bước"),
        step("ap-s1", 190, "1 · Đọc bảng: cột và khoá ngoại"),
        step("ap-s2", 290, "2 · Nói rõ hạt của kết quả"),
        step("ap-s3", 390, "3 · FROM và JOIN trước, thử với LIMIT"),
        step("ap-s4", 490, "4 · WHERE: trạng thái, khoảng ngày, loại tiền"),
        step("ap-s5", 590, "5 · Gom nhóm, HAVING, hàm cửa sổ hoặc CTE"),
        step("ap-s6", 690, "6 · Kiểm tra số dòng"),
        sqlbox("ap-q", 60, 190, 920, ["SELECT count(*) AS so_khach", "FROM loan l", "JOIN account a ON a.customer_id = l.customer_id", "WHERE l.status = 'LIVE';"], 24),
        tbl("ap-t", 1060, 190, [(300, True)], ["so_khach"], [["33"]], 66, 28),
        chip("ap-bad", 1060, 360, "Sai: JOIN nhân dòng", "red"),
        chip("ap-why", 60, 440, "Mỗi khách có nhiều tài khoản", "amber"),
        sqlbox("ap-q2", 60, 540, 920, ["SELECT count(DISTINCT l.customer_id) AS so_khach", "FROM loan l", "JOIN account a ON a.customer_id = l.customer_id", "WHERE l.status = 'LIVE';"], 24),
        tbl("ap-t2", 1060, 540, [(300, True)], ["so_khach"], [["12"]], 66, 28),
        chip("ap-ok", 1060, 710, "Đúng: 12 khoản vay LIVE, 12 khách", "green"),
    ]), beats=[
        ("Phần năm. Cách tiếp cận một câu hỏi SQL mà bạn chưa từng gặp.",
         "Phần 5: cách tiếp cận một câu hỏi SQL lạ.", title_beat("ap")),
        ("Đừng bắt đầu từ chữ Select. Đọc bảng. Nói rõ mỗi dòng kết quả là gì. Viết From và Join trước, thử với Limit. Rồi thêm Where. Sau đó mới gom nhóm hay dùng hàm cửa sổ. Cuối cùng, kiểm tra số dòng.",
         "Đọc bảng, hạt của kết quả, FROM và JOIN, WHERE, gom nhóm, kiểm tra số dòng.",
         [IN("#ap-s1", "left", 0.4), IN("#ap-s2", "left", 2.6), IN("#ap-s3", "left", 4.8), IN("#ap-s4", "left", 7.8), IN("#ap-s5", "left", 9.8), IN("#ap-s6", "left", 12.0)]),
        ("Bước cuối cứu bạn khỏi con số trông hợp lý mà sai. Đếm khách có khoản vay đang hoạt động, nhưng Join thêm bảng tài khoản. Mỗi khách có nhiều tài khoản, nên số dòng nhân lên, và ra ba mươi ba thay vì mười hai.",
         "JOIN thêm account làm nhân dòng: 33 thay vì 12.",
         [OUT("#ap-s1, #ap-s2, #ap-s3, #ap-s4, #ap-s5, #ap-s6", "fade", 0, 0.4), *type_q("ap-q", 4, 0.6, 0.6), *show_tbl("ap-t", 1, 3.4, 0.4), IN("#ap-bad", "left", 4.6),
          SHAKE("#ap-bad", 5.2), IN("#ap-why", "left", 7.0)]),
        ("Sửa bằng cách đếm mã khách khác nhau, và đối chiếu với một con số đếm độc lập trên bảng gốc. Mười hai khoản vay, mười hai khách.",
         "COUNT(DISTINCT customer_id) = 12, khớp số đếm độc lập.",
         [*type_q("ap-q2", 4, 0.3, 0.6), *show_tbl("ap-t2", 1, 3.0, 0.4), IN("#ap-ok", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "Hạt của kết quả", "một dòng mỗi cái gì thì gom nhóm theo cái đó"),
                                                ("lock", "LEFT JOIN", "điều kiện ngày của bảng phải nằm trong ON"),
                                                ("share", "Đối soát", "thử bằng cách gây lệch, UPDATE luôn có WHERE"),
                                                ("quote", "Số dòng", "đối chiếu số đếm độc lập để bắt nhân dòng")]),
        el("ou-cta", 0, 700, 1920, None, "Mở bài học tương tác để tự làm mười bài trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: hạt của kết quả cho biết cột nào vào Group By. Với Left Join, điều kiện ngày đặt trong On. Truy vấn đối soát phải được thử bằng cách gây lệch, và Update luôn có Where. Cuối cùng, đối chiếu số dòng để bắt lỗi nhân dòng.",
         "Hạt của kết quả · điều kiện trong ON · thử đối soát bằng cách gây lệch · kiểm tra số dòng.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.5), IN("#ou-c2", "pop", 9.0), IN("#ou-c3", "pop", 13.5)]),
        ("Mở bài học tương tác để tự làm mười bài này trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để tự làm mười bài trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-c3", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
