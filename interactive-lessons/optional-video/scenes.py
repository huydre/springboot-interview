"""Optional & Parallel Stream explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output was run on JDK 21 on an 8-CPU machine:
Optional.of(null) -> NullPointerException; Optional.ofNullable(null) -> Optional.empty;
findById(1).map(User::address).map(Address::city).orElse("UNKNOWN") -> Hà Nội; user 2 has no address -> UNKNOWN;
Optional.of("x").orElse(load("orElse")) prints "load() called for orElse"; orElseGet(() -> load(...)) prints nothing;
empty.get() -> java.util.NoSuchElementException: No value present;
cpus=8, ForkJoinPool.commonPool().getParallelism() = 7, workers are ForkJoinPool.commonPool-worker-N plus main;
CompletableFuture.supplyAsync without an executor runs on ForkJoinPool.commonPool-worker-N;
IntStream.range(0, 10_000).parallel().forEach(list::add) on an ArrayList: wrong size 30/30 runs (one run: 2178);
.parallel().boxed().toList() -> always 10000; range(0, 8).parallel().forEach -> 54762310, forEachOrdered -> 01234567;
Stream.of(1, 2, 3, 4).reduce(10, Integer::sum) -> 20 sequential, 50 parallel; reduce(0, ...) parallel -> 10.

Visual language: the "mono" theme (NullMotion "Infinite" ad): circuits with rounded corners, comets, nodes that fill with
blue glass, a glowing hero word, and an app-icon tile.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)




def unlight(sel, d=0.0):
    """Switch LIGHT glows back off (so a circuit can run a second time)."""
    return TO(sel, {"opacity": 0}, d, 0.3, "power1.out")


ANTI = [  # (anti-pattern, fix)
    ("opt.get() khi chưa chắc có giá trị", "orElseThrow(), orElse, map"),
    ("if (opt.isPresent()) x = opt.get();", "opt.map(...), opt.ifPresent(...)"),
    ("Field Optional trong entity, DTO", "field thường, getter trả Optional"),
    ("Tham số method kiểu Optional", "overload method"),
    ("Optional<List<T>>", "trả List.of()"),
    ("return null cho kiểu Optional", "trả Optional.empty()"),
]
WHEN = [  # (use parallel, avoid parallel)
    ("Dữ liệu lớn: hàng trăm nghìn phần tử", "Dữ liệu nhỏ: chia, gộp tốn hơn lợi"),
    ("Tác vụ CPU-bound, tính toán thuần", "Tác vụ I/O: gọi DB, HTTP, đọc file"),
    ("Nguồn dễ chia: ArrayList, mảng, range", "LinkedList, Stream.iterate"),
    ("Không có shared mutable state", "Sửa biến, collection bên ngoài"),
    ("Thứ tự không quan trọng", "Cần giữ thứ tự"),
]

SCENES = [
    # ------------------------------------------------------------ hook: the orElse trap, then the title card
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Câu hỏi phỏng vấn Java #8", "eyebrow r"),
        box("hk-code", 360, 220, 1200, 200, win("UserService.java") + code(
            'Optional<String> name = Optional.of("An");\nname.orElse(load());   // load() có chạy không?'), "cyan", "code"),
        console("hk-con", 360, 460, 640, ["load() called"]),
        el("hk-yes", 1040, 470, 520, None, "Có. Dù hộp đã có giá trị.", "note left r"),
        tile("hk-tile", 430, 350, 220, "box"),
        el("hk-word", 700, 380, 900, None, letters("Optional"), "h1 wordmark r", "text-align:left"),
        el("hk-tag", 1250, 400, 520, None, "& Parallel Stream", "tagline r"),
        el("hk-sub", 0, 680, 1920, None, "Hộp có thể rỗng · orElseGet · chạy song song đúng cách", "kin-sub r"),
    ]), beats=[
        ("Optional này đã có giá trị. Vậy hàm load ở trong orElse có bị gọi không?",
         "Optional đã có giá trị. Vậy load() trong orElse có bị gọi không?",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        ("Có. Nó vẫn chạy, dù hộp đã có giá trị.", "Có. Nó vẫn chạy, dù hộp đã có giá trị.",
         [IN("#hk-con", "up", 0.1, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-yes", "left", 1.2)]),
        ("Hôm nay ta học Optional, và Parallel Stream.", "Hôm nay: Optional và Parallel Stream.",
         [OUT("#hk-eye, #hk-code, #hk-con, #hk-yes", "blur", 0, 0.45),
          IN("#hk-tile", "zoomin", 0.4, 0.8), TYPE("#hk-word", 0.8, 0.05), IN("#hk-tag", "blur", 1.6), IN("#hk-sub", "blur", 1.9)]),
    ]),
    # ------------------------------------------------------------ Optional is a box
    dict(id="box", world=(1920, 1080), hud=hud("bx", "Optional là cái hộp", "Có một giá trị, hoặc rỗng"), cam="".join([
        big_title("bx", "Optional", "Một cái hộp: có giá trị, hoặc rỗng"),
        box("bx-old", 160, 200, 1600, 150, win("Trước Java 8") + code("User findById(long id)   // không thấy thì trả null, bên gọi dễ quên kiểm tra"), "red", "code"),
        el("bx-npe", 160, 380, 900, None, "✕ NullPointerException ở một nơi rất xa chỗ gây lỗi", "err r"),
        box("bx-new", 160, 200, 1600, 150, win("Từ Java 8") + code("Optional<User> findById(long id)   // chữ ký nói rõ: có thể không có kết quả"), "green", "code"),
        tile("bx-full", 360, 420, 200, "box"),
        el("bx-fl", 300, 640, 320, None, "Optional[An]", "mono big r", "text-align:center;color:#fff"),
        tile("bx-empty", 960, 420, 200, "box"),
        el("bx-el", 860, 640, 400, None, "Optional.empty", "mono big r", "text-align:center;color:var(--muted)"),
        el("bx-must", 1320, 470, 460, None, "Bên gọi buộc phải xử lý trường hợp rỗng", "note left r"),
        box("bx-make", 160, 200, 1600, 180, code(
            "Optional.of(null);           // NullPointerException ngay\n"
            "Optional.ofNullable(null);   // Optional.empty"), "violet", "code"),
    ]), beats=[
        ("Phần một: Optional giải quyết vấn đề gì?", "Phần 1: Optional giải quyết vấn đề gì?",
         [TYPE("#bx-big", 0.1, 0.05), IN("#bx-bsub", "blur", 0.9)]),
        ("Trước Java tám, method trả về giá trị rỗng khi không tìm thấy. Bên gọi rất dễ quên kiểm tra, và lỗi nổ ra ở một nơi rất xa.",
         "Trước Java 8, method trả null khi không tìm thấy. Bên gọi dễ quên kiểm tra, và NPE nổ ra ở nơi rất xa.",
         [OUT("#bx-big, #bx-bsub", "zoom"), IN("#bx-hud", "left", 0.2), IN("#bx-old", "up", 0.4), IN("#bx-npe", "up", 4.6), SHAKE("#bx-npe", 5.1)]),
        ("Optional là một cái hộp: chứa một giá trị, hoặc rỗng. Chữ ký method nói rõ có thể không có kết quả, nên bên gọi buộc phải xử lý.",
         "Optional là hộp: chứa một giá trị, hoặc rỗng. Chữ ký method nói rõ, nên bên gọi buộc phải xử lý.",
         [OUT("#bx-old, #bx-npe", "blur", 0, 0.4), IN("#bx-new", "up", 0.4), IN("#bx-full", "pop", 1.4), IN("#bx-fl", "up", 1.8),
          IN("#bx-empty", "pop", 2.6), IN("#bx-el", "up", 3.0), IN("#bx-must", "left", 5.4)]),
        ("Tạo bằng of khi chắc chắn có giá trị: truyền rỗng vào là ném lỗi ngay. Còn of nullable biến giá trị rỗng thành Optional empty.",
         "Optional.of khi chắc chắn có giá trị: of(null) ném NPE ngay. ofNullable(null) cho Optional.empty.",
         [OUT("#bx-new, #bx-full, #bx-fl, #bx-empty, #bx-el, #bx-must", "blur", 0, 0.4), IN("#bx-make", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ map chain as a circuit, then orElseThrow
    dict(id="chain", world=(1920, 1080), hud=hud("cn", "Chuỗi map thay cho if lồng nhau", "Thiếu bước nào cũng ra giá trị mặc định"), cam="".join([
        gnode("cn-a1", 120, 420, 330, 120, "findById(1)", "cyan"),
        gnode("cn-a2", 120, 420, 330, 120, "findById(2)", "cyan"),
        gnode("cn-n1", 560, 420, 380, 120, "map(User::address)", "violet"),
        gnode("cn-n2", 1040, 420, 360, 120, "map(Address::city)", "violet"),
        gnode("cn-n3", 1490, 420, 340, 120, esc('orElse("UNKNOWN")'), "green"),
        chip("cn-r1", 1560, 590, "Hà Nội", "green"),
        chip("cn-null", 600, 590, "address null → empty", "red"),
        chip("cn-r2", 1540, 590, "UNKNOWN", "amber"),
        el("cn-skip", 1040, 600, 380, None, "rỗng thì map bỏ qua", "note r"),
        box("cn-throw", 160, 760, 1600, 120, code('userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));'), "cyan", "code"),
        wires(trace("cn-t0", [(450, 480), (552, 480)], "cyan"), trace("cn-t1", [(940, 480), (1032, 480)], "violet"),
              trace("cn-t2", [(1400, 480), (1482, 480)], "violet"), trace("cn-in", [(0, 480), (112, 480)], "cyan")),
    ]), beats=[
        ("Phần hai: dùng Optional theo kiểu chuỗi xử lý. Lấy tên thành phố của user, thiếu bước nào thì trả về UNKNOWN.",
         "Phần 2: chuỗi xử lý. Lấy thành phố của user; thiếu bước nào thì trả \"UNKNOWN\".",
         [IN("#cn-hud", "left", 0.1), IN("#cn-a1", "pop", 0.4), IN("#cn-n1", "pop", 0.7), IN("#cn-n2", "pop", 1.0), IN("#cn-n3", "pop", 1.3),
          DRAW("#cn-in-p", 1.6, 0.3), DRAW("#cn-t0-p", 1.8, 0.3), DRAW("#cn-t1-p", 2.0, 0.3), DRAW("#cn-t2-p", 2.2, 0.3)]),
        ("User số một có địa chỉ: đi hết chuỗi, ra Hà Nội.", "User 1 có địa chỉ: đi hết chuỗi, ra Hà Nội.",
         [COMET("cn-in", 0.2, 0.4), LIGHT("#cn-a1", 0.55), COMET("cn-t0", 0.7, 0.45), LIGHT("#cn-n1", 1.1),
          COMET("cn-t1", 1.3, 0.45), LIGHT("#cn-n2", 1.7), COMET("cn-t2", 1.9, 0.45), LIGHT("#cn-n3", 2.3), IN("#cn-r1", "pop", 2.5)]),
        ("User số hai không có địa chỉ. Map ra hộp rỗng, các bước sau bị bỏ qua, và orElse trả về UNKNOWN.",
         "User 2 không có địa chỉ: map ra empty, các bước sau bỏ qua, orElse trả \"UNKNOWN\".",
         [OUT("#cn-r1", "fade", 0, 0.3), unlight("#cn-a1 .lit, #cn-n1 .lit, #cn-n2 .lit, #cn-n3 .lit", 0),
          OUT("#cn-a1", "fade", 0.2, 0.3), IN("#cn-a2", "fade", 0.3, 0.4),
          COMET("cn-in", 0.6, 0.4), LIGHT("#cn-a2", 0.95), COMET("cn-t0", 1.1, 0.45), IN("#cn-null", "pop", 1.6), SHAKE("#cn-null", 2.0),
          COMET("cn-t1", 2.4, 0.4), IN("#cn-skip", "up", 2.8), COMET("cn-t2", 3.4, 0.4), LIGHT("#cn-n3", 3.8), IN("#cn-r2", "pop", 4.0)]),
        ("Ở tầng service, không tìm thấy thì dùng hàm or else throw, để ném một exception có ý nghĩa.",
         "Ở tầng service: không tìm thấy thì orElseThrow một exception có ý nghĩa.",
         [IN("#cn-throw", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ orElse vs orElseGet
    dict(id="orelse", world=(1920, 1080), hud=hud("oe", "orElse vs orElseGet", "Câu hỏi bẫy rất hay gặp"), cam="".join([
        big_title("oe", "orElse vs orElseGet", "Tham số luôn được tính trước"),
        gnode("oe-src", 120, 415, 340, 120, esc('Optional.of("x")'), "cyan"),
        gnode("oe-a", 640, 255, 460, 120, "orElse(load())", "amber"),
        gnode("oe-b", 640, 595, 460, 120, "orElseGet(() -&gt; load())", "green"),
        gnode("oe-la", 1320, 255, 260, 120, "load()", "red"),
        gnode("oe-lb", 1320, 595, 260, 120, "load()", "muted"),
        console("oe-con", 1320, 410, 500, ["load() called for orElse"]),
        el("oe-n1", 640, 390, 640, None, "Java tính tham số trước khi gọi method", "note left r"),
        el("oe-n2", 640, 730, 640, None, "Supplier: chỉ gọi khi hộp rỗng", "note green left r"),
        el("oe-take", 0, 860, 1920, None, "orElse(gọi DB) vẫn gọi DB, kể cả khi đã tìm thấy", "warnbox r", "left:260px;width:1400px"),
        wires(trace("oe-ta", [(460, 475), (550, 475), (550, 315), (632, 315)], "amber", r=28),
              trace("oe-tb", [(460, 475), (550, 475), (550, 655), (632, 655)], "green", r=28),
              trace("oe-tla", [(1100, 315), (1312, 315)], "red"),
              trace("oe-tlb", [(1100, 655), (1312, 655)], "muted", dashed=True)),
    ]), beats=[
        ("Phần ba, câu hỏi bẫy rất hay gặp: orElse khác orElseGet thế nào?", "Phần 3, câu bẫy: orElse khác orElseGet thế nào?",
         [TYPE("#oe-big", 0.1, 0.035), IN("#oe-bsub", "blur", 1.4)]),
        ("Optional đã có giá trị. Với orElse, hàm load vẫn bị gọi, vì Java tính tham số trước khi gọi method.",
         "Optional đã có giá trị. Với orElse, load() vẫn bị gọi: Java tính tham số trước khi gọi method.",
         [OUT("#oe-big, #oe-bsub", "zoom"), IN("#oe-hud", "left", 0.2), IN("#oe-src", "pop", 0.4), LIGHT("#oe-src", 0.8),
          DRAW("#oe-ta-p", 1.0, 0.4), IN("#oe-a", "pop", 1.3), COMET("oe-ta", 1.5, 0.5), LIGHT("#oe-a", 2.0),
          DRAW("#oe-tla-p", 2.3, 0.3), IN("#oe-la", "pop", 2.5), COMET("oe-tla", 2.6, 0.45), LIGHT("#oe-la", 3.05),
          IN("#oe-con", "up", 3.2, 0.4), IN("#oe-con-1", "type1", 3.5, 0.3), IN("#oe-n1", "up", 4.4)]),
        ("Còn orElseGet nhận một Supplier, và chỉ gọi nó khi hộp rỗng. Ở đây không có gì được gọi cả.",
         "orElseGet nhận một Supplier, chỉ gọi khi hộp rỗng. Ở đây không có gì được gọi.",
         [DRAW("#oe-tb-p", 0.3, 0.4), IN("#oe-b", "pop", 0.6), COMET("oe-tb", 0.8, 0.5), LIGHT("#oe-b", 1.3),
          DRAW("#oe-tlb-p", 1.7, 0.3), IN("#oe-lb", "fade", 1.9, 0.4), IN("#oe-n2", "up", 2.6)]),
        ("Hậu quả thực tế: orElse gọi database vẫn gọi database, kể cả khi đã tìm thấy. Giá trị mặc định tốn kém thì dùng orElseGet.",
         "Hậu quả: orElse(gọi DB) vẫn gọi DB kể cả khi đã tìm thấy. Mặc định tốn kém thì dùng orElseGet.",
         [IN("#oe-take", "up", 0.3), PULSE("#oe-b", 3.6)]),
    ]),
    # ------------------------------------------------------------ anti-patterns
    dict(id="anti", world=(1920, 1080), hud=hud("an", "Anti-pattern với Optional", "Chỉ dùng làm kiểu trả về"), cam="".join([
        el("an-h1", 160, 190, 760, None, "✕ Không nên", "colhead", "color:var(--red)"),
        el("an-h2", 1000, 190, 760, None, "✓ Nên", "colhead", "color:var(--green)"),
        "".join(chip(f"an-x{i}", 160, 260 + i * 84, bad, "red") + chip(f"an-o{i}", 1000, 260 + i * 84, good, "green")
                for i, (bad, good) in enumerate(ANTI)),
        el("an-err", 160, 790, 1600, None, "Optional.empty().get() → NoSuchElementException: No value present", "err r"),
        el("an-take", 0, 420, 1920, None, letters("Optional chỉ làm kiểu trả về"), "take r"),
    ]), beats=[
        ("Phần bốn: những cách dùng sai Optional.", "Phần 4: những cách dùng Optional sai.",
         [IN("#an-hud", "left", 0.1), IN("#an-h1", "fade", 0.4), IN("#an-h2", "fade", 0.6)]),
        ("Gọi get khi chưa chắc có giá trị, hay kiểm tra is present rồi get, chẳng khác gì kiểm tra rỗng kiểu cũ.",
         "get() khi chưa chắc có giá trị, hay isPresent() rồi get(): chẳng khác gì kiểm tra null kiểu cũ.",
         [IN("#an-x0", "left", 0.3), IN("#an-o0", "left", 0.8), IN("#an-x1", "left", 2.4), IN("#an-o1", "left", 2.9),
          IN("#an-err", "up", 4.6), SHAKE("#an-err", 5.1)]),
        ("Đừng dùng Optional làm field, làm tham số, hay bọc một list. Và đừng bao giờ trả về rỗng cho kiểu Optional.",
         "Đừng dùng Optional làm field, tham số, hay bọc List. Và đừng return null cho kiểu Optional.",
         [OUT("#an-err", "fade", 0, 0.3), *[x for i, at in zip(range(2, 6), (0.3, 1.5, 2.8, 4.4)) for x in
                                               (IN(f"#an-x{i}", "left", at), IN(f"#an-o{i}", "left", at + 0.4))]]),
        ("Quy tắc ngắn: Optional chỉ dùng làm kiểu trả về của method có thể không có kết quả.",
         "Quy tắc ngắn: Optional chỉ làm kiểu trả về của method có thể không có kết quả.",
         [DIM("#an-h1, #an-h2, " + ", ".join(f"#an-x{i}, #an-o{i}" for i in range(6)), 0, 0.07), TYPE("#an-take", 0.4, 0.035)]),
    ]),
    # ------------------------------------------------------------ parallel stream: the "Global" circuit
    dict(id="par", world=(1920, 1080), hud=hud("pr", "Parallel stream", "Chia, chạy song song, rồi gộp"), cam="".join([
        big_title("pr", "Parallel Stream", "Chia dữ liệu, chạy trên nhiều thread"),
        el("pr-word", 120, 220, 860, None, "parallel()", "glow r", "font-size:130px;text-align:left;--tone:var(--cyan)"),
        gnode("pr-d", 720, 450, 300, 140, "1 … 8", "cyan"),
        gnode("pr-s1", 1180, 260, 300, 120, "Phần 1–4", "violet"),
        gnode("pr-s2", 1180, 700, 300, 120, "Phần 5–8", "violet"),
        gnode("pr-t1", 1580, 260, 240, 120, "Thread A", "cyan"),
        gnode("pr-t2", 1580, 700, 240, 120, "Thread B", "cyan"),
        gnode("pr-m", 1580, 480, 240, 120, "Gộp", "green"),
        chip("pr-pool", 120, 680, "ForkJoinPool.commonPool(): dùng chung cả JVM", "cyan"),
        chip("pr-n", 120, 770, "Máy 8 CPU → 7 thread, cộng thread gọi stream", "violet"),
        chip("pr-cf", 120, 860, "CompletableFuture.supplyAsync() cũng dùng pool này", "amber"),
        wires(trace("pr-in", [(0, 520), (712, 520)], "cyan"),
              trace("pr-a", [(1020, 520), (1100, 520), (1100, 320), (1172, 320)], "violet", r=30),
              trace("pr-b", [(1020, 520), (1100, 520), (1100, 760), (1172, 760)], "violet", r=30),
              trace("pr-c", [(1480, 320), (1572, 320)], "cyan"), trace("pr-d2", [(1480, 760), (1572, 760)], "cyan"),
              trace("pr-e", [(1700, 380), (1700, 472)], "green"), trace("pr-f", [(1700, 700), (1700, 608)], "green")),
    ]), beats=[
        ("Phần năm: Parallel Stream chạy thế nào?", "Phần 5: Parallel Stream chạy thế nào?",
         [TYPE("#pr-big", 0.1, 0.04), IN("#pr-bsub", "blur", 1.1)]),
        ("Gọi parallel, dữ liệu được chia thành nhiều phần, chạy song song trên nhiều thread, rồi gộp kết quả lại.",
         "parallel(): chia dữ liệu thành nhiều phần, chạy song song trên nhiều thread, rồi gộp kết quả.",
         [OUT("#pr-big, #pr-bsub", "zoom"), IN("#pr-word", "glowin", 0.3, 0.9),
          DRAW("#pr-in-p", 0.6, 0.5), COMET("pr-in", 1.0, 0.7), IN("#pr-d", "pop", 1.5), LIGHT("#pr-d", 1.7),
          DRAW("#pr-a-p", 2.0, 0.4), DRAW("#pr-b-p", 2.0, 0.4), IN("#pr-s1, #pr-s2", "pop", 2.4, 0.4, 0.1),
          COMET("pr-a", 2.6, 0.5), COMET("pr-b", 2.6, 0.5), LIGHT("#pr-s1", 3.1), LIGHT("#pr-s2", 3.1),
          DRAW("#pr-c-p", 3.4, 0.3), DRAW("#pr-d2-p", 3.4, 0.3), IN("#pr-t1, #pr-t2", "pop", 3.6, 0.4, 0.1),
          COMET("pr-c", 3.8, 0.35), COMET("pr-d2", 3.8, 0.35), LIGHT("#pr-t1", 4.15), LIGHT("#pr-t2", 4.15),
          DRAW("#pr-e-p", 4.3, 0.3), DRAW("#pr-f-p", 4.3, 0.3), IN("#pr-m", "pop", 4.55), LIGHT("#pr-m", 4.95)]),
        ("Các thread lấy từ fork join pool chung, dùng chung cho cả JVM. Máy tám CPU có bảy thread, cộng thêm thread gọi stream.",
         "Thread lấy từ ForkJoinPool.commonPool(), dùng chung cả JVM. Máy 8 CPU: 7 thread, cộng thread gọi stream.",
         [IN("#pr-pool", "left", 0.3), IN("#pr-n", "left", 3.6)]),
        ("Completable Future không truyền executor cũng chạy trên chính pool này.",
         "CompletableFuture không truyền executor cũng chạy trên chính pool này.",
         [IN("#pr-cf", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ traps: race, order, reduce identity
    dict(id="race", world=(1920, 1080), hud=hud("rc", "Bẫy với parallel stream", "Race condition, thứ tự, reduce"), cam="".join([
        box("rc-code", 160, 190, 1600, 160, code(
            "List<Integer> list = new ArrayList<>();\nIntStream.range(0, 10_000).parallel().forEach(list::add);"), "red", "code"),
        el("rc-bad", 160, 390, 520, None, "Chạy 30 lần: sai cả 30", "stamp red r"),
        chip("rc-size", 740, 396, "có lần size chỉ còn 2178, không phải 10000", "red"),
        box("rc-fix", 160, 500, 1600, 110, code("IntStream.range(0, 10_000).parallel().boxed().toList();   // luôn đủ 10000"), "green", "code"),
        box("rc-ord", 160, 660, 1600, 150, code(
            "IntStream.range(0, 8).parallel().forEach(...);          // 54762310\n"
            "IntStream.range(0, 8).parallel().forEachOrdered(...);   // 01234567"), "violet", "code"),
        box("rc-red", 160, 190, 1600, 150, code(
            "Stream.of(1, 2, 3, 4).reduce(10, Integer::sum);              // 20\n"
            "Stream.of(1, 2, 3, 4).parallel().reduce(10, Integer::sum);   // 50"), "amber", "code"),
        el("rc-why", 160, 380, 1600, None, "Mỗi phần dữ liệu đều được cộng thêm 10: giá trị khởi tạo phải là phần tử đơn vị (0 cho phép cộng)", "warnbox r"),
    ]), beats=[
        ("Phần sáu: các cái bẫy. Nhiều thread cùng thêm vào một Array List là race condition.",
         "Phần 6: các bẫy. Nhiều thread cùng add vào một ArrayList: race condition.",
         [IN("#rc-hud", "left", 0.1), IN("#rc-code", "up", 0.4)]),
        ("Mình chạy thử ba mươi lần, sai cả ba mươi. Có lần chỉ còn hơn hai nghìn phần tử.",
         "Chạy thử 30 lần: sai cả 30. Có lần chỉ còn 2178 phần tử.",
         [IN("#rc-bad", "pop", 0.3), SHAKE("#rc-bad", 0.9), IN("#rc-size", "left", 2.6)]),
        ("Luôn gom kết quả bằng collect hay to list. Và thứ tự không được đảm bảo, trừ khi dùng for each ordered.",
         "Luôn gom bằng collect/toList. Thứ tự không được đảm bảo, trừ khi dùng forEachOrdered.",
         [IN("#rc-fix", "up", 0.3), IN("#rc-ord", "up", 3.0)]),
        ("Thêm một bẫy với reduce: giá trị khởi tạo là mười, chạy tuần tự ra hai mươi, chạy song song ra năm mươi.",
         "Bẫy reduce: khởi tạo 10, tuần tự ra 20, song song ra 50.",
         [OUT("#rc-code, #rc-bad, #rc-size, #rc-fix, #rc-ord", "blur", 0, 0.4), IN("#rc-red", "up", 0.5), IN("#rc-why", "up", 4.2)]),
    ]),
    # ------------------------------------------------------------ when not to use parallel
    dict(id="when", world=(1920, 1080), hud=hud("wh", "Khi nào không dùng parallel", "Lợi phải lớn hơn chi phí chia, gộp"), cam="".join([
        el("wh-h1", 160, 190, 760, None, "✓ Nên dùng", "colhead", "color:var(--green)"),
        el("wh-h2", 1000, 190, 760, None, "✕ Không nên", "colhead", "color:var(--red)"),
        "".join(chip(f"wh-y{i}", 160, 260 + i * 84, good, "green") + chip(f"wh-n{i}", 1000, 260 + i * 84, bad, "red")
                for i, (good, bad) in enumerate(WHEN)),
        el("wh-io", 160, 720, 1600, None,
           "Web app gọi DB trong parallel stream: chiếm hết thread của commonPool để chờ I/O, mọi nơi khác nghẽn theo", "warnbox r"),
        chip("wh-cf", 160, 850, "I/O song song: CompletableFuture với executor riêng", "cyan"),
    ]), beats=[
        ("Phần bảy: khi nào không nên dùng Parallel Stream?", "Phần 7: khi nào không nên dùng Parallel Stream?",
         [IN("#wh-hud", "left", 0.1), IN("#wh-h1", "fade", 0.4), IN("#wh-h2", "fade", 0.6)]),
        ("Chỉ có lợi khi dữ liệu lớn, tác vụ tính toán thuần, nguồn dễ chia, không có trạng thái dùng chung, và thứ tự không quan trọng.",
         "Chỉ có lợi khi: dữ liệu lớn, tính toán thuần, nguồn dễ chia, không có shared state, thứ tự không quan trọng.",
         [*[x for i, at in enumerate((0.3, 1.4, 2.8, 4.2, 5.6)) for x in (IN(f"#wh-y{i}", "left", at), IN(f"#wh-n{i}", "left", at + 0.3))]]),
        ("Đặc biệt, đừng dùng cho I/O trong web app. Pool chung chỉ có vài thread, chờ database là chặn mọi nơi khác.",
         "Đừng dùng cho I/O trong web app: pool chung chỉ có vài thread, chờ DB là chặn mọi nơi khác.",
         [IN("#wh-io", "up", 0.3), SHAKE("#wh-io", 1.0)]),
        ("Muốn gọi nhiều API song song, hãy dùng Completable Future với một executor riêng.",
         "Gọi nhiều API song song: CompletableFuture với executor riêng.",
         [IN("#wh-cf", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro: end card
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("box", "Optional", "chỉ làm kiểu trả về"),
                                                ("quote", "orElseGet", "mặc định tốn kém"),
                                                ("split", "parallel", "commonPool dùng chung"),
                                                ("shield", "Không I/O", "gom bằng collect")]),
        chip("ou-next", 770, 650, "Bài tiếp: Java 17 & 21", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: Optional chỉ dùng làm kiểu trả về. Giá trị mặc định tốn kém thì dùng orElseGet. "
         "Parallel Stream chạy trên pool dùng chung của JVM. Và đừng dùng nó cho I/O, hãy gom kết quả bằng collect.",
         "Optional: chỉ làm kiểu trả về · mặc định tốn kém: orElseGet · parallel chạy trên commonPool dùng chung · không I/O, gom bằng collect.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.6), IN("#ou-c3", "pop", 9.6)]),
        ("Bài sau: Java mười bảy và hai mươi mốt.", "Bài sau: Java 17 & 21.",
         [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
