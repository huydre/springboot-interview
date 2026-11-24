"""Spring WebFlux explainer: thread-per-request vs event loop, Mono/Flux laziness, map vs flatMap, backpressure,
the blocking trap and schedulers, errors/retry/timeout, Reactor Context vs ThreadLocal, WebFlux vs virtual threads.

Every number comes from the lesson (web/src/data/lessons/webflux.ts), measured on JDK 21, Spring Boot 3.5,
an 8-core M1 Pro laptop with the load client on the same machine:
8 reactor-http-nio threads; 10 jobs x 100 ms: flatMap 112 ms, concatMap 1026 ms, flatMap(fn, 2) 518 ms;
200 clients, 100 ms wait: Mono.delay 1146-1593 req/s, Thread.sleep in the event loop 75 req/s (/ping waits 9-16 s),
boundedElastic ~720 req/s (80 threads x 10 = 800 ceiling);
Flux 1,2,0,4 map 10/i: 10, 5, then / by zero; inside flatMap: [10, 5, 2]; retry(2): 3 calls, "ok lan 3";
timeout(300 ms) on a 2 s call: "fallback vi TimeoutException"; ThreadLocal after publishOn: null, Context: req-42;
MVC vs virtual threads vs WebFlux at 200 clients: 1244-1276 / 1107-1243 / 1146-1593;
at 1000 clients: 1691-1851 (p50 ~520 ms) / 2168-2362 (p50 ~330 ms) / 2863-3123 (p50 190-256 ms).
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


def AW(id_, d=0.0, dur=0.5):
    """Draw an arrow and pop its head; no travelling light dot (clean frames)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(label, text, ls=44, ts=36):
    return f'<span class="mono big" style="font-size:{ls}px">{esc(label)}</span><span style="font-size:{ts}px">{esc(text)}</span>'


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


def take(p, main, sub):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(main), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(sub), "take-sm r"))


