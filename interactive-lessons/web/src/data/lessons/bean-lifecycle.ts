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
    explain: "Đã đo: trong @PostConstruct, this là proxy? false; sau BeanPostProcessor after, bean trong context mới là OrderCache$$SpringCGLIB$$0.",
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
        "Scope trả lời: container giữ bao nhiêu instance và mỗi instance sống bao lâu. **singleton** (mặc định) 1 instance cho mỗi `ApplicationContext`; **prototype** mỗi lần lấy tạo mới; `request`, `session`, `application`, `websocket` cho web. `@RequestScope` là `@Scope(\"request\")` kèm proxy `TARGET_CLASS`.",
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
        "**Không tự động.** 200 worker thread của Tomcat có thể chạy đồng thời trong cùng một object; mọi field thay đổi được là shared mutable state. Đã đo: 8 thread gọi `count++` tổng 100.000 lần trên field của singleton ra 99.791.",
        "Viết đúng: **stateless** (chỉ field `final` trỏ tới bean khác, dữ liệu theo request đi qua tham số và biến cục bộ); cần state thì `AtomicLong`, `LongAdder`, `ConcurrentHashMap`; state theo request dùng `@RequestScope` hoặc DTO; cache thật dùng Caffeine hay Redis.",
      ],
      widget: "singleton-state",
      widgetTitle: "Hai request trong một singleton",
      quiz: {
        question: "Inject singleton vào prototype có vấn đề gì không?",
        options: ["Có, singleton bị nhân bản", "Không: mỗi prototype mới nhận cùng một singleton, đúng như mong muốn", "Lỗi khởi động", "Singleton thành prototype"],
        answer: 1,
        explain: "Chiều ngược lại mới có vấn đề.",
      },
    },
    {
      id: "prototype",
      title: "Phần 3: Prototype inject vào singleton",
      scene: "prototype",
      intro: [
        "Injection chỉ xảy ra một lần lúc tạo singleton, nên prototype bên trong cũng chỉ lấy một lần: đo được id 1 rồi vẫn 1. Sửa bằng `ObjectProvider<Cart>.getObject()` (2, 3), `@Lookup` (4, 5), hoặc scoped proxy (6, 7).",
        "Em chọn `ObjectProvider`: rõ ràng, dễ test, có `getIfAvailable()`. Scoped proxy có bẫy: mỗi lần gọi method qua proxy là một instance mới, đo được id đổi giữa 2 lần gọi trên cùng một field; nó hợp với `request`, `session` (trong một request vẫn là một instance). Inject `ApplicationContext` rồi `getBean` chạy được nhưng là Service Locator, khó test.",
      ],
      widget: "prototype-scope",
      widgetTitle: "Bốn cách lấy prototype từ singleton",
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
    },
    {
      id: "lifecycle",
      title: "Phần 4: Vòng đời bean",
      scene: "lifecycle",
      intro: [
        "Thứ tự đo được: `BeanFactoryPostProcessor` (chỉ có definition), constructor, setter injection, Aware callbacks, BPP before, `@PostConstruct`, `afterPropertiesSet()`, `initMethod`, **BPP after (tạo AOP proxy)**, bean sẵn sàng. Đóng context: `@PreDestroy`, `destroy()`, `destroyMethod`. Nhớ: annotation, rồi interface, rồi cấu hình.",
        "Bean trong context có thể không phải object bạn `new`: BPP after trả về `OrderCache$$SpringCGLIB$$0`. Đây là cách `@Transactional`, `@Async`, `@Cacheable` hoạt động. Proxy tạo muộn để bọc object đã khởi tạo xong, nên code trong `@PostConstruct` không được hưởng proxy.",
      ],
      widget: "bean-lifecycle",
      widgetTitle: "Đi qua từng bước",
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
        "**BFPP** can thiệp **bean definition** (bản vẽ), chạy trước khi tạo bất kỳ bean thường nào: `PropertySourcesPlaceholderConfigurer` thay `${...}`, `ConfigurationClassPostProcessor` xử lý `@Configuration`, `@ComponentScan`, `@Import`. **BPP** can thiệp **bean instance** (căn nhà đã xây): `AutowiredAnnotationBeanPostProcessor` cho `@Autowired`, `CommonAnnotationBeanPostProcessor` cho `@PostConstruct`, `AnnotationAwareAspectJAutoProxyCreator` tạo AOP proxy.",
        "Method `@Bean` trả về BFPP nên khai báo `static`. Bean mà một BPP phụ thuộc bị tạo sớm và có thể không được proxy: log \"is not eligible for getting processed by all BeanPostProcessors\".",
      ],
      quiz: {
        question: "${payment.url} trong @Value được thay bằng giá trị thật nhờ đâu?",
        options: ["Jackson", "PropertySourcesPlaceholderConfigurer (một BFPP) cùng Environment; giá trị inject ở pha populate bởi AutowiredAnnotationBeanPostProcessor", "DispatcherServlet", "Hibernate"],
        answer: 1,
        explain: "BFPP lo placeholder, BPP lo inject.",
      },
    },
    {
      id: "post-construct",
      title: "Phần 6: @PostConstruct: dùng đúng và bẫy",
      scene: "postconstruct",
      intro: [
        "Dùng `@PostConstruct` để validate cấu hình và fail sớm, hoặc nạp dữ liệu nhỏ vào bộ nhớ. Bẫy: gọi `@Transactional` hay `@Async` của chính bean (không qua proxy, `@Async` chạy đồng bộ trên thread main); gọi API ngoài hay query nặng làm chậm khởi động và một lỗi mạng làm app không start; ném exception làm cả app fail.",
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
