"""SQL foundation explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-foundation.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
company 5 rows (VN0010001 Hội sở Hà Nội ... VN0010005 Chi nhánh Cần Thơ); account 9 columns (account_id character varying, customer_id integer,
category_id integer, ccy character, company_id character varying, open_date date, close_date date, working_balance numeric, status character varying);
INSERT company VN0010001 -> duplicate key value violates unique constraint "company_pkey"; VN0010006 -> count 6;
INSERT account customer 999999 -> violates foreign key constraint "account_customer_id_fkey"; customers 100001 email NULL, 100005 mobile NULL;
email = NULL -> 0 rows, email IS NULL -> 9 rows; account 1000000009 working_balance 0.00;
row counts: company 5, account_officer 8, sector 4, currency 4, category 7, txn_type 8, customer 40, account 85, funds_transfer 132, stmt_entry 932, loan 15;
stmt_entry first 5 rows and funds_transfer first 5 rows as returned.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<s>'[^']*')|(?P<k>\b(?:SELECT|FROM|WHERE|AND|ORDER BY|LIMIT|INSERT INTO|VALUES|IS NULL|IS)\b)|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
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


def okbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r",
              "color:#9be37a;border-color:var(--green);background:linear-gradient(165deg,rgba(74,222,128,.16),rgba(6,24,12,.85));box-shadow:none")


def field(id_, x, y, w, title, rows, tone):
    """Table card for the ERD pictures: title bar plus one line per column; rows = [(name, tag)]."""
    body = "".join(f'<div style="display:flex;justify-content:space-between;padding:6px 26px;font:500 28px var(--mono)">'
                   f'<span>{esc(n)}</span><b style="color:var(--{ "amber" if t == "FK" else "green"})">{t}</b></div>' for n, t in rows)
    return box(id_, x, y, w, None, f'{win(title)}<div style="padding:10px 0 14px">{body}</div>', tone, "panel")


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Nền tảng cho mọi câu SQL", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Hai khách cùng tên, máy phân biệt thế nào?"), "h1 center r"),
        tbl("hk-t", 380, 430, [(240, True), (440, False), (420, False)], ["customer_id", "full_name", "city"],
            [["100002", "Dương Văn An", "Hà Nội"], ["100011", "Trần Văn An", "Hà Nội"]], 66, 30),
        tile("hk-tile", 400, 350, 220, "grid"),
        el("hk-word", 670, 380, 1200, None, letters("Database & T24"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Bảng · Kiểu dữ liệu · Khoá chính · Khoá ngoại · NULL", "kin-sub r"),
    ]), beats=[
        ("Trong ngân hàng có hai khách tên Văn An. Làm sao máy không nhầm số dư của người này sang người kia?",
         "Hai khách tên Văn An: làm sao máy không nhầm số dư của người này sang người kia?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Câu trả lời là một cột mã, duy nhất cho từng người. Đó là nền tảng của mọi database.",
         "Mỗi khách có một mã duy nhất: 100002 và 100011.",
         [IN("#hk-t-h", "left", 0.4), IN("#hk-t-1", "left", 1.2), IN("#hk-t-2", "left", 2.4)]),
        ("Hôm nay ta học nền tảng database, trên một ngân hàng giả lập theo phần mềm lõi T hai mươi bốn.",
         "Hôm nay: nền tảng Database trên ngân hàng T24 giả lập.",
         [OUT("#hk-eye, #hk-q, #hk-t-h, #hk-t-1, #hk-t-2", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ database, table, row, column
    dict(id="database-table", world=(1920, 1080), hud=hud("dt", "Database, bảng, dòng và cột", "Mỗi bảng là một tờ Excel"), cam="".join([
        big_title("dt", "Bảng, dòng, cột", "Mỗi bảng như một tờ Excel"),
        sqlbox("dt-q", 160, 190, 620, ["SELECT *", "FROM company;"]),
        tbl("dt-t", 160, 400, [(210, True), (480, False), (360, False), (230, True)], ["company_id", "name", "city", "open_date"],
            [["VN0010001", "Hội sở Hà Nội", "Hà Nội", "2005-03-01"], ["VN0010002", "Chi nhánh TP. Hồ Chí Minh", "TP. Hồ Chí Minh", "2006-06-15"],
             ["VN0010003", "Chi nhánh Đà Nẵng", "Đà Nẵng", "2009-09-09"], ["VN0010004", "Chi nhánh Hải Phòng", "Hải Phòng", "2012-01-20"],
             ["VN0010005", "Chi nhánh Cần Thơ", "Cần Thơ", "2015-11-02"]], 64, 27),
        el("dt-col", 850, 392, 360, 396, "", "hilite r"),
        el("dt-row", 150, 524, 1300, 76, "", "hilite r"),
        chip("dt-c1", 1480, 440, "Cột: loại thông tin", "cyan"),
        chip("dt-c2", 1480, 540, "Dòng: một chi nhánh", "green"),
        chip("dt-a1", 160, 810, "account: 85 dòng = 85 tài khoản", "violet"),
        chip("dt-a2", 160, 880, "9 cột = 9 thông tin mỗi tài khoản", "amber"),
    ]), beats=[
        ("Phần một. Database gồm nhiều bảng, và mỗi bảng giống một tờ Excel.",
         "Phần 1: Database gồm nhiều bảng, mỗi bảng giống một tờ Excel.",
         [TYPE("#dt-big", 0.1, 0.06), IN("#dt-bsub", "blur", 0.9), OUT("#dt-big, #dt-bsub", "zoom", 3.4), IN("#dt-hud", "left", 4.0)]),
        ("Câu SQL đơn giản nhất lấy mọi cột từ bảng company: chọn dấu sao, từ bảng company.",
         "SELECT * FROM company: lấy mọi cột của bảng company.",
         [IN("#dt-q", "up", 0.3, 0.4), IN("#dt-q-1", "type1", 0.6, 0.3), IN("#dt-q-2", "type1", 2.4, 0.3)]),
        ("Kết quả là năm chi nhánh. Mỗi cột là một loại thông tin: mã, tên, thành phố, ngày mở.",
         "5 dòng, 4 cột: mã, tên, thành phố, ngày mở.",
         [IN("#dt-t-h", "left", 0.3), IN("#dt-t-1", "left", 1.0), IN("#dt-t-2", "left", 1.4), IN("#dt-t-3", "left", 1.8), IN("#dt-t-4", "left", 2.2),
          IN("#dt-t-5", "left", 2.6), IN("#dt-col", "fade", 3.8), IN("#dt-c1", "left", 4.2)]),
        ("Còn mỗi dòng là một đối tượng cụ thể, ở đây là một chi nhánh. Một khách hàng cũng chỉ là một dòng, không phải một cột.",
         "Mỗi dòng là một đối tượng. Một khách hàng là một dòng, không phải một cột.",
         [OUT("#dt-col", "fade", 0, 0.3), IN("#dt-row", "fade", 0.4), IN("#dt-c2", "left", 0.8)]),
        ("Đọc số liệu cho đúng. Bảng account có tám mươi lăm dòng và chín cột: tám mươi lăm tài khoản, mỗi tài khoản chín thông tin.",
         "account: 85 dòng = 85 tài khoản, 9 cột = 9 thông tin mỗi tài khoản.",
         [OUT("#dt-row", "fade", 0, 0.3), DIM("#dt-q, #dt-t-h, #dt-t-1, #dt-t-2, #dt-t-3, #dt-t-4, #dt-t-5, #dt-c1, #dt-c2", 0, 0.12),
          IN("#dt-a1", "left", 0.8), IN("#dt-a2", "left", 4.6)]),
    ]),
    # ------------------------------------------------------------ data types
    dict(id="data-type", world=(1920, 1080), hud=hud("ty", "Kiểu dữ liệu", "Mỗi cột chỉ chứa một loại giá trị"), cam="".join([
        big_title("ty", "Kiểu dữ liệu", "Cột này chứa loại giá trị nào?"),
        sqlbox("ty-q", 120, 190, 1040, ["SELECT column_name, data_type", "FROM information_schema.columns",
                                        "WHERE table_schema = 'public' AND table_name = 'account'", "ORDER BY ordinal_position;"], 27),
        tbl("ty-t", 1210, 190, [(300, True), (330, False)], ["column_name", "data_type"],
            [["account_id", "character varying"], ["customer_id", "integer"], ["category_id", "integer"], ["ccy", "character"],
             ["company_id", "character varying"], ["open_date", "date"], ["close_date", "date"], ["working_balance", "numeric"],
             ["status", "character varying"]], 66, 26),
        el("ty-hl", 1200, 724, 650, 72, "", "hilite r"),
        chip("ty-c1", 120, 520, "integer: mã khách hàng", "cyan"),
        chip("ty-c2", 120, 600, "numeric: tiền, số chính xác", "green"),
        chip("ty-c3", 120, 680, "date: ngày, để so sánh và tính", "violet"),
        chip("ty-c4", 120, 760, "float: có thể sai số nhỏ", "red"),
        chip("ty-c5", 120, 840, "Loại tiền tách ra cột ccy riêng", "amber"),
    ]), beats=[
        ("Phần hai. Mỗi cột có một kiểu dữ liệu, cho database biết cột chứa loại giá trị nào.",
         "Phần 2: mỗi cột có một kiểu dữ liệu.",
         [TYPE("#ty-big", 0.1, 0.06), IN("#ty-bsub", "blur", 0.9), OUT("#ty-big, #ty-bsub", "zoom", 3.4), IN("#ty-hud", "left", 4.0)]),
        ("Muốn xem, hãy hỏi bảng thông tin cột của Postgres, cho bảng account.",
         "Hỏi information_schema.columns về bảng account.",
         [IN("#ty-q", "up", 0.3, 0.4), IN("#ty-q-1", "type1", 0.6, 0.3), IN("#ty-q-2", "type1", 1.8, 0.3), IN("#ty-q-3", "type1", 3.0, 0.3), IN("#ty-q-4", "type1", 4.4, 0.3)]),
        ("Chín cột, mỗi cột một kiểu: số nguyên cho mã, chuỗi cho tên, ngày cho ngày mở và ngày đóng, và numeric cho số dư.",
         "9 cột: integer cho mã, character varying cho chuỗi, date cho ngày, numeric cho số dư.",
         [IN("#ty-t-h", "left", 0.3), IN("#ty-t-1", "left", 1.0), IN("#ty-t-2", "left", 1.5), IN("#ty-t-3", "left", 2.0), IN("#ty-t-4", "left", 2.5),
          IN("#ty-t-5", "left", 3.0), IN("#ty-t-6", "left", 3.5), IN("#ty-t-7", "left", 4.0), IN("#ty-t-8", "left", 4.5), IN("#ty-t-9", "left", 5.0)]),
        ("Bẫy hay gặp: tiền phải dùng numeric, số thập phân chính xác. Số thực dấu phẩy động có thể sai số nhỏ khi cộng nhiều lần.",
         "Tiền dùng numeric. float có thể sai số nhỏ khi cộng nhiều lần.",
         [DIM("#ty-q, #ty-t-h, #ty-t-1, #ty-t-2, #ty-t-3, #ty-t-4, #ty-t-5, #ty-t-6, #ty-t-7, #ty-t-9", 0, 0.12), IN("#ty-hl", "fade", 0.3),
          IN("#ty-c2", "left", 0.8), IN("#ty-c4", "left", 4.4), SHAKE("#ty-c4", 5.0)]),
        ("Ngày thì dùng kiểu date chứ đừng lưu thành chuỗi, để còn so sánh và tính khoảng cách ngày. Loại tiền như VND hay USD tách ra một cột riêng.",
         "Ngày dùng date, không lưu chuỗi. Loại tiền tách ra cột ccy riêng.",
         [IN("#ty-c1", "left", 0.3), IN("#ty-c3", "left", 0.8), IN("#ty-c5", "left", 5.6)]),
    ]),
    # ------------------------------------------------------------ primary key
    dict(id="primary-key", world=(1920, 1080), hud=hud("pk", "Khoá chính", "Duy nhất và không NULL"), cam="".join([
        big_title("pk", "Khoá chính", "Mỗi dòng một mã duy nhất"),
        field("pk-f1", 160, 200, 520, "company", [("company_id", "PK"), ("name", ""), ("city", ""), ("open_date", "")], "green"),
        field("pk-f2", 700, 200, 520, "customer", [("customer_id", "PK"), ("full_name", ""), ("birth_date", ""), ("mobile", "")], "green"),
        field("pk-f3", 1240, 200, 520, "account", [("account_id", "PK"), ("customer_id", ""), ("ccy", ""), ("working_balance", "")], "green"),
        chip("pk-rule", 160, 520, "Khoá chính: duy nhất, không NULL", "green"),
        chip("pk-name", 160, 600, "Tên có thể trùng, mã thì không", "amber"),
        sqlbox("pk-q", 160, 380, 1500, ["INSERT INTO company (company_id, name, city, open_date)",
                                         "VALUES ('VN0010001', 'Chi nhánh Huế', 'Huế', '2024-01-10');"], 28),
        el("pk-err", 160, 560, 1500, None, 'ERROR: duplicate key value violates unique constraint "company_pkey"', "err r"),
        sqlbox("pk-q2", 160, 380, 1500, ["INSERT INTO company (company_id, name, city, open_date)",
                                          "VALUES ('VN0010006', 'Chi nhánh Huế', 'Huế', '2024-01-10');"], 28),
        okbox("pk-ok", 160, 560, 1500, "INSERT thành công: bảng company có 6 chi nhánh"),
    ]), beats=[
        ("Phần ba. Làm sao phân biệt hai khách cùng tên? Mỗi dòng cần một cột duy nhất và không được NULL, gọi là khoá chính.",
         "Phần 3: mỗi dòng cần một cột duy nhất, không NULL: khoá chính (PK).",
         [TYPE("#pk-big", 0.1, 0.06), IN("#pk-bsub", "blur", 0.9), OUT("#pk-big, #pk-bsub", "zoom", 3.4), IN("#pk-hud", "left", 4.0)]),
        ("Bảng company dùng company id, bảng customer dùng customer id, bảng account dùng account id. Tên có thể trùng, mã thì không.",
         "company_id, customer_id, account_id là khoá chính. Tên có thể trùng, mã thì không.",
         [IN("#pk-f1", "up", 0.3), IN("#pk-f2", "up", 1.8), IN("#pk-f3", "up", 3.4), IN("#pk-rule", "left", 5.2), IN("#pk-name", "left", 6.8)]),
        ("Thử thêm một chi nhánh mới, nhưng lại mang mã VN0010001, mã này đã có rồi.",
         "Thử INSERT chi nhánh mới với mã VN0010001, mã đã có.",
         [OUT("#pk-f1, #pk-f2, #pk-f3, #pk-rule, #pk-name", "fade", 0, 0.4), IN("#pk-q", "up", 0.6, 0.4), IN("#pk-q-1", "type1", 0.9, 0.3), IN("#pk-q-2", "type1", 2.4, 0.3)]),
        ("Database tự chặn lại và báo lỗi trùng khoá. Bạn không cần tự kiểm tra từng lần.",
         "Database tự từ chối: duplicate key.",
         [IN("#pk-err", "up", 0.4), SHAKE("#pk-err", 1.0)]),
        ("Đổi sang mã chưa dùng, như VN0010006, thì chèn được, và bảng lên sáu chi nhánh.",
         "Đổi mã thành VN0010006: chèn thành công, 6 chi nhánh.",
         [OUT("#pk-q, #pk-err", "fade", 0, 0.4), IN("#pk-q2", "up", 0.6, 0.4), IN("#pk-q2-1", "type1", 0.9, 0.3), IN("#pk-q2-2", "type1", 2.0, 0.3), IN("#pk-ok", "up", 4.2)]),
    ]),
    # ------------------------------------------------------------ foreign key
    dict(id="foreign-key", world=(1920, 1080), hud=hud("fk", "Khoá ngoại", "Trỏ sang khoá chính bảng khác"), cam="".join([
        big_title("fk", "Khoá ngoại", "Cột trỏ sang bảng khác"),
        field("fk-a", 160, 220, 640, "account", [("account_id", "PK"), ("customer_id", "FK"), ("ccy", ""), ("working_balance", "")], "amber"),
        field("fk-c", 1120, 220, 640, "customer", [("customer_id", "PK"), ("full_name", ""), ("birth_date", ""), ("mobile", "")], "green"),
        wires(arrow("fk-ar", [(800, 340), (1120, 340)], "amber")),
        el("fk-n", 810, 285, 60, None, "N", "lbl r", "font:700 38px var(--mono);color:var(--amber)"),
        el("fk-1", 1050, 285, 60, None, "1", "lbl r", "font:700 38px var(--mono);color:var(--green)"),
        chip("fk-t1", 160, 620, "Một khách có nhiều tài khoản", "violet"),
        chip("fk-t2", 160, 700, "Thông tin khách chỉ lưu một lần, ở bảng customer", "cyan"),
        sqlbox("fk-q", 160, 200, 1560, ["INSERT INTO account", "(account_id, customer_id, category_id, ccy,", "company_id, open_date, working_balance, status)",
                                         "VALUES ('1999999999', 999999, 1001, 'VND', 'VN0010001', '2024-05-01', 0, 'OPEN');"], 27),
        el("fk-err", 160, 520, 1560, None, 'ERROR: insert or update on table "account" violates foreign key constraint "account_customer_id_fkey"', "err r"),
        sqlbox("fk-q2", 160, 200, 1560, ["INSERT INTO account", "(account_id, customer_id, category_id, ccy,", "company_id, open_date, working_balance, status)",
                                          "VALUES ('1999999999', 100001, 1001, 'VND', 'VN0010001', '2024-05-01', 0, 'OPEN');"], 27),
        okbox("fk-ok", 160, 520, 1560, "INSERT thành công: khách hàng 100001 có thật"),
    ]), beats=[
        ("Phần bốn. Bảng account có cột customer id, cho biết tài khoản của khách nào.",
         "Phần 4: account.customer_id cho biết tài khoản của khách nào.",
         [TYPE("#fk-big", 0.1, 0.06), IN("#fk-bsub", "blur", 0.9), OUT("#fk-big, #fk-bsub", "zoom", 3.4), IN("#fk-hud", "left", 4.0),
          IN("#fk-a", "up", 4.4)]),
        ("Cột này trỏ sang khoá chính của bảng customer. Cột trỏ sang bảng khác như vậy gọi là khoá ngoại.",
         "customer_id trỏ sang khoá chính của customer: khoá ngoại (FK).",
         [IN("#fk-c", "up", 0.3), *ARROW("fk-ar", 2.0, 0.8)]),
        ("Một khách có nhiều tài khoản: một ở đầu customer, nhiều ở đầu account. Nhờ vậy thông tin khách chỉ lưu một lần.",
         "1 khách : N tài khoản. Thông tin khách chỉ lưu một lần.",
         [IN("#fk-1", "pop", 0.4), IN("#fk-n", "pop", 1.4), IN("#fk-t1", "left", 3.0), IN("#fk-t2", "left", 5.4)]),
        ("Khoá ngoại còn là một luật. Thử mở tài khoản cho khách hàng chín chín chín chín chín chín, một người không tồn tại.",
         "Luật: không thể mở tài khoản cho khách hàng 999999, không tồn tại.",
         [OUT("#fk-a, #fk-c, #fk-ar, #fk-1, #fk-n, #fk-t1, #fk-t2", "fade", 0, 0.4), IN("#fk-q", "up", 0.6, 0.4), IN("#fk-q-1", "type1", 0.9, 0.3),
          IN("#fk-q-2", "type1", 1.8, 0.3), IN("#fk-q-3", "type1", 3.0, 0.3), IN("#fk-q-4", "type1", 4.4, 0.3)]),
        ("Database từ chối, báo lỗi vi phạm khoá ngoại. Đổi sang khách hàng một trăm nghìn lẻ một, người có thật, thì chèn được.",
         "Lỗi foreign key constraint. Đổi sang khách 100001 có thật thì chèn được.",
         [IN("#fk-err", "up", 0.4), SHAKE("#fk-err", 1.0), OUT("#fk-q, #fk-err", "fade", 4.0, 0.4), IN("#fk-q2", "up", 4.6, 0.4),
          IN("#fk-q2-1", "type1", 4.8, 0.2), IN("#fk-q2-2", "type1", 4.9, 0.2), IN("#fk-q2-3", "type1", 5.0, 0.2), IN("#fk-q2-4", "type1", 5.1, 0.2), IN("#fk-ok", "up", 6.2)]),
    ]),
    # ------------------------------------------------------------ NULL
    dict(id="null-value", world=(1920, 1080), hud=hud("nu", "NULL", "Chưa biết, không phải 0"), cam="".join([
        big_title("nu", "NULL", "Giá trị chưa biết"),
        sqlbox("nu-q", 160, 190, 1000, ["SELECT customer_id, full_name, mobile, email", "FROM customer", "ORDER BY customer_id", "LIMIT 12;"], 27),
        tbl("nu-t", 160, 440, [(210, True), (330, False), (240, True), (440, True)], ["customer_id", "full_name", "mobile", "email"],
            [["100001", "Lý Hoàng Long", "0994373346", "NULL"], ["100002", "Dương Văn An", "0993814102", "duong.van.an@mail.vn"],
             ["100003", "Ngô Anh Tuấn", "0962805268", "ngo.anh.tuan@mail.vn"], ["100004", "Hoàng Quốc Bảo", "0941316429", "hoang.quoc.bao@mail.vn"],
             ["100005", "Ngô Ngọc Anh", "NULL", "ngo.ngoc.anh@mail.vn"], ["...", "", "", ""]], 62, 26),
        el("nu-h1", 930, 496, 470, 62, "", "hilite r"),
        el("nu-h2", 690, 744, 250, 62, "", "hilite r"),
        chip("nu-z", 160, 420, "working_balance = 0.00: biết chắc hết tiền", "green"),
        chip("nu-n", 160, 500, "mobile NULL: chưa biết số điện thoại", "amber"),
        chip("nu-eq", 160, 420, "WHERE email = NULL: 0 dòng", "red"),
        chip("nu-is", 160, 500, "WHERE email IS NULL: 9 dòng", "green"),
    ]), beats=[
        ("Phần năm. Không phải khách nào cũng có số điện thoại hay email trong hệ thống. Khi thiếu thông tin, database lưu giá trị NULL, nghĩa là chưa biết.",
         "Phần 5: khi thiếu thông tin, database lưu NULL.",
         [TYPE("#nu-big", 0.1, 0.06), IN("#nu-bsub", "blur", 0.9), OUT("#nu-big, #nu-bsub", "zoom", 3.4), IN("#nu-hud", "left", 4.0),
          IN("#nu-q", "up", 4.6, 0.4), IN("#nu-q-1", "type1", 4.9, 0.3), IN("#nu-q-2", "type1", 5.6, 0.3), IN("#nu-q-3", "type1", 6.2, 0.3), IN("#nu-q-4", "type1", 6.8, 0.3)]),
        ("Khách một không không không không một chưa có email. Khách một không không không không năm chưa có số điện thoại. Chữ NULL in nghiêng và mờ.",
         "100001 chưa có email, 100005 chưa có số điện thoại: NULL in mờ, nghiêng.",
         [IN("#nu-t-h", "left", 0.3), IN("#nu-t-1", "left", 0.8), IN("#nu-t-2", "left", 1.2), IN("#nu-t-3", "left", 1.6), IN("#nu-t-4", "left", 2.0),
          IN("#nu-t-5", "left", 2.4), IN("#nu-t-6", "left", 2.8), IN("#nu-h1", "fade", 2.4), IN("#nu-h2", "fade", 4.8)]),
        ("NULL không phải số không, cũng không phải chuỗi rỗng. Số dư bằng không là biết chắc tài khoản hết tiền. Số điện thoại NULL là chưa biết số.",
         "NULL không phải 0, cũng không phải chuỗi rỗng.",
         [OUT("#nu-q, #nu-t-h, #nu-t-1, #nu-t-2, #nu-t-3, #nu-t-4, #nu-t-5, #nu-t-6, #nu-h1, #nu-h2", "fade", 0, 0.4), IN("#nu-z", "left", 1.0), IN("#nu-n", "left", 5.6)]),
        ("Và một bẫy: so sánh với NULL không cho đúng, cũng không cho sai. Viết bằng dấu bằng thì ra không dòng nào. Phải dùng is null, ra chín dòng.",
         "= NULL ra 0 dòng. Phải dùng IS NULL: 9 dòng.",
         [OUT("#nu-z, #nu-n", "fade", 0, 0.4), IN("#nu-eq", "left", 0.8), SHAKE("#nu-eq", 1.6), IN("#nu-is", "left", 5.2)]),
    ]),
    # ------------------------------------------------------------ T24 dataset
    dict(id="t24-dataset", world=(1920, 1080), hud=hud("t2", "Ngân hàng T24 giả lập", "11 bảng cho cả khoá học"), cam="".join([
        big_title("t2", "Ngân hàng T24", "Bộ dữ liệu giả lập cho cả khoá học"),
        el("t2-l1", 160, 190, 800, None, "Danh mục (ít dòng)", "lbl r", "text-align:left"),
        chip("t2-a1", 160, 250, "company: 5 chi nhánh", "cyan"), chip("t2-a2", 160, 330, "account_officer: 8 cán bộ", "cyan"),
        chip("t2-a3", 160, 410, "sector: 4 nhóm khách", "cyan"), chip("t2-a4", 160, 490, "currency: 4 loại tiền", "cyan"),
        chip("t2-a5", 160, 570, "category: 7 loại sản phẩm", "cyan"), chip("t2-a6", 160, 650, "txn_type: 8 loại giao dịch", "cyan"),
        el("t2-l2", 1000, 190, 800, None, "Dữ liệu chính", "lbl r", "text-align:left"),
        chip("t2-b1", 1000, 250, "customer: 40 khách hàng", "green"), chip("t2-b2", 1000, 330, "account: 85 tài khoản", "green"),
        chip("t2-b3", 1000, 410, "funds_transfer: 132 lệnh chuyển", "green"), chip("t2-b4", 1000, 490, "stmt_entry: 932 bút toán", "green"),
        chip("t2-b5", 1000, 570, "loan: 15 khoản vay", "green"),
        gnode("t2-n1", 160, 300, 440, 110, "customer", "green"), gnode("t2-n2", 740, 300, 440, 110, "account", "green"),
        gnode("t2-n3", 1320, 300, 440, 110, "stmt_entry", "green"),
        wires(arrow("t2-w1", [(600, 355), (740, 355)], "green"), arrow("t2-w2", [(1180, 355), (1320, 355)], "green")),
        el("t2-r1", 600, 300, 140, None, "1 : N", "lbl r", "text-align:center;font:700 28px var(--mono);color:var(--green)"),
        el("t2-r2", 1180, 300, 140, None, "1 : N", "lbl r", "text-align:center;font:700 28px var(--mono);color:var(--green)"),
        el("t2-nt", 160, 520, 1600, None, "Khách có tài khoản, tài khoản có bút toán: mỗi lần tiền ra vào là một dòng", "note left r"),
        sqlbox("t2-q", 160, 190, 780, ["SELECT * FROM stmt_entry", "ORDER BY stmt_entry_id", "LIMIT 5;"], 27),
        tbl("t2-t", 100, 400, [(70, True), (200, True), (100, True), (250, True), (190, True), (190, True), (90, True), (330, False)],
            ["id", "account_id", "txn", "amount", "booking", "value", "ft", "narrative"],
            [["1", "1000000041", "501", "30000000.00", "2023-06-06", "2023-06-06", "NULL", "Giai ngan LD2400010"],
             ["2", "1000000080", "501", "-30000000.00", "2023-06-06", "2023-06-06", "NULL", "Giai ngan LD2400010"],
             ["3", "1000000029", "501", "400000000.00", "2023-06-27", "2023-06-27", "NULL", "Giai ngan LD2400012"],
             ["4", "1000000082", "501", "-400000000.00", "2023-06-27", "2023-06-27", "NULL", "Giai ngan LD2400012"],
             ["5", "1000000043", "501", "50000000.00", "2023-07-25", "2023-07-25", "NULL", "Giai ngan LD2400013"]], 62, 26),
        chip("t2-sg", 160, 790, "amount dương: tiền vào · âm: tiền ra", "amber"),
        sqlbox("t2-q2", 160, 190, 780, ["SELECT * FROM funds_transfer", "ORDER BY ft_id", "LIMIT 5;"], 27),
        tbl("t2-u", 100, 400, [(210, True), (240, True), (260, True), (200, True), (90, True), (190, True), (120, False), (330, False)],
            ["ft_id", "debit_account", "credit_account", "amount", "ccy", "date", "status", "narrative"],
            [["FT240000001", "1000000007", "1000000037", "2000000.00", "VND", "2024-01-04", "DONE", "Tien an"],
             ["FT240000002", "1000000014", "1000000031", "42.00", "USD", "2024-01-08", "DONE", "Tra tien nha"],
             ["FT240000003", "1000000003", "1000000016", "3000000.00", "VND", "2024-01-11", "DONE", "Chuyen tien mua hang"],
             ["FT240000004", "1000000055", "1000000064", "1000000.00", "VND", "2024-01-17", "DONE", "Thanh toan hoc phi"],
             ["FT240000005", "1000000041", "1000000004", "2000000.00", "VND", "2024-01-21", "DONE", "NULL"]], 62, 26),
        chip("t2-df", 160, 790, "debit_account bị trừ · credit_account nhận", "violet"),
    ]), beats=[
        ("Phần sáu. T hai mươi bốn là phần mềm lõi của nhiều ngân hàng. Bộ dữ liệu khoá học là bản giả lập, toàn số liệu bịa, gồm mười một bảng.",
         "Phần 6: T24 là phần mềm lõi ngân hàng. Bộ dữ liệu giả lập gồm 11 bảng.",
         [TYPE("#t2-big", 0.1, 0.06), IN("#t2-bsub", "blur", 0.9), OUT("#t2-big, #t2-bsub", "zoom", 3.4), IN("#t2-hud", "left", 4.0)]),
        ("Sáu bảng danh mục, ít dòng: chi nhánh, cán bộ, nhóm khách, loại tiền, loại sản phẩm, loại giao dịch.",
         "6 bảng danh mục ít dòng: 5, 8, 4, 4, 7, 8 dòng.",
         [IN("#t2-l1", "fade", 0.2), IN("#t2-a1", "left", 0.6), IN("#t2-a2", "left", 1.6), IN("#t2-a3", "left", 2.8), IN("#t2-a4", "left", 3.8),
          IN("#t2-a5", "left", 4.8), IN("#t2-a6", "left", 6.0)]),
        ("Năm bảng dữ liệu chính: bốn mươi khách hàng, tám mươi lăm tài khoản, một trăm ba mươi hai lệnh chuyển khoản, chín trăm ba mươi hai bút toán, và mười lăm khoản vay.",
         "5 bảng chính: 40 khách, 85 tài khoản, 132 lệnh chuyển, 932 bút toán, 15 khoản vay.",
         [DIM("#t2-l1, #t2-a1, #t2-a2, #t2-a3, #t2-a4, #t2-a5, #t2-a6", 0, 0.12), IN("#t2-l2", "fade", 0.2), IN("#t2-b1", "left", 0.6), IN("#t2-b2", "left", 2.0),
          IN("#t2-b3", "left", 3.4), IN("#t2-b4", "left", 5.6), IN("#t2-b5", "left", 7.6)]),
        ("Các bảng nối nhau bằng khoá ngoại: khách có tài khoản, tài khoản có bút toán, và mỗi lần tiền ra vào là một dòng.",
         "customer 1 : N account 1 : N stmt_entry.",
         [OUT("#t2-l1, #t2-a1, #t2-a2, #t2-a3, #t2-a4, #t2-a5, #t2-a6, #t2-l2, #t2-b1, #t2-b2, #t2-b3, #t2-b4, #t2-b5", "fade", 0, 0.4),
          IN("#t2-n1", "pop", 0.6), *ARROW("t2-w1", 1.4, 0.6), IN("#t2-r1", "fade", 1.8), IN("#t2-n2", "pop", 2.2), *ARROW("t2-w2", 3.0, 0.6),
          IN("#t2-r2", "fade", 3.4), IN("#t2-n3", "pop", 3.8), IN("#t2-nt", "up", 4.6)]),
        ("Xem thử bảng bút toán. Mỗi lần nộp, rút, chuyển hay thu phí là một dòng. Số tiền dương là tiền vào, âm là tiền ra.",
         "stmt_entry: mỗi lần tiền ra vào là một dòng. amount dương là vào, âm là ra.",
         [OUT("#t2-n1, #t2-n2, #t2-n3, #t2-w1, #t2-w2, #t2-r1, #t2-r2, #t2-nt", "fade", 0, 0.4), IN("#t2-q", "up", 0.6, 0.4), IN("#t2-q-1", "type1", 0.9, 0.3),
          IN("#t2-q-2", "type1", 1.6, 0.3), IN("#t2-q-3", "type1", 2.2, 0.3), IN("#t2-t-h", "left", 2.8), IN("#t2-t-1", "left", 3.2), IN("#t2-t-2", "left", 3.6),
          IN("#t2-t-3", "left", 4.0), IN("#t2-t-4", "left", 4.4), IN("#t2-t-5", "left", 4.8), IN("#t2-sg", "left", 6.0)]),
        ("Còn bảng lệnh chuyển khoản ghi rõ tài khoản bị trừ, tài khoản nhận tiền, cùng số tiền và loại tiền.",
         "funds_transfer: tài khoản bị trừ và tài khoản nhận.",
         [OUT("#t2-q, #t2-t-h, #t2-t-1, #t2-t-2, #t2-t-3, #t2-t-4, #t2-t-5, #t2-sg", "fade", 0, 0.4), IN("#t2-q2", "up", 0.6, 0.4), IN("#t2-q2-1", "type1", 0.9, 0.3),
          IN("#t2-q2-2", "type1", 1.6, 0.3), IN("#t2-q2-3", "type1", 2.2, 0.3), IN("#t2-u-h", "left", 2.6), IN("#t2-u-1", "left", 3.0), IN("#t2-u-2", "left", 3.3),
          IN("#t2-u-3", "left", 3.6), IN("#t2-u-4", "left", 3.9), IN("#t2-u-5", "left", 4.2), IN("#t2-df", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "Bảng, dòng, cột", "kiểu dữ liệu: tiền là numeric"),
                                                ("lock", "Khoá chính", "duy nhất, không NULL"),
                                                ("share", "Khoá ngoại", "trỏ sang khoá chính"),
                                                ("quote", "NULL", "chưa biết, khác 0")]),
        chip("ou-next", 560, 650, "Bài tiếp: Thiết kế ERD và lược đồ quan hệ", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: dữ liệu nằm trong bảng, mỗi bảng có dòng và cột, và mỗi cột có một kiểu. Khoá chính nhận diện từng dòng, khoá ngoại nối các bảng với nhau. Còn NULL nghĩa là chưa biết, khác với số không.",
         "Bảng, dòng, cột, kiểu dữ liệu · khoá chính · khoá ngoại · NULL khác 0.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.6), IN("#ou-c2", "pop", 8.0), IN("#ou-c3", "pop", 11.0)]),
        ("Bài sau, ta học thiết kế sơ đồ thực thể quan hệ.", "Bài tiếp: Thiết kế ERD và lược đồ quan hệ.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
