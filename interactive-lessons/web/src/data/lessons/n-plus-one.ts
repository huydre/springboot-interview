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
        "Cả bài xoay quanh một lỗi: **{{n-plus-one|N+1}}**. Lấy một danh sách N phần tử bằng 1 query, rồi trong vòng lặp truy cập quan hệ của từng phần tử, mỗi lần lại thêm 1 query: tổng cộng 1 + N query thay vì 1 hoặc 2. Phần 3 tái hiện và sửa nó; phần này xem gốc rễ là cách Hibernate tải quan hệ.",
        "Mô hình dùng trong bài: `Order` có `@ManyToOne(fetch = LAZY) Customer customer` và `@OneToMany List<OrderItem> items`; thêm `Invoice` có `@ManyToOne Customer customer` không ghi fetch, tức dùng mặc định.",
        "**LAZY** nghĩa là quan hệ chưa được tải cùng entity cha, chỉ tải khi bạn truy cập lần đầu. **EAGER** nghĩa là luôn tải cùng lúc với entity cha. Mặc định theo spec: `@ManyToOne`, `@OneToOne` là **EAGER**; `@OneToMany`, `@ManyToMany` là LAZY.",
        "LAZY đặt vào một vật thế chỗ: to-one là {{proxy|proxy}} (class con của entity, lúc đầu chỉ chứa id; đo được `Customer$HibernateProxy`), collection là `PersistentBag`. `c.getId()` **0 query** vì proxy đã biết id, `c.getName()` 1 query.",
        "EAGER cũng gây N+1: `invoiceRepo.findAll()` và JPQL `select i from Invoice i` đều **11 query** cho 10 invoice thuộc 10 customer khác nhau. Vì sao: JPQL chỉ select bảng `invoice`, không quan tâm fetch type; xong rồi Hibernate mới thấy `customer` là EAGER nên **bắt buộc** đi load customer cho từng dòng, mỗi dòng một query. EAGER không tắt được ở mức query, nên best practice là mọi association LAZY, rồi fetch theo từng use case.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["JPQL chỉ select bảng `invoice` → Hibernate mới thấy `customer` là EAGER → bắt buộc load customer cho từng dòng → 1 + N query. Vì vậy mọi association nên LAZY."],
      },
      after: [
        "`getReferenceById` trả proxy mà không SELECT, tiện để gán khoá ngoại (0 SELECT). Proxy là class con nên `getClass() == Customer.class` là false: `equals` nên dùng `instanceof` và getter.",
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
        "Phần 1 chọn LAZY cho mọi association. Cái giá của LAZY: chạm vào proxy hoặc collection LAZY sau khi persistence context đóng: `failed to lazily initialize a collection of role: demo.Order.items: could not initialize proxy - no Session`. Đọc message là biết association nào.",
        "**OSIV** ({{osiv|Open Session In View}}, property `spring.jpa.open-in-view`) là interceptor của Spring MVC giữ EntityManager mở suốt HTTP request, kể cả sau khi transaction của service đã kết thúc. Spring Boot **bật mặc định** (log WARN lúc khởi động).",
        "Thí nghiệm: endpoint `GET /orders/{id}/item-count` gọi `orders.findById(id)` (transaction của repository kết thúc ngay đó), rồi ngay trong controller trả `o.getItems().size()`, tức lazy load ở controller. Order thử có 3 item. Bật và tắt OSIV để so.",
      ],
      predict: {
        question: "OSIV đang bật (mặc định của Boot). Transaction của `findById` đã kết thúc, controller gọi `o.getItems().size()`. Kết quả?",
        options: [
          "`LazyInitializationException`, vì transaction đã kết thúc",
          "HTTP 200, body `3`: EntityManager vẫn mở nên lazy load chạy thêm 1 query",
          "Body `0`, vì collection chưa load",
          "HTTP 500 do thiếu `@Transactional` ở controller",
        ],
        answer: 1,
        explain: "OSIV giữ EntityManager mở suốt request, nên lazy load ở controller vẫn chạy được. Tắt OSIV thì mới ra `LazyInitializationException`.",
      },
      widget: "osiv",
      widgetTitle: "Cùng controller, bật và tắt OSIV",
      after: [
        "Đã đo: OSIV bật thì HTTP 200, body `3`, 2 query (1 order, 1 items); tắt thì `LazyInitializationException`.",
        "Nên tắt OSIV, vì:",
        "- **N+1 ẩn**: query lazy ngoài transaction dễ thành N+1 mà không ai thấy.",
        "- **Giữ connection cả request**.",
        "- **Lỗi bị che**.",
        "Sửa đúng: fetch đủ trong service hoặc map sang DTO; không đổi sang EAGER, không bật `enable_lazy_load_no_trans`, không `@Transactional` lên controller.",
      ],
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
        "1 query lấy danh sách cha, rồi N query lấy association của từng phần tử. Đã đo với 10 order: `getItems().size()` 11 query, `getCustomer().getName()` cũng 11. Cách phát hiện:",
        "- **Log `org.hibernate.SQL`**: một câu lặp lại với tham số khác.",
        "- **Hibernate statistics**: để assert số query trong test.",
        "- **APM**: ở production.",
        "Bốn cách sửa, đã đo trên cùng 10 order (30 item):",
        "- **(1) JOIN FETCH**: `@Query(\"select o from Order o join fetch o.items\")`, lấy order và items trong một câu JOIN: **1** query. Hibernate 5 trả order bị lặp lại (mỗi item một dòng, phải thêm `distinct`); Hibernate 6 tự loại trùng parent, nên ra đúng 10 order mà không cần `distinct`.",
        "- **(2) `@EntityGraph(attributePaths = \"items\")`** gắn lên method repository: kết quả giống JOIN FETCH (sinh `left join`) mà không phải viết JPQL: **1** query.",
        "- **(3) Batch fetching**, `spring.jpa.properties.hibernate.default_batch_fetch_size=N`: vẫn lazy, nhưng khi load items của order đầu tiên, Hibernate gom luôn id của tối đa N order khác đang chờ vào **một** câu `where order_id = any (?)`. Với N = 4: 1 + ceil(10/4) = 1 + 3 = **4** query. Với N = 50: 1 + 1 = **2** query.",
        "- **(4) DTO projection**: `select new demo.OrderSummary(o.id, c.name, o.total, size(o.items)) from Order o join o.customer c`, chỉ lấy đúng cột cần, không tạo entity: **1** query.",
        "Dự án: batch fetch size 50–100 làm lưới an toàn toàn cục, `@EntityGraph`/JOIN FETCH cho màn chi tiết, DTO cho API danh sách.",
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
        "Phần 3 khuyên JOIN FETCH cho màn chi tiết. Nó có hai bẫy khi dùng sai chỗ.",
        "**Bẫy 1**, JOIN FETCH collection + Pageable: `WARN HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory`, SQL **không có LIMIT**. Lý do: câu JOIN trả mỗi cặp (order, item) một dòng, nên `LIMIT 3` sẽ cắt theo **dòng join** chứ không theo order, có thể ra một order thiếu item. Hibernate đành load hết rồi cắt trang trong bộ nhớ. Đúng `content=3, total=10` nhưng production dễ OutOfMemoryError.",
        "Bật `fail_on_pagination_over_collection_fetch=true` ở test. Sửa: phân trang id trước rồi fetch theo id (3 query, 3 order 9 item, không WARN), hoặc phân trang thường để batch fetching lo. Fetch to-one với Pageable thì không sao.",
        "**Bẫy 2**, fetch join hai `List` cùng lúc: `MultipleBagFetchException: cannot simultaneously fetch multiple bags`. Đổi sang `Set` hết lỗi nhưng tích Descartes vẫn còn (50 × 20 = 1000 dòng cho một order). Nên fetch từng collection bằng query riêng trong cùng transaction, hoặc một cái fetch join, cái kia batch fetching.",
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
