import timeline from "../timelines/sql.json";
import type { Lesson, Scene } from "../types";

// Small queries re-run on PostgreSQL 16 (dept/employee sample); pagination and anti-join timings from study note 03.07
// (1M orders), HikariCP error from Spring Boot 3.5.
export const sql: Lesson = {
  slug: "sql",
  crumb: "SQL Queries & Pagination",
  videoDir: "/videos/sql-queries",
  // Per-scene clips cut by `video-kit/pipeline.py sql-video publish`, which also rewrites videoVersion.
  videoVersion: "d235439a",
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
        "`INNER JOIN` chỉ giữ dòng khớp ở cả hai bảng; `LEFT JOIN` giữ mọi dòng bảng trái, bên phải không khớp thì NULL. Đã chạy: nhân viên Khoa chưa có phòng biến mất khi INNER JOIN; báo cáo đếm theo phòng bằng INNER JOIN làm mất phòng HR chưa có ai.",
        "Với LEFT JOIN phải đếm `count(e.id)` chứ không `count(*)`. Điều kiện của bảng bên phải đặt ở WHERE sẽ biến LEFT JOIN thành INNER JOIN: đặt vào ON. Không cần loại trùng thì dùng `UNION ALL` thay `UNION`.",
      ],
      widget: "join-null",
      widgetTitle: "Bảy cách viết, kết quả thật",
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
        "Thứ tự logic: FROM và JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. `WHERE` lọc từng dòng trước khi gom nhóm nên không dùng được `count()`; `HAVING` lọc nhóm sau khi gom.",
        "Đã chạy \"phòng có ít nhất 2 người lương trên 2000\": IT có 4 người nhưng Dung (2000) bị WHERE loại trước khi đếm, còn 3. Điều kiện không dính aggregate thì để ở WHERE. PostgreSQL báo lỗi khi SELECT cột không nằm trong GROUP BY; MySQL cũ không bật `ONLY_FULL_GROUP_BY` thì trả giá trị ngẫu nhiên.",
      ],
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
        "Window function tính trên một nhóm dòng nhưng **giữ nguyên từng dòng**: `hàm() over (partition by ... order by ...)`. Với lương 3000, 3000, 2500: `ROW_NUMBER` ra 1, 2, 3; `RANK` ra 1, 1, 3; `DENSE_RANK` ra 1, 1, 2.",
        "Top N mỗi nhóm: `dense_rank() over (partition by dept_id order by salary desc)` trong subquery, lọc `<= N` ở ngoài, vì window function chạy sau WHERE. Đề hỏi N người thì ROW_NUMBER, N mức lương thì DENSE_RANK. Tổng luỹ kế: `sum(salary) over (partition by dept_id order by id)` cho Sales ra 2800, 5000, 7200.",
      ],
      widget: "rank-functions",
      widgetTitle: "Đổi hàm xếp hạng",
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
        "Lương cao thứ 2: `max(salary) where salary < (select max(salary))` ra 2800. Có hai người cùng 3000, nên `order by salary desc offset 1 limit 1` **không có distinct** trả 3000, sai; thêm `distinct` hoặc dùng `dense_rank() = 2`.",
        "Tìm trùng: `group by email having count(*) > 1` ra `an@x.com | 2`; muốn xoá bớt thì `row_number() over (partition by email order by id) > 1`. Tìm \"chưa có\": dùng `NOT EXISTS`, không dùng `NOT IN` với subquery có thể chứa NULL. Trên 1 triệu order, `NOT EXISTS` chạy thành Hash Anti Join 648 ms, `LEFT JOIN ... IS NULL` 1086 ms, cùng 10.004 khách.",
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
        "`LIMIT 20 OFFSET 900000` không nhảy được: DB đọc rồi bỏ 900.000 dòng. Đã đo trên 1 triệu dòng: offset 0 là 0,1 ms, 100 nghìn là 14 ms, 500 nghìn là 100 ms, 900 nghìn là 168 ms. Keyset `where id > :lastId order by id limit 20` luôn đọc 20 dòng, 0,09 ms.",
        "Sắp theo cột không duy nhất thì kèm cột phụ: `(created_at, id) < (:lastCreatedAt, :lastId)`; cùng lọc `status = 'PAID'`, OFFSET 500 nghìn mất 1303 ms, keyset 0,45 ms. Đổi lại keyset không nhảy tới trang bất kỳ. Spring Data `Page` chạy thêm câu `COUNT`; không cần tổng số trang thì dùng `Slice`; từ Spring Data 3.1 có `ScrollPosition.keyset()` và `Window<T>`.",
      ],
      widget: "pagination",
      widgetTitle: "OFFSET sâu dần so với keyset",
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
    },
    {
      id: "hikari",
      title: "Phần 6: HikariCP và lỗi Connection is not available",
      scene: "hikari",
      intro: [
        "Spring Boot dùng HikariCP, mặc định `maximum-pool-size = 10`, `connection-timeout = 30000 ms`. Một request giữ connection suốt transaction. Đã tái hiện pool 2, timeout 1000 ms: `HikariPool-1 - Connection is not available, request timed out after 1006ms (total=2, active=2, idle=0, waiting=0)`.",
        "Nguyên nhân thường không phải pool nhỏ mà là giữ connection lâu: gọi API ngoài trong `@Transactional`, transaction dài, N+1 và OSIV, `REQUIRES_NEW` lồng nhau (một request cần 2 connection), leak (bật `leak-detection-threshold`), query thiếu index. Pool lớn hơn không tốt hơn: HikariCP gợi ý `(số core × 2) + số ổ đĩa`, và nhân với số instance: 10 pod × 50 = 500 connection, vượt `max_connections` mặc định 100 của PostgreSQL.",
      ],
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
        "SQL (PostgreSQL, MySQL): bảng, quan hệ, schema chặt, ACID nhiều bảng, query linh hoạt; hợp đơn hàng, thanh toán, tồn kho. NoSQL: document (MongoDB), key-value (Redis), wide-column (Cassandra), search (Elasticsearch); tối ưu cho mẫu truy cập biết trước và scale ngang.",
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
