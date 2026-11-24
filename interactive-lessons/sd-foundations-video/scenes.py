"""System foundations and cloud explainer: back-to-basics backend interview questions.

Source: web/src/data/lessons/sd-foundations.ts. The lesson is conceptual and claims no measured performance numbers.
Facts kept from it: async returns 202 Accepted with an order id; short polling e.g. every 5 seconds;
99.9% availability is about 8.76 hours of downtime a year, 99.99% about 52.6 minutes;
readiness fail -> Pod removed from the Service -> endpoints empty -> 503; 502 upstream answered wrongly, 504 too slow;
three tiers each retrying 3 times -> 3 x 3 x 3 = 27 calls to the weak system.
No glows, comets or travelling lights: arrows are drawn and their heads pop in, nothing more.
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


def GO(id_, d=0.0, dur=0.5):
    """Draw an arrow line, then pop its head (no travelling light)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def tag(id_, x, y, w, h, text, tone="cyan", size=32):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text)}</span>', tone)


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=42, ds=28, extra=""):
    ex = f'<span style="font-size:{ds}px;color:var(--green);text-align:center;line-height:1.35">{esc(extra)}</span>' if extra else ""
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b>'
               f'<span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>{ex}', tone, "card")


def cardov(id_, x, y, w, h, title, desc, tone="cyan", ts=42, ds=28):
    """card() for a row that is faded out before a later group takes its place."""
    return el(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b>'
              f'<span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>',
              f"gbox {tone} card r", "", " data-layout-allow-overlap")


def note(id_, x, y, w, text, tone="green", size=34, align="center"):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} r", f"font-size:{size}px;line-height:1.35;text-align:{align}")


def lbl(id_, x, y, w, text, size=26):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), "lbl r", f"font-size:{size}px;line-height:1.3")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35;text-align:center")


def row(label, text):
    return (f'<span class="mono big" style="font-size:34px">{esc(label)}</span>'
            f'<span style="font-size:30px;color:var(--muted)">{esc(text)}</span>')


def take(p, main, sub, y=400):
    return (el(f"{p}-t1", 0, y, 1920, None, letters(main), "take r")
            + el(f"{p}-t2", 0, y + 140, 1920, None, esc(sub), "take-sm r"))


def panel(id_, x, y, w, h, tone):
    """A dashed area that groups the boxes laid on top of it (a subnet)."""
    return el(id_, x, y, w, h, "", f"gbox {tone} dash r", "", " data-layout-allow-overlap")


TOPICS = ["Sync · async · push", "Đường đi request", "Resiliency · HA · scale", "Subnet · storage",
          "Kubernetes · 503", "Traffic tăng vọt", "Trả lời kiểu tech lead"]
