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
        "Adapter hay gặp:",
        "- **`Arrays.asList()`** (JDK): mảng thành `List`.",
        "- **`InputStreamReader`** (JDK): byte thành ký tự.",
        "- **`HandlerAdapter`** (Spring MVC).",
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
        "Adapter bọc để **đổi** giao diện. Decorator cũng bọc, nhưng **giữ nguyên** giao diện.",
        "**Decorator** bọc một object **cùng giao diện** để thêm hành vi, và bọc được nhiều lớp. Tránh bùng nổ class con (`MilkSugarCoffee`, `MilkCoffee`...).",
        "Java I/O là ví dụ kinh điển: `new BufferedReader(new InputStreamReader(...))`.",
      ],
      board: {
        title: "Decorator: bọc nhiều lớp, cùng giao diện",
        highlight: "bọc nhiều lớp",
        chips: ["Không bùng nổ số class", "Ghép lúc chạy"],
        cards: [
          {
            title: "Bọc thay vì kế thừa",
            diagram: {
              kind: "pipe",
              from: "Espresso (3.0)",
              via: "Milk + Sugar",
              to: "Tổng 4.5",
              skipped: ["EspressoMilk", "EspressoSugar", "EspressoMilkSugar"],
              skippedLabel: "Không cần class tổ hợp",
            },
            notes: ["`Sugar` gọi `Milk`, `Milk` gọi `Espresso`, mỗi lớp cộng phần của mình trên đường về: 3.0 + 1.0 + 0.5 = 4.5."],
            code: `Coffee c = new Sugar(new Milk(new Espresso()));
      c.cost();   // 4.5`,
            takeaway: "Mỗi phụ liệu là một lớp bọc, ghép tuỳ ý",
          },
          {
            title: "Thứ tự bọc",
            diagram: {
              kind: "flow",
              steps: ["Dữ liệu", "Xếp nhiều decorator"],
              ok: ["Nén rồi mã hoá", "Hợp lý"],
              bad: ["Mã hoá rồi nén", "Nén gần như vô ích"],
            },
            notes: ["Dữ liệu đã mã hoá trông như ngẫu nhiên nên nén không còn tác dụng."],
            takeaway: "Khi xếp nhiều decorator, nghĩ tới thứ tự",
          },
        ],
        conclusion: "**Kết luận:** Decorator giữ nguyên giao diện, thêm hành vi bằng lớp bọc, và thứ tự bọc quan trọng.",
      },
      predict: {
        question: "`Espresso` giá 3.0, `Milk` cộng 1.0, `Sugar` cộng 0.5. `new Sugar(new Milk(new Espresso())).cost()` trả bao nhiêu?",
        options: ["3.0", "3.5", "4.5", "Lỗi, vì Sugar không bọc được Milk"],
        answer: 2,
        explain: "Mỗi lớp cùng giao diện `Coffee`, nên bọc chồng được. `Sugar` gọi `Milk`, `Milk` gọi `Espresso`, rồi mỗi lớp cộng phần của mình trên đường về: 3.0 + 1.0 + 0.5 = 4.5.",
      },
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
          `class Milk implements Coffee {          // cùng giao diện với thứ nó bọc
  private final Coffee base;              // giữ một Coffee bên trong
  Milk(Coffee base) { this.base = base; }
  public double cost() { return base.cost() + 1.0; }      // gọi xuống, cộng thêm
  public String desc() { return base.desc() + " + Milk"; }
}
// Sugar viết y hệt, cộng 0.5
Coffee c = new Sugar(new Milk(new Espresso()));   // Espresso giá 3.0`,
          [
            ask("Thêm phụ liệu Caramel", ok("Viết **một** class `Caramel` giống hệt `Milk`, cộng 1.5. Không class cũ nào đổi. Đã chạy: `new Caramel(new Milk(new Espresso()))` ra `Espresso + Milk + Caramel = 5.5`.")),
            ask("Khách chọn tổ hợp lúc chạy", ok("Bọc từng lớp theo lựa chọn của khách. Đã chạy: `new Sugar(new Milk(new Espresso()))` ra `Espresso + Milk + Sugar = 4.5`: Sugar gọi Milk, Milk gọi Espresso, mỗi lớp cộng phần của mình trên đường về.")),
          ],
          "Mỗi phụ liệu là một lớp bọc, ghép tuỳ ý lúc chạy.",
        ),
      ],
      after: [
        "Decorator hay gặp:",
        "- **`BufferedReader`** (JDK): bọc `Reader` (đã chạy: đọc đủ 3 dòng qua `BufferedReader(StringReader)`).",
        "- **`Collections.unmodifiableList()`** (JDK).",
        "- **`HttpServletRequestWrapper`** (servlet).",
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
        "**Proxy** đứng thay object thật, **cùng giao diện**, để **kiểm soát việc truy cập** object đó:",
        "- **Cache**: trả từ cache thay vì gọi thật.",
        "- **Quyền**: kiểm tra quyền trước khi cho gọi.",
        "- **Tải lười**: chỉ tạo object nặng khi lần đầu cần.",
        "- **Remote proxy**: gọi sang máy khác.",
        "Nghe giống Decorator (cũng bọc, cũng cùng giao diện), nhưng khác ở **ý định**. Decorator **thêm tính năng** cho object, và chính client tự bọc từng lớp (`new Sugar(new Milk(...))`). Proxy **quản lý quyền truy cập** vào object, và thường do framework tạo ra: client cầm proxy mà không biết.",
        "Ví dụ quen thuộc nhất: Spring tạo proxy cho bean có `@Transactional`, `@Cacheable`, `@Async`. Bạn inject một bean, thực ra nhận về proxy bọc bean đó (học kỹ ở bài Transaction Proxy Mechanism).",
      ],
      predict: {
        question: "Client gọi `load(1)`, `load(1)`, `load(2)` qua `CachingProxy`. Service thật bị gọi mấy lần?",
        options: ["1", "2", "3", "0"],
        answer: 1,
        explain: "Lần thứ hai của id 1 lấy từ cache của proxy. Chỉ id 1 lần đầu và id 2 đi tới service thật.",
      },
      widgetTitle: "Thêm cache và kiểm tra quyền mà không sửa service",
      compare: [
        way(
          "Nhét cache vào service",
          `class Service {
  Map<Integer,String> cache = new HashMap<>();
  String load(int id) { /* kiểm tra cache, rồi truy vấn thật */ }   // nghiệp vụ lẫn cache
}`,
          [
            ask("Chặn user không phải admin", bad("Sửa tiếp vào chính `load()`, và vào mọi method khác cần kiểm tra quyền. Class phình ra.")),
            ask("Tắt cache khi test", bad("Cache nằm trong code nghiệp vụ nên khó tắt.")),
          ],
          "Việc kiểm soát truy cập (cache, quyền) lẫn vào nghiệp vụ.",
        ),
        way(
          "Proxy",
          `interface Service { String load(int id); String loadTwice(int id); }
class RealService implements Service {
  public String load(int id) { return "row-" + id; }              // truy vấn thật
  public String loadTwice(int id) { load(id); return load(id); }  // tự gọi this.load hai lần
}
class CachingProxy implements Service {
  public String load(int id) { return cache.computeIfAbsent(id, k -> real.load(k)); }
  public String loadTwice(int id) { return real.loadTwice(id); }   // chuyển thẳng cho object thật
}`,
          [
            ask("Gọi load(1), load(1), load(2) qua CachingProxy", ok("Đã chạy: 3 lần `load` nhưng chỉ **2** lần gọi thật. Lần thứ hai của id 1 lấy từ cache.")),
            ask("Chặn user không phải admin", ok("Viết thêm một proxy kiểm tra quyền, `RealService` không đổi. Cách viết một handler chung cho mọi method nằm ở phần \"Proxy động\" ngay bên dưới.")),
            ask("Tắt cache khi test", ok("Truyền `RealService` thẳng, không qua proxy. Đã chạy: 3 lần `load` là 3 lần gọi thật.")),
          ],
          "Proxy chen vào mà service thật không biết.",
        ),
      ],
      takeaway: {
        lines: [
          "**Decorator**: thêm tính năng, client tự bọc.",
          "**Proxy**: kiểm soát truy cập, thường do framework tạo, client không biết mình đang cầm proxy.",
        ],
      },
      trap: {
        title: "Gọi method trong cùng class bỏ qua proxy",
        text: "Proxy chỉ chen được vào lời gọi **đi qua proxy**. Bên trong object thật, `this` là chính object thật, nên `this.load()` đi thẳng, không qua proxy. Đã chạy với `Service` ở trên: `CachingProxy.loadTwice(5)` chuyển cho `RealService.loadTwice`, hàm này gọi `this.load(5)` hai lần. Dù id 5 đã có trong cache của proxy, vẫn tốn thêm **2** lần gọi thật. Spring gặp đúng chuyện này: `@Transactional` hay `@Cacheable` trên method được gọi bằng `this.` không có tác dụng (self-invocation, xem bài tx-pitfalls).",
      },
      quiz: {
        question: "`RealService.loadTwice()` gọi `this.load()`. Client gọi `loadTwice()` qua `CachingProxy`. Lời gọi `this.load()` có đi qua cache của proxy không?",
        options: [
          "Không: bên trong object thật, `this` là object thật, nên lời gọi đi thẳng",
          "Có, proxy bắt được mọi lời gọi",
          "Có, nếu method là `public`",
          "Tuỳ JVM",
        ],
        answer: 0,
        explain: "Proxy chỉ đứng ở cửa vào. Khi đã vào object thật, các lời gọi nội bộ không quay ra cửa nữa. Đó cũng là lý do `@Transactional` không có tác dụng khi gọi bằng `this.save()` trong cùng bean.",
      },
      parts: [
        {
          id: "proxy-dynamic",
          title: "Proxy động: một handler cho mọi method",
          intro: [
            "`CachingProxy` ở trên là **proxy tĩnh**: viết tay một class cho mỗi interface. Muốn kiểm tra quyền cho **mọi** method của `Service` mà không viết từng method, dùng **proxy động**: JDK sinh proxy lúc chạy và chuyển mọi lời gọi vào một handler duy nhất.",
          ],
          widgetTitle: "Kiểm tra quyền bằng proxy động",
          compare: [
            way(
              "Proxy tĩnh viết tay",
              `class SecureProxy implements Service {
  public String load(int id) { check(); return real.load(id); }
  public String loadTwice(int id) { check(); return real.loadTwice(id); }
  // thêm method vào Service: phải nhớ viết thêm ở đây
}`,
              [
                ask("Thêm method mới vào Service", bad("Phải viết thêm method tương ứng trong từng proxy.")),
              ],
              "Một class proxy cho mỗi interface, lặp code.",
            ),
            way(
              "Proxy động",
              `Proxy.newProxyInstance(loader, new Class<?>[]{Service.class},
    (proxy, m, args) -> {
        if (!user.admin()) throw new SecurityException(user.name() + " cannot call " + m.getName());
        return m.invoke(real, args);          // cho đi tiếp tới object thật
    });`,
              [
                ask("Thêm method mới vào Service", ok("Handler không đổi, proxy tự áp dụng cho method mới.")),
                ask("Chặn user không phải admin", ok("Đã chạy: admin gọi `load(7)` nhận `row-7`; user binh nhận `SecurityException: binh cannot call load`; `Proxy.isProxyClass(...)` là `true`.")),
              ],
              "Một handler kiểm soát mọi method.",
            ),
          ],
          after: [
            "Đọc lambda: mỗi lần client gọi bất kỳ method nào trên proxy, JDK chạy lambda này. `m` là method đang được gọi (một object `Method`), `args` là tham số; `m.invoke(real, args)` gọi đúng method đó trên object thật.",
            "{{jdk-proxy|JDK dynamic proxy}} như ví dụ trên chỉ làm được khi có interface. Không có interface thì {{cglib|CGLIB}} tạo một class con của class thật lúc chạy và override các method. Spring dùng cả hai, và cả hai đều dính bẫy self-invocation ở trên.",
          ],
        },
      ],
    },
    {
      id: "facade",
      title: "Facade: một cửa vào cho hệ thống phức tạp",
      intro: [
        "Ba pattern trước bọc **một** object. Facade đứng trước **cả một nhóm** class.",
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
        "Facade gom nhiều class ngang hàng. Composite xử lý object lồng nhau nhiều tầng.",
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
            ask("Thêm thao tác mới (ví dụ đếm số file)", bad("Viết thêm một hàm với cả vòng `instanceof` mới.")),
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
            ask("Thêm thao tác mới (ví dụ đếm số file)", bad("Thêm method `count()` vào `Node`, rồi sửa **mọi** class implement nó. Composite dễ thêm loại node, khó thêm thao tác. Nếu hay phải thêm thao tác thì xem Visitor (bài Behavioral 2).")),
          ],
          "Lá và nhóm cùng một giao diện, đệ quy diễn ra tự nhiên.",
        ),
      ],
      after: [
        "Gặp: cây menu, cây component giao diện, sơ đồ tổ chức, cây biểu thức.",
      ],
      takeaway: {
        lines: [
          "Composite dễ thêm **loại node** mới, nhưng khó thêm **thao tác** mới (phải sửa mọi class implement `Node`).",
        ],
      },
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
        "Giống điều khiển từ xa và tivi: hai thứ phát triển riêng, chỉ cần nói chung một chuẩn tín hiệu. Đổi tivi không bắt phải đổi kiểu điều khiển.",
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
      takeaway: {
        lines: [
          "Hai chiều thay đổi: kế thừa cho số class bằng **tích**, Bridge cho số class bằng **tổng**.",
        ],
      },
      trap: {
        title: "Nhầm Bridge với Strategy",
        text: "Cấu trúc giống nhau (giữ một interface trong field). Khác ở ý định: Strategy (đóng gói một thuật toán đổi được, sẽ học ở bài Behavioral 1) đổi **thuật toán**, Bridge tách hai **hệ phân cấp** độc lập.",
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
      predict: {
        question: "Văn bản `\"hello world hello\"` có 17 ký tự. Dùng Flyweight, cần tạo bao nhiêu object `Glyph`?",
        options: ["17", "8", "3", "1"],
        answer: 1,
        explain: "Chỉ có 8 ký tự khác nhau: h, e, l, o, dấu cách, w, r, d. Mỗi ký tự một `Glyph` dùng chung, còn vị trí nằm ở `Placed`.",
      },
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
          `record Glyph(char c, String font) {}       // phần không đổi, bất biến nên dùng chung an toàn
record Placed(Glyph glyph, int pos) {}     // phần thay đổi (vị trí), nằm ngoài Glyph
Glyph get(char c) { return pool.computeIfAbsent(c, k -> new Glyph(k, "Arial")); }
for (int i = 0; i < text.length(); i++) doc.add(new Placed(get(text.charAt(i)), i));`,
          [
            ask("Văn bản \"hello world hello\"", ok("Đã chạy: 17 vị trí nhưng chỉ tạo **8** object `Glyph`. Chữ `h` ở vị trí 0 và 12 dùng **cùng một** `Glyph`; mỗi `Placed` chỉ giữ một tham chiếu và một số.")),
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
        question: "Hai pattern nào dễ bị nhầm vì đều giữ một interface trong field và ủy quyền? (Strategy: đóng gói một thuật toán đổi được, sẽ học ở bài sau.)",
        options: ["Bridge và Strategy", "Singleton và Facade", "Flyweight và Builder", "Composite và Adapter"],
        answer: 0,
        explain: "Cấu trúc giống nhau nhưng ý định khác: Strategy (đóng gói một thuật toán đổi được, học ở bài Behavioral 1) đổi thuật toán, Bridge tách hai hệ phân cấp độc lập.",
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
