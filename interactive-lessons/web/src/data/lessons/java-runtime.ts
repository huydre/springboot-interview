import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (RuntimeDemo.java, Warm.java, Mask.java, plus Hello.java and the ClassNotFound/NoClassDefFound demo). Timings are from the author's machine and only show the shape: yours will differ.
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
        "JVM nạp class bằng các **ClassLoader** xếp thành cây:",
        "- **Bootstrap**: nạp lõi JDK như `String`.",
        "- **Platform**: nạp các module như `java.sql`.",
        "- **App**: nạp classpath của bạn.",
        "Khi cần một class, loader **hỏi cha trước** (parent-first delegation).",
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
        "Nạp một class gồm ba bước:",
        "- **Loading**: đọc byte của file `.class`.",
        "- **Linking**: kiểm tra bytecode, cấp chỗ cho field static.",
        "- **Initialization**: chạy khối `static` và gán giá trị cho field static.",
        "Đã chạy: `String` do bootstrap nạp (loader là `null`), `java.sql.Connection` do `platform` nạp, còn loader của bạn là `app`, cha là `platform`, cha nữa là `null` (bootstrap). Nhờ parent-first, một loader tự viết có nạp `java.lang.String` vẫn nhận đúng `String` của JVM.",
        "Application server và Spring DevTools (hot reload) dùng nhiều loader nên hay gặp `ClassCastException` kỳ lạ kiểu \"Plugin cannot be cast to Plugin\".",
        "Parent-first không phải lúc nào cũng được giữ. Tomcat cho mỗi webapp một loader **tự tìm trong `WEB-INF/lib` trước** rồi mới hỏi cha, để các app không đụng phiên bản thư viện của nhau. JDBC và các cơ chế plugin khác (SPI) thì dùng **context ClassLoader** của thread (`Thread.getContextClassLoader()`), vì code lõi do bootstrap nạp không nhìn thấy class driver nằm trong classpath của bạn.",
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
      parts: [
        {
          id: "jvm-jre-jdk",
          title: "JVM, JRE, JDK, và vì sao Java chạy được trên mọi hệ điều hành",
          intro: [
            "ClassLoader nạp file `.class`. Nhưng file `.class` từ đâu ra, và ai chạy nó? Đây là câu khởi động của rất nhiều buổi phỏng vấn: \"JVM, JRE, JDK khác nhau thế nào?\".",
            "Ba thứ lồng vào nhau như búp bê Nga, cái sau chứa cái trước:",
            "- **JVM** (Java Virtual Machine): chương trình chạy bytecode. Gồm ClassLoader ở trên, bộ thông dịch, JIT (phần tiếp theo) và GC. Mỗi hệ điều hành và loại CPU có bản JVM riêng.",
            "- **JRE** (Java Runtime Environment): JVM cộng thư viện chuẩn (`java.lang`, `java.util`...). Đủ để **chạy** chương trình.",
            "- **JDK** (Java Development Kit): JRE cộng công cụ để **viết và soi** chương trình: `javac` (biên dịch), `jar`, `jcmd`, `jstack`, `jlink`...",
            "**Vì sao độc lập nền tảng?** `javac` không dịch ra mã máy, mà ra **bytecode**: tập lệnh của một máy ảo, giống nhau trên mọi máy. Cùng một file `.class` chạy được trên Windows, Linux hay macOS, vì mỗi nơi có một JVM riêng hiểu bytecode và đổi nó sang mã máy của CPU đó. Câu khẩu hiệu là \"write once, run anywhere\": cái độc lập là bytecode, còn JVM thì phụ thuộc nền tảng.",
            "Từ Java 11, Oracle không phát hành JRE riêng nữa. Muốn một runtime gọn cho container thì dùng `jlink` cắt ra đúng các module cần, hoặc dùng image JRE do bên khác đóng gói như `eclipse-temurin:21-jre`. Cũng từ Java 11, lệnh `java` chạy thẳng được một file nguồn: đã chạy `java Hello.java` (không gọi `javac` trước) và in ra kết quả, vì `java` tự biên dịch trong bộ nhớ.",
          ],
          takeaway: {
            lines: [
              "JDK = JRE + công cụ phát triển; JRE = JVM + thư viện chuẩn. Bytecode giống nhau mọi nơi, mỗi hệ điều hành có JVM riêng.",
            ],
          },
          quiz: {
            question: "Vì sao cùng một file `.class` chạy được trên cả Windows lẫn Linux?",
            options: [
              "Vì `javac` dịch ra mã máy chạy được trên mọi CPU",
              "Vì file `.class` chứa bytecode giống nhau mọi nơi, và mỗi hệ điều hành có một JVM riêng đổi bytecode sang mã máy",
              "Vì JDK có sẵn trong Windows và Linux",
              "Vì Java chỉ chạy được trong trình duyệt",
            ],
            answer: 1,
            explain: "Độc lập nền tảng là của bytecode. JVM thì có bản riêng cho từng hệ điều hành và CPU.",
          },
        },
        {
          id: "cnfe-vs-ncdfe",
          title: "ClassNotFoundException và NoClassDefFoundError",
          intro: [
            "Ta đã biết class được nạp lúc chạy, lần đầu code cần tới nó. Vậy nếu lúc đó không nạp được thì sao? Có hai lỗi tên gần giống nhau, và người phỏng vấn rất thích hỏi chúng khác nhau ở đâu.",
            "- **`ClassNotFoundException`**: **checked exception**. Bạn tự yêu cầu nạp class bằng **tên dạng chuỗi** (`Class.forName(\"...\")`, `loader.loadClass(...)`) và không tìm thấy. Hay gặp khi thiếu driver JDBC hay gõ sai tên trong file cấu hình. Code của bạn nên bắt và xử lý nó.",
            "- **`NoClassDefFoundError`**: một **`Error`**. Lúc compile class có mặt, code gọi thẳng nó, nhưng lúc chạy JVM không tìm được định nghĩa: thường do thiếu jar trên classpath lúc chạy, hoặc hai phiên bản thư viện xung đột.",
            "Trường hợp thứ ba hay bị bỏ sót: class **có** trên classpath nhưng khối `static` của nó ném exception. Lần dùng đầu tiên ném `ExceptionInInitializerError` (bọc exception gốc). JVM đánh dấu class đó là hỏng, nên các lần sau ném `NoClassDefFoundError: Could not initialize class ...`, không kèm nguyên nhân. Nếu log chỉ còn dòng sau, phải cuộn lên tìm lần đầu tiên.",
          ],
          predict: {
            question: "Khối static của `Config` chạy `Integer.parseInt(\"abc\")`. Gọi `Config.port()` hai lần, mỗi lần bọc trong try/catch. Lần **thứ hai** ném gì?",
            options: [
              "`NumberFormatException`, giống lần đầu",
              "`ExceptionInInitializerError`, giống lần đầu",
              "`NoClassDefFoundError: Could not initialize class Config`",
              "Không lỗi, lần hai khởi tạo lại thành công",
            ],
            answer: 2,
            explain: "Khởi tạo class chỉ được thử một lần. Lần đầu thất bại ném `ExceptionInInitializerError`, JVM ghi nhớ class đó hỏng, và mọi lần sau ném `NoClassDefFoundError`.",
          },
          widgetTitle: "Ba cách một class không dùng được",
          compare: [
            way(
              "Nạp bằng tên lúc chạy",
              `try {
  Class.forName("com.shop.MissingDriver");
} catch (ClassNotFoundException e) {   // checked: compiler bắt phải xử lý
  System.out.println(e);
}`,
              [
                ask("Không có class nào tên đó", bad("Đã chạy: `java.lang.ClassNotFoundException: com.shop.MissingDriver`. Đây là exception bình thường, bắt được và xử lý được.")),
              ],
              "Bạn tự đưa tên class, nên không tìm thấy là chuyện dự tính được: checked exception.",
            ),
            way(
              "Gọi thẳng class đã compile",
              `Helper.hi();     // Helper có lúc compile

class Config {
  static final int PORT = Integer.parseInt("abc");
  static int port() { return PORT; }
}
Config.port(); Config.port();`,
              [
                ask("Xoá `Helper.class` sau khi compile rồi chạy", bad("Đã chạy: `java.lang.NoClassDefFoundError: Helper`.")),
                ask("`Config.port()` lần đầu", bad("Đã chạy: `java.lang.ExceptionInInitializerError`, bọc `NumberFormatException` từ khối static.")),
                ask("`Config.port()` lần hai", bad("Đã chạy: `java.lang.NoClassDefFoundError: Could not initialize class Config`. Nguyên nhân gốc chỉ nằm ở lần đầu.")),
              ],
              "Class đã có lúc compile mà lúc chạy không dùng được: Error, thường là lỗi đóng gói hoặc lỗi khởi tạo.",
            ),
          ],
          takeaway: {
            lines: [
              "`ClassNotFoundException`: checked, nạp bằng tên chuỗi và không thấy. `NoClassDefFoundError`: Error, có lúc compile nhưng lúc chạy thiếu hoặc khởi tạo hỏng.",
              "Thấy `Could not initialize class X`: tìm `ExceptionInInitializerError` đầu tiên trong log, đó mới là nguyên nhân.",
            ],
          },
          quiz: {
            question: "Log production chỉ có `NoClassDefFoundError: Could not initialize class PricingRules`, file jar vẫn đủ. Nên tìm gì tiếp?",
            options: [
              "Thêm lại jar chứa PricingRules",
              "Dòng `ExceptionInInitializerError` đầu tiên trong log: khối static của PricingRules đã ném lỗi ở lần dùng đầu",
              "Tăng heap",
              "Đổi sang `Class.forName`",
            ],
            answer: 1,
            explain: "\"Could not initialize class\" nghĩa là class đã được tìm thấy nhưng khởi tạo thất bại trước đó. Lỗi gốc nằm trong `ExceptionInInitializerError` ở lần dùng đầu tiên.",
          },
        },
      ],
    },
    {
      id: "jit",
      title: "JIT: vì sao chương trình nhanh dần lên",
      intro: [
        "Class đã được nạp. Câu hỏi tiếp theo: bytecode của nó chạy nhanh tới đâu?",
        "JVM khởi đầu bằng **thông dịch** và đếm số lần mỗi method chạy. Method **nóng** được {{jit|JIT compiler}} biên dịch thành mã máy, qua hai tầng: **C1** biên dịch nhanh nhưng ít tối ưu, **C2** biên dịch chậm hơn nhưng tối ưu mạnh. Trong `-XX:+PrintCompilation`, tier 0 là thông dịch, **tier 1 đến 3 là C1**, **tier 4 là C2**. Method nóng thường đi tier 3 (C1 có thu thập profile) rồi tier 4.",
        "Vì vậy ứng dụng Java **chậm lúc vừa khởi động** rồi nhanh dần: đó là warm-up. Giống đi một con đường lạ: lần đầu phải nhìn bản đồ ở từng ngã rẽ, đi nhiều lần thì thuộc đường và đi nhanh hẳn.",
      ],
      predict: {
        question: "Có JIT, gọi `work(200000)` liên tiếp nhiều lần. Lần thứ 8 so với lần thứ 1 thế nào?",
        options: [
          "Như nhau, cùng một code",
          "Nhanh hơn khoảng 9 lần",
          "Chậm hơn, vì GC bắt đầu chạy",
          "Nhanh hơn chút ít, khoảng 10%",
        ],
        answer: 1,
        explain: "Sau vài lần gọi, `work` thành method nóng và được biên dịch thành mã máy. Trên máy tác giả: lần 1 khoảng 1500 µs, lần 8 còn khoảng 170 µs.",
      },
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
          "Method nóng được biên dịch nên nhanh hơn khoảng 9 lần so với thông dịch (theo số đo ở trên).",
        ),
      ],
      after: [
        "Hệ quả thực tế: vài request đầu sau khi khởi động hay chậm hơn. Cách giảm: warm-up bằng request giả, hoặc các kỹ thuật như AppCDS và native image (tìm hiểu thêm khi cần).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Method chạy nhiều lần → JIT biên dịch thành mã máy (C1 rồi C2) → chạy nhanh dần.",
          "Nên vài request đầu chậm, và đo hiệu năng phải bỏ qua giai đoạn warm-up.",
        ],
      },
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
      senior: true,
      title: "AQS: nền móng của hầu hết lock",
      intro: [
        "Cần biết trước: mục này dùng các khái niệm của bài **sync** (khoá Java, khoá nâng cao) trong khoá Concurrency. Nếu chưa học, đọc phần giải thích ngắn dưới đây hoặc quay lại sau bài đó.",
        "Vài công cụ đồng bộ của Java, cả ba đều xây trên {{aqs}}:",
        "- **`ReentrantLock`**: một khoá viết bằng code (gọi `lock()` và `unlock()`), chỉ một thread giữ được tại một lúc.",
        "- **`Semaphore`**: bộ đếm giấy phép, ví dụ cho tối đa 10 thread vào cùng lúc.",
        "- **`CountDownLatch`**: bộ đếm lùi, `await()` chờ tới khi đủ N lần `countDown()`.",
        "AQS chỉ gồm hai thứ: **một số nguyên `state`** và **hàng đợi các thread đang chờ**. Mỗi công cụ hiểu `state` theo cách riêng: với khoá, 0 là chưa ai giữ và 1 là đang bị giữ (với `ReentrantLock`, `state` đếm số lần vào lại); với `Semaphore`, `state` là số giấy phép còn lại.",
        "Bạn chỉ cần viết cách lấy khoá (`tryAcquire`) và nhả khoá (`tryRelease`). AQS lo việc xếp hàng, chặn và đánh thức thread. `compareAndSetState(0, 1)` là một phép **CAS** (compare-and-set): \"nếu `state` đang là 0 (chưa ai giữ) thì đặt thành 1, làm trong một bước nguyên tử\". Hai thread cùng thử thì chỉ một thread thắng.",
      ],
      predict: {
        question: "4 thread cùng chạy `counter++` 100.000 lần mỗi thread, **không khoá**. Tổng cuối cùng là bao nhiêu?",
        options: [
          "Đúng 400.000",
          "Ít hơn 400.000, mất một phần cập nhật",
          "Nhiều hơn 400.000",
          "Chương trình ném exception",
        ],
        answer: 1,
        explain: "`counter++` gồm ba bước đọc, cộng, ghi. Hai thread có thể cùng đọc một giá trị rồi ghi đè nhau, nên nhiều lần cộng bị mất.",
      },
      widgetTitle: "4 thread tăng một bộ đếm 100.000 lần",
      compare: [
        way(
          "Không khoá",
          `for (int i = 0; i < 100_000; i++) counter++;     // 4 thread cùng chạy`,
          [
            ask("4 thread, mỗi thread 100.000 lần", bad("Đã chạy: tổng chỉ khoảng 231.000 thay vì 400.000. `counter++` là ba bước đọc, cộng, ghi, nên hai thread có thể cùng đọc một giá trị rồi ghi đè lẫn nhau (mất cập nhật). Đây là một {{race-condition|race condition}}.")),
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
        "Biết AQS giúp bạn hiểu: vì sao `ReentrantLock` có chế độ `fair` (công bằng: thread chờ lâu nhất được vào trước, đổi lại chậm hơn) hay không, vì sao thread gọi `await()` của `CountDownLatch` nằm chờ trong một hàng đợi, và `Semaphore` chỉ là AQS với `state` là số giấy phép.",
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
      senior: true,
      title: "StampedLock: đọc lạc quan",
      intro: [
        "Cần biết trước: mục này dùng `ReadWriteLock` và khái niệm reentrant của bài **sync** trong khoá Concurrency.",
        "Nhắc nhanh: `ReadWriteLock` có hai khoá, nhiều thread được **đọc** cùng lúc nhưng chỉ một thread được **ghi**, và khi đang ghi thì không ai được đọc. Một khoá là **reentrant** (vào lại được) nếu thread đang giữ nó có thể lấy lại nó lần nữa mà không tự chặn mình.",
        "`StampedLock` cho **đọc lạc quan**: đọc không khoá, rồi `validate(stamp)` xem có ai ghi chen vào không. Nếu có thì đọc lại bằng khoá.",
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
      intro: [
        "Cần biết trước: các công cụ này được dạy đầy đủ ở bài **sync** trong khoá Concurrency. `synchronized` là từ khoá Java cho chỉ một thread vào một đoạn code tại một lúc. `ReentrantLock` làm việc tương tự nhưng bằng code, có thêm thử khoá có thời hạn. `Semaphore` giới hạn số thread vào cùng lúc.",
        "Mỗi dòng là một tình huống. Chọn công cụ phù hợp.",
      ],
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
    { q: "JIT làm gì, và vì sao có warm-up?", a: "Method chạy đủ nhiều thì được biên dịch thành mã máy (C1 là tier 1 đến 3, thường thấy tier 3; rồi C2 là tier 4). Trước đó chạy thông dịch nên chậm. Ví dụ đo: lần 1 chậm gấp khoảng 9 lần lần 8, -Xint thì luôn chậm." },
    { q: "Vì sao không nên đo hiệu năng bằng vài lần chạy đầu?", a: "Sẽ đo cả warm-up. Dùng JMH với warm-up đúng cách." },
    { q: "AQS là gì?", a: "Khung gồm một biến state và hàng đợi thread chờ. ReentrantLock, Semaphore, CountDownLatch xây trên đó. Bạn chỉ viết tryAcquire và tryRelease." },
    { q: "StampedLock khác ReadWriteLock thế nào?", a: "Có đọc lạc quan không khoá (tryOptimisticRead rồi validate). Nhanh hơn khi đọc nhiều nhưng không reentrant, và phải validate sau khi đọc." },
  ],
  modelAnswer:
    "JVM nạp class bằng các ClassLoader theo cây bootstrap, platform, app và ủy quyền cho cha trước, nên danh tính của class là tên cộng loader: cùng tên khác loader là hai class khác nhau, gây ClassCastException. JIT biên dịch các method nóng thành mã máy (C1 rồi C2), nên Java chậm lúc khởi động rồi nhanh dần, và em đo hiệu năng bằng JMH có warm-up. Lock như ReentrantLock hay Semaphore xây trên AQS gồm biến state và hàng đợi chờ. StampedLock cho đọc lạc quan không khoá rồi validate, hợp khi đọc nhiều ghi ít, nhưng không reentrant.",
};
