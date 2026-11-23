import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Behavioral1.java: strategy table, observer with a failing listener and unsubscribe, command undo, template method, enum state machine).
export const patternsBehavioral1: Lesson = {
  slug: "patterns-behavioral-1",
  crumb: "Behavioral Patterns 1",
  videoDir: "/videos/patterns-behavioral-1",
  videoVersion: "0",
  scenes: [],
  title: "Design Patterns 3: Behavioral, phân chia trách nhiệm (1)",
  subtitle:
    "Strategy, Observer, Command, Template Method, State. Năm pattern hay gặp nhất khi phỏng vấn, mỗi pattern có code chạy thật và bẫy thường bị hỏi.",
  openingQuiz: {
    question: "Dấu hiệu nào gợi ý nên dùng Strategy?",
    options: [
      "Chuỗi if / else theo loại cứ dài ra khi thêm cách làm mới",
      "Cần đúng một instance",
      "Cần sao chép object",
      "Cần duyệt cây thư mục",
    ],
    answer: 0,
    explain: "Mỗi nhánh của chuỗi if là một cách làm. Strategy tách mỗi cách thành một object cùng interface, thêm cách mới không phải sửa code cũ.",
  },
  roadmap: [
    "Chặng 1: Strategy và Observer. Đổi thuật toán lúc chạy, và phát sự kiện cho nhiều người nghe.",
    "Chặng 2: Command và Template Method. Biến thao tác thành object để undo, và khung thuật toán cố định.",
    "Chặng 3: State và bảng nhớ chọn pattern.",
  ],
  sections: [
    {
      id: "strategy",
      title: "Strategy: đổi thuật toán như đổi phụ kiện",
      intro: [
        "**Strategy** đóng gói mỗi cách làm thành một object cùng interface, để chọn hoặc đổi lúc chạy. Dấu hiệu: chuỗi `if / else` theo loại cứ dài thêm (đã gặp ở OCP).",
        "Từ Java 8, một strategy thường chỉ là một **lambda**.",
      ],
      board: {
        title: "Strategy: mỗi cách làm là một object",
        highlight: "mỗi cách làm",
        chips: ["Thêm cách mới: thêm một dòng", "Không sửa code cũ"],
        cards: [
          {
            title: "Bảng strategy",
            diagram: {
              kind: "hub",
              inputs: [{ label: "STANDARD", mark: "plus" }, { label: "EXPRESS", mark: "plus" }, { label: "PICKUP", mark: "plus" }, { label: "SAME_DAY", mark: "plus" }],
              center: "Map<String, Shipping>",
              rulesTitle: "Cùng một interface",
              rules: ["`fee(long weightG)`", "Thêm loại: thêm đúng một dòng", "Không còn chuỗi `if / else`"],
            },
            notes: ["Từ Java 8, một strategy thường chỉ là một lambda."],
            code: `Map<String, Shipping> table = Map.of(
          "STANDARD", w -> 15000,
          "EXPRESS",  w -> 30000 + w * 10);`,
            takeaway: "Chọn cách làm lúc chạy, không sửa hàm cũ",
          },
        ],
        conclusion: "**Kết luận:** chuỗi `if / else` theo loại cứ dài ra là dấu hiệu nên tách thành các strategy.",
      },
      widgetTitle: "Tính phí giao hàng",
      compare: [
        way(
          "if / else theo loại",
          `long fee(String type, long w) {
  if (type.equals("STANDARD")) return 15000;
  else if (type.equals("EXPRESS")) return 30000 + w * 10;   // thêm loại: sửa hàm
  ...
}`,
          [
            ask("Thêm loại Hoả tốc", bad("Mở hàm đang chạy tốt ra để sửa.")),
            ask("Test riêng từng cách tính", bad("Phải gọi qua chuỗi tên, dễ gõ sai.")),
          ],
          "Mọi cách tính nằm trong một hàm và phụ thuộc vào chuỗi `if`.",
        ),
        way(
          "Strategy bằng lambda",
          `interface Shipping { long fee(long weightG); }
Map<String, Shipping> table = Map.of(
    "STANDARD", w -> 15000,
    "EXPRESS",  w -> 30000 + w * 10,
    "PICKUP",   w -> 0,
    "SAME_DAY", w -> 50000 + w * 20);   // Hoả tốc: thêm đúng một dòng
long fee = table.get(type).fee(2000);`,
          [
            ask("Thêm loại Hoả tốc", ok("Thêm dòng `\"SAME_DAY\", w -> 50000 + w * 20` vào bảng, hàm tính phí không đổi. Đã chạy (2000g): `SAME_DAY = 90000`, các loại cũ vẫn như trước: `EXPRESS = 50000`, `PICKUP = 0`, `STANDARD = 15000`.")),
            ask("Test riêng từng cách tính", ok("Gọi trực tiếp từng lambda, không cần dựng cả hệ thống.")),
          ],
          "Mỗi cách tính là một giá trị độc lập, thêm hay đổi không đụng code cũ.",
        ),
      ],
      after: [
        "Trong JDK: `Comparator` truyền vào `sort()`. Trong Spring: nhiều bean cùng interface, chọn theo tên hay inject `Map<String, Bean>`.",
      ],
      trap: {
        title: "Strategy cho thứ không bao giờ đổi",
        text: "Chỉ có một cách làm và không đổi thì viết thẳng. Theo {{rule-of-three|Rule of Three}}: lần đầu viết thẳng, lần hai chịu lặp lại, tới lần thứ ba mới tách thành Strategy.",
      },
      quiz: {
        question: "Trong Java 8+, cách ngắn nhất để viết một strategy là gì?",
        options: ["Một lambda hoặc method reference", "Một class con kế thừa Object", "Một biến static", "Một file XML"],
        answer: 0,
        explain: "Strategy là interface một method, nên lambda khớp hoàn toàn (functional interface).",
      },
    },
    {
      id: "observer",
      title: "Observer: phát sự kiện cho nhiều người nghe",
      intro: [
        "Strategy chọn **một** cách làm. Observer báo cho **nhiều** bên cùng lúc.",
        "**Observer** cho một object (**subject**, trong trang này còn gọi là publisher) báo cho **nhiều** object khác (**observer**, còn gọi là subscriber hay listener) khi có sự kiện, mà không biết họ là ai. Ví dụ: đặt hàng xong thì gửi email, ghi audit, trừ kho.",
        "Giống đăng ký một kênh video: người đăng không cần biết ai đang theo dõi, ai đăng ký thì nhận thông báo, huỷ đăng ký thì thôi.",
        "Trong Spring: `ApplicationEventPublisher` và `@EventListener`.",
      ],
      board: {
        title: "Observer: một sự kiện, nhiều người nghe",
        highlight: "nhiều người nghe",
        chips: ["Publisher không biết ai nghe", "Cô lập lỗi từng listener"],
        cards: [
          {
            title: "Publisher và listener",
            diagram: {
              kind: "hub",
              inputs: [{ label: "email", mark: "plus" }, { label: "audit", mark: "plus" }, { label: "sms", mark: "plus" }],
              center: "bus.publish()",
              rulesTitle: "Publisher",
              rules: ["Không biết ai đang nghe", "Thêm kênh: thêm một `subscribe`", "`pay()` không đổi"],
            },
            notes: ["Trong Spring: `ApplicationEventPublisher` và `@EventListener`."],
            code: `bus.subscribe(e -> email(e));
      bus.subscribe(e -> audit(e));
      bus.publish("order-1 paid");`,
            takeaway: "Thêm người nghe mà không sửa publisher",
          },
          {
            title: "Một listener bị lỗi",
            diagram: {
              kind: "flow",
              steps: ["publish(event)", "email chạy", "sms ném lỗi"],
              ok: ["Bọc try/catch", "audit vẫn chạy"],
              bad: ["Không bắt lỗi", "audit không chạy"],
            },
            notes: ["Listener mặc định chạy cùng thread và lần lượt, nên một listener lỗi hoặc chậm ảnh hưởng cả publisher."],
            takeaway: "Bọc try/catch quanh từng listener",
          },
        ],
        conclusion: "**Kết luận:** Observer tách publisher khỏi người nghe, nhưng publisher phải tự bảo vệ trước listener lỗi.",
      },
      widgetTitle: "Thanh toán xong, báo cho ai?",
      compare: [
        way(
          "Gọi trực tiếp từng nơi",
          `void pay(Order o) {
  emailService.send(o);
  smsService.send(o);        // thêm kênh: sửa pay()
  auditService.log(o);
}`,
          [
            ask("Thêm kênh Zalo", bad("Sửa `pay()`. Class phải biết hết mọi bên cần báo.")),
            ask("SMS bị lỗi", bad("`smsService` ném lỗi thì `auditService.log` không bao giờ chạy.")),
          ],
          "Publisher gắn chặt với từng bên nhận.",
        ),
        way(
          "Event bus",
          `bus.subscribe(e -> email(e));
bus.subscribe(e -> audit(e));
bus.publish("order-1 paid");     // pay() không biết ai đang nghe`,
          [
            ask("Thêm kênh Zalo", ok("Thêm một `subscribe`, `pay()` không đổi.")),
            ask("Một listener ném lỗi", bad("Nếu `publish` không bắt lỗi: đã chạy, `audit` **không bao giờ chạy**."), ok("Bọc `try/catch` quanh từng listener: đã chạy, email chạy, sms báo lỗi, audit vẫn chạy.")),
          ],
          "Publisher không biết người nghe, nhưng phải tự bảo vệ trước listener lỗi.",
        ),
      ],
      after: [
        "Nhớ **huỷ đăng ký**: listener còn đăng ký thì còn được giữ trong bộ nhớ (memory leak). Đã chạy: sau `unsubscribe`, listener SMS không nhận sự kiện nữa.",
      ],
      trap: {
        title: "Listener chạy đồng bộ và nối tiếp",
        text: "Mặc định listener chạy cùng thread và lần lượt. Một listener chậm làm chậm cả publisher. Cần thì chạy bất đồng bộ (`@Async`, executor) và đừng để lỗi của một listener chặn các listener còn lại.",
      },
      quiz: {
        question: "Publisher gọi lần lượt 3 listener. Listener thứ 2 ném RuntimeException mà không ai bắt. Điều gì xảy ra?",
        options: [
          "Listener 3 vẫn chạy bình thường",
          "Listener 3 không chạy và exception lan lên publisher",
          "Chương trình tự thử lại",
          "Listener 2 bị tự động huỷ đăng ký",
        ],
        answer: 1,
        explain: "Đã chạy: publish ném `sms gateway down` và `audit` không bao giờ chạy. Bọc try/catch từng listener để cô lập lỗi.",
      },
      parts: [
        {
          id: "observer-vs-pubsub",
          title: "Observer khác Pub/Sub ở đâu",
          intro: [
            "Observer ở trên: subject giữ danh sách observer và gọi thẳng từng cái. Kafka hay Redis Pub/Sub cũng \"phát một sự kiện cho nhiều bên nghe\". Hai thứ này có giống nhau không?",
            "Cùng ý tưởng, khác ở chỗ **ai biết ai**:",
            "- **Observer**: subject **biết** observer (giữ tham chiếu, gọi `onEvent` trực tiếp). Thường trong **một process**, gọi đồng bộ cùng thread.",
            "- **Pub/Sub**: publisher và subscriber chỉ biết **topic**; ở giữa là **broker**. Thường khác process hoặc khác máy, bất đồng bộ.",
            "Trong Spring, `ApplicationEventPublisher` và `@EventListener` là Observer trong một JVM: mặc định listener chạy đồng bộ trên thread của publisher. Kafka giữa các service là Pub/Sub.",
          ],
          widgetTitle: "Phát sự kiện OrderPaid",
          compare: [
            way(
              "Observer trong một JVM",
              `publisher.publishEvent(new OrderPaid(id));

@EventListener
void on(OrderPaid e) { mail.send(e.id()); }`,
              [
                ask("Listener ném exception", bad("Mặc định listener chạy cùng thread nên exception văng ngược lên `publishEvent`: thao tác của publisher có thể fail theo.")),
                ask("Process chết sau khi publish", bad("Sự kiện nằm trong bộ nhớ, không được lưu: mất.")),
                ask("Cần độ trễ thấp, cùng một app", ok("Gọi hàm trực tiếp, không qua mạng, không cần vận hành broker.")),
              ],
              "Đơn giản và nhanh, nhưng publisher và listener sống chung số phận.",
            ),
            way(
              "Pub/Sub qua Kafka",
              `kafkaTemplate.send("order-paid", id, payload);

@KafkaListener(topics = "order-paid")
void on(String payload) { mail.send(payload); }`,
              [
                ask("Subscriber chậm hoặc lỗi", ok("Publisher không biết và không bị ảnh hưởng; subscriber tự đọc lại từ vị trí (offset: số thứ tự tin nhắn trong topic) mà nó đã xử lý tới, nên không mất tin.")),
                ask("Thêm một service mới cần sự kiện này", ok("Chỉ việc subscribe topic, không sửa publisher.")),
                ask("Cần chạy đúng một lần", bad("Broker thường giao **ít nhất một lần** (có thể giao lặp khi retry), nên subscriber phải idempotent (xử lý lặp vẫn ra cùng kết quả; xem bài System Design Concepts, phần message queue). Thêm độ trễ mạng và việc vận hành broker.")),
              ],
              "Tách rời publisher và subscriber, đổi lại độ phức tạp và độ trễ.",
            ),
          ],
          takeaway: {
            lines: [
              "Observer: subject biết observer, cùng process, gọi đồng bộ. Pub/Sub: chỉ biết topic, có broker ở giữa, thường bất đồng bộ và qua mạng.",
            ],
          },
          quiz: {
            question: "Điểm khác cốt lõi giữa Observer và Pub/Sub?",
            options: [
              "Pub/Sub luôn nhanh hơn",
              "Observer: subject biết và gọi thẳng observer; Pub/Sub: publisher và subscriber chỉ biết topic qua broker",
              "Observer không có nhiều người nghe",
              "Pub/Sub chỉ dùng trong một process",
            ],
            answer: 1,
            explain: "Observer gắn chặt subject với observer (thường cùng process, đồng bộ). Pub/Sub tách hai bên bằng broker nên thêm hay bớt subscriber không đụng publisher.",
          },
        },
      ],
    },
    {
      id: "command",
      title: "Command: biến yêu cầu thành object",
      intro: [
        "Observer báo rằng một việc **đã xảy ra**. Command gói chính **việc cần làm** thành object.",
        "**Command** gói một thao tác, kèm cách **hoàn tác**, thành object. Nhờ vậy có thể:",
        "- **Xếp hàng**: đưa vào hàng đợi chạy lần lượt.",
        "- **Ghi log**: lưu lại đã làm những gì.",
        "- **Thực thi sau**: tạo bây giờ, chạy lúc khác.",
        "- **Undo/redo**: gọi `undo()` theo thứ tự ngược lại.",
      ],
      predict: {
        question: "Lần lượt chạy ba command thêm `Hello`, `, `, `world`, rồi undo **hai** lần. Văn bản còn gì?",
        options: ["`Hello, world`", "`Hello`", "`Hello, `", "Rỗng"],
        answer: 1,
        explain: "Mỗi undo lấy command mới nhất ra khỏi ngăn xếp lịch sử: lần đầu bỏ `world`, lần hai bỏ `, `. Còn lại `Hello`.",
      },
      widgetTitle: "Trình soạn thảo có undo",
      compare: [
        way(
          "Gọi thẳng",
          `editor.text.append("Hello");     // gọi thẳng, không lưu lại gì
// muốn undo? phải tự nhớ đã làm gì`,
          [
            ask("Undo", bad("Không có cách nào: thao tác đã mất sau khi chạy.")),
            ask("Lưu lịch sử thao tác", bad("Phải tự thêm code ghi lại ở mọi chỗ.")),
          ],
          "Thao tác chạy xong là hết, không còn gì để hoàn tác.",
        ),
        way(
          "Command",
          `interface Command { void run(); void undo(); }
Command c = new Append(editor, "Hello");
c.run(); history.push(c);
history.pop().undo();`,
          [
            ask("Undo", ok("Đã chạy: gõ `Hello`, `, `, `world` ra `Hello, world`. Hai lần undo còn `Hello`.")),
            ask("Lưu lịch sử thao tác", ok("`history` là một ngăn xếp command, lưu được, xếp hàng được, chạy lại được.")),
          ],
          "Thao tác là một object nên có thể lưu, xếp hàng và đảo ngược.",
        ),
      ],
      after: [
        "Gặp: `Runnable` (một command), hàng đợi tác vụ của `ExecutorService`, nhật ký giao dịch.",
      ],
      trap: {
        title: "Undo phải đối xứng, và có việc không undo được",
        text: "Mỗi `run()` cần một `undo()` đúng nghĩa ngược lại (ở trên là cắt đúng độ dài chuỗi vừa thêm). Command có tác dụng ra ngoài hệ thống, như gửi email, thì không hoàn tác được.",
      },
      quiz: {
        question: "Vì sao Command làm được undo/redo?",
        options: [
          "Vì thao tác được biến thành object có thể lưu và đảo ngược",
          "Vì Java có sẵn hàm undo",
          "Vì dùng nhiều thread",
          "Vì dùng reflection",
        ],
        answer: 0,
        explain: "Mỗi thao tác là một object có `run()` và `undo()`, xếp trong ngăn xếp lịch sử.",
      },
    },
    {
      id: "template-method",
      title: "Template Method: khung cố định, bước thay đổi",
      intro: [
        "Command gói một thao tác. Template Method cố định **thứ tự** của nhiều thao tác.",
        "**Template Method** định nghĩa **thứ tự các bước** trong class cha (method `final`), còn từng bước cụ thể để class con viết, bằng **kế thừa**. Class cha gọi xuống class con chứ không phải ngược lại, đúng {{hollywood|Hollywood Principle}}: \"đừng gọi tôi, tôi sẽ gọi bạn\".",
      ],
      widgetTitle: "Nhập dữ liệu từ nhiều nguồn",
      compare: [
        way(
          "Mỗi importer tự viết khung",
          `class CsvImporter  { void run() { open(); readCsv();  validate(); save(); } }
class JsonImporter { void run() { open(); readJson(); /* quên validate */ save(); } }`,
          [
            ask("Thêm bước ghi log", bad("Sửa **từng** importer, dễ sót.")),
            ask("Một importer quên bước", bad("Không có gì buộc phải làm đủ các bước.")),
          ],
          "Khung bị lặp ở mọi class nên dễ lệch nhau.",
        ),
        way(
          "Template Method",
          `abstract class Importer {
  final List<String> run() { /* open, read(), validate(), save */ }
  abstract List<String> read();
  boolean shouldValidate() { return true; }   // hook: bước tuỳ chọn, con có thể tắt
}
// run(): open, read(), nếu shouldValidate() thì validate, save`,
          [
            ask("Thêm bước ghi log", ok("Sửa một chỗ trong `run()`.")),
            ask("Một nguồn đã tin cậy, không cần kiểm tra lại", ok("Class con override hook `shouldValidate()` trả `false`, khung không đổi. Đã chạy: `CsvImporter` ra `[open, read csv, validate, save]`; `TrustedJsonImporter` ra `[open, read json, save]`.")),
          ],
          "Khung nằm một chỗ, `final` nên con không phá được thứ tự.",
        ),
      ],
      after: [
        "Template Method dùng **kế thừa**, còn Strategy dùng **composition** (truyền object hành vi vào). Ví dụ đúng nghĩa trong JDK: `HttpServlet.service()` gọi `doGet` hay `doPost` mà class con override; `AbstractList` viết sẵn `indexOf`, `iterator`... dựa trên `get()` và `size()` do class con viết.",
        "`JdbcTemplate` của Spring thì **không** dùng bằng kế thừa: bạn không viết class con, mà truyền callback vào (`RowMapper`, `PreparedStatementCreator`). Khung cố định (lấy connection, chạy câu lệnh, đóng tài nguyên) nằm trong `JdbcTemplate`, còn bước thay đổi đi vào qua tham số. Đó là **template + callback**, gần với Strategy hơn. Tên có chữ Template nhưng đừng nói nó là Template Method thuần.",
      ],
      takeaway: {
        lines: [
          "**Template Method**: kế thừa, class con viết từng bước.",
          "**Strategy** và **template + callback** (`JdbcTemplate`): truyền hành vi vào qua tham số.",
        ],
      },
      trap: {
        title: "Lạm dụng kế thừa",
        text: "Template Method buộc class con vào class cha. Nếu chỉ khác nhau ở một bước nhỏ, ưu tiên Strategy (truyền hành vi vào) cho linh hoạt.",
      },
      quiz: {
        question: "Vì sao method `run()` trong Template Method nên là `final`?",
        options: [
          "Để class con không đổi được thứ tự các bước",
          "Để chạy nhanh hơn",
          "Để dùng được lambda",
          "Để tự động có getter",
        ],
        answer: 0,
        explain: "Khung thuật toán cố định, chỉ các bước (abstract hay hook) mới được class con thay.",
      },
    },
    {
      id: "state",
      title: "State: hành vi đổi theo trạng thái",
      intro: [
        "Template Method cố định thứ tự bước. State để **mỗi trạng thái** tự quyết thao tác nào hợp lệ.",
        "**State** cho object đổi hành vi khi trạng thái đổi, bằng cách cho **mỗi trạng thái** hành vi riêng (một object, hay một giá trị enum có method riêng). Thay cho `if` theo trạng thái lặp lại ở nhiều method.",
        "Ví dụ đơn hàng có ba trạng thái `PENDING` (chưa trả tiền), `PAID`, `SHIPPED`. Mỗi trạng thái chỉ override (viết lại) thao tác nó cho phép: `PENDING` chỉ có `pay()` (trả về `PAID`), `PAID` chỉ có `ship()`. Mọi thao tác còn lại dùng method mặc định của enum và ném `IllegalStateException`.",
      ],
      predict: {
        question: "Với enum có hành vi ở trên, đơn đang `PENDING` và lần lượt gọi `pay()` rồi `ship()` thì kết quả là gì? Còn nếu gọi `ship()` ngay khi đang `PENDING`?",
        options: [
          "`pay().ship()` ra `SHIPPED`; `PENDING.ship()` ném `IllegalStateException`",
          "`pay().ship()` ném exception vì chưa kiểm tra gì",
          "`PENDING.ship()` âm thầm trả `SHIPPED`",
          "Cả hai đều không làm gì, vẫn `PENDING`",
        ],
        answer: 0,
        explain: "`PENDING.pay()` trả `PAID`, rồi `PAID.ship()` trả `SHIPPED`. `PENDING` không override `ship()` nên rơi về method mặc định ném `cannot ship in PENDING`: chuyển sai bị chặn mà không cần `if` ở đâu cả.",
      },
      widgetTitle: "Vòng đời đơn hàng",
      compare: [
        way(
          "if theo trạng thái",
          `void ship() {
  if (state == PENDING) throw new IllegalStateException();
  else if (state == PAID) state = SHIPPED;
  // pay(), cancel(), refund() đều lặp lại if theo state
}`,
          [
            ask("Thêm trạng thái RETURNED", bad("Sửa **mọi** method có `if (state ...)`.")),
            ask("Chuyển trạng thái sai", bad("Chỉ chặn được nếu mọi method đều nhớ kiểm tra.")),
          ],
          "Quy tắc chuyển trạng thái rải rác ở nhiều method.",
        ),
        way(
          "Enum có hành vi",
          `enum OrderState {
  PENDING { OrderState pay()  { return PAID; } },
  PAID    { OrderState ship() { return SHIPPED; } },
  SHIPPED { };
  OrderState pay()  { throw new IllegalStateException("cannot pay in " + this); }
  OrderState ship() { throw new IllegalStateException("cannot ship in " + this); }
}`,
          [
            ask("Thêm trạng thái RETURNED", ok("Thêm một giá trị enum cùng hành vi riêng, các trạng thái khác không đổi.")),
            ask("Chuyển trạng thái sai", ok("Đã chạy: `PENDING -> PAID -> SHIPPED` hợp lệ. `PENDING.ship()` ném `cannot ship in PENDING`, `SHIPPED.pay()` ném `cannot pay in SHIPPED`.")),
          ],
          "Mỗi trạng thái tự biết nó cho phép gì, chuyển sai bị chặn mặc định.",
        ),
      ],
      after: [
        "Gặp: vòng đời đơn hàng, thanh toán, Spring StateMachine. Hỏi \"ai quyết định chuyển?\": với State, **trạng thái hiện tại** quyết định chuyển sang đâu (client chỉ gọi `pay()` hay `ship()`, không chọn trạng thái), còn Strategy do **client chọn**.",
      ],
      trap: {
        title: "Nhầm State với Strategy",
        text: "Cả hai đều ủy quyền cho một object cùng interface. Strategy do client chọn và thường cố định trong lúc chạy. Với State, trạng thái hiện tại quyết định chuyển sang trạng thái nào khi nhận sự kiện, client không chọn trạng thái.",
      },
      quiz: {
        question: "Đơn hàng có `PENDING`, `PAID`, `SHIPPED`, và mỗi trạng thái cho phép thao tác khác nhau. Pattern nào hợp?",
        options: ["Singleton", "State", "Builder", "Flyweight"],
        answer: 1,
        explain: "Hành vi đổi theo trạng thái hiện tại: mỗi trạng thái tự định nghĩa thao tác hợp lệ.",
      },
    },
    {
      id: "cheatsheet",
      title: "Bảng nhớ và chọn pattern",
      intro: ["Bấm từng dòng để xem câu nên nói ra miệng."],
      widgetTitle: "Bảng nhớ Behavioral (1)",
      cheat: [
        { name: "Strategy", one: "Đóng gói mỗi cách làm, đổi lúc chạy.", say: "Chuỗi if theo loại cứ dài ra thì em tách thành strategy, thường chỉ là một lambda. Em chờ tới lần thứ ba mới tách chứ không tách ngay từ đầu." },
        { name: "Observer", one: "Phát sự kiện cho nhiều người nghe.", say: "Publisher không biết ai nghe. Em lưu ý huỷ đăng ký để khỏi rò bộ nhớ, và cô lập lỗi từng listener để một listener hỏng không chặn các listener khác." },
        { name: "Command", one: "Thao tác thành object.", say: "Mỗi thao tác là một object có run và undo nên làm được undo/redo, xếp hàng và ghi log. Thao tác ra ngoài hệ thống như gửi email thì không hoàn tác được." },
        { name: "Template Method", one: "Khung cố định, bước thay đổi.", say: "Class cha định nghĩa thứ tự bước ở method final, con viết từng bước. HttpServlet và AbstractList dùng kiểu này. Nó dùng kế thừa, còn Strategy dùng composition; JdbcTemplate là template + callback, gần Strategy hơn." },
        { name: "State", one: "Hành vi đổi theo trạng thái.", say: "Mỗi trạng thái tự biết nó cho phép thao tác nào. Em dùng enum có method riêng cho từng trạng thái thay cho if theo state rải rác ở nhiều method." },
      ],
      quiz: {
        question: "Template Method và Strategy đều tách phần thay đổi ra. Khác nhau cốt lõi là gì?",
        options: [
          "Template Method dùng kế thừa, Strategy dùng composition",
          "Template Method chạy nhanh hơn",
          "Strategy không dùng interface",
          "Không có khác biệt",
        ],
        answer: 0,
        explain: "Template Method đổi bước bằng class con. Strategy truyền hành vi vào, linh hoạt hơn khi chỉ khác một bước.",
      },
    },
    {
      id: "chon-pattern",
      title: "Bài tập: tình huống này dùng pattern nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn pattern phù hợp rồi xem lý do."],
      widgetTitle: "Chọn pattern Behavioral (1)",
      drill: {
        choices: ["Strategy", "Observer", "Command", "Template Method", "State"],
        summary: "Dấu hiệu: nhiều cách làm, nhiều người nghe, thao tác cần hoàn tác, khung cố định, hay trạng thái.",
        items: [
          { q: "Nhiều cách tính phí giao hàng, khách chọn cách nào thì dùng cách đó.", a: "Strategy", why: "Mỗi cách là một strategy, chọn lúc chạy." },
          { q: "Đặt hàng xong cần báo email, SMS và ghi audit mà service đặt hàng không biết ai nghe.", a: "Observer", why: "Publisher phát sự kiện cho nhiều subscriber." },
          { q: "Trình soạn thảo cần undo và redo thao tác gõ.", a: "Command", why: "Thao tác là object có `run()` và `undo()`." },
          { q: "Mọi importer đều mở, đọc, kiểm tra, lưu theo cùng thứ tự, chỉ khác bước đọc.", a: "Template Method", why: "Khung cố định ở class cha, bước đọc để con viết." },
          { q: "Đơn hàng PENDING, PAID, SHIPPED, mỗi trạng thái cho phép thao tác khác nhau.", a: "State", why: "Hành vi đổi theo trạng thái hiện tại." },
        ],
      },
    },
  ],
  cards: [
    { q: "Dấu hiệu nên dùng Strategy?", a: "Chuỗi if / else theo loại cứ dài thêm. Mỗi nhánh thành một strategy (thường là lambda). Tới lần thứ ba mới tách." },
    { q: "Observer có bẫy gì?", a: "Một listener ném lỗi mà không bị bắt sẽ chặn các listener sau và lan lên publisher. Ngoài ra phải huỷ đăng ký để tránh rò bộ nhớ, và mặc định listener chạy đồng bộ." },
    { q: "Command giúp được những gì?", a: "Undo/redo, xếp hàng, ghi log, thực thi sau. Mỗi command có run và undo đối xứng. Thao tác ra ngoài hệ thống thì không hoàn tác được." },
    { q: "Template Method khác Strategy thế nào?", a: "Template Method dùng kế thừa: cha giữ khung final, con viết từng bước. Strategy dùng composition: truyền hành vi vào. HttpServlet.service() là Template Method; JdbcTemplate nhận callback nên gần Strategy hơn." },
    { q: "State khác Strategy thế nào?", a: "Cả hai ủy quyền cho object cùng interface. Strategy do client chọn, ít đổi. Với State, trạng thái hiện tại quyết định chuyển sang trạng thái nào khi nhận sự kiện, client không chọn trạng thái." },
    { q: "Vì sao dùng enum có method riêng cho State?", a: "Mỗi trạng thái tự định nghĩa thao tác hợp lệ, thêm trạng thái chỉ thêm một giá trị, và chuyển sai bị chặn mặc định." },
  ],
  modelAnswer:
    "Nhóm Behavioral lo việc phân chia trách nhiệm giữa các object. Strategy đóng gói mỗi cách làm, thường là một lambda, thay cho chuỗi if theo loại. Observer cho publisher báo nhiều subscriber mà không biết họ là ai, em chú ý huỷ đăng ký và cô lập lỗi từng listener. Command biến thao tác thành object nên làm được undo và xếp hàng. Template Method giữ khung thuật toán ở class cha bằng method final, con viết từng bước, như HttpServlet.service(). State cho mỗi trạng thái hành vi riêng, thay cho if theo state, thường viết bằng enum. Em phân biệt State với Strategy ở chỗ ai quyết định chuyển.",
};
