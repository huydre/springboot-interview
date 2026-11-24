import timeline from "../timelines/auto-config.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs measured on Spring Boot 3.5 on JDK 21, including a hand-written starter, except the env var mapping in the precedence part (Spring Boot 4.1.1); see study note 04.03.
//
export const autoConfig: Lesson = {
  slug: "auto-config",
  crumb: "Spring Boot Auto-configuration",
  videoDir: "/videos/boot-auto-config",
  // Per-scene clips cut by `video-kit/pipeline.py autoconfig-video publish`, which also rewrites videoVersion.
  videoVersion: "ead68ed7",
  scenes: timeline as Scene[],
  title: "Spring Boot Auto-configuration",
  subtitle:
    "Boot khác Spring Framework ở đâu, @SpringBootApplication, auto-configuration và @Conditional, SpringApplication.run(), @ConfigurationProperties, thứ tự ưu tiên property, Actuator.",
  openingQuiz: {
    question: "Bạn tự khai báo @Bean ObjectMapper. Bean ObjectMapper mặc định của Boot thì sao?",
    options: [
      "Hai bean cùng tồn tại, lỗi NoUnique",
      "Không được tạo nữa vì @ConditionalOnMissingBean; spring.jackson.* trong yml cũng không còn áp dụng",
      "Bean của Boot đè bean của bạn",
      "Boot gộp hai cấu hình",
    ],
    answer: 1,
    explain: "Đã đo: context chỉ còn 1 ObjectMapper tên myMapper. Chỉ muốn chỉnh thêm thì dùng Jackson2ObjectMapperBuilderCustomizer.",
  },
  roadmap: [
    "Chặng 1: Boot là gì, @SpringBootApplication, auto-configuration.",
    "Chặng 2: SpringApplication.run() và thứ tự event.",
    "Chặng 3: @ConfigurationProperties, thứ tự property, Actuator và graceful shutdown.",
  ],
  sections: [
    {
      id: "boot",
      title: "Phần 1: Boot và @SpringBootApplication",
      scene: "boot",
      intro: [
        "Boot không thay Spring, mà là lớp mặc định bên trên:",
        "- **Auto-configuration**: tạo bean theo classpath và property.",
        "- **Starter**: gom dependency với version do BOM quản lý.",
        "- **Embedded Tomcat**: chạy bằng `java -jar`.",
        "- **Cấu hình ngoài**: qua yml, env var, profile.",
        "- **Actuator**: endpoint theo dõi app.",
        "DI, AOP, MVC, transaction vẫn là của Spring Framework.",
        "`@SpringBootApplication` = `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan` (package chứa class main và các package con). Class main phải ở package gốc: bean ở `com.shop.common` ngang hàng với `com.shop.order` không được scan, ra `NoSuchBeanDefinitionException`. Tắt một auto-config bằng `exclude` hoặc `spring.autoconfigure.exclude`.",
      ],
      quiz: {
        question: "Class main ở com.shop.order, có @Service ở com.shop.common. Chuyện gì xảy ra?",
        options: ["Chạy bình thường", "Không được scan: NoSuchBeanDefinitionException khi inject", "Boot tự quét mọi package", "Bean thành prototype"],
        answer: 1,
        explain: "Đặt main ở package gốc hoặc dùng scanBasePackages.",
      },
    },
    {
      id: "auto-config",
      senior: true,
      title: "Phần 2: Auto-configuration hoạt động thế nào",
      scene: "autoconfig",
      intro: [
        "`@EnableAutoConfiguration` import `AutoConfigurationImportSelector`, đọc danh sách class trong `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` của mọi JAR (Boot 3 không còn đọc `spring.factories` cho auto-config). Mỗi class được canh bởi các điều kiện `@Conditional*`, chỉ tạo bean khi điều kiện đúng.",
        "Các điều kiện hay gặp:",
        "- **`@ConditionalOnClass`**: chỉ chạy khi class đó có trên classpath (có thêm starter).",
        "- **`@ConditionalOnMissingBean`**: chỉ tạo khi bạn **chưa** khai báo bean cùng kiểu.",
        "- **`@ConditionalOnProperty`**: chỉ chạy khi property có giá trị như yêu cầu, thường là cờ bật tắt.",
        "- **`@ConditionalOnWebApplication`**: chỉ chạy trong ứng dụng web.",
        "Chạy `--debug` để có `CONDITIONS EVALUATION REPORT` (Positive matches, Negative matches, Exclusions, Unconditional classes), ví dụ `DataSourceAutoConfiguration: @ConditionalOnClass did not find required class`. Có Actuator thì xem ở `/actuator/conditions`. Viết thư viện nội bộ: class `@AutoConfiguration` có `@ConditionalOnMissingBean` để người dùng override, đăng ký trong file `.imports`, đừng dựa vào component scan.",
      ],
      after: [
        "Quay lại câu hỏi mở đầu: bạn khai báo `@Bean ObjectMapper myMapper()`. Auto-config của Jackson được xử lý **sau** bean của bạn, nên `@ConditionalOnMissingBean` nhìn thấy `myMapper` và nhường: Boot không tạo `ObjectMapper` của nó nữa, và các cấu hình `spring.jackson.*` trong yml cũng mất tác dụng theo. Đã đo: context chỉ còn 1 `ObjectMapper` tên `myMapper`.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Auto-config chạy sau bean của bạn → `@ConditionalOnMissingBean` thấy bean của bạn → Boot nhường, kéo theo cấu hình `spring.*` liên quan mất tác dụng."],
      },
      widget: "auto-config",
      widgetTitle: "Starter tự viết và @ConditionalOnMissingBean",
      quiz: {
        question: "Bean của Boot không được tạo như mong đợi. Công cụ số 1 để tìm lý do?",
        options: ["Đọc mã nguồn Boot", "Chạy với --debug để xem Condition Evaluation Report", "Restart máy", "Xoá thư mục target"],
        answer: 1,
        explain: "Report ghi rõ điều kiện nào match, điều kiện nào không.",
      },
    },
    {
      id: "run",
      title: "Phần 3: SpringApplication.run()",
      scene: "run",
      intro: [
        "`run()` xác định loại ứng dụng (Servlet, Reactive, None), chuẩn bị `Environment`, tạo `ApplicationContext`, refresh (đọc definition, BFPP, tạo singleton, BPP tạo proxy), khởi động embedded server, gọi `ApplicationRunner`/`CommandLineRunner`, rồi phát `ApplicationReadyEvent`.",
        "Không cần thuộc hết 9 event. Nhớ 3 mốc:",
        "- **Refresh**: tạo mọi bean, rồi khởi động web server ngay bên trong pha này.",
        "- **Runner**: `ApplicationRunner`/`CommandLineRunner`.",
        "- **Ready**: `ApplicationReadyEvent`, app sẵn sàng nhận traffic.",
        "Vì runner chạy **trước** Ready, một runner chậm 2 phút làm app chậm Ready 2 phút: probe readiness chưa báo sẵn sàng, nên Kubernetes chưa gửi traffic vào. Tác vụ lâu thì cho chạy async (đẩy sang thread khác) để không chặn khởi động. Runner ném exception thì app fail.",
      ],
      after: [
        "Thứ tự đầy đủ đã in ra: Starting, EnvironmentPrepared, ContextInitialized, Prepared, `ServletWebServerInitializedEvent`, `ContextRefreshedEvent`, Started, runner, Ready.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Runner chạy trước Ready → runner chậm 2 phút thì Ready chậm 2 phút → readiness chưa báo sẵn sàng, Kubernetes chưa gửi traffic."],
      },
      widget: "startup-events",
      widgetTitle: "Thứ tự event khi khởi động",
      quiz: {
        question: "Tác vụ khởi động chạy lâu nên đặt thế nào?",
        options: ["Trong constructor", "Trong ApplicationRunner hoặc @EventListener(ApplicationReadyEvent.class), chạy async để không chặn khởi động", "Trong @PostConstruct", "Trong BeanFactoryPostProcessor"],
        answer: 1,
        explain: "Runner ném exception là app fail.",
      },
    },
    {
      id: "properties",
      title: "Phần 4: @Value và @ConfigurationProperties",
      scene: "props",
      intro: [
        "Tình huống: `application.yml` có nhóm `payment` gồm `url: https://pay.local`, `timeout: 3s`, `retry: 2`. Ta khai báo `@ConfigurationProperties(prefix = \"payment\") @Validated public record PaymentProperties(@NotBlank String url, Duration timeout, @Min(0) int retry)`, rồi bật bằng `@ConfigurationPropertiesScan` trên class main.",
        "Kết quả đã đo: bind ra `PaymentProperties[url=https://pay.local, timeout=PT3S, retry=2]`. `PT3S` là cách Java in `Duration` theo chuẩn ISO-8601, nghĩa là 3 giây: chuỗi `3s` đã được tự convert sang kiểu `Duration`. Còn `@Value(\"${payment.timeout}\")` vào field `String` thì nhận nguyên chuỗi `3s`.",
        "Ưu điểm: type-safe, tự convert kiểu, và **relaxed binding**: tên nhiều từ viết kiểu nào cũng khớp, ví dụ `payment.max-retry`, `payment.maxRetry` và env var `PAYMENT_MAXRETRY` là cùng một key. Với tên một từ như `payment.url`, env var tương ứng là `PAYMENT_URL`.",
        "Những lỗi hay gặp:",
        "- **Giá trị sai**: app fail ngay khi start: `Property: payment.url  Value: \" \"  Reason: must not be blank`.",
        "- **`@Value` sai tên key, không có default**: `PlaceholderResolutionException: Could not resolve placeholder`.",
        "- **Quên `@EnableConfigurationProperties` hoặc `@ConfigurationPropertiesScan`**: record không thành bean.",
        "`@Value` hợp với vài giá trị lẻ hoặc khi cần SpEL (Spring Expression Language, biểu thức trong `#{...}` như `#{2 * 60}`).",
      ],
      quiz: {
        question: "Ưu điểm lớn nhất của @ConfigurationProperties + @Validated?",
        options: ["Chạy nhanh hơn", "Cấu hình sai làm app fail ngay khi start với thông báo rõ từng property", "Không cần yml", "Hỗ trợ SpEL"],
        answer: 1,
        explain: "SpEL thì chỉ @Value có.",
      },
      parts: [
        {
          id: "fail-fast-placeholder",
          title: "Placeholder có giá trị mặc định có che lỗi cấu hình không",
          intro: [
            "Phần trên có bẫy `@Value` sai key thì app fail lúc start. Cách \"cho yên tâm\" hay gặp là thêm giá trị mặc định: `${DB_HOST:localhost}`. Tình huống thật: Secret trên Kubernetes bị gõ sai tên, biến môi trường `DB_HOST` không bao giờ tới container.",
            "Placeholder `${KEY}` không có mặc định thì **ném lỗi** khi đọc. Có mặc định `${KEY:giá_trị}` thì Spring lặng lẽ dùng giá trị mặc định. Đã chạy trên Spring Boot 3.5.16 với hai key cùng trỏ vào `DB_HOST` chưa được đặt:",
            "- **`app.url-strict: ${DB_HOST}`**: đọc property ném `PlaceholderResolutionException: Could not resolve placeholder 'DB_HOST' in value \"${DB_HOST}\"`.",
            "- **`app.url-default: ${DB_HOST:localhost}`**: đọc ra `localhost`, không báo gì.",
            "Trong container, `localhost` là chính container đó, nên với hạ tầng thật (database, broker) app khởi động xong mới báo không kết nối được, hoặc tệ hơn là lặp restart. Đây là suy luận từ cách mạng container hoạt động, không phải kết quả đo.",
            "Quy tắc: mặc định chỉ đặt cho giá trị an toàn (port, timeout, cờ bật tắt). Địa chỉ hạ tầng và secret ở production **không có mặc định**, để cấu hình sai thì app chết ngay lúc start. Mặc định tiện cho máy dev thì để trong `application-dev.yml`.",
          ],
          predict: {
            question: "`application.yml` có `app.url: ${DB_HOST:localhost}` và biến môi trường `DB_HOST` chưa được đặt. Đọc `app.url` ra gì?",
            options: ["Ném PlaceholderResolutionException", "Chuỗi rỗng", "`localhost`", "`null`"],
            answer: 2,
            explain: "Đã chạy: phần sau dấu hai chấm là giá trị mặc định, nên Spring dùng `localhost` mà không báo lỗi.",
          },
          widgetTitle: "Biến môi trường DB_HOST không được truyền vào",
          compare: [
            way(
              "Không mặc định",
              `app:
  url-strict: \${DB_HOST}`,
              [
                ask("DB_HOST không được đặt", ok("Đọc property ném `PlaceholderResolutionException` ngay: lỗi cấu hình hiện ra lúc start, đúng chỗ.")),
              ],
              "Lỗi to và sớm, dễ sửa.",
            ),
            way(
              "Mặc định localhost",
              `app:
  url-default: \${DB_HOST:localhost}`,
              [
                ask("DB_HOST không được đặt", bad("Đọc ra `localhost` không báo gì; lỗi chỉ lộ khi kết nối thật sự thất bại.")),
                ask("Giá trị an toàn như `timeout: ${HTTP_TIMEOUT:3s}`", ok("Mặc định hợp lý, thiếu biến vẫn chạy đúng.")),
              ],
              "Chỉ đặt mặc định khi giá trị mặc định luôn đúng.",
            ),
          ],
          takeaway: {
            title: "Điều rút ra",
            lines: ["`${KEY}` không mặc định: thiếu thì lỗi ngay. `${KEY:giá_trị}`: thiếu thì im lặng dùng giá trị mặc định. Địa chỉ hạ tầng và secret ở production đừng đặt mặc định."],
          },
          quiz: {
            question: "Giá trị nào hợp để có mặc định trong `application.yml` dùng chung cho mọi môi trường?",
            options: ["Địa chỉ database production", "Mật khẩu database", "Timeout gọi HTTP `${HTTP_TIMEOUT:3s}`", "Khoá ký JWT"],
            answer: 2,
            explain: "Timeout có một giá trị mặc định luôn dùng được. Địa chỉ database, mật khẩu và khoá ký mà bị mặc định thì cấu hình sai sẽ không lộ ra lúc start.",
          },
        },
      ],
    },
    {
      id: "precedence",
      title: "Phần 5: Thứ tự ưu tiên property và profile",
      scene: "precedence",
      intro: [
        "Phần 4 đọc property vào code. Nhưng cùng một key `payment.url` có thể nằm ở nhiều nguồn cùng lúc: command-line, env var, file profile, file chung. Nguồn nào thắng?",
        "Env var map sang key theo quy tắc: viết hoa, dấu `.` thành `_`, bỏ dấu `-`. Ví dụ `PAYMENT_URL` là `payment.url`, `PAYMENT_MAXRETRY` là `payment.max-retry` (phép đo này chạy với Spring Boot 4.1.1: `payment.max-retry = 5`; các phần khác của bài đo trên 3.5.16).",
        "Kích hoạt profile bằng `--spring.profiles.active=prod` hoặc `SPRING_PROFILES_ACTIVE=prod`; `@Profile(\"dev\")` cho bean chỉ có ở dev. Secret không commit vào yml: env var, Vault, Secrets Manager, Kubernetes Secret.",
        "Bật tắt từng nguồn để xem giá trị cuối cùng đổi ra sao.",
      ],
      predict: {
        question: "Profile `dev` đang bật. `payment.url` có trong env var `PAYMENT_URL` và trong `application-dev.properties`. App dùng giá trị nào?",
        options: [
          "Giá trị trong `application-dev.properties`, vì file profile luôn thắng",
          "Giá trị của env var `PAYMENT_URL`",
          "Giá trị trong `application.properties`",
          "App fail vì key bị trùng",
        ],
        answer: 1,
        explain: "Env var đứng trên mọi file properties, kể cả file profile. Chỉ command-line mới thắng được env var.",
      },
      widget: "property-precedence",
      widgetTitle: "Giá trị nào thắng",
      after: [
        "Đã đo cùng key `payment.url` ở nhiều nguồn: command-line thắng env var, env var thắng `application-dev.properties`, file profile thắng `application.properties`, `setDefaultProperties` thấp nhất. File ngoài JAR thắng file trong JAR cùng loại: ops đổi cấu hình không cần build lại.",
      ],
      quiz: {
        question: "Production đặt env PAYMENT_URL nhưng app vẫn dùng URL cũ. Kiểm tra gì trước?",
        options: ["Đổi sang yml", "Có ai truyền --payment.url trên command-line không, và xem /actuator/env để biết nguồn của giá trị cuối", "Restart DB", "Tăng heap"],
        answer: 1,
        explain: "Cũng kiểm tra tên env var theo quy tắc relaxed binding.",
      },
      parts: [
        {
          id: "profile-yaml",
          title: "Một file YAML cho nhiều profile",
          intro: [
            "Phần trên nói file profile (`application-dev.properties`) thắng file chung. Mỗi profile một file thì sớm muộn có hàng chục file. Boot còn cho gộp nhiều profile vào **một file YAML nhiều tài liệu**, tách nhau bằng dòng `---`, mỗi tài liệu gắn điều kiện bằng `spring.config.activate.on-profile`.",
            "Điều kiện ở đó là một **biểu thức profile**: tên (`prod`), phủ định (`!prod`), và `&` hoặc `|`. Có thêm **nhóm profile**: `spring.profiles.group.production: proddb,prodmetrics` nghĩa là bật `production` thì bật luôn hai profile kia. Dòng khai báo nhóm đặt ở tài liệu đầu, không gắn profile.",
            "Ta sẽ chạy cùng file này với bốn cách bật profile: không bật gì, `prod`, `prod,eu` và `production`, và xem `app.greeting`, `app.region`, `app.db` ra gì.",
          ],
          predict: {
            question: "Bật `--spring.profiles.active=prod` (không có `eu`). File có khối `on-profile: prod & eu` đặt `app.region`. `app.region` là gì?",
            options: ["`eu-prod`", "Rỗng: khối `prod & eu` cần cả hai profile", "Lỗi lúc start", "`prod`"],
            answer: 1,
            explain: "Đã chạy: với `prod` thì `app.region` rỗng, chỉ khi bật `prod,eu` mới ra `eu-prod`.",
          },
          widgetTitle: "Cùng một file, bật profile khác nhau",
          compare: [
            way(
              "Khối theo từng profile",
              `app.greeting: base
---
spring.config.activate.on-profile: prod
app.greeting: prod
---
spring.config.activate.on-profile: "!prod"
app.greeting: not-prod`,
              [
                ask("Không bật profile", ok("`app.greeting` = `not-prod`.")),
                ask("`--spring.profiles.active=prod`", ok("`app.greeting` = `prod`.")),
              ],
              "Mỗi profile một tài liệu, đọc cùng một chỗ.",
            ),
            way(
              "Biểu thức & và nhóm profile",
              `spring.profiles.group.production: proddb,prodmetrics
---
spring.config.activate.on-profile: prod & eu
app.region: eu-prod
---
spring.config.activate.on-profile: proddb
app.db: proddb-on`,
              [
                ask("`prod,eu`", ok("`app.region` = `eu-prod`.")),
                ask("`prod` (thiếu `eu`)", bad("`app.region` rỗng: khối `prod & eu` cần cả hai.")),
                ask("`production`", ok("Bật luôn `proddb` và `prodmetrics`, `app.db` = `proddb-on`. Khối `on-profile: prod` thì không chạy vì `prod` không nằm trong nhóm.")),
              ],
              "Nhóm gom nhiều profile sau một tên, biểu thức chọn tổ hợp.",
            ),
          ],
          after: [
            "Đã chạy trên Spring Boot 3.5.16, mỗi lần một cách bật profile:",
            "- **Không bật profile nào**: `app.greeting` = `not-prod` (khối `!prod` chạy).",
            "- **`prod`**: `app.greeting` = `prod`, `app.region` rỗng.",
            "- **`prod,eu`**: `app.region` = `eu-prod` (khối `prod & eu` chạy).",
            "- **`production`**: profile đang bật là `[production, proddb, prodmetrics]`, `app.db` = `proddb-on`, nhưng `app.greeting` vẫn là `not-prod` vì profile `prod` **không** bật: `production` là một tên khác.",
          ],
          takeaway: {
            title: "Điều rút ra",
            lines: ["Một file YAML, nhiều tài liệu `---`, mỗi tài liệu gắn `spring.config.activate.on-profile` với biểu thức `!`, `&`, `|`. Nhóm profile bật nhiều profile bằng một tên, nhưng tên nhóm không phải là profile trong nhóm."],
          },
          quiz: {
            question: "File có khối `on-profile: prod` và nhóm `production: proddb,prodmetrics`. Bật profile `production`. Khối `on-profile: prod` có chạy không?",
            options: ["Có, vì tên bắt đầu bằng prod", "Không: profile đang bật là production, proddb, prodmetrics, không có prod", "Có, vì nhóm bao gồm prod", "Lỗi lúc start"],
            answer: 1,
            explain: "Đã chạy: `app.greeting` ra `not-prod`. Profile khớp theo đúng tên, không theo tiền tố.",
          },
        },
      ],
    },
    {
      id: "actuator",
      title: "Phần 6: Actuator và ứng dụng không có web",
      scene: "actuator",
      intro: [
        "Mặc định qua HTTP **chỉ expose `health`**: đã đo `/actuator/health` 200 `{\"status\":\"UP\"}`, còn `info`, `env`, `heapdump`, `beans` đều 404. Mở có chủ đích bằng `management.endpoints.web.exposure.include` và đặt trên management port nội bộ. `heapdump` chứa toàn bộ bộ nhớ, có thể có password, token: không bao giờ public.",
        "Kubernetes hỏi app hai câu qua hai probe. **Liveness** (\"app còn sống không?\"): fail thì Kubernetes restart pod (container đang chạy app). **Readiness** (\"app nhận traffic được chưa?\"): fail thì chỉ ngừng gửi traffic, không restart.",
        "Đừng đưa kiểm tra DB vào liveness: DB chậm thì mọi pod cùng fail liveness và bị restart dây chuyền, trong khi restart app không sửa được DB.",
        "Vì vậy Spring Boot mặc định **không** đưa health indicator nào của phụ thuộc ngoài (DB, Redis...) vào nhóm `liveness` và `readiness` (chỉ có `livenessState` và `readinessState`). Phần con ngay dưới giải thích vì sao readiness cũng vậy.",
      ],
      trap: {
        title: "server.port=-1 không tắt web server",
        text: "Đặt `server.port=-1` vẫn tạo `TomcatWebServer`, chỉ tắt connector. Muốn app không có web server thật sự, ví dụ app batch hay Kafka consumer chạy console, thì dùng `spring.main.web-application-type=none`.",
      },
      quiz: {
        question: "Vì sao không nên đưa kiểm tra DB vào liveness probe?",
        options: ["Vì chậm", "DB chậm sẽ làm mọi pod bị restart dây chuyền trong khi restart không sửa được DB", "Vì Actuator không hỗ trợ", "Vì liveness chỉ dành cho Kafka"],
        answer: 1,
        explain: "Restart app không sửa được DB, nên liveness chỉ nên phản ánh chính tiến trình. Boot mặc định không đưa phụ thuộc ngoài vào nhóm liveness.",
      },
      parts: [
        {
          id: "readiness-shared-db",
          senior: true,
          title: "Readiness có nên kiểm tra DB dùng chung?",
          intro: [
            "Liveness đã rõ: không kiểm tra DB. Còn readiness, nghe có vẻ hợp lý hơn: DB hỏng thì pod chưa nhận traffic được?",
            "Tình huống: 10 pod cùng dùng một DB, DB chập chờn 30 giây. Nếu readiness có kiểm tra DB thì **mọi pod cùng báo chưa sẵn sàng một lúc**: Kubernetes rút cả 10 pod khỏi load balancer, người dùng nhận lỗi kết nối thay vì một lỗi 503 rõ ràng, và khi DB hồi lại thì cả fleet cùng ùa vào.",
            "Tài liệu của Boot khuyên cân nhắc kỹ trước khi thêm indicator ngoài vào hai nhóm này. Chỉ thêm vào readiness thứ mà **riêng pod này** hỏng và pod khác vẫn chạy được, ví dụ cache cục bộ chưa nạp xong. Lỗi DB dùng chung thì để request fail nhanh (timeout, circuit breaker) và cảnh báo qua metric.",
          ],
          quiz: {
            question: "DB dùng chung của 10 pod chập chờn. Nếu readiness kiểm tra DB thì chuyện gì xảy ra?",
            options: [
              "Chỉ pod gần DB nhất bị rút",
              "Cả 10 pod cùng báo chưa sẵn sàng và bị rút khỏi load balancer một lúc",
              "Kubernetes restart cả 10 pod",
              "Không có gì, readiness không ảnh hưởng traffic",
            ],
            answer: 1,
            explain: "Readiness fail chỉ ngừng gửi traffic (không restart), nhưng vì lỗi là chung nên mọi pod fail cùng lúc, và cả dịch vụ mất khả năng nhận request.",
          },
        },
        {
          id: "graceful-shutdown",
          senior: true,
          title: "Graceful shutdown khi deploy",
          intro: [
            "Probe giúp Kubernetes biết khi nào **gửi** traffic vào pod. Còn lúc **rút** pod ra khi deploy bản mới thì sao?",
            "Tình huống: rolling deploy, pod cũ đang xử lý 50 request thì nhận lệnh dừng. Dừng ngay thì 50 người dùng nhận lỗi 502, và một request chuyển tiền có thể bị cắt giữa chừng.",
            "Khi xoá pod, Kubernetes làm **hai việc song song**:",
            "- **Gỡ pod khỏi Service/Endpoints**: thông tin này lan tới kube-proxy và ingress mất vài giây, trong lúc đó request mới vẫn có thể tới pod.",
            "- **Chạy hook `preStop` (nếu có), rồi gửi `SIGTERM`** cho tiến trình PID 1 trong container.",
            "Ba từ cần biết: **PID 1** là tiến trình đầu tiên trong container, và tín hiệu dừng của Kubernetes chỉ gửi cho nó. **SIGTERM** là yêu cầu dừng lịch sự, cho phép app dọn dẹp rồi thoát. **SIGKILL** là giết ngay, app không kịp làm gì. Sau `terminationGracePeriodSeconds` (mặc định 30 s) mà tiến trình chưa thoát thì Kubernetes gửi `SIGKILL`.",
            "Phía Spring Boot có hai property:",
            "- **`server.shutdown=graceful`**: nhận `SIGTERM` thì web server ngừng nhận request mới và chờ các request đang chạy xong. Từ Boot 3.4 đây là mặc định (metadata của Boot 3.5.16 ghi `defaultValue: graceful`); bản cũ hơn mặc định là `immediate`.",
            "- **`spring.lifecycle.timeout-per-shutdown-phase`**: chờ tối đa bao lâu cho mỗi pha tắt, mặc định `30s`. Hết giờ thì Boot tắt tiếp dù request chưa xong.",
            "Hai việc song song nên có một cái bẫy: SIGTERM có thể tới trước khi ingress gỡ xong pod. Vì thế người ta thêm `preStop` chỉ để ngủ vài giây (`sleep 10`), cho ingress kịp gỡ pod trước khi app bắt đầu tắt.",
          ],
          quiz: {
            question: "Vì sao thêm `preStop: sleep 10` dù app đã bật `server.shutdown=graceful`?",
            options: [
              "Để JVM có thời gian chạy GC trước khi tắt",
              "Vì việc gỡ pod khỏi load balancer và SIGTERM diễn ra song song; sleep giữ app nhận request thêm vài giây cho tới khi không còn ai gửi tới",
              "Vì Spring Boot chỉ tắt được sau 10 giây",
              "Để Kubernetes restart pod nhanh hơn",
            ],
            answer: 1,
            explain: "Không có sleep, app có thể ngừng nhận request trước khi ingress biết pod đang tắt, và request mới tới trong khoảng đó nhận lỗi.",
          },
        },
        {
          id: "graceful-packaging",
          title: "Đóng gói Dockerfile: shell form và exec form",
          intro: [
            "Phần trên nói SIGTERM tới **PID 1**. Vậy Java có phải là PID 1 không? Còn tùy cách viết `ENTRYPOINT` trong Dockerfile.",
            "- **Shell form** (`ENTRYPOINT java -jar /app.jar`, không ngoặc vuông): Docker chạy `/bin/sh -c \"java -jar /app.jar\"`, nên `/bin/sh` là PID 1 và `java` chỉ là tiến trình con của nó.",
            "- **Exec form** (`ENTRYPOINT [\"java\", \"-jar\", \"/app.jar\"]`): `java` chính là PID 1.",
            "Bên dưới là hai cách đóng gói cùng một app. Chọn từng cách để xem chuyện gì xảy ra khi deploy. Phần này mô tả theo tài liệu Docker và Kubernetes, chưa đo trong bài.",
          ],
          predict: {
            question: "Dockerfile viết `ENTRYPOINT java -jar /app.jar` (dạng chuỗi, không có ngoặc vuông). App đã bật graceful shutdown. Kubernetes gửi `SIGTERM`. Chuyện gì xảy ra?",
            options: [
              "Java nhận SIGTERM và chờ request đang chạy xong",
              "`/bin/sh` là PID 1 và không chuyển SIGTERM cho Java; hết 30 s Kubernetes gửi SIGKILL, request đang chạy bị cắt",
              "Container dừng ngay lập tức, không chờ gì",
              "Kubernetes tự restart pod",
            ],
            answer: 1,
            explain: "Dạng chuỗi (shell form) chạy qua `/bin/sh -c`, nên shell là PID 1 và nhận SIGTERM, còn Java là tiến trình con thường không nhận được. Vì vậy graceful shutdown thường không được kích hoạt. Kết quả phụ thuộc shell của base image (một số `sh` tự `exec` lệnh cuối nên Java lên làm PID 1); bài này không đo trên image cụ thể.",
          },
          widgetTitle: "Deploy trong lúc có request đang chạy",
          compare: [
            way(
              "Shell form, không preStop",
              `# Dockerfile
ENTRYPOINT java -jar /app.jar      # chạy qua /bin/sh -c

# deployment.yaml: để mặc định
terminationGracePeriodSeconds: 30`,
              [
                ask("Kubernetes gửi SIGTERM", bad("`/bin/sh` là PID 1, nhận SIGTERM nhưng không chuyển cho Java. Java chạy tiếp như không có gì.")),
                ask("Request đang chạy", bad("Sau 30 s nhận SIGKILL, request dở dang bị cắt, shutdown hook và `@PreDestroy` không chạy.")),
                ask("Request mới tới trong vài giây đầu", bad("Ingress chưa kịp gỡ pod nên vẫn gửi tới; nếu Java đã dừng thì người dùng nhận 502.")),
              ],
              "Graceful shutdown đã bật trong Boot nhưng thường không được dùng tới.",
            ),
            way(
              "Exec form, preStop, grace đủ dài",
              `# Dockerfile
ENTRYPOINT ["java", "-jar", "/app.jar"]   # java là PID 1

# application.yml
server.shutdown: graceful
spring.lifecycle.timeout-per-shutdown-phase: 20s

# deployment.yaml
terminationGracePeriodSeconds: 40          # > 10 s preStop + 20 s
lifecycle:
  preStop:
    exec: { command: ["sleep", "10"] }`,
              [
                ask("Kubernetes gửi SIGTERM", ok("Trước đó `preStop` ngủ 10 s để ingress gỡ pod xong. Rồi Java (PID 1) nhận SIGTERM và bắt đầu tắt.")),
                ask("Request đang chạy", ok("Web server ngừng nhận request mới, chờ request đang chạy tối đa 20 s, rồi đóng connection pool và thoát.")),
                ask("Tổng thời gian", ok("10 s + 20 s = 30 s, vẫn nằm trong grace 40 s nên không bị SIGKILL.")),
              ],
              "Thứ tự đúng: gỡ khỏi load balancer, rồi mới ngừng nhận request, rồi chờ request dở xong.",
            ),
          ],
          after: [
            "Dùng script khởi động (`entrypoint.sh`) thì dòng cuối phải là `exec java -jar /app.jar`: `exec` thay shell bằng Java, nên Java thành PID 1 và nhận được tín hiệu.",
            "Công thức nhớ: `terminationGracePeriodSeconds` > thời gian `preStop` + `timeout-per-shutdown-phase`. Để cả hai cùng mặc định 30 s mà thêm `preStop` 10 s thì Boot chỉ còn 20 s trước khi bị SIGKILL.",
            "Sau `SIGTERM`, Boot cũng chuyển readiness sang `REFUSING_TRAFFIC`, nên probe readiness báo chưa sẵn sàng trong lúc pod đang tắt.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Exec form → Java là PID 1 → nhận SIGTERM → graceful shutdown chờ request dở xong.",
              "`preStop` sleep để load balancer gỡ pod trước; grace period phải lớn hơn preStop cộng timeout của Boot.",
            ],
          },
          quiz: {
            question: "Muốn Java nhận được SIGTERM trong container, ENTRYPOINT nên viết thế nào?",
            options: [
              "Shell form: `ENTRYPOINT java -jar /app.jar`",
              "Exec form: `ENTRYPOINT [\"java\", \"-jar\", \"/app.jar\"]`, để Java là PID 1",
              "Thêm `sleep 10` vào ENTRYPOINT",
              "Tăng `terminationGracePeriodSeconds` lên 300",
            ],
            answer: 1,
            explain: "Tín hiệu chỉ tới PID 1. Exec form (hoặc `exec java ...` trong script) làm Java thành PID 1; tăng grace period không giúp nếu app không bao giờ nhận SIGTERM.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Spring Boot là lớp cấu hình mặc định bên trên Spring: auto-configuration, starter, embedded Tomcat, cấu hình ngoài và Actuator. @SpringBootApplication gồm @Configuration, @EnableAutoConfiguration và @ComponentScan nên class main phải ở package gốc. Auto-configuration đọc danh sách class trong file AutoConfiguration.imports, mỗi class có @Conditional; vì nó chạy sau bean của em nên @ConditionalOnMissingBean nhường, em đã thử tự khai báo ObjectMapper thì bean của Boot không được tạo, và dùng --debug để xem Condition Evaluation Report. Cấu hình em gom vào record @ConfigurationProperties có @Validated để sai thì fail khi start. Thứ tự ưu tiên em đã đo: command-line, rồi env var, rồi file profile, rồi application.properties. Actuator mặc định chỉ expose health, em mở thêm có chủ đích trên management port nội bộ và không bao giờ public heapdump hay env.",
};
