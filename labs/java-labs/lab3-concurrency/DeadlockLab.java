import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Lab 3 - Bài 2: tạo deadlock với 2 lock, phát hiện bằng ThreadMXBean (và jstack), sửa bằng
 * lấy lock theo thứ tự cố định.
 * Chạy: java DeadlockLab.java          (tự phát hiện rồi thoát)
 *       java DeadlockLab.java --hold   (giữ deadlock 60 giây để bạn chạy jstack <pid>)
 */
public class DeadlockLab {

    static final Object LOCK_A = new Object();
    static final Object LOCK_B = new Object();

    static int passed = 0;
    static int failed = 0;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "PASS " : "FAIL ") + name);
    }

    /** Lấy first rồi second; latch đảm bảo cả 2 thread đều đã giữ lock đầu tiên. */
    static Thread worker(String name, Object first, Object second, CountDownLatch bothHold) {
        Thread t = new Thread(() -> {
            synchronized (first) {
                bothHold.countDown();
                try {
                    bothHold.await(); // chờ thread kia giữ lock của nó: chắc chắn deadlock
                } catch (InterruptedException e) {
                    return;
                }
                synchronized (second) {
                    System.out.println(Thread.currentThread().getName() + " got both locks");
                }
            }
        }, name);
        t.setDaemon(true); // để JVM thoát được dù 2 thread còn kẹt
        return t;
    }

    public static void main(String[] args) throws Exception {
        boolean hold = args.length > 0 && args[0].equals("--hold");
        System.out.println("PID = " + ProcessHandle.current().pid());

        // 1. DEADLOCK: T1 lấy A rồi B, T2 lấy B rồi A
        CountDownLatch latch = new CountDownLatch(2);
        Thread t1 = worker("worker-1", LOCK_A, LOCK_B, latch);
        Thread t2 = worker("worker-2", LOCK_B, LOCK_A, latch);
        t1.start();
        t2.start();
        t1.join(1000);
        System.out.println("After 1s: worker-1=" + t1.getState()
                + ", worker-2=" + t2.getState());

        if (hold) {
            System.out.println("Run now: jstack " + ProcessHandle.current().pid());
            TimeUnit.SECONDS.sleep(60);
        }

        // 2. PHÁT HIỆN bằng ThreadMXBean (cùng cơ chế jstack dùng để in "Found deadlock")
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        long[] ids = mx.findDeadlockedThreads();
        check("deadlock detected by ThreadMXBean", ids != null && ids.length == 2);
        if (ids != null) {
            for (ThreadInfo info : mx.getThreadInfo(ids)) {
                System.out.println("  " + info.getThreadName() + " BLOCKED on "
                        + info.getLockName() + " held by " + info.getLockOwnerName());
            }
        }

        // 3. SỬA: mọi thread lấy lock theo cùng một thứ tự (A trước, B sau)
        Object fixA = new Object();
        Object fixB = new Object();
        CountDownLatch done = new CountDownLatch(2);
        Runnable ordered = () -> {
            for (int i = 0; i < 100_000; i++) {
                synchronized (fixA) {
                    synchronized (fixB) {
                        // công việc cần cả 2 lock
                    }
                }
            }
            done.countDown();
        };
        new Thread(ordered, "fixed-1").start();
        new Thread(ordered, "fixed-2").start();
        check("lock ordering: both threads finished",
                done.await(5, TimeUnit.SECONDS));

        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
