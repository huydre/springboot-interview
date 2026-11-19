import timeline from "../timelines/index.json";
import type { Lesson, Scene } from "../types";

// Measured on PostgreSQL 16 (orders 1M rows, customer 100k rows, parallel query off); see study note 03.06.
// Plan shapes re-checked on a fresh postgres:16-alpine.
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
        "Không có index, tìm `customer_id = 4242` buộc DB đọc từng dòng (full table scan). Index giống mục lục cuối sách: giá trị đã sắp xếp, mỗi giá trị trỏ tới dòng. Kiểu mặc định của PostgreSQL và MySQL là **B+Tree**: cây thấp và rộng, mỗi node là một page (8 KB ở PostgreSQL, 16 KB ở InnoDB) chứa hàng trăm key, nên 1 triệu dòng chỉ cần 3–4 tầng.",
        "Dữ liệu chỉ nằm ở leaf, và các leaf nối với nhau: B+Tree giỏi cả `=`, khoảng (`BETWEEN`, `>`) và `ORDER BY`. Đã đo: không index thì Seq Scan bỏ qua 999.987 dòng, 99 ms; có index thì đọc đúng 13 dòng, 0,26 ms, nhanh khoảng 400 lần. Index chiếm 30 MB, bảng 59 MB.",
      ],
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
    {
      id: "explain",
      title: "Phần 2: Đọc EXPLAIN ANALYZE",
      scene: "explain",
      intro: [
        "`EXPLAIN` chỉ lập kế hoạch, cho số **ước lượng**. `EXPLAIN ANALYZE` **chạy thật**, cho thời gian và số dòng thực tế: với UPDATE hay DELETE phải bọc trong `BEGIN ... ROLLBACK`. Plan đọc từ trong ra ngoài.",
        "Nhìn 4 thứ: loại scan (`Seq Scan`, `Index Scan`, `Bitmap Heap Scan`, `Index Only Scan`), `Rows Removed by Filter` (đọc thừa bao nhiêu), rows ước lượng so với actual (lệch nhiều thì chạy `ANALYZE`), và Execution Time. Phân biệt `Index Cond` (dùng để đi trong index) với `Filter` (lọc sau khi đã lấy dòng). MySQL thì xem cột `type` (`ALL` là full scan), `key`, `rows`, `Extra` (`Using filesort` là xấu, `Using index` là covering).",
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
        "Index lưu **giá trị gốc của cột**. Bọc cột trong hàm, phép tính hay ép kiểu là tạo giá trị khác: `customer_id + 0`, `created_at::date = ...` (viết lại thành `>= ... and < ...`), `lower(email)` (cần expression index), `customer_id = 4242.0` (PostgreSQL ép cột int sang numeric), wildcard đầu `like '%abc'` (cần `pg_trgm`). Biến đổi phía hằng số, đừng biến đổi phía cột. MySQL so `VARCHAR` với số thì ép từng dòng và bỏ index: bẫy số điện thoại lưu chuỗi mà code truyền `Long`.",
        "Bất ngờ khi đo: với collation `en_US.utf8` (mặc định của image Docker), `like 'user4242%'` cũng Seq Scan; cần index `text_pattern_ops`. Và **selectivity**: `status = 'PAID'` (70% bảng) optimizer cố ý chọn Seq Scan, 339 ms; `status = 'REFUNDED'` (0,5%) mới dùng index. Đó không phải lỗi.",
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
        "Index chứa mọi cột query cần thì DB không phải sang bảng: `Index Only Scan`, `Heap Fetches: 0`. Thêm cột ngoài index thì phải đọc bảng; `INCLUDE (total)` (PostgreSQL 11+) đưa cột vào leaf chỉ để đọc. Đã thử lại: ngay sau khi insert vẫn ra Bitmap Heap Scan, chạy `VACUUM` xong mới ra Index Only Scan, vì PostgreSQL cần visibility map. `select *` làm mất lợi ích này.",
        "MySQL InnoDB là **clustered index**: bảng chính là B+Tree theo primary key, secondary index lưu PK nên phải tra thêm một lần. PK nên ngắn và tăng dần; UUID v4 ngẫu nhiên gây page split. PostgreSQL lưu bảng dạng heap, mọi index trỏ tới vị trí dòng. Phần InnoDB chỉ mô tả cơ chế, chưa đo.",
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
        "Chỉ đánh index cho cột trong WHERE, JOIN, ORDER BY của query hay chạy. PostgreSQL **không** tự tạo index cho khoá ngoại (InnoDB có). Xoá index có `idx_scan = 0` lâu ngày trong `pg_stat_user_indexes`. Trên production dùng `create index concurrently`. ACID: Atomicity (undo log, WAL), Consistency (ràng buộc), Isolation (lock, MVCC), Durability (ghi WAL hoặc redo log trước khi báo commit).",
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
  modelAnswer:
    "Khi API chậm em chạy EXPLAIN ANALYZE trên dữ liệu gần thật. Em đã thử bảng 1 triệu order: không index thì Seq Scan bỏ qua gần 1 triệu dòng, khoảng 100 ms; thêm index B+Tree thì đọc đúng 13 dòng, dưới 1 ms. Composite index tuân theo leftmost prefix nên em đặt cột so sánh bằng trước, cột range hoặc sort sau; index (customer_id, created_at) còn giúp lấy 5 đơn mới nhất mà không cần sort. Index bị bỏ qua khi bọc cột trong hàm, ép kiểu, wildcard đầu, hoặc khi điều kiện lấy phần lớn bảng, và lúc đó Seq Scan là đúng. Em dùng covering index để có Index Only Scan, tránh select *. Index không miễn phí: em đo insert chậm hơn khoảng gấp đôi khi thêm 3 index, nên chỉ đánh index cho query hay chạy, nhớ index cột khoá ngoại trên PostgreSQL, và dùng create index concurrently trên production.",
};
