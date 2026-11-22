import timeline from "../timelines/redis.json";
import type { Lesson, Scene } from "../types";

// Outputs from a Spring Boot 3.5 project (Spring Data Redis 3.5) on JDK 21 against Redis 7 via Testcontainers; see study note 03.10.
// Caffeine is described, not measured.
export const redis: Lesson = {
  slug: "redis",
  crumb: "Redis Cache",
  videoDir: "/videos/redis-cache",
  // Per-scene clips cut by `video-kit/pipeline.py redis-video publish`, which also rewrites videoVersion.
  videoVersion: "69b502da",
  scenes: timeline as Scene[],
  title: "Redis Cache",
  subtitle:
    "Cache-aside, @Cacheable và @CacheEvict, TTL và serialization, self-invocation, invalidation với DB, penetration, stampede, avalanche, và Caffeine với Redis.",
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
        "**Cache-aside**: đọc cache, miss thì đọc DB rồi ghi cache kèm TTL; ghi thì UPDATE DB rồi xoá cache. Đó là cái `@Cacheable` làm. Đừng cache tồn kho realtime hay số dư.",
        "Spring Cache là abstraction chạy bằng proxy như `@Transactional`:",
        "- **`@Cacheable`**: cache có thì trả luôn, không gọi method.",
        "- **`@CacheEvict`**: xoá entry.",
        "- **`@CachePut`**: luôn gọi method rồi ghi cache.",
        "Quên `@EnableCaching` thì annotation im lặng không tác dụng.",
      ],
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
        "`@Cacheable` chạy được rồi, nhưng ba cấu hình quyết định nó có an toàn không: TTL, key và serializer.",
        "**TTL**. Luôn đặt TTL, đó là lưới an toàn khi quên evict. Đã thử: `RedisCacheManager.create()` mặc định cho `TTL raw::2` = -1, không bao giờ hết hạn; cấu hình riêng cache `product` 10 phút thì `TTL product::1` = 600.",
        "Bẫy TTL: tự khai báo bean `RedisCacheConfiguration` thì Boot không tạo bean mặc định nữa, nên mọi property `spring.cache.redis.*` (kể cả `time-to-live`) bị bỏ qua mà không báo gì.",
        "**Key**. Key có dạng `<cacheName>::<key>` và phải đủ phân biệt kết quả: thiếu `locale` là user tiếng Việt nhận cache tiếng Anh, thiếu `userId` là lộ dữ liệu người khác.",
        "**Serializer**. Mặc định là JDK serialization: `record ProductDto` không implement `Serializable` thì ném `SerializationException: Cannot serialize`. Dùng `GenericJackson2JsonRedisSerializer` (lưu JSON). Giá trị JSON có field `@class` chứa tên class đầy đủ, nên đổi package là cache cũ không đọc được: thêm tiền tố version vào tên cache.",
        "Cache DTO, không cache entity: entity mang proxy lazy và kiểu riêng của Hibernate, serialize ra không sạch hoặc lỗi khi đọc lại.",
      ],
      takeaway: {
        lines: ["Key phải đủ phân biệt kết quả (`locale`, `userId`). Cache DTO bằng serializer JSON, không cache entity."],
      },
      quiz: {
        question: "Không cấu hình TTL thì entry Redis cache sống bao lâu?",
        options: ["30 phút", "Mãi mãi: TTL = -1", "1 ngày", "Tới khi restart app"],
        answer: 1,
        explain: "Mặc định của Spring Data Redis là không hết hạn.",
      },
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
    },
    {
      id: "local-vs-redis",
      title: "Phần 6: Caffeine với Redis",
      scene: "local",
      intro: [
        "Cache không nhất thiết phải là Redis. Hai lựa chọn:",
        "- **Caffeine** (trong heap): nhanh nhất, không mạng, không serialize, nhưng mỗi instance một bản, evict ở A không xoá B, mất khi restart, ăn heap.",
        "- **Redis**: dùng chung, evict một lần là xong, scale riêng, có network round-trip.",
        "Mô hình 2 tầng L1 Caffeine TTL ngắn, L2 Redis cho hệ thống tải lớn; invalidation L1 qua Redis pub/sub.",
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
