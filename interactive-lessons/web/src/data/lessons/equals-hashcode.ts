import timeline from "../timelines/equals-hashcode.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java output quoted below was run on JDK 21.
export const equalsHashcode: Lesson = {
  slug: "equals-hashcode",
  crumb: "equals & hashCode",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/equals-hashcode-string",
  videoVersion: "f81627d0",
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
        "Phần 1 nói `==` trên object so địa chỉ. Vậy vì sao hai `Integer` cùng giá trị 127 so bằng `==` lại ra true, còn 128 thì không?",
        "Java tự đổi qua lại giữa kiểu nguyên thuỷ và wrapper. **Autoboxing** là tự bọc `int` thành object `Integer` khi cần object; **unboxing** là chiều ngược lại, tự lấy `int` ra khỏi `Integer`. Ví dụ `Integer boxed = 5;` là autoboxing, `int n = boxed;` là unboxing.",
        "`Integer x = 127` thực chất gọi `Integer.valueOf(127)` (đó chính là autoboxing). Hàm này trả về object có sẵn trong cache cho các giá trị từ -128 đến 127, nên hai biến cùng trỏ một object. Từ 128 trở đi, mỗi lần gọi tạo object mới.",
        "`Long`, `Short`, `Byte` cũng cache -128 … 127. Kéo thanh trượt để xem `==` đổi kết quả ở đúng ranh giới.",
      ],
      widget: "integer-cache",
      widgetTitle: "Kéo giá trị qua ranh giới -128 … 127",
      after: [
        "Bug thật: so sánh hai `Long id` lấy từ database bằng `==`. Test với id nhỏ thì đúng, lên production id > 127 thì sai. Luôn dùng `equals()` hoặc `Objects.equals()`.",
        "Bẫy thứ hai: `Integer count = null; if (count == 0)` ném NullPointerException, vì để so với `0`, Java unbox `count` bằng cách gọi `count.intValue()` trên một biến null. Dùng `Objects.equals(count, 0)` hoặc kiểm tra null trước.",
      ],
      takeaway: {
        lines: [
          "Cache -128 … 127 làm `==` trông như đúng khi test với số nhỏ. Luôn so wrapper bằng `equals()` hoặc `Objects.equals()`.",
        ],
      },
      quiz: {
        question: "Integer.valueOf(100) == Integer.valueOf(100) và Integer.valueOf(1000) == Integer.valueOf(1000) lần lượt cho gì?",
        options: ["true và true", "true và false", "false và false", "false và true"],
        answer: 1,
        explain: "100 nằm trong cache nên cùng một object (true). 1000 ngoài cache nên hai object khác nhau (false). Đừng bao giờ dựa vào cache: luôn so wrapper bằng equals().",
      },
      parts: [
        {
          id: "bigdecimal-money",
          title: "Tiền: vì sao không dùng double, và các bẫy của BigDecimal",
          intro: [
            "Integer cache cho thấy so sánh số trong Java có bẫy. Với tiền, bẫy còn đắt hơn: một ví điện tử cộng 10 lần phí 0,1 nghìn đồng bằng `double`. Đã chạy: tổng ra `0.9999999999999999`, không phải `1.0`. Và `0.1 + 0.2` in ra `0.30000000000000004`, nên `0.1 + 0.2 == 0.3` là `false`.",
            "Lý do: `double` lưu số ở **hệ nhị phân**. Giống 1/3 không viết hết được ở hệ thập phân (0,333...), số 0,1 không viết hết được ở hệ nhị phân, nên máy lưu một số **gần đúng**. Sai số nhỏ, nhưng cộng dồn qua hàng triệu giao dịch thì lệch sổ.",
            "**`BigDecimal`** lưu số ở hệ thập phân: một số nguyên lớn cộng với **scale** (số chữ số sau dấu phẩy). `2.00` là 200 với scale 2. Bốn quy tắc khi dùng:",
            "- **Tạo từ chuỗi**: `new BigDecimal(\"0.1\")` hoặc `BigDecimal.valueOf(0.1)`, không bao giờ `new BigDecimal(0.1)`, vì nó chép nguyên sai số của `double` vào.",
            "- **So giá trị bằng `compareTo`**: `equals` so cả scale, nên `2.0` và `2.00` không bằng nhau.",
            "- **Chia phải nói làm tròn**: `divide(x, 2, RoundingMode.HALF_UP)`. Không nói mà kết quả là số thập phân vô hạn thì ném exception.",
            "- **Bất biến**: `a.add(b)` trả về object mới, `a` không đổi, giống `String`.",
          ],
          predict: {
            question: "`new BigDecimal(\"2.0\").equals(new BigDecimal(\"2.00\"))` cho gì?",
            options: ["true, cùng giá trị 2", "false, vì `equals` so cả scale (1 và 2)", "Lỗi biên dịch", "Ném ArithmeticException"],
            answer: 1,
            explain: "`equals` của BigDecimal coi `2.0` và `2.00` là khác nhau vì scale khác. Muốn so giá trị thì `compareTo(...) == 0`.",
          },
          widgetTitle: "Cùng một phép tính tiền, double và BigDecimal",
          compare: [
            way(
              "double",
              `double fee = 0.1;
double total = 0;
for (int i = 0; i < 10; i++) total += fee;
System.out.println(0.1 + 0.2);
System.out.println(new BigDecimal(0.1));    // tạo từ double`,
              [
                ask("Cộng 10 lần 0.1", bad("Đã chạy: `0.9999999999999999`.")),
                ask("`0.1 + 0.2`", bad("Đã chạy: `0.30000000000000004`, và `0.1 + 0.2 == 0.3` là `false`.")),
                ask("`new BigDecimal(0.1)`", bad("Đã chạy: `0.1000000000000000055511151231257827021181583404541015625`. Dùng BigDecimal mà tạo từ double thì sai số vẫn đi theo.")),
              ],
              "Nhanh, nhưng không biểu diễn đúng được 0,1. Không dùng cho tiền.",
            ),
            way(
              "BigDecimal tạo từ chuỗi",
              `BigDecimal a = new BigDecimal("0.1").add(new BigDecimal("0.2"));
BigDecimal x = new BigDecimal("2.0"), y = new BigDecimal("2.00");
x.equals(y);  x.compareTo(y);
new HashSet<>(List.of(x, y)).size();  new TreeSet<>(List.of(x, y)).size();
new BigDecimal("100").divide(new BigDecimal("3"));
new BigDecimal("100").divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);`,
              [
                ask("`0.1 + 0.2`", ok("Đã chạy: `0.3`. `BigDecimal.valueOf(0.1)` cũng ra `0.1`, vì nó đi qua chuỗi `\"0.1\"`.")),
                ask("So `2.0` với `2.00`", bad("Đã chạy: `equals` là `false`, `compareTo` là `0`. Bỏ cả hai vào `HashSet` thì size là **2**, vào `TreeSet` (so bằng `compareTo`) thì size là **1**.")),
                ask("`100 / 3` không nói làm tròn", bad("Đã chạy: `ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result.`")),
                ask("`100 / 3` với scale 2, `HALF_UP`", ok("Đã chạy: `33.33`. Chia hết thì không cần: `100 / 4` ra `25`.")),
              ],
              "Đúng từng đồng, nhưng phải tạo từ chuỗi, so bằng compareTo và chia có làm tròn.",
            ),
          ],
          after: [
            "Chế độ làm tròn cũng là quyết định nghiệp vụ. Đã chạy: `2.345` làm tròn 2 chữ số với `HALF_UP` ra `2.35`, với `HALF_EVEN` (làm tròn về số chẵn gần nhất, hay dùng trong ngân hàng để sai số không lệch về một phía) ra `2.34`.",
            "Hai lựa chọn khác hay gặp: lưu tiền thành `long` theo đơn vị nhỏ nhất (đồng, xu), hợp với VND vì không có phần lẻ; và trong database dùng `NUMERIC(19, 2)` / `DECIMAL`, không dùng `FLOAT`.",
          ],
          takeaway: {
            lines: [
              "Tiền: `BigDecimal` tạo từ chuỗi (hoặc `valueOf`), so bằng `compareTo`, chia luôn kèm scale và `RoundingMode`.",
              "`equals` của BigDecimal so cả scale, nên `HashSet` coi `2.0` và `2.00` là hai phần tử.",
            ],
          },
          quiz: {
            question: "Chia tiền `new BigDecimal(\"100\").divide(new BigDecimal(\"3\"))` thì sao?",
            options: [
              "Ra 33.33",
              "Ra 33.333333...",
              "Ném ArithmeticException vì kết quả là số thập phân vô hạn mà không nói cách làm tròn",
              "Ra 33",
            ],
            answer: 2,
            explain: "Không truyền scale và RoundingMode thì BigDecimal đòi kết quả chính xác, mà 100/3 không có kết quả thập phân hữu hạn. Viết `divide(x, 2, RoundingMode.HALF_UP)`. Đã chạy: ra `33.33`.",
          },
        },
      ],
    },
    {
      id: "contract",
      title: "Phần 3: Contract giữa equals() và hashCode()",
      scene: "contract",
      intro: [
        "Phần 1 đã override `equals()`. Nhưng `HashMap` và `HashSet` còn cần thêm một method nữa.",
        "`HashMap` và `HashSet` bên trong là một mảng; mỗi ô của mảng gọi là một **bucket** (bài HashMap sẽ đi sâu). Chúng tìm phần tử qua hai bước: `hashCode()` chọn bucket, rồi `equals()` tìm đúng phần tử trong bucket đó. Vì vậy hai method phải thống nhất với nhau.",
        "Quy tắc bắt buộc: `a.equals(b)` thì `a.hashCode() == b.hashCode()`. Ngược lại, hashCode trùng nhau mà không equals chỉ là collision: làm chậm, không làm sai. Và hashCode gọi nhiều lần phải trả cùng giá trị khi các field dùng trong equals không đổi.",
      ],
      after: [
        "Năm tính chất của equals():",
        "- **Phản xạ**: `x.equals(x)`.",
        "- **Đối xứng**: `x.equals(y)` thì `y.equals(x)`.",
        "- **Bắc cầu**: x bằng y, y bằng z thì x bằng z.",
        "- **Nhất quán**: gọi nhiều lần cùng kết quả.",
        "- **So với null**: `x.equals(null)` luôn false chứ không ném lỗi.",
        "Ví dụ phá tính đối xứng: class `CIString` so chuỗi không phân biệt hoa thường, và `equals` của nó chấp nhận cả `String`. Đã chạy: `new CIString(\"Java\").equals(\"java\")` là true, nhưng `\"java\".equals(new CIString(\"Java\"))` là false, vì `String` không biết gì về `CIString`. Hậu quả: list chứa `CIString(\"Java\")` mà `list.contains(\"java\")` lại ra false. Cách sửa: `equals` chỉ so với đúng kiểu của mình.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "`hashCode()` chọn bucket → `equals()` tìm trong bucket → hai object equals mà khác hashCode thì nằm hai bucket, không bao giờ được so với nhau.",
        ],
      },
      quiz: {
        question: "Viết hashCode() luôn return 1; thì sao?",
        options: [
          "Vi phạm contract, HashSet chứa trùng",
          "Không vi phạm contract, kết quả đúng nhưng mọi phần tử dồn vào một bucket nên rất chậm",
          "Lỗi biên dịch",
          "HashMap tự sinh hashCode khác",
        ],
        answer: 1,
        explain: "Object bằng nhau vẫn cùng hashCode nên không sai. Nhưng tất cả rơi vào một bucket: tra cứu thoái hoá từ O(1) xuống O(n), vì phải gọi equals lần lượt với từng phần tử trong bucket đó.",
      },
      parts: [
        {
          id: "write-equals",
          title: "Viết equals() thế nào: getClass() hay instanceof",
          intro: [
            "Một `equals` chuẩn có bốn bước:",
            "- **(1) Cùng object**: `if (this == o) return true;` cho nhanh.",
            "- **(2) Kiểm tra kiểu**: `o` là null hoặc khác kiểu thì trả false.",
            "- **(3) Ép kiểu**.",
            "- **(4) So từng field**: field object thì dùng `Objects.equals(a, b)` để không nổ khi field là null.",
            "Bước 2 có hai cách viết, và đây là câu hay hỏi. **`getClass() != o.getClass()`**: chỉ bằng nhau khi **cùng đúng một class**. **`o instanceof Point`**: chấp nhận cả class con của `Point`.",
            "`instanceof` dễ phá tính đối xứng khi class con thêm field. Ví dụ `ColorPoint extends Point` thêm `color`, và cả hai dùng `instanceof`. Đã chạy: `new Point(1, 2).equals(new ColorPoint(1, 2, \"red\"))` là true, nhưng chiều ngược lại là false.",
            "`getClass()` thì an toàn về đối xứng: đã chạy, `new Point(1, 2).equals(new ColorPoint(1, 2))` là false ở cả hai chiều. Cái giá: object của class con không bao giờ bằng object của class cha, kể cả khi class con không thêm field nào. Với JPA entity, Hibernate tạo proxy là class con của entity, nên ở đó người ta thường dùng `instanceof` và khai báo `equals` là `final`.",
            "Cách gọn nhất là để không ai tự viết: dùng `record`, hoặc để IDE sinh cả `equals` lẫn `hashCode` từ cùng một tập field.",
          ],
          quiz: {
            question: "Point dùng getClass() trong equals. ColorPoint extends Point mà không thêm field nào. new Point(1, 2).equals(new ColorPoint(1, 2)) ra gì?",
            options: ["true, vì cùng x và y", "false, vì getClass() của hai object khác nhau", "Lỗi biên dịch", "Ném ClassCastException"],
            answer: 1,
            explain: "getClass() đòi đúng cùng một class. Point.class khác ColorPoint.class nên ra false, dù dữ liệu y hệt. Đã chạy trên JDK 21: false.",
          },
        },
      ],
    },
    {
      id: "forgot-hashcode",
      title: "Phần 4: Override equals mà quên hashCode",
      scene: "nohash",
      intro: [
        "Lớp `UserNoHash` bằng nhau theo email nhưng không viết `hashCode()`, nên dùng hashCode mặc định của Object: mỗi object một số khác. Hai user cùng email rơi vào hai bucket khác nhau và `equals()` không bao giờ được gọi giữa chúng.",
        "Thêm `an@x.com` hai lần ở mỗi chế độ. Bucket của chế độ equals + hashCode được tính đúng như Java: `Objects.hash(email)`, capacity 16.",
      ],
      predict: {
        question: "`UserNoHash` có `equals()` theo email nhưng không có `hashCode()`. Thêm `an@x.com` hai lần vào `HashSet` thì `size()` là bao nhiêu?",
        options: ["1", "2", "0", "Ném exception ở lần thêm thứ hai"],
        answer: 1,
        explain: "hashCode mặc định của Object khác nhau cho mỗi object, nên hai user rơi vào hai bucket. `equals()` không bao giờ được gọi giữa chúng, và set giữ cả hai.",
      },
      board: {
        title: "HashSet.add(): hashCode dẫn đường, equals chốt hạ",
        highlight: "hashCode dẫn đường, equals chốt hạ",
        chips: ["Hai user cùng email phải cùng bucket", "equals và hashCode luôn đi cùng nhau"],
        cards: [
          {
            title: "Thêm an@x.com hai lần",
            diagram: {
              kind: "flow",
              steps: ["set.add(user)", "hashCode() chọn bucket", "Bucket đã có node?", "equals() với node đó"],
              ok: ["Có hashCode đúng", "Cùng bucket, size = 1"],
              bad: ["Quên hashCode", "Khác bucket, size = 2"],
            },
            notes: ["Không có hashCode: hashCode mặc định khác nhau cho mỗi object, `equals()` không bao giờ được gọi giữa hai user.", "Đã chạy: `size=2, contains=false` so với `size=1, contains=true`."],
            takeaway: "Quên hashCode thì equals đúng cũng vô dụng",
          },
          {
            title: "Hai method phải đi cùng nhau",
            diagram: {
              kind: "hub",
              inputs: [{ label: "equals(): theo email" }, { label: "hashCode(): theo email" }],
              center: "HashSet<User>",
              rulesTitle: "Contract",
              rules: ["Cùng email thì cùng bucket", "Cùng bucket thì `equals()` mới được gọi", "Chỉ override một method: vẫn trùng"],
            },
            code: `@Override public int hashCode() {
        return Objects.hash(email);
      }`,
            notes: ["Override hashCode mà quên equals thì equals mặc định vẫn so địa chỉ, nên hai object vẫn bị coi là khác nhau."],
            takeaway: "Cách gọn nhất là record, hoặc sinh cả hai từ cùng một tập field",
          },
        ],
        conclusion: "**Kết luận:** override `equals` thì phải override `hashCode` từ cùng các field, nếu không `HashSet` và `HashMap` giữ trùng.",
      },
      widget: "hashset",
      widgetTitle: "HashSet<User>: thêm cùng một email hai lần",
      after: [
        "Đã chạy thật: không có hashCode thì `size=2, contains=false`; có `Objects.hash(email)` thì `size=1, contains=true`. Cách gọn nhất là `record`, hoặc để IDE/Lombok sinh cả hai method từ cùng một tập field. ",
        "Với JPA entity, đừng dùng Lombok `@Data`. Lý do: `@Data` sinh `equals`, `hashCode` và `toString` từ **mọi field**. Trong đó có id do database sinh (trước khi lưu là null, sau khi lưu mới có số), nên hashCode của entity đổi sau khi persist và entity \"lạc\" khỏi `HashSet` đang chứa nó. Mọi field còn gồm cả quan hệ lazy (đọc tới là chạy thêm query) và quan hệ hai chiều: `Order.toString()` gọi `Customer.toString()`, cái này lại gọi `Order.toString()`, vô tận tới `StackOverflowError`.",
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
        "String immutable: `toUpperCase()`, `concat()`, `replace()` đều trả về chuỗi mới. Nhờ vậy:",
        "- **String pool**: chia sẻ an toàn.",
        "- **Thread-safe**: không cần lock.",
        "- **hashCode được cache**: làm key HashMap nhanh.",
        "- **An toàn**: đường dẫn hay URL đã kiểm tra thì không bị đổi.",
        "Cái giá: nối bằng `+=` trong vòng lặp tạo một String mới mỗi vòng và copy lại toàn bộ. Kéo số phần tử để thấy khác biệt.",
      ],
      widget: "string-builder",
      widgetTitle: "+= trong vòng lặp vs StringBuilder",
      after: [
        "Câu hay hỏi: **String, StringBuilder, StringBuffer khác nhau ra sao?**",
        "- **`String`**: bất biến.",
        "- **`StringBuilder`**: chuỗi sửa được tại chỗ (`append`, `insert`, `reverse`), không `synchronized`. Ra đời ở Java 5 để thay `StringBuffer` trong trường hợp phổ biến là một thread.",
        "- **`StringBuffer`**: cùng các method đó, nhưng mọi method là `synchronized` (thread-safe nhưng chậm hơn vì phải lấy lock). Có từ Java 1.0.",
        "Mặc định dùng `StringBuilder`.",
        "Câu hỏi khác: `new String(\"java\")` tạo mấy object? Tối đa hai: literal `\"java\"` nằm trong String pool (chỉ được thêm vào nếu pool chưa có chuỗi này), cộng với một object mới trên heap do `new` tạo ra. Nếu pool đã có `\"java\"` thì chỉ tạo một.",
        "Viết immutable class:",
        "- **Khoá class và field**: class `final`, field `private final`, không setter.",
        "- **Method \"thay đổi\"**: trả về object mới.",
        "- **Field mutable** như `List`: copy khi nhận vào bằng `List.copyOf(items)`.",
        "Đã chạy thật: sửa list gốc sau khi tạo Order thì `order.getItems()` vẫn là `[book]`, còn `getItems().add(\"x\")` ném UnsupportedOperationException.",
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
