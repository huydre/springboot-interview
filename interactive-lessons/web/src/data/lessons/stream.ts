import timeline from "../timelines/stream.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java output quoted below was run on JDK 21.
export const stream: Lesson = {
  slug: "stream",
  crumb: "Lambda & Stream",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/lambda-stream",
  videoVersion: "69521069",
  scenes: timeline as Scene[],
  title: "Lambda & Stream API: dây chuyền chạy lazy",
  subtitle:
    "Functional interface, lambda và method reference, vì sao stream chỉ chạy khi có thao tác kết thúc và dừng được sớm, sorted khác filter ở đâu, map với flatMap, và khi nào nên quay về vòng for.",
  openingQuiz: {
    question: "Stream.of(1..6).filter(chẵn).map(x * 10).findFirst(), mỗi bước có log. In ra những dòng nào?",
    options: [
      "filter 1..6, rồi map 2, 4, 6, rồi result 20",
      "filter 1, filter 2, map 2, result 20",
      "map 2, map 4, map 6, result 20",
      "Không in gì vì stream lazy",
    ],
    answer: 1,
    explain:
      "Stream xử lý theo chiều dọc: từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, và findFirst dừng ngay khi có kết quả. Đã chạy thật: filter 1, filter 2, map 2, result 20. Số 3 đến 6 không bao giờ được xử lý.",
  },
  roadmap: [
    "Chặng 1: functional interface và lambda. Function, Predicate, Supplier, Consumer; effectively final; method reference.",
    "Chặng 2: stream lazy. Không có terminal thì không chạy; từng phần tử đi hết dây chuyền; short-circuit; sorted là stateful; chỉ dùng một lần.",
    "Chặng 3: map vs flatMap, IntStream, và khi nào dùng vòng for thay cho stream.",
  ],
  sections: [
    {
      id: "functional-interface",
      title: "Phần 1: Functional interface",
      scene: "fi",
      intro: [
        "Bài toán: có danh sách đơn hàng (`An` 250, `Bình` 90, `Chi` 400, `Dũng` 120), cần lấy tên khách có tổng tiền trên 100, sắp A-Z. Viết bằng vòng for: `for (Order o : orders) { if (o.total() > 100) names.add(o.name()); } Collections.sort(names);`. Viết bằng stream: `orders.stream().filter(o -> o.total() > 100).map(Order::name).sorted().toList()`. Đã chạy: cả hai ra `[An, Chi, Dũng]`.",
        "Vòng for nói **làm từng bước thế nào**. Stream nói **cần gì**: lọc theo điều kiện này, lấy tên, sắp xếp. Điều kiện `o.total() > 100` và cách lấy tên `Order::name` là những đoạn **hành vi** được truyền vào method. Truyền hành vi như truyền dữ liệu chính là việc của lambda. Hình dung lambda như một tờ phiếu ghi sẵn việc cần làm, đưa cho method để nó tự dùng khi cần.",
        "Functional interface là interface có đúng một abstract method (default method không tính). Nhờ vậy viết được lambda: truyền hành vi như truyền dữ liệu. `@FunctionalInterface` không bắt buộc nhưng giúp compiler báo lỗi nếu lỡ thêm abstract method thứ hai.",
        "Trước Java 8, muốn truyền hành vi phải viết **anonymous class**: một class không tên, khai báo và tạo object ngay tại chỗ. Ví dụ sắp xếp chuỗi theo độ dài: `new Comparator<String>() { public int compare(String x, String y) { return x.length() - y.length(); } }`. Vì `Comparator` chỉ có một abstract method, lambda viết gọn lại thành `(x, y) -> x.length() - y.length()`. Đã chạy: cả hai cách sắp `[ccc, a, bb]` thành `[a, bb, ccc]`.",
        "Bốn interface hay gặp nhất, mỗi cái ứng với một vai:",
        "- **`Function<T, R>`**, `R apply(T t)`: **máy biến đổi**, nhận T trả R. Ví dụ `s -> s.length()`.",
        "- **`Predicate<T>`**, `boolean test(T t)`: **cổng kiểm tra**, trả đúng hoặc sai. Ví dụ `n -> n > 0`.",
        "- **`Supplier<T>`**, `T get()`: **máy cấp phát**, không nhận gì, đưa ra một giá trị. Ví dụ `() -> new ArrayList<>()`.",
        "- **`Consumer<T>`**, `void accept(T t)`: **thùng tiêu thụ**, nhận vào và làm việc, không trả gì. Ví dụ `x -> System.out.println(x)`.",
        "Nhìn lambda, hỏi hai câu: nó nhận gì vào, trả gì ra? Từ đó biết interface nào.",
      ],
      widget: "functional-interface",
      widgetTitle: "Lambda này thuộc interface nào?",
      after: [
        "Một interface hay bị nhầm với `Supplier<T>` là `Callable<V>`: cả hai không nhận tham số và trả về một giá trị. Khác biệt nằm ở chữ ký: `T get()` không có `throws`, còn `V call() throws Exception`. `Callable` là kiểu task bạn đưa cho thread pool (nhóm thread dùng lại, học ở tuần concurrency) qua `executor.submit(...)` để lấy kết quả về sau.",
        "Vì vậy `Supplier<String> s = () -> Files.readString(p);` không biên dịch được (đã chạy `javac`: `unreported exception IOException`), còn `Callable<String> task = () -> Files.readString(p);` thì được, và `executor.submit(task).get()` trả nội dung file. Đã chạy: in `hello`. Lý do giống bài Exception: checked exception phải được khai báo ở method chứa lời gọi, ở đây là `get()` hoặc `call()`.",
      ],
      quiz: {
        question: "Callable<V> khác Supplier<T> ở điểm nào quan trọng?",
        options: ["Không khác gì", "call() được khai báo throws Exception, nên lambda bên trong ném được checked exception", "Supplier chạy được trên thread khác", "Callable không có giá trị trả về"],
        answer: 1,
        explain: "Supplier.get() không khai báo throws; Callable.call() thì có. Vì vậy executor.submit(() -> ...) với Callable cho phép ném checked exception.",
      },
      parts: [
        {
          id: "compose-and-then",
          title: "Ghép function: andThen, compose, Predicate.and/negate",
          intro: [
            "Ta đã biết bốn functional interface cơ bản. Chúng còn có sẵn method để **ghép** lại với nhau, và câu hỏi hay gặp là `andThen` khác `compose` thế nào.",
            "Với `Function<Integer, Integer> times2 = x -> x * 2` và `plus3 = x -> x + 3`:",
            "- **`f.andThen(g)`**: chạy `f` trước, đưa kết quả cho `g`, tức `g(f(x))`.",
            "- **`f.compose(g)`**: chạy `g` trước rồi tới `f`, tức `f(g(x))`.",
            "Cùng đầu vào 5 mà hai thứ tự cho hai kết quả khác nhau. Đoán trước khi xem.",
          ],
          predict: {
            question: "`times2.andThen(plus3).apply(5)` và `times2.compose(plus3).apply(5)` lần lượt là bao nhiêu?",
            options: ["13 và 13", "13 và 16", "16 và 13", "16 và 16"],
            answer: 1,
            explain: "`andThen`: (5 × 2) + 3 = 13. `compose`: (5 + 3) × 2 = 16. `andThen` đọc theo thứ tự chạy, `compose` thì chạy hàm truyền vào trước.",
          },
          widgetTitle: "Ghép Function và Predicate",
          compare: [
            way(
              "Function: andThen và compose",
              `Function<Integer,Integer> times2 = x -> x * 2;
Function<Integer,Integer> plus3  = x -> x + 3;
times2.andThen(plus3).apply(5);
times2.compose(plus3).apply(5);`,
              [
                ask("`times2.andThen(plus3).apply(5)`", ok("Đã chạy: `13`. Nhân đôi trước (10), rồi cộng 3.")),
                ask("`times2.compose(plus3).apply(5)`", ok("Đã chạy: `16`. Cộng 3 trước (8), rồi nhân đôi.")),
              ],
              "`andThen`: f rồi g. `compose`: g rồi f.",
            ),
            way(
              "Predicate.and / negate, Consumer.andThen",
              `Predicate<String> empty = String::isEmpty;
Predicate<String> longS = s -> s.length() > 3;
Predicate<String> ok = empty.negate().and(longS.negate());
Stream.of("", "ab", "abcd", "xyz").filter(ok).toList();`,
              [
                ask("Lọc chuỗi không rỗng và không dài hơn 3 ký tự", ok("Đã chạy: `[ab, xyz]`.")),
                ask("`log.andThen(audit).accept(\"x\")` với hai `Consumer`", ok("Đã chạy: in `log x` rồi `audit x`, đúng thứ tự ghép.")),
              ],
              "Ghép các điều kiện nhỏ thay vì viết một lambda dài.",
            ),
          ],
          takeaway: {
            lines: [
              "`f.andThen(g)` = g(f(x)); `f.compose(g)` = f(g(x)). Nhớ theo thứ tự chạy: andThen thì f trước.",
              "Predicate có `and`, `or`, `negate`; Consumer có `andThen`; `Function.identity()` là hàm `x -> x`, trả lại chính phần tử (hay dùng làm key khi gom nhóm, học ở bài Collectors).",
            ],
          },
          quiz: {
            question: "`f = x -> x + 1`, `g = x -> x * 10`. `f.compose(g).apply(2)` là bao nhiêu?",
            options: ["21", "30", "12", "23"],
            answer: 0,
            explain: "`compose` chạy `g` trước: 2 × 10 = 20, rồi `f`: 20 + 1 = 21. (`f.andThen(g)` mới ra 30.)",
          },
        },
        {
          id: "function-variants",
          title: "Biến thể hay gặp: BiFunction, UnaryOperator, IntPredicate",
          intro: [
            "Bốn interface cơ bản chưa đủ cho mọi trường hợp. Bốn biến thể sau xuất hiện liên tục trong code và câu hỏi phỏng vấn:",
            "- **`BiFunction<T, U, R>`**: như `Function` nhưng nhận **hai** tham số. `(x, y) -> x + y` với `apply(2, 3)` ra `5`.",
            "- **`UnaryOperator<T>`**: `Function<T, T>` có kiểu vào và ra giống nhau. `String::toUpperCase` với `apply(\"abc\")` ra `ABC`. `List.replaceAll` nhận nó.",
            "- **`BinaryOperator<T>`**: `BiFunction<T, T, T>`, hai tham số cùng kiểu, trả cùng kiểu đó. `reduce` và `Collectors.toMap` (khi gộp key trùng) nhận nó. `BinaryOperator.maxBy(Comparator.naturalOrder()).apply(4, 9)` ra `9`.",
            "- **`IntPredicate`, `IntFunction`, `ToIntFunction`...**: bản dành cho `int`, `long`, `double`. Chúng nhận thẳng kiểu nguyên thuỷ nên không phải bọc `int` thành `Integer` (boxing) mỗi lần gọi. `IntPredicate even = n -> n % 2 == 0;` với `test(6)` ra `true`.",
            "Đã chạy cả bốn ví dụ trên JDK 21. Quy tắc chọn: hai tham số thì `Bi...`, kiểu vào bằng kiểu ra thì `...Operator`, làm việc với số trong vòng lặp lớn thì dùng bản `Int/Long/Double` để tránh boxing.",
          ],
          takeaway: {
            lines: [
              "`UnaryOperator<T>` = `Function<T, T>`; `BinaryOperator<T>` = `BiFunction<T, T, T>`. Có tên riêng để code đọc ra ý định ngay.",
            ],
          },
          quiz: {
            question: "Cần một lambda nhận hai `Integer` và trả `Integer` lớn hơn, để truyền vào `reduce`. Nên khai báo kiểu nào?",
            options: ["`Function<Integer, Integer>`", "`BinaryOperator<Integer>`", "`Predicate<Integer>`", "`Supplier<Integer>`"],
            answer: 1,
            explain: "Hai tham số cùng kiểu và trả cùng kiểu đó là `BinaryOperator<Integer>`. `Function` chỉ nhận một tham số.",
          },
        },
      ],
    },
    {
      id: "lambda",
      title: "Phần 2: Lambda, effectively final và method reference",
      scene: "lam",
      intro: [
        "Phần 1 cho biết lambda thuộc interface nào. Trước khi tới luật riêng của nó, nhắc lại cú pháp, vì các dạng viết gọn hay làm người mới rối:",
        "- **Hai tham số**: `(a, b) -> a + b`.",
        "- **Một tham số**: bỏ được ngoặc, `x -> x * 2`.",
        "- **Không tham số**: `() -> 42`.",
        "- **Thân nhiều câu lệnh**: dùng `{ }` và phải có `return` nếu interface trả giá trị, ví dụ `x -> { int y = x * 2; return y + 1; }`.",
        "Giờ tới luật riêng của lambda với biến bên ngoài nó.",
        "Biến local dùng trong lambda phải effectively final: không bị gán lại sau khi khai báo. Ví dụ `int discount = 10; list.forEach(p -> System.out.println(p - discount));` biên dịch được. Đã biên dịch thử: thêm dòng `discount = 20;` ngay sau lambda thì báo lỗi *local variables referenced from a lambda expression must be final or effectively final*.",
        "Lý do: lambda copy giá trị lúc được tạo và có thể chạy sau, hoặc ở thread khác; nếu cho gán lại thì không biết lambda thấy giá trị nào.",
        "Có một mẹo lách luật: `int[] counter = {0}; List.of(1, 2, 3).forEach(x -> counter[0] += x);`. Biến `counter` không bị gán lại (vẫn trỏ cùng một mảng), chỉ phần tử bên trong đổi, nên compiler chấp nhận. Đã chạy: `counter[0]` là 6. Nhưng cách này dễ sai khi chạy song song; muốn tính tổng thì dùng `sum()` hoặc `reduce()`.",
        "**Method reference** là cách viết ngắn của một lambda chỉ gọi đúng một method có sẵn, viết bằng dấu `::`. Có bốn loại:",
        "- **Static method**: `Integer::parseInt`, tức `s -> Integer.parseInt(s)`.",
        "- **Method của một object cụ thể**: `System.out::println`, tức `x -> System.out.println(x)`.",
        "- **Method của tham số đầu tiên**: `String::toUpperCase`, tức `s -> s.toUpperCase()`.",
        "- **Constructor**: `ArrayList::new`, tức `() -> new ArrayList<>()`.",
      ],
      widget: "method-ref",
      widgetTitle: "Bốn loại method reference",
      after: [
        "Câu hay hỏi: lambda có phải anonymous class không? Không. Điểm khác dễ thấy nhất là `this`: trong anonymous class, `this` là chính object anonymous đó; trong lambda, `this` là object của class bao ngoài. Điểm khác nữa: anonymous class sinh ra một file `.class` riêng (như `L$1.class`), còn lambda thì không. Đã chạy `javap`: trình biên dịch chỉ thêm một method ẩn tên kiểu `lambda$main$0`, và JVM tạo object lambda lúc chạy qua `invokedynamic`.",
      ],
      quiz: {
        question: "String::toUpperCase tương đương lambda nào?",
        options: ["() -> String.toUpperCase()", "s -> s.toUpperCase()", "s -> String.toUpperCase(s)", "x -> System.out.println(x)"],
        answer: 1,
        explain: "Đây là loại \"method của tham số đầu tiên\": phần tử nhận vào chính là object gọi method.",
      },
    },
    {
      id: "lazy",
      title: "Phần 3: Stream là lazy",
      scene: "lazy",
      intro: [
        "Lambda là viên gạch. Giờ ghép chúng thành dây chuyền xử lý dữ liệu.",
        "Hình dung một băng chuyền nhà máy: hàng (source) chạy qua các trạm (intermediate operation như `filter`, `map`) và kết thúc ở khâu đóng gói (terminal operation). Các trạm chỉ là cấu hình; chỉ khi ai đó bật máy ở khâu cuối, hàng mới chạy. Vậy stream là dây chuyền: source, các intermediate operation (lazy) và một terminal operation. Không có terminal thì không chạy gì. Khi chạy, từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, nên `findFirst`, `anyMatch`, `limit` dừng được sớm.",
        "Đổi thao tác kết thúc để xem dây chuyền chạy tới đâu. Mọi log trong mô phỏng là output thật trên JDK 21.",
      ],
      predict: {
        question: "Dây chuyền `filter(chẵn).map(×10)` trên 1 đến 6, kết thúc bằng `.count()`. Có bao nhiêu số đi qua `filter`?",
        options: ["Chỉ tới số 2, rồi dừng sớm", "Cả 6 số", "Không số nào, vì `count()` biết sẵn kích thước", "3 số chẵn"],
        answer: 1,
        explain: "`count()` cần đếm hết, và vì có `filter` nên stream không biết trước kích thước. Mọi phần tử đều phải đi qua dây chuyền.",
      },
      board: {
        title: "Stream là dây chuyền lazy: không terminal thì không chạy",
        highlight: "lazy",
        chips: ["Từng phần tử đi hết dây chuyền", "findFirst, anyMatch, limit dừng sớm"],
        cards: [
          {
            title: "Dây chuyền dừng sớm",
            diagram: {
              kind: "flow",
              steps: ["Stream.of(1..6)", "filter(chẵn)", "map(x -> x * 10)", "anyMatch(x -> x > 30)"],
              ok: ["Gặp số 4 → 40", "Dừng sớm: true"],
              bad: ["Không có terminal", "Không chạy gì cả"],
            },
            notes: ["Log thật: filter 1, filter 2, map 2, filter 3, filter 4, map 4. Phần tử 5 và 6 không bao giờ được xét."],
            code: `Stream.of(1, 2, 3, 4, 5, 6)
    .filter(x -> x % 2 == 0)
    .map(x -> x * 10)
    .anyMatch(x -> x > 30);`,
            takeaway: "Từng phần tử đi hết dây chuyền rồi mới tới phần tử sau",
          },
          {
            title: "count() bỏ qua peek",
            diagram: { kind: "pipe", from: "List.of(1, 2, 3).stream()", via: "peek(...).count()", to: "3", skipped: ["peek(...)"], skippedLabel: "Không chạy" },
            notes: ["`peek(...)` cho phép xem phần tử đi qua dây chuyền (thường để debug), không đổi dữ liệu. Từ Java 9, `count()` biết kích thước nguồn nên bỏ qua cả pipeline, kể cả `peek`. Có `filter` thì stream không biết trước kích thước và vẫn chạy hết."],
            takeaway: "Đừng đặt logic quan trọng trong peek",
          },
        ],
        conclusion: "**Kết luận:** thao tác trung gian chỉ là công thức, terminal mới chạy nó, và có thể dừng ngay khi đủ kết quả.",
      },
      widget: "lazy-pipeline",
      widgetTitle: "Stream.of(1..6).filter(chẵn).map(×10) + terminal",
      after: [
        "Stream cũng **không sửa collection gốc**: `list.stream().map(x -> x * 10).toList()` trả về một list mới, còn `list` vẫn giữ nguyên giá trị cũ.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Không có terminal → không chạy gì. Có terminal → từng phần tử đi hết dây chuyền → `findFirst`, `anyMatch`, `limit` dừng được sớm.",
        ],
      },
      quiz: {
        question: "Với dây chuyền trên, .anyMatch(x -> x > 30) dừng sau khi xử lý phần tử nào?",
        options: ["Số 2", "Số 4", "Số 6", "Không dừng sớm"],
        answer: 1,
        explain: "2 → 20 chưa > 30; 4 → 40 > 30 nên trả true ngay. Đã chạy thật: filter 1, filter 2, map 2, filter 3, filter 4, map 4.",
      },
      parts: [
        {
          id: "find-first-any",
          title: "findFirst và findAny: khác nhau khi chạy song song",
          intro: [
            "Ta đã thấy các thao tác short-circuit như `findFirst` dừng sớm. Vậy `findAny` khác `findFirst` ở đâu, và khi nào nên chọn cái nào?",
            "Cả hai trả về `Optional` của một phần tử thoả điều kiện (rỗng nếu không có). `parallelStream()` là stream chia dữ liệu cho nhiều thread xử lý cùng lúc. Khác biệt:",
            "- **`findFirst()`**: luôn trả phần tử **đầu tiên theo thứ tự gặp** (encounter order) của stream, kể cả khi chạy song song.",
            "- **`findAny()`**: được phép trả **bất kỳ** phần tử nào thoả điều kiện. Stream tuần tự thường vẫn trả phần tử đầu, nhưng với stream song song thì trả phần tử của luồng nào tìm thấy trước, không cần chờ các luồng khác.",
            "Với `nums` là list các số 1 đến 1.000.000 và điều kiện `n % 1000 == 0`: phần tử đầu là 1000.",
          ],
          predict: {
            question: "`nums.parallelStream().filter(n -> n % 1000 == 0).findAny()` trên 1 đến 1.000.000. Kết quả?",
            options: [
              "Luôn là 1000",
              "Một số chia hết cho 1000 bất kỳ, không đảm bảo là 1000",
              "Luôn là 1000000",
              "Optional.empty",
            ],
            answer: 1,
            explain: "`findAny` không cam kết thứ tự. Luồng song song nào tìm được trước thì trả về cái đó.",
          },
          widgetTitle: "Cùng bộ lọc, hai cách tìm",
          compare: [
            way(
              "findFirst",
              `nums.parallelStream()
    .filter(n -> n % 1000 == 0)
    .findFirst();`,
              [
                ask("Chạy song song 3 lần", ok("Đã chạy: cả 3 lần đều ra `1000`. Giữ đúng thứ tự gặp nhưng phải phối hợp giữa các luồng.")),
                ask("Stream rỗng, hoặc phần tử đầu là `null`", bad("Đã chạy: stream rỗng cho `Optional.empty`. Phần tử `null` thì ném `NullPointerException`, vì `Optional` không chứa `null`.")),
              ],
              "Kết quả xác định, nhưng ràng buộc thứ tự.",
            ),
            way(
              "findAny",
              `nums.parallelStream()
    .filter(n -> n % 1000 == 0)
    .findAny();`,
              [
                ask("Chạy song song 3 lần", ok("Đã chạy: cả 3 lần ra `657000` trên máy này, không phải `1000`. Hợp lệ vì `findAny` không đảm bảo phần tử nào; lần chạy khác có thể ra số khác.")),
                ask("Chạy tuần tự `nums.stream()...findAny()`", ok("Đã chạy: ra `1000`. Tuần tự thường trùng với `findFirst`, nhưng đừng dựa vào đó.")),
              ],
              "Nhanh hơn khi song song, chỉ dùng khi phần tử nào cũng được.",
            ),
          ],
          takeaway: {
            lines: [
              "Cần phần tử đầu theo thứ tự thì `findFirst`; chỉ cần \"có hay không, một cái bất kỳ\" thì `findAny`, đặc biệt với stream song song.",
            ],
          },
          quiz: {
            question: "Kiểm tra xem có ít nhất một đơn lỗi trong danh sách lớn, chạy song song, và không quan tâm đơn nào. Nên dùng gì?",
            options: ["`findFirst()` để chắc chắn", "`findAny()` hoặc `anyMatch()`, vì không cần thứ tự", "`sorted().findFirst()`", "`count() > 0`"],
            answer: 1,
            explain: "Không cần thứ tự thì bỏ ràng buộc đó đi: `findAny` hay `anyMatch` dừng ngay khi một luồng tìm thấy.",
          },
        },
        {
          id: "parallel-traps",
          title: "parallelStream: hai bẫy hay bị hỏi",
          intro: [
            "Ta vừa dùng `parallelStream()` ở phần trên. Nó nhanh với dữ liệu lớn, nhưng có hai bẫy mà phỏng vấn viên rất thích hỏi.",
            "- **Bẫy 1, thứ tự**: `forEach` trên stream song song không đảm bảo thứ tự. Đã chạy `IntStream.rangeClosed(1, 8).parallel().forEach(...)`: thứ tự in ra **không** phải 1 đến 8. Cần đúng thứ tự thì dùng `forEachOrdered`: đã chạy, ra `1,2,3,4,5,6,7,8`.",
            "- **Bẫy 2, sửa biến chung**: `IntStream.range(0, 10000).parallel().forEach(list::add)` với `list` là `ArrayList`. `ArrayList` không an toàn khi nhiều thread cùng ghi. Đã chạy 20 lần: **cả 20 lần** đều sai (thiếu phần tử hoặc ném exception).",
            "Cách sửa bẫy 2: để stream tự gom kết quả thay vì tự `add` vào biến ngoài. `IntStream.range(0, 10000).parallel().boxed().toList()` luôn đủ 10.000 phần tử. Đây cũng là lý do bài này dặn tránh side effect trong lambda (Phần 6).",
          ],
          takeaway: {
            lines: [
              "Song song thì không dựa vào thứ tự của `forEach` và không sửa biến chung trong lambda. Cần thứ tự: `forEachOrdered`. Cần gom kết quả: `collect` hoặc `toList()`.",
            ],
          },
          quiz: {
            question: "Vì sao `parallelStream().forEach(list::add)` với `list` là `ArrayList` là sai?",
            options: [
              "Vì `forEach` không chạy song song được",
              "Vì nhiều thread cùng ghi vào `ArrayList` không an toàn, kết quả có thể thiếu phần tử hoặc ném exception",
              "Vì `list::add` không phải method reference hợp lệ",
              "Vì stream song song luôn chậm hơn",
            ],
            answer: 1,
            explain: "`ArrayList` không thread-safe. Để stream tự gom bằng `collect` hay `toList()` thì không cần tự đồng bộ.",
          },
        },
      ],
    },
    {
      id: "stateful",
      title: "Phần 4: Thao tác stateful và stream chỉ dùng một lần",
      scene: "state",
      intro: [
        "Thao tác **stateful** là thao tác phải nhớ dữ liệu đã thấy. `sorted()` là ví dụ rõ nhất: muốn biết số nhỏ nhất thì phải nhận **đủ** dữ liệu rồi mới cho ra phần tử đầu tiên, nên tốn bộ nhớ và không dừng sớm được. `distinct()` cũng stateful vì phải nhớ các giá trị đã gặp, nhưng với stream tuần tự nó vẫn cho phần tử đi qua ngay khi gặp lần đầu (đã chạy: `Stream.of(1, 1, 2, 3, 3).peek(...).distinct().findFirst()` chỉ in `peek 1`), chỉ `sorted()` mới chặn cả dòng. `filter`, `map` là stateless: không nhớ gì giữa các phần tử. Bật tắt `sorted()` để thấy thứ tự log đổi.",
      ],
      predict: {
        question: "`Stream.of(3, 1, 2).peek(x -> log(\"peek \" + x)).sorted().forEach(x -> log(\"out \" + x))` in log theo thứ tự nào?",
        options: [
          "peek 3, out 3, peek 1, out 1, peek 2, out 2",
          "peek 3, peek 1, peek 2, out 1, out 2, out 3",
          "out 1, out 2, out 3, vì peek bị bỏ qua",
          "peek 1, out 1, peek 2, out 2, peek 3, out 3",
        ],
        answer: 1,
        explain: "`sorted()` phải nhận đủ 3 phần tử mới biết số nào nhỏ nhất, nên mọi `peek` chạy trước, rồi `forEach` mới nhận lần lượt 1, 2, 3.",
      },
      widget: "sorted-peek",
      widgetTitle: "peek + sorted",
      after: [
        "Stream chỉ dùng được một lần: gọi `count()` lần hai ném `IllegalStateException: stream has already been operated upon or closed`. Muốn dùng lại thì gọi `list.stream()` lần nữa, hoặc giữ một `Supplier<Stream<T>>`.",
        "Stream vô hạn như `Stream.iterate(1, x -> x * 2)` phải đi cùng short-circuit: `.limit(6)` ra [1, 2, 4, 8, 16, 32]; `.takeWhile(x -> x < 5)` ra [1, 2, 4].",
      ],
      quiz: {
        question: "Vì sao sorted() trên một stream vô hạn sẽ không bao giờ kết thúc?",
        options: ["Vì sorted chạy song song", "Vì sorted là stateful: phải nhận hết phần tử mới cho ra phần tử đầu tiên", "Vì sorted cần Comparator", "Nó vẫn kết thúc"],
        answer: 1,
        explain: "Không thể biết phần tử nhỏ nhất trước khi thấy toàn bộ dữ liệu, mà stream vô hạn thì không có \"toàn bộ\".",
      },
    },
    {
      id: "flatmap",
      title: "Phần 5: map, flatMap và IntStream",
      scene: "flat",
      intro: [
        "`map` nhận T trả R: mỗi phần tử thành đúng một. `flatMap` nhận T trả Stream<R>: mỗi phần tử thành 0..n, rồi làm phẳng. Ví dụ thực tế: lấy mọi item của mọi đơn hàng.",
      ],
      widget: "flatmap",
      widgetTitle: "map vs flatMap trên danh sách đơn hàng",
      after: [
        "Với số, dùng `IntStream`/`LongStream`/`DoubleStream` để tránh boxing (tự bọc mỗi `int` thành một object `Integer`, xem bài equals và hashCode): `IntStream.rangeClosed(1, 5).sum()` là 15; với `[\"a\", \"bb\"]`, `mapToInt(String::length).summaryStatistics()` in `IntSummaryStatistics{count=2, sum=3, min=1, average=1.500000, max=2}`. Quay lại Stream<Integer> bằng `.boxed()`.",
      ],
      quiz: {
        question: "List<List<String>> nested = [[a, b], [c]]. nested.stream().map(List::stream).toList() có kiểu gì?",
        options: ["List<String> [a, b, c]", "List<Stream<String>>: vẫn lồng nhau, chưa làm phẳng", "Lỗi biên dịch", "List<List<String>>"],
        answer: 1,
        explain: "map giữ đúng một phần tử cho mỗi list, nên ra danh sách các stream. Phải dùng flatMap để làm phẳng thành [a, b, c].",
      },
    },
    {
      id: "stream-or-for",
      title: "Phần 6: Khi nào dùng stream, khi nào dùng vòng for",
      scene: "when",
      intro: [
        "Dùng stream cho lọc, biến đổi, gom nhóm và pipeline rõ ràng, có short-circuit. Dùng vòng for khi:",
        "- **Logic nhiều nhánh**: if/else lồng nhau trong lambda dài khó đọc hơn vòng for.",
        "- **break/continue phức tạp**: stream không có `break`, chỉ mô phỏng được bằng `takeWhile` hay `limit`, khó đọc khi điều kiện dừng phức tạp.",
        "- **Checked exception ở mỗi bước**: lambda của `map`/`filter` không được ném checked exception, phải bọc lại (xem bài Exception, Phần 2, phần checked exception trong lambda).",
        "- **Phải sửa nhiều biến bên ngoài**: lambda chỉ đọc được biến effectively final (không bị gán lại, Phần 2), nên vòng for hợp hơn.",
        "Anti-pattern hay gặp: `users.stream().forEach(u -> names.add(u.getName()))` là dùng stream như vòng for có side effect. Viết `users.stream().map(User::getName).toList()`.",
      ],
      quiz: {
        question: "Đoạn nào nên viết bằng vòng for thay vì stream?",
        options: [
          "Lọc user active rồi lấy email",
          "Đọc từng file, mỗi bước có thể ném IOException, cần dừng ngay ở file lỗi đầu tiên và ghi log chi tiết",
          "Đếm số đơn có tổng > 1 triệu",
          "Tính tổng tiền các item",
        ],
        answer: 1,
        explain: "Checked exception ở mỗi bước và luồng điều khiển phức tạp làm stream rườm rà (phải bọc exception trong lambda). Vòng for đọc và debug dễ hơn.",
      },
    },
  ],
  modelAnswer:
    "Functional interface là interface có đúng một abstract method, nhờ đó viết được lambda: Function biến đổi, Predicate kiểm tra, Supplier cung cấp, Consumer tiêu thụ. Biến local dùng trong lambda phải effectively final vì lambda copy giá trị và có thể chạy sau hoặc ở thread khác. Stream là dây chuyền gồm source, các intermediate operation lazy và một terminal operation; không có terminal thì không chạy gì. Khi chạy, từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, nên findFirst, anyMatch, limit dừng được sớm, ví dụ filter số chẵn rồi findFirst trên 1 đến 6 chỉ xử lý tới số 2. Ngoại lệ là sorted: phải nhận đủ dữ liệu mới cho ra phần tử đầu tiên (distinct cũng phải nhớ các giá trị đã gặp nhưng vẫn cho qua từng phần tử). Stream không sửa collection gốc và chỉ dùng được một lần. map biến một thành một, flatMap biến một thành nhiều rồi làm phẳng; với số em dùng IntStream để tránh boxing. Logic nhiều nhánh hay có checked exception thì em dùng vòng for cho dễ đọc.",
};
