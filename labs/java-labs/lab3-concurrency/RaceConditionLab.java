import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.function.LongSupplier;

/**
 * Lab 3 - Bài 1: 100 thread cùng tăng một biến đếm.
 * count++ thường thì sai; sửa bằng synchronized, AtomicInteger, LongAdder và đo thời gian.
 * Mỗi cách chạy 5 vòng, in kết quả vòng cuối và thời gian trung vị (median) của 5 vòng.
 * Chạy: java RaceConditionLab.java
 */
public class RaceConditionLab {

    static final int THREADS = 100;
    static final int INCREMENTS = 10_000;
    static final int EXPECTED = THREADS * INCREMENTS; // 1.000.000
    static final int ROUNDS = 5;

    static int unsafeCount;
    static int syncCount;
    static final Object LOCK = new Object();
    static AtomicInteger atomicCount;
    static LongAdder adderCount;

    /** Tạo 100 thread, mỗi thread gọi increment 10.000 lần, chờ tất cả xong, trả về ms. */
    static long runThreads(Runnable increment) throws InterruptedException {
        List<Thread> threads = new ArrayList<>();
        long start = System.nanoTime();
        for (int t = 0; t < THREADS; t++) {
            Thread th = new Thread(() -> {
                for (int i = 0; i < INCREMENTS; i++) increment.run();
            });
            threads.add(th);
            th.start();
        }
        for (Thread th : threads) th.join();
        return (System.nanoTime() - start) / 1_000_000;
    }

    static int passed = 0;
    static int failed = 0;

    /** Chạy ROUNDS vòng; reset trước mỗi vòng, đọc kết quả bằng result. */
    static void measure(String name, Runnable reset, Runnable increment,
                        LongSupplier result, boolean expectCorrect)
            throws InterruptedException {
        long[] times = new long[ROUNDS];
        long value = 0;
        int wrongRounds = 0;
        for (int r = 0; r < ROUNDS; r++) {
            reset.run();
            times[r] = runThreads(increment);
            value = result.getAsLong();
            if (value != EXPECTED) wrongRounds++;
        }
        Arrays.sort(times);
        // expectCorrect=false: mong đợi có ít nhất 1 vòng sai (tái hiện được lỗi)
        boolean ok = expectCorrect ? wrongRounds == 0 : wrongRounds > 0;
        if (ok) passed++; else failed++;
        System.out.printf("%s %-14s last=%,d  wrong=%d/%d  median=%d ms%n",
                ok ? "PASS" : "FAIL", name, value, wrongRounds, ROUNDS, times[ROUNDS / 2]);
    }

    public static void main(String[] args) throws InterruptedException {
        // 1. SAI: count++ = đọc, cộng, ghi (3 bước), 2 thread có thể ghi đè lên nhau
        measure("count++", () -> unsafeCount = 0, () -> unsafeCount++,
                () -> unsafeCount, false);

        // 2. synchronized: mỗi lúc chỉ 1 thread giữ monitor của LOCK
        measure("synchronized", () -> syncCount = 0, () -> {
            synchronized (LOCK) {
                syncCount++;
            }
        }, () -> syncCount, true);

        // 3. AtomicInteger: CAS (compare-and-swap), không khoá, tranh chấp cao thì retry nhiều
        measure("AtomicInteger", () -> atomicCount = new AtomicInteger(),
                () -> atomicCount.incrementAndGet(), () -> atomicCount.get(), true);

        // 4. LongAdder: nhiều ô đếm (cell), sum() mới cộng lại -> ít tranh chấp
        measure("LongAdder", () -> adderCount = new LongAdder(),
                () -> adderCount.increment(), () -> adderCount.sum(), true);

        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
