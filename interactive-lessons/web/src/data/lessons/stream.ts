import timeline from "../timelines/stream.json";
import type { Lesson, Scene } from "../types";

// Every Java output quoted below was run on JDK 21.
export const stream: Lesson = {
  slug: "stream",
  crumb: "Lambda & Stream",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/lambda-stream",
  videoVersion: "cc42f042",
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
        "Functional interface là interface có đúng một abstract method (default method không tính). Nhờ vậy viết được lambda thay cho anonymous class: truyền hành vi như truyền dữ liệu. `@FunctionalInterface` không bắt buộc nhưng giúp compiler báo lỗi nếu lỡ thêm abstract method thứ hai.",
        "Mẹo nhớ: Function biến đổi, Predicate kiểm tra, Supplier cung cấp, Consumer tiêu thụ. Chọn interface đúng cho từng lambda.",
      ],
      widget: "functional-interface",
      widgetTitle: "Lambda này thuộc interface nào?",
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
        "Biến local dùng trong lambda phải effectively final: không bị gán lại. Đã biên dịch thử: thêm `discount = 20;` sau lambda báo lỗi *local variables referenced from a lambda expression must be final or effectively final*.",
        "Lý do: lambda copy giá trị lúc được tạo và có thể chạy sau, hoặc ở thread khác; nếu cho gán lại thì không biết lambda thấy giá trị nào. Mẹo `int[] counter = {0}` vẫn chạy (ra 6) nhưng là lách luật, dễ sai khi song song; muốn tính tổng thì dùng `sum()` hoặc `reduce()`.",
      ],
      widget: "method-ref",
      widgetTitle: "Bốn loại method reference",
      after: [
        "Lambda không phải anonymous class: nó compile thành `invokedynamic`, không sinh file `Outer$1.class`, và `this` trong lambda là object bao ngoài.",
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
        "Stream là dây chuyền: source, các intermediate operation (lazy) và một terminal operation. Không có terminal thì không chạy gì. Khi chạy, từng phần tử đi hết dây chuyền rồi mới tới phần tử sau, nên `findFirst`, `anyMatch`, `limit` dừng được sớm.",
        "Đổi thao tác kết thúc để xem dây chuyền chạy tới đâu. Mọi log trong mô phỏng là output thật trên JDK 21.",
      ],
      widget: "lazy-pipeline",
      widgetTitle: "Stream.of(1..6).filter(chẵn).map(×10) + terminal",
      after: [
        "Chú ý `count()`: ở đây vẫn chạy hết dây chuyền vì `filter` làm stream không biết trước kích thước. Ngược lại, `List.of(1, 2, 3).stream().peek(...).count()` trả 3 mà không in gì: từ Java 9, `count()` biết kích thước nguồn nên bỏ qua cả pipeline. Vì vậy đừng đặt logic quan trọng trong `peek`.",
      ],
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
        "Với số, dùng `IntStream`/`LongStream`/`DoubleStream` để tránh boxing: `IntStream.rangeClosed(1, 5).sum()` là 15; `mapToInt(String::length).summaryStatistics()` in `IntSummaryStatistics{count=2, sum=3, min=1, average=1.500000, max=2}`. Quay lại Stream<Integer> bằng `.boxed()`.",
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
        "Dùng stream cho lọc, biến đổi, gom nhóm và pipeline rõ ràng, có short-circuit. Dùng vòng for khi logic nhiều nhánh, break/continue phức tạp, có checked exception ở mỗi bước, hoặc phải sửa nhiều biến bên ngoài.",
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
