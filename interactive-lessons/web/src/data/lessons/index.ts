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
        "Câu có tham số (`where status = ?` từ ứng dụng) còn một chuyện nữa: database có thể lưu plan và dùng lại cho giá trị khác. Chuyện đó nằm ở bài Index và Execution Plan, phần plan cache.",
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
      parts: [
        {
          id: "explain-buffers",
          title: "BUFFERS, và phép nhân loops × thời gian",
          intro: [
            "Phần trên dạy đọc loại scan và `Rows Removed by Filter`. Nhưng thời gian đổi mỗi lần chạy, còn bạn cần một con số ổn định để so hai cách viết. Thêm `BUFFERS`: `EXPLAIN (ANALYZE, BUFFERS) ...`.",
            "- **`shared hit`**: số page lấy từ bộ nhớ đệm của PostgreSQL.",
            "- **`shared read`**: số page phải xin ngoài bộ nhớ đệm (hệ điều hành hoặc đĩa). Chạy lại lần hai thì `read` thường thành `hit`, nên so sánh nên nhìn tổng `hit + read`.",
            "Số đo của tác giả trên PostgreSQL 18.3 (chạy ngoài trang, bạn không chạy lại được trong trang), bảng thử 300.000 dòng, index trên `entry_id`: `where entry_id = 12345` cho `Index Scan ... (actual rows=1.00 loops=1)` và `Buffers: shared hit=1 read=3`, tức 4 buffer cho một dòng. Dùng số này để so, thay vì mili giây.",
            "Cái bẫy hay gặp là **`loops`**. Trong node nằm bên trong vòng lặp (phía trong của Nested Loop), `actual time` và `rows` là số **trung bình cho mỗi lần lặp**, không phải tổng. Tổng thời gian của node bằng `actual time` × `loops`. Cùng bảng đó nối với bảng 3.000 tài khoản. **Nested Loop** là kiểu nối lồng nhau: với mỗi dòng của bảng ngoài, tra một lần bảng trong (các kiểu nối khác học ở bài SQL Index và Execution Plan). Planner mặc định chọn Hash Join, nên số đo dưới đây tắt hai kiểu kia bằng `enable_hashjoin` và `enable_mergejoin` để ép Nested Loop:",
            "`Nested Loop  (actual time=0.049..14.531 rows=30000.00 loops=1)`\n\n`  ->  Index Only Scan using e_acc on e  (actual time=0.010..0.044 rows=100.00 loops=300)`",
            "Node trong chỉ hiện `0.044` ms, nhìn tưởng nhỏ. Nhưng nó chạy 300 lần: 0,044 × 300 ≈ 13 ms, gần hết 14,5 ms của cả Nested Loop. Và `rows=100.00` là 100 dòng mỗi lần, 100 × 300 = 30.000 dòng đúng bằng `rows=30000.00` của Nested Loop. Cũng ở dòng đó có `Heap Fetches: 30000`: bảng thử chưa `VACUUM` nên Index Only Scan vẫn phải mở bảng (Phần 5).",
            "Một dấu hiệu nữa nằm ở node `Sort`: `Sort Method: external merge  Disk: ...kB` nghĩa là dữ liệu cần sắp không vừa `work_mem` nên phải ghi tạm ra đĩa. Dòng này chưa chạy trong bài, bạn sẽ gặp nó khi sắp nhiều dòng với `work_mem` nhỏ.",
          ],
          takeaway: {
            lines: [
              "So hai cách viết bằng `Buffers`, ổn định hơn mili giây.",
              "Node nằm trong vòng lặp: tổng = `actual time` × `loops`, tổng dòng = `rows` × `loops`.",
            ],
          },
          quiz: {
            question: "Một node có `actual time=0.010..0.044 rows=100 loops=300`. Node này tốn khoảng bao nhiêu thời gian tổng cộng?",
            options: [
              "0,044 ms",
              "Khoảng 13 ms (0,044 × 300)",
              "Khoảng 30.000 ms",
              "Không tính được từ plan",
            ],
            answer: 1,
            explain: "Với node chạy nhiều lần, `actual time` là trung bình mỗi lần lặp. Nhân với `loops` mới ra tổng. Cũng vậy, `rows` nhân `loops` mới ra tổng số dòng.",
          },
        },
        {
          id: "explain-scan-kind",
          title: "Cùng tên Index Scan, đọc một dòng hay 100.000 dòng",
          intro: [
            "Plan chỉ ghi `Index Scan` thì bạn đang xem việc đọc một dòng hay một trăm nghìn dòng? PostgreSQL không đổi tên node giữa hai trường hợp đó; hãy nhìn `rows` và `Buffers`.",
            "Index **UNIQUE** với điều kiện `=`: database tìm thấy một entry là biết không còn entry nào khác, nên dừng ngay. Index **không unique** với `=`: tìm thấy entry đầu xong vẫn phải đọc tiếp tới khi gặp key khác, ít nhất là một entry thừa, và có thể sang page lá kế tiếp. Đó là **range scan** dù điều kiện là dấu bằng.",
            "Số đo của tác giả trên PostgreSQL 18.3 (chạy ngoài trang, bạn không chạy lại được trong trang), bảng thử 300.000 dòng: `entry_id = 12345` (một dòng) là `Index Scan` với 4 buffer. `account_id = 'AC00000123'` (index không unique, 100 dòng) planner chọn `Bitmap Heap Scan` với `Heap Blocks: exact=100` và 103 buffer. Cùng kiểu `=`, nhưng công việc khác nhau hai bậc.",
            "Tên node ở các engine khác giúp phân biệt rõ hơn: Oracle ghi `INDEX UNIQUE SCAN` và `INDEX RANGE SCAN`, MySQL ghi cột `type` là `const` hoặc `eq_ref` (khoá duy nhất) và `ref` (không duy nhất).",
          ],
          takeaway: {
            lines: [
              "`=` trên cột UNIQUE đọc đúng một entry; `=` trên cột không unique vẫn là quét một đoạn.",
              "Trong PostgreSQL, tên node không nói điều này: đọc `rows` và `Buffers`.",
            ],
          },
          quiz: {
            question: "Hai query đều là `Index Scan` với `=`. Làm sao biết query nào đọc nhiều dòng hơn?",
            options: [
              "Không thể biết, tên node giống nhau",
              "Nhìn `rows` thực tế và `Buffers` của node",
              "Nhìn tên bảng",
              "Cái nào có `Index Cond` thì đọc nhiều hơn",
            ],
            answer: 1,
            explain: "PostgreSQL không phân biệt unique scan và range scan bằng tên node. `rows` và `Buffers` cho thấy khối lượng đọc thật.",
          },
        },
      ],
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
      parts: [
        {
          id: "composite-depth",
          title: "Cột nào thật sự thu hẹp việc đọc",
          intro: [
            "Leftmost prefix cho biết index có **dùng được** hay không. Nhưng dùng được chưa nói là dùng **sâu** tới đâu: có cột chỉ được dùng để lọc từng entry sau khi database đã đọc hết một đoạn lớn.",
            "Index `(a, b, c)` sắp theo `a`, trong cùng `a` sắp theo `b`, trong cùng `(a, b)` sắp theo `c`. Database chỉ đọc được **một đoạn liền** khi các cột đứng đầu bị cố định bằng `=`. Hai loại điều kiện:",
            "- **Access predicate**: điều kiện thu hẹp đoạn index phải đọc.",
            "- **Filter predicate** (trong index): điều kiện trên cột đứng sau chỗ đoạn đọc đã hết liền. Database vẫn đọc cả đoạn, rồi loại từng entry không khớp.",
            "Luật đọc từ trái sang phải: các cột `=` liên tiếp là access. Cột **khoảng** đầu tiên (`>`, `<`, `BETWEEN`) vẫn là access nhưng **kết thúc** việc thu hẹp. Mọi điều kiện đứng sau nó, hoặc đứng sau một cột không có điều kiện, chỉ còn là filter. PostgreSQL ghi cả hai loại dưới `Index Cond`, nên EXPLAIN không tách chúng; chỉ `Buffers` hay thời gian cho thấy.",
            "Từ đó suy ra chuyện hay bị nhầm: **\"đặt cột chọn lọc nhất lên đầu\"** không phải luật. Số đo của tác giả trên PostgreSQL 18.3 (chạy ngoài trang, bạn không chạy lại được trong trang), bảng thử 300.000 dòng, cột `a` có 1.000 giá trị, cột `b` có 50 giá trị, query `where a between 100 and 500 and b = 7` trả 2.400 dòng. Index `(a, b)` (cột nhiều giá trị đứng trước, nhưng là khoảng) chạm 108 buffer ở Bitmap Index Scan. Index `(b, a)` (cột `=` đứng trước) chỉ chạm 5. Cả hai cùng đọc 868 block của bảng. Cột `a` chọn lọc hơn, nhưng vì `a` là khoảng nên đặt nó trước thì `b` mất tác dụng thu hẹp.",
            "Hệ quả khác: hai điều kiện khoảng trên hai cột khác nhau thì index chỉ thu hẹp được theo cột khoảng đầu, cột kia là filter. Và đổi thứ tự cột để tối ưu một query có thể làm hỏng query khác đang dựa vào cột đứng đầu cũ. Thử các điều kiện trên 36 entry của index `(A, B, C)`.",
          ],
          predict: {
            question: "Index `(A, B, C)`, câu `where A = 2 and B >= 2 and C = 3`. Cột `C` đóng vai trò gì?",
            options: [
              "Access predicate như A và B, vì có điều kiện bằng",
              "Filter: B là khoảng nên đã kết thúc việc thu hẹp, C chỉ được kiểm tra trên các entry đã đọc",
              "Bị bỏ qua hoàn toàn, không kiểm tra",
              "Làm index không dùng được",
            ],
            answer: 1,
            explain: "Cột khoảng đầu tiên (B) vẫn thu hẹp được đoạn, nhưng sau nó các entry không còn nằm liền theo C. Điều kiện C = 3 vẫn được kiểm tra nhưng chỉ trên entry trong đoạn.",
          },
          widget: "composite-ladder",
          widgetTitle: "Access, filter hay không dùng",
          after: [
            "Thử kịch bản `A =, B khoảng, C =`: entry phải đọc nhiều hơn số khớp, phần dư đến từ C. Chuyển B về `=`: đoạn đọc co lại chính bằng số khớp. Thử `A = và C = (bỏ B)`: C trở thành filter vì B không có điều kiện. Thử `Chỉ B =`: không có access predicate nào, phải đọc cả index.",
          ],
          takeaway: {
            lines: [
              "Cột `=` đặt trước, cột khoảng đặt sau, và chỉ một cột khoảng có tác dụng thu hẹp.",
              "\"Chọn lọc nhất đứng đầu\" chỉ đúng khi các cột cùng là `=`.",
            ],
          },
          quiz: {
            question: "Index `(a, b, c)`, câu `where a = 1 and b > 5 and c = 3`. Điều kiện nào chỉ là filter bên trong index?",
            options: [
              "a = 1",
              "b > 5",
              "c = 3",
              "Cả ba đều là access",
            ],
            answer: 2,
            explain: "a = 1 và b > 5 thu hẹp đoạn đọc. Sau cột khoảng b thì entry không còn nằm liền theo c, nên c = 3 chỉ lọc từng entry trong đoạn đó.",
          },
        },
      ],
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
      parts: [
        {
          id: "heap-order",
          title: "Thứ tự của index khác thứ tự của bảng",
          intro: [
            "Ta đã thấy lấy 70% bảng thì optimizer chọn Seq Scan. Nhưng ngưỡng thật thấp hơn nhiều người tưởng: trên bảng ghi ngẫu nhiên, chỉ vài phần trăm dòng đã đủ làm Index Scan thua. Vì sao?",
            "Index luôn sắp theo khoá. Còn bảng (**heap** trong PostgreSQL) nằm theo **thứ tự ghi**: dòng insert trước nằm trước, không liên quan gì tới giá trị khoá. Hai thứ tự này có thể khác hẳn nhau.",
            "Index Scan đi theo thứ tự khoá, và với mỗi entry nó nhảy tới đúng vị trí của dòng trong bảng. Nếu các dòng kế nhau theo khoá lại nằm ở những block khác nhau, mỗi dòng là một lần nhảy sang block khác: đọc **ngẫu nhiên** (random I/O), đắt hơn đọc tuần tự. PostgreSQL tính điều đó bằng hai tham số: `seq_page_cost` (mặc định 1) và `random_page_cost` (mặc định 4). Đã chạy `show` trên PostgreSQL 18.3: đúng 4 và 1. Mức xáo trộn của một cột được ghi ở `correlation` trong `pg_stats`: gần 1 là bảng nằm theo thứ tự cột, gần 0 là dòng rải ngẫu nhiên.",
            "**Bitmap Heap Scan** là cách ở giữa: tra index trước để gom địa chỉ mọi dòng khớp, sắp theo vị trí trong bảng, rồi mở mỗi block đúng một lần theo thứ tự. (Dòng `Recheck Cond` đi kèm node này chỉ là bước kiểm tra lại điều kiện khi bitmap phải nhớ cả block thay vì từng dòng; bạn chưa cần để ý nó.)",
            "Số đo của tác giả trên PostgreSQL 18.3 (chạy ngoài trang, bạn không chạy lại được trong trang): hai bảng thử 30.000 dòng, 384 block, cùng nội dung và cùng index trên cột `k`. Bảng thứ nhất ghi theo thứ tự `k` (`correlation` = 1), bảng thứ hai ghi ngẫu nhiên (tạo bằng `ORDER BY random()`, `correlation` = -0,007). Tắt bớt loại scan bằng `enable_seqscan` và các tham số cùng họ để xem từng cách. Số dưới đây là số lần chạm buffer (`Buffers`), không phải mili giây:",
            "- **Bảng ngẫu nhiên, lấy 5% (1.500 dòng)**: Index Scan 1.503, Bitmap Heap Scan 373, Seq Scan 384.",
            "- **Bảng ngẫu nhiên, lấy 20% (6.000 dòng)**: Index Scan 6.001, Bitmap Heap Scan 389. Seq Scan luôn là 384 vì bảng chỉ có 384 block (đã chạy ở mức 5%).",
            "- **Bảng ghi theo thứ tự khoá, lấy 20%**: Index Scan chỉ 93.",
            "Khi để planner tự chọn, nó chọn Bitmap Heap Scan cho cả 30 dòng, 5% và 20% của bảng ngẫu nhiên, còn bảng theo thứ tự khoá thì chọn Index Scan ở mức 20%. Bảng thử nhỏ và nằm sẵn trong bộ nhớ nên chi phí đĩa thật chưa hiện ra, nhưng số lần phải nhảy sang block khác thì đã rõ. Kéo thanh phần trăm và đổi thứ tự ghi để xem mô hình đếm block.",
          ],
          predict: {
            question: "Bảng 30.000 dòng (384 block) được ghi ngẫu nhiên so với khoá. Lấy 5% số dòng (1.500 dòng) bằng Index Scan. Số lần chạm vào heap gần với con số nào nhất?",
            options: [
              "Khoảng 20, vì 5% của 384 block",
              "Khoảng 1.500, gần như mỗi dòng một lần vì các dòng rải khắp bảng",
              "Đúng 384, bằng Seq Scan",
              "Đúng 1 lần",
            ],
            answer: 1,
            explain: "Dòng kế nhau theo khoá nằm ở block khác nhau, nên Index Scan mở block theo từng entry, mỗi dòng một lần. Số đo thật ở trên là 1.503, trong khi toàn bảng chỉ có 384 block.",
          },
          widget: "heap-order",
          widgetTitle: "Index Scan, Bitmap hay Seq Scan: đếm block chạm",
          after: [
            "Với bảng ghi ngẫu nhiên, kéo tới 5%: mô hình cho Index Scan khoảng 1.500 lần chạm, Bitmap khoảng 376 block, Seq Scan 384 block. Gần với số đo thật (1.503, 373, 384). Đổi sang bảng cùng thứ tự khoá: Index Scan chỉ chạm một dải block liền nhau ở mọi mức.",
            "Vì vậy cột tăng dần theo thời gian ghi (như `created_at`, khoá tự tăng) thường lấy theo khoảng rất rẻ, còn cột rải ngẫu nhiên (như `customer_id` trên bảng đơn hàng) thì không. Muốn sắp lại bảng theo một index thì dùng `CLUSTER` (sắp một lần, không giữ thứ tự khi ghi tiếp), hoặc dùng clustered index của InnoDB (Phần 5).",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Index theo thứ tự khoá, bảng theo thứ tự ghi → mỗi dòng khớp có thể là một lần nhảy ngẫu nhiên → Index Scan thua Bitmap, rồi thua Seq Scan khi lấy vài phần trăm dòng.",
              "Bitmap Heap Scan gom block rồi đọc theo thứ tự nên chịu được số dòng lớn hơn Index Scan.",
            ],
          },
          quiz: {
            question: "Bảng ghi ngẫu nhiên, lấy 5% dòng qua index. Vì sao Bitmap Heap Scan chạm ít block hơn Index Scan?",
            options: [
              "Vì bitmap bỏ qua điều kiện WHERE",
              "Vì bitmap sắp địa chỉ theo vị trí trong bảng và mở mỗi block một lần, còn Index Scan mở block theo từng entry",
              "Vì bitmap không dùng index",
              "Vì bitmap chỉ chạy được trên bảng nhỏ",
            ],
            answer: 1,
            explain: "Bitmap Index Scan gom địa chỉ trước, Bitmap Heap Scan đọc mỗi block một lần theo thứ tự. Index Scan đi theo thứ tự khoá nên cứ entry kế tiếp trỏ sang block khác là mở lại.",
          },
        },
      ],
    },
    {
      id: "covering",
      title: "Phần 5: Covering index và clustered index",
      scene: "covering",
      intro: [
        "Index chứa mọi cột query cần thì DB không phải sang bảng: `Index Only Scan`, `Heap Fetches: 0`. Thêm cột ngoài index thì phải đọc bảng; `INCLUDE (total)` (PostgreSQL 11+) đưa cột vào leaf chỉ để đọc. Đã thử lại: ngay sau khi insert vẫn ra Bitmap Heap Scan, chạy `VACUUM` xong mới ra Index Only Scan. Lý do: index không ghi dòng nào còn \"nhìn thấy được\" với transaction hiện tại, nên PostgreSQL tra **visibility map**, một bản đồ nhỏ đánh dấu page nào chỉ chứa dòng mà mọi transaction đều thấy. Page chưa được đánh dấu (vừa insert, chưa `VACUUM`) thì vẫn phải mở bảng để kiểm tra. `select *` làm mất lợi ích này.",
      ],
      widget: "covering-index",
      widgetTitle: "Khi nào được Index Only Scan",
      quiz: {
        question: "Bảng vừa insert nhiều dòng, chưa chạy `VACUUM`. Query chỉ cần các cột nằm trong index vẫn ra Bitmap Heap Scan chứ chưa phải Index Only Scan. Vì sao?",
        options: [
          "Vì index không chứa cột đó",
          "Vì visibility map chưa đánh dấu các page mới là \"mọi transaction đều thấy\", nên PostgreSQL vẫn phải mở bảng kiểm tra",
          "Vì Index Only Scan chỉ có ở MySQL",
          "Vì `VACUUM` là điều kiện bắt buộc để tạo index",
        ],
        answer: 1,
        explain: "Index không ghi dòng còn nhìn thấy được hay không. PostgreSQL chỉ bỏ qua bảng với page đã được visibility map đánh dấu, và `VACUUM` là thứ cập nhật bản đồ đó.",
      },
      parts: [
        {
          id: "clustered-vs-heap",
          title: "Clustered index (MySQL) và heap (PostgreSQL)",
          intro: [
            "Phần trên nói index trỏ về bảng. Cách bảng được lưu thì khác nhau giữa hai engine, và nó ảnh hưởng chuyện chọn khoá chính.",
        "MySQL InnoDB là **clustered index**: bảng chính là B+Tree theo primary key, secondary index lưu PK nên phải tra thêm một lần. PK nên ngắn và tăng dần; UUID v4 ngẫu nhiên gây **page split**: page đích đã đầy mà dòng mới phải chen vào giữa, nên DB tách page thành hai, tốn ghi và để lại page nửa trống. PostgreSQL lưu bảng dạng **heap** (dòng nằm theo thứ tự được ghi, không sắp theo khoá nào), mọi index trỏ tới vị trí dòng trong heap. Phần InnoDB chỉ mô tả cơ chế, chưa đo.",
          ],
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
          id: "index-filter",
          title: "Điều kiện trong index: access, index filter, table filter",
          intro: [
            "Phần 3 đã tách điều kiện thu hẹp đoạn đọc (access) khỏi điều kiện chỉ lọc từng entry trong index. Còn một loại thứ ba: điều kiện mà index không đánh giá, chỉ kiểm tra sau khi đã mở dòng trong bảng. Ba loại, ba mức tốn kém:",
            "- **Access predicate**: thu hẹp đoạn index phải đọc.",
            "- **Index filter**: kiểm tra ngay trên entry của index, trước khi mở bảng. Cột phải nằm trong index (cột khóa hoặc `INCLUDE`). Dòng bị loại không tốn lần mở bảng nào.",
            "- **Table filter**: kiểm tra sau khi đã mở dòng trong bảng. Dòng bị loại đã tốn công mở bảng rồi mới bị bỏ.",
            "Ví dụ `booking_date = '2024-03-01' AND narrative LIKE '%7%'`. `LIKE '%7%'` không thu hẹp được đoạn đọc nên không thể là access, nhưng nó có thể là index filter hoặc table filter. Đã chạy `EXPLAIN (ANALYZE, BUFFERS)` trên PGlite 18, bảng thử 30.000 dòng của bài Index và Execution Plan: ngày đó có 83 entry trong index, chỉ 21 dòng khớp LIKE.",
            "- **Index `(booking_date)`**: `Bitmap Heap Scan`, `Filter` chạy ở bảng, mở 83 block rồi loại 62 dòng. Buffers 85.",
            "- **Index `(booking_date) INCLUDE (narrative)`, `SELECT narrative`** (sau `VACUUM`): `Index Only Scan`, `Filter` vẫn hiện nhưng chạy trên entry của index, `Heap Fetches: 0`. Buffers 3.",
            "- **Cùng index đó, nhưng `SELECT *`**: quay về `Bitmap Heap Scan` mở 83 block, Buffers 85. `INCLUDE` chưa đủ nếu danh sách `SELECT` còn cột ngoài index.",
            "Với cả tháng 3 (`booking_date >= '2024-03-01' AND booking_date < '2024-04-01'`) index trả 2.553 entry và 871 dòng khớp: không `INCLUDE` mở 109 block (Buffers 113), có `INCLUDE` và `SELECT narrative` thì `Heap Fetches: 0`, Buffers 16. Càng nhiều entry bị loại thì index filter càng có lợi.",
            "EXPLAIN của PostgreSQL gọi cả hai loại là `Filter`. Phân biệt bằng node đứng trên nó (`Index Only Scan`) và dòng `Heap Fetches`.",
            "Từ đó có công thức xếp cột khi thiết kế index (một hướng dẫn, đã kiểm chứng ở ví dụ trên chứ chưa đo cho mọi trường hợp):",
            "- Cột so bằng `=`: làm khóa đầu.",
            "- Cột khoảng hoặc cột `ORDER BY`: làm khóa tiếp theo (bài Index và Execution Plan có phần ESR).",
            "- Cột chỉ dùng để lọc theo kiểu index không tìm được (như `LIKE '%x%'`), và cột chỉ có trong `SELECT`: đặt vào `INCLUDE`. Chúng chỉ nằm ở lá nên không làm các node phía trên to ra.",
            "- Có index gần đúng rồi thì mở rộng nó thay vì thêm index mới: mỗi index thêm là thêm một lần ghi cho mọi `INSERT` (Phần 6).",
            "Chọn thiết kế index và danh sách `SELECT` để xem lần mở bảng thay đổi.",
          ],
          predict: {
            question: "Index `(booking_date) INCLUDE (narrative)`. Câu `SELECT * ... WHERE booking_date = '2024-03-01' AND narrative LIKE '%7%'` mở bảng bao nhiêu lần?",
            options: [
              "0 lần, vì narrative nằm trong index",
              "Khoảng 83 lần: `SELECT *` cần các cột ngoài index nên vẫn phải mở bảng cho từng dòng",
              "21 lần, đúng số dòng khớp",
              "Một lần duy nhất",
            ],
            answer: 1,
            explain: "Đã chạy: Bitmap Heap Scan mở 83 block, Buffers 85, y như khi không có INCLUDE. Muốn Heap Fetches: 0, danh sách SELECT cũng phải nằm hết trong index.",
          },
          widget: "predicate-roles",
          widgetTitle: "Điều kiện nằm ở đâu: index hay bảng",
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Điều kiện không thu hẹp được đoạn đọc → là filter. Cột có trong index và `SELECT` chỉ cần cột trong index → index filter, không mở bảng cho dòng bị loại.",
              "Thiếu một trong hai (cột không có trong index, hoặc `SELECT *`) → table filter: mở bảng cho mọi entry rồi mới loại.",
            ],
          },
          quiz: {
            question: "Index `(booking_date) INCLUDE (narrative)`, `SELECT narrative ... WHERE booking_date = ? AND narrative LIKE '%7%'`, sau `VACUUM`. Dòng `Heap Fetches` ghi bao nhiêu?",
            options: ["Bằng số entry của ngày đó (83)", "Bằng số dòng khớp LIKE (21)", "0", "1"],
            answer: 2,
            explain: "LIKE được kiểm tra trên entry của index (index filter), và bảng không cần mở vì mọi cột SELECT đã có trong index. Đã chạy: Heap Fetches: 0.",
          },
        },
      ],
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
