"""I/O, Charset and Serialization explainer: try-with-resources, charset, big files, ByteBuffer, Serialization.

Every Java output comes from the lesson (web/src/data/lessons/java-io.ts), run on JDK 21:
try/finally shows only "close failed"; try-with-resources shows "thrown: work failed | suppressed: close failed";
"Việt Nam" = 8 characters = 10 bytes in UTF-8, read as ISO-8859-1 gives "Viá»t Nam";
58 MB file, -Xmx64m: readAllLines -> OutOfMemoryError (Java heap space), Files.lines counts 3000000 lines, limit(2) reads 2 lines;
ByteBuffer.allocate(16), 3 puts: position=3 limit=16 remaining=13, get() without flip gives 0; after flip position=0 limit=3 remaining=3;
Person with a new field: InvalidClassException (serialVersionUID 3778188202762978657 vs -2587110379539063025); explicit UID reads fine, name=An;
filter "com.myapp.*;!*" -> InvalidClassException filter status: REJECTED; transient password reads back null.
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



TOPICS = [("try-with-resources", "đóng đúng, giữ lỗi gốc"), ("Charset", "chữ không bị vỡ"), ("File lớn", "đọc theo luồng"),
          ("ByteBuffer", "bẫy flip()"), ("Serialization", "UID, transient, bảo mật")]

CELLS = [f"bb-c{i}" for i in range(16)]
RESULT = "#bb-take1, #bb-take2"

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Java Core · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("I/O, Charset, Serialization"), "h1 r", "font-size:104px"),
        *[box(f"hk-c{i}", 85 + i * 355, 420, 330, 300,
              f'<b style="font-size:{28 if i == 0 else 32}px">{n}</b><span style="font-size:28px;color:var(--muted);text-align:center">{d}</span>', "cyan", "card")
          for i, (n, d) in enumerate(TOPICS)],
        chip("hk-p1", 520, 850, "Code chạy thật", "green"),
        chip("hk-p2", 1130, 850, "Bẫy hay bị hỏi", "amber"),
        el("hk-t1", 0, 400, 1920, None, letters("Nhớ nguyên nhân"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "rồi mới nhớ cách sửa", "take-sm r"),
        wires(arrow("hk-a1", [(800, 882), (1110, 882)], "muted")),
    ]), beats=[
        B("Đọc ghi file nghe có vẻ đơn giản, nhưng người phỏng vấn rất hay hỏi những cái bẫy nằm ngay trong đó.",
          "Đọc ghi file: cái bẫy nằm ngay trong chuyện đơn giản.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Phần này gồm năm chủ đề: đóng tài nguyên bằng try with resources, charset, đọc file lớn, Byte Buffer, và Java Serialization.",
          "5 chủ đề I/O hay bị hỏi.",
          lambda w: [IN("#hk-c0", "pop", w("try with")), IN("#hk-c1", "pop", w("charset")), IN("#hk-c2", "pop", w("đọc file lớn")),
                     IN("#hk-c3", "pop", w("Byte Buffer")), IN("#hk-c4", "pop", w("và Java Serialization"))]),
        B("Mỗi chủ đề có code chạy thật, và một cái bẫy hay bị hỏi.",
          "Mỗi chủ đề: code chạy thật và bẫy hay bị hỏi.",
          lambda w: [IN("#hk-p1", "left", w("code chạy")), *ARROW("hk-a1", w("và một") - 0.5, 0.5), IN("#hk-p2", "pop", w("một cái bẫy"))]),
        B("Hãy nhớ nguyên nhân của từng lỗi, rồi mới nhớ cách sửa.",
          "Nhớ nguyên nhân, rồi mới nhớ cách sửa.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", w("rồi mới"))]),
    ]),
    # ------------------------------------------------------------ try-with-resources
    dict(id="twr", world=(1920, 1080), hud="", cam="".join([
        head("tw", "try-with-resources", "Đóng tài nguyên, giữ lỗi gốc"),
        rule("tw-rule", "Tự đóng theo thứ tự ngược, và giữ exception gốc", "Lỗi của close() thành suppressed exception gắn vào lỗi chính"),
        cbox("tw-bad", 90, 260, 920, "try-finally.java",
             "try {\n"
             "  throw new RuntimeException(\"work failed\");\n"
             "} finally {\n"
             "  r.close();   // close() cũng ném lỗi\n"
             "}", "violet", 30),
        bigerr("tw-err", 1080, 330, 740, "✕ Chỉ thấy: close failed<br>work failed bị mất", 36),
        cbox("tw-good", 90, 260, 920, "try-with-resources.java",
             "try (Res r = new Res()) {\n"
             "  throw new RuntimeException(\"work failed\");\n"
             "}", "violet", 30),
        note("tw-ok", 1080, 320, 740, "thrown: work failed\nsuppressed: close failed", "green", 36),
        tag("tw-o1", 160, 330, 400, 110, "mở A", "cyan", 36),
        tag("tw-o2", 680, 330, 400, 110, "mở B", "cyan", 36),
        tag("tw-o3", 1200, 330, 540, 110, "chạy thân try", "amber", 36),
        tag("tw-c1", 680, 560, 400, 110, "đóng B trước", "green", 36),
        tag("tw-c2", 160, 560, 400, 110, "rồi đóng A", "green", 36),
        note("tw-why", 160, 760, 1600, "B thường dựa trên A:\nStatement dựa trên Connection", "green", 36),
        el("tw-t1", 0, 400, 1920, None, letters("Đừng viết finally tay"), "take r"),
        el("tw-t2", 0, 540, 1920, None, "mặc định try-with-resources cho mọi AutoCloseable · quên đóng là rò file descriptor", "take-sm r"),
        wires(arrow("tw-a1", [(565, 385), (675, 385)], "muted"), arrow("tw-a2", [(1085, 385), (1195, 385)], "muted"),
              arrow("tw-a3", [(675, 615), (565, 615)], "green")),
    ]), beats=[
        B("Mọi tài nguyên cần đóng, như file, kết nối hay stream, nên dùng try with resources. Nó tự gọi close theo thứ tự ngược với thứ tự khai báo, và giữ lại exception gốc.",
          "try-with-resources: đóng ngược thứ tự, giữ lỗi gốc.",
          lambda w: [IN("#tw-eye", "blur"), TYPE("#tw-q", 0.2, 0.05), IN("#tw-rule", "up", w("Nó tự gọi") + 0.3)]),
        B("Xem try finally trước. Thân try ném work failed, rồi close trong finally cũng ném lỗi. Đã chạy: bạn chỉ thấy close failed, còn work failed, lỗi thật sự, đã bị mất.",
          "try / finally: lỗi của close() đè mất lỗi gốc.",
          lambda w: [OUT("#tw-rule", "blur", 0, 0.4), *shrink("tw", 0), IN("#tw-bad", "blur", 0.5, 0.7), PULSE("#tw-bad", w("close trong finally")),
                     IN("#tw-err", "up", w("Đã chạy")), SHAKE("#tw-err", w("Đã chạy") + 0.6)]),
        B("Với try with resources, đã chạy: exception thấy được là work failed. Còn lỗi close failed nằm trong get Suppressed, một exception phụ gắn vào exception chính.",
          "Thấy work failed; close failed nằm trong getSuppressed().",
          lambda w: [OUT(S("tw-bad", "tw-err"), "blur", 0, 0.5), IN("#tw-good", "blur", 0.6, 0.7), IN("#tw-ok", "up", w("đã chạy")), PULSE("#tw-ok", w("get Suppressed"))]),
        B("Khi mở nhiều tài nguyên, Java đóng theo thứ tự ngược. Mở A rồi mở B thì đóng B trước, vì B thường dựa trên A, ví dụ Statement dựa trên Connection.",
          "Mở A rồi B: đóng B trước, rồi A.",
          lambda w: [OUT(S("tw-good", "tw-ok"), "blur", 0, 0.5), IN("#tw-o1", "up", 0.6), *ARROW("tw-a1", 0.7, 0.4), IN("#tw-o2", "up", w("mở B")), *ARROW("tw-a2", w("Java đóng") - 0.8, 0.4), IN("#tw-o3", "up", w("Java đóng") - 0.6),
                     IN("#tw-c1", "up", w("đóng B")), *ARROW("tw-a3", w("vì B") - 0.5, 0.4), IN("#tw-c2", "up", w("vì B")), IN("#tw-why", "up", w("ví dụ"))]),
        B("Tài nguyên phải implement Auto Closeable. Quên đóng thì rò file descriptor và kết nối, nên hãy mặc định dùng try with resources, không viết finally bằng tay.",
          "Mặc định dùng try-with-resources.",
          lambda w: [DIM(S("tw-eye", "tw-q", "tw-o1", "tw-o2", "tw-o3", "tw-c1", "tw-c2", "tw-why") + ", " + AR("tw-a1", "tw-a2", "tw-a3"), w("hãy mặc định") - 0.5, 0.07),
                     TYPE("#tw-t1", w("hãy mặc định"), 0.05), IN("#tw-t2", "blur", w("không viết"))]),
    ]),
    # ------------------------------------------------------------ charset
    dict(id="charset", world=(1920, 1080), hud="", cam="".join([
        head("cs", "Charset", "Chữ tiếng Việt vỡ vì đâu"),
        rule("cs-rule", "Máy lưu byte, charset quyết định byte nào là chữ nào", "Đọc byte UTF-8 bằng charset sai sẽ ra chữ vỡ (mojibake)"),
        tag("cs-s", 110, 290, 600, 110, "\"Việt Nam\" · 8 ký tự", "cyan", 34),
        tag("cs-u", 830, 290, 300, 110, "UTF-8", "violet", 36),
        tag("cs-n", 1250, 290, 560, 110, "10 byte", "green", 40),
        note("cs-ệ", 110, 450, 1700, "chữ ệ cần 3 byte, chữ không dấu chỉ 1 byte", "green", 36),
        titled("cs-bw", 110, 600, 780, 220, "đọc bằng ISO-8859-1", "Viá»t Nam", "chữ vỡ", "red", 52),
        titled("cs-gd", 1030, 600, 780, 220, "đọc bằng UTF-8", "Việt Nam", "đúng chữ", "green", 52),
        titled("cs-d1", 110, 300, 780, 230, "trước JDK 18", "theo hệ điều hành", "cùng file, chữ khác tuỳ máy", "amber", 40),
        titled("cs-d2", 1030, 300, 780, 230, "từ JDK 18", "UTF-8", "trên mọi hệ điều hành", "green", 40),
        cbox("cs-code", 110, 290, 1700, "Charset.java",
             "new String(bytes, StandardCharsets.UTF_8);\n"
             "Files.readString(path, StandardCharsets.UTF_8);", "violet", 36),
        note("cs-len", 110, 580, 1700, "String.length() đếm ký tự, không phải byte\nGiới hạn cột database hay header: hãy đếm byte", "green", 36),
        el("cs-t1", 0, 400, 1920, None, letters("Luôn chỉ rõ charset"), "take r"),
        el("cs-t2", 0, 540, 1920, None, "kết quả không phụ thuộc máy chạy", "take-sm r"),
        wires(arrow("cs-a1", [(715, 345), (825, 345)], "muted"), arrow("cs-a2", [(1135, 345), (1245, 345)], "muted")),
    ]), beats=[
        B("Đóng file đúng rồi, mà đọc ra chữ vỡ thì sao? Máy tính chỉ lưu byte, còn charset quyết định byte nào là chữ nào.",
          "Byte là dữ liệu, charset quyết định byte nào là chữ nào.",
          lambda w: [IN("#cs-eye", "blur"), TYPE("#cs-q", 0.2, 0.05), IN("#cs-rule", "up", w("Máy tính") + 0.3)]),
        B("Chuỗi Việt Nam có tám ký tự. Ghi bằng UTF tám thì chiếm mười byte, vì chữ ệ cần ba byte, còn chữ không dấu chỉ một byte.",
          "8 ký tự \"Việt Nam\" = 10 byte trong UTF-8.",
          lambda w: [OUT("#cs-rule", "blur", 0, 0.4), *shrink("cs", 0), IN("#cs-s", "up", 0.5), *ARROW("cs-a1", w("Ghi bằng") - 0.3, 0.4), IN("#cs-u", "up", w("Ghi bằng")),
                     *ARROW("cs-a2", w("chiếm") - 0.4, 0.4), IN("#cs-n", "pop", w("mười byte")), IN("#cs-ệ", "up", w("vì chữ"))]),
        B("Giờ đọc đúng những byte đó bằng charset sai. Đã chạy: đọc bằng ISO tám tám năm chín một ra chữ vỡ, còn đọc bằng UTF tám thì ra đúng Việt Nam.",
          "ISO-8859-1: Viá»t Nam. UTF-8: Việt Nam.",
          lambda w: [IN("#cs-bw", "up", w("Đã chạy")), SHAKE("#cs-bw", w("Đã chạy") + 0.6), IN("#cs-gd", "up", w("còn đọc bằng")), PULSE("#cs-gd", w("đúng Việt"))]),
        B("Từ JDK mười tám, charset mặc định là UTF tám trên mọi hệ điều hành. Trước đó nó lấy theo hệ điều hành, nên cùng một file có thể ra chữ khác nhau tuỳ máy.",
          "JDK 18+: mặc định UTF-8. Trước đó: tuỳ hệ điều hành.",
          lambda w: [OUT(S("cs-s", "cs-u", "cs-n", "cs-ệ", "cs-bw", "cs-gd") + ", " + AR("cs-a1", "cs-a2"), "blur", 0, 0.5),
                     IN("#cs-d2", "up", 0.6), IN("#cs-d1", "up", w("Trước đó"))]),
        B("Vì vậy hãy luôn chỉ rõ StandardCharsets UTF tám. Và nhớ, length của String đếm ký tự, còn độ dài byte phụ thuộc charset, nên khi giới hạn cột database hay header, hãy đếm byte.",
          "Chỉ rõ UTF-8; giới hạn kích thước thì đếm byte.",
          lambda w: [OUT(S("cs-d1", "cs-d2"), "blur", 0, 0.5), IN("#cs-code", "blur", 0.6, 0.7), PULSE("#cs-code", w("StandardCharsets")), IN("#cs-len", "up", w("Và nhớ"))]),
        B("Dù JDK mới đã mặc định UTF tám, code chạy trên nhiều phiên bản vẫn nên chỉ rõ charset.",
          "Chỉ rõ charset: kết quả không phụ thuộc máy.",
          lambda w: [DIM(S("cs-eye", "cs-q", "cs-code", "cs-len"), 0, 0.07), TYPE("#cs-t1", 0.3, 0.05), IN("#cs-t2", "blur", w("code chạy") + 0.5)]),
    ]),
    # ------------------------------------------------------------ big file
    dict(id="big-file", world=(1920, 1080), hud="", cam="".join([
        head("bf", "File lớn", "Đọc theo luồng, đừng nạp hết"),
        rule("bf-rule", "File lớn hơn bộ nhớ thì sao?", "readAllLines nạp cả file, Files.lines đọc từng dòng khi cần"),
        tag("bf-f", 110, 280, 760, 110, "File 58 MB · 3 triệu dòng", "cyan", 34),
        tag("bf-h", 1050, 280, 760, 110, "Heap giới hạn -Xmx64m", "amber", 34),
        cbox("bf-cb", 90, 470, 1100, "readAllLines.java",
             "List<String> lines = Files.readAllLines(path);", "violet", 30),
        bigerr("bf-err", 1250, 480, 570, "✕ OutOfMemoryError<br>Java heap space", 34),
        note("bf-why", 110, 700, 1700, "Mỗi dòng là một String nên bộ nhớ tốn hơn kích thước file", "red", 36),
        cbox("bf-cg", 90, 470, 1100, "Files.lines.java",
             "try (Stream<String> s = Files.lines(path)) {\n"
             "  long n = s.count();\n"
             "}", "violet", 30),
        note("bf-ok", 1250, 480, 570, "✓ đếm đúng 3000000 dòng\ncùng giới hạn bộ nhớ", "green", 32),
        tag("bf-lim", 1250, 680, 570, 100, "limit(2): chỉ đọc 2 dòng đầu", "cyan", 28),
        card("bf-k1", 90, 280, 540, 300, "Byte stream", "InputStream, OutputStream: byte thô cho ảnh, file nén", "cyan", 44, 28),
        card("bf-k3", 690, 280, 540, 300, "InputStreamReader", "cầu nối: giải mã byte bằng charset thành ký tự", "violet", 40, 28),
        card("bf-k2", 1290, 280, 540, 300, "Char stream", "Reader, Writer: đọc ghi ký tự, nên cần charset", "cyan", 44, 28),
        note("bf-bu", 110, 690, 1700, "BufferedReader bọc ngoài một Reader:\nđọc một khối lớn mỗi lần, nhanh hơn nhiều", "green", 36),
        el("bf-t1", 0, 400, 1920, None, letters("Dữ liệu có lớn hơn RAM không?"), "take r"),
        el("bf-t2", 0, 540, 1920, None, "Files.lines trong try-with-resources · đọc từng dòng · bộ nhớ gần như cố định", "take-sm r"),
        wires(arrow("bf-a1", [(875, 335), (1045, 335)], "muted"),
              arrow("bf-b1", [(635, 430), (685, 430)], "violet"), arrow("bf-b2", [(1235, 430), (1285, 430)], "violet")),
    ]), beats=[
        B("Đọc đúng chữ rồi. Nếu file to gần bằng, hoặc to hơn bộ nhớ thì sao? Read All Lines nạp toàn bộ file vào bộ nhớ, còn Files lines đọc từng dòng khi cần.",
          "readAllLines nạp cả file; Files.lines đọc từng dòng.",
          lambda w: [IN("#bf-eye", "blur"), TYPE("#bf-q", 0.2, 0.05), IN("#bf-rule", "up", w("Read All") + 0.3)]),
        B("Thử với một file năm mươi tám mê ga bai, ba triệu dòng, trong khi heap bị giới hạn ở sáu mươi tư mê ga bai.",
          "File 58 MB, 3 triệu dòng; heap 64 MB.",
          lambda w: [OUT("#bf-rule", "blur", 0, 0.4), *shrink("bf", 0), IN("#bf-f", "up", 0.5), *ARROW("bf-a1", w("trong khi") - 0.5, 0.4), IN("#bf-h", "up", w("trong khi"))]),
        B("Gọi read All Lines. Đã chạy: Out Of Memory Error, Java heap space. Mỗi dòng thành một String, nên bộ nhớ tốn nhiều hơn cả kích thước file trên đĩa.",
          "readAllLines: OutOfMemoryError (Java heap space).",
          lambda w: [IN("#bf-cb", "blur", 0.3, 0.7), IN("#bf-err", "up", w("Đã chạy")), SHAKE("#bf-err", w("Đã chạy") + 0.6), IN("#bf-why", "up", w("Mỗi dòng"))]),
        B("Dùng Files lines trong try with resources thì đếm đúng ba triệu dòng, trong cùng giới hạn bộ nhớ. Và limit hai chỉ đọc hai dòng đầu, không đọc cả file. Nhớ đóng Stream, nếu không sẽ rò file descriptor.",
          "Files.lines: đếm đủ 3000000 dòng, bộ nhớ gần như cố định.",
          lambda w: [OUT(S("bf-cb", "bf-err", "bf-why"), "blur", 0, 0.5), IN("#bf-cg", "blur", 0.6, 0.7), IN("#bf-ok", "up", w("đếm đúng")), IN("#bf-lim", "up", w("limit hai"))]),
        B("Các class I O chia thành hai họ. Byte stream đọc ghi byte thô, dùng cho ảnh hay file nén. Char stream đọc ghi ký tự, nên cần charset. Input Stream Reader là cầu nối, giải mã byte thành ký tự.",
          "Byte stream, Char stream, và cầu nối InputStreamReader.",
          lambda w: [OUT(S("bf-f", "bf-h", "bf-cg", "bf-ok", "bf-lim") + ", " + AR("bf-a1"), "blur", 0, 0.5),
                     IN("#bf-k1", "up", w("Byte stream") + 0.2), IN("#bf-k2", "up", w("Char stream") + 0.2), *ARROW("bf-b1", w("Input Stream Reader"), 0.3), IN("#bf-k3", "up", w("Input Stream Reader") + 0.3), *ARROW("bf-b2", w("Input Stream Reader") + 0.5, 0.3)]),
        B("Buffered Reader bọc ngoài một Reader khác, đọc một khối lớn mỗi lần thay vì gọi hệ điều hành cho từng ký tự, nên nhanh hơn nhiều.",
          "BufferedReader: đọc theo khối, nhanh hơn nhiều.",
          lambda w: [IN("#bf-bu", "up", 0.3), PULSE("#bf-bu", w("một khối lớn"))]),
        B("Luôn tự hỏi: dữ liệu có thể lớn hơn bộ nhớ không? Nếu có, đọc theo luồng và nhớ đóng stream.",
          "Dữ liệu có thể lớn hơn RAM không?",
          lambda w: [DIM(S("bf-eye", "bf-q", "bf-k1", "bf-k2", "bf-k3", "bf-bu") + ", " + AR("bf-b1", "bf-b2"), 0, 0.07),
                     TYPE("#bf-t1", 0.4, 0.04), IN("#bf-t2", "blur", w("Nếu có"))]),
    ]),
    # ------------------------------------------------------------ bytebuffer
    dict(id="bytebuffer", world=(1920, 1080), hud="", cam="".join([
        head("bb", "ByteBuffer", "Bẫy flip()"),
        rule("bb-rule", "Buffer có ba con số: position, limit, capacity", "NIO đọc ghi từng khối byte qua channel vào một ByteBuffer"),
        *[box(f"bb-c{i}", 160 + i * 100, 330, 92, 100, f'<span class="mono" style="font-size:34px">{i + 1 if i < 3 else 0}</span>', "cyan" if i < 3 else "violet")
          for i in range(16)],
        tag("bb-pos", 360, 500, 300, 80, "position = 3", "amber", 30),
        tag("bb-lim", 1460, 500, 300, 80, "limit = 16", "amber", 30),
        tag("bb-pos2", 106, 500, 300, 80, "position = 0", "green", 30),
        tag("bb-lim2", 440, 500, 300, 80, "limit = 3", "green", 30),
        note("bb-rem", 160, 640, 1600, "capacity 16 · remaining 13", "green", 34),
        bigerr("bb-err", 160, 700, 1600, "✕ get() đọc ô số 3, ô chưa ghi: ra 0, không có lỗi nào báo cho bạn", 34),
        note("bb-ok", 160, 700, 1600, "✓ sau flip: position 0, limit 3, remaining 3\nđọc đúng 3 byte vừa ghi", "green", 34),
        tag("bb-cl", 160, 640, 600, 100, "clear(): xoá hết", "cyan", 32),
        tag("bb-cp", 820, 640, 940, 100, "compact(): giữ phần chưa đọc", "cyan", 32),
        note("bb-zc", 160, 800, 1600, "FileChannel.transferTo: chép giữa các kênh,\nkhông đưa dữ liệu qua bộ nhớ của ứng dụng", "green", 32),
        el("bb-t1", 0, 400, 1920, None, letters("Ghi xong thì flip"), "take r"),
        el("bb-t2", 0, 540, 1920, None, "đọc xong thì clear hoặc compact · quên flip là đọc sai vùng, không lỗi", "take-sm r"),
        wires(arrow("bb-ap", [(510, 495), (510, 440)], "amber"), arrow("bb-al", [(1706, 495), (1706, 440)], "amber"),
              arrow("bb-ap2", [(206, 495), (206, 440)], "green"), arrow("bb-al2", [(456, 495), (456, 440)], "green")),
    ]), beats=[
        B("Ở tầng thấp hơn, NIO đọc ghi qua channel, mỗi lần cả một khối byte vào một Byte Buffer. Buffer có ba con số: position là vị trí hiện tại, limit là giới hạn, và capacity là sức chứa.",
          "ByteBuffer: position, limit, capacity.",
          lambda w: [IN("#bb-eye", "blur"), TYPE("#bb-q", 0.2, 0.05), IN("#bb-rule", "up", w("Buffer có ba") + 0.3)]),
        B("Cấp một buffer dung lượng mười sáu rồi ghi ba byte: một, hai, ba. Lúc này position là ba, limit là mười sáu, còn lại mười ba ô.",
          "allocate(16), put 3 byte: position=3, limit=16.",
          lambda w: [OUT("#bb-rule", "blur", 0, 0.4), *shrink("bb", 0), IN(S(*CELLS), "pop", 0.5, 0.35, 0.05),
                     IN("#bb-pos", "up", w("Lúc này")), *ARROW("bb-ap", w("Lúc này") + 0.3, 0.3), IN("#bb-lim", "up", w("limit là")), *ARROW("bb-al", w("limit là") + 0.3, 0.3), IN("#bb-rem", "up", w("còn lại") - 0.6, 0.45)]),
        B("Nếu gọi get ngay mà quên flip, đã chạy: get đọc ô ở vị trí ba, là ô chưa ghi, nên ra số không. Không có lỗi nào báo cho bạn biết.",
          "Quên flip(): get() đọc ô chưa ghi, ra 0.",
          lambda w: [OUT("#bb-rem", "blur", 0.4, 0.4), PULSE("#bb-c3", w("ô ở vị trí")), IN("#bb-err", "up", w("nên ra")), SHAKE("#bb-err", w("nên ra") + 0.6)]),
        B("Gọi flip: limit đặt bằng chỗ đã ghi, position về không. Đã chạy: position không, limit ba, remaining ba, đọc đúng ba byte vừa ghi.",
          "flip(): position=0, limit=3, đọc đúng 3 byte.",
          lambda w: [OUT(S("bb-err", "bb-pos", "bb-lim") + ", " + AR("bb-ap", "bb-al"), "blur", 0, 0.5),
                     IN("#bb-pos2", "up", 0.7), *ARROW("bb-ap2", 0.9, 0.3), IN("#bb-lim2", "up", w("limit đặt") + 0.2), *ARROW("bb-al2", w("limit đặt") + 0.5, 0.3),
                     DIM(S(*CELLS[3:]), w("Đã chạy"), 0.25), IN("#bb-ok", "up", w("Đã chạy"))]),
        B("Muốn ghi tiếp thì gọi clear để xoá hết, hoặc compact để giữ phần chưa đọc. NIO còn có transfer To, chép giữa các kênh mà không đưa dữ liệu qua bộ nhớ của ứng dụng, dùng khi gửi file lớn.",
          "clear() / compact() để ghi tiếp; transferTo cho file lớn.",
          lambda w: [OUT("#bb-ok", "blur", 0, 0.4), IN("#bb-cl", "up", w("gọi clear")), IN("#bb-cp", "up", w("hoặc compact")), IN("#bb-zc", "up", w("NIO còn"))]),
        B("Ghi xong thì flip, đọc xong thì clear. Hầu hết lỗi Byte Buffer là quên chuyển chế độ.",
          "Ghi xong thì flip, đọc xong thì clear.",
          lambda w: [DIM(S("bb-eye", "bb-q", "bb-pos2", "bb-lim2", "bb-cl", "bb-cp", "bb-zc", *CELLS[:3]) + ", " + AR("bb-ap2", "bb-al2"), 0, 0.07),
                     OUT(S(*CELLS[3:]), "fade", 0, 0.3), TYPE("#bb-t1", 0.3, 0.05), IN("#bb-t2", "blur", w("Hầu hết"))]),
    ]),
    # ------------------------------------------------------------ serialization
    dict(id="serialization", world=(1920, 1080), hud="", cam="".join([
        head("sr", "Java Serialization", "Object thành byte, và những cái bẫy"),
        rule("sr-rule", "Serializable biến object thành byte", "Nhớ ba điều: transient, serialVersionUID, dữ liệu không tin cậy"),
        cbox("sr-code", 90, 260, 900, "Person.java",
             "class Person implements Serializable {\n"
             "  String name = \"An\";\n"
             "  transient String password;\n"
             "}", "violet", 28),
        titled("sr-n", 1060, 260, 760, 130, "", "name", "được lưu", "green", 36),
        titled("sr-pw", 1060, 420, 760, 130, "", "password", "transient: không được lưu", "amber", 36),
        tag("sr-rb", 1060, 600, 760, 100, "đọc lại: password = null", "green", 32),
        tag("sr-u1", 110, 270, 400, 120, "không khai báo UID", "amber", 30),
        tag("sr-u2", 620, 270, 560, 120, "Java tự hash cấu trúc class", "violet", 30),
        tag("sr-u3", 1290, 270, 520, 120, "thêm field: hash đổi", "red", 30),
        bigerr("sr-ie", 110, 450, 1700, "✕ InvalidClassException: local class incompatible<br>stream 3778188202762978657 ≠ local -2587110379539063025", 32),
        cbox("sr-fx", 110, 650, 1000, "Person.java",
             "private static final long serialVersionUID = 1L;", "violet", 30),
        note("sr-fok", 1160, 670, 660, "✓ đọc được file cũ\nfield mới có giá trị mặc định", "green", 32),
        tag("sr-g1", 110, 300, 340, 120, "byte từ ngoài", "amber", 32),
        tag("sr-g2", 570, 300, 340, 120, "class bất kỳ", "cyan", 32),
        tag("sr-g3", 1030, 300, 340, 120, "readObject nối nhau", "violet", 28),
        tag("sr-g4", 1490, 300, 320, 120, "chạy lệnh tuỳ ý", "red", 30),
        cbox("sr-ft", 110, 520, 1700, "ObjectInputFilter",
             "in.setObjectInputFilter(ObjectInputFilter.Config.createFilter(\"com.myapp.*;!*\"));", "violet", 28),
        tag("sr-rj", 110, 770, 820, 100, "class ngoài com.myapp: REJECTED", "red", 30),
        note("sr-js", 980, 780, 840, "Lưu trữ và API: ưu tiên JSON hoặc Protobuf", "green", 32),
        el("sr-t1", 0, 400, 1920, None, letters("Khai báo UID, lọc dữ liệu lạ"), "take r"),
        el("sr-t2", 0, 540, 1920, None, "transient cho dữ liệu nhạy cảm · API và lưu trữ: ưu tiên JSON", "take-sm r"),
        wires(arrow("sr-b1", [(515, 330), (615, 330)], "muted"), arrow("sr-b2", [(1185, 330), (1285, 330)], "muted"),
              arrow("sr-c1", [(455, 360), (565, 360)], "muted"), arrow("sr-c2", [(915, 360), (1025, 360)], "muted"), arrow("sr-c3", [(1375, 360), (1485, 360)], "muted")),
    ]), beats=[
        B("Giờ đến chuyện ghi nguyên một object xuống đĩa. Serializable biến object thành byte, và bạn cần nhớ ba điều: transient, serial Version UID, và dữ liệu không tin cậy.",
          "Serializable: transient, serialVersionUID, dữ liệu không tin cậy.",
          lambda w: [IN("#sr-eye", "blur"), TYPE("#sr-q", 0.2, 0.04), IN("#sr-rule", "up", w("Serializable biến") + 0.3)]),
        B("Field đánh dấu transient không được ghi ra byte, ví dụ password. Đã chạy: đọc lại, password là null, nên không bị lộ, còn name vẫn là An.",
          "transient: không được lưu. Đọc lại: password = null.",
          lambda w: [OUT("#sr-rule", "blur", 0, 0.4), *shrink("sr", 0), IN("#sr-code", "blur", 0.5, 0.7), IN("#sr-n", "up", w("Đã chạy")), IN("#sr-pw", "up", w("password là") - 0.2),
                     PULSE("#sr-pw", w("password là")), IN("#sr-rb", "pop", w("nên không bị lộ"))]),
        B("Nếu bạn không khai báo serial Version UID, Java tự tính nó bằng một hash của cấu trúc class. Thêm một field là hash đổi, và lúc đọc, hai số khác nhau thì Java từ chối. Đã chạy: Invalid Class Exception, dữ liệu cũ không đọc được.",
          "Thêm field: UID tự tính đổi, InvalidClassException.",
          lambda w: [OUT(S("sr-code", "sr-n", "sr-pw", "sr-rb"), "blur", 0, 0.5), IN("#sr-u1", "up", 0.6), *ARROW("sr-b1", 0.8, 0.3), IN("#sr-u2", "up", w("hash của") - 0.3), *ARROW("sr-b2", w("Thêm một") - 0.5, 0.3), IN("#sr-u3", "up", w("Thêm một")),
                     IN("#sr-ie", "up", w("Đã chạy")), SHAKE("#sr-ie", w("Đã chạy") + 0.6)]),
        B("Cách sửa là khai báo serial Version UID rõ ràng. Đã chạy: file cũ đọc được, và field mới nhận giá trị mặc định.",
          "Khai báo serialVersionUID: đọc được file cũ.",
          lambda w: [IN("#sr-fx", "blur", 0.3, 0.7), PULSE("#sr-fx", w("rõ ràng")), IN("#sr-fok", "up", w("Đã chạy"))]),
        B("Còn đọc dữ liệu lạ thì nguy hiểm. Khi deserialize, Java tạo object của bất kỳ class nào ghi trong byte, rồi gọi read Object của nó. Kẻ tấn công nối các class có sẵn, gọi là gadget chain, để chạy lệnh tuỳ ý.",
          "Dữ liệu lạ: gadget chain chạy lệnh tuỳ ý.",
          lambda w: [OUT(S("sr-u1", "sr-u2", "sr-u3", "sr-ie", "sr-fx", "sr-fok") + ", " + AR("sr-b1", "sr-b2"), "blur", 0, 0.5),
                     IN("#sr-g1", "up", 0.6), *ARROW("sr-c1", w("tạo object") - 0.5, 0.3), IN("#sr-g2", "up", w("tạo object")), *ARROW("sr-c2", w("gọi read") - 0.4, 0.3), IN("#sr-g3", "up", w("gọi read")),
                     *ARROW("sr-c3", w("Kẻ tấn công") - 0.2, 0.3), IN("#sr-g4", "pop", w("chạy lệnh")), SHAKE("#sr-g4", w("chạy lệnh") + 0.4)]),
        B("Cách phòng là đặt bộ lọc. Mẫu com my app chấm sao, chấm than sao, nghĩa là chỉ cho phép class trong gói com my app, từ chối mọi class khác. Đã chạy: class lạ bị REJECTED. Với lưu trữ và API, hãy ưu tiên JSON hoặc Protobuf.",
          "ObjectInputFilter: chỉ cho phép class mong đợi. Ưu tiên JSON.",
          lambda w: [IN("#sr-ft", "blur", 0.3, 0.7), PULSE("#sr-ft", w("Mẫu com")), IN("#sr-rj", "up", w("Đã chạy")), IN("#sr-js", "up", w("Với lưu trữ"))]),
        B("Tóm lại: khai báo serial Version UID, dùng transient cho dữ liệu nhạy cảm, và đừng đọc thẳng dữ liệu không tin cậy.",
          "UID tường minh, transient, bộ lọc.",
          lambda w: [DIM(S("sr-eye", "sr-q", "sr-g1", "sr-g2", "sr-g3", "sr-g4", "sr-ft", "sr-rj", "sr-js") + ", " + AR("sr-c1", "sr-c2", "sr-c3"), 0, 0.07),
                     TYPE("#sr-t1", 0.3, 0.04), IN("#sr-t2", "blur", w("dùng transient"))]),
    ]),
    # ------------------------------------------------------------ cheat sheet
    dict(id="bang-nho", world=(1920, 1080), hud="", cam="".join([
        head("bn", "Bảng nhớ I/O", "Những câu nên nói ra miệng"),
        *[box(f"bn-r{i}", 130, 260 + i * 120, 1660, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("try-with-resources", "Đóng tài nguyên, giữ lỗi gốc"),
                                      ("Charset", "Luôn chỉ rõ UTF-8"),
                                      ("File lớn", "Đọc theo luồng"),
                                      ("ByteBuffer", "flip() để đọc"),
                                      ("Serialization", "UID, transient, bộ lọc")])],
        tag("bn-qq", 160, 280, 1600, 160, "Nhận object tuần tự hoá từ bên ngoài hệ thống. Nên làm gì?", "amber", 36),
        tag("bn-a1", 160, 540, 780, 200, "✕ Đọc thẳng bằng ObjectInputStream", "red", 32),
        tag("bn-a2", 980, 540, 780, 200, "✓ Dùng JSON, hoặc ObjectInputFilter chỉ cho phép class mong đợi", "green", 30),
        el("bn-t1", 0, 400, 1920, None, letters("Dữ liệu ngoài là dữ liệu lạ"), "take r"),
        el("bn-t2", 0, 540, 1920, None, "tránh Serialization · hoặc đặt bộ lọc class", "take-sm r"),
    ]), beats=[
        B("Bảng nhớ I O. Try with resources: đóng tài nguyên và giữ lỗi gốc. Charset: luôn chỉ rõ UTF tám. File lớn: đọc theo luồng.",
          "try-with-resources · Charset · File lớn.",
          lambda w: [IN("#bn-eye", "blur"), TYPE("#bn-q", 0.2, 0.05), *shrink("bn", 0.2),
                     IN("#bn-r0", "right", w("Try with")), IN("#bn-r1", "right", w("Charset")), IN("#bn-r2", "right", w("File lớn"))]),
        B("Byte Buffer: flip để chuyển sang chế độ đọc. Serialization: khai báo serial Version UID, dùng transient, và đặt bộ lọc khi đọc dữ liệu ngoài.",
          "ByteBuffer · Serialization.",
          lambda w: [IN("#bn-r3", "right", w("Byte Buffer")), IN("#bn-r4", "right", w("Serialization"))]),
        B("Thử một tình huống. Bạn nhận dữ liệu object tuần tự hoá từ bên ngoài hệ thống. Có nên đọc thẳng bằng Object Input Stream không?",
          "Bài tập: nhận object từ bên ngoài, nên làm gì?",
          lambda w: [OUT(S(*[f"bn-r{i}" for i in range(5)]), "blur", 0, 0.5), IN("#bn-qq", "up", 0.6), IN("#bn-a1", "up", w("Có nên"))]),
        B("Không nên. Hãy tránh nếu được và dùng JSON, hoặc đặt Object Input Filter chỉ cho phép các class mong đợi, vì đọc dữ liệu không tin cậy là rủi ro bảo mật.",
          "Dùng JSON, hoặc ObjectInputFilter.",
          lambda w: [SHAKE("#bn-a1", 0.2), DIM("#bn-a1", 0.4, 0.3), IN("#bn-a2", "pop", w("Hãy tránh")), PULSE("#bn-a2", w("đặt Object") )]),
        B("Dữ liệu từ bên ngoài luôn là dữ liệu lạ.",
          "Dữ liệu ngoài là dữ liệu lạ.",
          lambda w: [DIM(S("bn-eye", "bn-q", "bn-qq", "bn-a1", "bn-a2"), 0, 0.07), TYPE("#bn-t1", 0.3, 0.04), IN("#bn-t2", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt I/O"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 118, 1660, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("try-with-resources", "Đóng tài nguyên, giữ exception gốc"),
                                      ("Charset", "Chỉ rõ UTF-8, đếm byte đúng"),
                                      ("File lớn", "Files.lines, đọc từng dòng"),
                                      ("ByteBuffer", "Ghi xong thì flip"),
                                      ("Serialization", "UID tường minh, transient, bộ lọc")])],
        el("ou-tr", 0, 810, 1920, None, "Bẫy: close đè lỗi gốc · charset mặc định · readAllLines · quên flip · dữ liệu lạ", "take-sm r", "font-size:34px"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại, năm chủ đề I O. Try with resources: đóng tài nguyên mà không mất exception gốc. Charset: chỉ rõ UTF tám, và đếm byte đúng.",
          "try-with-resources và Charset.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Try with")), IN("#ou-r1", "right", w("Charset:"))]),
        B("File lớn: dùng Files lines, đọc từng dòng. Byte Buffer: ghi xong thì flip. Serialization: serial Version UID tường minh, transient, và bộ lọc.",
          "File lớn, ByteBuffer, Serialization.",
          lambda w: [IN("#ou-r2", "right", w("File lớn")), IN("#ou-r3", "right", w("Byte Buffer")), IN("#ou-r4", "right", w("Serialization"))]),
        B("Mỗi chủ đề có bẫy riêng: lỗi close đè lỗi gốc, charset mặc định, read All Lines với file lớn, quên flip, và dữ liệu lạ.",
          "Mỗi chủ đề có bẫy riêng.",
          lambda w: [IN("#ou-tr", "blur", w("lỗi close")), PULSE("#ou-r0", w("lỗi close")), PULSE("#ou-r1", w("charset mặc")), PULSE("#ou-r2", w("read All")), PULSE("#ou-r3", w("quên flip")), PULSE("#ou-r4", w("dữ liệu lạ"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
