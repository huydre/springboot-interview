"""SQL window functions explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-window.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
avg(working_balance) OVER () over 85 accounts = 204026227.04 (first rows 1000000001 107956000.00, 1000000002 5088114.00, 1000000003 75666000.00, 1000000004 246613000.00);
WHERE company_id = 'VN0010003' -> 17 accounts, max(working_balance) OVER () = 1777312000.00 (1000000016 128890000.00, 1000000017 101762293.00, 1000000020 31956000.00);
sum(working_balance) OVER (PARTITION BY company_id) on 8 sample accounts: VN0010001 25390668.00 (20281474.00, 5088114.00, 21080.00),
VN0010002 94231458.00 (67862000.00, 53934000.00, 10176229.00 x2, -47917000.00);
VN0010002 ranking (14 accounts): 1000000007 53934000.00 rn 8 rk 8 dr 8; 1000000008 and 1000000010 10176229.00 rn 9/10 rk 9 dr 9; 1000000009 and 1000000051 0.00 rn 11/12 rk 11 dr 10;
1000000085 -47917000.00 rn 13 rk 13 dr 11; 1000000073 -720002000.00 rn 14 rk 14 dr 12;
DONE VND per day (83 days): 2024-01-04 2000000.00, 2024-01-11 3000000.00 (diff 1000000.00), 2024-01-17 1000000.00 (diff -2000000.00), 2024-01-21 2000000.00 (diff 1000000.00); LEAD gap 01-04 -> 01-11 = 7 days;
account 1000000028 running balance 50000000.00, 50175000.00, 50350612.00 (= working_balance); account 1000000049 (11 entries, last 74000000.00 = working_balance):
2024-07-13 entries 539 (-1000000.00) and 540 (-15000000.00): ORDER BY date only 54000000.00 / 54000000.00, with stmt_entry_id 69000000.00 / 54000000.00;
latest entry per account 85 rows (1000000001: 826, 2024-11-14, -11000.00); top 3 per company 15 rows (VN0010001: 1000000069 517967000.00, 1000000022 280912000.00, 1000000004 246613000.00);
WHERE ROW_NUMBER() OVER (...) -> error: window functions are not allowed in WHERE.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<c>--[^\n]*)|(?P<s>'[^']*')|(?P<k>\b(?:SELECT|FROM|WHERE|AND|ORDER BY|PARTITION BY|GROUP BY|OVER|WITH|AS|DESC|IN|ROWS BETWEEN)\b)"
    r"|(?P<f>\b(?:COUNT|SUM|AVG|MIN|MAX|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|round|avg|sum|max|count)\b(?=\())|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff", f="#fcd34d", c="#7c8599")


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


def sel_q(prefix, n):
    return ", ".join([f"#{prefix}"] + [f"#{prefix}-{i}" for i in range(1, n + 1)])


def type_q(prefix, n, d0=0.3, step=1.2):
    return [IN(f"#{prefix}", "up", d0, 0.4)] + [IN(f"#{prefix}-{i}", "type1", d0 + 0.3 + (i - 1) * step, 0.3) for i in range(1, n + 1)]


def title_beat(p):
    return [TYPE(f"#{p}-big", 0.1, 0.06), IN(f"#{p}-bsub", "blur", 0.9), OUT(f"#{p}-big, #{p}-bsub", "zoom", 3.4), IN(f"#{p}-hud", "left", 4.0)]


def errbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r")


BAND = dict(cyan=("rgba(46,197,232,.17)", "#2ec5e8"), amber=("rgba(251,191,36,.17)", "#fbbf24"),
            green=("rgba(74,222,128,.15)", "#4ade80"), violet=("rgba(167,139,250,.17)", "#a78bfa"))


def _cell(w, v, mono=True, bold=False, color=None):
    if v == "NULL" and not bold:
        v = '<span style="opacity:.45;font-style:italic">NULL</span>'
    else:
        v = esc(v)
    c = f"color:{color};" if color else ""
    return (f'<span style="width:{w}px;padding:0 16px;white-space:nowrap;overflow:hidden;box-sizing:border-box;{c}'
            f'font-family:{"var(--mono)" if mono else "var(--font)"};font-weight:{700 if bold else 500}">{v}</span>')


def wtab(p, x, y, cols, head, rows, bands, res, row_h=60, size=27):
    """Window-result table. Base columns come with the rows (ids <p>-h, <p>-1..n); each result column j (1-based) is
    revealed cell by cell (ids <p>-k<j>-h, <p>-k<j>-1..n). bands[i] is a band tone (colour bar + tint) or None."""
    base = sum(w for w, _ in cols)
    total = base + sum(w for w, _, _ in res)
    st = f"display:flex;align-items:center;height:{row_h - 6}px;font-size:{size}px;border-radius:10px;"
    parts = [el(f"{p}-h", x, y, base, None, "".join(_cell(w, v, m, True) for (w, m), v in zip(cols, head)), "r",
                st + "background:rgba(255,255,255,.08);border-bottom:2px solid #2ec5e8;color:#fff")]
    for i, vals in enumerate(rows, 1):
        tone = bands[i - 1]
        bg, bar = BAND[tone] if tone else ("rgba(255,255,255,.035)" if i % 2 else "rgba(255,255,255,0)", "transparent")
        parts.append(el(f"{p}-{i}", x, y + i * row_h, total, None,
                        "".join(_cell(w, v, m) for (w, m), v in zip(cols, vals)), "r",
                        st + f"background:{bg};border-left:6px solid {bar};color:#e6e9f0"))
    rx = x + base
    for j, (w, name, vals) in enumerate(res, 1):
        parts.append(el(f"{p}-k{j}-h", rx, y, w, None, _cell(w, name, True, True), "r",
                        st + "background:rgba(255,255,255,.08);border-bottom:2px solid #fbbf24;color:#fde68a"))
        for i, v in enumerate(vals, 1):
            parts.append(el(f"{p}-k{j}-{i}", rx, y + i * row_h, w, None, _cell(w, v, True, False, "#fde68a"), "r", st + "color:#fde68a"))
        rx += w
    return "".join(parts)


def sel_w(p, n, ks=()):
    ids = [f"#{p}-h"] + [f"#{p}-{i}" for i in range(1, n + 1)]
    for j in ks:
        ids += [f"#{p}-k{j}-h"] + [f"#{p}-k{j}-{i}" for i in range(1, n + 1)]
    return ", ".join(ids)


def rows_w(p, idx, ks=()):
    ids = []
    for i in idx:
        ids.append(f"#{p}-{i}")
        ids += [f"#{p}-k{j}-{i}" for j in ks]
    return ", ".join(ids)


def show_w(p, n, d0=0.3, step=0.4):
    return [IN(f"#{p}-h", "left", d0)] + [IN(f"#{p}-{i}", "left", d0 + 0.4 + (i - 1) * step) for i in range(1, n + 1)]


def fill_w(p, j, n, d0=0.3, step=0.7):
    """Fill result column j row by row."""
    return [IN(f"#{p}-k{j}-h", "fade", d0, 0.4)] + [IN(f"#{p}-k{j}-{i}", "blur", d0 + 0.5 + (i - 1) * step, 0.45) for i in range(1, n + 1)]


def tbl(prefix, x, y, cols, head, rows, row_h=60, size=27):
    return wtab(prefix, x, y, cols, head, rows, [None] * len(rows), [], row_h, size)


def flow_chips(prefix, y, labels, tone="cyan", w=200, x0=95, gap=20):
    return "".join(chip(f"{prefix}{i}", x0 + i * (w + gap), y, t, tone, w) for i, t in enumerate(labels))


def card_in(id_, x, y, w, h, head, sub, tone):
    return box(id_, x, y, w, h, f'<div style="text-align:center"><b style="font-size:46px">{esc(head)}</b>'
                                f'<div style="font-size:32px;margin-top:18px;opacity:.9">{esc(sub)}</div></div>', tone, "")


# ---- data (all from run-sql.mjs) ----
AVG_ROWS = [["1000000001", "107956000.00"], ["1000000002", "5088114.00"], ["1000000003", "75666000.00"], ["1000000004", "246613000.00"]]
MAX_ROWS = [["1000000016", "128890000.00"], ["1000000017", "101762293.00"], ["1000000020", "31956000.00"]]
PART_ROWS = [["VN0010001", "1000000006", "20281474.00"], ["VN0010001", "1000000002", "5088114.00"], ["VN0010001", "1000000070", "21080.00"],
             ["VN0010002", "1000000024", "67862000.00"], ["VN0010002", "1000000007", "53934000.00"], ["VN0010002", "1000000008", "10176229.00"],
             ["VN0010002", "1000000010", "10176229.00"], ["VN0010002", "1000000085", "-47917000.00"]]
RANK_ROWS = [["1000000007", "53934000.00"], ["1000000008", "10176229.00"], ["1000000010", "10176229.00"], ["1000000009", "0.00"],
             ["1000000051", "0.00"], ["1000000085", "-47917000.00"], ["1000000073", "-720002000.00"]]
LAG_ROWS = [["2024-01-04", "2000000.00"], ["2024-01-11", "3000000.00"], ["2024-01-17", "1000000.00"], ["2024-01-21", "2000000.00"]]
EN28 = [["36", "2024-01-01", "50000000.00"], ["693", "2024-09-21", "175000.00"], ["922", "2024-12-28", "175612.00"]]
EN49 = [["466", "2024-06-17", "5000000.00"], ["539", "2024-07-13", "-1000000.00"], ["540", "2024-07-13", "-15000000.00"], ["577", "2024-08-07", "2000000.00"]]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Báo cáo ngân hàng T24", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Giữ từng dòng, thêm con số tổng hợp"), "h1 center r"),
        card_in("hk-l", 220, 440, 600, 260, "GROUP BY", "85 dòng thành 5 dòng", "amber"),
        card_in("hk-r", 1100, 440, 600, 260, "Hàm cửa sổ", "85 dòng, thêm 1 cột", "green"),
        chip("hk-x", 700, 780, "Mất chi tiết từng tài khoản", "red"),
        chip("hk-ok", 1160, 780, "Vẫn đủ 85 tài khoản", "green"),
        tile("hk-tile", 330, 350, 220, "grid"),
        el("hk-word", 600, 380, 1300, None, letters("Window Functions"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "OVER · PARTITION BY · RANK · LAG · số dư chạy", "kin-sub r"),
    ]), beats=[
        ("Ngân hàng có tám mươi lăm tài khoản. Bạn muốn mỗi tài khoản vẫn hiện một dòng, nhưng thêm một con số tổng hợp bên cạnh.",
         "85 tài khoản: mỗi dòng vẫn giữ, cạnh nó thêm một con số tổng hợp.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Group By thì gộp tám mươi lăm dòng còn năm dòng, mất chi tiết từng tài khoản. Hàm cửa sổ giữ nguyên cả tám mươi lăm dòng, và chỉ thêm một cột.",
         "GROUP BY: 85 dòng còn 5. Hàm cửa sổ: giữ 85 dòng, thêm 1 cột.",
         [IN("#hk-l", "pop", 0.3), IN("#hk-x", "left", 2.0), IN("#hk-r", "pop", 4.5), IN("#hk-ok", "left", 7.0)]),
        ("Hôm nay ta học hàm cửa sổ: xếp hạng, so dòng trước sau, và số dư chạy.",
         "Hôm nay: Window Functions.",
         [OUT("#hk-eye, #hk-q, #hk-l, #hk-r, #hk-x, #hk-ok", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ over-basics
    dict(id="over-basics", world=(1920, 1080), hud=hud("ob", "OVER", "Tính toán mà không gộp dòng"), cam="".join([
        big_title("ob", "OVER", "Tính trên cả nhóm dòng, vẫn giữ từng dòng"),
        sqlbox("ob-q", 120, 190, 1150, ["SELECT account_id, working_balance,", "       round(avg(working_balance) OVER (), 2) AS avg_all", "FROM account", "ORDER BY account_id LIMIT 4;"]),
        chip("ob-k", 1330, 330, "OVER (): cửa sổ là cả bảng", "violet"),
        wtab("ob-t", 120, 470, [(260, True), (320, True)], ["account_id", "working_balance"], AVG_ROWS, [None] * 4, [(340, "avg_all", ["204026227.04"] * 4)], 66, 28),
        chip("ob-n", 1330, 560, "Cột avg_all lặp lại ở cả 85 dòng", "green"),
        sqlbox("ob-q2", 120, 190, 1150, ["SELECT account_id, working_balance,", "       max(working_balance) OVER () AS max_in_view", "FROM account", "WHERE company_id = 'VN0010003'", "ORDER BY account_id;"]),
        wtab("ob-u", 120, 510, [(260, True), (320, True)], ["account_id", "working_balance"], MAX_ROWS, [None] * 3, [(360, "max_in_view", ["1777312000.00"] * 3)], 66, 28),
        chip("ob-w1", 1130, 330, "WHERE chạy trước", "amber"),
        chip("ob-w2", 1130, 420, "Cửa sổ chỉ thấy 17 dòng", "cyan"),
        chip("ob-w3", 1130, 510, "Max của chi nhánh, không phải của ngân hàng", "red"),
    ]), beats=[
        ("Phần một. Từ khoá Over cho phép tính toán trên một nhóm dòng, mà vẫn giữ nguyên từng dòng.",
         "Phần 1: OVER, tính toán mà không gộp dòng.",
         title_beat("ob")),
        ("Ta viết hàm trung bình số dư, theo sau là Over và cặp ngoặc rỗng. Cặp ngoặc rỗng nghĩa là cửa sổ là toàn bộ các dòng.",
         "avg(...) OVER (): cửa sổ là toàn bộ dòng.",
         type_q("ob-q", 4, 0.3, 1.0) + [DIM("#ob-q-1, #ob-q-3, #ob-q-4", 4.6, 0.2), IN("#ob-k", "left", 5.0)]),
        ("Trung bình số dư là hơn hai trăm linh bốn triệu. Con số đó hiện ở cả tám mươi lăm dòng, và mỗi tài khoản vẫn còn nguyên.",
         "Trung bình 204.026.227,04 hiện ở mọi dòng, tài khoản vẫn còn nguyên.",
         show_w("ob-t", 4, 0.3, 0.3) + fill_w("ob-t", 1, 4, 2.2, 0.8) + [IN("#ob-n", "left", 6.5)]),
        ("Có một bẫy. Where chạy trước, nên cửa sổ chỉ thấy các dòng còn lại. Ta lọc một chi nhánh, rồi hỏi số dư lớn nhất.",
         "WHERE chạy trước hàm cửa sổ.",
         [OUT(sel_q("ob-q", 4) + ", #ob-k, #ob-n, " + sel_w("ob-t", 4, [1]), "fade", 0, 0.4)] + type_q("ob-q2", 5, 0.6, 1.1) + [IN("#ob-w1", "left", 6.8)]),
        ("Chi nhánh này có mười bảy tài khoản, và Max Over chỉ là số lớn nhất của chi nhánh đó, không phải của cả ngân hàng.",
         "17 dòng, max = 1.777.312.000: của chi nhánh, không phải cả ngân hàng.",
         [DIM(sel_q("ob-q2", 5), 0, 0.15)] + show_w("ob-u", 3, 0.3, 0.3) + fill_w("ob-u", 1, 3, 1.8, 0.6) + [IN("#ob-w2", "left", 4.8), IN("#ob-w3", "left", 7.2)]),
    ]),
    # ------------------------------------------------------------ partition-order
    dict(id="partition-order", world=(1920, 1080), hud=hud("po", "PARTITION BY và ORDER BY", "Chia nhóm bên trong OVER"), cam="".join([
        big_title("po", "PARTITION BY", "Chia nhóm để tính, không gộp dòng"),
        sqlbox("po-q", 120, 190, 1300, ["SELECT company_id, account_id, working_balance,", "       sum(working_balance)", "         OVER (PARTITION BY company_id) AS tong_cn", "FROM account WHERE account_id IN (...);  -- 8 tài khoản mẫu"], 26),
        chip("po-g", 120, 500, "PARTITION BY company_id: mỗi chi nhánh là một nhóm", "cyan"),
        wtab("po-t", 120, 200, [(220, True), (250, True), (300, True)], ["company_id", "account_id", "working_balance"], PART_ROWS,
             ["cyan"] * 3 + ["amber"] * 5, [(300, "tong_cn", ["25390668.00"] * 3 + ["94231458.00"] * 5)], 62, 27),
        chip("po-c1", 1330, 230, "8 dòng vào, 8 dòng ra", "green"),
        chip("po-c2", 1330, 320, "Mỗi dòng nhận tổng của nhóm mình", "violet"),
        chip("po-o1", 300, 250, "ORDER BY trong OVER: thứ tự để tính", "violet"),
        chip("po-o2", 300, 350, "ORDER BY cuối câu: thứ tự hiện kết quả", "cyan"),
        chip("po-f", 300, 520, "hàm(...) OVER (PARTITION BY nhóm ORDER BY thứ_tự)", "green"),
    ]), beats=[
        ("Phần hai. Partition By chia các dòng thành từng nhóm, còn Order By bên trong Over quy định thứ tự trong nhóm.",
         "Phần 2: PARTITION BY chia nhóm, ORDER BY trong OVER sắp thứ tự.",
         title_beat("po")),
        ("Ta thêm Partition By công ty vào trong Over. Hàm sum bây giờ cộng riêng cho từng chi nhánh.",
         "sum(...) OVER (PARTITION BY company_id)",
         type_q("po-q", 4, 0.3, 1.1) + [DIM("#po-q-1, #po-q-2, #po-q-4", 4.4, 0.2), IN("#po-g", "left", 4.8)]),
        ("Tám tài khoản mẫu của hai chi nhánh. Mỗi chi nhánh là một nhóm, cùng một màu, và không dòng nào bị gộp.",
         "Mỗi màu là một partition: 8 dòng vẫn đủ 8 dòng.",
         [OUT(sel_q("po-q", 4) + ", #po-g", "fade", 0, 0.4)] + show_w("po-t", 8, 0.5, 0.45) + [IN("#po-c1", "left", 5.0)]),
        ("Cột mới điền từng dòng. Nhóm thứ nhất nhận tổng hai mươi lăm triệu, nhóm thứ hai nhận chín mươi bốn triệu.",
         "Cột tong_cn: 25.390.668 cho nhóm 1, 94.231.458 cho nhóm 2.",
         fill_w("po-t", 1, 8, 0.3, 0.45) + [IN("#po-c2", "left", 4.2)]),
        ("Hai Order By khác nhau: bên trong Over là thứ tự để tính, ở cuối câu là thứ tự hiện kết quả. Còn mọi hàm cửa sổ đều chung một dạng.",
         "ORDER BY trong OVER: để tính. ORDER BY cuối câu: để hiện. Mọi hàm cửa sổ cùng một dạng.",
         [OUT(sel_w("po-t", 8, [1]) + ", #po-c1, #po-c2", "fade", 0, 0.4), IN("#po-o1", "left", 0.7), IN("#po-o2", "left", 3.8), DIM("#po-o1, #po-o2", 7.2, 0.2), IN("#po-f", "pop", 7.6)]),
    ]),
    # ------------------------------------------------------------ ranking
    dict(id="ranking", world=(1920, 1080), hud=hud("rk", "ROW_NUMBER, RANK, DENSE_RANK", "Khác nhau ở dòng bằng nhau"), cam="".join([
        big_title("rk", "Xếp hạng", "ROW_NUMBER, RANK, DENSE_RANK"),
        sqlbox("rk-q", 120, 190, 1400, ["SELECT account_id, working_balance,", "  ROW_NUMBER() OVER (ORDER BY working_balance DESC) AS rn,",
                                         "  RANK()       OVER (ORDER BY working_balance DESC) AS rk,", "  DENSE_RANK() OVER (ORDER BY working_balance DESC) AS dr",
                                         "FROM account WHERE company_id = 'VN0010002'", "ORDER BY working_balance DESC, account_id;"], 26),
        wtab("rk-t", 120, 190, [(240, True), (300, True)], ["account_id", "working_balance"], RANK_ROWS,
             [None, "amber", "amber", "green", "green", None, None],
             [(130, "rn", ["8", "9", "10", "11", "12", "13", "14"]), (130, "rk", ["8", "9", "9", "11", "11", "13", "14"]), (130, "dr", ["8", "9", "9", "10", "10", "11", "12"])], 64, 27),
        chip("rk-a1", 1140, 300, "ROW_NUMBER: 9, 10, không bao giờ trùng", "cyan"),
        chip("rk-a2", 1140, 400, "RANK: 9, 9, rồi nhảy tới 11", "amber"),
        chip("rk-a3", 1140, 500, "DENSE_RANK: 9, 9, rồi 10", "green"),
        chip("rk-t1", 300, 300, "ROW_NUMBER gặp dòng bằng nhau: thêm cột phá hoà", "amber"),
        chip("rk-t2", 300, 400, "Xếp giảm dần phải viết DESC", "red"),
    ]), beats=[
        ("Phần ba. Ba hàm xếp hạng đều đánh số các dòng, và chỉ khác nhau ở cách xử lý hai dòng bằng nhau.",
         "Phần 3: ba hàm xếp hạng khác nhau ở dòng đồng hạng.",
         title_beat("rk")),
        ("Ta xếp các tài khoản của chi nhánh thứ hai theo số dư giảm dần, dùng cả ba hàm.",
         "Một chi nhánh, 14 tài khoản, xếp theo số dư giảm dần.",
         type_q("rk-q", 6, 0.3, 0.55)),
        ("Đây là các dòng cuối danh sách. Có hai cặp bằng nhau: số dư hơn mười triệu, và hai tài khoản đã đóng, số dư không.",
         "Hai cặp bằng nhau: 10.176.229 và 0.",
         [OUT(sel_q("rk-q", 6), "fade", 0, 0.4)] + show_w("rk-t", 7, 0.5, 0.4)),
        ("Row Number đánh số liên tục, không trùng. Cặp mười triệu nhận chín và mười.",
         "ROW_NUMBER: liên tục, 9 và 10.",
         fill_w("rk-t", 1, 7, 0.3, 0.55) + [IN("#rk-a1", "left", 4.8)]),
        ("Rank cho cặp bằng nhau cùng hạng chín, rồi bỏ cách: cặp số dư không cùng hạng mười một, không có hạng mười.",
         "RANK: đồng hạng rồi bỏ cách, 9, 9, 11, 11.",
         fill_w("rk-t", 2, 7, 0.3, 0.7) + [IN("#rk-a2", "left", 5.2)]),
        ("Dense Rank cũng đồng hạng nhưng không bỏ cách. Hạng cuối là mười hai, còn Rank là mười bốn.",
         "DENSE_RANK: không bỏ cách. Hạng cuối 12, RANK là 14.",
         fill_w("rk-t", 3, 7, 0.3, 0.7) + [IN("#rk-a3", "left", 5.5)]),
        ("Hai bẫy. Row Number gặp dòng bằng nhau thì không đảm bảo thứ tự, nên thêm cột phá hoà. Và muốn hạng một là lớn nhất phải viết Desc.",
         "Bẫy: thêm cột phá hoà cho ROW_NUMBER; xếp giảm dần phải có DESC.",
         [OUT(sel_w("rk-t", 7, [1, 2, 3]) + ", #rk-a1, #rk-a2, #rk-a3", "fade", 0, 0.4), IN("#rk-t1", "left", 0.8), IN("#rk-t2", "left", 6.2), SHAKE("#rk-t2", 6.8)]),
    ]),
    # ------------------------------------------------------------ lag-lead
    dict(id="lag-lead", world=(1920, 1080), hud=hud("ll", "LAG và LEAD", "Nhìn dòng liền trước, liền sau"), cam="".join([
        big_title("ll", "LAG và LEAD", "So một dòng với dòng bên cạnh"),
        sqlbox("ll-q", 120, 190, 1400, ["SELECT processing_date, total,", "       LAG(total) OVER (ORDER BY processing_date) AS prev_total,",
                                         "       total - LAG(total) OVER (ORDER BY processing_date) AS diff", "FROM d;"], 26),
        chip("ll-d", 120, 470, "d: tổng chuyển khoản DONE, VND, theo ngày (83 ngày)", "violet"),
        wtab("ll-t", 120, 200, [(310, True), (260, True)], ["processing_date", "total"], LAG_ROWS, [None] * 4,
             [(300, "prev_total", ["NULL", "2000000.00", "3000000.00", "1000000.00"]), (320, "diff", ["NULL", "1000000.00", "-2000000.00", "1000000.00"])], 66, 27),
        chip("ll-e1", 120, 600, "LEAD(processing_date) tại 2024-01-04 = 2024-01-11", "cyan"),
        chip("ll-e2", 120, 690, "gap_days = 7: giữa hai ngày không có chuyển khoản", "green"),
        chip("ll-t1", 120, 600, "Dòng trước là dòng trước trong kết quả, không phải hôm qua", "amber"),
        chip("ll-t2", 120, 690, "Thiếu ORDER BY trong OVER: thứ tự không đoán được", "red"),
        chip("ll-t3", 120, 780, "LAG(total, 1, 0): thay NULL bằng 0", "green"),
    ]), beats=[
        ("Phần bốn. Lag nhìn dòng liền trước, còn Lead nhìn dòng liền sau, để so một dòng với dòng bên cạnh.",
         "Phần 4: LAG nhìn dòng trước, LEAD nhìn dòng sau.",
         title_beat("ll")),
        ("Hôm nay chuyển nhiều hơn lần trước bao nhiêu? Ta tính tổng chuyển khoản hoàn tất theo ngày, rồi dùng Lag lấy tổng của dòng trước.",
         "Tổng chuyển khoản theo ngày; LAG lấy tổng của dòng liền trước.",
         type_q("ll-q", 4, 0.3, 1.5) + [IN("#ll-d", "left", 7.2)]),
        ("Dòng đầu chưa có dòng nào đứng trước, nên Lag trả về rỗng, không phải lỗi. Các dòng sau lấy tổng của dòng ngay trên.",
         "Dòng đầu: LAG cho NULL. Các dòng sau lấy giá trị dòng trên.",
         [OUT(sel_q("ll-q", 4) + ", #ll-d", "fade", 0, 0.4)] + show_w("ll-t", 4, 0.5, 0.4) + fill_w("ll-t", 1, 4, 2.6, 0.9)),
        ("Chênh lệch là tổng hôm nay trừ tổng của dòng trước. Ngày mười một tháng một tăng một triệu, ngày mười bảy giảm hai triệu.",
         "diff = total - LAG(total): +1.000.000, rồi -2.000.000.",
         fill_w("ll-t", 2, 4, 0.3, 1.0)),
        ("Lead thì ngược lại, lấy dòng liền sau. Từ ngày bốn tháng một, ngày kế tiếp có chuyển khoản là ngày mười một, cách bảy ngày.",
         "LEAD: dòng liền sau. 2024-01-04 tới 2024-01-11: 7 ngày.",
         [DIM(sel_w("ll-t", 4, [1, 2]), 0, 0.18), IN("#ll-e1", "left", 0.5), IN("#ll-e2", "left", 6.8)]),
        ("Dòng trước là dòng trước trong kết quả, không phải hôm qua theo lịch. Và luôn kèm Order By trong Over. Muốn thay rỗng bằng số khác, thêm tham số thứ ba.",
         "Bẫy: dòng trước không phải hôm qua; luôn có ORDER BY trong OVER.",
         [OUT("#ll-e1, #ll-e2", "fade", 0, 0.4), IN("#ll-t1", "left", 0.6), IN("#ll-t2", "left", 5.0), SHAKE("#ll-t2", 5.6), IN("#ll-t3", "left", 9.5)]),
    ]),
    # ------------------------------------------------------------ running-total
    dict(id="running-total", world=(1920, 1080), hud=hud("rt", "Số dư chạy", "SUM() OVER (ORDER BY ...)"), cam="".join([
        big_title("rt", "Số dư chạy", "SUM() OVER (ORDER BY ...)"),
        sqlbox("rt-q", 120, 190, 1400, ["SELECT stmt_entry_id, booking_date, amount,", "       sum(amount) OVER (ORDER BY booking_date, stmt_entry_id)",
                                         "         AS running_balance", "FROM stmt_entry", "WHERE account_id = '1000000028';"], 26),
        wtab("rt-t", 120, 200, [(240, True), (230, True), (280, True)], ["stmt_entry_id", "booking_date", "amount"], EN28, [None] * 3,
             [(340, "running_balance", ["50000000.00", "50175000.00", "50350612.00"])], 66, 27),
        chip("rt-eq", 120, 520, "Dòng cuối = working_balance của tài khoản: 50350612.00", "green"),
        chip("rt-f1", 220, 230, "Có ORDER BY: từ đầu nhóm tới dòng hiện tại", "green"),
        chip("rt-f2", 220, 330, "Không có ORDER BY: cả nhóm, mọi dòng cùng một tổng", "cyan"),
        chip("rt-f3", 220, 440, "ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW", "violet"),
        wtab("rt-u", 120, 200, [(150, True), (220, True), (260, True)], ["entry_id", "booking_date", "amount"], EN49,
             [None, "amber", "amber", None],
             [(300, "chi_theo_ngay", ["70000000.00", "54000000.00", "54000000.00", "56000000.00"]), (300, "ngay_va_ma", ["70000000.00", "69000000.00", "54000000.00", "56000000.00"])], 70, 27),
        chip("rt-b1", 120, 600, "Hai dòng cùng ngày là ngang hàng, cộng cùng lúc", "red"),
        chip("rt-b2", 120, 690, "Thêm cột duy nhất để phá hoà: 69.000.000 rồi 54.000.000", "green"),
        chip("rt-b3", 120, 780, "Dòng cuối của tài khoản: 74.000.000 = working_balance", "cyan"),
    ]), beats=[
        ("Phần năm. Thêm Order By vào Over của hàm Sum, bạn được số dư chạy, tức là tổng cộng dồn.",
         "Phần 5: SUM() OVER (ORDER BY ...) cho số dư chạy.",
         title_beat("rt")),
        ("Tài khoản này có ba bút toán. Ta cộng dồn tiền theo ngày, rồi theo mã bút toán, từng dòng một.",
         "Cộng dồn amount theo booking_date, stmt_entry_id.",
         type_q("rt-q", 5, 0.3, 1.0)),
        ("Năm mươi triệu, rồi năm mươi triệu một trăm bảy lăm nghìn, rồi hơn năm mươi triệu ba trăm năm mươi nghìn. Dòng cuối đúng bằng số dư của tài khoản, như cột số dư trên sao kê.",
         "50.000.000, 50.175.000, 50.350.612. Dòng cuối = working_balance.",
         [OUT(sel_q("rt-q", 5), "fade", 0, 0.4)] + show_w("rt-t", 3, 0.5, 0.4) + fill_w("rt-t", 1, 3, 2.4, 1.3) + [IN("#rt-eq", "left", 8.6), PULSE("#rt-t-k1-3", 9.2)]),
        ("Cộng dồn tới đâu là do khung quyết định. Có Order By thì khung là từ dòng đầu tới dòng hiện tại. Không có, khung là cả nhóm.",
         "Khung mặc định: có ORDER BY thì đầu nhóm tới dòng hiện tại.",
         [OUT(sel_w("rt-t", 3, [1]) + ", #rt-eq", "fade", 0, 0.4), IN("#rt-f1", "left", 0.6), IN("#rt-f2", "left", 2.8), IN("#rt-f3", "left", 4.8)]),
        ("Bẫy lớn: các dòng cùng giá trị Order By là ngang hàng, nên cộng cùng lúc. Hai bút toán cùng ngày mười ba tháng bảy đều ra năm mươi bốn triệu.",
         "Chỉ ORDER BY ngày: hai dòng cùng ngày cùng ra 54.000.000.",
         [OUT("#rt-f1, #rt-f2, #rt-f3", "fade", 0, 0.4)] + show_w("rt-u", 4, 0.5, 0.35) + fill_w("rt-u", 1, 4, 2.4, 0.9) + [IN("#rt-b1", "left", 7.0), SHAKE("#rt-b1", 7.6)]),
        ("Thêm mã bút toán để phá hoà: sáu mươi chín triệu, rồi năm mươi bốn triệu, và dòng cuối là bảy mươi bốn triệu. Luôn phá hoà bằng một cột duy nhất.",
         "Thêm stmt_entry_id: 69.000.000 rồi 54.000.000; dòng cuối 74.000.000.",
         fill_w("rt-u", 2, 4, 0.3, 1.0) + [IN("#rt-b2", "left", 5.0), IN("#rt-b3", "left", 8.5)]),
    ]),
    # ------------------------------------------------------------ top-n-where
    dict(id="top-n-where", world=(1920, 1080), hud=hud("tn", "Top N mỗi nhóm", "Hàm cửa sổ không dùng trong WHERE"), cam="".join([
        big_title("tn", "Top N mỗi nhóm", "Và lỗi dùng hàm cửa sổ trong WHERE"),
        sqlbox("tn-q", 120, 190, 1200, ["SELECT account_id FROM account", "WHERE ROW_NUMBER() OVER (ORDER BY account_id) = 1;"]),
        errbox("tn-err", 120, 400, 1100, "ERROR: window functions are not allowed in WHERE"),
        el("tn-l1", 0, 250, 1920, None, "Thứ tự chạy logic của câu lệnh", "lbl r", "text-align:center;font-size:34px"),
        flow_chips("tn-o", 420, ["FROM", "WHERE", "GROUP BY", "HAVING", "Hàm cửa sổ", "SELECT", "ORDER BY", "LIMIT"], "cyan"),
        chip("tn-x1", 400, 560, "Lúc WHERE chạy, chưa có hạng nào để so", "red"),
        sqlbox("tn-q2", 120, 190, 1300, ["WITH x AS (", "  SELECT company_id, account_id, working_balance,", "         ROW_NUMBER() OVER (PARTITION BY company_id",
                                          "           ORDER BY working_balance DESC, account_id) AS rn", "  FROM account", ")", "SELECT company_id, account_id, working_balance, rn",
                                          "FROM x WHERE rn <= 3 ORDER BY company_id, rn;"], 24),
        chip("tn-k", 1000, 640, "Lớp trong tính hạng, lớp ngoài lọc", "green"),
        tbl("tn-t", 120, 230, [(240, True), (260, True), (320, True), (120, True)], ["company_id", "account_id", "working_balance", "rn"],
            [["VN0010001", "1000000069", "517967000.00", "1"], ["VN0010001", "1000000022", "280912000.00", "2"], ["VN0010001", "1000000004", "246613000.00", "3"]], 70, 27),
        chip("tn-n", 120, 560, "5 chi nhánh x 3 dòng = 15 dòng", "cyan"),
        chip("tn-c1", 200, 250, "ROW_NUMBER: đúng N dòng mỗi nhóm, nhớ cột phá hoà", "cyan"),
        chip("tn-c2", 200, 450, "RANK, DENSE_RANK: giữ cả dòng đồng hạng, có thể hơn N", "amber"),
        chip("tn-c3", 200, 350, "Bút toán mới nhất mỗi tài khoản: 85 tài khoản, 85 dòng", "green"),
    ]), beats=[
        ("Phần sáu. Bài toán kinh điển: lấy ba tài khoản lớn nhất của mỗi chi nhánh. Trước hết là một lỗi rất hay gặp.",
         "Phần 6: Top N mỗi nhóm và lỗi hàm cửa sổ trong WHERE.",
         title_beat("tn")),
        ("Cách viết hiển nhiên là đặt Row Number ngay trong Where. Nhưng PostgreSQL báo lỗi: hàm cửa sổ không được dùng trong Where.",
         "WHERE ROW_NUMBER() OVER (...) = 1 báo lỗi.",
         type_q("tn-q", 2, 0.3, 1.5) + [IN("#tn-err", "up", 5.6), SHAKE("#tn-err", 6.2)]),
        ("Lý do là thứ tự chạy. From, Where, Group By, Having, rồi mới đến hàm cửa sổ. Lúc Where chạy, chưa có hạng nào.",
         "FROM, WHERE, GROUP BY, HAVING, hàm cửa sổ, SELECT, ORDER BY, LIMIT.",
         [OUT(sel_q("tn-q", 2) + ", #tn-err", "fade", 0, 0.4), IN("#tn-l1", "fade", 0.5)] + [IN(f"#tn-o{i}", "left", 1.0 + i * 0.55) for i in range(8)]
         + [DIM("#tn-o0, #tn-o2, #tn-o3, #tn-o5, #tn-o6, #tn-o7", 6.4, 0.25), IN("#tn-x1", "left", 6.8)]),
        ("Cách sửa: tính hạng ở lớp trong, rồi lọc ở lớp ngoài, nơi rn đã là một cột bình thường.",
         "Tính hạng trong CTE, lọc rn ở lớp ngoài.",
         [OUT("#tn-l1, " + ", ".join(f"#tn-o{i}" for i in range(8)) + ", #tn-x1", "fade", 0, 0.4)] + type_q("tn-q2", 8, 0.4, 0.5) + [IN("#tn-k", "left", 4.2)]),
        ("Ba tài khoản lớn nhất mỗi chi nhánh cho mười lăm dòng. Chi nhánh đầu tiên có số dư lớn nhất hơn năm trăm mười bảy triệu.",
         "Top 3 mỗi chi nhánh: 15 dòng.",
         [OUT(sel_q("tn-q2", 8) + ", #tn-k", "fade", 0, 0.4)] + show_w("tn-t", 3, 0.5, 0.5) + [IN("#tn-n", "left", 3.6)]),
        ("Chọn hàm nào? Row Number khi cần đúng N dòng mỗi nhóm, như bút toán mới nhất của mỗi tài khoản. Rank hoặc Dense Rank khi muốn giữ cả các dòng đồng hạng.",
         "ROW_NUMBER: đúng N dòng. RANK/DENSE_RANK: giữ cả đồng hạng.",
         [OUT(sel_w("tn-t", 3) + ", #tn-n", "fade", 0, 0.4), IN("#tn-c1", "left", 0.7), IN("#tn-c3", "left", 4.0), IN("#tn-c2", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "OVER", "tính trên nhóm dòng, giữ từng dòng"),
                                                ("share", "PARTITION BY", "chia nhóm, không gộp"),
                                                ("box", "Xếp hạng, LAG", "RANK bỏ cách, DENSE_RANK không"),
                                                ("lock", "Số dư chạy", "phá hoà bằng một cột duy nhất")]),
        chip("ou-next", 480, 650, "Bài tiếp: INSERT, UPDATE, DELETE và Transaction", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24", "cta r"),
    ]), beats=[
        ("Tóm lại: hàm cửa sổ tính trên nhóm dòng nhưng giữ nguyên từng dòng. Partition By chia nhóm mà không gộp. Rank bỏ cách khi đồng hạng, Dense Rank thì không. Số dư chạy cần cột phá hoà duy nhất. Hàm cửa sổ không dùng trong Where, nên tính hạng ở lớp trong rồi lọc ở lớp ngoài.",
         "OVER · PARTITION BY · xếp hạng, LAG · số dư chạy · top N qua CTE.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 5.0), IN("#ou-c2", "pop", 8.5), IN("#ou-c3", "pop", 12.5)]),
        ("Bài tiếp: Insert, Update, Delete và Transaction.", "Bài tiếp: INSERT, UPDATE, DELETE và Transaction.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay chạy SQL trên dữ liệu T hai mươi bốn nhé.",
         "Mở bài học tương tác để làm quiz và tự chạy SQL trên dữ liệu T24 nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
