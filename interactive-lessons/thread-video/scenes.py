"""Thread Basics explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output was run on JDK 21 (8 CPUs):
Thread.State values = NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED; one worker walked through all six
(before start NEW, spinning RUNNABLE, main holds lock BLOCKED, after wait() WAITING, sleeping TIMED_WAITING, after join
TERMINATED); a thread waiting on ReentrantLock.lock() is WAITING; start() twice -> IllegalThreadStateException;
r.run() prints "run in main", r.start() prints "run in my-thread"; setDaemon after start -> IllegalThreadStateException;
main-created threads are non-daemon, virtual threads are daemon; Callable 6 * 7 -> 42; get() on a failing task ->
java.lang.IllegalStateException: boom; submit() without get() prints nothing; execute() prints
Exception in thread "pool-1-thread-1" java.lang.IllegalStateException; sleeper interrupted after 100 ms ended after
115 ms, isInterrupted false in catch, true after re-interrupt; a crashing thread does not stop main;
non-daemon: tick 1, tick 2, main ends, tick 3, tick 4, tick 5; daemon: tick 1, tick 2, main ends, then the JVM exits.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

TICK_X = [360 + k * 230 for k in range(6)]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #11", "eyebrow r"),
        box("hk-code", 360, 240, 1200, 200, win("Main.java") + code(
            'Thread t = new Thread(() -> print("run in " + currentThread().getName()), "my-thread");\nt.run();   // chạy ở đâu?'), "cyan", "code"),
        console("hk-con", 360, 480, 600, ["run in main"]),
        el("hk-no", 1000, 490, 560, None, "Không có thread mới nào cả.", "note left r"),
        tile("hk-tile", 440, 350, 220, "split"),
        el("hk-word", 710, 380, 1100, None, letters("Thread Basics"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "process · Runnable, Callable · 6 trạng thái · daemon · interrupt", "kin-sub r"),
    ]), beats=[
        ("Gọi run thay vì start thì đoạn code này chạy ở thread nào?", "Gọi run() thay vì start() thì code chạy ở thread nào?",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        ("Ở chính thread main. Không có thread mới nào cả.", "Ở chính thread main. Không có thread mới nào cả.",
         [IN("#hk-con", "up", 0.1, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-no", "left", 1.4)]),
        ("Hôm nay ta học nền móng của concurrency: thread.", "Hôm nay: nền móng của concurrency, Thread Basics.",
         [OUT("#hk-eye, #hk-code, #hk-con, #hk-no", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.4, 0.8),
          TYPE("#hk-word", 0.8, 0.05), IN("#hk-sub", "blur", 1.9)]),
    ]),
    # ------------------------------------------------------------ process vs thread
    dict(id="proc", world=(1920, 1080), hud=hud("pc", "Process và Thread", "Chung heap, riêng stack"), cam="".join([
        big_title("pc", "Process và Thread", "Một căn nhà, nhiều người ở"),
        box("pc-proc", 160, 190, 1600, 600, win("Process: JVM · java -jar app.jar"), "muted", "panel"),
        box("pc-heap", 560, 290, 800, 160, "<b>Heap · dùng chung</b><small>object, static field: như tủ lạnh chung</small>", "cyan", "card"),
        gnode("pc-t1", 260, 600, 360, 110, "Thread 1 · stack", "green"),
        gnode("pc-t2", 780, 600, 360, 110, "Thread 2 · stack", "green"),
        gnode("pc-t3", 1300, 600, 360, 110, "Thread 3 · stack", "green"),
        wires(trace("pc-a", [(440, 600), (440, 520), (700, 520), (700, 458)], "green", r=24),
              trace("pc-b", [(960, 600), (960, 458)], "green"),
              trace("pc-c", [(1480, 600), (1480, 520), (1220, 520), (1220, 458)], "green", r=24)),
        chip("pc-race", 560, 820, "Hai người cùng lấy hộp sữa cuối cùng: race condition", "red"),
        gnode("pc-h1", 160, 230, 320, 100, "http-nio-1", "cyan"),
        gnode("pc-h2", 160, 400, 320, 100, "http-nio-2", "cyan"),
        gnode("pc-h3", 160, 570, 320, 100, "http-nio-3", "cyan"),
        gnode("pc-bean", 900, 380, 520, 140, "OrderService<br>singleton", "violet"),
        wires(*[trace(f"pc-s{i}", [(480, y + 50), (700, y + 50), (700, 450), (892, 450)], "cyan", r=26) for i, y in enumerate((230, 400, 570))]),
        el("pc-bad", 900, 560, 860, None, "private User currentUser; → request A ghi, request B ghi đè, A đọc ra user của B", "err r"),
        el("pc-ok", 900, 690, 860, None, "Dữ liệu theo request: biến local, tham số method, hoặc ThreadLocal", "note green left r"),
    ]), beats=[
        ("Phần một: process và thread.", "Phần 1: process và thread.",
         [TYPE("#pc-big", 0.1, 0.04), IN("#pc-bsub", "blur", 1.0)]),
        ("Process là một chương trình đang chạy, có bộ nhớ riêng. Thread là luồng thực thi bên trong nó: các thread dùng chung bộ nhớ heap, nhưng mỗi thread có stack riêng.",
         "Process: chương trình đang chạy, bộ nhớ riêng. Thread: luồng bên trong, dùng chung heap, mỗi thread một stack riêng.",
         [OUT("#pc-big, #pc-bsub", "zoom"), IN("#pc-hud", "left", 0.2), IN("#pc-proc", "fade", 0.4, 0.5), IN("#pc-heap", "pop", 3.6),
          IN("#pc-t1, #pc-t2, #pc-t3", "pop", 5.0, 0.4, 0.15), DRAW("#pc-a-p", 5.8, 0.4), DRAW("#pc-b-p", 5.9, 0.4), DRAW("#pc-c-p", 6.0, 0.4),
          COMET("pc-a", 6.6, 0.5), COMET("pc-b", 6.6, 0.4), COMET("pc-c", 6.6, 0.5), PULSE("#pc-heap", 7.2)]),
        ("Giống một căn nhà: mọi người dùng chung tủ lạnh, mỗi người một cuốn sổ riêng. Hai người cùng lấy hộp sữa cuối cùng, đó là race condition.",
         "Như căn nhà: chung tủ lạnh (heap), mỗi người một cuốn sổ (stack). Cùng lấy hộp sữa cuối: race condition.",
         [IN("#pc-race", "pop", 5.0), SHAKE("#pc-race", 5.6)]),
        ("Vì vậy singleton bean phải stateless. Mọi thread của Tomcat dùng chung một instance; lưu user vào field là request này đọc ra user của request khác.",
         "Vì vậy singleton bean phải stateless: mọi thread Tomcat dùng chung một instance.",
         [OUT("#pc-proc, #pc-heap, #pc-t1, #pc-t2, #pc-t3, #pc-a, #pc-b, #pc-c, #pc-race", "blur", 0, 0.4),
          IN("#pc-h1, #pc-h2, #pc-h3", "pop", 0.6, 0.4, 0.12), IN("#pc-bean", "pop", 1.2),
          *[DRAW(f"#pc-s{i}-p", 1.6, 0.4) for i in range(3)], *[COMET(f"pc-s{i}", 2.4 + i * 0.25, 0.5) for i in range(3)],
          LIGHT("#pc-bean", 3.2), IN("#pc-bad", "up", 5.4), SHAKE("#pc-bad", 6.0)]),
        ("Dữ liệu theo request phải là biến local, tham số, hoặc thread local.", "Dữ liệu theo request: biến local, tham số, hoặc ThreadLocal.",
         [IN("#pc-ok", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ Runnable vs Callable
    dict(id="create", world=(1920, 1080), hud=hud("cr", "Runnable, Callable, Thread", "Công việc và người làm việc"), cam="".join([
        card4("cr-c", 160, 190, 500, 250, 50, [("plug", "Runnable", "void run() · không trả kết quả · không ném checked exception"),
                                               ("share", "Callable<V>", "V call() throws Exception · trả qua Future"),
                                               ("lock", "extends Thread", "gần như không dùng: mất quyền extends class khác")]),
        box("cr-code", 160, 490, 1000, 200, code(
            "Future<Integer> f = ex.submit(() -> 6 * 7);\nf.get();      // chặn tới khi có kết quả"), "cyan", "code"),
        console("cr-con", 1220, 500, 540, ["42"]),
        console("cr-sub", 160, 730, 780, ["(không có dòng log nào)"]),
        el("cr-subl", 160, 690, 780, None, "submit() lỗi, không gọi get()", "lbl r", "text-align:left"),
        console("cr-exe", 1000, 730, 760, ['Exception in thread "pool-1-thread-1"']),
        el("cr-exel", 1000, 690, 760, None, "execute() lỗi", "lbl r", "text-align:left"),
    ]), beats=[
        ("Phần hai: tạo thread. Runnable và Callable chỉ mô tả công việc, còn thread là người làm việc.",
         "Phần 2: Runnable, Callable chỉ mô tả công việc; Thread là người làm việc.",
         [IN("#cr-hud", "left", 0.1), IN("#cr-c0", "pop", 1.0), IN("#cr-c1", "pop", 2.0), IN("#cr-c2", "pop", 3.0)]),
        ("Callable trả kết quả qua Future. Gọi get thì chặn cho tới khi có kết quả: bốn mươi hai.",
         "Callable trả kết quả qua Future. get() chặn tới khi có kết quả: 42.",
         [IN("#cr-code", "up", 0.3), IN("#cr-con", "right", 2.6, 0.4), IN("#cr-con-1", "type1", 3.0, 0.3)]),
        ("Bẫy lớn: submit nuốt exception. Task lỗi mà không ai gọi get thì không có một dòng log nào. Còn execute thì lỗi được in ra.",
         "Bẫy: submit() nuốt exception, không get() là không có log. execute() thì lỗi được in ra.",
         [IN("#cr-subl", "fade", 0.6), IN("#cr-sub", "up", 0.8, 0.4), IN("#cr-sub-1", "type1", 1.2, 0.3), SHAKE("#cr-sub", 3.4),
          IN("#cr-exel", "fade", 5.0), IN("#cr-exe", "up", 5.2, 0.4), IN("#cr-exe-1", "type1", 5.6, 0.3)]),
    ]),
    # ------------------------------------------------------------ the six states as a circuit
    dict(id="states", world=(1920, 1080), hud=hud("sc", "Vòng đời thread", "Thread.State có đúng 6 giá trị"), cam="".join([
        big_title("sc", "Thread.State", "6 trạng thái, không có RUNNING"),
        el("sc-hero", 100, 190, 900, None, "Không có RUNNING", "glow r", "font-size:84px;text-align:left;--tone:var(--cyan)"),
        gnode("sc-new", 100, 470, 220, 110, "NEW", "cyan"),
        gnode("sc-run", 560, 470, 300, 110, "RUNNABLE", "green"),
        gnode("sc-blk", 1100, 200, 300, 100, "BLOCKED", "red"),
        gnode("sc-wait", 1100, 400, 300, 100, "WAITING", "amber"),
        gnode("sc-tw", 1100, 600, 380, 100, "TIMED_WAITING", "violet"),
        gnode("sc-term", 560, 780, 300, 100, "TERMINATED", "cyan"),
        el("sc-nb", 1430, 222, 440, None, "chờ lock của synchronized", "note left r"),
        el("sc-nw", 1430, 422, 440, None, "wait(), join(), park()", "note left r"),
        el("sc-nt", 1510, 622, 380, None, "sleep(ms), wait(ms)", "note left r"),
        el("sc-ne", 900, 812, 400, None, "run() kết thúc", "note left r"),
        el("sc-nr", 100, 620, 420, None, "đang chạy hoặc chờ CPU", "note left r"),
        wires(trace("sc-t0", [(320, 525), (552, 525)], "cyan"),
              trace("sc-t1", [(860, 500), (980, 500), (980, 250), (1092, 250)], "red", r=24),
              trace("sc-t2", [(860, 515), (1000, 515), (1000, 450), (1092, 450)], "amber", r=20),
              trace("sc-t3", [(860, 550), (980, 550), (980, 650), (1092, 650)], "violet", r=24),
              trace("sc-t4", [(710, 580), (710, 772)], "cyan")),
        chip("sc-m", 100, 900, "Đã đo: một thread đi qua đủ 6 trạng thái", "green"),
    ]), beats=[
        ("Phần ba: vòng đời thread.", "Phần 3: vòng đời thread.",
         [TYPE("#sc-big", 0.1, 0.05), IN("#sc-bsub", "blur", 0.9)]),
        ("Thread state có đúng sáu giá trị, và không có trạng thái running. Đang chạy hay đang chờ CPU đều là runnable.",
         "Thread.State có đúng 6 giá trị, không có RUNNING. Đang chạy hay chờ CPU đều là RUNNABLE.",
         [OUT("#sc-big, #sc-bsub", "zoom"), IN("#sc-hud", "left", 0.2), IN("#sc-hero", "glowin", 1.6, 0.9),
          IN("#sc-new", "pop", 3.6), LIGHT("#sc-new", 3.9), DRAW("#sc-t0-p", 4.2, 0.3), IN("#sc-run", "pop", 4.4),
          COMET("sc-t0", 4.6, 0.45), LIGHT("#sc-run", 5.05), IN("#sc-nr", "up", 5.3)]),
        ("Vào synchronized đang bị giữ là blocked. Gọi wait hay join là waiting. Gọi sleep có hạn là timed waiting.",
         "Vào synchronized đang bị giữ: BLOCKED. wait(), join(): WAITING. sleep(ms): TIMED_WAITING.",
         [IN("#sc-blk, #sc-wait, #sc-tw", "pop", 0.2, 0.4, 0.12), *[DRAW(f"#sc-t{i}-p", 0.5, 0.4) for i in (1, 2, 3)],
          COMET("sc-t1", 0.9, 0.5), LIGHT("#sc-blk", 1.4), IN("#sc-nb", "left", 1.4),
          COMET("sc-t2", 2.8, 0.5), LIGHT("#sc-wait", 3.3), IN("#sc-nw", "left", 3.3),
          COMET("sc-t3", 4.4, 0.5), LIGHT("#sc-tw", 4.9), IN("#sc-nt", "left", 4.9)]),
        ("Hàm run kết thúc thì thread là terminated. Mình đã dẫn một thread đi qua đủ sáu trạng thái này.",
         "run() kết thúc: TERMINATED. Đã đo: một thread đi qua đủ 6 trạng thái.",
         [DRAW("#sc-t4-p", 0.2, 0.3), IN("#sc-term", "pop", 0.4), COMET("sc-t4", 0.5, 0.4), LIGHT("#sc-term", 0.9),
          IN("#sc-ne", "left", 1.0), IN("#sc-m", "pop", 2.4)]),
    ]),
    # ------------------------------------------------------------ traps when reading states
    dict(id="traps", world=(1920, 1080), hud=hud("tp", "Bẫy khi đọc trạng thái", "Thread dump nói gì"), cam="".join([
        chip("tp-io", 160, 220, "Thread chờ DB, chờ socket: RUNNABLE, không phải WAITING", "amber"),
        el("tp-ion", 160, 300, 1600, None, "200 thread Tomcat RUNNABLE dừng ở hàm đọc socket của JDBC: đang chờ DB trả lời, không phải đang ăn CPU", "note left r"),
        chip("tp-rl", 160, 420, "Chờ ReentrantLock.lock(): WAITING (đã đo). BLOCKED chỉ dành cho synchronized", "violet"),
        box("tp-sw", 160, 540, 1600, 160, code(
            "Thread.sleep(ms);   // giữ nguyên lock đang cầm\nlock.wait();        // nhả lock của object, phải gọi trong synchronized"), "cyan", "code"),
        el("tp-pool", 160, 750, 1600, None, "Nhiều thread WAITING ở ThreadPoolExecutor.getTask: thường là thread rảnh chờ task, bình thường. Đáng lo: nhiều thread BLOCKED cùng một lock", "note green left r"),
    ]), beats=[
        ("Phần bốn: bẫy khi đọc trạng thái. Thread đang chờ database trả lời vẫn là runnable, không phải waiting.",
         "Phần 4: bẫy. Thread đang chờ DB trả lời vẫn là RUNNABLE, không phải WAITING.",
         [IN("#tp-hud", "left", 0.1), IN("#tp-io", "left", 1.6), IN("#tp-ion", "up", 3.6)]),
        ("Blocked chỉ dành cho synchronized. Thread chờ reentrant lock thì là waiting, mình đã đo.",
         "BLOCKED chỉ dành cho synchronized. Chờ ReentrantLock là WAITING (đã đo).",
         [IN("#tp-rl", "left", 0.3)]),
        ("Hàm sleep giữ nguyên lock, còn hàm wait thì nhả lock.", "sleep() giữ nguyên lock, wait() nhả lock.",
         [IN("#tp-sw", "up", 0.3)]),
        ("Thấy nhiều thread waiting trong thread pool thường là bình thường: đó là thread rảnh đang chờ việc.",
         "Nhiều thread WAITING trong pool thường bình thường: thread rảnh đang chờ việc.",
         [IN("#tp-pool", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ start vs run, join
    dict(id="start", world=(1920, 1080), hud=hud("st", "start() vs run(), join()", "Bug chạy đúng mà chậm"), cam="".join([
        box("st-code", 160, 190, 1000, 250, code(
            "r.run();     // gọi method bình thường trên main\nr.start();   // tạo thread mới\nr.join();    // main chờ my-thread xong\nr.start();   // lần hai?"), "cyan", "code"),
        console("st-con", 1220, 200, 540, ["run in main", "run in my-thread"]),
        el("st-err", 1220, 380, 540, None, "✕ IllegalThreadStateException", "err r"),
        el("st-bug", 160, 500, 1600, None, "Code review gặp thread.run(): vẫn chạy đúng nhưng tuần tự, mất hết song song, không có exception nào báo", "warnbox r"),
        box("st-bad", 160, 640, 760, 180, win("✕ tuần tự") + code("for (Thread t : ts) { t.start(); t.join(); }"), "red", "code"),
        box("st-good", 1000, 640, 760, 180, win("✓ song song") + code("for (Thread t : ts) t.start();\nfor (Thread t : ts) t.join();"), "green", "code"),
    ]), beats=[
        ("Phần năm: start tạo một thread mới, rồi thread đó gọi run. Gọi run trực tiếp chỉ là gọi method trên thread hiện tại.",
         "Phần 5: start() tạo thread mới rồi gọi run(). Gọi run() trực tiếp chỉ là gọi method trên thread hiện tại.",
         [IN("#st-hud", "left", 0.1), IN("#st-code", "up", 0.4), IN("#st-con", "right", 2.6, 0.4), IN("#st-con-1", "type1", 3.0, 0.3), IN("#st-con-2", "type1", 3.8, 0.3)]),
        ("Một thread chỉ start được một lần. Lần hai ném Illegal Thread State Exception.",
         "Một thread chỉ start() được một lần. Lần hai: IllegalThreadStateException.",
         [IN("#st-err", "up", 1.6), SHAKE("#st-err", 2.1)]),
        ("Đây là bug kinh điển: code vẫn chạy đúng, nhưng tuần tự, và không có exception nào báo.",
         "Bug kinh điển: vẫn chạy đúng nhưng tuần tự, không exception nào báo.",
         [IN("#st-bug", "up", 0.3)]),
        ("Join ngay sau từng start cũng biến song song thành tuần tự. Hãy start hết, rồi mới join hết.",
         "join() ngay sau từng start() cũng thành tuần tự. Start hết rồi mới join hết.",
         [IN("#st-bad", "left", 0.3), SHAKE("#st-bad", 2.0), IN("#st-good", "right", 3.0)]),
    ]),
    # ------------------------------------------------------------ daemon threads
    dict(id="daemon", world=(1920, 1080), hud=hud("dm", "Daemon thread", "JVM không chờ daemon"), cam="".join([
        el("dm-l1", 100, 300, 240, None, "non-daemon", "lbl r", "text-align:left"),
        el("dm-l2", 100, 560, 240, None, "daemon", "lbl r", "text-align:left"),
        "".join(chip(f"dm-a{k}", TICK_X[k], 290, lbl, "amber" if lbl == "main ends" else "green")
                for k, lbl in enumerate(["tick 1", "tick 2", "main ends", "tick 3", "tick 4", "tick 5"])),
        "".join(chip(f"dm-b{k}", TICK_X[k], 550, lbl, "amber" if lbl == "main ends" else "green")
                for k, lbl in enumerate(["tick 1", "tick 2", "main ends"])),
        el("dm-exit", TICK_X[3], 548, 560, None, "JVM thoát: tick 3–5 không bao giờ in", "stamp red r"),
        el("dm-r1", 100, 720, 1700, None, "Thread tạo từ main mặc định non-daemon (đã đo). Virtual thread luôn là daemon. setDaemon() sau start() → IllegalThreadStateException", "note left r"),
        el("dm-r2", 100, 820, 1700, None, "Đừng làm việc quan trọng (ghi file, gửi message) trên daemon thread: JVM tắt là mất giữa chừng", "warnbox r"),
    ]), beats=[
        ("Phần sáu: daemon thread. JVM chỉ thoát khi không còn thread thường nào chạy, và không chờ daemon thread.",
         "Phần 6: daemon thread. JVM chỉ thoát khi hết thread non-daemon, và không chờ daemon thread.",
         [IN("#dm-hud", "left", 0.1)]),
        ("Thread con in năm dòng, main ngủ nửa giây rồi kết thúc. Để thread thường: JVM chờ, in đủ năm dòng.",
         "Thread con in 5 dòng, main ngủ 0.5 giây rồi kết thúc. Non-daemon: JVM chờ, in đủ 5 dòng.",
         [IN("#dm-l1", "fade", 0.3), *[IN(f"#dm-a{k}", "pop", 2.4 + k * 0.5) for k in range(6)]]),
        ("Để daemon: main kết thúc là JVM thoát luôn, chỉ in được hai dòng.", "Daemon: main kết thúc là JVM thoát, chỉ in được 2 dòng.",
         [IN("#dm-l2", "fade", 0.2), *[IN(f"#dm-b{k}", "pop", 0.5 + k * 0.5) for k in range(3)], IN("#dm-exit", "pop", 2.2), SHAKE("#dm-exit", 2.7)]),
        ("Thread tạo từ main mặc định là thread thường, còn virtual thread luôn là daemon. Đừng làm việc quan trọng trên daemon thread.",
         "Thread tạo từ main mặc định non-daemon; virtual thread luôn là daemon. Đừng làm việc quan trọng trên daemon.",
         [IN("#dm-r1", "up", 0.3), IN("#dm-r2", "up", 4.2)]),
    ]),
    # ------------------------------------------------------------ interrupt
    dict(id="interrupt", world=(1920, 1080), hud=hud("it", "Interrupt", "Dừng thread một cách lịch sự"), cam="".join([
        el("it-hero", 100, 190, 1600, None, "interrupt() chỉ bật một cờ", "glow r", "font-size:84px;text-align:left;--tone:var(--amber)"),
        box("it-code", 100, 340, 1000, 250, code(
            "try {\n    Thread.sleep(10_000);\n} catch (InterruptedException e) {\n    Thread.currentThread().interrupt();   // khôi phục cờ\n}"), "cyan", "code"),
        console("it-con", 1160, 350, 660, ["caught, isInterrupted=false", "restored, isInterrupted=true", "sleeper ended after 115 ms"]),
        el("it-busy", 100, 630, 1700, None, "Đang tính toán: không có gì xảy ra, trừ khi tự kiểm tra Thread.currentThread().isInterrupted()", "note left r"),
        el("it-swallow", 100, 720, 1700, None, "Đừng nuốt InterruptedException: hoặc ném tiếp, hoặc gọi lại interrupt()", "warnbox r"),
        chip("it-sd", 100, 830, "shutdownNow(), future.cancel(true) đều dừng task bằng interrupt", "violet"),
    ]), beats=[
        ("Phần bảy: interrupt. Java không có cách an toàn để giết một thread. Interrupt chỉ bật một cờ, và thread phải tự dừng.",
         "Phần 7: interrupt. Không có cách an toàn để giết thread: interrupt() chỉ bật một cờ, thread phải tự dừng.",
         [IN("#it-hud", "left", 0.1), IN("#it-hero", "glowin", 3.4, 0.9)]),
        ("Thread đang ngủ mười giây bị đánh thức ngay bằng exception. Mình đo được: kết thúc sau một trăm mười lăm mili giây. Cờ bị xóa, nên phải gọi interrupt lại.",
         "Thread đang sleep 10 giây bị đánh thức ngay: kết thúc sau 115 ms. Cờ bị xoá, nên phải gọi interrupt() lại.",
         [IN("#it-code", "up", 0.3), IN("#it-con", "right", 1.6, 0.4), IN("#it-con-1", "type1", 2.2, 0.3),
          IN("#it-con-2", "type1", 2.6, 0.3), IN("#it-con-3", "type1", 3.2, 0.3)]),
        ("Thread đang tính toán thì phải tự kiểm tra cờ. Và đừng bao giờ nuốt exception này.",
         "Thread đang tính toán phải tự kiểm tra cờ. Và đừng nuốt InterruptedException.",
         [IN("#it-busy", "up", 0.3), IN("#it-swallow", "up", 2.4)]),
        ("Vì shutdown now của executor, và cancel của future, đều dừng task bằng interrupt.",
         "Vì shutdownNow() và future.cancel(true) đều dừng task bằng interrupt.",
         [IN("#it-sd", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "Chung heap", "riêng stack: bean stateless"),
                                                ("split", "6 trạng thái", "không có RUNNING"),
                                                ("plug", "start(), không run()", "submit() nuốt lỗi"),
                                                ("shield", "interrupt", "đừng nuốt exception")]),
        chip("ou-next", 750, 650, "Bài tiếp: ThreadPoolExecutor", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: các thread dùng chung heap, riêng stack, nên bean phải stateless. Thread có sáu trạng thái, không có running. Gọi start chứ không gọi run, và nhớ submit nuốt exception. "
         "Cuối cùng, interrupt là cơ chế hợp tác, đừng nuốt exception của nó.",
         "Chung heap, riêng stack: bean stateless · 6 trạng thái, không RUNNING · start() chứ không run(), submit() nuốt lỗi · interrupt: đừng nuốt exception.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.4), IN("#ou-c2", "pop", 7.6), IN("#ou-c3", "pop", 11.6)]),
        ("Bài sau: thread pool, và executor.", "Bài sau: ThreadPoolExecutor.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
