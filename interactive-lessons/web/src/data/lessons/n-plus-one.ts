import timeline from "../timelines/n-plus-one.json";
import type { Lesson, Scene } from "../types";

// Measured on Spring Boot 3.5 + Hibernate ORM 6.6 + PostgreSQL 16.14 (Docker), JDK 21; data: 10 orders, 3 items each, 10 customers;
// query counts from Hibernate statistics. See study note 05.07. Video not rendered yet: scenes stay empty until publish.
export const nPlusOne: Lesson = {
  slug: "n-plus-one",
  crumb: "Lazy Loading & N+1",
  videoDir: "/videos/n-plus-one",
  videoVersion: "5351a04f",
  scenes: timeline as Scene[],
  title: "Lazy Loading & N+1",
  subtitle:
    "FetchType mặc định và proxy, LazyInitializationException và OSIV, tái hiện và phát hiện N+1, bốn cách sửa có số query, bẫy JOIN FETCH với phân trang và MultipleBagFetchException.",
  openingQuiz: {
    question: "findAll() 10 order rồi duyệt o.getItems().size(). Bao nhiêu query?",
    options: ["1", "2", "11", "30"],
    answer: 2,
    explain: "Đã đo 11: 1 query lấy order, mỗi order thêm 1 query lấy items.",
  },
  roadmap: [
    "Chặng 1: FetchType, proxy, LazyInitializationException và OSIV.",
    "Chặng 2: N+1 và bốn cách sửa.",
    "Chặng 3: JOIN FETCH với phân trang, nhiều collection.",
  ],
  sections: [
    {
      id: "fetch-type",
      title: "Phần 1: FetchType mặc định và proxy",
      scene: "proxy",
      intro: [
        "Mặc định theo spec: `@ManyToOne`, `@OneToOne` là **EAGER**; `@OneToMany`, `@ManyToMany` là LAZY. LAZY đặt vào một vật thế chỗ: to-one là proxy (đo được `Customer$HibernateProxy`), collection là `PersistentBag`. `c.getId()` **0 query** vì proxy đã biết id, `c.getName()` 1 query.",
        "EAGER cũng gây N+1: `invoiceRepo.findAll()` và JPQL `select i from Invoice i` đều **11 query** cho 10 invoice, và không tắt được ở mức query. Best practice: mọi association LAZY, fetch theo use case. `getReferenceById` để gán khoá ngoại tốn 0 SELECT. Proxy là subclass nên `getClass() == Customer.class` là false: equals dùng `instanceof` và getter.",
      ],
      quiz: {
        question: "FetchType mặc định của @ManyToOne?",
        options: ["LAZY", "EAGER", "Tuỳ Hibernate", "Không có"],
        answer: 1,
        explain: "Phía to-One mặc định EAGER: nên đổi sang LAZY.",
      },
    },
    {
      id: "osiv",
      title: "Phần 2: LazyInitializationException và OSIV",
      scene: "osiv",
      intro: [
        "Chạm vào proxy hoặc collection LAZY sau khi persistence context đóng: `failed to lazily initialize a collection of role: demo.Order.items: could not initialize proxy - no Session`. Đọc message là biết association nào.",
        "OSIV giữ EntityManager mở suốt HTTP request và Spring Boot **bật mặc định** (log WARN lúc khởi động). Đã đo cùng controller: bật thì 200, body 3, 2 query; tắt thì `LazyInitializationException`. Nên tắt: query lazy ngoài transaction dễ thành N+1 ẩn, connection bị giữ cả request, lỗi bị che. Sửa đúng: fetch đủ trong service hoặc map sang DTO; không đổi sang EAGER, không bật `enable_lazy_load_no_trans`, không `@Transactional` lên controller.",
      ],
      widget: "osiv",
      widgetTitle: "Cùng controller, bật và tắt OSIV",
      quiz: {
        question: "Tắt OSIV trên dự án đang chạy an toàn thế nào?",
        options: ["Tắt luôn ở production", "Bật log SQL ở test, chạy integration test các API chính, sửa từng chỗ bằng fetch join hoặc DTO rồi mới tắt", "Đổi mọi association sang EAGER", "Không bao giờ tắt"],
        answer: 1,
        explain: "Mọi chỗ lazy load ngoài service sẽ ném exception sau khi tắt.",
      },
    },
    {
      id: "n-plus-one",
      title: "Phần 3: N+1 và bốn cách sửa",
      scene: "nplusone",
      intro: [
        "1 query lấy danh sách cha, rồi N query lấy association của từng phần tử. Đã đo với 10 order: `getItems().size()` 11 query, `getCustomer().getName()` cũng 11. Phát hiện: log `org.hibernate.SQL` (một câu lặp lại với tham số khác), Hibernate statistics để assert số query trong test, APM ở production.",
        "Đã đo: JOIN FETCH **1**, `@EntityGraph` **1**, `default_batch_fetch_size=4` **4**, `=50` **2**, DTO projection **1**. Hibernate 6 không còn nhân bản parent khi fetch collection. Dự án: batch fetch size 50–100 làm lưới an toàn, `@EntityGraph`/JOIN FETCH cho màn chi tiết, DTO cho API danh sách.",
      ],
      widget: "n-plus-one",
      widgetTitle: "10 order, đếm query",
      quiz: {
        question: "default_batch_fetch_size=4 với 10 order: bao nhiêu query?",
        options: ["2", "4: 1 + ceil(10/4) = 3 câu batch", "10", "11"],
        answer: 1,
        explain: "Mỗi câu batch gom tối đa 4 id vào = any (?).",
      },
    },
    {
      id: "traps",
      title: "Phần 4: JOIN FETCH với phân trang và nhiều collection",
      scene: "traps",
      intro: [
        "JOIN FETCH collection + Pageable: `WARN HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory`, SQL **không có LIMIT**. Đúng `content=3, total=10` nhưng production dễ OutOfMemoryError. Bật `fail_on_pagination_over_collection_fetch=true` ở test. Sửa: phân trang id trước rồi fetch theo id (3 query, 3 order 9 item, không WARN), hoặc phân trang thường để batch fetching lo. Fetch to-one với Pageable thì không sao.",
        "Fetch join hai `List` cùng lúc: `MultipleBagFetchException: cannot simultaneously fetch multiple bags`. Đổi sang `Set` hết lỗi nhưng tích Descartes vẫn còn (50 × 20 = 1000 dòng cho một order). Nên fetch từng collection bằng query riêng trong cùng transaction, hoặc một cái fetch join, cái kia batch fetching.",
      ],
      widget: "fetch-trap",
      widgetTitle: "Chạy đúng, nguy hiểm hay exception",
      quiz: {
        question: "Vì sao JOIN FETCH collection + Pageable không thêm LIMIT vào SQL?",
        options: ["Lỗi Hibernate", "LIMIT cắt theo dòng join (order × item) nên có thể ra thiếu order; Hibernate load hết rồi cắt trong memory", "PostgreSQL không hỗ trợ LIMIT", "Vì có count query"],
        answer: 1,
        explain: "Fetch to-one không nhân dòng nên LIMIT vẫn đúng.",
      },
    },
  ],
  modelAnswer:
    "N+1 là khi load một danh sách cha bằng 1 query, rồi truy cập association lazy trong vòng lặp nên mỗi phần tử sinh thêm 1 query; em tái hiện với 10 order thì ra 11 query. Em phát hiện bằng log org.hibernate.SQL, dấu hiệu là một câu SELECT lặp lại, và trong test thì assert số query bằng Hibernate statistics. Sửa có bốn cách em đã đo: JOIN FETCH và @EntityGraph còn 1 query, batch fetch size 50 còn 2, DTO projection 1. Cần cẩn thận JOIN FETCH collection với phân trang vì Hibernate cắt trang trong memory, em sửa bằng phân trang id trước; và fetch hai List cùng lúc thì MultipleBagFetchException. Em đặt mọi association LAZY, tắt OSIV để lazy load không chạy ngầm ngoài transaction.",
};