PARTS = [("Event loop", "ít thread, cấm chờ"), ("Mono · Flux", "lazy, flatMap"), ("Bẫy blocking", "75 request/giây"),
         ("Lỗi · retry", "timeout, fallback"), ("Context", "thay ThreadLocal"), ("Virtual thread", "chọn công cụ")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Spring · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Spring WebFlux"), "h1 r", "font-size:120px"),
        *[box(f"hk-c{i}", 80 + i * 296, 420, 280, 260,
              f'<b style="font-size:30px">{esc(n)}</b><span style="font-size:26px;color:var(--muted);text-align:center">{esc(d)}</span>', "cyan", "card")
          for i, (n, d) in enumerate(PARTS)],
        chip("hk-p1", 700, 780, "Số đo thật · laptop 8 core", "green"),
        take("hk", "Thread làm gì khi chờ?", "mấu chốt của cả bài"),
    ]), beats=[
        B("Người phỏng vấn hỏi: chuyển sang WebFlux thì request có nhanh hơn không? Và khi nào nên chọn nó thay cho virtual thread?",
          "WebFlux có làm request nhanh hơn? Khi nào chọn nó?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Video này đi qua sáu phần: event loop, Mono và Flux, bẫy gọi blocking, xử lý lỗi, Reactor Context, và so sánh với virtual thread.",
          "Sáu phần, từ event loop tới virtual thread.",
          lambda w: [IN("#hk-c0", "pop", w("event loop")), IN("#hk-c1", "pop", w("Mono và")), IN("#hk-c2", "pop", w("bẫy gọi")),
                     IN("#hk-c3", "pop", w("xử lý lỗi")), IN("#hk-c4", "pop", w("Reactor Context")), IN("#hk-c5", "pop", w("so sánh"))]),
        B("Mọi con số trong video đều đã đo thật, trên một laptop tám core.",
          "Mọi con số đều đã đo thật.",
          lambda w: [IN("#hk-p1", "up", w("đã đo"))]),
        B("Mấu chốt của cả bài là một câu hỏi: thread làm gì trong lúc chờ database hay service khác?",
          "Thread làm gì trong lúc chờ?",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-p1", *[f"hk-c{i}" for i in range(6)]), 0, 0.07),
                     TYPE("#hk-t1", w("thread làm"), 0.04), IN("#hk-t2", "blur", w("thread làm") + 1.2)]),
    ]),
    # ------------------------------------------------------------ problem
    dict(id="problem", world=(1920, 1080), hud="", cam="".join([
        head("pr", "Phần 1 · Thread-per-request và event loop", "Thread bị giữ khi chờ"),
        rule("pr-rule", "Spring MVC: một request, một thread", "Tomcat có pool tối đa 200 thread, mỗi thread theo request từ đầu tới cuối"),
        note("pr-cap", 160, 250, 1600, "Một request điển hình, khoảng 100 ms", "", 32),
        tag("pr-s1", 160, 310, 300, 110, "DB 20 ms", "amber", 30),
        tag("pr-s2", 470, 310, 1180, 110, "gọi service khác 80 ms", "amber", 30),
        tag("pr-s3", 1660, 310, 100, 110, "CPU", "green", 26),
        note("pr-n1", 160, 450, 1600, "Thread bị block suốt lúc chờ: không làm gì nhưng vẫn bị giữ", "red", 32),
        titled("pr-f", 160, 560, 1600, 150, "trần của pool", "200 thread ÷ 0,1 giây = 2000 request/giây", "", "violet", 44),
        bigerr("pr-e", 160, 750, 1600, "✕ Request thứ 201 phải xếp hàng, dù CPU gần như rảnh", 34),
        card("pr-L", 90, 250, 860, 600, "Thread-per-request", "mỗi request giữ một thread", "violet", 44, 30, 380),
        tag("pr-l1", 130, 440, 780, 100, "1 request = 1 thread", "cyan", 30),
        tag("pr-l2", 130, 560, 780, 100, "thread đứng chờ DB", "amber", 30),
        tag("pr-l3", 130, 680, 780, 100, "hết 200 thread: xếp hàng", "red", 30),
        card("pr-R", 970, 250, 860, 600, "Event loop (Netty)", "vài thread, không ai được chờ", "cyan", 44, 30, 380),
        *[tag(f"pr-nio{i}", 1010 + (i % 4) * 200, 440 + (i // 4) * 110, 180, 90, f"nio-{i + 1}", "cyan", 28) for i in range(8)],
        note("pr-r1", 1010, 680, 780, "gọi I/O: đăng ký callback,\ntrả thread về ngay", "green", 30),
        note("pr-cnt", 90, 880, 1740, "Đã đếm trên máy 8 core: đúng 8 thread reactor-http-nio, không tăng theo số request", "", 28),
        take("pr", "Không nhanh hơn, mà chịu tải hơn", "ít thread phục vụ nhiều request đang chờ · cấm blocking"),
    ]), beats=[
        B("Spring MVC chạy trên Tomcat, với một pool tối đa hai trăm thread. Mỗi request được giao cho một thread, từ đầu tới cuối. Mô hình này gọi là thread per request.",
          "Spring MVC: mỗi request một thread, pool tối đa 200.",
          lambda w: [IN("#pr-eye", "blur"), TYPE("#pr-q", 0.2, 0.05), IN("#pr-rule", "up", w("Mỗi request"))]),
        B("Vấn đề nằm ở chỗ chờ. Một request gọi database hai mươi mili giây, gọi service khác tám mươi mili giây, còn tính toán thật chỉ vài mili giây. Suốt lúc chờ, thread bị block: không làm gì, nhưng vẫn bị giữ.",
          "Request chủ yếu là chờ, và thread bị giữ suốt lúc chờ.",
          lambda w: [OUT("#pr-rule", "blur", 0, 0.4), *shrink("pr", 0), IN("#pr-cap", "up", 0.6),
                     IN("#pr-s1", "left", w("gọi database")), IN("#pr-s2", "left", w("gọi service")), IN("#pr-s3", "pop", w("còn tính toán")),
                     IN("#pr-n1", "up", w("Suốt lúc chờ")), PULSE("#pr-s2", w("không làm gì"))]),
        B("Hai trăm thread, mỗi request chờ một trăm mili giây, thì trần là khoảng hai nghìn request mỗi giây. Request thứ hai trăm lẻ một phải xếp hàng, dù CPU gần như rảnh.",
          "200 thread ÷ 0,1 giây = trần 2000 request/giây.",
          lambda w: [IN("#pr-f", "up", 0.3), IN("#pr-e", "up", w("Request thứ")), SHAKE("#pr-e", w("phải xếp hàng"))]),
        B("Event loop đi hướng ngược lại. Chỉ vài thread, Netty mặc định bằng số core, và không thread nào được phép chờ. Cần gọi database thì đăng ký: khi có dữ liệu thì gọi tôi, rồi trả thread về ngay.",
          "Event loop: vài thread, đăng ký callback rồi trả thread về.",
          lambda w: [OUT(S("pr-cap", "pr-s1", "pr-s2", "pr-s3", "pr-n1", "pr-f", "pr-e"), "blur", 0, 0.5),
                     IN("#pr-L", "up", 0.5), IN("#pr-l1", "up", 0.9), IN("#pr-l2", "up", 1.2), IN("#pr-l3", "up", 1.5),
                     IN("#pr-R", "up", w("Event loop đi") + 2.0), IN(S(*[f"pr-nio{i}" for i in range(8)]), "pop", w("Chỉ vài"), 0.4, 0.06),
                     IN("#pr-r1", "up", w("Cần gọi"))]),
        B("Đã đếm trên máy tám core, ngay sau một đợt tải một nghìn kết nối: đúng tám thread reactor http nio. Số này không tăng theo số request.",
          "Đã đếm: đúng 8 thread event loop trên máy 8 core.",
          lambda w: [IN("#pr-cnt", "up", 0.3), PULSE(S(*[f"pr-nio{i}" for i in range(8)]), w("đúng tám"))]),
        B("Cái giá là mọi thư viện trên đường đi phải non blocking. Và WebFlux không làm một request nhanh hơn: gọi database một trăm mili giây thì vẫn mất khoảng một trăm mili giây. Nó giúp phục vụ nhiều request đang chờ, với ít thread hơn.",
          "WebFlux không làm request nhanh hơn; nó chịu nhiều request đang chờ hơn.",
          lambda w: [DIM(S("pr-eye", "pr-q", "pr-L", "pr-l1", "pr-l2", "pr-l3", "pr-R", "pr-r1", "pr-cnt", *[f"pr-nio{i}" for i in range(8)]), w("Và WebFlux"), 0.07),
                     TYPE("#pr-t1", w("Và WebFlux") + 0.4, 0.04), IN("#pr-t2", "blur", w("Nó giúp"))]),
    ]),
    # ------------------------------------------------------------ reactor
    dict(id="reactor", world=(1920, 1080), hud="", cam="".join([
        head("re", "Phần 2 · Reactor", "Mono, Flux và lazy"),
        card("re-mono", 160, 290, 780, 260, "Mono<T>", "0 hoặc 1 phần tử\nví dụ tìm user theo id", "cyan", 52, 30),
        card("re-flux", 980, 290, 780, 260, "Flux<T>", "0 tới N phần tử\nví dụ danh sách đơn hàng", "violet", 52, 30),
        tag("re-end", 160, 600, 1600, 100, "Kết thúc bằng đúng một tín hiệu: onComplete hoặc onError", "green", 30),
        cbox("re-code", 90, 250, 1010, "Lazy.java",
             "Mono<String> m = Mono.fromCallable(\n"
             "    () -> { log(\"callable chay\"); return \"hi\"; });\n"
             "log(\"da tao Mono, chua subscribe\");\n"
             "m.subscribe(v -> log(\"nhan \" + v));", "violet", 28),
        console("re-out", 1140, 250, 690, ["[main] da tao Mono, chua subscribe", "[main] callable chay", "[main] nhan hi"]),
        cbox("re-just", 90, 600, 1010, "Just.java",
             "Mono<String> j = Mono.just(expensive());\n"
             "// expensive() chay ngay khi tao Mono.just", "violet", 28),
        bigerr("re-je", 1140, 600, 690, "✕ Mono.just: tính giá trị ngay", 30),
        note("re-jn", 1140, 720, 690, "✓ trì hoãn: fromCallable, defer", "green", 30),
        tag("re-m1", 90, 270, 480, 110, "map", "cyan", 40),
        note("re-m1d", 620, 300, 1200, "hàm trả giá trị thường, chạy ngay", "", 34),
        tag("re-m2", 90, 410, 480, 110, "flatMap", "violet", 40),
        note("re-m2d", 620, 440, 1200, "hàm trả Mono hoặc Flux: một việc bất đồng bộ", "", 34),
        bigerr("re-m3", 90, 570, 1740, "✕ map với hàm trả Mono → Flux&lt;Mono&lt;T&gt;&gt;: lời gọi bên trong không bao giờ chạy", 32),
        note("re-ten", 90, 255, 1740, "Đã đo: 10 việc, mỗi việc 100 ms", "", 32),
        *[box(f"re-r{i}", 90, 320 + i * 130, 1740, 110, row(k, t, 40, 34), tone, "row")
          for i, (k, t, tone) in enumerate([("flatMap", "112 ms · song song · không giữ thứ tự", "green"),
                                            ("concatMap", "1026 ms · lần lượt · giữ thứ tự", "amber"),
                                            ("flatMap(fn, 2)", "518 ms · tối đa 2 việc cùng lúc", "cyan")])],
        titled("re-pub", 160, 330, 460, 150, "nguồn", "Publisher", "", "amber", 44),
        titled("re-sub", 1300, 330, 460, 150, "bên nhận", "Subscriber", "", "cyan", 44),
        note("re-rq", 700, 300, 520, "request(n)", "green", 32),
        note("re-dn", 700, 470, 520, "tối đa n phần tử", "", 32),
        *[tag(f"re-b{i}", 90 + i * 590, 640, 560, 100, t, "violet", 28)
          for i, t in enumerate(["onBackpressureBuffer", "onBackpressureDrop", "onBackpressureLatest"])],
        note("re-bn", 90, 770, 1740, "khi nguồn không chậm lại được, ví dụ giá chứng khoán", "", 30),
        wires(arrow("re-a1", [(1295, 380), (625, 380)], "green"), arrow("re-a2", [(625, 440), (1295, 440)], "cyan")),
    ]), beats=[
        B("Viết callback lồng nhau rất khó đọc, nên Spring dùng Project Reactor, mô tả cả chuỗi xử lý như một pipeline. Mono phát không hoặc một phần tử. Flux phát không tới N phần tử. Cả hai kết thúc bằng on Complete hoặc on Error.",
          "Mono: 0 hoặc 1 phần tử. Flux: 0 tới N phần tử.",
          lambda w: [IN("#re-eye", "blur"), TYPE("#re-q", 0.2, 0.05), *shrink("re", w("Mono phát") - 0.8),
                     IN("#re-mono", "up", w("Mono phát")), IN("#re-flux", "up", w("Flux phát")), IN("#re-end", "up", w("Cả hai"))]),
        B("Điều quan trọng nhất: Reactor lazy. Viết from Callable chỉ là lắp ống, chưa có nước chảy. Đã chạy: dòng đã tạo Mono, chưa subscribe in ra trước. Chỉ khi gọi subscribe, callable mới chạy.",
          "Lazy: không subscribe thì không chạy.",
          lambda w: [OUT(S("re-mono", "re-flux", "re-end"), "blur", 0, 0.5), IN("#re-code", "blur", 0.6, 0.7), IN("#re-out", "fade", w("Đã chạy")),
                     IN("#re-out-1", "type1", w("dòng đã tạo")), IN("#re-out-2", "type1", w("callable mới")), IN("#re-out-3", "type1", w("callable mới") + 0.8)]),
        B("Ngoại lệ hay bị hỏi: Mono just nhận một giá trị đã tính xong, nên expensive chạy ngay khi tạo, không chờ subscribe. Muốn trì hoãn thì dùng from Callable hoặc defer.",
          "Mono.just tính giá trị ngay; muốn lazy thì fromCallable hoặc defer.",
          lambda w: [IN("#re-just", "up", 0.3), IN("#re-je", "up", w("nên expensive")), SHAKE("#re-je", w("chạy ngay")), IN("#re-jn", "up", w("Muốn trì hoãn"))]),
        B("Câu hỏi kinh điển: map khác flatMap thế nào? Hàm trả giá trị thường thì dùng map. Hàm trả Mono hay Flux, tức một việc bất đồng bộ, thì dùng flatMap. Dùng nhầm map thì lời gọi bên trong không bao giờ được subscribe.",
          "Giá trị thường: map. Trả Mono hay Flux: flatMap.",
          lambda w: [OUT(S("re-code", "re-out", "re-just", "re-je", "re-jn"), "blur", 0, 0.5),
                     IN("#re-m1", "left", w("Hàm trả giá")), IN("#re-m1d", "up", w("Hàm trả giá") + 0.4),
                     IN("#re-m2", "left", w("Hàm trả Mono")), IN("#re-m2d", "up", w("Hàm trả Mono") + 0.4),
                     IN("#re-m3", "up", w("Dùng nhầm")), SHAKE("#re-m3", w("không bao giờ"))]),
        B("Đã đo mười việc, mỗi việc một trăm mili giây. flatMap chạy cùng lúc, mất một trăm mười hai mili giây, nhưng không giữ thứ tự. concatMap giữ thứ tự, nhưng chạy lần lượt, mất hơn một giây. Giới hạn hai việc cùng lúc thì mất năm trăm mười tám mili giây.",
          "flatMap 112 ms · concatMap 1026 ms · flatMap(fn, 2) 518 ms.",
          lambda w: [OUT(S("re-m1", "re-m1d", "re-m2", "re-m2d", "re-m3"), "blur", 0, 0.5), IN("#re-ten", "up", 0.5),
                     IN("#re-r0", "left", w("flatMap chạy")), IN("#re-r1", "left", w("concatMap")), IN("#re-r2", "left", w("Giới hạn"))]),
        B("Cuối cùng là backpressure. Subscriber gọi request n để nói chỉ nhận thêm n phần tử, và publisher không được phát quá số đó. Nguồn không chậm lại được, như giá chứng khoán, thì chọn buffer, drop, hoặc chỉ giữ phần tử mới nhất.",
          "Backpressure: subscriber request(n), publisher không phát quá n.",
          lambda w: [OUT(S("re-ten", "re-r0", "re-r1", "re-r2"), "blur", 0, 0.5),
                     IN("#re-pub", "up", 0.6), IN("#re-sub", "up", w("Subscriber gọi")), *AW("re-a1", w("request n"), 0.6), IN("#re-rq", "up", w("request n") + 0.4),
                     *AW("re-a2", w("publisher không"), 0.6), IN("#re-dn", "up", w("publisher không") + 0.4),
                     IN("#re-bn", "up", w("Nguồn không")), IN("#re-b0", "up", w("buffer")), IN("#re-b1", "up", w("drop")), IN("#re-b2", "up", w("chỉ giữ"))]),
    ]),
    # ------------------------------------------------------------ webflux-spring
    dict(id="webflux-spring", world=(1920, 1080), hud="", cam="".join([
        head("ws", "Phần 3 · WebFlux trong Spring", "Một chỗ block, cả event loop đứng"),
        titled("ws-n1", 90, 330, 360, 150, "server", "Netty", "", "amber", 44),
        titled("ws-n2", 540, 330, 440, 150, "@RestController", "Mono / Flux", "", "violet", 40),
        tag("ws-n3", 1080, 270, 750, 110, "WebClient · thay RestTemplate", "cyan", 32),
        tag("ws-n4", 1080, 430, 750, 110, "R2DBC · thay JDBC, JPA", "cyan", 32),
        note("ws-n5", 90, 600, 1740, "Có cả starter web và webflux: Spring Boot chạy MVC (đã chạy: khởi động bằng Tomcat)", "", 30),
        note("ws-cap", 90, 255, 1740, "Đã đo: 3 endpoint cùng chờ 100 ms · 200 client · 4000 request", "", 30),
        tag("ws-l1", 90, 320, 520, 110, "Mono.delay (non-blocking)", "green", 26),
        tag("ws-l2", 90, 470, 520, 110, "Thread.sleep trong controller", "red", 26),
        tag("ws-l3", 90, 620, 520, 110, "sleep + boundedElastic", "amber", 26),
        tag("ws-b1", 640, 320, 1175, 110, "1146 – 1593 request/giây", "green", 32),
        tag("ws-b2", 640, 470, 1175, 110, "75 request/giây", "red", 32),
        tag("ws-b3", 640, 620, 1175, 110, "≈ 720 request/giây", "amber", 32),
        titled("ws-f", 160, 290, 1600, 170, "vì sao 75?", "8 event loop × (1 giây ÷ 100 ms) = 80", "", "violet", 46),
        bigerr("ws-e", 160, 510, 1600, "✕ /ping chỉ trả \"pong\" cũng có lần chờ 9 tới 16 giây", 34),
        note("ws-en", 160, 640, 1600, "kết nối của nó rơi vào một event loop đang ngủ", "red", 32),
        cbox("ws-code", 90, 260, 1140, "Offload.java",
             "@GetMapping(\"/offload\")\n"
             "Mono<String> offload() {\n"
             "  return Mono.fromCallable(() -> { Thread.sleep(100); return \"ok\"; })\n"
             "      .subscribeOn(Schedulers.boundedElastic());\n"
             "}", "violet", 26),
        note("ws-o1", 1280, 270, 550, "boundedElastic:\ntối đa 10 × số core thread", "", 30),
        note("ws-o2", 1280, 420, 550, "80 thread × 10 = 800 là trần", "green", 30),
        note("ws-o3", 1280, 530, 550, "BlockHound trong test:\n/blocking trả 500", "red", 30),
        cbox("ws-sc", 90, 255, 1010, "Schedulers.java",
             "Flux.just(1)\n"
             "  .doOnNext(i -> log(\"truoc publishOn\"))\n"
             "  .publishOn(Schedulers.parallel())\n"
             "  .doOnNext(i -> log(\"sau publishOn\"))\n"
             "  .subscribeOn(Schedulers.boundedElastic())\n"
             "  .blockLast();", "violet", 26),
        console("ws-out", 1140, 255, 690, ["[boundedElastic-1] truoc publishOn", "[parallel-5] sau publishOn"]),
        tag("ws-p1", 90, 680, 1740, 90, "publishOn: đổi thread cho các bước phía sau nó", "cyan", 30),
        tag("ws-p2", 90, 790, 1740, 90, "subscribeOn: đổi thread của nguồn · nhiều cái thì gần nguồn nhất thắng", "amber", 30),
        wires(arrow("ws-a1", [(455, 405), (535, 405)], "muted"), arrow("ws-a2", [(985, 390), (1075, 325)], "muted"),
              arrow("ws-a3", [(985, 420), (1075, 485)], "muted")),
    ]), beats=[
        B("Thêm starter webflux là có server Netty. Controller vẫn là Rest Controller, chỉ khác là trả Mono hoặc Flux, và Spring subscribe giúp. Web Client thay Rest Template, R2DBC thay JDBC và JPA. Lưu ý: có cả starter web và webflux thì Spring Boot chạy MVC.",
          "Controller trả Mono/Flux · WebClient · R2DBC.",
          lambda w: [IN("#ws-eye", "blur"), TYPE("#ws-q", 0.2, 0.05), *shrink("ws", w("Controller vẫn") - 0.8),
                     IN("#ws-n1", "up", w("server Netty")), *AW("ws-a1", w("Controller vẫn"), 0.4), IN("#ws-n2", "up", w("Controller vẫn") + 0.3),
                     *AW("ws-a2", w("Web Client"), 0.4), IN("#ws-n3", "left", w("Web Client") + 0.3),
                     *AW("ws-a3", w("R2DBC"), 0.4), IN("#ws-n4", "left", w("R2DBC") + 0.3), IN("#ws-n5", "up", w("Lưu ý"))]),
        B("Bẫy lớn nhất là gọi blocking trong event loop. Đã đo ba endpoint cùng chờ một trăm mili giây, hai trăm client đồng thời. Non blocking đạt một nghìn một trăm tới một nghìn sáu trăm request mỗi giây. Thread sleep ngay trong controller chỉ còn bảy mươi lăm. Đẩy sang bounded Elastic thì khoảng bảy trăm hai mươi.",
          "Non-blocking 1146–1593 · sleep trong event loop 75 · boundedElastic ≈ 720.",
          lambda w: [OUT(S("ws-n1", "ws-n2", "ws-n3", "ws-n4", "ws-n5") + ", " + AR("ws-a1", "ws-a2", "ws-a3"), "blur", 0, 0.5),
                     IN("#ws-cap", "up", w("Đã đo")), IN("#ws-l1", "left", w("Non blocking")), IN("#ws-b1", "left", w("Non blocking") + 0.4),
                     IN("#ws-l2", "left", w("Thread sleep")), IN("#ws-b2", "left", w("chỉ còn")), SHAKE("#ws-b2", w("bảy mươi lăm") + 0.4),
                     IN("#ws-l3", "left", w("Đẩy sang")), IN("#ws-b3", "left", w("thì khoảng"))]),
        B("Vì sao bảy mươi lăm? Netty có tám event loop. Mỗi thread ngủ một trăm mili giây mỗi request, nên trần là tám nhân mười, bằng tám mươi. Tệ hơn, endpoint ping chỉ trả pong cũng có lần chờ chín tới mười sáu giây, vì nó dùng chung event loop đang ngủ.",
          "8 × 10 = 80. Endpoint khác cũng chờ tới 16 giây.",
          lambda w: [OUT(S("ws-cap", "ws-l1", "ws-l2", "ws-l3", "ws-b1", "ws-b2", "ws-b3"), "blur", 0, 0.5),
                     IN("#ws-f", "up", w("Netty có")), PULSE("#ws-f", w("tám nhân")), IN("#ws-e", "up", w("Tệ hơn")), SHAKE("#ws-e", w("chín tới")),
                     IN("#ws-en", "up", w("vì nó"))]),
        B("Nếu buộc phải gọi blocking, bọc trong from Callable rồi subscribe On bounded Elastic. Scheduler này có tối đa mười nhân số core thread, ở đây là tám mươi, nên trần là tám trăm. Nó là lối thoát, không phải cách để mọi thứ đều blocking. Trong test, bật Block Hound để bắt chỗ còn sót.",
          "fromCallable + subscribeOn(boundedElastic) · BlockHound trong test.",
          lambda w: [OUT(S("ws-f", "ws-e", "ws-en"), "blur", 0, 0.5), IN("#ws-code", "blur", 0.5, 0.7), PULSE("#ws-code", w("subscribe On")),
                     IN("#ws-o1", "up", w("Scheduler này")), IN("#ws-o2", "up", w("nên trần")), IN("#ws-o3", "up", w("Trong test"))]),
        B("Hai operator đổi thread hay bị hỏi. publish On đổi thread cho các bước phía sau nó. subscribe On đổi thread của nguồn, đặt ở đâu cũng có tác dụng, và nếu có nhiều cái thì cái gần nguồn nhất thắng.",
          "publishOn: các bước phía sau. subscribeOn: nguồn.",
          lambda w: [OUT(S("ws-code", "ws-o1", "ws-o2", "ws-o3"), "blur", 0, 0.5), IN("#ws-sc", "blur", 0.5, 0.7), IN("#ws-out", "fade", 1.0),
                     IN("#ws-out-1", "type1", 1.3), IN("#ws-out-2", "type1", w("publish On đổi")),
                     IN("#ws-p1", "up", w("publish On đổi")), IN("#ws-p2", "up", w("subscribe On đổi"))]),
    ]),
    # ------------------------------------------------------------ errors
    dict(id="errors", world=(1920, 1080), hud="", cam="".join([
        head("er", "Phần 4 · Lỗi, retry và timeout", "Lỗi là một tín hiệu"),
        *[tag(f"er-i{i}", 300 + i * 220, 290, 160, 110, v, "cyan", 40) for i, v in enumerate("1204")],
        el("er-op", 1260, 318, None, None, "map(i -> 10 / i)", "chip violet r"),
        tag("er-o0", 300, 470, 160, 110, "10", "green", 40),
        tag("er-o1", 520, 470, 160, 110, "5", "green", 40),
        tag("er-o2", 740, 470, 160, 110, "✕", "red", 40),
        tag("er-o3", 960, 470, 160, 110, "4", "cyan", 40),
        bigerr("er-err", 300, 640, 1320, "✕ ArithmeticException: / by zero<br>stream dừng hẳn, phần tử 4 không được xử lý", 32),
        *[box(f"er-r{i}", 90, 260 + i * 125, 1740, 105, row(k, t, 38, 32), "cyan", "row")
          for i, (k, t) in enumerate([("onErrorReturn", "lỗi thì trả giá trị mặc định"),
                                      ("onErrorResume", "chuyển sang nguồn khác: fallback, cache"),
                                      ("onErrorMap", "đổi loại lỗi"),
                                      ("lỗi trong flatMap", "bắt bên trong: ra [10, 5, 2]")])],
        tag("er-c1", 90, 290, 520, 110, "lần 1: lỗi", "red", 32),
        tag("er-c2", 700, 290, 520, 110, "lần 2: lỗi", "red", 32),
        tag("er-c3", 1310, 290, 520, 110, "lần 3: \"ok lan 3\"", "green", 32),
        cbox("er-rc", 90, 470, 1100, "Retry.java",
             "Mono.fromCallable(() -> callService())\n"
             "    .retry(2)\n"
             "    .block();", "violet", 30),
        note("er-rn", 1250, 500, 580, "retry(2) = lần đầu\n+ 2 lần thử lại = 3 lần gọi", "green", 32),
        cbox("er-tc", 90, 260, 1740, "Timeout.java",
             "Mono.delay(Duration.ofSeconds(2)).map(x -> \"cham\")\n"
             "    .timeout(Duration.ofMillis(300))\n"
             "    .onErrorResume(e -> Mono.just(\"fallback vi \" + e.getClass().getSimpleName()))\n"
             "    .block();\n"
             "// Đã chạy: fallback vi TimeoutException", "violet", 28),
        tag("er-tn", 90, 650, 1740, 100, "timeout của Reactor gửi cancel ngược lên nguồn: WebClient đóng kết nối", "amber", 30),
        tag("er-k1", 90, 300, 440, 120, "timeout", "cyan", 36),
        tag("er-k2", 640, 300, 640, 120, "retryWhen(backoff)", "cyan", 36),
        tag("er-k3", 1390, 300, 440, 120, "onErrorResume", "cyan", 36),
        bigerr("er-pay", 90, 500, 1740, "✕ retry POST /payments không có khoá idempotency: có thể trừ tiền hai lần", 32),
        take("er", "Retry là gọi lại thật", "chỉ retry thao tác idempotent"),
        wires(arrow("er-a1", [(615, 345), (695, 345)], "muted"), arrow("er-a2", [(1225, 345), (1305, 345)], "muted"),
              arrow("er-b1", [(535, 360), (635, 360)], "muted"), arrow("er-b2", [(1285, 360), (1385, 360)], "muted")),
    ]), beats=[
        B("Trong pipeline Reactor, lỗi là một tín hiệu on Error đi xuôi chuỗi, và lỗi kết thúc stream. Đã chạy Flux một, hai, không, bốn, đem mười chia cho từng số: nhận mười, rồi năm, rồi lỗi chia cho không. Phần tử bốn không bao giờ được xử lý.",
          "Lỗi kết thúc stream: 10, 5, rồi / by zero.",
          lambda w: [IN("#er-eye", "blur"), TYPE("#er-q", 0.2, 0.05), *shrink("er", w("Đã chạy") - 0.8),
                     IN(S("er-i0", "er-i1", "er-i2", "er-i3"), "pop", w("Đã chạy"), 0.4, 0.15), IN("#er-op", "up", w("đem mười")),
                     IN("#er-o0", "up", w("nhận mười")), IN("#er-o1", "up", w("rồi năm")), IN("#er-o2", "pop", w("rồi lỗi")), SHAKE("#er-o2", w("rồi lỗi") + 0.4),
                     IN("#er-err", "up", w("rồi lỗi") + 0.6), IN("#er-o3", "up", w("Phần tử bốn")), DIM("#er-o3", w("Phần tử bốn") + 0.6, 0.25)]),
        B("Lỗi được bắt bằng operator. on Error Return trả giá trị mặc định. on Error Resume chuyển sang một nguồn khác, như fallback hay cache. on Error Map đổi loại lỗi. Muốn một phần tử lỗi không giết cả Flux thì bắt lỗi bên trong flatMap: đã chạy, ra mười, năm, hai.",
          "onErrorReturn · onErrorResume · onErrorMap · bắt lỗi trong flatMap.",
          lambda w: [OUT(S("er-i0", "er-i1", "er-i2", "er-i3", "er-op", "er-o0", "er-o1", "er-o2", "er-o3", "er-err"), "blur", 0, 0.5),
                     IN("#er-r0", "left", w("on Error Return")), IN("#er-r1", "left", w("on Error Resume")), IN("#er-r2", "left", w("on Error Map")),
                     IN("#er-r3", "left", w("Muốn một"))]),
        B("retry n là subscribe lại nguồn. Vì lazy, lời gọi chạy lại thật. Đã chạy retry hai: lần một lỗi, lần hai lỗi, lần ba ra ok lần ba. Tức retry hai là tổng cộng ba lần gọi.",
          "retry(2): tổng cộng 3 lần gọi.",
          lambda w: [OUT(S("er-r0", "er-r1", "er-r2", "er-r3"), "blur", 0, 0.5), IN("#er-rc", "blur", 0.5, 0.6),
                     IN("#er-c1", "up", w("lần một")), *AW("er-a1", w("lần hai") - 0.4, 0.4), IN("#er-c2", "up", w("lần hai")),
                     *AW("er-a2", w("lần ba") - 0.4, 0.4), IN("#er-c3", "up", w("lần ba")), IN("#er-rn", "up", w("Tức retry"))]),
        B("Timeout ba trăm mili giây cho một service chậm hai giây, rồi on Error Resume. Đã chạy: ra fallback vì Timeout Exception. Khác Completable Future, timeout của Reactor gửi tín hiệu cancel ngược lên nguồn. Với Web Client, đó là đóng kết nối đang chờ.",
          "timeout(300 ms) → fallback; timeout gửi cancel lên nguồn.",
          lambda w: [OUT(S("er-c1", "er-c2", "er-c3", "er-rc", "er-rn") + ", " + AR("er-a1", "er-a2"), "blur", 0, 0.5),
                     IN("#er-tc", "blur", 0.5, 0.7), PULSE("#er-tc", w("Đã chạy")), IN("#er-tn", "up", w("Khác Completable"))]),
        B("Bộ ba khi gọi service ngoài là timeout, rồi retry When với backoff, rồi on Error Resume. Đặt timeout trước retry để mỗi lần thử có giới hạn riêng. Và nhớ: đừng retry một lời gọi thanh toán không có khoá idempotency, có thể trừ tiền hai lần.",
          "timeout → retryWhen(backoff) → onErrorResume.",
          lambda w: [OUT(S("er-tc", "er-tn"), "blur", 0, 0.5),
                     IN("#er-k1", "up", w("là timeout")), *AW("er-b1", w("rồi retry") - 0.3, 0.3), IN("#er-k2", "up", w("rồi retry")),
                     *AW("er-b2", w("rồi on Error") - 0.3, 0.3), IN("#er-k3", "up", w("rồi on Error")),
                     IN("#er-pay", "up", w("Và nhớ")), SHAKE("#er-pay", w("trừ tiền"))]),
        B("Retry là gọi lại thật, nên chỉ retry thao tác idempotent.",
          "Chỉ retry thao tác idempotent.",
          lambda w: [DIM(S("er-eye", "er-q", "er-k1", "er-k2", "er-k3", "er-pay") + ", " + AR("er-b1", "er-b2"), 0, 0.07),
                     TYPE("#er-t1", 0.3, 0.05), IN("#er-t2", "blur", w("nên chỉ"))]),
    ]),
    # ------------------------------------------------------------ context
    dict(id="context", world=(1920, 1080), hud="", cam="".join([
        head("cx", "Phần 5 · ThreadLocal và Reactor Context", "Context đi theo subscription", 76),
        titled("cx-mvc", 90, 290, 1740, 130, "Spring MVC", "1 request = 1 thread, từ đầu tới cuối", "", "violet", 40),
        *[tag(f"cx-m{i}", 90 + i * 590, 470, 560, 100, t, "cyan", 30)
          for i, t in enumerate(["SecurityContextHolder", "transaction", "MDC của log"])],
        note("cx-mn", 90, 610, 1740, "đều cất trong ThreadLocal", "green", 32),
        tag("cx-h1", 90, 310, 500, 110, "event loop", "cyan", 32),
        tag("cx-h2", 710, 310, 500, 110, "thread của driver", "cyan", 32),
        tag("cx-h3", 1330, 310, 500, 110, "boundedElastic", "cyan", 32),
        bigerr("cx-e1", 90, 500, 1740, "✕ ThreadLocal không đi theo request khi đổi thread", 32),
        bigerr("cx-e2", 90, 620, 1740, "✕ Một event loop phục vụ nhiều request xen kẽ: có thể lộ dữ liệu", 32),
        cbox("cx-tl", 90, 260, 860, "ThreadLocal",
             "ThreadLocal<String> TL = new ThreadLocal<>();\n"
             "TL.set(\"req-42\");\n"
             "Mono.just(1)\n"
             "  .publishOn(Schedulers.parallel())\n"
             "  .doOnNext(i -> log(\"TL = \" + TL.get()))\n"
             "  .block();", "violet", 24),
        cbox("cx-ct", 970, 260, 860, "Reactor Context",
             "Mono.deferContextual(ctx ->\n"
             "    Mono.just(\"Context = \" + ctx.get(\"traceId\")))\n"
             "  .publishOn(Schedulers.parallel())\n"
             "  .contextWrite(Context.of(\"traceId\", \"req-42\"))\n"
             "  .block();", "violet", 24),
        tag("cx-r1", 90, 660, 860, 100, "[parallel-1] ThreadLocal = null", "red", 30),
        tag("cx-r2", 970, 660, 860, 100, "Context = req-42", "green", 30),
        note("cx-rn", 970, 790, 860, "gắn với subscription, không gắn với thread", "green", 30),
        *[box(f"cx-s{i}", 90, 270 + i * 135, 1740, 110, row(k, t, 38, 30), "cyan", "row")
          for i, (k, t) in enumerate([("Security", "ReactiveSecurityContextHolder thay SecurityContextHolder"),
                                      ("Transaction", "ReactiveTransactionManager với R2DBC"),
                                      ("MDC, tracing", "spring.reactor.context-propagation=auto")])],
        take("cx", "Gắn với subscription", "không gắn với thread · ThreadLocal thì gắn với thread"),
        wires(arrow("cx-a1", [(595, 365), (705, 365)], "muted"), arrow("cx-a2", [(1215, 365), (1325, 365)], "muted")),
    ]), beats=[
        B("Spring MVC dựa vào Thread Local, vì một request chạy trên một thread từ đầu tới cuối. Security Context Holder, transaction, MDC của log đều cất ở đó.",
          "MVC: một request một thread, nên ThreadLocal dùng được.",
          lambda w: [IN("#cx-eye", "blur"), TYPE("#cx-q", 0.2, 0.05), *shrink("cx", w("vì một") - 0.8), IN("#cx-mvc", "up", w("vì một")),
                     IN("#cx-m0", "up", w("Security Context")), IN("#cx-m1", "up", w("transaction")), IN("#cx-m2", "up", w("MDC")), IN("#cx-mn", "up", w("đều cất"))]),
        B("Trong WebFlux, giả định đó sai. Một request có thể bắt đầu trên event loop, chạy tiếp trên thread của driver, rồi sang bounded Elastic. Thread Local vừa không đi theo request, vừa có thể lộ dữ liệu của request khác.",
          "Request đổi thread giữa các bước: ThreadLocal mất hoặc lẫn.",
          lambda w: [OUT(S("cx-mvc", "cx-m0", "cx-m1", "cx-m2", "cx-mn"), "blur", 0, 0.5),
                     IN("#cx-h1", "up", w("trên event loop")), *AW("cx-a1", w("chạy tiếp"), 0.4), IN("#cx-h2", "up", w("chạy tiếp") + 0.3),
                     *AW("cx-a2", w("rồi sang"), 0.4), IN("#cx-h3", "up", w("rồi sang") + 0.3),
                     IN("#cx-e1", "up", w("vừa không")), IN("#cx-e2", "up", w("vừa có thể"))]),
        B("Đã chạy: đặt Thread Local là req bốn mươi hai trên thread main, rồi publish On parallel. Bên trong do On Next, trên thread parallel một, đọc được null.",
          "ThreadLocal sau publishOn: null.",
          lambda w: [OUT(S("cx-h1", "cx-h2", "cx-h3", "cx-e1", "cx-e2") + ", " + AR("cx-a1", "cx-a2"), "blur", 0, 0.5),
                     IN("#cx-tl", "blur", 0.5, 0.6), IN("#cx-r1", "up", w("đọc được")), SHAKE("#cx-r1", w("null"))]),
        B("Reactor có Context: một map bất biến gắn với subscription, không gắn với thread. Ghi bằng context Write ở cuối chuỗi, đọc bằng defer Contextual. Cùng publish On parallel, vẫn đọc được req bốn mươi hai.",
          "Reactor Context: vẫn đọc được req-42.",
          lambda w: [IN("#cx-ct", "blur", 0.3, 0.6), PULSE("#cx-ct", w("Ghi bằng")), IN("#cx-r2", "up", w("vẫn đọc")), IN("#cx-rn", "up", w("vẫn đọc") + 0.6)]),
        B("Spring dùng sẵn cơ chế này. Security dùng Reactive Security Context Holder. Transaction với R2DBC nằm trong Context. Còn MDC và tracing, Spring Boot ba chấm hai trở lên bật context propagation bằng một property, tự chép từ Context sang MDC ở mỗi bước.",
          "ReactiveSecurityContextHolder · ReactiveTransactionManager · context propagation.",
          lambda w: [OUT(S("cx-tl", "cx-ct", "cx-r1", "cx-r2", "cx-rn"), "blur", 0, 0.5),
                     IN("#cx-s0", "left", w("Security dùng")), IN("#cx-s1", "left", w("Transaction")), IN("#cx-s2", "left", w("Còn MDC"))]),
        B("Nhớ một câu: Context gắn với subscription, còn Thread Local gắn với thread.",
          "Context gắn với subscription, không gắn với thread.",
          lambda w: [DIM(S("cx-eye", "cx-q", "cx-s0", "cx-s1", "cx-s2"), 0, 0.07), TYPE("#cx-t1", w("Context gắn"), 0.05), IN("#cx-t2", "blur", w("còn Thread"))]),
    ]),
    # ------------------------------------------------------------ vs-virtual-threads
    dict(id="vs-virtual-threads", world=(1920, 1080), hud="", cam="".join([
        head("vt", "Phần 6 · Chọn công cụ", "WebFlux hay virtual thread?"),
        rule("vt-rule", "Cùng một bài toán, hai cách giải", "Virtual thread: code vẫn chờ tuần tự, nhưng JVM gỡ nó khỏi carrier thread khi chờ"),
        note("vt-cap", 90, 250, 1740, "Đã đo: mỗi request chờ 100 ms · số là request/giây", "", 30),
        tag("vt-h1", 640, 310, 470, 80, "200 client", "violet", 30),
        tag("vt-h2", 1140, 310, 690, 80, "1000 client", "violet", 30),
        *[tag(f"vt-l{i}", 90, 410 + i * 150, 520, 130, t, "cyan", 30)
          for i, t in enumerate(["MVC thread thường", "MVC virtual thread", "WebFlux"])],
        *[titled(f"vt-a{i}", 640, 410 + i * 150, 470, 130, "", v, "", "cyan", 36)
          for i, v in enumerate(["1244 – 1276", "1107 – 1243", "1146 – 1593"])],
        *[titled(f"vt-b{i}", 1140, 410 + i * 150, 690, 130, "", v, s, tone, 36)
          for i, (v, s, tone) in enumerate([("1691 – 1851", "trung vị ≈ 520 ms", "red"),
                                            ("2168 – 2362", "trung vị ≈ 330 ms", "green"),
                                            ("2863 – 3123", "trung vị 190 – 256 ms", "green")])],
        note("vt-warn", 90, 870, 1740, "Client tạo tải chạy cùng laptop: tin xu hướng, đừng tin số tuyệt đối", "", 28),
        card("vt-c1", 90, 260, 860, 430, "MVC + virtual thread", "Code tuần tự, stack trace dễ đọc. JDBC, JPA, RestClient, ThreadLocal vẫn chạy. Hợp service CRUD.", "cyan", 46, 32),
        card("vt-c2", 970, 260, 860, 430, "WebFlux", "Streaming SSE, WebSocket, backpressure, gateway, hệ thống đã reactive từ đầu tới cuối.", "violet", 46, 32),
        bigerr("vt-pool", 90, 740, 1740, "✕ Virtual thread không làm DB pool to ra: 10 connection vẫn chỉ 10 query cùng lúc", 32),
        take("vt", "Chọn theo bài toán", "CRUD chờ DB: virtual thread · streaming, backpressure: WebFlux"),
    ]), beats=[
        B("Từ Java hai mươi mốt, virtual thread giải cùng bài toán theo cách khác. Code vẫn chờ tuần tự như cũ, nhưng khi chờ mạng hay database, JVM gỡ nó khỏi carrier thread, nên chờ gần như miễn phí. Spring Boot ba chấm hai chỉ cần bật một property.",
          "Virtual thread: code vẫn tuần tự, chờ gần như miễn phí.",
          lambda w: [IN("#vt-eye", "blur"), TYPE("#vt-q", 0.2, 0.05), IN("#vt-rule", "up", w("Code vẫn"))]),
        B("Đã đo trên cùng app, mỗi request chờ một trăm mili giây. Với hai trăm client đồng thời, ba cách gần ngang nhau, khoảng một nghìn một trăm tới một nghìn sáu trăm request mỗi giây, vì hai trăm thread vẫn đủ cho hai trăm client.",
          "200 client: ba cách gần ngang nhau.",
          lambda w: [OUT("#vt-rule", "blur", 0, 0.4), *shrink("vt", 0), IN("#vt-cap", "up", 0.6),
                     IN(S("vt-l0", "vt-l1", "vt-l2"), "left", 1.0, 0.5, 0.15), IN("#vt-h1", "up", w("Với hai trăm")),
                     IN(S("vt-a0", "vt-a1", "vt-a2"), "up", w("ba cách"), 0.5, 0.2)]),
        B("Với một nghìn client, khác biệt mới lộ ra. MVC thread thường khoảng một nghìn bảy tới một nghìn tám, trung vị năm trăm hai mươi mili giây, vì một nghìn request xếp hàng chờ hai trăm thread. Virtual thread khoảng hai nghìn hai tới hai nghìn ba. WebFlux khoảng hai nghìn chín tới ba nghìn một.",
          "1000 client: pool 200 thread bắt đầu xếp hàng.",
          lambda w: [IN("#vt-h2", "up", 0.2), IN("#vt-b0", "up", w("MVC thread")), SHAKE("#vt-b0", w("xếp hàng")),
                     IN("#vt-b1", "up", w("Virtual thread khoảng")), IN("#vt-b2", "up", w("WebFlux khoảng"))]),
        B("Client tạo tải chạy cùng laptop, nên hãy tin xu hướng, đừng tin số tuyệt đối. Khi số request vượt số thread, pool thường bắt đầu xếp hàng, còn virtual thread và WebFlux thì không.",
          "Tin xu hướng, không tin số tuyệt đối.",
          lambda w: [IN("#vt-warn", "up", 0.2), PULSE("#vt-b0", w("pool thường")), PULSE(S("vt-b1", "vt-b2"), w("còn virtual"))]),
        B("Vậy chọn thế nào? Service CRUD dùng JPA và gọi API khác: MVC với virtual thread, giữ code tuần tự, JDBC và Thread Local vẫn chạy. WebFlux hợp streaming như SSE, cần backpressure, gateway, hoặc hệ thống đã reactive từ đầu tới cuối.",
          "CRUD: MVC + virtual thread. Streaming, gateway: WebFlux.",
          lambda w: [OUT(S("vt-cap", "vt-h1", "vt-h2", "vt-warn", *[f"vt-{c}{i}" for c in "lab" for i in range(3)]), "blur", 0, 0.5),
                     IN("#vt-c1", "up", w("Service CRUD")), IN("#vt-c2", "up", w("WebFlux hợp"))]),
        B("Và nhớ: virtual thread không làm database pool to ra. Mười connection thì vẫn chỉ mười query cùng lúc, dù là MVC hay WebFlux.",
          "DB pool vẫn là giới hạn thật.",
          lambda w: [IN("#vt-pool", "up", 0.3), SHAKE("#vt-pool", w("Mười connection"))]),
        B("Chọn theo bài toán: code CRUD chờ database thì virtual thread, streaming và backpressure thì WebFlux.",
          "Chọn theo bài toán.",
          lambda w: [DIM(S("vt-eye", "vt-q", "vt-c1", "vt-c2", "vt-pool"), 0, 0.07), TYPE("#vt-t1", 0.2, 0.05), IN("#vt-t2", "blur", w("code CRUD"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt WebFlux"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 190 + i * 110, 1660, 94, row(k, t, 40, 32), "cyan", "row")
          for i, (k, t) in enumerate([("Event loop", "ít thread, không ai được chờ"),
                                      ("Reactor", "lazy · map vs flatMap · backpressure"),
                                      ("Blocking", "sleep 100 ms trong event loop: 75 request/giây"),
                                      ("Lỗi", "timeout → retryWhen → onErrorResume"),
                                      ("Context", "thay ThreadLocal, gắn với subscription"),
                                      ("Chọn", "CRUD: virtual thread · streaming: WebFlux")])],
        el("ou-cta", 0, 880, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Event loop dùng ít thread, và không ai được chờ. Reactor lazy: không subscribe thì không chạy, map cho giá trị thường, flatMap cho Mono và Flux.",
          "Event loop và Reactor.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Event loop dùng")), IN("#ou-r1", "right", w("Reactor lazy"))]),
        B("Một chỗ blocking trong event loop kéo throughput về bảy mươi lăm request mỗi giây. Gọi service ngoài thì timeout, retry có backoff, rồi fallback.",
          "Cấm blocking; timeout, retry, fallback.",
          lambda w: [IN("#ou-r2", "right", w("Một chỗ")), IN("#ou-r3", "right", w("Gọi service"))]),
        B("Thread Local không đi theo request, hãy dùng Reactor Context. Và với service CRUD, virtual thread thường đơn giản hơn; WebFlux dành cho streaming và hệ thống đã reactive.",
          "Reactor Context; chọn đúng công cụ.",
          lambda w: [IN("#ou-r4", "right", w("Thread Local")), IN("#ou-r5", "right", w("Và với"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
