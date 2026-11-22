import timeline from "../timelines/oop.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Java outputs and javac messages quoted in the parts below were produced on JDK 21.
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
    parts: [
      {
        id: "access-modifiers",
        title: "Bốn mức truy cập, và bẫy protected khác package",
        intro: [
          "Ta vừa dùng `private` để khoá `balance`. Java có bốn mức truy cập, và câu \"bảng access modifier\" gần như buổi phỏng vấn junior nào cũng hỏi.",
          "Mỗi mức mở rộng hơn mức trước một bậc:",
          "- **`private`**: chỉ code trong chính class đó.",
          "- **default** (không ghi gì, còn gọi là package-private): thêm mọi class **cùng package**.",
          "- **`protected`**: thêm **class con ở package khác**, nhưng chỉ qua kế thừa.",
          "- **`public`**: mọi nơi.",
          "Class cấp cao nhất (không lồng trong class khác) chỉ được `public` hoặc default. Chỗ hay bị hỏi xoáy là chữ \"chỉ qua kế thừa\" của `protected`. Đọc code bên dưới: `Base` ở package `a`, `Sub` ở package `b` kế thừa nó.",
        ],
        predict: {
          question: "`Sub` (package `b`) extends `Base` (package `a`), `value` là `protected`. Trong `Sub`, viết `other.value` với `other` có kiểu `Base` thì sao?",
          options: [
            "Compile được, vì Sub là class con của Base",
            "Lỗi biên dịch: chỉ đọc được `value` qua chính `Sub` (như `this.value`), không qua một tham chiếu kiểu `Base`",
            "Compile được nhưng ném exception lúc chạy",
            "Lỗi biên dịch, vì protected chỉ dùng được trong cùng class",
          ],
          answer: 1,
          explain: "Ở package khác, `protected` chỉ mở cho phần `Base` nằm bên trong object `Sub`. Một object `Base` bất kỳ thì không. javac báo `value has protected access in Base`.",
        },
        widgetTitle: "Cùng đọc field của Base, từ hai chỗ khác nhau",
        compare: [
          way(
            "Class cùng package a",
            `package a;
public class Base { protected int value = 1; int pkg = 2; }

package a;
public class Neighbor {
  int read(Base other) { return other.value + other.pkg; }
}`,
            [
              ask("Đọc `other.value` (protected)", ok("Đã chạy `javac`: compile được. Cùng package thì `protected` mở như default.")),
              ask("Đọc `other.pkg` (default)", ok("Compile được, vì `Neighbor` cùng package `a`.")),
            ],
            "Cùng package: default và protected đều mở.",
          ),
          way(
            "Class con ở package b",
            `package b;
import a.Base;
public class Sub extends Base {
  int ok()             { return value; }        // qua chính this
  int viaOther(Base o) { return o.value; }      // qua tham chiếu kiểu Base
  int viaPkg()         { return pkg; }          // field default
}`,
            [
              ask("`value` qua chính `this`", ok("Compile được: đây đúng là quyền của class con.")),
              ask("`o.value` với `o` kiểu `Base`", bad("Đã chạy `javac`: `value has protected access in Base`.")),
              ask("`pkg` (default)", bad("Đã chạy `javac`: `pkg is not public in Base; cannot be accessed from outside package`. Kế thừa không mở được field default từ package khác.")),
            ],
            "Khác package: protected chỉ mở qua kế thừa, default thì đóng hẳn.",
          ),
        ],
        takeaway: {
          lines: [
            "`private` < default (cùng package) < `protected` (thêm class con, qua kế thừa) < `public`.",
            "Ở package khác, class con đọc `protected` qua `this`, không qua một object kiểu cha.",
          ],
        },
        quiz: {
          question: "Field không ghi access modifier nào (default). Ai đọc được nó?",
          options: [
            "Chỉ chính class đó",
            "Mọi class cùng package, kể cả không kế thừa; class con ở package khác thì không",
            "Mọi class con ở bất kỳ package nào",
            "Mọi nơi, giống public",
          ],
          answer: 1,
          explain: "Default là package-private: mở cho cả package, đóng với bên ngoài, kể cả class con. Đã chạy `javac`: `Sub` ở package khác đọc `pkg` bị báo `pkg is not public in Base`.",
        },
      },
      {
        id: "inner-classes",
        title: "Inner, nested và anonymous class: tham chiếu ngầm tới outer",
        intro: [
          "Ta vừa dùng `private` để giấu field. Java còn cho viết một class **bên trong** class khác, và câu hỏi phỏng vấn thường là: có bốn loại, và loại nào giữ một tham chiếu ngầm gây memory leak?",
          "Bốn loại:",
          "- **Static nested class**: `static class Nested`. Chỉ nằm trong namespace của outer, **không** có tham chiếu tới object outer. Tạo bằng `new Outer.Nested()`.",
          "- **Inner class** (không static): mỗi object inner gắn với **một object outer cụ thể**. Tạo bằng `outer.new Inner()`; gọi `new Inner()` trong method static thì đã chạy `javac` báo `non-static variable this cannot be referenced from a static context`.",
          "- **Local class**: khai báo trong thân một method.",
          "- **Anonymous class**: class không tên, khai báo và tạo object tại chỗ, như `new Comparator<String>() { ... }`. Dùng được biến local effectively final của method chứa nó.",
          "Điểm mấu chốt: inner, local và anonymous class (khi nằm trong method instance) giữ một field ẩn trỏ về outer, tên `this$0`. Nhờ nó mà code bên trong gọi được `Outer.this.field`. Cái giá: object inner còn sống thì object outer cũng không được GC.",
        ],
        predict: {
          question: "`Outer` giữ mảng 1 KB. Một object `Inner` (non-static, có dùng field của `Outer`) được cất trong một cache. Tất cả tham chiếu trực tiếp tới `Outer` đã được bỏ. `Outer` có bị GC không?",
          options: [
            "Có, vì không ai trỏ trực tiếp tới nó",
            "Không, vì `Inner` giữ tham chiếu ẩn `this$0` tới `Outer`",
            "Có, vì `System.gc()` luôn thu hồi object không dùng",
            "Tuỳ chọn thuật toán GC",
          ],
          answer: 1,
          explain: "`Inner` còn sống, `this$0` của nó trỏ tới `Outer`, nên `Outer` vẫn reachable từ cache.",
        },
        widgetTitle: "Inner class giữ outer, static nested thì không",
        compare: [
          way(
            "Inner class (không static)",
            `class Outer {
        byte[] big = new byte[1024];
        class In { int size() { return big.length; } }
      }
      Outer o = new Outer();
      Outer.In in = o.new In();`,
            [
              ask("Xem field của `In` bằng reflection", bad("Đã chạy: có một field `Outer this$0`. Đó là tham chiếu ẩn tới object outer.")),
              ask("Bỏ `o`, chỉ giữ `in`, gọi `System.gc()`", bad("Đã chạy: `WeakReference` tới outer vẫn còn, outer chưa bị thu hồi. Bỏ nốt `in` rồi GC thì outer mới bị thu hồi.")),
              ask("Anonymous class tạo trong method instance và dùng `big`", bad("Đã chạy: cũng có field `this$0`.")),
            ],
            "Chỉ cần giữ object inner là giữ luôn cả outer.",
          ),
          way(
            "Static nested class",
            `class Outer {
        static class Nested { }
      }
      new Outer.Nested();`,
            [
              ask("Xem field của `Nested` bằng reflection", ok("Đã chạy: 0 field. Không có tham chiếu tới outer, và không cần object outer để tạo.")),
              ask("Anonymous class tạo trong method **static**", ok("Đã chạy: 0 field, vì không có `this` của outer để giữ.")),
            ],
            "Không cần outer thì dùng `static` nested: không rò rỉ outer.",
          ),
        ],
        after: [
          "Ví dụ rò rỉ thật: một listener là anonymous class của một Activity hay Controller, được đăng ký vào một danh sách `static`. Listener còn trong danh sách thì cả object bên ngoài (kèm mọi thứ nó giữ) không bao giờ được giải phóng. Nếu inner không cần outer thì khai báo `static`, hoặc dùng lambda không dùng `this`.",
          "Chi tiết nhỏ: đã chạy trên JDK 21, một inner class **không dùng** gì của outer thì javac không tạo field `this$0` (class `Unused` có 0 field). Nhưng đừng dựa vào đó: chỉ cần sau này thêm một lời gọi tới outer là tham chiếu quay lại.",
        ],
        takeaway: {
          lines: [
            "Inner, local, anonymous class (trong method instance) giữ tham chiếu ẩn `this$0` tới outer; static nested thì không.",
            "Class lồng nhau không cần outer thì khai báo `static`.",
          ],
        },
        quiz: {
          question: "Vì sao `new In()` trong method `static main` của `Outer` không biên dịch được khi `In` là inner class không static?",
          options: [
            "Vì `In` là private",
            "Vì object `In` cần gắn với một object `Outer`, mà method static không có `this`; phải viết `outer.new In()`",
            "Vì class lồng nhau không được tạo trong `main`",
            "Vì `In` thiếu constructor",
          ],
          answer: 1,
          explain: "Inner class mang tham chiếu ẩn tới một object outer cụ thể. Đã chạy `javac`: `non-static variable this cannot be referenced from a static context`.",
        },
      },
    ],
  },
  {
    id: "inheritance-basics",
    title: "Phần 2: Inheritance, kế thừa là gì",
    scene: "ibas",
    intro: [
      "Giả sử bạn có class `Animal` (động vật) biết `eat()` (ăn). Giờ cần thêm `Dog` (chó): cũng biết ăn, nhưng thêm được `bark()` (sủa). Thay vì chép lại `eat()` sang `Dog`, bạn viết `class Dog extends Animal`. Từ khoá `extends` nghĩa là: `Dog` tự có sẵn mọi thứ của `Animal`, bạn chỉ viết thêm phần riêng của chó. Đó là **kế thừa** (inheritance). `Animal` gọi là class cha, `Dog` gọi là class con.",
      "Class con còn có thể **viết đè** (override) một method của cha để làm khác đi: `Animal.speak()` in ba chấm, còn `Dog` viết đè `speak()` để in \"Gâu\". Trong code của con, `super.speak()` nghĩa là \"gọi lại bản của cha\". Ở ví dụ này, `Dog.speak()` gọi `super.speak();` trước rồi mới in \"Gâu\", nên `new Dog().speak()` in ba chấm trước, rồi tới \"Gâu\" (đã chạy trên JDK 21). Ghi chú `@Override` để trình biên dịch kiểm tra giúp bạn không viết sai tên method.",
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
    parts: [
      {
        id: "static-init",
        title: "static và thứ tự khởi tạo: cha hay con chạy trước?",
        intro: [
          "Ta đã biết `new Dog()` có sẵn mọi thứ của `Animal`. Nhưng khi tạo object con, code khởi tạo của cha và của con chạy theo thứ tự nào? Câu này hay đi kèm từ khoá `static`.",
          "**`static`** nghĩa là thuộc về **class**, không thuộc từng object:",
          "- **Field static**: một bản duy nhất dùng chung cho mọi object.",
          "- **Method static**: gọi bằng tên class, không có `this`, nên không đọc được field instance. Đã chạy `javac`: `non-static variable mine cannot be referenced from a static context`. `main` là static vì JVM gọi nó khi chưa có object nào.",
          "- **Khối `static { }`**: chạy **một lần** khi class được khởi tạo, lần đầu code dùng tới class đó.",
          "Còn **khối instance `{ }`** chạy mỗi lần `new`, ngay trước thân constructor. Đọc code bên dưới rồi đoán thứ tự in ra.",
        ],
        predict: {
          question: "`Child extends Parent`, mỗi class có khối `static`, khối instance và constructor. Gọi `new Child()` **hai lần**. Dòng `Parent static` in mấy lần, và in trước hay sau `Child static`?",
          options: [
            "Hai lần, sau Child static",
            "Một lần, trước Child static",
            "Hai lần, trước Child static",
            "Không in, vì chỉ tạo Child",
          ],
          answer: 1,
          explain: "Khởi tạo class con đòi khởi tạo class cha trước, và khối static chỉ chạy một lần cho mỗi class. Lần `new` thứ hai chỉ còn khối instance và constructor.",
        },
        widgetTitle: "Chạy thử: thứ tự khởi tạo và field static",
        compare: [
          way(
            "Thứ tự khởi tạo",
            `class Parent {
  static { print("1. Parent static"); }
  { print("3. Parent instance block"); }
  Parent() { print("4. Parent constructor"); }
}
class Child extends Parent {
  static { print("2. Child static"); }
  { print("5. Child instance block"); }
  Child() { print("6. Child constructor"); }
}
new Child(); new Child();`,
            [
              ask("Lần `new Child()` đầu tiên", ok("Đã chạy: in đúng 1, 2, 3, 4, 5, 6. Static của cha, static của con, rồi cả phần instance của cha xong mới tới phần của con.")),
              ask("Lần `new Child()` thứ hai", ok("Đã chạy: chỉ in 3, 4, 5, 6. Hai khối static không chạy lại.")),
            ],
            "Static cha → static con (một lần) → khối instance và constructor của cha → của con (mỗi lần new).",
          ),
          way(
            "Field static và field instance",
            `class Counter {
  static int total;   // một bản cho cả class
  int mine;           // mỗi object một bản
  Counter() { total++; mine++; }
}
new Counter(); new Counter(); Counter c = new Counter();`,
            [
              ask("Sau ba lần `new`, `Counter.total` và `c.mine` là bao nhiêu?", ok("Đã chạy: `total=3 c.mine=1`. Ba object cùng tăng một biến `total`, còn mỗi object có `mine` riêng.")),
              ask("Thêm `static void show() { print(mine); }`", bad("Đã chạy `javac`: `non-static variable mine cannot be referenced from a static context`. Method static không biết đang nói về object nào.")),
            ],
            "Static là của class: dùng chung, sống suốt đời class, và không có `this`.",
          ),
        ],
        after: [
          "Vì sao cha trước con? Constructor của con luôn gọi `super(...)` (hoặc `this(...)`) ở dòng đầu; không viết thì compiler tự thêm `super()`, nên phần của cha phải sẵn sàng trước khi con dùng tới.",
          "Field static sống suốt đời ứng dụng, nên một `static List` chỉ thêm mà không xoá là nguồn memory leak kinh điển (bài JVM, Phần 7). Nếu khối static ném exception, class đó hỏng luôn: lần dùng đầu ném `ExceptionInInitializerError`, các lần sau ném `NoClassDefFoundError` (xem bài ClassLoader, JIT).",
        ],
        takeaway: {
          title: "Chuỗi nhân quả cần nhớ",
          lines: [
            "Static cha → static con (chỉ một lần) → khối instance cha → constructor cha → khối instance con → constructor con.",
          ],
        },
        quiz: {
          question: "Vì sao trong method static không đọc được field instance?",
          options: [
            "Vì field instance luôn là private",
            "Vì method static thuộc về class, không có `this`, nên không biết đang nói về object nào",
            "Vì JVM chưa nạp class",
            "Vì method static chạy trên thread khác",
          ],
          answer: 1,
          explain: "Mỗi object có bản field instance riêng, còn method static được gọi qua tên class. javac báo `non-static variable ... cannot be referenced from a static context`.",
        },
      },
      {
        id: "constructor-rules",
        title: "Constructor: this(), super() và thứ tự chạy",
        intro: [
          "Ta vừa thấy constructor của con luôn gọi `super(...)` ở dòng đầu, và phần của cha chạy xong trước. Quy tắc đầy đủ của constructor là câu hỏi warm-up rất hay gặp.",
          "Tình huống: `class P { P(int x) {} }`, rồi `class C extends P { }` và chẳng viết gì trong `C`. Đã chạy `javac`: `constructor P in class P cannot be applied to given types; required: int`. Code không có dòng nào gọi `P(int)`, vậy lỗi từ đâu ra?",
          "Các quy tắc cần nhớ:",
          "- **Không viết constructor nào**: compiler tự thêm constructor mặc định không tham số. Viết dù chỉ một constructor có tham số thì cái mặc định **biến mất**: đã chạy `javac`, `new U()` báo `constructor U in class U cannot be applied to given types`.",
          "- **Dòng đầu của mọi constructor** phải là `this(...)` hoặc `super(...)`. Không viết thì compiler tự chèn `super()`. Nếu cha không có constructor không tham số thì lỗi như trên.",
          "- **`this(...)`** gọi constructor khác của **cùng class** (constructor chaining), để các constructor dùng chung một chỗ khởi tạo thay vì chép code.",
          "- **`this(...)` và `super(...)` không đi cùng nhau**, vì cả hai đều phải đứng đầu. Đặt sau một lệnh khác thì đã chạy `javac` báo `call to super must be first statement in constructor`.",
          "- Constructor **không được kế thừa** và không có kiểu trả về.",
        ],
        predict: {
          question: "`Child()` gọi `this(5)`. `Child(int x)` gọi `super(x * 2)`. `Base(int x)` in `Base(x)`. Gọi `new Child()` thì dòng đầu tiên in ra là gì?",
          options: ["Child()", "Child(5)", "Base(10)", "Base(5)"],
          answer: 2,
          explain: "`this(5)` nhảy sang `Child(int)`, nơi `super(10)` chạy đầu tiên, nên `Base(10)` in trước. Thân `Child(int)` rồi mới tới thân `Child()`.",
        },
        widgetTitle: "Chạy thử chuỗi constructor, và bẫy gọi method của con từ constructor cha",
        compare: [
          way(
            "Constructor chaining",
            `class Base { Base(int x) { print("Base(" + x + ")"); } }
      class Child extends Base {
        Child()      { this(5);      print("Child()"); }
        Child(int x) { super(x * 2); print("Child(" + x + ")"); }
      }`,
            [
              ask("`new Child()`", ok("Đã chạy: in `Base(10)`, `Child(5)`, `Child()`. `this(5)` nhảy sang `Child(int)`, nó gọi `super(10)` nên cha chạy trước hết, rồi tới thân `Child(int)`, cuối cùng mới tới thân `Child()`.")),
              ask("`new Child(7)`", ok("Đã chạy: in `Base(14)`, `Child(7)`. Không qua `Child()`.")),
              ask("Cha chỉ có `Base(int)`, con không viết constructor nào", bad("Đã chạy `javac`: `constructor P in class P cannot be applied to given types; required: int`. Compiler chèn `super()` mà cha không có constructor không tham số.")),
            ],
            "Mọi đường đi đều kết thúc ở một lời gọi `super(...)`, và cha luôn xong trước.",
          ),
          way(
            "Gọi method bị override trong constructor cha",
            `class Base { Base() { init(); } void init() {} }
      class Kid extends Base {
        String name = "kid";
        @Override void init() { print("name=" + name); }
      }
      new Kid();`,
            [
              ask("`new Kid()`", bad("Đã chạy: in `name=null`. Constructor của cha chạy trước khi field của con được gán `\"kid\"`, nên `init()` của con chạy khi object con chưa khởi tạo xong.")),
            ],
            "Đừng gọi method có thể bị override trong constructor: object con chưa sẵn sàng.",
          ),
        ],
        takeaway: {
          lines: [
            "Viết constructor có tham số thì constructor mặc định mất. Dòng đầu của constructor là `this(...)` hoặc `super(...)`, không viết thì compiler thêm `super()`.",
            "Cha luôn xong trước con, nên constructor cha không nên gọi method mà con có thể override.",
          ],
        },
        quiz: {
          question: "`class A { A(String s) {} }`, rồi `class B extends A { }`. Điều gì xảy ra?",
          options: [
            "Chạy bình thường, `B` có constructor mặc định gọi `A(\"\")`",
            "Lỗi biên dịch: constructor mặc định của `B` gọi `super()` mà `A` không có constructor không tham số",
            "Chạy được nhưng `new B()` ném exception lúc chạy",
            "Lỗi biên dịch vì `B` bắt buộc phải khai báo constructor rồi mới kế thừa được",
          ],
          answer: 1,
          explain: "Compiler thêm cho `B` một constructor mặc định có `super()` ở dòng đầu. `A` không có `A()` nên lỗi lúc biên dịch.",
        },
      },
    ],
  },
  {
    id: "inheritance",
    title: "Phần 3: Cái giá của kế thừa, và vì sao nên chọn composition",
    scene: "inh",
    intro: [
            "Kế thừa rất tiện, nhưng có một cái giá: class con **phụ thuộc vào cách class cha làm việc bên trong**, thứ mà tác giả class cha không hứa gì với bạn và có thể đổi bất cứ lúc nào.",
      "Ví dụ kinh điển (sách Effective Java): bạn muốn một `HashSet` biết đếm đã thêm bao nhiêu phần tử. Bạn viết class con `InstrumentedHashSet`, viết đè `add()` và `addAll()` để cộng vào biến `addCount`. Bạn gọi `addAll` với 3 phần tử và mong `addCount` là 3. Hãy đọc code bên dưới, rồi bấm từng bước để xem kết quả thật.",
    ],
    predict: {
      question: "`InstrumentedHashSet` viết đè cả `add()` lẫn `addAll()` để cộng vào `addCount`. Gọi `addAll` với 3 phần tử thì `addCount` là bao nhiêu?",
      options: ["3", "6", "0", "Lỗi biên dịch"],
      answer: 1,
      explain: "`HashSet.addAll()` của cha gọi `add()` cho từng phần tử, mà `add()` đã bị viết đè, nên mỗi phần tử được đếm hai lần: 3 + 3 = 6.",
    },
    widget: "inherit",
    widgetTitle: "Chạy từng bước: addAll(\"a\", \"b\", \"c\")",
    after: [
      "Kết quả là **6**, không phải 3. Lý do: `HashSet.addAll()` của class cha, bên trong, gọi `add()` cho từng phần tử. Nhưng `add()` đã bị bạn viết đè, nên Java chạy bản của bạn và cộng thêm 1 lần nữa. Tổng cộng 3 (từ `addAll`) cộng 3 (từ ba lần `add`) là 6. Class cha không hề ghi ở đâu rằng `addAll` gọi `add`, nên bạn không thể biết trước.",
      "**Composition** (ghép) tránh được chuyện này: thay vì `extends HashSet`, class của bạn **giữ một `HashSet` trong field** rồi chỉ nhờ nó làm việc. Set bên trong không biết gì về class của bạn, nên không gọi ngược lại `add()` của bạn, và kết quả đúng 3. Quy tắc nhớ: **có thể coi \"là một\" thì mới kế thừa, còn lại thì giữ trong field**. Trong Spring, inject dependency chính là composition.",
      "Thêm một lợi ích: kế thừa bị **chốt cứng lúc compile** (class con luôn là `extends HashSet`), còn composition **đổi được lúc chạy**: truyền vào một object khác qua constructor hay setter là hành vi đổi theo, không cần viết class mới.",
    ],
    takeaway: {
      title: "Chuỗi nhân quả cần nhớ",
      lines: [
        "Viết đè `add()` → `addAll()` của cha gọi lại `add()` của bạn → mỗi phần tử bị đếm hai lần.",
        "Có thể coi \"là một\" thì mới kế thừa, còn lại thì giữ trong field (composition).",
      ],
    },
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
    parts: [
      {
        id: "override-rules",
        title: "Luật khi override, và static method thì không override được",
        intro: [
          "Override phải giữ lời hứa của method cha, vì code đang gọi qua kiểu cha vẫn tin vào lời hứa đó. Từ đó ra ba luật mà compiler kiểm tra:",
          "- **Không thu hẹp quyền truy cập**: cha `public void speak()` thì con không được viết `void speak()` (package-private). Lý do: ai gọi được `Animal.speak()` thì cũng phải gọi được bản của con. Đã chạy `javac`: `speak() in Dog cannot override speak() in Animal; attempting to assign weaker access privileges; was public`. Mở rộng hơn (từ `protected` lên `public`) thì được.",
          "- **Kiểu trả về được hẹp hơn** ({{covariant|covariant return}}): cha `Object make()`, con `String make()` là hợp lệ, vì `String` vẫn là một `Object`, bên gọi không bị bất ngờ. Rộng hơn thì lỗi biên dịch.",
          "- **Checked exception không được rộng hơn**: cha `throws IOException` thì con chỉ được ném `IOException`, class con của nó, hoặc không ném gì. Lý do: bên gọi chỉ `catch` những gì cha khai báo (xem bài Exception).",
          "**Static method không override được, chỉ bị che (hiding).** `Animal` và `Dog` cùng có `static String kind()`. Với `Animal x = new Dog();`, đã chạy: `x.kind()` ra `Animal`, không phải `Dog`. Lý do: static method thuộc về class, không thuộc object, nên Java chọn theo **kiểu khai báo** lúc compile, không theo object thật. Ghi `@Override` lên static method thì `javac` báo: `static methods cannot be annotated with @Override`.",
        ],
        trap: {
          title: "Tưởng static method cũng đa hình",
          text: "`Animal x = new Dog(); x.kind();` gọi `Animal.kind()` vì static method được chọn theo kiểu khai báo. Đa hình (chọn theo object thật) chỉ áp dụng cho instance method được override.",
        },
        quiz: {
          question: "Animal và Dog cùng có static String kind(). Animal x = new Dog(); x.kind() trả về gì?",
          options: ["\"Dog\", vì object thật là Dog", "\"Animal\", vì static method chọn theo kiểu khai báo", "Lỗi biên dịch", "Ném exception lúc chạy"],
          answer: 1,
          explain: "Static method không override được mà chỉ bị che (hiding): compiler chọn theo kiểu khai báo Animal. Đã chạy trên JDK 21: x.kind() ra Animal.",
        },
      },
      {
        id: "overload-resolution",
        title: "Có nhiều bản overload khớp: compiler chọn bản nào?",
        intro: [
          "Ta đã biết overload là cùng tên, khác tham số. Nhưng nếu đối số khớp được với **nhiều** bản cùng lúc thì sao? Ví dụ có `m(long)`, `m(Integer)` và `m(int...)`, rồi gọi `m(5)`: số `5` là `int`, không bản nào khớp đúng kiểu.",
          "Compiler thử theo ba vòng, vòng nào tìm được thì dừng:",
          "- **Vòng 1, khớp đúng hoặc nới rộng (widening)**: `int` lên `long`, `float`, `double`. Không boxing, không varargs.",
          "- **Vòng 2, thêm boxing**: `int` thành `Integer`, rồi có thể nới tiếp lên `Number` hay `Object`.",
          "- **Vòng 3, thêm varargs**: `int...`.",
          "Trong một vòng mà nhiều bản cùng khớp, bản **cụ thể nhất** thắng (`int` cụ thể hơn `long`). Lý do có thứ tự này: widening có từ Java đầu tiên, boxing và varargs mới thêm ở Java 5, nên code cũ phải giữ nguyên kết quả.",
        ],
        predict: {
          question: "Có `m(long)`, `m(Integer)` và `m(int...)`. Gọi `m(5)` thì bản nào chạy?",
          options: ["`m(Integer)`, vì 5 đổi thành Integer", "`m(long)`, vì widening thắng boxing", "`m(int...)`", "Lỗi biên dịch vì mơ hồ"],
          answer: 1,
          explain: "Vòng 1 chỉ xét khớp đúng và widening. `int` nới lên `long` được, nên compiler dừng ngay ở vòng 1 và không xét boxing.",
        },
        widgetTitle: "Chạy thử: compiler chọn bản nào",
        compare: [
          way(
            "Widening và boxing",
            `static void m(long x)    { print("long"); }
static void m(Integer x) { print("Integer"); }
static void m(int... x)  { print("varargs"); }

static void q(int x)  { print("int"); }
static void q(long x) { print("long"); }`,
            [
              ask("`m(5)`", ok("Đã chạy: in `long`. Widening (vòng 1) thắng boxing (vòng 2).")),
              ask("`q(5)`", ok("Đã chạy: in `int`, khớp đúng.")),
              ask("`byte b = 1; q(b);`", ok("Đã chạy: in `int`. Cả `int` lẫn `long` đều nới được, bản cụ thể hơn thắng.")),
            ],
            "Vòng 1 tìm được thì không bao giờ xét tới boxing.",
          ),
          way(
            "Boxing và varargs",
            `static void n(Integer x) { print("Integer"); }
static void n(int... x)  { print("varargs"); }

static void p(Object x)  { print("Object"); }
static void p(int... x)  { print("varargs"); }`,
            [
              ask("`n(5)`", ok("Đã chạy: in `Integer`. Boxing (vòng 2) thắng varargs (vòng 3).")),
              ask("`p(5)`", ok("Đã chạy: in `Object`. `5` boxing thành `Integer` rồi nới lên `Object`, vẫn là vòng 2, nên varargs thua.")),
            ],
            "Varargs luôn là lựa chọn cuối cùng.",
          ),
        ],
        takeaway: {
          lines: [
            "Thứ tự chọn overload: khớp đúng → widening → boxing → varargs. Trong cùng một vòng, bản cụ thể nhất thắng.",
          ],
        },
        quiz: {
          question: "Có `p(Object x)` và `p(int... x)`. Gọi `p(5)` in gì?",
          options: ["varargs, vì 5 là int", "Object, vì boxing rồi nới lên Object vẫn đứng trước varargs", "Lỗi biên dịch vì mơ hồ", "Tuỳ JVM"],
          answer: 1,
          explain: "Varargs chỉ được xét ở vòng 3. Vòng 2 đã tìm được `p(Object)` qua boxing `int` → `Integer` → `Object`. Đã chạy trên JDK 21: in `Object`.",
        },
      },
    ],
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
    takeaway: {
      lines: [
        "**Override**: chọn lúc chạy, theo object thật.",
        "**Overload**: chọn lúc compile, theo kiểu khai báo.",
      ],
    },
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
      "`OrderService` chỉ giữ một biến kiểu `PaymentGateway` (giống Phần 4: kiểu khai báo là interface, object thật là MoMo hay ZaloPay) và gọi `gateway.charge(...)`. Nó không biết, cũng không cần biết đang dùng cổng nào. Chọn cổng bên dưới: code của `OrderService` không đổi một dòng. Thêm ZaloPay chỉ là thêm một class mới. Đây là nguyên tắc Open/Closed: thêm tính năng bằng class mới, không sửa code cũ đang chạy tốt (học kỹ ở bài SOLID).",
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
      "Phần 7 dùng interface làm chuẩn. Câu hỏi xoáy tiếp theo: sao không dùng abstract class?",
      "Cả hai đều là cách nói \"class con phải có những method này\". Khác nhau ở chỗ chúng **được phép chứa gì**.",
      "**Abstract class** là class \"dở dang\": không `new` trực tiếp được (compiler báo \"is abstract; cannot be instantiated\"). Nó có thể có **field, constructor, method đã có code** để các class con dùng chung, cộng với **method abstract** (chưa có thân, con bắt buộc viết). Ví dụ `abstract class Animal` giữ `name`, có `describe()` dùng chung và `abstract String sound()` để con tự quyết. Một class chỉ `extends` được **một** abstract class.",
      "**Interface** là hợp đồng: mô tả class làm được gì, **không có field instance hay constructor**. Bên trong interface được có:",
      "- **Hằng số**: `public static final`.",
      "- **Method abstract**: kiểu mặc định của method trong interface.",
      "- **Method `default`**: có code (Java 8).",
      "- **Method `static`**: Java 8.",
      "- **Method `private`**: để các method `default` dùng chung code (Java 9).",
      "Nhưng một class `implements` được **nhiều** interface: `Duck extends Animal implements Flyable, Swimmable`. Chạy thật trên JDK 21: `Duck says quack`, rồi `Duck flies`, `Duck swims`.",
      "Quy tắc thực tế: **mặc định chọn interface**. Khi nhiều implementation trùng code và state, thêm abstract class implement interface đó, giống JDK: `List` → `AbstractList` → `ArrayList`. Thử phân loại các đặc điểm bên dưới.",
    ],
    widget: "classify",
    widgetTitle: "Phân loại: đặc điểm này thuộc về ai?",
    after: [
      "Câu hỏi nối tiếp hay gặp: **diamond problem**. `Flyable` và `Swimmable` cùng có `default String hello()`, `Duck implements Flyable, Swimmable` thì `Duck` thừa hưởng bản nào? Java không tự chọn. Đã chạy `javac`: `types Flyable and Swimmable are incompatible; class Duck inherits unrelated defaults for hello() from types Flyable and Swimmable`.",
      "Cách sửa: `Duck` bắt buộc override `hello()`, và bên trong có thể gọi bản của từng interface bằng cú pháp `Flyable.super.hello()`. Ví dụ `return Flyable.super.hello() + \"+\" + Swimmable.super.hello();` đã chạy ra `fly+swim`. Với class thì không có chuyện này, vì Java chỉ cho `extends` một class.",
    ],
    takeaway: {
      lines: [
        "Mặc định chọn interface. Khi nhiều implementation trùng code và state, thêm abstract class implement interface đó.",
      ],
    },
    trap: {
      title: "Nói interface không có code từ Java 8",
      text: "Interface có `default` và `static` method từ Java 8, `private` method từ Java 9, nhưng vẫn không có field instance (state) và constructor, và một class implement được nhiều interface.",
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
    parts: [
      {
        id: "generics-pecs",
        title: "Generics: vì sao List<Integer> không phải List<Number>, và PECS",
        intro: [
          "Interface cho một hợp đồng chạy với nhiều class. **Generics** cho một class hay method chạy với nhiều **kiểu dữ liệu**: `List<T>`, `Map<K, V>`, `Optional<T>`. Chữ `T` là tham số kiểu, điền vào lúc dùng: `List<String>`.",
          "Trước Java 5 chưa có generics, `List` chứa `Object`. Bỏ nhầm một `Integer` vào list tên khách hàng vẫn compile, rồi lúc đọc ra và ép kiểu `(String)` mới nổ `ClassCastException`, có khi ở một màn hình khác hẳn. Generics đưa lỗi đó về **lúc compile** và bỏ được các phép ép kiểu.",
          "Câu hỏi xoáy: `Integer` là một `Number`, vậy `List<Integer>` có phải là một `List<Number>` không? **Không**. Đã chạy `javac`: `incompatible types: List<Integer> cannot be converted to List<Number>`. Lý do: nếu được, ai đó gán `List<Number> nums = ints;` rồi `nums.add(2.5)`, và list số nguyên bỗng chứa một `Double`. Tính chất này gọi là **invariance** (bất biến).",
          "Mảng thì ngược lại, cho gán `Object[] arr = new String[1];`, và phải trả giá lúc chạy: đã chạy `arr[0] = 42;` ném `ArrayStoreException: java.lang.Integer`.",
          "Muốn một method nhận được cả `List<Integer>` lẫn `List<Double>`, dùng **wildcard**:",
          "- **`List<? extends Number>`**: list của một kiểu con nào đó của `Number`. **Đọc** ra được `Number`, nhưng **không thêm** được gì (trừ `null`), vì không biết đó là list `Integer` hay `Double`.",
          "- **`List<? super Integer>`**: list của `Integer` hoặc kiểu cha của nó (`Number`, `Object`). **Thêm** được `Integer`, nhưng đọc ra chỉ biết là `Object`.",
          "- **`List<?>`**: kiểu gì cũng được, chỉ đọc ra `Object`.",
          "Mẹo nhớ **PECS**: **P**roducer **E**xtends, **C**onsumer **S**uper. Tham số mà method **lấy dữ liệu ra** (producer) thì dùng `extends`; tham số mà method **bỏ dữ liệu vào** (consumer) thì dùng `super`. JDK viết đúng như vậy: `Collections.copy(List<? super T> dest, List<? extends T> src)`.",
        ],
        predict: {
          question: "Method khai báo `double sum(List<Number> nums)`. Gọi `sum(ints)` với `List<Integer> ints = List.of(1, 2, 3)` thì sao?",
          options: [
            "Chạy được, in 6.0",
            "Lỗi biên dịch: `List<Integer>` không đổi được sang `List<Number>`",
            "Chạy được nhưng ném `ClassCastException`",
            "Chạy được nhưng in 0",
          ],
          answer: 1,
          explain: "Generics bất biến: `List<Integer>` không phải là `List<Number>`. Muốn nhận mọi list số, khai báo `List<? extends Number>`.",
        },
        widgetTitle: "Cùng một method tính tổng, hai cách khai báo tham số",
        compare: [
          way(
            "Tham số List<Number>",
            `static double sum(List<Number> nums) {
  double s = 0;
  for (Number n : nums) s += n.doubleValue();
  return s;
}
List<Integer> ints = List.of(1, 2, 3);
sum(ints);`,
            [
              ask("Gọi với `List<Integer>`", bad("Đã chạy `javac`: `incompatible types: List<Integer> cannot be converted to List<Number>`.")),
              ask("Gọi với `List<Double>`", bad("Cũng lỗi biên dịch: chỉ nhận đúng `List<Number>`.")),
            ],
            "Quá chặt: chỉ nhận đúng một kiểu list.",
          ),
          way(
            "extends để đọc, super để ghi",
            `static double sum(List<? extends Number> nums) { ... }   // chỉ đọc

static <T> void copy(List<? extends T> src, List<? super T> dst) {
  for (T x : src) dst.add(x);
}`,
            [
              ask("`sum` với `List<Integer>` và `List<Double>`", ok("Đã chạy: `sum(List.of(1, 2, 3))` ra `6.0`, `sum(List.of(1.5, 2.5))` ra `4.0`.")),
              ask("`copy(ints, nums)` và `copy(ints, objs)`", ok("Đã chạy: chép `[1, 2, 3]` vào được cả `List<Number>` lẫn `List<Object>`.")),
              ask("Trong `sum`, thử `nums.add(1)`", bad("Đã chạy `javac`: `incompatible types: int cannot be converted to CAP#1`. Với `extends`, compiler không biết list thật là của kiểu nào nên cấm thêm.")),
            ],
            "Producer extends, consumer super: method nhận được nhiều kiểu list mà vẫn an toàn kiểu.",
          ),
        ],
        takeaway: {
          lines: [
            "`List<Integer>` không phải `List<Number>` (invariance), để không ai nhét được `Double` vào list số nguyên.",
            "PECS: lấy ra thì `? extends T`, bỏ vào thì `? super T`.",
          ],
        },
        quiz: {
          question: "Method chỉ **thêm** các `Integer` vào list được truyền vào. Khai báo tham số nào linh hoạt nhất mà vẫn an toàn?",
          options: ["`List<? extends Integer>`", "`List<? super Integer>`", "`List<Integer>`", "`List<?>`"],
          answer: 1,
          explain: "List là consumer (nhận dữ liệu) nên dùng `super`: nhận được `List<Integer>`, `List<Number>`, `List<Object>`. Với `extends` thì không thêm được gì, còn `List<Integer>` chỉ nhận đúng một kiểu.",
        },
      },
      {
        id: "generics-erasure",
        title: "Type erasure: lúc chạy không còn T",
        intro: [
          "Generics kiểm tra kiểu lúc compile. Vậy lúc chạy, `List<String>` và `List<Integer>` có phải hai class khác nhau không?",
          "Không. Compiler dùng `T` để kiểm tra, rồi **xoá** nó đi (type erasure): `T` thành kiểu giới hạn của nó (`Object` nếu không ghi gì, `Number` nếu là `T extends Number`), và compiler tự chèn phép ép kiểu ở chỗ đọc ra. Java chọn cách này để bytecode mới vẫn chạy chung với thư viện viết trước Java 5.",
          "Hệ quả: những gì cần biết `T` **lúc chạy** đều không viết được:",
          "- **`new T()` và `new T[n]`**: lúc chạy không biết `T` là gì để tạo. javac báo `generic array creation`.",
          "- **`o instanceof List<String>`**: lúc chạy chỉ còn `List`. javac báo `Object cannot be safely cast to List<String>`. Viết `instanceof List<?>` thì được.",
          "- **Hai overload chỉ khác tham số kiểu**: `m(List<String>)` và `m(List<Integer>)` xoá xong thành cùng `m(List)`. javac báo `name clash: ... have the same erasure`.",
          "Cách vượt qua: truyền `Class<T>` vào để có kiểu lúc chạy. Jackson (`TypeReference`) và Spring (`ParameterizedTypeReference`) dùng một mẹo khác: tạo một class con vô danh như `new TypeReference<List<Order>>() {}`, vì tham số kiểu ghi ở khai báo class cha vẫn được giữ trong file class và đọc lại được bằng reflection.",
        ],
        predict: {
          question: "`List<String> a = new ArrayList<>(); List<Integer> b = new ArrayList<>();`. `a.getClass() == b.getClass()` cho gì?",
          options: ["false, vì khác tham số kiểu", "true, lúc chạy cả hai chỉ là `java.util.ArrayList`", "Lỗi biên dịch", "Tuỳ JVM"],
          answer: 1,
          explain: "Sau khi xoá kiểu, cả hai là cùng class `java.util.ArrayList`. Tham số kiểu chỉ tồn tại lúc compile.",
        },
        widgetTitle: "Cần T lúc chạy: hai cách viết",
        compare: [
          way(
            "Dùng T trực tiếp lúc chạy",
            `class Box<T> {
  T[] make(int n) { return new T[n]; }
  static boolean check(Object o) { return o instanceof List<String>; }
}`,
            [
              ask("`new T[n]`", bad("Đã chạy `javac`: `generic array creation`.")),
              ask("`o instanceof List<String>`", bad("Đã chạy `javac`: `Object cannot be safely cast to List<String>`.")),
              ask("So class của `List<String>` và `List<Integer>`", bad("Đã chạy: `a.getClass() == b.getClass()` là `true`, tên class là `java.util.ArrayList`. Không có gì để phân biệt.")),
            ],
            "Lúc chạy không còn T, nên mọi thao tác cần T đều bị chặn.",
          ),
          way(
            "Truyền Class<T> vào",
            `static <T> T[] make(Class<T> type, int n) {
  return (T[]) Array.newInstance(type, n);
}
String[] arr = make(String.class, 3);
boolean isList = o instanceof List<?>;`,
            [
              ask("Tạo mảng kiểu T", ok("Đã chạy: ra `String[] length=3`. `Class<T>` mang kiểu thật tới lúc chạy.")),
              ask("Kiểm tra o có phải List", ok("Đã chạy: `o instanceof List<?>` là `true`. Chỉ hỏi được \"có phải List\", không hỏi được List của gì.")),
            ],
            "Cần kiểu lúc chạy thì phải tự mang nó theo, bằng `Class<T>` hoặc `TypeReference`.",
          ),
        ],
        takeaway: {
          title: "Chuỗi nhân quả cần nhớ",
          lines: [
            "Compiler kiểm tra T rồi xoá nó → lúc chạy `List<String>` và `List<Integer>` là cùng một class → không `new T[]`, không `instanceof List<String>`, không overload chỉ khác tham số kiểu.",
          ],
        },
        quiz: {
          question: "Vì sao Spring cần `new ParameterizedTypeReference<List<Order>>() {}` thay vì `List<Order>.class`?",
          options: [
            "Vì `List<Order>.class` chạy chậm",
            "Vì tham số kiểu bị xoá lúc chạy; class con vô danh giữ lại `List<Order>` ở khai báo class cha để reflection đọc được",
            "Vì Order không có constructor rỗng",
            "Vì Spring không hỗ trợ List",
          ],
          answer: 1,
          explain: "`List<Order>.class` không tồn tại vì chỉ có một class `List` lúc chạy. Dấu `{}` tạo class con vô danh, và kiểu ghi ở `extends ParameterizedTypeReference<List<Order>>` được lưu trong file class.",
        },
      },
    ],
  },
  {
    id: "pass-by-value",
    title: "Phần 9: Câu bẫy cuối: Java truyền tham trị hay tham chiếu?",
    scene: "pbv",
    intro: [
      "Câu hỏi: khi gọi một method, Java đưa cho method cái gì, **bản gốc** hay **bản sao**? Trả lời: luôn luôn là **bản sao**. Đó là **pass-by-value** (truyền tham trị).",
      "Với số, dễ hiểu: `int n = 5; inc(n);` trong đó `inc` làm `x++`. Chạy thật: `n` vẫn là 5, vì `inc` chỉ tăng bản sao.",
      "Với object thì dễ nhầm hơn. Biến `Dog d` **không chứa con chó**, nó chứa **địa chỉ** của con chó trong heap, như một tờ giấy ghi địa chỉ nhà. Gọi `rename(d)` là **photocopy tờ giấy** đưa cho method. Hai tờ giấy cùng chỉ một ngôi nhà, nên method sửa đồ trong nhà (`d.name = \"Lu\"`) thì bên ngoài cũng thấy. Nhưng nếu method xé tờ copy rồi viết địa chỉ mới (`d = new Dog(\"Lu\")`) thì tờ gốc vẫn chỉ nhà cũ.",
      "Bấm từng lệnh để xem stack (các biến) và heap (các object) thay đổi.",
    ],
    predict: {
      question: "`d` trỏ tới `Dog(\"Milu\")`. `rename(d)` làm `d.name = \"Lu\"`, `reassign(d)` làm `d = new Dog(\"Lu\")`. Method nào đổi được `d.name` ở `main()`?",
      options: ["Chỉ `rename`", "Chỉ `reassign`", "Cả hai", "Không method nào"],
      answer: 0,
      explain: "Cả hai nhận bản copy của địa chỉ. `rename` sửa đồ trong ngôi nhà chung nên bên ngoài thấy. `reassign` chỉ viết địa chỉ mới lên tờ copy, tờ gốc ở `main()` vẫn chỉ `Milu`.",
    },
    widget: "memory",
    widgetTitle: "Bộ nhớ: stack và heap",
    after: [
      "Chạy thật: sau `reassign(d)` thì `d.name` vẫn là `Milu`; sau `rename(d)` thì thành `Lu`.",
    ],
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
    takeaway: {
      title: "Chuỗi nhân quả cần nhớ",
      lines: [
        "Logic nằm ở service → quy tắc rải ở mọi nơi dùng → quên một nơi là số dư âm. Đưa quy tắc vào object thì chỉ còn một cửa.",
      ],
    },
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
      "Cách sửa: bỏ quan hệ kế thừa, cho cả hai cùng implement `interface Shape { int area(); }`. Không còn setter để ai làm sai ý nghĩa. Đa hình vẫn còn nguyên, chỉ không cần class cha. Bài Java 17 và 21 sẽ cho thấy cách viết gọn hơn nữa bằng `sealed` và `record`.",
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
    parts: [
      {
        id: "strategy",
        title: "Strategy: đổi một phần hành vi mà không tạo lớp con",
        intro: [
          "Khi bạn muốn đổi **một phần hành vi** (cách tính phí giao hàng, cách giảm giá), đừng tạo lớp con `ExpressOrder`, `StandardOrder`. Mỗi cách tính mới lại thêm một lớp con, và một đơn hàng không đổi được cách tính khi đang chạy.",
          "Thay vào đó, tách phần hay đổi thành một interface, gọi là **Strategy**, ví dụ `interface FeePolicy { long fee(long km); }`, rồi `Order` **giữ** một `FeePolicy` trong field. Muốn cách tính mới thì thêm một class implement interface đó, `Order` không đổi.",
          "Đây là đa hình bằng composition, đúng quy tắc ở Phần 3, và là cách Spring inject các bean. Mở tab Strategy ở widget phía trên để đổi cách tính phí.",
        ],
        quiz: {
          question: "Đơn hàng cần nhiều cách tính phí giao hàng (tiêu chuẩn, hoả tốc, miễn phí). Cách nào linh hoạt nhất?",
          options: [
            "Tạo lớp con StandardOrder, ExpressOrder, FreeOrder",
            "Tách interface FeePolicy, mỗi cách tính một class, Order giữ FeePolicy trong field",
            "Một method fee() với chuỗi if / else theo loại",
            "Cho Order kế thừa từ FeePolicy",
          ],
          answer: 1,
          explain: "Strategy để Order giữ hành vi trong field: thêm cách tính mới chỉ là thêm class, và đổi được cách tính lúc chạy. Lớp con thì chốt cứng lúc compile.",
        },
      },
    ],
  },
  {
    id: "rental-capstone",
    title: "Phần 12: Tổng hợp: hệ thống thuê xe",
    scene: "cap",
    intro: [
      "Giờ ghép các mảnh vào một hệ thống nhỏ: thuê xe. Mỗi tính chất làm đúng một việc:",
      "- **Abstraction + Inheritance**: `abstract class Vehicle` giữ biển số chung, khai báo `abstract long dailyRate()`.",
      "- **Polymorphism**: `Motorbike` trả 150.000, `Car` trả 700.000, code tính tiền chỉ gọi `vehicle.dailyRate()`.",
      "- **Strategy**: giảm giá là interface `Discount` (không giảm, giảm 10% khi thuê từ 7 ngày), `Booking` giữ nó trong field thay vì có thêm lớp con.",
      "- **Encapsulation**: `Booking` có field private, constructor từ chối `to` không sau `from`, và `cancel()` khiến `total()` ném lỗi, nên không có booking ở trạng thái vô nghĩa.",
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
