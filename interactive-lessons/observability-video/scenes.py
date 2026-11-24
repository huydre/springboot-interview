"""Observability explainer: three pillars, structured logging and MDC, Micrometer metrics and cardinality,
tracing with traceparent and OpenTelemetry, alerting and debugging a slow p99.

Every number comes from web/src/data/lessons/observability.ts (Spring Boot 3.5.16, Java 21, Jaeger 1.62):
ECS log line with traceId 11de9b7c283ca840df1fbc4ac632da54, orderId ord-42, paymentMethod momo;
/actuator/prometheus after 4 requests: orders_placed_total card 3.0, momo 1.0, checkout_duration_seconds_count 4,
max 0.062756541; tag by userId: 5 users -> 5 series; a histogram Timer with no tags exports 69 _bucket lines;
traceparent 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01 -> log has the same traceId and new spanId
67906c1b470aba3e, Jaeger root span parent 00f067aa0ba902b7; collector down -> "Failed to export spans", app still answers;
default sampling 0.1; @Async without decorator logs an empty traceId on task-1, with ContextPropagatingTaskDecorator the
same traceId. Worked (not run) figures: 99 x 50 ms + 1 x 5 s averages near 100 ms; SLO 99.9% / 30 days = 43.2 minutes;
p99 incident at 14:10 (2.5 s, SLO 500 ms, p50 60 ms, Hikari max 10, pending 40, about 2 s wait, payment 300 ms).
Theme: mono. Arrows are drawn and get a head, no travelling glow dot.
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


def AW(id_, d, dur=0.45):
    """Draw an arrow and pop its head (no FLOW dot: frames stay clean)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def bcode(src, size=28):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def cbox(id_, x, y, w, title, src, tone="violet", size=28):
    return box(id_, x, y, w, None, win(title) + bcode(src, size), tone, "code")


def tag(id_, x, y, w, h, text, tone="cyan", size=30):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600">{esc(text)}</span>', tone)


def text(id_, x, y, w, h, body, tone="cyan", size=30):
    """Plain sans text in a box, left aligned, wraps."""
    return box(id_, x, y, w, h, f'<span style="font-size:{size}px;line-height:1.35;text-align:left;width:100%;padding:0 30px;box-sizing:border-box">{esc(body).replace(chr(10), "<br>")}</span>', tone)


def bigerr(id_, x, y, w, html_text, size=30):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, body, tone="green", size=32, left=True):
    cls = f"note {tone}" + (" left" if left else "") + " r"
    return el(id_, x, y, w, None, esc(body).replace("\n", "<br>"), cls, f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:34px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=44, ds=30):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def row(id_, y, label, body, tone="cyan", h=84, ls=34, bs=30):
    inner = (f'<span class="mono" style="font-size:{ls}px;font-weight:700;width:250px;flex:none">{esc(label)}</span>'
             f'<span style="font-size:{bs}px;flex:1;text-align:left">{esc(body)}</span>')
    return box(id_, 90, y, 1740, h, inner, tone, "row")


