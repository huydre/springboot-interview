"""Java runtime explainer: ClassLoader, JIT, AQS, StampedLock, tool choice (1920x1080 world coordinates).

All facts come from web/src/data/lessons/java-runtime.ts (every number was run on JDK 21 on the author's machine):
c1 == c2 is false for two loaders and cast throws ClassCastException; String loader null, java.sql platform, own class app;
work(200000): -Xint about 1350 us every call; with JIT call 1 about 1500 us, call 8 about 170 us; 40 calls per round 55-65 ms vs 6-8 ms, about 9x;
4 threads x 100000 counter++ without lock about 231000, with a Mutex on AQS exactly 400000;
StampedLock: validate false after a write, second writeLock in the same thread refused (not reentrant).
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


def take(p, t1, t2):
    return el(f"{p}-t1", 0, 400, 1920, None, letters(t1), "take r") + el(f"{p}-t2", 0, 540, 1920, None, t2, "take-sm r")


# ---- drill rows (tool choice)
DRILL = [
    ("Đoạn găng ngắn, đơn giản", "synchronized"),
    ("Thử khoá có thời hạn, bị ngắt khi chờ", "ReentrantLock"),
    ("Cache đọc nhiều ghi ít, cần reentrant", "ReadWriteLock"),
    ("Đọc cực nhiều, ngắn, không cần reentrant", "StampedLock"),
    ("Tối đa 10 kết nối đồng thời", "Semaphore"),
]
DY = lambda i: 290 + i * 118
DRILL_HTML = [
    *[box(f"ck-s{i}", 110, DY(i), 1000, 96, f'<span style="font-size:32px">{esc(t)}</span>', "cyan", "card") for i, (t, _) in enumerate(DRILL)],
    *[tag(f"ck-p{i}", 1260, DY(i), 550, 96, p, "green", 34) for i, (_, p) in enumerate(DRILL)],
    wires(*[arrow(f"ck-a{i}", [(1120, DY(i) + 48), (1245, DY(i) + 48)], "green") for i in range(5)]),
]

# ---- JIT bars: scale 0.7 px per microsecond
BX0 = 780
BARS = [("Chỉ thông dịch (-Xint): ~1350 µs", 945, "red"), ("Có JIT, lần 1: ~1500 µs", 1030, "amber"), ("Có JIT, lần 8: ~170 µs", 119, "green")]
BY = lambda i: 300 + i * 120

STAMP_CODE = ("long stamp = lock.tryOptimisticRead();\n"
              "int v = data[0];\n"
              "if (!lock.validate(stamp)) {\n"
              "    stamp = lock.readLock();\n"
              "    try { v = data[0]; }\n"
              "    finally { lock.unlockRead(stamp); }\n"
              "}")
MUTEX_CODE = ("protected boolean tryAcquire(int n) {\n"
              "    return compareAndSetState(0, 1);\n"
              "}\n"
              "protected boolean tryRelease(int n) {\n"
              "    setState(0);\n"
              "    return true;\n"
              "}")

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn Java", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Bên dưới code Java"), "h1 r", "font-size:112px"),
        card4("hk-c", 100, 420, 520, 340, 80, [("tree", "ClassLoader", "class được nạp thế nào"),
                                              ("box", "JIT", "vì sao nhanh dần lên"),
                                              ("lock", "AQS", "lock xây trên cái gì")]),
        el("hk-t1", 0, 400, 1920, None, letters("Cùng tên, khác loader"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "là hai class khác nhau", "take-sm r"),
    ]), beats=[
        B("Bên dưới code Java có ba thứ chạy ngầm mà phỏng vấn hay hỏi.",
          "Ba thứ chạy ngầm bên dưới code Java.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Một: class được nạp thế nào, bằng Class Loader. Hai: vì sao chương trình chạy chậm lúc đầu rồi nhanh dần, nhờ JIT. Ba: lock được xây trên cái gì, đó là AQS, và khi nào dùng StampedLock.",
          "ClassLoader, JIT, AQS và StampedLock.",
          lambda w: [IN("#hk-c0", "pop", w("Một:")), IN("#hk-c1", "pop", w("Hai:")), IN("#hk-c2", "pop", w("Ba:"))]),
        B("Câu mở đầu: hai Class Loader khác nhau cùng nạp class Plugin từ một file. Hai class đó là một hay hai? Là hai, và ép kiểu giữa chúng ném Class Cast Exception. Ta đi từng chặng.",
          "Hai loader, cùng tên Plugin: hai class khác nhau.",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-c0", "hk-c1", "hk-c2"), w("Là hai"), 0.07),
                     TYPE("#hk-t1", w("Là hai") + 0.3, 0.04), IN("#hk-t2", "blur", w("và ép kiểu"))]),
    ]),
    # ------------------------------------------------------------ classloader
    dict(id="classloader", world=(1920, 1080), hud="", cam="".join([
        head("cl", "Chặng 1 · ClassLoader", "Cùng tên chưa chắc cùng class"),
        # tree
        titled("cl-t0", 110, 290, 640, 110, "", "Bootstrap", "", "green", 38),
        titled("cl-t1", 110, 470, 640, 110, "", "Platform", "", "cyan", 38),
        titled("cl-t2", 110, 650, 640, 110, "", "App", "", "violet", 38),
        tag("cl-i0", 840, 290, 970, 110, "lõi JDK như String (loader là null)", "green", 32),
        tag("cl-i1", 840, 470, 970, 110, "các module như java.sql", "cyan", 32),
        tag("cl-i2", 840, 650, 970, 110, "classpath của bạn", "violet", 32),
        note("cl-d", 110, 830, 1700, "Cần một class: hỏi cha trước (parent-first), cha không có mới tự nạp", "cyan", 36),
        wires(arrow("cl-a1", [(430, 650), (430, 582)], "cyan"), arrow("cl-a2", [(430, 470), (430, 402)], "cyan")),
        # identity
        tag("cl-rule", 110, 290, 1700, 120, "Danh tính của class = (tên, loader nạp nó)", "violet", 46),
        tag("cl-l1", 110, 480, 700, 110, "Loader 1 nạp Plugin", "cyan", 34),
        tag("cl-l2", 110, 640, 700, 110, "Loader 2 nạp Plugin", "cyan", 34),
        bigerr("cl-err", 930, 500, 880, "✕ Đã chạy: c1 == c2 là false<br>Ép kiểu giữa hai class: ClassCastException", 36),
        note("cl-cc", 110, 830, 1700, 'Thông báo "X cannot be cast to X": hai loader, hai class cùng tên', "red", 36),
        # Tomcat / context loader
        tag("cl-k1", 110, 290, 1700, 140, "Tomcat: mỗi webapp một loader, tìm WEB-INF/lib trước rồi mới hỏi cha", "amber", 32),
        tag("cl-k2", 110, 470, 1700, 140, "JDBC và SPI: dùng context ClassLoader của thread, vì code lõi không thấy classpath của bạn", "violet", 32),
        # JVM / JRE / JDK
        tag("cl-j0", 110, 290, 1700, 110, "JVM: chạy bytecode, mỗi hệ điều hành một bản", "cyan", 34),
        tag("cl-j1", 110, 430, 1700, 110, "JRE = JVM + thư viện chuẩn: đủ để chạy", "green", 34),
        tag("cl-j2", 110, 570, 1700, 110, "JDK = JRE + javac, jar, jcmd: để viết và soi", "violet", 34),
        note("cl-jn", 110, 770, 1700, "Bytecode giống nhau mọi nơi: đó mới là phần độc lập nền tảng", "green", 38),
        # CNFE vs NCDFE
        titled("cl-e1", 110, 290, 830, 260, "checked exception", "ClassNotFoundException", "nạp bằng tên chuỗi mà không thấy", "amber", 36),
        titled("cl-e2", 980, 290, 830, 260, "Error", "NoClassDefFoundError", "lúc compile có, lúc chạy thì không", "red", 36),
        tag("cl-s1", 110, 620, 830, 110, "Lần 1: ExceptionInInitializerError", "amber", 30),
        tag("cl-s2", 980, 620, 830, 110, "Lần 2: Could not initialize class", "red", 30),
        note("cl-sn", 110, 790, 1700, "Khối static ném lỗi: tìm ExceptionInInitializerError đầu tiên trong log", "green", 36),
        take("cx", "Cùng tên, khác loader", "là hai class khác nhau"),
    ]), beats=[
        B("Câu hỏi đầu: class được nạp bằng cái gì? JVM nạp class bằng các Class Loader xếp thành cây. Bootstrap nạp lõi JDK như String. Platform nạp các module như java sql. App nạp classpath của bạn.",
          "Bootstrap, Platform, App.",
          lambda w: [IN("#cl-eye", "blur"), TYPE("#cl-q", 0.2, 0.05), *shrink("cl", 2.0),
                     IN("#cl-t0", "up", w("Bootstrap nạp")), IN("#cl-i0", "left", w("Bootstrap nạp") + 0.3),
                     IN("#cl-t1", "up", w("Platform nạp")), IN("#cl-i1", "left", w("Platform nạp") + 0.3),
                     IN("#cl-t2", "up", w("App nạp")), IN("#cl-i2", "left", w("App nạp") + 0.3)]),
        B("Khi cần một class, loader hỏi cha trước. Cha không có thì mới tự nạp. Nhờ vậy, một loader tự viết có xin java lang String vẫn nhận đúng String của JVM.",
          "Parent-first: hỏi cha trước.",
          lambda w: [*ARROW("cl-a1", w("hỏi cha") - 0.5, 0.5), *ARROW("cl-a2", w("hỏi cha") + 0.2, 0.5), IN("#cl-d", "up", w("Cha không"))]),
        B("Điểm then chốt: danh tính của class là tên cộng loader nạp nó. Hai loader nạp cùng một file Plugin cho ra hai class khác nhau. Chạy thật: c một bằng c hai là false, và ép kiểu ném Class Cast Exception.",
          "Class = (tên, loader). c1 == c2 là false.",
          lambda w: [OUT(S("cl-t0", "cl-t1", "cl-t2", "cl-i0", "cl-i1", "cl-i2", "cl-d") + ", " + AR("cl-a1", "cl-a2"), "blur", 0, 0.4),
                     IN("#cl-rule", "blur", 0.5, 0.7), IN("#cl-l1", "left", w("Hai loader")), IN("#cl-l2", "left", w("cho ra")),
                     IN("#cl-err", "up", w("Chạy thật")), SHAKE("#cl-err", w("Chạy thật") + 1.2)]),
        B("Đó là lý do bạn thấy thông báo Plugin cannot be cast to Plugin. Hay gặp ở application server, hot reload, hoặc hai bản jar trùng ở hai nơi.",
          "Plugin cannot be cast to Plugin.",
          lambda w: [IN("#cl-cc", "up", w("Đó là lý do"))]),
        B("Parent-first cũng có ngoại lệ. Tomcat cho mỗi webapp một loader tìm trong WEB INF lib trước, để các app không đụng phiên bản thư viện của nhau. Còn JDBC và cơ chế plugin dùng context Class Loader của thread.",
          "Tomcat và context ClassLoader.",
          lambda w: [OUT(S("cl-rule", "cl-l1", "cl-l2", "cl-err", "cl-cc"), "blur", 0, 0.4),
                     IN("#cl-k1", "left", 0.6), IN("#cl-k2", "left", w("Còn JDBC"))]),
        B("Sang câu khởi động quen thuộc: Jay Vi Em, Jay Ar I, Jay Đi Kê. Jay Vi Em chạy bytecode, mỗi hệ điều hành có một bản riêng. Jay Ar I là Jay Vi Em cộng thư viện chuẩn, đủ để chạy. Jay Đi Kê là Jay Ar I cộng công cụ như java C, jar, jay C M D. Cái độc lập nền tảng là bytecode.",
          "JVM, JRE, JDK. Độc lập nền tảng là bytecode.",
          lambda w: [OUT(S("cl-k1", "cl-k2"), "blur", 0, 0.4),
                     IN("#cl-j0", "left", (w("Jay Vi Em chạy") - 0.4)), IN("#cl-j1", "left", (w("Jay Ar I là") - 0.9)), IN("#cl-j2", "left", (w("Jay Đi Kê là") - 1.5)),
                     IN("#cl-jn", "up", (w("Cái độc lập") - 2.2))]),
        B("Cuối cùng, hai lỗi tên giống nhau. Class Not Found Exception là checked exception: bạn nạp bằng tên chuỗi mà không thấy. No Class Def Found Error là một Error: lúc compile có class, lúc chạy thì không.",
          "ClassNotFoundException khác NoClassDefFoundError.",
          lambda w: [OUT(S("cl-j0", "cl-j1", "cl-j2", "cl-jn"), "blur", 0, 0.4),
                     IN("#cl-e1", "pop", w("Class Not Found") + 0.3), IN("#cl-e2", "pop", w("No Class Def"))]),
        B("Trường hợp hay bị bỏ sót: khối static của class ném exception. Lần đầu ném Exception In Initializer Error. JVM đánh dấu class hỏng, nên lần sau chỉ còn Could not initialize class, không kèm nguyên nhân. Thấy dòng này thì cuộn log lên tìm lỗi đầu tiên.",
          "Could not initialize class: tìm lỗi đầu tiên.",
          lambda w: [IN("#cl-s1", "left", w("Lần đầu")), IN("#cl-s2", "left", w("nên lần sau")), IN("#cl-sn", "up", w("Thấy dòng"))]),
        B("Nhớ: class là tên cộng loader, và lỗi nạp class có hai họ khác nhau.",
          "Class là tên cộng loader.",
          lambda w: [OUT(S("cl-e1", "cl-e2", "cl-s1", "cl-s2", "cl-sn"), "blur", 0, 0.4),
                     TYPE("#cx-t1", 0.6, 0.04), IN("#cx-t2", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ jit
    dict(id="jit", world=(1920, 1080), hud="", cam="".join([
        head("jt", "Chặng 2 · JIT", "Vì sao chương trình nhanh dần lên"),
        titled("jt-c0", 110, 330, 500, 230, "tier 0", "Thông dịch", "chạy từng lệnh bytecode", "red", 38),
        titled("jt-c1", 710, 330, 500, 230, "tier 1 đến 3", "C1", "biên dịch nhanh, ít tối ưu", "amber", 38),
        titled("jt-c2", 1310, 330, 500, 230, "tier 4", "C2", "chậm hơn, tối ưu mạnh", "green", 38),
        wires(arrow("jt-a1", [(615, 445), (705, 445)], "cyan"), arrow("jt-a2", [(1215, 445), (1305, 445)], "cyan")),
        note("jt-n", 110, 650, 1700, "Method chạy nhiều lần là method nóng: JVM đếm, rồi biên dịch thành mã máy", "cyan", 36),
        note("jt-w", 110, 800, 1700, "Vì vậy: chậm lúc vừa khởi động, rồi nhanh dần (warm-up)", "amber", 38),
        *[tag(f"jt-l{i}", 110, BY(i), 640, 90, t, c, 28) for i, (t, _, c) in enumerate(BARS)],
        *[el(f"jt-b{i}", BX0, BY(i), w, 90, "", f"gbox {c} r") for i, (_, w, c) in enumerate(BARS)],
        note("jt-r", 110, 700, 1700, "Mỗi vòng 40 lần: thông dịch 55 đến 65 ms, có JIT 6 đến 8 ms, nhanh hơn khoảng 9 lần", "green", 36),
        note("jt-m", 110, 850, 1700, "Số đo trên máy tác giả, chỉ để thấy hình dạng", "amber", 32),
        tag("jt-x1", 110, 290, 1700, 130, "Microbenchmark vài lần đầu = đo cả warm-up", "red", 38),
        tag("jt-x2", 110, 460, 1700, 130, "Dùng JMH với warm-up chuẩn", "green", 38),
        tag("jt-x3", 110, 630, 1700, 130, "Giảm chậm sau khởi động: warm-up bằng request giả", "cyan", 38),
        take("jt", "Chạy nhiều, biên dịch, nhanh dần", "vài request đầu chậm là chuyện bình thường"),
    ]), beats=[
        B("Class đã nạp, giờ đến chuyện nó chạy nhanh tới đâu. JVM khởi đầu bằng thông dịch và đếm số lần mỗi method chạy. Method nóng được JIT biên dịch thành mã máy, qua hai tầng.",
          "Thông dịch, đếm, rồi JIT biên dịch method nóng.",
          lambda w: [IN("#jt-eye", "blur"), TYPE("#jt-q", 0.2, 0.05), *shrink("jt", 2.0),
                     IN("#jt-c0", "up", w("JVM khởi đầu") + 0.4), IN("#jt-n", "up", w("Method nóng") - 0.4)]),
        B("C1 biên dịch nhanh nhưng ít tối ưu. C2 chậm hơn nhưng tối ưu mạnh. Trong Print Compilation, tier không là thông dịch, tier một đến ba là C1, tier bốn là C2.",
          "C1 nhanh, ít tối ưu. C2 chậm, tối ưu mạnh.",
          lambda w: [*ARROW("jt-a1", 0.2, 0.5), IN("#jt-c1", "up", 0.5), *ARROW("jt-a2", w("C2 chậm") - 0.4, 0.5), IN("#jt-c2", "up", w("C2 chậm"))]),
        B("Vì vậy ứng dụng Java chậm lúc vừa khởi động, rồi nhanh dần. Đó là warm-up.",
          "Chậm lúc khởi động, rồi nhanh dần: warm-up.",
          lambda w: [IN("#jt-w", "up", w("Vì vậy")), PULSE("#jt-w", w("Đó là"))]),
        B("Chạy thật trên máy tác giả, gọi work hai trăm nghìn nhiều lần. Tắt JIT bằng Xint thì lần nào cũng khoảng một nghìn ba trăm năm mươi micro giây. Có JIT, lần một khoảng một nghìn năm trăm, lần tám chỉ còn khoảng một trăm bảy mươi.",
          "work(200000): -Xint ~1350 µs, JIT lần 1 ~1500 µs, lần 8 ~170 µs.",
          lambda w: [OUT(S("jt-c0", "jt-c1", "jt-c2", "jt-n", "jt-w") + ", " + AR("jt-a1", "jt-a2"), "blur", 0, 0.4),
                     IN("#jt-l0", "left", w("Tắt JIT") + 0.3), IN("#jt-b0", "left", w("Tắt JIT") + 0.6, 0.8),
                     IN("#jt-l1", "left", w("Có JIT, lần một")), IN("#jt-b1", "left", w("Có JIT, lần một") + 0.3, 0.8),
                     IN("#jt-l2", "left", w("lần tám")), IN("#jt-b2", "left", w("lần tám") + 0.3, 0.8)]),
        B("Mỗi vòng bốn mươi lần, thông dịch mất năm mươi lăm đến sáu mươi lăm mili giây, có JIT chỉ sáu đến tám. Nhanh hơn khoảng chín lần. Đây là số của máy tác giả, chỉ để thấy hình dạng.",
          "40 lần mỗi vòng: 55 đến 65 ms so với 6 đến 8 ms.",
          lambda w: [IN("#jt-r", "up", 0.3), PULSE("#jt-r", w("Nhanh hơn")), IN("#jt-m", "up", w("Đây là số"))]),
        B("Hệ quả: vài request đầu hay chậm, và đo hiệu năng bằng vài lần chạy đầu là đo cả warm-up. Hãy dùng Jay Em Hát với warm-up chuẩn, hoặc warm-up bằng request giả.",
          "Đo bằng JMH có warm-up.",
          lambda w: [OUT(S("jt-l0", "jt-l1", "jt-l2", "jt-b0", "jt-b1", "jt-b2", "jt-r", "jt-m"), "blur", 0, 0.4),
                     IN("#jt-x1", "left", 0.6), IN("#jt-x2", "left", w("Hãy dùng")), IN("#jt-x3", "left", w("hoặc warm-up"))]),
        B("Nhớ chuỗi nhân quả: chạy nhiều lần, được biên dịch, rồi nhanh dần.",
          "Chạy nhiều, biên dịch, nhanh dần.",
          lambda w: [OUT(S("jt-x1", "jt-x2", "jt-x3"), "blur", 0, 0.4), TYPE("#jt-t1", 0.6, 0.04), IN("#jt-t2", "blur", 1.8)]),
    ]),
    # ------------------------------------------------------------ aqs
    dict(id="aqs", world=(1920, 1080), hud="", cam="".join([
        head("aq", "Chặng 3 · AQS", "Nền móng của hầu hết lock"),
        note("aq-s0", 110, 290, 1700, "4 thread, mỗi thread counter++ 100.000 lần, không khoá", "cyan", 38),
        tag("aq-a1", 110, 420, 820, 120, "Mong đợi: 400.000", "green", 40),
        tag("aq-a2", 990, 420, 820, 120, "Đã chạy: khoảng 231.000", "red", 40),
        tag("aq-st0", 110, 600, 520, 100, "1. đọc", "amber", 34),
        tag("aq-st1", 700, 600, 520, 100, "2. cộng", "amber", 34),
        tag("aq-st2", 1290, 600, 520, 100, "3. ghi", "amber", 34),
        note("aq-rc", 110, 770, 1700, "Hai thread cùng đọc một giá trị rồi ghi đè nhau: mất cập nhật (race condition)", "red", 36),
        titled("aq-sv", 110, 290, 700, 190, "một số nguyên", "state", "", "cyan", 48),
        titled("aq-qu", 900, 290, 910, 190, "hàng đợi các thread đang chờ", "T2 → T3 → T4", "", "violet", 44),
        tag("aq-u0", 110, 540, 1700, 100, "ReentrantLock: 0 là chưa ai giữ, 1 là đang giữ", "cyan", 32),
        tag("aq-u1", 110, 660, 1700, 100, "Semaphore: state là số giấy phép còn lại", "green", 32),
        tag("aq-u2", 110, 780, 1700, 100, "CountDownLatch: state là bộ đếm lùi", "amber", 32),
        cbox("aq-m", 90, 280, 1060, "Mutex.java", MUTEX_CODE, "violet", 30),
        tag("aq-cas", 1230, 290, 580, 250, "CAS: nếu state là 0 thì đặt thành 1, trong một bước nguyên tử", "amber", 30),
        tag("aq-ok", 1230, 580, 580, 120, "Đã chạy: đúng 400000", "green", 34),
        note("aq-mn", 90, 800, 1720, "AQS lo xếp hàng, chặn, đánh thức. Bạn chỉ viết luật lấy và nhả.", "green", 36),
        tag("aq-x1", 110, 330, 1700, 150, "Viết Mutex để hiểu cơ chế thì tốt", "green", 40),
        tag("aq-x2", 110, 520, 1700, 150, "Trong sản phẩm: ReentrantLock hoặc synchronized có sẵn", "cyan", 40),
        take("aq", "State cộng hàng đợi", "mọi thứ còn lại là cách hiểu state"),
    ]), beats=[
        B("Vì sao cần lock? Bốn thread cùng tăng một bộ đếm một trăm nghìn lần, không khoá. Lẽ ra phải là bốn trăm nghìn, nhưng chạy thật chỉ được khoảng hai trăm ba mươi mốt nghìn.",
          "Không khoá: ~231.000 thay vì 400.000.",
          lambda w: [IN("#aq-eye", "blur"), TYPE("#aq-q", 0.2, 0.05), *shrink("aq", 2.0),
                     IN("#aq-s0", "up", w("Bốn thread") - 0.2), IN("#aq-a1", "pop", w("Lẽ ra")), IN("#aq-a2", "pop", w("nhưng chạy thật")), SHAKE("#aq-a2", w("nhưng chạy thật") + 1.0)]),
        B("Vì cộng một gồm ba bước: đọc, cộng, ghi. Hai thread có thể cùng đọc một giá trị rồi ghi đè nhau, nên mất cập nhật. Đó là race condition.",
          "Đọc, cộng, ghi: hai thread ghi đè nhau.",
          lambda w: [IN("#aq-st0", "up", w("đọc,")), IN("#aq-st1", "up", w("cộng,") + 0.2), IN("#aq-st2", "up", w("ghi.") + 0.2), IN("#aq-rc", "up", w("Hai thread"))]),
        B("Lock của Java xây trên AQS. AQS chỉ gồm hai thứ: một số nguyên state, và hàng đợi các thread đang chờ. Mỗi công cụ hiểu state một kiểu. Với ReentrantLock, không là chưa ai giữ, một là đang giữ. Với Semaphore, state là số giấy phép còn lại. Với CountDownLatch, state là bộ đếm lùi.",
          "AQS = state + hàng đợi. Mỗi lock hiểu state một kiểu.",
          lambda w: [OUT(S("aq-s0", "aq-a1", "aq-a2", "aq-st0", "aq-st1", "aq-st2", "aq-rc"), "blur", 0, 0.4),
                     IN("#aq-sv", "pop", w("một số nguyên") - 0.2), IN("#aq-qu", "pop", w("hàng đợi")),
                     IN("#aq-u0", "left", w("Với ReentrantLock")), IN("#aq-u1", "left", w("Với Semaphore")), IN("#aq-u2", "left", w("Với CountDownLatch"))]),
        B("Bạn chỉ cần viết cách lấy khoá và cách nhả khoá. Lấy khoá dùng CAS: nếu state đang là không thì đặt thành một, trong một bước nguyên tử. Hai thread cùng thử thì chỉ một thread thắng. AQS lo phần xếp hàng, chặn và đánh thức. Chỉ khoảng mười dòng là có một Mutex, chạy thật cho đúng bốn trăm nghìn.",
          "Mutex trên AQS: đúng 400000.",
          lambda w: [OUT(S("aq-sv", "aq-qu", "aq-u0", "aq-u1", "aq-u2"), "blur", 0, 0.4), IN("#aq-m", "blur", 0.5, 0.7),
                     IN("#aq-cas", "left", w("Lấy khoá dùng")), IN("#aq-mn", "up", w("AQS lo")), IN("#aq-ok", "pop", w("chạy thật cho"))]),
        B("Nhưng trong sản phẩm, đừng tự viết lock. Viết để hiểu cơ chế thì tốt, còn khi chạy thật hãy dùng ReentrantLock hay synchronized có sẵn.",
          "Trong sản phẩm dùng lock có sẵn.",
          lambda w: [OUT(S("aq-m", "aq-cas", "aq-mn", "aq-ok"), "blur", 0, 0.4), IN("#aq-x1", "left", 0.6), IN("#aq-x2", "left", w("còn khi chạy"))]),
        B("Nhớ: AQS là state cộng hàng đợi, phần còn lại chỉ là cách hiểu state.",
          "AQS là state cộng hàng đợi.",
          lambda w: [OUT(S("aq-x1", "aq-x2"), "blur", 0, 0.4), TYPE("#aq-t1", 0.6, 0.04), IN("#aq-t2", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ stamped
    dict(id="stamped", world=(1920, 1080), hud="", cam="".join([
        head("sl", "Chặng 3 · StampedLock", "Đọc lạc quan"),
        titled("sl-r1", 110, 300, 830, 230, "ReadWriteLock", "Mỗi lần đọc", "đều lấy và nhả khoá", "amber", 40),
        titled("sl-r2", 980, 300, 830, 230, "StampedLock", "Đọc không khoá", "rồi kiểm tra có ai ghi chen vào", "green", 40),
        note("sl-rn", 110, 640, 1700, "Hợp khi đọc rất nhiều, ghi rất ít, đoạn đọc ngắn", "cyan", 38),
        cbox("sl-c", 90, 280, 1040, "Optimistic.java", STAMP_CODE, "violet", 30),
        tag("sl-p1", 1190, 280, 620, 100, "1. đọc không khoá", "green", 30),
        tag("sl-p2", 1190, 400, 620, 100, "2. validate: có ai ghi chen vào?", "amber", 28),
        tag("sl-p3", 1190, 520, 620, 100, "3. có thì đọc lại bằng readLock", "cyan", 28),
        tag("sl-f1", 110, 760, 830, 120, "Đã chạy: sau một lần ghi, validate trả false", "green", 28),
        tag("sl-f2", 980, 760, 830, 120, "Đã chạy: writeLock lần hai trong cùng thread bị từ chối", "red", 28),
        titled("sl-nr", 110, 290, 1700, 170, "", "StampedLock không reentrant", "lấy hai lần là tự chặn mình", "red", 44),
        tag("sl-x1", 110, 490, 1700, 130, "Cạm bẫy: có thể đọc phải dữ liệu đang ghi dở", "red", 36),
        tag("sl-x2", 110, 650, 1700, 130, "Chép các trường vào biến cục bộ, validate true rồi mới dùng", "amber", 34),
        tag("sl-x3", 110, 810, 1700, 130, "Chỉ đổi khi đo được ReadWriteLock là điểm nghẽn", "green", 36),
        take("sl", "Đọc không khoá, validate sau", "mặc định vẫn là synchronized hoặc ReentrantLock"),
    ]), beats=[
        B("ReadWriteLock cho nhiều thread đọc cùng lúc, nhưng mỗi lần đọc vẫn phải lấy và nhả khoá. Khi đọc rất nhiều, chi phí đó đáng kể. StampedLock cho đọc lạc quan: đọc không khoá, rồi kiểm tra xem có ai ghi chen vào không.",
          "ReadWriteLock khoá mỗi lần đọc. StampedLock đọc lạc quan.",
          lambda w: [IN("#sl-eye", "blur"), TYPE("#sl-q", 0.2, 0.05), *shrink("sl", 1.8),
                     IN("#sl-r1", "pop", w("ReadWriteLock cho") + 0.5), IN("#sl-r2", "pop", w("StampedLock cho")), IN("#sl-rn", "up", w("StampedLock cho") + 5.0)]),
        B("Cụ thể: lấy một stamp bằng try Optimistic Read, đọc dữ liệu, rồi gọi validate. Nếu validate trả false, nghĩa là có writer chen vào, thì đọc lại bằng read lock. Đã chạy: sau một lần ghi, validate trả false, còn stamp lấy sau đó thì trả true.",
          "tryOptimisticRead, đọc, validate, nếu false thì đọc lại.",
          lambda w: [OUT(S("sl-r1", "sl-r2", "sl-rn"), "blur", 0, 0.4), IN("#sl-c", "blur", 0.5, 0.7),
                     IN("#sl-p1", "left", w("lấy một stamp")), IN("#sl-p2", "left", w("rồi gọi validate")), IN("#sl-p3", "left", w("thì đọc lại")),
                     IN("#sl-f1", "up", w("Đã chạy"))]),
        B("Đổi lại, StampedLock không reentrant. Đã chạy: lấy write lock lần hai trong cùng thread thì bị từ chối, tức là tự chặn mình.",
          "Không reentrant: lấy write lock hai lần bị từ chối.",
          lambda w: [OUT(S("sl-c", "sl-p1", "sl-p2", "sl-p3", "sl-f1"), "blur", 0, 0.4), IN("#sl-nr", "pop", 0.6), IN("#sl-f2", "up", w("Đã chạy"))]),
        B("Cạm bẫy: khi đọc lạc quan, bạn có thể đọc phải dữ liệu đang ghi dở. Chỉ dùng giá trị sau khi validate trả true, nên chép các trường vào biến cục bộ trước rồi mới validate. Và chỉ đổi sang StampedLock khi đo được ReadWriteLock là điểm nghẽn.",
          "Chỉ dùng giá trị sau khi validate. Đổi khi đo được điểm nghẽn.",
          lambda w: [OUT(S("sl-f2"), "blur", 0, 0.4), IN("#sl-x1", "left", 0.6), IN("#sl-x2", "left", w("Chỉ dùng")), IN("#sl-x3", "left", w("Và chỉ đổi"))]),
        B("Mặc định, synchronized hoặc ReentrantLock là đủ cho phần lớn trường hợp.",
          "Mặc định synchronized hoặc ReentrantLock.",
          lambda w: [OUT(S("sl-nr", "sl-x1", "sl-x2", "sl-x3"), "blur", 0, 0.4), TYPE("#sl-t1", 0.6, 0.04), IN("#sl-t2", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ chon-khoa
    dict(id="chon-khoa", world=(1920, 1080), hud="", cam="".join([
        head("ck", "Bài tập", "Chọn công cụ đồng bộ"),
        *DRILL_HTML,
        take("ck", "Bắt đầu từ cái đơn giản nhất", "chỉ chuyển khi cần một tính năng cụ thể"),
    ]), beats=[
        B("Phần cuối là bài tập: chọn công cụ đồng bộ theo tình huống. Một: đoạn găng ngắn, đơn giản, không cần tính năng đặc biệt. Chọn synchronized, JVM tối ưu rất tốt. Hai: cần thử lấy khoá có thời hạn, hoặc bị ngắt khi đang chờ. Chọn ReentrantLock, có try Lock với timeout.",
          "synchronized cho đoạn găng đơn giản. ReentrantLock khi cần timeout.",
          lambda w: [IN("#ck-eye", "blur"), TYPE("#ck-q", 0.2, 0.05), *shrink("ck", 2.0),
                     IN("#ck-s0", "left", w("Một:")), IN("#ck-p0", "pop", w("Chọn synchronized") + 0.3), *ARROW("ck-a0", w("Chọn synchronized") - 0.2, 0.4),
                     IN("#ck-s1", "left", w("Hai:")), IN("#ck-p1", "pop", w("Chọn ReentrantLock") + 0.3), *ARROW("ck-a1", w("Chọn ReentrantLock") - 0.2, 0.4)]),
        B("Ba: cache đọc nhiều ghi ít và cần reentrant. Chọn ReadWriteLock. Bốn: đọc cực nhiều, đoạn đọc rất ngắn, chấp nhận đọc lại khi bị ghi chen và không cần reentrant. Chọn StampedLock.",
          "ReadWriteLock cho cache. StampedLock cho đọc cực nhiều.",
          lambda w: [IN("#ck-s2", "left", 0.3), IN("#ck-p2", "pop", w("Chọn ReadWriteLock") + 0.3), *ARROW("ck-a2", w("Chọn ReadWriteLock") - 0.2, 0.4),
                     IN("#ck-s3", "left", w("Bốn:")), IN("#ck-p3", "pop", w("Chọn StampedLock") + 0.3), *ARROW("ck-a3", w("Chọn StampedLock") - 0.2, 0.4)]),
        B("Năm: giới hạn tối đa mười kết nối đồng thời tới một dịch vụ. Chọn Semaphore, một bộ đếm giấy phép.",
          "Semaphore để giới hạn số lượng.",
          lambda w: [IN("#ck-s4", "left", 0.3), IN("#ck-p4", "pop", w("Chọn Semaphore") + 0.3), *ARROW("ck-a4", w("Chọn Semaphore") - 0.2, 0.4)]),
        B("Nguyên tắc chung: bắt đầu từ cái đơn giản nhất, và chỉ chuyển khi cần một tính năng cụ thể.",
          "Đơn giản nhất trước.",
          lambda w: [DIM(S("ck-eye", "ck-q", *[f"ck-s{i}" for i in range(5)], *[f"ck-p{i}" for i in range(5)]) + ", " + AR(*[f"ck-a{i}" for i in range(5)]), 0, 0.07),
                     TYPE("#ck-t1", 0.4, 0.04), IN("#ck-t2", "blur", w("và chỉ"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 200, 220 + i * 118, 1520, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Loader", "Parent first, class là tên cộng loader"), ("Lỗi", "ClassNotFound khác NoClassDefFound"),
                                      ("JIT", "Method nóng thành mã máy, nên có warm-up"), ("AQS", "state cộng hàng đợi các thread chờ"),
                                      ("Stamped", "Đọc lạc quan, không reentrant")])],
        el("ou-cta", 0, 870, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Class Loader xếp thành cây và hỏi cha trước, nên danh tính của class là tên cộng loader, và cùng tên khác loader là hai class khác nhau. Class Not Found Exception là nạp bằng tên mà không thấy, còn No Class Def Found Error là lúc chạy thiếu hoặc khởi tạo hỏng.",
          "Class là tên cộng loader. Hai họ lỗi nạp class.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "left", w("Class Loader")), IN("#ou-r1", "left", w("Class Not Found"))]),
        B("Jay Ai Ti biên dịch method nóng thành mã máy, nên Java chậm lúc đầu rồi nhanh dần, và đo hiệu năng phải bỏ qua warm-up. AQS là state cộng hàng đợi, nền của ReentrantLock, Semaphore, CountDownLatch. StampedLock đọc lạc quan nhưng không reentrant.",
          "JIT, AQS, StampedLock.",
          lambda w: [IN("#ou-r2", "left", w("Jay Ai Ti biên")), IN("#ou-r3", "left", w("AQS là")), IN("#ou-r4", "left", w("StampedLock đọc"))]),
        B("Khi trả lời, hãy kể theo chuỗi nhân quả. Mở bài học tương tác để làm quiz và thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", w("Mở bài"))]),
    ]),
]

fit_to_audio(SCENES, __file__)
