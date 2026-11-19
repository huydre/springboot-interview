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
        "Vì vậy singleton bean phải stateless: mọi thread Tomcat dùng chung một instance, nên field kiểu `private User currentUser` làm request A đọc ra user của request B. Dữ liệu theo request phải là biến local, tham số, hoặc `ThreadLocal`. Một exception không bắt trong thread con không làm chết `main` (đã chạy: thread `crasher` chết, `main` vẫn chạy tiếp).",
      ],
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
        "`ex.submit(() -> 6 * 7).get()` ra 42; `get()` chặn tới khi có kết quả. Bẫy lớn: **`submit()` nuốt exception**, lỗi được cất trong Future, không gọi `get()` thì không có dòng log nào.",
      ],
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
        "Đã dẫn một thread đi qua đủ 6 trạng thái: trước `start()` là NEW, chạy vòng lặp là RUNNABLE, muốn vào `synchronized` khi main đang giữ lock là BLOCKED, sau `lock.wait()` là WAITING, đang `sleep(300)` là TIMED_WAITING, sau `join()` là TERMINATED.",
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
        "Thread đang chờ I/O (đọc socket, chờ DB) là **RUNNABLE**: 200 thread Tomcat RUNNABLE dừng ở hàm đọc socket của JDBC là đang chờ DB, không phải đang ăn CPU. BLOCKED chỉ dành cho `synchronized`; thread chờ `ReentrantLock.lock()` là **WAITING** (đã đo).",
        "`sleep()` giữ nguyên lock đang cầm; `wait()` nhả lock của object và phải gọi trong `synchronized`. Nhiều thread WAITING ở `ThreadPoolExecutor.getTask` thường là thread rảnh chờ việc, bình thường; đáng lo là nhiều thread BLOCKED trên cùng một lock, hoặc thread kẹt WAITING ở `HikariPool.getConnection`.",
      ],
      quiz: {
        question: "sleep() và wait() khác nhau thế nào về lock?",
        options: ["Cả hai nhả lock", "sleep() giữ lock, wait() nhả lock", "sleep() nhả lock, wait() giữ lock", "Không liên quan đến lock"],
        answer: 1,
        explain: "wait() phải gọi trong synchronized trên chính object đó, nhả lock trong lúc chờ và dậy khi có notify hoặc hết timeout.",
      },
    },
    {
      id: "start-run",
      title: "Phần 5: start() vs run() và join()",
      scene: "start",
      intro: [
        "`start()` yêu cầu JVM tạo thread mới rồi thread đó gọi `run()`. Gọi `run()` trực tiếp chỉ là gọi method trên thread hiện tại: code vẫn chạy đúng nhưng tuần tự, không exception nào báo. Một thread chỉ `start()` được một lần; lần hai ném `IllegalThreadStateException`.",
        "`join()` chờ thread kia kết thúc và đảm bảo nhìn thấy kết quả nó ghi. Gọi `join()` ngay sau từng `start()` trong vòng lặp cũng biến song song thành tuần tự: `start()` hết rồi mới `join()` hết.",
      ],
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
        "Java không có cách an toàn để giết thread (`Thread.stop()` đã bị bỏ). `t.interrupt()` chỉ bật một cờ: thread đang chặn ở `sleep`, `wait`, `join`, `BlockingQueue.take` bị đánh thức ngay bằng `InterruptedException` và **cờ bị xoá**; thread đang tính toán phải tự kiểm tra `isInterrupted()`.",
        "Đã đo: thread `sleep(10_000)` bị interrupt sau 100 ms thì kết thúc sau 115 ms; trong `catch`, `isInterrupted()` là false, gọi lại `interrupt()` thì thành true. Đừng nuốt `InterruptedException`: ném tiếp hoặc gọi lại `interrupt()`, vì `shutdownNow()` và `future.cancel(true)` đều dừng task bằng interrupt.",
      ],
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
