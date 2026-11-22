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
      takeaway: {
        lines: [
          "**IoC** là nguyên lý: framework nắm quyền tạo và nối object. **DI** chỉ là một cách hiện thực IoC, qua constructor, setter hoặc field.",
        ],
      },
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
      board: {
        title: "Container dựng bean theo hai pha",
        highlight: "hai pha",
        chips: ["ApplicationContext tạo singleton eager", "Lỗi nổ ngay khi start"],
        cards: [
          {
            title: "Pha 1: bean definition",
            diagram: {
              kind: "hub",
              inputs: [{ label: "Component scan" }, { label: "@Bean" }, { label: "Auto-configuration" }],
              center: "Bean definition",
              rulesTitle: "Mỗi definition ghi",
              rules: ["Class của bean", "Scope", "Các phụ thuộc"],
            },
            notes: ["Definition là \"công thức\" của bean, chưa phải object."],
            takeaway: "Ba nguồn cùng đổ vào một danh sách công thức",
          },
          {
            title: "Pha 2: tạo bean",
            diagram: {
              kind: "flow",
              steps: ["Đọc xong mọi definition", "Tạo singleton theo thứ tự phụ thuộc"],
              ok: ["Cấu hình đủ và đúng", "App start"],
              bad: ["Thiếu bean, trùng bean, vòng phụ thuộc", "App fail khi start"],
            },
            notes: ["Tạo eager nên lỗi cấu hình lộ trên máy dev, không đợi tới production."],
            takeaway: "Fail sớm là tính năng, không phải lỗi",
          },
        ],
        conclusion: "**Kết luận:** `ApplicationContext` đọc công thức trước, rồi tạo hết singleton ngay lúc khởi động.",
      },
      scene: "context",
      intro: [
        "Phần 1 nói framework nắm quyền tạo object. Trong Spring, \"framework\" đó là container, cụ thể là `ApplicationContext`.",
        "`BeanFactory` là container cơ bản: chỉ tạo bean khi có người xin (`getBean`). `ApplicationContext` mở rộng nó và tạo mọi singleton **eager**, nghĩa là tạo hết ngay lúc khởi động chứ không đợi lần dùng đầu tiên. Nó còn thêm:",
        "- **Event**: phát và nghe sự kiện trong app.",
        "- **i18n**: đa ngôn ngữ.",
        "- **`Environment`**: property và profile.",
        "- **{{bpp|BeanPostProcessor}}**: tự đăng ký các bean đặc biệt được gọi để xử lý thêm mọi bean khác, học kỹ ở bài Bean Lifecycle.",
        "Container làm 2 pha. Pha 1 đọc các {{bean-definition|bean definition}}: \"công thức\" của từng bean gồm class, scope và phụ thuộc, lấy từ component scan, `@Bean` và auto-configuration. Pha 2 tạo bean theo thứ tự phụ thuộc.",
        "Vì tạo eager nên thiếu bean, trùng bean hay vòng phụ thuộc đều làm app fail khi start, lỗi lộ ra trên máy dev chứ không phải production lúc 2 giờ sáng.",
      ],
      after: [
        "Chi tiết nhỏ: web app dùng `AnnotationConfigServletWebServerApplicationContext`, app không web dùng `AnnotationConfigApplicationContext`. Không cần nhớ tên, chỉ cần biết Boot chọn loại context theo kiểu ứng dụng.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Singleton tạo eager → lỗi cấu hình (thiếu bean, trùng bean, vòng phụ thuộc) nổ ngay khi start → sửa trên máy dev, không phải trên production."],
      },
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
        "Container đã biết tạo bean. Câu hỏi tiếp theo: phụ thuộc được tiêm vào bean theo đường nào?",
        "**Constructor injection** là mặc định, vì:",
        "- **Bất biến**: field `final`, không ai gán lại được.",
        "- **Luôn đủ**: object không bao giờ tồn tại khi thiếu phụ thuộc.",
        "- **Dễ test**: unit test chỉ cần `new OrderService(mock, mock)`.",
        "- **Lộ thiết kế xấu**: constructor 8 tham số cho thấy class làm quá nhiều việc.",
        "Từ Spring 4.3, class chỉ có 1 constructor không cần `@Autowired`. Setter injection cho phụ thuộc tuỳ chọn; field injection chỉ cho code test hay code cũ.",
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
        "Constructor injection có một hệ quả: hai bean cần nhau thì không bên nào tạo trước được. Tình huống: `OrderService` có field `@Autowired PaymentService payments`, và `PaymentService` có field `@Autowired OrderService orders`. Muốn tạo A phải có B, muốn tạo B lại phải có A: đó là vòng phụ thuộc (circular dependency).",
        "Từ Boot 2.6, `spring.main.allow-circular-references` mặc định false: mọi vòng phụ thuộc làm app fail khi start, kể cả field injection. Root cause đo được: `BeanCurrentlyInCreationException: Requested bean is currently in creation`.",
        "Bật `true` thì field injection chạy được nhờ **early reference**: Spring tạo object A bằng constructor (chưa inject gì), cất tạm A \"đang làm dở\" vào cache, rồi đưa chính object dở dang đó cho B. B xong thì quay lại inject B vào A. Constructor injection **vẫn** fail, vì A chỉ tồn tại sau khi constructor chạy xong, mà constructor lại cần B ngay.",
        "Cách đúng: thiết kế lại, tách phần dùng chung ra bean thứ ba, hoặc dùng event. Nâng Boot 2.5 lên 2.7 mà app không start được: hay là do vòng phụ thuộc cũ qua field injection.",
      ],
      trap: {
        title: "@Lazy chỉ che vấn đề",
        text: "`@Lazy` trên một tham số làm app start được: Spring tiêm vào một {{proxy|proxy}} (object đứng thế chỗ, nhận lời gọi rồi chuyển tiếp cho object thật), do {{cglib|CGLIB}} sinh ra. Proxy chỉ đi lấy bean thật ở lần gọi method đầu tiên, khi cả hai bean đã tạo xong. Vòng phụ thuộc vẫn còn đó, lỗi chỉ bị đẩy sang lúc chạy.",
      },
      predict: {
        question: "Boot 3, đã bật `allow-circular-references=true`. Hai bean cần nhau qua **constructor**. App có start được không?",
        options: [
          "Có, cờ đã bật thì mọi vòng đều được gỡ",
          "Không, constructor injection vẫn fail vì A chỉ tồn tại sau khi constructor (cần B) chạy xong",
          "Có, nhưng một tham số bị null",
          "Chỉ fail ở request đầu tiên",
        ],
        answer: 1,
        explain: "Early reference chỉ cứu được field injection: object A phải tạo xong bằng constructor rồi mới cất vào cache. Với constructor injection, A chưa thể tồn tại khi còn thiếu B.",
      },
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
        "Hai bean implement `PaymentGateway` mà inject một cái: `NoUniqueBeanDefinitionException: expected single matching bean but found 2: momo,vnpay`. Có 4 cách chỉ cho Spring:",
        "- **`@Primary`**: \"không ai nói gì thì chọn tôi\".",
        "- **`@Qualifier`**: ghi ở điểm inject, thắng `@Primary`.",
        "- **`List<T>`**: lấy tất cả, theo thứ tự `@Order`.",
        "- **`Map<String, T>`**: lấy tất cả, key là tên bean.",
        "Không có `@Primary` hay `@Qualifier` thì Spring còn một cách cuối: so **tên tham số** với tên bean. Tham số `PaymentGateway vnpay` sẽ nhận bean `vnpay`. Cách này cần class được biên dịch với cờ `-parameters` (giữ tên tham số trong file .class, plugin Spring Boot bật sẵn), và hỏng ngay khi ai đó đổi tên biến, nên hãy ghi `@Qualifier` cho rõ.",
      ],
      after: [
        "**Strategy pattern** bằng Map injection: constructor nhận `Map<String, PaymentGateway> gateways`, rồi `gateways.get(channel).pay(req)` thay cho chuỗi if/else. Thêm kênh mới chỉ cần thêm một `@Component(\"shopeepay\")`, không sửa code cũ.",
      ],
      trap: {
        title: "Những bẫy khi có nhiều bean",
        text: "Tên bean mặc định là tên class viết thường chữ đầu (`VnPayGateway` thành `vnPayGateway`), dễ lệch với giá trị channel từ request. `@Primary` trên hai bean cùng kiểu lại lỗi. Field `@Autowired List<T>` mà không có bean nào thì fail, còn qua constructor duy nhất thì Spring tiêm List rỗng; muốn rõ ý đồ thì dùng `ObjectProvider` hoặc `@Autowired(required = false)`.",
      },
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
        "Đoạn config để thử: trong class `@Configuration` có `@Bean Repo repo() { return new Repo(); }` và `@Bean Svc svc() { return new Svc(repo()); }`. Câu hỏi: `Svc` nhận đúng bean `Repo` singleton, hay một `Repo` mới?",
        "`proxyBeanMethods = true` (mặc định): Spring dùng {{cglib|CGLIB}} sinh một class con của config và override mọi method `@Bean`. Gọi `repo()` trong `svc()` thật ra đi vào bản override, bản này trả bean đã có trong container, nên chỉ có 1 instance. `false`: `repo()` chạy như method Java thường, ra 2 instance.",
        "Auto-configuration của Boot dùng `false` cho nhanh; lấy phụ thuộc qua tham số `@Bean Svc svc(Repo repo)` thì đúng ở cả hai chế độ. Method `@Bean` không được `private` hay `final` khi có proxy, vì class con không override được method đó, và lời gọi sẽ chạy thẳng code gốc.",
        "`@Bean` đặt trong class chỉ có `@Component` (không phải `@Configuration`) gọi là **lite mode**: bean vẫn được đăng ký, nhưng class không bị CGLIB bọc, nên hành xử giống `proxyBeanMethods = false`.",
      ],
      predict: {
        question: "Đổi config trên sang `proxyBeanMethods = false`. Sau khi khởi động có bao nhiêu instance `Repo`?",
        options: ["1, vì bean luôn là singleton", "2: bean `repo` trong container và bản `new Repo()` chạy lại trong `svc()`", "0, app fail khi start", "Tuỳ thứ tự tạo bean"],
        answer: 1,
        explain: "Không có CGLIB subclass chặn lời gọi, `repo()` chỉ là method Java thường nên chạy `new Repo()` thêm một lần.",
      },
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
