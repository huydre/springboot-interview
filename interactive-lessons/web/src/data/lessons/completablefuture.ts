import timeline from "../timelines/completablefuture.json";
import type { Lesson, Scene } from "../types";

// Measured on JDK 21 (8 CPUs); times vary by a few ms between runs.
export const completablefuture: Lesson = {
  slug: "completablefuture",
  crumb: "CompletableFuture",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/completable-future",
  videoVersion: "01520392",
  scenes: timeline as Scene[],
  title: "CompletableFuture: gọi song song, timeout và fallback",
  subtitle:
    "Vì sao cần CompletableFuture, supplyAsync và executor riêng, thenApply / thenCompose / thenCombine, allOf và anyOf, exceptionally / handle / whenComplete, timeout, join vs get, và dashboard gộp 2 service.",
  openingQuiz: {
    question: "Profile mất 300 ms, orders mất 500 ms, hai việc độc lập. Gọi song song bằng thenCombine thì màn hình chờ khoảng bao lâu?",
    options: ["800 ms (tổng)", "khoảng 500 ms (việc chậm nhất)", "300 ms", "1000 ms"],
    answer: 1,
    explain: "Đã đo: tuần tự 822 ms, song song 503 ms. Song song thì chờ việc chậm nhất chứ không phải tổng.",
  },
  roadmap: [
    "Chặng 1: Future chỉ biết chờ; supplyAsync chạy trên commonPool, vì sao I/O cần executor riêng.",
    "Chặng 2: thenApply, thenCompose, thenCombine; allOf và anyOf.",
    "Chặng 3: xử lý lỗi, timeout, join vs get, và dashboard gộp 2 service có fallback.",
  ],
  sections: [
    {
      id: "why",
      title: "Phần 1: Vì sao cần CompletableFuture",
      scene: "why",
      intro: [
        "`Future` chỉ cho chờ kết quả bằng `get()`, và `get()` chặn thread; không nói được \"xong thì làm tiếp việc này\", không gộp được hai Future, không xử lý lỗi theo chuỗi. `CompletableFuture` (Java 8) là Future lắp thành dây chuyền: mỗi bước khai báo việc làm tiếp khi bước trước xong. `thenApply` ≈ `map`, `thenCompose` ≈ `flatMap`.",
      ],
      quiz: {
        question: "Hạn chế chính của Future so với CompletableFuture?",
        options: ["Future không chạy song song được", "Future chỉ chờ bằng get() chặn thread, không lắp chuỗi, không gộp, không xử lý lỗi theo chuỗi", "Future không trả kết quả", "Future chỉ có từ Java 21"],
        answer: 1,
        explain: "CompletableFuture bổ sung thenApply, thenCompose, thenCombine, exceptionally, timeout...",
      },
    },
    {
      id: "executor",
      title: "Phần 2: supplyAsync và executor riêng",
      scene: "pool",
      intro: [
        "`supplyAsync` không truyền executor chạy trên `ForkJoinPool.commonPool()`: dùng chung cả JVM, 7 thread trên máy 8 CPU. Đã đo 14 task chờ 1 giây: commonPool 2022 ms (chạy 2 đợt), pool riêng 20 thread 1053 ms. Tác vụ I/O luôn truyền executor riêng có kích thước phù hợp và queue có giới hạn.",
        "Các method không có hậu tố `Async` chạy trên thread hoàn thành bước trước, hoặc thread gọi nếu bước trước đã xong: `completedFuture(1).thenApply(...)` chạy trên `main`. Bước nặng thì dùng `...Async(fn, executor)`.",
      ],
      quiz: {
        question: "supplyAsync(task) không truyền executor chạy ở đâu?",
        options: ["Thread mới mỗi lần", "ForkJoinPool.commonPool(), dùng chung cả JVM", "Thread main", "Executor của Tomcat"],
        answer: 1,
        explain: "Đã in tên thread: ForkJoinPool.commonPool-worker-N; parallelism 7 trên máy 8 CPU.",
      },
    },
    {
      id: "then",
      title: "Phần 3: thenApply, thenCompose, thenCombine",
      scene: "chain",
      intro: [
        "`thenApply(fn)` biến đổi kết quả bằng hàm thường. `thenCompose(fn)` khi bước sau là việc async cần kết quả bước trước: làm phẳng thay vì cho ra CF lồng nhau. `thenCombine(other, fn)` gộp hai việc độc lập chạy song song: đo được 300 ms + 500 ms gộp lại hết 517 ms.",
        "Bẫy: `thenCompose` cho hai việc độc lập biến chúng thành tuần tự; gọi `join()` giữa chuỗi chặn thread của pool.",
      ],
      widget: "cf-then",
      widgetTitle: "Chọn method",
      quiz: {
        question: "Lấy user rồi mới biết gọi order theo customerId: dùng method nào?",
        options: ["thenCombine", "thenCompose", "allOf", "anyOf"],
        answer: 1,
        explain: "Bước 2 cần kết quả bước 1 và cũng async: thenCompose. Nếu độc lập thì thenCombine để chạy song song.",
      },
    },
    {
      id: "allof",
      title: "Phần 4: allOf và anyOf",
      scene: "allany",
      intro: [
        "`allOf` xong khi tất cả xong, trả `CompletableFuture<Void>`: gom kết quả bằng cách `join()` từng CF sau đó. Đo được 3 việc 200/400/600 ms xong sau 686 ms ≈ việc lâu nhất. `anyOf` lấy kết quả đầu tiên: fast sau 225 ms.",
        "Một CF lỗi thì `allOf` lỗi (sau khi chờ tất cả); `anyOf` trả cái đầu tiên, kể cả khi đó là lỗi. Gắn `exceptionally` cho từng CF trước để có fallback riêng.",
      ],
      quiz: {
        question: "allOf(f1, f2, f3) trả về kiểu gì?",
        options: ["CompletableFuture<List<T>>", "CompletableFuture<Void>", "List<T>", "CompletableFuture<Object>"],
        answer: 1,
        explain: "Nên phải join() từng CF để lấy kết quả; lúc đó không chặn vì tất cả đã xong.",
      },
    },
    {
      id: "errors",
      title: "Phần 5: Xử lý lỗi",
      scene: "errors",
      intro: [
        "Một bước ném lỗi thì các bước `thenApply`/`thenCompose` sau bị bỏ qua, lỗi trôi tới bước xử lý lỗi đầu tiên. `exceptionally` chỉ chạy khi lỗi và trả fallback; `handle` luôn chạy, đổi được kết quả; `whenComplete` luôn chạy nhưng chỉ quan sát.",
        "Exception nhận được thường là `CompletionException` bọc lỗi gốc: kiểm tra `ex.getCause()`. Không gắn xử lý lỗi và không ai `join()` thì lỗi biến mất không dấu vết.",
      ],
      widget: "cf-error",
      widgetTitle: "Chọn cách xử lý lỗi",
      quiz: {
        question: "Muốn log lỗi nhưng vẫn để lỗi trôi tiếp cho tầng trên xử lý: dùng gì?",
        options: ["exceptionally", "handle", "whenComplete", "thenApply"],
        answer: 2,
        explain: "whenComplete không đổi kết quả: đã chạy, join() sau whenComplete vẫn ném CompletionException.",
      },
    },
    {
      id: "timeout",
      title: "Phần 6: Timeout",
      scene: "timeout",
      intro: [
        "Java 9: `orTimeout(t)` làm CF lỗi với `TimeoutException` (đo được sau 519 ms với 500 ms); `completeOnTimeout(v, t)` trả giá trị mặc định (cached-default sau 511 ms).",
        "**Timeout không dừng task bên dưới**: đo được task vẫn chạy xong ở 2010 ms, vẫn chiếm thread. `cancel(true)` trả true, `join()` ném `CancellationException`, nhưng task không nhận interrupt. Đặt timeout ở tầng HTTP client và JDBC.",
      ],
      quiz: {
        question: "Sau completeOnTimeout trả giá trị mặc định, task gọi API bên dưới thì sao?",
        options: ["Bị huỷ ngay", "Vẫn chạy tiếp tới khi xong, vẫn chiếm thread", "Bị interrupt", "Ném TimeoutException"],
        answer: 1,
        explain: "Timeout của CF chỉ để bên gọi không phải chờ; lời gọi thật cần read timeout riêng.",
      },
    },
    {
      id: "join-get",
      title: "Phần 7: join() vs get()",
      scene: "joinget",
      intro: [
        "`get()` ném `ExecutionException` và `InterruptedException` (checked), có bản `get(timeout, unit)`. `join()` ném `CompletionException` (unchecked), gọn trong lambda và stream. Đã chạy với task lỗi: cả hai có `getCause()` là `IllegalStateException`. `getNow(default)` không chặn.",
        "Cả hai đều chặn: chỉ gọi ở cuối. Controller Spring MVC có thể trả thẳng `CompletableFuture` để giải phóng thread Tomcat trong lúc chờ.",
      ],
      quiz: {
        question: "join() ném exception gì khi task lỗi?",
        options: ["ExecutionException", "CompletionException (unchecked)", "InterruptedException", "Lỗi gốc trực tiếp"],
        answer: 1,
        explain: "get() thì ném ExecutionException (checked).",
      },
    },
    {
      id: "dashboard",
      title: "Phần 8: Dashboard gộp 2 service",
      scene: "dash",
      intro: [
        "Tạo hai CF bằng `supplyAsync` trên executor riêng có queue giới hạn, gắn `completeOnTimeout(Orders.empty(), 1, SECONDS)` và `exceptionally(ex -> Orders.empty())` cho phần đơn hàng, rồi `thenCombine` hai kết quả.",
        "Đo được: tuần tự 822 ms, song song 503 ms; order-service lỗi vẫn trả về sau 511 ms với danh sách rỗng; order-service treo 3 giây thì màn hình trả về sau 1012 ms. Nhưng thread vẫn bị giữ thêm 2 giây: cần read timeout ở HTTP client và circuit breaker (Resilience4j).",
      ],
      widget: "cf-dashboard",
      widgetTitle: "Chọn kịch bản",
      quiz: {
        question: "Nếu profile-service cũng lỗi (không có fallback) thì sao?",
        options: ["Màn hình vẫn hiện đủ", "thenCombine lỗi theo, join() ném CompletionException", "Trả profile rỗng", "Treo mãi"],
        answer: 1,
        explain: "Tuỳ nghiệp vụ: phần bắt buộc thì để lỗi lên @ControllerAdvice trả 503, phần phụ thì thêm fallback.",
      },
    },
  ],
  modelAnswer:
    "Ở dự án em có màn hình tổng hợp cần dữ liệu từ profile-service và order-service. Em tạo hai CompletableFuture bằng supplyAsync với executor riêng có queue giới hạn, vì không truyền executor thì chạy trên commonPool dùng chung cả JVM, chỉ khoảng số CPU trừ 1 thread. Phần đơn hàng em gắn completeOnTimeout và exceptionally để lỗi hay chậm thì trả danh sách rỗng, rồi thenCombine hai kết quả: thời gian phản hồi bằng service chậm nhất chứ không phải tổng, em đo được 822 ms giảm còn khoảng 500 ms. thenCompose em dùng khi bước sau cần kết quả bước trước. Lỗi trong chuỗi thường bị bọc trong CompletionException nên em xét getCause. Em vẫn đặt read timeout cho HTTP client vì timeout của CompletableFuture không huỷ được lời gọi thật.",
};
