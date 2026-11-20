import timeline from "../timelines/oop.json";
import type { Lesson, Scene } from "../types";

export const oop: Lesson = {
  slug: "oop",
  crumb: "OOP",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/oop-4-tinh-chat",
  videoVersion: "1c56c32f",
  scenes: timeline as Scene[],
  title: "OOP: 4 tính chất và các câu hỏi xoáy",
  subtitle:
    "Encapsulation, Inheritance, Polymorphism, Abstraction: hiểu bản chất thay vì học thuộc, kèm các bẫy phỏng vấn hay gặp như overloading vs overriding, interface vs abstract class và pass-by-value, rồi nâng lên mức senior với Tell Don't Ask, Liskov và Strategy.",
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
    "Chặng 4: Câu hỏi senior. Tell, Don't Ask, nguyên tắc Liskov, Strategy, một hệ thống thuê xe hoàn chỉnh và bảng nhớ để nói ra miệng.",
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
    trap: {
      title: "Setter cho mọi field không phải đóng gói",
      text: "Field private nhưng có `setBalance()` public thì ai cũng gán được số dư âm. Chỉ mở hành động có ý nghĩa nghiệp vụ như `deposit()` và `withdraw()`.",
    },
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
    scene: "ibas",
    intro: [
      "Giả sử bạn có class `Animal` (động vật) biết `eat()` (ăn). Giờ cần thêm `Dog` (chó): cũng biết ăn, nhưng thêm được `bark()` (sủa). Thay vì chép lại `eat()` sang `Dog`, bạn viết `class Dog extends Animal`. Từ khoá `extends` nghĩa là: `Dog` tự có sẵn mọi thứ của `Animal`, bạn chỉ viết thêm phần riêng của chó. Đó là **kế thừa** (inheritance). `Animal` gọi là class cha, `Dog` gọi là class con.",
      "Class con còn có thể **viết đè** (override) một method của cha để làm khác đi: `Animal.speak()` in ba chấm, còn `Dog` viết đè `speak()` để in \"Gâu\". Trong code của con, `super.speak()` nghĩa là \"gọi lại bản của cha\". Ghi chú `@Override` để trình biên dịch kiểm tra giúp bạn không viết sai tên method.",
      "Trước khi kế thừa, hãy hỏi: câu \"Dog **là một** Animal\" có đúng không? Đúng thì kế thừa hợp lý (quan hệ is-a). Còn \"Car **có một** Engine\" là quan hệ has-a: lúc đó `Car` chỉ cần giữ một field kiểu `Engine`, không kế thừa. Quy tắc này sẽ quan trọng ở phần tiếp theo.",
    ],
    widget: "inherit-basics",
    widgetTitle: "Gọi method và xem code của ai chạy",
    trap: {
      title: "Kế thừa chỉ vì muốn dùng lại code",
      text: "Hỏi trước: \"A có phải là một B không?\". `Car` không phải là một `Engine`, `Car` có một `Engine`, nên giữ trong field thay vì `extends`.",
    },
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
      "Thêm một lợi ích: kế thừa bị **chốt cứng lúc compile** (class con luôn là `extends HashSet`), còn composition **đổi được lúc chạy**: truyền vào một object khác qua constructor hay setter là hành vi đổi theo, không cần viết class mới.",
    ],
    trap: {
      title: "Class con phụ thuộc cả cách làm bên trong của class cha",
      text: "Class cha có thể đổi cách hiện thực bất cứ lúc nào mà không báo, như `HashSet.addAll()` gọi lại `add()`. Muốn tái sử dụng thì giữ một đối tượng trong field (composition).",
    },
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
    scene: "pbas",
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
    scene: "ovo",
    intro: [
      "Hai từ nghe giống nhau nhưng là hai chuyện khác hẳn. **Overriding** (ghi đè): class **con** viết lại một method của class **cha**, giữ **y nguyên tên và tham số**. Đây là phần bạn vừa thấy với `speak()`. **Overloading** (nạp chồng): trong **cùng một class**, có nhiều method **cùng tên nhưng khác tham số**, ví dụ `print(int x)` và `print(String s)`. Gọi `print(1)` thì chạy bản `int`, gọi `print(\"hi\")` thì chạy bản `String`.",
      "Mẹo nhớ: **Override = con ghi đè cha, cùng tên cùng tham số**. **Overload = nạp thêm bản mới, cùng tên khác tham số**. Overriding cần kế thừa, overloading thì không.",
      "Một lỗi hay gặp: bạn tưởng mình override nhưng lỡ đổi tham số. Ví dụ `Animal` có `speak()`, `Parrot` viết `speak(String word)`. Đây là **overloading**, không phải override, nên `Animal p = new Parrot(); p.speak();` vẫn in \"Animal: ...\" (đã chạy thật trên JDK 21). Hãy luôn ghi `@Override`: compiler sẽ báo lỗi ngay nếu bạn không thật sự override.",
    ],
    widget: "overload-drill",
    widgetTitle: "Đây là Overriding hay Overloading?",
    trap: {
      title: "Tưởng override nhưng lại đổi tham số",
      text: "`Parrot.speak(String)` là overload, không phải override, nên `Animal p = new Parrot(); p.speak();` vẫn in \"Animal: ...\". Luôn ghi `@Override` để compiler báo lỗi.",
    },
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
    trap: {
      title: "Overload chọn lúc compile, theo kiểu khai báo",
      text: "`Object o = \"hello\"; print(o);` gọi `print(Object)` chứ không phải `print(String)`, vì compiler chỉ nhìn kiểu khai báo. Override mới chọn lúc chạy theo object thật.",
    },
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
      "Hãy nghĩ tới **ổ cắm điện**. Bạn cắm quạt, tivi hay sạc điện thoại vào cùng một ổ. Ổ cắm không cần biết thiết bị bên trong chạy thế nào, chỉ cần đúng chuẩn chân cắm. **Abstraction** (trừu tượng hoá) cũng vậy: chỉ nói một thứ **làm được gì** (chuẩn), và giấu đi **làm thế nào**.",
      "Trong Java, \"chuẩn\" đó viết bằng **interface**: `interface PaymentGateway { boolean charge(long amount); }` nghĩa là \"ai muốn làm cổng thanh toán thì phải có hàm `charge`\". Một class tuyên bố đáp ứng chuẩn bằng `implements`: `class MomoGateway implements PaymentGateway` nghĩa là \"tôi theo chuẩn đó, và đây là cách tôi làm\". `MomoGateway`, `ZaloPayGateway` mỗi cái tự viết `charge()` theo cách riêng.",
      "`OrderService` chỉ giữ một biến kiểu `PaymentGateway` (giống Phần 4: kiểu khai báo là interface, object thật là MoMo hay ZaloPay) và gọi `gateway.charge(...)`. Nó không biết, cũng không cần biết đang dùng cổng nào. Chọn cổng bên dưới: code của `OrderService` không đổi một dòng. Thêm ZaloPay chỉ là thêm một class mới (Open/Closed principle).",
    ],
    widget: "gateway",
    widgetTitle: "Đổi implementation, giữ nguyên OrderService",
    after: [
      "Phân biệt nhanh: Abstraction giấu độ phức tạp (người dùng thấy gì). Encapsulation giấu dữ liệu (ai được sửa gì, theo quy tắc nào). Hai thứ bổ trợ nhau.",
    ],
    trap: {
      title: "Nhầm Abstraction với Encapsulation",
      text: "Abstraction giấu độ phức tạp (người dùng thấy gì), Encapsulation giấu dữ liệu và bảo vệ quy tắc (ai được sửa gì). Hai thứ bổ trợ nhau nhưng không thay thế nhau.",
    },
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
      "Cả hai đều là cách nói \"class con phải có những method này\". Khác nhau ở chỗ chúng **được phép chứa gì**.",
      "**Abstract class** là class \"dở dang\": không `new` trực tiếp được (compiler báo \"is abstract; cannot be instantiated\"). Nó có thể có **field, constructor, method đã có code** để các class con dùng chung, cộng với **method abstract** (chưa có thân, con bắt buộc viết). Ví dụ `abstract class Animal` giữ `name`, có `describe()` dùng chung và `abstract String sound()` để con tự quyết. Một class chỉ `extends` được **một** abstract class.",
      "**Interface** là hợp đồng thuần: mô tả class làm được gì, **không có field instance hay constructor** (chỉ có hằng số và method `default`). Nhưng một class `implements` được **nhiều** interface: `Duck extends Animal implements Flyable, Swimmable`. Chạy thật trên JDK 21: `Duck says quack`, rồi `Duck flies`, `Duck swims`.",
      "Quy tắc thực tế: **mặc định chọn interface**. Khi nhiều implementation trùng code và state, thêm abstract class implement interface đó, giống JDK: `List` → `AbstractList` → `ArrayList`. Thử phân loại các đặc điểm bên dưới.",
    ],
    widget: "classify",
    widgetTitle: "Phân loại: đặc điểm này thuộc về ai?",
    trap: {
      title: "Nói interface không có code từ Java 8",
      text: "Interface có `default` method từ Java 8, nhưng vẫn không có field instance (state) và constructor, và một class implement được nhiều interface.",
    },
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
      "Câu hỏi: khi gọi một method, Java đưa cho method cái gì, **bản gốc** hay **bản sao**? Trả lời: luôn luôn là **bản sao**. Đó là **pass-by-value** (truyền tham trị).",
      "Với số, dễ hiểu: `int n = 5; inc(n);` trong đó `inc` làm `x++`. Chạy thật: `n` vẫn là 5, vì `inc` chỉ tăng bản sao.",
      "Với object thì dễ nhầm hơn. Biến `Dog d` **không chứa con chó**, nó chứa **địa chỉ** của con chó trong heap, như một tờ giấy ghi địa chỉ nhà. Gọi `rename(d)` là **photocopy tờ giấy** đưa cho method. Hai tờ giấy cùng chỉ một ngôi nhà, nên method sửa đồ trong nhà (`d.name = \"Lu\"`) thì bên ngoài cũng thấy. Nhưng nếu method xé tờ copy rồi viết địa chỉ mới (`d = new Dog(\"Lu\")`) thì tờ gốc vẫn chỉ nhà cũ.",
      "Chạy thật: sau `reassign(d)` thì `d.name` vẫn là `Milu`; sau `rename(d)` thì thành `Lu`. Bấm từng lệnh để xem stack (các biến) và heap (các object) thay đổi.",
    ],
    widget: "memory",
    widgetTitle: "Bộ nhớ: stack và heap",
    trap: {
      title: "Java truyền tham chiếu",
      text: "Java luôn truyền giá trị. Với object, giá trị được copy là địa chỉ, nên sửa field qua tham số đổi object thật, còn gán lại tham số (`d = new Dog()`) thì không ảnh hưởng biến bên ngoài.",
    },
    quiz: {
      question: "Sau reassign(d) với `d = new Dog(\"Lu\")` bên trong method, d.name ở main() là gì?",
      options: ["\"Lu\"", "\"Milu\"", "null", "Lỗi biên dịch"],
      answer: 1,
      explain:
        "Tham số là bản copy của địa chỉ. Gán lại bản copy chỉ đổi biến cục bộ trong method; biến ở main() vẫn trỏ Dog \"Milu\". Đã chạy thật: after reassign: Milu.",
    },
  },
  {
    id: "tell-dont-ask",
    title: "Phần 10: Tell, Don't Ask: để quy tắc nằm cùng dữ liệu",
    scene: "tda",
    intro: [
      "Quay lại `BankAccount` ở Phần 1. Có một cách viết trông rất \"đúng chuẩn\": `Account` chỉ có field private cùng getter và setter, còn logic nằm ở `PaymentService`: `if (a.getBalance() >= amount) a.setBalance(a.getBalance() - amount)`. Cách viết này gọi là **anemic domain model** (object thiếu máu: chỉ chứa dữ liệu, không có hành vi). Nó **hỏi** object lấy dữ liệu ra, rồi **tự quyết** thay object.",
      "Vấn đề lộ ra khi có người viết thêm `RefundJob` vài tháng sau. Họ gọi thẳng `setBalance(getBalance() - fee)` mà không biết phải kiểm tra số dư. Quy tắc \"số dư không âm\" đang nằm ở **mọi nơi dùng**, nên chỉ cần quên một nơi là hỏng. Hãy bấm thử cả hai kiểu bên dưới (đã chạy thật trên JDK 21).",
      "Nguyên tắc **Tell, Don't Ask** (bảo, đừng hỏi): đừng lấy dữ liệu của object ra để quyết định, hãy **bảo object làm** việc. `account.withdraw(500)` mang theo quy tắc, ai gọi cũng phải qua cửa kiểm tra đó. Đây là cách làm Encapsulation ở Phần 1 thành hiện thực, thay vì chỉ \"private cho đẹp\".",
    ],
    widget: "tell-ask",
    widgetTitle: "Cùng một Account, hai cách viết",
    after: [
      "Trả lời câu hỏi senior \"vì sao không sinh getter/setter cho mọi field?\": vì mỗi setter là một cửa không có người gác. Chỉ mở getter cho dữ liệu mà bên ngoài thật sự cần đọc, còn thay đổi thì dùng hành động có tên nghiệp vụ như `order.cancel(reason)`, `account.withdraw(amount)`.",
    ],
    trap: {
      title: "Rải quy tắc ở mọi nơi dùng object",
      text: "Quy tắc nằm ở service thì `RefundJob` viết sau dễ quên kiểm tra. Đưa quy tắc vào `Account.withdraw()` để chỉ có một cửa.",
    },
    quiz: {
      question: "RefundJob gọi `account.setBalance(account.getBalance() - fee)` và số dư thành -50. Cách sửa gốc rễ là gì?",
      options: [
        "Thêm `if` kiểm tra số dư vào RefundJob",
        "Bỏ setBalance, thêm `withdraw()` vào Account để tự kiểm tra, mọi nơi chỉ gọi withdraw",
        "Đổi balance sang kiểu `Long` cho an toàn",
        "Thêm `synchronized` vào setBalance",
      ],
      answer: 1,
      explain:
        "Thêm `if` vào từng nơi gọi chỉ vá một chỗ, người viết sau vẫn quên được. Đưa quy tắc vào Account thì chỉ có một cửa. Đã chạy thật: withdraw(500) ném IllegalStateException, số dư vẫn 100.",
    },
  },
  {
    id: "lsp-strategy",
    title: "Phần 11: Liskov và Strategy: khi nào kế thừa sai, và thay bằng gì",
    scene: "lsp",
    intro: [
      "Ở Phần 3 ta thấy kế thừa có thể làm hỏng logic của class cha. Có một quy tắc để kiểm tra trước khi `extends`: **nguyên tắc Liskov (LSP)**. Nói đơn giản: **ở đâu dùng class cha, thay bằng class con thì code vẫn phải đúng**. Chỉ \"giống nhau ngoài đời\" là chưa đủ.",
      "Ví dụ kinh điển: trong toán, hình vuông là hình chữ nhật, nên `Square extends Rectangle`. Nhưng `Rectangle` có `setWidth()` và `setHeight()` độc lập. `Square` buộc phải đổi cả hai cùng lúc. Code dùng `Rectangle` làm `r.setWidth(5); r.setHeight(4);` và mong diện tích 20, gặp `Square` thì ra 16. Chạy thật trên JDK 21 để thấy.",
      "Cách sửa: bỏ quan hệ kế thừa, cho cả hai cùng implement `interface Shape { int area(); }`. Không còn setter để ai làm sai ý nghĩa. Đa hình vẫn còn nguyên, chỉ không cần class cha. Từ Java 17 có thể viết gọn hơn: `sealed interface Shape permits Rectangle, Square`, mỗi hình là một `record` bất biến (`record Rectangle(int width, int height)`). Muốn \"đổi chiều rộng\" thì tạo object mới bằng `withWidth(7)`, nên không còn chuyện đổi một chiều làm chiều kia đổi theo. `switch` trên `Shape` còn được compiler kiểm tra đủ mọi trường hợp. Đã chạy trên JDK 21: `Rectangle(5, 4)` ra 20, `withWidth(7)` ra 28, `Square(4)` ra 16.",
      "Khi bạn muốn đổi **một phần hành vi** (cách tính phí giao hàng, cách giảm giá) đừng tạo lớp con `ExpressOrder`, `StandardOrder`. Hãy tách phần đó thành một interface (**Strategy**) rồi `Order` **giữ** nó trong field. Đây là đa hình bằng composition, đúng quy tắc ở Phần 3, và là cách Spring inject các bean.",
    ],
    widget: "lsp-strategy",
    widgetTitle: "Liskov và Strategy, chạy thật",
    trap: {
      title: "Đúng ngoài đời chưa chắc đúng trong code",
      text: "Hình vuông là hình chữ nhật trong toán, nhưng `Square extends Rectangle` làm `setWidth(5); setHeight(4)` ra diện tích 16. LSP xét hành vi, không xét quan hệ ngoài đời.",
    },
    quiz: {
      question: "Vì sao `Square extends Rectangle` vi phạm Liskov dù hình vuông là hình chữ nhật trong toán học?",
      options: [
        "Vì Square có ít field hơn Rectangle",
        "Vì Square không thể dùng thay Rectangle: sau setWidth(5), setHeight(4) diện tích ra 16 chứ không phải 20",
        "Vì Java không cho override setter",
        "Vì Square phải là abstract class",
      ],
      answer: 1,
      explain:
        "LSP xét hành vi, không xét quan hệ ngoài đời. Code đúng với Rectangle phải đúng với mọi lớp con. Square làm đổi chiều còn lại nên phá giả định đó.",
    },
  },
  {
    id: "rental-capstone",
    title: "Phần 12: Tổng hợp: hệ thống thuê xe",
    scene: "cap",
    intro: [
      "Giờ ghép các mảnh vào một hệ thống nhỏ: thuê xe. Mỗi tính chất làm đúng một việc.",
      "**Abstraction + Inheritance**: `abstract class Vehicle` giữ biển số chung, khai báo `abstract long dailyRate()`. **Polymorphism**: `Motorbike` trả 150.000, `Car` trả 700.000, code tính tiền chỉ gọi `vehicle.dailyRate()`. **Strategy**: giảm giá là interface `Discount` (không giảm, giảm 10% khi thuê từ 7 ngày), `Booking` giữ nó trong field thay vì có thêm lớp con. **Encapsulation**: `Booking` có field private, constructor từ chối `to` không sau `from`, và `cancel()` khiến `total()` ném lỗi, nên không có booking ở trạng thái vô nghĩa.",
      "Thử các tổ hợp bên dưới. Số liệu đã chạy thật: Motorbike 3 ngày = 450.000, Car 3 ngày = 2.100.000, Car 7 ngày giảm tuần = 4.410.000.",
    ],
    widget: "rental",
    widgetTitle: "Thuê xe: bốn tính chất trong một bài",
    trap: {
      title: "Thêm loại mới bằng nhánh if",
      text: "Thêm `Truck` bằng cách chèn `if (type == TRUCK)` vào `Booking.total()` là sửa code đang chạy. Thêm một class `Truck extends Vehicle` thì code cũ không đổi.",
    },
    quiz: {
      question: "Cần thêm loại xe `Truck` và một kiểu giảm giá mới. Cách nào ít phải sửa code cũ nhất?",
      options: [
        "Thêm nhánh `if (type == TRUCK)` vào Booking.total()",
        "Thêm class `Truck extends Vehicle` và một Discount mới, Booking và các code cũ không đổi",
        "Đổi Vehicle thành class cụ thể có field type",
        "Tạo `TruckBooking extends Booking`",
      ],
      answer: 1,
      explain:
        "Đây là kết quả của abstraction và polymorphism: thêm kiểu mới bằng class mới, không sửa code đã chạy tốt (Open/Closed).",
    },
  },
  {
    id: "oop-cheatsheet",
    title: "Phần 13: Bảng nhớ cho buổi phỏng vấn",
    scene: "outro",
    intro: [
      "Bảy ý quan trọng nhất của cả bài, mỗi ý kèm một câu nên nói ra miệng. Bấm vào từng dòng để xem. Khung trả lời chung: **Là gì, giải quyết vấn đề gì, ví dụ trong dự án**. Người phỏng vấn thường hỏi xoáy ngay sau câu đầu, nên hãy chuẩn bị sẵn ví dụ của chính bạn.",
    ],
    widget: "oop-cheatsheet",
    widgetTitle: "Bảng nhớ: ý chính và câu nói mẫu",
    quiz: {
      question: "Người phỏng vấn hỏi: \"Vì sao không nên sinh getter/setter cho mọi field?\". Câu trả lời tốt nhất?",
      options: [
        "Vì getter/setter làm chương trình chạy chậm",
        "Vì setter không kiểm tra gì là một cửa không có người gác; nên mở hành động nghiệp vụ như withdraw() để quy tắc nằm cùng dữ liệu",
        "Vì Java chuẩn không cho phép setter",
        "Vì Lombok đã làm thay",
      ],
      answer: 1,
      explain: "Đây là Encapsulation kết hợp Tell, Don't Ask: bảo object làm việc thay vì lấy dữ liệu ra tự quyết.",
    },
  },
],
  cards: [
    { q: "4 tính chất của OOP là gì? Mỗi tính chất giải quyết vấn đề gì?", a: "Encapsulation bảo vệ quy tắc của dữ liệu, Abstraction giấu độ phức tạp, Inheritance tái sử dụng theo quan hệ là một, Polymorphism cho cùng lời gọi nhưng hành vi tuỳ object thật." },
    { q: "Đóng gói có phải là sinh getter/setter cho mọi field không?", a: "Không. Setter không kiểm tra gì thì chẳng khác field public. Hãy mở hành động nghiệp vụ như `withdraw()`, mỗi hành động tự kiểm tra quy tắc." },
    { q: "Vì sao nên ưu tiên composition thay vì inheritance?", a: "Class con phụ thuộc cách làm bên trong của class cha, thứ có thể đổi bất cứ lúc nào. Composition chỉ phụ thuộc API công khai." },
    { q: "Overriding và overloading chọn lúc nào, dựa vào gì?", a: "Overriding chọn lúc chạy theo object thật. Overloading chọn lúc compile theo kiểu khai báo của đối số." },
    { q: "Interface khác abstract class thế nào?", a: "Interface là hợp đồng, không có state hay constructor, implement được nhiều cái. Abstract class có field và constructor, chỉ extends được một." },
    { q: "Java truyền tham trị hay tham chiếu?", a: "Luôn tham trị. Với object, giá trị được copy là địa chỉ, nên sửa field qua tham số đổi object thật, còn gán lại tham số thì không ảnh hưởng bên ngoài." },
    { q: "Tell, Don't Ask nghĩa là gì?", a: "Bảo object làm việc (`account.withdraw(500)`) thay vì lấy dữ liệu ra rồi tự quyết. Quy tắc nằm cùng dữ liệu nên không ai quên kiểm tra." },
    { q: "Vì sao Square extends Rectangle vi phạm Liskov?", a: "Code đúng với Rectangle phải đúng với mọi lớp con. Square làm đổi cả hai chiều nên `setWidth(5); setHeight(4)` ra 16 thay vì 20." },
  ],
  modelAnswer:
    "OOP có 4 tính chất. Encapsulation là giấu dữ liệu và chỉ cho thay đổi qua method có kiểm tra quy tắc, ví dụ BankAccount chỉ có deposit/withdraw nên số dư không bao giờ âm. Abstraction là chỉ lộ ra object làm được gì, như interface PaymentGateway chỉ có charge(). Inheritance là tái sử dụng code theo quan hệ is-a, nhưng em ưu tiên composition vì kế thừa ràng buộc chặt. Polymorphism là cùng lời gọi nhưng hành vi khác nhau tuỳ object thật: overriding chọn lúc runtime, overloading chọn lúc compile. Về thiết kế, em theo Tell, Don't Ask: quy tắc nằm trong object (account.withdraw) thay vì rải ở service, và dùng Strategy thay cho lớp con khi chỉ cần đổi một phần hành vi, để không vi phạm Liskov. Ở dự án em, NotificationService gọi send() trên danh sách NotificationSender, thêm kênh Zalo chỉ cần thêm một class.",
};
