import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Creational.java: Singleton race, enum vs reflection, builder validation, shallow vs deep copy).
export const patternsCreational: Lesson = {
  slug: "patterns-creational",
  crumb: "Creational Patterns",
  videoDir: "/videos/patterns-creational",
  videoVersion: "0",
  scenes: [],
  title: "Design Patterns 1: Creational, tạo object",
  subtitle:
    "Singleton, Factory Method, Abstract Factory, Builder, Prototype. Mỗi pattern có code chạy thật trên JDK 21, so sánh khi không dùng và khi dùng pattern, và bẫy hay bị hỏi.",
  openingQuiz: {
    question: "Design pattern là gì?",
    options: [
      "Một thư viện bắt buộc phải thêm vào dự án",
      "Giải pháp đã được kiểm chứng cho một vấn đề thiết kế hay gặp, kèm tên gọi chung để trao đổi",
      "Cú pháp riêng của Java",
      "Công cụ tự sinh code",
    ],
    answer: 1,
    explain: "Pattern không phải code có sẵn mà là một khuôn giải pháp. Giá trị lớn nhất là ngôn ngữ chung: nói \"Factory\" hay \"Observer\" là cả nhóm hiểu ngay.",
  },
  roadmap: [
    "Chặng 1: Singleton và Factory Method. Một instance duy nhất, và để class con quyết định tạo gì.",
    "Chặng 2: Abstract Factory và Builder. Tạo cả họ object khớp nhau, và dựng object nhiều tham số.",
    "Chặng 3: Prototype và bảng nhớ chọn pattern.",
  ],
  sections: [
    {
      id: "singleton",
      title: "Singleton: một instance duy nhất",
      intro: [
        "**Singleton**: cả ứng dụng chỉ có **một** instance của class, và có điểm truy cập chung. Dùng cho thứ dùng chung như cấu hình hay connection pool.",
        "Cách viết lazy ngây thơ (`if (inst == null) inst = new ...`) **không an toàn khi nhiều thread**. Thử cả hai cách viết.",
      ],
      widgetTitle: "Singleton an toàn thread",
      compare: [
        way(
          "Lazy, không đồng bộ",
          `class LazyBad {
  private static LazyBad inst;
  private LazyBad() {}
  static LazyBad get() {
    if (inst == null) inst = new LazyBad();   // hai thread cùng thấy null
    return inst;
  }
}`,
          [
            ask("8 thread gọi get() cùng lúc", bad("Đã chạy: constructor bị gọi **nhiều hơn 1 lần**, tức là tạo ra nhiều instance.")),
            ask("Dùng reflection", bad("`setAccessible(true)` rồi `newInstance()` vẫn tạo thêm một instance dù constructor là `private`. Đã chạy: instance mới khác instance gốc.")),
          ],
          "Singleton phải bảo đảm đúng một instance dù nhiều thread hay reflection. Cách viết lazy đơn giản không bảo đảm điều đó.",
        ),
        way(
          "Holder idiom hoặc enum",
          `class Holder {
  private Holder() {}
  private static class H { static final Holder I = new Holder(); }   // JVM chỉ nạp H khi cần, an toàn thread
  static Holder get() { return H.I; }
}
enum Config { INSTANCE; int port = 8080; }   // ngắn nhất, chống cả reflection`,
          [
            ask("8 thread gọi get() cùng lúc", ok("Đã chạy: constructor chỉ được gọi **1 lần**. JVM bảo đảm việc nạp class là an toàn thread.")),
            ask("Dùng reflection", ok("Với enum: `IllegalArgumentException: Cannot reflectively create enum objects`. Holder thì **không** chặn được: đã chạy `setAccessible(true)` rồi `newInstance()` trên `Holder`, instance mới khác `Holder.get()`.")),
            ask("Serialize rồi deserialize", ok("Deserialize (đọc object từ byte) tạo ra một object mới mà không gọi constructor. Đã chạy: Holder `implements Serializable` sau một lượt ghi rồi đọc thì ra instance **khác**; enum thì ra **đúng** `INSTANCE` cũ.")),
          ],
          "Holder idiom và enum cho đúng một instance mà không cần `synchronized`. Chỉ enum chặn được thêm cả reflection và serialization.",
        ),
      ],
      after: [
        "Trong Spring, bean mặc định đã là singleton do **container** quản lý, nên hiếm khi cần tự viết. Singleton viết tay là trạng thái toàn cục nên khó test.",
      ],
      trap: {
        title: "Double-checked locking thiếu volatile",
        text: "Double-checked locking: `if (inst == null) { synchronized (X.class) { if (inst == null) inst = new X(); } } return inst;` (kiểm tra một lần không khoá cho nhanh, rồi kiểm tra lại trong khoá cho đúng). Biến `inst` phải là `volatile`. Lý do: `new X()` gồm ba việc: cấp phát bộ nhớ, chạy constructor, gán tham chiếu vào `inst`. CPU và {{jit|JIT}} được phép đảo thứ tự, gán tham chiếu trước khi constructor xong. Thread khác ở lần kiểm tra ngoài (không khoá) thấy `inst != null` và dùng một object chưa khởi tạo xong. `volatile` cấm việc đảo thứ tự đó. Dùng Holder idiom hoặc enum cho đỡ rủi ro.",
      },
      quiz: {
        question: "Cách nào tạo Singleton an toàn thread và chống reflection ngắn gọn nhất?",
        options: ["Lazy với `if (inst == null)`", "Enum một phần tử", "Biến `static` không `final`", "Constructor `public`"],
        answer: 1,
        explain: "Enum được JVM bảo đảm một instance và chặn tạo bằng reflection (đã chạy: Cannot reflectively create enum objects).",
      },
    },
    {
      id: "factory-method",
      title: "Factory Method: tách việc new ra khỏi nơi dùng",
      intro: [
        "**Factory Method** đưa việc `new` vào một method, để nơi dùng chỉ biết **interface** chứ không biết class cụ thể. Theo định nghĩa gốc của GoF, method đó là **abstract** ở class cha, và **class con quyết định** tạo object nào bằng cách override nó.",
        "Không dùng thì `new Email()` và `new Sms()` rải khắp nơi. Thêm kênh mới phải đi sửa từng chỗ.",
      ],
      widgetTitle: "Thêm kênh thông báo Zalo",
      compare: [
        way(
          "new rải rác",
          `class OrderService {
  void done(String channel, String msg) {
    if (channel.equals("email")) new Email().send(msg);
    else if (channel.equals("sms")) new Sms().send(msg);   // thêm Zalo: sửa tiếp
  }
}`,
          [
            ask("Thêm kênh Zalo", bad("Phải sửa `OrderService` và mọi chỗ khác có chuỗi `if` giống vậy.")),
            ask("Viết unit test", bad("Không thay được bằng bản giả vì `new` nằm cứng trong code.")),
          ],
          "Nơi dùng biết hết các class cụ thể, nên mỗi lần thêm loại mới là một lần sửa lan rộng.",
        ),
        way(
          "Factory Method",
          `abstract class Notifier {
  abstract Notification create();            // factory method
  String notifyUser(String m) { return create().send(m); }
}
class EmailNotifier extends Notifier { Notification create() { return new Email(); } }
class SmsNotifier   extends Notifier { Notification create() { return new Sms(); } }

// chuỗi if biến đi đâu? Chọn một lần, ở một chỗ (config hoặc Spring DI)
Map<String, Notifier> byChannel = Map.of("email", new EmailNotifier(), "sms", new SmsNotifier());
byChannel.get(channel).notifyUser(msg);`,
          [
            ask("Thêm kênh Zalo", ok("Viết `ZaloNotifier` mới và thêm một dòng `\"zalo\"` vào `byChannel`, chỗ duy nhất biết các kênh. `Notifier` và `OrderService` **không đổi**. Đã chạy: `byChannel.get(\"email\").notifyUser(\"hi\")` trả `email: hi`, với `\"sms\"` trả `sms: hi`.")),
            ask("Viết unit test", ok("Truyền một `Notifier` giả trả `Notification` giả, không cần gửi thật.")),
          ],
          "Nơi dùng chỉ phụ thuộc interface. Loại mới chỉ là một class mới.",
        ),
      ],
      after: [
        "Ví dụ GoF thật trong JDK: `Collection.iterator()`. `Collection` khai báo method, còn mỗi class con (`ArrayList`, `HashSet`...) tự quyết định tạo iterator nào.",
        "Còn `Calendar.getInstance()`, `List.of()`, `Integer.valueOf()` là **static factory method**: một method tĩnh trả về object, không có class con nào override. Đó là dạng **simple factory**, không phải Factory Method của GoF; phỏng vấn hay bắt lỗi chỗ này. Simple factory (một method tĩnh có `switch`) thường là đủ dùng.",
      ],
      trap: {
        title: "Factory cho mọi class",
        text: "Chỉ có một implementation và không đổi thì cứ `new`. Pattern phục vụ thay đổi, không phải để thêm class cho đủ bộ (YAGNI).",
      },
      quiz: {
        question: "Khi nào Factory Method đáng dùng?",
        options: [
          "Mọi class đều cần một factory",
          "Khi nơi dùng chỉ nên biết interface, còn loại cụ thể có thể thêm hoặc đổi",
          "Khi muốn class chạy nhanh hơn",
          "Khi dự án dùng Spring",
        ],
        answer: 1,
        explain: "Giá trị của factory là che class cụ thể khỏi nơi dùng. Không có nhu cầu đổi thì chỉ là thêm lớp gián tiếp.",
      },
    },
    {
      id: "abstract-factory",
      title: "Abstract Factory: tạo cả họ object khớp nhau",
      intro: [
        "**Abstract Factory** tạo **cả một họ** object liên quan mà không nêu class cụ thể, và bảo đảm chúng **luôn khớp nhau**. Ví dụ giao diện sáng và tối: nút và checkbox cùng một theme.",
        "Khác Factory Method: Factory Method tạo **một** sản phẩm, Abstract Factory tạo **cả bộ**.",
      ],
      widgetTitle: "Nút và checkbox cùng một theme",
      compare: [
        way(
          "Tự chọn từng cái",
          `Button b   = dark ? new DarkButton()    : new LightButton();
Checkbox c = dark ? new LightCheckbox() : new DarkCheckbox();   // nhầm: lệch theme`,
          [
            ask("Quên đổi một chỗ", bad("Giao diện bị lệch: nút tối nhưng checkbox sáng. Compiler không báo gì.")),
            ask("Thêm theme Blue", bad("Phải sửa mọi chỗ có `dark ? ... : ...`.")),
          ],
          "Việc giữ cho cả bộ khớp nhau nằm ở trí nhớ của người viết.",
        ),
        way(
          "Abstract Factory",
          `interface Theme { Button button(); Checkbox checkbox(); }
class DarkTheme  implements Theme { ... }
class LightTheme implements Theme { ... }
String screen(Theme t) { return t.button().draw() + " + " + t.checkbox().draw(); }`,
          [
            ask("Quên đổi một chỗ", ok("Không thể lệch: cả bộ đến từ cùng một `Theme`. Đã chạy: `dark button + dark checkbox` và `light button + light checkbox`.")),
            ask("Thêm theme Blue", ok("Viết `BlueTheme` mới. `screen()` không đổi.")),
          ],
          "Cả họ sản phẩm đi cùng nhau, và thêm họ mới chỉ là thêm một class.",
        ),
      ],
      after: [
        "Hay gặp: bộ đối tượng theo loại database (kết nối, câu lệnh, transaction của cùng một hãng), bộ widget theo hệ điều hành. Họ sản phẩm chỉ có một loại thì không cần.",
      ],
      trap: {
        title: "Thêm loại sản phẩm mới vào họ thì khó",
        text: "Thêm `Slider` vào `Theme` thì phải sửa mọi theme. Abstract Factory dễ thêm **họ** mới nhưng khó thêm **loại sản phẩm** mới.",
      },
      quiz: {
        question: "Abstract Factory khác Factory Method ở điểm nào?",
        options: [
          "Tạo cả họ object liên quan và bảo đảm chúng khớp nhau",
          "Chỉ dùng được với enum",
          "Luôn là singleton",
          "Không dùng interface",
        ],
        answer: 0,
        explain: "Factory Method tạo một sản phẩm. Abstract Factory tạo một bộ sản phẩm cùng họ.",
      },
    },
    {
      id: "builder",
      title: "Builder: dựng object nhiều tham số từng bước",
      intro: [
        "**Builder** dựng object có nhiều tham số, trong đó nhiều cái tuỳ chọn, bằng chuỗi lời gọi dễ đọc, và **kiểm tra hợp lệ ở bước `build()`**.",
        "Constructor 6 tham số cùng kiểu `String` rất dễ đảo thứ tự mà không báo lỗi.",
      ],
      widgetTitle: "Dựng HttpRequest",
      compare: [
        way(
          "Constructor dài",
          `new HttpRequest("https://api.x.com/users", "POST", null, null, 5, true);   // tham số nào là gì?`,
          [
            ask("Đọc code", bad("Không biết `5` và `true` nghĩa là gì nếu không mở class.")),
            ask("Đảo hai tham số cùng kiểu", bad("Vẫn biên dịch được. Lỗi chỉ lộ ra lúc chạy.")),
          ],
          "Càng nhiều tham số, constructor càng dễ đọc sai và dùng sai.",
        ),
        way(
          "Builder",
          `HttpRequest r = new HttpRequest.Builder("https://api.x.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .timeout(5)
    .build();               // kiểm tra hợp lệ ở đây`,
          [
            ask("Đọc code", ok("Mỗi giá trị có tên. Đã chạy: `POST https://api.x.com/users {Content-Type=application/json} timeout=5s`.")),
            ask("POST mà thiếu Content-Type", ok("`build()` ném `IllegalStateException: POST needs Content-Type`. Object sai không bao giờ tồn tại.")),
          ],
          "Builder cho code dễ đọc, và chặn object không hợp lệ ngay lúc dựng.",
        ),
      ],
      after: [
        "Gặp: `StringBuilder`, `HttpRequest.newBuilder()`, Lombok `@Builder`. Builder thường đi cùng object **bất biến** (field `final`).",
      ],
      trap: {
        title: "Builder cho class chỉ có 2 tham số",
        text: "Ít tham số thì constructor hoặc `record` là đủ. Builder chỉ đáng khi có nhiều tham số tuỳ chọn hoặc cần kiểm tra chéo giữa các field.",
      },
      quiz: {
        question: "Lợi ích lớn nhất của việc kiểm tra trong `build()` là gì?",
        options: ["Chạy nhanh hơn", "Object không hợp lệ không bao giờ được tạo ra", "Không cần getter", "Tự sinh `equals`"],
        answer: 1,
        explain: "Mọi quy tắc nằm ở một chỗ, và người dùng không thể giữ một object nửa vời.",
      },
    },
    {
      id: "prototype",
      title: "Prototype: tạo object mới bằng cách sao chép",
      intro: [
        "**Prototype** tạo object mới bằng cách **sao chép** một object mẫu thay vì dựng từ đầu. Hữu ích khi dựng tốn kém hoặc cấu hình phức tạp.",
        "Điểm mấu chốt là sao chép **nông** (shallow) hay **sâu** (deep).",
      ],
      widgetTitle: "Sao chép một Doc có danh sách tag",
      compare: [
        way(
          "Sao chép nông",
          `Doc shallow() { return new Doc(title, tags); }      // dùng chung cùng một List`,
          [
            ask("Thêm tag vào bản gốc", bad("Đã chạy: bản sao nông **thấy luôn** tag mới, `[a, b]`. Hai object dùng chung một `List`.")),
            ask("Sửa bản sao", bad("Làm hỏng cả bản gốc cùng lúc.")),
          ],
          "Bản sao nông chỉ chép tham chiếu. Phần tử bên trong vẫn là của chung.",
        ),
        way(
          "Sao chép sâu",
          `Doc deep() { return new Doc(title, new ArrayList<>(tags)); }   // List mới`,
          [
            ask("Thêm tag vào bản gốc", ok("Đã chạy: bản sao sâu vẫn là `[a]`.")),
            ask("Sửa bản sao", ok("Bản gốc không bị ảnh hưởng.")),
          ],
          "Bản sao sâu có dữ liệu riêng, hai bên độc lập.",
        ),
      ],
      after: [
        "Trong Java đừng dựa vào `Cloneable` và `clone()`: mặc định chỉ sao chép nông và không gọi constructor, rất dễ sai. Hãy dùng **copy constructor** hoặc một factory method sao chép.",
      ],
      trap: {
        title: "Tưởng clone() là sao chép sâu",
        text: "`Object.clone()` chỉ chép nông các field. Phần tử bên trong như `List` vẫn dùng chung giữa bản gốc và bản sao.",
      },
      quiz: {
        question: "Bản sao nông có một `List` bên trong. Thêm phần tử vào `List` của bản gốc thì sao?",
        options: ["Bản sao không đổi", "Bản sao cũng thấy phần tử mới", "Ném exception", "Bản gốc bị khoá"],
        answer: 1,
        explain: "Hai object trỏ cùng một `List` (đã chạy: bản sao nông ra `[a, b]`, bản sao sâu vẫn `[a]`).",
      },
    },
    {
      id: "cheatsheet",
      title: "Bảng nhớ và chọn pattern",
      intro: [
        "Bấm từng dòng để xem câu nên nói ra miệng. Sau đó làm bài chọn pattern bên dưới.",
      ],
      widgetTitle: "Bảng nhớ Creational",
      cheat: [
        { name: "Singleton", one: "Đúng một instance, có điểm truy cập chung.", say: "Em dùng enum hoặc holder idiom cho an toàn thread. Trong Spring em để container quản lý bean singleton thay vì tự viết, vì singleton tự viết là trạng thái toàn cục khó test." },
        { name: "Factory Method", one: "Tách new ra khỏi nơi dùng.", say: "Nơi dùng chỉ biết interface, còn loại cụ thể do factory quyết định. Thêm loại mới chỉ là thêm một class, nhưng em chỉ dùng khi thật sự có nhiều loại." },
        { name: "Abstract Factory", one: "Tạo cả họ object khớp nhau.", say: "Khi cần một bộ sản phẩm luôn đi cùng nhau, như bộ widget theo theme, em dùng Abstract Factory để không thể trộn lẫn các họ." },
        { name: "Builder", one: "Dựng object nhiều tham số, kiểm tra ở build().", say: "Constructor nhiều tham số khó đọc và dễ đảo thứ tự. Builder cho mỗi giá trị một cái tên, và chặn object không hợp lệ ngay ở build()." },
        { name: "Prototype", one: "Tạo object mới bằng cách sao chép.", say: "Em chú ý sao chép nông hay sâu. Trong Java em dùng copy constructor thay cho clone() vì clone() chỉ chép nông và khó dùng đúng." },
      ],
      quiz: {
        question: "Bạn cần đúng một object cấu hình dùng chung cả ứng dụng. Trong Spring, cách nào hợp lý nhất?",
        options: [
          "Tự viết Singleton có `static` instance",
          "Khai báo một bean (mặc định đã là singleton) và inject vào nơi cần",
          "Tạo `new Config()` ở mỗi class",
          "Dùng biến toàn cục `public static`",
        ],
        answer: 1,
        explain: "Container quản lý vòng đời và cho phép thay bằng bản giả khi test. Singleton viết tay là trạng thái toàn cục.",
      },
    },
    {
      id: "chon-pattern",
      title: "Bài tập: tình huống này dùng pattern nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn pattern phù hợp rồi xem lý do."],
      widgetTitle: "Chọn pattern Creational",
      drill: {
        choices: ["Singleton", "Factory Method", "Abstract Factory", "Builder", "Prototype"],
        summary: "Nhận ra dấu hiệu quan trọng hơn thuộc tên: một instance, che new, cả họ, nhiều tham số, hoặc sao chép.",
        items: [
          { q: "Cấu hình dùng chung cả ứng dụng, chỉ cần đúng một bản.", a: "Singleton", why: "Đúng một instance và có điểm truy cập chung." },
          { q: "Nơi dùng chỉ nên biết `Notification`. Email hay SMS do lúc chạy quyết định, và sẽ thêm Zalo sau.", a: "Factory Method", why: "Che việc `new` class cụ thể khỏi nơi dùng." },
          { q: "Một bộ giao diện gồm nút, checkbox, menu phải cùng theme sáng hoặc cùng theme tối.", a: "Abstract Factory", why: "Cả họ sản phẩm phải khớp nhau." },
          { q: "Object có 8 tham số, nhiều cái tuỳ chọn, và cần kiểm tra chéo trước khi tạo.", a: "Builder", why: "Dựng từng bước, kiểm tra ở `build()`." },
          { q: "Tạo hàng nghìn object gần giống nhau mà mỗi lần dựng từ đầu rất tốn kém.", a: "Prototype", why: "Sao chép từ một mẫu rẻ hơn dựng mới (nhớ chọn sao chép sâu nếu có dữ liệu thay đổi được)." },
        ],
      },
    },
  ],
  cards: [
    { q: "Singleton an toàn thread viết thế nào?", a: "Enum một phần tử hoặc holder idiom. Lazy không đồng bộ có thể tạo nhiều instance khi nhiều thread, và private constructor vẫn bị reflection phá. Enum chặn được cả reflection." },
    { q: "Vì sao Spring không cần Singleton viết tay?", a: "Bean mặc định đã là singleton do container quản lý, và có thể thay bằng bản giả khi test. Singleton tự viết là trạng thái toàn cục." },
    { q: "Factory Method giúp gì?", a: "Nơi dùng chỉ biết interface. Thêm loại mới chỉ cần một class mới. Không có nhu cầu đổi thì cứ new (YAGNI)." },
    { q: "Abstract Factory khác Factory Method thế nào?", a: "Factory Method tạo một sản phẩm. Abstract Factory tạo cả họ sản phẩm khớp nhau. Dễ thêm họ mới, khó thêm loại sản phẩm mới." },
    { q: "Khi nào dùng Builder?", a: "Nhiều tham số, nhiều cái tuỳ chọn, hoặc cần kiểm tra chéo. Kiểm tra trong build() để object sai không tồn tại. Ít tham số thì constructor hoặc record." },
    { q: "Sao chép nông và sâu khác nhau thế nào?", a: "Nông chỉ chép tham chiếu nên phần tử bên trong dùng chung. Sâu chép cả phần bên trong. Trong Java ưu tiên copy constructor, không dựa vào clone()." },
  ],
  modelAnswer:
    "Nhóm Creational lo việc tạo object. Singleton bảo đảm một instance: em dùng enum hoặc holder idiom cho an toàn thread, và trong Spring để container quản lý bean thay vì tự viết. Factory Method che việc new để nơi dùng chỉ biết interface, thêm loại mới chỉ là thêm một class. Abstract Factory tạo cả họ object khớp nhau, như bộ widget theo theme. Builder dựng object nhiều tham số và kiểm tra ở build(). Prototype tạo bản sao, và em chú ý sao chép nông hay sâu. Em chỉ áp dụng khi có nhu cầu thật, tránh thêm factory cho mọi class.",
};
