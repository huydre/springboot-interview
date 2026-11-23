import timeline from "../timelines/bean-lifecycle.json";
import type { Lesson, Scene } from "../types";

// Every output from Spring Boot 3.5 (Spring Framework 6.2) on JDK 21; see study note 04.02.
//
export const beanLifecycle: Lesson = {
  slug: "bean-lifecycle",
  crumb: "Bean Scope & Lifecycle",
  videoDir: "/videos/bean-lifecycle",
  // Per-scene clips cut by `video-kit/pipeline.py bean-video publish`, which also rewrites videoVersion.
  videoVersion: "0ddbb724",
  scenes: timeline as Scene[],
  title: "Bean Scope & Lifecycle",
  subtitle:
    "Các bean scope, singleton có thread-safe không, prototype inject vào singleton, vòng đời bean đo thực tế, BeanPostProcessor với BeanFactoryPostProcessor, và bẫy của @PostConstruct.",
  openingQuiz: {
    question: "Trong @PostConstruct, bean gọi method @Transactional của chính nó. Có transaction không?",
    options: [
      "Có",
      "Không: @PostConstruct chạy trước bước tạo AOP proxy và this là object gốc",
      "Chỉ khi readOnly",
      "Có nếu dùng constructor injection",
    ],
    answer: 1,
    explain: "Đã đo: trong @PostConstruct, this là proxy? false; sau BeanPostProcessor after, bean trong context mới là OrderCache$$SpringCGLIB$$0. Lý do chính là gọi qua this: this luôn là object gốc, nên lời gọi không bao giờ đi qua proxy, kể cả sau khi app đã start. Proxy chưa được tạo chỉ là lý do thứ hai.",
  },
  roadmap: [
    "Chặng 1: bean scope và singleton có thread-safe không.",
    "Chặng 2: prototype inject vào singleton.",
    "Chặng 3: vòng đời bean, BPP với BFPP, @PostConstruct.",
  ],
  sections: [
    {
      id: "scopes",
      title: "Phần 1: Các bean scope",
      scene: "scopes",
      intro: [
        "Scope trả lời: container giữ bao nhiêu instance và mỗi instance sống bao lâu.",
        "- **singleton** (mặc định): 1 instance cho mỗi `ApplicationContext`.",
        "- **prototype**: mỗi lần lấy tạo mới.",
        "- **Web scope**: `request`, `session`, `application`, `websocket`. `@RequestScope` là cách viết tắt của `@Scope(\"request\")`: mỗi HTTP request một instance (Phần 3 nói thêm).",
        "Singleton của Spring khác Singleton pattern của GoF: GoF là 1 instance trong cả JVM, Spring chỉ là 1 instance trong một container. Prototype: Spring tạo xong là giao cho bạn, không gọi destroy; đã đo 7 `Cart` có `@PreDestroy`, đóng context không dòng nào in ra.",
      ],
      quiz: {
        question: "Prototype giữ file hoặc connection thì ai đóng?",
        options: ["Spring gọi @PreDestroy", "Bạn tự đóng, vì Spring không gọi destroy callback cho prototype", "GC tự đóng", "Không cần đóng"],
        answer: 1,
        explain: "Spring không theo dõi prototype sau khi tạo.",
      },
    },
    {
      id: "thread-safe",
      title: "Phần 2: Singleton có thread-safe không",
      scene: "threadsafe",
      intro: [
        "Singleton là mặc định, nghĩa là mọi request dùng chung một object. Vậy nó có an toàn khi nhiều thread cùng chạy không?",
        "**Không tự động.** 200 worker thread của Tomcat có thể chạy đồng thời trong cùng một object; mọi field thay đổi được là shared mutable state. Đã đo: 8 thread gọi `count++` tổng 100.000 lần trên field của singleton ra 99.791.",
        "Bug thật hay gặp hơn: `ReportService` lưu user hiện tại vào field `private User currentUser`, gán trong `build(id)` rồi `render()` đọc lại. Request A vừa gán xong thì request B ghi đè, nên user A nhận báo cáo của user B. Test bằng tay (mỗi lúc một request) không bao giờ thấy, chỉ lộ khi tải cao.",
        "Viết đúng:",
        "- **Stateless**: chỉ field `final` trỏ tới bean khác, dữ liệu theo request đi qua tham số và biến cục bộ.",
        "- **Cần state dùng chung**: `AtomicLong`, `LongAdder`, `ConcurrentHashMap`.",
        "- **State theo request**: `@RequestScope` hoặc DTO.",
        "- **Cache thật**: Caffeine hay Redis.",
        "Chọn một cách lưu user rồi xem hai request A, B xen nhau.",
      ],
      widget: "singleton-state",
      widgetTitle: "Hai request trong một singleton",
      takeaway: {
        lines: ["Singleton là một object cho mọi thread: field thay đổi được là dữ liệu dùng chung. Dữ liệu của request đi qua tham số và biến cục bộ."],
      },
      quiz: {
        question: "ReportService (singleton) lưu user hiện tại vào field rồi đọc lại để render. Khi tải cao chuyện gì xảy ra?",
        options: [
          "Không sao, mỗi request có một ReportService riêng",
          "Hai request ghi đè field của nhau, user có thể nhận báo cáo của người khác",
          "Spring tự khoá field",
          "Lỗi khởi động",
        ],
        answer: 1,
        explain: "Singleton là một object dùng chung cho mọi thread. Dữ liệu của request phải đi qua tham số hoặc biến cục bộ.",
      },
    },
    {
      id: "prototype",
      title: "Phần 3: Prototype inject vào singleton",
      scene: "prototype",
      intro: [
        "Thí nghiệm: `Cart` là bean prototype, mỗi instance mới nhận một id tăng dần (1, 2, 3...). Một singleton lấy `Cart` theo từng cách, mỗi cách lấy 2 lần liên tiếp, rồi in id. Nếu prototype đúng nghĩa thì 2 lần phải ra 2 id khác nhau.",
        "Inject thẳng `Cart` vào field: ra id 1 rồi vẫn 1. Lý do: injection chỉ xảy ra một lần lúc tạo singleton, nên prototype bên trong cũng chỉ được lấy một lần.",
        "Ba cách sửa, mỗi cách đều ra 2 id khác nhau:",
        "- **`ObjectProvider<Cart>`** (2, 3): inject một \"người đi lấy hộ\", mỗi lần gọi `getObject()` là xin container một `Cart` mới.",
        "- **`@Lookup`** (4, 5): đánh lên một method trả `Cart`, Spring dùng {{cglib|CGLIB}} override method đó để mỗi lần gọi là `getBean` mới.",
        "- **Scoped proxy** (6, 7): field chứa một {{proxy|proxy}} (object đứng thế chỗ), mỗi lần gọi method trên proxy nó mới tìm instance thật.",
      ],
      after: [
        "Web scope xử lý đúng chuyện này: inject bean `request` vào singleton controller thì chạy đúng, vì `@RequestScope` có sẵn scoped proxy (`proxyMode = TARGET_CLASS`): controller giữ một proxy, và mỗi lần gọi proxy tìm instance của request hiện tại.",
        "Em chọn `ObjectProvider`: rõ ràng, dễ test, có `getIfAvailable()`. Inject `ApplicationContext` rồi `getBean` cũng chạy, nhưng đó là **Service Locator** (code tự đi hỏi container thay vì được tiêm vào): class phụ thuộc vào Spring và khó test.",
      ],
      trap: {
        title: "Scoped proxy với prototype",
        text: "Mỗi lần gọi method qua proxy là một instance mới: đo được id đổi giữa 2 lần gọi trên cùng một field, nên `cart.add(x)` rồi `cart.total()` chạy trên hai giỏ khác nhau. Scoped proxy hợp với `request`, `session`, vì trong một request proxy vẫn trả cùng một instance.",
      },
      widget: "prototype-scope",
      widgetTitle: "Bốn cách lấy prototype từ singleton",
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Singleton chỉ được inject một lần → prototype bên trong cũng chỉ lấy một lần → muốn instance mới thì phải xin container mỗi lần, ví dụ `ObjectProvider.getObject()`."],
      },
      quiz: {
        question: "Request-scoped bean inject vào singleton controller thì sao?",
        options: [
          "Lỗi giống prototype, mọi request dùng chung",
          "Chạy đúng vì @RequestScope có scoped proxy: proxy tìm instance của request hiện tại mỗi lần gọi",
          "Không inject được",
          "Thành singleton",
        ],
        answer: 1,
        explain: "@RequestScope mặc định proxyMode = TARGET_CLASS.",
      },
      parts: [
        {
          id: "prototype-reverse",
          title: "Chiều ngược lại: singleton vào prototype",
          intro: [
            "Vấn đề ở trên chỉ có một chiều: object sống **lâu** giữ object sống **ngắn**. Chiều ngược lại, inject singleton vào prototype, thì không sao: mỗi `Cart` mới đều nhận cùng một singleton, đúng như mong muốn.",
          ],
          quiz: {
            question: "Inject singleton vào prototype có vấn đề gì không?",
            options: ["Có, singleton bị nhân bản", "Không: mỗi prototype mới nhận cùng một singleton, đúng như mong muốn", "Lỗi khởi động", "Singleton thành prototype"],
            answer: 1,
            explain: "Chiều ngược lại mới có vấn đề.",
          },
        },
      ],
    },
    {
      id: "lifecycle",
      title: "Phần 4: Vòng đời bean",
      board: {
        title: "Vòng đời một bean",
        highlight: "vòng đời",
        chips: ["Annotation, rồi interface, rồi cấu hình", "BPP after tạo proxy"],
        cards: [
          {
            title: "Từ tạo tới huỷ",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["Constructor, setter injection", "Aware callbacks", "BPP before", "@PostConstruct, afterPropertiesSet, initMethod", "BPP after: tạo AOP proxy"],
              ok: ["Khởi động xong", "Bean sẵn sàng"],
              bad: ["Đóng context", "@PreDestroy, destroy()"],
            },
            notes: ["Bean trong context có thể là `OrderCache$$SpringCGLIB$$0`, không phải object bạn `new`."],
            takeaway: "Proxy chỉ xuất hiện ở bước BPP after",
          },
          {
            title: "Bẫy @PostConstruct",
            diagram: {
              kind: "flow",
              steps: ["@PostConstruct", "this.txMethod()", "this là object gốc"],
              ok: ["Gọi qua bean khác", "Có transaction"],
              bad: ["Gọi qua this", "Không có transaction"],
            },
            notes: ["Lúc `@PostConstruct` chạy, proxy còn chưa được tạo.", "Muốn code chạy sau khi mọi bean sẵn sàng: `ApplicationRunner` hoặc `ApplicationReadyEvent`."],
            takeaway: "Đừng dựa vào proxy trong @PostConstruct",
          },
        ],
        conclusion: "**Kết luận:** thứ tự khởi tạo là cố định, và AOP proxy chỉ có sau khi bean đã khởi tạo xong.",
      },
      scene: "lifecycle",
      intro: [
        "Hai từ cần biết trước: **BPP** ({{bpp|BeanPostProcessor}}) là bean đặc biệt được Spring gọi hai lần với mỗi bean khác, trước (before) và sau (after) bước khởi tạo, và được phép trả về một object khác thay thế (Phần 5 nói kỹ). **Aware callback** là các interface như `BeanNameAware`, `ApplicationContextAware`: Spring gọi để đưa cho bean tên của nó hay chính context.",
        "Thứ tự đo được: `BeanFactoryPostProcessor` (chỉ có definition), constructor, setter injection, Aware callbacks, BPP before, `@PostConstruct`, `afterPropertiesSet()`, `initMethod`, **BPP after (tạo AOP proxy)**, bean sẵn sàng. Đóng context: `@PreDestroy`, `destroy()`, `destroyMethod`. Nhớ: annotation, rồi interface, rồi cấu hình.",
        "Bean trong context có thể không phải object bạn `new`: BPP after trả về `OrderCache$$SpringCGLIB$$0`, một {{proxy|proxy}} (class con do CGLIB sinh, nhận lời gọi, làm thêm việc như mở transaction, rồi chuyển cho object gốc). Đây là cách `@Transactional`, `@Async`, `@Cacheable` hoạt động. Hệ quả cần nhớ cho câu dự đoán: lời gọi qua `this` không đi qua proxy, vì `this` là object gốc.",
      ],
      after: [
        "Vì sao `@PostConstruct` gọi `this.txMethod()` không có transaction? Lý do chính: `this` **luôn là object gốc**, lời gọi qua `this` không bao giờ đi qua proxy, kể cả sau khi app đã start. Lý do thứ hai là thời điểm: lúc `@PostConstruct` chạy, proxy còn chưa được tạo.",
        "Muốn chạy code khi mọi bean đã là proxy hoàn chỉnh: đặt trong `ApplicationRunner` hoặc `@EventListener(ApplicationReadyEvent.class)`, và gọi method cần transaction qua một bean khác (Phần 6).",
      ],
      predict: {
        question: "Trong `@PostConstruct`, bean gọi `this.txMethod()` (method có `@Transactional`). Có transaction không?",
        options: [
          "Có, `@Transactional` luôn có tác dụng",
          "Không: `this` là object gốc, và proxy chỉ được tạo ở bước BPP after, sau `@PostConstruct`",
          "Có, nhưng chỉ khi bean là singleton",
          "App fail khi start",
        ],
        answer: 1,
        explain: "Transaction nằm ở proxy. Lời gọi qua `this` không bao giờ đi qua proxy, và lúc `@PostConstruct` chạy proxy còn chưa tồn tại.",
      },
      widget: "bean-lifecycle",
      widgetTitle: "Đi qua từng bước",
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["`@PostConstruct` chạy trước BPP after → proxy chưa có, và `this` luôn là object gốc → `@Transactional`, `@Async` của chính bean không có tác dụng ở đây."],
      },
      quiz: {
        question: "Muốn chạy code khi app đã sẵn sàng hoàn toàn (đã có proxy, transaction) thì đặt ở đâu?",
        options: ["Constructor", "@PostConstruct", "ApplicationRunner hoặc @EventListener(ApplicationReadyEvent.class)", "BeanFactoryPostProcessor"],
        answer: 2,
        explain: "Lúc đó mọi bean đã là proxy hoàn chỉnh.",
      },
    },
    {
      id: "bpp",
      title: "Phần 5: BeanPostProcessor và BeanFactoryPostProcessor",
      scene: "bpp",
      intro: [
        "Phần 4 đã gặp BPP trong vòng đời. Spring còn một loại thứ hai chạy sớm hơn nữa, trước cả khi có bean: BFPP.",
        "**BFPP** can thiệp **bean definition** (bản vẽ), chạy trước khi tạo bất kỳ bean thường nào: `PropertySourcesPlaceholderConfigurer` thay `${...}`, `ConfigurationClassPostProcessor` xử lý `@Configuration`, `@ComponentScan`, `@Import`. **BPP** can thiệp **bean instance** (căn nhà đã xây): `AutowiredAnnotationBeanPostProcessor` cho `@Autowired`, `CommonAnnotationBeanPostProcessor` cho `@PostConstruct`, `AnnotationAwareAspectJAutoProxyCreator` tạo AOP proxy.",
        "Method `@Bean` trả về BFPP nên khai báo `static`. Vì sao: BFPP phải chạy trước mọi bean thường. Nếu method không `static`, Spring phải tạo object của class `@Configuration` trước để gọi method, mà lúc đó các BPP chưa tồn tại, nên `@Autowired` và `@Value` trong class config đó bị bỏ qua.",
        "Cùng lý do, bean mà một BPP phụ thuộc bị tạo sớm, trước khi các BPP khác sẵn sàng, nên nó lỡ các BPP đó, kể cả BPP tạo proxy cho `@Transactional`. Spring báo bằng log \"is not eligible for getting processed by all BeanPostProcessors\".",
      ],
      takeaway: {
        lines: ["**BFPP** sửa bản vẽ (bean definition), trước khi xây. **BPP** sửa căn nhà đã xây (bean instance), và có thể thay nó bằng proxy."],
      },
      quiz: {
        question: "${payment.url} trong @Value được thay bằng giá trị thật nhờ đâu?",
        options: ["Jackson", "Một BFPP (PropertySourcesPlaceholderConfigurer) thay placeholder trên bean definition, trước khi tạo bean", "DispatcherServlet", "Hibernate"],
        answer: 1,
        explain: "BFPP lo placeholder, BPP lo inject.",
      },
    },
    {
      id: "post-construct",
      title: "Phần 6: @PostConstruct: dùng đúng và bẫy",
      scene: "postconstruct",
      intro: [
        "Dùng `@PostConstruct` để validate cấu hình và fail sớm, hoặc nạp dữ liệu nhỏ vào bộ nhớ. Bẫy:",
        "- **Gọi `@Transactional`, `@Async` của chính bean**: gọi qua `this` nên không qua proxy, `@Async` chạy đồng bộ trên thread main.",
        "- **Gọi API ngoài hay query nặng**: làm chậm khởi động, và một lỗi mạng làm app không start.",
        "- **Ném exception**: cả app fail.",
        "Việc cần transaction hay gọi service khác lúc khởi động: đặt trong `@EventListener(ApplicationReadyEvent.class)` hoặc `ApplicationRunner`, gọi qua bean khác để đi qua proxy.",
      ],
      quiz: {
        question: "Gọi method @Async của chính bean trong @PostConstruct thì chạy ở đâu?",
        options: ["Thread pool của @Async", "Đồng bộ trên thread main vì không qua proxy", "Không chạy", "Virtual thread"],
        answer: 1,
        explain: "Giống self-invocation.",
      },
    },
  ],
  modelAnswer:
    "Mặc định bean là singleton, một instance cho mỗi container, nhưng không tự thread-safe: em đã thấy 8 thread count++ trên field của singleton mất update, nên em viết bean stateless, dữ liệu request đi qua tham số. Prototype inject vào singleton thì luôn là cùng một instance vì injection chỉ xảy ra một lần; em dùng ObjectProvider khi cần instance mới, và cẩn thận với scoped proxy vì mỗi lần gọi là một instance khác. Vòng đời bean em đã in ra: constructor, injection, Aware, BPP before với @PostConstruct, afterPropertiesSet, initMethod, rồi BPP after mới tạo AOP proxy. Vì vậy trong @PostConstruct this là object gốc, gọi @Transactional của chính mình không có tác dụng; việc khởi động cần transaction em đặt ở ApplicationReadyEvent. BFPP sửa bean definition trước khi tạo bean, BPP xử lý từng instance và có thể thay bằng proxy.",
};
