import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Structural.java: adapter, decorator, caching and JDK dynamic proxy, facade, composite tree, bridge, flyweight pool).
export const patternsStructural: Lesson = {
  slug: "patterns-structural",
  crumb: "Structural Patterns",
  videoDir: "/videos/patterns-structural",
  videoVersion: "0",
  scenes: [],
  title: "Design Patterns 2: Structural, ghép object",
  subtitle:
    "Adapter, Decorator, Proxy, Facade, Composite, Bridge, Flyweight. Cách ghép class và object lại với nhau, kèm ví dụ trong JDK và Spring.",
  openingQuiz: {
    question: "Hai pattern đều \"bọc\" một object khác. Điểm khác nhau quan trọng giữa Adapter và Decorator là gì?",
    options: [
      "Adapter đổi giao diện, Decorator giữ nguyên giao diện và thêm hành vi",
      "Adapter chạy nhanh hơn",
      "Decorator chỉ dùng cho I/O",
      "Không có khác biệt",
    ],
    answer: 0,
    explain: "Adapter làm giao diện cũ khớp giao diện mới. Decorator giữ cùng giao diện nên có thể bọc nhiều lớp chồng nhau.",
  },
  roadmap: [
    "Chặng 1: Adapter, Decorator, Proxy. Ba kiểu bọc object, và vì sao Spring nhờ proxy mà có @Transactional.",
    "Chặng 2: Facade, Composite. Gom hệ thống phức tạp, và xử lý cây.",
    "Chặng 3: Bridge, Flyweight và bảng nhớ chọn pattern.",
  ],
  sections: [
    {
      id: "adapter",
      title: "Adapter: chuyển giao diện này thành giao diện kia",
      intro: [
        "**Adapter** bọc một class có giao diện **không khớp** để code của bạn dùng được qua giao diện nó mong đợi, như đầu chuyển phích cắm.",
        "Thường dùng với thư viện cũ hoặc SDK bên thứ ba mà bạn không sửa được.",
      ],
      widgetTitle: "Dùng thư viện in cũ",
      compare: [
        way(
          "Gọi thẳng thư viện cũ",
          `// code của bạn quen dùng Printer.print(doc)
// thư viện cũ lại là LegacyPrinter.printText(text, copies)
legacy.printText(doc, 1);   // rải khắp nơi, dính chặt vào API cũ`,
          [
            ask("Thư viện cũ đổi chữ ký", bad("Sửa mọi chỗ gọi.")),
            ask("Thay bằng thư viện mới", bad("Sửa mọi chỗ gọi, không có một điểm chung để đổi.")),
          ],
          "API của thư viện ngoài lan khắp code của bạn.",
        ),
        way(
          "Adapter",
          `class PrinterAdapter implements Printer {
  private final LegacyPrinter legacy;
  public String print(String doc) { return legacy.printText(doc, 1); }
}`,
          [
            ask("Thư viện cũ đổi chữ ký", ok("Chỉ sửa trong `PrinterAdapter`. Đã chạy: `legacy x1: report`.")),
            ask("Thay bằng thư viện mới", ok("Viết một adapter mới cho cùng interface `Printer`.")),
          ],
          "Code của bạn chỉ biết `Printer`. Chi tiết thư viện ngoài nằm gọn trong adapter.",
        ),
      ],
      after: [
        "Trong JDK: `Arrays.asList()` (mảng thành `List`), `InputStreamReader` (byte thành ký tự). Trong Spring MVC: `HandlerAdapter`.",
      ],
      trap: {
        title: "Nhầm Adapter với Decorator",
        text: "Adapter **đổi giao diện**. Decorator **giữ nguyên giao diện** và thêm hành vi. Hỏi \"giao diện có đổi không?\" là phân biệt được.",
      },
      quiz: {
        question: "Bạn phải dùng một SDK thanh toán có API khác hẳn interface `PaymentGateway` của hệ thống, và không sửa được SDK. Dùng gì?",
        options: ["Decorator", "Adapter", "Singleton", "Prototype"],
        answer: 1,
        explain: "Adapter bọc SDK và hiện ra đúng interface `PaymentGateway`.",
      },
    },
    {
      id: "decorator",
      title: "Decorator: thêm hành vi bằng cách bọc, không kế thừa",
      intro: [
        "**Decorator** bọc một object **cùng giao diện** để thêm hành vi, và bọc được nhiều lớp. Tránh bùng nổ class con (`MilkSugarCoffee`, `MilkCoffee`...).",
        "Java I/O là ví dụ kinh điển: `new BufferedReader(new InputStreamReader(...))`.",
      ],
      widgetTitle: "Cà phê và phụ liệu",
      compare: [
        way(
          "Kế thừa cho mọi tổ hợp",
          `class Espresso {}
class EspressoMilk extends Espresso {}
class EspressoSugar extends Espresso {}
class EspressoMilkSugar extends Espresso {}   // n phụ liệu = 2^n class`,
          [
            ask("Thêm phụ liệu Caramel", bad("Số class tổ hợp **tăng gấp đôi**.")),
            ask("Khách chọn tổ hợp lúc chạy", bad("Kế thừa chốt cứng từ lúc compile, không chọn lúc chạy được.")),
          ],
          "Kế thừa nhân số class lên theo từng chiều biến đổi.",
        ),
        way(
          "Decorator",
          `Coffee c = new Sugar(new Milk(new Espresso()));
c.desc() + " = " + c.cost();`,
          [
            ask("Thêm phụ liệu Caramel", ok("Viết **một** class `Caramel`. Đã chạy: `Espresso + Milk + Sugar = 4.5`.")),
            ask("Khách chọn tổ hợp lúc chạy", ok("Bọc từng lớp theo lựa chọn của khách.")),
          ],
          "Mỗi phụ liệu là một lớp bọc, ghép tuỳ ý lúc chạy.",
        ),
      ],
      after: [
        "Trong JDK: `BufferedReader` bọc `Reader` (đã chạy: đọc đủ 3 dòng qua `BufferedReader(StringReader)`), `Collections.unmodifiableList()`. Trong servlet: `HttpServletRequestWrapper`.",
      ],
      trap: {
        title: "Thứ tự bọc quan trọng",
        text: "Nén rồi mới mã hoá thì hợp lý, đảo lại thì nén gần như vô ích vì dữ liệu đã mã hoá trông như ngẫu nhiên. Khi xếp nhiều decorator, hãy nghĩ tới thứ tự.",
      },
      quiz: {
        question: "Decorator hơn kế thừa ở điểm nào khi cần nhiều tổ hợp hành vi?",
        options: [
          "Ghép được lúc chạy và không bùng nổ số class",
          "Chạy nhanh hơn",
          "Không cần interface",
          "Chỉ dùng được với I/O",
        ],
        answer: 0,
        explain: "Mỗi hành vi là một lớp bọc riêng, ghép tuỳ ý. Kế thừa phải có một class cho mỗi tổ hợp.",
      },
    },
    {
      id: "proxy",
      title: "Proxy: người đại diện kiểm soát truy cập",
      intro: [
        "**Proxy** đứng thay object thật, **cùng giao diện**, để chen vào trước hoặc sau lời gọi: cache, kiểm tra quyền, log, tải lười.",
        "Spring dùng proxy cho `@Transactional`, `@Cacheable`, `@Async`. Bạn thấy một bean, thực ra là proxy bọc bean.",
      ],
      widgetTitle: "Thêm cache mà không sửa service",
      compare: [
        way(
          "Nhét cache vào service",
          `class Service {
  Map<Integer,String> cache = new HashMap<>();
  String load(int id) { /* kiểm tra cache, rồi truy vấn thật */ }   // nghiệp vụ lẫn cache
}`,
          [
            ask("Thêm log thời gian", bad("Sửa tiếp vào chính `load()`, class phình ra.")),
            ask("Tắt cache khi test", bad("Cache nằm trong code nghiệp vụ nên khó tắt.")),
          ],
          "Mối quan tâm phụ (cache, log) lẫn vào nghiệp vụ.",
        ),
        way(
          "Proxy",
          `class CachingProxy implements Service {
  public String load(int id) { return cache.computeIfAbsent(id, k -> real.load(k)); }
}
// proxy động: một handler cho mọi method
Proxy.newProxyInstance(loader, new Class<?>[]{Service.class},
    (p, m, args) -> { /* before */ Object r = m.invoke(real, args); /* after */ return r; });`,
          [
            ask("Thêm log thời gian", ok("Viết proxy khác bọc ngoài, `RealService` không đổi. Đã chạy: proxy động in `before load`, `after load`, và `isProxyClass: true`.")),
            ask("Tắt cache khi test", ok("Truyền `RealService` thẳng, không qua proxy. Đã chạy: 3 lần `load` nhưng chỉ 2 lần gọi thật.")),
          ],
          "Proxy chen vào mà service thật không biết. Một handler có thể bọc mọi method.",
        ),
      ],
      after: [
        "Hai loại: **proxy tĩnh** (viết tay) và **proxy động**: JDK proxy qua interface, hoặc CGLIB qua class con. Xem bài Transaction Proxy Mechanism.",
      ],
      trap: {
        title: "Gọi method trong cùng class bỏ qua proxy",
        text: "`this.save()` trong cùng một bean **không đi qua proxy**, nên `@Transactional` hay `@Cacheable` ở method đó không có tác dụng (self-invocation).",
      },
      quiz: {
        question: "Vì sao `@Transactional` trên một method được gọi bằng `this.save()` trong cùng class không có tác dụng?",
        options: [
          "Vì lời gọi nội bộ không đi qua proxy",
          "Vì Spring không hỗ trợ transaction",
          "Vì method phải là `static`",
          "Vì cần thêm `@Async`",
        ],
        answer: 0,
        explain: "Transaction được thêm bởi proxy bọc bean. Gọi `this.` thì đi thẳng vào object thật.",
      },
    },
    {
      id: "facade",
      title: "Facade: một cửa vào cho hệ thống phức tạp",
      intro: [
        "**Facade** đưa ra một giao diện **đơn giản** che nhiều class con phức tạp. Người dùng gọi một method thay vì phải biết thứ tự gọi ba hệ thống.",
        "Không thêm chức năng mới, chỉ gom lại và giấu chi tiết.",
      ],
      widgetTitle: "Xem phim trong rạp tại nhà",
      compare: [
        way(
          "Gọi từng hệ thống",
          `lights.dim();
projector.on();
sound.surround();     // chỗ nào cũng phải nhớ đúng thứ tự`,
          [
            ask("Thêm bước bật máy lạnh", bad("Sửa **mọi nơi** có đoạn gọi này.")),
            ask("Người mới vào dự án", bad("Phải học cả ba class và thứ tự gọi.")),
          ],
          "Chi tiết nội bộ bị lộ ra mọi nơi dùng.",
        ),
        way(
          "Facade",
          `class HomeTheater {
  List<String> watchMovie() { return List.of(lights.dim(), projector.on(), sound.surround()); }
}
theater.watchMovie();`,
          [
            ask("Thêm bước bật máy lạnh", ok("Sửa một chỗ trong `HomeTheater`. Đã chạy: `lights dimmed`, `projector on`, `surround sound on`.")),
            ask("Người mới vào dự án", ok("Chỉ cần biết `watchMovie()`.")),
          ],
          "Một điểm vào, chi tiết giấu bên trong.",
        ),
      ],
      after: [
        "Trong Spring, tầng `Service` thường là facade cho nhiều repository và client. `JdbcTemplate` cũng giấu nhiều bước JDBC.",
      ],
      trap: {
        title: "Facade phình thành God class",
        text: "Facade chỉ **điều phối**, không chứa nghiệp vụ. Nếu nó cứ to dần thì tách theo nhóm chức năng.",
      },
      quiz: {
        question: "Facade làm gì?",
        options: [
          "Thêm chức năng mới cho các class con",
          "Đưa ra giao diện đơn giản che sự phức tạp của nhiều class con",
          "Tạo bản sao object",
          "Bảo đảm chỉ có một instance",
        ],
        answer: 1,
        explain: "Facade không thêm chức năng, chỉ gom và giấu chi tiết.",
      },
    },
    {
      id: "composite",
      title: "Composite: đối xử đồng nhất với một và nhiều",
      intro: [
        "**Composite** xếp object thành **cây**, để code dùng một phần tử lẻ và một nhóm theo **cùng một giao diện**. Ví dụ file và thư mục.",
      ],
      widgetTitle: "Tính dung lượng cây thư mục",
      compare: [
        way(
          "instanceof khắp nơi",
          `int size(Object n) {
  if (n instanceof File f) return f.size;
  int sum = 0;
  for (Object k : ((Folder) n).kids) sum += size(k);   // kiểm tra kiểu ở mọi hàm
  return sum;
}`,
          [
            ask("Thêm loại Shortcut", bad("Sửa mọi hàm có `instanceof` (size, show, delete...).")),
            ask("Thêm thao tác mới", bad("Viết lại cả vòng kiểm tra kiểu.")),
          ],
          "Code phải phân biệt lá và nhóm ở mọi nơi.",
        ),
        way(
          "Composite",
          `interface Node { int size(); }
record FileNode(String name, int size) implements Node {}
class Folder implements Node {
  public int size() { return kids.stream().mapToInt(Node::size).sum(); }
}`,
          [
            ask("Thêm loại Shortcut", ok("Viết một class implement `Node`, code cũ không đổi.")),
            ask("Tính tổng dung lượng", ok("Gọi `root.size()` một lần. Đã chạy: `src/ (35)` gồm `main/ (30)` và `pom.xml (5)`.")),
          ],
          "Lá và nhóm cùng một giao diện, đệ quy diễn ra tự nhiên.",
        ),
      ],
      after: [
        "Gặp: cây menu, cây component giao diện, sơ đồ tổ chức, cây biểu thức.",
      ],
      trap: {
        title: "Thao tác chỉ hợp với nhóm",
        text: "`add(child)` có nghĩa với thư mục nhưng vô nghĩa với file. Đặt các method quản lý con ở class nhóm, đừng ép vào giao diện chung.",
      },
      quiz: {
        question: "Dấu hiệu nên dùng Composite là gì?",
        options: [
          "Cần đúng một instance",
          "Dữ liệu dạng cây và muốn xử lý phần tử lẻ và nhóm giống nhau",
          "Cần đổi thuật toán lúc chạy",
          "Cần hoàn tác thao tác",
        ],
        answer: 1,
        explain: "Cây thư mục, menu, biểu thức: cùng một giao diện cho lá và nhóm.",
      },
    },
    {
      id: "bridge",
      title: "Bridge: tách hai chiều thay đổi",
      intro: [
        "**Bridge** tách một class có **hai chiều thay đổi** (hình dạng và cách vẽ) thành hai hệ phân cấp, nối bằng **composition**. Thay vì 2 hình × 2 cách vẽ = 4 class, bạn có 2 + 2.",
      ],
      widgetTitle: "Hình và cách vẽ",
      compare: [
        way(
          "Một class cho mỗi tổ hợp",
          `class VectorCircle {}  class VectorSquare {}
class RasterCircle {}  class RasterSquare {}      // hai chiều nhân nhau`,
          [
            ask("Thêm hình Triangle", bad("Thêm **2** class (mỗi cách vẽ một cái).")),
            ask("Thêm cách vẽ SVG", bad("Thêm **số hình** class.")),
          ],
          "Số class bằng tích của hai chiều.",
        ),
        way(
          "Bridge",
          `abstract class Shape { protected final Renderer r; Shape(Renderer r) { this.r = r; } }
class Circle extends Shape { String draw() { return r.drawCircle(5); } }
new Circle(new Vector()).draw();`,
          [
            ask("Thêm hình Triangle", ok("Thêm **1** class `Triangle`.")),
            ask("Thêm cách vẽ SVG", ok("Thêm **1** class `Svg implements Renderer`. Đã chạy cả 4 tổ hợp, ví dụ `vector circle r=5` và `pixels square 4`.")),
          ],
          "Số class bằng tổng của hai chiều.",
        ),
      ],
      after: [
        "JDBC là ví dụ kinh điển: `Connection` và `Statement` (phần trừu tượng) tách khỏi driver của từng database (phần cài đặt). Bridge **thiết kế từ đầu** để tách, còn Adapter **vá lại** cái đã có.",
      ],
      trap: {
        title: "Nhầm Bridge với Strategy",
        text: "Cấu trúc giống nhau (giữ một interface trong field). Khác ở ý định: Strategy đổi **thuật toán**, Bridge tách hai **hệ phân cấp** độc lập.",
      },
      quiz: {
        question: "Có 3 hình và 4 cách vẽ. Bridge cần bao nhiêu class (không tính interface)?",
        options: ["12", "7", "3", "4"],
        answer: 1,
        explain: "3 + 4 = 7, thay vì 3 × 4 = 12.",
      },
    },
    {
      id: "flyweight",
      title: "Flyweight: dùng chung để tiết kiệm bộ nhớ",
      intro: [
        "**Flyweight** chia sẻ phần **không đổi** giữa rất nhiều object, và truyền phần **thay đổi** (như vị trí) từ bên ngoài. Ví dụ: trình soạn thảo không tạo một object cho mỗi ký tự ở từng vị trí.",
      ],
      widgetTitle: "Glyph của một văn bản",
      compare: [
        way(
          "Mỗi ký tự một object",
          `for (char c : text) glyphs.add(new Glyph(c, "Arial"));   // ký tự lặp lại vẫn tạo mới`,
          [
            ask("Văn bản \"hello world hello\"", bad("17 ký tự, 17 object `Glyph`, kể cả ký tự lặp lại.")),
            ask("Văn bản 1 triệu ký tự", bad("Số object tăng theo độ dài văn bản, không theo số ký tự khác nhau.")),
          ],
          "Bộ nhớ tỷ lệ với độ dài, dù số ký tự khác nhau rất ít.",
        ),
        way(
          "Flyweight",
          `Glyph get(char c) { return pool.computeIfAbsent(c, k -> new Glyph(k, "Arial")); }
record Glyph(char c, String font) {}   // bất biến nên dùng chung an toàn`,
          [
            ask("Văn bản \"hello world hello\"", ok("Đã chạy: 17 ký tự nhưng chỉ tạo **8** object `Glyph`.")),
            ask("Dùng chung có an toàn không?", ok("An toàn vì `Glyph` bất biến (record). Không bao giờ dùng chung một object có thể sửa.")),
          ],
          "Số object bằng số ký tự khác nhau, không phụ thuộc độ dài văn bản.",
        ),
      ],
      after: [
        "Trong JDK: `Integer.valueOf(127) == Integer.valueOf(127)` là `true` còn 128 là `false` (cache từ -128 đến 127, xem bài equals). String pool cũng là một flyweight.",
      ],
      trap: {
        title: "Dùng chung object có thể sửa",
        text: "Phần dùng chung phải **bất biến**. Nếu không, sửa ở một nơi sẽ làm đổi mọi nơi đang dùng chung.",
      },
      quiz: {
        question: "Flyweight tiết kiệm bộ nhớ bằng cách nào?",
        options: [
          "Nén dữ liệu",
          "Dùng chung phần không đổi giữa nhiều object",
          "Xoá object cũ",
          "Lưu object xuống đĩa",
        ],
        answer: 1,
        explain: "Phần bất biến được chia sẻ, phần thay đổi truyền vào từ ngoài.",
      },
    },
    {
      id: "cheatsheet",
      title: "Bảng nhớ và chọn pattern",
      intro: ["Bấm từng dòng để xem câu nên nói ra miệng."],
      widgetTitle: "Bảng nhớ Structural",
      cheat: [
        { name: "Adapter", one: "Đổi giao diện cho khớp.", say: "Em bọc thư viện cũ trong một adapter để code của em chỉ phụ thuộc interface của mình. Thư viện đổi hay bị thay thì chỉ sửa trong adapter." },
        { name: "Decorator", one: "Thêm hành vi bằng cách bọc, cùng giao diện.", say: "Em bọc nhiều lớp để ghép hành vi lúc chạy, thay vì kế thừa mọi tổ hợp. Java I/O là ví dụ, và em để ý thứ tự bọc." },
        { name: "Proxy", one: "Đại diện kiểm soát truy cập.", say: "Spring dùng proxy cho @Transactional và @Cacheable. Gọi method trong cùng class bỏ qua proxy nên các annotation đó không có tác dụng (self-invocation)." },
        { name: "Facade", one: "Một cửa vào đơn giản.", say: "Em gom các bước gọi nhiều hệ thống vào một method để nơi dùng không phải biết thứ tự. Facade chỉ điều phối, không chứa nghiệp vụ." },
        { name: "Composite", one: "Cây, lá và nhóm cùng giao diện.", say: "Với dữ liệu dạng cây như thư mục hay menu, em cho lá và nhóm cùng một interface để xử lý đệ quy mà không cần instanceof." },
        { name: "Bridge", one: "Tách hai chiều thay đổi.", say: "Khi một class biến đổi theo hai chiều độc lập, em tách thành hai hệ phân cấp nối bằng composition, số class là tổng chứ không phải tích." },
        { name: "Flyweight", one: "Dùng chung phần bất biến.", say: "Khi có rất nhiều object giống nhau, em dùng chung phần không đổi và truyền phần thay đổi từ ngoài. Integer cache và String pool là ví dụ trong JDK." },
      ],
      quiz: {
        question: "Hai pattern nào dễ bị nhầm vì đều giữ một interface trong field và ủy quyền?",
        options: ["Bridge và Strategy", "Singleton và Facade", "Flyweight và Builder", "Composite và Adapter"],
        answer: 0,
        explain: "Cấu trúc giống nhau nhưng ý định khác: Strategy đổi thuật toán, Bridge tách hai hệ phân cấp độc lập.",
      },
    },
    {
      id: "chon-pattern",
      title: "Bài tập: tình huống này dùng pattern nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn pattern phù hợp rồi xem lý do."],
      widgetTitle: "Chọn pattern Structural",
      drill: {
        choices: ["Adapter", "Decorator", "Proxy", "Facade", "Composite", "Bridge", "Flyweight"],
        summary: "Nhận ra dấu hiệu: đổi giao diện, thêm hành vi, chen vào lời gọi, gom lại, cây, hai chiều, hay dùng chung.",
        items: [
          { q: "Thư viện thanh toán cũ có API khác hẳn interface của bạn và bạn không sửa được.", a: "Adapter", why: "Bọc lại để hiện ra đúng interface của bạn." },
          { q: "Cần thêm nén, mã hoá và log cho một stream, bật tắt tổ hợp tuỳ lúc chạy.", a: "Decorator", why: "Bọc nhiều lớp cùng giao diện." },
          { q: "Chặn mọi lời gọi `load()` để kiểm tra quyền và cache mà không sửa service thật.", a: "Proxy", why: "Cùng giao diện, chen vào trước và sau." },
          { q: "Gom ba bước gọi ba hệ thống thành một method dễ dùng.", a: "Facade", why: "Một cửa vào đơn giản." },
          { q: "Cây menu: mục lẻ và nhóm mục đều phải gọi được `render()` giống nhau.", a: "Composite", why: "Lá và nhóm chung một interface." },
          { q: "Hình (tròn, vuông) và cách vẽ (vector, pixel) thay đổi độc lập với nhau.", a: "Bridge", why: "Tách hai chiều, ghép bằng composition." },
          { q: "Soạn thảo có hàng triệu ký tự, cần tiết kiệm bộ nhớ bằng cách dùng chung object.", a: "Flyweight", why: "Dùng chung phần bất biến của ký tự." },
        ],
      },
    },
  ],
  cards: [
    { q: "Adapter khác Decorator thế nào?", a: "Adapter đổi giao diện để khớp. Decorator giữ nguyên giao diện và thêm hành vi, bọc được nhiều lớp." },
    { q: "Proxy được Spring dùng ở đâu, và bẫy là gì?", a: "@Transactional, @Cacheable, @Async. Bẫy: gọi method trong cùng class (this.) bỏ qua proxy nên annotation không chạy (self-invocation)." },
    { q: "Decorator hơn kế thừa ở điểm nào?", a: "Ghép hành vi lúc chạy, không bùng nổ số class (n phụ liệu cần 2^n class nếu dùng kế thừa). Chú ý thứ tự bọc." },
    { q: "Facade có nên chứa nghiệp vụ không?", a: "Không. Facade chỉ điều phối các bước gọi. Chứa nghiệp vụ sẽ thành God class." },
    { q: "Composite dùng khi nào?", a: "Dữ liệu dạng cây (thư mục, menu, biểu thức) và muốn xử lý lá và nhóm giống nhau, không cần instanceof." },
    { q: "Bridge giảm số class thế nào?", a: "Tách hai chiều thay đổi nên số class là tổng (3 + 4) chứ không phải tích (3 × 4)." },
    { q: "Flyweight yêu cầu gì ở phần dùng chung?", a: "Phải bất biến. Phần thay đổi được (vị trí) truyền từ ngoài vào. Integer cache và String pool là ví dụ." },
  ],
  modelAnswer:
    "Nhóm Structural lo việc ghép class và object. Adapter đổi giao diện để khớp, ví dụ bọc SDK cũ. Decorator giữ cùng giao diện và thêm hành vi bằng cách bọc, như Java I/O. Proxy đứng thay object thật để chen cache, kiểm tra quyền, giao dịch: Spring dùng nó cho @Transactional, nên gọi this.method() trong cùng class sẽ bỏ qua proxy. Facade gom nhiều bước vào một method đơn giản. Composite cho lá và nhóm cùng giao diện để xử lý cây. Bridge tách hai chiều thay đổi nên số class là tổng thay vì tích. Flyweight dùng chung phần bất biến để tiết kiệm bộ nhớ, như Integer cache.",
};
