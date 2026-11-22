import timeline from "../timelines/stream.json";
import type { Lesson, Scene } from "../types";

// Every Java output quoted below was run on JDK 21.
export const stream: Lesson = {
  slug: "stream",
  crumb: "Lambda & Stream",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/lambda-stream",
  videoVersion: "b8d77c62",
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
        "Functional interface là interface có đúng một abstract method (default method không tính). Nhờ vậy viết được lambda: truyền hành vi như truyền dữ liệu. `@FunctionalInterface` không bắt buộc nhưng giúp compiler báo lỗi nếu lỡ thêm abstract method thứ hai.",
        "Trước Java 8, muốn truyền hành vi phải viết **anonymous class**: một class không tên, khai báo và tạo object ngay tại chỗ. Ví dụ sắp xếp chuỗi theo độ dài: `new Comparator<String>() { public int compare(String x, String y) { return x.length() - y.length(); } }`. Vì `Comparator` chỉ có một abstract method, lambda viết gọn lại thành `(x, y) -> x.length() - y.length()`. Đã chạy: cả hai cách sắp `[ccc, a, bb]` thành `[a, bb, ccc]`.",
        "Mẹo nhớ bốn interface hay gặp:",
        "- **Function**: biến đổi.",
        "- **Predicate**: kiểm tra.",
        "- **Supplier**: cung cấp.",
        "- **Consumer**: tiêu thụ.",
        "Chọn interface đúng cho từng lambda.",
      ],
      widget: "functional-interface",
      widgetTitle: "Lambda này thuộc interface nào?",
      after: [
        "Một interface hay bị nhầm với `Supplier<T>` là `Callable<V>`: cả hai không nhận tham số và trả về một giá trị. Khác biệt nằm ở chữ ký: `T get()` không có `throws`, còn `V call() throws Exception`. `Callable` là kiểu task bạn đưa cho thread pool qua `executor.submit(...)` để lấy kết quả về sau.",
        "Vì vậy `Supplier<String> s = () -> Files.readString(p);` không biên dịch được (đã chạy `javac`: `unreported exception IOException`), còn `Callable<String> task = () -> Files.readString(p);` thì được, và `executor.submit(task).get()` trả nội dung file. Đã chạy: in `hello`. Lý do giống bài Exception: checked exception phải được khai báo ở method chứa lời gọi, ở đây là `get()` hoặc `call()`.",
      ],
      quiz: {
        question: "Callable<V> khác Supplier<T> ở điểm nào quan trọng?",
        options: ["Không khác gì", "call() được khai báo throws Exception, nên lambda bên trong ném được checked exception", "Supplier chạy được trên thread khác", "Callable không có giá trị trả về"],
        answer: 1,
        explain: "Supplier.get() không khai báo throws; Callable.call() thì có. Vì vậy executor.submit(() -> ...) với Callable cho phép ném checked exception.",
      },
    },
    {
      id: "lambda",
      title: "Phần 2: Lambda, effectively final và method reference",
      scene: "lam",
      intro: [
        "Phần 1 cho biết lambda thuộc interface nào. Lambda còn một luật riêng với biến bên ngoài nó.",
        "Biến local dùng trong lambda phải effectively final: không bị gán lại. Đã biên dịch thử: thêm `discount = 20;` sau lambda báo lỗi *local variables referenced from a lambda expression must be final or effectively final*.",
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
        "Câu hay hỏi: lambda có phải anonymous class không? Không. Điểm khác dễ thấy nhất là `this`: trong anonymous class, `this` là chính object anonymous đó; trong lambda, `this` là object của class bao ngoài.",
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
        "Stream là dây chuyền: source, các intermediate operation (lazy) và một terminal operation. Không có terminal thì không chạy gì. Khi chạy, từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, nên `findFirst`, `anyMatch`, `limit` dừng được sớm.",
        "Đổi thao tác kết thúc để xem dây chuyền chạy tới đâu. Mọi log trong mô phỏng là output thật trên JDK 21.",
      ],
      predict: {
        question: "Dây chuyền `filter(chẵn).map(×10)` trên 1 đến 6, kết thúc bằng `.count()`. Có bao nhiêu số đi qua `filter`?",
        options: ["Chỉ tới số 2, rồi dừng sớm", "Cả 6 số", "Không số nào, vì `count()` biết sẵn kích thước", "3 số chẵn"],
        answer: 1,
        explain: "`count()` cần đếm hết, và vì có `filter` nên stream không biết trước kích thước. Mọi phần tử đều phải đi qua dây chuyền.",
      },
      widget: "lazy-pipeline",
      widgetTitle: "Stream.of(1..6).filter(chẵn).map(×10) + terminal",
      after: [
        "Stream cũng **không sửa collection gốc**: `list.stream().map(x -> x * 10).toList()` trả về một list mới, còn `list` vẫn giữ nguyên giá trị cũ.",
        "Chú ý `count()`: ở đây vẫn chạy hết dây chuyền vì `filter` làm stream không biết trước kích thước. Ngược lại, `List.of(1, 2, 3).stream().peek(...).count()` trả 3 mà không in gì: từ Java 9, `count()` biết kích thước nguồn nên bỏ qua cả pipeline. Vì vậy đừng đặt logic quan trọng trong `peek`.",
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
    },
    {
      id: "stateful",
      title: "Phần 4: Thao tác stateful và stream chỉ dùng một lần",
      scene: "state",
      intro: [
        "`sorted()` và `distinct()` là stateful: phải giữ dữ liệu lại, nhận đủ mới cho ra, nên tốn bộ nhớ và không dừng sớm được trước khi thấy hết dữ liệu. `filter`, `map` là stateless. Bật tắt `sorted()` để thấy thứ tự log đổi.",
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
        "Với số, dùng `IntStream`/`LongStream`/`DoubleStream` để tránh boxing (tự bọc mỗi `int` thành một object `Integer`, xem bài equals và hashCode): `IntStream.rangeClosed(1, 5).sum()` là 15; `mapToInt(String::length).summaryStatistics()` in `IntSummaryStatistics{count=2, sum=3, min=1, average=1.500000, max=2}`. Quay lại Stream<Integer> bằng `.boxed()`.",
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
        "- **Logic nhiều nhánh**.",
        "- **break/continue phức tạp**.",
        "- **Checked exception ở mỗi bước**.",
        "- **Phải sửa nhiều biến bên ngoài**.",
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
    "Functional interface là interface có đúng một abstract method, nhờ đó viết được lambda: Function biến đổi, Predicate kiểm tra, Supplier cung cấp, Consumer tiêu thụ. Biến local dùng trong lambda phải effectively final vì lambda copy giá trị và có thể chạy sau hoặc ở thread khác. Stream là dây chuyền gồm source, các intermediate operation lazy và một terminal operation; không có terminal thì không chạy gì. Khi chạy, từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, nên findFirst, anyMatch, limit dừng được sớm, ví dụ filter số chẵn rồi findFirst trên 1 đến 6 chỉ xử lý tới số 2. Ngoại lệ là sorted, distinct phải gom đủ dữ liệu. Stream không sửa collection gốc và chỉ dùng được một lần. map biến một thành một, flatMap biến một thành nhiều rồi làm phẳng; với số em dùng IntStream để tránh boxing. Logic nhiều nhánh hay có checked exception thì em dùng vòng for cho dễ đọc.",
};
