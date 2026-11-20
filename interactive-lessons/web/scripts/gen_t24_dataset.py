#!/usr/bin/env python3
"""Generates src/data/sql/t24-bank.sql: a small, entirely fictional core-banking dataset modelled on Temenos T24
(CUSTOMER, ACCOUNT, CATEGORY, FUNDS.TRANSFER, STMT.ENTRY, LD loans, COMPANY branches...), in plain PostgreSQL.

No real bank or customer data is used: names, balances and transactions are random but seeded, so reruns give the same file.
Invariants the lessons rely on (checked by scripts/check-t24-dataset.mjs):
  - account.working_balance equals the sum of that account's stmt_entry amounts;
  - every DONE funds transfer has exactly two entries (debit and credit) that share its ft_id;
  - no non-loan account goes below zero.

Run from the web/ folder:  python3 scripts/gen_t24_dataset.py
"""
import random
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

rng = random.Random(24)
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "sql" / "t24-bank.sql"


def q(v):
    """SQL literal."""
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, date):
        return f"'{v.isoformat()}'"
    return "'" + str(v).replace("'", "''") + "'"


def money(x):
    return f"{x:.2f}"


# ---------------------------------------------------------------- reference data
companies = [
    ("VN0010001", "Hội sở Hà Nội", "Hà Nội", date(2005, 3, 1)),
    ("VN0010002", "Chi nhánh TP. Hồ Chí Minh", "TP. Hồ Chí Minh", date(2006, 6, 15)),
    ("VN0010003", "Chi nhánh Đà Nẵng", "Đà Nẵng", date(2009, 9, 9)),
    ("VN0010004", "Chi nhánh Hải Phòng", "Hải Phòng", date(2012, 1, 20)),
    ("VN0010005", "Chi nhánh Cần Thơ", "Cần Thơ", date(2015, 11, 2)),
]
company_city = {c[0]: c[2] for c in companies}

officer_names = ["Nguyễn Thu Hà", "Trần Quang Huy", "Lê Minh Châu", "Phạm Đức Anh", "Hoàng Thị Lan", "Vũ Hải Nam", "Đặng Bích Ngọc", "Bùi Tuấn Kiệt"]
officers = [(9001 + i, n, companies[i % 5][0]) for i, n in enumerate(officer_names)]

sectors = [(1000, "Cá nhân"), (1100, "Cá nhân cao cấp"), (2000, "Doanh nghiệp nhỏ và vừa"), (3000, "Doanh nghiệp lớn")]
currencies = [("VND", "Đồng Việt Nam", 0), ("USD", "Đô la Mỹ", 2), ("EUR", "Euro", 2), ("JPY", "Yên Nhật", 0)]
categories = [
    (1001, "Tài khoản thanh toán", "CURRENT"),
    (1002, "Tài khoản lương", "CURRENT"),
    (6001, "Tiết kiệm không kỳ hạn", "SAVINGS"),
    (6006, "Tiết kiệm 6 tháng", "SAVINGS"),
    (6012, "Tiết kiệm 12 tháng", "SAVINGS"),
    (3001, "Vay tiêu dùng", "LOAN"),
    (3002, "Vay kinh doanh", "LOAN"),
]
txn_types = [
    (101, "Nộp tiền mặt", "C"),
    (102, "Rút tiền mặt", "D"),
    (201, "Chuyển khoản đi", "D"),
    (202, "Chuyển khoản đến", "C"),
    (301, "Lãi tiền gửi", "C"),
    (401, "Phí dịch vụ", "D"),
    (501, "Giải ngân khoản vay", "C"),
    (502, "Thu nợ khoản vay", "D"),
]

# ---------------------------------------------------------------- customers
surnames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô", "Dương", "Lý"]
male_names = ["Văn An", "Quốc Bảo", "Minh Đức", "Hữu Phước", "Gia Huy", "Thanh Tùng", "Đình Khoa", "Anh Tuấn", "Công Danh", "Hoàng Long", "Trọng Nghĩa", "Việt Hùng"]
female_names = ["Thị Mai", "Ngọc Anh", "Thu Trang", "Bích Phương", "Khánh Linh", "Hồng Nhung", "Thuỳ Dương", "Mỹ Linh", "Phương Thảo", "Thanh Vân", "Diệu Hà", "Kim Ngân"]
business_names = [
    "Công ty TNHH Thương mại Sao Mai", "Công ty CP Xây dựng Hải Đăng", "Công ty TNHH Vận tải Bình An", "Công ty CP Thực phẩm Đồng Xanh",
    "Công ty TNHH Công nghệ Tân Việt", "Công ty CP Dược phẩm Hồng Phúc", "Công ty TNHH Du lịch Biển Xanh", "Tập đoàn Điện máy Phú Cường",
]


