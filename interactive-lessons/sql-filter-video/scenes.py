"""SQL filter explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-filter.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
city = 'Hà Nội' -> 9 rows, 'hà nội' -> 0 rows, "Hà Nội" -> ERROR column "Hà Nội" does not exist;
Hà Nội OR Đà Nẵng AND ACTIVE -> 16 rows (extra: 100014 Hà Nội DORMANT), with parentheses -> 15 rows; NOT customer_status = 'ACTIVE' -> 5 rows (3 DORMANT, 2 CLOSED);
category_id IN (6001, 6006, 6012) -> 20 rows; stmt_entry amount BETWEEN 1000000 AND 5000000 -> 151, > and < -> 74, reversed BETWEEN -> 0;
short_name LIKE 'NGO%' -> 4 rows, LIKE 'ngo%' -> 0, ILIKE 'ngo%' -> 4;
mobile = NULL -> 0 rows, mobile IS NULL -> 6 rows (100005, 100021, 100022, 100025, 100030, 100031), stmt_entry ft_id IS NULL -> 686;
gender: 16 M, 16 F, 8 NULL; gender <> 'M' -> 16, ... OR gender IS NULL -> 24;
birth_date DESC LIMIT 5 -> five companies (NULL), DESC NULLS LAST -> 100018, 100003, 100013, 100020, 100026;
customer_id LIMIT 5 OFFSET 5 -> 100006..100010; city LIMIT 5 -> 100016, 100017, 100007, 100009, 100022 and OFFSET 5 -> 100007, 100017, 100009, 100016, 100037 (4 repeats; 10 Cần Thơ rows tie);
city, customer_id LIMIT 5 -> 100007, 100009, 100016, 100017, 100022 and OFFSET 5 -> 100023, 100030, 100031, 100034, 100037;
loan ORDER BY principal DESC, ld_id LIMIT 3 -> LD2400003, LD2400011 (800 trieu), LD2400012 (400 trieu).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<s>'[^']*'|\"[^\"]*\")|(?P<k>\b(?:SELECT|FROM|WHERE|AND|OR|NOT|IN|BETWEEN|ILIKE|LIKE|IS NOT NULL|IS NULL|NULL|ORDER BY|DESC|ASC|NULLS LAST|LIMIT|OFFSET)\b)"
    r"|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff")
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


def stat(id_, x, y, w, h, num, label, tone):
    col = "#ff8da0" if tone == "red" else "#9be37a"
    return el(id_, x, y, w, h, f'<div style="font:700 150px var(--mono);color:{col};line-height:1.1">{esc(num)}</div>'
              f'<div style="font:600 34px var(--font);color:#e6e9f0;margin-top:6px">{esc(label)}</div>',
              f"gbox {tone} r", "text-align:center;padding:26px 20px")


DOTS = "..."

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Lọc và sắp xếp dữ liệu", "eyebrow r"),
        el("hk-q", 0, 215, 1920, None, letters("Chỉ khác cặp ngoặc, vì sao 16 và 15 dòng?"), "h1 center r"),
        stat("hk-s1", 300, 400, 600, 330, "16", "WHERE a OR b AND c", "red"),
        stat("hk-s2", 1020, 400, 600, 330, "15", "WHERE (a OR b) AND c", "green"),
        tile("hk-tile", 400, 350, 220, "grid"),
        el("hk-word", 670, 380, 1200, None, letters("Lọc và sắp xếp"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "WHERE · AND OR · IN BETWEEN LIKE · IS NULL · ORDER BY · LIMIT", "kin-sub r"),
    ]), beats=[
        ("Hai câu lọc gần giống nhau, chỉ khác một cặp dấu ngoặc. Một câu ra mười sáu dòng, một câu ra mười lăm. Dòng thừa là ai?",
         "Hai câu lọc chỉ khác cặp ngoặc: một câu ra 16 dòng, một câu ra 15. Dòng thừa là ai?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-s1", "pop", 4.4), IN("#hk-s2", "pop", 6.4)]),
        ("Đó là một khách ngủ đông. Máy tính And trước Or, nên khách này lọt vào mà SQL không hề báo lỗi.",
         "Dòng thừa là một khách DORMANT: AND tính trước OR, SQL không báo lỗi.",
         [DIM("#hk-s2", 0.2, 0.25), PULSE("#hk-s1", 0.5)]),
        ("Hôm nay ta học lọc và sắp xếp dữ liệu, cùng những cái bẫy mà người mới nào cũng dính.",
         "Hôm nay: lọc và sắp xếp dữ liệu, cùng những cái bẫy hay gặp.",
         [OUT("#hk-eye, #hk-q, #hk-s1, #hk-s2", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ where-basic
    dict(id="where-basic", world=(1920, 1080), hud=hud("wb", "WHERE", "Giữ đúng những dòng cần"), cam="".join([
        big_title("wb", "WHERE", "Giữ đúng những dòng cần"),
        sqlbox("wb-q", 160, 190, 900, ["SELECT customer_id, short_name, city", "FROM customer", "WHERE city = 'Hà Nội';"]),
        tbl("wb-t", 160, 440, [(210, True), (520, False), (200, False)], ["customer_id", "short_name", "city"],
            [["100001", "LY HOANG LONG", "Hà Nội"], ["100002", "DUONG VAN AN", "Hà Nội"], ["100003", "NGO ANH TUAN", "Hà Nội"],
             ["100004", "HOANG QUOC BAO", "Hà Nội"], [DOTS, DOTS, DOTS]], 62, 27),
        chip("wb-c1", 1260, 440, "9 dòng khớp", "green"),
        chip("wb-c2", 1260, 530, "31 khách còn lại bị bỏ", "violet"),
        sqlbox("wb-qa", 120, 200, 820, ['WHERE city = "Hà Nội";']),
        el("wb-ea", 120, 330, 820, None, 'ERROR: column "Hà Nội" does not exist', "err r"),
        sqlbox("wb-qb", 1000, 200, 800, ["WHERE city = 'hà nội';"]),
        el("wb-eb", 1000, 330, 800, None, "0 dòng: hoa thường khác nhau", "err r"),
        chip("wb-t1", 120, 520, "Chuỗi chữ: nháy đơn. Nháy kép là tên cột.", "amber"),
        chip("wb-t2", 120, 610, "So sánh chuỗi phân biệt hoa thường.", "amber"),
    ]), beats=[
        ("Phần một. Where là bộ lọc: máy đi qua từng dòng, dòng nào thoả điều kiện thì giữ, không thoả thì bỏ.",
         "Phần 1: WHERE giữ dòng thoả điều kiện, bỏ các dòng còn lại.",
         [TYPE("#wb-big", 0.1, 0.06), IN("#wb-bsub", "blur", 0.9), OUT("#wb-big, #wb-bsub", "zoom", 3.4), IN("#wb-hud", "left", 4.0)]),
        ("Muốn lấy khách ở Hà Nội, viết Where, city bằng Hà Nội. Chuỗi chữ phải đặt trong nháy đơn.",
         "WHERE city = 'Hà Nội': chuỗi chữ đặt trong nháy đơn.",
         [*typeq("wb-q", 3, 0.3, 0.9), DIM("#wb-q-1, #wb-q-2", 4.0, 0.3)]),
        ("Kết quả có chín khách ở Hà Nội. Ba mươi mốt khách còn lại bị bỏ.",
         "9 dòng khớp, 31 khách còn lại bị bỏ.",
         [*reveal("wb-t", 5, 0.2, 0.35), IN("#wb-c1", "left", 2.8), IN("#wb-c2", "left", 3.8)]),
        ("Hai cái bẫy nhỏ. Nháy kép là tên cột, nên báo lỗi cột không tồn tại. Còn viết hà nội chữ thường thì ra không dòng nào, vì so sánh chuỗi phân biệt hoa thường.",
         'WHERE city = "Hà Nội" báo lỗi; city = \'hà nội\' ra 0 dòng.',
         [OUT("#wb-q, #wb-c1, #wb-c2, " + tblids("wb-t", 5), "fade", 0, 0.4), *typeq("wb-qa", 1, 0.6), IN("#wb-ea", "up", 1.8), SHAKE("#wb-ea", 2.4),
          *typeq("wb-qb", 1, 5.2), IN("#wb-eb", "up", 6.4), IN("#wb-t1", "left", 8.0), IN("#wb-t2", "left", 9.6)]),
    ]),
    # ------------------------------------------------------------ and-or-not
    dict(id="and-or-not", world=(1920, 1080), hud=hud("ao", "AND, OR, NOT", "AND được tính trước OR"), cam="".join([
        big_title("ao", "AND, OR, NOT", "AND được tính trước OR"),
        sqlbox("ao-qa", 100, 190, 900, ["SELECT customer_id, city, customer_status", "FROM customer", "WHERE city = 'Hà Nội' OR city = 'Đà Nẵng'",
                                         "  AND customer_status = 'ACTIVE';"], 27),
        tbl("ao-ta", 1020, 190, [(230, True), (210, False), (270, False)], ["customer_id", "city", "customer_status"],
            [[DOTS, DOTS, DOTS], ["100013", "Đà Nẵng", "ACTIVE"], ["100014", "Hà Nội", "DORMANT"], ["100019", "Đà Nẵng", "ACTIVE"]], 66, 27),
        el("ao-hl", 1010, 388, 730, 64, "", "hilite r", BAD),
        chip("ao-r1", 100, 520, "Máy đọc: Hà Nội HOẶC (Đà Nẵng VÀ ACTIVE)", "amber"),
        chip("ao-r2", 100, 610, "AND tính trước OR, như nhân trước cộng", "violet"),
        chip("ao-n16", 1020, 520, "16 dòng, thừa khách DORMANT", "red"),
        sqlbox("ao-qb", 100, 190, 1000, ["SELECT customer_id, city, customer_status", "FROM customer", "WHERE (city = 'Hà Nội' OR city = 'Đà Nẵng')",
                                          "  AND customer_status = 'ACTIVE';"], 27),
        tbl("ao-tb", 1130, 190, [(230, True), (210, False), (270, False)], ["customer_id", "city", "customer_status"],
            [[DOTS, DOTS, DOTS], ["100012", "Đà Nẵng", "ACTIVE"], ["100013", "Đà Nẵng", "ACTIVE"], ["100019", "Đà Nẵng", "ACTIVE"]], 66, 27),
        chip("ao-n15", 1130, 520, "15 dòng, không còn DORMANT", "green"),
        stat("ao-s1", 260, 230, 640, 330, "16", "Không có ngoặc", "red"),
        stat("ao-s2", 1020, 230, 640, 330, "15", "Có ngoặc", "green"),
        chip("ao-diff", 440, 620, "Dòng thừa: 100014, Hà Nội, DORMANT", "red"),
        chip("ao-tk", 440, 720, "Trộn AND với OR: luôn đặt ngoặc", "green"),
        sqlbox("ao-qn", 100, 190, 900, ["SELECT customer_id, customer_status", "FROM customer", "WHERE NOT customer_status = 'ACTIVE';"], 27),
        tbl("ao-tn", 1070, 190, [(230, True), (270, False)], ["customer_id", "customer_status"],
            [["100006", "CLOSED"], ["100014", "DORMANT"], ["100021", "DORMANT"], ["100023", "DORMANT"], ["100032", "CLOSED"]], 66, 27),
        chip("ao-nt", 100, 520, "NOT đảo điều kiện: 5 khách không ACTIVE", "cyan"),
    ]), beats=[
        ("Phần hai. Nối nhiều điều kiện bằng And, Or và Not. Bẫy lớn nằm ở thứ tự ưu tiên.",
         "Phần 2: AND, OR, NOT và thứ tự ưu tiên.",
         [TYPE("#ao-big", 0.1, 0.06), IN("#ao-bsub", "blur", 0.9), OUT("#ao-big, #ao-bsub", "zoom", 3.4), IN("#ao-hud", "left", 4.0)]),
        ("Thử câu này. Khách ở Hà Nội, hoặc khách ở Đà Nẵng, mà còn đang hoạt động.",
         "Ý định: khách ACTIVE ở Hà Nội hoặc Đà Nẵng.",
         [*typeq("ao-qa", 4, 0.3, 1.1)]),
        ("Nhưng And được tính trước Or. Máy đọc thành: Hà Nội, hoặc Đà Nẵng và đang hoạt động. Nên mọi khách Hà Nội đều vào, kể cả một khách ngủ đông. Kết quả là mười sáu dòng.",
         "AND tính trước: Hà Nội HOẶC (Đà Nẵng VÀ ACTIVE). Ra 16 dòng, thừa khách DORMANT.",
         [IN("#ao-r1", "left", 0.3), IN("#ao-r2", "left", 2.8), *reveal("ao-ta", 4, 5.0, 0.4), IN("#ao-hl", "fade", 7.0), IN("#ao-n16", "left", 7.6)]),
        ("Đặt dấu ngoặc quanh hai thành phố, máy mới hiểu đúng ý bạn. Kết quả còn mười lăm dòng, không còn khách ngủ đông.",
         "Thêm ngoặc quanh hai thành phố: 15 dòng, không còn DORMANT.",
         [OUT("#ao-qa, #ao-r1, #ao-r2, #ao-n16, #ao-hl, " + tblids("ao-ta", 4), "fade", 0, 0.4), *typeq("ao-qb", 4, 0.6, 0.9),
          *reveal("ao-tb", 4, 4.6, 0.4), IN("#ao-n15", "left", 7.0)]),
        ("So sánh lại. Không ngoặc ra mười sáu dòng, có ngoặc ra mười lăm. SQL không báo lỗi, chỉ trả kết quả sai một cách im lặng. Nên hễ trộn And với Or, hãy luôn đặt ngoặc.",
         "16 dòng so với 15 dòng. Trộn AND với OR: luôn đặt ngoặc.",
         [OUT("#ao-qb, #ao-n15, " + tblids("ao-tb", 4), "fade", 0, 0.4), IN("#ao-s1", "pop", 0.6), IN("#ao-s2", "pop", 2.4), IN("#ao-diff", "left", 4.4),
          IN("#ao-tk", "left", 8.0)]),
        ("Còn Not thì đảo điều kiện. Not Active cho năm khách: hai khách đã đóng, ba khách ngủ đông.",
         "NOT customer_status = 'ACTIVE': 5 khách (2 CLOSED, 3 DORMANT).",
         [OUT("#ao-s1, #ao-s2, #ao-diff, #ao-tk", "fade", 0, 0.4), *typeq("ao-qn", 3, 0.6, 0.8), *reveal("ao-tn", 5, 3.0, 0.35), IN("#ao-nt", "left", 5.6)]),
    ]),
    # ------------------------------------------------------------ in-between-like
    dict(id="in-between-like", world=(1920, 1080), hud=hud("ib", "IN, BETWEEN, LIKE", "Ba phép viết tắt và ba cái bẫy"), cam="".join([
        big_title("ib", "IN, BETWEEN, LIKE", "Ba phép viết tắt và ba cái bẫy"),
        sqlbox("ib-q1", 160, 190, 1000, ["SELECT account_id, customer_id, category_id", "FROM account", "WHERE category_id IN (6001, 6006, 6012);"], 27),
        tbl("ib-t1", 160, 440, [(250, True), (250, True), (250, True)], ["account_id", "customer_id", "category_id"],
            [["1000000002", "100001", "6012"], ["1000000006", "100004", "6006"], ["1000000008", "100005", "6012"], ["1000000010", "100006", "6001"],
             [DOTS, DOTS, DOTS]], 62, 27),
        chip("ib-c1", 1050, 440, "20 tài khoản tiết kiệm", "green"),
        chip("ib-c1b", 1050, 530, "Thay cho ba điều kiện nối bằng OR", "violet"),
        sqlbox("ib-b1", 120, 200, 1000, ["WHERE amount BETWEEN 1000000 AND 5000000;"]),
        chip("ib-r1", 1240, 225, "151 dòng", "green"),
        sqlbox("ib-b2", 120, 380, 1000, ["WHERE amount > 1000000 AND amount < 5000000;"]),
        chip("ib-r2", 1240, 405, "74 dòng", "amber"),
        sqlbox("ib-b3", 120, 560, 1000, ["WHERE amount BETWEEN 5000000 AND 1000000;"]),
        chip("ib-r3", 1240, 585, "0 dòng, không báo lỗi", "red"),
        chip("ib-d", 120, 740, "151 - 74 = 77 bút toán nằm đúng trên hai đầu mút", "amber"),
        sqlbox("ib-q2", 160, 190, 900, ["SELECT customer_id, short_name", "FROM customer", "WHERE short_name LIKE 'NGO%';"], 27),
        tbl("ib-t2", 160, 440, [(230, True), (500, False)], ["customer_id", "short_name"],
            [["100003", "NGO ANH TUAN"], ["100005", "NGO NGOC ANH"], ["100006", "NGO KHANH LINH"], ["100020", "NGO DIEU HA"]], 62, 27),
        chip("ib-c2", 980, 440, "4 khách", "green"),
        chip("ib-c2b", 980, 530, "% thay cho đoạn ký tự bất kỳ", "cyan"),
        sqlbox("ib-l1", 120, 200, 780, ["WHERE short_name LIKE 'ngo%';"]),
        chip("ib-lr1", 120, 340, "0 dòng", "red"),
        sqlbox("ib-l2", 1000, 200, 800, ["WHERE short_name ILIKE 'ngo%';"]),
        chip("ib-lr2", 1000, 340, "4 dòng", "green"),
        chip("ib-lt1", 120, 520, "LIKE phân biệt hoa thường", "amber"),
        chip("ib-lt2", 120, 610, "ILIKE không phân biệt, chỉ có ở PostgreSQL", "violet"),
    ]), beats=[
        ("Phần ba. Ba phép viết tắt giúp Where gọn hơn: In, Between và Like. Mỗi phép có một cái bẫy riêng.",
         "Phần 3: IN, BETWEEN, LIKE.",
         [TYPE("#ib-big", 0.1, 0.06), IN("#ib-bsub", "blur", 0.9), OUT("#ib-big, #ib-bsub", "zoom", 3.4), IN("#ib-hud", "left", 4.0)]),
        ("In kiểm tra giá trị có nằm trong một danh sách. Ba mã loại tài khoản cho hai mươi tài khoản tiết kiệm, thay cho ba điều kiện nối bằng Or.",
         "IN (6001, 6006, 6012): 20 tài khoản, thay cho ba điều kiện OR.",
         [*typeq("ib-q1", 3, 0.3, 0.9), *reveal("ib-t1", 5, 4.0, 0.35), IN("#ib-c1", "left", 6.8), IN("#ib-c1b", "left", 8.0)]),
        ("Between lấy cả hai đầu mút. Trên bảng bút toán, từ một triệu đến năm triệu cho một trăm năm mươi mốt dòng. Còn lớn hơn và nhỏ hơn thì chỉ có bảy mươi bốn dòng.",
         "BETWEEN lấy cả hai đầu: 151 dòng, còn > và < chỉ có 74.",
         [OUT("#ib-q1, #ib-c1, #ib-c1b, " + tblids("ib-t1", 5), "fade", 0, 0.4), *typeq("ib-b1", 1, 0.6), IN("#ib-r1", "pop", 2.4),
          *typeq("ib-b2", 1, 5.2), IN("#ib-r2", "pop", 7.2)]),
        ("Bảy mươi bảy dòng chênh là các bút toán đúng bằng một triệu hoặc năm triệu. Viết ngược, năm triệu trước, một triệu sau, thì ra không dòng nào, và cũng không có lỗi.",
         "77 dòng chênh nằm đúng trên hai đầu mút. Viết ngược: 0 dòng, không báo lỗi.",
         [IN("#ib-d", "left", 0.3), DIM("#ib-b1, #ib-r1, #ib-b2, #ib-r2", 3.8, 0.25), *typeq("ib-b3", 1, 4.4), IN("#ib-r3", "pop", 6.2), SHAKE("#ib-r3", 6.8)]),
        ("Like so khớp theo mẫu chữ. Dấu phần trăm thay cho một đoạn ký tự bất kỳ. Mẫu N G O phần trăm cho ra bốn khách.",
         "LIKE 'NGO%': dấu % thay cho đoạn ký tự bất kỳ, ra 4 khách.",
         [OUT("#ib-b1, #ib-r1, #ib-b2, #ib-r2, #ib-b3, #ib-r3, #ib-d", "fade", 0, 0.4), *typeq("ib-q2", 3, 0.6, 0.8), *reveal("ib-t2", 4, 3.4, 0.35),
          IN("#ib-c2", "left", 5.4), IN("#ib-c2b", "left", 6.4)]),
        ("Bẫy của Like: trong PostgreSQL, nó phân biệt hoa thường. Tên lưu chữ hoa, nên mẫu chữ thường ra không dòng. Dùng I Like thì ra lại bốn khách, nhưng I Like chỉ có ở PostgreSQL.",
         "LIKE 'ngo%' ra 0 dòng. ILIKE ra lại 4 khách, chỉ có ở PostgreSQL.",
         [OUT("#ib-q2, #ib-c2, #ib-c2b, " + tblids("ib-t2", 4), "fade", 0, 0.4), *typeq("ib-l1", 1, 0.6), IN("#ib-lr1", "pop", 2.2), SHAKE("#ib-lr1", 2.8),
          *typeq("ib-l2", 1, 5.4), IN("#ib-lr2", "pop", 7.0), IN("#ib-lt1", "left", 8.4), IN("#ib-lt2", "left", 10.0)]),
    ]),
    # ------------------------------------------------------------ is-null
    dict(id="is-null", world=(1920, 1080), hud=hud("nu", "IS NULL", "So sánh với NULL luôn cho UNKNOWN"), cam="".join([
        big_title("nu", "IS NULL", "So sánh với NULL luôn cho UNKNOWN"),
        sqlbox("nu-q1", 160, 190, 900, ["SELECT customer_id, short_name, mobile", "FROM customer", "WHERE mobile = NULL;"], 27),
        el("nu-e1", 160, 440, 900, None, "0 dòng, và không có lỗi nào", "err r"),
        chip("nu-u", 160, 540, "NULL = chưa biết, so sánh ra UNKNOWN", "violet"),
        chip("nu-s1", 160, 680, "TRUE: giữ dòng", "green"),
        chip("nu-s2", 600, 680, "FALSE: bỏ dòng", "red"),
        chip("nu-s3", 1040, 680, "UNKNOWN: cũng bỏ dòng", "amber"),
        sqlbox("nu-q2", 160, 190, 900, ["SELECT customer_id, short_name, mobile", "FROM customer", "WHERE mobile IS NULL;"], 27),
        tbl("nu-t", 160, 420, [(230, True), (500, False), (190, True)], ["customer_id", "short_name", "mobile"],
            [["100005", "NGO NGOC ANH", "NULL"], ["100021", "BUI THANH VAN", "NULL"], ["100022", "PHAM VAN AN", "NULL"], ["100025", "DANG THI MAI", "NULL"],
             ["100030", "DO QUOC BAO", "NULL"], ["100031", "BUI THUY DUONG", "NULL"]], 60, 26),
        chip("nu-c1", 1250, 420, "6 khách", "green"),
        chip("nu-c2", 1250, 510, "Ngược lại: IS NOT NULL", "cyan"),
        chip("nu-c3", 1250, 600, "stmt_entry: ft_id IS NULL = 686", "violet"),
        stat("nu-g1", 160, 190, 500, 250, "16", "Nam (M)", "green"),
        stat("nu-g2", 710, 190, 500, 250, "16", "Nữ (F)", "green"),
        stat("nu-g3", 1260, 190, 500, 250, "8", "Chưa có giới tính", "red"),
        sqlbox("nu-q3", 160, 520, 1000, ["WHERE gender <> 'M';"]),
        chip("nu-r3", 1260, 545, "16 dòng, rơi mất 8", "red"),
        sqlbox("nu-q4", 160, 690, 1200, ["WHERE gender <> 'M' OR gender IS NULL;"]),
        chip("nu-r4", 1400, 715, "24 dòng", "green"),
    ]), beats=[
        ("Phần bốn. Giá trị rỗng nghĩa là chưa biết, và đây là cái bẫy khi so sánh với nó.",
         "Phần 4: IS NULL và bẫy so sánh với NULL.",
         [TYPE("#nu-big", 0.1, 0.06), IN("#nu-bsub", "blur", 0.9), OUT("#nu-big, #nu-bsub", "zoom", 3.4), IN("#nu-hud", "left", 4.0)]),
        ("Có sáu khách chưa có số điện thoại. Nhưng Where mobile bằng rỗng lại ra không dòng nào, và cũng không báo lỗi.",
         "WHERE mobile = NULL: 0 dòng, không báo lỗi.",
         [*typeq("nu-q1", 3, 0.3, 0.9), IN("#nu-e1", "up", 5.0), SHAKE("#nu-e1", 5.6)]),
        ("Vì giá trị rỗng nghĩa là chưa biết. So sánh với một giá trị chưa biết cho kết quả thứ ba: không biết. Mà Where chỉ giữ những dòng cho kết quả đúng.",
         "NULL = chưa biết. Kết quả UNKNOWN thì WHERE bỏ dòng.",
         [IN("#nu-u", "left", 0.3), DIM("#nu-q1, #nu-e1", 1.0, 0.3), IN("#nu-s1", "left", 4.4), IN("#nu-s2", "left", 6.0), IN("#nu-s3", "left", 7.6)]),
        ("Cách đúng là Is Null. Câu này cho đủ sáu khách chưa có số điện thoại. Còn muốn lấy dòng đã có giá trị thì dùng Is Not Null.",
         "IS NULL cho 6 khách. IS NOT NULL lấy dòng đã có giá trị.",
         [OUT("#nu-q1, #nu-e1, #nu-u, #nu-s1, #nu-s2, #nu-s3", "fade", 0, 0.4), *typeq("nu-q2", 3, 0.6, 0.8), *reveal("nu-t", 6, 2.8, 0.25),
          IN("#nu-c1", "left", 4.6), IN("#nu-c2", "left", 6.0), IN("#nu-c3", "left", 7.4)]),
        ("Bẫy thứ hai: giá trị rỗng làm các phép khác cũng rơi mất dòng. Bảng có mười sáu nam, mười sáu nữ, và tám khách doanh nghiệp không có giới tính. Where gender khác M chỉ ra mười sáu dòng.",
         "16 nam, 16 nữ, 8 NULL. gender <> 'M' chỉ ra 16 dòng.",
         [OUT("#nu-q2, #nu-c1, #nu-c2, #nu-c3, " + tblids("nu-t", 6), "fade", 0, 0.4), IN("#nu-g1", "pop", 0.6), IN("#nu-g2", "pop", 2.0), IN("#nu-g3", "pop", 3.4),
          *typeq("nu-q3", 1, 6.2), IN("#nu-r3", "pop", 8.0)]),
        ("Muốn lấy mọi khách không phải nam, phải thêm Or gender Is Null. Khi đó mới ra hai mươi bốn dòng.",
         "Thêm OR gender IS NULL: 24 dòng.",
         [DIM("#nu-g1, #nu-g2, #nu-q3, #nu-r3", 0.2, 0.25), *typeq("nu-q4", 1, 0.6), IN("#nu-r4", "pop", 2.8)]),
    ]),
    # ------------------------------------------------------------ order-by
    dict(id="order-by", world=(1920, 1080), hud=hud("ob", "ORDER BY", "Thứ tự và vị trí của NULL"), cam="".join([
        big_title("ob", "ORDER BY", "Thứ tự và vị trí của NULL"),
        sqlbox("ob-q1", 160, 190, 1000, ["SELECT customer_id, short_name, birth_date", "FROM customer", "ORDER BY birth_date DESC", "LIMIT 5;"], 27),
        tbl("ob-t1", 160, 500, [(230, True), (640, False), (240, True)], ["customer_id", "short_name", "birth_date"],
            [["100036", "CONG TY CP THUC PHAM DONG XANH", "NULL"], ["100035", "CONG TY TNHH VAN TAI BINH AN", "NULL"],
             ["100034", "CONG TY CP XAY DUNG HAI DANG", "NULL"], ["100033", "CONG TY TNHH THUONG MAI SAO MAI", "NULL"],
             ["100037", "CONG TY TNHH CONG NGHE TAN VIET", "NULL"]], 58, 26),
        chip("ob-c1", 1340, 500, "Cả 5 dòng là công ty", "red"),
        chip("ob-c2", 1340, 590, "NULL được coi là lớn nhất", "amber"),
        chip("ob-c3", 1340, 680, "ASC: NULL cuối. DESC: NULL đầu.", "violet"),
        sqlbox("ob-q2", 160, 190, 1000, ["SELECT customer_id, short_name, birth_date", "FROM customer", "ORDER BY birth_date DESC NULLS LAST", "LIMIT 5;"], 27),
        tbl("ob-t2", 160, 500, [(230, True), (500, False), (240, True)], ["customer_id", "short_name", "birth_date"],
            [["100018", "HOANG GIA HUY", "2003-11-15"], ["100003", "NGO ANH TUAN", "2003-05-16"], ["100013", "DANG VAN AN", "2001-07-13"],
             ["100020", "NGO DIEU HA", "1998-10-08"], ["100026", "DUONG TRONG NGHIA", "1998-04-12"]], 58, 26),
        chip("ob-c4", 1340, 500, "NULLS LAST đẩy NULL xuống cuối", "green"),
        chip("ob-c5", 1340, 590, "Đúng 5 khách trẻ nhất", "green"),
        sqlbox("ob-q3", 160, 230, 1000, ["ORDER BY city, birth_date DESC;"]),
        chip("ob-m1", 160, 400, "Xếp theo cột đầu, hoà thì xét cột sau. Mỗi cột có ASC hoặc DESC riêng.", "cyan"),
        chip("ob-m3", 160, 580, "Không có ORDER BY thì SQL không hứa thứ tự nào", "amber"),
    ]), beats=[
        ("Phần năm. Mặc định SQL không hứa thứ tự các dòng. Muốn có thứ tự, bạn phải viết Order By.",
         "Phần 5: ORDER BY. Không có ORDER BY, SQL không hứa thứ tự.",
         [TYPE("#ob-big", 0.1, 0.06), IN("#ob-bsub", "blur", 0.9), OUT("#ob-big, #ob-bsub", "zoom", 3.4), IN("#ob-hud", "left", 4.0)]),
        ("Muốn tìm năm khách trẻ nhất, bạn viết Order By ngày sinh giảm dần, Limit năm. Nhưng cả năm dòng trả về đều là công ty, vì ngày sinh rỗng.",
         "ORDER BY birth_date DESC LIMIT 5: cả 5 dòng là công ty, ngày sinh NULL.",
         [*typeq("ob-q1", 4, 0.3, 0.9), *reveal("ob-t1", 5, 4.4, 0.4), IN("#ob-c1", "left", 7.4)]),
        ("Lý do là PostgreSQL coi giá trị rỗng là lớn nhất. Xếp tăng dần thì rỗng đứng cuối, xếp giảm dần thì rỗng đứng đầu.",
         "PostgreSQL coi NULL là lớn nhất: ASC thì NULL cuối, DESC thì NULL đầu.",
         [DIM("#ob-q1, #ob-c1, " + tblids("ob-t1", 5), 0.2, 0.22), IN("#ob-c2", "left", 0.8), IN("#ob-c3", "left", 3.6)]),
        ("Thêm Nulls Last thì giá trị rỗng bị đẩy xuống cuối, và năm khách trẻ nhất hiện ra. Hoàng Gia Huy, sinh năm hai nghìn không trăm linh ba, đứng đầu.",
         "Thêm NULLS LAST: đúng 5 khách trẻ nhất, HOANG GIA HUY đứng đầu.",
         [OUT("#ob-q1, #ob-c1, #ob-c2, #ob-c3, " + tblids("ob-t1", 5), "fade", 0, 0.4), *typeq("ob-q2", 4, 0.6, 0.9), *reveal("ob-t2", 5, 4.6, 0.4),
          IN("#ob-c4", "left", 7.2), IN("#ob-c5", "left", 8.4)]),
        ("Order By nhận nhiều cột, mỗi cột có chiều riêng: xếp theo thành phố, rồi ngày sinh mới nhất lên trước.",
         "ORDER BY city, birth_date DESC: nhiều cột, mỗi cột một chiều.",
         [OUT("#ob-q2, #ob-c4, #ob-c5, " + tblids("ob-t2", 5), "fade", 0, 0.4), *typeq("ob-q3", 1, 0.6), IN("#ob-m1", "left", 2.4), IN("#ob-m3", "left", 4.6)]),
    ]),
    # ------------------------------------------------------------ limit-offset
    dict(id="limit-offset", world=(1920, 1080), hud=hud("lo", "LIMIT, OFFSET", "Chia trang không lặp dòng"), cam="".join([
        big_title("lo", "LIMIT, OFFSET", "Chia trang không lặp dòng"),
        sqlbox("lo-q1", 160, 190, 1000, ["SELECT customer_id, short_name", "FROM customer", "ORDER BY customer_id", "LIMIT 5 OFFSET 5;"], 27),
        tbl("lo-t1", 160, 480, [(230, True), (500, False)], ["customer_id", "short_name"],
            [["100006", "NGO KHANH LINH"], ["100007", "DO THANH VAN"], ["100008", "LE KHANH LINH"], ["100009", "VU HONG NHUNG"], ["100010", "PHAM THANH TUNG"]], 62, 27),
        chip("lo-c1", 980, 480, "LIMIT n OFFSET (p - 1) * n", "violet"),
        chip("lo-c2", 980, 570, "Trang 2, mỗi trang 5 khách", "cyan"),
        sqlbox("lo-ql", 120, 190, 800, ["SELECT customer_id, city", "FROM customer ORDER BY city", "LIMIT 5;"], 26),
        sqlbox("lo-qr", 1000, 190, 800, ["SELECT customer_id, city", "FROM customer ORDER BY city", "LIMIT 5 OFFSET 5;"], 26),
        tbl("lo-tl", 120, 440, [(230, True), (220, False)], ["customer_id", "city"],
            [["100016", "Cần Thơ"], ["100017", "Cần Thơ"], ["100007", "Cần Thơ"], ["100009", "Cần Thơ"], ["100022", "Cần Thơ"]], 62, 27),
        tbl("lo-tr", 1000, 440, [(230, True), (220, False)], ["customer_id", "city"],
            [["100007", "Cần Thơ"], ["100017", "Cần Thơ"], ["100009", "Cần Thơ"], ["100016", "Cần Thơ"], ["100037", "Cần Thơ"]], 62, 27),
        *[el(f"lo-hl{i}", 112, 440 + i * 62 - 3, 466, 62, "", "hilite r", BAD) for i in (1, 2, 3, 4)],
        *[el(f"lo-hr{i}", 992, 440 + i * 62 - 3, 466, 62, "", "hilite r", BAD) for i in (1, 2, 3, 4)],
        chip("lo-w", 120, 880, "4 khách xuất hiện ở cả hai trang", "red"),
        chip("lo-w2", 700, 880, "10 khách Cần Thơ hoà nhau về city", "amber"),
        sqlbox("lo-ql2", 120, 190, 800, ["SELECT customer_id, city", "FROM customer ORDER BY city, customer_id", "LIMIT 5;"], 26),
        sqlbox("lo-qr2", 1000, 190, 800, ["SELECT customer_id, city", "FROM customer ORDER BY city, customer_id", "LIMIT 5 OFFSET 5;"], 26),
        tbl("lo-tl2", 120, 440, [(230, True), (220, False)], ["customer_id", "city"],
            [["100007", "Cần Thơ"], ["100009", "Cần Thơ"], ["100016", "Cần Thơ"], ["100017", "Cần Thơ"], ["100022", "Cần Thơ"]], 62, 27),
        tbl("lo-tr2", 1000, 440, [(230, True), (220, False)], ["customer_id", "city"],
            [["100023", "Cần Thơ"], ["100030", "Cần Thơ"], ["100031", "Cần Thơ"], ["100034", "Cần Thơ"], ["100037", "Cần Thơ"]], 62, 27),
        chip("lo-ok", 120, 880, "Thứ tự duy nhất: hai trang không còn lặp", "green"),
        sqlbox("lo-q3", 160, 190, 1000, ["SELECT ld_id, principal", "FROM loan", "ORDER BY principal DESC, ld_id", "LIMIT 3;"], 27),
        tbl("lo-t3", 160, 480, [(260, True), (360, True)], ["ld_id", "principal"],
            [["LD2400003", "800000000.00"], ["LD2400011", "800000000.00"], ["LD2400012", "400000000.00"]], 62, 27),
        chip("lo-n1", 900, 480, "Hai khoản 800 triệu hoà nhau", "amber"),
        chip("lo-n2", 900, 570, "Vị trí thứ 3 cũng có hai khoản 400 triệu", "amber"),
        chip("lo-n3", 900, 660, "Thêm ld_id để top N luôn như nhau", "green"),
    ]), beats=[
        ("Phần sáu. Limit lấy n dòng đầu, Offset bỏ qua m dòng đầu. Ghép lại là phân trang.",
         "Phần 6: LIMIT lấy n dòng đầu, OFFSET bỏ qua m dòng đầu.",
         [TYPE("#lo-big", 0.1, 0.06), IN("#lo-bsub", "blur", 0.9), OUT("#lo-big, #lo-bsub", "zoom", 3.4), IN("#lo-hud", "left", 4.0)]),
        ("Trang hai, mỗi trang năm khách, thì bỏ qua năm dòng rồi lấy năm dòng kế tiếp. Công thức: Limit n, Offset trang trừ một nhân n.",
         "Trang 2, mỗi trang 5 khách: LIMIT 5 OFFSET 5.",
         [*typeq("lo-q1", 4, 0.3, 0.9), *reveal("lo-t1", 5, 4.2, 0.35), IN("#lo-c1", "left", 6.0), IN("#lo-c2", "left", 7.2)]),
        ("Bẫy: sắp xếp theo thành phố, mà rất nhiều khách trùng thành phố. Đây là trang một và trang hai, và bạn thấy các mã khách quen quen.",
         "ORDER BY city LIMIT 5 và LIMIT 5 OFFSET 5: trang 1 và trang 2.",
         [OUT("#lo-q1, #lo-c1, #lo-c2, " + tblids("lo-t1", 5), "fade", 0, 0.4), *typeq("lo-ql", 3, 0.6, 0.7), *reveal("lo-tl", 5, 2.8, 0.3),
          *typeq("lo-qr", 3, 5.0, 0.6), *reveal("lo-tr", 5, 6.8, 0.25)]),
        ("Bốn khách xuất hiện ở cả hai trang. Lý do là mười khách Cần Thơ hoà nhau, và SQL không hứa thứ tự giữa các dòng hoà.",
         "4 khách lặp ở cả hai trang vì 10 khách Cần Thơ hoà nhau.",
         [*[IN(f"#lo-hl{i}", "fade", 0.3 + i * 0.25) for i in (1, 2, 3, 4)], *[IN(f"#lo-hr{i}", "fade", 1.6 + i * 0.25) for i in (1, 2, 3, 4)],
          IN("#lo-w", "left", 3.6), IN("#lo-w2", "left", 6.2)]),
        ("Cách sửa là thêm khoá chính làm cột sắp xếp cuối cùng: Order By city, customer id. Thứ tự giờ là duy nhất, hai trang không còn chồng lên nhau.",
         "ORDER BY city, customer_id: thứ tự duy nhất, hai trang không lặp.",
         [OUT("#lo-ql, #lo-qr, #lo-w, #lo-w2, " + tblids("lo-tl", 5) + ", " + tblids("lo-tr", 5) + ", "
              + ", ".join(f"#lo-hl{i}, #lo-hr{i}" for i in (1, 2, 3, 4)), "fade", 0, 0.4),
          *typeq("lo-ql2", 3, 0.6, 0.7), *reveal("lo-tl2", 5, 2.8, 0.3), *typeq("lo-qr2", 3, 5.0, 0.7), *reveal("lo-tr2", 5, 7.0, 0.3), IN("#lo-ok", "left", 9.2)]),
        ("Cùng lý do, top N cũng cần cột phá hoà. Hai khoản vay tám trăm triệu hoà nhau, nên thêm mã khoản vay để kết quả luôn giống nhau.",
         "Top N cũng cần cột phá hoà: ORDER BY principal DESC, ld_id.",
         [OUT("#lo-ql2, #lo-qr2, #lo-ok, " + tblids("lo-tl2", 5) + ", " + tblids("lo-tr2", 5), "fade", 0, 0.4), *typeq("lo-q3", 4, 0.6, 0.9), *reveal("lo-t3", 3, 3.8, 0.35),
          IN("#lo-n1", "left", 5.4), IN("#lo-n2", "left", 6.4), IN("#lo-n3", "left", 7.6)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("eq", "WHERE, AND, OR", "AND tính trước OR, nên đặt ngoặc"),
                                                ("split", "IN, BETWEEN, LIKE", "BETWEEN lấy cả hai đầu mút"),
                                                ("quote", "IS NULL", "so sánh với NULL luôn UNKNOWN"),
                                                ("hash", "ORDER BY, LIMIT", "thêm khoá chính để phá hoà")]),
        chip("ou-next", 460, 650, "Bài tiếp: Hàm tổng hợp, GROUP BY và HAVING", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: And tính trước Or, nên trộn hai phép này thì luôn đặt ngoặc. Between lấy cả hai đầu mút. So sánh với giá trị rỗng phải dùng Is Null. Còn Order By và Limit cần thêm khoá chính để các trang không lặp dòng.",
         "AND tính trước OR · BETWEEN lấy hai đầu · IS NULL · ORDER BY thêm khoá chính.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.0), IN("#ou-c2", "pop", 8.8), IN("#ou-c3", "pop", 12.0)]),
        ("Bài tiếp: hàm tổng hợp và gom nhóm.", "Bài tiếp: Hàm tổng hợp, GROUP BY và HAVING.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
