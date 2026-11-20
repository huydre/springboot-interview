import timeline from "../timelines/solid.json";
import type { Lesson, Scene } from "../types";

// Java snippets and outputs shown in the widgets were run on JDK 21. LSP here uses the read-only-list trap; the Square/Rectangle case is in lessons/oop.ts (Phần 11).
// Video not rendered yet: scenes stay empty until `pipeline.py solid-video publish`.
export const solid: Lesson = {
  slug: "solid",
  crumb: "SOLID",
  videoDir: "/videos/solid",
  videoVersion: "6f68a448",
  scenes: timeline as Scene[],
  title: "SOLID: 5 nguyên tắc thiết kế",
  subtitle:
    "SRP, OCP, LSP, ISP, DIP bằng ví dụ có thể chạy: mỗi nguyên tắc có một đoạn code vi phạm, một bản sửa, và dấu hiệu để nhận ra trong buổi phỏng vấn. Cuối bài là các bẫy over-engineering mà người phỏng vấn senior hay hỏi.",
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
        "**SRP** nói: một class chỉ nên có **một lý do để thay đổi**. \"Lý do\" ở đây không phải là \"một việc\", mà là **một người (hay một nhóm) yêu cầu sửa nó**: kế toán, marketing, DBA.",
        "Ví dụ `Invoice` vừa tính tiền (`total()`), vừa dựng giao diện (`html()`), vừa lưu database (`save()`). Ba nhóm người khác nhau cùng sửa một file. Bấm từng yêu cầu thay đổi ở hai cách viết bên dưới để thấy phải sửa những gì.",
      ],
      widget: "srp",
      widgetTitle: "Cùng ba yêu cầu, hai cách viết",
      after: [
        "Dấu hiệu nhận ra: class import nhiều thứ không liên quan (thư viện gửi mail, JDBC, định dạng HTML), hoặc tên class chứa \"And\", \"Manager\", \"Util\". Một câu hỏi tự kiểm: \"ai sẽ yêu cầu sửa class này?\" Nếu có hơn một câu trả lời thì nên tách.",
        "Đừng tách quá tay: các thứ luôn đổi **cùng nhau** thì nên ở cùng nhau. Một aggregate trong DDD cố tình giữ nhiều hành vi trong một class để bảo vệ quy tắc nhất quán, và đó không phải vi phạm SRP.",
        "Hai lý do khác để cố ý không tách. **Transaction**: các bước phải thành công hay thất bại cùng nhau mà rải ra nhiều service gọi lẫn nhau thì dễ mất ranh giới transaction, entity bị detach, gặp `LazyInitializationException`. **Hiệu năng** ở đoạn code chạy rất nhiều lần: tách một cấu trúc dữ liệu chặt chẽ thành nhiều object trung gian làm tăng cấp phát heap, áp lực GC và nhảy con trỏ, giữ chung một chỗ thì tận dụng CPU cache tốt hơn. Khi phỏng vấn, nói rõ bạn **biết** mình đang đánh đổi gì.",
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
    },
    {
      id: "ocp",
      title: "O: Open/Closed, thêm bằng class mới, không sửa code cũ",
      scene: "ocp",
      intro: [
        "**OCP**: code nên **mở cho việc mở rộng** nhưng **đóng với việc sửa đổi**. Nghĩa là thêm tính năng mới bằng cách viết thêm class, không phải mở code đang chạy tốt ra để sửa.",
        "Ví dụ tính giảm giá. Cách đầu dùng `if / else` theo chuỗi loại (`SEASONAL`, `VIP`). Muốn thêm `STUDENT` phải sửa chính hàm đó. Cách hai tách `interface Discount`, mỗi loại là một class. Thử thêm `STUDENT` ở cả hai cách.",
      ],
      widget: "ocp",
      widgetTitle: "Thêm loại giảm giá mới",
      after: [
        "Dấu hiệu: một chuỗi `if / else` hoặc `switch` theo loại, và mỗi lần có loại mới lại phải thêm một nhánh. Cách sửa phổ biến là **Strategy** (đã gặp ở bài OOP) hoặc polymorphism.",
        "Đừng áp dụng quá sớm. **Rule of Three**: lần đầu cứ viết thẳng, lần hai chịu lặp, tới lần thứ ba mới tách. Tách ngay từ đầu cho thứ có thể không bao giờ đổi chỉ làm code khó đọc hơn. Nếu bạn muốn chủ động chặn mở rộng thì dùng `sealed` interface (Java 17), để compiler buộc xử lý đủ các trường hợp.",
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
        "**LSP**: ở đâu dùng class cha thì thay bằng class con, code vẫn phải đúng. Quan hệ \"là một\" ngoài đời chưa đủ: class con phải **giữ lời hứa** (contract) của class cha. Ở bài OOP bạn đã thấy `Square extends Rectangle`. Đây là một bẫy khác, rất gần với JDK.",
        "Bạn cần một danh sách chỉ đọc nên viết `ReadOnlyList extends ArrayList` và cho `add()` ném lỗi. Hàm `addDefaults(List<String>)` đúng với mọi `List`, nhưng gặp class con này thì nổ. Hãy thử cả hai cách.",
      ],
      widget: "lsp-solid",
      widgetTitle: "Danh sách chỉ đọc: kế thừa hay tách kiểu",
      after: [
        "Dấu hiệu vi phạm: override ném `UnsupportedOperationException`, hoặc code phải `instanceof` / ép kiểu trước khi dùng, hoặc class con **thắt chặt điều kiện đầu vào** hay **làm yếu kết quả** so với class cha.",
        "Định nghĩa đầy đủ (Liskov và Wing, 1994) có 6 quy tắc. (1) **Điều kiện đầu vào không được chặt hơn**: cha nhận mọi `int` thì con không được đòi `> 0`. (2) **Kết quả không được yếu hơn**: cha hứa không trả `null` thì con cũng vậy. (3) **Giữ các bất biến (invariant)** của class cha, những điều luôn đúng với mọi object. (4) **History constraint**: cha bất biến (immutable) thì con không được thêm method làm đổi trạng thái. (5) Con chỉ được ném **checked exception hẹp hơn hoặc bằng** của cha. (6) Con được trả về **kiểu hẹp hơn** (covariant return), không được rộng hơn.",
        "Chỉ hai quy tắc cuối được compiler kiểm tra. Đã thử trên JDK 21: override `read() throws IOException` thành `throws Exception` hay đổi kiểu trả về `String` thành `Object` đều báo lỗi \"cannot override\", còn `String read() throws FileNotFoundException` thì hợp lệ. Bốn quy tắc đầu là **lời hứa về hành vi**, compiler không bắt được, nên người phỏng vấn mới hay hỏi.",
        "JDK cũng thoả hiệp ở đây: `Collections.unmodifiableList()` trả về một `List` mà `add()` ném lỗi. Từ Java 1.2, Sun chọn vậy để không phải nhân đôi cây interface collection (một nhánh chỉ đọc, một nhánh ghi được) và giữ tương thích với `Vector`, `Hashtable`. Kotlin sửa điều này ngay trong hệ thống kiểu: `List` chỉ đọc, `MutableList` mới có `add()`. Khi thiết kế mới trong Java, hãy ưu tiên tách kiểu (hoặc dùng record bất biến) để lỗi lộ ra lúc compile.",
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
    },
    {
      id: "isp",
      title: "I: Interface Segregation, interface nhỏ theo vai trò",
      scene: "isp",
      intro: [
        "**ISP**: client không nên bị ép phụ thuộc vào method nó không dùng. Thay vì một interface béo, hãy chia thành các interface nhỏ theo **vai trò**.",
        "Ví dụ `FatWorker` có `work()` và `eat()`. Thêm `Robot` thì buộc phải có `eat()`, và `Robot` chỉ còn cách ném lỗi. Chia thành `Workable` và `Eatable` thì `Robot` chỉ cần `Workable`.",
      ],
      widget: "isp",
      widgetTitle: "Thêm Robot vào hệ thống",
      after: [
        "Cách kiểm tra nhanh: \"có client nào thật sự dùng **mọi** method của interface này không?\". Nếu không, hãy tách. Dấu hiệu rõ nhất vẫn là method chỉ để ném `UnsupportedOperationException`.",
        "Mặt trái: **interface explosion**. Đừng tạo một interface cho mỗi method. Tách theo vai trò mà client thật sự cần, và dùng `default` method khi muốn thêm hành vi mà không ép các class cũ.",
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
        "**DIP**: module cấp cao (nghiệp vụ) và cấp thấp (database, email) đều nên phụ thuộc vào **abstraction**. Nghiệp vụ không được buộc vào chi tiết hạ tầng.",
        "Dấu hiệu rõ nhất: `new MySqlOrderRepository()` nằm trong `OrderService`. Cách sửa: `OrderService` nhận `OrderRepository` (interface) qua constructor. Hai kịch bản bên dưới là đổi database và viết unit test.",
      ],
      widget: "dip",
      widgetTitle: "Đổi database và viết test",
      after: [
        "Ba khái niệm hay bị lẫn: **DIP** là nguyên tắc thiết kế (phụ thuộc abstraction). **DI** (Dependency Injection) là kỹ thuật đưa dependency từ ngoài vào, ví dụ qua constructor, để đạt DIP. **IoC** (Inversion of Control) là việc framework như Spring `ApplicationContext` nắm quyền tạo và nối các object, theo **Hollywood Principle**: \"Don't call us, we'll call you\". Code của bạn không tự gọi `new` hay tự chạy vòng đời, mà framework gọi vào code của bạn: tạo bean, tiêm dependency, chạy `@PostConstruct`, bọc proxy AOP.",
        "Trong Spring: bạn khai báo `OrderService(OrderRepository repo)`, container chọn implementation và tiêm vào. Vì vậy `@Autowired` trên constructor là DIP + DI + IoC cùng làm việc. Lưu ý: không cần tạo interface cho **mọi** service khi chỉ có một implementation và không có nhu cầu thay thế (YAGNI).",
        "Vì sao nhiều dự án vẫn có cặp `OrderService` + `OrderServiceImpl`? Đó là thói quen từ Spring 1.x, khi proxy cho `@Transactional` và AOP dùng **JDK dynamic proxy**, thứ chỉ proxy được qua interface. Nay Spring Boot mặc định dùng **CGLIB**, proxy thẳng class thường (xem bài Transaction proxy), nên interface chỉ có một implementation không còn mang lại gì. Tách interface khi có implementation thứ hai thật (ví dụ in-memory và database), hoặc khi cần ranh giới giữa hai module, hai team.",
      ],
      trap: {
      title: "Interface cho mọi service",
      text: "Chỉ có một implementation và không ai thay thì interface chỉ tăng số file (YAGNI). Dùng khi cần thay thế, mock, hoặc có nhiều implementation.",
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
    },
    {
      id: "playbook",
      title: "Bảng nhớ và các bẫy khi phỏng vấn",
      scene: "playbook",
      intro: [
        "Bảng dưới gom 5 nguyên tắc cùng DRY, KISS, YAGNI. Bấm từng dòng để xem câu nên nói ra miệng. Người phỏng vấn senior thường không hỏi \"SOLID là gì\" mà hỏi **\"khi nào bạn không áp dụng nó?\"**.",
        "Ba bẫy hay gặp: (1) **một interface cho mọi service**: chỉ có một implementation và không ai thay thì thêm interface chỉ tăng số file (YAGNI). (2) **Tách SRP quá nhỏ** tới mức một thao tác nghiệp vụ trải ra 8 class: khó đọc hơn lợi ích. (3) **DRY máy móc**: hai đoạn code giống nhau chỉ vì **tình cờ** (khác lý do thay đổi) thì để lặp còn hơn gộp rồi vướng nhau.",
        "Câu hay gặp: **\"Nếu sau này cần hỗ trợ X thì sao?\"**. Câu trả lời tốt: \"Em thiết kế interface để thêm X sau này không phải sửa code cũ, nhưng chưa hiện thực X vì nó chưa nằm trong yêu cầu. Như vậy code gọn và thiết kế tập trung.\" Đó là OCP và YAGNI cùng lúc.",
        "Người phỏng vấn chấm **cách cân nhắc**, không chấm việc thuộc định nghĩa. Ứng viên junior thường liệt kê ngay `IOrderService`, `IOrderRepository`, `IOrderValidator` cùng một factory: bị coi là over-engineering. Ứng viên senior nói: \"`Order` tự giữ quy tắc của các dòng hàng. Em tách `OrderRepository` vì nơi lưu trữ có thể đổi, nhưng chưa tạo interface cho `OrderService` khi chưa có implementation thứ hai hay nhu cầu mock.\"",
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
  ],
  cards: [
    { q: "SOLID gồm những nguyên tắc nào?", a: "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Đây là kinh nghiệm thiết kế, không phải luật bắt buộc." },
    { q: "SRP: làm sao biết class có nhiều hơn một trách nhiệm?", a: "Hỏi \"ai sẽ yêu cầu sửa class này?\". Nếu có nhiều hơn một bên (kế toán, marketing, DBA) thì có nhiều lý do thay đổi và nên tách." },
    { q: "OCP: dấu hiệu vi phạm và cách sửa?", a: "Chuỗi `if / else` hoặc `switch` theo loại cứ dài thêm. Sửa bằng Strategy hay polymorphism: thêm class mới mà không sửa code cũ." },
    { q: "LSP: dấu hiệu vi phạm?", a: "Override ném `UnsupportedOperationException`, hoặc phải `instanceof` và ép kiểu trước khi dùng. Class con không thay được class cha." },
    { q: "ISP: dấu hiệu vi phạm và cách sửa?", a: "Có method chỉ để ném `UnsupportedOperationException`. Tách interface theo vai trò client cần, nhưng không tách mỗi method một interface." },
    { q: "DIP, DI, IoC khác nhau thế nào?", a: "DIP là nguyên tắc: phụ thuộc abstraction. DI là kỹ thuật tiêm dependency để đạt DIP. IoC là việc framework như Spring nắm quyền tạo và nối object." },
    { q: "LSP đầy đủ gồm những quy tắc nào?", a: "Đầu vào không chặt hơn, kết quả không yếu hơn, giữ invariant của cha, không thêm thay đổi trạng thái mà cha không cho (history constraint), checked exception hẹp hơn hoặc bằng, kiểu trả về hẹp hơn hoặc bằng. Compiler chỉ kiểm tra hai quy tắc cuối." },
    { q: "Vì sao có thói quen OrderService + OrderServiceImpl?", a: "Spring 1.x dùng JDK dynamic proxy, chỉ proxy được qua interface. Nay Boot mặc định CGLIB, proxy được class thường, nên interface một implementation không còn cần. Tách khi có implementation thứ hai hoặc ranh giới module." },
    { q: "\"Nếu sau này cần X thì sao?\" trả lời thế nào?", a: "Thiết kế để thêm X không phải sửa code cũ (OCP), nhưng chưa làm X vì chưa có trong yêu cầu (YAGNI)." },
    { q: "Khi nào không nên áp dụng SOLID máy móc?", a: "Khi chưa có nhu cầu thật: interface cho mọi service, tách SRP quá nhỏ, hay DRY cho code chỉ trùng ngẫu nhiên. Áp dụng khi thấy dấu hiệu, chờ tới lần thứ ba." },
  ],
  modelAnswer:
    "SOLID là 5 nguyên tắc thiết kế hướng đối tượng. SRP: một class chỉ có một lý do thay đổi, tức một bên yêu cầu sửa nó, ví dụ không để tính giá, gửi email và lưu DB trong một class. OCP: thêm tính năng bằng class mới thay vì sửa code đang chạy, thường dùng Strategy thay cho chuỗi if/else, nhưng em chờ tới lần thứ ba mới tách. LSP: class con phải thay được class cha, nên override ném UnsupportedOperationException là dấu hiệu sai. ISP: chia interface nhỏ theo vai trò client cần, tránh ép phụ thuộc method không dùng. DIP: service phụ thuộc interface, nhận qua constructor, nên đổi database hay viết unit test không sửa service; DIP là nguyên tắc, DI là kỹ thuật, IoC là việc Spring giữ quyền tạo object. Em coi đây là kinh nghiệm chứ không phải luật, và tránh over-engineering như interface cho mọi class.",
};
