"""Design Patterns 4 (Behavioral 2) explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

All Java outputs come from the lesson's JDK 21 run (web/src/data/lessons/patterns-behavioral-2.ts):
chain [auth, rateLimit, validate]: no token -> "401 no token", 500 calls/minute -> "429 too many requests", empty body -> "400 empty body", valid -> "200 handled";
Range(1, 5) for-each sum 1..4 = 10; remove 2 from [1, 2, 3, 4] with iterator.remove() -> [1, 3, 4], list.remove() inside for-each -> ConcurrentModificationException,
removing 2 from [1, 2, 3] throws nothing; chat room {an=[], binh=[an: hi all], chi=[an: hi all]};
Memento "Hello" -> "Hello world" -> restore "Hello"; circle r=1 + rect 2x3: AreaVisitor 9.14, JsonVisitor {"circle":1.0} and {"rect":[2.0,3.0]}, sealed + switch 9.14;
(2 + 3) * 4 = 20.
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


def panel(id_, x, y, w, h, title, lines, tone="cyan"):
    body = "<br>".join(esc(t) for t in lines)
    return box(id_, x, y, w, h, f'<b style="font-size:42px">{esc(title)}</b>'
               f'<span style="font-size:32px;color:var(--muted);text-align:center;line-height:1.45">{body}</span>', tone, "card")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def trow(id_, y, name, use, trap):
    return box(id_, 110, y, 1700, 92,
               f'<span class="mono big" style="font-size:34px;width:300px">{esc(name)}</span>'
               f'<span style="font-size:29px;width:720px">{esc(use)}</span>'
               f'<span style="font-size:29px;color:var(--muted)">{esc(trap)}</span>', "cyan", "row")


def take(p, a, b):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(a), "take r") + el(f"{p}-t2", 0, 540, 1920, None, b, "take-sm r"))


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 120, 1300, None, "Câu hỏi phỏng vấn Design Pattern", "eyebrow r"),
        el("hk-q", 0, 190, 1920, None, letters("Behavioral, phần hai"), "h1 r", "font-size:112px"),
        *[box(f"hk-c{i}", 110 + (i % 3) * 590, 400 + (i // 3) * 220, 540, 190,
              f'<b style="font-size:40px;text-align:center">{n}</b><span style="font-size:28px;color:var(--muted);text-align:center">{s}</span>', "cyan", "card")
          for i, (n, s) in enumerate([("Chain of Responsibility", "chuỗi xử lý"), ("Iterator", "duyệt không lộ cấu trúc"),
                                      ("Mediator", "một người điều phối"), ("Memento", "lưu và khôi phục"),
                                      ("Visitor", "thêm thao tác mới"), ("Interpreter", "ngữ pháp thành cây")])],
        chip("hk-p1", 400, 870, "Cấu trúc", "cyan"), chip("hk-p2", 760, 870, "Code ngắn", "violet"),
        chip("hk-p3", 1160, 870, "Khi nào dùng", "green"),
        el("hk-t1", 0, 400, 1920, None, letters("Filter chain là pattern nào?"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "Chain of Responsibility", "take-sm r"),
        wires(arrow("hk-a1", [(640, 902), (745, 902)], "muted"), arrow("hk-a2", [(1000, 902), (1145, 902)], "muted")),
    ]), beats=[
        B("Sáu pattern cuối của nhóm Behavioral ít gặp hơn, nhưng hay nằm sẵn trong JDK và Spring.",
          "6 pattern Behavioral còn lại, hay có trong JDK và Spring.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Đó là Chain of Responsibility, Iterator, Mediator, Memento, Visitor và Interpreter.",
          "Chain, Iterator, Mediator, Memento, Visitor, Interpreter.",
          lambda w: [IN("#hk-c0", "pop", w("Chain of")), IN("#hk-c1", "pop", w("Iterator")), IN("#hk-c2", "pop", w("Mediator")),
                     IN("#hk-c3", "pop", w("Memento")), IN("#hk-c4", "pop", w("Visitor")), IN("#hk-c5", "pop", w("và Interpreter"))]),
        B("Với mỗi pattern, ta xem cấu trúc, một đoạn code ngắn, rồi khi nào nên dùng.",
          "Cấu trúc, code ngắn, khi nào dùng.",
          lambda w: [IN("#hk-p1", "left", w("cấu trúc")), *ARROW("hk-a1", w("một đoạn") - 0.5, 0.4), IN("#hk-p2", "pop", w("một đoạn")),
                     *ARROW("hk-a2", w("rồi khi") - 0.5, 0.4), IN("#hk-p3", "pop", w("rồi khi"))]),
        B("Câu mở đầu: Servlet Filter chain và Spring Security filter chain là ví dụ của pattern nào? Đó là Chain of Responsibility, và ta bắt đầu từ đó.",
          "Filter chain là pattern nào? Chain of Responsibility.",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-p1", "hk-p2", "hk-p3", *[f"hk-c{i}" for i in range(6)]) + ", " + AR("hk-a1", "hk-a2"), 0, 0.07),
                     TYPE("#hk-t1", 0.4, 0.04), IN("#hk-t2", "blur", w("Đó là"))]),
    ]),
    # ------------------------------------------------------------ chain
    dict(id="chain", world=(1920, 1080), hud="", cam="".join([
        head("ch", "Pattern 1 · Chain of Responsibility", "Chuyền yêu cầu qua chuỗi handler"),
        rule("ch-rule", "Mỗi handler tự quyết: xử lý và dừng, hay cho qua", "Giống đơn xin nghỉ: trưởng nhóm, trưởng phòng, giám đốc"),
        tag("ch-rq", 90, 280, 240, 110, "Request", "amber", 34),
        titled("ch-h1", 400, 270, 320, 130, "handler 1", "auth", "", "violet", 40),
        titled("ch-h2", 790, 270, 320, 130, "handler 2", "rateLimit", "", "violet", 40),
        titled("ch-h3", 1180, 270, 320, 130, "handler 3", "validate", "", "violet", 40),
        tag("ch-ok", 1570, 280, 260, 110, "200 handled", "green", 30),
        titled("ch-e1", 390, 450, 340, 140, "", "401", "no token", "red", 44),
        titled("ch-e2", 780, 450, 340, 140, "", "429", "too many requests", "red", 44),
        titled("ch-e3", 1170, 450, 340, 140, "", "400", "empty body", "red", 44),
        cbox("ch-code", 90, 640, 980, "Chain.java",
             "for (Handler h : chain) {\n"
             "    var out = h.handle(r);\n"
             "    if (out.isPresent()) return out.get();\n"
             "}\n"
             "return \"200 handled\";", "violet", 30),
        note("ch-note", 1130, 660, 700, "Có kết quả: dừng\nRỗng: cho qua", "cyan", 38),
        tag("ch-add", 1130, 660, 700, 100, "Thêm bước = thêm handler", "green", 32),
        tag("ch-seen", 1130, 790, 700, 100, "Filter của Servlet, Spring Security", "cyan", 26),
        take("ch", "Thứ tự handler quyết định kết quả", "mỗi bước độc lập, thêm bớt dễ"),
        wires(arrow("ch-a0", [(330, 335), (400, 335)], "muted"), arrow("ch-a1", [(720, 335), (790, 335)], "muted"),
              arrow("ch-a2", [(1110, 335), (1180, 335)], "muted"), arrow("ch-a3", [(1500, 335), (1570, 335)], "green"),
              arrow("ch-d1", [(560, 400), (560, 450)], "red", True), arrow("ch-d2", [(950, 400), (950, 450)], "red", True),
              arrow("ch-d3", [(1340, 400), (1340, 450)], "red", True)),
    ]), beats=[
        B("Pattern đầu tiên là Chain of Responsibility: chuyền yêu cầu qua một chuỗi handler. Mỗi handler tự quyết, xử lý rồi dừng, hay cho qua handler kế tiếp. Giống đơn xin nghỉ đi qua trưởng nhóm, trưởng phòng, rồi giám đốc.",
          "Mỗi handler: xử lý và dừng, hay cho qua.",
          lambda w: [IN("#ch-eye", "blur"), TYPE("#ch-q", 0.2, 0.05), IN("#ch-rule", "up", w("Mỗi handler") + 0.3)]),
        B("Ví dụ một yêu cầu HTTP đi qua ba bước: xác thực, giới hạn tốc độ, và kiểm tra dữ liệu. Qua được cả ba thì kết quả là hai trăm handled.",
          "Request qua auth, rateLimit, validate: 200 handled.",
          lambda w: [OUT("#ch-rule", "blur", 0, 0.4), *shrink("ch", 0), IN("#ch-rq", "left", 0.5),
                     *ARROW("ch-a0", 0.9, 0.4), IN("#ch-h1", "up", w("xác thực")), *ARROW("ch-a1", w("xác thực") + 0.6, 0.4),
                     IN("#ch-h2", "up", w("giới hạn")), *ARROW("ch-a2", w("giới hạn") + 0.9, 0.4), IN("#ch-h3", "up", w("kiểm tra")),
                     *ARROW("ch-a3", w("Qua được") - 0.3, 0.4), IN("#ch-ok", "pop", w("hai trăm"))]),
        B("Handler trả về kết quả thì chuỗi dừng, trả về rỗng thì cho qua. Chạy thật: không có token ra bốn trăm linh một. Năm trăm lần mỗi phút ra bốn trăm hai mươi chín. Body rỗng ra bốn trăm.",
          "Chạy thật: 401 no token, 429 too many requests, 400 empty body.",
          lambda w: [IN("#ch-code", "up", 0.3, 0.7), IN("#ch-note", "right", w("Handler trả") + 0.2), PULSE("#ch-code", w("Handler trả")),
                     IN("#ch-e1", "up", w("không có token")), *ARROW("ch-d1", w("không có token") - 0.4, 0.3),
                     IN("#ch-e2", "up", w("Năm trăm")), *ARROW("ch-d2", w("Năm trăm") - 0.4, 0.3),
                     IN("#ch-e3", "up", w("Body rỗng")), *ARROW("ch-d3", w("Body rỗng") - 0.4, 0.3)]),
        B("Thêm một bước kiểm tra chỉ là thêm một handler vào danh sách, không handler nào phải sửa. Filter của Servlet và Spring Security chính là pattern này.",
          "Thêm bước = thêm một handler. Gặp: Servlet Filter, Spring Security.",
          lambda w: [OUT("#ch-note", "blur", 0, 0.4), IN("#ch-add", "right", 0.5), IN("#ch-seen", "right", w("Filter của"))]),
        B("Nhưng thứ tự quyết định kết quả. Xác thực trước, rồi giới hạn tốc độ, rồi mới kiểm tra dữ liệu.",
          "Thứ tự handler quyết định kết quả.",
          lambda w: [DIM(S("ch-eye", "ch-q", "ch-rq", "ch-h1", "ch-h2", "ch-h3", "ch-ok", "ch-e1", "ch-e2", "ch-e3", "ch-code", "ch-add", "ch-seen")
                         + ", " + AR("ch-a0", "ch-a1", "ch-a2", "ch-a3", "ch-d1", "ch-d2", "ch-d3"), 0, 0.07),
                     TYPE("#ch-t1", 0.4, 0.04), IN("#ch-t2", "blur", w("rồi mới"))]),
    ]),
    # ------------------------------------------------------------ iterator
    dict(id="iterator", world=(1920, 1080), hud="", cam="".join([
        head("it", "Pattern 2 · Iterator", "Duyệt mà không lộ cấu trúc bên trong"),
        tag("it-fe", 110, 280, 360, 130, "for-each", "amber", 36),
        titled("it-ia", 620, 270, 500, 150, "«interface»", "Iterable", "iterator()", "violet", 44),
        titled("it-ib", 1270, 270, 540, 150, "«interface»", "Iterator", "hasNext() · next()", "violet", 44),
        titled("it-rg", 620, 520, 500, 130, "", "Range", "implements Iterable", "cyan", 44),
        cbox("it-code", 110, 710, 940, "Dùng.java",
             "for (int i : new Range(1, 5))\n"
             "    sum += i;", "violet", 34),
        tag("it-sum", 1130, 750, 680, 100, "sum 1..4 = 10", "green", 38),
        bigerr("it-e1", 110, 290, 1700, "✕ list.remove() trong for-each:<br>ConcurrentModificationException", 44),
        note("it-e2", 110, 520, 1700, "Xoá phần tử gần cuối (xoá 2 trong [1, 2, 3]) lại không báo lỗi:\nlỗi lúc có lúc không", "cyan", 36),
        tag("it-g", 110, 540, 1700, 110, "✓ iterator.remove(): [1, 2, 3, 4] → [1, 3, 4]", "green", 40),
        take("it", "Nơi dùng chỉ biết Iterable", "xoá khi duyệt: iterator.remove()"),
        wires(arrow("it-a1", [(470, 345), (620, 345)], "amber"), arrow("it-a2", [(1120, 345), (1270, 345)], "muted"),
              arrow("it-a3", [(870, 520), (870, 420)], "violet", True)),
    ]), beats=[
        B("Iterator cho phép duyệt các phần tử của một tập hợp mà không cần biết nó là mảng, danh sách liên kết hay cây.",
          "Duyệt phần tử mà không cần biết cấu trúc bên trong.",
          lambda w: [IN("#it-eye", "blur"), TYPE("#it-q", 0.2, 0.05)]),
        B("Trong Java, đó là Iterable và Iterator. Vòng lặp duyệt gọi iterator của Iterable, rồi hỏi còn phần tử nào không, và lấy phần tử kế tiếp.",
          "for-each gọi iterator(), rồi hasNext() và next().",
          lambda w: [*shrink("it", 0), IN("#it-fe", "left", 0.5), IN("#it-ia", "up", w("Iterable")), *ARROW("it-a1", w("Iterable") + 0.5, 0.4),
                     IN("#it-ib", "up", w("rồi hỏi") - 0.5), *ARROW("it-a2", w("rồi hỏi") - 0.8, 0.4)]),
        B("Class Range implements Iterable, nên dùng được for-each. Chạy thật: cộng từ một đến bốn ra mười. Đổi cấu trúc dữ liệu thì chỉ viết lại iterator, nơi dùng không đổi.",
          "Range implements Iterable. Chạy thật: sum 1..4 = 10.",
          lambda w: [IN("#it-rg", "up", 0.4), *ARROW("it-a3", 1.0, 0.4), IN("#it-code", "up", w("Chạy thật") - 0.3, 0.7),
                     IN("#it-sum", "up", w("ra mười")), PULSE("#it-rg", w("Đổi cấu trúc"))]),
        B("Cẩn thận khi xoá. Gọi list remove giữa lúc for-each thì ném Concurrent Modification Exception. Riêng xoá phần tử gần cuối lại không báo lỗi, nên lỗi lúc có lúc không.",
          "list.remove() trong for-each: ConcurrentModificationException.",
          lambda w: [OUT(S("it-fe", "it-ia", "it-ib", "it-rg", "it-code", "it-sum") + ", " + AR("it-a1", "it-a2", "it-a3"), "blur", 0, 0.5),
                     IN("#it-e1", "up", 0.7), SHAKE("#it-e1", 1.4), IN("#it-e2", "up", w("Riêng xoá"))]),
        B("Muốn xoá lúc duyệt thì dùng iterator remove. Chạy thật: xoá số hai khỏi một, hai, ba, bốn, còn một, ba, bốn.",
          "iterator.remove(): [1, 2, 3, 4] → [1, 3, 4].",
          lambda w: [OUT("#it-e2", "blur", 0, 0.4), IN("#it-g", "up", 0.7), PULSE("#it-g", w("Chạy thật"))]),
        B("Nơi dùng chỉ biết Iterable, còn xoá khi duyệt thì luôn dùng iterator remove.",
          "Nơi dùng chỉ biết Iterable.",
          lambda w: [OUT(S("it-e1", "it-g"), "blur", 0, 0.4), DIM(S("it-eye", "it-q"), 0, 0.07), TYPE("#it-t1", 0.4, 0.04), IN("#it-t2", "blur", w("còn xoá"))]),
    ]),
    # ------------------------------------------------------------ mediator
    dict(id="mediator", world=(1920, 1080), hud="", cam="".join([
        head("md", "Pattern 3 · Mediator", "Một người điều phối, không nói chuyện chéo"),
        tag("md-an", 440, 260, 220, 90, "an", "amber", 34), tag("md-bi", 130, 520, 220, 90, "binh", "amber", 34),
        tag("md-ch", 700, 520, 220, 90, "chi", "amber", 34),
        tag("md-c1", 130, 670, 790, 90, "N × (N − 1) = 6 liên kết", "red", 34),
        tag("md-m1", 1050, 260, 180, 90, "an", "cyan", 34), tag("md-m2", 1370, 260, 180, 90, "binh", "cyan", 34),
        tag("md-m3", 1690, 260, 180, 90, "chi", "cyan", 34),
        titled("md-room", 1260, 520, 340, 110, "mediator", "ChatRoom", "", "violet", 38),
        tag("md-c2", 1020, 670, 810, 90, "N = 3 liên kết", "green", 34),
        cbox("md-code", 90, 280, 860, "Chat.java",
             "room.join(\"an\");\n"
             "room.join(\"binh\");\n"
             "room.send(\"an\", \"hi all\");", "violet", 30),
        tag("md-out", 90, 560, 900, 100, "{an=[], binh=[an: hi all], chi=[an: hi all]}", "green", 26),
        note("md-nx", 90, 700, 880, "Người gửi không nhận lại.\nThêm thành viên: chỉ cần room.join", "cyan", 32),
        take("md", "Mediator chỉ điều phối", "hai chiều và có logic điều phối, khác Observer"),
        wires(arrow("md-l1", [(500, 350), (270, 520)], "amber"), arrow("md-l2", [(300, 520), (540, 350)], "amber"),
              arrow("md-l3", [(620, 350), (790, 520)], "amber"), arrow("md-l4", [(840, 520), (650, 350)], "amber"),
              arrow("md-l5", [(350, 550), (700, 550)], "amber"), arrow("md-l6", [(700, 585), (350, 585)], "amber"),
              arrow("md-r1", [(1140, 350), (1330, 520)], "violet"), arrow("md-r2", [(1460, 350), (1430, 520)], "violet"),
              arrow("md-r3", [(1780, 350), (1530, 520)], "violet")),
    ]), beats=[
        B("Mediator giải quyết chuyện các object nói chuyện chéo với nhau. Nó gom việc giao tiếp vào một object trung gian, để chúng không phải biết nhau.",
          "Gom giao tiếp vào một object trung gian.",
          lambda w: [IN("#md-eye", "blur"), TYPE("#md-q", 0.2, 0.05)]),
        B("Nếu ba người chat nói chuyện chéo, mỗi người giữ tham chiếu tới hai người còn lại. N object thì cần N nhân N trừ một liên kết, ở đây là sáu.",
          "Chéo: N × (N − 1) = 6 liên kết.",
          lambda w: [*shrink("md", 0), IN("#md-an", "up", 0.5), IN("#md-bi", "up", 0.7), IN("#md-ch", "up", 0.9),
                     *ARROW("md-l1", w("mỗi người") - 0.3, 0.3), *ARROW("md-l2", w("mỗi người") + 0.1, 0.3),
                     *ARROW("md-l3", w("mỗi người") + 0.5, 0.3), *ARROW("md-l4", w("mỗi người") + 0.9, 0.3),
                     *ARROW("md-l5", w("mỗi người") + 1.3, 0.3), *ARROW("md-l6", w("mỗi người") + 1.7, 0.3),
                     IN("#md-c1", "up", w("ở đây"))]),
        B("Qua mediator thì mỗi người chỉ biết phòng chat. Chỉ còn N liên kết, ở đây là ba.",
          "Qua mediator: chỉ còn N = 3 liên kết.",
          lambda w: [IN("#md-m1", "up", 0.4), IN("#md-m2", "up", 0.6), IN("#md-m3", "up", 0.8), IN("#md-room", "up", w("phòng chat") - 0.3),
                     *ARROW("md-r1", w("phòng chat"), 0.3), *ARROW("md-r2", w("phòng chat") + 0.3, 0.3), *ARROW("md-r3", w("phòng chat") + 0.6, 0.3),
                     IN("#md-c2", "up", w("Chỉ còn"))]),
        B("Chạy thật: ba người vào phòng, rồi An gửi hi all. Bình và Chi đều nhận được, còn người gửi không nhận lại. Thêm thành viên mới chỉ cần room join, thành viên cũ không đổi.",
          "Chạy thật: người gửi không nhận lại.",
          lambda w: [OUT(S("md-an", "md-bi", "md-ch", "md-c1") + ", " + AR("md-l1", "md-l2", "md-l3", "md-l4", "md-l5", "md-l6"), "blur", 0, 0.5),
                     IN("#md-code", "up", 0.7), IN("#md-out", "up", w("Bình và Chi")), PULSE("#md-room", w("Bình và Chi")),
                     IN("#md-nx", "up", w("Thêm thành viên"))]),
        B("Nhưng đừng dồn mọi logic vào mediator, kẻo nó thành class khổng lồ. Khác Observer: Observer một chiều, một tới nhiều. Mediator hai chiều và có logic điều phối.",
          "Đừng thành God class. Mediator hai chiều, Observer một chiều.",
          lambda w: [DIM(S("md-eye", "md-q", "md-m1", "md-m2", "md-m3", "md-room", "md-c2", "md-code", "md-out", "md-nx") + ", " + AR("md-r1", "md-r2", "md-r3"), 0, 0.07),
                     TYPE("#md-t1", 0.4, 0.04), IN("#md-t2", "blur", w("Khác Observer"))]),
    ]),
    # ------------------------------------------------------------ memento
    dict(id="memento", world=(1920, 1080), hud="", cam="".join([
        head("mm", "Pattern 4 · Memento", "Chụp trạng thái để khôi phục"),
        cbox("mm-code", 90, 270, 1030, "Editor.java",
             "record Snapshot(String text) {}\n"
             "Snapshot save() { return new Snapshot(text); }\n"
             "void restore(Snapshot s) { text = s.text(); }", "violet", 30),
        titled("mm-snap", 1180, 280, 630, 200, "record · bất biến", "Snapshot", "text", "cyan", 46),
        titled("mm-s1", 90, 560, 360, 150, "", "Hello", "gõ chữ", "amber", 40),
        titled("mm-s2", 530, 560, 360, 150, "", "save()", "chụp Snapshot", "cyan", 40),
        titled("mm-s3", 970, 560, 360, 150, "", "Hello world", "gõ thêm world", "amber", 38),
        titled("mm-s4", 1410, 560, 360, 150, "", "restore()", "về lại Hello", "green", 40),
        tag("mm-bad", 90, 780, 860, 110, "Mỗi snapshot là một bản sao, tốn bộ nhớ", "amber", 28),
        tag("mm-fix", 990, 780, 820, 110, "✓ giới hạn số bản, hoặc lưu delta", "green", 30),
        take("mm", "Chụp trạng thái, không lộ field", "hay đi cùng Command để làm undo"),
        wires(arrow("mm-a1", [(450, 635), (530, 635)], "muted"), arrow("mm-a2", [(890, 635), (970, 635)], "muted"),
              arrow("mm-a3", [(1330, 635), (1410, 635)], "green")),
    ]), beats=[
        B("Memento làm undo theo cách khác Command. Thay vì đảo thao tác, nó chụp lại trạng thái.",
          "Memento: undo bằng cách chụp lại trạng thái.",
          lambda w: [IN("#mm-eye", "blur"), TYPE("#mm-q", 0.2, 0.05)]),
        B("Trạng thái được chụp vào một object bất biến, ở đây là record Snapshot. Chỉ chính Editor biết cách lưu bằng save, và khôi phục bằng restore, nên không phá đóng gói.",
          "Snapshot bất biến; chỉ Editor biết save() và restore().",
          lambda w: [*shrink("mm", 0), IN("#mm-code", "blur", 0.5, 0.7), IN("#mm-snap", "right", w("object bất biến")),
                     PULSE("#mm-code", w("save")), PULSE("#mm-code", w("khôi phục"))]),
        B("Chạy thật: gõ Hello, rồi lưu. Gõ thêm world, ra Hello world. Restore đưa về lại Hello.",
          "Chạy thật: Hello → Hello world → restore → Hello.",
          lambda w: [IN("#mm-s1", "up", 0.4), *ARROW("mm-a1", w("rồi lưu") - 0.4, 0.3), IN("#mm-s2", "up", w("rồi lưu")),
                     *ARROW("mm-a2", w("Gõ thêm") - 0.4, 0.3), IN("#mm-s3", "up", w("Gõ thêm")),
                     *ARROW("mm-a3", w("Restore") - 0.4, 0.3), IN("#mm-s4", "pop", w("Restore"))]),
        B("Bất biến để snapshot không bị sửa lén. Còn cái bẫy: mỗi snapshot là một bản sao. Chụp sau mỗi phím gõ cho văn bản một megabyte sẽ ngốn bộ nhớ, nên hãy giới hạn số bản, hoặc chỉ lưu phần thay đổi.",
          "Bẫy: mỗi snapshot là một bản sao.",
          lambda w: [IN("#mm-bad", "up", w("Còn cái bẫy")), SHAKE("#mm-bad", w("Chụp sau")), IN("#mm-fix", "up", w("nên hãy giới hạn"))]),
        B("Memento hay đi cùng Command để làm undo, và rollback của transaction cũng cùng ý tưởng quay về trạng thái trước.",
          "Memento + Command = undo.",
          lambda w: [DIM(S("mm-eye", "mm-q", "mm-code", "mm-snap", "mm-s1", "mm-s2", "mm-s3", "mm-s4", "mm-bad", "mm-fix") + ", " + AR("mm-a1", "mm-a2", "mm-a3"), 0, 0.07),
                     TYPE("#mm-t1", 0.4, 0.04), IN("#mm-t2", "blur", w("và rollback"))]),
    ]),
    # ------------------------------------------------------------ visitor
    dict(id="visitor", world=(1920, 1080), hud="", cam="".join([
        head("vs", "Pattern 5 · Visitor", "Thêm thao tác mà không sửa class"),
        titled("vs-sh", 110, 270, 560, 150, "«interface»", "Shape", "accept(v)", "violet", 42),
        titled("vs-ci", 110, 490, 260, 100, "", "Circle", "", "cyan", 36), titled("vs-re", 410, 490, 260, 100, "", "Rect", "", "cyan", 36),
        titled("vs-vi", 1100, 270, 710, 150, "«interface»", "Visitor", "visitCircle · visitRect", "violet", 42),
        titled("vs-ar", 1100, 490, 330, 100, "", "AreaVisitor", "", "cyan", 34), titled("vs-js", 1480, 490, 330, 100, "", "JsonVisitor", "mới", "green", 34),
        tag("vs-r1", 1100, 610, 330, 70, "ra 9.14", "green", 30), tag("vs-r2", 1480, 610, 330, 70, '{"circle":1.0}', "green", 24),
        titled("vs-s1", 90, 740, 380, 150, "gọi", "shape.accept(v)", "", "amber", 30),
        titled("vs-s2", 540, 740, 380, 150, "lần 1 · kiểu shape", "Circle.accept", "", "cyan", 32),
        titled("vs-s3", 990, 740, 380, 150, "gọi lại", "v.visitCircle(this)", "", "violet", 28),
        titled("vs-s4", 1440, 740, 380, 150, "lần 2 · kiểu visitor", "AreaVisitor", "", "green", 32),
        take("vs", "Cấu trúc ổn định, thao tác hay thêm", "thêm loại hình mới thì phải sửa mọi visitor"),
        wires(arrow("vs-b1", [(240, 490), (240, 420)], "violet", True), arrow("vs-b2", [(540, 490), (540, 420)], "violet", True),
              arrow("vs-b3", [(1265, 490), (1265, 420)], "violet", True), arrow("vs-b4", [(1645, 490), (1645, 420)], "violet", True),
              arrow("vs-a0", [(670, 345), (1100, 345)], "amber"),
              arrow("vs-d1", [(470, 815), (540, 815)], "muted"), arrow("vs-d2", [(920, 815), (990, 815)], "muted"),
              arrow("vs-d3", [(1370, 815), (1440, 815)], "green")),
    ]), beats=[
        B("Visitor trả lời câu hỏi mà bài Composite để lại: cây object dễ thêm loại node, nhưng khó thêm thao tác.",
          "Cây object: dễ thêm loại node, khó thêm thao tác.",
          lambda w: [IN("#vs-eye", "blur"), TYPE("#vs-q", 0.2, 0.05)]),
        B("Visitor tách thao tác khỏi cấu trúc. Mỗi class hình chỉ có một method accept, viết một lần. Mỗi thao tác mới là một class visitor, có một method cho mỗi loại hình.",
          "Mỗi class hình: một accept(). Mỗi thao tác: một visitor.",
          lambda w: [*shrink("vs", 0), IN("#vs-sh", "up", 0.5), IN("#vs-ci", "up", 0.8), *ARROW("vs-b1", 1.0, 0.3), IN("#vs-re", "up", 1.1), *ARROW("vs-b2", 1.3, 0.3),
                     IN("#vs-vi", "up", w("Mỗi thao tác")), IN("#vs-ar", "up", w("Mỗi thao tác") + 0.6), *ARROW("vs-b3", w("Mỗi thao tác") + 0.9, 0.3)]),
        B("Chạy thật với hình tròn bán kính một và hình chữ nhật hai nhân ba: Area Visitor ra tổng diện tích chín phẩy mười bốn. Thêm một Json Visitor nữa thì xuất ra JSON, mà các class hình không đổi.",
          "AreaVisitor: 9.14. Thêm JsonVisitor, class hình không đổi.",
          lambda w: [IN("#vs-r1", "up", w("ra tổng")), IN("#vs-js", "up", w("Thêm một")), *ARROW("vs-b4", w("Thêm một") + 0.6, 0.3), IN("#vs-r2", "up", w("xuất ra"))]),
        B("Cơ chế gọi là double dispatch, chọn method hai lần. Lần một, Java chọn accept theo kiểu thật của hình. Lần hai, accept gọi visit Circle, và Java chọn theo kiểu thật của visitor. Không cần instanceof.",
          "Double dispatch: chọn method hai lần, không cần instanceof.",
          lambda w: [OUT(S("vs-r1", "vs-r2"), "blur", 0, 0.4), *ARROW("vs-a0", 0.5, 0.5),
                     IN("#vs-s1", "up", 0.5), *ARROW("vs-d1", w("Lần một") - 0.4, 0.3), IN("#vs-s2", "up", w("Lần một")),
                     *ARROW("vs-d2", w("Lần hai") - 0.5, 0.3), IN("#vs-s3", "up", w("Lần hai") - 0.2),
                     *ARROW("vs-d3", w("và Java chọn") - 0.4, 0.3), IN("#vs-s4", "pop", w("và Java chọn"))]),
        B("Vì vậy Visitor dễ thêm thao tác, nhưng khó thêm loại hình. Hãy dùng khi cấu trúc ổn định còn thao tác thì hay thêm.",
          "Dễ thêm thao tác, khó thêm loại hình.",
          lambda w: [DIM(S("vs-eye", "vs-q", "vs-sh", "vs-ci", "vs-re", "vs-vi", "vs-ar", "vs-js", "vs-s1", "vs-s2", "vs-s3", "vs-s4")
                         + ", " + AR("vs-b1", "vs-b2", "vs-b3", "vs-b4", "vs-a0", "vs-d1", "vs-d2", "vs-d3"), 0, 0.07),
                     TYPE("#vs-t1", 0.4, 0.04), IN("#vs-t2", "blur", w("Hãy dùng"))]),
    ]),
    # ------------------------------------------------------------ visitor sealed
    dict(id="visitor-sealed", world=(1920, 1080), hud="", cam="".join([
        head("vz", "Pattern 5 · Visitor trong Java 21", "sealed + switch thay cho accept"),
        panel("vz-p1", 110, 270, 800, 220, "Visitor cổ điển", ["accept() trong mọi class hình", "và một interface Visitor"], "amber"),
        panel("vz-p2", 1010, 270, 800, 220, "sealed + switch", ["không cần accept()", "không cần interface Visitor"], "green"),
        cbox("vz-code", 110, 560, 1000, "Area.java",
             "sealed interface Shape permits Circle, Rect {}\n"
             "double area(Shape s) { return switch (s) {\n"
             "  case Circle c -> Math.PI * c.r() * c.r();\n"
             "  case Rect r   -> r.w() * r.h();\n"
             "}; }", "violet", 30),
        tag("vz-ok", 1160, 580, 650, 110, "9.14, như AreaVisitor", "green", 32),
        bigerr("vz-err", 1160, 740, 650, "✕ Thêm Triangle mà quên nhánh:<br>lỗi biên dịch", 32),
        take("vz", "Compiler kiểm tra đủ trường hợp", "cần sửa được class hình để thêm sealed"),
    ]), beats=[
        B("Java 21 cho cách ngắn hơn. Visitor cổ điển cần accept trong mọi class hình, và một interface visitor.",
          "Java 21: cách ngắn hơn Visitor cổ điển.",
          lambda w: [IN("#vz-eye", "blur"), TYPE("#vz-q", 0.2, 0.05), *shrink("vz", 2.0), IN("#vz-p1", "up", w("Visitor cổ điển") + 0.3)]),
        B("Nếu khai báo kiểu Shape là kín, compiler biết đúng những loại hình nào thuộc về nó. Mỗi thao tác mới chỉ là một hàm switch theo kiểu.",
          "sealed: compiler biết đủ các loại hình.",
          lambda w: [IN("#vz-p2", "up", 0.3), IN("#vz-code", "blur", w("Mỗi thao tác") - 0.5, 0.7), PULSE("#vz-code", w("Mỗi thao tác"))]),
        B("Chạy thật với hình tròn và hình chữ nhật cũ: ra chín phẩy mười bốn, cùng kết quả với Area Visitor.",
          "Chạy thật: 9.14, cùng kết quả AreaVisitor.",
          lambda w: [IN("#vz-ok", "up", w("ra chín")), PULSE("#vz-code", w("ra chín"))]),
        B("Thêm hình Triangle mà quên nhánh trong switch thì compiler báo lỗi ngay, nên không bị sót.",
          "Thiếu nhánh trong switch: lỗi biên dịch.",
          lambda w: [IN("#vz-err", "up", 0.5), SHAKE("#vz-err", 1.2)]),
        B("Cách này vẫn cần sửa được class hình để khai báo kín. Với class thư viện thì dùng switch với instanceof pattern, chịu mất phần compiler kiểm tra đủ.",
          "Class thư viện: instanceof pattern, mất kiểm tra đủ.",
          lambda w: [DIM(S("vz-eye", "vz-q", "vz-p1", "vz-p2", "vz-code", "vz-ok", "vz-err"), 0, 0.07), TYPE("#vz-t1", 0.4, 0.04), IN("#vz-t2", "blur", w("Với class"))]),
    ]),
    # ------------------------------------------------------------ interpreter
    dict(id="interpreter", world=(1920, 1080), hud="", cam="".join([
        head("ip", "Pattern 6 · Interpreter", "Ngữ pháp thành cây object"),
        tag("ip-ex", 90, 280, 300, 90, "(2 + 3) * 4", "amber", 36),
        tag("ip-mu", 800, 270, 320, 90, "Mul", "violet", 38), tag("ip-ad", 520, 440, 320, 90, "Add", "violet", 38),
        tag("ip-n4", 1080, 440, 200, 90, "Num(4)", "cyan", 32),
        tag("ip-n2", 380, 610, 200, 90, "Num(2)", "cyan", 32), tag("ip-n3", 680, 610, 200, 90, "Num(3)", "cyan", 32),
        tag("ip-v1", 860, 445, 150, 80, "= 5", "green", 34), tag("ip-v2", 1150, 275, 170, 80, "= 20", "green", 34),
        cbox("ip-code", 90, 760, 1150, "Main.java",
             "new Mul(new Add(new Num(2), new Num(3)), new Num(4)).eval();", "violet", 28),
        tag("ip-res", 1290, 780, 520, 100, "(2 + 3) * 4 = 20", "green", 34),
        tag("ip-p0", 110, 330, 360, 110, "(2+3)*4", "amber", 36), tag("ip-p1", 600, 330, 360, 110, "Parser", "violet", 36),
        tag("ip-p2", 1090, 330, 360, 110, "cây Expr", "cyan", 36), tag("ip-p3", 1580, 330, 240, 110, "eval()", "green", 36),
        note("ip-m1", 600, 470, 400, "Parser: chuỗi thành cây", "cyan", 30),
        note("ip-m2", 1090, 470, 720, "Interpreter: cây tự tính giá trị", "green", 32),
        tag("ip-g1", 110, 620, 480, 100, "Pattern (regex)", "cyan", 32),
        tag("ip-g2", 640, 620, 560, 100, "SpEL: @Value(\"#{...}\")", "cyan", 30),
        tag("ip-g3", 1250, 620, 560, 100, "@PreAuthorize(\"hasRole(...)\")", "cyan", 28),
        take("ip", "Hiếm khi tự viết", "ngữ pháp lớn: dùng ANTLR hay SpEL"),
        wires(arrow("ip-b1", [(960, 360), (700, 440)], "muted"), arrow("ip-b2", [(960, 360), (1180, 440)], "muted"),
              arrow("ip-b3", [(680, 530), (480, 610)], "muted"), arrow("ip-b4", [(680, 530), (780, 610)], "muted"),
              arrow("ip-q0", [(470, 385), (600, 385)], "muted"), arrow("ip-q1", [(960, 385), (1090, 385)], "muted"),
              arrow("ip-q2", [(1450, 385), (1580, 385)], "green")),
    ]), beats=[
        B("Interpreter biểu diễn một ngôn ngữ nhỏ, như luật hay biểu thức, thành cây object, mỗi nút biết tự tính giá trị. Ví dụ: hai cộng ba, rồi nhân bốn.",
          "Biểu thức thành cây object, mỗi nút tự tính.",
          lambda w: [IN("#ip-eye", "blur"), TYPE("#ip-q", 0.2, 0.05), *shrink("ip", w("Ví dụ") - 0.3), IN("#ip-ex", "left", w("Ví dụ") + 0.4)]),
        B("Mỗi quy tắc ngữ pháp là một class. Num trả về chính số của nó, Add cộng hai nút con, Mul nhân hai nút con.",
          "Mỗi quy tắc là một class: Num, Add, Mul.",
          lambda w: [IN("#ip-mu", "up", w("Mul") - 1.8), IN("#ip-ad", "up", w("Add") - 0.3), *ARROW("ip-b1", w("Add") - 0.1, 0.3),
                     IN("#ip-n4", "up", w("Mul nhân") - 0.5), *ARROW("ip-b2", w("Mul nhân") - 0.3, 0.3),
                     IN("#ip-n2", "up", w("Num trả") + 0.2), *ARROW("ip-b3", w("Num trả") + 0.4, 0.3), IN("#ip-n3", "up", w("Num trả") + 0.6), *ARROW("ip-b4", w("Num trả") + 0.8, 0.3)]),
        B("Chạy thật: dựng cây bằng tay rồi gọi eval, hai cộng ba nhân bốn ra hai mươi. Cây dựng một lần, tính nhiều lần. Thêm phép trừ thì chỉ thêm một record Sub, các nút khác không đổi.",
          "Chạy thật: (2 + 3) * 4 = 20. Thêm phép trừ = thêm record Sub.",
          lambda w: [IN("#ip-code", "up", 0.4, 0.7), IN("#ip-v1", "pop", w("hai cộng") + 0.2), IN("#ip-v2", "pop", w("ra hai mươi") - 0.4), IN("#ip-res", "up", w("ra hai mươi")),
                     PULSE("#ip-ad", w("Thêm phép"))]),
        B("Lưu ý: Interpreter không lo việc đọc chuỗi. Cần một parser riêng dựng chuỗi thành cây. Interpreter chỉ là phần cây tự tính giá trị.",
          "Parser dựng cây. Interpreter chỉ là phần cây tự tính.",
          lambda w: [OUT(S("ip-ex", "ip-mu", "ip-ad", "ip-n4", "ip-n2", "ip-n3", "ip-v1", "ip-v2", "ip-code", "ip-res") + ", " + AR("ip-b1", "ip-b2", "ip-b3", "ip-b4"), "blur", 0, 0.5),
                     IN("#ip-p0", "up", 0.7), *ARROW("ip-q0", w("Cần một") - 0.6, 0.3), IN("#ip-p1", "up", w("Cần một")),
                     *ARROW("ip-q1", w("dựng chuỗi") - 0.2, 0.3), IN("#ip-p2", "up", w("dựng chuỗi") + 0.3), IN("#ip-m1", "up", w("dựng chuỗi") + 0.6),
                     *ARROW("ip-q2", w("Interpreter chỉ") - 0.4, 0.3), IN("#ip-p3", "pop", w("Interpreter chỉ")), IN("#ip-m2", "up", w("Interpreter chỉ") + 0.3)]),
        B("Bạn gặp nó trong regex và Spring Expression Language, như trong Value hay Pre Authorize.",
          "Gặp: Pattern (regex), SpEL trong @Value và @PreAuthorize.",
          lambda w: [IN("#ip-g1", "up", w("regex") - 0.8), IN("#ip-g2", "up", w("Spring Expression")), IN("#ip-g3", "up", w("Pre Authorize") - 0.5)]),
        B("Ngữ pháp lớn thì rất nhiều class, nên hãy dùng thư viện như ANTLR hay SpEL, thay vì tự viết.",
          "Ngữ pháp lớn: dùng thư viện, đừng tự viết.",
          lambda w: [DIM(S("ip-eye", "ip-q", "ip-p0", "ip-p1", "ip-p2", "ip-p3", "ip-m1", "ip-m2", "ip-g1", "ip-g2", "ip-g3") + ", " + AR("ip-q0", "ip-q1", "ip-q2"), 0, 0.07),
                     TYPE("#ip-t1", 0.4, 0.04), IN("#ip-t2", "blur", w("nên hãy"))]),
    ]),
    # ------------------------------------------------------------ recap
    dict(id="recap", world=(1920, 1080), hud="", cam="".join([
        el("rc-h", 0, 40, 1920, None, letters("Khi nào dùng, khi nào cẩn thận"), "h1 r", "font-size:80px"),
        el("rc-c1", 410, 160, 700, None, "Dùng khi", "eyebrow r", "text-align:left"),
        el("rc-c2", 1130, 160, 700, None, "Cẩn thận", "eyebrow r", "text-align:left"),
        trow("rc-r0", 250, "Chain", "Nhiều bước, mỗi bước chặn được", "Thứ tự handler quyết định"),
        trow("rc-r1", 360, "Iterator", "Duyệt không lộ cấu trúc", "Xoá trong for-each: lỗi"),
        trow("rc-r2", 470, "Mediator", "Gom giao tiếp chéo một chỗ", "Đừng thành God class"),
        trow("rc-r3", 580, "Memento", "Checkpoint, undo bằng snapshot", "Mỗi bản là một bản sao"),
        trow("rc-r4", 690, "Visitor", "Cấu trúc ổn định, thêm thao tác", "Thêm loại class: sửa mọi visitor"),
        trow("rc-r5", 800, "Interpreter", "Ngữ pháp nhỏ thành cây", "Ngữ pháp lớn: dùng thư viện"),
        *[box(f"rc-d{i}", 110 + (i % 3) * 590, 250 + (i // 3) * 300, 540, 260,
              f'<span style="font-size:30px;color:var(--muted);text-align:center;line-height:1.35">{q}</span><b style="font-size:36px;text-align:center">{a}</b>', "cyan", "card")
          for i, (q, a) in enumerate([("Yêu cầu HTTP qua nhiều bước, mỗi bước có thể chặn", "Chain of Responsibility"),
                                      ("Dùng for-each trên cấu trúc tự viết", "Iterator"),
                                      ("Thêm người vào chat mà không sửa người cũ", "Mediator"),
                                      ("Soạn thảo cần checkpoint để quay về", "Memento"),
                                      ("Cây hình ổn định, hay thêm thao tác mới", "Visitor"),
                                      ("Tính biểu thức bằng cây object", "Interpreter")])],
        take("rc", "Observer: một chiều", "Mediator: hai chiều và có logic điều phối"),
    ]), beats=[
        B("Bảng nhớ: khi nào dùng, và khi nào cẩn thận. Chain dùng khi có nhiều bước, mỗi bước chặn được. Nhưng thứ tự handler quyết định kết quả. Iterator duyệt không lộ cấu trúc, và xoá trong for-each sẽ lỗi.",
          "Chain và Iterator: khi nào dùng, cẩn thận gì.",
          lambda w: [TYPE("#rc-h", 0, 0.05), IN("#rc-c1", "blur", 0.8), IN("#rc-c2", "blur", 0.9),
                     IN("#rc-r0", "right", w("Chain dùng")), IN("#rc-r1", "right", w("Iterator duyệt"))]),
        B("Mediator gom giao tiếp chéo vào một chỗ, nhưng đừng để nó thành class khổng lồ. Memento lưu checkpoint bằng snapshot, mà mỗi bản là một bản sao.",
          "Mediator và Memento.",
          lambda w: [IN("#rc-r2", "right", w("Mediator gom")), IN("#rc-r3", "right", w("Memento lưu"))]),
        B("Visitor hợp với cấu trúc ổn định mà hay thêm thao tác, nhưng thêm loại class thì phải sửa mọi visitor. Interpreter biến ngữ pháp nhỏ thành cây, còn ngữ pháp lớn thì dùng thư viện.",
          "Visitor và Interpreter.",
          lambda w: [IN("#rc-r4", "right", w("Visitor hợp")), IN("#rc-r5", "right", w("Interpreter biến"))]),
        B("Giờ thử nhận ra từng tình huống. Yêu cầu HTTP qua nhiều bước chặn: Chain of Responsibility. Dùng for-each trên cấu trúc tự viết: Iterator. Thêm người vào chat mà không sửa người cũ: Mediator.",
          "Nhận ra tình huống: Chain, Iterator, Mediator.",
          lambda w: [OUT(S("rc-c1", "rc-c2", *[f"rc-r{i}" for i in range(6)]), "blur", 0, 0.5), TO("#rc-h", {"opacity": 0.35}, 0.2, 0.5),
                     IN("#rc-d0", "pop", w("Yêu cầu HTTP")), IN("#rc-d1", "pop", w("Dùng for-each")), IN("#rc-d2", "pop", w("Thêm người"))]),
        B("Soạn thảo cần checkpoint: Memento. Cây hình ổn định mà hay thêm thao tác: Visitor. Tính biểu thức bằng cây object: Interpreter.",
          "Memento, Visitor, Interpreter.",
          lambda w: [IN("#rc-d3", "pop", w("Soạn thảo")), IN("#rc-d4", "pop", w("Cây hình")), IN("#rc-d5", "pop", w("Tính biểu thức"))]),
        B("Và một câu hay bị hỏi nhầm: Observer một chiều, một tới nhiều. Mediator hai chiều và có logic điều phối.",
          "Observer một chiều. Mediator hai chiều.",
          lambda w: [DIM(S("rc-h", *[f"rc-d{i}" for i in range(6)]), 0, 0.07), TYPE("#rc-t1", 0.4, 0.04), IN("#rc-t2", "blur", w("Mediator hai"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Behavioral 2"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 200, 200 + i * 118, 1520, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Chain", "Chuyền qua chuỗi: dừng hoặc cho qua"), ("Iterator", "Duyệt không lộ cấu trúc"),
                                      ("Mediator", "Một người điều phối"), ("Memento", "Snapshot bất biến để khôi phục"),
                                      ("Visitor", "Thêm thao tác, không sửa class"), ("Interpreter", "Ngữ pháp thành cây tự tính")])],
        el("ou-cta", 0, 910, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại, sáu pattern. Chain of Responsibility chuyền yêu cầu qua chuỗi handler, mỗi handler dừng hoặc cho qua. Iterator duyệt mà không lộ cấu trúc, và xoá lúc duyệt thì dùng iterator remove.",
          "Chain và Iterator.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Chain of")), IN("#ou-r1", "right", w("Iterator duyệt"))]),
        B("Mediator đưa giao tiếp chéo vào một điểm trung gian, và chỉ điều phối. Memento lưu trạng thái vào object bất biến để khôi phục, hay đi cùng Command cho undo.",
          "Mediator và Memento.",
          lambda w: [IN("#ou-r2", "right", w("Mediator đưa")), IN("#ou-r3", "right", w("Memento lưu"))]),
        B("Visitor dễ thêm thao tác nhưng khó thêm loại class, và Java hai mươi mốt có kiểu kín kết hợp switch. Interpreter biểu diễn ngữ pháp thành cây như SpEL, ngữ pháp lớn thì dùng thư viện.",
          "Visitor và Interpreter.",
          lambda w: [IN("#ou-r4", "right", w("Visitor dễ")), IN("#ou-r5", "right", w("Interpreter biểu"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2), PULSE("#ou-r0", 0.3)]),
    ]),
]

fit_to_audio(SCENES, __file__)
