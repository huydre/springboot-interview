"""Redis Cache explainer: scene layouts and per-beat narration + motion.

Outputs from a Spring Boot 3.5 project (Spring Data Redis 3.5) on JDK 21 against Redis 7 via Testcontainers, study note 03.10:
getProduct(1) x3 -> 1 DB load; updatePrice(1, 90) empties product::1; next read loads again (2 loads, price 90.00);
TTL product::1 = 600, RedisCacheManager.create() default TTL raw::2 = -1; record without Serializable -> SerializationException: Cannot serialize;
getViaThis(1) twice -> DB loads +2 although product::1 is cached; getProduct(999) twice -> 2 DB loads, no key product::999;
50 threads on a missing key with a 200 ms loader: plain @Cacheable 50 loads, @Cacheable(sync = true) on the default RedisCacheManager 50,
cache.get(key, loader) non-locking 50 (1040 ms), lockingRedisCacheWriter 1 (3090 ms).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("50 request cùng miss một key: load DB mấy lần?"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["@Cacheable thường  → 50 lần load", "@Cacheable(sync = true) với Redis mặc định  → vẫn 50", "lockingRedisCacheWriter  → 1 lần"]),
        tile("hk-tile", 330, 350, 220, "box"),
        el("hk-word", 600, 380, 1300, None, letters("Redis Cache"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "cache-aside · TTL · invalidation · stampede", "kin-sub r"),
    ]), beats=[
        ("Năm mươi request cùng đến một key chưa có trong cache. Database bị đọc mấy lần?",
         "50 request cùng miss một key chưa có trong cache. Database bị đọc mấy lần?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Đo thật: cache thường đọc năm mươi lần. Và bất ngờ là sync bằng true với Redis mặc định cũng vẫn năm mươi lần.",
         "Đo thật: cache thường 50 lần; sync = true với Redis mặc định vẫn 50 lần.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.5, 0.3), IN("#hk-con-2", "type1", 2.6, 0.3), IN("#hk-con-3", "type1", 6.0, 0.3)]),
        ("Hôm nay ta học cache với Redis.", "Hôm nay: Redis Cache.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ cache-aside
    dict(id="aside", world=(1920, 1080), hud=hud("as", "Cache-aside", "@Cacheable, @CacheEvict, @CachePut"), cam="".join([
        big_title("as", "Cache-aside", "Đọc cache, miss thì đọc DB rồi ghi cache"),
        gnode("as-s", 160, 200, 400, 100, "ProductService", "cyan"), gnode("as-r", 760, 200, 400, 100, "Redis", "violet"), gnode("as-d", 1360, 200, 400, 100, "Database", "amber"),
        console("as-con", 160, 350, 1600, ["getProduct(1) lần 1 · miss → đọc DB (1) · SET product::1 kèm TTL", "getProduct(1) lần 2, 3 · hit → DB vẫn 1 lần",
                                          "updatePrice(1, 90) → UPDATE DB rồi @CacheEvict: product::1 rỗng", "getProduct(1) · miss → đọc DB lần 2 · giá mới 90.00"]),
        chip("as-c1", 160, 640, "@Cacheable: có thì trả luôn · @CacheEvict: xoá · @CachePut: luôn gọi method rồi ghi cache", "violet"),
        chip("as-c2", 160, 720, "Quên @EnableCaching: annotation im lặng không tác dụng", "red"),
        chip("as-c3", 160, 800, "Cache dữ liệu đọc nhiều, ghi ít · đừng cache tồn kho realtime, số dư", "amber"),
        wires(trace("as-a", [(560, 250), (752, 250)], "cyan"), trace("as-b", [(1160, 250), (1352, 250)], "violet")),
    ]), beats=[
        ("Phần một: cache aside. Cache giúp giảm tải database, đổi lại dữ liệu có thể cũ. Cách phổ biến nhất: đọc cache trước, miss thì đọc database rồi ghi lại vào cache kèm thời gian sống.",
         "Phần 1: cache-aside: đọc cache, miss thì đọc DB rồi ghi cache kèm TTL.",
         [TYPE("#as-big", 0.1, 0.06), IN("#as-bsub", "blur", 0.8), OUT("#as-big, #as-bsub", "zoom", 3.6), IN("#as-hud", "left", 4.2),
          IN("#as-s", "pop", 4.6), DRAW("#as-a-p", 5.4, 0.4), IN("#as-r", "pop", 5.8), DRAW("#as-b-p", 7.2, 0.4), IN("#as-d", "pop", 7.6)]),
        ("Đã chạy với Redis thật: gọi getProduct ba lần chỉ đọc database một lần. Cập nhật giá thì xóa key khỏi cache, lần đọc sau đọc database lần hai, ra giá mới chín mươi.",
         "getProduct 3 lần chỉ đọc DB 1 lần. updatePrice xoá key, lần đọc sau đọc DB lần 2, ra giá 90.",
         [IN("#as-con", "up", 0.3, 0.4), IN("#as-con-1", "type1", 0.7, 0.3), IN("#as-con-2", "type1", 3.4, 0.3), IN("#as-con-3", "type1", 5.8, 0.3), IN("#as-con-4", "type1", 8.2, 0.3)]),
        ("Cacheable có thì trả luôn, cache evict xóa, cache put luôn gọi method rồi ghi cache. Quên enable caching thì annotation im lặng, không có tác dụng.",
         "@Cacheable, @CacheEvict, @CachePut. Quên @EnableCaching thì không tác dụng.",
         [IN("#as-c1", "left", 0.4), IN("#as-c2", "left", 6.4)]),
        ("Chỉ cache dữ liệu đọc nhiều mà ghi ít. Đừng cache tồn kho thời gian thực hay số dư.",
         "Cache dữ liệu đọc nhiều ghi ít, không cache tồn kho, số dư.", [IN("#as-c3", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ TTL, key, serialization
    dict(id="ttl", world=(1920, 1080), hud=hud("tl", "TTL, key và serialization", "Luôn đặt TTL"), cam="".join([
        box("tl-r1", 160, 190, 1600, 80, "<b>RedisCacheManager.create() mặc định · TTL raw::2 = -1 · không bao giờ hết hạn</b>", "red", "card"),
        box("tl-r2", 160, 290, 1600, 80, "<b>cache product cấu hình 10 phút · TTL product::1 = 600</b>", "green", "card"),
        chip("tl-k1", 160, 410, "Key = tên cache::key · thiếu locale hoặc userId: sai ngôn ngữ, lộ dữ liệu người khác", "amber"),
        console("tl-se", 160, 490, 1600, ["record ProductDto không Serializable → SerializationException: Cannot serialize"]),
        box("tl-js", 160, 600, 1600, 150, code("{\"@class\":\"demo.ProductDto\",\"id\":1,\"name\":\"Keyboard\",\n \"price\":[\"java.math.BigDecimal\",100.00]}"), "cyan", "code"),
        chip("tl-w1", 160, 790, "Đổi package hoặc class: cache cũ không đọc được → thêm tiền tố version", "red"),
        chip("tl-w2", 160, 870, "Cache DTO, không cache entity · tự khai báo bean RedisCacheConfiguration thì spring.cache.redis.* bị bỏ qua", "violet"),
    ]), beats=[
        ("Phần hai: TTL, key và serialization. Luôn đặt TTL, đó là lưới an toàn khi quên xóa cache. Tạo cache manager mặc định thì TTL là trừ một: không bao giờ hết hạn.",
         "Phần 2: luôn đặt TTL. Mặc định TTL = -1: không bao giờ hết hạn.",
         [IN("#tl-hud", "left", 0.1), IN("#tl-r1", "left", 0.5, 0.7)]),
        ("Cấu hình riêng cho cache product mười phút thì TTL đo được là sáu trăm giây.",
         "Cache product 10 phút: TTL = 600 giây.", [IN("#tl-r2", "left", 0.4)]),
        ("Key có dạng tên cache, hai dấu hai chấm, rồi key. Key phải đủ phân biệt kết quả: thiếu locale là người dùng tiếng Việt nhận cache tiếng Anh, thiếu user id là lộ dữ liệu người khác.",
         "Key = tên cache::key. Thiếu locale hoặc userId: sai ngôn ngữ, lộ dữ liệu người khác.",
         [IN("#tl-k1", "left", 0.4)]),
        ("Serializer mặc định của jdk đòi class phải serializable, record thường không có nên báo lỗi. Dùng serializer json, giá trị đọc được bằng mắt, và có field class để biết kiểu.",
         "Serializer JDK đòi Serializable nên lỗi. Dùng JSON, giá trị đọc được, có @class.",
         [IN("#tl-se", "up", 0.3, 0.4), IN("#tl-se-1", "type1", 0.7, 0.3), IN("#tl-js", "up", 4.0)]),
        ("Vì có field class nên đổi package là cache cũ không đọc được, hãy thêm tiền tố version. Và cache D T O, không cache entity.",
         "Đổi package thì cache cũ không đọc được: thêm tiền tố version. Cache DTO, không cache entity.",
         [IN("#tl-w1", "left", 0.4), IN("#tl-w2", "left", 4.4)]),
    ]),
    # ------------------------------------------------------------ self-invocation
    dict(id="self", world=(1920, 1080), hud=hud("sf", "Self-invocation", "Cache bị bỏ qua"), cam="".join([
        console("sf-con", 160, 190, 1600, ["product::1 đang nằm sẵn trong Redis", "getViaThis(1) × 2 → số lần đọc DB tăng thêm 2", "getProduct(999) × 2 → 2 lần đọc DB · Redis không có key product::999"]),
        box("sf-code", 160, 420, 1000, 120, code("public ProductDto getViaThis(Long id) {\n    return this.getProduct(id);   // không qua proxy\n}"), "red", "code"),
        chip("sf-c1", 160, 590, "Annotation chỉ có tác dụng khi lời gọi đi qua proxy: cùng cơ chế @Transactional", "violet"),
        chip("sf-c2", 160, 670, "Sửa sạch nhất: tách method @Cacheable sang bean khác", "green"),
        chip("sf-c3", 160, 750, "Đọc field public của bean proxy → NullPointerException: truy cập qua method", "amber"),
        chip("sf-c4", 160, 830, "Method @Cacheable ném exception thì không cache gì: id không tồn tại đâm DB mỗi lần", "red"),
    ]), beats=[
        ("Phần ba: self invocation. Key đã nằm sẵn trong Redis, nhưng gọi hàm get qua chính nó hai lần làm số lần đọc database tăng thêm hai. Cache bị bỏ qua hoàn toàn.",
         "Phần 3: key đã có sẵn trong Redis, nhưng gọi this.getProduct() 2 lần: DB bị đọc thêm 2 lần.",
         [IN("#sf-hud", "left", 0.1), IN("#sf-con", "up", 0.5, 0.4), IN("#sf-con-1", "type1", 0.9, 0.3), IN("#sf-con-2", "type1", 2.4, 0.3), IN("#sf-code", "up", 5.8)]),
        ("Vì lời gọi chính nó không đi qua proxy, giống hệt transactional. Sửa sạch nhất là tách method cacheable sang một bin khác.",
         "Lời gọi this không qua proxy, giống @Transactional. Tách method @Cacheable sang bean khác.",
         [IN("#sf-c1", "left", 0.4), IN("#sf-c2", "left", 5.4)]),
        ("Một bẫy khác: đọc field public của bean đã có proxy ra null pointer, hãy truy cập qua method. Và method cacheable ném exception thì không cache gì, id không tồn tại sẽ đâm vào database mỗi lần.",
         "Field public của proxy → NPE. Method ném exception không cache gì: id không tồn tại đâm DB mỗi lần.",
         [IN("#sf-c3", "left", 0.4), IN("#sf-c4", "left", 5.6), IN("#sf-con-3", "type1", 6.0, 0.3)]),
    ]),
    # ------------------------------------------------------------ invalidation
    dict(id="invalid", world=(1920, 1080), hud=hud("iv", "Invalidation", "Hai hệ thống, không chung transaction"), cam="".join([
        box("iv-b1", 160, 190, 1600, 80, "<b>ghi DB rồi SET cache · A, B lệch thứ tự → DB = 200, cache = 100</b>", "red", "card"),
        box("iv-g1", 160, 290, 1600, 80, "<b>ghi DB rồi DEL cache · idempotent, lần đọc sau load 200 từ DB</b>", "green", "card"),
        box("iv-b2", 160, 390, 1600, 80, "<b>DEL cache rồi mới ghi DB · request đọc chen vào nạp lại giá cũ</b>", "red", "card"),
        chip("iv-c1", 160, 510, "@CacheEvict mặc định chạy sau khi method xong: ghi DB trước, xoá cache sau", "green"),
        chip("iv-c2", 160, 590, "Xoá cache thất bại: dữ liệu cũ sống tới hết TTL → retry, phát event, đọc binlog (CDC)", "amber"),
        chip("iv-c3", 160, 670, "Delayed double delete: giảm cửa sổ sai, nhưng TTL vẫn là lưới an toàn", "violet"),
        chip("iv-c4", 160, 750, "Số dư, tồn kho cần đúng tuyệt đối mọi lúc: đừng cache", "red"),
    ]), beats=[
        ("Phần bốn: invalidation. Cache và database là hai hệ thống, không chung transaction. Khi ghi, hãy xóa cache chứ đừng set cache. Hai request ghi cùng lúc mà set lệch thứ tự thì database là hai trăm, cache là một trăm.",
         "Phần 4: khi ghi, xoá cache chứ đừng SET: hai request ghi lệch thứ tự → DB 200, cache 100.",
         [IN("#iv-hud", "left", 0.1), IN("#iv-b1", "left", 5.4, 0.7)]),
        ("Còn xóa thì idempotent, thứ tự không quan trọng, lần đọc sau tự nạp giá mới nhất.",
         "DEL idempotent, thứ tự không quan trọng, lần đọc sau nạp giá mới nhất.", [IN("#iv-g1", "left", 0.4)]),
        ("Thứ tự đúng là ghi database trước, xóa cache sau. Xóa cache trước thì một request đọc chen vào sẽ nạp lại giá cũ.",
         "Ghi DB trước, xoá cache sau. Xoá trước thì request đọc chen vào nạp lại giá cũ.",
         [IN("#iv-b2", "left", 4.6), IN("#iv-c1", "left", 7.2)]),
        ("Xóa cache thất bại thì dữ liệu cũ sống tới hết T T L, nên cần retry hoặc phát event. Delayed double delete giảm được cửa sổ sai, nhưng T T L vẫn là lưới an toàn.",
         "Xoá thất bại: cũ tới hết TTL → retry, event. Delayed double delete giảm cửa sổ sai; TTL là lưới an toàn.",
         [IN("#iv-c2", "left", 0.4), IN("#iv-c3", "left", 4.6)]),
        ("Dữ liệu cần đúng tuyệt đối như số dư, tồn kho thì đừng cache.", "Số dư, tồn kho cần đúng tuyệt đối: đừng cache.",
         [IN("#iv-c4", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ penetration, stampede, avalanche
    dict(id="incidents", world=(1920, 1080), hud=hud("in", "Penetration, stampede, avalanche", "Ba sự cố của cache"), cam="".join([
        gnode("in-p", 160, 190, 520, 100, "Penetration", "red"), gnode("in-s", 700, 190, 520, 100, "Stampede", "amber"), gnode("in-a", 1240, 190, 520, 100, "Avalanche", "violet"),
        chip("in-p1", 160, 320, "key không tồn tại → đâm DB", "red"), chip("in-p2", 160, 390, "cache rỗng, Bloom filter", "green"),
        chip("in-s1", 700, 320, "key nóng hết hạn → cùng load", "amber"), chip("in-s2", 700, 390, "single-flight, refresh sớm", "green"),
        chip("in-a1", 1240, 320, "nhiều key hết hạn cùng lúc", "violet"), chip("in-a2", 1240, 390, "TTL + jitter ngẫu nhiên", "green"),
        el("in-l", 160, 500, 1600, None, "50 thread cùng miss một key, loader chậm 200 ms:", "lbl r", "text-align:left"),
        box("in-b1", 160, 550, 1500, 70, "<b>@Cacheable thường · 50 lần load</b>", "red", "card"),
        box("in-b2", 160, 635, 1500, 70, "<b>@Cacheable(sync = true), RedisCacheManager mặc định · vẫn 50</b>", "red", "card"),
        box("in-b3", 160, 720, 760, 70, "<b>lockingRedisCacheWriter · 1 lần · 3090 ms</b>", "green", "card"),
        el("in-n", 160, 830, 1600, None, "Redis sập: @Cacheable ném exception lên request. CacheErrorHandler bỏ qua cache được, nhưng dồn hết tải vào DB: cần rate limit", "warnbox r"),
    ]), beats=[
        ("Phần năm: ba sự cố. Penetration: truy vấn key không tồn tại liên tục, mọi request đâm vào database. Cache giá trị rỗng với thời gian ngắn, hoặc bloom filter.",
         "Phần 5: Penetration: key không tồn tại, mọi request đâm DB. Cache giá trị rỗng TTL ngắn, Bloom filter.",
         [IN("#in-hud", "left", 0.1), IN("#in-p", "pop", 0.5), IN("#in-p1", "left", 2.2), IN("#in-p2", "left", 6.4)]),
        ("Stampede: một key rất nóng hết hạn, hàng nghìn request cùng load database. Cần chỉ một request được load, hoặc làm mới trước khi hết hạn.",
         "Stampede: key nóng hết hạn, hàng nghìn request cùng load DB. Single-flight hoặc refresh trước hạn.",
         [IN("#in-s", "pop", 0.4), IN("#in-s1", "left", 2.0), IN("#in-s2", "left", 5.6)]),
        ("Avalanche: nhiều key hết hạn cùng lúc. Thêm một độ lệch ngẫu nhiên vào T T L.", "Avalanche: nhiều key hết hạn cùng lúc. Thêm jitter vào TTL.",
         [IN("#in-a", "pop", 0.4), IN("#in-a1", "left", 1.8), IN("#in-a2", "left", 4.2)]),
        ("Thử năm mươi thread cùng miss một key: cache thường load năm mươi lần. Sync bằng true với Redis cache manager mặc định vẫn năm mươi. Chỉ khi dùng locking cache writer mới còn một lần, nhưng tổng thời gian lâu hơn.",
         "50 thread: @Cacheable thường 50 lần; sync = true với Redis mặc định vẫn 50; locking writer 1 lần nhưng chậm hơn.",
         [IN("#in-l", "fade", 0.2), IN("#in-b1", "left", 0.8, 0.6), IN("#in-b2", "left", 4.4, 0.6), IN("#in-b3", "left", 8.8, 0.6)]),
        ("Redis sập thì cache able ném exception lên request. Có thể bỏ qua cache, nhưng khi đó mọi tải dồn vào database.",
         "Redis sập: @Cacheable ném exception. Bỏ qua cache được, nhưng tải dồn vào DB.",
         [IN("#in-n", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ local vs distributed
    dict(id="local", world=(1920, 1080), hud=hud("lc", "Caffeine với Redis", "Local và distributed"), cam="".join([
        gnode("lc-c", 160, 190, 760, 100, "Caffeine: trong heap, nhanh nhất", "cyan"), gnode("lc-r", 1000, 190, 760, 100, "Redis: dùng chung các instance", "violet"),
        chip("lc-c1", 160, 320, "Không mạng, không serialize", "green"), chip("lc-c2", 160, 400, "Mỗi instance một bản: evict ở A không xoá B", "red"),
        chip("lc-c3", 160, 480, "Ăn heap JVM · mất khi restart", "amber"),
        chip("lc-r1", 1000, 320, "Evict một lần là xong", "green"), chip("lc-r2", 1000, 400, "Có network round-trip và serialize", "amber"),
        chip("lc-r3", 1000, 480, "Scale riêng, còn khi app restart", "green"),
        box("lc-two", 160, 600, 1600, 100, "<b>2 tầng: L1 Caffeine TTL ngắn → L2 Redis → DB · invalidation L1 qua Redis pub/sub</b>", "cyan", "card"),
        chip("lc-w", 160, 760, "Caffeine không giới hạn maximumSize thì đầy heap · local cache cho dữ liệu hay đổi: user lúc thấy giá cũ lúc thấy giá mới", "red"),
    ]), beats=[
        ("Phần sáu: caffeine và Redis. Caffeine nằm trong heap, nhanh nhất vì không có mạng, không serialize. Nhưng mỗi instance có một bản riêng, xóa ở instance này không xóa ở instance kia, và mất khi restart.",
         "Phần 6: Caffeine trong heap, nhanh nhất; nhưng mỗi instance một bản, evict ở A không xoá B.",
         [IN("#lc-hud", "left", 0.1), IN("#lc-c", "pop", 0.6), IN("#lc-c1", "left", 3.0), IN("#lc-c2", "left", 5.4), IN("#lc-c3", "left", 9.0)]),
        ("Redis thì dùng chung giữa các instance, xóa một lần là xong, scale riêng. Đổi lại có thêm một lần đi qua mạng.",
         "Redis dùng chung giữa các instance, evict một lần là xong; đổi lại có network round-trip.",
         [IN("#lc-r", "pop", 0.4), IN("#lc-r1", "left", 2.6), IN("#lc-r2", "left", 4.8), IN("#lc-r3", "left", 6.2)]),
        ("Hệ thống lớn dùng hai tầng: caffeine T T L ngắn ở trên, Redis ở dưới, rồi tới database. Nhớ giới hạn kích thước của caffeine, và đừng dùng local cache cho dữ liệu hay đổi khi chạy nhiều instance.",
         "2 tầng Caffeine + Redis. Giới hạn maximumSize; đừng dùng local cache cho dữ liệu hay đổi khi nhiều instance.",
         [IN("#lc-two", "up", 0.4), IN("#lc-w", "left", 5.4)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("box", "Cache-aside", "ghi DB trước, xoá cache sau"),
                                                ("hash", "TTL", "luôn đặt, mặc định là -1"),
                                                ("shield", "Self-invocation", "tách method sang bean khác"),
                                                ("share", "Stampede", "sync = true chưa đủ với Redis")]),
        chip("ou-next", 660, 650, "Bài tiếp: Kafka Basics", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: ghi database trước rồi xóa cache. Luôn đặt T T L. Gọi method qua chính nó thì cache bị bỏ qua. Và với Redis, sync bằng true chưa đủ để chặn stampede.",
         "Ghi DB rồi xoá cache · luôn đặt TTL · this.method() bỏ qua cache · sync = true chưa chặn được stampede.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.2), IN("#ou-c2", "pop", 5.4), IN("#ou-c3", "pop", 7.8)]),
        ("Bài tiếp: kafka cơ bản.", "Bài tiếp: Kafka Basics.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
