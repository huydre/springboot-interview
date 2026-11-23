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
        "Deadlock chỉ xảy ra khi có **đủ cả 4 điều kiện Coffman**. Phá được **một** điều kiện là hết deadlock:",
        "- **Mutual exclusion** (độc quyền): tài nguyên chỉ một thread giữ tại một lúc. Khó phá, vì đó chính là bản chất của lock.",
        "- **Hold and wait** (giữ và chờ): thread giữ cái này trong lúc chờ cái kia. Phá bằng cách lấy tất cả lock cần thiết trong một lần.",
        "- **No preemption** (không giành lại được): không ai giật được lock thread khác đang giữ. Phá bằng `tryLock(timeout)`: chờ quá lâu thì tự nhả lock đang giữ.",
        "- **Circular wait** (chờ vòng tròn): các thread chờ nhau thành vòng. Phá bằng cách **lấy lock theo thứ tự cố định**, cách phổ biến nhất.",
        "Deadlock `synchronized` không timeout, không exception, CPU thấp, dễ chẩn đoán nhầm là service chậm. Đừng nhầm với **livelock**: các thread không đứng yên mà vẫn chạy, nhưng cứ nhường nhau theo cùng một nhịp (cùng nhả lock, cùng thử lại) nên không ai tiến triển, giống hai người tránh nhau trên hành lang cứ cùng bước sang một phía.",
      ],
      board: {
        "title": "Deadlock: mỗi bên giữ thứ bên kia cần",
        "highlight": "giữ thứ bên kia cần",
        "chips": [
          "4 điều kiện Coffman",
          "Phá một điều kiện là hết deadlock"
        ],
        "cards": [
          {
            "title": "Hai thread, hai lock",
            "diagram": {
              "kind": "hub",
              "inputs": [
                {
                  "label": "Thread 1: giữ A, chờ B"
                },
                {
                  "label": "Thread 2: giữ B, chờ A"
                }
              ],
              "center": "Vòng chờ A và B",
              "rulesTitle": "Đã chạy: sau 500 ms",
              "rules": [
                "Cả hai `BLOCKED`",
                "Không dòng \"done\" nào",
                "Không exception, CPU thấp"
              ]
            },
            "notes": [
              "Dễ chẩn đoán nhầm là service chậm."
            ],
            "takeaway": "Chờ nhau thành vòng thì không ai đi tiếp"
          },
          {
            "title": "Phá no preemption",
            "diagram": {
              "kind": "flow",
              "steps": [
                "giữ lock A",
                "tryLock(B, timeout)"
              ],
              "ok": [
                "Lấy được B",
                "Làm việc"
              ],
              "bad": [
                "Hết giờ",
                "Nhả lock đang giữ"
              ]
            },
            "notes": [
              "Cách phổ biến nhất là lấy lock theo thứ tự cố định, để phá circular wait."
            ],
            "takeaway": "Chờ quá lâu thì tự nhả lock"
          }
        ],
        "conclusion": "**Kết luận:** deadlock cần đủ 4 điều kiện, phá được một điều kiện là xong."
      },
      widget: "deadlock-order",
      widgetTitle: "Đổi thứ tự lấy lock",
      quiz: {
        question: "Deadlock khác livelock thế nào?",
        options: ["Giống nhau", "Deadlock: đứng yên chờ nhau; livelock: vẫn chạy nhưng liên tục nhường nhau nên không ai tiến triển", "Livelock chỉ có ở DB", "Deadlock chỉ có ở virtual thread"],
        answer: 1,
        explain: "Còn một dạng khác là starvation: một thread mãi không được tài nguyên vì thread khác luôn được ưu tiên. Nó không phải deadlock vì các thread khác vẫn chạy bình thường.",
      },
    },
    {
      id: "detect",
      title: "Phần 2: Phát hiện deadlock",
      scene: "detect",
      intro: [
        "Deadlock không ném exception, không timeout. Vậy làm sao biết nó đang xảy ra?",
        "`jstack <pid>` (hoặc `jcmd <pid> Thread.print`) in đoạn \"Found one Java-level deadlock\", ghi rõ thread nào giữ lock nào và chờ lock nào. Trong code, `ThreadMXBean.findDeadlockedThreads()`: đã chạy ra `deadlocked count=2` và `transfer-1-to-2 waits … held by transfer-2-to-1`.",
        "Ba thói quen giúp đọc dump nhanh hơn:",
        "- **Đặt tên thread**: nhìn dump biết ngay thread nào làm việc gì.",
        "- **Chụp 2–3 lần**: cách nhau vài giây, để so các lần chụp với nhau.",
        "- **`/actuator/threaddump`**: dùng khi không vào được máy chủ.",
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
        "Tình huống: chuyển tiền giữa hai tài khoản, mỗi giao dịch phải khoá cả tài khoản gửi lẫn nhận. Giao dịch 1 chuyển từ tài khoản 1 sang 2 (khoá 1 rồi 2), giao dịch 2 chuyển ngược lại (khoá 2 rồi 1): đúng vòng chờ ở Phần 1.",
        "Cách sửa: luôn khoá tài khoản id nhỏ trước, cho cả hai giao dịch. Khi đó cả hai đều xin khoá tài khoản 1 trước, không còn vòng chờ; hai giao dịch 1→2 và 2→1 chạy đồng thời đều xong (415 ms trong lần đo này).",
        "Không áp được thứ tự thì `tryLock` có timeout, thất bại thì nhả hết, chờ ngẫu nhiên rồi thử lại. Chờ ngẫu nhiên để tránh livelock: nếu hai thread cùng nhả và cùng thử lại sau đúng một khoảng, chúng va nhau mãi.",
        "Đừng gọi callback hay HTTP khi đang giữ lock. Lý do: bạn không biết code đó chạy bao lâu, nên thời gian giữ lock bị kéo dài, mọi thread khác phải chờ theo; và code lạ đó có thể tự lấy lock khác, tạo ra một vòng chờ mà bạn không nhìn thấy.",
      ],
      takeaway: {
        lines: [
          "Lấy lock theo thứ tự cố định. Không áp được thứ tự thì `tryLock` có timeout, nhả hết rồi chờ ngẫu nhiên trước khi thử lại.",
          "Không gọi callback hay HTTP khi đang giữ lock.",
        ],
      },
      quiz: {
        question: "Vì sao cần sleep ngẫu nhiên trước khi thử lại tryLock?",
        options: ["Để giảm CPU", "Để hai thread không thử lại cùng nhịp mãi (livelock)", "Để GC chạy", "Không cần"],
        answer: 1,
        explain: "Chờ ngẫu nhiên làm lệch nhịp để một bên thắng.",
      },
      parts: [
        {
          id: "avoid-db",
          title: "Deadlock ở database",
          intro: [
            "Database cũng khoá: khi một {{transaction|transaction}} `UPDATE` một row, row đó bị khoá tới khi transaction kết thúc. Kịch bản: transaction 1 update row A rồi row B, transaction 2 update row B rồi row A, cùng lúc. Mỗi bên giữ một row và chờ row kia: đúng vòng chờ như ở Phần 1.",
            "DB tự phát hiện vòng chờ và {{rollback|rollback}} một transaction để bên kia chạy tiếp (MySQL báo lỗi 1213, PostgreSQL báo \"deadlock detected\"). Spring dịch lỗi đó thành một exception con của `PessimisticLockingFailureException`.",
            "Cách phòng:",
            "- **Cùng thứ tự**: update các row theo cùng thứ tự (ví dụ theo id).",
            "- **Transaction ngắn**: giữ row càng ít thời gian càng tốt.",
            "- **Retry cả transaction** khi gặp lỗi deadlock, vì transaction bị rollback đã mất hết thay đổi.",
          ],
          quiz: {
            question: "Hai transaction cùng chuyển tiền giữa tài khoản 1 và 2 theo hai chiều ngược nhau, DB báo deadlock. Sửa thế nào?",
            options: ["Tăng timeout của DB", "Luôn update tài khoản id nhỏ trước, và retry cả transaction khi gặp lỗi deadlock", "Bỏ transaction đi", "Thêm synchronized vào service"],
            answer: 1,
            explain: "Cùng thứ tự thì không có vòng chờ. Retry cả transaction vì bên bị DB chọn rollback đã mất hết thay đổi.",
          },
        },
      ],
    },
    {
      id: "threadlocal",
      title: "Phần 4: ThreadLocal",
      scene: "tl",
      intro: [
        "Hình dung mỗi thread có một **ngăn tủ cá nhân**. `ThreadLocal` là cái nhãn dán trên ngăn: cùng một nhãn, nhưng mỗi thread mở ra đúng ngăn của mình. Thread A cất \"alice\" thì thread B mở cùng nhãn vẫn thấy ngăn của B.",
        "Trong code: `static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();` rồi `CURRENT_USER.set(\"alice\")`, `CURRENT_USER.get()`, `CURRENT_USER.remove()`. Bên dưới, mỗi `Thread` có một map riêng, key là ThreadLocal, value là dữ liệu.",
        "Vì Tomcat phục vụ **mỗi request trên một thread** từ đầu tới cuối, Spring giữ được dữ liệu của request trong ThreadLocal mà không cần truyền qua tham số. Ví dụ `SecurityContextHolder` giữ user đang đăng nhập; các chỗ khác (transaction của `@Transactional`, MDC của log) xem ở phần dưới.",
      ],
      quiz: {
        question: "Vì sao Spring đọc được user đang đăng nhập ở bất kỳ đâu trong request mà không cần truyền tham số?",
        options: [
          "Vì user được lưu trong một field static dùng chung",
          "Vì mỗi request chạy trên một thread, và SecurityContextHolder giữ user trong ThreadLocal của thread đó",
          "Vì Spring đọc lại từ database mỗi lần",
          "Vì user nằm trong session HTTP",
        ],
        answer: 1,
        explain: "ThreadLocal cho mỗi thread một bản riêng, nên hai request song song trên hai thread không thấy user của nhau.",
      },
      parts: [
        {
          id: "threadlocal-leak",
          title: "Bẫy: thread pool tái sử dụng thread",
          intro: [
            "Thread của Tomcat hay executor không chết sau mỗi request, nó được trả về pool và dùng lại. Ngăn tủ của nó cũng còn nguyên.",
            "Hệ quả 1, **rò dữ liệu giữa request**. Với user id hay tenant id, đây là lỗi bảo mật.",
            "Hệ quả 2, **rò bộ nhớ** (memory leak): value nằm trong map của thread nên sống chừng nào thread còn sống, mà thread của pool sống suốt đời ứng dụng. Cất một object lớn mà không remove là nó không bao giờ được GC dọn.",
          ],
          board: {
            "title": "Quên remove(): giá trị ở lại trên thread của pool",
            "highlight": "giá trị ở lại",
            "chips": [
              "Rò dữ liệu giữa request",
              "Rò bộ nhớ"
            ],
            "cards": [
              {
                "title": "Pool 1 thread",
                "diagram": {
                  "kind": "flow",
                  "steps": [
                    "Request 1: set(\"alice\")",
                    "Request 1 xong, thread về pool",
                    "Request 2 chạy trên thread đó"
                  ],
                  "ok": [
                    "remove() trong finally",
                    "Request 2 đọc null"
                  ],
                  "bad": [
                    "Quên remove()",
                    "Request 2 đọc \"alice\""
                  ]
                },
                "notes": [
                  "Đã chạy pool 1 thread, kết quả đúng như hai nhánh trên."
                ],
                "code": "try {\n  CURRENT_USER.set(\"alice\");\n  // xử lý request\n} finally {\n  CURRENT_USER.remove();\n}",
                "takeaway": "Một dòng remove() chặn cả hai loại rò"
              }
            ],
            "conclusion": "**Kết luận:** `set` thì phải `remove()` trong `finally`."
          },
          predict: {
            question: "Pool chỉ có 1 thread. Request 1 gọi `CURRENT_USER.set(\"alice\")` rồi quên `remove()`. Request 2 chạy trên pool đó và gọi `CURRENT_USER.get()`. Nó đọc ra gì?",
            options: ["`null`, vì là request mới", "`\"alice\"`", "Ném `IllegalStateException`", "Tuỳ GC đã chạy hay chưa"],
            answer: 1,
            explain: "Hai request chạy trên cùng một thread, nên cùng một ngăn tủ. Không ai dọn thì giá trị của request 1 vẫn nằm đó.",
          },
          widget: "threadlocal-leak",
          widgetTitle: "Quên remove() thì sao",
          after: [
            "Đã chạy pool 1 thread: request 1 set \"alice\" quên remove thì request 2 đọc ra \"alice\"; remove trong finally thì đọc ra `null`.",
          ],
          takeaway: {
            lines: [
              "`set` thì phải `remove()` trong `finally`: một dòng chặn cả rò dữ liệu lẫn rò bộ nhớ.",
            ],
          },
          quiz: {
            question: "Vì sao quên remove() ThreadLocal trong web app gây rò bộ nhớ?",
            options: [
              "Vì ThreadLocal tự nhân bản value",
              "Vì value sống cùng thread, mà thread của pool được dùng lại và sống suốt đời ứng dụng",
              "Vì GC không chạy trên thread của Tomcat",
              "Vì ThreadLocal là static",
            ],
            answer: 1,
            explain: "Thread không chết thì map của nó không mất, value không bao giờ được dọn. remove() trong finally giải quyết cả rò bộ nhớ lẫn rò dữ liệu.",
          },
        },
        {
          id: "threadlocal-async",
          title: "ThreadLocal không tự sang thread khác",
          intro: [
            "Ngăn tủ là của **từng thread**, nên chuyển việc sang thread khác (`@Async`, `CompletableFuture.supplyAsync`, executor) là mất dữ liệu: đã chạy, trong `supplyAsync` đọc ra `null`. Log mất `requestId` của MDC, `SecurityContext` không có user.",
            "Spring cũng giữ {{transaction|transaction}} của `@Transactional` trong ThreadLocal (qua `TransactionSynchronizationManager`). Vì vậy code chạy trên thread khác **không nằm trong** transaction đó.",
            "Cách sửa: dùng `TaskDecorator`, một hook của executor trong Spring. Nó chạy trên thread gọi để chụp MDC và SecurityContext, rồi đặt lại trên thread của pool trước khi task chạy (và dọn khi xong).",
            "Hỏi xoáy: `InheritableThreadLocal` chỉ chép giá trị **lúc thread con được tạo**, nên không giải quyết được với pool. Thread của pool được tạo một lần rồi dùng lại, nên nó giữ giá trị của lần tạo đầu, không phải của request hiện tại.",
          ],
          takeaway: {
            lines: [
              "Chuyển việc sang thread khác là mất mọi thứ trong ThreadLocal: MDC, SecurityContext, cả transaction. Chép context bằng `TaskDecorator`.",
            ],
          },
          quiz: {
            question: "Trong @Transactional, gọi CompletableFuture.supplyAsync(() -> repo.save(x)): save có nằm trong transaction không?",
            options: ["Có", "Không: transaction gắn với thread gọi qua ThreadLocal, thread của pool không có nó", "Chỉ khi dùng virtual thread", "Tuỳ database"],
            answer: 1,
            explain: "save chạy trong transaction riêng hoặc không có, không rollback theo transaction ngoài.",
          },
        },
      ],
    },
    {
      id: "virtual-threads",
      title: "Phần 5: Virtual threads",
      scene: "vt",
      intro: [
        "Virtual thread (Java 21) do JVM quản lý, chạy trên vài **carrier thread**: carrier là platform thread mà JVM gắn virtual thread lên để chạy, mặc định số carrier bằng số CPU. Khi virtual thread chặn I/O hay sleep, JVM gỡ nó khỏi carrier (unmount) để carrier chạy việc khác.",
        "Virtual thread giúp chờ rẻ hơn, không làm tính toán nhanh hơn: tác vụ CPU-bound ngang nhau vì vẫn chỉ 8 CPU. Spring Boot 3.2+ trên Java 21: `spring.threads.virtual.enabled=true`. Virtual thread luôn là daemon.",
      ],
      predict: {
        question: "10.000 task, mỗi task `sleep(100)`. Chạy bằng pool 200 platform thread, rồi bằng một virtual thread cho mỗi task. Kết quả gần nhất?",
        options: [
          "Gần như bằng nhau",
          "Pool 200 thread khoảng 5 giây, virtual thread khoảng 0,2 giây",
          "Virtual thread chậm hơn vì tốn công gỡ ra gắn vào carrier",
          "Cả hai khoảng 100 ms",
        ],
        answer: 1,
        explain: "Pool 200 thread chỉ cho 200 task chờ cùng lúc, nên phải chạy 50 đợt × 100 ms. Virtual thread chờ không giữ carrier nên 10.000 task gần như chờ cùng lúc.",
      },
      widget: "vt-compare",
      widgetTitle: "Số đo virtual thread",
      after: [
        "Đã đo 10.000 task `sleep(100)`: pool 200 platform thread 5249 ms, virtual thread per task 168 ms.",
      ],
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
        "Java 21–23: chặn bên trong `synchronized` **ghim** (pin) virtual thread vào carrier, tức JVM không gỡ nó ra được. Lý do: ở các bản này, monitor của `synchronized` được ghi là thuộc về carrier thread, nên gỡ virtual thread ra là mất lock. Carrier bị chiếm suốt thời gian chặn. Đã đo 100 virtual thread `sleep(100)` trong synchronized mất 1345 ms (chỉ 8 carrier, 13 đợt), trong `ReentrantLock` mất 101 ms. Java 24 (JEP 491) đã sửa. Bật `-Djdk.tracePinnedThreads=short` để thấy chỗ bị pin.",
        "Không pool virtual thread: chúng rẻ tới mức tạo mới cho mỗi task, gom vào pool là mất đúng cái lợi đó. Muốn giới hạn số việc chạy cùng lúc thì dùng `Semaphore(n)`: bộ đếm n giấy phép, `acquire()` lấy một giấy (hết thì chờ), `release()` trả lại.",
        "DB connection pool vẫn là giới hạn thật. Đã đo 1000 virtual thread đi qua `Semaphore(10)` (đóng vai pool 10 connection), mỗi việc giữ 50 ms: mất 5424 ms, vì mỗi lúc chỉ 10 việc chạy (1000 / 10 × 50 ms ≈ 5 giây).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Java 21–23: chặn trong `synchronized` → virtual thread bị ghim vào carrier → chỉ còn vài carrier chạy việc → chậm. Dùng `ReentrantLock`, hoặc lên Java 24+.",
        ],
      },
      quiz: {
        question: "Bật virtual threads cho app dùng JDBC driver cũ nhiều synchronized quanh I/O trên Java 21 có thể gây gì?",
        options: ["Nhanh gấp đôi", "Có thể chậm hơn vì pinning", "Không ảnh hưởng", "Lỗi biên dịch"],
        answer: 1,
        explain: "Kiểm tra bằng jdk.tracePinnedThreads hoặc JFR, nâng driver, hoặc lên Java 24+.",
      },
      parts: [
        {
          id: "coordination-tools",
          title: "Semaphore, CountDownLatch, CyclicBarrier",
          intro: [
            "Phần trên đã dùng `Semaphore` để giới hạn việc chạy cùng lúc. Ba công cụ phối hợp thread này hay bị hỏi phỏng vấn, và dễ nhầm với nhau:",
            "- **`Semaphore(10)`**: bộ đếm giấy phép, tối đa 10 thread vào cùng lúc. `acquire()` lấy một giấy (hết thì chờ), `release()` trả lại, nên đặt trong `finally`. Đã chạy 100 virtual thread qua `Semaphore(10)`, mỗi việc 20 ms: số việc chạy cùng lúc cao nhất là 10.",
            "- **`CountDownLatch(3)`**: bộ đếm lùi **dùng một lần**. Thread chính gọi `latch.await()` để chờ; mỗi service khởi động xong gọi `latch.countDown()`; đủ 3 lần thì `await()` trả về, và latch không dùng lại được. Đã chạy: `main` chỉ in dòng \"3 services up\" sau khi cả 3 thread đã `countDown()`.",
            "- **`CyclicBarrier(3)`**: điểm hẹn **dùng lại được**. 3 thread cùng gọi `barrier.await()` và đứng chờ nhau; thread thứ 3 tới thì cả nhóm đi tiếp cùng lúc. Đã chạy: 3 thread tới lệch nhau 50 ms, đều in \"waits\" trước, rồi cả ba cùng \"continues\".",
            "Phân biệt nhanh: `CountDownLatch` là một bên chờ nhiều việc xong (bên chờ và bên làm khác nhau); `CyclicBarrier` là các thread chờ lẫn nhau (ai cũng vừa chờ vừa làm).",
          ],
          quiz: {
            question: "Main cần chờ 3 service khởi động xong rồi mới chạy tiếp, mỗi service là một thread. Chọn gì?",
            options: ["`Semaphore(3)`", "`CountDownLatch(3)`: mỗi service `countDown()`, main `await()`", "`CyclicBarrier(3)` với main không tham gia", "`synchronized`"],
            answer: 1,
            explain: "Một bên (main) chờ ba việc xong, chỉ cần một lần: đúng CountDownLatch. CyclicBarrier là để các thread chờ lẫn nhau và dùng lại được.",
          },
        },
      ],
    },
    {
      id: "multi-instance",
      title: "Phần 7: Race khi chạy nhiều instance",
      scene: "multi",
      intro: [
        "`synchronized` chỉ khoá trong một JVM. Chạy 3 instance thì hai request vào hai instance cùng thấy \"còn 1\" và cùng trừ: bán 2, kho chỉ có 1.",
        "Khoá ở nơi dữ liệu dùng chung:",
        "- **Update có điều kiện**: `UPDATE product SET stock = stock - 1 WHERE id = ? AND stock >= 1` rồi kiểm tra số row bị ảnh hưởng.",
        "- **`@Version`**: optimistic lock.",
        "- **`SELECT ... FOR UPDATE`**: khi tranh chấp cao.",
        "- **Distributed lock** (Redis, có TTL): lựa chọn cuối cùng.",
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
