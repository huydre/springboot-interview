"""Exception Handling explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Verified outputs (JDK 21 + the order-service lab):
returnInFinally() = 2, swallowed() = 0 with no exception, counter() = 1;
try-with-resources: open A, open B, close B, close A, main: body failed, suppressed B then A;
manual finally close: main: close failed A (body exception lost);
checked exception inside @Transactional commits (1 order, stock 10 -> 8); rollbackFor rolls back (0 orders, stock 10).
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def node(id_, x, y, w, name, tone, small=False):
    """A class in the exception tree."""
    cls = "mono xs" if small else "mono"
    return box(id_, x, y, w, 70 if small else 84, f'<span class="{cls}">{esc(name)}</span>', tone)


def console(id_, x, y, w, lines):
    """Terminal box whose lines (ids <id>-1..n) are revealed one by one with IN(..., "type1")."""
    rows = "".join(f'<i id="{id_}-{i}">{esc(l)}</i>' for i, l in enumerate(lines, 1))
    return el(id_, x, y, w, None, f"<span>console</span>{rows}", "console")


TWR_OUT = ["open A", "open B", "close B", "close A", "main: body failed",
           "suppressed: close failed B", "suppressed: close failed A"]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #3", "eyebrow r"),
        box("hk-code", 560, 240, 800, 300, win("Trap.java") + code(
            "static int f() {\n"
            "    try { return 1; }\n"
            "    finally { return 2; }\n"
            "}\n"
            "// f() = ?"), "cyan", "code"),
        chip("hk-ans", 1400, 380, "f() = 2", "red"),
        chip("hk-p2", 560, 600, "try ném exception? return trong finally nuốt luôn", "red"),
        el("hk-title", 260, 250, 1400, None, letters("Bắt exception sao cho đúng?"), "h1 r"),
        card4("hk-c", 230, 470, 340, 290, 30, [("tree", "Cây exception", "Error · checked · unchecked"),
                                                ("shield", "Checked vs Unchecked", "và @Transactional"),
                                                ("lock", "finally", "luôn chạy, nhưng có bẫy"),
                                                ("plug", "try-with-resources", "không mất lỗi gốc")]),
    ]), beats=[
        ("Hàm này return một trong try, rồi return hai trong finally. Kết quả là bao nhiêu?",
         "Hàm này return 1 trong try, rồi return 2 trong finally. Kết quả là bao nhiêu?",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        ("Kết quả là hai. Khối finally ghi đè giá trị của khối try.", "Là 2. finally ghi đè giá trị của try.",
         [IN("#hk-ans", "pop", 0.3), SHAKE("#hk-ans", 0.9)]),
        ("Tệ hơn, nếu try ném exception, return trong finally còn nuốt mất exception đó.",
         "Tệ hơn: nếu try ném exception, return trong finally còn nuốt mất exception đó.",
         [IN("#hk-p2", "up", 0.6), SHAKE("#hk-p2", 1.6)]),
        ("Hôm nay ta đi qua cây exception, checked và unchecked, các bẫy của khối finally, và cú pháp try with resources.",
         "Hôm nay: cây exception, checked vs unchecked, bẫy của finally, và try-with-resources.",
         [OUT("#hk-eye, #hk-code, #hk-ans, #hk-p2", "blur", 0, 0.45),
          TYPE("#hk-title", 0.4), IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 1.2, 0.55, 0.5)]),
    ]),
    # ------------------------------------------------------------ hierarchy
    dict(id="tree", world=(1920, 1080), hud=hud("tr", "Cây exception", "Chỉ Throwable mới throw được"), cam="".join([
        big_title("tr", "Cây exception", "Error, checked và unchecked"),
        node("tr-t", 810, 190, 300, "Throwable", "violet"),
        node("tr-e", 380, 350, 300, "Error", "red"),
        node("tr-x", 1120, 350, 300, "Exception", "amber"),
        node("tr-oom", 120, 530, 340, "OutOfMemoryError", "red", True),
        node("tr-soe", 490, 530, 340, "StackOverflowError", "red", True),
        node("tr-io", 870, 530, 250, "IOException", "amber", True),
        node("tr-sql", 1150, 530, 250, "SQLException", "amber", True),
        node("tr-rt", 1430, 530, 340, "RuntimeException", "green", True),
        node("tr-npe", 1060, 710, 360, "NullPointerException", "green", True),
        node("tr-iae", 1450, 710, 400, "IllegalArgumentException", "green", True),
        chip("tr-k1", 180, 860, "Error: đừng catch", "red"),
        chip("tr-k2", 560, 860, "Checked: compiler bắt buộc", "amber"),
        chip("tr-k3", 1060, 860, "Unchecked: RuntimeException", "green"),
        wires(arrow("tr-a1", [(960, 274), (530, 346)], "red"), arrow("tr-a2", [(960, 274), (1270, 346)], "amber"),
              arrow("tr-a3", [(530, 434), (290, 526)], "red"), arrow("tr-a4", [(530, 434), (660, 526)], "red"),
              arrow("tr-a5", [(1270, 434), (995, 526)], "amber"), arrow("tr-a6", [(1270, 434), (1275, 526)], "amber"),
              arrow("tr-a7", [(1270, 434), (1600, 526)], "green"),
              arrow("tr-a8", [(1600, 600), (1240, 706)], "green"), arrow("tr-a9", [(1600, 600), (1650, 706)], "green")),
    ]), beats=[
        ("Thứ nhất: cây exception.", "Thứ nhất: cây exception.",
         [TYPE("#tr-big", 0.1, 0.05), IN("#tr-bsub", "blur", 0.8)]),
        ("Mọi thứ throw được đều là con của Throwable. Nó tách làm hai nhánh: Error và Exception.",
         "Mọi thứ throw được đều là con của Throwable. Hai nhánh: Error và Exception.",
         [OUT("#tr-big, #tr-bsub", "zoom"), IN("#tr-hud", "left", 0.2), IN("#tr-t", "pop", 0.5),
          *ARROW("tr-a1", 3.0, 0.5), IN("#tr-e", "up", 3.4), *ARROW("tr-a2", 3.8, 0.5), IN("#tr-x", "up", 4.2)]),
        ("Error là lỗi nghiêm trọng của JVM, như hết bộ nhớ hay tràn stack. Đừng catch nó.",
         "Error là lỗi nghiêm trọng của JVM, như hết bộ nhớ hay tràn stack. Đừng catch nó.",
         [*ARROW("tr-a3", 0.6, 0.4), IN("#tr-oom", "up", 0.9), *ARROW("tr-a4", 1.2, 0.4), IN("#tr-soe", "up", 1.5),
          IN("#tr-k1", "pop", 3.4), PULSE("#tr-e", 3.6)]),
        ("Nhánh Exception là checked: compiler bắt buộc bạn phải catch, hoặc khai báo throws.",
         "Nhánh Exception là checked: compiler bắt buộc phải catch, hoặc khai báo throws.",
         [*ARROW("tr-a5", 0.4, 0.4), IN("#tr-io", "up", 0.7), *ARROW("tr-a6", 0.9, 0.4), IN("#tr-sql", "up", 1.2),
          IN("#tr-k2", "pop", 2.4), PULSE("#tr-x", 2.6)]),
        ("Trừ một nhánh con: Runtime Exception và các con của nó là unchecked, như Null Pointer Exception.",
         "Trừ một nhánh: RuntimeException và các con của nó là unchecked, như NullPointerException.",
         [*ARROW("tr-a7", 0.4, 0.5), IN("#tr-rt", "pop", 0.9), *ARROW("tr-a8", 2.2, 0.4), IN("#tr-npe", "up", 2.5),
          *ARROW("tr-a9", 2.7, 0.4), IN("#tr-iae", "up", 3.0), IN("#tr-k3", "pop", 3.6)]),
    ]),
    # ------------------------------------------------------------ checked vs unchecked
    dict(id="checked", world=(1920, 1080), hud=hud("ck", "Checked vs Unchecked", "Dự án Spring nên dùng loại nào?"), cam="".join([
        big_title("ck", "Checked vs Unchecked", "Dự án Spring nên dùng loại nào?"),
        box("ck-c1", 260, 330, 620, 200, '<b>Checked</b><small>lỗi bên ngoài, phục hồi được: file, mạng</small>', "amber", "card"),
        box("ck-c2", 1040, 330, 620, 200, '<b>Unchecked</b><small>lỗi lập trình, vi phạm nghiệp vụ</small>', "green", "card"),
        box("ck-bad", 140, 190, 820, 200, win("lambda + checked") + code(
            "paths.stream()\n    .map(p -> Files.readString(p))\n    .toList();"), "red", "code"),
        el("ck-err", 140, 404, 820, None, "✕ unreported exception IOException; must be caught or declared to be thrown", "err r"),
        box("ck-fix", 140, 520, 820, 300, win("bọc thành unchecked") + code(
            ".map(p -> {\n    try { return Files.readString(p); }\n    catch (IOException e) {\n"
            "        throw new UncheckedIOException(e); }\n})"), "green", "code"),
        box("ck-tx", 1040, 190, 760, 330, win("@Transactional checkout()"), "cyan", "panel"),
        chip("ck-s1", 1080, 270, "save(order)", "cyan"),
        chip("ck-s2", 1080, 345, "kho: 10 → 8", "cyan"),
        chip("ck-s3", 1080, 420, "charge() ✕ checked exception", "red"),
        el("ck-commit", 1040, 545, 760, None, "→ COMMIT: đơn chưa trả tiền vẫn lưu, kho còn 8", "note red left r"),
        chip("ck-fix2", 1040, 620, "rollbackFor = PaymentFailedException.class", "green"),
        el("ck-rb", 1040, 700, 760, None, "→ rollback: 0 đơn, kho vẫn 10", "note green left r"),
        el("ck-t1", 0, 400, 1920, None, letters("Exception nghiệp vụ: extends RuntimeException"), "take r"),
    ]), beats=[
        ("Phần hai: checked hay unchecked?", "Phần 2: checked hay unchecked?",
         [TYPE("#ck-big", 0.1, 0.04), IN("#ck-bsub", "blur", 0.9)]),
        ("Checked dành cho lỗi bên ngoài có thể phục hồi, như đọc file hay mất mạng. Unchecked dành cho lỗi lập trình và vi phạm nghiệp vụ.",
         "Checked: lỗi bên ngoài có thể phục hồi (đọc file, mất mạng). Unchecked: lỗi lập trình và vi phạm nghiệp vụ.",
         [OUT("#ck-big, #ck-bsub", "zoom"), IN("#ck-hud", "left", 0.2), IN("#ck-c1", "left", 0.5), IN("#ck-c2", "right", 4.0)]),
        ("Nhưng checked không dùng được trong lambda: readString ném IOException, mà Function không khai báo throws.",
         "Nhưng checked không dùng được trong lambda: readString ném IOException, mà Function không khai báo throws.",
         [OUT("#ck-c1, #ck-c2", "blur", 0, 0.4), IN("#ck-bad", "left", 0.5), IN("#ck-err", "up", 2.4), SHAKE("#ck-err", 2.9)]),
        ("Phải bọc nó lại thành một exception unchecked, tên là Unchecked IO Exception.", "Phải bọc lại thành UncheckedIOException.",
         [IN("#ck-fix", "up", 0.2)]),
        ("Quan trọng hơn: Transactional mặc định chỉ rollback với unchecked. Ném checked exception thì transaction vẫn commit.",
         "Quan trọng hơn: @Transactional mặc định chỉ rollback với unchecked. Ném checked thì transaction vẫn commit.",
         [DIM("#ck-bad, #ck-err, #ck-fix", 0, 0.25), IN("#ck-tx", "blur", 0.3), IN("#ck-s1", "left", 1.0),
          IN("#ck-s2", "left", 1.5), IN("#ck-s3", "pop", 2.8), SHAKE("#ck-s3", 3.3)]),
        ("Lab của ta chạy thật: đơn chưa thanh toán vẫn được lưu, kho bị trừ từ mười xuống tám. Thêm rollbackFor thì mới rollback.",
         "Lab chạy thật: đơn chưa thanh toán vẫn được lưu, kho bị trừ 10 → 8. Thêm rollbackFor thì mới rollback.",
         [IN("#ck-commit", "up", 0.3), PULSE("#ck-s2", 1.6), IN("#ck-fix2", "pop", 4.2), IN("#ck-rb", "up", 4.8)]),
        ("Vì vậy exception nghiệp vụ trong dự án Spring nên extends RuntimeException.",
         "Vì vậy exception nghiệp vụ trong dự án Spring nên extends RuntimeException.",
         [DIM("#ck-bad, #ck-err, #ck-fix, #ck-tx, #ck-s1, #ck-s2, #ck-s3, #ck-commit, #ck-fix2, #ck-rb", 0, 0.07),
          TYPE("#ck-t1", 0.4, 0.03)]),
    ]),
    # ------------------------------------------------------------ finally traps
    dict(id="finally", world=(1920, 1080), hud=hud("fn", "try · catch · finally", "finally luôn chạy, nhưng có bẫy"), cam="".join([
        big_title("fn", "finally", "Luôn chạy, nhưng có thể nói dối"),
        chip("fn-f1", 260, 210, "try", "cyan"), chip("fn-f2", 520, 210, "catch", "amber"), chip("fn-f3", 820, 210, "finally", "violet"),
        el("fn-note", 1100, 218, 760, None, "luôn chạy, trừ System.exit() hoặc JVM sập", "note left r"),
        box("fn-c1", 120, 340, 540, 240, win("returnInFinally()") + code("try { return 1; }\nfinally { return 2; }"), "cyan", "code"),
        box("fn-c2", 690, 340, 540, 240, win("swallowed()") + code("try { throw new\n    IllegalStateException(); }\nfinally { return 0; }"), "cyan", "code"),
        box("fn-c3", 1260, 340, 540, 240, win("counter()") + code("int x = 1;\ntry { return x; }\nfinally { x = 99; }"), "cyan", "code"),
        chip("fn-r1", 140, 610, "→ 2: finally ghi đè", "red"),
        chip("fn-r2", 710, 610, "→ 0, exception biến mất", "red"),
        chip("fn-r3", 1280, 610, "→ 1: giá trị đã chốt", "green"),
        el("fn-t1", 0, 400, 1920, None, letters("Không return, không throw trong finally"), "take r"),
        el("fn-t2", 0, 540, 1920, None, "finally chỉ để dọn tài nguyên, mà việc đó đã có try-with-resources", "take-sm r"),
        wires(arrow("fn-a1", [(352, 238), (510, 238)], "muted"), arrow("fn-a2", [(660, 238), (810, 238)], "muted")),
    ]), beats=[
        ("Phần ba: các bẫy của finally.", "Phần 3: các bẫy của finally.",
         [TYPE("#fn-big", 0.1, 0.06), IN("#fn-bsub", "blur", 0.8)]),
        ("Finally luôn chạy sau try và catch, kể cả khi có return hay exception. Chỉ trừ khi gọi System exit, hoặc JVM sập.",
         "finally luôn chạy sau try và catch, kể cả khi có return hay exception. Chỉ trừ System.exit() hoặc JVM sập.",
         [OUT("#fn-big, #fn-bsub", "zoom"), IN("#fn-hud", "left", 0.2), IN("#fn-f1", "pop", 0.5), *ARROW("fn-a1", 0.8, 0.3),
          IN("#fn-f2", "pop", 1.1), *ARROW("fn-a2", 1.4, 0.3), IN("#fn-f3", "pop", 1.7), PULSE("#fn-f3", 2.4), IN("#fn-note", "up", 4.4)]),
        ("Bẫy thứ nhất: return trong khối finally ghi đè giá trị return của khối try.", "Bẫy 1: return trong finally ghi đè giá trị return của try.",
         [IN("#fn-c1", "up", 0.3), IN("#fn-r1", "pop", 2.6)]),
        ("Bẫy thứ hai: nếu khối try ném exception, return trong finally nuốt mất nó. Bên gọi nhận số không như không có gì xảy ra.",
         "Bẫy 2: try ném exception, return trong finally nuốt mất nó. Bên gọi nhận 0 như không có gì xảy ra.",
         [IN("#fn-c2", "up", 0.3), IN("#fn-r2", "pop", 3.0), SHAKE("#fn-r2", 3.6)]),
        ("Còn sửa biến trong finally thì không đổi được giá trị đã return. Kết quả vẫn là một.",
         "Còn sửa biến trong finally không đổi được giá trị đã return. Kết quả vẫn là 1.",
         [IN("#fn-c3", "up", 0.3), IN("#fn-r3", "pop", 3.4)]),
        ("Quy tắc: không bao giờ return hay throw trong finally.", "Quy tắc: không bao giờ return hay throw trong finally.",
         [DIM("#fn-f1, #fn-f2, #fn-f3, #fn-note, #fn-a1, #fn-a2, #fn-c1, #fn-c2, #fn-c3, #fn-r1, #fn-r2, #fn-r3", 0, 0.07),
          TYPE("#fn-t1", 0.3, 0.03), IN("#fn-t2", "blur", 2.0)]),
    ]),
    # ------------------------------------------------------------ try-with-resources
    dict(id="twr", world=(1920, 1080), hud=hud("tw", "try-with-resources", "Tự close, không mất lỗi gốc"), cam="".join([
        big_title("tw", "try-with-resources", "Tự close, và không mất lỗi gốc"),
        box("tw-code", 140, 190, 820, 300, win("Main.java") + code(
            'try (Res a = new Res("A");\n     Res b = new Res("B")) {\n'
            '    throw new RuntimeException("body failed");\n}  // close() cũng ném lỗi'), "cyan", "code"),
        console("tw-con", 1040, 190, 740, TWR_OUT),
        chip("tw-k1", 1040, 620, "đóng ngược thứ tự mở", "violet"),
        box("tw-bad", 140, 560, 820, 200, win("tự close trong finally") + code(
            'try { body(); }        // ném "body failed"\nfinally { a.close(); } // ném "close failed A"'), "red", "code"),
        el("tw-br", 1040, 700, 740, None, "→ main: close failed A · lỗi gốc mất", "note red left r"),
    ]), beats=[
        ("Phần bốn: cú pháp try with resources.", "Phần 4: try-with-resources.",
         [TYPE("#tw-big", 0.1, 0.04), IN("#tw-bsub", "blur", 0.9)]),
        ("Mọi resource implement AutoCloseable khai báo trong try sẽ tự động được close, kể cả khi có exception.",
         "Mọi resource implement AutoCloseable khai báo trong try (...) tự động được close, kể cả khi có exception.",
         [OUT("#tw-big, #tw-bsub", "zoom"), IN("#tw-hud", "left", 0.2), IN("#tw-code", "left", 0.4), IN("#tw-con", "right", 1.6),
          IN("#tw-con-1", "type1", 3.0, 0.3), IN("#tw-con-2", "type1", 3.6, 0.3)]),
        ("Nhiều resource thì đóng theo thứ tự ngược lại: mở A rồi B, đóng B rồi A.",
         "Nhiều resource đóng theo thứ tự ngược lại: mở A rồi B, đóng B rồi A.",
         [IN("#tw-con-3", "type1", 2.0, 0.3), IN("#tw-con-4", "type1", 2.6, 0.3), IN("#tw-k1", "pop", 3.2)]),
        ("Nếu cả thân try và close đều lỗi, lỗi của thân try là lỗi chính. Lỗi lúc close được gắn vào dạng suppressed, không bị mất.",
         "Thân try và close() đều lỗi? Lỗi của thân try là lỗi chính, lỗi lúc close gắn vào dạng suppressed, không bị mất.",
         [IN("#tw-con-5", "type1", 1.4, 0.3), PULSE("#tw-con-5", 2.0), IN("#tw-con-6", "type1", 4.0, 0.3), IN("#tw-con-7", "type1", 4.6, 0.3)]),
        ("Còn tự close trong finally thì lỗi lúc close đè mất lỗi gốc. Rất khó debug.",
         "Còn tự close() trong finally thì lỗi lúc close đè mất lỗi gốc. Rất khó debug.",
         [IN("#tw-bad", "up", 0.3), IN("#tw-br", "up", 2.0), SHAKE("#tw-br", 2.6)]),
    ]),
    # ------------------------------------------------------------ custom exceptions in Spring
    dict(id="custom", world=(1920, 1080), hud=hud("cu", "Exception trong dự án Spring", "Ném ở service, xử lý tập trung"), cam="".join([
        big_title("cu", "Custom exception", "Thiết kế cho dự án Spring"),
        box("cu-base", 160, 200, 760, 110, '<span class="mono big">BusinessException</span><span class="mono small">extends RuntimeException · errorCode</span>', "violet", "col"),
        node("cu-nf", 120, 400, 400, "ResourceNotFoundException", "violet", True),
        node("cu-ib", 550, 400, 450, "InsufficientBalanceException", "violet", True),
        box("cu-svc", 160, 600, 560, 84, '<span class="mono">OrderService · throw</span>', "amber"),
        box("cu-adv", 1060, 200, 720, 260, win("@RestControllerAdvice") + code(
            "ResourceNotFoundException -> 404\nBusinessException         -> 422\nException                 -> 500"), "cyan", "code"),
        chip("cu-res", 1060, 500, "HTTP 404 · {\"code\": \"NOT_FOUND\"}", "green"),
        box("cu-c1", 260, 260, 1400, 160, code('catch (IOException e) {\n    throw new PaymentFailedException("Gọi cổng thanh toán thất bại", e); }'), "green", "code"),
        el("cu-cause", 260, 450, 1400, None, "log: Caused by: java.io.IOException: timeout · còn stack trace gốc", "note green r"),
        chip("cu-ap1", 160, 600, "catch (Exception e) {}", "red"),
        chip("cu-ap2", 640, 600, "catch Exception ở tầng giữa", "red"),
        chip("cu-ap3", 1200, 600, "log rồi ném lại ở mọi tầng", "red"),
        chip("cu-good", 560, 720, "log một lần ở tầng ngoài cùng, kèm traceId", "green"),
        wires(arrow("cu-a1", [(540, 310), (320, 396)], "violet"), arrow("cu-a2", [(540, 310), (775, 396)], "violet"),
              arrow("cu-a3", [(720, 642), (1030, 642), (1030, 340), (1052, 330)], "amber")),
    ]), beats=[
        ("Phần cuối: thiết kế exception trong dự án Spring.", "Phần 5: thiết kế exception trong dự án Spring.",
         [TYPE("#cu-big", 0.1, 0.05), IN("#cu-bsub", "blur", 1.0)]),
        ("Mẫu phổ biến: một exception gốc BusinessException kế thừa RuntimeException, mang mã lỗi, và các lớp con cụ thể.",
         "Mẫu phổ biến: BusinessException gốc kế thừa RuntimeException, mang mã lỗi, và các lớp con cụ thể.",
         [OUT("#cu-big, #cu-bsub", "zoom"), IN("#cu-hud", "left", 0.2), IN("#cu-base", "down", 0.5),
          *ARROW("cu-a1", 3.6, 0.4), IN("#cu-nf", "up", 3.9), *ARROW("cu-a2", 4.2, 0.4), IN("#cu-ib", "up", 4.5)]),
        ("Service chỉ ném exception. Một RestControllerAdvice bắt tập trung, và map sang HTTP status: không tìm thấy là bốn trăm lẻ bốn.",
         "Service chỉ ném. @RestControllerAdvice bắt tập trung và map sang HTTP status: không tìm thấy → 404.",
         [IN("#cu-svc", "left", 0.2), *ARROW("cu-a3", 1.0, 0.7), IN("#cu-adv", "right", 1.6), IN("#cu-res", "pop", 5.2)]),
        ("Khi bọc một exception kỹ thuật, luôn truyền exception gốc làm nguyên nhân, để log còn dòng caused by.",
         "Khi bọc exception kỹ thuật, luôn truyền exception gốc làm cause, để log còn dòng \"Caused by\".",
         [OUT("#cu-base, #cu-nf, #cu-ib, #cu-svc, #cu-adv, #cu-res, #cu-a1, #cu-a2, #cu-a3", "blur", 0, 0.45),
          IN("#cu-c1", "up", 0.6), IN("#cu-cause", "up", 3.2)]),
        ("Và tránh các anti pattern: nuốt exception, catch Exception ở tầng giữa, hay log rồi ném lại ở mọi tầng. Chỉ log một lần ở tầng ngoài cùng.",
         "Tránh: nuốt exception, catch Exception ở tầng giữa, log rồi ném lại ở mọi tầng. Chỉ log một lần ở tầng ngoài cùng.",
         [IN("#cu-ap1", "pop", 1.4), IN("#cu-ap2", "pop", 2.8), IN("#cu-ap3", "pop", 4.4), IN("#cu-good", "up", 6.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 150, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 300, 340, 280, 30, [("tree", "Cây exception", "Error · checked · unchecked"),
                                                ("shield", "Nghiệp vụ", "extends RuntimeException"),
                                                ("lock", "finally", "không return, không throw"),
                                                ("plug", "try-with-resources", "lỗi close thành suppressed")]),
        chip("ou-next", 660, 660, "Bài tiếp: HashMap Internals", "violet"),
        el("ou-cta", 0, 790, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: đừng catch Error. Exception nghiệp vụ nên là unchecked. Không return trong finally. Và dùng try with resources để không mất lỗi gốc.",
         "Đừng catch Error · nghiệp vụ dùng unchecked · không return trong finally · try-with-resources để không mất lỗi gốc.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 2.4), IN("#ou-c2", "pop", 4.8), IN("#ou-c3", "pop", 6.8)]),
        ("Bài sau ta sẽ mở bên trong HashMap: bucket, va chạm, và cách nó tự mở rộng.",
         "Bài sau: bên trong HashMap. Bucket, collision, và cách nó tự mở rộng.",
         [IN("#ou-next", "pop", 0.4)]),
        ("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.", "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
