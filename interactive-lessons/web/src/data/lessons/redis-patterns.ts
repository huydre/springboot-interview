import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every command and output below was run against Redis 8.6.2 on a private instance (port 6399): SET NX PX lock with a Lua unlock, INCR and ZSET rate limits, MULTI/WATCH/Lua, and maxmemory 8mb with noeviction vs allkeys-lru on 100000 keys.
export const redisPatterns: Lesson = {
  slug: "redis-patterns",
  crumb: "Redis Patterns",
  videoDir: "/videos/redis-patterns",
  videoVersion: "0",
  scenes: [],
  title: "Redis: khoá phân tán, rate limit, transaction và eviction",
  subtitle:
    "Các mẫu dùng Redis hay bị hỏi: khoá phân tán đúng cách, giới hạn tốc độ, vì sao MULTI không rollback, Lua nguyên tử, và điều gì xảy ra khi Redis hết bộ nhớ.",
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
    "Chặng 3: `MULTI`, `WATCH`, Lua, rồi TTL, eviction và các cách mở rộng.",
  ],
  sections: [
    {
      id: "lock",
      title: "Khoá phân tán: SET NX PX và mở khoá an toàn",
      intro: [
        "Khoá phân tán bảo đảm **chỉ một tiến trình** (trên nhiều server) làm một việc tại một thời điểm. Cách chuẩn: `SET key token NX PX ttl`, trong đó **token** là giá trị duy nhất của người giữ khoá.",
        "Hai điểm sống còn: khoá phải có **thời hạn** (để không treo mãi khi tiến trình chết), và chỉ người giữ khoá mới được **mở**.",
        "Mở khoá an toàn cần \"kiểm tra token rồi xoá\" trong một bước. Lệnh `EVAL` làm được việc đó: nó chạy một đoạn script **Lua** nhỏ ngay trên server Redis như **một lệnh nguyên tử**, không lệnh nào của client khác chen vào giữa.",
      ],
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
    },
    {
      id: "rate-limit",
      title: "Rate limit bằng Redis: INCR và Sorted Set",
      intro: [
        "Nhiều server cần **chung một bộ đếm**, nên đếm trong Redis. Hai cách phổ biến: **fixed window** bằng `INCR` + `EXPIRE`, và **sliding window** bằng Sorted Set.",
      ],
      widgetTitle: "Giới hạn theo người dùng",
      compare: [
        way(
          "INCR kèm EXPIRE (fixed window)",
          `n = INCR rl:u1
if n == 1: EXPIRE rl:u1 60     # đặt thời hạn lần đầu
if n > 5: từ chối`,
          [
            ask("6 yêu cầu liên tiếp", ok("Đã chạy: `INCR` ra `1 2 3 4 5 6`, `TTL` khoảng 60. Chỉ cần 1 khoá cho mỗi người dùng.")),
            ask("Burst ở ranh giới hai cửa sổ", bad("Giống bài LLD: 5 yêu cầu cuối cửa sổ và 5 yêu cầu đầu cửa sổ sau đều qua. Và nếu chết giữa `INCR` và `EXPIRE` thì khoá không hết hạn, nên nên gộp vào một script Lua.")),
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
      title: "MULTI, WATCH và Lua: nguyên tử đến đâu",
      intro: [
        "`MULTI`/`EXEC` chạy một loạt lệnh **liền nhau**, nhưng **không rollback**: lệnh nào lỗi lúc chạy thì chỉ lệnh đó lỗi, các lệnh khác vẫn chạy.",
        "`WATCH` thêm khoá lạc quan: nếu khoá bị người khác sửa trước `EXEC` thì giao dịch bị huỷ. Cần logic điều kiện thì dùng **Lua**.",
        "Cả ba cách bên dưới cùng làm một việc: trừ kho `stock` khi kho chỉ còn 1.",
      ],
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
        "Quy tắc nhớ: lệnh đơn là nguyên tử. Nhiều lệnh cần nguyên tử thì dùng **Lua** (có điều kiện) hoặc `MULTI` (không điều kiện). Script nặng sẽ chặn cả server vì Redis xử lý một luồng.",
      ],
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
    },
    {
      id: "eviction",
      title: "TTL và eviction: khi Redis hết bộ nhớ",
      intro: [
        "Có hai cơ chế dọn dữ liệu: **TTL** (khoá tự hết hạn) và **eviction** (xoá bớt khi chạm `maxmemory`). Chính sách eviction quyết định điều gì xảy ra khi đầy.",
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
      title: "Bảng nhớ: lưu trữ và mở rộng",
      intro: ["Phần này là kiến thức khái niệm hay bị hỏi. Bấm từng dòng để xem câu nên nói."],
      widgetTitle: "Lưu trữ, nhân bản, mở rộng",
      cheat: [
        { name: "RDB và AOF", one: "Hai cách lưu xuống đĩa.", say: "RDB chụp snapshot định kỳ, nhỏ gọn nhưng có thể mất dữ liệu từ lần chụp cuối. AOF ghi từng lệnh, bền hơn tuỳ chế độ fsync nhưng file lớn hơn. Thực tế hay bật cả hai." },
        { name: "Replication", one: "Bản sao đọc từ master.", say: "Replica sao chép bất đồng bộ từ master để scale đọc và dự phòng. Vì bất đồng bộ nên khi master chết, một số ghi gần nhất có thể chưa kịp sang replica." },
        { name: "Sentinel", one: "Tự động failover.", say: "Sentinel giám sát master, và khi master chết thì bầu một replica lên thay, đồng thời báo cho client địa chỉ mới. Dùng khi chỉ có một master." },
        { name: "Cluster", one: "Chia dữ liệu theo slot.", say: "Redis Cluster chia khoá vào 16384 slot rải trên nhiều node để mở rộng dung lượng và ghi. Lệnh nhiều khoá chỉ chạy được nếu các khoá cùng slot, ép bằng hash tag dạng {user:1}." },
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
    },
  ],
  cards: [
    { q: "Khoá phân tán Redis lấy và mở thế nào?", a: "Lấy: SET key token NX PX ttl trong một lệnh (có thời hạn nguyên tử). Mở: Lua kiểm tra GET == token rồi mới DEL, để không xoá nhầm khoá người khác đã lấy." },
    { q: "Khoá phân tán có bảo đảm tuyệt đối không?", a: "Không. Tiến trình bị dừng lâu khi khoá hết hạn vẫn có thể chạy cùng người giữ mới. Thao tác cuối nên idempotent hoặc dùng fencing token." },
    { q: "Rate limit bằng Redis có những cách nào?", a: "Fixed window: INCR kèm EXPIRE (rẻ, burst ở ranh giới). Sliding window: Sorted Set (chính xác, tốn bộ nhớ). Token bucket: Lua. Gộp các bước vào Lua để nguyên tử." },
    { q: "MULTI/EXEC có rollback không?", a: "Không. Lệnh lỗi lúc chạy thì chỉ lệnh đó lỗi, các lệnh khác vẫn chạy (đo: INCR, LPUSH sai kiểu, INCR ra 3). WATCH để huỷ khi có người sửa. Cần điều kiện thì dùng Lua." },
    { q: "noeviction và allkeys-lru khác nhau thế nào?", a: "noeviction từ chối ghi khi đầy (OOM command not allowed). allkeys-lru xoá khoá ít dùng để có chỗ. Cache dùng allkeys-lru, dữ liệu phải giữ thì noeviction." },
    { q: "RDB, AOF, Sentinel, Cluster khác nhau thế nào?", a: "RDB snapshot, AOF ghi từng lệnh (lưu đĩa). Sentinel tự động failover cho một master. Cluster chia 16384 slot trên nhiều node để mở rộng. Replication bất đồng bộ nên failover có thể mất các ghi cuối." },
  ],
  modelAnswer:
    "Khoá phân tán em lấy bằng SET NX PX với token duy nhất trong một lệnh để có thời hạn nguyên tử, và mở bằng Lua kiểm tra token để không xoá nhầm khoá người khác. Em biết nó không tuyệt đối nên thao tác cuối nên idempotent. Rate limit dùng INCR kèm EXPIRE cho fixed window rẻ, hoặc Sorted Set cho cửa sổ trượt chính xác, gộp vào Lua. MULTI không có rollback, cần điều kiện thì dùng Lua hoặc WATCH. Với bộ nhớ, cache dùng allkeys-lru còn dữ liệu cần giữ dùng noeviction. Về mở rộng, replication bất đồng bộ, Sentinel failover, Cluster chia 16384 slot.",
};
