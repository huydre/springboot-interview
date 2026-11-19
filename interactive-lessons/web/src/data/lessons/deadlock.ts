import timeline from "../timelines/deadlock.json";
import type { Lesson, Scene } from "../types";

// Measured on JDK 21 (8 CPUs). Spring Boot configuration is described from the docs, not measured.
export const deadlock: Lesson = {
  slug: "deadlock",
  crumb: "Deadlock, ThreadLocal & Virtual Threads",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/deadlock-threadlocal-vt",
  videoVersion: "450e382d",
  scenes: timeline as Scene[],
  title: "Deadlock, ThreadLocal & Virtual Threads",
  subtitle:
    "Deadlock và 4 điều kiện Coffman, phát hiện bằng jstack và ThreadMXBean, phòng tránh trong JVM và DB, ThreadLocal trong Spring và bẫy rò dữ liệu, virtual threads, pinning, và race khi chạy nhiều instance.",
  openingQuiz: {
    question: "Service treo, CPU thấp, thread dump thấy 2 thread BLOCKED chờ nhau. Cách phòng tránh phổ biến nhất?",
    options: ["Tăng số thread", "Lấy lock theo thứ tự cố định (ví dụ id nhỏ trước)", "Gọi System.gc()", "Đổi sang volatile"],
    answer: 1,
    explain: "Phá điều kiện circular wait. Đã chạy: hai giao dịch ngược chiều khoá theo thứ tự id đều xong, không treo.",
  },
  roadmap: [
    "Chặng 1: deadlock, 4 điều kiện Coffman, phát hiện và phòng tránh (cả ở DB).",
    "Chặng 2: ThreadLocal trong Spring, bẫy rò dữ liệu và TaskDecorator.",
    "Chặng 3: virtual threads, pinning, giới hạn DB pool, và race khi chạy nhiều instance.",
  ],
  sections: [
    {
      id: "deadlock",
      title: "Phần 1: Deadlock và 4 điều kiện Coffman",
      scene: "dl",
      intro: [
        "Deadlock: các thread chờ nhau thành vòng, mỗi bên giữ thứ bên kia cần. Đã chạy: thread 1 khoá A rồi chờ B, thread 2 khoá B rồi chờ A, sau 500 ms cả hai `BLOCKED`, không dòng \"done\" nào được in.",
        "Cần đủ 4 điều kiện Coffman: mutual exclusion, hold and wait, no preemption (phá bằng `tryLock(timeout)`), circular wait (phá bằng thứ tự lock cố định). Deadlock `synchronized` không timeout, không exception, CPU thấp, dễ chẩn đoán nhầm là service chậm.",
      ],
      widget: "deadlock-order",
      widgetTitle: "Đổi thứ tự lấy lock",
      quiz: {
        question: "Deadlock khác livelock thế nào?",
        options: ["Giống nhau", "Deadlock: đứng yên chờ nhau; livelock: vẫn chạy nhưng liên tục nhường nhau nên không ai tiến triển", "Livelock chỉ có ở DB", "Deadlock chỉ có ở virtual thread"],
        answer: 1,
        explain: "Starvation thì là một thread mãi không được tài nguyên vì thread khác luôn được ưu tiên.",
      },
    },
    {
      id: "detect",
      title: "Phần 2: Phát hiện deadlock",
      scene: "detect",
      intro: [
        "`jstack <pid>` (hoặc `jcmd <pid> Thread.print`) in đoạn \"Found one Java-level deadlock\", ghi rõ thread nào giữ lock nào và chờ lock nào. Trong code, `ThreadMXBean.findDeadlockedThreads()`: đã chạy ra `deadlocked count=2` và `transfer-1-to-2 waits … held by transfer-2-to-1`.",
        "Đặt tên thread, chụp thread dump 2–3 lần cách nhau vài giây, và dùng `/actuator/threaddump` khi không vào được máy chủ.",
      ],
      quiz: {
        question: "Service treo, CPU thấp, request timeout hàng loạt. Bước đầu tiên?",
        options: ["Restart ngay", "Lấy thread dump 2–3 lần: tìm deadlock, thread BLOCKED cùng lock, thread chờ HikariPool.getConnection", "Tăng heap", "Tắt GC"],
        answer: 1,
        explain: "Song song xem metric connection pool và log DB.",
      },
    },
    {
      id: "avoid",
      title: "Phần 3: Phòng tránh deadlock",
      scene: "avoid",
      intro: [
        "Luôn khoá tài khoản id nhỏ trước: hai giao dịch 1→2 và 2→1 chạy đồng thời đều xong (415 ms trong lần đo này). Không áp được thứ tự thì `tryLock` có timeout, thất bại thì nhả hết, chờ ngẫu nhiên rồi thử lại để tránh livelock.",
        "Deadlock ở DB: DB tự phát hiện và rollback một transaction (MySQL 1213, PostgreSQL \"deadlock detected\"); Spring dịch thành exception con của `PessimisticLockingFailureException`. Update row theo thứ tự id, transaction ngắn, và retry cả transaction. Đừng gọi callback hay HTTP khi đang giữ lock.",
      ],
      quiz: {
        question: "Vì sao cần sleep ngẫu nhiên trước khi thử lại tryLock?",
        options: ["Để giảm CPU", "Để hai thread không thử lại cùng nhịp mãi (livelock)", "Để GC chạy", "Không cần"],
        answer: 1,
        explain: "Chờ ngẫu nhiên làm lệch nhịp để một bên thắng.",
      },
    },
    {
      id: "threadlocal",
      title: "Phần 4: ThreadLocal",
      scene: "tl",
      intro: [
        "`ThreadLocal` cho mỗi thread một bản sao riêng. Spring dùng cho `SecurityContextHolder`, `TransactionSynchronizationManager` (transaction của `@Transactional`), `RequestContextHolder` và MDC: đó là lý do một request gắn với một thread.",
        "Bẫy: pool tái sử dụng thread. Đã chạy pool 1 thread: request 1 set \"alice\" quên remove thì request 2 đọc ra \"alice\"; remove trong finally thì null. ThreadLocal không tự sang thread khác (`supplyAsync` đọc null): dùng `TaskDecorator` để copy MDC và SecurityContext. `InheritableThreadLocal` không giải quyết được với pool.",
      ],
      widget: "threadlocal-leak",
      widgetTitle: "Quên remove() thì sao",
      quiz: {
        question: "Trong @Transactional, gọi CompletableFuture.supplyAsync(() -> repo.save(x)): save có nằm trong transaction không?",
        options: ["Có", "Không: transaction gắn với thread gọi qua ThreadLocal, thread của pool không có nó", "Chỉ khi dùng virtual thread", "Tuỳ database"],
        answer: 1,
        explain: "save chạy trong transaction riêng hoặc không có, không rollback theo transaction ngoài.",
      },
    },
    {
      id: "virtual-threads",
      title: "Phần 5: Virtual threads",
      scene: "vt",
      intro: [
        "Virtual thread (Java 21) do JVM quản lý, chạy trên vài carrier thread. Khi chặn I/O hay sleep, JVM gỡ nó khỏi carrier để carrier chạy việc khác. Đã đo 10.000 task `sleep(100)`: pool 200 platform thread 5249 ms, virtual thread per task 168 ms.",
        "Virtual thread giúp chờ rẻ hơn, không làm tính toán nhanh hơn: tác vụ CPU-bound ngang nhau vì vẫn chỉ 8 CPU. Spring Boot 3.2+ trên Java 21: `spring.threads.virtual.enabled=true`. Virtual thread luôn là daemon.",
      ],
      widget: "vt-compare",
      widgetTitle: "Số đo virtual thread",
      quiz: {
        question: "Virtual thread giúp loại tác vụ nào?",
        options: ["CPU-bound", "I/O-bound với số lượng lớn (web request gọi DB, HTTP)", "Mọi loại đều nhanh hơn", "Chỉ batch job"],
        answer: 1,
        explain: "Nó làm việc chờ rẻ hơn để phục vụ nhiều việc đang chờ cùng lúc.",
      },
    },
    {
      id: "pinning",
      title: "Phần 6: Pinning và các lưu ý",
      scene: "pin",
      intro: [
        "Java 21–23: chặn bên trong `synchronized` ghim virtual thread vào carrier. Đã đo 100 virtual thread `sleep(100)` trong synchronized mất 1345 ms (chỉ 8 carrier, 13 đợt), trong `ReentrantLock` mất 101 ms. Java 24 (JEP 491) đã sửa. Bật `-Djdk.tracePinnedThreads=short` để thấy chỗ bị pin.",
        "Không pool virtual thread; muốn giới hạn thì dùng `Semaphore`. DB connection pool vẫn là giới hạn thật: 1000 virtual thread qua `Semaphore(10)` × 50 ms mất 5424 ms.",
      ],
      quiz: {
        question: "Bật virtual threads cho app dùng JDBC driver cũ nhiều synchronized quanh I/O trên Java 21 có thể gây gì?",
        options: ["Nhanh gấp đôi", "Có thể chậm hơn vì pinning", "Không ảnh hưởng", "Lỗi biên dịch"],
        answer: 1,
        explain: "Kiểm tra bằng jdk.tracePinnedThreads hoặc JFR, nâng driver, hoặc lên Java 24+.",
      },
    },
    {
      id: "multi-instance",
      title: "Phần 7: Race khi chạy nhiều instance",
      scene: "multi",
      intro: [
        "`synchronized` chỉ khoá trong một JVM. Chạy 3 instance thì hai request vào hai instance cùng thấy \"còn 1\" và cùng trừ: bán 2, kho chỉ có 1.",
        "Khoá ở nơi dữ liệu dùng chung: `UPDATE product SET stock = stock - 1 WHERE id = ? AND stock >= 1` rồi kiểm tra số row bị ảnh hưởng; `@Version` cho optimistic lock; `SELECT ... FOR UPDATE` khi tranh chấp cao; distributed lock (Redis, có TTL) là lựa chọn cuối cùng.",
      ],
      quiz: {
        question: "Vì sao synchronized không chống được bán vượt kho khi chạy 3 instance?",
        options: ["Vì synchronized chậm", "Mỗi instance là một JVM với lock riêng; phải khoá ở DB hoặc dùng distributed lock", "Vì DB không hỗ trợ", "Vì cần volatile"],
        answer: 1,
        explain: "Sẽ học sâu ở tuần 5–6 với JPA locking.",
      },
    },
  ],
  modelAnswer:
    "Deadlock là khi các thread chờ nhau thành vòng; cần đủ 4 điều kiện Coffman, em phá circular wait bằng cách lấy lock theo thứ tự cố định, ví dụ khoá id nhỏ trước, hoặc dùng tryLock có timeout. Khi service treo mà CPU thấp em lấy thread dump bằng jstack, JVM in sẵn đoạn Found one Java-level deadlock; ở DB thì DB tự phát hiện, em update theo thứ tự id và retry transaction. ThreadLocal cho mỗi thread một bản sao, Spring dùng cho SecurityContext, transaction và MDC; vì thread pool tái sử dụng thread nên em luôn remove trong finally, và dùng TaskDecorator để copy context sang thread của @Async. Virtual thread làm việc chờ I/O rẻ hơn: em đo 10 nghìn task chờ 100 ms, pool 200 thread mất 5 giây, virtual thread mất khoảng 170 ms; nhưng không giúp CPU-bound, ở Java 21 tránh chặn trong synchronized vì pinning, và DB pool vẫn là giới hạn thật. Khi chạy nhiều instance em khoá ở DB bằng update có điều kiện hoặc @Version, không dựa vào synchronized.",
};
