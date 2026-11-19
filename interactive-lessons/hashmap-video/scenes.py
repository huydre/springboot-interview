"""HashMap Internals explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every number was measured on JDK 21 (reflection on HashMap.table / threshold):
"hello": hashCode 99162322, spread 99163451, bucket 11; "grape" also lands in bucket 11 (capacity 16);
capacity 16 / threshold 12, the 13th put resizes to 32 / 24; 100 puts resize 4 times (16 -> 256);
table 64: node 9 becomes a TreeNode; table 16: node 9 -> resize 32, node 10 -> resize 64, node 11 -> TreeNode;
hash 5 stays in bucket 5, hash 21 moves to 21; List.of("a") is in bucket 0, after add("b") its hash points to bucket 2.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

BX, BW, BSTEP = 140, 90, 103          # 16 buckets across the frame: x = BX + i * BSTEP


def buckets16(prefix, y, h):
    return "".join(box(f"{prefix}{i}", BX + i * BSTEP, y, BW, h, f'<span class="mono xs">{i}</span>', "muted", "bucket")
                   for i in range(16))


def bucket_ids(prefix):
    return ", ".join(f"#{prefix}{i}" for i in range(16))


def mini(id_, x, y, w, text, tone="amber"):
    return el(id_, x, y, w, 46, f'<span class="mono xs">{esc(text)}</span>', f"gbox {tone} r", attrs=" data-layout-allow-overlap")


def step(id_, x, label, value, tone="cyan", big=False):
    val = f'<span class="num">{esc(value)}</span>' if big else f'<span class="mono">{esc(value)}</span>'
    return box(id_, x, 200, 380 if not big else 340, 96, f'<span class="mono small">{esc(label)}</span>{val}', tone, "col")


TREE = [(1180, 260), (980, 380), (1380, 380), (880, 500), (1080, 500), (1280, 500), (1480, 500), (830, 620), (930, 620)]
TREE_EDGES = [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6), (3, 7), (3, 8)]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Câu hỏi phỏng vấn Java #4", "eyebrow r"),
        box("hk-code", 440, 210, 1000, 320, win("Main.java") + code(
            'List<String> key = new ArrayList<>(List.of("a"));\n'
            'map.put(key, "value");\n'
            'key.add("b");\n'
            'map.get(key);   // ?\n'
            'map.size();     // ?'), "cyan", "code"),
        el("hk-o1", 1470, 405, 260, None, "→ null", "note red left r"),
        el("hk-o2", 1470, 444, 260, None, "→ 1", "note red left r"),
        chip("hk-p", 520, 600, "entry vẫn nằm đó, nhưng không bao giờ lấy ra được nữa", "red"),
        el("hk-title", 260, 250, 1400, None, letters("Bên trong HashMap có gì?"), "h1 r"),
        card4("hk-c", 230, 470, 340, 290, 30, [("grid", "Bucket & hash", "(n - 1) & hash"),
                                                ("hash", "put / get", "hash rồi equals"),
                                                ("tree", "Treeify", "> 8 node, table ≥ 64"),
                                                ("share", "Resize", "vượt × 0.75 thì gấp đôi")]),
    ]), beats=[
        ("Đưa một list làm key vào HashMap, rồi thêm phần tử vào chính list đó. Gọi get bằng key ấy, ta nhận về null.",
         "Đưa một list làm key vào HashMap, rồi thêm phần tử vào chính list đó. get(key) trả về null.",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8), IN("#hk-o1", "pop", 4.6), SHAKE("#hk-o1", 5.1)]),
        ("Mà map vẫn báo size bằng một. Entry còn đó, nhưng không bao giờ lấy ra được nữa.",
         "Mà size() vẫn là 1. Entry còn đó, nhưng không bao giờ lấy ra được nữa.",
         [IN("#hk-o2", "pop", 0.4), IN("#hk-p", "up", 2.0)]),
        ("Để hiểu vì sao, ta mở HashMap ra: bucket và hash, hàm pút và get, khi nào bucket chuyển thành cây, và khi nào resize.",
         "Để hiểu vì sao, ta mở HashMap ra: bucket và hash, put/get, treeify, và resize.",
         [OUT("#hk-eye, #hk-code, #hk-o1, #hk-o2, #hk-p", "blur", 0, 0.45),
          TYPE("#hk-title", 0.4), IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 1.2, 0.55, 0.45)]),
    ]),
    # ------------------------------------------------------------ key -> bucket
    dict(id="index", world=(1920, 1080), hud=hud("ix", "Từ key đến bucket", "hash() rồi (n - 1) & hash"), cam="".join([
        big_title("ix", "Từ key đến bucket", "Bên trong là một mảng bucket"),
        box("ix-k", 140, 200, 300, 96, '<span class="mono big">"hello"</span>', "amber"),
        step("ix-s1", 520, "hashCode()", "99162322"),
        step("ix-s2", 980, "h ^ (h >>> 16)", "99163451"),
        step("ix-s3", 1440, "(n - 1) & hash", "11", "green", big=True),
        box("ix-bits", 520, 350, 840, 170, code("hash   … 0011 1011\nn - 1  … 0000 1111\n&      … 0000 1011   = 11"), "violet", "code"),
        el("ix-tl", 140, 600, 600, None, "table: 16 bucket (luôn là luỹ thừa của 2)", "lbl r", "text-align:left"),
        buckets16("ix-b", 650, 110),
        mini("ix-n", BX + 11 * BSTEP + 3, 700, 84, "hello"),
        chip("ix-p2", 140, 820, "n là luỹ thừa của 2: (n - 1) & hash cho kết quả như hash % n, nhưng nhanh hơn", "violet"),
        wires(arrow("ix-a1", [(440, 248), (512, 248)], "amber"), arrow("ix-a2", [(900, 248), (972, 248)], "cyan"),
              arrow("ix-a3", [(1360, 248), (1432, 248)], "cyan"),
              arrow("ix-a4", [(1610, 296), (1610, 560), (1318, 560), (1318, 646)], "green")),
    ]), beats=[
        ("Thứ nhất: từ key đến bucket.", "Thứ nhất: từ key đến bucket.",
         [TYPE("#ix-big", 0.1, 0.05), IN("#ix-bsub", "blur", 0.8)]),
        ("Bên trong HashMap là một mảng bucket. Mặc định có mười sáu ô.", "Bên trong HashMap là một mảng bucket. Mặc định 16 ô.",
         [OUT("#ix-big, #ix-bsub", "zoom"), IN("#ix-hud", "left", 0.2), IN("#ix-tl", "blur", 0.4),
          IN(bucket_ids("ix-b"), "up", 0.6, 0.4, 0.06)]),
        ("Đưa key hello vào. Đầu tiên, lấy hashCode của nó.", "Đưa key \"hello\" vào. Đầu tiên, lấy hashCode() của nó.",
         [IN("#ix-k", "left", 0.2), *ARROW("ix-a1", 1.4, 0.3), IN("#ix-s1", "pop", 1.7)]),
        ("Rồi trộn mười sáu bit cao xuống bit thấp, để bit cao cũng góp phần chọn bucket.",
         "Rồi trộn 16 bit cao xuống bit thấp, để bit cao cũng góp phần chọn bucket.",
         [*ARROW("ix-a2", 0.2, 0.3), IN("#ix-s2", "pop", 0.5)]),
        ("Cuối cùng AND với n trừ một, tức là giữ lại bốn bit cuối. Hello rơi vào bucket mười một.",
         "Cuối cùng AND với n - 1, tức giữ lại 4 bit cuối. \"hello\" rơi vào bucket 11.",
         [*ARROW("ix-a3", 0.2, 0.3), IN("#ix-s3", "pop", 0.5), IN("#ix-bits", "up", 1.2), *ARROW("ix-a4", 3.4, 0.7),
          IN("#ix-n", "down", 4.1), PULSE("#ix-b11", 4.4)]),
        ("Vì capacity luôn là luỹ thừa của hai, phép AND này cho kết quả như chia lấy dư, nhưng nhanh hơn nhiều.",
         "Vì capacity luôn là luỹ thừa của 2, phép AND cho kết quả như chia lấy dư, nhưng nhanh hơn nhiều.",
         [IN("#ix-p2", "up", 0.6)]),
    ]),
    # ------------------------------------------------------------ put / get
    dict(id="put", world=(1920, 1080), hud=hud("pu", "put() và get()", "So hash trước, rồi equals"), cam="".join([
        big_title("pu", "put() và get()", "So hash trước, rồi equals"),
        box("pu-bk", 140, 330, 170, 100, '<span class="mono">[11]</span>', "muted"),
        box("pu-n1", 390, 320, 380, 120, '<span class="mono xs">hash · key · value · next</span>'
            '<span class="mono">"hello" = <span class="swap"><i id="pu-v1">1</i><i id="pu-v2">3</i></span></span>', "cyan", "col"),
        box("pu-n2", 850, 320, 360, 120, '<span class="mono xs">hash · key · value · next</span><span class="mono">"grape" = 2</span>', "amber", "col"),
        box("pu-d", 1270, 200, 520, 96, '<span class="mono">cùng hash && equals?</span>', "violet"),
        chip("pu-no", 1270, 330, "không: nối node vào cuối", "amber"),
        chip("pu-yes", 1270, 410, "có: ghi đè, trả value cũ", "green"),
        box("pu-code", 140, 560, 880, 170, code(
            'map.put("hello", 1);   // null\n'
            'map.put("grape", 2);   // null, cũng bucket 11\n'
            'map.put("hello", 3);   // 1: value cũ'), "cyan", "code"),
        chip("pu-get", 1100, 600, "get(): hash → bucket, equals → node", "cyan"),
        wires(arrow("pu-a1", [(310, 380), (382, 380)], "muted"), arrow("pu-a2", [(770, 380), (842, 380)], "amber")),
    ]), beats=[
        ("Thứ hai: hàm pút và hàm get chạy thế nào?", "Thứ hai: put() và get() chạy thế nào?",
         [TYPE("#pu-big", 0.1, 0.05), IN("#pu-bsub", "blur", 1.0)]),
        ("Khi put, nếu bucket còn rỗng thì đặt node mới vào. Mỗi node lưu sẵn hash, key, value, và con trỏ next.",
         "Bucket còn rỗng thì đặt node mới vào. Mỗi node lưu sẵn hash, key, value, và con trỏ next.",
         [OUT("#pu-big, #pu-bsub", "zoom"), IN("#pu-hud", "left", 0.2), IN("#pu-code", "up", 0.4), IN("#pu-bk", "pop", 0.8),
          *ARROW("pu-a1", 1.2, 0.3), IN("#pu-n1", "right", 1.5)]),
        ("Put grape cũng rơi vào bucket mười một. HashMap so hash trước vì rẻ, rồi mới gọi equals. Không trùng, nên nối node mới vào cuối.",
         "\"grape\" cũng rơi vào bucket 11. So hash trước vì rẻ, rồi mới gọi equals. Không trùng: nối node mới vào cuối.",
         [IN("#pu-d", "down", 1.4), PULSE("#pu-n1", 2.6), IN("#pu-no", "pop", 5.0), *ARROW("pu-a2", 5.6, 0.4), IN("#pu-n2", "right", 6.0)]),
        ("Put hello lần nữa: trùng key, nên value được ghi đè, và put trả về value cũ là một.",
         "put(\"hello\", 3): trùng key nên value bị ghi đè, và put trả về value cũ là 1.",
         [PULSE("#pu-n1", 1.0), IN("#pu-yes", "pop", 1.6), OUT("#pu-v1", "up", 2.6, 0.25), IN("#pu-v2", "pop", 2.8, 0.35)]),
        ("Hàm get đi đúng con đường đó: hash dẫn tới bucket, equals chọn đúng node.",
         "get() đi đúng con đường đó: hash dẫn tới bucket, equals chọn đúng node.",
         [IN("#pu-get", "pop", 0.4)]),
    ]),
    # ------------------------------------------------------------ collision + treeify
    dict(id="treeify", world=(1920, 1080), hud=hud("tf", "Collision và treeify", "> 8 node và table ≥ 64"), cam="".join([
        big_title("tf", "Collision và treeify", "Khi một bucket quá đông"),
        box("tf-bk", 200, 190, 240, 70, '<span class="mono">bucket 5</span>', "muted"),
        "".join(mini(f"tf-n{i}", 220, 280 + (i - 1) * 62, 200, f"node {i}", "cyan") for i in range(1, 9)),
        mini("tf-n9", 220, 776, 200, "node 9", "red"),
        el("tf-c", 520, 300, 600, None, "1000 key cùng hashCode: size = 1000, get vẫn đúng, chỉ dồn vào một bucket", "note left r"),
        "".join(el(f"tf-t{k}", x - 40, y - 25, 80, 50, f'<span class="mono xs">{k + 1}</span>',
                   f"gbox {'red' if k in (1, 2, 7, 8) else 'muted'} r") for k, (x, y) in enumerate(TREE)),
        chip("tf-lab", 900, 700, "TreeNode · red-black tree · O(log n)", "violet"),
        chip("tf-cond", 900, 780, "điều kiện: bucket > 8 node và table ≥ 64", "green"),
        box("tf-meas", 240, 230, 1440, 230, win("đo trên JDK 21: dồn key cùng hashCode vào một bucket") + code(
            "table 64 ô:  node 1-8: list · node 9 → TreeNode\n"
            "table 16 ô:  node 9 → resize 32 · node 10 → resize 64 · node 11 → TreeNode"), "cyan", "code"),
        el("tf-k1", 0, 600, 1920, None, letters("Trên 8 thành cây, còn 6 thì về list"), "take r"),
        el("tf-k2", 0, 720, 1920, None, "khoảng đệm 6 ↔ 8 tránh chuyển qua lại liên tục", "take-sm r"),
        wires(*[arrow(f"tf-e{a}{b}", [(TREE[a][0], TREE[a][1] + 25), (TREE[b][0], TREE[b][1] - 25)], "muted", head=False)
                for a, b in TREE_EDGES]),
    ]), beats=[
        ("Thứ ba: collision, và khi nào bucket chuyển thành cây.", "Thứ ba: collision và treeify.",
         [TYPE("#tf-big", 0.1, 0.05), IN("#tf-bsub", "blur", 0.8)]),
        ("Collision là khi nhiều key rơi vào cùng một bucket. Kết quả vẫn đúng, chỉ chậm hơn, vì phải duyệt từng node.",
         "Collision: nhiều key rơi vào cùng một bucket. Kết quả vẫn đúng, chỉ chậm hơn vì phải duyệt từng node.",
         [OUT("#tf-big, #tf-bsub", "zoom"), IN("#tf-hud", "left", 0.2), IN("#tf-bk", "pop", 0.4),
          IN(", ".join(f"#tf-n{i}" for i in range(1, 9)), "down", 0.8, 0.35, 0.25), IN("#tf-c", "up", 4.2)]),
        ("Khi bucket vượt quá tám node, tức lúc thêm node thứ chín, và bảng có từ sáu mươi tư ô trở lên, list chuyển thành cây đỏ đen.",
         "Bucket vượt quá 8 node (lúc thêm node thứ 9) và table ≥ 64 ô: list chuyển thành cây đỏ đen.",
         [OUT("#tf-c", "fade", 0, 0.3), IN("#tf-n9", "pop", 2.6), SHAKE("#tf-n9", 3.1),
          IN(", ".join(f"#tf-t{k}" for k in range(9)), "pop", 4.0, 0.35, 0.12),
          *[DRAW(f"#tf-e{a}{b}-p", 4.4, 0.4) for a, b in TREE_EDGES], IN("#tf-cond", "up", 5.6)]),
        ("Tìm kiếm trong bucket đó từ O n giảm còn O log n.", "Tìm kiếm trong bucket đó: từ O(n) còn O(log n).",
         [IN("#tf-lab", "pop", 0.4)]),
        ("Bảng nhỏ hơn sáu mươi tư ô thì HashMap resize thay vì chuyển thành cây. Đo thật với bảng mười sáu ô: node chín làm bảng lên ba mươi hai ô, node mười lên sáu mươi tư, node mười một mới thành cây.",
         "Table < 64 thì resize thay vì treeify. Đo thật với table 16 ô: node 9 → 32, node 10 → 64, node 11 mới thành cây.",
         [OUT("#tf-bk, " + ", ".join(f"#tf-n{i}" for i in range(1, 10)) + ", " + ", ".join(f"#tf-t{k}" for k in range(9))
              + ", " + ", ".join(f"#tf-e{a}{b}" for a, b in TREE_EDGES) + ", #tf-lab, #tf-cond", "blur", 0, 0.45),
          IN("#tf-meas", "up", 0.8, 0.7)]),
        ("Trên tám node mới thành cây, còn sáu node thì quay về list. Khoảng đệm này tránh chuyển qua lại liên tục.",
         "Trên 8 node mới thành cây, còn 6 thì quay về list. Khoảng đệm tránh chuyển qua lại liên tục.",
         [DIM("#tf-meas", 0, 0.3), TYPE("#tf-k1", 0.3, 0.035), IN("#tf-k2", "blur", 2.6)]),
    ]),
    # ------------------------------------------------------------ resize
    dict(id="resize", world=(1920, 1080), hud=hud("rs", "Resize", "vượt capacity × 0.75 thì gấp đôi"), cam="".join([
        big_title("rs", "Resize", "16 × 0.75 = 12"),
        "".join(box(f"rs-q{i}", 260 + i * 90, 300, 70, 70, "", "muted") for i in range(16)),
        "".join(box(f"rs-f{i}", 260 + i * 90, 300, 70, 70, f'<span class="mono xs">{i + 1}</span>', "green" if i < 12 else "amber")
                for i in range(13)),
        el("rs-mark", 1326, 280, 4, 110, "", "r", "background:var(--amber);border-radius:2px"),
        el("rs-thr", 1230, 400, 200, None, "threshold 12", "lbl r"),
        chip("rs-c1", 260, 470, "capacity 16 → 32", "violet"),
        chip("rs-c2", 640, 470, "threshold 12 → 24", "violet"),
        box("rs-o", 200, 270, 560, 120, '<span class="mono small">bucket 5 · capacity 16</span><span class="mono">hash 5, hash 21</span>', "cyan", "col"),
        box("rs-a", 1060, 200, 680, 110, '<span class="mono small">bucket 5 (ở lại)</span><span class="mono">hash 5: 5 & 16 = 0</span>', "green", "col"),
        box("rs-b", 1060, 360, 680, 110, '<span class="mono small">bucket 21 = 5 + 16 (chuyển)</span><span class="mono">hash 21: 21 & 16 = 16</span>', "amber", "col"),
        el("rs-rule", 200, 520, 1540, None, "Mỗi node chỉ có 2 chỗ: ở nguyên i, hoặc sang i + oldCap. Không tính lại hash.", "note r"),
        chip("rs-x1", 200, 640, "100 phần tử, map mặc định: resize 4 lần (16 → 256)", "red"),
        chip("rs-x2", 200, 730, "HashMap.newHashMap(1000) (Java 19+): đủ chỗ, không resize", "green"),
        wires(arrow("rs-a1", [(760, 330), (1052, 260)], "green"), arrow("rs-a2", [(760, 330), (1052, 410)], "amber")),
    ]), beats=[
        ("Thứ tư: khi nào resize.", "Thứ tư: khi nào resize.",
         [TYPE("#rs-big", 0.1, 0.06), IN("#rs-bsub", "blur", 0.6)]),
        ("Mặc định capacity mười sáu, load factor không phẩy bảy lăm, nên ngưỡng là mười hai phần tử.",
         "Mặc định capacity 16, load factor 0.75, nên ngưỡng là 12 phần tử.",
         [OUT("#rs-big, #rs-bsub", "zoom"), IN("#rs-hud", "left", 0.2), IN(", ".join(f"#rs-q{i}" for i in range(16)), "up", 0.4, 0.35, 0.04),
          IN(", ".join(f"#rs-f{i}" for i in range(12)), "pop", 1.6, 0.3, 0.14), IN("#rs-mark", "fade", 3.6, 0.3), IN("#rs-thr", "up", 3.8)]),
        ("Phần tử thứ mười ba vượt ngưỡng: table gấp đôi lên ba mươi hai ô, ngưỡng mới là hai mươi tư.",
         "Phần tử thứ 13 vượt ngưỡng: table gấp đôi lên 32 ô, ngưỡng mới là 24.",
         [IN("#rs-f12", "pop", 0.4), SHAKE("#rs-f12", 1.0), IN("#rs-c1", "up", 2.0), IN("#rs-c2", "up", 3.2)]),
        ("Khi chuyển node sang table mới, Java tám không tính lại từ đầu. Mỗi node hoặc ở nguyên chỗ, hoặc chuyển sang chỉ số cũ cộng capacity cũ.",
         "Java 8 không tính lại từ đầu: mỗi node hoặc ở nguyên chỗ, hoặc chuyển sang chỉ số cũ + capacity cũ.",
         [OUT(", ".join(f"#rs-q{i}" for i in range(16)) + ", " + ", ".join(f"#rs-f{i}" for i in range(13))
              + ", #rs-mark, #rs-thr, #rs-c1, #rs-c2", "blur", 0, 0.45),
          IN("#rs-o", "left", 0.6), *ARROW("rs-a1", 2.6, 0.4), IN("#rs-a", "right", 2.9), *ARROW("rs-a2", 4.2, 0.4),
          IN("#rs-b", "right", 4.5), IN("#rs-rule", "up", 6.0)]),
        ("Biết trước số phần tử thì khai báo capacity. Đổ một trăm phần tử vào map mặc định sẽ resize bốn lần.",
         "Biết trước số phần tử thì khai báo capacity. 100 phần tử vào map mặc định: resize 4 lần.",
         [IN("#rs-x1", "pop", 2.6), IN("#rs-x2", "pop", 4.0)]),
    ]),
    # ------------------------------------------------------------ mutated key + thread safety
    dict(id="trap", world=(1920, 1080), hud=hud("tp", "Key bị sửa sau khi put", "và HashMap không thread-safe"), cam="".join([
        box("tp-code", 140, 190, 880, 260, win("Main.java") + code(
            'List<String> key = new ArrayList<>(List.of("a"));\n'
            'map.put(key, "value");   // bucket 0\n'
            'key.add("b");            // hashCode đổi\n'
            'map.get(key);            // tìm ở bucket 2'), "cyan", "code"),
        buckets16("tp-b", 560, 150),
        mini("tp-e1", BX + 3, 620, 84, "[a]"),
        mini("tp-e2", BX + 3, 620, 84, "[a, b]"),
        el("tp-r1", 1100, 220, 720, None, "get(key) → null · containsKey → false", "note red left r"),
        el("tp-r2", 1100, 290, 720, None, "size() → 1: entry vẫn còn đó", "note red left r"),
        el("tp-r3", 1100, 360, 720, None, "get(List.of(\"a\")) → null: đúng bucket 0 nhưng equals không khớp", "note red left r"),
        chip("tp-k", 140, 770, "key phải immutable: String, Integer, UUID, enum, record", "green"),
        chip("tp-c1", 200, 280, "1 key null · hash(null) = 0 → bucket 0", "cyan"),
        chip("tp-c2", 200, 380, "không đảm bảo thứ tự duyệt · cần thứ tự: LinkedHashMap", "amber"),
        chip("tp-c3", 200, 480, "không thread-safe · nhiều thread: ConcurrentHashMap", "red"),
        wires(arrow("tp-l1", [(1020, 420), (1020, 520), (391, 470), (391, 556)], "red")),
    ]), beats=[
        ("Quay lại câu hỏi đầu. Key là list chứa a, nằm ở bucket số không.",
         "Quay lại câu hỏi đầu: key là list chứa \"a\", nằm ở bucket 0.",
         [IN("#tp-hud", "left", 0.1), IN("#tp-code", "left", 0.3), IN(bucket_ids("tp-b"), "up", 0.8, 0.35, 0.04),
          IN("#tp-e1", "down", 2.4), PULSE("#tp-b0", 2.8)]),
        ("Thêm b vào list: hashCode đổi, get đi tìm ở bucket hai, nên trả về null.",
         "Thêm \"b\" vào list: hashCode đổi, get() đi tìm ở bucket 2, nên trả về null.",
         [OUT("#tp-e1", "fade", 0.3, 0.2), IN("#tp-e2", "pop", 0.4), *ARROW("tp-l1", 1.6, 0.7), PULSE("#tp-b2", 2.4),
          IN("#tp-r1", "up", 2.8)]),
        ("Size vẫn là một. Tìm bằng list chứa a thì đúng bucket cũ, nhưng equals không còn khớp. Entry mất tích, thành rò rỉ bộ nhớ.",
         "size() vẫn là 1. Tìm bằng List.of(\"a\") thì đúng bucket cũ nhưng equals không khớp. Entry mất tích: rò rỉ bộ nhớ.",
         [IN("#tp-r2", "up", 0.3), IN("#tp-r3", "up", 2.0), PULSE("#tp-e2", 5.0)]),
        ("Quy tắc: key phải immutable, như String, Integer, UUID, hay record.",
         "Quy tắc: key phải immutable, như String, Integer, UUID, hay record.",
         [IN("#tp-k", "pop", 0.4)]),
        ("Ngoài ra, HashMap cho phép đúng một key bằng null, nằm ở bucket không. Nó không đảm bảo thứ tự duyệt, và không thread safe: nhiều thread thì dùng ConcurrentHashMap.",
         "Ngoài ra: một key null ở bucket 0, không đảm bảo thứ tự duyệt, không thread-safe. Nhiều thread: ConcurrentHashMap.",
         [OUT("#tp-code, #tp-e2, #tp-r1, #tp-r2, #tp-r3, #tp-k, #tp-l1, " + bucket_ids("tp-b"), "blur", 0, 0.45),
          IN("#tp-c1", "left", 0.8), IN("#tp-c2", "left", 3.2), IN("#tp-c3", "left", 4.8)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 150, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 300, 340, 280, 30, [("grid", "Bucket", "trộn bit rồi (n - 1) & hash"),
                                                ("hash", "put / get", "so hash rồi equals"),
                                                ("tree", "Treeify", "> 8 node, table ≥ 64"),
                                                ("share", "Resize", "vượt × 0.75 thì gấp đôi")]),
        chip("ou-next", 640, 660, "Bài tiếp: Collections Framework", "violet"),
        el("ou-cta", 0, 790, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: trộn bit rồi AND để chọn bucket. Put so hash rồi equals. Bucket quá tám node thì thành cây. Vượt ngưỡng không phẩy bảy lăm thì gấp đôi. Và key luôn phải immutable.",
         "Trộn bit rồi AND để chọn bucket · so hash rồi equals · > 8 node thành cây · vượt 0.75 thì gấp đôi · key phải immutable.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 2.8), IN("#ou-c2", "pop", 4.8), IN("#ou-c3", "pop", 6.8)]),
        ("Bài sau ta so sánh các collection: ArrayList hay LinkedList, HashMap hay TreeMap.",
         "Bài sau: so sánh các collection. ArrayList hay LinkedList, HashMap hay TreeMap.",
         [IN("#ou-next", "pop", 0.4)]),
        ("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.", "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
