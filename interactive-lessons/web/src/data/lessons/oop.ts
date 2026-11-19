import timeline from "../timelines/oop.json";
import type { Lesson, Scene } from "../types";

export const oop: Lesson = {
  slug: "oop",
  crumb: "OOP",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/oop-4-tinh-chat",
  videoVersion: "9b8384c3",
  scenes: timeline as Scene[],
  title: "OOP: 4 tính chất và các câu hỏi xoáy",
  subtitle:
    "Encapsulation, Inheritance, Polymorphism, Abstraction: hiểu bản chất thay vì học thuộc, kèm các bẫy phỏng vấn hay gặp như overloading vs overriding, interface vs abstract class và pass-by-value.",
  openingQuiz: {
    question:
      "Người phỏng vấn hỏi: \"4 tính chất OOP là gì?\". Câu trả lời nào khiến bạn ít bị hỏi xoáy nhất?",
    options: [
      "Đọc đúng tên 4 tính chất theo thứ tự trong sách",
      "Nêu tên, giải thích mỗi tính chất giải quyết vấn đề gì, kèm một ví dụ code trong dự án",
      "Nói OOP là lập trình với class và object",
      "Liệt kê thêm SOLID cho dài",
    ],
    answer: 1,
    explain:
      "Người phỏng vấn không chấm việc thuộc tên. Họ muốn biết bạn hiểu mỗi tính chất giải quyết vấn đề gì. Khung trả lời an toàn: Là gì → Hoạt động thế nào → Ví dụ trong dự án.",
  },
  roadmap: [
    "Chặng 1: Encapsulation và Inheritance. Bảo vệ dữ liệu, và vì sao kế thừa có thể làm hỏng logic một cách âm thầm.",
    "Chặng 2: Polymorphism và Abstraction. JVM chọn method thế nào, và interface giúp code mở rộng mà không phải sửa.",
    "Chặng 3: Hai câu bẫy kinh điển. Interface vs abstract class, và Java truyền tham trị hay tham chiếu.",
  ],
  sections: [
  {
    id: "encapsulation",
    title: "Phần 1: Encapsulation, bảo vệ quy tắc của dữ liệu",
    scene: "enc",
    intro: [
      "Encapsulation (đóng gói) là giấu dữ liệu bên trong object và chỉ cho thay đổi qua các method có kiểm tra quy tắc. Mục tiêu không phải là \"giấu cho đẹp\", mà là để object luôn ở trạng thái hợp lệ.",
      "Ví dụ `BankAccount`: nếu `balance` là public, bất kỳ dòng code nào trong hệ thống cũng có thể gán số dư âm. Khi `balance` là private và chỉ đổi qua `deposit()` / `withdraw()`, quy tắc \"số dư không âm\" được bảo vệ ở đúng một chỗ.",
      "Hãy thử cả hai chế độ bên dưới và xem quy tắc bị phá như thế nào.",
    ],
    widget: "bank",
    widgetTitle: "Thử nghiệm: public field vs private + method",
    after: [
      "Bẫy hay gặp: nhiều người nghĩ đóng gói là sinh getter/setter cho mọi field. Một `setBalance()` public cũng phá quy tắc y như field public. Chỉ mở ra những hành động có ý nghĩa nghiệp vụ.",
    ],
    quiz: {
      question: "Class có field private nhưng có setter public cho mọi field. Nó đã được đóng gói tốt chưa?",
      options: [
        "Rồi, vì field đã private",
        "Chưa, vì setter cho phép gán bất kỳ giá trị nào, quy tắc vẫn có thể bị phá",
        "Rồi, vì Java bắt buộc phải có setter",
        "Chưa, vì phải dùng protected thay cho private",
      ],
      answer: 1,
      explain:
        "Đóng gói là bảo vệ quy tắc (invariant). Setter không kiểm tra gì thì chẳng khác field public. Hãy mở hành động nghiệp vụ như deposit/withdraw, mỗi hành động tự kiểm tra.",
    },
  },
  {
    id: "inheritance-basics",
    title: "Phần 2: Inheritance, kế thừa là gì",
    intro: [
      "Giả sử bạn có class `Animal` (động vật) biết `eat()` (ăn). Giờ cần thêm `Dog` (chó): cũng biết ăn, nhưng thêm được `bark()` (sủa). Thay vì chép lại `eat()` sang `Dog`, bạn viết `class Dog extends Animal`. Từ khoá `extends` nghĩa là: `Dog` tự có sẵn mọi thứ của `Animal`, bạn chỉ viết thêm phần riêng của chó. Đó là **kế thừa** (inheritance). `Animal` gọi là class cha, `Dog` gọi là class con.",
      "Class con còn có thể **viết đè** (override) một method của cha để làm khác đi: `Animal.speak()` in ba chấm, còn `Dog` viết đè `speak()` để in \"Gâu\". Trong code của con, `super.speak()` nghĩa là \"gọi lại bản của cha\". Ghi chú `@Override` để trình biên dịch kiểm tra giúp bạn không viết sai tên method.",
      "Trước khi kế thừa, hãy hỏi: câu \"Dog **là một** Animal\" có đúng không? Đúng thì kế thừa hợp lý (quan hệ is-a). Còn \"Car **có một** Engine\" là quan hệ has-a: lúc đó `Car` chỉ cần giữ một field kiểu `Engine`, không kế thừa. Quy tắc này sẽ quan trọng ở phần tiếp theo.",
    ],
    widget: "inherit-basics",
    widgetTitle: "Gọi method và xem code của ai chạy",
    quiz: {
      question: "Class `Cat extends Animal` không viết thêm gì trong thân class. Gọi `new Cat().eat()` thì sao?",
      options: [
        "Lỗi biên dịch, vì Cat chưa tự viết eat()",
        "Chạy được, dùng eat() mà Cat thừa hưởng từ Animal",
        "Chạy được nhưng không in gì, vì Cat chưa có eat()",
        "Chạy được, nhưng phải viết @Override trước",
      ],
      answer: 1,
      explain: "Class con thừa hưởng mọi method của class cha. Chỉ cần viết lại (override) khi muốn làm khác cha.",
    },
  },
  {
    id: "inheritance",
    title: "Phần 3: Cái giá của kế thừa, và vì sao nên chọn composition",
    scene: "inh",
    intro: [
            "Kế thừa rất tiện, nhưng có một cái giá: class con **phụ thuộc vào cách class cha làm việc bên trong**, thứ mà tác giả class cha không hứa gì với bạn và có thể đổi bất cứ lúc nào.",
      "Ví dụ kinh điển (sách Effective Java): bạn muốn một `HashSet` biết đếm đã thêm bao nhiêu phần tử. Bạn viết class con `InstrumentedHashSet`, viết đè `add()` và `addAll()` để cộng vào biến `addCount`. Bạn gọi `addAll` với 3 phần tử và mong `addCount` là 3. Hãy đọc code bên dưới, rồi bấm từng bước để xem kết quả thật. Đoán trước xem ra mấy.",
    ],
    widget: "inherit",
    widgetTitle: "Chạy từng bước: addAll(\"a\", \"b\", \"c\")",
    after: [
      "Kết quả là **6**, không phải 3. Lý do: `HashSet.addAll()` của class cha, bên trong, gọi `add()` cho từng phần tử. Nhưng `add()` đã bị bạn viết đè, nên Java chạy bản của bạn và cộng thêm 1 lần nữa. Tổng cộng 3 (từ `addAll`) cộng 3 (từ ba lần `add`) là 6. Class cha không hề ghi ở đâu rằng `addAll` gọi `add`, nên bạn không thể biết trước.",
      "**Composition** (ghép) tránh được chuyện này: thay vì `extends HashSet`, class của bạn **giữ một `HashSet` trong field** rồi chỉ nhờ nó làm việc. Set bên trong không biết gì về class của bạn, nên không gọi ngược lại `add()` của bạn, và kết quả đúng 3. Quy tắc nhớ: **có thể coi \"là một\" thì mới kế thừa, còn lại thì giữ trong field**. Trong Spring, inject dependency chính là composition.",
    ],
    quiz: {
      question: "Vì sao InstrumentedHashSet đếm ra 6 thay vì 3?",
      options: [
        "Vì HashSet cho phép phần tử trùng",
        "Vì addAll() của lớp cha gọi lại add() đã bị override, nên mỗi phần tử bị đếm thêm một lần",
        "Vì List.of tạo ra 6 phần tử",
        "Vì addCount không được khai báo volatile",
      ],
      answer: 1,
      explain:
        "Class con phụ thuộc vào chi tiết hiện thực của class cha (addAll gọi add). Đó là lý do nên ưu tiên composition over inheritance.",
    },
  },
  {
    id: "polymorphism-basics",
    title: "Phần 4: Polymorphism, một lời gọi, nhiều cách chạy",
    intro: [
      "Từ phần trước ta biết `Dog extends Animal`. Một điều thú vị: bạn được phép viết `Animal a = new Dog();`. Biến `a` có **kiểu khai báo** là `Animal`, nhưng **object thật** nó đang trỏ tới là một `Dog`. Cứ nhớ hai khái niệm này: *kiểu của biến* và *object thật bên dưới*.",
      "Giờ gọi `a.speak()`: Java sẽ chạy `speak()` của ai? Câu trả lời: của **object thật** (`Dog`), không phải của kiểu biến. Nhờ vậy bạn gom nhiều con vật vào một danh sách kiểu `Animal`, viết một vòng lặp `for` gọi `speak()`, và mỗi con tự kêu theo kiểu của nó. Đây gọi là **đa hình** (polymorphism): cùng một lời gọi, hành vi khác nhau tuỳ object. Cơ chế này chính là **overriding** mà bạn vừa học: class con viết đè method của cha.",
      "Lợi ích thực tế: thêm một con `Bird` mới, vòng lặp cũ không phải sửa dòng nào. Trong Spring, bạn inject một interface và chạy code của implementation thật theo đúng cách này.",
    ],
    widget: "poly-basics",
    widgetTitle: "Thêm con vật và chạy vòng lặp",
    quiz: {
      question: "Có `Animal a = new Cat(); a.speak();` và cả hai class đều có `speak()`. Chạy `speak()` của class nào?",
      options: [
        "Của Animal, vì biến a có kiểu khai báo là Animal",
        "Của Cat, vì Java chạy method của object thật lúc chạy chương trình",
        "Của cả hai class, theo thứ tự cha rồi con",
        "Lỗi biên dịch, vì Cat không thể gán vào biến Animal",
      ],
      answer: 1,
      explain: "Gán Cat vào biến Animal là hợp lệ vì Cat là một Animal. Khi gọi method được viết đè, Java nhìn object thật (Cat).",
    },
  },
  {
    id: "override-vs-overload",
    title: "Phần 5: Overriding và Overloading, khác nhau thế nào",
    intro: [
      "Hai từ nghe giống nhau nhưng là hai chuyện khác hẳn. **Overriding** (ghi đè): class **con** viết lại một method của class **cha**, giữ **y nguyên tên và tham số**. Đây là phần bạn vừa thấy với `speak()`. **Overloading** (nạp chồng): trong **cùng một class**, có nhiều method **cùng tên nhưng khác tham số**, ví dụ `print(int x)` và `print(String s)`. Gọi `print(1)` thì chạy bản `int`, gọi `print(\"hi\")` thì chạy bản `String`.",
      "Mẹo nhớ: **Override = con ghi đè cha, cùng tên cùng tham số**. **Overload = nạp thêm bản mới, cùng tên khác tham số**. Overriding cần kế thừa, overloading thì không.",
      "Một lỗi hay gặp: bạn tưởng mình override nhưng lỡ đổi tham số. Ví dụ `Animal` có `speak()`, `Parrot` viết `speak(String word)`. Đây là **overloading**, không phải override, nên `Animal p = new Parrot(); p.speak();` vẫn in \"Animal: ...\" (đã chạy thật trên JDK 21). Hãy luôn ghi `@Override`: compiler sẽ báo lỗi ngay nếu bạn không thật sự override.",
    ],
    widget: "overload-drill",
    widgetTitle: "Đây là Overriding hay Overloading?",
    quiz: {
      question: "Class nào dưới đây dùng overloading?",
      options: [
        "Dog viết lại speak() của Animal bằng cùng tên và cùng tham số",
        "Một class có hai method print(int x) và print(String s)",
        "Cat có @Override trên method speak()",
        "Bird extends Animal và viết đè speak()",
      ],
      answer: 1,
      explain: "Overloading là nhiều method cùng tên, khác tham số, trong cùng một class. Ba đáp án còn lại đều là override.",
    },
  },
  {
    id: "polymorphism",
    title: "Phần 6: Câu bẫy phỏng vấn: JVM chọn method lúc nào?",
    scene: "poly",
    intro: [
      "Câu hỏi hay gặp: \"overriding khác overloading ở chỗ nào?\". Cách trả lời gọn: **chọn lúc nào, dựa vào cái gì**. Overriding được chọn lúc **chạy chương trình** (runtime), dựa vào **object thật**. Overloading được chọn lúc **biên dịch** (compile time), dựa vào **kiểu khai báo** của biến truyền vào.",
      "Đổi kiểu khai báo và object thật bên dưới trong widget để thấy rõ sự khác nhau. Chú ý phần Overloading: dù object thật luôn là `\"hello\"`, compiler chỉ nhìn kiểu khai báo.",
    ],
    widget: "dispatch",
    widgetTitle: "Máy chọn method",
    quiz: {
      question: "Object o = \"hello\"; gọi print(o) khi có print(Object) và print(String). Kết quả?",
      options: ["print(String), vì object thật là String", "print(Object), vì overload được chọn theo kiểu khai báo lúc compile", "Lỗi biên dịch vì mơ hồ", "Tuỳ JVM"],
      answer: 1,
      explain:
        "Overload resolution diễn ra lúc compile và chỉ nhìn kiểu khai báo (Object). Kết quả đã chạy thật trên JDK 21: print(Object).",
    },
  },
  {
    id: "abstraction",
    title: "Phần 7: Abstraction, cắm thêm cổng thanh toán mà không sửa code",
    scene: "abs",
    intro: [
      "Abstraction (trừu tượng) chỉ cho người dùng thấy object làm được gì và giấu đi làm thế nào. `OrderService` chỉ biết interface `PaymentGateway` với một method `charge()`.",
      "Chọn cổng thanh toán bên dưới: code của `OrderService` không đổi một dòng nào. Thêm ZaloPay chỉ là thêm một class mới (Open/Closed principle).",
    ],
    widget: "gateway",
    widgetTitle: "Đổi implementation, giữ nguyên OrderService",
    after: [
      "Phân biệt nhanh: Abstraction giấu độ phức tạp (người dùng thấy gì). Encapsulation giấu dữ liệu (ai được sửa gì, theo quy tắc nào). Hai thứ bổ trợ nhau.",
    ],
    quiz: {
      question: "Trong Spring, đâu là ví dụ rõ nhất của abstraction?",
      options: [
        "Đánh dấu field là private",
        "Service inject một interface (PaymentGateway), Spring cung cấp implementation cụ thể",
        "Dùng Lombok @Getter",
        "Kế thừa từ một BaseEntity",
      ],
      answer: 1,
      explain: "Service phụ thuộc vào hợp đồng (interface), không phụ thuộc chi tiết. Đổi implementation không phải sửa service.",
    },
  },
  {
    id: "interface-vs-abstract",
    title: "Phần 8: Câu xoáy: Interface vs Abstract class",
    scene: "ivsa",
    intro: [
      "Interface là hợp đồng: mô tả class làm được gì, một class implement được nhiều interface, interface không có state hay constructor. Abstract class là bộ khung chung cho một họ class: có field, constructor, và chỉ được extends một.",
      "Quy tắc thực tế: mặc định chọn interface. Khi nhiều implementation trùng code và state, thêm abstract class implement interface đó, giống JDK: `List` → `AbstractList` → `ArrayList`. Thử phân loại các đặc điểm dưới đây.",
    ],
    widget: "classify",
    widgetTitle: "Phân loại: đặc điểm này thuộc về ai?",
    quiz: {
      question: "Java 8 đã có default method. Interface còn khác abstract class ở điểm cốt lõi nào?",
      options: [
        "Không còn khác gì",
        "Interface không có state (field instance) và constructor; một class implement được nhiều interface",
        "Interface chạy nhanh hơn",
        "Abstract class không có method abstract",
      ],
      answer: 1,
      explain: "Default method chỉ thêm hành vi mặc định. Interface vẫn không giữ state, không có constructor, và hỗ trợ đa implement.",
    },
  },
  {
    id: "pass-by-value",
    title: "Phần 9: Câu bẫy cuối: Java truyền tham trị hay tham chiếu?",
    scene: "pbv",
    intro: [
      "Java luôn pass-by-value. Với object, giá trị được copy là địa chỉ (reference), nên method nhận được một biến mới cùng trỏ vào object cũ.",
      "Hệ quả: gán lại tham số không ảnh hưởng biến bên ngoài, nhưng sửa field qua tham số thì object thật bị đổi. Chạy từng lệnh để xem bộ nhớ thay đổi.",
    ],
    widget: "memory",
    widgetTitle: "Bộ nhớ: stack và heap",
    quiz: {
      question: "Sau reassign(d) với `d = new Dog(\"Lu\")` bên trong method, d.name ở main() là gì?",
      options: ["\"Lu\"", "\"Milu\"", "null", "Lỗi biên dịch"],
      answer: 1,
      explain:
        "Tham số là bản copy của địa chỉ. Gán lại bản copy chỉ đổi biến cục bộ trong method; biến ở main() vẫn trỏ Dog \"Milu\". Đã chạy thật: after reassign: Milu.",
    },
  },
],
  modelAnswer:
    "OOP có 4 tính chất. Encapsulation là giấu dữ liệu và chỉ cho thay đổi qua method có kiểm tra quy tắc, ví dụ BankAccount chỉ có deposit/withdraw nên số dư không bao giờ âm. Abstraction là chỉ lộ ra object làm được gì, như interface PaymentGateway chỉ có charge(). Inheritance là tái sử dụng code theo quan hệ is-a, nhưng em ưu tiên composition vì kế thừa ràng buộc chặt. Polymorphism là cùng lời gọi nhưng hành vi khác nhau tuỳ object thật: overriding chọn lúc runtime, overloading chọn lúc compile. Ở dự án em, NotificationService gọi send() trên danh sách NotificationSender, thêm kênh Zalo chỉ cần thêm một class.",
};