def short_name(full):
    """T24 keeps a short, upper-case, accent-free name next to the full name."""
    table = str.maketrans("ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ"
                          "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ",
                          "AAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD"
                          "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd")
    return full.translate(table).upper()


customers = []
used_names = set()
cust_id = 100001
total_individuals = 32
for i in range(40):
    business = i >= total_individuals
    if business:
        full = business_names[i - total_individuals]
        sector = 3000 if i in (38, 39) else 2000
        gender = None
        birth = None
    else:
        while True:
            female = rng.random() < 0.5
            full = f"{rng.choice(surnames)} {rng.choice(female_names if female else male_names)}"
            if full not in used_names:
                used_names.add(full)
                break
        gender = "F" if female else "M"
        birth = date(rng.randint(1960, 2003), rng.randint(1, 12), rng.randint(1, 28))
        sector = 1100 if rng.random() < 0.2 else 1000
    company = companies[rng.randrange(5)][0]
    created = date(2018, 1, 1) + timedelta(days=rng.randint(0, 2200))
    status = "ACTIVE"
    customers.append(dict(id=cust_id, short=short_name(full), full=full, sector=sector, gender=gender, birth=birth,
                          city=company_city[company], mobile=None, email=None, status=status,
                          officer=rng.choice([o for o in officers if o[2] == company] or officers)[0], company=company, created=created))
    cust_id += 1
for c in customers:
    c["mobile"] = None if rng.random() < 0.15 else "09" + "".join(str(rng.randint(0, 9)) for _ in range(8))
    c["email"] = None if rng.random() < 0.25 else short_name(c["full"]).lower().replace(" ", ".")[:24] + "@mail.vn"
dormant = rng.sample([c for c in customers if c["id"] < 100033], 3)
closed = rng.sample([c for c in customers if c["id"] < 100033 and c not in dormant], 2)
for c in dormant:
    c["status"] = "DORMANT"
for c in closed:
    c["status"] = "CLOSED"

# ---------------------------------------------------------------- accounts
accounts = []  # dict per account
acct_no = 1000000001


def new_account(cust, category, ccy, open_date):
    global acct_no
    a = dict(id=str(acct_no), cust=cust["id"], cat=category, ccy=ccy, company=cust["company"], open=open_date, close=None,
             balance=0.0, status="OPEN")
    acct_no += 1
    accounts.append(a)
    return a


for c in customers:
    is_biz = c["sector"] >= 2000
    base = max(c["created"], date(2023, 1, 1))
    new_account(c, 1002 if (not is_biz and rng.random() < 0.3) else 1001, "VND", c["created"])
    if rng.random() < 0.55:
        new_account(c, rng.choice([6001, 6006, 6012]), "VND", min(base + timedelta(days=rng.randint(0, 200)), date(2024, 9, 30)))
    if rng.random() < 0.18 or is_biz and rng.random() < 0.5:
        new_account(c, 1001, rng.choice(["USD", "USD", "EUR"]), min(base + timedelta(days=rng.randint(0, 250)), date(2024, 9, 30)))

# ---------------------------------------------------------------- events (entries) with running balances
YEAR_START, YEAR_END = date(2024, 1, 1), date(2024, 12, 31)
entries = []  # dict(account, txn, amount, booking, value, ft, narrative)
bal = defaultdict(float)
by_id = {a["id"]: a for a in accounts}
scale = {"VND": 1.0, "USD": 1 / 24000, "EUR": 1 / 26000}


def amt(ccy, vnd):
    v = vnd * scale[ccy]
    return float(round(v, 0)) if ccy == "VND" else float(round(v, 0))


