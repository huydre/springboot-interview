import timeline from "../timelines/sql-window.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 10. Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlWindow: Lesson = {
  slug: "sql-window",
  crumb: "Window Functions",
  videoDir: "/videos/sql-window",
  videoVersion: "a39ebedb",
  scenes: timeline as Scene[],
  title: "Window Functions: xếp hạng, so dòng trước sau, số dư chạy",
  subtitle:
    "GROUP BY gộp nhiều dòng thành một. Hàm cửa sổ thì ngược lại: tính toán trên một nhóm dòng nhưng vẫn giữ nguyên từng dòng. Nhờ vậy bạn xếp hạng khách trong chi nhánh, so ngày hôm nay với hôm qua, và tính số dư chạy của một tài khoản chỉ bằng một câu SQL.",
  openingQuiz: {
    question: "Bạn muốn danh sách 85 tài khoản, mỗi dòng có thêm một cột là tổng số dư của chi nhánh chứa tài khoản đó. Cách nào giữ đủ 85 dòng?",
    options: [
      "`GROUP BY company_id` với `sum(working_balance)`, vì GROUP BY luôn giữ mọi dòng",
      "`sum(working_balance) OVER (PARTITION BY company_id)`, vì hàm cửa sổ tính theo nhóm mà không gộp dòng",
      "`SELECT DISTINCT company_id, working_balance`, vì DISTINCT sẽ tự cộng số dư lại",
      "`HAVING sum(working_balance) > 0`, vì HAVING thêm cột tổng vào từng dòng",
    ],
    answer: 1,
    explain: "GROUP BY gộp 85 dòng còn 5 dòng (mỗi chi nhánh một dòng), nên mất chi tiết từng tài khoản. Hàm cửa sổ với `OVER (PARTITION BY ...)` tính tổng theo từng chi nhánh rồi gắn lại vào mọi dòng, giữ đủ 85 dòng. DISTINCT chỉ bỏ dòng trùng, không cộng gì. HAVING chỉ lọc nhóm sau khi gộp.",
  },
  roadmap: [
    "Chặng 1: OVER, PARTITION BY và ORDER BY trong OVER: cách một hàm tính trên cửa sổ dòng mà vẫn giữ nguyên dòng.",
    "Chặng 2: xếp hạng với ROW_NUMBER, RANK, DENSE_RANK, và nhìn dòng liền trước, liền sau với LAG, LEAD.",
    "Chặng 3: số dư chạy với SUM() OVER và khung mặc định, top N mỗi nhóm bằng CTE, và vì sao không dùng hàm cửa sổ trong WHERE.",
  ],
  sections: [
    {
      id: "over-basics",
      trap: {
        title: "Hàm cửa sổ chỉ thấy các dòng còn lại sau WHERE",
        text: "`WHERE` chạy trước. Lọc `company_id = 'VN0010003'` thì `max(working_balance) OVER ()` ra 1.777.312.000, là số dư lớn nhất của chi nhánh đó chứ không phải của cả ngân hàng. Muốn so với toàn bảng, tính cửa sổ ở lớp trong rồi mới lọc ở lớp ngoài.",
      },
      title: "Phần 1: OVER, tính toán mà không gộp dòng",
      scene: "over-basics",
      intro: [
        "Ở bài tổng hợp bạn đã dùng `sum`, `avg`, `count` cùng `GROUP BY`: 85 tài khoản gộp lại thành 5 dòng, mỗi chi nhánh một dòng, và chi tiết từng tài khoản biến mất. Đôi khi bạn cần cả hai: vừa thấy từng tài khoản, vừa thấy con số tổng hợp ngay cạnh nó. Đó là việc của **hàm cửa sổ** (window function).",
        "Hình dung bạn đứng trước bảng điểm cả lớp. Với `GROUP BY`, bạn xé giấy, chỉ giữ lại một dòng điểm trung bình mỗi tổ. Với hàm cửa sổ, bạn giữ nguyên bảng điểm, chỉ viết thêm một cột \"điểm trung bình của tổ\" cạnh mỗi bạn. Từ khoá tạo ra điều đó là `OVER`: `avg(working_balance) OVER ()` nghĩa là \"tính trung bình trên một cửa sổ dòng, rồi gắn kết quả vào từng dòng\". Cặp ngoặc rỗng nghĩa là cửa sổ là **toàn bộ** các dòng đang xét. Trên 85 tài khoản, trung bình số dư là 204.026.227,04 và nó xuất hiện ở cả 85 dòng.",
        "Bài tập thứ hai bên dưới minh hoạ điều này (xem khung bẫy).",
      ],
      sql: [
        {
          prompt: "Hiện `account_id`, `working_balance` và số dư trung bình của toàn bộ ngân hàng làm tròn 2 số lẻ (đặt tên cột `avg_all`), xếp theo `account_id`, lấy 5 dòng đầu. Điền hàm cửa sổ. Cột `avg_all` ở mọi dòng đều là 204026227.04.",
          starter: "SELECT account_id, working_balance,\n       round(avg(working_balance) ____, 2) AS avg_all\nFROM account\nORDER BY account_id\nLIMIT 5;",
          solution: "SELECT account_id, working_balance, round(avg(working_balance) OVER (), 2) AS avg_all FROM account ORDER BY account_id LIMIT 5",
          hint: "Cửa sổ là toàn bộ dòng nên chỉ cần từ khoá OVER và cặp ngoặc rỗng.",
          ordered: true,
        },
        {
          prompt: "Chỉ lấy tài khoản của chi nhánh `VN0010003`, hiện `account_id`, `working_balance` và `max(working_balance) OVER ()` đặt tên `max_in_view`, xếp theo `account_id`. Kết quả có 17 dòng và cột cuối đều là 1777312000.00, vì WHERE đã lọc trước khi cửa sổ tính.",
          starter: "SELECT account_id, working_balance,\n       max(working_balance) OVER () AS max_in_view\nFROM account\nWHERE ...\nORDER BY account_id;",
          solution: "SELECT account_id, working_balance, max(working_balance) OVER () AS max_in_view FROM account WHERE company_id = 'VN0010003' ORDER BY account_id",
          hint: "Chỉ cần thêm điều kiện lọc theo cột company_id.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Khác biệt cốt lõi giữa `sum(working_balance) OVER ()` và `sum(working_balance)` đi cùng `GROUP BY` là gì?",
        options: [
          "Hàm cửa sổ giữ nguyên số dòng và gắn kết quả vào từng dòng, còn GROUP BY gộp các dòng lại",
          "Hàm cửa sổ chỉ chạy trên số nguyên, còn GROUP BY chạy trên mọi kiểu dữ liệu",
          "Hàm cửa sổ bỏ qua điều kiện WHERE, còn GROUP BY thì tôn trọng WHERE",
          "Hàm cửa sổ luôn nhanh hơn, còn GROUP BY luôn chậm hơn nhiều lần",
        ],
        answer: 0,
        explain: "Đó là điểm khác nhau duy nhất bạn cần nhớ: giữ dòng hay gộp dòng. Cả hai đều chạy được trên numeric. WHERE chạy trước cả hai, nên cửa sổ vẫn chỉ thấy các dòng sau khi lọc (bài tập 2). Tốc độ phụ thuộc câu hỏi cụ thể, không có quy tắc luôn nhanh hơn.",
      },
    },
    {
      id: "partition-order",
      title: "Phần 2: PARTITION BY và ORDER BY bên trong OVER",
      scene: "partition-order",
      intro: [
        "Cửa sổ rỗng `OVER ()` là cả bảng. Muốn chia nhỏ, thêm `PARTITION BY`: **partition** là một nhóm dòng chung giá trị của cột đã chọn. `sum(working_balance) OVER (PARTITION BY company_id)` tính tổng riêng cho từng chi nhánh, rồi gắn đúng tổng của chi nhánh vào mọi tài khoản thuộc chi nhánh đó. Khác với `GROUP BY`, các dòng không bị gộp: 85 dòng vào, 85 dòng ra.",
        "Thêm `ORDER BY` bên trong `OVER` thì quy định **thứ tự các dòng trong từng partition**. Thứ tự này là thứ mà các hàm xếp hạng và hàm nhìn dòng trước sau cần (phần 3 đến 5). Hãy nhớ hai `ORDER BY` khác nhau: cái trong `OVER` chỉ định thứ tự để tính toán, cái ở cuối câu lệnh mới quyết định thứ tự hiện kết quả.",
        "Mọi hàm cửa sổ đều có cùng một dạng: `tên_hàm(...) OVER (PARTITION BY nhóm ORDER BY thứ_tự)`. Chỉ tên hàm là đổi. Widget bên dưới chạy thật trên PostgreSQL với một mẫu nhỏ: màu nền là từng partition, bấm đổi hàm để thấy cột mới điền ra sao. Bạn chưa cần hiểu hết từng hàm, mấy phần sau sẽ lần lượt học. Hãy thử chuyển `RANK` và `DENSE_RANK` ở bộ số dư để thấy chỗ hai tài khoản bằng nhau.",
      ],
      widget: "sql-window-frame",
      widgetTitle: "Thử các hàm cửa sổ trên dữ liệu thật",
      sql: [
        {
          prompt: "Với mỗi tài khoản, hiện `account_id`, `company_id` và số tài khoản của chi nhánh đó (đặt tên `so_tk_chi_nhanh`). Xếp theo `account_id`, lấy 8 dòng đầu. Điền cột chia nhóm.",
          starter: "SELECT account_id, company_id,\n       count(*) OVER (PARTITION BY ____) AS so_tk_chi_nhanh\nFROM account\nORDER BY account_id\nLIMIT 8;",
          solution: "SELECT account_id, company_id, count(*) OVER (PARTITION BY company_id) AS so_tk_chi_nhanh FROM account ORDER BY account_id LIMIT 8",
          hint: "Muốn đếm riêng cho từng chi nhánh thì chia nhóm theo cột company_id.",
          ordered: true,
        },
        {
          prompt: "Tính tỷ trọng của mỗi tài khoản trong tổng số dư của chi nhánh, chỉ xét các tài khoản có số dư dương (68 dòng). Hiện `company_id`, `account_id`, `working_balance` và `pct` là phần trăm làm tròn 2 số lẻ. Xếp theo `company_id`, `working_balance` giảm dần, rồi `account_id`. Ví dụ ở `VN0010002` tài khoản 1000000062 chiếm 54.08% của tổng 5.645.314.569.",
          starter: "SELECT company_id, account_id, working_balance,\n       round(100.0 * working_balance / sum(working_balance) OVER (...), 2) AS pct\nFROM account\nWHERE working_balance > 0\nORDER BY company_id, working_balance DESC, account_id;",
          solution: "SELECT company_id, account_id, working_balance, round(100.0 * working_balance / sum(working_balance) OVER (PARTITION BY company_id), 2) AS pct FROM account WHERE working_balance > 0 ORDER BY company_id, working_balance DESC, account_id",
          hint: "Mẫu số là tổng số dư của chi nhánh, tức sum(working_balance) chia nhóm theo company_id.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Trong câu `SELECT ..., sum(working_balance) OVER (PARTITION BY company_id) FROM account`, câu lệnh trả về bao nhiêu dòng?",
        options: [
          "5 dòng, mỗi chi nhánh một dòng giống GROUP BY",
          "1 dòng, vì sum luôn trả về một tổng duy nhất",
          "85 dòng, mỗi tài khoản vẫn một dòng và tổng chi nhánh được gắn vào từng dòng",
          "Một số dòng ngẫu nhiên, tuỳ PostgreSQL chọn partition nào",
        ],
        answer: 2,
        explain: "PARTITION BY chỉ chia nhóm để tính, không gộp dòng. Bảng account có 85 dòng nên kết quả có 85 dòng. Số 5 là kết quả của GROUP BY, không phải của hàm cửa sổ. Kết quả không phụ thuộc may rủi nào.",
      },
    },
    {
      id: "ranking",
      trap: {
        title: "ROW_NUMBER không ổn định khi có dòng bằng nhau",
        text: "Ở `VN0010002`, hai tài khoản 1000000051 và 1000000009 cùng số dư 0 có `RANK` đều 11, nhưng `ROW_NUMBER` là 11 và 12 theo thứ tự không đảm bảo, lần chạy khác có thể đảo. Thêm cột phá hoà: `ORDER BY working_balance DESC, account_id`.",
      },
      title: "Phần 3: ROW_NUMBER, RANK, DENSE_RANK",
      scene: "ranking",
      intro: [
        "Ba hàm xếp hạng đều đánh số các dòng trong partition theo thứ tự của `ORDER BY` trong `OVER`, và chỉ khác nhau ở cách xử lý hai dòng **bằng nhau** (đồng hạng). `ROW_NUMBER()` đánh số liên tục 1, 2, 3, ... không bao giờ trùng, nên hai dòng bằng nhau vẫn nhận hai số khác nhau. `RANK()` cho hai dòng bằng nhau **cùng hạng**, rồi bỏ cách: sau hai hạng 9 là hạng 11. `DENSE_RANK()` cũng cho cùng hạng nhưng **không bỏ cách**: sau hai hạng 9 là hạng 10.",
        "Ví dụ thật ở chi nhánh `VN0010002` (14 tài khoản, xếp theo số dư giảm dần). Hai tài khoản 1000000008 và 1000000010 cùng số dư 10.176.229, cả hai đều `RANK` 9 và `DENSE_RANK` 9, nhưng `ROW_NUMBER` là 9 và 10. Hai tài khoản đã đóng 1000000009 và 1000000051 cùng số dư 0: `RANK` đều là 11 (không có hạng 10), còn `DENSE_RANK` đều là 10. Hạng cuối cùng, tài khoản vay 1000000073 có số dư -720.002.000, là `RANK` 14 nhưng `DENSE_RANK` chỉ là 12.",
        "Nhớ viết `DESC` khi xếp hạng giảm dần: mặc định `ORDER BY` là tăng dần và hạng 1 sẽ là số dư nhỏ nhất.",
      ],
      sql: [
        {
          prompt: "Xếp hạng 14 tài khoản của chi nhánh `VN0010002` theo số dư giảm dần. Hiện `account_id`, `working_balance`, `rk` là `RANK` và `dr` là `DENSE_RANK`. Xếp theo `working_balance` giảm dần rồi `account_id`. Kiểm tra: 1000000008 và 1000000010 đều có rk = 9, dr = 9.",
          starter: "SELECT account_id, working_balance,\n       RANK() OVER (ORDER BY working_balance DESC) AS rk,\n       ____() OVER (ORDER BY working_balance DESC) AS dr\nFROM account\nWHERE company_id = 'VN0010002'\nORDER BY working_balance DESC, account_id;",
          solution: "SELECT account_id, working_balance, RANK() OVER (ORDER BY working_balance DESC) AS rk, DENSE_RANK() OVER (ORDER BY working_balance DESC) AS dr FROM account WHERE company_id = 'VN0010002' ORDER BY working_balance DESC, account_id",
          hint: "Hàm xếp hạng không bỏ cách có tên bắt đầu bằng DENSE.",
          ordered: true,
        },
        {
          prompt: "Xếp hạng khách hàng theo tổng số dư các tài khoản của họ, trong từng chi nhánh của khách (`customer.company_id`). Hiện `company_id`, `customer_id`, `total` (tổng số dư) và `rk` (`RANK` trong chi nhánh, lớn nhất là 1). Xếp theo `company_id` rồi `rk`. Kết quả có 40 dòng. Ví dụ ở `VN0010002` khách 100036 hạng 1 với 3.235.868.789.",
          starter: "WITH t AS (\n  SELECT c.company_id, c.customer_id, sum(a.working_balance) AS total\n  FROM customer c\n  JOIN account a ON a.customer_id = c.customer_id\n  GROUP BY c.company_id, c.customer_id\n)\nSELECT company_id, customer_id, total,\n       RANK() OVER (PARTITION BY ... ORDER BY ...) AS rk\nFROM t\nORDER BY company_id, rk;",
          solution: "WITH t AS (SELECT c.company_id, c.customer_id, sum(a.working_balance) AS total FROM customer c JOIN account a ON a.customer_id = c.customer_id GROUP BY c.company_id, c.customer_id) SELECT company_id, customer_id, total, RANK() OVER (PARTITION BY company_id ORDER BY total DESC) AS rk FROM t ORDER BY company_id, rk",
          hint: "Chia nhóm theo chi nhánh và sắp theo tổng số dư giảm dần. CTE đã tính sẵn total cho mỗi khách.",
          ordered: true,
        },
        {
          prompt: "Đánh số thứ tự các tài khoản của mỗi khách theo ngày mở (tài khoản mở sớm nhất là số 1), dùng `account_id` để phá hoà. Hiện `customer_id`, `account_id`, `open_date` và `stt`. Xếp theo `customer_id` rồi `stt`, lấy 8 dòng đầu.",
          starter: "SELECT customer_id, account_id, open_date,\n       ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS stt\nFROM account\nORDER BY customer_id, stt\nLIMIT 8;",
          solution: "SELECT customer_id, account_id, open_date, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY open_date, account_id) AS stt FROM account ORDER BY customer_id, stt LIMIT 8",
          hint: "Chia nhóm theo customer_id. Trong OVER, sắp theo open_date rồi account_id.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Ba tài khoản có số dư 500, 300, 300, 100 (xếp giảm dần). Tài khoản có số dư 100 nhận `RANK` và `DENSE_RANK` lần lượt là bao nhiêu?",
        options: [
          "RANK = 4 và DENSE_RANK = 3",
          "RANK = 3 và DENSE_RANK = 4",
          "RANK = 4 và DENSE_RANK = 4",
          "RANK = 3 và DENSE_RANK = 3",
        ],
        answer: 0,
        explain: "Hai tài khoản 300 cùng hạng 2. RANK bỏ cách nên dòng kế tiếp là hạng 4 (vì đã có 3 dòng đứng trước). DENSE_RANK không bỏ cách nên dòng kế tiếp là hạng 3. Các đáp án còn lại hoặc đảo hai hàm, hoặc cho hai hàm cùng một giá trị, trong khi chúng khác nhau đúng ở chỗ này.",
      },
    },
    {
      id: "lag-lead",
      trap: {
        title: "LAG nhìn dòng trước, không phải ngày hôm qua",
        text: "Với các ngày có chuyển khoản, \"ngày trước\" của 2024-01-11 là 2024-01-04, cách 7 ngày vì các ngày giữa không có dòng nào. Không có `ORDER BY` trong `OVER` thì \"trước\" và \"sau\" vô nghĩa. Cần ngày liền kề theo lịch thì phải tạo đủ các ngày trước.",
      },
      title: "Phần 4: LAG và LEAD, nhìn dòng liền trước và liền sau",
      scene: "lag-lead",
      intro: [
        "Nhiều câu hỏi nghiệp vụ so một dòng với dòng bên cạnh: \"hôm nay chuyển nhiều hơn hôm qua bao nhiêu?\". `LAG(cột)` lấy giá trị của cột ở **dòng liền trước** trong partition (theo thứ tự `ORDER BY` trong `OVER`), `LEAD(cột)` lấy ở **dòng liền sau**. Dòng đầu tiên không có dòng trước, nên `LAG` trả về NULL; dòng cuối không có dòng sau nên `LEAD` trả về NULL. Muốn thay NULL bằng giá trị khác, dùng tham số thứ ba: `LAG(cột, 1, 0)` (nhìn lùi 1 dòng, mặc định 0). Tham số thứ hai là khoảng cách, mặc định 1.",
        "Ví dụ thật: gom các chuyển khoản `DONE` bằng VND theo ngày (`processing_date`), được 83 ngày có chuyển khoản. Ngày 2024-01-04 tổng 2.000.000, ngày kế tiếp 2024-01-11 tổng 3.000.000. Với `LAG`, dòng ngày 01-11 thấy tổng của ngày trước là 2.000.000 nên chênh lệch là +1.000.000; ngày 01-17 tổng 1.000.000 nên chênh lệch là -2.000.000; ngày đầu tiên chênh lệch là NULL. Với `LEAD(processing_date)`, ngày 01-04 thấy ngày có chuyển khoản kế tiếp là 01-11.",
        "Luôn kèm `ORDER BY` trong `OVER` của `LAG` và `LEAD`.",
      ],
      sql: [
        {
          prompt: "Tính tổng tiền chuyển khoản `DONE` bằng VND theo ngày `processing_date`, rồi hiện thêm `prev_total` (tổng của ngày có chuyển khoản liền trước) và `diff` (chênh lệch hôm nay so với ngày đó). Xếp theo ngày, lấy 10 dòng đầu. Dòng đầu có `prev_total` và `diff` là NULL; dòng 2024-01-11 có diff = 1000000.00.",
          starter: "WITH d AS (\n  SELECT processing_date, sum(amount) AS total\n  FROM funds_transfer\n  WHERE status = 'DONE' AND ccy = 'VND'\n  GROUP BY processing_date\n)\nSELECT processing_date, total,\n       ____(total) OVER (ORDER BY processing_date) AS prev_total,\n       total - ____(total) OVER (ORDER BY processing_date) AS diff\nFROM d\nORDER BY processing_date\nLIMIT 10;",
          solution: "WITH d AS (SELECT processing_date, sum(amount) AS total FROM funds_transfer WHERE status = 'DONE' AND ccy = 'VND' GROUP BY processing_date) SELECT processing_date, total, LAG(total) OVER (ORDER BY processing_date) AS prev_total, total - LAG(total) OVER (ORDER BY processing_date) AS diff FROM d ORDER BY processing_date LIMIT 10",
          hint: "Cần nhìn giá trị của dòng liền trước, tên hàm có ba chữ cái.",
          ordered: true,
        },
        {
          prompt: "Với cùng dữ liệu theo ngày, hiện `processing_date` và `gap_days`: số ngày từ ngày đó tới ngày có chuyển khoản kế tiếp (`LEAD(processing_date)` trừ `processing_date`). Xếp theo ngày, lấy 6 dòng đầu. Dòng đầu là 7 (từ 2024-01-04 đến 2024-01-11).",
          starter: "WITH d AS (\n  SELECT DISTINCT processing_date\n  FROM funds_transfer\n  WHERE status = 'DONE' AND ccy = 'VND'\n)\nSELECT processing_date,\n       LEAD(...) OVER (...) - processing_date AS gap_days\nFROM d\nORDER BY processing_date\nLIMIT 6;",
          solution: "WITH d AS (SELECT DISTINCT processing_date FROM funds_transfer WHERE status = 'DONE' AND ccy = 'VND') SELECT processing_date, LEAD(processing_date) OVER (ORDER BY processing_date) - processing_date AS gap_days FROM d ORDER BY processing_date LIMIT 6",
          hint: "LEAD lấy chính cột processing_date của dòng sau; sắp theo processing_date trong OVER.",
          ordered: true,
        },
        {
          prompt: "Trên bảng sao kê `stmt_entry`, với hai tài khoản `1000000028` và `1000000046`, hiện `account_id`, `booking_date`, `amount` và `prev_amount`: số tiền của bút toán liền trước **của cùng tài khoản** (sắp theo `booking_date` rồi `stmt_entry_id`). Xếp theo `account_id`, `booking_date`, `stmt_entry_id`. Kết quả có 8 dòng, bút toán đầu của mỗi tài khoản có `prev_amount` NULL.",
          starter: "SELECT account_id, booking_date, amount,\n       LAG(amount) OVER (PARTITION BY ... ORDER BY ...) AS prev_amount\nFROM stmt_entry\nWHERE account_id IN ('1000000028', '1000000046')\nORDER BY account_id, booking_date, stmt_entry_id;",
          solution: "SELECT account_id, booking_date, amount, LAG(amount) OVER (PARTITION BY account_id ORDER BY booking_date, stmt_entry_id) AS prev_amount FROM stmt_entry WHERE account_id IN ('1000000028', '1000000046') ORDER BY account_id, booking_date, stmt_entry_id",
          hint: "Cần PARTITION BY account_id để dòng đầu của tài khoản thứ hai không nhìn sang tài khoản thứ nhất.",
          ordered: true,
        },
      ],
      quiz: {
        question: "`LAG(total) OVER (ORDER BY processing_date)` trả về gì ở dòng có `processing_date` nhỏ nhất?",
        options: [
          "0, vì chưa có ngày nào trước đó",
          "Chính giá trị total của dòng đó",
          "NULL, vì không có dòng nào đứng trước dòng đầu tiên",
          "Lỗi, vì LAG không dùng được ở dòng đầu",
        ],
        answer: 2,
        explain: "Dòng đầu không có dòng liền trước nên LAG trả về NULL, không báo lỗi. Muốn con số khác (ví dụ 0) thì truyền tham số thứ ba: LAG(total, 1, 0). Mặc định không phải 0, và cũng không lặp lại giá trị của chính dòng đó.",
      },
    },
    {
      id: "running-total",
      trap: {
        title: "Khung mặc định cộng cả các dòng cùng giá trị ORDER BY",
        text: "Tài khoản 1000000049 có hai bút toán cùng ngày 2024-07-13. Nếu chỉ `ORDER BY booking_date`, cả hai dòng đều hiện số dư chạy 54.000.000. Thêm `stmt_entry_id` để phá hoà thì ra 69.000.000 rồi 54.000.000, và dòng cuối đúng bằng số dư 74.000.000.",
      },
      title: "Phần 5: SUM() OVER, số dư chạy và khung mặc định",
      scene: "running-total",
      intro: [
        "Thêm `ORDER BY` vào `OVER` của một hàm tổng hợp như `sum` thì bạn được **tổng cộng dồn** (running total). Tài khoản `1000000028` có 3 bút toán: 50.000.000 (2024-01-01), 175.000 (2024-09-21), 175.612 (2024-12-28). `sum(amount) OVER (ORDER BY booking_date, stmt_entry_id)` cho 50.000.000, rồi 50.175.000, rồi 50.350.612. Đúng bằng số dư `working_balance` của tài khoản, vì số dư bằng tổng các bút toán. Đó chính là cách sao kê ngân hàng in cột \"số dư sau giao dịch\".",
        "Cộng dồn tới đâu là do **khung** (frame) của cửa sổ quyết định. Khi có `ORDER BY` trong `OVER`, khung mặc định là \"từ dòng đầu của partition tới dòng hiện tại\". Khi **không** có `ORDER BY`, khung là cả partition, nên mọi dòng cùng nhận một tổng (như ở phần 1 và 2). Bạn có thể viết khung rõ ràng: `sum(amount) OVER (ORDER BY booking_date, stmt_entry_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`, nghĩa là \"từ đầu partition (không giới hạn phía trước) tới dòng hiện tại\". Đổi mốc đầu, ví dụ `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`, cho tổng của 3 dòng gần nhất.",
      ],
      sql: [
        {
          prompt: "Tính số dư chạy của tài khoản `1000000028`: hiện `stmt_entry_id`, `booking_date`, `amount` và `running_balance` (cộng dồn `amount` theo `booking_date` rồi `stmt_entry_id`). Xếp theo `booking_date`, `stmt_entry_id`. Dòng cuối phải là 50350612.00, bằng `working_balance` của tài khoản.",
          starter: "SELECT stmt_entry_id, booking_date, amount,\n       ____(amount) OVER (ORDER BY booking_date, stmt_entry_id) AS running_balance\nFROM stmt_entry\nWHERE account_id = '1000000028'\nORDER BY booking_date, stmt_entry_id;",
          solution: "SELECT stmt_entry_id, booking_date, amount, sum(amount) OVER (ORDER BY booking_date, stmt_entry_id) AS running_balance FROM stmt_entry WHERE account_id = '1000000028' ORDER BY booking_date, stmt_entry_id",
          hint: "Cộng dồn dùng hàm tổng quen thuộc từ bài tổng hợp.",
          ordered: true,
        },
        {
          prompt: "Tài khoản `1000000049` có 11 bút toán và hai bút toán trùng ngày 2024-07-13. Hiện `stmt_entry_id`, `booking_date`, `amount` và `running_balance` cộng dồn theo `booking_date` rồi `stmt_entry_id`, xếp theo cùng thứ tự. Hai dòng ngày 2024-07-13 phải ra 69000000.00 và 54000000.00, dòng cuối là 74000000.00.",
          starter: "SELECT stmt_entry_id, booking_date, amount,\n       sum(amount) OVER (ORDER BY ... ) AS running_balance\nFROM stmt_entry\nWHERE account_id = '1000000049'\nORDER BY booking_date, stmt_entry_id;",
          solution: "SELECT stmt_entry_id, booking_date, amount, sum(amount) OVER (ORDER BY booking_date, stmt_entry_id) AS running_balance FROM stmt_entry WHERE account_id = '1000000049' ORDER BY booking_date, stmt_entry_id",
          hint: "Trong OVER, sắp theo ngày rồi stmt_entry_id để mỗi dòng có thứ tự duy nhất.",
          ordered: true,
        },
        {
          prompt: "Tính số dư chạy cho ba tài khoản cùng lúc: `1000000028`, `1000000046`, `1000000049`. Mỗi tài khoản cộng dồn riêng. Hiện `account_id`, `booking_date`, `amount`, `running_balance`, xếp theo `account_id`, `booking_date`, `stmt_entry_id`. Kết quả có 19 dòng; dòng cuối mỗi tài khoản là 50350612.00, 101407367.00 và 74000000.00.",
          starter: "SELECT account_id, booking_date, amount,\n       sum(amount) OVER (PARTITION BY ... ORDER BY ...) AS running_balance\nFROM stmt_entry\nWHERE account_id IN ('1000000028', '1000000046', '1000000049')\nORDER BY account_id, booking_date, stmt_entry_id;",
          solution: "SELECT account_id, booking_date, amount, sum(amount) OVER (PARTITION BY account_id ORDER BY booking_date, stmt_entry_id) AS running_balance FROM stmt_entry WHERE account_id IN ('1000000028', '1000000046', '1000000049') ORDER BY account_id, booking_date, stmt_entry_id",
          hint: "PARTITION BY account_id làm tổng cộng dồn khởi động lại ở mỗi tài khoản.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Hai bút toán cùng ngày, `OVER (ORDER BY booking_date)` không có cột phá hoà. Số dư chạy ở hai dòng đó sẽ ra sao?",
        options: [
          "Dòng đầu cộng riêng, dòng sau cộng thêm khoản của chính nó, như mong đợi",
          "Cả hai dòng nhận cùng một số dư chạy, đã gồm cả hai khoản, vì khung mặc định cộng cả nhóm dòng ngang hàng",
          "PostgreSQL báo lỗi vì hai dòng có cùng giá trị sắp xếp",
          "Cả hai dòng nhận NULL vì không phân biệt được dòng nào trước",
        ],
        answer: 1,
        explain: "Khung mặc định coi các dòng cùng giá trị ORDER BY là ngang hàng và cộng chúng cùng lúc, nên hai dòng ra cùng số (54.000.000 trong ví dụ). PostgreSQL không báo lỗi và cũng không trả về NULL. Thêm một cột duy nhất như stmt_entry_id vào ORDER BY để có số dư sau từng bút toán.",
      },
    },
    {
      id: "top-n-where",
      trap: {
        title: "Không viết được WHERE ROW_NUMBER() ... = 1",
        text: "PostgreSQL báo `window functions are not allowed in WHERE` vì `WHERE` chạy trước khi hàm cửa sổ được tính. Hãy tính hạng ở CTE hoặc subquery rồi lọc `rn <= 3` ở lớp ngoài.",
      },
      title: "Phần 6: Top N mỗi nhóm và vì sao không dùng hàm cửa sổ trong WHERE",
      scene: "top-n-where",
      intro: [
        "Bài toán kinh điển: \"3 tài khoản lớn nhất của mỗi chi nhánh\", hay \"bút toán mới nhất của mỗi tài khoản\". Bạn muốn giữ các dòng có hạng nhỏ. Cách viết hiển nhiên `WHERE ROW_NUMBER() OVER (...) = 1` không chạy được. Lý do là thứ tự thực hiện logic của câu lệnh: `FROM`, rồi `WHERE`, rồi `GROUP BY`, rồi `HAVING`, rồi **hàm cửa sổ**, rồi `SELECT`, rồi `ORDER BY`, rồi `LIMIT`. Khi `WHERE` chạy, hàm cửa sổ chưa được tính nên chưa có hạng nào để so sánh.",
        "Cách sửa quen thuộc: tính hạng ở một lớp trong (CTE hoặc subquery), rồi lọc ở lớp ngoài. `WITH x AS (SELECT ..., ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS rn FROM ...) SELECT ... FROM x WHERE rn = 1`. Đến lớp ngoài, `rn` đã là một cột bình thường nên dùng được trong `WHERE`. Top 3 mỗi chi nhánh thì lọc `rn <= 3`, ra 15 dòng (5 chi nhánh nhân 3), ví dụ ở `VN0010001` là 1000000069, 1000000022, 1000000004.",
        "Chọn hàm nào? `ROW_NUMBER` khi bạn cần **đúng N dòng** mỗi nhóm (nhớ thêm cột phá hoà), như \"bút toán mới nhất\" thì sắp `booking_date DESC, stmt_entry_id DESC` để mỗi tài khoản chỉ còn đúng một dòng: 85 tài khoản cho 85 dòng, như tài khoản 1000000001 có bút toán mới nhất là mã 826 ngày 2024-11-14. `RANK` hoặc `DENSE_RANK` khi bạn muốn **giữ cả các dòng đồng hạng**, nên có thể ra nhiều hơn N dòng, như hai tài khoản cùng hạng 9 ở phần 3 đều được giữ.",
      ],
      sql: [
        {
          prompt: "Lấy bút toán mới nhất của mỗi tài khoản: hiện `account_id`, `stmt_entry_id`, `booking_date`, `amount`, xếp theo `account_id`. Kết quả có 85 dòng. Dòng đầu là tài khoản 1000000001, bút toán 826, ngày 2024-11-14, số tiền -11000.00.",
          starter: "WITH x AS (\n  SELECT account_id, stmt_entry_id, booking_date, amount,\n         ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS rn\n  FROM stmt_entry\n)\nSELECT account_id, stmt_entry_id, booking_date, amount\nFROM x\nWHERE rn = ____\nORDER BY account_id;",
          solution: "WITH x AS (SELECT account_id, stmt_entry_id, booking_date, amount, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY booking_date DESC, stmt_entry_id DESC) AS rn FROM stmt_entry) SELECT account_id, stmt_entry_id, booking_date, amount FROM x WHERE rn = 1 ORDER BY account_id",
          hint: "Chia nhóm theo tài khoản, sắp ngày giảm dần (và id giảm dần để phá hoà), rồi giữ hạng 1.",
          ordered: true,
        },
        {
          prompt: "Lấy 3 tài khoản có số dư lớn nhất của mỗi chi nhánh: hiện `company_id`, `account_id`, `working_balance`, `rn`, xếp theo `company_id` rồi `rn`. Kết quả có 15 dòng.",
          starter: "WITH x AS (\n  SELECT company_id, account_id, working_balance,\n         ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS rn\n  FROM account\n)\nSELECT company_id, account_id, working_balance, rn\nFROM x\nWHERE rn <= ...\nORDER BY company_id, rn;",
          solution: "WITH x AS (SELECT company_id, account_id, working_balance, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY working_balance DESC) AS rn FROM account) SELECT company_id, account_id, working_balance, rn FROM x WHERE rn <= 3 ORDER BY company_id, rn",
          hint: "Chia nhóm theo company_id, sắp số dư giảm dần, rồi giữ hạng từ 1 đến 3.",
          ordered: true,
        },
        {
          prompt: "Tìm tài khoản có số dư cao **thứ nhì** ở mỗi chi nhánh (dùng `DENSE_RANK` để đồng hạng không làm lệch). Hiện `company_id`, `account_id`, `working_balance`, xếp theo `company_id`. Kết quả có 5 dòng, ví dụ ở `VN0010001` là 1000000022.",
          starter: "WITH x AS (\n  SELECT company_id, account_id, working_balance,\n         DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...) AS dr\n  FROM account\n)\nSELECT company_id, account_id, working_balance\nFROM x\nWHERE dr = 2\nORDER BY company_id;",
          solution: "WITH x AS (SELECT company_id, account_id, working_balance, DENSE_RANK() OVER (PARTITION BY company_id ORDER BY working_balance DESC) AS dr FROM account) SELECT company_id, account_id, working_balance FROM x WHERE dr = 2 ORDER BY company_id",
          hint: "Giống bài trước nhưng dùng DENSE_RANK và điều kiện dr = 2.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao câu `SELECT account_id FROM account WHERE ROW_NUMBER() OVER (ORDER BY account_id) = 1` báo lỗi?",
        options: [
          "Vì ROW_NUMBER chỉ dùng được cùng GROUP BY",
          "Vì WHERE chạy trước khi hàm cửa sổ được tính, nên phải tính ở lớp trong (CTE) rồi lọc ở lớp ngoài",
          "Vì cột account_id không có kiểu số để đánh số thứ tự",
          "Vì hàm cửa sổ chỉ được viết ở đầu câu, trước từ khoá SELECT",
        ],
        answer: 1,
        explain: "Thứ tự logic là FROM, WHERE, GROUP BY, HAVING, hàm cửa sổ, SELECT, ORDER BY. Lúc WHERE chạy chưa có hạng nào. ROW_NUMBER không cần GROUP BY, đánh số không đòi hỏi kiểu số của cột, và hàm cửa sổ được viết trong danh sách SELECT hoặc ORDER BY chứ không đứng trước SELECT.",
      },
    },
  ],
  cards: [
    { q: "`GROUP BY` và hàm cửa sổ khác nhau ở đâu?", a: "`GROUP BY` gộp các dòng thành một. Hàm cửa sổ giữ nguyên số dòng và gắn thêm cột tính toán." },
    { q: "`PARTITION BY` làm gì?", a: "Chia các dòng thành nhóm để hàm cửa sổ tính riêng từng nhóm, nhưng không gộp dòng." },
    { q: "`ROW_NUMBER`, `RANK` và `DENSE_RANK` khác nhau thế nào khi có hai dòng bằng nhau?", a: "`ROW_NUMBER` luôn khác nhau. `RANK` cùng hạng rồi bỏ cách (9, 9, 11). `DENSE_RANK` cùng hạng không bỏ cách (9, 9, 10)." },
    { q: "`LAG` lấy gì, và dòng đầu ra sao?", a: "Giá trị của cột ở dòng liền trước trong partition theo `ORDER BY`. Dòng đầu ra NULL, hoặc giá trị mặc định ở tham số thứ ba." },
    { q: "Vì sao số dư chạy cần cột phá hoà?", a: "Khung mặc định cộng cả các dòng ngang hàng cùng lúc, nên hai dòng cùng ngày hiện cùng một số. Thêm cột duy nhất như id." },
    { q: "Làm sao lấy top N mỗi nhóm?", a: "Tính `ROW_NUMBER() OVER (PARTITION BY nhóm ORDER BY ...)` trong CTE, rồi lọc `rn <= N` ở lớp ngoài, vì WHERE không dùng được hàm cửa sổ." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Hàm cửa sổ tính trên một nhóm dòng nhưng giữ nguyên từng dòng, khác GROUP BY gộp dòng. Dạng chung là hàm OVER (PARTITION BY nhóm ORDER BY thứ tự), và cửa sổ chỉ thấy những dòng còn lại sau WHERE. ROW_NUMBER đánh số không trùng, RANK đồng hạng rồi bỏ cách, DENSE_RANK đồng hạng không bỏ cách. LAG và LEAD lấy dòng liền trước và liền sau, trả NULL ở đầu và cuối. SUM OVER có ORDER BY cho số dư chạy, khung mặc định cộng cả các dòng ngang hàng nên cần thêm cột phá hoà duy nhất. Hàm cửa sổ không dùng được trong WHERE, nên top N mỗi nhóm là tính hạng trong CTE rồi lọc ở lớp ngoài.",
};
