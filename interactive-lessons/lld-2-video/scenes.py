"""LLD 2 explainer: Movie Ticket, Elevator, Connect Four, pattern drill (1920x1080 world coordinates).

All Java outputs come from one run on JDK 21 (web/src/data/lessons/lld-2.ts):
16 threads booking seat A1 with containsKey + put: more than one buyer; with putIfAbsent: exactly 1;
hold 300s: u1 holds at 0s, u2 tries at 100s and is refused; (a) u1 confirms at 200s ok; (b) u1 leaves, at 301s u1 confirm fails and u2 holds;
elevator at floor 4 going up, requests 7,3,9,1,5: FIFO 25 floors, SCAN (LOOK) order [5, 7, 9, 3, 1] 13 floors;
Connect Four: win vertical after 7 moves, horizontal after 7, diagonal after 11; column 9 -> "column out of range", full column -> "column 0 is full".
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


# ---- Connect Four board (SVG): 7 columns x 6 rows, 84 px cells, drawn at (BX, BY)
BX, BY, CELL, PAD = 110, 280, 84, 22
BOARD = [".......", ".......", ".......", "..B....", "..BAB..", "BBAAAA."]


def cell_c(r, c):
    return BX + PAD + c * CELL + CELL // 2, BY + PAD + r * CELL + CELL // 2


def board_svg():
    w, h = 7 * CELL + 2 * PAD, 6 * CELL + 2 * PAD
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect x="2" y="2" width="{w - 4}" height="{h - 4}" rx="22" fill="#0b0d12" stroke="#5f6878" stroke-width="2"/>']
    for r, line in enumerate(BOARD):
        for c, ch in enumerate(line):
            fill = {".": "#171a22", "A": "var(--amber)", "B": "var(--cyan)"}[ch]
            out.append(f'<circle cx="{PAD + c * CELL + CELL // 2}" cy="{PAD + r * CELL + CELL // 2}" r="32" fill="{fill}"/>')
    out.append("</svg>")
    return "".join(out)


LAST = cell_c(5, 4)


def ring_svg():
    x, y = LAST
    return (f'<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0">'
            f'<circle cx="{x}" cy="{y}" r="42" fill="none" stroke="#fff" stroke-width="5"/></svg>')


def dirs_svg():
    x, y = LAST
    path = "".join(f'<line x1="{a:.0f}" y1="{b:.0f}" x2="{c:.0f}" y2="{d:.0f}" stroke="#fff" stroke-width="4" stroke-dasharray="10 8" opacity="0.9"/>'
                   for a, b, c, d in [(x - 160, y, x + 160, y), (x, y - 300, x, y),
                                      (x - 3 * 84 + 20, y - 3 * 84 + 20, x, y), (x + 80, y - 80, x, y)])
    return f'<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0">{path}</svg>'


# ---- pattern drill rows
DRILL = [
    ("Nhiều chính sách tính phí, cần đổi dễ dàng", "Strategy"),
    ("Thang máy: mỗi trạng thái xử lý khác nhau", "State"),
    ("Bãi nhiều tầng, khu, chỗ: đếm chỗ trống mọi cấp", "Composite"),
    ("Ghế được giải phóng: báo người đang chờ", "Observer"),
    ("Nhiều thang: ai quyết định thang nào đón", "Mediator"),
    ("Tạo đúng loại xe từ biển số hoặc cảm biến", "Factory Method"),
]
DY = lambda i: 270 + i * 105
DRILL_HTML = [
    *[box(f"gp-s{i}", 110, DY(i), 1000, 88, f'<span style="font-size:32px">{esc(t)}</span>', "cyan", "card") for i, (t, _) in enumerate(DRILL)],
    *[tag(f"gp-p{i}", 1260, DY(i), 550, 88, p, "green", 34) for i, (_, p) in enumerate(DRILL)],
    wires(*[arrow(f"gp-a{i}", [(1120, DY(i) + 44), (1245, DY(i) + 44)], "green") for i in range(6)]),
]

MT_CODE = ("if (!booked.containsKey(seat)) {\n"
           "    booked.put(seat, user);\n"
           "    return true;\n"
           "}\n"
           "return false;")

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn LLD", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("LLD 2: ba bài thiết kế"), "h1 r", "font-size:112px"),
        card4("hk-c", 100, 420, 520, 340, 80, [("lock", "Movie Ticket", "nhiều người tranh một ghế"),
                                              ("split", "Elevator", "trạng thái và lập lịch"),
                                              ("grid", "Connect Four", "luật trò chơi")]),
        chip("hk-p1", 560, 850, "Cuối bài: ghép pattern vào bài toán", "green"),
        el("hk-t1", 0, 400, 1920, None, letters("Pattern theo dấu hiệu"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "nhận ra dấu hiệu trong yêu cầu, rồi mới chọn", "take-sm r"),
    ]), beats=[
        B("Đây là ba bài thiết kế hay gặp trong phỏng vấn, mức Low Level Design.",
          "Ba bài thiết kế hay gặp trong phỏng vấn LLD.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Đặt vé xem phim, thang máy, và Connect Four.",
          "Movie Ticket, Elevator, Connect Four.",
          lambda w: [IN("#hk-c0", "pop", w("Đặt vé")), IN("#hk-c1", "pop", w("thang máy")), IN("#hk-c2", "pop", w("Connect Four"))]),
        B("Mỗi bài dạy một kiểu vấn đề khác. Đặt vé là nhiều người tranh chấp một ghế. Thang máy là trạng thái và thứ tự phục vụ. Còn Connect Four là luật trò chơi và đầu vào sai.",
          "Ba kiểu vấn đề: tranh chấp, trạng thái, luật chơi.",
          lambda w: [PULSE("#hk-c0", w("Đặt vé là")), PULSE("#hk-c1", w("Thang máy là")), PULSE("#hk-c2", w("Còn Connect")),
                     IN("#hk-p1", "up", w("Còn Connect") + 3.0)]),
        B("Và cuối bài, ta ghép pattern vào từng bài toán. Pattern xuất hiện khi bạn nhận ra dấu hiệu trong yêu cầu, rồi mới chọn.",
          "Nhận ra dấu hiệu, rồi mới chọn pattern.",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-c0", "hk-c1", "hk-c2", "hk-p1"), 0, 0.07),
                     TYPE("#hk-t1", 0.9, 0.04), IN("#hk-t2", "blur", w("rồi mới"))]),
    ]),
    # ------------------------------------------------------------ movie ticket
    dict(id="movie-ticket", world=(1920, 1080), hud="", cam="".join([
        head("mt", "Bài 1 · Movie Ticket", "Nhiều người tranh một ghế"),
        tag("mt-w1", 110, 330, 560, 130, "Nhiều người cùng chọn ghế", "cyan", 32),
        tag("mt-w2", 680, 330, 560, 130, "Một ghế, một người", "green", 32),
        tag("mt-w3", 1250, 330, 560, 130, "Giữ chỗ 5 phút", "amber", 32),
        cbox("mt-bad", 90, 270, 1020, "Booking.java", MT_CODE, "violet", 36),
        note("mt-cta", 90, 700, 1020, "check-then-act: kiểm tra rồi mới đặt", "cyan", 36),
        tag("mt-th1", 1210, 290, 600, 100, "Thread 1: thấy ghế trống", "amber", 30),
        tag("mt-th2", 1210, 420, 600, 100, "Thread 2: thấy ghế trống", "amber", 30),
        bigerr("mt-race", 1210, 570, 600, "✕ cả hai cùng đặt ghế A1<br>Race Condition", 32),
        bigerr("mt-err", 1210, 290, 600, "✕ Chạy thật: 16 thread cùng đặt A1,<br>nhiều hơn 1 người mua được", 32),
        tag("mt-chm", 1210, 470, 600, 100, "ConcurrentHashMap", "cyan", 32),
        note("mt-why", 1210, 610, 600, "Từng thao tác an toàn,\nchuỗi hai bước thì không", "red", 34),
        cbox("mt-fix", 90, 270, 1060, "Booking.java", "// kiểm tra và đặt là MỘT bước\nbooked.putIfAbsent(seat, user) == null", "violet", 34),
        note("mt-atom", 90, 560, 1060, "Gộp hai bước thành một thao tác nguyên tử", "green", 38),
        tag("mt-pa", 1210, 290, 600, 110, "trả về null: tôi giành được ghế", "green", 28),
        tag("mt-pb", 1210, 430, 600, 110, "trả về tên người khác: ghế đã có chủ", "amber", 28),
        tag("mt-pc", 1210, 600, 600, 110, "Chạy thật: đúng 1 người mua được", "green", 30),
        cbox("mt-hold", 90, 270, 1100, "Hold.java",
             "holds.compute(seat, (k, cur) ->\n"
             "    cur == null || cur.expiresAt() <= now\n"
             "        ? new Hold(user, now + ttl) : cur);", "violet", 32),
        note("mt-hn", 90, 590, 1100, "chưa ai giữ, hoặc lượt cũ hết hạn → tạo lượt giữ mới\nngược lại → giữ nguyên lượt hiện tại", "green", 32),
        tag("mt-h1", 1230, 280, 580, 90, "Hạn giữ chỗ: 300s", "amber", 30),
        tag("mt-h2", 1230, 390, 580, 90, "0s: u1 giữ ghế", "cyan", 30),
        tag("mt-h3", 1230, 500, 580, 90, "100s: u2 thử, bị từ chối", "red", 30),
        tag("mt-ra", 110, 660, 880, 170, "(a) u1 xác nhận lúc 200s: thành công", "green", 32),
        tag("mt-rb", 1030, 660, 780, 170, "(b) u1 bỏ đi. Lúc 301s hold hết hạn: u1 xác nhận thất bại, u2 giữ được ghế", "amber", 28),
        tag("mt-s1", 110, 270, 1700, 110, "@Version: mỗi dòng có số phiên bản, ghi đè phiên bản cũ thì bị từ chối", "cyan", 32),
        tag("mt-s2", 110, 400, 1700, 110, "UPDATE seat SET status = 'HELD' WHERE id = ? AND status = 'FREE'", "violet", 32),
        tag("mt-s3", 110, 530, 1700, 110, "Redis: SET key value NX EX 300 (chỉ đặt khi chưa có, tự hết hạn)", "amber", 32),
        note("mt-sx", 110, 690, 1700, "✕ Khóa trong bộ nhớ một JVM không dùng được khi nhiều server", "red", 38),
        el("mt-t1", 0, 400, 1920, None, letters("Hai bước thành một bước"), "take r"),
        el("mt-t2", 0, 540, 1920, None, "putIfAbsent · compute · UPDATE WHERE · SET NX", "take-sm r"),
        wires(arrow("mt-a1", [(1200, 340), (1120, 390)], "amber"), arrow("mt-a2", [(1200, 470), (1120, 430)], "amber")),
    ]), beats=[
        B("Bài đầu tiên: đặt vé xem phim. Nhiều người chọn ghế cùng lúc, một ghế chỉ được bán cho một người, và giữ chỗ có thời hạn, ví dụ năm phút để thanh toán.",
          "Nhiều người chọn ghế, một ghế một người, giữ chỗ 5 phút.",
          lambda w: [IN("#mt-eye", "blur"), TYPE("#mt-q", 0.2, 0.05), *shrink("mt", 2.2),
                     IN("#mt-w1", "up", max(w("Nhiều người chọn"), 3.2)), IN("#mt-w2", "up", max(w("một ghế chỉ"), 4.4)), IN("#mt-w3", "up", max(w("giữ chỗ có"), 6.4))]),
        B("Lỗi kinh điển là kiểm tra rồi mới đặt. Hai thread cùng thấy ghế trống, rồi cùng đặt cho mình. Giữa hai bước có người chen vào, đó là Race Condition.",
          "Kiểm tra rồi mới đặt: có người chen vào giữa.",
          lambda w: [OUT(S("mt-w1", "mt-w2", "mt-w3"), "blur", 0, 0.4), IN("#mt-bad", "blur", 0.5, 0.7), IN("#mt-cta", "up", w("Lỗi kinh") + 0.8),
                     IN("#mt-th1", "right", w("Hai thread")), *ARROW("mt-a1", w("Hai thread") + 0.5, 0.5),
                     IN("#mt-th2", "right", w("cùng thấy") + 0.6), *ARROW("mt-a2", w("cùng thấy") + 1.1, 0.5),
                     IN("#mt-race", "up", w("Giữa hai")), SHAKE("#mt-race", w("đó là") + 0.3)]),
        B("Chạy thật: mười sáu thread cùng đặt ghế A một, và nhiều hơn một người mua được cùng một ghế. Dù dùng ConcurrentHashMap, vì từng thao tác an toàn, nhưng chuỗi hai bước thì không.",
          "Chạy thật: nhiều hơn 1 người mua cùng một ghế.",
          lambda w: [OUT(S("mt-th1", "mt-th2", "mt-race") + ", " + AR("mt-a1", "mt-a2"), "blur", 0, 0.4),
                     IN("#mt-err", "up", 0.5), SHAKE("#mt-err", 1.4), IN("#mt-chm", "up", w("Dù dùng")), IN("#mt-why", "up", w("vì từng"))]),
        B("Cách chữa là gộp hai bước thành một: pút If Absent. Nó đặt nếu chưa có, và trả về rỗng khi chính lời gọi này vừa đặt được. Chạy thật: đúng một người mua được ghế.",
          "putIfAbsent: kiểm tra và đặt là một thao tác. Đúng 1 người mua được.",
          lambda w: [OUT(S("mt-bad", "mt-cta", "mt-err", "mt-chm", "mt-why"), "blur", 0, 0.4), IN("#mt-fix", "blur", 0.5, 0.7), IN("#mt-atom", "up", w("Cách chữa") + 1.0),
                     IN("#mt-pa", "right", w("Nó đặt")), IN("#mt-pb", "right", w("Nó đặt") + 3.3), IN("#mt-pc", "pop", w("Chạy thật"))]),
        B("Giữ chỗ có hạn dùng Compute. Hàm này đọc, tính và ghi như một bước. Nếu chưa ai giữ ghế, hoặc lượt giữ cũ đã hết hạn, thì tạo lượt giữ mới cho người này. Ngược lại giữ nguyên lượt hiện tại.",
          "compute: chưa ai giữ hoặc hết hạn thì tạo lượt giữ mới.",
          lambda w: [OUT(S("mt-fix", "mt-atom", "mt-pa", "mt-pb", "mt-pc"), "blur", 0, 0.4), IN("#mt-hold", "blur", 0.5, 0.7),
                     PULSE("#mt-hold", w("Nếu chưa")), IN("#mt-hn", "up", w("Nếu chưa") + 1.0)]),
        B("Chạy thật với hạn năm phút, ba trăm giây. Người một giữ ghế lúc không giây, người hai thử lúc một trăm giây và bị từ chối. Lần một: người một xác nhận lúc hai trăm giây thì được. Lần hai: người một bỏ đi, lúc ba trăm lẻ một giây lượt giữ đã hết hạn, nên người một thất bại, và người hai giữ được ghế.",
          "Hai lần chạy: (a) xác nhận kịp, (b) bỏ đi nên ghế được nhả.",
          lambda w: [OUT("#mt-hn", "blur", 0, 0.4), IN("#mt-h1", "right", w("Chạy thật")), IN("#mt-h2", "right", w("Người một giữ")), IN("#mt-h3", "right", w("người hai thử")),
                     IN("#mt-ra", "up", w("Lần một")), IN("#mt-rb", "up", w("Lần hai"))]),
        B("Khi có nhiều server, cùng ý tưởng đó có ba dạng. Optimistic locking với Version: ghi đè phiên bản cũ thì bị từ chối. Câu Update có điều kiện status là Free: chỉ người đầu tiên cập nhật được dòng. Và Redis với lệnh Set cờ NX: chỉ đặt khi chưa có, tự hết hạn sau ba trăm giây. Khóa trong bộ nhớ của một máy ảo Java thì không dùng được.",
          "Nhiều server: @Version, UPDATE ... WHERE, Redis SET NX EX.",
          lambda w: [OUT(S("mt-hold", "mt-h1", "mt-h2", "mt-h3", "mt-ra", "mt-rb"), "blur", 0, 0.4),
                     IN("#mt-s1", "right", w("Optimistic")), IN("#mt-s2", "right", w("Câu Update")), IN("#mt-s3", "right", w("Và Redis")), IN("#mt-sx", "up", w("Khóa trong"))]),
        B("Tóm lại, kiểm tra và đặt là hai bước thì người khác chen vào giữa. Hãy gộp thành một thao tác nguyên tử.",
          "Gộp thành một thao tác nguyên tử.",
          lambda w: [DIM(S("mt-eye", "mt-q", "mt-s1", "mt-s2", "mt-s3", "mt-sx"), 0, 0.07),
                     TYPE("#mt-t1", 0.4, 0.04), IN("#mt-t2", "blur", w("Hãy gộp"))]),
    ]),
    # ------------------------------------------------------------ elevator
    dict(id="elevator", world=(1920, 1080), hud="", cam="".join([
        head("ev", "Bài 2 · Elevator", "State và lập lịch"),
        tag("ev-s1", 110, 330, 300, 120, "UP", "cyan", 40), tag("ev-s2", 440, 330, 300, 120, "DOWN", "cyan", 40), tag("ev-s3", 770, 330, 300, 120, "IDLE", "cyan", 40),
        tag("ev-st", 1130, 330, 680, 120, "Chiến lược lập lịch", "violet", 38),
        *[tag(f"ev-f{n}", 110 + (n - 1) * 190, 420, 160, 100, str(n), "cyan", 44) for n in range(1, 10)],
        *[tag(f"ev-r{n}", 110 + (n - 1) * 190, 310, 160, 80, f"gọi #{k}", "amber", 28) for k, n in enumerate([7, 3, 9, 1, 5], 1)],
        tag("ev-at", 110 + 3 * 190, 540, 160, 80, "thang ↑", "green", 28),
        cbox("ev-fc", 110, 660, 880, "FIFO", "for (int r : requests) moveTo(r);", "violet", 32),
        tag("ev-fr", 1040, 660, 770, 120, "Đi 25 tầng: 4 → 7 → 3 → 9 → 1 → 5", "red", 30),
        note("ev-fn", 110, 830, 1700, "Dễ viết, công bằng theo thứ tự đến, nhưng tốn đường đi", "red", 36),
        cbox("ev-sc", 110, 650, 900, "SCAN",
             "TreeSet<Integer> stops;      // tự sắp xếp\n"
             "next = dir == UP ? stops.ceiling(floor)\n"
             "                 : stops.floor(floor);\n"
             "if (next == null) dir = reverse(dir);", "violet", 28),
        tag("ev-s-r1", 1060, 660, 750, 110, "Đi: 5 → 7 → 9 → 3 → 1", "green", 32),
        tag("ev-s-r2", 1060, 800, 750, 110, "Đi 13 tầng, thay vì 25", "green", 36),
        tag("ev-lk", 110, 660, 800, 140, "LOOK: quay đầu ở yêu cầu cuối (tầng 9)", "cyan", 30),
        tag("ev-sg", 1010, 660, 800, 140, "SCAN gốc: đi tới tận đầu mút", "violet", 30),
        tag("ev-n1", 110, 660, 560, 120, "Luôn đến tầng gần nhất", "amber", 30),
        tag("ev-n2", 700, 660, 560, 120, "Tầng 20 chờ mãi: đói yêu cầu", "red", 28),
        tag("ev-n3", 1290, 660, 520, 120, "SCAN: tối đa 1 lượt đi và về", "green", 28),
        titled("ev-si", 260, 290, 400, 130, "«interface»", "Scheduler", "", "violet", 40),
        tag("ev-i1", 110, 560, 220, 110, "FIFO", "cyan", 36), tag("ev-i2", 350, 560, 220, 110, "SCAN", "cyan", 36), tag("ev-i3", 590, 560, 220, 110, "LOOK", "cyan", 36),
        tag("ev-p1", 900, 290, 910, 120, "enum dir: UP · DOWN · IDLE", "cyan", 34),
        tag("ev-p2", 900, 440, 910, 120, "State pattern: mỗi trạng thái là một class", "violet", 32),
        tag("ev-p3", 900, 590, 910, 120, "Dispatcher: chọn thang gần nhất, giống Mediator", "amber", 30),
        el("ev-t1", 0, 400, 1920, None, letters("Enum hay State?"), "take r"),
        el("ev-t2", 0, 540, 1920, None, "xử lý giống nhau thì enum · phản ứng khác nhau mới State", "take-sm r"),
        wires(arrow("ev-b1", [(220, 555), (330, 425)], "violet", True), arrow("ev-b2", [(460, 555), (460, 425)], "violet", True),
              arrow("ev-b3", [(700, 555), (590, 425)], "violet", True)),
    ]), beats=[
        B("Bài hai: thang máy. Bài đặt ghế xoay quanh tranh chấp, còn bài này xoay quanh trạng thái và thứ tự phục vụ. Cần trạng thái lên, xuống, rảnh, và một chiến lược lập lịch để khỏi đi lòng vòng.",
          "Cần trạng thái và chiến lược lập lịch.",
          lambda w: [IN("#ev-eye", "blur"), TYPE("#ev-q", 0.2, 0.05), *shrink("ev", 2.4),
                     IN("#ev-s1", "up", max(w("Cần trạng thái"), 3.4)), IN("#ev-s2", "up", max(w("Cần trạng thái"), 3.4) + 0.6), IN("#ev-s3", "up", max(w("Cần trạng thái"), 3.4) + 1.2),
                     IN("#ev-st", "right", max(w("và một chiến lược"), 7.0))]),
        B("Trong ví dụ, thang đang ở tầng bốn và đang đi lên. Có yêu cầu theo thứ tự gọi: tầng bảy, ba, chín, một, năm.",
          "Thang ở tầng 4, đang đi lên. Yêu cầu: 7, 3, 9, 1, 5.",
          lambda w: [OUT(S("ev-s1", "ev-s2", "ev-s3", "ev-st"), "blur", 0, 0.4),
                     *[IN(f"#ev-f{n}", "up", 0.5 + n * 0.08, 0.4) for n in range(1, 10)],
                     IN("#ev-at", "pop", w("thang đang")),
                     IN("#ev-r7", "down", w("tầng bảy")), IN("#ev-r3", "down", w("ba,")), IN("#ev-r9", "down", w("chín")), IN("#ev-r1", "down", w("một,")), IN("#ev-r5", "down", w("năm."), 0.3)]),
        B("Cách đơn giản là Fi fô: phục vụ đúng thứ tự gọi, một vòng lặp qua danh sách. Chạy thật: đi hai mươi lăm tầng, lên xuống liên tục.",
          "FIFO: đúng thứ tự gọi, đi 25 tầng.",
          lambda w: [IN("#ev-fc", "blur", 0.4, 0.7), IN("#ev-fr", "up", w("Chạy thật")), SHAKE("#ev-fr", w("Chạy thật") + 0.8), IN("#ev-fn", "up", w("lên xuống"))]),
        B("Scan thì đi hết một chiều rồi mới quay đầu. Dùng một tập sắp xếp sẵn, Tree Set, thì tầng gần nhất cùng chiều chỉ là một lệnh. Hết một chiều thì đổi hướng. Chạy thật: lên năm, bảy, chín, rồi xuống ba, một, đi mười ba tầng, thay vì hai mươi lăm.",
          "SCAN với TreeSet: 5, 7, 9, 3, 1. Đi 13 tầng thay vì 25.",
          lambda w: [OUT(S("ev-fc", "ev-fr", "ev-fn"), "blur", 0, 0.4), IN("#ev-sc", "blur", 0.5, 0.7),
                     PULSE("#ev-sc", w("Dùng một")), PULSE("#ev-sc", w("Hết một")),
                     IN("#ev-s-r1", "right", w("Chạy thật")), IN("#ev-s-r2", "pop", w("đi mười ba"))]),
        B("Nói chính xác, code này quay đầu ngay ở yêu cầu cuối cùng, tầng chín, nên tên đúng là Look, một biến thể của Scan. Scan gốc đi tới tận đầu mút. Nói được điểm này trong phỏng vấn là cộng điểm.",
          "Code này là LOOK, một biến thể của SCAN.",
          lambda w: [OUT(S("ev-sc", "ev-s-r1", "ev-s-r2"), "blur", 0, 0.4), PULSE("#ev-f9", w("tầng chín")),
                     IN("#ev-lk", "right", w("nên tên đúng")), IN("#ev-sg", "right", w("Scan gốc"))]),
        B("Có chiến lược thứ ba nghe rất hợp lý: luôn đi tới tầng gần nhất đang chờ. Nhưng nếu người ở tầng ba, bốn, năm cứ liên tục gọi, thang quanh quẩn ở đó, và người ở tầng hai mươi chờ mãi. Scan không bị vậy, vì mọi yêu cầu được phục vụ sau tối đa một lượt đi và về.",
          "Đi tới tầng gần nhất thì tầng xa bị bỏ đói.",
          lambda w: [OUT(S("ev-lk", "ev-sg"), "blur", 0, 0.4), IN("#ev-n1", "up", w("luôn đi")), IN("#ev-n2", "up", w("Nhưng nếu")), SHAKE("#ev-n2", w("chờ mãi")),
                     IN("#ev-n3", "up", w("Scan không"))]),
        B("Pattern trong bài này. Strategy đặt thuật toán lập lịch sau một interface, để đổi Fi fô, Scan, Look. Nhiều thang thì thêm Dispatcher, giống Mediator. Còn trạng thái: enum là đủ khi mọi trạng thái xử lý giống nhau. Trạng thái phản ứng khác nhau mới cần State pattern.",
          "Strategy, Dispatcher; enum hay State pattern.",
          lambda w: [OUT(S(*[f"ev-f{n}" for n in range(1, 10)], *[f"ev-r{n}" for n in (7, 3, 9, 1, 5)], "ev-at", "ev-n1", "ev-n2", "ev-n3"), "blur", 0, 0.4),
                     IN("#ev-si", "down", w("Strategy") + 0.2), IN("#ev-i1", "up", w("để đổi")), IN("#ev-i2", "up", w("để đổi") + 0.5), IN("#ev-i3", "up", w("để đổi") + 1.0),
                     *ARROW("ev-b1", w("để đổi") + 0.3, 0.4), *ARROW("ev-b2", w("để đổi") + 0.8, 0.4), *ARROW("ev-b3", w("để đổi") + 1.3, 0.4),
                     IN("#ev-p3", "right", w("Nhiều thang")), IN("#ev-p1", "right", w("Còn trạng thái")), IN("#ev-p2", "right", w("Trạng thái phản ứng")),
                     DIM(S("ev-eye", "ev-q", "ev-si", "ev-i1", "ev-i2", "ev-i3", "ev-p1", "ev-p2", "ev-p3") + ", " + AR("ev-b1", "ev-b2", "ev-b3"), w("Trạng thái phản ứng") + 2.2, 0.07),
                     TYPE("#ev-t1", w("Trạng thái phản ứng") + 2.4, 0.04), IN("#ev-t2", "blur", w("Trạng thái phản ứng") + 3.0)]),
    ]),
    # ------------------------------------------------------------ connect four
    dict(id="connect-four", world=(1920, 1080), hud="", cam="".join([
        head("c4", "Bài 3 · Connect Four", "Luật trò chơi"),
        el("c4-board", BX, BY, 7 * CELL + 2 * PAD, 6 * CELL + 2 * PAD, board_svg(), "r"),
        tag("c4-n1", 900, 300, 910, 100, "Bàn 6 hàng × 7 cột", "cyan", 34),
        tag("c4-n2", 900, 430, 910, 100, "2 người, lần lượt thả quân", "cyan", 34),
        tag("c4-n3", 900, 560, 910, 100, "4 quân liên tiếp: ngang, dọc, chéo", "green", 34),
        cbox("c4-bad", 900, 270, 910, "Board.java",
             "boolean wins() {\n  for (r : mọi hàng) for (c : mọi cột)\n    for (d : 4 hướng) { /* đếm 4 ô */ }\n}", "violet", 28),
        bigerr("c4-be1", 900, 610, 910, "✕ quét 42 ô × 4 hướng mỗi nước", 30),
        bigerr("c4-be2", 900, 720, 910, "✕ số 4 nằm cứng, rải rác trong code", 30),
        el("c4-ring", 0, 0, 1920, 1080, ring_svg(), "r", "", " data-layout-allow-overlap"),
        el("c4-dirs", 0, 0, 1920, 1080, dirs_svg(), "r", "", " data-layout-allow-overlap"),
        cbox("c4-good", 900, 270, 910, "Board.java",
             "int[][] dirs = {{0,1},{1,0},{1,1},{1,-1}};\n"
             "for (int[] d : dirs) {\n"
             "  int n = 1;   // đếm hai phía quân vừa thả\n"
             "  ...\n"
             "  if (n >= 4) return true;\n"
             "}", "violet", 26),
        tag("c4-r1", 900, 650, 280, 100, "dọc: 7 nước", "green", 28),
        tag("c4-r2", 1200, 650, 290, 100, "ngang: 7 nước", "green", 28),
        tag("c4-r3", 1510, 650, 300, 100, "chéo: 11 nước", "green", 28),
        tag("c4-e1", 300, 290, 1320, 110, "cột 9 → column out of range", "red", 36),
        tag("c4-e2", 300, 430, 1320, 110, "cột đã đầy → column 0 is full", "red", 36),
        tag("c4-e3", 300, 570, 1320, 110, "hòa: đủ 42 nước (moves == ROWS * COLS)", "amber", 34),
        titled("c4-gm", 710, 290, 500, 140, "", "Game", "quản lý lượt đi", "violet", 44),
        titled("c4-bd", 300, 560, 500, 150, "", "Board", "trạng thái và luật", "cyan", 44),
        titled("c4-pl", 1120, 560, 500, 150, "", "Player", "người chơi", "cyan", 44),
        note("c4-nt", 300, 800, 1320, "Tách luật khỏi giao diện: test không cần vẽ bàn", "green", 38),
        el("c4-t1", 0, 400, 1920, None, letters("Chỉ xét quanh quân vừa thả"), "take r"),
        el("c4-t2", 0, 540, 1920, None, "mọi chuỗi thắng mới đều đi qua quân đó", "take-sm r"),
        wires(arrow("c4-g1", [(850, 435), (620, 555)], "violet"), arrow("c4-g2", [(1070, 435), (1290, 555)], "violet")),
    ]), beats=[
        B("Bài cuối, Connect Four, không có tranh chấp hay lập lịch, chỉ có luật chơi và đầu vào sai. Bàn sáu hàng, bảy cột, hai người lần lượt thả quân, ai có bốn quân liên tiếp trước thì thắng.",
          "Bàn 6×7, hai người thả quân, 4 quân liên tiếp thì thắng.",
          lambda w: [IN("#c4-eye", "blur"), TYPE("#c4-q", 0.2, 0.05), *shrink("c4", 2.0),
                     IN("#c4-board", "blur", 3.0, 0.8), IN("#c4-n1", "right", w("Bàn sáu")), IN("#c4-n2", "right", w("hai người")), IN("#c4-n3", "right", w("ai có"))]),
        B("Phần hay bị hỏi là kiểm tra thắng. Cách đầu tiên là quét cả bàn sau mỗi nước: bốn mươi hai ô, bốn hướng. Đúng, nhưng lãng phí, vì chỉ một quân vừa thay đổi, và con số bốn nằm rải rác trong code.",
          "Quét cả bàn mỗi nước: đúng nhưng lãng phí.",
          lambda w: [OUT(S("c4-n1", "c4-n2", "c4-n3"), "blur", 0, 0.4), IN("#c4-bad", "blur", 0.5, 0.7),
                     IN("#c4-be1", "up", w("bốn mươi hai")), IN("#c4-be2", "up", w("con số bốn")), SHAKE("#c4-be2", w("con số bốn") + 0.6)]),
        B("Cách tốt hơn: chỉ xét quanh quân vừa thả, vì mọi chuỗi thắng mới đều đi qua nó. Đếm về hai phía theo bốn hướng, ngang, dọc và hai đường chéo, đủ bốn quân là thắng. Chạy thật: thắng dọc sau bảy nước, ngang sau bảy nước, chéo sau mười một nước.",
          "Chỉ xét 4 hướng quanh quân vừa thả. Chạy thật: dọc 7, ngang 7, chéo 11 nước.",
          lambda w: [OUT(S("c4-bad", "c4-be1", "c4-be2"), "blur", 0, 0.4), IN("#c4-good", "blur", 0.5, 0.7),
                     IN("#c4-ring", "pop", w("chỉ xét quanh")), IN("#c4-dirs", "blur", w("Đếm về")),
                     IN("#c4-r1", "up", w("thắng dọc")), IN("#c4-r2", "up", w("ngang sau")), IN("#c4-r3", "up", w("chéo sau"))]),
        B("Đừng quên các trường hợp biên. Cột ngoài phạm vi, như cột chín, ném lỗi. Cột đã đầy cũng ném lỗi. Và hòa cờ khi đủ bốn mươi hai nước. Nói ra những trường hợp này là điểm cộng.",
          "Trường hợp biên: ngoài phạm vi, cột đầy, hòa cờ.",
          lambda w: [OUT(S("c4-good", "c4-r1", "c4-r2", "c4-r3", "c4-ring", "c4-dirs", "c4-board"), "blur", 0, 0.4),
                     IN("#c4-e1", "right", w("Cột ngoài")), IN("#c4-e2", "right", w("Cột đã đầy")), IN("#c4-e3", "right", w("hòa cờ"))]),
        B("Về phân lớp: Board giữ trạng thái và luật, Player là người chơi, Game quản lý lượt đi. Tách luật khỏi giao diện thì test không cần vẽ bàn.",
          "Board, Player, Game. Luật tách khỏi giao diện.",
          lambda w: [OUT(S("c4-e1", "c4-e2", "c4-e3"), "blur", 0, 0.4), IN("#c4-gm", "down", w("Game") - 0.2),
                     IN("#c4-bd", "up", w("Board giữ")), *ARROW("c4-g1", w("Board giữ") + 0.5, 0.5),
                     IN("#c4-pl", "up", w("Player là")), *ARROW("c4-g2", w("Player là") + 0.5, 0.5),
                     IN("#c4-nt", "up", w("Tách luật"))]),
        B("Câu chốt: sau mỗi nước, vì sao chỉ cần xét quanh quân vừa thả? Vì trước nước này chưa ai thắng, nên chỉ chuỗi chứa quân mới mới có thể thắng.",
          "Chỉ chuỗi chứa quân mới mới có thể thắng.",
          lambda w: [DIM(S("c4-eye", "c4-q", "c4-gm", "c4-bd", "c4-pl", "c4-nt") + ", " + AR("c4-g1", "c4-g2"), w("Vì trước") - 0.5, 0.07),
                     TYPE("#c4-t1", w("Vì trước"), 0.04), IN("#c4-t2", "blur", w("nên chỉ"))]),
    ]),
    # ------------------------------------------------------------ pattern drill
    dict(id="ghep-pattern", world=(1920, 1080), hud="", cam="".join([
        head("gp", "Bài tập", "Ghép pattern vào bài toán"),
        rule("gp-rule", "Em dùng pattern nào ở đây, và vì sao?", "Sáu tình huống, sáu pattern"),
        *DRILL_HTML,
        el("gp-t1", 0, 400, 1920, None, letters("Dấu hiệu trước, pattern sau"), "take r"),
        el("gp-t2", 0, 540, 1920, None, "không nhét pattern cho đủ", "take-sm r"),
    ]), beats=[
        B("Ba bài vừa rồi dùng lại cùng một nhóm pattern. Bài thiết kế hay hỏi: em dùng pattern nào ở đây, và vì sao? Hãy chọn pattern phù hợp cho từng tình huống.",
          "Em dùng pattern nào ở đây, và vì sao?",
          lambda w: [IN("#gp-eye", "blur"), TYPE("#gp-q", 0.2, 0.05), IN("#gp-rule", "up", w("Bài thiết kế") + 0.3)]),
        B("Một: bãi đỗ xe có nhiều chính sách tính phí cần đổi dễ dàng. Đó là Strategy, mỗi chính sách là một strategy sau interface Fee Policy. Hai: thang máy mà mỗi trạng thái xử lý khác nhau, đó là State, vì hành vi đổi theo trạng thái hiện tại.",
          "Strategy cho chính sách phí. State cho thang máy.",
          lambda w: [OUT("#gp-rule", "blur", 0, 0.4), *shrink("gp", 0),
                     IN("#gp-s0", "right", 0.5), IN("#gp-p0", "pop", w("Đó là Strategy") + 0.4), *ARROW("gp-a0", w("Đó là Strategy") - 0.2, 0.4),
                     IN("#gp-s1", "right", w("Hai:")), IN("#gp-p1", "pop", w("đó là State") + 0.3), *ARROW("gp-a1", w("đó là State") - 0.2, 0.4)]),
        B("Ba: bãi nhiều tầng, nhiều khu, nhiều chỗ, cần đếm chỗ trống ở mọi cấp. Đó là Composite, cây tầng, khu, chỗ cùng một giao diện. Bốn: ghế được giải phóng thì cần báo cho người đang chờ. Đó là Observer, phát sự kiện cho nhiều người nghe.",
          "Composite cho cây tầng, khu, chỗ. Observer cho thông báo.",
          lambda w: [IN("#gp-s2", "right", 0.3), IN("#gp-p2", "pop", w("Đó là Composite") + 0.4), *ARROW("gp-a2", w("Đó là Composite") - 0.2, 0.4),
                     IN("#gp-s3", "right", w("Bốn:")), IN("#gp-p3", "pop", w("Đó là Observer") + 0.4), *ARROW("gp-a3", w("Đó là Observer") - 0.2, 0.4)]),
        B("Năm: nhiều thang máy cần một bộ phận quyết định thang nào đón khách. Đó là Mediator, một điểm điều phối. Sáu: tạo đúng loại xe từ biển số hoặc cảm biến. Đó là Factory Method, che việc tạo class cụ thể khỏi nơi dùng.",
          "Mediator điều phối thang. Factory Method tạo đúng loại xe.",
          lambda w: [IN("#gp-s4", "right", 0.3), IN("#gp-p4", "pop", w("Đó là Mediator") + 0.4), *ARROW("gp-a4", w("Đó là Mediator") - 0.2, 0.4),
                     IN("#gp-s5", "right", w("Sáu:")), IN("#gp-p5", "pop", w("Đó là Factory") + 0.4), *ARROW("gp-a5", w("Đó là Factory") - 0.2, 0.4)]),
        B("Pattern xuất hiện khi bạn nhận ra dấu hiệu của nó trong yêu cầu, không phải khi cố nhét cho đủ.",
          "Dấu hiệu trước, pattern sau.",
          lambda w: [DIM(S("gp-eye", "gp-q", *[f"gp-s{i}" for i in range(6)], *[f"gp-p{i}" for i in range(6)]) + ", " + AR(*[f"gp-a{i}" for i in range(6)]), 0, 0.07),
                     TYPE("#gp-t1", 0.4, 0.04), IN("#gp-t2", "blur", w("không phải"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt LLD 2"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 200, 220 + i * 118, 1520, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Đặt vé", "Gộp kiểm tra và đặt: thao tác nguyên tử"), ("Giữ chỗ", "Lượt giữ có hạn, hết hạn tự nhả ghế"),
                                      ("Server", "Nhiều server: khóa ở database hoặc Redis"), ("Thang", "State + Strategy: SCAN 13 tầng, FIFO 25"),
                                      ("Cờ", "Chỉ xét 4 hướng quanh quân vừa thả")])],
        el("ou-cta", 0, 870, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại, ba bài. Đặt vé: gộp kiểm tra và đặt thành một thao tác nguyên tử, như pút If Absent hoặc Compute. Giữ chỗ thì có hạn, hết hạn thì ghế tự nhả. Nhiều server thì khóa ở database hoặc Redis.",
          "Đặt vé, giữ chỗ có hạn, nhiều server.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Đặt vé:")), IN("#ou-r1", "right", w("Giữ chỗ")), IN("#ou-r2", "right", w("Nhiều server"))]),
        B("Thang máy: State cho trạng thái, Strategy cho lập lịch. Scan đi mười ba tầng so với hai mươi lăm của Fi fô, và không bỏ đói tầng xa. Connect Four: chỉ xét bốn hướng quanh quân vừa thả, và nhớ các trường hợp biên.",
          "Thang máy và Connect Four.",
          lambda w: [IN("#ou-r3", "right", w("Thang máy:")), IN("#ou-r4", "right", w("Connect Four:"))]),
        B("Khi trả lời, hãy nói rõ dấu hiệu của pattern trong yêu cầu. Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", w("Mở bài"))]),
    ]),
]

fit_to_audio(SCENES, __file__)
