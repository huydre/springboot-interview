import timeline from "../timelines/lab-collections.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.01; expected results are real outputs of labs/java-labs/lab1-collections on JDK 21.
export const labCollections: Lesson = {
  slug: "lab-collections",
  crumb: "Lab 1: Collections",
  videoDir: "/videos/lab-collections",
  videoVersion: "b5468526",
  scenes: timeline as Scene[],
  title: "Lab 1: Collections",
  subtitle:
    "Tự tay tái hiện rồi sửa ba lỗi Collections kinh điển: LRU cache bằng LinkedHashMap, equals thiếu hashCode, ConcurrentModificationException, và bonus key mutable trong HashMap. Khoảng 2 giờ.",
  openingQuiz: {
    question: "Quy tắc của buổi lab là gì?",
    options: ["Mở lời giải trước cho nhanh", "Tự viết trước; bí quá 15 phút mới mở gợi ý; vẫn bí thì xem lời giải, hiểu xong xoá đi và gõ lại", "Chỉ đọc lời giải", "Bỏ qua phần test"],
    answer: 1,
    explain: "\"Em đã tự chạy và thấy\" thuyết phục hơn \"em đã đọc\".",
  },
  roadmap: [
    "Chặng 1: chuẩn bị và LRU cache.",
    "Chặng 2: equals/hashCode và ConcurrentModificationException.",
    "Chặng 3: key mutable, đoán kết quả, checklist.",
  ],
  sections: [
    {
      id: "setup",
      title: "Phần 1: Chuẩn bị và bài 1, LRU cache",
      scene: "lru",
      intro: [
        "Mỗi bài là một file Java độc lập, không cần Maven hay JUnit, chạy thẳng bằng `java LruCacheLab.java` trên JDK 21. Mỗi file có hàm `check(name, ok)` in `PASS`/`FAIL` làm unit test mini. Lời giải ở `labs/java-labs/lab1-collections/`.",
        "**LRU** là Least Recently Used: khi cache đầy, xoá phần tử **lâu nhất không được dùng**. Yêu cầu: viết `LruCache<K, V>` dựa trên `LinkedHashMap`, không tự viết linked list, có ít nhất 5 test.",
        "Gợi ý 1: gọi constructor `super(16, 0.75f, true)`. Ba tham số là sức chứa ban đầu (16), load factor (0.75, đầy 75% thì nới rộng) và `accessOrder`. `accessOrder = true` nghĩa là xếp theo **thứ tự truy cập** thay vì thứ tự thêm vào: mỗi lần `get` hay `put` một key, key đó được chuyển xuống cuối danh sách. Phần tử đầu danh sách vì thế luôn là phần tử lâu nhất không được dùng.",
        "Gợi ý 2: override `removeEldestEntry` trả `size() > capacity`. `LinkedHashMap` gọi method này sau mỗi `put`, và nếu nó trả `true` thì tự xoá phần tử đầu danh sách. Đó chính là bước \"xoá phần tử lâu nhất\" của LRU, bạn không phải tự viết.",
        "Cache này không thread-safe, vì với `accessOrder = true` thì cả `get` cũng sửa cấu trúc (chuyển key xuống cuối). Năm test và kết quả xem ở phần dưới.",
      ],
      widget: "lru-cache",
      widgetTitle: "Xem thứ tự LinkedHashMap đổi thế nào",
      quiz: {
        question: "get/put của LRU bằng LinkedHashMap có độ phức tạp?",
        options: ["O(n)", "O(1): HashMap cộng doubly linked list", "O(log n)", "O(n log n)"],
        answer: 1,
        explain: "HashMap tìm key trong O(1), danh sách liên kết hai chiều chuyển key xuống cuối trong O(1). Production dùng Caffeine.",
      },
      parts: [
        {
          id: "lru-tests",
          title: "5 test và kết quả",
          intro: [
            "Mỗi test là một kịch bản nhỏ; đọc kịch bản rồi đoán trước khi xem kết quả. Đã chạy `java LruCacheLab.java` trên JDK 21.",
            "Test 1, vượt sức chứa: cache 3, put A, B, C, rồi put D. A là phần tử lâu nhất nên bị xoá. Kết quả: `[B, C, D]`.",
            "Test 2, `get` làm key trẻ lại: cache 3, put A, B, C, rồi `get(A)` (thứ tự thành B, C, A), rồi put D. Lúc này B là lâu nhất nên bị xoá. Kết quả: `[C, A, D]`.",
            "Test 3, ghi đè key cũ **cũng tính là truy cập**: cache 3, put A, B, C, rồi `put(A, 100)` (thứ tự B, C, A, size vẫn 3), rồi put D. B bị xoá. Kết quả: `[C, A, D]`.",
            "Test 4, `containsKey` **không** tính là truy cập: cache 2, put A, B, rồi `containsKey(A)`, rồi put C. Thứ tự không đổi nên A vẫn là lâu nhất và bị xoá. Kết quả: `[B, C]`.",
            "Test 5, quên `accessOrder` (để `false`): put A, B, C, `get(A)`, put D. `get` không đổi thứ tự nên A bị xoá dù vừa được dùng: cache thành FIFO (vào trước ra trước). Kết quả: `[B, C, D]`.",
            "Dòng cuối: `Result: 5 passed, 0 failed`.",
          ],
          quiz: {
            question: "Cache LRU sức chứa 2: put A, put B, containsKey(A), put C. Còn lại những key nào?",
            options: ["[A, C]", "[B, C]", "[A, B]", "[C]"],
            answer: 1,
            explain: "containsKey không phải truy cập nên không đổi thứ tự; A vẫn là lâu nhất và bị xoá. Đã chạy: [B, C]. Nếu là get(A) thì kết quả là [A, C].",
          },
        },
      ],
    },
    {
      id: "equals",
      title: "Phần 2: Bài 2, equals có nhưng thiếu hashCode",
      scene: "equals",
      intro: [
        "`BrokenUser` override `equals` theo email nhưng không `hashCode`: add 2 object cùng email vào `HashSet` thì `equals` true, hashCode khác, **size 2**, `contains(bản mới)` false.",
        "Vì sao: `HashSet` chọn bucket bằng `hashCode` **trước**, rồi chỉ gọi `equals` với các phần tử trong cùng bucket. Không override `hashCode` thì mỗi object có hash riêng, hai object rơi vào hai bucket khác nhau và **không bao giờ được so bằng `equals`**.",
        "Sửa bằng `FixedUser` với `Objects.hash(email)` (cùng tập field với equals) hoặc `record UserRecord(String email)`: size 1, contains true. Output `Result: 3 passed, 0 failed`. Ở dự án hay gặp khi DTO làm key của Map hoặc phần tử Set.",
      ],
      widget: "hashset",
      widgetTitle: "Bucket của HashSet",
      quiz: {
        question: "HashSet.add() gọi gì trước?",
        options: ["equals", "hashCode để chọn bucket, chỉ gọi equals với phần tử cùng bucket và cùng hash", "compareTo", "toString"],
        answer: 1,
        explain: "HashSet bên trong là HashMap.",
      },
    },
    {
      id: "cme",
      title: "Phần 3: Bài 3, ConcurrentModificationException",
      scene: "cme",
      intro: [
        "Kịch bản 1: for-each trên `[1, 2, 3, 4, 5, 6]`, gặp số chẵn thì `list.remove(n)`. Đã chạy: `ConcurrentModificationException`, list lúc đó `[1, 3, 4, 5, 6]` (số 2 đã bị xoá rồi mới lỗi).",
        "Vì sao: for-each dùng một `Iterator` ngầm. List có biến đếm `modCount`, tăng mỗi lần list đổi cấu trúc (thêm, xoá). Iterator nhớ giá trị lúc nó được tạo (`expectedModCount`), và mỗi lần `next()` nó so hai số; khác nhau nghĩa là có ai sửa list sau lưng nó, nên ném CME.",
        "Kịch bản 2 (bẫy): for-each trên `[1, 2, 3, 4]`, gặp **số 3** (phần tử áp chót) thì xoá nó. Đã chạy: **không** lỗi, list `[1, 2, 4]`, nhưng số 4 không bao giờ được duyệt.",
        "Vì sao: iterator có `cursor`, là vị trí phần tử tiếp theo nó sẽ đọc, và `hasNext()` chỉ kiểm tra `cursor != size`. Đọc xong số 3 thì `cursor = 3`; xoá số 3 làm `size` còn 3. `hasNext()` thấy `3 == 3` nên trả `false`, vòng lặp dừng trước khi kịp gọi `next()`, nên cũng không có lần kiểm tra `modCount` nào.",
        "Ba cách sửa đều ra `[1, 3, 5]`: `removeIf`, `Iterator.remove()` (iterator tự cập nhật `expectedModCount`), `stream().filter(...).toList()`. Lưu ý `list.remove(n)` với `Integer` là `remove(Object)`, với `int` là `remove(index)`.",
      ],
      widget: "fail-fast",
      widgetTitle: "Chạy lại iterator từng bước",
      quiz: {
        question: "CME chỉ xảy ra khi đa luồng?",
        options: ["Đúng", "Sai: phần lớn xảy ra ngay trong một thread khi sửa collection lúc đang duyệt", "Chỉ với HashMap", "Chỉ với LinkedList"],
        answer: 1,
        explain: "Đa luồng thì dùng CopyOnWriteArrayList hoặc ConcurrentHashMap.",
      },
    },
    {
      id: "mutable-key",
      title: "Phần 4: Bonus, key mutable và tự kiểm tra",
      scene: "mutable",
      intro: [
        "`Point` có equals/hashCode đúng nhưng field không final. Put rồi đổi `key.x = 99`: `size()` 1, `get(key)` trả `null`, `get(new Point(1, 2))` trả `null`, `containsValue(\"shop A\")` true. Entry còn trong map nhưng không lấy ra được: memory leak logic. Sửa bằng `record ImmutablePoint`.",
        "Trước khi chạy từng file, đoán kết quả ở widget bên dưới, rồi đánh dấu checklist. Bốn câu phỏng vấn cần trả lời to dưới 90 giây: cài LRU, equals thiếu hashCode, CME khi nào, vì sao key nên bất biến.",
      ],
      widget: "lab1-predict",
      widgetTitle: "Đoán trước khi chạy",
      quiz: {
        question: "Vì sao key của HashMap nên bất biến?",
        options: ["Cho nhanh", "Bucket tính từ hash lúc put; đổi field thì get tìm sai bucket hoặc equals sai", "Vì Java bắt buộc", "Để tiết kiệm bộ nhớ"],
        answer: 1,
        explain: "Dùng String, wrapper hoặc record làm key.",
      },
    },
    {
      id: "checklist",
      title: "Phần 5: Checklist hoàn thành",
      scene: "checklist",
      intro: ["Đánh dấu từng mục khi bạn thật sự làm xong trên máy của mình. Mục cuối: ghi ngày 6 vào nhật ký học tập."],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 1",
    },
  ],
  modelAnswer:
    "Em tự làm lab Collections trên JDK 21. LRU cache em viết bằng LinkedHashMap với accessOrder true và removeEldestEntry, get và put đều O(1); em viết test và thấy containsKey không làm đổi thứ tự, còn quên accessOrder thì cache thành FIFO. Override equals mà thiếu hashCode thì em tái hiện được HashSet giữ 2 user cùng email và contains trả false; sửa bằng Objects.hash hoặc record. ConcurrentModificationException em tái hiện ngay trong một thread khi xoá trong for-each, và bẫy xoá phần tử áp chót thì không lỗi mà phần tử cuối bị bỏ qua; sửa bằng removeIf hoặc Iterator.remove. Cuối cùng key mutable làm entry bị mất dù size vẫn là 1, nên em dùng key bất biến.",
};
