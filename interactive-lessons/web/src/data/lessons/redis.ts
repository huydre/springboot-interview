import timeline from "../timelines/redis.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs from a Spring Boot 3.5 project (Spring Data Redis 3.5) on JDK 21 against Redis 7 via Testcontainers; see study note 03.10.
// Caffeine is described, not measured.
// Evict-vs-commit order: Spring Boot 3.5.16 context with a logging transaction manager and a logging cache (no real DB or Redis).
// --hotkeys and OBJECT FREQ: local Redis 8.6.2 with maxmemory-policy allkeys-lfu.
export const redis: Lesson = {
  slug: "redis",
  crumb: "Redis Cache",
  videoDir: "/videos/redis-cache",
  // Per-scene clips cut by `video-kit/pipeline.py redis-video publish`, which also rewrites videoVersion.
  videoVersion: "69b502da",
  scenes: timeline as Scene[],
  title: "Redis Cache",
  subtitle:
    "Cache-aside, @Cacheable và @CacheEvict, TTL và serialization, self-invocation, invalidation với DB, xoá cache sau commit, penetration, stampede, avalanche, hot key, và Caffeine với Redis.",
  openingQuiz: {
    question: "50 request đồng thời cùng gọi một key chưa có trong cache, method có @Cacheable(sync = true) với RedisCacheManager mặc định của Boot. DB bị load mấy lần?",
    options: ["1", "50", "0", "2"],
    answer: 1,
    explain: "Đã đo: 50. sync = true không chặn được với cache writer mặc định (non-locking). Với Caffeine thì chặn được trong một JVM.",
  },
  roadmap: [
    "Chặng 1: cache-aside, @Cacheable, TTL, key và serialization.",
    "Chặng 2: self-invocation và invalidation với DB.",
    "Chặng 3: penetration, stampede, avalanche, Caffeine với Redis.",
  ],
  sections: [
    {
      id: "cache-aside",
      title: "Phần 1: Cache-aside và @Cacheable",
      scene: "aside",
      intro: [
        "Cache cho dữ liệu **đọc nhiều, ghi ít**: giảm tải DB và latency, đổi lại dữ liệu có thể cũ. Giống ghi số điện thoại hay gọi ra tờ giấy dán cạnh bàn: tra nhanh hơn mở danh bạ, nhưng ai đổi số thì tờ giấy sai cho tới khi bạn sửa.",
        "**Cache-aside**: đọc cache, miss thì đọc DB rồi ghi cache kèm TTL; ghi thì UPDATE DB rồi xoá cache. Phần đọc là `@Cacheable`, phần xoá là `@CacheEvict`. Đừng cache tồn kho realtime hay số dư.",
        "Spring Cache là abstraction chạy bằng proxy như `@Transactional`:",
        "- **`@Cacheable`**: cache có thì trả luôn, không gọi method.",
        "- **`@CacheEvict`**: xoá entry.",
        "- **`@CachePut`**: luôn gọi method rồi ghi cache.",
        "Quên `@EnableCaching` thì annotation im lặng không tác dụng.",
      ],
      board: {
        title: "Cache-aside: đọc cache trước, ghi thì xoá cache",
        highlight: "đọc cache trước",
        chips: ["Đó là việc @Cacheable làm", "Quên @EnableCaching thì annotation không tác dụng"],
        cards: [
          {
            title: "Đọc",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["getProduct(1)", "Đọc cache"],
              ok: ["Hit", "Trả luôn, không gọi DB"],
              bad: ["Miss", "Đọc DB, ghi cache + TTL"],
            },
            notes: ["Gọi 3 lần khi cache trống thì DB chỉ bị đọc 1 lần."],
            code: `@Cacheable("product")
public Product getProduct(long id) {
  return repo.findById(id).orElseThrow();
}`,
            takeaway: "Chỉ lần miss mới tốn một lần đọc DB",
          },
          {
            title: "Ghi",
            diagram: {
              kind: "flow",
              steps: ["UPDATE database", "Xoá cache (@CacheEvict)"],
              ok: ["Lần đọc sau miss", "Nạp lại giá trị mới"],
              bad: ["Quên xoá cache", "Còn dữ liệu cũ"],
            },
            notes: ["Cache cho dữ liệu đọc nhiều, ghi ít; đừng cache tồn kho realtime hay số dư."],
            takeaway: "Ghi DB rồi xoá cache để lần đọc sau nạp lại",
          },
        ],
        conclusion: "**Kết luận:** cache-aside giảm tải DB, đổi lại dữ liệu có thể cũ trong một cửa sổ ngắn.",
      },
      predict: {
        question: "Cache đang trống. Gọi `getProduct(1)` có `@Cacheable` **3 lần** liên tiếp. DB bị đọc mấy lần?",
        options: ["0", "1", "2", "3"],
        answer: 1,
        explain: "Lần đầu miss nên đọc DB rồi ghi cache. Hai lần sau trúng cache, method không chạy.",
      },
      widget: "cache-aside",
      widgetTitle: "Đếm số lần đọc DB",
      after: [
        "Đã chạy với Redis thật: gọi `getProduct(1)` 3 lần chỉ đọc DB 1 lần; `updatePrice(1, 90)` xoá `product::1`; lần đọc sau đọc DB lần 2 ra giá 90.",
      ],
      quiz: {
        question: "Gọi `updatePrice(1, 90)` có `@CacheEvict`, rồi gọi `getProduct(1)`. Chuyện gì xảy ra?",
        options: [
          "Trả giá cũ từ cache",
          "Entry product::1 đã bị xoá, nên đọc DB lần nữa ra giá 90 rồi ghi lại cache",
          "Ném lỗi vì cache rỗng",
          "Redis tự cập nhật giá mới",
        ],
        answer: 1,
        explain: "Đã chạy: sau updatePrice, lần đọc tiếp theo là lần đọc DB thứ 2 và ra giá 90.",
      },
    },
    {
      id: "ttl",
      title: "Phần 2: TTL, key và serialization",
      scene: "ttl",
      intro: [
        "`@Cacheable` chạy được rồi, nhưng cấu hình quyết định nó có an toàn không. Phần này nói về TTL; key và serializer nằm ở phần con ngay bên dưới.",
        "**TTL**. Luôn đặt TTL, đó là lưới an toàn khi quên evict. Đã thử: `RedisCacheManager.create()` mặc định cho `TTL raw::2` = -1, không bao giờ hết hạn; cấu hình riêng cache `product` 10 phút thì `TTL product::1` = 600.",
        "Bẫy TTL: tự khai báo bean `RedisCacheConfiguration` thì Boot không tạo bean mặc định nữa, nên mọi property `spring.cache.redis.*` (kể cả `time-to-live`) bị bỏ qua mà không báo gì.",
      ],
      takeaway: {
        lines: ["Luôn đặt TTL, và tự khai báo bean `RedisCacheConfiguration` thì phải tự đặt TTL trong đó."],
      },
      quiz: {
        question: "Không cấu hình TTL thì entry Redis cache sống bao lâu?",
        options: ["30 phút", "Mãi mãi: TTL = -1", "1 ngày", "Tới khi restart app"],
        answer: 1,
        explain: "Mặc định của Spring Data Redis là không hết hạn.",
      },
      parts: [
        {
          id: "key-serializer",
          title: "Key và serializer",
          intro: [
            "TTL lo chuyện entry sống bao lâu. Hai thứ còn lại quyết định entry có đúng và đọc lại được không: key và serializer.",
            "**Key**. Key có dạng `<cacheName>::<key>` và phải đủ phân biệt kết quả: thiếu `locale` là user tiếng Việt nhận cache tiếng Anh, thiếu `userId` là lộ dữ liệu người khác.",
            "**Serializer**. Mặc định là JDK serialization: `record ProductDto` không implement `Serializable` thì ném `SerializationException: Cannot serialize`. Dùng `GenericJackson2JsonRedisSerializer` (lưu JSON). Giá trị JSON có field `@class` chứa tên class đầy đủ, nên đổi package là cache cũ không đọc được: thêm tiền tố version vào tên cache.",
            "Cache DTO, không cache entity: entity mang proxy lazy và kiểu riêng của Hibernate, serialize ra không sạch hoặc lỗi khi đọc lại.",
          ],
          takeaway: {
            lines: ["Key phải đủ phân biệt kết quả (`locale`, `userId`). Cache DTO bằng serializer JSON, không cache entity."],
          },
          quiz: {
            question: "Cache lưu JSON bằng `GenericJackson2JsonRedisSerializer`. Deploy bản mới đổi package của `ProductDto`. Entry cũ trong Redis còn sống. Chuyện gì xảy ra khi đọc?",
            options: [
              "Đọc bình thường, JSON không phụ thuộc class",
              "Không đọc được vì field `@class` trong JSON trỏ tới tên class cũ; nên thêm tiền tố version vào tên cache",
              "Redis tự xoá entry cũ khi deploy",
              "Spring tự đổi `@class` sang package mới",
            ],
            answer: 1,
            explain: "JSON ghi kèm tên class đầy đủ trong `@class`. Đổi package thì tên đó không còn tồn tại, đọc entry cũ sẽ lỗi cho tới khi hết TTL (suy ra từ cách `@class` hoạt động, bài không chạy lại tình huống này). Tiền tố version trong tên cache làm bản mới dùng key mới.",
          },
        },
      ],
    },
    {
      id: "self-invocation",
      title: "Phần 3: Self-invocation",
      scene: "self",
      intro: [
        "Phần 1 nói Spring Cache chạy bằng proxy. Hệ quả: annotation chỉ có tác dụng khi lời gọi đi qua proxy. Đã đo: `product::1` đang nằm sẵn trong Redis, gọi `getViaThis(1)` (bên trong gọi `this.getProduct(id)`) 2 lần làm số lần đọc DB tăng thêm 2.",
        "Vì sao: bean bạn inject là một **proxy** bọc object thật. Gọi từ bean khác thì đi qua proxy, proxy kiểm tra cache trước. Gọi `this.getProduct()` từ bên trong thì `this` là object thật, không có ai kiểm tra cache.",
        "Sửa sạch nhất: tách method `@Cacheable` sang bean khác.",
        "Một điểm khác: method `@Cacheable` ném exception thì không cache gì. Đã chạy: gọi `getProduct(999)` (không tồn tại, ném lỗi) 2 lần là 2 lần đọc DB.",
      ],
      quiz: {
        question: "Vì sao this.getProduct() không dùng cache?",
        options: ["Vì Redis chậm", "Vì gọi thẳng object thật, không đi qua proxy nên không có ai kiểm tra cache", "Vì key sai", "Vì thiếu TTL"],
        answer: 1,
        explain: "Giống hệt @Transactional.",
      },
      parts: [
        {
          id: "private-method",
          title: "@Cacheable trên method private",
          intro: [
            "Proxy mà Spring tạo mặc định là **CGLIB proxy**: một class con sinh lúc chạy, kế thừa class của bạn và override từng method để chèn thêm việc kiểm tra cache trước khi gọi method thật.",
            "Class con không override được method `private`. Vì vậy `@Cacheable` trên method private không bao giờ chạy, và Spring không báo lỗi gì. Từ Spring 6, method `protected` hay package-private vẫn được cache khi gọi từ bean khác.",
          ],
          quiz: {
            question: "@Cacheable đặt trên method private có chạy không?",
            options: ["Có", "Không: CGLIB không override được method private nên proxy không chặn, và không báo lỗi", "Chỉ với Redis", "Chỉ khi có @EnableCaching"],
            answer: 1,
            explain: "Cùng cơ chế với self-invocation: lời gọi không đi qua phần proxy chèn vào.",
          },
        },
      ],
    },
    {
      id: "invalidation",
      title: "Phần 4: Invalidation và consistency với DB",
      scene: "invalid",
      intro: [
        "Cache và DB không có transaction chung: mục tiêu là thu nhỏ cửa sổ sai lệch và có TTL làm lưới an toàn.",
        "Tình huống: request A ghi giá 100, request B ghi giá 200 ngay sau. DB nhận A rồi B nên DB = 200. Mỗi request ghi DB xong thì SET giá mới vào cache, nhưng lệnh SET cache của B tới Redis trước, SET của A tới sau.",
      ],
      predict: {
        question: "DB = 200. SET cache của B (200) tới Redis trước, SET của A (100) tới sau. Cache giữ giá nào?",
        options: ["200, khớp DB", "100, sai tới hết TTL", "Trống, vì hai lệnh SET huỷ nhau", "Redis báo lỗi xung đột"],
        answer: 1,
        explain: "Redis chỉ giữ lệnh SET tới sau cùng, không biết request nào ghi DB sau. Vì vậy khi ghi nên xoá cache thay vì SET.",
      },
      widget: "cache-write-race",
      widgetTitle: "Thứ tự ghi DB và cache",
      after: [
        "Cache = 100, sai tới hết TTL. Vì vậy **xoá** cache thay vì update cache khi ghi. DEL thì idempotent: xoá mấy lần, theo thứ tự nào cũng như nhau, lần đọc sau nạp 200 từ DB.",
        "**Ghi DB trước, xoá cache sau**. Xoá trước thì một request đọc chen vào giữa (sau khi xoá, trước khi DB ghi xong) sẽ nạp lại giá cũ vào cache.",
        "Ghi DB trước vẫn còn một khe nhỏ: một request đọc đã lấy giá cũ từ DB trước đó, rồi ghi vào cache **sau** lúc bạn xoá. **Delayed double delete** nhắm vào khe này: xoá cache, ghi DB, chờ vài trăm ms rồi xoá cache lần nữa để dọn giá trị cũ bị nạp chen vào. Nó thu nhỏ cửa sổ sai, nhưng vẫn là cách ước lượng (chờ bao lâu là đủ thì không ai chắc), nên TTL vẫn là lưới an toàn.",
        "Xoá cache thất bại thì dữ liệu cũ sống tới hết TTL: retry, phát event, hoặc dùng **CDC** (change data capture: đọc log thay đổi của DB, như binlog của MySQL) để xoá. Không cache dữ liệu cần đúng tuyệt đối mọi lúc.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Ghi DB trước → xoá cache sau (không SET) → lần đọc tiếp nạp giá mới từ DB. TTL là lưới an toàn cho mọi khe còn sót."],
      },
      quiz: {
        question: "Delayed double delete là gì?",
        options: [
          "Xoá DB hai lần",
          "Xoá cache, ghi DB, chờ vài trăm ms rồi xoá cache lần nữa để dọn giá trị cũ bị nạp chen vào",
          "Xoá cache ở hai instance",
          "Đặt hai TTL",
        ],
        answer: 1,
        explain: "Giảm cửa sổ sai nhưng vẫn là heuristic.",
      },
      parts: [
        {
          id: "evict-after-commit",
          title: "@CacheEvict và commit: cái nào chạy trước",
          intro: [
            "Ta đã chốt: ghi DB trước, xoá cache sau. Nhưng \"sau\" phải là sau khi **commit**, không chỉ sau câu `UPDATE`.",
            "Lý do: trước khi commit, mọi transaction khác vẫn đọc ra giá cũ. Nếu cache bị xoá lúc transaction ghi còn mở, một request đọc chen vào sẽ miss, đọc DB ra **giá cũ**, rồi nạp lại vào cache. Commit xong thì cache sai tới hết TTL.",
            "`@CacheEvict` xoá khi method của nó trả về. Câu hỏi là lúc đó transaction đã commit chưa:",
            "- **Method có `@CacheEvict` được gọi bên trong một transaction đang mở**, ví dụ `checkout()` có `@Transactional` gọi `productService.updatePrice()`: lúc `updatePrice()` trả về, transaction ngoài chưa commit, nên xoá chạy **trước** commit.",
            "- **Cùng một method có cả `@Transactional` và `@CacheEvict`**: trong thử nghiệm, xoá chạy sau commit, vì proxy cache bọc bên ngoài proxy transaction. Nhưng cả hai mặc định cùng mức order (`LOWEST_PRECEDENCE`), nên đừng dựa vào thứ tự đó.",
            "Đã chạy với Spring Boot 3.5.16: transaction manager và cache được thay bằng bản ghi log từng bước (không có DB thật), để thấy rõ thứ tự.",
          ],
          predict: {
            question: "`checkout()` có `@Transactional`, bên trong gọi `productService.updatePrice(1)` (bean khác, có `@CacheEvict`), rồi còn làm thêm việc khác. Lệnh xoá cache chạy lúc nào?",
            options: [
              "Sau khi transaction commit",
              "Trước commit, ngay khi `updatePrice()` trả về",
              "Không chạy, vì `updatePrice()` không có `@Transactional`",
              "Lúc transaction bắt đầu",
            ],
            answer: 1,
            explain: "Đã chạy: `BEGIN, UPDATE db, EVICT 1, more work in outer tx, COMMIT`. `@CacheEvict` không biết gì về transaction ngoài, nó xoá ngay khi method của nó xong.",
          },
          widgetTitle: "checkout() gọi updatePrice() có @CacheEvict",
          compare: [
            way(
              "Cache manager thường",
              `@Transactional
public void checkout(long id) {
  productService.updatePrice(id);   // @CacheEvict: xoá khi method này trả về
  // ... việc khác, transaction vẫn mở
}`,
              [
                ask("Thứ tự các bước", bad("Đã chạy: `BEGIN, UPDATE db, EVICT 1, more work in outer tx, COMMIT`. Xoá trước commit.")),
                ask("Một request đọc chen vào giữa EVICT và COMMIT", bad("Miss, đọc DB ra giá cũ (giá mới chưa commit), nạp lại cache. Cache sai tới hết TTL.")),
              ],
              "Xoá chạy khi DB vẫn còn trả giá cũ.",
            ),
            way(
              "Cache manager transaction-aware",
              `@Bean
RedisCacheManager cacheManager(RedisConnectionFactory cf) {
  return RedisCacheManager.builder(cf)
      .transactionAware()     // put và evict hoãn tới sau commit
      .build();
}`,
              [
                ask("Thứ tự các bước", ok("Đã chạy (bọc cache bằng `TransactionAwareCacheManagerProxy`, cùng cơ chế với `transactionAware()`): `BEGIN, UPDATE db, more work in outer tx, COMMIT, EVICT 1`.")),
                ask("Transaction rollback", ok("Lệnh xoá được đăng ký chạy sau commit, nên rollback thì không xoá: cache vẫn khớp với DB.")),
              ],
              "Xoá chỉ chạy khi commit thành công.",
            ),
          ],
          after: [
            "Cách khác, không đụng tới cache manager: phát một event trong transaction rồi xoá cache trong `@TransactionalEventListener(phase = AFTER_COMMIT)`, hoặc tự đăng ký `TransactionSynchronization.afterCommit()`.",
            "`@CacheEvict(beforeInvocation = true)` thì xoá ngay trước khi method chạy, kể cả với cache transaction-aware. Đã chạy: `BEGIN, EVICT-IF-PRESENT 1, UPDATE db, ..., COMMIT`. Đừng dùng nó cho dữ liệu đang ghi trong transaction.",
            "Xoá sau commit vẫn còn khe nhỏ đã nói ở trên: một request đã đọc giá cũ từ trước rồi ghi cache sau lúc xoá. TTL vẫn là lưới an toàn.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Xoá cache trước commit → request đọc chen vào lấy giá cũ từ DB → nạp lại cache → sai tới hết TTL. Hoãn xoá tới **sau commit**: `transactionAware()` hoặc `AFTER_COMMIT`.",
            ],
          },
          quiz: {
            question: "Vì sao xoá cache trước khi transaction commit vẫn có thể để lại giá cũ trong cache?",
            options: [
              "Vì Redis xoá chậm",
              "Vì trước commit DB vẫn trả giá cũ; request đọc chen vào sau lúc xoá sẽ nạp giá cũ đó vào cache",
              "Vì `@CacheEvict` không xoá được key",
              "Vì TTL bị reset",
            ],
            answer: 1,
            explain: "Giá mới chỉ thấy được sau commit. Xoá trước commit tạo đúng khe hở cho một lần nạp lại giá cũ.",
          },
        },
      ],
    },
    {
      id: "incidents",
      title: "Phần 5: Penetration, stampede, avalanche",
      scene: "incidents",
      intro: [
        "Cache đúng rồi vẫn có thể sập theo ba kiểu, mỗi kiểu một nguyên nhân và một cách chặn:",
        "- **Penetration**. Nguyên nhân: liên tục query key không tồn tại (id bịa), cache không bao giờ có nên mọi request đâm DB. Cách chặn: cache cả giá trị rỗng với TTL ngắn; validate input; hoặc **Bloom filter** (cấu trúc dữ liệu nhỏ trả lời nhanh \"chắc chắn không có\" hoặc \"có thể có\"), để loại id không tồn tại trước khi tới DB.",
        "- **Stampede**. Nguyên nhân: một key rất nóng hết hạn, hàng nghìn request cùng miss và cùng load DB. Cách chặn: **single-flight** (chỉ một request load, các request khác chờ dùng chung kết quả của nó), hoặc refresh key trước khi hết hạn.",
        "- **Avalanche**. Nguyên nhân: nhiều key hết hạn cùng lúc, hoặc Redis sập. Cách chặn: TTL cộng **jitter** (một khoảng ngẫu nhiên) để các key không hết hạn cùng lúc; Redis có replica; **circuit breaker** (ngắt tạm lời gọi tới hệ thống đang lỗi để không dồn thêm tải).",
        "Redis sập thì `@Cacheable` ném exception lên request. `CacheErrorHandler` cho phép bỏ qua lỗi cache, nhưng khi đó hết tải dồn vào DB.",
        "Chống stampede trong Spring, nhiều người nghĩ ngay tới `@Cacheable(sync = true)`. Thử với 50 thread cùng miss một key, loader chậm 200 ms.",
      ],
      predict: {
        question: "50 thread cùng miss một key. Dùng `@Cacheable(sync = true)` với RedisCacheManager mặc định của Boot. Loader chạy mấy lần?",
        options: ["1 lần, sync = true khoá lại", "50 lần, writer mặc định không khoá", "2 lần", "0 lần, Redis tự nạp"],
        answer: 1,
        explain: "Cache writer mặc định của Boot là non-locking, nên `sync = true` không chặn được giữa các thread. Phải dùng `lockingRedisCacheWriter`.",
      },
      widget: "cache-stampede",
      widgetTitle: "50 request cùng miss một key",
      after: [
        "Đã đo 50 thread cùng miss một key, loader chậm 200 ms: `@Cacheable` thường 50 lần load; `sync = true` với RedisCacheManager mặc định vẫn 50; `lockingRedisCacheWriter` còn 1 lần load nhưng tổng 3090 ms. Lâu như vậy vì các thread không giữ khoá phải ngủ rồi kiểm tra lại khoá, lần lượt từng thread: đổi tải DB lấy độ trễ.",
        "Bật writer có khoá bằng cách tự dựng `RedisCacheManager` từ `RedisCacheWriter.lockingRedisCacheWriter(connectionFactory)`: `RedisCacheManager.builder(RedisCacheWriter.lockingRedisCacheWriter(connectionFactory)).cacheDefaults(config).build()` (các phương thức này có trong spring-data-redis 3.5.13, đã kiểm tra chữ ký bằng `javap`; đoạn cấu hình này chưa chạy lại trong bài). Chọn nó thì phải chấp nhận độ trễ ở trên; lựa chọn khác là single-flight trong code ứng dụng.",
      ],
      quiz: {
        question: "Cache giá trị rỗng để chống penetration có hại gì?",
        options: [
          "Không hại gì",
          "Bản ghi được tạo sau đó vẫn hiện \"không tồn tại\" tới hết TTL, và bot gửi id ngẫu nhiên làm đầy Redis key rác",
          "Làm Redis chậm",
          "Không lưu được null",
        ],
        answer: 1,
        explain: "TTL ngắn, evict khi tạo mới, kết hợp Bloom filter hoặc rate limit.",
      },
      parts: [
        {
          id: "hot-key",
          title: "Hot key: cache trúng gần 100% mà Redis vẫn nghẽn",
          intro: [
            "Ba sự cố trên đều bắt đầu từ cache **miss**. Hot key thì ngược lại: cache trúng gần như mọi lần, nhưng Redis vẫn chậm.",
            "Tình huống: flash sale, mọi user cùng mở `product:42`. Một key luôn nằm trên **một** node Redis (với Cluster: một slot, thuộc một node), nên thêm node không chia được tải của riêng key đó. Value lớn còn tệ hơn: 500 KB × 10.000 lượt đọc mỗi giây là 5 GB/s, vượt xa card mạng 10 Gbit (khoảng 1,25 GB/s) của node đó, trong khi CPU vẫn rảnh.",
            "Tìm hot key:",
            "- **`redis-cli --hotkeys`**: cần `maxmemory-policy` kiểu LFU (`allkeys-lfu` hoặc `volatile-lfu`), vì nó dựa vào bộ đếm tần suất của LFU.",
            "- **`OBJECT FREQ key`**: xem bộ đếm của một key.",
            "- **Đếm phía client**: ghi metric theo key ở tầng app.",
            "Đã chạy trên Redis 8.6.2 local với `allkeys-lfu`: 200 key, `GET product:42` 5.000 lần, `GET product:7` 50 lần. `--hotkeys` báo `product:42` counter `33`, `product:7` counter `8`, các key chỉ được `SET` một lần counter `5`. Bộ đếm LFU tăng theo kiểu logarit, không phải số lượt đọc.",
            "Cách chữa:",
            "- **Cache L1 trong app**: Caffeine TTL vài giây cho đúng các key nóng; phần lớn lượt đọc không còn ra tới Redis.",
            "- **Nhân bản key**: ghi `product:42#0` tới `product:42#9`, mỗi lần đọc chọn ngẫu nhiên một bản; các bản rơi vào slot khác nhau. Đổi lại, ghi phải cập nhật hoặc xoá cả 10.",
            "- **Đọc từ replica**: chia tải đọc, chấp nhận dữ liệu trễ một chút.",
            "- **Thu nhỏ value**: chỉ cache các field cần hiển thị.",
          ],
          trap: {
            title: "Nhầm hot key với stampede",
            text: "Stampede là một key nóng **hết hạn** và nhiều request cùng miss; chữa bằng single-flight. Hot key là cache vẫn trúng nhưng một node gánh hết; single-flight không giúp gì, phải chia tải đọc ra (L1, nhân bản key, replica).",
          },
          takeaway: {
            lines: [
              "Một key chỉ nằm trên một node. Key quá nóng thì chia tải đọc ra: L1 trong app, nhân bản key, hoặc đọc replica.",
            ],
          },
          quiz: {
            question: "Redis Cluster 6 node, hit ratio 99%, nhưng một node CPU và mạng luôn đầy còn 5 node kia rảnh. Thêm node thứ 7 có giúp không?",
            options: [
              "Có, tải tự chia đều",
              "Không: tải dồn vào một key (hot key) và key đó vẫn nằm trên một node; phải dùng L1 cache hoặc nhân bản key",
              "Có, nếu tăng TTL",
              "Không, phải xoá key đó",
            ],
            answer: 1,
            explain: "Cluster chia tải theo slot, không chia được tải của một key. Thêm node chỉ chuyển slot khác đi, key nóng vẫn ở nguyên một chỗ.",
          },
        },
      ],
    },
    {
      id: "local-vs-redis",
      title: "Phần 6: Caffeine với Redis",
      scene: "local",
      intro: [
        "Cache không nhất thiết phải là Redis. Hai lựa chọn:",
        "- **Caffeine** (trong heap): nhanh nhất, không mạng, không serialize, nhưng mỗi instance một bản, evict ở A không xoá B, mất khi restart, ăn heap.",
        "- **Redis**: dùng chung, evict một lần là xong, scale riêng, có network round-trip.",
        "Mô hình 2 tầng L1 Caffeine TTL ngắn, L2 Redis cho hệ thống tải lớn; invalidation L1 qua Redis pub/sub (kênh publish/subscribe: một instance phát thông báo \"key này đã đổi\", các instance khác đang đăng ký nhận và xoá bản L1 của mình).",
        "Hai bẫy:",
        "- **Local cache cho dữ liệu hay đổi khi chạy nhiều instance**: user lúc thấy giá cũ lúc thấy giá mới.",
        "- **Caffeine không giới hạn `maximumSize`**: đầy heap.",
      ],
      quiz: {
        question: "Dữ liệu nào hợp Caffeine local hơn Redis?",
        options: ["Session đăng nhập", "Cấu hình và danh mục gần như bất biến", "Rate limit theo user", "Distributed lock"],
        answer: 1,
        explain: "Các lựa chọn còn lại cần chia sẻ giữa instance.",
      },
    },
  ],
  modelAnswer:
    "Em dùng cache-aside qua @Cacheable cho dữ liệu đọc nhiều ghi ít, cache DTO chứ không cache entity, serializer JSON, và luôn đặt TTL vì em đã thấy mặc định là không hết hạn. Khi ghi em update DB trước rồi xoá cache bằng @CacheEvict, vì xoá idempotent còn set cache có thể lệch thứ tự. @Cacheable chạy bằng proxy nên gọi this.method() là bỏ qua cache, em đã đo số lần đọc DB tăng dù key đang có. Ba sự cố: penetration em cache giá trị rỗng TTL ngắn hoặc Bloom filter; stampede em làm single-flight, và em biết sync = true với RedisCacheManager mặc định không chặn được, em đo 50 request vẫn 50 lần load; avalanche em thêm jitter vào TTL. Dữ liệu gần như bất biến em có thể dùng Caffeine, dữ liệu dùng chung giữa nhiều instance thì Redis.",
};
