"""SQL ERD explainer: scene layouts and per-beat narration + motion.

Source: web lesson sql-erd.ts. Every query and result on screen was run with web/scripts/run-sql.mjs (PostgreSQL 18, T24 dataset):
11 public tables (account, account_officer, category, company, currency, customer, funds_transfer, loan, sector, stmt_entry, txn_type);
loan 9 columns (ld_id, customer_id, account_id, principal, ccy, interest_rate, start_date, maturity_date, status);
customer 100035: accounts 1000000058 (1001 VND), 1000000059 (6001 VND), 1000000060 (1001 USD), 1000000076 (3002 VND), city Hải Phòng;
funds_transfer debit_account 1000000001: 8 rows (FT240000007 ... FT240000132), 7 distinct credit accounts, last two PENDING;
account FKs: account_category_id_fkey, account_ccy_fkey, account_company_id_fkey, account_customer_id_fkey;
stmt_entry: stmt_entry_account_id_fkey, stmt_entry_ft_id_fkey, stmt_entry_pkey, stmt_entry_txn_code_fkey;
17 foreign keys in total (first six rows by table, constraint name as returned); funds_transfer FKs: ccy, credit_account, debit_account;
stmt_entry ft_id NULL 686 of 932, 123 distinct ft_id (246 entries); sector 1000 Cá nhân, 1100 Cá nhân cao cấp, 2000 Doanh nghiệp nhỏ và vừa, 3000 Doanh nghiệp lớn;
CREATE TABLE loan_note with integer FK -> foreign key constraint "loan_note_account_id_fkey" cannot be implemented;
CREATE TABLE debit_card (as in the lesson solution) -> ok. Illustration tables (phones, customer_name, sector_description) follow the lesson text.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SQL_TOKEN = re.compile(
    r"(?P<s>'[^']*')|(?P<k>\b(?:SELECT|FROM|WHERE|AND|ORDER BY|CREATE TABLE|PRIMARY KEY|NOT NULL|REFERENCES)\b)"
    r"|(?P<t>\b(?:varchar|integer|date)\b)|(?P<n>\b\d+\b)|(?P<x>.)", re.S)
SQL_COLOR = dict(s="#a7f3d0", k="#c4b5fd", n="#9cc3ff", t="#fcd34d")


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


def okbox(id_, x, y, w, text):
    return el(id_, x, y, w, None, esc(text), "err r",
              "color:#9be37a;border-color:var(--green);background:linear-gradient(165deg,rgba(74,222,128,.16),rgba(6,24,12,.85));box-shadow:none")


def field(id_, x, y, w, title, rows, tone):
    """Table card for the ERD pictures: title bar plus one line per column; rows = [(name, tag)]."""
    body = "".join(f'<div style="display:flex;justify-content:space-between;padding:6px 26px;font:500 28px var(--mono)">'
                   f'<span>{esc(n)}</span><b style="color:var(--{"amber" if t == "FK" else "green"})">{t}</b></div>' for n, t in rows)
    return box(id_, x, y, w, None, f'{win(title)}<div style="padding:10px 0 14px">{body}</div>', tone, "panel")


def mk(id_, x, y, text, tone="cyan", size=36):
    """Cardinality marker (1 or N) placed next to an arrow end."""
    return el(id_, x, y, 60, None, esc(text), "lbl r", f"font:700 {size}px var(--mono);color:var(--{tone})")


def seq(id_, n, d0, step, first=1):
    """Reveal lines <id>-first..n one by one (typed)."""
    return [IN(f"#{id_}-{i}", "type1", d0 + (i - first) * step, 0.3) for i in range(first, n + 1)]


def rowsin(prefix, n, d0, step):
    return [IN(f"#{prefix}-h", "left", d0)] + [IN(f"#{prefix}-{i}", "left", d0 + i * step) for i in range(1, n + 1)]


def ids(prefix, n, first=1):
    return ", ".join(f"#{prefix}-{i}" for i in range(first, n + 1))


# ---------------------------------------------------------------- ERD geometry (scene erd-t24)
EW, EH, OX, OY, SC = 260, 60, 150, 110, 1.55
ET = {  # name: (x, y, tone) in widget units
    "sector": (20, 30, "cyan"), "company": (260, 30, "cyan"), "category": (560, 30, "cyan"),
    "account_officer": (20, 170, "amber"), "customer": (260, 170, "amber"), "account": (560, 170, "amber"),
    "currency": (790, 170, "cyan"), "loan": (790, 320, "amber"), "funds_transfer": (560, 320, "amber"),
    "txn_type": (20, 470, "cyan"), "stmt_entry": (260, 470, "amber"),
}
EFK = [  # child, parent, shift
    ("account_officer", "company", 0), ("customer", "sector", 0), ("customer", "account_officer", 0), ("customer", "company", 0),
    ("account", "customer", 0), ("account", "category", 0), ("account", "currency", 0), ("account", "company", 0),
    ("funds_transfer", "account", -18), ("funds_transfer", "account", 18), ("funds_transfer", "currency", 0),
    ("stmt_entry", "account", 0), ("stmt_entry", "txn_type", 0), ("stmt_entry", "funds_transfer", 0),
    ("loan", "customer", 0), ("loan", "account", 0), ("loan", "currency", 0),
]


def epos(name):
    x, y, _ = ET[name]
    return OX + x * SC, OY + y * SC


def ectr(name):
    x, y = epos(name)
    return x + EW / 2, y + EH / 2


def eedge(name, to, shift):
    cx, cy = ectr(name)
    dx, dy = to[0] - cx, to[1] - cy
    k = min(EW / 2 / abs(dx) if dx else 1e9, EH / 2 / abs(dy) if dy else 1e9)
    px, py = cx + dx * k, cy + dy * k
    sh = shift * SC
    return (px + sh, py) if abs(dy) * (EW / 2) > abs(dx) * (EH / 2) else (px, py + sh)


def emark(frm, end, gap, side):
    ln = math.hypot(end[0] - frm[0], end[1] - frm[1]) or 1
    ux, uy = (end[0] - frm[0]) / ln, (end[1] - frm[1]) / ln
    return end[0] - ux * gap - uy * side, end[1] - uy * gap + ux * side


EGEO = []
for _i, (_c, _p, _s) in enumerate(EFK):
    _a = eedge(_c, ectr(_p), _s)
    _b = eedge(_p, ectr(_c), _s)
    EGEO.append((_a, _b))


def erd_markup():
    parts, arrs = [], []
    for i, ((a, b), (c, p, _)) in enumerate(zip(EGEO, EFK)):
        arrs.append(arrow(f"er-a{i}", [a, b], "cyan"))
        mn = emark(b, a, 26, 20)
        mo = emark(a, b, 26, 20)
        parts.append(mk(f"er-n{i}", mn[0] - 30, mn[1] - 22, "N", "amber", 28))
        parts.append(mk(f"er-o{i}", mo[0] - 30, mo[1] - 22, "1", "green", 28))
    boxes = []
    for name, (x, y, tone) in ET.items():
        px, py = epos(name)
        boxes.append(el(f"er-t-{name}", px, py, EW, EH, f'<span style="font:600 24px var(--mono)">{name}</span>',
                        f"gbox {tone} r", "display:flex;align-items:center;justify-content:center;border-radius:14px"))
    return wires(*arrs) + "".join(boxes) + "".join(parts)


def efocus(tables, fks):
    """Selector of everything that stays bright: tables plus the chosen foreign keys (indexes into EFK)."""
    s = [f"#er-t-{t}" for t in tables]
    for i in fks:
        s += [f"#er-a{i}", f"#er-n{i}", f"#er-o{i}"]
    return ", ".join(s)


def erest(tables, fks):
    """Selector of everything else (to dim)."""
    s = [f"#er-t-{t}" for t in ET if t not in tables]
    for i in range(len(EFK)):
        if i not in fks:
            s += [f"#er-a{i}", f"#er-n{i}", f"#er-o{i}"]
    return ", ".join(s)


ALL_ER = erest([], [])


def e_arrows(d0, step, dur=0.5):
    out = []
    for i in range(len(EFK)):
        t = d0 + i * step
        out += [*ARROW(f"er-a{i}", t, dur), IN(f"#er-n{i}", "pop", t + dur - 0.1, 0.2), IN(f"#er-o{i}", "pop", t + dur - 0.1, 0.2)]
    return out


ER_ALL_BOXES = ", ".join(f"#er-t-{t}" for t in ET)
ER_ALL_ARROWS = ", ".join(f"#er-a{i}, #er-n{i}, #er-o{i}" for i in range(len(EFK)))
FT_IN_ACCOUNT = [8, 9]
ACC_IN = [8, 9, 11, 15]
CO_IN = [0, 3, 7]
CCY_IN = [6, 10, 16]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Thiết kế database", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Cột nối hai bảng nên đặt ở đâu?"), "h1 center r"),
        field("hk-c", 300, 440, 520, "customer", [("customer_id", "PK"), ("full_name", ""), ("city", "")], "green"),
        field("hk-a0", 1100, 440, 520, "account", [("account_id", "PK"), ("customer_id", ""), ("ccy", "")], "amber"),
        field("hk-a", 1100, 440, 520, "account", [("account_id", "PK"), ("customer_id", "FK"), ("ccy", "")], "amber"),
        el("hk-qm", 860, 500, 200, None, "?", "lbl r", "font:700 90px var(--mono);color:var(--amber)"),
        wires(arrow("hk-ar", [(1100, 560), (820, 560)], "amber")),
        mk("hk-n", 1030, 505, "N", "amber"), mk("hk-1", 840, 505, "1", "green"),
        tile("hk-tile", 400, 350, 220, "share"),
        el("hk-word", 670, 380, 1200, None, letters("Thiết kế ERD"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Yêu cầu · ERD · Lược đồ · CREATE TABLE", "kin-sub r"),
    ]), beats=[
        ("Mỗi tài khoản thuộc một khách, một khách có nhiều tài khoản. Cột nối hai bảng nên đặt ở đâu?",
         "Mỗi tài khoản thuộc một khách, một khách có nhiều tài khoản. Cột nối đặt ở đâu?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-c", "up", 3.0), IN("#hk-a0", "up", 3.8), IN("#hk-qm", "pop", 5.0)]),
        ("Phía nhiều giữ mã của phía một. Cột customer id nằm ở bảng account.",
         "Phía nhiều giữ mã của phía một: account.customer_id trỏ về customer.",
         [OUT("#hk-qm", "fade", 0, 0.3), OUT("#hk-a0", "fade", 0.2, 0.4), IN("#hk-a", "fade", 0.3, 0.4), *ARROW("hk-ar", 1.2, 0.8),
          IN("#hk-1", "pop", 1.8), IN("#hk-n", "pop", 2.2)]),
        ("Hôm nay ta đi từ yêu cầu nghiệp vụ, qua sơ đồ thực thể, đến những bảng thật.",
         "Hôm nay: từ yêu cầu nghiệp vụ, qua ERD, đến các bảng có khoá chính và khoá ngoại.",
         [OUT("#hk-eye, #hk-q, #hk-c, #hk-a, #hk-ar, #hk-n, #hk-1", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ business-to-erd
    dict(id="business-to-erd", world=(1920, 1080), hud=hud("be", "Từ yêu cầu đến thực thể", "Danh từ thành bảng, thông tin thành cột"), cam="".join([
        big_title("be", "Từ yêu cầu đến thực thể", "Thiết kế bắt đầu từ lời mô tả, chưa phải từ SQL"),
        el("be-req", 160, 200, 1600, None,
           'Ngân hàng có nhiều <b style="color:var(--cyan)">chi nhánh</b>. Mỗi <b style="color:var(--cyan)">khách hàng</b> do một '
           '<b style="color:var(--cyan)">cán bộ</b> <i style="color:var(--amber)">quản lý</i>. Khách hàng <i style="color:var(--amber)">mở</i> '
           'nhiều <b style="color:var(--cyan)">tài khoản</b>. Tài khoản có thể <i style="color:var(--amber)">chuyển tiền</i> cho tài khoản khác.',
           "note left r", "font-size:36px;line-height:1.55;color:#e6e9f0;font-style:normal"),
        chip("be-e", 160, 560, "Thực thể (danh từ): thứ cần lưu, thành một bảng", "cyan"),
        chip("be-t", 160, 650, "Thuộc tính: thông tin mô tả, thành một cột", "green"),
        chip("be-r", 160, 740, "Quan hệ (động từ): cách các thực thể liên quan nhau", "amber"),
        gnode("be-p1", 130, 300, 340, 100, "Yêu cầu nghiệp vụ", "cyan"), gnode("be-p2", 590, 300, 340, 100, "ERD", "cyan"),
        gnode("be-p3", 1050, 300, 340, 100, "Lược đồ quan hệ", "cyan"), gnode("be-p4", 1510, 300, 340, 100, "CREATE TABLE", "green"),
        wires(arrow("be-w1", [(470, 350), (590, 350)], "cyan"), arrow("be-w2", [(930, 350), (1050, 350)], "cyan"),
              arrow("be-w3", [(1390, 350), (1510, 350)], "cyan")),
        el("be-sc", 160, 520, 1600, None,
           'account(<b style="color:var(--green)">account_id</b>, <b style="color:var(--amber)">customer_id</b>, category_id, ccy, ...)',
           "note left r", "font:500 36px var(--mono);color:#e6e9f0"),
        chip("be-sn", 160, 620, "Lược đồ quan hệ: danh sách bảng và cột, ghi gọn", "violet"),
        sqlbox("be-q", 120, 190, 1040, ["SELECT column_name, data_type", "FROM information_schema.columns",
                                        "WHERE table_schema = 'public' AND table_name = 'loan'", "ORDER BY ordinal_position;"], 27),
        tbl("be-t9", 1210, 190, [(300, True), (330, False)], ["column_name", "data_type"],
            [["ld_id", "character varying"], ["customer_id", "integer"], ["account_id", "character varying"], ["principal", "numeric"],
             ["ccy", "character"], ["interest_rate", "numeric"], ["start_date", "date"], ["maturity_date", "date"],
             ["status", "character varying"]], 66, 26),
        chip("be-c1", 120, 520, "T24: 11 bảng = 11 thực thể", "cyan"),
        chip("be-c2", 120, 610, "loan: 9 cột = 9 thuộc tính", "green"),
    ]), beats=[
        ("Phần một. Thiết kế database bắt đầu từ lời mô tả nghiệp vụ, chưa phải từ SQL.",
         "Phần 1: thiết kế bắt đầu từ lời mô tả nghiệp vụ, chưa phải từ SQL.",
         [TYPE("#be-big", 0.1, 0.06), IN("#be-bsub", "blur", 0.9), OUT("#be-big, #be-bsub", "zoom", 3.4), IN("#be-hud", "left", 4.0)]),
        ("Ví dụ: ngân hàng có chi nhánh, khách hàng, cán bộ và tài khoản. Khách mở tài khoản, tài khoản chuyển tiền cho nhau.",
         "Yêu cầu: chi nhánh, khách hàng, cán bộ, tài khoản, và các việc: quản lý, mở, chuyển tiền.",
         [IN("#be-req", "blur", 0.3, 0.8)]),
        ("Danh từ là thực thể, thành một bảng. Thông tin mô tả là thuộc tính, thành một cột. Động từ là quan hệ giữa các thực thể.",
         "Thực thể thành bảng, thuộc tính thành cột, quan hệ nối các bảng.",
         [DIM("#be-req", 0, 0.25), IN("#be-e", "left", 0.4), IN("#be-t", "left", 3.6), IN("#be-r", "left", 6.8)]),
        ("Quy trình có bốn bước: yêu cầu, sơ đồ ERD, lược đồ quan hệ, rồi mới đến Create Table.",
         "Yêu cầu, ERD, lược đồ quan hệ, rồi mới đến CREATE TABLE.",
         [OUT("#be-req, #be-e, #be-t, #be-r", "fade", 0, 0.4), IN("#be-p1", "pop", 0.4), *ARROW("be-w1", 1.0, 0.5), IN("#be-p2", "pop", 1.6),
          *ARROW("be-w2", 2.4, 0.5), IN("#be-p3", "pop", 3.0), *ARROW("be-w3", 3.8, 0.5), IN("#be-p4", "pop", 4.4),
          IN("#be-sc", "up", 4.6), IN("#be-sn", "left", 5.0)]),
        ("Ngân hàng T24 giả lập có mười một bảng, tức mười một thực thể. Bảng khoản vay có chín cột.",
         "T24: 11 bảng. Bảng loan có 9 cột.",
         [OUT("#be-p1, #be-p2, #be-p3, #be-p4, #be-w1, #be-w2, #be-w3, #be-sc, #be-sn", "fade", 0, 0.4), IN("#be-q", "up", 0.5, 0.4), *seq("be-q", 4, 0.7, 0.4),
          *rowsin("be-t9", 9, 2.6, 0.3), IN("#be-c1", "left", 2.0), IN("#be-c2", "left", 4.6)]),
    ]),
    # ------------------------------------------------------------ cardinality
    dict(id="cardinality", world=(1920, 1080), hud=hud("ca", "Bản số", "Một dòng nối với tối đa mấy dòng bên kia"), cam="".join([
        big_title("ca", "Bản số", "Một bên nối được với tối đa mấy bên kia"),
        gnode("ca-a1", 260, 210, 400, 90, "Công dân", "cyan"), gnode("ca-b1", 1260, 210, 400, 90, "Số căn cước", "cyan"),
        gnode("ca-a2", 260, 400, 400, 90, "Khách hàng", "cyan"), gnode("ca-b2", 1260, 400, 400, 90, "Tài khoản", "green"),
        gnode("ca-a3", 260, 590, 400, 90, "Khách hàng", "cyan"), gnode("ca-b3", 1260, 590, 400, 90, "Loại sản phẩm", "violet"),
        wires(arrow("ca-w1", [(660, 255), (1260, 255)], "cyan"), arrow("ca-w2", [(660, 445), (1260, 445)], "green"),
              arrow("ca-w3", [(660, 635), (1260, 635)], "violet")),
        mk("ca-m1a", 690, 195, "1", "green"), mk("ca-m1b", 1180, 195, "1", "green"),
        mk("ca-m2a", 690, 385, "1", "green"), mk("ca-m2b", 1180, 385, "N", "amber"),
        mk("ca-m3a", 690, 575, "N", "amber"), mk("ca-m3b", 1180, 575, "N", "amber"),
        el("ca-k1", 860, 190, 200, None, "1-1", "lbl r", "font:700 40px var(--mono);color:var(--cyan)"),
        el("ca-k2", 860, 380, 200, None, "1-N", "lbl r", "font:700 40px var(--mono);color:var(--green)"),
        el("ca-k3", 860, 570, 200, None, "N-N", "lbl r", "font:700 40px var(--mono);color:var(--violet)"),
        chip("ca-q1", 160, 780, "Mỗi A có tối đa mấy B?", "cyan"),
        chip("ca-q2", 160, 870, "Mỗi B có tối đa mấy A?", "violet"),
        gnode("ca-j1", 120, 250, 400, 100, "customer", "cyan"), gnode("ca-j2", 760, 250, 400, 100, "account", "amber"),
        gnode("ca-j3", 1400, 250, 400, 100, "category", "violet"),
        wires(arrow("ca-v1", [(760, 300), (520, 300)], "cyan"), arrow("ca-v2", [(1160, 300), (1400, 300)], "violet")),
        mk("ca-p1", 520, 230, "1", "green", 32), mk("ca-p2", 700, 230, "N", "amber", 32),
        mk("ca-p3", 1160, 230, "N", "amber", 32), mk("ca-p4", 1340, 230, "1", "green", 32),
        chip("ca-jn", 160, 470, "account: bảng trung gian, tách N-N thành hai quan hệ 1-N", "amber"),
        chip("ca-ft", 160, 560, "funds_transfer: nối tài khoản gửi với tài khoản nhận", "green"),
        sqlbox("ca-s1", 160, 190, 1100, ["SELECT account_id, category_id, ccy", "FROM account", "WHERE customer_id = 100035", "ORDER BY account_id;"], 28),
        tbl("ca-r1", 160, 460, [(300, True), (300, True), (160, True)], ["account_id", "category_id", "ccy"],
            [["1000000058", "1001", "VND"], ["1000000059", "6001", "VND"], ["1000000060", "1001", "USD"], ["1000000076", "3002", "VND"]], 62, 28),
        chip("ca-r1c", 1000, 520, "1 khách : 4 tài khoản", "green"),
    ]), beats=[
        ("Phần hai. Bản số cho biết một dòng bên này nối được với tối đa mấy dòng bên kia.",
         "Phần 2: bản số cho biết một dòng nối được với tối đa mấy dòng bên kia.",
         [TYPE("#ca-big", 0.1, 0.06), IN("#ca-bsub", "blur", 0.9), OUT("#ca-big, #ca-bsub", "zoom", 3.4), IN("#ca-hud", "left", 4.0)]),
        ("Ba loại. Một một: một công dân, một số căn cước. Một nhiều: một khách, nhiều tài khoản. Nhiều nhiều: khách và loại sản phẩm, mỗi bên đều nhiều.",
         "1-1, 1-N, N-N: căn cước, tài khoản, loại sản phẩm.",
         [IN("#ca-a1", "pop", 0.3), IN("#ca-b1", "pop", 0.5), *ARROW("ca-w1", 0.9, 0.5), IN("#ca-m1a", "pop", 1.3), IN("#ca-m1b", "pop", 1.5), IN("#ca-k1", "fade", 1.7),
          IN("#ca-a2", "pop", 3.4), IN("#ca-b2", "pop", 3.6), *ARROW("ca-w2", 4.0, 0.5), IN("#ca-m2a", "pop", 4.4), IN("#ca-m2b", "pop", 4.6), IN("#ca-k2", "fade", 4.8),
          IN("#ca-a3", "pop", 7.2), IN("#ca-b3", "pop", 7.4), *ARROW("ca-w3", 7.8, 0.5), IN("#ca-m3a", "pop", 8.2), IN("#ca-m3b", "pop", 8.4), IN("#ca-k3", "fade", 8.6)]),
        ("Cách xác định: hỏi hai câu. Mỗi A có tối đa mấy B, và mỗi B có tối đa mấy A.",
         "Hỏi hai chiều: mỗi A có tối đa mấy B, mỗi B có tối đa mấy A.",
         [IN("#ca-q1", "left", 0.8), IN("#ca-q2", "left", 3.2)]),
        ("Nhiều nhiều không nối thẳng được. Ta chen bảng trung gian vào giữa, và nó tách thành hai quan hệ một nhiều. Như bảng account, hay bảng funds transfer.",
         "N-N tách thành hai 1-N qua bảng trung gian: account, funds_transfer.",
         [OUT("#ca-a1, #ca-b1, #ca-a2, #ca-b2, #ca-a3, #ca-b3, #ca-w1, #ca-w2, #ca-w3, #ca-m1a, #ca-m1b, #ca-m2a, #ca-m2b, #ca-m3a, #ca-m3b, #ca-k1, #ca-k2, #ca-k3, #ca-q1, #ca-q2", "fade", 0, 0.4),
          IN("#ca-j1", "pop", 0.5), IN("#ca-j3", "pop", 0.7), IN("#ca-j2", "pop", 1.1), *ARROW("ca-v1", 1.7, 0.5), *ARROW("ca-v2", 2.0, 0.5),
          IN("#ca-p1", "pop", 2.4), IN("#ca-p2", "pop", 2.5), IN("#ca-p3", "pop", 2.6), IN("#ca-p4", "pop", 2.7), IN("#ca-jn", "left", 3.4), IN("#ca-ft", "left", 6.8)]),
        ("Khách một không không không ba mươi lăm có bốn tài khoản: quan hệ một nhiều.",
         "Khách 100035 có 4 tài khoản: quan hệ 1-N.",
         [OUT("#ca-j1, #ca-j2, #ca-j3, #ca-v1, #ca-v2, #ca-p1, #ca-p2, #ca-p3, #ca-p4, #ca-jn, #ca-ft", "fade", 0, 0.4), IN("#ca-s1", "up", 0.5, 0.4), *seq("ca-s1", 4, 0.8, 0.4),
          *rowsin("ca-r1", 4, 2.6, 0.4), IN("#ca-r1c", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ keys-schema
    dict(id="keys-schema", world=(1920, 1080), hud=hud("ks", "Khoá chính, khoá ngoại", "Biến ERD thành bảng"), cam="".join([
        big_title("ks", "Khoá và lược đồ", "Ba quy tắc biến ERD thành bảng"),
        # rule 1-N
        field("ks-c1", 160, 230, 560, "customer", [("customer_id", "PK"), ("full_name", "")], "green"),
        field("ks-a1", 1160, 230, 600, "account", [("account_id", "PK"), ("customer_id", "FK"), ("ccy", "")], "amber"),
        wires(arrow("ks-w1", [(1160, 340), (720, 340)], "amber")),
        mk("ks-m1a", 1090, 285, "N", "amber"), mk("ks-m1b", 745, 285, "1", "green"),
        chip("ks-r1", 160, 620, "1-N: khoá ngoại nằm ở bảng phía nhiều", "amber"),
        # rule N-N
        field("ks-c2", 160, 200, 520, "account", [("account_id", "PK")], "amber"),
        field("ks-a2", 1240, 200, 520, "customer", [("customer_id", "PK")], "green"),
        field("ks-j2", 700, 500, 520, "account_holder", [("account_id", "PK FK"), ("customer_id", "PK FK"), ("holder_type", "")], "violet"),
        wires(arrow("ks-w2", [(800, 500), (560, 330)], "violet"), arrow("ks-w3", [(1120, 500), (1360, 330)], "violet")),
        mk("ks-n2a", 740, 440, "N", "amber", 32), mk("ks-n2b", 610, 335, "1", "green", 32),
        mk("ks-n3a", 1170, 440, "N", "amber", 32), mk("ks-n3b", 1275, 335, "1", "green", 32),
        chip("ks-r2", 160, 840, "N-N: bảng trung gian, khoá chính gộp hai cột", "violet"),
        # rule 1-1
        field("ks-c3", 160, 230, 560, "customer", [("customer_id", "PK"), ("full_name", "")], "green"),
        field("ks-a3", 1160, 230, 600, "customer_kyc", [("customer_id", "PK FK"), ("risk_level", "")], "amber"),
        wires(arrow("ks-w4", [(1160, 320), (720, 320)], "amber")),
        mk("ks-m4a", 1090, 265, "1", "green"), mk("ks-m4b", 745, 265, "1", "green"),
        chip("ks-r3", 160, 620, "1-1: khoá ngoại cũng là khoá chính của bảng phụ", "cyan"),
        # schema notation
        el("ks-sc", 160, 260, 1600, None,
           'account(<b style="color:var(--green)">account_id PK</b>, <b style="color:var(--amber)">customer_id FK</b>, '
           '<b style="color:var(--amber)">category_id FK</b>, <b style="color:var(--amber)">ccy FK</b>, '
           '<b style="color:var(--amber)">company_id FK</b>, open_date, ...)',
           "note left r", "font:500 38px var(--mono);color:#e6e9f0;line-height:1.6"),
        chip("ks-s1", 160, 560, "Nhìn một dòng là biết account trỏ tới 4 bảng khác", "amber"),
        # fk query
        sqlbox("ks-q1", 120, 190, 1700, ["SELECT constraint_name, constraint_type", "FROM information_schema.table_constraints",
                                         "WHERE table_schema = 'public' AND table_name = 'account' AND constraint_type = 'FOREIGN KEY'",
                                         "ORDER BY constraint_name;"], 26),
        tbl("ks-t1", 160, 480, [(560, True), (320, True)], ["constraint_name", "constraint_type"],
            [["account_category_id_fkey", "FOREIGN KEY"], ["account_ccy_fkey", "FOREIGN KEY"], ["account_company_id_fkey", "FOREIGN KEY"],
             ["account_customer_id_fkey", "FOREIGN KEY"]], 62, 28),
        chip("ks-t1c", 1130, 530, "4 dòng = 4 khoá ngoại", "amber"),
        chip("ks-n1", 160, 810, "Tên: <bảng>_pkey và <bảng>_<cột>_fkey", "cyan"),
        chip("ks-n2", 160, 890, "Khoá ngoại đi theo phía nhiều: account_officer.company_id", "amber"),
    ]), beats=[
        ("Phần ba. Ta dùng khoá chính và khoá ngoại để biến sơ đồ thành bảng, theo ba quy tắc.",
         "Phần 3: dùng khoá chính và khoá ngoại để biến ERD thành bảng.",
         [TYPE("#ks-big", 0.1, 0.06), IN("#ks-bsub", "blur", 0.9), OUT("#ks-big, #ks-bsub", "zoom", 3.4), IN("#ks-hud", "left", 4.0)]),
        ("Với quan hệ một nhiều, khoá ngoại nằm ở bảng phía nhiều, trỏ về khoá chính phía một.",
         "1-N: khoá ngoại ở bảng phía nhiều, trỏ về khoá chính phía một.",
         [IN("#ks-c1", "up", 0.3), IN("#ks-a1", "up", 0.8), *ARROW("ks-w1", 1.8, 0.6), IN("#ks-m1a", "pop", 2.2), IN("#ks-m1b", "pop", 2.4), IN("#ks-r1", "left", 3.2)]),
        ("Nhiều nhiều: tạo bảng trung gian có hai khoá ngoại, khoá chính gộp cả hai cột.",
         "N-N: bảng trung gian có hai khoá ngoại, khoá chính gộp hai cột.",
         [OUT("#ks-c1, #ks-a1, #ks-w1, #ks-m1a, #ks-m1b, #ks-r1", "fade", 0, 0.4), IN("#ks-c2", "up", 0.4), IN("#ks-a2", "up", 0.6), IN("#ks-j2", "up", 1.0),
          *ARROW("ks-w2", 1.8, 0.5), *ARROW("ks-w3", 2.2, 0.5), IN("#ks-n2a", "pop", 2.3), IN("#ks-n2b", "pop", 2.4), IN("#ks-n3a", "pop", 2.6), IN("#ks-n3b", "pop", 2.7),
          IN("#ks-r2", "left", 3.6)]),
        ("Một một: khoá ngoại không được trùng, nên làm luôn khoá chính của bảng phụ.",
         "1-1: khoá ngoại không được trùng, nên làm luôn khoá chính của bảng phụ.",
         [OUT("#ks-c2, #ks-a2, #ks-j2, #ks-w2, #ks-w3, #ks-n2a, #ks-n2b, #ks-n3a, #ks-n3b, #ks-r2", "fade", 0, 0.4), IN("#ks-c3", "up", 0.4), IN("#ks-a3", "up", 0.7),
          *ARROW("ks-w4", 1.5, 0.6), IN("#ks-m4a", "pop", 2.0), IN("#ks-m4b", "pop", 2.2), IN("#ks-r3", "left", 3.2)]),
        ("Lược đồ quan hệ ghi gọn kết quả: account có khoá chính account id và bốn khoá ngoại.",
         "account(account_id PK, customer_id FK, category_id FK, ccy FK, company_id FK, ...)",
         [OUT("#ks-c3, #ks-a3, #ks-w4, #ks-m4a, #ks-m4b, #ks-r3", "fade", 0, 0.4), IN("#ks-sc", "blur", 0.5, 0.8), IN("#ks-s1", "left", 4.0)]),
        ("Hỏi information schema, bảng account có đúng bốn khoá ngoại, tên dạng bảng, cột, rồi fkey. Nhớ rằng khoá ngoại luôn đi theo phía nhiều.",
         "account có 4 khoá ngoại. Khoá ngoại đi theo phía nhiều: account_officer.company_id.",
         [OUT("#ks-sc, #ks-s1", "fade", 0, 0.4), IN("#ks-q1", "up", 0.5, 0.4), *seq("ks-q1", 4, 0.8, 0.5), *rowsin("ks-t1", 4, 3.0, 0.4), IN("#ks-t1c", "left", 4.8),
          IN("#ks-n1", "left", 6.0), IN("#ks-n2", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ erd-t24
    dict(id="erd-t24", world=(1920, 1080), hud=hud("er", "ERD của 11 bảng T24", "17 khoá ngoại nối 11 bảng"), cam="".join([
        big_title("er", "ERD của 11 bảng T24", "Nhìn toàn cảnh ngân hàng giả lập"),
        erd_markup(),
        chip("er-l1", 1000, 740, "6 bảng giữ khoá ngoại", "amber"),
        chip("er-l2", 1000, 820, "5 bảng danh mục, chỉ được trỏ tới", "cyan"),
        chip("er-c1", 1000, 740, "account: 4 khoá ngoại trỏ về", "amber"),
        chip("er-c2", 1000, 820, "company, currency: 3. customer: 2", "cyan"),
        chip("er-d1", 1000, 690, "Một lệnh chuyển có hai đầu", "violet"),
        tbl("er-ft", 1100, 760, [(760, True)], ["constraint_name"],
            [["funds_transfer_ccy_fkey"], ["funds_transfer_credit_account_fkey"], ["funds_transfer_debit_account_fkey"]], 42, 22),
        chip("er-z1", 1000, 740, "stmt_entry.ft_id: được phép NULL", "amber"),
        chip("er-z2", 1000, 820, "686 trong 932 bút toán không thuộc lệnh chuyển nào", "red"),
        chip("er-z3", 1000, 820, "246 bút toán thuộc 123 lệnh chuyển, mỗi lệnh 2 bút toán", "green"),
    ]), beats=[
        ("Phần bốn. Toàn cảnh mười một bảng của ngân hàng T24, và các khoá ngoại nối chúng lại.",
         "Phần 4: toàn cảnh 11 bảng T24.",
         [TYPE("#er-big", 0.1, 0.06), IN("#er-bsub", "blur", 0.9), OUT("#er-big, #er-bsub", "zoom", 3.4), IN("#er-hud", "left", 4.0)]),
        ("Mười một bảng nối nhau bằng mười bảy khoá ngoại. Mỗi mũi tên đi từ đầu N đến đầu một.",
         "17 khoá ngoại: mũi tên đi từ đầu N đến đầu 1.",
         [*[IN(f"#er-t-{t}", "pop", 0.2 + 0.12 * i) for i, t in enumerate(ET)], *e_arrows(1.6, 0.2, 0.4)]),
        ("Sáu bảng giữ khoá ngoại. Năm bảng danh mục chỉ được trỏ tới.",
         "6 bảng giữ khoá ngoại, 5 bảng danh mục chỉ được trỏ tới.",
         [IN("#er-l1", "left", 0.3), IN("#er-l2", "left", 2.4)]),
        ("Bảng account được trỏ tới nhiều nhất, bốn khoá ngoại. Company và currency ba, customer hai.",
         "account được trỏ tới nhiều nhất: 4 khoá ngoại.",
         [OUT("#er-l1, #er-l2", "fade", 0, 0.3), DIM(erest(["account", "funds_transfer", "stmt_entry", "loan"], ACC_IN), 0.2, 0.12), IN("#er-c1", "left", 0.5), IN("#er-c2", "left", 3.6)]),
        ("Funds transfer có hai khoá ngoại cùng trỏ về account, vì một lệnh chuyển có hai đầu: gửi và nhận.",
         "funds_transfer: hai khoá ngoại cùng trỏ về account (gửi và nhận).",
         [OUT("#er-c1, #er-c2", "fade", 0, 0.3), DIM(ALL_ER, 0.0, 1), DIM(erest(["funds_transfer", "account", "currency"], FT_IN_ACCOUNT + [10]), 0.2, 0.12), IN("#er-d1", "left", 0.5),
          IN("#er-ft-h", "left", 3.6), IN("#er-ft-1", "left", 4.0), IN("#er-ft-2", "left", 4.4), IN("#er-ft-3", "left", 4.8), PULSE("#er-t-account", 2.4)]),
        ("Cột ft id của bút toán được phép NULL: sáu trăm tám mươi sáu trong chín trăm ba mươi hai bút toán không thuộc lệnh chuyển nào. Hai trăm bốn mươi sáu bút toán còn lại thuộc một trăm hai mươi ba lệnh, mỗi lệnh hai bút toán.",
         "ft_id NULL: 686/932 bút toán. 246 bút toán thuộc 123 lệnh, mỗi lệnh 2 bút toán.",
         [OUT("#er-d1, #er-ft-h, #er-ft-1, #er-ft-2, #er-ft-3", "fade", 0, 0.3), DIM(ALL_ER, 0.0, 1), DIM(erest(["stmt_entry", "funds_transfer"], [13]), 0.2, 0.12),
          IN("#er-z1", "left", 0.5), IN("#er-z2", "left", 3.0), SHAKE("#er-z2", 4.0), OUT("#er-z2", "fade", 7.6, 0.3), IN("#er-z3", "left", 8.0)]),
    ]),
    # ------------------------------------------------------------ create-table
    dict(id="create-table", world=(1920, 1080), hud=hud("cr", "CREATE TABLE", "Từ lược đồ thành bảng thật"), cam="".join([
        big_title("cr", "CREATE TABLE", "Tên bảng, cột, kiểu và ràng buộc"),
        sqlbox("cr-s", 160, 190, 1300, ["CREATE TABLE sample_note (", "  note_id    integer PRIMARY KEY,",
                                        "  account_id varchar(10) NOT NULL REFERENCES account(account_id),",
                                        "  content    varchar(100)", ");"], 28),
        chip("cr-k1", 160, 560, "PRIMARY KEY: vừa duy nhất vừa không rỗng", "green"),
        chip("cr-k2", 160, 650, "NOT NULL: bắt buộc có giá trị", "cyan"),
        chip("cr-k3", 160, 740, "REFERENCES: khoá ngoại, giá trị phải có ở bảng kia", "amber"),
        sqlbox("cr-d", 120, 190, 1100, ["CREATE TABLE debit_card (", "  card_no    varchar(16) PRIMARY KEY,", "  account_id varchar(10) NOT NULL",
                                        "    REFERENCES account(account_id),", "  issue_date date NOT NULL,", "  status     varchar(10) NOT NULL", ");"], 28),
        field("cr-dc", 1300, 190, 520, "debit_card", [("card_no", "PK"), ("account_id", "FK"), ("issue_date", ""), ("status", "")], "amber"),
        field("cr-da", 1300, 650, 520, "account", [("account_id", "PK")], "green"),
        wires(arrow("cr-dw", [(1560, 480), (1560, 650)], "amber")),
        mk("cr-dn", 1580, 485, "N", "amber", 32), mk("cr-d1", 1580, 585, "1", "green", 32),
        chip("cr-dk", 120, 640, "Một tài khoản : nhiều thẻ", "violet"),
        sqlbox("cr-h", 160, 190, 1450, ["CREATE TABLE account_holder (", "  account_id  varchar(10) NOT NULL REFERENCES account(account_id),",
                                        "  customer_id integer     NOT NULL REFERENCES customer(customer_id),", "  holder_type varchar(10) NOT NULL,",
                                        "  PRIMARY KEY (account_id, customer_id)", ");"], 28),
        chip("cr-h1", 160, 610, "Khoá chính phức hợp: cặp (tài khoản, khách) không lặp", "green"),
        chip("cr-h2", 160, 700, "Bảng trung gian của quan hệ nhiều nhiều", "violet"),
        sqlbox("cr-k", 160, 190, 1500, ["CREATE TABLE customer_kyc (", "  customer_id   integer PRIMARY KEY REFERENCES customer(customer_id),",
                                        "  verified_date date NOT NULL,", "  risk_level    varchar(10) NOT NULL", ");"], 28),
        chip("cr-kk", 160, 560, "1-1: một cột vừa là khoá chính vừa là khoá ngoại", "cyan"),
        sqlbox("cr-e", 160, 190, 1300, ["CREATE TABLE loan_note (", "  note_id    integer PRIMARY KEY,", "  account_id integer REFERENCES account(account_id)", ");"], 28),
        el("cr-er", 160, 520, 1600, None, 'ERROR: foreign key constraint "loan_note_account_id_fkey" cannot be implemented', "err r"),
        chip("cr-e1", 160, 640, "account.account_id là varchar(10), cột này là integer", "red"),
        gnode("cr-o1", 260, 300, 560, 110, "1. account (đã có)", "cyan"), gnode("cr-o2", 1100, 300, 560, 110, "2. debit_card", "green"),
        wires(arrow("cr-ow", [(820, 355), (1100, 355)], "green")),
        chip("cr-t2", 160, 520, "Bảng được trỏ tới phải tạo trước", "amber"),
        chip("cr-t3", 160, 610, "Cột trong khoá chính tự động NOT NULL", "green"),
    ]), beats=[
        ("Phần năm. Create Table gồm tên bảng, các cột, kiểu dữ liệu và ràng buộc.",
         "Phần 5: CREATE TABLE gồm tên bảng, cột, kiểu dữ liệu và ràng buộc.",
         [TYPE("#cr-big", 0.1, 0.06), IN("#cr-bsub", "blur", 0.9), OUT("#cr-big, #cr-bsub", "zoom", 3.4), IN("#cr-hud", "left", 4.0)]),
        ("Ba ràng buộc: khoá chính, Not Null, và Reference cho khoá ngoại.",
         "PRIMARY KEY, NOT NULL, REFERENCES.",
         [IN("#cr-s", "up", 0.3, 0.4), *seq("cr-s", 5, 0.6, 0.2), DIM("#cr-s-1, #cr-s-3, #cr-s-4, #cr-s-5", 1.4, 0.3), IN("#cr-k1", "left", 1.5),
          DIM("#cr-s-1, #cr-s-2, #cr-s-4, #cr-s-5", 2.5, 0.3), DIM("#cr-s-3", 2.5, 1), IN("#cr-k2", "left", 2.6), IN("#cr-k3", "left", 3.5)]),
        ("Ví dụ thẻ ghi nợ: mỗi tài khoản có nhiều thẻ, nên khoá ngoại account id nằm ở bảng thẻ.",
         "debit_card: khoá ngoại account_id trỏ về account (1 tài khoản : N thẻ).",
         [OUT("#cr-s, #cr-k1, #cr-k2, #cr-k3", "fade", 0, 0.4), IN("#cr-d", "up", 0.5, 0.4), *seq("cr-d", 7, 0.7, 0.3), IN("#cr-dc", "up", 3.0), IN("#cr-da", "up", 3.6),
          *ARROW("cr-dw", 4.2, 0.6), IN("#cr-dn", "pop", 4.6), IN("#cr-d1", "pop", 4.8), IN("#cr-dk", "left", 5.4)]),
        ("Nhiều nhiều thì dùng bảng trung gian: hai khoá ngoại, và khoá chính gộp cả hai cột.",
         "account_holder: bảng trung gian, PRIMARY KEY (account_id, customer_id).",
         [OUT("#cr-d, #cr-dc, #cr-da, #cr-dw, #cr-dn, #cr-d1, #cr-dk", "fade", 0, 0.4), IN("#cr-h", "up", 0.5, 0.4), *seq("cr-h", 6, 0.7, 0.4),
          DIM("#cr-h-1, #cr-h-2, #cr-h-3, #cr-h-4, #cr-h-6", 3.4, 0.3), IN("#cr-h1", "left", 3.2), IN("#cr-h2", "left", 4.4)]),
        ("Một một thì một cột vừa là khoá chính vừa là khoá ngoại.",
         "customer_kyc: customer_id vừa là PRIMARY KEY vừa là REFERENCES.",
         [OUT("#cr-h, #cr-h1, #cr-h2", "fade", 0, 0.4), IN("#cr-k", "up", 0.5, 0.4), *seq("cr-k", 5, 0.7, 0.4), IN("#cr-kk", "left", 2.8)]),
        ("Bẫy: khoá ngoại phải cùng kiểu với khoá chính. Account id là varchar mười, ghi integer thì Postgres báo lỗi.",
         "Sai kiểu: foreign key constraint cannot be implemented.",
         [OUT("#cr-k, #cr-kk", "fade", 0, 0.4), IN("#cr-e", "up", 0.5, 0.4), *seq("cr-e", 4, 0.7, 0.4), IN("#cr-er", "up", 2.8), SHAKE("#cr-er", 3.4), IN("#cr-e1", "left", 4.6)]),
        ("Bảng được tham chiếu phải tạo trước. Cột khoá chính tự động bắt buộc có giá trị.",
         "Tạo bảng được trỏ tới trước. Cột khoá chính tự động NOT NULL.",
         [OUT("#cr-e, #cr-er, #cr-e1", "fade", 0, 0.4), IN("#cr-o1", "pop", 0.4), *ARROW("cr-ow", 1.0, 0.6), IN("#cr-o2", "pop", 1.8), IN("#cr-t2", "left", 2.2), IN("#cr-t3", "left", 3.0)]),
    ]),
    # ------------------------------------------------------------ normalization
    dict(id="normalization", world=(1920, 1080), hud=hud("nm", "Chuẩn hoá", "Mỗi sự thật chỉ lưu một nơi"), cam="".join([
        big_title("nm", "Chuẩn hoá", "Không lưu cùng một sự thật ở hai nơi"),
        tbl("nm-a", 160, 220, [(260, True), (260, True), (360, False)], ["account_id", "customer_id", "customer_city"],
            [["1000000058", "100035", "Hải Phòng"], ["1000000059", "100035", "Hải Phòng"], ["1000000060", "100035", "Hải Phòng"], ["1000000076", "100035", "Hải Phòng"]], 66, 28),
        tbl("nm-b", 160, 220, [(260, True), (260, True), (360, False)], ["account_id", "customer_id", "customer_city"],
            [["1000000058", "100035", "Hà Nội"], ["1000000059", "100035", "Hà Nội"], ["1000000060", "100035", "Hải Phòng"], ["1000000076", "100035", "Hải Phòng"]], 66, 28),
        chip("nm-a1", 160, 620, "Khách có 4 tài khoản: thành phố bị lưu 4 lần", "amber"),
        chip("nm-a2", 160, 710, "Sửa một nửa: dữ liệu lệch nhau", "red"),
        tbl("nm-p1", 120, 260, [(250, True), (400, False)], ["company_id", "phones"], [["VN0010001", "0901..., 0902..."]], 66, 28),
        tbl("nm-p2", 1010, 260, [(250, True), (330, True)], ["company_id", "phone"], [["VN0010001", "0901..."], ["VN0010001", "0902..."]], 66, 28),
        wires(arrow("nm-pw", [(800, 310), (990, 310)], "green")),
        chip("nm-p3", 120, 480, "1NF: mỗi ô một giá trị, không có danh sách", "red"),
        chip("nm-p4", 1010, 480, "Bảng riêng, mỗi số một dòng", "green"),
        field("nm-h1", 120, 220, 640, "account_holder", [("account_id", "PK"), ("customer_id", "PK"), ("customer_name", "")], "amber"),
        field("nm-h2", 1180, 220, 600, "customer", [("customer_id", "PK"), ("customer_name", "")], "green"),
        wires(arrow("nm-hw", [(760, 400), (1180, 330)], "green")),
        chip("nm-h3", 120, 560, "2NF: tên khách chỉ phụ thuộc customer_id, không cả khoá", "red"),
        chip("nm-h4", 120, 650, "Chuyển tên sang bảng customer", "green"),
        field("nm-s1", 120, 220, 640, "customer", [("customer_id", "PK"), ("sector_id", "FK"), ("sector_description", "")], "amber"),
        tbl("nm-s2", 1020, 250, [(170, True), (460, False)], ["sector_id", "description"],
            [["1000", "Cá nhân"], ["1100", "Cá nhân cao cấp"], ["2000", "Doanh nghiệp nhỏ và vừa"], ["3000", "Doanh nghiệp lớn"]], 62, 26),
        wires(arrow("nm-sw", [(760, 380), (1020, 330)], "green")),
        chip("nm-s3", 120, 620, "3NF: mô tả nhóm phụ thuộc sector_id, không phụ thuộc khoá chính", "red"),
        chip("nm-s4", 120, 710, "T24: customer chỉ giữ sector_id", "green"),
        el("nm-m", 0, 260, 1920, None, letters("Khoá, cả khoá, và chỉ khoá"), "h1 center r"),
        chip("nm-m1", 560, 520, "Chuẩn hoá có giá: đọc phải ghép bảng", "amber"),
        chip("nm-m2", 560, 610, "Dữ liệu giao dịch: chuẩn hoá trước", "green"),
    ]), beats=[
        ("Phần sáu. Chuẩn hoá nghĩa là chia dữ liệu vào đúng bảng, để không lưu cùng một sự thật ở hai nơi.",
         "Phần 6: chuẩn hoá để không lưu cùng một sự thật ở hai nơi.",
         [TYPE("#nm-big", 0.1, 0.06), IN("#nm-bsub", "blur", 0.9), OUT("#nm-big, #nm-bsub", "zoom", 3.4), IN("#nm-hud", "left", 4.0)]),
        ("Giả sử account lưu luôn thành phố của khách. Khách có bốn tài khoản thì lưu bốn lần, sửa một nửa là dữ liệu lệch.",
         "Lưu thành phố ở account: 4 lần, sửa một nửa thì lệch.",
         [IN("#nm-a-h", "left", 0.3), IN("#nm-a-1", "left", 0.6), IN("#nm-a-2", "left", 0.9), IN("#nm-a-3", "left", 1.2), IN("#nm-a-4", "left", 1.5), IN("#nm-a1", "left", 2.8),
          OUT("#nm-a-h, #nm-a-1, #nm-a-2, #nm-a-3, #nm-a-4", "fade", 5.2, 0.3), IN("#nm-b-h", "left", 5.4), IN("#nm-b-1", "left", 5.6), IN("#nm-b-2", "left", 5.8), IN("#nm-b-3", "left", 6.0),
          IN("#nm-b-4", "left", 6.2), IN("#nm-a2", "left", 6.6), SHAKE("#nm-a2", 7.2)]),
        ("Dạng chuẩn một: mỗi ô một giá trị. Nhiều số điện thoại trong một ô là vi phạm, hãy tách ra bảng riêng.",
         "1NF: mỗi ô một giá trị. Tách số điện thoại ra bảng riêng.",
         [OUT("#nm-b-h, #nm-b-1, #nm-b-2, #nm-b-3, #nm-b-4, #nm-a1, #nm-a2", "fade", 0, 0.4), IN("#nm-p1-h", "left", 0.4), IN("#nm-p1-1", "left", 0.7), IN("#nm-p3", "left", 2.2),
          *ARROW("nm-pw", 4.0, 0.5), IN("#nm-p2-h", "left", 4.6), IN("#nm-p2-1", "left", 5.0), IN("#nm-p2-2", "left", 5.4), IN("#nm-p4", "left", 5.8)]),
        ("Dạng chuẩn hai: tên khách chỉ phụ thuộc customer id, không phải cả khoá, nên chuyển sang bảng customer.",
         "2NF: customer_name chỉ phụ thuộc customer_id, chuyển sang bảng customer.",
         [OUT("#nm-p1-h, #nm-p1-1, #nm-p2-h, #nm-p2-1, #nm-p2-2, #nm-pw, #nm-p3, #nm-p4", "fade", 0, 0.4), IN("#nm-h1", "up", 0.4), IN("#nm-h3", "left", 2.4),
          *ARROW("nm-hw", 4.4, 0.6), IN("#nm-h2", "up", 5.0), IN("#nm-h4", "left", 6.0)]),
        ("Dạng chuẩn ba: mô tả nhóm khách phụ thuộc sector id, nên để ở bảng sector. T24 làm đúng như vậy.",
         "3NF: mô tả nhóm khách nằm ở bảng sector, customer chỉ giữ sector_id.",
         [OUT("#nm-h1, #nm-h2, #nm-hw, #nm-h3, #nm-h4", "fade", 0, 0.4), IN("#nm-s1", "up", 0.4), IN("#nm-s3", "left", 2.2), *ARROW("nm-sw", 3.2, 0.5),
          IN("#nm-s2-h", "left", 3.8), IN("#nm-s2-1", "left", 4.0), IN("#nm-s2-2", "left", 4.3), IN("#nm-s2-3", "left", 4.6), IN("#nm-s2-4", "left", 4.9), IN("#nm-s4", "left", 5.3)]),
        ("Nhớ câu này: mọi cột nói về khoá, cả khoá, và chỉ khoá. Chuẩn hoá có giá là phải ghép bảng, nhưng với dữ liệu giao dịch, hãy chuẩn hoá trước.",
         "Mọi cột nói về khoá, cả khoá, và chỉ khoá. Dữ liệu giao dịch: chuẩn hoá trước.",
         [OUT("#nm-s1, #nm-s2-h, #nm-s2-1, #nm-s2-2, #nm-s2-3, #nm-s2-4, #nm-sw, #nm-s3, #nm-s4", "fade", 0, 0.4), TYPE("#nm-m", 0.5, 0.06), IN("#nm-m1", "left", 4.0), IN("#nm-m2", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "Thực thể, bản số", "danh từ thành bảng, 1-1, 1-N, N-N"),
                                                ("share", "Khoá ngoại phía nhiều", "N-N cần bảng trung gian"),
                                                ("lock", "CREATE TABLE", "PK, FK, kiểu phải khớp"),
                                                ("quote", "Chuẩn hoá", "khoá, cả khoá, chỉ khoá")]),
        chip("ou-next", 560, 650, "Bài tiếp: SELECT, FROM, DISTINCT và Alias", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự viết CREATE TABLE", "cta r"),
    ]), beats=[
        ("Tóm lại: danh từ thành bảng, khoá ngoại đi theo phía nhiều, nhiều nhiều cần bảng trung gian. Create Table phải khớp kiểu, và chuẩn hoá là mỗi sự thật chỉ một nơi.",
         "Thực thể, bản số · khoá ngoại phía nhiều · CREATE TABLE · chuẩn hoá.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.8), IN("#ou-c3", "pop", 9.4)]),
        ("Bài tiếp: câu lệnh Select cơ bản.", "Bài tiếp: SELECT, FROM, DISTINCT và Alias.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay viết lệnh Create Table nhé.",
         "Mở bài học tương tác để làm quiz và tự viết CREATE TABLE nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
