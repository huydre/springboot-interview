"""Java 17 & 21 explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output was run on JDK 21:
record Money(BigDecimal amount, String currency) prints Money[amount=100, currency=VND]; equals and hashCode match;
compact constructor -> java.lang.IllegalArgumentException: amount < 0; records are final and extend java.lang.Record;
text block prints {"name": "An", "age": 25}; obj instanceof String s && s.length() > 3 -> HELLO;
switch expression: SAT -> 0, MON -> 8 (yield); area(Rect(2, 3)) = 6.0, area(Rect(2, 2)) = 4.0, area(Square(3)) = 9.0;
List.of(1, 2, 3).getFirst() = 1, getLast() = 3, reversed() = [3, 2, 1];
100_000 virtual threads that each sleep 1 s finish in 1.6 s.
javac: var x = null -> "cannot infer type for local variable x"; a switch missing Triangle -> "the switch expression does
not cover all possible input values"; class Hack implements a sealed Shape -> "class is not allowed to extend sealed class:
Shape (as it is not listed in its 'permits' clause)".
Theme: mono (NullMotion "Infinite" look).
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)



LTS = [("8", "lambda, stream, Optional"), ("11", "HttpClient, isBlank()"), ("17", "sealed · Spring Boot 3"),
       ("21", "virtual threads, pattern switch"), ("25", "LTS mới nhất")]
LTS_X = [120, 500, 880, 1260, 1640]
GEN = ["private final amount, currency", "constructor đủ tham số", "accessor amount(), currency()",
       "equals() · hashCode()", "toString()"]
GEN_Y = [200, 330, 460, 590, 720]
SHAPES = [("Circle", 450), ("Square", 565), ("Rect", 680)]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 300, 1300, None, "Câu hỏi phỏng vấn Java #9", "eyebrow r"),
        el("hk-q1", 0, 380, 1920, None, letters("Bạn đang dùng Java bản nào?"), "h1 center r"),
        el("hk-q2", 0, 500, 1920, None, "và bạn đã dùng những tính năng mới nào?", "kin-sub r"),
        tile("hk-tile", 420, 350, 220, "shapes"),
        el("hk-word", 690, 380, 900, None, letters("Java 17 & 21"), "h1 wordmark r", "text-align:left"),
        el("hk-sub", 0, 680, 1920, None, "record · sealed · pattern matching · virtual threads", "kin-sub r"),
    ]), beats=[
        ("Câu hỏi phỏng vấn rất hay gặp: bạn đang dùng Java bản nào, và đã dùng những tính năng mới nào?",
         "Câu hỏi rất hay gặp: bạn đang dùng Java bản nào, và đã dùng những tính năng mới nào?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q1", 0.4, 0.03), IN("#hk-q2", "blur", 3.0)]),
        ("Hôm nay ta học các tính năng của Java mười bảy và hai mươi mốt.", "Hôm nay: các tính năng của Java 17 & 21.",
         [OUT("#hk-eye, #hk-q1, #hk-q2", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.4, 0.8), TYPE("#hk-word", 0.8, 0.05),
          IN("#hk-sub", "blur", 1.9)]),
    ]),
    # ------------------------------------------------------------ LTS map as a circuit
    dict(id="lts", world=(1920, 1080), hud=hud("lt", "Bản đồ phiên bản", "Doanh nghiệp gần như chỉ dùng bản LTS"), cam="".join([
        "".join(gnode(f"lt-n{i}", x, 300, 160, 110, f"Java {v}" if i == 0 else v, "cyan" if v != "17" else "green")
                for i, ((v, _), x) in enumerate(zip(LTS, LTS_X))),
        "".join(el(f"lt-f{i}", x - 40, 440, 240, None, esc(f), "note r") for i, ((_, f), x) in enumerate(zip(LTS, LTS_X))),
        chip("lt-sb", 760, 560, "Spring Boot 3: tối thiểu Java 17", "green"),
        chip("lt-v10", 160, 700, "10: var", "violet"),
        chip("lt-v14", 480, 700, "14: switch expression", "violet"),
        chip("lt-v15", 900, 700, "15: text block", "violet"),
        chip("lt-v16", 1240, 700, "16: record, instanceof pattern", "violet"),
        wires(trace("lt-in", [(0, 355), (112, 355)], "cyan"),
              *[trace(f"lt-t{i}", [(LTS_X[i] + 160, 355), (LTS_X[i + 1] - 8, 355)], "cyan") for i in range(4)]),
    ]), beats=[
        ("Phần một: bản đồ phiên bản. LTS là các bản được hỗ trợ dài hạn, và doanh nghiệp gần như chỉ dùng bản LTS.",
         "Phần 1: bản đồ phiên bản. LTS là bản hỗ trợ dài hạn; doanh nghiệp gần như chỉ dùng LTS.",
         [IN("#lt-hud", "left", 0.1), IN(", ".join(f"#lt-n{i}" for i in range(5)), "pop", 0.5, 0.4, 0.15),
          DRAW("#lt-in-p", 1.4, 0.3), *[DRAW(f"#lt-t{i}-p", 1.6 + i * 0.15, 0.3) for i in range(4)]]),
        ("Các bản LTS là tám, mười một, mười bảy, hai mươi mốt, và mới nhất là hai mươi lăm.", "Các bản LTS: 8, 11, 17, 21, 25.",
         [COMET("lt-in", 0.1, 0.35), LIGHT("#lt-n0", 0.4), IN("#lt-f0", "up", 0.4),
          *[x for i in range(4) for x in (COMET(f"lt-t{i}", 0.6 + i * 0.6, 0.4), LIGHT(f"#lt-n{i + 1}", 1.0 + i * 0.6),
                                          IN(f"#lt-f{i + 1}", "up", 1.0 + i * 0.6))]]),
        ("Spring Boot ba yêu cầu tối thiểu Java mười bảy, nên các tính năng này xuất hiện trong code hằng ngày.",
         "Spring Boot 3 yêu cầu tối thiểu Java 17, nên các tính năng này có trong code hằng ngày.",
         [PULSE("#lt-n2", 0.3), IN("#lt-sb", "pop", 0.6)]),
        ("Ở giữa các bản LTS: var ở bản mười, switch expression ở bản mười bốn, text block ở mười lăm, và record ở mười sáu.",
         "Ở giữa: var (10), switch expression (14), text block (15), record (16).",
         [IN("#lt-v10", "left", 0.3), IN("#lt-v14", "left", 1.6), IN("#lt-v15", "left", 3.4), IN("#lt-v16", "left", 5.0)]),
    ]),
    # ------------------------------------------------------------ var + text block
    dict(id="var", world=(1920, 1080), hud=hud("vr", "var & text block", "Gọn hơn, nhưng vẫn kiểu tĩnh"), cam="".join([
        box("vr-code", 160, 190, 1600, 190, code(
            "var users = new ArrayList<User>();     // kiểu ArrayList<User>, xác định lúc compile\n"
            "for (var entry : map.entrySet()) { ... }"), "cyan", "code"),
        box("vr-bad", 160, 420, 1600, 110, code("var x = null;   var y;"), "red", "code"),
        el("vr-err", 160, 560, 1600, None, "✕ cannot infer type for local variable x", "err r"),
        chip("vr-r1", 160, 680, "Chỉ cho biến local có khởi tạo ngay", "cyan"),
        chip("vr-r2", 760, 680, "Không dùng cho field, tham số, kiểu trả về", "amber"),
        chip("vr-r3", 160, 770, "Không phải kiểu động: bytecode y hệt khi viết kiểu đầy đủ", "violet"),
        box("vr-tb", 160, 190, 1000, 250, win("text block") + code(
            'String json = """\n        {"name": "An", "age": 25}\n        """;'), "cyan", "code"),
        console("vr-out", 1220, 250, 540, ['{"name": "An", "age": 25}']),
        el("vr-tbn", 160, 480, 1600, None, "Không cần \\n và dấu + nối chuỗi; phần thụt lề chung tự bị loại bỏ. Hợp cho JSON trong test, SQL dài.", "note left r"),
    ]), beats=[
        ("Phần hai: var. Compiler tự suy ra kiểu từ vế phải.", "Phần 2: var. Compiler tự suy ra kiểu từ vế phải.",
         [IN("#vr-hud", "left", 0.1), IN("#vr-code", "up", 0.4)]),
        ("Không có gì để suy kiểu thì lỗi biên dịch, ví dụ gán null, hay khai báo mà không khởi tạo.",
         "Không có gì để suy kiểu thì lỗi biên dịch: var x = null, hay var y; không khởi tạo.",
         [IN("#vr-bad", "up", 0.3), IN("#vr-err", "up", 2.6), SHAKE("#vr-err", 3.1)]),
        ("Var chỉ dùng cho biến local có khởi tạo ngay. Và nó không biến Java thành kiểu động: kiểu vẫn được xác định lúc compile.",
         "var chỉ cho biến local có khởi tạo. Không phải kiểu động: kiểu vẫn xác định lúc compile.",
         [IN("#vr-r1", "left", 0.3), IN("#vr-r2", "left", 2.0), IN("#vr-r3", "left", 4.4)]),
        ("Text block, từ bản mười lăm, viết chuỗi nhiều dòng mà không cần nối chuỗi. Rất hợp cho JSON trong test, hay câu SQL dài.",
         "Text block (Java 15): chuỗi nhiều dòng, không cần nối chuỗi. Hợp cho JSON trong test, SQL dài.",
         [OUT("#vr-code, #vr-bad, #vr-err, #vr-r1, #vr-r2, #vr-r3", "blur", 0, 0.4), IN("#vr-tb", "up", 0.4),
          IN("#vr-out", "right", 1.6, 0.4), IN("#vr-out-1", "type1", 2.0, 0.3), IN("#vr-tbn", "up", 3.4)]),
    ]),
    # ------------------------------------------------------------ record: what one line generates
    dict(id="record", world=(1920, 1080), hud=hud("rc", "record", "Class mang dữ liệu, immutable"), cam="".join([
        big_title("rc", "record", "Một dòng, compiler sinh cả class"),
        gnode("rc-src", 100, 440, 620, 120, "record Money(amount, currency)", "cyan"),
        "".join(gnode(f"rc-g{i}", 1100, y, 640, 90, esc(g), "violet") for i, (g, y) in enumerate(zip(GEN, GEN_Y))),
        wires(*[trace(f"rc-t{i}", [(720, 500), (880, 500), (880, y + 45), (1092, y + 45)], "violet", r=28) for i, y in enumerate(GEN_Y)]),
        chip("rc-noget", 100, 620, "accessor không có tiền tố get", "amber"),
        box("rc-cc", 160, 190, 1600, 250, win("compact constructor") + code(
            "public record Money(BigDecimal amount, String currency) {\n"
            "    public Money { if (amount.signum() < 0) throw new IllegalArgumentException(\"amount < 0\"); }\n}"), "cyan", "code"),
        el("rc-ex", 160, 480, 1600, None, '✕ new Money(new BigDecimal("-1"), "VND") → IllegalArgumentException: amount < 0', "err r"),
        chip("rc-l1", 160, 600, "final, ngầm extends java.lang.Record: không kế thừa class khác", "amber"),
        chip("rc-l2", 160, 690, "Được implement interface, có method thường và static", "green"),
    ]), beats=[
        ("Phần ba: record.", "Phần 3: record.",
         [TYPE("#rc-big", 0.1, 0.06), IN("#rc-bsub", "blur", 0.7)]),
        ("Chỉ một dòng khai báo, compiler tự sinh field final, constructor, accessor, equals, hash code, và to string.",
         "Một dòng khai báo, compiler sinh: field final, constructor, accessor, equals, hashCode, toString.",
         [OUT("#rc-big, #rc-bsub", "zoom"), IN("#rc-hud", "left", 0.2), IN("#rc-src", "pop", 0.4), LIGHT("#rc-src", 0.8),
          *[x for i in range(5) for x in (DRAW(f"#rc-t{i}-p", 1.0, 0.4),)],
          IN(", ".join(f"#rc-g{i}" for i in range(5)), "left", 1.2, 0.4, 0.1),
          *[x for i, at in enumerate((2.0, 2.9, 3.8, 4.7, 5.6)) for x in (COMET(f"rc-t{i}", at, 0.45), LIGHT(f"#rc-g{i}", at + 0.45))]]),
        ("Lưu ý: accessor là amount, không có tiền tố get.", "Lưu ý: accessor là amount(), không có tiền tố get.",
         [IN("#rc-noget", "pop", 0.3), PULSE("#rc-g2", 0.8)]),
        ("Muốn kiểm tra dữ liệu, viết compact constructor. Số tiền âm thì ném exception ngay lúc tạo.",
         "Validate trong compact constructor: số tiền âm thì ném exception ngay lúc tạo.",
         [OUT("#rc-src, #rc-noget, " + ", ".join(f"#rc-g{i}, #rc-t{i}" for i in range(5)), "blur", 0, 0.4),
          IN("#rc-cc", "up", 0.4), IN("#rc-ex", "up", 2.6), SHAKE("#rc-ex", 3.1)]),
        ("Record là final, và ngầm kế thừa lớp Record, nên không kế thừa class khác được. Nhưng vẫn implement được interface.",
         "record là final, ngầm extends Record: không kế thừa class khác, nhưng implement được interface.",
         [IN("#rc-l1", "left", 0.3), IN("#rc-l2", "left", 3.6)]),
    ]),
    # ------------------------------------------------------------ where records fit in a Spring project
    dict(id="where", world=(1920, 1080), hud=hud("wr", "Dùng record ở đâu", "Trong dự án Spring"), cam="".join([
        el("wr-h1", 160, 190, 760, None, "✓ Nên dùng", "colhead", "color:var(--green)"),
        el("wr-h2", 1000, 190, 760, None, "✕ Không dùng", "colhead", "color:var(--red)"),
        chip("wr-y0", 160, 270, "DTO request, response của REST API", "green"),
        chip("wr-y1", 160, 360, "Projection trong Spring Data JPA", "green"),
        chip("wr-y2", 160, 450, "@ConfigurationProperties", "green"),
        chip("wr-y3", 160, 540, "Value object: Money, Address", "green"),
        chip("wr-n0", 1000, 270, "JPA entity", "red"),
        el("wr-why", 1000, 360, 760, None, "Hibernate cần constructor rỗng, field sửa được, và tạo proxy bằng cách kế thừa class: record là final, field final", "note left r"),
        chip("wr-lb", 160, 700, "Thay Lombok @Data cho class dữ liệu immutable; vẫn cần Lombok cho @Builder, @Slf4j", "violet"),
    ]), beats=[
        ("Phần bốn: dùng record ở đâu trong dự án Spring?", "Phần 4: dùng record ở đâu trong dự án Spring?",
         [IN("#wr-hud", "left", 0.1), IN("#wr-h1", "fade", 0.4), IN("#wr-h2", "fade", 0.6)]),
        ("Dùng cho DTO của API, projection trong JPA, cấu hình, và các value object như tiền tệ hay địa chỉ.",
         "Dùng cho DTO của API, projection trong JPA, @ConfigurationProperties, value object.",
         [IN("#wr-y0", "left", 0.3), IN("#wr-y1", "left", 1.6), IN("#wr-y2", "left", 3.0), IN("#wr-y3", "left", 4.2)]),
        ("Không dùng làm JPA entity, vì Hibernate cần constructor rỗng, field sửa được, và tạo proxy bằng cách kế thừa class.",
         "Không dùng làm JPA entity: Hibernate cần constructor rỗng, field sửa được, và proxy kế thừa class.",
         [IN("#wr-n0", "pop", 0.3), SHAKE("#wr-n0", 0.8), IN("#wr-why", "up", 1.6)]),
        ("Record thay được Lombok data cho class dữ liệu bất biến, nhưng Lombok vẫn hữu ích cho builder và logger.",
         "record thay được Lombok @Data cho class immutable; Lombok vẫn hữu ích cho @Builder, @Slf4j.",
         [IN("#wr-lb", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ sealed hierarchies
    dict(id="sealed", world=(1920, 1080), hud=hud("sl", "sealed", "Đóng hệ phân cấp lại"), cam="".join([
        big_title("sl", "sealed", "Liệt kê chính xác ai được kế thừa"),
        box("sl-code", 160, 180, 1600, 230, code(
            "public sealed interface Shape permits Circle, Square, Rect {}\n"
            "public record Circle(double radius) implements Shape {}\n"
            "public record Square(double side) implements Shape {}\n"
            "public record Rect(double w, double h) implements Shape {}"), "cyan", "code"),
        gnode("sl-shape", 160, 560, 300, 110, "Shape", "violet"),
        "".join(gnode(f"sl-c{i}", 700, y, 280, 100, n, "cyan") for i, (n, y) in enumerate(SHAPES)),
        gnode("sl-hack", 1300, 450, 380, 100, "class Hack", "red"),
        el("sl-err", 1100, 590, 700, None, "✕ class is not allowed to extend sealed class: Shape", "err r"),
        el("sl-sub", 1100, 720, 700, None, "Class con phải là final, sealed, hoặc non-sealed. Record mặc định đã final.", "note left r"),
        wires(*[trace(f"sl-t{i}", [(460, 615), (580, 615), (580, y + 50), (692, y + 50)], "cyan", r=26) for i, (_, y) in enumerate(SHAPES)]),
    ]), beats=[
        ("Phần năm: xi-lờ.", "Phần 5: sealed.",
         [TYPE("#sl-big", 0.1, 0.06), IN("#sl-bsub", "blur", 0.7)]),
        ("Từ khóa xi-lờ cho phép liệt kê chính xác những class nào được kế thừa. Ta đóng hệ phân cấp lại.",
         "sealed liệt kê chính xác những class được kế thừa: hệ phân cấp bị đóng lại.",
         [OUT("#sl-big, #sl-bsub", "zoom"), IN("#sl-hud", "left", 0.2), IN("#sl-code", "up", 0.4), IN("#sl-shape", "pop", 1.6),
          LIGHT("#sl-shape", 1.9), *[DRAW(f"#sl-t{i}-p", 2.1, 0.4) for i in range(3)], IN("#sl-c0, #sl-c1, #sl-c2", "left", 2.4, 0.4, 0.12),
          *[x for i in range(3) for x in (COMET(f"sl-t{i}", 3.0 + i * 0.4, 0.4), LIGHT(f"#sl-c{i}", 3.4 + i * 0.4))]]),
        ("Một class không có trong danh sách permits mà cố implement, là lỗi biên dịch ngay.",
         "Class không có trong permits mà cố implement: lỗi biên dịch ngay.",
         [IN("#sl-hack", "right", 0.3), SHAKE("#sl-hack", 1.4), IN("#sl-err", "up", 1.8)]),
        ("Class con phải là final, xi-lờ, hoặc non xi-lờ. Record mặc định đã là final.",
         "Class con phải là final, sealed, hoặc non-sealed. Record mặc định đã final.",
         [IN("#sl-sub", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ instanceof pattern + switch expression
    dict(id="switch", world=(1920, 1080), hud=hud("sw", "switch hiện đại", "instanceof pattern, switch expression"), cam="".join([
        box("sw-old", 160, 190, 760, 220, win("Cũ") + code("if (obj instanceof String) {\n    String s = (String) obj;\n    ...\n}"), "muted", "code"),
        box("sw-new", 1000, 190, 760, 220, win("Java 16") + code("if (obj instanceof String s\n        && s.length() > 3) {\n    print(s.toUpperCase());   // HELLO\n}"), "green", "code"),
        box("sw-ex", 160, 450, 1100, 330, win("switch expression · Java 14") + code(
            'int hours = switch (day) {\n    case "SAT", "SUN" -> 0;\n    default -> {\n        int h = 8;\n        yield h;\n    }\n};'), "cyan", "code"),
        chip("sw-r1", 1320, 480, 'hours("SAT") = 0', "green"),
        chip("sw-r2", 1320, 560, 'hours("MON") = 8', "green"),
        el("sw-n1", 1320, 650, 460, None, "Trả về giá trị, mũi tên -> không fall-through, gộp nhãn bằng dấu phẩy", "note left r"),
        el("sw-n2", 1320, 770, 460, None, "yield: khi case có nhiều lệnh", "note green left r"),
    ]), beats=[
        ("Phần sáu: switch hiện đại. Bắt đầu với pattern matching cho instanceof: kiểm tra và ép kiểu trong một bước.",
         "Phần 6: switch hiện đại. Pattern matching cho instanceof: kiểm tra và ép kiểu trong một bước.",
         [IN("#sw-hud", "left", 0.1), IN("#sw-old", "left", 0.4), IN("#sw-new", "right", 3.2)]),
        ("Switch expression trả về giá trị. Dùng mũi tên nên không lo quên break, và gộp được nhiều nhãn.",
         "switch expression trả về giá trị. Mũi tên nên không lo quên break; gộp được nhiều nhãn.",
         [IN("#sw-ex", "up", 0.3), IN("#sw-r1", "pop", 2.2), IN("#sw-r2", "pop", 2.8), IN("#sw-n1", "up", 3.6)]),
        ("Khi một case có nhiều lệnh, dùng yield để trả giá trị.", "Case có nhiều lệnh: dùng yield để trả giá trị.",
         [IN("#sw-n2", "up", 0.3), PULSE("#sw-ex", 1.0)]),
    ]),
    # ------------------------------------------------------------ sealed + record + pattern switch
    dict(id="pattern", world=(1920, 1080), hud=hud("pt", "Pattern matching cho switch", "sealed + record + switch, Java 21"), cam="".join([
        box("pt-code", 160, 170, 1600, 350, code(
            "static double area(Shape s) {\n    return switch (s) {\n"
            "        case Circle c -> Math.PI * c.radius() * c.radius();\n        case Square sq -> sq.side() * sq.side();\n"
            "        case Rect(double w, double h) when w == h -> w * w;   // record pattern + when\n"
            "        case Rect(double w, double h) -> w * h;\n    };   // không cần default\n}"), "cyan", "code"),
        chip("pt-r1", 160, 545, "area(new Rect(2, 3)) = 6.0", "green"),
        chip("pt-r2", 700, 545, "area(new Rect(2, 2)) = 4.0", "green"),
        chip("pt-r3", 1240, 545, "area(new Square(3)) = 9.0", "green"),
        box("pt-tri", 160, 635, 1600, 100, code("sealed interface Shape permits Circle, Square, Rect, Triangle {}   // thêm loại mới"), "amber", "code"),
        el("pt-err", 160, 760, 1600, None, "✕ the switch expression does not cover all possible input values", "err r"),
        el("pt-def", 160, 855, 1600, None, "Đừng thêm default: thêm loại mới sẽ âm thầm rơi vào default, mất kiểm tra này", "warnbox r"),
    ]), beats=[
        ("Phần bảy: pattern matching cho switch, ở Java hai mươi mốt. Record pattern tách luôn field, và when thêm điều kiện.",
         "Phần 7: pattern matching cho switch (Java 21). Record pattern tách luôn field; when thêm điều kiện.",
         [IN("#pt-hud", "left", 0.1), IN("#pt-code", "up", 0.4)]),
        ("Chữ nhật hai nhân ba ra sáu. Chữ nhật hai nhân hai ra bốn. Hình vuông cạnh ba ra chín.", "Rect(2, 3) ra 6.0, Rect(2, 2) ra 4.0, Square(3) ra 9.0.",
         [IN("#pt-r1", "pop", 0.3), IN("#pt-r2", "pop", 1.2), IN("#pt-r3", "pop", 2.4)]),
        ("Vì Shape là xi-lờ, compiler biết đủ các loại. Thêm Triangle mà quên xử lý là lỗi biên dịch ngay.",
         "Shape là sealed nên compiler biết đủ các loại. Thêm Triangle mà quên xử lý: lỗi biên dịch ngay.",
         [IN("#pt-tri", "up", 1.6), IN("#pt-err", "up", 3.6), SHAKE("#pt-err", 4.1)]),
        ("Đừng thêm default, vì như vậy loại mới sẽ âm thầm rơi vào default, và mất kiểm tra này.",
         "Đừng thêm default: loại mới sẽ âm thầm rơi vào default, mất kiểm tra này.",
         [IN("#pt-def", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ Sequenced Collections + virtual threads
    dict(id="modern", world=(1920, 1080), hud=hud("md", "Java 21 còn gì", "Sequenced Collections, Virtual Threads"), cam="".join([
        box("md-seq", 160, 190, 1600, 190, code(
            "List.of(1, 2, 3).getFirst();                    // 1\nList.of(1, 2, 3).getLast();                     // 3\n"
            "new ArrayList<>(List.of(1, 2, 3)).reversed();   // [3, 2, 1]"), "cyan", "code"),
        el("md-old", 160, 420, 1600, None, "Trước đó: list.get(list.size() - 1), LinkedHashSet phải duyệt hết iterator: mỗi loại một kiểu", "note left r"),
        el("md-word", 120, 200, 1500, None, "Virtual Threads", "glow r", "font-size:120px;text-align:left;--tone:var(--cyan)"),
        box("md-vt", 120, 400, 1680, 190, code(
            "try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {\n"
            "    for (int i = 0; i < 100_000; i++) ex.submit(() -> { Thread.sleep(1000); return null; });\n"
            "}"), "cyan", "code"),
        el("md-res", 120, 630, 900, None, "100.000 thread, mỗi thread ngủ 1 giây: xong sau 1.6 giây", "stamp green r"),
        chip("md-sb", 120, 760, "Spring Boot 3.2+: spring.threads.virtual.enabled=true", "violet"),
    ]), beats=[
        ("Phần tám: Java hai mươi mốt còn gì? Sequenced Collections cho mọi collection có thứ tự một bộ method chung: lấy đầu, lấy cuối, đảo ngược.",
         "Phần 8: Sequenced Collections. Collection có thứ tự có chung getFirst, getLast, reversed.",
         [IN("#md-hud", "left", 0.1), IN("#md-seq", "up", 0.6), IN("#md-old", "up", 5.2)]),
        ("Và Virtual Threads: thread nhẹ do JVM quản lý, rất hợp cho tác vụ chờ vào ra, như gọi database hay gọi API.",
         "Virtual Threads: thread nhẹ do JVM quản lý, rất hợp cho tác vụ chờ I/O.",
         [OUT("#md-seq, #md-old", "blur", 0, 0.4), IN("#md-word", "glowin", 0.4, 0.9), IN("#md-vt", "up", 1.8)]),
        ("Mình thử một trăm nghìn thread, mỗi thread ngủ một giây. Tất cả xong sau một phẩy sáu giây.",
         "Thử 100.000 virtual thread, mỗi thread ngủ 1 giây: tất cả xong sau 1.6 giây.",
         [IN("#md-res", "pop", 0.6), PULSE("#md-res", 3.2)]),
        ("Spring Boot ba chấm hai trở lên bật bằng một dòng cấu hình. Chi tiết ở tuần ba.",
         "Spring Boot 3.2+ bật bằng một dòng cấu hình. Chi tiết ở tuần 3.",
         [IN("#md-sb", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "record", "DTO, không làm entity"),
                                                ("lock", "sealed", "đóng hệ phân cấp"),
                                                ("split", "pattern switch", "compiler kiểm tra đủ case"),
                                                ("share", "virtual threads", "hợp cho I/O")]),
        chip("ou-next", 760, 650, "Bài tiếp: JVM Memory & GC", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: record cho DTO, nhưng không làm entity. Xi-lờ đóng hệ phân cấp. Pattern matching switch để compiler kiểm tra đủ case. "
         "Và virtual threads rất hợp cho tác vụ chờ vào ra.",
         "record: DTO, không làm entity · sealed: đóng hệ phân cấp · pattern switch: compiler kiểm tra đủ case · virtual threads: hợp cho I/O.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 5.4), IN("#ou-c3", "pop", 8.6)]),
        ("Bài sau: bộ nhớ JVM, và bộ thu gom rác.", "Bài sau: JVM Memory & GC.",
         [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
