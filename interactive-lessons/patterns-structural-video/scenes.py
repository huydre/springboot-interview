"""Structural patterns explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output quoted comes from the lesson (Structural.java run on JDK 21): legacy x1: report; Espresso + Milk + Sugar = 4.5,
Espresso + Milk + Caramel = 5.5; CachingProxy 3 loads -> 2 real calls; admin load(7) -> row-7, binh -> SecurityException "binh cannot call load";
HomeTheater: lights dimmed, projector on, surround sound on; src/ (35) = main/ (30) + pom.xml (5);
Bridge 4 combinations ("vector circle r=5", "pixels square 4"); "hello world hello": 17 positions, 8 Glyph objects.
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



def take(p, main, sub, d=0.4):
    """Takeaway line elements (hidden) and the actions that reveal them."""
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(main), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(sub), "take-sm r"))


def take_in(p, w_phrase, spoken_w):
    return [TYPE(f"#{p}-t1", 0.4, 0.04), IN(f"#{p}-t2", "blur", spoken_w(w_phrase))]


def card(id_, x, y, w, h, title, text, tone="cyan", ts=40, xs=30):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px;text-align:center">{esc(title)}</b>'
               f'<span style="font-size:{xs}px;color:var(--muted);text-align:center;line-height:1.35">{text}</span>', tone, "card")


FAC = "Fa xát"
NAMES = [("Adapter", "đổi giao diện"), ("Decorator", "thêm hành vi"), ("Proxy", "kiểm soát truy cập"), ("Facade", "một cửa vào"),
         ("Composite", "cây, lá và nhóm"), ("Bridge", "tách hai chiều"), ("Flyweight", "dùng chung")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn Java", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Adapter khác Decorator?"), "h1 r", "font-size:112px"),
        *[box(f"hk-c{i}", 77 + i * 255, 400, 235, 300,
              f'<b style="font-size:32px;text-align:center">{n}</b><span style="font-size:26px;color:var(--muted);text-align:center;line-height:1.3">{s}</span>',
              "cyan", "card") for i, (n, s) in enumerate(NAMES)],
        chip("hk-p1", 77, 760, "Bọc một object", "amber"),
        chip("hk-p2", 842, 760, "Gom và cây", "green"),
        chip("hk-p3", 1352, 760, "Hai chiều, dùng chung", "cyan"),
        take("hk", "Giao diện có đổi không?", "Adapter đổi · Decorator và Proxy giữ nguyên"),
    ]), beats=[
        B("Người phỏng vấn hỏi: Adapter khác Decorator ở điểm nào?",
          "Adapter khác Decorator ở điểm nào?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B(f"Nhóm Structural lo việc ghép class và object lại với nhau. Có bảy pattern: Adapter, Decorator, Proxy, {FAC}, Composite, Bridge và Flyweight.",
          "7 pattern Structural: ghép class và object.",
          lambda w: [IN("#hk-c0", "pop", w("Adapter,")), IN("#hk-c1", "pop", w("Decorator,")), IN("#hk-c2", "pop", w("Proxy,")), IN("#hk-c3", "pop", w(FAC)),
                     IN("#hk-c4", "pop", w("Composite")), IN("#hk-c5", "pop", w("Bridge")), IN("#hk-c6", "pop", w("Flyweight"))]),
        B("Ba cái đầu cùng bọc một object. Hai cái tiếp theo gom nhóm và xử lý cây. Hai cái cuối tách hai chiều và dùng chung.",
          "Bọc · gom và cây · hai chiều, dùng chung.",
          lambda w: [IN("#hk-p1", "left", w("Ba cái")), IN("#hk-p2", "up", w("Hai cái tiếp")), IN("#hk-p3", "right", w("Hai cái cuối"))]),
        B("Câu hỏi đầu tiên cần nhớ: giao diện có đổi không? Adapter đổi giao diện, còn Decorator và Proxy giữ nguyên.",
          "Giao diện có đổi không?",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-p1", "hk-p2", "hk-p3", *[f"hk-c{i}" for i in range(7)]), 0, 0.07),
                     TYPE("#hk-t1", 0.4, 0.04), IN("#hk-t2", "blur", w("Adapter đổi"))]),
    ]),
    # ------------------------------------------------------------ adapter
    dict(id="adapter", world=(1920, 1080), hud="", cam="".join([
        head("ad", "Adapter", "Đổi giao diện cũ thành giao diện bạn cần"),
        rule("ad-rule", "Bọc class có giao diện không khớp", "như đầu chuyển phích cắm"),
        titled("ad-cl", 70, 230, 380, 140, "", "Code của bạn", "quen gọi print(doc)", "amber", 34),
        titled("ad-pr", 540, 230, 440, 140, "«interface»", "Printer", "print(doc)", "violet", 44),
        titled("ad-ap", 540, 470, 440, 140, "implements Printer", "PrinterAdapter", "", "cyan", 34),
        titled("ad-lg", 540, 710, 440, 140, "", "LegacyPrinter", "printText(text, copies)", "cyan", 34),
        bigerr("ad-bad", 1040, 240, 800, "✕ legacy.printText(doc, 1) rải khắp code<br>đổi chữ ký là sửa mọi chỗ gọi", 34),
        cbox("ad-code", 1040, 230, 800, "PrinterAdapter.java",
             "class PrinterAdapter implements Printer {\n"
             "  public String print(String doc) {\n"
             "    return legacy.printText(doc, 1);\n"
             "  }\n"
             "}", "violet", 28),
        note("ad-ok", 1040, 590, 800, "Đã chạy: legacy x1: report", "green", 36),
        note("ad-fix", 1040, 690, 800, "Thư viện đổi chữ ký hoặc bị thay:\nchỉ sửa trong adapter", "green", 34),
        tag("ad-j1", 1040, 540, 800, 90, "Arrays.asList: mảng → List", "cyan", 30),
        tag("ad-j2", 1040, 650, 800, 90, "InputStreamReader: byte → ký tự", "cyan", 30),
        tag("ad-j3", 1040, 760, 800, 90, "HandlerAdapter (Spring MVC)", "cyan", 30),
        take("ad", "Adapter đổi giao diện", "Decorator giữ nguyên giao diện và thêm hành vi"),
        wires(arrow("ad-a1", [(450, 300), (530, 300)], "amber"), arrow("ad-a2", [(760, 465), (760, 378)], "violet", True),
              arrow("ad-a3", [(760, 615), (760, 703)], "cyan")),
    ]), beats=[
        B("Adapter đổi một giao diện cũ thành giao diện mà code của bạn cần, giống đầu chuyển phích cắm. Hay dùng với thư viện bên thứ ba mà bạn không sửa được.",
          "Adapter: đổi giao diện không khớp thành giao diện cần.",
          lambda w: [IN("#ad-eye", "blur"), TYPE("#ad-q", 0.2, 0.05), IN("#ad-rule", "up", w("giống đầu") + 0.3)]),
        B("Code của bạn quen gọi Printer, print. Nhưng thư viện cũ lại là Legacy Printer, print Text, kèm số bản in. Gọi thẳng thì API cũ lan khắp code, và đổi chữ ký là phải sửa mọi chỗ.",
          "Gọi thẳng thư viện cũ: sửa mọi chỗ gọi.",
          lambda w: [OUT("#ad-rule", "blur", 0, 0.4), *shrink("ad", 0), IN("#ad-cl", "up", 0.5), IN("#ad-pr", "up", w("Printer,")), *ARROW("ad-a1", w("Printer,") + 0.5, 0.5),
                     IN("#ad-lg", "up", w("Nhưng thư viện")), IN("#ad-bad", "up", w("Gọi thẳng")), SHAKE("#ad-bad", w("đổi chữ ký") + 0.3)]),
        B("Adapter implements Printer, và bên trong gọi print Text với một bản. Chạy thật ra: legacy x một: report.",
          "PrinterAdapter implements Printer. Chạy thật: legacy x1: report.",
          lambda w: [OUT("#ad-bad", "blur", 0, 0.4), IN("#ad-ap", "up", 0.4), *ARROW("ad-a2", w("implements") + 0.2, 0.5), *ARROW("ad-a3", w("bên trong"), 0.5),
                     IN("#ad-code", "right", w("bên trong")), IN("#ad-ok", "up", w("Chạy thật"))]),
        B("Thư viện cũ đổi chữ ký, hay bị thay bằng thư viện mới, thì chỉ sửa trong adapter. Code của bạn chỉ biết Printer.",
          "Chỉ sửa trong adapter. Code chỉ biết Printer.",
          lambda w: [IN("#ad-fix", "up", w("chỉ sửa")), PULSE("#ad-ap", w("chỉ sửa")), PULSE("#ad-pr", w("Code của bạn chỉ"))]),
        B("Trong JDK, Adapter chuyển mảng thành List, và Input Stream Reader đổi byte thành ký tự. Spring M V C cũng có Handler Adapter.",
          "Hay gặp: Arrays.asList, InputStreamReader, HandlerAdapter.",
          lambda w: [OUT("#ad-ok, #ad-fix", "blur", 0, 0.4), IN("#ad-j1", "right", w("chuyển mảng")), IN("#ad-j2", "right", w("Input Stream")), IN("#ad-j3", "right", w("Spring"))]),
        B("Đừng nhầm với Decorator. Adapter đổi giao diện, còn Decorator giữ nguyên giao diện và thêm hành vi.",
          "Adapter đổi giao diện.",
          lambda w: [DIM(S("ad-eye", "ad-q", "ad-cl", "ad-pr", "ad-ap", "ad-lg", "ad-code", "ad-j1", "ad-j2", "ad-j3") + ", " + AR("ad-a1", "ad-a2", "ad-a3"), 0, 0.07),
                     TYPE("#ad-t1", 0.4, 0.04), IN("#ad-t2", "blur", w("còn Decorator"))]),
    ]),
    # ------------------------------------------------------------ decorator
    dict(id="decorator", world=(1920, 1080), hud="", cam="".join([
        head("dc", "Decorator", "Thêm hành vi bằng cách bọc, không kế thừa"),
        rule("dc-rule", "Bọc object cùng giao diện để thêm hành vi", "bọc được nhiều lớp, ghép lúc chạy"),
        tag("dc-k0", 90, 280, 400, 90, "Espresso", "cyan", 30),
        tag("dc-k1", 530, 280, 400, 90, "EspressoMilk", "red", 30),
        tag("dc-k2", 970, 280, 400, 90, "EspressoSugar", "red", 30),
        tag("dc-k3", 1410, 280, 420, 90, "EspressoMilkSugar", "red", 30),
        note("dc-kx", 90, 440, 1700, "✕ mỗi tổ hợp một class: n phụ liệu = 2^n class,\nkế thừa chốt cứng từ lúc compile", "red", 38),
        titled("dc-i", 640, 215, 420, 130, "«interface»", "Coffee", "", "violet", 44),
        titled("dc-s", 110, 430, 420, 140, "bọc Milk", "Sugar", "", "cyan", 40),
        titled("dc-m", 640, 430, 420, 140, "bọc Espresso", "Milk", "", "cyan", 40),
        titled("dc-e", 1170, 430, 420, 140, "", "Espresso", "", "cyan", 40),
        tag("dc-c1", 110, 595, 420, 80, "+ 0.5", "green", 34),
        tag("dc-c2", 640, 595, 420, 80, "+ 1.0", "green", 34),
        tag("dc-c3", 1170, 595, 420, 80, "3.0", "green", 34),
        tag("dc-sum", 1650, 430, 200, 140, "= 4.5", "green", 44),
        cbox("dc-code", 110, 705, 1300, "Main.java",
             "Coffee c = new Sugar(new Milk(new Espresso()));\n"
             "c.cost();   // 4.5", "violet", 34),
        note("dc-car", 110, 715, 1500, "new Caramel(new Milk(new Espresso()))\nEspresso + Milk + Caramel = 5.5", "green", 36),
        tag("dc-j1", 1170, 715, 640, 90, "BufferedReader bọc Reader", "cyan", 30),
        take("dc", "Thứ tự bọc quan trọng", "nén rồi mã hóa thì hợp lý, đảo lại thì nén vô ích"),
        wires(arrow("dc-a1", [(530, 500), (630, 500)], "amber"), arrow("dc-a2", [(1060, 500), (1160, 500)], "amber"),
              arrow("dc-b1", [(320, 425), (650, 330)], "violet", True), arrow("dc-b2", [(850, 425), (850, 350)], "violet", True),
              arrow("dc-b3", [(1380, 425), (1050, 330)], "violet", True)),
    ]), beats=[
        B("Decorator cũng bọc, nhưng giữ nguyên giao diện. Nó bọc object cùng giao diện để thêm hành vi, và bọc được nhiều lớp chồng nhau.",
          "Decorator: bọc cùng giao diện, thêm hành vi.",
          lambda w: [IN("#dc-eye", "blur"), TYPE("#dc-q", 0.2, 0.05), IN("#dc-rule", "up", w("Nó bọc") + 0.3)]),
        B("Ví dụ cà phê Espresso giá ba. Muốn thêm sữa, đường mà dùng kế thừa thì mỗi tổ hợp là một class. Có n phụ liệu là hai mũ n class.",
          "Kế thừa cho mọi tổ hợp: 2^n class.",
          lambda w: [OUT("#dc-rule", "blur", 0, 0.4), *shrink("dc", 0), IN("#dc-k0", "up", 0.5), IN("#dc-k1", "up", w("Muốn thêm")), IN("#dc-k2", "up", w("Muốn thêm") + 0.5),
                     IN("#dc-k3", "up", w("mỗi tổ hợp")), IN("#dc-kx", "up", w("Có n")), SHAKE("#dc-kx", w("Có n") + 0.8)]),
        B("Decorator thì khác. Sugar và Milk cùng implements Coffee, và mỗi lớp giữ một Coffee bên trong.",
          "Sugar, Milk, Espresso cùng implements Coffee.",
          lambda w: [OUT(S("dc-k0", "dc-k1", "dc-k2", "dc-k3", "dc-kx"), "blur", 0, 0.5), IN("#dc-i", "down", 0.7),
                     IN("#dc-s", "up", w("Sugar và")), *ARROW("dc-b1", w("Sugar và") + 0.3, 0.4),
                     IN("#dc-m", "up", w("Milk cùng")), *ARROW("dc-b2", w("cùng implements") - 0.3, 0.4),
                     IN("#dc-e", "up", w("mỗi lớp")), *ARROW("dc-b3", w("mỗi lớp") + 0.2, 0.4),
                     *ARROW("dc-a1", w("giữ một") - 0.2, 0.4), *ARROW("dc-a2", w("giữ một") + 0.4, 0.4)]),
        B("Sugar gọi Milk, Milk gọi Espresso, mỗi lớp cộng phần của mình trên đường về. Ba, cộng một, cộng nửa, ra bốn phẩy năm.",
          "Mỗi lớp cộng phần của mình: 3.0 + 1.0 + 0.5 = 4.5.",
          lambda w: [IN("#dc-code", "up", 0.3), IN("#dc-c3", "up", w("Milk gọi Espresso")), IN("#dc-c2", "up", w("cộng một")), IN("#dc-c1", "up", w("cộng nửa")),
                     IN("#dc-sum", "pop", w("ra bốn")), PULSE("#dc-sum", w("ra bốn") + 0.5)]),
        B("Thêm Caramel chỉ cần một class mới, không class cũ nào đổi. Chạy thật: Espresso, Milk, Caramel ra năm phẩy năm. Trong JDK, Buffered Reader cũng bọc một Reader.",
          "Thêm Caramel = thêm một class. JDK: BufferedReader.",
          lambda w: [OUT("#dc-code", "blur", 0, 0.4), IN("#dc-car", "up", w("Chạy thật") - 0.4), IN("#dc-j1", "right", w("Trong JDK")), PULSE("#dc-sum", w("Chạy thật"))]),
        B("Nhưng thứ tự bọc rất quan trọng. Nén rồi mã hóa thì hợp lý. Mã hóa rồi nén thì nén gần như vô ích, vì dữ liệu mã hóa trông như ngẫu nhiên.",
          "Thứ tự bọc quan trọng.",
          lambda w: [DIM(S("dc-eye", "dc-q", "dc-i", "dc-s", "dc-m", "dc-e", "dc-c1", "dc-c2", "dc-c3", "dc-sum", "dc-car", "dc-j1") + ", " + AR("dc-a1", "dc-a2", "dc-b1", "dc-b2", "dc-b3"), 0, 0.07),
                     TYPE("#dc-t1", 0.5, 0.04), IN("#dc-t2", "blur", w("Nén rồi"))]),
    ]),
    # ------------------------------------------------------------ proxy
    dict(id="proxy", world=(1920, 1080), hud="", cam="".join([
        head("px", "Proxy", "Người đại diện kiểm soát truy cập"),
        rule("px-rule", "Đứng thay object thật, cùng giao diện", "để kiểm soát việc truy cập vào nó"),
        card("px-u1", 85, 290, 400, 300, "Cache", "trả từ cache thay vì gọi thật", "cyan", 42),
        card("px-u2", 515, 290, 400, 300, "Quyền", "kiểm tra quyền trước khi cho gọi", "cyan", 42),
        card("px-u3", 945, 290, 400, 300, "Tải lười", "chỉ tạo object nặng khi cần", "cyan", 42),
        card("px-u4", 1375, 290, 400, 300, "Remote proxy", "gọi sang máy khác", "cyan", 42),
        card("px-d", 110, 270, 780, 420, "Decorator", "thêm tính năng cho object<br>client tự bọc từng lớp<br><span class='mono'>new Sugar(new Milk(...))</span>", "amber", 48, 32),
        card("px-p", 1030, 270, 780, 420, "Proxy", "quản lý quyền truy cập<br>thường do framework tạo ra<br><span class='mono'>@Transactional @Cacheable @Async</span>", "violet", 48, 32),
        titled("px-cl", 80, 280, 300, 130, "", "Client", "", "amber", 40),
        titled("px-pr", 500, 260, 520, 170, "implements Service", "CachingProxy", "có cache bên trong", "violet", 38),
        titled("px-re", 1140, 280, 440, 130, "implements Service", "RealService", "", "cyan", 34),
        tag("px-l1", 110, 540, 520, 90, "load(1) → gọi thật", "cyan", 30),
        tag("px-l2", 700, 540, 520, 90, "load(1) → lấy từ cache", "green", 30),
        tag("px-l3", 1290, 540, 520, 90, "load(2) → gọi thật", "cyan", 30),
        note("px-sum", 110, 690, 1700, "Đã chạy: 3 lần load, nhưng service thật chỉ bị gọi 2 lần", "green", 40),
        bigerr("px-err", 110, 540, 1700, "✕ loadTwice() trong RealService gọi this.load() hai lần: không qua proxy<br>id 5 đã có trong cache, vẫn tốn thêm 2 lần gọi thật", 36),
        take("px", "Proxy chỉ đứng ở cửa vào", "this.method() trong cùng class đi thẳng, bỏ qua proxy"),
        wires(arrow("px-a1", [(380, 345), (490, 345)], "amber"), arrow("px-a2", [(1020, 345), (1130, 345)], "violet")),
    ]), beats=[
        B("Proxy đứng thay object thật, cùng giao diện, để kiểm soát việc truy cập vào object đó.",
          "Proxy: đứng thay object thật, kiểm soát truy cập.",
          lambda w: [IN("#px-eye", "blur"), TYPE("#px-q", 0.2, 0.05), IN("#px-rule", "up", w("Proxy đứng") + 0.3)]),
        B("Dùng để làm cache, trả từ cache thay vì gọi thật. Kiểm tra quyền trước khi cho gọi. Tải lười, chỉ tạo object nặng khi cần. Hoặc remote proxy, gọi sang máy khác.",
          "Cache, quyền, tải lười, remote proxy.",
          lambda w: [OUT("#px-rule", "blur", 0, 0.4), *shrink("px", 0), IN("#px-u1", "up", w("làm cache")), IN("#px-u2", "up", w("Kiểm tra quyền")), IN("#px-u3", "up", w("Tải lười")), IN("#px-u4", "up", w("remote proxy"))]),
        B("Nghe giống Decorator, nhưng khác ở ý định. Decorator thêm tính năng, và client tự bọc từng lớp. Proxy quản lý quyền truy cập, và thường do framework tạo ra, như Spring làm với Transactional, Cacheable và Async.",
          "Decorator thêm tính năng. Proxy kiểm soát truy cập.",
          lambda w: [OUT(S("px-u1", "px-u2", "px-u3", "px-u4"), "blur", 0, 0.5), IN("#px-d", "right", w("Decorator thêm")), IN("#px-p", "left", w("Proxy quản lý")), PULSE("#px-p", w("như Spring"))]),
        B("Ví dụ Caching Proxy. Client gọi load một, load một, load hai. Chạy thật: ba lần load, nhưng service thật chỉ bị gọi hai lần, vì lần thứ hai của id một lấy từ cache.",
          "load(1), load(1), load(2): chỉ 2 lần gọi thật.",
          lambda w: [OUT(S("px-d", "px-p"), "blur", 0, 0.5), IN("#px-cl", "up", 0.7), *ARROW("px-a1", 1.1, 0.4), IN("#px-pr", "up", 1.3), *ARROW("px-a2", 1.8, 0.4), IN("#px-re", "up", 2.0),
                     IN("#px-l1", "up", w("Client gọi") + 1.0), IN("#px-l2", "up", w("load một, load hai") - 0.3), IN("#px-l3", "up", w("load hai") + 0.3), IN("#px-sum", "up", w("Chạy thật")), PULSE("#px-sum", w("chỉ bị gọi") + 0.2)]),
        B("Nhưng có một bẫy. Hàm load Twice trong object thật gọi this load hai lần. This là chính object thật, nên lời gọi đi thẳng, không qua proxy. Dù id đã có trong cache, vẫn tốn thêm hai lần gọi thật.",
          "Bẫy: this.load() bỏ qua proxy (self-invocation).",
          lambda w: [OUT(S("px-l1", "px-l2", "px-l3", "px-sum"), "blur", 0, 0.5), IN("#px-err", "up", w("Hàm load Twice")), SHAKE("#px-err", w("Dù id") + 0.2), PULSE("#px-re", w("This là"))]),
        B("Spring gặp đúng chuyện này: Transactional hay Cacheable trên method được gọi bằng this thì không có tác dụng. Proxy chỉ đứng ở cửa vào.",
          "Proxy chỉ đứng ở cửa vào.",
          lambda w: [OUT("#px-err", "blur", 0, 0.4), DIM(S("px-eye", "px-q", "px-cl", "px-pr", "px-re") + ", " + AR("px-a1", "px-a2"), 0, 0.07),
                     TYPE("#px-t1", 0.5, 0.04), IN("#px-t2", "blur", w("Proxy chỉ đứng"))]),
    ]),
    # ------------------------------------------------------------ proxy-dynamic
    dict(id="proxy-dynamic", world=(1920, 1080), hud="", cam="".join([
        head("pd", "Proxy động", "Một handler cho mọi method"),
        rule("pd-rule", "JDK sinh proxy lúc chạy", "chuyển mọi lời gọi vào một handler duy nhất"),
        card("pd-s", 110, 270, 780, 360, "Proxy tĩnh", "viết tay một class cho mỗi interface<br>thêm method vào Service<br>là phải viết thêm ở từng proxy", "amber", 48, 32),
        card("pd-d", 1030, 270, 780, 360, "Proxy động", "một handler áp dụng cho mọi method<br>method mới thêm vào: handler không đổi", "green", 48, 32),
        cbox("pd-code", 110, 260, 1300, "Proxy.newProxyInstance",
             "Proxy.newProxyInstance(loader, new Class<?>[]{Service.class},\n"
             "  (proxy, m, args) -> {\n"
             "    if (!user.admin()) throw new SecurityException(...);\n"
             "    return m.invoke(real, args);\n"
             "  });", "violet", 30),
        tag("pd-r1", 110, 640, 760, 90, "admin: load(7) → row-7", "green", 32),
        bigerr("pd-r2", 910, 640, 900, "✕ binh: SecurityException: binh cannot call load", 32),
        tag("pd-r3", 110, 760, 760, 90, "Proxy.isProxyClass(...) → true", "cyan", 30),
        tag("pd-j1", 110, 640, 760, 100, "JDK dynamic proxy: cần interface", "cyan", 32),
        tag("pd-j2", 960, 640, 850, 100, "CGLIB: class con của class thật", "violet", 32),
        note("pd-trap", 110, 780, 1700, "Cả hai đều dính bẫy self-invocation", "red", 36),
        take("pd", "Một handler kiểm soát mọi method", "có interface thì JDK proxy, không có thì CGLIB"),
    ]), beats=[
        B("Cách viết proxy thứ hai là proxy động: JDK sinh proxy lúc chạy, và chuyển mọi lời gọi vào một handler duy nhất.",
          "Proxy động: một handler cho mọi method.",
          lambda w: [IN("#pd-eye", "blur"), TYPE("#pd-q", 0.2, 0.05), IN("#pd-rule", "up", w("JDK sinh") + 0.3)]),
        B("Proxy tĩnh phải viết tay một class cho mỗi interface, thêm method vào Service là phải viết thêm ở từng proxy. Proxy động thì handler không đổi.",
          "Tĩnh: một class mỗi interface. Động: một handler.",
          lambda w: [OUT("#pd-rule", "blur", 0, 0.4), *shrink("pd", 0), IN("#pd-s", "right", 0.5), IN("#pd-d", "left", w("Proxy động thì"))]),
        B("Handler là một lambda. Mỗi lần client gọi bất kỳ method nào, lambda chạy. Nếu user không phải admin thì ném lỗi, còn không thì invoke đúng method đó trên object thật.",
          "Handler: kiểm tra quyền, rồi m.invoke(real, args).",
          lambda w: [OUT(S("pd-s", "pd-d"), "blur", 0, 0.5), IN("#pd-code", "up", 0.6), PULSE("#pd-code", w("Nếu user")), PULSE("#pd-code", w("invoke"))]),
        B("Chạy thật: admin gọi load bảy nhận row bảy. User binh nhận Security Exception: binh cannot call load. Và Proxy is Proxy Class cho true.",
          "admin: row-7. binh: SecurityException.",
          lambda w: [IN("#pd-r1", "up", w("admin gọi")), IN("#pd-r2", "up", w("User binh")), SHAKE("#pd-r2", w("User binh") + 1.2), IN("#pd-r3", "up", w("Và Proxy"))]),
        B("Proxy động của JDK chỉ làm được khi có interface. Không có interface thì CGLIB tạo một class con của class thật lúc chạy. Spring dùng cả hai, và cả hai đều dính bẫy self-invocation.",
          "JDK proxy cần interface, không có thì CGLIB.",
          lambda w: [OUT(S("pd-code", "pd-r1", "pd-r2", "pd-r3"), "blur", 0, 0.5), IN("#pd-j1", "up", 0.6), IN("#pd-j2", "up", w("Không có")), IN("#pd-trap", "up", w("Spring dùng"))]),
        B("Tóm lại, một handler duy nhất kiểm soát mọi method của interface.",
          "Một handler kiểm soát mọi method.",
          lambda w: [OUT("#pd-trap", "blur", 0, 0.4), DIM(S("pd-eye", "pd-q", "pd-j1", "pd-j2"), 0, 0.07), TYPE("#pd-t1", 0.4, 0.04), IN("#pd-t2", "blur", 2.0)]),
    ]),
    # ------------------------------------------------------------ facade
    dict(id="facade", world=(1920, 1080), hud="", cam="".join([
        head("fc", FAC if False else "Facade", "Một cửa vào đơn giản cho cả nhóm class"),
        rule("fc-rule", "Giao diện đơn giản che nhiều class con phức tạp", "không thêm chức năng, chỉ gom lại và giấu chi tiết"),
        titled("fc-cl", 90, 420, 360, 140, "", "Code của bạn", "", "amber", 34),
        tag("fc-s1", 1100, 270, 560, 110, "lights.dim()", "cyan", 36),
        tag("fc-s2", 1100, 430, 560, 110, "projector.on()", "cyan", 36),
        tag("fc-s3", 1100, 590, 560, 110, "sound.surround()", "cyan", 36),
        note("fc-bad", 90, 760, 1700, "✕ chỗ nào cũng phải nhớ đúng thứ tự: thêm bước bật máy lạnh là sửa mọi nơi gọi", "red", 36),
        titled("fc-f", 580, 400, 380, 180, "Facade", "HomeTheater", "watchMovie()", "violet", 36),
        note("fc-ok", 90, 760, 1700, "Đã chạy: lights dimmed, projector on, surround sound on", "green", 38),
        tag("fc-g1", 90, 760, 800, 90, "Thêm bước: sửa một chỗ trong HomeTheater", "green", 30),
        tag("fc-g2", 940, 760, 880, 90, "Spring: Service, JdbcTemplate", "cyan", 30),
        take("fc", "Facade chỉ điều phối", "chứa nghiệp vụ thì thành God class, hãy tách theo nhóm"),
        wires(arrow("fc-a1", [(450, 470), (1090, 325)], "amber"), arrow("fc-a2", [(450, 490), (1090, 485)], "amber"), arrow("fc-a3", [(450, 510), (1090, 645)], "amber"),
              arrow("fc-b0", [(450, 490), (570, 490)], "amber"),
              arrow("fc-b1", [(960, 450), (1090, 325)], "violet"), arrow("fc-b2", [(960, 490), (1090, 485)], "violet"), arrow("fc-b3", [(960, 530), (1090, 645)], "violet")),
    ]), beats=[
        B("Ba pattern trước bọc một object. Fa xát đứng trước cả một nhóm class, và đưa ra một giao diện đơn giản che sự phức tạp bên trong.",
          "Facade: một giao diện đơn giản che nhiều class con.",
          lambda w: [IN("#fc-eye", "blur"), TYPE("#fc-q", 0.2, 0.05), IN("#fc-rule", "up", w("Fa xát") + 0.3)]),
        B("Ví dụ xem phim ở rạp tại nhà. Bạn phải làm mờ đèn, bật máy chiếu, bật âm thanh vòm, và nhớ đúng thứ tự. Thêm một bước bật máy lạnh là phải sửa mọi nơi có đoạn gọi này.",
          "Gọi từng hệ thống: nhớ thứ tự, sửa mọi nơi.",
          lambda w: [OUT("#fc-rule", "blur", 0, 0.4), *shrink("fc", 0), IN("#fc-cl", "up", 0.5),
                     IN("#fc-s1", "right", w("làm mờ")), *ARROW("fc-a1", w("làm mờ"), 0.5), IN("#fc-s2", "right", w("bật máy chiếu")), *ARROW("fc-a2", w("bật máy chiếu"), 0.5),
                     IN("#fc-s3", "right", w("bật âm thanh")), *ARROW("fc-a3", w("bật âm thanh"), 0.5), IN("#fc-bad", "up", w("Thêm một bước")), SHAKE("#fc-bad", w("phải sửa") + 0.3)]),
        B("Fa xát Home Theater gom ba bước vào một method, watch Movie. Nơi dùng chỉ gọi một lần. Chạy thật: lights dimmed, projector on, surround sound on.",
          "HomeTheater.watchMovie(): một lần gọi.",
          lambda w: [OUT("#fc-bad", "blur", 0, 0.4), OUT(AR("fc-a1", "fc-a2", "fc-a3"), "blur", 0, 0.4), IN("#fc-f", "up", 0.6), *ARROW("fc-b0", 1.2, 0.4),
                     *ARROW("fc-b1", w("gom ba") + 0.2, 0.4), *ARROW("fc-b2", w("gom ba") + 0.5, 0.4), *ARROW("fc-b3", w("gom ba") + 0.8, 0.4), IN("#fc-ok", "up", w("Chạy thật"))]),
        B("Thêm bước bật máy lạnh thì chỉ sửa một chỗ trong Home Theater. Người mới chỉ cần biết watch Movie. Trong Spring, tầng Service thường là facade cho nhiều repository, và Jdbc Template giấu nhiều bước JDBC.",
          "Sửa một chỗ. Spring: Service, JdbcTemplate.",
          lambda w: [OUT("#fc-ok", "blur", 0, 0.4), IN("#fc-g1", "up", 0.4), IN("#fc-g2", "up", w("Trong Spring"))]),
        B("Nhớ rằng Fa xát chỉ điều phối, không chứa nghiệp vụ. Nếu nó cứ to dần thì thành God class, hãy tách theo nhóm chức năng.",
          "Facade chỉ điều phối, không chứa nghiệp vụ.",
          lambda w: [DIM(S("fc-eye", "fc-q", "fc-cl", "fc-f", "fc-s1", "fc-s2", "fc-s3", "fc-g1", "fc-g2") + ", " + AR("fc-b0", "fc-b1", "fc-b2", "fc-b3"), 0, 0.07),
                     TYPE("#fc-t1", 0.5, 0.04), IN("#fc-t2", "blur", w("Nếu nó"))]),
    ]),
    # ------------------------------------------------------------ composite
    dict(id="composite", world=(1920, 1080), hud="", cam="".join([
        head("cp", "Composite", "Đối xử đồng nhất với một và nhiều"),
        rule("cp-rule", "Xếp object thành cây", "lá và nhóm cùng một giao diện"),
        titled("cp-r", 330, 230, 340, 130, "Folder", "src/", "", "violet", 40),
        titled("cp-m", 90, 460, 380, 150, "Folder", "main/", "35 = 30 + 5", "violet", 40),
        titled("cp-p", 540, 460, 380, 150, "FileNode", "pom.xml", "5", "cyan", 40),
        cbox("cp-bad", 1000, 230, 840, "size(Object n)",
             "int size(Object n) {\n"
             "  if (n instanceof File f) return f.size;\n"
             "  int sum = 0;\n"
             "  for (Object k : ((Folder) n).kids)\n"
             "    sum += size(k);\n"
             "  return sum;\n"
             "}", "violet", 28),
        bigerr("cp-err", 1000, 690, 840, "✕ instanceof ở mọi hàm: thêm Shortcut là sửa mọi hàm", 32),
        cbox("cp-good", 1000, 230, 840, "Node.java",
             "interface Node { int size(); }\n"
             "record FileNode(String name, int size)\n"
             "    implements Node {}\n"
             "class Folder implements Node {\n"
             "  public int size() { return kids.stream()\n"
             "      .mapToInt(Node::size).sum(); }\n"
             "}", "violet", 28),
        note("cp-ok", 1000, 710, 840, "Đã chạy: src/ (35) gồm\nmain/ (30) và pom.xml (5)", "green", 36),
        tag("cp-w1", 90, 700, 830, 90, "dễ thêm loại node mới", "green", 32),
        tag("cp-w2", 90, 810, 830, 90, "khó thêm thao tác mới: sửa mọi class", "red", 32),
        take("cp", "Dễ thêm loại node, khó thêm thao tác", "cần nhiều thao tác mới thì xem Visitor"),
        wires(arrow("cp-a1", [(430, 365), (280, 455)], "violet"), arrow("cp-a2", [(570, 365), (720, 455)], "violet")),
    ]), beats=[
        B("Composite xếp object thành cây, để code dùng một phần tử lẻ và một nhóm theo cùng một giao diện.",
          "Composite: lá và nhóm cùng một giao diện.",
          lambda w: [IN("#cp-eye", "blur"), TYPE("#cp-q", 0.2, 0.05), IN("#cp-rule", "up", w("để code") + 0.3)]),
        B("Facade gom các class ngang hàng. Còn Composite xử lý object lồng nhau nhiều tầng. Ví dụ cây thư mục: src chứa main và pom.xml.",
          "Cây thư mục: src chứa main và pom.xml.",
          lambda w: [OUT("#cp-rule", "blur", 0, 0.4), *shrink("cp", 0), IN("#cp-r", "up", w("Ví dụ")), IN("#cp-m", "up", w("chứa main")), *ARROW("cp-a1", w("chứa main"), 0.4),
                     IN("#cp-p", "up", w("và pom")), *ARROW("cp-a2", w("và pom"), 0.4)]),
        B("Nếu không có giao diện chung, hàm tính dung lượng phải kiểm tra instanceof ở mọi chỗ. Thêm loại Shortcut là phải sửa mọi hàm đó.",
          "Không có giao diện chung: instanceof ở mọi hàm.",
          lambda w: [IN("#cp-bad", "left", 0.4), PULSE("#cp-bad", w("instanceof")), IN("#cp-err", "up", w("Thêm loại")), SHAKE("#cp-err", w("Thêm loại") + 0.7)]),
        B("Với Composite, Node có method size. Folder cộng size của các con, nên gọi root size một lần là xong. Chạy thật: src ba mươi lăm, gồm main ba mươi và pom năm.",
          "root.size() một lần. Chạy thật: src/ = 35.",
          lambda w: [OUT("#cp-bad, #cp-err", "blur", 0, 0.4), IN("#cp-good", "left", 0.5), PULSE("#cp-good", w("Folder cộng")), IN("#cp-ok", "up", w("Chạy thật")), PULSE("#cp-r", w("src ba"))]),
        B("Composite dễ thêm loại node mới, nhưng khó thêm thao tác mới, vì phải sửa mọi class implements Node. Và method add child chỉ có nghĩa với nhóm, nên đặt ở class nhóm.",
          "Dễ thêm loại node, khó thêm thao tác.",
          lambda w: [IN("#cp-w1", "up", w("dễ thêm")), IN("#cp-w2", "up", w("khó thêm"))]),
        B("Hãy dùng Composite cho cây menu, cây component giao diện, sơ đồ tổ chức. Cần nhiều thao tác mới thì xem Visitor.",
          "Cây menu, cây giao diện, sơ đồ tổ chức. Nhiều thao tác: Visitor.",
          lambda w: [OUT("#cp-good, #cp-ok", "blur", 0, 0.4), DIM(S("cp-eye", "cp-q", "cp-r", "cp-m", "cp-p", "cp-w1", "cp-w2") + ", " + AR("cp-a1", "cp-a2"), 0, 0.07),
                     TYPE("#cp-t1", 0.4, 0.04), IN("#cp-t2", "blur", w("Cần nhiều"))]),
    ]),
    # ------------------------------------------------------------ bridge
    dict(id="bridge", world=(1920, 1080), hud="", cam="".join([
        head("br", "Bridge", "Tách hai chiều thay đổi"),
        rule("br-rule", "Hai hệ phân cấp nối bằng composition", "như điều khiển từ xa và tivi"),
        tag("br-k1", 110, 270, 420, 90, "VectorCircle", "red", 32), tag("br-k2", 560, 270, 420, 90, "VectorSquare", "red", 32),
        tag("br-k3", 110, 390, 420, 90, "RasterCircle", "red", 32), tag("br-k4", 560, 390, 420, 90, "RasterSquare", "red", 32),
        note("br-kx", 1050, 270, 780, "✕ 2 hình × 2 cách vẽ = 4 class\nthêm hình Triangle: thêm 2 class\nthêm cách vẽ SVG: thêm theo số hình", "red", 36),
        titled("br-sh", 160, 250, 520, 130, "abstract", "Shape", "giữ một Renderer", "violet", 40),
        titled("br-ci", 80, 520, 270, 110, "", "Circle", "", "cyan", 34),
        titled("br-sq", 400, 520, 270, 110, "", "Square", "", "cyan", 34),
        titled("br-tr", 720, 520, 260, 110, "", "Triangle", "mới", "green", 34),
        titled("br-rn", 1100, 250, 520, 130, "«interface»", "Renderer", "", "violet", 40),
        titled("br-ve", 1030, 520, 260, 110, "", "Vector", "", "cyan", 34),
        titled("br-ra", 1330, 520, 260, 110, "", "Raster", "", "cyan", 34),
        titled("br-sv", 1630, 520, 210, 110, "", "Svg", "mới", "green", 34),
        tag("br-r1", 110, 720, 780, 90, "new Circle(new Vector()).draw()", "cyan", 30),
        tag("br-r2", 960, 720, 850, 90, "→ vector circle r=5", "green", 32),
        note("br-r3", 110, 830, 1700, "Đã chạy cả 4 tổ hợp, ví dụ pixels square 4", "green", 34),
        tag("br-s1", 110, 720, 830, 90, "3 hình + 4 cách vẽ = 7 class", "green", 34),
        tag("br-s2", 990, 720, 820, 90, "thay vì 3 × 4 = 12", "red", 34),
        tag("br-s3", 110, 830, 1700, 80, "JDBC: Connection, Statement tách khỏi driver từng database", "cyan", 30),
        take("br", "Khác ý định, không khác cấu trúc", "Strategy đổi thuật toán · Bridge tách hai hệ phân cấp"),
        wires(arrow("br-a1", [(680, 315), (1090, 315)], "amber"),
              arrow("br-b1", [(215, 515), (330, 385)], "violet", True), arrow("br-b2", [(535, 515), (470, 385)], "violet", True), arrow("br-b3", [(850, 515), (560, 385)], "violet", True),
              arrow("br-c1", [(1160, 515), (1230, 385)], "violet", True), arrow("br-c2", [(1460, 515), (1480, 385)], "violet", True), arrow("br-c3", [(1735, 515), (1560, 385)], "violet", True)),
    ]), beats=[
        B("Bridge dành cho class có hai chiều thay đổi, và tách chúng thành hai hệ phân cấp, nối bằng composition. Giống điều khiển từ xa và tivi: đổi tivi không bắt phải đổi kiểu điều khiển.",
          "Bridge: tách hai chiều thay đổi.",
          lambda w: [IN("#br-eye", "blur"), TYPE("#br-q", 0.2, 0.05), IN("#br-rule", "up", w("Giống điều khiển") + 0.1)]),
        B("Ví dụ hình dạng và cách vẽ. Dùng kế thừa thì hai hình nhân hai cách vẽ là bốn class. Thêm hình Triangle là thêm hai class, thêm cách vẽ SVG là thêm theo số hình.",
          "Một class cho mỗi tổ hợp: 2 × 2 = 4 class.",
          lambda w: [OUT("#br-rule", "blur", 0, 0.4), *shrink("br", 0), IN("#br-k1", "up", 0.5), IN("#br-k2", "up", 0.9), IN("#br-k3", "up", 1.3), IN("#br-k4", "up", 1.7), IN("#br-kx", "up", w("Thêm hình")), SHAKE("#br-kx", w("thêm theo") + 0.4)]),
        B("Với Bridge, Shape giữ một Renderer bên trong. Circle và Square là các hình. Vector và Raster là các cách vẽ.",
          "Shape giữ một Renderer: hai hệ phân cấp độc lập.",
          lambda w: [OUT(S("br-k1", "br-k2", "br-k3", "br-k4", "br-kx"), "blur", 0, 0.5), IN("#br-sh", "up", 0.7), IN("#br-rn", "up", w("giữ một")), *ARROW("br-a1", w("giữ một"), 0.5),
                     IN("#br-ci", "up", w("Circle và")), *ARROW("br-b1", w("Circle và"), 0.4), IN("#br-sq", "up", w("Square")), *ARROW("br-b2", w("Square"), 0.4),
                     IN("#br-ve", "up", w("Vector và")), *ARROW("br-c1", w("Vector và"), 0.4), IN("#br-ra", "up", w("Raster")), *ARROW("br-c2", w("Raster"), 0.4)]),
        B("Thêm hình Triangle chỉ thêm một class. Thêm cách vẽ SVG cũng chỉ thêm một class. Chạy thật cả bốn tổ hợp, ví dụ vector circle r bằng năm và pixels square bốn.",
          "Thêm hình hay cách vẽ: chỉ thêm 1 class.",
          lambda w: [IN("#br-tr", "pop", w("Thêm hình")), *ARROW("br-b3", w("Thêm hình") + 0.4, 0.4), IN("#br-sv", "pop", w("Thêm cách")), *ARROW("br-c3", w("Thêm cách") + 0.4, 0.4),
                     IN("#br-r1", "up", w("Chạy thật")), IN("#br-r2", "up", w("Chạy thật") + 0.7), IN("#br-r3", "up", w("pixels") - 0.6)]),
        B("Số class là tổng chứ không phải tích. Ba hình và bốn cách vẽ là bảy class, thay vì mười hai. JDBC là ví dụ kinh điển: Connection và Statement tách khỏi driver của từng database.",
          "Số class là tổng: 3 + 4 = 7, không phải 12.",
          lambda w: [OUT("#br-r1, #br-r2, #br-r3", "blur", 0, 0.4), IN("#br-s1", "up", w("Ba hình")), IN("#br-s2", "up", w("thay vì")), IN("#br-s3", "up", w("JDBC"))]),
        B("Bridge giống Strategy ở cấu trúc, khác ở ý định. Strategy đổi thuật toán, còn Bridge tách hai hệ phân cấp độc lập. Bridge thiết kế từ đầu để tách, còn Adapter vá lại cái đã có.",
          "Bridge khác Strategy ở ý định.",
          lambda w: [OUT("#br-s1, #br-s2, #br-s3", "blur", 0, 0.4),
                     DIM(S("br-eye", "br-q", "br-sh", "br-rn", "br-ci", "br-sq", "br-tr", "br-ve", "br-ra", "br-sv") + ", " + AR("br-a1", "br-b1", "br-b2", "br-b3", "br-c1", "br-c2", "br-c3"), 0, 0.07),
                     TYPE("#br-t1", 0.4, 0.04), IN("#br-t2", "blur", w("Strategy đổi"))]),
    ]),
    # ------------------------------------------------------------ flyweight
    dict(id="flyweight", world=(1920, 1080), hud="", cam="".join([
        head("fw", "Flyweight", "Dùng chung để tiết kiệm bộ nhớ"),
        rule("fw-rule", "Chia sẻ phần không đổi giữa rất nhiều object", "phần thay đổi (như vị trí) truyền từ bên ngoài"),
        *[tag(f"fw-g{i}", 110 + i * 100, 270, 90, 100, ch, "cyan", 40) for i, ch in enumerate("hello␣world␣hello")],
        note("fw-bad", 110, 410, 1700, "✕ 17 ký tự = 17 object Glyph, kể cả ký tự lặp lại", "red", 40),
        *[tag(f"fw-p{i}", 110 + i * 140, 600, 120, 100, ch, "violet", 40) for i, ch in enumerate("helo␣wrd")],
        note("fw-ok", 110, 760, 1700, "17 vị trí, nhưng chỉ có 8 object Glyph dùng chung", "green", 40),
        cbox("fw-code", 110, 250, 1700, "Flyweight.java",
             "record Glyph(char c, String font) {}      // dùng chung, bất biến\n"
             "record Placed(Glyph glyph, int pos) {}    // vị trí nằm ngoài\n"
             "Glyph get(char c) {\n"
             "  return pool.computeIfAbsent(c, k -> new Glyph(k, \"Arial\"));\n"
             "}", "violet", 32),
        note("fw-sh", 110, 670, 1700, "Chữ h ở vị trí 0 và 12 dùng cùng một Glyph.\nMỗi Placed chỉ giữ một tham chiếu và một số.", "green", 38),
        tag("fw-j1", 110, 600, 800, 100, "valueOf(127) == valueOf(127) → true", "cyan", 30),
        tag("fw-j2", 960, 600, 850, 100, "valueOf(128) == valueOf(128) → false", "cyan", 30),
        tag("fw-j3", 110, 730, 1700, 90, "cache -128 đến 127. String pool cũng là một flyweight", "violet", 30),
        take("fw", "Phần dùng chung phải bất biến", "sửa ở một nơi sẽ đổi mọi nơi đang dùng chung"),
        wires(arrow("fw-w1", [(155, 375), (170, 595)], "violet"), arrow("fw-w2", [(1355, 375), (180, 595)], "violet", True)),
    ]), beats=[
        B("Flyweight chia sẻ phần không đổi giữa rất nhiều object, và truyền phần thay đổi, như vị trí, từ bên ngoài.",
          "Flyweight: dùng chung phần không đổi.",
          lambda w: [IN("#fw-eye", "blur"), TYPE("#fw-q", 0.2, 0.05), IN("#fw-rule", "up", w("Flyweight chia") + 0.3)]),
        B("Văn bản hello world hello có mười bảy ký tự. Nếu mỗi ký tự là một object Glyph, ta tạo mười bảy object, kể cả ký tự lặp lại.",
          "Mỗi ký tự một object: 17 Glyph.",
          lambda w: [OUT("#fw-rule", "blur", 0, 0.4), *shrink("fw", 0), *[IN(f"#fw-g{i}", "pop", 0.5 + i * 0.12, 0.3) for i in range(17)], IN("#fw-bad", "up", w("Nếu mỗi")), SHAKE("#fw-bad", w("kể cả") + 0.3)]),
        B("Với Flyweight, chỉ có tám ký tự khác nhau nên chỉ tạo tám Glyph. Chữ h ở vị trí không và vị trí mười hai dùng cùng một Glyph.",
          "8 ký tự khác nhau: chỉ 8 Glyph.",
          lambda w: [OUT("#fw-bad", "blur", 0, 0.4), *[IN(f"#fw-p{i}", "up", w("chỉ có tám") + i * 0.2, 0.4) for i in range(8)],
                     *ARROW("fw-w1", w("Chữ h"), 0.5), *ARROW("fw-w2", w("vị trí mười hai"), 0.7), IN("#fw-ok", "up", w("dùng cùng") + 0.5)]),
        B("Glyph là record bất biến nên dùng chung an toàn. Vị trí nằm ở Placed. Ta lấy Glyph qua một pool, và compute If Absent chỉ tạo khi chưa có.",
          "Glyph bất biến, dùng chung qua pool.",
          lambda w: [OUT(S(*[f"fw-g{i}" for i in range(17)], *[f"fw-p{i}" for i in range(8)], "fw-ok") + ", " + AR("fw-w1", "fw-w2"), "blur", 0, 0.5), IN("#fw-code", "up", 0.6),
                     PULSE("#fw-code", w("Glyph là")), PULSE("#fw-code", w("Vị trí")), PULSE("#fw-code", w("compute")), IN("#fw-sh", "up", w("Vị trí") + 1.0)]),
        B("Trong JDK, Integer value Of một trăm hai mươi bảy hai lần cho true, còn một trăm hai mươi tám cho false, vì cache chỉ từ âm một trăm hai mươi tám đến một trăm hai mươi bảy. String pool cũng là một flyweight.",
          "Integer cache và String pool.",
          lambda w: [OUT("#fw-code, #fw-sh", "blur", 0, 0.4), IN("#fw-j1", "right", w("một trăm hai mươi bảy hai")), IN("#fw-j2", "left", w("còn một trăm")), IN("#fw-j3", "up", w("vì cache"))]),
        B("Nhớ rằng phần dùng chung phải bất biến. Nếu không, sửa ở một nơi sẽ làm đổi mọi nơi đang dùng chung.",
          "Phần dùng chung phải bất biến.",
          lambda w: [DIM(S("fw-eye", "fw-q", "fw-j1", "fw-j2", "fw-j3"), 0, 0.07), TYPE("#fw-t1", 0.4, 0.04), IN("#fw-t2", "blur", w("Nếu không"))]),
    ]),
    # ------------------------------------------------------------ recap
    dict(id="recap", world=(1920, 1080), hud="", cam="".join([
        el("rc-h", 0, 40, 1920, None, letters("Bảng nhớ Structural"), "h1 r", "font-size:88px"),
        *[box(f"rc-r{i}", 160, 180 + i * 105, 1600, 90, row(n, s), "cyan", "row")
          for i, (n, s) in enumerate([("Adapter", "Đổi giao diện cho khớp"), ("Decorator", "Thêm hành vi bằng cách bọc, cùng giao diện"),
                                      ("Proxy", "Đại diện kiểm soát truy cập"), ("Facade", "Một cửa vào đơn giản"),
                                      ("Composite", "Cây: lá và nhóm cùng giao diện"), ("Bridge", "Tách hai chiều thay đổi"),
                                      ("Flyweight", "Dùng chung phần bất biến")])],
        take("rc", "Đọc dấu hiệu, rồi chọn pattern", "giao diện đổi? cây? hai chiều? dùng chung?"),
    ]), beats=[
        B("Bảng nhớ bảy pattern. Adapter đổi giao diện cho khớp. Decorator thêm hành vi bằng cách bọc, cùng giao diện. Proxy đại diện, kiểm soát truy cập.",
          "Adapter, Decorator, Proxy.",
          lambda w: [TYPE("#rc-h", 0, 0.04), IN("#rc-r0", "right", w("Adapter đổi")), IN("#rc-r1", "right", w("Decorator thêm")), IN("#rc-r2", "right", w("Proxy đại"))]),
        B(f"{FAC} là một cửa vào đơn giản. Composite cho lá và nhóm cùng giao diện. Bridge tách hai chiều thay đổi. Flyweight dùng chung phần bất biến.",
          "Facade, Composite, Bridge, Flyweight.",
          lambda w: [IN("#rc-r3", "right", w(FAC)), IN("#rc-r4", "right", w("Composite cho")), IN("#rc-r5", "right", w("Bridge tách")), IN("#rc-r6", "right", w("Flyweight dùng"))]),
        B("Khi gặp một tình huống, hãy đọc dấu hiệu rồi mới chọn pattern. Giao diện có đổi không, có phải cây không, có hai chiều thay đổi không, hay có thể dùng chung.",
          "Đọc dấu hiệu, rồi chọn pattern.",
          lambda w: [OUT(S(*[f"rc-r{i}" for i in range(7)]), "blur", 0, 0.5), DIM("#rc-h", 0, 0.07), TYPE("#rc-t1", 0.6, 0.04), IN("#rc-t2", "blur", w("Giao diện có đổi"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 80, 1920, None, letters("Tóm tắt Structural"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 160, 260 + i * 150, 1600, 120, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Bọc", "Adapter đổi, Decorator thêm, Proxy kiểm soát"),
                                      ("Gom", f"{'Facade'} một cửa vào, Composite lá và nhóm"),
                                      ("Giảm", "Bridge giảm số class, Flyweight giảm bộ nhớ")])],
        chip("ou-f", 360, 740, "Nhớ: this.method() trong cùng class bỏ qua proxy", "amber"),
        el("ou-cta", 0, 880, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại, nhóm Structural lo việc ghép class và object. Ba pattern bọc: Adapter đổi giao diện, Decorator thêm hành vi, Proxy kiểm soát truy cập.",
          "Bọc: Adapter, Decorator, Proxy.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Ba pattern"))]),
        B(f"{FAC} cho một cửa vào, Composite cho lá và nhóm cùng giao diện. Bridge giảm số class, Flyweight giảm bộ nhớ.",
          "Gom, cây, hai chiều, dùng chung.",
          lambda w: [IN("#ou-r1", "right", w(FAC)), IN("#ou-r2", "right", w("Bridge giảm"))]),
        B("Và nhớ rằng gọi this method trong cùng class sẽ bỏ qua proxy. Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-f", "up", w("Và nhớ")), IN("#ou-cta", "blur", w("Mở bài"))]),
    ]),
]

fit_to_audio(SCENES, __file__)
