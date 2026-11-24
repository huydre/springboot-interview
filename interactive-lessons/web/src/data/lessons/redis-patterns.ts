import timeline from "../timelines/redis-patterns.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every command and output below was run against Redis 8.6.2 on a private instance (port 6399): SET NX PX lock with a Lua unlock, INCR and ZSET rate limits, MULTI/WATCH/Lua, and maxmemory 8mb with noeviction vs allkeys-lru on 100000 keys.
// Pipelining figures: redis-benchmark -t set -n 100000 -c 1 -P 1/16/100 against a local Redis 8.6.2 (loopback).
// Redisson parts (flash sale, watchdog PTTL, @DistributedLock aspect, atomic UPDATE): Spring Boot 3.5.16, Redisson 4.8.0 (redisson-spring-data-35), Redis 7.4 in Docker, stock in H2, 100 threads.
// RDB/AOF crash tests (kill -9) and the cluster slot/CROSSSLOT checks ran on separate local Redis 8.6.2 processes (the cluster one with cluster-enabled and all 16384 slots on one node).
export const redisPatterns: Lesson = {
  slug: "redis-patterns",
  crumb: "Redis Patterns",
  videoDir: "/videos/redis-patterns",
  videoVersion: "aed2a442",
  scenes: timeline as Scene[],
  title: "Redis: khoá phân tán, rate limit, transaction và eviction",
  subtitle:
    "Các mẫu dùng Redis hay bị hỏi: khoá phân tán đúng cách, giới hạn tốc độ, vì sao MULTI không rollback, Lua nguyên tử, pipelining, và điều gì xảy ra khi Redis hết bộ nhớ.",
  openingQuiz: {
    question: "Khoá phân tán bằng Redis nên lấy khoá bằng lệnh nào?",
    options: [
      "`SETNX key value` rồi `EXPIRE key ttl`",
      "`SET key token NX PX ttl` trong một lệnh",
      "`GET key` rồi `SET key value`",
      "`INCR key`",
    ],
    answer: 1,
    explain: "Một lệnh duy nhất vừa đặt khoá vừa đặt thời hạn. Nếu tách hai lệnh, tiến trình chết giữa hai lệnh sẽ để lại khoá không bao giờ hết hạn.",
  },
  roadmap: [
    "Chặng 1: khoá phân tán. `SET NX PX`, token, và mở khoá bằng Lua.",
    "Chặng 2: rate limit bằng `INCR` và Sorted Set.",
    "Chặng 3: `MULTI`, `WATCH`, Lua, pipelining, rồi TTL, eviction, lưu trữ (RDB, AOF) và các cách mở rộng (replication, Sentinel, Cluster).",
  ],
  sections: [
    {
      id: "lock",
      scene: "lock",
      senior: true,
      title: "Khoá phân tán: SET NX PX và mở khoá an toàn",
      intro: [
        "Khoá phân tán bảo đảm **chỉ một tiến trình** (trên nhiều server) làm một việc tại một thời điểm. Cách chuẩn: `SET key token NX PX ttl`, trong đó **token** là giá trị duy nhất của người giữ khoá.",
        "Hai điểm sống còn:",
        "- **Có thời hạn**: để khoá không treo mãi khi tiến trình chết.",
        "- **Chỉ người giữ mới được mở**: nhờ so token.",
        "Mở khoá an toàn cần \"kiểm tra token rồi xoá\" trong một bước. Lệnh `EVAL` làm được việc đó: nó chạy một đoạn script **Lua** nhỏ ngay trên server Redis như **một lệnh nguyên tử**, không lệnh nào của client khác chen vào giữa.",
      ],
      board: {
        title: "Khoá phân tán: lấy khoá và mở khoá an toàn",
        highlight: "mở khoá an toàn",
        chips: ["Có thời hạn", "Chỉ người giữ mới được mở"],
        cards: [
          {
            title: "Ba phần của SET",
            diagram: {
              kind: "hub",
              inputs: [{ label: "NX", mark: "plus" }, { label: "PX ttl", mark: "plus" }, { label: "token", mark: "plus" }],
              center: "SET lock",
              rulesTitle: "Điều bảo đảm",
              rules: ["NX: chỉ một tiến trình giữ", "PX: hết hạn nếu tiến trình chết", "token: biết ai là chủ khoá"],
            },
            code: `SET lock:order1 tokenA NX PX 30000`,
            takeaway: "Đặt khoá và thời hạn trong một lệnh",
          },
          {
            title: "Mở khoá bằng Lua",
            diagram: {
              kind: "flow",
              steps: ["SET NX PX thành công", "Làm việc", "EVAL: so token rồi DEL"],
              ok: ["Token khớp", "DEL, khoá được mở"],
              bad: ["Khoá đã hết hạn, B giữ", "Lua trả 0, không xoá"],
            },
            notes: ["`EVAL` chạy script Lua như một lệnh nguyên tử, không lệnh nào chen vào giữa.", "`DEL` thẳng sẽ xoá cả khoá của B."],
            code: `EVAL "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:order1 tokenA`,
            takeaway: "Kiểm tra token rồi xoá phải là một bước",
          },
        ],
        conclusion: "**Kết luận:** khoá cần thời hạn để không treo, cần token để không xoá nhầm khoá của người khác.",
      },
      predict: {
        question: "A giữ khoá nhưng làm quá lâu, khoá hết hạn và B lấy được khoá. A làm xong, gọi `DEL lock:order1` thẳng. Chuyện gì xảy ra?",
        options: [
          "Không gì, vì khoá của A đã hết hạn từ trước",
          "A xoá luôn khoá của B, tiến trình thứ ba có thể vào cùng lúc với B",
          "Redis từ chối vì A không phải chủ khoá",
          "B bị dừng lại",
        ],
        answer: 1,
        explain: "`DEL` không biết ai đang giữ khoá, nó xoá bất kỳ giá trị nào nằm ở key đó. Vì vậy mở khoá phải kiểm tra token.",
      },
      widgetTitle: "Hai tiến trình A và B tranh khoá",
      compare: [
        way(
          "SETNX, EXPIRE, và DEL thẳng",
          `SETNX lock:order1 1        # lệnh 1
EXPIRE lock:order1 30      # lệnh 2: nếu chết giữa hai lệnh, khoá không bao giờ hết hạn
...
DEL lock:order1            # mở khoá không kiểm tra ai đang giữ`,
          [
            ask("Tiến trình chết giữa SETNX và EXPIRE", bad("Khoá không có thời hạn và treo mãi, mọi tiến trình khác bị chặn.")),
            ask("A làm quá lâu, khoá hết hạn, B lấy khoá, A mở khoá", bad("Đã chạy: A gọi `DEL` và xoá **khoá của B** (`DEL` ra `1`). Hai tiến trình cùng chạy trong đoạn găng (critical section: đoạn code chỉ được một tiến trình chạy tại một thời điểm).")),
          ],
          "Thiếu thời hạn nguyên tử và thiếu kiểm tra chủ sở hữu.",
        ),
        way(
          "SET NX PX và Lua kiểm tra token",
          `SET lock:order1 tokenA NX PX 30000        # một lệnh: đặt khoá và thời hạn
# mở khoá: chỉ xoá khi token khớp
EVAL "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:order1 tokenA`,
          [
            ask("B thử lấy khoá khi A đang giữ", ok("Đã chạy: A nhận `OK`, B nhận `nil` (không lấy được). Sau khi hết hạn (300 ms trong thử nghiệm) B mới lấy được.")),
            ask("A mở khoá sau khi mất khoá", ok("Đã chạy: A mở bằng `tokenA` ra `0` (không xoá), B mở bằng `tokenB` ra `1`. Chỉ chủ sở hữu mới mở được.")),
          ],
          "Khoá có thời hạn, và chỉ người giữ mới mở được.",
        ),
      ],
      after: [
        "Thời hạn phải lớn hơn thời gian làm việc. Việc có thể lâu thì cần gia hạn (watchdog, như Redisson). Cần mạnh hơn thì dùng khoá của database hoặc ZooKeeper.",
      ],
      takeaway: {
        lines: [
          "Lấy khoá: `SET key token NX PX ttl` trong **một** lệnh.",
          "Mở khoá: Lua kiểm tra token rồi mới xoá, trong **một** bước.",
        ],
      },
      trap: {
        title: "Khoá phân tán không phải bảo đảm tuyệt đối",
        text: "Tiến trình bị tạm dừng lâu (GC, mạng) khi khoá đã hết hạn vẫn có thể tiếp tục làm việc cùng lúc với người giữ khoá mới. Vì vậy thao tác cuối cùng nên **idempotent** hoặc có token kiểm tra (fencing) ở phía lưu trữ.",
      },
      quiz: {
        question: "Vì sao mở khoá cần Lua kiểm tra token thay vì `DEL` thẳng?",
        options: [
          "Để tránh xoá nhầm khoá mà người khác đã lấy sau khi khoá của mình hết hạn",
          "Để `DEL` nhanh hơn",
          "Để khoá không hết hạn",
          "Để dùng được cluster",
        ],
        answer: 0,
        explain: "Đã chạy: `DEL` thẳng xoá luôn khoá của B. Lua kiểm tra `GET == token` rồi `DEL` trong một bước nguyên tử.",
      },
      parts: [
        {
          id: "redisson-rlock",
          senior: true,
          title: "Redisson RLock: flash sale 10 món, 100 người mua",
          intro: [
            "Ta đã tự viết khoá bằng `SET NX PX` và Lua. Trong dự án Spring, người ta thường dùng **Redisson**: thư viện đã làm sẵn phần lấy khoá, mở khoá theo chủ sở hữu, và thêm việc tự gia hạn.",
            "Tình huống: flash sale, kho còn **10** món, **100** người bấm mua cùng lúc. Code mua là check-then-act: đọc `qty`, còn hàng thì ghi `qty - 1` và tạo đơn.",
            "Đã chạy (Spring Boot 3.5.16, Redisson 4.8.0, Redis 7.4 trong Docker, tồn kho trong H2): không khoá gì, 3 lần chạy đều tạo **100 đơn**, kho còn 8 hoặc 9. Nhiều thread cùng đọc `qty = 10` rồi cùng ghi `9`.",
            "Phản xạ đầu tiên là `synchronized` hoặc `ReentrantLock`. Cả hai chỉ khoá trong **một JVM**. Chạy 2 instance sau load balancer thì mỗi instance có monitor riêng, hai request ở hai instance vẫn chạy song song.",
          ],
          predict: {
            question: "Hai instance, mỗi instance có method mua `synchronized`, chia đều 100 người mua. Kho 10. Bao nhiêu đơn được tạo?",
            options: ["10", "20", "100", "0"],
            answer: 1,
            explain: "Mỗi instance tự xếp hàng các request của mình và tự tin bán đúng 10 món, nhưng hai instance không biết nhau. Đã chạy: 20 đơn, kho về 0.",
          },
          widgetTitle: "100 người mua, kho 10",
          compare: [
            way(
              "synchronized trên 2 instance",
              `// mỗi instance một object, một monitor riêng
public synchronized boolean buy(long productId) {
  int qty = stockRepo.qty(productId);
  if (qty <= 0) return false;
  stockRepo.setQty(productId, qty - 1);
  orderRepo.create(productId);
  return true;
}`,
              [
                ask("100 người mua, chia đều cho 2 instance", bad("Đã chạy (mô phỏng 2 instance bằng 2 object, mỗi object một monitor): 3 lần đều ra **20 đơn**, kho 0. Bán gấp đôi số hàng có.")),
                ask("Chỉ chạy 1 instance", ok("Đúng, nhưng chỉ tới ngày scale lên 2 instance.")),
              ],
              "Khoá của JVM không nhìn thấy JVM khác.",
            ),
            way(
              "Redisson RLock",
              `RLock lock = redisson.getLock("lock:stock:" + productId);
if (!lock.tryLock(5, TimeUnit.SECONDS)) {   // chờ tối đa 5 giây, không leaseTime
  throw new BusyException();
}
try {
  return buyUnsafe(productId);
} finally {
  if (lock.isHeldByCurrentThread()) lock.unlock();
}`,
              [
                ask("100 người mua, kho 10", ok("Đã chạy 3 lần: đúng **10 đơn**, kho 0, 90 người còn lại nhận \"hết hàng\". Tổng 370 đến 410 ms vì 100 lượt mua chạy lần lượt.")),
                ask("Thread khác gọi `unlock()`", ok("Đã chạy: `isHeldByCurrentThread()` ra `false`, gọi `unlock()` ném `IllegalMonitorStateException: attempt to unlock lock, not locked by current thread`. Redisson nhớ chủ khoá theo id client cộng id thread, giống token ở phần trên.")),
              ],
              "Khoá nằm trong Redis nên mọi instance cùng thấy.",
            ),
          ],
          after: [
            "Ba cách lấy khoá của `RLock`:",
            "- **`lock()`**: chờ tới khi lấy được, không có hạn chờ. Không truyền `leaseTime` nên watchdog gia hạn.",
            "- **`tryLock(waitTime, unit)`**: chờ tối đa `waitTime`, không lấy được thì trả `false`. Watchdog vẫn bật.",
            "- **`tryLock(waitTime, leaseTime, unit)`**: khoá tự hết hạn sau `leaseTime`, **không** được gia hạn.",
            "**Watchdog** là luồng nền của Redisson gia hạn khoá lấy **không có** `leaseTime`. Đã chạy với Redisson 4.8.0: `getLockWatchdogTimeout()` = `30000`. Đo `PTTL lock:report` mỗi 2 giây khi đang giữ khoá: `29982`, giảm dần tới `19975` ở giây thứ 10, rồi về lại `28051` ở giây thứ 12, `20044` ở giây 20, `28078` ở giây 22. Tức là cứ khoảng 10 giây (một phần ba của 30 giây) khoá lại được đặt về 30 giây.",
            "Truyền `leaseTime` 10 giây thì không ai gia hạn: đã đo `PTTL` từ `9998` giảm tới `1974` ở giây 8, tới giây 10 ra `-2` (key đã mất) dù việc vẫn chưa xong.",
            "Instance giữ khoá chết hẳn thì watchdog chết theo, không ai gia hạn, khoá tự hết hạn sau tối đa 30 giây. Đó là lý do watchdog an toàn hơn một `leaseTime` dài.",
            "Luôn `unlock()` trong `finally`, và chỉ khi `isHeldByCurrentThread()`: khoá có `leaseTime` có thể đã hết hạn trước khi việc xong, lúc đó khoá không còn thuộc thread này nữa.",
          ],
          takeaway: {
            lines: [
              "`synchronized` chỉ khoá một JVM. Nhiều instance thì cần khoá dùng chung, như `RLock` trong Redis.",
              "Không truyền `leaseTime` thì watchdog gia hạn (mặc định 30 giây, gia hạn khoảng mỗi 10 giây). Truyền `leaseTime` là tắt watchdog.",
            ],
          },
          trap: {
            title: "Đặt leaseTime \"cho chắc\"",
            text: "Viết `tryLock(5, 10, SECONDS)` nghĩa là tắt watchdog: việc chạy quá 10 giây thì khoá đã mất giữa chừng, người khác vào đoạn găng cùng lúc. Chỉ truyền `leaseTime` khi chắc chắn việc luôn ngắn hơn nó.",
          },
          quiz: {
            question: "Gọi `lock.lock()` không truyền `leaseTime`, việc mất 25 giây, Redisson cấu hình mặc định. `PTTL` của key khoá ở giây thứ 12 khoảng bao nhiêu?",
            options: [
              "Khoảng 18000, vì 30 giây trừ 12 giây",
              "Khoảng 28000, vì watchdog đã gia hạn về 30 giây ở khoảng giây thứ 10",
              "-2, khoá đã hết hạn",
              "-1, khoá không có thời hạn",
            ],
            answer: 1,
            explain: "Đã đo: `19975` ở giây 10, `28051` ở giây 12. Watchdog đặt lại thời hạn 30 giây khoảng mỗi 10 giây, miễn là instance còn sống và chưa unlock.",
          },
        },
        {
          id: "distributed-lock-annotation",
          senior: true,
          title: "@DistributedLock với key SpEL, bẫy self-invocation, và khi nào không cần khoá",
          intro: [
            "Phần trước viết `tryLock` và `finally` bằng tay. Lặp lại ở mười chỗ thì sớm muộn có chỗ quên `unlock`. Cách gọn hơn: một annotation, và một **aspect** AOP làm phần khoá, giống cách `@Transactional` chạy.",
            "Annotation nhận key là biểu thức **SpEL** (ngôn ngữ biểu thức của Spring), ví dụ `\"'stock:' + #productId\"`. Aspect đọc tên tham số của method, tính ra `stock:1`, rồi khoá `lock:stock:1`. Mỗi sản phẩm một khoá riêng, mua hai sản phẩm khác nhau không phải chờ nhau.",
            "Aspect chạy bằng proxy, nên nó có đúng cái bẫy của `@Transactional` và `@Cacheable`: gọi `this.buyLocked()` từ chính class đó là đi thẳng vào object thật, không qua proxy, không có khoá.",
          ],
          predict: {
            question: "Trong `StockService`, method `buyViaThis()` gọi `this.buyLocked()` (có `@DistributedLock`). 100 người mua qua `buyViaThis()`, kho 10. Bao nhiêu đơn?",
            options: ["10", "20", "100", "Ném lỗi vì không lấy được khoá"],
            answer: 2,
            explain: "Đã chạy: 100 đơn, kho còn 8 hoặc 9, giống hệt lúc không khoá. Lời gọi qua `this` không đi qua proxy nên aspect không chạy.",
          },
          widgetTitle: "Khoá bằng annotation",
          compare: [
            way(
              "Tự viết try/finally ở mọi chỗ",
              `public boolean buy(long productId) throws InterruptedException {
  RLock lock = redisson.getLock("lock:stock:" + productId);
  if (!lock.tryLock(5, TimeUnit.SECONDS)) throw new BusyException();
  try {
    return buyUnsafe(productId);
  } finally {
    if (lock.isHeldByCurrentThread()) lock.unlock();
  }
}`,
              [
                ask("Thêm khoá cho method thứ mười", bad("Chép lại cả khối, dễ quên `finally` hoặc gõ sai tên key.")),
                ask("Đọc code nghiệp vụ", bad("Phần khoá chiếm nhiều dòng hơn phần mua hàng.")),
              ],
              "Đúng, nhưng lặp lại và dễ sai.",
            ),
            way(
              "@DistributedLock và aspect",
              `@Target(METHOD) @Retention(RUNTIME)
public @interface DistributedLock {
  String key();                  // SpEL, vd "'stock:' + #productId"
  long waitTime() default 5;
  long leaseTime() default -1;   // -1: không leaseTime, watchdog gia hạn
  TimeUnit unit() default SECONDS;
}

@Aspect @Component @Order(1)     // chạy ngoài @Transactional
class DistributedLockAspect {
  @Around("@annotation(dl)")
  Object around(ProceedingJoinPoint pjp, DistributedLock dl) throws Throwable {
    Method m = ((MethodSignature) pjp.getSignature()).getMethod();
    var ctx = new MethodBasedEvaluationContext(null, m, pjp.getArgs(), names);
    String key = "lock:" + parser.parseExpression(dl.key()).getValue(ctx, String.class);
    RLock lock = redisson.getLock(key);
    boolean got = dl.leaseTime() > 0
        ? lock.tryLock(dl.waitTime(), dl.leaseTime(), dl.unit())
        : lock.tryLock(dl.waitTime(), dl.unit());
    if (!got) throw new IllegalStateException("Busy: " + key);
    try { return pjp.proceed(); }
    finally { if (lock.isHeldByCurrentThread()) lock.unlock(); }
  }
}

@DistributedLock(key = "'stock:' + #productId")
public boolean buyLocked(long productId) { ... }`,
              [
                ask("Gọi `buyLocked()` từ bean khác", ok("Đã chạy: đúng 10 đơn, kho 0.")),
                ask("Gọi qua `this.buyLocked()` trong cùng class", bad("Đã chạy: 100 đơn. Không qua proxy nên không có khoá.")),
                ask("Gọi qua bean tự inject: `@Autowired @Lazy StockService self;` rồi `self.buyLocked()`", ok("Đã chạy: đúng 10 đơn. `self` là proxy nên aspect chạy. `@Lazy` để Spring không báo vòng phụ thuộc khi bean inject chính nó.")),
                ask("Đặt `@Order(Ordered.HIGHEST_PRECEDENCE)` cho aspect", bad("Đã chạy: mọi lời gọi ném `IllegalStateException: Required to bind 2 arguments, but only bound 1 (JoinPointMatch was NOT bound in invocation)`. Aspect bind tham số annotation cần chạy sau interceptor nội bộ của Spring AOP, nên dùng một order nhỏ như `1`, không dùng `HIGHEST_PRECEDENCE`.")),
              ],
              "Một dòng annotation, phần khoá viết một lần.",
            ),
          ],
          after: [
            "**Thứ tự với `@Transactional`**: aspect khoá phải bọc **ngoài** transaction. Nếu khoá nằm bên trong, `unlock` chạy trước commit, người kế tiếp lấy được khoá nhưng vẫn đọc ra `qty` cũ chưa commit. `@Transactional` mặc định có order thấp nhất (`LOWEST_PRECEDENCE`), nên `@Order(1)` cho aspect khoá đặt nó ở ngoài.",
            "**Khi nào không cần khoá phân tán**. Nếu việc cần bảo vệ chỉ là một dòng trong DB, để DB tự làm nguyên tử:",
            "- `UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0`, rồi xem số dòng bị ảnh hưởng: `1` là mua được, `0` là hết hàng.",
            "- Đã chạy cùng bài toán 100 người, kho 10: đúng **10 đơn**, kho 0, mất 11 đến 12 ms, so với 370 đến 410 ms khi dùng khoá Redis.",
            "- Không cần Redis, không có khoá hết hạn giữa chừng, không có watchdog. Khoá phân tán hợp hơn khi đoạn găng gồm nhiều bước ngoài DB (gọi API thanh toán, ghi nhiều hệ thống) hoặc khi chặn một job chạy trùng trên nhiều instance.",
          ],
          takeaway: {
            lines: [
              "Annotation + aspect gói phần khoá vào một chỗ, nhưng chỉ chạy khi lời gọi đi qua proxy: gọi từ bean khác hoặc qua `@Lazy` self.",
              "Chỉ trừ một con số trong DB thì `UPDATE ... WHERE qty > 0` đơn giản và nhanh hơn khoá phân tán.",
            ],
          },
          trap: {
            title: "Self-invocation lặng lẽ tắt khoá",
            text: "`this.buyLocked()` không báo lỗi gì, chỉ âm thầm chạy không khoá. Đã chạy: 100 đơn cho 10 món. Sửa: gọi qua một bean khác, hoặc `@Autowired @Lazy` chính service đó rồi gọi qua biến inject.",
          },
          quiz: {
            question: "Flash sale chỉ cần trừ tồn kho một sản phẩm trong cùng một DB. Cách nào đơn giản nhất mà vẫn không bán vượt?",
            options: [
              "`synchronized` trên method mua",
              "`UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0` rồi kiểm tra số dòng bị ảnh hưởng",
              "Redisson `RLock` với `leaseTime` 1 giây",
              "Đọc `qty` rồi `UPDATE`, chạy trong `@Transactional`",
            ],
            answer: 1,
            explain: "Câu `UPDATE` có điều kiện là một bước nguyên tử trong DB. Đã chạy: đúng 10 đơn trong khoảng 12 ms. `synchronized` hỏng khi có 2 instance; đọc rồi ghi trong transaction ở mức READ COMMITTED vẫn có thể bán vượt.",
          },
        },
      ],
    },
    {
      id: "rate-limit",
      scene: "rate-limit",
      title: "Rate limit bằng Redis: INCR và Sorted Set",
      intro: [
        "Khoá phân tán cho đúng một tiến trình làm việc. Rate limit thì khác: cho tối đa N yêu cầu mỗi khoảng thời gian. Nhiều server cần **chung một bộ đếm**, nên đếm trong Redis. Hai cách phổ biến: **fixed window** bằng `INCR` + `EXPIRE`, và **sliding window** bằng Sorted Set.",
      ],
      predict: {
        question: "Sliding window dùng thời điểm làm cả score lẫn member: `ZADD sw:u1 1000 1000` chạy **3 lần** cho 3 yêu cầu cùng mili giây. `ZCARD sw:u1` ra bao nhiêu?",
        options: ["3", "1", "0", "Lỗi vì trùng score"],
        answer: 1,
        explain: "ZSET là tập hợp: member trùng chỉ cập nhật score, không thêm phần tử. Đếm thiếu 2 yêu cầu, nên member phải duy nhất (thời điểm cộng id yêu cầu).",
      },
      widgetTitle: "Giới hạn theo người dùng",
      compare: [
        way(
          "INCR kèm EXPIRE (fixed window)",
          `n = INCR rl:u1
if n == 1: EXPIRE rl:u1 60     # đặt thời hạn lần đầu
if n > 5: từ chối`,
          [
            ask("6 yêu cầu liên tiếp", ok("Đã chạy: `INCR` ra `1 2 3 4 5 6`, `TTL` khoảng 60. Chỉ cần 1 khoá cho mỗi người dùng.")),
            ask("Burst ở ranh giới hai cửa sổ", bad("5 yêu cầu cuối cửa sổ cộng 5 yêu cầu đầu cửa sổ sau là 10 yêu cầu trong vài giây mà vẫn đều qua. Thêm nữa, nếu tiến trình chết giữa `INCR` và `EXPIRE` thì khoá không bao giờ hết hạn, nên gộp hai lệnh vào một script Lua.")),
          ],
          "Rất rẻ, nhưng cho burst ở ranh giới.",
        ),
        way(
          "Sorted Set (sliding window)",
          `ZREMRANGEBYSCORE sw:u1 0 (now-10)     # bỏ các mốc đã quá cửa sổ
if ZCARD sw:u1 < 3: ZADD sw:u1 now now-requestId   # score = thời điểm, member duy nhất
else: từ chối`,
          [
            ask("Giới hạn 3 yêu cầu mỗi 10 giây", ok("Đã chạy: yêu cầu lúc 1000, 1002, 1004 qua, lúc 1005 bị từ chối, lúc 1011 lại qua (các mốc cũ đã trôi khỏi cửa sổ).")),
            ask("Hai yêu cầu cùng một mili giây", ok("Member phải **duy nhất**: ZSET là tập hợp, member trùng chỉ cập nhật score. Đã chạy: `ZADD sw:u1 1000 1000` ba lần, `ZCARD` ra `1`, tức đếm thiếu 2 yêu cầu. Dùng member `1000-r1`, `1000-r2`, `1000-r3` (thời điểm cộng id yêu cầu) thì `ZCARD` ra `3`.")),
            ask("Bộ nhớ", bad("Mỗi yêu cầu là một phần tử trong ZSET, nên tốn bộ nhớ theo số yêu cầu trong cửa sổ.")),
          ],
          "Chính xác theo thời gian thực, đổi lại tốn bộ nhớ hơn.",
        ),
      ],
      after: [
        "Để các bước (xoá, đếm, thêm) không bị chen ngang giữa nhiều client, đặt chúng trong **một script Lua**. Token bucket cũng viết được bằng Lua với hai số lưu trong Hash.",
      ],
      trap: {
        title: "Nhiều lệnh rời rạc không nguyên tử",
        text: "Đếm rồi mới thêm là check-then-act. Hai yêu cầu đến cùng lúc có thể cùng thấy còn chỗ. Gộp vào Lua hoặc dùng lệnh nguyên tử như `INCR`.",
      },
      quiz: {
        question: "Ưu điểm của Sorted Set so với `INCR` + `EXPIRE` khi giới hạn tốc độ?",
        options: [
          "Cửa sổ trượt chính xác, không burst ở ranh giới",
          "Dùng ít bộ nhớ hơn",
          "Không cần thời hạn",
          "Nhanh hơn nhiều lần",
        ],
        answer: 0,
        explain: "Mỗi yêu cầu có mốc thời gian riêng nên cửa sổ trượt chính xác, nhưng tốn bộ nhớ theo số yêu cầu.",
      },
    },
    {
      id: "atomic",
      scene: "atomic",
      senior: true,
      title: "MULTI, WATCH và Lua: nguyên tử đến đâu",
      intro: [
        "Hai phần trước đều cần nhiều bước chạy không bị chen ngang. Redis có ba công cụ, nguyên tử ở mức khác nhau:",
        "- **`MULTI`/`EXEC`**: chạy một loạt lệnh **liền nhau**, nhưng **không rollback**: lệnh nào lỗi lúc chạy thì chỉ lệnh đó lỗi, các lệnh khác vẫn chạy.",
        "- **`WATCH`**: thêm khoá lạc quan: nếu khoá bị người khác sửa trước `EXEC` thì giao dịch bị huỷ.",
        "- **Lua**: dùng khi cần logic điều kiện.",
        "Cả ba cách bên dưới cùng làm một việc: trừ kho `stock` khi kho chỉ còn 1.",
      ],
      predict: {
        question: "A `WATCH stock` và đọc được `1`. Trước khi A gọi `EXEC`, B `SET stock 0`. A chạy `MULTI`, `DECR stock`, `EXEC`. Kết quả?",
        options: [
          "`stock` thành `-1`",
          "`EXEC` trả `nil`, giao dịch bị huỷ, `stock` giữ `0`",
          "`stock` thành `0` nhờ DECR",
          "Redis khoá B lại",
        ],
        answer: 1,
        explain: "`WATCH` thấy `stock` bị sửa sau khi A bắt đầu theo dõi, nên huỷ cả giao dịch. A biết phải đọc lại rồi thử lại.",
      },
      widgetTitle: "Trừ kho khi chỉ còn 1 sản phẩm",
      compare: [
        way(
          "MULTI / EXEC",
          `SET stock 1
MULTI
DECR stock
LPUSH stock x      # stock là số, LPUSH sai kiểu
DECR stock
EXEC`,
          [
            ask("Một lệnh trong giao dịch lỗi", bad("Đã chạy: `EXEC` trả `0`, `WRONGTYPE`, `-1`. Lệnh `LPUSH` lỗi nhưng hai lệnh `DECR` vẫn chạy, `stock` thành `-1`. **Không có rollback**, và cũng không có điều kiện nào chặn kho âm.")),
            ask("WATCH và có người sửa trước EXEC", ok("Đã chạy: client A `WATCH stock`, đọc `GET stock` ra `1`. Client B `SET stock 0` (người khác vừa mua). A chạy `MULTI`, `DECR stock`, `EXEC`: `EXEC` trả `nil`, giao dịch bị huỷ, `stock` giữ `0`. A biết phải đọc lại rồi thử lại.")),
          ],
          "Các lệnh chạy liền nhau nhưng không có điều kiện và không rollback.",
        ),
        way(
          "Lua script",
          `EVAL "local s=tonumber(redis.call('get',KEYS[1]))
       if s>0 then redis.call('decr',KEYS[1]) return 1 else return 0 end" 1 stock`,
          [
            ask("Hai người cùng mua khi kho còn 1", ok("Đã chạy: người thứ nhất nhận `1` (mua được), người thứ hai nhận `0` (hết hàng), `stock` về `0`, không bị âm.")),
            ask("Điều kiện và nhiều bước", ok("Cả script chạy nguyên tử trên server, không lệnh nào chen vào giữa.")),
          ],
          "Có điều kiện, nhiều bước, chạy nguyên tử.",
        ),
      ],
      after: [
        "Script nặng sẽ chặn cả server vì Redis xử lý một luồng.",
      ],
      takeaway: {
        lines: ["Lệnh đơn là nguyên tử. Nhiều lệnh cần nguyên tử thì dùng **Lua** (có điều kiện) hoặc `MULTI` (không điều kiện)."],
      },
      trap: {
        title: "Tưởng MULTI giống transaction của database",
        text: "`MULTI` không có rollback và không đọc được kết quả giữa các lệnh để rẽ nhánh. Cần rẽ nhánh theo giá trị vừa đọc thì phải Lua hoặc `WATCH`.",
      },
      quiz: {
        question: "Trong `MULTI`, một lệnh sai kiểu dữ liệu lúc chạy. Điều gì xảy ra với các lệnh còn lại?",
        options: [
          "Vẫn chạy bình thường, không có rollback",
          "Tất cả bị rollback",
          "Redis dừng lại",
          "Giao dịch bị khoá",
        ],
        answer: 0,
        explain: "Đã chạy: `LPUSH` lỗi `WRONGTYPE`, hai `DECR` còn lại vẫn chạy nên `stock` từ `1` xuống `-1`.",
      },
      parts: [
        {
          id: "pipeline",
          title: "Pipelining: nhiều lệnh trong một vòng mạng",
          intro: [
            "`MULTI` và Lua lo chuyện nguyên tử. Pipelining giải một bài toán khác: **độ trễ mạng**.",
            "Redis xử lý một lệnh `GET` chỉ mất vài micro giây. Cái đắt là mỗi lệnh phải đi một vòng client tới server rồi về (RTT), trong cùng data center thường cỡ vài phần mười mili giây. Vòng lặp 1.000 lệnh `GET` là 1.000 RTT: với RTT 0,5 ms thì mất khoảng 500 ms chỉ để chờ mạng.",
            "**Pipelining**: client gửi liền N lệnh rồi mới đọc N kết quả, nên cả lô chỉ tốn khoảng một RTT cộng thời gian xử lý. Lệnh nhiều key như `MGET`, `MSET` cũng chỉ một RTT.",
            "Ba điều cần nói khi được hỏi:",
            "- **Không nguyên tử**: lệnh của client khác vẫn có thể chen vào giữa các lệnh trong pipeline. Cần nguyên tử thì dùng Lua hoặc `MULTI`.",
            "- **Lệnh sau không dùng được kết quả lệnh trước**: mọi kết quả chỉ về sau cùng.",
            "- **Đừng nhồi một lô khổng lồ**: server giữ toàn bộ kết quả trong bộ nhớ cho tới khi gửi đi; chia thành các lô vừa phải.",
          ],
          predict: {
            question: "Một client, 100.000 lệnh `SET` tới Redis trên cùng máy (loopback). Gửi theo lô 100 lệnh một (pipeline) so với từng lệnh một thì nhanh hơn khoảng bao nhiêu?",
            options: ["Như nhau, Redis vẫn xử lý từng lệnh", "Khoảng 2 lần", "Vài chục lần", "Chậm hơn, vì lô lớn"],
            answer: 2,
            explain: "Đã chạy `redis-benchmark` trên Redis 8.6.2 local: 7.204 lệnh/giây khi không pipeline, 552.486 lệnh/giây với lô 100, gấp khoảng 77 lần. Thời gian chủ yếu nằm ở các vòng đi về, không ở Redis.",
          },
          widgetTitle: "Đọc giá của 1.000 sản phẩm",
          compare: [
            way(
              "Từng lệnh một",
              `for (String id : ids) {                                   // 1.000 id
  prices.add(redis.opsForValue().get("price:" + id));     // mỗi lệnh một RTT
}`,
              [
                ask("RTT 0,5 ms qua mạng", bad("Ước lượng: 1.000 × 0,5 ms = 500 ms chỉ để chờ mạng.")),
                ask("Đo trên máy local", bad("Đã chạy `redis-benchmark -c 1 -P 1`: 7.204 `SET` mỗi giây, dù loopback có RTT nhỏ nhất có thể.")),
              ],
              "Thời gian tỉ lệ với số lệnh nhân RTT.",
            ),
            way(
              "Pipeline hoặc MGET",
              `List<Object> prices = redis.executePipelined((RedisCallback<Object>) conn -> {
  for (String id : ids) conn.stringCommands().get(("price:" + id).getBytes());
  return null;                        // kết quả trả về theo đúng thứ tự gửi
});
// chỉ đọc nhiều key thì gọn hơn: redis.opsForValue().multiGet(keys)   // MGET`,
              [
                ask("RTT 0,5 ms qua mạng", ok("Khoảng một RTT cho cả lô, cộng thời gian Redis xử lý 1.000 lệnh.")),
                ask("Đo trên máy local", ok("Đã chạy `redis-benchmark -c 1 -P 16`: 91.075 `SET` mỗi giây; `-P 100`: 552.486 mỗi giây.")),
              ],
              "Gom lệnh lại để trả một lần phí mạng.",
            ),
          ],
          trap: {
            title: "Tưởng pipeline là transaction",
            text: "Pipeline chỉ gộp đường đi mạng. Các lệnh vẫn chạy riêng lẻ, lệnh client khác chen vào giữa được, và lệnh lỗi không kéo lệnh khác theo. Cần kiểm tra rồi ghi trong một bước thì dùng Lua.",
          },
          takeaway: {
            lines: [
              "Chậm vì nhiều lệnh nhỏ thì thủ phạm là RTT. Gom lại bằng `MGET`/`MSET` hoặc pipeline; cần nguyên tử thì Lua.",
            ],
          },
          quiz: {
            question: "Muốn gửi trong một pipeline: `GET stock`, rồi `DECR stock` chỉ khi stock > 0. Viết được không?",
            options: [
              "Được, pipeline chạy nguyên tử",
              "Không: trong pipeline kết quả chỉ về sau cùng nên lệnh sau không rẽ nhánh theo lệnh trước được, và cũng không nguyên tử; dùng Lua",
              "Được, nếu dùng MGET",
              "Được, nếu đặt TTL cho key",
            ],
            answer: 1,
            explain: "Pipeline không đọc được kết quả giữa chừng. Kiểm tra rồi trừ trong một bước là việc của Lua (phần trên).",
          },
        },
      ],
    },
    {
      id: "eviction",
      scene: "eviction",
      senior: true,
      title: "TTL và eviction: khi Redis hết bộ nhớ",
      intro: [
        "Khoá, bộ đếm, cache đều chiếm RAM, mà RAM có hạn. Có hai cơ chế dọn dữ liệu: **TTL** (khoá tự hết hạn) và **eviction** (xoá bớt khi chạm `maxmemory`). Chính sách eviction quyết định điều gì xảy ra khi đầy.",
        "Mặc định `noeviction` **từ chối ghi** khi đầy. `allkeys-lru` xoá các khoá ít dùng gần đây nhất để có chỗ cho khoá mới.",
      ],
      widgetTitle: "100.000 khoá, giới hạn 8 MB",
      compare: [
        way(
          "noeviction",
          `maxmemory 8mb
maxmemory-policy noeviction`,
          [
            ask("Ghi 100.000 khoá (mỗi khoá 100 byte)", bad("Đã chạy: khoảng 46.500 lệnh `SET` thành công, **khoảng 53.500 lệnh bị từ chối** với `OOM command not allowed when used memory > 'maxmemory'`. Không khoá nào bị xoá.")),
            ask("Dùng làm cache", bad("Cache đầy thì ứng dụng nhận lỗi khi ghi, thay vì tự dọn.")),
          ],
          "An toàn cho dữ liệu quan trọng (không tự xoá), nhưng đầy thì ghi lỗi.",
        ),
        way(
          "allkeys-lru",
          `maxmemory 8mb
maxmemory-policy allkeys-lru`,
          [
            ask("Ghi 100.000 khoá", ok("Đã chạy: cả 100.000 lệnh `SET` đều `OK`. Redis xoá khoảng 54.800 khoá cũ (`evicted_keys`), còn khoảng 45.400. Khoá đầu tiên đã bị xoá, khoá mới nhất vẫn còn.")),
            ask("Dùng làm cache", ok("Đúng ý nghĩa của cache: giữ phần dữ liệu hay dùng, tự bỏ phần cũ.")),
          ],
          "Phù hợp cache, nhưng dữ liệu có thể biến mất bất cứ lúc nào.",
        ),
      ],
      after: [
        "TTL: đã chạy `SET s1 v PX 300`, sau 0,5 giây `GET` ra `nil`. `PERSIST` bỏ thời hạn (`TTL` ra `-1`). Redis xoá khoá hết hạn cả khi có người truy cập (lazy) lẫn chạy ngầm định kỳ.",
        "Biến thể: `volatile-lru` chỉ xoá khoá có TTL, `allkeys-lfu` xoá theo tần suất dùng.",
      ],
      trap: {
        title: "Dùng Redis làm database với chính sách allkeys",
        text: "Nếu Redis chứa dữ liệu không được mất (session, khoá, hàng đợi) thì đừng dùng `allkeys-lru`: nó có thể xoá chúng. Tách hai instance: một cho cache (`allkeys-lru`), một cho dữ liệu cần giữ (`noeviction`).",
      },
      quiz: {
        question: "Redis dùng làm cache thuần, bộ nhớ có hạn. Chính sách eviction hợp lý?",
        options: ["`allkeys-lru` (hoặc `allkeys-lfu`)", "`noeviction`", "Tắt `maxmemory`", "`volatile-ttl` cho mọi khoá"],
        answer: 0,
        explain: "Cache cần tự dọn khoá cũ khi đầy. Đã chạy: `allkeys-lru` giữ cho mọi lệnh `SET` thành công còn `noeviction` từ chối hơn 53 nghìn lệnh.",
      },
    },
    {
      id: "ha",
      scene: "ha",
      title: "Bảng nhớ: lưu trữ và mở rộng",
      intro: ["Phần này là kiến thức khái niệm hay bị hỏi. Bấm từng dòng để xem câu nên nói. RDB, AOF và Cluster có phần riêng bên dưới."],
      widgetTitle: "Lưu trữ, nhân bản, mở rộng",
      cheat: [
        { name: "Replication", one: "Bản sao đọc từ master.", say: "Replica sao chép bất đồng bộ từ master để scale đọc và dự phòng. Vì bất đồng bộ nên khi master chết, một số ghi gần nhất có thể chưa kịp sang replica." },
        { name: "Sentinel", one: "Tự động failover.", say: "Sentinel giám sát master, và khi master chết thì bầu một replica lên thay, đồng thời báo cho client địa chỉ mới. Dùng khi chỉ có một master." },
        { name: "Khi nào dùng cái nào", one: "Theo nhu cầu.", say: "Một node với replica và Sentinel là đủ cho đa số hệ thống. Chỉ lên Cluster khi dữ liệu hay tải ghi vượt một node." },
      ],
      quiz: {
        question: "Replication của Redis là bất đồng bộ. Hệ quả cần biết?",
        options: [
          "Khi master chết, một số lệnh ghi gần nhất có thể chưa kịp sang replica nên bị mất",
          "Replica luôn đúng tuyệt đối",
          "Không thể đọc từ replica",
          "Master bị khoá khi ghi",
        ],
        answer: 0,
        explain: "Master trả lời khách trước khi chắc chắn replica đã nhận, nên failover có thể mất các ghi cuối.",
      },
      parts: [
        {
          id: "redis-persistence",
          senior: true,
          title: "RDB và AOF: Redis crash thì mất bao nhiêu dữ liệu",
          intro: [
            "Redis giữ dữ liệu trong RAM. Vậy process chết (hoặc máy mất điện) thì cái gì còn lại? Phụ thuộc vào cách bạn bật lưu xuống đĩa:",
            "- **RDB**: chụp snapshot toàn bộ dữ liệu theo điều kiện `save`, ví dụ `save 3600 1000` là mỗi 3600 giây nếu có ít nhất 1000 thay đổi. File gọn, nạp lại nhanh, nhưng mọi ghi sau snapshot cuối đều mất khi crash.",
            "- **AOF** (append-only file): ghi **từng lệnh ghi** vào file. Với `appendfsync everysec` (cấu hình hay dùng) Redis fsync mỗi giây, nên crash mất tối đa khoảng 1 giây dữ liệu; `always` fsync mỗi lệnh thì chậm hơn nhưng gần như không mất.",
            "Hai cái bổ sung nhau: RDB hợp để backup và khởi động nhanh, AOF hợp khi cần mất ít dữ liệu hơn. Bật cả hai cũng được; khi khởi động, nếu AOF được bật thì Redis nạp từ AOF vì nó đầy đủ hơn.",
          ],
          predict: {
            question: "Redis chỉ bật RDB với `save 3600 1000`. Bạn `SET k v` rồi 2 giây sau `kill -9` process. Khởi động lại, `GET k` ra gì?",
            options: [
              "`v`, vì Redis ghi ngay xuống đĩa",
              "Rỗng, vì chưa có snapshot nào kể từ lúc ghi",
              "Lỗi, file hỏng",
              "`v` vì kill -9 vẫn kịp snapshot",
            ],
            answer: 1,
            explain: "`save 3600 1000` chưa đủ điều kiện nên chưa có snapshot nào được tạo. Dữ liệu chỉ nằm trong RAM của process vừa bị giết.",
          },
          widgetTitle: "Crash rồi khởi động lại",
          compare: [
            way(
              "Chỉ RDB",
              `redis-server --save "3600 1000" --appendonly no
SET k v
BGSAVE                    # snapshot thủ công
SET k2 v2
# kill -9, khởi động lại`,
              [
                ask("Sau crash, `GET k`", ok("Đã chạy: `v`, vì `k` đã nằm trong snapshot do `BGSAVE` tạo.")),
                ask("Sau crash, `GET k2`", bad("Đã chạy: rỗng. `k2` ghi sau snapshot cuối nên mất.")),
                ask("Không `BGSAVE`, `SET k v` rồi crash sau 2 giây", bad("Đã chạy: `GET k` rỗng, chưa có snapshot nào.")),
              ],
              "RDB mất mọi thứ ghi sau snapshot cuối.",
            ),
            way(
              "AOF everysec",
              `redis-server --save "" --appendonly yes --appendfsync everysec
SET k v
# đợi 2 giây, kill -9, khởi động lại`,
              [
                ask("Sau crash, `GET k`", ok("Đã chạy: `v`. Lệnh `SET k v` đã nằm trong file AOF (`appendonly.aof.1.incr.aof`).")),
                ask("Crash đúng trong giây vừa ghi", bad("Với `everysec`, lệnh ghi chưa kịp fsync có thể mất; thử nghiệm trên đợi 2 giây trước khi giết nên không thấy mất.")),
              ],
              "AOF mất tối đa khoảng 1 giây với `everysec`, đổi lại file lớn hơn và ghi nhiều hơn.",
            ),
          ],
          after: [
            "Đã chạy trên Redis 8.6.2, một process riêng cho mỗi thử nghiệm. Nếu Redis chỉ làm **cache** (nguồn dữ liệu gốc là DB) thì tắt hẳn lưu đĩa cũng chấp nhận được, vì mất thì nạp lại từ DB.",
          ],
          takeaway: {
            lines: [
              "RDB: gọn, nhanh nhưng mất mọi ghi sau snapshot cuối. AOF: ghi từng lệnh, `everysec` mất tối đa khoảng 1 giây. Dùng Redis làm nguồn dữ liệu chính thì cần AOF.",
            ],
          },
          quiz: {
            question: "Redis lưu phiên đăng nhập, không muốn mất quá khoảng 1 giây dữ liệu khi crash. Chọn cấu hình nào?",
            options: [
              "Chỉ RDB với `save 3600 1000`",
              "AOF với `appendfsync everysec`",
              "Không bật gì, Redis tự lưu",
              "AOF với `appendfsync no`",
            ],
            answer: 1,
            explain: "`everysec` fsync mỗi giây nên mất tối đa khoảng 1 giây. RDB chỉ lưu theo điều kiện snapshot, còn `appendfsync no` để hệ điều hành tự quyết lúc nào ghi xuống đĩa.",
          },
        },
        {
          id: "redis-cluster-slots",
          senior: true,
          title: "Redis Cluster: hash slot và hash tag",
          intro: [
            "Một node Redis không đủ RAM hoặc không chịu nổi tải ghi thì chia dữ liệu ra nhiều node. Câu hỏi là: key nào nằm ở node nào?",
            "Redis Cluster không dùng `hash % số node`. Nó chia không gian key thành **16384 hash slot**: `slot = CRC16(key) mod 16384`. Mỗi node master giữ một dải slot. Thêm node thì chuyển một số slot sang node mới, không phải băm lại toàn bộ key. Client gửi lệnh tới sai node thì nhận `MOVED <slot> <host:port>` và chuyển hướng; thư viện client thường nhớ bảng slot nên ít khi phải làm vậy.",
            "Hệ quả hay bị hỏi: lệnh nhiều key (`MGET`, `MSET`, `SUNION`, Lua nhiều key, `MULTI`) chỉ chạy được khi **mọi key cùng slot**, vì không thể chạy nguyên tử trên nhiều node. Ép các key cùng slot bằng **hash tag**: nếu key có `{...}` thì chỉ phần trong ngoặc được băm, nên `{user:1}:profile` và `{user:1}:cart` cùng slot.",
            "Cái giá của hash tag: mọi key cùng tag dồn vào một slot, một node. Tag quá chung (ví dụ `{app}`) biến cả cluster thành một node nóng.",
          ],
          widgetTitle: "Key nào cùng slot",
          compare: [
            way(
              "Key không có hash tag",
              `SET a 1
SET b 2
MGET a b`,
              [
                ask("`MGET a b` trên cluster", bad("Đã chạy: `CROSSSLOT Keys in request don't hash to the same slot`. `a` và `b` rơi vào hai slot khác nhau.")),
                ask("`CLUSTER KEYSLOT user:1` rồi `user:2`", ok("Đã chạy: `10778` và `6777`. Hai key liền nhau vẫn rơi vào hai slot khác nhau.")),
              ],
              "Key đặt tên giống nhau không có nghĩa là cùng slot.",
            ),
            way(
              "Có hash tag",
              `SET {u}:a 1
SET {u}:b 2
MGET {u}:a {u}:b`,
              [
                ask("`MGET {u}:a {u}:b`", ok("Đã chạy: trả `1` và `2`, vì cả hai cùng slot.")),
                ask("`CLUSTER KEYSLOT {user:1}:profile` và `{user:1}:cart`", ok("Đã chạy: cả hai ra `10778`, đúng slot của `user:1`.")),
                ask("Dùng một tag chung cho mọi key", bad("Mọi key dồn vào một slot, một node: mất ý nghĩa của việc chia dữ liệu.")),
              ],
              "Dùng tag theo đơn vị cần thao tác chung (một user, một giỏ hàng), không theo cả ứng dụng.",
            ),
          ],
          after: [
            "Đã chạy trên Redis 8.6.2 với một node bật `cluster-enabled` và giữ cả 16384 slot, nên không thấy `MOVED` (chỉ có một node). `SET a 1` và `SET b 2` chạy được, riêng lệnh nhiều key thì bị `CROSSSLOT`.",
          ],
          takeaway: {
            lines: [
              "Cluster chia 16384 slot cho các master. Lệnh nhiều key cần cùng slot, ép bằng hash tag `{...}`, nhưng tag càng rộng thì dữ liệu càng dồn về một node.",
            ],
          },
          quiz: {
            question: "Trên Redis Cluster, `MGET order:1 order:2` báo `CROSSSLOT`. Cách sửa hợp lý nhất khi hai key thật sự thuộc cùng một đơn?",
            options: [
              "Đặt tên key có hash tag theo đơn, ví dụ `{order:1}:header` và `{order:1}:items`",
              "Dùng `KEYS` thay cho `MGET`",
              "Tăng số node",
              "Đặt tag `{app}` cho mọi key",
            ],
            answer: 0,
            explain: "Hash tag ép các key liên quan cùng slot. Tag `{app}` dồn mọi key vào một slot, còn thêm node không đổi việc hai key khác slot.",
          },
        },
      ],
    },
  ],
  cards: [
    { q: "Khoá phân tán Redis lấy và mở thế nào?", a: "Lấy: SET key token NX PX ttl trong một lệnh (có thời hạn nguyên tử). Mở: Lua kiểm tra GET == token rồi mới DEL, để không xoá nhầm khoá người khác đã lấy." },
    { q: "Khoá phân tán có bảo đảm tuyệt đối không?", a: "Không. Tiến trình bị dừng lâu khi khoá hết hạn vẫn có thể chạy cùng người giữ mới. Thao tác cuối nên idempotent hoặc dùng fencing token." },
    { q: "Rate limit bằng Redis có những cách nào?", a: "Fixed window: INCR kèm EXPIRE (rẻ, burst ở ranh giới). Sliding window: Sorted Set (chính xác, tốn bộ nhớ). Token bucket: Lua. Gộp các bước vào Lua để nguyên tử." },
    { q: "MULTI/EXEC có rollback không?", a: "Không. Lệnh lỗi lúc chạy thì chỉ lệnh đó lỗi, các lệnh khác vẫn chạy (đo: DECR, LPUSH sai kiểu, DECR ra 0, WRONGTYPE, -1). WATCH để huỷ khi có người sửa. Cần điều kiện thì dùng Lua." },
    { q: "Pipelining là gì, có nguyên tử không?", a: "Gửi liền N lệnh rồi đọc N kết quả, cả lô tốn khoảng một RTT (đo local: 7.204 SET/giây không pipeline, 552.486 với lô 100). Không nguyên tử, lệnh sau không dùng được kết quả lệnh trước. Cần nguyên tử thì Lua." },
    { q: "noeviction và allkeys-lru khác nhau thế nào?", a: "noeviction từ chối ghi khi đầy (OOM command not allowed). allkeys-lru xoá khoá ít dùng để có chỗ. Cache dùng allkeys-lru, dữ liệu phải giữ thì noeviction." },
    { q: "RDB, AOF, Sentinel, Cluster khác nhau thế nào?", a: "RDB snapshot, AOF ghi từng lệnh (lưu đĩa). Sentinel tự động failover cho một master. Cluster chia 16384 slot trên nhiều node để mở rộng. Replication bất đồng bộ nên failover có thể mất các ghi cuối." },
  ],
  modelAnswer:
    "Khoá phân tán em lấy bằng SET NX PX với token duy nhất trong một lệnh để có thời hạn nguyên tử, và mở bằng Lua kiểm tra token để không xoá nhầm khoá người khác. Em biết nó không tuyệt đối nên thao tác cuối nên idempotent. Rate limit dùng INCR kèm EXPIRE cho fixed window rẻ, hoặc Sorted Set cho cửa sổ trượt chính xác, gộp vào Lua. MULTI không có rollback, cần điều kiện thì dùng Lua hoặc WATCH. Với bộ nhớ, cache dùng allkeys-lru còn dữ liệu cần giữ dùng noeviction. Về mở rộng, replication bất đồng bộ, Sentinel failover, Cluster chia 16384 slot.",
};