def add_entry(acc, txn, amount, booking, value=None, ft=None, narrative=None):
    entries.append(dict(account=acc["id"], txn=txn, amount=amount, booking=booking, value=value or booking, ft=ft, narrative=narrative))
    bal[acc["id"]] += amount


events = []
for a in accounts:
    cust = next(c for c in customers if c["id"] == a["cust"])
    start = max(a["open"], YEAR_START)
    kind = "SAVINGS" if a["cat"] in (6001, 6006, 6012) else "CURRENT"
    seed = rng.choice([5, 10, 20, 50, 100, 200]) * 1_000_000 if cust["sector"] < 2000 else rng.choice([200, 500, 1000, 3000]) * 1_000_000
    events.append((start, 0, a, "open", amt(a["ccy"], seed)))
    n_ops = rng.randint(2, 5) if kind == "SAVINGS" else rng.randint(6, 16)
    for _ in range(n_ops):
        d = start + timedelta(days=rng.randint(1, max(2, (YEAR_END - start).days)))
        if d > YEAR_END:
            continue
        if kind == "SAVINGS":
            events.append((d, 1, a, "interest", None))
        else:
            r = rng.random()
            if cust["sector"] < 2000 and a["cat"] == 1002 and r < 0.25:
                events.append((d, 1, a, "salary", amt(a["ccy"], rng.choice([12, 15, 18, 25, 40]) * 1_000_000)))
            elif r < 0.35:
                events.append((d, 1, a, "cash_in", amt(a["ccy"], rng.choice([1, 2, 5, 10, 20]) * 1_000_000)))
            elif r < 0.6:
                events.append((d, 1, a, "cash_out", amt(a["ccy"], rng.choice([1, 2, 3, 5, 10]) * 1_000_000)))
            elif r < 0.75:
                events.append((d, 1, a, "fee", amt(a["ccy"], rng.choice([11, 22, 33, 55]) * 1000)))
            else:
                events.append((d, 2, a, "transfer", amt(a["ccy"], rng.choice([1, 2, 3, 5, 8, 15, 30]) * 1_000_000)))

transfers = []
ft_seq = 1
narr_cash_in = ["Nop tien mat tai quay", "Nop tien mat qua ATM", None]
narr_cash_out = ["Rut tien mat tai quay", "Rut tien ATM", None]
narr_tr = ["Thanh toan hoc phi", "Tra tien nha", "Chuyen tien mua hang", "Hoan tien", "Gop von kinh doanh", None, None, "Tien an"]

for d, order, a, kind, v in sorted(events, key=lambda e: (e[0], e[1], e[2]["id"])):
    ccy = a["ccy"]
    if kind == "open":
        add_entry(a, 101, v, d, narrative="Mo tai khoan, nop tien ban dau")
    elif kind == "salary":
        add_entry(a, 202, v, d, narrative="Luong thang %02d" % d.month)
    elif kind == "cash_in":
        add_entry(a, 101, v, d, narrative=rng.choice(narr_cash_in))
    elif kind == "cash_out":
        if bal[a["id"]] >= v:
            add_entry(a, 102, -v, d, narrative=rng.choice(narr_cash_out))
    elif kind == "fee":
        if bal[a["id"]] >= v:
            add_entry(a, 401, -v, d, narrative="Phi dich vu thang %02d" % d.month)
    elif kind == "interest":
        interest = float(round(bal[a["id"]] * 0.0035, 0 if ccy == "VND" else 2))
        if interest > 0:
            add_entry(a, 301, interest, d, narrative="Lai tien gui")
    elif kind == "transfer":
        if bal[a["id"]] < v:
            continue
        peers = [b for b in accounts if b["ccy"] == ccy and b["id"] != a["id"] and b["open"] <= d and b["cat"] in (1001, 1002)]
        if not peers:
            continue
        b = rng.choice(peers)
        ft = "FT24%07d" % ft_seq
        ft_seq += 1
        status = "DONE"
        transfers.append(dict(ft=ft, debit=a["id"], credit=b["id"], amount=v, ccy=ccy, date=d, status=status, narrative=rng.choice(narr_tr)))
        n = transfers[-1]["narrative"]
        add_entry(a, 201, -v, d, d + timedelta(days=0), ft, n)
        add_entry(b, 202, v, d, d + timedelta(days=rng.choice([0, 0, 1])), ft, n)

