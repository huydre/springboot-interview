import timeline from "../timelines/sql.json";
import type { Lesson, Scene } from "../types";

// Small queries re-run on PostgreSQL 16 and PGlite 18 (dept/employee sample from study note 03.07, listed in the join section); pagination and anti-join timings from study note 03.07
// (1M orders), HikariCP error from Spring Boot 3.5.
export const sql: Lesson = {
  slug: "sql",
  crumb: "SQL Queries & Pagination",
  videoDir: "/videos/sql-queries",
  // Per-scene clips cut by `video-kit/pipeline.py sql-video publish`, which also rewrites videoVersion.
  videoVersion: "da3acd33",
  scenes: timeline as Scene[],
  title: "SQL Queries & Pagination",
  subtitle:
    "JOIN và bẫy NULL, WHERE với HAVING, window function và top N mỗi nhóm, các câu SQL kinh điển, OFFSET với keyset, HikariCP cạn connection, và SQL với NoSQL.",
  openingQuiz: {
    question: "Bảng employee có một nhân viên dept_id = NULL. Câu `select name from dept where id not in (select dept_id from employee)` trả gì?",
    options: ["Các phòng chưa có ai", "0 dòng", "Lỗi cú pháp", "Mọi phòng"],
    answer: 1,
    explain: "Đã chạy: 0 dòng. x NOT IN (1, 2, NULL) có x <> NULL là UNKNOWN nên không bao giờ TRUE. Dùng NOT EXISTS.",
  },
  roadmap: [
    "Chặng 1: JOIN, GROUP BY, WHERE với HAVING.",
    "Chặng 2: window function, top N mỗi nhóm và các câu SQL kinh điển.",
    "Chặng 3: phân trang bảng lớn, HikariCP, SQL với NoSQL.",
  ],
  sections: [
    {
      id: "join",
      title: "Phần 1: JOIN và bẫy NULL",
      scene: "join",
      intro: [
        "Cả bài dùng hai bảng nhỏ, mọi kết quả bên dưới đều chạy trên đúng dữ liệu này. Bảng `dept(id, name)` có 3 phòng: `(1, IT)`, `(2, Sales)`, `(3, HR)`. Phòng HR **chưa có ai**.",
        "Bảng `employee(id, name, dept_id, salary, email)` có 8 người. Phòng IT (`dept_id = 1`): `(1, An, 3000, an@x.com)`, `(2, Binh, 3000, binh@x.com)`, `(3, Chi, 2500, chi@x.com)`, `(4, Dung, 2000, an@x.com)` (email trùng với An). Phòng Sales (`dept_id = 2`): `(5, Em, 2800)`, `(6, Giang, 2200)`, `(7, Ha, 2200)`. Và `(8, Khoa, dept_id NULL, 1800)`: Khoa **chưa thuộc phòng nào**.",
        "`INNER JOIN` chỉ giữ dòng khớp ở cả hai bảng; `LEFT JOIN` giữ mọi dòng bảng trái, bên phải không khớp thì các cột bên phải là NULL. Đã chạy: `employee JOIN dept` làm Khoa biến mất (dept_id NULL không khớp phòng nào); báo cáo `dept JOIN employee` đếm theo phòng làm mất phòng HR.",
      ],
      predict: {
        question: "Báo cáo số người mỗi phòng viết bằng `dept LEFT JOIN employee` rồi `count(*)`. Phòng HR (chưa có ai) ra bao nhiêu?",
        options: ["0", "1", "HR không xuất hiện", "NULL"],
        answer: 1,
        explain: "LEFT JOIN vẫn giữ một dòng cho HR, mọi cột của `e` là NULL. `count(*)` đếm dòng nên ra 1; `count(e.id)` bỏ qua NULL nên ra 0.",
      },
      widget: "join-null",
      widgetTitle: "Bảy cách viết, kết quả thật",
      after: [
        "Với LEFT JOIN phải đếm `count(e.id)` chứ không `count(*)`: HR vẫn có một dòng với mọi cột của `e` là NULL, `count(*)` đếm dòng đó thành 1, còn `count(e.id)` bỏ qua NULL nên ra 0. Điều kiện của bảng bên phải đặt ở WHERE sẽ biến LEFT JOIN thành INNER JOIN, vì WHERE chạy sau JOIN và loại luôn dòng có `e.salary` NULL của HR: đặt điều kiện đó vào ON.",
        "Bẫy thứ ba là **nhân dòng** (fan-out): JOIN một dòng cha với hai bảng con cùng lúc. Một đơn hàng có 3 item (giá 100, 200, 300) và 2 lần thanh toán. `order JOIN item JOIN payment` ghép mỗi item với **từng** payment, ra 3 × 2 = 6 dòng, nên `sum(item.price)` ra 1200 thay vì 600 (đã chạy). Cách sửa: tổng hợp từng bảng con trong subquery (một dòng mỗi đơn) rồi mới JOIN.",
      ],
      takeaway: {
        lines: [
          "LEFT JOIN: điều kiện của bảng phải đặt ở `ON`, đếm bằng `count(cột bên phải)`.",
          "JOIN một dòng cha với hai bảng con cùng lúc sẽ nhân dòng: tổng hợp từng bảng con trước rồi mới JOIN.",
        ],
      },
      quiz: {
        question: "Join 1 order với 3 item và 2 payment cùng lúc rồi sum(item.price). Chuyện gì xảy ra?",
        options: ["Đúng tổng", "Tổng bị nhân đôi vì ra 3 × 2 = 6 dòng", "Lỗi SQL", "Chỉ lấy item đầu tiên"],
        answer: 1,
        explain: "Fan-out khi join hai quan hệ một-nhiều cùng lúc. Aggregate từng bảng trong subquery rồi mới join.",
      },
    },
    {
      id: "group-by",
      title: "Phần 2: GROUP BY, WHERE và HAVING",
      scene: "groupby",
      intro: [
        "JOIN ghép các bảng lại; bước tiếp theo thường là gom nhóm rồi lọc. Muốn biết lọc ở đâu, phải biết câu SQL chạy theo thứ tự nào.",
        "Thứ tự logic: FROM và JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. `WHERE` lọc từng dòng trước khi gom nhóm nên không dùng được `count()`; `HAVING` lọc nhóm sau khi gom.",
        "Đã chạy \"phòng có ít nhất 2 người lương trên 2000\": IT có 4 người nhưng Dung (2000) bị WHERE loại trước khi đếm, còn 3. Điều kiện không dính aggregate thì để ở WHERE. PostgreSQL báo lỗi khi SELECT cột không nằm trong GROUP BY; MySQL cũ không bật `ONLY_FULL_GROUP_BY` thì trả giá trị ngẫu nhiên.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["FROM, JOIN → WHERE lọc dòng → GROUP BY gom nhóm → HAVING lọc nhóm → SELECT → ORDER BY → LIMIT."],
      },
      quiz: {
        question: "Alias đặt trong SELECT dùng được ở đâu?",
        options: ["Ở WHERE", "Ở ORDER BY (PostgreSQL, MySQL), không ở WHERE vì WHERE chạy trước SELECT", "Ở mọi nơi", "Không dùng được ở đâu"],
        answer: 1,
        explain: "WHERE chạy trước SELECT nên chưa biết alias.",
      },
    },
    {
      id: "window",
      title: "Phần 3: Window function và top N mỗi nhóm",
      scene: "window",
      intro: [
        "GROUP BY gộp mỗi nhóm thành **một dòng**. Khi cần tính theo nhóm mà vẫn giữ từng dòng (xếp hạng, tổng luỹ kế), ta dùng window function.",
        "Window function tính trên một nhóm dòng nhưng **giữ nguyên từng dòng**: `hàm() over (partition by ... order by ...)`.",
      ],
      predict: {
        question: "Ba người lương 3000, 3000, 2500, xếp giảm dần. `RANK()` cho ba hạng nào?",
        options: ["1, 2, 3", "1, 1, 2", "1, 1, 3", "1, 2, 2"],
        answer: 2,
        explain: "Hai người 3000 cùng hạng 1, người kế tiếp bị đẩy xuống hạng 3. `ROW_NUMBER` ra 1, 2, 3; `DENSE_RANK` không bỏ số nên ra 1, 1, 2.",
      },
      widget: "rank-functions",
      widgetTitle: "Đổi hàm xếp hạng",
      after: [
        "Với lương 3000, 3000, 2500: `ROW_NUMBER` ra 1, 2, 3; `RANK` ra 1, 1, 3; `DENSE_RANK` ra 1, 1, 2.",
        "Top N mỗi nhóm: `dense_rank() over (partition by dept_id order by salary desc)` trong subquery, lọc `<= N` ở ngoài. Không lọc thẳng `where dense_rank() over (...) <= 2` được, vì thứ tự logic là FROM, WHERE, GROUP BY, HAVING, rồi mới tính window function: lúc WHERE chạy, hạng chưa tồn tại, PostgreSQL báo `window functions are not allowed in WHERE`. Đề hỏi N người thì ROW_NUMBER, N mức lương thì DENSE_RANK. Tổng luỹ kế: `sum(salary) over (partition by dept_id order by id)` cho Sales (Em 2800, Giang 2200, Ha 2200) ra 2800, 5000, 7200.",
        "Riêng top 1 mỗi nhóm, PostgreSQL có cách ngắn hơn: **DISTINCT ON**. `select distinct on (dept_id) * from employee order by dept_id, salary desc` giữ **dòng đầu tiên** của mỗi `dept_id` theo thứ tự `ORDER BY`, tức người lương cao nhất mỗi phòng (đã chạy: An, Em, và một dòng Khoa cho nhóm `dept_id` NULL). An và Binh cùng 3000 nên ai được giữ là không chắc chắn: thêm `id` vào cuối `ORDER BY` để cố định. Cột trong `distinct on` phải đứng đầu `ORDER BY`. Đây là cú pháp riêng của PostgreSQL; ở hệ khác dùng `row_number() ... = 1`.",
      ],
      takeaway: {
        lines: ["Đề hỏi N người thì `ROW_NUMBER`, N mức lương thì `DENSE_RANK`; lọc hạng ở query ngoài, không lọc ở WHERE."],
      },
      quiz: {
        question: "Lấy đơn mới nhất của mỗi khách trên PostgreSQL, cách ngắn gọn nhất?",
        options: [
          "group by customer_id",
          "select distinct on (customer_id) * from orders order by customer_id, created_at desc",
          "max(created_at) rồi join lại không cần",
          "Không làm được",
        ],
        answer: 1,
        explain: "DISTINCT ON là cú pháp riêng của PostgreSQL, tận dụng được index (customer_id, created_at). Cách chuẩn SQL là row_number() = 1.",
      },
    },
    {
      id: "classic",
      title: "Phần 4: Các câu SQL kinh điển",
      scene: "classic",
      intro: [
        "JOIN, GROUP BY và window function ghép lại đủ để giải các câu SQL hay gặp nhất khi phỏng vấn:",
        "- **Lương cao thứ 2**: `max(salary) where salary < (select max(salary))` ra 2800. Có hai người cùng 3000, nên `order by salary desc offset 1 limit 1` **không có distinct** trả 3000, sai; thêm `distinct` hoặc dùng `dense_rank() = 2`.",
        "- **Tìm trùng**: `group by email having count(*) > 1` ra `an@x.com | 2`; muốn xoá bớt thì `row_number() over (partition by email order by id) > 1`.",
        "- **Tìm \"chưa có\"**: dùng `NOT EXISTS`, không dùng `NOT IN` với subquery có thể chứa NULL. Trên 1 triệu order, `NOT EXISTS` chạy thành Hash Anti Join 648 ms, `LEFT JOIN ... IS NULL` 1086 ms, cùng 10.004 khách.",
      ],
      quiz: {
        question: "Vì sao `order by salary desc offset 1 limit 1` có thể sai khi tìm lương cao thứ 2?",
        options: ["OFFSET không hỗ trợ", "Nếu nhiều người cùng lương cao nhất, dòng thứ 2 vẫn là lương cao nhất", "LIMIT phải đứng trước", "Không sai"],
        answer: 1,
        explain: "Đã chạy: trả 3000. Thêm distinct thì ra 2800.",
      },
    },
    {
      id: "pagination",
      title: "Phần 5: Phân trang: OFFSET và keyset",
      scene: "paging",
      intro: [
        "Các câu trên trả vài dòng. Màn hình danh sách thì khác: bảng 1 triệu dòng, người dùng bấm tới trang rất sâu.",
        "`LIMIT 20 OFFSET 900000` không nhảy được: DB đọc rồi bỏ 900.000 dòng. Keyset `where id > :lastId order by id limit 20` thì đi thẳng tới id qua index.",
      ],
      predict: {
        question: "Bảng `orders` 1 triệu dòng. Lấy 20 dòng ở `OFFSET 900000` so với `OFFSET 0` thì sao?",
        options: [
          "Nhanh như nhau, vì đều chỉ trả 20 dòng",
          "Chậm hơn nhiều, vì DB đọc rồi bỏ 900.000 dòng trước khi trả 20 dòng",
          "Nhanh hơn, vì dữ liệu cuối bảng đã nằm trong cache",
          "Báo lỗi vì OFFSET quá lớn",
        ],
        answer: 1,
        explain: "OFFSET không nhảy được: offset 0 mất 0,1 ms, offset 900 nghìn mất 168 ms. Keyset luôn đọc 20 dòng, 0,09 ms.",
      },
      widget: "pagination",
      widgetTitle: "OFFSET sâu dần so với keyset",
      after: [
        "Đã đo trên 1 triệu dòng: offset 0 là 0,1 ms, 100 nghìn là 14 ms, 500 nghìn là 100 ms, 900 nghìn là 168 ms. Keyset luôn đọc 20 dòng, 0,09 ms.",
        "Sắp theo cột không duy nhất thì kèm cột phụ: `(created_at, id) < (:lastCreatedAt, :lastId)`; cùng lọc `status = 'PAID'`, OFFSET 500 nghìn mất 1303 ms, keyset 0,45 ms. Đổi lại keyset không nhảy tới trang bất kỳ. Nếu bắt buộc có số trang, có thể dùng **deferred join** (join trì hoãn): bước một chỉ lấy 20 `id` bằng `select id ... order by id limit 20 offset X`, chạy được hoàn toàn trên index (Index Only Scan, không đọc bảng), bước hai mới JOIN lại bảng để lấy đủ cột cho đúng 20 id đó. Vẫn phải bỏ qua X mục, nhưng là mục index nhỏ chứ không phải cả dòng. Spring Data `Page` chạy thêm câu `COUNT`; không cần tổng số trang thì dùng `Slice`; từ Spring Data 3.1 có `ScrollPosition.keyset()` và `Window<T>`.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["OFFSET lớn → DB đọc rồi bỏ từng ấy dòng → càng về sau càng chậm. Keyset nhớ id cuối → luôn đọc đúng 20 dòng."],
      },
      quiz: {
        question: "Bắt buộc có số trang trên bảng lớn, cách nào KHÔNG giúp?",
        options: [
          "Giới hạn số trang tối đa",
          "Deferred join: lấy 20 id bằng Index Only Scan rồi join lại",
          "Cache hoặc ước lượng COUNT",
          "Tăng OFFSET lên cho nhanh",
        ],
        answer: 3,
        explain: "OFFSET càng lớn càng chậm tuyến tính.",
      },
      parts: [
        {
          id: "keyset-tiebreak",
          title: "Keyset: vì sao bookmark cần khóa phụ duy nhất",
          intro: [
            "Keyset nhớ dòng cuối của trang. Chuyện này ổn khi bookmark là khóa duy nhất như `id`. Nhưng danh sách thật hay sắp theo `created_at`, và nhiều dòng có cùng `created_at`.",
            "Các dòng cùng giá trị sắp xếp nằm cạnh nhau, và thứ tự giữa chúng **không được đảm bảo**. Nếu bookmark chỉ là `created_at`, có hai kiểu lỗi:",
            "- **`created_at > :last`**: bỏ sót mọi dòng còn lại có cùng `created_at` với dòng cuối của trang.",
            "- **`created_at >= :last`**: không sót, nhưng lặp lại các dòng đã thấy. Nếu số dòng trùng từ cỡ trang trở lên, bookmark không nhích được và danh sách kẹt ở một chỗ.",
            "Đã chạy trên PGlite 18 với dữ liệu T24, bảng `stmt_entry` (932 dòng) sắp theo `booking_date, stmt_entry_id`: các bút toán đi từng cặp cùng ngày, id 5 và id 6 cùng ngày 2023-07-25. Trang đầu 5 dòng kết thúc ở id 5. Điều kiện `booking_date > '2023-07-25'` cho 926 dòng, trong khi số dòng thật sự sau trang đầu là 927: id 6 biến mất.",
            "Cách sửa là thêm một cột duy nhất vào cả `ORDER BY` lẫn bookmark: bookmark là cặp `(created_at, id)`. Cột `id` là **tiebreaker**: nó cho mọi dòng một vị trí duy nhất, nên trang kế bắt đầu ngay sau dòng cuối.",
            "Điều kiện \"đứng sau cặp này\" viết được bằng **row-value** (so sánh theo từ điển): `WHERE (booking_date, stmt_entry_id) > (:d, :id)`. Đã chạy: với index `(booking_date, stmt_entry_id)`, PostgreSQL ghi `Index Cond: (ROW(booking_date, stmt_entry_id) > ROW(...))`, tức cả hai cột thu hẹp đoạn đọc.",
            "Cách viết không dùng row-value: `booking_date >= :d AND NOT (booking_date = :d AND stmt_entry_id <= :id)`. Đã chạy với bookmark `(2024-02-01, 500)`: row-value, dạng `OR` mở rộng và dạng này đều đếm 793 dòng. Về kế hoạch: dạng này chỉ có `booking_date >= :d` ở `Index Cond`, phần còn lại là `Filter` (vẫn bắt đầu đúng ngày). Dạng `OR` trần `booking_date > :d OR (booking_date = :d AND stmt_entry_id > :id)` thì không có điều kiện nào thu hẹp đoạn đọc, chỉ có `Filter`, nên đừng dùng nó cho trang sâu.",
            "Hỗ trợ row-value khác nhau giữa các engine. PostgreSQL đã chạy ở trên. Các engine khác tôi chưa chạy, chỉ ghi lại theo tài liệu tham khảo: SQL Server không có cú pháp này, Oracle không so sánh khoảng bằng row-value (nguồn tham khảo ghi lỗi `ORA-01796`), còn MySQL nhận cú pháp nhưng có báo cáo rằng optimizer không dùng nó như điều kiện thu hẹp đầy đủ. Khi phải chạy trên nhiều engine, dạng không dùng row-value là chỗ an toàn hơn. Dù vậy luôn đọc `EXPLAIN` trên engine bạn dùng.",
            "Trang trước thì đảo cả dấu so sánh lẫn hướng `ORDER BY`, rồi đảo lại thứ tự khi hiển thị. Thử bookmark trên bảng 8 dòng có 5 dòng cùng giờ.",
          ],
          predict: {
            question: "Sắp theo `created_at`, trang 3 dòng, có 5 dòng cùng `created_at`. Dùng `created_at > :last` làm điều kiện trang kế. Chuyện gì xảy ra?",
            options: [
              "Mọi dòng vẫn xuất hiện đúng một lần",
              "Các dòng còn lại cùng `created_at` với dòng cuối của trang bị bỏ sót",
              "Dòng bị lặp ở trang sau",
              "Câu truy vấn báo lỗi",
            ],
            answer: 1,
            explain: "`>` loại cả những dòng cùng giá trị chưa kịp hiện ra. Muốn không sót mà không lặp thì cần khóa phụ duy nhất để phân biệt các dòng trùng.",
          },
          widget: "keyset-bookmark",
          widgetTitle: "Bookmark có và không có tiebreaker",
          sql: [
            {
              prompt: "Trang đầu là 5 dòng đầu theo `(booking_date, stmt_entry_id)`, kết thúc ở id 5 ngày 2023-07-25. Lấy 5 dòng kế bằng row-value: bắt đầu từ id 6, không sót.",
              starter: "SELECT stmt_entry_id, booking_date\nFROM stmt_entry\nWHERE (booking_date, stmt_entry_id) > (DATE '2023-07-25', ____)\nORDER BY booking_date, stmt_entry_id\nLIMIT 5;",
              solution: "SELECT stmt_entry_id, booking_date FROM stmt_entry WHERE (booking_date, stmt_entry_id) > (DATE '2023-07-25', 5) ORDER BY booking_date, stmt_entry_id LIMIT 5",
              ordered: true,
              hint: "Id của dòng cuối trang đầu là 5.",
            },
            {
              prompt: "Cùng trang kế nhưng viết không dùng row-value: `booking_date >= :d AND NOT (booking_date = :d AND stmt_entry_id <= :id)`. Kết quả giống hệt bài trên.",
              starter: "SELECT stmt_entry_id, booking_date\nFROM stmt_entry\nWHERE booking_date >= DATE '2023-07-25'\n  AND NOT (booking_date = DATE '2023-07-25' AND stmt_entry_id <= ____)\nORDER BY booking_date, stmt_entry_id\nLIMIT 5;",
              solution: "SELECT stmt_entry_id, booking_date FROM stmt_entry WHERE booking_date >= DATE '2023-07-25' AND NOT (booking_date = DATE '2023-07-25' AND stmt_entry_id <= 5) ORDER BY booking_date, stmt_entry_id LIMIT 5",
              ordered: true,
              hint: "Cùng id của dòng cuối trang đầu: 5.",
            },
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Bookmark là cột không duy nhất → các dòng trùng giá trị không có thứ tự cố định → trang kế bỏ sót (với `>`) hoặc lặp (với `>=`).",
              "Thêm cột duy nhất vào `ORDER BY` và bookmark → mọi dòng có vị trí riêng. Viết bằng row-value nếu engine hỗ trợ, nếu không thì dạng `>= AND NOT (= AND <=)`.",
            ],
          },
          quiz: {
            question: "Sắp theo `(created_at, id)`, dòng cuối trang là `(09:05, 4)`. Điều kiện trang kế đúng là gì?",
            options: [
              "`created_at > '09:05'`",
              "`created_at >= '09:05'`",
              "`(created_at, id) > ('09:05', 4)`",
              "`id > 4`",
            ],
            answer: 2,
            explain: "Cặp so sánh theo từ điển: lấy mọi dòng có created_at lớn hơn, hoặc cùng created_at nhưng id lớn hơn 4. `>` sót, `>=` lặp, còn `id > 4` bỏ qua thứ tự created_at.",
          },
        },
      ],
    },
    {
      id: "hikari",
      title: "Phần 6: HikariCP và lỗi Connection is not available",
      scene: "hikari",
      intro: [
        "Query đã nhanh, nhưng mỗi query còn cần mượn một **connection** từ pool. Hình dung pool như quầy có 10 nhân viên: một khách giữ nhân viên quá lâu thì người xếp hàng sau phải chờ, chờ quá giờ thì bỏ về.",
        "Spring Boot dùng HikariCP, mặc định `maximum-pool-size = 10`, `connection-timeout = 30000 ms`. Một request giữ connection suốt transaction. Đã tái hiện pool 2, timeout 1000 ms: `HikariPool-1 - Connection is not available, request timed out after 1006ms (total=2, active=2, idle=0, waiting=0)`.",
        "Vài thuật ngữ của Spring/JPA dùng ở đây (học kỹ ở các bài JPA sau):",
        "- **`@Transactional`**: mở một transaction quanh method và giữ một connection cho tới khi method kết thúc (bài \"Transaction Proxy Mechanism\").",
        "- **`REQUIRES_NEW`**: kiểu propagation tạm dừng transaction đang chạy và mở một transaction **mới với connection thứ hai** (bài \"Propagation\").",
        "- **N+1**: lấy 1 câu cho danh sách rồi N câu cho từng phần tử.",
        "- **OSIV** (Open Session In View): giữ phiên JPA, và connection, mở suốt request kể cả lúc render response (bài \"Lazy Loading & N+1\").",
        "Nguyên nhân thường không phải pool nhỏ mà là giữ connection lâu:",
        "- **Gọi API ngoài** trong `@Transactional`.",
        "- **Transaction dài**.",
        "- **N+1 và OSIV**.",
        "- **`REQUIRES_NEW` lồng nhau**: một request cần 2 connection.",
        "- **Leak**: bật `leak-detection-threshold` để tìm.",
        "- **Query thiếu index**.",
        "Pool lớn hơn không tốt hơn: HikariCP gợi ý `(số core × 2) + số ổ đĩa`, và nhân với số instance: 10 pod × 50 = 500 connection, vượt `max_connections` mặc định 100 của PostgreSQL.",
        "Thời gian giữ connection không chỉ là thời gian chạy SQL: với `@Transactional`, connection bị mượn từ lúc transaction bắt đầu tới lúc commit, gồm cả xử lý Java và map DTO ở giữa. Pool 10, mỗi request giữ 50 ms thì trần là 200 request mỗi giây, và tăng Tomcat thread không nâng được trần đó (bài ThreadPoolExecutor, phần \"Thread pool và connection pool: cái nào là trần\").",
      ],
      takeaway: {
        lines: ["Gặp `Connection is not available`, tìm chỗ giữ connection lâu trước, rồi mới tính lại pool size theo số core và số instance."],
      },
      quiz: {
        question: "Vì sao REQUIRES_NEW có thể treo cả ứng dụng khi tải cao?",
        options: [
          "Vì nó tắt transaction",
          "Mỗi request giữ connection 1 rồi chờ connection 2; 10 request chiếm hết pool 10 thì cùng chờ mãi tới timeout",
          "Vì nó khoá bảng",
          "Không thể xảy ra",
        ],
        answer: 1,
        explain: "Deadlock pool. Hạn chế REQUIRES_NEW trên đường xử lý nóng.",
      },
    },
    {
      id: "nosql",
      title: "Phần 7: SQL và NoSQL",
      scene: "nosql",
      intro: [
        "Mọi phần trên đều dùng database quan hệ. Câu phỏng vấn hay đi kèm: khi nào chọn NoSQL?",
        "SQL (PostgreSQL, MySQL): bảng, quan hệ, schema chặt, ACID nhiều bảng, query linh hoạt; hợp đơn hàng, thanh toán, tồn kho.",
        "NoSQL tối ưu cho mẫu truy cập biết trước và scale ngang, gồm các loại:",
        "- **Document**: MongoDB.",
        "- **Key-value**: Redis.",
        "- **Wide-column**: Cassandra.",
        "- **Search**: Elasticsearch.",
        "Thực tế dùng cả hai: PostgreSQL là nguồn dữ liệu chính, Redis làm cache, Elasticsearch phục vụ tìm kiếm.",
      ],
      quiz: {
        question: "Dữ liệu nào hợp NoSQL key-value hơn SQL?",
        options: ["Số dư tài khoản ngân hàng", "Session đăng nhập và cache đọc nhiều", "Đơn hàng kèm item và thanh toán", "Tồn kho cần trừ chính xác"],
        answer: 1,
        explain: "Các lựa chọn còn lại cần ACID nhiều bảng.",
      },
    },
  ],
  modelAnswer:
    "INNER JOIN chỉ giữ dòng khớp, LEFT JOIN giữ mọi dòng bên trái; điều kiện của bảng bên phải em đặt trong ON, và đếm bằng count(cột) để không đếm dòng NULL. WHERE lọc dòng trước GROUP BY, HAVING lọc nhóm sau. Top N mỗi nhóm em dùng dense_rank hoặc row_number trong subquery. Tìm bản ghi chưa có em dùng NOT EXISTS, vì em đã thử NOT IN với một giá trị NULL và nó trả 0 dòng. Phân trang bảng lớn em dùng keyset: em đo offset 900 nghìn mất khoảng 170 ms, keyset dưới 0,1 ms, kèm id làm cột phụ khi sort theo cột không duy nhất, và dùng Slice khi không cần tổng số trang. Gặp lỗi Connection is not available em tìm chỗ giữ connection lâu trước, như gọi API ngoài trong transaction, N+1 hay REQUIRES_NEW lồng nhau, rồi mới tính lại pool size theo số core DB và số instance.",
};
