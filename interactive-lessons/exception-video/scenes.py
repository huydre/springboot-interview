"""Exception Handling explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Verified outputs (JDK 21 + the order-service lab):
returnInFinally() = 2, swallowed() = 0 with no exception, counter() = 1;
try-with-resources: open A, open B, close B, close A, main: body failed, suppressed B then A;
manual finally close: main: close failed A (body exception lost);
Files.readString(p) without catch/throws: "error: unreported exception IOException; must be caught or declared to be thrown";
Integer.parseInt("x") compiles, then throws NumberFormatException: For input string: "x";
.map(p -> Files.readString(p)) fails with the same error, also when readAll() declares throws IOException;
wrapped in UncheckedIOException: [hello], missing file -> UncheckedIOException, cause java.nio.file.NoSuchFileException: missing.txt;
checked exception inside @Transactional commits (1 order, stock 10 -> 8, confirmation email); rollbackFor rolls back (0 orders, stock 10).
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
    inner = (f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(top)}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700">{esc(main)}</span>'
    inner += f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(sub)}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def card(id_, x, y, w, h, title, sub, tone="cyan", pad=0):
    """Big card with a heading and a muted line; `pad` keeps space below for tags laid on top of it."""
    spacer = f'<div style="height:{pad}px"></div>' if pad else ""
    return box(id_, x, y, w, h, f'<b style="font-size:52px">{esc(title)}</b>'
               f'<span style="font-size:32px;color:var(--muted);text-align:center;line-height:1.35">{esc(sub)}</span>{spacer}',
               tone, "card")


def row(label, text):
    return f'<span class="mono big" style="font-size:40px">{esc(label)}</span><span style="font-size:36px">{esc(text)}</span>'


TWR_OUT = ["open A", "open B", "close B", "close A", "main: body failed",
           "suppressed: close failed B", "suppressed: close failed A"]

TOPICS = [("Cây exception", "Error · checked · unchecked"), ("Checked hay unchecked", "lambda và @Transactional"),
          ("finally", "luôn chạy, nhưng có bẫy"), ("try-with-resources", "không mất lỗi gốc")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Câu hỏi phỏng vấn Java", "eyebrow r"),
        cbox("hk-code", 400, 260, 1000, "Trap.java",
             "static int f() {\n"
             "    try { return 1; }\n"
             "    finally { return 2; }\n"
             "}\n"
             "// f() = ?", "cyan", 44),
        tag("hk-ans", 1450, 380, 380, 120, "f() = 2", "red", 52),
        note("hk-p2", 400, 760, 1100, "try ném exception? return trong finally nuốt luôn", "red", 38),
        el("hk-title", 0, 170, 1920, None, letters("Bắt exception sao cho đúng?"), "h1 r", "font-size:100px"),
        *[card(f"hk-c{i}", 75 + i * 450, 420, 420, 340, t, s) for i, (t, s) in enumerate(TOPICS)],
    ]), beats=[
        B("Hàm này return một trong try, rồi return hai trong finally. Kết quả là bao nhiêu?",
          "Hàm này return 1 trong try, rồi return 2 trong finally. Kết quả là bao nhiêu?",
          lambda w: [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        B("Kết quả là hai. Khối finally ghi đè giá trị của khối try.", "Là 2. finally ghi đè giá trị của try.",
          lambda w: [IN("#hk-ans", "pop", 0.3), SHAKE("#hk-ans", 0.9)]),
        B("Tệ hơn, nếu try ném exception, return trong finally còn nuốt mất exception đó.",
          "Tệ hơn: nếu try ném exception, return trong finally còn nuốt mất exception đó.",
          lambda w: [IN("#hk-p2", "up", w("return trong")), SHAKE("#hk-p2", w("nuốt mất"))]),
        B("Hôm nay ta đi qua cây exception, checked và unchecked, các bẫy của khối finally, và cú pháp try with resources.",
          "Hôm nay: cây exception, checked vs unchecked, bẫy của finally, và try-with-resources.",
          lambda w: [OUT(S("hk-eye", "hk-code", "hk-ans", "hk-p2"), "blur", 0, 0.45), TYPE("#hk-title", 0.4, 0.03),
                     IN("#hk-c0", "pop", w("cây exception")), IN("#hk-c1", "pop", w("checked và")),
                     IN("#hk-c2", "pop", w("các bẫy")), IN("#hk-c3", "pop", w("cú pháp"))]),
    ]),
    # ------------------------------------------------------------ hierarchy + what "checked" means
    dict(id="tree", world=(1920, 1080), hud="", cam="".join([
        head("tr", "01 · Cây exception", "Chỉ Throwable mới throw được"),
        tag("tr-t", 760, 225, 400, 90, "Throwable", "violet", 36),
        tag("tr-e", 330, 385, 400, 90, "Error", "red", 36),
        tag("tr-x", 1190, 385, 400, 90, "Exception", "amber", 36),
        tag("tr-oom", 80, 565, 380, 80, "OutOfMemoryError", "red", 28),
        tag("tr-soe", 480, 565, 400, 80, "StackOverflowError", "red", 28),
        tag("tr-io", 900, 565, 300, 80, "IOException", "amber", 28),
        tag("tr-sql", 1220, 565, 300, 80, "SQLException", "amber", 28),
        tag("tr-rt", 1540, 565, 340, 80, "RuntimeException", "green", 28),
        tag("tr-npe", 1040, 735, 400, 80, "NullPointerException", "green", 28),
        tag("tr-iae", 1470, 735, 420, 80, "IllegalArgumentException", "green", 28),
        tag("tr-k1", 80, 845, 500, 90, "Error: đừng catch", "red", 30),
        tag("tr-k2", 620, 845, 600, 90, "Checked: compiler bắt buộc", "amber", 30),
        tag("tr-k3", 1260, 845, 600, 90, "Unchecked: RuntimeException", "green", 30),
        cbox("tr-code", 160, 230, 1600, "Read.java",
             "String read(Path p) {\n"
             "    return Files.readString(p);   // throws IOException\n"
             "}", "violet", 40),
        bigerr("tr-err", 160, 520, 1600, "✕ error: unreported exception IOException;<br>must be caught or declared to be thrown", 38),
        tag("tr-f1", 160, 700, 760, 110, "catch (IOException e) { ... }", "green", 32),
        tag("tr-f2", 1000, 700, 760, 110, "read(Path p) throws IOException", "green", 32),
        cbox("tr-p", 160, 230, 1600, "Parse.java", 'int n = Integer.parseInt("x");   // không catch, không throws', "violet", 40),
        tag("tr-pc", 160, 450, 1600, 110, "✓ biên dịch bình thường", "green", 36),
        bigerr("tr-pe", 160, 610, 1600, '✕ chạy mới nổ: NumberFormatException: For input string: "x"', 38),
        el("tr-t1", 0, 400, 1920, None, letters("Checked: compiler ép bạn xử lý"), "take r"),
        el("tr-t2", 0, 540, 1920, None, "unchecked: compiler để yên, lỗi nổ lúc chạy", "take-sm r"),
        wires(arrow("tr-a1", [(960, 315), (530, 381)], "red"), arrow("tr-a2", [(960, 315), (1390, 381)], "amber"),
              arrow("tr-a3", [(530, 475), (270, 561)], "red"), arrow("tr-a4", [(530, 475), (680, 561)], "red"),
              arrow("tr-a5", [(1390, 475), (1050, 561)], "amber"), arrow("tr-a6", [(1390, 475), (1370, 561)], "amber"),
              arrow("tr-a7", [(1390, 475), (1710, 561)], "green"),
              arrow("tr-a8", [(1710, 645), (1240, 731)], "green"), arrow("tr-a9", [(1710, 645), (1680, 731)], "green")),
    ]), beats=[
        B("Thứ nhất: cây exception.", "Thứ nhất: cây exception.",
          lambda w: [IN("#tr-eye", "blur"), TYPE("#tr-q", 0.2, 0.04)]),
        B("Mọi thứ throw được đều là con của Throwable. Nó tách làm hai nhánh: Error và Exception.",
          "Mọi thứ throw được đều là con của Throwable. Hai nhánh: Error và Exception.",
          lambda w: [*shrink("tr", 0), IN("#tr-t", "pop", 0.6), *ARROW("tr-a1", w("hai nhánh"), 0.5), IN("#tr-e", "up", w("Error")),
                     *ARROW("tr-a2", w("Error") + 0.3, 0.5), IN("#tr-x", "up", w("và Exception"))]),
        B("Error là lỗi nghiêm trọng của JVM, như hết bộ nhớ hay tràn stack. Đừng catch nó.",
          "Error là lỗi nghiêm trọng của JVM, như hết bộ nhớ hay tràn stack. Đừng catch nó.",
          lambda w: [*ARROW("tr-a3", w("hết bộ nhớ") - 0.3, 0.4), IN("#tr-oom", "up", w("hết bộ nhớ")),
                     *ARROW("tr-a4", w("tràn stack") - 0.3, 0.4), IN("#tr-soe", "up", w("tràn stack")),
                     IN("#tr-k1", "pop", w("Đừng catch")), PULSE("#tr-e", w("Đừng catch") + 0.3)]),
        B("Nhánh Exception là checked: compiler bắt buộc bạn phải catch, hoặc khai báo throws.",
          "Nhánh Exception là checked: compiler bắt buộc phải catch, hoặc khai báo throws.",
          lambda w: [*ARROW("tr-a5", 0.3, 0.4), IN("#tr-io", "up", 0.6), *ARROW("tr-a6", 0.8, 0.4), IN("#tr-sql", "up", 1.1),
                     IN("#tr-k2", "pop", w("compiler")), PULSE("#tr-x", w("compiler") + 0.3)]),
        B("Trừ một nhánh con: Runtime Exception và các con của nó là unchecked, như Null Pointer Exception.",
          "Trừ một nhánh: RuntimeException và các con của nó là unchecked, như NullPointerException.",
          lambda w: [*ARROW("tr-a7", w("Runtime") - 0.4, 0.5), IN("#tr-rt", "pop", w("Runtime")),
                     *ARROW("tr-a8", w("như Null") - 0.4, 0.4), IN("#tr-npe", "up", w("như Null")),
                     *ARROW("tr-a9", w("như Null") - 0.1, 0.4), IN("#tr-iae", "up", w("như Null") + 0.3), IN("#tr-k3", "pop", w("là unchecked"))]),
        B("Compiler bắt buộc nghĩa là sao? Hàm read String khai báo throws IO Exception. Gọi nó mà không catch, cũng không ghi throws ở hàm của mình, thì code không biên dịch được.",
          "Gọi hàm ném checked mà không catch, không throws: không biên dịch được.",
          lambda w: [OUT(S("tr-t", "tr-e", "tr-x", "tr-oom", "tr-soe", "tr-io", "tr-sql", "tr-rt", "tr-npe", "tr-iae", "tr-k1", "tr-k2", "tr-k3")
                         + ", " + AR(*[f"tr-a{i}" for i in range(1, 10)]), "blur", 0, 0.5),
                     IN("#tr-code", "blur", w("Hàm read"), 0.7), PULSE("#tr-code", w("khai báo throws")),
                     IN("#tr-err", "up", w("thì code")), SHAKE("#tr-err", w("thì code") + 0.8)]),
        B("Có hai cách để compiler chịu: catch nó ngay tại chỗ, hoặc khai báo throws để đẩy trách nhiệm lên người gọi.",
          "Hai cách: catch tại chỗ, hoặc khai báo throws.",
          lambda w: [IN("#tr-f1", "up", w("catch nó")), IN("#tr-f2", "up", w("hoặc khai báo"))]),
        B("Còn unchecked thì compiler bỏ qua. Parse Int với chữ x vẫn biên dịch bình thường, chỉ khi chạy mới nổ Number Format Exception.",
          "Unchecked: biên dịch bình thường, chạy mới nổ.",
          lambda w: [OUT(S("tr-code", "tr-err", "tr-f1", "tr-f2"), "blur", 0, 0.4), IN("#tr-p", "blur", w("Parse"), 0.7),
                     IN("#tr-pc", "up", w("vẫn biên dịch")), IN("#tr-pe", "up", w("chỉ khi chạy")), SHAKE("#tr-pe", w("chỉ khi chạy") + 0.8)]),
        B("Nhớ một câu: checked là compiler ép bạn xử lý, unchecked thì để yên.",
          "Checked: compiler ép xử lý. Unchecked: để yên.",
          lambda w: [OUT(S("tr-eye", "tr-q", "tr-p", "tr-pc", "tr-pe"), "blur", 0, 0.5), TYPE("#tr-t1", 0.4, 0.04), IN("#tr-t2", "blur", w("unchecked thì"))]),
    ]),
    # ------------------------------------------------------------ when to pick checked or unchecked
    dict(id="checked", world=(1920, 1080), hud="", cam="".join([
        head("ck", "02 · Checked hay unchecked?", "Có nên ép người gọi xử lý?"),
        card("ck-c1", 110, 240, 820, 540, "Checked", "người gọi làm được gì đó để phục hồi", "amber", 240),
        card("ck-c2", 990, 240, 820, 540, "Unchecked", "người gọi ở giữa không làm được gì", "green", 240),
        tag("ck-a1", 160, 520, 720, 100, "file không có → chọn file khác", "amber", 30),
        tag("ck-a2", 160, 640, 720, 100, "mất mạng → thử lại", "amber", 30),
        tag("ck-b1", 1040, 520, 720, 100, "lỗi lập trình: NullPointerException", "green", 28),
        tag("ck-b2", 1040, 640, 720, 100, "nghiệp vụ: hết hàng, số dư không đủ", "green", 28),
        note("ck-n", 110, 830, 1700, "Hỏi: người gọi ngay phía trên có làm được gì không? Có thì checked, không thì unchecked.", "cyan", 36),
        el("ck-t1", 0, 400, 1920, None, letters("Nghiệp vụ trong Spring: unchecked"), "take r"),
        el("ck-t2", 0, 540, 1920, None, "hai lý do ở hai mục tiếp theo: lambda và @Transactional", "take-sm r"),
    ]), beats=[
        B("Phần hai: checked hay unchecked? Ở phần một, ta thấy checked thì compiler ép người gọi phải xử lý. Vậy câu hỏi là: có nên ép người gọi xử lý lỗi này không?",
          "Có nên ép người gọi xử lý lỗi này không?",
          lambda w: [IN("#ck-eye", "blur"), TYPE("#ck-q", w("Vậy câu hỏi"), 0.04)]),
        B("Chọn checked khi người gọi làm được gì đó để phục hồi. File không tồn tại thì cho người dùng chọn file khác. Mất mạng thì thử lại.",
          "Checked: người gọi phục hồi được.",
          lambda w: [*shrink("ck", 0), IN("#ck-c1", "left", 0.4), IN("#ck-a1", "up", w("File không")), IN("#ck-a2", "up", w("Mất mạng"))]),
        B("Chọn unchecked khi người gọi ở giữa không làm được gì. Đó là lỗi lập trình, như Null Pointer Exception, hoặc vi phạm nghiệp vụ, như hết hàng hay số dư không đủ.",
          "Unchecked: lỗi lập trình và vi phạm nghiệp vụ.",
          lambda w: [IN("#ck-c2", "right", 0.3), IN("#ck-b1", "up", w("lỗi lập trình")), IN("#ck-b2", "up", w("vi phạm nghiệp vụ"))]),
        B("Mẹo nhớ: hỏi xem người gọi ngay phía trên có làm được gì không. Có thì checked, không thì unchecked.",
          "Người gọi làm được gì không? Có: checked. Không: unchecked.",
          lambda w: [IN("#ck-n", "up", 0.3), PULSE("#ck-n", w("Có thì"))]),
        B("Trong dự án Spring, exception nghiệp vụ gần như luôn là unchecked. Có hai lý do rất cụ thể, ta xem ngay sau đây: lambda, và Transactional.",
          "Nghiệp vụ trong Spring: unchecked. Hai lý do: lambda và @Transactional.",
          lambda w: [OUT(S("ck-eye", "ck-q", "ck-c1", "ck-c2", "ck-a1", "ck-a2", "ck-b1", "ck-b2", "ck-n"), "blur", 0, 0.5),
                     TYPE("#ck-t1", 0.4, 0.04), IN("#ck-t2", "blur", w("Có hai lý do"))]),
    ]),
    # ------------------------------------------------------------ checked + lambda
    dict(id="lambda", world=(1920, 1080), hud="", cam="".join([
        head("lm", "02 · Checked và lambda", "Vì sao không biên dịch được?"),
        cbox("lm-bad", 80, 230, 1080, "readAll()",
             "List<String> readAll(List<Path> paths) {\n"
             "    return paths.stream()\n"
             "        .map(p -> Files.readString(p))\n"
             "        .toList();\n"
             "}", "violet", 34),
        bigerr("lm-err", 80, 600, 1080, "✕ unreported exception IOException;<br>must be caught or declared to be thrown", 34),
        titled("lm-fn", 1220, 230, 620, 250, "«interface» Function", "R apply(T t)", "không có throws", "violet", 46),
        note("lm-why", 1220, 520, 620, "lambda = thân của apply()\n→ không có chỗ ghi throws", "amber", 34),
        bigerr("lm-th", 80, 790, 1760, "✕ thêm throws IOException vào readAll()? vẫn lỗi y hệt, vì lỗi nằm trong apply()", 32),
        cbox("lm-fix", 80, 230, 1080, "bọc thành unchecked",
             ".map(p -> {\n"
             "    try { return Files.readString(p); }\n"
             "    catch (IOException e) {\n"
             "        throw new UncheckedIOException(e);\n"
             "    }\n"
             "})", "green", 34),
        tag("lm-o1", 1220, 250, 620, 110, "→ [hello]", "green", 38),
        titled("lm-o2", 1220, 410, 620, 230, "file không tồn tại", "UncheckedIOException", "cause: NoSuchFileException", "green", 36),
        el("lm-t1", 0, 400, 1920, None, letters("Lambda không ném được checked"), "take r"),
        el("lm-t2", 0, 540, 1920, None, "bọc vào UncheckedIOException, lỗi gốc vẫn nằm trong cause", "take-sm r"),
    ]), beats=[
        B("Lý do thứ nhất: checked không đi qua được lambda. Ví dụ ta muốn đọc nhiều file bằng stream.",
          "Lý do 1: checked không đi qua được lambda.",
          lambda w: [IN("#lm-eye", "blur"), TYPE("#lm-q", 0.3, 0.04)]),
        B("Trong map, ta gọi Files read String. Hàm này ném IO Exception. Và code không biên dịch được.",
          "Gọi Files.readString trong map: không biên dịch được.",
          lambda w: [*shrink("lm", 0), IN("#lm-bad", "blur", 0.4, 0.7), PULSE("#lm-bad", w("Hàm này")),
                     IN("#lm-err", "up", w("Và code")), SHAKE("#lm-err", w("Và code") + 0.8)]),
        B("Vì sao? Lambda thật ra là phần thân của hàm apply, trong interface Function. Chữ ký của apply không có throws. Theo luật ở phần một, checked phải được khai báo ở đúng hàm chứa lời gọi, mà ta không sửa được apply.",
          "Lambda là thân của apply(), mà apply() không có throws.",
          lambda w: [IN("#lm-fn", "right", w("Lambda thật ra")), PULSE("#lm-fn", w("Chữ ký")), IN("#lm-why", "up", w("Theo luật"))]),
        B("Thêm throws vào hàm read All bên ngoài cũng vô ích. Đã chạy thật: vẫn lỗi y hệt, vì lỗi nằm trong apply.",
          "Thêm throws vào readAll(): vẫn lỗi y hệt.",
          lambda w: [IN("#lm-th", "up", 0.3), SHAKE("#lm-th", w("vẫn lỗi"))]),
        B("Cách sửa: bắt IO Exception ngay trong lambda, rồi bọc vào Unchecked IO Exception. Nó là unchecked, nên đi qua apply được.",
          "Bắt ngay trong lambda, bọc vào UncheckedIOException.",
          lambda w: [OUT(S("lm-bad", "lm-err", "lm-th", "lm-fn", "lm-why"), "blur", 0, 0.45), IN("#lm-fix", "up", 0.6, 0.7),
                     PULSE("#lm-fix", w("rồi bọc"))]),
        B("Chạy thật: đọc được hello. Còn khi thiếu file, ta bắt được Unchecked IO Exception, và lỗi gốc No Such File Exception vẫn nằm trong cause.",
          "Chạy thật: [hello]. Thiếu file: lỗi gốc vẫn nằm trong cause.",
          lambda w: [IN("#lm-o1", "up", w("đọc được")), IN("#lm-o2", "up", w("Còn khi")), PULSE("#lm-o2", w("lỗi gốc"))]),
        B("Nhớ: lambda không ném được checked. Phải bọc lại, và luôn giữ lỗi gốc.",
          "Lambda không ném được checked: bọc lại, giữ lỗi gốc.",
          lambda w: [OUT(S("lm-eye", "lm-q", "lm-fix", "lm-o1", "lm-o2"), "blur", 0, 0.5), TYPE("#lm-t1", 0.3, 0.04), IN("#lm-t2", "blur", w("Phải bọc"))]),
    ]),
    # ------------------------------------------------------------ checked + @Transactional
    dict(id="rollback", world=(1920, 1080), hud="", cam="".join([
        head("rb", "02 · Checked và @Transactional", "Thanh toán lỗi, đơn vẫn được lưu?"),
        note("rb-def", 260, 430, 1400, "Transaction = các bước database chạy như một khối:\ncùng lưu (commit), hoặc cùng huỷ (rollback)", "cyan", 44),
        box("rb-tx", 80, 230, 940, 580, win("@Transactional checkout()"), "cyan", "panel"),
        tag("rb-s1", 120, 330, 860, 110, "1 · lưu đơn hàng", "cyan", 34),
        tag("rb-s2", 120, 470, 860, 110, "2 · trừ kho: 10 → 8", "cyan", 34),
        tag("rb-s3", 120, 610, 860, 110, "3 · charge() ✕ PaymentFailedException", "red", 30),
        note("rb-want", 1080, 250, 760, "Mong muốn: bước 3 lỗi\n→ huỷ luôn bước 1 và 2", "green", 36),
        tag("rb-chk", 1080, 440, 760, 100, "PaymentFailedException extends Exception", "amber", 26),
        titled("rb-rule", 1080, 580, 760, 230, "mặc định chỉ rollback với", "RuntimeException · Error", "checked → commit", "violet", 38),
        bigerr("rb-commit", 80, 860, 1760, "✕ COMMIT: 1 đơn chưa trả tiền, kho còn 8, khách vẫn nhận email xác nhận", 34),
        titled("rb-ejb", 1080, 250, 760, 260, "vì sao?", "quy ước cũ của EJB", "checked = kết quả đã báo trước", "violet", 42),
        tag("rb-f1", 1080, 560, 760, 100, "rollbackFor = PaymentFailedException.class", "green", 26),
        tag("rb-f2", 1080, 700, 760, 100, "gọn hơn: extends RuntimeException", "green", 30),
        note("rb-ok", 80, 860, 1760, "✓ rollback: 0 đơn, kho vẫn 10, không gửi email", "green", 36),
        el("rb-t1", 0, 400, 1920, None, letters("Nghiệp vụ: extends RuntimeException"), "take r"),
        el("rb-t2", 0, 540, 1920, None, "và đừng catch rồi nuốt lỗi trong method @Transactional", "take-sm r"),
    ]), beats=[
        B("Lý do thứ hai, và quan trọng nhất: Transactional.", "Lý do 2, quan trọng nhất: @Transactional.",
          lambda w: [IN("#rb-eye", "blur"), TYPE("#rb-q", 0.3, 0.04)]),
        B("Trước hết, transaction là một nhóm thao tác với database chạy như một khối. Hoặc tất cả được lưu, gọi là commit. Hoặc tất cả bị huỷ, gọi là rollback.",
          "Transaction: cùng lưu (commit), hoặc cùng huỷ (rollback).",
          lambda w: [*shrink("rb", 0), IN("#rb-def", "up", 0.5), PULSE("#rb-def", w("Hoặc tất cả bị"))]),
        B("Lab của ta có hàm checkout ba bước: lưu đơn hàng, trừ kho từ mười xuống tám, rồi gọi cổng thanh toán. Nếu thanh toán thất bại, ta muốn huỷ luôn hai bước trước.",
          "checkout(): lưu đơn, trừ kho, thanh toán. Thanh toán lỗi thì huỷ hết.",
          lambda w: [OUT("#rb-def", "blur", 0, 0.4), IN("#rb-tx", "blur", 0.4), IN("#rb-s1", "left", w("lưu đơn")), IN("#rb-s2", "left", w("trừ kho")),
                     IN("#rb-s3", "pop", w("rồi gọi")), IN("#rb-want", "right", w("Nếu thanh toán"))]),
        B("Nhưng lỗi thanh toán là Payment Failed Exception, kế thừa Exception, tức là checked. Mà Transactional mặc định chỉ rollback với Runtime Exception và Error.",
          "PaymentFailedException là checked. @Transactional chỉ rollback với RuntimeException và Error.",
          lambda w: [IN("#rb-chk", "up", w("Nhưng lỗi")), PULSE("#rb-chk", w("tức là checked")), IN("#rb-rule", "up", w("Mà Transactional")),
                     PULSE("#rb-rule", w("chỉ rollback"))]),
        B("Chạy thật trong lab: transaction vẫn commit. Đơn chưa trả tiền vẫn được lưu, kho còn tám, và khách còn nhận email xác nhận.",
          "Chạy thật: vẫn COMMIT. Đơn chưa trả tiền vẫn lưu, kho còn 8.",
          lambda w: [IN("#rb-commit", "up", w("transaction vẫn")), SHAKE("#rb-commit", w("Đơn chưa")), PULSE("#rb-s2", w("kho còn"))]),
        B("Vì sao Spring làm vậy? Nó giữ quy ước cũ của EJB: checked là một kết quả đã được báo trước, người gọi sẽ tự xử lý, nên phần việc đã làm vẫn được lưu.",
          "Quy ước cũ của EJB: checked là kết quả đã báo trước.",
          lambda w: [OUT(S("rb-want", "rb-chk", "rb-rule"), "blur", 0, 0.4), IN("#rb-ejb", "right", w("Nó giữ"))]),
        B("Cách sửa: thêm rollbackFor bằng Payment Failed Exception. Chạy lại: không có đơn nào, kho vẫn mười. Gọn hơn nữa là cho exception nghiệp vụ kế thừa Runtime Exception ngay từ đầu.",
          "Sửa: rollbackFor, hoặc gọn hơn: extends RuntimeException.",
          lambda w: [IN("#rb-f1", "pop", w("thêm rollbackFor")), OUT("#rb-commit", "blur", w("Chạy lại"), 0.4), IN("#rb-ok", "up", w("Chạy lại") + 0.3),
                     IN("#rb-f2", "pop", w("Gọn hơn"))]),
        B("Vì vậy trong dự án Spring, exception nghiệp vụ nên kế thừa Runtime Exception. Và đừng tự catch rồi nuốt lỗi trong hàm Transactional, vì như vậy Spring cũng commit.",
          "Nghiệp vụ: extends RuntimeException. Đừng catch rồi nuốt lỗi.",
          lambda w: [OUT(S("rb-eye", "rb-q", "rb-tx", "rb-s1", "rb-s2", "rb-s3", "rb-ejb", "rb-f1", "rb-f2", "rb-ok"), "blur", 0, 0.5),
                     TYPE("#rb-t1", 0.4, 0.035), IN("#rb-t2", "blur", w("Và đừng"))]),
    ]),
    # ------------------------------------------------------------ finally traps
    dict(id="finally", world=(1920, 1080), hud="", cam="".join([
        head("fn", "03 · Bẫy của finally", "Luôn chạy, nhưng có thể nói dối"),
        tag("fn-f1", 260, 230, 220, 90, "try", "cyan", 36),
        tag("fn-f2", 580, 230, 240, 90, "catch", "amber", 36),
        tag("fn-f3", 920, 230, 260, 90, "finally", "violet", 36),
        note("fn-note", 1260, 232, 600, "luôn chạy, trừ System.exit()\nhoặc JVM sập", "cyan", 30),
        cbox("fn-c1", 70, 380, 580, "returnInFinally()", "try { return 1; }\nfinally { return 2; }", "cyan", 32),
        cbox("fn-c2", 670, 380, 580, "swallowed()", "try {\n    throw new\n      IllegalStateException();\n}\nfinally { return 0; }", "cyan", 32),
        cbox("fn-c3", 1270, 380, 580, "counter()", "int x = 1;\ntry { return x; }\nfinally { x = 99; }", "cyan", 32),
        tag("fn-r1", 70, 790, 580, 100, "→ 2: finally ghi đè", "red", 32),
        tag("fn-r2", 670, 790, 580, 100, "→ 0, exception biến mất", "red", 32),
        tag("fn-r3", 1270, 790, 580, 100, "→ 1: giá trị đã chốt", "green", 32),
        el("fn-t1", 0, 400, 1920, None, letters("Không return, không throw trong finally"), "take r"),
        el("fn-t2", 0, 540, 1920, None, "finally chỉ để dọn tài nguyên, mà việc đó đã có try-with-resources", "take-sm r"),
        wires(arrow("fn-a1", [(485, 275), (575, 275)], "muted"), arrow("fn-a2", [(825, 275), (915, 275)], "muted")),
    ]), beats=[
        B("Phần ba: các bẫy của finally.", "Phần 3: các bẫy của finally.",
          lambda w: [IN("#fn-eye", "blur"), TYPE("#fn-q", 0.2, 0.04)]),
        B("Finally luôn chạy sau try và catch, kể cả khi có return hay exception. Chỉ trừ khi gọi System exit, hoặc JVM sập.",
          "finally luôn chạy sau try và catch, kể cả khi có return hay exception. Chỉ trừ System.exit() hoặc JVM sập.",
          lambda w: [*shrink("fn", 0), IN("#fn-f1", "pop", 0.5), *ARROW("fn-a1", 0.8, 0.3), IN("#fn-f2", "pop", 1.1),
                     *ARROW("fn-a2", 1.4, 0.3), IN("#fn-f3", "pop", 1.7), PULSE("#fn-f3", w("kể cả")), IN("#fn-note", "up", w("Chỉ trừ"))]),
        B("Bẫy thứ nhất: return trong khối finally ghi đè giá trị return của khối try.", "Bẫy 1: return trong finally ghi đè giá trị return của try.",
          lambda w: [IN("#fn-c1", "up", 0.3), IN("#fn-r1", "pop", w("ghi đè"))]),
        B("Bẫy thứ hai: nếu khối try ném exception, return trong finally nuốt mất nó. Bên gọi nhận số không như không có gì xảy ra.",
          "Bẫy 2: try ném exception, return trong finally nuốt mất nó. Bên gọi nhận 0 như không có gì xảy ra.",
          lambda w: [IN("#fn-c2", "up", 0.3), IN("#fn-r2", "pop", w("nuốt mất")), SHAKE("#fn-r2", w("Bên gọi"))]),
        B("Còn sửa biến trong finally thì không đổi được giá trị đã return. Kết quả vẫn là một.",
          "Còn sửa biến trong finally không đổi được giá trị đã return. Kết quả vẫn là 1.",
          lambda w: [IN("#fn-c3", "up", 0.3), IN("#fn-r3", "pop", w("Kết quả"))]),
        B("Quy tắc: không bao giờ return hay throw trong finally.", "Quy tắc: không bao giờ return hay throw trong finally.",
          lambda w: [OUT(S("fn-eye", "fn-q", "fn-f1", "fn-f2", "fn-f3", "fn-note", "fn-c1", "fn-c2", "fn-c3", "fn-r1", "fn-r2", "fn-r3") + ", " + AR("fn-a1", "fn-a2"), "blur", 0, 0.5),
                     TYPE("#fn-t1", 0.3, 0.03), IN("#fn-t2", "blur", 2.0)]),
    ]),
    # ------------------------------------------------------------ try-with-resources
    dict(id="twr", world=(1920, 1080), hud="", cam="".join([
        head("tw", "04 · try-with-resources", "Tự close, và không mất lỗi gốc"),
        cbox("tw-code", 70, 230, 1020, "Main.java",
             'try (Res a = new Res("A");\n     Res b = new Res("B")) {\n'
             '    throw new RuntimeException("body failed");\n}  // close() cũng ném lỗi', "cyan", 30),
        console("tw-con", 1140, 230, 710, TWR_OUT),
        tag("tw-k1", 1140, 690, 710, 90, "đóng ngược thứ tự mở", "violet", 32),
        cbox("tw-bad", 70, 570, 1020, "tự close trong finally",
             'try { body(); }        // ném "body failed"\nfinally { a.close(); } // ném "close failed A"', "red", 30),
        note("tw-br", 70, 830, 1020, "→ main: close failed A · lỗi gốc mất", "red", 34),
    ]), beats=[
        B("Phần bốn: cú pháp try with resources.", "Phần 4: try-with-resources.",
          lambda w: [IN("#tw-eye", "blur"), TYPE("#tw-q", 0.2, 0.04)]),
        B("Mọi resource implement AutoCloseable khai báo trong try sẽ tự động được close, kể cả khi có exception.",
          "Mọi resource implement AutoCloseable khai báo trong try (...) tự động được close, kể cả khi có exception.",
          lambda w: [*shrink("tw", 0), IN("#tw-code", "left", 0.4), IN("#tw-con", "right", w("khai báo")),
                     IN("#tw-con-1", "type1", w("tự động"), 0.3), IN("#tw-con-2", "type1", w("tự động") + 0.6, 0.3)]),
        B("Nhiều resource thì đóng theo thứ tự ngược lại: mở A rồi B, đóng B rồi A.",
          "Nhiều resource đóng theo thứ tự ngược lại: mở A rồi B, đóng B rồi A.",
          lambda w: [IN("#tw-con-3", "type1", w("đóng B"), 0.3), IN("#tw-con-4", "type1", w("rồi A."), 0.3), IN("#tw-k1", "pop", w("rồi A.") + 0.5)]),
        B("Nếu cả thân try và close đều lỗi, lỗi của thân try là lỗi chính. Lỗi lúc close được gắn vào dạng suppressed, không bị mất.",
          "Thân try và close() đều lỗi? Lỗi của thân try là lỗi chính, lỗi lúc close gắn vào dạng suppressed, không bị mất.",
          lambda w: [IN("#tw-con-5", "type1", w("lỗi của thân"), 0.3), PULSE("#tw-con-5", w("là lỗi chính")),
                     IN("#tw-con-6", "type1", w("suppressed"), 0.3), IN("#tw-con-7", "type1", w("suppressed") + 0.6, 0.3)]),
        B("Còn tự close trong finally thì lỗi lúc close đè mất lỗi gốc. Rất khó debug.",
          "Còn tự close() trong finally thì lỗi lúc close đè mất lỗi gốc. Rất khó debug.",
          lambda w: [IN("#tw-bad", "up", 0.3), IN("#tw-br", "up", w("đè mất")), SHAKE("#tw-br", w("Rất khó"))]),
    ]),
    # ------------------------------------------------------------ custom exceptions in Spring
    dict(id="custom", world=(1920, 1080), hud="", cam="".join([
        head("cu", "05 · Exception trong dự án Spring", "Ném ở service, xử lý tập trung"),
        titled("cu-base", 110, 230, 860, 170, "", "BusinessException", "extends RuntimeException · errorCode", "violet", 44),
        tag("cu-nf", 50, 480, 470, 90, "ResourceNotFoundException", "violet", 26),
        tag("cu-ib", 540, 480, 490, 90, "InsufficientBalanceException", "violet", 26),
        tag("cu-svc", 110, 700, 640, 100, "OrderService · throw", "amber", 34),
        cbox("cu-adv", 1080, 230, 780, "@RestControllerAdvice",
             "ResourceNotFoundException -> 404\nBusinessException         -> 422\nException                 -> 500", "cyan", 28),
        tag("cu-res", 1080, 560, 780, 100, 'HTTP 404 · {"code": "NOT_FOUND"}', "green", 30),
        cbox("cu-c1", 160, 240, 1600, "PaymentClient",
             'catch (IOException e) {\n    throw new PaymentFailedException("Gọi cổng thanh toán thất bại", e);\n}', "green", 32),
        note("cu-cause", 160, 520, 1600, "log: Caused by: java.io.IOException: timeout · còn stack trace gốc", "green", 32),
        tag("cu-ap1", 70, 620, 560, 90, "catch (Exception e) {}", "red", 28),
        tag("cu-ap2", 680, 620, 560, 90, "catch Exception ở tầng giữa", "red", 28),
        tag("cu-ap3", 1290, 620, 560, 90, "log rồi ném lại ở mọi tầng", "red", 28),
        tag("cu-good", 260, 750, 1400, 100, "log một lần ở tầng ngoài cùng, kèm traceId", "green", 32),
        wires(arrow("cu-a1", [(540, 400), (285, 476)], "violet"), arrow("cu-a2", [(540, 400), (785, 476)], "violet"),
              arrow("cu-a3", [(750, 750), (1040, 750), (1040, 360), (1074, 360)], "amber")),
    ]), beats=[
        B("Phần cuối: thiết kế exception trong dự án Spring.", "Phần 5: thiết kế exception trong dự án Spring.",
          lambda w: [IN("#cu-eye", "blur"), TYPE("#cu-q", 0.2, 0.04)]),
        B("Mẫu phổ biến: một exception gốc BusinessException kế thừa RuntimeException, mang mã lỗi, và các lớp con cụ thể.",
          "Mẫu phổ biến: BusinessException gốc kế thừa RuntimeException, mang mã lỗi, và các lớp con cụ thể.",
          lambda w: [*shrink("cu", 0), IN("#cu-base", "down", 0.5), *ARROW("cu-a1", w("các lớp con") - 0.4, 0.4), IN("#cu-nf", "up", w("các lớp con")),
                     *ARROW("cu-a2", w("các lớp con") - 0.1, 0.4), IN("#cu-ib", "up", w("các lớp con") + 0.3)]),
        B("Service chỉ ném exception. Một RestControllerAdvice bắt tập trung, và map sang HTTP status: không tìm thấy là bốn trăm lẻ bốn.",
          "Service chỉ ném. @RestControllerAdvice bắt tập trung và map sang HTTP status: không tìm thấy → 404.",
          lambda w: [IN("#cu-svc", "left", 0.2), *ARROW("cu-a3", w("Một Rest"), 0.7), IN("#cu-adv", "right", w("bắt tập trung")),
                     IN("#cu-res", "pop", w("không tìm thấy"))]),
        B("Khi bọc một exception kỹ thuật, luôn truyền exception gốc làm nguyên nhân, để log còn dòng caused by.",
          "Khi bọc exception kỹ thuật, luôn truyền exception gốc làm cause, để log còn dòng \"Caused by\".",
          lambda w: [OUT(S("cu-base", "cu-nf", "cu-ib", "cu-svc", "cu-adv", "cu-res") + ", " + AR("cu-a1", "cu-a2", "cu-a3"), "blur", 0, 0.45),
                     IN("#cu-c1", "up", 0.6), IN("#cu-cause", "up", w("để log"))]),
        B("Và tránh các anti pattern: nuốt exception, catch Exception ở tầng giữa, hay log rồi ném lại ở mọi tầng. Chỉ log một lần ở tầng ngoài cùng.",
          "Tránh: nuốt exception, catch Exception ở tầng giữa, log rồi ném lại ở mọi tầng. Chỉ log một lần ở tầng ngoài cùng.",
          lambda w: [IN("#cu-ap1", "pop", w("nuốt")), IN("#cu-ap2", "pop", w("catch Exception")), IN("#cu-ap3", "pop", w("hay log")),
                     IN("#cu-good", "up", w("Chỉ log"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt trong 5 dòng"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 160, 200 + i * 118, 1600, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Error", "lỗi của JVM, đừng catch"), ("Checked", "compiler ép xử lý, không đi qua lambda"),
                                      ("Nghiệp vụ", "extends RuntimeException để @Transactional rollback"),
                                      ("finally", "không return, không throw"), ("try-with-resources", "lỗi close thành suppressed")])],
        chip("ou-next", 660, 810, "Bài tiếp: HashMap Internals", "violet"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại: đừng catch Error. Checked thì compiler ép xử lý, và không đi qua được lambda. Exception nghiệp vụ nên là unchecked, để Transactional rollback. Không return trong finally. Và dùng try with resources để không mất lỗi gốc.",
          "Error · checked · nghiệp vụ unchecked · finally · try-with-resources.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("đừng catch")), IN("#ou-r1", "right", w("Checked thì")),
                     IN("#ou-r2", "right", w("Exception nghiệp vụ")), IN("#ou-r3", "right", w("Không return")), IN("#ou-r4", "right", w("Và dùng"))]),
        B("Bài sau ta sẽ mở bên trong HashMap: bucket, va chạm, và cách nó tự mở rộng.",
          "Bài sau: bên trong HashMap. Bucket, collision, và cách nó tự mở rộng.",
          lambda w: [IN("#ou-next", "pop", 0.4)]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.", "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          lambda w: [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
