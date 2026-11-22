import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Behavioral2.java: handler chain, Iterator with ConcurrentModificationException, chat mediator, record memento, Visitor vs sealed switch, expression tree).
export const patternsBehavioral2: Lesson = {
  slug: "patterns-behavioral-2",
  crumb: "Behavioral Patterns 2",
  videoDir: "/videos/patterns-behavioral-2",
  videoVersion: "0",
  scenes: [],
  title: "Design Patterns 4: Behavioral, phân chia trách nhiệm (2)",
  subtitle:
    "Chain of Responsibility, Iterator, Mediator, Memento, Visitor, Interpreter. Sáu pattern còn lại của nhóm Behavioral: ít gặp hơn nhưng hay có trong JDK và Spring.",
  openingQuiz: {
    question: "Servlet Filter chain và Spring Security filter chain là ví dụ của pattern nào?",
    options: ["Chain of Responsibility", "Singleton", "Prototype", "Flyweight"],
    answer: 0,
    explain: "Yêu cầu đi qua một chuỗi filter. Mỗi filter tự quyết định xử lý và dừng, hoặc cho qua filter kế tiếp.",
  },
  roadmap: [
    "Chặng 1: Chain of Responsibility và Iterator. Chuỗi xử lý, và duyệt mà không lộ cấu trúc.",
    "Chặng 2: Mediator và Memento. Một người điều phối, và lưu rồi khôi phục trạng thái.",
    "Chặng 3: Visitor, Interpreter và bảng nhớ chọn pattern.",
  ],
  sections: [
    {
      id: "chain",
      title: "Chain of Responsibility: chuyền yêu cầu qua chuỗi xử lý",
      intro: [
        "**Chain of Responsibility** chuyền yêu cầu qua một chuỗi handler. Mỗi handler tự quyết **xử lý và dừng**, hay **cho qua** handler kế tiếp. Ví dụ: xác thực, giới hạn tốc độ, kiểm tra dữ liệu.",
        "Đây chính là **filter chain** của Servlet và Spring Security.",
      ],
      widgetTitle: "Kiểm tra một yêu cầu HTTP",
      compare: [
        way(
          "Một hàm if dài",
          `String handle(Req r) {
  if (r.token() == null) return "401";
  if (r.callsThisMinute() > 100) return "429";
  if (r.body().isBlank()) return "400";      // thêm bước: sửa hàm lớn
  return "200";
}`,
          [
            ask("Thêm bước kiểm tra IP", bad("Mở hàm lớn ra và chen vào đúng thứ tự.")),
            ask("Bật tắt một bước theo môi trường", bad("Thêm cờ `if` vào hàm.")),
          ],
          "Mọi bước dồn trong một hàm, khó thêm, bớt hay đổi thứ tự.",
        ),
        way(
          "Chain of Responsibility",
          `interface Handler { Optional<String> handle(Req r); }   // có kết quả: dừng. Rỗng: cho qua
List<Handler> chain = List.of(auth, rateLimit, validate);
for (Handler h : chain) { var out = h.handle(r); if (out.isPresent()) return out.get(); }
return "200 handled";`,
          [
            ask("Chạy 4 request mẫu", ok("Đã chạy: không token ra `401 no token`, 500 lần/phút ra `429 too many requests`, body rỗng ra `400 empty body`, hợp lệ ra `200 handled`.")),
            ask("Thêm bước kiểm tra IP", ok("Thêm một handler vào danh sách.")),
            ask("Bật tắt một bước theo môi trường", ok("Dựng danh sách theo config hoặc profile, bỏ handler không cần ra khỏi list; không handler nào phải sửa. Đã chạy: request 500 lần/phút qua chain `[auth, rateLimit, validate]` ra `429 too many requests`, qua chain dev `[auth, validate]` ra `200 handled`.")),
          ],
          "Mỗi bước là một handler độc lập, thêm bớt hay đổi thứ tự rất dễ.",
        ),
      ],
      after: [
        "Gặp: `javax.servlet.Filter`, Spring `HandlerInterceptor`, Spring Security filter chain, các mức log.",
      ],
      trap: {
        title: "Thứ tự handler quyết định kết quả",
        text: "Xác thực trước, rồi giới hạn tốc độ, rồi mới kiểm tra dữ liệu. Đảo thứ tự có thể tốn tài nguyên cho yêu cầu đáng lẽ bị chặn sớm, hoặc để lộ thông tin cho người chưa xác thực.",
      },
      quiz: {
        question: "Trong Chain of Responsibility, một handler có thể làm gì với yêu cầu?",
        options: [
          "Xử lý rồi dừng, hoặc cho qua handler kế tiếp",
          "Chỉ được xử lý, không được cho qua",
          "Luôn phải gọi mọi handler",
          "Chỉ được log",
        ],
        answer: 0,
        explain: "Mỗi handler tự quyết dừng hay cho qua. Đó là điểm khác với chuỗi gọi bắt buộc.",
      },
    },
    {
      id: "iterator",
      title: "Iterator: duyệt mà không lộ cấu trúc bên trong",
      intro: [
        "**Iterator** cho phép duyệt các phần tử của một tập hợp mà **không cần biết** nó là mảng, danh sách liên kết hay cây. Trong Java: `Iterable` và `Iterator`, và vòng `for-each` dùng đúng chúng.",
      ],
      widgetTitle: "Duyệt một khoảng số",
      compare: [
        way(
          "Tự viết vòng duyệt",
          `// người dùng phải biết cấu trúc bên trong
for (int i = from; i < to; i++) { ... }      // mỗi cấu trúc một kiểu duyệt`,
          [
            ask("Đổi cấu trúc dữ liệu (mảng sang cây)", bad("Sửa mọi vòng duyệt ở nơi dùng.")),
            ask("Dùng for-each", bad("Không dùng được vì class không là `Iterable`.")),
          ],
          "Cách duyệt gắn chặt với cấu trúc dữ liệu.",
        ),
        way(
          "Iterator",
          `class Range implements Iterable<Integer> {
  public Iterator<Integer> iterator() {
    return new Iterator<>() {
      int cur = from;
      public boolean hasNext() { return cur < to; }
      public Integer next() { return cur++; }
    };
  }
}
for (int i : new Range(1, 5)) sum += i;`,
          [
            ask("Đổi cấu trúc dữ liệu", ok("Chỉ viết lại `iterator()`, nơi dùng không đổi.")),
            ask("Dùng for-each", ok("Dùng được. Đã chạy: `sum 1..4 = 10`.")),
          ],
          "Nơi dùng chỉ biết `Iterable`, không biết cấu trúc bên trong.",
        ),
      ],
      after: [
        "`List`, `Set`, `Map.entrySet()` đều trả về `Iterator`. Muốn xoá phần tử khi duyệt thì dùng `iterator.remove()`: đã chạy, xoá `2` khỏi `[1, 2, 3, 4]` ra `[1, 3, 4]`.",
      ],
      trap: {
        title: "Xoá trong for-each (fail-fast)",
        text: "Gọi `list.remove()` giữa lúc `for-each` ném `ConcurrentModificationException`. Đã chạy: xoá `2` trong `[1, 2, 3, 4]` bị lỗi. Riêng xoá phần tử **gần cuối** (xoá `2` trong `[1, 2, 3]`) lại không báo lỗi. Lý do: việc kiểm tra list bị sửa nằm trong `next()`, còn sau khi xoá thì size còn 2, bằng đúng vị trí con trỏ, nên `hasNext()` trả `false` và vòng lặp dừng trước khi kịp gọi `next()`. Vì vậy lỗi lúc có lúc không (xem bài Collections).",
      },
      quiz: {
        question: "Cách an toàn để xoá phần tử khi đang duyệt một `List`?",
        options: [
          "`list.remove()` bên trong for-each",
          "`iterator.remove()`",
          "Dùng thêm một thread khác",
          "Không thể xoá",
        ],
        answer: 1,
        explain: "`Iterator.remove()` cập nhật cả danh sách lẫn trạng thái của iterator nên không gây `ConcurrentModificationException`.",
      },
    },
    {
      id: "mediator",
      title: "Mediator: một người điều phối thay vì nói chuyện chéo",
      intro: [
        "**Mediator** gom việc giao tiếp giữa nhiều object vào **một object trung gian**, để chúng không phải biết nhau. N object nói chuyện chéo cần N × (N - 1) liên kết, qua mediator chỉ còn N.",
      ],
      widgetTitle: "Phòng chat",
      compare: [
        way(
          "Nói chuyện chéo",
          `an.add(binh);   an.add(chi);       // mỗi người giữ tham chiếu tới mọi người còn lại
binh.add(an);   binh.add(chi);`,
          [
            ask("Thêm thành viên mới", bad("Phải sửa **mọi** thành viên cũ để biết người mới.")),
            ask("Đổi quy tắc gửi tin", bad("Quy tắc nằm rải rác trong từng người.")),
          ],
          "Mọi object phụ thuộc vào mọi object khác.",
        ),
        way(
          "Mediator",
          `room.join("an"); room.join("binh"); room.join("chi");
room.send("an", "hi all");       // ChatRoom quyết định ai nhận`,
          [
            ask("Thêm thành viên mới", ok("Chỉ `room.join(...)`, thành viên cũ không đổi.")),
            ask("Đổi quy tắc gửi tin", ok("Sửa trong `ChatRoom`. Đã chạy: `{an=[], binh=[an: hi all], chi=[an: hi all]}` (người gửi không nhận lại).")),
          ],
          "Mỗi object chỉ biết mediator, quy tắc nằm một chỗ.",
        ),
      ],
      after: [
        "Gặp: phòng chat, đài kiểm soát không lưu (máy bay không nói chuyện với nhau mà qua đài), message broker. Khác Observer: Observer **một chiều, một tới nhiều**. Mediator **hai chiều** và có logic điều phối.",
      ],
      trap: {
        title: "Mediator thành God class",
        text: "Dồn mọi logic vào mediator thì nó phình to. Chỉ để nó **điều phối** việc ai nói với ai.",
      },
      quiz: {
        question: "Mediator giải quyết vấn đề gì?",
        options: [
          "Quá nhiều liên kết trực tiếp giữa các object",
          "Tạo object tốn kém",
          "Thiếu bộ nhớ",
          "Cần đúng một instance",
        ],
        answer: 0,
        explain: "Các object chỉ giao tiếp qua mediator, nên không còn phụ thuộc chéo lẫn nhau.",
      },
    },
    {
      id: "memento",
      title: "Memento: lưu và khôi phục trạng thái",
      intro: [
        "**Memento** chụp lại trạng thái của object vào một object **bất biến**, để khôi phục sau (undo, checkpoint), mà không phá đóng gói.",
      ],
      widgetTitle: "Hộp soạn thảo có checkpoint",
      compare: [
        way(
          "Lộ field ra ngoài để sao lưu",
          `String backup = box.text;      // lộ field nội bộ
box.text = backup;             // ai cũng sửa được trạng thái`,
          [
            ask("Thêm field mới vào trạng thái", bad("Mọi nơi tự sao lưu phải sửa theo.")),
            ask("Kiểm soát cái gì được lưu", bad("Không kiểm soát được vì field bị lộ.")),
          ],
          "Bên ngoài biết và đụng vào chi tiết nội bộ.",
        ),
        way(
          "Memento",
          `record Snapshot(String text) {}          // bất biến
Snapshot save() { return new Snapshot(text); }
void restore(Snapshot s) { text = s.text(); }`,
          [
            ask("Thêm field mới vào trạng thái", ok("Chỉ sửa `save()` và `restore()` trong chính class.")),
            ask("Khôi phục", ok("Đã chạy: gõ `Hello`, lưu, gõ thêm ` world` ra `Hello world`. `restore` đưa về `Hello`.")),
          ],
          "Chỉ chính object biết cách lưu và khôi phục trạng thái của mình.",
        ),
      ],
      after: [
        "Memento hay đi cùng Command để làm undo: Command đảo thao tác, Memento khôi phục nguyên trạng thái. Rollback của transaction cùng ý tưởng là quay về trạng thái trước.",
      ],
      trap: {
        title: "Lưu quá nhiều tốn bộ nhớ",
        text: "Mỗi snapshot là một bản sao. Chụp sau mỗi phím gõ cho văn bản 1MB sẽ ngốn bộ nhớ. Giới hạn số bản, hoặc chỉ lưu **phần thay đổi** (delta).",
      },
      quiz: {
        question: "Vì sao Memento thường là object bất biến?",
        options: [
          "Để snapshot không bị sửa lén, khôi phục luôn đúng trạng thái đã lưu",
          "Để chạy nhanh hơn",
          "Để dùng được reflection",
          "Vì Java bắt buộc",
        ],
        answer: 0,
        explain: "Nếu snapshot đổi được thì không còn là bản chụp đáng tin để quay về.",
      },
    },
    {
      id: "visitor",
      title: "Visitor: thêm thao tác mới mà không sửa các class",
      intro: [
        "**Visitor** tách **thao tác** khỏi cấu trúc object. Mỗi class hình chỉ có một method `accept(visitor)`, viết một lần. Mỗi thao tác mới (tính diện tích, xuất JSON) là một class visitor mới, có một method cho mỗi loại hình.",
        "Cơ chế gọi là **double dispatch** (chọn method hai lần). Gọi `shape.accept(v)`: lần một, Java chọn `accept` theo kiểu thật của shape (`Circle` hay `Rect`). Bên trong, `Circle.accept` gọi `v.visitCircle(this)`: lần hai, Java chọn `visitCircle` theo kiểu thật của visitor (`AreaVisitor` hay `JsonVisitor`). Hai lần chọn đó đưa tới đúng code cho đúng cặp (hình, thao tác) mà không cần `instanceof`.",
        "Java 21 có cách ngắn hơn: **`sealed` interface kết hợp `switch`** theo kiểu. Ví dụ dưới dùng hai hình: một hình tròn bán kính 1 và một hình chữ nhật 2 × 3.",
      ],
      widgetTitle: "Thêm thao tác cho các hình",
      compare: [
        way(
          "Thêm method vào từng class",
          `// muốn thêm thao tác "xuất JSON": sửa Circle, Rect, và mọi hình khác
class Circle { double area() {...}  String toJson() {...} }`,
          [
            ask("Thêm thao tác mới", bad("Sửa **từng** class hình.")),
          ],
          "Mỗi thao tác mới chạm vào mọi class trong cây.",
        ),
        way(
          "Visitor, hoặc sealed + switch",
          `interface Visitor<R> { R visitCircle(Circle c); R visitRect(Rect r); }
interface Shape { <R> R accept(Visitor<R> v); }
record Circle(double r) implements Shape {
  public <R> R accept(Visitor<R> v) { return v.visitCircle(this); }   // tự gọi đúng method của mình
}
record Rect(double w, double h) implements Shape {
  public <R> R accept(Visitor<R> v) { return v.visitRect(this); }
}
class AreaVisitor implements Visitor<Double> {
  public Double visitCircle(Circle c) { return Math.PI * c.r() * c.r(); }
  public Double visitRect(Rect r)     { return r.w() * r.h(); }
}
// Java 21: compiler kiểm tra xử lý đủ các trường hợp
sealed interface Fig permits Circ, Rec {}
static double area(Fig f) { return switch (f) { case Circ c -> ...; case Rec r -> ...; }; }`,
          [
            ask("Thêm thao tác mới", ok("Viết visitor mới hay hàm `switch` mới, các class hình không đổi. Đã chạy với hình tròn r = 1 và hình chữ nhật 2 × 3: `AreaVisitor` và `switch` cùng ra tổng diện tích `9.14` (π + 6). Thêm `JsonVisitor` ra `{\"circle\":1.0}` và `{\"rect\":[2.0,3.0]}`.")),
            ask("Thêm loại hình mới", bad("Visitor phải sửa **mọi** visitor đang có."), ok("Với `sealed` + `switch`, compiler **báo lỗi** ngay chỗ chưa xử lý nên không sót.")),
          ],
          "Visitor dễ thêm thao tác, khó thêm loại hình. Kế thừa thông thường thì ngược lại: dễ thêm loại hình (một class con mới), khó thêm thao tác (sửa mọi class).",
        ),
      ],
      after: [
        "Lưu ý: Visitor cổ điển vẫn cần `accept()` trong mỗi class hình, nên không áp được cho class thư viện mà bạn không sửa được. Khi đó `sealed` cũng không dùng được; còn lại cách `switch` với `instanceof` pattern, chịu mất phần compiler kiểm tra đủ trường hợp.",
        "Gặp: `FileVisitor` của `Files.walkFileTree`, trình biên dịch duyệt cây cú pháp.",
      ],
      trap: {
        title: "Visitor khi cấu trúc hay đổi",
        text: "Mỗi loại hình mới buộc sửa mọi visitor. Chỉ dùng khi **cấu trúc ổn định** còn thao tác thì hay thêm.",
      },
      quiz: {
        question: "Visitor tiện nhất trong tình huống nào?",
        options: [
          "Cây class ổn định, và cần thêm nhiều thao tác mới",
          "Hay thêm loại class mới, thao tác thì cố định",
          "Cần đúng một instance",
          "Cần tạo object tốn kém",
        ],
        answer: 0,
        explain: "Thêm thao tác chỉ là thêm một visitor. Ngược lại, thêm loại class mới phải sửa mọi visitor.",
      },
    },
    {
      id: "interpreter",
      title: "Interpreter: biểu diễn ngữ pháp thành cây",
      intro: [
        "**Interpreter** biểu diễn một ngôn ngữ nhỏ (luật, biểu thức) thành **cây object**, mỗi nút biết tự tính giá trị. Ví dụ `(2 + 3) * 4`.",
        "Hiếm khi tự viết trong thực tế, thường dùng thư viện có sẵn.",
        "Lưu ý khi so sánh bên dưới: Interpreter **không** lo việc đọc chuỗi `\"(2+3)*4\"`. Cần một parser riêng dựng chuỗi thành cây; Interpreter chỉ là phần cây tự tính giá trị. Ví dụ dựng cây bằng tay để thấy phần đó.",
      ],
      widgetTitle: "Tính biểu thức (2 + 3) * 4",
      compare: [
        way(
          "Phân tích chuỗi bằng tay",
          `// phân tích "(2+3)*4" bằng if, substring và vòng lặp lồng nhau`,
          [
            ask("Thêm phép trừ", bad("Sửa bộ phân tích chuỗi, dễ hỏng thứ tự ưu tiên.")),
            ask("Tái sử dụng biểu thức", bad("Phân tích lại từ chuỗi mỗi lần tính.")),
          ],
          "Logic phân tích và tính toán lẫn vào nhau.",
        ),
        way(
          "Interpreter",
          `interface Expr { int eval(); }
record Num(int v) implements Expr { public int eval() { return v; } }
record Add(Expr l, Expr r) implements Expr { public int eval() { return l.eval() + r.eval(); } }
new Mul(new Add(new Num(2), new Num(3)), new Num(4)).eval();`,
          [
            ask("Thêm phép trừ", ok("Thêm `record Sub`, các nút khác không đổi.")),
            ask("Tính biểu thức", ok("Đã chạy: `(2 + 3) * 4 = 20`. Cây dựng một lần, tính nhiều lần.")),
          ],
          "Mỗi quy tắc ngữ pháp là một class, thêm quy tắc không đụng nút cũ.",
        ),
      ],
      after: [
        "Gặp: `Pattern` (regex), Spring Expression Language (SpEL) trong `@Value(\"#{...}\")` và `@PreAuthorize(\"hasRole('ADMIN')\")`.",
      ],
      trap: {
        title: "Ngữ pháp lớn dần",
        text: "Mỗi quy tắc là một class, nên ngữ pháp lớn thì rất nhiều class. Khi đó hãy dùng thư viện hay bộ sinh parser (ANTLR, SpEL) thay vì tự viết.",
      },
      quiz: {
        question: "Spring Expression Language (SpEL) gần với pattern nào nhất?",
        options: ["Interpreter", "Singleton", "Flyweight", "Prototype"],
        answer: 0,
        explain: "SpEL phân tích biểu thức thành cây rồi tính, đúng ý tưởng của Interpreter.",
      },
    },
    {
      id: "cheatsheet",
      title: "Bảng nhớ và chọn pattern",
      intro: ["Bấm từng dòng để xem câu nên nói ra miệng."],
      widgetTitle: "Bảng nhớ Behavioral (2)",
      cheat: [
        { name: "Chain of Responsibility", one: "Chuyền yêu cầu qua chuỗi handler.", say: "Mỗi handler tự quyết xử lý và dừng, hay cho qua. Filter chain của Servlet và Spring Security là ví dụ, và thứ tự handler quyết định kết quả." },
        { name: "Iterator", one: "Duyệt không lộ cấu trúc.", say: "Em implement Iterable để dùng được for-each. Muốn xoá khi duyệt thì dùng iterator.remove(), vì list.remove() trong for-each gây ConcurrentModificationException." },
        { name: "Mediator", one: "Một người điều phối.", say: "Thay vì các object nói chuyện chéo, chúng chỉ nói với mediator. Em giữ mediator chỉ điều phối để nó không thành God class." },
        { name: "Memento", one: "Lưu và khôi phục trạng thái.", say: "Snapshot là object bất biến do chính object tạo, nên khôi phục không phá đóng gói. Em giới hạn số snapshot hoặc lưu delta để đỡ tốn bộ nhớ." },
        { name: "Visitor", one: "Thêm thao tác, không sửa class.", say: "Visitor dễ thêm thao tác nhưng khó thêm loại class. Với Java 21, sealed interface kết hợp switch cho compiler kiểm tra đủ trường hợp." },
        { name: "Interpreter", one: "Ngữ pháp thành cây.", say: "Mỗi quy tắc là một class tự tính giá trị. Em ít khi tự viết, thường dùng SpEL hay regex. Ngữ pháp lớn thì dùng parser generator." },
      ],
      quiz: {
        question: "Chọn câu ĐÚNG về Observer và Mediator.",
        options: [
          "Observer một chiều, một tới nhiều. Mediator hai chiều và có logic điều phối",
          "Hai pattern hoàn toàn giống nhau",
          "Mediator luôn nhanh hơn Observer",
          "Observer chỉ dùng cho I/O",
        ],
        answer: 0,
        explain: "Observer phát sự kiện một chiều. Mediator là điểm trung gian xử lý giao tiếp hai chiều giữa nhiều object.",
      },
    },
    {
      id: "chon-pattern",
      title: "Bài tập: tình huống này dùng pattern nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn pattern phù hợp rồi xem lý do."],
      widgetTitle: "Chọn pattern Behavioral (2)",
      drill: {
        choices: ["Chain of Responsibility", "Iterator", "Mediator", "Memento", "Visitor", "Interpreter"],
        summary: "Dấu hiệu: chuỗi xử lý, duyệt, điều phối, lưu trạng thái, thêm thao tác, hay ngữ pháp.",
        items: [
          { q: "Yêu cầu HTTP đi qua xác thực, giới hạn tốc độ, rồi kiểm tra dữ liệu, mỗi bước có thể chặn lại.", a: "Chain of Responsibility", why: "Chuỗi handler, mỗi handler dừng hoặc cho qua." },
          { q: "Muốn dùng `for-each` trên một cấu trúc dữ liệu tự viết.", a: "Iterator", why: "Implement `Iterable` để duyệt không lộ cấu trúc." },
          { q: "Nhiều thành viên chat, thêm người mới mà không phải sửa các thành viên cũ.", a: "Mediator", why: "Mọi tin nhắn đi qua một phòng chat trung gian." },
          { q: "Soạn thảo cần checkpoint để quay về trạng thái trước đó.", a: "Memento", why: "Chụp trạng thái vào object bất biến rồi khôi phục." },
          { q: "Cây hình ổn định, nhưng thường xuyên cần thêm thao tác mới như xuất JSON, tính diện tích.", a: "Visitor", why: "Mỗi thao tác mới là một visitor, không sửa các class hình." },
          { q: "Tính giá trị biểu thức `(2 + 3) * 4` bằng cây object.", a: "Interpreter", why: "Mỗi nút của ngữ pháp tự tính giá trị." },
        ],
      },
    },
  ],
  cards: [
    { q: "Filter chain của Servlet là pattern nào?", a: "Chain of Responsibility. Mỗi filter xử lý và dừng, hoặc gọi filter kế tiếp. Thứ tự filter quyết định kết quả." },
    { q: "Vì sao list.remove() trong for-each gây lỗi?", a: "for-each dùng Iterator fail-fast, phát hiện danh sách bị sửa ngoài iterator nên ném ConcurrentModificationException. Dùng iterator.remove(). Xoá phần tử gần cuối có thể không báo lỗi." },
    { q: "Mediator khác Observer thế nào?", a: "Observer một chiều, một tới nhiều, publisher không biết subscriber. Mediator là điểm trung gian hai chiều, có logic điều phối." },
    { q: "Memento khác Command ở đâu?", a: "Command đảo thao tác bằng undo. Memento khôi phục nguyên trạng thái đã chụp. Hai pattern hay dùng cùng nhau cho undo." },
    { q: "Khi nào Visitor hợp lý?", a: "Cấu trúc class ổn định, thao tác hay thêm. Thêm loại class mới thì phải sửa mọi visitor. Java 21: sealed + switch cho compiler kiểm tra đủ trường hợp." },
    { q: "SpEL gần pattern nào?", a: "Interpreter: biểu thức được phân tích thành cây rồi tính. Ngữ pháp lớn thì dùng thư viện thay vì tự viết." },
  ],
  modelAnswer:
    "Chain of Responsibility chuyền yêu cầu qua chuỗi handler, mỗi handler dừng hoặc cho qua, như filter chain của Servlet. Iterator cho duyệt mà không lộ cấu trúc, em dùng iterator.remove() khi xoá lúc duyệt. Mediator đưa giao tiếp chéo vào một điểm trung gian, em giữ nó chỉ điều phối. Memento lưu trạng thái vào object bất biến để khôi phục, hay đi cùng Command cho undo. Visitor dễ thêm thao tác nhưng khó thêm loại class, và Java 21 có sealed kết hợp switch để compiler kiểm tra đủ trường hợp. Interpreter biểu diễn ngữ pháp thành cây như SpEL, ngữ pháp lớn thì dùng thư viện.",
};
