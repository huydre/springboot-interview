import timeline from "../timelines/ioc.json";
import type { Lesson, Scene } from "../types";

// Behaviour and exception messages from Spring Boot 3.5 (Spring Framework 6.2) on JDK 21; see study note 04.01.
//
export const ioc: Lesson = {
  slug: "ioc",
  crumb: "IoC & Dependency Injection",
  videoDir: "/videos/ioc-di",
  // Per-scene clips cut by `video-kit/pipeline.py ioc-video publish`, which also rewrites videoVersion.
  videoVersion: "44043819",
  scenes: timeline as Scene[],
  title: "IoC & Dependency Injection",
  subtitle:
    "IoC và DI, ApplicationContext, constructor với setter và field injection, circular dependency từ Boot 2.6, nhiều bean cùng kiểu, @Component với @Bean và proxyBeanMethods.",
  openingQuiz: {
    question: "Spring Boot 3, hai bean phụ thuộc vòng qua field @Autowired, không cấu hình gì thêm. Chuyện gì xảy ra?",
    options: [
      "Spring tự gỡ bằng 3 cấp cache, app chạy bình thường",
      "App fail khi start: từ Boot 2.6 allow-circular-references mặc định là false",
      "Một field bị null",
      "Lỗi lúc gọi request đầu tiên",
    ],
    answer: 1,
    explain: "Đã chạy: \"The dependencies of some of the beans in the application context form a cycle\". Nói \"Spring tự gỡ bằng 3-level cache\" mà không nhắc Boot 2.6 là câu trả lời lỗi thời.",
  },
  roadmap: [
    "Chặng 1: IoC, DI và ApplicationContext.",
    "Chặng 2: constructor injection và circular dependency.",
    "Chặng 3: nhiều bean cùng kiểu, @Component với @Bean, proxyBeanMethods.",
  ],
  sections: [
    {
      id: "ioc-di",
      title: "Phần 1: IoC và DI",
      scene: "ioc",
      intro: [
        "Không có Spring, `OrderService` tự `new JdbcOrderRepository()` và `new VnPayClient(...)`: nó biết quá nhiều và không thay được bằng mock. **IoC** là nguyên lý: quyền tạo object và nối phụ thuộc chuyển sang framework, bạn chỉ khai báo \"tôi cần gì\". **DI** là một cách hiện thực IoC: phụ thuộc được tiêm vào qua constructor, setter hoặc field.",
        "Ví von: IoC là đi ăn nhà hàng thay vì tự nấu; DI là người phục vụ mang món tới bàn. IoC còn có dạng khác như template method, event listener, Service Locator, nên \"IoC và DI là một\" là sai. Phụ thuộc vào interface là chữ D trong SOLID.",
      ],
      quiz: {
        question: "Dạng nào sau đây là IoC nhưng không phải DI?",
        options: ["Constructor injection", "Template method: framework gọi code của bạn", "Setter injection", "Field injection"],
        answer: 1,
        explain: "Event listener và Service Locator cũng là IoC không phải DI.",
      },
    },
    {
      id: "context",
      title: "Phần 2: ApplicationContext",
      scene: "context",
      intro: [
        "`ApplicationContext` mở rộng `BeanFactory`: tạo singleton **eager** lúc khởi động, thêm event, i18n, `Environment` và profile, tự đăng ký `BeanPostProcessor`. Container làm 2 pha: đọc bean definition (component scan, `@Bean`, auto-configuration), rồi tạo bean theo thứ tự phụ thuộc.",
        "Vì tạo eager nên thiếu bean, trùng bean hay vòng phụ thuộc đều làm app fail khi start, lỗi lộ ra trên máy dev chứ không phải production lúc 2 giờ sáng. Đã đo: web app tạo `AnnotationConfigServletWebServerApplicationContext`, app không web tạo `AnnotationConfigApplicationContext`.",
      ],
      quiz: {
        question: "Vì sao tạo singleton eager lúc khởi động là điều tốt?",
        options: ["Tiết kiệm RAM", "Lỗi cấu hình lộ ra ngay khi start thay vì ở request đầu tiên trên production", "Chạy request nhanh gấp đôi", "Không cần GC"],
        answer: 1,
        explain: "BeanFactory thuần thì lazy, lỗi để tới lúc getBean.",
      },
    },
    {
      id: "injection",
      title: "Phần 3: Constructor, setter và field injection",
      scene: "inject",
      intro: [
        "**Constructor injection** là mặc định: field `final` bất biến, object luôn đủ phụ thuộc, unit test chỉ cần `new OrderService(mock, mock)`, constructor 8 tham số lộ ra class làm quá nhiều việc. Từ Spring 4.3, class chỉ có 1 constructor không cần `@Autowired`. Setter injection cho phụ thuộc tuỳ chọn; field injection chỉ cho code test hay code cũ.",
        "Bẫy: `@RequiredArgsConstructor` chỉ sinh tham số cho field `final`, quên `final` là field đó null. Hai constructor mà không đánh `@Autowired` lên cái nào thì Spring dùng constructor không tham số. Field injection dùng reflection nhưng chỉ một lần lúc khởi động: lý do tránh nó là thiết kế và khả năng test, không phải tốc độ.",
      ],
      quiz: {
        question: "Lý do nào KHÔNG phải ưu điểm của constructor injection?",
        options: ["Field final, bất biến", "Test không cần Spring", "Lộ ra class có quá nhiều phụ thuộc", "Chạy request nhanh hơn field injection"],
        answer: 3,
        explain: "Khác biệt hiệu năng không đáng kể.",
      },
    },
    {
      id: "circular",
      title: "Phần 4: Circular dependency",
      scene: "circular",
      intro: [
        "Từ Boot 2.6, `spring.main.allow-circular-references` mặc định false: mọi vòng phụ thuộc làm app fail khi start, kể cả field injection. Root cause đo được: `BeanCurrentlyInCreationException: Requested bean is currently in creation`. Bật `true` thì field injection chạy được (early reference trong 3 cấp cache), constructor injection **vẫn** fail vì A chưa tồn tại tới khi constructor chạy xong.",
        "Cách đúng: thiết kế lại, tách phần dùng chung ra bean thứ ba, hoặc dùng event. `@Lazy` trên một tham số chạy được vì nhận proxy CGLIB, nhưng đẩy lỗi sang runtime và chỉ che vấn đề. Nâng Boot 2.5 lên 2.7 mà app không start được: hay là do vòng phụ thuộc cũ qua field injection.",
      ],
      widget: "circular-dep",
      widgetTitle: "Kiểu inject so với cấu hình",
      quiz: {
        question: "@Lazy gỡ vòng phụ thuộc bằng cách nào?",
        options: ["Xoá một bean", "Inject một proxy, proxy chỉ lấy bean thật ở lần gọi method đầu tiên khi cả hai đã tạo xong", "Đổi sang field injection", "Tắt singleton"],
        answer: 1,
        explain: "Đo được class ...$$SpringCGLIB$$0.",
      },
    },
    {
      id: "multi-bean",
      title: "Phần 5: Nhiều bean cùng kiểu",
      scene: "multibean",
      intro: [
        "Hai bean implement `PaymentGateway` mà inject một cái: `NoUniqueBeanDefinitionException: expected single matching bean but found 2: momo,vnpay`. `@Primary` là \"không ai nói gì thì chọn tôi\"; `@Qualifier` ở điểm inject thắng `@Primary`; `List<T>` lấy tất cả theo `@Order`; `Map<String, T>` lấy tất cả, key là tên bean.",
        "**Strategy pattern** bằng Map injection: `gateways.get(channel).pay(req)` thay chuỗi if/else, thêm kênh chỉ cần thêm một `@Component(\"shopeepay\")`. Bẫy: tên bean mặc định là tên class viết thường chữ đầu, dễ lệch với giá trị channel; `@Primary` trên hai bean cùng kiểu lại lỗi; field `@Autowired List<T>` mà không có bean nào thì fail, còn qua constructor duy nhất thì Spring tiêm List rỗng; muốn rõ ý đồ thì dùng `ObjectProvider` hoặc `@Autowired(required = false)`.",
      ],
      widget: "bean-pick",
      widgetTitle: "Bean nào được inject",
      quiz: {
        question: "Không có @Primary hay @Qualifier, nhưng tên tham số trùng tên bean (PaymentGateway vnpay). Có chạy không?",
        options: ["Không", "Có, Spring dùng tên tham số làm fallback, nhưng đổi tên biến là hỏng nên dùng @Qualifier cho rõ", "Chỉ với field injection", "Chỉ khi có @Order"],
        answer: 1,
        explain: "Cần biên dịch với -parameters, plugin Spring Boot bật sẵn.",
      },
    },
    {
      id: "component-bean",
      title: "Phần 6: @Component, @Bean và proxyBeanMethods",
      scene: "bean",
      intro: [
        "`@Component` (và `@Service`, `@Repository`, `@Controller`) cho class của mình, component scan tự phát hiện. `@Bean` trong `@Configuration` cho class thư viện như `RestClient`, `ObjectMapper`, hoặc khi cần logic khởi tạo. `@Repository` thêm exception translation sang `DataAccessException`; `@Controller` là handler của MVC; `@Service` hiện chỉ mang ý nghĩa.",
        "`proxyBeanMethods = true` (mặc định): config là CGLIB subclass, gọi `repo()` trong `svc()` trả singleton. `false`: `repo()` chạy như method thường, ra 2 instance. Auto-configuration của Boot dùng `false`; lấy phụ thuộc qua tham số `@Bean Svc svc(Repo repo)` thì đúng ở cả hai chế độ. Method `@Bean` không được `private` hay `final` khi có proxy.",
      ],
      widget: "proxy-bean-methods",
      widgetTitle: "Gọi method @Bean trực tiếp",
      quiz: {
        question: "@Bean đặt trong class chỉ có @Component (không phải @Configuration) thì sao?",
        options: ["Không đăng ký bean", "Chạy ở chế độ lite, giống proxyBeanMethods = false", "Lỗi khởi động", "Giống hệt @Configuration"],
        answer: 1,
        explain: "Gọi method @Bean trực tiếp sẽ tạo object mới.",
      },
    },
  ],
  modelAnswer:
    "IoC là nguyên lý đảo quyền tạo object và nối phụ thuộc sang container, DI là cách hiện thực phổ biến nhất. ApplicationContext tạo singleton ngay lúc khởi động nên lỗi cấu hình lộ ra sớm. Em dùng constructor injection: field final, test chỉ cần new, và constructor dài là tín hiệu class làm quá nhiều việc. Từ Boot 2.6 vòng phụ thuộc bị cấm mặc định, em đã thử: field injection cũng fail khi start, bật allow-circular-references thì field chạy được còn constructor vẫn fail; cách đúng là tách bean thứ ba hoặc dùng event. Nhiều bean cùng kiểu thì @Qualifier thắng @Primary, và em hay inject Map<String, PaymentGateway> làm strategy pattern. Class thư viện em khai báo bằng @Bean, và biết proxyBeanMethods = false thì gọi method @Bean trực tiếp sẽ tạo instance mới, nên lấy phụ thuộc qua tham số.",
};
