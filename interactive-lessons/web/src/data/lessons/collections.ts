import timeline from "../timelines/collections.json";
import type { Lesson, Scene } from "../types";

// Every Java output quoted below was run on JDK 21 (ArrayList capacity read by reflection).
export const collections: Lesson = {
  slug: "collections",
  crumb: "Collections",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/collections-framework",
  videoVersion: "e08bbe01",
  scenes: timeline as Scene[],
  title: "Collections Framework: chọn đúng, dùng đúng",
  subtitle:
    "ArrayList hay LinkedList, Set và Map giữ thứ tự thế nào, ArrayDeque và PriorityQueue, vì sao xoá phần tử trong vòng lặp lúc ném lỗi lúc không, và những bẫy của Comparator và list chỉ đọc.",
  openingQuiz: {
    question: "Duyệt [a, b, c] bằng for-each, gặp \"b\" thì list.remove(s). Kết quả?",
    options: [
      "ConcurrentModificationException",
      "[a, c], không có exception, nhưng \"c\" không bao giờ được duyệt",
      "[a, c], và cả ba phần tử đều được duyệt",
      "Lỗi biên dịch",
    ],
    answer: 1,
    explain:
      "Xoá phần tử áp chót làm size còn 2, đúng bằng vị trí con trỏ của iterator, nên hasNext() trả false và vòng lặp dừng trước khi kiểm tra modCount. Đã chạy thật: visited [a, b], list [a, c].",
  },
  roadmap: [
    "Chặng 1: bản đồ collections và ArrayList vs LinkedList. Chọn cấu trúc nào, và vì sao ArrayList gần như luôn thắng.",
    "Chặng 2: Set/Map có thứ tự và hàng đợi. HashSet, LinkedHashSet, TreeSet, LRU cache bằng LinkedHashMap, ArrayDeque, PriorityQueue top-K.",
    "Chặng 3: fail-fast, Comparator và list chỉ đọc. ConcurrentModificationException, tràn số khi so bằng a - b, List.of vs Arrays.asList.",
  ],
  sections: [
    {
      id: "collection-map",
      title: "Phần 1: Bản đồ Collections",
      scene: "map",
      intro: [
        "`Collection` có ba nhánh, cộng thêm `Map` đứng riêng:",
        "- **`List`**: có thứ tự, cho trùng.",
        "- **`Set`**: không trùng.",
        "- **`Queue`**: hàng đợi.",
        "- **`Map`**: nhánh riêng, không kế thừa `Collection`, vì nó lưu cặp key → value.",
        "Chọn một nhu cầu để xem nên dùng cấu trúc nào.",
      ],
      widget: "collection-picker",
      widgetTitle: "Bạn cần gì?",
      quiz: {
        question: "Cần stack trong code mới. Chọn gì?",
        options: ["java.util.Stack", "LinkedList", "ArrayDeque", "Vector"],
        answer: 2,
        explain: "Stack kế thừa Vector, mọi method synchronized nên chậm. ArrayDeque nhanh hơn cả Stack lẫn LinkedList cho cả stack và queue.",
      },
    },
    {
      id: "arraylist-linkedlist",
      title: "Phần 2: ArrayList vs LinkedList",
      scene: "list",
      intro: [
        "Trong nhánh `List`, hai lựa chọn hay bị hỏi nhất là ArrayList và LinkedList.",
        "ArrayList là mảng `Object[]`: `get(i)` là một phép đọc mảng, O(1). LinkedList là danh sách liên kết đôi: `get(i)` phải đi qua từng node (từ đầu gần hơn), O(n).",
        "ArrayList đầy thì nới thành `old + (old >> 1)` và copy cả mảng. Kéo số phần tử để xem capacity và số lần copy.",
      ],
      widget: "list-growth",
      widgetTitle: "Capacity của ArrayList, và get(i) tốn bao nhiêu bước",
      after: [
        "Đã đo bằng reflection: capacity 0 khi mới tạo, 10 ở lần add đầu, 15 ở phần tử thứ 11, 22 ở phần tử thứ 16. \"LinkedList chèn giữa nhanh hơn\" chỉ đúng khi đã đứng sẵn ở vị trí đó; tìm tới đó vẫn O(n), và node rải rác không tận dụng được CPU cache.",
        "Bẫy với `List<Integer>`: `list.remove(1)` xoá theo index (→ [10, 30] từ [10, 20, 30]), còn `list.remove(Integer.valueOf(10))` xoá theo giá trị.",
      ],
      takeaway: {
        lines: [
          "Mặc định dùng ArrayList. LinkedList chỉ chèn giữa nhanh khi đã đứng sẵn ở vị trí đó, còn tìm tới đó vẫn O(n).",
        ],
      },
      quiz: {
        question: "new ArrayList<>() rồi add 16 phần tử. Capacity cuối cùng là bao nhiêu?",
        options: ["16", "20", "22", "32"],
        answer: 2,
        explain: "10 → 15 (phần tử thứ 11) → 22 (phần tử thứ 16), mỗi lần tăng old + old/2. Đã đo bằng reflection trên JDK 21.",
      },
    },
    {
      id: "set-map-order",
      title: "Phần 3: Set, Map và thứ tự",
      scene: "order",
      intro: [
        "List giữ vị trí từng phần tử. Sang Set và Map, câu hỏi chính là: duyệt ra theo thứ tự nào?",
        "- **HashSet**: không đảm bảo thứ tự (duyệt theo bucket).",
        "- **LinkedHashSet**: giữ thứ tự chèn.",
        "- **TreeSet**: luôn sắp xếp.",
        "Thứ tự của HashSet bên dưới được tính đúng như JDK: theo bucket, trong cùng bucket theo thứ tự chèn.",
      ],
      widget: "set-order",
      widgetTitle: "Cùng dữ liệu, ba thứ tự",
      after: [
        "TreeSet và TreeMap xác định trùng bằng `compare() == 0`, không gọi `equals`. Đã chạy thật: `new TreeSet<>(String.CASE_INSENSITIVE_ORDER)` thêm \"Java\" rồi \"JAVA\" chỉ còn 1 phần tử.",
        "TreeMap tìm \"gần nhất\": `floorKey(25)` = 20, `ceilingKey(25)` = 30 với key 10, 20, 30; hợp cho bảng giá hay thuế theo bậc.",
      ],
      takeaway: {
        lines: [
          "TreeSet và TreeMap coi hai phần tử là trùng khi `compare() == 0`, không hỏi `equals`.",
        ],
      },
      quiz: {
        question: "TreeMap có key 10, 20, 30. floorKey(5) trả về gì?",
        options: ["10", "null", "0", "Ném NoSuchElementException"],
        answer: 1,
        explain: "floorKey(k) là key lớn nhất mà vẫn <= k. Không có key nào <= 5 nên trả null (không ném lỗi). Đã chạy thật: floorKey(25) = 20, floorKey(5) = null.",
      },
    },
    {
      id: "lru",
      title: "Phần 3b: Tự tay thử LRU cache",
      intro: [
        "**LRU** là viết tắt của Least Recently Used: khi cache đầy thì loại phần tử **lâu nhất chưa được dùng**. Mặc định LinkedHashMap giữ thứ tự chèn, nhưng nó có một chế độ giữ thứ tự truy cập: mỗi lần `get` hay `put` một key, key đó bị đưa về cuối. Phần tử đầu tiên vì vậy luôn là phần tử lâu chưa dùng nhất.",
        "LRU cache bằng LinkedHashMap chỉ cần hai thứ: `super(16, 0.75f, true)`, trong đó tham số thứ ba tên là `accessOrder` và `true` bật chế độ thứ tự truy cập (16 và 0.75f là capacity và load factor như HashMap); và `removeEldestEntry` trả `size() > maxSize`, để mỗi lần put xong mà vượt sức chứa thì phần tử đầu bị xoá. Bấm put/get để xem phần tử nào bị loại.",
      ],
      predict: {
        question: "LRU cache sức chứa 3. `put` a, b, c, rồi `put` d mà không `get` gì. Phần tử nào bị loại?",
        options: ["a", "c", "d", "Không phần tử nào, map tự nới rộng"],
        answer: 0,
        explain: "Chưa có lần `get` nào nên thứ tự truy cập trùng thứ tự chèn. a là phần tử lâu chưa dùng nhất, nằm đầu, nên bị `removeEldestEntry` loại.",
      },
      widget: "lru-cache",
      widgetTitle: "LRU cache, sức chứa 3",
      after: [
        "Class này không thread-safe; trong production nên dùng thư viện cache như Caffeine (giới hạn kích thước, TTL, thread-safe).",
      ],
      quiz: {
        question: "LinkedHashMap(16, 0.75f, true) có removeEldestEntry trả size() > 3. put a, b, c → get(a) → put(d). keySet là gì?",
        options: ["[a, b, c]", "[b, c, d]", "[c, a, d]", "[a, c, d]"],
        answer: 2,
        explain: "accessOrder = true: get(a) đưa a về cuối → [b, c, a]. put(d) vượt 3 nên loại phần tử đầu (lâu không dùng nhất) là b → [c, a, d]. Đã chạy thật.",
      },
    },
    {
      id: "queues",
      title: "Phần 4: Queue, Deque, PriorityQueue",
      scene: "queue",
      intro: [
        "`ArrayDeque` làm stack (`push`/`pop`, LIFO) hoặc queue (`offer`/`poll`, FIFO), nhanh hơn `Stack` và `LinkedList`, và không nhận null. `PriorityQueue` là một **binary heap**: cây nhị phân lưu trong mảng, mỗi node nhỏ hơn hoặc bằng các con của nó. Kiểu heap này gọi là **min-heap**: số nhỏ nhất luôn nằm ở đỉnh, nên `peek()`/`poll()` luôn lấy ra số nhỏ nhất, còn `offer`/`poll` chỉ tốn O(log n) để sắp lại cây.",
        "Top-K lớn nhất nghe ngược, nhưng lại dùng min-heap: giữ heap tối đa K phần tử. Đỉnh heap là số **nhỏ nhất trong top-K hiện tại**, tức là \"người yếu nhất đang được giữ\". Gặp số mới thì thêm vào; vượt K thì `poll()` loại người yếu nhất đó. Đã chạy với [5, 1, 9, 3, 7, 8, 2], K = 3: lần lượt bỏ 1, 3, 5, 2 và còn lại 7, 8, 9. Độ phức tạp O(n log k) thay vì sắp xếp cả mảng.",
      ],
      after: [
        "Duyệt PriorityQueue bằng for-each không ra thứ tự sắp xếp: `new PriorityQueue<>(List.of(5, 1, 9, 3))` duyệt ra [1, 3, 9, 5]. Chỉ `poll()` lần lượt mới đúng thứ tự.",
      ],
      quiz: {
        question: "Tìm 3 số lớn nhất trong n số bằng PriorityQueue. Dùng loại heap nào?",
        options: ["Max-heap chứa cả n số", "Min-heap giữ tối đa 3 phần tử, vượt thì poll", "Sort cả mảng rồi lấy 3 cuối", "TreeSet"],
        answer: 1,
        explain: "Min-heap kích thước k: phần tử nhỏ nhất trong top hiện tại nằm ở đỉnh, có số lớn hơn thì bỏ nó đi. O(n log k), bộ nhớ O(k).",
      },
    },
    {
      id: "fail-fast",
      title: "Phần 5: Fail-fast và ConcurrentModificationException",
      scene: "failfast",
      intro: [
        "Chọn đúng cấu trúc rồi, lỗi hay gặp tiếp theo nằm ở chỗ vừa duyệt vừa sửa.",
        "ArrayList có bộ đếm `modCount`. Iterator nhớ giá trị lúc tạo; mỗi `next()` kiểm tra lại, thấy khác thì ném `ConcurrentModificationException`, kể cả khi chỉ có một thread.",
        "Nhưng `hasNext()` chỉ so `cursor != size`, trong đó `cursor` là vị trí của phần tử kế tiếp mà `next()` sẽ trả về. Chọn phần tử để xoá trong for-each và xem từng bước của iterator.",
      ],
      widget: "fail-fast",
      widgetTitle: "Xoá trong for-each: lúc nào ném lỗi?",
      after: [
        "Mô phỏng khớp JDK 21 cho mọi lựa chọn: với [a, b, c], xoá \"a\" hay \"c\" đều ném CME, chỉ xoá \"b\" (áp chót) là im lặng bỏ qua \"c\". Cách đúng: `names.removeIf(String::isBlank)` hoặc `iterator.remove()`. CopyOnWriteArrayList và ConcurrentHashMap thì không ném CME.",
      ],
      takeaway: {
        lines: [
          "Cần xoá trong lúc duyệt thì dùng `removeIf` hoặc `iterator.remove()`, đừng gọi `list.remove()` trong for-each.",
        ],
      },
      quiz: {
        question: "Vì sao xoá phần tử CUỐI trong for-each vẫn ném CME?",
        options: [
          "Vì phần tử cuối luôn bị khoá",
          "Sau khi xoá, cursor = 3 khác size = 2 nên hasNext() vẫn true, next() thấy modCount đổi và ném lỗi",
          "Vì list rỗng",
          "Không ném, chỉ áp chót mới ném",
        ],
        answer: 1,
        explain: "hasNext() là cursor != size, không phải cursor < size. Xoá phần tử cuối làm cursor vượt size, vòng lặp vẫn gọi next() và gặp kiểm tra modCount.",
      },
    },
    {
      id: "comparator-lists",
      title: "Phần 6: Comparator và list chỉ đọc",
      scene: "compare",
      intro: [
        "Đừng so sánh bằng `(a, b) -> a - b`: đã chạy thật, `compare(Integer.MIN_VALUE, 1)` ra 2147483647 (dương!), và sort [1, MIN_VALUE, 5] ra [1, 5, -2147483648]. Dùng `Integer.compare`, `Comparator.comparingInt` hoặc `Comparator.comparing`.",
        "Ba kiểu list \"không sửa được\" hay bị nhầm:",
        "- **`List.of`**: bất biến thật và không chứa null (kể cả `contains(null)` cũng ném NullPointerException).",
        "- **`Arrays.asList`**: view kích thước cố định của mảng: `set` được (mảng gốc đổi theo) nhưng `add` ném UnsupportedOperationException.",
        "- **`Collections.unmodifiableList`**: chỉ là view chỉ đọc: list gốc thêm \"b\" thì view thành [a, b], còn `List.copyOf` vẫn là [a].",
      ],
      after: [
        "Câu hay hỏi: **Comparable khác Comparator ra sao?** `Comparable` là thứ tự tự nhiên nằm ngay trong class: class tự implement `compareTo`, ví dụ `String`, `Integer`, và `Collections.sort(list)` dùng nó. `Comparator` là thứ tự viết riêng bên ngoài class, truyền vào khi cần, nên một class có được nhiều cách sắp mà không phải sửa class.",
        "Ví dụ `record Emp(String name, int age) implements Comparable<Emp>` so theo tuổi. Với [Lan 30, An 25, Minh 28], đã chạy: `Collections.sort(l)` ra [An, Minh, Lan] (theo tuổi), còn `l.sort(Comparator.comparing(Emp::name))` ra [An, Lan, Minh] (theo tên).",
        "Bẫy với mảng primitive: `Arrays.asList(new int[]{1, 2, 3}).size()` là 1 (một phần tử là cả mảng int[]), còn với `Integer[]` là 3. Java 21 thêm `getFirst()`, `getLast()`, `reversed()` cho List và LinkedHashSet (Deque vốn đã có `getFirst`/`getLast`); `LinkedHashMap` có `firstEntry()`, `lastEntry()`, `reversed()`.",
      ],
      quiz: {
        question: "base = [a]; view = Collections.unmodifiableList(base); copy = List.copyOf(base); base.add(\"b\"). view và copy là gì?",
        options: ["[a] và [a]", "[a, b] và [a]", "[a, b] và [a, b]", "view.add ném lỗi nên base không đổi"],
        answer: 1,
        explain: "unmodifiableList chỉ là cửa sổ nhìn vào list gốc; List.copyOf là bản sao độc lập. Đã chạy thật trên JDK 21.",
      },
    },
  ],
  modelAnswer:
    "Collections có List, Set, Queue và Map là nhánh riêng. Em mặc định dùng ArrayList: mảng động, get theo index O(1), đầy thì nới khoảng 1.5 lần và copy, nên biết trước kích thước thì khai báo capacity. LinkedList get là O(n) và không tận dụng CPU cache nên hầu như không dùng; stack hay queue thì dùng ArrayDeque. Cần thứ tự chèn thì dùng LinkedHashSet hay LinkedHashMap, LinkedHashMap còn làm LRU cache với accessOrder và removeEldestEntry; cần sắp xếp thì TreeSet hay TreeMap, lưu ý chúng so trùng bằng Comparator chứ không phải equals. Top-K thì dùng PriorityQueue kích thước k. Khi duyệt mà cần xoá thì em dùng removeIf hoặc iterator.remove, vì sửa trực tiếp sẽ ném ConcurrentModificationException, và fail-fast chỉ là best-effort. Comparator em dùng Integer.compare chứ không trừ, và để giữ dữ liệu an toàn em dùng List.copyOf thay vì unmodifiableList.",
};
