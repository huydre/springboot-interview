import timeline from "../timelines/sql-optimize.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 12. Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// The scratch table is built with fixed formulas and ANALYZE reads all 30000 rows, so EXPLAIN text is identical on every fresh run.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.

/** Builds the scratch table. Starts with DROP TABLE IF EXISTS so the script can be run again and again. */
const setup = (rows: number | string) => `DROP TABLE IF EXISTS scratch_entry;
CREATE TABLE scratch_entry AS
SELECT g AS entry_id,
       'AC' || lpad((g % 3000)::text, 8, '0') AS account_id,
       (g % 9 + 1) * 1000 AS amount,
       DATE '2024-01-01' + (g % 365) AS booking_date,
       CASE WHEN g % 100 = 0 THEN 'REVERSED' ELSE 'POSTED' END AS status,
       'Giao dich so ' || g AS narrative
FROM generate_series(1, ${rows}) AS g;
ANALYZE scratch_entry;`;

const SETUP = setup(30000);

export const sqlOptimize: Lesson = {
  slug: "sql-optimize",
  crumb: "Index và Execution Plan",
  videoDir: "/videos/sql-optimize",
  videoVersion: "0b64e5a0",
  scenes: timeline as Scene[],
  title: "Index và Execution Plan",
  subtitle:
    "Một câu SQL đúng chưa chắc đã nhanh. Index giúp database tìm dòng như tra mục lục sách, còn EXPLAIN cho bạn xem database định tìm bằng cách nào. Bài này dạy tạo index, đọc kế hoạch thực thi, biết khi nào index không giúp được gì và vì sao không nên đặt index tràn lan.",
  openingQuiz: {
    question: "Bảng có 30.000 dòng, bạn tìm đúng một bút toán theo mã mà bảng chưa có index nào trên cột đó. Database phải làm gì?",
    options: [
      "Nhảy thẳng tới dòng cần tìm, vì mã là duy nhất",
      "Đọc lần lượt từng dòng của bảng và kiểm tra điều kiện",
      "Từ chối chạy và báo lỗi thiếu index",
      "Tự tạo một index tạm rồi mới tìm",
    ],
    answer: 1,
    explain: "Không có cấu trúc nào chỉ đường, nên database chỉ còn cách đọc từng dòng. Nó không biết mã là duy nhất nếu chưa có khoá chính hay index để bảo đảm điều đó, cũng không báo lỗi và không tự tạo index.",
  },
  roadmap: [
    "Chặng 1: index là gì, dựng bảng thử 30.000 dòng và đọc kế hoạch bằng EXPLAIN.",
    "Chặng 2: tạo index, so sánh trước và sau, nhận biết Index Scan, Bitmap, Sort và các phép nối.",
    "Chặng 3: khi index không được dùng, cái giá của index, index nhiều cột và khoá ngoại.",
  ],
  sections: [
    {
      id: "index-idea",
      title: "Phần 1: Index là gì và bảng thử 30.000 dòng",
      scene: "index-idea",
      intro: [
        "Hãy nghĩ tới một cuốn sách dày. Muốn tìm chữ \"lãi suất\", bạn có hai cách: lật từng trang từ đầu, hoặc mở **mục lục tra cứu** ở cuối sách, thấy ngay \"lãi suất: trang 214\" rồi mở đúng trang. Database cũng vậy. Khi không có gì chỉ đường, nó đọc lần lượt cả bảng, gọi là **quét tuần tự** (Sequential Scan, hiện trong kế hoạch là `Seq Scan`). Khi có **index**, nó tra index để biết dòng nằm ở đâu.",
        "Index trong PostgreSQL mặc định là **B-tree**: một cây cân bằng giữ các giá trị của cột theo thứ tự, mỗi giá trị kèm vị trí dòng. Tìm một giá trị chỉ cần đi qua vài tầng của cây, dù bảng có vài chục nghìn hay vài chục triệu dòng. Khoá chính luôn có sẵn một index, đó là lý do tìm theo `customer_id` hay `account_id` luôn nhanh.",
        "Bảng T24 chỉ có 932 bút toán, quá nhỏ để thấy khác biệt, nên PostgreSQL thường chọn quét cả bảng. Vì vậy trong bài này ta tự dựng một **bảng thử** tên `scratch_entry` với 30.000 bút toán giả bằng `generate_series(1, 30000)` (hàm sinh dãy số từ 1 đến 30000, mỗi số là một dòng) và `CREATE TABLE ... AS SELECT` (tạo bảng từ kết quả một câu `SELECT`). Các cột cần để ý:",
        "- **entry_id**: 1 đến 30000.",
        "- **account_id**: 3000 mã giả, mỗi mã có 10 bút toán.",
        "- **booking_date**: các ngày trong cả năm 2024.",
        "- **status**: 99% là `POSTED`, 1% là `REVERSED`.",
        "Ngoài ra còn `amount` và `narrative`. Các hàm chuỗi như `lpad` chỉ để sinh dữ liệu giả, bạn không cần nhớ. Lệnh `ANALYZE` cuối cùng cập nhật **thống kê** (bảng có bao nhiêu dòng, giá trị phân bố ra sao) để PostgreSQL ước lượng đúng.",
        "Đoạn dựng bảng thử được lặp ở đầu mỗi bài tập. Nó bắt đầu bằng `DROP TABLE IF EXISTS`, nên chạy lại bao nhiêu lần cũng được. Hãy giữ nguyên nó và chỉ viết phần bên dưới.",
      ],
      sql: [
        {
          prompt: "Điền số dòng cần sinh (30000) để dựng bảng thử, rồi đếm số dòng. Kết quả phải là 30000.",
          starter: `${setup("____")}\n\nSELECT count(*) AS so_dong FROM scratch_entry;`,
          solution: `${SETUP}\n\nSELECT count(*) AS so_dong FROM scratch_entry`,
          hint: "generate_series(1, 30000): số đầu là 1, số cuối là số dòng.",
        },
        {
          prompt: "Đếm số bút toán theo `status`, xếp theo `status`. Bạn sẽ thấy `POSTED` chiếm gần hết bảng và `REVERSED` rất ít. Điều này quan trọng ở Phần 5.",
          starter: `${SETUP}\n\nSELECT status, count(*) AS so_dong\nFROM scratch_entry\nGROUP BY ____\nORDER BY status;`,
          solution: `${SETUP}\n\nSELECT status, count(*) AS so_dong FROM scratch_entry GROUP BY status ORDER BY status`,
          ordered: true,
          hint: "Nhóm theo chính cột đang hiển thị.",
        },
      ],
      quiz: {
        question: "Vì sao khoá chính (ví dụ `customer_id`) tìm nhanh dù bạn chưa bao giờ gõ `CREATE INDEX`?",
        options: [
          "PostgreSQL tự tạo một index B-tree cho mỗi khoá chính khi tạo bảng",
          "PostgreSQL lưu các dòng của bảng theo thứ tự khoá chính trên đĩa",
          "Khoá chính được ghi nhớ trong bộ nhớ đệm của trình duyệt",
          "Khoá chính là kiểu dữ liệu đặc biệt không cần tìm kiếm",
        ],
        answer: 0,
        explain: "Ràng buộc khoá chính đòi hỏi giá trị duy nhất, và cách kiểm tra nhanh nhất là một index B-tree, nên PostgreSQL tạo nó tự động. Các dòng của bảng không tự xếp theo khoá chính, trình duyệt không liên quan, và khoá chính không phải kiểu dữ liệu.",
      },
    },
    {
      id: "explain-plan",
      trap: {
        title: "EXPLAIN ANALYZE chạy câu lệnh thật",
        text: "`EXPLAIN` chỉ lập kế hoạch, còn `EXPLAIN ANALYZE` thực thi câu lệnh. Với `UPDATE` hay `DELETE` nó sửa dữ liệu thật, nên hãy bọc trong `BEGIN` rồi `ROLLBACK`. `rows` cũng chỉ là ước lượng: `stmt_entry` chưa `ANALYZE` nên `EXPLAIN SELECT * FROM stmt_entry` báo `rows=220` trong khi bảng có 932 dòng.",
      },
      title: "Phần 2: EXPLAIN và cách đọc kế hoạch thực thi",
      scene: "explain-plan",
      intro: [
        "Bảng thử đã sẵn sàng. Nhưng làm sao biết database sẽ đọc cả bảng hay dùng index? Ta hỏi thẳng nó.",
        "Trước khi chạy một câu `SELECT`, PostgreSQL có một bộ phận gọi là **planner** (người lập kế hoạch). Nó cân nhắc các cách chạy có thể và chọn cách có **chi phí ước lượng** thấp nhất. Kết quả là **execution plan** (kế hoạch thực thi). Thêm `EXPLAIN` trước câu lệnh để xem kế hoạch mà **không chạy** câu lệnh: `EXPLAIN SELECT * FROM scratch_entry WHERE entry_id = 12345`.",
        "Kết quả với bảng thử chưa có index:\n\n`Seq Scan on scratch_entry  (cost=0.00..695.00 rows=1 width=48)`\n\n`Filter: (entry_id = 12345)`\n\n`Seq Scan` là cách quét: đọc cả bảng. `Filter` là điều kiện kiểm tra trên từng dòng đã đọc. Trong ngoặc có ba con số:",
        "- **cost=0.00..695.00**: chi phí ước lượng từ lúc bắt đầu tới lúc xong (đơn vị tương đối của planner, **không phải giây**).",
        "- **rows=1**: số dòng planner **ước lượng** sẽ trả ra.",
        "- **width=48**: số byte trung bình của mỗi dòng.",
        "Kế hoạch là một cây: dòng thụt vào sâu hơn (có dấu `->`) chạy trước và đưa kết quả cho dòng cha.",
        "Hãy nhớ: chi phí chỉ để so sánh các kế hoạch của cùng một câu hỏi, đừng so chi phí giữa hai câu hỏi khác nhau như so giây.",
        "**EXPLAIN ANALYZE** thì **chạy thật** câu lệnh rồi in kế hoạch kèm số đo thật (xem khung bẫy về UPDATE và DELETE). Ví dụ `EXPLAIN ANALYZE SELECT * FROM scratch_entry WHERE status = 'REVERSED'` cho:\n\n`Seq Scan on scratch_entry  (cost=0.00..695.00 rows=300 width=48) (actual time=0.040..5.434 rows=300.00 loops=1)`\n\n`Filter: (status = 'REVERSED'::text)`\n\n`Rows Removed by Filter: 29700`\n\n`Execution Time: 5.750 ms`\n\nĐọc thế này: ngoặc đầu là **ước lượng** (`rows=300`), ngoặc sau là **thực tế** (`actual ... rows=300.00`). Hai số `rows` gần nhau nghĩa là planner đoán đúng; lệch xa (ví dụ đoán 1, thật 10.000) là dấu hiệu thống kê cũ và kế hoạch có thể sai. `Rows Removed by Filter: 29700` là số dòng đã đọc rồi vứt đi: đọc 30.000 để giữ 300 là dấu hiệu nên có index. `Execution Time` là thời gian chạy thật, thay đổi mỗi lần chạy, vì vậy bài này không chấm thời gian.",
      ],
      sql: [
        {
          prompt: "Xem kế hoạch tìm bút toán có `entry_id = 12345` trên bảng thử chưa có index. Điền giá trị cần tìm. Hãy đọc dòng `Seq Scan`, `Filter` và con số `cost` (695.00).",
          starter: `${SETUP}\n\nEXPLAIN SELECT * FROM scratch_entry WHERE entry_id = ____;`,
          solution: `${SETUP}\n\nEXPLAIN SELECT * FROM scratch_entry WHERE entry_id = 12345`,
          ordered: true,
          hint: "Giá trị cần tìm là 12345, không có dấu nháy vì entry_id là số.",
        },
        {
          prompt: "Xem kế hoạch tìm các bút toán của tài khoản `'1000000002'` trong bảng thật `stmt_entry` (cột `account_id`). Bảng này có khoá ngoại ở `account_id` nhưng chưa có index riêng, nên bạn sẽ thấy `Seq Scan`.",
          starter: "EXPLAIN SELECT * FROM stmt_entry WHERE account_id = ____;",
          solution: "EXPLAIN SELECT * FROM stmt_entry WHERE account_id = '1000000002'",
          ordered: true,
          hint: "account_id là chuỗi nên giá trị đặt trong dấu nháy đơn.",
        },
        {
          prompt: "Bây giờ tìm theo khoá chính: kế hoạch tìm bút toán có `stmt_entry_id = 5`. Lần này dòng đầu tiên là `Index Scan using stmt_entry_pkey`, vì khoá chính có index sẵn.",
          starter: "EXPLAIN SELECT * FROM stmt_entry WHERE ____ = 5;",
          solution: "EXPLAIN SELECT * FROM stmt_entry WHERE stmt_entry_id = 5",
          ordered: true,
          hint: "Tên cột khoá chính của stmt_entry.",
        },
      ],
      takeaway: {
        lines: [
          "`EXPLAIN` cho kế hoạch mà không chạy, `EXPLAIN ANALYZE` chạy thật và in thêm số đo.",
          "Hai dấu hiệu cần để ý: `rows` ước lượng lệch xa `rows` thực tế (thống kê cũ), và `Rows Removed by Filter` rất lớn so với số dòng giữ lại (nên có index).",
        ],
      },
      quiz: {
        question: "Dòng `Seq Scan on scratch_entry  (cost=0.00..695.00 rows=1 width=48)` cho biết điều gì?",
        options: [
          "Câu lệnh mất đúng 695 mili giây và trả về 1 dòng",
          "Planner chọn đọc cả bảng, ước lượng chi phí 695 theo đơn vị tương đối và dự đoán trả về 1 dòng",
          "Bảng có 695 dòng và mỗi dòng rộng 48 ký tự",
          "Planner đã dùng index và tìm thấy chính xác 1 dòng",
        ],
        answer: 1,
        explain: "`EXPLAIN` không chạy câu lệnh nên không có thời gian thật. `cost` là đơn vị tương đối, `rows` là số dòng ước lượng, `width` tính bằng byte, và `Seq Scan` chính là cách đọc cả bảng chứ không phải dùng index.",
      },
    },
    {
      id: "create-index",
      title: "Phần 3: CREATE INDEX, DROP INDEX và so sánh trước, sau",
      scene: "create-index",
      widget: "sql-optimize-plan",
      widgetTitle: "Cùng một câu tìm kiếm, kế hoạch khi chưa có index và khi đã có index",
      intro: [
        "Ở Phần 2, tìm một dòng theo `entry_id` phải `Seq Scan` cả 30.000 dòng. Giờ ta thêm index cho cột đó và xem kế hoạch đổi ra sao.",
        "Tạo index: `CREATE INDEX tên_index ON tên_bảng (tên_cột);`. Tên thường đặt theo mẫu `idx_<bảng>_<cột>`, ví dụ `CREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);`. Xoá index: `DROP INDEX tên_index;`. Đây là lệnh định nghĩa cấu trúc (DDL) giống `CREATE TABLE` ở bài thiết kế. Sau khi tạo, PostgreSQL tự cập nhật index mỗi khi bảng thay đổi, bạn không phải làm gì thêm. Index **không đổi kết quả** của câu truy vấn, chỉ đổi cách tìm.",
        "Widget bên dưới dựng một bảng thử 30.000 dòng, chạy `EXPLAIN` cho câu tìm một dòng theo `entry_id`, tạo index, chạy `EXPLAIN` lần nữa rồi xoá bảng. Bấm hai nút để xem kế hoạch thật của PostgreSQL cùng lời đọc từng dòng.",
      ],
      predict: {
        question: "Sau khi tạo index trên `entry_id`, kế hoạch của câu tìm `entry_id = 12345` đổi thế nào?",
        options: [
          "Không đổi gì, vẫn `Seq Scan` với cùng chi phí",
          "Chuyển sang `Index Scan`, chi phí ước lượng giảm mạnh",
          "Vẫn `Seq Scan` nhưng chi phí giảm một nửa",
          "Chuyển sang `Index Scan` nhưng chi phí tăng vì phải đọc thêm index",
        ],
        answer: 1,
        explain: "Có index, planner tra cây để tới thẳng dòng cần tìm thay vì đọc cả bảng. Với bảng thử của widget, chi phí ước lượng giảm từ 567.00 xuống 8.30.",
      },
      after: [
        "Với bảng thử của widget (3 cột), chi phí ước lượng giảm từ 567.00 xuống 8.30 khi có index.",
        "Hãy chú ý hai thay đổi: dòng `Seq Scan` thành `Index Scan using ...`, và `Filter` thành `Index Cond` (điều kiện được dùng ngay trong index). Đừng quên rằng planner luôn chọn theo chi phí: có index chưa chắc nó dùng, Phần 5 sẽ nói rõ khi nào.",
      ],
      sql: [
        {
          prompt: "Tạo index tên `idx_scratch_entry_id` trên cột `entry_id` của bảng thử. Sau khi tạo, kế hoạch tìm `entry_id = 12345` sẽ chuyển sang `Index Scan`. Bài được chấm bằng kế hoạch đó.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON ____ (entry_id);`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id)`,
          verify: "EXPLAIN SELECT * FROM scratch_entry WHERE entry_id = 12345",
          hint: "CREATE INDEX tên ON bảng (cột): chỗ trống là tên bảng.",
        },
        {
          prompt: "Tạo index rồi xoá nó đi. Điền lệnh xoá index. Sau khi xoá, kế hoạch tìm `entry_id = 12345` phải quay về `Seq Scan`.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\n\n____ idx_scratch_entry_id;`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\n\nDROP INDEX idx_scratch_entry_id`,
          verify: "EXPLAIN SELECT * FROM scratch_entry WHERE entry_id = 12345",
          hint: "Lệnh xoá một đối tượng trong SQL là DROP.",
        },
        {
          prompt: "Tạo index tên `idx_scratch_account_id` trên cột `account_id`. Mỗi `account_id` có 10 bút toán, nên kế hoạch tìm `'AC00000123'` sẽ là `Bitmap Heap Scan` (Phần 4 giải thích). Viết đủ lệnh tạo index sau đoạn dựng bảng.",
          starter: `${SETUP}\n\n-- tạo index idx_scratch_account_id trên cột account_id\n`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id)`,
          verify: "EXPLAIN SELECT * FROM scratch_entry WHERE account_id = 'AC00000123'",
          hint: "CREATE INDEX idx_scratch_account_id ON scratch_entry (...).",
        },
      ],
      quiz: {
        question: "Sau khi `CREATE INDEX` trên một cột, điều nào sau đây đúng?",
        options: [
          "Kết quả của mọi truy vấn trên bảng thay đổi vì dữ liệu được sắp xếp lại",
          "Kết quả truy vấn giữ nguyên, planner có thêm một cách tìm dòng và tự chọn nếu thấy rẻ hơn",
          "Mọi truy vấn trên bảng đều bắt buộc dùng index đó",
          "Bạn phải gọi lại `CREATE INDEX` sau mỗi lần thêm dòng mới",
        ],
        answer: 1,
        explain: "Index là cấu trúc phụ, không đổi dữ liệu hay kết quả. Planner so sánh chi phí và có thể vẫn bỏ qua index. PostgreSQL tự cập nhật index khi bảng thay đổi, bạn không phải tạo lại.",
      },
    },
    {
      id: "scan-types",
      title: "Phần 4: Các kiểu quét, Sort và cách nối hai bảng",
      scene: "scan-types",
      intro: [
        "Phần 3 đã thấy hai kiểu quét khác nhau: `Index Scan` cho một dòng, `Bitmap Heap Scan` cho 10 dòng. Bảng thử cho thấy planner chọn kiểu quét theo số dòng dự kiến lấy ra:",
        "- **Index Scan**: tra index rồi lấy từng dòng, hợp khi lấy rất ít dòng (ví dụ 1 dòng theo `entry_id`).",
        "- **Bitmap Index Scan + Bitmap Heap Scan**: tra index để đánh dấu những trang chứa dòng cần, rồi mở các trang đó một lần theo thứ tự, hợp khi lấy một nhóm dòng (ví dụ 10 bút toán của một tài khoản).",
        "- **Index Only Scan**: câu hỏi chỉ cần các cột nằm trong index nên không cần mở bảng.",
        "- **Seq Scan**: đọc cả bảng, hợp khi cần lấy phần lớn bảng.",
        "**Sort** xuất hiện khi `ORDER BY` không thể lấy thứ tự từ index nên phải sắp xếp. Ví dụ `ORDER BY booking_date, entry_id LIMIT 5` trên bảng thử không có index: PostgreSQL đọc cả 30.000 dòng rồi sắp xếp (`Sort`) để lấy 5 dòng đầu. Muốn bỏ `Sort`, index phải có **đúng các cột sắp xếp, đúng thứ tự**. Index chỉ trên `entry_id` không giúp được câu này: đã chạy thử, kế hoạch vẫn là `Sort` trên `Seq Scan`, vì index đó xếp theo `entry_id` còn câu hỏi cần xếp theo `booking_date` trước. Index trên `(booking_date, entry_id)` thì có: kế hoạch chỉ còn `Limit` và `Index Scan`, đọc index từ đầu và dừng sau 5 dòng. Bài tập 2 dùng câu đơn giản hơn: index trên `entry_id` cho `ORDER BY entry_id`.",
      ],
      sql: [
        {
          prompt: "Xem kế hoạch lấy 5 bút toán đầu theo `booking_date, entry_id` trên bảng thử **chưa có index**. Bạn sẽ thấy `Limit`, bên dưới là `Sort`, bên dưới nữa là `Seq Scan` đọc cả 30000 dòng.",
          starter: `${SETUP}\n\nEXPLAIN SELECT * FROM scratch_entry\nORDER BY booking_date, entry_id\nLIMIT ____;`,
          solution: `${SETUP}\n\nEXPLAIN SELECT * FROM scratch_entry ORDER BY booking_date, entry_id LIMIT 5`,
          ordered: true,
          hint: "LIMIT 5: lấy 5 dòng đầu.",
        },
        {
          prompt: "Tạo index `idx_scratch_entry_id` trên `entry_id`, rồi xem kế hoạch `ORDER BY entry_id LIMIT 5`. Lần này không còn `Sort`: PostgreSQL đi theo index và dừng sau 5 dòng.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\n\nEXPLAIN SELECT * FROM scratch_entry ORDER BY ____ LIMIT 5;`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\n\nEXPLAIN SELECT * FROM scratch_entry ORDER BY entry_id LIMIT 5`,
          ordered: true,
          hint: "Sắp xếp theo đúng cột đã đặt index.",
        },
      ],
      takeaway: {
        lines: [
          "`ORDER BY` không lấy được thứ tự từ index → `Sort` trên cả bảng. Index có đúng các cột sắp xếp, đúng thứ tự → bỏ được `Sort`.",
        ],
      },
      quiz: {
        question: "Truy vấn cần lấy khoảng 99% số dòng của một bảng 30.000 dòng. Kiểu quét nào thường hợp lý nhất, dù cột lọc có index?",
        options: [
          "Index Scan, vì có index thì luôn nhanh hơn",
          "Index Only Scan, vì nó không phải đọc bảng",
          "Seq Scan, vì đọc thẳng cả bảng một lần rẻ hơn nhảy qua index cho gần hết các dòng",
          "Hash Join, vì nó dành cho bảng lớn",
        ],
        answer: 2,
        explain: "Lấy gần hết bảng thì tra index từng dòng chỉ tốn thêm công. Index Only Scan chỉ dùng được khi mọi cột cần thiết đều nằm trong index, còn Hash Join là kiểu nối chứ không phải kiểu quét một bảng.",
      },
      parts: [
        {
          id: "join-methods",
          title: "Cách nối hai bảng: Hash Join và Nested Loop",
          intro: [
            "Với phép `JOIN`, hai cách nối cơ bản là:",
            "- **Hash Join**: dựng một bảng băm từ bảng nhỏ hơn rồi đọc bảng còn lại và tra vào đó, hợp khi nối phần lớn hai bảng.",
            "- **Nested Loop** (vòng lặp lồng nhau): lấy từng dòng của một bên (gọi là bên ngoài) rồi tra bên kia (bên trong), hợp khi bên ngoài chỉ còn vài dòng và bên trong có index để tra nhanh.",
            "Bên nào là ngoài cũng do planner chọn, không phụ thuộc bảng nào viết trước trong `FROM`. Bạn không chọn cách nối, planner chọn. Việc của bạn là đọc ra nó đã chọn gì.",
          ],
          sql: [
            {
              prompt: "Xem kế hoạch nối `stmt_entry` với `account` theo `account_id`, lấy mọi cột. Đây là phép nối phần lớn hai bảng nên bạn sẽ thấy `Hash Join`.",
              starter: "EXPLAIN SELECT *\nFROM stmt_entry s\nJOIN account a ON a.account_id = ____;",
              solution: "EXPLAIN SELECT * FROM stmt_entry s JOIN account a ON a.account_id = s.account_id",
              ordered: true,
              hint: "Điều kiện nối: a.account_id = s.account_id.",
            },
            {
              prompt: "Giữ phép nối ở bài trên nhưng chỉ cần tài khoản `'1000000002'` (thêm `WHERE a.account_id = '1000000002'`). Phía `account` chỉ còn một dòng, phía `stmt_entry` cũng chỉ còn vài bút toán của tài khoản đó, và `account` được tra bằng khoá chính `account_pkey`, nên kế hoạch chuyển sang `Nested Loop`.",
              starter: "EXPLAIN SELECT *\nFROM stmt_entry s\nJOIN account a ON a.account_id = s.account_id\nWHERE ____;",
              solution: "EXPLAIN SELECT * FROM stmt_entry s JOIN account a ON a.account_id = s.account_id WHERE a.account_id = '1000000002'",
              ordered: true,
              hint: "WHERE a.account_id = '1000000002'.",
            },
          ],
        },
      ],
    },
    {
      id: "index-not-used",
      trap: {
        title: "Bọc cột trong hàm là làm index vô dụng",
        text: "Với index trên `account_id`, `WHERE account_id = 'AC00000123'` dùng Bitmap Index Scan, còn `WHERE upper(account_id) = 'AC00000123'` quay về `Seq Scan` (cost 770.00). Viết lại để cột đứng một mình, hoặc tạo index trên biểu thức `upper(account_id)`.",
      },
      title: "Phần 5: Khi index có mà không được dùng",
      scene: "index-not-used",
      intro: [
        "Phần 3 và 4 cho thấy index giúp tìm nhanh. Nhưng index không phải phép màu. Có bốn tình huống kinh điển khiến PostgreSQL bỏ qua index:",
        "- **Bọc cột trong hàm hoặc phép tính**: điều kiện `upper(account_id) = 'AC00000123'` hay `entry_id + 1 = 12346` không dùng được index (xem khung bẫy), vì database không biết giá trị đã qua hàm nằm ở đâu trong cây. Cách sửa: viết lại điều kiện để cột đứng một mình (`entry_id = 12345`), hoặc tạo **index trên biểu thức** `CREATE INDEX ... ON scratch_entry (upper(account_id))`.",
        "- **`LIKE` có ký tự đại diện đứng đầu**: `account_id LIKE 'AC0000012%'` (biết phần đầu) dùng được index, vì các giá trị bắt đầu bằng `AC0000012` nằm liền nhau trong cây. Còn `account_id LIKE '%123'` (chỉ biết phần cuối) không biết bắt đầu tìm từ đâu nên phải quét cả bảng.",
        "- **Chọn lọc kém (low selectivity)**: cột `status` của bảng thử chỉ có hai giá trị, `POSTED` chiếm 29.700 dòng và `REVERSED` 300 dòng. Có index trên `status`: tìm `'REVERSED'` dùng `Index Scan` (chi phí ước lượng 0.29..48.26), còn tìm `'POSTED'` vẫn `Seq Scan` (695.00), vì lấy gần hết bảng thì đọc thẳng cả bảng rẻ hơn.",
        "- **Bảng quá nhỏ**: bảng `account` chỉ có 85 dòng, nằm gọn trong vài trang đĩa, đọc cả bảng còn rẻ hơn tra index.",
        "Hai tình huống đầu là lỗi viết câu, nên sửa câu. Hai tình huống sau thì cái đúng là tin vào planner, đừng ép nó.",
        "Lưu ý về `LIKE`: tuỳ cấu hình ngôn ngữ (collation) của database, `LIKE 'abc%'` có thể cần index khai báo `text_pattern_ops`. Môi trường PGlite của bài này chạy được không cần khai báo.",
      ],
      sql: [
        {
          prompt: "Bảng thử đã có index `idx_scratch_account_id` trên `account_id`. Thử tìm với điều kiện bọc hàm `upper(account_id) = 'AC00000123'` và xem kế hoạch: vẫn `Seq Scan`, vì index không dùng được.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id);\n\nEXPLAIN SELECT * FROM scratch_entry\nWHERE ____(account_id) = 'AC00000123';`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id);\n\nEXPLAIN SELECT * FROM scratch_entry WHERE upper(account_id) = 'AC00000123'`,
          ordered: true,
          hint: "Hàm đổi chữ thường thành chữ hoa đã học ở bài biến đổi dữ liệu.",
        },
        {
          prompt: "Cùng index `idx_scratch_account_id`. Xem kế hoạch của `account_id LIKE '%123'` (chỉ biết phần cuối): vẫn `Seq Scan`. Sau đó đổi thành `LIKE 'AC0000012%'` để thấy index được dùng. Bài chấm câu `LIKE` biết phần đầu.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id);\n\nEXPLAIN SELECT * FROM scratch_entry\nWHERE account_id LIKE '%123';`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id);\n\nEXPLAIN SELECT * FROM scratch_entry WHERE account_id LIKE 'AC0000012%'`,
          ordered: true,
          hint: "Đặt ký tự % ở cuối chuỗi thay vì ở đầu: 'AC0000012%'.",
        },
        {
          prompt: "Tạo index `idx_scratch_status` trên `status`, rồi xem kế hoạch tìm `status = 'POSTED'` (99% bảng). Dù có index, kế hoạch vẫn là `Seq Scan`.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_status ON scratch_entry (status);\n\nEXPLAIN SELECT * FROM scratch_entry WHERE status = '____';`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_status ON scratch_entry (status);\n\nEXPLAIN SELECT * FROM scratch_entry WHERE status = 'POSTED'`,
          ordered: true,
          hint: "Giá trị chiếm 29.700 trên 30.000 dòng.",
        },
        {
          prompt: "Bảng thật `account` chỉ có 85 dòng. Tạo index `idx_account_customer_id` trên `customer_id`, rồi xem kế hoạch `EXPLAIN (COSTS OFF)` (bỏ phần chi phí cho gọn) tìm `customer_id = 100002`. Index có mà vẫn `Seq Scan`.",
          starter: "CREATE INDEX idx_account_customer_id ON account (customer_id);\n\nEXPLAIN (COSTS OFF) SELECT * FROM account WHERE customer_id = 100002;",
          solution: "CREATE INDEX idx_account_customer_id ON account (customer_id)",
          verify: "EXPLAIN (COSTS OFF) SELECT * FROM account WHERE customer_id = 100002",
          hint: "Chạy nguyên câu gốc rồi bấm Chạy: bài chấm kế hoạch sau khi tạo index.",
        },
      ],
      quiz: {
        question: "Bảng có index trên cột `account_id`. Câu nào dưới đây chắc chắn phải quét cả bảng thay vì tra index?",
        options: [
          "WHERE account_id = 'AC00000123'",
          "WHERE account_id LIKE 'AC0000012%'",
          "WHERE account_id IN ('AC00000123', 'AC00000124')",
          "WHERE lower(account_id) = 'ac00000123'",
        ],
        answer: 3,
        explain: "Bọc cột trong `lower()` làm index trên giá trị gốc vô dụng (trừ khi tạo index trên chính biểu thức đó). Ba câu còn lại để cột đứng một mình hoặc chỉ dùng `LIKE` với phần đầu cố định, nên index tìm được.",
      },
    },
    {
      id: "index-cost",
      trap: {
        title: "Mỗi index làm chậm mọi lần ghi",
        text: "Mỗi `INSERT`, `UPDATE` cột có index và `DELETE` đều phải cập nhật mọi index của bảng, và index chiếm thêm chỗ: trên bảng thử 30.000 dòng, index của `entry_id` chiếm 672 kB. Chỉ đặt index cho cột hay nằm trong WHERE, JOIN, ORDER BY của truy vấn chạy thường xuyên.",
      },
      title: "Phần 6: Index không miễn phí",
      scene: "index-cost",
      intro: [
        "Nếu index nhanh như vậy, sao không tạo cho mọi cột? Vì mỗi index có hai chi phí. **Dung lượng**: index là một cấu trúc thật, chiếm chỗ trên đĩa và trong bộ nhớ. Trên bảng thử 30.000 dòng, bảng chiếm 2560 kB, còn riêng index trên `entry_id` chiếm 672 kB, index trên `account_id` 320 kB và index trên `status` 224 kB.",
        "**Ghi chậm hơn**: mỗi `INSERT` phải thêm một mục vào **mọi** index của bảng, `DELETE` phải đánh dấu mục đó, và `UPDATE` một cột có index phải sửa cả index. Bảng có năm index thì một lần thêm dòng là sáu lần ghi (bảng cộng năm index). Bạn có thể tự đo bằng `EXPLAIN ANALYZE INSERT ...` với bảng có và không có index, nhưng thời gian thay đổi mỗi lần chạy nên bài này không chấm.",
        "Các hàm dùng trong bài tập: `pg_relation_size('bảng')` trả kích thước phần dữ liệu của bảng, `pg_indexes_size('bảng')` trả tổng kích thước mọi index của bảng đó, cả hai tính bằng **byte**. Chia 1024 để ra kB: `2621440` byte là 2560 kB, và tổng ba index `1245184` byte là 1216 kB (672 + 320 + 224). `pg_indexes` là một view hệ thống, mỗi dòng là một index (cột `tablename`, `indexname`, `indexdef`).",
        "Nguyên tắc thực tế:",
        "- **Nên tạo**: cho cột hay xuất hiện trong `WHERE`, `JOIN` và `ORDER BY` của các truy vấn chạy thường xuyên và trả ít dòng.",
        "- **Đừng tạo**: cho cột chọn lọc kém hay bảng nhỏ.",
        "- **Dọn định kỳ**: xoá index không còn ai dùng (PostgreSQL ghi số lần mỗi index được dùng trong `pg_stat_user_indexes`, cột `idx_scan`).",
      ],
      sql: [
        {
          prompt: "Tạo ba index trên bảng thử (đúng tên đã cho), rồi so sánh dung lượng: cột `bang` là kích thước bảng, `tong_index` là tổng kích thước mọi index của bảng, tính bằng byte. Kết quả một dòng.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id);\nCREATE INDEX idx_scratch_status ON scratch_entry (status);\n\nSELECT pg_relation_size('scratch_entry') AS bang,\n       pg_indexes_size('____') AS tong_index;`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\nCREATE INDEX idx_scratch_account_id ON scratch_entry (account_id);\nCREATE INDEX idx_scratch_status ON scratch_entry (status);\n\nSELECT pg_relation_size('scratch_entry') AS bang, pg_indexes_size('scratch_entry') AS tong_index`,
          hint: "pg_indexes_size nhận tên bảng, giống pg_relation_size.",
        },
        {
          prompt: "Liệt kê tên các index đang có trên bảng thử sau khi tạo hai index (`idx_scratch_entry_id`, `idx_scratch_status`), xếp theo tên, bằng cách đọc `pg_indexes` (cột `indexname`, `tablename`). Bảng thử được tạo bằng `CREATE TABLE AS` nên không có khoá chính, kết quả đúng 2 dòng.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\nCREATE INDEX idx_scratch_status ON scratch_entry (status);\n\nSELECT indexname\nFROM pg_indexes\nWHERE tablename = '____'\nORDER BY indexname;`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_entry_id ON scratch_entry (entry_id);\nCREATE INDEX idx_scratch_status ON scratch_entry (status);\n\nSELECT indexname FROM pg_indexes WHERE tablename = 'scratch_entry' ORDER BY indexname`,
          ordered: true,
          hint: "Tên bảng thử: scratch_entry.",
        },
      ],
      quiz: {
        question: "Vì sao bảng được ghi liên tục (như bút toán) không nên có quá nhiều index?",
        options: [
          "Vì PostgreSQL giới hạn mỗi bảng tối đa 3 index",
          "Vì index làm kết quả truy vấn sai khi bảng thay đổi",
          "Vì mỗi lần INSERT, UPDATE hay DELETE phải cập nhật mọi index liên quan, và index còn chiếm thêm dung lượng",
          "Vì index chỉ dùng được một lần rồi hết hiệu lực",
        ],
        answer: 2,
        explain: "Mỗi index là một cấu trúc cần được cập nhật khi dữ liệu đổi, nên càng nhiều index thì ghi càng chậm và tốn chỗ. PostgreSQL không có giới hạn 3 index, index luôn được giữ đúng, và index dùng lại được nhiều lần.",
      },
    },
    {
      id: "composite-fk",
      trap: {
        title: "Khoá ngoại không tự có index",
        text: "PostgreSQL chỉ tự tạo index cho khoá chính. `stmt_entry.account_id` là khoá ngoại nhưng bảng chỉ có index `stmt_entry_pkey`, nên tìm bút toán theo tài khoản, nối hai bảng, hay xoá một tài khoản đều phải quét cả bảng con. Hãy đặt index riêng cho khoá ngoại hay dùng trong JOIN và WHERE.",
      },
      title: "Phần 7: Index nhiều cột và khoá ngoại",
      scene: "composite-fk",
      intro: [
        "Các phần trước chỉ đặt index trên một cột. Khi câu hỏi lọc theo hai cột cùng lúc thì sao?",
        "**Index nhiều cột** (composite index) gồm hai cột trở lên: `CREATE INDEX idx_scratch_acc_date ON scratch_entry (account_id, booking_date)`. Hãy hình dung danh bạ xếp theo họ rồi mới tới tên: tìm \"họ Nguyễn, tên An\" rất nhanh, tìm riêng \"mọi người tên An\" thì không giúp được gì. **Thứ tự cột quan trọng**: index dùng tốt khi điều kiện bắt đầu từ **cột đầu tiên**. Với index `(account_id, booking_date)`, câu lọc cả hai cột dùng được (`Index Scan`, chi phí 0.29..8.31), còn lọc riêng `booking_date` thì không và vẫn `Seq Scan`.",
        "Vì sao đặt cột lọc bằng dấu `=` lên đầu? Index `(account_id, booking_date)` xếp theo `account_id` trước, và **trong cùng một `account_id`** thì các mục đã xếp sẵn theo `booking_date`. Nên sau `account_id = 'AC00000123'`, phần index còn lại là một đoạn liền đã có thứ tự ngày: lọc thêm khoảng ngày (`booking_date >= ...`) hay `ORDER BY booking_date` vẫn đi được trên đoạn đó. Đã chạy: `WHERE account_id = 'AC00000123' ORDER BY booking_date DESC LIMIT 3` cho `Index Scan Backward` và không có `Sort`. Ngược lại, nếu cột đầu là khoảng (`booking_date >= ...`) thì các `account_id` nằm rải khắp đoạn đó, index không còn giúp nhiều cho cột sau.",
        "Ghi chú: PostgreSQL 18 (bản chạy ở đây) có thêm **skip scan**: khi cột đầu có ít giá trị khác nhau, nó có thể dùng index `(a, b)` cho điều kiện chỉ có `b` bằng cách nhảy qua từng giá trị của `a`. Ở bảng thử, `account_id` có 3000 giá trị nên planner vẫn chọn `Seq Scan` cho câu chỉ lọc `booking_date`. Đừng trông vào skip scan khi thiết kế; cứ đặt cột hay lọc lên đầu.",
        "Khoá ngoại là chỗ hay bị bỏ sót index (xem khung bẫy). Vì thế khoá ngoại hay dùng trong `JOIN` và `WHERE` thường nên được đặt index riêng.",
        "Bẫy: đặt hai index đơn `(a)` và `(b)` không giống một index đôi `(a, b)`. Index đôi tìm theo cả hai điều kiện trong một lần đi qua cây, còn hai index đơn buộc planner chọn một cái rồi lọc tiếp. Và index đôi `(a, b)` thừa nếu bạn đã có index đơn `(a)` mà không bao giờ lọc theo `b`.",
      ],
      sql: [
        {
          prompt: "Liệt kê các index của bảng thật `stmt_entry` từ `pg_indexes` (cột `indexname`). Bạn sẽ thấy chỉ có một dòng, của khoá chính: khoá ngoại `account_id` chưa có index.",
          starter: "SELECT indexname\nFROM pg_indexes\nWHERE tablename = '____';",
          solution: "SELECT indexname FROM pg_indexes WHERE tablename = 'stmt_entry'",
          hint: "Tên bảng cần xem: stmt_entry.",
        },
        {
          prompt: "Đặt index cho khoá ngoại: tạo `idx_stmt_entry_account_id` trên cột `account_id` của `stmt_entry`. Bài chấm bằng danh sách index của bảng sau khi tạo, phải có 2 dòng.",
          starter: "-- tạo index idx_stmt_entry_account_id trên stmt_entry (account_id)\n",
          solution: "CREATE INDEX idx_stmt_entry_account_id ON stmt_entry (account_id)",
          verify: "SELECT indexname FROM pg_indexes WHERE tablename = 'stmt_entry' ORDER BY indexname",
          hint: "CREATE INDEX tên ON bảng (cột).",
        },
        {
          prompt: "Tạo index nhiều cột `idx_scratch_acc_date` trên `(account_id, booking_date)`. Bài chấm kế hoạch tìm `account_id = 'AC00000123' AND booking_date = DATE '2024-03-15'`: phải là `Index Scan` dùng cả hai cột trong `Index Cond`.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_acc_date ON scratch_entry (____, booking_date);`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_acc_date ON scratch_entry (account_id, booking_date)`,
          verify: "EXPLAIN SELECT * FROM scratch_entry WHERE account_id = 'AC00000123' AND booking_date = DATE '2024-03-15'",
          hint: "Cột đứng đầu index là account_id.",
        },
        {
          prompt: "Cùng index `(account_id, booking_date)`, xem kế hoạch khi chỉ lọc `booking_date = DATE '2024-03-15'` (không có `account_id`). Cột đứng đầu không có trong điều kiện nên index không giúp được và kế hoạch là `Seq Scan`.",
          starter: `${SETUP}\n\nCREATE INDEX idx_scratch_acc_date ON scratch_entry (account_id, booking_date);\n\nEXPLAIN SELECT * FROM scratch_entry WHERE ____ = DATE '2024-03-15';`,
          solution: `${SETUP}\n\nCREATE INDEX idx_scratch_acc_date ON scratch_entry (account_id, booking_date);\n\nEXPLAIN SELECT * FROM scratch_entry WHERE booking_date = DATE '2024-03-15'`,
          ordered: true,
          hint: "Chỉ lọc theo cột thứ hai của index.",
        },
      ],
      quiz: {
        question: "Bảng có index nhiều cột `(account_id, booking_date)`. Điều kiện nào dùng được index này hiệu quả nhất?",
        options: [
          "WHERE booking_date = DATE '2024-03-15'",
          "WHERE account_id = 'AC00000123' AND booking_date = DATE '2024-03-15'",
          "WHERE booking_date > DATE '2024-03-01' ORDER BY amount",
          "WHERE status = 'POSTED' AND amount > 5000",
        ],
        answer: 1,
        explain: "Index nhiều cột hoạt động tốt khi điều kiện bắt đầu từ cột đầu tiên, và câu thứ hai dùng cả hai cột theo đúng thứ tự. Ba câu còn lại không lọc theo `account_id` nên không tận dụng được cột đứng đầu của index.",
      },
    },
  ],
  cards: [
    { q: "Index giúp gì, và dựa trên cấu trúc nào?", a: "Giúp tìm dòng nhanh như tra mục lục, thay vì quét cả bảng. Mặc định PostgreSQL dùng B-tree." },
    { q: "`EXPLAIN` khác `EXPLAIN ANALYZE` thế nào?", a: "`EXPLAIN` chỉ cho kế hoạch. `EXPLAIN ANALYZE` chạy thật và đo thời gian, nên với UPDATE hoặc DELETE phải bọc trong transaction rồi rollback." },
    { q: "Cost trong kế hoạch có phải là giây không?", a: "Không. Đó là đơn vị tương đối của planner, chỉ dùng để so các kế hoạch của cùng một câu hỏi." },
    { q: "Kể tên các tình huống PostgreSQL bỏ qua index.", a: "Bọc cột trong hàm hoặc phép tính, LIKE bắt đầu bằng `%`, chọn lọc kém vì lấy gần hết bảng, và bảng quá nhỏ." },
    { q: "Vì sao không tạo index cho mọi cột?", a: "Index tốn chỗ và làm chậm mọi INSERT, UPDATE, DELETE vì phải cập nhật từng index." },
    { q: "Index nhiều cột `(a, b)` dùng tốt khi nào?", a: "Khi điều kiện bắt đầu từ cột đầu `a`. Lọc riêng `b` thì không dùng được index đó." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Index (mặc định là B-tree) giống mục lục sách: giúp database nhảy tới dòng cần tìm thay vì đọc cả bảng (Seq Scan). Khoá chính có index sẵn, khoá ngoại thì không. Tạo bằng CREATE INDEX, xoá bằng DROP INDEX, xem planner chọn gì bằng EXPLAIN: Seq Scan, Index Scan, Bitmap Scan, Sort, Hash Join, Nested Loop, kèm cost và rows chỉ là con số ước lượng. Index không được dùng khi bọc cột trong hàm, LIKE bắt đầu bằng %, cột chọn lọc kém hoặc bảng quá nhỏ. Mỗi index làm ghi chậm hơn và tốn dung lượng, nên chỉ tạo cho cột hay lọc và nối. Với index nhiều cột, cột đứng đầu phải có trong điều kiện.",
};
