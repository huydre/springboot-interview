import timeline from "../timelines/threadpool.json";
import type { Lesson, Scene } from "../types";

// Every output below was observed on JDK 21 (8 CPUs).
export const threadpool: Lesson = {
  slug: "threadpool",
  crumb: "ThreadPoolExecutor",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/threadpool-executor",
  videoVersion: "76d7e187",
  scenes: timeline as Scene[],
  title: "ThreadPoolExecutor: core → queue → max → reject",
  subtitle:
    "Vì sao cần thread pool, 6 tham số, thứ tự xử lý khi execute(), mô phỏng 20 task, 4 rejection policy, bẫy của Executors, chọn kích thước pool, tắt pool đúng cách và ThreadPoolTaskExecutor trong Spring.",
  openingQuiz: {
    question: "core 2, max 4, ArrayBlockingQueue(10). Submit liên tục 20 task, mỗi task chạy 1 giây. Kết quả?",
    options: ["4 chạy, 16 chờ", "4 chạy, 10 chờ, 6 bị reject", "2 chạy, 10 chờ, 8 bị reject", "20 task đều chạy vì pool tự tăng thread"],
    answer: 1,
    explain:
      "Đã chạy thật: task 1–2 tạo thread core, 3–12 vào queue, 13–14 tạo thread vượt core, 15–20 REJECTED. 14 task xong sau 4.0 giây.",
  },
  roadmap: [
    "Chặng 1: vì sao cần pool, 6 tham số, thứ tự core → queue → max → reject, mô phỏng 20 task.",
    "Chặng 2: 4 rejection policy và bẫy newFixedThreadPool, newCachedThreadPool.",
    "Chặng 3: chọn kích thước pool, tắt pool đúng cách, ThreadPoolTaskExecutor và @Async.",
  ],
  sections: [
    {
      id: "why-pool",
      title: "Phần 1: Vì sao cần thread pool",
      scene: "why",
      intro: [
        "Mỗi platform thread (thread thường của Java, đối lập với virtual thread ở bài Deadlock & Virtual Thread) là một thread hệ điều hành: tạo tốn thời gian, giữ stack riêng. `new Thread()` cho mỗi việc thì tải tăng đột biến là số thread tăng không giới hạn, và không tái sử dụng được. Thread pool như quầy ngân hàng: giao dịch viên (thread) có hạn, khách mới xếp hàng (queue), đông quá mở quầy phụ (max), vẫn đông thì từ chối (reject).",
        "`ThreadPoolExecutor` có 6 tham số:",
        "- **`corePoolSize`**: số thread core.",
        "- **`maximumPoolSize`**: số thread tối đa.",
        "- **`keepAliveTime`**: thời gian giữ thread vượt core khi rảnh.",
        "- **`workQueue`**: hàng đợi chứa task chờ. Nó quyết định gần như toàn bộ hành vi, xem vì sao ở Phần 2.",
        "- **`threadFactory`**: đặt tên thread.",
        "- **`handler`**: rejection policy.",
      ],
      quiz: {
        question: "Tham số nào quyết định gần như toàn bộ hành vi của ThreadPoolExecutor?",
        options: ["keepAliveTime", "workQueue", "threadFactory", "corePoolSize"],
        answer: 1,
        explain: "Queue có giới hạn hay không quyết định max có bao giờ được dùng, và pool có bao giờ reject hay không.",
      },
    },
    {
      id: "flow",
      title: "Phần 2: core → queue → max → reject",
      scene: "flow",
      intro: [
        "Khi `execute(task)`, pool đi qua 4 bước theo thứ tự:",
        "- **Chưa đủ core**: tạo thread mới.",
        "- **Đủ core**: task vào queue.",
        "- **Queue đầy, chưa tới max**: tạo thêm thread.",
        "- **Đã max**: áp dụng rejection policy (mặc định `AbortPolicy` ném `RejectedExecutionException`).",
        "Điểm phản trực giác: pool lấp đầy queue trước rồi mới tăng thread.",
        "Vì vậy `workQueue` quyết định gần như mọi thứ: queue không giới hạn thì bước \"queue đầy\" không bao giờ xảy ra, nên pool không bao giờ vượt core và không bao giờ reject.",
        "Đã chạy core 2, max 4, queue 10, 20 task mỗi task 1 giây: 4 chạy, 10 chờ, 6 bị reject; 14 task xong sau 4.0 giây.",
      ],
      predict: {
        question: "core 2, max 4, queue 10, task chạy lâu. Task 1 và 2 đang chạy, task 3 tới 12 đã nằm trong queue. Task **thứ 13** đi đâu?",
        options: [
          "Vào queue, chờ như các task trước",
          "Pool tạo thread thứ 3 và task 13 chạy ngay",
          "Bị reject",
          "Chờ một thread core rảnh",
        ],
        answer: 1,
        explain: "Queue đã đủ 10 chỗ mà số thread (2) chưa tới max (4), nên pool tạo thêm thread. Task 13 được trao thẳng cho thread mới, chạy trước cả các task đang xếp hàng.",
      },
      widget: "pool-sim",
      widgetTitle: "Mô phỏng pool",
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Pool lấp đầy queue trước rồi mới tăng thread → queue không giới hạn thì không bao giờ đầy → max không bao giờ được dùng và pool không bao giờ reject.",
        ],
      },
      quiz: {
        question: "core 2, max 4, queue 10. Hai task đầu đang chạy trên 2 thread core. Task thứ 3 đi đâu?",
        options: ["Tạo thread thứ 3 ngay", "Vào queue chờ", "Bị reject", "Chờ một thread core rảnh rồi mới được nhận"],
        answer: 1,
        explain: "Đủ core thì task vào queue trước. Chỉ khi queue đầy (10 task) pool mới tạo thêm thread tới max.",
      },
    },
    {
      id: "sim",
      title: "Phần 3: Mô phỏng 20 task",
      scene: "sim",
      intro: [
        "Video mô phỏng đúng từng task: 1–2 vào hai ô thread core, 3–12 lấp đầy 10 chỗ queue, 13–14 mở thêm hai thread tới max, 15–20 bị reject.",
        "Hệ quả bất ngờ là **thứ tự bắt đầu**. Đã chạy: các task bắt đầu theo thứ tự 1, 2, 13, 14, 3, 4, …, 12. Lý do: task 13 và 14 không vào queue mà được trao thẳng cho thread mới tạo, nên chạy ngay và chen lên trước các task 3–12 đang xếp hàng. Đừng dựa vào pool để giữ thứ tự.",
        "Thử đổi tham số ở widget mô phỏng pool (Phần 2) để thấy cùng quy tắc với cấu hình khác.",
      ],
      quiz: {
        question: "Cùng cấu hình nhưng mỗi task chỉ chạy 1 ms thì còn bị reject không?",
        options: ["Vẫn đúng 6 task", "Có thể không, hoặc ít hơn nhiều: thread rảnh kịp lấy task khỏi queue", "Nhiều hơn 6", "Luôn reject 10"],
        answer: 1,
        explain: "Con số 6 chỉ đúng khi task chạy lâu hơn thời gian submit cả 20 task.",
      },
    },
    {
      id: "policy",
      title: "Phần 4: Rejection policy",
      scene: "policy",
      intro: [
        "Khi pool đã max và queue đầy, task mới đi theo một trong 4 policy:",
        "- **`AbortPolicy`** (mặc định): ném exception.",
        "- **`CallerRunsPolicy`**: thread gọi tự chạy task. Đây là back-pressure: bên gửi bận chạy task nên tự gửi chậm lại, giống dòng chảy bị nghẹt dội ngược về nguồn.",
        "- **`DiscardPolicy`**: lặng lẽ bỏ task mới.",
        "- **`DiscardOldestPolicy`**: bỏ task cũ nhất trong queue.",
        "`CallerRunsPolicy` trong web app chạy task trên chính thread Tomcat của request, nên request đó chậm hẳn: hợp với job nền hơn là API. Pool còn từ chối task sau `shutdown()`: đã chạy `execute` sau `shutdownNow()` ném `RejectedExecutionException`.",
      ],
      predict: {
        question: "Pool 1 thread, queue 2 chỗ, gửi liền 5 task chạy lâu, policy là `DiscardOldestPolicy`. Những task nào được chạy?",
        options: ["1, 2, 3", "1, 4, 5", "3, 4, 5", "Cả 5 task"],
        answer: 1,
        explain: "Task 1 chạy trên thread, task 2 và 3 nằm trong queue. Task 4 tới thì đẩy task cũ nhất (2) ra, task 5 đẩy tiếp task 3. Còn lại 1, 4, 5. Bấm từng policy để so.",
      },
      widget: "reject-policy",
      widgetTitle: "Pool 1 thread, queue 2, gửi 5 task",
      quiz: {
        question: "Gửi email hàng loạt, không được mất task, chấp nhận chậm lại. Chọn policy nào?",
        options: ["DiscardPolicy", "CallerRunsPolicy", "DiscardOldestPolicy", "Không cần policy"],
        answer: 1,
        explain: "CallerRuns không bỏ task mà làm chậm bên gửi: back-pressure tự nhiên.",
      },
    },
    {
      id: "factory",
      title: "Phần 5: Bẫy của các factory trong Executors",
      scene: "factory",
      intro: [
        "`newFixedThreadPool(n)` và `newSingleThreadExecutor()` dùng `LinkedBlockingQueue` không giới hạn: đã đo `remainingCapacity()` là 2147483647, gửi 100.000 task chậm vào pool 10 thread thì threads=10, queue=99990, không một exception nào.",
        "Theo luật ở Phần 2, queue không bao giờ đầy thì pool không bao giờ tạo thêm thread quá core và không bao giờ reject. Quá tải mà không có tín hiệu, task cứ dồn vào queue tới khi OOM.",
      ],
      takeaway: {
        lines: [
          "Factory của `Executors` giấu đi cấu hình nguy hiểm: `newFixedThreadPool` có queue không giới hạn, `newCachedThreadPool` có số thread gần như không giới hạn.",
        ],
      },
      quiz: {
        question: "newFixedThreadPool(10) có bao giờ dùng tới max không?",
        options: ["Có, khi queue đầy", "Không: queue LinkedBlockingQueue không giới hạn nên không bao giờ đầy", "Có, khi CPU bận", "Max của nó là vô hạn"],
        answer: 1,
        explain: "Queue không giới hạn thì bước \"queue đầy\" không bao giờ xảy ra: pool không vượt core và không bao giờ reject.",
      },
      parts: [
        {
          id: "factory-cached",
          title: "newCachedThreadPool: bẫy ngược lại",
          intro: [
            "`newFixedThreadPool` hỏng vì queue quá to. `newCachedThreadPool` hỏng theo hướng ngược lại: queue không có chỗ nào.",
            "`newCachedThreadPool()` dùng core 0, max `Integer.MAX_VALUE` và `SynchronousQueue`. `SynchronousQueue` là queue **0 chỗ**: mỗi task phải được trao tay ngay cho một thread đang rảnh; không có thread rảnh thì coi như queue đầy, và pool tạo thread mới.",
            "Vì max gần như vô hạn, task chậm làm số thread tăng không giới hạn: đã đo 2000 task ngủ 5 giây tạo ra 2000 thread.",
            "Production: tự cấu hình `ThreadPoolExecutor` với queue có giới hạn và rejection policy rõ ràng, đừng dùng các factory này cho tải không kiểm soát được.",
          ],
          quiz: {
            question: "Vì sao newCachedThreadPool nguy hiểm khi task chậm?",
            options: ["Vì queue không giới hạn", "Vì max là Integer.MAX_VALUE nên mỗi task chưa có thread rảnh lại tạo thêm một thread hệ điều hành", "Vì nó không tái sử dụng thread", "Vì nó luôn reject"],
            answer: 1,
            explain: "Đã đo: 2000 task ngủ 5 giây ra đúng 2000 thread.",
          },
        },
      ],
    },
    {
      id: "sizing",
      title: "Phần 6: Chọn kích thước pool",
      scene: "size",
      intro: [
        "CPU-bound: khoảng bằng số core. I/O-bound: `threads ≈ số core × (1 + thời gian chờ / thời gian CPU)`, ví dụ 8 core, chờ API 200 ms, CPU 10 ms ra 168. Công thức chỉ là điểm xuất phát; load test rồi chỉnh.",
        "Tài nguyên phía sau mới là giới hạn thật: 168 thread query DB qua HikariCP 10 connection thì 158 thread đứng chờ. Tách pool theo loại việc (mẫu **bulkhead**, như vách ngăn chia khoang tàu: một khoang thủng không làm chìm cả tàu) để một downstream (dịch vụ phía sau mà bạn gọi tới, như DB hay API khác) chậm không kéo sập phần khác.",
      ],
      predict: {
        question: "Việc I/O-bound trên máy 8 core: mỗi task chờ API 200 ms và chỉ dùng CPU 10 ms. Theo công thức, pool nên có khoảng bao nhiêu thread?",
        options: ["8", "16", "168", "2000"],
        answer: 2,
        explain: "`8 × (1 + 200 / 10) = 8 × 21 = 168`. Thread chủ yếu nằm chờ, nên cần nhiều thread hơn số core rất nhiều. Đây chỉ là điểm xuất phát, sau đó load test rồi chỉnh.",
      },
      widget: "pool-size",
      widgetTitle: "Tính kích thước pool",
      quiz: {
        question: "Một pool dùng chung cho cả tính toán và gọi API chậm có ổn không?",
        options: ["Ổn, càng ít pool càng tốt", "Không nên: việc gọi API chậm chiếm hết thread, việc tính toán phải chờ", "Ổn nếu pool đủ lớn", "Chỉ ổn với virtual thread"],
        answer: 1,
        explain: "Tách pool theo loại việc là mẫu bulkhead.",
      },
    },
    {
      id: "shutdown",
      title: "Phần 7: Tắt pool đúng cách",
      scene: "stop",
      intro: [
        "Ba method để tắt pool:",
        "- **`shutdown()`**: ngừng nhận task mới nhưng vẫn chạy hết task trong queue, và trả về ngay.",
        "- **`shutdownNow()`**: interrupt task đang chạy và trả về list task chưa chạy. Đã đo pool 1 thread, 5 task, gọi sau 50 ms thì trả về 4 task, task đang chạy bị interrupt.",
        "- **`awaitTermination(t)`**: chặn tới khi tắt xong hoặc hết giờ.",
        "Mẫu chuẩn: `shutdown()`, `awaitTermination(30, SECONDS)`, chưa xong mới `shutdownNow()`. `shutdownNow()` chỉ gọi `interrupt()`: task nuốt `InterruptedException` vẫn chạy tiếp. Java 19+ `ExecutorService` là `AutoCloseable`.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "`shutdown()` → `awaitTermination(30, SECONDS)` → chưa xong mới `shutdownNow()`.",
        ],
      },
      quiz: {
        question: "Gọi shutdown() xong thoát main ngay thì sao?",
        options: ["Mọi task bị huỷ", "shutdown() không chờ: task có thể chưa xong, phải awaitTermination", "JVM chờ tự động mọi task", "Ném exception"],
        answer: 1,
        explain: "shutdown() chỉ ngừng nhận việc mới và trả về ngay.",
      },
    },
    {
      id: "spring",
      title: "Phần 8: ThreadPoolTaskExecutor trong Spring",
      scene: "spring",
      intro: [
        "Khai báo `ThreadPoolTaskExecutor` làm bean với core, max, `queueCapacity` có giới hạn, `threadNamePrefix`, rejection handler, `setWaitForTasksToCompleteOnShutdown(true)`, rồi dùng `@Async(\"reportExecutor\")`.",
        "Bẫy: `queueCapacity` mặc định là `Integer.MAX_VALUE`, đúng bẫy queue không giới hạn (executor mặc định của Spring Boot cho `@Async` cũng vậy, chỉnh qua `spring.task.execution.pool.*`). `@Async` gọi từ chính class đó không chạy bất đồng bộ, vì `@Async` chạy qua **proxy**: Spring bọc bean trong một object trung gian, lời gọi từ bên ngoài đi qua proxy và được đẩy sang executor, còn `this.method()` gọi thẳng vào object thật, không qua proxy (học kỹ ở bài về proxy và @Transactional).",
        "Bẫy nữa: `ThreadLocal` không tự sang thread của executor. Ví dụ MDC (context gắn vào mỗi dòng log, như `requestId`) nằm trong `ThreadLocal`, nên log trong task `@Async` mất `requestId`. Dùng `TaskDecorator` để chép context sang.",
      ],
      quiz: {
        question: "Vì sao nên đặt threadNamePrefix?",
        options: ["Để chạy nhanh hơn", "Để đọc log và thread dump biết ngay thread thuộc pool nào", "Để Spring tìm được bean", "Bắt buộc với @Async"],
        answer: 1,
        explain: "report-3 nói rõ hơn pool-7-thread-3 khi cần tìm pool đang nghẽn.",
      },
    },
  ],
  modelAnswer:
    "ThreadPoolExecutor xử lý task theo thứ tự: chưa đủ core thread thì tạo thread mới; đủ core thì đẩy vào queue; queue đầy mà chưa tới max thì tạo thêm thread; đã max thì áp dụng rejection policy, mặc định là AbortPolicy ném RejectedExecutionException. Ví dụ core 2, max 4, queue 10, submit 20 task chạy lâu thì 4 task chạy, 10 nằm trong queue, 6 bị reject; em đã chạy thử và ra đúng như vậy. Vì thứ tự này, em luôn dùng queue có giới hạn, nếu không max chẳng bao giờ được dùng và queue có thể phình tới OOM, đó là lý do newFixedThreadPool nguy hiểm, còn newCachedThreadPool thì tạo thread không giới hạn. Kích thước pool em ước lượng bằng số core nhân (1 + thời gian chờ chia thời gian xử lý) rồi đối chiếu với connection pool và load test. Khi tắt em dùng shutdown, awaitTermination, rồi mới shutdownNow. Trong Spring em khai báo ThreadPoolTaskExecutor với queueCapacity có giới hạn vì mặc định là Integer.MAX_VALUE.",
};
