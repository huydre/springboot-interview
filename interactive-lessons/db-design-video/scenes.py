"""Database design explainer: normalization, constraints (and surrogate keys), atomicity, connection pool, migrations (Flyway, expand and contract, two datasources), cheat sheet.

Every number comes from the lesson (web/src/data/lessons/db-design.ts), which was run on SQLite, PGlite, a pool simulation and Spring Boot:
address update leaves two addresses (12 Le Loi, 99 Tran Phu); constraints reject duplicate email, bad foreign key, negative qty;
transfer 60 without transaction: 40 and 0; with ROLLBACK: 100 and 0; with the right step and COMMIT: 40 and 60;
pool simulation (4 concurrent queries, 400 requests, 10 ms): pool 1 about 4900 ms, pool 4 about 1230 ms, pool 16 and 64 about 1200 ms.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def when(spoken, phrase):
    """Seconds into the narration (at ~14.5 chars/s) where `phrase` starts; fit_to_audio rescales to the real take."""
    return round(spoken.index(phrase) / 14.5, 2)


def B(spoken, caption, fn):
    return (spoken, caption, fn(lambda p: when(spoken, p)))


def S(*names):
    return ", ".join("#" + n for n in names)


def AR(*names):
    return ", ".join(f"#{n}, #{n}-h" for n in names)


def row(label, text):
    return f'<span class="mono big" style="font-size:44px">{label}</span><span style="font-size:38px">{esc(text)}</span>'


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def bcode(src, size=32):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def cbox(id_, x, y, w, title, src, tone="violet", size=32):
    return box(id_, x, y, w, None, win(title) + bcode(src, size), tone, "code")


def tag(id_, x, y, w, h, text, tone="cyan", size=32):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600">{esc(text)}</span>', tone)


def titled(id_, x, y, w, h, top, main, sub="", tone="cyan", ms=40):
    inner = (f'<span class="mono" style="font-size:28px;color:var(--muted)">{top}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700">{main}</span>'
    inner += f'<span class="mono" style="font-size:28px;color:var(--muted)">{sub}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=44, ds=30, spacer=0):
    sp = f'<div style="height:{spacer}px"></div>' if spacer else ""
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>{sp}', tone, "card")


def stack(id_, x, y, w, h, title, lines, tone="cyan"):
    inner = f'<b style="font-size:44px">{esc(title)}</b>' + "".join(
        f'<span class="mono" style="font-size:30px;color:var(--muted)">{esc(l)}</span>' for l in lines)
    return box(id_, x, y, w, h, inner, tone, "col")


TOPICS = [("Chuẩn hoá", "một chỗ duy nhất"), ("Ràng buộc", "database tự chặn"), ("Transaction", "trọn hoặc không"),
          ("Pool", "to chưa chắc nhanh"), ("Migration", "đổi bảng khi chạy")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Database · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Thiết kế database"), "h1 r", "font-size:120px"),
        *[box(f"hk-c{i}", 85 + i * 355, 420, 330, 300,
              f'<b style="font-size:32px">{n}</b><span style="font-size:28px;color:var(--muted);text-align:center">{d}</span>', "cyan", "card")
          for i, (n, d) in enumerate(TOPICS)],
        chip("hk-p1", 520, 850, "Lệnh chạy thật", "green"),
        chip("hk-p2", 1130, 850, "Bẫy hay gặp", "amber"),
        el("hk-t1", 0, 400, 1920, None, letters("Để database tự bảo vệ dữ liệu"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "đừng chỉ tin vào code ứng dụng", "take-sm r"),
        wires(arrow("hk-a1", [(800, 882), (1110, 882)], "muted")),
    ]), beats=[
        B("Phỏng vấn backend rất hay hỏi về database: thiết kế bảng sao cho đúng, và vận hành sao cho an toàn.",
          "Thiết kế bảng đúng, vận hành an toàn.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Bài này đi qua năm ý: chuẩn hoá, ràng buộc, transaction, connection pool, và đổi schema khi app đang chạy.",
          "5 ý: chuẩn hoá, ràng buộc, transaction, pool, migration.",
          lambda w: [IN("#hk-c0", "pop", w("chuẩn hoá")), IN("#hk-c1", "pop", w("ràng buộc")), IN("#hk-c2", "pop", w("transaction")),
                     IN("#hk-c3", "pop", w("connection pool")), IN("#hk-c4", "pop", w("và đổi schema"))]),
        B("Mỗi ý có lệnh đã chạy thật, và một cái bẫy hay gặp.",
          "Mỗi ý: lệnh chạy thật và bẫy hay gặp.",
          lambda w: [IN("#hk-p1", "left", w("lệnh đã chạy")), *ARROW("hk-a1", w("và một") - 0.5, 0.5), IN("#hk-p2", "pop", w("một cái bẫy"))]),
        B("Điểm chung: hãy để database tự bảo vệ dữ liệu, đừng chỉ tin vào code ứng dụng.",
          "Database tự bảo vệ dữ liệu.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", w("đừng chỉ"))]),
    ]),
    # ------------------------------------------------------------ normalize
    dict(id="normalize", world=(1920, 1080), hud="", cam="".join([
        head("nm", "Chuẩn hoá", "Mỗi thông tin chỉ lưu một chỗ"),
        rule("nm-rule", "Mỗi thông tin chỉ có một nơi", "Lưu ở nhiều nơi thì sửa một nơi, các nơi còn lại bị lệch"),
        tag("nm-fh", 90, 250, 1000, 80, "orders_flat(id, customer, address)", "violet", 32),
        tag("nm-f1", 90, 350, 1000, 90, "1 · An · 12 Le Loi", "cyan", 34),
        tag("nm-f1b", 90, 350, 1000, 90, "1 · An · 99 Tran Phu", "green", 34),
        tag("nm-f2", 90, 460, 1000, 90, "2 · An · 12 Le Loi", "cyan", 34),
        tag("nm-f3", 90, 570, 1000, 90, "3 · An · 12 Le Loi", "cyan", 34),
        bigerr("nm-err", 1190, 350, 640, "✕ Hai địa chỉ cho cùng khách An:<br>12 Le Loi và 99 Tran Phu", 30),
        titled("nm-cu", 160, 300, 620, 280, "customers", "An", "99 Tran Phu", "cyan", 48),
        titled("nm-od", 1140, 300, 620, 280, "orders", "3 đơn", "customer_id → customers.id", "cyan", 48),
        tag("nm-res", 160, 700, 1600, 100, "✓ Sửa một dòng ở customers: cả 3 đơn khi JOIN đều ra 99 Tran Phu", "green", 34),
        card("nm-n1", 90, 290, 520, 420, "1NF", "mỗi ô một giá trị", "cyan", 60, 34),
        card("nm-n2", 700, 290, 520, 420, "2NF", "mọi cột phụ thuộc cả khoá chính, không chỉ một phần", "cyan", 60, 32),
        card("nm-n3", 1310, 290, 520, 420, "3NF", "cột thường không phụ thuộc vào cột thường khác", "cyan", 60, 32),
        note("nm-dep", 90, 770, 1740, "Phụ thuộc: biết cột B là suy ra được cột A", "green", 34),
        el("nm-t1", 0, 400, 1920, None, letters("Chuẩn hoá trước"), "take r"),
        el("nm-t2", 0, 540, 1920, None, "chỉ phi chuẩn hoá khi đo được JOIN là điểm nghẽn", "take-sm r"),
        wires(arrow("nm-a1", [(1135, 440), (785, 440)], "violet")),
    ]), beats=[
        B("Địa chỉ khách hàng mà lặp lại ở mỗi dòng đơn hàng thì rất dễ lệch. Chuẩn hoá nghĩa là mỗi thông tin chỉ lưu đúng một chỗ.",
          "Chuẩn hoá: mỗi thông tin chỉ lưu một chỗ.",
          lambda w: [IN("#nm-eye", "blur"), TYPE("#nm-q", 0.2, 0.05), IN("#nm-rule", "up", w("Chuẩn hoá nghĩa") + 0.3)]),
        B("Khách An đổi địa chỉ, bạn sửa một dòng và quên các dòng còn lại. Đã chạy: bảng giờ có hai địa chỉ cho cùng khách An, mười hai Le Loi và chín mươi chín Tran Phu.",
          "Sửa một dòng: cùng khách có hai địa chỉ.",
          lambda w: [OUT("#nm-rule", "blur", 0, 0.4), *shrink("nm", 0), IN("#nm-fh", "up", 0.5), IN("#nm-f1", "up", 0.7), IN("#nm-f2", "up", 0.85), IN("#nm-f3", "up", 1.0),
                     OUT("#nm-f1", "blur", w("sửa một dòng"), 0.3), IN("#nm-f1b", "pop", w("sửa một dòng") + 0.2),
                     IN("#nm-err", "up", w("Đã chạy")), SHAKE("#nm-err", w("Đã chạy") + 0.6)]),
        B("Cách đúng là tách địa chỉ ra bảng customers riêng, nối với orders bằng khoá ngoại. Sửa một dòng trong customers, cả ba đơn hàng khi nối đều ra chín mươi chín Tran Phu.",
          "Tách bảng customers: sửa một chỗ, mọi đơn đều đúng.",
          lambda w: [OUT(S("nm-fh", "nm-f1b", "nm-f2", "nm-f3", "nm-err"), "blur", 0, 0.5), IN("#nm-cu", "up", 0.7), IN("#nm-od", "up", w("nối với orders")),
                     *ARROW("nm-a1", w("bằng khoá ngoại"), 0.5), IN("#nm-res", "up", w("Sửa một dòng")), PULSE("#nm-cu", w("Sửa một dòng"))]),
        B("Phỏng vấn hay hỏi ba dạng chuẩn. Một NF: mỗi ô một giá trị. Hai NF: mọi cột phụ thuộc cả khoá chính, không chỉ một phần. Ba NF: cột thường không phụ thuộc vào cột thường khác.",
          "1NF, 2NF, 3NF.",
          lambda w: [OUT(S("nm-cu", "nm-od", "nm-res") + ", " + AR("nm-a1"), "blur", 0, 0.5), IN("#nm-n1", "up", w("Một NF")), IN("#nm-n2", "up", w("Hai NF")), IN("#nm-n3", "up", w("Ba NF")),
                     IN("#nm-dep", "up", w("Ba NF") + 2.5)]),
        B("Cái bẫy là gộp hết vào một bảng cho tiện. Hãy chuẩn hoá trước, chỉ phi chuẩn hoá có chủ đích khi đo được JOIN là điểm nghẽn.",
          "Chuẩn hoá trước, phi chuẩn hoá khi đã đo.",
          lambda w: [DIM(S("nm-eye", "nm-q", "nm-n1", "nm-n2", "nm-n3", "nm-dep"), 0, 0.07), TYPE("#nm-t1", w("Hãy chuẩn hoá"), 0.05), IN("#nm-t2", "blur", w("chỉ phi chuẩn hoá"))]),
    ]),
    # ------------------------------------------------------------ constraints
    dict(id="constraints", world=(1920, 1080), hud="", cam="".join([
        head("cn", "Ràng buộc", "Database là chốt chặn cuối"),
        rule("cn-rule", "Để database tự chặn dữ liệu sai", "Mọi đường ghi đều đi qua database"),
        card("cn-k1", 90, 300, 410, 340, "UNIQUE", "chặn trùng", "cyan", 40, 30),
        card("cn-k2", 530, 300, 410, 340, "FOREIGN KEY", "chặn tham chiếu tới dòng không tồn tại", "cyan", 36, 28),
        card("cn-k3", 970, 300, 410, 340, "CHECK", "chặn giá trị phi lý", "cyan", 40, 30),
        card("cn-k4", 1410, 300, 410, 340, "NOT NULL", "chặn thiếu", "cyan", 40, 30),
        tag("cn-r1", 110, 300, 560, 100, "request 1: chưa có → thêm", "cyan", 30),
        tag("cn-r2", 110, 440, 560, 100, "request 2: chưa có → thêm", "cyan", 30),
        titled("cn-dup", 900, 330, 620, 180, "users", "✕ trùng email", "hai dòng cùng email", "red", 40),
        note("cn-bp", 110, 640, 1700, "✕ Script nhập liệu hay sửa tay đi vòng qua service,\nbỏ qua mọi kiểm tra", "red", 34),
        cbox("cn-code", 90, 260, 1000, "schema.sql",
             "CREATE TABLE users(id INTEGER PRIMARY KEY,\n"
             "  email TEXT UNIQUE NOT NULL);\n"
             "CREATE TABLE items(id INTEGER PRIMARY KEY,\n"
             "  user_id INTEGER NOT NULL REFERENCES users(id),\n"
             "  qty INTEGER CHECK (qty > 0));", "violet", 28),
        tag("cn-x1", 1130, 270, 700, 100, "✕ Email trùng → UNIQUE failed", "red", 28),
        tag("cn-x2", 1130, 390, 700, 100, "✕ Khoá ngoại sai → FOREIGN KEY failed", "red", 28),
        tag("cn-x3", 1130, 510, 700, 100, "✕ Số lượng âm → CHECK failed", "red", 28),
        tag("cn-x4", 1130, 630, 700, 100, "✓ Bảng còn 1 dòng hợp lệ", "green", 28),
        tag("cn-i1", 160, 330, 1600, 100, "✕ SELECT kiểm tra rồi mới INSERT: hai request vẫn lọt", "red", 34),
        tag("cn-i2", 160, 470, 1600, 100, "✓ Cứ INSERT, để UNIQUE quyết định", "green", 34),
        tag("cn-i3", 160, 610, 1600, 100, "→ Bắt lỗi trùng, trả 409 Conflict. Đừng nuốt lỗi hay trả 500", "amber", 34),
        titled("cn-p", 130, 300, 560, 200, "u_p", "PK email", "an@x.vn", "cyan", 42),
        tag("cn-c1", 1000, 290, 760, 90, "u_c · email = an@x.vn", "cyan", 30),
        tag("cn-c2", 1000, 410, 760, 90, "u_c · email = an@x.vn", "cyan", 30),
        bigerr("cn-ferr", 130, 620, 1660, "✕ UPDATE email của dòng cha bị từ chối:<br>violates foreign key constraint u_c_email_fkey", 32),
        titled("cn-p2", 130, 300, 560, 200, "u_p", "id 1 · email UNIQUE", "an@new.vn", "green", 34),
        tag("cn-d1", 1000, 290, 760, 90, "u_c · p_id = 1", "cyan", 30),
        tag("cn-d2", 1000, 410, 760, 90, "u_c · p_id = 1", "cyan", 30),
        tag("cn-ok1", 130, 620, 800, 100, "✓ Đổi email: sửa một dòng cha", "green", 30),
        tag("cn-ok2", 960, 620, 860, 100, "✕ Email trùng vẫn bị UNIQUE chặn", "amber", 30),
        el("cn-t1", 0, 400, 1920, None, letters("Chốt chặn cuối ở database"), "take r"),
        el("cn-t2", 0, 540, 1920, None, "khoá chính vô nghĩa · UNIQUE cho cột tự nhiên", "take-sm r"),
        wires(arrow("cn-a1", [(675, 350), (895, 400)], "red"), arrow("cn-a2", [(675, 490), (895, 440)], "red"),
              arrow("cn-b1", [(995, 335), (695, 380)], "violet", True), arrow("cn-b2", [(995, 455), (695, 440)], "violet", True),
              arrow("cn-e1", [(995, 335), (695, 380)], "violet", True), arrow("cn-e2", [(995, 455), (695, 440)], "violet", True)),
    ]), beats=[
        B("Chuẩn hoá giúp dữ liệu không mâu thuẫn. Còn dữ liệu sai thì ai chặn? Database có bốn ràng buộc: UNIQUE chặn trùng, FOREIGN KEY chặn tham chiếu tới dòng không tồn tại, CHECK chặn giá trị phi lý, và NOT NULL chặn thiếu.",
          "4 ràng buộc: UNIQUE, FOREIGN KEY, CHECK, NOT NULL.",
          lambda w: [IN("#cn-eye", "blur"), TYPE("#cn-q", 0.2, 0.05), IN("#cn-rule", "up", 1.2),
                     OUT("#cn-rule", "blur", w("Database có") - 0.2, 0.4), *shrink("cn", w("Database có") - 0.2),
                     IN("#cn-k1", "up", w("UNIQUE chặn")), IN("#cn-k2", "up", w("FOREIGN KEY chặn")), IN("#cn-k3", "up", w("CHECK chặn")), IN("#cn-k4", "up", w("NOT NULL chặn"))]),
        B("Nếu chỉ kiểm tra trong code, hai request cùng lúc đăng ký một email đều thấy chưa có, rồi cùng thêm. Kết quả là email trùng. Script nhập liệu hay thao tác tay còn đi vòng qua service.",
          "Chỉ kiểm tra trong code: race và đường ghi khác lọt.",
          lambda w: [OUT(S("cn-k1", "cn-k2", "cn-k3", "cn-k4"), "blur", 0, 0.5), IN("#cn-r1", "right", 0.6), IN("#cn-r2", "right", 0.8),
                     *ARROW("cn-a1", w("rồi cùng thêm"), 0.4), *ARROW("cn-a2", w("rồi cùng thêm") + 0.2, 0.4), IN("#cn-dup", "pop", w("email trùng")), SHAKE("#cn-dup", w("email trùng") + 0.5),
                     IN("#cn-bp", "up", w("Script nhập liệu"))]),
        B("Đặt ràng buộc vào schema thì đã chạy: email trùng bị từ chối với UNIQUE constraint failed, khoá ngoại sai bị từ chối, số lượng âm bị CHECK chặn. Cuối cùng bảng chỉ còn một dòng hợp lệ.",
          "Đã chạy: ba dòng sai bị chặn, còn 1 dòng hợp lệ.",
          lambda w: [OUT(S("cn-r1", "cn-r2", "cn-dup", "cn-bp") + ", " + AR("cn-a1", "cn-a2"), "blur", 0, 0.5), IN("#cn-code", "blur", 0.6, 0.7),
                     IN("#cn-x1", "up", w("email trùng bị")), SHAKE("#cn-x1", w("email trùng bị") + 0.5), IN("#cn-x2", "up", w("khoá ngoại sai")), SHAKE("#cn-x2", w("khoá ngoại sai") + 0.5),
                     IN("#cn-x3", "up", w("số lượng âm")), SHAKE("#cn-x3", w("số lượng âm") + 0.5), IN("#cn-x4", "pop", w("Cuối cùng"))]),
        B("Vì vậy đừng select kiểm tra rồi mới insert. Cứ insert và để UNIQUE quyết định, rồi đổi lỗi thành 409 Conflict. Đừng nuốt lỗi, cũng đừng trả 500.",
          "Cứ INSERT, UNIQUE quyết định; lỗi trùng → 409.",
          lambda w: [OUT(S("cn-code", "cn-x1", "cn-x2", "cn-x3", "cn-x4"), "blur", 0, 0.5), IN("#cn-i1", "up", 0.6), IN("#cn-i2", "up", w("Cứ insert")), IN("#cn-i3", "up", w("rồi đổi lỗi"))]),
        B("Còn khoá chính nên là email hay một mã vô nghĩa? Email là khoá tự nhiên, nó có thể đổi, mà mọi khoá ngoại đang trỏ vào đúng giá trị đó. Đã chạy: đổi email của dòng cha bị từ chối, vì hai dòng con đang trỏ vào email cũ.",
          "Khoá chính là email: đổi email bị khoá ngoại chặn.",
          lambda w: [OUT(S("cn-i1", "cn-i2", "cn-i3"), "blur", 0, 0.5), IN("#cn-p", "up", 0.6), IN("#cn-c1", "right", w("mọi khoá ngoại")), IN("#cn-c2", "right", w("mọi khoá ngoại") + 0.3),
                     *ARROW("cn-b1", w("mọi khoá ngoại") + 0.4, 0.4), *ARROW("cn-b2", w("mọi khoá ngoại") + 0.6, 0.4),
                     IN("#cn-ferr", "up", w("Đã chạy")), SHAKE("#cn-ferr", w("Đã chạy") + 0.6)]),
        B("Khoá thay thế là một id vô nghĩa do database cấp, không bao giờ cần đổi. Đổi email chỉ sửa một dòng cha. Và vẫn đặt UNIQUE cho email, để khách thứ hai cùng email vẫn bị chặn.",
          "Khoá thay thế id + UNIQUE(email).",
          lambda w: [OUT(S("cn-p", "cn-c1", "cn-c2", "cn-ferr") + ", " + AR("cn-b1", "cn-b2"), "blur", 0, 0.5), IN("#cn-p2", "up", 0.6), IN("#cn-d1", "right", w("không bao giờ")), IN("#cn-d2", "right", w("không bao giờ") + 0.3),
                     *ARROW("cn-e1", w("không bao giờ") + 0.4, 0.4), *ARROW("cn-e2", w("không bao giờ") + 0.6, 0.4),
                     IN("#cn-ok1", "up", w("Đổi email chỉ")), IN("#cn-ok2", "up", w("Và vẫn đặt"))]),
        B("Nhớ hai điều: chốt chặn cuối là ở database, và khoá chính nên là mã vô nghĩa, còn cột tự nhiên thì đặt UNIQUE.",
          "Chốt chặn ở database; khoá chính vô nghĩa + UNIQUE.",
          lambda w: [DIM(S("cn-eye", "cn-q", "cn-p2", "cn-d1", "cn-d2", "cn-ok1", "cn-ok2") + ", " + AR("cn-e1", "cn-e2"), 0, 0.07),
                     TYPE("#cn-t1", 0.4, 0.05), IN("#cn-t2", "blur", w("khoá chính nên"))]),
    ]),
    # ------------------------------------------------------------ atomicity
    dict(id="atomicity", world=(1920, 1080), hud="", cam="".join([
        head("at", "Atomicity", "Làm trọn hoặc không làm gì"),
        rule("at-rule", "Một việc nhiều bước nằm trong một transaction", "COMMIT tất cả, hoặc ROLLBACK về như chưa làm gì"),
        titled("at-a1", 160, 280, 520, 200, "tài khoản 1", "100", "", "cyan", 60),
        titled("at-a2", 1240, 280, 520, 200, "tài khoản 2", "0", "", "cyan", 60),
        tag("at-s1", 110, 560, 800, 100, "Bước 1: bal = bal - 60", "cyan", 32),
        tag("at-s2", 1010, 560, 800, 100, "Bước 2: bal = bal + 600", "amber", 32),
        note("at-chk", 110, 730, 1700, "CHECK (bal <= 500): cộng 600 cố tình vi phạm\nđể giả lập một bước hỏng giữa chừng", "amber", 32),
        titled("at-b1", 160, 280, 520, 200, "tài khoản 1", "40", "", "red", 60),
        titled("at-b2", 1240, 280, 520, 200, "tài khoản 2", "0", "", "red", 60),
        bigerr("at-err", 160, 580, 1600, "✕ Mỗi câu lệnh tự commit: bước 1 đã có hiệu lực, bước 2 lỗi.<br>60 đồng biến mất", 32),
        cbox("at-code", 90, 250, 960, "transfer.sql",
             "BEGIN;\n"
             "UPDATE acct SET bal = bal - 60 WHERE id = 1;\n"
             "UPDATE acct SET bal = bal + 600 WHERE id = 2; -- lỗi\n"
             "ROLLBACK;", "violet", 26),
        titled("at-r1", 1100, 250, 720, 190, "ROLLBACK", "100 và 0", "như chưa có gì xảy ra", "green", 48),
        titled("at-r2", 1100, 470, 720, 190, "COMMIT, bước 2 đúng (+ 60)", "40 và 60", "tổng vẫn 100", "green", 48),
        note("at-pg", 90, 740, 1740, "PostgreSQL: sau một câu lỗi, transaction đã hỏng.\nGõ COMMIT lúc đó chỉ là rollback", "amber", 34),
        note("at-sp", 90, 900, 1740, "Spring: @Transactional tự rollback khi có RuntimeException", "green", 32),
        el("at-t1", 0, 400, 1920, None, letters("Nhiều bước, một transaction"), "take r"),
        el("at-t2", 0, 540, 1920, None, "mỗi câu lệnh tự commit chưa đủ", "take-sm r"),
        wires(arrow("at-m1", [(685, 380), (1235, 380)], "violet")),
    ]), beats=[
        B("Ràng buộc chặn từng câu lệnh sai. Nhưng khi một việc gồm nhiều câu lệnh, và một câu lỗi giữa chừng thì sao? Transaction gom chúng lại: hoặc commit tất cả, hoặc rollback về như chưa làm gì.",
          "Transaction: commit tất cả hoặc rollback tất cả.",
          lambda w: [IN("#at-eye", "blur"), TYPE("#at-q", 0.2, 0.05), IN("#at-rule", "up", w("Transaction gom") + 0.3)]),
        B("Chuyển tiền gồm hai bước: trừ tài khoản một, rồi cộng tài khoản hai. Tài khoản một có một trăm, tài khoản hai có không. Bước hai cố tình cộng sáu trăm, để vi phạm CHECK không tài khoản nào quá năm trăm, giả lập một bước hỏng.",
          "Chuyển 60: bước 2 cố tình vi phạm CHECK.",
          lambda w: [OUT("#at-rule", "blur", 0, 0.4), *shrink("at", 0), IN("#at-a1", "up", 0.6), IN("#at-a2", "up", 0.8), *ARROW("at-m1", w("Chuyển tiền") + 0.5, 0.5),
                     IN("#at-s1", "up", w("trừ tài khoản")), IN("#at-s2", "up", w("rồi cộng")), IN("#at-chk", "up", w("Bước hai cố tình"))]),
        B("Không dùng transaction thì mỗi câu lệnh tự commit. Bước một đã có hiệu lực, bước hai lỗi. Đã chạy: tài khoản một còn bốn mươi, tài khoản hai vẫn không. Sáu mươi đồng biến mất.",
          "Không transaction: 40 và 0, mất 60.",
          lambda w: [OUT(S("at-a1", "at-a2", "at-s1", "at-s2", "at-chk") + ", " + AR("at-m1"), "blur", 0, 0.5), IN("#at-b1", "up", w("Đã chạy")), IN("#at-b2", "up", w("Đã chạy") + 0.2),
                     IN("#at-err", "up", w("Sáu mươi đồng")), SHAKE("#at-err", w("Sáu mươi đồng") + 0.6)]),
        B("Bọc trong begin, bước hai lỗi rồi rollback. Đã chạy: tài khoản một về một trăm, tài khoản hai là không, như chưa có gì xảy ra. Còn bước hai đúng là cộng sáu mươi rồi commit, thì ra bốn mươi và sáu mươi, tổng vẫn một trăm.",
          "ROLLBACK: 100 và 0. COMMIT đúng: 40 và 60.",
          lambda w: [OUT(S("at-b1", "at-b2", "at-err"), "blur", 0, 0.5), IN("#at-code", "blur", 0.6, 0.7), PULSE("#at-code", w("bước hai lỗi")),
                     IN("#at-r1", "up", w("Đã chạy")), IN("#at-r2", "up", w("Còn bước hai"))]),
        B("Một chi tiết trên PostgreSQL: sau một câu lỗi, transaction đã hỏng, và gõ commit lúc đó thực chất là rollback. Trong Spring, Transactional tự rollback khi có RuntimeException.",
          "PostgreSQL: sau lỗi, COMMIT chỉ là rollback.",
          lambda w: [IN("#at-pg", "up", 0.3), IN("#at-sp", "up", w("Trong Spring"))]),
        B("Cái bẫy là tưởng mỗi câu lệnh đã là một transaction là đủ. Việc nhiều bước phải nằm trong một transaction.",
          "Việc nhiều bước phải nằm trong một transaction.",
          lambda w: [DIM(S("at-eye", "at-q", "at-code", "at-r1", "at-r2", "at-pg", "at-sp"), 0, 0.07), TYPE("#at-t1", 0.3, 0.05), IN("#at-t2", "blur", w("Cái bẫy"))]),
    ]),
    # ------------------------------------------------------------ pool
    dict(id="pool", world=(1920, 1080), hud="", cam="".join([
        head("pl", "Connection pool", "To chưa chắc nhanh hơn"),
        rule("pl-rule", "Pool cỡ vừa đủ, rồi đo", "Database chỉ chạy song song được ít truy vấn"),
        titled("pl-rq", 110, 370, 380, 190, "", "request", "mượn rồi trả", "cyan", 42),
        titled("pl-pool", 770, 370, 380, 190, "", "pool", "HikariCP · mặc định 10", "violet", 42),
        titled("pl-db", 1430, 370, 380, 190, "", "database", "", "cyan", 42),
        card("pl-c1", 90, 300, 800, 440, "Database", "chạy song song được khoảng bằng số lõi CPU, nhiều hơn một chút khi truy vấn chờ đọc đĩa", "cyan", 50, 34),
        card("pl-c2", 1030, 300, 800, 440, "Pool quá lớn", "giống cho thêm khách vào sảnh ngân hàng: không mở thêm quầy, chỉ chen nhau đông hơn", "amber", 50, 34),
        note("pl-hd", 110, 250, 1700, "400 request · mỗi cái 10 ms · database chạy 4 truy vấn cùng lúc", "green", 30),
        tag("pl-l1", 110, 340, 260, 100, "pool 1", "cyan", 32), box("pl-bar1", 400, 340, 980, 100, "", "red"), tag("pl-v1", 1410, 340, 400, 100, "4900 ms", "red", 34),
        tag("pl-l2", 110, 470, 260, 100, "pool 4", "cyan", 32), box("pl-bar2", 400, 470, 246, 100, "", "green"), tag("pl-v2", 676, 470, 400, 100, "1230 ms", "green", 34),
        tag("pl-l3", 110, 600, 260, 100, "pool 16", "cyan", 32), box("pl-bar3", 400, 600, 240, 100, "", "amber"), tag("pl-v3", 670, 600, 400, 100, "~1200 ms", "amber", 34),
        tag("pl-l4", 110, 730, 260, 100, "pool 64", "cyan", 32), box("pl-bar4", 400, 730, 240, 100, "", "amber"), tag("pl-v4", 670, 730, 400, 100, "~1200 ms", "amber", 34),
        tag("pl-f1", 160, 330, 1600, 110, "Bắt đầu: số lõi × 2 + số ổ đĩa, rồi đo", "cyan", 36),
        tag("pl-f2", 160, 480, 1600, 110, "Tổng pool của mọi instance < max_connections", "amber", 36),
        el("pl-t1", 0, 400, 1920, None, letters("Chậm thì đừng chỉ tăng pool"), "take r"),
        el("pl-t2", 0, 540, 1920, None, "truy vấn chậm · giữ kết nối quá lâu · rò kết nối", "take-sm r"),
        wires(arrow("pl-a1", [(495, 465), (765, 465)], "violet"), arrow("pl-a2", [(1155, 465), (1425, 465)], "violet")),
    ]), beats=[
        B("Mở một kết nối database rất tốn, nên app giữ sẵn một pool. HikariCP trong Spring Boot mặc định là mười. Request mượn một kết nối, dùng xong thì trả lại.",
          "Pool giữ sẵn kết nối: mượn rồi trả.",
          lambda w: [IN("#pl-eye", "blur"), TYPE("#pl-q", 0.2, 0.05), IN("#pl-rule", "up", 0.9), OUT("#pl-rule", "blur", w("HikariCP") - 0.3, 0.4), *shrink("pl", w("HikariCP") - 0.3),
                     IN("#pl-rq", "up", w("HikariCP")), *ARROW("pl-a1", w("Request mượn") - 0.3, 0.4), IN("#pl-pool", "up", w("Request mượn")), *ARROW("pl-a2", w("dùng xong"), 0.4), IN("#pl-db", "up", w("dùng xong") + 0.4)]),
        B("Nhưng database chỉ chạy song song được khoảng bằng số lõi CPU của nó. Hình dung một ngân hàng có vài quầy: cho khách vào sảnh nhiều hơn cũng không mở thêm quầy, chỉ chen nhau đông hơn.",
          "Pool lớn không mở thêm quầy.",
          lambda w: [OUT(S("pl-rq", "pl-pool", "pl-db") + ", " + AR("pl-a1", "pl-a2"), "blur", 0, 0.5), IN("#pl-c1", "up", 0.6), IN("#pl-c2", "up", w("Hình dung"))]),
        B("Mô phỏng bốn trăm request, mỗi cái mười mili giây, database chạy bốn truy vấn cùng lúc. Pool một kết nối mất khoảng bốn nghìn chín trăm mili giây. Pool bốn chỉ khoảng một nghìn hai trăm ba mươi, nhanh gấp bốn lần. Pool mười sáu hay sáu mươi bốn vẫn khoảng một nghìn hai trăm, không nhanh hơn.",
          "Pool 1: 4900 ms. Pool 4: 1230 ms. Pool 16 và 64: ~1200 ms.",
          lambda w: [OUT(S("pl-c1", "pl-c2"), "blur", 0, 0.5), IN("#pl-hd", "up", 0.5),
                     IN("#pl-l1", "left", w("Pool một")), IN("#pl-bar1", "left", w("Pool một"), 0.8), IN("#pl-v1", "up", w("Pool một") + 0.6),
                     IN("#pl-l2", "left", w("Pool bốn")), IN("#pl-bar2", "left", w("Pool bốn"), 0.6), IN("#pl-v2", "up", w("Pool bốn") + 0.5),
                     IN("#pl-l3", "left", w("Pool mười sáu")), IN("#pl-bar3", "left", w("Pool mười sáu"), 0.6), IN("#pl-v3", "up", w("Pool mười sáu") + 0.5),
                     IN("#pl-l4", "left", w("sáu mươi bốn") - 0.2), IN("#pl-bar4", "left", w("sáu mươi bốn") - 0.2, 0.6), IN("#pl-v4", "up", w("sáu mươi bốn") + 0.3)]),
        B("Điểm bắt đầu hợp lý là số lõi nhân hai cộng số ổ đĩa, rồi đo. Và tổng pool của mọi instance phải nhỏ hơn max connections của database.",
          "Số lõi × 2 + số ổ đĩa, rồi đo.",
          lambda w: [OUT(S("pl-hd", "pl-l1", "pl-bar1", "pl-v1", "pl-l2", "pl-bar2", "pl-v2", "pl-l3", "pl-bar3", "pl-v3", "pl-l4", "pl-bar4", "pl-v4"), "blur", 0, 0.5),
                     IN("#pl-f1", "up", 0.6), IN("#pl-f2", "up", w("Và tổng"))]),
        B("Cái bẫy là chậm thì tăng pool. Thường nó chỉ che vấn đề thật: truy vấn chậm, transaction giữ kết nối quá lâu vì gọi API ngoài bên trong Transactional, hay rò kết nối. Hãy tìm nguyên nhân trước.",
          "Chậm thì tìm nguyên nhân, đừng chỉ tăng pool.",
          lambda w: [DIM(S("pl-eye", "pl-q", "pl-f1", "pl-f2"), 0, 0.07), TYPE("#pl-t1", 0.4, 0.05), IN("#pl-t2", "blur", w("truy vấn chậm"))]),
    ]),
    # ------------------------------------------------------------ migration
    dict(id="migration", world=(1920, 1080), hud="", cam="".join([
        head("mg", "Migration", "Đổi schema khi app đang chạy"),
        rule("mg-rule", "Mỗi thay đổi là một file có phiên bản", "Không sửa bảng tay, không để Hibernate tự sửa"),
        tag("mg-b1", 160, 320, 1600, 110, "✕ Gõ ALTER TABLE tay trên production", "red", 34),
        tag("mg-b2", 160, 460, 1600, 110, "✕ Hibernate ddl-auto=update tự sửa bảng", "red", 34),
        bigerr("mg-b3", 160, 620, 1600, "→ staging và production lệch nhau, không ai biết schema đã qua những bước nào", 32),
        tag("mg-v1", 110, 280, 800, 90, "V1__init.sql", "cyan", 32),
        tag("mg-v2", 110, 390, 800, 90, "V2__add_phone.sql", "cyan", 32),
        tag("mg-v3", 110, 500, 800, 90, "V3__add_phone_index.sql", "green", 32),
        note("mg-nm", 110, 640, 800, "V{số}__{mô tả}.sql\nhai dấu gạch dưới, mỗi file chạy một lần", "green", 30),
        cbox("mg-h", 960, 280, 860, "flyway_schema_history",
             "V1__init.sql        1918092529\n"
             "V2__add_phone.sql  -1786254073", "violet", 28),
        bigerr("mg-err", 960, 280, 860, "✕ Migration checksum mismatch<br>for migration version 2<br>App không lên", 32),
        note("mg-rp", 960, 560, 860, "repair chỉ ghi checksum mới, không chạy lại V2: các môi trường lệch nhau", "amber", 30),
        tag("mg-n1", 160, 300, 1600, 110, "✕ V2_add_phone.sql (một gạch dưới): bị bỏ qua im lặng", "red", 34),
        tag("mg-n2", 160, 440, 1600, 110, "R__order_view.sql: chạy lại mỗi khi checksum đổi", "cyan", 34),
        tag("mg-n3", 160, 580, 1600, 110, "ddl-auto=validate: Hibernate chỉ kiểm tra entity khớp schema", "green", 34),
        tag("mg-l1", 160, 330, 1600, 110, "✕ Database có bảng nhưng chưa có history: Flyway từ chối", "red", 34),
        tag("mg-l2", 160, 470, 1600, 110, "baseline-on-migrate=true · baseline-version=1", "green", 34),
        tag("mg-l3", 160, 610, 1600, 110, "History ghi dòng Baseline, chỉ chạy từ V2", "cyan", 34),
        card("mg-e1", 90, 300, 410, 380, "Expand", "thêm cột mobile, code mới ghi cả hai cột", "cyan", 42, 30),
        card("mg-e2", 530, 300, 410, 380, "Backfill", "chép dữ liệu cũ theo lô khoảng 1000 dòng", "cyan", 42, 30),
        card("mg-e3", 970, 300, 410, 380, "Chuyển đọc", "code đọc từ cột mobile", "cyan", 42, 30),
        card("mg-e4", 1410, 300, 410, 380, "Contract", "hết pod cũ, migration sau xoá cột phone", "green", 42, 30),
        note("mg-rd", 90, 760, 1740, "Rolling deploy: pod cũ và pod mới cùng chạy trên một database", "amber", 34),
        tag("mg-x0", 110, 290, 1700, 100, "✕ SET NOT NULL: quét cả bảng, khoá ACCESS EXCLUSIVE chặn đọc ghi", "red", 30),
        tag("mg-x1", 110, 420, 1700, 80, "1 · ADD COLUMN status (cho phép NULL), code mới ghi", "cyan", 28),
        tag("mg-x2", 110, 520, 1700, 80, "2 · Backfill UPDATE từng lô", "cyan", 28),
        tag("mg-x3", 110, 620, 1700, 80, "3 · ADD CONSTRAINT ... CHECK (status IS NOT NULL) NOT VALID", "cyan", 28),
        tag("mg-x4", 110, 720, 1700, 80, "4 · VALIDATE CONSTRAINT: quét mà vẫn cho đọc ghi", "cyan", 28),
        tag("mg-x5", 110, 820, 1700, 80, "5 · SET NOT NULL (PostgreSQL 12+): không quét lại", "green", 28),
        tag("mg-k1", 160, 290, 1600, 100, "✕ ALTER chờ khoá, mọi câu lệnh mới xếp hàng sau ALTER", "red", 34),
        cbox("mg-k2", 160, 440, 1600, "migration.sql", "SET lock_timeout = '3s';\nALTER TABLE orders ...;", "violet", 32),
        tag("mg-k3", 160, 700, 1600, 100, "✓ Không lấy được khoá trong 3 giây thì ALTER tự bỏ cuộc", "green", 34),
        stack("mg-d1", 110, 290, 800, 380, "orders", ["DataSource @Primary", "Flyway · db/orders", "EntityManagerFactory", "TransactionManager"], "cyan"),
        stack("mg-d2", 1010, 290, 800, 380, "reports", ["DataSource", "Flyway · db/reports", "EntityManagerFactory", "TransactionManager"], "violet"),
        tag("mg-d3", 110, 740, 1700, 100, "jdbc-url, không phải url: property bind thẳng vào HikariDataSource", "amber", 32),
        el("mg-t1", 0, 400, 1920, None, letters("Mỗi database một bộ riêng"), "take r"),
        el("mg-t2", 0, 540, 1920, None, "Transactional không ghi tên dùng bộ Primary: database phụ phải ghi tên", "take-sm r"),
    ]), beats=[
        B("Schema còn phải đổi theo code. Cách hay gặp lúc mới đi làm là gõ ALTER TABLE tay trên production, hoặc để Hibernate ddl auto update tự sửa bảng. Kết quả là staging và production lệch nhau, không ai biết schema đã qua những bước nào.",
          "ALTER tay hoặc ddl-auto=update: môi trường lệch nhau.",
          lambda w: [IN("#mg-eye", "blur"), TYPE("#mg-q", 0.2, 0.05), IN("#mg-rule", "up", 0.8), OUT("#mg-rule", "blur", w("Cách hay gặp") - 0.2, 0.4), *shrink("mg", w("Cách hay gặp") - 0.2),
                     IN("#mg-b1", "up", w("gõ ALTER")), IN("#mg-b2", "up", w("Hibernate ddl")), IN("#mg-b3", "up", w("Kết quả là")), SHAKE("#mg-b3", w("Kết quả là") + 0.6)]),
        B("Flyway giải quyết bằng các file SQL có phiên bản: V một, hai dấu gạch dưới, rồi mô tả. Flyway chạy theo thứ tự, mỗi file đúng một lần, và ghi vào bảng history kèm checksum, tức mã băm nội dung file.",
          "Flyway: file V{số}__mô tả, ghi history + checksum.",
          lambda w: [OUT(S("mg-b1", "mg-b2", "mg-b3"), "blur", 0, 0.5), IN("#mg-v1", "right", 0.6), IN("#mg-v2", "right", w("Flyway chạy theo")), IN("#mg-nm", "up", w("hai dấu gạch")),
                     IN("#mg-h", "blur", w("ghi vào bảng"), 0.7), PULSE("#mg-h", w("checksum"))]),
        B("Sửa một chữ trong file đã chạy thì checksum đổi, lần khởi động sau báo checksum mismatch và app không lên. Lệnh repair chỉ ghi checksum mới cho khớp, không chạy lại file. Muốn đổi thì thêm V ba.",
          "Không sửa file đã chạy: thêm V3.",
          lambda w: [OUT(S("mg-h", "mg-nm"), "blur", 0, 0.5), PULSE("#mg-v2", 0.6), IN("#mg-err", "up", w("báo checksum")), SHAKE("#mg-err", w("báo checksum") + 0.6),
                     IN("#mg-rp", "up", w("Lệnh repair")), IN("#mg-v3", "right", w("thêm V ba"))]),
        B("Tên file phải có hai dấu gạch dưới. Đã chạy: chỉ một dấu gạch dưới thì file bị bỏ qua im lặng. File R thì chạy lại mỗi khi checksum đổi. Và với Spring Boot, đặt ddl auto là validate để Hibernate chỉ kiểm tra entity khớp schema.",
          "Một gạch dưới: bị bỏ qua. validate: chỉ kiểm tra.",
          lambda w: [OUT(S("mg-v1", "mg-v2", "mg-v3", "mg-err", "mg-rp"), "blur", 0, 0.5), IN("#mg-n1", "up", w("Đã chạy")), SHAKE("#mg-n1", w("Đã chạy") + 0.6),
                     IN("#mg-n2", "up", w("File R")), IN("#mg-n3", "up", w("Và với Spring Boot"))]),
        B("Database cũ chưa có Flyway thì Flyway từ chối. Đặt baseline on migrate là true và baseline version là một, thì history ghi một dòng baseline và chỉ chạy từ V hai.",
          "Database cũ: baseline rồi chạy từ V2.",
          lambda w: [OUT(S("mg-n1", "mg-n2", "mg-n3"), "blur", 0, 0.5), IN("#mg-l1", "up", 0.6), SHAKE("#mg-l1", 1.2), IN("#mg-l2", "up", w("Đặt baseline")), IN("#mg-l3", "up", w("thì history"))]),
        B("Khó hơn là đổi schema không dừng hệ thống. Khi rolling deploy, pod cũ và pod mới chạy cùng lúc trên một database, nên schema mới phải chạy được với code cũ. Cách làm là expand và contract: thêm cột mới, chép dữ liệu cũ theo lô, chuyển đọc, và cuối cùng mới xoá cột cũ.",
          "Expand, backfill, chuyển đọc, contract.",
          lambda w: [OUT(S("mg-l1", "mg-l2", "mg-l3"), "blur", 0, 0.5), IN("#mg-rd", "up", w("Khi rolling") - 0.3), IN("#mg-e1", "up", w("thêm cột mới")), IN("#mg-e2", "up", w("chép dữ liệu")), IN("#mg-e3", "up", w("chuyển đọc")), IN("#mg-e4", "up", w("cuối cùng mới xoá"))]),
        B("Ví dụ thêm NOT NULL cho bảng năm mươi triệu dòng. Một câu SET NOT NULL phải quét cả bảng dưới khoá ACCESS EXCLUSIVE, chặn cả đọc lẫn ghi. Cách an toàn: thêm cột cho phép NULL, backfill từng lô, thêm CHECK NOT VALID, VALIDATE CONSTRAINT quét mà không chặn đọc ghi, rồi mới SET NOT NULL.",
          "NOT NULL trên bảng lớn: CHECK NOT VALID, VALIDATE, rồi SET NOT NULL.",
          lambda w: [OUT(S("mg-e1", "mg-e2", "mg-e3", "mg-e4", "mg-rd"), "blur", 0, 0.5), IN("#mg-x0", "up", 0.6), SHAKE("#mg-x0", w("Một câu SET") + 0.8),
                     IN("#mg-x1", "up", w("thêm cột cho")), IN("#mg-x2", "up", w("backfill từng")), IN("#mg-x3", "up", w("thêm CHECK")), IN("#mg-x4", "up", w("VALIDATE CONSTRAINT")), IN("#mg-x5", "up", w("rồi mới SET"))]),
        B("Còn một bẫy nữa: ALTER TABLE phải chờ có khoá. Nếu có một transaction dài, mọi câu lệnh mới đều xếp hàng sau ALTER. Hãy đặt lock timeout ba giây trước câu DDL, để nó tự bỏ cuộc.",
          "lock_timeout cho DDL trên bảng lớn.",
          lambda w: [OUT(S("mg-x0", "mg-x1", "mg-x2", "mg-x3", "mg-x4", "mg-x5"), "blur", 0, 0.5), IN("#mg-k1", "up", 0.6), SHAKE("#mg-k1", w("mọi câu lệnh") + 0.5),
                     IN("#mg-k2", "blur", w("Hãy đặt"), 0.7), IN("#mg-k3", "up", w("để nó tự"))]),
        B("Cuối cùng, app có hai database thì auto configuration chỉ phục vụ một. Mỗi database phải tự khai một bộ: DataSource, Flyway, EntityManagerFactory và TransactionManager, bộ chính đánh dấu Primary. Và property của DataSource phải viết jdbc url, không phải url, vì nó bind thẳng vào Hikari.",
          "Hai database: mỗi bên một bộ; dùng jdbc-url.",
          lambda w: [OUT(S("mg-k1", "mg-k2", "mg-k3"), "blur", 0, 0.5), IN("#mg-d1", "up", 0.6), IN("#mg-d2", "up", w("Mỗi database phải") + 0.3),
                     PULSE("#mg-d1", w("bộ chính")), IN("#mg-d3", "up", w("Và property"))]),
        B("Bẫy cuối: Transactional không ghi tên sẽ dùng transaction manager Primary. Service của database phụ phải ghi rõ tên transaction manager của mình, nếu không các lệnh ghi sẽ không nằm chung transaction.",
          "@Transactional không ghi tên dùng bộ Primary.",
          lambda w: [DIM(S("mg-eye", "mg-q", "mg-d1", "mg-d2", "mg-d3"), 0, 0.07), TYPE("#mg-t1", 0.4, 0.05), IN("#mg-t2", "blur", w("Service của database"))]),
    ]),
    # ------------------------------------------------------------ cheat sheet
    dict(id="bang-nho", world=(1920, 1080), hud="", cam="".join([
        head("bn", "Bảng nhớ", "ACID, replication, shard, index"),
        card("bn-a1", 90, 300, 410, 400, "Atomicity", "làm trọn hoặc không làm gì", "cyan", 40, 30),
        card("bn-a2", 530, 300, 410, 400, "Consistency", "giữ dữ liệu hợp lệ theo ràng buộc", "cyan", 40, 30),
        card("bn-a3", 970, 300, 410, 400, "Isolation", "transaction đồng thời không thấy dở dang của nhau", "cyan", 40, 28),
        card("bn-a4", 1410, 300, 410, 400, "Durability", "commit rồi thì không mất dù sập nguồn", "cyan", 40, 30),
        titled("bn-m", 160, 300, 460, 200, "", "master", "ghi", "cyan", 48),
        titled("bn-r", 1300, 300, 460, 200, "", "read replica", "đọc, có độ trễ", "amber", 44),
        chip("bn-lag", 720, 280, "sao chép có độ trễ", "amber"),
        tag("bn-s1", 160, 620, 1600, 100, "✕ Vừa ghi rồi đọc từ replica: có thể thấy dữ liệu cũ", "red", 34),
        tag("bn-s2", 160, 760, 1600, 100, "✓ Đọc ngay sau ghi: đọc từ master (read-your-writes)", "green", 34),
        card("bn-c1", 90, 300, 520, 440, "Partition", "chia một bảng lớn thành nhiều phần trong cùng database", "cyan", 48, 32),
        card("bn-c2", 700, 300, 520, 440, "Sharding", "chia dữ liệu ra nhiều database theo khoá, chỉ khi một node không chịu nổi", "violet", 48, 30),
        card("bn-c3", 1310, 300, 520, 440, "Index", "tăng tốc đọc, làm chậm ghi. Đặt theo truy vấn thật, kiểm tra bằng EXPLAIN", "green", 48, 30),
        el("bn-t1", 0, 400, 1920, None, letters("Đọc ngay sau ghi: hỏi master"), "take r"),
        el("bn-t2", 0, 540, 1920, None, "replica có độ trễ · shard là biện pháp cuối", "take-sm r"),
        wires(arrow("bn-ar", [(625, 400), (1295, 400)], "amber")),
    ]), beats=[
        B("Bảng nhớ cuối bài. ACID là bốn bảo đảm của transaction. Atomicity làm trọn hoặc không làm gì. Consistency giữ dữ liệu hợp lệ theo ràng buộc. Isolation, các transaction đồng thời không thấy dở dang của nhau. Durability, commit rồi thì không mất dù sập nguồn.",
          "ACID: 4 bảo đảm của transaction.",
          lambda w: [IN("#bn-eye", "blur"), TYPE("#bn-q", 0.2, 0.05), *shrink("bn", 0.2), IN("#bn-a1", "up", w("Atomicity làm")), IN("#bn-a2", "up", w("Consistency giữ")), IN("#bn-a3", "up", w("Isolation,")), IN("#bn-a4", "up", w("Durability,"))]),
        B("Replication: read replica chia tải đọc, nhưng sao chép có độ trễ. Vừa ghi xong rồi đọc từ replica có thể thấy dữ liệu cũ, nên đọc ngay sau ghi thì đọc từ master.",
          "Replica có độ trễ: đọc ngay sau ghi thì hỏi master.",
          lambda w: [OUT(S("bn-a1", "bn-a2", "bn-a3", "bn-a4"), "blur", 0, 0.5), IN("#bn-m", "up", 0.6), IN("#bn-r", "up", w("read replica")), *ARROW("bn-ar", w("nhưng sao chép"), 0.6), IN("#bn-lag", "pop", w("độ trễ")),
                     IN("#bn-s1", "up", w("Vừa ghi xong")), IN("#bn-s2", "up", w("nên đọc ngay"))]),
        B("Partition chia một bảng lớn thành nhiều phần trong cùng database. Sharding chia dữ liệu ra nhiều database theo khoá, chỉ làm khi một node không còn chịu nổi. Index tăng tốc đọc nhưng làm chậm ghi, nên đặt theo truy vấn thật và kiểm tra bằng EXPLAIN.",
          "Partition, sharding, index.",
          lambda w: [OUT(S("bn-m", "bn-r", "bn-lag", "bn-s1", "bn-s2") + ", " + AR("bn-ar"), "blur", 0, 0.5), IN("#bn-c1", "up", 0.6), IN("#bn-c2", "up", w("Sharding chia")), IN("#bn-c3", "up", w("Index tăng"))]),
        B("Nhớ hai điều: đọc ngay sau ghi thì hỏi master, và chỉ shard khi một node không còn chịu nổi.",
          "Đọc ngay sau ghi: master. Shard là biện pháp cuối.",
          lambda w: [DIM(S("bn-eye", "bn-q", "bn-c1", "bn-c2", "bn-c3"), 0, 0.07), TYPE("#bn-t1", 0.3, 0.05), IN("#bn-t2", "blur", w("và chỉ shard"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt thiết kế database"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 118, 1660, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Chuẩn hoá", "mỗi thông tin một chỗ"), ("Ràng buộc", "database là chốt chặn cuối"),
                                      ("Transaction", "làm trọn hoặc không làm gì"),
                                      ("Pool", "cỡ vừa đủ rồi đo"),
                                      ("Migration", "file mới, expand rồi contract")])],
        el("ou-tr", 0, 810, 1920, None, "Bẫy: nuốt lỗi ràng buộc · mỗi câu tự commit · tăng pool bừa · sửa file đã chạy", "take-sm r", "font-size:34px"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Chuẩn hoá để mỗi thông tin chỉ có một chỗ. Ràng buộc để database là chốt chặn cuối cho mọi đường ghi.",
          "Chuẩn hoá và ràng buộc.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Chuẩn hoá để")), IN("#ou-r1", "right", w("Ràng buộc để"))]),
        B("Transaction để làm trọn hoặc không làm gì. Pool cỡ vừa đủ rồi đo. Và migration thì luôn thêm file mới, đi theo expand rồi contract.",
          "Transaction, pool và migration.",
          lambda w: [IN("#ou-r2", "right", w("Transaction để")), IN("#ou-r3", "right", w("Pool cỡ")), IN("#ou-r4", "right", w("migration thì"))]),
        B("Mỗi ý có bẫy riêng: nuốt lỗi ràng buộc, tưởng mỗi câu lệnh tự commit là đủ, tăng pool bừa, và sửa file migration đã chạy.",
          "Mỗi ý có bẫy riêng.",
          lambda w: [IN("#ou-tr", "blur", w("nuốt lỗi")), PULSE("#ou-r1", w("nuốt lỗi")), PULSE("#ou-r2", w("tưởng mỗi")), PULSE("#ou-r3", w("tăng pool")), PULSE("#ou-r4", w("sửa file"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
