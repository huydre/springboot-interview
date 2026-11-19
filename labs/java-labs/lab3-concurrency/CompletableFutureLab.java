import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Lab 3 - Bài 3: gọi song song 2 "service" giả bằng CompletableFuture
 * + executor riêng + timeout + fallback. So sánh thời gian tuần tự và song song.
 * Chạy: java CompletableFutureLab.java
 */
public class CompletableFutureLab {

    record User(int id, String name) { }

    record Order(String code, int amount) { }

    record Dashboard(User user, List<Order> orders) { }

    // ===== 2 service giả: Thread.sleep thay cho gọi HTTP/DB =====

    static User getUser(int id) {
        sleep(300);
        log("getUser done");
        return new User(id, "Nam");
    }

    static List<Order> getOrders(int userId, long delayMs) {
        sleep(delayMs);
        log("getOrders done");
        return List.of(new Order("ORD-1", 250), new Order("ORD-2", 120));
    }

    /** Service lỗi: luôn ném exception (giả lập order-service sập). */
    static List<Order> getOrdersBroken() {
        throw new IllegalStateException("order-service down");
    }

    static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }

    static final long T0 = System.nanoTime();

    static void log(String msg) {
        long ms = (System.nanoTime() - T0) / 1_000_000;
        System.out.printf("  [%4d ms] %-16s %s%n", ms, Thread.currentThread().getName(), msg);
    }

    static int passed = 0;
    static int failed = 0;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "PASS " : "FAIL ") + name);
    }

    /** Executor riêng cho I/O, đặt tên thread để nhìn log là biết task chạy ở pool nào. */
    static ExecutorService newIoExecutor() {
        AtomicInteger seq = new AtomicInteger();
        ThreadFactory factory = r -> new Thread(r, "io-pool-" + seq.incrementAndGet());
        return Executors.newFixedThreadPool(4, factory);
    }

    public static void main(String[] args) {
        ExecutorService ioPool = newIoExecutor();
        try {
            // 1. Tuần tự: 300 + 500 = khoảng 800 ms
            long start = System.nanoTime();
            User u = getUser(1);
            List<Order> o = getOrders(1, 500);
            Dashboard seq = new Dashboard(u, o);
            long seqMs = (System.nanoTime() - start) / 1_000_000;
            System.out.println("Sequential: " + seqMs + " ms -> " + seq.orders().size()
                    + " orders");

            // 2. Song song: max(300, 500) = khoảng 500 ms
            start = System.nanoTime();
            CompletableFuture<User> userF =
                    CompletableFuture.supplyAsync(() -> getUser(1), ioPool);
            CompletableFuture<List<Order>> ordersF =
                    CompletableFuture.supplyAsync(() -> getOrders(1, 500), ioPool);
            Dashboard par = userF.thenCombine(ordersF, Dashboard::new).join();
            long parMs = (System.nanoTime() - start) / 1_000_000;
            System.out.println("Parallel:   " + parMs + " ms -> " + par.orders().size()
                    + " orders");
            check("parallel faster than sequential", parMs < seqMs);
            check("parallel close to slowest call (< 650 ms)", parMs < 650);

            // 3. Timeout + fallback: service đơn hàng chậm 2 giây, chỉ chờ 1 giây
            start = System.nanoTime();
            CompletableFuture<List<Order>> slowOrdersF = CompletableFuture
                    .supplyAsync(() -> getOrders(1, 2000), ioPool)
                    .completeOnTimeout(List.of(), 1, TimeUnit.SECONDS); // fallback: rỗng
            Dashboard degraded = CompletableFuture.supplyAsync(() -> getUser(1), ioPool)
                    .thenCombine(slowOrdersF, Dashboard::new)
                    .join();
            long toMs = (System.nanoTime() - start) / 1_000_000;
            System.out.println("Timeout:    " + toMs + " ms -> " + degraded.orders().size()
                    + " orders (fallback)");
            check("timeout returns fallback after about 1s",
                    degraded.orders().isEmpty() && toMs < 1300);

            // 4. Lỗi + fallback: service ném exception -> exceptionally trả giá trị mặc định
            List<Order> recovered = CompletableFuture
                    .supplyAsync(CompletableFutureLab::getOrdersBroken, ioPool)
                    .exceptionally(ex -> {
                        log("fallback because " + ex.getCause().getMessage());
                        return List.of();
                    })
                    .join();
            check("exception handled by exceptionally", recovered.isEmpty());

            // 5. orTimeout không fallback: join() ném CompletionException(TimeoutException)
            try {
                CompletableFuture.supplyAsync(() -> getOrders(1, 2000), ioPool)
                        .orTimeout(200, TimeUnit.MILLISECONDS)
                        .join();
                check("orTimeout throws", false);
            } catch (Exception ex) {
                System.out.println("orTimeout:  " + ex.getClass().getSimpleName()
                        + " caused by " + ex.getCause().getClass().getSimpleName());
                check("orTimeout throws", true);
            }
        } finally {
            // Executor tự tạo thì phải tự shutdown, nếu không JVM không thoát
            ioPool.shutdownNow();
        }
        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
