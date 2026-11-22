import timeline from "../timelines/thread.json";
import type { Lesson, Scene } from "../types";

// Every output below was observed on JDK 21 (8 CPUs).
export const thread: Lesson = {
  slug: "thread",
  crumb: "Thread Basics",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/thread-basics",
  videoVersion: "c55cb644",
  scenes: timeline as Scene[],
  title: "Thread Basics: nền móng của concurrency",
  subtitle:
    "Process và thread (chung heap, riêng stack), Runnable và Callable, submit() nuốt exception, 6 trạng thái thread, start() vs run(), daemon thread, và interrupt là cơ chế hợp tác.",
  openingQuiz: {
    question: 'Thread t = new Thread(task, "my-thread"); t.run(); task in tên thread hiện tại. Kết quả là gì?',
    options: ["run in my-thread", "run in main", "IllegalThreadStateException", "Không in gì vì chưa start()"],
    answer: 1,
    explain:
      "run() chỉ là gọi method bình thường trên thread hiện tại. Đã chạy: in \"run in main\". Muốn có thread mới phải gọi start(), khi đó in \"run in my-thread\".",
  },
  roadmap: [
    "Chặng 1: process vs thread, vì sao singleton bean phải stateless; Runnable, Callable, submit() vs execute().",
    "Chặng 2: 6 trạng thái thread (không có RUNNING) và các bẫy khi đọc thread dump.",
    "Chặng 3: start() vs run() và join(), daemon thread, interrupt.",
  ],
  sections: [
    {
      id: "process-thread",
      title: "Phần 1: Process và Thread",
      scene: "proc",
      intro: [
        "**Process** là chương trình đang chạy với vùng nhớ riêng (mỗi `java -jar app.jar` là một process). **Thread** là luồng thực thi bên trong process: các thread trong cùng JVM **dùng chung heap** (object, static field) nhưng **mỗi thread có stack riêng** (biến local, lời gọi method). Như một căn nhà: chung tủ lạnh, mỗi người một cuốn sổ; hai người cùng lấy hộp sữa cuối là race condition.",
        "Vì vậy singleton bean phải stateless: mọi thread Tomcat dùng chung một instance, nên field kiểu `private User currentUser` làm request A đọc ra user của request B. Dữ liệu theo request phải là biến local, tham số, hoặc `ThreadLocal` (mỗi thread một bản riêng, học ở bài Deadlock & ThreadLocal).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Các thread dùng chung heap → field của singleton bean bị mọi request cùng đọc ghi → bean phải stateless.",
          "Dữ liệu theo request đặt ở biến local, tham số hoặc `ThreadLocal`.",
        ],
      },
      quiz: {
        question: "Câu nào đúng về các thread trong cùng một JVM?",
        options: ["Mỗi thread có heap riêng", "Dùng chung heap, mỗi thread có stack riêng", "Dùng chung cả stack", "Mỗi thread là một process"],
        answer: 1,
        explain: "Biến local nằm trên stack nên tự nhiên thread-safe; field của object dùng chung thì không.",
      },
    },
    {
      id: "runnable-callable",
      title: "Phần 2: Runnable, Callable và submit()",
      scene: "create",
      intro: [
        "`Runnable.run()` không trả kết quả, không ném checked exception; `Callable<V>.call()` trả kết quả qua `Future<V>` và ném được exception. Chúng chỉ mô tả **công việc**; `Thread` là **người làm việc**. Trong code thật không tự `new Thread()` mà dùng executor.",
        "Ví dụ dưới đây dùng `ExecutorService ex = Executors.newFixedThreadPool(2);`: một pool giữ sẵn 2 thread, bạn chỉ gửi task vào (học kỹ ở bài Thread Pool). Có hai cách gửi: `ex.execute(task)` chỉ chạy, không trả gì; `ex.submit(task)` trả về một `Future`, tức là \"phiếu hẹn\" để lấy kết quả sau.",
        "`ex.submit(() -> 6 * 7).get()` ra 42; `get()` chặn tới khi có kết quả.",
        "Khác biệt lớn nằm ở khi task ném lỗi. Với `execute()`, lỗi bay ra khỏi thread và được in ra log. Với `submit()`, lỗi được **cất vào Future**: không gọi `get()` thì không có dòng log nào (đó là bẫy \"`submit()` nuốt exception\"). Gọi `get()` thì nó ném lại lỗi dưới dạng `ExecutionException` bọc lỗi gốc, lấy lỗi gốc bằng `getCause()`.",
        "Một exception không bắt trong thread con chỉ làm chết thread đó, không làm chết `main` (đã chạy: thread `crasher` chết, `main` vẫn chạy tiếp). Vì vậy lỗi trong thread khác rất dễ bị bỏ sót.",
      ],
      predict: {
        question: "Một task ném exception, được gửi bằng `ex.submit(task)` và **không ai gọi** `get()`. Log in ra gì?",
        options: [
          "Stack trace của exception, như mọi lỗi khác",
          "Không có dòng log nào, lỗi nằm im trong `Future`",
          "Ứng dụng dừng hẳn",
          "Thread `main` chết theo",
        ],
        answer: 1,
        explain: "`submit()` cất lỗi vào `Future`. Chỉ khi gọi `get()` lỗi mới ném lại, bọc trong `ExecutionException`. Với `execute()` thì lỗi mới được in ra log.",
      },
      widget: "submit-vs-execute",
      widgetTitle: "Task lỗi: submit hay execute?",
      quiz: {
        question: "Gọi future.get() trên task đã ném IllegalStateException(\"boom\") thì nhận được gì?",
        options: ["null", "ExecutionException, getCause() là IllegalStateException: boom", "IllegalStateException trực tiếp", "Không có gì"],
        answer: 1,
        explain: "Executor bọc lỗi vào ExecutionException. Đã chạy: e.getCause() in java.lang.IllegalStateException: boom.",
      },
    },
    {
      id: "states",
      title: "Phần 3: 6 trạng thái thread",
      scene: "states",
      intro: [
        "`Thread.State` có đúng 6 giá trị: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED. **Không có RUNNING**: đang chạy trên CPU hay đang chờ CPU đều là RUNNABLE, vì cấp CPU là việc của hệ điều hành.",
        "Đã dẫn một thread đi qua đủ 6 trạng thái:",
        "- **NEW**: trước `start()`.",
        "- **RUNNABLE**: đang chạy vòng lặp.",
        "- **BLOCKED**: muốn vào `synchronized` khi main đang giữ lock (`synchronized` cho chỉ một thread vào đoạn code đó tại một lúc, thread khác đứng chờ; học kỹ ở bài sync).",
        "- **WAITING**: sau `lock.wait()`.",
        "- **TIMED_WAITING**: đang `sleep(300)`.",
        "- **TERMINATED**: sau `join()`.",
      ],
      widget: "thread-state",
      widgetTitle: "t.getState() trả về gì?",
      quiz: {
        question: "Java có trạng thái RUNNING không?",
        options: ["Có", "Không, thread đang chạy hay chờ CPU đều là RUNNABLE", "Chỉ có ở virtual thread", "Có, nhưng chỉ hiện trong thread dump"],
        answer: 1,
        explain: "Thread.State.values() in đúng [NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED].",
      },
    },
    {
      id: "state-traps",
      title: "Phần 4: Bẫy khi đọc trạng thái",
      scene: "traps",
      intro: [
        "Trạng thái thread hay được đọc qua **thread dump**: ảnh chụp mọi thread trong JVM, mỗi thread kèm trạng thái và dòng code nó đang dừng. Lấy bằng lệnh `jstack <pid>`.",
        "Bẫy đầu tiên: **trạng thái không nói thread có đang dùng CPU hay không**. Thread đang chờ I/O (đọc socket, chờ DB) vẫn là **RUNNABLE**, vì với JVM nó đang chạy một lệnh đọc. 200 thread Tomcat RUNNABLE dừng ở hàm đọc socket của JDBC là đang chờ DB, không phải đang ăn CPU.",
        "Bẫy thứ hai: BLOCKED chỉ dành cho `synchronized`. Thread chờ `ReentrantLock.lock()` (một khoá viết bằng code, học ở bài sync) lại là **WAITING** (đã đo), vì bên trong nó đứng chờ bằng cơ chế park như `wait()`.",
        "Đọc dump thế nào: nhiều thread WAITING ở `ThreadPoolExecutor.getTask` thường là thread rảnh chờ việc, bình thường. Đáng lo là nhiều thread BLOCKED trên cùng một lock, hoặc thread kẹt WAITING ở `HikariPool.getConnection` (đang chờ một connection DB còn trống).",
      ],
      takeaway: {
        lines: [
          "Trạng thái không nói thread có dùng CPU hay không: chờ I/O vẫn là RUNNABLE. Nhìn dòng code trong dump mới biết thread đang làm gì.",
          "BLOCKED chỉ dành cho `synchronized`; chờ `ReentrantLock` là WAITING.",
        ],
      },
      quiz: {
        question: "Thread dump cho thấy 200 thread Tomcat đều RUNNABLE, dừng ở hàm đọc socket của JDBC. Điều đó nghĩa là gì?",
        options: [
          "CPU đang quá tải vì 200 thread cùng tính toán",
          "Các thread đang chờ database trả lời; RUNNABLE không có nghĩa là đang dùng CPU",
          "Các thread bị deadlock",
          "JVM đang chạy GC",
        ],
        answer: 1,
        explain: "Chờ I/O vẫn là RUNNABLE. Nhìn dòng code trong dump (đọc socket) mới biết thread đang chờ DB, nên hướng điều tra là query chậm hoặc DB quá tải.",
      },
      parts: [
        {
          id: "sleep-wait",
          title: "sleep() và wait(): khác nhau ở lock",
          intro: [
            "Trong dump, WAITING và TIMED_WAITING hay đến từ hai lời gọi trông giống nhau: `sleep()` và `wait()`. Khác biệt nằm ở lock.",
            "`sleep(ms)` chỉ ngủ một lúc và **giữ nguyên lock** đang cầm: thread khác muốn vào cùng `synchronized` vẫn phải chờ.",
            "`wait()` thì **nhả lock** của object trong lúc chờ, để thread khác vào được, và dậy khi thread khác gọi `notify()` (đánh thức một thread đang chờ trên object đó) hoặc `notifyAll()` (đánh thức tất cả), hoặc khi hết timeout. Khi dậy, nó phải lấy lại lock rồi mới chạy tiếp.",
            "Vì sao `wait()` phải gọi trong `synchronized` trên chính object đó: nó cần nhả lock, mà chỉ nhả được lock mình đang giữ. Gọi ngoài `synchronized` thì ném `IllegalMonitorStateException`. `notify()` cũng vậy.",
            "Ứng dụng kinh điển là **producer-consumer**: thread sản xuất bỏ việc vào hàng đợi, thread tiêu thụ lấy ra; hàng rỗng thì tiêu thụ `wait()`, có việc mới thì sản xuất `notify()`. Trong code thật hãy dùng `BlockingQueue`: `put()` tự chờ khi đầy, `take()` tự chờ khi rỗng, không phải tự viết `wait/notify`.",
          ],
          quiz: {
            question: "sleep() và wait() khác nhau thế nào về lock?",
            options: ["Cả hai nhả lock", "sleep() giữ lock, wait() nhả lock", "sleep() nhả lock, wait() giữ lock", "Không liên quan đến lock"],
            answer: 1,
            explain: "wait() phải gọi trong synchronized trên chính object đó, nhả lock trong lúc chờ và dậy khi có notify hoặc hết timeout.",
          },
        },
      ],
    },
    {
      id: "start-run",
      title: "Phần 5: start() vs run() và join()",
      scene: "start",
      intro: [
        "`start()` yêu cầu JVM tạo thread mới rồi thread đó gọi `run()`. Gọi `run()` trực tiếp chỉ là gọi method trên thread hiện tại: code vẫn chạy đúng nhưng tuần tự, không exception nào báo. Một thread chỉ `start()` được một lần; lần hai ném `IllegalThreadStateException`.",
        "`join()` chờ thread kia kết thúc và đảm bảo nhìn thấy kết quả nó ghi. Gọi `join()` ngay sau từng `start()` trong vòng lặp cũng biến song song thành tuần tự: `start()` hết rồi mới `join()` hết.",
      ],
      board: {
        "title": "start() tạo thread mới, run() chỉ là gọi method",
        "highlight": "start() tạo thread mới",
        "chips": [
          "Chỉ start() được một lần",
          "join() chờ thread kết thúc"
        ],
        "cards": [
          {
            "title": "start() và run()",
            "diagram": {
              "kind": "pipe",
              "from": "t.start()",
              "via": "JVM tạo thread mới",
              "to": "run() chạy ở thread mới",
              "skipped": [
                "t.run() trực tiếp"
              ],
              "skippedLabel": "Chạy trên thread hiện tại"
            },
            "notes": [
              "Gọi `run()` trực tiếp vẫn đúng nhưng tuần tự, không exception nào báo."
            ],
            "takeaway": "Muốn song song phải gọi start()"
          },
          {
            "title": "Chờ 3 việc xong",
            "diagram": {
              "kind": "flow",
              "steps": [
                "Tạo 3 thread",
                "start() cả 3",
                "join() cả 3"
              ],
              "ok": [
                "start hết rồi mới join",
                "Chạy song song"
              ],
              "bad": [
                "join() ngay sau mỗi start()",
                "Biến thành tuần tự"
              ]
            },
            "notes": [
              "Start lần hai ném `IllegalThreadStateException`."
            ],
            "code": "for (Thread t : ts) t.start();\nfor (Thread t : ts) t.join();",
            "takeaway": "Start hết rồi mới join"
          }
        ],
        "conclusion": "**Kết luận:** start() hết để chạy cùng lúc, rồi mới join() hết."
      },
      widget: "run-vs-start",
      widgetTitle: "Chạy từng dòng",
      quiz: {
        question: "Chạy 3 việc song song rồi chờ cả 3 xong, cách nào đúng?",
        options: [
          "for (t : ts) { t.start(); t.join(); }",
          "for (t : ts) t.start(); rồi for (t : ts) t.join();",
          "for (t : ts) t.run();",
          "for (t : ts) t.join(); rồi for (t : ts) t.start();",
        ],
        answer: 1,
        explain: "Start hết để chúng chạy cùng lúc, rồi mới chờ. Trong code thật dùng executor + invokeAll hoặc CompletableFuture.allOf.",
      },
    },
    {
      id: "daemon",
      title: "Phần 6: Daemon thread",
      scene: "daemon",
      intro: [
        "JVM chỉ thoát khi không còn thread non-daemon nào chạy; daemon thread bị dừng ngang giữa chừng. Thread con in 5 dòng, main ngủ 0.5 giây rồi kết thúc: non-daemon in đủ 5 dòng, daemon chỉ in được 2 dòng rồi JVM thoát.",
        "Thread tạo từ `main` mặc định non-daemon (đã đo `isDaemon() = false`); virtual thread luôn là daemon. `setDaemon()` phải gọi trước `start()`; gọi khi thread đang chạy thì ném `IllegalThreadStateException`.",
      ],
      predict: {
        question: "Thread con in 5 dòng, cách nhau một lúc. `main` ngủ 0,5 giây rồi kết thúc. Nếu thread con là **daemon** thì sao?",
        options: [
          "In đủ 5 dòng, JVM chờ nó xong mới thoát",
          "Chỉ in được vài dòng, JVM thoát khi `main` xong và dừng ngang thread daemon",
          "Không in dòng nào",
          "Ném `IllegalThreadStateException`",
        ],
        answer: 1,
        explain: "JVM chỉ chờ các thread non-daemon. `main` kết thúc là không còn thread non-daemon nào, nên JVM thoát và thread daemon bị dừng giữa chừng.",
      },
      widget: "daemon-ticks",
      widgetTitle: "Bật tắt daemon",
      quiz: {
        question: "Vì sao không nên ghi file trên daemon thread?",
        options: [
          "Vì daemon thread chạy chậm hơn",
          "Vì JVM tắt là daemon thread bị dừng ngang, việc ghi có thể dở dang",
          "Vì daemon thread không có quyền ghi file",
          "Vì daemon thread không dùng được try-finally",
        ],
        answer: 1,
        explain: "JVM không chờ daemon thread, nên không gì đảm bảo việc dở dang được hoàn tất.",
      },
    },
    {
      id: "interrupt",
      title: "Phần 7: Interrupt",
      scene: "interrupt",
      intro: [
        "Java không có cách an toàn để giết thread (`Thread.stop()` đã bị bỏ). Interrupt giống gõ cửa nhắc người bên trong dừng việc, chứ không lôi họ ra khỏi phòng: dừng hay không là việc của thread đó. `t.interrupt()` chỉ bật một cờ: thread đang chặn ở `sleep`, `wait`, `join`, `BlockingQueue.take` bị đánh thức ngay bằng `InterruptedException` và **cờ bị xoá**; thread đang tính toán phải tự kiểm tra cờ. Có hai cách đọc cờ: `t.isInterrupted()` chỉ đọc; `Thread.interrupted()` là method static, đọc cờ của **thread hiện tại rồi xoá nó**. Đã chạy: sau `interrupt()`, gọi `isInterrupted()` hai lần ra `true, true`; gọi `Thread.interrupted()` hai lần ra `true, false`.",
        "Đã đo: thread `sleep(10_000)` bị interrupt sau 100 ms thì kết thúc sau 115 ms; trong `catch`, `isInterrupted()` là false, gọi lại `interrupt()` thì thành true. Đừng nuốt `InterruptedException`: ném tiếp hoặc gọi lại `interrupt()`. Lý do: code phía trên call stack (vòng lặp gọi bạn, executor) **chỉ biết phải dừng nhờ cờ này**; xoá cờ mà không báo lại là tín hiệu dừng biến mất. `shutdownNow()` và `future.cancel(true)` đều dừng task bằng interrupt.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Bắt `InterruptedException` → cờ đã bị xoá → gọi lại `interrupt()` hoặc ném tiếp → code phía trên vẫn biết phải dừng.",
        ],
      },
      quiz: {
        question: "Thread.interrupted() và isInterrupted() khác nhau thế nào?",
        options: [
          "Giống hệt nhau",
          "interrupted() là static, đọc cờ của thread hiện tại và xoá cờ; isInterrupted() chỉ đọc",
          "isInterrupted() xoá cờ, interrupted() thì không",
          "interrupted() ném InterruptedException",
        ],
        answer: 1,
        explain: "Dùng nhầm interrupted() có thể làm mất tín hiệu dừng.",
      },
    },
  ],
  modelAnswer:
    "Process là chương trình đang chạy với vùng nhớ riêng, thread là luồng thực thi bên trong process; các thread chia sẻ heap nhưng mỗi thread có stack riêng, nên biến local an toàn còn field dùng chung phải đồng bộ, và singleton bean phải stateless. Runnable không trả kết quả, Callable trả kết quả qua Future; em không tự new Thread mà dùng executor, và nhớ submit() nuốt exception nếu không gọi get(). Thread có 6 trạng thái, không có RUNNING; thread chờ I/O vẫn là RUNNABLE, BLOCKED chỉ dành cho synchronized. start() tạo thread mới còn gọi run() chỉ chạy trên thread hiện tại. Daemon thread bị JVM bỏ lại khi thoát. Dừng thread là cơ chế hợp tác qua interrupt: khi bắt InterruptedException em gọi lại interrupt() để khôi phục cờ, vì shutdownNow() dựa vào nó.",
};
