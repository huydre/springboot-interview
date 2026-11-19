"""synchronized, volatile, Atomic & ConcurrentHashMap explainer: scene layouts and per-beat narration + motion.

Measured on JDK 21 (8 CPUs); race results change every run:
100 threads x 1000 count++: plain int wrong 10/20 runs (e.g. 90889, 97305, 99000), volatile int wrong 20/20;
8 threads x 5,000,000: plain int 13,505,781; synchronized 40,000,000 in 1453 ms; AtomicInteger 40,000,000 in 1098 ms;
LongAdder 40,000,000 in 114 ms; busy loop on a plain boolean flag still alive 3 s after the flag was cleared, on a
volatile flag it stopped; tryLock(500 ms) while another thread holds the lock -> false after 507 ms; 4 readers holding
the lock 300 ms: readLock 325 ms, ReentrantLock 1235 ms; ConcurrentHashMap 8 threads x 10,000: get+put wrong 20/20
(e.g. 24610), merge wrong 0/20; 8 threads loading "cfg" (50 ms): containsKey+put loads 8 times, computeIfAbsent once;
CHM null key/value -> NullPointerException; HashMap put while iterating -> ConcurrentModificationException, CHM no
exception (visited 6); CopyOnWriteArrayList add while iterating [1, 2, 3] -> 3 loops, list [1, 2, 3, 10, 20, 30].
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

BAR = 0.5  # px per ms

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #14", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("volatile có làm count++ an toàn không?"), "h1 center r"),
        console("hk-con", 460, 420, 1000, ["100 thread × 1000 lần count++ trên volatile int", "sai 20/20 lần chạy"]),
        tile("hk-tile", 300, 350, 220, "lock"),
        el("hk-word", 570, 380, 1400, None, letters("synchronized & volatile"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "race condition · happens-before · Atomic · ConcurrentHashMap", "kin-sub r"),
    ]), beats=[
        ("Volatile có làm phép tăng count an toàn không?", "volatile có làm count++ an toàn không?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Không. Một trăm thread, mỗi thread tăng một nghìn lần: biến volatile sai cả hai mươi trên hai mươi lần chạy.",
         "Không. 100 thread × 1000 lần: volatile sai 20/20 lần chạy.",
         [IN("#hk-con", "up", 0.3, 0.4), IN("#hk-con-1", "type1", 0.8, 0.3), IN("#hk-con-2", "type1", 4.4, 0.3), SHAKE("#hk-con", 5.0)]),
        ("Hôm nay ta học synchronized, volatile, atomic, và concurrent hash map.", "Hôm nay: synchronized, volatile, Atomic & ConcurrentHashMap.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.03), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ race condition
    dict(id="race", world=(1920, 1080), hud=hud("rc", "Race condition", "count++ là 3 bước"), cam="".join([
        big_title("rc", "Race condition", "count++ trông như một lệnh, thật ra là ba bước"),
        gnode("rc-a", 100, 220, 300, 100, "Thread A", "cyan"),
        gnode("rc-m", 760, 220, 400, 100, "count trên heap", "violet"),
        gnode("rc-b", 1520, 220, 300, 100, "Thread B", "amber"),
        chip("rc-s1", 160, 380, "A đọc 5", "cyan"), chip("rc-s2", 1520, 380, "B đọc 5", "amber"),
        chip("rc-s3", 160, 460, "A ghi 6", "cyan"), chip("rc-s4", 1520, 460, "B ghi 6", "amber"),
        el("rc-lost", 640, 400, 640, None, "tăng 2 lần nhưng chỉ lên 6", "stamp red r"),
        console("rc-con", 100, 590, 1100, ["100 thread × 1000: biến thường sai 10/20 lần (90889, 97305, …)", "8 thread × 5 triệu: còn 13.505.781 / 40.000.000"]),
        el("rc-w", 100, 760, 1720, None, "Chạy thử thấy đúng không chứng minh code thread-safe: race lúc đúng lúc sai, tải cao mới lộ", "warnbox r"),
        wires(trace("rc-ta", [(400, 270), (752, 270)], "cyan"), trace("rc-tb", [(1512, 270), (1168, 270)], "amber")),
    ]), beats=[
        ("Phần một: race condition.", "Phần 1: race condition.",
         [TYPE("#rc-big", 0.1, 0.05), IN("#rc-bsub", "blur", 1.0)]),
        ("Phép tăng count gồm ba bước: đọc, cộng một, ghi lại. Thread A và B cùng đọc năm, cùng ghi sáu: tăng hai lần mà chỉ lên sáu.",
         "count++ = đọc, cộng 1, ghi. A và B cùng đọc 5, cùng ghi 6: tăng 2 lần mà chỉ lên 6.",
         [OUT("#rc-big, #rc-bsub", "zoom"), IN("#rc-hud", "left", 0.2), IN("#rc-a, #rc-m, #rc-b", "pop", 0.6, 0.4, 0.15),
          DRAW("#rc-ta-p", 1.2, 0.4), DRAW("#rc-tb-p", 1.2, 0.4),
          COMET("rc-ta", 3.4, 0.5), IN("#rc-s1", "pop", 3.7), COMET("rc-tb", 3.9, 0.5), IN("#rc-s2", "pop", 4.2),
          IN("#rc-s3", "pop", 4.8), IN("#rc-s4", "pop", 5.3), IN("#rc-lost", "pop", 5.9), SHAKE("#rc-lost", 6.4)]),
        ("Mình đo được: một trăm thread, mỗi thread một nghìn lần, sai mười trên hai mươi lần chạy. Tám thread, mỗi thread năm triệu lần, mất hơn một nửa.",
         "Đo được: 100 × 1000 sai 10/20 lần. 8 × 5 triệu: chỉ còn 13.505.781 / 40.000.000.",
         [IN("#rc-con", "up", 0.3, 0.4), IN("#rc-con-1", "type1", 0.8, 0.3), IN("#rc-con-2", "type1", 5.4, 0.3)]),
        ("Vì lúc đúng lúc sai, chạy thử thấy đúng không chứng minh được code an toàn.", "Lúc đúng lúc sai: chạy thử thấy đúng không chứng minh được gì.",
         [IN("#rc-w", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ synchronized
    dict(id="sync", world=(1920, 1080), hud=hud("sy", "synchronized: monitor lock", "Phòng thử đồ có một chìa khoá"), cam="".join([
        box("sy-forms", 160, 190, 1000, 220, code(
            "synchronized void m()            // khoá this\nstatic synchronized void m()     // khoá ClassName.class\nsynchronized (lock) { ... }      // khoá object lock riêng"), "cyan", "code"),
        el("sy-g1", 1220, 205, 540, None, "Mutual exclusion: một thread một lúc", "note green left r"),
        el("sy-g2", 1220, 285, 540, None, "Visibility: thread vào sau thấy thay đổi của người ra trước", "note green left r"),
        console("sy-con", 160, 450, 1000, ["synchronized (LOCK) { count++; }  8 × 5 triệu → 40.000.000"]),
        el("sy-re", 160, 600, 1600, None, "Reentrant: outer() synchronized gọi inner() synchronized cùng lock: không tự deadlock. Lock tự nhả khi có exception", "note left r"),
        el("sy-w1", 160, 690, 1600, None, "Khoá trên object khác nhau thì không bảo vệ gì. Đừng khoá trên String literal hay Integer", "warnbox r"),
        el("sy-w2", 160, 800, 1600, None, "synchronized trên method @Transactional: lock nhả khi return, transaction commit sau đó ở proxy, thread khác vẫn đọc dữ liệu cũ", "err r"),
    ]), beats=[
        ("Phần hai: synchronized. Mỗi object có một monitor lock, như phòng thử đồ có một chìa khóa: ai cầm chìa thì vào.",
         "Phần 2: synchronized. Mỗi object có một monitor lock, như phòng thử đồ một chìa khoá.",
         [IN("#sy-hud", "left", 0.1), IN("#sy-forms", "up", 0.6)]),
        ("Nó đảm bảo hai điều: một thread một lúc, và thread vào sau thấy mọi thay đổi của thread trước. Tám thread, năm triệu lần: luôn đúng bốn mươi triệu.",
         "Đảm bảo: mutual exclusion và visibility. 8 × 5 triệu: luôn đúng 40.000.000.",
         [IN("#sy-g1", "left", 0.3), IN("#sy-g2", "left", 2.0), IN("#sy-con", "up", 5.0, 0.4), IN("#sy-con-1", "type1", 5.4, 0.3)]),
        ("Synchronized là reentrant, và tự nhả lock kể cả khi có exception. Nhưng phải khóa trên cùng một object.",
         "Reentrant, tự nhả lock kể cả khi exception. Nhưng phải khoá trên cùng một object.",
         [IN("#sy-re", "up", 0.3), IN("#sy-w1", "up", 3.4)]),
        ("Bẫy trong Spring: synchronized trên method có transactional không bảo vệ được, vì transaction commit sau khi lock đã nhả.",
         "Bẫy Spring: synchronized + @Transactional không bảo vệ được: commit xảy ra sau khi lock đã nhả.",
         [IN("#sy-w2", "up", 0.3), SHAKE("#sy-w2", 2.0)]),
    ]),
    # ------------------------------------------------------------ volatile
    dict(id="volatile", world=(1920, 1080), hud=hud("vl", "volatile", "Chỉ đảm bảo visibility"), cam="".join([
        box("vl-code", 160, 190, 1000, 260, code(
            "static boolean running = true;   // thử lại với volatile\n\nnew Thread(() -> { while (running) n++; }).start();\nThread.sleep(1000);\nrunning = false;"), "cyan", "code"),
        gnode("vl-p", 1220, 200, 540, 100, "boolean: vẫn chạy sau 3 s", "red"),
        gnode("vl-v", 1220, 340, 540, 100, "volatile: dừng ngay", "green"),
        el("vl-why", 1220, 470, 540, None, "JIT có thể đưa việc đọc running ra khỏi vòng lặp", "note left r"),
        el("vl-hero", 160, 560, 1600, None, "visibility, không phải atomicity", "glow r", "font-size:72px;text-align:left;--tone:var(--cyan)"),
        chip("vl-ok", 160, 690, "Hợp: cờ trạng thái, một thread ghi nhiều thread đọc, double-checked locking", "green"),
        chip("vl-no", 160, 780, "Không hợp: đọc-sửa-ghi như count++ → dùng Atomic, LongAdder, synchronized", "red"),
    ]), beats=[
        ("Phần ba: volatile. Cờ dừng không có volatile: sau ba giây chờ, thread vẫn chạy, cả năm lần thử.",
         "Phần 3: volatile. Cờ dừng không volatile: thread vẫn chạy sau 3 giây chờ.",
         [IN("#vl-hud", "left", 0.1), IN("#vl-code", "up", 0.4), IN("#vl-p", "pop", 3.0), LIGHT("#vl-p", 3.4), SHAKE("#vl-p", 3.8), IN("#vl-why", "up", 4.4)]),
        ("Thêm volatile thì dừng ngay. Volatile đảm bảo ghi xong thì thread khác thấy ngay, và chống sắp xếp lại lệnh.",
         "Thêm volatile: dừng ngay. volatile đảm bảo visibility và chống reorder.",
         [IN("#vl-v", "pop", 0.3), LIGHT("#vl-v", 0.7), IN("#vl-hero", "glowin", 2.6, 0.9)]),
        ("Nhưng nó không làm phép tăng thành nguyên tử. Dùng cho cờ trạng thái; còn đọc sửa ghi thì dùng atomic hoặc synchronized.",
         "Không làm count++ thành nguyên tử. Dùng cho cờ trạng thái; đọc-sửa-ghi thì Atomic hoặc synchronized.",
         [IN("#vl-ok", "left", 2.6), IN("#vl-no", "left", 4.6)]),
    ]),
    # ------------------------------------------------------------ happens-before
    dict(id="hb", world=(1920, 1080), hud=hud("hb", "Happens-before", "Khi nào thread khác chắc chắn thấy"), cam="".join([
        chip("hb-1", 160, 200, "Unlock monitor → lock tiếp theo cùng monitor", "cyan"),
        chip("hb-2", 160, 280, "Ghi volatile → đọc sau đó của cùng biến", "violet"),
        chip("hb-3", 160, 360, "Thread.start() → mọi lệnh trong thread mới", "green"),
        chip("hb-4", 160, 440, "Mọi lệnh trong thread → join() trả về", "green"),
        chip("hb-5", 160, 520, "Future hoàn thành → get(), join() trả về", "amber"),
        gnode("hb-a", 160, 650, 520, 110, "data = 42; ready = true", "cyan"),
        gnode("hb-b", 1100, 650, 560, 110, "if (ready) → data == 42", "green"),
        el("hb-n", 160, 800, 1600, None, "Ghi volatile ready “kéo theo” cả data ghi trước nó, dù data không volatile", "note green left r"),
        wires(trace("hb-t", [(680, 705), (1092, 705)], "cyan")),
    ]), beats=[
        ("Phần bốn: happens before. Bộ nhớ Java chỉ hứa: nếu A xảy ra trước B theo quy tắc, thì B thấy mọi thứ A đã ghi.",
         "Phần 4: Java Memory Model chỉ hứa: A happens-before B thì B thấy mọi thứ A đã ghi.",
         [IN("#hb-hud", "left", 0.1), IN("#hb-1", "left", 2.0), IN("#hb-2", "left", 3.0), IN("#hb-3", "left", 4.0), IN("#hb-4", "left", 5.0), IN("#hb-5", "left", 6.0)]),
        ("Ví dụ: ghi data rồi ghi cờ volatile. Thread khác thấy cờ là true thì chắc chắn thấy data.",
         "Ví dụ: ghi data rồi ghi cờ volatile ready. Thấy ready == true thì chắc chắn thấy data == 42.",
         [IN("#hb-a", "pop", 0.3), DRAW("#hb-t-p", 1.4, 0.4), IN("#hb-b", "pop", 1.8), COMET("hb-t", 2.2, 0.6), LIGHT("#hb-b", 2.8), IN("#hb-n", "up", 3.6)]),
    ]),
    # ------------------------------------------------------------ CAS, Atomic, LongAdder
    dict(id="atomic", world=(1920, 1080), hud=hud("at", "Atomic, CAS và LongAdder", "Không dùng lock"), cam="".join([
        gnode("at-r", 100, 220, 300, 100, "đọc old", "cyan"),
        gnode("at-n", 520, 220, 340, 100, "new = old + 1", "cyan"),
        gnode("at-c", 980, 220, 380, 100, "CAS(old, new)?", "amber"),
        gnode("at-ok", 1480, 220, 260, 100, "xong", "green"),
        el("at-retry", 520, 440, 840, None, "thất bại: thread khác vừa đổi → đọc lại, thử lại", "note r"),
        el("at-l", 100, 470, 1600, None, "8 thread × 5 triệu lần tăng (lần đo này):", "lbl r", "text-align:left"),
        box("at-b1", 100, 510, int(1453 * BAR), 80, "<b>synchronized 1453 ms</b>", "violet", "card"),
        box("at-b2", 100, 610, int(1098 * BAR), 80, "<b>AtomicInteger 1098 ms</b>", "amber", "card"),
        box("at-b3", 100, 710, 380, 80, "<b>LongAdder 114 ms</b>", "green", "card"),
        el("at-why", 520, 720, 1260, None, "chia thành nhiều cell, mỗi thread cộng vào ô của mình, sum() mới cộng dồn", "note left r"),
        el("at-w", 100, 830, 1700, None, "LongAdder hợp cho counter, metric; sum() không phải snapshot nguyên tử. Cần giá trị chính xác ngay (sinh id) thì AtomicInteger", "note left r"),
        wires(trace("at-t0", [(400, 270), (512, 270)], "cyan"), trace("at-t1", [(860, 270), (972, 270)], "cyan"),
              trace("at-t2", [(1360, 270), (1472, 270)], "green"),
              trace("at-t3", [(1170, 320), (1170, 420), (250, 420), (250, 328)], "red", r=26)),
    ]), beats=[
        ("Phần năm: atomic integer không dùng lock, mà dùng lệnh compare and swap: nếu giá trị vẫn là giá trị cũ thì ghi giá trị mới, nếu không thì đọc lại và thử lại.",
         "Phần 5: AtomicInteger dùng CAS: giá trị vẫn là old thì ghi new, không thì đọc lại, thử lại.",
         [IN("#at-hud", "left", 0.1), IN("#at-r, #at-n, #at-c, #at-ok", "pop", 0.5, 0.4, 0.12),
          DRAW("#at-t0-p", 1.2, 0.3), DRAW("#at-t1-p", 1.4, 0.3), DRAW("#at-t2-p", 1.6, 0.3),
          COMET("at-t0", 2.4, 0.4), LIGHT("#at-n", 2.8), COMET("at-t1", 3.0, 0.4), LIGHT("#at-c", 3.4),
          DRAW("#at-t3-p", 5.0, 0.6), IN("#at-retry", "up", 5.4), COMET("at-t3", 5.6, 0.8),
          COMET("at-t2", 7.4, 0.4), LIGHT("#at-ok", 7.8)]),
        ("Tám thread, mỗi thread năm triệu lần. Lần đo này synchronized mất một nghìn bốn trăm năm mươi ba mili giây, atomic một nghìn chín mươi tám, còn long adder chỉ một trăm mười bốn.",
         "8 × 5 triệu: synchronized 1453 ms, AtomicInteger 1098 ms, LongAdder 114 ms.",
         [IN("#at-l", "fade", 0.3), IN("#at-b1", "left", 2.0, 0.7), IN("#at-b2", "left", 5.0, 0.7), IN("#at-b3", "left", 8.0, 0.5)]),
        ("Long adder chia thành nhiều ô, mỗi thread cộng vào ô riêng. Hợp cho bộ đếm và metric, nhưng tổng không phải ảnh chụp nguyên tử.",
         "LongAdder chia nhiều cell, mỗi thread cộng ô riêng. Hợp cho counter, metric; sum() không phải snapshot nguyên tử.",
         [IN("#at-why", "up", 0.3), IN("#at-w", "up", 4.2)]),
    ]),
    # ------------------------------------------------------------ ReentrantLock and ReadWriteLock
    dict(id="locks", world=(1920, 1080), hud=hud("lk", "ReentrantLock và ReadWriteLock", "Thêm tính năng, đổi lại phải unlock"), cam="".join([
        box("lk-code", 160, 190, 900, 330, code(
            "if (lock.tryLock(500, MILLISECONDS)) {\n    try {\n        // vùng được bảo vệ\n    } finally {\n        lock.unlock();\n    }\n} else {\n    // bận: báo lỗi, thử lại sau\n}"), "cyan", "code"),
        console("lk-con", 1100, 200, 700, ["thread khác giữ lock 2 giây", "tryLock(500 ms) = false sau 507 ms"]),
        chip("lk-f", 1100, 440, "tryLock, lockInterruptibly, fair lock, nhiều Condition", "violet"),
        el("lk-l", 160, 570, 1600, None, "4 thread cùng đọc, mỗi thread giữ lock 300 ms:", "lbl r", "text-align:left"),
        box("lk-b1", 160, 610, 420, 80, "<b>readLock 325 ms</b>", "green", "card"),
        box("lk-b2", 160, 710, int(1235 * BAR * 2) - 60, 80, "<b>ReentrantLock 1235 ms</b>", "amber", "card"),
        el("lk-w", 160, 830, 1600, None, "Quên unlock() trong finally: một exception là lock bị giữ vĩnh viễn. Gọi lock() ngay trước try", "warnbox r"),
    ]), beats=[
        ("Phần sáu: reentrant lock có thêm try lock với timeout, có thể ngắt khi đang chờ, và fair lock.",
         "Phần 6: ReentrantLock có thêm tryLock với timeout, lockInterruptibly, fair lock.",
         [IN("#lk-hud", "left", 0.1), IN("#lk-code", "up", 0.4), IN("#lk-f", "left", 3.6)]),
        ("Khi một thread khác đang giữ lock hai giây, hàm try lock chỉ chờ năm trăm mili giây rồi trả về false, thay vì treo.",
         "Thread khác giữ lock 2 giây: tryLock(500 ms) trả false sau 507 ms, thay vì treo.",
         [IN("#lk-con", "right", 0.3, 0.4), IN("#lk-con-1", "type1", 0.7, 0.3), IN("#lk-con-2", "type1", 2.6, 0.3)]),
        ("Read write lock cho nhiều người đọc cùng lúc: bốn người đọc chỉ mất ba trăm hai mươi lăm mili giây, lock thường mất hơn một giây hai.",
         "ReadWriteLock cho nhiều reader cùng lúc: 4 reader 325 ms; lock thường 1235 ms.",
         [IN("#lk-l", "fade", 0.3), IN("#lk-b1", "left", 1.6, 0.5), IN("#lk-b2", "left", 4.4, 0.7)]),
        ("Đổi lại, phải unlock trong finally.", "Đổi lại: phải unlock() trong finally.",
         [IN("#lk-w", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ ConcurrentHashMap internals
    dict(id="chm", world=(1920, 1080), hud=hud("cm", "ConcurrentHashMap bên trong", "Khoá từng bucket"), cam="".join([
        big_title("cm", "ConcurrentHashMap", "Không khoá cả map, chỉ khoá từng bucket"),
        chip("cm-h", 160, 190, "Hashtable, synchronizedMap: một lock cho cả map", "red"),
        chip("cm-7", 160, 270, "Java 7: 16 Segment, mỗi segment một lock", "amber"),
        gnode("cm-put", 160, 400, 260, 100, "put(k, v)", "cyan"),
        gnode("cm-q", 560, 400, 360, 100, "bucket rỗng?", "amber"),
        gnode("cm-cas", 1060, 300, 500, 90, "CAS đặt node, không lock", "green"),
        gnode("cm-sync", 1060, 500, 680, 90, "synchronized trên node đầu bucket", "violet"),
        el("cm-read", 160, 640, 1600, None, "Đọc không lock (field volatile). Hai thread ghi hai bucket khác nhau không chặn nhau. Size đếm kiểu LongAdder", "note left r"),
        el("cm-size", 160, 740, 1600, None, "size() khi đang có thread ghi chỉ là ước lượng: đừng dùng để ra quyết định nghiệp vụ", "warnbox r"),
        wires(trace("cm-t0", [(420, 450), (552, 450)], "cyan"),
              trace("cm-t1", [(920, 440), (990, 440), (990, 345), (1052, 345)], "green", r=24),
              trace("cm-t2", [(920, 460), (990, 460), (990, 545), (1052, 545)], "violet", r=24)),
    ]), beats=[
        ("Phần bảy: concurrent hash map bên trong.", "Phần 7: ConcurrentHashMap bên trong.",
         [TYPE("#cm-big", 0.1, 0.03), IN("#cm-bsub", "blur", 1.0)]),
        ("Hash table khóa cả map, mọi thao tác xếp hàng. Java bảy chia thành mười sáu segment.",
         "Hashtable khoá cả map. Java 7 chia 16 Segment.",
         [OUT("#cm-big, #cm-bsub", "zoom"), IN("#cm-hud", "left", 0.2), IN("#cm-h", "left", 0.4), IN("#cm-7", "left", 2.8)]),
        ("Từ Java tám: bucket rỗng thì đặt node bằng compare and swap, không lock. Bucket đã có node thì synchronized trên node đầu của chính bucket đó.",
         "Java 8+: bucket rỗng → CAS, không lock. Đã có node → synchronized trên node đầu bucket đó.",
         [IN("#cm-put", "pop", 0.3), DRAW("#cm-t0-p", 0.6, 0.3), IN("#cm-q", "pop", 0.8), COMET("cm-t0", 1.0, 0.4), LIGHT("#cm-q", 1.4),
          DRAW("#cm-t1-p", 2.0, 0.4), IN("#cm-cas", "pop", 2.4), COMET("cm-t1", 2.6, 0.5), LIGHT("#cm-cas", 3.1),
          DRAW("#cm-t2-p", 5.4, 0.4), IN("#cm-sync", "pop", 5.8), COMET("cm-t2", 6.0, 0.5), LIGHT("#cm-sync", 6.5)]),
        ("Đọc không cần lock, và hai thread ghi hai bucket khác nhau không chặn nhau. Nhưng size khi đang ghi chỉ là ước lượng.",
         "Đọc không lock; ghi hai bucket khác nhau không chặn nhau. size() khi đang ghi chỉ là ước lượng.",
         [IN("#cm-read", "up", 0.3), IN("#cm-size", "up", 4.0)]),
    ]),
    # ------------------------------------------------------------ ConcurrentHashMap traps
    dict(id="traps", world=(1920, 1080), hud=hud("tr", "Bẫy của ConcurrentHashMap", "An toàn từng method, không an toàn cả chuỗi"), cam="".join([
        box("tr-bad", 160, 190, 760, 170, win("✕ check-then-act") + code('Integer v = map.get("k");\nmap.put("k", v == null ? 1 : v + 1);'), "red", "code"),
        box("tr-good", 1000, 190, 760, 170, win("✓ nguyên tử") + code('map.merge("k", 1, Integer::sum);'), "green", "code"),
        chip("tr-r1", 160, 390, "8 thread × 10.000: sai 20/20 lần (ví dụ 24610)", "red"),
        chip("tr-r2", 1000, 390, "merge: sai 0/20 lần", "green"),
        chip("tr-c1", 160, 490, "containsKey rồi put: hàm nạp chạy 8 lần", "red"),
        chip("tr-c2", 1000, 490, "computeIfAbsent: hàm nạp chạy 1 lần", "green"),
        el("tr-null", 160, 600, 1600, None, "put(k, null) và put(null, v) → NullPointerException: trong môi trường đồng thời không phân biệt được “không có key” với “value null”", "note left r"),
        el("tr-it", 160, 700, 1600, None, "Sửa map lúc duyệt: HashMap ném ConcurrentModificationException, ConcurrentHashMap không lỗi (weakly consistent). CopyOnWriteArrayList duyệt trên snapshot", "note left r"),
        el("tr-w", 160, 810, 1600, None, "Hàm trong computeIfAbsent chạy khi đang giữ lock bucket: phải ngắn, không gọi DB, không sửa chính map", "warnbox r"),
    ]), beats=[
        ("Phần tám: concurrent hash map an toàn cho từng method, nhưng get rồi put vẫn là race. Tám thread tăng counter: sai cả hai mươi trên hai mươi lần.",
         "Phần 8: CHM an toàn từng method, nhưng get rồi put vẫn là race: sai 20/20 lần.",
         [IN("#tr-hud", "left", 0.1), IN("#tr-bad", "left", 0.6), IN("#tr-r1", "pop", 5.6), SHAKE("#tr-r1", 6.2)]),
        ("Dùng merge thì đúng cả hai mươi lần. Tương tự, nạp cache bằng compute if absent chỉ chạy hàm nạp một lần, thay vì tám lần.",
         "merge: đúng 20/20. computeIfAbsent nạp cache 1 lần thay vì 8 lần.",
         [IN("#tr-good", "right", 0.3), IN("#tr-r2", "pop", 1.4), IN("#tr-c1", "left", 3.6), IN("#tr-c2", "left", 5.6)]),
        ("Concurrent hash map cấm giá trị rỗng, và duyệt trong lúc sửa không ném lỗi.",
         "CHM cấm null key và value; duyệt trong lúc sửa không ném ConcurrentModificationException.",
         [IN("#tr-null", "up", 0.3), IN("#tr-it", "up", 2.6)]),
        ("Lưu ý: hàm trong compute if absent chạy khi đang giữ lock, nên phải ngắn, và không được sửa chính map đó.",
         "Hàm trong computeIfAbsent chạy khi giữ lock: phải ngắn, không sửa chính map.",
         [IN("#tr-w", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("lock", "synchronized", "loại trừ + visibility"),
                                                ("eq", "volatile", "visibility, không atomic"),
                                                ("split", "Atomic, LongAdder", "CAS; counter dùng LongAdder"),
                                                ("grid", "ConcurrentHashMap", "merge, computeIfAbsent")]),
        chip("ou-next", 600, 650, "Bài tiếp: Deadlock, ThreadLocal & Virtual Threads", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: synchronized cho loại trừ và visibility. Volatile chỉ cho visibility. Atomic dùng compare and swap, bộ đếm thì dùng long adder. Và với concurrent hash map, dùng merge hay compute if absent thay cho get rồi put.",
         "synchronized: loại trừ + visibility · volatile: chỉ visibility · Atomic: CAS, counter dùng LongAdder · CHM: merge, computeIfAbsent.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.6), IN("#ou-c2", "pop", 6.0), IN("#ou-c3", "pop", 9.6)]),
        ("Bài sau: deadlock, thread local, và virtual thread.", "Bài sau: Deadlock, ThreadLocal & Virtual Threads.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
