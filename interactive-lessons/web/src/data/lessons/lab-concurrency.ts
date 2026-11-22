import timeline from "../timelines/lab-concurrency.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.03; outputs are real runs of labs/java-labs/lab3-concurrency on JDK 21 (timings vary by machine).
export const labConcurrency: Lesson = {
  slug: "lab-concurrency",
  crumb: "Lab 3: Concurrency",
  videoDir: "/videos/lab-concurrency",
  videoVersion: "e1e397e9",
  scenes: timeline as Scene[],
  title: "Lab 3: Concurrency",
  subtitle:
    "Race condition với 100 thread và ba cách sửa có đo thời gian, deadlock chắc chắn rồi đọc jstack và sửa bằng lock ordering, CompletableFuture song song với timeout và fallback.",
  openingQuiz: {
    question: "100 thread cùng count++ 10.000 lần. Kết quả?",
    options: ["Luôn 1.000.000", "Thường nhỏ hơn và mỗi lần một số khác", "Luôn 0", "Lỗi compile"],
    answer: 1,
    explain: "Đã đo 457,695, 967,501, 216,561: sai 5/5 vòng ở cả 3 lần chạy.",
  },
  roadmap: [
    "Chặng 1: race condition và ba cách sửa.",
    "Chặng 2: deadlock, jstack, lock ordering.",
    "Chặng 3: CompletableFuture song song, timeout, fallback.",
  ],
  sections: [
    {
      id: "race",
      title: "Phần 1: 100 thread cùng count++",
      scene: "race",
      intro: [
        "Ba file độc lập trong `labs/java-labs/lab3-concurrency/`, mỗi file có `check(...)` in PASS/FAIL. Bài 1: 100 thread × 10.000 lần `count++`, sửa bằng `synchronized`, `AtomicInteger`, `LongAdder`, mỗi cách 5 vòng, in vòng cuối, số vòng sai và median. Riêng check của dòng `count++` kiểm tra xem kết quả **có sai không**, nên nó in PASS nghĩa là bạn đã tái hiện được lỗi.",
        "`count++` là đọc, cộng, ghi: không nguyên tử, `volatile` cũng không sửa được. Đã đo: `LongAdder` nhanh nhất hoặc gần nhất; `AtomicInteger` **chậm hơn** `synchronized` ở cả 3 lần.",
        "Vì sao `AtomicInteger` chậm: `incrementAndGet()` trên HotSpot là một lệnh cộng nguyên tử của CPU (`lock xadd` trên x86, `ldadd` trên ARM), không có vòng thử lại. Cái giá nằm ở chỗ 100 thread cùng tranh **một ô nhớ**: cache line chứa biến đó phải chuyền qua lại giữa các core sau mỗi lần cộng. \"Lock-free luôn nhanh hơn lock\" là sai khi tranh chấp cao.",
        "Bài sync đo với 8 thread thì `AtomicInteger` lại nhanh hơn `synchronized` ở lần đo đó. Hai kết quả không mâu thuẫn: thứ hạng phụ thuộc **mức tranh chấp**, và 100 thread cùng cộng một biến là tranh chấp cao hơn nhiều so với 8.",
      ],
      widget: "race-runs",
      widgetTitle: "Đoán rồi xem 3 lần chạy",
      quiz: {
        question: "Vì sao LongAdder nhanh khi nhiều thread cùng cộng?",
        options: ["Vì dùng lock", "Mỗi thread cộng vào cell riêng, ít tranh chấp; sum() gộp lại", "Vì không thread-safe", "Vì dùng volatile"],
        answer: 1,
        explain: "Đổi lại sum() không phải snapshot nguyên tử.",
      },
    },
    {
      id: "deadlock",
      title: "Phần 2: Deadlock, jstack và lock ordering",
      scene: "deadlock",
      intro: [
        "`worker-1` lấy A rồi B, `worker-2` lấy B rồi A, deadlock chắc chắn nhờ `CountDownLatch(2)` (bộ đếm lùi: `await()` chờ tới khi đủ 2 lần `countDown()`): mỗi thread giữ lock đầu rồi chờ thread kia cũng giữ xong mới lấy lock thứ hai. Sau 1 giây: `worker-1=BLOCKED, worker-2=BLOCKED`. `ThreadMXBean.findDeadlockedThreads()` in thread nào chờ lock của thread nào.",
        "Từ bên ngoài: chạy `java DeadlockLab.java --hold` (cờ `--hold` giữ chương trình không tự thoát trong 60 giây, đủ thời gian chạy jstack), `jstack <pid>`, tìm `Found one Java-level deadlock:`. Sửa bằng lock ordering: mọi thread lấy A trước B sau.",
      ],
      widget: "jstack-read",
      widgetTitle: "Đọc jstack từng dòng",
      quiz: {
        question: "Production bị treo, nghi deadlock. Bước đầu tiên?",
        options: ["Restart ngay", "Lấy thread dump (jstack) trước khi restart, tìm Found one Java-level deadlock", "Tăng heap", "Thêm log"],
        answer: 1,
        explain: "Restart trước là mất bằng chứng.",
      },
    },
    {
      id: "cf",
      title: "Phần 3: CompletableFuture song song, timeout, fallback",
      scene: "cf",
      intro: [
        "`getUser` 300 ms, `getOrders` 500 ms. Đã đo: tuần tự **825 ms** trên `main`; song song với `supplyAsync(..., ioPool)` và `thenCombine` **512 ms** trên `io-pool-1`, `io-pool-2`, bằng service chậm nhất. Service chậm 2 giây, chờ tối đa 1 giây (`completeOnTimeout`) ra **1005 ms** với 0 order fallback.",
        "Service ném exception thì `exceptionally` trả mặc định (log `fallback because order-service down`). `orTimeout(200 ms)` không có fallback: `join()` ném `CompletionException` bọc `TimeoutException`. Timeout không huỷ task đang chạy; dùng executor riêng và nhớ `shutdown`.",
      ],
      widget: "cf-dashboard",
      widgetTitle: "Tuần tự và song song",
      quiz: {
        question: "orTimeout khác completeOnTimeout thế nào?",
        options: ["Giống nhau", "orTimeout hoàn thành bằng TimeoutException; completeOnTimeout hoàn thành bằng giá trị mặc định", "completeOnTimeout huỷ task", "orTimeout chỉ cho Java 8"],
        answer: 1,
        explain: "Cả hai đều không dừng task đang chạy.",
      },
    },
    {
      id: "checklist",
      title: "Phần 4: Checklist hoàn thành",
      scene: "checklist",
      intro: ["Ghi vào nhật ký: con số thật bạn đo được, chỗ đoán sai (ví dụ tưởng AtomicInteger luôn nhanh hơn), và nơi dự án thật đang gọi nhiều API tuần tự."],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 3",
    },
  ],
  modelAnswer:
    "Em tự đo race condition với 100 thread mỗi thread tăng 10.000 lần: count++ sai cả 5 vòng, mỗi lần một số khác. Sửa bằng synchronized, AtomicInteger và LongAdder đều ra 1 triệu; trên máy em LongAdder nhanh nhất, còn AtomicInteger chậm hơn synchronized vì 100 thread tranh nhau cùng một ô nhớ. Em tạo deadlock chắc chắn bằng hai lock lấy ngược thứ tự, đọc được đoạn Found one Java-level deadlock trong jstack, phát hiện bằng ThreadMXBean và sửa bằng lock ordering. Với CompletableFuture, gọi song song hai service 300 và 500 ms giảm từ khoảng 825 xuống 512 ms; em dùng executor riêng, completeOnTimeout để trả fallback và exceptionally khi service lỗi.",
};
