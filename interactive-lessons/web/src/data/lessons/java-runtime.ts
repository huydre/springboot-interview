import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (RuntimeDemo.java, Warm.java, Mask.java). Timings are from the author's machine and only show the shape: yours will differ.
export const javaRuntime: Lesson = {
  slug: "java-runtime",
  crumb: "ClassLoader, JIT, AQS",
  videoDir: "/videos/java-runtime",
  videoVersion: "0",
  scenes: [],
  title: "ClassLoader, JIT, AQS và StampedLock",
  subtitle:
    "Những thứ chạy bên dưới code Java: class được nạp thế nào, vì sao chương trình nhanh dần lên, lock được xây trên cái gì, và khi nào dùng StampedLock.",
  openingQuiz: {
    question: "Hai ClassLoader khác nhau cùng nạp class `Plugin` từ cùng một file. Hai `Class` đó là một hay hai?",
    options: ["Một, vì cùng tên", "Hai class khác nhau, ép kiểu giữa chúng ném `ClassCastException`", "Hai, nhưng ép kiểu được", "Tuỳ JVM"],
    answer: 1,
    explain: "Danh tính của một class là (tên, ClassLoader nạp nó). Đã chạy: cùng tên nhưng `c1 == c2` là `false`, và `cast` ném `ClassCastException`.",
  },
  roadmap: [
    "Chặng 1: ClassLoader. Phân cấp, ủy quyền cho cha, và vì sao cùng tên chưa chắc cùng class.",
    "Chặng 2: JIT. Vì sao chương trình chậm lúc đầu rồi nhanh lên.",
    "Chặng 3: AQS và StampedLock. Lock được xây trên gì, và đọc lạc quan.",
  ],
  sections: [
    {
      id: "classloader",
      title: "ClassLoader: phân cấp và ủy quyền",
      intro: [
        "JVM nạp class bằng các **ClassLoader** xếp thành cây: **bootstrap** (lõi như `String`), **platform** (như `java.sql`), **app** (classpath của bạn). Khi cần một class, loader **hỏi cha trước** (parent-first delegation).",
        "Danh tính của một class là **(tên, loader nạp nó)**. Cùng tên nhưng khác loader là hai class khác nhau.",
      ],
      widgetTitle: "Hai plugin, một thư viện",
      compare: [
        way(
          "Mọi plugin chung classpath",
          `// classpath chung: mỗi class chỉ nạp một lần, một phiên bản duy nhất
java -cp app.jar:plugin-a.jar:plugin-b.jar Main`,
          [
            ask("Hai plugin cần hai phiên bản khác nhau của một thư viện", bad("Chỉ một phiên bản được nạp, plugin còn lại có thể lỗi `NoSuchMethodError`.")),
            ask("Gỡ một plugin khi đang chạy", bad("Class đã nạp vào loader chung thì không gỡ ra được.")),
          ],
          "Đơn giản, nhưng mọi thứ dùng chung một không gian tên.",
        ),
        way(
          "Mỗi plugin một ClassLoader",
          `URLClassLoader l1 = new URLClassLoader(urls, platformLoader);
URLClassLoader l2 = new URLClassLoader(urls, platformLoader);
Class<?> c1 = l1.loadClass("Plugin"), c2 = l2.loadClass("Plugin");`,
          [
            ask("Hai plugin cần hai phiên bản khác nhau", ok("Mỗi loader có không gian tên riêng nên mỗi plugin mang phiên bản của nó.")),
            ask("Truyền object giữa hai plugin", bad("Đã chạy: cùng tên `Plugin` nhưng `c1 == c2` là `false`, ép kiểu giữa hai loader ném `ClassCastException`.")),
          ],
          "Cách ly tốt, đổi lại không dùng chung class giữa các loader được.",
        ),
      ],
      after: [
        "Đã chạy: `String` do bootstrap nạp (loader là `null`), `java.sql.Connection` do `platform` nạp, còn loader của bạn là `app`, cha là `platform`, cha nữa là `null` (bootstrap). Nhờ parent-first, một loader tự viết có nạp `java.lang.String` vẫn nhận đúng `String` của JVM.",
        "Application server và Spring DevTools (hot reload) dùng nhiều loader nên hay gặp `ClassCastException` kỳ lạ kiểu \"Plugin cannot be cast to Plugin\".",
      ],
      trap: {
        title: "Cùng tên class nhưng khác loader",
        text: "Thông báo `X cannot be cast to X` nghĩa là hai class X nạp bởi hai loader khác nhau. Thường là hai bản jar trùng trong hai nơi, hoặc hot reload nạp lại class.",
      },
      quiz: {
        question: "Một loader tự viết (cha là bootstrap) được yêu cầu nạp `java.lang.String`. Nó nhận được class nào?",
        options: ["Một bản `String` riêng của loader đó", "`String` của JVM (bootstrap)", "`NoClassDefFoundError`", "Tuỳ máy"],
        answer: 1,
        explain: "Do ủy quyền cho cha trước, kết quả đúng là `String` của bootstrap (đã chạy: `== String.class` là `true`).",
      },
    },
    {
      id: "jit",
      title: "JIT: vì sao chương trình nhanh dần lên",
      intro: [
        "JVM khởi đầu bằng **thông dịch** (interpreter) và đếm số lần mỗi method chạy. Method **nóng** được biên dịch thành mã máy: trước bằng C1 (tier 3), rồi C2 (tier 4) tối ưu mạnh hơn.",
        "Vì vậy ứng dụng Java **chậm lúc vừa khởi động** rồi nhanh dần: đó là warm-up.",
      ],
      widgetTitle: "Cùng một hàm, có và không có JIT",
      compare: [
        way(
          "Chỉ thông dịch (-Xint)",
          `java -Xint Warm            // tắt JIT, luôn thông dịch`,
          [
            ask("Gọi work(200000) nhiều lần liên tiếp", bad("Đã chạy (máy tác giả): mọi lần đều khoảng 1350 µs, không nhanh lên.")),
            ask("40 lần work(200000) mỗi vòng", bad("Khoảng 55 đến 65 ms mỗi vòng.")),
          ],
          "Không có biên dịch thì tốc độ không đổi, và chậm.",
        ),
        way(
          "Mặc định (có JIT)",
          `java Warm                  // tiered compilation: C1 rồi C2
java -XX:+PrintCompilation Warm     // xem method được biên dịch`,
          [
            ask("Gọi work(200000) nhiều lần liên tiếp", ok("Đã chạy: lần 1 mất khoảng 1500 µs, lần 8 còn khoảng 170 µs, và ổn định ở mức đó.")),
            ask("40 lần work(200000) mỗi vòng", ok("Khoảng 6 đến 8 ms mỗi vòng, nhanh hơn khoảng 9 lần. `PrintCompilation` cho thấy `work` được biên dịch tier 3 rồi tier 4 chỉ sau vài mili giây.")),
          ],
          "Method nóng được biên dịch nên nhanh hơn hàng chục lần so với thông dịch.",
        ),
      ],
      after: [
        "Hệ quả thực tế: vài request đầu sau khi khởi động hay chậm hơn. Cách giảm: warm-up bằng request giả, hoặc các kỹ thuật như AppCDS và native image (tìm hiểu thêm khi cần).",
      ],
      trap: {
        title: "Microbenchmark đo vài lần đầu",
        text: "Đo bằng vài lần chạy đầu là đo cả thời gian warm-up. Dùng **JMH** với warm-up chuẩn. Các con số ở đây là của máy tác giả, chỉ để thấy hình dạng: chậm lúc đầu rồi nhanh.",
      },
      quiz: {
        question: "Vì sao ứng dụng Java thường chậm ở các request đầu tiên sau khi khởi động?",
        options: [
          "Vì code chưa được JIT biên dịch, đang chạy ở chế độ thông dịch",
          "Vì garbage collector tắt",
          "Vì thiếu bộ nhớ",
          "Vì network chậm",
        ],
        answer: 0,
        explain: "Method cần chạy đủ nhiều lần mới được biên dịch. Trước đó nó chạy chậm hơn nhiều (đã chạy: lần 1 chậm gấp khoảng 9 lần lần 8).",
      },
    },
    {
      id: "aqs",
      title: "AQS: nền móng của hầu hết lock",
      intro: [
        "`ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock` đều xây trên **AbstractQueuedSynchronizer (AQS)**: một biến `state` kèm một **hàng đợi các thread đang chờ**.",
        "Bạn chỉ cần viết cách lấy khoá (`tryAcquire`) và nhả khoá (`tryRelease`). AQS lo việc xếp hàng, đánh thức.",
      ],
      widgetTitle: "4 thread tăng một bộ đếm 100.000 lần",
      compare: [
        way(
          "Không khoá",
          `for (int i = 0; i < 100_000; i++) counter++;     // 4 thread cùng chạy`,
          [
            ask("4 thread, mỗi thread 100.000 lần", bad("Đã chạy: tổng chỉ khoảng 231.000 thay vì 400.000. `counter++` là đọc, cộng, ghi: các thread ghi đè lẫn nhau (mất cập nhật).")),
          ],
          "Race condition làm mất phần lớn cập nhật.",
        ),
        way(
          "Mutex tự viết trên AQS",
          `class Mutex {
  private static class Sync extends AbstractQueuedSynchronizer {
    protected boolean tryAcquire(int n) { return compareAndSetState(0, 1); }
    protected boolean tryRelease(int n) { setState(0); return true; }
  }
  private final Sync sync = new Sync();
  void lock() { sync.acquire(1); }  void unlock() { sync.release(1); }
}`,
          [
            ask("4 thread, mỗi thread 100.000 lần", ok("Đã chạy: đúng **400000**. Chỉ khoảng 10 dòng là có một khoá chạy đúng.")),
          ],
          "AQS lo phần phức tạp (hàng đợi, chặn, đánh thức), bạn chỉ định nghĩa luật lấy và nhả.",
        ),
      ],
      after: [
        "Biết AQS giúp bạn hiểu: vì sao `ReentrantLock` có `fair` hay không, vì sao `await()` chờ trong một hàng đợi, và `Semaphore` chỉ là AQS với `state` là số giấy phép.",
      ],
      trap: {
        title: "Tự viết lock trong code sản phẩm",
        text: "Viết Mutex để hiểu cơ chế thì tốt. Trong sản phẩm hãy dùng `ReentrantLock` hay `synchronized` có sẵn, đã được kiểm chứng kỹ về công bằng và ngắt.",
      },
      quiz: {
        question: "AQS gồm hai thành phần cốt lõi nào?",
        options: [
          "Một biến `state` và hàng đợi các thread đang chờ",
          "Một `HashMap` và một `Thread`",
          "Một `volatile` và một `ExecutorService`",
          "Hai `synchronized`",
        ],
        answer: 0,
        explain: "Các lock xây trên AQS chỉ khác nhau ở cách hiểu `state` (khoá, giấy phép, bộ đếm).",
      },
    },
    {
      id: "stamped",
      title: "StampedLock: đọc lạc quan",
      intro: [
        "`StampedLock` cho phép **đọc lạc quan** (optimistic read): đọc **không cần khoá**, rồi kiểm tra bằng `validate(stamp)` xem có ai ghi chen vào không. Nếu có, quay lại đọc có khoá.",
        "Hợp khi **đọc rất nhiều, ghi rất ít** và đoạn đọc ngắn.",
      ],
      widgetTitle: "Đọc lạc quan và kiểm tra",
      compare: [
        way(
          "ReadWriteLock",
          `lock.readLock().lock();
try { return data; } finally { lock.readLock().unlock(); }   // mỗi lần đọc đều lấy khoá`,
          [
            ask("Đọc rất nhiều, ghi hiếm", bad("Mỗi lần đọc đều phải lấy và nhả khoá đọc, tốn kém khi số lần đọc rất lớn.")),
            ask("Gọi lại từ cùng thread (reentrant)", ok("`ReentrantReadWriteLock` cho phép lấy lại khoá ở cùng thread.")),
          ],
          "Đơn giản, hỗ trợ reentrant, nhưng mỗi lần đọc đều có chi phí khoá.",
        ),
        way(
          "StampedLock",
          `long stamp = lock.tryOptimisticRead();     // không khoá
int v = data[0];
if (!lock.validate(stamp)) {               // có ai ghi chen vào?
  stamp = lock.readLock();
  try { v = data[0]; } finally { lock.unlockRead(stamp); }
}`,
          [
            ask("Có writer chen vào giữa lúc đọc", ok("Đã chạy: sau một lần ghi, `validate` trả `false` nên đọc lạc quan bị huỷ và phải đọc lại bằng `readLock`. Stamp mới lấy sau đó thì `validate` trả `true`.")),
            ask("Lấy writeLock hai lần trong cùng thread", bad("Đã chạy: lần thứ hai bị từ chối (`tryWriteLock` trả `0`). `StampedLock` **không reentrant**: lấy hai lần sẽ tự chặn mình.")),
          ],
          "Đọc nhanh hơn khi ít ghi, nhưng phức tạp hơn và không reentrant.",
        ),
      ],
      after: [
        "Chỉ đổi sang `StampedLock` khi đo được `ReadWriteLock` là điểm nghẽn. Mặc định `synchronized` hoặc `ReentrantLock` là đủ cho phần lớn trường hợp.",
      ],
      trap: {
        title: "Đọc trường rồi mới validate",
        text: "Với đọc lạc quan, bạn có thể đọc được dữ liệu **đang bị ghi dở**. Chỉ dùng giá trị đã đọc **sau khi** `validate` trả `true`. Chép các trường vào biến cục bộ trước rồi mới validate.",
      },
      quiz: {
        question: "Điểm nào đúng về `StampedLock`?",
        options: [
          "Không reentrant, và đọc lạc quan phải `validate` sau khi đọc",
          "Reentrant như `ReentrantLock`",
          "Luôn nhanh hơn `synchronized`",
          "Tự động validate",
        ],
        answer: 0,
        explain: "Đã chạy: lấy writeLock lần hai trong cùng thread bị từ chối, và stamp cũ `validate` ra `false` sau một lần ghi.",
      },
    },
    {
      id: "chon-khoa",
      title: "Bài tập: chọn công cụ đồng bộ",
      intro: ["Mỗi dòng là một tình huống. Chọn công cụ phù hợp."],
      widgetTitle: "Chọn công cụ",
      drill: {
        choices: ["synchronized", "ReentrantLock", "ReadWriteLock", "StampedLock", "Semaphore"],
        summary: "Bắt đầu từ cái đơn giản nhất (`synchronized`), chỉ chuyển khi cần tính năng cụ thể.",
        items: [
          { q: "Đoạn găng ngắn, đơn giản, không cần tính năng đặc biệt.", a: "synchronized", why: "Đơn giản và đủ dùng, JVM tối ưu rất tốt." },
          { q: "Cần thử lấy khoá có thời hạn, và có thể bị ngắt khi đang chờ.", a: "ReentrantLock", why: "Có `tryLock(timeout)` và `lockInterruptibly()`." },
          { q: "Cache đọc nhiều ghi ít, cần reentrant.", a: "ReadWriteLock", why: "Nhiều thread đọc cùng lúc, và hỗ trợ lấy lại khoá ở cùng thread." },
          { q: "Đọc cực nhiều, đoạn đọc rất ngắn, chấp nhận đọc lại khi bị ghi chen và không cần reentrant.", a: "StampedLock", why: "Đọc lạc quan không khoá, validate sau khi đọc." },
          { q: "Giới hạn tối đa 10 kết nối đồng thời tới một dịch vụ.", a: "Semaphore", why: "Một bộ đếm giấy phép, đúng nghĩa giới hạn số lượng." },
        ],
      },
    },
  ],
  cards: [
    { q: "Hierarchy của ClassLoader và parent-first delegation?", a: "Bootstrap (lõi JDK, loader là null), platform (java.sql...), app (classpath). Loader hỏi cha trước rồi mới tự nạp, nên không ai thay được String của JVM." },
    { q: "Cùng tên class nhưng khác ClassLoader thì sao?", a: "Là hai class khác nhau (c1 == c2 là false), ép kiểu ném ClassCastException 'X cannot be cast to X'. Hay gặp ở hot reload, application server, jar trùng." },
    { q: "JIT làm gì, và vì sao có warm-up?", a: "Method chạy đủ nhiều thì được biên dịch thành mã máy (C1 tier 3, rồi C2 tier 4). Trước đó chạy thông dịch nên chậm. Ví dụ đo: lần 1 chậm gấp khoảng 9 lần lần 8, -Xint thì luôn chậm." },
    { q: "Vì sao không nên đo hiệu năng bằng vài lần chạy đầu?", a: "Sẽ đo cả warm-up. Dùng JMH với warm-up đúng cách." },
    { q: "AQS là gì?", a: "Khung gồm một biến state và hàng đợi thread chờ. ReentrantLock, Semaphore, CountDownLatch xây trên đó. Bạn chỉ viết tryAcquire và tryRelease." },
    { q: "StampedLock khác ReadWriteLock thế nào?", a: "Có đọc lạc quan không khoá (tryOptimisticRead rồi validate). Nhanh hơn khi đọc nhiều nhưng không reentrant, và phải validate sau khi đọc." },
  ],
  modelAnswer:
    "JVM nạp class bằng các ClassLoader theo cây bootstrap, platform, app và ủy quyền cho cha trước, nên danh tính của class là tên cộng loader: cùng tên khác loader là hai class khác nhau, gây ClassCastException. JIT biên dịch các method nóng thành mã máy (C1 rồi C2), nên Java chậm lúc khởi động rồi nhanh dần, và em đo hiệu năng bằng JMH có warm-up. Lock như ReentrantLock hay Semaphore xây trên AQS gồm biến state và hàng đợi chờ. StampedLock cho đọc lạc quan không khoá rồi validate, hợp khi đọc nhiều ghi ít, nhưng không reentrant.",
};
