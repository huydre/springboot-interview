import type { Lesson } from "../types";

// Docker and Kubernetes for Spring developers. Image sizes, layer caching, JVM flags inside a memory limit, the two kinds of OOM
// and graceful shutdown were run on Docker Desktop 29.2.1 (8 CPUs) with a copy of labs/order-service (Spring Boot 3.5.16, Java 21).
// The Kubernetes YAML was written for the lesson but not applied to a cluster.
export const dockerK8s: Lesson = {
  slug: "docker-k8s",
  crumb: "Docker & Kubernetes",
  videoDir: "/videos/docker-k8s",
  videoVersion: "0",
  scenes: [],
  title: "Docker và Kubernetes cho dev Spring",
  subtitle:
    "Container khác VM ở đâu, image và layer, Dockerfile tốt cho Spring Boot (multi-stage, layered jar, JRE nhỏ, user non-root), JVM trong container (MaxRAMPercentage, OOMKilled và OutOfMemoryError, CPU), Pod, Deployment, Service, ConfigMap, Secret, health probe, và graceful shutdown để deploy không lỗi 503.",
  openingQuiz: {
    question: "Container Spring Boot chạy với `-m 512m` và không đặt cờ heap nào. Java 21 cho heap tối đa khoảng bao nhiêu?",
    options: ["512 MB, bằng giới hạn container", "Khoảng 128 MB, tức 25% giới hạn", "Bằng 25% RAM của máy chủ", "Không giới hạn"],
    answer: 1,
    explain:
      "JVM đọc giới hạn của container (UseContainerSupport bật sẵn) và mặc định lấy `MaxRAMPercentage=25`. Đã chạy trong bài: `MaxHeapSize = 134217728` (128 MB) với `-m 512m`. Phần 3 giải thích vì sao nên tăng lên khoảng 75%.",
  },
  roadmap: [
    "Chặng 1: container và VM, image và layer, vì sao thứ tự lệnh trong Dockerfile quyết định cache; Dockerfile tốt cho Spring Boot.",
    "Chặng 2: JVM trong container: heap theo giới hạn, OOMKilled khác OutOfMemoryError, CPU và số thread.",
    "Chặng 3: Kubernetes cho dev: Pod, Deployment, Service, ConfigMap, Secret, rolling update; liveness, readiness, startup probe; graceful shutdown và preStop để deploy không 503.",
  ],
  sections: [
    {
      id: "container-image",
      title: "Phần 1: Container, image, layer và cache khi build",
      intro: [
        "Bài Nền tảng hệ thống đã trả lời câu \"vì sao cần Kubernetes\". Bài này đi xuống một tầng: chính cái container chạy app Spring của bạn, và những lỗi dev hay gặp khi đóng gói và deploy nó.",
        "Câu mở màn quen thuộc: container khác máy ảo (VM) chỗ nào?",
        "- **VM**: giả lập cả một máy, mỗi VM có **kernel riêng** (một hệ điều hành đầy đủ). Cô lập mạnh, nhưng nặng: khởi động tính bằng chục giây đến phút, mỗi VM tốn vài trăm MB đến vài GB chỉ cho hệ điều hành.",
        "- **Container**: chỉ là một **process** trên máy chủ, **dùng chung kernel** với máy chủ. Linux cô lập nó bằng **namespaces** (process chỉ thấy cây thư mục, mạng, PID của riêng nó) và giới hạn tài nguyên bằng **cgroups** (bao nhiêu CPU, bao nhiêu RAM). Khởi động gần như bằng thời gian chạy chính app.",
        "Hệ quả: container nhẹ, nhiều container trên một máy, nhưng cô lập yếu hơn VM vì chung kernel. Đó là lý do không nên chạy container bằng root (Phần 2).",
        "**Image** là bản đóng gói chỉ đọc: hệ thống file tối thiểu, JRE, file jar, và lệnh khởi động. **Container** là một lần chạy image, có thêm một lớp ghi được ở trên cùng. Một image, chạy bao nhiêu container cũng được.",
        "Image được xếp từ nhiều **layer**. Mỗi lệnh `RUN`, `COPY`, `ADD` trong Dockerfile tạo một layer mới, chỉ chứa phần thay đổi so với layer dưới. Khi build lại, Docker đi từ trên xuống: lệnh nào **giống hệt lần trước và mọi file nó dùng không đổi** thì dùng lại layer cũ (CACHED). Gặp lệnh đầu tiên có thay đổi thì từ đó trở xuống **build lại hết**.",
        "Vì vậy thứ tự lệnh quyết định tốc độ build: thứ ít đổi (tải dependency) đặt trên, thứ đổi liên tục (code) đặt dưới.",
      ],
      predict: {
        question: "Dockerfile có `COPY . .` rồi mới `RUN mvn package`. Bạn sửa một dòng trong một file Java rồi build lại. Bước tải dependency Maven có được cache không?",
        options: [
          "Có, vì `pom.xml` không đổi",
          "Không: `COPY . .` thấy một file đổi nên layer đó và mọi bước sau, kể cả tải dependency trong `mvn package`, đều chạy lại",
          "Có, Docker tự hiểu Maven",
          "Chỉ khi dùng BuildKit",
        ],
        answer: 1,
        explain: "Cache xét theo từng lệnh. `COPY . .` gom cả code lẫn `pom.xml`, nên code đổi là layer đổi, và `mvn package` sau nó phải tải lại dependency từ đầu. Tách `COPY pom.xml` và bước tải dependency lên trước thì code đổi không đụng tới chúng.",
      },
      widgetTitle: "Cùng một app, hai thứ tự lệnh",
      compare: [
        {
          label: "COPY . . trước",
          code: `FROM maven:3.9-eclipse-temurin-21
WORKDIR /app
COPY . .
RUN mvn -q -DskipTests package
ENTRYPOINT ["java", "-jar", "target/order-service-0.0.1-SNAPSHOT.jar"]`,
          scenarios: [
            {
              ask: "Sửa một dòng code rồi build lại",
              outcome: [
                { text: "`COPY . .` đổi, nên `mvn package` chạy lại từ đầu, tải lại mọi dependency (lần build đầu bước này mất 154,4 giây)", kind: "err" },
              ],
            },
            {
              ask: "Kích thước image",
              outcome: [
                { text: "Đã đo: 1,24 GB trên đĩa, 427 MB nén. Chứa cả JDK, Maven, mã nguồn và 139 MB thư mục `.m2`", kind: "err" },
              ],
            },
            {
              ask: "Chạy bằng user nào",
              outcome: [{ text: "`root`, vì không có lệnh `USER`", kind: "err" }],
            },
          ],
          verdict: "Đơn giản nhưng build chậm, image to, mang theo công cụ build và chạy bằng root vào production.",
        },
        {
          label: "pom.xml trước, code sau",
          code: `FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package`,
          scenarios: [
            {
              ask: "Sửa một dòng code rồi build lại",
              outcome: [
                { text: "Đã chạy: `COPY pom.xml` và `dependency:go-offline` đều CACHED (lần đầu bước tải mất 295 giây)", kind: "ok" },
                { text: "Chỉ `COPY src` và `mvn package` chạy lại: 31,6 giây", kind: "ok" },
              ],
            },
            {
              ask: "Sửa `pom.xml` (thêm dependency)",
              outcome: [{ text: "Bước tải dependency chạy lại, đúng như mong muốn vì dependency thật sự đổi", kind: "ok" }],
            },
            {
              ask: "Kích thước image",
              outcome: [{ text: "Đây mới là stage build. Phần 2 thêm stage chạy trên JRE để image nhỏ lại", kind: "ok" }],
            },
          ],
          verdict: "Thứ ít đổi ở trên, thứ hay đổi ở dưới: sửa code không làm tải lại dependency.",
        },
      ],
      after: [
        "Một lưu ý nhỏ: thêm file `.dockerignore` (ít nhất `target` và `.git`) để build context không kéo theo rác, và để `COPY` không bị đổi vì những file không liên quan.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Một file đổi → lệnh COPY chứa nó đổi → mọi layer phía dưới build lại. Nên tải dependency trước, copy code sau."],
      },
      quiz: {
        question: "Container khác VM ở điểm cốt lõi nào?",
        options: [
          "Container có kernel riêng, VM thì không",
          "Container là process dùng chung kernel máy chủ, được cô lập bằng namespaces và giới hạn bằng cgroups; VM có kernel và hệ điều hành riêng",
          "Container chỉ chạy được Java",
          "Không khác, chỉ khác tên",
        ],
        answer: 1,
        explain: "Chung kernel nên container nhẹ và khởi động nhanh, đổi lại cô lập yếu hơn VM.",
      },
    },
    {
      id: "dockerfile-spring",
      title: "Phần 2: Dockerfile tốt cho Spring Boot",
      intro: [
        "Phần 1 đã sửa thứ tự lệnh. Nhưng image vẫn chứa JDK, Maven và mã nguồn, thứ production không bao giờ cần. Một Dockerfile tốt cho Spring Boot làm 4 việc:",
        "- **Multi-stage build**: stage 1 dùng image JDK + Maven để build. Stage 2 bắt đầu lại từ một image **chỉ có JRE**, và chỉ `COPY --from=build` đúng phần cần chạy. Mọi thứ của stage 1 bị bỏ lại.",
        "- **Layered jar**: không copy nguyên file jar 71 MB thành một layer, mà tách thành 4 layer theo tần suất thay đổi (phần sau).",
        "- **Base image nhỏ**: `eclipse-temurin:21-jre-alpine` thay vì image JDK đầy đủ.",
        "- **User non-root**: tạo user riêng và `USER app`. Container chung kernel với máy chủ, nên nếu app bị chiếm quyền thì root trong container là bước đệm nguy hiểm hơn nhiều so với một user thường.",
      ],
      board: {
        title: "Multi-stage: build bằng JDK, chạy bằng JRE",
        highlight: "multi-stage",
        chips: ["Đã build và chạy", "Spring Boot 3.5.16, Java 21"],
        cards: [
          {
            title: "Dockerfile đầy đủ",
            diagram: {
              kind: "pipe",
              from: "Stage build: JDK + Maven",
              via: "COPY --from=build",
              to: "Stage chạy: JRE alpine, user app",
              skipped: ["Maven", "JDK", "mã nguồn", ".m2"],
              skippedLabel: "Bỏ lại",
            },
            code: `FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package \\
 && java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination /layers

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /layers/dependencies/ ./
COPY --from=build /layers/spring-boot-loader/ ./
COPY --from=build /layers/snapshot-dependencies/ ./
COPY --from=build /layers/application/ ./
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]`,
            notes: ["Đã chạy: container khởi động, `id` trong container in `uid=100(app)`.", "`ENTRYPOINT` dạng mảng (exec form) để `java` là PID 1 và nhận được SIGTERM (Phần 6)."],
            takeaway: "Image chạy chỉ chứa JRE và app",
          },
          {
            title: "Kích thước đo được",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "Một stage, JDK + Maven: 1,24 GB", mark: "minus" },
                { label: "Multi-stage, JRE alpine: 431 MB", mark: "plus" },
              ],
              center: "Nhỏ hơn khoảng 3 lần",
              rulesTitle: "Số nén (đẩy lên registry)",
              rules: ["Một stage: 427 MB", "Multi-stage: 140 MB", "Image một stage chạy bằng `root`"],
            },
            notes: ["Docker Desktop 29 hiện hai cột: DISK USAGE (đã giải nén) và CONTENT SIZE (nén). Số trên lấy từ `docker image ls`."],
            takeaway: "Bỏ công cụ build ra khỏi image chạy",
          },
        ],
        conclusion: "**Kết luận:** multi-stage giữ công cụ build ở stage đầu, image chạy chỉ có JRE, app, và một user thường.",
      },
      after: [
        "Image JRE alpine vẫn còn 431 MB trên đĩa, phần lớn là JRE và 68 MB thư viện của app. Muốn nhỏ hơn nữa có `jlink` (tự đóng JRE chỉ gồm module cần dùng) hoặc image distroless, nhưng phỏng vấn thường chỉ cần nêu được 4 việc ở trên.",
      ],
      quiz: {
        question: "Vì sao multi-stage build làm image nhỏ đi nhiều?",
        options: [
          "Vì Docker nén mạnh hơn",
          "Vì stage cuối bắt đầu từ image JRE và chỉ copy phần cần chạy; JDK, Maven, mã nguồn, `.m2` ở stage build bị bỏ lại",
          "Vì multi-stage tự xoá log",
          "Vì Spring Boot tự thu nhỏ jar",
        ],
        answer: 1,
        explain: "Chỉ những gì được `COPY --from` sang mới có mặt trong image cuối. Đã đo: 1,24 GB còn 431 MB.",
      },
      parts: [
        {
          id: "layered-jar",
          title: "Layered jar: tách jar theo tần suất thay đổi",
          intro: [
            "Jar của Spring Boot là \"fat jar\": 71 MB, trong đó code của bạn chưa tới 1 MB, còn lại là thư viện. Copy nguyên file jar thành một layer thì sửa một dòng code cũng tạo ra một layer 71 MB mới, phải đẩy và kéo lại cả 71 MB.",
            "Spring Boot ghi sẵn file `layers.idx` trong jar, chia nội dung thành 4 layer, từ ít đổi tới hay đổi:",
            "- **dependencies**: thư viện có version cố định. Đã đo: 68 MB.",
            "- **spring-boot-loader**: bộ khởi động của Spring Boot. 604 KB.",
            "- **snapshot-dependencies**: thư viện bản SNAPSHOT (đổi thường xuyên hơn). Ở app này rỗng.",
            "- **application**: class và resource của chính bạn. 316 KB.",
            "Lệnh tách: từ Spring Boot 3.3 trở lên dùng `java -Djarmode=tools -jar app.jar extract --layers --launcher`. Cờ `--launcher` giữ cấu trúc để chạy bằng `JarLauncher`. Lệnh cũ `-Djarmode=layertools ... extract` vẫn chạy trên Boot 3.5.16 nhưng in cảnh báo (đã chạy):",
            "- `Warning: This command is deprecated. Use '-Djarmode=tools extract --layers --launcher' instead.`",
            "Mỗi layer là một lệnh `COPY` riêng trong Dockerfile, theo đúng thứ tự trên.",
          ],
          board: {
            title: "Sửa code chỉ đổi layer nhỏ nhất",
            highlight: "layer nhỏ nhất",
            chips: ["Đã build lại sau khi sửa một file Java"],
            cards: [
              {
                title: "Build lại sau khi sửa code",
                diagram: {
                  kind: "flow",
                  steps: ["COPY dependencies (71,1 MB)", "COPY spring-boot-loader (696 kB)", "COPY snapshot-dependencies", "COPY application (410 kB)"],
                  ok: ["Ba layer đầu", "CACHED, không đẩy lại"],
                  bad: ["Layer application", "Tạo mới 410 kB"],
                },
                notes: ["Số lấy từ `docker history` của image build lại: chỉ dòng `COPY /layers/application/` có thời gian tạo mới."],
                takeaway: "Deploy bản sửa code chỉ đẩy vài trăm KB",
              },
            ],
            conclusion: "**Kết luận:** layered jar cho phép registry và node dùng lại 68 MB thư viện giữa các bản build.",
          },
          quiz: {
            question: "Lệnh nào tách layer của jar trên Spring Boot 3.3 trở lên?",
            options: [
              "`java -jar app.jar --layers`",
              "`java -Djarmode=tools -jar app.jar extract --layers --launcher`",
              "`mvn layers:extract`",
              "`docker layer app.jar`",
            ],
            answer: 1,
            explain: "`jarmode=tools` là cách mới từ Boot 3.3. `jarmode=layertools` vẫn chạy nhưng đã deprecated và in cảnh báo.",
          },
        },
      ],
    },
    {
      id: "jvm-in-container",
      title: "Phần 3: JVM trong container: bộ nhớ, CPU và số thread",
      intro: [
        "Image đã gọn. Giờ chạy nó với giới hạn tài nguyên, và JVM phải tự biết mình đang bị giới hạn.",
        "Từ Java 10 (và 8u191), cờ `UseContainerSupport` bật sẵn: JVM đọc giới hạn RAM và CPU từ cgroups thay vì nhìn RAM của cả máy. Heap tối đa mặc định là **25%** giới hạn đó (`MaxRAMPercentage=25`).",
        "Đã chạy `java -XX:+PrintFlagsFinal -version | grep MaxHeapSize` trong container Temurin 21, máy Docker có 8 CPU:",
        "- **Không giới hạn**: `MaxHeapSize = 2055208960` (khoảng 1960 MB, 25% RAM của máy ảo Docker).",
        "- **`-m 512m`**: `MaxHeapSize = 134217728`, tức 128 MB. Heap chỉ một phần tư, ba phần tư còn lại bỏ phí.",
        "- **`-m 512m` và `-XX:MaxRAMPercentage=75`**: `MaxHeapSize = 402653184`, tức 384 MB.",
        "Vì sao 75% chứ không phải 100%? Vì heap không phải toàn bộ bộ nhớ của JVM. Còn **metaspace** (class), **thread stack** (mỗi thread thường 1 MB), **code cache** của JIT, **direct buffer** của Netty và NIO, cộng bộ nhớ của chính GC. Đặt heap bằng giới hạn thì tổng vượt giới hạn và container bị kill.",
        "Nên dùng `-XX:MaxRAMPercentage` thay vì `-Xmx` cố định: đổi giới hạn trong YAML là heap tự đổi theo, không phải build lại image. Đặt qua biến `JAVA_TOOL_OPTIONS` như Dockerfile ở Phần 2. App order-service chạy với `-m 512m` và 75%: khởi động sau 18,6 giây, `docker stats` báo `269.9MiB / 512MiB`.",
        "**CPU** cũng vậy. `--cpus=1.5` (Kubernetes là `limits.cpu: 1500m`) làm `Runtime.availableProcessors()` trả về **2** (làm tròn lên); không giới hạn thì trả về 8. Con số này quyết định:",
        "- **Số thread GC** và việc JVM chọn GC nào. Đã chạy: với `-m 512m`, JVM chọn **SerialGC** (một thread GC) vì coi máy là \"không phải server\" (dưới 2 CPU hoặc dưới khoảng 1792 MB RAM). Với `--cpus=2 -m 2g` thì chọn **G1**.",
        "- **Kích thước ForkJoinPool chung**: `parallelStream()` và `CompletableFuture.supplyAsync()` không truyền executor đều dùng pool này.",
        "- **Thread pool tự tính theo số CPU** trong code của bạn và thư viện.",
        "Muốn ép số CPU JVM nhìn thấy thì có `-XX:ActiveProcessorCount=N`. Còn pool thread của Tomcat (mặc định tối đa 200) không phụ thuộc số CPU.",
      ],
      drill: {
        choices: ["Tăng MaxRAMPercentage", "Tăng giới hạn bộ nhớ container", "Sửa code giữ object", "Đặt ActiveProcessorCount hoặc tăng CPU"],
        items: [
          { q: "Container 1 GB, heap dùng 250 MB thì GC chạy liên tục, `docker stats` mới 400 MB", a: "Tăng MaxRAMPercentage", why: "Heap đang bị giới hạn ở 25% mặc định trong khi container còn dư. Tăng lên khoảng 75%." },
          { q: "Heap 75% đã đủ lớn nhưng app vẫn ném `OutOfMemoryError: Java heap space` dần dần sau vài giờ, heap dump đầy một Map cache", a: "Sửa code giữ object", why: "Rò rỉ bộ nhớ: tăng heap chỉ làm lỗi đến muộn hơn." },
          { q: "Container bị `OOMKilled` dù heap mới dùng một nửa, app mở rất nhiều thread và dùng nhiều direct buffer", a: "Tăng giới hạn bộ nhớ container", why: "Phần ngoài heap đã vượt giới hạn. Tăng giới hạn (hoặc giảm số thread, giảm buffer), không phải tăng heap." },
          { q: "`parallelStream()` chỉ chạy trên 1 thread worker trong container `--cpus=1`", a: "Đặt ActiveProcessorCount hoặc tăng CPU", why: "Pool chung dựa vào `availableProcessors()`, ở đây là 1." },
        ],
        summary: "Heap nhỏ so với container thì tăng phần trăm. Phần ngoài heap vượt thì tăng giới hạn. Rò rỉ thì sửa code.",
      },
      takeaway: {
        lines: [
          "JVM đọc giới hạn của container; heap mặc định 25%, nên đặt `-XX:MaxRAMPercentage=75` để chừa chỗ cho phần ngoài heap.",
          "Giới hạn CPU đổi `availableProcessors()`, kéo theo loại GC, số thread GC và ForkJoinPool chung.",
        ],
      },
      quiz: {
        question: "Vì sao không đặt heap bằng đúng giới hạn bộ nhớ của container?",
        options: [
          "Vì JVM không cho phép",
          "Vì JVM còn dùng bộ nhớ ngoài heap (metaspace, thread stack, code cache, direct buffer); tổng sẽ vượt giới hạn và container bị kill",
          "Vì heap lớn làm khởi động chậm",
          "Vì Docker tính bộ nhớ gấp đôi",
        ],
        answer: 1,
        explain: "Giới hạn của container áp lên cả process, không chỉ heap. Chừa khoảng 25% cho phần ngoài heap là mức thường dùng.",
      },
      parts: [
        {
          id: "oom-kinds",
          title: "OOMKilled khác OutOfMemoryError",
          intro: [
            "Câu phỏng vấn hay gặp: Pod restart, `kubectl describe` ghi `OOMKilled`, nhưng log không có `OutOfMemoryError`. Vì sao?",
            "Hai lỗi này do hai bên khác nhau gây ra:",
            "- **`OutOfMemoryError`**: do **JVM** ném, khi heap (hoặc metaspace) chạm trần do JVM tự đặt. Có stack trace trong log, có thể bật `-XX:+HeapDumpOnOutOfMemoryError` để lấy heap dump. Process có thể còn sống.",
            "- **`OOMKilled`**: do **kernel** giết process bằng SIGKILL vì **cả process** vượt giới hạn cgroup. JVM không kịp in gì, không heap dump, mã thoát **137** (128 + 9, tín hiệu SIGKILL).",
            "Đã chạy cùng một chương trình cấp phát mỗi lần 10 MB và giữ lại, container `-m 256m --memory-swap 256m`:",
            "- **`-XX:MaxRAMPercentage=75`**: heap tối đa 185 MB, in `Exception in thread \"main\" java.lang.OutOfMemoryError: Java heap space`, `exit=1 OOMKilled=false`.",
            "- **`-Xmx1g`** (heap lớn hơn container): in tới `allocated MB=100` rồi im lặng, `exit=137 OOMKilled=true`.",
            "Lần chạy đầu không có `--memory-swap`, Docker Desktop cho thêm swap nên process cấp phát được tới 400 MB mới bị giết. Kubernetes mặc định không dùng swap, nên khi giới hạn bị vượt là kill ngay.",
          ],
          trap: {
            title: "Bẫy: -Xmx cố định lớn hơn giới hạn",
            text: "Copy `-Xmx1g` từ máy dev vào Deployment có `limits.memory: 512Mi`. JVM tưởng mình có 1 GB, không GC sớm, và bị kernel giết với mã 137 mà không để lại dấu vết nào trong log. Dùng `MaxRAMPercentage` để heap luôn đi theo giới hạn.",
          },
          quiz: {
            question: "Pod restart, trạng thái trước đó là `OOMKilled` với exit code 137, log không có stack trace. Kết luận đúng?",
            options: [
              "JVM ném OutOfMemoryError nhưng log bị mất",
              "Kernel giết process vì tổng bộ nhớ vượt giới hạn container; thường do heap đặt quá lớn so với giới hạn hoặc phần ngoài heap quá lớn",
              "Liveness probe fail",
              "Image hỏng",
            ],
            answer: 1,
            explain: "137 là SIGKILL. OutOfMemoryError do JVM ném thì có stack trace và exit code thường là 1.",
          },
        },
      ],
    },
    {
      id: "k8s-basics",
      title: "Phần 4: Kubernetes cho dev: Pod, Deployment, Service, ConfigMap, Secret",
      intro: [
        "Đã có image chạy tốt. Kubernetes nhận image đó và chạy nó trên cluster. Dev Spring cần nắm 5 đối tượng:",
        "- **Pod**: đơn vị nhỏ nhất, một hoặc vài container chạy chung, chung IP. Pod là thứ dùng xong vứt: chết thì tạo Pod mới với IP mới, không \"sửa\" Pod cũ.",
        "- **Deployment**: bạn khai báo \"muốn 3 bản của image X\", Deployment (qua ReplicaSet) giữ đúng 3 Pod, và lo **rolling update** khi đổi image.",
        "- **Service**: một tên DNS và IP ổn định trước một nhóm Pod chọn theo **label**. Pod đổi IP liên tục, client chỉ gọi `http://order-service`. Service chỉ chuyển request tới Pod **ready** (Phần 5).",
        "- **ConfigMap**: cấu hình không bí mật, đưa vào Pod dưới dạng biến môi trường hoặc file. Spring Boot đọc biến môi trường theo relaxed binding: `SPRING_PROFILES_ACTIVE` thành `spring.profiles.active`.",
        "- **Secret**: giống ConfigMap nhưng dành cho mật khẩu, token. Lưu ý phỏng vấn hay hỏi: Secret mặc định chỉ **mã hoá base64**, không phải mã hoá thật. Cần bật mã hoá etcd, giới hạn RBAC, hoặc dùng Vault, External Secrets.",
        "**Rolling update**: đổi `image` trong Deployment, Kubernetes tạo Pod mới, chờ Pod mới **ready**, rồi mới tắt Pod cũ, lần lượt từng đợt. `maxSurge` là số Pod được tạo thêm vượt `replicas`, `maxUnavailable` là số Pod được phép thiếu. Đặt `maxUnavailable: 0` thì luôn đủ số Pod phục vụ trong lúc deploy. Bản mới lỗi thì `kubectl rollout undo deployment/order-service`.",
        "**requests và limits**: `requests` là phần được đảm bảo, scheduler dựa vào nó để chọn node. `limits` là trần: vượt RAM thì bị OOMKilled, vượt CPU thì bị **bóp** (throttle), không bị giết. Nhiều đội đặt memory request bằng limit, và chỉ đặt CPU request, bỏ CPU limit để tránh bị throttle làm tăng độ trễ.",
      ],
      board: {
        title: "Một Deployment cho order-service",
        highlight: "Deployment",
        chips: ["YAML viết cho bài học, chưa apply lên cluster"],
        cards: [
          {
            title: "Deployment, Service, ConfigMap",
            diagram: {
              kind: "hub",
              inputs: [{ label: "Pod 1" }, { label: "Pod 2" }, { label: "Pod 3" }],
              center: "Service order-service",
              rulesTitle: "Service làm gì",
              rules: ["Chọn Pod theo label `app: order-service`", "Chỉ gửi request tới Pod ready", "Một tên DNS ổn định"],
            },
            code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: app
          image: registry.example.com/order-service:1.4.2
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: order-service-config
            - secretRef:
                name: order-service-secret
          resources:
            requests:
              cpu: "500m"
              memory: "768Mi"
            limits:
              memory: "768Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-service-config
data:
  SPRING_PROFILES_ACTIVE: prod`,
            notes: ["Không có cluster trong lúc soạn bài, YAML này chưa được apply.", "Probe và graceful shutdown được thêm ở Phần 5 và Phần 6."],
            takeaway: "Deployment giữ số Pod, Service giữ địa chỉ",
          },
        ],
        conclusion: "**Kết luận:** Deployment lo số Pod và rolling update, Service lo địa chỉ ổn định, ConfigMap và Secret tách cấu hình khỏi image.",
      },
      cheat: [
        { name: "Pod", one: "Đơn vị chạy nhỏ nhất, dùng xong vứt", say: "Pod là một hoặc vài container chung IP. Pod chết thì Deployment tạo Pod mới với IP mới, không ai sửa Pod cũ." },
        { name: "Deployment", one: "Giữ đúng số Pod, lo rolling update", say: "Em khai báo số bản và image, Deployment qua ReplicaSet giữ đúng số Pod và thay dần Pod cũ bằng Pod mới khi đổi image." },
        { name: "Service", one: "Tên DNS ổn định trước nhóm Pod ready", say: "Service chọn Pod theo label và chỉ chuyển request tới Pod đang ready, nên client không cần biết IP của Pod." },
        { name: "Secret", one: "Mặc định chỉ base64", say: "Secret chỉ là base64, nên cần bật mã hoá etcd, giới hạn RBAC hoặc dùng Vault, External Secrets cho dữ liệu nhạy cảm." },
        { name: "requests và limits", one: "Đảm bảo và trần", say: "Request để scheduler xếp Pod, limit là trần. Vượt RAM thì OOMKilled, vượt CPU thì bị throttle chứ không bị giết." },
      ],
      quiz: {
        question: "Rolling update với `maxSurge: 1, maxUnavailable: 0` và `replicas: 3` diễn ra thế nào?",
        options: [
          "Tắt cả 3 Pod cũ rồi tạo 3 Pod mới",
          "Tạo thêm 1 Pod mới, chờ nó ready, tắt 1 Pod cũ, lặp lại; lúc nào cũng có ít nhất 3 Pod sẵn sàng",
          "Tạo 3 Pod mới cùng lúc rồi tắt 3 Pod cũ",
          "Không deploy được vì maxUnavailable bằng 0",
        ],
        answer: 1,
        explain: "maxUnavailable 0 nghĩa là không được thiếu Pod nào, nên phải tạo thêm (maxSurge 1) và chờ Pod mới ready trước khi tắt Pod cũ.",
      },
    },
    {
      id: "health-probes",
      title: "Phần 5: Liveness, readiness, startup probe với Spring Boot Actuator",
      intro: [
        "Bài Nền tảng hệ thống đã nêu ý nghĩa ba probe. Ở đây là cách nối chúng với Spring Boot, và cái bẫy hay làm sập cả hệ thống.",
        "Spring Boot Actuator có sẵn hai health group: `/actuator/health/liveness` và `/actuator/health/readiness`. Chúng tự bật khi app phát hiện đang chạy trên Kubernetes, hoặc bật tay bằng `management.endpoint.health.probes.enabled=true` (order-service đã bật). Đã chạy trong container: cả hai trả `{\"status\":\"UP\"}`.",
        "Hai group này **mặc định không kiểm tra database hay Redis**:",
        "- **liveness** chỉ phản ánh `LivenessState` của app: `CORRECT` hay `BROKEN` (trạng thái bên trong hỏng không tự hồi phục được).",
        "- **readiness** phản ánh `ReadinessState`: `ACCEPTING_TRAFFIC` sau khi app khởi động xong, `REFUSING_TRAFFIC` khi đang tắt.",
        "- `/actuator/health` tổng thì có `db`, `redis`, nhưng đừng dùng nó làm liveness.",
        "**Startup probe** dành cho app khởi động chậm. Order-service mất 18,6 giây trong container 512 MB, app lớn có thể mất cả phút. Trong lúc startup probe chưa thành công, liveness và readiness chưa chạy, nên liveness không giết oan Pod đang khởi động. `failureThreshold x periodSeconds` là thời gian tối đa cho phép khởi động.",
      ],
      board: {
        title: "Ba probe trỏ vào đâu",
        highlight: "Ba probe",
        chips: ["YAML chưa apply lên cluster"],
        cards: [
          {
            title: "Cấu hình probe",
            diagram: {
              kind: "flow",
              steps: ["startupProbe: tối đa 24 x 5s = 120s", "livenessProbe: /actuator/health/liveness", "readinessProbe: /actuator/health/readiness"],
              ok: ["Readiness fail", "Bỏ khỏi Service, không restart"],
              bad: ["Liveness fail 3 lần", "Restart container"],
              neutral: true,
            },
            code: `startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 5
  failureThreshold: 24
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  failureThreshold: 2`,
            notes: ["Startup probe dùng lại endpoint liveness, chỉ khác thời gian chờ."],
            takeaway: "Liveness hỏi \"có cần restart không\", readiness hỏi \"có nên nhận request không\"",
          },
        ],
        conclusion: "**Kết luận:** liveness chỉ kiểm tra chính app; phụ thuộc bên ngoài không bao giờ là lý do để restart.",
      },
      trap: {
        title: "Bẫy: liveness kiểm tra database làm restart dây chuyền",
        text: "Thêm `db` vào group liveness (`management.endpoint.health.group.liveness.include=livenessState,db`). Database chậm 30 giây, liveness của **mọi** Pod cùng fail, Kubernetes restart tất cả cùng lúc. Restart không chữa được database, mà còn làm mỗi Pod mới mở lại connection pool, dồn thêm tải lên database đang yếu, và hệ thống không có Pod nào phục vụ. Ngay cả readiness cũng cần cân nhắc: database dùng chung chậm thì mọi Pod cùng bị rút khỏi Service, người dùng nhận 503 thay vì một lỗi rõ ràng từ app. Lỗi phụ thuộc nên xử lý trong app bằng timeout, circuit breaker và trả lỗi có kiểm soát.",
      },
      quiz: {
        question: "Vì sao không nên cho liveness probe kiểm tra kết nối database?",
        options: [
          "Vì liveness không gọi được HTTP",
          "Vì database lỗi làm liveness của mọi Pod cùng fail, Kubernetes restart tất cả, không chữa được database mà còn dồn thêm tải và mất hết Pod phục vụ",
          "Vì kiểm tra database tốn tiền",
          "Vì Actuator không hỗ trợ",
        ],
        answer: 1,
        explain: "Liveness chỉ nên fail khi chính app hỏng và restart giúp được. Phụ thuộc bên ngoài lỗi thì restart không giúp gì.",
      },
    },
    {
      id: "graceful-shutdown",
      senior: true,
      title: "Phần 6: Graceful shutdown và lỗi 503 khi deploy",
      intro: [
        "Rolling update đã chờ Pod mới ready. Vậy mà mỗi lần deploy vẫn có vài request lỗi. Lỗi nằm ở phía **Pod cũ bị tắt**.",
        "Khi tắt Pod, Kubernetes gửi **SIGTERM** cho container (sau khi chạy preStop hook nếu có), chờ tối đa `terminationGracePeriodSeconds` (mặc định 30 giây), hết giờ thì **SIGKILL**. `docker stop` làm y hệt, với thời gian chờ mặc định 10 giây.",
        "Spring Boot nhận SIGTERM và chạy shutdown hook. Với **`server.shutdown=graceful`**, web server ngừng nhận kết nối mới nhưng chờ các request đang chạy xong, tối đa `spring.lifecycle.timeout-per-shutdown-phase` (mặc định 30 giây). Từ Spring Boot 3.4, graceful là **mặc định**; bản cũ hơn phải tự đặt `server.shutdown=graceful`.",
        "Đã chạy order-service (Boot 3.5.16, không đặt gì thêm), gửi một request mất 8 giây, 2 giây sau gọi `docker stop -t 30`:",
      ],
      board: {
        title: "Request đang chạy có kịp xong không",
        highlight: "kịp xong",
        chips: ["Đã chạy với docker stop", "Log thật"],
        cards: [
          {
            title: "Graceful (mặc định Boot 3.4+)",
            diagram: {
              kind: "flow",
              steps: ["15:21:21 slow request started", "15:21:23 SIGTERM: Commencing graceful shutdown", "15:21:29 slow request finished"],
              ok: ["Graceful shutdown complete", "curl: HTTP 200 sau 8,29s"],
              bad: ["Kết nối mới trong lúc chờ", "Connection refused"],
            },
            code: `INFO ... SlowController : slow request started, will take 8000 ms
INFO ... GracefulShutdown : Commencing graceful shutdown. Waiting for active requests to complete
INFO ... SlowController : slow request finished
INFO ... GracefulShutdown : Graceful shutdown complete
INFO ... HikariDataSource : HikariPool-1 - Shutdown initiated...
INFO ... HikariDataSource : HikariPool-1 - Shutdown completed.`,
            notes: ["Container thoát với mã 143 (128 + 15, SIGTERM). Request mới gửi trong lúc chờ bị `Connection refused`."],
            takeaway: "Request đang chạy được làm xong rồi mới đóng connection pool",
          },
          {
            title: "Immediate hoặc hết thời gian chờ",
            diagram: {
              kind: "flow",
              steps: ["SIGTERM khi request còn chạy"],
              ok: ["server.shutdown=immediate", "curl: HTTP 000 sau 2,18s"],
              bad: ["timeout-per-shutdown-phase=3s", "Graceful shutdown aborted, HTTP 000"],
            },
            notes: [
              "Với 3s, log in `Graceful shutdown aborted with one or more requests still active`.",
              "Lần chạy đầu, container trên máy soạn bài có StopTimeout 1 giây: Docker gửi SIGKILL khi request còn chạy, mã thoát 137, curl nhận HTTP 000. Đó chính là điều xảy ra khi `terminationGracePeriodSeconds` ngắn hơn thời gian cần để xong việc.",
            ],
            takeaway: "Thời gian chờ ngắn hơn request thì request vẫn bị cắt",
          },
        ],
        conclusion: "**Kết luận:** graceful shutdown cho request đang chạy làm xong, miễn là cả timeout của Spring lẫn thời gian chờ của Kubernetes đủ dài.",
      },
      after: [
        "Quan hệ giữa các con số: `terminationGracePeriodSeconds` phải lớn hơn tổng thời gian preStop (phần sau) cộng `timeout-per-shutdown-phase`, nếu không Kubernetes sẽ SIGKILL giữa chừng.",
        "Graceful shutdown chỉ lo request **đã vào**. Nó không giải quyết request **mới** vẫn bị gửi tới Pod đang tắt. Đó là phần tiếp theo.",
      ],
      quiz: {
        question: "Boot 3.5, `server.shutdown` để mặc định, `terminationGracePeriodSeconds: 30`. Một request mất 8 giây đang chạy thì Pod nhận SIGTERM. Điều gì xảy ra?",
        options: [
          "Request bị cắt ngay",
          "Tomcat ngừng nhận kết nối mới, chờ request chạy xong rồi mới đóng context; request trả 200",
          "Kubernetes chờ request xong rồi mới gửi SIGTERM",
          "Request được chuyển sang Pod khác",
        ],
        answer: 1,
        explain: "Từ Boot 3.4 graceful là mặc định, timeout mỗi phase 30 giây đủ cho 8 giây. Đã chạy với docker stop: request trả 200 sau 8,29 giây.",
      },
      parts: [
        {
          id: "prestop-sleep",
          senior: true,
          title: "preStop sleep: vì sao vẫn 503 khi đã graceful",
          intro: [
            "Khi Pod bị xoá, có **hai việc chạy song song**, không chờ nhau:",
            "- **kubelet** trên node chạy preStop hook rồi gửi SIGTERM cho container.",
            "- **Control plane** rút Pod khỏi EndpointSlice của Service, rồi kube-proxy trên từng node, ingress controller, load balancer lần lượt cập nhật danh sách backend. Việc này mất từ vài trăm mili giây tới vài giây.",
            "Nếu SIGTERM đến trước, app ngừng nhận kết nối (đã thấy `Connection refused` ở trên) trong khi ingress vẫn còn gửi request tới Pod đó. Người dùng nhận **502 hoặc 503**, đúng vào lúc deploy.",
            "Cách sửa phổ biến: **preStop hook ngủ vài giây**. Trong lúc ngủ, app vẫn chạy bình thường và phục vụ request tới muộn, còn các thành phần mạng kịp rút Pod ra. Ngủ xong mới SIGTERM, lúc đó graceful shutdown chỉ còn xử lý nốt request đang chạy.",
            "Tổng thời gian cần: preStop + thời gian graceful + một chút dư, và phải nhỏ hơn `terminationGracePeriodSeconds`.",
          ],
          board: {
            title: "Thứ tự tắt Pod không lỗi",
            highlight: "không lỗi",
            chips: ["YAML chưa apply lên cluster"],
            cards: [
              {
                title: "preStop, rồi SIGTERM, rồi graceful",
                diagram: {
                  kind: "flow",
                  steps: ["Pod bị xoá: rút khỏi endpoints (song song)", "preStop: sleep 10s, app vẫn phục vụ", "SIGTERM: graceful, chờ request đang chạy (tối đa 30s)", "Thoát trước mốc 45s"],
                  ok: ["Đủ thời gian", "Không request nào lỗi"],
                  bad: ["Quá 45s", "SIGKILL, request bị cắt"],
                },
                code: `spec:
  terminationGracePeriodSeconds: 45
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 10"]
# application.yml
# server.shutdown: graceful            (mặc định từ Boot 3.4)
# spring.lifecycle.timeout-per-shutdown-phase: 30s`,
                notes: [
                  "`exec` sleep cần image có `sh` (alpine có). Kubernetes 1.30 trở lên có thêm action `sleep` gắn sẵn, không cần shell.",
                  "10 + 30 = 40 giây, nhỏ hơn 45.",
                ],
                takeaway: "Ngủ trước SIGTERM để mạng kịp rút Pod",
              },
            ],
            conclusion: "**Kết luận:** graceful shutdown lo request đã vào, preStop sleep lo request còn đang trên đường tới.",
          },
          trap: {
            title: "Bẫy: ENTRYPOINT dạng shell",
            text: "Viết `ENTRYPOINT java -jar app.jar` (không có ngoặc vuông) thì PID 1 là `/bin/sh`, và sh không chuyển SIGTERM cho java. App không bao giờ graceful, chờ hết grace period rồi bị SIGKILL. Dùng dạng mảng `[\"java\", ...]` hoặc `exec java ...` trong script. Log của order-service in `1 ---`, tức java đúng là PID 1.",
          },
          quiz: {
            question: "App đã bật graceful shutdown nhưng mỗi lần rolling update vẫn có vài request 503. Nguyên nhân hợp lý nhất?",
            options: [
              "Graceful shutdown không chạy trên Kubernetes",
              "SIGTERM tới trước khi ingress và kube-proxy rút Pod khỏi danh sách backend; app đã ngừng nhận kết nối mà request mới vẫn được gửi tới. Thêm preStop sleep vài giây",
              "Readiness probe quá nhanh",
              "Image quá lớn",
            ],
            answer: 1,
            explain: "Rút endpoint và gửi SIGTERM chạy song song. preStop sleep giữ app phục vụ thêm vài giây để mạng cập nhật xong.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Em đóng gói Spring Boot bằng multi-stage build: stage đầu dùng JDK và Maven, copy pom.xml và tải dependency trước rồi mới copy code, để sửa code không làm tải lại dependency. Em tách jar bằng jarmode tools thành bốn layer, dependencies, loader, snapshot và application, nên mỗi bản deploy chỉ đổi vài trăm KB. Stage chạy dùng JRE alpine và user non-root; em đã đo với order-service, image từ 1,24 GB còn 431 MB. Trong container, JVM đọc giới hạn của cgroup nhưng heap mặc định chỉ 25%, nên em đặt MaxRAMPercentage khoảng 75 và chừa phần còn lại cho metaspace, thread stack, direct buffer. Em phân biệt OutOfMemoryError do JVM ném, có stack trace, với OOMKilled mã 137 do kernel giết vì cả process vượt giới hạn. Trên Kubernetes, em dùng Deployment với maxUnavailable bằng 0, liveness trỏ vào health liveness và không bao giờ kiểm tra database, readiness trỏ vào health readiness, startup probe cho app khởi động chậm. Khi tắt Pod, em dựa vào graceful shutdown, mặc định từ Boot 3.4, cộng một preStop sleep khoảng 10 giây để ingress kịp rút Pod, và đặt terminationGracePeriodSeconds lớn hơn tổng hai khoảng đó, nên deploy không còn lỗi 503.",
  cards: [
    { q: "Container khác VM ở đâu?", a: "Container là process chung kernel máy chủ, cô lập bằng namespaces, giới hạn bằng cgroups. VM có kernel và hệ điều hành riêng, nặng hơn nhưng cô lập mạnh hơn." },
    { q: "Vì sao COPY pom.xml và tải dependency trước khi COPY src?", a: "Cache layer xét từng lệnh từ trên xuống. Code đổi chỉ làm các lệnh từ COPY src trở xuống chạy lại, bước tải dependency vẫn CACHED." },
    { q: "Bốn layer của Spring Boot layered jar?", a: "dependencies, spring-boot-loader, snapshot-dependencies, application; từ ít đổi tới hay đổi. Tách bằng `java -Djarmode=tools -jar app.jar extract --layers --launcher` (Boot 3.3+)." },
    { q: "Kích thước đo được: một stage JDK + Maven so với multi-stage JRE alpine?", a: "1,24 GB so với 431 MB trên đĩa (427 MB so với 140 MB nén)." },
    { q: "Heap mặc định của JVM trong container -m 512m?", a: "25%, tức 128 MB (MaxHeapSize 134217728). Với MaxRAMPercentage=75 là 384 MB." },
    { q: "OOMKilled khác OutOfMemoryError?", a: "OutOfMemoryError do JVM ném khi heap chạm trần, có stack trace, exit 1. OOMKilled do kernel SIGKILL khi cả process vượt giới hạn cgroup, exit 137, không log." },
    { q: "Giới hạn CPU ảnh hưởng gì tới JVM?", a: "availableProcessors() theo giới hạn (1.5 CPU thành 2), kéo theo loại GC (dưới 2 CPU hoặc ít RAM thì SerialGC), số thread GC và ForkJoinPool chung." },
    { q: "Liveness và readiness của Spring Boot mặc định kiểm tra gì?", a: "Chỉ LivenessState và ReadinessState của app, không kiểm tra database hay Redis. Đừng thêm db vào liveness: database chậm sẽ làm restart mọi Pod." },
    { q: "Startup probe để làm gì?", a: "Cho app khởi động chậm đủ thời gian; trong lúc nó chưa thành công, liveness chưa chạy nên không giết oan Pod." },
    { q: "Graceful shutdown trong Spring Boot?", a: "server.shutdown=graceful (mặc định từ Boot 3.4): ngừng nhận kết nối mới, chờ request đang chạy tối đa spring.lifecycle.timeout-per-shutdown-phase (mặc định 30s)." },
    { q: "Vì sao cần preStop sleep?", a: "Rút Pod khỏi endpoints và gửi SIGTERM chạy song song. Ngủ vài giây trước SIGTERM để ingress, kube-proxy kịp ngừng gửi request tới Pod, tránh 502/503 khi deploy." },
    { q: "terminationGracePeriodSeconds cần lớn cỡ nào?", a: "Lớn hơn preStop sleep cộng timeout graceful của Spring, nếu không Kubernetes SIGKILL giữa chừng (exit 137)." },
  ],
};