# a few transfers that never posted (no entries)
cur_accts = [a for a in accounts if a["cat"] in (1001, 1002) and a["ccy"] == "VND"]
for st in ["PENDING"] * 6 + ["FAILED"] * 3:
    a, b = rng.sample(cur_accts, 2)
    ft = "FT24%07d" % ft_seq
    ft_seq += 1
    transfers.append(dict(ft=ft, debit=a["id"], credit=b["id"], amount=float(rng.choice([2, 5, 20, 50]) * 1_000_000), ccy="VND",
                          date=date(2024, 12, rng.randint(1, 28)), status=st, narrative=rng.choice(narr_tr)))

# ---------------------------------------------------------------- loans
loans = []
loan_accounts = []
ld_seq = 1
borrowers = rng.sample([c for c in customers if c["status"] == "ACTIVE"], 15)
for c in borrowers:
    biz = c["sector"] >= 2000
    cat = 3002 if biz else 3001
    principal = float(rng.choice([200, 500, 800, 1500, 3000]) * 1_000_000 if biz else rng.choice([30, 50, 100, 200, 400]) * 1_000_000)
    start = date(2023, 6, 1) + timedelta(days=rng.randint(0, 520))
    months = rng.choice([12, 24, 36, 60])
    maturity = start + timedelta(days=months * 30)
    rate = float(rng.choice([8.5, 9.0, 9.5, 10.5, 11.0, 12.0, 13.5]))
    status = "LIVE"
    if maturity < date(2024, 12, 31) and rng.random() < 0.5:
        status = "REPAID"
    elif rng.random() < 0.2:
        status = "OVERDUE"
    la = new_account(c, cat, "VND", start)
    la["open"] = start
    loan_accounts.append(la)
    cur = next(a for a in accounts if a["cust"] == c["id"] and a["cat"] in (1001, 1002) and a["ccy"] == "VND")
    ld = "LD24%05d" % ld_seq
    ld_seq += 1
    loans.append(dict(ld=ld, cust=c["id"], acct=la["id"], principal=principal, ccy="VND", rate=rate, start=start, maturity=maturity, status=status))
    # disbursement: credit the customer's current account, debit the loan account (loan accounts are negative)
    if start >= YEAR_START:
        add_entry(cur, 501, principal, start, narrative="Giai ngan " + ld)
        add_entry(la, 501, -principal, start, narrative="Giai ngan " + ld)
    else:
        bal[la["id"]] += -principal  # disbursed before the dataset window: opening position
        entries.append(dict(account=la["id"], txn=501, amount=-principal, booking=start, value=start, ft=None, narrative="Giai ngan " + ld))
        entries.append(dict(account=cur["id"], txn=501, amount=principal, booking=start, value=start, ft=None, narrative="Giai ngan " + ld))
        bal[cur["id"]] += principal
    # a few repayments within 2024
    k = {"REPAID": 6, "LIVE": rng.randint(2, 6), "OVERDUE": 1}[status]
    paid = 0.0
    for m in range(1, k + 1):
        d = max(start, YEAR_START) + timedelta(days=30 * m)
        if d > YEAR_END:
            break
        pay = float(round(principal / max(12, months) , -3))
        if status == "REPAID" and m == k:
            pay = principal - paid
        if bal[cur["id"]] >= pay:
            add_entry(cur, 502, -pay, d, narrative="Thu no " + ld)
            add_entry(la, 502, pay, d, narrative="Thu no " + ld)
            paid += pay

# ---------------------------------------------------------------- close the CLOSED customers' accounts
for c in closed:
    for a in accounts:
        if a["cust"] == c["id"] and a["cat"] < 3000:
            a["status"] = "CLOSED"
            a["close"] = date(2024, rng.randint(6, 11), rng.randint(1, 28))
            # drop later activity, then pay out the rest
            entries[:] = [e for e in entries if not (e["account"] == a["id"] and e["booking"] > a["close"])]
bal = defaultdict(float)
for e in entries:
    bal[e["account"]] += e["amount"]
