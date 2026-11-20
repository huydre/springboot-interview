"""SQL select explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-select.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
customer 100001..100005 Lý Hoàng Long, Dương Văn An, Ngô Anh Tuấn, Hoàng Quốc Bảo (Hà Nội), Ngô Ngọc Anh (TP. Hồ Chí Minh); customer 40 rows;
loan LIVE LD2400001 30000000.00, LD2400002 200000000.00, LD2400003 800000000.00, LD2400004 50000000.00 (rates 12.00, 9.00, 11.00, 13.50, interest 3600000, 18000000, 88000000, 6750000);
errors: "SELECT customer_id, FROM customer" -> syntax error at or near "FROM"; WHERE so_du > 0 -> column "so_du" does not exist;
SELECT customer_id full_name -> one column full_name 100001..100003; 7 / 2 = 3, 7 / 2.0 = 3.5000000000000000, NULL + 1 = NULL, 0.1 + 0.2 = 0.3;
DISTINCT city 5 rows (Cần Thơ, Hà Nội, Hải Phòng, TP. Hồ Chí Minh, Đà Nẵng), DISTINCT city, customer_status 9 rows, DISTINCT gender F, M, NULL;
top 3 account working_balance 1000000062 3052868789.00, 1000000059 3042221015.00, 1000000066 1777312000.00.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<c>--[^\n]*|/\*.*?\*/)|(?P<s>'[^']*'|\"[^\"]*\")|(?P<k>\b(?:SELECT|DISTINCT|FROM|WHERE|AS|ORDER BY|DESC|LIMIT)\b)|(?P<n>\b\d+(?:\.\d+)?\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(c="#7d8597", s="#a7f3d0", k="#c4b5fd", n="#9cc3ff")


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


def errbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r")


def okbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r",
              "color:#9be37a;border-color:var(--green);background:linear-gradient(165deg,rgba(74,222,128,.16),rgba(6,24,12,.85));box-shadow:none")


def step(id_, x, n, name, sub, tone="cyan"):
    return box(id_, x, 520, 320, 120,
               f'<div style="text-align:center;padding-top:14px"><b style="font:700 34px var(--mono)">{n} · {name}</b>'
               f'<div style="font-size:24px;opacity:.75;margin-top:6px">{sub}</div></div>', tone)


def state(id_, text, tone="cyan"):
    return box(id_, 1080, 190, 740, 250, f'<div style="padding:26px 30px;font-size:32px;line-height:1.4">{text}</div>', tone)


def lines(n):
    return ", ".join(f"#{n}-{i}" for i in range(1, 12))


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu lệnh SQL đầu tiên", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Viết SELECT trước, nhưng máy chạy cái nào trước?"), "h1 center r"),
        sqlbox("hk-s", 560, 420, 800, ["SELECT full_name, city", "FROM customer;"], 34),
        chip("hk-n1", 1400, 440, "chạy thứ hai", "cyan"),
        chip("hk-n2", 1400, 530, "chạy thứ nhất", "green"),
        tile("hk-tile", 400, 350, 220, "grid"),
        el("hk-word", 670, 380, 1200, None, letters("SELECT & Alias"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Chọn cột · Thứ tự chạy · Alias · Số học · DISTINCT · LIMIT", "kin-sub r"),
    ]), beats=[
        ("Bạn viết SELECT ở dòng đầu, FROM ở dòng sau. Vậy máy chạy dòng nào trước?",
         "Viết SELECT trước, FROM sau. Máy chạy dòng nào trước?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-s", "up", 2.6, 0.4), IN("#hk-s-1", "type1", 2.9, 0.3), IN("#hk-s-2", "type1", 3.8, 0.3)]),
        ("Bất ngờ là máy mở bảng trước, rồi mới chọn cột. Thứ tự thật khác thứ tự viết.",
         "Máy mở bảng (FROM) trước, rồi mới chọn cột (SELECT).",
         [IN("#hk-n2", "left", 0.4), PULSE("#hk-s-2", 0.6), IN("#hk-n1", "left", 2.2), PULSE("#hk-s-1", 2.4)]),
        ("Hôm nay ta học cách chọn cột, đặt tên, tính toán, bỏ dòng trùng và giới hạn số dòng.",
         "Hôm nay: chọn cột, alias, tính toán, DISTINCT, LIMIT.",
         [OUT("#hk-eye, #hk-q, #hk-s, #hk-n1, #hk-n2", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ select-from
    dict(id="select-from", world=(1920, 1080), hud=hud("sf", "SELECT và FROM", "Chọn cột cần xem"), cam="".join([
        big_title("sf", "SELECT và FROM", "Lấy từ bảng nào, xem cột nào"),
        sqlbox("sf-q", 160, 190, 820, ["SELECT customer_id, full_name, city", "FROM customer", "ORDER BY customer_id", "LIMIT 5;"]),
        tbl("sf-t", 160, 500, [(200, True), (380, False), (340, False)], ["customer_id", "full_name", "city"],
            [["100001", "Lý Hoàng Long", "Hà Nội"], ["100002", "Dương Văn An", "Hà Nội"], ["100003", "Ngô Anh Tuấn", "Hà Nội"],
             ["100004", "Hoàng Quốc Bảo", "Hà Nội"], ["100005", "Ngô Ngọc Anh", "TP. Hồ Chí Minh"]], 66, 27),
        chip("sf-c1", 1150, 230, "FROM: lấy từ bảng nào", "green"),
        chip("sf-c2", 1150, 320, "SELECT: xem những cột nào", "cyan"),
        sqlbox("sf-q2", 160, 190, 820, ["SELECT status, ld_id, principal", "FROM loan", "ORDER BY ld_id", "LIMIT 3;"]),
        tbl("sf-u", 160, 500, [(200, False), (260, True), (320, True)], ["status", "ld_id", "principal"],
            [["LIVE", "LD2400001", "30000000.00"], ["LIVE", "LD2400002", "200000000.00"], ["LIVE", "LD2400003", "800000000.00"]], 66, 27),
        chip("sf-c3", 1150, 230, "Cột hiện đúng thứ tự bạn viết", "violet"),
        chip("sf-c4", 1150, 320, "Nên liệt kê cột, hạn chế SELECT *", "amber"),
        sqlbox("sf-q3", 160, 190, 820, ["SELECT customer_id, FROM customer;"]),
        errbox("sf-err", 160, 400, 1000, 'ERROR: syntax error at or near "FROM"'),
        chip("sf-c5", 160, 520, "Dấu phẩy thừa ngay trước FROM", "red"),
    ]), beats=[
        ("Phần một. Một câu truy vấn có hai phần: FROM nói lấy từ bảng nào, SELECT nói xem những cột nào.",
         "Phần 1: FROM lấy từ bảng nào, SELECT xem những cột nào.",
         [TYPE("#sf-big", 0.1, 0.06), IN("#sf-bsub", "blur", 0.9), OUT("#sf-big, #sf-bsub", "zoom", 3.4), IN("#sf-hud", "left", 4.0)]),
        ("Ví dụ, ta xem mã khách, họ tên và thành phố từ bảng khách hàng, lấy năm người đầu.",
         "Xem customer_id, full_name, city của 5 khách đầu.",
         [IN("#sf-q", "up", 0.3, 0.4), IN("#sf-q-1", "type1", 0.6, 0.3), IN("#sf-q-2", "type1", 2.2, 0.3), IN("#sf-q-3", "type1", 3.4, 0.3),
          IN("#sf-q-4", "type1", 4.4, 0.3), IN("#sf-c1", "left", 3.0), IN("#sf-c2", "left", 5.2)]),
        ("Kết quả có năm dòng, ba cột, đúng thứ tự cột bạn đã viết.",
         "5 dòng, 3 cột, đúng thứ tự đã viết.",
         [IN("#sf-t-h", "left", 0.3), IN("#sf-t-1", "left", 1.0), IN("#sf-t-2", "left", 1.4), IN("#sf-t-3", "left", 1.8), IN("#sf-t-4", "left", 2.2), IN("#sf-t-5", "left", 2.6)]),
        ("Đổi thứ tự cột thì kết quả đổi theo. Ở bảng khoản vay, trạng thái đứng đầu vì ta viết nó đầu tiên. Trong công việc thật, hãy liệt kê cột cần dùng thay vì dấu sao.",
         "Kết quả theo thứ tự cột bạn viết. Nên liệt kê cột, hạn chế SELECT *.",
         [OUT("#sf-q, #sf-t-h, #sf-t-1, #sf-t-2, #sf-t-3, #sf-t-4, #sf-t-5, #sf-c1, #sf-c2", "fade", 0, 0.4), IN("#sf-q2", "up", 0.6, 0.4),
          IN("#sf-q2-1", "type1", 0.9, 0.3), IN("#sf-q2-2", "type1", 1.8, 0.3), IN("#sf-q2-3", "type1", 2.6, 0.3), IN("#sf-q2-4", "type1", 3.4, 0.3),
          IN("#sf-u-h", "left", 4.2), IN("#sf-u-1", "left", 4.7), IN("#sf-u-2", "left", 5.0), IN("#sf-u-3", "left", 5.3), IN("#sf-c3", "left", 6.0), IN("#sf-c4", "left", 9.0)]),
        ("Lỗi hay gặp đầu tiên là dấu phẩy thừa ngay trước FROM. Máy báo lỗi cú pháp, chỉ đúng chỗ FROM.",
         "Bẫy: dấu phẩy thừa trước FROM gây lỗi cú pháp.",
         [OUT("#sf-q2, #sf-u-h, #sf-u-1, #sf-u-2, #sf-u-3, #sf-c3, #sf-c4", "fade", 0, 0.4), IN("#sf-q3", "up", 0.6, 0.4), IN("#sf-q3-1", "type1", 0.9, 0.3),
          IN("#sf-err", "up", 3.0), SHAKE("#sf-err", 3.6), IN("#sf-c5", "left", 5.0)]),
    ]),
    # ------------------------------------------------------------ execution-order
    dict(id="execution-order", world=(1920, 1080), hud=hud("eo", "Thứ tự chạy thật", "FROM, SELECT, DISTINCT, ORDER BY, LIMIT"), cam="".join([
        big_title("eo", "Thứ tự chạy thật", "Viết một đằng, chạy một nẻo"),
        sqlbox("eo-q", 160, 190, 760, ["SELECT DISTINCT city", "FROM customer", "ORDER BY city", "LIMIT 3;"]),
        step("eo-s1", 160, 1, "FROM", "lấy bảng", "green"),
        step("eo-s2", 510, 2, "SELECT", "chọn cột", "cyan"),
        step("eo-s3", 860, 3, "DISTINCT", "bỏ dòng trùng", "violet"),
        step("eo-s4", 1210, 4, "ORDER BY", "sắp xếp", "amber"),
        step("eo-s5", 1560, 5, "LIMIT", "cắt N dòng", "cyan"),
        state("eo-m1", "<b>FROM</b>: mở bảng customer<br>40 dòng, mọi cột", "green"),
        state("eo-m2", "<b>SELECT</b>: giữ lại cột city<br>vẫn 40 dòng: Hà Nội, Hà Nội, Hà Nội...", "cyan"),
        state("eo-m3", "<b>DISTINCT</b>: bỏ dòng trùng<br>40 dòng còn 5 dòng", "violet"),
        state("eo-m4", "<b>ORDER BY</b>: sắp 5 dòng theo city<br>Cần Thơ, Hà Nội, Hải Phòng...", "amber"),
        state("eo-m5", "<b>LIMIT 3</b>: cắt lấy 3 dòng đầu<br>Cần Thơ · Hà Nội · Hải Phòng", "cyan"),
        chip("eo-ok", 160, 720, "ORDER BY so_du: chạy được, alias đã có", "green"),
        chip("eo-bad", 160, 810, "WHERE so_du > 0: column \"so_du\" does not exist", "red"),
        chip("eo-why", 160, 900, "WHERE chạy trước SELECT nên chưa biết alias", "amber"),
    ]), beats=[
        ("Phần hai. Máy chạy câu lệnh theo thứ tự logic khác hẳn thứ tự bạn viết.",
         "Phần 2: thứ tự chạy khác thứ tự viết.",
         [TYPE("#eo-big", 0.1, 0.06), IN("#eo-bsub", "blur", 0.9), OUT("#eo-big, #eo-bsub", "zoom", 3.4), IN("#eo-hud", "left", 4.0)]),
        ("Ta lấy một câu ví dụ: các thành phố khác nhau của khách, sắp theo tên, lấy ba cái đầu.",
         "Ví dụ: thành phố khác nhau, sắp xếp, lấy 3 dòng đầu.",
         [IN("#eo-q", "up", 0.3, 0.4), IN("#eo-q-1", "type1", 0.6, 0.3), IN("#eo-q-2", "type1", 1.6, 0.3), IN("#eo-q-3", "type1", 2.6, 0.3), IN("#eo-q-4", "type1", 3.6, 0.3)]),
        ("Bước một là FROM. Máy mở bảng khách hàng, bốn mươi dòng, đủ mọi cột.",
         "Bước 1 FROM: mở bảng customer, 40 dòng.",
         [IN("#eo-s1", "up", 0.3), IN("#eo-s2, #eo-s3, #eo-s4, #eo-s5", "fade", 0.6, 0.4), DIM("#eo-s2, #eo-s3, #eo-s4, #eo-s5", 1.0, 0.25), IN("#eo-m1", "left", 1.2)]),
        ("Bước hai là SELECT. Chỉ giữ lại cột thành phố, nhưng vẫn còn bốn mươi dòng, nhiều dòng lặp.",
         "Bước 2 SELECT: giữ cột city, vẫn 40 dòng.",
         [OUT("#eo-m1", "fade", 0, 0.3), DIM("#eo-s1", 0, 0.25), DIM("#eo-s2", 0.1, 1), IN("#eo-m2", "left", 0.5)]),
        ("Bước ba là DISTINCT. Nó chạy sau SELECT, nên chỉ nhìn các cột đã chọn, và bốn mươi dòng còn năm.",
         "Bước 3 DISTINCT: chạy sau SELECT, 40 dòng còn 5.",
         [OUT("#eo-m2", "fade", 0, 0.3), DIM("#eo-s2", 0, 0.25), DIM("#eo-s3", 0.1, 1), IN("#eo-m3", "left", 0.5)]),
        ("Bước bốn sắp xếp năm dòng đó. Và bước cuối cùng, LIMIT, cắt lấy ba dòng đầu trên kết quả đã bỏ trùng.",
         "Bước 4 ORDER BY, bước 5 LIMIT: cắt sau cùng, ra 3 dòng.",
         [OUT("#eo-m3", "fade", 0, 0.3), DIM("#eo-s3", 0, 0.25), DIM("#eo-s4", 0.1, 1), IN("#eo-m4", "left", 0.5),
          OUT("#eo-m4", "fade", 4.0, 0.3), DIM("#eo-s4", 4.0, 0.25), DIM("#eo-s5", 4.1, 1), IN("#eo-m5", "left", 4.5)]),
        ("Hệ quả: ORDER BY chạy sau SELECT, nên dùng được alias. Còn WHERE chạy trước SELECT, chưa biết alias, nên báo lỗi cột không tồn tại.",
         "ORDER BY dùng được alias; WHERE chạy trước nên báo lỗi.",
         [OUT("#eo-m5, #eo-q", "fade", 0, 0.4), DIM("#eo-s1, #eo-s3, #eo-s5", 0, 0.2), DIM("#eo-s2, #eo-s4", 0, 1),
          IN("#eo-ok", "left", 0.8), IN("#eo-bad", "left", 4.4), SHAKE("#eo-bad", 5.0), IN("#eo-why", "left", 7.0)]),
    ]),
    # ------------------------------------------------------------ alias
    dict(id="alias", world=(1920, 1080), hud=hud("al", "Alias", "Đặt tên cho cột kết quả"), cam="".join([
        big_title("al", "Alias", "Đặt tên cho cột kết quả"),
        sqlbox("al-q", 160, 190, 860, ["SELECT full_name AS ho_ten,", "       city AS thanh_pho", "FROM customer", "ORDER BY customer_id LIMIT 4;"]),
        tbl("al-t", 160, 500, [(380, False), (300, False)], ["ho_ten", "thanh_pho"],
            [["Lý Hoàng Long", "Hà Nội"], ["Dương Văn An", "Hà Nội"], ["Ngô Anh Tuấn", "Hà Nội"], ["Hoàng Quốc Bảo", "Hà Nội"]], 66, 28),
        chip("al-c1", 1150, 230, "Alias chỉ đổi tên trong kết quả", "cyan"),
        chip("al-c2", 1150, 320, "Bảng customer vẫn giữ full_name", "green"),
        sqlbox("al-q2", 160, 190, 860, ["SELECT ld_id AS \"Mã khoản vay\",", "       principal AS \"Số tiền vay\"", "FROM loan", "ORDER BY ld_id LIMIT 4;"]),
        tbl("al-u", 160, 500, [(340, False), (340, False)], ["Mã khoản vay", "Số tiền vay"],
            [["LD2400001", "30000000.00"], ["LD2400002", "200000000.00"], ["LD2400003", "800000000.00"], ["LD2400004", "50000000.00"]], 66, 28),
        chip("al-c3", 1150, 230, "Có dấu cách: bọc nháy kép", "violet"),
        chip("al-c4", 1150, 320, "Nháy đơn là giá trị, nháy kép là tên", "amber"),
        sqlbox("al-q3", 160, 190, 860, ["SELECT customer_id full_name", "FROM customer", "ORDER BY customer_id LIMIT 3;"]),
        tbl("al-v", 160, 450, [(340, True)], ["full_name"], [["100001"], ["100002"], ["100003"]], 66, 30),
        chip("al-c5", 1150, 230, "Quên dấu phẩy: AS được bỏ qua", "red"),
        chip("al-c6", 1150, 320, "Ra MỘT cột, chứa mã số", "red"),
        chip("al-c7", 1150, 410, "Luôn viết AS cho rõ", "green"),
    ]), beats=[
        ("Phần ba. Alias là tên tạm bạn đặt cho cột của kết quả, bằng từ khoá AS.",
         "Phần 3: alias là tên tạm cho cột kết quả, đặt bằng AS.",
         [TYPE("#al-big", 0.1, 0.06), IN("#al-bsub", "blur", 0.9), OUT("#al-big, #al-bsub", "zoom", 3.4), IN("#al-hud", "left", 4.0)]),
        ("Họ tên thành ho_ten, thành phố thành thanh_pho. Chỉ cột trong kết quả đổi tên, bảng gốc vẫn y nguyên.",
         "full_name AS ho_ten, city AS thanh_pho. Bảng gốc không đổi.",
         [IN("#al-q", "up", 0.3, 0.4), IN("#al-q-1", "type1", 0.5, 0.3), IN("#al-q-2", "type1", 1.1, 0.3), IN("#al-q-3", "type1", 1.7, 0.3), IN("#al-q-4", "type1", 2.2, 0.3),
          IN("#al-t-h", "left", 2.8), IN("#al-t-1", "left", 3.1), IN("#al-t-2", "left", 3.3), IN("#al-t-3", "left", 3.5), IN("#al-t-4", "left", 3.7),
          IN("#al-c1", "left", 3.9), IN("#al-c2", "left", 4.5)]),
        ("Alias có dấu cách hoặc tiếng Việt có dấu thì bọc trong nháy kép. Nháy đơn là một giá trị chuỗi, nháy kép mới là một cái tên.",
         "Alias có dấu cách: nháy kép. Nháy đơn là giá trị, nháy kép là tên.",
         [OUT("#al-q, #al-t-h, #al-t-1, #al-t-2, #al-t-3, #al-t-4, #al-c1, #al-c2", "fade", 0, 0.4), IN("#al-q2", "up", 0.6, 0.4),
          IN("#al-q2-1", "type1", 0.9, 0.3), IN("#al-q2-2", "type1", 1.9, 0.3), IN("#al-q2-3", "type1", 2.9, 0.3), IN("#al-q2-4", "type1", 3.5, 0.3),
          IN("#al-u-h", "left", 4.2), IN("#al-u-1", "left", 4.7), IN("#al-u-2", "left", 5.0), IN("#al-u-3", "left", 5.3), IN("#al-u-4", "left", 5.6),
          IN("#al-c3", "left", 5.2), IN("#al-c4", "left", 6.0)]),
        ("Bẫy kinh điển: quên dấu phẩy giữa hai cột. Vì có thể bỏ chữ AS, câu vẫn chạy, nhưng chỉ ra một cột tên full_name, chứa toàn mã số.",
         "Bẫy: quên dấu phẩy, ra một cột full_name chứa mã số.",
         [OUT("#al-q2, #al-u-h, #al-u-1, #al-u-2, #al-u-3, #al-u-4, #al-c3, #al-c4", "fade", 0, 0.4), IN("#al-q3", "up", 0.6, 0.4),
          IN("#al-q3-1", "type1", 0.9, 0.3), IN("#al-q3-2", "type1", 1.9, 0.3), IN("#al-q3-3", "type1", 2.7, 0.3),
          IN("#al-v-h", "left", 4.0), IN("#al-v-1", "left", 4.5), IN("#al-v-2", "left", 4.8), IN("#al-v-3", "left", 5.1), IN("#al-c5", "left", 5.6),
          IN("#al-c6", "left", 7.2), SHAKE("#al-c6", 7.8)]),
        ("Cách tránh rất đơn giản: tập thói quen luôn viết AS.",
         "Luôn viết AS để tránh lỗi này.",
         [IN("#al-c7", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ arithmetic
    dict(id="arithmetic", world=(1920, 1080), hud=hud("ar", "Biểu thức số học", "Tính toán trên từng dòng"), cam="".join([
        big_title("ar", "Biểu thức số học", "SELECT còn biết tính toán"),
        sqlbox("ar-q", 160, 190, 1100, ["SELECT ld_id, principal, interest_rate,", "       principal * interest_rate / 100 AS lai_nam", "FROM loan ORDER BY ld_id LIMIT 4;"], 27),
        tbl("ar-t", 160, 470, [(220, True), (270, True), (230, True), (440, True)], ["ld_id", "principal", "interest_rate", "lai_nam"],
            [["LD2400001", "30000000.00", "12.00", "3600000.000000000000"], ["LD2400002", "200000000.00", "9.00", "18000000.000000000000"],
             ["LD2400003", "800000000.00", "11.00", "88000000.000000000000"], ["LD2400004", "50000000.00", "13.50", "6750000.000000000000"]], 66, 26),
        chip("ar-c1", 160, 860, "Mỗi dòng cho một kết quả riêng", "cyan"),
        chip("ar-c2", 700, 860, "Cột tính ra không có tên sẵn: đặt alias", "violet"),
        sqlbox("ar-q2", 160, 190, 820, ["SELECT 7 / 2 AS chia_nguyen,", "       7 / 2.0 AS chia_thuc;"]),
        tbl("ar-u", 160, 440, [(300, True), (520, True)], ["chia_nguyen", "chia_thuc"], [["3", "3.5000000000000000"]], 66, 28),
        chip("ar-c3", 160, 640, "Chia hai số nguyên ra số nguyên", "red"),
        chip("ar-c4", 160, 730, "Muốn 3.5: một số phải có phần thập phân", "green"),
        sqlbox("ar-q3", 1100, 190, 640, ["SELECT NULL + 1 AS x;"]),
        tbl("ar-v", 1100, 340, [(300, True)], ["x"], [["NULL"]], 66, 28),
        chip("ar-c5", 1100, 540, "NULL trong phép tính: ra NULL", "amber"),
        chip("ar-c6", 1100, 630, "numeric: 0.1 + 0.2 ra đúng 0.3", "green"),
    ]), beats=[
        ("Phần bốn. SELECT không chỉ lấy cột có sẵn, mà còn tính toán trên từng dòng.",
         "Phần 4: SELECT tính toán trên từng dòng.",
         [TYPE("#ar-big", 0.1, 0.06), IN("#ar-bsub", "blur", 0.9), OUT("#ar-big, #ar-bsub", "zoom", 3.4), IN("#ar-hud", "left", 4.0)]),
        ("Lãi một năm của khoản vay bằng tiền vay nhân lãi suất chia một trăm. Cột này không có tên sẵn, nên ta đặt alias lai_nam.",
         "Lãi một năm = principal * interest_rate / 100, đặt alias lai_nam.",
         [IN("#ar-q", "up", 0.3, 0.4), IN("#ar-q-1", "type1", 0.6, 0.3), IN("#ar-q-2", "type1", 2.0, 0.3), IN("#ar-q-3", "type1", 4.2, 0.3), IN("#ar-c2", "left", 6.0)]),
        ("Mỗi dòng cho ra một kết quả riêng: khoản đầu lãi ba triệu sáu trăm nghìn, khoản hai mười tám triệu.",
         "LD2400001: lãi 3600000. LD2400002: lãi 18000000.",
         [IN("#ar-t-h", "left", 0.3), IN("#ar-t-1", "left", 0.9), IN("#ar-t-2", "left", 1.3), IN("#ar-t-3", "left", 1.7), IN("#ar-t-4", "left", 2.1), IN("#ar-c1", "left", 3.0),
          DIM("#ar-t-3, #ar-t-4", 4.0, 0.3)]),
        ("Bẫy thứ nhất: chia hai số nguyên ra số nguyên. Bảy chia hai ra ba. Muốn ba phẩy năm, một trong hai số phải có phần thập phân.",
         "7 / 2 ra 3. Muốn 3.5: 7 / 2.0.",
         [OUT("#ar-q, #ar-q-1, #ar-q-2, #ar-q-3, #ar-t-h, #ar-t-1, #ar-t-2, #ar-t-3, #ar-t-4, #ar-c1, #ar-c2", "fade", 0, 0.4), IN("#ar-q2", "up", 0.6, 0.4),
          IN("#ar-q2-1", "type1", 0.9, 0.3), IN("#ar-q2-2", "type1", 2.0, 0.3), IN("#ar-u-h", "left", 3.2), IN("#ar-u-1", "left", 3.7), IN("#ar-c3", "left", 4.6), IN("#ar-c4", "left", 7.2)]),
        ("Bẫy thứ hai: giá trị rỗng trong phép tính thì cả kết quả là rỗng, vì rỗng nghĩa là chưa biết. Còn số tiền kiểu numeric thì cộng chính xác, không sai số.",
         "NULL + 1 ra NULL. numeric tính chính xác: 0.1 + 0.2 = 0.3.",
         [IN("#ar-q3", "up", 0.3, 0.4), IN("#ar-q3-1", "type1", 0.6, 0.3), IN("#ar-v-h", "left", 1.6), IN("#ar-v-1", "left", 2.0), IN("#ar-c5", "left", 2.6), IN("#ar-c6", "left", 6.2)]),
    ]),
    # ------------------------------------------------------------ distinct
    dict(id="distinct", world=(1920, 1080), hud=hud("di", "DISTINCT", "Loại dòng trùng"), cam="".join([
        big_title("di", "DISTINCT", "Mỗi giá trị chỉ một lần"),
        sqlbox("di-q", 160, 190, 760, ["SELECT DISTINCT city", "FROM customer", "ORDER BY city;"]),
        chip("di-c1", 1100, 230, "40 khách, chỉ 5 thành phố", "cyan"),
        tbl("di-t", 160, 480, [(460, False)], ["city"], [["Cần Thơ"], ["Hà Nội"], ["Hải Phòng"], ["TP. Hồ Chí Minh"], ["Đà Nẵng"]], 66, 28),
        sqlbox("di-q2", 160, 190, 900, ["SELECT DISTINCT city, customer_status", "FROM customer", "ORDER BY city, customer_status;"], 27),
        tbl("di-u", 1120, 190, [(380, False), (260, True)], ["city", "customer_status"],
            [["Cần Thơ", "ACTIVE"], ["Cần Thơ", "DORMANT"], ["Hà Nội", "ACTIVE"], ["Hà Nội", "DORMANT"], ["Hải Phòng", "ACTIVE"],
             ["Hải Phòng", "DORMANT"], ["TP. Hồ Chí Minh", "ACTIVE"], ["TP. Hồ Chí Minh", "CLOSED"], ["Đà Nẵng", "ACTIVE"]], 62, 26),
        chip("di-c2", 160, 470, "DISTINCT xét cả dòng, mọi cột", "violet"),
        chip("di-c3", 160, 560, "Mỗi cặp (city, status) một lần: 9 dòng", "green"),
        sqlbox("di-q3", 160, 190, 760, ["SELECT DISTINCT gender", "FROM customer", "ORDER BY gender;"]),
        tbl("di-v", 160, 450, [(300, False)], ["gender"], [["F"], ["M"], ["NULL"]], 66, 30),
        chip("di-c4", 1000, 480, "DISTINCT coi NULL bằng NULL", "amber"),
        chip("di-c5", 1000, 570, "Khách doanh nghiệp: không có giới tính", "cyan"),
        chip("di-c6", 160, 760, "Đừng dùng DISTINCT để che lỗi lặp dòng", "red"),
    ]), beats=[
        ("Phần năm. Muốn bỏ các dòng giống nhau, hãy thêm DISTINCT vào sau SELECT.",
         "Phần 5: DISTINCT loại bỏ dòng trùng.",
         [TYPE("#di-big", 0.1, 0.06), IN("#di-bsub", "blur", 0.9), OUT("#di-big, #di-bsub", "zoom", 2.1), IN("#di-hud", "left", 2.5)]),
        ("Bảng khách hàng có bốn mươi người, nhưng thành phố lặp lại nhiều lần. Thêm DISTINCT là chỉ còn năm thành phố.",
         "40 khách, thêm DISTINCT còn 5 thành phố.",
         [IN("#di-q", "up", 0.3, 0.4), IN("#di-q-1", "type1", 0.6, 0.3), IN("#di-q-2", "type1", 1.6, 0.3), IN("#di-q-3", "type1", 2.4, 0.3), IN("#di-c1", "left", 3.2),
          IN("#di-t-h", "left", 4.4), IN("#di-t-1", "left", 4.8), IN("#di-t-2", "left", 5.1), IN("#di-t-3", "left", 5.4), IN("#di-t-4", "left", 5.7), IN("#di-t-5", "left", 6.0)]),
        ("Nó xét cả dòng, tức là mọi cột bạn chọn. Thêm trạng thái khách vào, ta có chín dòng, vì mỗi cặp thành phố và trạng thái được tính một lần.",
         "DISTINCT xét mọi cột đã chọn: 9 cặp (city, customer_status).",
         [OUT("#di-q, #di-c1, #di-t-h, #di-t-1, #di-t-2, #di-t-3, #di-t-4, #di-t-5", "fade", 0, 0.4), IN("#di-q2", "up", 0.6, 0.4),
          IN("#di-q2-1", "type1", 0.8, 0.3), IN("#di-q2-2", "type1", 1.6, 0.3), IN("#di-q2-3", "type1", 2.2, 0.3), IN("#di-u-h", "left", 2.8),
          IN("#di-u-1", "left", 3.1), IN("#di-u-2", "left", 3.25), IN("#di-u-3", "left", 3.4), IN("#di-u-4", "left", 3.55), IN("#di-u-5", "left", 3.7),
          IN("#di-u-6", "left", 3.85), IN("#di-u-7", "left", 4.0), IN("#di-u-8", "left", 4.15), IN("#di-u-9", "left", 4.3),
          IN("#di-c2", "left", 4.8), IN("#di-c3", "left", 6.0)]),
        ("Với giá trị rỗng, DISTINCT coi hai giá trị rỗng là bằng nhau. Cột giới tính ra ba dòng: nữ, nam, và một dòng rỗng của khách doanh nghiệp.",
         "gender: F, M và một dòng NULL.",
         [OUT("#di-q2, #di-u-h, #di-u-1, #di-u-2, #di-u-3, #di-u-4, #di-u-5, #di-u-6, #di-u-7, #di-u-8, #di-u-9, #di-c2, #di-c3", "fade", 0, 0.4), IN("#di-q3", "up", 0.6, 0.4),
          IN("#di-q3-1", "type1", 0.9, 0.3), IN("#di-q3-2", "type1", 1.7, 0.3), IN("#di-q3-3", "type1", 2.5, 0.3), IN("#di-v-h", "left", 3.4), IN("#di-v-1", "left", 3.8),
          IN("#di-v-2", "left", 4.1), IN("#di-v-3", "left", 4.4), IN("#di-c4", "left", 5.0), IN("#di-c5", "left", 7.4)]),
        ("Và đừng dùng DISTINCT để chữa kết quả bị lặp khi chưa hiểu vì sao lặp. Ở bài JOIN, nó che mất lỗi nhân dòng chứ không sửa được.",
         "Đừng dùng DISTINCT để che lỗi lặp dòng.",
         [DIM("#di-q3, #di-v-h, #di-v-1, #di-v-2, #di-v-3, #di-c4, #di-c5", 0, 0.12), IN("#di-c6", "left", 0.6), SHAKE("#di-c6", 1.4)]),
    ]),
    # ------------------------------------------------------------ limit-comment
    dict(id="limit-comment", world=(1920, 1080), hud=hud("lc", "LIMIT và chú thích", "Top N, và ghi chú trong SQL"), cam="".join([
        big_title("lc", "LIMIT và chú thích", "Lấy N dòng đầu, ghi chú cho người đọc"),
        sqlbox("lc-q", 160, 190, 860, ["SELECT account_id, working_balance", "FROM account", "ORDER BY working_balance DESC", "LIMIT 3;"]),
        tbl("lc-t", 160, 500, [(280, True), (330, True)], ["account_id", "working_balance"],
            [["1000000062", "3052868789.00"], ["1000000059", "3042221015.00"], ["1000000066", "1777312000.00"]], 66, 28),
        chip("lc-c1", 1150, 230, "Top 3: sắp giảm dần rồi LIMIT", "green"),
        chip("lc-c2", 1150, 320, "LIMIT chạy sau cùng", "cyan"),
        chip("lc-c3", 160, 800, "LIMIT không có ORDER BY: N dòng nào cũng được", "red"),
        chip("lc-c4", 160, 890, "Muốn ổn định thì luôn kèm ORDER BY", "green"),
        sqlbox("lc-q2", 160, 190, 1000, ["-- top 3 tài khoản có số dư lớn nhất", "SELECT account_id, working_balance", "       -- , customer_id", "FROM account",
                                         "ORDER BY working_balance DESC", "LIMIT 3;"]),
        chip("lc-c5", 1250, 230, "Hai gạch ngang: chú thích hết dòng", "cyan"),
        chip("lc-c6", 1250, 320, "Gạch chéo sao: chú thích nhiều dòng", "violet"),
        chip("lc-c7", 1250, 410, "Đặt hai gạch trước dòng để tắt tạm", "amber"),
        chip("lc-c8", 1250, 500, "Database bỏ qua chú thích", "green"),
    ]), beats=[
        ("Phần sáu. LIMIT chỉ lấy n dòng đầu của kết quả, và chú thích giúp người đọc hiểu câu lệnh.",
         "Phần 6: LIMIT lấy N dòng đầu; chú thích cho người đọc.",
         [TYPE("#lc-big", 0.1, 0.06), IN("#lc-bsub", "blur", 0.9), OUT("#lc-big, #lc-bsub", "zoom", 3.4), IN("#lc-hud", "left", 4.0)]),
        ("LIMIT chạy cuối cùng. Sắp số dư giảm dần rồi lấy ba dòng đầu, ta có ba tài khoản giàu nhất.",
         "Top 3 tài khoản: ORDER BY giảm dần rồi LIMIT 3.",
         [IN("#lc-q", "up", 0.3, 0.4), IN("#lc-q-1", "type1", 0.5, 0.3), IN("#lc-q-2", "type1", 1.1, 0.3), IN("#lc-q-3", "type1", 1.7, 0.3), IN("#lc-q-4", "type1", 2.3, 0.3),
          IN("#lc-t-h", "left", 3.0), IN("#lc-t-1", "left", 3.3), IN("#lc-t-2", "left", 3.5), IN("#lc-t-3", "left", 3.7), IN("#lc-c1", "left", 4.0), IN("#lc-c2", "left", 4.7)]),
        ("Bẫy: LIMIT mà không có ORDER BY thì ba dòng đầu là ba dòng nào cũng được, máy không hứa thứ tự. Muốn ổn định, luôn kèm ORDER BY.",
         "LIMIT không ORDER BY: không đảm bảo thứ tự. Luôn kèm ORDER BY.",
         [DIM("#lc-q, #lc-q-1, #lc-q-2, #lc-q-3, #lc-q-4, #lc-t-h, #lc-t-1, #lc-t-2, #lc-t-3, #lc-c1, #lc-c2", 0, 0.12), IN("#lc-c3", "left", 0.6), SHAKE("#lc-c3", 1.4), IN("#lc-c4", "left", 5.4)]),
        ("Cuối cùng là chú thích. Hai gạch ngang chú thích đến hết dòng, còn dấu gạch chéo sao dùng cho nhiều dòng. Database bỏ qua chúng, nên đặt hai gạch trước một dòng là tắt tạm dòng đó.",
         "Hai gạch ngang: chú thích hết dòng; gạch chéo sao: nhiều dòng; tắt tạm một dòng.",
         [OUT("#lc-q, #lc-q-1, #lc-q-2, #lc-q-3, #lc-q-4, #lc-t-h, #lc-t-1, #lc-t-2, #lc-t-3, #lc-c1, #lc-c2, #lc-c3, #lc-c4", "fade", 0, 0.4), IN("#lc-q2", "up", 0.6, 0.4),
          IN("#lc-q2-1", "type1", 0.9, 0.3), IN("#lc-q2-2", "type1", 1.8, 0.3), IN("#lc-q2-3", "type1", 2.8, 0.3), IN("#lc-q2-4", "type1", 3.6, 0.3),
          IN("#lc-q2-5", "type1", 3.6, 0.3), IN("#lc-q2-6", "type1", 4.1, 0.3), IN("#lc-c5", "left", 4.6), IN("#lc-c6", "left", 5.8), IN("#lc-c7", "left", 7.0), IN("#lc-c8", "left", 8.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "SELECT, FROM", "chọn cột theo thứ tự viết"),
                                                ("split", "Thứ tự chạy", "FROM trước, LIMIT sau cùng"),
                                                ("quote", "Alias và số học", "luôn viết AS, 7 / 2 ra 3"),
                                                ("box", "DISTINCT, LIMIT", "LIMIT cần ORDER BY")]),
        chip("ou-next", 560, 650, "Bài tiếp: Lọc và sắp xếp dữ liệu", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: SELECT chọn cột, FROM chọn bảng, và máy chạy FROM trước. Alias đặt bằng AS, nhớ dấu phẩy. Phép chia hai số nguyên ra số nguyên. DISTINCT bỏ dòng trùng, còn LIMIT thì cần ORDER BY mới ổn định.",
         "SELECT, FROM · thứ tự chạy · alias và số học · DISTINCT, LIMIT.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.2), IN("#ou-c2", "pop", 8.0), IN("#ou-c3", "pop", 12.0)]),
        ("Bài tiếp: lọc và sắp xếp dữ liệu.", "Bài tiếp: Lọc và sắp xếp dữ liệu.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
