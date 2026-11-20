"""SQL join explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-join.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
account JOIN customer = 85 rows; first rows 1000000001 LY HOANG LONG 107956000.00, 1000000002 LY HOANG LONG 5088114.00, 1000000003 DUONG VAN AN 75666000.00,
1000000004 NGO ANH TUAN 246613000.00; error: column reference "customer_id" is ambiguous;
sample (as in the widget): customers 100002..100006, loans LD2400004 (100002), LD2400007 (100003), LD2400001 (100011), LD2400002 (100013):
INNER 2, LEFT 5, RIGHT 4, FULL 7; real customer x loan: INNER 15, LEFT 40, RIGHT 15, FULL 40; customer 100001 COUNT(*) 1, COUNT(l.ld_id) 0;
anti-join 25 customers (100001, 100004, 100005 first); LEFT ... AND l.status='LIVE' 40 rows, WHERE l.status='LIVE' 12 rows, anti with LIVE 28;
stmt_entry 4-table join 932 rows; entries 1 +30000000.00 DANG THI MAI Tài khoản thanh toán, 2 -30000000.00 DANG THI MAI Vay tiêu dùng, 3 +400000000.00 HOANG GIA HUY;
CURRENT 765 10874828632.00, LOAN 63 -2833474000.00, SAVINGS 104 9300874666.00;
self join 205 rows, with a1.account_id < a2.account_id 60 rows (100001 1000000001/1000000002, 100002 1000000003/1000000074, 100003 1000000004/1000000077), <> 120 rows;
currency x txn_type 32, customer x account 3400;
fan-out: 932 rows, 85 accounts; VND balances SUM 17342070666.00 on account, 217922454175.00 after join (779 rows, 75 accounts), SUM(e.amount) 17342070666.00;
customer 100001: 1000000001 107956000.00 x 19 entries, 1000000002 5088114.00 x 6, sum after join 2081692684.00, correct 113044114.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<c>--[^\n]*|/\*.*?\*/)|(?P<s>'[^']*'|\"[^\"]*\")|(?P<k>\b(?:SELECT|DISTINCT|FROM|WHERE|AS|ORDER BY|GROUP BY|DESC|LIMIT|INNER|LEFT|RIGHT|FULL|CROSS|JOIN|ON|AND|IS NULL|COUNT|SUM)\b)|(?P<n>\b\d+(?:\.\d+)?\b)|(?P<x>.)", re.S)
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


def tids(prefix, n):
    return ", ".join([f"#{prefix}-h"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def sids(prefix, n):
    return ", ".join(f"#{prefix}-{i}" for i in range(1, n + 1))


def errbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r")


def node(id_, x, y, w, h, title, sub, tone="cyan"):
    return box(id_, x, y, w, h,
               f'<div style="text-align:center;padding-top:14px"><b style="font:700 32px var(--mono)">{esc(title)}</b>'
               f'<div style="font-size:24px;opacity:.75;margin-top:6px">{esc(sub)}</div></div>', tone)


def row(id_, x, y, w, text, tone="cyan"):
    return box(id_, x, y, w, 66, f'<div style="padding:16px 22px;font:600 26px var(--mono);white-space:nowrap">{esc(text)}</div>', tone)


def nul(id_, x, y):
    return el(id_, x, y, 150, None, "NULL", "r", "font:italic 500 28px var(--mono);opacity:.55;color:#e6e9f0")


def big_num(id_, x, y, w, label, value, note, tone):
    return box(id_, x, y, w, 230,
               f'<div style="text-align:center;padding-top:22px"><div style="font-size:28px;opacity:.8">{esc(label)}</div>'
               f'<b style="display:block;font:700 54px var(--mono);margin:12px 0 8px">{esc(value)}</b>'
               f'<div style="font-size:26px;opacity:.8">{esc(note)}</div></div>', tone)


CUST = [("100002", "DUONG VAN AN"), ("100003", "NGO ANH TUAN"), ("100004", "HOANG QUOC BAO"), ("100005", "NGO NGOC ANH"), ("100006", "NGO KHANH LINH")]
LOANS = ["LD2400004 · khách 100002", "LD2400007 · khách 100003", "LD2400001 · khách 100011", "LD2400002 · khách 100013"]
ROW0 = 250
ROW_H = 80

JT_LEFT_ALL = ", ".join(f"#jt-l{i}" for i in range(5))
JT_RIGHT_ALL = ", ".join(f"#jt-r{i}" for i in range(4))

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Kết hợp bảng", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Tên khách nằm ở bảng khác. Làm sao in chung một dòng?"), "h1 center r"),
        node("hk-a", 300, 470, 560, 130, "account", "chỉ có customer_id", "amber"),
        node("hk-c", 1060, 470, 560, 130, "customer", "có short_name", "cyan"),
        wires(arrow("hk-w", [(870, 535), (1050, 535)], "cyan")),
        chip("hk-n1", 600, 680, "JOIN: ghép hai bảng bằng khoá ngoại", "green"),
        chip("hk-n2", 520, 780, "Sai kiểu JOIN: số liệu sai mà không báo lỗi", "red"),
        tile("hk-tile", 400, 350, 220, "share"),
        el("hk-word", 670, 380, 1200, None, letters("Kết hợp bảng với JOIN"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "INNER · LEFT · RIGHT · FULL · Không khớp · Nhiều bảng · Nhân dòng", "kin-sub r"),
    ]), beats=[
        ("Bảng tài khoản chỉ lưu mã khách, không lưu tên. Muốn in tài khoản kèm tên khách thì làm sao?",
         "Bảng account chỉ có customer_id. Làm sao in kèm tên khách?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-a", "left", 3.0), IN("#hk-c", "right", 3.6)]),
        ("Câu trả lời là ghép hai bảng bằng JOIN. Nhưng chọn sai kiểu nối, số liệu sẽ sai mà máy không báo lỗi.",
         "JOIN ghép hai bảng. Chọn sai kiểu nối thì số liệu sai mà không báo lỗi.",
         [*ARROW("hk-w", 0.4, 0.8), IN("#hk-n1", "left", 2.0), IN("#hk-n2", "left", 4.8), SHAKE("#hk-n2", 5.4)]),
        ("Hôm nay ta học các kiểu nối, cách tìm dòng không khớp, nối nhiều bảng, và cái bẫy làm tổng tiền phình to.",
         "Các kiểu JOIN, dòng không khớp, nối nhiều bảng, bẫy nhân dòng.",
         [OUT("#hk-eye, #hk-q, #hk-a, #hk-c, #hk-w, #hk-n1, #hk-n2", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.8)]),
    ]),
    # ------------------------------------------------------------ inner-join
    dict(id="inner-join", world=(1920, 1080), hud=hud("ij", "INNER JOIN", "Ghép bảng bằng điều kiện ON"), cam="".join([
        big_title("ij", "INNER JOIN", "Tra tên khách cho từng tài khoản"),
        node("ij-ta", 160, 190, 560, 100, "account", "account_id, customer_id", "amber"),
        node("ij-tc", 1200, 190, 560, 100, "customer", "customer_id, short_name", "cyan"),
        wires(arrow("ij-w", [(730, 240), (1190, 240)], "cyan")),
        chip("ij-on", 770, 262, "ON: khoá ngoại = khoá chính", "violet"),
        sqlbox("ij-q", 160, 340, 1150, ["SELECT a.account_id, c.short_name, a.working_balance", "FROM account a",
                                        "INNER JOIN customer c ON c.customer_id = a.customer_id", "ORDER BY a.account_id LIMIT 4;"], 26),
        tbl("ij-t", 160, 600, [(300, True), (380, False), (330, True)], ["account_id", "short_name", "working_balance"],
            [["1000000001", "LY HOANG LONG", "107956000.00"], ["1000000002", "LY HOANG LONG", "5088114.00"],
             ["1000000003", "DUONG VAN AN", "75666000.00"], ["1000000004", "NGO ANH TUAN", "246613000.00"]], 62, 26),
        chip("ij-c1", 1250, 640, "Khách 100001 có 2 tài khoản: ra 2 dòng", "cyan"),
        chip("ij-c2", 1250, 730, "Cả bảng: 85 tài khoản, ra 85 dòng", "green"),
        sqlbox("ij-q2", 160, 190, 1250, ["SELECT customer_id", "FROM account a JOIN customer c ON c.customer_id = a.customer_id;"], 26),
        errbox("ij-err", 160, 400, 1100, 'ERROR: column reference "customer_id" is ambiguous'),
        chip("ij-c3", 160, 520, "Hai bảng cùng có customer_id: không rõ của bảng nào", "red"),
        chip("ij-c4", 160, 610, "Sửa: gắn alias, a.customer_id hoặc c.customer_id", "green"),
        chip("ij-c5", 160, 700, "Quên hoặc sai ON: kết quả sai lặng lẽ, đọc lại ON", "amber"),
    ]), beats=[
        ("Phần một. Dữ liệu chia ra nhiều bảng, nên muốn xem đủ thông tin phải ghép chúng lại.",
         "Phần 1: dữ liệu chia nhiều bảng, JOIN ghép lại.",
         [TYPE("#ij-big", 0.1, 0.06), IN("#ij-bsub", "blur", 0.9), OUT("#ij-big, #ij-bsub", "zoom", 3.4), IN("#ij-hud", "left", 4.0)]),
        ("Bảng tài khoản có mã khách, tên khách nằm ở bảng khách hàng. Hai bảng nối nhau qua điều kiện ON, thường là khoá ngoại bằng khoá chính.",
         "account.customer_id nối customer.customer_id qua ON.",
         [IN("#ij-ta", "left", 0.3), IN("#ij-tc", "right", 1.2), *ARROW("ij-w", 3.0, 0.8), IN("#ij-on", "up", 5.0),
          IN("#ij-q", "up", 7.0, 0.4), IN("#ij-q-1", "type1", 7.4, 0.3), IN("#ij-q-2", "type1", 8.4, 0.3), IN("#ij-q-3", "type1", 9.4, 0.3), IN("#ij-q-4", "type1", 10.6, 0.3)]),
        ("INNER JOIN chỉ giữ những cặp dòng khớp. Khách một không không không không một có hai tài khoản nên ra hai dòng. Cả bảng cho tám mươi lăm dòng, đúng bằng số tài khoản.",
         "INNER JOIN chỉ giữ cặp khớp: 85 tài khoản, 85 dòng.",
         [DIM("#ij-ta, #ij-tc, #ij-w, #ij-on", 0, 0.25), IN("#ij-t-h", "left", 0.3), IN("#ij-t-1", "left", 1.0), IN("#ij-t-2", "left", 1.6), IN("#ij-t-3", "left", 2.4), IN("#ij-t-4", "left", 2.8),
          IN("#ij-c1", "left", 3.4), IN("#ij-c2", "left", 8.5)]),
        ("Bẫy thứ nhất: cột customer_id có ở cả hai bảng. Viết trơn tên cột là máy báo mơ hồ, không biết của bảng nào. Hãy gắn alias bảng vào trước tên cột.",
         "Bẫy: customer_id có ở cả hai bảng, phải gắn alias.",
         [OUT("#ij-ta, #ij-tc, #ij-w, #ij-on, #ij-q, " + sids("ij-q", 4) + ", " + tids("ij-t", 4) + ", #ij-c1, #ij-c2", "fade", 0, 0.4), IN("#ij-q2", "up", 0.6, 0.4),
          IN("#ij-q2-1", "type1", 0.9, 0.3), IN("#ij-q2-2", "type1", 1.8, 0.3), IN("#ij-err", "up", 3.8), SHAKE("#ij-err", 4.4), IN("#ij-c3", "left", 5.0), IN("#ij-c4", "left", 8.0)]),
        ("Bẫy thứ hai: quên điều kiện ON, hoặc viết sai cột. Kết quả sai một cách lặng lẽ, nên luôn đọc lại ON sau khi viết xong.",
         "Bẫy: ON sai làm kết quả sai lặng lẽ.",
         [DIM("#ij-q2, #ij-err, #ij-c3, #ij-c4", 0, 0.15), IN("#ij-c5", "left", 0.6), SHAKE("#ij-c5", 1.4)]),
    ]),
    # ------------------------------------------------------------ join-types
    dict(id="join-types", world=(1920, 1080), hud=hud("jt", "INNER, LEFT, RIGHT, FULL", "Dòng nào còn, dòng nào mất"), cam="".join([
        big_title("jt", "Bốn kiểu JOIN", "INNER, LEFT, RIGHT, FULL"),
        chip("jt-hl", 160, 175, "customer: 5 khách mẫu", "cyan"),
        chip("jt-hr", 1240, 175, "loan: 4 khoản vay mẫu", "amber"),
        *[row(f"jt-l{i}", 160, ROW0 + i * ROW_H, 520, f"{cid} · {nm}", "cyan") for i, (cid, nm) in enumerate(CUST)],
        *[row(f"jt-r{j}", 1240, ROW0 + j * ROW_H, 520, LOANS[j], "amber") for j in range(4)],
        wires(*[arrow(f"jt-a{i}", [(690, ROW0 + i * ROW_H + 33), (1230, ROW0 + i * ROW_H + 33)], "green") for i in range(2)]),
        *[nul(f"jt-nl{i}", 840, ROW0 + i * ROW_H + 14) for i in (2, 3, 4)],
        *[nul(f"jt-nr{i}", 1010, ROW0 + i * ROW_H + 14) for i in (2, 3)],
        chip("jt-k1", 160, 720, "INNER JOIN: 2 dòng, chỉ cặp khớp", "green"),
        chip("jt-k2", 160, 720, "LEFT JOIN: 5 dòng = 2 khớp + 3 khách chưa vay", "cyan"),
        chip("jt-k3", 160, 720, "RIGHT JOIN: 4 dòng = 2 khớp + 2 khoản vay của khách ngoài mẫu", "amber"),
        chip("jt-k4", 160, 720, "FULL JOIN: 7 dòng = 2 khớp + 3 chỉ trái + 2 chỉ phải", "violet"),
        tbl("jt-t", 160, 200, [(360, False), (260, True)], ["Kiểu JOIN", "Số dòng"],
            [["INNER JOIN", "15"], ["LEFT JOIN", "40"], ["RIGHT JOIN", "15"], ["FULL JOIN", "40"]], 66, 28),
        chip("jt-c1", 900, 240, "customer 40 dòng, loan 15 dòng", "cyan"),
        chip("jt-c2", 900, 330, "LEFT: 15 có vay + 25 chưa vay (ld_id NULL)", "green"),
        chip("jt-c3", 900, 420, "Mọi khoản vay đều có khách: RIGHT bằng INNER", "violet"),
        chip("jt-c4", 900, 510, "RIGHT chỉ là LEFT đảo hai bảng: dùng LEFT", "amber"),
        sqlbox("jt-q", 160, 560, 900, ["SELECT COUNT(*), COUNT(l.ld_id)", "FROM customer c", "LEFT JOIN loan l ON l.customer_id = c.customer_id",
                                        "WHERE c.customer_id = 100001;"], 26),
        tbl("jt-v", 1150, 600, [(220, True), (300, True)], ["COUNT(*)", "COUNT(l.ld_id)"], [["1", "0"]], 62, 26),
        chip("jt-c5", 160, 830, "COUNT(*) đếm cả dòng NULL: khách chưa vay thành 1", "red"),
        chip("jt-c6", 160, 910, "COUNT(l.ld_id) bỏ qua NULL: đúng 0 khoản vay", "green"),
    ]), beats=[
        ("Phần hai. INNER JOIN vứt mọi dòng không khớp. Muốn giữ chúng thì dùng nối ngoài.",
         "Phần 2: INNER vứt dòng không khớp; muốn giữ thì nối ngoài.",
         [TYPE("#jt-big", 0.1, 0.06), IN("#jt-bsub", "blur", 0.9), OUT("#jt-big, #jt-bsub", "zoom", 3.4), IN("#jt-hud", "left", 4.0)]),
        ("Ta thử trên hai bảng mẫu nhỏ. Năm khách, bốn khoản vay. Chỉ hai khách có khoản vay trong mẫu.",
         "5 khách, 4 khoản vay; chỉ 2 cặp khớp.",
         [IN("#jt-hl", "left", 0.3), IN("#jt-hr", "right", 0.5), *[IN(f"#jt-l{i}", "left", 1.0 + i * 0.15) for i in range(5)], *[IN(f"#jt-r{j}", "right", 1.2 + j * 0.15) for j in range(4)],
          *ARROW("jt-a0", 3.6, 0.6), *ARROW("jt-a1", 4.2, 0.6)]),
        ("INNER JOIN chỉ giữ hai cặp khớp. Ba khách chưa vay và hai khoản vay còn lại đều biến mất.",
         "INNER JOIN: 2 dòng khớp, phần còn lại mất.",
         [DIM("#jt-l2, #jt-l3, #jt-l4, #jt-r2, #jt-r3", 0.2, 0.18), IN("#jt-k1", "left", 0.6)]),
        ("LEFT JOIN giữ mọi dòng bảng trái. Ba khách chưa vay vẫn hiện, các cột của khoản vay được điền rỗng.",
         "LEFT JOIN: giữ cả 3 khách chưa vay, bên phải điền NULL.",
         [OUT("#jt-k1", "fade", 0, 0.3), DIM("#jt-l2, #jt-l3, #jt-l4", 0.2, 1), *[IN(f"#jt-nl{i}", "left", 0.8 + (i - 2) * 0.3) for i in (2, 3, 4)], IN("#jt-k2", "left", 1.0)]),
        ("RIGHT JOIN thì ngược lại, giữ mọi khoản vay. Hai khoản vay của khách ngoài mẫu hiện ra, cột khách hàng điền rỗng.",
         "RIGHT JOIN: giữ 2 khoản vay của khách ngoài mẫu, bên trái NULL.",
         [OUT("#jt-k2", "fade", 0, 0.3), DIM("#jt-nl2, #jt-nl3, #jt-nl4", 0, 0.0), DIM("#jt-l2, #jt-l3, #jt-l4", 0, 0.18), DIM("#jt-r2, #jt-r3", 0.2, 1),
          IN("#jt-nr2", "left", 0.8), IN("#jt-nr3", "left", 1.1), IN("#jt-k3", "left", 1.0)]),
        ("Còn FULL JOIN giữ cả hai phía. Hai cặp khớp, ba khách chỉ bên trái, hai khoản vay chỉ bên phải, tổng cộng bảy dòng.",
         "FULL JOIN: giữ cả hai phía, 7 dòng.",
         [OUT("#jt-k3", "fade", 0, 0.3), DIM("#jt-l2, #jt-l3, #jt-l4", 0.2, 1), DIM("#jt-nl2, #jt-nl3, #jt-nl4", 0.5, 1), IN("#jt-k4", "left", 1.0)]),
        ("Trên dữ liệu thật, bốn mươi khách nối mười lăm khoản vay cho mười lăm, bốn mươi, mười lăm, bốn mươi dòng. Mọi khoản vay đều có khách nên RIGHT bằng INNER.",
         "Dữ liệu thật: INNER 15, LEFT 40, RIGHT 15, FULL 40.",
         [OUT("#jt-hl, #jt-hr, " + JT_LEFT_ALL + ", " + JT_RIGHT_ALL + ", #jt-a0, #jt-a1, #jt-nl2, #jt-nl3, #jt-nl4, #jt-nr2, #jt-nr3, #jt-k4", "fade", 0, 0.4),
          IN("#jt-t-h", "left", 0.8), IN("#jt-t-1", "left", 1.2), IN("#jt-t-2", "left", 1.8), IN("#jt-t-3", "left", 2.6), IN("#jt-t-4", "left", 3.2),
          IN("#jt-c1", "left", 1.0), IN("#jt-c2", "left", 3.0), IN("#jt-c3", "left", 6.0)]),
        ("Người ta ít dùng RIGHT, chỉ cần đảo bảng rồi dùng LEFT. Bẫy cuối: COUNT sao đếm khách chưa vay thành một, còn đếm cột của bảng vay thì ra đúng không.",
         "RIGHT chỉ là LEFT đảo bảng. Bẫy: COUNT(*) đếm cả dòng NULL.",
         [IN("#jt-c4", "left", 0.4), OUT("#jt-t-h, #jt-t-1, #jt-t-2, #jt-t-3, #jt-t-4, #jt-c1, #jt-c2, #jt-c3, #jt-c4", "fade", 3.6, 0.4),
          IN("#jt-q", "up", 4.2, 0.4), IN("#jt-q-1", "type1", 4.5, 0.3), IN("#jt-q-2", "type1", 5.3, 0.3), IN("#jt-q-3", "type1", 6.3, 0.3), IN("#jt-q-4", "type1", 6.8, 0.3),
          IN("#jt-v-h", "left", 7.4), IN("#jt-v-1", "left", 7.9), IN("#jt-c5", "left", 8.6), IN("#jt-c6", "left", 10.8)]),
    ]),
    # ------------------------------------------------------------ anti-join
    dict(id="anti-join", world=(1920, 1080), hud=hud("aj", "Phần không khớp", "Anti-join, ON hay WHERE"), cam="".join([
        big_title("aj", "Phần không khớp", "Anti-join và bẫy ON với WHERE"),
        sqlbox("aj-q", 160, 190, 1100, ["SELECT c.customer_id, c.short_name", "FROM customer c", "LEFT JOIN loan l ON l.customer_id = c.customer_id",
                                        "WHERE l.ld_id IS NULL", "ORDER BY c.customer_id LIMIT 3;"], 26),
        tbl("aj-t", 160, 520, [(220, True), (420, False)], ["customer_id", "short_name"],
            [["100001", "LY HOANG LONG"], ["100004", "HOANG QUOC BAO"], ["100005", "NGO NGOC ANH"]], 62, 27),
        chip("aj-c1", 900, 560, "Đủ: 25 khách chưa có khoản vay", "green"),
        chip("aj-c2", 900, 650, "40 khách trừ 15 khách có vay", "cyan"),
        sqlbox("aj-qa", 160, 190, 800, ["SELECT COUNT(*)", "FROM customer c", "LEFT JOIN loan l", "  ON l.customer_id = c.customer_id", "  AND l.status = 'LIVE';"], 26),
        sqlbox("aj-qb", 1000, 190, 800, ["SELECT COUNT(*)", "FROM customer c", "LEFT JOIN loan l", "  ON l.customer_id = c.customer_id", "WHERE l.status = 'LIVE';"], 26),
        big_num("aj-na", 160, 520, 800, "Điều kiện ở ON", "40 dòng", "mọi khách còn nguyên", "green"),
        big_num("aj-nb", 1000, 520, 800, "Điều kiện ở WHERE", "12 dòng", "khách chưa vay bị loại", "red"),
        chip("aj-c3", 1000, 800, "WHERE chạy sau: NULL = 'LIVE' không đúng", "amber"),
        chip("aj-c4", 1000, 890, "LEFT JOIN biến thành INNER JOIN", "red"),
        sqlbox("aj-qc", 160, 190, 1100, ["SELECT COUNT(*)", "FROM customer c", "LEFT JOIN loan l ON l.customer_id = c.customer_id",
                                         "  AND l.status = 'LIVE'", "WHERE l.ld_id IS NULL;"], 26),
        big_num("aj-nc", 160, 520, 700, "Không có khoản vay đang LIVE", "28 khách", "40 trừ 12 khách có vay LIVE", "cyan"),
        chip("aj-c5", 960, 560, "ON: thu hẹp bảng phải, vẫn giữ bảng trái", "violet"),
        chip("aj-c6", 960, 650, "WHERE: lọc kết quả cuối, kể cả IS NULL", "green"),
    ]), beats=[
        ("Phần ba. Tìm phần không khớp, và chọn đúng chỗ đặt điều kiện.",
         "Phần 3: tìm phần không khớp, bẫy ON và WHERE.",
         [TYPE("#aj-big", 0.1, 0.06), IN("#aj-bsub", "blur", 0.9), OUT("#aj-big, #aj-bsub", "zoom", 2.8), IN("#aj-hud", "left", 3.3)]),
        ("Khách nào chưa có khoản vay? Ta nối LEFT JOIN, rồi chỉ giữ những dòng mà mã khoản vay là rỗng. Gọi là anti-join.",
         "Anti-join: LEFT JOIN rồi WHERE khoá bảng phải IS NULL.",
         [IN("#aj-q", "up", 0.3, 0.4), IN("#aj-q-1", "type1", 0.6, 0.3), IN("#aj-q-2", "type1", 1.6, 0.3), IN("#aj-q-3", "type1", 2.8, 0.3), IN("#aj-q-4", "type1", 5.0, 0.3), IN("#aj-q-5", "type1", 6.4, 0.3)]),
        ("Kết quả đúng hai mươi lăm khách, bằng bốn mươi trừ mười lăm. Hãy kiểm tra rỗng ở khoá chính của bảng phải.",
         "25 khách chưa vay = 40 trừ 15. Kiểm tra NULL ở khoá chính.",
         [IN("#aj-t-h", "left", 0.3), IN("#aj-t-1", "left", 0.9), IN("#aj-t-2", "left", 1.3), IN("#aj-t-3", "left", 1.7), IN("#aj-c1", "left", 2.4), IN("#aj-c2", "left", 4.4)]),
        ("Bẫy lớn: đặt điều kiện của bảng phải ở ON thì vẫn giữ đủ bốn mươi khách.",
         "Điều kiện ở ON: vẫn 40 dòng.",
         [OUT("#aj-q, " + sids("aj-q", 5) + ", " + tids("aj-t", 3) + ", #aj-c1, #aj-c2", "fade", 0, 0.4), IN("#aj-qa", "up", 0.6, 0.4),
          IN("#aj-qa-1", "type1", 0.9, 0.3), IN("#aj-qa-2", "type1", 1.5, 0.3), IN("#aj-qa-3", "type1", 2.1, 0.3), IN("#aj-qa-4", "type1", 2.7, 0.3), IN("#aj-qa-5", "type1", 3.3, 0.3),
          IN("#aj-na", "up", 4.0)]),
        ("Nhưng chuyển điều kiện đó sang WHERE thì chỉ còn mười hai dòng. Khách chưa vay có trạng thái rỗng, bị WHERE loại, và LEFT JOIN thành INNER JOIN.",
         "Điều kiện ở WHERE: chỉ còn 12 dòng, LEFT thành INNER.",
         [DIM("#aj-qa, #aj-na", 0, 0.3), IN("#aj-qb", "up", 0.4, 0.4), IN("#aj-qb-1", "type1", 0.7, 0.3), IN("#aj-qb-2", "type1", 1.2, 0.3), IN("#aj-qb-3", "type1", 1.7, 0.3),
          IN("#aj-qb-4", "type1", 2.2, 0.3), IN("#aj-qb-5", "type1", 3.0, 0.3), IN("#aj-nb", "up", 4.6), IN("#aj-c3", "left", 7.0), IN("#aj-c4", "left", 9.0), SHAKE("#aj-c4", 9.6)]),
        ("Quy tắc: điều kiện thu hẹp bảng phải để ở ON, kiểm tra rỗng để ở WHERE. Khách không có khoản vay đang hoạt động là hai mươi tám.",
         "Thu hẹp bảng phải ở ON, IS NULL ở WHERE: 28 khách.",
         [OUT("#aj-qa, #aj-qb, " + sids("aj-qa", 5) + ", " + sids("aj-qb", 5) + ", #aj-na, #aj-nb, #aj-c3, #aj-c4", "fade", 0, 0.4), IN("#aj-qc", "up", 0.6, 0.4),
          IN("#aj-qc-1", "type1", 0.9, 0.3), IN("#aj-qc-2", "type1", 1.5, 0.3), IN("#aj-qc-3", "type1", 2.2, 0.3), IN("#aj-qc-4", "type1", 3.4, 0.3), IN("#aj-qc-5", "type1", 4.4, 0.3),
          IN("#aj-nc", "up", 5.4), IN("#aj-c5", "left", 7.0), IN("#aj-c6", "left", 9.0)]),
    ]),
    # ------------------------------------------------------------ multi-join
    dict(id="multi-join", world=(1920, 1080), hud=hud("mj", "Nối nhiều bảng", "Đi theo chuỗi khoá ngoại"), cam="".join([
        big_title("mj", "Nối nhiều bảng", "Mỗi bảng thêm là một ON"),
        node("mj-s", 160, 200, 420, 100, "stmt_entry", "bút toán", "amber"),
        node("mj-a", 720, 200, 420, 100, "account", "tài khoản", "cyan"),
        node("mj-c", 1300, 130, 420, 90, "customer", "khách hàng", "violet"),
        node("mj-g", 1300, 290, 420, 90, "category", "loại sản phẩm", "green"),
        wires(arrow("mj-w1", [(590, 250), (710, 250)], "cyan"), arrow("mj-w2", [(1150, 235), (1290, 185)], "cyan"), arrow("mj-w3", [(1150, 265), (1290, 335)], "cyan")),
        sqlbox("mj-q", 160, 450, 1250, ["FROM stmt_entry s", "JOIN account a ON a.account_id = s.account_id", "JOIN customer c ON c.customer_id = a.customer_id",
                                        "JOIN category cat ON cat.category_id = a.category_id"], 26),
        chip("mj-c1", 160, 740, "4 bảng cần đúng 3 điều kiện ON", "violet"),
        chip("mj-c2", 160, 830, "Customer và category đều đi qua account", "amber"),
        sqlbox("mj-q2", 160, 190, 1250, ["SELECT s.stmt_entry_id, s.amount, c.short_name, cat.description", "FROM stmt_entry s", "JOIN account a ON a.account_id = s.account_id",
                                         "JOIN customer c ON c.customer_id = a.customer_id", "JOIN category cat ON cat.category_id = a.category_id",
                                         "ORDER BY s.stmt_entry_id LIMIT 3;"], 24),
        tbl("mj-t", 160, 530, [(230, True), (290, True), (320, False), (400, False)], ["stmt_entry_id", "amount", "short_name", "description"],
            [["1", "30000000.00", "DANG THI MAI", "Tài khoản thanh toán"], ["2", "-30000000.00", "DANG THI MAI", "Vay tiêu dùng"],
             ["3", "400000000.00", "HOANG GIA HUY", "Tài khoản thanh toán"]], 60, 25),
        chip("mj-c3", 160, 820, "Vẫn đúng 932 dòng: mỗi bút toán một dòng", "green"),
        chip("mj-c4", 160, 910, "Gắn alias cho từng cột để biết cột thuộc bảng nào", "cyan"),
        sqlbox("mj-q3", 160, 190, 1250, ["SELECT cat.product_group, COUNT(*) AS so_but_toan,", "       SUM(s.amount) AS tong_amount", "FROM stmt_entry s",
                                         "JOIN account a ON a.account_id = s.account_id", "JOIN category cat ON cat.category_id = a.category_id",
                                         "GROUP BY cat.product_group ORDER BY cat.product_group;"], 24),
        tbl("mj-g2", 160, 530, [(300, True), (260, True), (420, True)], ["product_group", "so_but_toan", "tong_amount"],
            [["CURRENT", "765", "10874828632.00"], ["LOAN", "63", "-2833474000.00"], ["SAVINGS", "104", "9300874666.00"]], 62, 26),
        chip("mj-c5", 160, 830, "765 + 104 + 63 = 932 bút toán", "green"),
    ]), beats=[
        ("Phần bốn. Nối nhiều bảng một lúc, mỗi bảng thêm cần một điều kiện ON riêng.",
         "Phần 4: nối nhiều bảng, mỗi bảng một ON.",
         [TYPE("#mj-big", 0.1, 0.06), IN("#mj-bsub", "blur", 0.9), OUT("#mj-big, #mj-bsub", "zoom", 3.4), IN("#mj-hud", "left", 4.0)]),
        ("Hãy đi theo dây khoá ngoại. Bút toán trỏ tới tài khoản, tài khoản trỏ tới khách hàng và loại sản phẩm. Bốn bảng chỉ cần ba điều kiện ON.",
         "stmt_entry, account, customer, category: 4 bảng, 3 ON.",
         [IN("#mj-s", "left", 0.3), *ARROW("mj-w1", 1.5, 0.5), IN("#mj-a", "left", 2.0), *ARROW("mj-w2", 4.6, 0.6), IN("#mj-c", "right", 5.0), *ARROW("mj-w3", 5.8, 0.6), IN("#mj-g", "right", 6.2),
          IN("#mj-q", "up", 7.4, 0.4), IN("#mj-q-1", "type1", 7.7, 0.3), IN("#mj-q-2", "type1", 8.7, 0.3), IN("#mj-q-3", "type1", 9.7, 0.3), IN("#mj-q-4", "type1", 10.7, 0.3),
          IN("#mj-c1", "left", 12.0), IN("#mj-c2", "left", 13.5)]),
        ("Kết quả vẫn chín trăm ba mươi hai dòng, mỗi bút toán một dòng. Bút toán đầu cộng ba mươi triệu, bút toán hai trừ ba mươi triệu, là giải ngân khoản vay.",
         "932 dòng. Bút toán 1: +30.000.000, bút toán 2: -30.000.000 (giải ngân).",
         [OUT("#mj-s, #mj-a, #mj-c, #mj-g, #mj-w1, #mj-w2, #mj-w3, #mj-q, " + sids("mj-q", 4) + ", #mj-c1, #mj-c2", "fade", 0, 0.4), IN("#mj-q2", "up", 0.6, 0.4),
          *[IN(f"#mj-q2-{i}", "type1", 0.9 + i * 0.5, 0.3) for i in range(1, 7)],
          IN("#mj-t-h", "left", 4.4), IN("#mj-t-1", "left", 5.0), IN("#mj-t-2", "left", 6.4), IN("#mj-t-3", "left", 8.6), IN("#mj-c3", "left", 9.8), IN("#mj-c4", "left", 11.6)]),
        ("Nối xong là gom nhóm được. Theo nhóm sản phẩm, tài khoản thanh toán có bảy trăm sáu mươi lăm bút toán, tiết kiệm một trăm linh bốn, khoản vay sáu mươi ba. Cộng lại đúng chín trăm ba mươi hai.",
         "Gom theo product_group: 765 + 104 + 63 = 932.",
         [OUT("#mj-q2, " + sids("mj-q2", 6) + ", " + tids("mj-t", 3) + ", #mj-c3, #mj-c4", "fade", 0, 0.4), IN("#mj-q3", "up", 0.6, 0.4),
          *[IN(f"#mj-q3-{i}", "type1", 0.9 + i * 0.5, 0.3) for i in range(1, 7)],
          IN("#mj-g2-h", "left", 4.2), IN("#mj-g2-1", "left", 4.8), IN("#mj-g2-3", "left", 6.4), IN("#mj-g2-2", "left", 8.0), IN("#mj-c5", "left", 10.0)]),
    ]),
    # ------------------------------------------------------------ self-cross
    dict(id="self-cross", world=(1920, 1080), hud=hud("sc", "SELF và CROSS JOIN", "Nối với chính nó, ghép tất cả"), cam="".join([
        big_title("sc", "SELF và CROSS JOIN", "Hai bản sao, và ghép tất cả"),
        node("sc-a1", 160, 190, 520, 90, "account a1", "bản sao thứ nhất", "amber"),
        node("sc-a2", 1240, 190, 520, 90, "account a2", "bản sao thứ hai", "cyan"),
        wires(arrow("sc-w", [(690, 235), (1230, 235)], "cyan")),
        chip("sc-on", 830, 258, "cùng customer_id", "violet"),
        sqlbox("sc-q", 160, 340, 1250, ["SELECT a1.customer_id, a1.account_id AS tk_1, a2.account_id AS tk_2", "FROM account a1",
                                        "JOIN account a2 ON a2.customer_id = a1.customer_id", "  AND a1.account_id < a2.account_id",
                                        "ORDER BY a1.customer_id, tk_1, tk_2 LIMIT 3;"], 24),
        tbl("sc-t", 160, 640, [(220, True), (300, True), (300, True)], ["customer_id", "tk_1", "tk_2"],
            [["100001", "1000000001", "1000000002"], ["100002", "1000000003", "1000000074"], ["100003", "1000000004", "1000000077"]], 60, 26),
        chip("sc-c1", 1100, 650, "Chỉ ON customer_id: 205 dòng", "red"),
        chip("sc-c2", 1100, 735, "85 cặp tự ghép + 120 cặp lặp hai lần", "amber"),
        chip("sc-c3", 1100, 820, "Thêm a1 < a2: còn 60 cặp, mỗi cặp một lần", "green"),
        chip("sc-c4", 1100, 905, "Dùng <> : bỏ tự ghép nhưng vẫn 120 dòng", "red"),
        sqlbox("sc-qx", 160, 190, 1100, ["SELECT COUNT(*)", "FROM currency c CROSS JOIN txn_type t;"], 28),
        node("sc-x1", 160, 440, 380, 110, "currency", "4 dòng", "amber"),
        el("sc-m1", 540, 450, 140, None, "×", "r", "font:700 80px var(--mono);text-align:center;color:#e6e9f0"),
        node("sc-x2", 680, 440, 380, 110, "txn_type", "8 dòng", "cyan"),
        el("sc-e1", 1060, 450, 140, None, "=", "r", "font:700 80px var(--mono);text-align:center;color:#e6e9f0"),
        node("sc-x3", 1200, 440, 380, 110, "32 dòng", "mọi tổ hợp", "green"),
        node("sc-y1", 160, 620, 380, 110, "customer", "40 dòng", "amber"),
        el("sc-m2", 540, 630, 140, None, "×", "r", "font:700 80px var(--mono);text-align:center;color:#e6e9f0"),
        node("sc-y2", 680, 620, 380, 110, "account", "85 dòng", "cyan"),
        el("sc-e2", 1060, 630, 140, None, "=", "r", "font:700 80px var(--mono);text-align:center;color:#e6e9f0"),
        node("sc-y3", 1200, 620, 380, 110, "3400 dòng", "quên ON", "red"),
        chip("sc-c5", 160, 800, "CROSS JOIN: không có ON, số dòng bằng tích hai bảng", "violet"),
        chip("sc-c6", 160, 890, "Số dòng ra bằng tích hai bảng: dấu hiệu quên điều kiện nối", "red"),
    ]), beats=[
        ("Phần năm. Tự nối, và nối chéo.",
         "Phần 5: SELF JOIN và CROSS JOIN.",
         [TYPE("#sc-big", 0.1, 0.06), IN("#sc-bsub", "blur", 0.9), OUT("#sc-big, #sc-bsub", "zoom", 2.2), IN("#sc-hud", "left", 2.6)]),
        ("Tự nối là nối một bảng với chính nó, dùng hai alias như hai bản sao. Ví dụ tìm các cặp tài khoản của cùng một khách.",
         "SELF JOIN: một bảng, hai alias; tìm cặp tài khoản cùng khách.",
         [IN("#sc-a1", "left", 0.3), IN("#sc-a2", "right", 1.0), *ARROW("sc-w", 2.4, 0.8), IN("#sc-on", "up", 3.6),
          IN("#sc-q", "up", 5.0, 0.4), IN("#sc-q-1", "type1", 5.3, 0.3), IN("#sc-q-2", "type1", 6.3, 0.3), IN("#sc-q-3", "type1", 7.3, 0.3), IN("#sc-q-4", "type1", 8.3, 0.3), IN("#sc-q-5", "type1", 9.1, 0.3)]),
        ("Chỉ nối theo mã khách thì ra hai trăm linh năm dòng, vì mỗi tài khoản ghép cả với chính nó, và mỗi cặp hiện hai lần. Thêm điều kiện mã thứ nhất nhỏ hơn mã thứ hai, còn đúng sáu mươi cặp.",
         "Chỉ ON customer_id: 205 dòng. Thêm a1 < a2: 60 cặp.",
         [DIM("#sc-a1, #sc-a2, #sc-w, #sc-on", 0, 0.25), IN("#sc-t-h", "left", 0.3), IN("#sc-t-1", "left", 0.8), IN("#sc-t-2", "left", 1.1), IN("#sc-t-3", "left", 1.4),
          IN("#sc-c1", "left", 2.0), IN("#sc-c2", "left", 4.4), IN("#sc-c3", "left", 7.4)]),
        ("Bẫy: dùng dấu khác nhau thay cho dấu nhỏ hơn chỉ bỏ được cặp tự ghép, mỗi cặp vẫn lặp hai lần, còn một trăm hai mươi dòng.",
         "Bẫy: <> vẫn lặp mỗi cặp hai lần, 120 dòng.",
         [DIM("#sc-q, " + sids("sc-q", 5) + ", " + tids("sc-t", 3) + ", #sc-c1, #sc-c2, #sc-c3", 0, 0.15), IN("#sc-c4", "left", 0.6), SHAKE("#sc-c4", 1.4)]),
        ("CROSS JOIN ghép mọi dòng với mọi dòng, không có ON. Bốn loại tiền nhân tám loại giao dịch, ra ba mươi hai dòng, dùng để tạo bảng tổ hợp.",
         "CROSS JOIN: 4 × 8 = 32 dòng, mọi tổ hợp.",
         [OUT("#sc-a1, #sc-a2, #sc-w, #sc-on, #sc-q, " + sids("sc-q", 5) + ", " + tids("sc-t", 3) + ", #sc-c1, #sc-c2, #sc-c3, #sc-c4", "fade", 0, 0.4),
          IN("#sc-qx", "up", 0.6, 0.4), IN("#sc-qx-1", "type1", 0.9, 0.3), IN("#sc-qx-2", "type1", 1.6, 0.3),
          IN("#sc-x1", "left", 4.0), IN("#sc-m1", "pop", 5.0), IN("#sc-x2", "right", 5.4), IN("#sc-e1", "pop", 7.0), IN("#sc-x3", "up", 7.4)]),
        ("Nhưng nếu nối bốn mươi khách với tám mươi lăm tài khoản mà quên ON, bạn nhận ba nghìn bốn trăm dòng vô nghĩa. Số dòng bằng tích hai bảng là dấu hiệu quên điều kiện nối.",
         "40 × 85 = 3400 dòng: dấu hiệu quên ON.",
         [IN("#sc-y1", "left", 0.3), IN("#sc-m2", "pop", 1.0), IN("#sc-y2", "right", 1.4), IN("#sc-e2", "pop", 2.8), IN("#sc-y3", "up", 3.2), SHAKE("#sc-y3", 4.0),
          IN("#sc-c5", "left", 5.0), IN("#sc-c6", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ fan-out
    dict(id="fan-out", world=(1920, 1080), hud=hud("fo", "Bẫy nhân dòng", "SUM bị nhân lên sau JOIN"), cam="".join([
        big_title("fo", "Bẫy nhân dòng", "SUM phình to mà không báo lỗi"),
        node("fo-a", 160, 220, 520, 130, "account", "85 dòng, bên một", "amber"),
        node("fo-e", 1240, 220, 520, 130, "stmt_entry", "932 dòng, bên nhiều", "cyan"),
        wires(arrow("fo-w", [(690, 285), (1230, 285)], "cyan")),
        chip("fo-n1", 860, 220, "1", "violet"),
        chip("fo-nn", 1130, 220, "N", "violet"),
        chip("fo-c1", 160, 450, "Nối ra 932 dòng, chỉ có 85 tài khoản khác nhau", "amber"),
        chip("fo-c2", 160, 540, "Mỗi tài khoản lặp đúng bằng số bút toán của nó", "red"),
        tbl("fo-t", 160, 200, [(260, True), (330, True), (240, True), (420, True)], ["account_id", "working_balance", "so_but_toan", "bị cộng vào SUM"],
            [["1000000001", "107956000.00", "19", "19 lần"], ["1000000002", "5088114.00", "6", "6 lần"]], 66, 27),
        big_num("fo-r1", 160, 480, 760, "Tổng đúng của khách 100001", "113.044.114", "107.956.000 + 5.088.114", "green"),
        big_num("fo-r2", 1000, 480, 760, "SUM(a.working_balance) sau JOIN", "2.081.692.684", "gấp hơn 18 lần", "red"),
        sqlbox("fo-q", 160, 190, 1200, ["SELECT SUM(a.working_balance)", "FROM account a", "JOIN stmt_entry e ON e.account_id = a.account_id", "WHERE a.ccy = 'VND';"], 26),
        big_num("fo-b1", 160, 500, 760, "Sau JOIN: 779 dòng", "217.922.454.175", "sai", "red"),
        big_num("fo-b2", 1000, 500, 760, "Tổng thật trên account: 75 tài khoản", "17.342.070.666", "đúng", "green"),
        chip("fo-c3", 160, 790, "Gấp hơn 12 lần, không lỗi, không cảnh báo", "red"),
        sqlbox("fo-q2", 160, 190, 1200, ["SELECT SUM(e.amount)", "FROM account a", "JOIN stmt_entry e ON e.account_id = a.account_id", "WHERE a.ccy = 'VND';"], 26),
        big_num("fo-b3", 1000, 480, 760, "Cộng cột của bảng con", "17.342.070.666", "khớp tổng thật", "green"),
        chip("fo-p1", 160, 520, "1. Đếm dòng trước và sau JOIN", "cyan"),
        chip("fo-p2", 160, 610, "2. Cộng cột của bảng con, hoặc COUNT(DISTINCT)", "green"),
        chip("fo-p3", 160, 700, "3. Tính tổng từng bảng riêng rồi mới nối", "violet"),
    ]), beats=[
        ("Phần sáu. Bẫy nhân dòng, cái bẫy làm tổng tiền phình to.",
         "Phần 6: bẫy nhân dòng làm SUM phình to.",
         [TYPE("#fo-big", 0.1, 0.06), IN("#fo-bsub", "blur", 0.9), OUT("#fo-big, #fo-bsub", "zoom", 3.0), IN("#fo-hud", "left", 3.6)]),
        ("Nối bảng bên nhiều vào bảng bên một thì dòng của bảng một bị lặp lại. Tám mươi lăm tài khoản nối bút toán ra chín trăm ba mươi hai dòng.",
         "Nối bên nhiều vào bên một: dòng bên một bị lặp. 85 thành 932.",
         [IN("#fo-a", "left", 0.3), IN("#fo-e", "right", 1.0), *ARROW("fo-w", 2.0, 0.8), IN("#fo-n1", "pop", 2.8), IN("#fo-nn", "pop", 3.2), IN("#fo-c1", "left", 5.0), IN("#fo-c2", "left", 7.2)]),
        ("Cộng cột của bảng một thì sai. Khách một không không không không một có hai tài khoản, tổng đúng là một trăm mười ba triệu. Nhưng sau khi nối, tài khoản đầu bị cộng mười chín lần, tài khoản sau sáu lần.",
         "Khách 100001: đúng 113.044.114, sau JOIN thành 2.081.692.684.",
         [OUT("#fo-a, #fo-e, #fo-w, #fo-n1, #fo-nn, #fo-c1, #fo-c2", "fade", 0, 0.4), IN("#fo-t-h", "left", 0.8), IN("#fo-t-1", "left", 1.2), IN("#fo-t-2", "left", 1.6),
          IN("#fo-r1", "up", 3.0), IN("#fo-r2", "up", 9.0), SHAKE("#fo-r2", 9.8)]),
        ("Trên cả bảng cũng vậy. Tổng số dư bảy mươi lăm tài khoản tiền đồng, tính thẳng, là mười bảy tỷ. Sau khi nối thành hơn hai trăm mười bảy tỷ, gấp hơn mười hai lần, không báo lỗi nào.",
         "Tổng thật 17.342.070.666; sau JOIN 217.922.454.175.",
         [OUT("#fo-t-h, #fo-t-1, #fo-t-2, #fo-r1, #fo-r2", "fade", 0, 0.4), IN("#fo-q", "up", 0.6, 0.4), IN("#fo-q-1", "type1", 0.9, 0.3), IN("#fo-q-2", "type1", 1.6, 0.3),
          IN("#fo-q-3", "type1", 2.4, 0.3), IN("#fo-q-4", "type1", 3.4, 0.3), IN("#fo-b2", "up", 4.6), IN("#fo-b1", "up", 8.6), SHAKE("#fo-b1", 9.4), IN("#fo-c3", "left", 11.0)]),
        ("Cách phòng. Một: đếm dòng trước và sau mỗi JOIN. Hai: đừng cộng cột của bảng cha, hãy cộng cột của bảng con, cho ra đúng mười bảy tỷ. Ba: tính tổng từng bảng riêng rồi mới nối.",
         "Đếm dòng trước/sau JOIN; cộng cột bảng con; tổng từng bảng rồi nối.",
         [OUT("#fo-q, " + sids("fo-q", 4) + ", #fo-b1, #fo-b2, #fo-c3", "fade", 0, 0.4), IN("#fo-p1", "left", 0.8),
          IN("#fo-q2", "up", 3.0, 0.4), IN("#fo-q2-1", "type1", 3.3, 0.3), IN("#fo-q2-2", "type1", 3.9, 0.3), IN("#fo-q2-3", "type1", 4.5, 0.3), IN("#fo-q2-4", "type1", 5.1, 0.3),
          IN("#fo-p2", "left", 5.6), IN("#fo-b3", "up", 7.4), IN("#fo-p3", "left", 10.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("share", "Bốn kiểu JOIN", "INNER chỉ cặp khớp; LEFT, RIGHT, FULL giữ thêm"),
                                                ("split", "Không khớp", "LEFT JOIN rồi IS NULL; thu hẹp ở ON"),
                                                ("grid", "Nhiều bảng", "một ON cho mỗi bảng thêm"),
                                                ("box", "Nhân dòng", "đếm dòng trước và sau JOIN")]),
        chip("ou-next", 520, 650, "Bài tiếp: CASE WHEN, COALESCE, CAST", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: INNER JOIN chỉ giữ cặp khớp, LEFT, RIGHT, FULL giữ thêm dòng không khớp. Tìm dòng không khớp thì LEFT JOIN rồi kiểm tra rỗng, điều kiện thu hẹp để ở ON. Nối nhiều bảng cần một ON cho mỗi bảng. Và luôn đếm dòng trước và sau khi nối.",
         "INNER · LEFT, RIGHT, FULL · anti-join · nhiều bảng · nhân dòng.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 7.0), IN("#ou-c2", "pop", 11.0), IN("#ou-c3", "pop", 14.0)]),
        ("Bài tiếp theo là biến đổi dữ liệu.", "Bài tiếp: CASE WHEN, COALESCE, CAST.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)


def squeeze_to_audio(scenes, scenes_file, margin=0.5):
    """After fit_to_audio: any beat whose last action starts too close to (or after) the end of its audio is compressed to fit."""
    beats = Path(scenes_file).parent / ".tts" / "beats.json"
    if not beats.exists():
        return
    known = {b["spoken"]: b["d"] for b in json.loads(beats.read_text(encoding="utf-8"))}
    for sc in scenes:
        for spoken, _caption, actions in sc["beats"]:
            if spoken not in known or not actions:
                continue
            last = max(a.get("d", 0) for a in actions)
            limit = known[spoken] - margin
            if last > limit > 0:
                for a in actions:
                    a["d"] = round(a.get("d", 0) * limit / last, 2)


squeeze_to_audio(SCENES, __file__)
