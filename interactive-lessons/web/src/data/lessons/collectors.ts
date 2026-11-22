import timeline from "../timelines/collectors.json";
import type { Lesson, Scene } from "../types";

// Sample data used everywhere (docs/study-notes/02.07): An IT 2000 5y, Bình IT 3000 2y, Chi HR 1500 7y, Dũng HR 1800 1y, Em Sales 2500 3y.
// Every Java output quoted below was run on JDK 21.
export const collectors: Lesson = {
  slug: "collectors",
  crumb: "Collectors",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/collectors",
  videoVersion: "b45fe11c",
  scenes: timeline as Scene[],
  title: "Collectors: gom stream như GROUP BY",
  subtitle:
    "collect và downstream collector, hai cái bẫy của toMap, groupingBy kèm counting, averaging, mapping, maxBy với collectingAndThen, partitioningBy, joining, teeing, và khi nào dùng reduce thay cho collect.",
  openingQuiz: {
    question: "emps.stream().collect(Collectors.toMap(Employee::dept, Employee::name)), trong đó An và Bình cùng phòng IT. Kết quả là gì?",
    options: [
      "{IT=Bình, HR=Dũng, Sales=Em}: value sau ghi đè value trước",
      "{IT=An, HR=Chi, Sales=Em}: giữ value đầu tiên",
      "IllegalStateException: Duplicate key IT",
      "{IT=[An, Bình], HR=[Chi, Dũng], Sales=[Em]}",
    ],
    answer: 2,
    explain:
      "toMap không tự quyết khi trùng key. Đã chạy thật: IllegalStateException: Duplicate key IT (attempted merging values An and Bình). Muốn chạy được thì truyền merge function làm tham số thứ ba.",
  },
  roadmap: [
    "Chặng 1: collect, Collectors và downstream collector (giống GROUP BY). toMap và hai cái bẫy: key trùng, value null.",
    "Chặng 2: groupingBy với counting, averagingDouble, mapping; chọn loại Map; maxBy + collectingAndThen.",
    "Chặng 3: partitioningBy, joining, teeing; reduce khác collect; luyện 10 bài viết tay.",
  ],
  sections: [
    {
      id: "collect-downstream",
      title: "Phần 1: collect và downstream collector",
      scene: "flow",
      intro: [
        "**Dữ liệu dùng cho cả bài.** Mọi ví dụ và kết quả bên dưới chạy trên cùng một danh sách `emps` gồm 5 nhân viên, kiểu `record Employee(String name, String dept, double salary, int years)` (tên, phòng, lương, số năm kinh nghiệm):",
        "**An**: IT, lương 2000, 5 năm. **Bình**: IT, lương 3000, 2 năm. **Chi**: HR, lương 1500, 7 năm. **Dũng**: HR, lương 1800, 1 năm. **Em**: Sales, lương 2500, 3 năm.",
        "`collect(...)` là terminal operation gom các phần tử của stream thành một kết quả: list, map, chuỗi, con số. `Collectors` chứa sẵn các công thức gom phổ biến.",
        "Nhiều collector nhận thêm một **downstream collector** để xử lý tiếp từng nhóm. Nhớ nhanh bằng SQL: `COUNT(*) ... GROUP BY dept` là `groupingBy(Employee::dept, counting())`, `AVG(salary)` là `averagingDouble(Employee::salary)`, `SUM(salary)` là `summingDouble(Employee::salary)`.",
        "Ví dụ với dữ liệu trên, đã chạy: `groupingBy(Employee::dept, counting())` ra `{Sales=1, HR=2, IT=2}`, còn `groupingBy(Employee::dept, summingDouble(Employee::salary))` ra `{Sales=2500.0, HR=3300.0, IT=5000.0}` (IT = 2000 + 3000, HR = 1500 + 1800).",
      ],
      quiz: {
        question: "Câu SQL SELECT dept, SUM(salary) FROM emp GROUP BY dept tương ứng với collector nào?",
        options: [
          "toMap(Employee::dept, Employee::salary)",
          "groupingBy(Employee::dept, summingDouble(Employee::salary))",
          "partitioningBy(Employee::dept, summingDouble(Employee::salary))",
          "reduce(0.0, Double::sum)",
        ],
        answer: 1,
        explain: "groupingBy chia nhóm theo dept, downstream summingDouble cộng lương trong từng nhóm. Đã chạy: {Sales=2500.0, HR=3300.0, IT=5000.0}. toMap chỉ ghép mỗi nhân viên thành một cặp key-value chứ không cộng dồn theo nhóm (Phần 2 sẽ thấy nó còn ném lỗi khi trùng key).",
      },
    },
    {
      id: "tomap",
      title: "Phần 2: toMap và hai cái bẫy",
      scene: "tomap",
      intro: [
        "**Bẫy 1, key trùng:** `toMap(Employee::dept, Employee::name)` ném `IllegalStateException: Duplicate key IT`. Sửa bằng merge function (tham số 3) quyết định khi trùng key thì làm gì; tham số 4 (`TreeMap::new`) chọn loại Map.",
        "**Bẫy 2, value null:** `toMap` ném `NullPointerException` khi có value null, dù `HashMap.put(\"x\", null)` vẫn chạy bình thường. Lý do: bản có merge function đưa từng cặp vào map bằng `Map.merge`, mà với `merge`, null mang nghĩa \"xoá key\" (hàm gộp trả null thì key bị xoá; đã chạy: map `{k=v}` sau `merge` trả null thành `{}`). Vì null đã có nghĩa riêng nên `merge` cấm value null, và bản 2 tham số cũng giữ đúng luật đó bằng `Objects.requireNonNull(value)`.",
        "Value có thể null thì lọc trước bằng `filter`, hoặc dùng vòng for với `map.put`.",
      ],
      widget: "tomap-trap",
      widgetTitle: "Đổi tham số của toMap",
      quiz: {
        question: "toMap(Employee::dept, Employee::salary, Double::sum) trả về Map loại gì, thứ tự key ra sao?",
        options: ["TreeMap, key sắp xếp", "HashMap, thứ tự không đảm bảo", "LinkedHashMap, giữ thứ tự xuất hiện", "Map không sửa được"],
        answer: 1,
        explain: "Không truyền tham số 4 thì mặc định là HashMap. Đã chạy: {Sales=2500.0, HR=3300.0, IT=5000.0}. Thêm TreeMap::new thì ra {HR=3300.0, IT=5000.0, Sales=2500.0}.",
      },
    },
    {
      id: "grouping",
      title: "Phần 3: groupingBy với downstream",
      scene: "group",
      intro: [
        "`groupingBy(Employee::dept)` chia nhân viên theo phòng; mỗi nhóm mặc định là `List<Employee>`. Thêm downstream để xử lý từng nhóm: `counting()` ra `Long`, `averagingDouble` ra trung bình, `mapping(Employee::name, toList())` chỉ lấy tên.",
        "Mặc định kết quả là `HashMap` nên thứ tự key không đảm bảo: `{Sales=1, HR=2, IT=2}`. Muốn key sắp xếp thì dùng dạng 3 tham số `groupingBy(f, TreeMap::new, downstream)`; muốn giữ thứ tự xuất hiện thì `LinkedHashMap::new`.",
      ],
      widget: "grouping-by",
      widgetTitle: "Chọn downstream và loại Map",
      quiz: {
        question: "groupingBy(Employee::dept, counting()) trả về value kiểu gì cho mỗi phòng?",
        options: ["int", "Integer", "Long", "List<Employee>"],
        answer: 2,
        explain: "counting() là Collector<T, ?, Long>. Đã kiểm tra: get(\"IT\").getClass() là java.lang.Long.",
      },
    },
    {
      id: "maxby",
      title: "Phần 4: maxBy và collectingAndThen",
      scene: "max",
      intro: [
        "`maxBy(comparator)` trả về `Optional<Employee>`. `Optional` là một cái hộp có thể chứa giá trị hoặc rỗng (học kỹ ở bài Optional); ở đây nó có vì về lý thuyết nhóm có thể rỗng. `collectingAndThen(downstream, f)` cho phép xử lý thêm kết quả của downstream, ở đây là mở Optional và lấy tên: `{HR=Dũng, IT=Bình, Sales=Em}` (với `TreeMap::new`).",
        "Trong `groupingBy`, mỗi nhóm luôn có ít nhất một phần tử nên `get()` an toàn.",
      ],
      after: [
        "Muốn lấy cả `Employee` mà không bọc Optional: `collectingAndThen(maxBy(...), Optional::get)`, trong đó `Optional::get` lấy giá trị ra khỏi hộp. Đã chạy: HR là Dũng (1800.0), IT là Bình (3000.0), Sales là Em (2500.0).",
        "Đọc thêm, không bắt buộc: cũng làm được bằng `toMap(Employee::dept, Function.identity(), BinaryOperator.maxBy(Comparator.comparingDouble(Employee::salary)), TreeMap::new)`. `Function.identity()` nghĩa là value chính là nhân viên đó, còn `BinaryOperator.maxBy(...)` là merge function: khi hai nhân viên trùng phòng thì giữ người lương cao hơn.",
      ],
      quiz: {
        question: "Vì sao groupingBy(dept, maxBy(cmp)) trả về Map<String, Optional<Employee>> chứ không phải Map<String, Employee>?",
        options: [
          "Vì groupingBy luôn bọc value trong Optional",
          "Vì maxBy là collector dùng chung, về lý thuyết có thể chạy trên nhóm rỗng nên trả Optional",
          "Vì Employee là record",
          "Vì TreeMap không chứa được null",
        ],
        answer: 1,
        explain: "maxBy không biết nó được dùng trong groupingBy. Trên một stream rỗng nó không có phần tử nào để trả, nên kiểu trả về là Optional. collectingAndThen mở Optional ra.",
      },
    },
    {
      id: "partition",
      title: "Phần 5: partitioningBy",
      scene: "part",
      intro: [
        "`partitioningBy(predicate)` chia đúng hai nhóm theo true và false: `{false=[Bình, Dũng, Em], true=[An, Chi]}` với điều kiện từ 5 năm kinh nghiệm.",
        "Khác `groupingBy(e -> e.years() >= 5)` ở chỗ `partitioningBy` **luôn có đủ hai key**, kể cả khi nhóm rỗng. Thử chọn điều kiện không ai thỏa hoặc stream rỗng để thấy khác biệt.",
      ],
      widget: "partition-vs-group",
      widgetTitle: "partitioningBy hay groupingBy",
      quiz: {
        question: "Trên stream rỗng, partitioningBy(...) và groupingBy(...) lần lượt trả về gì?",
        options: ["{} và {}", "{false=[], true=[]} và {}", "{false=[], true=[]} và {false=[], true=[]}", "Cả hai ném exception"],
        answer: 1,
        explain: "partitioningBy luôn tạo sẵn hai key; groupingBy chỉ tạo key khi có phần tử. Đã chạy đúng như vậy trên JDK 21.",
      },
    },
    {
      id: "joining-teeing",
      title: "Phần 6: joining và teeing",
      scene: "join",
      intro: [
        "`joining(\", \", \"[\", \"]\")` nối chuỗi với dấu phân cách, tiền tố, hậu tố: `[An, Bình, Chi, Dũng, Em]`. Không tham số thì nối liền: `AnBìnhChiDũngEm`.",
        "`teeing` (Java 12) chạy hai collector trên cùng một stream rồi gộp kết quả: `teeing(counting(), summingDouble(Employee::salary), (count, sum) -> sum / count)` ra `2160.0`.",
      ],
      after: [
        "Cần nhiều thống kê một lúc thì `summarizingDouble(Employee::salary)` gọn hơn: `DoubleSummaryStatistics{count=5, sum=10800.000000, min=1500.000000, average=2160.000000, max=3000.000000}`.",
      ],
      quiz: {
        question: "teeing(c1, c2, merger) làm gì?",
        options: [
          "Chạy c1 rồi chạy c2 trên kết quả của c1",
          "Đưa từng phần tử vào cả c1 và c2, rồi dùng merger gộp hai kết quả",
          "Chia stream làm đôi, nửa đầu vào c1, nửa sau vào c2",
          "Chạy c1 và c2 trên hai thread",
        ],
        answer: 1,
        explain: "Mỗi phần tử đi vào cả hai collector (như chữ T của ống nước), cuối cùng merger nhận hai kết quả: ở ví dụ là 5 và 10800.0, ra 2160.0.",
      },
    },
    {
      id: "reduce-collect",
      title: "Phần 7: reduce hay collect, và 10 bài luyện viết tay",
      scene: "reduce",
      intro: [
        "`reduce` gộp dần thành **một giá trị bất biến** (tổng, tích, max): `map(Employee::salary).reduce(0.0, Double::sum)` ra `10800.0`; `mapToDouble(Employee::salary).sum()` gọn hơn và không boxing. `collect` gom vào **container có thể thay đổi** (List, Map, StringBuilder).",
        "Đừng dùng `reduce` để gom vào List: mỗi bước tạo list mới và rất chậm.",
        "Phỏng vấn thường bắt viết stream trên giấy, không có IDE gợi ý. Tự viết từng bài rồi mới mở đáp án.",
      ],
      widget: "collector-drill",
      widgetTitle: "10 bài luyện viết tay",
      quiz: {
        question: "Muốn gom tên nhân viên vào một List, cách nào đúng?",
        options: [
          "reduce(new ArrayList<>(), (list, e) -> { list.add(e.name()); return list; }, ...)",
          "map(Employee::name).toList() hoặc collect(Collectors.toList())",
          "mapToDouble(...).sum()",
          "forEach(e -> names.add(e.name()))",
        ],
        answer: 1,
        explain: "Gom vào container là việc của collect (hoặc toList từ Java 16). reduce dành cho gộp thành một giá trị; forEach với side effect là anti-pattern.",
      },
    },
  ],
  modelAnswer:
    "collect gom phần tử của stream thành một kết quả bằng các công thức có sẵn trong Collectors. Em hay dùng groupingBy kèm downstream collector như counting, averagingDouble, mapping, giống GROUP BY trong SQL; mặc định groupingBy trả HashMap nên muốn key sắp xếp em truyền TreeMap::new. Để lấy phần tử lớn nhất mỗi nhóm em dùng maxBy, nó trả Optional nên em bọc bằng collectingAndThen để mở ra. Hai bẫy của toMap là key trùng thì ném IllegalStateException, phải truyền merge function, và value null thì ném NullPointerException vì toMap không nhận value null. partitioningBy khác groupingBy ở chỗ luôn có đủ hai key true và false. reduce dùng để gộp thành một giá trị như tổng; gom vào List hay Map thì dùng collect.",
};
