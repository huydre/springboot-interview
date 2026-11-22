"""SOLID explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

All Java outputs come from one run on JDK 21 (study note: SOLID examples, web/src/data/lessons/solid.ts):
Invoice lines 100 + 250 -> total 350, html <b>350</b>, "INSERT invoice total=350";
discount on price 1000000: bad SEASONAL 900000, bad STUDENT -> IllegalArgumentException "unknown STUDENT",
Seasonal 900000, Vip 800000, Student 950000 with checkout() unchanged;
addDefaults(new ArrayList<>()) -> "ArrayList ok", addDefaults(new ReadOnlyList<>()) -> UnsupportedOperationException: read-only,
and passing a type that does not implement List fails to compile;
Robot.eat() -> "robots do not eat", Robot2 "robot works", Human "human works" / "human eats";
OrderService with MySqlOrderRepository -> "MySQL INSERT order-1", with FakeOrderRepository -> "fake saved: [order-2]".
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def when(spoken, phrase):
    """Seconds into the narration (at ~14.5 chars/s) where `phrase` starts; fit_to_audio rescales to the real take."""
    return round(spoken.index(phrase) / 14.5, 2)


def B(spoken, caption, fn):
    """A beat whose actions are built from the sentence, so reveals land on the words they illustrate."""
    return (spoken, caption, fn(lambda p: when(spoken, p)))


def S(*names):
    return ", ".join("#" + n for n in names)


def AR(*names):
    return ", ".join(f"#{n}, #{n}-h" for n in names)


def row(label, text):
    return f'<span class="mono big" style="font-size:44px">{label}</span><span style="font-size:38px">{esc(text)}</span>'


def head(p, eyebrow, title, size=80):
    """Scene opener: eyebrow + large headline top centre, shrunk by shrink() once the content comes in."""
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
               f'<b style="font-size:60px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:38px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


PRINCIPLES = [("S", "Single Responsibility"), ("O", "Open Closed"), ("L", "Liskov Substitution"),
              ("I", "Interface Segregation"), ("D", "Dependency Inversion")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn Java", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("SOLID là gì?"), "h1 r", "font-size:128px"),
        *[box(f"hk-c{i}", 85 + i * 355, 420, 330, 340,
              f'<b style="font-size:130px">{L}</b><span style="font-size:30px;color:var(--muted);text-align:center">{name}</span>', "cyan", "card")
          for i, (L, name) in enumerate(PRINCIPLES)],
        chip("hk-p1", 520, 850, "Dấu hiệu vi phạm", "amber"),
        chip("hk-p2", 1130, 850, "Cách sửa", "green"),
        el("hk-t1", 0, 400, 1920, None, letters("Kinh nghiệm, không phải luật"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "biết khi nào áp dụng, và khi nào không", "take-sm r"),
        wires(arrow("hk-a1", [(860, 882), (1100, 882)], "muted")),
    ]), beats=[
        B("Người phỏng vấn hỏi: Sô lít là gì?", "Người phỏng vấn hỏi: SOLID là gì?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Đây là năm chữ cái, mỗi chữ là một nguyên tắc thiết kế hướng đối tượng.",
          "5 chữ cái, 5 nguyên tắc thiết kế hướng đối tượng.",
          lambda w: [IN(f"#hk-c{i}", "pop", 0.4 + i * 0.75, 0.5) for i in range(5)]),
        B("Nhưng đọc đúng năm cái tên thì chưa đủ. Câu trả lời tốt nêu được dấu hiệu vi phạm trong code, và cách sửa.",
          "Nêu được dấu hiệu vi phạm và cách sửa.",
          lambda w: [IN("#hk-p1", "left", w("nêu được")), *ARROW("hk-a1", w("và cách sửa") - 0.5, 0.5), IN("#hk-p2", "pop", w("và cách sửa"))]),
        B("Và hãy nhớ, đây là kinh nghiệm, chứ không phải luật bắt buộc.",
          "Kinh nghiệm, không phải luật bắt buộc.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", 2.6)]),
    ]),
    # ------------------------------------------------------------ SRP
    dict(id="srp", world=(1920, 1080), hud="", cam="".join([
        head("sr", "S · Single Responsibility", "Một class, một lý do thay đổi"),
        rule("sr-rule", "Một class chỉ có một lý do để thay đổi", "Nhưng \"lý do thay đổi\" nghĩa là gì?"),
        cbox("sr-code", 110, 290, 1000, "Invoice.java",
             "class Invoice {\n"
             "    long total(List<Long> lines) { ... }\n"
             "    String html(long total)      { ... }\n"
             "    void save(long total)        { ... }\n"
             "}", "violet", 38),
        tag("sr-p1", 1210, 300, 600, 100, "Kế toán · tính thuế", "amber"),
        tag("sr-p2", 1210, 430, 600, 100, "Marketing · mẫu hóa đơn", "amber"),
        tag("sr-p3", 1210, 560, 600, 100, "DBA · cấu trúc bảng", "amber"),
        bigerr("sr-err", 110, 730, 1000, "✕ 3 người, 3 lý do, cùng một class", 38),
        tag("sr-q1", 110, 250, 500, 100, "Kế toán", "amber", 36),
        tag("sr-q2", 710, 250, 500, 100, "Marketing", "amber", 36),
        tag("sr-q3", 1310, 250, 500, 100, "DBA", "amber", 36),
        tag("sr-n1", 110, 450, 500, 160, "InvoiceCalculator", "cyan", 36),
        tag("sr-n2", 710, 450, 500, 160, "InvoicePrinter", "cyan", 36),
        tag("sr-n3", 1310, 450, 500, 160, "InvoiceRepository", "cyan", 36),
        tag("sr-r1", 110, 700, 500, 120, "100 + 250: total = 350", "green", 30),
        tag("sr-r2", 710, 700, 500, 120, "<b>350</b>", "green", 30),
        tag("sr-r3", 1310, 700, 500, 120, "INSERT invoice total=350", "green", 30),
        el("sr-t1", 0, 400, 1920, None, letters("Ai yêu cầu sửa class này?"), "take r"),
        el("sr-t2", 0, 540, 1920, None, "nhiều hơn một câu trả lời thì tách", "take-sm r"),
        wires(arrow("sr-a1", [(1200, 350), (1120, 391)], "amber"), arrow("sr-a2", [(1200, 480), (1120, 442)], "amber"),
              arrow("sr-a3", [(1200, 610), (1120, 493)], "amber"),
              arrow("sr-b1", [(360, 355), (360, 445)], "cyan"), arrow("sr-b2", [(960, 355), (960, 445)], "cyan"),
              arrow("sr-b3", [(1560, 355), (1560, 445)], "cyan")),
    ]), beats=[
        B("Chữ S, Single Responsibility. Một class chỉ nên có một lý do để thay đổi. Nhưng lý do thay đổi nghĩa là gì?",
          "S: một class chỉ có một lý do để thay đổi.",
          lambda w: [IN("#sr-eye", "blur"), TYPE("#sr-q", 0.2, 0.05), IN("#sr-rule", "up", w("Một class") + 0.3)]),
        B("Hãy nhìn class Invoice. Nó tính tiền, dựng giao diện hóa đơn, và lưu vào database.",
          "Invoice: tính tiền, dựng hóa đơn, lưu database.",
          lambda w: [OUT("#sr-rule", "blur", 0, 0.4), *shrink("sr", 0), IN("#sr-code", "blur", 0.5, 0.7), PULSE("#sr-code", w("Nó tính")), PULSE("#sr-code", w("dựng")), PULSE("#sr-code", w("lưu"))]),
        B("Lý do thay đổi là có một người yêu cầu sửa. Kế toán đổi cách tính thuế, nên sửa total. Marketing đổi mẫu hóa đơn, nên sửa html. DBA đổi cấu trúc bảng, nên sửa save.",
          "Lý do thay đổi = một người yêu cầu sửa.",
          lambda w: [IN("#sr-p1", "right", w("Kế toán")), *ARROW("sr-a1", w("Kế toán") + 0.5, 0.5),
                     IN("#sr-p2", "right", w("Marketing")), *ARROW("sr-a2", w("Marketing") + 0.5, 0.5),
                     IN("#sr-p3", "right", w("DBA")), *ARROW("sr-a3", w("DBA") + 0.5, 0.5)]),
        B("Ba người khác nhau cùng sửa một file. Sửa chỗ này, rất dễ làm hỏng chỗ kia.",
          "3 người sửa chung một file: dễ hỏng chéo.",
          lambda w: [IN("#sr-err", "up", 0.5), SHAKE("#sr-err", 1.0), PULSE("#sr-code", w("Sửa chỗ"))]),
        B("Cách sửa là tách thành ba class: Invoice Calculator, Invoice Printer và Invoice Repository. Mỗi yêu cầu giờ chỉ chạm đúng một class. Chạy thật: tổng là ba trăm năm mươi.",
          "Tách 3 class. Chạy thật: total = 350.",
          lambda w: [OUT(S("sr-code", "sr-p1", "sr-p2", "sr-p3", "sr-err") + ", " + AR("sr-a1", "sr-a2", "sr-a3"), "blur", 0, 0.5),
                     IN("#sr-q1", "down", 0.7), IN("#sr-n1", "up", w("Invoice Calculator") - 0.3), *ARROW("sr-b1", w("Invoice Calculator"), 0.4),
                     IN("#sr-q2", "down", w("Invoice Printer") - 0.9), IN("#sr-n2", "up", w("Invoice Printer") - 0.3), *ARROW("sr-b2", w("Invoice Printer"), 0.4),
                     IN("#sr-q3", "down", w("Invoice Repository") - 0.9), IN("#sr-n3", "up", w("Invoice Repository") - 0.3), *ARROW("sr-b3", w("Invoice Repository"), 0.4),
                     IN("#sr-r1", "up", w("Chạy thật")), IN("#sr-r2", "up", w("Chạy thật") + 0.5), IN("#sr-r3", "up", w("Chạy thật") + 1.0)]),
        B("Câu tự kiểm rất đơn giản: ai yêu cầu sửa class này? Nếu có hơn một câu trả lời, hãy tách.",
          "Tự hỏi: ai yêu cầu sửa class này?",
          lambda w: [DIM(S("sr-eye", "sr-q", "sr-q1", "sr-q2", "sr-q3", "sr-n1", "sr-n2", "sr-n3", "sr-r1", "sr-r2", "sr-r3") + ", " + AR("sr-b1", "sr-b2", "sr-b3"), 0, 0.07),
                     TYPE("#sr-t1", 0.4, 0.04), IN("#sr-t2", "blur", w("Nếu có"))]),
    ]),
    # ------------------------------------------------------------ SRP exceptions
    dict(id="srp-limits", world=(1920, 1080), hud="", cam="".join([
        head("sl", "S · Ngoại lệ", "Khi nào cố ý KHÔNG tách class", 80),
        box("sl-k1", 110, 250, 500, 640, '<b style="font-size:42px">Aggregate (DDD)</b><span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Order giữ cả dòng hàng và quy tắc của chúng</span><div style="height:240px"></div>', "cyan", "card"),
        box("sl-k2", 710, 250, 500, 640, '<b style="font-size:42px">Transaction</b><span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Các bước phải thành công hoặc thất bại cùng nhau</span><div style="height:240px"></div>', "cyan", "card"),
        box("sl-k3", 1310, 250, 500, 640, '<b style="font-size:42px">Hiệu năng</b><span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Đoạn code chạy rất nhiều lần, mỗi object thừa đều tốn</span><div style="height:240px"></div>', "cyan", "card"),
        tag("sl-v1a", 150, 690, 200, 70, "dòng hàng", "cyan", 28), tag("sl-v1b", 370, 690, 200, 70, "giảm giá", "cyan", 28),
        note("sl-v1x", 150, 790, 440, "✕ tách ra: dễ sai trạng thái", "red", 28),
        tag("sl-v2a", 740, 690, 130, 70, "bước A", "cyan", 26), tag("sl-v2b", 890, 690, 130, 70, "bước B", "cyan", 26), tag("sl-v2c", 1040, 690, 130, 70, "bước C", "cyan", 26),
        note("sl-v2x", 740, 790, 440, "✕ mất ranh giới transaction", "red", 28),
        tag("sl-v3b", 1350, 690, 200, 70, "8 object", "amber", 28), tag("sl-v3a", 1570, 690, 200, 70, "1 object", "green", 28),
        note("sl-v3x", 1350, 790, 440, "✕ tốn bộ nhớ, GC và cache", "red", 28),
        note("sl-def", 330, 450, 1260, "Aggregate = nhóm object luôn đi cùng nhau,\nchung một bộ luật", "cyan", 44),
        box("sl-agh", 500, 250, 920, 100, '<b style="font-size:44px">Order · aggregate root</b>', "cyan", "card"),
        box("sl-agb", 500, 365, 920, 330, "", "cyan", "card"),
        tag("sl-ln1", 540, 400, 260, 90, "dòng: pen", "cyan", 30), tag("sl-ln2", 820, 400, 260, 90, "dòng: book", "cyan", 30), tag("sl-ln3", 1100, 400, 260, 90, "dòng: bag", "cyan", 30),
        tag("sl-ru1", 540, 540, 260, 130, "tối đa 3 dòng", "amber", 28), tag("sl-ru2", 820, 540, 260, 130, "giảm tối đa 30%", "amber", 26), tag("sl-ru3", 1100, 540, 260, 130, "đã PAID: khóa", "amber", 28),
        bigerr("sl-bad", 110, 740, 1700, "✕ 3 service sửa thẳng dữ liệu: đơn có 6 dòng, giảm 90%, thanh toán rồi vẫn thêm hàng", 34),
        tag("sl-g1", 110, 740, 560, 100, "dòng 4 → max 3 lines", "green", 30), tag("sl-g2", 680, 740, 560, 100, "giảm 90% → capped at 30%", "green", 30), tag("sl-g3", 1250, 740, 560, 100, "đã PAID → cannot add lines", "green", 30),
        el("sl-t1", 0, 400, 1920, None, letters("Tách có chủ đích"), "take r"),
        el("sl-t2", 0, 540, 1920, None, "biết mình đang đánh đổi gì", "take-sm r"),
    ]), beats=[
        B("Quay lại chữ S một chút. Có ba trường hợp bạn nên cố ý không tách class, và nói được lý do thì rất ăn điểm.",
          "Ba trường hợp nên cố ý không tách class.",
          lambda w: [IN("#sl-eye", "blur"), TYPE("#sl-q", 0.2, 0.05)]),
        B("Một: aggregate, một khái niệm của thiết kế hướng miền. Aggregate là một nhóm object luôn đi cùng nhau và có chung luật. Cái đứng ngoài cùng gọi là aggregate root. Ví dụ đơn hàng: Order là root, bên trong là các dòng hàng. Đơn hàng có ba luật: tối đa ba dòng, giảm giá tối đa ba mươi phần trăm, và đã thanh toán thì không thêm hàng.",
          "Aggregate: nhóm object chung một bộ luật.",
          lambda w: [*shrink("sl", 0), IN("#sl-def", "up", 0.4), OUT("#sl-def", "blur", w("Cái đứng") - 0.3, 0.4),
                     IN("#sl-agh", "up", w("Cái đứng")), IN("#sl-agb", "up", w("Cái đứng") + 0.2),
                     IN("#sl-ln1", "up", w("bên trong")), IN("#sl-ln2", "up", w("bên trong") + 0.4), IN("#sl-ln3", "up", w("bên trong") + 0.8),
                     IN("#sl-ru1", "pop", w("tối đa ba dòng")), IN("#sl-ru2", "pop", w("giảm giá tối đa")), IN("#sl-ru3", "pop", w("đã thanh toán thì không"))]),
        B("Nếu ta tách thành ba service, mỗi service sửa thẳng dữ liệu đơn hàng, thì không ai giữ các luật này. Chạy thật: đơn có sáu dòng, giảm chín mươi phần trăm, và đã thanh toán rồi vẫn thêm hàng được.",
          "Tách thành nhiều service: luật bị bỏ ngỏ.",
          lambda w: [DIM(S("sl-agh", "sl-agb", "sl-ln1", "sl-ln2", "sl-ln3", "sl-ru1", "sl-ru2", "sl-ru3"), 0, 0.15), IN("#sl-bad", "up", w("Chạy thật")), SHAKE("#sl-bad", w("Chạy thật") + 0.8)]),
        B("Còn khi Order giữ luật trong chính nó, mọi thay đổi đều đi qua một cửa. Dòng thứ tư bị từ chối. Giảm chín mươi phần trăm bị chặn ở ba mươi. Đã thanh toán thì không thêm hàng được nữa.",
          "Order giữ luật: mọi thay đổi qua một cửa.",
          lambda w: [OUT("#sl-bad", "blur", 0, 0.4), TO(S("sl-agh", "sl-agb", "sl-ln1", "sl-ln2", "sl-ln3", "sl-ru1", "sl-ru2", "sl-ru3"), {"opacity": 1}, 0, 0.5),
                     IN("#sl-g1", "up", w("Dòng thứ tư")), IN("#sl-g2", "up", w("Giảm chín mươi")), IN("#sl-g3", "up", w("Đã thanh toán thì"))]),
        B("Vì vậy, khi nhiều hành vi cùng phục vụ một bộ luật chung, hãy giữ chúng trong một class. Đó là lý do thứ nhất để cố ý không tách.",
          "Một bộ luật chung thì giữ trong một class.",
          lambda w: [OUT(S("sl-agh", "sl-agb", "sl-ln1", "sl-ln2", "sl-ln3", "sl-ru1", "sl-ru2", "sl-ru3", "sl-g1", "sl-g2", "sl-g3"), "blur", 0, 0.5),
                     IN("#sl-k1", "up", 0.7), IN("#sl-v1a", "up", 1.3), IN("#sl-v1b", "up", 1.8), IN("#sl-v1x", "up", w("lý do thứ nhất"))]),
        B("Hai: transaction. Các bước phải cùng thành công hoặc cùng thất bại. Rải ra nhiều class gọi lẫn nhau thì dễ mất ranh giới transaction, entity bị detach, và gặp Lazy Initialization Exception.",
          "2. Transaction: các bước phải đi cùng nhau.",
          lambda w: [IN("#sl-k2", "up", 0.3), IN("#sl-v2a", "up", w("Các bước")), IN("#sl-v2b", "up", w("Các bước") + 0.5), IN("#sl-v2c", "up", w("Các bước") + 1.0), IN("#sl-v2x", "up", w("Rải ra")), SHAKE("#sl-v2x", w("Rải ra") + 0.6)]),
        B("Ba: hiệu năng. Ở đoạn code chạy rất nhiều lần, tách thành nhiều object nhỏ làm tăng cấp phát bộ nhớ và áp lực GC. Giữ dữ liệu liên quan cùng một chỗ thì tận dụng CPU cache tốt hơn.",
          "3. Hiệu năng: ít object, ít GC.",
          lambda w: [IN("#sl-k3", "up", 0.3), IN("#sl-v3b", "up", w("tách thành")), IN("#sl-v3x", "up", w("áp lực")), IN("#sl-v3a", "pop", w("Giữ dữ liệu"))]),
        B("Điều quan trọng là bạn biết mình đang đánh đổi gì, và nói rõ lý do khi trả lời.",
          "Biết mình đánh đổi gì và nói rõ lý do.",
          lambda w: [DIM(S("sl-eye", "sl-q", "sl-k1", "sl-k2", "sl-k3", "sl-v1a", "sl-v1b", "sl-v1x", "sl-v2a", "sl-v2b", "sl-v2c", "sl-v2x", "sl-v3a", "sl-v3b", "sl-v3x"), 0, 0.07),
                     TYPE("#sl-t1", 0.4, 0.04), IN("#sl-t2", "blur", w("và nói rõ"))]),
    ]),
    # ------------------------------------------------------------ OCP
    dict(id="ocp", world=(1920, 1080), hud="", cam="".join([
        head("oc", "O · Open Closed", "Thêm class mới, không sửa code cũ"),
        rule("oc-rule", "Mở cho mở rộng, đóng với sửa đổi", "Thêm tính năng bằng class mới, không mở code đang chạy ra sửa"),
        cbox("oc-bad", 90, 260, 1010, "Discount.java",
             "long discount(String type, long price) {\n"
             "    if (type.equals(\"SEASONAL\"))\n"
             "        return price * 90 / 100;\n"
             "    else if (type.equals(\"VIP\"))\n"
             "        return price * 80 / 100;\n"
             "    else throw new IllegalArgumentException(\n"
             "        \"unknown \" + type);\n"
             "}", "violet", 34),
        tag("oc-new", 1180, 280, 630, 100, "discount(\"STUDENT\", price)", "amber", 30),
        bigerr("oc-err", 1180, 440, 630, "✕ IllegalArgumentException:<br>unknown STUDENT", 32),
        note("oc-fix", 1180, 630, 630, "Thêm một loại =\nmở hàm đang chạy ra sửa", "red", 34),
        titled("oc-i", 230, 270, 600, 140, "«interface»", "Discount", "", "violet", 44),
        titled("oc-s1", 110, 530, 290, 130, "", "Seasonal", "", "cyan", 34),
        titled("oc-s2", 430, 530, 290, 130, "", "Vip", "", "cyan", 34),
        titled("oc-s3", 750, 530, 290, 130, "", "Student", "mới", "green", 34),
        note("oc-ck", 110, 730, 930, "checkout(price, Discount d): không đổi một dòng", "green"),
        cbox("oc-code", 1090, 270, 720, "Student.java",
             "class Student implements Discount {\n"
             "    public long apply(long p) {\n"
             "        return p * 95 / 100;\n"
             "    }\n"
             "}", "violet", 28),
        titled("oc-r1", 1090, 660, 230, 140, "Seasonal", "900000", "", "green", 40),
        titled("oc-r2", 1340, 660, 230, 140, "Vip", "800000", "", "green", 40),
        titled("oc-r3", 1590, 660, 220, 140, "Student", "950000", "", "green", 40),
        el("oc-t1", 0, 400, 1920, None, letters("Quy tắc ba lần"), "take r"),
        el("oc-t2", 0, 540, 1920, None, "lần 1 viết thẳng · lần 2 chịu lặp · lần 3 mới tách", "take-sm r"),
        wires(arrow("oc-a1", [(1170, 330), (1110, 330)], "amber"),
              arrow("oc-b1", [(255, 525), (400, 415)], "violet", True), arrow("oc-b2", [(575, 525), (530, 415)], "violet", True),
              arrow("oc-b3", [(895, 525), (660, 415)], "violet", True)),
    ]), beats=[
        B("Chữ O, Open Closed. Code nên mở cho việc mở rộng, và đóng với việc sửa đổi. Nghĩa là thêm tính năng bằng class mới, không mở code đang chạy tốt ra để sửa.",
          "O: mở cho mở rộng, đóng với sửa đổi.",
          lambda w: [IN("#oc-eye", "blur"), TYPE("#oc-q", 0.2, 0.05), IN("#oc-rule", "up", w("Code nên") + 0.3)]),
        B("Ví dụ tính giảm giá. Cách đầu dùng if else theo loại: mùa lễ giảm mười phần trăm, còn Vip giảm hai mươi phần trăm.",
          "Giảm giá bằng if/else: SEASONAL 10%, VIP 20%.",
          lambda w: [OUT("#oc-rule", "blur", 0, 0.4), *shrink("oc", 0), IN("#oc-bad", "blur", 0.5, 0.7), PULSE("#oc-bad", w("mùa lễ")), PULSE("#oc-bad", w("còn Vip"))]),
        B("Giờ muốn thêm loại Student, bạn phải mở chính hàm này ra sửa. Chưa sửa mà gọi Student thì hàm ném lỗi: unknown Student.",
          "Thêm STUDENT phải sửa hàm này, chưa sửa thì ném lỗi.",
          lambda w: [IN("#oc-new", "right", 0.3), *ARROW("oc-a1", 1.0, 0.5), IN("#oc-fix", "up", w("bạn phải")),
                     IN("#oc-err", "up", w("Chưa sửa") + 0.8), SHAKE("#oc-err", w("Chưa sửa") + 1.4)]),
        B("Cách hai: tách interface Discount. Mỗi loại giảm giá là một class riêng, như Seasonal và Vip.",
          "Cách 2: interface Discount, mỗi loại một class.",
          lambda w: [OUT(S("oc-bad", "oc-new", "oc-err", "oc-fix") + ", " + AR("oc-a1"), "blur", 0, 0.5),
                     IN("#oc-i", "down", 0.7), IN("#oc-s1", "up", w("Seasonal") - 0.3), *ARROW("oc-b1", w("Seasonal"), 0.4),
                     IN("#oc-s2", "up", w("và Vip") - 0.4), *ARROW("oc-b2", w("và Vip") - 0.1, 0.4)]),
        B("Thêm Student chỉ cần viết thêm một class. Hàm checkout không đổi một dòng. Chạy thật, với giá một triệu: Seasonal ra chín trăm nghìn, Vip tám trăm nghìn, Student chín trăm năm mươi nghìn.",
          "Thêm Student = thêm class, checkout() không đổi.",
          lambda w: [IN("#oc-s3", "up", 0.3), *ARROW("oc-b3", 0.8, 0.5), IN("#oc-code", "right", w("Hàm checkout") - 0.5),
                     IN("#oc-ck", "up", w("Hàm checkout")),
                     IN("#oc-r1", "up", w("Seasonal ra")), PULSE("#oc-s1", w("Seasonal ra")),
                     IN("#oc-r2", "up", w("Vip tám")), PULSE("#oc-s2", w("Vip tám")),
                     IN("#oc-r3", "up", w("Student chín")), PULSE("#oc-s3", w("Student chín"))]),
        B("Nhưng đừng áp dụng quá sớm. Theo quy tắc ba lần: lần đầu cứ viết thẳng, lần hai chịu lặp, tới lần thứ ba mới tách.",
          "Rule of Three: tới lần thứ 3 mới tách.",
          lambda w: [DIM(S("oc-eye", "oc-q", "oc-i", "oc-s1", "oc-s2", "oc-s3", "oc-ck", "oc-code", "oc-r1", "oc-r2", "oc-r3") + ", " + AR("oc-b1", "oc-b2", "oc-b3"), 0, 0.07),
                     TYPE("#oc-t1", w("Theo quy tắc"), 0.05), IN("#oc-t2", "blur", w("lần đầu"))]),
    ]),
    # ------------------------------------------------------------ LSP
    dict(id="lsp", world=(1920, 1080), hud="", cam="".join([
        head("ls", "L · Liskov Substitution", "Class con phải thay được class cha"),
        rule("ls-rule", "Dùng class cha ở đâu, thay class con vẫn đúng", "\"Là một\" ngoài đời chưa đủ"),
        cbox("ls-c1", 80, 225, 1000, "ReadOnlyList.java",
             "class ReadOnlyList<E> extends ArrayList<E> {\n"
             "    public boolean add(E e) {\n"
             "        throw new UnsupportedOperationException(\n"
             "            \"read-only\");\n"
             "    }\n"
             "}", "violet", 30),
        cbox("ls-c2", 80, 665, 1000, "addDefaults",
             "static void addDefaults(List<String> list) {\n"
             "    list.add(\"a\");\n"
             "    list.add(\"b\");\n"
             "}", "cyan", 30),
        titled("ls-goal", 1130, 260, 680, 220, "Mục tiêu", "danh sách chỉ đọc", "ReadOnlyList extends ArrayList", "violet", 40),
        tag("ls-k1", 1130, 250, 680, 90, "addDefaults(new ArrayList<>())", "amber", 30),
        tag("ls-o1", 1130, 360, 680, 90, "ArrayList ok", "green", 34),
        tag("ls-k2", 1130, 510, 680, 90, "addDefaults(new ReadOnlyList<>())", "amber", 30),
        bigerr("ls-e2", 1130, 630, 680, "✕ UnsupportedOperationException:<br>read-only", 32),
        titled("ls-rl", 110, 250, 820, 190, "«interface»", "ReadableList", "get(), size()", "violet", 44),
        tag("ls-ro", 110, 560, 820, 120, "ReadOnlyList", "cyan", 38),
        note("ls-no", 110, 730, 820, "không có add(), không còn là List", "red"),
        tag("ls-k3", 1010, 260, 800, 90, "addDefaults(new ReadOnlyList<>())", "amber", 30),
        box("ls-o3", 1010, 390, 800, 140, '<span style="font-size:34px;font-weight:600;text-align:center;line-height:1.3;padding:0 20px">✓ compiler chặn ngay: ReadOnlyList không phải List</span>', "green"),
        tag("ls-k4", 1010, 620, 800, 90, "addDefaults(new ArrayList<>())", "amber", 30),
        tag("ls-o4", 1010, 730, 800, 90, "ArrayList ok", "green", 34),
        el("ls-t1", 0, 400, 1920, None, letters("Con phải đúng như cha đã hứa"), "take r"),
        el("ls-t2", 0, 540, 1920, None, "override ném UnsupportedOperationException là dấu hiệu sai", "take-sm r"),
        wires(arrow("ls-a1", [(520, 555), (520, 445)], "violet", True)),
    ]), beats=[
        B("Chữ L, Lít cốp Substitution. Ở đâu dùng class cha, thay bằng class con thì code vẫn phải đúng. Quan hệ là một ngoài đời chưa đủ.",
          "L: thay class con vào chỗ class cha, code vẫn đúng.",
          lambda w: [IN("#ls-eye", "blur"), TYPE("#ls-q", 0.2, 0.05), IN("#ls-rule", "up", w("Ở đâu") + 0.3)]),
        B("Bạn cần một danh sách chỉ đọc, nên viết ReadOnlyList kế thừa ArrayList, và cho add ném lỗi.",
          "ReadOnlyList extends ArrayList, add() ném lỗi.",
          lambda w: [OUT("#ls-rule", "blur", 0, 0.4), *shrink("ls", 0), IN("#ls-c1", "blur", 0.5, 0.7), IN("#ls-goal", "right", 0.5), PULSE("#ls-c1", w("cho add"))]),
        B("Hàm add Defaults nhận một List, rồi thêm hai phần tử. Hàm này đúng với mọi List.",
          "addDefaults(List) đúng với mọi List.",
          lambda w: [IN("#ls-c2", "up", 0.3, 0.7), PULSE("#ls-c2", w("đúng với"))]),
        B("Với ArrayList thì chạy tốt. Với ReadOnlyList thì nổ lúc chạy, vì add ném Unsupported Operation Exception.",
          "ReadOnlyList: nổ lúc chạy.",
          lambda w: [OUT("#ls-goal", "blur", 0, 0.4), IN("#ls-k1", "right", 0.2), IN("#ls-o1", "up", 1.2), IN("#ls-k2", "right", w("Với ReadOnlyList")),
                     IN("#ls-e2", "up", w("thì nổ")), SHAKE("#ls-e2", w("thì nổ") + 0.6)]),
        B("Cách sửa là tách kiểu. ReadOnlyList không còn là một List, nó chỉ có get và size. Gọi add Defaults với nó thì compiler chặn ngay, thay vì nổ ở production.",
          "Tách kiểu: compiler chặn ngay, không nổ ở production.",
          lambda w: [OUT(S("ls-c1", "ls-c2", "ls-k1", "ls-o1", "ls-k2", "ls-e2"), "blur", 0, 0.5),
                     IN("#ls-rl", "down", 0.7), IN("#ls-ro", "up", w("ReadOnlyList không")), *ARROW("ls-a1", w("ReadOnlyList không") + 0.4, 0.5),
                     IN("#ls-no", "up", w("nó chỉ")),
                     IN("#ls-k3", "right", w("Gọi add")), IN("#ls-o3", "up", w("compiler"), 0.6), PULSE("#ls-o3", w("compiler") + 0.8),
                     IN("#ls-k4", "right", w("thay vì") + 0.4), IN("#ls-o4", "up", w("production"))]),
        B("Dấu hiệu vi phạm: override rồi ném Unsupported Operation Exception, hoặc phải instanceof trước khi dùng.",
          "Dấu hiệu: ném UnsupportedOperationException, instanceof.",
          lambda w: [OUT(S("ls-rl", "ls-o3"), "blur", 0, 0.4), DIM(S("ls-eye", "ls-q", "ls-ro", "ls-no", "ls-k3", "ls-k4", "ls-o4") + ", " + AR("ls-a1"), 0, 0.07),
                     TYPE("#ls-t1", 0.4, 0.04), IN("#ls-t2", "blur", w("hoặc phải"))]),
    ]),
    # ------------------------------------------------------------ LSP, all six rules
    dict(id="lsp-rules", world=(1920, 1080), hud="", cam="".join([
        head("lr", "L · Liskov đầy đủ", "6 quy tắc của lời hứa", 80),
        titled("lr-1", 110, 250, 800, 150, "1 · Đầu vào", "Không chặt hơn cha", "cha nhận mọi int, con không đòi > 0", "amber", 36),
        titled("lr-2", 1010, 250, 800, 150, "2 · Kết quả", "Không yếu hơn cha", "cha không trả null, con cũng không", "amber", 36),
        titled("lr-3", 110, 420, 800, 150, "3 · Invariant", "Giữ điều luôn đúng của cha", "con không phá ràng buộc của cha", "amber", 36),
        titled("lr-4", 1010, 420, 800, 150, "4 · History constraint", "Cha bất biến thì con cũng vậy", "không thêm method làm đổi trạng thái", "amber", 36),
        titled("lr-5", 110, 590, 800, 150, "5 · Exception", "Hẹp hơn hoặc bằng cha", "IOException → FileNotFoundException ok", "green", 36),
        titled("lr-6", 1010, 590, 800, 150, "6 · Kiểu trả về", "Hẹp hơn, không rộng hơn", "Object → String ok, ngược lại báo lỗi", "green", 36),
        chip("lr-g1", 110, 800, "1 đến 4: lời hứa về hành vi, compiler không bắt", "amber"),
        chip("lr-g2", 1010, 800, "5 và 6: compiler kiểm tra", "green"),
        cbox("lr-jdk", 110, 270, 1000, "JDK", "List<String> ro =\n    Collections.unmodifiableList(list);\nro.add(\"x\");", "violet", 34),
        bigerr("lr-je", 1160, 320, 650, "✕ UnsupportedOperationException", 32),
        tag("lr-j1", 110, 600, 800, 120, "Java 1.2: tránh nhân đôi cây interface", "amber", 30),
        tag("lr-j2", 1010, 600, 800, 120, "Kotlin: List / MutableList tách riêng", "green", 30),
    ]), beats=[
        B("Định nghĩa đầy đủ của Liskov có sáu quy tắc. Bốn quy tắc đầu là lời hứa về hành vi.",
          "Liskov đầy đủ có 6 quy tắc.",
          lambda w: [IN("#lr-eye", "blur"), TYPE("#lr-q", 0.2, 0.05)]),
        B("Một: đầu vào không chặt hơn. Cha nhận mọi số nguyên thì con không được đòi lớn hơn không. Hai: kết quả không yếu hơn. Cha hứa không trả null thì con cũng vậy.",
          "1. Đầu vào không chặt hơn. 2. Kết quả không yếu hơn.",
          lambda w: [*shrink("lr", 0), IN("#lr-1", "up", 0.5), PULSE("#lr-1", w("Cha nhận")), IN("#lr-2", "up", w("Hai:")), PULSE("#lr-2", w("Cha hứa"))]),
        B("Ba: giữ các bất biến của class cha. Bốn: history constraint. Cha bất biến thì con không được thêm method làm đổi trạng thái. Compiler không bắt được bốn quy tắc này.",
          "3. Giữ invariant. 4. History constraint.",
          lambda w: [IN("#lr-3", "up", 0.3), IN("#lr-4", "up", w("Bốn:")), IN("#lr-g1", "left", w("Compiler không"))]),
        B("Hai quy tắc còn lại thì compiler kiểm tra. Năm: ném checked exception hẹp hơn hoặc bằng cha. Sáu: kiểu trả về được hẹp hơn, không được rộng hơn. Viết rộng hơn thì báo lỗi cannot override, đã thử trên JDK hai mươi mốt.",
          "5. Exception hẹp hơn. 6. Kiểu trả về hẹp hơn.",
          lambda w: [IN("#lr-5", "up", w("Năm:")), IN("#lr-6", "up", w("Sáu:")), IN("#lr-g2", "right", w("Viết rộng")), PULSE("#lr-g2", w("Viết rộng") + 0.8)]),
        B("Chính JDK cũng thỏa hiệp ở đây. unmodifiable List trả về một List mà add lại ném lỗi. Java một chấm hai chọn vậy để khỏi nhân đôi cây interface. Kotlin sửa ngay trong hệ thống kiểu: List chỉ đọc, Mutable List mới có add.",
          "JDK thỏa hiệp, Kotlin tách kiểu.",
          lambda w: [OUT(S("lr-1", "lr-2", "lr-3", "lr-4", "lr-5", "lr-6", "lr-g1", "lr-g2"), "blur", 0, 0.5),
                     IN("#lr-jdk", "blur", 0.6, 0.7), PULSE("#lr-jdk", w("add lại")), IN("#lr-je", "up", w("add lại") + 0.4), SHAKE("#lr-je", w("add lại") + 1.0),
                     IN("#lr-j1", "up", w("Java một")), IN("#lr-j2", "up", w("Kotlin"))]),
    ]),
    # ------------------------------------------------------------ ISP
    dict(id="isp", world=(1920, 1080), hud="", cam="".join([
        head("is", "I · Interface Segregation", "Interface nhỏ theo vai trò"),
        rule("is-rule", "Client không bị ép phụ thuộc method nó không dùng", "Chia interface béo thành interface nhỏ theo vai trò"),
        cbox("is-c1", 100, 270, 640, "FatWorker.java",
             "interface FatWorker {\n"
             "    void work();\n"
             "    void eat();\n"
             "}", "violet", 32),
        tag("is-hm", 800, 330, 1010, 140, "Human: work() và eat() → ổn", "green", 36),
        cbox("is-c2", 800, 270, 1010, "Robot.java",
             "class Robot implements FatWorker {\n"
             "    public void work() { ... }\n"
             "    public void eat() {\n"
             "        throw new UnsupportedOperationException(\n"
             "            \"robots do not eat\");\n"
             "    }\n"
             "}", "cyan", 30),
        note("is-note", 100, 620, 640, "Robot bị ép phải có eat()", "red"),
        bigerr("is-err", 800, 730, 1010, "✕ Robot.eat(): robots do not eat", 36),
        titled("is-w", 120, 290, 540, 150, "«interface»", "Workable", "", "violet", 44),
        titled("is-e", 780, 290, 540, 150, "«interface»", "Eatable", "", "violet", 44),
        tag("is-rb", 120, 620, 400, 120, "Robot", "cyan", 38),
        tag("is-hu", 580, 620, 400, 120, "Human", "cyan", 38),
        tag("is-r1", 1400, 290, 410, 110, "robot works", "green", 34),
        tag("is-r2", 1400, 450, 410, 110, "human works", "green", 34),
        tag("is-r3", 1400, 610, 410, 110, "human eats", "green", 34),
        el("is-t1", 0, 340, 1920, None, '<span class="strike-txt">Mỗi method một interface</span>', "take-sm r"),
        el("is-t2", 0, 450, 1920, None, letters("Tách theo vai trò của client"), "take r"),
        wires(arrow("is-a1", [(320, 615), (390, 445)], "violet", True), arrow("is-a2", [(700, 615), (560, 445)], "violet", True),
              arrow("is-a3", [(860, 615), (1000, 445)], "violet", True)),
    ]), beats=[
        B("Chữ I, Interface Segregation. Client không nên bị ép phụ thuộc vào method mà nó không dùng. Hãy chia interface béo thành các interface nhỏ theo vai trò.",
          "I: không ép client phụ thuộc method nó không dùng.",
          lambda w: [IN("#is-eye", "blur"), TYPE("#is-q", 0.2, 0.05), IN("#is-rule", "up", w("Client không") + 0.3)]),
        B("Ví dụ interface Fat Worker có hai method: work và eat. Con người vừa làm việc vừa ăn, nên ổn.",
          "FatWorker: work() và eat(). Con người: ổn.",
          lambda w: [OUT("#is-rule", "blur", 0, 0.4), *shrink("is", 0), IN("#is-c1", "blur", 0.5, 0.7), PULSE("#is-c1", w("work và")), PULSE("#is-c1", w("eat")), IN("#is-hm", "right", w("Con người"))]),
        B("Giờ thêm một Robot. Robot làm việc được, nhưng không ăn. Bị ép phải có eat, nó đành ném lỗi.",
          "Robot không ăn, bị ép có eat(), đành ném lỗi.",
          lambda w: [OUT("#is-hm", "blur", 0, 0.4), IN("#is-c2", "right", 0.3, 0.7), IN("#is-note", "up", w("Bị ép")), PULSE("#is-c2", w("nó đành"))]),
        B("Code vẫn biên dịch được, nhưng gọi hàm ăn của Robot thì nổ lúc chạy, với thông báo robot không ăn.",
          "Biên dịch được, nhưng nổ lúc chạy.",
          lambda w: [IN("#is-err", "up", w("thì nổ") - 0.4), SHAKE("#is-err", w("thì nổ") + 0.3)]),
        B("Cách sửa: tách thành Workable và Eatable. Robot chỉ cần Workable. Người thì có cả hai. Chạy thật ra ba dòng: robot làm việc, người làm việc, người ăn.",
          "Tách Workable và Eatable.",
          lambda w: [OUT(S("is-c1", "is-c2", "is-err", "is-note"), "blur", 0, 0.5),
                     IN("#is-w", "down", 0.7), IN("#is-e", "down", 1.1), IN("#is-rb", "up", w("Robot chỉ")), *ARROW("is-a1", w("Robot chỉ") + 0.4, 0.5),
                     IN("#is-hu", "up", w("Người thì")), *ARROW("is-a2", w("Người thì") + 0.4, 0.5), *ARROW("is-a3", w("có cả hai"), 0.5),
                     IN("#is-r1", "right", w("robot làm")), IN("#is-r2", "right", w("người làm")), IN("#is-r3", "right", w("người ăn"))]),
        B("Nhưng đừng cắt mỗi method thành một interface. Hãy tách theo vai trò mà client cần, kẻo bùng nổ interface.",
          "Tách theo vai trò, không mỗi method một interface.",
          lambda w: [DIM(S("is-eye", "is-q", "is-w", "is-e", "is-rb", "is-hu", "is-r1", "is-r2", "is-r3") + ", " + AR("is-a1", "is-a2", "is-a3"), 0, 0.07),
                     IN("#is-t1", "blur", 0.3), TYPE("#is-t2", w("Hãy tách"), 0.04)]),
    ]),
    # ------------------------------------------------------------ DIP
    dict(id="dip", world=(1920, 1080), hud="", cam="".join([
        head("di", "D · Dependency Inversion", "Phụ thuộc abstraction, không chi tiết"),
        rule("di-rule", "Nghiệp vụ và hạ tầng cùng phụ thuộc abstraction", "Không buộc vào chi tiết như database hay email"),
        cbox("di-bad", 100, 270, 1000, "OrderService.java",
             "class OrderService {\n"
             "    private final MySqlOrderRepository repo =\n"
             "        new MySqlOrderRepository();\n"
             "    void place(String order) { repo.save(order); }\n"
             "}", "violet", 32),
        chip("di-nw", 100, 700, "Tự new repository cụ thể bên trong", "amber"),
        bigerr("di-e1", 1160, 290, 650, "✕ đổi database:<br>phải sửa OrderService", 34),
        bigerr("di-e2", 1160, 480, 650, "✕ unit test:<br>cần MySQL thật đang chạy", 34),
        cbox("di-good", 100, 250, 820, "OrderService.java",
             "class OrderService {\n"
             "    private final OrderRepository repo;\n"
             "\n"
             "    OrderService(OrderRepository repo) {\n"
             "        this.repo = repo;\n"
             "    }\n"
             "}", "violet", 30),
        titled("di-if", 1000, 250, 810, 150, "«interface»", "OrderRepository", "", "violet", 44),
        tag("di-my", 1000, 520, 395, 120, "MySqlOrderRepository", "cyan", 26),
        tag("di-fk", 1415, 520, 395, 120, "FakeOrderRepository", "green", 26),
        note("di-sw", 100, 730, 820, "✓ đổi database: thêm một class, OrderService không đổi", "green"),
        chip("di-r1", 1415, 690, "fake saved: [order-2]", "green"),
        box("di-k1", 110, 270, 500, 520, f'{icon("shield", 96)}<b style="font-size:42px">Dependency Inversion</b><span style="font-size:32px;color:var(--muted);text-align:center">nguyên tắc: phụ thuộc abstraction</span>', "violet", "card"),
        box("di-k2", 710, 270, 500, 520, f'{icon("plug", 96)}<b style="font-size:42px">Dependency Injection</b><span style="font-size:32px;color:var(--muted);text-align:center">kỹ thuật: đưa dependency từ ngoài vào</span>', "cyan", "card"),
        box("di-k3", 1310, 270, 500, 520, f'{icon("share", 96)}<b style="font-size:42px">Inversion of Control</b><span style="font-size:32px;color:var(--muted);text-align:center">Spring nắm quyền tạo và nối object</span>', "green", "card"),
        wires(arrow("di-a1", [(930, 325), (990, 325)], "violet"),
              arrow("di-b1", [(1200, 515), (1300, 405)], "violet", True), arrow("di-b2", [(1610, 515), (1510, 405)], "violet", True)),
    ]), beats=[
        B("Chữ D, Dependency Inversion. Nghiệp vụ và hạ tầng, như database hay email, đều nên phụ thuộc vào abstraction, không buộc vào chi tiết.",
          "D: phụ thuộc abstraction, không phụ thuộc chi tiết.",
          lambda w: [IN("#di-eye", "blur"), TYPE("#di-q", 0.2, 0.05), IN("#di-rule", "up", w("Nghiệp vụ") + 0.3)]),
        B("Dấu hiệu rõ nhất: Order Service tự new một repository cụ thể ngay bên trong.",
          "OrderService tự new MySqlOrderRepository.",
          lambda w: [OUT("#di-rule", "blur", 0, 0.4), *shrink("di", 0), IN("#di-bad", "blur", 0.5, 0.7), PULSE("#di-bad", w("tự new")), IN("#di-nw", "up", w("tự new") + 0.3)]),
        B("Hệ quả là đổi database thì phải sửa chính Order Service. Còn viết unit test thì cần một database thật đang chạy.",
          "Đổi database phải sửa, test cần MySQL thật.",
          lambda w: [IN("#di-e1", "right", w("đổi database")), SHAKE("#di-e1", w("đổi database") + 0.6),
                     IN("#di-e2", "right", w("Còn viết")), SHAKE("#di-e2", w("Còn viết") + 0.6)]),
        B("Cách sửa: Order Service nhận Order Repository, một interface, qua constructor. Repository thật hay giả đều cắm vào được.",
          "Nhận OrderRepository (interface) qua constructor.",
          lambda w: [OUT(S("di-bad", "di-nw", "di-e1", "di-e2"), "blur", 0, 0.5), IN("#di-good", "left", 0.6, 0.7),
                     IN("#di-if", "right", w("một interface")), *ARROW("di-a1", w("một interface") + 0.5, 0.5),
                     IN("#di-my", "up", w("Repository thật")), *ARROW("di-b1", w("Repository thật") + 0.4, 0.5),
                     IN("#di-fk", "up", w("hay giả")), *ARROW("di-b2", w("hay giả") + 0.4, 0.5)]),
        B("Đổi database chỉ cần thêm một class mới, Order Service không đổi dòng nào. Khi viết test, ta truyền bản Fake vào. Chạy thật: fake saved order số hai, không cần database.",
          "Đổi database hay test: OrderService không đổi.",
          lambda w: [IN("#di-sw", "up", 0.4), PULSE("#di-my", w("thêm một class")), IN("#di-r1", "up", w("Chạy thật")), PULSE("#di-fk", w("Chạy thật"))]),
        B("Ba khái niệm hay bị lẫn. Dependency Inversion là nguyên tắc thiết kế. Dependency Injection là kỹ thuật đưa dependency từ ngoài vào. Còn Inversion of Control là việc Spring nắm quyền tạo và nối các object.",
          "DIP: nguyên tắc. DI: kỹ thuật. IoC: Spring nắm quyền.",
          lambda w: [OUT(S("di-good", "di-if", "di-my", "di-fk", "di-sw", "di-r1") + ", " + AR("di-a1", "di-b1", "di-b2"), "blur", 0, 0.5),
                     IN("#di-k1", "up", w("Dependency Inversion là")), IN("#di-k2", "up", w("Dependency Injection")), IN("#di-k3", "up", w("Còn Inversion"))]),
    ]),
    # ------------------------------------------------------------ DIP, why OrderServiceImpl
    dict(id="dip-history", world=(1920, 1080), hud="", cam="".join([
        head("dh", "D · Thói quen cũ", "Vì sao có OrderServiceImpl?", 80),
        titled("dh-c1", 110, 260, 520, 170, "Spring 1.x", "JDK proxy", "chỉ proxy qua interface", "amber", 44),
        titled("dh-c2", 700, 260, 520, 170, "Spring Boot nay", "CGLIB", "proxy thẳng class thường", "green", 44),
        tag("dh-i1", 110, 480, 520, 90, "«interface» OrderService", "violet", 28),
        tag("dh-i2", 110, 650, 520, 90, "OrderServiceImpl", "cyan", 30),
        tag("dh-i3", 700, 520, 520, 100, "OrderService", "green", 32),
        note("dh-nx", 700, 650, 520, "✓ không cần interface thừa", "green", 30),
        box("dh-c3", 1290, 260, 520, 480,
            '<b style="font-size:40px">Khi nào tách interface</b>'
            '<span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Có implementation thứ hai thật</span>'
            '<span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Cần mock khi test</span>'
            '<span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Ranh giới giữa module, team</span>', "green", "card"),
        el("dh-t1", 0, 400, 1920, None, letters("Don't call us, we'll call you"), "take r", "font-size:84px"),
        el("dh-t2", 0, 540, 1920, None, "IoC: framework gọi vào code của bạn", "take-sm r"),
        wires(arrow("dh-a1", [(640, 345), (690, 345)], "muted"), arrow("dh-b1", [(370, 645), (370, 575)], "violet", True)),
    ]), beats=[
        B("Bạn hay thấy cặp Order Service và Order Service Impl trong dự án Spring. Vì sao lại thế?",
          "Vì sao có cặp OrderService + OrderServiceImpl?",
          lambda w: [IN("#dh-eye", "blur"), TYPE("#dh-q", 0.2, 0.05)]),
        B("Đó là thói quen từ Spring một chấm x. Khi ấy proxy cho transactional dùng JDK proxy, thứ chỉ tạo được qua interface. Nên class nào cũng phải kèm một interface.",
          "Spring 1.x: JDK proxy cần interface.",
          lambda w: [*shrink("dh", 0), IN("#dh-c1", "up", 0.5), IN("#dh-i1", "up", w("chỉ tạo")), IN("#dh-i2", "up", w("Nên class")), *ARROW("dh-b1", w("Nên class") + 0.4, 0.5)]),
        B("Spring Boot ngày nay mặc định dùng CGLIB, tạo proxy thẳng từ class thường. Interface chỉ có một implementation không còn mang lại gì.",
          "Boot nay: CGLIB, không cần interface thừa.",
          lambda w: [*ARROW("dh-a1", 0.2, 0.4), IN("#dh-c2", "up", 0.4), IN("#dh-i3", "up", w("tạo proxy")), IN("#dh-nx", "up", w("không còn"))]),
        B("Hãy tách interface khi có implementation thứ hai thật, khi cần mock lúc test, hoặc cần ranh giới giữa hai module.",
          "Tách khi có implementation thứ hai, mock, hoặc ranh giới module.",
          lambda w: [IN("#dh-c3", "left", 0.3), PULSE("#dh-c3", w("khi cần mock"))]),
        B("Cuối cùng, nhớ lại Inversion of Control. Nó theo nguyên tắc Hollywood: đừng gọi chúng tôi, chúng tôi sẽ gọi bạn. Framework tạo bean, tiêm dependency, rồi gọi vào code của bạn.",
          "IoC: framework gọi vào code của bạn.",
          lambda w: [DIM(S("dh-eye", "dh-q", "dh-c1", "dh-c2", "dh-c3", "dh-i1", "dh-i2", "dh-i3", "dh-nx") + ", " + AR("dh-a1", "dh-b1"), 0, 0.07),
                     TYPE("#dh-t1", w("Nó theo"), 0.04), IN("#dh-t2", "blur", w("Framework"))]),
    ]),
    # ------------------------------------------------------------ playbook
    dict(id="playbook", world=(1920, 1080), hud="", cam="".join([
        head("pb", "Bảng nhớ và các bẫy", "Khi nào bạn KHÔNG áp dụng?", 88),
        box("pb-rule", 260, 480, 1400, 240,
            '<b style="font-size:58px;letter-spacing:-0.02em">Senior hiếm khi hỏi <span class="strike-txt">"SOLID là gì?"</span></b>',
            "amber", "card"),
        box("pb-k1", 110, 250, 500, 640, '<b style="font-size:42px">Interface cho mọi service</b><span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Chỉ có một implementation, không ai thay: chỉ làm tăng số file</span><div style="height:240px"></div>', "amber", "card"),
        box("pb-k2", 710, 250, 500, 640, '<b style="font-size:42px">Tách SRP quá nhỏ</b><span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Một thao tác nghiệp vụ trải ra 8 class: khó đọc hơn lợi ích</span><div style="height:240px"></div>', "amber", "card"),
        box("pb-k3", 1310, 250, 500, 640, '<b style="font-size:42px">DRY máy móc</b><span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">Hai đoạn giống nhau chỉ vì tình cờ, đổi vì lý do khác nhau: để lặp còn hơn gộp</span><div style="height:240px"></div>', "amber", "card"),
        chip("pb-v1a", 170, 690, "OrderService", "cyan"),
        chip("pb-v1b", 170, 780, "OrderServiceImpl", "muted"),
        *[box(f"pb-v2{i}", 735 + (i % 4) * 114, 690 + (i // 4) * 80, 104, 66, '<span class="mono" style="font-size:26px">class</span>', "muted") for i in range(8)],
        box("pb-v3a", 1335, 690, 210, 80, '<span class="mono" style="font-size:28px">Đoạn A</span>', "cyan"),
        box("pb-v3b", 1575, 690, 210, 80, '<span class="mono" style="font-size:28px">Đoạn B</span>', "violet"),
        el("pb-v3x", 1335, 800, 450, None, "✕ gộp rồi vướng nhau", "note red left r", "font-size:30px"),
        el("pb-t1", 0, 400, 1920, None, letters("Áp dụng khi thấy dấu hiệu thật"), "take r"),
        el("pb-t2", 0, 540, 1920, None, "nguyên tắc là kinh nghiệm, không phải luật", "take-sm r"),
    ]), beats=[
        B("Cuối cùng là bảng nhớ và các bẫy. Người phỏng vấn senior hiếm khi hỏi Sô lít là gì. Họ hỏi: khi nào bạn không áp dụng nó?",
          "Senior hỏi: khi nào bạn KHÔNG áp dụng nó?",
          lambda w: [IN("#pb-eye", "blur"), IN("#pb-rule", "up", w("Người phỏng vấn") + 0.2), TYPE("#pb-q", w("Họ hỏi"), 0.05)]),
        B("Bẫy thứ nhất: một interface cho mọi service. Nếu chỉ có một implementation và không ai thay, interface chỉ làm tăng số file.",
          "Bẫy 1: interface cho mọi service.",
          lambda w: [OUT("#pb-rule", "blur", 0, 0.4), *shrink("pb", 0), IN("#pb-k1", "up", 0.5), IN("#pb-v1a", "up", w("Nếu chỉ")), IN("#pb-v1b", "up", w("Nếu chỉ") + 0.6)]),
        B("Bẫy thứ hai: tách theo Single Responsibility quá nhỏ, tới mức một thao tác nghiệp vụ trải ra tám class. Khó đọc hơn lợi ích nhận được.",
          "Bẫy 2: tách SRP quá nhỏ.",
          lambda w: [IN("#pb-k2", "up", 0.3), IN("#pb-v20, #pb-v21, #pb-v22, #pb-v23, #pb-v24, #pb-v25, #pb-v26, #pb-v27", "pop", w("tới mức"), 0.4, 0.22)]),
        B("Bẫy thứ ba: áp dụng nguyên tắc đừng lặp lại một cách máy móc. Hai đoạn code giống nhau chỉ vì tình cờ, đổi vì những lý do khác nhau, thì để lặp còn hơn gộp rồi vướng nhau.",
          "Bẫy 3: DRY máy móc.",
          lambda w: [IN("#pb-k3", "up", 0.3), IN("#pb-v3a", "up", w("Hai đoạn")), IN("#pb-v3b", "up", w("Hai đoạn") + 0.5), IN("#pb-v3x", "up", w("thì để lặp"))]),
        B("Vì vậy, hãy áp dụng khi thấy dấu hiệu thật, ví dụ đã phải đổi hai lần. Nguyên tắc là kinh nghiệm, không phải luật.",
          "Áp dụng khi thấy dấu hiệu thật.",
          lambda w: [DIM(S("pb-eye", "pb-q", "pb-k1", "pb-k2", "pb-k3", "pb-v1a", "pb-v1b", "pb-v3a", "pb-v3b", "pb-v3x", *[f"pb-v2{i}" for i in range(8)]), 0, 0.07),
                     TYPE("#pb-t1", 0.4, 0.04), IN("#pb-t2", "blur", w("Nguyên tắc"))]),
    ]),
    # ------------------------------------------------------------ interview answers
    dict(id="interview", world=(1920, 1080), hud="", cam="".join([
        head("iv", "Phỏng vấn", "Junior và senior trả lời khác nhau", 76),
        box("iv-j", 110, 250, 800, 520, '<b style="font-size:46px">Junior</b><span style="font-size:30px;color:var(--muted);text-align:center">Liệt kê interface cho mọi thứ</span><div style="height:300px"></div>', "amber", "card"),
        chip("iv-j1", 160, 480, "IOrderService", "muted"), chip("iv-j2", 480, 480, "IOrderRepository", "muted"),
        chip("iv-j3", 160, 570, "IOrderValidator", "muted"), chip("iv-j4", 480, 570, "OrderFactory", "muted"),
        note("iv-jx", 160, 680, 700, "✕ over-engineering", "red", 36),
        box("iv-s", 1010, 250, 800, 520, '<b style="font-size:46px">Senior</b><span style="font-size:30px;color:var(--muted);text-align:center">Cân nhắc từng chỗ</span><div style="height:300px"></div>', "green", "card"),
        note("iv-s1", 1050, 470, 720, "✓ Order tự giữ quy tắc dòng hàng", "green", 30),
        note("iv-s2", 1050, 560, 720, "✓ Tách OrderRepository: nơi lưu có thể đổi", "green", 30),
        note("iv-s3", 1050, 650, 720, "✓ Chưa tạo interface cho service", "green", 30),
        box("iv-qb", 260, 300, 1400, 200, '<b style="font-size:56px;text-align:center">Nếu sau này cần hỗ trợ X thì sao?</b>', "cyan", "card"),
        tag("iv-a1", 260, 580, 680, 130, "Dễ thêm X sau này (OCP)", "green", 34),
        tag("iv-a2", 980, 580, 680, 130, "Chưa làm X ngay (YAGNI)", "cyan", 34),
        el("iv-t1", 0, 400, 1920, None, letters("OCP và YAGNI"), "take r"),
        el("iv-t2", 0, 540, 1920, None, "Dễ thêm sau, chưa làm bây giờ", "take-sm r"),
    ]), beats=[
        B("Người phỏng vấn chấm cách bạn cân nhắc, không chấm việc thuộc định nghĩa. Hãy xem hai kiểu trả lời.",
          "Họ chấm cách bạn cân nhắc.",
          lambda w: [IN("#iv-eye", "blur"), TYPE("#iv-q", 0.2, 0.05)]),
        B("Ứng viên junior thường liệt kê ngay interface cho mọi thứ: interface Order Service, interface Order Repository, interface Order Validator, rồi thêm một factory. Đó là over-engineering.",
          "Junior: interface cho mọi thứ.",
          lambda w: [*shrink("iv", 0), IN("#iv-j", "up", 0.5), IN("#iv-j1", "up", w("interface Order Service")), IN("#iv-j2", "up", w("interface Order Repository")), IN("#iv-j3", "up", w("interface Order Validator")), IN("#iv-j4", "up", w("một factory")), IN("#iv-jx", "up", w("Đó là")), SHAKE("#iv-jx", w("Đó là") + 0.6)]),
        B("Ứng viên senior nói: Order tự giữ quy tắc của các dòng hàng. Em tách Order Repository vì nơi lưu trữ có thể đổi. Còn service thì chưa tạo interface, khi chưa có implementation thứ hai.",
          "Senior: tách đúng chỗ cần tách.",
          lambda w: [IN("#iv-s", "up", 0.3), IN("#iv-s1", "right", w("Order tự giữ")), IN("#iv-s2", "right", w("Em tách")), IN("#iv-s3", "right", w("Còn service"))]),
        B("Một câu khác hay gặp: nếu sau này cần hỗ trợ X thì sao? Hãy trả lời: em thiết kế để thêm X không phải sửa code cũ, nhưng chưa làm X vì chưa có trong yêu cầu.",
          "Nếu sau này cần X thì sao?",
          lambda w: [OUT(S("iv-j", "iv-j1", "iv-j2", "iv-j3", "iv-j4", "iv-jx", "iv-s", "iv-s1", "iv-s2", "iv-s3"), "blur", 0, 0.5),
                     IN("#iv-qb", "down", 0.7), IN("#iv-a1", "up", w("em thiết kế")), IN("#iv-a2", "up", w("nhưng chưa"))]),
        B("Đó là nguyên tắc mở đóng và YAGNI cùng lúc. Dễ thêm sau, nhưng chưa làm bây giờ.",
          "Dễ thêm sau, chưa làm bây giờ.",
          lambda w: [OUT(S("iv-qb", "iv-a1", "iv-a2"), "blur", 0, 0.5), DIM(S("iv-eye", "iv-q"), 0, 0.07), TYPE("#iv-t1", 0.9, 0.04), IN("#iv-t2", "blur", w("Dễ thêm"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt 5 nguyên tắc"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 200, 200 + i * 118, 1520, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("SRP", "Một class, một lý do thay đổi"), ("OCP", "Thêm bằng class mới, không sửa code cũ"),
                                      ("LSP", "Class con thay được class cha"), ("ISP", "Interface nhỏ theo vai trò"),
                                      ("DIP", "Phụ thuộc interface, không phụ thuộc class cụ thể")])],
        chip("ou-f1", 330, 810, "Là gì?", "cyan"), chip("ou-f2", 590, 810, "Dấu hiệu vi phạm", "amber"),
        chip("ou-f3", 1010, 810, "Cách sửa", "green"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
        wires(arrow("ou-a1", [(480, 842), (575, 842)], "muted"), arrow("ou-a2", [(930, 842), (995, 842)], "muted")),
    ]), beats=[
        B("Tóm lại, năm nguyên tắc trong năm dòng. Một: một class chỉ có một lý do thay đổi. Hai: thêm bằng class mới, đừng sửa code cũ.",
          "Tóm tắt: SRP và OCP.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Một:")), IN("#ou-r1", "right", w("Hai:"))]),
        B("Ba: class con phải thay được class cha. Bốn: interface nhỏ theo vai trò. Năm: phụ thuộc interface, đừng phụ thuộc class cụ thể.",
          "LSP, ISP và DIP.",
          lambda w: [IN("#ou-r2", "right", w("Ba:")), IN("#ou-r3", "right", w("Bốn:")), IN("#ou-r4", "right", w("Năm:"))]),
        B("Khi trả lời phỏng vấn, hãy đi theo khung: là gì, dấu hiệu vi phạm, và cách sửa.",
          "Khung trả lời: Là gì → Dấu hiệu vi phạm → Cách sửa.",
          lambda w: [IN("#ou-f1", "up", w("là gì")), *ARROW("ou-a1", w("dấu hiệu") - 0.5, 0.4), IN("#ou-f2", "up", w("dấu hiệu")),
                     *ARROW("ou-a2", w("và cách") - 0.4, 0.4), IN("#ou-f3", "pop", w("và cách"))]),
        B("Và nhớ rằng đây là kinh nghiệm, chứ không phải luật. Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", w("Mở bài")), PULSE("#ou-f3", 0.3)]),
    ]),
]

fit_to_audio(SCENES, __file__)
