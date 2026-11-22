"""SQL subquery explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-subquery.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
avg(working_balance) over 85 accounts = 204026227.04, 19 accounts above it (top: 1000000062 3052868789, 1000000059 3042221015, 1000000066 1777312000, 1000000055 1063934000);
= (SELECT working_balance ... customer_id = 100001) -> ERROR more than one row returned by a subquery used as an expression;
IN (loan LIVE) -> 12 customers 100002, 100003, 100008, 100011, ...; EXISTS version -> 12;
mobile NOT IN (DORMANT mobiles incl. NULL of 100021) -> 0, NOT EXISTS -> 38, NOT IN + IS NOT NULL -> 32;
correlated branch average: 1000000002 5088114 vs VN0010001 91317439.32 no, 1000000008 10176229 vs VN0010002 348385397.79 no, 1000000029 493756000 vs VN0010004 219792081.33 yes,
1000000040 10176229 vs VN0010003 274782430.53 no, 1000000062 3052868789 vs 348385397.79 yes, 1000000069 517967000 vs 91317439.32 yes; whole table -> 22 accounts;
per-customer sums (100001 113044114, 100002 34000000, 100003 179945000, ...) 40 customers, avg 433555732, 7 above;
WITH branch_max -> 5 rows (VN0010001 1000000069 517967000, VN0010002 1000000062 3052868789, VN0010003 1000000066 1777312000, VN0010004 1000000059 3042221015, VN0010005 1000000055 1063934000);
four ways (IN, EXISTS, JOIN, CTE) -> 12 customers each.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<s>'[^']*'|\"[^\"]*\")|(?P<k>\b(?:SELECT|FROM|WHERE|AND|OR|NOT|IN|EXISTS|JOIN|ON|WITH|AS|GROUP BY|DISTINCT|IS NOT NULL|IS NULL|NULL)\b)"
    r"|(?P<f>\b(?:avg|sum|max|count)\b)|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff", f="#fcd34d")
BAD = "border-color:#ff6b86;background:rgba(255,92,122,.07)"


def sqlhl(line):
    out = []
    for m in SQL_TOKEN.finditer(line):
        kind, text = m.lastgroup, esc(m.group())
        out.append(text if kind == "x" else f'<span style="color:{SQL_COLOR[kind]}">{text}</span>')
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


def tblids(prefix, n):
    return ", ".join([f"#{prefix}-h"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def reveal(prefix, n, d, step=0.35):
    return [IN(f"#{prefix}-h", "left", d)] + [IN(f"#{prefix}-{i}", "left", d + 0.4 + (i - 1) * step) for i in range(1, n + 1)]


def typeq(prefix, n, d, step=0.7):
    return [IN(f"#{prefix}", "up", d, 0.4)] + [IN(f"#{prefix}-{i}", "type1", d + 0.3 + (i - 1) * step, 0.3) for i in range(1, n + 1)]


def stat(id_, x, y, w, h, num, label, tone, size=150):
    col = "#ff8da0" if tone == "red" else "#9be37a"
    return el(id_, x, y, w, h, f'<div style="font:700 {size}px var(--mono);color:{col};line-height:1.1">{esc(num)}</div>'
              f'<div style="font:600 32px var(--font);color:#e6e9f0;margin-top:6px">{esc(label)}</div>',
              f"gbox {tone} r", "text-align:center;padding:26px 20px")


def step_box(id_, x, y, w, tag, body, tone="cyan"):
    return box(id_, x, y, w, None, f'<div><div style="font:600 26px var(--font);opacity:.7">{esc(tag)}</div>'
               f'<div style="font:700 34px var(--mono);margin-top:8px">{esc(body)}</div></div>', tone, "")


DOTS = "..."

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Subquery, EXISTS và CTE", "eyebrow r"),
        el("hk-q", 0, 215, 1920, None, letters("Cùng một câu hỏi, vì sao ra 0 dòng và 38 dòng?"), "h1 center r"),
        stat("hk-s1", 300, 400, 600, 330, "0", "NOT IN (subquery)", "red"),
        stat("hk-s2", 1020, 400, 600, 330, "38", "NOT EXISTS", "green"),
        tile("hk-tile", 400, 350, 220, "tree"),
        el("hk-word", 670, 380, 1200, None, letters("Subquery và CTE"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Vô hướng · IN · EXISTS · tương quan · bảng dẫn xuất · CTE", "kin-sub r"),
    ]), beats=[
        ("Tìm khách chưa từng trùng số điện thoại với khách ngủ đông. Viết bằng Not In thì ra không dòng nào. Viết bằng Not Exists thì ra ba mươi tám khách.",
         "Cùng một câu hỏi: NOT IN ra 0 dòng, NOT EXISTS ra 38 dòng.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-s1", "pop", 5.0), IN("#hk-s2", "pop", 7.4)]),
        ("Thủ phạm là một NULL, trong danh sách con. Hôm nay ta học subquery, Exists và CTE, để đặt câu hỏi nhỏ trong câu hỏi lớn.",
         "Thủ phạm là một giá trị NULL. Hôm nay: subquery, EXISTS và CTE.",
         [DIM("#hk-s2", 0.2, 0.25), PULSE("#hk-s1", 0.5), OUT("#hk-eye, #hk-q, #hk-s1, #hk-s2", "blur", 4.0, 0.45), IN("#hk-tile", "zoomin", 4.3, 0.7),
          TYPE("#hk-word", 4.6, 0.05), IN("#hk-sub", "blur", 5.6)]),
    ]),
    # ------------------------------------------------------------ scalar-subquery
    dict(id="scalar-subquery", world=(1920, 1080), hud=hud("sc", "Subquery vô hướng", "Câu hỏi nhỏ trong ngoặc"), cam="".join([
        big_title("sc", "Subquery vô hướng", "Câu hỏi nhỏ trong ngoặc"),
        sqlbox("sc-q", 100, 190, 880, ["SELECT account_id, working_balance", "FROM account", "WHERE working_balance > (", "  SELECT avg(working_balance)",
                                       "  FROM account", ");"], 27),
        step_box("sc-b1", 1060, 190, 760, "Bước 1: câu trong, chạy một lần", "avg = 204.026.227,04", "cyan"),
        step_box("sc-b2", 1060, 340, 760, "Bước 2: câu ngoài dùng con số đó", "19 tài khoản vượt mức", "green"),
        tbl("sc-t", 100, 590, [(260, True), (330, False)], ["account_id", "working_balance"],
            [["1000000062", "3.052.868.789"], ["1000000059", "3.042.221.015"], ["1000000066", "1.777.312.000"], [DOTS, DOTS]], 62, 27),
        sqlbox("sc-qe", 100, 200, 1100, ["WHERE working_balance = (", "  SELECT working_balance FROM account", "  WHERE customer_id = 100001", ");"], 27),
        el("sc-ee", 100, 450, 1500, None, "ERROR: more than one row returned by a subquery used as an expression", "err r", "font-size:30px"),
        chip("sc-t1", 100, 570, "Khách 100001 có 2 tài khoản nên câu trong trả 2 dòng", "amber"),
        chip("sc-t2", 100, 660, "Cần so với nhiều giá trị: IN, hoặc max, avg", "green"),
    ]), beats=[
        ("Phần một. Subquery vô hướng là một câu hỏi nhỏ đặt trong ngoặc, và chỉ trả về đúng một giá trị.",
         "Phần 1: subquery vô hướng, câu hỏi nhỏ trong ngoặc, trả về một giá trị.",
         [TYPE("#sc-big", 0.1, 0.06), IN("#sc-bsub", "blur", 0.9), OUT("#sc-big, #sc-bsub", "zoom", 4.4), IN("#sc-hud", "left", 5.0)]),
        ("Muốn tìm tài khoản trên mức trung bình, máy chạy phần trong ngoặc trước, một lần duy nhất, ra một con số.",
         "PostgreSQL chạy phần trong ngoặc trước, một lần, ra một con số.",
         [*typeq("sc-q", 6, 0.3, 0.8), IN("#sc-b1", "left", 5.6), DIM("#sc-q-1, #sc-q-2, #sc-q-3, #sc-q-6", 5.4, 0.3)]),
        ("Mức trung bình là hơn hai trăm triệu. Câu ngoài dùng con số này như một hằng số, và có mười chín tài khoản vượt qua.",
         "Câu ngoài dùng con số đó như hằng số: 19 tài khoản vượt mức.",
         [DIM("#sc-q-1, #sc-q-2, #sc-q-3, #sc-q-6", 0.1, 1), IN("#sc-b2", "left", 3.0), *reveal("sc-t", 4, 5.2, 0.4)]),
        ("Bẫy: nếu câu trong trả về hai dòng, ví dụ khách có hai tài khoản, PostgreSQL báo lỗi ngay. Muốn so với nhiều giá trị, hãy dùng In, hoặc ép về một giá trị bằng Max hay Avg.",
         "Câu trong trả về 2 dòng thì lỗi. So nhiều giá trị: dùng IN, hoặc max, avg.",
         [OUT("#sc-q, #sc-b1, #sc-b2, " + tblids("sc-t", 4), "fade", 0, 0.4), *typeq("sc-qe", 4, 0.6, 0.7), IN("#sc-ee", "up", 3.8), SHAKE("#sc-ee", 4.4),
          IN("#sc-t1", "left", 6.0), IN("#sc-t2", "left", 9.6)]),
    ]),
    # ------------------------------------------------------------ in-subquery
    dict(id="in-subquery", world=(1920, 1080), hud=hud("is", "IN (subquery)", "Danh sách do câu hỏi nhỏ tạo ra"), cam="".join([
        big_title("is", "IN (subquery)", "Danh sách do câu hỏi nhỏ tạo ra"),
        sqlbox("is-q", 100, 190, 880, ["SELECT customer_id, short_name", "FROM customer", "WHERE customer_id IN (", "  SELECT customer_id FROM loan",
                                       "  WHERE status = 'LIVE'", ");"], 27),
        box("is-l", 1060, 190, 760, None,
            '<div><div style="font:600 26px var(--font);opacity:.7">Câu trong trả về một danh sách, 12 mã</div>'
            '<div style="font:700 32px var(--mono);margin-top:10px;line-height:1.5">100002 · 100003 · 100008<br>100011 · 100013 · 100017<br>100018 · 100024 · ...</div></div>', "cyan"),
        tbl("is-t", 100, 580, [(240, True), (600, False)], ["customer_id", "short_name"],
            [["100002", "DUONG VAN AN"], ["100003", "NGO ANH TUAN"], ["100008", "LE KHANH LINH"], [DOTS, DOTS]], 62, 27),
        chip("is-c1", 1060, 580, "12 khách có khoản vay LIVE", "green"),
        chip("is-c2", 1060, 670, "IN chỉ lọc, bảng ngoài không bị nhân dòng", "violet"),
        chip("is-c3", 1060, 760, "Cần cột của bảng trong: dùng JOIN", "amber"),
    ]), beats=[
        ("Phần hai. Khi câu hỏi nhỏ trả về cả một danh sách, ta dùng In, nhưng danh sách này do subquery tạo ra.",
         "Phần 2: IN với subquery, danh sách do câu hỏi nhỏ tạo ra.",
         [TYPE("#is-big", 0.1, 0.06), IN("#is-bsub", "blur", 0.9), OUT("#is-big, #is-bsub", "zoom", 4.0), IN("#is-hud", "left", 4.6)]),
        ("Khách nào đang có khoản vay còn hiệu lực? Câu nhỏ lấy mã khách của các khoản vay Live. Câu lớn giữ khách có mã nằm trong danh sách đó.",
         "Câu nhỏ lấy customer_id của khoản vay LIVE, câu lớn giữ khách có mã trong danh sách.",
         [*typeq("is-q", 6, 0.3, 1.0), IN("#is-l", "left", 7.0), DIM("#is-q-1, #is-q-2, #is-q-3, #is-q-6", 7.0, 0.3)]),
        ("Kết quả có mười hai khách. Khác với Join, In chỉ lọc: bảng ngoài không bị nhân dòng, và bạn không lấy được cột của bảng trong. Cần cột đó thì dùng Join.",
         "12 khách. IN chỉ lọc, không nhân dòng, không lấy được cột bảng trong.",
         [DIM("#is-q-1, #is-q-2, #is-q-3, #is-q-6", 0.1, 1), *reveal("is-t", 4, 0.3, 0.35), IN("#is-c1", "left", 2.4), IN("#is-c2", "left", 5.0), IN("#is-c3", "left", 8.6)]),
    ]),
    # ------------------------------------------------------------ exists
    dict(id="exists", world=(1920, 1080), hud=hud("ex", "EXISTS, NOT EXISTS", "Và bẫy NOT IN gặp NULL"), cam="".join([
        big_title("ex", "EXISTS và bẫy NOT IN", "Chỉ hỏi: có dòng nào không?"),
        sqlbox("ex-q", 100, 190, 1000, ["SELECT customer_id, short_name", "FROM customer c", "WHERE EXISTS (", "  SELECT 1 FROM loan l",
                                        "  WHERE l.customer_id = c.customer_id", "    AND l.status = 'LIVE'", ");"], 27),
        chip("ex-c1", 1180, 230, "Chỉ hỏi: có ít nhất một dòng?", "cyan"),
        chip("ex-c2", 1180, 320, "Vẫn ra 12 khách, như IN", "green"),
        chip("ex-c3", 1180, 410, "NOT EXISTS: giữ dòng không có", "violet"),
        tbl("ex-t", 100, 190, [(230, True), (250, False), (330, True)], ["customer_id", "status", "mobile"],
            [["100014", "DORMANT", "0903295121"], ["100021", "DORMANT", "NULL"], ["100023", "DORMANT", "0917913624"]], 66, 28),
        chip("ex-n1", 100, 470, "Danh sách con có một NULL", "amber"),
        el("ex-f", 100, 570, 1500, None, '<span style="font-family:var(--mono)">x NOT IN (a, b, NULL)</span>  =  x &lt;&gt; a  AND  x &lt;&gt; b  AND  <span style="color:#ff8da0">x &lt;&gt; NULL</span>',
           "r", "font-size:34px;color:#e6e9f0"),
        chip("ex-n2", 100, 670, "x <> NULL luôn là 'không biết', nên cả biểu thức không bao giờ đúng", "red"),
        stat("ex-s1", 120, 250, 520, 340, "0", "NOT IN", "red"),
        stat("ex-s2", 700, 250, 520, 340, "38", "NOT EXISTS", "green"),
        stat("ex-s3", 1280, 250, 520, 340, "32", "NOT IN + IS NOT NULL", "red"),
        chip("ex-tk", 380, 680, "Câu 'không có': ưu tiên NOT EXISTS", "green"),
    ]), beats=[
        ("Phần ba. Exists chỉ hỏi một câu có hoặc không: câu con có trả về ít nhất một dòng nào không.",
         "Phần 3: EXISTS chỉ hỏi: câu con có ít nhất một dòng không?",
         [TYPE("#ex-big", 0.1, 0.06), IN("#ex-bsub", "blur", 0.9), OUT("#ex-big, #ex-bsub", "zoom", 4.4), IN("#ex-hud", "left", 5.0)]),
        ("Với mỗi khách, hỏi: có khoản vay Live nào của khách này không? Nó nối với dòng ngoài bằng mã khách. Kết quả vẫn là mười hai khách, giống In. Còn Not Exists là phép đảo.",
         "Với mỗi khách, hỏi có khoản vay LIVE không: 12 khách. NOT EXISTS là phép đảo.",
         [*typeq("ex-q", 7, 0.3, 1.0), DIM("#ex-q-1, #ex-q-2", 8.0, 0.3), IN("#ex-c1", "left", 5.0), IN("#ex-c2", "left", 8.0), IN("#ex-c3", "left", 10.4)]),
        ("Bây giờ là bẫy lớn nhất của SQL. Ba khách ngủ đông, trong đó khách một không không hai mốt chưa có số điện thoại, tức là NULL. Danh sách con có một NULL.",
         "3 khách DORMANT, khách 100021 có mobile NULL: danh sách con chứa NULL.",
         [OUT("#ex-q, #ex-c1, #ex-c2, #ex-c3, " + ", ".join(f"#ex-q-{i}" for i in range(1, 8)), "fade", 0, 0.4), *reveal("ex-t", 3, 0.6, 0.5), IN("#ex-n1", "left", 8.0)]),
        ("Not In nghĩa là khác từng giá trị, mà so với NULL thì luôn là không biết. Nên cả biểu thức không bao giờ đúng, và kết quả không có dòng nào.",
         "x <> NULL luôn là UNKNOWN, nên NOT IN không bao giờ đúng.",
         [IN("#ex-f", "up", 0.4), IN("#ex-n2", "left", 5.0)]),
        ("Not In ra không dòng. Not Exists ra ba mươi tám khách. Thêm điều kiện loại NULL thì ra ba mươi hai. Ba cách viết, ba kết quả. Câu không có, hãy ưu tiên Not Exists.",
         "NOT IN: 0. NOT EXISTS: 38. NOT IN + IS NOT NULL: 32. Ưu tiên NOT EXISTS.",
         [OUT("#ex-t-h, #ex-t-1, #ex-t-2, #ex-t-3, #ex-n1, #ex-f, #ex-n2", "fade", 0, 0.4), IN("#ex-s1", "pop", 0.6), IN("#ex-s2", "pop", 3.2), IN("#ex-s3", "pop", 6.6),
          IN("#ex-tk", "left", 9.4)]),
    ]),
    # ------------------------------------------------------------ correlated
    dict(id="correlated", world=(1920, 1080), hud=hud("co", "Subquery tương quan", "Chạy lại cho từng dòng ngoài"), cam="".join([
        big_title("co", "Subquery tương quan", "Chạy lại cho từng dòng ngoài"),
        sqlbox("co-q", 100, 190, 1000, ["SELECT a.account_id, a.company_id", "FROM account a", "WHERE a.working_balance > (", "  SELECT avg(b.working_balance)",
                                        "  FROM account b", "  WHERE b.company_id = a.company_id", ");"], 26),
        chip("co-c1", 1180, 230, "Câu trong nhắc tới a.company_id", "cyan"),
        chip("co-c2", 1180, 320, "Nên không tách ra chạy riêng được", "amber"),
        tbl("co-t", 100, 560, [(230, True), (190, True), (230, False), (260, False), (130, False)],
            ["account_id", "chi nhánh", "số dư", "trung bình chi nhánh", "giữ?"],
            [["1000000002", "VN0010001", "5.088.114", "91.317.439", "không"], ["1000000008", "VN0010002", "10.176.229", "348.385.398", "không"],
             ["1000000029", "VN0010004", "493.756.000", "219.792.081", "giữ"], ["1000000040", "VN0010003", "10.176.229", "274.782.431", "không"],
             ["1000000062", "VN0010002", "3.052.868.789", "348.385.398", "giữ"], ["1000000069", "VN0010001", "517.967.000", "91.317.439", "giữ"]], 54, 25),
        chip("co-r", 1180, 590, "Mỗi dòng ngoài: câu trong chạy lại", "violet"),
        chip("co-n", 1180, 680, "Cả bảng: 22 tài khoản", "green"),
        chip("co-n2", 1180, 770, "Nhiều hơn 19, vì mỗi chi nhánh có trung bình riêng", "amber"),
    ]), beats=[
        ("Phần bốn. Subquery tương quan là câu con nhắc tới một cột của câu ngoài, nên nó phụ thuộc vào dòng đang xét.",
         "Phần 4: subquery tương quan phụ thuộc vào dòng đang xét của câu ngoài.",
         [TYPE("#co-big", 0.1, 0.06), IN("#co-bsub", "blur", 0.9), OUT("#co-big, #co-bsub", "zoom", 4.4), IN("#co-hud", "left", 5.0)]),
        ("Tài khoản nào có số dư lớn hơn trung bình của chính chi nhánh nó? Câu con nhắc tới chi nhánh của dòng ngoài, nên không tách ra chạy riêng được.",
         "Số dư lớn hơn trung bình của chính chi nhánh? Câu con dùng a.company_id.",
         [*typeq("co-q", 7, 0.3, 1.0), DIM("#co-q-1, #co-q-2, #co-q-3, #co-q-7", 7.6, 0.3), IN("#co-c1", "left", 6.8), IN("#co-c2", "left", 8.6)]),
        ("Về ý nghĩa, với mỗi dòng ngoài, câu con được tính lại. Mỗi chi nhánh có trung bình riêng, nên dòng thì giữ, dòng thì bỏ.",
         "Với mỗi dòng ngoài, câu con tính lại: trung bình riêng của chi nhánh đó.",
         [OUT("#co-c1, #co-c2", "fade", 0, 0.4), IN("#co-r", "left", 0.8),
          *reveal("co-t", 6, 1.6, 0.9)]),
        ("Toàn bảng có hai mươi hai tài khoản, nhiều hơn mười chín, vì mỗi chi nhánh có mức trung bình riêng. Đây là quy tắc về ý nghĩa, còn máy có thể tối ưu cách chạy thật.",
         "Cả bảng: 22 tài khoản. Máy có thể tối ưu, nhưng kết quả như thể chạy từng dòng.",
         [IN("#co-n", "left", 0.6), IN("#co-n2", "left", 3.4)]),
    ]),
    # ------------------------------------------------------------ derived-table
    dict(id="derived-table", world=(1920, 1080), hud=hud("dt", "Bảng dẫn xuất", "Subquery đứng trong FROM"), cam="".join([
        big_title("dt", "Bảng dẫn xuất", "Subquery đứng trong FROM"),
        sqlbox("dt-q", 100, 190, 1100, ["SELECT avg(t)", "FROM (", "  SELECT sum(working_balance) AS t", "  FROM account GROUP BY customer_id",
                                        ") x;"], 27),
        tbl("dt-t", 100, 520, [(230, True), (330, False)], ["customer_id", "t"],
            [["100001", "113.044.114"], ["100002", "34.000.000"], ["100003", "179.945.000"], [DOTS, DOTS]], 62, 27),
        chip("dt-c1", 100, 860, "Bảng x: 40 dòng, tổng mỗi khách", "cyan"),
        wires(arrow("dt-a", [(780, 640), (1040, 640)], "cyan")),
        step_box("dt-b2", 1080, 560, 740, "Câu ngoài: avg(t)", "433.555.732", "green"),
        chip("dt-c2", 1080, 740, "7 khách vượt mức (đều là doanh nghiệp)", "violet"),
        chip("dt-c3", 1080, 830, "Luôn đặt alias cho bảng dẫn xuất", "amber"),
        sqlbox("dt-qe", 100, 200, 1100, ["SELECT avg(sum(working_balance))", "FROM account GROUP BY customer_id;"], 27),
        el("dt-ee", 100, 370, 1500, None, "Hàm tổng hợp không lồng nhau: phải gom xong rồi mới tính tiếp", "err r", "font-size:30px"),
    ]), beats=[
        ("Phần năm. Subquery còn đứng được trong From, và đóng vai một bảng tạm. Gọi là bảng dẫn xuất.",
         "Phần 5: subquery trong FROM đóng vai bảng tạm, gọi là bảng dẫn xuất.",
         [TYPE("#dt-big", 0.1, 0.06), IN("#dt-bsub", "blur", 0.9), OUT("#dt-big, #dt-bsub", "zoom", 4.0), IN("#dt-hud", "left", 4.6)]),
        ("Cần tổng số dư mỗi khách, rồi lấy trung bình của các tổng đó. Không viết được Avg của Sum, vì hàm tổng hợp không lồng nhau.",
         "Trung bình của các tổng: avg(sum(...)) không viết trực tiếp được.",
         [*typeq("dt-qe", 2, 0.3, 0.8), IN("#dt-ee", "up", 4.8), SHAKE("#dt-ee", 5.4)]),
        ("Cách làm là gom nhóm trước, ở trong ngoặc. Ta được bảng x với bốn mươi dòng, mỗi khách một tổng. Rồi câu ngoài tính trung bình trên bảng đó.",
         "Gom nhóm trong ngoặc: bảng x có 40 dòng, rồi câu ngoài tính avg(t).",
         [OUT("#dt-qe, #dt-qe-1, #dt-qe-2, #dt-ee", "fade", 0, 0.4), *typeq("dt-q", 5, 0.6, 0.9), *reveal("dt-t", 4, 5.0, 0.35), IN("#dt-c1", "left", 6.8)]),
        ("Trung bình khoảng bốn trăm ba mươi ba triệu, và bảy khách vượt qua mức này. Nhớ đặt alias cho bảng dẫn xuất.",
         "Trung bình 433.555.732, có 7 khách vượt mức. Luôn đặt alias.",
         [*ARROW("dt-a", 0.2), IN("#dt-b2", "left", 1.2), IN("#dt-c2", "left", 3.6), IN("#dt-c3", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ cte
    dict(id="cte", world=(1920, 1080), hud=hud("ct", "CTE với WITH", "Đọc từ trên xuống dưới"), cam="".join([
        big_title("ct", "CTE với WITH", "Đọc từ trên xuống dưới"),
        sqlbox("ct-q", 100, 190, 1000, ["WITH branch_max AS (", "  SELECT company_id, max(working_balance) AS m",
                                        "  FROM account GROUP BY company_id", ")", "SELECT a.company_id, a.account_id,", "       a.working_balance",
                                        "FROM account a JOIN branch_max b", "  ON b.company_id = a.company_id", "  AND a.working_balance = b.m;"], 26),
        chip("ct-s1", 1180, 190, "Bước 1: đặt tên, branch_max", "cyan"),
        chip("ct-s2", 1180, 280, "Bước 2: dùng tên đó như một bảng", "green"),
        tbl("ct-t", 100, 630, [(200, True), (230, True), (330, False)], ["company_id", "account_id", "working_balance"],
            [["VN0010001", "1000000069", "517.967.000"], ["VN0010002", "1000000062", "3.052.868.789"], ["VN0010003", "1000000066", "1.777.312.000"],
             ["VN0010004", "1000000059", "3.042.221.015"], ["VN0010005", "1000000055", "1.063.934.000"]], 54, 25),
        chip("ct-n", 1180, 650, "5 dòng: số dư lớn nhất mỗi chi nhánh", "violet"),
        chip("ct-w1", 1180, 190, "Nhiều CTE: ngăn bằng dấu phẩy", "cyan"),
        chip("ct-w2", 1180, 280, "Dùng CTE khi: dùng lại nhiều lần,", "green"),
        chip("ct-w3", 1180, 370, "lồng hơn 2 tầng, hoặc cần đặt tên từng bước", "green"),
        chip("ct-w4", 1180, 460, "CTE chỉ sống trong một câu lệnh", "amber"),
    ]), beats=[
        ("Phần sáu. Cte là bảng tạm có tên, khai báo bằng With ở đầu câu lệnh. Nội dung giống bảng dẫn xuất, nhưng đọc từ trên xuống dưới.",
         "Phần 6: CTE khai báo bằng WITH ở đầu câu, đọc từ trên xuống dưới.",
         [TYPE("#ct-big", 0.1, 0.06), IN("#ct-bsub", "blur", 0.9), OUT("#ct-big, #ct-bsub", "zoom", 5.0), IN("#ct-hud", "left", 5.6)]),
        ("Tìm tài khoản có số dư lớn nhất mỗi chi nhánh. Bước một đặt tên branch max, lấy số dư lớn nhất theo chi nhánh. Bước hai nối ngược với bảng tài khoản.",
         "Bước 1: branch_max lấy max theo chi nhánh. Bước 2: nối ngược với account.",
         [*typeq("ct-q", 9, 0.3, 0.9), IN("#ct-s1", "left", 4.0), IN("#ct-s2", "left", 9.0), DIM("#ct-q-5, #ct-q-6, #ct-q-7, #ct-q-8, #ct-q-9", 4.0, 0.3)]),
        ("Kết quả là năm dòng, mỗi chi nhánh một tài khoản lớn nhất.",
         "5 dòng: tài khoản số dư lớn nhất của từng chi nhánh.",
         [DIM("#ct-q-5, #ct-q-6, #ct-q-7, #ct-q-8, #ct-q-9", 0.1, 1), *reveal("ct-t", 5, 0.4, 0.4), IN("#ct-n", "left", 3.2)]),
        ("Dùng CTE khi một kết quả được dùng nhiều lần, khi lồng hơn hai tầng, hoặc khi muốn đặt tên cho từng bước. Cte chỉ sống trong đúng câu lệnh đó, hết câu là biến mất.",
         "Dùng CTE khi cần dùng lại, lồng sâu, hoặc đặt tên từng bước. CTE chỉ sống trong một câu.",
         [OUT("#ct-q, #ct-s1, #ct-s2, #ct-n, " + ", ".join(f"#ct-q-{i}" for i in range(1, 10)) + ", " + tblids("ct-t", 5), "fade", 0, 0.4),
          IN("#ct-w1", "left", 0.8), IN("#ct-w2", "left", 3.0), IN("#ct-w3", "left", 4.4), IN("#ct-w4", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ four-ways
    dict(id="four-ways", world=(1920, 1080), hud=hud("fw", "Bốn cách viết", "Cùng một câu hỏi, 12 khách"), cam="".join([
        big_title("fw", "Bốn cách viết", "Cùng một câu hỏi, 12 khách"),
        el("fw-h", 0, 150, 1920, None, "Khách nào đang có khoản vay LIVE?", "h1 center r", "font-size:60px"),
        card4("fw-a", 235, 290, 340, 300, 30, [("quote", "IN", "WHERE id IN (SELECT ...)"), ("eq", "EXISTS", "WHERE EXISTS (SELECT 1 ...)"),
                                                ("split", "JOIN", "JOIN loan ON ... WHERE LIVE"), ("tree", "CTE", "WITH live AS (...)")]),
        chip("fw-r", 560, 680, "Cả bốn cùng ra 12 khách, từ 100002 đến 100039", "green"),
        el("fw-h2", 0, 150, 1920, None, "Chọn cách nào?", "h1 center r", "font-size:60px"),
        card4("fw-b", 235, 290, 340, 300, 30, [("quote", "Chỉ lọc", "IN hoặc EXISTS"), ("split", "Cần cột bảng kia", "JOIN, coi chừng nhân dòng"),
                                                ("shield", "Câu 'không có'", "NOT EXISTS, không NOT IN"), ("tree", "Nhiều bước", "CTE")]),
        chip("fw-t", 400, 680, "Cần so tốc độ: hãy đo, đừng đoán", "amber"),
    ]), beats=[
        ("Phần bảy. Cùng một câu hỏi, khách nào đang có khoản vay còn hiệu lực, viết được bốn cách: dùng In, dùng Exists, dùng Join, hoặc dùng bảng tạm.",
         "Phần 7: một câu hỏi, bốn cách viết: IN, EXISTS, JOIN và CTE.",
         [TYPE("#fw-big", 0.1, 0.06), IN("#fw-bsub", "blur", 0.9), OUT("#fw-big, #fw-bsub", "zoom", 4.4), IN("#fw-hud", "left", 5.0), IN("#fw-h", "up", 5.2)]),
        ("Cả bốn cách đã được chạy và so sánh, đều ra đúng mười hai khách.",
         "Cả bốn cách đều ra đúng 12 khách.",
         [IN("#fw-a0", "pop", 0.2), IN("#fw-a1", "pop", 0.7), IN("#fw-a2", "pop", 1.2), IN("#fw-a3", "pop", 1.7), IN("#fw-r", "left", 3.2)]),
        ("Chỉ cần lọc thì dùng In hoặc Exists. Cần cột của bảng kia thì Join, nhớ bẫy nhân dòng. Câu không có thì Not Exists. Nhiều bước thì Cte. Cần so tốc độ, hãy đo chứ đừng đoán.",
         "Chỉ lọc: IN hoặc EXISTS. Cần cột: JOIN. Không có: NOT EXISTS. Nhiều bước: CTE.",
         [OUT("#fw-h, #fw-a0, #fw-a1, #fw-a2, #fw-a3, #fw-r", "fade", 0, 0.4), IN("#fw-h2", "up", 0.5), IN("#fw-b0", "pop", 1.2), IN("#fw-b1", "pop", 3.8),
          IN("#fw-b2", "pop", 6.6), IN("#fw-b3", "pop", 9.0), IN("#fw-t", "left", 10.8)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("quote", "Vô hướng, IN", "Câu trong chạy trước, vô hướng chỉ một giá trị"),
                                                ("shield", "NOT EXISTS", "NOT IN gặp NULL thì ra 0 dòng"),
                                                ("share", "Tương quan", "Câu trong tính lại cho mỗi dòng ngoài"),
                                                ("tree", "CTE", "Đặt tên từng bước, đọc từ trên xuống")]),
        chip("ou-next", 380, 650, "Bài tiếp: UNION, INTERSECT và EXCEPT", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: câu trong chạy trước, và subquery vô hướng chỉ được trả về một giá trị. Not In gặp NULL thì không ra dòng nào, nên hãy dùng Not Exists. Subquery tương quan được tính lại cho mỗi dòng ngoài. Còn Cte giúp đặt tên cho từng bước.",
         "Câu trong chạy trước · NOT IN gặp NULL · tương quan chạy lại từng dòng · CTE đặt tên từng bước.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.6), IN("#ou-c2", "pop", 10.6), IN("#ou-c3", "pop", 14.0)]),
        ("Bài tiếp: các phép tập hợp, ghép và so sánh kết quả của nhiều câu truy vấn.", "Bài tiếp: UNION, INTERSECT và EXCEPT.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
