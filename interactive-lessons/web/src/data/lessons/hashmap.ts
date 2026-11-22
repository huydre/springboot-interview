import timeline from "../timelines/hashmap.json";
import type { Lesson, Scene } from "../types";

// Every number below was measured on JDK 21 by reflecting on HashMap.table and threshold.
export const hashmap: Lesson = {
  slug: "hashmap",
  crumb: "HashMap",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/hashmap-internals",
  videoVersion: "9b5ebcce",
  scenes: timeline as Scene[],
  title: "HashMap Internals: bên trong một cái bảng băm",
  subtitle:
    "Câu gần như chắc chắn bị hỏi ở level 2 năm. Từ key đến bucket, put và get chạy thế nào, khi nào bucket thành cây đỏ đen, khi nào table gấp đôi, và vì sao key bị sửa sau khi put thì entry mất tích.",
  openingQuiz: {
    question: "HashMap mặc định (capacity 16) resize ở lần put thứ mấy?",
    options: ["Lần thứ 16", "Lần thứ 13", "Lần thứ 12", "Lần thứ 17"],
    answer: 1,
    explain:
      "threshold = 16 × 0.75 = 12. Resize xảy ra khi size vượt threshold, tức phần tử thứ 13: table lên 32, threshold mới 24. Đã đo bằng reflection trên JDK 21.",
  },
  roadmap: [
    "Khởi động: dùng HashMap qua ví dụ bảng giá quán phở. put, get, putIfAbsent, merge, duyệt map, và khi nào chọn TreeMap hay LinkedHashMap.",
    "Chặng 1: từ key đến bucket, rồi put và get. hash() trộn bit, (n - 1) & hash chọn bucket, so hash rồi equals.",
    "Chặng 2: collision, treeify và resize. Ba ngưỡng 8, 64, 6, load factor 0.75, và mẹo chia node khi gấp đôi table.",
    "Chặng 3: bẫy key bị sửa sau khi put, null key, thứ tự duyệt và thread-safety.",
  ],
  sections: [
    {
      id: "map-basics",
      title: "Phần 1: Dùng HashMap: bảng giá quán phở",
      intro: [
        "Trước khi mổ xẻ bên trong, hãy dùng HashMap cho quen tay. Một quán phở có bảng giá: mỗi **món** (key) ứng với đúng một **giá** (value). Đó chính là một `Map<String, Integer>`: tra theo tên món để ra giá, không cần duyệt cả danh sách.",
        "Các thao tác hay dùng nhất:",
        "- **put / get**: thêm hoặc sửa giá, tra giá theo tên món.",
        "- **containsKey / getOrDefault**: kiểm tra có món chưa, hoặc lấy giá mặc định khi không có.",
        "- **replace / putIfAbsent**: chỉ sửa khi đã có, hoặc chỉ thêm khi chưa có.",
        "- **remove / size**: bỏ một món, đếm số món.",
        "- **entrySet / merge**: duyệt cả key lẫn value, gộp giá trị mới vào giá trị cũ.",
        "Khai báo biến bằng interface `Map` thay vì `HashMap`, để sau này đổi sang `TreeMap` hay `LinkedHashMap` mà không phải sửa code dùng nó. Bấm chạy từng dòng và để ý bảng bên phải thay đổi ra sao.",
      ],
      predict: {
        question: "Thêm lần lượt `Tái`, `Tái Nạm`, `Gà` vào một `HashMap` rồi in ra. Món nào đứng đầu?",
        options: ["Tái, vì được thêm đầu tiên", "Gà, vì thứ tự phụ thuộc hash của key, không phụ thuộc lúc thêm", "Tái Nạm, vì tên dài nhất", "Mỗi lần chạy ra một thứ tự ngẫu nhiên"],
        answer: 1,
        explain: "Đã chạy trên JDK 21: in ra `{Gà=15000, Tái=20000, Tái Nạm=25000}`. HashMap đặt entry theo bucket tính từ hash của key, nên thứ tự in không phải thứ tự thêm. Thứ tự này ổn định giữa các lần chạy với cùng dữ liệu, nhưng không được dựa vào nó.",
      },
      widget: "pho-map",
      widgetTitle: "Bảng giá quán phở: chạy từng dòng",
      takeaway: {
        lines: [
          "Một key chỉ có một value: `put` lên key đã có là ghi đè và trả về giá trị cũ.",
          "Cần thứ tự thì chọn đúng loại map: `HashMap` không có thứ tự, `LinkedHashMap` giữ thứ tự thêm vào, `TreeMap` sắp theo key.",
        ],
      },
      quiz: {
        question: "`gia` đang có `Gà=15000`. Gọi `gia.replace(\"Tái Chín\", 21000)` (chưa có Tái Chín) và `gia.put(\"Gà\", 13000)`. Kết quả?",
        options: [
          "replace thêm Tái Chín; put trả về 13000",
          "replace không làm gì và trả về null; put ghi đè Gà và trả về 15000",
          "Cả hai đều ném exception",
          "replace thêm Tái Chín; put không đổi gì vì Gà đã có",
        ],
        answer: 1,
        explain: "replace chỉ sửa key đã tồn tại, nên trả về null và map giữ nguyên. put ghi đè value và trả về value cũ 15000. Đã chạy trên JDK 21.",
      },
    },
    {
      id: "key-to-bucket",
      title: "Phần 2: Từ key đến bucket",
      scene: "index",
      intro: [
        "Bên trong HashMap là mảng `table`, mỗi ô là một bucket, độ dài luôn là luỹ thừa của 2 (mặc định 16). Table chỉ được tạo ở lần `put` đầu tiên.",
        "Chọn bucket qua hai bước: `hash = h ^ (h >>> 16)` kéo 16 bit cao xuống trộn vào bit thấp, rồi `index = (n - 1) & hash` giữ lại vài bit cuối. Gõ thử một key bất kỳ.",
      ],
      widget: "hash-index",
      widgetTitle: "Gõ key, xem nó rơi vào bucket nào",
      after: [
        "Đã chạy thật: `\"hello\".hashCode()` = 99162322, sau khi trộn là 99163451, rơi vào bucket 11 của table 16 ô. Vì vậy `new HashMap<>(10)` vẫn được làm tròn lên 16: capacity phải là luỹ thừa của 2 thì phép AND mới thay được phép chia.",
        "Vì sao AND thay được phép chia lấy dư? Với n = 16 thì `n - 1` = 15, viết nhị phân là `1111`. Phép `&` (AND từng bit) với `1111` giữ lại đúng 4 bit cuối của hash và xoá hết phần còn lại. Mà 4 bit cuối chính là phần dư khi chia cho 16 (giống như 2 chữ số cuối của một số thập phân là phần dư khi chia cho 100). Ví dụ hash của `\"hello\"` sau khi trộn là 99163451, nhị phân kết thúc bằng `...1011`, tức 11: đã chạy, `99163451 & 15` và `99163451 % 16` đều ra 11.",
        "Lý do thứ hai: hashCode có thể âm, và với số âm thì `%` của Java ra số âm, không dùng làm index mảng được. AND thì luôn ra số từ 0 tới n - 1. Đã chạy với key `\"payment\"`: hash sau khi trộn là -786636006, `% 16` ra -6, còn `& 15` ra 10.",
      ],
      takeaway: {
        lines: [
          "`hashCode()` → trộn `h ^ (h >>> 16)` → `(n - 1) & hash` → bucket. Phép AND chỉ thay được phép chia khi n là luỹ thừa của 2.",
        ],
      },
      quiz: {
        question: "Vì sao HashMap trộn h ^ (h >>> 16) trước khi tính index?",
        options: [
          "Để hash luôn dương",
          "Vì index chỉ dùng vài bit thấp; trộn để bit cao cũng ảnh hưởng tới bucket, tránh dồn key",
          "Để mã hoá key cho an toàn",
          "Để hashCode nhanh hơn",
        ],
        answer: 1,
        explain: "Table 16 ô chỉ dùng 4 bit cuối. Nếu các key chỉ khác nhau ở bit cao, không trộn thì chúng dồn hết vào một bucket.",
      },
    },
    {
      id: "put-get",
      title: "Phần 3: put() và get() chạy thế nào",
      scene: "put",
      intro: [
        "Phần 2 đã chọn được bucket. Giờ xem chuyện gì xảy ra bên trong bucket đó:",
        "- **Bucket rỗng**: đặt `Node` mới (lưu sẵn `hash`, `key`, `value`, `next`).",
        "- **Bucket đã có node**: duyệt, so `hash` trước vì rẻ, rồi mới `equals`.",
        "- **Trùng key**: ghi đè value và trả về value cũ. Không trùng thì nối node mới vào cuối.",
        "`\"hello\"` và `\"grape\"` cùng rơi vào bucket 11 của table 16 ô. Thử put chúng và put lại một key cũ.",
      ],
      widget: "hashmap-put",
      widgetTitle: "put() từng bước trên table 16 ô",
      after: [
        "`get()` đi đúng đường đó: hash dẫn tới bucket, equals chọn node. Đây là lý do contract equals/hashCode quan trọng. Trung bình O(1); xấu nhất (mọi key cùng bucket) là O(n) với list, O(log n) khi bucket đã thành cây.",
      ],
      quiz: {
        question: "map.put(\"k\", 1); map.put(\"k\", 2); lần put thứ hai trả về gì?",
        options: ["null", "1", "2", "true"],
        answer: 1,
        explain: "put trả về value cũ của key (null nếu chưa có). Đã chạy thật: lần đầu null, lần hai 1, và get(\"k\") là 2.",
      },
    },
    {
      id: "treeify",
      title: "Phần 4: Collision và treeify",
      scene: "treeify",
      intro: [
        "Phần 3 thấy hai key có thể chung một bucket. Nếu rất nhiều key cùng dồn vào một bucket thì sao?",
        "Collision không làm sai kết quả, chỉ làm chậm. Đã chạy thật: 1000 key cùng `hashCode() = 42` vẫn cho `size = 1000` và `get` đúng.",
        "Bucket vượt quá 8 node (lúc thêm node thứ 9) và table ≥ 64 thì list thành red-black tree. Table < 64 thì resize thay vì treeify. Bấm thêm từng key cùng hashCode với hai kích thước table.",
      ],
      widget: "treeify",
      widgetTitle: "Dồn key cùng hashCode vào một bucket",
      after: [
        "Vì sao 8? Với hash tốt, xác suất một bucket có 8 node chỉ khoảng 6 phần trăm triệu, nên treeify gần như chỉ xảy ra khi hashCode tệ hoặc bị tấn công hash flooding (kẻ tấn công cố tình gửi rất nhiều key có cùng hashCode, ví dụ làm tên tham số HTTP, để dồn tất cả vào một bucket và làm server chậm hẳn). Tree còn ≤ 6 node thì quay về list; khoảng đệm 6 ↔ 8 tránh chuyển qua lại liên tục. TreeNode tốn gấp khoảng đôi bộ nhớ so với Node, nên không dùng cây ngay từ đầu.",
      ],
      quiz: {
        question: "Table đang 16 ô, một bucket vừa nhận node thứ 9. HashMap làm gì?",
        options: ["Treeify ngay", "Resize lên 32 thay vì treeify", "Ném exception", "Bỏ qua node mới"],
        answer: 1,
        explain: "MIN_TREEIFY_CAPACITY = 64. Table nhỏ thì bucket đông thường do thiếu chỗ, giãn table rẻ hơn dựng cây. Đo thật: node 9 → 32, node 10 → 64, node 11 mới thành TreeNode.",
      },
    },
    {
      id: "resize",
      title: "Phần 5: Resize",
      scene: "resize",
      intro: [
        "Table càng rộng thì càng ít key chung bucket. Vậy table rộng ra lúc nào?",
        "`threshold = capacity × 0.75`. Mặc định 16 × 0.75 = 12, nên phần tử thứ 13 làm table gấp đôi lên 32. Khi chuyển node, Java 8 không tính lại index: node có `(hash & oldCap) == 0` ở nguyên `i`, còn lại sang `i + oldCap` (hash 5 ở lại bucket 5, hash 21 sang 21).",
        "Vì sao chỉ cần xét `hash & oldCap`? Gấp đôi table thì mask đổi từ `n - 1` = `1111` (15) thành `11111` (31): chỉ thêm **đúng một bit**, và bit đó có giá trị bằng `oldCap` = 16. Index mới chỉ khác index cũ ở bit này. Bit đó của hash là 0 thì index giữ nguyên, là 1 thì index cộng thêm 16. Đã chạy: `5 & 16` = 0 nên 5 ở lại bucket 5; `21 & 16` = 16 nên 21 (cũ ở bucket `21 & 15` = 5) sang bucket 21.",
        "Kéo số phần tử và so ba cách khởi tạo.",
      ],
      predict: {
        question: "Cần chứa 100 phần tử. `new HashMap<>(100)` phải resize bao nhiêu lần?",
        options: ["0 lần, vì đã khai báo 100", "1 lần", "4 lần, như map mặc định", "7 lần"],
        answer: 1,
        explain: "100 được làm tròn lên capacity 128, nhưng threshold chỉ là 128 × 0.75 = 96, nên phần tử thứ 97 vẫn gây một lần resize. `HashMap.newHashMap(100)` mới không resize lần nào.",
      },
      widget: "resize",
      widgetTitle: "Bao nhiêu lần resize?",
      after: [
        "Đo thật với 100 phần tử: map mặc định resize 4 lần (16 → 32 → 64 → 128 → 256); `new HashMap<>(100)` vẫn resize 1 lần vì capacity 128 chỉ có threshold 96; `HashMap.newHashMap(100)` (Java 19+) không resize lần nào. Load factor 0.75 là điểm cân bằng giữa bộ nhớ và tốc độ tra cứu.",
      ],
      quiz: {
        question: "new HashMap<>(1000) có chứa được 1000 phần tử mà không resize không?",
        options: ["Có, vì capacity là 1000", "Không: capacity làm tròn lên 1024, threshold 768, phần tử thứ 769 gây resize", "Có, vì 1024 > 1000", "Tuỳ JVM"],
        answer: 1,
        explain: "Đã đo: capacity 1024, threshold 768. Muốn đủ chỗ thì dùng HashMap.newHashMap(1000) (ra capacity 2048) hoặc tự tính 1000 / 0.75 + 1.",
      },
    },
    {
      id: "mutable-key",
      title: "Phần 6: Key bị sửa sau khi put",
      scene: "trap",
      intro: [
        "Key được đặt vào bucket theo hashCode lúc `put`. Sửa key sau đó thì hashCode đổi nhưng entry không tự dời bucket, nên không bao giờ tìm lại được. Chạy từng dòng để xem.",
      ],
      predict: {
        question: "Key là một `ArrayList` `[a]` đã `put` vào map. Sau `key.add(\"b\")`, `map.get(key)` trả về gì?",
        options: ["Value đã put", "null", "Ném ConcurrentModificationException", "Ném NullPointerException"],
        answer: 1,
        explain: "hashCode của list đổi, nên `get` tìm ở bucket khác, còn entry vẫn nằm ở bucket cũ. Tìm bằng `List.of(\"a\")` cũng null, vì key trong entry giờ là `[a, b]`, không còn equals.",
      },
      widget: "mutable-key",
      widgetTitle: "Entry mất tích",
      after: [
        "Key phải immutable: `String`, `Integer`, `Long`, `UUID`, enum, `record` có field immutable. Bẫy tương tự với JPA entity dùng `id` tự sinh trong `hashCode`: trước khi persist `id` là null, sau đó có giá trị.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Entry đặt theo hashCode lúc `put` → sửa key làm hashCode đổi → `get` tìm ở bucket khác → entry còn đó nhưng không lấy ra được.",
        ],
      },
      quiz: {
        question: "Sau key.add(\"b\") (key là ArrayList đã put vào map), map.size() trả về gì?",
        options: ["0, entry bị xoá", "1, entry vẫn còn nhưng không lấy ra được", "2", "Ném ConcurrentModificationException"],
        answer: 1,
        explain: "Entry vẫn nằm ở bucket cũ nên size là 1, nhưng get(key) và get(List.of(\"a\")) đều null. Đã chạy thật trên JDK 21.",
      },
      parts: [
        {
          id: "null-order-threads",
          title: "Key null, thứ tự duyệt và thread-safety",
          intro: [
            "Bốn câu hỏi hay đi kèm sau phần cơ chế:",
            "- **Key null**: HashMap cho đúng một key `null`, luôn ở bucket 0 (hash của null được quy ước là 0). `Hashtable` và `ConcurrentHashMap` thì ném `NullPointerException` khi gặp key hay value null.",
            "- **Thứ tự duyệt**: không được đảm bảo, vì HashMap duyệt theo thứ tự bucket, và thứ tự đó đổi sau mỗi lần resize. Cần thứ tự chèn thì dùng `LinkedHashMap`, cần sắp xếp thì dùng `TreeMap`.",
            "- **Thread-safety**: HashMap không thread-safe. Hai thread cùng `put` vào một bucket có thể cùng đọc thấy bucket đó rỗng, cùng đặt node của mình, và node ghi sau xoá mất node ghi trước. Hai thread cùng gặp resize cũng có thể cùng chép dữ liệu sang table mới và làm mất phần tử. Nhiều thread thì dùng `ConcurrentHashMap`.",
            "- **Java 7 khác Java 8 ở đâu?** Java 7 dùng mảng + list và chèn node mới vào **đầu** list; khi resize, thứ tự trong list bị đảo, nên nhiều thread resize cùng lúc có thể tạo ra một list vòng tròn, làm `get` lặp vô hạn và CPU lên 100%. Java 8 chèn vào **cuối** list, giữ thứ tự khi resize (nên không còn vòng), và thêm treeify cho bucket đông. Dù vậy, Java 8 vẫn mất dữ liệu khi dùng nhiều thread.",
          ],
          quiz: {
            question: "Vì sao HashMap không an toàn khi hai thread cùng put?",
            options: [
              "Vì HashMap không cho key null",
              "Vì hai thread có thể cùng thấy một bucket rỗng và node ghi sau đè mất node ghi trước, nên mất dữ liệu",
              "Vì put luôn ném ConcurrentModificationException",
              "Vì HashMap khoá cả table khi put",
            ],
            answer: 1,
            explain: "HashMap không có khoá nào: các bước đọc bucket rồi ghi node của hai thread xen kẽ nhau, nên một lần ghi bị mất. ConcurrentHashMap khoá ở mức từng bucket để tránh chuyện này.",
          },
        },
      ],
    },
  ],
  practice: [
    {
      title: "1. Tra cứu O(1): HashSet và HashMap cơ bản",
      problems: [
        { id: 217, title: "Contains Duplicate", slug: "contains-duplicate", level: "Easy", hint: "Duyệt mảng, thêm vào `HashSet`. `add()` trả về `false` nghĩa là phần tử đã có: trùng." },
        { id: 1, title: "Two Sum", slug: "two-sum", level: "Easy", hint: "Lưu `giá trị → index` vào map. Với mỗi số `x`, tra xem `target - x` đã có trong map chưa, rồi mới `put(x, i)` để không tự ghép với chính nó." },
      ],
    },
    {
      title: "2. Đếm tần suất",
      problems: [
        { id: 242, title: "Valid Anagram", slug: "valid-anagram", level: "Easy", hint: "Đếm số lần xuất hiện mỗi ký tự của chuỗi thứ nhất bằng `merge(c, 1, Integer::sum)`, rồi trừ dần theo chuỗi thứ hai. Mọi giá trị về 0 là anagram." },
        { id: 383, title: "Ransom Note", slug: "ransom-note", level: "Easy", hint: "Đếm ký tự của `magazine`, rồi tiêu dần theo `ransomNote`. Có ký tự nào xuống dưới 0 là không đủ." },
        { id: 347, title: "Top K Frequent Elements", slug: "top-k-frequent-elements", level: "Medium", hint: "Bước 1 đếm tần suất bằng map. Bước 2 lấy k phần tử nhiều nhất: dùng `PriorityQueue` kích thước k, hoặc gom số theo tần suất vào các \"xô\" từ 1 tới n." },
      ],
    },
    {
      title: "3. Tự chọn key cho map",
      problems: [
        { id: 49, title: "Group Anagrams", slug: "group-anagrams", level: "Medium", hint: "Hai từ là anagram khi sắp xếp ký tự ra cùng một chuỗi. Dùng chuỗi đã sắp xếp làm key và `computeIfAbsent(key, k -> new ArrayList<>()).add(word)`. Key là `String` nên `equals` và `hashCode` đã đúng sẵn." },
      ],
    },
    {
      title: "4. Map kết hợp kỹ thuật khác",
      problems: [
        { id: 3, title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", level: "Medium", hint: "Cửa sổ trượt: map lưu `ký tự → vị trí gặp gần nhất`. Gặp ký tự đã có trong cửa sổ thì dời mép trái sang ngay sau vị trí cũ đó." },
        { id: 128, title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", level: "Medium", hint: "Cho hết vào `HashSet`. Chỉ bắt đầu đếm từ số `x` mà `x - 1` không có trong set, rồi đếm lên `x + 1`, `x + 2`... Mỗi số chỉ được đi qua một lần nên tổng là O(n)." },
        { id: 560, title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k", level: "Medium", hint: "Tổng cộng dồn (prefix sum): đoạn từ i tới j có tổng k khi `prefix[j] - prefix[i] = k`. Map đếm số lần mỗi prefix đã xuất hiện, nhớ `put(0, 1)` trước vòng lặp." },
      ],
    },
    {
      title: "5. Tự cài đặt cấu trúc dữ liệu",
      problems: [
        { id: 706, title: "Design HashMap", slug: "design-hashmap", level: "Easy", hint: "Áp dụng thẳng bài này: mảng bucket, mỗi bucket là một danh sách node, chọn bucket bằng `hash & (n - 1)` với n là luỹ thừa của 2. Muốn làm kỹ thì thêm resize khi số phần tử vượt `n × 0,75`." },
        { id: 146, title: "LRU Cache", slug: "lru-cache", level: "Medium", hint: "Cách nhanh: `LinkedHashMap` với `accessOrder = true` và override `removeEldestEntry` (bài Collections). Cách phỏng vấn hay hỏi: tự ghép `HashMap` với danh sách liên kết đôi, map trỏ thẳng tới node để xoá và đưa lên đầu trong O(1)." },
        { id: 380, title: "Insert Delete GetRandom O(1)", slug: "insert-delete-getrandom-o1", level: "Medium", hint: "`ArrayList` để lấy ngẫu nhiên theo index, `HashMap` lưu `giá trị → index`. Xoá trong O(1) bằng cách đổi chỗ phần tử cần xoá với phần tử cuối, cập nhật index trong map, rồi xoá phần tử cuối." },
      ],
    },
  ],
  modelAnswer:
    "Bên trong HashMap là một mảng bucket có độ dài luôn là luỹ thừa của 2. Khi put, nó lấy hashCode của key, trộn 16 bit cao xuống bit thấp, rồi tính index bằng (n - 1) & hash, tương đương chia lấy dư nhưng nhanh hơn. Bucket rỗng thì đặt node vào; nếu đã có node thì so hash rồi equals: trùng key thì ghi đè và trả value cũ, không thì nối vào cuối. Từ Java 8, khi một bucket vượt quá 8 node và table từ 64 ô trở lên thì list thành red-black tree, nên xấu nhất còn O(log n). Khi số phần tử vượt capacity nhân 0.75 thì table gấp đôi, mặc định ở phần tử thứ 13, và mỗi node hoặc ở nguyên index hoặc sang index cộng capacity cũ. HashMap cho một key null, không đảm bảo thứ tự, không thread-safe nên nhiều thread em dùng ConcurrentHashMap. Em luôn dùng key immutable, và khi biết trước số phần tử thì dùng HashMap.newHashMap để tránh resize.",
};
