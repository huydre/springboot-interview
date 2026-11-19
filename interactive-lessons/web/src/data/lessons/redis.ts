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
        "Cache cho dữ liệu **đọc nhiều, ghi ít**: giảm tải DB và latency, đổi lại dữ liệu có thể cũ. **Cache-aside**: đọc cache, miss thì đọc DB rồi ghi cache kèm TTL; ghi thì UPDATE DB rồi xoá cache. Đó là cái `@Cacheable` làm. Đừng cache tồn kho realtime hay số dư.",
        "Spring Cache là abstraction chạy bằng proxy như `@Transactional`: `@Cacheable` có thì trả luôn, `@CacheEvict` xoá entry, `@CachePut` luôn gọi method rồi ghi cache. Đã chạy với Redis thật: gọi `getProduct(1)` 3 lần chỉ đọc DB 1 lần; `updatePrice(1, 90)` xoá `product::1`; lần đọc sau đọc DB lần 2 ra giá 90. Quên `@EnableCaching` thì annotation im lặng không tác dụng.",
      ],
      widget: "cache-aside",
      widgetTitle: "Đếm số lần đọc DB",
      quiz: {
        question: "@Cacheable đặt trên method private có chạy không?",
        options: ["Có", "Không: CGLIB không override được method private nên proxy không chặn, và không báo lỗi", "Chỉ với Redis", "Chỉ khi có @EnableCaching"],
        answer: 1,
        explain: "Cùng cơ chế với self-invocation. Từ Spring 6, method protected hay package-private vẫn được cache khi gọi từ bean khác; private thì không bao giờ.",
      },
    },
    {
      id: "ttl",
      title: "Phần 2: TTL, key và serialization",
      scene: "ttl",
      intro: [
        "**Luôn đặt TTL**, đó là lưới an toàn khi quên evict. Đã thử: `RedisCacheManager.create()` mặc định cho `TTL raw::2` = -1, không bao giờ hết hạn; cấu hình riêng cache `product` 10 phút thì `TTL product::1` = 600. Tự khai báo bean `RedisCacheConfiguration` thì property `spring.cache.redis.*` bị bỏ qua.",
        "Key dạng `<cacheName>::<key>`; phải đủ phân biệt kết quả (thiếu `locale` là user tiếng Việt nhận cache tiếng Anh, thiếu `userId` là lộ dữ liệu người khác). Serializer mặc định là JDK: `record ProductDto` không `Serializable` ném `SerializationException: Cannot serialize`. Dùng `GenericJackson2JsonRedisSerializer`, giá trị có `@class` nên đổi package là cache cũ không đọc được: thêm tiền tố version. Cache DTO, không cache entity.",
      ],
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
        "Annotation chỉ có tác dụng khi lời gọi đi qua proxy. Đã đo: `product::1` đang nằm sẵn trong Redis, gọi `getViaThis(1)` (bên trong gọi `this.getProduct(id)`) 2 lần làm số lần đọc DB tăng thêm 2.",
        "Sửa sạch nhất: tách method `@Cacheable` sang bean khác. Một bẫy khác khi thử: đọc field public `service.dbLoads` từ test ra `NullPointerException` vì `service` là proxy CGLIB; truy cập qua method. Method `@Cacheable` ném exception thì không cache gì: gọi `getProduct(999)` 2 lần là 2 lần đọc DB.",
      ],
      quiz: {
        question: "Vì sao this.getProduct() không dùng cache?",
        options: ["Vì Redis chậm", "Vì gọi thẳng object thật, không đi qua proxy nên không có ai kiểm tra cache", "Vì key sai", "Vì thiếu TTL"],
        answer: 1,
        explain: "Giống hệt @Transactional.",
      },
    },
    {
      id: "invalidation",
      title: "Phần 4: Invalidation và consistency với DB",
      scene: "invalid",
      intro: [
        "Cache và DB không có transaction chung: mục tiêu là thu nhỏ cửa sổ sai lệch và có TTL làm lưới an toàn. **Xoá** cache thay vì update cache khi ghi: hai request ghi đồng thời SET lệch thứ tự để lại giá trị cũ, còn DEL thì idempotent.",
        "**Ghi DB trước, xoá cache sau**: xoá trước thì request đọc chen giữa nạp lại giá cũ. Xoá cache thất bại thì dữ liệu cũ sống tới hết TTL: retry, phát event, hoặc đọc binlog (CDC) để xoá. Không cache dữ liệu cần đúng tuyệt đối mọi lúc.",
      ],
      widget: "cache-write-race",
      widgetTitle: "Thứ tự ghi DB và cache",
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
        "**Penetration**: query key không tồn tại liên tục, mọi request đâm DB; cache giá trị rỗng TTL ngắn, Bloom filter, validate input. **Stampede**: một key rất nóng hết hạn, hàng nghìn request cùng load DB; single-flight hoặc refresh trước khi hết hạn. **Avalanche**: nhiều key hết hạn cùng lúc hoặc Redis sập; TTL cộng **jitter** ngẫu nhiên, replica, circuit breaker.",
        "Đã đo 50 thread, loader chậm 200 ms: `@Cacheable` thường 50 lần load; `sync = true` với RedisCacheManager mặc định vẫn 50; `lockingRedisCacheWriter` còn 1 nhưng tổng 3090 ms. Redis sập thì `@Cacheable` ném exception lên request; `CacheErrorHandler` bỏ qua cache được nhưng dồn hết tải vào DB.",
      ],
      widget: "cache-stampede",
      widgetTitle: "50 request cùng miss một key",
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
        "**Caffeine** (trong heap): nhanh nhất, không mạng, không serialize, nhưng mỗi instance một bản, evict ở A không xoá B, mất khi restart, ăn heap. **Redis**: dùng chung, evict một lần là xong, scale riêng, có network round-trip.",
        "Mô hình 2 tầng L1 Caffeine TTL ngắn, L2 Redis cho hệ thống tải lớn; invalidation L1 qua Redis pub/sub. Bẫy: local cache cho dữ liệu hay đổi khi chạy nhiều instance thì user lúc thấy giá cũ lúc thấy giá mới; Caffeine không giới hạn `maximumSize` thì đầy heap.",
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
