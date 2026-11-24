"""Java Date-Time API explainer: Instant vs LocalDateTime vs ZonedDateTime, Duration vs Period, DST gap and overlap,
SimpleDateFormat vs DateTimeFormatter, storing in UTC with ISO-8601, injecting Clock.

Every output comes from the lesson (web/src/data/lessons/java-time.ts), run on JDK 21:
Instant 2026-02-10T07:00:00Z -> 14:00+07:00 (Ho Chi Minh), 02:00-05:00 (New York);
New York 2026-03-07T12:00 plus Duration 24h = 03-08T13:00, plusDays(1) = 03-08T12:00, Duration.between PT23H, Period.between P1D;
gap 02:30 on 03-08 -> 03:30-04:00; overlap 01:30 on 11-01 -> -04:00 first, withLaterOffsetAtOverlap -> -05:00;
8 threads x 3000 parses: SimpleDateFormat wrong results or exceptions, DateTimeFormatter 0 wrong;
17:00 in Vietnam -> 2026-03-08T10:00:00Z; Clock.fixed 23:59:59Z -> not expired, offset 2 s -> expired.
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
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35;padding:22px 28px;text-align:center")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=44, ds=30, spacer=0):
    sp = f'<div style="height:{spacer}px"></div>' if spacer else ""
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>{sp}', tone, "card")


def take(p, big, small, y=400):
    return (el(f"{p}-t1", 0, y, 1920, None, letters(big), "take r")
            + el(f"{p}-t2", 0, y + 140, 1920, None, esc(small), "take-sm r"))


TYPES = [("Instant", "một thời điểm"), ("LocalDateTime", "ngày giờ trần"), ("ZonedDateTime", "ngày giờ kèm múi giờ"),
         ("Duration", "giờ, phút, giây"), ("Period", "ngày, tháng, năm")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Java · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Date-Time API"), "h1 r", "font-size:120px"),
        *[box(f"hk-c{i}", 85 + i * 355, 420, 330, 300,
              f'<b style="font-size:32px">{n}</b><span style="font-size:28px;color:var(--muted);text-align:center">{d}</span>', "cyan", "card")
          for i, (n, d) in enumerate(TYPES)],
        chip("hk-p1", 520, 850, "Code chạy thật", "green"),
        chip("hk-p2", 1130, 850, "Bẫy hay bị hỏi", "amber"),
        el("hk-t1", 0, 400, 1920, None, letters("Lưu Instant"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "đổi múi giờ khi hiển thị", "take-sm r"),
        wires(arrow("hk-a1", [(800, 882), (1110, 882)], "muted")),
    ]), beats=[
        B("Người phỏng vấn hỏi: hệ thống có khách ở nhiều quốc gia, bạn lưu thời điểm tạo đơn hàng bằng kiểu nào?",
          "Khách ở nhiều quốc gia: lưu thời điểm bằng kiểu nào?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Phần này nói về Date Time API: Instant, Local Date Time, Zoned Date Time, Duration và Period.",
          "5 kiểu của java.time.",
          lambda w: [IN("#hk-c0", "pop", w("Instant")), IN("#hk-c1", "pop", w("Local Date Time")), IN("#hk-c2", "pop", w("Zoned Date Time")),
                     IN("#hk-c3", "pop", w("Duration")), IN("#hk-c4", "pop", w("và Period"))]),
        B("Mỗi phần có code chạy thật, và những cái bẫy hay bị hỏi: một ngày không phải lúc nào cũng hai mươi bốn giờ, giờ có thể không tồn tại hay xuất hiện hai lần.",
          "Code chạy thật và bẫy hay bị hỏi.",
          lambda w: [IN("#hk-p1", "left", w("code chạy")), *ARROW("hk-a1", w("và những") - 0.5, 0.5), IN("#hk-p2", "pop", w("những cái bẫy"))]),
        B("Câu trả lời ngắn: lưu Instant, đổi múi giờ khi hiển thị.",
          "Lưu Instant, đổi múi giờ khi hiển thị.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", w("đổi múi giờ"))]),
    ]),
    # ------------------------------------------------------------ types
    dict(id="types", world=(1920, 1080), hud="", cam="".join([
        head("ty", "Chọn kiểu", "Instant, LocalDateTime, ZonedDateTime", 72),
        rule("ty-rule", "Lưu một thời điểm bằng Instant", "Đổi múi giờ khi hiển thị. Instant luôn tính theo UTC"),
        card("ty-c0", 90, 280, 540, 300, "Instant", "một thời điểm trên trục thời gian, luôn tính theo UTC", "green", 44, 30),
        card("ty-c1", 690, 280, 540, 300, "LocalDateTime", "ngày giờ ghi trên đồng hồ, không biết múi giờ", "red", 44, 30),
        card("ty-c2", 1290, 280, 540, 300, "ZonedDateTime", "ngày giờ kèm múi giờ", "cyan", 44, 30),
        tag("ty-u1", 260, 680, 560, 100, "Việt Nam: UTC+7", "amber", 32),
        tag("ty-u2", 1100, 680, 560, 100, "New York mùa đông: UTC-5", "amber", 32),
        tag("ty-ev", 560, 250, 800, 90, "Sự kiện lúc 07:00Z", "violet", 34),
        titled("ty-l", 90, 400, 800, 320, "LocalDateTime.now() trên mỗi server", "VN 14:00 · NY 02:00", "hai con số trần, không biết cái nào sớm hơn", "red", 52),
        titled("ty-r", 1030, 400, 800, 320, "Instant.now() trên mỗi server", "07:00:00Z cả hai", "một giá trị duy nhất", "green", 52),
        cbox("ty-code", 90, 280, 900, "Display.java",
             "Instant t = Instant.now();\n"
             "t.atZone(ZoneId.of(\"Asia/Ho_Chi_Minh\"));", "violet", 26),
        titled("ty-vn", 1100, 280, 730, 150, "Việt Nam", "14:00+07:00", "", "green", 48),
        titled("ty-ny", 1100, 470, 730, 150, "New York", "02:00-05:00", "", "green", 48),
        note("ty-src", 90, 560, 900, "Cùng một thời điểm 2026-02-10T07:00:00Z", "green", 32),
        card("ty-k1", 90, 280, 860, 300, "LocalDate", "ngày không cần giờ: sinh nhật, hạn thanh toán", "cyan", 46, 30),
        card("ty-k2", 970, 280, 860, 300, "OffsetDateTime", "ngày giờ kèm độ lệch như +07:00, khớp kiểu cột TIMESTAMP WITH TIME ZONE", "cyan", 46, 30),
        el("ty-t1", 0, 400, 1920, None, letters("Lưu và truyền Instant"), "take r"),
        el("ty-t2", 0, 540, 1920, None, "chỉ gắn múi giờ khi cần cho người xem", "take-sm r"),
    ]), beats=[
        B("Câu hỏi đầu tiên: lưu thời điểm tạo đơn hàng bằng kiểu nào? Có ba kiểu hay dùng là Instant, Local Date Time và Zoned Date Time.",
          "Lưu một thời điểm: Instant, đổi múi giờ khi hiển thị.",
          lambda w: [IN("#ty-eye", "blur"), TYPE("#ty-q", 0.2, 0.05), IN("#ty-rule", "up", w("Có ba kiểu"))]),
        B("U T C là giờ chuẩn quốc tế, mọi múi giờ tính độ lệch so với nó. Việt Nam là U T C cộng bảy. Instant là một thời điểm trên trục thời gian, luôn theo U T C. Local Date Time chỉ là ngày giờ ghi trên đồng hồ, không biết múi giờ. Zoned Date Time là ngày giờ kèm múi giờ.",
          "Instant · LocalDateTime · ZonedDateTime.",
          lambda w: [OUT("#ty-rule", "blur", 0, 0.4), *shrink("ty", 0),
                     IN("#ty-u1", "up", 0.8), IN("#ty-u2", "up", w("Việt Nam")),
                     IN("#ty-c0", "up", w("Instant là một")), IN("#ty-c1", "up", w("Local Date Time chỉ")), IN("#ty-c2", "up", w("Zoned Date Time là"))]),
        B("Hãy hình dung tờ giấy hẹn ghi mười bốn giờ thứ Ba mà không ghi thành phố. Người ở Hà Nội và New York đọc sẽ tới vào hai thời điểm khác nhau. Cùng một sự kiện lúc bảy giờ sáng U T C, hai server dùng Local Date Time ghi ra mười bốn giờ và hai giờ. Dùng Instant thì cả hai lưu cùng một giá trị.",
          "Hai server, cùng một sự kiện.",
          lambda w: [OUT(S("ty-c0", "ty-c1", "ty-c2", "ty-u1", "ty-u2"), "blur", 0, 0.5), IN("#ty-ev", "down", 0.7),
                     IN("#ty-l", "up", w("hai server dùng")), SHAKE("#ty-l", w("hai server dùng") + 1.0), IN("#ty-r", "up", w("Dùng Instant thì")), PULSE("#ty-r", w("cùng một giá trị"))]),
        B("Chỉ đổi múi giờ ở lớp hiển thị. Gọi at Zone với múi giờ Hồ Chí Minh, bảy giờ U T C thành mười bốn giờ cộng bảy. Ở New York là hai giờ sáng, trừ năm. Đã chạy đúng như vậy.",
          "atZone: 07:00Z thành 14:00+07:00 và 02:00-05:00.",
          lambda w: [OUT(S("ty-ev", "ty-l", "ty-r"), "blur", 0, 0.5), IN("#ty-code", "blur", 0.6, 0.7), IN("#ty-src", "up", 1.0),
                     IN("#ty-vn", "up", w("Hồ Chí Minh")), IN("#ty-ny", "up", w("Ở New York"))]),
        B("Ngoài ra, Local Date dành cho ngày không cần giờ, như sinh nhật. Offset Date Time là ngày giờ kèm độ lệch cố định, hay dùng khi lưu database vì khớp với kiểu cột timestamp with time zone.",
          "LocalDate và OffsetDateTime.",
          lambda w: [OUT(S("ty-code", "ty-src", "ty-vn", "ty-ny"), "blur", 0, 0.5), IN("#ty-k1", "up", 0.6), IN("#ty-k2", "up", w("Offset Date Time"))]),
        B("Nhớ một điều: lưu và truyền Instant, chỉ gắn múi giờ khi cần cho người xem.",
          "Lưu và truyền Instant.",
          lambda w: [OUT(S("ty-k1", "ty-k2", "ty-eye", "ty-q"), "blur", 0, 0.5), TYPE("#ty-t1", 0.6, 0.04), IN("#ty-t2", "blur", w("chỉ gắn"))]),
    ]),
    # ------------------------------------------------------------ dst
    dict(id="dst", world=(1920, 1080), hud="", cam="".join([
        head("ds", "Duration và Period", "Một ngày không phải lúc nào cũng 24 giờ", 72),
        rule("ds-rule", "Duration đo giờ, phút, giây. Period đo ngày, tháng, năm", "Khác nhau khi qua ngày đổi giờ mùa hè (DST)"),
        titled("ds-t1", 260, 290, 420, 170, "New York, 8/3/2026", "02:00", "", "cyan", 56),
        titled("ds-t2", 1240, 290, 420, 170, "nhảy tiến một giờ", "03:00", "", "amber", 56),
        tag("ds-n1", 460, 600, 1000, 110, "Ngày đó chỉ có 23 giờ", "amber", 40),
        cbox("ds-code", 90, 260, 1000, "Start.java",
             "ZonedDateTime start = ZonedDateTime.of(\n"
             "    2026, 3, 7, 12, 0, 0, 0,\n"
             "    ZoneId.of(\"America/New_York\"));", "violet", 28),
        titled("ds-r1", 1150, 260, 680, 170, "start.plus(Duration.ofHours(24))", "2026-03-08T13:00", "lệch một giờ", "red", 44),
        titled("ds-r2", 1150, 460, 680, 170, "start.plusDays(1)", "2026-03-08T12:00", "giữ đúng giờ đồng hồ", "green", 44),
        titled("ds-m1", 90, 700, 860, 170, "Duration.between hai mốc", "PT23H", "", "cyan", 56),
        titled("ds-m2", 970, 700, 860, 170, "Period.between hai ngày", "P1D", "", "cyan", 56),
        bigerr("ds-err", 150, 280, 1620, "✕ Duration.ofHours(24) thay cho plusDays(1)<br>lệch một giờ mỗi lần đi qua đổi giờ", 44),
        note("ds-n2", 150, 520, 1620, "Việc lặp lại mỗi ngày luôn là phép tính lịch", "green", 40),
        titled("ds-mo", 360, 650, 1200, 170, "LocalDate.of(2026, 1, 31).plusMonths(1)", "2026-02-28", "tự co về cuối tháng, không báo lỗi", "cyan", 52),
        el("ds-t1x", 0, 400, 1920, None, letters("Cộng theo lịch: plusDays"), "take r"),
        el("ds-t2x", 0, 540, 1920, None, "đo thời gian trôi qua thì dùng Duration", "take-sm r"),
        wires(arrow("ds-a1", [(700, 375), (1220, 375)], "amber")),
    ]), beats=[
        B("Một khoảng thời gian thì sao? Duration đo bằng giờ, phút, giây, là thời gian trôi qua thật, như đồng hồ bấm giờ. Period đo bằng ngày, tháng, năm theo lịch. Hai thứ này khác nhau khi qua ngày đổi giờ mùa hè, gọi tắt là D S T.",
          "Duration: thời gian thật. Period: lịch.",
          lambda w: [IN("#ds-eye", "blur"), TYPE("#ds-q", 0.2, 0.05), IN("#ds-rule", "up", w("Duration đo") + 0.3), PULSE("#ds-rule", w("Period đo"))]),
        B("Ngày tám tháng ba năm hai nghìn không trăm hai mươi sáu, New York chuyển sang giờ mùa hè. Đồng hồ nhảy thẳng từ hai giờ lên ba giờ, nên ngày đó chỉ có hai mươi ba giờ.",
          "8/3/2026: 02:00 nhảy thẳng lên 03:00.",
          lambda w: [OUT("#ds-rule", "blur", 0, 0.4), *shrink("ds", 0), IN("#ds-t1", "up", 0.7), *ARROW("ds-a1", w("Đồng hồ nhảy"), 0.7), IN("#ds-t2", "up", w("lên ba giờ")),
                     IN("#ds-n1", "pop", w("hai mươi ba giờ"))]),
        B("Giả sử bắt đầu từ mười hai giờ trưa ngày bảy tháng ba ở New York. Cộng Duration hai mươi bốn giờ ra mấy giờ ngày tám? Là mười ba giờ. Ngày tám mất một giờ trên đồng hồ, nên hai mươi bốn giờ trôi qua thật đưa kim tới mười ba giờ.",
          "start + 24 giờ ra 13:00, không phải 12:00.",
          lambda w: [OUT(S("ds-t1", "ds-t2", "ds-n1") + ", " + AR("ds-a1"), "blur", 0, 0.5), IN("#ds-code", "blur", 0.6, 0.7), PULSE("#ds-code", w("mười hai giờ trưa")),
                     IN("#ds-r1", "up", w("Cộng Duration")), SHAKE("#ds-r1", w("Là mười ba giờ") + 0.3)]),
        B("Cộng một ngày bằng plus Days thì ra mười hai giờ, giữ đúng giờ trên đồng hồ. Đo hai mốc thì Duration between ra P T hai mươi ba H, còn Period between hai ngày ra P một D. Một ngày lịch dài hai mươi ba giờ hôm đó.",
          "plusDays giữ 12:00. PT23H và P1D.",
          lambda w: [IN("#ds-r2", "up", 0.3), IN("#ds-m1", "up", w("Đo hai mốc")), IN("#ds-m2", "up", w("còn Period"))]),
        B("Bẫy hay gặp: dùng Duration để cộng ngày, mỗi lần đi qua đổi giờ sẽ lệch một giờ. Việc lặp lại mỗi ngày luôn là phép tính lịch. Tương tự, ngày ba mươi mốt tháng một cộng một tháng ra ngày hai mươi tám tháng hai, tự co về cuối tháng chứ không báo lỗi.",
          "Bẫy: Duration để cộng ngày. Tháng tự co về cuối tháng.",
          lambda w: [OUT(S("ds-code", "ds-r1", "ds-r2", "ds-m1", "ds-m2"), "blur", 0, 0.5), IN("#ds-err", "up", 0.7), SHAKE("#ds-err", 1.4), IN("#ds-n2", "up", w("Việc lặp lại")),
                     OUT(S("ds-err", "ds-n2"), "blur", w("Tương tự") - 0.5, 0.5), IN("#ds-mo", "up", w("Tương tự"))]),
        B("Cộng theo lịch thì dùng plus Days, plus Months. Đo thời gian trôi qua thì dùng Duration.",
          "Lịch: plusDays. Thời gian trôi qua: Duration.",
          lambda w: [OUT(S("ds-mo", "ds-eye", "ds-q"), "blur", 0, 0.5), TYPE("#ds-t1x", 0.6, 0.04), IN("#ds-t2x", "blur", w("Đo thời gian"))]),
    ]),
    # ------------------------------------------------------------ gap
    dict(id="gap", world=(1920, 1080), hud="", cam="".join([
        head("gp", "Gap và overlap", "Giờ không tồn tại và giờ xuất hiện hai lần", 70),
        rule("gp-rule", "Nhảy tiến: giờ không tồn tại (gap). Nhảy lùi: giờ xuất hiện hai lần (overlap)", "ZonedDateTime có quy tắc mặc định, bạn nên biết quy tắc đó"),
        titled("gp-g", 90, 270, 860, 300, "Gap · 8/3/2026 · 02:00 nhảy lên 03:00", "02:00 tới 02:59", "không tồn tại", "red", 56),
        titled("gp-o", 970, 270, 860, 300, "Overlap · 1/11/2026 · 02:00 lùi về 01:00", "01:00 tới 01:59", "xuất hiện hai lần", "amber", 56),
        tag("gp-o1", 970, 640, 420, 100, "-04:00 lần đầu", "amber", 32),
        tag("gp-o2", 1410, 640, 420, 100, "-05:00 lần sau", "amber", 32),
        cbox("gp-code", 90, 270, 1000, "Overlap.java",
             "ZonedDateTime.of(localDateTime, zone)\n"
             "// 01:30 ngày 1/11: mặc định lần đầu\n"
             "zdt.withLaterOffsetAtOverlap()\n"
             "// chọn lần thứ hai", "violet", 28),
        titled("gp-r1", 1150, 270, 680, 170, "mặc định", "01:30-04:00", "lần đầu", "green", 48),
        titled("gp-r2", 1150, 470, 680, 170, "withLaterOffsetAtOverlap()", "01:30-05:00", "lần sau", "green", 48),
        titled("gp-s1", 150, 300, 520, 170, "hẹn 8/3", "02:30", "không tồn tại", "red", 56),
        titled("gp-s2", 1250, 300, 520, 170, "ZonedDateTime.of(...)", "03:30-04:00", "đẩy tiến", "green", 56),
        note("gp-tr1", 150, 580, 1620, "getTransition: Gap at 2026-03-08T02:00-05:00 to -04:00", "green", 32),
        note("gp-tr2", 150, 650, 1620, "getTransition: Overlap at 2026-11-01T02:00-04:00 to -05:00", "green", 32),
        tag("gp-b1", 160, 270, 1600, 120, "Chạy 02:30 mỗi ngày: rơi vào gap ngày 8/3, có thể bị bỏ qua", "red", 34),
        tag("gp-b2", 160, 420, 1600, 120, "Chạy 01:30 mỗi ngày: rơi vào overlap ngày 1/11, có thể chạy hai lần", "red", 34),
        tag("gp-b3", 160, 590, 1600, 110, "Lịch hệ thống: dùng UTC", "green", 36),
        tag("gp-b4", 160, 730, 1600, 110, "Lịch theo giờ địa phương: khai báo múi giờ, tránh 01:00 tới 02:59", "amber", 34),
        el("gp-t1", 0, 400, 1920, None, letters("Lịch hệ thống dùng UTC"), "take r"),
        el("gp-t2", 0, 540, 1920, None, "giờ địa phương thì khai báo múi giờ", "take-sm r"),
        wires(arrow("gp-a1", [(690, 385), (1230, 385)], "green")),
    ]), beats=[
        B("Ngày đổi giờ còn tạo ra hai chuyện lạ. Đồng hồ nhảy tiến thì có giờ không tồn tại, gọi là gap. Đồng hồ nhảy lùi thì có giờ xuất hiện hai lần, gọi là overlap.",
          "Gap: giờ không tồn tại. Overlap: giờ hai lần.",
          lambda w: [IN("#gp-eye", "blur"), TYPE("#gp-q", 0.2, 0.05), IN("#gp-rule", "up", w("Ngày đổi giờ") + 0.3)]),
        B("Ở New York năm hai nghìn không trăm hai mươi sáu, ngày tám tháng ba đồng hồ nhảy từ hai giờ lên ba giờ, nên mọi giờ từ hai giờ tới hai giờ năm mươi chín không tồn tại. Ngày một tháng mười một đồng hồ lùi về một giờ, nên giờ từ một giờ tới một giờ năm mươi chín xuất hiện hai lần: lần đầu theo giờ mùa hè trừ bốn, lần sau theo giờ mùa đông trừ năm.",
          "8/3: 02:xx không tồn tại. 1/11: 01:xx xuất hiện hai lần.",
          lambda w: [OUT("#gp-rule", "blur", 0, 0.4), *shrink("gp", 0), IN("#gp-g", "up", 0.8), PULSE("#gp-g", w("không tồn tại")),
                     IN("#gp-o", "up", w("Ngày một tháng mười một")), IN("#gp-o1", "pop", w("lần đầu theo")), IN("#gp-o2", "pop", w("lần sau theo"))]),
        B("Vậy một giờ ba mươi ngày một tháng mười một, giờ xuất hiện hai lần, Zoned Date Time chọn lần nào? Mặc định là lần đầu, độ lệch trừ bốn. Muốn lần thứ hai thì gọi with Later Offset At Overlap.",
          "Overlap: mặc định lần đầu. withLaterOffsetAtOverlap: lần sau.",
          lambda w: [OUT(S("gp-g", "gp-o", "gp-o1", "gp-o2"), "blur", 0, 0.5), IN("#gp-code", "blur", 0.6, 0.7),
                     IN("#gp-r1", "up", w("Mặc định là lần đầu")), IN("#gp-r2", "up", w("Muốn lần thứ hai"))]),
        B("Với gap, hẹn hai giờ ba mươi ngày tám tháng ba, giờ không tồn tại, thì được đẩy tiến thành ba giờ ba mươi, trừ bốn. Đã chạy đúng như vậy, và get Transition báo rõ Gap và Overlap.",
          "02:30 ngày 8/3 được đẩy thành 03:30-04:00.",
          lambda w: [OUT(S("gp-code", "gp-r1", "gp-r2"), "blur", 0, 0.5), IN("#gp-s1", "up", 0.7), *ARROW("gp-a1", w("thì được đẩy") - 0.4, 0.6), IN("#gp-s2", "up", w("thành ba giờ")),
                     IN("#gp-tr1", "up", w("get Transition")), IN("#gp-tr2", "up", w("Gap và Overlap"))]),
        B("Bẫy với lịch chạy theo giờ địa phương. Việc chạy hai giờ ba mươi mỗi ngày ở New York rơi vào gap nên có thể bị bỏ qua hôm đó. Việc chạy một giờ ba mươi rơi vào overlap nên có thể chạy hai lần. Lịch hệ thống nên dùng U T C. Lịch gắn với giờ địa phương thì khai báo múi giờ, và tránh khung từ một giờ tới ba giờ sáng.",
          "Bẫy: lịch chạy theo giờ địa phương.",
          lambda w: [OUT(S("gp-s1", "gp-s2", "gp-tr1", "gp-tr2") + ", " + AR("gp-a1"), "blur", 0, 0.5), IN("#gp-b1", "up", 0.7), SHAKE("#gp-b1", w("rơi vào gap") + 0.4),
                     IN("#gp-b2", "up", w("Việc chạy một giờ")), SHAKE("#gp-b2", w("rơi vào overlap") + 0.4),
                     IN("#gp-b3", "up", w("Lịch hệ thống")), IN("#gp-b4", "up", w("Lịch gắn với"))]),
        B("Lưu và so sánh bằng Instant, chỉ dùng Zoned Date Time để hiển thị.",
          "Instant để lưu, ZonedDateTime để hiển thị.",
          lambda w: [OUT(S("gp-b1", "gp-b2", "gp-b3", "gp-b4", "gp-eye", "gp-q"), "blur", 0, 0.5), TYPE("#gp-t1", 0.6, 0.04), IN("#gp-t2", "blur", w("chỉ dùng"))]),
    ]),
    # ------------------------------------------------------------ formatter
    dict(id="formatter", world=(1920, 1080), hud="", cam="".join([
        head("fm", "Formatter", "SimpleDateFormat không an toàn thread", 72),
        rule("fm-rule", "SimpleDateFormat có trạng thái bên trong", "DateTimeFormatter thì bất biến, dùng chung thoải mái"),
        tag("fm-th1", 90, 290, 300, 100, "thread 1", "cyan", 34),
        tag("fm-th2", 90, 450, 300, 100, "thread 2", "cyan", 34),
        tag("fm-th3", 90, 610, 300, 100, "thread 3", "cyan", 34),
        titled("fm-sdf", 700, 390, 560, 260, "static final", "SimpleDateFormat", "một Calendar chung để nháp", "violet", 40),
        bigerr("fm-err", 1400, 430, 430, "✕ kết quả sai<br>hoặc exception", 36),
        titled("fm-b1", 90, 290, 540, 330, "SimpleDateFormat dùng chung", "sai", "kết quả sai hoặc exception", "red", 64),
        titled("fm-b2", 690, 290, 540, 330, "chữa bằng synchronized", "đúng", "nhưng các thread xếp hàng chờ", "amber", 64),
        titled("fm-b3", 1290, 290, 540, 330, "DateTimeFormatter", "0 sai", "không cần khoá", "green", 64),
        note("fm-hdr", 90, 700, 1740, "Đã chạy: 8 thread cùng parse 3000 lần", "green", 38),
        cbox("fm-code", 90, 270, 1050, "Formatter.java",
             "static final DateTimeFormatter F =\n"
             "    DateTimeFormatter.ofPattern(\"yyyy-MM-dd\");\n"
             "LocalDate d = LocalDate.parse(text, F);", "violet", 28),
        note("fm-n1", 1200, 290, 630, "Bất biến: không có trạng thái\nthay đổi để tranh nhau", "green", 34),
        note("fm-n2", 1200, 440, 630, "Date, Calendar, SimpleDateFormat\nlà API cũ. Code mới dùng java.time", "green", 34),
        bigerr("fm-tl", 150, 290, 1620, "ThreadLocal&lt;SimpleDateFormat&gt; ở code cũ: chạy được", 42),
        note("fm-tl2", 150, 470, 1620, "Code mới chỉ cần đổi sang DateTimeFormatter, không phải lo gì về thread", "green", 40),
        el("fm-t1", 0, 400, 1920, None, letters("Bất biến thì an toàn thread"), "take r"),
        el("fm-t2", 0, 540, 1920, None, "không cần khoá", "take-sm r"),
        wires(arrow("fm-a1", [(390, 340), (700, 450)], "red"), arrow("fm-a2", [(390, 500), (700, 520)], "red"), arrow("fm-a3", [(390, 660), (700, 590)], "red"),
              arrow("fm-a4", [(1260, 520), (1390, 520)], "red")),
    ]), beats=[
        B("Bẫy tiếp theo là Simple Date Format. Nó giữ trạng thái bên trong: một field Calendar dùng làm chỗ nháp, mỗi lần parse hay format đều xoá rồi ghi lại. Date Time Formatter thì bất biến.",
          "SimpleDateFormat có trạng thái. DateTimeFormatter bất biến.",
          lambda w: [IN("#fm-eye", "blur"), TYPE("#fm-q", 0.2, 0.05), IN("#fm-rule", "up", w("Bẫy tiếp theo") + 0.4)]),
        B("Dùng chung một instance giữa nhiều thread, ví dụ khai báo static final, thì các thread ghi đè lên chỗ nháp của nhau. Kết quả sai hoặc ném lỗi.",
          "Nhiều thread ghi đè chung một Calendar.",
          lambda w: [OUT("#fm-rule", "blur", 0, 0.4), *shrink("fm", 0), IN("#fm-sdf", "up", 0.7),
                     IN("#fm-th1", "left", w("nhiều thread")), *ARROW("fm-a1", w("nhiều thread") + 0.2, 0.4), IN("#fm-th2", "left", w("nhiều thread") + 0.2), *ARROW("fm-a2", w("nhiều thread") + 0.4, 0.4),
                     IN("#fm-th3", "left", w("nhiều thread") + 0.4), *ARROW("fm-a3", w("nhiều thread") + 0.6, 0.4),
                     *ARROW("fm-a4", w("Kết quả sai") - 0.5, 0.4), IN("#fm-err", "up", w("Kết quả sai")), SHAKE("#fm-err", w("Kết quả sai") + 0.6)]),
        B("Đã chạy tám thread cùng parse ba nghìn lần. Simple Date Format dùng chung cho kết quả sai hoặc exception. Chữa bằng synchronized thì đúng, nhưng các thread phải xếp hàng nên chậm. Date Time Formatter cho không kết quả sai nào.",
          "8 thread x 3000 lần: sai · chậm · 0 sai.",
          lambda w: [OUT(S("fm-th1", "fm-th2", "fm-th3", "fm-sdf", "fm-err") + ", " + AR("fm-a1", "fm-a2", "fm-a3", "fm-a4"), "blur", 0, 0.5), IN("#fm-hdr", "up", 0.6),
                     IN("#fm-b1", "up", w("Simple Date Format dùng chung")), IN("#fm-b2", "up", w("Chữa bằng")), IN("#fm-b3", "up", w("Date Time Formatter cho"))]),
        B("Lý do là Date Time Formatter bất biến, không có trạng thái thay đổi để tranh nhau, nên dùng chung thoải mái mà không cần khoá. Date, Calendar và Simple Date Format là API cũ. Từ Java tám, code mới hãy dùng java time.",
          "Bất biến nên dùng chung được. Code mới dùng java.time.",
          lambda w: [OUT(S("fm-hdr", "fm-b1", "fm-b2", "fm-b3"), "blur", 0, 0.5), IN("#fm-code", "blur", 0.6, 0.7), IN("#fm-n1", "up", w("không có trạng thái")), IN("#fm-n2", "up", w("Date, Calendar"))]),
        B("Ở code cũ bạn hay thấy cách chữa bằng Thread Local bọc Simple Date Format. Cách này chạy được. Nhưng với code mới, chỉ cần đổi sang Date Time Formatter là không phải lo gì về thread.",
          "ThreadLocal chạy được, nhưng code mới đổi sang DateTimeFormatter.",
          lambda w: [OUT(S("fm-code", "fm-n1", "fm-n2"), "blur", 0, 0.5), IN("#fm-tl", "up", 0.7), IN("#fm-tl2", "up", w("Nhưng với code mới"))]),
        B("Nhớ lấy điều này: bất biến thì an toàn thread, không cần khoá.",
          "Bất biến thì an toàn thread.",
          lambda w: [OUT(S("fm-tl", "fm-tl2", "fm-eye", "fm-q"), "blur", 0, 0.5), TYPE("#fm-t1", 0.6, 0.04), IN("#fm-t2", "blur", w("không cần khoá"))]),
    ]),
    # ------------------------------------------------------------ store
    dict(id="store", world=(1920, 1080), hud="", cam="".join([
        head("sr", "Lưu và truyền", "UTC và ISO-8601", 80),
        rule("sr-rule", "Lưu và truyền bằng UTC, đổi múi giờ lúc hiển thị", "Trong JSON: chuỗi ISO-8601 có Z hoặc độ lệch, ví dụ 2026-03-08T10:00:00Z"),
        titled("sr-bad", 90, 280, 800, 320, "Không có múi giờ", "2026-03-08T10:00:00", "10 giờ ở đâu? Instant.parse ném lỗi", "red", 44),
        titled("sr-ok", 1030, 280, 800, 320, "ISO-8601 có Z", "2026-03-08T10:00:00Z", "ở đâu cũng đọc ra một thời điểm", "green", 44),
        note("sr-n1", 90, 680, 1740, "Server hiểu theo giờ máy, client hiểu theo giờ của họ", "red", 36),
        titled("sr-f1", 110, 300, 380, 190, "form người dùng", "17:00", "", "cyan", 44),
        titled("sr-f2", 550, 300, 380, 190, "LocalDateTime", "parse chuỗi", "", "cyan", 34),
        titled("sr-f3", 990, 300, 380, 190, "atZone(vn)", "UTC+7", "", "cyan", 34),
        titled("sr-f4", 1430, 300, 380, 190, "toInstant()", "10:00:00Z", "", "green", 34),
        tag("sr-res", 360, 620, 1200, 110, "17:00 ở Việt Nam = 2026-03-08T10:00:00Z", "green", 38),
        bigerr("sr-ts", 150, 260, 1620, "✕ Cột TIMESTAMP không kèm múi giờ chỉ lưu ngày giờ trần", 40),
        note("sr-ts2", 150, 420, 1620, "Ghi Instant vào cột này, JDBC đổi theo múi giờ mặc định của JVM.\nHai server đặt múi giờ khác nhau sẽ ghi và đọc lệch vài giờ.", "red", 34),
        tag("sr-fx1", 160, 620, 1600, 100, "spring.jpa.properties.hibernate.jdbc.time_zone=UTC", "green", 32),
        tag("sr-fx2", 160, 750, 1600, 100, "hoặc dùng cột TIMESTAMP WITH TIME ZONE", "green", 34),
        el("sr-t1", 0, 400, 1920, None, letters("Lưu UTC, đổi giờ khi hiển thị"), "take r"),
        el("sr-t2", 0, 540, 1920, None, "ISO-8601 có Z hoặc độ lệch, đừng gửi ngày giờ trần", "take-sm r"),
        wires(arrow("sr-a1", [(490, 395), (550, 395)], "cyan"), arrow("sr-a2", [(930, 395), (990, 395)], "cyan"), arrow("sr-a3", [(1370, 395), (1430, 395)], "cyan")),
    ]), beats=[
        B("Còn lưu xuống database và gửi qua A P I? Quy tắc dễ nhớ: lưu và truyền bằng U T C, đổi múi giờ lúc hiển thị. Trong J S O N dùng chuỗi I S O tám sáu không một, có chữ Z hoặc độ lệch.",
          "Lưu và truyền bằng UTC.",
          lambda w: [IN("#sr-eye", "blur"), TYPE("#sr-q", 0.2, 0.06), IN("#sr-rule", "up", w("Quy tắc dễ nhớ") + 0.3)]),
        B("Chuỗi thiếu múi giờ thì thời điểm không xác định: server hiểu theo giờ máy, client hiểu theo giờ của họ, và Instant parse ném Date Time Parse Exception. Chuỗi có chữ Z thì ở đâu cũng đọc ra cùng một thời điểm.",
          "Thiếu múi giờ thì không xác định.",
          lambda w: [OUT("#sr-rule", "blur", 0, 0.4), *shrink("sr", 0), IN("#sr-bad", "up", 0.7), IN("#sr-n1", "up", w("server hiểu")), SHAKE("#sr-bad", w("Instant parse")),
                     IN("#sr-ok", "up", w("Chuỗi có chữ Z")), PULSE("#sr-ok", w("cùng một thời điểm"))]),
        B("Còn giờ người dùng nhập trên form thì sao? Người dùng ở Việt Nam nhập mười bảy giờ. Parse thành Local Date Time, gắn múi giờ Việt Nam bằng at Zone, rồi đổi sang Instant. Đã chạy: ra ngày tám tháng ba, mười giờ U T C.",
          "17:00 ở Việt Nam thành 10:00:00Z.",
          lambda w: [OUT(S("sr-bad", "sr-ok", "sr-n1"), "blur", 0, 0.5), IN("#sr-f1", "up", 0.7), IN("#sr-f2", "up", w("Parse thành")), *ARROW("sr-a1", w("Parse thành") - 0.4, 0.4),
                     IN("#sr-f3", "up", w("gắn múi giờ")), *ARROW("sr-a2", w("gắn múi giờ") - 0.4, 0.4), IN("#sr-f4", "up", w("rồi đổi sang")), *ARROW("sr-a3", w("rồi đổi sang") - 0.4, 0.4),
                     IN("#sr-res", "pop", w("Đã chạy"))]),
        B("Bẫy với database. Cột timestamp không kèm múi giờ chỉ lưu ngày giờ trần. Ghi một Instant vào đó, JDBC đổi sang múi giờ mặc định của JVM, nên hai server đặt múi giờ khác nhau sẽ ghi và đọc lệch nhau vài giờ. Cách tránh: đặt hibernate jdbc time zone bằng U T C, hoặc dùng cột timestamp with time zone.",
          "Bẫy: cột TIMESTAMP không có múi giờ.",
          lambda w: [OUT(S("sr-f1", "sr-f2", "sr-f3", "sr-f4", "sr-res") + ", " + AR("sr-a1", "sr-a2", "sr-a3"), "blur", 0, 0.5), IN("#sr-ts", "up", 0.7), SHAKE("#sr-ts", 1.4),
                     IN("#sr-ts2", "up", w("Ghi một Instant")), IN("#sr-fx1", "up", w("Cách tránh")), IN("#sr-fx2", "up", w("hoặc dùng cột"))]),
        B("Với J P A và Hibernate sáu, trên entity dùng Instant hoặc Offset Date Time cho cột thời điểm, và Local Date cho ngày không giờ. Phần này theo tài liệu Hibernate, bài học chưa chạy thử.",
          "Entity: Instant hoặc OffsetDateTime. LocalDate cho ngày.",
          lambda w: [PULSE("#sr-fx1", w("Instant hoặc")), PULSE("#sr-fx2", w("Local Date"))]),
        B("Nhớ một câu: lưu UTC, đổi múi giờ lúc hiển thị. Trong A P I, đừng gửi ngày giờ trần.",
          "Lưu UTC, ISO-8601 có Z.",
          lambda w: [OUT(S("sr-ts", "sr-ts2", "sr-fx1", "sr-fx2", "sr-eye", "sr-q"), "blur", 0, 0.5), TYPE("#sr-t1", 0.6, 0.04), IN("#sr-t2", "blur", w("Trong A P I"))]),
    ]),
    # ------------------------------------------------------------ clock
    dict(id="clock", world=(1920, 1080), hud="", cam="".join([
        head("ck", "Test code có thời gian", "Inject Clock", 80),
        rule("ck-rule", "Clock là nguồn thời gian có thể thay thế", "Code thật dùng đồng hồ hệ thống, test dùng đồng hồ đóng băng"),
        bigerr("ck-err", 150, 280, 1620, "✕ Instant.now() gọi thẳng<br>test phải chờ thật, hoặc chạy lúc nào ra kết quả lúc đó", 40),
        cbox("ck-code", 90, 270, 1000, "Subscription.java",
             "class Subscription {\n"
             "  private final Clock clock;\n"
             "  boolean isExpired() {\n"
             "    return Instant.now(clock).isAfter(expiresAt);\n"
             "  }\n"
             "}", "violet", 28),
        note("ck-n1", 1150, 290, 680, "Mọi now() đều có bản nhận Clock:\nInstant.now(clock), LocalDate.now(clock)", "green", 32),
        note("ck-n2", 1150, 460, 680, "expiresAt = 2026-03-01T00:00:00Z", "green", 32),
        cbox("ck-fix", 90, 270, 1000, "SubscriptionTest.java",
             "Clock fixed = Clock.fixed(\n"
             "    Instant.parse(\"2026-02-28T23:59:59Z\"),\n"
             "    ZoneOffset.UTC);", "violet", 28),
        titled("ck-r1", 1150, 270, 680, 170, "Clock.fixed(23:59:59Z)", "false", "chưa hết hạn", "green", 56),
        titled("ck-r2", 1150, 470, 680, 170, "Clock.offset(fixed, 2 giây)", "true", "đã hết hạn, không phải chờ", "amber", 56),
        cbox("ck-bean", 90, 270, 800, "ClockConfig.java",
             "@Bean\n"
             "Clock clock() {\n"
             "  return Clock.systemUTC();\n"
             "}", "violet", 32),
        note("ck-n3", 960, 300, 870, "Inject Clock vào service như\nmọi dependency khác", "green", 36),
        note("ck-n4", 960, 460, 870, "Test thay bean này bằng\nClock.fixed(...)", "green", 36),
        el("ck-t1", 0, 400, 1920, None, letters("Inject Clock"), "take r"),
        el("ck-t2", 0, 540, 1920, None, "test mọi mốc giờ mà không phải chờ", "take-sm r"),
    ]), beats=[
        B("Code gọi thẳng Instant now rất khó test. Muốn kiểm tra hết hạn sau một giây nữa thì test phải chờ thật, hoặc chạy lúc nào ra kết quả lúc đó. Giải pháp là Clock, một nguồn thời gian có thể thay thế.",
          "Clock: nguồn thời gian có thể thay thế.",
          lambda w: [IN("#ck-eye", "blur"), TYPE("#ck-q", 0.2, 0.06), IN("#ck-err", "up", w("rất khó test") - 0.5), SHAKE("#ck-err", w("rất khó test") + 0.5),
                     OUT("#ck-err", "blur", w("Giải pháp") - 0.4, 0.4), IN("#ck-rule", "up", w("Giải pháp"))]),
        B("Mọi method now đều có bản nhận Clock, như Instant now clock. Ví dụ Subscription nhận Clock qua constructor, và is Expired trả về Instant now clock is After expires At, với hạn là ngày một tháng ba năm hai nghìn không trăm hai mươi sáu.",
          "now(clock) có ở mọi kiểu.",
          lambda w: [OUT("#ck-rule", "blur", 0, 0.4), *shrink("ck", 0), IN("#ck-code", "blur", 0.7, 0.7), PULSE("#ck-code", w("Subscription nhận")),
                     IN("#ck-n1", "up", w("Mọi method now") + 0.3), IN("#ck-n2", "up", w("với hạn"))]),
        B("Code thật nhận Clock system U T C. Test thì truyền Clock fixed để đóng băng thời gian. Với Clock đóng băng ở hai mươi ba giờ năm mươi chín phút năm mươi chín giây, is Expired là false. Dịch tới hai giây sau bằng Clock offset thì là true. Đã chạy đúng như vậy, không phải chờ.",
          "Clock.fixed: false. Dịch 2 giây: true.",
          lambda w: [OUT(S("ck-code", "ck-n1", "ck-n2"), "blur", 0, 0.5), IN("#ck-fix", "blur", 0.6, 0.7), PULSE("#ck-fix", w("Test thì truyền")),
                     IN("#ck-r1", "up", w("is Expired là false")), IN("#ck-r2", "up", w("Dịch tới")), PULSE("#ck-r2", w("không phải chờ"))]),
        B("Trong Spring, khai báo một bean Clock trả về Clock system U T C rồi inject vào service. Test chỉ cần thay bean này bằng một Clock fixed. Clock là một dependency như mọi dependency khác.",
          "Spring: @Bean Clock, test thay bằng Clock.fixed.",
          lambda w: [OUT(S("ck-fix", "ck-r1", "ck-r2"), "blur", 0, 0.5), IN("#ck-bean", "blur", 0.6, 0.7), IN("#ck-n3", "up", w("rồi inject")), IN("#ck-n4", "up", w("Test chỉ cần"))]),
        B("Nhớ lấy: inject Clock thì test mọi mốc giờ mà không phải chờ.",
          "Inject Clock, test không phải chờ.",
          lambda w: [OUT(S("ck-bean", "ck-n3", "ck-n4", "ck-eye", "ck-q"), "blur", 0, 0.5), TYPE("#ck-t1", 0.6, 0.05), IN("#ck-t2", "blur", w("thì test"))]),
    ]),
    # ------------------------------------------------------------ chon-kieu
    dict(id="chon-kieu", world=(1920, 1080), hud="", cam="".join([
        head("cs", "Bài tập", "Dùng kiểu nào?", 80),
        rule("cs-rule", "Mỗi dòng là một tình huống, chọn kiểu phù hợp", "Cần thời điểm tuyệt đối? Cần giờ? Cần múi giờ? Hay một khoảng?"),
        *[box(f"cs-d{i}", 110, 250 + i * 110, 1160, 95, f'<span style="font-size:30px;text-align:left;width:100%">{esc(q)}</span>', "cyan")
          for i, q in enumerate(["Lưu thời điểm đơn hàng được tạo vào database",
                                 "Ngày sinh của khách hàng",
                                 "Hiển thị giờ cuộc họp theo múi giờ từng người",
                                 "Một request xử lý hết bao lâu",
                                 "Hạn thanh toán là 3 tháng kể từ ngày ký",
                                 "Giờ hẹn người dùng nhập trên form, chưa gắn múi giờ"])],
        *[tag(f"cs-a{i}", 1310, 250 + i * 110, 500, 95, a, "green", 34)
          for i, a in enumerate(["Instant", "LocalDate", "ZonedDateTime", "Duration", "Period", "LocalDateTime"])],
        el("cs-t1", 0, 400, 1920, None, letters("Hỏi đúng bốn câu"), "take r"),
        el("cs-t2", 0, 540, 1920, None, "tuyệt đối · có giờ · có múi giờ · hay một khoảng", "take-sm r"),
    ]), beats=[
        B("Bài tập: mỗi dòng là một tình huống, hãy chọn kiểu phù hợp. Hãy hỏi: có cần thời điểm tuyệt đối không, có cần giờ không, có cần múi giờ không, hay chỉ là một khoảng.",
          "Bài tập: dùng kiểu nào?",
          lambda w: [IN("#cs-eye", "blur"), TYPE("#cs-q", 0.2, 0.05), IN("#cs-rule", "up", w("Hãy hỏi"))]),
        B("Lưu thời điểm đơn hàng được tạo vào database: Instant. Ngày sinh của khách hàng: Local Date, chỉ cần ngày. Hiển thị giờ cuộc họp theo múi giờ từng người: Zoned Date Time.",
          "Instant · LocalDate · ZonedDateTime.",
          lambda w: [OUT("#cs-rule", "blur", 0, 0.4), *shrink("cs", 0),
                     IN("#cs-d0", "right", 0.8), IN("#cs-a0", "pop", w("Instant.")), IN("#cs-d1", "right", w("Ngày sinh") - 0.3), IN("#cs-a1", "pop", w("Local Date,")),
                     IN("#cs-d2", "right", w("Hiển thị") - 0.3), IN("#cs-a2", "pop", w("Zoned Date Time."))]),
        B("Một request xử lý hết bao lâu: Duration, khoảng đo bằng giờ, phút, giây. Hạn thanh toán ba tháng kể từ ngày ký: Period, khoảng theo lịch. Giờ hẹn người dùng nhập trên form, chưa gắn múi giờ: Local Date Time. Gắn múi giờ rồi mới đổi sang Instant.",
          "Duration · Period · LocalDateTime.",
          lambda w: [IN("#cs-d3", "right", 0.2), IN("#cs-a3", "pop", w("Duration,")), IN("#cs-d4", "right", w("Hạn thanh toán") - 0.3), IN("#cs-a4", "pop", w("Period,")),
                     IN("#cs-d5", "right", w("Giờ hẹn") - 0.3), IN("#cs-a5", "pop", w("Local Date Time."))]),
        B("Nhớ bốn câu hỏi: thời điểm tuyệt đối, có giờ, có múi giờ, hay một khoảng.",
          "Bốn câu hỏi chọn kiểu.",
          lambda w: [OUT(S("cs-eye", "cs-q", *[f"cs-d{i}" for i in range(6)], *[f"cs-a{i}" for i in range(6)]), "blur", 0, 0.5),
                     TYPE("#cs-t1", 0.6, 0.04), IN("#cs-t2", "blur", w("thời điểm"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Date-Time API"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 118, 1660, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Instant", "Lưu và truyền một thời điểm, theo UTC"),
                                      ("Duration, Period", "Giờ phút giây khác ngày tháng lịch"),
                                      ("Gap, overlap", "Giờ không tồn tại, giờ xuất hiện hai lần"),
                                      ("DateTimeFormatter", "Bất biến, an toàn thread"),
                                      ("Clock", "Inject để test không phải chờ")])],
        el("ou-tr", 0, 810, 1920, None, "Bẫy: Duration không cộng ngày · lịch chạy theo UTC · SimpleDateFormat dùng chung · cột TIMESTAMP", "take-sm r", "font-size:34px"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại về Date Time API. Instant: lưu và truyền một thời điểm theo U T C. Duration đo giờ, phút, giây. Period đo theo lịch.",
          "Instant, Duration và Period.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Instant:")), IN("#ou-r1", "right", w("Duration đo"))]),
        B("Gap và overlap: giờ có thể không tồn tại hoặc xuất hiện hai lần. Date Time Formatter bất biến nên an toàn thread. Clock thì inject để test không phải chờ.",
          "Gap, overlap, formatter và Clock.",
          lambda w: [IN("#ou-r2", "right", w("Gap và overlap")), IN("#ou-r3", "right", w("Date Time Formatter")), IN("#ou-r4", "right", w("Clock thì"))]),
        B("Nhớ các bẫy: không dùng Duration để cộng ngày, lịch chạy theo U T C, không dùng chung Simple Date Format, và cột timestamp không có múi giờ.",
          "Mỗi phần có bẫy riêng.",
          lambda w: [IN("#ou-tr", "blur", w("không dùng Duration")), PULSE("#ou-r1", w("không dùng Duration")), PULSE("#ou-r2", w("lịch chạy")), PULSE("#ou-r3", w("không dùng chung")), PULSE("#ou-r0", w("cột timestamp"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
