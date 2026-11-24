"""Web vulnerabilities explainer: SQL injection, XSS, IDOR, SSRF, path traversal, password hashing, file encryption.

Every output comes from the lesson (web/src/data/lessons/web-vulns.ts), run on JDK 21:
string concat with ' OR '1'='1 returns every user, prepared statement keeps it as data;
HTML escaping turns <script>alert(1)</script> into &lt;script&gt;...; IDOR: An reads order 2 of Binh, owner check gives 403;
SSRF: host of http://good.com@127.0.0.1/x is 127.0.0.1; 127.0.0.1 loopback, 10.0.0.5 private, 169.254.169.254 link-local, 8.8.8.8 no flag;
traversal: ../../etc/passwd -> /etc/passwd outside /srv/files, normalize + startsWith -> inside base false, report.pdf true;
passwords: SHA-256 about 10 million hashes/s (one thread, author's machine), PBKDF2 600000 rounds about 200 ms (about 5/s);
encryption: RSA-2048 OAEP SHA-256 max 190 bytes, 1 MB -> IllegalBlockSizeException; 5264 blocks x ~0.96 ms = ~5 s vs AES-GCM ~11 ms;
AES-GCM 1000000 -> 1000016 bytes (16-byte tag), 12-byte IV, 32-byte key wrapped to 256 bytes, one flipped bit -> Tag mismatch.
Defenses are explained conceptually; the only attack strings are the textbook ones already in the lesson.
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


def ARW(id_, d=0.0, dur=0.5):
    """Draw an arrow and pop its head (no travelling light: frames stay clean)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(label, text):
    return f'<span class="mono big" style="font-size:38px">{esc(label)}</span><span style="font-size:32px">{esc(text)}</span>'


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
    inner = (f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(top)}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700">{esc(main)}</span>'
    inner += f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(sub)}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, text, size=32):
    return el(id_, x, y, w, None, esc(text), "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=40, ds=28):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px;text-align:center">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def take(p, big, small):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(big), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(small), "take-sm r"))


TOPICS = [("SQL injection", "dữ liệu thành câu lệnh"), ("XSS", "mã chạy trên trình duyệt"), ("IDOR", "đổi id xem đơn người khác"),
          ("SSRF", "server gọi vào nội bộ"), ("Path traversal", "thoát thư mục gốc"), ("Mật khẩu", "hash phải chậm"),
          ("File nhạy cảm", "AES-GCM + RSA bọc khoá")]

DRILL = [("Ô tìm kiếm ghép chuỗi vào câu SQL", "Prepared statement"),
         ("Bình luận chứa <script> chạy trên máy người xem", "Mã hoá đầu ra"),
         ("Đổi /orders/1 thành /orders/2 xem đơn người khác", "Quyền theo object"),
         ("Xem trước liên kết trỏ tới 169.254.169.254", "Allowlist + chặn IP nội bộ"),
         ("Tải file theo tên với ../../etc/passwd", "normalize + startsWith"),
         ("Database bị lộ, kẻ trộm dò mật khẩu hàng loạt", "Hash chậm có salt")]

