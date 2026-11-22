"""equals, hashCode & String explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every Java output shown here was run on JDK 21 (see the lesson's verification notes):
127 == 127 true, 128 == 128 false, HashSet without hashCode size=2 contains=false,
with Objects.hash size=1 and bucket 0 (capacity 16), "a"+"b" == "ab" true, a+"b" == "ab" false.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def bucket(id_, x, y, w, h, n):
    return box(id_, x, y, w, h, f'<span class="mono xs">{n}</span>', "muted", "bucket")


def mini(id_, x, y, w, text, tone="amber"):
    """Small entry card inside a bucket; entries may slide onto each other when they merge."""
    return el(id_, x, y, w, 46, f'<span class="mono xs">{esc(text)}</span>', f"gbox {tone} r", attrs=" data-layout-allow-overlap")


def var(id_, x, y, w, name, ref, tone="cyan", ref_tone="cyan"):
    """A stack variable row: name on the left, the reference it holds as a chip on the right."""
    return box(id_, x, y, w, 84, f'<span class="mono">{esc(name)}</span><span class="chip {ref_tone}" style="opacity:1">{esc(ref)}</span>',
               tone, "row")


CACHE_TILES = ["-128", "-127", "…", "0", "1", "…", "126", "127"]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Java #2", "eyebrow r"),
        box("hk-code", 560, 240, 800, 270, win("Main.java") + code(
            "Integer x = 127, y = 127;\n"
            "Integer m = 128, n = 128;\n"
            "System.out.println(x == y);\n"
            "System.out.println(m == n);"), "cyan", "code"),
        el("hk-o1", 1390, 402, 260, None, "→ true", "note green left r"),
        el("hk-o2", 1390, 441, 260, None, "→ false", "note red left r"),
        chip("hk-p1", 420, 620, "test: id nhỏ ✓", "green"),
        chip("hk-p2", 1000, 620, "production: id > 127 ✕", "red"),
        wires(arrow("hk-a1", [(720, 648), (980, 648)], "muted")),
        el("hk-title", 260, 250, 1400, None, letters("Bằng nhau hay không bằng nhau?"), "h1 r"),
        card4("hk-c", 230, 470, 340, 290, 30, [("eq", "== vs equals()", "so địa chỉ hay nội dung"),
                                                ("grid", "Integer cache", "-128 … 127"),
                                                ("hash", "equals + hashCode", "contract bắt buộc"),
                                                ("quote", "String pool", "immutable")]),
    ]), beats=[
        ("Hai biến Integer cùng bằng một trăm hai mươi tám. So sánh bằng hai dấu bằng, kết quả lại là false.",
         "Hai Integer cùng bằng 128. So sánh bằng ==, kết quả lại là false.",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8), IN("#hk-o2", "pop", 3.4), SHAKE("#hk-o2", 3.9)]),
        ("Nhưng với một trăm hai mươi bảy thì lại là true.", "Nhưng với 127 thì lại là true.",
         [IN("#hk-o1", "pop", 0.9), PULSE("#hk-o1", 1.5)]),
        ("Lỗi này chạy đúng khi test với id nhỏ, rồi sai trên production khi id lớn hơn một trăm hai mươi bảy.",
         "Lỗi này chạy đúng khi test với id nhỏ, rồi sai trên production khi id > 127.",
         [IN("#hk-p1", "left", 0.3), *ARROW("hk-a1", 1.4, 0.6), IN("#hk-p2", "pop", 2.4), SHAKE("#hk-p2", 3.2)]),
        ("Hôm nay ta gỡ từng bẫy: hai dấu bằng và equals, Integer cache, hashCode, và String pool.",
         "Hôm nay ta gỡ từng bẫy: == và equals, Integer cache, hashCode, String pool.",
         [OUT("#hk-eye, #hk-code, #hk-o1, #hk-o2, #hk-p1, #hk-p2, #hk-a1", "blur", 0, 0.45),
          TYPE("#hk-title", 0.4), IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 1.2, 0.55, 0.5)]),
    ]),
    # ------------------------------------------------------------ == vs equals
    dict(id="eq", world=(1920, 1080), hud=hud("eq", "== và equals()", "So địa chỉ hay so nội dung"), cam="".join([
        big_title("eq", "== và equals()", "So địa chỉ hay so nội dung?"),
        el("eq-stk", 160, 220, 560, 600, "<span>STACK</span>", "mempanel r"),
        el("eq-hp", 860, 220, 900, 600, "<span>HEAP</span>", "mempanel r"),
        box("eq-i", 200, 280, 480, 84, '<span class="mono">int i</span><span class="num">5</span>', "cyan", "row"),
        box("eq-j", 200, 390, 480, 84, '<span class="mono">int j</span><span class="num">5</span>', "cyan", "row"),
        el("eq-r1", 200, 500, 480, None, "i == j → true: so con số", "note green r"),
        var("eq-a", 200, 300, 480, "String a", "@1"),
        var("eq-b", 200, 440, 480, "String b", "@2"),
        box("eq-o1", 1000, 290, 560, 100, '<span class="mono">"java"</span><span class="mono small">@1</span>', "green", "row"),
        box("eq-o2", 1000, 450, 560, 100, '<span class="mono">"java"</span><span class="mono small">@2</span>', "green", "row"),
        chip("eq-r2", 230, 600, "a == b → false", "red"),
        el("eq-cmp", 1300, 398, 300, None, "so nội dung", "lbl r"),
        chip("eq-r3", 1100, 620, "a.equals(b) → true", "green"),
        el("eq-t1", 0, 400, 1920, None, letters("Không override equals ⇒ equals chính là =="), "take r"),
        el("eq-t2", 0, 540, 1920, None, "Object.equals() mặc định so địa chỉ", "take-sm r"),
        wires(arrow("eq-a1", [(680, 342), (992, 340)], "cyan"),
              arrow("eq-a2", [(680, 482), (992, 500)], "cyan"),
              arrow("eq-a3", [(1280, 392), (1280, 446)], "green", True, head=False)),
    ]), beats=[
        ("Thứ nhất: hai dấu bằng khác equals thế nào?", "Thứ nhất: == khác equals() thế nào?",
         [TYPE("#eq-big", 0.1, 0.05), IN("#eq-bsub", "blur", 1.0)]),
        ("Hai dấu bằng so sánh giá trị nằm trong biến. Với kiểu int, giá trị đó là con số.",
         "== so sánh giá trị nằm trong biến. Với int, giá trị đó là con số.",
         [OUT("#eq-big, #eq-bsub", "zoom"), IN("#eq-hud", "left", 0.2), IN("#eq-stk, #eq-hp", "blur", 0.3, 0.6, 0.15),
          IN("#eq-i", "left", 1.0), IN("#eq-j", "left", 1.4), IN("#eq-r1", "up", 2.6)]),
        ("Với object, giá trị trong biến là địa chỉ. Hai lần new String tạo ra hai object khác nhau trên heap.",
         "Với object, giá trị trong biến là địa chỉ. Hai lần new String tạo hai object khác nhau trên heap.",
         [OUT("#eq-i, #eq-j, #eq-r1", "fade", 0, 0.35), IN("#eq-a", "left", 0.5), IN("#eq-b", "left", 0.8),
          IN("#eq-o1", "pop", 2.2), *ARROW("eq-a1", 2.5, 0.5), IN("#eq-o2", "pop", 3.1), *ARROW("eq-a2", 3.4, 0.5)]),
        ("Nên a hai dấu bằng b là false, vì hai địa chỉ khác nhau.", "Nên a == b là false, vì hai địa chỉ khác nhau.",
         [PULSE("#eq-a .chip, #eq-b .chip", 0.6), IN("#eq-r2", "pop", 1.2), SHAKE("#eq-r2", 1.7)]),
        ("Còn equals so sánh nội dung, theo cách class định nghĩa. String đã override equals, nên kết quả là true.",
         "Còn equals() so sánh nội dung, theo cách class định nghĩa. String đã override equals, nên kết quả là true.",
         [DRAW("#eq-a3-p", 0.6, 0.4), IN("#eq-cmp", "blur", 0.8), IN("#eq-r3", "pop", 4.2), PULSE("#eq-o1, #eq-o2", 4.4)]),
        ("Nếu class không override, equals mặc định của Object chính là hai dấu bằng.",
         "Nếu class không override, equals() mặc định của Object chính là ==.",
         [DIM("#eq-stk, #eq-hp, #eq-a, #eq-b, #eq-o1, #eq-o2, #eq-r2, #eq-r3, #eq-cmp, #eq-a1, #eq-a2, #eq-a3", 0, 0.07),
          TYPE("#eq-t1", 0.4, 0.03), IN("#eq-t2", "blur", 2.0)]),
    ]),
    # ------------------------------------------------------------ Integer cache
    dict(id="cache", world=(1920, 1080), hud=hud("ca", "Integer cache", "-128 đến 127 dùng chung object"), cam="".join([
        big_title("ca", "Integer cache", "Vì sao 127 bằng mà 128 lại không?"),
        box("ca-code", 240, 180, 1000, 84, code("Integer x = 127;   // thực chất: Integer.valueOf(127)"), "amber", "code"),
        box("ca-panel", 260, 300, 1400, 200, win("IntegerCache: object tạo sẵn cho -128 … 127"), "violet", "panel"),
        "".join(box(f"ca-k{i}", 300 + i * 165, 380, 145, 80, f'<span class="mono">{esc(v)}</span>', "violet")
                for i, v in enumerate(CACHE_TILES)),
        box("ca-x", 1000, 640, 260, 84, '<span class="mono">Integer x</span>', "cyan"),
        box("ca-y", 1320, 640, 260, 84, '<span class="mono">Integer y</span>', "cyan"),
        el("ca-r1", 1000, 750, 580, None, "x == y → true: cùng một object", "note green r"),
        box("ca-m", 1000, 560, 260, 84, '<span class="mono">Integer m</span>', "cyan"),
        box("ca-n", 1320, 560, 260, 84, '<span class="mono">Integer n</span>', "cyan"),
        box("ca-o1", 1000, 720, 260, 84, '<span class="mono">128 · @5</span>', "red"),
        box("ca-o2", 1320, 720, 260, 84, '<span class="mono">128 · @6</span>', "red"),
        el("ca-r2", 260, 600, 640, None, "m == n → false ✕", "note red left r"),
        el("ca-r3", 260, 650, 640, None, "m.equals(n) → true ✓", "note green left r"),
        el("ca-t1", 0, 400, 1920, None, letters("So sánh wrapper bằng equals()"), "take r"),
        el("ca-t2", 0, 540, 1920, None, "Long id lấy từ DB: id1 == id2 sai khi id > 127", "take-sm r"),
        wires(arrow("ca-ax", [(1130, 636), (1470, 470)], "cyan"), arrow("ca-ay", [(1450, 636), (1530, 470)], "cyan"),
              arrow("ca-am", [(1130, 648), (1130, 714)], "red"), arrow("ca-an", [(1450, 648), (1450, 714)], "red")),
    ]), beats=[
        ("Bẫy thứ hai: Integer cache.", "Bẫy thứ hai: Integer cache.",
         [TYPE("#ca-big", 0.1, 0.05), IN("#ca-bsub", "blur", 0.9)]),
        ("Viết Integer x bằng một trăm hai mươi bảy, thực chất Java gọi Integer chấm valueOf.",
         "Viết Integer x = 127, thực chất Java gọi Integer.valueOf(127).",
         [OUT("#ca-big, #ca-bsub", "zoom"), IN("#ca-hud", "left", 0.2), IN("#ca-code", "up", 0.5)]),
        ("Hàm này trả về object có sẵn trong cache cho các giá trị từ âm một trăm hai mươi tám đến một trăm hai mươi bảy.",
         "Hàm này trả về object có sẵn trong cache cho các giá trị từ -128 đến 127.",
         [IN("#ca-panel", "blur", 0.2, 0.6), IN(", ".join(f"#ca-k{i}" for i in range(8)), "pop", 0.8, 0.4, 0.12),
          PULSE("#ca-k0", 4.2), PULSE("#ca-k7", 5.2)]),
        ("Nên x và y cùng trỏ vào một object, và hai dấu bằng cho true.", "Nên x và y cùng trỏ vào một object, == cho true.",
         [IN("#ca-x", "up", 0.2), IN("#ca-y", "up", 0.4), *ARROW("ca-ax", 0.8, 0.6), *ARROW("ca-ay", 1.0, 0.6),
          PULSE("#ca-k7", 1.8), IN("#ca-r1", "up", 2.2)]),
        ("Từ một trăm hai mươi tám trở đi, mỗi lần gọi tạo một object mới. Nên m hai dấu bằng n là false, dù equals vẫn true.",
         "Từ 128 trở đi, mỗi lần gọi tạo một object mới. m == n là false, dù equals vẫn true.",
         [OUT("#ca-x, #ca-y, #ca-ax, #ca-ay, #ca-r1", "fade", 0, 0.35), DIM("#ca-panel, " + ", ".join(f"#ca-k{i}" for i in range(8)), 0.2, 0.3),
          IN("#ca-m", "up", 0.6), IN("#ca-n", "up", 0.8), IN("#ca-o1", "pop", 1.6), *ARROW("ca-am", 1.8, 0.35),
          IN("#ca-o2", "pop", 2.1), *ARROW("ca-an", 2.3, 0.35), IN("#ca-r2", "left", 3.4), SHAKE("#ca-r2", 3.9), IN("#ca-r3", "left", 5.4)]),
        ("Bug thật hay gặp: so sánh hai Long id lấy từ database bằng hai dấu bằng. Luôn dùng equals, hoặc Objects chấm equals.",
         "Bug thật: so sánh hai Long id lấy từ database bằng ==. Luôn dùng equals() hoặc Objects.equals().",
         [OUT("#ca-panel, " + ", ".join(f"#ca-k{i}" for i in range(8)), "fade", 0, 0.5),
          DIM("#ca-code, #ca-m, #ca-n, #ca-o1, #ca-o2, #ca-am, #ca-an, #ca-r2, #ca-r3", 0, 0.07),
          IN("#ca-t2", "blur", 0.4), TYPE("#ca-t1", 3.0, 0.03)]),
    ]),
    # ------------------------------------------------------------ equals / hashCode contract
    dict(id="contract", world=(1920, 1080), hud=hud("ct", "Contract equals ↔ hashCode", "HashSet tìm phần tử qua 2 bước"), cam="".join([
        big_title("ct", "equals + hashCode", "Hai method luôn phải đi cùng nhau"),
        box("ct-key", 260, 220, 420, 96, '<span class="mono">User("an@x.com")</span>', "amber"),
        el("ct-s1", 760, 236, None, None, "① hashCode() → chọn bucket", "stamp cyan r"),
        el("ct-s2", 1300, 236, None, None, "② equals() trong bucket", "stamp violet r"),
        el("ct-set", 1070, 430, 600, None, "HashSet · 16 bucket (vẽ 8)", "lbl r", "text-align:right"),
        "".join(bucket(f"ct-b{i}", 260 + i * 180, 480, 150, 300, i) for i in range(8)),
        mini("ct-e1", 268, 540, 134, "bo@x.com"),
        mini("ct-e2", 268, 600, 134, "an@x.com"),
        el("ct-ok", 260, 664, 150, None, "equals ✓", "note green r"),
        el("ct-t1", 0, 380, 1920, None, letters("a.equals(b) ⇒ cùng hashCode()"), "take r"),
        el("ct-t2", 0, 520, 1920, None, "hashCode trùng nhưng không equals: chỉ là collision, chậm chứ không sai", "take-sm r"),
        wires(arrow("ct-a1", [(400, 316), (400, 400), (335, 420), (335, 474)], "cyan")),
    ]), beats=[
        ("Phần ba: contract giữa equals và hashCode.", "Phần 3: contract giữa equals() và hashCode().",
         [TYPE("#ct-big", 0.1, 0.05), IN("#ct-bsub", "blur", 1.0)]),
        ("HashSet và HashMap tìm một phần tử qua hai bước.", "HashSet và HashMap tìm một phần tử qua hai bước.",
         [OUT("#ct-big, #ct-bsub", "zoom"), IN("#ct-hud", "left", 0.2), IN("#ct-set", "blur", 0.4),
          IN(", ".join(f"#ct-b{i}" for i in range(8)), "up", 0.5, 0.45, 0.08), IN("#ct-key", "down", 1.6)]),
        ("Bước một: hashCode quyết định phần tử nằm ở bucket nào.", "Bước 1: hashCode() quyết định phần tử nằm ở bucket nào.",
         [IN("#ct-s1", "stamp", 0.2, 0.45), *ARROW("ct-a1", 1.0, 0.8), PULSE("#ct-b0", 1.9), IN("#ct-e1, #ct-e2", "pop", 2.2, 0.4, 0.15)]),
        ("Bước hai: trong bucket đó, equals tìm đúng phần tử.", "Bước 2: trong bucket đó, equals() tìm đúng phần tử.",
         [IN("#ct-s2", "stamp", 0.2, 0.45), PULSE("#ct-e1", 1.2), DIM("#ct-e1", 1.6, 0.35), PULSE("#ct-e2", 1.9), IN("#ct-ok", "up", 2.3)]),
        ("Vì vậy có một quy tắc bắt buộc: hai object equals nhau thì phải có cùng hashCode.",
         "Quy tắc bắt buộc: hai object equals nhau thì phải có cùng hashCode.",
         [DIM("#ct-key, #ct-s1, #ct-s2, #ct-set, #ct-a1, #ct-e1, #ct-e2, #ct-ok, " + ", ".join(f"#ct-b{i}" for i in range(8)), 0, 0.07),
          TYPE("#ct-t1", 0.4, 0.035)]),
        ("Ngược lại, hashCode trùng nhau mà không equals chỉ là va chạm. Nó làm chậm, chứ không làm sai.",
         "Ngược lại, hashCode trùng mà không equals chỉ là collision: làm chậm, chứ không làm sai.",
         [IN("#ct-t2", "blur", 0.4)]),
    ]),
    # ------------------------------------------------------------ forgetting hashCode
    dict(id="nohash", world=(1920, 1080), hud=hud("nh", "Quên hashCode", "Bug kinh điển với HashSet"), cam="".join([
        box("nh-code", 160, 190, 760, 500, win("UserNoHash.java") + code(
            "class UserNoHash {\n"
            "    private final String email;\n"
            "\n"
            "    @Override\n"
            "    public boolean equals(Object o) {\n"
            "        return o instanceof UserNoHash u\n"
            "            && email.equals(u.email);\n"
            "    }\n"
            "    // quên hashCode()\n"
            "}"), "cyan", "code"),
        box("nh-fix", 160, 720, 760, 130, code("@Override public int hashCode() {\n    return Objects.hash(email); }"), "green", "code"),
        el("nh-set", 1000, 250, 860, None, "HashSet (vẽ 8 bucket)", "lbl r", "text-align:left"),
        "".join(bucket(f"nh-b{i}", 1000 + i * 110, 300, 96, 210, i) for i in range(8)),
        mini("nh-u1", 1113, 350, 90, "an@…"),
        mini("nh-u2", 1333, 350, 90, "an@…"),
        el("nh-l", 1000, 530, 860, None, "cùng email nhưng nằm ở 2 bucket khác nhau", "note red r"),
        el("nh-res", 1000, 600, 860, None, "<div>set.size() → 2 (mong đợi 1)</div><div>set.contains(an@x.com) → false</div>", "err r"),
        el("nh-ok", 1000, 600, 860, None, "size → 1 · contains → true ✓", "note green r"),
        chip("nh-rec", 1000, 690, "record User(String email) {}", "green"),
        chip("nh-ide", 1000, 780, "IDE / Lombok: sinh cả hai", "violet"),
    ]), beats=[
        ("Chuyện gì xảy ra nếu override equals mà quên hashCode?", "Override equals() mà quên hashCode() thì sao?",
         [IN("#nh-hud", "left", 0.1), IN("#nh-code", "right", 0.3, 0.7)]),
        ("Lớp này so sánh theo email, nhưng không viết hashCode. Nó dùng hashCode mặc định, mỗi object một khác.",
         "Lớp này so sánh theo email, nhưng không viết hashCode(). Nó dùng hashCode mặc định: mỗi object một khác.",
         [FOCUS(540, 520, 1.25, 0.3, 1.0), HOME(3.6, 1.0), IN("#nh-set", "blur", 4.0),
          IN(", ".join(f"#nh-b{i}" for i in range(8)), "up", 4.2, 0.4, 0.06)]),
        ("Thêm hai user cùng email vào HashSet. Chúng rơi vào hai bucket khác nhau, nên equals không bao giờ được gọi.",
         "Thêm hai user cùng email vào HashSet: chúng rơi vào hai bucket khác nhau, equals() không bao giờ được gọi.",
         [IN("#nh-u1", "down", 0.6), PULSE("#nh-b1", 0.9), IN("#nh-u2", "down", 1.6), PULSE("#nh-b3", 1.9), IN("#nh-l", "up", 2.8)]),
        ("Kết quả: set chứa hai phần tử trùng nhau, và contains trả về false.",
         "Kết quả: set chứa 2 phần tử trùng nhau, và contains trả về false.",
         [IN("#nh-res", "up", 0.3), SHAKE("#nh-res", 1.0)]),
        ("Cách sửa: viết hashCode bằng Objects chấm hash, dùng đúng các field trong equals. Hai user giờ rơi cùng một bucket, set chỉ còn một phần tử.",
         "Sửa: hashCode() dùng Objects.hash(email), đúng các field của equals. Cùng bucket, set chỉ còn 1 phần tử.",
         [IN("#nh-fix", "up", 0.3), OUT("#nh-res, #nh-l", "fade", 2.2, 0.3), TO("#nh-u1", {"x": -110}, 4.0, 0.7),
          TO("#nh-u2", {"x": -330}, 4.3, 0.7), OUT("#nh-u2", "pop", 5.2, 0.3), PULSE("#nh-b0", 5.4), IN("#nh-ok", "pop", 5.6)]),
        ("Gọn nhất là dùng record, hoặc để IDE sinh cả hai method từ cùng một tập field.",
         "Gọn nhất: dùng record, hoặc để IDE sinh cả hai method từ cùng một tập field.",
         [IN("#nh-rec", "left", 0.3), IN("#nh-ide", "left", 1.8)]),
    ]),
    # ------------------------------------------------------------ String pool
    dict(id="pool", world=(1920, 1080), hud=hud("sp", "String pool", "Literal giống nhau dùng chung object"), cam="".join([
        big_title("sp", "String pool", "Vì sao không được so String bằng =="),
        el("sp-stk", 160, 200, 520, 620, "<span>STACK</span>", "mempanel r"),
        el("sp-hp", 780, 200, 980, 620, "<span>HEAP</span>", "mempanel r"),
        el("sp-pool", 820, 240, 520, 230, "<span>STRING POOL</span>", "mempanel pool r"),
        box("sp-s1", 200, 260, 440, 84, '<span class="mono">s1 = "java"</span>', "cyan"),
        box("sp-s2", 200, 370, 440, 84, '<span class="mono">s2 = "java"</span>', "cyan"),
        box("sp-s3", 200, 480, 440, 84, '<span class="mono">s3 = new String(…)</span>', "cyan"),
        box("sp-o1", 900, 290, 340, 90, '<span class="mono">"java"</span>', "violet"),
        box("sp-o2", 1400, 290, 320, 90, '<span class="mono">"java"</span>', "amber"),
        el("sp-r1", 820, 610, 900, None, "s1 == s2 → true", "note green left r"),
        el("sp-r2", 820, 660, 900, None, "s1 == s3 → false", "note red left r"),
        el("sp-r3", 820, 710, 900, None, "s1 == s3.intern() → true: intern() trả về bản trong pool", "note green left r"),
        box("sp-c1", 200, 260, 720, 250, win("lúc compile") + code('String ab = "a" + "b";\nab == "ab"   // true\n// gộp thành "ab", nằm trong pool'), "green", "code"),
        box("sp-c2", 1000, 260, 720, 250, win("lúc runtime") + code('String a = "a";\n(a + "b") == "ab"   // false\n// nối với biến: object mới'), "red", "code"),
        el("sp-t1", 0, 620, 1920, None, letters("Luôn so sánh String bằng equals()"), "take r"),
        wires(arrow("sp-a1", [(640, 302), (892, 322)], "cyan"), arrow("sp-a2", [(640, 412), (892, 352)], "cyan"),
              arrow("sp-a3", [(640, 522), (1100, 570), (1400, 540), (1530, 386)], "amber")),
    ]), beats=[
        ("Phần tiếp theo: String pool.", "Tiếp theo: String pool.",
         [TYPE("#sp-big", 0.1, 0.05), IN("#sp-bsub", "blur", 0.8)]),
        ("Chuỗi viết trực tiếp trong code gọi là literal. Hai literal giống nhau dùng chung một object trong String pool.",
         "Chuỗi viết trực tiếp trong code là literal. Hai literal giống nhau dùng chung một object trong String pool.",
         [OUT("#sp-big, #sp-bsub", "zoom"), IN("#sp-hud", "left", 0.2), IN("#sp-stk, #sp-hp", "blur", 0.3, 0.6, 0.15),
          IN("#sp-pool", "zoomin", 1.0, 0.6), IN("#sp-s1", "left", 2.2), IN("#sp-o1", "pop", 2.6), *ARROW("sp-a1", 2.9, 0.5),
          IN("#sp-s2", "left", 3.5), *ARROW("sp-a2", 3.8, 0.5), IN("#sp-r1", "up", 4.5)]),
        ("Còn new String luôn tạo object mới bên ngoài pool. Nên s1 hai dấu bằng s3 là false.",
         "Còn new String luôn tạo object mới ngoài pool. Nên s1 == s3 là false.",
         [IN("#sp-s3", "left", 0.2), IN("#sp-o2", "pop", 1.0), *ARROW("sp-a3", 1.3, 0.8), IN("#sp-r2", "up", 3.0), SHAKE("#sp-r2", 3.5)]),
        ("Hàm intern trả về đúng bản nằm trong pool.", "intern() trả về đúng bản nằm trong pool.",
         [IN("#sp-r3", "up", 0.3), PULSE("#sp-o1", 1.0)]),
        ("Bẫy tinh vi hơn: a cộng b viết bằng hằng số được gộp lúc biên dịch, nên nằm trong pool. Nhưng nối với một biến thì tạo lúc chạy, ra object mới.",
         "Bẫy tinh vi hơn: \"a\" + \"b\" được gộp lúc compile nên nằm trong pool. Nối với một biến thì tạo lúc runtime, ra object mới.",
         [OUT("#sp-stk, #sp-hp, #sp-pool, #sp-s1, #sp-s2, #sp-s3, #sp-o1, #sp-o2, #sp-r1, #sp-r2, #sp-r3, #sp-a1, #sp-a2, #sp-a3", "blur", 0, 0.45),
          IN("#sp-c1", "left", 0.6, 0.7), IN("#sp-c2", "right", 4.2, 0.7)]),
        ("Kết quả của hai dấu bằng phụ thuộc chuỗi tạo lúc biên dịch hay lúc chạy. Vì vậy luôn so sánh String bằng equals.",
         "Kết quả của == phụ thuộc chuỗi tạo lúc compile hay runtime. Vì vậy luôn so String bằng equals().",
         [PULSE("#sp-c1", 0.4), PULSE("#sp-c2", 1.2), TYPE("#sp-t1", 3.0, 0.035)]),
    ]),
    # ------------------------------------------------------------ immutable + StringBuilder
    dict(id="immut", world=(1920, 1080), hud=hud("im", "String immutable", "Không ai sửa được nội dung"), cam="".join([
        big_title("im", "Immutable", "Vì sao String không bao giờ đổi?"),
        box("im-s", 300, 230, 420, 96, '<span class="mono">s = "java"</span>', "cyan"),
        chip("im-call", 800, 252, "s.toUpperCase()", "amber"),
        box("im-u", 1240, 230, 420, 96, '<span class="mono">"JAVA"</span><span class="mono small">mới</span>', "green"),
        el("im-keep", 300, 350, 420, None, "s vẫn là \"java\"", "note green r"),
        card4("im-c", 230, 480, 340, 290, 30, [("share", "String pool", "chia sẻ an toàn"),
                                                ("lock", "Thread-safe", "không cần lock"),
                                                ("hash", "Cache hashCode", "key HashMap nhanh"),
                                                ("shield", "Bảo mật", "đường dẫn, URL không bị đổi")]),
        box("im-bad", 200, 230, 740, 230, win("chậm: += trong vòng lặp") + code('String r = "";\nfor (String s : items)\n    r += s + ",";'), "red", "code"),
        box("im-good", 1000, 230, 740, 230, win("nhanh: StringBuilder") + code("var sb = new StringBuilder();\nfor (String s : items)\n    sb.append(s).append(',');"), "green", "code"),
        chip("im-p1", 220, 500, '"a,"', "red"), chip("im-p2", 360, 500, '"a,b,"', "red"), chip("im-p3", 540, 500, '"a,b,c,"', "red"),
        el("im-pn", 200, 580, 740, None, "mỗi vòng lặp: thêm 1 String mới, copy lại toàn bộ", "note red r"),
        chip("im-g1", 1020, 500, "1 buffer, append tại chỗ", "green"),
        el("im-gn", 1000, 580, 740, None, "nối 1 biểu thức đơn thì cứ dùng +", "note r"),
    ]), beats=[
        ("Vì sao String pool dùng chung được một chuỗi cho nhiều biến? Vì String là immutable.", "Vì sao pool dùng chung được? Vì String là immutable.",
         [TYPE("#im-big", 0.1, 0.05), IN("#im-bsub", "blur", 1.0)]),
        ("Gọi toUpperCase không sửa chuỗi cũ, mà trả về một chuỗi mới.", "toUpperCase() không sửa chuỗi cũ, mà trả về một chuỗi mới.",
         [OUT("#im-big, #im-bsub", "zoom"), IN("#im-hud", "left", 0.2), IN("#im-s", "left", 0.4), IN("#im-call", "pop", 1.0),
          IN("#im-u", "right", 1.8), IN("#im-keep", "up", 2.6)]),
        ("Nhờ không đổi, String pool chia sẻ được an toàn, dùng giữa nhiều thread không cần khóa, cache được hashCode, và an toàn khi làm đường dẫn hay URL.",
         "Nhờ không đổi: String pool chia sẻ an toàn, thread-safe không cần lock, cache được hashCode, an toàn khi là đường dẫn hay URL.",
         [IN("#im-c0", "pop", 0.6), IN("#im-c1", "pop", 2.4), IN("#im-c2", "pop", 4.2), IN("#im-c3", "pop", 5.8)]),
        ("Nhưng nối chuỗi bằng dấu cộng trong vòng lặp sẽ tạo một object mới mỗi vòng. Hãy dùng StringBuilder.",
         "Nhưng nối chuỗi bằng + trong vòng lặp tạo một object mới mỗi vòng. Hãy dùng StringBuilder.",
         [OUT("#im-s, #im-call, #im-u, #im-keep, #im-c0, #im-c1, #im-c2, #im-c3", "blur", 0, 0.45),
          IN("#im-bad", "left", 0.4, 0.6), IN("#im-p1, #im-p2, #im-p3", "pop", 1.1, 0.35, 0.3), IN("#im-pn", "up", 2.3),
          IN("#im-good", "right", 3.2, 0.6), IN("#im-g1", "pop", 4.0), IN("#im-gn", "up", 4.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 150, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 300, 340, 280, 30, [("eq", "== vs equals()", "địa chỉ hay nội dung"),
                                                ("grid", "Integer cache", "luôn so bằng equals()"),
                                                ("hash", "equals + hashCode", "override cùng nhau"),
                                                ("quote", "String", "immutable, so bằng equals()")]),
        chip("ou-next", 660, 660, "Bài tiếp: HashMap Internals", "violet"),
        el("ou-cta", 0, 790, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: hai dấu bằng so địa chỉ, equals so nội dung. So sánh wrapper luôn dùng equals. Override equals thì phải override hashCode. Và String luôn so bằng equals.",
         "== so địa chỉ, equals so nội dung · wrapper luôn so bằng equals · override equals thì override hashCode · String so bằng equals.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.0), IN("#ou-c2", "pop", 5.4), IN("#ou-c3", "pop", 8.0)]),
        ("Bài sau ta sẽ mở bên trong HashMap: bucket, va chạm, và cách nó tự mở rộng.",
         "Bài sau: bên trong HashMap. Bucket, collision, và cách nó tự mở rộng.",
         [IN("#ou-next", "pop", 0.4)]),
        ("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.", "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
