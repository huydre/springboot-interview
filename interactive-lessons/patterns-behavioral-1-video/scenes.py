"""Behavioral Patterns (1) explainer: Strategy, Observer, Command, Template Method, State.

Every Java output comes from the lesson (web/src/data/lessons/patterns-behavioral-1.ts), run on JDK 21:
shipping fee for 2000 g: SAME_DAY 90000, EXPRESS 50000, PICKUP 0, STANDARD 15000;
observer: unguarded failing listener means audit never runs ("sms gateway down"); with try/catch email runs, sms reports, audit still runs;
command editor: Hello, world -> two undos -> Hello;
template method: CsvImporter [open, read csv, validate, save], TrustedJsonImporter [open, read json, save];
state: PENDING -> PAID -> SHIPPED, PENDING.ship() "cannot ship in PENDING", SHIPPED.pay() "cannot pay in SHIPPED".
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


PATTERNS = [("Strategy", "đổi cách làm"), ("Observer", "báo nhiều bên"), ("Command", "thao tác là object"),
            ("Template Method", "khung cố định"), ("State", "đổi theo trạng thái")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Design Patterns 3 · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Behavioral Patterns"), "h1 r", "font-size:120px"),
        *[box(f"hk-c{i}", 85 + i * 355, 420, 330, 300,
              f'<b style="font-size:32px">{n}</b><span style="font-size:28px;color:var(--muted);text-align:center">{d}</span>', "cyan", "card")
          for i, (n, d) in enumerate(PATTERNS)],
        chip("hk-p1", 520, 850, "Code chạy thật", "green"),
        chip("hk-p2", 1130, 850, "Bẫy hay bị hỏi", "amber"),
        el("hk-t1", 0, 400, 1920, None, letters("Nhận ra dấu hiệu"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "rồi mới chọn pattern", "take-sm r"),
        wires(arrow("hk-a1", [(800, 882), (1110, 882)], "muted")),
    ]), beats=[
        B("Người phỏng vấn hỏi: chuỗi if else theo loại cứ dài ra, thì bạn làm gì?",
          "Chuỗi if / else theo loại cứ dài ra, bạn làm gì?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Phần này gồm năm pattern hành vi hay gặp nhất: Strategy, Observer, Command, Template Method và State.",
          "5 pattern Behavioral hay gặp nhất.",
          lambda w: [IN("#hk-c0", "pop", w("Strategy")), IN("#hk-c1", "pop", w("Observer")), IN("#hk-c2", "pop", w("Command")),
                     IN("#hk-c3", "pop", w("Template Method")), IN("#hk-c4", "pop", w("và State"))]),
        B("Mỗi pattern có code chạy thật, và một cái bẫy hay bị hỏi.",
          "Mỗi pattern: code chạy thật và bẫy hay bị hỏi.",
          lambda w: [IN("#hk-p1", "left", w("code chạy")), *ARROW("hk-a1", w("và một") - 0.5, 0.5), IN("#hk-p2", "pop", w("một cái bẫy"))]),
        B("Hãy học cách nhận ra dấu hiệu, rồi mới chọn pattern.",
          "Nhận ra dấu hiệu, rồi mới chọn pattern.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", w("rồi mới"))]),
    ]),
    # ------------------------------------------------------------ strategy
    dict(id="strategy", world=(1920, 1080), hud="", cam="".join([
        head("st", "Strategy", "Đổi thuật toán như đổi phụ kiện"),
        rule("st-rule", "Mỗi cách làm là một object cùng interface", "Chọn hoặc đổi lúc chạy. Dấu hiệu: chuỗi if / else theo loại cứ dài thêm"),
        cbox("st-bad", 90, 260, 1100, "Shipping.java",
             "long fee(String type, long w) {\n"
             "  if (type.equals(\"STANDARD\")) return 15000;\n"
             "  else if (type.equals(\"EXPRESS\"))\n"
             "      return 30000 + w * 10;\n"
             "  ...\n"
             "}", "violet", 32),
        bigerr("st-err", 1250, 300, 570, "✕ Thêm loại Hoả tốc:<br>phải mở hàm đang chạy ra sửa", 32),
        titled("st-i", 250, 250, 520, 150, "«interface»", "Shipping", "fee(weightG)", "violet", 44),
        titled("st-s1", 90, 520, 220, 120, "", "STANDARD", "", "cyan", 28),
        titled("st-s2", 330, 520, 220, 120, "", "EXPRESS", "", "cyan", 28),
        titled("st-s3", 570, 520, 220, 120, "", "PICKUP", "", "cyan", 28),
        titled("st-s4", 810, 520, 220, 120, "", "SAME_DAY", "mới", "green", 28),
        cbox("st-code", 1070, 250, 760, "Strategy.java",
             "Map<String, Shipping> table = Map.of(\n"
             "  \"STANDARD\", w -> 15000,\n"
             "  \"EXPRESS\",  w -> 30000 + w * 10,\n"
             "  \"SAME_DAY\", w -> 50000 + w * 20);", "violet", 28),
        titled("st-r1", 90, 710, 220, 120, "2000g", "15000", "", "green", 36),
        titled("st-r2", 330, 710, 220, 120, "2000g", "50000", "", "green", 36),
        titled("st-r3", 570, 710, 220, 120, "2000g", "0", "", "green", 36),
        titled("st-r4", 810, 710, 220, 120, "2000g", "90000", "", "green", 36),
        note("st-n1", 1070, 560, 760, "Java 8+: một strategy thường\nchỉ là một lambda", "green", 32),
        note("st-n2", 1070, 700, 760, "JDK: Comparator truyền vào sort()", "green", 32),
        el("st-t1", 0, 400, 1920, None, letters("Quy tắc ba lần"), "take r"),
        el("st-t2", 0, 540, 1920, None, "dùng khi if theo loại dài ra · chỉ một cách làm thì viết thẳng", "take-sm r"),
        wires(arrow("st-b1", [(200, 515), (330, 405)], "violet", True), arrow("st-b2", [(440, 515), (450, 405)], "violet", True),
              arrow("st-b3", [(680, 515), (570, 405)], "violet", True), arrow("st-b4", [(920, 515), (700, 405)], "violet", True)),
    ]), beats=[
        B("Strategy đóng gói mỗi cách làm thành một object cùng interface, để chọn hoặc đổi lúc chạy. Dấu hiệu là chuỗi if else theo loại cứ dài thêm.",
          "Strategy: mỗi cách làm là một object cùng interface.",
          lambda w: [IN("#st-eye", "blur"), TYPE("#st-q", 0.2, 0.05), IN("#st-rule", "up", w("Strategy đóng") + 0.5)]),
        B("Ví dụ tính phí giao hàng. Cách đầu dùng if else theo loại. Muốn thêm loại Hoả tốc, bạn phải mở chính hàm đang chạy tốt ra để sửa.",
          "if / else theo loại: thêm loại phải sửa hàm.",
          lambda w: [OUT("#st-rule", "blur", 0, 0.4), *shrink("st", 0), IN("#st-bad", "blur", 0.5, 0.7), PULSE("#st-bad", w("theo loại")),
                     IN("#st-err", "up", w("Muốn thêm")), SHAKE("#st-err", w("Muốn thêm") + 0.6)]),
        B("Cách hai: một interface Shipping chỉ có method fee. Mỗi cách tính là một strategy riêng: Standard, Express, Pickup, và loại mới Same Day.",
          "Interface Shipping, mỗi cách tính một strategy.",
          lambda w: [OUT(S("st-bad", "st-err"), "blur", 0, 0.5), IN("#st-i", "down", 0.7),
                     IN("#st-s1", "up", w("Standard")), *ARROW("st-b1", w("Standard") + 0.1, 0.4),
                     IN("#st-s2", "up", w("Express")), *ARROW("st-b2", w("Express") + 0.1, 0.4),
                     IN("#st-s3", "up", w("Pickup")), *ARROW("st-b3", w("Pickup") + 0.1, 0.4),
                     IN("#st-s4", "up", w("Same Day")), *ARROW("st-b4", w("Same Day") + 0.1, 0.4)]),
        B("Từ Java tám, mỗi strategy chỉ là một lambda, gom trong một Map theo tên. Thêm Hoả tốc chỉ thêm đúng một dòng, hàm tính phí không đổi.",
          "Lambda trong Map: thêm Hoả tốc = thêm một dòng.",
          lambda w: [IN("#st-code", "right", 0.3), PULSE("#st-code", w("một lambda")), IN("#st-n1", "up", w("một lambda")),
                     PULSE("#st-s4", w("Thêm Hoả tốc")), PULSE("#st-code", w("một dòng"))]),
        B("Chạy thật với hai nghìn gam: Standard mười lăm nghìn, Express năm mươi nghìn, Pickup không đồng, Same Day chín mươi nghìn. Trong JDK, Comparator truyền vào sort cũng là một strategy.",
          "2000g: 15000 · 50000 · 0 · 90000.",
          lambda w: [IN("#st-r1", "up", w("Standard")), IN("#st-r2", "up", w("Express")), IN("#st-r3", "up", w("Pickup")), IN("#st-r4", "up", w("Same Day")),
                     OUT("#st-n1", "blur", w("Trong JDK") - 0.5, 0.4), IN("#st-n2", "up", w("Trong JDK"))]),
        B("Nhưng đừng dùng Strategy cho thứ không bao giờ đổi. Chỉ có một cách làm thì viết thẳng. Theo quy tắc ba lần: lần đầu viết thẳng, lần hai chịu lặp, tới lần thứ ba mới tách.",
          "Rule of Three: tới lần thứ 3 mới tách.",
          lambda w: [DIM(S("st-eye", "st-q", "st-i", "st-s1", "st-s2", "st-s3", "st-s4", "st-code", "st-r1", "st-r2", "st-r3", "st-r4", "st-n2") + ", " + AR("st-b1", "st-b2", "st-b3", "st-b4"), 0, 0.07),
                     TYPE("#st-t1", w("Theo quy tắc"), 0.05), IN("#st-t2", "blur", w("lần đầu"))]),
    ]),
    # ------------------------------------------------------------ observer
    dict(id="observer", world=(1920, 1080), hud="", cam="".join([
        head("ob", "Observer", "Phát sự kiện cho nhiều người nghe"),
        rule("ob-rule", "Báo cho nhiều bên mà không biết họ là ai", "Giống đăng ký một kênh video: ai đăng ký thì nhận thông báo"),
        titled("ob-pub", 110, 300, 320, 140, "Publisher", "pay()", "", "amber", 40),
        titled("ob-bus", 550, 300, 330, 140, "event bus", "publish()", "", "violet", 38),
        tag("ob-l1", 1150, 260, 380, 100, "email", "cyan", 34),
        tag("ob-l2", 1150, 390, 380, 100, "sms", "cyan", 34),
        tag("ob-l3", 1150, 520, 380, 100, "audit", "cyan", 34),
        cbox("ob-code", 110, 520, 900, "Subscribe.java",
             "bus.subscribe(e -> email(e));\n"
             "bus.subscribe(e -> sms(e));\n"
             "bus.subscribe(e -> audit(e));\n"
             "bus.publish(\"order-1 paid\");", "violet", 30),
        note("ob-sp", 110, 800, 900, "Spring: ApplicationEventPublisher\nvà @EventListener", "green", 32),
        tag("ob-s1", 1560, 260, 260, 100, "✓ chạy", "green", 28),
        tag("ob-s2", 1560, 390, 260, 100, "✕ ném lỗi", "red", 28),
        tag("ob-s3", 1560, 520, 260, 100, "✕ không chạy", "red", 28),
        tag("ob-s3b", 1560, 520, 260, 100, "✓ vẫn chạy", "green", 28),
        bigerr("ob-err", 1150, 690, 670, "✕ publish ném:<br>sms gateway down", 32),
        tag("ob-fix", 1150, 690, 670, 100, "try / catch từng listener", "amber", 30),
        tag("ob-u", 1560, 390, 260, 100, "unsubscribe", "amber", 28),
        tag("ob-sync", 110, 520, 900, 110, "đồng bộ: cùng thread, lần lượt", "amber", 30),
        note("ob-syn2", 110, 670, 900, "✕ một listener chậm làm chậm cả publisher", "red", 32),
        card("ob-ca", 90, 260, 860, 520, "Observer", "subject giữ danh sách observer", "cyan", 46, 30, 330),
        card("ob-cb", 970, 260, 860, 520, "Pub / Sub", "chỉ biết topic, broker ở giữa", "violet", 46, 30, 330),
        tag("ob-n1", 130, 540, 250, 110, "Subject", "amber", 30),
        tag("ob-n2", 630, 540, 250, 110, "Observer", "cyan", 30),
        note("ob-nl", 390, 495, 230, "gọi trực tiếp", "green", 26),
        note("ob-f1", 130, 690, 780, "cùng process · gọi đồng bộ", "green", 32),
        tag("ob-p1", 1000, 540, 210, 110, "Publisher", "amber", 28),
        tag("ob-p2", 1270, 540, 220, 110, "Broker", "violet", 28),
        tag("ob-p3", 1550, 540, 230, 110, "Subscriber", "cyan", 28),
        note("ob-f2", 1000, 690, 790, "khác process · bất đồng bộ · qua mạng", "green", 32),
        el("ob-t1", 0, 400, 1920, None, letters("Ai biết ai?"), "take r"),
        el("ob-t2", 0, 540, 1920, None, "Observer biết nhau · Pub/Sub chỉ biết topic", "take-sm r"),
        wires(arrow("ob-a1", [(435, 370), (545, 370)], "amber"),
              arrow("ob-a2", [(885, 360), (1145, 310)], "cyan"), arrow("ob-a3", [(885, 370), (1145, 440)], "cyan"),
              arrow("ob-a4", [(885, 380), (1145, 570)], "cyan"),
              arrow("ob-c1", [(385, 595), (625, 595)], "amber"),
              arrow("ob-c2", [(1215, 595), (1265, 595)], "amber"), arrow("ob-c3", [(1495, 595), (1545, 595)], "cyan")),
    ]), beats=[
        B("Strategy chọn một cách làm. Observer báo cho nhiều bên cùng lúc, mà không biết họ là ai. Giống đăng ký một kênh video.",
          "Observer: báo cho nhiều bên, không biết họ là ai.",
          lambda w: [IN("#ob-eye", "blur"), TYPE("#ob-q", 0.2, 0.05), IN("#ob-rule", "up", w("Observer báo") + 0.3)]),
        B("Ví dụ thanh toán xong. Publisher phát sự kiện lên bus. Email, SMS và audit đều đăng ký nghe. Thêm một kênh chỉ thêm một dòng subscribe, hàm pay không đổi.",
          "Thêm người nghe: thêm một subscribe, pay() không đổi.",
          lambda w: [OUT("#ob-rule", "blur", 0, 0.4), *shrink("ob", 0), IN("#ob-pub", "right", 0.5), *ARROW("ob-a1", w("Publisher phát"), 0.4), IN("#ob-bus", "up", w("lên bus")),
                     IN("#ob-l1", "right", w("Email")), *ARROW("ob-a2", w("Email"), 0.4), IN("#ob-l2", "right", w("SMS")), *ARROW("ob-a3", w("SMS"), 0.4),
                     IN("#ob-l3", "right", w("audit")), *ARROW("ob-a4", w("audit"), 0.4),
                     IN("#ob-code", "blur", w("Thêm một kênh"), 0.7), IN("#ob-sp", "up", w("hàm pay") + 0.5)]),
        B("Nhưng nếu SMS ném lỗi mà publish không bắt, thì audit không bao giờ chạy. Đã chạy: publish ném sms gateway down.",
          "Listener lỗi không bị bắt: audit không bao giờ chạy.",
          lambda w: [OUT("#ob-sp", "blur", 0, 0.4), DIM(S("ob-code"), 0, 0.2), IN("#ob-s1", "pop", 0.4), IN("#ob-s2", "pop", w("SMS ném")), SHAKE("#ob-s2", w("SMS ném") + 0.5),
                     IN("#ob-s3", "pop", w("audit không")), IN("#ob-err", "up", w("Đã chạy")), SHAKE("#ob-err", w("Đã chạy") + 0.6)]),
        B("Cách sửa là bọc try catch quanh từng listener. Đã chạy: email chạy, SMS báo lỗi, audit vẫn chạy.",
          "try / catch từng listener: audit vẫn chạy.",
          lambda w: [OUT("#ob-err", "blur", 0, 0.4), OUT("#ob-s3", "blur", w("audit vẫn") - 0.3, 0.3), IN("#ob-fix", "up", 0.5), IN("#ob-s3b", "pop", w("audit vẫn")), PULSE("#ob-s3b", w("audit vẫn") + 0.4)]),
        B("Nhớ huỷ đăng ký: listener còn đăng ký thì còn bị giữ trong bộ nhớ. Đã chạy: sau unsubscribe, listener SMS không nhận sự kiện nữa. Và mặc định, listener chạy cùng thread, lần lượt, nên một listener chậm làm chậm cả publisher.",
          "Huỷ đăng ký để khỏi rò bộ nhớ. Mặc định: đồng bộ, nối tiếp.",
          lambda w: [OUT(S("ob-code", "ob-fix", "ob-s1", "ob-s2", "ob-s3b"), "blur", 0, 0.4), IN("#ob-u", "pop", w("Đã chạy")), DIM("#ob-l2", w("Đã chạy") + 0.5, 0.25),
                     IN("#ob-sync", "up", w("Và mặc định")), IN("#ob-syn2", "up", w("nên một listener"))]),
        B("Observer khác Pub Sub ở chỗ ai biết ai. Với Observer, subject biết observer và gọi thẳng từng cái, thường trong một process, đồng bộ cùng thread.",
          "Observer: subject biết observer, gọi thẳng.",
          lambda w: [OUT(S("ob-pub", "ob-bus", "ob-l1", "ob-l2", "ob-l3", "ob-u", "ob-sync", "ob-syn2") + ", " + AR("ob-a1", "ob-a2", "ob-a3", "ob-a4"), "blur", 0, 0.5),
                     IN("#ob-ca", "up", 0.7), IN("#ob-n1", "up", w("subject")), *ARROW("ob-c1", w("gọi thẳng"), 0.4), IN("#ob-nl", "up", w("gọi thẳng")), IN("#ob-n2", "up", w("observer và")),
                     IN("#ob-f1", "up", w("thường trong"))]),
        B("Còn với Pub Sub, publisher và subscriber chỉ biết topic, ở giữa là broker, thường khác process và bất đồng bộ. Trong Spring, Event Listener là Observer trong một JVM, còn Kafka giữa các service là Pub Sub. Điểm cốt lõi là ai biết ai.",
          "Pub/Sub: chỉ biết topic, có broker ở giữa.",
          lambda w: [IN("#ob-cb", "up", 0.3), IN("#ob-p1", "up", w("publisher và")), *ARROW("ob-c2", w("ở giữa"), 0.3), IN("#ob-p2", "up", w("ở giữa là")), *ARROW("ob-c3", w("ở giữa là") + 0.5, 0.3), IN("#ob-p3", "up", w("ở giữa là") + 0.8),
                     IN("#ob-f2", "up", w("thường khác")),
                     DIM(S("ob-eye", "ob-q", "ob-ca", "ob-cb", "ob-n1", "ob-n2", "ob-nl", "ob-f1", "ob-p1", "ob-p2", "ob-p3", "ob-f2") + ", " + AR("ob-c1", "ob-c2", "ob-c3"), w("Điểm cốt lõi"), 0.07),
                     TYPE("#ob-t1", w("Điểm cốt lõi") + 0.3, 0.05), IN("#ob-t2", "blur", w("ai biết ai"))]),
    ]),
    # ------------------------------------------------------------ command
    dict(id="command", world=(1920, 1080), hud="", cam="".join([
        head("cm", "Command", "Biến yêu cầu thành object"),
        rule("cm-rule", "Gói một thao tác, kèm cách hoàn tác, thành object", "Observer báo việc đã xảy ra. Command gói chính việc cần làm"),
        card("cm-b1", 90, 320, 410, 320, "Xếp hàng", "đưa vào hàng đợi chạy lần lượt", "cyan", 40, 28),
        card("cm-b2", 530, 320, 410, 320, "Ghi log", "lưu lại đã làm những gì", "cyan", 40, 28),
        card("cm-b3", 970, 320, 410, 320, "Thực thi sau", "tạo bây giờ, chạy lúc khác", "cyan", 40, 28),
        card("cm-b4", 1410, 320, 410, 320, "Undo / redo", "gọi undo() theo thứ tự ngược lại", "green", 40, 28),
        cbox("cm-code", 90, 250, 900, "Editor.java",
             "interface Command { void run(); void undo(); }\n"
             "Command c = new Append(editor, \"Hello\");\n"
             "c.run(); history.push(c);\n"
             "history.pop().undo();", "violet", 28),
        titled("cm-i", 90, 640, 400, 170, "«interface»", "Command", "run, undo", "violet", 42),
        titled("cm-ap", 600, 640, 390, 170, "", "Append", "undo: cắt chuỗi", "cyan", 42),
        el("cm-hl", 1100, 250, 720, None, "history: ngăn xếp command", "note left r", "font-size:32px"),
        tag("cm-h1", 1100, 620, 720, 100, "Append(\"Hello\")", "cyan", 32),
        tag("cm-h2", 1100, 500, 720, 100, "Append(\", \")", "cyan", 32),
        tag("cm-h3", 1100, 380, 720, 100, "Append(\"world\")", "cyan", 32),
        tag("cm-x1", 1100, 770, 720, 100, "\"Hello, world\"", "green", 36),
        tag("cm-x2", 1100, 770, 720, 100, "\"Hello\"", "green", 36),
        el("cm-t1", 0, 400, 1920, None, letters("Thao tác là một object"), "take r"),
        el("cm-t2", 0, 540, 1920, None, "undo phải đối xứng · gửi email thì không hoàn tác được", "take-sm r"),
        wires(arrow("cm-a1", [(595, 725), (495, 725)], "violet", True)),
    ]), beats=[
        B("Observer báo một việc đã xảy ra. Command gói chính việc cần làm, kèm cách hoàn tác, thành một object.",
          "Command: thao tác + cách hoàn tác = một object.",
          lambda w: [IN("#cm-eye", "blur"), TYPE("#cm-q", 0.2, 0.05), IN("#cm-rule", "up", w("Command gói") + 0.3)]),
        B("Nhờ vậy có thể xếp hàng cho chạy lần lượt, ghi log những gì đã làm, thực thi sau, và undo redo bằng cách gọi undo theo thứ tự ngược lại.",
          "Xếp hàng, ghi log, thực thi sau, undo / redo.",
          lambda w: [OUT("#cm-rule", "blur", 0, 0.4), *shrink("cm", 0), IN("#cm-b1", "up", w("xếp hàng")), IN("#cm-b2", "up", w("ghi log")), IN("#cm-b3", "up", w("thực thi sau")), IN("#cm-b4", "up", w("undo redo"))]),
        B("Command là interface có run và undo. Mỗi thao tác như Append là một class cài hai method đó. Gọi run rồi đẩy vào history. Muốn hoàn tác thì lấy ra và gọi undo.",
          "interface Command: run() và undo(); history là ngăn xếp.",
          lambda w: [OUT(S("cm-b1", "cm-b2", "cm-b3", "cm-b4"), "blur", 0, 0.5), IN("#cm-code", "blur", 0.6, 0.7), IN("#cm-i", "up", w("Command là")), IN("#cm-ap", "up", w("Mỗi thao tác")), *ARROW("cm-a1", w("một class") , 0.4),
                     IN("#cm-hl", "up", w("Gọi run")), PULSE("#cm-code", w("Muốn hoàn tác"))]),
        B("Đã chạy: gõ Hello, dấu phẩy, rồi world. Ba command nằm trong ngăn xếp, và văn bản là Hello, world.",
          "Gõ 3 command: văn bản là Hello, world.",
          lambda w: [IN("#cm-h1", "up", w("Hello,")), IN("#cm-h2", "up", w("dấu phẩy")), IN("#cm-h3", "up", w("world.")), IN("#cm-x1", "pop", w("Ba command"))]),
        B("Undo hai lần. Mỗi lần lấy command mới nhất ra khỏi ngăn xếp: lần đầu bỏ world, lần hai bỏ dấu phẩy. Còn lại Hello.",
          "Undo 2 lần: bỏ world, bỏ dấu phẩy. Còn Hello.",
          lambda w: [OUT("#cm-h3", "left", w("lần đầu"), 0.5), OUT("#cm-h2", "left", w("lần hai"), 0.5), OUT("#cm-x1", "blur", w("Còn lại") - 0.2, 0.3), IN("#cm-x2", "pop", w("Còn lại"))]),
        B("Command có hai cái bẫy. Undo phải đối xứng với run, ở đây là cắt đúng độ dài chuỗi vừa thêm. Và thao tác ra ngoài hệ thống, như gửi email, thì không hoàn tác được. Trong JDK, Runnable là một command.",
          "Undo đối xứng; gửi email thì không hoàn tác được.",
          lambda w: [DIM(S("cm-eye", "cm-q", "cm-code", "cm-i", "cm-ap", "cm-hl", "cm-h1", "cm-x2") + ", " + AR("cm-a1"), 0, 0.07),
                     TYPE("#cm-t1", w("Undo phải"), 0.05), IN("#cm-t2", "blur", w("Và thao tác"))]),
    ]),
    # ------------------------------------------------------------ template method
    dict(id="template-method", world=(1920, 1080), hud="", cam="".join([
        head("tm", "Template Method", "Khung cố định, bước thay đổi"),
        rule("tm-rule", "Class cha giữ thứ tự bước, class con viết từng bước", "Hollywood Principle: đừng gọi tôi, tôi sẽ gọi bạn"),
        cbox("tm-bad", 160, 300, 1600, "Importers.java",
             "class CsvImporter  { void run() { open(); readCsv();  validate(); save(); } }\n"
             "class JsonImporter { void run() { open(); readJson(); /* quên validate */ save(); } }", "violet", 30),
        bigerr("tm-err", 160, 520, 1600, "✕ JsonImporter quên validate: không gì buộc phải làm đủ bước", 34),
        note("tm-err2", 160, 650, 1600, "✕ Thêm bước ghi log: phải sửa từng importer, dễ sót", "red", 34),
        cbox("tm-code", 90, 250, 800, "Importer.java",
             "abstract class Importer {\n"
             "  final List<String> run() { ... }\n"
             "  abstract List<String> read();\n"
             "  boolean shouldValidate() { return true; }\n"
             "}", "violet", 28),
        titled("tm-c1", 90, 700, 360, 120, "", "CsvImporter", "", "cyan", 32),
        titled("tm-c2", 500, 700, 390, 120, "", "TrustedJsonImporter", "", "cyan", 28),
        tag("tm-t1s", 970, 280, 180, 110, "open", "cyan", 30), tag("tm-t2s", 1190, 280, 180, 110, "read()", "amber", 30),
        tag("tm-t3s", 1410, 280, 180, 110, "validate", "cyan", 30), tag("tm-t4s", 1630, 280, 180, 110, "save", "cyan", 30),
        titled("tm-r1", 970, 450, 860, 140, "CsvImporter", "[open, read csv, validate, save]", "", "green", 30),
        titled("tm-r2", 970, 620, 860, 140, "TrustedJsonImporter", "[open, read json, save]", "", "green", 30),
        tag("tm-hook", 970, 790, 860, 90, "shouldValidate() = false: bỏ validate", "amber", 28),
        el("tm-t1", 0, 400, 1920, None, letters("Kế thừa hay truyền vào?"), "take r"),
        el("tm-t2", 0, 540, 1920, None, "Template Method: kế thừa · Strategy: truyền hành vi vào", "take-sm r"),
        wires(arrow("tm-b1", [(270, 695), (270, 590)], "violet"), arrow("tm-b2", [(695, 695), (500, 590)], "violet"),
              arrow("tm-s1", [(1155, 335), (1185, 335)], "muted"), arrow("tm-s2", [(1375, 335), (1405, 335)], "muted"),
              arrow("tm-s3", [(1595, 335), (1625, 335)], "muted")),
    ]), beats=[
        B("Strategy truyền hành vi vào. Template Method thì cố định thứ tự các bước ở class cha, bằng một method final, còn từng bước để class con viết. Class cha gọi xuống class con: đừng gọi tôi, tôi sẽ gọi bạn.",
          "Class cha giữ khung final, class con viết từng bước.",
          lambda w: [IN("#tm-eye", "blur"), TYPE("#tm-q", 0.2, 0.05), IN("#tm-rule", "up", w("Template Method thì") + 0.3)]),
        B("Nếu mỗi importer tự viết khung thì dễ lệch nhau. Csv Importer mở, đọc, kiểm tra, lưu. Json Importer thì lỡ quên bước kiểm tra.",
          "Mỗi importer tự viết khung: dễ lệch nhau.",
          lambda w: [OUT("#tm-rule", "blur", 0, 0.4), *shrink("tm", 0), IN("#tm-bad", "blur", 0.5, 0.7), PULSE("#tm-bad", w("Csv Importer")), PULSE("#tm-bad", w("Json Importer"))]),
        B("Không có gì buộc phải làm đủ các bước. Và muốn thêm bước ghi log, bạn phải sửa từng importer, rất dễ sót.",
          "Không gì buộc làm đủ bước; thêm bước phải sửa từng importer.",
          lambda w: [IN("#tm-err", "up", 0.3), SHAKE("#tm-err", 0.9), IN("#tm-err2", "up", w("Và muốn"))]),
        B("Cách hai: class cha Importer giữ khung trong method run final, và có method read abstract cho con viết. Hook shouldValidate mặc định trả true.",
          "Importer: run() final, read() abstract, hook shouldValidate().",
          lambda w: [OUT(S("tm-bad", "tm-err", "tm-err2"), "blur", 0, 0.5), IN("#tm-code", "blur", 0.6, 0.7), PULSE("#tm-code", w("run final")), PULSE("#tm-code", w("read abstract")), PULSE("#tm-code", w("Hook")),
                     IN("#tm-c1", "up", w("Hook") + 1.2), *ARROW("tm-b1", w("Hook") + 1.5, 0.4), IN("#tm-c2", "up", w("Hook") + 2.0), *ARROW("tm-b2", w("Hook") + 2.3, 0.4)]),
        B("Đã chạy: Csv Importer ra open, read csv, validate, save. Trusted Json Importer override hook trả false, nên ra open, read json, save. Khung không đổi.",
          "Cùng khung, con tắt hook: bỏ validate.",
          lambda w: [IN("#tm-t1s", "up", 0.3), IN("#tm-t2s", "up", 0.6), IN("#tm-t3s", "up", 0.9), IN("#tm-t4s", "up", 1.2),
                     *ARROW("tm-s1", 0.6, 0.25), *ARROW("tm-s2", 0.9, 0.25), *ARROW("tm-s3", 1.2, 0.25),
                     IN("#tm-r1", "up", w("Csv Importer ra")), IN("#tm-r2", "up", w("Trusted Json")), IN("#tm-hook", "up", w("override hook")), PULSE("#tm-t3s", w("Khung không"))]),
        B("Template Method dùng kế thừa, còn Strategy dùng composition, tức truyền hành vi vào. Trong JDK: Http Servlet service gọi doGet hay doPost do class con viết. Jdbc Template của Spring thì không dùng kế thừa mà nhận callback, nên gần Strategy hơn. Nếu chỉ khác một bước nhỏ, hãy ưu tiên Strategy.",
          "Template Method: kế thừa. Strategy: truyền hành vi vào.",
          lambda w: [DIM(S("tm-eye", "tm-q", "tm-code", "tm-c1", "tm-c2", "tm-t1s", "tm-t2s", "tm-t3s", "tm-t4s", "tm-r1", "tm-r2", "tm-hook") + ", " + AR("tm-b1", "tm-b2", "tm-s1", "tm-s2", "tm-s3"), 0, 0.07),
                     TYPE("#tm-t1", 0.4, 0.05), IN("#tm-t2", "blur", w("Template Method dùng") + 0.5)]),
    ]),
    # ------------------------------------------------------------ state
    dict(id="state", world=(1920, 1080), hud="", cam="".join([
        head("sa", "State", "Hành vi đổi theo trạng thái"),
        rule("sa-rule", "Mỗi trạng thái có hành vi riêng", "Thay cho if theo trạng thái lặp lại ở nhiều method"),
        cbox("sa-bad", 90, 260, 1250, "Order.java",
             "void ship() {\n"
             "  if (state == PENDING) throw new IllegalStateException();\n"
             "  else if (state == PAID) state = SHIPPED;\n"
             "  // pay(), cancel(), refund() đều lặp lại if theo state\n"
             "}", "violet", 30),
        bigerr("sa-err", 110, 700, 1700, "✕ Thêm trạng thái RETURNED: sửa mọi method có if (state ...)", 34),
        titled("sa-n1", 130, 300, 400, 160, "chưa trả tiền", "PENDING", "", "amber", 44),
        titled("sa-n2", 760, 300, 400, 160, "đã trả tiền", "PAID", "", "cyan", 44),
        titled("sa-n3", 1390, 300, 400, 160, "đã giao", "SHIPPED", "", "green", 44),
        tag("sa-m1", 545, 270, 200, 70, "pay()", "violet", 30),
        tag("sa-m2", 1175, 270, 200, 70, "ship()", "violet", 30),
        cbox("sa-code", 90, 530, 1250, "OrderState.java",
             "enum OrderState {\n"
             "  PENDING { OrderState pay()  { return PAID; } },\n"
             "  PAID    { OrderState ship() { return SHIPPED; } },\n"
             "  SHIPPED { };\n"
             "  OrderState pay()  { throw new IllegalStateException(...); }\n"
             "  OrderState ship() { throw new IllegalStateException(...); }", "violet", 30),
        tag("sa-r1", 260, 560, 1400, 100, "✓ PENDING → PAID → SHIPPED", "green", 34),
        tag("sa-r2", 260, 690, 1400, 100, "✕ PENDING.ship() ném: cannot ship in PENDING", "red", 32),
        tag("sa-r3", 260, 820, 1400, 100, "✕ SHIPPED.pay() ném: cannot pay in SHIPPED", "red", 32),
        card("sa-ca", 110, 300, 800, 440, "State", "Trạng thái hiện tại quyết định chuyển sang đâu. Client chỉ gọi pay() hay ship().", "cyan", 50, 34),
        card("sa-cb", 1010, 300, 800, 440, "Strategy", "Client chọn cách làm, thường cố định trong lúc chạy.", "violet", 50, 34),
        el("sa-t1", 0, 400, 1920, None, letters("Ai quyết định chuyển?"), "take r"),
        el("sa-t2", 0, 540, 1920, None, "State: trạng thái hiện tại · Strategy: client chọn", "take-sm r"),
        wires(arrow("sa-a1", [(535, 380), (755, 380)], "violet"), arrow("sa-a2", [(1165, 380), (1385, 380)], "violet")),
    ]), beats=[
        B("State cho object đổi hành vi khi trạng thái đổi, bằng cách cho mỗi trạng thái hành vi riêng, thay cho if theo trạng thái lặp lại ở nhiều method.",
          "State: mỗi trạng thái có hành vi riêng.",
          lambda w: [IN("#sa-eye", "blur"), TYPE("#sa-q", 0.2, 0.05), IN("#sa-rule", "up", w("State cho") + 0.3)]),
        B("Cách đầu dùng if theo trạng thái. Hàm ship kiểm tra Pending, rồi Paid. Các hàm pay, cancel, refund đều lặp lại đúng những if này. Thêm trạng thái Returned là phải sửa mọi method.",
          "if theo state lặp ở mọi method.",
          lambda w: [OUT("#sa-rule", "blur", 0, 0.4), *shrink("sa", 0), IN("#sa-bad", "blur", 0.5, 0.7), PULSE("#sa-bad", w("Hàm ship")), PULSE("#sa-bad", w("Các hàm pay")),
                     IN("#sa-err", "up", w("Thêm trạng thái")), SHAKE("#sa-err", w("Thêm trạng thái") + 0.6)]),
        B("Cách hai: đơn hàng có ba trạng thái. Pending là chưa trả tiền, chỉ có pay, trả về Paid. Paid chỉ có ship, trả về Shipped.",
          "PENDING → PAID → SHIPPED.",
          lambda w: [OUT(S("sa-bad", "sa-err"), "blur", 0, 0.5), IN("#sa-n1", "up", w("Pending là")), IN("#sa-m1", "down", w("chỉ có pay")), *ARROW("sa-a1", w("trả về Paid") - 0.5, 0.5), IN("#sa-n2", "up", w("trả về Paid")),
                     IN("#sa-m2", "down", w("chỉ có ship")), *ARROW("sa-a2", w("trả về Shipped") - 0.5, 0.5), IN("#sa-n3", "up", w("trả về Shipped"))]),
        B("Viết bằng enum: mỗi giá trị override đúng thao tác nó cho phép. Mọi thao tác còn lại dùng method mặc định của enum và ném Illegal State Exception.",
          "enum: mỗi giá trị override thao tác nó cho phép.",
          lambda w: [IN("#sa-code", "blur", 0.4, 0.7), PULSE("#sa-code", w("override")), PULSE("#sa-code", w("method mặc định"))]),
        B("Đã chạy: Pending, Paid, Shipped là chuyển hợp lệ. Pending ship ném cannot ship in Pending. Shipped pay ném cannot pay in Shipped. Chuyển sai bị chặn mà không cần một dòng if.",
          "Chuyển sai bị chặn mặc định, không cần if.",
          lambda w: [OUT("#sa-code", "blur", 0, 0.5), IN("#sa-r1", "up", 0.5), IN("#sa-r2", "up", w("Pending ship")), SHAKE("#sa-r2", w("Pending ship") + 0.8), IN("#sa-r3", "up", w("Shipped pay")), SHAKE("#sa-r3", w("Shipped pay") + 0.8)]),
        B("State và Strategy đều ủy quyền cho một object cùng interface. Khác ở chỗ ai quyết định. Với State, trạng thái hiện tại quyết định chuyển sang đâu, client chỉ gọi pay hay ship. Strategy thì do client chọn.",
          "State: trạng thái quyết định. Strategy: client chọn.",
          lambda w: [OUT(S("sa-n1", "sa-n2", "sa-n3", "sa-m1", "sa-m2", "sa-r1", "sa-r2", "sa-r3") + ", " + AR("sa-a1", "sa-a2"), "blur", 0, 0.5),
                     IN("#sa-ca", "up", w("Với State")), IN("#sa-cb", "up", w("Strategy thì"))]),
        B("Hãy dùng State khi if theo trạng thái cứ lặp ở nhiều method. Và nhớ câu hỏi: ai quyết định chuyển?",
          "Dùng khi if theo state lặp ở nhiều method.",
          lambda w: [DIM(S("sa-eye", "sa-q", "sa-ca", "sa-cb"), 0, 0.07), TYPE("#sa-t1", w("Và nhớ"), 0.05), IN("#sa-t2", "blur", w("Và nhớ") + 1.2)]),
    ]),
    # ------------------------------------------------------------ recap
    dict(id="recap", world=(1920, 1080), hud="", cam="".join([
        head("rc", "Bảng nhớ và bài tập", "Năm pattern trong một bảng"),
        *[box(f"rc-r{i}", 110, 250 + i * 125, 1700, 105, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Strategy", "Mỗi cách làm là một object, đổi lúc chạy"),
                                      ("Observer", "Phát sự kiện cho nhiều người nghe"),
                                      ("Command", "Thao tác là object: undo, xếp hàng, log"),
                                      ("Template Method", "Khung cố định, bước thay đổi"),
                                      ("State", "Hành vi đổi theo trạng thái")])],
        *[box(f"rc-d{i}", 110, 250 + i * 125, 1160, 105, f'<span style="font-size:30px;text-align:left;width:100%">{esc(q)}</span>', "cyan")
          for i, q in enumerate(["Nhiều cách tính phí giao hàng, khách chọn cách nào dùng cách đó",
                                 "Đặt hàng xong báo email, SMS, audit mà service không biết ai nghe",
                                 "Trình soạn thảo cần undo và redo thao tác gõ",
                                 "Importer mở, đọc, kiểm tra, lưu cùng thứ tự, chỉ khác bước đọc",
                                 "Đơn PENDING, PAID, SHIPPED, mỗi trạng thái cho phép thao tác khác"])],
        *[tag(f"rc-a{i}", 1310, 250 + i * 125, 500, 105, a, "green", 34)
          for i, a in enumerate(["Strategy", "Observer", "Command", "Template Method", "State"])],
        el("rc-t1", 0, 400, 1920, None, letters("Dấu hiệu quyết định pattern"), "take r"),
        el("rc-t2", 0, 540, 1920, None, "nhiều cách · nhiều người nghe · hoàn tác · khung cố định · trạng thái", "take-sm r"),
    ]), beats=[
        B("Bảng nhớ năm pattern. Strategy: đóng gói mỗi cách làm, đổi lúc chạy. Observer: phát sự kiện cho nhiều người nghe. Command: thao tác thành object.",
          "Strategy · Observer · Command.",
          lambda w: [IN("#rc-eye", "blur"), TYPE("#rc-q", 0.2, 0.05), *shrink("rc", 0.2), IN("#rc-r0", "right", w("Strategy:")), IN("#rc-r1", "right", w("Observer:")), IN("#rc-r2", "right", w("Command:"))]),
        B("Template Method: khung cố định, bước thay đổi. State: hành vi đổi theo trạng thái.",
          "Template Method · State.",
          lambda w: [IN("#rc-r3", "right", w("Template Method:")), IN("#rc-r4", "right", w("State:"))]),
        B("Giờ thử đoán pattern. Nhiều cách tính phí giao hàng, khách chọn cách nào dùng cách đó: Strategy. Đặt hàng xong báo email, SMS và audit mà service không biết ai nghe: Observer. Trình soạn thảo cần undo và redo: Command.",
          "Bài tập: tình huống này dùng pattern nào? (1 - 3)",
          lambda w: [OUT(S(*[f"rc-r{i}" for i in range(5)]), "blur", 0, 0.5),
                     IN("#rc-d0", "right", w("Nhiều cách") - 0.3), IN("#rc-a0", "pop", w("Strategy.")), IN("#rc-d1", "right", w("Đặt hàng") - 0.3), IN("#rc-a1", "pop", w("Observer.")),
                     IN("#rc-d2", "right", w("Trình soạn") - 0.3), IN("#rc-a2", "pop", w("Command."))]),
        B("Mọi importer mở, đọc, kiểm tra, lưu theo cùng thứ tự, chỉ khác bước đọc: Template Method. Đơn hàng có Pending, Paid, Shipped, mỗi trạng thái cho phép thao tác khác nhau: State.",
          "Bài tập (4 - 5).",
          lambda w: [IN("#rc-d3", "right", 0.2), IN("#rc-a3", "pop", w("Template Method.")), IN("#rc-d4", "right", w("Đơn hàng") - 0.3), IN("#rc-a4", "pop", w("State."))]),
        B("Nhớ các dấu hiệu: nhiều cách làm, nhiều người nghe, cần hoàn tác, khung cố định, hay hành vi theo trạng thái.",
          "Nhớ dấu hiệu, rồi chọn pattern.",
          lambda w: [DIM(S("rc-eye", "rc-q", *[f"rc-d{i}" for i in range(5)], *[f"rc-a{i}" for i in range(5)]), 0, 0.07),
                     TYPE("#rc-t1", 0.4, 0.04), IN("#rc-t2", "blur", w("nhiều cách làm"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt 5 pattern"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 118, 1660, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Strategy", "Chuỗi if theo loại dài ra"), ("Observer", "Một sự kiện, nhiều bên cần biết"),
                                      ("Command", "Cần undo, xếp hàng, ghi log"),
                                      ("Template Method", "Khung cố định, bước thay đổi"),
                                      ("State", "Hành vi đổi theo trạng thái")])],
        el("ou-tr", 0, 810, 1920, None, "Bẫy: ba lần mới tách · cô lập lỗi listener · undo đối xứng · đừng lạm dụng kế thừa", "take-sm r", "font-size:34px"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại, năm pattern hành vi. Strategy: khi chuỗi if theo loại cứ dài ra. Observer: khi một sự kiện cần báo cho nhiều bên.",
          "Strategy và Observer.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Strategy:")), IN("#ou-r1", "right", w("Observer:"))]),
        B("Command: khi cần undo, xếp hàng hay ghi log. Template Method: khi khung cố định còn bước thay đổi. State: khi hành vi đổi theo trạng thái.",
          "Command, Template Method và State.",
          lambda w: [IN("#ou-r2", "right", w("Command:")), IN("#ou-r3", "right", w("Template Method:")), IN("#ou-r4", "right", w("State:"))]),
        B("Mỗi pattern có bẫy riêng: chờ tới lần thứ ba mới tách Strategy, cô lập lỗi từng listener, giữ undo đối xứng, và đừng lạm dụng kế thừa.",
          "Mỗi pattern có bẫy riêng.",
          lambda w: [IN("#ou-tr", "blur", w("chờ tới")), PULSE("#ou-r0", w("chờ tới")), PULSE("#ou-r1", w("cô lập")), PULSE("#ou-r2", w("giữ undo")), PULSE("#ou-r3", w("đừng lạm"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
