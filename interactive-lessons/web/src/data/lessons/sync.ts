import timeline from "../timelines/sync.json";
import type { Lesson, Scene } from "../types";

// Measured on JDK 21 (8 CPUs); race results change every run, so counts are "this session".
export const sync: Lesson = {
  slug: "sync",
  crumb: "synchronized, volatile, Atomic",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/sync-volatile-atomic",
  videoVersion: "6235f80f",
  scenes: timeline as Scene[],
  title: "synchronized, volatile, Atomic & ConcurrentHashMap",
  subtitle:
    "Vì sao count++ sai, synchronized đảm bảo gì, volatile chỉ cho visibility, happens-before, CAS và LongAdder, ReentrantLock và ReadWriteLock, ConcurrentHashMap bên trong và các bẫy của nó.",
  openingQuiz: {
    question: "100 thread, mỗi thread count++ 1000 lần trên biến volatile int. Kết quả?",
    options: ["Luôn đúng 100.000 vì volatile", "Thường sai: volatile không làm count++ thành nguyên tử", "Ném exception", "Luôn đúng nếu máy nhiều CPU"],
    answer: 1,
    explain: "Đã chạy 20 lần: volatile sai cả 20/20. count++ gồm đọc, cộng, ghi; volatile chỉ đảm bảo visibility.",
  },
  roadmap: [
    "Chặng 1: race condition, synchronized, volatile, happens-before.",
    "Chặng 2: CAS, AtomicInteger, LongAdder, ReentrantLock, ReadWriteLock.",
    "Chặng 3: ConcurrentHashMap bên trong và các bẫy check-then-act.",
  ],
  sections: [
    {
      id: "race",
      title: "Phần 1: Race condition",
      scene: "race",
      intro: [
        "`count++` gồm 3 bước: đọc, cộng 1, ghi. Hai thread cùng đọc 5, cùng ghi 6: tăng 2 lần mà chỉ lên 6. Đã đo: 100 thread × 1000 lần, biến thường sai 10/20 lần chạy; 8 thread × 5 triệu lần chỉ còn 13.505.781 / 40.000.000.",
        "Vì lúc đúng lúc sai, \"chạy thử thấy đúng\" không chứng minh code thread-safe. Race hay gặp trong service là {{check-then-act|check-then-act}}: kiểm tra điều kiện rồi hành động dựa trên nó, mà giữa hai bước thread khác có thể chen vào. Ví dụ \"còn hàng thì trừ\", \"email chưa tồn tại thì insert\".",
      ],
      predict: {
        question: "8 thread, mỗi thread tăng counter 5 triệu lần. Trong các cách **cho kết quả đúng**, cách nào nhanh nhất?",
        options: ["`synchronized`", "`AtomicInteger`", "`LongAdder`", "Cả ba ngang nhau"],
        answer: 2,
        explain: "Lần đo này: `synchronized` 1453 ms, `AtomicInteger` 1098 ms, `LongAdder` 114 ms. `LongAdder` chia nhiều ô nên các thread không tranh một ô nhớ (Phần 5 giải thích).",
      },
      widget: "race-counter",
      widgetTitle: "Chọn cách tăng counter",
      takeaway: {
        lines: [
          "Race lúc đúng lúc sai, nên \"chạy thử thấy đúng\" không chứng minh code thread-safe.",
        ],
      },
      quiz: {
        question: "Vì sao test 100 thread × 1000 lần đôi khi vẫn ra đúng 100.000 với biến thường?",
        options: ["Vì Java tự đồng bộ int", "Vì mỗi thread xong rất nhanh trước khi thread khác kịp chen vào, nên race chỉ thỉnh thoảng lộ", "Vì JIT sửa race", "Vì có GC"],
        answer: 1,
        explain: "Đã đo: chỉ sai 10/20 lần. Tăng tải lên 8 × 5 triệu thì mất hơn một nửa.",
      },
    },
    {
      id: "synchronized",
      title: "Phần 2: synchronized",
      scene: "sync",
      intro: [
        "Hình dung phòng thử đồ có **một chiếc chìa khoá**: ai cầm chìa mới được vào, người khác đứng chờ ngoài cửa. Trong Java, mỗi object có sẵn một chiếc chìa như vậy, gọi là **monitor lock**, và `synchronized` là \"phải cầm chìa của object này mới được chạy đoạn code\".",
        "Nó đảm bảo hai điều. **Mutual exclusion** (loại trừ lẫn nhau): một thread một lúc, nên `count++` không bị chen ngang; đã đo 8 × 5 triệu luôn đúng 40.000.000. **Visibility** (nhìn thấy): thread vào sau thấy mọi thay đổi của thread ra trước, vì nhả lock buộc ghi ra bộ nhớ chung.",
        "Nó **reentrant** (vào lại được): thread đang cầm chìa vào lại được một đoạn `synchronized` khác của cùng lock. Vì sao cần: method `synchronized` A gọi method `synchronized` B cùng object; nếu không reentrant, thread sẽ đứng chờ chính chiếc chìa nó đang cầm, tức tự deadlock.",
        "Lock **tự nhả kể cả khi có exception**, nên không có chuyện quên trả chìa.",
      ],
      quiz: {
        question: "Method synchronized `a()` gọi method synchronized `b()` của cùng object. Chuyện gì xảy ra?",
        options: ["Deadlock vì thread chờ chính lock của nó", "Chạy bình thường: synchronized là reentrant, thread đang giữ lock vào lại được", "Ném IllegalMonitorStateException", "b() chạy trên thread khác"],
        answer: 1,
        explain: "Reentrant nghĩa là lock đếm số lần thread đã vào; ra khỏi b() rồi a() thì lock mới thật sự được nhả.",
      },
      parts: [
        {
          id: "sync-target",
          title: "Khoá trên cái gì, và các bẫy",
          intro: [
            "Lock nằm ở đâu tuỳ cách viết:",
            "- **Method instance**: khoá `this`.",
            "- **Method static**: khoá `ClassName.class`.",
            "- **Block `synchronized (obj)`**: khoá đúng object `obj`.",
            "Hai thread chỉ loại trừ nhau khi **cùng một object lock**.",
            "Nên khoá trên một `private final Object lock = new Object()`. Lý do: `this` và `ClassName.class` thì code bên ngoài cũng nhìn thấy, và có thể tự `synchronized` trên chúng, vô tình chặn bạn hoặc gây deadlock. Object `private` thì chỉ class của bạn chạm được; `final` để không ai đổi sang object khác giữa chừng.",
            "Bẫy 1: khoá trên object khác nhau không bảo vệ gì. Ví dụ mỗi request `new` một object rồi `synchronized` trên nó: mỗi thread cầm một chìa riêng, không ai chờ ai.",
            "Bẫy 2 (sẽ gặp lại ở khoá Spring): `synchronized` trên method `@Transactional` không đủ. `@Transactional` mở một {{transaction|transaction}} quanh method, và {{commit|commit}} chạy **sau khi** method trả về, tức sau khi lock đã nhả. Thread thứ hai vào được và đọc dữ liệu cũ trước khi thread đầu commit.",
          ],
          takeaway: {
            lines: [
              "Hai thread chỉ chờ nhau khi cầm **cùng một** object lock. Mặc định khoá trên một `private final Object lock`.",
            ],
          },
          quiz: {
            question: "synchronized trên static method và instance method của cùng class có loại trừ nhau không?",
            options: ["Có", "Không: static khoá Class object, instance khoá this", "Chỉ khi cùng thread", "Tuỳ JVM"],
            answer: 1,
            explain: "Hai lock khác nhau nên chạy song song được.",
          },
        },
      ],
    },
    {
      id: "volatile",
      title: "Phần 3: volatile",
      scene: "volatile",
      intro: [
        "`synchronized` cho cả loại trừ lẫn visibility. Nếu chỉ cần visibility thì có cách nhẹ hơn.",
        "`volatile` đảm bảo **visibility** (ghi xong thread khác thấy ngay) và chống **reorder**, nhưng **không** đảm bảo nguyên tử. Reorder là việc compiler hoặc CPU được đổi thứ tự các lệnh, miễn là chính thread đó không thấy khác biệt; thread khác thì có thể thấy lệnh sau xảy ra trước lệnh trước. Đã đo cờ dừng: `boolean running` thường thì worker vẫn chạy sau 3 giây chờ (JIT có thể đưa việc đọc ra khỏi vòng lặp); `volatile boolean` thì dừng ngay.",
        "Hợp cho cờ trạng thái, một thread ghi nhiều thread đọc, và **double-checked locking** (singleton lười: kiểm tra `instance == null` không khoá, chỉ khi null mới vào `synchronized` và kiểm tra lại; field `instance` phải `volatile` để thread khác không thấy object tạo dở). Không hợp cho đọc-sửa-ghi như `count++`.",
      ],
      takeaway: {
        lines: [
          "`volatile` = visibility + chống reorder, **không** nguyên tử. Dùng cho cờ trạng thái, không dùng cho `count++`.",
        ],
      },
      quiz: {
        question: "Thêm System.out.println vào vòng lặp làm cờ không volatile \"tự dưng\" dừng được. Có nên dựa vào đó?",
        options: ["Có", "Không: println có lock bên trong, vô tình buộc thread đọc lại cờ từ bộ nhớ; đó là may mắn, phải dùng volatile", "Có nếu chạy trên Linux", "Không quan trọng"],
        answer: 1,
        explain: "Lock bên trong println tình cờ cho visibility (Phần 4 gọi đó là happens-before). Bỏ println hoặc đổi JVM là lỗi quay lại; chỉ volatile là bảo đảm của ngôn ngữ.",
      },
    },
    {
      id: "happens-before",
      title: "Phần 4: Happens-before",
      scene: "hb",
      intro: [
        "Ví dụ: thread A ghi `data = 42` rồi ghi `volatile ready = true`. Thread B thấy `ready == true` thì **chắc chắn** thấy `data == 42`, dù `data` không volatile. Vì sao chắc chắn: đó là một quy tắc happens-before.",
        "**Java Memory Model** (JMM) là phần đặc tả Java nói thread này được thấy gì từ những gì thread khác ghi. Nó chỉ hứa một điều: nếu A **happens-before** B thì B thấy mọi thứ A đã ghi trước đó. Ngoài các quy tắc này, không có gì được hứa.",
        "Các quy tắc hay dùng:",
        "- **Lock**: nhả lock happens-before lần lấy tiếp theo của cùng lock.",
        "- **`volatile`**: ghi một biến `volatile` happens-before mọi lần đọc biến đó sau này (ví dụ `ready` ở trên).",
        "- **`start()`**: `t.start()` happens-before mọi lệnh trong thread `t`.",
        "- **`join()`**: mọi lệnh trong thread `t` happens-before lúc `t.join()` trả về.",
        "- **Future và collection concurrent**: Future hoàn thành happens-before lúc `get()` hoặc `join()` trả về. Collection trong `java.util.concurrent` cũng cam kết: đưa vào happens-before lấy ra.",
      ],
      quiz: {
        question: "Vì sao chuyển object giữa thread qua BlockingQueue không cần volatile?",
        options: ["Vì object bất biến", "Vì đưa vào queue happens-before lấy ra ở thread khác", "Vì queue copy object", "Vẫn cần volatile"],
        answer: 1,
        explain: "Các collection concurrent cam kết quan hệ happens-before.",
      },
    },
    {
      id: "atomic",
      title: "Phần 5: Atomic, CAS và LongAdder",
      scene: "atomic",
      intro: [
        "`AtomicInteger` không dùng lock. Nền của nó là **CAS** (compare-and-set): `compareAndSet(old, new)` nghĩa là \"nếu giá trị vẫn là `old` thì ghi `new`\", làm trong một lệnh CPU nguyên tử. Các method như `updateAndGet(fn)` dùng vòng lặp CAS: thất bại thì đọc lại và thử lại.",
        "Riêng `incrementAndGet()` thì trên HotSpot được dịch thành **một lệnh cộng nguyên tử** của CPU (theo mã nguồn HotSpot: `lock xadd` trên x86, `ldadd` trên ARM có tập lệnh LSE; ARM đời cũ không có LSE thì vẫn là vòng thử lại), không có vòng thử lại ở tầng Java. Chi phí khi nhiều thread cùng cộng nằm ở chỗ khác: mọi thread ghi vào **cùng một ô nhớ** (cùng một cache line), nên CPU phải chuyền cache line đó qua lại giữa các core. Đó là tranh chấp (contention).",
        "Vì thế `LongAdder` nhanh hơn: nó chia thành nhiều cell, mỗi thread cộng vào cell riêng nên không tranh một ô, `sum()` mới cộng dồn các cell. Đổi lại `sum()` không phải ảnh chụp nguyên tử: nếu thread khác đang cộng, kết quả có thể thiếu vài lần cộng vừa xảy ra.",
        "Lần đo này (8 thread × 5 triệu): synchronized 1453 ms, AtomicInteger 1098 ms, LongAdder 114 ms. Thứ hạng giữa synchronized và AtomicInteger **phụ thuộc mức tranh chấp**: với 8 thread nó đổi theo lần đo, còn ở Lab 3 với 100 thread thì AtomicInteger chậm hơn synchronized cả 3 lần. LongAdder luôn nhanh hơn rõ. Dùng LongAdder cho counter, metric; AtomicInteger khi cần giá trị chính xác ngay (sinh id).",
        "Một điểm yếu của CAS là **ABA problem**: thread 1 đọc được A, trong lúc đó thread 2 đổi A thành B rồi lại thành A. CAS của thread 1 thấy vẫn là A nên tưởng không ai đổi và ghi đè.",
      ],
      takeaway: {
        lines: [
          "Counter, metric nhiều thread cùng cộng: `LongAdder`. Cần giá trị chính xác ngay (sinh id): `AtomicInteger`.",
        ],
      },
      quiz: {
        question: "ABA problem là gì?",
        options: ["Lỗi chia cho 0", "Giá trị đổi A → B → A nên CAS tưởng không ai đổi", "Deadlock 2 thread", "Lỗi của LongAdder"],
        answer: 1,
        explain: "Vô hại với counter, có thể sai với cấu trúc liên kết. Giải pháp: AtomicStampedReference gắn số phiên bản.",
      },
    },
    {
      id: "locks",
      title: "Phần 6: ReentrantLock và ReadWriteLock",
      scene: "locks",
      intro: [
        "`ReentrantLock` là lock viết bằng code (`lock()`, `unlock()`), cũng reentrant như `synchronized`. Nó thêm:",
        "- **`tryLock(timeout)`**: thử lấy, quá hạn thì bỏ. Đã đo: thread khác giữ lock 2 giây, `tryLock(500 ms)` trả false sau 507 ms thay vì treo.",
        "- **`lockInterruptibly()`**: đang chờ vẫn bị interrupt được.",
        "- **Fair lock**: thread chờ lâu nhất được vào trước, đổi lại chậm hơn.",
        "- **Nhiều `Condition`**: mỗi `Condition` là một hàng chờ riêng, giống `wait/notify` nhưng tách được \"chờ có hàng\" và \"chờ có chỗ\".",
        "Đổi lại phải `unlock()` trong `finally` (gọi `lock()` ngay trước `try`).",
        "`ReadWriteLock` cho nhiều reader đồng thời, một writer độc quyền: 4 reader giữ lock 300 ms mất 325 ms, lock thường mất 1235 ms. Không nâng cấp được read lock lên write lock: write lock phải chờ **mọi** reader nhả, kể cả chính bạn, nên thread tự chờ mình mãi. Đã chạy: đang giữ read lock, `writeLock().tryLock(500 ms)` trả `false` sau 510 ms; gọi `lock()` thay vì `tryLock` là treo vĩnh viễn.",
      ],
      widget: "lock-pick",
      widgetTitle: "Chọn công cụ cho từng việc",
      quiz: {
        question: "Gọi lock.lock() bên trong try thì rủi ro gì?",
        options: ["Không rủi ro", "Nếu lock() lỗi, finally sẽ unlock một lock chưa giữ và ném IllegalMonitorStateException", "Deadlock chắc chắn", "Lock không bao giờ nhả"],
        answer: 1,
        explain: "Đặt lock() ngay trước try, unlock() trong finally.",
      },
    },
    {
      id: "chm-internals",
      title: "Phần 7: ConcurrentHashMap bên trong",
      scene: "chm",
      intro: [
        "Hashtable và `synchronizedMap` khoá cả map. ConcurrentHashMap Java 7 chia map thành 16 Segment, mỗi Segment một lock. Cách đó có hai nhược điểm: mức song song bị cố định ở 16 lúc tạo map, và mỗi Segment là một object lock riêng tốn bộ nhớ. Từ Java 8 bỏ Segment, khoá theo từng bucket:",
        "- **Bucket rỗng**: đặt node bằng CAS, không lock.",
        "- **Bucket đã có node**: `synchronized` trên node đầu của bucket đó. Hai thread ghi hai bucket khác nhau không chặn nhau.",
        "- **Đọc**: không lock.",
        "- **Size**: đếm kiểu LongAdder.",
        "`size()` khi đang có thread ghi chỉ là ước lượng: đừng dùng để ra quyết định nghiệp vụ.",
      ],
      quiz: {
        question: "Vì sao Java 8 bỏ Segment?",
        options: ["Vì Segment không thread-safe", "Segment cố định mức song song và tốn bộ nhớ; khoá theo bucket cho mức song song bằng số bucket", "Vì Java 8 bỏ synchronized", "Vì CAS không chạy được với Segment"],
        answer: 1,
        explain: "synchronized trên node đầu hiện rất rẻ khi ít tranh chấp.",
      },
    },
    {
      id: "chm-traps",
      title: "Phần 8: Bẫy của ConcurrentHashMap",
      scene: "traps",
      intro: [
        "CHM an toàn cho từng method, không an toàn cho chuỗi method. Đã đo 8 thread tăng counter: `get` rồi `put` sai 20/20 lần (ví dụ 24610 thay vì 80.000), `merge` đúng 20/20. Nạp cache: `containsKey` rồi `put` chạy hàm nạp 8 lần, `computeIfAbsent` chỉ 1 lần.",
        "Vì sao `computeIfAbsent` chỉ chạy hàm nạp 1 lần: hàm nạp chạy **trong lúc giữ lock của bucket**. Hệ quả: hàm nạp phải nhanh, và không được sửa chính map đó bên trong hàm.",
        "CHM cấm null key và value (`put` null ném `NullPointerException`). Lý do: nếu cho value null, `get(k)` trả `null` sẽ mơ hồ giữa \"không có key\" và \"có key, value là null\". Với `HashMap` một thread, bạn gọi thêm `containsKey` để phân biệt; với nhiều thread, giữa hai lời gọi map có thể đã đổi.",
        "Sửa map lúc duyệt không ném `ConcurrentModificationException`: iterator là **weakly consistent**, có thể thấy hoặc không thấy thay đổi xảy ra trong lúc duyệt. `CopyOnWriteArrayList` thì mỗi lần ghi chép ra mảng mới, và duyệt trên bản chụp (snapshot): duyệt `[1, 2, 3]` và add trong lúc duyệt chạy đúng 3 vòng, list cuối `[1, 2, 3, 10, 20, 30]`.",
      ],
      after: [
        "Dùng CHM làm cache có hai giới hạn: map **không tự giới hạn kích thước** hay hết hạn (cứ lớn dần), và nó chỉ nằm trong **một JVM**, nên service chạy nhiều instance thì mỗi instance có cache riêng, lệch nhau. Cache cục bộ có giới hạn và hết hạn thì dùng thư viện **Caffeine**; cần dùng chung giữa các instance thì dùng **Redis** (học ở bài cache).",
      ],
      widget: "chm-trap",
      widgetTitle: "Thử từng bẫy",
      takeaway: {
        lines: [
          "CHM an toàn cho từng method, không an toàn cho chuỗi method. Thay `get` rồi `put` bằng `merge`, `compute`, `computeIfAbsent`.",
        ],
      },
      quiz: {
        question: "Dùng ConcurrentHashMap làm cache trong service chạy 3 instance có ổn không?",
        options: ["Ổn hoàn toàn", "Mỗi instance có cache riêng, dữ liệu lệch nhau, và map không tự giới hạn: dùng Caffeine hoặc Redis", "Không chạy được", "Chỉ ổn với virtual thread"],
        answer: 1,
        explain: "Cache cục bộ dùng Caffeine (giới hạn, hết hạn); cần dùng chung thì Redis.",
      },
    },
  ],
  modelAnswer:
    "count++ gồm đọc, cộng, ghi nên nhiều thread có thể cùng đọc một giá trị và mất lần tăng; em đã thử 8 thread mỗi thread 5 triệu lần thì mất hơn một nửa. synchronized dùng monitor lock, đảm bảo một thread một lúc và visibility, reentrant và tự nhả khi có exception. volatile chỉ đảm bảo visibility và chống reorder, không làm count++ nguyên tử, nên em dùng cho cờ trạng thái. AtomicInteger dùng lệnh nguyên tử của CPU, không lock; với counter tranh chấp cao em dùng LongAdder, em đo nó nhanh hơn hẳn. ReentrantLock thêm tryLock có timeout, ReadWriteLock cho nhiều reader. ConcurrentHashMap Java 8 khoá theo bucket, CAS khi bucket rỗng, đọc không lock, cấm null; nhưng get rồi put vẫn là race nên em dùng merge, compute hay computeIfAbsent.",
};
