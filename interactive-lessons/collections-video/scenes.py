"""Collections Framework explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion.

Every output was run on JDK 21 (ArrayList capacity read by reflection):
for-each removing "b" from [a, b, c] -> [a, c], no exception, visited only [a, b];
ArrayList capacity 0 -> 10 (1st add) -> 15 (11th) -> 22 (16th);
HashSet [banana, date, apple, cherry], LinkedHashSet [banana, apple, cherry, date], TreeSet [apple, banana, cherry, date];
TreeSet(CASE_INSENSITIVE_ORDER) add Java, JAVA -> size 1; LRU [a, b, c] -> get(a) [b, c, a] -> put(d) [c, a, d];
stack pop 3, queue poll 1; top-3 heap drops 1, 3, 5, 2 and keeps 7, 8, 9;
(a, b) -> a - b: compare(MIN_VALUE, 1) = 2147483647, sort gives [1, 5, -2147483648];
unmodifiable view [a, b] vs List.copyOf [a] after base.add("b").

Narration avoids terms VieNeu mispronounces (checked with qc-voice): TreeSet, Arrays.asList, a bare "null".
The exact names stay on screen.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def node(id_, x, y, w, name, tone="cyan", h=70):
    return box(id_, x, y, w, h, f'<span class="mono xs">{esc(name)}</span>', tone)


def row(id_, y, name, value, note, tone):
    return box(id_, 200, y, 1520, 84, f'<span class="mono">{esc(name)}</span><span class="mono">{esc(value)}</span>'
               f'<span class="mono small">{esc(note)}</span>', tone, "row")


def line(id_, x, y, w, text, cls="mono"):
    return el(id_, x, y, w, None, esc(text), f"{cls} r")


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Câu hỏi phỏng vấn Java #5", "eyebrow r"),
        box("hk-code", 400, 210, 1080, 300, win("Main.java") + code(
            'List<String> list = new ArrayList<>(List.of("a", "b", "c"));\n'
            "for (String s : list) {\n"
            '    if (s.equals("b")) list.remove(s);\n'
            "}\n"
            "System.out.println(list);   // ?"), "cyan", "code"),
        chip("hk-o", 560, 560, "[a, c] · không có exception", "green"),
        chip("hk-p", 560, 650, "nhưng vòng lặp đã dừng sớm: chưa từng duyệt tới \"c\"", "red"),
        el("hk-title", 260, 250, 1400, None, letters("Chọn collection cho đúng"), "h1 r"),
        card4("hk-c", 230, 470, 340, 290, 30, [("grid", "List", "ArrayList hay LinkedList"),
                                                ("share", "Set & Map", "thứ tự nào?"),
                                                ("tree", "Queue", "Deque, PriorityQueue"),
                                                ("shield", "Fail-fast", "sửa khi đang duyệt")]),
    ]), beats=[
        ("Duyệt một list ba phần tử, gặp b thì xoá nó. Bạn đoán sẽ có exception không?",
         "Duyệt list 3 phần tử, gặp \"b\" thì xoá. Có exception không?",
         [IN("#hk-eye", "blur"), IN("#hk-code", "zoomin", 0.3, 0.8)]),
        ("Không có exception nào. List còn a và c.", "Không có exception nào. List còn [a, c].",
         [IN("#hk-o", "pop", 0.3)]),
        ("Nhưng vòng lặp đã dừng sớm. Phần tử c chưa bao giờ được duyệt tới.",
         "Nhưng vòng lặp đã dừng sớm: phần tử \"c\" chưa bao giờ được duyệt tới.",
         [IN("#hk-p", "up", 0.3), SHAKE("#hk-p", 1.2)]),
        ("Hôm nay ta chọn collection cho đúng, xem thứ tự của Set và Map, hàng đợi, và giải thích chuyện vừa rồi.",
         "Hôm nay: chọn collection cho đúng, thứ tự của Set/Map, hàng đợi, và giải thích chuyện vừa rồi.",
         [OUT("#hk-eye, #hk-code, #hk-o, #hk-p", "blur", 0, 0.45),
          TYPE("#hk-title", 0.4), IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 1.2, 0.55, 0.5)]),
    ]),
    # ------------------------------------------------------------ map of collections
    dict(id="map", world=(1920, 1080), hud=hud("mp", "Bản đồ Collections", "Chọn cấu trúc nào?"), cam="".join([
        big_title("mp", "Bản đồ Collections", "Chọn cấu trúc nào?"),
        node("mp-col", 760, 190, 400, "Collection", "violet", 84),
        node("mp-l", 220, 360, 420, "List: có thứ tự, cho trùng", "cyan", 80),
        node("mp-s", 750, 360, 420, "Set: không trùng", "cyan", 80),
        node("mp-q", 1280, 360, 420, "Queue: hàng đợi", "cyan", 80),
        node("mp-al", 220, 530, 200, "ArrayList", "green"),
        node("mp-ll", 440, 530, 200, "LinkedList"),
        node("mp-hs", 650, 530, 190, "HashSet", "green"),
        node("mp-lhs", 855, 530, 200, "LinkedHashSet"),
        node("mp-ts", 1070, 530, 150, "TreeSet"),
        node("mp-ad", 1280, 530, 200, "ArrayDeque", "green"),
        node("mp-pq", 1500, 530, 220, "PriorityQueue"),
        node("mp-map", 220, 720, 420, "Map: key → value (nhánh riêng)", "amber", 80),
        node("mp-hm", 700, 725, 230, "HashMap", "green"),
        node("mp-lhm", 950, 725, 260, "LinkedHashMap"),
        node("mp-tm", 1230, 725, 230, "TreeMap"),
        chip("mp-def", 700, 830, "xanh = lựa chọn mặc định", "green"),
        wires(arrow("mp-a1", [(960, 274), (430, 356)], "violet"), arrow("mp-a2", [(960, 274), (960, 356)], "violet"),
              arrow("mp-a3", [(960, 274), (1490, 356)], "violet"),
              arrow("mp-a4", [(640, 760), (692, 760)], "amber")),
    ]), beats=[
        ("Thứ nhất: bản đồ collections.", "Thứ nhất: bản đồ Collections.",
         [TYPE("#mp-big", 0.1, 0.05), IN("#mp-bsub", "blur", 0.8)]),
        ("Collection có ba nhánh chính. List có thứ tự và cho trùng, Set không cho trùng, và Queue là hàng đợi.",
         "Collection có 3 nhánh: List có thứ tự và cho trùng, Set không cho trùng, Queue là hàng đợi.",
         [OUT("#mp-big, #mp-bsub", "zoom"), IN("#mp-hud", "left", 0.2), IN("#mp-col", "pop", 0.4),
          *ARROW("mp-a1", 1.2, 0.4), IN("#mp-l", "up", 1.5), *ARROW("mp-a2", 3.4, 0.3), IN("#mp-s", "up", 3.6),
          *ARROW("mp-a3", 4.6, 0.4), IN("#mp-q", "up", 4.9)]),
        ("Mỗi nhánh có vài lựa chọn. Mặc định nên dùng ArrayList, HashSet, và ArrayDeque.",
         "Mỗi nhánh có vài lựa chọn. Mặc định: ArrayList, HashSet, ArrayDeque.",
         [IN("#mp-al, #mp-ll", "up", 0.3, 0.35, 0.12), IN("#mp-hs, #mp-lhs, #mp-ts", "up", 0.8, 0.35, 0.12),
          IN("#mp-ad, #mp-pq", "up", 1.4, 0.35, 0.12), PULSE("#mp-al, #mp-hs, #mp-ad", 3.0)]),
        ("Map là một nhánh riêng, không kế thừa Collection, vì nó lưu cặp key và value.",
         "Map là nhánh riêng, không kế thừa Collection, vì nó lưu cặp key → value.",
         [IN("#mp-map", "left", 0.3), *ARROW("mp-a4", 1.0, 0.3), IN("#mp-hm, #mp-lhm, #mp-tm", "up", 1.3, 0.35, 0.12),
          IN("#mp-def", "pop", 3.0)]),
    ]),
    # ------------------------------------------------------------ ArrayList vs LinkedList
    dict(id="list", world=(1920, 1080), hud=hud("al", "ArrayList vs LinkedList", "Vì sao gần như luôn chọn ArrayList?"), cam="".join([
        big_title("al", "ArrayList vs LinkedList", "Vì sao gần như luôn chọn ArrayList?"),
        el("al-l1", 200, 200, 800, None, "ArrayList: mảng Object[], phần tử nằm liền nhau", "lbl r", "text-align:left"),
        "".join(box(f"al-c{i}", 200 + i * 72, 250, 64, 64, f'<span class="mono xs">{chr(97 + i)}</span>', "cyan" if i != 6 else "green")
                for i in range(10)),
        chip("al-get", 200, 336, "get(6): tính thẳng vị trí · O(1)", "green"),
        el("al-l2", 200, 440, 800, None, "LinkedList: danh sách liên kết đôi, mỗi phần tử là một node", "lbl r", "text-align:left"),
        "".join(box(f"al-n{i}", 200 + i * 260, 490, 240, 70, f'<span class="mono xs">prev · {chr(97 + i)} · next</span>', "amber")
                for i in range(4)),
        chip("al-walk", 200, 586, "get(i): đi qua từng node · O(n)", "red"),
        box("al-cx", 1100, 230, 700, 230, code(
            "            ArrayList  LinkedList\nget(i)      O(1)       O(n)\nthêm cuối   O(1)*      O(1)\n"
            "chèn giữa   O(n)       O(n) tìm + O(1)"), "violet", "code"),
        el("al-cache", 1300, 590, 500, None, "mảng liền nhau tận dụng CPU cache; node rải rác thì không", "note left r"),
        chip("al-g1", 200, 700, "new: 0", "muted"), chip("al-g2", 400, 700, "add thứ 1 → 10", "cyan"),
        chip("al-g3", 720, 700, "thứ 11 → 15", "cyan"), chip("al-g4", 1010, 700, "thứ 16 → 22", "cyan"),
        el("al-gn", 200, 790, 1500, None, "đầy thì tăng ~1.5 lần (old + old >> 1) và copy cả mảng · biết trước thì new ArrayList<>(n)", "note left r"),
        wires(*[arrow(f"al-w{i}", [(440 + i * 260, 525), (456 + i * 260, 525)], "amber") for i in range(3)]),
    ]), beats=[
        ("Thứ hai: ArrayList và LinkedList.", "Thứ hai: ArrayList vs LinkedList.",
         [TYPE("#al-big", 0.1, 0.04), IN("#al-bsub", "blur", 0.9)]),
        ("Bên trong ArrayList là một mảng. Phần tử nằm liền nhau, nên lấy phần tử thứ i chỉ cần tính vị trí, độ phức tạp O một.",
         "ArrayList là một mảng: phần tử nằm liền nhau, lấy phần tử thứ i chỉ cần tính vị trí, O(1).",
         [OUT("#al-big, #al-bsub", "zoom"), IN("#al-hud", "left", 0.2), IN("#al-l1", "blur", 0.4),
          IN(", ".join(f"#al-c{i}" for i in range(10)), "pop", 0.8, 0.3, 0.07), PULSE("#al-c6", 4.0), IN("#al-get", "up", 4.3)]),
        ("LinkedList là danh sách liên kết đôi. Muốn tới phần tử thứ i phải đi qua từng node, O n.",
         "LinkedList là danh sách liên kết đôi: muốn tới phần tử thứ i phải đi qua từng node, O(n).",
         [IN("#al-l2", "blur", 0.2), IN("#al-n0", "up", 0.6), *ARROW("al-w0", 0.9, 0.25), IN("#al-n1", "up", 1.1),
          *ARROW("al-w1", 1.4, 0.25), IN("#al-n2", "up", 1.6), *ARROW("al-w2", 1.9, 0.25), IN("#al-n3", "up", 2.1),
          IN("#al-walk", "up", 3.6)]),
        ("Nhiều người nói LinkedList chèn giữa nhanh hơn. Nhưng tìm tới vị trí đó đã mất O n, mà node rải rác thì không tận dụng được bộ nhớ đệm của CPU.",
         "\"LinkedList chèn giữa nhanh hơn\"? Tìm tới vị trí đã mất O(n), và node rải rác không tận dụng được CPU cache.",
         [IN("#al-cx", "right", 0.3), PULSE("#al-cx", 3.4), IN("#al-cache", "up", 5.4)]),
        ("ArrayList đầy thì nới ra khoảng một phẩy năm lần và copy cả mảng: mười, mười lăm, hai mươi hai. Biết trước kích thước thì khai báo capacity.",
         "ArrayList đầy thì nới ~1.5 lần và copy cả mảng: 10 → 15 → 22. Biết trước kích thước thì khai báo capacity.",
         [IN("#al-g1", "pop", 0.3), IN("#al-g2", "pop", 3.0), IN("#al-g3", "pop", 3.6), IN("#al-g4", "pop", 4.2), IN("#al-gn", "up", 5.6)]),
    ]),
    # ------------------------------------------------------------ ordering of sets and maps, LRU
    dict(id="order", world=(1920, 1080), hud=hud("od", "Set và Map: thứ tự nào?", "Hash, Linked, Tree"), cam="".join([
        big_title("od", "Set và Map", "Cùng dữ liệu, thứ tự khác nhau"),
        chip("od-in", 200, 200, 'thêm lần lượt: "banana", "apple", "cherry", "date"', "amber"),
        row("od-h", 300, "HashSet", "[banana, date, apple, cherry]", "không đảm bảo", "cyan"),
        row("od-l", 400, "LinkedHashSet", "[banana, apple, cherry, date]", "thứ tự chèn", "green"),
        row("od-t", 500, "TreeSet", "[apple, banana, cherry, date]", "sắp xếp", "violet"),
        chip("od-ci", 200, 630, "TreeSet(CASE_INSENSITIVE_ORDER): add Java, JAVA → size 1", "red"),
        el("od-cin", 200, 710, 1520, None, "bản dạng cây so trùng bằng compare() == 0, không gọi equals()", "note left r"),
        box("od-code", 160, 200, 860, 340, win("LruCache extends LinkedHashMap") + code(
            "super(16, 0.75f, true);   // thứ tự truy cập\n\n"
            "protected boolean removeEldestEntry(\n        Map.Entry<K, V> eldest) {\n"
            "    return size() > maxSize;\n}"), "cyan", "code"),
        line("od-s1", 1100, 260, 720, "put a, b, c  → [a, b, c]"),
        line("od-s2", 1100, 330, 720, "get(a)       → [b, c, a]"),
        line("od-s3", 1100, 400, 720, "put(d)       → [c, a, d]"),
        chip("od-ev", 1100, 480, "b lâu không dùng nhất: bị loại", "red"),
    ]), beats=[
        ("Thứ ba: Set và Map giữ thứ tự thế nào?", "Thứ ba: Set và Map giữ thứ tự thế nào?",
         [TYPE("#od-big", 0.1, 0.06), IN("#od-bsub", "blur", 0.9)]),
        ("Cùng bốn chữ, ba loại set cho ba thứ tự. HashSet không đảm bảo thứ tự, Linked HashSet giữ thứ tự chèn, còn bản dựa trên cây đỏ đen luôn sắp xếp.",
         "Cùng 4 chữ, 3 loại set, 3 thứ tự: HashSet không đảm bảo, LinkedHashSet giữ thứ tự chèn, TreeSet luôn sắp xếp.",
         [OUT("#od-big, #od-bsub", "zoom"), IN("#od-hud", "left", 0.2), IN("#od-in", "pop", 0.5),
          IN("#od-h", "left", 2.0), IN("#od-l", "left", 4.0), IN("#od-t", "left", 6.2)]),
        ("Bản dạng cây xác định trùng bằng Comparator, không dùng equals. So không phân biệt hoa thường thì Java và JAVA chỉ còn một.",
         "TreeSet xác định trùng bằng Comparator, không dùng equals. So không phân biệt hoa thường: \"Java\" và \"JAVA\" chỉ còn một.",
         [IN("#od-ci", "pop", 3.0), SHAKE("#od-ci", 3.6), IN("#od-cin", "up", 4.2)]),
        ("Linked HashMap còn làm được một cache tự loại phần tử lâu không dùng, chỉ trong vài dòng: bật thứ tự truy cập, và xoá phần tử cũ nhất khi vượt sức chứa.",
         "LinkedHashMap làm được LRU cache trong vài dòng: bật thứ tự truy cập, tự xoá phần tử cũ nhất khi vượt sức chứa.",
         [OUT("#od-in, #od-h, #od-l, #od-t, #od-ci, #od-cin", "blur", 0, 0.45), IN("#od-code", "left", 0.6)]),
        ("Cache ba phần tử a, b, c. Đọc a thì a thành mới nhất. Thêm d thì b, phần tử lâu không dùng nhất, bị loại.",
         "Cache 3 phần tử [a, b, c]. Đọc a → a thành mới nhất. Thêm d → b (lâu không dùng nhất) bị loại.",
         [IN("#od-s1", "type1", 0.3, 0.4), IN("#od-s2", "type1", 2.0, 0.4), IN("#od-s3", "type1", 3.6, 0.4), IN("#od-ev", "pop", 4.6)]),
    ]),
    # ------------------------------------------------------------ queues
    dict(id="queue", world=(1920, 1080), hud=hud("qu", "Queue, Deque, PriorityQueue", "Stack, hàng đợi, và top-K"), cam="".join([
        big_title("qu", "Queue và Deque", "Stack, hàng đợi, và top-K"),
        el("qu-sl", 220, 200, 560, None, "ArrayDeque làm stack: push 1, 2, 3", "lbl r", "text-align:left"),
        "".join(box(f"qu-s{i}", 300, 520 - (i - 1) * 85, 200, 70, f'<span class="mono">{i}</span>', "cyan") for i in (1, 2, 3)),
        chip("qu-pop", 220, 630, "pop() → 3 · vào sau ra trước", "green"),
        el("qu-ql", 900, 200, 860, None, "ArrayDeque làm queue: offer 1, 2, 3", "lbl r", "text-align:left"),
        "".join(box(f"qu-q{i}", 900 + (i - 1) * 190, 360, 160, 70, f'<span class="mono">{i}</span>', "amber") for i in (1, 2, 3)),
        chip("qu-poll", 900, 470, "poll() → 1 · vào trước ra trước", "green"),
        el("qu-fast", 900, 560, 860, None, "nhanh hơn Stack cũ (synchronized) và LinkedList · không nhận null", "note left r"),
        "".join(chip(f"qu-n{i}", 260 + i * 130, 220, str(v), "cyan") for i, v in enumerate([5, 1, 9, 3, 7, 8, 2])),
        box("qu-heap", 260, 330, 880, 96, '<span class="mono">PriorityQueue (min-heap), giữ tối đa 3 phần tử</span>', "violet"),
        "".join(chip(f"qu-d{i}", 260 + i * 200, 470, f"bỏ {v}", "red") for i, v in enumerate([1, 3, 5, 2])),
        chip("qu-top", 260, 570, "còn lại: 7, 8, 9 · O(n log k)", "green"),
        el("qu-iter", 260, 660, 1400, None, "duyệt PriorityQueue bằng for-each không ra thứ tự sắp xếp; chỉ poll() lần lượt mới đúng", "note left r"),
    ]), beats=[
        ("Thứ tư: hàng đợi.", "Thứ tư: hàng đợi.",
         [TYPE("#qu-big", 0.1, 0.06), IN("#qu-bsub", "blur", 0.6)]),
        ("Cần stack thì dùng ArrayDeque. Push ba số rồi pop: ra số ba, vào sau ra trước.",
         "Cần stack thì dùng ArrayDeque. Push 1, 2, 3 rồi pop: ra 3, vào sau ra trước.",
         [OUT("#qu-big, #qu-bsub", "zoom"), IN("#qu-hud", "left", 0.2), IN("#qu-sl", "blur", 0.4),
          IN("#qu-s1", "down", 1.2), IN("#qu-s2", "down", 1.6), IN("#qu-s3", "down", 2.0), OUT("#qu-s3", "up", 3.4, 0.4),
          IN("#qu-pop", "pop", 3.6)]),
        ("Làm hàng đợi thì offer rồi poll: ra số một, vào trước ra trước. ArrayDeque nhanh hơn cả Stack cũ lẫn LinkedList.",
         "Làm hàng đợi: offer rồi poll, ra 1, vào trước ra trước. ArrayDeque nhanh hơn Stack cũ và LinkedList.",
         [IN("#qu-ql", "blur", 0.2), IN("#qu-q1, #qu-q2, #qu-q3", "left", 0.5, 0.35, 0.2), OUT("#qu-q1", "left", 2.4, 0.4),
          IN("#qu-poll", "pop", 2.6), IN("#qu-fast", "up", 4.4)]),
        ("PriorityQueue luôn đưa phần tử nhỏ nhất ra trước. Bài kinh điển: tìm ba số lớn nhất. Giữ một heap ba phần tử, vượt thì bỏ số nhỏ nhất.",
         "PriorityQueue luôn đưa phần tử nhỏ nhất ra trước. Tìm 3 số lớn nhất: giữ heap 3 phần tử, vượt thì bỏ số nhỏ nhất.",
         [OUT("#qu-sl, #qu-s1, #qu-s2, #qu-pop, #qu-ql, #qu-q2, #qu-q3, #qu-poll, #qu-fast", "blur", 0, 0.45),
          IN(", ".join(f"#qu-n{i}" for i in range(7)), "pop", 0.6, 0.3, 0.1), IN("#qu-heap", "up", 3.0),
          IN(", ".join(f"#qu-d{i}" for i in range(4)), "pop", 5.6, 0.3, 0.3)]),
        ("Còn lại bảy, tám, chín. Độ phức tạp n log k, thay vì sắp xếp cả mảng.",
         "Còn lại 7, 8, 9. Độ phức tạp O(n log k), thay vì sắp xếp cả mảng.",
         [IN("#qu-top", "pop", 0.3), IN("#qu-iter", "up", 2.6)]),
    ]),
    # ------------------------------------------------------------ fail-fast
    dict(id="failfast", world=(1920, 1080), hud=hud("ff", "Fail-fast", "Sửa collection khi đang duyệt"), cam="".join([
        big_title("ff", "Fail-fast", "Sửa collection khi đang duyệt"),
        box("ff-code", 140, 190, 880, 260, win("Main.java") + code(
            "for (String s : names) {\n    if (s.isBlank())\n        names.remove(s);\n}"), "red", "code"),
        el("ff-err", 140, 470, 880, None, "✕ ConcurrentModificationException · kể cả khi chỉ có 1 thread", "err r"),
        chip("ff-m1", 1100, 200, "iterator nhớ modCount lúc tạo", "cyan"),
        chip("ff-m2", 1100, 280, "names.remove() làm modCount tăng", "amber"),
        chip("ff-m3", 1100, 360, "next() thấy khác → ném ngay", "red"),
        box("ff-fix", 140, 580, 880, 170, code("names.removeIf(String::isBlank);   // [an, binh]\n// hoặc: it.remove() qua chính iterator"), "green", "code"),
        box("ff-pen", 1100, 480, 700, 270, win("câu đố đầu bài") + code(
            'xoá "b" khỏi [a, b, c]\nsize = 2, con trỏ = 2\nhasNext() → false\n→ [a, c], "c" bị bỏ qua'), "amber", "code"),
    ]), beats=[
        ("Thứ năm: cơ chế fail fast.", "Thứ năm: cơ chế fail-fast.",
         [TYPE("#ff-big", 0.1, 0.06), IN("#ff-bsub", "blur", 0.6)]),
        ("Xoá phần tử trong vòng for each thường ném Concurrent Modification Exception, kể cả khi chỉ có một thread.",
         "Xoá phần tử trong vòng for-each thường ném ConcurrentModificationException, kể cả khi chỉ có 1 thread.",
         [OUT("#ff-big, #ff-bsub", "zoom"), IN("#ff-hud", "left", 0.2), IN("#ff-code", "left", 0.4), IN("#ff-err", "up", 3.0), SHAKE("#ff-err", 3.6)]),
        ("Vì list có bộ đếm modCount. Iterator nhớ giá trị lúc tạo. Mỗi lần gọi next, nếu thấy khác, nó ném lỗi ngay.",
         "Vì list có bộ đếm modCount. Iterator nhớ giá trị lúc tạo; mỗi lần next() thấy khác là ném lỗi ngay.",
         [IN("#ff-m1", "left", 0.8), IN("#ff-m2", "left", 2.6), IN("#ff-m3", "left", 4.2)]),
        ("Cách đúng: dùng remove if, hoặc xoá qua chính iterator.", "Cách đúng: removeIf, hoặc xoá qua chính iterator.",
         [IN("#ff-fix", "up", 0.3)]),
        ("Còn câu đố đầu bài: xoá phần tử kế cuối thì size còn hai, đúng bằng vị trí con trỏ, nên hasNext trả false và vòng lặp dừng luôn. Fail fast chỉ là cố gắng, không phải đảm bảo.",
         "Câu đố đầu bài: xoá phần tử kế cuối → size còn 2, bằng vị trí con trỏ, hasNext() trả false. Fail-fast chỉ là cố gắng, không phải đảm bảo.",
         [DIM("#ff-code, #ff-err, #ff-m1, #ff-m2, #ff-m3, #ff-fix", 0, 0.25), IN("#ff-pen", "up", 0.4), PULSE("#ff-pen", 7.0)]),
    ]),
    # ------------------------------------------------------------ comparator + unmodifiable lists
    dict(id="compare", world=(1920, 1080), hud=hud("cp", "Comparator & list bất biến", "Hai bẫy cuối"), cam="".join([
        big_title("cp", "Comparator & list bất biến", "Hai bẫy cuối"),
        box("cp-bad", 140, 190, 860, 170, code("Comparator<Integer> bad = (a, b) -> a - b;\nbad.compare(Integer.MIN_VALUE, 1)   // 2147483647"), "red", "code"),
        el("cp-sort", 140, 380, 860, None, "sort bằng a - b: [1, 5, -2147483648] ✕", "note red left r"),
        chip("cp-good", 140, 450, "Integer.compare(a, b) · Comparator.comparingInt(...)", "green"),
        box("cp-tab", 1060, 190, 760, 300, code(
            "                set  add  null  bản chất\nList.of          ✕    ✕    ✕   immutable\n"
            "Arrays.asList    ✓    ✕    ✓   view mảng\nunmodifiable     ✕    ✕    ✓   view chỉ đọc\n"
            "List.copyOf      ✕    ✕    ✕   bản copy"), "violet", "code"),
        line("cp-v", 1060, 520, 760, 'base.add("b") → view [a, b] · copy [a]'),
    ]), beats=[
        ("Cuối cùng: hai cái bẫy nhỏ.", "Cuối cùng: hai cái bẫy nhỏ.",
         [TYPE("#cp-big", 0.1, 0.04), IN("#cp-bsub", "blur", 0.9)]),
        ("So sánh bằng phép trừ a trừ b có thể tràn số. So số âm nhỏ nhất với một mà lại ra số dương.",
         "So sánh bằng a - b có thể tràn số: so Integer.MIN_VALUE với 1 lại ra số dương.",
         [OUT("#cp-big, #cp-bsub", "zoom"), IN("#cp-hud", "left", 0.2), IN("#cp-bad", "left", 0.4)]),
        ("Sắp xếp bằng nó cho kết quả sai. Hãy dùng Integer chấm compare, hoặc Comparator chấm comparing Int.",
         "Sắp xếp bằng nó cho kết quả sai. Dùng Integer.compare, hoặc Comparator.comparingInt.",
         [IN("#cp-sort", "up", 0.3), SHAKE("#cp-sort", 0.9), IN("#cp-good", "pop", 2.4)]),
        ("Các cách tạo list chỉ đọc khác nhau. List chấm of là bất biến thật, không chứa được null. Bản bọc quanh một mảng thì sửa được phần tử, nhưng không thêm bớt.",
         "Các list chỉ đọc khác nhau: List.of bất biến thật, không chứa null; Arrays.asList sửa được phần tử nhưng không thêm bớt.",
         [IN("#cp-tab", "right", 0.4), PULSE("#cp-tab", 3.8)]),
        ("Unmodifiable chỉ là một góc nhìn: list gốc đổi thì nó đổi theo. Cần bản độc lập thì dùng List chấm copy of.",
         "unmodifiableList chỉ là góc nhìn: list gốc đổi thì nó đổi theo. Cần bản độc lập: List.copyOf.",
         [IN("#cp-v", "type1", 0.8, 0.4), PULSE("#cp-v", 2.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 150, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 300, 340, 280, 30, [("grid", "ArrayList", "mặc định cho List"),
                                                ("share", "Linked / Tree", "khi cần thứ tự"),
                                                ("tree", "ArrayDeque", "stack, queue · top-K: heap"),
                                                ("shield", "removeIf", "đừng sửa khi đang duyệt")]),
        chip("ou-next", 660, 660, "Bài tiếp: Lambda & Stream API", "violet"),
        el("ou-cta", 0, 790, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: mặc định dùng ArrayList. Cần thứ tự chèn thì chọn bản Linked, cần sắp xếp thì chọn bản dạng cây. Cần stack hay hàng đợi thì dùng ArrayDeque. Và đừng sửa collection khi đang duyệt.",
         "Mặc định ArrayList · cần thứ tự chèn: Linked…, cần sắp xếp: Tree… · stack/queue: ArrayDeque · đừng sửa khi đang duyệt.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 2.6), IN("#ou-c2", "pop", 6.4), IN("#ou-c3", "pop", 8.4)]),
        ("Bài sau ta học lambda và Stream API.", "Bài sau: Lambda & Stream API.",
         [IN("#ou-next", "pop", 0.4)]),
        ("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.", "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]
