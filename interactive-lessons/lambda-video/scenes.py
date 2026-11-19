"""Lambda & Stream API explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output was run on JDK 21:
filter/map/findFirst over 1..6 prints filter 1, filter 2, map 2, result 20 (3..6 never processed);
no terminal operation prints nothing; peek+sorted prints peek 3, peek 1, peek 2, out 1, out 2, out 3;
a second count() throws IllegalStateException; flatMap gives [a, b, c]; IntStream.rangeClosed(1, 5).sum() = 15;
summaryStatistics prints IntSummaryStatistics{count=2, sum=3, min=1, average=1.500000, max=2};
reassigning a captured local fails to compile ("must be final or effectively final").

Visual devices: circuit traces with comets (trace/COMET), glossy nodes that light up (gnode/LIGHT), glowing words.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)



def mono(text):
    return f'<span class="mono">{esc(text)}</span>'


FI = [("Function<T, R> · biến đổi", 290, "cyan"), ("Predicate<T> · kiểm tra", 450, "green"),
      ("Supplier<T> · cung cấp", 610, "amber"), ("Consumer<T> · tiêu thụ", 770, "violet")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 140, 1300, None, "Câu hỏi phỏng vấn Java #6", "eyebrow r"),
        box("hk-code", 400, 200, 1100, 320, win("Main.java") + code(
            "Stream.of(1, 2, 3, 4, 5, 6)\n"
            '    .filter(x -> { log("filter " + x); return x % 2 == 0; })\n'
            '    .map(x -> { log("map " + x); return x * 10; })\n'
            "    .findFirst();   // in ra gì?"), "cyan", "code"),
        console("hk-con", 400, 560, 480, ["filter 1", "filter 2", "map 2", "result 20"]),
        chip("hk-skip", 960, 600, "3, 4, 5, 6: không bao giờ chạy", "amber"),
        el("hk-lazy", 960, 700, 540, None, "lazy", "glow r", "font-size:110px;--tone:var(--cyan)"),
        el("hk-title", 260, 250, 1400, None, letters("Lambda và Stream"), "h1 r"),
        card4("hk-c", 230, 470, 340, 290, 30, [("plug", "Functional interface", "Function, Predicate…"),
                                                ("quote", "Lambda", "effectively final"),
                                                ("share", "Stream lazy", "chạy khi có terminal"),
                                                ("tree", "flatMap", "một thành nhiều")]),
    ]), beats=[
        ("Dây chuyền này lọc số chẵn, nhân mười, rồi lấy phần tử đầu tiên. Nó sẽ in ra những dòng nào?",
         "Dây chuyền lọc số chẵn, nhân 10, rồi lấy phần tử đầu tiên. Nó in ra những dòng nào?",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        ("Chỉ bốn dòng. Số ba, bốn, năm, sáu không bao giờ được xử lý.",
         "Chỉ 4 dòng. Số 3, 4, 5, 6 không bao giờ được xử lý.",
         [IN("#hk-con", "up", 0.1, 0.4), IN("#hk-con-1", "type1", 0.4, 0.3), IN("#hk-con-2", "type1", 0.7, 0.3),
          IN("#hk-con-3", "type1", 1.0, 0.3), IN("#hk-con-4", "type1", 1.3, 0.3), IN("#hk-skip", "pop", 2.4)]),
        ("Vì stream là lazy.", "Vì stream là lazy.",
         [IN("#hk-lazy", "glowin", 0.3, 0.9)]),
        ("Hôm nay ta học functional interface, lambda, cách stream chạy lazy, và map với flatMap.",
         "Hôm nay: functional interface, lambda, stream lazy, và map với flatMap.",
         [OUT("#hk-eye, #hk-code, #hk-con, #hk-skip, #hk-lazy", "blur", 0, 0.45),
          TYPE("#hk-title", 0.4), IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 1.2, 0.55, 0.45)]),
    ]),
    # ------------------------------------------------------------ functional interfaces
    dict(id="fi", world=(1920, 1080), hud=hud("fi", "Functional interface", "Đúng một abstract method"), cam="".join([
        big_title("fi", "Functional interface", "Interface có đúng một abstract method"),
        box("fi-code", 160, 200, 1000, 270, win("PriceRule.java") + code(
            "@FunctionalInterface\ninterface PriceRule {\n    BigDecimal apply(BigDecimal price);\n}"), "cyan", "code"),
        chip("fi-lam", 160, 510, 'PriceRule tenOff = p -> p.multiply(new BigDecimal("0.9"));', "green"),
        gnode("fi-hub", 160, 470, 280, 110, "λ lambda", "violet"),
        "".join(gnode(f"fi-n{i}", 1180, y - 50, 600, 100, esc(label), tone) for i, (label, y, tone) in enumerate(FI)),
        wires(*[trace(f"fi-t{i}", [(440, 525), (760, 525), (760, y), (1172, y)], tone) for i, (_, y, tone) in enumerate(FI)]),
    ]), beats=[
        ("Thứ nhất: functional interface.", "Thứ nhất: functional interface.",
         [TYPE("#fi-big", 0.1, 0.04), IN("#fi-bsub", "blur", 1.0)]),
        ("Functional interface là interface có đúng một abstract method. Nhờ vậy ta viết được lambda, thay cho cả một anonymous class.",
         "Functional interface: interface có đúng một abstract method. Nhờ vậy viết được lambda thay cho cả một anonymous class.",
         [OUT("#fi-big, #fi-bsub", "zoom"), IN("#fi-hud", "left", 0.2), IN("#fi-code", "up", 0.4), IN("#fi-lam", "pop", 4.2)]),
        ("Bốn interface có sẵn cần thuộc. Function để biến đổi. Predicate để kiểm tra. Supplier để cung cấp. Và Consumer để tiêu thụ.",
         "4 interface có sẵn cần thuộc: Function biến đổi, Predicate kiểm tra, Supplier cung cấp, Consumer tiêu thụ.",
         [OUT("#fi-code, #fi-lam", "blur", 0, 0.4), IN("#fi-hub", "pop", 0.4),
          IN(", ".join(f"#fi-n{i}" for i in range(4)), "left", 0.6, 0.45, 0.1),
          *[x for i in range(4) for x in (DRAW(f"#fi-t{i}-p", 0.8, 0.5),)],
          *[x for i, at in enumerate((2.0, 3.3, 4.6, 5.9)) for x in (COMET(f"fi-t{i}", at, 0.7), LIGHT(f"#fi-n{i}", at + 0.65))]]),
    ]),
    # ------------------------------------------------------------ lambda: effectively final + method references
    dict(id="lam", world=(1920, 1080), hud=hud("lm", "Lambda & method reference", "Biến bên ngoài phải effectively final"), cam="".join([
        big_title("lm", "Lambda", "Biến bên ngoài phải effectively final"),
        box("lm-code", 140, 190, 900, 250, win("Main.java") + code(
            "int discount = 10;\nlist.forEach(p -> println(p - discount));\ndiscount = 20;   // thêm dòng này"), "cyan", "code"),
        el("lm-err", 140, 460, 900, None, "✕ local variables referenced from a lambda expression must be final or effectively final", "err r"),
        chip("lm-w1", 1120, 220, "lambda copy giá trị lúc tạo", "cyan"),
        chip("lm-w2", 1120, 300, "có thể chạy sau, hoặc ở thread khác", "amber"),
        chip("lm-w3", 1120, 380, "gán lại → thấy giá trị nào?", "red"),
        box("lm-mr", 260, 300, 1400, 270, win("method reference") + code(
            "Integer::parseInt      // s -> Integer.parseInt(s)\nSystem.out::println    // x -> System.out.println(x)\n"
            "String::toUpperCase    // s -> s.toUpperCase()\nArrayList::new         // () -> new ArrayList<>()"), "violet", "code"),
    ]), beats=[
        ("Thứ hai: lambda dùng biến bên ngoài thế nào?", "Thứ hai: lambda dùng biến bên ngoài thế nào?",
         [TYPE("#lm-big", 0.1, 0.06), IN("#lm-bsub", "blur", 0.9)]),
        ("Lambda dùng được biến local bên ngoài, nhưng biến đó phải effectively final, tức là không bị gán lại. Thêm một dòng gán lại là lỗi biên dịch.",
         "Lambda dùng được biến local bên ngoài, nhưng biến đó phải effectively final (không bị gán lại). Gán lại là lỗi biên dịch.",
         [OUT("#lm-big, #lm-bsub", "zoom"), IN("#lm-hud", "left", 0.2), IN("#lm-code", "left", 0.4), IN("#lm-err", "up", 5.6), SHAKE("#lm-err", 6.1)]),
        ("Vì lambda copy giá trị lúc được tạo, và có thể chạy sau, hoặc ở một thread khác. Nếu cho gán lại, không ai biết lambda sẽ thấy giá trị nào.",
         "Vì lambda copy giá trị lúc được tạo, và có thể chạy sau hoặc ở thread khác. Cho gán lại thì không biết lambda thấy giá trị nào.",
         [IN("#lm-w1", "left", 0.4), IN("#lm-w2", "left", 2.2), IN("#lm-w3", "left", 4.6)]),
        ("Khi lambda chỉ gọi đúng một method, hãy viết gọn bằng method reference.",
         "Lambda chỉ gọi đúng một method? Viết gọn bằng method reference.",
         [OUT("#lm-code, #lm-err, #lm-w1, #lm-w2, #lm-w3", "blur", 0, 0.45), IN("#lm-mr", "up", 0.6), PULSE("#lm-mr", 2.6)]),
    ]),
    # ------------------------------------------------------------ laziness as a circuit
    dict(id="lazy", world=(1920, 1080), hud=hud("lz", "Stream là lazy", "Chỉ chạy khi có thao tác kết thúc"), cam="".join([
        big_title("lz", "Stream là lazy", "Câu hỏi xoáy nhất về stream"),
        gnode("lz-src", 120, 300, 300, 130, "Stream.of(1..6)", "cyan"),
        gnode("lz-fil", 600, 300, 300, 130, "filter: chẵn", "amber"),
        gnode("lz-map", 1060, 300, 280, 130, "map: × 10", "violet"),
        gnode("lz-fst", 1500, 300, 300, 130, "findFirst", "green"),
        "".join(chip(f"lz-e{i}", 120 + (i - 1) * 76, 470, str(i), "cyan") for i in range(1, 7)),
        el("lz-idle", 600, 480, 760, None, "chưa có terminal: mới lắp dây chuyền, chưa chạy gì", "note left r"),
        chip("lz-x1", 600, 470, "1 lẻ → loại", "red"),
        chip("lz-res", 1500, 470, "result = 20", "green"),
        el("lz-skip", 120, 560, 700, None, "3, 4, 5, 6: không bao giờ được xử lý", "note left r"),
        console("lz-con", 1100, 560, 700, ["filter 1", "filter 2", "map 2", "result 20"]),
        el("lz-t1", 0, 420, 1920, None, letters("Từng phần tử đi hết dây chuyền"), "take r"),
        el("lz-t2", 0, 540, 1920, None, "findFirst, limit, anyMatch dừng được sớm", "take-sm r"),
        wires(trace("lz-a", [(420, 365), (592, 365)], "cyan"), trace("lz-b", [(900, 365), (1052, 365)], "amber"),
              trace("lz-c", [(1340, 365), (1492, 365)], "violet")),
    ]), beats=[
        ("Thứ ba, phần hay bị hỏi xoáy nhất: stream là lazy.", "Thứ ba, phần hay bị hỏi xoáy nhất: stream là lazy.",
         [TYPE("#lz-big", 0.1, 0.05), IN("#lz-bsub", "blur", 1.2)]),
        ("Stream là một dây chuyền: nguồn dữ liệu, các thao tác trung gian như filter và map.",
         "Stream là một dây chuyền: nguồn dữ liệu, các thao tác trung gian như filter và map.",
         [OUT("#lz-big, #lz-bsub", "zoom"), IN("#lz-hud", "left", 0.2), IN("#lz-src", "pop", 0.4),
          IN(", ".join(f"#lz-e{i}" for i in range(1, 7)), "pop", 0.8, 0.3, 0.08), DRAW("#lz-a-p", 1.6, 0.4),
          IN("#lz-fil", "pop", 2.4), DRAW("#lz-b-p", 3.2, 0.4), IN("#lz-map", "pop", 3.8)]),
        ("Khi chưa có thao tác kết thúc, không có gì chạy cả. Mới chỉ lắp dây chuyền, chưa bật máy.",
         "Chưa có thao tác kết thúc thì không có gì chạy cả: mới lắp dây chuyền, chưa bật máy.",
         [IN("#lz-idle", "up", 0.6)]),
        ("Thêm findFirst, dây chuyền mới chạy. Số một vào filter, là số lẻ, nên bị loại.",
         "Thêm findFirst, dây chuyền mới chạy. Số 1 vào filter, là số lẻ, nên bị loại.",
         [OUT("#lz-idle", "fade", 0, 0.3), DRAW("#lz-c-p", 0.3, 0.4), IN("#lz-fst", "pop", 0.6),
          IN("#lz-con", "right", 1.0, 0.4), OUT("#lz-e1", "up", 2.2, 0.3), COMET("lz-a", 2.3, 0.7), IN("#lz-con-1", "type1", 3.0, 0.3),
          IN("#lz-x1", "pop", 3.4), SHAKE("#lz-x1", 3.8)]),
        ("Số hai là số chẵn, đi tiếp xuống map thành hai mươi, và findFirst có ngay kết quả.",
         "Số 2 chẵn: đi tiếp xuống map thành 20, và findFirst có ngay kết quả.",
         [OUT("#lz-x1", "fade", 0, 0.3), OUT("#lz-e2", "up", 0.2, 0.3), COMET("lz-a", 0.3, 0.6), IN("#lz-con-2", "type1", 0.9, 0.3),
          LIGHT("#lz-fil", 0.9), COMET("lz-b", 1.3, 0.6), LIGHT("#lz-map", 1.9), IN("#lz-con-3", "type1", 1.9, 0.3),
          COMET("lz-c", 2.4, 0.6), LIGHT("#lz-fst", 3.0), IN("#lz-con-4", "type1", 3.0, 0.3), IN("#lz-res", "pop", 3.2)]),
        ("Ngay lúc đó dây chuyền dừng. Ba, bốn, năm, sáu không bao giờ được xử lý.",
         "Ngay lúc đó dây chuyền dừng: 3, 4, 5, 6 không bao giờ được xử lý.",
         [DIM("#lz-e3, #lz-e4, #lz-e5, #lz-e6", 0.4, 0.25), IN("#lz-skip", "up", 1.2)]),
        ("Mỗi phần tử đi hết dây chuyền rồi mới tới phần tử sau. Các thao tác như findFirst, limit, hay anyMatch dừng được sớm.",
         "Mỗi phần tử đi hết dây chuyền rồi mới tới phần tử sau. findFirst, limit, anyMatch dừng được sớm.",
         [DIM("#lz-src, #lz-fil, #lz-map, #lz-fst, #lz-e3, #lz-e4, #lz-e5, #lz-e6, #lz-res, #lz-skip, #lz-con, #lz-a, #lz-b, #lz-c", 0, 0.07),
          TYPE("#lz-t1", 0.3, 0.035), IN("#lz-t2", "blur", 3.0)]),
    ]),
    # ------------------------------------------------------------ stateful sorted + single use
    dict(id="state", world=(1920, 1080), hud=hud("st", "Ngoại lệ: thao tác stateful", "sorted, distinct phải gom đủ dữ liệu"), cam="".join([
        gnode("st-src", 120, 260, 240, 120, "3, 1, 2", "cyan"),
        gnode("st-peek", 480, 260, 240, 120, "peek", "amber"),
        gnode("st-sort", 840, 260, 280, 120, "sorted", "violet"),
        gnode("st-out", 1240, 260, 260, 120, "forEach", "green"),
        "".join(chip(f"st-b{v}", 860 + i * 92, 410, str(v), "violet") for i, v in enumerate([3, 1, 2])),
        console("st-con", 1240, 410, 560, ["peek 3", "peek 1", "peek 2", "out 1", "out 2", "out 3"]),
        el("st-n1", 120, 520, 1000, None, "sorted, distinct: stateful, giữ dữ liệu lại, không dừng sớm được", "note left r"),
        el("st-n2", 120, 580, 1000, None, "filter, map: stateless, xử lý từng phần tử", "note green left r"),
        el("st-ise", 120, 720, 1640, None, "count() lần 2 → IllegalStateException: stream has already been operated upon or closed", "err r"),
        wires(trace("st-a", [(360, 320), (472, 320)], "cyan"), trace("st-b", [(720, 320), (832, 320)], "amber"),
              trace("st-c", [(1120, 320), (1232, 320)], "violet")),
    ]), beats=[
        ("Có một ngoại lệ: các thao tác stateful như sorted.", "Ngoại lệ: các thao tác stateful như sorted.",
         [IN("#st-hud", "left", 0.1), IN("#st-src, #st-peek, #st-sort, #st-out", "pop", 0.3, 0.35, 0.15),
          DRAW("#st-a-p", 0.9, 0.3), DRAW("#st-b-p", 1.1, 0.3), DRAW("#st-c-p", 1.3, 0.3)]),
        ("Sorted phải nhận đủ cả ba phần tử mới sắp xếp được. Nên peek in ra ba, một, hai trước, rồi mới ra một, hai, ba.",
         "sorted phải nhận đủ cả 3 phần tử mới sắp được: peek in 3, 1, 2 trước, rồi mới ra 1, 2, 3.",
         [IN("#st-con", "right", 0.2, 0.4),
          *[x for i, v in enumerate([3, 1, 2]) for x in (COMET("st-a", 0.5 + i * 0.8, 0.35), IN(f"#st-con-{i + 1}", "type1", 0.85 + i * 0.8, 0.3),
                                                          COMET("st-b", 0.85 + i * 0.8, 0.35), IN(f"#st-b{v}", "pop", 1.2 + i * 0.8))],
          LIGHT("#st-sort", 3.1), COMET("st-c", 3.5, 0.4), IN("#st-con-4", "type1", 3.9, 0.3),
          COMET("st-c", 4.3, 0.4), IN("#st-con-5", "type1", 4.7, 0.3), COMET("st-c", 5.1, 0.4), IN("#st-con-6", "type1", 5.5, 0.3)]),
        ("Sorted và distinct là stateful, tốn bộ nhớ và không dừng sớm được. Còn filter và map là stateless.",
         "sorted, distinct là stateful: tốn bộ nhớ, không dừng sớm được. filter, map là stateless.",
         [IN("#st-n1", "up", 0.3), IN("#st-n2", "up", 3.6)]),
        ("Và một stream chỉ dùng được một lần. Gọi thao tác kết thúc lần thứ hai sẽ ném Illegal State Exception.",
         "Và stream chỉ dùng được một lần: gọi thao tác kết thúc lần 2 sẽ ném IllegalStateException.",
         [IN("#st-ise", "up", 2.6), SHAKE("#st-ise", 3.2)]),
    ]),
    # ------------------------------------------------------------ map vs flatMap + primitive streams
    dict(id="flat", world=(1920, 1080), hud=hud("fl", "map và flatMap", "Một thành một, hay một thành nhiều"), cam="".join([
        big_title("fl", "map và flatMap", "Một thành một, hay một thành nhiều"),
        box("fl-code", 160, 220, 760, 200, code("nested.stream()\n      .flatMap(List::stream)\n      .toList();   // [a, b, c]"), "cyan", "code"),
        el("fl-rule", 160, 450, 760, None, "map: mỗi phần tử → đúng 1 · flatMap: mỗi phần tử → 0..n, rồi làm phẳng", "note left r"),
        box("fl-g1", 1000, 220, 330, 120, "", "muted", "dash"),
        box("fl-g2", 1370, 220, 200, 120, "", "muted", "dash"),
        chip("fl-a", 1040, 252, "a", "cyan"), chip("fl-b", 1160, 252, "b", "cyan"), chip("fl-c", 1430, 252, "c", "cyan"),
        el("fl-out", 1000, 520, 600, None, "[a, b, c]", "note green left r"),
        box("fl-prim", 160, 640, 1600, 170, code(
            "IntStream.rangeClosed(1, 5).sum();   // 15\n"
            'Stream.of("aa", "b").mapToInt(String::length).summaryStatistics();\n'
            "// IntSummaryStatistics{count=2, sum=3, min=1, average=1.500000, max=2}"), "violet", "code"),
    ]), beats=[
        ("Thứ năm: map và flatMap.", "Thứ năm: map và flatMap.",
         [TYPE("#fl-big", 0.1, 0.05), IN("#fl-bsub", "blur", 0.9)]),
        ("Map biến mỗi phần tử thành đúng một phần tử. Còn flatMap biến mỗi phần tử thành một stream, rồi làm phẳng tất cả thành một.",
         "map: mỗi phần tử thành đúng một. flatMap: mỗi phần tử thành một stream, rồi làm phẳng tất cả thành một.",
         [OUT("#fl-big, #fl-bsub", "zoom"), IN("#fl-hud", "left", 0.2), IN("#fl-code", "left", 0.4), IN("#fl-rule", "up", 2.6),
          IN("#fl-g1, #fl-g2", "fade", 3.6, 0.4), IN("#fl-a, #fl-b, #fl-c", "pop", 3.9, 0.3, 0.12)]),
        ("Danh sách lồng nhau a, b, và c được làm phẳng thành một hàng a, b, c.",
         "Danh sách lồng nhau [[a, b], [c]] được làm phẳng thành [a, b, c].",
         [OUT("#fl-g1, #fl-g2", "fade", 0.4, 0.4), TO("#fl-a", {"x": 40, "y": 200}, 0.6, 0.7), TO("#fl-b", {"x": 40, "y": 200}, 0.75, 0.7),
          TO("#fl-c", {"x": -110, "y": 200}, 0.9, 0.7), IN("#fl-out", "up", 1.8)]),
        ("Với số, hãy dùng Int Stream để tránh boxing, và có sẵn hàm tính tổng và thống kê.",
         "Với số, dùng IntStream để tránh boxing, có sẵn sum(), average(), summaryStatistics().",
         [IN("#fl-prim", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ stream or for loop
    dict(id="when", world=(1920, 1080), hud=hud("wh", "Stream hay vòng for?", "Chọn cái dễ đọc hơn"), cam="".join([
        box("wh-bad", 160, 210, 820, 230, win("✕ side effect") + code(
            "List<String> names = new ArrayList<>();\nusers.stream()\n     .forEach(u -> names.add(u.getName()));"), "red", "code"),
        box("wh-good", 1040, 210, 720, 230, win("✓ đọc như một câu") + code(
            "List<String> names = users.stream()\n     .map(User::getName)\n     .toList();"), "green", "code"),
        chip("wh-s1", 160, 500, "stream: filter, map, gom nhóm", "green"),
        chip("wh-s2", 160, 580, "stream: pipeline rõ ràng, short-circuit", "green"),
        chip("wh-f1", 1040, 500, "for: nhiều nhánh, break phức tạp", "amber"),
        chip("wh-f2", 1040, 580, "for: checked exception mỗi bước", "amber"),
        chip("wh-f3", 1040, 660, "for: sửa nhiều biến bên ngoài", "amber"),
    ]), beats=[
        ("Cuối cùng: khi nào dùng stream, khi nào dùng vòng for?", "Cuối cùng: khi nào dùng stream, khi nào dùng vòng for?",
         [IN("#wh-hud", "left", 0.1)]),
        ("Đừng dùng hàm for each để thêm vào một list bên ngoài. Hãy dùng map, rồi gọi to list.",
         "Đừng dùng forEach để add vào list bên ngoài. Dùng map rồi toList.",
         [IN("#wh-bad", "left", 0.2), SHAKE("#wh-bad", 1.8), IN("#wh-good", "right", 2.6)]),
        ("Stream hợp với lọc, biến đổi, gom nhóm, và những dây chuyền rõ ràng.",
         "Stream hợp với lọc, biến đổi, gom nhóm, và những dây chuyền rõ ràng.",
         [IN("#wh-s1", "left", 0.3), IN("#wh-s2", "left", 2.0)]),
        ("Còn logic nhiều nhánh, có checked exception, hay phải sửa nhiều biến bên ngoài, thì vòng for dễ đọc hơn.",
         "Logic nhiều nhánh, có checked exception, hay phải sửa nhiều biến bên ngoài: vòng for dễ đọc hơn.",
         [IN("#wh-f1", "left", 0.3), IN("#wh-f2", "left", 1.6), IN("#wh-f3", "left", 3.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 150, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 300, 340, 280, 30, [("plug", "Functional interface", "đúng 1 abstract method"),
                                                ("quote", "Lambda", "biến effectively final"),
                                                ("share", "Stream lazy", "chạy khi có terminal"),
                                                ("tree", "flatMap", "một thành nhiều")]),
        chip("ou-next", 760, 660, "Bài tiếp: Collectors", "violet"),
        el("ou-cta", 0, 790, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: functional interface có đúng một abstract method. Biến dùng trong lambda phải effectively final. Stream chỉ chạy khi có thao tác kết thúc, từng phần tử một. Và flatMap biến một thành nhiều.",
         "Functional interface: 1 abstract method · lambda: biến effectively final · stream chỉ chạy khi có terminal · flatMap: một thành nhiều.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 6.2), IN("#ou-c3", "pop", 9.4)]),
        ("Bài sau ta học Collectors: gom nhóm, đếm, và nối chuỗi.", "Bài sau: Collectors. Gom nhóm, đếm, và nối chuỗi.",
         [IN("#ou-next", "pop", 0.4)]),
        ("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.", "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