for c in closed:
    for a in accounts:
        if a["cust"] == c["id"] and a["cat"] < 3000 and bal[a["id"]] > 0:
            entries.append(dict(account=a["id"], txn=102, amount=-bal[a["id"]], booking=a["close"], value=a["close"], ft=None, narrative="Tat toan tai khoan"))
            bal[a["id"]] = 0.0

# Drop entries of transfers whose other leg was dropped (keep every DONE transfer with exactly two entries).
leg_count = defaultdict(int)
for e in entries:
    if e["ft"]:
        leg_count[e["ft"]] += 1
broken = {ft for ft, n in leg_count.items() if n != 2}
if broken:
    entries[:] = [e for e in entries if e["ft"] not in broken]
    transfers[:] = [t for t in transfers if t["ft"] not in broken]
    bal = defaultdict(float)
    for e in entries:
        bal[e["account"]] += e["amount"]

# opening-day entries must not precede the account's opening
for a in accounts:
    a["balance"] = round(bal[a["id"]], 2)

# Entries older than 2024 (pre-window loans) are fine; order everything by date for stable ids.
entries.sort(key=lambda e: (e["booking"], e["account"], e["txn"]))

# ---------------------------------------------------------------- emit SQL
out = []
w = out.append
w("-- T24-style core banking sample: fictional data, generated by scripts/gen_t24_dataset.py (seeded, reproducible).")
w("-- Names, balances and transactions are invented; table and column names follow Temenos T24 (CUSTOMER, ACCOUNT, FUNDS.TRANSFER, STMT.ENTRY, LD).")
w("""
CREATE TABLE company (
  company_id   varchar(9)   PRIMARY KEY,
  name         varchar(60)  NOT NULL,
  city         varchar(30)  NOT NULL,
  open_date    date         NOT NULL
);
CREATE TABLE account_officer (
  officer_id   integer      PRIMARY KEY,
  name         varchar(60)  NOT NULL,
  company_id   varchar(9)   NOT NULL REFERENCES company(company_id)
);
CREATE TABLE sector (
  sector_id    integer      PRIMARY KEY,
  description  varchar(60)  NOT NULL
);
CREATE TABLE currency (
  ccy          char(3)      PRIMARY KEY,
  name         varchar(30)  NOT NULL,
  decimals     smallint     NOT NULL
);
CREATE TABLE category (
  category_id   integer      PRIMARY KEY,
  description   varchar(60)  NOT NULL,
  product_group varchar(10)  NOT NULL CHECK (product_group IN ('CURRENT', 'SAVINGS', 'LOAN'))
);
CREATE TABLE txn_type (
  txn_code     integer      PRIMARY KEY,
  description  varchar(60)  NOT NULL,
  dr_cr        char(1)      NOT NULL CHECK (dr_cr IN ('D', 'C'))
);
CREATE TABLE customer (
  customer_id        integer      PRIMARY KEY,
  short_name         varchar(40)  NOT NULL,
  full_name          varchar(80)  NOT NULL,
  sector_id          integer      NOT NULL REFERENCES sector(sector_id),
  gender             char(1)      CHECK (gender IN ('M', 'F')),
  birth_date         date,
  city               varchar(30),
  mobile             varchar(15),
  email              varchar(60),
  customer_status    varchar(10)  NOT NULL CHECK (customer_status IN ('ACTIVE', 'DORMANT', 'CLOSED')),
  account_officer_id integer      NOT NULL REFERENCES account_officer(officer_id),
  company_id         varchar(9)   NOT NULL REFERENCES company(company_id),
  created_date       date         NOT NULL
);
CREATE TABLE account (
  account_id       varchar(10)   PRIMARY KEY,
  customer_id      integer       NOT NULL REFERENCES customer(customer_id),
  category_id      integer       NOT NULL REFERENCES category(category_id),
  ccy              char(3)       NOT NULL REFERENCES currency(ccy),
  company_id       varchar(9)    NOT NULL REFERENCES company(company_id),
  open_date        date          NOT NULL,
  close_date       date,
  working_balance  numeric(18,2) NOT NULL,
  status           varchar(10)   NOT NULL CHECK (status IN ('OPEN', 'CLOSED'))
);
CREATE TABLE funds_transfer (
  ft_id            varchar(12)   PRIMARY KEY,
  debit_account    varchar(10)   NOT NULL REFERENCES account(account_id),
  credit_account   varchar(10)   NOT NULL REFERENCES account(account_id),
  amount           numeric(18,2) NOT NULL CHECK (amount > 0),
  ccy              char(3)       NOT NULL REFERENCES currency(ccy),
  processing_date  date          NOT NULL,
  status           varchar(10)   NOT NULL CHECK (status IN ('DONE', 'PENDING', 'FAILED')),
  narrative        varchar(100)
);
CREATE TABLE stmt_entry (
  stmt_entry_id  integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id     varchar(10)   NOT NULL REFERENCES account(account_id),
  txn_code       integer       NOT NULL REFERENCES txn_type(txn_code),
  amount         numeric(18,2) NOT NULL,
  booking_date   date          NOT NULL,
  value_date     date          NOT NULL,
  ft_id          varchar(12)   REFERENCES funds_transfer(ft_id),
  narrative      varchar(100)
);
CREATE TABLE loan (
  ld_id          varchar(9)    PRIMARY KEY,
  customer_id    integer       NOT NULL REFERENCES customer(customer_id),
  account_id     varchar(10)   NOT NULL REFERENCES account(account_id),
  principal      numeric(18,2) NOT NULL CHECK (principal > 0),
  ccy            char(3)       NOT NULL REFERENCES currency(ccy),
  interest_rate  numeric(5,2)  NOT NULL,
  start_date     date          NOT NULL,
  maturity_date  date          NOT NULL,
  status         varchar(10)   NOT NULL CHECK (status IN ('LIVE', 'REPAID', 'OVERDUE'))
);
""")


