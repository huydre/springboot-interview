"""SQL set operations explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-set.ts. Every query and number on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
funds_transfer 132 rows; debit_account UNION ALL credit_account 264 rows, UNION 49 rows; status DONE 246 vs 49;
first 10 transfers FT240000001..10: A (debit) 7,14,3,55,41,22,1,30,25,45 and B (credit) 37,31,16,64,4,4,32,16,45,9 (account 10000000xx),
UNION ALL 20, UNION 17, INTERSECT 1 (1000000045), EXCEPT 9; customer city UNION company city: 5 rows (40 + 5 = 45 with UNION ALL);
errors: "each UNION query must have the same number of columns", "UNION types integer and character varying cannot be matched",
"each INTERSECT query must have the same number of columns", ORDER BY ma_nv -> column "ma_nv" does not exist;
nhom CURRENT 50, SAVINGS 20, LOAN 15; SAVINGS INTERSECT loan 7 customers 100011, 100017, 100024, 100025, 100035, 100036, 100039;
debit INTERSECT credit 43; credit EXCEPT debit 5 (1000000015, 20, 21, 37, 63), debit EXCEPT credit 1; CURRENT EXCEPT loan 25 customers;
CURRENT INTERSECT loan 15, JOIN 18 rows; anti-join 32 rows (25 with DISTINCT).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<c>--[^\n]*|/\*.*?\*/)|(?P<s>'[^']*'|\"[^\"]*\")|(?P<k>\b(?:SELECT|DISTINCT|FROM|WHERE|AS|ORDER BY|UNION ALL|UNION|INTERSECT|EXCEPT|ALL|JOIN|LEFT|ON|IS NULL|AND|COUNT|LIMIT|DESC)\b)|(?P<n>\b\d+(?:\.\d+)?\b)|(?P<x>.)", re.S)
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


def sel(prefix, n):
    return ", ".join(f"#{prefix}-{i}" for i in range(1, n + 1))


def tsel(prefix, n):
    return "#" + prefix + "-h, " + sel(prefix, n)


def nbox(id_, x, y, w, h, text, tone="cyan"):
    return box(id_, x, y, w, h, f'<div style="padding:24px 30px;font-size:32px;line-height:1.4">{text}</div>', tone)


# Two lists of account ids (debit side A, credit side B of the first 10 transfers) and the result of each set operation.
LIST_A = [7, 14, 3, 55, 41, 22, 1, 30, 25, 45]
LIST_B = [37, 31, 16, 64, 4, 4, 32, 16, 45, 9]
OPS = {
    "all": ("UNION ALL", "20 dòng", sorted(LIST_A) + sorted(LIST_B), "amber"),
    "union": ("UNION", "17 dòng", sorted(set(LIST_A) | set(LIST_B)), "cyan"),
    "inter": ("INTERSECT", "1 dòng", sorted(set(LIST_A) & set(LIST_B)), "green"),
    "exc": ("EXCEPT", "9 dòng", sorted(set(LIST_A) - set(LIST_B)), "violet"),
}
TONE_HEX = dict(amber="#f5b94a", cyan="#2ec5e8", green="#4ade80", violet="#a78bfa")


def cell(id_, x, y, v, tone=None, w=170):
    border = TONE_HEX[tone] if tone else "rgba(255,255,255,.28)"
    bg = "rgba(255,255,255,.07)"
    return el(id_, x, y, w, 46, f"{1000000000 + v}", "r",
              f"display:flex;align-items:center;justify-content:center;font:500 24px var(--mono);color:#e6e9f0;"
              f"border-radius:10px;background:{bg};border:2px solid {border}")


def venn(p, ops):
    """Two input lists (ids <p>a-1..10, <p>b-1..10 with headers <p>ah, <p>bh) and one output grid per op key (<p>o-<key>-1..n)."""
    out = [el(f"{p}ah", 130, 180, 170, None, "A: ghi nợ", "r", "text-align:center;font:700 26px var(--font);color:#fff"),
           el(f"{p}bh", 320, 180, 170, None, "B: ghi có", "r", "text-align:center;font:700 26px var(--font);color:#fff")]
    for i, v in enumerate(LIST_A, 1):
        out.append(cell(f"{p}a-{i}", 130, 230 + (i - 1) * 56, v))
    for i, v in enumerate(LIST_B, 1):
        out.append(cell(f"{p}b-{i}", 320, 230 + (i - 1) * 56, v))
    for k in ops:
        name, count, vals, tone = OPS[k]
        both = [v for v in vals if vals.count(v) > 1 or (k == "all" and v in LIST_A and v in LIST_B)]
        out.append(chip(f"{p}op-{k}", 580, 440, name, tone))
        out.append(chip(f"{p}n-{k}", 1000, 180, f"{name}: {count}", tone))
        for i, v in enumerate(vals, 1):
            out.append(cell(f"{p}o-{k}-{i}", 1000 + ((i - 1) % 5) * 180, 250 + ((i - 1) // 5) * 60, v,
                            "amber" if (k == "all" and v in both) else None))
    return "".join(out)


def vsel(p, key=None):
    if key is None:
        parts = [f"#{p}ah", f"#{p}bh", sel(f"{p}a", 10), sel(f"{p}b", 10)]
    else:
        parts = [f"#{p}op-{key}", f"#{p}n-{key}", sel(f"{p}o-{key}", len(OPS[key][2]))]
    return ", ".join(parts)


def lists_in(p, d=0.3):
    return [IN(f"#{p}ah, #{p}bh", "fade", d, 0.4), IN(sel(f"{p}a", 10), "left", d + 0.2, 0.4, 0.12), IN(sel(f"{p}b", 10), "left", d + 0.5, 0.4, 0.12)]


def result_in(p, key, d=0.3):
    return [IN(f"#{p}op-{key}", "pop", d), IN(f"#{p}n-{key}", "left", d + 0.4), IN(sel(f"{p}o-{key}", len(OPS[key][2])), "pop", d + 0.8, 0.3, 0.1)]

def title_beat(p, text, cap):
    return (text, cap, [TYPE(f"#{p}-big", 0.1, 0.06), IN(f"#{p}-bsub", "blur", 0.9), OUT(f"#{p}-big, #{p}-bsub", "zoom", 1.9), IN(f"#{p}-hud", "left", 2.3)])


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Phép toán tập hợp", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Hai danh sách khách, ai nằm ở cả hai?"), "h1 center r"),
        nbox("hk-a", 330, 430, 560, 190, "<b>A</b>: khách có<br>tài khoản tiết kiệm", "cyan"),
        nbox("hk-b", 1030, 430, 560, 190, "<b>B</b>: khách có<br>khoản vay", "amber"),
        chip("hk-n1", 330, 720, "UNION: nối hai danh sách", "cyan"),
        chip("hk-n2", 790, 720, "INTERSECT: phần chung", "green"),
        chip("hk-n3", 1250, 720, "EXCEPT: chỉ có ở một bên", "violet"),
        tile("hk-tile", 330, 350, 220, "grid"),
        el("hk-word", 600, 380, 1300, None, letters("Phép toán tập hợp"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "UNION ALL · UNION · INTERSECT · EXCEPT · so với JOIN", "kin-sub r"),
    ]), beats=[
        ("Bạn có hai danh sách khách. Một danh sách có tài khoản tiết kiệm, một danh sách có khoản vay. Làm sao biết ai nằm ở cả hai?",
         "Hai danh sách khách: ai nằm ở cả hai?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-a", "left", 3.2, 0.5), IN("#hk-b", "right", 5.4, 0.5)]),
        ("Có ba công cụ. UNION nối hai danh sách thành một. INTERSECT lấy phần chung. Còn EXCEPT lấy phần chỉ có ở một bên.",
         "UNION nối, INTERSECT lấy phần chung, EXCEPT lấy phần chỉ có ở một bên.",
         [IN("#hk-n1", "left", 0.5), IN("#hk-n2", "left", 3.5), IN("#hk-n3", "left", 6.0)]),
        ("Hôm nay ta học ba phép toán tập hợp này, và so sánh chúng với JOIN.",
         "Hôm nay: UNION, INTERSECT, EXCEPT và so với JOIN.",
         [OUT("#hk-eye, #hk-q, #hk-a, #hk-b, #hk-n1, #hk-n2, #hk-n3", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ union-basics
    dict(id="union-basics", world=(1920, 1080), hud=hud("ub", "UNION ALL và UNION", "Xếp chồng hai danh sách"), cam="".join([
        big_title("ub", "UNION ALL và UNION", "Nối hai danh sách theo chiều dọc"),
        venn("ub", ["all", "union"]),
        sqlbox("ub-q", 160, 190, 820, ["SELECT debit_account FROM funds_transfer", "UNION ALL", "SELECT credit_account FROM funds_transfer;"]),
        nbox("ub-r0", 1080, 190, 740, 150, "Bảng <b>funds_transfer</b>: 132 lệnh chuyển khoản", "cyan"),
        nbox("ub-r1", 160, 480, 780, 210, "<b>UNION ALL</b><br>132 + 132 = <b>264 dòng</b>", "amber"),
        nbox("ub-r2", 1040, 480, 780, 210, "<b>UNION</b><br>chỉ còn <b>49 dòng</b>", "green"),
        chip("ub-c1", 160, 780, "49 = số tài khoản khác nhau từng chuyển khoản", "violet"),
    ]), beats=[
        title_beat("ub", "Phần một. Nối hai danh sách bằng UNION và UNION ALL.", "Phần 1: UNION ALL và UNION."),
        ("JOIN ghép theo chiều ngang, thêm cột. Phép toán tập hợp làm theo chiều dọc, xếp hai kết quả chồng lên nhau. Ở đây A là tài khoản ghi nợ, B là tài khoản ghi có của mười lệnh chuyển khoản đầu.",
         "JOIN ghép ngang; phép toán tập hợp xếp chồng dọc. A: ghi nợ, B: ghi có.",
         lists_in("ub", 0.4)),
        ("Với UNION ALL, máy giữ mọi dòng, kể cả dòng trùng. Mười cộng mười ra hai mươi dòng, và những tài khoản lặp được đánh dấu.",
         "UNION ALL: 10 + 10 = 20 dòng, giữ cả dòng trùng.",
         [DIM(f"{vsel('ub')}", 0.2, 0.35)] + result_in("ub", "all", 0.4) + [PULSE("#ub-o-all-3, #ub-o-all-4", 5.0)]),
        ("UNION nối xong thì bỏ dòng trùng, mỗi tài khoản chỉ còn một lần, nên còn mười bảy dòng.",
         "UNION: bỏ dòng trùng, còn 17 dòng.",
         [OUT(vsel("ub", "all"), "fade", 0, 0.4)] + result_in("ub", "union", 0.6)),
        ("Trên dữ liệu thật, bảng chuyển khoản có một trăm ba mươi hai lệnh. Nối cột ghi nợ với cột ghi có bằng UNION ALL ra hai trăm sáu mươi bốn dòng. Dùng UNION chỉ còn bốn mươi chín, chính là số tài khoản khác nhau từng chuyển khoản.",
         "Dữ liệu thật: UNION ALL 264 dòng, UNION 49 dòng.",
         [OUT(vsel("ub") + ", " + vsel("ub", "union"), "fade", 0, 0.4), IN("#ub-q", "up", 0.6, 0.4), IN("#ub-q-1", "type1", 0.9, 0.3), IN("#ub-q-2", "type1", 1.8, 0.3), IN("#ub-q-3", "type1", 2.6, 0.3),
          IN("#ub-r0", "left", 3.6), IN("#ub-r1", "pop", 6.0), IN("#ub-r2", "pop", 10.5), IN("#ub-c1", "left", 13.0)]),
    ]),
    # ------------------------------------------------------------ union-practice
    dict(id="union-practice", world=(1920, 1080), hud=hud("up", "Bỏ trùng hay giữ", "Chọn theo câu hỏi"), cam="".join([
        big_title("up", "Bỏ trùng hay giữ", "Chọn UNION hay UNION ALL"),
        sqlbox("up-q", 160, 190, 760, ["SELECT city FROM customer", "UNION", "SELECT city FROM company", "ORDER BY city;"]),
        tbl("up-t", 160, 520, [(460, False)], ["city"],
            [["Cần Thơ"], ["Hà Nội"], ["Hải Phòng"], ["TP. Hồ Chí Minh"], ["Đà Nẵng"]], 62, 27),
        chip("up-c1", 1100, 230, "customer 40 dòng, company 5 dòng", "cyan"),
        chip("up-c2", 1100, 320, "UNION ALL: 45 dòng", "amber"),
        chip("up-c3", 1100, 410, "UNION: 5 thành phố", "green"),
        sqlbox("up-q2", 160, 190, 1150, ["SELECT debit_account FROM funds_transfer WHERE status = 'DONE'", "UNION ALL", "SELECT credit_account FROM funds_transfer WHERE status = 'DONE';"], 26),
        nbox("up-d", 160, 450, 700, 140, "Chuyển khoản <b>DONE</b>: 123 lệnh", "cyan"),
        nbox("up-g", 160, 640, 700, 150, "<b>UNION ALL</b>: 246 dòng<br>đủ hai phía của mọi lệnh", "green"),
        nbox("up-b", 1000, 640, 760, 150, "<b>UNION</b>: 49 dòng<br>thiếu dữ liệu, không báo lỗi", "red"),
        chip("up-r", 160, 860, "Không chắc thì dùng UNION ALL, rồi tự quyết có cần DISTINCT", "amber"),
    ]), beats=[
        title_beat("up", "Phần hai. Khi nào cần bỏ trùng, khi nào phải giữ.", "Phần 2: bỏ trùng hay giữ."),
        ("Chọn UNION hay UNION ALL là chọn xem bạn cần danh sách giá trị khác nhau, hay cần mọi dòng. Ví dụ: những thành phố nào có khách hoặc có chi nhánh?",
         "Thành phố nào có khách hoặc có chi nhánh?",
         [IN("#up-q", "up", 0.3, 0.4), IN("#up-q-1", "type1", 0.6, 0.3), IN("#up-q-2", "type1", 2.4, 0.3), IN("#up-q-3", "type1", 3.4, 0.3), IN("#up-q-4", "type1", 5.2, 0.3)]),
        ("Bảng khách có bốn mươi dòng, bảng công ty có năm. UNION ALL cho bốn mươi lăm dòng, còn UNION chỉ còn năm thành phố.",
         "UNION ALL: 45 dòng. UNION: 5 thành phố.",
         [IN("#up-c1", "left", 0.3), IN("#up-c2", "left", 3.4), IN("#up-t-h", "left", 5.6), IN("#up-t-1", "left", 6.0), IN("#up-t-2", "left", 6.3), IN("#up-t-3", "left", 6.6),
          IN("#up-t-4", "left", 6.9), IN("#up-t-5", "left", 7.2), IN("#up-c3", "left", 6.0)]),
        ("Bẫy là khi bạn đếm hay cộng tiền. Bỏ trùng làm sai số mà không có lỗi nào báo. Lấy hai phía của các lệnh chuyển khoản đã hoàn tất: UNION ALL cho hai trăm bốn mươi sáu dòng, UNION chỉ còn bốn mươi chín.",
         "Đếm hay cộng tiền: UNION ALL 246 dòng, UNION chỉ 49.",
         [OUT("#up-q, #up-q-1, #up-q-2, #up-q-3, #up-q-4, #up-t-h, #up-t-1, #up-t-2, #up-t-3, #up-t-4, #up-t-5, #up-c1, #up-c2, #up-c3", "fade", 0, 0.4),
          IN("#up-q2", "up", 0.6, 0.4), IN("#up-q2-1", "type1", 0.9, 0.3), IN("#up-q2-2", "type1", 2.4, 0.3), IN("#up-q2-3", "type1", 3.2, 0.3), IN("#up-d", "left", 4.4),
          IN("#up-g", "pop", 7.0), IN("#up-b", "pop", 11.0), SHAKE("#up-b", 11.8)]),
        ("Quy tắc nhanh: không chắc thì dùng UNION ALL, rồi tự quyết định có cần bỏ trùng hay không. Nó không âm thầm bỏ dữ liệu của bạn.",
         "Không chắc thì UNION ALL, rồi tự quyết có cần DISTINCT.",
         [DIM("#up-q2, #up-q2-1, #up-q2-2, #up-q2-3, #up-d, #up-b", 0.2, 0.12), IN("#up-r", "left", 0.8)]),
    ]),
    # ------------------------------------------------------------ set-rules
    dict(id="set-rules", world=(1920, 1080), hud=hud("sr", "Luật gộp", "Số cột, kiểu, ORDER BY, cột nhãn"), cam="".join([
        big_title("sr", "Luật gộp", "Số cột, kiểu, ORDER BY và cột nhãn"),
        sqlbox("sr-q1", 160, 190, 960, ["SELECT customer_id FROM customer", "UNION", "SELECT officer_id, name FROM account_officer;"]),
        errbox("sr-e1", 160, 440, 1500, "ERROR: each UNION query must have the same number of columns"),
        chip("sr-c1", 160, 580, "Luật 1: cùng số cột", "amber"),
        sqlbox("sr-q2", 160, 190, 960, ["SELECT customer_id FROM customer", "UNION", "SELECT short_name FROM customer;"]),
        errbox("sr-e2", 160, 440, 1500, "ERROR: UNION types integer and character varying cannot be matched"),
        chip("sr-c2", 160, 580, "Luật 2: cột cùng vị trí có kiểu tương thích", "amber"),
        sqlbox("sr-q3", 160, 190, 960, ["SELECT customer_id AS ma_kh FROM customer", "UNION", "SELECT officer_id AS ma_nv FROM account_officer", "ORDER BY ma_kh;"]),
        chip("sr-c3", 1180, 230, "Tên cột lấy từ câu đầu: ma_kh", "green"),
        chip("sr-c4", 1180, 320, "Ghép theo vị trí, không theo tên", "cyan"),
        chip("sr-c5", 1180, 410, "ORDER BY viết một lần, ở cuối", "violet"),
        chip("sr-c6", 160, 560, "ORDER BY ma_nv: column \"ma_nv\" does not exist", "red"),
        sqlbox("sr-q4", 140, 190, 940, ["SELECT 'CURRENT' AS nhom, COUNT(*) AS so_tai_khoan", "FROM ... WHERE product_group = 'CURRENT'", "UNION ALL", "SELECT 'SAVINGS', COUNT(*)", "FROM ... WHERE product_group = 'SAVINGS'",
                                        "UNION ALL", "SELECT 'LOAN', COUNT(*)", "FROM ... WHERE product_group = 'LOAN';"], 26),
        tbl("sr-t", 1180, 230, [(200, True), (280, True)], ["nhom", "so_tai_khoan"], [["CURRENT", "50"], ["SAVINGS", "20"], ["LOAN", "15"]], 66, 27),
        chip("sr-c7", 1180, 520, "Cột nhãn cho biết dòng đến từ nhánh nào", "amber"),
    ]), beats=[
        title_beat("sr", "Phần ba. Luật gộp, ORDER BY và cột nhãn.", "Phần 3: luật gộp, ORDER BY, cột nhãn."),
        ("Muốn gộp được, hai câu SELECT phải cùng số cột. Một bên hai cột, một bên một cột, máy báo lỗi ngay.",
         "Luật 1: cùng số cột.",
         [IN("#sr-q1", "up", 0.3, 0.4), IN("#sr-q1-1", "type1", 0.6, 0.3), IN("#sr-q1-2", "type1", 1.6, 0.3), IN("#sr-q1-3", "type1", 2.4, 0.3), IN("#sr-e1", "up", 3.4), SHAKE("#sr-e1", 3.9), IN("#sr-c1", "left", 5.2)]),
        ("Các cột cùng vị trí còn phải có kiểu tương thích, số với số, chữ với chữ. Nối mã khách, là số, với tên ngắn, là chữ, thì cũng báo lỗi.",
         "Luật 2: cột cùng vị trí có kiểu tương thích.",
         [OUT("#sr-q1, #sr-q1-1, #sr-q1-2, #sr-q1-3, #sr-e1, #sr-c1", "fade", 0, 0.4), IN("#sr-q2", "up", 0.6, 0.4), IN("#sr-q2-1", "type1", 0.9, 0.3), IN("#sr-q2-2", "type1", 1.7, 0.3),
          IN("#sr-q2-3", "type1", 2.5, 0.3), IN("#sr-e2", "up", 5.0), SHAKE("#sr-e2", 5.6), IN("#sr-c2", "left", 7.4)]),
        ("Tên cột của kết quả lấy từ câu đầu tiên, và các cột ghép theo vị trí. ORDER BY chỉ viết một lần ở cuối, và chỉ nhìn thấy tên của câu đầu. Dùng tên của câu sau là báo lỗi.",
         "Tên cột lấy từ câu đầu; ORDER BY một lần, ở cuối.",
         [OUT("#sr-q2, #sr-q2-1, #sr-q2-2, #sr-q2-3, #sr-e2, #sr-c2", "fade", 0, 0.4), IN("#sr-q3", "up", 0.6, 0.4), IN("#sr-q3-1", "type1", 0.9, 0.3), IN("#sr-q3-2", "type1", 1.6, 0.3),
          IN("#sr-q3-3", "type1", 2.3, 0.3), IN("#sr-q3-4", "type1", 3.0, 0.3), IN("#sr-c3", "left", 3.6), IN("#sr-c4", "left", 6.0), IN("#sr-c5", "left", 8.0), IN("#sr-c6", "left", 10.4), SHAKE("#sr-c6", 11.0)]),
        ("Thủ thuật hay dùng là thêm một cột nhãn, một hằng số chữ, để biết dòng đến từ nhánh nào. Báo cáo theo nhóm sản phẩm ra năm mươi tài khoản thanh toán, hai mươi tiết kiệm và mười lăm khoản vay.",
         "Cột nhãn: CURRENT 50, SAVINGS 20, LOAN 15.",
         [OUT("#sr-q3, #sr-q3-1, #sr-q3-2, #sr-q3-3, #sr-q3-4, #sr-c3, #sr-c4, #sr-c5, #sr-c6", "fade", 0, 0.4), IN("#sr-q4", "up", 0.6, 0.4)]
         + [IN(f"#sr-q4-{i}", "type1", 0.9 + 0.55 * (i - 1), 0.3) for i in range(1, 9)]
         + [IN("#sr-c7", "left", 3.0), IN("#sr-t-h", "left", 7.0), IN("#sr-t-1", "left", 7.8), IN("#sr-t-2", "left", 9.2), IN("#sr-t-3", "left", 10.4)]),
    ]),
    # ------------------------------------------------------------ intersect
    dict(id="intersect", world=(1920, 1080), hud=hud("is", "INTERSECT", "Phần chung của hai danh sách"), cam="".join([
        big_title("is", "INTERSECT", "Vừa là A, vừa là B"),
        venn("is", ["inter"]),
        sqlbox("is-q", 160, 190, 900, ["SELECT a.customer_id", "FROM account a JOIN category c ON ...", "WHERE c.product_group = 'SAVINGS'", "INTERSECT", "SELECT customer_id FROM loan", "ORDER BY 1;"], 26),
        tbl("is-t", 1200, 190, [(300, True)], ["customer_id"],
            [["100011"], ["100017"], ["100024"], ["100025"], ["100035"], ["100036"], ["100039"]], 62, 27),
        chip("is-c0", 160, 640, "Tiết kiệm INTERSECT vay: 7 khách", "green"),
        chip("is-c1", 160, 720, "Thêm cột thừa: each INTERSECT query must have the same number of columns", "red"),
        chip("is-c2", 160, 800, "So sánh cả dòng: mọi cột phải bằng nhau", "amber"),
        chip("is-c3", 160, 880, "debit INTERSECT credit: 43 tài khoản", "cyan"),
    ]), beats=[
        title_beat("is", "Phần bốn. INTERSECT, phần chung của hai danh sách.", "Phần 4: INTERSECT."),
        ("INTERSECT chỉ giữ những dòng có mặt ở cả hai danh sách, và tự bỏ trùng. Trong hai danh sách mẫu, chỉ có một tài khoản vừa bị ghi nợ vừa được ghi có.",
         "INTERSECT: chỉ 1 tài khoản có ở cả A và B.",
         lists_in("is", 0.4) + [DIM(vsel("is"), 3.4, 0.35)] + result_in("is", "inter", 4.0) + [PULSE("#is-a-10, #is-b-9", 5.6)]),
        ("Ví dụ ngân hàng: khách vừa có tài khoản tiết kiệm, vừa có khoản vay. Câu đầu lấy khách có tiết kiệm, câu sau lấy khách có khoản vay, và INTERSECT giữ phần chung.",
         "Khách vừa có tiết kiệm, vừa có vay.",
         [OUT(vsel("is") + ", " + vsel("is", "inter"), "fade", 0, 0.4), IN("#is-q", "up", 0.6, 0.4)]
         + [IN(f"#is-q-{i}", "type1", 0.9 + 1.0 * (i - 1), 0.3) for i in range(1, 7)]),
        ("Kết quả gồm bảy khách vừa gửi tiết kiệm vừa đi vay.",
         "7 khách vừa có tiết kiệm vừa có vay.",
         [IN("#is-t-h", "left", 0.2)] + [IN(f"#is-t-{i}", "left", 0.3 + 0.1 * i) for i in range(1, 8)] + [IN("#is-c0", "left", 1.1)]),
        ("Hai bẫy. Thêm cột thừa vào một bên thì máy báo lỗi số cột. Và INTERSECT so sánh cả dòng, nên mọi cột phải bằng nhau cùng lúc. Với chuyển khoản, bốn mươi ba tài khoản vừa ghi nợ vừa được ghi có.",
         "Bẫy: lệch số cột; so sánh cả dòng. Chuyển khoản: 43 tài khoản.",
         [DIM("#is-q, #is-q-1, #is-q-2, #is-q-3, #is-q-4, #is-q-5, #is-q-6, #is-t-h, #is-t-1, #is-t-2, #is-t-3, #is-t-4, #is-t-5, #is-t-6, #is-t-7", 0.2, 0.15),
          IN("#is-c1", "left", 0.8), IN("#is-c2", "left", 5.2), IN("#is-c3", "left", 9.0)]),
    ]),
    # ------------------------------------------------------------ except
    dict(id="except", world=(1920, 1080), hud=hud("ex", "EXCEPT", "Có ở A, không có ở B"), cam="".join([
        big_title("ex", "EXCEPT", "Có bên này, không có bên kia"),
        venn("ex", ["exc"]),
        sqlbox("ex-q", 160, 190, 820, ["SELECT credit_account FROM funds_transfer", "EXCEPT", "SELECT debit_account FROM funds_transfer", "ORDER BY 1;"]),
        tbl("ex-t", 160, 520, [(360, True)], ["credit_account"],
            [["1000000015"], ["1000000020"], ["1000000021"], ["1000000037"], ["1000000063"]], 62, 27),
        chip("ex-c1", 1100, 230, "credit EXCEPT debit: 5 tài khoản", "green"),
        chip("ex-c2", 1100, 320, "debit EXCEPT credit: chỉ 1 tài khoản", "amber"),
        chip("ex-c3", 1100, 410, "Thứ tự quan trọng: A EXCEPT B khác B EXCEPT A", "violet"),
        sqlbox("ex-q2", 160, 190, 900, ["SELECT a.customer_id", "FROM account a JOIN category c ON ...", "WHERE c.product_group = 'CURRENT'", "EXCEPT", "SELECT customer_id FROM loan;"], 26),
        nbox("ex-r", 1100, 220, 700, 220, "Có tài khoản thanh toán, chưa có khoản vay: <b>25 khách</b>", "green"),
        chip("ex-c4", 160, 640, "Trước EXCEPT: cái giữ. Sau EXCEPT: cái loại", "cyan"),
        chip("ex-c5", 160, 740, "Nhầm chiều: ra tập khác hẳn, không báo lỗi", "red"),
        chip("ex-c6", 160, 840, "EXCEPT cũng bỏ trùng: muốn giữ số lần, dùng EXCEPT ALL", "amber"),
    ]), beats=[
        title_beat("ex", "Phần năm. EXCEPT, có ở bên này mà không có ở bên kia.", "Phần 5: EXCEPT."),
        ("A EXCEPT B lấy những dòng có ở A mà không có ở B. Với hai danh sách mẫu, chín tài khoản chỉ bị ghi nợ, chưa bao giờ được ghi có.",
         "A EXCEPT B: 9 dòng có ở A mà không có ở B.",
         lists_in("ex", 0.4) + [DIM(vsel("ex"), 3.4, 0.35)] + result_in("ex", "exc", 4.0)),
        ("Khác với UNION và INTERSECT, thứ tự rất quan trọng. Tài khoản từng nhận tiền mà chưa bao giờ ghi nợ có năm tài khoản. Đảo chiều thì chỉ còn một.",
         "credit EXCEPT debit: 5 tài khoản. Đảo chiều: 1.",
         [OUT(vsel("ex") + ", " + vsel("ex", "exc"), "fade", 0, 0.4), IN("#ex-q", "up", 0.6, 0.4), IN("#ex-q-1", "type1", 0.9, 0.3), IN("#ex-q-2", "type1", 1.6, 0.3), IN("#ex-q-3", "type1", 2.2, 0.3),
          IN("#ex-q-4", "type1", 2.8, 0.3), IN("#ex-t-h", "left", 3.4)] + [IN(f"#ex-t-{i}", "left", 3.6 + 0.15 * i) for i in range(1, 6)]
         + [IN("#ex-c1", "left", 4.6), IN("#ex-c2", "left", 6.0), IN("#ex-c3", "left", 7.0)]),
        ("Tình huống ngân hàng: khách có tài khoản thanh toán nhưng chưa có khoản vay nào, để chào bán gói vay. Lấy khách thanh toán, trừ khách có vay, ra hai mươi lăm khách.",
         "Thanh toán EXCEPT vay: 25 khách.",
         [OUT("#ex-q, #ex-q-1, #ex-q-2, #ex-q-3, #ex-q-4, #ex-t-h, #ex-t-1, #ex-t-2, #ex-t-3, #ex-t-4, #ex-t-5, #ex-c1, #ex-c2, #ex-c3", "fade", 0, 0.4), IN("#ex-q2", "up", 0.6, 0.4)]
         + [IN(f"#ex-q2-{i}", "type1", 0.9 + 1.4 * (i - 1), 0.3) for i in range(1, 6)] + [IN("#ex-r", "pop", 9.0)]),
        ("Bẫy: viết nhầm chiều thì ra một tập khác hẳn mà không có lỗi nào. Hãy đọc là A trừ B: trước EXCEPT là cái giữ, sau EXCEPT là cái loại. EXCEPT cũng bỏ trùng, muốn giữ số lần thì dùng EXCEPT ALL.",
         "Đọc là A trừ B. EXCEPT bỏ trùng; giữ số lần thì EXCEPT ALL.",
         [DIM("#ex-q2, #ex-q2-1, #ex-q2-2, #ex-q2-3, #ex-q2-4, #ex-q2-5, #ex-r", 0.2, 0.15), IN("#ex-c4", "left", 0.8), IN("#ex-c5", "left", 5.0), IN("#ex-c6", "left", 9.0)]),
    ]),
    # ------------------------------------------------------------ set-vs-join
    dict(id="set-vs-join", world=(1920, 1080), hud=hud("sj", "So với JOIN", "Phép tập hợp và anti-join"), cam="".join([
        big_title("sj", "So với JOIN", "Tập hợp và anti-join tương đương"),
        chip("sj-c1", 300, 200, "INTERSECT = INNER JOIN rồi DISTINCT", "green"),
        chip("sj-c2", 300, 290, "EXCEPT = LEFT JOIN ... WHERE ... IS NULL (anti-join)", "cyan"),
        tbl("sj-t", 300, 420, [(480, False), (400, False), (440, False)], ["Câu hỏi", "Phép tập hợp", "JOIN"],
            [["Có thanh toán và có vay", "INTERSECT: 15 khách", "JOIN: 18 dòng"],
             ["Có thanh toán, chưa có vay", "EXCEPT: 25 khách", "anti-join: 32 dòng"],
             ["Thêm DISTINCT vào JOIN", "15 và 25 khách", "15 và 25 khách"]], 74, 27),
        chip("sj-w", 300, 740, "Khách có hai tài khoản xuất hiện hai lần trong JOIN", "amber"),
        chip("sj-c3", 300, 820, "Cần thêm cột (tên khách, số tiền): JOIN", "violet"),
        chip("sj-c4", 300, 900, "Chỉ cần danh sách khoá: phép tập hợp gọn hơn", "green"),
    ]), beats=[
        title_beat("sj", "Phần sáu. So với JOIN và anti-join tương đương.", "Phần 6: so với JOIN."),
        ("Nhiều câu hỏi làm được cả hai cách. INTERSECT tương đương INNER JOIN rồi bỏ dòng trùng. Còn EXCEPT tương đương anti-join: LEFT JOIN rồi giữ dòng không khớp.",
         "INTERSECT = INNER JOIN + DISTINCT. EXCEPT = anti-join.",
         [IN("#sj-c1", "left", 0.4), IN("#sj-c2", "left", 5.0)]),
        ("Khác biệt nằm ở dòng nhân bản. Phép tập hợp tự bỏ trùng, JOIN thì không. Khách có tài khoản thanh toán và khoản vay: INTERSECT cho mười lăm khách, còn JOIN ra mười tám dòng, vì khách có hai tài khoản xuất hiện hai lần.",
         "INTERSECT 15 khách; JOIN 18 dòng vì khách bị lặp.",
         [IN("#sj-t-h", "left", 0.3), IN("#sj-t-1", "left", 1.8), PULSE("#sj-t-1", 6.0), IN("#sj-w", "left", 9.5)]),
        ("Tương tự, anti-join theo tài khoản ra ba mươi hai dòng, còn EXCEPT theo khách chỉ ra hai mươi lăm. Thêm DISTINCT vào JOIN thì hai bên khớp nhau.",
         "Anti-join 32 dòng; EXCEPT 25 khách; DISTINCT cho khớp.",
         [IN("#sj-t-2", "left", 0.4), IN("#sj-t-3", "left", 6.0)]),
        ("Khi nào chọn gì? Cần thêm thông tin như tên khách hay số tiền vay thì dùng JOIN. Chỉ cần danh sách khoá thì phép tập hợp gọn hơn.",
         "Cần thêm cột: JOIN. Chỉ cần danh sách khoá: phép tập hợp.",
         [DIM("#sj-c1, #sj-c2, #sj-t-h, #sj-t-1, #sj-t-2, #sj-t-3, #sj-w", 0.2, 0.15), IN("#sj-c3", "left", 0.8), IN("#sj-c4", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "UNION ALL, UNION", "giữ hay bỏ dòng trùng"),
                                                ("split", "Luật gộp", "cùng số cột, ORDER BY ở cuối"),
                                                ("quote", "INTERSECT", "phần chung của hai danh sách"),
                                                ("box", "EXCEPT", "A trừ B, phụ thuộc chiều")]),
        chip("ou-next", 560, 650, "Bài tiếp: Window Functions", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: UNION ALL giữ mọi dòng, UNION bỏ dòng trùng. Hai câu phải cùng số cột, và ORDER BY viết một lần ở cuối. INTERSECT giữ phần chung. EXCEPT là A trừ B, nên phụ thuộc chiều.",
         "UNION ALL, UNION · luật gộp · INTERSECT · EXCEPT.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.2), IN("#ou-c2", "pop", 8.0), IN("#ou-c3", "pop", 11.0)]),
        ("Bài tiếp: Window Functions.", "Bài tiếp: Window Functions.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
