import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs below were run on JDK 21.0.12, Spring Boot 3.5.16 (spring-webflux 6.2.19, reactor-core 3.7.19, reactor-netty 1.2.18,
// BlockHound 1.0.11) on an Apple M1 Pro laptop (8 cores, 16 GB). The load client (Java HttpClient, one virtual thread per worker)
// ran on the same laptop, so absolute requests/second are limited by the client too: compare the ratios, not the raw numbers.
export const webflux: Lesson = {
  slug: "webflux",
  crumb: "WebFlux & Reactive",
  videoDir: "/videos/webflux",
  videoVersion: "0",
  scenes: [],
  title: "Spring WebFlux và lập trình reactive",
  subtitle:
    "Vì sao thread-per-request tốn thread khi chờ I/O, event loop của Netty, Mono và Flux, lazy, map và flatMap, backpressure, controller reactive, WebClient và R2DBC, bẫy gọi blocking trong event loop, publishOn và subscribeOn, xử lý lỗi, Reactor Context, và khi nào chọn virtual thread thay cho WebFlux.",
  openingQuiz: {
    question: "Một endpoint WebFlux gọi `Thread.sleep(100)` ngay trong controller. Máy có 8 core. Với 200 request đồng thời, throughput gần nhất với số nào?",
    options: ["Khoảng 2000 request/giây, vì WebFlux non-blocking", "Khoảng 80 request/giây", "Khoảng 800 request/giây", "Không chạy được, Spring báo lỗi khi khởi động"],
    answer: 1,
    explain:
      "Netty chỉ có 8 thread event loop (bằng số core). Mỗi thread bị sleep 100 ms nên chỉ phục vụ được 10 request mỗi giây: 8 × 10 = 80. Đã đo trên laptop 8 core: 75 request/giây (Phần 3).",
  },
  roadmap: [
    "Chặng 1: vấn đề của thread-per-request khi chờ I/O, event loop là gì; Mono, Flux, lazy, map và flatMap, backpressure.",
    "Chặng 2: WebFlux trong Spring: controller, WebClient, R2DBC; bẫy gọi blocking trong event loop, BlockHound, publishOn và subscribeOn.",
    "Chặng 3: xử lý lỗi, retry, timeout; ThreadLocal và MDC không đi theo, Reactor Context; so sánh với virtual thread để chọn đúng công cụ.",
  ],
  sections: [
    {
      id: "problem",
      title: "Phần 1: Thread-per-request và event loop",
      intro: [
        "Ta đã quen Spring MVC: Tomcat có một pool thread (mặc định tối đa 200), mỗi request được giao cho **một thread từ đầu tới cuối**. Mô hình này gọi là **thread-per-request**.",
        "Vấn đề nằm ở chỗ **chờ**. Một request điển hình gọi database 20 ms, gọi service khác 80 ms, còn tính toán thật chỉ vài ms. Trong 100 ms chờ đó thread **bị block**: không làm gì nhưng vẫn bị giữ, vẫn chiếm bộ nhớ stack (mặc định dành sẵn cỡ 1 MB cho mỗi platform thread trên Linux 64-bit).",
        "Hệ quả: 200 thread, mỗi request chờ 100 ms, thì trần là khoảng 200 / 0,1 = **2000 request/giây**. Request thứ 201 phải xếp hàng dù CPU gần như rảnh. Muốn nhiều hơn thì thêm thread, nhưng platform thread đắt (bộ nhớ, chuyển ngữ cảnh của hệ điều hành).",
        "**Event loop** đi hướng ngược lại: chỉ vài thread (Netty mặc định bằng số core, tối thiểu 4), và **không thread nào được phép chờ**. Khi cần gọi I/O, code đăng ký \"khi có dữ liệu thì gọi tôi\" rồi trả thread về ngay. Hệ điều hành báo socket nào có dữ liệu (epoll, kqueue), event loop lấy sự kiện đó và chạy tiếp phần code tương ứng.",
        "Hình dung một quán cà phê: thread-per-request là mỗi khách một nhân viên đứng chờ máy pha xong. Event loop là vài nhân viên nhận order, bấm máy rồi đi nhận order khác, máy kêu thì quay lại mang ra. Ít người mà phục vụ được nhiều khách, **với điều kiện không ai đứng nhìn máy pha**.",
        "Đó cũng là cái giá: mọi thư viện trên đường đi (HTTP client, driver database) phải là non-blocking. Một chỗ block là chặn cả một event loop, kéo theo mọi request đang dùng loop đó.",
      ],
      predict: {
        question: "App WebFlux trên máy 8 core khởi động. Theo bạn có bao nhiêu thread `reactor-http-nio-*` (thread event loop của Netty)?",
        options: ["200, giống Tomcat", "8", "1", "Mỗi request một thread"],
        answer: 1,
        explain: "Đã đếm bằng `jcmd <pid> Thread.print` trên app đang chạy, ngay sau một đợt tải 1000 kết nối đồng thời: đúng 8 thread `reactor-http-nio-*`. Số event loop mặc định bằng số core (tối thiểu 4), không tăng theo số request.",
      },
      board: {
        title: "Hai cách phục vụ 1000 request đang chờ I/O",
        highlight: "đang chờ I/O",
        chips: ["Thread-per-request", "Event loop", "Netty", "epoll / kqueue"],
        cards: [
          {
            title: "Thread-per-request (Spring MVC + Tomcat)",
            diagram: {
              kind: "flow",
              steps: ["Request tới", "Lấy 1 thread từ pool 200", "Gọi DB: thread đứng chờ", "Trả response, trả thread"],
              ok: ["Còn thread rảnh", "Phục vụ ngay"],
              bad: ["Hết 200 thread", "Request xếp hàng dù CPU rảnh"],
            },
            notes: ["Code tuần tự, dễ đọc, dễ debug. Giới hạn là số thread, không phải CPU."],
            takeaway: "Thread bị giữ cả trong lúc chỉ ngồi chờ",
          },
          {
            title: "Event loop (WebFlux + Netty)",
            diagram: {
              kind: "flow",
              steps: ["Request tới event loop", "Gửi lệnh I/O, đăng ký callback", "Thread quay đi xử lý request khác", "Có dữ liệu: chạy tiếp phần còn lại"],
              ok: ["Mọi thư viện non-blocking", "Vài thread phục vụ hàng nghìn kết nối"],
              bad: ["Có một chỗ gọi blocking", "Cả event loop đứng, mọi request trên nó chờ theo"],
            },
            notes: ["Số thread cố định bằng số core. Code phải viết theo kiểu pipeline (Mono, Flux) thay vì tuần tự."],
            takeaway: "Ít thread, nhưng tuyệt đối không được chặn",
          },
        ],
        conclusion: "**Kết luận:** WebFlux không làm một request nhanh hơn. Nó giúp phục vụ **nhiều request đang chờ** với ít thread hơn, đổi lại code phức tạp hơn và cấm blocking.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Request chủ yếu chờ I/O → thread-per-request giữ thread trong lúc chờ → hết thread trước khi hết CPU.",
          "Event loop không chờ, chỉ phản ứng khi có sự kiện → vài thread đủ cho hàng nghìn kết nối, miễn là không ai block.",
        ],
      },
      trap: {
        title: "Nghĩ WebFlux làm request nhanh hơn",
        text: "Một request gọi DB mất 100 ms thì trên WebFlux vẫn mất khoảng 100 ms. Lợi ích là **khả năng chịu nhiều request đồng thời** với ít tài nguyên, không phải độ trễ của từng request. Nếu tải thấp và code chủ yếu là CRUD với JDBC, chuyển sang WebFlux chỉ thêm độ phức tạp.",
      },
      quiz: {
        question: "Điểm nghẽn chính của mô hình thread-per-request khi phần lớn thời gian của request là chờ I/O là gì?",
        options: [
          "CPU không đủ nhanh",
          "Thread bị giữ trong lúc chờ, nên số thread trong pool trở thành trần của số request đồng thời",
          "Tomcat không hỗ trợ HTTP/2",
          "Database không chịu được nhiều kết nối",
        ],
        answer: 1,
        explain: "Mỗi request giữ một thread suốt thời gian chờ. Pool 200 thread, chờ 100 ms thì trần khoảng 2000 request/giây dù CPU gần như rảnh.",
      },
    },
    {
      id: "reactor",
      title: "Phần 2: Reactor: Mono, Flux và lazy",
      intro: [
        "Ta đã biết event loop cần code \"đăng ký việc cần làm khi có dữ liệu\". Viết bằng callback lồng nhau thì rất khó đọc, nên Spring dùng **Project Reactor**: mô tả cả chuỗi xử lý như một pipeline.",
        "Hai kiểu chính, đều là một **Publisher** (nguồn phát dữ liệu theo chuẩn Reactive Streams):",
        "- **`Mono<T>`**: phát 0 hoặc 1 phần tử rồi kết thúc (hoặc lỗi). Tương đương \"một kết quả trong tương lai\", ví dụ tìm một user theo id.",
        "- **`Flux<T>`**: phát 0 tới N phần tử (có thể vô hạn) rồi kết thúc (hoặc lỗi). Ví dụ danh sách đơn hàng, hay một luồng sự kiện giá cổ phiếu.",
        "Một stream kết thúc bằng đúng một trong hai tín hiệu: `onComplete` hoặc `onError`. Sau khi lỗi, stream **dừng hẳn**, phần tử sau không được phát nữa.",
        "Điều quan trọng nhất: Reactor **lazy**. Viết `Mono.fromCallable(...).map(...)` chỉ là **lắp ống**, chưa có nước chảy. Chỉ khi có ai **subscribe** thì dữ liệu mới bắt đầu chạy. Trong WebFlux, bạn trả `Mono`/`Flux` từ controller và **framework subscribe giúp bạn**.",
        "Ngoại lệ hay bị hỏi: `Mono.just(x)` nhận một giá trị **đã tính xong**, nên biểu thức `x` chạy ngay khi dòng code chạy, không chờ subscribe. Muốn trì hoãn thì dùng `Mono.fromCallable(() -> ...)` hoặc `Mono.defer(() -> ...)`.",
      ],
      predict: {
        question: "Chạy đoạn code trong thẻ dưới. Dòng \"callable chay\" in ra trước hay sau dòng \"da tao Mono, chua subscribe\"?",
        options: ["Trước, vì Mono được tạo trước", "Sau, vì callable chỉ chạy khi subscribe", "Không bao giờ in", "Tuỳ JVM"],
        answer: 1,
        explain: "Đã chạy: dòng \"da tao Mono, chua subscribe\" in trước, rồi mới tới \"callable chay\" và \"nhan hi\" khi gọi `subscribe`. Còn với `Mono.just(expensive())` thì `expensive()` chạy ngay lúc tạo.",
      },
      board: {
        title: "Không subscribe thì không có gì chạy",
        highlight: "không có gì chạy",
        chips: ["Mono", "Flux", "subscribe", "lazy"],
        cards: [
          {
            title: "fromCallable: lazy",
            diagram: {
              kind: "pipe",
              from: "Mono.fromCallable(...)",
              via: "subscribe()",
              to: "callable chạy, nhận giá trị",
              skipped: ["Chỉ tạo Mono, không subscribe: không chạy gì"],
              skippedLabel: "Không xảy ra",
            },
            code: `Mono<String> m = Mono.fromCallable(() -> { log("callable chay"); return "hi"; });
log("da tao Mono, chua subscribe");
m.subscribe(v -> log("nhan " + v));

// Đã chạy, output:
// [main] da tao Mono, chua subscribe
// [main] callable chay
// [main] nhan hi`,
            takeaway: "Lắp ống trước, subscribe mới mở van",
          },
          {
            title: "Mono.just: giá trị tính ngay",
            diagram: {
              kind: "pipe",
              from: "Mono.just(expensive())",
              via: "expensive() chạy ngay",
              to: "Mono chứa giá trị sẵn",
              skipped: ["Chờ tới lúc subscribe mới chạy"],
              skippedLabel: "Không lazy",
            },
            code: `Mono<String> j = Mono.just(expensive());
log("da tao Mono.just, chua subscribe");

// Đã chạy, output:
// [main] expensive() chay ngay khi tao Mono.just
// [main] da tao Mono.just, chua subscribe`,
            takeaway: "Việc tốn kém thì bọc trong fromCallable hoặc defer",
          },
        ],
        conclusion: "**Kết luận:** mọi operator chỉ mô tả việc cần làm. Trong WebFlux, framework subscribe khi trả response. Tự tạo Mono mà không trả về, cũng không subscribe, thì code đó **không bao giờ chạy**.",
      },
      takeaway: {
        lines: [
          "Mono là 0 hoặc 1 phần tử, Flux là 0 tới N phần tử. Kết thúc bằng onComplete hoặc onError.",
          "Lazy: không subscribe thì không chạy. `Mono.just(x)` tính `x` ngay, `fromCallable` và `defer` thì chờ.",
        ],
      },
      trap: {
        title: "Gọi hàm trả Mono rồi bỏ quên kết quả",
        text: "Trong một handler WebFlux viết `auditService.save(event);` (hàm trả `Mono<Void>`) rồi `return Mono.just(\"ok\")`. Không ai subscribe Mono của `save`, nên bản ghi audit không bao giờ được ghi và cũng không có lỗi nào. Phải nối vào chuỗi: `return auditService.save(event).thenReturn(\"ok\");`.",
      },
      quiz: {
        question: "Đoạn `userRepo.findById(id).map(User::name);` trong WebFlux, kết quả không được trả về hay subscribe. Điều gì xảy ra?",
        options: ["Query vẫn chạy ở nền", "Không có query nào chạy, vì chưa ai subscribe", "Spring báo lỗi khi khởi động", "Query chạy và kết quả bị cache"],
        answer: 1,
        explain: "Reactor lazy: pipeline chỉ chạy khi được subscribe. Không trả về controller và không tự subscribe thì không có gì xảy ra.",
      },
      cheat: [
        { name: "map", one: "Biến đổi đồng bộ 1 phần tử thành 1 giá trị", say: "map dùng khi hàm biến đổi trả giá trị thường, chạy ngay, không gọi I/O." },
        { name: "flatMap", one: "Mỗi phần tử thành một Publisher, gộp kết quả, chạy song song, không giữ thứ tự", say: "flatMap dùng khi bước tiếp theo là một lời gọi bất đồng bộ trả Mono hay Flux, ví dụ gọi WebClient cho từng id." },
        { name: "concatMap", one: "Giống flatMap nhưng chạy lần lượt, giữ thứ tự", say: "concatMap khi thứ tự quan trọng hơn tốc độ." },
        { name: "filter / take / distinct", one: "Lọc, lấy n phần tử đầu, bỏ trùng", say: "Các operator lọc giống Stream API, nhưng take còn huỷ nguồn khi đủ phần tử." },
        { name: "zip / zipWith", one: "Chờ nhiều nguồn rồi ghép kết quả", say: "Gọi song song hai service rồi ghép, giống thenCombine của CompletableFuture." },
        { name: "switchIfEmpty / defaultIfEmpty", one: "Xử lý khi nguồn rỗng", say: "Mono rỗng là chuyện thường (không tìm thấy), dùng switchIfEmpty để trả 404 hoặc giá trị mặc định." },
        { name: "doOnNext / doOnError", one: "Tác dụng phụ để log, không đổi dữ liệu", say: "doOn dùng để quan sát, không dùng để gọi I/O." },
        { name: "then / thenReturn", one: "Chờ nguồn xong, bỏ giá trị, trả cái khác", say: "Nối một việc kiểu Mono<Void> như lưu audit vào chuỗi để nó thật sự chạy." },
      ],
      parts: [
        {
          id: "map-flatmap",
          title: "map, flatMap và concatMap",
          intro: [
            "Câu hỏi kinh điển: `map` khác `flatMap` thế nào? Quy tắc ngắn: hàm biến đổi trả **giá trị thường** thì `map`; trả **Mono hoặc Flux** (một việc bất đồng bộ) thì `flatMap`.",
            "Dùng nhầm `map` với hàm trả Mono sẽ ra `Flux<Mono<T>>`: lời gọi bên trong không bao giờ được subscribe, nên nó không chạy.",
            "Điểm hay bị bỏ qua: `flatMap` subscribe **nhiều Publisher con cùng lúc** (mặc định tới 256), nên kết quả về theo thứ tự **xong trước về trước**, không theo thứ tự đầu vào. `concatMap` chờ từng cái xong mới tới cái sau: giữ thứ tự nhưng chạy tuần tự. `flatMap(fn, n)` giới hạn số việc chạy song song là n.",
            "Đã chạy với `Flux.just(1, 2, 3)`, phần tử i trễ `400 - i × 100` ms (phần tử 1 chậm nhất): `map` ra `[10, 20, 30]`, `flatMap` ra `[3, 2, 1]`, `concatMap` ra `[1, 2, 3]`.",
          ],
          compare: [
            way(
              "flatMap",
              `Flux.range(1, 10)
    .flatMap(i -> Mono.delay(Duration.ofMillis(100)).thenReturn(i))
    .blockLast();`,
              [
                ask("10 việc, mỗi việc 100 ms: mất bao lâu?", ok("Đã đo: **112 ms**. Cả 10 việc chạy cùng lúc.")),
                ask("Thứ tự kết quả có giữ không?", bad("Không. Đã chạy với độ trễ khác nhau: `[3, 2, 1]`.")),
                ask("Muốn tối đa 2 việc cùng lúc (tránh dội tải vào service khác)", ok("`flatMap(fn, 2)`. Đã đo: **518 ms** (5 đợt × 100 ms).")),
              ],
              "Nhanh, song song, không giữ thứ tự. Nhớ giới hạn concurrency khi gọi service ngoài.",
            ),
            way(
              "concatMap",
              `Flux.range(1, 10)
    .concatMap(i -> Mono.delay(Duration.ofMillis(100)).thenReturn(i))
    .blockLast();`,
              [
                ask("10 việc, mỗi việc 100 ms: mất bao lâu?", bad("Đã đo: **1026 ms**. Chạy lần lượt từng việc.")),
                ask("Thứ tự kết quả có giữ không?", ok("Có. Đã chạy: `[1, 2, 3]`.")),
              ],
              "Giữ thứ tự, đổi lại chạy tuần tự. Dùng khi thứ tự là yêu cầu nghiệp vụ.",
            ),
          ],
          takeaway: {
            lines: [
              "Hàm trả giá trị thường: `map`. Hàm trả Mono/Flux: `flatMap`.",
              "`flatMap` song song và không giữ thứ tự; `concatMap` giữ thứ tự nhưng tuần tự; `flatMap(fn, n)` giới hạn song song.",
            ],
          },
          quiz: {
            question: "Cần gọi `webClient` lấy chi tiết cho 100 id, thứ tự kết quả không quan trọng, nhưng service kia chỉ chịu 10 request cùng lúc. Chọn gì?",
            options: ["`map(id -> client.get(id))`", "`flatMap(id -> client.get(id), 10)`", "`concatMap(id -> client.get(id))`", "`flatMap(id -> client.get(id))` không tham số"],
            answer: 1,
            explain: "Lời gọi trả Mono nên cần flatMap. Tham số concurrency 10 giới hạn số request đang bay. concatMap đúng nhưng chậm gấp nhiều lần vì chỉ 1 request mỗi lúc; map thì lời gọi không bao giờ chạy.",
          },
        },
        {
          id: "backpressure",
          title: "Backpressure",
          intro: [
            "Nguồn phát nhanh hơn bên nhận xử lý thì sao? Với `Iterator` hay `Stream`, bên nhận kéo từng phần tử nên không có chuyện này. Với push (nguồn đẩy dữ liệu tới), bên nhận có thể bị ngập.",
            "**Backpressure** là cơ chế để bên nhận nói \"tôi chỉ nhận thêm n phần tử\": subscriber gọi `request(n)`, publisher không được phát quá n phần tử cho tới khi có `request` tiếp. Đây là phần cốt lõi của chuẩn Reactive Streams, có trong `java.util.concurrent.Flow` từ Java 9.",
            "Đã chạy `Flux.range(1, 1000).limitRate(100).take(250)`: nguồn nhận `request(100)` rồi các lần `request(75)`. `limitRate` xin theo lô 100, và khi đã tiêu 75% thì xin thêm 75. Còn `Flux.range(1, 5).take(2)` thì nguồn chỉ nhận `request(2)`, phát 1 và 2, rồi nhận `cancel()`.",
            "Khi nguồn **không chậm lại được** (sự kiện từ bên ngoài, click, giá chứng khoán), phải chọn chiến lược:",
            "- **`onBackpressureBuffer(n)`**: giữ tạm trong buffer, đầy thì báo lỗi hoặc bỏ theo cấu hình.",
            "- **`onBackpressureDrop()`**: bỏ phần tử bên nhận chưa kịp xin.",
            "- **`onBackpressureLatest()`**: chỉ giữ phần tử mới nhất, hợp dữ liệu kiểu giá hiện tại.",
            "Qua HTTP, backpressure giữa hai máy dựa vào luồng điều khiển của TCP (bên nhận đọc chậm thì bên gửi bị chặn ghi). Nó không truyền `request(n)` qua mạng như RSocket làm được.",
          ],
          takeaway: {
            lines: [
              "Backpressure: subscriber gọi `request(n)`, publisher không phát quá n. Đó là cách bên chậm không bị ngập.",
              "Nguồn không chậm lại được thì chọn buffer, drop hoặc latest.",
            ],
          },
          quiz: {
            question: "Một Flux giá cổ phiếu phát rất nhanh, client chỉ cần giá mới nhất và hiển thị chậm hơn tốc độ phát. Operator phù hợp nhất?",
            options: ["`onBackpressureBuffer()` không giới hạn", "`onBackpressureLatest()`", "`concatMap`", "Không cần làm gì, Reactor tự xử lý"],
            answer: 1,
            explain: "Chỉ giá mới nhất có giá trị, nên giữ phần tử mới nhất và bỏ những cái cũ. Buffer không giới hạn sẽ tốn bộ nhớ dần và hiển thị giá đã cũ.",
          },
        },
      ],
    },
    {
      id: "webflux-spring",
      title: "Phần 3: WebFlux trong Spring",
      intro: [
        "Ta đã có Mono và Flux. Trong Spring, thêm `spring-boot-starter-webflux` là có server **Netty** và cách viết controller gần như quen thuộc, chỉ khác kiểu trả về.",
        "- **Controller**: vẫn `@RestController`, `@GetMapping`, nhưng trả `Mono<Order>` hoặc `Flux<Order>`. Spring subscribe và ghi response khi dữ liệu tới. Trả `Flux` với `produces = MediaType.TEXT_EVENT_STREAM_VALUE` là có **SSE** (Server-Sent Events): server đẩy từng phần tử xuống client khi nó sẵn sàng.",
        "- **WebClient**: HTTP client non-blocking, trả Mono/Flux. Đây là thứ thay `RestTemplate` trong app reactive. `RestClient` (Spring 6.1) thì vẫn là client blocking, dành cho MVC.",
        "- **R2DBC**: chuẩn driver database non-blocking (`spring-boot-starter-data-r2dbc`), repository trả Mono/Flux. JDBC, JPA và Hibernate thường đều **blocking**, không dùng trực tiếp trong event loop. R2DBC không có lazy loading hay quan hệ entity như JPA, nên mô hình dữ liệu phải đơn giản hơn.",
        "- **Toàn tuyến phải non-blocking**: chỉ cần một bước block (JDBC, `RestTemplate`, đọc file, `Thread.sleep`, `.block()`) là lợi ích mất, và còn tệ hơn MVC (Phần 3, phần dưới).",
        "Lưu ý cấu hình: nếu classpath có **cả** `spring-boot-starter-web` và `spring-boot-starter-webflux`, Spring Boot chạy **Spring MVC**. Đã chạy: app có cả hai starter khởi động bằng Tomcat. Muốn ép reactive thì đặt `spring.main.web-application-type=reactive`.",
      ],
      board: {
        title: "Một endpoint reactive từ đầu tới cuối",
        highlight: "từ đầu tới cuối",
        chips: ["@RestController", "WebClient", "R2DBC", "SSE"],
        cards: [
          {
            title: "Controller ghép DB và service khác",
            diagram: {
              kind: "flow",
              steps: ["Netty nhận request", "R2DBC: tìm order (Mono)", "WebClient: lấy thông tin giao hàng (Mono)", "zip, Spring ghi response"],
              ok: ["Mọi bước non-blocking", "Event loop không chờ ở bước nào"],
              bad: ["Một bước dùng JDBC hay RestTemplate", "Event loop bị chặn suốt thời gian gọi"],
            },
            code: `@GetMapping("/orders/{id}")
Mono<OrderView> get(@PathVariable long id) {
    Mono<Order> order = orderRepo.findById(id)               // R2DBC
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));
    Mono<Shipping> ship = webClient.get().uri("/shipping/{id}", id)
        .retrieve().bodyToMono(Shipping.class);              // WebClient
    return Mono.zip(order, ship, OrderView::new);            // gọi song song, ghép lại
}

@GetMapping(value = "/prices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<Price> prices() { return priceService.stream(); }      // SSE`,
            takeaway: "Trả Mono/Flux, để Spring subscribe",
          },
        ],
        conclusion: "**Kết luận:** WebFlux đòi cả hệ sinh thái reactive: Netty, WebClient, R2DBC (hoặc driver reactive của MongoDB, Redis, Cassandra). Thiếu một mắt xích non-blocking là phải cách ly nó ra (phần dưới).",
      },
      takeaway: {
        lines: [
          "Controller trả Mono/Flux; WebClient thay RestTemplate; R2DBC thay JDBC/JPA.",
          "Có cả starter web và webflux thì Spring Boot chọn MVC.",
        ],
      },
      quiz: {
        question: "App WebFlux cần đọc dữ liệu từ PostgreSQL mà không chặn event loop. Lựa chọn đúng?",
        options: ["Spring Data JPA với `@Transactional`", "Spring Data R2DBC với driver r2dbc-postgresql", "JdbcTemplate", "RestTemplate gọi tới database"],
        answer: 1,
        explain: "R2DBC là chuẩn driver non-blocking, repository trả Mono/Flux. JPA và JdbcTemplate dùng JDBC, vốn blocking.",
      },
      parts: [
        {
          id: "blocking-trap",
          title: "Bẫy lớn nhất: gọi blocking trong event loop",
          intro: [
            "Ta biết event loop cấm chờ. Vậy lỡ có một chỗ chờ thì thiệt hại tới đâu? Đã đo trên cùng một app WebFlux, ba endpoint đều \"chờ\" 100 ms, 200 client gửi đồng thời, tổng 4000 request:",
            "- **Non-blocking** (`Mono.delay(100 ms)`): **1146 tới 1593 request/giây**, p50 khoảng 107 tới 143 ms.",
            "- **Blocking trong event loop** (`Thread.sleep(100)` ngay trong controller): **75 request/giây**, p50 khoảng 2,5 giây, request chậm nhất 5,4 tới 16,9 giây.",
            "- **Blocking nhưng đẩy sang `boundedElastic`**: khoảng **720 request/giây**, p50 khoảng 220 ms.",
            "Vì sao 75? Netty có 8 thread event loop, mỗi thread ngủ 100 ms mỗi request nên trần là 8 × 10 = 80. Tệ hơn nữa: một endpoint `/ping` trả ngay cũng có lần phải chờ **9 tới 16 giây**, vì kết nối của nó rơi vào một event loop đang bận ngủ. Một endpoint viết sai kéo chậm cả những endpoint viết đúng.",
            "Vì sao `boundedElastic` chỉ khoảng 720? Scheduler này có tối đa **10 × số core** thread (ở đây 80), 80 × 10 = 800 là trần. Đó là pool thread dành riêng cho việc blocking, để event loop luôn rảnh. Nó là lối thoát, không phải cách để mọi thứ đều blocking.",
            "Các kiểu blocking hay lọt vào: JDBC hoặc JPA, `RestTemplate`, `Thread.sleep`, đọc file bằng `java.io`, `synchronized` giữ lâu, và **`.block()`**. Reactor tự chặn `.block()` trên thread non-blocking: đã chạy, ném `IllegalStateException: block()/blockFirst()/blockLast() are blocking, which is not supported in thread parallel-1`.",
            "Để bắt các chỗ còn lại, dùng **BlockHound** (thư viện của Reactor): nó cài agent theo dõi các lời gọi blocking của JDK, và báo lỗi khi chúng chạy trên thread non-blocking. Thường bật trong test. Trên JDK 13+ cần cờ `-XX:+AllowRedefinitionToAddDeleteMethods`. Đã chạy: gọi `/blocking` trả `500` với `BlockingOperationError: Blocking call! java.lang.Thread.sleep0`, còn `/offload` và `/nonblocking` vẫn `200`.",
          ],
          predict: {
            question: "Endpoint A gọi `Thread.sleep(100)` trong controller WebFlux đang bị tải nặng. Endpoint B `/ping` chỉ trả `\"pong\"`. B có bị ảnh hưởng không?",
            options: ["Không, B không gọi sleep", "Có thể bị chậm nhiều giây, vì B dùng chung event loop với A", "B bị lỗi 500", "B nhanh hơn bình thường"],
            answer: 1,
            explain: "Đã đo: trong lúc `/blocking` chịu tải, `/ping` có lần chờ tới 9 đến 16 giây. Mỗi kết nối gắn với một event loop; event loop bận ngủ thì mọi kết nối của nó đứng.",
          },
          compare: [
            way(
              "Gọi thẳng trong event loop",
              `@GetMapping("/blocking")
Mono<String> blocking() throws InterruptedException {
    Thread.sleep(100);                       // giả lập JDBC, RestTemplate...
    return Mono.just("ok " + Thread.currentThread().getName());
}
// Đã chạy: ok reactor-http-nio-3   (chạy trên event loop)`,
              [
                ask("200 client đồng thời, 4000 request", bad("Đã đo: **75 request/giây**, p50 khoảng 2,5 giây, chậm nhất tới 16,9 giây.")),
                ask("Endpoint khác (`/ping`) trong lúc đó", bad("Đã đo: có lần chờ **9 tới 16 giây** dù chỉ trả chữ \"pong\".")),
                ask("Bật BlockHound", bad("Đã chạy: `500`, log `BlockingOperationError: Blocking call! java.lang.Thread.sleep0`.")),
              ],
              "Một chỗ block chặn cả event loop. Trần là số event loop × số request mỗi thread phục vụ được mỗi giây.",
            ),
            way(
              "Đẩy sang boundedElastic",
              `@GetMapping("/offload")
Mono<String> offload() {
    return Mono.fromCallable(() -> { Thread.sleep(100); return "ok"; })
        .subscribeOn(Schedulers.boundedElastic());
}`,
              [
                ask("200 client đồng thời, 4000 request", ok("Đã đo: khoảng **720 request/giây**, p50 khoảng 220 ms. Trần là 80 thread × 10 = 800.")),
                ask("Endpoint khác (`/ping`) trong lúc đó", ok("Đã đo: median 1 tới 7 ms. Event loop vẫn rảnh.")),
                ask("Bật BlockHound", ok("Đã chạy: `200`. boundedElastic là thread được phép block.")),
              ],
              "Cách ly đúng chỗ blocking, event loop sống. Nhưng chính boundedElastic lại thành một pool thread có trần.",
            ),
          ],
          after: [
            "Nếu phần lớn code phải đẩy sang `boundedElastic` (ví dụ vẫn dùng JPA), app thực chất chạy kiểu thread-per-request với thêm một tầng phức tạp. Lúc đó Spring MVC, hoặc MVC với virtual thread (Phần 6), là lựa chọn hợp lý hơn.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Gọi blocking trong event loop → một trong vài event loop đứng → mọi kết nối trên nó đứng theo → throughput rơi về số event loop × (1 giây / thời gian block).",
              "Không tránh được blocking: bọc trong `fromCallable` + `subscribeOn(boundedElastic())`, và bật BlockHound trong test.",
            ],
          },
          quiz: {
            question: "Trong một handler WebFlux bạn bắt buộc phải gọi một SDK cũ blocking. Cách xử lý đúng?",
            options: [
              "Gọi thẳng, vì WebFlux tự xử lý",
              "Bọc bằng `Mono.fromCallable(...)` rồi `.subscribeOn(Schedulers.boundedElastic())`",
              "Gọi `.block()` để chờ kết quả cho chắc",
              "Bọc bằng `Mono.just(sdk.call())`",
            ],
            answer: 1,
            explain: "fromCallable trì hoãn lời gọi tới lúc subscribe, subscribeOn(boundedElastic) cho nó chạy trên thread được phép block. `Mono.just(sdk.call())` vẫn gọi ngay trên event loop; `.block()` trên event loop bị Reactor từ chối.",
          },
        },
        {
          id: "schedulers",
          title: "publishOn, subscribeOn và các Scheduler",
          intro: [
            "Phần trên dùng `subscribeOn` để đẩy việc sang thread khác. Reactor có hai operator đổi thread, và phỏng vấn hay hỏi khác nhau thế nào:",
            "- **`publishOn(s)`**: các operator **phía sau** nó chạy trên scheduler `s`. Đặt ở đâu thì đổi thread từ chỗ đó trở xuống.",
            "- **`subscribeOn(s)`**: đổi thread ở **lúc subscribe**, tức nguồn phát chạy trên `s`. Đặt ở đâu trong chuỗi cũng có tác dụng như nhau; nếu có nhiều `subscribeOn` thì cái **gần nguồn nhất** thắng.",
            "Các scheduler hay dùng:",
            "- **`Schedulers.parallel()`**: số thread bằng số core, cho việc CPU ngắn. Đây là thread non-blocking: cấm block.",
            "- **`Schedulers.boundedElastic()`**: tối đa 10 × số core thread, dành cho việc blocking không tránh được.",
            "- **`Schedulers.single()`**: một thread dùng chung.",
            "Mặc định không có operator nào đổi thread: code chạy trên thread đã phát tín hiệu (trong WebFlux thường là event loop của Netty, hoặc thread của driver).",
          ],
          board: {
            title: "Thread nào chạy bước nào",
            highlight: "Thread nào",
            chips: ["publishOn", "subscribeOn", "parallel", "boundedElastic"],
            cards: [
              {
                title: "publishOn đổi thread từ chỗ nó trở xuống",
                diagram: {
                  kind: "flow",
                  steps: ["subscribeOn(boundedElastic): nguồn chạy trên boundedElastic", "doOnNext: \"truoc publishOn\"", "publishOn(parallel)", "doOnNext: \"sau publishOn\""],
                  ok: ["Trước publishOn", "boundedElastic-1"],
                  bad: ["Sau publishOn", "parallel-5"],
                  neutral: true,
                },
                code: `Flux.just(1)
    .doOnNext(i -> log("truoc publishOn"))
    .publishOn(Schedulers.parallel())
    .doOnNext(i -> log("sau publishOn"))
    .subscribeOn(Schedulers.boundedElastic())
    .blockLast();
// Đã chạy:
// [boundedElastic-1] truoc publishOn
// [parallel-5] sau publishOn`,
                takeaway: "subscribeOn ở cuối chuỗi vẫn đổi thread của nguồn",
              },
              {
                title: "Hai subscribeOn: cái gần nguồn thắng",
                diagram: {
                  kind: "pipe",
                  from: "subscribeOn(boundedElastic) gần nguồn",
                  via: "subscribeOn(parallel) phía sau",
                  to: "A và B đều chạy trên boundedElastic-1",
                  skipped: ["parallel"],
                  skippedLabel: "Không có tác dụng",
                },
                code: `Flux.just(1)
    .doOnNext(i -> log("A"))
    .subscribeOn(Schedulers.boundedElastic())
    .doOnNext(i -> log("B"))
    .subscribeOn(Schedulers.parallel())
    .blockLast();
// Đã chạy:
// [boundedElastic-1] A
// [boundedElastic-1] B`,
                takeaway: "Chỉ một subscribeOn có tác dụng",
              },
            ],
            conclusion: "**Kết luận:** muốn chạy nguồn blocking ở chỗ khác thì `subscribeOn`. Muốn phần xử lý phía sau chuyển sang thread khác thì `publishOn`.",
          },
          takeaway: {
            lines: [
              "`publishOn` ảnh hưởng các bước phía sau; `subscribeOn` ảnh hưởng nguồn, vị trí không quan trọng, cái gần nguồn nhất thắng.",
              "parallel cho CPU ngắn và cấm block; boundedElastic cho blocking.",
            ],
          },
          quiz: {
            question: "Chuỗi `Mono.fromCallable(jdbcCall).map(f).subscribeOn(boundedElastic())`. `jdbcCall` chạy trên thread nào?",
            options: ["Event loop của Netty", "Một thread của boundedElastic", "Thread main", "Một thread của parallel"],
            answer: 1,
            explain: "subscribeOn đổi thread lúc subscribe, nên nguồn (callable) chạy trên boundedElastic dù subscribeOn đứng cuối chuỗi. `map(f)` cũng chạy tiếp trên thread đó vì không có publishOn.",
          },
        },
      ],
    },
    {
      id: "errors",
      title: "Phần 4: Xử lý lỗi, retry và timeout",
      intro: [
        "Code tuần tự dùng `try/catch`. Trong pipeline Reactor, lỗi là một **tín hiệu** (`onError`) đi xuôi chuỗi, và được bắt bằng operator.",
        "Nhắc lại: lỗi **kết thúc stream**. Đã chạy `Flux.just(1, 2, 0, 4).map(i -> 10 / i)`: nhận 10 rồi 5, sau đó `ArithmeticException: / by zero`, phần tử 4 không bao giờ được xử lý.",
        "Các operator xử lý lỗi:",
        "- **`onErrorReturn(v)`**: lỗi thì trả giá trị mặc định.",
        "- **`onErrorResume(e -> mono)`**: lỗi thì chuyển sang một Publisher khác (fallback, đọc cache). Linh hoạt nhất.",
        "- **`onErrorMap(e -> new X(e))`**: đổi loại lỗi, ví dụ lỗi kỹ thuật thành lỗi nghiệp vụ.",
        "- **`timeout(d)`**: không có tín hiệu trong khoảng `d` thì phát `TimeoutException` và huỷ nguồn.",
        "- **`retry(n)`**: lỗi thì subscribe lại nguồn, tối đa n lần. Vì lazy nên retry chạy lại cả lời gọi. **`retryWhen(Retry.backoff(3, Duration.ofMillis(100)))`** thêm thời gian chờ tăng dần và jitter.",
        "Muốn một phần tử lỗi không giết cả Flux thì bắt lỗi **bên trong** `flatMap`: `flatMap(i -> call(i).onErrorResume(e -> Mono.empty()))`. Đã chạy với 1, 2, 0, 4: ra `[10, 5, 2]`, phần tử lỗi bị bỏ qua.",
      ],
      board: {
        title: "Lỗi là tín hiệu, bắt bằng operator",
        highlight: "tín hiệu",
        chips: ["onErrorResume", "retry", "timeout", "Retry.backoff"],
        cards: [
          {
            title: "retry(2): tổng cộng 3 lần gọi",
            diagram: {
              kind: "flow",
              steps: ["Lần 1: lỗi", "retry: subscribe lại, lần 2: lỗi", "retry: subscribe lại, lần 3"],
              ok: ["Lần 3 thành công", "\"ok lan 3\""],
              bad: ["Vẫn lỗi sau 2 lần retry", "Lỗi cuối đi xuống subscriber"],
            },
            code: `Mono.fromCallable(() -> {
        int c = calls.incrementAndGet();
        if (c < 3) throw new IllegalStateException("loi " + c);
        return "ok lan " + c;
    })
    .retry(2)
    .block();
// Đã chạy: goi lan 1, goi lan 2, goi lan 3 -> "ok lan 3"`,
            takeaway: "retry(n) là n lần thử lại, cộng lần đầu",
          },
          {
            title: "timeout rồi fallback",
            diagram: {
              kind: "flow",
              steps: ["Service chậm 2 giây", "timeout(300 ms)", "onErrorResume"],
              ok: ["Trả fallback", "\"fallback vi TimeoutException\""],
              bad: ["Không có timeout", "Request treo 2 giây"],
            },
            code: `Mono.delay(Duration.ofSeconds(2)).map(x -> "cham")
    .timeout(Duration.ofMillis(300))
    .onErrorResume(e -> Mono.just("fallback vi " + e.getClass().getSimpleName()))
    .block();
// Đã chạy: fallback vi TimeoutException`,
            takeaway: "timeout trong Reactor huỷ nguồn, không chỉ bỏ chờ",
          },
        ],
        conclusion: "**Kết luận:** thứ tự hay dùng khi gọi service ngoài là `timeout` rồi `retryWhen(backoff)` rồi `onErrorResume` cho fallback. Đặt `timeout` trước `retry` để mỗi lần thử có giới hạn riêng.",
      },
      after: [
        "Khác với `CompletableFuture.orTimeout` (bài CompletableFuture, Phần 6) chỉ giải phóng bên chờ, `timeout` của Reactor gửi tín hiệu **cancel** ngược lên nguồn. Với WebClient, cancel đóng kết nối HTTP đang chờ.",
      ],
      takeaway: {
        lines: [
          "Lỗi kết thúc stream. Muốn bỏ qua từng phần tử lỗi thì bắt lỗi bên trong flatMap.",
          "`timeout` → `retryWhen(Retry.backoff(...))` → `onErrorResume` là bộ ba khi gọi service ngoài.",
        ],
      },
      trap: {
        title: "retry một lời gọi không idempotent",
        text: "Vì Reactor lazy, `retry` subscribe lại và **gọi lại thật** lời gọi tới service kia. Với `POST /payments` không có idempotency key, retry có thể trừ tiền hai lần. Chỉ retry thao tác idempotent, hoặc kèm khoá idempotency.",
      },
      quiz: {
        question: "`Mono.fromCallable(call).retry(3)` và `call` lỗi mọi lần. `call` được gọi tổng cộng bao nhiêu lần?",
        options: ["3", "4", "1", "Vô hạn"],
        answer: 1,
        explain: "Một lần đầu cộng 3 lần thử lại. Đã chạy `retry(2)`: gọi đủ 3 lần.",
      },
    },
    {
      id: "context",
      title: "Phần 5: ThreadLocal, MDC và Reactor Context",
      intro: [
        "Ở bài Deadlock và ThreadLocal, ta thấy Spring MVC dựa vào ThreadLocal vì một request chạy trên **một thread từ đầu tới cuối**: `SecurityContextHolder`, transaction, MDC của log đều cất ở đó.",
        "Trong WebFlux, giả định đó sai: một request có thể bắt đầu trên event loop này, chạy tiếp trên thread của driver, rồi trên `boundedElastic`. Đồng thời mỗi event loop phục vụ hàng nghìn request xen kẽ. ThreadLocal vừa **không đi theo** request, vừa có thể **lộ dữ liệu** của request khác.",
        "Đã chạy: đặt `ThreadLocal` là \"req-42\" trên main, rồi `publishOn(parallel())`. Bên trong `doOnNext` đọc được `null`, trên thread `parallel-1`.",
        "Thay vào đó Reactor có **Context**: một map bất biến gắn với **subscription**, không gắn với thread. Ghi bằng `contextWrite(Context.of(\"traceId\", \"req-42\"))`, đọc bằng `Mono.deferContextual(ctx -> ...)`. Context lan **từ dưới lên**: `contextWrite` đặt ở cuối chuỗi thì các operator phía trên đọc được. Đã chạy cùng `publishOn(parallel())`: vẫn đọc được \"req-42\".",
        "Spring dùng sẵn cơ chế này:",
        "- **Security**: WebFlux dùng `ReactiveSecurityContextHolder.getContext()` (trả Mono), không dùng `SecurityContextHolder`.",
        "- **Transaction**: `@Transactional` với R2DBC dùng `ReactiveTransactionManager`, transaction nằm trong Context.",
        "- **MDC và tracing**: từ Reactor 3.5.3 có `Hooks.enableAutomaticContextPropagation()` cùng thư viện Micrometer context-propagation, tự chép giá trị từ Context sang ThreadLocal (MDC) ở mỗi bước. Spring Boot 3.2+ bật bằng `spring.reactor.context-propagation=auto`.",
      ],
      predict: {
        question: "Đặt `ThreadLocal` = \"req-42\" trên thread main, rồi chạy `Mono.just(1).publishOn(Schedulers.parallel()).doOnNext(i -> log(TL.get())).block()`. In ra gì?",
        options: ["req-42", "null", "Lỗi biên dịch", "Một giá trị của request khác"],
        answer: 1,
        explain: "Đã chạy: `[parallel-1] ThreadLocal = null`. publishOn chuyển bước doOnNext sang thread parallel-1, mà ThreadLocal của main không có ở đó.",
      },
      compare: [
        way(
          "ThreadLocal",
          `ThreadLocal<String> TL = new ThreadLocal<>();
TL.set("req-42");
Mono.just(1)
    .publishOn(Schedulers.parallel())
    .doOnNext(i -> log("ThreadLocal = " + TL.get()))
    .block();`,
          [
            ask("Đọc giá trị sau khi đổi thread", bad("Đã chạy: `[parallel-1] ThreadLocal = null`.")),
            ask("Event loop phục vụ request khác xen kẽ", bad("Giá trị còn sót trên thread có thể bị request khác đọc nhầm.")),
          ],
          "Gắn với thread, nên mất khi Reactor đổi thread.",
        ),
        way(
          "Reactor Context",
          `Mono.deferContextual(ctx -> Mono.just("Context = " + ctx.get("traceId")))
    .publishOn(Schedulers.parallel())
    .contextWrite(Context.of("traceId", "req-42"))
    .block();`,
          [
            ask("Đọc giá trị sau khi đổi thread", ok("Đã chạy: `Context = req-42`.")),
            ask("Event loop phục vụ request khác xen kẽ", ok("Mỗi subscription có Context riêng, không lẫn.")),
          ],
          "Gắn với subscription, đi theo request qua mọi thread.",
        ),
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "WebFlux đổi thread giữa các bước và một thread phục vụ nhiều request → ThreadLocal mất giá trị hoặc lẫn giá trị → dùng Reactor Context, và bật context propagation để MDC, tracing hoạt động.",
        ],
      },
      trap: {
        title: "Đọc SecurityContextHolder trong WebFlux",
        text: "`SecurityContextHolder.getContext().getAuthentication()` trong handler WebFlux thường trả `null` vì nó dựa vào ThreadLocal. Dùng `ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)`, hoặc nhận `Mono<Principal>` làm tham số của controller.",
      },
      quiz: {
        question: "Vì sao log trong app WebFlux mất `traceId` trong MDC ở giữa chuỗi xử lý?",
        options: [
          "Vì Logback không hỗ trợ Netty",
          "Vì MDC dựa vào ThreadLocal, mà chuỗi reactive đổi thread giữa các bước; cần Reactor Context và context propagation",
          "Vì traceId quá dài",
          "Vì WebFlux tắt log mặc định",
        ],
        answer: 1,
        explain: "MDC là ThreadLocal. Khi bước tiếp theo chạy trên thread khác, giá trị không đi theo. Reactor Context gắn với subscription; context propagation chép nó sang MDC ở mỗi bước.",
      },
    },
    {
      id: "vs-virtual-threads",
      senior: true,
      title: "Phần 6: WebFlux hay virtual thread?",
      intro: [
        "Từ Java 21, virtual thread giải quyết **cùng vấn đề** theo cách khác: thread vẫn \"chờ\" như code tuần tự, nhưng khi chờ I/O, JVM gỡ nó khỏi carrier thread nên chờ gần như miễn phí (chi tiết ở bài Deadlock, ThreadLocal & Virtual Threads, Phần 5 và 6). Spring Boot 3.2+ chỉ cần `spring.threads.virtual.enabled=true`, Tomcat xử lý mỗi request trên một virtual thread.",
        "Đã đo trên cùng app, endpoint MVC `Thread.sleep(100)`, so với WebFlux `Mono.delay(100 ms)`:",
        "- **200 client đồng thời**: MVC thread thường (pool 200) 1244 tới 1276 request/giây; MVC virtual thread 1107 tới 1243; WebFlux 1146 tới 1593. Ngang nhau, vì 200 thread vẫn đủ cho 200 client.",
        "- **1000 client đồng thời**: MVC thread thường 1691 tới 1851 request/giây, p50 khoảng 520 ms (1000 request xếp hàng chờ 200 thread); MVC virtual thread 2168 tới 2362, p50 khoảng 330 ms; WebFlux 2863 tới 3123, p50 190 tới 256 ms.",
        "Lưu ý về số đo: client tạo tải chạy cùng laptop (M1 Pro 8 core) nên tranh CPU với server, số tuyệt đối ở mức cao bị giới hạn bởi chính client. Điều đáng tin là xu hướng: khi số request đồng thời vượt số thread, pool thread thường bắt đầu xếp hàng, còn virtual thread và WebFlux thì không.",
        "Vậy chọn thế nào:",
        "- **Virtual thread + MVC**: code tuần tự quen thuộc, stack trace đọc được, dùng tiếp JDBC, JPA, `RestClient`, ThreadLocal vẫn chạy. Hợp phần lớn service CRUD gọi DB và API khác.",
        "- **WebFlux**: hợp **streaming** (SSE, WebSocket, Flux vô hạn), cần **backpressure**, ghép nhiều nguồn bất đồng bộ bằng operator (zip, merge, timeout, retry khai báo), gateway (Spring Cloud Gateway bản gốc chạy trên WebFlux), hoặc hệ thống đã reactive từ đầu tới cuối (R2DBC, Mongo reactive).",
        "Những điểm cần nói khi so sánh:",
        "- **Pinning**: trên Java 21 tới 23, virtual thread chặn bên trong `synchronized` bị ghim vào carrier. JDK 24 (JEP 491) đã sửa phần lớn; vẫn còn pin khi gọi native hoặc trong khởi tạo class.",
        "- **Giới hạn thật vẫn còn**: virtual thread không làm DB pool to ra. 10 connection thì vẫn chỉ 10 query cùng lúc, dù là MVC hay WebFlux.",
        "- **Chi phí học và debug**: Reactor có đường cong học dốc, stack trace đầy frame của operator, ThreadLocal không dùng được, test cần `StepVerifier`. Với virtual thread, đội đang biết MVC dùng được ngay.",
      ],
      drill: {
        choices: ["MVC + virtual thread", "WebFlux"],
        items: [
          { q: "Service CRUD đơn hàng, dùng JPA và gọi 2 API nội bộ, tải tăng làm Tomcat hết 200 thread", a: "MVC + virtual thread", why: "Giữ nguyên code và JPA, chỉ bật một property. Viết lại sang WebFlux phải bỏ JPA và học Reactor." },
          { q: "Đẩy giá chứng khoán cho 50.000 client qua SSE, client chậm thì chỉ cần giá mới nhất", a: "WebFlux", why: "Streaming dài với Flux và backpressure (`onBackpressureLatest`) là điểm mạnh của reactive." },
          { q: "API gateway định tuyến, rate limit cho hàng chục service", a: "WebFlux", why: "Gateway gần như chỉ chuyển tiếp I/O cho rất nhiều kết nối. Spring Cloud Gateway bản gốc chạy trên WebFlux (nay có thêm biến thể Server MVC)." },
          { q: "Đội 5 người, chưa ai dùng Reactor, cần ra tính năng nhanh, app chủ yếu chờ DB", a: "MVC + virtual thread", why: "Lợi ích về số request đồng thời gần tương đương, chi phí học và debug thấp hơn nhiều." },
          { q: "Ghép kết quả của 5 service, mỗi cái có timeout, retry có backoff và fallback riêng, cả hệ thống đã dùng WebClient và R2DBC", a: "WebFlux", why: "Đã reactive từ đầu tới cuối, và operator của Reactor mô tả timeout, retry, fallback rất gọn." },
        ],
        summary: "Code CRUD chờ I/O: virtual thread cho cùng lợi ích với code đơn giản. Streaming, backpressure, gateway, hệ thống đã reactive: WebFlux.",
      },
      takeaway: {
        lines: [
          "Virtual thread và WebFlux cùng giải bài \"thread bị giữ khi chờ I/O\". Virtual thread giữ code tuần tự; WebFlux đổi sang pipeline.",
          "Chọn WebFlux khi cần streaming, backpressure, hoặc đã reactive toàn tuyến. Còn lại, MVC với virtual thread thường là lựa chọn đơn giản hơn.",
        ],
      },
      trap: {
        title: "Bật virtual thread rồi nghĩ DB hết là nút thắt",
        text: "Virtual thread cho phép hàng nghìn request cùng chờ, nhưng HikariCP vẫn chỉ có số connection đã cấu hình. Hàng nghìn virtual thread sẽ xếp hàng ở pool, và có thể đè database nếu tăng pool bừa. Giới hạn đồng thời ở pool hoặc bằng `Semaphore`, không ở số thread.",
      },
      quiz: {
        question: "Lý do hợp lý nhất để giữ WebFlux thay vì chuyển sang MVC với virtual thread là gì?",
        options: [
          "WebFlux luôn nhanh hơn cho mọi request",
          "Service cần streaming dài (SSE) với backpressure và đã dùng WebClient, R2DBC toàn tuyến",
          "Muốn dùng JPA với lazy loading",
          "Muốn dùng ThreadLocal cho SecurityContext",
        ],
        answer: 1,
        explain: "Streaming và backpressure là điểm mạnh riêng của reactive. JPA và ThreadLocal lại là lý do nghiêng về MVC. WebFlux không làm từng request nhanh hơn.",
      },
    },
  ],
  modelAnswer:
    "Spring MVC chạy thread-per-request, nên khi request chủ yếu chờ DB hay API khác thì thread bị giữ, và pool 200 thread trở thành trần dù CPU còn rảnh. WebFlux chạy trên Netty với vài thread event loop, bằng số core, và không thread nào được chờ: I/O non-blocking, code viết bằng Mono cho 0 hoặc 1 phần tử và Flux cho nhiều phần tử. Reactor là lazy, không subscribe thì không chạy; map cho biến đổi đồng bộ, flatMap khi bước sau trả Mono, flatMap không giữ thứ tự, cần thứ tự thì concatMap. Backpressure là subscriber request n phần tử để không bị ngập. Bẫy lớn nhất là gọi blocking như JDBC, Thread.sleep hay block trong event loop: em đã đo một endpoint sleep 100 ms trên máy 8 core chỉ còn 75 request mỗi giây và kéo chậm cả endpoint khác; nếu buộc phải gọi blocking thì em bọc fromCallable với subscribeOn boundedElastic và bật BlockHound trong test. ThreadLocal và MDC không đi theo request nên em dùng Reactor Context. Với Java 21, nếu service là CRUD dùng JPA thì em chọn MVC với virtual thread cho đơn giản; WebFlux em dành cho streaming, gateway, hay hệ thống đã reactive toàn tuyến.",
  cards: [
    { q: "Vấn đề của thread-per-request khi request chủ yếu chờ I/O?", a: "Thread bị giữ trong lúc chờ, nên số thread trong pool (Tomcat mặc định 200) thành trần số request đồng thời dù CPU còn rảnh." },
    { q: "Netty trong WebFlux có bao nhiêu thread event loop?", a: "Mặc định bằng số core (tối thiểu 4). Đã đếm trên máy 8 core: 8 thread reactor-http-nio." },
    { q: "Mono khác Flux?", a: "Mono phát 0 hoặc 1 phần tử, Flux phát 0 tới N phần tử. Cả hai kết thúc bằng onComplete hoặc onError." },
    { q: "\"Reactor lazy\" nghĩa là gì? Ngoại lệ hay gặp?", a: "Không subscribe thì không chạy. `Mono.just(x)` tính x ngay khi tạo; muốn trì hoãn dùng `fromCallable` hoặc `defer`." },
    { q: "map khác flatMap khác concatMap?", a: "map: hàm trả giá trị thường. flatMap: hàm trả Mono/Flux, chạy song song, không giữ thứ tự. concatMap: như flatMap nhưng tuần tự, giữ thứ tự." },
    { q: "Backpressure là gì?", a: "Subscriber gọi `request(n)` để nói chỉ nhận thêm n phần tử. Nguồn không chậm lại được thì chọn onBackpressureBuffer, Drop hoặc Latest." },
    { q: "Gọi Thread.sleep(100) trong controller WebFlux trên máy 8 core thì sao?", a: "Trần khoảng 8 × 10 = 80 request/giây (đã đo 75), và các endpoint khác dùng chung event loop cũng bị chậm theo." },
    { q: "Bắt buộc gọi code blocking trong WebFlux thì làm gì?", a: "`Mono.fromCallable(...).subscribeOn(Schedulers.boundedElastic())`, và bật BlockHound trong test để bắt chỗ còn sót." },
    { q: "publishOn khác subscribeOn?", a: "publishOn đổi thread cho các bước phía sau nó. subscribeOn đổi thread của nguồn, vị trí không quan trọng, cái gần nguồn nhất thắng." },
    { q: "retry(2) gọi nguồn tối đa bao nhiêu lần?", a: "3 lần: lần đầu cộng 2 lần thử lại. Chỉ retry thao tác idempotent." },
    { q: "Vì sao MDC và SecurityContextHolder không chạy đúng trong WebFlux?", a: "Chúng dựa vào ThreadLocal, mà chuỗi reactive đổi thread. Dùng Reactor Context, ReactiveSecurityContextHolder, và context propagation cho MDC." },
    { q: "Khi nào chọn WebFlux thay vì MVC với virtual thread?", a: "Streaming (SSE, WebSocket), cần backpressure, gateway, hoặc đã reactive toàn tuyến. Service CRUD dùng JPA thì virtual thread đơn giản hơn." },
  ],
};
