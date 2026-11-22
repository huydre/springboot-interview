"""SQL transform explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-transform.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
CASE tiers on VND accounts: 1000000074 -41666000.00 Dư nợ (reordered: Trung bình), counts Thấp 5, Dư nợ 14, Trung bình 24, Cao 32; SUM(CASE) 75 VND and 10 foreign;
COALESCE(mobile, email, 'không có'): 100001 0994373346, 100005 ngo.ngoc.anh@mail.vn, 100021 không có; AVG(close_date - open_date) 1749.0000000000000000
vs AVG(COALESCE(..., 0)) 41.1529411764705882; 10 / 0 -> division by zero, 10 / NULLIF(0, 0) -> NULL;
7 / 2 = 3, 7::numeric / 2 = 3.5000000000000000, DONE rate 93.2 (integer division 93); '12abc'::int, CAST('2024-02-30' AS date), working_balance::int errors as returned;
UPPER 'LÝ HOÀNG LONG', LENGTH(mobile) 10, 'a' || NULL || 'b' NULL vs CONCAT ab, SUBSTRING 099 / 346, mask 099****346;
EXTRACT 2024/12/31/quarter 4/DOW 2, DATE_TRUNC month 2024-01-01 128 and 2024-03-01 83, TO_CHAR 'MM/YYYY' order 05/2024, 06/2023, 06/2024,
date arithmetic 30 / 2025-01-30 / 2024-02-29, last 30 days 17 transfers 8 DONE; AGE 53 years 8 mons 25 days, tuổi 53; 2024 - year 36 vs AGE 35 at 2024-06-30;
age groups Dưới 30 6, Doanh nghiệp 8, 50 trở lên 11, 30 đến 49 15.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

KEYWORDS = ["SELECT", "FROM", "WHERE", "AND", "ORDER BY", "GROUP BY", "LIMIT", "DESC", "AS", "IN", "IS NULL", "IS",
            "CASE", "WHEN", "THEN", "ELSE", "END", "COALESCE", "NULLIF", "CAST", "SUM", "COUNT", "AVG", "ROUND", "UPPER", "LENGTH",
            "SUBSTRING", "CONCAT", "FOR", "EXTRACT", "YEAR", "DATE_TRUNC", "TO_CHAR", "INTERVAL", "AGE", "DATE"]
KW = "|".join(sorted((k.replace(" ", r"\s") for k in KEYWORDS), key=len, reverse=True))
SQL_TOKEN = re.compile(rf"(?P<s>'[^']*')|(?P<k>\b(?:{KW})\b)|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
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
    return [TYPE(f"#{p}-big", 0.1, 0.06), IN(f"#{p}-bsub", "blur", 0.9), OUT(f"#{p}-big, #{p}-bsub", "zoom", 3.4), IN(f"#{p}-hud", "left", 4.0)]


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Xử lý dữ liệu ngay trong SELECT", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Khoản nợ 41 triệu lại là hạng Trung bình?"), "h1 center r"),
        tbl("hk-t", 450, 430, [(260, True), (340, True), (330, False)], ["account_id", "working_balance", "hang"],
            [["1000000074", "-41666000.00", "Trung bình"]], 66, 30),
        chip("hk-bad", 450, 600, "Sai thứ tự nhánh CASE", "red"),
        tile("hk-tile", 360, 350, 220, "grid"),
        el("hk-word", 630, 380, 1250, None, letters("Biến đổi dữ liệu"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "CASE · COALESCE · CAST · chuỗi · ngày tháng", "kin-sub r"),
    ]), beats=[
        ("Báo cáo này gắn một khoản nợ bốn mươi mốt triệu vào hạng Trung bình. Rõ ràng là sai.",
         "Khoản nợ 41 triệu lại bị gắn hạng Trung bình.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), *show_tbl("hk-t", 1, 3.0, 0.5)]),
        ("Lỗi nằm ở thứ tự các nhánh trong câu CASE. Bài này dạy các hàm biến đổi giá trị ngay trong câu Select, mà không sửa bảng gốc.",
         "Lỗi ở thứ tự nhánh CASE. Các hàm biến đổi chỉ đổi kết quả hiển thị, không sửa bảng.",
         [IN("#hk-bad", "left", 0.4), SHAKE("#hk-bad", 1.2)]),
        ("Hôm nay ta học Case When, thay NULL, đổi kiểu, xử lý chuỗi và ngày tháng.",
         "Hôm nay: CASE, COALESCE, CAST, hàm chuỗi và ngày tháng.",
         [OUT("#hk-eye, #hk-q, #hk-bad, " + sel_tbl("hk-t", 1), "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ case-when
    dict(id="case-when", world=(1920, 1080), hud=hud("cw", "CASE WHEN", "Rẽ nhánh từ trên xuống"), cam="".join([
        big_title("cw", "CASE WHEN", "Rẽ nhánh từ trên xuống"),
        sqlbox("cw-q", 80, 190, 900, ["SELECT account_id, working_balance,", "  CASE", "    WHEN working_balance < 0 THEN 'Dư nợ'",
                                      "    WHEN working_balance < 10000000 THEN 'Thấp'", "    WHEN working_balance < 100000000 THEN 'Trung bình'",
                                      "    ELSE 'Cao'", "  END AS hang", "FROM account;"], 25),
        chip("cw-row", 1040, 190, "Dòng xét: 1000000074, số dư -41666000", "amber"),
        tbl("cw-t", 1040, 270, [(150, False), (300, True), (330, False)], ["Nhánh", "Điều kiện", "Với -41666000"],
            [["WHEN 1", "< 0", "Đúng: dừng"], ["WHEN 2", "< 10000000", "không xét"], ["WHEN 3", "< 100000000", "không xét"], ["ELSE", "", "không xét"]], 64, 26, "#4ade80"),
        chip("cw-res", 1040, 640, "Kết quả: Dư nợ", "green"),
        sqlbox("cw-q2", 80, 190, 900, ["CASE", "  WHEN working_balance < 100000000 THEN 'Trung bình'", "  WHEN working_balance < 10000000 THEN 'Thấp'",
                                       "  WHEN working_balance < 0 THEN 'Dư nợ'", "  ELSE 'Cao'", "END"], 25),
        tbl("cw-u", 1040, 270, [(150, False), (300, True), (330, False)], ["Nhánh", "Điều kiện", "Với -41666000"],
            [["WHEN 1", "< 100000000", "Đúng: dừng"], ["WHEN 2", "< 10000000", "không xét"], ["WHEN 3", "< 0", "không xét"], ["ELSE", "", "không xét"]], 64, 26, "#f87171"),
        chip("cw-bad", 1040, 640, "Kết quả: Trung bình, sai", "red"),
        chip("cw-fix", 80, 560, "Nhánh hẹp đứng trước nhánh rộng", "amber"),
        sqlbox("cw-g", 80, 190, 960, ["SELECT CASE ... END AS hang,", "       COUNT(*) AS so_tai_khoan", "FROM account WHERE ccy = 'VND'", "GROUP BY hang", "ORDER BY so_tai_khoan;"], 25),
        tbl("cw-gt", 1120, 190, [(300, False), (320, True)], ["hang", "so_tai_khoan"], [["Thấp", "5"], ["Dư nợ", "14"], ["Trung bình", "24"], ["Cao", "32"]], 64, 27),
        sqlbox("cw-s", 80, 190, 1000, ["SELECT", "  SUM(CASE WHEN ccy = 'VND' THEN 1 ELSE 0 END) AS vnd,", "  SUM(CASE WHEN ccy <> 'VND' THEN 1 ELSE 0 END) AS ngoai_te", "FROM account;"], 25),
        tbl("cw-st", 1140, 190, [(200, True), (260, True)], ["vnd", "ngoai_te"], [["75", "10"]], 64, 27),
        chip("cw-k1", 80, 470, "ELSE 0: không khớp thì SUM vẫn ra 0", "green"),
        chip("cw-k2", 80, 560, "Các nhánh THEN phải cùng kiểu", "red"),
        chip("cw-k3", 80, 650, "CASE đơn giản chỉ so sánh =, không bắt được NULL", "amber"),
    ]), beats=[
        ("Phần một. Case When rẽ nhánh ngay trong câu Select, giống if else trong lập trình.",
         "Phần 1: CASE WHEN rẽ nhánh ngay trong SELECT, giống if / else.", title_beat("cw")),
        ("Mỗi nhánh là một điều kiện và một nhãn: Dư nợ, Thấp, Trung bình, còn lại là Cao.",
         "Mỗi nhánh một điều kiện và một nhãn.",
         type_q("cw-q", 8, 0.3, 0.7)),
        ("SQL thử từ trên xuống và dừng ở nhánh đúng đầu tiên. Số dư âm bốn mươi mốt triệu đúng ngay nhánh một, nên ra Dư nợ.",
         "Thử từ trên xuống, dừng ở nhánh đúng đầu tiên: -41666000 ra Dư nợ.",
         [IN("#cw-row", "left", 0.3), *show_tbl("cw-t", 4, 1.0, 0.5), DIM("#cw-t-2, #cw-t-3, #cw-t-4", 3.2, 0.3), IN("#cw-res", "left", 4.0)]),
        ("Bẫy kinh điển: đặt nhánh dưới một trăm triệu lên đầu. Khoản nợ cũng nhỏ hơn một trăm triệu, nên bị gắn Trung bình. Nhánh hẹp phải đứng trước.",
         "Đảo thứ tự: nhánh < 100000000 đứng đầu thì khoản nợ thành Trung bình.",
         [OUT(sel_q("cw-q", 8) + ", #cw-row, " + sel_tbl("cw-t", 4) + ", #cw-res", "fade", 0, 0.4), *type_q("cw-q2", 6, 0.6, 0.5),
          *show_tbl("cw-u", 4, 3.2, 0.4), DIM("#cw-u-2, #cw-u-3, #cw-u-4", 5.0, 0.3), IN("#cw-bad", "left", 5.4), SHAKE("#cw-bad", 6.0), IN("#cw-fix", "left", 7.0)]),
        ("Dùng Case làm khoá gom nhóm, bảy mươi lăm tài khoản đồng chia thành bốn hạng: năm, mười bốn, hai mươi bốn và ba mươi hai.",
         "GROUP BY hang: Thấp 5, Dư nợ 14, Trung bình 24, Cao 32.",
         [OUT(sel_q("cw-q2", 6) + ", " + sel_tbl("cw-u", 4) + ", #cw-bad, #cw-fix", "fade", 0, 0.4), *type_q("cw-g", 5, 0.6, 0.6), *show_tbl("cw-gt", 4, 4.0, 0.7)]),
        ("Mẹo đếm có điều kiện: Sum bọc Case, một dòng cho bảy mươi lăm tài khoản đồng và mười ngoại tệ. Nhớ Else bằng số không, và các nhánh Then phải cùng kiểu.",
         "SUM(CASE ...): 75 VND và 10 ngoại tệ. ELSE 0, THEN cùng kiểu.",
         [OUT(sel_q("cw-g", 5) + ", " + sel_tbl("cw-gt", 4), "fade", 0, 0.4), *type_q("cw-s", 4, 0.6, 0.6), *show_tbl("cw-st", 1, 3.6, 0.5),
          IN("#cw-k1", "left", 5.4), IN("#cw-k2", "left", 7.0), IN("#cw-k3", "left", 8.4)]),
    ]),
    # ------------------------------------------------------------ coalesce / nullif
    dict(id="coalesce-nullif", world=(1920, 1080), hud=hud("cn", "COALESCE và NULLIF", "Thay NULL, và chặn chia cho 0"), cam="".join([
        big_title("cn", "COALESCE · NULLIF", "Làm việc với NULL"),
        sqlbox("cn-q", 100, 190, 1100, ["SELECT customer_id, mobile, email,", "       COALESCE(mobile, email, 'không có') AS lien_he", "FROM customer",
                                        "WHERE customer_id IN (100001, 100005, 100021);"], 25),
        tbl("cn-t", 100, 470, [(210, True), (250, True), (410, True), (400, True)], ["customer_id", "mobile", "email", "lien_he"],
            [["100001", "0994373346", "NULL", "0994373346"], ["100005", "NULL", "ngo.ngoc.anh@mail.vn", "ngo.ngoc.anh@mail.vn"], ["100021", "NULL", "NULL", "không có"]], 66, 26),
        chip("cn-ty", 100, 770, "Các giá trị phải cùng kiểu", "amber"),
        sqlbox("cn-q2", 100, 190, 1100, ["SELECT AVG(close_date - open_date) AS dung,", "       AVG(COALESCE(close_date - open_date, 0)) AS sai", "FROM account;"], 25),
        tbl("cn-t2", 100, 420, [(480, True), (440, True)], ["dung", "sai"], [["1749.0000000000000000", "41.1529411764705882"]], 66, 27),
        chip("cn-n1", 100, 580, "2 tài khoản đã đóng: trung bình 1749 ngày", "green"),
        chip("cn-n2", 100, 670, "83 tài khoản đang mở bị tính thành 0 ngày", "red"),
        chip("cn-n3", 100, 760, "NULL là chưa biết, không phải 0", "amber"),
        sqlbox("cn-q3", 100, 190, 900, ["SELECT 10 / 0;"], 28),
        errbox("cn-e", 100, 330, 900, "ERROR: division by zero"),
        sqlbox("cn-q4", 100, 470, 900, ["SELECT 10 / NULLIF(0, 0) AS x;"], 28),
        tbl("cn-t3", 1100, 470, [(260, True)], ["x"], [["NULL"]], 66, 27),
        chip("cn-n4", 100, 620, "NULLIF(a, b): NULL nếu a bằng b", "violet"),
    ]), beats=[
        ("Phần hai. Hàm Coalesce thay NULL, còn hàm Null If làm ngược lại.",
         "Phần 2: COALESCE thay NULL, NULLIF làm ngược lại.", title_beat("cn")),
        ("Coalesce trả về giá trị đầu tiên không NULL. Thử số điện thoại, rồi email, rồi mới tới chữ không có.",
         "COALESCE trả về giá trị đầu tiên không NULL.", type_q("cn-q", 4, 0.3, 1.1)),
        ("Có khách không có số nên ra email, có khách không có cả hai nên ra chữ không có. Mọi giá trị phải cùng kiểu.",
         "Không có số thì ra email, không có cả hai thì ra chữ mặc định. Các giá trị phải cùng kiểu.",
         [*show_tbl("cn-t", 3, 0.3, 1.0), IN("#cn-ty", "left", 5.0)]),
        ("Đừng vá NULL bừa bãi. Hai tài khoản đã đóng sống trung bình một nghìn bảy trăm bốn mươi chín ngày. Đổi NULL thành số không thì trung bình tụt còn bốn mươi mốt.",
         "Đổi NULL thành 0 làm trung bình tụt từ 1749 xuống 41.",
         [OUT(sel_q("cn-q", 4) + ", " + sel_tbl("cn-t", 3) + ", #cn-ty", "fade", 0, 0.4), *type_q("cn-q2", 3, 0.6, 0.8), *show_tbl("cn-t2", 1, 3.2, 0.5),
          IN("#cn-n1", "left", 4.6), IN("#cn-n2", "left", 6.2), IN("#cn-n3", "left", 8.6)]),
        ("Null If chống chia cho không. Mười chia không làm sập cả câu truy vấn, còn mười chia Null If không thì ra NULL.",
         "10 / 0 báo lỗi, 10 / NULLIF(0, 0) ra NULL.",
         [OUT(sel_q("cn-q2", 3) + ", " + sel_tbl("cn-t2", 1) + ", #cn-n1, #cn-n2, #cn-n3", "fade", 0, 0.4), *type_q("cn-q3", 1, 0.6, 0.3), IN("#cn-e", "up", 1.6), SHAKE("#cn-e", 2.2),
          *type_q("cn-q4", 1, 3.6, 0.3), *show_tbl("cn-t3", 1, 5.0, 0.4), IN("#cn-n4", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ cast
    dict(id="cast-type", world=(1920, 1080), hud=hud("ct", "CAST và ::", "Đổi kiểu dữ liệu"), cam="".join([
        big_title("ct", "CAST và ::", "Đổi kiểu dữ liệu"),
        chip("ct-c1", 160, 260, "CAST('2024-12-31' AS date)", "cyan"),
        chip("ct-c2", 160, 370, "'2024-12-31'::date", "cyan"),
        chip("ct-eq", 160, 480, "Hai cách tương đương", "green"),
        chip("ct-ty", 160, 590, "::int  ::bigint  ::numeric  ::text  ::date", "violet"),
        sqlbox("ct-q", 120, 190, 900, ["SELECT 7 / 2 AS cat_le,", "       7::numeric / 2 AS dung;"], 28),
        tbl("ct-t", 1100, 190, [(240, True), (440, True)], ["cat_le", "dung"], [["3", "3.5000000000000000"]], 66, 27),
        chip("ct-n1", 120, 420, "Số nguyên chia số nguyên: cắt phần lẻ", "red"),
        sqlbox("ct-q2", 120, 190, 1100, ["SELECT ROUND(100 * CAST(SUM(CASE WHEN status = 'DONE'", "                   THEN 1 ELSE 0 END) AS numeric)",
                                         "       / COUNT(*), 1) AS ty_le_done", "FROM funds_transfer;"], 25),
        tbl("ct-t2", 1300, 190, [(300, True)], ["ty_le_done"], [["93.2"]], 66, 27),
        chip("ct-n2", 120, 450, "123 DONE trên 132 lệnh", "cyan"),
        chip("ct-n3", 120, 540, "Giữ số nguyên thì ra 93, bị cắt", "red"),
        sqlbox("ct-q3", 120, 200, 900, ["SELECT '12abc'::int;"], 27),
        errbox("ct-e1", 120, 330, 1500, 'ERROR: invalid input syntax for type integer: "12abc"'),
        sqlbox("ct-q4", 120, 450, 900, ["SELECT CAST('2024-02-30' AS date);"], 27),
        errbox("ct-e2", 120, 580, 1500, 'ERROR: date/time field value out of range: "2024-02-30"'),
        chip("ct-n4", 120, 760, "Số dư hơn 3 tỷ: ::int báo integer out of range, dùng ::bigint", "amber"),
    ]), beats=[
        ("Phần ba. Cast đổi kiểu dữ liệu của một giá trị, để phép tính và phép ghép chạy đúng.", "Phần 3: CAST đổi kiểu dữ liệu của một giá trị.", title_beat("ct")),
        ("Có hai cách viết, Cast As theo chuẩn SQL, và hai dấu hai chấm của PostgreSQL. Hai cách giống hệt nhau.",
         "CAST(... AS date) và ...::date là một.",
         [IN("#ct-c1", "left", 0.3), IN("#ct-c2", "left", 2.6), IN("#ct-eq", "left", 4.4), IN("#ct-ty", "left", 5.6)]),
        ("Bẫy phổ biến nhất là chia số nguyên. Bảy chia hai ra ba, vì phần lẻ bị cắt. Đổi một vế sang numeric mới ra ba phẩy năm.",
         "7 / 2 ra 3. 7::numeric / 2 ra 3.5.",
         [OUT("#ct-c1, #ct-c2, #ct-eq, #ct-ty", "fade", 0, 0.4), *type_q("ct-q", 2, 0.6, 1.0), *show_tbl("ct-t", 1, 3.2, 0.5), IN("#ct-n1", "left", 5.0)]),
        ("Tỷ lệ lệnh chuyển khoản thành công cũng vậy: một trăm hai mươi ba trên một trăm ba mươi hai. Để số nguyên thì ra chín mươi ba, đổi sang numeric mới ra chín mươi ba phẩy hai.",
         "123 trên 132 lệnh: số nguyên ra 93, numeric ra 93.2.",
         [OUT(sel_q("ct-q", 2) + ", " + sel_tbl("ct-t", 1) + ", #ct-n1", "fade", 0, 0.4), *type_q("ct-q2", 4, 0.6, 0.8), *show_tbl("ct-t2", 1, 4.2, 0.5),
          IN("#ct-n2", "left", 5.6), IN("#ct-n3", "left", 7.4)]),
        ("Đổi kiểu cũng có thể báo lỗi: chữ không phải số, ngày ba mươi tháng hai, hoặc số dư hơn ba tỷ không vừa kiểu int. Khi đó hãy dùng bigint.",
         "Đổi kiểu sai thì báo lỗi. Số quá lớn cho int thì dùng bigint.",
         [OUT(sel_q("ct-q2", 4) + ", " + sel_tbl("ct-t2", 1) + ", #ct-n2, #ct-n3", "fade", 0, 0.4), *type_q("ct-q3", 1, 0.6, 0.3), IN("#ct-e1", "up", 1.4), SHAKE("#ct-e1", 2.0),
          *type_q("ct-q4", 1, 3.2, 0.3), IN("#ct-e2", "up", 4.2), SHAKE("#ct-e2", 4.8), IN("#ct-n4", "left", 7.0)]),
    ]),
    # ------------------------------------------------------------ string functions
    dict(id="string-functions", world=(1920, 1080), hud=hud("sf", "Hàm chuỗi", "Cắt, ghép và che chữ"), cam="".join([
        big_title("sf", "Hàm chuỗi", "Cắt, ghép và che chữ"),
        sqlbox("sf-q", 120, 190, 1100, ["SELECT UPPER(full_name) AS ten_hoa,", "       LENGTH(mobile) AS do_dai", "FROM customer WHERE customer_id = 100001;"], 26),
        tbl("sf-t", 120, 400, [(420, True), (240, True)], ["ten_hoa", "do_dai"], [["LÝ HOÀNG LONG", "10"]], 66, 27),
        chip("sf-n1", 120, 560, "Chữ có dấu vẫn đổi đúng", "green"),
        sqlbox("sf-q2", 120, 190, 1100, ["SELECT 'a' || NULL || 'b' AS ghep,", "       CONCAT('a', NULL, 'b') AS concat;"], 28),
        tbl("sf-t2", 120, 400, [(260, True), (260, True)], ["ghep", "concat"], [["NULL", "ab"]], 66, 28),
        chip("sf-n2", 120, 560, "|| gặp NULL thì cả chuỗi thành NULL", "red"),
        chip("sf-n3", 120, 650, "CONCAT bỏ qua NULL", "green"),
        el("sf-s", 120, 200, 1300, None, "0994373346", "h1 center r", "font-family:var(--mono);letter-spacing:0"),
        tbl("sf-t3", 120, 400, [(760, True), (260, True)], ["biểu thức", "kết quả"],
            [["SUBSTRING(mobile FROM 1 FOR 3)", "099"], ["SUBSTRING(mobile FROM 8)", "346"]], 66, 27),
        chip("sf-n4", 120, 620, "Vị trí đếm từ 1, không phải từ 0", "amber"),
        sqlbox("sf-q4", 120, 190, 1300, ["SELECT customer_id, mobile,", "       SUBSTRING(mobile FROM 1 FOR 3) || '****' ||", "       SUBSTRING(mobile FROM 8) AS che",
                                         "FROM customer WHERE customer_id IN (100001, 100005);"], 25),
        tbl("sf-t4", 120, 470, [(210, True), (260, True), (260, True)], ["customer_id", "mobile", "che"],
            [["100001", "0994373346", "099****346"], ["100005", "NULL", "NULL"]], 66, 27),
        chip("sf-n5", 120, 680, "Bọc COALESCE bên ngoài để hiện chưa có", "violet"),
    ]), beats=[
        ("Phần bốn. Hàm chuỗi giúp ta cắt, ghép và che chữ, ví dụ che số điện thoại của khách trong báo cáo.", "Phần 4: hàm chuỗi giúp cắt, ghép và che chữ.", title_beat("sf")),
        ("Upper đổi chữ hoa, kể cả chữ có dấu. Length đếm ký tự: số điện thoại luôn dài mười ký tự.",
         "UPPER đổi chữ hoa, LENGTH đếm ký tự.",
         [*type_q("sf-q", 3, 0.3, 1.0), *show_tbl("sf-t", 1, 3.8, 0.5), IN("#sf-n1", "left", 5.0)]),
        ("Ghép chuỗi bằng hai gạch đứng. Bẫy: một mảnh NULL làm cả chuỗi thành NULL, còn Concat thì bỏ qua NULL.",
         "|| gặp NULL ra NULL. CONCAT bỏ qua NULL.",
         [OUT(sel_q("sf-q", 3) + ", " + sel_tbl("sf-t", 1) + ", #sf-n1", "fade", 0, 0.4), *type_q("sf-q2", 2, 0.6, 1.0), *show_tbl("sf-t2", 1, 3.0, 0.5),
          IN("#sf-n2", "left", 4.4), IN("#sf-n3", "left", 6.4)]),
        ("Substring cắt một đoạn, vị trí đếm từ một chứ không phải từ không. Ba ký tự đầu ra không chín chín, từ ký tự thứ tám ra ba bốn sáu.",
         "SUBSTRING cắt đoạn, vị trí đếm từ 1: 099 và 346.",
         [OUT(sel_q("sf-q2", 2) + ", " + sel_tbl("sf-t2", 1) + ", #sf-n2, #sf-n3", "fade", 0, 0.4), IN("#sf-s", "blur", 0.5), *show_tbl("sf-t3", 2, 2.0, 1.6), IN("#sf-n4", "left", 6.4)]),
        ("Ghép ba mảnh là ra số điện thoại đã che, chỉ hiện ba số đầu và ba số cuối. Khách không có số thì cả chuỗi thành NULL, bọc Coalesce để hiện chữ chưa có.",
         "Che số điện thoại: 099****346. NULL thì cả chuỗi NULL, bọc COALESCE.",
         [OUT("#sf-s, " + sel_tbl("sf-t3", 2) + ", #sf-n4", "fade", 0, 0.4), *type_q("sf-q4", 4, 0.6, 1.0), *show_tbl("sf-t4", 2, 5.0, 0.8), IN("#sf-n5", "left", 7.4)]),
    ]),
    # ------------------------------------------------------------ date functions
    dict(id="date-functions", world=(1920, 1080), hud=hud("dfn", "Hàm ngày tháng", "Dùng ngày cố định, không dùng hôm nay"), cam="".join([
        big_title("dfn", "Hàm ngày tháng", "Một ngày cố định cho kết quả ổn định"),
        chip("dfn-fix", 160, 260, "DATE '2024-12-31' thay cho CURRENT_DATE", "cyan"),
        chip("dfn-why", 160, 360, "Kết quả không đổi theo ngày chạy", "green"),
        tbl("dfn-e", 160, 190, [(780, True), (240, True)], ["biểu thức", "kết quả"],
            [["EXTRACT(YEAR FROM DATE '2024-12-31')", "2024"], ["EXTRACT(MONTH FROM DATE '2024-12-31')", "12"], ["EXTRACT(DAY FROM DATE '2024-12-31')", "31"],
             ["EXTRACT(QUARTER FROM DATE '2024-12-31')", "4"], ["EXTRACT(DOW FROM DATE '2024-12-31')", "2"]], 66, 26),
        chip("dfn-dow", 160, 600, "DOW: 0 là Chủ nhật, 2 là thứ Ba", "amber"),
        sqlbox("dfn-q", 120, 190, 1300, ["SELECT DATE_TRUNC('month', booking_date)::date AS thang,", "       COUNT(*) AS so_but_toan", "FROM stmt_entry",
                                         "GROUP BY 1 ORDER BY 2 DESC LIMIT 2;"], 25),
        tbl("dfn-t", 120, 440, [(300, True), (320, True)], ["thang", "so_but_toan"], [["2024-01-01", "128"], ["2024-03-01", "83"]], 66, 27),
        chip("dfn-n1", 120, 640, "Cắt ngày về đầu tháng để gom theo tháng", "violet"),
        tbl("dfn-m", 120, 190, [(300, True), (220, True)], ["MM/YYYY", "so_but_toan"], [["05/2024", "79"], ["06/2023", "4"], ["06/2024", "80"]], 66, 27, "#f87171"),
        tbl("dfn-y", 1000, 190, [(300, True), (220, True)], ["YYYY-MM", "so_but_toan"], [["2023-06", "4"], ["2023-07", "2"], ["2023-11", "4"]], 66, 27, "#4ade80"),
        chip("dfn-n2", 120, 520, "Xếp theo chuỗi: 06/2023 đứng sau 05/2024", "red"),
        chip("dfn-n3", 1000, 520, "Để năm đứng trước thì đúng thứ tự", "green"),
        tbl("dfn-a", 120, 190, [(950, True), (300, True)], ["biểu thức", "kết quả"],
            [["DATE '2024-12-31' - DATE '2024-12-01'", "30"], ["DATE '2024-12-31' + 30", "2025-01-30"],
             ["(DATE '2024-01-31' + INTERVAL '1 month')::date", "2024-02-29"], ["lệnh trong 30 ngày cuối năm (8 DONE)", "17"]], 66, 25),
        chip("dfn-n4", 120, 560, "Ngày trừ ngày ra số ngày", "cyan"),
        chip("dfn-n5", 120, 650, "Tháng và năm: dùng INTERVAL, tự lùi về ngày hợp lệ", "violet"),
    ]), beats=[
        ("Phần năm. Hàm ngày tháng. Ta dùng một ngày cố định thay vì ngày hôm nay, để kết quả không đổi theo ngày chạy.",
         "Phần 5: dùng ngày cố định DATE '2024-12-31', không dùng ngày hôm nay.",
         [*title_beat("dfn"), IN("#dfn-fix", "left", 5.0), IN("#dfn-why", "left", 6.4)]),
        ("Extract lấy một phần của ngày: năm, tháng, ngày, quý, và thứ trong tuần. Thứ được đánh số, không là Chủ nhật.",
         "EXTRACT: năm, tháng, ngày, quý, thứ trong tuần.",
         [OUT("#dfn-fix, #dfn-why", "fade", 0, 0.4), *show_tbl("dfn-e", 5, 0.4, 0.8), IN("#dfn-dow", "left", 5.2)]),
        ("Date Trunc cắt ngày về đầu tháng, cách chuẩn để gom theo tháng. Tháng một năm hai nghìn không trăm hai mươi bốn có nhiều bút toán nhất, một trăm hai mươi tám.",
         "DATE_TRUNC('month', ...) để gom theo tháng: 2024-01 nhiều nhất, 128 bút toán.",
         [OUT(sel_tbl("dfn-e", 5) + ", #dfn-dow", "fade", 0, 0.4), *type_q("dfn-q", 4, 0.6, 0.9), *show_tbl("dfn-t", 2, 4.6, 0.7), IN("#dfn-n1", "left", 6.6)]),
        ("To Char đổi ngày thành chuỗi, và bẫy là sắp xếp theo chuỗi. Mẫu tháng đứng trước năm xếp sai: tháng sáu năm hai ba lại đứng sau tháng năm năm hai bốn. Hãy để năm đứng trước.",
         "TO_CHAR 'MM/YYYY' xếp sai thứ tự thời gian. 'YYYY-MM' thì đúng.",
         [OUT(sel_q("dfn-q", 4) + ", " + sel_tbl("dfn-t", 2) + ", #dfn-n1", "fade", 0, 0.4), *show_tbl("dfn-m", 3, 0.6, 0.6), IN("#dfn-n2", "left", 3.2),
          *show_tbl("dfn-y", 3, 6.0, 0.6), IN("#dfn-n3", "left", 8.6)]),
        ("Ngày trừ ngày ra số ngày. Ngày cộng số nguyên ra ngày mới. Còn tháng và năm thì dùng Interval, và PostgreSQL tự lùi về ngày hợp lệ, như cuối tháng hai.",
         "Ngày - ngày ra số ngày. Tháng, năm dùng INTERVAL.",
         [OUT(sel_tbl("dfn-m", 3) + ", " + sel_tbl("dfn-y", 3) + ", #dfn-n2, #dfn-n3", "fade", 0, 0.4), *show_tbl("dfn-a", 4, 0.6, 1.2), IN("#dfn-n4", "left", 5.8), IN("#dfn-n5", "left", 8.2)]),
    ]),
    # ------------------------------------------------------------ age and report
    dict(id="age-and-report", world=(1920, 1080), hud=hud("ar", "AGE và báo cáo", "Tính tuổi, rồi ghép mọi hàm"), cam="".join([
        big_title("ar", "AGE và báo cáo", "Tính tuổi, rồi ghép mọi hàm"),
        sqlbox("ar-q", 100, 190, 1300, ["SELECT AGE(DATE '2024-12-31', birth_date) AS khoang,",
                                        "       EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date))::int AS tuoi",
                                        "FROM customer WHERE customer_id = 100001;"], 25),
        tbl("ar-t", 100, 410, [(560, True), (200, True)], ["khoang", "tuoi"], [["53 years 8 mons 25 days", "53"]], 66, 27),
        chip("ar-n1", 100, 540, "Sinh 1971-04-06, tính tới 2024-12-31", "cyan"),
        sqlbox("ar-q2", 100, 190, 1300, ["SELECT 2024 - EXTRACT(YEAR FROM birth_date) AS tinh_tat,",
                                         "       EXTRACT(YEAR FROM AGE(DATE '2024-06-30', birth_date))::int AS age",
                                         "FROM customer WHERE customer_id = 100002;"], 25),
        tbl("ar-t2", 100, 410, [(320, True), (200, True)], ["tinh_tat", "age"], [["36", "35"]], 66, 27, "#f87171"),
        chip("ar-n2", 100, 540, "Cách tắt bỏ qua sinh nhật: 36 là sai", "red"),
        chip("ar-n3", 100, 630, "AGE chính xác: sinh 1988-08-28, chưa tới sinh nhật", "green"),
        tbl("ar-g", 100, 190, [(380, False), (260, True)], ["nhom", "so_khach"],
            [["Dưới 30", "6"], ["Doanh nghiệp", "8"], ["50 trở lên", "11"], ["30 đến 49", "15"]], 64, 27),
        chip("ar-n4", 100, 540, "Khách doanh nghiệp không có birth_date: tuổi là NULL", "amber"),
        chip("ar-n5", 100, 630, "Nhánh IS NULL đứng đầu CASE", "violet"),
        tbl("ar-r", 100, 190, [(210, True), (300, False), (260, True), (260, False)], ["customer_id", "ten", "sdt", "nhom"],
            [["100001", "LÝ HOÀNG LONG", "099****346", "50 trở lên"], ["100002", "DƯƠNG VĂN AN", "099****102", "30 đến 49"],
             ["100005", "NGÔ NGỌC ANH", "chưa có", "30 đến 49"], ["100021", "BÙI THANH VÂN", "chưa có", "30 đến 49"]], 66, 26),
        chip("ar-f1", 100, 560, "UPPER · SUBSTRING · COALESCE · AGE · CASE", "cyan"),
        chip("ar-f2", 100, 650, "Chỉ đổi cách hiển thị, bảng gốc không đổi", "green"),
    ]), beats=[
        ("Phần sáu. Ta tính tuổi khách hàng bằng hàm Age, rồi ghép mọi hàm của bài này vào một báo cáo.",
         "Phần 6: AGE tính tuổi, rồi ghép mọi hàm thành báo cáo.", title_beat("ar")),
        ("Age trả về khoảng thời gian giữa hai ngày: năm mươi ba năm tám tháng hai mươi lăm ngày. Lấy phần năm ra tuổi năm mươi ba.",
         "AGE ra khoảng thời gian. Lấy phần năm ra tuổi 53.",
         [*type_q("ar-q", 3, 0.3, 1.0), *show_tbl("ar-t", 1, 4.2, 0.5), IN("#ar-n1", "left", 6.0)]),
        ("Đừng tính tắt bằng hai nghìn không trăm hai mươi bốn trừ năm sinh. Nó bỏ qua sinh nhật: cuối tháng sáu khách mới ba mươi lăm tuổi, cách tắt lại ra ba mươi sáu.",
         "2024 - năm sinh ra 36, AGE ra 35 vì chưa tới sinh nhật.",
         [OUT(sel_q("ar-q", 3) + ", " + sel_tbl("ar-t", 1) + ", #ar-n1", "fade", 0, 0.4), *type_q("ar-q2", 3, 0.6, 1.0), *show_tbl("ar-t2", 1, 4.0, 0.5),
          IN("#ar-n2", "left", 5.6), SHAKE("#ar-n2", 6.2), IN("#ar-n3", "left", 7.6)]),
        ("Ghép với Case để chia nhóm tuổi. Khách doanh nghiệp không có ngày sinh, nên nhánh Is Null phải đứng đầu.",
         "Nhóm tuổi: 6, 8 doanh nghiệp, 11, 15. IS NULL đứng đầu CASE.",
         [OUT(sel_q("ar-q2", 3) + ", " + sel_tbl("ar-t2", 1) + ", #ar-n2, #ar-n3", "fade", 0, 0.4), *show_tbl("ar-g", 4, 0.6, 0.6), IN("#ar-n4", "left", 4.0), IN("#ar-n5", "left", 5.8)]),
        ("Cuối cùng, ta ghép chữ hoa, che số điện thoại, giá trị mặc định, tuổi và nhóm tuổi thành một báo cáo. Mọi biểu thức chỉ đổi cách hiển thị, bảng gốc không đổi.",
         "Ghép UPPER, che số, COALESCE, AGE, CASE. Bảng gốc không đổi.",
         [OUT(sel_tbl("ar-g", 4) + ", #ar-n4, #ar-n5", "fade", 0, 0.4), *show_tbl("ar-r", 4, 0.6, 0.7), IN("#ar-f1", "left", 4.4), IN("#ar-f2", "left", 7.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "CASE WHEN", "nhánh hẹp đứng trước nhánh rộng"),
                                                ("lock", "COALESCE · NULLIF", "NULL là chưa biết, không phải 0"),
                                                ("share", "CAST", "số nguyên chia số nguyên bị cắt lẻ"),
                                                ("quote", "Chuỗi và ngày", "CONCAT bỏ NULL, AGE tính tuổi")]),
        chip("ou-next", 560, 650, "Bài tiếp: Subquery, EXISTS và CTE", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: Case rẽ nhánh từ trên xuống, nhánh hẹp đứng trước. Coalesce và Null If xử lý NULL, nhớ rằng NULL không phải số không. Cast đổi kiểu, nên cẩn thận chia số nguyên. Cuối cùng, hàm chuỗi và ngày tháng biến dữ liệu thô thành báo cáo.",
         "CASE từ trên xuống · COALESCE, NULLIF · CAST · hàm chuỗi và ngày tháng.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.0), IN("#ou-c2", "pop", 10.0), IN("#ou-c3", "pop", 14.0)]),
        ("Bài sau, ta học truy vấn con.", "Bài tiếp: Subquery, EXISTS và CTE.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
