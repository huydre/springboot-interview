import timeline from "../timelines/index.json";
import type { Lesson, Scene } from "../types";

// Measured on PostgreSQL 16 (orders 1M rows, customer 100k rows, parallel query off); see study note 03.06.
// Plan shapes re-checked on a fresh postgres:16-alpine. The three-level sample plan in `explain` was run on PGlite 18 (30000-row scratch table of sql-optimize).
export const indexExplain: Lesson = {
  slug: "index",
  crumb: "Index & EXPLAIN",
  videoDir: "/videos/index-explain",
  // Per-scene clips cut by `video-kit/pipeline.py index-video publish`, which also rewrites videoVersion.
  videoVersion: "b4baa680",
  scenes: timeline as Scene[],
  title: "Index & EXPLAIN",
  subtitle:
    "B+Tree, đọc EXPLAIN ANALYZE, composite index và leftmost prefix, những lúc index bị bỏ qua, covering index, clustered index, và cái giá của index khi ghi.",
  openingQuiz: {
    question: "Bảng orders 1 triệu dòng có index (customer_id, created_at). Query nào sau đây chạy Seq Scan?",
    options: [
      "where customer_id = 4242",
      "where customer_id = 4242 order by created_at desc limit 5",
      "where created_at >= '2026-11-01' and created_at < '2026-11-02'",
      "where customer_id = 4242 and created_at >= '2026-01-01'",
    ],
    answer: 2,
    explain: "Thiếu cột đầu customer_id nên vi phạm leftmost prefix. Đã đo: Seq Scan đọc cả bảng, bỏ qua 998.616 dòng, chậm ngang như chưa có index.",
  },
  roadmap: [
    "Chặng 1: B+Tree và cách đọc EXPLAIN ANALYZE.",
    "Chặng 2: composite index, leftmost prefix, và 6 lý do index bị bỏ qua.",
    "Chặng 3: covering index, clustered index, cái giá của index và ACID.",
  ],
  sections: [
    {
      id: "btree",
      title: "Phần 1: Index là gì: B+Tree",
      scene: "btree",
      intro: [
        "Trước khi nói về index, cần hiểu vì sao database chậm. Dữ liệu nằm trên đĩa, và đọc đĩa chậm hơn đọc RAM hàng nghìn lần. Hơn nữa đĩa không đọc từng dòng: mỗi lần đọc là cả một khối gọi là **page** (8 KB ở PostgreSQL, 16 KB ở MySQL InnoDB), chứa khoảng vài chục tới vài trăm dòng.",
        "Ghi nhớ 2 điều, phần sau sẽ dùng lại:",
        "- **Đọc page rất đắt**: muốn nhanh thì phải giảm số page phải đọc.",
        "- **Mỗi lần đọc là cả một page**: nên nhét được càng nhiều thứ có ích vào một page càng tốt.",
        "Không có index, câu `WHERE email = 'an@x.com'` buộc database đọc mọi page của bảng, từ đầu đến cuối. Đó là **full table scan** (trong EXPLAIN gọi là Seq Scan). Chọn kích thước bảng và vị trí dòng cần tìm, rồi cho hai bên chạy đua.",
      ],
      predict: {
        question: "Cột `email` không có ràng buộc UNIQUE, cũng không có index. Dòng cần tìm nằm ngay **dòng thứ 5** của bảng 1 triệu dòng. Database đọc bao nhiêu page?",
        options: [
          "1 page, vì dòng thứ 5 nằm ngay page đầu",
          "Tất cả 10.000 page, vì chưa chắc phía sau không còn dòng nào khớp",
          "Một nửa số page",
          "Không đọc page nào, database nhớ sẵn",
        ],
        answer: 1,
        explain: "Không có UNIQUE thì tìm thấy dòng thứ 5 vẫn chưa đủ: phía sau có thể còn dòng khớp, nên database phải đọc tới hết bảng. Chỉ khi cột UNIQUE, hoặc bạn viết `LIMIT 1`, nó mới được dừng sớm.",
      },
      widget: "scan-race",
      widgetTitle: "Chạy đua: full table scan và index",
      after: [
        "Đã đo trên bảng 1 triệu dòng thật: không index thì Seq Scan bỏ qua 999.987 dòng, mất 99 ms; có index thì đọc đúng 13 dòng, 0,26 ms, nhanh khoảng 400 lần. Mô phỏng ở trên đếm page theo mô hình đơn giản, còn con số đo được là thời gian thật.",
      ],
      takeaway: {
        lines: [
          "Full table scan đọc **mọi page**, nên bảng to gấp 10 thì chậm gấp 10. Index chỉ đọc vài page, gần như không đổi khi bảng to lên.",
        ],
      },
      quiz: {
        question: "Bảng 1 triệu dòng, không có index trên `email`. Câu nào sau đây khiến database **được phép** dừng sớm khi đã tìm thấy dòng khớp?",
        options: [
          "`WHERE email = 'an@x.com'`",
          "`WHERE email = 'an@x.com' LIMIT 1`",
          "`WHERE email = 'an@x.com' ORDER BY id`",
          "Không câu nào, full scan luôn đọc hết",
        ],
        answer: 1,
        explain: "LIMIT 1 nói rõ chỉ cần một dòng, nên thấy dòng đầu tiên là dừng. Nếu cột có UNIQUE thì cũng vậy. Còn lại database phải đọc hết vì không biết phía sau còn dòng khớp hay không.",
      },
      parts: [
        {
          id: "btree-search",
          title: "B+Tree tìm một giá trị như thế nào",
          intro: [
            "Ta đã thấy index nhanh. Nhưng index thật ra là gì? Khi chạy `CREATE INDEX`, database **không sắp xếp lại bảng**. Nó tạo thêm một cấu trúc riêng, chỉ chứa cột cần tìm đã sắp xếp, kèm một con trỏ về đúng dòng trong bảng (PostgreSQL gọi con trỏ đó là `ctid`).",
            "Giống phần mục lục cuối sách:",
            "- **Nằm riêng**: mục lục chiếm thêm vài trang, cũng như index chiếm thêm dung lượng đĩa.",
            "- **Đã sắp xếp**: từ khoá xếp A tới Z, kèm số trang để lật tới ngay.",
            "- **Thừa có chủ đích**: xé mục lục thì nội dung sách không mất, chỉ là tìm chậm đi rất nhiều.",
            "Khác với sách, dữ liệu trong database thay đổi liên tục, nên mỗi lần `INSERT`, `UPDATE`, `DELETE` database phải sửa cả index. Đó là cái giá của index (Phần 6).",
            "Cấu trúc database dùng để tổ chức index là **B+Tree**, gồm 3 tầng:",
            "- **Leaf (tầng lá)**: chứa mọi key đã sắp xếp, mỗi leaf là một page. Các leaf **nối với nhau hai chiều**, nên đi sang trái hay phải được ngay.",
            "- **Branch (tầng giữa)**: mỗi key là key lớn nhất của node con bên dưới, dùng để chỉ đường.",
            "- **Root (gốc)**: node trên cùng, điểm bắt đầu của mọi lần tìm.",
            "Quy tắc tìm: ở mỗi node, đi theo key **đầu tiên lớn hơn hoặc bằng** giá trị cần tìm. Chọn một câu truy vấn rồi bấm Tìm để xem đường đi.",
          ],
          predict: {
            question: "Cây B+Tree bên dưới có 3 tầng. Tìm `= 57` thì database đọc bao nhiêu page?",
            options: ["1 page", "3 page: root, branch, leaf", "8 page, mỗi leaf một lần", "Tuỳ 57 nằm ở đâu trong bảng"],
            answer: 1,
            explain: "Mỗi tầng đọc đúng một page: root chỉ xuống branch, branch chỉ xuống leaf. Cây cao bao nhiêu tầng thì đọc bấy nhiêu page, không phụ thuộc bảng có bao nhiêu dòng.",
          },
          widget: "btree-search",
          widgetTitle: "Tìm trên B+Tree",
          after: [
            "Với `BETWEEN 30 AND 57`, database chỉ đi xuống cây **một lần** để tìm leaf chứa 30. Sau đó nó đi ngang theo liên kết giữa các leaf cho tới khi gặp key lớn hơn 57. Không có liên kết đó, mỗi lần sang leaf kế tiếp lại phải leo lên rồi đi xuống.",
            "Liên kết hai chiều còn giúp `ORDER BY ... DESC`: database đi ngược từ phải sang trái trên cùng index, không cần tạo index thứ hai.",
          ],
          takeaway: {
            lines: [
              "Tìm `=`: đọc đúng một page mỗi tầng. Tìm khoảng: xuống cây một lần, rồi đi ngang theo tầng lá. Vì vậy B+Tree giỏi cả `=`, `BETWEEN`, `>` và `ORDER BY`.",
            ],
          },
          quiz: {
            question: "Vì sao **không** cần tạo hai index riêng cho `ORDER BY price ASC` và `ORDER BY price DESC`?",
            options: [
              "Vì database tự tạo index thứ hai",
              "Vì các leaf nối hai chiều, database đọc cùng một index theo chiều ngược lại",
              "Vì ORDER BY không bao giờ dùng index",
              "Vì DESC chỉ đảo kết quả trong RAM sau khi sort",
            ],
            answer: 1,
            explain: "Leaf của B+Tree nối với nhau cả hai chiều, nên database đọc ngược (Index Scan Backward) mà không cần sort lại.",
          },
        },
        {
          id: "btree-fanout",
          title: "Vì sao cây B+Tree rất lùn",
          intro: [
            "Cây nhị phân tìm kiếm cũng tìm nhanh trên lý thuyết. Nhưng mỗi node của nó chỉ chứa **1 key**. Đặt lên đĩa, mỗi node chiếm cả một page mà chỉ dùng vài chục byte, và mỗi bước đi xuống là thêm một lần đọc page. 100 triệu key cần khoảng 27 tầng, tức 27 lần đọc.",
            "B+Tree làm ngược lại: nhét **đầy** mỗi page bằng hàng trăm key. Số key trong một page gọi là **fanout**, cũng là số nhánh của mỗi node. Fanout càng lớn thì cây càng lùn, và cây lùn nghĩa là ít lần đọc page.",
            "Thử đổi page size, kiểu key và số dòng. Để ý chuyện gì xảy ra khi đổi key từ `INT` sang `UUID` ở bảng 100 triệu dòng.",
          ],
          predict: {
            question: "Bảng 100 triệu dòng, page 16 KB. Đổi khoá chính từ `INT` (4 byte) sang `UUID` (16 byte) thì sao?",
            options: [
              "Không đổi gì, index vẫn như cũ",
              "Mỗi page chứa ít key hơn, cây có thể cao thêm một tầng, mỗi lần tìm thêm một lần đọc page",
              "Cây lùn đi vì UUID là duy nhất",
              "Index không dùng được với UUID",
            ],
            answer: 1,
            explain: "Key to hơn nên mỗi page chứa ít entry hơn, fanout giảm. Với 100 triệu dòng, cây cần thêm một tầng để chứa hết, và mọi lần tìm đều đọc thêm một page.",
          },
          widget: "fanout",
          widgetTitle: "Fanout và chiều cao cây",
          after: [
            "Trên thực tế root và branch được truy cập liên tục nên thường nằm sẵn trong RAM. Nhiều lần tìm chỉ thực sự chạm đĩa ở tầng lá.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Key to hơn → mỗi page chứa ít entry hơn → fanout giảm → cây cao hơn → mỗi lần tìm đọc thêm page.",
              "Vì vậy khoá chính nên nhỏ gọn, và index trên cột dài (như email) tốn hơn index trên cột số.",
            ],
          },
          quiz: {
            question: "Vì sao DB dùng B+Tree chứ không dùng binary tree?",
            options: [
              "Binary tree không sắp xếp được",
              "Binary tree 1 triệu phần tử cần khoảng 20 tầng, tức 20 lần đọc page; B+Tree mỗi node hàng trăm key nên chỉ 3–4 tầng",
              "B+Tree không cần đĩa",
              "Binary tree không hỗ trợ dấu =",
            ],
            answer: 1,
            explain: "Đĩa đọc theo page, nên giảm số page cần đọc là giảm thời gian. Hash index thì chỉ hỗ trợ =, không hỗ trợ khoảng và ORDER BY.",
          },
        },
      ],
    },
    {
      id: "explain",
      title: "Phần 2: Đọc EXPLAIN ANALYZE",
      scene: "explain",
      intro: [
        "`EXPLAIN` chỉ lập kế hoạch, cho số **ước lượng**. `EXPLAIN ANALYZE` **chạy thật**, cho thời gian và số dòng thực tế: với UPDATE hay DELETE phải bọc trong `BEGIN ... ROLLBACK`. Plan là một cây và đọc **từ trong ra ngoài**: dòng thụt sâu nhất (có `->`) chạy trước, đưa dòng kết quả lên cho dòng cha.",
        "Ví dụ thật trên một bảng thử 30.000 dòng có index `(account_id, booking_date)`, câu `where account_id = 'AC00000123' order by booking_date`, ba tầng:\n\n`Sort  (Sort Key: booking_date)`\n\n`  ->  Bitmap Heap Scan on scratch_entry`\n\n`        ->  Bitmap Index Scan on idx_acc_date  (Index Cond: account_id = 'AC00000123')`\n\nĐọc từ dưới lên: **(1)** node trong cùng `Bitmap Index Scan` tra index, đánh dấu những page có dòng của khách đó; **(2)** `Bitmap Heap Scan` mở các page đó lấy dòng; **(3)** `Sort` ở ngoài cùng sắp các dòng theo ngày.",
        "Bốn loại scan: **Seq Scan** đọc cả bảng từ đầu tới cuối. **Index Scan** đi theo index rồi lấy từng dòng trong bảng, hợp khi lấy rất ít dòng. **Bitmap Heap Scan** (đi cùng Bitmap Index Scan) tra index trước để gom danh sách page, rồi đọc mỗi page một lần theo thứ tự, hợp khi lấy một nhóm dòng vừa phải. **Index Only Scan** lấy đủ dữ liệu từ index, không cần mở bảng (Phần 5).",
        "Nhìn 4 thứ: loại scan, `Rows Removed by Filter` (đọc thừa bao nhiêu), rows ước lượng so với actual (lệch nhiều thì chạy `ANALYZE`), và Execution Time. Phân biệt `Index Cond` (dùng để đi trong index) với `Filter` (lọc sau khi đã lấy dòng). MySQL thì xem cột `type` (`ALL` là full scan), `key`, `rows`, `Extra` (`Using filesort` là xấu, `Using index` là covering).",
      ],
      widget: "explain-plan",
      widgetTitle: "Đọc plan thật",
      quiz: {
        question: "Có index rồi mà plan vẫn Seq Scan. Điều nào KHÔNG phải nguyên nhân hợp lý?",
        options: [
          "Query lấy phần lớn bảng",
          "Cột bị bọc trong hàm hoặc ép kiểu",
          "Thống kê cũ làm optimizer ước lượng sai",
          "Bảng có primary key",
        ],
        answer: 3,
        explain: "Ba lý do đầu đều thật. Ngoài ra bảng quá nhỏ cũng khiến Seq Scan rẻ hơn.",
      },
    },
    {
      id: "composite",
      title: "Phần 3: Composite index và leftmost prefix",
      scene: "composite",
      intro: [
        "Index `(customer_id, created_at)` sắp theo `customer_id` trước, trong cùng `customer_id` mới sắp theo `created_at`, như danh bạ sắp theo họ rồi tới tên. Đã đo: `customer_id = 4242` 0,26 ms; thêm khoảng ngày thì Index Cond dùng cả hai cột, 0,64 ms; \"5 đơn mới nhất của khách\" là `Index Scan Backward` không có Sort, 2 ms; chỉ lọc `created_at` thì Seq Scan cả bảng, chậm ngang như chưa có index.",
        "Cột so sánh `=` đặt trước, cột range hoặc sort đặt sau. Index `(a, b)` đã phục vụ mọi query theo `a`, không cần thêm index `(a)` riêng. Thứ tự viết điều kiện trong WHERE không quan trọng.",
        "**Độ chọn lọc** (selectivity) là tỉ lệ dòng mà một điều kiện giữ lại. Điều kiện giữ ít dòng (0,5% bảng) là chọn lọc **cao**, index rất có lợi. Điều kiện giữ phần lớn bảng (70%) là chọn lọc **thấp**: tra index rồi nhảy tới từng dòng còn tốn hơn đọc thẳng cả bảng, nên optimizer chọn Seq Scan. Phần 4 có số đo cụ thể.",
      ],
      widget: "leftmost-prefix",
      widgetTitle: "Index (a, b, c) dùng được không?",
      quiz: {
        question: "Có index (status, created_at), 70% đơn là PAID. Câu nào đúng?",
        options: [
          "where created_at > ? dùng tốt index này",
          "where status = 'PAID' chắc chắn dùng index",
          "where status = 'PAID' order by created_at limit 20 có lợi từ index vì tránh sort",
          "Index này không dùng được cho câu nào",
        ],
        answer: 2,
        explain: "status = 'PAID' một mình có độ chọn lọc thấp nên optimizer có thể vẫn Seq Scan; có ORDER BY và LIMIT thì index giúp đọc 20 dòng đầu mà không sort.",
      },
    },
    {
      id: "no-index",
      title: "Phần 4: Khi nào index không được dùng",
      scene: "noindex",
      intro: [
        "Index lưu **giá trị gốc của cột**, đã sắp xếp. Bọc cột trong hàm, phép tính hay ép kiểu là tạo ra giá trị khác, không có trong index. Quy tắc chung: biến đổi phía hằng số, đừng biến đổi phía cột. Từng mẫu hay gặp, kèm lý do và cách viết lại:",
        "**`customer_id + 0 = 4242`**: index không chứa `customer_id + 0`. Viết `customer_id = 4242`. **`created_at::date = '2026-11-01'`**: index chứa timestamp, không chứa ngày đã cắt. Viết `created_at >= '2026-11-01' and created_at < '2026-11-02'`. **`lower(email) = ...`**: index chứa email gốc. Tạo expression index `create index on users (lower(email))`.",
        "**`customer_id = 4242.0`**: PostgreSQL ép **cột** int sang numeric để so, nên giá trị so không còn là giá trị trong index. Truyền đúng kiểu `4242`. **`like '%abc'`**: không biết phần đầu thì không biết bắt đầu tìm ở đâu trong cây đã sắp. Dùng index trigram `pg_trgm` nếu thật cần. **MySQL so `VARCHAR` với số**: MySQL ép từng dòng sang số rồi so, bỏ index. Bẫy hay gặp: số điện thoại lưu chuỗi mà code truyền `Long`.",
        "**`like 'user4242%'` với collation `en_US.utf8`** (mặc định của image Docker): đã đo vẫn Seq Scan. Lý do: collation (quy tắc so sánh chữ) không phải `C` thì thứ tự sắp trong index theo luật ngôn ngữ, không theo từng byte, nên các chuỗi bắt đầu bằng `user4242` không chắc nằm liền một đoạn trong index. Tạo index với `text_pattern_ops` để index sắp theo từng ký tự, khi đó LIKE tiền tố dùng được.",
        "Cuối cùng là **độ chọn lọc** (Phần 3): `status = 'PAID'` (70% bảng) optimizer cố ý chọn Seq Scan, 339 ms; `status = 'REFUNDED'` (0,5%) mới dùng index. Đó không phải lỗi.",
      ],
      quiz: {
        question: "Viết lại WHERE YEAR(created_at) = 2026 thế nào để dùng được index?",
        options: [
          "created_at between '2026-01-01' and '2026-12-31'",
          "created_at >= '2026-01-01' and created_at < '2027-01-01'",
          "cast(created_at as date) >= '2026-01-01'",
          "Không viết lại được",
        ],
        answer: 1,
        explain: "Dùng < đầu năm sau để không bỏ sót các bản ghi ngày 31/12 có giờ phút.",
      },
    },
    {
      id: "covering",
      title: "Phần 5: Covering index và clustered index",
      scene: "covering",
      intro: [
        "Index chứa mọi cột query cần thì DB không phải sang bảng: `Index Only Scan`, `Heap Fetches: 0`. Thêm cột ngoài index thì phải đọc bảng; `INCLUDE (total)` (PostgreSQL 11+) đưa cột vào leaf chỉ để đọc. Đã thử lại: ngay sau khi insert vẫn ra Bitmap Heap Scan, chạy `VACUUM` xong mới ra Index Only Scan. Lý do: index không ghi dòng nào còn \"nhìn thấy được\" với transaction hiện tại, nên PostgreSQL tra **visibility map**, một bản đồ nhỏ đánh dấu page nào chỉ chứa dòng mà mọi transaction đều thấy. Page chưa được đánh dấu (vừa insert, chưa `VACUUM`) thì vẫn phải mở bảng để kiểm tra. `select *` làm mất lợi ích này.",
        "MySQL InnoDB là **clustered index**: bảng chính là B+Tree theo primary key, secondary index lưu PK nên phải tra thêm một lần. PK nên ngắn và tăng dần; UUID v4 ngẫu nhiên gây **page split**: page đích đã đầy mà dòng mới phải chen vào giữa, nên DB tách page thành hai, tốn ghi và để lại page nửa trống. PostgreSQL lưu bảng dạng **heap** (dòng nằm theo thứ tự được ghi, không sắp theo khoá nào), mọi index trỏ tới vị trí dòng trong heap. Phần InnoDB chỉ mô tả cơ chế, chưa đo.",
      ],
      widget: "covering-index",
      widgetTitle: "Khi nào được Index Only Scan",
      quiz: {
        question: "Vì sao UUID v4 làm primary key trong MySQL bị chê?",
        options: [
          "UUID không unique",
          "Insert rơi vào vị trí ngẫu nhiên trong clustered index gây page split, và 16 byte lặp lại trong mọi secondary index",
          "MySQL không hỗ trợ UUID",
          "UUID làm transaction không atomic",
        ],
        answer: 1,
        explain: "Cần UUID thì dùng loại có thứ tự thời gian (UUID v7, ULID), hoặc giữ BIGINT làm PK nội bộ.",
      },
    },
    {
      id: "cost",
      title: "Phần 6: Cái giá của index và ACID",
      scene: "cost",
      intro: [
        "Mỗi INSERT và UPDATE phải cập nhật mọi index liên quan. Đã đo insert 200.000 dòng: chỉ PK 2,8–4,2 s, thêm 3 index 4,7–10,5 s. Bốn index của bảng 1 triệu dòng chiếm 80 MB, nặng hơn cả bảng 59 MB.",
        "Chỉ đánh index cho cột trong WHERE, JOIN, ORDER BY của query hay chạy. PostgreSQL **không** tự tạo index cho khoá ngoại (InnoDB có). Xoá index có `idx_scan = 0` lâu ngày trong `pg_stat_user_indexes`. Trên production dùng `create index concurrently`: tạo index mà không khoá việc ghi vào bảng trong lúc tạo (chậm hơn, nhưng ứng dụng vẫn chạy).",
      ],
      quiz: {
        question: "Vì sao bảng ghi liên tục không nên có quá nhiều index?",
        options: [
          "Vì PostgreSQL giới hạn số index",
          "Vì mỗi INSERT và UPDATE phải cập nhật mọi index liên quan, và index còn chiếm dung lượng",
          "Vì index làm sai kết quả truy vấn",
          "Vì index chỉ dùng được cho SELECT *",
        ],
        answer: 1,
        explain: "Đã đo: thêm 3 index làm insert 200.000 dòng chậm từ 2,8–4,2 s lên 4,7–10,5 s, và bốn index nặng hơn cả bảng. PostgreSQL không giới hạn kiểu đó, và index không làm sai kết quả.",
      },
      parts: [
        {
          id: "cost-acid",
          title: "ACID, và chữ C khác với CAP",
          intro: [
            "Index chỉ là một phần của database; câu phỏng vấn hay nối sang **ACID**, bốn bảo đảm của transaction, và cơ chế thực hiện từng chữ. **Atomicity** (làm trọn hoặc không làm gì): undo log, WAL. **Consistency** (sau transaction dữ liệu vẫn thoả mọi ràng buộc như UNIQUE, FOREIGN KEY, CHECK): ràng buộc. **Isolation** (transaction chạy cùng lúc không thấy phần dở của nhau): lock, MVCC. **Durability** (đã báo commit thì không mất dù sập nguồn): ghi WAL hoặc redo log xuống đĩa trước khi báo commit.",
            "Đừng nhầm với **CAP**, định lý về hệ phân tán nhiều node: khi mạng giữa các node bị đứt (Partition), hệ chỉ giữ được một trong hai, **Consistency** (mọi node trả cùng một dữ liệu mới nhất) hoặc **Availability** (node nào cũng trả lời). Chữ C của CAP nói về các bản sao giống nhau; chữ C của ACID nói về ràng buộc dữ liệu. Hai khái niệm chỉ trùng tên.",
          ],
          quiz: {
            question: "Consistency trong ACID khác Consistency trong CAP thế nào?",
            options: [
              "Giống nhau",
              "ACID: dữ liệu thoả ràng buộc sau transaction; CAP: mọi node thấy cùng dữ liệu tại cùng thời điểm",
              "ACID nói về replica, CAP nói về constraint",
              "CAP chỉ áp dụng cho SQL",
            ],
            answer: 1,
            explain: "Hai khái niệm khác nhau, chỉ trùng tên.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Khi API chậm em chạy EXPLAIN ANALYZE trên dữ liệu gần thật. Em đã thử bảng 1 triệu order: không index thì Seq Scan bỏ qua gần 1 triệu dòng, khoảng 100 ms; thêm index B+Tree thì đọc đúng 13 dòng, dưới 1 ms. Composite index tuân theo leftmost prefix nên em đặt cột so sánh bằng trước, cột range hoặc sort sau; index (customer_id, created_at) còn giúp lấy 5 đơn mới nhất mà không cần sort. Index bị bỏ qua khi bọc cột trong hàm, ép kiểu, wildcard đầu, hoặc khi điều kiện lấy phần lớn bảng, và lúc đó Seq Scan là đúng. Em dùng covering index để có Index Only Scan, tránh select *. Index không miễn phí: em đo insert chậm hơn khoảng gấp đôi khi thêm 3 index, nên chỉ đánh index cho query hay chạy, nhớ index cột khoá ngoại trên PostgreSQL, và dùng create index concurrently trên production.",
};
