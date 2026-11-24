import timeline from "../timelines/jvm.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Measurements below come from JDK 21 on an 8-CPU, 16 GB machine. The parts on reference types, off-heap memory (NMT) and the hot-thread dump were run on JDK 21 on macOS.
export const jvm: Lesson = {
  slug: "jvm",
  crumb: "JVM Memory & GC",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/jvm-memory-gc",
  videoVersion: "3d910865",
  scenes: timeline as Scene[],
  title: "JVM Memory & GC: bộ nhớ chia thế nào, GC dọn ra sao",
  subtitle:
    "Heap, stack, Metaspace; cái gì nằm ở đâu; GC tìm rác từ GC roots; vòng đời Eden, Survivor, Old Gen; G1 và ZGC; các loại OutOfMemoryError, memory leak, heap trong container và 5 bước điều tra.",
  openingQuiz: {
    question: "Object C và D trỏ vào nhau (C → D, D → C) nhưng không biến nào khác trỏ tới chúng. GC có thu hồi chúng không?",
    options: [
      "Không, vì mỗi object vẫn còn một tham chiếu",
      "Có, vì không đi tới được từ GC root nào",
      "Chỉ thu hồi khi gọi System.gc()",
      "Chỉ thu hồi khi Full GC",
    ],
    answer: 1,
    explain:
      "Java không đếm tham chiếu mà lần từ GC roots. Đã thử thật với WeakReference: cặp C ⇄ D bị thu hồi. Tham chiếu vòng không gây leak.",
  },
  roadmap: [
    "Chặng 1: các vùng nhớ, stack và heap, cái gì nằm ở đâu, StackOverflowError.",
    "Chặng 2: GC roots và reachability, mark, sweep, compact; generational GC; G1 và ZGC.",
    "Chặng 3: các loại OutOfMemoryError, memory leak, heap trong container, 5 bước điều tra OOM.",
  ],
  sections: [
    {
      id: "memory-areas",
      title: "Phần 1: Các vùng nhớ của JVM",
      scene: "areas",
      intro: [
        "JVM chia bộ nhớ thành ba vùng hay được hỏi:",
        "- **Heap**: dùng chung cho mọi thread, chứa mọi object và mảng (kể cả String pool từ Java 7), do GC (Garbage Collector, bộ phận tự thu hồi object không còn dùng) quản lý. Heap chia thành vùng cho object mới (Young Gen) và vùng cho object sống lâu (Old Gen); chi tiết ở Phần 4. Đầy thì `OutOfMemoryError: Java heap space`.",
        "- **Stack**: riêng từng thread. Mỗi lời gọi method là một frame chứa biến local, tham số, tham chiếu; đầy thì `StackOverflowError`.",
        "- **Metaspace** (thay PermGen từ Java 8): chứa thông tin class ở native memory; đầy thì `OutOfMemoryError: Metaspace`.",
      ],
      quiz: {
        question: "Metaspace chứa gì và nằm ở đâu?",
        options: ["Mọi object, trong heap", "Metadata của class (tên, method, bytecode), ở native memory", "Biến local, trên stack", "String pool"],
        answer: 1,
        explain: "Metaspace thay PermGen từ Java 8, không nằm trong heap. Tạo class động liên tục có thể làm đầy nó.",
      },
      parts: [
        {
          id: "classloading-jit",
          title: "Class được nạp thế nào (class loader)",
          intro: [
            "Bài ClassLoader, JIT, AQS (`java-runtime`) đi sâu hơn; ở đây chỉ nhắc phần liên quan tới bộ nhớ.",
            "**Class loading.** Class không được nạp hết lúc khởi động, mà nạp lần đầu khi code cần tới nó. Có ba class loader xếp tầng:",
            "- **Bootstrap**: nạp class lõi như `java.lang.String`.",
            "- **Platform**: nạp các module khác của JDK như `java.sql`.",
            "- **App**: nạp class của bạn trên classpath.",
            "Đã chạy: `String.class.getClassLoader()` là `null` (bootstrap không có object Java), `java.sql.Connection` do `platform` nạp, class của mình do `app` nạp, và cha của `app` là `platform`.",
            "**Parent delegation.** Khi cần nạp một class, class loader hỏi cha trước, cha không tìm thấy thì mới tự nạp. Lý do: class lõi luôn được nạp từ JDK, nên không ai viết được một `java.lang.String` giả trên classpath để thay thế nó, và mỗi class chỉ được nạp một lần. Thông tin class đã nạp nằm trong Metaspace ở trên.",
          ],
          quiz: {
            question: "Vì sao không thể đặt một class java.lang.String tự viết lên classpath để thay String của JDK?",
            options: [
              "Vì javac cấm đặt tên String",
              "Vì parent delegation: app class loader hỏi cha trước, và bootstrap đã nạp String thật từ JDK",
              "Vì String là final",
              "Vì classpath không chứa được package java",
            ],
            answer: 1,
            explain: "Class loader luôn hỏi cha trước. Yêu cầu nạp java.lang.String đi lên tới bootstrap, bootstrap tìm thấy String thật trong JDK và trả về luôn, nên bản trên classpath không bao giờ được dùng.",
          },
        },
        {
          id: "jit-warmup",
          title: "JIT làm code nhanh dần, và warm-up",
          intro: [
            "Class đã nạp thì bytecode của nó chạy thế nào? Chi tiết thêm ở bài `java-runtime`.",
            "JVM bắt đầu bằng cách thông dịch bytecode từng lệnh, chạy chậm. Method nào được gọi nhiều thì {{jit|JIT compiler}} dịch nó sang mã máy: trước tiên bằng C1 (dịch nhanh, tối ưu ít), rồi nếu vẫn nóng thì bằng C2 (dịch lâu, tối ưu mạnh). Cột tier trong `-XX:+PrintCompilation`: tier 0 là thông dịch, **tier 1 đến 3 là C1**, **tier 4 là C2**. Đã chạy: method `sq` được gọi 200.000 lần, xuất hiện ở tier 3 (C1 có thu thập profile) rồi tier 4 (C2), sau đó bản tier 3 bị đánh dấu `made not entrant` (bỏ, không dùng nữa). Tier 2 chỉ xuất hiện khi hàng đợi của C2 đang bận.",
            "Vì vậy ứng dụng Java cần **warm-up**: vài phút đầu sau khi khởi động chạy chậm hơn, cho tới khi các method nóng được dịch xong. Khi đo hiệu năng, bỏ qua các lần chạy đầu.",
          ],
          quiz: {
            question: "Vì sao vài phút đầu sau khi khởi động, ứng dụng Java thường chạy chậm hơn về sau?",
            options: [
              "Vì GC chưa chạy lần nào",
              "Vì code mới được thông dịch; method nóng chưa được JIT dịch sang mã máy",
              "Vì Metaspace chưa đầy",
              "Vì JVM chưa nạp class bootstrap",
            ],
            answer: 1,
            explain: "Lúc đầu bytecode được thông dịch từng lệnh. Method được gọi nhiều dần được C1 rồi C2 dịch sang mã máy, nên tốc độ tăng dần: đó là warm-up.",
          },
        },
      ],
    },
    {
      id: "stack-heap",
      title: "Phần 2: Stack và Heap",
      scene: "stackheap",
      intro: [
        "Trong `placeOrder()`: `int quantity` và biến `order` (chỉ là tham chiếu) nằm trong frame trên stack; object `Order` và `Item` thật nằm trên heap. Method kết thúc thì frame bị xoá; hai object không còn ai tham chiếu và GC sẽ thu hồi sau.",
        "Stack riêng từng thread nên biến local thread-safe tự nhiên; heap dùng chung nên phải đồng bộ khi nhiều thread cùng sửa. ",
        "Một method đệ quy không có điểm dừng sẽ đẩy frame cho tới khi stack đầy và ném `StackOverflowError`. Đã chạy nhiều lần với stack mặc định: khoảng 39.000 tới 58.000 tầng, mỗi lần một khác. Lý do: {{jit|JIT}} dịch method sang mã máy vào lúc hơi khác nhau mỗi lần chạy, và frame của code đã dịch nhỏ hơn frame của code thông dịch. Chạy với `-Xint` (tắt JIT, chỉ thông dịch) thì lần nào cũng đúng 20.594 tầng.",
        "Kích thước stack của mỗi thread đặt bằng `-Xss`, ví dụ `-Xss256k` là 256 KB. Đã chạy: với `-Xss256k` chỉ còn khoảng 1.479 tầng.",
      ],
      widget: "memory-place",
      widgetTitle: "Cái gì nằm ở đâu?",
      quiz: {
        question: "Hai entity Order và Customer dùng Lombok @Data (Lombok tự sinh toString() in ra mọi field), trỏ hai chiều vào nhau. Gọi order.toString() thì sao?",
        options: ["In bình thường", "StackOverflowError vì toString gọi vòng vô hạn", "OutOfMemoryError: Java heap space", "Lỗi biên dịch"],
        answer: 1,
        explain: "toString của Order in Customer, toString của Customer lại in Order... mỗi lời gọi đẩy một frame cho tới khi stack đầy. Loại trừ field hai chiều khỏi toString/equals/hashCode.",
      },
    },
    {
      id: "gc-roots",
      title: "Phần 3: GC tìm rác thế nào",
      scene: "reach",
      intro: [
        "Phần 2 nói object trên heap \"không còn ai tham chiếu\" thì GC thu hồi. Nhưng GC biết điều đó bằng cách nào?",
        "GC bắt đầu từ **GC roots** rồi lần theo mọi tham chiếu; object không tới được là rác. GC roots gồm:",
        "- **Biến local và tham số** trên stack của các thread đang chạy.",
        "- **Field static**.",
        "- **Thread đang sống**.",
        "- **Tham chiếu JNI** (JNI là cầu nối để code native C/C++ giữ tham chiếu tới object Java).",
        "Java không dùng reference counting nên tham chiếu vòng không gây leak.",
        "Thu gom gồm ba bước:",
        "- **Mark**: đánh dấu object sống.",
        "- **Sweep**: thu hồi phần còn lại.",
        "- **Compact**: dồn object sống lại.",
        "Có pha **stop-the-world** dừng mọi thread ứng dụng; pause dài làm request chậm đột biến (p99 = thời gian phản hồi mà 99% request nhanh hơn, tức nhóm 1% chậm nhất).",
      ],
      widget: "gc-reach",
      widgetTitle: "Bật tắt tham chiếu, xem ai thành rác",
      quiz: {
        question: "Gọi System.gc() có chắc chắn chạy GC không?",
        options: ["Có, ngay lập tức", "Không, chỉ là gợi ý; JVM có thể bỏ qua, và nếu làm theo thường gây Full GC", "Chỉ chạy Minor GC", "Có, nhưng chỉ ở G1"],
        answer: 1,
        explain: "Có thể tắt hẳn bằng -XX:+DisableExplicitGC. Không nên gọi trong code ứng dụng.",
      },
      parts: [
        {
          id: "reference-types",
          title: "Strong, soft, weak, phantom reference và WeakHashMap",
          intro: [
            "GC giữ lại mọi object đi tới được từ GC roots. Nhưng có lúc bạn muốn **trỏ tới** một object mà **không giữ nó sống**.",
            "Tình huống: bạn gắn thêm thông tin cho các object `Session` bằng một `HashMap<Session, Meta>`. Session hết hạn, không còn ai dùng, nhưng map vẫn trỏ tới nó làm key, nên GC không bao giờ thu hồi được. Đó là một leak (Phần 7).",
            "Java có bốn mức tham chiếu, từ mạnh tới yếu:",
            "- **Strong**: biến bình thường `Object o = ...`. Còn strong reference thì object còn sống.",
            "- **Soft** (`SoftReference`): GC chỉ thu hồi khi **sắp hết bộ nhớ**. Hợp cho cache nhạy bộ nhớ.",
            "- **Weak** (`WeakReference`): GC thu hồi ở **lần chạy kế tiếp** nếu không còn strong reference nào. `WeakHashMap` dùng weak reference cho key.",
            "- **Phantom** (`PhantomReference`): `get()` luôn trả `null`; chỉ dùng để biết object **đã bị thu hồi** (qua `ReferenceQueue`) rồi dọn tài nguyên bên ngoài. `Cleaner` của JDK xây trên nó, thay cho `finalize()`.",
          ],
          predict: {
            question: "Map có 2 entry: key thứ nhất còn được một biến giữ, key thứ hai không ai giữ. Sau `System.gc()`, `HashMap` và `WeakHashMap` còn mấy entry?",
            options: ["Cả hai còn 2", "HashMap còn 2, WeakHashMap còn 1", "Cả hai còn 1", "HashMap còn 1, WeakHashMap còn 2"],
            answer: 1,
            explain: "HashMap giữ key bằng strong reference nên key không ai dùng vẫn sống. WeakHashMap giữ key bằng weak reference, GC thu hồi key đó và entry tự biến mất.",
          },
          widgetTitle: "Cùng gắn dữ liệu vào object, hai loại map",
          compare: [
            way(
              "HashMap",
              `Map<Object, String> map = new HashMap<>();
Object held = new Object();
map.put(held, "a");
map.put(new Object(), "b");   // key không ai giữ
System.gc();`,
              [
                ask("Sau GC còn mấy entry?", bad("Đã chạy: **2**. Map chính là strong reference giữ key thứ hai sống mãi.")),
              ],
              "Map còn sống thì mọi key trong nó còn sống, tới khi có người gọi `remove`.",
            ),
            way(
              "WeakHashMap",
              `Map<Object, String> map = new WeakHashMap<>();
Object held = new Object();
map.put(held, "a");
map.put(new Object(), "b");
System.gc();`,
              [
                ask("Sau GC còn mấy entry?", ok("Đã chạy: **1**, key `held` vẫn còn. Entry có key không ai giữ tự biến mất.")),
                ask("Value trỏ ngược lại key, ví dụ `put(k, List.of(k))`", bad("Đã chạy: entry **không** bị xoá. Value được map giữ mạnh, value lại giữ key, nên key không bao giờ yếu đi.")),
                ask("Key là String literal như `\"ORDER\"`", bad("Đã chạy: entry vẫn còn sau GC. Literal nằm trong String pool, luôn có strong reference.")),
              ],
              "Entry sống theo key. Chỉ dùng khi key là object có vòng đời riêng.",
            ),
          ],
          after: [
            "Đã chạy thêm với bốn loại reference, mỗi loại trỏ tới một mảng 1 KB: sau `System.gc()`, `weak.get()` thành `null`, `soft.get()` vẫn còn (heap rộng), `phantom.get()` luôn `null` và phantom reference được đưa vào `ReferenceQueue`. Với `-Xmx64m` và một vòng lặp cấp phát tới khi hết heap, soft reference bị xoá trước khi ném `OutOfMemoryError`.",
            "Thực tế: cache thì dùng Caffeine với giới hạn kích thước (nó có cả `weakKeys()` và `softValues()`); tự dùng `WeakHashMap` hay soft reference làm cache chính thường khó đoán, vì GC quyết định lúc nào xoá.",
          ],
          takeaway: {
            lines: [
              "Strong giữ sống; soft xoá khi sắp hết bộ nhớ; weak xoá ở lần GC kế tiếp; phantom chỉ báo object đã bị thu hồi.",
              "`WeakHashMap` xoá entry khi key không còn ai giữ, nhưng value trỏ ngược lại key hay key là String literal thì không bao giờ xoá.",
            ],
          },
          quiz: {
            question: "Cần một cache tự nhường bộ nhớ khi heap sắp đầy, còn bình thường thì giữ lại. Loại reference nào hợp nhất?",
            options: ["Strong", "Soft", "Weak", "Phantom"],
            answer: 1,
            explain: "Soft reference chỉ bị xoá khi JVM thiếu bộ nhớ. Weak thì bị xoá ngay ở lần GC kế tiếp, nên cache gần như luôn trống. Đã chạy với `-Xmx64m`: soft bị xoá trước khi ném OutOfMemoryError.",
          },
        },
      ],
    },
    {
      id: "generational",
      title: "Phần 4: Vòng đời một object",
      board: {
        title: "Vòng đời object: Eden, Survivor rồi Old Gen",
        highlight: "Eden, Survivor rồi Old Gen",
        chips: ["Đa số object chết rất trẻ", "Tuổi tối đa 15"],
        cards: [
          {
            title: "Sau mỗi Minor GC",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["Object mới ở Eden", "Minor GC dọn Young Gen"],
              ok: ["Còn sống", "Sang Survivor, tuổi + 1"],
              bad: ["Đã chết", "Bị dọn khỏi Eden"],
            },
            notes: ["Đủ tuổi (tối đa 15) thì lên Old Gen.", "Minor GC rất thường xuyên và rẻ, vì chỉ copy số ít object còn sống."],
            takeaway: "Object ngắn hạn chết ngay ở Young Gen, không bao giờ lên Old",
          },
          {
            title: "Khi Full GC xảy ra liên tục",
            diagram: {
              kind: "hub",
              inputs: [{ label: "Heap quá nhỏ" }, { label: "Memory leak" }, { label: "Quá nhiều object sống lâu" }],
              center: "Full GC liên tục",
              rulesTitle: "Full GC",
              rules: ["Dọn cả heap", "Pause dài", "Nên hiếm"],
            },
            takeaway: "Full GC xảy ra liên tục là dấu hiệu có vấn đề",
          },
        ],
        conclusion: "**Kết luận:** Minor GC thường xuyên và rẻ, Full GC phải hiếm; muốn heap khỏe thì để object chết sớm ở Young Gen.",
      },
      scene: "gen",
      intro: [
        "Giả thuyết thế hệ: **đa số object chết rất trẻ** (DTO của một request, String tạm). Object mới ở Eden; sau mỗi Minor GC, object còn sống sang Survivor và tuổi +1; đủ tuổi (tối đa 15) thì lên Old Gen.",
        "Minor GC dọn Young Gen, rất thường xuyên và rẻ: đo được 2 triệu mảng ngắn hạn chỉ tốn 5 lần young GC. Full GC dọn cả heap, pause dài và nên hiếm; xảy ra liên tục là dấu hiệu heap quá nhỏ, leak hoặc quá nhiều object sống lâu.",
      ],
      quiz: {
        question: "Minor GC có stop-the-world không?",
        options: ["Không bao giờ", "Có, nhưng thường rất ngắn vì Young Gen nhỏ và phần lớn object đã chết", "Có, và luôn lâu hơn Full GC", "Chỉ khi dùng ZGC"],
        answer: 1,
        explain: "Chỉ cần copy số ít object còn sống ra khỏi Eden nên pause ngắn.",
      },
    },
    {
      id: "collectors",
      senior: true,
      title: "Phần 5: Các loại Garbage Collector",
      scene: "gcs",
      intro: [
        "Bốn GC hay được nhắc tới:",
        "- **G1**: mặc định từ Java 9. Chia heap thành nhiều region, ưu tiên dọn region nhiều rác trước, đặt mục tiêu pause (`-XX:MaxGCPauseMillis`, mặc định 200ms).",
        "- **ZGC**: pause dưới 1ms bất kể heap lớn cỡ nào. Ở Java 21 chế độ generational (chia Young và Old như Phần 4) phải bật thêm: `-XX:+UseZGC -XX:+ZGenerational`. Đã chạy JDK 21 chỉ với `-XX:+UseZGC`: log GC ghi `Using legacy single-generation mode`. Từ Java 23 generational là mặc định.",
        "- **Parallel**: ưu tiên throughput.",
        "- **Serial**: một thread.",
        "Hai thước đo cần phân biệt khi chọn GC. **Throughput** là tỉ lệ thời gian CPU dành cho code của bạn thay vì cho GC: hợp với job xử lý theo lô, miễn tổng thời gian ngắn. **Latency** (độ trễ) ở đây là độ dài mỗi lần pause: hợp với web API, nơi một pause dài làm request bị chậm. GC thường phải đánh đổi giữa hai thứ: Parallel tối ưu throughput nhưng pause dài hơn, ZGC giữ pause cực ngắn nhưng tốn thêm CPU chạy song song với ứng dụng.",
        "Đã chạy JDK 21 không cấu hình: JVM chọn `-XX:+UseG1GC`, các GC bean là `G1 Young Generation`, `G1 Concurrent GC`, `G1 Old Generation`. Câu trả lời an toàn: để mặc định G1, chỉ đổi khi có số liệu cho thấy GC pause là vấn đề. Lưu ý: JVM chỉ tự chọn G1 khi thấy từ 2 CPU và khoảng 1792 MB RAM trở lên; pod (một container chạy app trên Kubernetes) giới hạn 1 CPU sẽ âm thầm chạy Serial GC (đã kiểm tra với `-XX:ActiveProcessorCount=1`), nên pod nhỏ thì khai báo rõ `-XX:+UseG1GC`.",
      ],
      quiz: {
        question: "Ứng dụng Spring Boot thông thường nên dùng GC nào?",
        options: ["Serial", "Để mặc định G1, chỉ đổi khi có số liệu", "Luôn ZGC", "Tự viết GC"],
        answer: 1,
        explain: "G1 phù hợp đa số ứng dụng web. ZGC đáng cân nhắc khi heap rất lớn và cần độ trễ thấp.",
      },
    },
    {
      id: "oom",
      title: "Phần 6: Các loại OutOfMemoryError",
      scene: "oom",
      intro: [
        "`OutOfMemoryError` không chỉ có một loại. Phần đuôi của thông báo cho biết vùng nào đầy:",
        "- **`Java heap space`**: heap đầy (leak, load quá nhiều dữ liệu, `-Xmx` quá nhỏ).",
        "- **`GC overhead limit exceeded`**: GC chạy liên tục mà thu được rất ít.",
        "- **`Metaspace`**: quá nhiều class.",
        "- **`unable to create native thread`**: tạo thread không giới hạn.",
        "- **`Direct buffer memory`**: buffer off-heap (bộ nhớ ngoài heap, JVM không dọn bằng GC thông thường) không được giải phóng.",
      ],
      widget: "oom-match",
      widgetTitle: "Triệu chứng này ra lỗi gì?",
      quiz: {
        question: "Ứng dụng báo OutOfMemoryError: unable to create native thread. Nguyên nhân hợp lý nhất?",
        options: ["Heap quá nhỏ", "Tạo thread không giới hạn, ví dụ new Thread trong vòng lặp hay newCachedThreadPool", "Quá nhiều class", "Đệ quy vô hạn"],
        answer: 1,
        explain: "Đây là giới hạn của hệ điều hành về số thread, không phải heap. Dùng thread pool có kích thước giới hạn.",
      },
    },
    {
      id: "leak",
      senior: true,
      title: "Phần 7: Java vẫn bị memory leak",
      scene: "leak",
      intro: [
        "GC chỉ thu hồi object không còn tham chiếu. Leak xảy ra khi code vô tình giữ tham chiếu: đã thử `static Map CACHE` chỉ put, mỗi entry 100 KB, chạy với `-Xmx64m` thì `OutOfMemoryError: Java heap space` sau 621 entry (khoảng 60 MB).",
        "Các nguồn leak hay gặp, mỗi cái một nguyên nhân:",
        "- **Collection static lớn dần**: field static sống suốt đời ứng dụng, nên mọi thứ bỏ vào mà không xoá cũng sống mãi.",
        "- **Cache tự viết không giới hạn**: chỉ thêm không loại. Dùng thư viện như Caffeine có giới hạn kích thước và TTL.",
        "- **`ThreadLocal` không `remove()`**: `ThreadLocal` là biến mà mỗi thread có một bản riêng. Thread trong pool sống mãi, nên giá trị gắn vào nó cũng sống mãi.",
        "- **Queue không giới hạn**: bên gửi nhanh hơn bên xử lý thì phần tử dồn lên mãi.",
        "- **Key HashMap bị sửa sau khi put**: hashCode đổi nên không tìm lại được để xoá, entry nằm đó mãi (xem bài HashMap).",
        "- **Listener không huỷ đăng ký**: listener là object bạn đăng ký để được gọi khi có sự kiện; nguồn sự kiện giữ tham chiếu tới nó cho tới khi huỷ đăng ký.",
        "- **Đọc hàng triệu entity trong một transaction mà không `clear()`**: persistence context của JPA giữ mọi entity đã đọc để theo dõi thay đổi, tới khi transaction kết thúc hoặc gọi `entityManager.clear()`.",
      ],
      quiz: {
        question: "Vì sao ThreadLocal không remove() lại gây leak trong ứng dụng web?",
        options: [
          "Vì ThreadLocal lưu ở Metaspace",
          "Vì thread trong pool sống mãi, nên dữ liệu gắn với thread cũng sống mãi",
          "Vì GC không quét ThreadLocal",
          "Vì ThreadLocal là static",
        ],
        answer: 1,
        explain: "Tomcat tái sử dụng thread qua nhiều request; giá trị ThreadLocal không bị xoá thì vẫn reachable từ thread đó.",
      },
    },
    {
      id: "container",
      senior: true,
      title: "Phần 8: Heap trong container",
      scene: "container",
      intro: [
        "Không cấu hình, heap tối đa chỉ bằng 1/4 bộ nhớ JVM thấy: máy 16 GB ra 4096 MB. Đã đo với giới hạn 1, 2, 4, 8 GB: 256, 512, 1024, 2048 MB. Pod 2 GB mà heap chỉ 512 MB thì rất dễ OOM dù pod còn RAM trống.",
        "Đặt `-XX:MaxRAMPercentage=75` (đo được 1536 MB trên 2 GB) để chừa chỗ cho metaspace, stack, direct buffer. Ngược lại, `-Xmx` sát bằng limit thì heap cộng phần ngoài heap vượt limit và container bị kill (OOMKilled, exit 137).",
      ],
      widget: "heap-container",
      widgetTitle: "Heap tối đa trong container",
      takeaway: {
        lines: [
          "Không cấu hình thì heap chỉ bằng 1/4 bộ nhớ. Đặt `-XX:MaxRAMPercentage=75` để chừa chỗ cho phần ngoài heap, và đừng đặt `-Xmx` sát bằng limit của pod.",
        ],
      },
      quiz: {
        question: "Pod limit 2 GB, không cấu hình heap. Heap tối đa khoảng bao nhiêu?",
        options: ["2048 MB", "1536 MB", "512 MB", "Không giới hạn"],
        answer: 2,
        explain: "Mặc định 25%: đã đo -XX:MaxRAM=2g ra maxMemory 512 MB.",
      },
      parts: [
        {
          id: "container-offheap",
          senior: true,
          title: "Pod bị kill vì bộ nhớ trong khi heap còn thấp",
          intro: [
            "Ta vừa chừa 25% cho phần ngoài heap. Phần đó gồm những gì, và khi nó phình to thì nhìn ở đâu?",
            "Sự cố kinh điển: pod limit 1 GiB, dashboard cho thấy heap chỉ dùng 45%, vậy mà pod bị **OOMKilled, exit code 137**. Log không có `OutOfMemoryError`, cũng không có heap dump. Lý do: không phải JVM báo lỗi, mà kernel của Linux giết cả process vì tổng bộ nhớ vượt limit. JVM không kịp làm gì.",
            "Bộ nhớ của một process JVM là heap **cộng** các vùng ngoài heap:",
            "- **Metaspace**: thông tin class (Phần 1).",
            "- **Thread stack**: mỗi thread một stack, mặc định khoảng 1 MB trên Linux x64 (`-Xss`, tuỳ hệ điều hành). 500 thread là thêm cỡ vài trăm MB; con số đo ở dưới (439 MB cho 200 thread) là trên macOS, nơi đã chạy `java -XX:+PrintFlagsFinal` thấy `ThreadStackSize` = 2048 KB (2 MB mỗi thread, nên 200 thread cỡ 400 MB); Linux x64 thường là 1 MB theo tài liệu JDK.",
            "- **Code cache**: mã máy do JIT sinh ra.",
            "- **Direct buffer**: bộ nhớ ngoài heap của NIO, Netty, client Kafka (`ByteBuffer.allocateDirect`). Giới hạn bằng `-XX:MaxDirectMemorySize`, mặc định bằng heap tối đa.",
            "- **Cấu trúc của GC** và bộ nhớ nội bộ khác của JVM.",
            "Công cụ để thấy các vùng này là **Native Memory Tracking (NMT)**: khởi động với `-XX:NativeMemoryTracking=summary`, rồi chạy `jcmd <pid> VM.native_memory summary`.",
          ],
          predict: {
            question: "Chạy với `-Xmx256m`, heap mới dùng 2 MB, chương trình giữ 200 MB direct buffer và 200 thread đang ngủ. NMT báo tổng bộ nhớ committed khoảng bao nhiêu?",
            options: ["Khoảng 2 MB", "Khoảng 256 MB, vì heap tối đa là 256 MB", "Gần 1 GB", "Đúng 200 MB"],
            answer: 2,
            explain: "Heap chỉ là một dòng trong báo cáo. Direct buffer và stack của 200 thread nằm ngoài `-Xmx`, cộng lại gần 1 GB.",
          },
          widgetTitle: "Cùng một process, hai cách nhìn bộ nhớ",
          compare: [
            way(
              "Chỉ nhìn heap",
              `Runtime rt = Runtime.getRuntime();
long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
// hoặc: jcmd <pid> GC.heap_info, metric jvm.memory.used{area=heap}`,
              [
                ask("Process giữ 200 MB direct buffer và 200 thread", bad("Đã chạy: `heap used MB = 2`. Nhìn heap thì tưởng mọi thứ ổn.")),
              ],
              "Heap thấp không có nghĩa là process dùng ít bộ nhớ.",
            ),
            way(
              "Native Memory Tracking",
              `java -XX:NativeMemoryTracking=summary -Xmx256m -jar app.jar
jcmd <pid> VM.native_memory summary scale=MB
# theo dõi cái gì tăng dần:
jcmd <pid> VM.native_memory baseline
jcmd <pid> VM.native_memory summary.diff`,
              [
                ask("Cùng process đó", ok("Đã chạy: `Total: reserved=2298MB, committed=973MB`. Trong đó `Java Heap committed=256MB`, `Other committed=200MB` (direct buffer), `Thread committed=439MB` (con số thread phụ thuộc hệ điều hành, đây là macOS).")),
                ask("Bộ nhớ tăng dần qua nhiều giờ", ok("Lấy `baseline` lúc mới chạy, sau vài giờ chạy `summary.diff` để thấy đúng vùng nào đang lớn lên: Thread (rò thread), Other (direct buffer), Class/Metaspace (rò ClassLoader).")),
              ],
              "Thấy được mọi vùng ngoài heap, và vùng nào đang lớn dần.",
            ),
          ],
          after: [
            "Phân biệt hai kiểu chết: `OutOfMemoryError` trong log là JVM tự báo một vùng của nó đầy (Phần 6). Exit code 137 (OOMKilled) mà không có `OutOfMemoryError` là kernel giết process vì tổng bộ nhớ vượt limit: nhìn ra ngoài heap.",
            "Cách giữ an toàn: `-XX:MaxRAMPercentage=75` thay vì `-Xmx` sát limit, đặt `-XX:MaxDirectMemorySize` khi dùng nhiều NIO hay Netty, dùng thread pool có giới hạn, và bật NMT ở môi trường test để biết process thật sự cần bao nhiêu (NMT tốn thêm một ít CPU và bộ nhớ, nên không bật mặc định).",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Exit 137, heap thấp, không có OutOfMemoryError → kernel giết process vì tổng bộ nhớ → thủ phạm ở ngoài heap (thread, direct buffer, metaspace) → bật NMT và so `summary.diff`.",
            ],
          },
          quiz: {
            question: "Pod bị OOMKilled (exit 137), heap chỉ dùng 45%, log không có OutOfMemoryError. Bước điều tra hợp lý nhất?",
            options: [
              "Tăng `-Xmx` lên bằng limit của pod",
              "Lấy heap dump và mở bằng Eclipse MAT",
              "Bật Native Memory Tracking, so baseline với `summary.diff` để xem vùng ngoài heap nào đang tăng",
              "Gọi System.gc() định kỳ",
            ],
            answer: 2,
            explain: "Heap còn thấp nên heap dump không chỉ ra thủ phạm. NMT cho thấy thread stack, direct buffer, metaspace. Tăng `-Xmx` còn làm phần ngoài heap ít chỗ hơn.",
          },
        },
      ],
    },
    {
      id: "investigate",
      senior: true,
      title: "Phần 9: Production bị OOM: làm gì?",
      scene: "debug",
      intro: [
        "**Heap dump** là ảnh chụp toàn bộ object đang có trên heap lúc đó (ghi ra file `.hprof`): nhìn vào đó biết kiểu object nào chiếm bao nhiêu MB và ai đang giữ nó. Năm bước điều tra:",
        "- **1. Xem metrics** heap và GC pause (Actuator đưa số đo ra, Micrometer là thư viện thu thập số đo của Spring): tăng dần đều là dấu hiệu leak, tăng vọt là load quá nhiều một lúc.",
        "- **2. Lấy heap dump**: production luôn bật `-XX:+HeapDumpOnOutOfMemoryError` để JVM tự ghi file khi OOM.",
        "- **3. Mở bằng Eclipse MAT** (công cụ đọc heap dump): **dominator tree** liệt kê object theo lượng bộ nhớ giữ lại (nếu xoá nó thì giải phóng được bao nhiêu), **leak suspects** là báo cáo tự đoán chỗ nghi leak.",
        "- **4. Tìm thủ phạm**: object chiếm nhiều nhất và ai đang giữ tham chiếu.",
        "- **5. Sửa code**: giới hạn cache, remove ThreadLocal, phân trang query.",
        "Công cụ: `jcmd <pid> GC.heap_info`, `jcmd <pid> GC.heap_dump /tmp/heap.hprof`, `jstat -gcutil <pid> 1000`, `jstack <pid>`, JFR, và Actuator `jvm.memory.used`, `jvm.gc.pause` (đừng public `/actuator/heapdump`).",
      ],
      quiz: {
        question: "Heap tăng dần đều qua nhiều giờ, mỗi lần Full GC chỉ thu lại được rất ít. Nhiều khả năng là gì?",
        options: ["Một request load file lớn", "Memory leak: có thứ giữ tham chiếu và lớn dần", "GC đang chạy tốt", "Thiếu CPU"],
        answer: 1,
        explain: "Heap dump + MAT sẽ chỉ ra object chiếm nhiều nhất và đường tham chiếu giữ nó lại.",
      },
      parts: [
        {
          id: "cpu-high",
          senior: true,
          title: "CPU 100%: tìm đúng thread và đúng dòng code",
          intro: [
            "Năm bước trên dành cho bộ nhớ. Sự cố thứ hai hay gặp: CPU của pod lên 100%, request chậm dần, heap vẫn bình thường. Log không nói gì, vì code đang chạy không hề lỗi, chỉ là chạy mãi.",
            "Cách làm là đi từ **thread nóng nhất** tới **dòng code** của nó:",
            "- **1. Tìm thread nóng**: `top -H -p <pid>` (Linux) liệt kê CPU theo từng thread. Lấy TID của thread cao nhất, ví dụ `12345`.",
            "- **2. Lấy thread dump**: `jstack <pid>` hoặc `jcmd <pid> Thread.print`. Mỗi thread có một dòng `nid=`, chính là TID mà `top` thấy.",
            "- **3. Khớp số**: Java 8, 11, 17 in `nid` ở dạng hex, nên đổi trước: `printf '%x\\n' 12345` ra `3039`, rồi tìm `nid=0x3039`. Đã chạy trên JDK 21 **trên macOS**: jstack in `nid` ở dạng thập phân (`nid=27651`). Các lệnh `top -H` ở đây là của Linux, và chưa đo trên Linux JDK 21, nên hãy nhìn `nid` mà JDK bạn dùng in ra (`0x...` thì đổi sang hex, không có `0x` thì so thẳng).",
            "- **4. Lấy 3 dump cách nhau khoảng 5 giây**: thread đó lần nào cũng `RUNNABLE` ở **cùng một chỗ** là vòng lặp nóng (vòng lặp không thoát, regex chạy quá lâu, HashMap bị hỏng do nhiều thread cùng sửa). Mỗi lần một chỗ khác nhau thì là tải cao bình thường, cần thêm máy hoặc tối ưu.",
            "- **5. Nếu thread nóng là thread GC** (tên như `GC Thread#0`, `G1 Conc#0`): không phải lỗi CPU mà là heap sắp đầy và GC chạy liên tục. Quay lại 5 bước điều tra bộ nhớ ở trên.",
          ],
          predict: {
            question: "Hai lần jstack cách nhau 3 giây. Thread `report-worker` cả hai lần đều `RUNNABLE` tại `Hot.spin(Hot.java:3)`, và `cpu=` tăng từ khoảng 2000 ms lên 4800 ms. Kết luận nào hợp lý?",
            options: [
              "Thread đang chờ khoá",
              "Một vòng lặp nóng ở `Hot.java` dòng 3 đang ăn trọn một CPU",
              "GC đang chạy",
              "Tải cao bình thường, cần thêm máy",
            ],
            answer: 1,
            explain: "Cùng một frame `RUNNABLE` ở mọi lần dump, và CPU tăng gần bằng thời gian trôi qua (khoảng 2,8 giây CPU trong khoảng 3,2 giây), là dấu hiệu của một vòng lặp không dừng.",
          },
          widgetTitle: "Đoán từ log, hay đi từ thread nóng",
          compare: [
            way(
              "Đọc log và đoán",
              `grep ERROR app.log      # không có gì
# restart pod cho CPU xuống`,
              [
                ask("CPU 100% do một vòng lặp không thoát", bad("Log trống, vì code không ném lỗi. Restart làm CPU xuống một lúc, rồi request tiếp theo đi vào cùng nhánh code lại kéo CPU lên.")),
              ],
              "Không có bằng chứng, chỉ dập triệu chứng.",
            ),
            way(
              "top -H rồi jstack",
              `top -H -p <pid>                 # TID nóng nhất
jstack <pid> | grep -A4 '"report-worker"'
# đợi 3 đến 5 giây rồi dump lại, so sánh`,
              [
                ask("Lần dump thứ nhất", ok("Đã chạy: `\"report-worker\" #20 [27651] ... cpu=2016.16ms elapsed=2.59s ... nid=27651 runnable`, `java.lang.Thread.State: RUNNABLE`, `at Hot.spin(Hot.java:3)`.")),
                ask("Lần dump thứ hai, sau 3 giây", ok("Đã chạy: vẫn `RUNNABLE` tại `Hot.spin(Hot.java:3)`, `cpu=4788.02ms elapsed=5.82s`. Cùng frame, CPU tăng gần bằng thời gian trôi qua: vòng lặp nóng ở đúng dòng 3.")),
              ],
              "Từ TID nóng tới đúng dòng code trong vài phút.",
            ),
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "`top -H` lấy TID nóng → khớp `nid` trong jstack (hex ở Java 8 tới 17; JDK 21 đã đo ở dạng thập phân trên macOS) → 3 lần dump cùng một frame RUNNABLE → đó là dòng code gây CPU cao.",
            ],
          },
          quiz: {
            question: "Trên Java 11, `top -H` cho thấy thread TID `12345` ăn 100% CPU. Tìm thread đó trong jstack thế nào?",
            options: [
              "Tìm `nid=12345`",
              "Đổi sang hex (`printf '%x'` ra `3039`) rồi tìm `nid=0x3039`",
              "Tìm thread có tên `12345`",
              "Không tìm được, phải dùng heap dump",
            ],
            answer: 1,
            explain: "Ở Java 8, 11, 17, jstack in `nid` (native thread id) dạng hex. Trên JDK 21 chạy trên macOS nó in dạng thập phân; trên Linux hãy kiểm tra dạng `nid` của JDK bạn dùng. Quy tắc chung: có `0x` thì đổi TID sang hex.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Stack là bộ nhớ riêng của từng thread, mỗi lời gọi method là một frame chứa biến local và tham chiếu; heap dùng chung, chứa mọi object và do GC quản lý; Metaspace chứa thông tin class. GC lần từ GC roots như biến local, field static, thread đang sống; object không tới được là rác, kể cả khi trỏ vòng vào nhau. Vì đa số object chết trẻ nên heap chia Young và Old: Minor GC dọn Eden rất thường xuyên và rẻ, Full GC dọn cả heap và nên hiếm. Em để mặc định G1. Khi production bị OOM, em xem metrics để biết heap tăng dần hay tăng vọt, lấy heap dump nhờ HeapDumpOnOutOfMemoryError, mở bằng Eclipse MAT để tìm object chiếm nhiều nhất và ai đang giữ tham chiếu; nguyên nhân hay gặp là cache không giới hạn, ThreadLocal không remove hay query load cả bảng. Trong container em đặt MaxRAMPercentage khoảng 75 vì mặc định heap chỉ bằng một phần tư bộ nhớ.",
};
