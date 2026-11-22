"""Lab 1: Collections explainer: scene layouts and per-beat narration + motion.

Every output shown is a real run on JDK 21 of labs/java-labs/lab1-collections (study note 11.01):
LruCacheLab: evict eldest [B, C, D]; get refreshes [C, A, D]; put existing refreshes [C, A, D]; containsKey does not refresh [B, C];
accessOrder=false is FIFO [B, C, D]; 5 passed, 0 failed.
EqualsHashCodeLab: Broken equals=true, sameHash=false, size=2, contains(new)=false; Fixed size=1, contains(new)=true; 3 passed, 0 failed.
ConcurrentModificationLab: Caught ConcurrentModificationException, list now = [1, 3, 4, 5, 6]; remove 2nd-to-last no exception [1, 2, 4];
removeIf / iterator.remove / stream filter -> [1, 3, 5]; 5 passed, 0 failed.
MutableKeyLab: size=1, get(key)=null, get(new Point(1,2))=null, containsValue=true; 2 passed, 0 failed.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def slots(prefix, x, y, keys, tones):
    """A row of key boxes (ids prefix0..n)."""
    return "".join(box(f"{prefix}{i}", x + i * 170, y, 150, 70, f"<b>{k}</b>", t, "card") for i, (k, t) in enumerate(zip(keys, tones)))


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Buổi lab · Java 21", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Đoán, chạy, so sánh"), "h1 center r"),
        chip("hk-s1", 480, 450, "1. Đoán kết quả", "amber"), chip("hk-s2", 800, 450, "2. Chạy thật", "cyan"), chip("hk-s3", 1100, 450, "3. So sánh", "green"),
        console("hk-con", 460, 580, 1000, ["$ java LruCacheLab.java", "PASS evict eldest: [B, C, D]", "Result: 5 passed, 0 failed"]),
        tile("hk-tile", 400, 350, 220, "grid"),
        el("hk-word", 670, 380, 1200, None, letters("Lab 1: Collections"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "LRU cache · equals · ConcurrentModificationException · key mutable", "kin-sub r"),
    ]), beats=[
        ("Hôm nay là buổi lab, không phải bài đọc. Quy tắc: tự viết trước, bí quá mười lăm phút mới mở gợi ý.",
         "Lab, không phải bài đọc: tự viết trước, bí 15 phút mới mở gợi ý.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Mỗi bài là một file Java, chạy thẳng bằng lệnh java. Vòng lặp luôn là: đoán kết quả, chạy thật, rồi so sánh.",
         "Mỗi bài một file, chạy bằng java: đoán, chạy, so sánh.",
         [IN("#hk-s1", "left", 2.4), IN("#hk-s2", "left", 3.2), IN("#hk-s3", "left", 4.0), IN("#hk-con", "up", 4.3, 0.4),
          IN("#hk-con-1", "type1", 4.6, 0.3), IN("#hk-con-2", "type1", 5.1, 0.3), IN("#hk-con-3", "type1", 5.5, 0.3)]),
        ("Bốn bài: cache, equals, vòng lặp, và key. Mỗi bài tái hiện lỗi thật rồi sửa.", "Bốn lỗi Collections kinh điển: tái hiện rồi sửa.",
         [OUT("#hk-eye, #hk-q, #hk-s1, #hk-s2, #hk-s3, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.8)]),
    ]),
    # ------------------------------------------------------------ lru
    dict(id="lru", world=(1920, 1080), hud=hud("lr", "Bài 1: cache tự loại phần tử lâu không dùng", "LinkedHashMap, không tự viết linked list"), cam="".join([
        box("lr-code", 160, 190, 860, 350, win("LruCache extends LinkedHashMap") + code(
            "super(16, 0.75f, true);\n// true = accessOrder\n\nremoveEldestEntry(eldest) {\n    return size() > capacity;\n}"), "cyan", "code"),
        el("lr-l1", 1080, 190, 680, None, "Dự đoán: capacity 3, put A, B, C", "lbl r", "text-align:left"),
        slots("lr-a", 1080, 230, ["A", "B", "C"], ["cyan", "cyan", "cyan"]),
        el("lr-l2", 1080, 330, 680, None, "get(A) rồi put D: ai bị xoá?", "lbl r", "text-align:left"),
        slots("lr-b", 1080, 370, ["B", "C", "A"], ["cyan", "cyan", "amber"]),
        chip("lr-ev", 1080, 460, "B lâu nhất → bị xoá", "red"),
        slots("lr-c", 1080, 530, ["C", "A", "D"], ["green", "green", "green"]),
        console("lr-con", 1080, 640, 680, ["PASS get refreshes key: [C, A, D]", "Result: 5 passed, 0 failed"]),
        chip("lr-t1", 160, 580, "put key đã có cũng tính là truy cập: [C, A, D]", "violet"),
        chip("lr-t2", 160, 640, "containsKey không đổi thứ tự: [B, C]", "amber"),
        chip("lr-t3", 160, 720, "accessOrder = false: thành FIFO [B, C, D]", "red"),
        chip("lr-t4", 160, 820, "Không thread-safe: ngay cả get cũng sửa cấu trúc", "red"),
    ]), beats=[
        ("Bài một: cache tự loại phần tử lâu không dùng. Đừng tự viết linked list. LinkedHashMap đã có sẵn: hàm tạo với tham số cuối true bật access order, và override remove eldest entry trả về size lớn hơn capacity.",
         "Bài 1: LinkedHashMap với accessOrder = true, removeEldestEntry trả size() > capacity.",
         [IN("#lr-hud", "left", 0.1), IN("#lr-code", "up", 0.6)]),
        ("Đoán trước. Capacity ba, đưa vào A, B, C. Rồi get A, và đưa D vào. Phần tử nào bị xoá?",
         "Đoán: capacity 3, put A, B, C, get(A), put D. Ai bị xoá?",
         [IN("#lr-l1", "fade", 0.3), IN("#lr-a0", "pop", 0.9), IN("#lr-a1", "pop", 1.2), IN("#lr-a2", "pop", 1.5),
          IN("#lr-l2", "fade", 2.6), IN("#lr-b0", "pop", 3.6), IN("#lr-b1", "pop", 3.9), IN("#lr-b2", "pop", 4.2)]),
        ("Get A đưa A xuống cuối, nên B là phần tử lâu nhất, và B bị xoá. Chạy thật ra đúng C, A, D.",
         "get(A) đưa A xuống cuối, B bị xoá. Chạy thật: [C, A, D].",
         [IN("#lr-ev", "left", 0.4), IN("#lr-c0", "pop", 1.6), IN("#lr-c1", "pop", 1.9), IN("#lr-c2", "pop", 2.2),
          IN("#lr-con", "up", 2.6, 0.4), IN("#lr-con-1", "type1", 3.0, 0.3), IN("#lr-con-2", "type1", 4.2, 0.3)]),
        ("Hai bẫy khi so sánh. Ghi đè lên khoá cũ cũng tính là truy cập. Còn hàm kiểm tra khoá có tồn tại thì không đổi thứ tự.",
         "Ghi đè key cũ cũng là truy cập; containsKey thì không đổi thứ tự.",
         [IN("#lr-t1", "left", 0.4), IN("#lr-t2", "left", 3.8)]),
        ("Quên access order thì cache thành FIFO. Và cache này không thread safe, vì ngay cả get cũng sửa cấu trúc. Production hãy dùng Caffeine.",
         "Quên accessOrder → FIFO. Không thread-safe vì get cũng sửa cấu trúc.",
         [IN("#lr-t3", "left", 0.4), IN("#lr-t4", "left", 3.8)]),
    ]),
    # ------------------------------------------------------------ equals
    dict(id="equals", world=(1920, 1080), hud=hud("eq", "Bài 2: equals có, hashCode thiếu", "HashSet giữ hai user cùng email"), cam="".join([
        box("eq-code", 160, 190, 860, 260, win("BrokenUser") + code(
            "public boolean equals(Object o) {\n    return email.equals(other.email);\n}\n// hashCode() vẫn của Object"), "red", "code"),
        gnode("eq-n1", 1120, 200, 300, 90, "bucket này: a@mail.com", "cyan"),
        gnode("eq-n2", 1120, 330, 300, 90, "bucket khác: a@mail.com", "cyan"),
        el("eq-q", 1460, 235, 400, None, "hash khác → không bao giờ so equals", "note left r"),
        console("eq-c1", 160, 490, 1500, ["Broken: equals=true, sameHash=false, size=2, contains(new)=false"]),
        box("eq-fix1", 160, 620, 760, 80, "<b>Objects.hash(email), cùng field với equals</b>", "green", "card"),
        box("eq-fix2", 1000, 620, 760, 80, "<b>record UserRecord(String email)</b>", "green", "card"),
        console("eq-c2", 160, 740, 1000, ["Fixed:  size=1, contains(new)=true", "Result: 3 passed, 0 failed"]),
        chip("eq-t1", 1260, 760, "Hay gặp: DTO làm key của Map", "amber"),
        chip("eq-t2", 1260, 840, "Lombok @EqualsAndHashCode cho entity", "violet"),
    ]), beats=[
        ("Bài hai. Class BrokenUser override equals theo email, nhưng quên hash code. Đoán xem: cho hai user cùng email vào HashSet, size là mấy?",
         "Bài 2: equals theo email, thiếu hashCode. Hai user cùng email vào HashSet, size mấy?",
         [IN("#eq-hud", "left", 0.1), IN("#eq-code", "up", 0.5)]),
        ("Chạy thật: equals đúng, nhưng hash code khác nhau, nên size là hai, và contains bản mới ra sai. HashSet chọn bucket bằng hash trước, nên hai object không bao giờ được đem ra so equals.",
         "Chạy thật: size = 2, contains(bản mới) = false. Hash khác → khác bucket.",
         [IN("#eq-n1", "pop", 0.4), IN("#eq-n2", "pop", 1.2), IN("#eq-c1", "up", 2.0, 0.4), IN("#eq-c1-1", "type1", 2.5, 0.3), IN("#eq-q", "left", 6.4)]),
        ("Sửa bằng hai cách: Objects hash trên đúng tập field của equals, hoặc dùng record. Chạy lại: size một, contains đúng.",
         "Sửa: Objects.hash(email) hoặc record. Chạy lại: size = 1, contains = true.",
         [IN("#eq-fix1", "left", 0.4), IN("#eq-fix2", "left", 3.0), IN("#eq-c2", "up", 5.0, 0.4), IN("#eq-c2-1", "type1", 5.5, 0.3), IN("#eq-c2-2", "type1", 6.6, 0.3)]),
        ("Ngoài dự án, lỗi này hay gặp khi DTO làm key của Map, và khi dùng Lombok equals and hash code cho entity.",
         "Ngoài dự án: DTO làm key của Map, Lombok @EqualsAndHashCode cho entity.",
         [IN("#eq-t1", "left", 0.4), IN("#eq-t2", "left", 3.6)]),
    ]),
    # ------------------------------------------------------------ cme
    dict(id="cme", world=(1920, 1080), hud=hud("cm", "Bài 3: ConcurrentModificationException", "Sửa list trong lúc for-each"), cam="".join([
        box("cm-code", 160, 190, 1000, 230, win("for-each") + code(
            "for (Integer n : list) {\n    if (n % 2 == 0) list.remove(n);\n}"), "cyan", "code"),
        chip("cm-m1", 1260, 200, "modCount ≠ expectedModCount", "violet"),
        chip("cm-m2", 1260, 280, "hasNext(): cursor != size", "amber"),
        console("cm-con", 160, 450, 1300, ["Caught: ConcurrentModificationException, list now = [1, 3, 4, 5, 6]"]),
        box("cm-trap", 160, 580, 1600, 90, "<b>[1, 2, 3, 4] xoá phần tử áp chót: không lỗi, [1, 2, 4], số 4 bị bỏ qua</b>", "red", "card"),
        box("cm-f1", 160, 700, 380, 90, "<b>removeIf → [1, 3, 5]</b>", "green", "card"),
        box("cm-f2", 570, 700, 540, 90, "<b>Iterator.remove() → [1, 3, 5]</b>", "green", "card"),
        box("cm-f3", 1140, 700, 640, 90, "<b>stream().filter().toList() → [1, 3, 5]</b>", "green", "card"),
        chip("cm-t1", 160, 820, "remove(Integer) là remove(Object); remove(int) là remove(index)", "amber"),
        chip("cm-t2", 160, 890, "Chỉ một thread vẫn bị: lỗi thường là sửa lúc đang duyệt", "violet"),
    ]), beats=[
        ("Bài ba. For each trên danh sách một đến sáu, xoá số chẵn. Đoán xem: chuyện gì xảy ra?",
         "Bài 3: for-each trên [1..6], xoá số chẵn. Chuyện gì xảy ra?",
         [IN("#cm-hud", "left", 0.1), IN("#cm-code", "up", 0.5)]),
        ("Chạy thật: Concurrent Modification Exception, và danh sách còn một, ba, bốn, năm, sáu. Lỗi nằm ngay trong một thread, không cần đa luồng. Iterator so mod count lúc tạo với hiện tại trong hàm next.",
         "Chạy thật: ném CME, list còn [1, 3, 4, 5, 6]. Một thread cũng bị.",
         [IN("#cm-con", "up", 0.4, 0.4), IN("#cm-con-1", "type1", 0.8, 0.3), IN("#cm-m1", "left", 5.0), IN("#cm-t2", "left", 8.0)]),
        ("Bẫy nằm ở đây: danh sách một, hai, ba, bốn, xoá phần tử áp chót thì không lỗi. Vì has next chỉ so cursor với size, nên số bốn không bao giờ được duyệt.",
         "Bẫy: xoá phần tử áp chót thì không lỗi, nhưng số 4 bị bỏ qua.",
         [IN("#cm-m2", "left", 0.4), IN("#cm-trap", "left", 1.8), SHAKE("#cm-trap", 3.0)]),
        ("Ba cách sửa đều ra một, ba, năm: remove if, Iterator remove, hoặc stream filter.",
         "Ba cách sửa đều ra [1, 3, 5].",
         [IN("#cm-f1", "up", 0.4), IN("#cm-f2", "up", 1.8), IN("#cm-f3", "up", 3.2)]),
        ("Và nhớ: remove với Integer là xoá theo object, còn với int là xoá theo vị trí.",
         "remove(Integer) xoá theo object, remove(int) xoá theo vị trí.",
         [IN("#cm-t1", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ mutable key
    dict(id="mutable", world=(1920, 1080), hud=hud("mk", "Bonus: key mutable", "equals, hashCode đúng vẫn mất entry"), cam="".join([
        box("mk-code", 160, 190, 860, 220, win("Point") + code(
            "map.put(key, \"shop A\");   // key = Point(1, 2)\nkey.x = 99;               // field không final"), "red", "code"),
        gnode("mk-n1", 1120, 200, 640, 90, "bucket theo hash cũ: shop A", "cyan"),
        gnode("mk-n2", 1120, 340, 640, 90, "get(key): hash mới, bucket trống", "amber"),
        wires(trace("mk-a", [(1440, 295), (1440, 335)], "amber")),
        console("mk-con", 160, 470, 1300, ["size=1, get(key)=null, get(new Point(1,2))=null, containsValue=true"]),
        el("mk-leak", 160, 620, 1600, None, "Entry vẫn nằm trong map nhưng không lấy ra được: memory leak logic", "warnbox r"),
        box("mk-fix", 160, 740, 760, 90, "<b>record ImmutablePoint</b>", "green", "card"),
        chip("mk-t", 1000, 765, "String, wrapper hoặc record làm key", "green"),
    ]), beats=[
        ("Bài thưởng: key mutable. Point có equals và hash code đúng, nhưng field không final. Đưa vào map rồi đổi x thành chín mươi chín. Đoán xem: get có lấy lại được không?",
         "Bonus: Point đúng equals/hashCode nhưng field không final. put rồi đổi key.x = 99, get được không?",
         [IN("#mk-hud", "left", 0.1), IN("#mk-code", "up", 0.5)]),
        ("Chạy thật: size vẫn là một, nhưng get bằng key cũ hay key mới đều trả về null, còn contains value thì đúng. Bucket được tính từ hash lúc đưa vào, đổi field rồi thì get tìm sai bucket.",
         "Chạy thật: size = 1, get = null cả hai cách, containsValue = true.",
         [IN("#mk-n1", "pop", 0.4), *ARROW("mk-a", 1.8), IN("#mk-n2", "pop", 2.4), IN("#mk-con", "up", 3.6, 0.4), IN("#mk-con-1", "type1", 4.0, 0.3)]),
        ("Entry còn trong map mà không lấy ra được, đó là memory leak về mặt logic. Sửa bằng record bất biến: dùng String, wrapper, hoặc record làm key.",
         "Entry còn mà không lấy ra được. Sửa: key bất biến (record, String, wrapper).",
         [IN("#mk-leak", "up", 0.4), IN("#mk-fix", "left", 3.6), IN("#mk-t", "left", 5.0)]),
    ]),
    # ------------------------------------------------------------ checklist
    dict(id="checklist", world=(1920, 1080), hud=hud("ck", "Checklist hoàn thành", "Chỉ đánh dấu khi đã làm xong trên máy của bạn"), cam="".join([
        card4("ck-q", 160, 230, 380, 260, 26, [("grid", "Cache LRU", "cài trong 90 giây"), ("hash", "equals thiếu hashCode", "vì sao size = 2"),
                                               ("split", "CME", "khi nào ném, khi nào im"), ("lock", "Key bất biến", "vì sao nên dùng record")]),
        chip("ck-t1", 160, 580, "Bốn câu phỏng vấn, mỗi câu trả lời to dưới 90 giây", "violet"),
        chip("ck-t2", 160, 660, "Đoán trước khi chạy từng file, rồi mới so với kết quả", "amber"),
        chip("ck-t3", 160, 740, "Cuối cùng: ghi ngày 6 vào nhật ký học tập", "green"),
    ]), beats=[
        ("Cuối buổi lab là checklist. Bốn câu phỏng vấn cần trả lời to, mỗi câu dưới chín mươi giây: cài cache, equals thiếu hash code, khi nào có Concurrent Modification Exception, và vì sao key nên bất biến.",
         "4 câu phỏng vấn, mỗi câu dưới 90 giây: cache, equals/hashCode, CME, key bất biến.",
         [IN("#ck-hud", "left", 0.1), IN("#ck-q0", "pop", 2.2), IN("#ck-q1", "pop", 4.5), IN("#ck-q2", "pop", 6.8), IN("#ck-q3", "pop", 9.0), IN("#ck-t1", "left", 10.2)]),
        ("Trước khi chạy mỗi file, hãy đoán kết quả. Và chỉ đánh dấu mục nào bạn thật sự làm xong trên máy của mình.",
         "Đoán trước khi chạy; chỉ đánh dấu khi đã làm xong.",
         [IN("#ck-t2", "left", 0.4), DIM("#ck-q0, #ck-q1, #ck-q2, #ck-q3, #ck-t1", 3.0, 0.3)]),
        ("Mục cuối: ghi ngày sáu vào nhật ký học tập.", "Mục cuối: ghi ngày 6 vào nhật ký học tập.", [IN("#ck-t3", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "LinkedHashMap", "accessOrder + removeEldestEntry"),
                                                ("hash", "equals + hashCode", "đi cùng một tập field"),
                                                ("split", "CME", "removeIf hoặc Iterator.remove"),
                                                ("lock", "Key bất biến", "record, String, wrapper")]),
        chip("ou-next", 660, 650, "Bài tiếp: Lab 2: Stream Queries", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để đoán kết quả và làm checklist", "cta r"),
    ]), beats=[
        ("Tóm lại: cache dùng LinkedHashMap với access order. Equals và hash code luôn đi cùng nhau. Xoá khi duyệt thì dùng remove if. Và key của map phải bất biến.",
         "LinkedHashMap accessOrder · equals + hashCode · removeIf · key bất biến.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.0), IN("#ou-c2", "pop", 6.8), IN("#ou-c3", "pop", 9.6)]),
        ("Bài tiếp: lab hai, truy vấn bằng stream.", "Bài tiếp: Lab 2: Stream Queries.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác, đoán kết quả, và tự tay chạy từng file nhé.",
         "Mở bài học tương tác, đoán kết quả và tự chạy từng file nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
