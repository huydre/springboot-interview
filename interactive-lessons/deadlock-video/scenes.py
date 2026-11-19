"""Deadlock, ThreadLocal & Virtual Threads explainer: scene layouts and per-beat narration + motion.

Measured on JDK 21 (8 CPUs):
two threads locking A then B and B then A -> after 500 ms both BLOCKED, ThreadMXBean.findDeadlockedThreads() count 2,
"transfer-1-to-2 waits java.lang.Object@… held by transfer-2-to-1" and the reverse; with a fixed lock order both transfers
finish (415 ms in this run, each holds locks for 200 ms); single-thread pool: request 1 sets USER=alice without remove,
request 2 sees alice; with remove in finally -> null; supplyAsync does not see the caller's ThreadLocal (null);
10,000 tasks sleeping 100 ms: pool of 200 platform threads 5249 / 5251 ms, virtual thread per task 168 / 166 ms;
100 virtual threads sleeping 100 ms inside synchronized 1345 ms (pinned), inside ReentrantLock 101 ms;
1000 virtual threads through Semaphore(10) x 50 ms -> 5424 ms.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

BAR = 0.3  # px per ms

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #15", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Service treo, CPU thấp, request timeout"), "h1 center r"),
        console("hk-con", 460, 420, 1000, ["transfer-1-to-2: BLOCKED", "transfer-2-to-1: BLOCKED", "Found one Java-level deadlock"]),
        tile("hk-tile", 440, 350, 220, "lock"),
        el("hk-word", 710, 380, 1100, None, letters("Deadlock"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "deadlock · ThreadLocal · virtual threads · nhiều instance", "kin-sub r"),
    ]), beats=[
        ("Service treo cứng, CPU lại thấp, và request timeout hàng loạt. Chuyện gì đang xảy ra?",
         "Service treo, CPU thấp, request timeout hàng loạt. Chuyện gì đang xảy ra?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Hai thread đang chờ nhau mãi mãi: deadlock.", "Hai thread chờ nhau mãi mãi: deadlock.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 0.9, 0.3), IN("#hk-con-3", "type1", 1.6, 0.3)]),
        ("Hôm nay ta học deadlock, thread local, và virtual thread.", "Hôm nay: Deadlock, ThreadLocal & Virtual Threads.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ deadlock as a circular wait
    dict(id="dl", world=(1920, 1080), hud=hud("dl", "Deadlock", "Chờ nhau thành vòng"), cam="".join([
        big_title("dl", "Deadlock", "Hai xe trên cây cầu một làn"),
        gnode("dl-t1", 160, 250, 440, 110, "Thread 1 · giữ lock A", "cyan"),
        gnode("dl-t2", 1320, 250, 440, 110, "Thread 2 · giữ lock B", "amber"),
        el("dl-w1", 700, 210, 520, None, "chờ lock B", "lbl r"),
        el("dl-w2", 700, 420, 520, None, "chờ lock A", "lbl r"),
        chip("dl-st", 700, 520, "sau 500 ms: t1 = BLOCKED, t2 = BLOCKED", "red"),
        chip("dl-c1", 160, 620, "Mutual exclusion", "muted"), chip("dl-c2", 560, 620, "Hold and wait", "amber"),
        chip("dl-c3", 960, 620, "No preemption → tryLock(timeout)", "violet"), chip("dl-c4", 160, 710, "Circular wait → lấy lock theo thứ tự cố định", "green"),
        el("dl-n", 160, 810, 1600, None, "Đủ cả 4 điều kiện Coffman mới deadlock: phá một là hết. Deadlock synchronized không timeout, không exception, CPU thấp vì thread BLOCKED", "note left r"),
        wires(trace("dl-a", [(600, 280), (1312, 280)], "cyan"), trace("dl-b", [(1320, 330), (608, 330)], "amber")),
    ]), beats=[
        ("Phần một: deadlock.", "Phần 1: deadlock.",
         [TYPE("#dl-big", 0.1, 0.06), IN("#dl-bsub", "blur", 0.8)]),
        ("Chuyển tiền: thread một khóa tài khoản A rồi chờ B. Thread hai khóa B rồi chờ A. Cả hai chờ nhau mãi mãi.",
         "Chuyển tiền: thread 1 khoá A rồi chờ B, thread 2 khoá B rồi chờ A. Chờ nhau mãi mãi.",
         [OUT("#dl-big, #dl-bsub", "zoom"), IN("#dl-hud", "left", 0.2), IN("#dl-t1", "pop", 0.4), LIGHT("#dl-t1", 0.8),
          DRAW("#dl-a-p", 1.4, 0.5), IN("#dl-w1", "fade", 1.6), IN("#dl-t2", "pop", 2.6), LIGHT("#dl-t2", 3.0),
          DRAW("#dl-b-p", 3.4, 0.5), IN("#dl-w2", "fade", 3.6), COMET("dl-a", 4.4, 0.7), COMET("dl-b", 4.8, 0.7), IN("#dl-st", "pop", 5.4)]),
        ("Deadlock cần đủ bốn điều kiện Coffman. Phá được một là hết. Cách phổ biến nhất là phá vòng chờ, bằng cách lấy lock theo thứ tự cố định.",
         "Cần đủ 4 điều kiện Coffman, phá một là hết. Phổ biến nhất: phá circular wait bằng thứ tự lock cố định.",
         [IN("#dl-c1", "left", 0.3), IN("#dl-c2", "left", 0.8), IN("#dl-c3", "left", 1.3), IN("#dl-c4", "left", 4.4), PULSE("#dl-c4", 6.4)]),
        ("Deadlock với synchronized không tự hết: không timeout, không exception, và CPU lại thấp, nên dễ bị chẩn đoán nhầm là service chậm.",
         "Deadlock synchronized không tự hết: không timeout, không exception, CPU thấp, dễ chẩn đoán nhầm là chậm.",
         [IN("#dl-n", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ detecting deadlocks
    dict(id="detect", world=(1920, 1080), hud=hud("dt", "Phát hiện deadlock", "jstack và ThreadMXBean"), cam="".join([
        console("dt-js", 160, 190, 1600, ["Found one Java-level deadlock:", '"transfer-1-to-2": waiting to lock monitor … held by "transfer-2-to-1"', '"transfer-2-to-1": waiting to lock monitor … held by "transfer-1-to-2"']),
        box("dt-code", 160, 440, 1000, 200, code("ThreadMXBean mx = ManagementFactory.getThreadMXBean();\nlong[] ids = mx.findDeadlockedThreads();   // null nếu không có"), "cyan", "code"),
        console("dt-mx", 1220, 440, 540, ["deadlocked count=2"]),
        chip("dt-t1", 160, 690, "Đặt tên thread: transfer-1-to-2 dễ đọc hơn Thread-0", "green"),
        chip("dt-t2", 160, 770, "Chụp thread dump 2–3 lần cách nhau vài giây", "green"),
        chip("dt-t3", 160, 850, "Actuator /actuator/threaddump khi không vào được máy chủ", "violet"),
    ]), beats=[
        ("Phần hai: phát hiện deadlock. Chạy jstack lên process: JVM in sẵn thread nào giữ lock nào, chờ lock nào.",
         "Phần 2: jstack in sẵn \"Found one Java-level deadlock\": thread nào giữ lock nào, chờ lock nào.",
         [IN("#dt-hud", "left", 0.1), IN("#dt-js", "up", 0.4, 0.4), IN("#dt-js-1", "type1", 0.8, 0.3), IN("#dt-js-2", "type1", 2.4, 0.3), IN("#dt-js-3", "type1", 3.6, 0.3)]),
        ("Trong code, find deadlocked threads trả về đúng hai thread. Dùng để làm health check.",
         "Trong code: ThreadMXBean.findDeadlockedThreads() trả đúng 2 thread. Dùng làm health check.",
         [IN("#dt-code", "up", 0.3), IN("#dt-mx", "right", 1.6, 0.4), IN("#dt-mx-1", "type1", 2.0, 0.3)]),
        ("Mẹo: đặt tên thread, chụp thread dump hai ba lần, và dùng endpoint thread dump của Actuator.",
         "Mẹo: đặt tên thread, chụp thread dump 2–3 lần, dùng /actuator/threaddump.",
         [IN("#dt-t1", "left", 0.3), IN("#dt-t2", "left", 1.6), IN("#dt-t3", "left", 3.2)]),
    ]),
    # ------------------------------------------------------------ avoiding deadlocks
    dict(id="avoid", world=(1920, 1080), hud=hud("av", "Phòng tránh deadlock", "Thứ tự cố định, hoặc tryLock"), cam="".join([
        box("av-code", 160, 190, 1000, 290, code(
            "Account first  = from.getId() < to.getId() ? from : to;\nAccount second = from.getId() < to.getId() ? to : from;\n"
            "synchronized (first) {\n    synchronized (second) { from.withdraw(a); to.deposit(a); }\n}"), "green", "code"),
        console("av-con", 1220, 200, 540, ["1→2 và 2→1 chạy đồng thời", "cả hai xong sau 415 ms"]),
        el("av-try", 160, 520, 1600, None, "Không áp được thứ tự: tryLock(50 ms) lock thứ hai, thất bại thì nhả hết, chờ ngẫu nhiên rồi thử lại (tránh livelock)", "note left r"),
        el("av-db", 160, 630, 1600, None, "Deadlock ở DB: DB tự phát hiện và rollback một transaction (MySQL 1213, PostgreSQL deadlock detected). Update row theo thứ tự id, transaction ngắn, retry cả transaction", "warnbox r"),
        chip("av-cb", 160, 790, "Đừng gọi code bên ngoài (callback, HTTP) khi đang giữ lock", "red"),
    ]), beats=[
        ("Phần ba: phòng tránh. Luôn khóa tài khoản có id nhỏ trước. Hai giao dịch ngược chiều chạy cùng lúc vẫn xong, không treo.",
         "Phần 3: luôn khoá id nhỏ trước. Hai giao dịch ngược chiều chạy cùng lúc: xong sau 415 ms, không treo.",
         [IN("#av-hud", "left", 0.1), IN("#av-code", "up", 0.4), IN("#av-con", "right", 4.0, 0.4), IN("#av-con-1", "type1", 4.4, 0.3), IN("#av-con-2", "type1", 5.4, 0.3)]),
        ("Không áp được thứ tự thì dùng try lock có timeout: thất bại thì nhả hết, chờ ngẫu nhiên rồi thử lại.",
         "Không áp được thứ tự: tryLock có timeout, thất bại thì nhả hết, chờ ngẫu nhiên rồi thử lại.",
         [IN("#av-try", "up", 0.3)]),
        ("Ở database, deadlock được tự phát hiện và một transaction bị rollback. Hãy update theo thứ tự id, và retry cả transaction.",
         "DB tự phát hiện deadlock, rollback một transaction. Update theo thứ tự id, retry cả transaction.",
         [IN("#av-db", "up", 0.3), IN("#av-cb", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ ThreadLocal
    dict(id="tl", world=(1920, 1080), hud=hud("tl", "ThreadLocal", "Mỗi thread một ngăn tủ riêng"), cam="".join([
        chip("tl-s1", 160, 190, "SecurityContextHolder: user đang đăng nhập", "cyan"),
        chip("tl-s2", 160, 270, "TransactionSynchronizationManager: transaction của @Transactional", "violet"),
        chip("tl-s3", 160, 350, "MDC: traceId in vào mọi dòng log", "green"),
        gnode("tl-r1", 160, 470, 480, 100, "request 1: set(\"alice\")", "cyan"),
        gnode("tl-th", 760, 470, 400, 100, "thread pool-1", "violet"),
        gnode("tl-r2", 1340, 470, 420, 100, "request 2: get()", "red"),
        chip("tl-leak", 1340, 610, "thấy \"alice\": rò dữ liệu, lỗi bảo mật", "red"),
        chip("tl-fix", 160, 610, "set rồi remove() trong finally → request sau thấy null", "green"),
        el("tl-async", 160, 720, 1600, None, "Không tự sang thread khác: supplyAsync đọc được null. @Async, CompletableFuture mất MDC, SecurityContext → dùng TaskDecorator để copy", "note left r"),
        wires(trace("tl-a", [(640, 520), (752, 520)], "cyan"), trace("tl-b", [(1160, 520), (1332, 520)], "red")),
    ]), beats=[
        ("Phần bốn: thread local cho mỗi thread một bản sao riêng. Spring dùng nó cho security context, cho transaction, và cho MDC.",
         "Phần 4: ThreadLocal: mỗi thread một bản sao. Spring dùng cho SecurityContext, @Transactional, MDC.",
         [IN("#tl-hud", "left", 0.1), IN("#tl-s1", "left", 3.2), IN("#tl-s2", "left", 4.4), IN("#tl-s3", "left", 5.8)]),
        ("Bẫy: thread pool tái sử dụng thread. Request một set alice mà quên remove, request hai trên cùng thread đọc ra alice.",
         "Bẫy: pool tái sử dụng thread. Request 1 set alice quên remove: request 2 đọc ra alice.",
         [IN("#tl-r1", "pop", 0.3), DRAW("#tl-a-p", 0.8, 0.4), IN("#tl-th", "pop", 1.0), COMET("tl-a", 1.2, 0.5), LIGHT("#tl-th", 1.7),
          DRAW("#tl-b-p", 3.0, 0.4), IN("#tl-r2", "pop", 3.2), COMET("tl-b", 3.4, 0.5), LIGHT("#tl-r2", 3.9), IN("#tl-leak", "pop", 4.6), SHAKE("#tl-leak", 5.2)]),
        ("Luôn remove trong finally. Và thread local không tự sang thread của async, nên dùng task decorator để copy.",
         "Luôn remove() trong finally. ThreadLocal không sang thread @Async: dùng TaskDecorator để copy.",
         [IN("#tl-fix", "left", 0.3), IN("#tl-async", "up", 2.6)]),
    ]),
    # ------------------------------------------------------------ virtual threads
    dict(id="vt", world=(1920, 1080), hud=hud("vt", "Virtual threads", "Chờ rẻ hơn, không chạy nhanh hơn"), cam="".join([
        el("vt-hero", 120, 190, 1700, None, "Virtual Threads", "glow r", "font-size:110px;text-align:left;--tone:var(--cyan)"),
        gnode("vt-v1", 120, 360, 340, 90, "virtual 1 · chờ DB", "muted"),
        gnode("vt-v2", 120, 470, 340, 90, "virtual 2 · chạy", "cyan"),
        gnode("vt-v3", 120, 580, 340, 90, "virtual 3 · chạy", "cyan"),
        gnode("vt-c1", 760, 420, 340, 90, "carrier 1", "violet"),
        gnode("vt-c2", 760, 530, 340, 90, "carrier 2", "violet"),
        el("vt-un", 120, 690, 640, None, "chặn I/O thì JVM gỡ khỏi carrier, carrier rảnh chạy việc khác", "note left r"),
        el("vt-l", 1180, 360, 640, None, "10.000 task, mỗi task sleep(100):", "lbl r", "text-align:left"),
        box("vt-b1", 1180, 400, 620, 80, "<b>pool 200 platform: 5249 ms</b>", "red", "card"),
        box("vt-b2", 1180, 500, 200, 80, "<b>168 ms</b>", "green", "card"),
        el("vt-b2l", 1400, 520, 420, None, "virtual thread per task", "note left r"),
        el("vt-cpu", 1180, 620, 640, None, "CPU-bound: ngang nhau, vẫn chỉ 8 CPU làm việc", "note left r"),
        chip("vt-sb", 120, 800, "Spring Boot 3.2+: spring.threads.virtual.enabled=true", "violet"),
        wires(trace("vt-a", [(460, 515), (752, 465)], "cyan"), trace("vt-b", [(460, 625), (752, 575)], "cyan")),
    ]), beats=[
        ("Phần năm: virtual thread do JVM quản lý, rất nhẹ, chạy trên vài carrier thread. Khi nó chờ vào ra, JVM gỡ nó ra để carrier chạy việc khác.",
         "Phần 5: virtual thread do JVM quản lý, chạy trên vài carrier. Chờ I/O thì JVM gỡ ra, carrier chạy việc khác.",
         [IN("#vt-hud", "left", 0.1), IN("#vt-hero", "glowin", 0.6, 0.9), IN("#vt-v1, #vt-v2, #vt-v3", "pop", 2.6, 0.4, 0.12),
          IN("#vt-c1, #vt-c2", "pop", 3.2, 0.4, 0.12), DRAW("#vt-a-p", 3.8, 0.4), DRAW("#vt-b-p", 3.8, 0.4),
          COMET("vt-a", 4.4, 0.5), COMET("vt-b", 4.4, 0.5), LIGHT("#vt-c1", 4.9), LIGHT("#vt-c2", 4.9), IN("#vt-un", "up", 6.6)]),
        ("Mười nghìn task, mỗi task ngủ một trăm mili giây: pool hai trăm thread mất hơn năm giây, virtual thread chỉ một trăm sáu mươi tám mili giây.",
         "10.000 task × sleep(100): pool 200 platform 5249 ms, virtual thread 168 ms.",
         [IN("#vt-l", "fade", 0.3), IN("#vt-b1", "left", 1.4, 0.7), IN("#vt-b2", "left", 5.4, 0.4), IN("#vt-b2l", "fade", 5.8)]),
        ("Nhưng nó giúp chờ rẻ hơn, không làm tính toán nhanh hơn. Spring Boot ba chấm hai bật bằng một dòng cấu hình.",
         "Nhưng chỉ giúp chờ rẻ hơn, không giúp CPU-bound. Spring Boot 3.2+ bật bằng một dòng cấu hình.",
         [IN("#vt-cpu", "up", 0.3), IN("#vt-sb", "left", 3.4)]),
    ]),
    # ------------------------------------------------------------ pinning and caveats
    dict(id="pin", world=(1920, 1080), hud=hud("pn", "Pinning và các lưu ý", "Java 21–23"), cam="".join([
        el("pn-l", 160, 190, 1600, None, "100 virtual thread, mỗi cái sleep(100) khi đang giữ lock riêng:", "lbl r", "text-align:left"),
        box("pn-b1", 160, 240, int(1345 * BAR * 2.2), 80, "<b>synchronized: 1345 ms (bị pin)</b>", "red", "card"),
        box("pn-b2", 160, 340, 540, 80, "<b>ReentrantLock: 101 ms</b>", "green", "card"),
        el("pn-why", 740, 350, 1060, None, "Bị pin: chặn trong synchronized giữ luôn carrier, chỉ 8 carrier nên chạy 13 đợt. Java 24 (JEP 491) đã sửa", "note left r"),
        chip("pn-trace", 160, 470, "-Djdk.tracePinnedThreads=short in ra chỗ bị pin", "violet"),
        chip("pn-pool", 160, 560, "Không pool virtual thread: newVirtualThreadPerTaskExecutor(); giới hạn bằng Semaphore", "amber"),
        console("pn-db", 160, 650, 1100, ["1000 virtual thread qua Semaphore(10) × 50 ms → 5424 ms"]),
        el("pn-dbn", 160, 790, 1600, None, "DB connection pool vẫn là giới hạn thật: virtual thread không làm DB nhanh hơn", "warnbox r"),
    ]), beats=[
        ("Phần sáu: pinning. Ở Java hai mốt, chặn bên trong synchronized làm virtual thread dính chặt vào carrier: một trăm thread mất hơn một giây ba. Đổi sang reentrant lock chỉ còn một trăm lẻ một mili giây.",
         "Phần 6: pinning. Java 21: chặn trong synchronized → 1345 ms. Đổi sang ReentrantLock → 101 ms.",
         [IN("#pn-hud", "left", 0.1), IN("#pn-l", "fade", 0.4), IN("#pn-b1", "left", 2.6, 0.8), IN("#pn-b2", "left", 9.0, 0.4)]),
        ("Lý do: chỉ có tám carrier nên chạy mười ba đợt. Java hai mươi tư đã sửa lỗi này.",
         "Chỉ 8 carrier nên chạy 13 đợt. Java 24 (JEP 491) đã sửa.",
         [IN("#pn-why", "up", 0.3), IN("#pn-trace", "left", 3.0)]),
        ("Đừng pool virtual thread, hãy giới hạn bằng semaphore. Và connection pool của database vẫn là giới hạn thật: một nghìn thread qua mười connection vẫn mất hơn năm giây.",
         "Đừng pool virtual thread, giới hạn bằng Semaphore. 1000 thread qua 10 connection vẫn mất 5424 ms.",
         [IN("#pn-pool", "left", 0.3), IN("#pn-db", "up", 3.6, 0.4), IN("#pn-db-1", "type1", 4.0, 0.3), IN("#pn-dbn", "up", 6.6)]),
    ]),
    # ------------------------------------------------------------ races across instances
    dict(id="multi", world=(1920, 1080), hud=hud("mi", "Race khi chạy nhiều instance", "synchronized chỉ khoá trong một JVM"), cam="".join([
        gnode("mi-a", 160, 220, 380, 100, "Instance A", "cyan"),
        gnode("mi-db", 770, 220, 380, 100, "Database · stock 1", "violet"),
        gnode("mi-b", 1380, 220, 380, 100, "Instance B", "amber"),
        chip("mi-s1", 160, 370, "A: SELECT stock → 1", "cyan"), chip("mi-s2", 1380, 370, "B: SELECT stock → 1", "amber"),
        chip("mi-s3", 160, 450, "A: UPDATE stock = 0", "cyan"), chip("mi-s4", 1380, 450, "B: UPDATE stock = 0", "amber"),
        el("mi-over", 640, 400, 640, None, "bán 2, kho chỉ có 1", "stamp red r"),
        box("mi-fix", 160, 560, 1600, 130, code("UPDATE product SET stock = stock - 1 WHERE id = ? AND stock >= 1;   -- 0 row = hết hàng"), "green", "code"),
        chip("mi-o1", 160, 730, "@Version: optimistic lock", "violet"), chip("mi-o2", 600, 730, "SELECT ... FOR UPDATE", "violet"),
        chip("mi-o3", 1060, 730, "Distributed lock (Redis) có TTL: cuối cùng", "amber"),
        wires(trace("mi-ta", [(540, 270), (762, 270)], "cyan"), trace("mi-tb", [(1372, 270), (1158, 270)], "amber")),
    ]), beats=[
        ("Phần bảy: service chạy ba instance. Synchronized chỉ khóa trong một JVM, nên hai request vào hai instance cùng thấy còn một, cùng trừ: bán hai mà kho chỉ có một.",
         "Phần 7: 3 instance. synchronized chỉ khoá trong một JVM: hai instance cùng thấy còn 1, cùng trừ, bán 2.",
         [IN("#mi-hud", "left", 0.1), IN("#mi-a, #mi-db, #mi-b", "pop", 0.4, 0.4, 0.15), DRAW("#mi-ta-p", 1.0, 0.4), DRAW("#mi-tb-p", 1.0, 0.4),
          COMET("mi-ta", 3.6, 0.5), IN("#mi-s1", "pop", 4.0), COMET("mi-tb", 4.4, 0.5), IN("#mi-s2", "pop", 4.8),
          IN("#mi-s3", "pop", 6.0), IN("#mi-s4", "pop", 6.6), IN("#mi-over", "pop", 7.4), SHAKE("#mi-over", 8.0)]),
        ("Xử lý ở nơi dữ liệu dùng chung: update có điều kiện trong một câu SQL, kiểm tra số row bị ảnh hưởng.",
         "Xử lý ở DB: update có điều kiện trong một câu SQL, kiểm tra số row bị ảnh hưởng.",
         [IN("#mi-fix", "up", 0.3)]),
        ("Hoặc version cho optimistic lock, select for update khi tranh chấp cao, và distributed lock là lựa chọn cuối cùng.",
         "Hoặc @Version, SELECT FOR UPDATE khi tranh chấp cao; distributed lock là lựa chọn cuối cùng.",
         [IN("#mi-o1", "left", 0.3), IN("#mi-o2", "left", 1.6), IN("#mi-o3", "left", 3.2)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("lock", "Deadlock", "khoá theo thứ tự id"),
                                                ("shield", "ThreadLocal", "remove() trong finally"),
                                                ("share", "Virtual threads", "chờ I/O rẻ, không giúp CPU"),
                                                ("grid", "Nhiều instance", "khoá ở DB, không ở JVM")]),
        chip("ou-next", 760, 650, "Bài tiếp: Index & EXPLAIN", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: tránh deadlock bằng thứ tự lock cố định. Thread local luôn remove trong finally. Virtual thread làm việc chờ rẻ hơn, nhưng không giúp tính toán. Và chạy nhiều instance thì khóa ở database.",
         "Deadlock: khoá theo thứ tự · ThreadLocal: remove() trong finally · virtual thread: chờ rẻ, không giúp CPU · nhiều instance: khoá ở DB.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.0), IN("#ou-c2", "pop", 5.4), IN("#ou-c3", "pop", 8.6)]),
        ("Bài tiếp: index, và explain.", "Bài tiếp: Index & EXPLAIN.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
