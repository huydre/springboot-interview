"""Spring Boot Auto-configuration explainer: scene layouts and per-beat narration + motion.

Outputs from Spring Boot 3.5 on JDK 21 including a hand-written starter, study note 04.03:
GreetingAutoConfiguration with @ConditionalOnMissingBean: default "Hello from STARTER default", with the app's own bean "Hello from MY bean",
--greeting.enabled=false -> 0 beans; own @Bean ObjectMapper myMapper -> one ObjectMapper named myMapper, report "found beans of type ObjectMapper myMapper";
event order: Starting, EnvironmentPrepared, ContextInitialized, Prepared, ServletWebServerInitialized, ContextRefreshed, Started, runner, Ready;
PaymentProperties[url=https://pay.local, timeout=PT3S, retry=2], blank url fails at start; precedence command-line > env var > application-dev > application > default;
Actuator default: /actuator/health 200 {"status":"UP"}, info, env, heapdump, beans 404; server.port=-1 still builds TomcatWebServer, web-application-type=none does not.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Spring", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Tự khai báo ObjectMapper: bean của Boot đi đâu?"), "h1 center r"),
        console("hk-con", 300, 420, 1320, ["@Bean ObjectMapper myMapper()", "context chỉ còn 1 ObjectMapper: myMapper", "@ConditionalOnMissingBean ... found beans of type 'ObjectMapper' myMapper"]),
        tile("hk-tile", 300, 350, 220, "grid"),
        el("hk-word", 570, 380, 1350, None, letters("Auto-configuration"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "@SpringBootApplication · @Conditional · @ConfigurationProperties · Actuator", "kin-sub r"),
    ]), beats=[
        ("Bạn tự khai báo một bean Object Mapper. Vậy bean Object Mapper mặc định của Spring Boot đi đâu?",
         "Bạn tự khai báo một bean ObjectMapper. Bean ObjectMapper mặc định của Boot đi đâu?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Nó không được tạo nữa. Context chỉ còn một Object Mapper, là bean của bạn. Vì Auto Configuration có điều kiện: chỉ tạo khi bạn chưa có.",
         "Không được tạo nữa: context chỉ còn ObjectMapper của bạn. Auto-configuration chỉ tạo khi bạn chưa có.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.6, 0.3), IN("#hk-con-2", "type1", 2.6, 0.3), IN("#hk-con-3", "type1", 4.6, 0.3)]),
        ("Hôm nay ta học Auto Configuration của Spring Boot.", "Hôm nay: Spring Boot Auto-configuration.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ Boot
    dict(id="boot", world=(1920, 1080), hud=hud("bt", "Boot và @SpringBootApplication", "Lớp mặc định bên trên Spring"), cam="".join([
        big_title("bt", "Spring Boot", "Lớp mặc định bên trên Spring Framework"),
        card4("bt-c", 150, 200, 300, 220, 30, [("grid", "Auto-configuration", "tạo bean theo classpath"), ("box", "Starter", "gom dependency, BOM"),
                                                ("plug", "Embedded server", "java -jar"), ("hash", "Externalized config", "yml, env, profile"),
                                                ("shield", "Actuator", "health, metrics")]),
        box("bt-code", 160, 470, 1000, 150, code("@SpringBootConfiguration   // một dạng @Configuration\n@EnableAutoConfiguration   // bật auto-configuration\n@ComponentScan             // quét package chứa class main"), "cyan", "code"),
        chip("bt-n1", 160, 660, "DI, AOP, MVC, transaction vẫn là của Spring Framework", "violet"),
        chip("bt-n2", 160, 740, "Class main phải ở package gốc: bean ở package ngang hàng không được scan", "red"),
        chip("bt-n3", 160, 820, "Tắt một auto-config: exclude hoặc spring.autoconfigure.exclude", "green"),
    ]), beats=[
        ("Phần một: spring boot. Boot không thay spring, mà là lớp cấu hình mặc định bên trên spring framework.",
         "Phần 1: Boot không thay Spring, mà là lớp cấu hình mặc định bên trên Spring Framework.",
         [TYPE("#bt-big", 0.1, 0.06), IN("#bt-bsub", "blur", 0.8), OUT("#bt-big, #bt-bsub", "zoom", 4.0), IN("#bt-hud", "left", 4.6)]),
        ("Auto configuration tạo bean theo classpath. Starter gom dependency, version do B O M quản lý. Tom cat nhúng sẵn để chạy bằng lệnh java. Cấu hình ngoài, và Actuator cho vận hành.",
         "Auto-configuration · Starter (BOM quản lý version) · Embedded Tomcat · cấu hình ngoài · Actuator.",
         [IN("#bt-c0", "pop", 0.4), IN("#bt-c1", "pop", 2.8), IN("#bt-c2", "pop", 6.0), IN("#bt-c3", "pop", 8.4), IN("#bt-c4", "pop", 10.4)]),
        ("Dependency injection, A O P, M V C, transaction vẫn là của spring framework.",
         "DI, AOP, MVC, transaction vẫn là của Spring Framework.", [IN("#bt-n1", "left", 0.4)]),
        ("Spring Boot Application gồm ba annotation: spring boot configuration, enable Auto Configuration, và component scan, quét package chứa class main và các package con.",
         "@SpringBootApplication = @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan.",
         [IN("#bt-code", "up", 0.4)]),
        ("Vì vậy class main phải ở package gốc. Bean ở package ngang hàng sẽ không được scan, và báo lỗi no such bean. Muốn tắt một Auto Configuration thì dùng exclude.",
         "Class main ở package gốc: package ngang hàng không được scan → NoSuchBeanDefinitionException. Tắt auto-config: exclude.",
         [IN("#bt-n2", "left", 0.4), IN("#bt-n3", "left", 7.2)]),
    ]),
    # ------------------------------------------------------------ auto-configuration
    dict(id="autoconfig", world=(1920, 1080), hud=hud("ac", "Auto-configuration", "Class được canh bởi @Conditional"), cam="".join([
        gnode("ac-a", 80, 200, 450, 100, "@EnableAutoConfiguration", "cyan"), gnode("ac-b", 590, 200, 590, 100, "AutoConfigurationImportSelector", "violet"),
        gnode("ac-c", 1240, 200, 270, 100, "file .imports", "amber"), gnode("ac-d", 1570, 200, 270, 100, "@Conditional", "green"),
        el("ac-f", 120, 330, 1700, None, "META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports trong mọi JAR (Boot 3 không còn đọc spring.factories cho auto-config)", "note left r"),
        console("ac-con", 120, 430, 1680, ["app không khai báo gì → greet() = \"Hello from STARTER default\"", "app tự khai báo @Bean myGreeting() → \"Hello from MY bean\"", "--greeting.enabled=false → 0 bean GreetingService"]),
        chip("ac-c1", 120, 620, "@ConditionalOnClass · @ConditionalOnMissingBean · @ConditionalOnProperty · @ConditionalOnWebApplication", "violet"),
        chip("ac-c2", 120, 700, "Auto-config xử lý SAU bean của bạn, nên @ConditionalOnMissingBean thấy bean của bạn và nhường", "green"),
        chip("ac-c3", 120, 780, "--debug: CONDITIONS EVALUATION REPORT (Positive, Negative matches, Exclusions) · /actuator/conditions", "amber"),
        chip("ac-c4", 120, 860, "Viết thư viện nội bộ: @AutoConfiguration + @ConditionalOnMissingBean, đăng ký trong file .imports", "cyan"),
        wires(trace("ac-w1", [(530, 250), (582, 250)], "cyan"), trace("ac-w2", [(1180, 250), (1232, 250)], "violet"), trace("ac-w3", [(1510, 250), (1562, 250)], "amber")),
    ]), beats=[
        ("Phần hai: Auto Configuration. Enable Auto Configuration import một Selector, Selector đọc danh sách class trong file Imports của mọi thư viện. Boot ba không còn đọc Spring Factories cho Auto Configuration.",
         "Phần 2: @EnableAutoConfiguration → ImportSelector → đọc file .imports của mọi JAR. Boot 3 không đọc spring.factories.",
         [IN("#ac-hud", "left", 0.1), IN("#ac-a", "pop", 0.6), DRAW("#ac-w1-p", 1.4, 0.4), IN("#ac-b", "pop", 1.8), DRAW("#ac-w2-p", 3.6, 0.4), IN("#ac-c", "pop", 4.0),
          DRAW("#ac-w3-p", 6.8, 0.4), IN("#ac-d", "pop", 7.2), IN("#ac-f", "up", 8.0)]),
        ("Mỗi class được canh bởi các điều kiện: có class trên classpath, chưa có bean cùng kiểu, property đúng giá trị, hoặc là web app.",
         "Mỗi class được canh bởi @ConditionalOnClass, OnMissingBean, OnProperty, OnWebApplication.", [IN("#ac-c1", "left", 0.4)]),
        ("Auto configuration xử lý sau bean của bạn, nên điều kiện On Missing Bean thấy bean của bạn và nhường.",
         "Auto-config xử lý sau bean của bạn nên @ConditionalOnMissingBean nhường.", [IN("#ac-c2", "left", 0.4)]),
        ("Đã thử với một Starter tự viết: không khai báo gì thì ra bean mặc định, tự khai báo thì ra bean của app, tắt bằng property thì không có bean nào.",
         "Starter tự viết: không khai báo → bean mặc định; tự khai báo → bean của app; tắt bằng property → không có bean.",
         [IN("#ac-con", "up", 0.3, 0.4), IN("#ac-con-1", "type1", 0.8, 0.3), IN("#ac-con-2", "type1", 3.4, 0.3), IN("#ac-con-3", "type1", 6.4, 0.3)]),
        ("Công cụ số một khi bean của boot không được tạo là chạy với debug, để xem condition evaluation report. Viết thư viện nội bộ thì dùng Auto Configuration, và đăng ký trong file Imports.",
         "Bean của Boot không được tạo: chạy --debug xem Condition Evaluation Report. Thư viện nội bộ: @AutoConfiguration + file .imports.",
         [IN("#ac-c3", "left", 0.4), IN("#ac-c4", "left", 6.4)]),
    ]),
    # ------------------------------------------------------------ run
    dict(id="run", world=(1920, 1080), hud=hud("rn", "SpringApplication.run()", "Thứ tự event khi khởi động"), cam="".join([
        console("rn-con", 160, 190, 1600, ["1 ApplicationStartingEvent · 2 ApplicationEnvironmentPreparedEvent", "3 ApplicationContextInitializedEvent · 4 ApplicationPreparedEvent",
                                          "5  ServletWebServerInitializedEvent · Tomcat đã chạy, trong pha refresh", "6  ContextRefreshedEvent · mọi singleton đã tạo", "7  ApplicationStartedEvent",
                                          "8  CommandLineRunner.run", "9  ApplicationReadyEvent · sẵn sàng nhận traffic"]),
        chip("rn-c1", 160, 620, "Xác định loại app (Servlet, Reactive, None) → Environment → tạo ApplicationContext → refresh", "violet"),
        chip("rn-c2", 160, 690, "Refresh: đọc definition, BFPP, tạo singleton, BPP tạo proxy · rồi khởi động embedded server", "cyan"),
        chip("rn-c3", 160, 760, "Web server khởi động BÊN TRONG pha refresh · runner chạy TRƯỚC ApplicationReadyEvent", "amber"),
        chip("rn-c4", 160, 830, "Tác vụ lâu: ApplicationRunner hoặc @EventListener(ApplicationReadyEvent), chạy async", "green"),
    ]), beats=[
        ("Phần ba: Spring Application Run. Nó xác định loại ứng dụng, chuẩn bị Environment, tạo Application Context, refresh, khởi động Web Server, gọi Runner, rồi phát Application Ready Event.",
         "Phần 3: run() xác định loại app, chuẩn bị Environment, tạo context, refresh, khởi động server, gọi runner, phát ApplicationReadyEvent.",
         [IN("#rn-hud", "left", 0.1), IN("#rn-c1", "left", 2.0)]),
        ("Đã in thứ tự event khi khởi động một web app: starting, Environment prepared, context initialized, prepared.",
         "Thứ tự event: Starting, EnvironmentPrepared, ContextInitialized, Prepared.",
         [IN("#rn-con", "up", 0.3, 0.4), IN("#rn-con-1", "type1", 0.8, 0.3), IN("#rn-con-2", "type1", 2.6, 0.3)]),
        ("Rồi Servlet Web Server Initialized: Web Server khởi động bên trong pha refresh. Sau đó là context refreshed, started.",
         "Rồi ServletWebServerInitialized: server khởi động bên trong refresh. Sau đó ContextRefreshed, Started.",
         [IN("#rn-con-3", "type1", 0.4, 0.3), IN("#rn-con-4", "type1", 3.0, 0.3), IN("#rn-con-5", "type1", 5.0, 0.3), IN("#rn-c3", "left", 6.0)]),
        ("Runner chạy trước Application Ready Event, và cuối cùng là ready, sẵn sàng nhận traffic.",
         "Runner chạy trước ApplicationReadyEvent; cuối cùng là Ready.", [IN("#rn-con-6", "type1", 0.4, 0.3), IN("#rn-con-7", "type1", 2.4, 0.3), IN("#rn-c2", "left", 4.0)]),
        ("Tác vụ khởi động chạy lâu thì đặt trong Application Runner hoặc Ready Event, và chạy async để không chặn khởi động.",
         "Tác vụ lâu: ApplicationRunner hoặc ReadyEvent, chạy async.", [IN("#rn-c4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ properties
    dict(id="props", world=(1920, 1080), hud=hud("pp", "@ConfigurationProperties", "Type-safe, validate khi start"), cam="".join([
        box("pp-code", 160, 190, 1000, 160, code("@ConfigurationProperties(prefix = \"payment\") @Validated\npublic record PaymentProperties(\n    @NotBlank String url, Duration timeout, @Min(0) int retry) {}"), "cyan", "code"),
        console("pp-ok", 1230, 200, 530, ["url=https://pay.local", "timeout=PT3S, retry=2"]),
        console("pp-bad", 160, 390, 1600, ["Binding to target PaymentProperties failed:", "Property: payment.url   Value: \" \"   Reason: must not be blank"]),
        chip("pp-c1", 160, 540, "@Value(\"${payment.timeout}\") vào String nhận nguyên chuỗi \"3s\"", "amber"),
        chip("pp-c2", 160, 620, "@Value sai key không có default: PlaceholderResolutionException lúc start", "red"),
        chip("pp-c3", 160, 700, "Quên @EnableConfigurationProperties hoặc @ConfigurationPropertiesScan: record không thành bean", "red"),
        chip("pp-c4", 160, 780, "Nhóm cấu hình → @ConfigurationProperties · vài giá trị lẻ hoặc SpEL → @Value", "green"),
    ]), beats=[
        ("Phần bốn: nhóm cấu hình thì dùng Configuration Properties trên một record, kèm Validated. Nó type safe, tự convert Duration, hỗ trợ Relaxed Binding.",
         "Phần 4: nhóm cấu hình → @ConfigurationProperties trên record + @Validated: type-safe, tự convert Duration.",
         [IN("#pp-hud", "left", 0.1), IN("#pp-code", "up", 0.6), IN("#pp-ok", "right", 4.4, 0.4), IN("#pp-ok-1", "type1", 4.8, 0.3), IN("#pp-ok-2", "type1", 5.6, 0.3)]),
        ("Cấu hình sai thì app fail ngay khi start, với thông báo rõ từng property.",
         "Cấu hình sai thì app fail ngay khi start, thông báo rõ từng property.",
         [IN("#pp-bad", "up", 0.4, 0.4), IN("#pp-bad-1", "type1", 0.8, 0.3), IN("#pp-bad-2", "type1", 2.4, 0.3)]),
        ("Còn Value vào một string thì nhận nguyên chuỗi, ví dụ ba s. Value sai tên key mà không có default thì cũng báo lỗi lúc start.",
         "@Value vào String nhận nguyên chuỗi \"3s\". Sai key không có default: lỗi lúc start.",
         [IN("#pp-c1", "left", 0.4), IN("#pp-c2", "left", 4.0)]),
        ("Quên enable Configuration Properties thì record không thành bean. Nhóm cấu hình dùng Configuration Properties, vài giá trị lẻ hoặc cần biểu thức động thì dùng Value.",
         "Quên @EnableConfigurationProperties: record không thành bean. Nhóm → @ConfigurationProperties; giá trị lẻ, SpEL → @Value.",
         [IN("#pp-c3", "left", 0.4), IN("#pp-c4", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ precedence
    dict(id="precedence", world=(1920, 1080), hud=hud("pc", "Thứ tự ưu tiên property", "Và profile"), cam="".join([
        el("pc-l", 160, 185, 1600, None, "Cùng key payment.url ở nhiều nguồn, nguồn nào thắng (ưu tiên giảm dần):", "lbl r", "text-align:left"),
        box("pc-s1", 160, 235, 1600, 70, "<b>1 · command-line --payment.url</b>", "green", "card"), box("pc-s2", 160, 320, 1450, 70, "<b>2 · env var PAYMENT_URL</b>", "green", "card"),
        box("pc-s3", 160, 405, 1300, 70, "<b>3 · application-dev.properties (profile dev)</b>", "cyan", "card"), box("pc-s4", 160, 490, 1150, 70, "<b>4 · application.properties</b>", "cyan", "card"),
        box("pc-s5", 160, 575, 1000, 70, "<b>5 · setDefaultProperties</b>", "muted", "card"),
        chip("pc-c1", 160, 690, "File ngoài JAR (./config/application.yml) thắng file trong JAR: đổi cấu hình không cần build lại", "violet"),
        chip("pc-c2", 160, 770, "Kích hoạt profile: --spring.profiles.active=prod hoặc SPRING_PROFILES_ACTIVE · @Profile(\"dev\") cho bean riêng", "cyan"),
        chip("pc-c3", 160, 850, "Secret không commit vào yml: env var, Vault, Secrets Manager, Kubernetes Secret", "red"),
    ]), beats=[
        ("Phần năm: thứ tự ưu tiên property. Đã đo, đặt cùng một key ở nhiều nguồn. Command line thắng tất cả.",
         "Phần 5: cùng một key ở nhiều nguồn. Command-line thắng tất cả.",
         [IN("#pc-hud", "left", 0.1), IN("#pc-l", "fade", 0.5), IN("#pc-s1", "left", 3.6)]),
        ("Rồi tới biến môi trường, thắng cả file profile. File profile dev thắng application properties, và thấp nhất là Default Properties.",
         "Rồi env var, thắng cả file profile; application-dev thắng application.properties; thấp nhất là default.",
         [IN("#pc-s2", "left", 0.4), IN("#pc-s3", "left", 3.6), IN("#pc-s4", "left", 6.4), IN("#pc-s5", "left", 8.6)]),
        ("File nằm ngoài gói ứng dụng thắng file trong gói ứng dụng, nên bộ phận vận hành đổi cấu hình mà không cần build lại.",
         "File ngoài JAR thắng file trong JAR: đổi cấu hình không cần build lại.", [IN("#pc-c1", "left", 0.4)]),
        ("Kích hoạt profile bằng tham số hoặc biến môi trường. Secret thì không commit vào file cấu hình: dùng biến môi trường, Vault, hoặc Kubernetes secret.",
         "Kích hoạt profile bằng tham số hoặc env var. Secret không commit vào yml.",
         [IN("#pc-c2", "left", 0.4), IN("#pc-c3", "left", 5.2)]),
    ]),
    # ------------------------------------------------------------ Actuator
    dict(id="actuator", world=(1920, 1080), hud=hud("at", "Actuator", "Mặc định chỉ expose health"), cam="".join([
        console("at-con", 160, 190, 1600, ["GET /actuator/health   → 200 {\"status\":\"UP\"}", "GET /actuator/info     → 404", "GET /actuator/env      → 404", "GET /actuator/heapdump → 404", "GET /actuator/beans    → 404"]),
        chip("at-c1", 160, 540, "Mở có chủ đích: management.endpoints.web.exposure.include · management port nội bộ", "violet"),
        chip("at-c2", 160, 610, "heapdump chứa toàn bộ bộ nhớ, có thể có password, token: không bao giờ public", "red"),
        box("at-l", 160, 700, 760, 100, "<b>Liveness fail</b><br>Kubernetes restart pod", "red", "card"), box("at-r", 1000, 700, 760, 100, "<b>Readiness fail</b><br>ngừng gửi traffic, không restart", "amber", "card"),
        chip("at-c3", 160, 830, "Đừng đưa kiểm tra DB vào liveness: DB chậm làm mọi pod restart dây chuyền", "red"),
        chip("at-c4", 160, 900, "server.port=-1 vẫn tạo TomcatWebServer · web-application-type=none mới không có web", "green"),
    ]), beats=[
        ("Phần sáu: Actuator. Mặc định qua web chỉ expose health. Đã đo: health trả hai trăm, còn info, env, Heap Dump, beans đều bốn không bốn.",
         "Phần 6: mặc định chỉ expose health: /health 200; info, env, heapdump, beans đều 404.",
         [IN("#at-hud", "left", 0.1), IN("#at-con", "up", 0.6, 0.4), IN("#at-con-1", "type1", 1.0, 0.3), IN("#at-con-2", "type1", 3.4, 0.3), IN("#at-con-3", "type1", 5.0, 0.3), IN("#at-con-4", "type1", 6.2, 0.3), IN("#at-con-5", "type1", 7.4, 0.3)]),
        ("Mở thêm thì phải có chủ đích, và đặt trên Management Port nội bộ. Heap dump chứa toàn bộ bộ nhớ, có thể có password, token, không bao giờ để public.",
         "Mở thêm có chủ đích, trên management port nội bộ. heapdump có thể chứa password, token: không public.",
         [IN("#at-c1", "left", 0.4), IN("#at-c2", "left", 5.6)]),
        ("Liveness fail thì Kubernetes restart pod. Readiness fail thì ngừng gửi traffic nhưng không restart. Đừng đưa kiểm tra database vào Liveness, vì database chậm sẽ làm mọi pod restart dây chuyền.",
         "Liveness fail → restart pod. Readiness fail → ngừng gửi traffic. Đừng đưa kiểm tra DB vào liveness.",
         [IN("#at-l", "pop", 0.4), IN("#at-r", "pop", 3.4), IN("#at-c3", "left", 6.4)]),
        ("App batch hay Kafka consumer không cần web thì đặt web application type bằng none. Server port bằng trừ một vẫn tạo tom cat, chỉ tắt Connector.",
         "App không cần web: web-application-type=none. server.port=-1 vẫn tạo Tomcat, chỉ tắt connector.",
         [IN("#at-c4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("grid", "Auto-config", "nhường bean của bạn"),
                                                ("shield", "--debug", "Condition Evaluation Report"),
                                                ("hash", "Cấu hình", "@ConfigurationProperties, fail sớm"),
                                                ("lock", "Actuator", "mặc định chỉ expose health")]),
        chip("ou-next", 640, 650, "Bài tiếp: Spring MVC Request Flow", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: Auto Configuration nhường bean của bạn nhờ On Missing Bean. Dùng debug để xem report. Cấu hình gom vào Configuration Properties, sai thì fail khi start. Và Actuator mặc định chỉ expose health.",
         "Auto-config nhường bean của bạn · --debug xem report · @ConfigurationProperties fail khi start · Actuator chỉ expose health.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 4.0), IN("#ou-c2", "pop", 6.6), IN("#ou-c3", "pop", 10.2)]),
        ("Bài tiếp: luồng request của spring mvc.", "Bài tiếp: Spring MVC Request Flow.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
