"""SQL aggregate explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-aggregate.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
customer COUNT(*) 40, COUNT(mobile) 34, COUNT(email) 31; account category 1001: 36 accounts, 27 distinct customers;
funds_transfer DONE: 123 orders, SUM 819011621.00, MIN 42.00, MAX 30000000.00; account VND (75 accounts): SUM 17342070666.00, MIN -733334000.00,
MAX 3052868789.00; AVG of (10, 20, NULL) = 15; SUM over zero rows = NULL, COUNT = 0;
account per company_id 19, 14, 17, 18, 17 (85); category 6006 per company: 3 / 172569987.00, 2 / 3256393376.00, 1 / 1010536793.00,
1 / 101407367.00, 2 / 101054295.00; company_id x category_id first rows VN0010001: 1001 -> 8, 1002 -> 3, 3001 -> 4, 6006 -> 3;
customer gender F 16, M 16, NULL 8; missing GROUP BY column -> column "account.category_id" must appear in the GROUP BY clause or be used in an aggregate function;
SUM in WHERE -> aggregate functions are not allowed in WHERE; HAVING alias -> column "tong" does not exist;
HAVING SUM(VND balance) > 4000000000 -> VN0010002 4877395569.00, VN0010003 4671229987.00; DONE per day HAVING COUNT(*) >= 3 -> 2024-11-25, 4, 45000667.00;
customers with OPEN VND balance > 3000000000 -> 100036 (3, 3235868789.00), 100035 (3, 3225133015.00).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<s>'[^']*')|(?P<k>\b(?:SELECT|FROM|WHERE|AND|ORDER BY|GROUP BY|HAVING|LIMIT|DISTINCT|AS|DESC)\b)"
    r"|(?P<f>\b(?:COUNT|SUM|AVG|MIN|MAX)\b(?=\())|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff", f="#fcd34d")


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


# category 6006 accounts grouped by company (SELECT account_id, company_id, working_balance FROM account WHERE category_id = 6006)
ACC = [("1000000006", "VN0010001", "20281474.00"), ("1000000042", "VN0010001", "50881146.00"), ("1000000046", "VN0010001", "101407367.00"),
       ("1000000062", "VN0010002", "3052868789.00"), ("1000000065", "VN0010002", "203524587.00"), ("1000000053", "VN0010003", "1010536793.00"),
       ("1000000033", "VN0010004", "101407367.00"), ("1000000012", "VN0010005", "50703683.00"), ("1000000028", "VN0010005", "50350612.00")]
GROUPS = [("VN0010001", [0, 1, 2], "3", "172569987.00"), ("VN0010002", [3, 4], "2", "3256393376.00"), ("VN0010003", [5], "1", "1010536793.00"),
          ("VN0010004", [6], "1", "101407367.00"), ("VN0010005", [7, 8], "2", "101054295.00")]


def group_cards():
    out = []
    for gi, (co, idx, cnt, tot) in enumerate(GROUPS, 1):
        x = 85 + (gi - 1) * 355
        rows = "".join(f'<div style="font:500 25px var(--mono);padding:4px 0;color:#e6e9f0">{esc(ACC[i][2])}</div>' for i in idx)
        inner = f'<div style="width:100%;align-self:flex-start"><div style="font:700 28px var(--mono);padding-bottom:10px;color:#fff">{co}</div>{rows}</div>'
        out.append(box(f"gb-g{gi}", x, 400, 330, 250, inner, "cyan", ""))
        out.append(el(f"gb-n{gi}", x, 700, 330, None, f"COUNT = {cnt}", "chip green r", "justify-content:center;text-align:center;box-sizing:border-box"))
        out.append(el(f"gb-s{gi}", x, 780, 330, None, esc(tot), "chip amber r", "justify-content:center;text-align:center;box-sizing:border-box;font-size:24px"))
    return "".join(out)


def flow_chips(prefix, y, labels, tone="cyan", w=230, x0=95, gap=20):
    return "".join(chip(f"{prefix}{i}", x0 + i * (w + gap), y, t, tone, w) for i, t in enumerate(labels))


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Báo cáo ngân hàng T24", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Mỗi chi nhánh có bao nhiêu tài khoản?"), "h1 center r"),
        chip("hk-85", 560, 520, "account: 85 dòng, nhưng cần trả lời ngắn gọn", "amber", None),
        tbl("hk-t", 640, 430, [(260, True), (380, True)], ["company_id", "so_tai_khoan"],
            [["VN0010001", "19"], ["VN0010002", "14"], ["VN0010003", "17"], ["VN0010004", "18"], ["VN0010005", "17"]], 66, 30),
        tile("hk-tile", 330, 350, 220, "grid"),
        el("hk-word", 600, 380, 1300, None, letters("GROUP BY & HAVING"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "COUNT · SUM · MIN · MAX · GROUP BY · HAVING", "kin-sub r"),
    ]), beats=[
        ("Giám đốc hỏi: mỗi chi nhánh đang có bao nhiêu tài khoản? Tám mươi lăm dòng là chưa trả lời gì cả.",
         "Giám đốc hỏi: mỗi chi nhánh có bao nhiêu tài khoản? 85 dòng chưa trả lời gì cả.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-85", "up", 4.5)]),
        ("Câu trả lời đúng chỉ có năm dòng, mỗi chi nhánh một dòng, kèm một con số tổng hợp.",
         "5 dòng: mỗi chi nhánh một dòng kèm một con số.",
         [OUT("#hk-85", "fade", 0, 0.3)] + show_tbl("hk-t", 5, 0.4, 0.7)),
        ("Hôm nay ta học cách tạo ra kết quả đó: hàm tổng hợp, gom nhóm, và lọc nhóm.",
         "Hôm nay: hàm tổng hợp, GROUP BY và HAVING.",
         [OUT("#hk-eye, #hk-q, " + sel_tbl("hk-t", 5), "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ count
    dict(id="count-basics", world=(1920, 1080), hud=hud("cb", "Đếm dòng với COUNT", "Nhiều dòng vào, một giá trị ra"), cam="".join([
        big_title("cb", "COUNT", "Nén nhiều dòng thành một giá trị"),
        sqlbox("cb-q", 120, 190, 900, ["SELECT COUNT(*) AS so_khach,", "       COUNT(mobile) AS co_mobile,", "       COUNT(email) AS co_email", "FROM customer;"]),
        chip("cb-k1", 1090, 200, "COUNT(*): đếm mọi dòng", "cyan"),
        chip("cb-k2", 1090, 290, "COUNT(cột): bỏ qua NULL", "violet"),
        tbl("cb-t", 120, 490, [(240, True), (260, True), (260, True)], ["so_khach", "co_mobile", "co_email"], [["40", "34", "31"]], 72, 30),
        chip("cb-k3", 1090, 500, "40 - 34 = 6 khách chưa có số", "green"),
        sqlbox("cb-q2", 120, 190, 1000, ["SELECT COUNT(*) AS so_tai_khoan,", "       COUNT(DISTINCT customer_id) AS so_khach", "FROM account", "WHERE category_id = 1001;"]),
        tbl("cb-u", 120, 490, [(300, True), (260, True)], ["so_tai_khoan", "so_khach"], [["36", "27"]], 72, 30),
        chip("cb-d1", 800, 500, "Đếm tài khoản: COUNT(*)", "cyan"),
        chip("cb-d2", 800, 590, "Đếm khách: COUNT(DISTINCT customer_id)", "green"),
    ]), beats=[
        ("Phần một. Hàm tổng hợp đọc nhiều dòng rồi nén thành một giá trị. Hàm đầu tiên là Count, dùng để đếm.",
         "Phần 1: hàm tổng hợp nén nhiều dòng thành một giá trị. Đầu tiên là COUNT.",
         title_beat("cb")),
        ("Count sao đếm số dòng. Count của một cột chỉ đếm những dòng không rỗng. Ta thử trên bảng khách hàng.",
         "COUNT(*) đếm số dòng. COUNT(cột) chỉ đếm dòng không NULL.",
         type_q("cb-q", 4, 0.3, 1.0) + [IN("#cb-k1", "left", 1.8), IN("#cb-k2", "left", 4.2)]),
        ("Có bốn mươi khách, ba mươi bốn người có số điện thoại, ba mươi mốt người có email. Bốn mươi trừ ba mươi bốn, ra sáu khách chưa có số.",
         "40 khách, 34 có số điện thoại, 31 có email. 40 - 34 = 6 khách chưa có số.",
         [DIM("#cb-q, #cb-q-1, #cb-q-2, #cb-q-3, #cb-q-4, #cb-k1, #cb-k2", 0, 0.15)] + show_tbl("cb-t", 1, 0.3) + [IN("#cb-k3", "left", 6.0)]),
        ("Muốn đếm giá trị khác nhau thì thêm Distinct. Có ba mươi sáu tài khoản thanh toán, nhưng chỉ thuộc về hai mươi bảy khách, vì có khách mở nhiều tài khoản.",
         "COUNT(DISTINCT): 36 tài khoản thanh toán thuộc 27 khách.",
         [OUT(sel_q("cb-q", 4) + ", #cb-k1, #cb-k2, #cb-k3, " + sel_tbl("cb-t", 1), "fade", 0, 0.4)] + type_q("cb-q2", 4, 0.6, 1.0) + show_tbl("cb-u", 1, 6.0)),
        ("Cách nhớ: đếm tài khoản thì dùng Count sao, đếm số khách thì dùng Count Distinct.",
         "Đếm tài khoản: COUNT(*). Đếm khách: COUNT(DISTINCT customer_id).",
         [DIM("#cb-q2, #cb-q2-1, #cb-q2-2, #cb-q2-3, #cb-q2-4", 0, 0.15), IN("#cb-d1", "left", 0.4), IN("#cb-d2", "left", 3.0)]),
    ]),
    # ------------------------------------------------------------ sum avg
    dict(id="sum-avg", world=(1920, 1080), hud=hud("sa", "SUM, AVG, MIN, MAX", "Làm việc trên cột số hoặc ngày"), cam="".join([
        big_title("sa", "SUM, AVG, MIN, MAX", "Tính trên cột số hoặc ngày"),
        sqlbox("sa-q", 120, 190, 1300, ["SELECT COUNT(*) AS so_lenh, SUM(amount) AS tong_tien,", "       MIN(amount) AS nho_nhat, MAX(amount) AS lon_nhat",
                                         "FROM funds_transfer", "WHERE status = 'DONE';"]),
        tbl("sa-t", 120, 490, [(200, True), (330, True), (260, True), (330, True)], ["so_lenh", "tong_tien", "nho_nhat", "lon_nhat"],
            [["123", "819011621.00", "42.00", "30000000.00"]], 72, 30),
        sqlbox("sa-q2", 120, 190, 1000, ["SELECT SUM(working_balance) AS tong,", "       MIN(working_balance) AS thap_nhat,", "       MAX(working_balance) AS cao_nhat",
                                          "FROM account WHERE ccy = 'VND';"]),
        tbl("sa-u", 120, 490, [(380, True), (360, True), (360, True)], ["tong", "thap_nhat", "cao_nhat"],
            [["17342070666.00", "-733334000.00", "3052868789.00"]], 72, 30),
        chip("sa-m1", 120, 700, "ccy = 'VND': 75 tài khoản, không cộng lẫn USD, EUR", "amber"),
        chip("sa-m2", 120, 790, "Số âm: tài khoản vay, khách đang nợ ngân hàng", "red"),
        el("sa-v", 0, 210, 1920, None, "Cột x có ba dòng", "lbl r", "text-align:center;font-size:34px"),
        box("sa-n1", 560, 300, 220, 110, '<b style="font:700 44px var(--mono)">10</b>', "cyan", "card"),
        box("sa-n2", 850, 300, 220, 110, '<b style="font:700 44px var(--mono)">20</b>', "cyan", "card"),
        box("sa-n3", 1140, 300, 220, 110, '<b style="font:italic 700 44px var(--mono);opacity:.45">NULL</b>', "cyan", "card"),
        chip("sa-a1", 560, 500, "AVG(x) = (10 + 20) / 2 = 15", "green"),
        chip("sa-a2", 560, 590, "không phải (10 + 20 + 0) / 3", "red"),
        chip("sa-e1", 560, 500, "SUM của 0 dòng: NULL", "red"),
        chip("sa-e2", 560, 590, "COUNT của 0 dòng: 0", "green"),
    ]), beats=[
        ("Phần hai. Sum để cộng, rồi trung bình, nhỏ nhất và lớn nhất. Chúng làm việc trên cột số, hoặc cột ngày.",
         "Phần 2: SUM, AVG, MIN, MAX làm việc trên cột số hoặc ngày.",
         title_beat("sa")),
        ("Với các lệnh chuyển khoản đã hoàn tất, ta tính số lệnh, tổng tiền, lệnh nhỏ nhất và lớn nhất.",
         "Thống kê các lệnh chuyển khoản status = 'DONE'.",
         type_q("sa-q", 4, 0.3, 1.2)),
        ("Có một trăm hai mươi ba lệnh, tổng hơn tám trăm mười chín triệu, nhỏ nhất là bốn mươi hai, lớn nhất ba mươi triệu.",
         "123 lệnh, tổng 819011621, nhỏ nhất 42, lớn nhất 30000000.",
         [DIM("#sa-q, #sa-q-1, #sa-q-2, #sa-q-3, #sa-q-4", 0, 0.15)] + show_tbl("sa-t", 1, 0.3)),
        ("Cẩn thận với tiền tệ. Bảng tài khoản có cả VND, USD và EUR, cộng lẫn lộn là vô nghĩa. Nên lọc riêng VND, gồm bảy mươi lăm tài khoản.",
         "Không cộng lẫn các loại tiền: lọc ccy = 'VND', 75 tài khoản.",
         [OUT(sel_q("sa-q", 4) + ", " + sel_tbl("sa-t", 1), "fade", 0, 0.4)] + type_q("sa-q2", 4, 0.6, 1.0) + [IN("#sa-m1", "left", 5.0)]),
        ("Tổng số dư hơn mười bảy tỷ. Số dư thấp nhất là số âm, vì đó là tài khoản vay, khách đang nợ ngân hàng.",
         "Tổng 17.342.070.666. Số âm là tài khoản vay.",
         show_tbl("sa-u", 1, 0.3) + [IN("#sa-m2", "left", 4.5)]),
        ("Quy tắc vàng: mọi hàm tổng hợp đều bỏ qua giá trị rỗng. Ba dòng mười, hai mươi và rỗng cho trung bình mười lăm, không phải mười.",
         "Hàm tổng hợp bỏ qua NULL: AVG(10, 20, NULL) = 15, không phải 10.",
         [OUT(sel_q("sa-q2", 4) + ", " + sel_tbl("sa-u", 1) + ", #sa-m1, #sa-m2", "fade", 0, 0.4), IN("#sa-v", "fade", 0.5),
          IN("#sa-n1", "pop", 0.8), IN("#sa-n2", "pop", 1.3), IN("#sa-n3", "pop", 1.8), IN("#sa-a1", "left", 5.5), IN("#sa-a2", "left", 7.5), SHAKE("#sa-a2", 8.0)]),
        ("Một bất ngờ nữa: nếu không còn dòng nào để cộng, Sum trả về rỗng chứ không phải không. Còn Count thì trả về không.",
         "Không còn dòng nào: SUM cho NULL, COUNT cho 0.",
         [OUT("#sa-a1, #sa-a2, #sa-v, #sa-n1, #sa-n2, #sa-n3", "fade", 0, 0.4), IN("#sa-e1", "left", 0.8), IN("#sa-e2", "left", 4.5)]),
    ]),
    # ------------------------------------------------------------ group by
    dict(id="group-by", world=(1920, 1080), hud=hud("gb", "GROUP BY", "Mỗi nhóm cho đúng một dòng"), cam="".join([
        big_title("gb", "GROUP BY", "Mỗi chi nhánh một dòng"),
        sqlbox("gb-q", 120, 190, 1000, ["SELECT company_id, COUNT(*) AS so_tai_khoan", "FROM account", "GROUP BY company_id", "ORDER BY company_id;"]),
        tbl("gb-t", 120, 490, [(260, True), (300, True)], ["company_id", "so_tai_khoan"],
            [["VN0010001", "19"], ["VN0010002", "14"], ["VN0010003", "17"], ["VN0010004", "18"], ["VN0010005", "17"]], 62, 28),
        chip("gb-sum", 800, 560, "19 + 14 + 17 + 18 + 17 = 85", "cyan"),
        sqlbox("gb-q2", 120, 170, 1300, ["SELECT company_id, COUNT(*), SUM(working_balance)", "FROM account WHERE category_id = 6006", "GROUP BY company_id;"], 26),
        tbl("gb-r", 120, 390, [(260, True), (260, True), (340, True)], ["account_id", "company_id", "working_balance"],
            [list(a) for a in ACC], 52, 24),
        group_cards(),
        flow_chips("gb-f", 480, ["FROM", "WHERE", "GROUP BY", "COUNT, SUM"], "cyan", 280, 150, 130),
        wires(*[arrow(f"gb-w{i}", [(150 + i * 410 + 290, 508), (150 + (i + 1) * 410 - 10, 508)], "cyan") for i in range(3)]),
        chip("gb-fn", 340, 640, "Lọc dòng trước, gom nhóm sau, tính tổng hợp cuối", "violet"),
    ]), beats=[
        ("Phần ba. Báo cáo thường hỏi mỗi chi nhánh, mỗi ngày, mỗi loại sản phẩm. Khi đó ta thêm Group By.",
         "Phần 3: báo cáo hỏi \"mỗi chi nhánh\", \"mỗi ngày\": thêm GROUP BY.",
         title_beat("gb")),
        ("Group By company id xếp các dòng cùng chi nhánh vào một nhóm. Count chạy riêng trong từng nhóm.",
         "GROUP BY company_id: các dòng cùng chi nhánh vào một nhóm, COUNT chạy trong từng nhóm.",
         type_q("gb-q", 4, 0.3, 1.2)),
        ("Kết quả chỉ có năm dòng, mỗi nhóm một dòng: mười chín, mười bốn, mười bảy, mười tám, mười bảy. Cộng lại đúng tám mươi lăm.",
         "5 nhóm, 5 dòng: 19, 14, 17, 18, 17. Cộng lại đúng 85.",
         [DIM("#gb-q, #gb-q-1, #gb-q-2, #gb-q-3, #gb-q-4", 0, 0.15)] + show_tbl("gb-t", 5, 0.3, 0.7) + [IN("#gb-sum", "left", 6.5)]),
        ("Để thấy tận mắt, lấy chín tài khoản tiết kiệm loại sáu không không sáu. Chín dòng này đang lẫn lộn các chi nhánh.",
         "9 tài khoản loại 6006, các chi nhánh đang lẫn lộn.",
         [OUT(sel_q("gb-q", 4) + ", #gb-sum, " + sel_tbl("gb-t", 5), "fade", 0, 0.4)] + type_q("gb-q2", 3, 0.6, 0.9) + show_tbl("gb-r", 9, 3.2, 0.35)),
        ("Group By xếp các dòng cùng chi nhánh vào cùng một nhóm. Chi nhánh một có ba dòng, chi nhánh hai có hai dòng.",
         "GROUP BY chỉ xếp các dòng cùng chi nhánh vào cùng một nhóm, chưa tính gì.",
         [OUT(sel_tbl("gb-r", 9), "fade", 0, 0.4)] + [IN(f"#gb-g{i}", "up", 0.6 + (i - 1) * 0.9) for i in range(1, 6)]),
        ("Sau đó mới chạy Count và Sum trong từng nhóm. Mỗi nhóm cho ra đúng một dòng kết quả.",
         "Rồi mới chạy COUNT và SUM trong từng nhóm: mỗi nhóm một dòng.",
         [IN(f"#gb-n{i}", "pop", 0.3 + (i - 1) * 0.5) for i in range(1, 6)] + [IN(f"#gb-s{i}", "pop", 2.8 + (i - 1) * 0.5) for i in range(1, 6)]),
        ("Nhớ thứ tự này: lấy bảng, lọc dòng, gom nhóm, và hàm tổng hợp chạy sau cùng.",
         "Thứ tự: FROM, WHERE (lọc dòng), GROUP BY (gom nhóm), hàm tổng hợp.",
         [OUT(sel_q("gb-q2", 3) + ", " + ", ".join(f"#gb-g{i}, #gb-n{i}, #gb-s{i}" for i in range(1, 6)), "fade", 0, 0.4)]
         + [IN(f"#gb-f{i}", "left", 0.6 + i * 0.8) for i in range(4)] + sum([ARROW(f"gb-w{i}", 1.0 + i * 0.8, 0.5) for i in range(3)], []) + [IN("#gb-fn", "up", 3.4)]),
    ]),
    # ------------------------------------------------------------ group rules
    dict(id="group-rules", world=(1920, 1080), hud=hud("gr", "Quy tắc của GROUP BY", "Nhiều cột, NULL, và cột không được gom"), cam="".join([
        big_title("gr", "Quy tắc GROUP BY", "Nhiều cột, NULL và cột lạc nhóm"),
        sqlbox("gr-q", 120, 190, 1300, ["SELECT company_id, category_id, COUNT(*) AS so_tai_khoan", "FROM account", "GROUP BY company_id, category_id",
                                         "ORDER BY company_id, category_id", "LIMIT 4;"], 26),
        tbl("gr-t", 120, 500, [(260, True), (260, True), (280, True)], ["company_id", "category_id", "so_tai_khoan"],
            [["VN0010001", "1001", "8"], ["VN0010001", "1002", "3"], ["VN0010001", "3001", "4"], ["VN0010001", "6006", "3"]], 60, 28),
        chip("gr-k1", 1050, 520, "Mỗi cặp một nhóm: cả bảng có 29 cặp", "cyan"),
        sqlbox("gr-q2", 120, 190, 900, ["SELECT gender, COUNT(*) AS so_khach", "FROM customer", "GROUP BY gender", "ORDER BY gender;"]),
        tbl("gr-u", 120, 500, [(200, True), (280, True)], ["gender", "so_khach"], [["F", "16"], ["M", "16"], ["NULL", "8"]], 64, 30),
        chip("gr-k2", 700, 580, "NULL cũng thành một nhóm", "amber"),
        chip("gr-k3", 700, 670, "8 khách doanh nghiệp, không có giới tính", "violet"),
        sqlbox("gr-q3", 120, 190, 1300, ["SELECT company_id, category_id, COUNT(*) AS so_tai_khoan", "FROM account", "GROUP BY company_id", "ORDER BY company_id, category_id;"], 26),
        errbox("gr-err", 120, 480, 1680, 'ERROR: column "account.category_id" must appear in the GROUP BY clause or be used in an aggregate function'),
        chip("gr-w", 120, 700, "Một chi nhánh có nhiều loại sản phẩm: hiện loại nào?", "amber"),
        chip("gr-x1", 120, 790, "Cách 1: thêm cột vào GROUP BY", "green"),
        chip("gr-x2", 120, 880, "Cách 2: bọc cột trong MIN hoặc MAX", "green"),
    ]), beats=[
        ("Phần bốn. Quy tắc của Group By. Trước hết, ta gom được theo nhiều cột cùng lúc.",
         "Phần 4: quy tắc của GROUP BY.",
         title_beat("gr")),
        ("Gom theo chi nhánh và loại sản phẩm thì mỗi cặp là một nhóm. Chi nhánh một có tám, ba, bốn, rồi ba tài khoản ở bốn loại đầu. Cả bảng có hai mươi chín cặp.",
         "GROUP BY hai cột: mỗi cặp (chi nhánh, loại) là một nhóm. Cả bảng có 29 cặp.",
         type_q("gr-q", 5, 0.3, 1.0) + show_tbl("gr-t", 4, 5.5, 0.9) + [IN("#gr-k1", "left", 8.0)]),
        ("Giá trị rỗng cũng thành một nhóm. Gom khách theo giới tính ra ba dòng: mười sáu nữ, mười sáu nam, và tám khách không có giới tính, là các khách doanh nghiệp.",
         "Gom theo gender: F 16, M 16, và nhóm NULL 8 khách doanh nghiệp.",
         [OUT(sel_q("gr-q", 5) + ", #gr-k1, " + sel_tbl("gr-t", 4), "fade", 0, 0.4)] + type_q("gr-q2", 4, 0.6, 0.9) + show_tbl("gr-u", 3, 4.2, 0.8)
         + [DIM("#gr-u-1, #gr-u-2", 6.5, 0.25), IN("#gr-k2", "left", 6.0), IN("#gr-k3", "left", 7.6)]),
        ("Bẫy lớn nhất: đưa vào Select một cột không có trong Group By. Mỗi chi nhánh có nhiều loại sản phẩm, vậy database phải hiện loại nào?",
         "Bẫy: category_id có trong SELECT nhưng không có trong GROUP BY.",
         [OUT(sel_q("gr-q2", 4) + ", #gr-k2, #gr-k3, " + sel_tbl("gr-u", 3), "fade", 0, 0.4)] + type_q("gr-q3", 4, 0.6, 1.0) + [IN("#gr-w", "left", 6.0)]),
        ("Database không đoán mà báo lỗi: cột phải nằm trong Group By, hoặc nằm trong một hàm tổng hợp.",
         "Lỗi: cột phải nằm trong GROUP BY hoặc trong hàm tổng hợp.",
         [DIM("#gr-q3, #gr-q3-1, #gr-q3-2, #gr-q3-3, #gr-q3-4", 0, 0.15), IN("#gr-err", "up", 0.4), SHAKE("#gr-err", 1.0)]),
        ("Có hai cách sửa. Thêm cột vào Group By, như ví dụ lúc nãy. Hoặc bọc nó trong hàm Min hay Max.",
         "Sửa: thêm cột vào GROUP BY, hoặc bọc trong MIN / MAX.",
         [IN("#gr-x1", "left", 0.8), IN("#gr-x2", "left", 4.8)]),
    ]),
    # ------------------------------------------------------------ having
    dict(id="having", world=(1920, 1080), hud=hud("hv", "HAVING", "Lọc nhóm sau khi gom"), cam="".join([
        big_title("hv", "HAVING", "Lọc nhóm, không phải lọc dòng"),
        sqlbox("hv-q1", 120, 190, 1300, ["SELECT company_id, SUM(working_balance) AS tong_so_du", "FROM account", "WHERE SUM(working_balance) > 4000000000", "GROUP BY company_id;"], 26),
        errbox("hv-err", 120, 480, 1400, "ERROR: aggregate functions are not allowed in WHERE"),
        chip("hv-w", 120, 600, "WHERE chạy trước khi gom: chưa có tổng nào cả", "amber"),
        sqlbox("hv-q2", 120, 170, 1300, ["SELECT company_id, SUM(working_balance) AS tong_so_du", "FROM account", "WHERE ccy = 'VND'", "GROUP BY company_id",
                                          "HAVING SUM(working_balance) > 4000000000", "ORDER BY company_id;"], 26),
        tbl("hv-t", 120, 520, [(260, True), (380, True)], ["company_id", "tong_so_du"], [["VN0010002", "4877395569.00"], ["VN0010003", "4671229987.00"]], 64, 30),
        chip("hv-r", 120, 740, "WHERE lọc dòng trước khi gom. HAVING lọc nhóm sau khi gom", "cyan"),
        sqlbox("hv-q3", 120, 170, 1500, ["SELECT processing_date, COUNT(*) AS so_lenh, SUM(amount) AS tong_tien", "FROM funds_transfer", "WHERE status = 'DONE'",
                                          "GROUP BY processing_date", "HAVING COUNT(*) >= 3;"], 26),
        tbl("hv-u", 120, 490, [(300, True), (200, True), (300, True)], ["processing_date", "so_lenh", "tong_tien"], [["2024-11-25", "4", "45000667.00"]], 66, 30),
        chip("hv-t1", 120, 300, "status = 'OPEN' hay ccy = 'VND': điều kiện dòng, đặt ở WHERE", "violet"),
        chip("hv-t2", 120, 420, "HAVING tong > ... : column \"tong\" does not exist", "red"),
        chip("hv-t3", 120, 540, "Alias dùng được ở ORDER BY, không dùng được ở HAVING", "amber"),
    ]), beats=[
        ("Phần năm. Giả sử ta chỉ muốn thấy chi nhánh có tổng số dư VND trên bốn tỷ. Điều kiện này nói về cả nhóm.",
         "Phần 5: chỉ muốn chi nhánh có tổng số dư VND trên 4 tỷ: điều kiện về cả nhóm.",
         title_beat("hv")),
        ("Viết nó ở bước lọc dòng thì báo lỗi, vì bước này chạy trước khi gom nhóm, lúc đó chưa có tổng nào cả.",
         "WHERE SUM(...) báo lỗi: WHERE chạy trước khi gom nhóm.",
         type_q("hv-q1", 4, 0.3, 0.6) + [IN("#hv-err", "up", 3.2), SHAKE("#hv-err", 3.7), IN("#hv-w", "left", 4.5)]),
        ("Công cụ đúng là Having, đứng ngay sau Group By. Nó lọc các nhóm sau khi hàm tổng hợp đã tính xong.",
         "HAVING đứng sau GROUP BY: lọc nhóm sau khi hàm tổng hợp đã tính.",
         [OUT(sel_q("hv-q1", 4) + ", #hv-err, #hv-w", "fade", 0, 0.4)] + type_q("hv-q2", 6, 0.6, 0.75)),
        ("Còn lại hai chi nhánh: chi nhánh hai và chi nhánh ba. Nhớ rằng lọc dòng diễn ra trước khi gom, còn Having lọc nhóm sau khi gom.",
         "2 chi nhánh: VN0010002 và VN0010003. WHERE lọc dòng, HAVING lọc nhóm.",
         [DIM(sel_q("hv-q2", 6), 0, 0.15)] + show_tbl("hv-t", 2, 0.3, 0.7) + [IN("#hv-r", "left", 5.0)]),
        ("Thêm một ví dụ: lệnh chuyển khoản hoàn tất theo ngày, chỉ giữ ngày có từ ba lệnh trở lên. Còn đúng một ngày, hai mươi lăm tháng mười một, bốn lệnh.",
         "Lệnh DONE theo ngày, HAVING COUNT(*) >= 3: còn ngày 2024-11-25 với 4 lệnh.",
         [OUT(sel_q("hv-q2", 6) + ", #hv-r, " + sel_tbl("hv-t", 2), "fade", 0, 0.4)] + type_q("hv-q3", 5, 0.6, 0.9) + show_tbl("hv-u", 1, 6.5)),
        ("Hai bẫy hay gặp. Điều kiện về dòng, như trạng thái hay loại tiền, thì đặt ở bước lọc dòng. Và trong Postgres, không dùng được tên đặt sau As ở trong Having.",
         "Bẫy: điều kiện dòng đặt ở WHERE. Alias không dùng được trong HAVING.",
         [OUT(sel_q("hv-q3", 5) + ", " + sel_tbl("hv-u", 1), "fade", 0, 0.4), IN("#hv-t1", "left", 0.8), IN("#hv-t2", "left", 4.8), SHAKE("#hv-t2", 5.5), IN("#hv-t3", "left", 7.0)]),
    ]),
    # ------------------------------------------------------------ bank reports
    dict(id="bank-reports", world=(1920, 1080), hud=hud("br", "Báo cáo ngân hàng", "Ghép mọi mệnh đề lại"), cam="".join([
        big_title("br", "Báo cáo hoàn chỉnh", "Ghép tất cả mệnh đề lại"),
        sqlbox("br-q", 120, 170, 1000, ["SELECT customer_id,", "       COUNT(*) AS so_tai_khoan,", "       SUM(working_balance) AS tong_so_du", "FROM account",
                                         "WHERE status = 'OPEN' AND ccy = 'VND'", "GROUP BY customer_id", "HAVING SUM(working_balance) > 3000000000", "ORDER BY SUM(working_balance) DESC;"], 26),
        tbl("br-t", 120, 670, [(220, True), (240, True), (330, True)], ["customer_id", "so_tai_khoan", "tong_so_du"],
            [["100036", "3", "3235868789.00"], ["100035", "3", "3225133015.00"]], 62, 28),
        chip("br-a1", 1180, 210, "Mỗi cái gì: GROUP BY customer_id", "cyan"),
        chip("br-a2", 1180, 300, "Tính gì: COUNT(*), SUM(...)", "amber"),
        chip("br-a3", 1180, 390, "Điều kiện dòng: WHERE", "green"),
        chip("br-a4", 1180, 480, "Điều kiện nhóm: HAVING", "violet"),
        chip("br-a5", 1180, 570, "Sắp xếp, cắt bớt: ORDER BY, LIMIT", "cyan"),
        el("br-l1", 95, 270, 700, None, "Thứ tự viết", "lbl r", "text-align:left;font-size:32px"),
        flow_chips("br-w", 330, ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"], "cyan"),
        el("br-l2", 95, 520, 700, None, "Thứ tự database chạy", "lbl r", "text-align:left;font-size:32px"),
        flow_chips("br-x", 580, ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"], "green"),
        chip("br-n", 160, 800, "Vì vậy WHERE không có hàm tổng hợp, và alias không dùng được ở HAVING", "violet"),
    ]), beats=[
        ("Phần sáu. Ghép tất cả thành báo cáo. Ta tìm khách hàng có tổng số dư VND, chỉ tính tài khoản đang mở, hơn ba tỷ.",
         "Phần 6: báo cáo khách hàng có tổng số dư VND (tài khoản OPEN) hơn 3 tỷ.",
         title_beat("br")),
        ("Một câu đầy đủ có đủ mệnh đề: chọn, từ bảng, lọc dòng, gom nhóm, lọc nhóm, rồi sắp xếp giảm dần.",
         "Một câu đầy đủ: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.",
         type_q("br-q", 8, 0.3, 0.65)),
        ("Kết quả có hai khách: khách một không không ba sáu và khách một không không ba lăm, mỗi người ba tài khoản, hơn ba tỷ.",
         "2 khách: 100036 và 100035, mỗi người 3 tài khoản, hơn 3 tỷ.",
         [DIM(sel_q("br-q", 8), 0, 0.15)] + show_tbl("br-t", 2, 0.3, 0.8)),
        ("Công thức giải bài toán báo cáo: xem mỗi cái gì thì đó là Group By. Cần tính gì thì đó là hàm tổng hợp. Điều kiện về dòng thì lọc trước, điều kiện về nhóm vào Having, cuối cùng sắp xếp.",
         "Công thức: mỗi cái gì (GROUP BY), tính gì (hàm tổng hợp), điều kiện dòng (WHERE), điều kiện nhóm (HAVING), sắp xếp.",
         [DIM(sel_tbl("br-t", 2), 0, 0.15), TO("#br-q-6", dict(opacity=1), 0.2), DIM("#br-q-1, #br-q-4, #br-q-5, #br-q-7, #br-q-8", 0.2, 0.15),
          IN("#br-a1", "left", 0.3),
          TO("#br-q-2, #br-q-3", dict(opacity=1), 2.6), DIM("#br-q-6", 2.6, 0.15), IN("#br-a2", "left", 2.6),
          TO("#br-q-5", dict(opacity=1), 4.8), DIM("#br-q-2, #br-q-3", 4.8, 0.15), IN("#br-a3", "left", 4.8),
          TO("#br-q-7", dict(opacity=1), 7.0), DIM("#br-q-5", 7.0, 0.15), IN("#br-a4", "left", 7.0),
          TO("#br-q-8", dict(opacity=1), 9.0), DIM("#br-q-7", 9.0, 0.15), IN("#br-a5", "left", 9.0)]),
        ("Database chạy theo thứ tự khác: lấy bảng, lọc dòng, gom nhóm, lọc nhóm, rồi mới tính Select, sắp xếp và cắt bớt.",
         "Viết: SELECT đầu tiên. Chạy: FROM trước, SELECT đứng giữa.",
         [OUT(sel_q("br-q", 8) + ", " + ", ".join(f"#br-a{i}" for i in range(1, 6)) + ", " + sel_tbl("br-t", 2), "fade", 0, 0.4), IN("#br-l1", "fade", 0.6)]
         + [IN(f"#br-w{i}", "left", 0.8 + i * 0.25) for i in range(7)] + [IN("#br-l2", "fade", 2.4)] + [IN(f"#br-x{i}", "left", 2.4 + i * 0.6) for i in range(7)]
         + [IN("#br-n", "up", 6.8)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "Hàm tổng hợp", "nén nhiều dòng, bỏ qua NULL"),
                                                ("share", "GROUP BY", "mỗi nhóm một dòng"),
                                                ("lock", "WHERE và HAVING", "lọc dòng, lọc nhóm"),
                                                ("box", "Thứ tự chạy", "FROM trước, SELECT sau")]),
        chip("ou-next", 560, 650, "Bài tiếp: Kết hợp bảng với JOIN", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: hàm tổng hợp nén nhiều dòng thành một giá trị và bỏ qua giá trị rỗng. Group By cho mỗi nhóm đúng một dòng. Lọc dòng diễn ra trước khi gom, Having lọc nhóm sau khi gom. Thứ tự chạy: từ bảng đến Select.",
         "Hàm tổng hợp · GROUP BY · WHERE lọc dòng, HAVING lọc nhóm · thứ tự chạy.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.2), IN("#ou-c2", "pop", 6.8), IN("#ou-c3", "pop", 10.5)]),
        ("Bài tiếp: kết hợp bảng với Join.", "Bài tiếp: Kết hợp bảng với JOIN.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
