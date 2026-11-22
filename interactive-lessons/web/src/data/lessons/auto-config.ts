import timeline from "../timelines/auto-config.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every output from Spring Boot 3.5 on JDK 21, including a hand-written starter; see study note 04.03.
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
        "Ưu điểm: type-safe, tự convert kiểu, và **relaxed binding**: Boot coi `payment.url`, env var `PAYMENT_URL` và `paymentUrl` là cùng một key.",
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
    },
    {
      id: "precedence",
      title: "Phần 5: Thứ tự ưu tiên property và profile",
      scene: "precedence",
      intro: [
        "Phần 4 đọc property vào code. Nhưng cùng một key `payment.url` có thể nằm ở nhiều nguồn cùng lúc: command-line, env var, file profile, file chung. Nguồn nào thắng?",
        "Env var map sang key theo quy tắc: viết hoa, dấu `.` thành `_`, bỏ dấu `-`. Ví dụ `PAYMENT_URL` là `payment.url`, `PAYMENT_MAXRETRY` là `payment.max-retry` (đã chạy với Spring Boot 4.1.1: `payment.max-retry = 5`).",
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
    },
    {
      id: "actuator",
      title: "Phần 6: Actuator và ứng dụng không có web",
      scene: "actuator",
      intro: [
        "Mặc định qua HTTP **chỉ expose `health`**: đã đo `/actuator/health` 200 `{\"status\":\"UP\"}`, còn `info`, `env`, `heapdump`, `beans` đều 404. Mở có chủ đích bằng `management.endpoints.web.exposure.include` và đặt trên management port nội bộ. `heapdump` chứa toàn bộ bộ nhớ, có thể có password, token: không bao giờ public.",
        "Kubernetes hỏi app hai câu qua hai probe. **Liveness** (\"app còn sống không?\"): fail thì Kubernetes restart pod (container đang chạy app). **Readiness** (\"app nhận traffic được chưa?\"): fail thì chỉ ngừng gửi traffic, không restart.",
        "Đừng đưa kiểm tra DB vào liveness: DB chậm thì mọi pod cùng fail liveness và bị restart dây chuyền, trong khi restart app không sửa được DB.",
        "Cũng đừng vội đưa DB dùng chung vào readiness. Mọi pod cùng dùng một DB, nên DB chập chờn thì **mọi pod cùng báo chưa sẵn sàng một lúc**: Kubernetes rút cả fleet khỏi load balancer, người dùng nhận lỗi kết nối thay vì một lỗi 503 rõ ràng, và khi DB hồi lại thì cả fleet cùng ùa vào.",
        "Vì vậy Spring Boot mặc định **không** đưa health indicator nào của phụ thuộc ngoài vào nhóm `liveness` và `readiness` (chỉ có `livenessState` và `readinessState`), và tài liệu của Boot khuyên cân nhắc kỹ trước khi thêm. Chỉ thêm vào readiness thứ mà **riêng pod này** hỏng và pod khác vẫn chạy được, ví dụ cache cục bộ chưa nạp xong. Lỗi DB dùng chung thì để request fail nhanh (timeout, circuit breaker) và cảnh báo qua metric.",
        "App batch hay Kafka consumer chạy console: `spring.main.web-application-type=none` (không có web server).",
      ],
      trap: {
        title: "server.port=-1 không tắt web server",
        text: "Đặt `server.port=-1` vẫn tạo `TomcatWebServer`, chỉ tắt connector. Muốn app không có web server thật sự thì dùng `spring.main.web-application-type=none`.",
      },
      quiz: {
        question: "Vì sao không nên đưa kiểm tra DB vào liveness probe?",
        options: ["Vì chậm", "DB chậm sẽ làm mọi pod bị restart dây chuyền trong khi restart không sửa được DB", "Vì Actuator không hỗ trợ", "Vì liveness chỉ dành cho Kafka"],
        answer: 1,
        explain: "Đưa DB dùng chung vào readiness cũng nguy hiểm: mọi pod cùng báo chưa sẵn sàng và bị rút khỏi load balancer cùng lúc. Boot mặc định không đưa phụ thuộc ngoài vào cả hai nhóm probe.",
      },
      parts: [
        {
          id: "graceful-shutdown",
          title: "Graceful shutdown khi deploy",
          intro: [
            "Probe giúp Kubernetes biết khi nào **gửi** traffic vào pod. Còn lúc **rút** pod ra khi deploy bản mới thì sao?",
            "Tình huống: rolling deploy, pod cũ đang xử lý 50 request thì nhận lệnh dừng. Dừng ngay thì 50 người dùng nhận lỗi 502, và một request chuyển tiền có thể bị cắt giữa chừng.",
            "Khi xoá pod, Kubernetes làm **hai việc song song**:",
            "- **Gỡ pod khỏi Service/Endpoints**: thông tin này lan tới kube-proxy và ingress mất vài giây, trong lúc đó request mới vẫn có thể tới pod.",
            "- **Chạy hook `preStop` (nếu có), rồi gửi `SIGTERM`** cho tiến trình PID 1 trong container.",
            "Sau `terminationGracePeriodSeconds` (mặc định 30 s) mà tiến trình chưa thoát thì Kubernetes gửi `SIGKILL`, giết ngay không chờ.",
            "Phía Spring Boot có hai property:",
            "- **`server.shutdown=graceful`**: nhận `SIGTERM` thì web server ngừng nhận request mới và chờ các request đang chạy xong. Từ Boot 3.4 đây là mặc định (metadata của Boot 3.5.16 ghi `defaultValue: graceful`); bản cũ hơn mặc định là `immediate`.",
            "- **`spring.lifecycle.timeout-per-shutdown-phase`**: chờ tối đa bao lâu cho mỗi pha tắt, mặc định `30s`. Hết giờ thì Boot tắt tiếp dù request chưa xong.",
            "Bên dưới là hai cách đóng gói cùng một app. Chọn từng cách để xem chuyện gì xảy ra khi deploy.",
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
            explain: "Dạng chuỗi (shell form) chạy qua `/bin/sh -c`, nên shell là PID 1 và nhận SIGTERM, còn Java là tiến trình con không nhận được. Graceful shutdown không bao giờ được kích hoạt.",
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
              "Graceful shutdown đã bật trong Boot nhưng không bao giờ được dùng tới.",
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
      ],
    },
  ],
  modelAnswer:
    "Spring Boot là lớp cấu hình mặc định bên trên Spring: auto-configuration, starter, embedded Tomcat, cấu hình ngoài và Actuator. @SpringBootApplication gồm @Configuration, @EnableAutoConfiguration và @ComponentScan nên class main phải ở package gốc. Auto-configuration đọc danh sách class trong file AutoConfiguration.imports, mỗi class có @Conditional; vì nó chạy sau bean của em nên @ConditionalOnMissingBean nhường, em đã thử tự khai báo ObjectMapper thì bean của Boot không được tạo, và dùng --debug để xem Condition Evaluation Report. Cấu hình em gom vào record @ConfigurationProperties có @Validated để sai thì fail khi start. Thứ tự ưu tiên em đã đo: command-line, rồi env var, rồi file profile, rồi application.properties. Actuator mặc định chỉ expose health, em mở thêm có chủ đích trên management port nội bộ và không bao giờ public heapdump hay env.",
};
