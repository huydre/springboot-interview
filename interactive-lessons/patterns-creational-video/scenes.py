"""Creational patterns explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Outputs quoted come from one run on JDK 21 (web/src/data/lessons/patterns-creational.ts):
8 threads on the unsynchronised lazy Singleton -> constructor called more than once; Holder and enum -> once;
enum + reflection -> IllegalArgumentException "Cannot reflectively create enum objects", Holder + reflection and
Holder + serialization -> a different instance, enum -> the same INSTANCE;
byChannel.get("email").notifyUser("hi") -> "email: hi", "sms" -> "sms: hi";
screen(dark) -> "dark button + dark checkbox", screen(light) -> "light button + light checkbox";
Builder -> "POST https://api.x.com/users {Content-Type=application/json} timeout=5s",
POST without Content-Type -> IllegalStateException "POST needs Content-Type";
shallow copy after adding a tag -> [a, b], deep copy -> [a].
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
    return f'<span class="mono big" style="font-size:40px">{label}</span><span style="font-size:36px">{esc(text)}</span>'


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
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text)}</span>', tone)


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


def card(id_, x, y, w, h, title, text, tone="cyan", ts=42, bs=30):
    return box(id_, x, y, w, h,
               f'<b style="font-size:{ts}px;text-align:center">{title}</b><span style="font-size:{bs}px;color:var(--muted);text-align:center;line-height:1.35">{text}</span>',
               tone, "card")


def hide(names, d=0.0):
    return OUT(S(*names), "blur", d, 0.5)


PATTERNS = [("Singleton", "một instance"), ("Factory<br>Method", "che việc new"), ("Abstract<br>Factory", "cả họ object"),
            ("Builder", "nhiều tham số"), ("Prototype", "sao chép")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn Java", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Design pattern là gì?"), "h1 r", "font-size:112px"),
        *[box(f"hk-c{i}", 85 + i * 355, 420, 330, 340,
              f'<b style="font-size:36px;text-align:center;line-height:1.2">{name}</b><span style="font-size:28px;color:var(--muted);text-align:center">{sub}</span>', "cyan", "card")
          for i, (name, sub) in enumerate(PATTERNS)],
        chip("hk-p1", 450, 850, "Khuôn giải pháp", "violet"),
        chip("hk-p2", 1070, 850, "Ngôn ngữ chung", "green"),
        el("hk-t1", 0, 400, 1920, None, letters("Chỉ dùng khi có nhu cầu thật"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "không thêm factory cho mọi class", "take-sm r"),
        wires(arrow("hk-a1", [(790, 882), (1050, 882)], "muted")),
    ]), beats=[
        B("Người phỏng vấn hỏi: Design pattern là gì?", "Người phỏng vấn hỏi: Design pattern là gì?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Đó là một giải pháp đã được kiểm chứng cho một vấn đề thiết kế hay gặp, kèm một cái tên chung để cả nhóm hiểu ngay.",
          "Khuôn giải pháp + tên gọi chung.",
          lambda w: [IN("#hk-p1", "left", w("giải pháp")), *ARROW("hk-a1", w("kèm một") - 0.5, 0.5), IN("#hk-p2", "pop", w("kèm một"))]),
        B("Bài này là nhóm Creational, lo việc tạo object. Có năm pattern: Singleton, Factory Method, Abstract Factory, Builder và Prototype.",
          "Creational: 5 pattern lo việc tạo object.",
          lambda w: [IN("#hk-c0", "pop", w("Singleton")), IN("#hk-c1", "pop", w("Factory Method")), IN("#hk-c2", "pop", w("Abstract Factory")),
                     IN("#hk-c3", "pop", w("Builder")), IN("#hk-c4", "pop", w("Prototype"))]),
        B("Và nhớ rằng pattern phục vụ thay đổi. Chỉ dùng khi có nhu cầu thật, đừng thêm factory cho mọi class.",
          "Chỉ dùng khi có nhu cầu thật.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", w("đừng thêm"))]),
    ]),
    # ------------------------------------------------------------ singleton
    dict(id="singleton", world=(1920, 1080), hud="", cam="".join([
        head("sn", "1 · Singleton", "Một instance duy nhất"),
        rule("sn-rule", "Cả ứng dụng chỉ có một instance", "Dùng cho thứ dùng chung: cấu hình, connection pool"),
        cbox("sn-bad", 110, 290, 1000, "LazyBad.java",
             "class LazyBad {\n"
             "  static LazyBad inst;\n"
             "  static LazyBad get() {\n"
             "    if (inst == null) inst = new LazyBad();\n"
             "    return inst; } }", "violet", 30),
        tag("sn-th1", 1210, 300, 600, 100, "thread 1: inst == null", "amber", 30),
        tag("sn-th2", 1210, 430, 600, 100, "thread 2: inst == null", "amber", 30),
        tag("sn-th3", 1210, 560, 600, 100, "thread 8: inst == null", "amber", 30),
        bigerr("sn-err", 110, 730, 1000, "✕ constructor bị gọi nhiều hơn 1 lần:<br>tạo ra nhiều instance", 36),
        cbox("sn-good", 110, 290, 1130, "Holder.java và Config.java",
             "enum Config { INSTANCE; }\n"
             "\n"
             "class Holder {\n"
             "  private static class H { static final Holder I = new Holder(); }\n"
             "  static Holder get() { return H.I; } }", "violet", 28),
        tag("sn-ok", 1330, 300, 480, 150, "8 thread: constructor gọi đúng 1 lần", "green", 30),
        note("sn-ok2", 1330, 500, 480, "JVM nạp class an toàn thread", "green", 30),
        tag("sn-h1", 680, 270, 560, 90, "Holder idiom", "violet", 34), tag("sn-h2", 1260, 270, 560, 90, "enum", "violet", 34),
        tag("sn-l1", 110, 390, 520, 100, "8 thread", "cyan", 34), tag("sn-l2", 110, 510, 520, 100, "Reflection", "cyan", 34),
        tag("sn-l3", 110, 630, 520, 100, "Serialize rồi đọc lại", "cyan", 30),
        tag("sn-c11", 680, 390, 560, 100, "✓ 1 lần", "green", 30), tag("sn-c12", 1260, 390, 560, 100, "✓ 1 lần", "green", 30),
        tag("sn-c21", 680, 510, 560, 100, "✕ tạo thêm instance", "red", 30), tag("sn-c22", 1260, 510, 560, 100, "✓ bị chặn", "green", 30),
        tag("sn-c31", 680, 630, 560, 100, "✕ ra instance khác", "red", 30), tag("sn-c32", 1260, 630, 560, 100, "✓ đúng INSTANCE cũ", "green", 30),
        tag("sn-sp", 300, 330, 1320, 140, "Spring: bean mặc định đã là singleton, do container quản lý", "cyan", 36),
        note("sn-sp2", 300, 530, 1320, "Singleton viết tay là trạng thái toàn cục: khó test", "red", 38),
        el("sn-t1", 0, 400, 1920, None, letters("Chỉ enum chặn đủ cả ba"), "take r"),
        el("sn-t2", 0, 540, 1920, None, "Holder hoặc enum: không cần synchronized", "take-sm r"),
        wires(arrow("sn-a1", [(1200, 350), (1120, 391)], "amber"), arrow("sn-a2", [(1200, 480), (1120, 442)], "amber"),
              arrow("sn-a3", [(1200, 610), (1120, 493)], "amber")),
    ]), beats=[
        B("Singleton: cả ứng dụng chỉ có một instance của class, và có một điểm truy cập chung. Dùng cho thứ dùng chung như cấu hình hay connection pool.",
          "Singleton: đúng một instance, có điểm truy cập chung.",
          lambda w: [IN("#sn-eye", "blur"), TYPE("#sn-q", 0.2, 0.05), IN("#sn-rule", "up", w("Singleton:") + 0.3)]),
        B("Cách viết lazy ngây thơ thì không an toàn khi nhiều thread. Nhiều thread cùng thấy inst bằng null trước khi ai kịp gán, nên mỗi thread tự gọi new. Chạy thật với tám thread: constructor bị gọi nhiều hơn một lần.",
          "Lazy không đồng bộ: nhiều thread, nhiều instance.",
          lambda w: [hide(["sn-rule"], 0), *shrink("sn", 0), IN("#sn-bad", "blur", 0.5, 0.7),
                     IN("#sn-th1", "right", w("Nhiều thread")), *ARROW("sn-a1", w("Nhiều thread") + 0.5, 0.5),
                     IN("#sn-th2", "right", w("Nhiều thread") + 0.9), *ARROW("sn-a2", w("Nhiều thread") + 1.4, 0.5),
                     IN("#sn-th3", "right", w("nên mỗi")), *ARROW("sn-a3", w("nên mỗi") + 0.5, 0.5),
                     IN("#sn-err", "up", w("Chạy thật")), SHAKE("#sn-err", w("Chạy thật") + 0.8)]),
        B("Có hai cách viết an toàn. Enum chỉ cần một phần tử. Holder idiom dùng một class lồng bên trong, JVM chỉ nạp nó khi cần. Chạy thật: constructor chỉ được gọi một lần.",
          "Holder idiom hoặc enum: constructor gọi 1 lần.",
          lambda w: [hide(["sn-bad", "sn-th1", "sn-th2", "sn-th3", "sn-err", "sn-a1", "sn-a1-h", "sn-a2", "sn-a2-h", "sn-a3", "sn-a3-h"], 0),
                     IN("#sn-good", "blur", 0.6, 0.7), PULSE("#sn-good", w("Enum chỉ")), PULSE("#sn-good", w("Holder idiom dùng")),
                     IN("#sn-ok", "up", w("Chạy thật")), IN("#sn-ok2", "up", w("Chạy thật") + 0.6)]),
        B("Nhưng còn hai cách phá nữa. Reflection: Enum ném Illegal Argument Exception, còn Holder vẫn bị tạo thêm một instance. Serialize rồi đọc lại: Holder ra instance khác, Enum ra đúng INSTANCE cũ.",
          "Reflection và serialize: chỉ enum chặn được.",
          lambda w: [hide(["sn-good", "sn-ok", "sn-ok2"], 0),
                     IN("#sn-h1", "down", 0.6), IN("#sn-h2", "down", 0.8),
                     IN("#sn-l1", "right", 0.9), IN("#sn-c11", "up", 1.0), IN("#sn-c12", "up", 1.1),
                     IN("#sn-l2", "right", w("Reflection:")), IN("#sn-c21", "up", w("Holder vẫn")), IN("#sn-c22", "up", w("Enum ném")),
                     IN("#sn-l3", "right", w("Serialize rồi")), IN("#sn-c31", "up", w("Holder ra")), IN("#sn-c32", "up", w("Enum ra đúng"))]),
        B("Trong Spring, bean mặc định đã là singleton do container quản lý, nên hiếm khi cần tự viết. Singleton viết tay là trạng thái toàn cục, nên khó test.",
          "Spring: để container quản lý bean.",
          lambda w: [hide(["sn-h1", "sn-h2", "sn-l1", "sn-l2", "sn-l3", "sn-c11", "sn-c12", "sn-c21", "sn-c22", "sn-c31", "sn-c32"], 0),
                     IN("#sn-sp", "up", 0.6), IN("#sn-sp2", "up", w("Singleton viết"))]),
        B("Vậy hãy nhớ: chỉ Enum chặn được cả reflection và serialization. Holder idiom hoặc Enum thì không cần synchronized.",
          "Chỉ enum chặn đủ cả ba.",
          lambda w: [hide(["sn-sp", "sn-sp2"], 0), DIM(S("sn-eye", "sn-q"), 0, 0.07),
                     TYPE("#sn-t1", 0.6, 0.04), IN("#sn-t2", "blur", w("Holder idiom hoặc"))]),
    ]),
    # ------------------------------------------------------------ factory method
    dict(id="factory-method", world=(1920, 1080), hud="", cam="".join([
        head("fm", "2 · Factory Method", "Tách việc new khỏi nơi dùng"),
        rule("fm-rule", "Class con quyết định tạo object nào", "Nơi dùng chỉ biết interface, không biết class cụ thể"),
        cbox("fm-bad", 110, 290, 1000, "OrderService.java",
             "if (ch.equals(\"email\"))\n"
             "    new Email().send(m);\n"
             "else if (ch.equals(\"sms\"))\n"
             "    new Sms().send(m);   // thêm Zalo?", "violet", 32),
        tag("fm-b1", 1210, 300, 600, 110, "Thêm kênh Zalo: sửa tiếp", "amber", 32),
        tag("fm-b2", 1210, 440, 600, 110, "Test: không thay được bản giả", "amber", 32),
        bigerr("fm-err", 110, 700, 1000, "✕ mỗi loại mới là một lần sửa lan rộng", 36),
        titled("fm-n", 660, 260, 600, 150, "abstract", "Notifier", "create()", "violet", 44),
        titled("fm-e", 110, 560, 480, 130, "", "EmailNotifier", "", "cyan", 34),
        titled("fm-s", 720, 560, 480, 130, "", "SmsNotifier", "", "cyan", 34),
        titled("fm-z", 1330, 560, 480, 130, "", "ZaloNotifier", "mới", "green", 34),
        tag("fm-ne", 110, 720, 480, 90, "new Email()", "cyan", 30),
        tag("fm-ns", 720, 720, 480, 90, "new Sms()", "cyan", 30),
        tag("fm-nz", 1330, 720, 480, 90, "new Zalo()", "green", 30),
        tag("fm-r1", 110, 850, 560, 80, "\"email\" → email: hi", "green", 30),
        tag("fm-r2", 720, 850, 480, 80, "\"sms\" → sms: hi", "green", 30),
        note("fm-r3", 1330, 845, 480, "Notifier và OrderService\nkhông đổi", "green", 30),
        card("fm-g", 160, 300, 760, 360, "Factory Method (GoF)", "Collection.iterator()<br>ArrayList, HashSet tự chọn iterator<br>Class con override method", "green"),
        card("fm-sf", 1000, 300, 760, 360, "Simple factory", "List.of(), Integer.valueOf(),<br>Calendar.getInstance()<br>Một method tĩnh, không ai override", "amber"),
        el("fm-t1", 0, 400, 1920, None, letters("Pattern phục vụ thay đổi"), "take r"),
        el("fm-t2", 0, 540, 1920, None, "chỉ một implementation, không đổi: cứ new (YAGNI)", "take-sm r"),
        wires(arrow("fm-a1", [(350, 555), (800, 415)], "violet", True), arrow("fm-a2", [(960, 555), (960, 415)], "violet", True),
              arrow("fm-a3", [(1570, 555), (1120, 415)], "violet", True)),
    ]), beats=[
        B("Singleton kiểm soát có bao nhiêu object. Factory Method kiểm soát ai quyết định tạo object nào, bằng cách đưa việc new vào một method.",
          "Factory Method: tách new ra khỏi nơi dùng.",
          lambda w: [IN("#fm-eye", "blur"), TYPE("#fm-q", 0.2, 0.05), IN("#fm-rule", "up", w("Factory Method kiểm") + 0.3)]),
        B("Không dùng pattern thì new Email và new Sms rải khắp nơi, kèm chuỗi if theo kênh. Thêm kênh Da lô phải sửa từng chỗ, và test cũng không thay được bản giả vì new nằm cứng trong code.",
          "Không dùng: new rải rác, mỗi loại mới sửa lan rộng.",
          lambda w: [hide(["fm-rule"], 0), *shrink("fm", 0), IN("#fm-bad", "blur", 0.5, 0.7), PULSE("#fm-bad", w("new Email")),
                     IN("#fm-b1", "right", w("Thêm kênh")), IN("#fm-b2", "right", w("test cũng")), IN("#fm-err", "up", w("test cũng") + 1.5), SHAKE("#fm-err", w("test cũng") + 2.3)]),
        B("Theo định nghĩa gốc của GoF, method tạo object là abstract ở class cha Notifier. Class con Email Notifier và Sms Notifier override nó để tạo đúng loại.",
          "Class con override method tạo object.",
          lambda w: [hide(["fm-bad", "fm-b1", "fm-b2", "fm-err"], 0), IN("#fm-n", "down", 0.6),
                     IN("#fm-e", "up", w("Email Notifier")), *ARROW("fm-a1", w("Email Notifier") + 0.5, 0.5), IN("#fm-ne", "up", w("Email Notifier") + 1.0),
                     IN("#fm-s", "up", w("Sms Notifier")), *ARROW("fm-a2", w("Sms Notifier") + 0.5, 0.5), IN("#fm-ns", "up", w("Sms Notifier") + 1.0)]),
        B("Thêm Da lô thì viết một class Da lô Notifier mới, và thêm một dòng vào bảng kênh. Notifier và Order Service không đổi. Chạy thật: kênh email trả email hi, kênh sms trả sms hi.",
          "Thêm Zalo: chỉ thêm một class.",
          lambda w: [IN("#fm-z", "pop", w("Da lô Notifier")), *ARROW("fm-a3", w("Da lô Notifier") + 0.5, 0.5), IN("#fm-nz", "up", w("Da lô Notifier") + 1.0),
                     IN("#fm-r3", "up", w("Notifier và Order")), IN("#fm-r1", "up", w("kênh email")), IN("#fm-r2", "up", w("kênh sms"))]),
        B("Ví dụ GoF thật trong JDK là Collection iterator: mỗi class con như ArrayList tự quyết định tạo iterator nào. Còn List of hay Integer value Of chỉ là static factory method, một method tĩnh không ai override. Đó là simple factory, và phỏng vấn hay bắt lỗi chỗ này.",
          "JDK: Collection.iterator() là GoF, List.of() là simple factory.",
          lambda w: [hide(["fm-n", "fm-e", "fm-s", "fm-z", "fm-ne", "fm-ns", "fm-nz", "fm-r1", "fm-r2", "fm-r3"] + ["fm-a1", "fm-a1-h", "fm-a2", "fm-a2-h", "fm-a3", "fm-a3-h"], 0),
                     IN("#fm-g", "up", 0.7), IN("#fm-sf", "up", w("Còn List")), PULSE("#fm-sf", w("Đó là simple"))]),
        B("Và nếu chỉ có một implementation, không đổi, thì cứ new. Pattern phục vụ thay đổi, không phải để thêm class cho đủ bộ.",
          "Chỉ một implementation: cứ new.",
          lambda w: [hide(["fm-g", "fm-sf"], 0), DIM(S("fm-eye", "fm-q"), 0, 0.07), TYPE("#fm-t1", 0.6, 0.04), IN("#fm-t2", "blur", w("Pattern phục vụ"))]),
    ]),
    # ------------------------------------------------------------ abstract factory
    dict(id="abstract-factory", world=(1920, 1080), hud="", cam="".join([
        head("af", "3 · Abstract Factory", "Cả họ object khớp nhau"),
        rule("af-rule", "Tạo cả một họ object liên quan", "Bảo đảm chúng luôn khớp nhau: nút và checkbox cùng theme"),
        cbox("af-bad", 110, 290, 1500, "Screen.java",
             "Button b   = dark ? new DarkButton()    : new LightButton();\n"
             "Checkbox c = dark ? new LightCheckbox() : new DarkCheckbox();", "violet", 30),
        tag("af-x1", 110, 560, 520, 100, "nút tối", "cyan", 34), tag("af-x2", 700, 560, 520, 100, "checkbox sáng", "amber", 34),
        bigerr("af-err", 110, 720, 1400, "✕ giao diện lệch theme, compiler không báo gì", 38),
        titled("af-th", 660, 260, 600, 160, "«interface»", "Theme", "button() · checkbox()", "violet", 44),
        titled("af-d", 250, 520, 520, 120, "", "DarkTheme", "", "cyan", 36),
        titled("af-l", 1150, 520, 520, 120, "", "LightTheme", "", "cyan", 36),
        tag("af-pd1", 250, 690, 250, 80, "DarkButton", "cyan", 26), tag("af-pd2", 520, 690, 250, 80, "DarkCheckbox", "cyan", 26),
        tag("af-pl1", 1150, 690, 250, 80, "LightButton", "cyan", 26), tag("af-pl2", 1420, 690, 250, 80, "LightCheckbox", "cyan", 26),
        tag("af-r1", 110, 830, 800, 90, "dark button + dark checkbox", "green", 32),
        tag("af-r2", 1010, 830, 800, 90, "light button + light checkbox", "green", 32),
        card("af-c1", 160, 300, 760, 320, "Dễ thêm họ mới", "BlueTheme là một class mới<br>screen() không đổi", "green"),
        card("af-c2", 1000, 300, 760, 320, "Khó thêm loại sản phẩm", "Thêm Slider vào Theme<br>phải sửa mọi theme", "red"),
        el("af-t1", 0, 400, 1920, None, letters("Cả bộ đến từ cùng một Theme"), "take r"),
        el("af-t2", 0, 540, 1920, None, "họ sản phẩm chỉ có một loại thì không cần", "take-sm r"),
        wires(arrow("af-a1", [(510, 515), (800, 425)], "violet", True), arrow("af-a2", [(1410, 515), (1120, 425)], "violet", True)),
    ]), beats=[
        B("Factory Method tạo một sản phẩm. Nhưng nếu nhiều sản phẩm phải luôn đi cùng nhau thì sao? Abstract Factory tạo cả một họ object liên quan, và bảo đảm chúng luôn khớp nhau.",
          "Abstract Factory: cả họ object khớp nhau.",
          lambda w: [IN("#af-eye", "blur"), TYPE("#af-q", 0.2, 0.05), IN("#af-rule", "up", w("Abstract Factory tạo") + 0.3)]),
        B("Giả sử ta tự chọn từng cái. Nút lấy theme tối, checkbox lại lấy nhầm theme sáng. Giao diện bị lệch, mà compiler không báo gì. Việc giữ cả bộ khớp nhau nằm ở trí nhớ người viết.",
          "Tự chọn từng cái: dễ lệch theme.",
          lambda w: [hide(["af-rule"], 0), *shrink("af", 0), IN("#af-bad", "blur", 0.5, 0.7),
                     IN("#af-x1", "up", w("Nút lấy")), IN("#af-x2", "up", w("checkbox lại")), IN("#af-err", "up", w("Giao diện bị")), SHAKE("#af-err", w("Giao diện bị") + 0.8)]),
        B("Với Abstract Factory, ta có interface Theme với hai method: button và checkbox. Dark Theme và Light Theme cùng implement nó.",
          "Theme là interface, mỗi họ là một class.",
          lambda w: [hide(["af-bad", "af-x1", "af-x2", "af-err"], 0), IN("#af-th", "down", 0.6),
                     IN("#af-d", "up", w("Dark Theme")), *ARROW("af-a1", w("Dark Theme") + 0.5, 0.5),
                     IN("#af-l", "up", w("Light Theme")), *ARROW("af-a2", w("Light Theme") + 0.5, 0.5)]),
        B("Mỗi theme tạo ra nguyên bộ của mình. Không thể lệch được, vì cả bộ đến từ cùng một Theme. Chạy thật: dark button cùng dark checkbox, và light button cùng light checkbox.",
          "Cả bộ đến từ cùng một Theme.",
          lambda w: [IN("#af-pd1", "up", w("Mỗi theme")), IN("#af-pd2", "up", w("Mỗi theme") + 0.5), IN("#af-pl1", "up", w("Mỗi theme") + 1.0), IN("#af-pl2", "up", w("Mỗi theme") + 1.5),
                     IN("#af-r1", "up", w("Chạy thật")), IN("#af-r2", "up", w("Chạy thật") + 0.8)]),
        B("Thêm theme Blue chỉ là viết một class mới. Nhưng ngược lại, thêm một loại sản phẩm mới như Slider thì phải sửa mọi theme. Abstract Factory dễ thêm họ, khó thêm loại sản phẩm.",
          "Dễ thêm họ mới, khó thêm loại sản phẩm.",
          lambda w: [hide(["af-th", "af-d", "af-l", "af-pd1", "af-pd2", "af-pl1", "af-pl2", "af-r1", "af-r2", "af-a1", "af-a1-h", "af-a2", "af-a2-h"], 0),
                     IN("#af-c1", "up", 0.7), IN("#af-c2", "up", w("Nhưng ngược lại"))]),
        B("Hay gặp ở bộ đối tượng theo loại database, hay bộ widget theo hệ điều hành. Họ sản phẩm chỉ có một loại thì không cần.",
          "Họ sản phẩm chỉ một loại: không cần.",
          lambda w: [hide(["af-c1", "af-c2"], 0), DIM(S("af-eye", "af-q"), 0, 0.07), TYPE("#af-t1", 0.6, 0.04), IN("#af-t2", "blur", w("Họ sản phẩm"))]),
    ]),
    # ------------------------------------------------------------ builder
    dict(id="builder", world=(1920, 1080), hud="", cam="".join([
        head("bu", "4 · Builder", "Dựng object từng bước"),
        rule("bu-rule", "Nhiều tham số, nhiều cái tuỳ chọn", "Chuỗi lời gọi dễ đọc, kiểm tra hợp lệ ở build()"),
        cbox("bu-bad", 110, 290, 1700, "Constructor dài",
             "new HttpRequest(\"https://api.x.com/users\", \"POST\", null, null, 5, true);", "violet", 32),
        tag("bu-q1", 360, 520, 400, 100, "5 là gì?", "amber", 34), tag("bu-q2", 840, 520, 400, 100, "true là gì?", "amber", 34),
        bigerr("bu-err", 110, 690, 1500, "✕ đảo hai tham số cùng kiểu: vẫn biên dịch được, lỗi lộ ra lúc chạy", 36),
        cbox("bu-good", 110, 280, 1450, "Builder",
             "HttpRequest r = new HttpRequest.Builder(\"https://api.x.com/users\")\n"
             "    .method(\"POST\")\n"
             "    .header(\"Content-Type\", \"application/json\")\n"
             "    .timeout(5)\n"
             "    .build();", "violet", 30),
        tag("bu-res", 110, 640, 1700, 100, "POST https://api.x.com/users {Content-Type=application/json} timeout=5s", "green", 28),
        tag("bu-p", 110, 650, 560, 110, "POST, thiếu Content-Type", "amber", 30),
        tag("bu-bd", 780, 650, 300, 110, "build()", "violet", 38),
        bigerr("bu-ex", 1190, 650, 620, "✕ IllegalStateException:<br>POST needs Content-Type", 32),
        note("bu-nx", 110, 820, 1700, "Object sai không bao giờ tồn tại", "green", 40),
        card("bu-c1", 160, 300, 760, 360, "Nên dùng Builder", "Nhiều tham số tuỳ chọn<br>hoặc cần kiểm tra chéo giữa các field<br>Thường đi cùng object bất biến", "green"),
        card("bu-c2", 1000, 300, 760, 360, "Chưa cần", "Class chỉ có hai tham số:<br>constructor hoặc record là đủ", "amber"),
        el("bu-t1", 0, 400, 1920, None, letters("Kiểm tra ở build()"), "take r"),
        el("bu-t2", 0, 540, 1920, None, "object sai không bao giờ tồn tại", "take-sm r"),
        wires(arrow("bu-a1", [(690, 705), (770, 705)], "amber"), arrow("bu-a2", [(1090, 705), (1180, 705)], "red")),
    ]), beats=[
        B("Ba pattern trước lo việc tạo class nào. Builder lo chuyện khác: object có quá nhiều tham số, trong đó nhiều cái là tuỳ chọn.",
          "Builder: dựng object nhiều tham số từng bước.",
          lambda w: [IN("#bu-eye", "blur"), TYPE("#bu-q", 0.2, 0.05), IN("#bu-rule", "up", w("Builder lo") + 0.3)]),
        B("Constructor sáu tham số rất khó đọc. Nếu không mở class thì không biết số năm và true nghĩa là gì. Đảo hai tham số cùng kiểu vẫn biên dịch được, lỗi chỉ lộ ra lúc chạy.",
          "Constructor dài: khó đọc, dễ đảo tham số.",
          lambda w: [hide(["bu-rule"], 0), *shrink("bu", 0), IN("#bu-bad", "blur", 0.5, 0.7),
                     IN("#bu-q1", "up", w("số năm")), IN("#bu-q2", "up", w("true nghĩa")), IN("#bu-err", "up", w("Đảo hai")), SHAKE("#bu-err", w("Đảo hai") + 0.8)]),
        B("Với Builder, mỗi giá trị có một cái tên: method, header, timeout. Chuỗi lời gọi đọc như một câu. Chạy thật: request POST với header Content Type là application json, timeout năm giây.",
          "Builder: mỗi giá trị có một cái tên.",
          lambda w: [hide(["bu-bad", "bu-q1", "bu-q2", "bu-err"], 0), IN("#bu-good", "blur", 0.5, 0.7),
                     PULSE("#bu-good", w("method")), PULSE("#bu-good", w("header")), PULSE("#bu-good", w("timeout")), IN("#bu-res", "up", w("Chạy thật"))]),
        B("Giờ giả sử quên header Content Type cho một request POST. Hàm build kiểm tra quy tắc này, và ném Illegal State Exception. Object sai không bao giờ tồn tại.",
          "Quên Content-Type: build() ném exception.",
          lambda w: [hide(["bu-res"], 0), IN("#bu-p", "left", w("quên header")), *ARROW("bu-a1", w("Hàm build") - 0.5, 0.4), IN("#bu-bd", "pop", w("Hàm build")),
                     *ARROW("bu-a2", w("ném Illegal") - 0.4, 0.4), IN("#bu-ex", "right", w("ném Illegal")), SHAKE("#bu-ex", w("ném Illegal") + 0.7),
                     IN("#bu-nx", "up", w("Object sai"))]),
        B("Dùng Builder khi có nhiều tham số tuỳ chọn, hoặc cần kiểm tra chéo giữa các field, và nó thường đi cùng object bất biến. Còn class chỉ có hai tham số thì constructor hoặc record là đủ.",
          "Nhiều tham số: Builder. Ít tham số: constructor hoặc record.",
          lambda w: [hide(["bu-good", "bu-p", "bu-bd", "bu-ex", "bu-nx", "bu-a1", "bu-a1-h", "bu-a2", "bu-a2-h"], 0),
                     IN("#bu-c1", "up", 0.7), IN("#bu-c2", "up", w("Còn class"))]),
        B("Hãy nhớ lợi ích lớn nhất: kiểm tra ngay ở hàm build, nên object không hợp lệ không bao giờ được tạo ra.",
          "Kiểm tra ở build(): object sai không tồn tại.",
          lambda w: [hide(["bu-c1", "bu-c2"], 0), DIM(S("bu-eye", "bu-q"), 0, 0.07), TYPE("#bu-t1", 0.6, 0.04), IN("#bu-t2", "blur", w("nên object"))]),
    ]),
    # ------------------------------------------------------------ prototype
    dict(id="prototype", world=(1920, 1080), hud="", cam="".join([
        head("pr", "5 · Prototype", "Tạo object bằng cách sao chép"),
        rule("pr-rule", "Sao chép một object mẫu thay vì dựng từ đầu", "Hữu ích khi dựng tốn kém hoặc cấu hình phức tạp"),
        titled("pr-d1", 110, 270, 520, 130, "", "Doc gốc", "", "cyan", 38),
        titled("pr-d2", 110, 520, 520, 130, "", "Doc bản sao", "", "cyan", 38),
        box("pr-l", 900, 380, 560, 190, '<b class="mono" style="font-size:38px">List tags</b><div style="height:90px"></div>', "violet", "col"),
        tag("pr-la", 940, 480, 120, 70, "a", "cyan", 30), tag("pr-lb", 1090, 480, 120, 70, "b", "amber", 30),
        bigerr("pr-err", 900, 600, 900, "✕ bản sao nông thấy luôn [a, b]", 32),
        cbox("pr-sc", 110, 730, 1400, "Doc.java", "Doc shallow() { return new Doc(title, tags); }", "violet", 32),
        titled("pr-e1", 110, 270, 520, 130, "", "Doc gốc", "", "cyan", 38),
        titled("pr-e2", 110, 520, 520, 130, "", "Doc bản sao", "", "cyan", 38),
        titled("pr-m1", 900, 270, 560, 130, "", "List", "[a, b]", "violet", 36),
        titled("pr-m2", 900, 520, 560, 130, "", "List mới", "[a]", "green", 36),
        note("pr-gd", 1500, 530, 350, "✓ bản sao sâu vẫn là [a]", "green", 30),
        cbox("pr-dc", 110, 730, 1400, "Doc.java", "Doc deep() { return new Doc(title, new ArrayList<>(tags)); }", "violet", 32),
        card("pr-c1", 160, 300, 760, 360, "Cloneable + clone()", "Chỉ chép nông<br>Không gọi constructor<br>Rất dễ dùng sai", "red"),
        card("pr-c2", 1000, 300, 760, 360, "Copy constructor", "Hoặc một factory method sao chép<br>Rõ ràng, tự quyết định nông hay sâu", "green"),
        el("pr-t1", 0, 400, 1920, None, letters("Nông hay sâu?"), "take r"),
        el("pr-t2", 0, 540, 1920, None, "trong Java dùng copy constructor thay cho clone()", "take-sm r"),
        wires(arrow("pr-a1", [(640, 335), (895, 440)], "violet"), arrow("pr-a2", [(640, 585), (895, 510)], "violet"),
              arrow("pr-b1", [(640, 335), (895, 335)], "violet"), arrow("pr-b2", [(640, 585), (895, 585)], "green")),
    ]), beats=[
        B("Builder dựng object từ đầu. Prototype đi đường ngược lại: lấy một object có sẵn rồi sao chép. Điểm mấu chốt là sao chép nông hay sâu.",
          "Prototype: tạo object mới bằng cách sao chép.",
          lambda w: [IN("#pr-eye", "blur"), TYPE("#pr-q", 0.2, 0.05), IN("#pr-rule", "up", w("Prototype đi") + 0.3)]),
        B("Sao chép nông chỉ chép tham chiếu. Bản gốc và bản sao cùng trỏ vào một List. Đây là code của bản sao nông.",
          "Sao chép nông: hai object dùng chung một List.",
          lambda w: [hide(["pr-rule"], 0), *shrink("pr", 0), IN("#pr-d1", "up", 0.5), IN("#pr-l", "up", 0.8), IN("#pr-la", "pop", 1.0),
                     IN("#pr-d2", "up", w("Bản gốc")), *ARROW("pr-a1", w("cùng trỏ") - 0.6, 0.5), *ARROW("pr-a2", w("cùng trỏ") - 0.2, 0.5),
                     IN("#pr-sc", "blur", w("Đây là"))]),
        B("Giờ thêm tag b vào bản gốc. Chạy thật: bản sao nông thấy luôn tag mới, ra a và b. Sửa bản sao cũng làm hỏng cả bản gốc.",
          "Thêm tag vào bản gốc: bản sao nông thấy luôn.",
          lambda w: [IN("#pr-lb", "pop", w("thêm tag")), PULSE("#pr-l", w("thêm tag") + 0.2), IN("#pr-err", "up", w("Chạy thật")), SHAKE("#pr-err", w("Chạy thật") + 0.8)]),
        B("Sao chép sâu thì chép cả phần bên trong: tạo một List mới. Thêm tag vào bản gốc, bản sao sâu vẫn chỉ là a. Hai bên độc lập.",
          "Sao chép sâu: có List riêng.",
          lambda w: [hide(["pr-d1", "pr-d2", "pr-l", "pr-la", "pr-lb", "pr-err", "pr-sc", "pr-a1", "pr-a1-h", "pr-a2", "pr-a2-h"], 0),
                     IN("#pr-e1", "up", 0.7), IN("#pr-m1", "up", 0.9), *ARROW("pr-b1", 1.2, 0.5),
                     IN("#pr-e2", "up", w("tạo một")), IN("#pr-m2", "up", w("List mới")), *ARROW("pr-b2", w("List mới") + 0.4, 0.5),
                     IN("#pr-dc", "blur", w("Thêm tag")), IN("#pr-gd", "up", w("bản sao sâu vẫn"))]),
        B("Trong Java, đừng dựa vào Cloneable và clone. Mặc định nó chỉ chép nông và không gọi constructor, rất dễ dùng sai. Hãy dùng copy constructor, hoặc một factory method sao chép.",
          "Đừng dựa vào clone(): dùng copy constructor.",
          lambda w: [hide(["pr-e1", "pr-e2", "pr-m1", "pr-m2", "pr-gd", "pr-dc", "pr-b1", "pr-b1-h", "pr-b2", "pr-b2-h"], 0),
                     IN("#pr-c1", "up", 0.7), IN("#pr-c2", "up", w("Hãy dùng"))]),
        B("Tóm lại: nông chép tham chiếu, sâu chép cả phần bên trong. Và trong Java, dùng copy constructor thay cho clone.",
          "Nông: chép tham chiếu. Sâu: chép cả phần bên trong.",
          lambda w: [hide(["pr-c1", "pr-c2"], 0), DIM(S("pr-eye", "pr-q"), 0, 0.07), TYPE("#pr-t1", 0.6, 0.04), IN("#pr-t2", "blur", w("Và trong Java"))]),
    ]),
    # ------------------------------------------------------------ cheat sheet + drill
    dict(id="recap", world=(1920, 1080), hud="", cam="".join([
        head("rc", "6 · Bảng nhớ", "Nhận ra dấu hiệu, chọn pattern", 76),
        *[box(f"rc-r{i}", 200, 270 + i * 120, 1520, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Singleton", "Đúng một instance, có điểm truy cập chung"), ("Factory Method", "Tách new ra khỏi nơi dùng"),
                                      ("Abstract Factory", "Tạo cả họ object khớp nhau"), ("Builder", "Dựng nhiều tham số, kiểm tra ở build()"),
                                      ("Prototype", "Tạo object mới bằng cách sao chép")])],
        *[tag(f"rc-s{i}", 110, 270 + i * 125, 1000, 100, t, "amber", 28)
          for i, t in enumerate(["Cấu hình dùng chung, chỉ cần đúng một bản", "Email hay SMS lúc chạy quyết định, sẽ thêm Zalo",
                                 "Bộ nút, checkbox, menu cùng theme sáng hoặc tối", "8 tham số, nhiều cái tuỳ chọn, cần kiểm tra chéo",
                                 "Hàng nghìn object gần giống, dựng từ đầu tốn kém"])],
        *[tag(f"rc-p{i}", 1250, 270 + i * 125, 560, 100, t, "green", 32)
          for i, t in enumerate(["Singleton", "Factory Method", "Abstract Factory", "Builder", "Prototype"])],
        el("rc-t1", 0, 400, 1920, None, letters("Dấu hiệu quan trọng hơn tên"), "take r"),
        el("rc-t2", 0, 540, 1920, None, "một instance · che new · cả họ · nhiều tham số · sao chép", "take-sm r"),
        wires(*[arrow(f"rc-a{i}", [(1120, 320 + i * 125), (1240, 320 + i * 125)], "muted") for i in range(5)]),
    ]), beats=[
        B("Đây là bảng nhớ. Singleton: đúng một instance. Factory Method: tách new ra khỏi nơi dùng. Abstract Factory: cả họ object khớp nhau. Builder: nhiều tham số, kiểm tra ở hàm build. Prototype: tạo object bằng cách sao chép.",
          "Bảng nhớ 5 pattern Creational.",
          lambda w: [IN("#rc-eye", "blur"), TYPE("#rc-q", 0.2, 0.05), *shrink("rc", 0.1),
                     IN("#rc-r0", "right", w("Singleton:")), IN("#rc-r1", "right", w("Factory Method:")), IN("#rc-r2", "right", w("Abstract Factory:")),
                     IN("#rc-r3", "right", w("Builder:")), IN("#rc-r4", "right", w("Prototype:"))]),
        B("Giờ thử nhận ra dấu hiệu. Cấu hình dùng chung, chỉ cần một bản: Singleton. Email hay SMS do lúc chạy quyết định: Factory Method. Bộ giao diện cùng theme: Abstract Factory. Tám tham số cần kiểm tra chéo: Builder. Hàng nghìn object gần giống: Prototype.",
          "Tình huống nào dùng pattern nào?",
          lambda w: [hide([f"rc-r{i}" for i in range(5)], 0),
                     IN("#rc-s0", "right", 0.7), *ARROW("rc-a0", 1.0, 0.4), IN("#rc-p0", "pop", w(": Singleton") + 0.2),
                     IN("#rc-s1", "right", w("Email hay")), *ARROW("rc-a1", w("Email hay") + 0.5, 0.4), IN("#rc-p1", "pop", w(": Factory Method") + 0.2),
                     IN("#rc-s2", "right", w("Bộ giao diện")), *ARROW("rc-a2", w("Bộ giao diện") + 0.5, 0.4), IN("#rc-p2", "pop", w(": Abstract Factory") + 0.2),
                     IN("#rc-s3", "right", w("Tám tham số")), *ARROW("rc-a3", w("Tám tham số") + 0.5, 0.4), IN("#rc-p3", "pop", w(": Builder") + 0.2),
                     IN("#rc-s4", "right", w("Hàng nghìn")), *ARROW("rc-a4", w("Hàng nghìn") + 0.5, 0.4), IN("#rc-p4", "pop", w(": Prototype") + 0.2)]),
        B("Nhận ra dấu hiệu quan trọng hơn thuộc tên: một instance, che new, cả họ, nhiều tham số, hoặc sao chép.",
          "Dấu hiệu quan trọng hơn thuộc tên.",
          lambda w: [hide([f"rc-s{i}" for i in range(5)] + [f"rc-p{i}" for i in range(5)] + [f"rc-a{i}" for i in range(5)] + [f"rc-a{i}-h" for i in range(5)], 0),
                     DIM(S("rc-eye", "rc-q"), 0, 0.07), TYPE("#rc-t1", 0.6, 0.04), IN("#rc-t2", "blur", w("một instance"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Creational"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 160, 200 + i * 118, 1600, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Singleton", "Enum hoặc holder idiom, Spring để container lo"),
                                      ("Factory Method", "Che new, thêm loại là thêm một class"),
                                      ("Abstract Factory", "Cả họ object luôn khớp nhau"),
                                      ("Builder", "Nhiều tham số, kiểm tra ở build()"),
                                      ("Prototype", "Sao chép: nhớ nông hay sâu")])],
        chip("ou-f1", 330, 810, "Là gì?", "cyan"), chip("ou-f2", 590, 810, "Khi nào dùng", "green"),
        chip("ou-f3", 1010, 810, "Khi nào không", "amber"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay chạy từng ví dụ", "cta r"),
        wires(arrow("ou-a1", [(480, 842), (575, 842)], "muted"), arrow("ou-a2", [(850, 842), (995, 842)], "muted")),
    ]), beats=[
        B("Tóm lại, nhóm Creational lo việc tạo object. Singleton: Enum hoặc holder idiom, và trong Spring để container quản lý bean. Factory Method: che việc new, thêm loại mới chỉ là thêm một class.",
          "Tóm tắt: Singleton và Factory Method.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Singleton:")), IN("#ou-r1", "right", w("Factory Method:"))]),
        B("Abstract Factory: cả họ object luôn khớp nhau. Builder: nhiều tham số, kiểm tra ở hàm build. Prototype: sao chép, nhớ phân biệt nông và sâu.",
          "Abstract Factory, Builder và Prototype.",
          lambda w: [IN("#ou-r2", "right", w("Abstract Factory:")), IN("#ou-r3", "right", w("Builder:")), IN("#ou-r4", "right", w("Prototype:"))]),
        B("Khi trả lời phỏng vấn, hãy đi theo khung: pattern là gì, khi nào dùng, và khi nào không cần.",
          "Khung trả lời: Là gì → Khi nào dùng → Khi nào không.",
          lambda w: [IN("#ou-f1", "up", w("pattern là gì")), *ARROW("ou-a1", w("khi nào dùng") - 0.5, 0.4), IN("#ou-f2", "up", w("khi nào dùng")),
                     *ARROW("ou-a2", w("và khi nào không") - 0.4, 0.4), IN("#ou-f3", "pop", w("và khi nào không"))]),
        B("Chỉ áp dụng khi có nhu cầu thật. Mở bài học tương tác để làm quiz và tự tay chạy từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", w("Mở bài")), PULSE("#ou-f3", 0.3)]),
    ]),
]

fit_to_audio(SCENES, __file__)