def insert(table, cols, rows):
    if not rows:
        return
    w(f"INSERT INTO {table} ({', '.join(cols)}) VALUES")
    w(",\n".join("  (" + ", ".join(q(v) for v in r) + ")" for r in rows) + ";\n")


insert("company", ["company_id", "name", "city", "open_date"], companies)
insert("account_officer", ["officer_id", "name", "company_id"], officers)
insert("sector", ["sector_id", "description"], sectors)
insert("currency", ["ccy", "name", "decimals"], currencies)
insert("category", ["category_id", "description", "product_group"], categories)
insert("txn_type", ["txn_code", "description", "dr_cr"], txn_types)
insert("customer", ["customer_id", "short_name", "full_name", "sector_id", "gender", "birth_date", "city", "mobile", "email", "customer_status", "account_officer_id", "company_id", "created_date"],
       [(c["id"], c["short"], c["full"], c["sector"], c["gender"], c["birth"], c["city"], c["mobile"], c["email"], c["status"], c["officer"], c["company"], c["created"]) for c in customers])
insert("account", ["account_id", "customer_id", "category_id", "ccy", "company_id", "open_date", "close_date", "working_balance", "status"],
       [(a["id"], a["cust"], a["cat"], a["ccy"], a["company"], a["open"], a["close"], money(a["balance"]), a["status"]) for a in accounts])
insert("funds_transfer", ["ft_id", "debit_account", "credit_account", "amount", "ccy", "processing_date", "status", "narrative"],
       [(t["ft"], t["debit"], t["credit"], money(t["amount"]), t["ccy"], t["date"], t["status"], t["narrative"]) for t in sorted(transfers, key=lambda t: t["ft"])])
insert("stmt_entry", ["account_id", "txn_code", "amount", "booking_date", "value_date", "ft_id", "narrative"],
       [(e["account"], e["txn"], money(e["amount"]), e["booking"], e["value"], e["ft"], e["narrative"]) for e in entries])
insert("loan", ["ld_id", "customer_id", "account_id", "principal", "ccy", "interest_rate", "start_date", "maturity_date", "status"],
       [(l["ld"], l["cust"], l["acct"], money(l["principal"]), l["ccy"], money(l["rate"]), l["start"], l["maturity"], l["status"]) for l in loans])

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(out), encoding="utf-8")
print(f"wrote {OUT.relative_to(Path.cwd()) if OUT.is_relative_to(Path.cwd()) else OUT}: {len(customers)} customers, {len(accounts)} accounts, "
      f"{len(entries)} entries, {len(transfers)} transfers, {len(loans)} loans")
