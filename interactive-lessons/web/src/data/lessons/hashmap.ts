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
    "Chặng 1: từ key đến bucket, rồi put và get. hash() trộn bit, (n - 1) & hash chọn bucket, so hash rồi equals.",
    "Chặng 2: collision, treeify và resize. Ba ngưỡng 8, 64, 6, load factor 0.75, và mẹo chia node khi gấp đôi table.",
    "Chặng 3: bẫy key bị sửa sau khi put, null key, thứ tự duyệt và thread-safety.",
  ],
  sections: [
    {
      id: "key-to-bucket",
      title: "Phần 1: Từ key đến bucket",
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
      title: "Phần 2: put() và get() chạy thế nào",
      scene: "put",
      intro: [
        "Phần 1 đã chọn được bucket. Giờ xem chuyện gì xảy ra bên trong bucket đó:",
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
      title: "Phần 3: Collision và treeify",
      scene: "treeify",
      intro: [
        "Phần 2 thấy hai key có thể chung một bucket. Nếu rất nhiều key cùng dồn vào một bucket thì sao?",
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
      title: "Phần 4: Resize",
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
      title: "Phần 5: Key bị sửa sau khi put",
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
  modelAnswer:
    "Bên trong HashMap là một mảng bucket có độ dài luôn là luỹ thừa của 2. Khi put, nó lấy hashCode của key, trộn 16 bit cao xuống bit thấp, rồi tính index bằng (n - 1) & hash, tương đương chia lấy dư nhưng nhanh hơn. Bucket rỗng thì đặt node vào; nếu đã có node thì so hash rồi equals: trùng key thì ghi đè và trả value cũ, không thì nối vào cuối. Từ Java 8, khi một bucket vượt quá 8 node và table từ 64 ô trở lên thì list thành red-black tree, nên xấu nhất còn O(log n). Khi số phần tử vượt capacity nhân 0.75 thì table gấp đôi, mặc định ở phần tử thứ 13, và mỗi node hoặc ở nguyên index hoặc sang index cộng capacity cũ. HashMap cho một key null, không đảm bảo thứ tự, không thread-safe nên nhiều thread em dùng ConcurrentHashMap. Em luôn dùng key immutable, và khi biết trước số phần tử thì dùng HashMap.newHashMap để tránh resize.",
};
