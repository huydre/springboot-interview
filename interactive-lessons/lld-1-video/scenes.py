"""LLD 1 explainer: answer framework, Parking Lot, Rate Limiter (fixed window, sliding log, token bucket).

All outputs come from one run on JDK 21 (web/src/data/lessons/lld-1.ts):
parking lot S1, M1, M2, L1: motorcycle -> S1, cars -> M1, M2, third car -> L1; EV(MEDIUM) 90 minutes -> M1, fee 40000;
car 150 minutes -> 60000; "lot full for CAR", "unknown ticket T999";
limit 5 per 60 s: fixed window 5 at 59s + 5 at 60s -> 10 accepted; sliding log -> 5 then 0;
6 at 0s + 3 at 2s: sliding log 5 + 0, token bucket (5, 1 per second) 5 + 2 = 7.
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
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700;text-align:center">{main}</span>'
    inner += f'<span class="mono" style="font-size:28px;color:var(--muted);text-align:center">{sub}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:60px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:38px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, lines, tone):
    body = "".join(f'<span style="font-size:34px;text-align:center;line-height:1.3;color:var(--muted)">{esc(t)}</span>' for t in lines)
    return box(id_, x, y, w, h, f'<b style="font-size:48px">{esc(title)}</b>{body}', tone, "card")


STEPS = [
    ("1", "Làm rõ yêu cầu", "loại xe? tính phí? mấy cổng? đa luồng?"),
    ("2", "Tìm entity và hành động", "Vehicle, Spot, Ticket · park, leave, fee"),
    ("3", "Quan hệ và interface", "phần dễ đổi đặt sau interface (Strategy)"),
    ("4", "Code phần cốt lõi", "luồng chính, lỗi: hết chỗ, vé không có"),
    ("5", "Mở rộng và đánh đổi", "Composite · thao tác nguyên tử · Redis"),
]
SPOTS = [("nhỏ", "S1"), ("vừa", "M1"), ("vừa", "M2"), ("lớn", "L1")]
SX = [130, 580, 1030, 1480]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn LLD", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Thiết kế bãi đỗ xe?"), "h1 r", "font-size:120px"),
        *[box(f"hk-c{i}", 70 + i * 460, 420, 400, 200,
              f'<b style="font-size:44px;text-align:center">{t}</b><span style="font-size:28px;color:var(--muted);text-align:center">{s}</span>', "cyan", "card")
          for i, (t, s) in enumerate([("Loại xe", "xe máy, ô tô, xe tải?"), ("Loại chỗ", "nhỏ, vừa, lớn?"),
                                      ("Cách tính phí", "theo giờ? làm tròn?"), ("Số cổng", "một hay nhiều?")])],
        chip("hk-p1", 560, 720, "Parking Lot", "cyan"),
        chip("hk-p2", 1060, 720, "Rate Limiter", "cyan"),
        el("hk-t1", 0, 400, 1920, None, letters("Chốt yêu cầu trước khi code"), "take r"),
        el("hk-t2", 0, 540, 1920, None, "rồi mới chọn thiết kế", "take-sm r"),
    ]), beats=[
        B("Người phỏng vấn nói: hãy thiết kế một bãi đỗ xe.",
          "Đề: thiết kế một bãi đỗ xe.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Đề này cố ý mơ hồ. Việc đầu tiên không phải là viết code, mà là hỏi lại: có những loại xe nào, loại chỗ nào, tính phí ra sao, và một hay nhiều cổng.",
          "Việc đầu tiên: hỏi lại yêu cầu.",
          lambda w: [IN("#hk-c0", "pop", w("có những loại xe")), IN("#hk-c1", "pop", w("loại chỗ")), IN("#hk-c2", "pop", w("tính phí")), IN("#hk-c3", "pop", w("một hay nhiều cổng"))]),
        B("Hôm nay ta học khung năm bước để trả lời, rồi giải hai bài kinh điển bằng code chạy thật: Parking Lot và Rate Limiter.",
          "Khung 5 bước, rồi Parking Lot và Rate Limiter.",
          lambda w: [IN("#hk-p1", "left", w("Parking Lot")), IN("#hk-p2", "right", w("Rate Limiter"))]),
        B("Nhớ nhé, chốt yêu cầu trước khi code, rồi mới chọn thiết kế.",
          "Chốt yêu cầu trước khi code.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-p1", "hk-p2", "hk-q", "hk-eye"), 0, 0.07),
                     TYPE("#hk-t1", 0.5, 0.04), IN("#hk-t2", "blur", w("rồi mới"))]),
    ]),
    # ------------------------------------------------------------ framework
    dict(id="khung", world=(1920, 1080), hud="", cam="".join([
        head("kh", "Khung trả lời", "5 bước trả lời bài LLD"),
        rule("kh-rule", "Người phỏng vấn chấm cách bạn tư duy", "không chỉ code cuối cùng"),
        *[box(f"kh-r{i}", 110, 250 + i * 112, 800, 96, row(n, t), "cyan", "row") for i, (n, t, _e) in enumerate(STEPS)],
        *[tag(f"kh-x{i}", 960, 250 + i * 112, 850, 96, e, "amber", 28) for i, (_n, _t, e) in enumerate(STEPS)],
        tag("kh-w1", 110, 300, 800, 120, "Code ngay khi chưa hiểu đề", "red", 36),
        tag("kh-w2", 960, 300, 850, 120, "Vẽ 20 class cho yêu cầu đơn giản", "red", 36),
        note("kh-wn", 110, 500, 1700, "Hai lỗi ngược nhau. Chốt yêu cầu trước, rồi chỉ trừu tượng hóa chỗ thật sự thay đổi.", "red", 36),
        el("kh-t1", 0, 400, 1920, None, letters("Chỉ trừu tượng hóa chỗ thay đổi"), "take r"),
        el("kh-t2", 0, 540, 1920, None, "đúng tinh thần OCP và YAGNI", "take-sm r"),
    ]), beats=[
        B("Người phỏng vấn chấm cách bạn tư duy, không chỉ code cuối cùng. Một khung cố định giúp bạn không bỏ sót và nói mạch lạc.",
          "Chấm cách tư duy, không chỉ code.",
          lambda w: [IN("#kh-eye", "blur"), TYPE("#kh-q", 0.2, 0.05), IN("#kh-rule", "up", w("Người phỏng vấn") + 0.3)]),
        B("Bước một: làm rõ yêu cầu, hỏi phạm vi và ràng buộc. Bước hai: tìm entity. Danh từ thành class, động từ thành method.",
          "Bước 1 và 2: yêu cầu, entity.",
          lambda w: [OUT("#kh-rule", "blur", 0, 0.4), *shrink("kh", 0),
                     IN("#kh-r0", "right", 0.6), IN("#kh-x0", "left", w("hỏi phạm vi")),
                     IN("#kh-r1", "right", w("Bước hai")), IN("#kh-x1", "left", w("Danh từ"))]),
        B("Bước ba: phần dễ đổi như cách tính phí đặt sau interface. Bước bốn: code luồng chính chạy đúng, kèm xử lý lỗi như hết chỗ hay vé không tồn tại.",
          "Bước 3 và 4: interface, code lõi.",
          lambda w: [IN("#kh-r2", "right", 0.3), IN("#kh-x2", "left", w("phần dễ đổi")),
                     IN("#kh-r3", "right", w("Bước bốn")), IN("#kh-x3", "left", w("kèm xử lý"))]),
        B("Bước năm: mở rộng và đánh đổi. Nhiều tầng thì dùng Composite. Nhiều cổng thì chọn chỗ và đánh dấu đã dùng phải là một thao tác nguyên tử. Nhiều server thì lưu trạng thái ở Redis.",
          "Bước 5: nói trước câu hỏi tiếp theo.",
          lambda w: [IN("#kh-r4", "right", 0.3), IN("#kh-x4", "left", w("Nhiều tầng")), PULSE("#kh-x4", w("Nhiều cổng")), PULSE("#kh-x4", w("Nhiều server"))]),
        B("Có hai lỗi ngược nhau. Code ngay khi chưa hiểu đề, hoặc vẽ hai mươi class cho một yêu cầu đơn giản. Hãy chốt yêu cầu trước, rồi chỉ trừu tượng hóa chỗ thật sự thay đổi.",
          "Đừng nhảy vào code, đừng thiết kế quá đà.",
          lambda w: [OUT(S(*[f"kh-r{i}" for i in range(5)], *[f"kh-x{i}" for i in range(5)]), "blur", 0, 0.5),
                     IN("#kh-w1", "right", w("Code ngay") + 0.2), IN("#kh-w2", "left", w("vẽ hai mươi")), IN("#kh-wn", "up", w("Hãy chốt")),
                     DIM(S("kh-eye", "kh-q", "kh-w1", "kh-w2", "kh-wn"), w("chỉ trừu tượng") - 0.2, 0.07),
                     TYPE("#kh-t1", w("chỉ trừu tượng"), 0.04), IN("#kh-t2", "blur", w("thật sự"))]),
    ]),
    # ------------------------------------------------------------ parking lot
    dict(id="parking-lot", world=(1920, 1080), hud="", cam="".join([
        head("pk", "Bài 1 · Parking Lot", "Chọn chỗ và tính phí"),
        *[titled(f"pk-s{i}", SX[i], 260, 380, 130, k, f"<b>{n}</b>", "", "cyan", 44) for i, (k, n) in enumerate(SPOTS)],
        cbox("pk-en", 110, 450, 1000, "VehicleType.java",
             "enum VehicleType {\n"
             "    MOTORCYCLE(SMALL),\n"
             "    CAR(MEDIUM),\n"
             "    TRUCK(LARGE);\n"
             "    final Size need;\n"
             "}", "violet", 34),
        tag("pk-eb", 1180, 470, 630, 120, "\"Car\" thay vì \"CAR\": vẫn biên dịch", "red", 28),
        tag("pk-eg", 1180, 640, 630, 120, "Gõ sai Enum: compiler báo lỗi ngay", "green", 28),
        tag("pk-v0", SX[0], 580, 380, 90, "Xe máy", "amber", 36), tag("pk-v1", SX[1], 580, 380, 90, "Ô tô 1", "amber", 36),
        tag("pk-v2", SX[2], 580, 380, 90, "Ô tô 2", "amber", 36), tag("pk-v3", SX[3], 580, 380, 90, "Ô tô 3", "amber", 36),
        note("pk-nt", 130, 730, 1730, "Chọn chỗ nhỏ nhất vẫn vừa. Chỗ vừa đầy thì ô tô dùng L1.", "green", 38),
        titled("pk-lot", 110, 400, 480, 140, "", "ParkingLot", "", "amber", 40),
        titled("pk-fp", 720, 400, 500, 160, "«interface»", "FeePolicy", "", "violet", 44),
        titled("pk-hf", 1320, 290, 490, 130, "implements", "HourlyFee", "", "cyan", 36),
        titled("pk-nf", 1320, 520, 490, 150, "implements", "FeePolicy mới", "ParkingLot không đổi", "green", 36),
        el("pk-cl", 598, 435, 110, None, "gọi", "mono", "font-size:28px;color:var(--muted);text-align:center"),
        cbox("pk-fc", 310, 700, 1300, "FeePolicy.java", "interface FeePolicy { long fee(VehicleType v, int minutes); }", "violet", 32),
        titled("pk-e1", 110, 260, 520, 170, "thêm vào Enum", "EV(MEDIUM)", "", "cyan", 40),
        titled("pk-e2", 700, 260, 520, 170, "xe điện vào", "M1", "", "cyan", 48),
        titled("pk-e3", 1290, 260, 520, 170, "90 phút làm tròn lên 2 giờ", "2 × 20000 = 40000", "", "green", 36),
        titled("pk-c1", 110, 500, 520, 170, "ô tô đỗ", "150 phút", "", "cyan", 44),
        titled("pk-c2", 700, 500, 520, 170, "làm tròn lên", "3 giờ", "tối thiểu 1 giờ", "amber", 44),
        titled("pk-c3", 1290, 500, 520, 170, "3 giờ × 20000", "= 60000", "", "green", 44),
        note("pk-nr", 110, 740, 1700, "park() không đổi. Quy tắc làm tròn là yêu cầu cần chốt, không phải chi tiết nhỏ.", "amber", 34),
        tag("pk-x1", 110, 300, 800, 110, "lot full for CAR", "red", 40),
        tag("pk-x2", 1010, 300, 800, 110, "unknown ticket T999", "red", 40),
        tag("pk-x3", 110, 470, 1700, 110, "Một xe ra: xe sau lại vào được M1", "green", 38),
        el("pk-t1", 0, 400, 1920, None, letters("Mỗi yêu cầu mới chỉ chạm một chỗ"), "take r"),
        el("pk-t2", 0, 540, 1920, None, "loại xe là Enum, chính sách phí đứng sau interface", "take-sm r"),
        wires(*[arrow(f"pk-va{i}", [(SX[i] + 190, 575), (SX[i] + 190, 395)], "amber") for i in range(4)],
              arrow("pk-a1", [(592, 470), (715, 470)], "amber"),
              arrow("pk-a2", [(1315, 355), (1225, 440)], "violet", True), arrow("pk-a3", [(1315, 595), (1225, 520)], "violet", True),
              arrow("pk-ea1", [(633, 345), (697, 345)], "cyan"), arrow("pk-ea2", [(1223, 345), (1287, 345)], "cyan"),
              arrow("pk-ca1", [(633, 585), (697, 585)], "cyan"), arrow("pk-ca2", [(1223, 585), (1287, 585)], "cyan")),
    ]), beats=[
        B("Bài thứ nhất: Parking Lot. Bãi xe có chỗ nhỏ, chỗ vừa và chỗ lớn. Xe máy, ô tô và xe tải cần chỗ khác nhau. Vào bãi thì nhận vé, ra bãi thì tính phí theo giờ.",
          "Chỗ nhỏ, vừa, lớn. Vào nhận vé, ra tính phí.",
          lambda w: [IN("#pk-eye", "blur"), TYPE("#pk-q", 0.2, 0.05), *shrink("pk", w("Bãi xe") - 0.5),
                     IN("#pk-s0", "pop", w("chỗ nhỏ")), IN("#pk-s1", "pop", w("chỗ vừa")), IN("#pk-s2", "pop", w("chỗ vừa") + 0.4), IN("#pk-s3", "pop", w("chỗ lớn"))]),
        B("Loại xe nên là Enum, không phải chuỗi. Mỗi loại mang theo cỡ chỗ nó cần. Gõ sai tên loại xe thì trình biên dịch báo lỗi ngay, thay vì lộ ra lúc chạy.",
          "Enum: compiler bắt lỗi gõ sai.",
          lambda w: [IN("#pk-en", "blur", 0.4, 0.7), PULSE("#pk-en", w("Mỗi loại")),
                     IN("#pk-eb", "left", w("Gõ sai") - 0.3), IN("#pk-eg", "left", w("thì trình biên dịch"))]),
        B("Chọn chỗ theo quy tắc nhỏ nhất vẫn vừa, để dành chỗ lớn. Chạy thật: xe máy vào S1, hai ô tô đầu vào M1 và M2. Chỗ vừa đã đầy nên ô tô thứ ba dùng L1.",
          "Chạy thật: xe máy S1, ô tô M1, M2, rồi L1.",
          lambda w: [OUT(S("pk-en", "pk-eb", "pk-eg"), "blur", 0, 0.4),
                     IN("#pk-v0", "up", w("xe máy vào")), *ARROW("pk-va0", w("xe máy vào") + 0.4, 0.4),
                     IN("#pk-v1", "up", w("hai ô tô")), *ARROW("pk-va1", w("hai ô tô") + 0.4, 0.4),
                     IN("#pk-v2", "up", w("M1 và M2")), *ARROW("pk-va2", w("M1 và M2") + 0.4, 0.4),
                     IN("#pk-v3", "up", w("Chỗ vừa đã đầy")), *ARROW("pk-va3", w("ô tô thứ ba"), 0.4),
                     IN("#pk-nt", "up", w("Chọn chỗ") + 0.4)]),
        B("Cách tính phí là chính sách dễ đổi, nên đặt sau interface Fee Policy, theo mẫu Strategy. Parking Lot chỉ gọi fee, không cần biết phí tính thế nào. Hourly Fee là một cách cài đặt, và cách mới chỉ cần viết thêm một class.",
          "Strategy: FeePolicy là interface, ParkingLot chỉ gọi.",
          lambda w: [OUT(S("pk-s0", "pk-s1", "pk-s2", "pk-s3", "pk-v0", "pk-v1", "pk-v2", "pk-v3", "pk-nt") + ", " + AR("pk-va0", "pk-va1", "pk-va2", "pk-va3"), "blur", 0, 0.5),
                     IN("#pk-fp", "up", 0.6), IN("#pk-lot", "left", w("Parking Lot chỉ")), IN("#pk-cl", "fade", w("chỉ gọi")), *ARROW("pk-a1", w("chỉ gọi"), 0.5),
                     IN("#pk-hf", "right", w("Hourly Fee")), *ARROW("pk-a2", w("Hourly Fee") + 0.4, 0.5),
                     IN("#pk-nf", "right", w("cách mới")), *ARROW("pk-a3", w("cách mới") + 0.4, 0.5),
                     IN("#pk-fc", "up", w("Fee Policy") - 0.3)]),
        B("Thêm xe điện cũng dễ: thêm EV cỡ vừa vào Enum và một mức giá trong Hourly Fee, còn park không đổi. Chạy thật: xe điện vào M1, đỗ chín mươi phút trả bốn mươi nghìn, làm tròn lên hai giờ nhân hai mươi nghìn. Ô tô đỗ một trăm năm mươi phút trả sáu mươi nghìn, ba giờ nhân hai mươi nghìn.",
          "EV: 90 phút = 40000. Ô tô: 150 phút = 60000.",
          lambda w: [OUT(S("pk-lot", "pk-fp", "pk-hf", "pk-nf", "pk-cl", "pk-fc") + ", " + AR("pk-a1", "pk-a2", "pk-a3"), "blur", 0, 0.5),
                     IN("#pk-e1", "up", 0.7), *ARROW("pk-ea1", w("xe điện vào") - 0.5, 0.4), IN("#pk-e2", "up", w("xe điện vào")),
                     *ARROW("pk-ea2", w("đỗ chín") - 0.3, 0.4), IN("#pk-e3", "up", w("đỗ chín")),
                     IN("#pk-c1", "up", w("Ô tô đỗ")), *ARROW("pk-ca1", w("Ô tô đỗ") + 1.0, 0.4), IN("#pk-c2", "up", w("Ô tô đỗ") + 1.3),
                     *ARROW("pk-ca2", w("ba giờ nhân") - 0.5, 0.4), IN("#pk-c3", "up", w("ba giờ nhân")),
                     IN("#pk-nr", "up", w("ba giờ nhân") + 1.5)]),
        B("Lỗi cũng rõ ràng. Bãi đầy thì báo lot full for CAR. Vé lạ thì báo unknown ticket T chín trăm chín mươi chín. Một xe ra thì xe sau lại vào được M1. Tóm lại, loại xe là Enum, chính sách phí đứng sau interface, mỗi yêu cầu mới chỉ chạm một chỗ.",
          "Lỗi rõ ràng. Mỗi yêu cầu mới chỉ chạm một chỗ.",
          lambda w: [OUT(S("pk-e1", "pk-e2", "pk-e3", "pk-c1", "pk-c2", "pk-c3", "pk-nr") + ", " + AR("pk-ea1", "pk-ea2", "pk-ca1", "pk-ca2"), "blur", 0, 0.5),
                     IN("#pk-x1", "right", w("Bãi đầy")), IN("#pk-x2", "left", w("Vé lạ")), IN("#pk-x3", "up", w("Một xe ra")),
                     DIM(S("pk-eye", "pk-q", "pk-x1", "pk-x2", "pk-x3"), w("Tóm lại") - 0.2, 0.07),
                     TYPE("#pk-t1", w("Tóm lại"), 0.04), IN("#pk-t2", "blur", w("loại xe là"))]),
    ]),
    # ------------------------------------------------------------ rate limiter
    dict(id="rate-limiter", world=(1920, 1080), hud="", cam="".join([
        head("rl", "Bài 2 · Rate Limiter", "Giới hạn tốc độ"),
        rule("rl-rule", "Tối đa 5 yêu cầu mỗi 60 giây", "vượt thì từ chối (HTTP 429), và phải đúng khi nhiều thread"),
        titled("rl-wa", 110, 260, 830, 130, "Fixed Window", "Cửa sổ 0s → 60s", "bộ đếm từ 0 tới 5", "cyan", 38),
        titled("rl-wb", 980, 260, 830, 130, "", "Cửa sổ 60s → 120s", "đếm lại từ 0", "cyan", 38),
        cbox("rl-fc", 110, 470, 1200, "FixedWindow.java",
             "if (now - start >= windowMs) {\n"
             "    start = now - (now % windowMs); count = 0; }\n"
             "return count++ < limit;", "violet", 30),
        tag("rl-b1", 560, 470, 380, 100, "5 yêu cầu lúc 59s", "amber", 30),
        tag("rl-b2", 980, 470, 380, 100, "5 yêu cầu lúc 60s", "amber", 30),
        bigerr("rl-be", 110, 650, 1700, "✕ 10 yêu cầu trong 1 giây, dù giới hạn là 5 mỗi phút", 40),
        cbox("rl-sc", 110, 260, 1300, "SlidingLog.java",
             "while (!log.isEmpty() && now - log.peekFirst() >= windowMs)\n"
             "    log.pollFirst();               // bỏ mốc cũ hơn 60 giây\n"
             "if (log.size() < limit) { log.addLast(now); return true; }\n"
             "return false;", "violet", 28),
        tag("rl-g1", 110, 600, 500, 100, "59s: nhận 5", "green", 38),
        tag("rl-g2", 660, 600, 500, 100, "60s: nhận 0", "green", 38),
        tag("rl-g3", 1210, 600, 600, 100, "nhớ tới N mốc mỗi người", "amber", 32),
        note("rl-gn", 110, 740, 1700, "5 mốc của giây 59 vẫn nằm trong 60 giây gần nhất, nên log đã đủ 5.", "green", 34),
        card("rl-k1", 110, 260, 820, 400, "Fixed Window", ["nhẹ: chỉ hai số", "nhưng lọt burst gấp đôi", "ở ranh giới cửa sổ"], "amber"),
        card("rl-k2", 990, 260, 820, 400, "Sliding Log", ["chính xác", "nhưng nhớ tới N mốc", "thời gian cho mỗi người dùng"], "cyan"),
        titled("rl-ta", 110, 260, 520, 170, "Thread A", "đọc 4", "ghi 5", "amber", 44),
        titled("rl-tb", 700, 260, 520, 170, "Thread B", "đọc 4", "ghi 5", "amber", 44),
        bigerr("rl-te", 1290, 290, 520, "✕ cả hai lọt qua,<br>đếm chỉ tăng 1", 34),
        tag("rl-f1", 110, 520, 520, 100, "Synchronized", "green", 34), tag("rl-f2", 700, 520, 520, 100, "Atomic Long", "green", 34),
        tag("rl-f3", 1290, 520, 520, 100, "Redis đếm", "green", 34),
        note("rl-fn", 110, 700, 1700, "Truyền đồng hồ vào (LongSupplier): test không cần sleep, kết quả luôn xác định.", "green", 34),
        el("rl-t1", 0, 400, 1920, None, letters("Nhẹ thì lọt burst"), "take r"),
        el("rl-t2", 0, 540, 1920, None, "chính xác thì tốn bộ nhớ", "take-sm r"),
        wires(arrow("rl-ba1", [(750, 465), (750, 395)], "amber"), arrow("rl-ba2", [(1170, 465), (1170, 395)], "amber")),
    ]), beats=[
        B("Bài thứ hai: Rate Limiter. Mỗi người dùng chỉ được gửi tối đa năm yêu cầu trong sáu mươi giây. Vượt quá thì từ chối với mã bốn trăm hai mươi chín, và phải đúng khi nhiều thread cùng chạy.",
          "Tối đa 5 yêu cầu mỗi 60 giây, vượt thì từ chối.",
          lambda w: [IN("#rl-eye", "blur"), TYPE("#rl-q", 0.2, 0.05), IN("#rl-rule", "up", w("Mỗi người dùng") + 0.3)]),
        B("Thuật toán thứ nhất, Fixed Window. Chia thời gian thành các cửa sổ cố định, mỗi cửa sổ một bộ đếm. Sang cửa sổ mới thì đếm lại từ không. Mỗi người dùng chỉ cần nhớ hai số.",
          "Fixed Window: mỗi cửa sổ một bộ đếm.",
          lambda w: [OUT("#rl-rule", "blur", 0, 0.4), *shrink("rl", 0),
                     IN("#rl-wa", "right", w("Chia thời gian")), IN("#rl-wb", "left", w("Sang cửa sổ")),
                     IN("#rl-fc", "up", w("Mỗi người dùng chỉ"), 0.7)]),
        B("Vấn đề là burst, tức nhiều yêu cầu dồn vào cùng một lúc. Gửi năm yêu cầu lúc năm mươi chín giây, rồi năm yêu cầu nữa lúc sáu mươi giây. Chạy thật: cả mười yêu cầu đều được nhận trong một giây, dù giới hạn là năm mỗi phút.",
          "Burst: 10 yêu cầu trong 1 giây đều được nhận.",
          lambda w: [OUT("#rl-fc", "blur", 0, 0.4),
                     IN("#rl-b1", "up", w("Gửi năm")), *ARROW("rl-ba1", w("Gửi năm") + 0.4, 0.4),
                     IN("#rl-b2", "up", w("rồi năm")), *ARROW("rl-ba2", w("rồi năm") + 0.4, 0.4),
                     IN("#rl-be", "up", w("Chạy thật")), SHAKE("#rl-be", w("Chạy thật") + 0.8)]),
        B("Thuật toán thứ hai, Sliding Log. Giữ mốc thời gian của từng yêu cầu. Mỗi lần có yêu cầu mới thì bỏ các mốc cũ hơn sáu mươi giây, rồi đếm phần còn lại. Chạy thật: lúc năm mươi chín giây nhận năm, lúc sáu mươi giây nhận không. Cái giá là phải nhớ tới N mốc cho mỗi người dùng.",
          "Sliding Log: 59s nhận 5, 60s nhận 0.",
          lambda w: [OUT(S("rl-wa", "rl-wb", "rl-b1", "rl-b2", "rl-be") + ", " + AR("rl-ba1", "rl-ba2"), "blur", 0, 0.5),
                     IN("#rl-sc", "blur", 0.6, 0.7), PULSE("#rl-sc", w("bỏ các mốc")),
                     IN("#rl-g1", "up", w("Chạy thật")), IN("#rl-g2", "up", w("Chạy thật") + 0.8), IN("#rl-gn", "up", w("Chạy thật") + 1.4),
                     IN("#rl-g3", "up", w("Cái giá"))]),
        B("So sánh nhé. Fixed Window nhẹ vì chỉ hai số, nhưng lọt burst gấp đôi ở ranh giới cửa sổ. Sliding Log chính xác, nhưng nhớ tới N mốc thời gian cho mỗi người dùng. Nhẹ thì lọt burst, chính xác thì tốn bộ nhớ.",
          "Nhẹ thì lọt burst, chính xác thì tốn bộ nhớ.",
          lambda w: [OUT(S("rl-sc", "rl-g1", "rl-g2", "rl-g3", "rl-gn"), "blur", 0, 0.5),
                     IN("#rl-k1", "up", 0.7), IN("#rl-k2", "up", w("Sliding Log chính xác")),
                     DIM(S("rl-eye", "rl-q", "rl-k1", "rl-k2"), w("Nhẹ thì lọt") - 0.2, 0.07),
                     TYPE("#rl-t1", w("Nhẹ thì lọt"), 0.04), IN("#rl-t2", "blur", w("chính xác thì"))]),
        B("Còn nhiều thread thì sao? Lệnh count tăng một không nguyên tử: nó đọc, cộng một, rồi ghi lại. Hai thread cùng đọc bốn, cùng ghi năm, và cả hai yêu cầu đều lọt qua. Cách sửa là Synchronized, Atomic Long, hoặc để Redis đếm. Và hãy truyền đồng hồ vào, để test không phải chờ thật.",
          "count++ không nguyên tử: dùng Synchronized, Atomic, Redis.",
          lambda w: [OUT(S("rl-eye", "rl-q", "rl-k1", "rl-k2", "rl-t1", "rl-t2"), "blur", 0, 0.5),
                     IN("#rl-ta", "up", w("Hai thread")), IN("#rl-tb", "up", w("Hai thread") + 0.5), IN("#rl-te", "up", w("cả hai yêu cầu")), SHAKE("#rl-te", w("cả hai yêu cầu") + 0.7),
                     IN("#rl-f1", "up", w("Synchronized")), IN("#rl-f2", "up", w("Atomic Long")), IN("#rl-f3", "up", w("Redis đếm")),
                     IN("#rl-fn", "up", w("truyền đồng hồ"))]),
    ]),
    # ------------------------------------------------------------ token bucket
    dict(id="token-bucket", world=(1920, 1080), hud="", cam="".join([
        head("tb", "Bài 2 · phần tiếp theo", "Token Bucket"),
        rule("tb-rule", "Lấy điểm tốt của cả hai", "nhẹ như Fixed Window, không có burst ở ranh giới"),
        box("tb-bk", 110, 260, 1100, 260, '<b style="font-size:34px">Xô của mỗi người dùng, tối đa 5 token</b><div style="height:130px"></div>', "cyan", "card"),
        *[tag(f"tb-k{i}", 165 + i * 175, 380, 150, 90, "token", "green", 28) for i in range(5)],
        titled("tb-rf", 1290, 280, 520, 220, "mỗi giây nạp", "+1 token", "không vượt quá 5", "green", 44),
        tag("tb-rq", 110, 620, 280, 100, "Yêu cầu", "amber", 36),
        tag("tb-g", 480, 620, 380, 100, "Lấy 1 token", "cyan", 36),
        tag("tb-ok", 980, 580, 830, 90, "Còn token: cho qua", "green", 34),
        tag("tb-no", 980, 710, 830, 90, "Xô rỗng: từ chối (429)", "red", 34),
        cbox("tb-code", 110, 560, 1400, "TokenBucket.java",
             "tokens = Math.min(capacity, tokens + elapsedMs * refillPerMs);\n"
             "last = now;\n"
             "if (tokens >= 1) { tokens -= 1; return true; }\n"
             "return false;", "violet", 30),
        tag("tb-h", 1560, 600, 250, 120, "tokens, last", "cyan", 32),
        card("tb-c1", 110, 260, 820, 440, "Sliding Log", ["lúc 0s: nhận 5 trong 6", "lúc 2s: nhận 0 trong 3", "tổng 5"], "amber"),
        card("tb-c2", 990, 260, 820, 440, "Token Bucket", ["lúc 0s: nhận 5 trong 6", "lúc 2s: nhận 2 trong 3", "tổng 7"], "green"),
        note("tb-cn", 110, 760, 1700, "Cho một đợt dồn ngắn, nhưng về lâu dài chỉ 1 yêu cầu mỗi giây.", "green", 36),
        tag("tb-s1", 110, 260, 420, 100, "Server 1", "amber", 36), tag("tb-s2", 110, 390, 420, 100, "Server 2", "amber", 36),
        tag("tb-s3", 110, 520, 420, 100, "Server 3", "amber", 36),
        titled("tb-rd", 780, 300, 440, 280, "", "Redis", "bộ đếm dùng chung", "violet", 56),
        tag("tb-l1", 1330, 300, 480, 110, "INCR rồi EXPIRE", "green", 36),
        tag("tb-l2", 1330, 450, 480, 130, "gộp trong một Lua script", "green", 32),
        bigerr("tb-sw", 110, 680, 1700, "✕ mỗi server tự đếm: người dùng được N lần ở mỗi server", 36),
        el("tb-t1", 0, 400, 1920, None, letters("Một bộ đếm dùng chung ở Redis"), "take r"),
        el("tb-t2", 0, 540, 1920, None, "INCR và EXPIRE gộp trong một Lua script", "take-sm r"),
        wires(arrow("tb-ra", [(1285, 390), (1215, 390)], "green"),
              arrow("tb-fa", [(395, 670), (475, 670)], "cyan"),
              arrow("tb-fb", [(865, 660), (975, 625)], "green"), arrow("tb-fc", [(865, 680), (975, 755)], "red"),
              arrow("tb-sa", [(535, 310), (775, 400)], "amber"), arrow("tb-sb", [(535, 440), (775, 440)], "amber"),
              arrow("tb-sc", [(535, 570), (775, 480)], "amber"),
              arrow("tb-la", [(1225, 440), (1325, 400)], "green")),
    ]), beats=[
        B("Phần tiếp theo: Token Bucket. Fixed Window nhẹ nhưng lọt burst, Sliding Log chặt nhưng nặng. Token Bucket lấy điểm tốt của cả hai.",
          "Token Bucket: lấy điểm tốt của cả hai.",
          lambda w: [IN("#tb-eye", "blur"), TYPE("#tb-q", 0.2, 0.05), IN("#tb-rule", "up", w("Token Bucket lấy") + 0.2)]),
        B("Mỗi người dùng có một cái xô chứa tối đa năm token, ban đầu đầy. Token được nạp lại đều đặn, một token mỗi giây, và không vượt quá năm.",
          "Xô tối đa 5 token, nạp 1 token mỗi giây.",
          lambda w: [OUT("#tb-rule", "blur", 0, 0.4), *shrink("tb", 0),
                     IN("#tb-bk", "up", 0.6), *[IN(f"#tb-k{i}", "pop", w("ban đầu đầy") - 0.6 + i * 0.25, 0.4) for i in range(5)],
                     IN("#tb-rf", "left", w("Token được nạp")), *ARROW("tb-ra", w("một token mỗi") + 0.2, 0.4)]),
        B("Mỗi yêu cầu lấy một token. Còn token thì cho qua. Xô rỗng thì từ chối với mã bốn trăm hai mươi chín.",
          "Còn token: cho qua. Xô rỗng: từ chối.",
          lambda w: [IN("#tb-rq", "up", 0.3), *ARROW("tb-fa", 0.5, 0.4), IN("#tb-g", "up", 0.8), PULSE("#tb-k4", 1.0),
                     *ARROW("tb-fb", w("Còn token"), 0.4), IN("#tb-ok", "right", w("Còn token") + 0.4),
                     *ARROW("tb-fc", w("Xô rỗng"), 0.4), IN("#tb-no", "right", w("Xô rỗng") + 0.4)]),
        B("Code rất ngắn. Nạp token theo thời gian đã trôi, rồi nếu còn từ một token trở lên thì trừ một và cho qua. Mỗi người dùng chỉ cần nhớ hai số: tokens và last.",
          "Chỉ nhớ hai số: tokens và last.",
          lambda w: [OUT(S("tb-rq", "tb-g", "tb-ok", "tb-no") + ", " + AR("tb-fa", "tb-fb", "tb-fc"), "blur", 0, 0.5),
                     IN("#tb-code", "up", 0.6, 0.7), PULSE("#tb-code", w("Nạp token")), PULSE("#tb-code", w("nếu còn")),
                     IN("#tb-h", "pop", w("hai số"))]),
        B("Chạy thật: sáu yêu cầu lúc không giây, cả hai thuật toán nhận năm. Lúc hai giây có ba yêu cầu nữa. Sliding Log từ chối cả ba, còn Token Bucket nhận hai, vì xô đã nạp lại hai token. Tổng bảy so với năm.",
          "Lúc 2s: Sliding Log nhận 0, Token Bucket nhận 2.",
          lambda w: [OUT(S("tb-bk", "tb-rf", "tb-code", "tb-h", *[f"tb-k{i}" for i in range(5)]) + ", " + AR("tb-ra"), "blur", 0, 0.5),
                     IN("#tb-c1", "up", 0.7), IN("#tb-c2", "up", w("còn Token Bucket") - 0.5),
                     PULSE("#tb-c2", w("nhận hai")), IN("#tb-cn", "up", w("Tổng bảy"))]),
        B("Nhiều server thì mỗi server tự đếm là sai, vì người dùng được N lần ở mỗi server. Bộ đếm phải nằm ở Redis dùng chung. Fixed Window trên Redis là tăng đếm rồi đặt thời hạn, gộp trong một Lua script để hai lệnh không bị tách đôi.",
          "Nhiều server: bộ đếm dùng chung ở Redis.",
          lambda w: [OUT(S("tb-c1", "tb-c2", "tb-cn"), "blur", 0, 0.5),
                     IN("#tb-s1", "right", 0.6), IN("#tb-s2", "right", 0.9), IN("#tb-s3", "right", 1.2),
                     IN("#tb-sw", "up", w("mỗi server tự đếm")), SHAKE("#tb-sw", w("mỗi server tự đếm") + 0.8),
                     IN("#tb-rd", "up", w("Bộ đếm phải")), *ARROW("tb-sa", w("Bộ đếm phải") + 0.3, 0.4), *ARROW("tb-sb", w("Bộ đếm phải") + 0.5, 0.4), *ARROW("tb-sc", w("Bộ đếm phải") + 0.7, 0.4),
                     IN("#tb-l1", "right", w("tăng đếm")), *ARROW("tb-la", w("tăng đếm") - 0.3, 0.4), IN("#tb-l2", "right", w("gộp trong")),
                     DIM(S("tb-eye", "tb-q", "tb-s1", "tb-s2", "tb-s3", "tb-rd", "tb-l1", "tb-l2", "tb-sw") + ", " + AR("tb-sa", "tb-sb", "tb-sc", "tb-la"), w("để hai lệnh") - 0.2, 0.07),
                     TYPE("#tb-t1", w("để hai lệnh"), 0.04), IN("#tb-t2", "blur", w("để hai lệnh") + 1.5)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt LLD 1"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 160, 200 + i * 105, 1600, 90, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Khung", "Làm rõ, entity, interface, code lõi, mở rộng"),
                                      ("Parking", "Enum loại xe, chỗ nhỏ nhất vẫn vừa, Strategy cho phí"),
                                      ("Fixed", "Nhẹ, hai số, nhưng burst gấp đôi ở ranh giới"),
                                      ("Sliding", "Chính xác, nhưng nhớ tới N mốc mỗi người dùng"),
                                      ("Bucket", "Hai số, cho burst nhỏ, giữ tốc độ trung bình"),
                                      ("Server", "Một JVM: Synchronized. Nhiều server: Redis")])],
        el("ou-cta", 0, 900, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Trả lời bài LLD theo năm bước: làm rõ yêu cầu, tìm entity, đặt phần dễ đổi sau interface, code luồng chính, rồi nói về mở rộng.",
          "Khung 5 bước.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Trả lời"))]),
        B("Bãi đỗ xe thì dùng Enum cho loại xe, chọn chỗ nhỏ nhất vẫn vừa, và tách cách tính phí thành Strategy.",
          "Parking Lot: Enum, chỗ nhỏ nhất vẫn vừa, Strategy.",
          lambda w: [IN("#ou-r1", "right", w("Bãi đỗ xe"))]),
        B("Với Rate Limiter, Fixed Window nhẹ nhưng cho burst gấp đôi. Sliding Log chính xác nhưng tốn bộ nhớ. Token Bucket giữ cả hai ưu điểm.",
          "Fixed Window, Sliding Log, Token Bucket.",
          lambda w: [IN("#ou-r2", "right", w("Fixed Window")), IN("#ou-r3", "right", w("Sliding Log")), IN("#ou-r4", "right", w("Token Bucket"))]),
        B("Một JVM thì dùng Synchronized, nhiều server thì đếm ở Redis. Mở bài học tương tác để làm quiz và tự tay thử nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-r5", "right", w("Một JVM")), IN("#ou-cta", "blur", w("Mở bài"))]),
    ]),
]

fit_to_audio(SCENES, __file__)
