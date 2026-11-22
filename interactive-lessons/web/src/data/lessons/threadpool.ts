import timeline from "../timelines/threadpool.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

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
      board: {
        "title": "Task đi qua pool theo đúng thứ tự: core, queue, max, reject",
        "highlight": "core, queue, max, reject",
        "chips": [
          "Queue đầy trước, thread tăng sau",
          "workQueue quyết định gần như mọi thứ"
        ],
        "cards": [
          {
            "title": "Thứ tự khi execute()",
            "diagram": {
              "kind": "flow",
              "steps": [
                "execute(task)",
                "Chưa đủ core: tạo thread",
                "Đủ core: vào queue",
                "Queue đầy: thêm thread tới max"
              ],
              "ok": [
                "Còn chỗ",
                "Task được chạy hoặc chờ"
              ],
              "bad": [
                "Đã max",
                "Rejection policy"
              ]
            },
            "notes": [
              "Mặc định `AbortPolicy` ném `RejectedExecutionException`."
            ],
            "takeaway": "Pool lấp đầy queue trước rồi mới tăng thread"
          },
          {
            "title": "Core 2, max 4, queue 10",
            "diagram": {
              "kind": "hub",
              "inputs": [
                {
                  "label": "task 1-2: thread core",
                  "mark": "ok"
                },
                {
                  "label": "task 3-12: vào queue",
                  "mark": "plus"
                },
                {
                  "label": "task 13-14: thread mới",
                  "mark": "calc"
                },
                {
                  "label": "task 15-20: REJECTED",
                  "mark": "minus"
                }
              ],
              "center": "Pool 20 task",
              "rulesTitle": "Đã chạy trên JDK 21",
              "rules": [
                "4 chạy, 10 chờ, 6 bị reject",
                "14 task xong sau 4.0 giây"
              ]
            },
            "notes": [
              "Task 13 được trao thẳng cho thread mới, chạy trước các task đang xếp hàng."
            ],
            "takeaway": "Task 13 không vào queue, vì queue đã đủ 10 chỗ"
          },
          {
            "title": "Queue không giới hạn",
            "diagram": {
              "kind": "pipe",
              "from": "task mới",
              "via": "queue không giới hạn",
              "to": "thread core",
              "skipped": [
                "max thread",
                "rejection policy"
              ],
              "skippedLabel": "Không bao giờ dùng"
            },
            "notes": [
              "Bước \"queue đầy\" không bao giờ xảy ra nên pool không vượt core và không reject."
            ],
            "takeaway": "Luôn dùng queue có giới hạn"
          }
        ],
        "conclusion": "**Kết luận:** queue có giới hạn hay không quyết định max có được dùng và pool có reject hay không."
      },
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
        {
          id: "forkjoin-work-stealing",
          title: "ForkJoinPool và work-stealing",
          intro: [
            "Pool thường có một hàng đợi chung cho mọi thread. Còn `parallelStream()` và `CompletableFuture` mặc định chạy trên một loại pool khác: **ForkJoinPool**. Nó thiết kế cho việc chia nhỏ đệ quy, và khác ở chỗ mỗi thread có hàng đợi riêng.",
            "Ý tưởng: chia bài toán thành các mảnh nhỏ (**fork**), giải từng mảnh, rồi gộp kết quả (**join**). Mỗi worker có một **deque** riêng chứa các mảnh của nó. Worker rảnh không ngồi chờ mà **ăn cắp việc** (work-stealing) từ deque của worker khác, từ phía ngược với phía chủ đang lấy. Nhờ vậy ít tranh chấp trên một hàng đợi chung, và tải tự cân bằng.",
            "Cách viết: kế thừa `RecursiveTask<V>` (có kết quả) hoặc `RecursiveAction` (không có). Nếu mảnh đủ nhỏ thì tính luôn; không thì chia đôi, `fork()` một nửa, tự `compute()` nửa còn lại, rồi `join()`.",
            "Mẹo: chỉ `fork()` một nửa và tự tính nửa kia, đừng fork cả hai, để thread hiện tại không đứng chờ vô ích.",
          ],
          widgetTitle: "Cộng 10 triệu số bằng fork/join, và pool dùng chung",
          compare: [
            way(
              "ForkJoinPool riêng",
              `class SumTask extends RecursiveTask<Long> {
          protected Long compute() {
            if (hi - lo <= 10_000) { /* cộng trực tiếp */ }
            int mid = (lo + hi) >>> 1;
            SumTask left = new SumTask(arr, lo, mid), right = new SumTask(arr, mid, hi);
            left.fork();
            long r = right.compute();
            return left.join() + r;
          }
        }
        new ForkJoinPool(4).invoke(new SumTask(arr, 0, arr.length));`,
              [
                ask("Mảng 10 triệu số 1", ok("Đã chạy: `sum = 10000000`.")),
                ask("`pool.getStealCount()` sau khi xong", ok("Đã chạy: `6` ở lần chạy này (pool 4 worker). Con số này đổi theo lần chạy; khác 0 nghĩa là có worker đã lấy việc từ deque của worker khác.")),
              ],
              "Chia nhỏ rồi gộp; worker rảnh tự đi lấy việc.",
            ),
            way(
              "Common pool (parallel stream, CompletableFuture mặc định)",
              `ForkJoinPool.commonPool().getParallelism();
        Runtime.getRuntime().availableProcessors();`,
              [
                ask("Máy 8 core", ok("Đã chạy: `commonPool` có parallelism `7`, tức số core trừ 1 (cộng thread gọi vào nữa là đủ core).")),
                ask("Giả lập container 2 CPU: `-XX:ActiveProcessorCount=2`", bad("Đã chạy: `availableProcessors()` là 2 và `commonPool` parallelism chỉ còn `1`. Pod giới hạn CPU nhỏ làm mọi parallel stream trong ứng dụng dùng chung một worker, nên chạy gần như tuần tự.")),
              ],
              "Pool dùng chung cho cả JVM: một task chậm ở đâu đó chiếm worker của mọi chỗ khác.",
            ),
          ],
          after: [
            "Vì common pool dùng chung, đừng ném việc chặn I/O (gọi DB, HTTP) vào `parallelStream()` hay `supplyAsync` mặc định: nó chiếm worker của toàn ứng dụng. Việc chặn nên có executor riêng (bài CompletableFuture, phần executor).",
          ],
          takeaway: {
            lines: [
              "ForkJoinPool: mỗi worker một deque, worker rảnh ăn cắp việc từ deque khác. Dành cho việc chia nhỏ, tính toán thuần CPU.",
              "Common pool có khoảng (số core - 1) worker và dùng chung cho parallel stream, CompletableFuture mặc định.",
            ],
          },
          quiz: {
            question: "Vì sao ForkJoinPool cho mỗi worker một deque riêng thay vì một hàng đợi chung?",
            options: [
              "Để các task chạy theo đúng thứ tự gửi vào",
              "Để giảm tranh chấp trên một hàng đợi; worker rảnh vẫn lấy việc từ worker bận khi cần (work-stealing)",
              "Để mỗi worker chỉ chạy việc của riêng mình",
              "Để chạy được việc chặn I/O tốt hơn",
            ],
            answer: 1,
            explain: "Mỗi worker lấy việc từ deque của mình nên ít tranh chấp; khi hết việc nó ăn cắp từ đầu kia của deque khác để tải cân bằng.",
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
      parts: [
        {
          id: "pool-ceiling",
          title: "Thread pool và connection pool: cái nào là trần",
          intro: [
            "Công thức trên tính số thread. Nhưng thread của Tomcat còn phải mượn connection từ HikariCP, và đó thường là chỗ nghẽn thật.",
            "Tình huống: API chậm khi tải cao. Ai đó tăng `server.tomcat.threads.max` từ 200 lên 400. API vẫn chậm, còn log bắt đầu có `Connection is not available, request timed out after 30000ms`.",
            "Các số mặc định cần nhớ (metadata của Spring Boot 3.5 và mặc định của HikariCP):",
            "- **Tomcat**: `server.tomcat.threads.max = 200`, `accept-count = 100` (hàng chờ khi mọi thread đều bận), `max-connections = 8192`.",
            "- **HikariCP**: `maximum-pool-size = 10`, `connection-timeout = 30000` ms (chờ mượn connection tối đa 30 s rồi ném lỗi).",
            "Công cụ để tính là **định luật Little**: `L = λ × W`. Số việc đang xử lý cùng lúc (L) bằng tốc độ việc đến (λ, request mỗi giây) nhân thời gian mỗi việc chiếm chỗ (W).",
            "Áp vào connection pool: mỗi request giữ connection 50 ms (cả transaction, không chỉ lúc chạy SQL). Pool 10 connection thì phục vụ tối đa `10 / 0,05 s = 200` request mỗi giây. Muốn chịu 300 request mỗi giây thì cần `L = 300 × 0,05 = 15` connection cùng lúc.",
          ],
          predict: {
            question: "Pool Hikari 10 connection, mỗi request giữ connection 50 ms, có 300 request mỗi giây. Tăng Tomcat từ 200 lên 400 thread thì throughput thế nào?",
            options: [
              "Tăng gấp đôi vì có gấp đôi thread",
              "Vẫn khoảng 200 request mỗi giây; thread thêm chỉ đứng chờ connection, hàng chờ dài ra và request bắt đầu timeout",
              "Tăng lên đúng 300 request mỗi giây",
              "Giảm về 0 vì Tomcat quá tải",
            ],
            answer: 1,
            explain: "Trần là `10 / 0,05 = 200` request mỗi giây, do connection pool quyết định. Thêm thread chỉ thêm người xếp hàng chờ mượn connection.",
          },
          after: [
            "Vì vậy khi tăng tải mà chậm, hỏi theo thứ tự:",
            "- **Rút ngắn W trước**: query thiếu index, gọi API ngoài trong `@Transactional`, N+1. Giảm từ 50 ms xuống 25 ms thì cùng pool 10 đã chịu được 400 request mỗi giây.",
            "- **Rồi mới tăng pool**: lên 15 hoặc 20 nếu database còn sức, và nhớ nhân với số pod so với `max_connections` của database.",
            "- **Để lỗi đến sớm**: `connection-timeout` 30 s nghĩa là người dùng chờ nửa phút mới nhận lỗi. Nhiều hệ thống hạ xuống vài giây để fail nhanh.",
            "Tomcat thì chỉ nên lớn hơn pool vừa đủ cho các request không đụng database. Thread chỉ chờ connection thì không làm được gì mà vẫn tốn bộ nhớ stack.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Throughput tối đa ≈ số connection / thời gian giữ connection → thêm thread không nâng trần đó → giảm thời gian giữ connection trước, rồi mới tăng pool.",
            ],
          },
          quiz: {
            question: "Theo định luật Little, API nhận 400 request mỗi giây, mỗi request giữ connection 25 ms. Cần khoảng bao nhiêu connection cùng lúc?",
            options: ["4", "10", "16", "400"],
            answer: 1,
            explain: "`L = λ × W = 400 × 0,025 = 10`. Pool mặc định 10 vừa đủ, chưa có dư cho lúc tải tăng đột biến.",
          },
        },
        {
          id: "pool-starvation",
          title: "Thread pool starvation: task chờ task con trong cùng pool",
          intro: [
            "Ta đã chọn kích thước pool theo tài nguyên phía sau. Còn một cách pool tự khoá chính mình dù không có lock nào: **starvation deadlock**.",
            "Tình huống: pool cố định N thread. Một task chạy trong pool, rồi nó `submit()` thêm một task con **vào cùng pool** và `get()` để chờ kết quả. Nếu N task cha cùng chiếm hết N thread và đều đang chờ con, không còn thread nào để chạy các task con. Cha chờ con, con chờ thread, thread bị cha giữ.",
            "Đặc điểm khó chịu: **không có lock nào**, nên thread dump không báo deadlock. Nó chỉ cho thấy mọi thread của pool đang WAITING trên `Future.get()`.",
          ],
          predict: {
            question: "Pool 2 thread. Hai task cha, mỗi task `submit` một task con vào cùng pool rồi `get()`. Chuyện gì xảy ra?",
            options: [
              "Chạy bình thường, ra 4",
              "Treo mãi: 2 thread bị 2 task cha giữ, task con không có thread để chạy",
              "Ném `RejectedExecutionException`",
              "Pool tự thêm thread",
            ],
            answer: 1,
            explain: "Pool cố định không tự nở thêm. Cả hai thread đang chờ, hàng đợi chứa hai task con không ai lấy.",
          },
          widgetTitle: "Cùng đoạn code, pool 2 thread rồi pool 3 thread",
          compare: [
            way(
              "Pool 2 thread, 2 task cha",
              `ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Integer> f = pool.submit(
            () -> pool.submit(() -> 1).get() + 1);
        // hai task cha như vậy, f.get(2, SECONDS)`,
              [
                ask("Hai task cha, chờ tối đa 2 giây", bad("Đã chạy: `TimeoutException after 2s`. Thread dump cho thấy cả hai thread `pool-1-thread-1` và `pool-1-thread-2` đều `WAITING`.")),
              ],
              "Mọi thread đều chờ, không ai chạy task con.",
            ),
            way(
              "Pool 3 thread, 2 task cha",
              `ExecutorService pool = Executors.newFixedThreadPool(3);
        // cùng đoạn code, cùng hai task cha`,
              [
                ask("Hai task cha", ok("Đã chạy: `done sum=4`. Còn dư một thread để chạy task con. Đây là lý do lỗi ẩn lâu: chạy ổn khi tải nhẹ, treo khi đủ nhiều task cha cùng lúc.")),
              ],
              "May mắn vì pool dư thread, không phải vì code đúng.",
            ),
          ],
          after: [
            "Cách tránh:",
            "- **Đừng chờ (`get()`/`join()`) task con trong cùng pool** với task cha. Thay bằng chuỗi `CompletableFuture` (`thenCompose`, `thenApply`) để không chiếm thread khi chờ.",
            "- **Tách pool** theo tầng (task cha một pool, task con một pool khác), hoặc tính trực tiếp trong task cha nếu việc con nhỏ.",
            "- Ở mọi pool, đặt giới hạn thời gian cho `get(timeout)` để lỗi lộ ra sớm thay vì treo.",
          ],
          takeaway: {
            lines: [
              "Task chờ kết quả của task con trong cùng pool bị chặn có thể làm pool tự khoá: chờ nhau mà không có lock nào.",
            ],
          },
          quiz: {
            question: "Dấu hiệu nào trong thread dump gợi ý pool starvation?",
            options: [
              "Có thread BLOCKED trên một `synchronized`",
              "Mọi thread của pool WAITING trên `Future.get()`, hàng đợi vẫn còn task chờ chạy",
              "Một thread RUNNABLE chiếm 100% CPU",
              "Có dòng `Found one Java-level deadlock`",
            ],
            answer: 1,
            explain: "Đây không phải deadlock của lock nên jstack không báo; thread chờ future mà thread chạy future đó lại không có.",
          },
        },
      ],
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
