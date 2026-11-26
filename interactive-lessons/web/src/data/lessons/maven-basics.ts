import type { Lesson } from "../types";

// Maven for Spring Boot juniors. The commands and outputs in the board code fields were run on a copy of labs/order-service
// (Spring Boot 3.5.16, Maven wrapper 3.10.0, JDK 21), trimmed to the relevant lines. Scope rules, lifecycle phases and the
// NoSuchMethodError mechanism are standard Maven behaviour; the NoSuchMethodError itself was not reproduced.
export const mavenBasics: Lesson = {
  slug: "maven-basics",
  crumb: "Maven",
  videoDir: "/videos/maven-basics",
  videoVersion: "0",
  scenes: [],
  title: "Maven cho Spring Boot: pom.xml, scope, lifecycle, wrapper và đọc lỗi build",
  subtitle:
    "Maven giải quyết gì, cấu trúc dự án và toạ độ GAV, pom.xml với parent và BOM, dependency scope, dependency transitive và xung đột phiên bản, lifecycle và fat jar, Maven Wrapper, cách đọc lỗi build thường gặp, Gradle khác gì, và cách trả lời phỏng vấn.",
  openingQuiz: {
    question: "Trong pom.xml của dự án Spring Boot, bạn khai báo `spring-boot-starter-web` mà không ghi `<version>`. Maven lấy phiên bản từ đâu?",
    options: [
      "Tự tải bản mới nhất trên Maven Central",
      "Từ `spring-boot-starter-parent` (parent này import BOM `spring-boot-dependencies` có sẵn danh sách phiên bản)",
      "Từ file `application.yml`",
      "Không có phiên bản thì build lỗi",
    ],
    answer: 1,
    explain:
      "Parent `spring-boot-starter-parent` kế thừa phần `dependencyManagement` của `spring-boot-dependencies`, nên các starter và nhiều thư viện phổ biến đã có phiên bản cố định đi kèm bản Spring Boot đó (Phần 2). Maven không bao giờ tự lấy 'bản mới nhất'.",
  },
  roadmap: [
    "Chặng 1: Maven giải quyết gì, cấu trúc dự án, toạ độ GAV; pom.xml với parent, BOM, properties và plugin.",
    "Chặng 2: dependency scope, dependency transitive, xung đột phiên bản và `dependency:tree`; lifecycle và các lệnh hay dùng, fat jar.",
    "Chặng 3: Maven Wrapper; đọc lỗi build thường gặp; Gradle khác gì; cách trả lời phỏng vấn.",
  ],
  sections: [
    {
      id: "what-maven-solves",
      title: "Phần 1: Maven giải quyết gì, cấu trúc dự án và toạ độ GAV",
      intro: [
        "Hình dung bạn không có Maven. Dự án cần Spring, Jackson, Hibernate... Bạn phải tự tải từng file `.jar`, chép vào thư mục `lib`, rồi mỗi thư viện lại cần thêm vài thư viện khác. Đổi phiên bản là tải lại cả mớ. Mỗi máy trong team build một kiểu.",
        "**Maven** là công cụ build và quản lý dependency theo **quy ước**. Nó giải hai việc:",
        "- **Quản lý dependency**: bạn khai báo 'tôi cần thư viện này, bản này', Maven tự tải về (cả các thư viện nó cần theo, gọi là dependency transitive) từ kho trung tâm Maven Central và cất vào thư mục cache `~/.m2/repository`.",
        "- **Build theo quy ước**: mọi dự án Maven có cùng cấu trúc thư mục và cùng chuỗi bước (biên dịch, test, đóng gói). Ai mở dự án cũng biết code nằm đâu, chạy lệnh nào.",
        "Cấu trúc chuẩn mà Maven mặc định tìm thấy (không cần cấu hình thêm):",
        "- `src/main/java`: code Java của ứng dụng.",
        "- `src/main/resources`: file cấu hình và tài nguyên (`application.yml`, template...) được chép vào jar.",
        "- `src/test/java`: code test. `src/test/resources` cho tài nguyên chỉ dùng khi test.",
        "- `pom.xml`: file mô tả dự án (POM = Project Object Model). Kết quả build nằm ở thư mục `target/`.",
        "Mỗi artifact được định danh bằng **toạ độ GAV**, giống địa chỉ nhà: `groupId` (tổ chức hoặc nhóm, thường là tên miền ngược như `com.shop`), `artifactId` (tên module, như `order-service`), `version` (như `0.0.1-SNAPSHOT`). Ba thứ này xác định duy nhất một file jar trong kho.",
        "Hậu tố `-SNAPSHOT` nghĩa là 'bản đang phát triển, có thể đổi liên tục'. Bản không có hậu tố (release) thì bất biến: một khi đã phát hành, nội dung không được đổi.",
      ],
      board: {
        title: "Maven nhìn từ bên ngoài",
        highlight: "Maven",
        chips: ["pom.xml", "GAV", "Maven Central", "~/.m2"],
        cards: [
          {
            title: "Mọi thứ Maven cần nằm trong pom.xml và thư mục chuẩn",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "pom.xml", mark: "plus" },
                { label: "src/main/java", mark: "plus" },
                { label: "src/main/resources", mark: "plus" },
                { label: "src/test/java", mark: "plus" },
              ],
              center: "Maven",
              rulesTitle: "Maven làm gì với chúng",
              rules: [
                "Tải dependency từ **Maven Central** về `~/.m2/repository`",
                "Biên dịch, chạy test, đóng gói thành `.jar`",
                "Cùng một lệnh trên mọi máy và trên CI",
              ],
            },
            notes: ["Phần dự án của order-service chỉ khai báo toạ độ của chính nó như dưới đây, còn thư viện khác thì khai báo trong `<dependencies>`."],
            code: `<groupId>com.shop</groupId>
<artifactId>order-service</artifactId>
<version>0.0.1-SNAPSHOT</version>`,
            takeaway: "GAV là địa chỉ duy nhất của một artifact",
          },
        ],
        conclusion: "**Kết luận:** Maven thay việc tải jar bằng tay và mỗi người build một kiểu bằng một file `pom.xml` và một cấu trúc thư mục chung.",
      },
      takeaway: {
        lines: [
          "Maven = quản lý dependency + build theo quy ước. Cấu hình nằm ở `pom.xml`, kết quả ở `target/`.",
          "GAV (groupId, artifactId, version) định danh duy nhất một artifact. `-SNAPSHOT` là bản còn thay đổi.",
        ],
      },
      quiz: {
        question: "Code test (JUnit) của dự án Maven chuẩn nằm ở đâu?",
        options: ["`src/main/java`", "`src/test/java`", "`target/test`", "`lib/test`"],
        answer: 1,
        explain: "Quy ước của Maven: code ứng dụng ở `src/main/java`, code test ở `src/test/java`. Nhờ quy ước, Maven biết biên dịch và chạy chúng mà không cần cấu hình.",
      },
    },
    {
      id: "pom-structure",
      title: "Phần 2: pom.xml gồm những gì",
      intro: [
        "Mở `pom.xml` của một dự án Spring Boot, bạn thấy một vài khối cố định. Đi từ trên xuống:",
        "- **parent**: `spring-boot-starter-parent`. Dự án 'kế thừa' từ parent này: nó cấp sẵn phiên bản Java mặc định, cấu hình plugin, encoding UTF-8 và danh sách phiên bản của hàng trăm thư viện.",
        "- **properties**: biến dùng chung, ví dụ `java.version` là 21. Spring Boot parent đọc biến này để đặt mức biên dịch Java.",
        "- **dependencies**: các thư viện dự án cần.",
        "- **build / plugins**: các plugin thêm hành vi cho build, điển hình là `spring-boot-maven-plugin`.",
        "Vì sao các starter không cần ghi version? Vì có hai khái niệm dễ nhầm:",
        "- `dependencies`: **khai báo dùng** một thư viện. Thư viện này thật sự vào classpath.",
        "- `dependencyManagement`: **chỉ quản lý phiên bản** (và scope). Khai báo ở đây không thêm gì vào classpath, nó chỉ nói 'nếu ai đó dùng thư viện này mà không ghi version thì dùng bản này'.",
        "**BOM** (Bill of Materials) là một POM chỉ có phần `dependencyManagement`, là danh sách phiên bản đã được thử cùng nhau. `spring-boot-dependencies` là BOM của Spring Boot, và `spring-boot-starter-parent` kế thừa nó. Kết quả: bạn chọn **một** phiên bản Spring Boot, mọi starter và thư viện phổ biến (Jackson, Hibernate, Tomcat...) tự đúng phiên bản tương thích.",
        "Nếu không dùng parent này (dự án đã có parent khác của công ty), bạn **import** BOM vào `dependencyManagement` với `<scope>import</scope>` và `<type>pom</type>`. Hiệu quả tương tự: có danh sách phiên bản, nhưng không kế thừa cấu hình plugin.",
        "`spring-boot-maven-plugin` làm hai việc chính: lệnh `spring-boot:run` chạy ứng dụng, và khi `package` nó **repackage** jar thường thành jar chạy được (fat jar, Phần 4). Cũng nhờ parent mà ta không cần ghi version cho plugin này.",
      ],
      predict: {
        question: "Bạn chỉ đổi `<version>` của parent từ 3.5.16 lên bản vá mới hơn, không sửa gì khác. Điều gì xảy ra với phiên bản Jackson, Tomcat, Hibernate?",
        options: [
          "Giữ nguyên, vì bạn chưa đổi chúng",
          "Tự đổi theo bản mà Spring Boot mới đó đã chọn, vì chúng được quản lý trong BOM của parent",
          "Maven báo lỗi vì lệch phiên bản",
          "Phải sửa từng dependency một",
        ],
        answer: 1,
        explain: "Các thư viện không ghi version đều lấy từ `dependencyManagement` của parent, nên đổi parent là đổi cả bộ phiên bản đã được Spring Boot kiểm thử cùng nhau. Đó là lý do nâng cấp Spring Boot thường chỉ sửa một dòng.",
      },
      board: {
        title: "pom.xml của order-service",
        highlight: "pom.xml",
        chips: ["parent", "properties", "dependencies", "plugin"],
        cards: [
          {
            title: "Bốn khối chính",
            diagram: {
              kind: "pipe",
              from: "parent: spring-boot-starter-parent 3.5.16",
              via: "pom.xml của dự án",
              to: "Build chạy được, phiên bản thư viện tương thích",
              skipped: ["Ghi version cho từng starter", "Ghi version cho spring-boot-maven-plugin", "Tự đặt encoding và mức Java"],
              skippedLabel: "Nhờ parent nên không phải làm",
            },
            notes: ["Đoạn dưới là phần rút gọn, đúng nguyên văn từ `labs/order-service/pom.xml`."],
            code: `<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.16</version>
</parent>

<properties>
    <java.version>21</java.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>   <!-- không có version -->
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>`,
            takeaway: "Chọn một version parent, cả bộ thư viện đi theo",
          },
        ],
        conclusion: "**Kết luận:** `dependencies` là cái bạn dùng, `dependencyManagement` (BOM) là bảng phiên bản. Parent đã sẵn có bảng đó.",
      },
      cheat: [
        { name: "dependencies", one: "Khai báo thư viện thật sự dùng, vào classpath", say: "Trong dependencies mình khai báo thư viện cần dùng. Thư viện đó vào classpath của dự án." },
        { name: "dependencyManagement", one: "Chỉ quản lý phiên bản và scope, không thêm thư viện vào classpath", say: "dependencyManagement chỉ là bảng phiên bản. Nó không thêm gì vào classpath, chỉ để các dependency không cần ghi version và để cả dự án dùng cùng một bản." },
        { name: "BOM", one: "POM chỉ có dependencyManagement, danh sách phiên bản tương thích", say: "BOM là bill of materials, một danh sách phiên bản đã kiểm thử cùng nhau. Spring Boot cung cấp spring-boot-dependencies, parent starter kế thừa sẵn." },
        { name: "properties", one: "Biến dùng chung như java.version", say: "properties là biến dùng chung. java.version cho Spring Boot parent biết mức Java để biên dịch." },
        { name: "spring-boot-maven-plugin", one: "Chạy ứng dụng và đóng gói fat jar", say: "Plugin này cho lệnh spring-boot:run và repackage jar thành fat jar chạy được bằng java -jar." },
      ],
      compare: [
        {
          label: "Để BOM quản lý phiên bản",
          code: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<!-- version nằm ở parent 3.5.16 -->`,
          scenarios: [
            { ask: "Nâng Spring Boot sang bản vá mới", outcome: [{ text: "Sửa **một** dòng version của parent, cả bộ thư viện đi theo.", kind: "ok" }] },
            { ask: "Thêm một starter nữa", outcome: [{ text: "Chỉ ghi groupId và artifactId, version tự đúng.", kind: "ok" }] },
            { ask: "Jackson và Tomcat có tương thích nhau không?", outcome: [{ text: "Có, vì Spring Boot đã chọn và kiểm thử bộ phiên bản đó cùng nhau.", kind: "ok" }] },
          ],
          verdict: "Cách chuẩn: một nguồn phiên bản duy nhất, ít lỗi lệch bản.",
        },
        {
          label: "Tự ghi version từng dependency",
          code: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.5.16</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
    <version>3.5.16</version>
</dependency>`,
          scenarios: [
            { ask: "Nâng Spring Boot sang bản vá mới", outcome: [{ text: "Phải sửa version ở **từng** dependency, dễ sót một cái và lệch bản.", kind: "err" }] },
            { ask: "Thêm một starter nữa", outcome: [{ text: "Phải nhớ ghi đúng version, ghi sai là lệch với phần còn lại.", kind: "err" }] },
            { ask: "Jackson và Tomcat có tương thích nhau không?", outcome: [{ text: "Không ai đảm bảo, bạn tự chịu trách nhiệm.", kind: "err" }] },
          ],
          verdict: "Chạy được nhưng tự gánh việc đồng bộ phiên bản, trái với mục đích của BOM.",
        },
      ],
      widgetTitle: "Cùng một pom.xml, hai cách ghi version",
      after: ["Ghi version thẳng vào một dependency vẫn được và sẽ **thắng** bảng phiên bản của BOM. Ta dùng chính điều đó để làm một thí nghiệm xung đột phiên bản ở Phần 3."],
      takeaway: {
        lines: [
          "Parent `spring-boot-starter-parent` mang theo BOM, nên starter không cần version.",
          "`dependencyManagement` chỉ quản lý phiên bản, `dependencies` mới đưa thư viện vào classpath.",
        ],
      },
      quiz: {
        question: "Dự án đã có parent riêng của công ty nên không thể dùng `spring-boot-starter-parent`. Làm sao vẫn có bảng phiên bản của Spring Boot?",
        options: [
          "Không thể, bắt buộc dùng parent của Spring Boot",
          "Import BOM `spring-boot-dependencies` trong `dependencyManagement` với `<type>pom</type>` và `<scope>import</scope>`",
          "Chép toàn bộ phiên bản vào `application.yml`",
          "Cài plugin `spring-boot-maven-plugin` là đủ",
        ],
        answer: 1,
        explain: "Scope `import` chỉ dùng trong `dependencyManagement` với `type pom`: nó kéo bảng phiên bản của BOM vào dự án mà không cần kế thừa. Plugin không cấp bảng phiên bản.",
      },
    },
    {
      id: "scope-and-transitive",
      title: "Phần 3: Dependency scope, transitive và xung đột phiên bản",
      intro: [
        "**Scope** quyết định dependency có mặt ở giai đoạn nào: lúc biên dịch, lúc chạy, lúc test, và có đi vào jar cuối cùng hay không. Mặc định là `compile`. Năm scope cần biết:",
        "- **compile** (mặc định): có ở mọi giai đoạn và có trong jar. Ví dụ `spring-boot-starter-web`.",
        "- **provided**: cần lúc biên dịch nhưng **môi trường chạy cung cấp sẵn**, nên không đóng gói. Ví dụ API servlet khi chạy trên Tomcat bên ngoài.",
        "- **runtime**: không cần lúc biên dịch, chỉ cần lúc chạy. Ví dụ driver `postgresql`: code chỉ gọi JDBC chung chứ không import class của driver.",
        "- **test**: chỉ có khi biên dịch và chạy test, **không** vào jar. Ví dụ `spring-boot-starter-test`, `h2`.",
        "- **import**: chỉ dùng trong `dependencyManagement` với `type pom` để nhập một BOM (Phần 2).",
        "Bạn khai báo vài dependency nhưng thật ra có hàng chục jar trong classpath. Đó là **dependency transitive**: thư viện A cần B, B cần C, Maven kéo cả B và C về. Order-service khai báo 16 dependency, còn jar cuối cùng chứa 88 file trong `BOOT-INF/lib`.",
        "Lệnh `./mvnw dependency:tree` in ra cây đó, nên là lệnh đầu tiên bạn chạy khi nghi ngờ có thư viện lạ hoặc sai bản. Dưới đây là trích đoạn thật, cắt bớt:",
      ],
      board: {
        title: "Cây dependency của order-service",
        highlight: "dependency",
        chips: ["compile", "runtime", "test", "transitive"],
        cards: [
          {
            title: "Một starter kéo theo cả chùm",
            diagram: {
              kind: "flow",
              steps: ["Bạn khai báo starter-web", "Maven đọc pom của nó", "Kéo starter-json, starter-tomcat...", "Kéo tiếp jackson-databind, tomcat-embed-core..."],
              ok: ["Jar cuối cùng", "88 file trong BOOT-INF/lib"],
              bad: ["Không khai báo scope test", "h2 và starter-test không vào jar"],
              neutral: true,
            },
            notes: [
              "Lệnh: `./mvnw dependency:tree`. Các dòng bên dưới là trích, mỗi cấp thụt vào là một cấp transitive. Ở cuối mỗi dòng là scope.",
            ],
            code: `com.shop:order-service:jar:0.0.1-SNAPSHOT
+- org.springframework.boot:spring-boot-starter-web:jar:3.5.16:compile
|  +- org.springframework.boot:spring-boot-starter:jar:3.5.16:compile
|  |  +- org.springframework.boot:spring-boot:jar:3.5.16:compile
|  |  +- org.springframework.boot:spring-boot-starter-logging:jar:3.5.16:compile
|  +- org.springframework.boot:spring-boot-starter-json:jar:3.5.16:compile
|  |  +- com.fasterxml.jackson.core:jackson-databind:jar:2.21.4:compile
|  \\- org.springframework.boot:spring-boot-starter-tomcat:jar:3.5.16:compile
|     +- org.apache.tomcat.embed:tomcat-embed-core:jar:10.1.55:compile
...
+- org.postgresql:postgresql:jar:42.7.11:runtime
+- com.h2database:h2:jar:2.3.232:test`,
            takeaway: "Khai báo ít, classpath nhiều: đó là transitive",
          },
        ],
        conclusion: "**Kết luận:** `dependency:tree` cho biết thư viện nào đến từ đâu, phiên bản nào, scope nào. Đọc nó trước khi đoán mò.",
      },
      drill: {
        choices: ["compile", "provided", "runtime", "test"],
        items: [
          { q: "`spring-boot-starter-web`: code của bạn dùng `@RestController` trực tiếp", a: "compile", why: "Cần ở lúc biên dịch lẫn lúc chạy và phải có trong jar." },
          { q: "Driver `postgresql`: code chỉ dùng JDBC chung, driver chỉ cần khi chạy", a: "runtime", why: "Không cần để biên dịch, chỉ cần có trên classpath khi chạy. Đúng như pom của order-service." },
          { q: "`spring-boot-starter-test` và `h2` dùng cho unit test và integration test", a: "test", why: "Chỉ có khi test, không đi vào jar cuối cùng." },
          { q: "Servlet API khi bạn build WAR để chạy trên Tomcat có sẵn của máy chủ", a: "provided", why: "Cần để biên dịch nhưng Tomcat đã có sẵn lúc chạy, đóng gói thêm sẽ xung đột." },
        ],
        summary: "Hỏi hai câu: cần lúc biên dịch không, cần lúc chạy không. Cần cả hai và phải đóng gói thì compile.",
      },
      takeaway: {
        lines: [
          "compile (mặc định), provided (nơi chạy cung cấp), runtime (chỉ lúc chạy), test (chỉ lúc test), import (nhập BOM).",
          "Dependency transitive: bạn khai báo ít nhưng classpath có nhiều. Dùng `dependency:tree` để nhìn.",
        ],
      },
      quiz: {
        question: "Vì sao driver `postgresql` thường để scope `runtime`?",
        options: [
          "Vì driver không bao giờ vào jar",
          "Vì code chỉ dùng JDBC chung, không import class của driver nên biên dịch không cần, chỉ cần khi chạy",
          "Vì runtime nhanh hơn compile",
          "Vì Maven bắt buộc",
        ],
        answer: 1,
        explain: "Scope `runtime` nghĩa là không cần lúc biên dịch nhưng có ở lúc chạy và có trong jar. Driver được nạp qua JDBC chung nên hợp scope này. Để `compile` vẫn chạy được, nhưng cho phép code vô tình import class của driver.",
      },
      parts: [
        {
          id: "version-conflict",
          title: "Phần 3b: Xung đột phiên bản, nearest wins và exclusions",
          senior: true,
          intro: [
            "Khi hai đường dependency kéo về cùng một thư viện nhưng khác phiên bản, classpath chỉ chứa **một** bản. Maven chọn theo quy tắc **nearest wins**: bản nào **gần gốc cây hơn** (ít cấp thụt vào hơn) thì thắng. Bản bạn khai báo trực tiếp là gần nhất nên luôn thắng. Nếu hai bản cùng độ sâu thì bản khai báo trước thắng.",
            "Trong dự án Spring Boot, BOM đã ép phiên bản nên xung đột ít khi tự nhiên xảy ra. Nhưng chỉ cần ai đó ghi tay version là có thể lệch với phần còn lại. Dưới đây là thí nghiệm thật: thêm `jackson-databind` bản 2.12.0 vào pom (chú ý bảng BOM đang chọn 2.21.4).",
            "Lệnh `dependency:tree -Dverbose` hiện cả các bản bị loại, dòng có ngoặc đơn là bản bị bỏ ('omitted for conflict'). Muốn loại hẳn một nhánh khỏi cây, dùng **exclusion** ngay trong dependency kéo nó về.",
          ],
          board: {
            title: "Thí nghiệm: ghi tay version lệch với BOM",
            highlight: "nearest wins",
            chips: ["nearest wins", "-Dverbose", "exclusions"],
            cards: [
              {
                title: "Bản khai báo trực tiếp thắng",
                diagram: {
                  kind: "flow",
                  steps: ["Pom thêm jackson-databind 2.12.0", "starter-json kéo jackson-databind 2.21.4", "Maven so độ gần gốc cây"],
                  ok: ["Thắng: 2.12.0", "Khai báo trực tiếp, độ sâu 1"],
                  bad: ["Bị loại: 2.21.4", "Nằm sâu hơn trong cây"],
                },
                notes: [
                  "Đã chạy trên bản copy của order-service. Lệnh: `./mvnw dependency:tree -Dverbose -Dincludes=com.fasterxml.jackson.core:jackson-databind`. Trích đoạn:",
                ],
                code: `+- com.fasterxml.jackson.core:jackson-databind:jar:2.12.0:compile
|  +- (com.fasterxml.jackson.core:jackson-databind:jar:2.21.4:compile
|      - version managed from 2.21.4; omitted for conflict with 2.12.0)
...`,
                takeaway: "Ghi tay version là ghi đè cả BOM",
              },
              {
                title: "Exclusion: cắt một nhánh transitive",
                diagram: {
                  kind: "pipe",
                  from: "starter-web",
                  via: "exclusion spring-boot-starter-tomcat",
                  to: "Không còn tomcat-embed-core trong cây",
                  skipped: ["spring-boot-starter-tomcat", "tomcat-embed-core", "tomcat-embed-websocket"],
                  skippedLabel: "Bị cắt khỏi cây",
                },
                notes: [
                  "Dùng khi muốn thay Tomcat bằng Jetty hoặc Undertow. Đã kiểm tra: sau khi thêm exclusion này, `dependency:tree -Dincludes=org.apache.tomcat.embed` chỉ còn `tomcat-embed-el` (do thư viện khác kéo vào), không còn `tomcat-embed-core`.",
                ],
                code: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>`,
                takeaway: "Exclusion gỡ một nhánh, không đổi phiên bản",
              },
            ],
            conclusion: "**Kết luận:** thấy lỗi lạ liên quan thư viện thì chạy `dependency:tree -Dverbose`, tìm dòng 'omitted for conflict'. Cách sửa gọn nhất là bỏ version tay để BOM quyết, hoặc đổi một property của BOM.",
          },
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Hai đường kéo cùng thư viện, khác bản, Maven giữ bản gần gốc hơn. Khai báo trực tiếp luôn gần nhất.",
              "Version ghi tay trong dự án Spring Boot ghi đè BOM. Thư viện khác vẫn kỳ vọng bản của BOM, nên dễ vỡ lúc chạy.",
            ],
          },
          trap: {
            title: "Bẫy: 'Maven chọn bản mới nhất'",
            text: "Sai. Maven không chọn bản mới nhất, nó chọn bản **gần gốc cây nhất**. Bản cũ khai báo trực tiếp thắng bản mới nằm sâu trong cây.",
          },
          quiz: {
            question: "pom khai báo trực tiếp `jackson-databind:2.12.0`, trong khi starter-json kéo `2.21.4` và BOM cũng chọn `2.21.4`. Classpath có bản nào?",
            options: ["2.21.4 vì mới hơn", "2.12.0 vì khai báo trực tiếp là gần gốc nhất", "Cả hai", "Build lỗi"],
            answer: 1,
            explain: "Đúng như `dependency:tree -Dverbose` đã in: 2.12.0 được giữ, 2.21.4 bị 'omitted for conflict'. Nearest wins không quan tâm bản nào mới hơn.",
          },
        },
      ],
    },
    {
      id: "lifecycle-and-commands",
      title: "Phần 4: Lifecycle, các lệnh và fat jar",
      intro: [
        "Maven chạy theo **lifecycle**: một chuỗi **phase** cố định. Bạn gọi một phase thì Maven chạy **tất cả phase trước nó** rồi mới tới phase đó. Chuỗi mặc định gồm:",
        "- **validate**: kiểm tra pom hợp lệ.",
        "- **compile**: biên dịch `src/main/java` ra `target/classes`.",
        "- **test**: chạy unit test (plugin **surefire**, mặc định tìm lớp có tên `*Test`, `*Tests`, `Test*`).",
        "- **package**: đóng gói thành `.jar` hoặc `.war` trong `target/`.",
        "- **verify**: chạy các kiểm tra sau khi đóng gói (integration test với plugin failsafe, kiểm tra chất lượng).",
        "- **install**: chép artifact vào kho **local** `~/.m2/repository` để dự án khác trên **cùng máy** dùng được.",
        "- **deploy**: đẩy artifact lên kho **từ xa** (Nexus, Artifactory) cho cả team.",
        "Khác biệt hay hỏi: `mvn clean package` và `mvn clean install`. `clean` là một lifecycle khác, xoá thư mục `target/`. `package` dừng ở việc tạo jar trong `target/`. `install` chạy thêm `verify` rồi **chép jar vào `~/.m2`**. Với một ứng dụng Spring Boot đứng một mình, `package` là đủ. `install` chỉ cần khi module khác trong máy phải dùng artifact này.",
        "`-DskipTests` bỏ qua **chạy** test (vẫn biên dịch test). `-Dmaven.test.skip=true` bỏ cả biên dịch lẫn chạy. Chỉ dùng khi bạn biết lý do (ví dụ test cần Docker mà máy build chưa có), đừng biến nó thành thói quen.",
        "Dưới đây là log thật của `./mvnw -DskipTests clean package`: mỗi dòng `---` là một plugin chạy ở một phase.",
      ],
      board: {
        title: "Từ mã nguồn tới fat jar",
        highlight: "fat jar",
        chips: ["clean", "package", "surefire", "repackage"],
        cards: [
          {
            title: "Chuỗi plugin của `clean package`",
            diagram: {
              kind: "flow",
              steps: ["clean xoá target/", "resources chép file cấu hình", "compiler biên dịch code", "surefire chạy test", "jar tạo jar thường", "spring-boot repackage"],
              ok: ["BUILD SUCCESS", "target/order-service-0.0.1-SNAPSHOT.jar"],
              bad: ["Test đỏ hoặc lỗi biên dịch", "Dừng ngay, không tạo jar"],
            },
            notes: ["Log thật, đã lược phần ngoài lề. Với `-DskipTests`, surefire vẫn chạy nhưng in 'Tests are skipped.'."],
            code: `--- clean:3.4.1:clean (default-clean) @ order-service ---
--- resources:3.3.1:resources (default-resources) @ order-service ---
--- compiler:3.14.1:compile (default-compile) @ order-service ---
--- resources:3.3.1:testResources (default-testResources) @ order-service ---
--- compiler:3.14.1:testCompile (default-testCompile) @ order-service ---
--- surefire:3.5.6:test (default-test) @ order-service ---
Tests are skipped.
--- jar:3.4.2:jar (default-jar) @ order-service ---
--- spring-boot:3.5.16:repackage (repackage) @ order-service ---
BUILD SUCCESS   Total time: 3.767 s`,
            takeaway: "Gọi một phase là chạy mọi phase trước nó",
          },
          {
            title: "Fat jar do spring-boot-maven-plugin repackage",
            diagram: {
              kind: "pipe",
              from: "jar thường: 70 KB, chỉ có code của bạn",
              via: "spring-boot:repackage",
              to: "fat jar: 71 MB, kèm 88 jar thư viện, chạy bằng java -jar",
              skipped: ["Cài Tomcat riêng", "Chép từng jar vào classpath", "Viết script khởi động"],
              skippedLabel: "Không còn phải làm",
            },
            notes: [
              "Đã chạy `./mvnw -q -DskipTests package`, rồi `ls -la` và `unzip -l`. Jar thường được giữ lại với đuôi `.original`:",
            ],
            code: `-rw-r--r--  71166499  target/order-service-0.0.1-SNAPSHOT.jar
-rw-r--r--     70419  target/order-service-0.0.1-SNAPSHOT.jar.original

Main-Class: org.springframework.boot.loader.launch.JarLauncher
Start-Class: com.shop.orderservice.OrderServiceApplication

org/springframework/boot/loader/launch/JarLauncher.class
BOOT-INF/classes/com/shop/orderservice/...    <- code của bạn
BOOT-INF/classes/application.yml
BOOT-INF/lib/spring-boot-3.5.16.jar
BOOT-INF/lib/tomcat-embed-core-10.1.55.jar
BOOT-INF/lib/postgresql-42.7.11.jar            <- 88 jar trong lib`,
            takeaway: "Fat jar = code + mọi thư viện + launcher",
          },
        ],
        conclusion: "**Kết luận:** `java -jar` chạy `JarLauncher`, nó đọc `BOOT-INF/lib` và gọi `Start-Class` là lớp `main` của bạn. Tomcat nằm sẵn trong jar nên không cần cài gì thêm.",
      },
      cheat: [
        { name: "mvn clean package", one: "Xoá target, build lại, tạo jar trong target/", say: "clean package xoá kết quả build cũ rồi biên dịch, chạy test và đóng gói jar trong target. Không chép vào kho local." },
        { name: "mvn clean install", one: "Như package, thêm chép artifact vào ~/.m2", say: "install chạy tới verify rồi chép artifact vào kho local, để dự án khác trên cùng máy dùng được. Ứng dụng đứng một mình thì package là đủ." },
        { name: "mvn deploy", one: "Đẩy artifact lên kho từ xa (Nexus, Artifactory)", say: "deploy đẩy artifact lên kho từ xa cho cả team. Thường chạy trên CI, không chạy tay." },
        { name: "-DskipTests", one: "Biên dịch test nhưng không chạy", say: "-DskipTests bỏ qua chạy test nhưng vẫn biên dịch test. Chỉ dùng khi có lý do rõ, ví dụ test cần Docker mà máy build không có." },
        { name: "mvn test", one: "Chạy tới phase test, không tạo jar", say: "mvn test dừng ở phase test: biên dịch và chạy unit test bằng surefire, không đóng gói." },
        { name: "mvn spring-boot:run", one: "Chạy ứng dụng ngay từ source", say: "spring-boot:run chạy ứng dụng trực tiếp từ mã nguồn, tiện khi phát triển, không cần tạo jar." },
      ],
      takeaway: {
        lines: [
          "Phase chạy theo thứ tự: validate, compile, test, package, verify, install, deploy. Gọi phase nào là chạy mọi phase trước nó.",
          "`package` tạo jar trong `target/`, `install` chép thêm vào `~/.m2`, `deploy` đẩy lên kho từ xa.",
        ],
      },
      trap: {
        title: "Bẫy: jar tạo ra chưa chắc chạy được",
        text: "Ở bản copy order-service, `java -jar` chạy `JarLauncher` đúng, nhưng ứng dụng báo lỗi vì cấu hình mặc định không có `url` cho DataSource. Jar đóng gói đúng là chuyện khác với cấu hình runtime đúng: cần chạy với profile `dev` và PostgreSQL, Redis đang chạy.",
      },
      quiz: {
        question: "Bạn chạy `mvn package`. Những phase nào đã chạy?",
        options: [
          "Chỉ `package`",
          "Mọi phase từ `validate` tới `package` (gồm compile và test)",
          "`package` rồi `install`",
          "Chỉ compile và package, bỏ qua test",
        ],
        answer: 1,
        explain: "Lifecycle là chuỗi: gọi một phase thì mọi phase trước nó chạy theo, gồm cả `test`. Muốn bỏ test phải thêm `-DskipTests`.",
      },
    },
    {
      id: "maven-wrapper",
      title: "Phần 5: Maven Wrapper (mvnw)",
      intro: [
        "Tình huống quen thuộc: bạn build ổn trên máy mình (Maven 3.9), đồng nghiệp build lỗi (Maven 3.6), CI dùng Maven khác nữa. Cùng một `pom.xml` nhưng kết quả khác vì **phiên bản Maven** khác nhau, chưa kể người mới phải tự cài Maven.",
        "**Maven Wrapper** giải quyết việc này: dự án chứa sẵn script `mvnw` (macOS, Linux) và `mvnw.cmd` (Windows) cùng thư mục `.mvn/wrapper`. Lần đầu chạy `./mvnw`, script đọc phiên bản trong `maven-wrapper.properties`, tự tải đúng bản Maven đó về `~/.m2/wrapper` rồi chạy. Mọi người và CI dùng **cùng một phiên bản Maven**, không cần cài Maven.",
        "Các file này được **commit vào git** cùng dự án. Đổi phiên bản Maven cho cả team chỉ là sửa một dòng `distributionUrl` rồi commit.",
        "Trên order-service, `./mvnw -v` cho kết quả sau (rút gọn):",
      ],
      board: {
        title: "Maven Wrapper trong order-service",
        highlight: "Wrapper",
        chips: ["mvnw", "mvnw.cmd", ".mvn/wrapper"],
        cards: [
          {
            title: "Cùng một phiên bản Maven cho cả team",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "Máy dev macOS", mark: "ok" },
                { label: "Máy dev Windows", mark: "ok" },
                { label: "CI server", mark: "ok" },
              ],
              center: "./mvnw",
              rulesTitle: "Cả ba cùng nhận",
              rules: [
                "Cùng **Maven 3.10.0** như ghi trong `maven-wrapper.properties`",
                "Không cần cài Maven trước",
                "Đổi phiên bản bằng một commit",
              ],
            },
            notes: ["Nội dung thật của `.mvn/wrapper/maven-wrapper.properties` và kết quả `./mvnw -v`:"],
            code: `wrapperVersion=3.3.4
distributionType=only-script
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.10.0/apache-maven-3.10.0-bin.zip

$ ./mvnw -v
Apache Maven 3.10.0 (c43a36b8d67be7e0805a411bc0898af1a51f5472)
Maven home: ~/.m2/wrapper/dists/apache-maven-3.10.0/dae9a06d
Java version: 21.0.12.1, vendor: Microsoft`,
            takeaway: "Wrapper cố định phiên bản Maven theo dự án",
          },
        ],
        conclusion: "**Kết luận:** luôn dùng `./mvnw`, không dùng `mvn` cài sẵn trên máy, để kết quả build giống nhau ở mọi nơi.",
      },
      takeaway: {
        lines: [
          "`mvnw` tải và dùng đúng phiên bản Maven ghi trong dự án, nên cả team và CI cùng một bản.",
          "Commit `mvnw`, `mvnw.cmd` và `.mvn/wrapper` vào git. Đổi phiên bản Maven là sửa một dòng `distributionUrl`.",
        ],
      },
      quiz: {
        question: "Vì sao nên chạy `./mvnw` thay vì `mvn` đã cài trên máy?",
        options: [
          "`mvnw` build nhanh hơn `mvn`",
          "`mvnw` đảm bảo mọi máy và CI dùng cùng phiên bản Maven theo `maven-wrapper.properties`",
          "`mvn` không chạy được với Spring Boot",
          "`mvnw` bỏ qua test",
        ],
        answer: 1,
        explain: "Giá trị của wrapper là tính nhất quán: phiên bản Maven nằm trong repo, ai chạy cũng giống nhau, không cần cài Maven. Không liên quan tốc độ.",
      },
    },
    {
      id: "build-errors",
      title: "Phần 6: Đọc lỗi build, Gradle và cách trả lời phỏng vấn",
      senior: true,
      intro: [
        "Phần lớn lỗi build có thể đọc ra nguyên nhân nếu bạn tìm đúng dòng. Mẹo chung: kéo xuống dòng `[ERROR]` **đầu tiên**, đọc câu mô tả và tên plugin (`maven-compiler-plugin`, `surefire`...) vì nó cho biết lỗi ở bước nào. Thêm `-e` để xem stack trace, `-X` để xem log chi tiết khi cần.",
        "Ba lỗi hay gặp, mình đã dựng lại bằng cách sửa bản copy của order-service và chạy `./mvnw compile`:",
        "- **Could not resolve dependencies**: không tìm được artifact. Nguyên nhân thường gặp: sai version (như ghi một bản không tồn tại), sai groupId hay artifactId, không có mạng hoặc proxy chặn, kho riêng (Nexus) chưa khai báo hoặc thiếu quyền, hoặc artifact SNAPSHOT chưa ai deploy.",
        "- **Source option 5 is no longer supported**: mức Java biên dịch quá cũ so với JDK đang dùng. Hay gặp khi pom đặt `maven.compiler.source` quá thấp hoặc dự án cũ chưa có `java.version`. Sửa bằng cách đặt `java.version` đúng (ví dụ 21) và chạy bằng JDK tương ứng.",
        "- **Lỗi lúc chạy do hai phiên bản thư viện** (`NoSuchMethodError`, `ClassNotFoundException`, `NoClassDefFoundError`): build thành công nhưng chạy mới nổ. Nguyên nhân là classpath chứa bản thư viện khác bản mà code hoặc thư viện khác biên dịch với nó (đúng bối cảnh Phần 3b). Cách điều tra: `dependency:tree -Dverbose`, tìm 'omitted for conflict', rồi bỏ version tay hoặc đưa về bản BOM. Lưu ý: lỗi này mình mô tả theo cơ chế, chưa dựng lại thành lỗi chạy thật trong bài.",
        "**SNAPSHOT** là nguồn gây lỗi 'hôm qua chạy, hôm nay hỏng': bản `-SNAPSHOT` có thể bị ai đó deploy đè, mỗi lần build có thể kéo nội dung khác dù số version giữ nguyên. Release chính thức nên dùng bản cố định, tránh phụ thuộc SNAPSHOT.",
      ],
      board: {
        title: "Ba lỗi build có thật",
        highlight: "lỗi build",
        chips: ["resolve", "compiler", "classpath"],
        cards: [
          {
            title: "Could not resolve dependencies",
            diagram: {
              kind: "flow",
              steps: ["Ghi version 3.5.99 cho starter-web", "./mvnw compile", "Maven hỏi Maven Central"],
              ok: ["Có artifact", "Tải về, build tiếp"],
              bad: ["Không có artifact", "BUILD FAILURE ở bước resolve"],
            },
            notes: ["Đã chạy thật trên bản copy. Sửa bằng cách ghi version đúng hoặc bỏ version để BOM quyết:"],
            code: `Failed to execute goal on project order-service:
  Could not resolve dependencies for project com.shop:order-service:jar:0.0.1-SNAPSHOT
dependency: org.springframework.boot:spring-boot-starter-web:jar:3.5.99 (compile)
  Could not find artifact org.springframework.boot:spring-boot-starter-web:jar:3.5.99
  in central (https://repo.maven.apache.org/maven2)`,
            takeaway: "Đọc dòng 'Could not find artifact': nó nêu đủ GAV",
          },
          {
            title: "Source option 5 is no longer supported",
            diagram: {
              kind: "flow",
              steps: ["pom đặt maven.compiler.source = 1.5", "maven-compiler-plugin gọi javac", "javac của JDK 21 từ chối"],
              ok: ["java.version = 21", "Biên dịch bình thường"],
              bad: ["Source option 5", "COMPILATION ERROR"],
            },
            notes: [
              "Đã chạy thật. Lưu ý: nếu chỉ đổi `java.version` thành `1.5` với Spring Boot parent thì lỗi hơi khác: `Fatal error compiling: error: release version 1.5 not supported`. Cả hai cùng một gốc là mức Java quá cũ so với JDK.",
            ],
            code: `COMPILATION ERROR :
Source option 5 is no longer supported. Use 8 or later.
Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.14.1:compile
(default-compile) on project order-service: Compilation failure`,
            takeaway: "Tên plugin trong lỗi cho biết bước nào hỏng",
          },
        ],
        conclusion: "**Kết luận:** đọc dòng `[ERROR]` đầu tiên, xác định plugin và goal, rồi mới sửa. Lỗi resolve là lỗi về artifact, lỗi compiler là lỗi về mức Java hoặc code, lỗi chạy do hai bản thư viện thì dùng `dependency:tree`.",
      },
      cheat: [
        { name: "Could not resolve dependencies", one: "Maven không tìm được artifact với GAV đã khai", say: "Đầu tiên mình đọc GAV trong thông báo xem sai version hay tên, rồi kiểm tra mạng, proxy và kho riêng, và có phải bản SNAPSHOT chưa ai deploy không." },
        { name: "Source option 5 is no longer supported", one: "Mức Java biên dịch quá cũ so với JDK", say: "Pom đang đặt mức Java quá thấp. Mình đặt java.version đúng và đảm bảo JDK đang chạy là bản tương ứng." },
        { name: "NoSuchMethodError lúc chạy", one: "Hai phiên bản của cùng thư viện, classpath giữ bản không khớp", say: "Mình chạy dependency:tree -Dverbose để tìm omitted for conflict, rồi bỏ version ghi tay để BOM quyết, hoặc thêm exclusion." },
        { name: "SNAPSHOT", one: "Bản đang phát triển, nội dung có thể đổi dù số version giữ nguyên", say: "SNAPSHOT có thể bị deploy đè nên build không lặp lại được. Release dùng bản cố định." },
      ],
      parts: [
        {
          id: "gradle-briefly",
          title: "Phần 6b: Gradle khác gì và khi nào gặp",
          senior: true,
          intro: [
            "Maven không phải công cụ build duy nhất. **Gradle** hay gặp ở dự án Kotlin, Android và một số dự án Java mới. Spring Boot hỗ trợ cả hai và trang khởi tạo dự án cho chọn.",
            "- **Cấu hình**: Maven dùng XML khai báo (`pom.xml`), Gradle dùng script bằng **Groovy hoặc Kotlin DSL** (`build.gradle`, `build.gradle.kts`), ngắn hơn và linh hoạt hơn nhưng cũng dễ viết phức tạp.",
            "- **Tốc độ**: Gradle thường build nhanh hơn nhờ build tăng dần (incremental), cache và daemon chạy nền. Maven đơn giản và dễ đoán hơn.",
            "- **Quy ước**: Maven có lifecycle cố định và rất chuẩn hoá. Gradle dùng task graph tuỳ biến hơn.",
            "- **Wrapper**: Gradle cũng có `gradlew` với cùng mục đích như `mvnw`.",
            "Ở công ty, bạn chủ yếu gặp công cụ mà dự án đã chọn sẵn, nên khái niệm quan trọng hơn cú pháp: dependency, scope, BOM, build lặp lại được. Trong phỏng vấn, không cần biết sâu Gradle, chỉ cần nói được khác biệt chính. Phần so sánh tốc độ ở đây là nhận định chung, bài này không đo.",
          ],
          takeaway: {
            lines: [
              "Maven: XML, lifecycle cố định, dễ đoán. Gradle: Groovy/Kotlin DSL, build nhanh nhờ cache và incremental, linh hoạt hơn.",
              "Cùng ý tưởng: dependency, scope, BOM, wrapper. Biết một thì học cái kia nhanh.",
            ],
          },
          quiz: {
            question: "Điểm khác chính giữa file cấu hình của Maven và Gradle là gì?",
            options: [
              "Maven dùng XML khai báo, Gradle dùng script Groovy hoặc Kotlin DSL",
              "Maven không có wrapper còn Gradle thì có",
              "Gradle không quản lý dependency",
              "Maven không chạy được test",
            ],
            answer: 0,
            explain: "Maven mô tả dự án bằng XML (`pom.xml`). Gradle dùng script (`build.gradle` hoặc `.kts`). Cả hai đều quản lý dependency và đều có wrapper (`mvnw`, `gradlew`).",
          },
        },
      ],
      takeaway: {
        lines: [
          "Gặp lỗi build: đọc `[ERROR]` đầu tiên, xác định plugin, rồi chọn hướng: artifact, mức Java hay xung đột phiên bản.",
          "Lỗi chạy do hai bản thư viện: `dependency:tree -Dverbose`, tìm 'omitted for conflict'. Tránh phụ thuộc SNAPSHOT cho bản release.",
        ],
      },
      quiz: {
        question: "Build báo `Could not find artifact ...:3.5.99 in central`. Bước điều tra hợp lý đầu tiên là gì?",
        options: [
          "Xoá toàn bộ `~/.m2` rồi build lại",
          "Đọc GAV trong thông báo: version 3.5.99 có tồn tại không, hay gõ sai. Ở dự án Spring Boot thì thường bỏ version để BOM quyết",
          "Tắt test bằng `-DskipTests`",
          "Đổi sang Gradle",
        ],
        answer: 1,
        explain: "Thông báo đã nêu đủ GAV artifact không tìm thấy. Lỗi này xảy ra ở bước resolve, trước cả khi test chạy, nên `-DskipTests` không liên quan. Xoá `~/.m2` hiếm khi cần và tốn thời gian tải lại.",
      },
    },
  ],
  modelAnswer:
    "Em hiểu Maven là công cụ build và quản lý dependency theo quy ước: mọi thứ khai báo trong pom.xml, mỗi artifact có toạ độ groupId, artifactId, version. Dự án Spring Boot kế thừa spring-boot-starter-parent, nên nhờ BOM mà starter không cần ghi version và nâng Spring Boot chỉ sửa một dòng. Về scope, thư viện cần cả lúc biên dịch và chạy thì để compile, driver database thì runtime, thư viện test thì test, provided là môi trường chạy cung cấp sẵn. Dependency được kéo theo transitive nên em dùng dependency:tree để xem, và khi hai đường kéo khác phiên bản thì Maven theo nearest wins, bản khai báo trực tiếp thắng, nên version ghi tay có thể ghi đè BOM. Lifecycle chạy tuần tự validate, compile, test, package, verify, install, deploy. Package tạo jar trong target, install chép thêm vào kho local, và spring-boot-maven-plugin repackage thành fat jar chạy bằng java -jar. Em luôn dùng mvnw để cả team và CI cùng phiên bản Maven. Khi lỗi build em đọc dòng ERROR đầu tiên để biết plugin và bước nào hỏng, còn lỗi lúc chạy như NoSuchMethodError thì em kiểm tra xung đột phiên bản bằng dependency:tree với tham số verbose.",
  cards: [
    { q: "Maven giải quyết hai việc gì?", a: "Quản lý dependency (tải thư viện và các thư viện kéo theo từ Maven Central) và build theo quy ước (cấu trúc thư mục, lifecycle cố định)." },
    { q: "Toạ độ GAV là gì?", a: "groupId (nhóm hoặc tổ chức), artifactId (tên module), version. Ba thứ này định danh duy nhất một artifact. -SNAPSHOT là bản còn thay đổi." },
    { q: "Vì sao starter của Spring Boot không cần ghi version?", a: "Parent spring-boot-starter-parent kế thừa BOM spring-boot-dependencies, trong dependencyManagement đã có phiên bản cho starter và thư viện phổ biến." },
    { q: "dependencies khác dependencyManagement?", a: "dependencies khai báo thư viện thật sự dùng và đưa vào classpath. dependencyManagement chỉ quản lý phiên bản và scope, không thêm gì vào classpath." },
    { q: "Năm scope của dependency?", a: "compile (mặc định, mọi giai đoạn), provided (nơi chạy cung cấp), runtime (chỉ lúc chạy, như driver), test (chỉ test), import (nhập BOM trong dependencyManagement)." },
    { q: "Nearest wins là gì?", a: "Khi cùng thư viện xuất hiện với nhiều phiên bản, Maven giữ bản gần gốc cây hơn. Bản khai báo trực tiếp luôn thắng, không phải bản mới nhất." },
    { q: "Xem cây dependency và xung đột bằng lệnh nào?", a: "./mvnw dependency:tree. Thêm -Dverbose để thấy các bản bị loại ('omitted for conflict'). Dùng exclusion để gỡ một nhánh transitive." },
    { q: "Các phase của lifecycle mặc định?", a: "validate, compile, test, package, verify, install, deploy. Gọi một phase thì mọi phase trước nó chạy theo." },
    { q: "mvn clean package khác install?", a: "package tạo jar trong target/. install chạy thêm tới verify và chép artifact vào ~/.m2 cho dự án khác trên máy dùng. clean xoá target/." },
    { q: "Fat jar của Spring Boot là gì?", a: "spring-boot-maven-plugin repackage jar thường thành jar chứa cả code, BOOT-INF/lib (mọi thư viện) và JarLauncher, chạy bằng java -jar." },
    { q: "Vì sao dùng Maven Wrapper (mvnw)?", a: "Cố định phiên bản Maven theo dự án (maven-wrapper.properties) nên mọi máy và CI build giống nhau, không cần cài Maven. Commit các file wrapper vào git." },
    { q: "Gặp 'Could not resolve dependencies' thì làm gì?", a: "Đọc GAV trong thông báo, kiểm tra version và tên có đúng không, rồi mạng, proxy, kho riêng, và bản SNAPSHOT chưa deploy." },
  ],
};
