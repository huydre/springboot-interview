import timeline from "../timelines/solid.json";
import type { Lesson, Scene } from "../types";

// Java snippets and outputs shown in the widgets were run on JDK 21. LSP here uses the read-only-list trap; the Square/Rectangle case is in lessons/oop.ts (Phần 11).
// Per-scene clips and the timeline are written by `video-kit/pipeline.py solid-video publish`, which also rewrites videoVersion.
export const solid: Lesson = {
  slug: "solid",
  crumb: "SOLID",
  videoDir: "/videos/solid",
  videoVersion: "e40153ce",
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
    },
    {
      id: "srp-limits",
      title: "S (tiếp): Khi nào cố ý không tách class",
      scene: "srp-limits",
      intro: [
        "Ba lý do chính đáng để giữ nhiều hành vi trong một class: **aggregate** (DDD) bảo vệ quy tắc của dữ liệu, **transaction** cần các bước đi cùng nhau, và **hiệu năng** ở đoạn code chạy rất nhiều lần.",
        "Quan trọng là bạn **biết** mình đang đánh đổi gì và nói rõ lý do.",
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
    {
      id: "ocp",
      title: "O: Open/Closed, thêm bằng class mới, không sửa code cũ",
      scene: "ocp",
      intro: [
        "**OCP**: code **mở cho mở rộng, đóng với sửa đổi**. Thêm tính năng bằng class mới, không mở code đang chạy tốt ra sửa.",
        "Giảm giá bằng `if / else` thì thêm `STUDENT` phải sửa hàm. Tách `interface Discount` thì chỉ thêm một class. Thử thêm `STUDENT` ở cả hai cách.",
      ],
      widget: "ocp",
      widgetTitle: "Thêm loại giảm giá mới",
      after: [
        "Dấu hiệu: chuỗi `if / else` hoặc `switch` theo loại cứ dài thêm. Cách sửa: **Strategy** hoặc polymorphism, nhưng theo **Rule of Three** tới lần thứ ba mới tách. Muốn chủ động chặn mở rộng thì dùng `sealed` interface (Java 17).",
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
    },
    {
      id: "lsp-rules",
      title: "L (tiếp): 6 quy tắc của lời hứa",
      scene: "lsp-rules",
      intro: [
        "Định nghĩa đầy đủ của Liskov và Wing có 6 quy tắc. **Bốn quy tắc về hành vi** (compiler không bắt): đầu vào không chặt hơn, kết quả không yếu hơn, giữ invariant của cha, và history constraint (cha bất biến thì con không thêm method đổi trạng thái). **Hai quy tắc compiler kiểm tra**: checked exception hẹp hơn hoặc bằng, kiểu trả về hẹp hơn.",
        "JDK cũng thoả hiệp: `unmodifiableList().add()` ném lỗi để khỏi nhân đôi cây interface. Kotlin tách `List` và `MutableList` ngay trong hệ thống kiểu.",
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
    {
      id: "isp",
      title: "I: Interface Segregation, interface nhỏ theo vai trò",
      scene: "isp",
      intro: [
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
        "**DIP**: nghiệp vụ và hạ tầng (database, email) đều nên phụ thuộc **abstraction**, không buộc vào chi tiết.",
        "Dấu hiệu: `new MySqlOrderRepository()` nằm trong `OrderService`. Sửa: nhận `OrderRepository` (interface) qua constructor.",
      ],
      widget: "dip",
      widgetTitle: "Đổi database và viết test",
      after: [
        "**DIP** là nguyên tắc. **DI** là kỹ thuật tiêm dependency để đạt DIP. **IoC** là việc Spring `ApplicationContext` nắm quyền tạo và nối object (Hollywood Principle: \"Don't call us, we'll call you\").",
      ],
      
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
      id: "dip-history",
      title: "D (tiếp): Vì sao có OrderServiceImpl?",
      scene: "dip-history",
      intro: [
        "Cặp `OrderService` + `OrderServiceImpl` là thói quen từ Spring 1.x, khi proxy của `@Transactional` dùng **JDK proxy** (chỉ proxy qua interface). Spring Boot nay mặc định **CGLIB**, proxy thẳng class thường (xem bài Transaction proxy).",
        "Chỉ tách interface khi có implementation thứ hai thật, cần mock, hoặc cần ranh giới giữa module.",
      ],
      trap: {
      title: "Interface cho mọi service",
      text: "Chỉ có một implementation và không ai thay thì interface chỉ tăng số file (YAGNI). Dùng khi cần thay thế, mock, hoặc có nhiều implementation.",
    },
      quiz: {
        question: "Vì sao nhiều dự án Spring cũ có `OrderServiceImpl` cho mọi service?",
        options: [
          "Vì JDK proxy chỉ proxy được qua interface",
          "Vì Java bắt buộc mỗi class có interface",
          "Vì CGLIB không hỗ trợ class",
          "Vì Lombok yêu cầu",
        ],
        answer: 0,
        explain: "Spring 1.x dùng JDK dynamic proxy cho AOP và transaction, nên bean phải có interface. Nay CGLIB proxy được class thường, nên interface một implementation không còn cần.",
      },
    },
    {
      id: "playbook",
      title: "Bảng nhớ và các bẫy khi phỏng vấn",
      scene: "playbook",
      intro: [
        "Bấm từng dòng để xem câu nên nói ra miệng. Người phỏng vấn senior thường hỏi **\"khi nào bạn không áp dụng nó?\"**",
        "Ba bẫy hay gặp: interface cho mọi service, tách SRP quá nhỏ, và DRY máy móc (hai đoạn giống nhau chỉ vì tình cờ thì để lặp còn hơn gộp).",
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
        "Người phỏng vấn chấm **cách bạn cân nhắc**. Junior liệt kê interface cho mọi thứ. Senior tách đúng chỗ: `Order` tự giữ quy tắc, `OrderRepository` tách vì nơi lưu có thể đổi, `OrderService` chưa cần interface.",
        "Khi được hỏi \"nếu sau này cần hỗ trợ X thì sao?\": thiết kế để thêm X không phải sửa code cũ (OCP), nhưng **chưa làm X** vì chưa có trong yêu cầu (YAGNI).",
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
    { q: "Vì sao có thói quen OrderService + OrderServiceImpl?", a: "Spring 1.x dùng JDK dynamic proxy, chỉ proxy được qua interface. Nay Boot mặc định CGLIB, proxy được class thường, nên interface một implementation không còn cần. Tách khi có implementation thứ hai hoặc ranh giới module." },
    { q: "\"Nếu sau này cần X thì sao?\" trả lời thế nào?", a: "Thiết kế để thêm X không phải sửa code cũ (OCP), nhưng chưa làm X vì chưa có trong yêu cầu (YAGNI)." },
    { q: "Khi nào không nên áp dụng SOLID máy móc?", a: "Khi chưa có nhu cầu thật: interface cho mọi service, tách SRP quá nhỏ, hay DRY cho code chỉ trùng ngẫu nhiên. Áp dụng khi thấy dấu hiệu, chờ tới lần thứ ba." },
  ],
  modelAnswer:
    "SOLID là 5 nguyên tắc thiết kế hướng đối tượng. SRP: một class chỉ có một lý do thay đổi, tức một bên yêu cầu sửa nó, ví dụ không để tính giá, gửi email và lưu DB trong một class. OCP: thêm tính năng bằng class mới thay vì sửa code đang chạy, thường dùng Strategy thay cho chuỗi if/else, nhưng em chờ tới lần thứ ba mới tách. LSP: class con phải thay được class cha, nên override ném UnsupportedOperationException là dấu hiệu sai. ISP: chia interface nhỏ theo vai trò client cần, tránh ép phụ thuộc method không dùng. DIP: service phụ thuộc interface, nhận qua constructor, nên đổi database hay viết unit test không sửa service; DIP là nguyên tắc, DI là kỹ thuật, IoC là việc Spring giữ quyền tạo object. Em coi đây là kinh nghiệm chứ không phải luật, và tránh over-engineering như interface cho mọi class.",
};