def take(p, big, small):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(big), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(small), "take-sm r"))


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Câu hỏi phỏng vấn Backend · Production", "eyebrow r"),
        el("hk-q", 0, 195, 1920, None, letters("Trung bình 80 ms, sao khách vẫn kêu chậm?"), "h1 r", "font-size:72px"),
        card("hk-c0", 130, 380, 520, 260, "Metric", "có vấn đề không, từ lúc nào?", "cyan"),
        card("hk-c1", 700, 380, 520, 260, "Trace", "chậm ở chặng nào?", "violet"),
        card("hk-c2", 1270, 380, 520, 260, "Log", "chính xác chuyện gì đã xảy ra?", "green"),
        tag("hk-id", 560, 700, 800, 100, "traceId nối cả ba", "amber", 36),
        take("hk", "Metric, rồi trace, rồi log", "đi từ rộng tới hẹp"),
    ]), beats=[
        B("Dashboard báo API checkout có thời gian trung bình tám mươi mili giây, nhưng khách vẫn kêu chậm. Bạn nhìn con số nào tiếp theo?",
          "Trung bình 80 ms mà khách vẫn kêu chậm. Nhìn con số nào tiếp?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05)]),
        B("Bài này đi qua ba trụ cột của observability: metric, trace và log. Mỗi cái trả lời một câu hỏi khác nhau.",
          "Ba trụ cột: metric, trace, log.",
          lambda w: [IN("#hk-c0", "pop", w("metric,")), IN("#hk-c1", "pop", w("trace và")), IN("#hk-c2", "pop", w("log."))]),
        B("Ba thứ nối với nhau bằng trace ID. Khi có sự cố, ta luôn đi một hướng: metric, rồi trace, rồi log.",
          "Nối bằng traceId. Có sự cố: metric, rồi trace, rồi log.",
          lambda w: [IN("#hk-id", "up", 0.3), PULSE("#hk-id", w("trace ID")),
                     DIM(S("hk-eye", "hk-q", "hk-c0", "hk-c1", "hk-c2", "hk-id"), w("Khi có"), 0.07),
                     TYPE("#hk-t1", w("metric, rồi"), 0.04), IN("#hk-t2", "blur", w("rồi log"))]),
    ]),
    # ------------------------------------------------------------ three pillars
    dict(id="three-pillars", world=(1920, 1080), hud="", cam="".join([
        head("tp", "Phần 1 · Ba trụ cột", "Mỗi trụ cột trả lời một câu hỏi"),
        rule("tp-rule", "Trả lời cả câu hỏi chưa nghĩ ra", "Monitoring chỉ trả lời câu đã biết trước: CPU có quá 80% không"),
        card("tp-c0", 90, 250, 540, 220, "Metric", "con số đã gộp: có vấn đề không, từ lúc nào", "cyan", 42, 28),
        card("tp-c1", 690, 250, 540, 220, "Trace", "đường đi của một request: chậm ở chặng nào", "violet", 42, 28),
        card("tp-c2", 1290, 250, 540, 220, "Log", "sự kiện chi tiết: chính xác chuyện gì", "green", 42, 28),
        text("tp-s0", 90, 510, 540, 170, "p99 checkout tăng từ 14:05, chỉ ở /orders", "cyan", 30),
        text("tp-s1", 690, 510, 540, 170, "request chậm dừng 1,8 s ở span gọi DB", "violet", 30),
        text("tp-s2", 1290, 510, 540, 170, "log theo traceId: câu SQL nào, tham số gì", "green", 30),
        tag("tp-id", 90, 715, 1740, 90, "traceId nối ba thứ · metric trỏ tới trace mẫu (exemplar)", "amber", 30),
        note("tp-bad", 90, 835, 1740, "✕ Bắt đầu bằng grep log trên 20 pod: cách chậm nhất", "red", 32),
        take("tp", "Metric, rồi trace, rồi log", "metric khoanh vùng · trace tìm chặng · log giải thích vì sao"),
        wires(arrow("tp-a1", [(635, 595), (685, 595)], "muted"), arrow("tp-a2", [(1235, 595), (1285, 595)], "muted")),
    ]), beats=[
        B("Monitoring trả lời câu hỏi đã biết trước, như CPU có quá tám mươi phần trăm không. Observability là trả lời được cả câu chưa nghĩ ra, chỉ bằng dữ liệu hệ thống tự phát ra.",
          "Observability: trả lời cả câu hỏi chưa nghĩ ra.",
          lambda w: [IN("#tp-eye", "blur"), TYPE("#tp-q", 0.2, 0.05), IN("#tp-rule", "up", w("Observability là"))]),
        B("Dữ liệu đó có ba loại. Metric là con số đã gộp theo thời gian, trả lời có vấn đề không và từ lúc nào. Trace là đường đi của một request, trả lời chậm ở chặng nào. Log là sự kiện chi tiết, trả lời chính xác chuyện gì đã xảy ra.",
          "Metric: có vấn đề không · Trace: chặng nào · Log: chuyện gì.",
          lambda w: [OUT("#tp-rule", "blur", 0, 0.4), *shrink("tp", 0), IN("#tp-c0", "up", w("Metric là")),
                     IN("#tp-c1", "up", w("Trace là")), IN("#tp-c2", "up", w("Log là"))]),
        B("Ví dụ một sự cố. Metric cho thấy p chín mươi chín của checkout tăng từ mười bốn giờ năm phút, chỉ ở endpoint orders. Mở trace của một request chậm: nó dừng một phẩy tám giây ở span gọi database. Lấy trace ID đọc log, thấy đúng câu SQL và tham số.",
          "Metric khoanh vùng → trace tìm chặng → log theo traceId.",
          lambda w: [IN("#tp-s0", "up", w("Metric cho")), *AW("tp-a1", w("Mở trace") - 0.3),
                     IN("#tp-s1", "up", w("Mở trace")), *AW("tp-a2", w("Lấy trace") - 0.3), IN("#tp-s2", "up", w("Lấy trace"))]),
        B("Ba thứ nối được với nhau nhờ trace ID: metric trỏ tới trace mẫu, gọi là exemplar, và mỗi dòng log in cùng trace ID đó. Còn bắt đầu bằng grep log trên hai mươi pod là cách chậm nhất.",
          "traceId nối ba thứ. Grep log trước là chậm nhất.",
          lambda w: [IN("#tp-id", "up", 0.3), PULSE("#tp-id", w("exemplar")),
                     IN("#tp-bad", "up", w("Còn bắt")), SHAKE("#tp-bad", w("Còn bắt") + 0.6)]),
        B("Vậy thứ tự là metric, rồi trace, rồi log. Đi từ rộng tới hẹp, vì metric nhìn cả hệ thống với chi phí thấp.",
          "Metric, rồi trace, rồi log: từ rộng tới hẹp.",
          lambda w: [DIM(S("tp-eye", "tp-q", "tp-c0", "tp-c1", "tp-c2", "tp-s0", "tp-s1", "tp-s2", "tp-id", "tp-bad") + ", " + AR("tp-a1", "tp-a2"), 0, 0.07),
                     TYPE("#tp-t1", 0.3, 0.04), IN("#tp-t2", "blur", w("Đi từ"))]),
    ]),
    # ------------------------------------------------------------ logging
    dict(id="logging", world=(1920, 1080), hud="", cam="".join([
        head("lg", "Phần 2 · Logging", "Log có cấu trúc, MDC và traceId"),
        cbox("lg-bad", 260, 300, 1400, "app.log", 'Checkout ok for order 42 by user abc', "violet", 34),
        bigerr("lg-err", 260, 500, 1400, "✕ Tìm mọi đơn của user abc: phải viết regex cho từng kiểu câu", 32),
        tag("lg-prop", 260, 330, 1400, 120, "logging.structured.format.console=ecs", "cyan", 42),
        note("lg-pn", 260, 490, 1400, "Có sẵn từ Spring Boot 3.4 · định dạng khác: logstash, gelf", "green", 34, left=False),
        cbox("lg-code", 90, 240, 800, "DemoController.java",
             'MDC.put("orderId", "ord-42");\n'
             'try {\n'
             '    log.atInfo()\n'
             '       .addKeyValue("paymentMethod", method)\n'
             '       .log("Checkout ok");\n'
             '} finally {\n'
             '    MDC.remove("orderId");\n'
             '}', "violet", 26),
        cbox("lg-json", 930, 240, 900, "Output thật (ECS, đã lược)",
             '{"message":"Checkout ok",\n'
             ' "traceId":"11de9b7c283ca840df1fbc4ac632da54",\n'
             ' "spanId":"08e0b1fad81c9a91",\n'
             ' "orderId":"ord-42",\n'
             ' "paymentMethod":"momo"}', "green", 25),
        bigerr("lg-trap", 90, 720, 1740, "✕ Quên MDC.remove: Tomcat dùng lại thread, request sau mang orderId của request trước", 30),
        card("lg-k0", 90, 280, 540, 380, "Log level", "production để INFO · DEBUG chỉ bật tạm qua /actuator/loggers", "cyan", 40, 30),
        card("lg-k1", 690, 280, 540, 380, "Không log", "mật khẩu, token, số thẻ, CVV, OTP · không log nguyên entity", "red", 40, 30),
        card("lg-k2", 1290, 280, 540, 380, "Chi phí", "CPU, I/O, tiền lưu trữ · muốn đếm thì dùng metric", "amber", 40, 30),
        take("lg", "Ngữ cảnh vào field, không vào câu văn", "xoá MDC trong finally · đếm bằng metric, không đếm dòng log"),
    ]), beats=[
        B("Log trả lời chính xác chuyện gì đã xảy ra. Nhưng với hai mươi pod và hàng triệu dòng mỗi giờ, log dạng câu văn tự do rất khó lọc. Muốn tìm mọi đơn của user abc là phải viết regex cho từng kiểu câu.",
          "Log câu văn tự do: khó lọc, phải viết regex.",
          lambda w: [IN("#lg-eye", "blur"), TYPE("#lg-q", 0.2, 0.05), *shrink("lg", w("Nhưng với")),
                     IN("#lg-bad", "blur", w("log dạng"), 0.7), IN("#lg-err", "up", w("Muốn tìm")), SHAKE("#lg-err", w("Muốn tìm") + 0.6)]),
        B("Structured logging biến mỗi dòng log thành một object JSON với các field có tên. Từ Spring Boot ba chấm bốn, chỉ cần một property: logging structured format console bằng ECS. Ngoài ra còn logstash và gelf.",
          "Boot 3.4+: logging.structured.format.console=ecs",
          lambda w: [OUT(S("lg-bad", "lg-err"), "blur", 0, 0.5), IN("#lg-prop", "pop", w("chỉ cần")), IN("#lg-pn", "up", w("chỉ cần") + 1.5)]),
        B("Có Micrometer Tracing thì trace ID và span ID đã nằm sẵn trong MDC, nên tự có trong JSON. Field riêng thì thêm bằng MDC put, hoặc add Key Value của SLF4J hai. Đã chạy: dòng log có trace ID, order ID và payment method, đều là field lọc được.",
          "traceId, orderId, paymentMethod: đều là field lọc được.",
          lambda w: [OUT(S("lg-prop", "lg-pn"), "up", 0, 0.45), IN("#lg-code", "blur", w("Field riêng") - 0.4, 0.7),
                     IN("#lg-json", "blur", w("Đã chạy"), 0.7), PULSE("#lg-json", w("đều là field"))]),
        B("Bẫy hay gặp: MDC gắn với thread, mà Tomcat dùng lại thread cho request kế tiếp. Put mà không remove trong finally thì request sau mang order ID của request trước. Log sai còn tệ hơn không có log.",
          "Bẫy: quên xoá MDC trong finally.",
          lambda w: [IN("#lg-trap", "up", w("Put mà")), SHAKE("#lg-trap", w("Put mà") + 0.6), PULSE("#lg-code", w("trong finally"))]),
        B("Thêm ba điều hay bị hỏi. Production thường để mức INFO, DEBUG chỉ bật tạm. Không log mật khẩu, token, số thẻ, và đừng log nguyên entity. Log tốn CPU, I O và tiền lưu trữ, nên muốn đếm số đơn thì dùng metric, đừng đếm dòng log.",
          "INFO ở production · không log dữ liệu nhạy cảm · đếm bằng metric.",
          lambda w: [OUT(S("lg-code", "lg-json", "lg-trap"), "blur", 0, 0.5), IN("#lg-k0", "up", w("Production")),
                     IN("#lg-k1", "up", w("Không log")), IN("#lg-k2", "up", w("Log tốn"))]),
        B("Nhớ: ngữ cảnh đi vào field, không nhét vào câu văn.",
          "Ngữ cảnh vào field, không vào câu văn.",
          lambda w: [DIM(S("lg-eye", "lg-q", "lg-k0", "lg-k1", "lg-k2"), 0, 0.07), TYPE("#lg-t1", 0.2, 0.04), IN("#lg-t2", "blur", 1.4)]),
    ]),
    # ------------------------------------------------------------ metrics
    dict(id="metrics", world=(1920, 1080), hud="", cam="".join([
        head("mt", "Phần 3 · Metric", "Micrometer, cardinality và p99"),
        rule("mt-rule", "Micrometer giống SLF4J, nhưng cho metric", "Code ghi một lần, chọn backend bằng dependency micrometer-registry-*"),
        card("mt-m0", 90, 250, 405, 210, "Counter", "chỉ tăng", "cyan", 38, 28),
        card("mt-m1", 535, 250, 405, 210, "Gauge", "giá trị hiện tại, lên xuống", "cyan", 38, 28),
        card("mt-m2", 980, 250, 405, 210, "Timer", "đo thời gian và đếm số lần", "cyan", 38, 28),
        card("mt-m3", 1425, 250, 405, 210, "DistributionSummary", "như Timer, cho giá trị khác", "cyan", 30, 28),
        console("mt-out", 90, 510, 1100, ['orders_placed_total{payment_method="card"} 3.0',
                                         'orders_placed_total{payment_method="momo"} 1.0',
                                         'checkout_duration_seconds_count 4',
                                         'checkout_duration_seconds_max 0.062756541']),
        note("mt-pull", 1240, 530, 590, "Prometheus pull:\nGET /actuator/prometheus\nmỗi vài chục giây", "green", 32),
        text("mt-bad", 90, 250, 840, 300, 'tag("user_id", userId)\n5 user → 5 series\n1 triệu user → 1 triệu series', "red", 34),
        text("mt-good", 990, 250, 840, 300, 'tag("payment_method", method)\n4 đơn → 2 series: card, momo', "green", 34),
        note("mt-69", 90, 590, 1740, "Timer có histogram, không tag nào: đã xuất 69 dòng _bucket", "amber", 32),
        note("mt-rule2", 90, 670, 1740, "userId, orderId, email, URL thô thuộc về log và trace", "green", 32),
        text("mt-avg", 90, 250, 840, 220, "99 request 50 ms + 1 request 5 s\n→ trung bình gần 100 ms, trông ổn", "amber", 34),
        text("mt-p99", 990, 250, 840, 220, "p99: mức mà 99% request nhanh hơn\n→ thấy nhóm khách chờ 5 s", "green", 34),
        cbox("mt-pq", 90, 510, 1740, "PromQL: cộng bucket mọi instance rồi mới tính",
             "histogram_quantile(0.99, sum by (le) (rate(checkout_duration_seconds_bucket[5m])))", "violet", 30),
        bigerr("mt-wrong", 90, 730, 1740, "✕ Lấy trung bình p99 của từng instance không ra p99 của cả cụm", 30),
        card("mt-red", 90, 250, 840, 300, "RED cho service", "Rate · Errors · Duration", "cyan", 44, 34),
        card("mt-use", 990, 250, 840, 300, "USE cho tài nguyên", "Utilization · Saturation · Errors (ví dụ pool Hikari)", "violet", 44, 34),
        tag("mt-slo", 90, 600, 1740, 110, "SLO 99,9% trong 30 ngày → error budget 43,2 phút", "amber", 38),
        take("mt", "Tag có giới hạn, nhìn p99", "không nhìn trung bình · RED cho service, USE cho tài nguyên"),
    ]), beats=[
        B("Micrometer là lớp API cho metric, giống SLF4J cho log: code ghi một lần, chọn backend bằng một dependency.",
          "Micrometer: như SLF4J, nhưng cho metric.",
          lambda w: [IN("#mt-eye", "blur"), TYPE("#mt-q", 0.2, 0.05), IN("#mt-rule", "up", w("Micrometer là"))]),
        B("Có bốn loại meter. Counter chỉ tăng. Gauge là giá trị hiện tại, lên xuống được. Timer đo thời gian và đếm số lần. Distribution Summary cho giá trị khác thời gian.",
          "Counter · Gauge · Timer · DistributionSummary.",
          lambda w: [OUT("#mt-rule", "blur", 0, 0.4), *shrink("mt", 0), IN("#mt-m0", "up", w("Counter")),
                     IN("#mt-m1", "up", w("Gauge")), IN("#mt-m2", "up", w("Timer đo")), IN("#mt-m3", "up", w("Distribution"))]),
        B("Prometheus cứ vài chục giây lại gọi actuator prometheus của mỗi instance. Đã chạy bốn request: orders placed total có card bằng ba, momo bằng một.",
          "Đã chạy: card 3, momo 1.",
          lambda w: [IN("#mt-pull", "up", 0.2), IN("#mt-out", "blur", w("Đã chạy"), 0.6),
                     IN("#mt-out-1", "type1", w("card bằng")), IN("#mt-out-2", "type1", w("momo bằng")),
                     IN("#mt-out-3", "type1", w("momo bằng") + 0.6), IN("#mt-out-4", "type1", w("momo bằng") + 0.9)]),
        B("Mỗi tổ hợp giá trị tag là một time series. Gắn tag theo user ID: năm user là năm series, một triệu user là một triệu series cho một counter. Prometheus hết RAM. Đây là cardinality explosion.",
          "Tag theo userId: mỗi user một series. Cardinality explosion.",
          lambda w: [OUT(S("mt-m0", "mt-m1", "mt-m2", "mt-m3", "mt-out", "mt-pull"), "blur", 0, 0.5),
                     IN("#mt-bad", "up", w("Gắn tag")), SHAKE("#mt-bad", w("Prometheus hết"))]),
        B("Tag phải có giới hạn, như payment method: bốn đơn chỉ ra hai series. Timer có histogram, không tag nào, đã xuất sáu mươi chín dòng bucket. Tra theo từng user thì dùng log và trace.",
          "Tag có giới hạn. Tra từng user bằng log và trace.",
          lambda w: [IN("#mt-good", "up", w("Tag phải")), IN("#mt-69", "up", w("Timer có")), IN("#mt-rule2", "up", w("Tra theo"))]),
        B("Latency thì đừng nhìn trung bình. Chín mươi chín request năm mươi mili giây và một request năm giây cho trung bình gần một trăm mili giây, trông ổn. p chín mươi chín mới cho thấy nhóm chậm.",
          "Trung bình giấu nhóm chậm. Nhìn p99.",
          lambda w: [OUT(S("mt-bad", "mt-good", "mt-69", "mt-rule2"), "blur", 0, 0.5),
                     IN("#mt-avg", "up", w("Chín mươi")), IN("#mt-p99", "up", w("p chín"))]),
        B("Chạy nhiều instance thì xuất histogram, để Prometheus cộng bucket của mọi instance rồi mới tính. Lấy trung bình các p chín mươi chín là sai.",
          "Xuất histogram, tính p99 ở Prometheus.",
          lambda w: [IN("#mt-pq", "blur", 0.3, 0.7), IN("#mt-wrong", "up", w("Lấy trung")), SHAKE("#mt-wrong", w("Lấy trung") + 0.6)]),
        B("Đo gì trước? RED cho service: rate, errors, duration. USE cho tài nguyên như connection pool. Và SLO chín mươi chín phẩy chín phần trăm trong ba mươi ngày cho error budget bốn mươi ba phẩy hai phút.",
          "RED · USE · SLO 99,9% / 30 ngày = 43,2 phút.",
          lambda w: [OUT(S("mt-avg", "mt-p99", "mt-pq", "mt-wrong"), "blur", 0, 0.5), IN("#mt-red", "up", w("RED")),
                     IN("#mt-use", "up", w("USE")), IN("#mt-slo", "pop", w("Và SLO"))]),
        B("Nhớ: tag có giới hạn, và nhìn p chín mươi chín chứ không nhìn trung bình.",
          "Tag có giới hạn, nhìn p99.",
          lambda w: [DIM(S("mt-eye", "mt-q", "mt-red", "mt-use", "mt-slo"), 0, 0.07), TYPE("#mt-t1", 0.2, 0.04), IN("#mt-t2", "blur", w("và nhìn"))]),
    ]),
    # ------------------------------------------------------------ tracing
    dict(id="tracing", world=(1920, 1080), hud="", cam="".join([
        head("tr", "Phần 4 · Tracing", "traceparent, span và OpenTelemetry"),
        card("tr-c0", 90, 240, 840, 220, "Trace", "hành trình của một request · traceId 32 ký tự hex", "cyan", 42, 30),
        card("tr-c1", 990, 240, 840, 220, "Span", "một đoạn việc · spanId 16 hex · có span cha", "violet", 42, 30),
        el("tr-hl", 90, 500, 1740, None, "Header W3C traceparent", "note left r", "font-size:30px"),
        tag("tr-v", 165, 555, 120, 90, "00", "muted", 32),
        tag("tr-t", 315, 555, 760, 90, "4bf92f3577b34da6a3ce929d0e0e4736", "cyan", 32),
        tag("tr-p", 1105, 555, 420, 90, "00f067aa0ba902b7", "violet", 32),
        tag("tr-f", 1555, 555, 200, 90, "01", "green", 32),
        el("tr-lv", 165, 655, 120, None, "version", "lbl r"),
        el("tr-lt", 315, 655, 760, None, "traceId", "lbl r"),
        el("tr-lp", 1105, 655, 420, None, "span cha", "lbl r"),
        el("tr-lf", 1555, 655, 200, None, "đã lấy mẫu", "lbl r"),
        tag("tr-r1", 90, 720, 1740, 80, "Log: cùng traceId 4bf92f35…4736, spanId mới 67906c1b470aba3e", "green", 28),
        tag("tr-r2", 90, 815, 1740, 80, "Jaeger: span gốc http get /demo/checkout, parent 00f067aa0ba902b7", "green", 28),
        card("tr-k0", 90, 250, 380, 160, "Micrometer Tracing", "API", "cyan", 30, 26),
        card("tr-k1", 543, 250, 380, 160, "Bridge", "OpenTelemetry hoặc Brave", "violet", 30, 26),
        card("tr-k2", 996, 250, 380, 160, "OTLP exporter", "gửi theo lô, thread riêng", "amber", 30, 26),
        card("tr-k3", 1449, 250, 380, 160, "Collector", "Jaeger, Tempo, OTel", "green", 30, 26),
        console("tr-err", 90, 450, 1740, ["ERROR ... HttpExporter : Failed to export spans   (app vẫn trả lời)"]),
        card("tr-h", 90, 590, 840, 260, "Head-based", "quyết định ở đầu trace · Boot mặc định 10% · rẻ, có thể bỏ sót trace lỗi", "cyan", 40, 28),
        card("tr-tl", 990, 590, 840, 260, "Tail-based", "quyết định ở collector khi trace xong · giữ trace lỗi và chậm", "violet", 40, 28),
        cbox("tr-code", 90, 250, 900, "AsyncConfig.java",
             "@Bean\n"
             "ContextPropagatingTaskDecorator\n"
             "        contextPropagatingTaskDecorator() {\n"
             "    return new ContextPropagatingTaskDecorator();\n"
             "}", "violet", 26),
        tag("tr-a0", 1030, 250, 800, 110, "@Async ở thread task-1", "muted", 30),
        tag("tr-a1", 1030, 400, 800, 110, "không decorator: traceId trống", "red", 30),
        tag("tr-a2", 1030, 550, 800, 110, "có decorator: cùng traceId với controller", "green", 28),
        note("tr-an", 90, 600, 900, "Context nằm trong ThreadLocal\nExecutor tự new thì phải tự bọc", "amber", 32),
        take("tr", "Cùng traceId, span mới", "parent là bên gọi · head-based rẻ, tail-based giữ trace lỗi"),
        wires(arrow("tr-x1", [(475, 330), (538, 330)], "muted"), arrow("tr-x2", [(928, 330), (991, 330)], "muted"),
              arrow("tr-x3", [(1381, 330), (1444, 330)], "muted")),
    ]), beats=[
        B("Trace là hành trình của một request, định danh bằng trace ID ba mươi hai ký tự hex. Mỗi đoạn việc trong đó là một span, có span ID mười sáu ký tự hex, thời lượng và span cha. Các span xếp thành cây.",
          "Trace: traceId 32 hex. Span: spanId 16 hex, có span cha.",
          lambda w: [IN("#tr-eye", "blur"), TYPE("#tr-q", 0.2, 0.05), *shrink("tr", w("Mỗi đoạn") - 0.8),
                     IN("#tr-c0", "up", w("Mỗi đoạn")), IN("#tr-c1", "up", w("là một span"))]),
        B("Context đi qua ranh giới service bằng header Trace Parent theo chuẩn W3C: version, trace ID, span cha và flags. Flags không một nghĩa là trace đã được lấy mẫu.",
          "traceparent: version - traceId - span cha - flags.",
          lambda w: [IN("#tr-hl", "up", 0.3), IN("#tr-v, #tr-lv", "up", w("version")), IN("#tr-t, #tr-lt", "up", w("trace ID")),
                     IN("#tr-p, #tr-lp", "up", w("span cha")), IN("#tr-f, #tr-lf", "up", w("và flags")), PULSE("#tr-f", w("Flags không"))]),
        B("Đã chạy: gửi request kèm header này. Log của order service in đúng trace ID đó, với span ID mới. Trên Jaeger, span gốc của app có parent chính là span của client trong header.",
          "Cùng traceId, span mới, parent là span của client.",
          lambda w: [IN("#tr-r1", "up", w("Log của")), PULSE("#tr-t", w("đúng trace")), IN("#tr-r2", "up", w("Trên Jaeger")), PULSE("#tr-p", w("parent chính"))]),
        B("Phía Spring Boot ba: Micrometer Tracing là API, bridge OpenTelemetry hoặc Brave là bản cài đặt, và OTLP exporter gửi span tới collector như Jaeger hay Tempo. Exporter gửi theo lô ở thread riêng: đã chạy khi chưa có collector, app vẫn trả lời bình thường, chỉ in lỗi failed to export spans.",
          "API → bridge → OTLP exporter → collector. Collector chết, app vẫn chạy.",
          lambda w: [OUT(S("tr-c0", "tr-c1", "tr-hl", "tr-v", "tr-t", "tr-p", "tr-f", "tr-lv", "tr-lt", "tr-lp", "tr-lf", "tr-r1", "tr-r2"), "blur", 0, 0.5),
                     IN("#tr-k0", "up", w("Micrometer Tracing")), *AW("tr-x1", w("bridge")), IN("#tr-k1", "up", w("bridge")),
                     *AW("tr-x2", w("OTLP exporter")), IN("#tr-k2", "up", w("OTLP exporter")),
                     *AW("tr-x3", w("tới collector")), IN("#tr-k3", "up", w("tới collector")),
                     IN("#tr-err", "up", w("đã chạy khi")), IN("#tr-err-1", "type1", w("chỉ in"))]),
        B("Boot mặc định lấy mẫu mười phần trăm, quyết định ngay ở đầu trace, gọi là head based. Rẻ, nhưng request lỗi bạn cần tìm có thể không có trace. Tail based quyết định ở collector sau khi trace xong, nên giữ được mọi trace lỗi và chậm.",
          "Head-based: rẻ, có thể sót trace lỗi. Tail-based: giữ trace lỗi.",
          lambda w: [IN("#tr-h", "up", w("Boot mặc")), IN("#tr-tl", "up", w("Tail based"))]),
        B("Bẫy cuối: context nằm trong ThreadLocal. Đẩy việc sang Async thì thread task một không có gì, đã chạy: ô trace ID trống. Khai báo bean Context Propagating Task Decorator, executor của Boot sẽ chụp và khôi phục context, ra cùng trace ID với controller.",
          "@Async mất traceId. Sửa: bean ContextPropagatingTaskDecorator.",
          lambda w: [OUT(S("tr-k0", "tr-k1", "tr-k2", "tr-k3", "tr-err", "tr-h", "tr-tl") + ", " + AR("tr-x1", "tr-x2", "tr-x3"), "blur", 0, 0.5),
                     IN("#tr-an", "up", w("context nằm")), IN("#tr-a0", "up", w("Đẩy việc")), IN("#tr-a1", "up", w("đã chạy")),
                     SHAKE("#tr-a1", w("ô trace")), IN("#tr-code", "blur", w("Khai báo"), 0.7), IN("#tr-a2", "up", w("ra cùng"))]),
        B("Nhớ: cùng trace ID, span mới, và parent là bên gọi.",
          "Cùng traceId, span mới, parent là bên gọi.",
          lambda w: [DIM(S("tr-eye", "tr-q", "tr-code", "tr-a0", "tr-a1", "tr-a2", "tr-an"), 0, 0.07), TYPE("#tr-t1", 0.2, 0.04), IN("#tr-t2", "blur", w("và parent"))]),
    ]),
    # ------------------------------------------------------------ alerting and debug
    dict(id="alerting-debug", world=(1920, 1080), hud="", cam="".join([
        head("ad", "Phần 5 · Alerting và debug", "Alert theo triệu chứng, debug p99"),
        card("ad-c0", 90, 250, 840, 290, "Triệu chứng → alert", "tỉ lệ lỗi tăng, p99 vượt SLO, error budget cháy nhanh", "green", 42, 30),
        card("ad-c1", 990, 250, 840, 290, "Nguyên nhân → dashboard", "CPU 90%, pod restart, GC dài", "violet", 42, 30),
        note("ad-n1", 90, 580, 1740, "✕ Alert theo CPU: ồn khi chạy batch, và bỏ sót lock DB, DNS chậm, đối tác chậm", "red", 32),
        note("ad-n2", 90, 670, 1740, "Alert tốt: ngưỡng gắn SLO · kéo dài 10 phút · link runbook · burn rate", "green", 32),
        tag("ad-sc", 90, 230, 1740, 80, "14:10 · p99 POST /orders 2,5 s · SLO 500 ms · p50 vẫn 60 ms", "amber", 32),
        row("ad-r0", 335, "1 · RED", "chỉ /orders, mọi pod, từ 14:05, tải gấp 3, không deploy", "cyan"),
        row("ad-r1", 432, "2 · USE", "Hikari active chạm max 10, pending 40; CPU, GC bình thường", "violet"),
        row("ad-r2", 529, "3 · Trace", "gần 2 s chờ trước span SQL; payment 300 ms nằm trong transaction", "cyan"),
        row("ad-r3", 626, "4 · Log", "SELECT ... FOR UPDATE và gọi payment cùng một @Transactional", "cyan"),
        row("ad-r4", 723, "5 · Sửa", "payment ra ngoài transaction, có timeout; kiểm chứng p99, pending về 0", "green"),
        bigerr("ad-trap", 90, 830, 1740, "✕ Tăng pool lên 100: chỉ chữa triệu chứng, lock vẫn bị giữ", 30),
        take("ad", "Metric, trace, log, rồi kiểm chứng", "alert theo triệu chứng · sửa gốc · chứng minh bằng số liệu"),
    ]), beats=[
        B("Câu hỏi senior là alert cái gì. Nguyên tắc: alert theo triệu chứng người dùng cảm nhận, như tỉ lệ lỗi tăng hay p chín mươi chín vượt SLO, chứ không theo nguyên nhân như CPU.",
          "Alert theo triệu chứng, không theo nguyên nhân.",
          lambda w: [IN("#ad-eye", "blur"), TYPE("#ad-q", 0.2, 0.05), *shrink("ad", w("Nguyên tắc") - 0.6),
                     IN("#ad-c0", "up", w("alert theo triệu")), IN("#ad-c1", "up", w("chứ không"))]),
        B("Alert theo CPU gây ồn: CPU cao lúc chạy batch, khách không bị gì mà người trực vẫn bị gọi dậy. Nó còn bỏ sót, vì lock database không làm CPU tăng. Alert tốt gắn với SLO, kéo dài mười phút, có link runbook.",
          "Alert theo CPU: ồn và bỏ sót. Alert tốt: gắn SLO, có runbook.",
          lambda w: [IN("#ad-n1", "up", 0.3), SHAKE("#ad-n1", w("Nó còn")), IN("#ad-n2", "up", w("Alert tốt"))]),
        B("Tình huống mẫu: mười bốn giờ mười, p chín mươi chín của POST orders lên hai phẩy năm giây, SLO là năm trăm mili giây, nhưng p năm mươi vẫn sáu mươi.",
          "14:10: p99 2,5 s, SLO 500 ms, p50 vẫn 60 ms.",
          lambda w: [OUT(S("ad-c0", "ad-c1", "ad-n1", "ad-n2"), "blur", 0, 0.5), IN("#ad-sc", "pop", w("mười bốn"))]),
        B("Bước một, RED: chỉ endpoint orders, mọi pod, tải tăng gấp ba vì khuyến mãi. Bước hai, USE: pool Hikari chạm max mười, pending bốn mươi. Request đang xếp hàng chờ connection.",
          "RED khoanh vùng, USE: pool Hikari hết, request xếp hàng.",
          lambda w: [IN("#ad-r0", "left", w("Bước một")), IN("#ad-r1", "left", w("Bước hai")), PULSE("#ad-r1", w("Request đang"))]),
        B("Bước ba, trace của request chậm: gần hai giây chờ trước span SQL đầu tiên, và lời gọi payment nằm bên trong transaction. Bước bốn, log theo trace ID: select for update và gọi payment chung một transaction.",
          "Trace: chờ connection, payment trong transaction. Log xác nhận.",
          lambda w: [IN("#ad-r2", "left", w("Bước ba")), IN("#ad-r3", "left", w("Bước bốn"))]),
        B("Bước năm, sửa gốc: đưa lời gọi payment ra ngoài transaction, đặt timeout, rồi kiểm chứng p chín mươi chín và pending trên chính biểu đồ. Tăng pool lên một trăm chỉ chữa triệu chứng, lock vẫn bị giữ trong lúc chờ payment.",
          "Sửa gốc và kiểm chứng. Tăng pool không phải cách sửa.",
          lambda w: [IN("#ad-r4", "left", w("Bước năm")), IN("#ad-trap", "up", w("Tăng pool")), SHAKE("#ad-trap", w("Tăng pool") + 0.6)]),
        B("p năm mươi không đổi vì phần lớn request vẫn lấy được connection ngay, chỉ request tới lúc pool hết mới xếp hàng. Câu trả lời tốt: metric, trace, log, rồi chứng minh bằng số liệu.",
          "Metric, trace, log, rồi chứng minh bằng số liệu.",
          lambda w: [DIM(S("ad-eye", "ad-q", "ad-sc", "ad-r0", "ad-r1", "ad-r2", "ad-r3", "ad-r4", "ad-trap"), w("Câu trả lời") - 0.3, 0.07),
                     TYPE("#ad-t1", w("Câu trả lời"), 0.04), IN("#ad-t2", "blur", w("rồi chứng"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Observability"), "h1 r", "font-size:92px"),
        row("ou-r0", 200, "Ba trụ cột", "metric, rồi trace, rồi log; nối bằng traceId", "cyan", 100, 36, 32),
        row("ou-r1", 318, "Logging", "JSON với ECS, xoá MDC trong finally, không log bí mật", "cyan", 100, 36, 32),
        row("ou-r2", 436, "Metric", "tag có giới hạn, nhìn p99, SLO và error budget", "cyan", 100, 36, 32),
        row("ou-r3", 554, "Tracing", "traceparent, OTLP, head và tail sampling, decorator cho @Async", "cyan", 100, 36, 32),
        row("ou-r4", 672, "Sự cố", "alert theo triệu chứng; RED, USE, trace, log, kiểm chứng", "cyan", 100, 36, 32),
        el("ou-cta", 0, 840, 1920, None, "Mở bài học tương tác để làm quiz và xem output thật", "cta r"),
    ]), beats=[
        B("Tóm lại. Ba trụ cột: metric, rồi trace, rồi log, nối bằng trace ID. Logging: JSON với ECS, xoá MDC trong finally, không log bí mật.",
          "Ba trụ cột và logging.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "left", w("Ba trụ")), IN("#ou-r1", "left", w("Logging"))]),
        B("Metric: tag có giới hạn, nhìn p chín mươi chín. Tracing: traceparent, OTLP và sampling. Sự cố: alert theo triệu chứng, rồi đi RED, USE, trace, log, và kiểm chứng.",
          "Metric, tracing và xử lý sự cố.",
          lambda w: [IN("#ou-r2", "left", w("Metric:")), IN("#ou-r3", "left", w("Tracing:")), IN("#ou-r4", "left", w("Sự cố"))]),
        B("Mở bài học tương tác để làm quiz và xem output thật nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
