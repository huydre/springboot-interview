import timeline from "../timelines/equals-hashcode.json";
import type { Lesson, Scene } from "../types";

// Every Java output quoted below was run on JDK 21.
export const equalsHashcode: Lesson = {
  slug: "equals-hashcode",
  crumb: "equals & hashCode",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/equals-hashcode-string",
  videoVersion: "6fca175d",
  scenes: timeline as Scene[],
  title: "equals, hashCode & String: những phép so sánh đánh lừa",
  subtitle:
    "== khác equals() thế nào, vì sao 127 == 127 mà 128 != 128, chuyện gì xảy ra khi quên hashCode(), và vì sao không bao giờ so String bằng ==. Mỗi bẫy đều có code chạy thật và một mô phỏng để tự thử.",
  openingQuiz: {
    question: "Integer m = 128, n = 128; System.out.println(m == n); in ra gì?",
    options: ["true", "false", "Lỗi biên dịch", "Tuỳ JVM, không đoán được"],
    answer: 1,
    explain:
      "Autoboxing gọi Integer.valueOf(128). Cache chỉ giữ sẵn object cho -128 … 127, nên 128 tạo hai object khác nhau và == so địa chỉ ra false. Với 127 thì true. Đã chạy thật trên JDK 21.",
  },
  roadmap: [
    "Chặng 1: == và equals(), rồi bẫy Integer cache. So địa chỉ hay so nội dung, và vì sao Long id từ database không được so bằng ==.",
    "Chặng 2: contract equals/hashCode. HashSet tìm phần tử qua hai bước, và bug kinh điển khi quên hashCode().",
    "Chặng 3: String. String pool, compile time hay runtime, immutable, và khi nào cần StringBuilder.",
  ],
  sections: [
    {
      id: "equals",
      title: "Phần 1: == và equals(), so địa chỉ hay so nội dung",
      scene: "eq",
      intro: [
        "`==` so sánh giá trị nằm trong biến. Với kiểu nguyên thuỷ như `int`, giá trị đó là con số. Với object, giá trị trong biến là địa chỉ, nên `==` hỏi: hai biến có trỏ tới cùng một object không?",
        "`equals()` so sánh nội dung, theo cách class tự định nghĩa. Nếu class không override, `Object.equals()` mặc định chính là `==`. Bật tắt override bên dưới để thấy khác biệt.",
      ],
      widget: "point-equals",
      widgetTitle: "Thử nghiệm: Point có và không override equals",
      after: [
        "Bẫy hay gặp: `status.equals(\"ACTIVE\")` ném NullPointerException khi `status` là null. Viết `\"ACTIVE\".equals(status)` hoặc `Objects.equals(status, \"ACTIVE\")` để an toàn cả hai phía.",
      ],
      quiz: {
        question: "Class Point không override equals. new Point(1, 2).equals(new Point(1, 2)) trả về gì?",
        options: ["true, vì cùng x và y", "false, vì Object.equals mặc định so địa chỉ", "Lỗi biên dịch", "Ném NullPointerException"],
        answer: 1,
        explain: "Không override thì equals() là của Object, tức là ==. Hai lần new là hai object khác nhau nên ra false. Đã chạy thật: p1.equals(p2) → false.",
      },
    },
    {
      id: "integer-cache",
      title: "Phần 2: Integer cache, vì sao 127 bằng mà 128 không",
      scene: "cache",
      intro: [
        "`Integer x = 127` thực chất gọi `Integer.valueOf(127)`. Hàm này trả về object có sẵn trong cache cho các giá trị từ -128 đến 127, nên hai biến cùng trỏ một object. Từ 128 trở đi, mỗi lần gọi tạo object mới.",
        "`Long`, `Short`, `Byte` cũng cache -128 … 127. Kéo thanh trượt để xem `==` đổi kết quả ở đúng ranh giới.",
      ],
      widget: "integer-cache",
      widgetTitle: "Kéo giá trị qua ranh giới -128 … 127",
      after: [
        "Bug thật: so sánh hai `Long id` lấy từ database bằng `==`. Test với id nhỏ thì đúng, lên production id > 127 thì sai. Luôn dùng `equals()` hoặc `Objects.equals()`.",
        "Bẫy thứ hai: `Integer count = null; if (count == 0)` ném NullPointerException, vì Java unbox bằng `count.intValue()`. Dùng `Objects.equals(count, 0)` hoặc kiểm tra null trước.",
      ],
      quiz: {
        question: "Integer.valueOf(100) == Integer.valueOf(100) và Integer.valueOf(1000) == Integer.valueOf(1000) lần lượt cho gì?",
        options: ["true và true", "true và false", "false và false", "false và true"],
        answer: 1,
        explain: "100 nằm trong cache nên cùng một object (true). 1000 ngoài cache nên hai object khác nhau (false). Đừng bao giờ dựa vào cache: luôn so wrapper bằng equals().",
      },
    },
    {
      id: "contract",
      title: "Phần 3: Contract giữa equals() và hashCode()",
      scene: "contract",
      intro: [
        "`HashMap` và `HashSet` tìm phần tử qua hai bước: `hashCode()` chọn bucket, rồi `equals()` tìm đúng phần tử trong bucket đó. Vì vậy hai method phải thống nhất với nhau.",
        "Quy tắc bắt buộc: `a.equals(b)` thì `a.hashCode() == b.hashCode()`. Ngược lại, hashCode trùng nhau mà không equals chỉ là collision: làm chậm, không làm sai. Và hashCode gọi nhiều lần phải trả cùng giá trị khi các field dùng trong equals không đổi.",
      ],
      after: [
        "Năm tính chất của equals(): phản xạ (`x.equals(x)`), đối xứng, bắc cầu, nhất quán, và `x.equals(null)` luôn false chứ không ném lỗi.",
      ],
      quiz: {
        question: "Viết hashCode() luôn return 1; thì sao?",
        options: [
          "Vi phạm contract, HashSet chứa trùng",
          "Không vi phạm contract, kết quả đúng nhưng mọi phần tử dồn vào một bucket nên rất chậm",
          "Lỗi biên dịch",
          "HashMap tự sinh hashCode khác",
        ],
        answer: 1,
        explain: "Object bằng nhau vẫn cùng hashCode nên không sai. Nhưng tất cả rơi vào một bucket: tra cứu thoái hoá từ O(1) xuống O(n), hoặc O(log n) nếu bucket được chuyển thành cây.",
      },
    },
    {
      id: "forgot-hashcode",
      title: "Phần 4: Override equals mà quên hashCode",
      scene: "nohash",
      intro: [
        "Lớp `UserNoHash` bằng nhau theo email nhưng không viết `hashCode()`, nên dùng hashCode mặc định của Object: mỗi object một số khác. Hai user cùng email rơi vào hai bucket khác nhau và `equals()` không bao giờ được gọi giữa chúng.",
        "Thêm `an@x.com` hai lần ở mỗi chế độ. Bucket của chế độ equals + hashCode được tính đúng như Java: `Objects.hash(email)`, capacity 16.",
      ],
      widget: "hashset",
      widgetTitle: "HashSet<User>: thêm cùng một email hai lần",
      after: [
        "Đã chạy thật: không có hashCode thì `size=2, contains=false`; có `Objects.hash(email)` thì `size=1, contains=true`. Cách gọn nhất là `record`, hoặc để IDE/Lombok sinh cả hai method từ cùng một tập field. Với JPA entity, đừng dùng `@Data`.",
      ],
      quiz: {
        question: "Override hashCode nhưng KHÔNG override equals thì HashSet có còn chứa trùng không?",
        options: ["Không, vì cùng bucket là đủ", "Có, vì equals mặc định vẫn so địa chỉ nên hai object vẫn bị coi là khác nhau", "Lỗi biên dịch", "Chỉ trùng khi bucket đầy"],
        answer: 1,
        explain: "Cùng bucket rồi nhưng bước 2 dùng equals mặc định (==) nên vẫn coi là khác. equals và hashCode luôn phải override cùng nhau.",
      },
    },
    {
      id: "string-pool",
      title: "Phần 5: String pool, vì sao không so String bằng ==",
      scene: "pool",
      intro: [
        "Chuỗi viết trực tiếp trong code là literal. Hai literal giống nhau dùng chung một object trong String pool. `new String(\"java\")` luôn tạo object mới bên ngoài pool, và `intern()` trả về bản trong pool.",
        "Bẫy tinh vi: `\"a\" + \"b\"` là hằng số nên compiler gộp thành `\"ab\"` lúc compile. Còn `a + \"b\"` với `a` là biến thì nối lúc runtime, ra object mới. Chọn hai cách tạo chuỗi bên dưới.",
      ],
      widget: "string-compare",
      widgetTitle: "Máy so sánh: s1 == s2 hay không?",
      after: [
        "Kết quả của mô phỏng khớp với cả 25 tổ hợp đã chạy thật trên JDK 21. Bài học: kết quả `==` phụ thuộc chuỗi tạo lúc compile hay runtime, nên luôn so String bằng `equals()`.",
      ],
      quiz: {
        question: "String a = \"a\"; System.out.println((a + \"b\") == \"ab\"); in ra gì?",
        options: ["true, vì cùng nội dung", "false, vì nối với biến tạo object mới lúc runtime", "Lỗi biên dịch", "true nếu chạy trên Java 9+"],
        answer: 1,
        explain: "a là biến nên phép nối chạy lúc runtime và tạo String mới ngoài pool. Đã chạy thật: false. Còn \"a\" + \"b\" == \"ab\" là true.",
      },
    },
    {
      id: "immutable",
      title: "Phần 6: String immutable, StringBuilder và immutable class",
      scene: "immut",
      intro: [
        "String immutable: `toUpperCase()`, `concat()`, `replace()` đều trả về chuỗi mới. Nhờ vậy String pool chia sẻ an toàn, String thread-safe không cần lock, hashCode được cache để làm key HashMap nhanh, và đường dẫn hay URL đã kiểm tra thì không bị đổi.",
        "Cái giá: nối bằng `+=` trong vòng lặp tạo một String mới mỗi vòng và copy lại toàn bộ. Kéo số phần tử để thấy khác biệt.",
      ],
      widget: "string-builder",
      widgetTitle: "+= trong vòng lặp vs StringBuilder",
      after: [
        "Viết immutable class: class `final`, field `private final`, không setter, method \"thay đổi\" thì trả về object mới. Với field mutable như `List`, copy khi nhận vào bằng `List.copyOf(items)`. Đã chạy thật: sửa list gốc sau khi tạo Order thì `order.getItems()` vẫn là `[book]`, còn `getItems().add(\"x\")` ném UnsupportedOperationException.",
      ],
      quiz: {
        question: "Field khai báo final List<String> items. Object đã immutable chưa?",
        options: ["Rồi, vì final", "Chưa: final chỉ cấm gán lại biến, nội dung list vẫn add/remove được", "Rồi, nếu không có setter", "Chưa, vì phải dùng ArrayList"],
        answer: 1,
        explain: "final chỉ khoá tham chiếu. Cần defensive copy (List.copyOf) để có list độc lập và unmodifiable. Collections.unmodifiableList chỉ là view: sửa list gốc thì view đổi theo.",
      },
    },
  ],
  modelAnswer:
    "== so sánh giá trị trong biến: với primitive là con số, với object là địa chỉ. equals() so nội dung theo cách class định nghĩa, không override thì nó chính là ==. Bẫy hay gặp là Integer cache: -128 đến 127 dùng chung object nên == ra true, 128 thì false, vì vậy em luôn so wrapper như Long id bằng equals. HashMap dùng hashCode để chọn bucket rồi equals để tìm đúng phần tử, nên hai object equals phải cùng hashCode; quên hashCode thì HashSet chứa trùng và contains trả false. Em dùng record hoặc để IDE sinh cả hai. String là immutable và literal nằm trong String pool, nhưng kết quả == phụ thuộc chuỗi tạo lúc compile hay runtime, nên em luôn so String bằng equals, và dùng StringBuilder khi nối trong vòng lặp.",
};
