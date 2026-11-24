"""API đáng tin: ETag và If-Match, webhook có chữ ký, thử lại và chống trùng, OpenAPI.

Every output comes from the lesson (web/src/data/lessons/api-reliability.ts), run on JDK 21:
two PUTs from the same version: both 200, B's name wins, A's change is lost;
with If-Match: A gets 200 (now v2), B gets 412 Precondition Failed (current "v2"), a PUT without If-Match gets 428;
HMAC-SHA256 over timestamp + "." + body, 5 minute window: valid accepted, paid -> refunded rejected (bad signature),
replay after 10 minutes rejected (timestamp outside 5 minute window), wrong secret rejected (bad signature);
backoff base 1 s, cap 60 s, jitter: 863, 1683, 2617, 5108, 13324, 30453 ms;
receiver with seen-set: 4 deliveries (evt_1 x3, evt_2 x1) apply 2 events.
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
               f'<b style="font-size:52px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=40, ds=28):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px;text-align:center">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def take(p, big, small):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(big), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(small), "take-sm r"))


SUMMARY = [("ETag", "If-Match: phiên bản đã đổi thì 412, thiếu thì 428"),
           ("Ký webhook", "HMAC-SHA256 trên mốc thời gian và body gốc"),
           ("Bên nhận", "so hằng thời gian · từ chối mốc thời gian quá cũ"),
           ("Thử lại", "backoff luỹ thừa có jitter · dead-letter"),
           ("Chống trùng", "lưu event id, bỏ qua bản trùng, trả 2xx nhanh"),
           ("OpenAPI", "hợp đồng của API · so sánh spec trong CI")]

BARS = [863, 1683, 2617, 5108, 13324, 30453]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "API · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("API đáng tin"), "h1 r", "font-size:120px"),
        card("hk-c0", 110, 440, 540, 280, "ETag và If-Match", "không ghi đè mất dữ liệu", "cyan", 38, 28),
        card("hk-c1", 690, 440, 540, 280, "Webhook", "ký, thử lại, chống trùng", "amber", 38, 28),
        card("hk-c2", 1270, 440, 540, 280, "OpenAPI", "tài liệu và hợp đồng", "violet", 38, 28),
        take("hk", "API đáng tin không ghi mù", "phát hiện xung đột · chứng minh nguồn gốc · chịu được gửi trùng"),
    ]), beats=[
        B("Bài này bổ sung cho bài REST. Khi nhiều người dùng và nhiều hệ thống cùng gọi, làm sao để API của bạn vẫn đáng tin?",
          "Làm sao để API đáng tin khi nhiều bên cùng gọi?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05)]),
        B("Có ba chặng. Một, E tag và If Match, để không ghi đè mất dữ liệu. Hai, webhook: ký để chứng minh nguồn gốc, rồi thử lại an toàn. Ba, OpenAPI, tài liệu và hợp đồng của API.",
          "ETag · Webhook · OpenAPI.",
          lambda w: [IN("#hk-c0", "pop", w("Một,")), IN("#hk-c1", "pop", w("Hai,")), IN("#hk-c2", "pop", w("Ba,"))]),
        B("Ý chung: phát hiện xung đột thay vì ghi đè im lặng, chứng minh nguồn gốc của yêu cầu, và chịu được việc cùng một sự kiện đến nhiều lần.",
          "Phát hiện xung đột, chứng minh nguồn gốc, chịu được gửi trùng.",
          lambda w: [OUT(S("hk-c0", "hk-c1", "hk-c2"), "blur", 0, 0.5), DIM(S("hk-eye", "hk-q"), 0, 0.07),
                     TYPE("#hk-t1", 0.9, 0.04), IN("#hk-t2", "blur", w("chứng minh"))]),
    ]),
    # ------------------------------------------------------------ etag
    dict(id="etag", world=(1920, 1080), hud="", cam="".join([
        head("et", "ETag và If-Match", "Không để ghi đè mất dữ liệu", 76),
        rule("et-rule", "PUT đơn giản: người lưu sau ghi đè im lặng", "Hai người cùng mở một đơn hàng rồi cùng lưu"),
        titled("et-a", 110, 280, 520, 170, "người A", "lưu từ bản v1", "", "amber", 36),
        titled("et-s", 700, 280, 520, 170, "server", "PUT /orders/1", "ghi đè", "violet", 36),
        titled("et-b", 1290, 280, 520, 170, "người B", "lưu từ bản v1", "", "amber", 36),
        tag("et-r1", 110, 520, 1700, 100, "A: 200 · B: 200 · tên cuối cùng là bản của B", "red", 34),
        bigerr("et-lost", 110, 670, 1700, "✕ Thay đổi của A mất mà không ai biết (lost update)", 34),
        cbox("et-code", 110, 290, 1700, "Client",
             "GET /orders/1      ->  ETag: \"v1\"\n"
             "PUT /orders/1\n"
             "If-Match: \"v1\"       // chỉ lưu nếu phiên bản hiện tại còn là v1", "violet", 30),
        tag("et-ra", 110, 580, 830, 100, "A: 200 OK (nay là v2)", "green", 32),
        tag("et-rb", 990, 580, 830, 100, "B: 412 Precondition Failed", "red", 30),
        note("et-reload", 110, 730, 1700, "✓ B tải lại bản v2 rồi mới quyết định, không ghi đè im lặng", "green", 34),
        card("et-c0", 110, 290, 830, 300, "412 Precondition Failed", "Có gửi If-Match nhưng phiên bản đã đổi", "red", 40, 30),
        card("et-c1", 990, 290, 830, 300, "428 Precondition Required", "Không gửi If-Match: server bắt buộc điều kiện", "amber", 40, 30),
        bigerr("et-trap", 110, 640, 1700, "✕ Chỉ phát ETag, không kiểm tra If-Match ở PUT: không chống được gì", 30),
        note("et-ver", 110, 760, 1700, "Kèm @Version ở database: nằm ngay trong câu UPDATE nên chặn được khe hở hai PUT cùng qua bước kiểm tra", "green", 30),
        take("et", "Phiên bản đã đổi thì 412", "GET nhận ETag → PUT gửi If-Match → 412 thì tải lại rồi quyết định"),
        wires(arrow("et-a1", [(635, 365), (695, 365)], "muted"), arrow("et-a2", [(1285, 365), (1225, 365)], "muted")),
    ]), beats=[
        B("Bài REST dùng PUT để thay cả resource. Nhưng hai người cùng mở một đơn hàng, cùng sửa rồi cùng bấm lưu thì chuyện gì xảy ra?",
          "PUT đơn giản: hai người cùng sửa một đơn.",
          lambda w: [IN("#et-eye", "blur"), TYPE("#et-q", 0.2, 0.05), IN("#et-rule", "up", w("Nhưng hai"))]),
        B("Đã chạy: cả hai đều nhận hai trăm OK, và tên cuối cùng là bản của người lưu sau. Thay đổi của A mất mà không ai biết. Đây là lost update.",
          "Cả hai nhận 200: thay đổi của A mất (lost update).",
          lambda w: [OUT("#et-rule", "blur", 0, 0.4), *shrink("et", 0), IN("#et-a", "up", 0.5), IN("#et-b", "up", 0.7), IN("#et-s", "up", 0.9),
                     *ARW("et-a1", 1.2, 0.4), *ARW("et-a2", 1.3, 0.4),
                     IN("#et-r1", "up", w("cả hai đều")), IN("#et-lost", "up", w("Thay đổi")), SHAKE("#et-lost", w("Đây là"))]),
        B("Lời giải là E tag, một nhãn phiên bản của resource. Server trả nó kèm khi GET. Client gửi lại trong header If Match khi PUT, nghĩa là chỉ lưu nếu phiên bản hiện tại vẫn là bản em đã đọc.",
          "GET nhận ETag, PUT gửi lại trong If-Match.",
          lambda w: [OUT(S("et-a", "et-s", "et-b", "et-r1", "et-lost") + ", " + AR("et-a1", "et-a2"), "blur", 0, 0.5),
                     IN("#et-code", "blur", 0.6, 0.7), PULSE("#et-code", w("Client gửi"))]),
        B("Đã chạy: A lưu trước, nhận hai trăm, và resource lên phiên bản v hai. B lưu sau, nhận bốn trăm mười hai Precondition Failed. B phải tải lại rồi quyết định.",
          "A nhận 200 (v2), B nhận 412: B tải lại rồi quyết định.",
          lambda w: [IN("#et-ra", "up", w("A lưu")), IN("#et-rb", "up", w("B lưu")), SHAKE("#et-rb", w("Precondition")), IN("#et-reload", "up", w("B phải"))]),
        B("Server còn có thể bắt buộc điều kiện này. Có header nhưng sai phiên bản thì bốn trăm mười hai. Thiếu hẳn header If Match thì bốn trăm hai mươi tám Precondition Required, để không ai ghi mù.",
          "412: phiên bản đã đổi. 428: thiếu If-Match.",
          lambda w: [OUT(S("et-code", "et-ra", "et-rb", "et-reload"), "blur", 0, 0.5),
                     IN("#et-c0", "up", w("Có header")), IN("#et-c1", "up", w("Thiếu hẳn"))]),
        B("Bẫy hay gặp: chỉ phát E tag mà quên kiểm tra If Match khi ghi thì không chống được gì. Hãy kiểm tra ở server, và kèm khoá lạc quan Version ở database. Nó nằm ngay trong câu UPDATE, nên chặn được khe hở hai PUT cùng qua bước kiểm tra.",
          "Kiểm tra If-Match ở server, kèm @Version ở database.",
          lambda w: [IN("#et-trap", "up", 0.3), SHAKE("#et-trap", w("không chống")), IN("#et-ver", "up", w("Hãy kiểm tra"))]),
        B("Nhớ chuỗi này: GET nhận E tag, PUT gửi lại trong If Match, phiên bản đã đổi thì bốn trăm mười hai, client tải lại rồi quyết định.",
          "Phiên bản đã đổi thì 412.",
          lambda w: [DIM(S("et-eye", "et-q", "et-c0", "et-c1", "et-trap", "et-ver"), 0, 0.07),
                     TYPE("#et-t1", 0.3, 0.04), IN("#et-t2", "blur", w("GET nhận"))]),
    ]),
    # ------------------------------------------------------------ webhook-sign
    dict(id="webhook-sign", world=(1920, 1080), hud="", cam="".join([
        head("ws", "Webhook", "Ký để chứng minh nguồn gốc"),
        rule("ws-rule", "Webhook: server của bạn gọi ngược về URL của khách", "Bên nhận phải biết: đến thật từ bạn, và chưa bị sửa"),
        titled("ws-s1", 110, 280, 390, 170, "nhận", "body + header", "", "cyan", 32),
        titled("ws-s2", 546, 280, 390, 170, "tính lại", "HMAC-SHA256", "", "violet", 32),
        titled("ws-s3", 982, 280, 390, 170, "so sánh", "hằng thời gian", "", "violet", 32),
        titled("ws-s4", 1418, 280, 390, 170, "kiểm tra", "mốc thời gian", "", "violet", 32),
        cbox("ws-code", 110, 500, 1700, "Bên nhận",
             "String sig = hmacSha256(secret, timestamp + \".\" + body);\n"
             "if (!MessageDigest.isEqual(expected, given)) reject;", "violet", 30),
        note("ws-n0", 110, 760, 1700, "Sửa body mà giữ nguyên chữ ký thì chữ ký tính lại không khớp", "green", 32),
        tag("ws-r0", 110, 290, 1700, 90, "Chữ ký đúng → accepted", "green", 28),
        tag("ws-r1", 110, 410, 1700, 90, "Sửa paid thành refunded → rejected: bad signature", "red", 28),
        tag("ws-r2", 110, 530, 1700, 90, "Phát lại sau 10 phút → rejected: timestamp outside 5 minute window", "red", 28),
        tag("ws-r3", 110, 650, 1700, 90, "Sai bí mật → rejected: bad signature", "red", 28),
        card("ws-c0", 110, 290, 830, 280, "String.equals", "dừng ở ký tự khác đầu tiên, có thể lộ thông tin qua thời gian phản hồi", "red", 40, 28),
        card("ws-c1", 990, 290, 830, 280, "MessageDigest.isEqual", "so sánh hằng thời gian", "green", 40, 28),
        note("ws-n1", 110, 620, 1700, "Ký trên chuỗi byte gốc của body, trước khi parse JSON · hỗ trợ xoay vòng bí mật", "green", 30),
        note("ws-n2", 110, 740, 1700, "Phát lại trong cửa sổ 5 phút vẫn qua: cần chống trùng theo event id", "amber", 30),
        take("ws", "Ký cả mốc thời gian và nội dung", "bên nhận tính lại và so sánh hằng thời gian"),
        wires(arrow("ws-a1", [(505, 365), (541, 365)], "muted"), arrow("ws-a2", [(941, 365), (977, 365)], "muted"),
              arrow("ws-a3", [(1377, 365), (1413, 365)], "muted")),
    ]), beats=[
        B("ETag bảo vệ khi client gọi vào API của bạn. Còn webhook là chiều ngược lại: server của bạn gọi về địa chỉ của khách khi có sự kiện, ví dụ thanh toán xong.",
          "Webhook: server gọi ngược về URL của khách.",
          lambda w: [IN("#ws-eye", "blur"), TYPE("#ws-q", 0.2, 0.05), IN("#ws-rule", "up", w("Còn webhook"))]),
        B("Bên nhận phải biết hai điều: yêu cầu đến thật từ bạn, và chưa bị sửa. Cách chuẩn là ký bằng HMAC SHA hai năm sáu với bí mật dùng chung, ký cả mốc thời gian và nội dung. Bên nhận lấy body và header, rồi làm ba bước: tính lại chữ ký, so sánh hằng thời gian, và kiểm tra mốc thời gian.",
          "Tính lại HMAC, so sánh hằng thời gian, kiểm tra mốc thời gian.",
          lambda w: [OUT("#ws-rule", "blur", w("Bên nhận lấy") - 0.5, 0.4), *shrink("ws", w("Bên nhận lấy") - 0.5), IN("#ws-s1", "up", w("Bên nhận lấy")),
                     *ARW("ws-a1", w("làm ba") - 0.3, 0.3), IN("#ws-s2", "up", w("tính lại")),
                     *ARW("ws-a2", w("so sánh") - 0.3, 0.3), IN("#ws-s3", "up", w("so sánh")),
                     *ARW("ws-a3", w("kiểm tra mốc") - 0.3, 0.3), IN("#ws-s4", "up", w("kiểm tra mốc"))]),
        B("Chữ ký tính trên mốc thời gian, dấu chấm, rồi body gốc. So sánh bằng Message Digest chấm is Equal. Sửa body mà giữ nguyên chữ ký thì chữ ký tính lại sẽ không khớp.",
          "Chữ ký tính trên timestamp + \".\" + body.",
          lambda w: [IN("#ws-code", "blur", 0.2, 0.7), PULSE("#ws-code", w("So sánh")), IN("#ws-n0", "up", w("Sửa body"))]),
        B("Đã chạy: chữ ký đúng thì accepted. Sửa paid thành refunded thì rejected vì sai chữ ký. Phát lại sau mười phút bị từ chối vì mốc thời gian ngoài cửa sổ năm phút. Sai bí mật cũng bị từ chối.",
          "Đúng thì accepted; sửa, phát lại, sai bí mật đều bị từ chối.",
          lambda w: [OUT(S("ws-s1", "ws-s2", "ws-s3", "ws-s4", "ws-code", "ws-n0") + ", " + AR("ws-a1", "ws-a2", "ws-a3"), "blur", 0, 0.5),
                     IN("#ws-r0", "up", w("chữ ký đúng")), IN("#ws-r1", "up", w("Sửa paid")),
                     IN("#ws-r2", "up", w("Phát lại")), IN("#ws-r3", "up", w("Sai bí mật"))]),
        B("Có hai bẫy. Một, so chữ ký bằng String equals dừng ở ký tự khác đầu tiên, có thể lộ thông tin qua thời gian phản hồi, nên dùng Message Digest is Equal. Hai, phải ký trên chuỗi byte gốc của body trước khi parse JSON, vì parse rồi serialize lại có thể đổi thứ tự hay khoảng trắng.",
          "equals lộ qua thời gian: dùng isEqual. Ký trên byte gốc.",
          lambda w: [OUT(S("ws-r0", "ws-r1", "ws-r2", "ws-r3"), "blur", w("Một,") - 0.6, 0.5),
                     IN("#ws-c0", "up", w("Một,")), IN("#ws-c1", "up", w("nên dùng")), IN("#ws-n1", "up", w("Hai,"))]),
        B("Phát lại ngay trong cửa sổ năm phút thì vẫn qua bước này, nên cần chống trùng theo event id ở phần sau. Nhớ: chữ ký chứng minh nguồn gốc và nội dung, mốc thời gian chặn phát lại.",
          "Chữ ký: nguồn gốc và nội dung. Mốc thời gian: chặn phát lại.",
          lambda w: [IN("#ws-n2", "up", 0.3),
                     DIM(S("ws-eye", "ws-q", "ws-c0", "ws-c1", "ws-n1", "ws-n2"), w("Nhớ:"), 0.07),
                     TYPE("#ws-t1", w("Nhớ:") + 0.2, 0.04), IN("#ws-t2", "blur", w("mốc thời gian chặn"))]),
    ]),
    # ------------------------------------------------------------ webhook-retry
    dict(id="webhook-retry", world=(1920, 1080), hud="", cam="".join([
        head("wr", "Webhook", "Thử lại và chống trùng"),
        rule("wr-rule", "Bên nhận tạm lỗi thì bên gửi phải thử lại", "Nên cùng một sự kiện có thể đến nhiều lần"),
        card("wr-x0", 110, 290, 830, 300, "Thử lại dồn dập", "mọi bên cùng gửi lại một lúc: bên nhận càng khó hồi phục", "red", 40, 30),
        card("wr-x1", 990, 290, 830, 300, "Xử lý lặp", "nhận hai lần là cộng tiền hai lần", "red", 40, 30),
        cbox("wr-code", 110, 270, 1700, "Backoff có jitter",
             "delay = random(ceiling / 2, ceiling)\n"
             "// ceiling = min(cap, base * 2^attempt)", "violet", 30),
        *[box(f"wr-b{i}", 110 + i * 290, 820 - (50 + round(v / 30453 * 250)), 250, 50 + round(v / 30453 * 250),
              f'<span class="mono" style="font-size:28px;font-weight:600;text-align:center">{v} ms</span>', "cyan")
          for i, v in enumerate(BARS)],
        note("wr-bn", 110, 850, 1700, "Gốc 1s, trần 60s: tăng dần và có ngẫu nhiên nên các bên không đồng loạt dồn vào cùng lúc", "green", 28),
        cbox("wr-id", 110, 270, 1700, "Bên nhận idempotent",
             "void handle(String id) { if (!seen.add(id)) return; applyPayment(id); }", "violet", 28),
        titled("wr-e0", 110, 480, 395, 170, "lần 1", "evt_1", "áp dụng", "green", 40),
        titled("wr-e1", 545, 480, 395, 170, "lần 2", "evt_1", "duplicate ignored", "amber", 40),
        titled("wr-e2", 980, 480, 395, 170, "lần 3", "evt_1", "duplicate ignored", "amber", 40),
        titled("wr-e3", 1415, 480, 395, 170, "lần 4", "evt_2", "áp dụng", "green", 40),
        tag("wr-tot", 110, 710, 1700, 100, "4 lần nhận, áp dụng đúng 2 sự kiện", "green", 34),
        card("wr-k0", 110, 290, 540, 300, "Restart", "mất danh sách đã thấy", "red", 40, 28),
        card("wr-k1", 690, 290, 540, 300, "Nhiều instance", "mỗi instance một Set riêng, không thấy của nhau", "red", 38, 28),
        card("wr-k2", 1270, 290, 550, 300, "Thứ tự sai", "seen.add chạy trước applyPayment: apply lỗi thì sự kiện bị bỏ luôn", "red", 40, 26),
        note("wr-n1", 110, 640, 1700, "Production: bảng có unique key cho event id, ghi cùng transaction với thay đổi thanh toán", "green", 30),
        note("wr-n2", 110, 770, 1700, "Nhiều lần thất bại: dead-letter để xem tay · trả 2xx nhanh rồi xử lý ở nền", "green", 30),
        take("wr", "Thử lại nhẹ nhàng, nhận idempotent", "backoff có jitter · lưu event id · dead-letter"),
    ]), beats=[
        B("Chữ ký cho biết yêu cầu là thật, nhưng chưa nói gì về chuyện gửi thất bại. Bên nhận có thể tạm lỗi, nên bên gửi phải thử lại. Và vì thử lại, cùng một sự kiện có thể đến nhiều lần.",
          "Thử lại nghĩa là sự kiện có thể đến nhiều lần.",
          lambda w: [IN("#wr-eye", "blur"), TYPE("#wr-q", 0.2, 0.05), IN("#wr-rule", "up", w("Bên nhận có"))]),
        B("Làm sai thì có hai hậu quả. Thử lại ngay liên tục, mọi bên cùng dồn tải vào hệ thống đang ốm, nó càng khó hồi phục. Và nếu bên nhận không chống trùng, nhận hai lần là cộng tiền hai lần.",
          "Thử lại dồn dập và xử lý lặp.",
          lambda w: [OUT("#wr-rule", "blur", 0, 0.4), *shrink("wr", 0), IN("#wr-x0", "up", w("Thử lại ngay")), IN("#wr-x1", "up", w("Và nếu")),
                     SHAKE("#wr-x1", w("cộng tiền"))]),
        B("Cách đúng thứ nhất là backoff luỹ thừa có jitter. Trần chờ là cái nhỏ hơn giữa cap và base nhân hai mũ số lần thử, rồi chờ ngẫu nhiên trong nửa trên của trần. Đã chạy với gốc một giây, trần sáu mươi giây: các lần chờ khoảng tám trăm sáu mươi ba, một nghìn sáu trăm tám mươi ba, hai nghìn sáu trăm mười bảy, năm nghìn một trăm lẻ tám, mười ba nghìn ba trăm hai mươi bốn, và ba mươi nghìn bốn trăm năm mươi ba mili giây. Tăng dần và có ngẫu nhiên, nên các bên không đồng loạt dồn vào cùng một lúc.",
          "Backoff luỹ thừa có jitter: các lần chờ tăng dần.",
          lambda w: [OUT(S("wr-x0", "wr-x1"), "blur", 0, 0.5), IN("#wr-code", "blur", 0.6, 0.7),
                     IN("#wr-b0", "up", w("tám trăm sáu")), IN("#wr-b1", "up", w("một nghìn sáu")), IN("#wr-b2", "up", w("hai nghìn sáu")),
                     IN("#wr-b3", "up", w("năm nghìn một")), IN("#wr-b4", "up", w("mười ba nghìn")), IN("#wr-b5", "up", w("ba mươi nghìn")),
                     IN("#wr-bn", "up", w("Tăng dần"))]),
        B("Cách đúng thứ hai là bên nhận idempotent: lưu event id đã xử lý và bỏ qua bản trùng. Đã chạy với bốn lần nhận: evt một ba lần, evt hai một lần. Chỉ lần đầu của evt một được xử lý, hai lần gửi lại bị bỏ qua, tổng cộng áp dụng đúng hai sự kiện.",
          "4 lần nhận, chỉ áp dụng 2 sự kiện.",
          lambda w: [OUT(S("wr-code", "wr-bn", *[f"wr-b{i}" for i in range(6)]), "blur", 0, 0.5), IN("#wr-id", "blur", 0.6, 0.7),
                     IN("#wr-e0", "up", w("Đã chạy")), IN("#wr-e1", "up", w("ba lần") + 0.3), IN("#wr-e2", "up", w("ba lần") + 0.7),
                     IN("#wr-e3", "up", w("evt hai")), IN("#wr-tot", "up", w("tổng cộng"))]),
        B("Nhưng đừng chép đoạn dùng Set trong bộ nhớ vào production. Khi restart thì mất danh sách đã thấy. Nhiều instance thì mỗi instance một Set riêng. Và seen add chạy trước apply Payment, nên apply lỗi thì sự kiện bị bỏ luôn.",
          "Set trong bộ nhớ: mất khi restart, không chia sẻ, sai thứ tự.",
          lambda w: [OUT(S("wr-id", "wr-e0", "wr-e1", "wr-e2", "wr-e3", "wr-tot"), "blur", w("Khi restart") - 0.6, 0.5),
                     IN("#wr-k0", "up", w("Khi restart")), IN("#wr-k1", "up", w("Nhiều instance")), IN("#wr-k2", "up", w("Và seen"))]),
        B("Production lưu event id vào một bảng có unique key, ghi cùng transaction với thay đổi thanh toán. Sau nhiều lần thất bại thì đưa sự kiện vào dead letter để xem tay. Và trả hai trăm ngay rồi xử lý ở nền, vì xử lý nặng trong request làm bên gửi tưởng bạn lỗi rồi gửi lại.",
          "Bảng unique key cùng transaction · dead-letter · trả 2xx nhanh.",
          lambda w: [IN("#wr-n1", "up", 0.3), IN("#wr-n2", "up", w("Sau nhiều"))]),
        B("Nhớ chuỗi: bên nhận tạm lỗi, bên gửi thử lại với backoff, cùng sự kiện đến nhiều lần, bên nhận chống trùng theo event id.",
          "Thử lại với backoff, chống trùng theo event id.",
          lambda w: [DIM(S("wr-eye", "wr-q", "wr-k0", "wr-k1", "wr-k2", "wr-n1", "wr-n2"), 0, 0.07),
                     TYPE("#wr-t1", 0.3, 0.04), IN("#wr-t2", "blur", w("bên gửi"))]),
    ]),
    # ------------------------------------------------------------ openapi
    dict(id="openapi", world=(1920, 1080), hud="", cam="".join([
        head("oa", "OpenAPI", "Tài liệu và hợp đồng của API", 80),
        rule("oa-rule", "OpenAPI mô tả API bằng một file chuẩn", "YAML hoặc JSON: đường dẫn, tham số, kiểu dữ liệu, mã lỗi"),
        card("oa-c0", 110, 290, 830, 280, "Sinh từ code (springdoc)", "Nhanh và luôn khớp code, nhưng hợp đồng bị code quyết định", "cyan", 38, 28),
        card("oa-c1", 990, 290, 830, 280, "Hợp đồng trước (contract-first)", "Viết spec rồi sinh code: spec là nguồn sự thật", "violet", 36, 28),
        card("oa-c2", 110, 620, 540, 290, "So sánh spec trong CI", "openapi-diff bắt xoá field, đổi kiểu, đổi mã lỗi", "amber", 34, 28),
        card("oa-c3", 690, 620, 540, 290, "Mô tả lỗi", "400, 401, 403, 404, 409, 429 và ProblemDetail", "cyan", 36, 28),
        card("oa-c4", 1270, 620, 550, 290, "Bảo mật trong spec", "Bearer JWT, OAuth2 · không đưa bí mật thật vào ví dụ", "green", 36, 28),
        take("oa", "Hợp đồng viết ra giấy", "sinh từ code hay viết trước · luôn so sánh spec trong CI"),
    ]), beats=[
        B("Cuối cùng là OpenAPI. ETag và webhook giữ dữ liệu đúng, còn để người khác biết gọi API thế nào thì cần một hợp đồng viết ra giấy. OpenAPI mô tả API bằng một file chuẩn, YAML hoặc JSON: đường dẫn, tham số, kiểu dữ liệu và mã lỗi.",
          "OpenAPI: hợp đồng của API viết ra giấy.",
          lambda w: [IN("#oa-eye", "blur"), TYPE("#oa-q", 0.2, 0.05), IN("#oa-rule", "up", w("OpenAPI mô tả"))]),
        B("Có hai cách làm ra spec. Cách một là sinh từ code. Với Spring Boot dùng springdoc openapi: nó đọc controller và DTO để sinh OpenAPI và giao diện Swagger UI. Nhanh và luôn khớp code, nhưng hợp đồng bị code quyết định.",
          "springdoc: nhanh, luôn khớp code.",
          lambda w: [OUT("#oa-rule", "blur", 0, 0.4), *shrink("oa", 0), IN("#oa-c0", "up", w("Cách một"))]),
        B("Cách hai là hợp đồng trước, contract first. Viết file OpenAPI trước, thống nhất với nhóm frontend và đối tác, rồi dùng openapi generator sinh interface hay client. Hợp đồng là nguồn sự thật, code phải theo, và nhiều nhóm làm song song được.",
          "Contract-first: spec là nguồn sự thật.",
          lambda w: [IN("#oa-c1", "up", w("Cách hai"))]),
        B("Dù chọn cách nào, hãy đưa bước so sánh hai phiên bản spec vào CI, ví dụ openapi diff, để phát hiện thay đổi phá vỡ như xoá field, đổi kiểu hay đổi mã lỗi, trước khi lên production.",
          "So sánh spec trong CI để bắt thay đổi phá vỡ.",
          lambda w: [IN("#oa-c2", "up", w("hãy đưa"))]),
        B("Khai báo rõ các mã trả về như bốn trăm, bốn trăm linh một, bốn trăm linh ba, bốn trăm linh bốn, bốn trăm linh chín và bốn trăm hai mươi chín, cùng dạng lỗi thống nhất Problem Detail, để client xử lý đúng.",
          "Khai báo mã lỗi và ProblemDetail.",
          lambda w: [IN("#oa-c3", "up", 0.3)]),
        B("Và khai báo security scheme như Bearer JWT hay OAuth hai trong spec, để tài liệu và client sinh ra biết cách gửi token. Không đưa bí mật thật vào ví dụ.",
          "Khai báo security scheme, không đưa bí mật thật vào ví dụ.",
          lambda w: [IN("#oa-c4", "up", 0.3)]),
        B("Tóm lại: spec là hợp đồng viết ra giấy. Sinh từ code thì nhanh, viết trước thì làm song song được, và luôn so sánh spec trong CI.",
          "Hợp đồng viết ra giấy, luôn so sánh trong CI.",
          lambda w: [DIM(S("oa-eye", "oa-q", "oa-c0", "oa-c1", "oa-c2", "oa-c3", "oa-c4"), 0, 0.07),
                     TYPE("#oa-t1", 0.3, 0.04), IN("#oa-t2", "blur", w("Sinh từ code"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 105, 1660, 88, row(k, t), "cyan", "row") for i, (k, t) in enumerate(SUMMARY)],
        el("ou-cta", 0, 900, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Chống ghi đè mất dữ liệu bằng E tag và If Match: phiên bản đã đổi thì bốn trăm mười hai, thiếu điều kiện thì bốn trăm hai mươi tám.",
          "ETag và If-Match: 412 và 428.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "left", w("Chống ghi"))]),
        B("Webhook ký HMAC SHA hai năm sáu trên mốc thời gian và body gốc. Bên nhận tính lại, so sánh hằng thời gian, và từ chối mốc thời gian quá cũ.",
          "Ký webhook và kiểm tra ở bên nhận.",
          lambda w: [IN("#ou-r1", "left", 0.2), IN("#ou-r2", "left", w("tính lại"))]),
        B("Bên gửi thử lại với backoff luỹ thừa có jitter và dead letter. Bên nhận idempotent bằng cách lưu event id, và trả hai trăm nhanh. OpenAPI là hợp đồng của API, nhớ so sánh spec trong CI.",
          "Thử lại, chống trùng, OpenAPI.",
          lambda w: [IN("#ou-r3", "left", 0.2), IN("#ou-r4", "left", w("Bên nhận idempotent")), IN("#ou-r5", "left", w("OpenAPI là"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
