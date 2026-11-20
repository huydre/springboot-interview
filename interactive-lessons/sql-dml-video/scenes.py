"""SQL DML explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-dml.ts. Every statement and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset, fresh data per call):
currency 4 rows (CHF, EUR, GBP, JPY, USD, VND after INSERT of GBP and CHF = 6); UPDATE account SET status = 'CLOSED' affects 85 rows (83 OPEN + 2 CLOSED before);
with WHERE account_id = '1000000003' affects 1; UPDATE customer SET customer_status = 'DORMANT' affects 40; DELETE FROM stmt_entry affects 932;
DELETE ... WHERE stmt_entry_id = 929 RETURNING -> 929, 1000000003, 2000000.00; new stmt_entry row (ft_id omitted) gets stmt_entry_id 933;
dormant customers 100014, 100021, 100023; constraint errors: company_pkey, account_customer_id_fkey (insert and delete), customer_customer_status_check,
null value in column "open_date" of relation "company"; stmt_entry_ft_id_fkey; DETAIL lines (Key (...)) quoted from the lesson;
balances 1000000003 = 75666000.00 and 1000000011 = 51000000.00 (total 126666000), after transfer 70666000.00 and 56000000.00; SELECT 1 / 0 -> division by zero;
account 1000000003: 15 stmt_entry rows, SUM 75666000.00; funds_transfer DONE 123, FAILED 3, PENDING 6.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<c>--[^\n]*)|(?P<s>'[^']*')|(?P<k>\b(?:INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|RETURNING|BEGIN|COMMIT|ROLLBACK|SELECT|FROM|WHERE|AND|ORDER BY|GROUP BY|HAVING|LIMIT|DISTINCT|AS|DESC)\b)"
    r"|(?P<f>\b(?:COUNT|SUM|AVG|MIN|MAX)\b(?=\())|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(c="#7b8194", s="#a7f3d0", k="#c4b5fd", n="#9cc3ff", f="#fcd34d")


def sqlhl(line):
    out = []
    for m in SQL_TOKEN.finditer(line):
        kind, text = m.lastgroup, esc(m.group())
        out.append(text if kind == "x" else f'<span style="color:{SQL_COLOR[kind]}">{text}</span>')
    return "".join(out)


def sqlbox(id_, x, y, w, lines, size=27):
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


def sel_tbl(prefix, n):
    return ", ".join([f"#{prefix}-h"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def sel_q(prefix, n):
    return ", ".join([f"#{prefix}"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def type_q(prefix, n, d0=0.3, step=1.2):
    """Reveal an sqlbox: the card, then each clause line."""
    return [IN(f"#{prefix}", "up", d0, 0.4)] + [IN(f"#{prefix}-{i}", "type1", d0 + 0.3 + (i - 1) * step, 0.3) for i in range(1, n + 1)]


def show_tbl(prefix, n, d0=0.3, step=0.5):
    return [IN(f"#{prefix}-h", "left", d0)] + [IN(f"#{prefix}-{i}", "left", d0 + 0.5 + (i - 1) * step) for i in range(1, n + 1)]


def title_beat(p, ):
    return [TYPE(f"#{p}-big", 0.1, 0.06), IN(f"#{p}-bsub", "blur", 0.9), OUT(f"#{p}-big, #{p}-bsub", "zoom", 3.4), IN(f"#{p}-hud", "left", 4.0)]


def errbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r")


def okbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r",
              "color:#9be37a;border-color:var(--green);background:linear-gradient(165deg,rgba(74,222,128,.16),rgba(6,24,12,.85));box-shadow:none")




def errmsg(id_, x, y, w, msg, detail=""):
    d = f'<br><span style="font-size:25px;opacity:.78">{esc(detail)}</span>' if detail else ""
    return el(id_, x, y, w, None, f"ERROR: {esc(msg)}{d}", "err r", "line-height:1.5;box-sizing:border-box")


def acct(id_, x, y, name, num):
    """Account card: the label is fixed, the balance is a separate element swapped per state."""
    return box(id_, x, y, 520, 170, f'<div style="position:absolute;top:16px;left:0;right:0;text-align:center;font:700 27px var(--font)">{esc(name)}</div>'
               f'<div style="position:absolute;bottom:14px;left:0;right:0;text-align:center;font:500 22px var(--mono);opacity:.6">{num}</div>', "cyan")


def bal(id_, x, y, text, color="#fff"):
    return el(id_, x, y, 520, None, text, "r", f"text-align:center;font:700 50px var(--mono);color:{color}")


UPD_A = ["UPDATE account SET working_balance = working_balance - 5000000", "   WHERE account_id = '1000000003';"]
UPD_B = ["UPDATE account SET working_balance = working_balance + 5000000", "   WHERE account_id = '1000000011';"]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Chuyển khoản trong ngân hàng T24", "eyebrow r"),
        el("hk-q", 0, 215, 1920, None, letters("Chuyển 5.000.000 đồng, máy chủ sập giữa chừng?"), "h1 center r", "font-size:64px"),
        acct("hk-a", 170, 440, "Tài khoản A", "1000000003"), bal("hk-av", 170, 505, "75.666.000"),
        acct("hk-b", 1230, 440, "Tài khoản B", "1000000011"), bal("hk-bv", 1230, 505, "51.000.000"),
        wires(arrow("hk-ar", [(720, 525), (1180, 525)], "amber")),
        chip("hk-l1", 790, 450, "Lệnh 1: trừ ở A", "cyan"),
        chip("hk-l2", 790, 580, "Lệnh 2: cộng ở B", "cyan"),
        el("hk-x", 0, 760, 1920, None, "Sập sau lệnh 1: tiền đã rời A, chưa tới B", "lbl r", "text-align:center;font-size:40px;color:#ff8da0"),
        tile("hk-tile", 330, 350, 220, "grid"),
        el("hk-word", 600, 380, 1300, None, letters("INSERT UPDATE DELETE"), "h1 wordmark r", "text-align:left;white-space:nowrap;font-size:84px"),
        el("hk-sub", 0, 680, 1920, None, "Thêm · Sửa · Xoá · Transaction", "kin-sub r"),
    ]), beats=[
        ("Chuyển năm triệu đồng từ tài khoản A sang tài khoản B cần hai lệnh. Lệnh một trừ tiền ở A, lệnh hai cộng tiền ở B.",
         "Chuyển 5.000.000 đồng cần hai lệnh: trừ ở A, cộng ở B.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-a", "up", 3.0), IN("#hk-av", "fade", 3.4), IN("#hk-b", "up", 3.4), IN("#hk-bv", "fade", 3.8),
          *ARROW("hk-ar", 5.0, 0.8), IN("#hk-l1", "left", 6.0), IN("#hk-l2", "left", 8.0)]),
        ("Nếu máy chủ sập đúng giữa hai lệnh, tiền đã rời tài khoản A mà chưa đến được B. Năm triệu biến mất.",
         "Sập giữa hai lệnh: tiền đã rời A, chưa tới B.",
         [IN("#hk-x", "up", 2.8), SHAKE("#hk-x", 3.6)]),
        ("Hôm nay ta học thêm, sửa, xoá dữ liệu, rồi dùng transaction để chuyện đó không bao giờ xảy ra.",
         "Hôm nay: INSERT, UPDATE, DELETE và transaction.",
         [OUT("#hk-eye, #hk-q, #hk-a, #hk-av, #hk-b, #hk-bv, #hk-l1, #hk-l2, #hk-x, #hk-ar", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7),
          TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.8)]),
    ]),
    # ------------------------------------------------------------ insert
    dict(id="insert", world=(1920, 1080), hud=hud("in", "INSERT", "Thêm dòng mới vào bảng"), cam="".join([
        big_title("in", "INSERT", "Thêm dòng mới vào cuối bảng"),
        sqlbox("in-q", 120, 190, 1150, ["INSERT INTO currency (ccy, name, decimals)", "VALUES ('GBP', 'Bảng Anh', 2),", "       ('CHF', 'Franc Thụy Sĩ', 2);"]),
        chip("in-ok", 1320, 220, "Ảnh hưởng 2 dòng", "green"),
        tbl("in-t", 120, 450, [(200, True), (420, False), (200, True)], ["ccy", "name", "decimals"],
            [["CHF", "Franc Thụy Sĩ", "2"], ["EUR", "Euro", "2"], ["GBP", "Bảng Anh", "2"], ["JPY", "Yên Nhật", "0"], ["USD", "Đô la Mỹ", "2"], ["VND", "Đồng Việt Nam", "0"]], 62, 28),
        chip("in-n", 1100, 520, "Bảng currency: từ 4 dòng lên 6 dòng", "cyan"),
        sqlbox("in-q2", 120, 190, 1250, ["INSERT INTO dormant_customer (customer_id, full_name, city)", "SELECT customer_id, full_name, city", "FROM customer", "WHERE customer_status = 'DORMANT';"]),
        tbl("in-u", 120, 500, [(220, True), (400, False), (300, False)], ["customer_id", "full_name", "city"],
            [["100014", "Dương Hồng Nhung", "Hà Nội"], ["100021", "Bùi Thanh Vân", "Hải Phòng"], ["100023", "Hoàng Mỹ Linh", "Cần Thơ"]], 66, 28),
        chip("in-s", 1200, 420, "Số cột và kiểu phải khớp bảng đích", "violet"),
        chip("in-b1", 120, 250, "Giá trị phải đúng thứ tự với danh sách cột", "red", 900),
        chip("in-b2", 120, 350, "Chuỗi dùng nháy đơn '...', nháy kép là tên cột", "red", 900),
        chip("in-b3", 120, 450, "Cột NOT NULL không có mặc định mà bỏ trống: bị từ chối", "red", 900),
        sqlbox("in-q3", 120, 190, 1300, ["INSERT INTO stmt_entry (account_id, amount, txn_code,", "                        booking_date, value_date)",
                                          "VALUES ('1000000003', 1, '201', '2024-12-31', '2024-12-31')", "RETURNING stmt_entry_id;"]),
        tbl("in-r", 120, 500, [(300, True)], ["stmt_entry_id"], [["933"]], 66, 30),
        chip("in-id", 560, 510, "Cột tự tăng: đừng điền, PostgreSQL tự cấp. Bảng có 932 dòng, dòng mới là 933", "amber"),
    ]), beats=[
        ("Phần một. Insert thêm một dòng mới vào cuối bảng, giống như ghi thêm một dòng vào sổ.",
         "Phần 1: INSERT thêm dòng mới vào cuối bảng.",
         title_beat("in")),
        ("Luôn liệt kê tên cột, rồi viết giá trị theo đúng thứ tự. Muốn thêm nhiều dòng một lệnh, viết nhiều bộ ngoặc cách nhau dấu phẩy.",
         "Liệt kê tên cột, rồi VALUES. Nhiều dòng: nhiều bộ ngoặc cách nhau dấu phẩy.",
         type_q("in-q", 3, 0.3, 2.2) + [IN("#in-ok", "left", 7.5)]),
        ("Bảng tiền tệ từ bốn dòng lên sáu dòng: thêm Bảng Anh và Franc Thụy Sĩ.",
         "Bảng currency: 4 dòng lên 6 dòng.",
         [DIM("#in-q, #in-q-1, #in-q-2, #in-q-3", 0, 0.15)] + show_tbl("in-t", 6, 0.3, 0.5) + [IN("#in-n", "left", 3.8)]),
        ("Thay Values bằng một câu Select, thì mọi dòng kết quả được chèn vào bảng đích. Đây là cách sao chép dữ liệu giữa các bảng.",
         "INSERT ... SELECT: chèn mọi dòng kết quả vào bảng đích.",
         [OUT(sel_q("in-q", 3) + ", #in-ok, #in-n, " + sel_tbl("in-t", 6), "fade", 0, 0.4)] + type_q("in-q2", 4, 0.6, 1.4) + show_tbl("in-u", 3, 6.0, 0.5) + [IN("#in-s", "left", 8.0)]),
        ("Ba bẫy hay gặp. Một, giá trị sai thứ tự so với cột. Hai, chuỗi phải dùng nháy đơn. Ba, cột bắt buộc không có giá trị mặc định mà bỏ trống thì lệnh bị từ chối.",
         "Ba bẫy: sai thứ tự, nháy kép thay nháy đơn, bỏ trống cột NOT NULL.",
         [OUT(sel_q("in-q2", 4) + ", #in-s, " + sel_tbl("in-u", 3), "fade", 0, 0.4), IN("#in-b1", "left", 0.8), IN("#in-b2", "left", 4.3), IN("#in-b3", "left", 8.0)]),
        ("Riêng cột tự tăng thì đừng điền. PostgreSQL tự cấp số tiếp theo: bảng đang có chín trăm ba mươi hai bút toán, nên dòng mới nhận số chín trăm ba mươi ba.",
         "Cột tự tăng: đừng điền. Dòng mới nhận số 933.",
         [OUT("#in-b1, #in-b2, #in-b3", "fade", 0, 0.4)] + type_q("in-q3", 4, 0.6, 1.3) + show_tbl("in-r", 1, 6.5) + [IN("#in-id", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ update
    dict(id="update", world=(1920, 1080), hud=hud("up", "UPDATE", "Sửa dòng đã có, và bẫy quên WHERE"), cam="".join([
        big_title("up", "UPDATE", "Sửa dòng đã có, và cái bẫy quên WHERE"),
        sqlbox("up-q", 120, 190, 1000, ["UPDATE account", "SET status = 'CLOSED'", "WHERE account_id = '1000000003';"]),
        chip("up-r1", 1200, 260, "Ảnh hưởng 1 dòng", "green"),
        sqlbox("up-q2", 120, 190, 1000, ["UPDATE account", "SET status = 'CLOSED';"]),
        chip("up-r2", 1200, 220, "Ảnh hưởng 85 dòng", "red"),
        el("up-w", 1200, 330, 600, None, "Không có WHERE: mọi dòng đều bị sửa", "lbl r", "font-size:30px;color:#ff8da0"),
        box("up-b", 120, 470, 560, 200, '<div style="font:700 30px var(--font)">Trước</div><div style="font:600 36px var(--mono)">OPEN 83 · CLOSED 2</div>', "cyan", "col"),
        box("up-a", 880, 470, 560, 200, '<div style="font:700 30px var(--font)">Sau</div><div style="font:600 36px var(--mono);color:#ff8da0">OPEN 0 · CLOSED 85</div>', "red", "col"),
        wires(arrow("up-ar", [(700, 570), (860, 570)], "red")),
        chip("up-c", 120, 730, "UPDATE customer SET customer_status = 'DORMANT': cả 40 khách ngủ đông", "red"),
        chip("up-s1", 120, 300, "1. SELECT COUNT(*) với đúng điều kiện WHERE", "cyan", 800),
        chip("up-s2", 120, 410, "2. Số dòng có hợp lý không? Định sửa 1 mà thấy 40 là sai", "amber", 1100),
        chip("up-s3", 120, 520, "3. Đổi SELECT thành UPDATE rồi chạy", "green", 800),
    ]), beats=[
        ("Phần hai. Update sửa các dòng đã có. Nhưng nó có một cái bẫy nổi tiếng.",
         "Phần 2: UPDATE sửa dòng đã có, và bẫy quên WHERE.",
         title_beat("up")),
        ("Mệnh đề Set nói cột nào đổi thành giá trị gì. Mệnh đề Where nói dòng nào bị sửa. Lệnh này đóng đúng một tài khoản.",
         "SET: đổi cột nào. WHERE: sửa dòng nào.",
         type_q("up-q", 3, 0.3, 1.8) + [DIM("#up-q-1, #up-q-2", 5.2, 0.15), IN("#up-r1", "left", 6.5)]),
        ("Bây giờ thử quên mất mệnh đề Where.",
         "Thử quên WHERE.",
         [OUT(sel_q("up-q", 3) + ", #up-r1", "fade", 0, 0.4)] + type_q("up-q2", 2, 0.6, 1.0)),
        ("Lệnh báo tám mươi lăm dòng bị ảnh hưởng. PostgreSQL không hỏi lại, cũng không cảnh báo.",
         "Ảnh hưởng 85 dòng. PostgreSQL không hỏi lại.",
         [IN("#up-r2", "left", 0.4), SHAKE("#up-r2", 1.2), IN("#up-w", "left", 3.0)]),
        ("Trước đó có tám mươi ba tài khoản đang mở. Sau đó cả tám mươi lăm đều đóng. Một lệnh tương tự trên bảng khách hàng biến cả bốn mươi khách thành ngủ đông.",
         "Trước: OPEN 83. Sau: cả 85 CLOSED. Bảng khách: cả 40 khách ngủ đông.",
         [DIM(sel_q("up-q2", 2) + ", #up-r2, #up-w", 0, 0.15), IN("#up-b", "up", 0.5), *ARROW("up-ar", 2.8, 0.7), IN("#up-a", "up", 3.4), IN("#up-c", "left", 7.5)]),
        ("Thói quen an toàn: viết Select với đúng điều kiện trước, đếm số dòng, rồi mới đổi thành Update. Định sửa một dòng mà thấy bốn mươi thì đã sai.",
         "Viết SELECT trước, đếm số dòng, rồi mới đổi thành UPDATE.",
         [OUT(sel_q("up-q2", 2) + ", #up-r2, #up-w, #up-b, #up-a, #up-c, #up-ar", "fade", 0, 0.4), IN("#up-s1", "left", 0.7), IN("#up-s2", "left", 3.5), IN("#up-s3", "left", 7.5)]),
    ]),
    # ------------------------------------------------------------ delete
    dict(id="delete-returning", world=(1920, 1080), hud=hud("dl", "DELETE và RETURNING", "Xoá dòng, nhận lại dòng vừa xoá"), cam="".join([
        big_title("dl", "DELETE", "Xoá dòng, và RETURNING nhận lại dòng vừa xoá"),
        sqlbox("dl-q", 120, 190, 1100, ["DELETE FROM stmt_entry", "WHERE stmt_entry_id = 929", "RETURNING stmt_entry_id, account_id, amount;"]),
        tbl("dl-t", 120, 450, [(280, True), (320, True), (260, True)], ["stmt_entry_id", "account_id", "amount"], [["929", "1000000003", "2000000.00"]], 66, 28),
        chip("dl-k", 120, 600, "RETURNING: nhận lại đúng dòng vừa bị tác động, khỏi SELECT lần nữa", "cyan"),
        chip("dl-k2", 120, 700, "Dùng được với cả INSERT và UPDATE (ví dụ số tự tăng vừa cấp: 933)", "violet"),
        sqlbox("dl-q2", 120, 190, 800, ["DELETE FROM stmt_entry;"]),
        chip("dl-r", 1000, 205, "Ảnh hưởng 932 dòng", "red"),
        chip("dl-e", 120, 380, "Bảng vẫn còn, nhưng rỗng: COUNT(*) = 0", "red"),
        chip("dl-b1", 120, 250, "Ngân hàng hầu như không xoá giao dịch thật", "amber", 1000),
        chip("dl-b2", 120, 350, "Đổi trạng thái để giữ lịch sử: CLOSED, FAILED", "green", 1000),
        chip("dl-b3", 120, 450, "Dòng cha còn dòng con (khoá ngoại): không xoá được", "red", 1000),
    ]), beats=[
        ("Phần ba. Delete xoá những dòng thoả điều kiện, kèm một từ khoá rất tiện của PostgreSQL là Returning.",
         "Phần 3: DELETE xoá dòng, RETURNING trả lại dòng vừa xoá.",
         title_beat("dl")),
        ("Ta xoá bút toán số chín trăm hai mươi chín. Nhờ Returning, PostgreSQL trả ngay dòng vừa bị xoá, khỏi phải Select lần nữa.",
         "RETURNING trả lại ngay dòng vừa bị xoá.",
         type_q("dl-q", 3, 0.3, 1.8) + show_tbl("dl-t", 1, 6.5) + [IN("#dl-k", "left", 9.0)]),
        ("Nhưng quên Where thì Delete xoá sạch. Chín trăm ba mươi hai bút toán biến mất. Bảng vẫn còn đó, chỉ là rỗng.",
         "Quên WHERE: xoá cả 932 bút toán, bảng rỗng.",
         [OUT(sel_q("dl-q", 3) + ", " + sel_tbl("dl-t", 1) + ", #dl-k, #dl-k2", "fade", 0, 0.4)] + type_q("dl-q2", 1, 0.6, 1.0) + [IN("#dl-r", "left", 2.2), SHAKE("#dl-r", 2.9), IN("#dl-e", "left", 5.0)]),
        ("Trong ngân hàng, giao dịch hầu như không bị xoá thật. Người ta đổi trạng thái để giữ lịch sử. Và dòng cha còn dòng con trỏ tới thì cũng không xoá được.",
         "Ngân hàng đổi trạng thái thay vì xoá. Dòng cha còn con thì không xoá được.",
         [OUT("#dl-q2, #dl-q2-1, #dl-r, #dl-e", "fade", 0, 0.4), IN("#dl-b1", "left", 0.7), IN("#dl-b2", "left", 3.5), IN("#dl-b3", "left", 7.0)]),
    ]),
    # ------------------------------------------------------------ constraint errors
    dict(id="constraint-errors", world=(1920, 1080), hud=hud("ce", "Lỗi ràng buộc", "Database từ chối: đọc đúng thông báo"), cam="".join([
        big_title("ce", "Ràng buộc", "Vi phạm luật thì cả lệnh bị huỷ"),
        *[sqlbox(f"ce-q{i}", 110, 190, 1700, lines, 26) for i, lines in enumerate([
            ["INSERT INTO company (company_id, name, city, open_date)", "VALUES ('VN0010001', 'Chi nhánh X', 'Huế', '2024-01-10');"],
            ["INSERT INTO account (account_id, customer_id, category_id, ccy,", "                     company_id, open_date, working_balance, status)",
             "VALUES ('1000000999', 999999, 1001, 'VND', 'VN0010001', '2024-01-01', 0, 'OPEN');"],
            ["DELETE FROM customer WHERE customer_id = 100002;"],
            ["UPDATE customer SET customer_status = 'SUSPENDED'", "WHERE customer_id = 100002;"],
            ["INSERT INTO company (company_id, name, city)", "VALUES ('VN0010009', 'Chi nhánh X', 'Huế');"],
        ], 1)],
        errmsg("ce-e1", 110, 560, 1700, 'duplicate key value violates unique constraint "company_pkey"', "Key (company_id)=(VN0010001) already exists."),
        errmsg("ce-e2", 110, 560, 1700, 'insert or update on table "account" violates foreign key constraint "account_customer_id_fkey"', 'Key (customer_id)=(999999) is not present in table "customer".'),
        errmsg("ce-e3", 110, 560, 1700, 'update or delete on table "customer" violates foreign key constraint "account_customer_id_fkey" on table "account"'),
        errmsg("ce-e4", 110, 560, 1700, 'new row for relation "customer" violates check constraint "customer_customer_status_check"'),
        errmsg("ce-e5", 110, 560, 1700, 'null value in column "open_date" of relation "company" violates not-null constraint'),
        chip("ce-t1", 110, 790, "Khoá chính trùng", "amber"), chip("ce-t2", 110, 790, "Khoá ngoại khi thêm: khách 999999 không tồn tại", "amber"),
        chip("ce-t3", 110, 790, "Khoá ngoại khi xoá: khách 100002 vẫn còn tài khoản trỏ tới", "amber"),
        chip("ce-t4", 110, 790, "CHECK: chỉ cho phép ACTIVE, DORMANT, CLOSED", "amber"),
        chip("ce-t5", 110, 790, "NOT NULL: thiếu ngày mở", "amber"),
        chip("ce-r1", 160, 300, "Tên bảng và tên ràng buộc: chỗ nào bị vi phạm", "cyan", 1100),
        chip("ce-r2", 160, 410, "Key (...) hoặc Failing row: dòng nào", "violet", 1100),
        chip("ce-r3", 160, 520, "Cả lệnh bị huỷ, không dòng nào bị đổi", "green", 1100),
    ]), beats=[
        ("Phần bốn. Bảng có luật: khoá chính, khoá ngoại, Check, Not Null. Lệnh nào vi phạm thì cả lệnh bị huỷ.",
         "Phần 4: ràng buộc. Vi phạm luật thì cả lệnh bị huỷ.",
         title_beat("ce")),
        ("Thêm chi nhánh với mã đã có sẵn: lỗi khoá chính trùng. Phần Key cho biết đúng mã nào bị trùng.",
         "Khoá chính trùng: Key (company_id)=(VN0010001) already exists.",
         type_q("ce-q1", 2, 0.3, 1.5) + [IN("#ce-e1", "up", 4.2), IN("#ce-t1", "left", 6.5)]),
        ("Thêm tài khoản cho khách số chín trăm chín mươi chín nghìn chín trăm chín mươi chín, người không có trong bảng khách hàng: lỗi khoá ngoại.",
         "Khoá ngoại: khách 999999 không có trong bảng customer.",
         [OUT("#ce-q1, #ce-q1-1, #ce-q1-2, #ce-e1, #ce-t1", "fade", 0, 0.4)] + type_q("ce-q2", 3, 0.6, 1.3) + [IN("#ce-e2", "up", 5.5), IN("#ce-t2", "left", 8.5)]),
        ("Xoá khách một không không không không hai thì bị chặn, vì khách này vẫn còn tài khoản trỏ tới. Ngân hàng thường đổi trạng thái thành Closed thay vì xoá.",
         "Khoá ngoại khi xoá: khách còn tài khoản trỏ tới thì không xoá được.",
         [OUT("#ce-q2, #ce-q2-1, #ce-q2-2, #ce-q2-3, #ce-e2, #ce-t2", "fade", 0, 0.4)] + type_q("ce-q3", 1, 0.6, 1.0) + [IN("#ce-e3", "up", 2.4), IN("#ce-t3", "left", 5.5)]),
        ("Gán trạng thái Suspended, vốn không nằm trong danh sách cho phép: vi phạm Check.",
         "CHECK: trạng thái ngoài danh sách cho phép.",
         [OUT("#ce-q3, #ce-q3-1, #ce-e3, #ce-t3", "fade", 0, 0.4)] + type_q("ce-q4", 2, 0.6, 1.2) + [IN("#ce-e4", "up", 3.0), IN("#ce-t4", "left", 5.5)]),
        ("Cách đọc lỗi: tên bảng và tên ràng buộc cho biết chỗ nào, phần Key cho biết dòng nào. Và nhớ rằng cả lệnh bị huỷ, không dòng nào bị đổi.",
         "Đọc lỗi: bảng + ràng buộc là chỗ nào, Key là dòng nào.",
         [OUT("#ce-q4, #ce-q4-1, #ce-q4-2, #ce-e4, #ce-t4", "fade", 0, 0.4), IN("#ce-r1", "left", 0.7), IN("#ce-r2", "left", 4.5), IN("#ce-r3", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ transaction
    dict(id="transaction", world=(1920, 1080), hud=hud("tx", "Transaction", "Tất cả hoặc không gì"), cam="".join([
        big_title("tx", "Transaction", "Tất cả hoặc không gì"),
        acct("tx-a", 100, 190, "Tài khoản A: gửi", "1000000003"), bal("tx-a0", 100, 250, "75.666.000"), bal("tx-a1", 100, 250, "70.666.000", "#ff8da0"),
        acct("tx-b", 100, 400, "Tài khoản B: nhận", "1000000011"), bal("tx-b0", 100, 460, "51.000.000"), bal("tx-b1", 100, 460, "56.000.000", "#9be37a"),
        chip("tx-t0", 100, 620, "Tổng hai tài khoản: 126.666.000", "cyan", 520),
        chip("tx-t1", 100, 620, "Tổng hai tài khoản: 121.666.000", "red", 520),
        chip("tx-t2", 100, 620, "Tổng hai tài khoản: 126.666.000", "green", 520),
        sqlbox("tx-q", 700, 190, 1150, [*UPD_A, "SELECT 1 / 0;   -- sự cố giữa chừng", *UPD_B], 26),
        chip("tx-m1", 700, 560, "Mỗi lệnh tự ghi vĩnh viễn ngay khi xong", "amber"),
        chip("tx-m2", 700, 660, "Mất đúng 5.000.000", "red"),
        sqlbox("tx-q2", 700, 190, 1150, ["BEGIN;", *UPD_A, "SELECT 1 / 0;   -- sự cố giữa chừng", "ROLLBACK;   -- huỷ cả khối"], 26),
        chip("tx-m3", 700, 560, "BEGIN: mở khối, bên ngoài chưa thấy gì", "violet"),
        chip("tx-m4", 700, 660, "ROLLBACK: cả hai về đúng số dư cũ", "green"),
        sqlbox("tx-q3", 700, 190, 1150, ["BEGIN;", *UPD_A, *UPD_B, "COMMIT;   -- chốt cả khối"], 26),
        chip("tx-m5", 700, 620, "COMMIT: ghi vĩnh viễn cùng lúc", "green"),
    ]), beats=[
        ("Phần năm. Transaction gom nhiều lệnh thành một khối: hoặc tất cả cùng xảy ra, hoặc không gì cả.",
         "Phần 5: transaction, hoặc tất cả hoặc không gì.",
         title_beat("tx")),
        ("Tài khoản gửi đang có bảy mươi lăm triệu sáu trăm sáu mươi sáu nghìn. Tài khoản nhận có năm mươi mốt triệu. Tổng hai tài khoản là một trăm hai mươi sáu triệu sáu trăm sáu mươi sáu nghìn.",
         "A: 75.666.000. B: 51.000.000. Tổng: 126.666.000.",
         [IN("#tx-a", "up", 0.3), IN("#tx-a0", "fade", 0.7), IN("#tx-b", "up", 3.5), IN("#tx-b0", "fade", 3.9), IN("#tx-t0", "left", 7.0)]),
        ("Khi không có transaction, lệnh trừ tiền chạy xong là được ghi vĩnh viễn ngay. Rồi sự cố xảy ra, và lệnh cộng tiền không bao giờ chạy.",
         "Không có transaction: mỗi lệnh tự ghi ngay. Sự cố, lệnh cộng không chạy.",
         type_q("tx-q", 5, 0.3, 1.4) + [IN("#tx-m1", "left", 7.8)]),
        ("Tài khoản gửi chỉ còn bảy mươi triệu sáu trăm sáu mươi sáu nghìn, tài khoản nhận vẫn năm mươi mốt triệu. Tổng còn một trăm hai mươi mốt triệu sáu trăm sáu mươi sáu nghìn. Mất đúng năm triệu.",
         "A còn 70.666.000, B vẫn 51.000.000. Tổng 121.666.000: mất 5.000.000.",
         [OUT("#tx-a0, #tx-t0", "fade", 0, 0.3), IN("#tx-a1", "fade", 0.4), IN("#tx-t1", "left", 0.5), DIM("#tx-q, #tx-q-1, #tx-q-2, #tx-q-3, #tx-q-4, #tx-q-5, #tx-m1", 1.0, 0.15), IN("#tx-m2", "left", 5.5), SHAKE("#tx-m2", 6.3)]),
        ("Bây giờ gói các lệnh vào một transaction. Begin mở khối. Mọi lệnh bên trong chưa ai bên ngoài nhìn thấy.",
         "BEGIN mở một khối. Lệnh bên trong chưa ai thấy.",
         [OUT("#tx-a1, #tx-t1, #tx-m2, " + sel_q("tx-q", 5) + ", #tx-m1", "fade", 0, 0.4), IN("#tx-a0", "fade", 0.5), IN("#tx-t0", "left", 0.6)] + type_q("tx-q2", 5, 0.8, 1.2) + [IN("#tx-m3", "left", 7.0)]),
        ("Khi sự cố xảy ra giữa chừng, lệnh Roll back huỷ cả khối. Hai tài khoản về đúng số dư cũ, và tổng vẫn là một trăm hai mươi sáu triệu sáu trăm sáu mươi sáu nghìn.",
         "ROLLBACK huỷ cả khối: cả hai về số dư cũ, tổng vẫn 126.666.000.",
         [DIM("#tx-q2, #tx-q2-1, #tx-q2-2, #tx-q2-3, #tx-q2-4, #tx-m3", 0, 0.15), IN("#tx-m4", "left", 0.8), PULSE("#tx-t0", 2.0)]),
        ("Còn nếu mọi thứ êm, Commit chốt cả khối cùng lúc. Tài khoản gửi còn bảy mươi triệu, tài khoản nhận thành năm mươi sáu triệu, tổng vẫn không đổi.",
         "COMMIT chốt cả khối: A 70.666.000, B 56.000.000, tổng vẫn 126.666.000.",
         [OUT("#tx-q2, #tx-q2-1, #tx-q2-2, #tx-q2-3, #tx-q2-4, #tx-q2-5, #tx-m3, #tx-m4, #tx-a0, #tx-b0, #tx-t0", "fade", 0, 0.4), IN("#tx-a1", "fade", 0.5), IN("#tx-b1", "fade", 0.6),
          IN("#tx-t2", "left", 0.7)] + type_q("tx-q3", 6, 0.8, 1.1) + [IN("#tx-m5", "left", 7.8)]),
    ]),
    # ------------------------------------------------------------ acid + full transfer
    dict(id="acid-transfer", world=(1920, 1080), hud=hud("ac", "ACID và chuyển khoản đầy đủ", "Bốn lời hứa của transaction"), cam="".join([
        big_title("ac", "ACID", "Bốn lời hứa của một transaction"),
        card4("ac-c", 115, 240, 400, 330, 30, [("box", "Atomicity", "tất cả hoặc không gì"), ("shield", "Consistency", "vẫn thoả mọi luật đã khai báo"),
                                               ("lock", "Isolation", "không thấy phần dở dang của nhau"), ("grid", "Durability", "đã COMMIT là còn, dù mất điện")]),
        chip("ac-s1", 120, 200, "BEGIN", "violet", 1200),
        chip("ac-s2", 120, 300, "INSERT funds_transfer: FT240000140, trạng thái DONE", "cyan", 1200),
        chip("ac-s3", 120, 400, "UPDATE số dư: trừ 5.000.000 ở A, cộng 5.000.000 ở B", "cyan", 1200),
        chip("ac-s4", 120, 500, "INSERT stmt_entry mã 201: -5.000.000 ở A (ghi nợ)", "amber", 1200),
        chip("ac-s5", 120, 600, "INSERT stmt_entry mã 202: +5.000.000 ở B (ghi có)", "amber", 1200),
        chip("ac-s6", 120, 700, "COMMIT", "green", 1200),
        sqlbox("ac-q", 120, 190, 1300, ["SELECT COUNT(*) AS so_but_toan, SUM(amount) AS tong", "FROM stmt_entry", "WHERE account_id = '1000000003';"]),
        tbl("ac-t", 120, 440, [(300, True), (360, True)], ["so_but_toan", "tong"], [["15", "75666000.00"]], 66, 30),
        chip("ac-eq", 120, 600, "Số dư = tổng các bút toán: 75.666.000", "cyan"),
        sqlbox("ac-q2", 110, 190, 1700, ["INSERT INTO stmt_entry (account_id, amount, ft_id, txn_code, booking_date, value_date)",
                                         "VALUES ('1000000003', -5000000, 'FT240000140', '201', '2024-12-31', '2024-12-31');"], 26),
        errmsg("ac-e", 110, 400, 1700, 'insert or update on table "stmt_entry" violates foreign key constraint "stmt_entry_ft_id_fkey"',
               'Key (ft_id)=(FT240000140) is not present in table "funds_transfer".'),
        chip("ac-o", 110, 650, "Thêm funds_transfer trước, stmt_entry sau", "green"),
    ]), beats=[
        ("Phần sáu. Một transaction đưa ra bốn lời hứa, gọi tắt là ACID.",
         "Phần 6: ACID, bốn lời hứa của transaction.",
         title_beat("ac")),
        ("Nguyên tử: tất cả hoặc không gì. Nhất quán: dữ liệu vẫn thoả mọi luật đã khai báo. Cô lập: transaction khác không thấy phần dở dang. Bền vững: đã Commit thì mất điện vẫn còn.",
         "Atomicity, Consistency, Isolation, Durability.",
         [IN("#ac-c0", "pop", 0.3), IN("#ac-c1", "pop", 3.4), IN("#ac-c2", "pop", 6.6), IN("#ac-c3", "pop", 9.6)]),
        ("Một chuyển khoản thật không chỉ sửa số dư. Cùng một transaction ghi một dòng chuyển khoản, hai lệnh sửa số dư, và hai bút toán: mã hai không một ghi nợ, mã hai không hai ghi có.",
         "Chuyển khoản đầy đủ: 1 lệnh chuyển, 2 lần sửa số dư, 2 bút toán, trong một transaction.",
         [OUT("#ac-c0, #ac-c1, #ac-c2, #ac-c3", "fade", 0, 0.4), IN("#ac-s1", "left", 0.6), IN("#ac-s2", "left", 2.2), IN("#ac-s3", "left", 4.0),
          IN("#ac-s4", "left", 7.5), IN("#ac-s5", "left", 10.0), IN("#ac-s6", "left", 12.0)]),
        ("Thứ tự các câu lệnh cũng rất quan trọng. Bút toán trỏ tới dòng chuyển khoản bằng khoá ngoại, nên phải thêm dòng chuyển khoản trước. Làm ngược lại là gặp lỗi khoá ngoại.",
         "Thêm funds_transfer trước, stmt_entry sau. Ngược lại: lỗi khoá ngoại.",
         [OUT("#ac-s1, #ac-s2, #ac-s3, #ac-s4, #ac-s5, #ac-s6", "fade", 0, 0.4)] + type_q("ac-q2", 2, 0.6, 1.5) + [IN("#ac-e", "up", 4.2), IN("#ac-o", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("eq", "Luôn có WHERE", "SELECT đếm thử trước khi UPDATE, DELETE"),
                                                ("quote", "RETURNING", "nhận lại dòng vừa bị tác động"),
                                                ("shield", "Đọc lỗi ràng buộc", "bảng + ràng buộc, rồi Key"),
                                                ("lock", "Transaction", "BEGIN, COMMIT hoặc ROLLBACK")]),
        chip("ou-next", 560, 650, "Bài tiếp: Index và Execution Plan", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: luôn viết Where, và đếm thử bằng Select trước khi Update hay Delete. Returning cho ta dòng vừa bị tác động. Đọc lỗi ràng buộc bằng tên bảng, tên ràng buộc và phần Key. Và mọi nghiệp vụ nhiều bước phải nằm trong một transaction: Commit để chốt, Rollback để huỷ.",
         "WHERE · RETURNING · đọc lỗi ràng buộc · BEGIN, COMMIT, ROLLBACK.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 6.5), IN("#ou-c2", "pop", 10.5), IN("#ou-c3", "pop", 16.0)]),
        ("Bài tiếp: Index và kế hoạch thực thi.", "Bài tiếp: Index và Execution Plan.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]


def clamp_to_audio(scenes, scenes_file):
    """Pull reveals earlier when a beat's last motion would end after its narration."""
    beats = Path(scenes_file).parent / ".tts" / "beats.json"
    if not beats.exists():
        return
    known = {b["spoken"]: b["d"] for b in json.loads(beats.read_text(encoding="utf-8"))}
    for sc in scenes:
        for spoken, _caption, actions in sc["beats"]:
            aud = known.get(spoken)
            if not aud or not actions:
                continue
            last = max(a.get("d", 0) + a.get("dur", 0.5) for a in actions)
            maxd = max(a.get("d", 0) for a in actions)
            if last > aud and maxd > 0:
                k = max(0.4, (aud - 0.9) / maxd)
                for a in actions:
                    a["d"] = round(a.get("d", 0) * min(k, 1), 2)


fit_to_audio(SCENES, __file__)
clamp_to_audio(SCENES, __file__)
