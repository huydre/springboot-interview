"""ThreadPoolExecutor explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output was run on JDK 21 (8 CPUs):
core 2, max 4, ArrayBlockingQueue(10), 20 tasks sleeping 1 s: 1-2 create core threads, 3-12 queue (1..10),
13-14 create threads (3, 4), 15-20 REJECTED; 14 completed, 6 rejected in 4.0 s; start order of 14 tasks:
[1, 2, 13, 14, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; pool 1 thread queue 2, 5 tasks: DiscardPolicy runs [1, 2, 3],
DiscardOldestPolicy runs [1, 4, 5]; CallerRunsPolicy (1 thread, queue 1, 3 tasks of 1 s): submit loop 1005 ms, ran on
main and pool-5-thread-1; newFixedThreadPool(10): queue remainingCapacity 2147483647, 100,000 slow tasks -> threads=10,
queue=99990, no exception; newCachedThreadPool: 2000 sleeping tasks -> 2000 threads, max 2147483647;
shutdownNow with 1 running + 4 queued -> returned 4, running task interrupted; execute after shutdownNow ->
RejectedExecutionException.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

TH_X = [160 + k * 220 for k in range(4)]      # 4 thread slots
Q_X = [160 + k * 160 for k in range(10)]      # 10 queue slots
RJ_X = [160 + k * 170 for k in range(6)]      # 6 rejected
# where each of the 20 tasks lands: ("t", slot) thread, ("q", slot) queue, ("r", slot) rejected
LAND = {1: ("t", 0), 2: ("t", 1), **{i: ("q", i - 3) for i in range(3, 13)}, 13: ("t", 2), 14: ("t", 3),
        **{i: ("r", i - 15) for i in range(15, 21)}}


def task_chip(i):
    kind, k = LAND[i]
    if kind == "t":
        x, y, tone = TH_X[k] + 70, 290, "green"
    elif kind == "q":
        x, y, tone = Q_X[k] + 38, 492, "cyan"
    else:
        x, y, tone = RJ_X[k] + 30, 700, "red"
    return chip(f"sm-k{i}", x, y, str(i), tone)


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #12", "eyebrow r"),
        box("hk-code", 360, 240, 1200, 200, code(
            "new ThreadPoolExecutor(2, 4, 60, SECONDS, new ArrayBlockingQueue<>(10));\n// submit liên tục 20 task, mỗi task chạy 1 giây"), "cyan", "code"),
        chip("hk-a1", 360, 490, "4 task đang chạy", "green"),
        chip("hk-a2", 720, 490, "10 task chờ trong queue", "cyan"),
        chip("hk-a3", 1180, 490, "6 task bị reject", "red"),
        tile("hk-tile", 330, 350, 220, "split"),
        el("hk-word", 600, 380, 1300, None, letters("ThreadPoolExecutor"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "core → queue → max → reject · policy · bẫy Executors · shutdown", "kin-sub r"),
    ]), beats=[
        ("Pool có hai thread lõi, tối đa bốn, hàng đợi mười chỗ. Gửi liên tục hai mươi task chạy lâu thì sao?",
         "Core 2, max 4, queue 10. Submit 20 task chạy lâu thì sao?",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        ("Bốn task chạy, mười task chờ, và sáu task bị từ chối.", "4 task chạy, 10 task chờ, 6 task bị reject.",
         [IN("#hk-a1", "pop", 0.2), IN("#hk-a2", "pop", 1.0), IN("#hk-a3", "pop", 2.0), SHAKE("#hk-a3", 2.5)]),
        ("Hôm nay ta học thread pool, và cách nó xử lý từng task.", "Hôm nay: ThreadPoolExecutor.",
         [OUT("#hk-eye, #hk-code, #hk-a1, #hk-a2, #hk-a3", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7),
          TYPE("#hk-word", 0.6, 0.03), IN("#hk-sub", "blur", 1.3)]),
    ]),
    # ------------------------------------------------------------ why pools + parameters
    dict(id="why", world=(1920, 1080), hud=hud("wy", "Vì sao cần thread pool", "Như quầy giao dịch ngân hàng"), cam="".join([
        big_title("wy", "Thread pool", "Như quầy giao dịch ngân hàng"),
        el("wy-bad", 160, 200, 1600, None, "new Thread() cho mỗi việc: tải tăng là số thread tăng không giới hạn, tạo xong chạy 5 ms rồi huỷ", "err r"),
        card4("wy-c", 160, 330, 360, 250, 40, [("lock", "Giao dịch viên", "thread · có giới hạn"),
                                               ("grid", "Hàng chờ", "queue"),
                                               ("plug", "Quầy phụ", "max: mở khi quá đông"),
                                               ("shield", "Từ chối", "rejection policy")]),
        box("wy-code", 160, 630, 1600, 300, code(
            "new ThreadPoolExecutor(\n    4, 8,                                  // corePoolSize, maximumPoolSize\n"
            "    60, TimeUnit.SECONDS,                  // keepAlive cho thread vượt core\n"
            "    new ArrayBlockingQueue<>(100),         // queue CÓ giới hạn\n"
            "    Thread.ofPlatform().name(\"report-\", 0).factory(),\n    new ThreadPoolExecutor.CallerRunsPolicy());"), "cyan", "code"),
    ]), beats=[
        ("Phần một: vì sao cần thread pool.", "Phần 1: vì sao cần thread pool.",
         [TYPE("#wy-big", 0.1, 0.05), IN("#wy-bsub", "blur", 0.9)]),
        ("Mỗi việc lại tạo một thread mới thì khi tải tăng, số thread tăng không giới hạn, và hệ thống sập trước.",
         "new Thread() cho mỗi việc: tải tăng là số thread tăng không giới hạn, hệ thống sập trước.",
         [OUT("#wy-big, #wy-bsub", "zoom"), IN("#wy-hud", "left", 0.2), IN("#wy-bad", "up", 0.6), SHAKE("#wy-bad", 4.0)]),
        ("Thread pool giống quầy ngân hàng: số giao dịch viên có hạn, khách mới thì xếp hàng, đông quá thì mở quầy phụ, vẫn đông nữa thì từ chối.",
         "Như quầy ngân hàng: giao dịch viên (thread), hàng chờ (queue), quầy phụ (max), từ chối (reject).",
         [IN("#wy-c0", "pop", 1.2), IN("#wy-c1", "pop", 3.0), IN("#wy-c2", "pop", 4.4), IN("#wy-c3", "pop", 5.8)]),
        ("Sáu tham số: core, max, thời gian giữ thread rảnh, hàng đợi, cách tạo thread, và chính sách từ chối.",
         "6 tham số: core, max, keepAlive, queue, threadFactory, rejection handler.",
         [IN("#wy-code", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ the decision flow as a circuit
    dict(id="flow", world=(1920, 1080), hud=hud("fl", "Luồng xử lý khi execute(task)", "core → queue → max → reject"), cam="".join([
        gnode("fl-ex", 60, 300, 320, 110, "execute(task)", "cyan"),
        gnode("fl-q1", 470, 300, 360, 110, "thread &lt; core?", "amber"),
        gnode("fl-q2", 920, 300, 360, 110, "queue còn chỗ?", "amber"),
        gnode("fl-q3", 1370, 300, 360, 110, "thread &lt; max?", "amber"),
        gnode("fl-r1", 470, 520, 360, 100, "tạo thread mới", "green"),
        gnode("fl-r2", 920, 520, 360, 100, "vào queue", "cyan"),
        gnode("fl-r3", 1370, 520, 360, 100, "tạo thread mới", "green"),
        gnode("fl-rj", 1370, 720, 360, 100, "rejection policy", "red"),
        el("fl-y1", 670, 440, 100, None, "có", "lbl r", "text-align:left"),
        el("fl-y2", 1110, 440, 100, None, "có", "lbl r", "text-align:left"),
        el("fl-y3", 1560, 440, 100, None, "có", "lbl r", "text-align:left"),
        el("fl-n1", 830, 310, 90, None, "không", "lbl r"),
        el("fl-n2", 1280, 310, 90, None, "không", "lbl r"),
        el("fl-n3", 1750, 560, 120, None, "không", "lbl r"),
        wires(trace("fl-t0", [(380, 355), (462, 355)], "cyan"),
              trace("fl-t1", [(830, 355), (912, 355)], "amber"), trace("fl-t2", [(1280, 355), (1362, 355)], "amber"),
              trace("fl-y1t", [(650, 410), (650, 512)], "green"), trace("fl-y2t", [(1100, 410), (1100, 512)], "cyan"),
              trace("fl-y3t", [(1550, 410), (1550, 512)], "green"),
              trace("fl-nt", [(1730, 355), (1820, 355), (1820, 770), (1738, 770)], "red", r=26)),
        el("fl-warn", 60, 860, 1800, None, "Phản trực giác: lấp đầy queue trước rồi mới tăng thread lên max", "warnbox r"),
    ]), beats=[
        ("Phần hai: khi gọi execute, pool đi qua bốn bước. Bước một: chưa đủ thread lõi thì tạo thread mới.",
         "Phần 2: execute(task) đi qua 4 bước. Chưa đủ core thì tạo thread mới.",
         [IN("#fl-hud", "left", 0.1), IN("#fl-ex", "pop", 0.4), IN("#fl-q1, #fl-q2, #fl-q3", "pop", 0.8, 0.4, 0.15),
          DRAW("#fl-t0-p", 1.4, 0.3), DRAW("#fl-t1-p", 1.6, 0.3), DRAW("#fl-t2-p", 1.8, 0.3),
          COMET("fl-t0", 3.4, 0.4), LIGHT("#fl-q1", 3.8), DRAW("#fl-y1t-p", 4.2, 0.3), IN("#fl-y1", "fade", 4.2),
          IN("#fl-r1", "pop", 4.4), COMET("fl-y1t", 4.6, 0.35), LIGHT("#fl-r1", 4.95)]),
        ("Đủ thread lõi rồi thì đưa task vào hàng đợi.", "Đủ core thì đưa task vào queue.",
         [IN("#fl-n1", "fade", 0.2), COMET("fl-t1", 0.3, 0.4), LIGHT("#fl-q2", 0.7), DRAW("#fl-y2t-p", 1.0, 0.3), IN("#fl-y2", "fade", 1.0),
          IN("#fl-r2", "pop", 1.2), COMET("fl-y2t", 1.4, 0.35), LIGHT("#fl-r2", 1.75)]),
        ("Hàng đợi đầy mà chưa tới max thì tạo thêm thread. Đã max thì áp dụng chính sách từ chối.",
         "Queue đầy mà chưa tới max: tạo thêm thread. Đã max: rejection policy.",
         [IN("#fl-n2", "fade", 0.2), COMET("fl-t2", 0.3, 0.4), LIGHT("#fl-q3", 0.7), DRAW("#fl-y3t-p", 1.0, 0.3), IN("#fl-y3", "fade", 1.0),
          IN("#fl-r3", "pop", 1.2), COMET("fl-y3t", 1.4, 0.35), LIGHT("#fl-r3", 1.75),
          DRAW("#fl-nt-p", 2.8, 0.5), IN("#fl-n3", "fade", 3.0), IN("#fl-rj", "pop", 3.3), COMET("fl-nt", 3.4, 0.6), LIGHT("#fl-rj", 4.0)]),
        ("Điểm phản trực giác: pool lấp đầy hàng đợi trước, rồi mới tăng thread lên max.",
         "Phản trực giác: lấp đầy queue trước, rồi mới tăng thread lên max.",
         [IN("#fl-warn", "up", 0.3), PULSE("#fl-r2", 1.6)]),
    ]),
    # ------------------------------------------------------------ simulation of the 20 tasks
    dict(id="sim", world=(1920, 1080), hud=hud("sm", "Mô phỏng: core 2, max 4, queue 10", "20 task, mỗi task chạy 1 giây"), cam="".join([
        el("sm-lt", 160, 230, 400, None, "thread (tối đa 4)", "lbl r", "text-align:left"),
        "".join(box(f"sm-t{k}", TH_X[k], 270, 200, 90, "", "green" if k < 2 else "violet", "dash") for k in range(4)),
        el("sm-lq", 160, 440, 400, None, "queue (10 chỗ)", "lbl r", "text-align:left"),
        "".join(box(f"sm-q{k}", Q_X[k], 475, 140, 80, "", "cyan", "dash") for k in range(10)),
        el("sm-lr", 160, 650, 400, None, "bị reject", "lbl r", "text-align:left"),
        "".join(task_chip(i) for i in range(1, 21)),
        console("sm-con", 1100, 180, 700, ["1–2: tạo thread core", "3–12: vào queue", "13–14: tạo thread vượt core", "15–20: REJECTED"]),
        chip("sm-sum", 160, 800, "4 chạy · 10 chờ · 6 reject · 14 task xong sau 4.0 giây", "green"),
        el("sm-ord", 160, 880, 1600, None, "Thứ tự bắt đầu đo được: 1, 2, 13, 14, 3, 4, …, 12: task 13, 14 chen lên trước", "note left r"),
    ]), beats=[
        ("Phần ba: mô phỏng đúng câu hỏi ban đầu. Task một và hai tạo hai thread lõi.",
         "Phần 3: mô phỏng. Task 1, 2 tạo 2 thread core.",
         [IN("#sm-hud", "left", 0.1), IN("#sm-lt", "fade", 0.4), IN("#sm-t0, #sm-t1, #sm-t2, #sm-t3", "fade", 0.5, 0.4, 0.08),
          IN("#sm-lq", "fade", 0.8), IN(", ".join(f"#sm-q{k}" for k in range(10)), "fade", 0.9, 0.3, 0.04),
          IN("#sm-lr", "fade", 1.2), IN("#sm-con", "right", 1.4, 0.4),
          IN("#sm-k1", "pop", 2.6), IN("#sm-k2", "pop", 3.0), IN("#sm-con-1", "type1", 3.0, 0.3)]),
        ("Task ba tới mười hai vào hàng đợi, cho tới khi đầy mười chỗ.", "Task 3 → 12 vào queue, tới khi đầy 10 chỗ.",
         [*[IN(f"#sm-k{i}", "pop", 0.3 + (i - 3) * 0.25) for i in range(3, 13)], IN("#sm-con-2", "type1", 1.2, 0.3)]),
        ("Hàng đợi đầy, task mười ba và mười bốn tạo thêm thread, đạt max bốn. Từ task mười lăm tới hai mươi đều bị từ chối.",
         "Queue đầy: task 13, 14 tạo thêm thread, đạt max 4. Task 15 → 20 bị reject.",
         [IN("#sm-k13", "pop", 0.8), IN("#sm-k14", "pop", 1.3), IN("#sm-con-3", "type1", 1.3, 0.3),
          *[IN(f"#sm-k{i}", "pop", 3.4 + (i - 15) * 0.25) for i in range(15, 21)], IN("#sm-con-4", "type1", 3.6, 0.3),
          SHAKE("#sm-k15, #sm-k16, #sm-k17, #sm-k18, #sm-k19, #sm-k20", 5.2)]),
        ("Chạy thật: mười bốn task xong sau bốn giây. Và task mười ba, mười bốn lại chạy trước task ba: đừng dựa vào pool để giữ thứ tự.",
         "Chạy thật: 14 task xong sau 4.0 giây. Task 13, 14 chạy trước task 3: đừng dựa vào pool để giữ thứ tự.",
         [IN("#sm-sum", "pop", 0.3), IN("#sm-ord", "up", 3.4), PULSE("#sm-k13, #sm-k14", 4.4)]),
    ]),
    # ------------------------------------------------------------ rejection policies
    dict(id="policy", world=(1920, 1080), hud=hud("pl", "Rejection policy", "Làm gì khi không nhận thêm được"), cam="".join([
        card4("pl-c", 160, 190, 380, 260, 26, [("shield", "AbortPolicy", "mặc định · ném RejectedExecutionException"),
                                               ("share", "CallerRunsPolicy", "thread gọi tự chạy task · back-pressure"),
                                               ("lock", "DiscardPolicy", "lặng lẽ bỏ task mới"),
                                               ("grid", "DiscardOldestPolicy", "bỏ task cũ nhất trong queue")]),
        el("pl-l", 160, 500, 1600, None, "Pool 1 thread, queue 2, gửi 5 task:", "lbl r", "text-align:left"),
        chip("pl-d1", 160, 550, "DiscardPolicy chạy [1, 2, 3]: task 4, 5 biến mất, không log", "red"),
        chip("pl-d2", 160, 630, "DiscardOldestPolicy chạy [1, 4, 5]: task 2, 3 bị đẩy ra", "amber"),
        console("pl-cr", 160, 730, 1100, ["CallerRuns, 1 thread, queue 1, 3 task 1 giây: vòng gửi mất 1005 ms", "task chạy trên: main, pool-5-thread-1"]),
        el("pl-api", 1320, 740, 460, None, "Job nền: CallerRuns. API: Abort rồi trả 503", "note green left r"),
    ]), beats=[
        ("Phần bốn: chính sách từ chối. Abort là mặc định, ném exception. Caller runs để thread gọi tự chạy task. Discard bỏ task mới, discard oldest bỏ task cũ nhất.",
         "Phần 4: Abort (mặc định) ném exception · CallerRuns: thread gọi tự chạy · Discard bỏ task mới · DiscardOldest bỏ task cũ nhất.",
         [IN("#pl-hud", "left", 0.1), IN("#pl-c0", "pop", 2.0), IN("#pl-c1", "pop", 4.4), IN("#pl-c2", "pop", 7.4), IN("#pl-c3", "pop", 9.0)]),
        ("Thử pool một thread, hàng đợi hai chỗ, gửi năm task. Discard âm thầm làm mất task bốn và năm, không một dòng log.",
         "Pool 1 thread, queue 2, 5 task: Discard âm thầm mất task 4, 5; DiscardOldest bỏ task 2, 3.",
         [IN("#pl-l", "fade", 0.3), IN("#pl-d1", "left", 2.6), SHAKE("#pl-d1", 5.0), IN("#pl-d2", "left", 5.6)]),
        ("Một lần chạy khác, pool một thread, hàng đợi một chỗ, ba task mỗi task một giây: caller runs làm vòng gửi chậm lại hơn một giây, vì chính thread main phải tự chạy task. Đó là back pressure.",
         "CallerRuns (1 thread, queue 1, 3 task 1 s): vòng gửi chậm 1005 ms vì main tự chạy task. Đó là back-pressure.",
         [IN("#pl-cr", "up", 0.3, 0.4), IN("#pl-cr-1", "type1", 0.8, 0.3), IN("#pl-cr-2", "type1", 2.6, 0.3), IN("#pl-api", "up", 6.6)]),
    ]),
    # ------------------------------------------------------------ Executors factory traps
    dict(id="factory", world=(1920, 1080), hud=hud("fc", "Bẫy của các factory trong Executors", "Tiện, nhưng giấu cấu hình nguy hiểm"), cam="".join([
        el("fc-hero", 120, 190, 1700, None, "không bao giờ reject", "glow r", "font-size:84px;text-align:left;--tone:var(--red)"),
        box("fc-fix", 120, 330, 1680, 160, code(
            "Executors.newFixedThreadPool(10)   // core = max = 10, LinkedBlockingQueue không giới hạn\n"
            "fixed.getQueue().remainingCapacity();   // 2147483647"), "red", "code"),
        console("fc-con1", 120, 520, 1000, ["100.000 task chậm → threads=10, queue=99990", "không một exception nào"]),
        box("fc-cache", 120, 700, 1680, 110, code("Executors.newCachedThreadPool()   // core 0, max Integer.MAX_VALUE, SynchronousQueue"), "amber", "code"),
        chip("fc-c2", 120, 840, "2000 task ngủ 5 giây → 2000 thread hệ điều hành", "red"),
        el("fc-fix2", 1180, 530, 620, None, "Production: tự cấu hình queue có giới hạn và rejection policy rõ ràng", "note green left r"),
    ]), beats=[
        ("Phần năm: bẫy của các hàm tạo pool sẵn. New fixed thread pool dùng hàng đợi không giới hạn, nên không bao giờ từ chối.",
         "Phần 5: newFixedThreadPool dùng LinkedBlockingQueue không giới hạn, nên không bao giờ reject.",
         [IN("#fc-hud", "left", 0.1), IN("#fc-hero", "glowin", 2.6, 0.9), IN("#fc-fix", "up", 3.6)]),
        ("Mình gửi một trăm nghìn task chậm vào pool mười thread: không lỗi gì, chín mươi chín nghìn chín trăm chín mươi task nằm chờ trong bộ nhớ.",
         "Gửi 100.000 task chậm vào pool 10 thread: không lỗi, 99.990 task nằm chờ trong bộ nhớ.",
         [IN("#fc-con1", "up", 0.3, 0.4), IN("#fc-con1-1", "type1", 0.8, 0.3), IN("#fc-con1-2", "type1", 4.0, 0.3), SHAKE("#fc-con1", 5.2)]),
        ("Còn new cached thread pool thì ngược lại: max là vô hạn, hai nghìn task chậm là hai nghìn thread.",
         "newCachedThreadPool ngược lại: max vô hạn, 2000 task chậm là 2000 thread.",
         [IN("#fc-cache", "up", 0.3), IN("#fc-c2", "pop", 3.4)]),
        ("Ở production, hãy tự cấu hình hàng đợi có giới hạn, và chính sách từ chối rõ ràng.",
         "Production: tự cấu hình queue có giới hạn và rejection policy rõ ràng.",
         [IN("#fc-fix2", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ pool sizing
    dict(id="size", world=(1920, 1080), hud=hud("sz", "Chọn kích thước pool", "CPU-bound hay I/O-bound"), cam="".join([
        box("sz-cpu", 160, 200, 760, 220, "<b>CPU-bound</b><small>tính toán, nén, mã hoá</small><small>≈ số core (8 CPU → 8)</small>", "violet", "card"),
        box("sz-io", 1000, 200, 760, 220, "<b>I/O-bound</b><small>gọi API, query DB</small><small>nhiều hơn số core</small>", "cyan", "card"),
        el("sz-f", 0, 470, 1920, None, "threads ≈ số core × (1 + thời gian chờ / thời gian CPU)", "glow r", "font-size:56px;--tone:var(--cyan)"),
        chip("sz-ex", 560, 580, "8 core, chờ API 200 ms, CPU 10 ms → 8 × (1 + 20) = 168", "cyan"),
        el("sz-hk", 160, 690, 1600, None, "Tài nguyên phía sau mới là giới hạn thật: 168 thread query DB qua Hikari 10 connection thì 158 thread đứng chờ", "warnbox r"),
        chip("sz-bh", 160, 820, "Tách pool theo loại việc (bulkhead): API chậm không kéo sập việc khác", "green"),
    ]), beats=[
        ("Phần sáu: chọn kích thước pool. Việc nặng CPU thì khoảng bằng số core. Việc chờ vào ra thì cần nhiều thread hơn.",
         "Phần 6: CPU-bound ≈ số core. I/O-bound cần nhiều thread hơn.",
         [IN("#sz-hud", "left", 0.1), IN("#sz-cpu", "left", 1.6), IN("#sz-io", "right", 4.0)]),
        ("Công thức ước lượng: số core nhân với một cộng tỉ lệ thời gian chờ trên thời gian xử lý. Tám core, chờ hai trăm mili giây, xử lý mười mili giây, ra một trăm sáu mươi tám thread.",
         "threads ≈ core × (1 + chờ / CPU). 8 core, chờ 200 ms, CPU 10 ms → 168.",
         [IN("#sz-f", "glowin", 0.3, 0.9), IN("#sz-ex", "pop", 6.0)]),
        ("Nhưng tài nguyên phía sau mới là giới hạn thật: pool lớn mà connection database chỉ có mười thì phần lớn thread đứng chờ.",
         "Nhưng tài nguyên phía sau mới là giới hạn thật: Hikari 10 connection thì phần lớn thread đứng chờ.",
         [IN("#sz-hk", "up", 0.3), SHAKE("#sz-hk", 3.6)]),
        ("Và hãy tách pool theo loại việc, để một dịch vụ chậm không kéo sập phần khác.",
         "Tách pool theo loại việc (bulkhead), để một downstream chậm không kéo sập phần khác.",
         [IN("#sz-bh", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ shutting down
    dict(id="stop", world=(1920, 1080), hud=hud("sp", "Tắt pool đúng cách", "shutdown, shutdownNow, awaitTermination"), cam="".join([
        chip("sp-1", 160, 200, "shutdown(): không nhận task mới, vẫn chạy hết task trong queue, trả về ngay", "green"),
        chip("sp-2", 160, 280, "shutdownNow(): interrupt task đang chạy, trả về list task chưa chạy", "amber"),
        chip("sp-3", 160, 360, "awaitTermination(t): chặn tới khi tắt xong hoặc hết giờ", "cyan"),
        console("sp-con", 1180, 440, 600, ["shutdownNow() trả về 4 task", "task đang chạy: interrupted=true"]),
        box("sp-code", 160, 430, 960, 410, code(
            "pool.shutdown();\ntry {\n    if (!pool.awaitTermination(30, SECONDS)) {\n        pool.shutdownNow();\n    }\n"
            "} catch (InterruptedException e) {\n    pool.shutdownNow();\n    Thread.currentThread().interrupt();\n}"), "cyan", "code"),
        el("sp-w", 160, 865, 1600, None, "shutdownNow() chỉ gọi interrupt(): task nuốt InterruptedException thì vẫn chạy tiếp", "warnbox r"),
    ]), beats=[
        ("Phần bảy: tắt pool. Shutdown ngừng nhận việc mới nhưng vẫn chạy hết việc đang chờ. Shutdown now thì interrupt task đang chạy, và trả về các task chưa chạy.",
         "Phần 7: shutdown() chạy nốt việc đang chờ. shutdownNow() interrupt task đang chạy và trả về task chưa chạy.",
         [IN("#sp-hud", "left", 0.1), IN("#sp-1", "left", 1.2), IN("#sp-2", "left", 4.2), IN("#sp-3", "left", 6.8)]),
        ("Mình thử một thread, năm task: gọi shutdown now nhận về bốn task chưa chạy, và task đang chạy bị interrupt.",
         "Thử 1 thread, 5 task: shutdownNow() trả về 4 task, task đang chạy bị interrupt.",
         [IN("#sp-con", "right", 0.3, 0.4), IN("#sp-con-1", "type1", 2.4, 0.3), IN("#sp-con-2", "type1", 3.6, 0.3)]),
        ("Mẫu chuẩn: shutdown, chờ một khoảng, chưa xong mới shutdown now. Và nhớ nó chỉ gọi interrupt.",
         "Mẫu chuẩn: shutdown, awaitTermination, chưa xong mới shutdownNow. Nó chỉ gọi interrupt().",
         [IN("#sp-code", "up", 0.3), IN("#sp-w", "up", 4.0)]),
    ]),
    # ------------------------------------------------------------ Spring ThreadPoolTaskExecutor
    dict(id="spring", world=(1920, 1080), hud=hud("sg", "ThreadPoolTaskExecutor trong Spring", "Dùng cho @Async"), cam="".join([
        box("sg-code", 160, 190, 1100, 470, code(
            "@Bean\nThreadPoolTaskExecutor reportExecutor() {\n    var ex = new ThreadPoolTaskExecutor();\n    ex.setCorePoolSize(4);\n    ex.setMaxPoolSize(8);\n"
            "    ex.setQueueCapacity(100);              // có giới hạn\n    ex.setThreadNamePrefix(\"report-\");\n"
            "    ex.setRejectedExecutionHandler(new CallerRunsPolicy());\n    ex.setWaitForTasksToCompleteOnShutdown(true);\n    return ex;\n}"), "cyan", "code"),
        el("sg-trap", 1320, 200, 460, None, "Mặc định queueCapacity = Integer.MAX_VALUE: đúng bẫy queue không giới hạn", "err r"),
        el("sg-name", 1320, 400, 460, None, "threadNamePrefix: đọc thread dump biết ngay pool nào", "note green left r"),
        el("sg-async", 160, 700, 1600, None, "@Async gọi từ chính class đó không chạy bất đồng bộ (self-invocation). ThreadLocal như MDC không tự sang thread của executor", "note left r"),
    ]), beats=[
        ("Phần tám: trong Spring, khai báo thread pool task executor làm bean, rồi dùng với async.",
         "Phần 8: khai báo ThreadPoolTaskExecutor làm bean, dùng với @Async.",
         [IN("#sg-hud", "left", 0.1), IN("#sg-code", "up", 0.4)]),
        ("Đừng để mặc định: dung lượng hàng đợi mặc định là vô hạn, mắc đúng cái bẫy vừa rồi.",
         "Đừng để mặc định: queueCapacity mặc định là Integer.MAX_VALUE.",
         [IN("#sg-trap", "up", 0.3), SHAKE("#sg-trap", 1.6), PULSE("#sg-code", 2.6)]),
        ("Đặt tên thread để đọc log và thread dump. Và nhớ: gọi async từ chính class đó thì không chạy bất đồng bộ.",
         "Đặt threadNamePrefix để đọc log, thread dump. Gọi @Async từ chính class đó thì không chạy bất đồng bộ.",
         [IN("#sg-name", "left", 0.3), IN("#sg-async", "up", 3.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "core → queue", "→ max → reject"),
                                                ("shield", "Queue có giới hạn", "Executors.newFixed nguy hiểm"),
                                                ("split", "Kích thước", "core × (1 + chờ / CPU)"),
                                                ("lock", "Tắt đúng cách", "shutdown + await")]),
        chip("ou-next", 760, 650, "Bài tiếp: CompletableFuture", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: pool đi theo thứ tự lõi, hàng đợi, max, rồi từ chối. Luôn dùng hàng đợi có giới hạn. Kích thước theo tỉ lệ chờ trên xử lý. Và tắt pool bằng shutdown rồi chờ.",
         "core → queue → max → reject · queue có giới hạn · kích thước theo chờ / CPU · shutdown rồi awaitTermination.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.0), IN("#ou-c2", "pop", 6.0), IN("#ou-c3", "pop", 8.2)]),
        ("Bài sau: Completable Future.", "Bài sau: CompletableFuture.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
