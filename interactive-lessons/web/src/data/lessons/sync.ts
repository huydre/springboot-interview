import timeline from "../timelines/sync.json";
import type { Lesson, Scene } from "../types";

// Measured on JDK 21 (8 CPUs); race results change every run, so counts are "this session".
export const sync: Lesson = {
  slug: "sync",
  crumb: "synchronized, volatile, Atomic",
  // Per-scene clips cut by `video-kit/pipeline.py <project> publish`, which also rewrites videoVersion.
  videoDir: "/videos/sync-volatile-atomic",
  videoVersion: "f22ff298",
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
        "Vì lúc đúng lúc sai, \"chạy thử thấy đúng\" không chứng minh code thread-safe. Race hay gặp trong service: check-then-act như \"còn hàng thì trừ\", \"email chưa tồn tại thì insert\".",
      ],
      widget: "race-counter",
      widgetTitle: "Chọn cách tăng counter",
      quiz: {
        question: "Vì sao test 100 thread × 1000 lần thường vẫn ra đúng 100.000 với biến thường?",
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
        "Mỗi object có một monitor lock. `synchronized` đảm bảo **mutual exclusion** (một thread một lúc) và **visibility** (vào sau thấy thay đổi của người ra trước): 8 × 5 triệu luôn đúng 40.000.000. Method instance khoá `this`, static khoá `ClassName.class`, block khoá object chỉ định (nên dùng `private final Object`).",
        "Reentrant: thread đang giữ lock vào lại được đoạn synchronized khác cùng lock. Lock tự nhả kể cả khi có exception. Bẫy: khoá trên object khác nhau không bảo vệ gì; `synchronized` trên method `@Transactional` không đủ vì commit xảy ra sau khi lock đã nhả.",
      ],
      quiz: {
        question: "synchronized trên static method và instance method của cùng class có loại trừ nhau không?",
        options: ["Có", "Không: static khoá Class object, instance khoá this", "Chỉ khi cùng thread", "Tuỳ JVM"],
        answer: 1,
        explain: "Hai lock khác nhau nên chạy song song được.",
      },
    },
    {
      id: "volatile",
      title: "Phần 3: volatile",
      scene: "volatile",
      intro: [
        "`volatile` đảm bảo **visibility** (ghi xong thread khác thấy ngay) và chống reorder, nhưng **không** đảm bảo nguyên tử. Đã đo cờ dừng: `boolean running` thường thì worker vẫn chạy sau 3 giây chờ (JIT có thể đưa việc đọc ra khỏi vòng lặp); `volatile boolean` thì dừng ngay.",
        "Hợp cho cờ trạng thái, một thread ghi nhiều thread đọc, double-checked locking. Không hợp cho đọc-sửa-ghi như `count++`.",
      ],
      quiz: {
        question: "Thêm System.out.println vào vòng lặp làm cờ không volatile \"tự dưng\" dừng được. Có nên dựa vào đó?",
        options: ["Có", "Không: println có lock bên trong tạo happens-before tình cờ; phải dùng volatile", "Có nếu chạy trên Linux", "Không quan trọng"],
        answer: 1,
        explain: "Đúng là may mắn chứ không phải bảo đảm của ngôn ngữ.",
      },
    },
    {
      id: "happens-before",
      title: "Phần 4: Happens-before",
      scene: "hb",
      intro: [
        "Java Memory Model chỉ hứa: nếu A happens-before B thì B thấy mọi thứ A đã ghi. Quy tắc chính: unlock → lock tiếp theo cùng monitor; ghi volatile → đọc sau đó; `start()` → lệnh trong thread mới; lệnh trong thread → `join()` trả về; Future hoàn thành → `get()`/`join()` trả về.",
        "Ví dụ: ghi `data = 42` rồi ghi `volatile ready = true`; thread khác thấy `ready == true` thì chắc chắn thấy `data == 42`. Collection trong `java.util.concurrent` cũng cam kết happens-before.",
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
        "`AtomicInteger` dùng CAS: giá trị vẫn là `old` thì ghi `new`, không thì đọc lại và thử lại, không lock. `LongAdder` chia nhiều cell, mỗi thread cộng ô riêng, `sum()` mới cộng dồn.",
        "Lần đo này (8 × 5 triệu): synchronized 1453 ms, AtomicInteger 1098 ms, LongAdder 114 ms. Thứ hạng giữa synchronized và AtomicInteger đổi theo lần đo, còn LongAdder luôn nhanh hơn rõ. Dùng LongAdder cho counter, metric; AtomicInteger khi cần giá trị chính xác ngay (sinh id).",
      ],
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
        "`ReentrantLock` thêm `tryLock(timeout)`, `lockInterruptibly()`, fair lock và nhiều `Condition`, đổi lại phải `unlock()` trong `finally` (gọi `lock()` ngay trước `try`). Đã đo: thread khác giữ lock 2 giây, `tryLock(500 ms)` trả false sau 507 ms thay vì treo.",
        "`ReadWriteLock` cho nhiều reader đồng thời, một writer độc quyền: 4 reader giữ lock 300 ms mất 325 ms, lock thường mất 1235 ms. Không nâng cấp được read lock lên write lock.",
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
        "Hashtable và `synchronizedMap` khoá cả map. ConcurrentHashMap Java 7 chia 16 Segment. Từ Java 8: bucket rỗng thì đặt node bằng CAS, không lock; bucket đã có node thì `synchronized` trên node đầu của bucket đó. Hai thread ghi hai bucket khác nhau không chặn nhau; đọc không lock; size đếm kiểu LongAdder.",
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
        "CHM cấm null key và value (`NullPointerException`). Sửa map lúc duyệt không ném `ConcurrentModificationException` (weakly consistent). `CopyOnWriteArrayList` duyệt trên snapshot: duyệt `[1, 2, 3]` và add trong lúc duyệt chạy đúng 3 vòng, list cuối `[1, 2, 3, 10, 20, 30]`.",
      ],
      widget: "chm-trap",
      widgetTitle: "Thử từng bẫy",
      quiz: {
        question: "Dùng ConcurrentHashMap làm cache trong service chạy 3 instance có ổn không?",
        options: ["Ổn hoàn toàn", "Mỗi instance có cache riêng, dữ liệu lệch nhau, và map không tự giới hạn: dùng Caffeine hoặc Redis", "Không chạy được", "Chỉ ổn với virtual thread"],
        answer: 1,
        explain: "Cache cục bộ dùng Caffeine (giới hạn, hết hạn); cần dùng chung thì Redis.",
      },
    },
  ],
  modelAnswer:
    "count++ gồm đọc, cộng, ghi nên nhiều thread có thể cùng đọc một giá trị và mất lần tăng; em đã thử 8 thread mỗi thread 5 triệu lần thì mất hơn một nửa. synchronized dùng monitor lock, đảm bảo một thread một lúc và visibility, reentrant và tự nhả khi có exception. volatile chỉ đảm bảo visibility và chống reorder, không làm count++ nguyên tử, nên em dùng cho cờ trạng thái. AtomicInteger dùng CAS không lock; với counter tranh chấp cao em dùng LongAdder, em đo nó nhanh hơn hẳn. ReentrantLock thêm tryLock có timeout, ReadWriteLock cho nhiều reader. ConcurrentHashMap Java 8 khoá theo bucket, CAS khi bucket rỗng, đọc không lock, cấm null; nhưng get rồi put vẫn là race nên em dùng merge, compute hay computeIfAbsent.",
};