SUMMARY = [("SQL injection", "Prepared statement · allowlist cho tên cột"),
           ("XSS", "Mã hoá đầu ra theo ngữ cảnh · CSP · HttpOnly"),
           ("IDOR", "Quyền theo object ở mọi endpoint"),
           ("SSRF", "Phân giải DNS, chặn IP nội bộ, tắt redirect"),
           ("Path traversal", "normalize rồi startsWith thư mục gốc"),
           ("Mật khẩu", "Hash chậm có salt qua PasswordEncoder"),
           ("File nhạy cảm", "AES-GCM nội dung · RSA bọc khoá · KMS")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Bảo mật web · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Lỗ hổng web hay bị hỏi"), "h1 r", "font-size:110px"),
        *[box(f"hk-c{i}", 80 + i * 254, 420, 236, 260,
              f'<b style="font-size:30px;text-align:center">{esc(n)}</b><span style="font-size:24px;color:var(--muted);text-align:center;line-height:1.3">{esc(d)}</span>', "cyan", "card")
          for i, (n, d) in enumerate(TOPICS)],
        tag("hk-p1", 110, 780, 500, 100, "Đầu vào không tin cậy", "amber", 30),
        tag("hk-p2", 710, 780, 500, 100, "Vì sao nguy hiểm", "red", 30),
        tag("hk-p3", 1310, 780, 500, 100, "Chặn ở đúng chỗ", "green", 30),
        take("hk", "Dữ liệu không bao giờ thành lệnh", "coi mọi thứ từ ngoài vào là dữ liệu"),
        wires(arrow("hk-a1", [(615, 830), (705, 830)], "muted"), arrow("hk-a2", [(1215, 830), (1305, 830)], "muted")),
    ]), beats=[
        B("Người phỏng vấn hỏi: bạn biết những lỗ hổng web nào, và chặn chúng ra sao?",
          "Bạn biết những lỗ hổng web nào, chặn ra sao?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05)]),
        B("Bài này đi qua bảy chủ đề hay gặp: SQL injection, Cross Site Scripting, đổi id để xem dữ liệu người khác, server bị lừa gọi vào mạng nội bộ, path traversal, lưu mật khẩu, và mã hoá file nhạy cảm.",
          "7 chủ đề hay gặp trong phỏng vấn.",
          lambda w: [IN("#hk-c0", "pop", w("SQL injection")), IN("#hk-c1", "pop", w("Cross Site")), IN("#hk-c2", "pop", w("đổi id")),
                     IN("#hk-c3", "pop", w("server bị lừa")), IN("#hk-c4", "pop", w("path traversal")), IN("#hk-c5", "pop", w("lưu mật khẩu")),
                     IN("#hk-c6", "pop", w("mã hoá file"))]),
        B("Mỗi lỗ hổng đi theo một khuôn: đầu vào không tin cậy, vì sao nguy hiểm, và cách chặn ở đúng chỗ.",
          "Đầu vào không tin cậy → vì sao nguy hiểm → chặn ở đúng chỗ.",
          lambda w: [IN("#hk-p1", "up", w("đầu vào")), *ARW("hk-a1", w("vì sao") - 0.4, 0.4), IN("#hk-p2", "up", w("vì sao")),
                     *ARW("hk-a2", w("và cách") - 0.4, 0.4), IN("#hk-p3", "up", w("và cách"))]),
        B("Nguyên tắc chung: coi mọi dữ liệu từ ngoài là dữ liệu, không bao giờ để nó thành lệnh.",
          "Dữ liệu từ ngoài không bao giờ được thành lệnh.",
          lambda w: [DIM(S("hk-eye", "hk-q", *[f"hk-c{i}" for i in range(7)], "hk-p1", "hk-p2", "hk-p3") + ", " + AR("hk-a1", "hk-a2"), 0, 0.07),
                     TYPE("#hk-t1", 0.4, 0.04), IN("#hk-t2", "blur", w("coi mọi"))]),
    ]),
    # ------------------------------------------------------------ sqli
    dict(id="sqli", world=(1920, 1080), hud="", cam="".join([
        head("sq", "SQL injection", "Dữ liệu thành câu lệnh"),
        rule("sq-rule", "Nối chuỗi đầu vào cho phép người dùng sửa câu lệnh", "Cách chặn bền vững: câu lệnh tham số hoá (prepared statement)"),
        tag("sq-in", 110, 260, 700, 100, "input = ' OR '1'='1", "amber", 34),
        cbox("sq-bad", 110, 410, 1700, "Nối chuỗi",
             "String sql = \"SELECT * FROM users WHERE name = '\" + input + \"'\";", "violet", 30),
        tag("sq-res", 110, 600, 1700, 100, "SELECT * FROM users WHERE name = '' OR '1'='1'", "red", 32),
        bigerr("sq-err", 110, 740, 1700, "✕ Điều kiện luôn đúng: trả về mọi người dùng", 34),
        cbox("sq-good", 110, 410, 1700, "Prepared statement",
             "PreparedStatement ps = conn.prepareStatement(\"SELECT * FROM users WHERE name = ?\");\n"
             "ps.setString(1, input);        // giá trị truyền riêng, luôn là dữ liệu", "violet", 28),
        tag("sq-ok", 110, 640, 1700, 100, "✓ ' OR '1'='1 chỉ là một chuỗi cần so khớp", "green", 32),
        note("sq-jpa", 110, 780, 1700, "Spring Data JPA: @Query(\"... where u.name = :name\") + @Param, hoặc findByName", "green", 30),
        note("sq-al", 110, 780, 1700, "Tên cột, tên bảng, hướng ORDER BY không bind được: so khớp allowlist", "red", 30),
        take("sq", "Câu SQL cố định, giá trị truyền riêng", "đừng tự escape dấu nháy thay cho tham số hoá"),
    ]), beats=[
        B("Bắt đầu với SQL injection. Khi bạn nối chuỗi đầu vào của người dùng vào câu SQL, người dùng có thể sửa chính câu lệnh.",
          "Nối chuỗi đầu vào vào SQL: người dùng sửa được câu lệnh.",
          lambda w: [IN("#sq-eye", "blur"), TYPE("#sq-q", 0.2, 0.05), IN("#sq-rule", "up", w("Khi bạn"))]),
        B("Ví dụ câu tìm người dùng theo tên, ghép bằng dấu cộng. Người dùng nhập chuỗi kinh điển: dấu nháy, rồi OR một bằng một.",
          "Câu SQL ghép bằng dấu cộng, đầu vào ' OR '1'='1.",
          lambda w: [OUT("#sq-rule", "blur", 0, 0.4), *shrink("sq", 0), IN("#sq-bad", "blur", 0.5, 0.7), PULSE("#sq-bad", w("ghép bằng")),
                     IN("#sq-in", "left", w("Người dùng nhập"))]),
        B("Đã chạy: câu lệnh thành WHERE name bằng rỗng, OR một bằng một. Điều kiện luôn đúng, nên truy vấn trả về mọi người dùng.",
          "Điều kiện luôn đúng: trả về mọi người dùng.",
          lambda w: [IN("#sq-res", "up", w("câu lệnh thành")), IN("#sq-err", "up", w("Điều kiện")), SHAKE("#sq-err", w("Điều kiện") + 0.6)]),
        B("Cách chặn bền vững là prepared statement. Câu SQL cố định với dấu chấm hỏi, giá trị truyền riêng. Cùng đầu vào đó giờ chỉ là một chuỗi cần so khớp, không đổi được cấu trúc câu lệnh.",
          "Prepared statement: câu SQL cố định, giá trị truyền riêng.",
          lambda w: [OUT(S("sq-bad", "sq-res", "sq-err"), "blur", 0, 0.5), IN("#sq-good", "blur", 0.6, 0.7), PULSE("#sq-good", w("dấu chấm hỏi")),
                     IN("#sq-ok", "up", w("Cùng đầu vào"))]),
        B("Trong Spring Data JPA, dùng tham số có tên, hoặc query method như find By Name. Phần không bind được là tên cột, tên bảng và hướng sắp xếp. Với chúng, hãy so khớp trong một danh sách cho phép.",
          "Tên cột, ORDER BY không bind được: dùng allowlist.",
          lambda w: [IN("#sq-jpa", "up", w("Trong Spring")), OUT("#sq-jpa", "blur", w("Phần không") - 0.4, 0.4), IN("#sq-al", "up", w("Phần không")),
                     PULSE("#sq-al", w("danh sách cho phép"))]),
        B("Bẫy hay gặp là tự escape dấu nháy thay cho tham số hoá. Rất dễ sót trường hợp. Hãy nhớ: câu SQL cố định, giá trị truyền riêng.",
          "Đừng tự escape: câu SQL cố định, giá trị truyền riêng.",
          lambda w: [DIM(S("sq-eye", "sq-q", "sq-in", "sq-good", "sq-ok", "sq-al"), 0, 0.07),
                     TYPE("#sq-t1", w("Hãy nhớ"), 0.04), IN("#sq-t2", "blur", 0.5)]),
    ]),
    # ------------------------------------------------------------ xss
    dict(id="xss", world=(1920, 1080), hud="", cam="".join([
        head("xs", "Cross-Site Scripting (XSS)", "Dữ liệu thành mã chạy trên trình duyệt", 76),
        rule("xs-rule", "In dữ liệu ra HTML mà không mã hoá", "Trình duyệt chạy nó như mã. Cùng kiểu lỗi với SQL injection"),
        titled("xs-f1", 110, 280, 380, 170, "bình luận", "<script>", "", "amber", 40),
        titled("xs-f2", 550, 280, 380, 170, "server", "in thẳng ra HTML", "", "violet", 30),
        titled("xs-f3", 990, 280, 380, 170, "trình duyệt", "chạy như mã", "", "red", 34),
        titled("xs-f4", 1430, 280, 390, 170, "kẻ tấn công", "lấy phiên", "thao tác thay nạn nhân", "red", 34),
        cbox("xs-bad", 110, 520, 1700, "Comment.java",
             "out.print(\"<p>\" + comment + \"</p>\");     // comment = <script>alert(1)</script>", "violet", 30),
        tag("xs-in", 110, 520, 1700, 100, "<script>alert(1)</script>", "red", 34),
        tag("xs-out", 110, 660, 1700, 100, "&lt;script&gt;alert(1)&lt;/script&gt;", "green", 34),
        note("xs-ok", 110, 800, 1700, "✓ Trình duyệt hiển thị thành chữ, không chạy", "green", 34),
        card("xs-c0", 110, 520, 395, 300, "Mã hoá theo ngữ cảnh", "HTML, thuộc tính, JavaScript, URL", "green"),
        card("xs-c1", 545, 520, 395, 300, "Template mặc định", "Thymeleaf th:text, React", "cyan"),
        card("xs-c2", 980, 520, 395, 300, "Content-Security-Policy", "lớp phòng thủ thứ hai", "cyan", 34),
        card("xs-c3", 1415, 520, 405, 300, "Cookie HttpOnly", "script không đọc được phiên", "cyan"),
        bigerr("xs-trap", 110, 850, 1700, "✕ Tự tắt mã hoá: th:utext, dangerouslySetInnerHTML", 30),
        take("xs", "Mã hoá đầu ra, đừng lọc từ khoá", "lọc chữ script luôn có cách vượt qua"),
        wires(arrow("xs-a1", [(495, 365), (545, 365)], "muted"), arrow("xs-a2", [(935, 365), (985, 365)], "muted"),
              arrow("xs-a3", [(1375, 365), (1425, 365)], "muted")),
    ]), beats=[
        B("SQL injection biến dữ liệu thành lệnh chạy trên database. Cross Site Scripting là cùng kiểu lỗi đó, nhưng chạy trên trình duyệt.",
          "XSS: cùng kiểu lỗi, nhưng chạy trên trình duyệt.",
          lambda w: [IN("#xs-eye", "blur"), TYPE("#xs-q", 0.2, 0.04), IN("#xs-rule", "up", w("Cross Site"))]),
        B("Một bình luận chứa thẻ script được in thẳng vào HTML. Trình duyệt của mọi người xem bình luận đó sẽ chạy nó như mã. Kẻ tấn công lấy được phiên đăng nhập, hay thao tác thay nạn nhân.",
          "In thẳng ra HTML → trình duyệt chạy → mất phiên đăng nhập.",
          lambda w: [OUT("#xs-rule", "blur", 0, 0.4), *shrink("xs", 0), IN("#xs-f1", "up", 0.5), *ARW("xs-a1", w("được in"), 0.4),
                     IN("#xs-f2", "up", w("được in") + 0.3), IN("#xs-bad", "blur", w("in thẳng"), 0.7),
                     *ARW("xs-a2", w("Trình duyệt"), 0.4), IN("#xs-f3", "up", w("Trình duyệt") + 0.3),
                     *ARW("xs-a3", w("Kẻ tấn công"), 0.4), IN("#xs-f4", "up", w("Kẻ tấn công") + 0.3), SHAKE("#xs-f4", w("thao tác"))]),
        B("Cách chặn chính là mã hoá đầu ra. Dấu nhỏ hơn, lớn hơn và dấu nháy được đổi thành thực thể HTML. Đã chạy: thẻ script thành chữ, trình duyệt hiển thị chứ không chạy.",
          "Mã hoá đầu ra: ký tự đặc biệt thành thực thể HTML.",
          lambda w: [OUT("#xs-bad", "blur", 0, 0.4), IN("#xs-in", "up", 0.5), IN("#xs-out", "up", w("được đổi")),
                     PULSE("#xs-out", w("Đã chạy")), IN("#xs-ok", "up", w("trình duyệt hiển thị"))]),
        B("Mã hoá phải đúng ngữ cảnh: HTML, thuộc tính, JavaScript hay URL đều có quy tắc riêng. Thymeleaf và React mã hoá mặc định. Thêm Content Security Policy làm lớp thứ hai, và cookie Http Only để script không đọc được phiên.",
          "Theo ngữ cảnh · template mặc định · CSP · HttpOnly.",
          lambda w: [OUT(S("xs-in", "xs-out", "xs-ok"), "blur", 0, 0.4), IN("#xs-c0", "up", 0.5), IN("#xs-c1", "up", w("Thymeleaf")),
                     IN("#xs-c2", "up", w("Thêm Content")), IN("#xs-c3", "up", w("và cookie"))]),
        B("Nguy hiểm là khi bạn tự tắt mã hoá, như u text của Thymeleaf hay dangerously Set Inner HTML của React. Và đừng lọc từ khoá script, vì luôn có cách vượt qua.",
          "Đừng tự tắt mã hoá, đừng lọc từ khoá.",
          lambda w: [IN("#xs-trap", "up", 0.3), SHAKE("#xs-trap", 1.0),
                     DIM(S("xs-eye", "xs-q", "xs-f1", "xs-f2", "xs-f3", "xs-f4", "xs-c0", "xs-c1", "xs-c2", "xs-c3", "xs-trap") + ", " + AR("xs-a1", "xs-a2", "xs-a3"), w("Và đừng"), 0.07),
                     TYPE("#xs-t1", w("Và đừng") + 0.3, 0.04), IN("#xs-t2", "blur", w("vì luôn"))]),
    ]),
    # ------------------------------------------------------------ idor
    dict(id="idor", world=(1920, 1080), hud="", cam="".join([
        head("id", "IDOR (BOLA)", "Đổi id để xem dữ liệu người khác"),
        rule("id-rule", "Mã chạy đúng, nhưng thiếu kiểm tra quyền theo object", "Đứng đầu rủi ro API của OWASP: Broken Object Level Authorization"),
        titled("id-u", 110, 290, 340, 150, "đã đăng nhập", "An", "", "cyan", 48),
        tag("id-req", 560, 315, 480, 100, "GET /orders/2", "violet", 36),
        titled("id-res", 1150, 290, 670, 150, "trả về đơn hàng của", "Bình", "", "red", 48),
        titled("id-res2", 1150, 290, 670, 150, "đơn 2 thuộc về Bình", "403 forbidden", "", "green", 44),
        cbox("id-bad", 110, 510, 1700, "OrderController.java",
             "@GetMapping(\"/orders/{id}\")\n"
             "Order get(@PathVariable long id) { return repo.findById(id); }", "violet", 30),
        bigerr("id-err", 110, 740, 1700, "✕ Có xác thực (là ai) nhưng thiếu phân quyền theo object (được xem cái nào)", 30),
        cbox("id-good", 110, 510, 1700, "OrderController.java",
             "@GetMapping(\"/orders/{id}\")\n"
             "Order get(@PathVariable long id) {\n"
             "  return repo.findByIdAndUserId(id, currentUserId()).orElseThrow();   // luôn kèm chủ sở hữu\n"
             "}", "violet", 28),
        note("id-n", 110, 860, 1700, "403 hay 404 đều được, miễn nhất quán · 404 giấu luôn việc đơn có tồn tại", "green", 30),
        tag("id-uu", 110, 510, 830, 120, "✕ UUID khó đoán ≠ phân quyền", "red", 32),
        tag("id-ma", 990, 510, 830, 120, "Mass assignment: DTO chỉ chứa field cho phép", "amber", 28),
        take("id", "Là ai, khác được xem cái nào", "luôn truy vấn kèm chủ sở hữu"),
        wires(arrow("id-a1", [(455, 365), (555, 365)], "muted"), arrow("id-a2", [(1045, 365), (1145, 365)], "muted")),
    ]), beats=[
        B("Hai lỗi trước là dữ liệu bị hiểu thành mã. Lỗi IDOR thì khác: mã chạy đúng, nhưng thiếu kiểm tra quyền theo object. Nó đứng đầu danh sách rủi ro API của OWASP.",
          "IDOR: mã chạy đúng, thiếu kiểm tra quyền theo object.",
          lambda w: [IN("#id-eye", "blur"), TYPE("#id-q", 0.2, 0.05), IN("#id-rule", "up", w("Lỗi IDOR"))]),
        B("An đã đăng nhập, gọi đơn hàng số hai. API chỉ tìm theo id rồi trả về. Đã chạy: An nhận được đơn hàng của Bình. Chỉ cần đoán id là xem được dữ liệu người khác.",
          "An gọi /orders/2 và nhận đơn của Bình.",
          lambda w: [OUT("#id-rule", "blur", 0, 0.4), *shrink("id", 0), IN("#id-u", "up", 0.5), *ARW("id-a1", w("gọi đơn"), 0.4),
                     IN("#id-req", "up", w("gọi đơn") + 0.3), IN("#id-bad", "blur", w("API chỉ"), 0.7),
                     *ARW("id-a2", w("Đã chạy"), 0.4), IN("#id-res", "up", w("Đã chạy") + 0.3), SHAKE("#id-res", w("Chỉ cần"))]),
        B("Có xác thực, tức trả lời câu là ai. Nhưng thiếu phân quyền theo object, tức người này được xem cái nào.",
          "Xác thực: là ai. Thiếu: được xem cái nào.",
          lambda w: [IN("#id-err", "up", 0.3), PULSE("#id-err", w("Nhưng thiếu"))]),
        B("Cách chặn: kiểm tra sở hữu ở mọi endpoint. Gọn nhất là luôn truy vấn kèm chủ sở hữu, find By Id And User Id. Đã chạy: An gọi đơn số hai thì nhận bốn trăm linh ba.",
          "Truy vấn kèm chủ sở hữu: An nhận 403.",
          lambda w: [OUT(S("id-bad", "id-err", "id-res"), "blur", 0, 0.5), IN("#id-good", "blur", 0.6, 0.7), PULSE("#id-good", w("find By")),
                     IN("#id-res2", "pop", w("Đã chạy"))]),
        B("Trả bốn trăm linh ba hay bốn trăm linh bốn đều được, miễn nhất quán. Bốn trăm linh bốn còn giấu luôn việc đơn đó có tồn tại.",
          "403 hay 404 đều được, miễn nhất quán.",
          lambda w: [IN("#id-n", "up", 0.4)]),
        B("Đừng tin vào id khó đoán như UUID: id lộ qua log hay đường link chia sẻ là xem được. Lỗi họ hàng là mass assignment, client tự gán role ADMIN. Chặn bằng DTO chỉ chứa field cho phép.",
          "UUID không thay phân quyền · DTO chặn mass assignment.",
          lambda w: [OUT(S("id-good", "id-n"), "blur", 0, 0.5), IN("#id-uu", "up", 0.6), IN("#id-ma", "up", w("Lỗi họ hàng"))]),
        B("Nhớ câu này: là ai, khác với được xem cái nào. Luôn truy vấn kèm chủ sở hữu.",
          "Là ai ≠ được xem cái nào.",
          lambda w: [DIM(S("id-eye", "id-q", "id-u", "id-req", "id-res2", "id-uu", "id-ma") + ", " + AR("id-a1", "id-a2"), 0, 0.07),
                     TYPE("#id-t1", 0.4, 0.04), IN("#id-t2", "blur", w("Luôn truy"))]),
    ]),
    # ------------------------------------------------------------ ssrf
    dict(id="ssrf", world=(1920, 1080), hud="", cam="".join([
        head("sr", "SSRF", "Server bị lừa gọi vào mạng nội bộ"),
        rule("sr-rule", "Người dùng mượn chính server gọi tới chỗ họ không với tới", "Xem trước liên kết, tải ảnh, webhook: server gọi URL người dùng đưa"),
        titled("sr-at", 110, 330, 400, 160, "người dùng đưa", "url = ...", "", "amber", 40),
        titled("sr-sv", 680, 330, 440, 160, "server", "http.get(url)", "", "violet", 38),
        titled("sr-m", 1290, 260, 530, 140, "metadata của cloud", "169.254.169.254", "", "red", 36),
        titled("sr-l", 1290, 430, 530, 140, "dịch vụ nội bộ", "localhost:8080/admin", "", "red", 32),
        note("sr-cr", 1290, 600, 530, "✕ thông tin xác thực tạm thời", "red", 28),
        tag("sr-tr", 110, 680, 1060, 100, "http://good.com@127.0.0.1/x", "amber", 34),
        tag("sr-host", 1230, 680, 590, 100, "host thật: 127.0.0.1", "red", 32),
        bigerr("sr-err", 110, 820, 1710, "✕ Kiểm tra chuỗi \"chứa good.com\" bị qua mặt: phần trước @ là userinfo", 30),
        cbox("sr-code", 110, 260, 980, "UrlGuard.java",
             "URI u = URI.create(url);\n"
             "InetAddress ad = InetAddress.getByName(u.getHost());\n"
             "if (ad.isLoopbackAddress() || ad.isSiteLocalAddress()\n"
             "    || ad.isLinkLocalAddress()) reject;", "violet", 26),
        *[tag(f"sr-ip{i}", 1150, 260 + i * 115, 670, 95, t, tone, 28)
          for i, (t, tone) in enumerate([("127.0.0.1 · loopback ✕", "red"), ("10.0.0.5 · private ✕", "red"),
                                         ("169.254.169.254 · link-local ✕", "red"), ("8.8.8.8 · không cờ nào ✓", "green")])],
        note("sr-dns", 110, 590, 980, "Redirect, DNS rebinding đổi đích sau khi kiểm tra:\nkiểm tra IP thật của mỗi kết nối, tắt theo redirect", "red", 30),
        card("sr-c0", 110, 730, 395, 160, "Allowlist", "chỉ tên miền được phép", "green", 34, 26),
        card("sr-c1", 545, 730, 395, 160, "Chặn IP nội bộ", "sau khi phân giải DNS", "green", 34, 26),
        card("sr-c2", 980, 730, 395, 160, "Tách mạng", "không với tới dịch vụ nhạy cảm", "green", 34, 26),
        card("sr-c3", 1415, 730, 405, 160, "IMDSv2", "metadata yêu cầu token", "green", 34, 26),
        take("sr", "Kiểm tra IP thật, không kiểm tra chuỗi", "phân giải DNS rồi mới quyết định"),
        wires(arrow("sr-a1", [(515, 410), (675, 410)], "muted"), arrow("sr-a2", [(1125, 390), (1285, 330)], "muted"),
              arrow("sr-a3", [(1125, 430), (1285, 500)], "muted")),
    ]), beats=[
        B("Lỗi IDOR là người dùng đọc dữ liệu không phải của mình. Còn Server Side Request Forgery là người dùng mượn chính server, để gọi tới chỗ họ không với tới được.",
          "SSRF: người dùng mượn server gọi vào chỗ họ không với tới.",
          lambda w: [IN("#sr-eye", "blur"), TYPE("#sr-q", 0.2, 0.05), IN("#sr-rule", "up", w("Còn Server"))]),
        B("Nó xảy ra khi server gọi một URL do người dùng đưa, như xem trước liên kết hay webhook. Kẻ tấn công trỏ URL vào dịch vụ nội bộ, hay địa chỉ metadata của cloud. Server tự gọi, và trả về thông tin xác thực tạm thời.",
          "URL trỏ vào metadata cloud hay dịch vụ nội bộ.",
          lambda w: [OUT("#sr-rule", "blur", 0, 0.4), *shrink("sr", 0), IN("#sr-at", "up", 0.5), *ARW("sr-a1", w("do người dùng"), 0.4),
                     IN("#sr-sv", "up", w("do người dùng") + 0.3), *ARW("sr-a3", w("dịch vụ nội bộ"), 0.4), IN("#sr-l", "up", w("dịch vụ nội bộ") + 0.3),
                     *ARW("sr-a2", w("địa chỉ metadata"), 0.4), IN("#sr-m", "up", w("địa chỉ metadata") + 0.3), IN("#sr-cr", "up", w("Server tự gọi"))]),
        B("Kiểm tra chuỗi URL thì dễ bị qua mặt. Server chỉ cho URL chứa good chấm com. Đã chạy: host thật của URL này là một hai bảy, không, không, một. Phần trước dấu a còng chỉ là tên đăng nhập, không phải host.",
          "Host thật của http://good.com@127.0.0.1/x là 127.0.0.1.",
          lambda w: [IN("#sr-tr", "up", w("Server chỉ")), IN("#sr-host", "pop", w("Đã chạy")), IN("#sr-err", "up", w("Phần trước")), SHAKE("#sr-err", w("Phần trước") + 0.6)]),
        B("Cách đáng tin: phân giải DNS ra địa chỉ IP thật rồi mới kiểm tra. Đã chạy: loopback, private và link local đều bị chặn. Một IP công khai như tám chấm tám chấm tám chấm tám thì không bị cờ nào.",
          "Phân giải DNS, chặn loopback, private, link-local.",
          lambda w: [OUT(S("sr-at", "sr-sv", "sr-m", "sr-l", "sr-cr", "sr-tr", "sr-host", "sr-err") + ", " + AR("sr-a1", "sr-a2", "sr-a3"), "blur", 0, 0.5),
                     IN("#sr-code", "blur", 0.6, 0.7), IN("#sr-ip0", "up", w("loopback")), IN("#sr-ip1", "up", w("private")),
                     IN("#sr-ip2", "up", w("link local")), IN("#sr-ip3", "up", w("Một IP"))]),
        B("Nhưng kiểm tra một lần chưa đủ. Redirect hay DNS rebinding có thể đổi đích sau đó, nên phải kiểm tra IP thật của mỗi kết nối, và tắt tự động theo redirect.",
          "Kiểm tra IP của mỗi kết nối, tắt tự động theo redirect.",
          lambda w: [IN("#sr-dns", "up", w("Redirect")), PULSE("#sr-dns", w("nên phải"))]),
        B("Phòng thủ nhiều lớp: allowlist tên miền, chặn dải IP nội bộ, tách mạng, và trên cloud bật phiên bản metadata thứ hai, loại yêu cầu token.",
          "Allowlist · chặn IP nội bộ · tách mạng · IMDSv2.",
          lambda w: [IN("#sr-c0", "up", w("allowlist")), IN("#sr-c1", "up", w("chặn dải")), IN("#sr-c2", "up", w("tách mạng")), IN("#sr-c3", "up", w("trên cloud"))]),
        B("Ý chính: kiểm tra địa chỉ IP thật sau khi phân giải, không kiểm tra chuỗi URL.",
          "Kiểm tra IP thật, không kiểm tra chuỗi URL.",
          lambda w: [DIM(S("sr-eye", "sr-q", "sr-code", "sr-ip0", "sr-ip1", "sr-ip2", "sr-ip3", "sr-dns", "sr-c0", "sr-c1", "sr-c2", "sr-c3"), 0, 0.07),
                     TYPE("#sr-t1", 0.3, 0.04), IN("#sr-t2", "blur", w("sau khi"))]),
    ]),
    # ------------------------------------------------------------ traversal
    dict(id="traversal", world=(1920, 1080), hud="", cam="".join([
        head("tr", "Path traversal", "Thoát khỏi thư mục cho phép"),
        titled("tr-base", 110, 280, 500, 150, "thư mục gốc", "/srv/files", "", "cyan", 42),
        titled("tr-in", 700, 280, 520, 150, "tên file người dùng đưa", "../../etc/passwd", "", "amber", 36),
        titled("tr-out", 1310, 280, 510, 150, "đích thật", "/etc/passwd", "", "red", 42),
        cbox("tr-bad", 110, 490, 1700, "Download.java",
             "Path p = base.resolve(userInput);\n"
             "Files.readAllBytes(p);", "violet", 32),
        bigerr("tr-err", 110, 720, 1700, "✕ Đường dẫn nằm ngoài /srv/files: file hệ thống bị đọc", 32),
        cbox("tr-good", 110, 490, 1700, "Download.java",
             "Path p = base.resolve(userInput).normalize();\n"
             "if (!p.startsWith(base)) throw new SecurityException(\"outside base\");", "violet", 30),
        tag("tr-r1", 110, 740, 830, 100, "../../etc/passwd → inside base: false", "red", 28),
        tag("tr-r2", 990, 740, 830, 100, "report.pdf → inside base: true", "green", 28),
        bigerr("tr-trap", 110, 880, 1700, "✕ Tìm chuỗi \"..\": bị qua mặt bằng mã hoá URL, đường dẫn tuyệt đối", 30),
        note("tr-n", 110, 880, 1700, "Tốt hơn: lưu bằng id sinh ra, tra tên thật trong DB · symlink: toRealPath", "green", 30),
        take("tr", "Chuẩn hoá rồi mới kiểm tra", "normalize, rồi startsWith thư mục gốc"),
        wires(arrow("tr-a1", [(1225, 355), (1305, 355)], "muted")),
    ]), beats=[
        B("Lỗi trước lừa server gọi ra mạng. Còn path traversal lừa server đọc file, thoát ra khỏi thư mục được phép.",
          "Path traversal: lừa server đọc file ngoài thư mục gốc.",
          lambda w: [IN("#tr-eye", "blur"), TYPE("#tr-q", 0.2, 0.05), *shrink("tr", w("thoát ra"))]),
        B("Server đọc file theo tên người dùng đưa, ghép vào thư mục gốc srv files. Đầu vào kiểu chấm chấm gạch chéo lặp hai lần, rồi tới etc passwd.",
          "Ghép thẳng tên file vào thư mục gốc.",
          lambda w: [IN("#tr-base", "up", w("thư mục gốc")), IN("#tr-bad", "blur", w("ghép vào"), 0.7), IN("#tr-in", "up", w("Đầu vào"))]),
        B("Đã chạy: đường dẫn thành etc passwd, nằm ngoài thư mục gốc. File hệ thống bị đọc.",
          "Đã chạy: /etc/passwd, nằm ngoài /srv/files.",
          lambda w: [*ARW("tr-a1", 0.3, 0.4), IN("#tr-out", "up", 0.6), IN("#tr-err", "up", w("nằm ngoài")), SHAKE("#tr-err", w("File hệ thống"))]),
        B("Cách chặn: chuẩn hoá đường dẫn bằng normalize, rồi kiểm tra nó vẫn nằm trong thư mục gốc bằng starts With. Đã chạy: đầu vào đó cho inside base bằng false, bị từ chối. Còn report chấm pdf thì nằm trong, được phép.",
          "normalize rồi startsWith(base).",
          lambda w: [OUT(S("tr-bad", "tr-err"), "blur", 0, 0.5), IN("#tr-good", "blur", 0.6, 0.7), PULSE("#tr-good", w("starts With")),
                     IN("#tr-r1", "up", w("Đã chạy")), IN("#tr-r2", "up", w("Còn report"))]),
        B("Bẫy hay gặp là tìm chuỗi chấm chấm trong tên file. Cách này dễ bị qua mặt bằng mã hoá URL hay đường dẫn tuyệt đối. Kiểm tra trên đường dẫn đã chuẩn hoá, không phải chuỗi gốc.",
          "Đừng tìm chuỗi \"..\": kiểm tra đường dẫn đã chuẩn hoá.",
          lambda w: [IN("#tr-trap", "up", 0.3), SHAKE("#tr-trap", w("dễ bị"))]),
        B("Tốt hơn nữa: đừng dùng tên file của người dùng. Lưu bằng id sinh ra, tra tên thật trong database, và xử lý symlink bằng to Real Path. Nhớ: chuẩn hoá rồi mới kiểm tra.",
          "Tốt hơn: lưu bằng id sinh ra thay cho tên file.",
          lambda w: [OUT("#tr-trap", "blur", 0, 0.4), IN("#tr-n", "up", 0.5),
                     DIM(S("tr-eye", "tr-q", "tr-base", "tr-in", "tr-out", "tr-good", "tr-r1", "tr-r2", "tr-n") + ", " + AR("tr-a1"), w("Nhớ:"), 0.07),
                     TYPE("#tr-t1", w("Nhớ:") + 0.2, 0.04), IN("#tr-t2", "blur", w("rồi mới"))]),
    ]),
    # ------------------------------------------------------------ password
    dict(id="password", world=(1920, 1080), hud="", cam="".join([
        head("pw", "Lưu mật khẩu", "Hash phải chậm"),
        rule("pw-rule", "Không lưu mật khẩu thô, không dùng hash nhanh", "Dùng hash chậm có salt: bcrypt, PBKDF2, Argon2"),
        titled("pw-a", 110, 270, 820, 230, "SHA-256", "~10 triệu / giây", "một luồng, máy tác giả", "red", 56),
        titled("pw-b", 990, 270, 830, 230, "PBKDF2 · 600.000 vòng", "~200 ms / lần", "khoảng 5 lần mỗi giây", "green", 56),
        cbox("pw-ca", 110, 550, 820, "Nhanh",
             "MessageDigest.getInstance(\"SHA-256\")\n"
             "    .digest(password.getBytes());", "violet", 26),
        cbox("pw-cb", 990, 550, 830, "Chậm, có salt",
             "SecretKeyFactory.getInstance(\"PBKDF2WithHmacSHA256\")\n"
             "  .generateSecret(new PBEKeySpec(\n"
             "      password, salt, 600_000, 256));", "violet", 26),
        tag("pw-u1", 110, 560, 460, 100, "An · cùng mật khẩu", "cyan", 30),
        tag("pw-u2", 110, 700, 460, 100, "Bình · cùng mật khẩu", "cyan", 30),
        tag("pw-s", 700, 630, 380, 100, "+ salt riêng", "amber", 32),
        tag("pw-h1", 1210, 560, 610, 100, "hash A", "green", 32),
        tag("pw-h2", 1210, 700, 610, 100, "hash B, khác hẳn", "green", 32),
        note("pw-rt", 110, 840, 1710, "✓ Không dùng được bảng tra sẵn (rainbow table)", "green", 32),
        *[tag(f"pw-e{i}", 110 + i * 580, 580, 550, 100, t, "cyan", 28)
          for i, t in enumerate(["BCryptPasswordEncoder", "Argon2PasswordEncoder", "DelegatingPasswordEncoder"])],
        note("pw-sp", 110, 720, 1710, "Spring: dùng PasswordEncoder, đừng tự viết · tăng số vòng khi phần cứng mạnh lên", "green", 30),
        take("pw", "Mật khẩu chỉ cần so sánh", "hash một chiều, chậm, có salt · không mã hoá hai chiều"),
        wires(arrow("pw-b1", [(575, 610), (695, 665)], "muted"), arrow("pw-b2", [(575, 750), (695, 695)], "muted"),
              arrow("pw-b3", [(1085, 665), (1205, 610)], "muted"), arrow("pw-b4", [(1085, 695), (1205, 750)], "muted")),
    ]), beats=[
        B("Phần tiếp theo là lưu mật khẩu. Không lưu mật khẩu thô, và cũng không dùng hash nhanh như SHA hai năm sáu. Hãy dùng hash chậm, có salt.",
          "Không lưu thô, không hash nhanh. Dùng hash chậm có salt.",
          lambda w: [IN("#pw-eye", "blur"), TYPE("#pw-q", 0.2, 0.05), IN("#pw-rule", "up", w("Không lưu"))]),
        B("Đã chạy trên máy tác giả, một luồng: SHA hai năm sáu băm khoảng mười triệu lần mỗi giây, và GPU còn nhanh hơn nhiều. Kẻ trộm database dò mật khẩu yếu rất nhanh.",
          "SHA-256: khoảng 10 triệu lần mỗi giây.",
          lambda w: [OUT("#pw-rule", "blur", 0, 0.4), *shrink("pw", 0), IN("#pw-a", "up", w("SHA hai")), IN("#pw-ca", "blur", w("mười triệu"), 0.7),
                     SHAKE("#pw-a", w("Kẻ trộm"))]),
        B("Hash chậm thì khác. PBKDF hai với sáu trăm nghìn vòng mất khoảng hai trăm mili giây mỗi lần, tức chỉ khoảng năm lần mỗi giây. Mỗi lần thử của kẻ tấn công đắt hơn hàng triệu lần.",
          "PBKDF2 600.000 vòng: khoảng 200 ms mỗi lần.",
          lambda w: [IN("#pw-b", "up", w("PBKDF hai")), IN("#pw-cb", "blur", w("hai trăm"), 0.7), PULSE("#pw-b", w("Mỗi lần thử"))]),
        B("Salt riêng cho mỗi người. Hai người cùng mật khẩu vẫn ra hai hash khác nhau, nên không dùng được bảng tra sẵn.",
          "Salt riêng: cùng mật khẩu, hai hash khác nhau.",
          lambda w: [OUT(S("pw-ca", "pw-cb"), "blur", 0, 0.5), IN("#pw-u1", "up", w("Hai người")), IN("#pw-u2", "up", w("Hai người") + 0.3),
                     *ARW("pw-b1", w("cùng mật"), 0.4), *ARW("pw-b2", w("cùng mật"), 0.4), IN("#pw-s", "pop", w("cùng mật") + 0.3),
                     *ARW("pw-b3", w("vẫn ra"), 0.4), *ARW("pw-b4", w("vẫn ra"), 0.4), IN("#pw-h1", "up", w("vẫn ra") + 0.3), IN("#pw-h2", "up", w("vẫn ra") + 0.5),
                     IN("#pw-rt", "up", w("nên không"))]),
        B("Trong Spring, dùng Password Encoder như BCrypt hay Argon hai, đừng tự viết. Số vòng nên tăng dần khi phần cứng mạnh lên.",
          "Spring: PasswordEncoder, đừng tự viết.",
          lambda w: [OUT(S("pw-u1", "pw-u2", "pw-s", "pw-h1", "pw-h2", "pw-rt") + ", " + AR("pw-b1", "pw-b2", "pw-b3", "pw-b4"), "blur", 0, 0.5),
                     IN("#pw-e0", "up", w("BCrypt")), IN("#pw-e1", "up", w("Argon")), IN("#pw-e2", "up", w("đừng tự")), IN("#pw-sp", "up", w("Số vòng"))]),
        B("Và nhớ: mật khẩu không cần giải mã ngược, chỉ cần so sánh. Nên dùng hash một chiều, chậm, có salt, chứ không dùng mã hoá hai chiều.",
          "Hash một chiều, chậm, có salt.",
          lambda w: [DIM(S("pw-eye", "pw-q", "pw-a", "pw-b", "pw-e0", "pw-e1", "pw-e2", "pw-sp"), 0, 0.07),
                     TYPE("#pw-t1", 0.4, 0.04), IN("#pw-t2", "blur", w("Nên dùng"))]),
    ]),
    # ------------------------------------------------------------ encryption at rest
    dict(id="encryption-at-rest", world=(1920, 1080), hud="", cam="".join([
        head("en", "Mã hoá file nhạy cảm", "AES-GCM cho nội dung, RSA bọc khoá", 76),
        rule("en-rule", "Hash cho thứ chỉ cần so sánh. Mã hoá cho thứ phải đọc lại", "Ảnh CCCD, hợp đồng trên MinIO hay S3: lộ bucket vẫn không đọc được"),
        titled("en-f", 110, 270, 500, 160, "file khách tải lên", "1 MB", "", "amber", 56),
        titled("en-rsa", 710, 270, 520, 160, "public key", "RSA-2048 OAEP", "", "violet", 38),
        titled("en-lim", 1330, 270, 490, 160, "tối đa mỗi lần", "190 byte", "256 − 2×32 − 2", "red", 52),
        bigerr("en-ex", 110, 480, 1710, "✕ IllegalBlockSizeException: Data must not be longer than 190 bytes", 32),
        tag("en-sl1", 110, 630, 830, 110, "Chia khối: 5264 × ~0,96 ms ≈ 5 giây", "red", 30),
        tag("en-sl2", 990, 630, 830, 110, "AES-GCM cùng 1 MB: ~11 ms", "green", 30),
        titled("en-iv", 110, 260, 480, 130, "IV (nonce) ngẫu nhiên", "12 byte", "", "cyan", 40),
        titled("en-dk", 110, 430, 480, 150, "data key AES-256", "32 byte", "mỗi file một khoá", "cyan", 40),
        titled("en-aes", 700, 290, 380, 160, "mã hoá nội dung", "AES-GCM", "", "violet", 44),
        titled("en-ct", 1180, 290, 640, 160, "ciphertext + auth tag", "1000016 byte", "1 MB + tag 16 byte", "green", 44),
        titled("en-rw", 700, 590, 380, 140, "bọc khoá", "RSA-OAEP", "", "violet", 40),
        titled("en-ek", 1180, 590, 640, 140, "encrypted key", "256 byte", "", "green", 44),
        tag("en-st", 110, 780, 1710, 100, "Lưu cùng nhau: encrypted key + IV + ciphertext", "amber", 32),
        tag("en-tm", 110, 780, 1710, 100, "✓ Lật một bit trên bucket → AEADBadTagException: Tag mismatch", "green", 30),
        card("en-k0", 110, 290, 540, 330, "IV không lặp", "lặp cặp (khoá, IV) lộ XOR hai bản rõ, giả được tag · SecureRandom mỗi lần", "red", 38, 28),
        card("en-k1", 690, 290, 540, 330, "Không dùng \"AES\" trần", "mặc định AES/ECB: không IV, không tag · ghi rõ AES/GCM/NoPadding", "red", 38, 28),
        card("en-k2", 1270, 290, 550, 330, "Khoá không nằm trong code", "KEK trong KMS, Vault hoặc HSM · xoay khoá chỉ bọc lại DEK", "green", 38, 28),
        take("en", "Nhanh lo dữ liệu, RSA chỉ bọc khoá", "lưu encrypted key + IV + ciphertext · khoá bọc ở KMS"),
        wires(arrow("en-a1", [(595, 325), (695, 355)], "muted"), arrow("en-a2", [(595, 480), (695, 405)], "muted"),
              arrow("en-a3", [(1085, 370), (1175, 370)], "muted"), arrow("en-a4", [(595, 530), (695, 640)], "muted"),
              arrow("en-a5", [(1085, 660), (1175, 660)], "muted"), arrow("en-a6", [(615, 350), (705, 350)], "muted"),
              arrow("en-a7", [(1235, 350), (1325, 350)], "muted")),
    ]), beats=[
        B("Mật khẩu chỉ cần so sánh. Nhưng ảnh căn cước hay hợp đồng khách tải lên thì app phải mở lại được, nên cần mã hoá, không phải hash.",
          "Thứ phải đọc lại thì mã hoá, không hash.",
          lambda w: [IN("#en-eye", "blur"), TYPE("#en-q", 0.2, 0.04), IN("#en-rule", "up", w("Nhưng ảnh"))]),
        B("Ý đầu tiên là dùng RSA public key mã hoá cả file. Nhưng RSA hai nghìn không trăm bốn mươi tám bit chỉ nhận tối đa một trăm chín mươi byte. Đã chạy với file một megabyte: Illegal Block Size Exception.",
          "RSA-2048 OAEP: tối đa 190 byte mỗi lần.",
          lambda w: [OUT("#en-rule", "blur", 0, 0.4), *shrink("en", 0), IN("#en-f", "up", w("mã hoá cả")), *ARW("en-a6", w("mã hoá cả") + 0.3, 0.4),
                     IN("#en-rsa", "up", w("mã hoá cả") + 0.6), *ARW("en-a7", w("chỉ nhận"), 0.4), IN("#en-lim", "pop", w("chỉ nhận") + 0.3),
                     IN("#en-ex", "up", w("Đã chạy")), SHAKE("#en-ex", w("Illegal"))]),
        B("Chia nhỏ thì sao? Một megabyte thành năm nghìn hai trăm sáu mươi tư khối, mất khoảng năm giây để mở. AES GCM giải mã cùng file chỉ khoảng mười một mili giây.",
          "Chia khối RSA: khoảng 5 giây. AES-GCM: khoảng 11 ms.",
          lambda w: [IN("#en-sl1", "up", w("Một megabyte")), IN("#en-sl2", "up", w("AES GCM"))]),
        B("Cách chuẩn là mã hoá lai. Mỗi file một khoá AES ngẫu nhiên ba mươi hai byte, và một Nonce ngẫu nhiên mười hai byte. AES GCM mã hoá nội dung, và thêm một auth tag mười sáu byte.",
          "Hybrid: AES-256-GCM cho nội dung, IV 12 byte, tag 16 byte.",
          lambda w: [OUT(S("en-f", "en-rsa", "en-lim", "en-ex", "en-sl1", "en-sl2") + ", " + AR("en-a6", "en-a7"), "blur", 0, 0.5),
                     IN("#en-dk", "up", w("Mỗi file")), IN("#en-iv", "up", w("một Nonce")), *ARW("en-a1", w("AES GCM mã"), 0.4), *ARW("en-a2", w("AES GCM mã"), 0.4),
                     IN("#en-aes", "up", w("AES GCM mã") + 0.3), *ARW("en-a3", w("và thêm"), 0.4), IN("#en-ct", "up", w("và thêm") + 0.3)]),
        B("Rồi dùng RSA public key bọc ba mươi hai byte khoá AES đó, ra encrypted key hai trăm năm mươi sáu byte. Lưu ba thứ cùng nhau: encrypted key, Nonce và ciphertext.",
          "RSA-OAEP bọc khoá AES: encrypted key 256 byte.",
          lambda w: [*ARW("en-a4", w("bọc ba"), 0.4), IN("#en-rw", "up", w("bọc ba") + 0.3), *ARW("en-a5", w("ra encrypted"), 0.4),
                     IN("#en-ek", "up", w("ra encrypted") + 0.3), IN("#en-st", "up", w("Lưu ba"))]),
        B("Đã chạy: ciphertext dài hơn bản gốc đúng mười sáu byte, giải mã lại khớp. Lật một bit trên bucket thì giải mã báo Tag mismatch, không trả ra byte giả nào.",
          "Sửa một byte: giải mã báo Tag mismatch.",
          lambda w: [PULSE("#en-ct", 0.3), OUT("#en-st", "blur", w("Lật một") - 0.4, 0.4), IN("#en-tm", "up", w("Lật một")), PULSE("#en-tm", w("Tag mismatch"))]),
        B("Ba điều cần nhớ. Không bao giờ dùng lại Nonce với cùng khoá, hãy sinh bằng Secure Random mỗi lần. Đừng gọi Cipher get Instance AES trần, vì nó rơi về chế độ ECB, không Nonce, không tag. Và private key không nằm trong code: để trong dịch vụ quản lý khoá, Vault hay HSM. Xoay khoá chỉ cần bọc lại data key.",
          "IV không lặp · ghi rõ AES/GCM · khoá bọc ở KMS.",
          lambda w: [OUT(S("en-iv", "en-dk", "en-aes", "en-ct", "en-rw", "en-ek", "en-tm") + ", " + AR("en-a1", "en-a2", "en-a3", "en-a4", "en-a5"), "blur", 0, 0.5),
                     IN("#en-k0", "up", w("Không bao giờ")), IN("#en-k1", "up", w("Đừng gọi")), IN("#en-k2", "up", w("Và private"))]),
        B("Tóm lại: thuật toán nhanh lo dữ liệu lớn, RSA chỉ bọc khoá nhỏ.",
          "AES-GCM lo dữ liệu, RSA chỉ bọc khoá.",
          lambda w: [DIM(S("en-eye", "en-q", "en-k0", "en-k1", "en-k2"), 0, 0.07), TYPE("#en-t1", 0.3, 0.04), IN("#en-t2", "blur", w("RSA chỉ"))]),
    ]),
    # ------------------------------------------------------------ drill
    dict(id="ghep-chan", world=(1920, 1080), hud="", cam="".join([
        head("gc", "Bài tập", "Lỗ hổng nào, chặn thế nào?"),
        *[box(f"gc-d{i}", 110, 250 + i * 110, 1120, 95, f'<span style="font-size:28px;text-align:left;width:100%">{esc(q)}</span>', "cyan")
          for i, (q, _a) in enumerate(DRILL)],
        *[tag(f"gc-a{i}", 1270, 250 + i * 110, 550, 95, a, "green", 28) for i, (_q, a) in enumerate(DRILL)],
        take("gc", "Chặn ở đúng chỗ", "tách dữ liệu khỏi lệnh · mã hoá đầu ra · quyền theo object · làm chậm kẻ dò"),
    ]), beats=[
        B("Giờ thử ghép lỗ hổng với cách chặn. Ô tìm kiếm ghép chuỗi vào câu SQL: prepared statement. Bình luận chứa thẻ script chạy trên máy người xem: mã hoá đầu ra.",
          "Ghép lỗ hổng với cách chặn (1 - 2).",
          lambda w: [IN("#gc-eye", "blur"), TYPE("#gc-q", 0.2, 0.05), *shrink("gc", 0.3),
                     IN("#gc-d0", "right", w("Ô tìm")), IN("#gc-a0", "pop", w("prepared")), IN("#gc-d1", "right", w("Bình luận")), IN("#gc-a1", "pop", w("mã hoá đầu"))]),
        B("Đổi số đơn hàng để xem đơn người khác: kiểm tra quyền theo object. Xem trước liên kết bị trỏ vào địa chỉ metadata: allowlist và chặn IP nội bộ.",
          "Bài tập (3 - 4).",
          lambda w: [IN("#gc-d2", "right", 0.1), IN("#gc-a2", "pop", w("kiểm tra quyền")), IN("#gc-d3", "right", w("Xem trước")), IN("#gc-a3", "pop", w("allowlist"))]),
        B("Tải file bị dùng với chấm chấm gạch chéo: chuẩn hoá đường dẫn rồi kiểm tra. Database bị lộ, kẻ trộm dò mật khẩu: hash chậm có salt.",
          "Bài tập (5 - 6).",
          lambda w: [IN("#gc-d4", "right", 0.1), IN("#gc-a4", "pop", w("chuẩn hoá")), IN("#gc-d5", "right", w("Database")), IN("#gc-a5", "pop", w("hash chậm"))]),
        B("Mỗi lỗ hổng có một cách chặn ở đúng chỗ: tách dữ liệu khỏi lệnh, mã hoá đầu ra, kiểm tra quyền theo object, kiểm tra đích thật, chuẩn hoá đường dẫn, hay làm chậm kẻ dò.",
          "Mỗi lỗ hổng, một cách chặn đúng chỗ.",
          lambda w: [DIM(S("gc-eye", "gc-q", *[f"gc-d{i}" for i in range(6)], *[f"gc-a{i}" for i in range(6)]), 0, 0.07),
                     TYPE("#gc-t1", 0.2, 0.04), IN("#gc-t2", "blur", w("tách dữ liệu"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 190 + i * 96, 1660, 82, row(k, t), "cyan", "row") for i, (k, t) in enumerate(SUMMARY)],
        el("ou-cta", 0, 900, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Hầu hết lỗ hổng injection đến từ việc để dữ liệu bị hiểu thành lệnh. SQL injection chặn bằng prepared statement, Cross Site Scripting chặn bằng mã hoá đầu ra theo ngữ cảnh.",
          "Dữ liệu không được thành lệnh.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("SQL injection")), IN("#ou-r1", "right", w("Cross Site"))]),
        B("Lỗi IDOR cần kiểm tra quyền theo object ở mọi endpoint. Server bị lừa gọi nội bộ thì phân giải DNS rồi chặn IP nội bộ. Path traversal thì chuẩn hoá rồi kiểm tra thư mục gốc.",
          "IDOR · SSRF · Path traversal.",
          lambda w: [IN("#ou-r2", "right", 0.2), IN("#ou-r3", "right", w("Server bị")), IN("#ou-r4", "right", w("Path traversal"))]),
        B("Mật khẩu dùng hash chậm có salt. File nhạy cảm dùng AES GCM cho nội dung, RSA chỉ bọc khoá.",
          "Mật khẩu và file nhạy cảm.",
          lambda w: [IN("#ou-r5", "right", 0.2), IN("#ou-r6", "right", w("File nhạy"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
