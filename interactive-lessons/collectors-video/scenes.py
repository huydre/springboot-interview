"""Collectors explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Sample data (docs/study-notes/02.07): An IT 2000 5y, Bình IT 3000 2y, Chi HR 1500 7y, Dũng HR 1800 1y, Em Sales 2500 3y.
Every output was run on JDK 21:
toMap(dept, name) -> IllegalStateException: Duplicate key IT (attempted merging values An and Bình);
toMap(dept, salary, Double::sum, TreeMap::new) -> {HR=3300.0, IT=5000.0, Sales=2500.0};
toMap(k -> k, k -> null) -> NullPointerException; groupingBy(dept) returns java.util.HashMap;
groupingBy(dept, averagingDouble(salary)) -> {Sales=2500.0, HR=1650.0, IT=2500.0} (HashMap order);
groupingBy(dept, counting()) -> {Sales=1, HR=2, IT=2}; with TreeMap::new -> {HR=2, IT=2, Sales=1};
averaging with TreeMap -> {HR=1650.0, IT=2500.0, Sales=2500.0}; mapping names -> {HR=[Chi, Dũng], IT=[An, Bình], Sales=[Em]};
collectingAndThen(maxBy(salary), name) -> {HR=Dũng, IT=Bình, Sales=Em};
partitioningBy(years >= 5, names) -> {false=[Bình, Dũng, Em], true=[An, Chi]};
on an empty stream partitioningBy -> {false=[], true=[]}, groupingBy -> {};
joining(", ", "[", "]") -> [An, Bình, Chi, Dũng, Em]; teeing(counting, summingDouble, sum / count) -> 2160.0;
reduce(0.0, Double::sum) -> 10800.0.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)



TONE = {"IT": "cyan", "HR": "amber", "Sales": "violet"}
EMPS = [("An", "IT", 5), ("Bình", "IT", 2), ("Chi", "HR", 7), ("Dũng", "HR", 1), ("Em", "Sales", 3)]
ROW_Y = [360 + 90 * i for i in range(5)]  # employee chips start in a column at x=160

# groupingBy buckets: (key, x, width); chips land at (x + 30, 420) and (x + 30, 500)
BUCKETS = [("IT", 760, 320), ("HR", 1120, 320), ("Sales", 1480, 300)]
GROUP_LAND = {"An": (790, 420), "Bình": (790, 500), "Chi": (1150, 420), "Dũng": (1150, 500), "Em": (1510, 420)}
GROUP_RESULTS = {  # downstream -> per-bucket result, from the TreeMap runs above
    "count": ["2", "2", "1"],
    "avg": ["2500.0", "1650.0", "2500.0"],
    "names": ["[An, Bình]", "[Chi, Dũng]", "[Em]"],
}
# partitioningBy buckets: true (>= 5 years) and false
PART_LAND = {"An": (830, 410), "Chi": (830, 480), "Bình": (1330, 410), "Dũng": (1330, 480), "Em": (1330, 550)}


def moves(prefix, land):
    """TO actions that fly each employee chip from its row in the left column to its landing spot."""
    out = []
    for i, (name, _, _) in enumerate(EMPS):
        x, y = land[name]
        out.append(TO(f"#{prefix}{i}", {"x": x - 160, "y": y - ROW_Y[i]}, 0.0, 0.8))
    return out


def stagger(actions, start, step):
    """Shift a list of actions so they start one after another."""
    for k, a in enumerate(actions):
        a["d"] = round(start + k * step, 3)
    return actions


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 120, 1300, None, "Câu hỏi phỏng vấn Java #7", "eyebrow r"),
        box("hk-sql", 260, 180, 1400, 150, win("SQL") + code("SELECT dept, AVG(salary) FROM emp GROUP BY dept;"), "amber", "code"),
        box("hk-code", 260, 370, 1400, 230, win("Main.java") + code(
            "emps.stream()\n    .collect(groupingBy(Employee::dept,\n                        averagingDouble(Employee::salary)));"), "cyan", "code"),
        console("hk-con", 260, 640, 760, ["{Sales=2500.0, HR=1650.0, IT=2500.0}"]),
        el("hk-title", 0, 230, 1920, None, letters("Collectors"), "h1 center r"),
        card4("hk-c", 230, 420, 340, 290, 30, [("hash", "toMap", "2 cái bẫy"),
                                                ("grid", "groupingBy", "gom nhóm + downstream"),
                                                ("tree", "partitioningBy", "chia đôi true, false"),
                                                ("eq", "reduce", "hay collect?")]),
    ]), beats=[
        ("Câu SQL quen thuộc: lương trung bình của mỗi phòng ban. Viết lại bằng stream thế nào?",
         "Câu SQL quen thuộc: lương trung bình mỗi phòng ban. Viết lại bằng stream thế nào?",
         [IN("#hk-eye", "blur"), IN("#hk-sql", "zoomin", 0.3, 0.8)]),
        ("Chỉ một lần gọi collect, với grouping by và averaging double.",
         "Chỉ một lần collect, với groupingBy và averagingDouble.",
         [IN("#hk-code", "up", 0.2), IN("#hk-con", "right", 2.2, 0.4), IN("#hk-con-1", "type1", 2.6, 0.3)]),
        ("Hôm nay ta học Collectors: hai cái bẫy của to map, gom nhóm, chia đôi, và khi nào dùng reduce.",
         "Hôm nay: Collectors. Hai bẫy của toMap, gom nhóm, chia đôi, và khi nào dùng reduce.",
         [OUT("#hk-eye, #hk-sql, #hk-code, #hk-con", "blur", 0, 0.45),
          TYPE("#hk-title", 0.4), IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 1.2, 0.55, 0.45)]),
    ]),
    # ------------------------------------------------------------ collect, Collectors, downstream
    dict(id="flow", world=(1920, 1080), hud=hud("fw", "collect & downstream", "Giống GROUP BY trong SQL"), cam="".join([
        big_title("fw", "collect & downstream", "Giống GROUP BY trong SQL"),
        box("fw-data", 160, 190, 780, 420, win("Employee") + code(
            "record Employee(name, dept, salary, years)\n\n"
            "An     IT      2000   5\nBình   IT      3000   2\nChi    HR      1500   7\n"
            "Dũng   HR      1800   1\nEm     Sales   2500   3"), "cyan", "code"),
        chip("fw-w1", 1000, 230, "collect: gom stream thành 1 kết quả", "amber"),
        chip("fw-w2", 1000, 320, "Collectors: công thức gom có sẵn", "violet"),
        gnode("fw-s", 160, 680, 330, 110, "Stream&lt;Employee&gt;", "cyan"),
        gnode("fw-g", 600, 680, 330, 110, "groupingBy(dept)", "amber"),
        gnode("fw-d", 1040, 680, 300, 110, "downstream", "violet"),
        gnode("fw-m", 1450, 680, 340, 110, "Map&lt;dept, kết quả&gt;", "green"),
        el("fw-dn", 1000, 810, 420, None, "xử lý từng nhóm: counting, averaging, mapping…", "note"),
        box("fw-sql", 160, 190, 1600, 230, code(
            "// SQL                          // Stream\n"
            "COUNT(*)    GROUP BY dept   →   groupingBy(Employee::dept, counting())\n"
            "AVG(salary) GROUP BY dept   →   groupingBy(Employee::dept, averagingDouble(Employee::salary))\n"
            "SUM(salary) GROUP BY dept   →   groupingBy(Employee::dept, summingDouble(Employee::salary))"), "violet", "code"),
        wires(trace("fw-a", [(490, 735), (592, 735)], "cyan"), trace("fw-b", [(930, 735), (1032, 735)], "amber"),
              trace("fw-c", [(1340, 735), (1442, 735)], "violet")),
    ]), beats=[
        ("Phần một: collect, và downstream collector.", "Phần 1: collect và downstream collector.",
         [TYPE("#fw-big", 0.1, 0.04), IN("#fw-bsub", "blur", 1.0)]),
        ("Dữ liệu mẫu là năm nhân viên. Mỗi người có tên, phòng ban, lương, và số năm kinh nghiệm.",
         "Dữ liệu mẫu: 5 nhân viên, mỗi người có tên, phòng ban, lương và số năm kinh nghiệm.",
         [OUT("#fw-big, #fw-bsub", "zoom"), IN("#fw-hud", "left", 0.2), IN("#fw-data", "left", 0.4)]),
        ("Collect là thao tác kết thúc, gom cả stream thành một kết quả. Còn lớp Collectors chứa sẵn các công thức gom.",
         "collect: thao tác kết thúc, gom cả stream thành một kết quả. Collectors: các công thức gom có sẵn.",
         [IN("#fw-w1", "left", 0.3), IN("#fw-w2", "left", 3.4)]),
        ("Nhiều collector nhận thêm một collector con, gọi là downstream, để xử lý tiếp từng nhóm.",
         "Nhiều collector nhận thêm một collector con (downstream) để xử lý tiếp từng nhóm.",
         [IN("#fw-s", "pop", 0.2), DRAW("#fw-a-p", 0.6, 0.35), IN("#fw-g", "pop", 0.9), LIGHT("#fw-g", 1.2),
          DRAW("#fw-b-p", 1.6, 0.35), IN("#fw-d", "pop", 1.9), LIGHT("#fw-d", 2.4), IN("#fw-dn", "up", 2.6),
          DRAW("#fw-c-p", 3.2, 0.35), IN("#fw-m", "pop", 3.5), LIGHT("#fw-m", 3.9)]),
        ("Giống hệt group by trong SQL: đếm, tính trung bình, hay tính tổng cho mỗi nhóm.",
         "Giống GROUP BY trong SQL: đếm, tính trung bình, tính tổng cho mỗi nhóm.",
         [OUT("#fw-data, #fw-w1, #fw-w2", "blur", 0, 0.4), IN("#fw-sql", "up", 0.5)]),
    ]),
    # ------------------------------------------------------------ toMap traps
    dict(id="tomap", world=(1920, 1080), hud=hud("tm", "toMap: 2 cái bẫy", "Key trùng và value null"), cam="".join([
        big_title("tm", "toMap: 2 cái bẫy", "Key trùng và value null"),
        box("tm-c1", 160, 190, 1600, 110, code("emps.stream().collect(toMap(Employee::dept, Employee::name));"), "cyan", "code"),
        chip("tm-k1", 160, 340, "IT = An", "cyan"),
        chip("tm-k2", 360, 340, "IT = Bình ?", "red"),
        el("tm-e1", 160, 430, 1600, None, "✕ IllegalStateException: Duplicate key IT (attempted merging values An and Bình)", "err r"),
        box("tm-c2", 160, 540, 1600, 110, code("toMap(Employee::dept, Employee::salary, Double::sum, TreeMap::new)"), "green", "code"),
        chip("tm-p3", 160, 690, "tham số 3: trùng key thì cộng", "amber"),
        chip("tm-p4", 680, 690, "tham số 4: TreeMap, key sắp xếp", "violet"),
        chip("tm-r2", 160, 780, "{HR=3300.0, IT=5000.0, Sales=2500.0}", "green"),
        box("tm-c3", 160, 240, 1600, 110, code('Stream.of("a").collect(toMap(k -> k, k -> null));'), "cyan", "code"),
        el("tm-e3", 160, 390, 700, None, "✕ NullPointerException", "err r"),
        chip("tm-why", 160, 500, "toMap 2 tham số: Objects.requireNonNull · có merge: Map.merge cũng cấm null", "amber"),
        el("tm-fix", 160, 600, 1600, None, "Value có thể null: lọc trước, hoặc dùng vòng for với map.put", "note green left r"),
    ]), beats=[
        ("Phần hai: to map, và hai cái bẫy kinh điển.", "Phần 2: toMap và hai cái bẫy kinh điển.",
         [TYPE("#tm-big", 0.1, 0.05), IN("#tm-bsub", "blur", 1.0)]),
        ("Bẫy thứ nhất: An và Bình cùng phòng IT, nên bị trùng khóa. Lúc đó to map ném Illegal State Exception.",
         "Bẫy 1: An và Bình cùng phòng IT, trùng key. toMap ném IllegalStateException.",
         [OUT("#tm-big, #tm-bsub", "zoom"), IN("#tm-hud", "left", 0.2), IN("#tm-c1", "up", 0.4),
          IN("#tm-k1", "pop", 1.6), IN("#tm-k2", "pop", 2.6), SHAKE("#tm-k2", 3.1), IN("#tm-e1", "up", 4.2), SHAKE("#tm-e1", 4.7)]),
        ("Sửa bằng tham số thứ ba, merge function: trùng key thì cộng lương lại. Tham số thứ tư chọn Tree Map để key được sắp xếp.",
         "Sửa bằng tham số 3 (merge function): trùng key thì cộng lương. Tham số 4 chọn TreeMap để key được sắp xếp.",
         [IN("#tm-c2", "up", 0.3), IN("#tm-p3", "left", 1.0), IN("#tm-p4", "left", 4.6), IN("#tm-r2", "pop", 5.6)]),
        ("Bẫy hai: value rỗng. Bên trong, to map kiểm tra value bằng Objects requireNonNull, bản có hàm merge thì gọi Map merge cũng không nhận giá trị rỗng, nên đều ném Null Pointer Exception.",
         "Bẫy 2: value null. toMap dùng Map.merge, mà merge không nhận null, nên ném NullPointerException.",
         [OUT("#tm-c1, #tm-k1, #tm-k2, #tm-e1, #tm-c2, #tm-p3, #tm-p4, #tm-r2", "blur", 0, 0.4),
          IN("#tm-c3", "up", 0.5), IN("#tm-e3", "up", 2.0), SHAKE("#tm-e3", 2.5), IN("#tm-why", "left", 3.4)]),
        ("Nếu value có thể rỗng, hãy lọc trước, hoặc dùng vòng for với hàm pút.",
         "Value có thể null: lọc trước, hoặc dùng vòng for với map.put.",
         [IN("#tm-fix", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ groupingBy with downstream collectors
    dict(id="group", world=(1920, 1080), hud=hud("gr", "groupingBy", "Gom nhóm, rồi xử lý từng nhóm"), cam="".join([
        big_title("gr", "groupingBy", "Gom nhóm, rồi xử lý từng nhóm"),
        box("gr-c0", 160, 190, 1600, 110, code("emps.stream().collect(groupingBy(Employee::dept));"), "cyan", "code"),
        box("gr-c1", 160, 190, 1600, 110, code("groupingBy(Employee::dept, TreeMap::new, counting())"), "cyan", "code"),
        box("gr-c2", 160, 190, 1600, 110, code("groupingBy(Employee::dept, TreeMap::new, averagingDouble(Employee::salary))"), "cyan", "code"),
        box("gr-c3", 160, 190, 1600, 110, code("groupingBy(Employee::dept, TreeMap::new, mapping(Employee::name, toList()))"), "cyan", "code"),
        "".join(box(f"gr-b{k}", x, 340, w, 400, f'<span class="mono">{key}</span>', TONE[key], "bucket")
                for k, (key, x, w) in enumerate(BUCKETS)),
        "".join(chip(f"gr-e{i}", 160, ROW_Y[i], f"{n} · {d}", TONE[d]) for i, (n, d, _) in enumerate(EMPS)),
        "".join(el(f"gr-{kind}{k}", x + 30, 610, w - 60, None, esc(GROUP_RESULTS[kind][k]), "stamp green r")
                for kind in GROUP_RESULTS for k, (_, x, w) in enumerate(BUCKETS)),
        el("gr-warn", 160, 790, 1600, None,
           "Mặc định là HashMap: {Sales=1, HR=2, IT=2}, thứ tự key không đảm bảo → truyền TreeMap::new", "warnbox r"),
    ]), beats=[
        ("Phần ba: grouping by, gom nhóm.", "Phần 3: groupingBy, gom nhóm.",
         [TYPE("#gr-big", 0.1, 0.05), IN("#gr-bsub", "blur", 0.9)]),
        ("Gom theo phòng ban: mỗi nhân viên rơi vào nhóm của mình.",
         "Gom theo phòng ban: mỗi nhân viên rơi vào nhóm của mình.",
         [OUT("#gr-big, #gr-bsub", "zoom"), IN("#gr-hud", "left", 0.2), IN("#gr-c0", "up", 0.3),
          IN(", ".join(f"#gr-e{i}" for i in range(5)), "left", 0.6, 0.4, 0.08),
          IN("#gr-b0, #gr-b1, #gr-b2", "pop", 0.8, 0.4, 0.1), *stagger(moves("gr-e", GROUP_LAND), 1.3, 0.2)]),
        ("Thêm downstream counting để đếm: IT hai người, HR hai người, Sales một người.",
         "Thêm downstream counting() để đếm: IT 2, HR 2, Sales 1.",
         [OUT("#gr-c0", "fade", 0, 0.3), IN("#gr-c1", "fade", 0.3, 0.4), IN("#gr-count0, #gr-count1, #gr-count2", "pop", 1.6, 0.4, 0.5)]),
        ("Đổi sang averaging double: lương trung bình của mỗi phòng.",
         "Đổi sang averagingDouble(): lương trung bình mỗi phòng.",
         [OUT("#gr-c1, #gr-count0, #gr-count1, #gr-count2", "fade", 0, 0.3), IN("#gr-c2", "fade", 0.3, 0.4),
          IN("#gr-avg0, #gr-avg1, #gr-avg2", "pop", 1.4, 0.4, 0.4)]),
        ("Chỉ cần tên thôi? Dùng mapping để lấy tên, rồi gom vào một list.",
         "Chỉ cần tên? mapping() lấy tên rồi gom vào list.",
         [OUT("#gr-c2, #gr-avg0, #gr-avg1, #gr-avg2", "fade", 0, 0.3), IN("#gr-c3", "fade", 0.3, 0.4),
          IN("#gr-names0, #gr-names1, #gr-names2", "pop", 1.4, 0.4, 0.4)]),
        ("Lưu ý: mặc định kết quả là Hash Map, nên thứ tự key không đảm bảo. Muốn key được sắp xếp, hãy truyền Tree Map vào.",
         "Mặc định là HashMap nên thứ tự key không đảm bảo. Muốn sắp xếp: truyền TreeMap::new.",
         [IN("#gr-warn", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ maxBy + collectingAndThen
    dict(id="max", world=(1920, 1080), hud=hud("mx", "maxBy & collectingAndThen", "Người lương cao nhất mỗi phòng"), cam="".join([
        box("mx-code", 160, 190, 1600, 200, code(
            "groupingBy(Employee::dept, TreeMap::new,\n"
            "    collectingAndThen(maxBy(comparingDouble(Employee::salary)),\n"
            "                      o -> o.get().name()))"), "cyan", "code"),
        gnode("mx-g", 160, 460, 420, 110, "IT: An 2000, Bình 3000", "cyan"),
        gnode("mx-m", 700, 460, 240, 110, "maxBy", "amber"),
        gnode("mx-o", 1060, 460, 320, 110, "Optional[Bình]", "violet"),
        gnode("mx-n", 1500, 460, 260, 110, "Bình", "green"),
        el("mx-l1", 700, 600, 720, None, "maxBy trả về Optional: về lý thuyết nhóm có thể rỗng", "note left r"),
        el("mx-l2", 700, 660, 1060, None, "collectingAndThen: xử lý thêm kết quả → o.get().name()", "note left r"),
        chip("mx-res", 160, 750, "{HR=Dũng, IT=Bình, Sales=Em}", "green"),
        el("mx-safe", 160, 840, 1600, None, "Trong groupingBy mỗi nhóm luôn có ít nhất 1 phần tử, nên get() an toàn", "note green left r"),
        wires(trace("mx-a", [(580, 515), (692, 515)], "cyan"), trace("mx-b", [(940, 515), (1052, 515)], "amber"),
              trace("mx-c", [(1380, 515), (1492, 515)], "violet")),
    ]), beats=[
        ("Phần bốn: lấy tên người lương cao nhất mỗi phòng.", "Phần 4: tên người lương cao nhất mỗi phòng.",
         [IN("#mx-hud", "left", 0.1), IN("#mx-code", "up", 0.4)]),
        ("Hàm max by trả về một Optional, vì về lý thuyết nhóm có thể rỗng.",
         "maxBy trả về Optional, vì về lý thuyết nhóm có thể rỗng.",
         [IN("#mx-g", "pop", 0.2), DRAW("#mx-a-p", 0.6, 0.35), IN("#mx-m", "pop", 0.9), LIGHT("#mx-m", 1.3),
          DRAW("#mx-b-p", 1.7, 0.35), IN("#mx-o", "pop", 2.0), LIGHT("#mx-o", 2.4), IN("#mx-l1", "up", 2.8)]),
        ("Hàm collecting and then cho phép xử lý thêm kết quả đó: mở Optional ra, và lấy tên.",
         "collectingAndThen xử lý thêm kết quả: mở Optional ra và lấy tên.",
         [DRAW("#mx-c-p", 0.4, 0.35), IN("#mx-n", "pop", 0.7), LIGHT("#mx-n", 1.1), IN("#mx-l2", "up", 1.6)]),
        ("Kết quả: HR là Dũng, IT là Bình, Sales là Em. Mỗi nhóm luôn có ít nhất một người, nên gọi get là an toàn.",
         "Kết quả: HR=Dũng, IT=Bình, Sales=Em. Mỗi nhóm luôn có ít nhất một người, nên get() an toàn.",
         [IN("#mx-res", "pop", 0.3), IN("#mx-safe", "up", 3.6)]),
    ]),
    # ------------------------------------------------------------ partitioningBy
    dict(id="part", world=(1920, 1080), hud=hud("pt", "partitioningBy", "Luôn đủ hai key true và false"), cam="".join([
        big_title("pt", "partitioningBy", "Chia đúng hai nhóm: true và false"),
        box("pt-code", 160, 190, 1600, 110, code("partitioningBy(e -> e.years() >= 5, mapping(Employee::name, toList()))"), "cyan", "code"),
        box("pt-bt", 800, 340, 440, 300, '<span class="mono">true · từ 5 năm</span>', "green", "bucket"),
        box("pt-bf", 1300, 340, 460, 300, '<span class="mono">false · dưới 5 năm</span>', "amber", "bucket"),
        "".join(chip(f"pt-e{i}", 160, ROW_Y[i], f"{n} · {y} năm", "green" if y >= 5 else "amber")
                for i, (n, _, y) in enumerate(EMPS)),
        chip("pt-res", 800, 680, "{false=[Bình, Dũng, Em], true=[An, Chi]}", "green"),
        box("pt-c2", 160, 220, 1600, 110, code("emps.stream().filter(e -> e.years() > 100)   // không còn ai"), "cyan", "code"),
        box("pt-pa", 160, 400, 760, 220, '<b>partitioningBy</b><span class="mono big">{false=[], true=[]}</span>', "green", "card"),
        box("pt-ga", 1000, 400, 760, 220, '<b>groupingBy</b><span class="mono big">{}</span>', "red", "card"),
    ]), beats=[
        ("Phần năm: partitioning by, chia đúng hai nhóm.", "Phần 5: partitioningBy, chia đúng hai nhóm.",
         [TYPE("#pt-big", 0.1, 0.04), IN("#pt-bsub", "blur", 1.0)]),
        ("Điều kiện là từ năm năm kinh nghiệm trở lên. An và Chi vào nhóm true, ba người còn lại vào nhóm false.",
         "Điều kiện: từ 5 năm kinh nghiệm. An, Chi vào true; ba người còn lại vào false.",
         [OUT("#pt-big, #pt-bsub", "zoom"), IN("#pt-hud", "left", 0.2), IN("#pt-code", "up", 0.3),
          IN(", ".join(f"#pt-e{i}" for i in range(5)), "left", 0.6, 0.4, 0.08), IN("#pt-bt, #pt-bf", "pop", 1.0, 0.4, 0.15),
          *stagger(moves("pt-e", PART_LAND), 2.4, 0.3), IN("#pt-res", "pop", 4.4)]),
        ("Điểm khác grouping by: partitioning by luôn có đủ hai key true và false, kể cả khi không còn ai.",
         "Khác groupingBy: partitioningBy luôn có đủ key true và false, kể cả khi rỗng.",
         [OUT("#pt-code, #pt-bt, #pt-bf, #pt-res, " + ", ".join(f"#pt-e{i}" for i in range(5)), "blur", 0, 0.4),
          IN("#pt-c2", "up", 0.5), IN("#pt-pa", "pop", 2.4)]),
        ("Còn grouping by thì trả về một map rỗng.", "Còn groupingBy trả về map rỗng {}.",
         [IN("#pt-ga", "pop", 0.2), PULSE("#pt-ga", 1.2)]),
    ]),
    # ------------------------------------------------------------ joining + teeing
    dict(id="join", world=(1920, 1080), hud=hud("jn", "joining & teeing", "Nối chuỗi, và chạy hai collector cùng lúc"), cam="".join([
        box("jn-code", 160, 190, 1600, 110, code('emps.stream().map(Employee::name).collect(joining(", ", "[", "]"));'), "cyan", "code"),
        chip("jn-out", 160, 340, "[An, Bình, Chi, Dũng, Em]", "green"),
        el("jn-note", 700, 350, 1000, None, "3 tham số: dấu phân cách, tiền tố, hậu tố", "note left r"),
        box("jn-c2", 160, 190, 1600, 200, code(
            "emps.stream().collect(teeing(\n    counting(), summingDouble(Employee::salary),\n"
            "    (count, sum) -> sum / count));   // 2160.0"), "violet", "code"),
        gnode("jn-a", 160, 460, 480, 100, "counting() → 5", "cyan"),
        gnode("jn-b", 160, 610, 480, 100, "summingDouble → 10800.0", "amber"),
        gnode("jn-m", 900, 535, 380, 100, "sum / count", "violet"),
        gnode("jn-r", 1440, 535, 320, 100, "2160.0", "green"),
        wires(trace("jn-ta", [(640, 510), (770, 510), (770, 585), (892, 585)], "cyan"),
              trace("jn-tb", [(640, 660), (770, 660), (770, 585), (892, 585)], "amber"),
              trace("jn-tc", [(1280, 585), (1432, 585)], "violet")),
    ]), beats=[
        ("Phần sáu: hàm joining, và hàm teeing.", "Phần 6: joining và teeing.",
         [IN("#jn-hud", "left", 0.1), IN("#jn-code", "up", 0.4)]),
        ("Hàm joining nối chuỗi, với dấu phân cách, tiền tố, và hậu tố.",
         "joining nối chuỗi, với dấu phân cách, tiền tố và hậu tố.",
         [IN("#jn-out", "pop", 0.4), IN("#jn-note", "up", 1.6)]),
        ("Hàm teeing, có từ Java mười hai, chạy hai collector cùng lúc, rồi gộp hai kết quả lại.",
         "teeing (Java 12) chạy hai collector cùng lúc rồi gộp kết quả.",
         [OUT("#jn-code, #jn-out, #jn-note", "blur", 0, 0.4), IN("#jn-c2", "up", 0.5)]),
        ("Một bên đếm được năm người, một bên cộng tổng lương. Chia ra, lương trung bình là hai nghìn một trăm sáu mươi.",
         "Một bên đếm: 5 người, một bên cộng tổng lương: 10800.0. Chia ra: trung bình 2160.0.",
         [IN("#jn-a", "pop", 0.2), LIGHT("#jn-a", 0.6), IN("#jn-b", "pop", 1.6), LIGHT("#jn-b", 2.0),
          DRAW("#jn-ta-p", 3.0, 0.4), DRAW("#jn-tb-p", 3.0, 0.4), IN("#jn-m", "pop", 3.4), LIGHT("#jn-m", 3.8),
          DRAW("#jn-tc-p", 4.2, 0.35), IN("#jn-r", "pop", 4.5), LIGHT("#jn-r", 5.0)]),
    ]),
    # ------------------------------------------------------------ reduce vs collect
    dict(id="reduce", world=(1920, 1080), hud=hud("rd", "reduce hay collect", "Một giá trị, hay một container"), cam="".join([
        box("rd-a", 160, 200, 760, 290, "<b>reduce</b><small>gộp dần thành một giá trị bất biến</small><small>tổng, tích, max</small>", "amber", "card"),
        box("rd-b", 1000, 200, 760, 290, "<b>collect</b><small>gom vào container có thể thay đổi</small><small>List, Map, StringBuilder</small>", "cyan", "card"),
        box("rd-code", 160, 530, 1600, 160, code(
            "emps.stream().map(Employee::salary).reduce(0.0, Double::sum);   // 10800.0\n"
            "emps.stream().mapToDouble(Employee::salary).sum();              // gọn hơn, không boxing"), "violet", "code"),
        el("rd-warn", 160, 730, 1600, None, "Đừng reduce vào List: mỗi bước tạo list mới, rất chậm. Gom vào container thì dùng collect.", "warnbox r"),
    ]), beats=[
        ("Phần bảy: reduce khác collect thế nào?", "Phần 7: reduce khác collect thế nào?",
         [IN("#rd-hud", "left", 0.1)]),
        ("Reduce gộp dần thành một giá trị, như tổng hay max. Còn collect gom vào một container, như list hay map.",
         "reduce gộp dần thành một giá trị (tổng, max). collect gom vào container (List, Map).",
         [IN("#rd-a", "left", 0.2), IN("#rd-b", "right", 3.2)]),
        ("Tính tổng lương bằng reduce ra mười nghìn tám trăm. Nhưng map to double rồi cộng tổng thì gọn hơn, và không boxing.",
         "Tổng lương bằng reduce: 10800.0. Nhưng mapToDouble().sum() gọn hơn, không boxing.",
         [IN("#rd-code", "up", 0.3)]),
        ("Đừng dùng reduce để gom vào list, vì mỗi bước lại tạo ra một list mới.",
         "Đừng dùng reduce để gom vào List: mỗi bước lại tạo một list mới.",
         [IN("#rd-warn", "up", 0.3), SHAKE("#rd-warn", 1.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 150, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 300, 340, 280, 30, [("hash", "toMap", "trùng key: merge function"),
                                                ("grid", "groupingBy", "+ downstream như SQL"),
                                                ("tree", "partitioningBy", "luôn đủ true, false"),
                                                ("eq", "reduce vs collect", "giá trị hay container")]),
        chip("ou-next", 700, 660, "Bài tiếp: Optional & Parallel Stream", "violet"),
        el("ou-cta", 0, 790, 1920, None, "Mở bài học tương tác để làm quiz và luyện 10 bài viết tay", "cta r"),
    ]), beats=[
        ("Tóm lại: to map trùng key thì cần merge function. Grouping by kèm downstream, giống group by trong SQL. "
         "Partitioning by luôn đủ hai key. Và reduce cho ra một giá trị, còn collect gom vào một container.",
         "toMap trùng key: merge function · groupingBy + downstream như GROUP BY · partitioningBy luôn đủ 2 key · reduce ra giá trị, collect ra container.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.6), IN("#ou-c2", "pop", 7.4), IN("#ou-c3", "pop", 10.0)]),
        ("Bài sau: Optional và Parallel Stream.", "Bài sau: Optional & Parallel Stream.",
         [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và luyện mười bài viết tay nhé.",
         "Mở bài học tương tác để làm quiz và luyện 10 bài viết tay nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
