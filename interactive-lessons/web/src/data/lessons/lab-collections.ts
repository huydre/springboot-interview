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
        "Yêu cầu: `LruCache<K, V>` dùng `LinkedHashMap`, không tự viết linked list, ít nhất 5 test. Gợi ý: constructor `(16, 0.75f, true)` bật `accessOrder`, override `removeEldestEntry` trả `size() > capacity`. Kết quả: `[B, C, D]`, `[C, A, D]`, `[C, A, D]`, `[B, C]`, `[B, C, D]`, `Result: 5 passed, 0 failed`. Cache này không thread-safe vì cả `get` cũng sửa cấu trúc.",
      ],
      widget: "lru-cache",
      widgetTitle: "Xem thứ tự LinkedHashMap đổi thế nào",
      quiz: {
        question: "get/put của LRU bằng LinkedHashMap có độ phức tạp?",
        options: ["O(n)", "O(1): HashMap cộng doubly linked list", "O(log n)", "O(n log n)"],
        answer: 1,
        explain: "Production dùng Caffeine.",
      },
    },
    {
      id: "equals",
      title: "Phần 2: Bài 2, equals có nhưng thiếu hashCode",
      scene: "equals",
      intro: [
        "`BrokenUser` override `equals` theo email nhưng không `hashCode`: add 2 object cùng email vào `HashSet` thì `equals` true, hashCode khác, **size 2**, `contains(bản mới)` false. Chạy 6 lần đều như vậy.",
        "Sửa bằng `FixedUser` với `Objects.hash(email)` (cùng tập field với equals) hoặc `record UserRecord(String email)`: size 1, contains true. Output `Result: 3 passed, 0 failed`. Ở dự án hay gặp khi DTO làm key của Map hoặc phần tử Set, và khi dùng Lombok `@EqualsAndHashCode` cho entity.",
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
        "for-each trên `[1, 2, 3, 4, 5, 6]` xoá số chẵn: `ConcurrentModificationException`, list lúc đó `[1, 3, 4, 5, 6]`. Bẫy: `[1, 2, 3, 4]` xoá phần tử áp chót thì **không** lỗi, list `[1, 2, 4]`, số 4 không bao giờ được duyệt. Iterator so `modCount` với `expectedModCount` trong `next()`; `hasNext()` là `cursor != size`.",
        "Ba cách sửa đều ra `[1, 3, 5]`: `removeIf`, `Iterator.remove()`, `stream().filter(...).toList()`. Lưu ý `list.remove(n)` với `Integer` là `remove(Object)`, với `int` là `remove(index)`. Với collection trong entity có `orphanRemoval = true`, `removeIf` vẫn đúng.",
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
        "`Point` có equals/hashCode đúng nhưng field không final. Put rồi đổi `key.x = 99`: `size()` 1, `get(key)` null, `get(new Point(1, 2))` null, `containsValue(\"shop A\")` true. Entry còn trong map nhưng không lấy ra được: memory leak logic. Sửa bằng `record ImmutablePoint`.",
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