INST = [f"hk-i{i}" for i in range(10)]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Nền tảng hệ thống và Cloud · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 220, 1920, None, letters("10 instance, vẫn đơ cả 10?"), "h1 r", "font-size:96px"),
        tag("hk-lb", 110, 470, 300, 110, "Load balancer", "violet", 32),
        *[tag(f"hk-i{i}", 560 + (i % 5) * 140, 430 + (i // 5) * 110, 120, 80, f"#{i + 1}", "amber", 28) for i in range(10)],
        tag("hk-pay", 1450, 470, 360, 110, "payment chậm", "red", 34),
        el("hk-st", 610, 730, 700, None, "Thiếu: resiliency", "stamp green r", "font-size:40px"),
        *[tag(f"hk-c{i}", 115 + i * 430, 420, 400, 110, t, "cyan", 30) for i, t in enumerate(TOPICS[:4])],
        *[tag(f"hk-c{i + 4}", 330 + i * 430, 570, 400, 110, t, "cyan", 30) for i, t in enumerate(TOPICS[4:])],
        wires(arrow("hk-a1", [(410, 525), (548, 525)], "violet"), arrow("hk-a2", [(1260, 525), (1442, 525)], "red")),
    ]), beats=[
        B("Hệ thống có mười instance sau load balancer, nhưng một dịch vụ payment chậm làm cả mười instance đều đơ. Thiếu tính chất nào?",
          "10 instance sau load balancer, payment chậm làm cả 10 đơ. Thiếu gì?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.2, 0.05), IN("#hk-lb", "pop", w("load balancer")),
                     *GO("hk-a1", w("load balancer") + 0.4), IN(S(*INST), "pop", w("load balancer") + 0.8, 0.4, 0.06),
                     IN("#hk-pay", "pop", w("payment")), *GO("hk-a2", w("payment") + 0.3),
                     SHAKE(S(*INST), w("đều đơ"))]),
        B("Không phải scalability, cũng không phải high availability. Thiếu resiliency: gọi payment không có timeout hay circuit breaker thì lỗi lan ra mọi instance.",
          "Không phải scale hay HA. Thiếu resiliency: không timeout, không circuit breaker.",
          lambda w: [IN("#hk-st", "stamp", w("Thiếu resiliency")), PULSE("#hk-pay", w("lỗi lan"))]),
        B("Video này đi qua bảy câu hỏi nền tảng: sync và push, đường đi của request, ba từ hay nhầm, cloud, Kubernetes, traffic tăng vọt, và cách trả lời kiểu tech lead.",
          "7 câu hỏi back-to-basics cho backend.",
          lambda w: [OUT(S("hk-eye", "hk-q", "hk-lb", "hk-pay", "hk-st", *INST) + ", " + AR("hk-a1", "hk-a2"), "blur", 0, 0.5),
                     IN("#hk-c0", "pop", w("sync và push")), IN("#hk-c1", "pop", w("đường đi")), IN("#hk-c2", "pop", w("ba từ")),
                     IN("#hk-c3", "pop", w("cloud")), IN("#hk-c4", "pop", w("Kubernetes")), IN("#hk-c5", "pop", w("traffic")),
                     IN("#hk-c6", "pop", w("cách trả lời"))]),
    ]),
    # ------------------------------------------------------------ sync, async, polling, push
    dict(id="sync-async-polling", world=(1920, 1080), hud="", cam="".join([
        head("sa", "Phần 1 · Sync, async, polling và push", "Chờ kết quả hay nhận sau?"),
        lbl("sa-l1", 110, 215, 400, "Sync", 30),
        tag("sa-o1", 110, 260, 300, 110, "Order", "amber", 34),
        tag("sa-p1", 700, 260, 300, 110, "Payment", "cyan", 34),
        lbl("sa-w1", 410, 270, 290, "đứng chờ", 26),
        note("sa-n1", 1080, 280, 740, "✕ Payment chậm thì Order chậm theo", "red", 32, "left"),
        lbl("sa-l2", 110, 425, 400, "Async", 30),
        tag("sa-o2", 110, 470, 300, 110, "Order", "amber", 34),
        tag("sa-qu", 540, 470, 260, 110, "Queue", "violet", 34),
        tag("sa-p2", 930, 470, 300, 110, "Payment", "cyan", 34),
        el("sa-202", 110, 615, None, None, "202 Accepted + mã đơn", "chip green r"),
        note("sa-n2", 1300, 490, 520, "xử lý lúc nó rảnh", "green", 32, "left"),
        note("sa-n3", 160, 760, 1600, "Sync / async: cách hai bên phối hợp · Blocking: thread có bị giữ lại không", "amber", 32),
        card("sa-c0", 110, 240, 400, 300, "Short polling", "client hỏi lặp, ví dụ mỗi 5 giây; phần lớn rỗng", "cyan", 40, 28),
        card("sa-c1", 543, 240, 400, 300, "Long polling", "server giữ request tới khi có dữ liệu mới", "cyan", 40, 28),
        card("sa-c2", 976, 240, 400, 300, "SSE", "server đẩy một chiều, chạy trên HTTP", "violet", 40, 28),
        card("sa-c3", 1409, 240, 400, 300, "WebSocket", "hai chiều, hợp chat và game", "violet", 40, 28),
        lbl("sa-g1", 110, 570, 833, "client hỏi (polling)", 32),
        lbl("sa-g2", 976, 570, 833, "server đẩy (push)", 32),
        take("sa", "Thưa thì polling, tức thì thì push", "độ trễ chấp nhận được · số client cùng chờ"),
        wires(arrow("sa-a1", [(410, 315), (692, 315)], "amber"),
              arrow("sa-a2", [(410, 525), (532, 525)], "amber"), arrow("sa-a3", [(800, 525), (922, 525)], "violet"),
              arrow("sa-a4", [(260, 580), (260, 608)], "green")),
    ]), beats=[
        B("Sync là bên gọi gửi yêu cầu rồi đứng chờ kết quả. Order gọi Payment và chờ, nên Payment chậm thì Order cũng chậm theo.",
          "Sync: bên gọi đứng chờ kết quả.",
          lambda w: [IN("#sa-eye", "blur"), TYPE("#sa-q", 0.2, 0.05), *shrink("sa", w("Order gọi") - 0.6),
                     IN("#sa-l1", "fade", w("Order gọi")), IN("#sa-o1", "pop", w("Order gọi")), *GO("sa-a1", w("Payment và") - 0.3, 0.6),
                     IN("#sa-w1", "fade", w("và chờ")), IN("#sa-p1", "pop", w("Payment và")), IN("#sa-n1", "left", w("nên Payment")),
                     SHAKE("#sa-o1", w("chậm theo"))]),
        B("Async là gửi xong rồi đi làm việc khác. Order ghi một message vào queue, trả ngay cho khách hai trăm lẻ hai Accepted kèm mã đơn, còn Payment xử lý lúc nó rảnh.",
          "Async: ghi vào queue, trả 202 Accepted ngay, Payment xử lý sau.",
          lambda w: [IN("#sa-l2", "fade", 0.3), IN("#sa-o2", "pop", w("Order ghi")), *GO("sa-a2", w("message")), IN("#sa-qu", "pop", w("vào queue")),
                     *GO("sa-a4", w("trả ngay"), 0.3), IN("#sa-202", "pop", w("hai trăm")),
                     *GO("sa-a3", w("còn Payment")), IN("#sa-p2", "pop", w("còn Payment") + 0.4), IN("#sa-n2", "left", w("lúc nó rảnh"))]),
        B("Đừng nhầm với blocking. Sync và async nói về cách hai bên phối hợp, còn blocking nói về việc thread có bị giữ lại trong lúc chờ hay không.",
          "Đừng nhầm với blocking: đó là chuyện thread có bị giữ hay không.",
          lambda w: [IN("#sa-n3", "up", 0.3), PULSE("#sa-n3", w("còn blocking"))]),
        B("Dữ liệu mới có thể xuất hiện bất kỳ lúc nào, vậy client biết bằng cách nào? Short polling hỏi lặp lại, ví dụ mỗi năm giây, phần lớn request là rỗng. Long polling thì server giữ request mở tới khi có dữ liệu mới rồi mới trả.",
          "Short polling hỏi lặp · Long polling: server giữ request tới khi có dữ liệu.",
          lambda w: [OUT(S("sa-l1", "sa-o1", "sa-p1", "sa-w1", "sa-n1", "sa-l2", "sa-o2", "sa-qu", "sa-p2", "sa-202", "sa-n2", "sa-n3")
                         + ", " + AR("sa-a1", "sa-a2", "sa-a3", "sa-a4"), "blur", 0, 0.5),
                     IN("#sa-c0", "pop", w("Short polling")), IN("#sa-c1", "pop", w("Long polling")), IN("#sa-g1", "fade", w("Long polling") + 1.0)]),
        B("Push là server chủ động đẩy qua một kết nối giữ mở. SSE đẩy một chiều, chạy trên HTTP. WebSocket hai chiều, hợp chat và game.",
          "Push: SSE một chiều, WebSocket hai chiều.",
          lambda w: [IN("#sa-c2", "pop", w("SSE")), IN("#sa-c3", "pop", w("WebSocket")), IN("#sa-g2", "fade", w("WebSocket") + 0.8)]),
        B("Chọn theo hai yếu tố: dữ liệu cần tới nhanh cỡ nào, và bao nhiêu client cùng chờ. Cập nhật thưa thì polling đủ và rẻ. Cần gần thời gian thực thì push, đổi lại phải gánh rất nhiều kết nối mở.",
          "Thưa thì polling, cần tức thì thì push (đổi lại nhiều kết nối mở).",
          lambda w: [DIM(S("sa-eye", "sa-q", "sa-c0", "sa-c1", "sa-c2", "sa-c3", "sa-g1", "sa-g2"), 0, 0.07),
                     TYPE("#sa-t1", w("Cập nhật thưa") - 0.4, 0.04), IN("#sa-t2", "blur", w("Cần gần"))]),
    ]),
    # ------------------------------------------------------------ request path and proxies
    dict(id="request-path", world=(1920, 1080), hud="", cam="".join([
        head("rp", "Phần 2 · Đường đi của một request", "Request đi qua những layer nào?"),
        *[tag(f"rp-n{i}", 100 + i * 250, 300, 220, 110, t, tone, 30) for i, (t, tone) in enumerate(
            [("DNS", "violet"), ("CDN", "violet"), ("Load balancer", "amber"), ("Gateway", "amber"), ("App", "cyan"), ("Cache", "green"), ("DB", "green")])],
        *[lbl(f"rp-d{i}", 100 + i * 250, 435, 220, t, 25) for i, t in enumerate(
            ["tên miền\nthành IP", "nội dung tĩnh\ntrả luôn", "chia tải\nhealth check", "route, xác thực\nrate limit",
             "controller\nservice, repo", "hit thì\ntrả luôn", "dữ liệu thật"])],
        note("rp-n", 160, 620, 1600, "Càng đi sâu càng đắt: cache và CDN ở ngoài cùng là rẻ nhất", "green", 36),
        lbl("rp-r", 110, 220, 820, "Reverse proxy: đứng trước server", 36),
        tag("rp-rc", 110, 470, 200, 100, "Client", "cyan", 30),
        tag("rp-rp", 400, 470, 220, 100, "Proxy", "violet", 32),
        *[tag(f"rp-rs{i}", 720, 340 + i * 130, 210, 100, f"server {i + 1}", "amber", 28) for i in range(3)],
        lbl("rp-r2", 110, 740, 820, "Nginx, load balancer, API gateway", 30),
        lbl("rp-f", 990, 220, 820, "Forward proxy: đứng trước client", 36),
        *[tag(f"rp-fc{i}", 990, 400 + i * 140, 210, 100, f"client {i + 1}", "cyan", 28) for i in range(2)],
        tag("rp-fp", 1290, 470, 220, 100, "Proxy", "amber", 32),
        tag("rp-fi", 1600, 470, 210, 100, "Internet", "violet", 30),
        lbl("rp-f2", 990, 740, 820, "bên ngoài chỉ thấy địa chỉ proxy", 30),
        take("rp", "Reverse đại diện server", "forward proxy đại diện client · ví dụ proxy lọc web của công ty"),
        wires(*[arrow(f"rp-a{i}", [(320 + i * 250, 355), (342 + i * 250, 355)], "muted") for i in range(6)],
              arrow("rp-b0", [(310, 520), (392, 520)], "cyan"),
              *[arrow(f"rp-b{i + 1}", [(620, 520), (712, 390 + i * 130)], "violet") for i in range(3)],
              *[arrow(f"rp-c{i}", [(1200, 450 + i * 140), (1282, 520)], "cyan") for i in range(2)],
              arrow("rp-c2", [(1510, 520), (1592, 520)], "amber")),
    ]), beats=[
        B("Câu hỏi này kiểm tra bạn có hình dung được toàn bộ đường đi, để khi chậm hay lỗi thì biết tìm ở đâu. Đi từ ngoài vào trong.",
          "Biết đường đi thì biết tìm lỗi ở đâu.",
          lambda w: [IN("#rp-eye", "blur"), TYPE("#rp-q", 0.2, 0.05), *shrink("rp", w("Đi từ"))]),
        B("DNS đổi tên miền thành địa chỉ IP. CDN trả ngay nội dung tĩnh từ máy gần người dùng. Load balancer chia request cho nhiều instance và health check để bỏ instance hỏng.",
          "DNS · CDN · Load balancer.",
          lambda w: [IN("#rp-n0", "pop", 0.1), IN("#rp-d0", "fade", 0.5), *GO("rp-a0", w("CDN") - 0.4, 0.3),
                     IN("#rp-n1", "pop", w("CDN")), IN("#rp-d1", "fade", w("CDN") + 0.5), *GO("rp-a1", w("Load balancer") - 0.4, 0.3),
                     IN("#rp-n2", "pop", w("Load balancer")), IN("#rp-d2", "fade", w("Load balancer") + 0.5)]),
        B("API gateway định tuyến tới đúng service, xác thực, rate limit. Application đi qua controller, service, repository. Cache có dữ liệu thì trả luôn, không thì xuống database.",
          "Gateway · App · Cache · Database.",
          lambda w: [*GO("rp-a2", 0, 0.3), IN("#rp-n3", "pop", 0.2), IN("#rp-d3", "fade", 0.6),
                     *GO("rp-a3", w("Application") - 0.4, 0.3), IN("#rp-n4", "pop", w("Application")), IN("#rp-d4", "fade", w("Application") + 0.5),
                     *GO("rp-a4", w("Cache") - 0.4, 0.3), IN("#rp-n5", "pop", w("Cache")), IN("#rp-d5", "fade", w("Cache") + 0.5),
                     *GO("rp-a5", w("xuống database") - 0.3, 0.3), IN("#rp-n6", "pop", w("xuống database")), IN("#rp-d6", "fade", w("xuống database") + 0.4)]),
        B("Mỗi layer có thể là chỗ chậm hoặc lỗi riêng. Request càng đi sâu càng đắt, nên cache và CDN ở ngoài cùng là rẻ nhất.",
          "Mỗi layer là một chỗ có thể chậm. Đi sâu càng đắt.",
          lambda w: [PULSE(S(*[f"rp-n{i}" for i in range(7)]), 0.3), IN("#rp-n", "up", w("Request càng")), PULSE("#rp-n1, #rp-n5", w("nên cache"))]),
        B("Hai thứ hay bị nhầm: reverse proxy và forward proxy. Reverse proxy đứng trước server. Client gọi proxy mà không biết phía sau có bao nhiêu server. Nginx, load balancer và API gateway đều làm vai này.",
          "Reverse proxy: đứng trước server, che server thật.",
          lambda w: [OUT(S(*[f"rp-n{i}" for i in range(7)], *[f"rp-d{i}" for i in range(7)], "rp-n") + ", " + AR(*[f"rp-a{i}" for i in range(6)]), "blur", 0, 0.5),
                     IN("#rp-r", "fade", w("Reverse proxy đứng")), IN("#rp-rc", "pop", w("Client gọi")), *GO("rp-b0", w("Client gọi") + 0.3, 0.4),
                     IN("#rp-rp", "pop", w("Client gọi") + 0.6), *GO("rp-b1", w("phía sau"), 0.4), *GO("rp-b2", w("phía sau"), 0.4), *GO("rp-b3", w("phía sau"), 0.4),
                     IN("#rp-rs0, #rp-rs1, #rp-rs2", "pop", w("phía sau") + 0.3, 0.4, 0.1), IN("#rp-r2", "fade", w("Nginx"))]),
        B("Forward proxy đứng trước client. Client đi ra internet qua proxy, server bên ngoài chỉ thấy địa chỉ của proxy, ví dụ proxy lọc web của công ty.",
          "Forward proxy: đứng trước client, đi ra internet thay client.",
          lambda w: [IN("#rp-f", "fade", 0.1), IN("#rp-fc0, #rp-fc1", "pop", w("Client đi"), 0.4, 0.1), *GO("rp-c0", w("qua proxy") - 0.3, 0.4),
                     *GO("rp-c1", w("qua proxy") - 0.3, 0.4), IN("#rp-fp", "pop", w("qua proxy")), *GO("rp-c2", w("server bên ngoài"), 0.4),
                     IN("#rp-fi", "pop", w("server bên ngoài") + 0.3), IN("#rp-f2", "fade", w("chỉ thấy"))]),
        B("Cách nhớ: reverse proxy bảo vệ và đại diện cho server, forward proxy đại diện cho client.",
          "Reverse đại diện server, forward đại diện client.",
          lambda w: [DIM(S("rp-eye", "rp-q", "rp-r", "rp-rc", "rp-rp", "rp-rs0", "rp-rs1", "rp-rs2", "rp-r2", "rp-f", "rp-fc0", "rp-fc1", "rp-fp", "rp-fi", "rp-f2")
                         + ", " + AR("rp-b0", "rp-b1", "rp-b2", "rp-b3", "rp-c0", "rp-c1", "rp-c2"), 0, 0.07),
                     TYPE("#rp-t1", 0.4, 0.05), IN("#rp-t2", "blur", w("forward proxy"))]),
    ]),
    # ------------------------------------------------------------ resiliency vs HA vs scalability
    dict(id="three-words", world=(1920, 1080), hud="", cam="".join([
        head("tw", "Phần 3 · Ba từ hay bị nhầm", "Resiliency, HA, Scalability"),
        card("tw-c0", 120, 230, 540, 330, "Scalability", "Tải tăng, đáp ứng thêm được không?", "cyan", 44, 30,
             "scale dọc, hoặc scale ngang với app stateless"),
        card("tw-c1", 690, 230, 540, 330, "High availability", "Có luôn sẵn sàng không?", "violet", 44, 30,
             "dư thừa, không điểm chết duy nhất, failover"),
        card("tw-c2", 1260, 230, 540, 330, "Resiliency", "Một chỗ lỗi hay chậm, có chịu được không?", "amber", 44, 30,
             "timeout, retry có kiểm soát, circuit breaker, bulkhead, fallback"),
        card("tw-u0", 260, 230, 620, 230, "99,9%", "≈ 8,76 giờ ngừng mỗi năm", "violet", 64, 34),
        card("tw-u1", 1040, 230, 620, 230, "99,99%", "≈ 52,6 phút ngừng mỗi năm", "violet", 64, 34),
        note("tw-un", 160, 490, 1600, "Mỗi số 9 thêm vào: chi phí và độ phức tạp tăng rất nhiều", "amber", 32),
        tag("tw-s0", 110, 590, 900, 110, "10 instance, gọi payment không timeout", "cyan", 30),
        el("tw-s0r", 1050, 610, 760, None, "Scalable ✓ · HA ✓ · Resilient ✕", "chip red r"),
        tag("tw-s1", 110, 740, 900, 110, "1 instance, có timeout + circuit breaker", "cyan", 30),
        el("tw-s1r", 1050, 760, 760, None, "Resilient ✓ · HA ✕ · Scalable ✕", "chip amber r"),
        take("tw", "Nhiều instance chưa phải chịu lỗi", "tải tăng: scalability · một bản hỏng: HA · bên khác lỗi: resiliency"),
    ]), beats=[
        B("Ba từ này hay bị dùng lẫn lộn, và mỗi từ trả lời một câu hỏi khác. Scalability: tải tăng thì có đáp ứng thêm được không? Cách làm là scale dọc, hoặc scale ngang với app stateless.",
          "Scalability: tải tăng thì đáp ứng thêm được không?",
          lambda w: [IN("#tw-eye", "blur"), TYPE("#tw-q", 0.2, 0.05), *shrink("tw", w("Scalability:") - 0.6), IN("#tw-c0", "pop", w("Scalability:"))]),
        B("High availability: hệ thống có luôn sẵn sàng không? Cách làm là dư thừa, không có điểm chết duy nhất, và tự chuyển sang bản dự phòng khi một bản hỏng.",
          "HA: luôn sẵn sàng nhờ dư thừa và failover.",
          lambda w: [IN("#tw-c1", "pop", 0.2), PULSE("#tw-c1", w("dư thừa"))]),
        B("Resiliency: khi một thành phần lỗi hoặc chậm, hệ thống có chịu được không? Cách làm là timeout, retry có kiểm soát, circuit breaker, bulkhead và fallback.",
          "Resiliency: lỗi một chỗ không kéo sập cả hệ thống.",
          lambda w: [IN("#tw-c2", "pop", 0.2), PULSE("#tw-c2", w("timeout"))]),
        B("Về con số: chín mươi chín phẩy chín phần trăm sẵn sàng là khoảng tám phẩy bảy sáu giờ ngừng mỗi năm. Thêm một số chín, chỉ còn khoảng năm mươi hai phút. Mỗi số chín thêm vào đắt hơn rất nhiều.",
          "99,9% ≈ 8,76 giờ/năm · 99,99% ≈ 52,6 phút/năm.",
          lambda w: [OUT("#tw-c0, #tw-c1, #tw-c2", "blur", 0, 0.5), IN("#tw-u0", "pop", w("chín mươi")), IN("#tw-u1", "pop", w("Thêm một")),
                     IN("#tw-un", "up", w("Mỗi số"))]),
        B("Phân biệt bằng hai hệ thống. Mười instance sau load balancer, gọi payment không có timeout: scalable và HA, nhưng không resilient. Một instance có timeout và circuit breaker: resilient với lỗi payment, nhưng máy chết là dừng.",
          "Hai hệ thống: có cái này chưa chắc có cái kia.",
          lambda w: [IN("#tw-s0", "left", w("Mười instance")), IN("#tw-s0r", "pop", w("scalable và")), SHAKE("#tw-s0r", w("không resilient")),
                     IN("#tw-s1", "left", w("Một instance")), IN("#tw-s1r", "pop", w("resilient với"))]),
        B("Ba thứ độc lập. Thêm instance cho HA và scale, nhưng không đặt timeout thì một dịch vụ chậm vẫn kéo sập mọi instance cùng lúc.",
          "Chịu lỗi cần timeout và circuit breaker, không tự có nhờ số máy.",
          lambda w: [DIM(S("tw-eye", "tw-q", "tw-u0", "tw-u1", "tw-un", "tw-s0", "tw-s0r", "tw-s1", "tw-s1r"), 0, 0.07),
                     TYPE("#tw-t1", 0.4, 0.04), IN("#tw-t2", "blur", w("Thêm instance"))]),
    ]),
    # ------------------------------------------------------------ cloud basics
    dict(id="cloud-basics", world=(1920, 1080), hud="", cam="".join([
        head("cb", "Phần 4 · Cloud cơ bản", "Subnet và ba kiểu storage"),
        tag("cb-net", 110, 410, 230, 110, "Internet", "violet", 32),
        panel("cb-pub", 420, 220, 450, 480, "green"),
        lbl("cb-publ", 420, 240, 450, "Public subnet", 30),
        tag("cb-lb", 465, 310, 360, 100, "Load balancer", "green", 30),
        tag("cb-nat", 465, 540, 360, 100, "NAT gateway", "amber", 30),
        panel("cb-pri", 1000, 220, 810, 480, "violet"),
        lbl("cb-pril", 1000, 240, 810, "Private subnet", 30),
        tag("cb-app", 1040, 310, 340, 100, "App server", "cyan", 30),
        tag("cb-db", 1450, 310, 320, 100, "Database", "cyan", 30),
        note("cb-blk", 1000, 560, 810, "✕ internet không vào thẳng", "red", 32),
        note("cb-why", 160, 760, 1600, "Giảm bề mặt tấn công: người ngoài chỉ chạm được load balancer", "green", 34),
        card("cb-s0", 120, 230, 540, 380, "Object storage", "như S3 · file theo key qua HTTP · rẻ, bền · ghi đè cả object", "cyan", 42, 30,
             "ảnh, video, backup, log"),
        card("cb-s1", 690, 230, 540, 380, "Block storage", "như EBS · ổ cứng gắn vào máy ảo · độ trễ thấp", "violet", 42, 30,
             "database, ổ hệ điều hành"),
        card("cb-s2", 1260, 230, 540, 380, "File storage", "như EFS, NFS · thư mục chia sẻ qua mạng", "amber", 42, 30,
             "nhiều máy cùng mount"),
        take("cb", "File upload lên object storage", "để giữ app stateless khi chạy nhiều instance"),
        wires(arrow("cb-a0", [(340, 450), (457, 365)], "violet"), arrow("cb-a1", [(825, 360), (1032, 360)], "green"),
              arrow("cb-a2", [(1380, 360), (1442, 360)], "cyan"),
              arrow("cb-a3", [(1210, 410), (1210, 590), (1000, 590), (833, 590)], "amber", True),
              arrow("cb-a4", [(457, 600), (300, 640), (225, 600), (225, 528)], "amber", True)),
    ]), beats=[
        B("Mạng riêng của bạn trên cloud, gọi là VPC, được chia thành các subnet. Public subnet có đường vào và ra internet trực tiếp, thường đặt load balancer.",
          "VPC chia thành subnet. Public subnet: có đường vào ra internet.",
          lambda w: [IN("#cb-eye", "blur"), TYPE("#cb-q", 0.2, 0.05), *shrink("cb", w("Public subnet") - 0.6),
                     IN("#cb-net", "pop", w("Public subnet")), IN("#cb-pub", "fade", w("Public subnet")), IN("#cb-publ", "fade", w("Public subnet") + 0.3),
                     *GO("cb-a0", w("load balancer") - 0.5), IN("#cb-lb", "pop", w("load balancer"))]),
        B("Private subnet không có đường vào từ internet, thường đặt app server và database. Muốn ra ngoài, ví dụ tải bản cập nhật, thì đi qua NAT gateway ở public subnet, chiều ngược lại vẫn bị chặn.",
          "Private subnet: app và database, ra ngoài qua NAT gateway.",
          lambda w: [IN("#cb-pri", "fade", 0.1), IN("#cb-pril", "fade", 0.4), *GO("cb-a1", w("app server") - 0.4),
                     IN("#cb-app", "pop", w("app server")), *GO("cb-a2", w("database") - 0.2, 0.3), IN("#cb-db", "pop", w("database")),
                     *GO("cb-a3", w("Muốn ra"), 0.8), IN("#cb-nat", "pop", w("NAT gateway")), *GO("cb-a4", w("NAT gateway") + 0.5, 0.7),
                     IN("#cb-blk", "up", w("chiều ngược"))]),
        B("Lý do tách là giảm bề mặt tấn công. Người ngoài chỉ chạm được load balancer, còn app và database không có địa chỉ để kết nối thẳng.",
          "Tách để giảm bề mặt tấn công.",
          lambda w: [IN("#cb-why", "up", 0.3), PULSE("#cb-lb", w("chỉ chạm")), PULSE("#cb-app, #cb-db", w("còn app"))]),
        B("Ba kiểu lưu trữ. Object storage như S3: mỗi file là một object có key, truy cập qua HTTP. Rẻ, bền, nhưng không sửa một phần mà phải ghi đè cả object. Hợp ảnh, video, backup.",
          "Object storage: file theo key qua HTTP.",
          lambda w: [OUT(S("cb-net", "cb-pub", "cb-publ", "cb-lb", "cb-nat", "cb-pri", "cb-pril", "cb-app", "cb-db", "cb-blk", "cb-why")
                         + ", " + AR("cb-a0", "cb-a1", "cb-a2", "cb-a3", "cb-a4"), "blur", 0, 0.5),
                     IN("#cb-s0", "pop", w("Object storage"))]),
        B("Block storage như EBS giống ổ cứng gắn vào máy ảo, độ trễ thấp, hợp database. File storage như EFS là thư mục chia sẻ qua mạng, nhiều máy cùng mount.",
          "Block: ổ gắn vào máy · File: thư mục chia sẻ.",
          lambda w: [IN("#cb-s1", "pop", 0.1), IN("#cb-s2", "pop", w("File storage"))]),
        B("Liên hệ với bài scale: chạy nhiều instance mà lưu file upload ở ổ local thì instance khác không thấy file đó. Đẩy lên object storage là cách chuẩn để giữ app stateless.",
          "File upload ở ổ local: instance khác không thấy.",
          lambda w: [DIM(S("cb-eye", "cb-q", "cb-s0", "cb-s1", "cb-s2"), 0, 0.07),
                     TYPE("#cb-t1", w("Đẩy lên") - 0.6, 0.04), IN("#cb-t2", "blur", w("cách chuẩn"))]),
    ]),
    # ------------------------------------------------------------ containers, kubernetes and 503
    dict(id="containers-k8s", world=(1920, 1080), hud="", cam="".join([
        head("k8", "Phần 5 · Kubernetes và lỗi 503", "Đã có Compose, sao cần Kubernetes?", 76),
        card("k8-dc", 110, 220, 820, 240, "Docker Compose", "nhiều container trên một máy · dev, hệ thống nhỏ", "violet", 44, 30),
        card("k8-k", 990, 220, 820, 240, "Kubernetes", "container trên cả một cluster nhiều máy", "cyan", 44, 30),
        *[tag(f"k8-f{i}", 240 + (i % 3) * 360, 520 + (i // 3) * 120, 340, 95, t, "green", 30) for i, t in enumerate(
            ["Lập lịch", "Tự phục hồi", "Scale, autoscale", "Rolling update", "Service discovery", "Config và secret"])],
        card("k8-p0", 110, 210, 540, 260, "Liveness", "còn sống không?", "amber", 42, 30, "fail: restart container"),
        card("k8-p1", 690, 210, 540, 260, "Readiness", "nhận traffic được chưa?", "cyan", 42, 30, "fail: bỏ khỏi Service, không restart"),
        card("k8-p2", 1270, 210, 540, 260, "Startup", "app khởi động chậm", "violet", 42, 30, "liveness không giết oan"),
        *[tag(f"k8-c{i}", 110 + i * 440, 570, 380, 110, t, tone, 30) for i, (t, tone) in enumerate(
            [("Readiness fail", "amber"), ("bỏ khỏi Service", "amber"), ("endpoints rỗng", "amber"), ("503", "red")])],
        console("k8-cs", 110, 210, 1080, ["1  ai trả 503: ingress hay app?", "2  kubectl get pods       READY 0/1?",
                                         "3  kubectl describe pod   Events", "4  kubectl logs <pod> --previous",
                                         "5  kubectl get endpoints  rỗng?", "6  vừa deploy? kubectl rollout undo"]),
        card("k8-e2", 1330, 210, 480, 160, "502", "upstream trả lời sai, từ chối kết nối", "violet", 44, 26),
        card("k8-e3", 1330, 390, 480, 160, "503", "không có backend sẵn sàng, quá tải", "red", 44, 26),
        card("k8-e4", 1330, 570, 480, 160, "504", "upstream trả lời quá lâu", "violet", 44, 26),
        tag("k8-sl", 110, 720, 520, 100, "Stateless: Deployment", "green", 30),
        tag("k8-sf", 670, 720, 560, 100, "Stateful: StatefulSet", "amber", 30),
        take("k8", "Liveness restart, readiness ngừng traffic", "readiness fail · endpoints rỗng · 503"),
        wires(*[arrow(f"k8-w{i}", [(490 + i * 440, 625), (542 + i * 440, 625)], "amber") for i in range(3)]),
    ]), beats=[
        B("Docker Compose cũng chạy được nhiều container, vậy vì sao cần Kubernetes? Compose chạy trên một máy, rất hợp môi trường dev và hệ thống nhỏ. Kubernetes quản lý container trên cả một cluster nhiều máy.",
          "Compose: một máy · Kubernetes: cả cluster nhiều máy.",
          lambda w: [IN("#k8-eye", "blur"), TYPE("#k8-q", 0.2, 0.04), *shrink("k8", w("Compose chạy") - 0.6),
                     IN("#k8-dc", "pop", w("Compose chạy")), IN("#k8-k", "pop", w("Kubernetes quản lý"))]),
        B("Nó lo những việc Compose không làm được: lập lịch, tự phục hồi, scale, rolling update không ngừng dịch vụ, service discovery, và config cùng secret.",
          "Lập lịch, tự phục hồi, scale, rolling update, service discovery, config.",
          lambda w: [IN("#k8-f0", "pop", w("lập lịch")), IN("#k8-f1", "pop", w("tự phục hồi")), IN("#k8-f2", "pop", w("scale,")),
                     IN("#k8-f3", "pop", w("rolling update")), IN("#k8-f4", "pop", w("service discovery")), IN("#k8-f5", "pop", w("config"))]),
        B("Ba probe quyết định số phận của Pod. Liveness fail thì Kubernetes restart container. Readiness fail thì Pod bị bỏ khỏi Service, không nhận request, nhưng không bị restart. Startup probe dành cho app khởi động chậm.",
          "Liveness fail: restart · Readiness fail: ngừng nhận traffic.",
          lambda w: [OUT(S("k8-dc", "k8-k", *[f"k8-f{i}" for i in range(6)]), "blur", 0, 0.5),
                     IN("#k8-p0", "pop", w("Liveness")), IN("#k8-p1", "pop", w("Readiness")), IN("#k8-p2", "pop", w("Startup"))]),
        B("Từ đó ra chuỗi nhân quả: readiness fail, Pod bị bỏ khỏi Service, endpoints rỗng, không còn backend nào, và người dùng nhận năm trăm lẻ ba.",
          "Readiness fail → bỏ khỏi Service → endpoints rỗng → 503.",
          lambda w: [IN("#k8-c0", "pop", w("readiness fail")), *GO("k8-w0", w("Pod bị") - 0.3, 0.3), IN("#k8-c1", "pop", w("Pod bị")),
                     *GO("k8-w1", w("endpoints") - 0.3, 0.3), IN("#k8-c2", "pop", w("endpoints")),
                     *GO("k8-w2", w("người dùng") - 0.3, 0.3), IN("#k8-c3", "pop", w("năm trăm")), SHAKE("#k8-c3", w("năm trăm") + 0.5)]),
        B("Điều tra năm trăm lẻ ba thì đi từ ngoài vào. Xác định ai trả lỗi, ingress hay app. Get pods xem cột READY. Describe pod để đọc Events. Logs previous xem lần chạy trước khi bị restart. Get endpoints xem có rỗng không.",
          "Điều tra 503: get pods, describe, logs --previous, get endpoints.",
          lambda w: [OUT(S("k8-p0", "k8-p1", "k8-p2", *[f"k8-c{i}" for i in range(4)]) + ", " + AR("k8-w0", "k8-w1", "k8-w2"), "blur", 0, 0.5),
                     IN("#k8-cs", "fade", 0.5), IN("#k8-cs-1", "type1", w("Xác định")), IN("#k8-cs-2", "type1", w("Get pods")),
                     IN("#k8-cs-3", "type1", w("Describe")), IN("#k8-cs-4", "type1", w("Logs")), IN("#k8-cs-5", "type1", w("Get endpoints"))]),
        B("Nếu lỗi bắt đầu sau một lần deploy, rollout undo để quay lại bản trước, tìm nguyên nhân sau. Và đừng nhầm: năm trăm lẻ hai là upstream trả lời sai, năm trăm lẻ tư là trả lời quá lâu.",
          "Vừa deploy thì rollback trước. 502 trả lời sai · 503 không có backend · 504 quá lâu.",
          lambda w: [IN("#k8-cs-6", "type1", w("rollout undo")), IN("#k8-e3", "pop", w("đừng nhầm")), IN("#k8-e2", "pop", w("năm trăm lẻ hai")),
                     IN("#k8-e4", "pop", w("năm trăm lẻ tư"))]),
        B("Còn app stateless thì dùng Deployment. Database hay Kafka cần danh tính và ổ đĩa riêng thì dùng StatefulSet, và vận hành khó hơn nhiều.",
          "Stateless: Deployment · Stateful: StatefulSet, khó vận hành hơn.",
          lambda w: [IN("#k8-sl", "left", w("Deployment") - 0.3), IN("#k8-sf", "left", w("StatefulSet") - 0.3)]),
        B("Câu cần nhớ: liveness fail thì restart, readiness fail thì Pod ngừng nhận traffic.",
          "Liveness restart · readiness ngừng nhận traffic.",
          lambda w: [DIM(S("k8-eye", "k8-q", "k8-cs", "k8-e2", "k8-e3", "k8-e4", "k8-sl", "k8-sf"), 0, 0.07),
                     TYPE("#k8-t1", 0.3, 0.04), IN("#k8-t2", "blur", w("readiness fail"))]),
    ]),
    # ------------------------------------------------------------ traffic spike playbook
    dict(id="traffic-spike", world=(1920, 1080), hud="", cam="".join([
        head("ts", "Phần 6 · Traffic tăng đột biến", "Hệ thống chậm, bắt đầu từ đâu?"),
        el("ts-rule", 0, 230, 1920, None, letters("Đo trước, tối ưu sau"), "take r", "font-size:72px"),
        *[card(f"ts-m{i}", 110 + i * 433, 400, 400, 230, t, d, "cyan", 42, 28) for i, (t, d) in enumerate(
            [("Độ trễ", "p95, p99"), ("Tỉ lệ lỗi", "bao nhiêu request lỗi"), ("Lượng request", "mỗi giây (RPS)"),
             ("Độ bão hoà", "CPU, RAM, connection pool, thread pool, hàng đợi")])],
        *[tag(f"ts-l{i}", 110, 210 + i * 105, 400, 88, t, "violet", 30) for i, t in enumerate(
            ["Edge, CDN", "LB, gateway", "Application", "Cache", "Database", "Dịch vụ ngoài"])],
        *[box(f"ts-r{i}", 540, 210 + i * 105, 1270, 88, f'<span style="font-size:29px;color:var(--ink)">{esc(t)}</span>', "cyan")
          for i, t in enumerate(["đã qua CDN chưa · chặn bot · rate limit",
                                 "chia tải đều? health check đúng? chạm trần kết nối?",
                                 "thread pool, connection pool, GC · thêm instance, queue, timeout",
                                 "tỉ lệ hit · đề phòng cache stampede",
                                 "truy vấn chậm, thiếu index (EXPLAIN), khoá · replica cho phần đọc",
                                 "timeout, circuit breaker, bulkhead, fallback"])],
        lbl("ts-pl", 110, 215, 1700, "Cứu nhanh: từ rẻ và an toàn nhất", 34),
        *[card(f"ts-p{i}", 110 + i * 346, 290, 316, 190, f"{i + 1}", t, "green" if i < 3 else "amber", 48, 28) for i, t in enumerate(
            ["chặn bớt tải xấu", "cache", "thêm instance stateless", "tối ưu truy vấn", "việc nặng sang queue"])],
        bigerr("ts-trap", 260, 560, 1400, "✕ Database quá tải mà thêm instance app:<br>chỉ đổ thêm kết nối vào database, tệ hơn", 34),
        take("ts", "Đo, tìm layer nghẽn, chữa đúng layer", "độ trễ · lỗi · request · độ bão hoà"),
    ]), beats=[
        B("Traffic tăng đột biến, hệ thống chậm, bạn bắt đầu từ đâu? Nguyên tắc đầu tiên: đo trước, tối ưu sau. Đoán mò rồi thêm cache hay thêm máy có thể không đúng chỗ nghẽn.",
          "Đo trước, tối ưu sau.",
          lambda w: [IN("#ts-eye", "blur"), TYPE("#ts-q", 0.2, 0.05), *shrink("ts", w("Nguyên tắc") - 0.6), TYPE("#ts-rule", w("đo trước"), 0.04)]),
        B("Xem dashboard với bốn con số: độ trễ ở p chín mươi lăm và p chín mươi chín, tỉ lệ lỗi, lượng request mỗi giây, và độ bão hoà như CPU, connection pool, thread pool, độ dài hàng đợi.",
          "Bốn con số: độ trễ, tỉ lệ lỗi, request mỗi giây, độ bão hoà.",
          lambda w: [IN("#ts-m0", "pop", w("độ trễ")), IN("#ts-m1", "pop", w("tỉ lệ lỗi")), IN("#ts-m2", "pop", w("lượng request")),
                     IN("#ts-m3", "pop", w("độ bão hoà"))]),
        B("Rồi đi theo đường của request để tìm layer nghẽn. Ở edge, nội dung tĩnh đã qua CDN chưa, có rate limit chặn tải xấu chưa. Ở load balancer, chia tải có đều, health check có đúng không.",
          "Đi theo đường của request: edge, load balancer...",
          lambda w: [OUT(S("ts-rule", "ts-m0", "ts-m1", "ts-m2", "ts-m3"), "blur", 0, 0.5),
                     IN("#ts-l0", "left", w("Ở edge")), IN("#ts-r0", "left", w("Ở edge") + 0.3),
                     IN("#ts-l1", "left", w("Ở load")), IN("#ts-r1", "left", w("Ở load") + 0.3)]),
        B("Ở app, thread pool hay connection pool có cạn, GC có nặng không. Ở cache, tỉ lệ hit là bao nhiêu. Ở database, truy vấn chậm, thiếu index, xem EXPLAIN. Dịch vụ bên ngoài chậm thì timeout và circuit breaker.",
          "...app, cache, database, dịch vụ bên ngoài.",
          lambda w: [IN("#ts-l2", "left", 0.1), IN("#ts-r2", "left", 0.4), IN("#ts-l3", "left", w("Ở cache")), IN("#ts-r3", "left", w("Ở cache") + 0.3),
                     IN("#ts-l4", "left", w("Ở database")), IN("#ts-r4", "left", w("Ở database") + 0.3),
                     IN("#ts-l5", "left", w("Dịch vụ")), IN("#ts-r5", "left", w("Dịch vụ") + 0.3)]),
        B("Khi cần cứu nhanh, đi từ rẻ và an toàn nhất: chặn bớt tải xấu, cache, thêm instance cho phần stateless, rồi mới tối ưu truy vấn và chuyển việc nặng sang queue.",
          "Cứu nhanh: chặn tải xấu, cache, thêm instance, rồi mới tối ưu truy vấn và queue.",
          lambda w: [OUT(S(*[f"ts-l{i}" for i in range(6)], *[f"ts-r{i}" for i in range(6)]), "blur", 0, 0.5),
                     IN("#ts-pl", "fade", 0.5), IN("#ts-p0", "pop", w("chặn bớt")), IN("#ts-p1", "pop", w("cache,")),
                     IN("#ts-p2", "pop", w("thêm instance")), IN("#ts-p3", "pop", w("tối ưu")), IN("#ts-p4", "pop", w("chuyển việc"))]),
        B("Bẫy hay gặp: database đang quá tải mà thêm instance app thì chỉ đổ thêm kết nối vào database, làm nó tệ hơn.",
          "Bẫy: thêm instance app khi nghẽn ở database.",
          lambda w: [IN("#ts-trap", "up", 0.3), SHAKE("#ts-trap", w("làm nó"))]),
        B("Vậy nên: đo trước, đi theo đường của request để tìm layer nghẽn, rồi chữa đúng layer đó.",
          "Đo, tìm layer nghẽn, chữa đúng layer.",
          lambda w: [DIM(S("ts-eye", "ts-q", "ts-pl", "ts-trap", *[f"ts-p{i}" for i in range(5)]), 0, 0.07),
                     TYPE("#ts-t1", 0.3, 0.04), IN("#ts-t2", "blur", w("rồi chữa"))]),
    ]),
    # ------------------------------------------------------------ tech lead talks
    dict(id="lead-talks", world=(1920, 1080), hud="", cam="".join([
        head("lt", "Phần 7 · Câu hỏi kiểu tech lead", "Chia sẻ kinh nghiệm, không học thuộc", 76),
        *[cardov(f"lt-k{i}", 110 + i * 346, 330, 316, 200, f"{i + 1}", t, "cyan", 48, 32) for i, t in enumerate(
            ["Bối cảnh", "Bạn chọn gì", "Vì sao", "Đánh đổi", "Bài học"])],
        *[card(f"lt-x{i}", 110 + i * 433, 210, 400, 250, t, d, tone, 40, 27) for i, (t, d, tone) in enumerate(
            [("Tránh nó", "đổi cùng nhau thì chung một service", "green"), ("Saga", "bước local + thao tác bù, nhất quán cuối cùng", "cyan"),
             ("Outbox", "event ghi cùng transaction với dữ liệu", "cyan"), ("2PC", "giữ khoá lâu, điều phối là điểm nghẽn", "red")])],
        tag("lt-g0", 110, 540, 380, 100, "Order ✓", "green", 32),
        tag("lt-g1", 600, 540, 380, 100, "Payment ✓", "green", 32),
        tag("lt-g2", 1090, 540, 380, 100, "Shipping ✕", "red", 32),
        lbl("lt-gc", 110, 730, 1360, "bù: hoàn tiền, rồi huỷ đơn", 30),
        el("lt-id", 110, 820, None, None, "Consumer luôn idempotent: message có thể đến hai lần", "chip amber r"),
        *[tag(f"lt-tr{i}", 110 + i * 420, 240, 380, 110, f"Tầng {i + 1}: retry ×3", "amber", 30) for i in range(3)],
        tag("lt-sys", 1370, 240, 440, 110, "Hệ thống đang yếu", "red", 30),
        *[el(f"lt-n{i}", 110 + i * 420, 370, 380, None, v, "num r", "text-align:center;color:var(--amber)") for i, v in enumerate(["3", "9", "27"])],
        el("lt-n3", 1370, 370, 440, None, "27 lời gọi", "num r", "text-align:center;color:var(--red)"),
        note("lt-r0", 160, 520, 1600, "Timeout ở mọi lời gọi ra ngoài, nhỏ hơn timeout tổng", "green", 34),
        note("lt-r1", 160, 600, 1600, "Retry chỉ với thao tác idempotent · backoff và jitter · giới hạn số lần", "green", 34),
        note("lt-r2", 160, 680, 1600, "Chỉ retry ở một tầng · idempotency key cho thanh toán", "green", 34),
        take("lt", "Kể dự án thật của chính bạn", "chưa làm thì nói thẳng và trình bày cách sẽ tiếp cận"),
        wires(*[arrow(f"lt-a{i}", [(1 * 490 + i * 490, 590), (592 + i * 490, 590)], "green" if i == 0 else "red") for i in range(2)],
              arrow("lt-b0", [(1280, 640), (1280, 700), (790, 700), (790, 648)], "amber", True),
              *[arrow(f"lt-c{i}", [(490 + i * 420, 295), (522 + i * 420, 295)], "amber") for i in range(3)]),
    ]), beats=[
        B("Với senior hay tech lead, phỏng vấn viên thường mời bạn chia sẻ kinh nghiệm. Khung dễ theo: bối cảnh, bạn chọn gì, vì sao, đánh đổi, và bài học.",
          "Khung: bối cảnh, lựa chọn, lý do, đánh đổi, bài học.",
          lambda w: [IN("#lt-eye", "blur"), TYPE("#lt-q", 0.2, 0.04), *shrink("lt", w("Khung") - 0.6),
                     IN("#lt-k0", "pop", w("bối cảnh")), IN("#lt-k1", "pop", w("bạn chọn")), IN("#lt-k2", "pop", w("vì sao")),
                     IN("#lt-k3", "pop", w("đánh đổi")), IN("#lt-k4", "pop", w("và bài học"))]),
        B("Distributed transaction: một nghiệp vụ qua nhiều service, mỗi service một database. Hướng đầu tiên là tránh nó: hai phần luôn đổi cùng nhau thì có lẽ nên chung một service.",
          "Distributed transaction: tránh nếu được.",
          lambda w: [OUT(S(*[f"lt-k{i}" for i in range(5)]), "blur", 0, 0.5), IN("#lt-x0", "pop", w("tránh nó"))]),
        B("Không tránh được thì dùng saga: chuỗi bước local, bước sau lỗi thì chạy thao tác bù để huỷ các bước trước. Nhất quán cuối cùng, không tức thì.",
          "Saga: bước sau lỗi thì chạy thao tác bù.",
          lambda w: [IN("#lt-x1", "pop", w("saga")), IN("#lt-g0", "pop", w("chuỗi bước")), *GO("lt-a0", w("chuỗi bước") + 0.4, 0.3),
                     IN("#lt-g1", "pop", w("chuỗi bước") + 0.7), *GO("lt-a1", w("bước sau") - 0.3, 0.3), IN("#lt-g2", "pop", w("bước sau")),
                     SHAKE("#lt-g2", w("bước sau") + 0.6), *GO("lt-b0", w("thao tác bù"), 0.8), IN("#lt-gc", "fade", w("thao tác bù") + 0.6)]),
        B("Outbox ghi event cùng transaction với dữ liệu rồi mới phát ra broker. Two phase commit thì giữ khoá lâu, bộ điều phối là điểm nghẽn, hiếm dùng giữa microservice. Và consumer luôn phải idempotent.",
          "Outbox · tránh 2PC · consumer idempotent.",
          lambda w: [IN("#lt-x2", "pop", 0.1), IN("#lt-x3", "pop", w("Two phase")), IN("#lt-id", "left", w("Và consumer"))]),
        B("Về retry, mọi lời gọi ra ngoài đều có timeout, nhỏ hơn timeout tổng của request. Retry chỉ với thao tác idempotent, có backoff và jitter.",
          "Timeout mọi nơi · retry chỉ thao tác idempotent, có backoff.",
          lambda w: [OUT(S("lt-x0", "lt-x1", "lt-x2", "lt-x3", "lt-g0", "lt-g1", "lt-g2", "lt-gc", "lt-id") + ", " + AR("lt-a0", "lt-a1", "lt-b0"), "blur", 0, 0.5),
                     IN("#lt-r0", "up", w("mọi lời gọi")), IN("#lt-r1", "up", w("Retry chỉ"))]),
        B("Đừng retry chồng nhiều tầng. Ba tầng, mỗi tầng thử ba lần, một request gốc thành ba nhân ba nhân ba, hai mươi bảy lời gọi tới hệ thống đang yếu, làm nó sập hẳn. Chỉ retry ở một tầng.",
          "3 × 3 × 3 = 27 lời gọi. Chỉ retry ở một tầng.",
          lambda w: [IN("#lt-tr0", "pop", w("Ba tầng")), *GO("lt-c0", w("Ba tầng") + 0.3, 0.2), IN("#lt-tr1", "pop", w("Ba tầng") + 0.5),
                     *GO("lt-c1", w("Ba tầng") + 0.8, 0.2), IN("#lt-tr2", "pop", w("Ba tầng") + 1.0), *GO("lt-c2", w("Ba tầng") + 1.3, 0.2),
                     IN("#lt-sys", "pop", w("Ba tầng") + 1.5),
                     IN("#lt-n0", "pop", w("ba nhân")), IN("#lt-n1", "pop", w("ba nhân") + 0.6), IN("#lt-n2", "pop", w("hai mươi bảy")),
                     IN("#lt-n3", "pop", w("hai mươi bảy") + 0.3), SHAKE("#lt-sys", w("sập hẳn")), IN("#lt-r2", "up", w("Chỉ retry"))]),
        B("Cuối cùng, đừng kể kinh nghiệm không có thật. Phỏng vấn viên sẽ đào sâu. Chưa làm thì nói thẳng và trình bày cách bạn sẽ tiếp cận.",
          "Kể dự án thật. Chưa làm thì nói thẳng.",
          lambda w: [DIM(S("lt-eye", "lt-q", "lt-tr0", "lt-tr1", "lt-tr2", "lt-sys", "lt-n0", "lt-n1", "lt-n2", "lt-n3", "lt-r0", "lt-r1", "lt-r2")
                         + ", " + AR("lt-c0", "lt-c1", "lt-c2"), 0, 0.07),
                     TYPE("#lt-t1", 0.3, 0.04), IN("#lt-t2", "blur", w("Chưa làm"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 40, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:88px"),
        *[box(f"ou-r{i}", 130, 170 + i * 86, 1660, 76, row(k, t), "cyan", "row") for i, (k, t) in enumerate(
            [("Sync · async", "chờ kết quả hay nhận sau · polling hỏi, push đẩy"),
             ("Request path", "DNS, CDN, LB, gateway, app, cache, DB"),
             ("Proxy", "reverse đại diện server, forward đại diện client"),
             ("Ba từ", "scale: tải tăng · HA: dư thừa · resiliency: chịu lỗi"),
             ("Cloud", "private subnet ra qua NAT · object, block, file"),
             ("Kubernetes", "readiness fail → endpoints rỗng → 503"),
             ("Traffic tăng", "đo trước, tìm layer nghẽn, chữa đúng layer"),
             ("Tech lead", "saga, outbox, idempotent · retry ở một tầng")])],
        el("ou-cta", 0, 880, 1920, None, "Mở bài học tương tác để làm quiz và luyện từng câu", "cta r"),
    ]), beats=[
        B("Tóm lại. Sync chờ kết quả, async nhận sau. Polling là client hỏi, push là server đẩy. Request đi qua DNS, CDN, load balancer, gateway, app, cache rồi database.",
          "Sync, async, polling, push · đường đi của request.",
          lambda w: [TYPE("#ou-h", 0, 0.05), IN("#ou-r0", "right", w("Sync chờ")), IN("#ou-r1", "right", w("Request đi"))]),
        B("Reverse proxy đại diện server, forward proxy đại diện client. Scalability, HA và resiliency là ba thứ độc lập. Private subnet ra ngoài qua NAT.",
          "Proxy · ba từ · subnet và storage.",
          lambda w: [IN("#ou-r2", "right", 0.1), IN("#ou-r3", "right", w("Scalability")), IN("#ou-r4", "right", w("Private subnet"))]),
        B("Readiness fail thì endpoints rỗng và ra năm trăm lẻ ba. Traffic tăng thì đo trước rồi chữa đúng layer. Và với tech lead: saga, outbox, idempotent, retry ở một tầng.",
          "Kubernetes 503 · traffic tăng · tech lead.",
          lambda w: [IN("#ou-r5", "right", 0.1), IN("#ou-r6", "right", w("Traffic tăng")), IN("#ou-r7", "right", w("Và với"))]),
        B("Mở bài học tương tác để làm quiz và luyện từng câu nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
