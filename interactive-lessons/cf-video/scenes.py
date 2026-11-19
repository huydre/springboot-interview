"""CompletableFuture explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Measured on JDK 21 (8 CPUs), times vary by a few ms between runs:
supplyAsync without executor runs on ForkJoinPool.commonPool-worker-N, parallelism 7; 14 tasks x 1 s: commonPool 2022 ms,
own pool of 20 threads 1053 ms; completedFuture(1).thenApply runs on main; thenApply returning a CF joins to a
CompletableFuture; thenCompose -> [o1, o2]; thenCombine 300 ms + 500 ms -> "user-1 has 2 orders" in 517 ms;
allOf 200/400/600 ms -> [s200, s400, s600] in 686 ms; anyOf -> fast in 225 ms; exceptionally sees CompletionException
(cause "svc down") and returns -1; handle -> fallback; whenComplete still throws CompletionException;
orTimeout(500 ms) -> TimeoutException after 519 ms; completeOnTimeout -> cached-default after 511 ms while the task still
finished at 2010 ms; cancel(true) -> true, join -> CancellationException, task not interrupted, finished at 823 ms;
join() -> CompletionException, get() -> ExecutionException (cause IllegalStateException); getNow -> default;
dashboard: sequential 822 ms, parallel 503 ms, orders failing 511 ms -> [], orders 3 s 1012 ms -> [].
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

MS = 0.6  # px per millisecond on the timing bars

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #13", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Màn hình cần 2 service: gọi thế nào?"), "h1 center r"),
        gnode("hk-p", 360, 400, 360, 100, "profile · 300 ms", "cyan"),
        gnode("hk-o", 1200, 400, 360, 100, "orders · 500 ms", "violet"),
        chip("hk-seq", 360, 560, "Tuần tự: 822 ms (≈ tổng)", "red"),
        chip("hk-par", 1200, 560, "Song song: 503 ms (≈ việc chậm nhất)", "green"),
        tile("hk-tile", 360, 350, 220, "share"),
        el("hk-word", 630, 380, 1300, None, letters("CompletableFuture"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "executor riêng · thenCombine · lỗi · timeout · fallback", "kin-sub r"),
    ]), beats=[
        ("Màn hình cần dữ liệu từ hai service: profile mất ba trăm mili giây, đơn hàng mất năm trăm. Gọi thế nào cho nhanh?",
         "Màn hình cần 2 service: profile 300 ms, orders 500 ms. Gọi thế nào cho nhanh?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-p", "pop", 2.4), IN("#hk-o", "pop", 3.4)]),
        ("Gọi tuần tự mất tám trăm hai mươi hai mili giây. Gọi song song chỉ còn năm trăm lẻ ba.",
         "Tuần tự: 822 ms. Song song: 503 ms.",
         [IN("#hk-seq", "pop", 0.3), IN("#hk-par", "pop", 2.4), PULSE("#hk-par", 3.4)]),
        ("Hôm nay ta học Completable Future.", "Hôm nay: CompletableFuture.",
         [OUT("#hk-eye, #hk-q, #hk-p, #hk-o, #hk-seq, #hk-par", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7),
          TYPE("#hk-word", 0.6, 0.03), IN("#hk-sub", "blur", 1.3)]),
    ]),
    # ------------------------------------------------------------ why
    dict(id="why", world=(1920, 1080), hud=hud("wy", "Vì sao cần CompletableFuture", "Future chỉ biết chờ"), cam="".join([
        big_title("wy", "CompletableFuture", "Một dây chuyền lắp ráp bất đồng bộ"),
        box("wy-old", 160, 200, 760, 220, win("Future") + code("Future<User> f = ex.submit(task);\nUser u = f.get();   // chặn thread\n// không gộp, không xử lý lỗi kiểu chuỗi"), "muted", "code"),
        box("wy-new", 1000, 200, 760, 220, win("CompletableFuture") + code("supplyAsync(() -> loadUser(id), io)\n    .thenApply(User::name)\n    .exceptionally(ex -> \"guest\");"), "cyan", "code"),
        chip("wy-m1", 1000, 470, "thenApply ≈ map của Stream", "green"),
        chip("wy-m2", 1000, 550, "thenCompose ≈ flatMap", "violet"),
    ]), beats=[
        ("Phần một: vì sao cần Completable Future?", "Phần 1: vì sao cần CompletableFuture?",
         [TYPE("#wy-big", 0.1, 0.03), IN("#wy-bsub", "blur", 1.0)]),
        ("Future chỉ cho ta chờ kết quả bằng hàm get, và get chặn thread. Không gộp được, không xử lý lỗi theo chuỗi.",
         "Future chỉ cho chờ bằng get(), và get() chặn thread. Không gộp, không xử lý lỗi theo chuỗi.",
         [OUT("#wy-big, #wy-bsub", "zoom"), IN("#wy-hud", "left", 0.2), IN("#wy-old", "left", 0.4)]),
        ("Completable Future là một dây chuyền: mỗi bước khai báo, khi bước trước xong thì làm gì. Then apply giống map, then compose giống flat map.",
         "CompletableFuture là dây chuyền: mỗi bước khai báo việc làm tiếp. thenApply ≈ map, thenCompose ≈ flatMap.",
         [IN("#wy-new", "right", 0.3), IN("#wy-m1", "left", 5.0), IN("#wy-m2", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ default pool vs own executor
    dict(id="pool", world=(1920, 1080), hud=hud("pl", "supplyAsync và executor riêng", "Mặc định chạy trên commonPool"), cam="".join([
        console("pl-con", 160, 190, 900, ["ForkJoinPool.commonPool-worker-1", "commonPool parallelism = 7 (máy 8 CPU)"]),
        el("pl-l", 160, 400, 1600, None, "14 task, mỗi task chờ 1 giây (giả lập gọi API):", "lbl r", "text-align:left"),
        box("pl-b1", 160, 450, int(2022 * MS), 90, "<b>commonPool: 2022 ms</b>", "red", "card"),
        box("pl-b2", 160, 570, int(1053 * MS), 90, "<b>pool riêng 20 thread: 1053 ms</b>", "green", "card"),
        el("pl-why", 1440, 460, 380, None, "7 thread: chạy 2 đợt", "note left r"),
        el("pl-rule", 160, 710, 1600, None, "Tác vụ I/O luôn truyền executor riêng: commonPool dùng chung với parallel stream và mọi supplyAsync khác", "warnbox r"),
        el("pl-async", 160, 840, 1600, None, "thenApply không có Async chạy trên thread hoàn thành bước trước: completedFuture(1).thenApply(...) chạy trên main", "note left r"),
    ]), beats=[
        ("Phần hai: supply async không truyền executor thì chạy trên fork join pool chung, máy tám CPU có bảy thread.",
         "Phần 2: supplyAsync không truyền executor chạy trên ForkJoinPool.commonPool: 7 thread trên máy 8 CPU.",
         [IN("#pl-hud", "left", 0.1), IN("#pl-con", "up", 0.6, 0.4), IN("#pl-con-1", "type1", 1.0, 0.3), IN("#pl-con-2", "type1", 4.4, 0.3)]),
        ("Mười bốn task, mỗi task chờ một giây. Trên pool chung mất hai giây, vì chỉ bảy thread nên chạy hai đợt. Pool riêng hai mươi thread chỉ mất một giây.",
         "14 task × 1 giây: commonPool 2022 ms (7 thread, 2 đợt); pool riêng 20 thread 1053 ms.",
         [IN("#pl-l", "fade", 0.2), IN("#pl-b1", "left", 1.2, 0.8), IN("#pl-why", "up", 3.4), IN("#pl-b2", "left", 6.4, 0.8)]),
        ("Quy tắc: tác vụ vào ra luôn truyền executor riêng. Và các hàm không có chữ async chạy trên thread vừa hoàn thành bước trước.",
         "Quy tắc: tác vụ I/O luôn truyền executor riêng. Hàm không có Async chạy trên thread hoàn thành bước trước.",
         [IN("#pl-rule", "up", 0.3), IN("#pl-async", "up", 4.0)]),
    ]),
    # ------------------------------------------------------------ thenApply / thenCompose / thenCombine circuit
    dict(id="chain", world=(1920, 1080), hud=hud("ch", "thenApply, thenCompose, thenCombine", "map, flatMap, zip"), cam="".join([
        gnode("ch-a", 120, 220, 360, 100, "supplyAsync: userId", "cyan"),
        gnode("ch-b", 760, 220, 420, 100, "orderService(userId)", "violet"),
        el("ch-al", 480, 190, 280, None, "thenCompose", "lbl r"),
        el("ch-an", 1220, 225, 600, None, "bước sau cần kết quả bước trước: phẳng, không lồng CF", "note left r"),
        gnode("ch-p", 120, 500, 360, 100, "profile · 300 ms", "cyan"),
        gnode("ch-o", 120, 680, 360, 100, "orders · 500 ms", "violet"),
        gnode("ch-c", 760, 590, 360, 100, "thenCombine", "green"),
        gnode("ch-v", 1360, 590, 400, 100, "View · 517 ms", "green"),
        el("ch-cn", 1360, 720, 420, None, "2 việc độc lập chạy song song: ≈ việc chậm hơn", "note left r"),
        el("ch-bad", 120, 860, 1700, None, "thenApply với hàm trả CF → CompletableFuture lồng nhau. thenCompose cho 2 việc độc lập → biến thành tuần tự", "warnbox r"),
        wires(trace("ch-t0", [(480, 270), (752, 270)], "violet"),
              trace("ch-t1", [(480, 550), (620, 550), (620, 640), (752, 640)], "cyan", r=24),
              trace("ch-t2", [(480, 730), (620, 730), (620, 640), (752, 640)], "violet", r=24),
              trace("ch-t3", [(1120, 640), (1352, 640)], "green")),
    ]), beats=[
        ("Phần ba: then compose dùng khi bước sau là một việc bất đồng bộ, cần kết quả của bước trước. Nó làm phẳng, thay vì cho ra future lồng nhau.",
         "Phần 3: thenCompose khi bước sau là việc async cần kết quả bước trước: làm phẳng, không lồng CF.",
         [IN("#ch-hud", "left", 0.1), IN("#ch-a", "pop", 0.6), DRAW("#ch-t0-p", 1.0, 0.4), IN("#ch-al", "fade", 1.2),
          IN("#ch-b", "pop", 1.6), COMET("ch-t0", 2.4, 0.5), LIGHT("#ch-b", 2.9), IN("#ch-an", "up", 5.0)]),
        ("Then combine gộp hai việc độc lập chạy song song. Profile ba trăm, đơn hàng năm trăm: gộp lại chỉ mất năm trăm mười bảy mili giây.",
         "thenCombine gộp 2 việc độc lập chạy song song: 300 ms + 500 ms → 517 ms.",
         [IN("#ch-p, #ch-o", "pop", 0.3, 0.4, 0.15), DRAW("#ch-t1-p", 1.0, 0.4), DRAW("#ch-t2-p", 1.0, 0.4), IN("#ch-c", "pop", 1.4),
          COMET("ch-t1", 1.8, 0.4), COMET("ch-t2", 1.8, 0.6), LIGHT("#ch-c", 2.5), DRAW("#ch-t3-p", 2.8, 0.3),
          IN("#ch-v", "pop", 3.0), COMET("ch-t3", 3.1, 0.4), LIGHT("#ch-v", 3.5), IN("#ch-cn", "up", 4.6)]),
        ("Hai bẫy: then apply với hàm trả future sẽ ra future lồng nhau. Còn then compose cho hai việc độc lập biến chúng thành tuần tự.",
         "Bẫy: thenApply với hàm trả CF → CF lồng nhau. thenCompose cho 2 việc độc lập → thành tuần tự.",
         [IN("#ch-bad", "up", 0.3), SHAKE("#ch-bad", 2.4)]),
    ]),
    # ------------------------------------------------------------ allOf / anyOf as timing lanes
    dict(id="allany", world=(1920, 1080), hud=hud("aa", "allOf và anyOf", "Chờ tất cả, hay lấy cái đầu tiên"), cam="".join([
        "".join(box(f"aa-l{i}", 300, 230 + i * 110, int(t * MS * 1.6), 80, f"<b>{t} ms</b>", "cyan", "card")
                for i, t in enumerate((200, 400, 600))),
        el("aa-lab", 120, 250, 160, None, "3 việc", "lbl r", "text-align:left"),
        el("aa-done", 300 + int(686 * MS * 1.6) - 4, 200, 8, 360, "", "r", "background:#4ade80;box-shadow:0 0 18px #4ade80"),
        chip("aa-all", 160, 600, "allOf → [s200, s400, s600] sau 686 ms ≈ việc lâu nhất", "green"),
        el("aa-void", 160, 690, 1600, None, "allOf trả CompletableFuture&lt;Void&gt;: gom kết quả bằng cách join từng CF sau đó (lúc này không còn chặn)", "note left r"),
        chip("aa-any", 160, 790, "anyOf(slow 600 ms, fast 200 ms) → fast sau 225 ms", "violet"),
        el("aa-err", 160, 880, 1600, None, "Một CF lỗi thì allOf lỗi; anyOf trả cái đầu tiên, kể cả khi đó là lỗi", "note left r"),
    ]), beats=[
        ("Phần bốn: all of chờ tất cả xong. Ba việc hai trăm, bốn trăm, sáu trăm mili giây: xong sau sáu trăm tám mươi sáu, xấp xỉ việc lâu nhất.",
         "Phần 4: allOf chờ tất cả. 200, 400, 600 ms → xong sau 686 ms, ≈ việc lâu nhất.",
         [IN("#aa-hud", "left", 0.1), IN("#aa-lab", "fade", 1.0), IN("#aa-l0, #aa-l1, #aa-l2", "left", 1.2, 0.6, 0.2),
          IN("#aa-done", "fade", 6.4, 0.3), IN("#aa-all", "pop", 7.0)]),
        ("All of trả về future rỗng, nên gom kết quả bằng cách join từng cái sau đó.", "allOf trả CompletableFuture<Void>: join từng CF để gom kết quả.",
         [IN("#aa-void", "up", 0.3)]),
        ("Any of lấy kết quả đầu tiên: việc nhanh xong sau hai trăm hai mươi lăm mili giây. Lưu ý, một việc lỗi là all of lỗi.",
         "anyOf lấy cái đầu tiên: fast sau 225 ms. Một CF lỗi thì allOf lỗi.",
         [IN("#aa-any", "left", 0.3), IN("#aa-err", "up", 3.8)]),
    ]),
    # ------------------------------------------------------------ error handling as a circuit
    dict(id="errors", world=(1920, 1080), hud=hud("er", "Xử lý lỗi", "exceptionally, handle, whenComplete"), cam="".join([
        gnode("er-f", 100, 260, 380, 110, "supplyAsync: ném lỗi", "red"),
        gnode("er-a", 620, 260, 360, 110, "thenApply(x * 2)", "muted"),
        gnode("er-x", 1120, 260, 380, 110, "exceptionally → -1", "green"),
        el("er-skip", 620, 465, 400, None, "bị bỏ qua, không chạy", "note r"),
        el("er-ce", 1120, 465, 700, None, "ex là CompletionException, cause = \"svc down\"", "note left r"),
        chip("er-1", 100, 540, "exceptionally: chỉ chạy khi lỗi, trả giá trị fallback", "green"),
        chip("er-2", 100, 620, "handle: luôn chạy, nhận cả (v, ex), đổi được kết quả → \"fallback\"", "cyan"),
        chip("er-3", 100, 700, "whenComplete: luôn chạy nhưng không đổi kết quả → join() vẫn ném", "amber"),
        el("er-w", 100, 800, 1700, None, "Không gắn xử lý lỗi và không ai join(): lỗi biến mất không dấu vết", "warnbox r"),
        wires(trace("er-t0", [(480, 315), (612, 315)], "red"), trace("er-t1", [(980, 315), (1112, 315)], "red"),
              trace("er-tz", [(290, 370), (290, 440), (1300, 440), (1300, 378)], "red", r=26)),
    ]), beats=[
        ("Phần năm: một bước ném lỗi thì các bước sau bị bỏ qua, lỗi trôi xuống tới bước xử lý lỗi đầu tiên.",
         "Phần 5: một bước lỗi thì các bước sau bị bỏ qua, lỗi trôi tới bước xử lý lỗi đầu tiên.",
         [IN("#er-hud", "left", 0.1), IN("#er-f", "pop", 0.4), LIGHT("#er-f", 0.8), IN("#er-a", "pop", 1.0), IN("#er-x", "pop", 1.3),
          DRAW("#er-t0-p", 1.6, 0.3), DRAW("#er-t1-p", 1.8, 0.3), DIM("#er-a, #er-t0, #er-t1", 2.2, 0.3), IN("#er-skip", "up", 2.4),
          DRAW("#er-tz-p", 2.8, 0.5), COMET("er-tz", 3.3, 0.6), LIGHT("#er-x", 3.9), IN("#er-ce", "up", 4.2)]),
        ("Exceptionally chỉ chạy khi lỗi, trả giá trị dự phòng. Handle luôn chạy và đổi được kết quả. When complete cũng luôn chạy, nhưng chỉ quan sát, lỗi vẫn trôi tiếp.",
         "exceptionally: chỉ khi lỗi, trả fallback. handle: luôn chạy, đổi được kết quả. whenComplete: chỉ quan sát, lỗi vẫn trôi.",
         [IN("#er-1", "left", 0.3), IN("#er-2", "left", 3.0), IN("#er-3", "left", 5.6)]),
        ("Không gắn xử lý lỗi, và không ai gọi join, thì lỗi biến mất không dấu vết.", "Không xử lý lỗi và không ai join(): lỗi biến mất không dấu vết.",
         [IN("#er-w", "up", 0.3), SHAKE("#er-w", 1.4)]),
    ]),
    # ------------------------------------------------------------ timeouts
    dict(id="timeout", world=(1920, 1080), hud=hud("to", "Timeout", "orTimeout, completeOnTimeout (Java 9)"), cam="".join([
        box("to-code", 160, 190, 1600, 190, code(
            "supplyAsync(() -> { sleep(2000); return \"late\"; }, io)\n    .orTimeout(500, MILLISECONDS);                       // lỗi TimeoutException\n"
            "    // hoặc .completeOnTimeout(\"cached-default\", 500, MILLISECONDS)"), "cyan", "code"),
        console("to-con", 160, 410, 1100, ["orTimeout: TimeoutException sau 519 ms", "completeOnTimeout: cached-default sau 511 ms", "task bên dưới vẫn chạy xong ở 2010 ms"]),
        el("to-hero", 160, 640, 1600, None, "Timeout không dừng task bên dưới", "glow r", "font-size:72px;text-align:left;--tone:var(--amber)"),
        el("to-cancel", 160, 760, 1600, None, "cancel(true) trả true, join() ném CancellationException, nhưng task không nhận interrupt và vẫn chạy xong", "note left r"),
        chip("to-fix", 160, 850, "Đặt timeout ở tầng HTTP client, JDBC: lời gọi tự ném lỗi và trả thread", "green"),
    ]), beats=[
        ("Phần sáu: timeout. Or timeout làm future lỗi khi quá giờ. Complete on timeout trả về giá trị mặc định.",
         "Phần 6: orTimeout làm CF lỗi khi quá giờ. completeOnTimeout trả giá trị mặc định.",
         [IN("#to-hud", "left", 0.1), IN("#to-code", "up", 0.4), IN("#to-con", "up", 3.0, 0.4), IN("#to-con-1", "type1", 3.4, 0.3),
          IN("#to-con-2", "type1", 5.4, 0.3)]),
        ("Nhưng timeout không dừng task bên dưới. Mình đo được: task vẫn chạy tiếp đủ hai giây, vẫn chiếm thread của pool.",
         "Nhưng timeout không dừng task bên dưới: đo được task vẫn chạy đủ 2 giây, vẫn chiếm thread.",
         [IN("#to-con-3", "type1", 0.3, 0.3), IN("#to-hero", "glowin", 1.2, 0.9)]),
        ("Cancel cũng không interrupt task. Hãy đặt timeout ở tầng HTTP client và JDBC.",
         "cancel(true) cũng không interrupt task. Đặt timeout ở tầng HTTP client và JDBC.",
         [IN("#to-cancel", "up", 0.3), IN("#to-fix", "left", 2.8)]),
    ]),
    # ------------------------------------------------------------ join vs get
    dict(id="joinget", world=(1920, 1080), hud=hud("jg", "join() vs get()", "Cả hai đều chặn"), cam="".join([
        box("jg-j", 160, 200, 760, 300, "<b>join()</b><small>CompletionException (unchecked)</small><small>không ném InterruptedException</small><small>gọn trong lambda, stream</small>", "green", "card"),
        box("jg-g", 1000, 200, 760, 300, "<b>get()</b><small>ExecutionException (checked)</small><small>ném InterruptedException</small><small>có get(timeout, unit)</small>", "amber", "card"),
        console("jg-con", 160, 560, 1100, ["join(): CompletionException, cause IllegalStateException", "get(): ExecutionException, cause IllegalStateException"]),
        el("jg-tip", 160, 740, 1600, None, "Chỉ gọi ở cuối, sau khi đã khởi chạy hết việc song song. Controller Spring MVC có thể trả thẳng CompletableFuture", "note green left r"),
    ]), beats=[
        ("Phần bảy: join ném completion exception không bắt buộc bắt. Get ném execution exception bắt buộc bắt, và có bản có timeout.",
         "Phần 7: join() ném CompletionException (unchecked). get() ném ExecutionException (checked), có bản timeout.",
         [IN("#jg-hud", "left", 0.1), IN("#jg-j", "left", 0.6), IN("#jg-g", "right", 3.6)]),
        ("Đã chạy với task lỗi: cả hai đều bọc lỗi gốc là illegal state exception.", "Đã chạy: cả hai bọc lỗi gốc IllegalStateException.",
         [IN("#jg-con", "up", 0.3, 0.4), IN("#jg-con-1", "type1", 0.7, 0.3), IN("#jg-con-2", "type1", 1.4, 0.3)]),
        ("Cả hai đều chặn thread, nên chỉ gọi ở cuối, sau khi đã khởi chạy hết các việc song song.", "Cả hai đều chặn: chỉ gọi ở cuối, sau khi đã khởi chạy hết việc song song.",
         [IN("#jg-tip", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ dashboard
    dict(id="dash", world=(1920, 1080), hud=hud("ds", "Dashboard gộp 2 service", "Song song, timeout, fallback"), cam="".join([
        gnode("ds-c", 80, 380, 300, 110, "Controller", "cyan"),
        gnode("ds-p", 560, 230, 420, 100, "profile · 300 ms", "cyan"),
        gnode("ds-o", 560, 540, 420, 100, "orders · 500 ms", "violet"),
        gnode("ds-fb", 1080, 540, 440, 100, "timeout 1 s, lỗi → []", "amber"),
        gnode("ds-v", 1580, 380, 260, 110, "View", "green"),
        wires(trace("ds-t1", [(380, 435), (470, 435), (470, 280), (552, 280)], "cyan", r=24),
              trace("ds-t2", [(380, 435), (470, 435), (470, 590), (552, 590)], "violet", r=24),
              trace("ds-t3", [(980, 590), (1072, 590)], "amber"),
              trace("ds-t4", [(980, 280), (1710, 280), (1710, 372)], "cyan", r=26),
              trace("ds-t5", [(1520, 590), (1710, 590), (1710, 498)], "amber", r=26)),
        chip("ds-r1", 80, 700, "Tuần tự: 822 ms", "red"),
        chip("ds-r2", 520, 700, "Song song: 503 ms, [o1, o2]", "green"),
        chip("ds-r3", 80, 790, "order-service lỗi: 511 ms, [] (fallback)", "amber"),
        chip("ds-r4", 820, 790, "order-service mất 3 s: 1012 ms, []", "amber"),
        el("ds-w", 80, 880, 1760, None, "Thread io-* vẫn bị order-service giữ thêm 2 giây: cần read timeout ở HTTP client và circuit breaker", "note left r"),
    ]), beats=[
        ("Phần tám: ví dụ thực tế. Controller khởi chạy hai việc song song trên executor riêng.",
         "Phần 8: Controller khởi chạy 2 việc song song trên executor riêng.",
         [IN("#ds-hud", "left", 0.1), IN("#ds-c", "pop", 0.4), LIGHT("#ds-c", 0.8), DRAW("#ds-t1-p", 1.0, 0.4), DRAW("#ds-t2-p", 1.0, 0.4),
          IN("#ds-p, #ds-o", "pop", 1.4, 0.4, 0.15), COMET("ds-t1", 2.0, 0.5), COMET("ds-t2", 2.0, 0.5), LIGHT("#ds-p", 2.5), LIGHT("#ds-o", 2.5)]),
        ("Phần đơn hàng có complete on timeout một giây và exceptionally, nên lỗi hay chậm đều trả danh sách rỗng. Rồi then combine gộp lại.",
         "orders có completeOnTimeout 1 s + exceptionally: lỗi hay chậm đều ra []. Rồi thenCombine gộp lại.",
         [DRAW("#ds-t3-p", 0.3, 0.3), IN("#ds-fb", "pop", 0.6), COMET("ds-t3", 0.8, 0.4), LIGHT("#ds-fb", 1.2),
          DRAW("#ds-t4-p", 3.6, 0.6), DRAW("#ds-t5-p", 3.6, 0.5), IN("#ds-v", "pop", 4.2), COMET("ds-t4", 4.4, 0.7), COMET("ds-t5", 4.4, 0.5), LIGHT("#ds-v", 5.1)]),
        ("Kết quả đo: tuần tự tám trăm hai mươi hai mili giây, song song năm trăm lẻ ba. Order service lỗi vẫn trả về sau năm trăm mười một, và treo ba giây thì màn hình vẫn trả về sau hơn một giây.",
         "Đo: tuần tự 822 ms, song song 503 ms. order-service lỗi: 511 ms. Treo 3 giây: màn hình vẫn trả về sau 1012 ms.",
         [IN("#ds-r1", "pop", 0.3), IN("#ds-r2", "pop", 2.4), IN("#ds-r3", "pop", 4.8), IN("#ds-r4", "pop", 7.4)]),
        ("Nhưng thread vẫn bị giữ thêm hai giây, nên cần timeout ở HTTP client và circuit breaker.",
         "Nhưng thread vẫn bị giữ thêm 2 giây: cần read timeout ở HTTP client và circuit breaker.",
         [IN("#ds-w", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("plug", "Executor riêng", "đừng dùng commonPool cho I/O"),
                                                ("share", "thenCombine", "song song ≈ việc chậm nhất"),
                                                ("shield", "exceptionally", "fallback cho từng nguồn"),
                                                ("lock", "Timeout", "không dừng task bên dưới")]),
        chip("ou-next", 650, 650, "Bài tiếp: synchronized, volatile, Atomic", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: tác vụ vào ra luôn dùng executor riêng. Then combine cho thời gian bằng việc chậm nhất. Gắn exceptionally cho từng nguồn. Và timeout không dừng task bên dưới.",
         "Executor riêng cho I/O · thenCombine ≈ việc chậm nhất · exceptionally cho từng nguồn · timeout không dừng task bên dưới.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.0), IN("#ou-c3", "pop", 8.2)]),
        ("Bài sau: synchronized, volatile, và atomic.", "Bài sau: synchronized, volatile, Atomic & ConcurrentHashMap.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
