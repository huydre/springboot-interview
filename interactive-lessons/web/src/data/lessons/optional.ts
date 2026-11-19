import timeline from "../timelines/optional.json";
import type { Lesson, Scene } from "../types";

// Every Java output quoted below was run on JDK 21 on an 8-CPU machine (commonPool parallelism 7).
export const optional: Lesson = {
  slug: "optional",
  crumb: "Optional & Parallel Stream",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/optional-parallel",
  videoVersion: "6a437f2f",
  scenes: timeline as Scene[],
  title: "Optional & Parallel Stream: hộp có thể rỗng, chạy song song đúng cách",
  subtitle:
    "Optional giải quyết vấn đề gì, chuỗi map và orElseThrow, bẫy orElse với orElseGet, các anti-pattern; parallel stream chạy trên pool nào, race condition, thứ tự, reduce, và khi nào không nên dùng.",
  openingQuiz: {
    question: 'Optional.of("x").orElse(load()), trong đó load() in ra một dòng log. Dòng log có được in không?',
    options: [
      "Không, vì Optional đã có giá trị",
      "Có, vì Java tính tham số load() trước khi gọi orElse",
      "Chỉ in khi chạy ở chế độ debug",
      "Lỗi biên dịch",
    ],
    answer: 1,
    explain:
      "orElse là method bình thường nên tham số được tính trước. Đã chạy thật: in \"load() called for orElse\" rồi trả về x. Dùng orElseGet(() -> load()) thì không in gì.",
  },
  roadmap: [
    "Chặng 1: Optional là cái hộp, of và ofNullable, chuỗi map và orElseThrow.",
    "Chặng 2: orElse vs orElseGet và các anti-pattern với Optional.",
    "Chặng 3: parallel stream chạy trên commonPool, race condition, thứ tự, reduce, và khi nào không dùng.",
  ],
  sections: [
    {
      id: "optional-box",
      title: "Phần 1: Optional giải quyết vấn đề gì",
      scene: "box",
      intro: [
        "Trước Java 8, method trả `null` khi không có kết quả, bên gọi dễ quên kiểm tra và `NullPointerException` nổ ra ở nơi rất xa chỗ gây lỗi. `Optional<T>` là cái hộp chứa một giá trị hoặc rỗng; khi method trả `Optional`, chữ ký đã nói rõ \"có thể không có kết quả\" và bên gọi buộc phải xử lý. Ví dụ quen thuộc: `userRepository.findById(id)` trong Spring Data.",
        "Tạo: `Optional.of(value)` khi chắc chắn khác null (`Optional.of(null)` ném `NullPointerException` ngay); `Optional.ofNullable(value)` khi có thể null (null thành `Optional.empty`); `Optional.empty()` để trả \"không có gì\".",
      ],
      quiz: {
        question: "Optional.of(null) và Optional.ofNullable(null) lần lượt cho kết quả gì?",
        options: ["Cả hai ra Optional.empty", "NullPointerException và Optional.empty", "Optional.empty và NullPointerException", "Cả hai ném NullPointerException"],
        answer: 1,
        explain: "of() dùng khi bạn khẳng định không null, nên null là lỗi được phát hiện sớm. ofNullable() biến null thành Optional.empty. Đã chạy đúng như vậy.",
      },
    },
    {
      id: "optional-chain",
      title: "Phần 2: Chuỗi map và orElseThrow",
      scene: "chain",
      intro: [
        "`findById(id).map(User::getAddress).map(Address::getCity).orElse(\"UNKNOWN\")` thay cho chuỗi `if (x != null)` lồng nhau: hộp rỗng ở bước nào thì các `map` sau bị bỏ qua, chỉ bước cuối quyết định giá trị mặc định.",
        "Ở tầng service, không tìm thấy thì ném exception có ý nghĩa: `findById(id).orElseThrow(() -> new ResourceNotFoundException(\"User\", id))`. `orElseThrow()` không tham số ném `NoSuchElementException: No value present`.",
      ],
      widget: "optional-chain",
      widgetTitle: "Đi qua chuỗi map với từng user",
      after: [
        "Các method khác hay dùng: `filter(p)` (`Optional.of(\"  hi \").map(String::trim).filter(s -> !s.isEmpty()).orElse(\"blank\")` ra `hi`), `flatMap` khi hàm trả về Optional (dùng `map` sẽ ra `Optional[Optional[...]]`), `ifPresentOrElse`, `or(() -> otherOptional)` từ Java 9, và `stream()` để lọc các Optional có giá trị: `[Optional(1), empty, Optional(3)]` thành `[1, 3]`.",
      ],
      quiz: {
        question: "findById(1).map(u -> findById(2)) có kiểu gì?",
        options: ["Optional<User>", "Optional<Optional<User>>", "User", "Lỗi biên dịch"],
        answer: 1,
        explain: "Hàm bên trong đã trả Optional, nên map bọc thêm một lớp: đã chạy ra Optional[Optional[User[name=Bình, address=null]]]. Dùng flatMap để làm phẳng.",
      },
    },
    {
      id: "orelse",
      title: "Phần 3: orElse vs orElseGet",
      scene: "orelse",
      intro: [
        "`orElse(x)` là method bình thường: Java tính tham số trước rồi mới gọi, nên `orElse(load())` luôn chạy `load()`, kể cả khi Optional đã có giá trị. `orElseGet(() -> load())` nhận một Supplier và chỉ gọi khi hộp rỗng.",
        "Hậu quả thực tế: `orElse(callDatabase())` hay `orElse(createNewUser())` vẫn gọi DB hoặc tạo bản ghi mới dù đã tìm thấy. Dùng `orElse` cho hằng số rẻ (`\"UNKNOWN\"`, `0`, `List.of()`); dùng `orElseGet` cho giá trị tốn kém hoặc có side effect.",
      ],
      widget: "orelse-trap",
      widgetTitle: "Thử cả bốn tổ hợp",
      quiz: {
        question: "Giá trị mặc định là createGuestUser(), hàm này insert một bản ghi vào DB. Nên viết thế nào?",
        options: [
          "findById(id).orElse(createGuestUser())",
          "findById(id).orElseGet(() -> createGuestUser())",
          "findById(id).get()",
          "Hai cách đầu như nhau",
        ],
        answer: 1,
        explain: "Với orElse, createGuestUser() chạy cả khi đã tìm thấy user, tạo bản ghi thừa. orElseGet chỉ gọi khi rỗng.",
      },
    },
    {
      id: "anti-pattern",
      title: "Phần 4: Anti-pattern với Optional",
      scene: "anti",
      intro: [
        "`opt.get()` khi chưa chắc có giá trị ném `NoSuchElementException: No value present`, chẳng khác gì NPE; `if (opt.isPresent()) x = opt.get();` chỉ là null check đội lốt. Dùng `orElseThrow`, `orElse`, `map`, `ifPresent`.",
        "Không dùng Optional làm field trong entity/DTO (không `Serializable`, Jackson và JPA xử lý kém), làm tham số method, hay bọc collection (`Optional<List<T>>`: trả `List.of()` là đủ). Không bao giờ `return null` cho kiểu Optional. Quy tắc ngắn: Optional chỉ làm kiểu trả về.",
      ],
      quiz: {
        question: "Đoạn nào dùng Optional đúng?",
        options: [
          "private Optional<String> middleName; trong entity",
          "public Optional<User> findByEmail(String email)",
          "void send(Optional<String> cc)",
          "public Optional<List<Order>> findOrders()",
        ],
        answer: 1,
        explain: "Optional dùng làm kiểu trả về của method có thể không có kết quả. Field, tham số và bọc collection đều là anti-pattern.",
      },
    },
    {
      id: "parallel",
      title: "Phần 5: Parallel stream chạy thế nào",
      scene: "par",
      intro: [
        "`list.parallelStream()` hoặc `stream.parallel()` chia dữ liệu thành nhiều phần, xử lý song song trên nhiều thread rồi gộp kết quả. Các thread lấy từ `ForkJoinPool.commonPool()`, pool dùng chung cả JVM, kích thước mặc định là số CPU trừ 1: máy 8 CPU đo được 7, và thread gọi stream (`main`) cũng tham gia xử lý.",
        "`CompletableFuture.supplyAsync(...)` không truyền executor cũng chạy trên chính pool này (đã in tên thread: `ForkJoinPool.commonPool-worker-N`).",
      ],
      quiz: {
        question: "Vì sao một parallel stream gọi DB trong web app có thể làm chậm cả những chỗ khác?",
        options: [
          "Vì parallel stream mở thêm connection DB",
          "Vì nó chiếm các thread của commonPool dùng chung để chờ I/O, mọi parallel stream và CompletableFuture khác phải chờ theo",
          "Vì parallel stream khóa toàn bộ JVM",
          "Không ảnh hưởng gì",
        ],
        answer: 1,
        explain: "commonPool chỉ có khoảng số CPU trừ 1 thread và dùng chung cả JVM. Thread bị giữ để chờ I/O thì không còn thread cho việc khác.",
      },
    },
    {
      id: "parallel-traps",
      title: "Phần 6: Bẫy race condition, thứ tự và reduce",
      scene: "race",
      intro: [
        "Nhiều thread cùng `add` vào một `ArrayList` là race condition: chạy 30 lần thì sai cả 30, có lần size chỉ còn 2178 thay vì 10000. Luôn gom kết quả bằng `collect`/`toList`, không sửa state bên ngoài.",
        "Thứ tự không được đảm bảo (`forEach` in `54762310`, lần sau lại khác); `forEachOrdered` giữ thứ tự nhưng mất bớt lợi ích. `reduce` phải có hàm gộp có tính kết hợp và giá trị khởi tạo là phần tử đơn vị: `reduce(10, Integer::sum)` trên 1..4 ra 20 khi tuần tự, 50 khi song song.",
      ],
      widget: "parallel-race",
      widgetTitle: "Kết quả đo thật của từng cách",
      quiz: {
        question: "Stream.of(1, 2, 3, 4).parallel().reduce(0, Integer::sum) ra bao nhiêu?",
        options: ["10", "50", "Mỗi lần một khác", "0"],
        answer: 0,
        explain: "0 là phần tử đơn vị của phép cộng nên chia thế nào cũng ra 10. Với 10 thì mỗi phần đều được cộng thêm 10.",
      },
    },
    {
      id: "when-parallel",
      title: "Phần 7: Khi nào không dùng parallel stream",
      scene: "when",
      intro: [
        "Chỉ có lợi khi đủ cả: dữ liệu lớn (hàng trăm nghìn phần tử trở lên), tác vụ CPU-bound, nguồn dễ chia (`ArrayList`, mảng, `IntStream.range`; không phải `LinkedList` hay `Stream.iterate`), không có shared mutable state, và thứ tự không quan trọng.",
        "Đừng dùng cho I/O trong web app. Muốn gọi nhiều API song song thì dùng `CompletableFuture` với executor riêng có kích thước phù hợp cho I/O.",
      ],
      widget: "parallel-fit",
      widgetTitle: "Việc này có nên dùng parallel?",
      quiz: {
        question: "Có cho parallel stream chạy trên pool riêng được không?",
        options: [
          "Không thể",
          "Có mẹo submit stream vào một ForkJoinPool riêng, nhưng là hành vi ngầm không được document; thực tế nên dùng CompletableFuture/ExecutorService",
          "Có, dùng parallel(pool)",
          "Có, đặt -Djava.util.concurrent.ForkJoinPool.common.parallelism=100 là đủ",
        ],
        answer: 1,
        explain: "customPool.submit(() -> list.parallelStream()...).get() chạy được trên pool đó nhưng không có hợp đồng chính thức. Với I/O, CompletableFuture + executor riêng rõ ràng hơn.",
      },
    },
  ],
  modelAnswer:
    "Optional là hộp có thể chứa giá trị hoặc rỗng. Dùng làm kiểu trả về giúp chữ ký method nói rõ có thể không có kết quả và buộc bên gọi xử lý, tránh NPE. Em hay dùng findById(id).orElseThrow(...) ở service và chuỗi map để tránh if-null lồng nhau. Bẫy quan trọng là orElse luôn tính tham số kể cả khi đã có giá trị, nên giá trị mặc định tốn kém như gọi DB thì phải dùng orElseGet. Em không dùng Optional cho field, tham số hay bọc collection, và tránh get() khi chưa kiểm tra. Parallel stream chia dữ liệu và xử lý trên ForkJoinPool.commonPool(), pool dùng chung cả JVM với khoảng số CPU trừ 1 thread. Nó chỉ có lợi khi dữ liệu lớn, CPU-bound, nguồn dễ chia và không có shared state; em không dùng cho I/O trong web app vì sẽ chặn commonPool, I/O song song thì dùng CompletableFuture với executor riêng. Kết quả phải gom bằng collect, vì add vào ArrayList bên ngoài là race condition: em đã thử và lần nào cũng sai.",
};
