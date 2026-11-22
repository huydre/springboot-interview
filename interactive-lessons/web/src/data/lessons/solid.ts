import timeline from "../timelines/solid.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Java snippets and outputs shown in the widgets were run on JDK 21. LSP here uses the read-only-list trap; the Square/Rectangle case is in lessons/oop.ts (Phần 11).
// Per-scene clips and the timeline are written by `video-kit/pipeline.py solid-video publish`, which also rewrites videoVersion.
export const solid: Lesson = {
  slug: "solid",
  crumb: "SOLID",
  videoDir: "/videos/solid",
  videoVersion: "b14ae937",
  scenes: timeline as Scene[],
  title: "SOLID: 5 nguyên tắc thiết kế",
  subtitle:
    "SRP, OCP, LSP, ISP, DIP bằng ví dụ chạy thật: dấu hiệu vi phạm, cách sửa, và các bẫy over-engineering khi phỏng vấn.",
  openingQuiz: {
    question: "Người phỏng vấn hỏi: \"SOLID là gì?\". Câu trả lời nào cho thấy bạn hiểu thật thay vì học thuộc?",
    options: [
      "Đọc đúng 5 tên: Single, Open, Liskov, Interface, Dependency",
      "Nêu từng nguyên tắc kèm dấu hiệu vi phạm trong code, và biết khi nào không nên áp dụng quá tay",
      "Nói SOLID là luật bắt buộc phải theo mọi lúc",
      "Nói SOLID chỉ dùng cho Java",
    ],
    answer: 1,
    explain:
      "SOLID là bộ kinh nghiệm (heuristic), không phải luật. Người phỏng vấn senior chấm khả năng nhận ra dấu hiệu vi phạm và cân nhắc đánh đổi, nên áp dụng máy móc (interface cho mọi class) còn bị trừ điểm.",
  },
  roadmap: [
    "Chặng 1: SRP và OCP. Một class một lý do thay đổi, và thêm tính năng bằng class mới thay vì sửa code cũ.",
    "Chặng 2: LSP và ISP. Class con phải thay được class cha, và interface nhỏ theo vai trò.",
    "Chặng 3: DIP và bảng nhớ. Vì sao Spring inject interface, phân biệt DIP, DI, IoC, và các bẫy over-engineering.",
  ],
  sections: [
    {
      id: "srp",
      title: "S: Single Responsibility, một class một lý do thay đổi",
      scene: "srp",
      intro: [
        "**SRP**: một class chỉ nên có **một lý do để thay đổi**, tức **một người yêu cầu sửa nó** (kế toán, marketing, DBA).",
        "Vì sao đếm theo người yêu cầu? Mỗi bên đổi ý vào thời điểm khác nhau, vì lý do khác nhau. Nếu kế toán và marketing cùng sửa một class, hai lần sửa dễ đụng nhau: sửa cách tính thuế cho kế toán có thể làm hỏng phần giao diện mà marketing vừa duyệt, và mỗi lần sửa phải test lại cả những phần không liên quan.",
        "`Invoice` vừa tính tiền, vừa dựng giao diện, vừa lưu database. Thử cả ba yêu cầu thay đổi ở hai cách viết bên dưới.",
      ],
      widget: "srp",
      widgetTitle: "Cùng ba yêu cầu, hai cách viết",
      after: [
        "Tự hỏi: \"ai sẽ yêu cầu sửa class này?\" Có hơn một câu trả lời thì nên tách. Nhưng đừng tách quá tay: xem phần ngoại lệ ngay sau.",
      ],
      trap: {
      title: "SRP không phải \"một class một method\"",
      text: "SRP đếm số lý do thay đổi (số bên yêu cầu sửa), không đếm số method. Các thứ luôn đổi cùng nhau thì giữ cùng nhau, nếu không một thao tác nghiệp vụ trải ra 8 class.",
    },
    quiz: {
        question: "Class `Order` có `calculatePrice()`, `sendConfirmationEmail()` và `saveToDb()`. Vấn đề theo SRP là gì?",
        options: [
          "Class có quá nhiều dòng code",
          "Ba nhóm khác nhau (giá, thông báo, lưu trữ) cùng có lý do để sửa một class, nên sửa một chỗ dễ làm hỏng chỗ khác",
          "Class chưa có interface",
          "Class chưa dùng Lombok",
        ],
        answer: 1,
        explain: "SRP đếm số lý do thay đổi (số bên yêu cầu), không đếm số dòng code hay số method.",
      },
      parts: [
        {
          id: "srp-limits",
          title: "Khi nào cố ý không tách class",
          scene: "srp-limits",
          intro: [
            "SRP bảo tách theo lý do thay đổi, nhưng tách quá tay cũng có giá. Có **3 trường hợp** nên cố ý giữ nhiều hành vi trong một class:",
            "- **Aggregate**: các luật nghiệp vụ phải được kiểm tra cùng một chỗ.",
            "- **Transaction**: các bước phải cùng thành công hoặc cùng bị huỷ.",
            "- **Hiệu năng**: với dữ liệu lớn, tách ra nhiều bước tạo thêm nhiều object trung gian và làm chậm.",
            "Ví dụ đơn hàng: `Order` là {{aggregate-root}}, và nó giữ cả ba luật: **tối đa 3 dòng**, **giảm tối đa 30%**, **đã thanh toán thì không thêm hàng**. Xem điều gì xảy ra khi tách các hành vi này ra nhiều service.",
          ],
          board: {
            title: "3 lý do hợp lý để giữ nhiều hành vi trong một class",
            highlight: "giữ nhiều hành vi trong một class",
            chips: ["SRP không có nghĩa: 1 class chỉ có 1 method", "SRP = 1 lý do chính để thay đổi"],
            cards: [
              {
                title: "Aggregate (DDD)",
                diagram: {
                  kind: "hub",
                  inputs: [{ label: "addLine()", mark: "plus" }, { label: "applyDiscount()", mark: "minus" }, { label: "pay()", mark: "ok" }, { label: "lines()", mark: "calc" }],
                  center: "Order",
                  rulesTitle: "Luật của đơn hàng",
                  rules: ["Tối đa 3 dòng", "Giảm tối đa 30%", "Đã `PAID` thì khóa"],
                },
                notes: ["{{aggregate}} ({{ddd}}): nhóm object đi cùng nhau, chung một bộ luật. `Order` là {{aggregate-root}}."],
                code: `class Order {
  private final List<String> lines = new ArrayList<>();
  void addLine(String item)       { /* tối đa 3 dòng */ }
  void applyDiscount(int percent) { /* tối đa 30% */ }
  void pay()                      { /* không trả đơn rỗng */ }
}`,
                takeaway: "1 class, 1 trách nhiệm: giữ luật của đơn hàng",
              },
              {
                title: "Transaction",
                diagram: {
                  kind: "flow",
                  steps: ["transfer()", "withdraw(from, amount)", "deposit(to, amount)"],
                  ok: ["Thành công", "COMMIT"],
                  bad: ["Có lỗi", "ROLLBACK"],
                },
                notes: ["Các bước phải cùng thành công hoặc cùng thất bại.", "Rải ra nhiều class gọi nhau dễ mất ranh giới transaction."],
                code: `@Transactional
public void transfer(long from, long to, long amount) {
  accounts.withdraw(from, amount);
  accounts.deposit(to, amount);
}`,
                takeaway: "Nghiệp vụ chuyển tiền nằm trong một ranh giới giao dịch",
              },
              {
                title: "Hiệu năng",
                diagram: {
                  kind: "pipe",
                  from: "1.000.000 số",
                  via: "sum()",
                  to: "tổng",
                  skipped: ["NumberValidator", "NumberDoubler", "NumberAccumulator"],
                  skippedLabel: "Không cần",
                },
                notes: ["Đoạn code chạy rất nhiều lần: mỗi object thừa là thêm cấp phát và áp lực GC."],
                code: `long sum(int[] numbers) {
  long total = 0;
  for (int n : numbers) if (n > 0) total += n * 2L;
  return total;
}`,
                takeaway: "Ưu tiên đơn giản khi xử lý dữ liệu lớn",
              },
            ],
            conclusion: "**Kết luận:** nhiều method trong một class vẫn đúng SRP nếu chúng phục vụ cùng một mục tiêu.",
          },
          predict: {
            question: "Cách viết \"tách ra nhiều service, sửa thẳng dữ liệu\": thêm 5 dòng hàng, giảm giá 90%, thanh toán rồi thêm tiếp một dòng. Đơn hàng cuối cùng ra sao?",
            options: [
              "Dòng thứ 4 bị chặn, giảm giá bị cắt còn 30%",
              "Đơn có 6 dòng, giảm 90%, đã `PAID` mà vẫn thêm được hàng",
              "Lỗi biên dịch vì field public",
              "Chỉ lệnh thêm hàng sau khi thanh toán bị chặn",
            ],
            answer: 1,
            explain: "Không service nào giữ luật, mỗi service chỉ sửa thẳng dữ liệu, nên mọi thao tác sai luật đều lọt qua. `Order` tự giữ luật thì mọi thay đổi phải đi qua một cửa.",
          },
          widgetTitle: "Cùng ba luật, hai cách viết",
          compare: [
            way(
              "Tách ra nhiều service, sửa thẳng dữ liệu",
              `class OrderData { public List<String> lines; public int discountPercent; public String status; }
class LineService     { void add(OrderData o, String item) { o.lines.add(item); } }
class DiscountService { void set(OrderData o, int percent)  { o.discountPercent = percent; } }
class PayService      { void pay(OrderData o)               { o.status = "PAID"; } }`,
              [
                ask("Thêm 5 dòng hàng, giảm giá 90%, thanh toán rồi thêm tiếp một dòng", bad("Đã chạy: đơn có **6 dòng**, giảm **90%**, trạng thái `PAID` và vẫn thêm được hàng sau khi thanh toán. Không luật nào được giữ.")),
                ask("Ai chịu trách nhiệm giữ luật", bad("Mỗi service phải tự nhớ kiểm tra mọi luật. Thêm một service mới mà quên một luật là dữ liệu sai.")),
              ],
              "Dữ liệu để ngỏ, luật nằm rải rác nên rất dễ bị bỏ qua.",
            ),
            way(
              "Order là aggregate root, giữ luật của chính nó",
              `class Order {
  private final List<String> lines = new ArrayList<>();
  void addLine(String item) { /* kiểm tra còn OPEN và chưa đủ 3 dòng */ }
  void applyDiscount(int percent) { /* tối đa 30% */ }
  void pay() { /* đơn rỗng thì không được thanh toán */ }
  List<String> lines() { return List.copyOf(lines); }   // trả bản sao chỉ đọc
}`,
              [
                ask("Thêm hàng và giảm giá sai luật", ok("Đã chạy: dòng thứ 4 bị `max 3 lines`, giảm 90% bị `discount capped at 30%`. Chỉ còn `[pen, book, bag]`.")),
                ask("Thêm hàng sau khi thanh toán", ok("Đã chạy: `order is PAID, cannot add lines`. Muốn sửa thẳng danh sách qua `lines().add(...)` thì ném `UnsupportedOperationException`.")),
                ask("Thanh toán đơn rỗng", ok("Đã chạy: `cannot pay an empty order`.")),
              ],
              "Mọi thay đổi đi qua một cửa duy nhất nên không thể làm đơn hàng sai luật.",
            ),
          ],
          quiz: {
            question: "Vì sao aggregate `Order` có thể cố ý giữ cả dòng hàng lẫn quy tắc của chúng trong một class?",
            options: [
              "Để bảo vệ quy tắc nhất quán: tách ra ngoài thì code khác sửa dữ liệu mà bỏ qua quy tắc",
              "Vì Java không cho tách class",
              "Vì class lớn luôn chạy nhanh hơn",
              "Vì SRP không áp dụng cho entity",
            ],
            answer: 0,
            explain: "Order là nơi duy nhất được đổi dòng hàng, nên mọi thay đổi đều đi qua quy tắc (giới hạn dòng, giảm giá tối đa). Tách ra rồi cùng sửa Order sẽ phá đóng gói và dễ để đơn hàng sai trạng thái.",
          },
        },
      ],
    },
    {
      id: "ocp",
      title: "O: Open/Closed, thêm bằng class mới, không sửa code cũ",
      scene: "ocp",
      intro: [
        "SRP chia class theo lý do thay đổi. Câu hỏi tiếp theo: khi có tính năng mới thì sửa ở đâu?",
        "**OCP**: code **mở cho mở rộng, đóng với sửa đổi**. Thêm tính năng bằng class mới, không mở code đang chạy tốt ra sửa.",
        "Giảm giá bằng `if / else` thì thêm `STUDENT` phải sửa hàm. Tách `interface Discount` thì chỉ thêm một class. Thử thêm `STUDENT` ở cả hai cách.",
      ],
      widget: "ocp",
      widgetTitle: "Thêm loại giảm giá mới",
      after: [
        "Dấu hiệu: chuỗi `if / else` hoặc `switch` theo loại cứ dài thêm. Cách sửa: **Strategy**, nhưng theo {{rule-of-three}} tới lần thứ ba mới tách.",
      ],
      trap: {
      title: "Tách Strategy từ lần đầu",
      text: "Tạo interface cho thứ có thể không bao giờ đổi chỉ làm code khó đọc. Rule of Three: lần 1 viết thẳng, lần 2 chịu lặp, lần 3 mới tách.",
    },
    quiz: {
        question: "Vì sao chuỗi `if (type.equals(\"VIP\")) ... else if ...` theo loại giảm giá bị coi là vi phạm OCP?",
        options: [
          "Vì `equals` chạy chậm",
          "Vì mỗi loại mới buộc phải mở và sửa hàm đang chạy tốt, thay vì chỉ thêm một class",
          "Vì Java không cho dùng else if",
          "Vì phải dùng `switch` thay cho `if`",
        ],
        answer: 1,
        explain: "OCP hướng tới thêm mà không sửa. Strategy cho phép thêm class mới và để nguyên code cũ (đã chạy thật: STUDENT = 950000 mà checkout() không đổi).",
      },
    },
    {
      id: "lsp",
      title: "L: Liskov Substitution, class con thay được class cha",
      scene: "lsp",
      intro: [
        "OCP mở rộng bằng class con và interface. Nhưng class con nào cũng dùng thay cha được không?",
        "**LSP**: ở đâu dùng class cha, thay bằng class con thì code vẫn phải đúng. Class con phải **giữ lời hứa** của class cha, không chỉ \"là một\" ngoài đời.",
        "`ReadOnlyList extends ArrayList` cho `add()` ném lỗi: hàm `addDefaults(List)` đúng với mọi `List` lại nổ. Thử cả hai cách.",
      ],
      widget: "lsp-solid",
      widgetTitle: "Danh sách chỉ đọc: kế thừa hay tách kiểu",
      after: [
        "Dấu hiệu: override ném `UnsupportedOperationException`, hoặc phải `instanceof` / ép kiểu trước khi dùng. Ưu tiên tách kiểu để lỗi lộ ra lúc compile.",
      ],
      trap: {
      title: "Override ném UnsupportedOperationException",
      text: "Đó là dấu hiệu class con không thay được class cha. Tách kiểu (chỉ đọc và ghi được) để lỗi lộ ra lúc compile thay vì nổ ở production.",
    },
    quiz: {
        question: "Dấu hiệu nào trong code gợi ý class con vi phạm LSP?",
        options: [
          "Class con có thêm method riêng",
          "Class con override một method và ném `UnsupportedOperationException`",
          "Class con dùng `super.method()`",
          "Class con ở package khác với class cha",
        ],
        answer: 1,
        explain: "Nếu code dùng class cha phải biết đang cầm class con nào mới an toàn, tức là class con không thay thế được class cha.",
      },
      parts: [
        {
          id: "lsp-rules",
          title: "6 quy tắc của lời hứa",
          scene: "lsp-rules",
          intro: [
            "Liskov và Wing nêu 6 quy tắc cho lời hứa giữa class cha và class con. **4 quy tắc đầu là về hành vi**, compiler không bắt được, phải tự giữ. **2 quy tắc cuối compiler kiểm tra** giúp bạn. Mỗi quy tắc kèm một ví dụ nhỏ:",
            "- **1. Đầu vào không chặt hơn** (precondition, điều kiện mà tham số phải thoả trước khi gọi). Cha `setAge(int age)` nhận mọi số nguyên; con override mà ném `IllegalArgumentException` khi `age <= 0` thì code đang gọi `setAge(0)` qua kiểu cha bỗng nổ.",
            "- **2. Kết quả không yếu hơn** (postcondition, điều method hứa về kết quả sau khi chạy). Cha hứa `findName()` không bao giờ trả `null`; con trả `null` thì code bên gọi viết `findName().length()` theo lời hứa của cha sẽ ném `NullPointerException`.",
            "- **3. Giữ {{invariant}}** (điều luôn đúng với object, ở mọi thời điểm). Cha `Account` đảm bảo số dư không bao giờ âm; con cho phép rút quá số dư thì báo cáo nào giả định số dư không âm đều ra sai.",
            "- **4. {{history-constraint}}**: con không được đổi trạng thái theo cách cha không cho. Cha là một điểm toạ độ bất biến, tạo xong không đổi; con thêm `setX()` thì code đang dùng điểm đó làm key trong `HashMap` hay cache sẽ tìm không ra nữa.",
            "- **5. Checked exception hẹp hơn hoặc bằng**: cha `read() throws IOException`; con được ném `FileNotFoundException` (con của `IOException`), nhưng ném `Exception` rộng hơn thì đã chạy `javac`: `read() in C1 cannot override read() in P1; overridden method does not throw Exception`. Quy tắc này dựa trên checked exception, xem bài Exception.",
            "- **6. {{covariant|Kiểu trả về hẹp hơn}}**: cha `Object get()`, con override thành `String get()` là được. Ngược lại, cha `String get()` mà con trả `Object` thì đã chạy `javac`: `get() in C2 cannot override get() in P2; return type Object is not compatible with String`.",
            "JDK cũng thoả hiệp: `unmodifiableList().add()` ném lỗi. Kotlin tách `List` và `MutableList` ngay trong hệ thống kiểu.",
          ],
          quiz: {
            question: "Quy tắc Liskov nào được compiler Java kiểm tra giúp bạn?",
            options: [
              "Đầu vào không chặt hơn",
              "Checked exception hẹp hơn hoặc bằng, và kiểu trả về hẹp hơn",
              "Giữ invariant của class cha",
              "History constraint",
            ],
            answer: 1,
            explain: "Đã thử trên JDK 21: ném `Exception` rộng hơn, hay trả `Object` thay cho `String`, đều báo \"cannot override\". Bốn quy tắc còn lại là lời hứa về hành vi, compiler không bắt được.",
          },
        },
      ],
    },
    {
      id: "isp",
      title: "I: Interface Segregation, interface nhỏ theo vai trò",
      scene: "isp",
      intro: [
        "LSP nhìn từ phía class con. ISP nhìn từ phía interface: interface có ép class phải hứa những điều nó không làm được không?",
        "**ISP**: client không bị ép phụ thuộc method nó không dùng. Chia interface béo thành interface nhỏ theo **vai trò**.",
        "`FatWorker` có `work()` và `eat()`. Thêm `Robot` thì bị ép có `eat()` và chỉ còn cách ném lỗi. Tách `Workable` và `Eatable` là hết.",
      ],
      widget: "isp",
      widgetTitle: "Thêm Robot vào hệ thống",
      after: [
        "Tự hỏi: \"có client nào dùng **mọi** method của interface này không?\" Đừng tách mỗi method một interface (interface explosion): tách theo vai trò, và dùng `default` method khi muốn thêm hành vi mà không ép class cũ.",
      ],
      trap: {
      title: "Mỗi method một interface",
      text: "Tách quá tay dẫn tới interface explosion. Tách theo vai trò mà client thật sự cần, và hỏi: \"có client nào dùng mọi method của interface này không?\".",
    },
    quiz: {
        question: "Tách một interface 10 method thành 10 interface, mỗi cái 1 method. Nhận xét nào đúng?",
        options: [
          "Đúng ISP nhất, càng nhỏ càng tốt",
          "Quá tay: dẫn tới interface explosion. Nên tách theo vai trò client cần",
          "Sai vì interface chỉ được có một method",
          "Đúng, vì Spring yêu cầu như vậy",
        ],
        answer: 1,
        explain: "ISP là tách theo nhu cầu của client, không phải theo từng method. Nhiều interface một method làm code khó theo dõi.",
      },
    },
    {
      id: "dip",
      title: "D: Dependency Inversion, phụ thuộc interface, không phụ thuộc class cụ thể",
      scene: "dip",
      intro: [
        "Interface đã nhỏ và đúng vai trò. Câu hỏi cuối: ai định nghĩa interface, và ai phụ thuộc vào ai?",
        "**DIP**: nghiệp vụ và hạ tầng (database, email) đều nên phụ thuộc **abstraction**, không buộc vào chi tiết.",
        "Chữ \"đảo ngược\" (inversion) nằm ở hướng mũi tên phụ thuộc. Cách viết thông thường: `OrderService` (module cấp cao, chứa nghiệp vụ) gọi thẳng `MySqlOrderRepository` (module cấp thấp), nên phụ thuộc vào nó. Theo DIP, chính module cấp cao **định nghĩa interface** `OrderRepository` theo nhu cầu của nó, còn module cấp thấp **implement** interface đó. Mũi tên phụ thuộc giờ đi từ module cấp thấp về phía module cấp cao, ngược lại với trước.",
        "Dấu hiệu: `new MySqlOrderRepository()` nằm trong `OrderService`. Sửa: nhận `OrderRepository` (interface) qua constructor.",
      ],
      widget: "dip",
      widgetTitle: "Đổi database và viết test",
      after: [
        "**DIP** là nguyên tắc. **DI** là kỹ thuật tiêm dependency. **IoC** là việc Spring nắm quyền tạo và nối object ({{hollywood}}).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Module cấp cao định nghĩa interface theo nhu cầu của nó → module cấp thấp implement interface đó → mũi tên phụ thuộc đổi chiều, đổi database không phải sửa `OrderService`.",
        ],
      },
    quiz: {
        question: "Câu nào phân biệt đúng DIP, DI và IoC?",
        options: [
          "Ba thứ này giống hệt nhau",
          "DIP là nguyên tắc, DI là kỹ thuật tiêm dependency, IoC là việc framework (Spring) kiểm soát việc tạo và nối object",
          "DIP là framework, DI là nguyên tắc, IoC là kỹ thuật",
          "IoC chỉ dùng được với `@Autowired` trên field",
        ],
        answer: 1,
        explain: "DIP (nguyên tắc) được thực hiện bằng DI (kỹ thuật), và IoC container như Spring tự động hoá việc tiêm.",
      },
      parts: [
        {
          id: "dip-history",
          title: "Vì sao có OrderServiceImpl?",
          scene: "dip-history",
          intro: [
            "Trước hết, **proxy** là gì: là một object bọc ngoài do Spring tạo ra và đặt đứng trước bean thật. Mọi lời gọi tới bean đi qua proxy trước, nhờ vậy Spring chen được việc mở và đóng transaction (`@Transactional`) quanh method của bạn.",
            "Cặp `OrderService` + `OrderServiceImpl` đến từ thời Spring 1.x và 2.x. Khi bean có interface, Spring **mặc định** tạo proxy bằng {{jdk-proxy|JDK proxy}}, loại proxy chỉ làm được qua interface. Proxy thẳng class thì phải bật `proxyTargetClass=true` (dùng {{cglib|CGLIB}}). Vì vậy viết interface cho mọi service trở thành quy ước, dù không bắt buộc. Spring Boot nay mặc định CGLIB, proxy thẳng class thường.",
            "Chỉ tách interface khi có implementation thứ hai thật, cần mock, hoặc cần ranh giới giữa module.",
          ],
          trap: {
          title: "Interface cho mọi service",
          text: "Chỉ có một implementation và không ai thay thì interface chỉ tăng số file (YAGNI). Dùng khi cần thay thế, mock, hoặc có nhiều implementation.",
        },
          quiz: {
            question: "Vì sao nhiều dự án Spring cũ có `OrderServiceImpl` cho mọi service?",
            options: [
              "Vì proxy mặc định thời đó là JDK proxy, loại chỉ proxy được qua interface",
              "Vì Java bắt buộc mỗi class có interface",
              "Vì CGLIB không hỗ trợ class",
              "Vì Lombok yêu cầu",
            ],
            answer: 0,
            explain: "Spring 1.x và 2.x mặc định dùng JDK dynamic proxy cho AOP và transaction, nên viết interface cho mọi bean thành quy ước (proxy class bằng CGLIB vẫn bật được qua proxyTargetClass=true). Nay Spring Boot mặc định CGLIB, nên interface chỉ có một implementation không còn cần.",
          },
        },
      ],
    },
    {
      id: "playbook",
      title: "Bảng nhớ và các bẫy khi phỏng vấn",
      scene: "playbook",
      intro: [
        "Bấm từng dòng để xem câu nên nói ra miệng. Người phỏng vấn senior thường hỏi **\"khi nào bạn không áp dụng nó?\"**",
        "Ba bẫy hay gặp:",
        "- **Interface cho mọi service**: chỉ có một implementation thì interface chỉ tăng số file.",
        "- **Tách SRP quá nhỏ**: một thao tác nghiệp vụ trải ra quá nhiều class.",
        "- **DRY máy móc**: hai đoạn giống nhau chỉ vì tình cờ thì để lặp còn hơn gộp.",
      ],
      widget: "solid-cheatsheet",
      widgetTitle: "Bảng nhớ SOLID và câu nói mẫu",
      quiz: {
        question: "Người phỏng vấn hỏi: \"Em có tạo interface cho mọi service không?\". Câu trả lời tốt nhất?",
        options: [
          "Có, để luôn tuân thủ DIP",
          "Không phải lúc nào cũng vậy: chỉ khi có nhiều implementation hoặc cần thay thế/mock; còn lại giữ đơn giản theo YAGNI",
          "Không, vì interface làm chương trình chạy chậm",
          "Có, vì Spring bắt buộc",
        ],
        answer: 1,
        explain: "Nguyên tắc là kinh nghiệm, cần cân nhắc đánh đổi. Interface thừa chỉ làm tăng số file mà không giảm rủi ro thay đổi.",
      },
    },
    {
      id: "interview",
      title: "Trả lời như senior",
      scene: "interview",
      intro: [
        "Người phỏng vấn chấm **cách bạn cân nhắc**. Junior tạo interface cho mọi thứ. Senior tách đúng chỗ: `Order` tự giữ quy tắc, `OrderRepository` tách vì nơi lưu có thể đổi.",
        "Hỏi \"nếu sau này cần X thì sao?\": thiết kế để thêm X không phải sửa code cũ (OCP), nhưng **chưa làm X** ({{yagni}}).",
      ],
      quiz: {
        question: "Người phỏng vấn hỏi: \"Nếu sau này cần hỗ trợ X thì sao?\". Câu trả lời tốt?",
        options: [
          "Em làm luôn X cho chắc",
          "Em thiết kế để thêm X không phải sửa code cũ, nhưng chưa làm X vì chưa có trong yêu cầu",
          "Em sẽ không hỗ trợ X",
          "Em viết sẵn mọi interface có thể cần",
        ],
        answer: 1,
        explain: "Đó là OCP (dễ thêm sau) cộng YAGNI (chưa làm bây giờ).",
      },
    },
  ],
  cards: [
    { q: "SOLID gồm những nguyên tắc nào?", a: "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Đây là kinh nghiệm thiết kế, không phải luật bắt buộc." },
    { q: "SRP: làm sao biết class có nhiều hơn một trách nhiệm?", a: "Hỏi \"ai sẽ yêu cầu sửa class này?\". Nếu có nhiều hơn một bên (kế toán, marketing, DBA) thì có nhiều lý do thay đổi và nên tách." },
    { q: "OCP: dấu hiệu vi phạm và cách sửa?", a: "Chuỗi `if / else` hoặc `switch` theo loại cứ dài thêm. Sửa bằng Strategy hay polymorphism: thêm class mới mà không sửa code cũ." },
    { q: "LSP: dấu hiệu vi phạm?", a: "Override ném `UnsupportedOperationException`, hoặc phải `instanceof` và ép kiểu trước khi dùng. Class con không thay được class cha." },
    { q: "ISP: dấu hiệu vi phạm và cách sửa?", a: "Có method chỉ để ném `UnsupportedOperationException`. Tách interface theo vai trò client cần, nhưng không tách mỗi method một interface." },
    { q: "DIP, DI, IoC khác nhau thế nào?", a: "DIP là nguyên tắc: phụ thuộc abstraction. DI là kỹ thuật tiêm dependency để đạt DIP. IoC là việc framework như Spring nắm quyền tạo và nối object." },
    { q: "LSP đầy đủ gồm những quy tắc nào?", a: "Đầu vào không chặt hơn, kết quả không yếu hơn, giữ invariant của cha, không thêm thay đổi trạng thái mà cha không cho (history constraint), checked exception hẹp hơn hoặc bằng, kiểu trả về hẹp hơn hoặc bằng. Compiler chỉ kiểm tra hai quy tắc cuối." },
    { q: "Vì sao có thói quen OrderService + OrderServiceImpl?", a: "Spring 1.x và 2.x mặc định dùng JDK dynamic proxy, loại chỉ proxy được qua interface, nên viết interface thành quy ước (dù CGLIB đã bật được qua proxyTargetClass). Nay Boot mặc định CGLIB, proxy được class thường, nên interface một implementation không còn cần. Tách khi có implementation thứ hai hoặc ranh giới module." },
    { q: "\"Nếu sau này cần X thì sao?\" trả lời thế nào?", a: "Thiết kế để thêm X không phải sửa code cũ (OCP), nhưng chưa làm X vì chưa có trong yêu cầu (YAGNI)." },
    { q: "Khi nào không nên áp dụng SOLID máy móc?", a: "Khi chưa có nhu cầu thật: interface cho mọi service, tách SRP quá nhỏ, hay DRY cho code chỉ trùng ngẫu nhiên. Áp dụng khi thấy dấu hiệu, chờ tới lần thứ ba." },
  ],
  modelAnswer:
    "SOLID là 5 nguyên tắc thiết kế hướng đối tượng. SRP: một class chỉ có một lý do thay đổi, tức một bên yêu cầu sửa nó, ví dụ không để tính giá, gửi email và lưu DB trong một class. OCP: thêm tính năng bằng class mới thay vì sửa code đang chạy, thường dùng Strategy thay cho chuỗi if/else, nhưng em chờ tới lần thứ ba mới tách. LSP: class con phải thay được class cha, nên override ném UnsupportedOperationException là dấu hiệu sai. ISP: chia interface nhỏ theo vai trò client cần, tránh ép phụ thuộc method không dùng. DIP: service phụ thuộc interface, nhận qua constructor, nên đổi database hay viết unit test không sửa service; DIP là nguyên tắc, DI là kỹ thuật, IoC là việc Spring giữ quyền tạo object. Em coi đây là kinh nghiệm chứ không phải luật, và tránh over-engineering như interface cho mọi class.",
};
