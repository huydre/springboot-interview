import timeline from "../timelines/sql-capstone.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 13 (capstone). Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlCapstone: Lesson = {
  slug: "sql-capstone",
  crumb: "Bài tập tổng hợp",
  videoDir: "/videos/sql-capstone",
  videoVersion: "4e498ef4",
  scenes: timeline as Scene[],
  title: "Bài tập tổng hợp trên dữ liệu T24",
  subtitle:
    "Mười bài toán ngân hàng, từ khởi động đến đối soát và sửa dữ liệu. Mỗi bài trộn nhiều kỹ thuật của cả khoá: lọc, gom nhóm, JOIN, CASE, subquery, INTERSECT, hàm cửa sổ và UPDATE. Bài cuối nói về cách đọc một câu hỏi SQL lạ.",
  openingQuiz: {
    question: "Sếp hỏi: \"Mỗi chi nhánh có bao nhiêu khoản vay quá hạn?\". Bạn nên làm việc gì đầu tiên, trước khi gõ chữ SELECT?",
    options: [
      "Nói rõ mỗi dòng kết quả là gì (một dòng cho mỗi chi nhánh) và xem dữ liệu nằm ở những bảng nào",
      "Viết ngay GROUP BY company_id rồi sửa dần cho tới khi ra số đẹp",
      "Chép kết quả của một câu hỏi tương tự rồi đổi vài con số",
      "Chạy SELECT * trên mọi bảng để chắc chắn không bỏ sót cột nào",
    ],
    answer: 0,
    explain: "Việc đầu tiên là hiểu câu hỏi: kết quả có một dòng cho mỗi cái gì (gọi là \"hạt\" của kết quả) và dữ liệu cần nằm ở bảng nào. Có hai thứ này thì FROM, JOIN và GROUP BY gần như tự hiện ra. Viết thử rồi sửa mò dễ ra số sai mà vẫn trông hợp lý, sao chép câu cũ thì dễ lệch nghiệp vụ, còn SELECT * trên mọi bảng chỉ cho bạn một đống dữ liệu mà không trả lời được gì.",
  },
  roadmap: [
    "Chặng 1: quy trình sáu bước cho mọi câu hỏi SQL lạ, rồi khởi động với bài toán gọn trên một hai bảng và bảng tự kiểm tra: mỗi bài dùng kỹ thuật của bài học nào.",
    "Chặng 2: nối bảng và phân tích: dòng tiền theo chi nhánh, dư nợ quá hạn, INTERSECT, xếp hạng và số dư chạy bằng hàm cửa sổ.",
    "Chặng 3: đối soát số dư với bút toán và sửa dữ liệu lệch bằng UPDATE.",
  ],
  sections: [
    {
      id: "approach",
      trap: {
        title: "JOIN thêm một bảng là có thể nhân dòng",
        text: "12 khoản vay `LIVE` của 12 khách, nhưng JOIN thêm `account` rồi `COUNT(*)` ra 33 \"khách\". Đếm trên bảng gốc hoặc dùng `COUNT(DISTINCT customer_id)`, và kiểm tra số dòng sau mỗi bước.",
      },
      title: "Phần 1: Cách tiếp cận một câu hỏi SQL lạ",
      scene: "approach",
      intro: [
        "Bài này không dạy thêm cú pháp mới. Nó là buổi tập tổng hợp: **một bài khởi động** rồi **mười bài** đánh số của một ngân hàng giả lập T24. Trước khi làm, hãy nắm cách tiếp cận dùng cho mọi bài: khi gặp một câu hỏi chưa từng làm, đừng bắt đầu từ chữ `SELECT`, hãy đi theo **sáu bước**:",
        "- **Một, đọc bảng**: xem tên cột và khoá ngoại của các bảng liên quan để biết dữ liệu nằm đâu.",
        "- **Hai, nói rõ \"hạt\" của kết quả**: mỗi dòng kết quả đại diện cho cái gì (một khách, một chi nhánh, một ngày)?",
        "- **Ba, viết `FROM` và `JOIN` trước**: chạy thử với `LIMIT` để xem dòng ghép ra có đúng ý không.",
        "- **Bốn, thêm `WHERE`**: cho các điều kiện lọc dòng (trạng thái, khoảng ngày, loại tiền).",
        "- **Năm, mới gom nhóm**: thêm `GROUP BY`, hàm tổng hợp và `HAVING`, nếu cần xếp hạng hay số dư chạy thì thêm hàm cửa sổ hoặc CTE.",
        "- **Sáu, kiểm tra số dòng**: so với con số bạn có thể đếm độc lập (ví dụ `COUNT(DISTINCT ...)` trên bảng gốc). Số dòng sau JOIN lớn hơn dự kiến thường là dấu hiệu nhân dòng.",
        "Thói quen kiểm tra số dòng sau mỗi bước cứu bạn khỏi những con số trông hợp lý mà sai. Bài khởi động dưới đây là một ví dụ.",
      ],
      predict: {
        question: "Có 12 khoản vay `LIVE` của 12 khách. Câu khởi động JOIN thêm `account` rồi `COUNT(*)`. Nó ra bao nhiêu?",
        options: [
          "12, vì có 12 khách",
          "Nhiều hơn 12, vì mỗi khách có nhiều tài khoản nên mỗi khoản vay bị ghép với nhiều dòng",
          "Ít hơn 12, vì JOIN loại bớt khách",
          "PostgreSQL báo lỗi vì đếm trùng",
        ],
        answer: 1,
        explain: "Ra 33: mỗi khách có nhiều tài khoản nên mỗi khoản vay bị ghép với nhiều dòng `account`. Câu vẫn chạy, không có lỗi nào, chỉ có con số sai.",
      },
      sql: [
        {
          prompt: "Có bao nhiêu khách hàng đang có ít nhất một khoản vay `LIVE`? Đoạn dưới đếm sai vì JOIN `account` làm nhân dòng (cho ra 33). Sửa để câu trả lời đúng là 12, cột tên `so_khach`.",
          starter: "SELECT count(*) AS so_khach\nFROM loan l\nJOIN account a ON a.customer_id = l.customer_id\nWHERE l.status = 'LIVE';",
          solution: "SELECT count(DISTINCT l.customer_id) AS so_khach FROM loan l JOIN account a ON a.customer_id = l.customer_id WHERE l.status = 'LIVE'",
          hint: "Đếm các mã khách khác nhau, không đếm số dòng đã ghép. Hoặc bỏ luôn JOIN không cần thiết.",
        },
      ],
      quiz: {
        question: "Bạn vừa viết xong một câu có JOIN ba bảng và GROUP BY, kết quả ra một con số trông hợp lý. Việc nên làm tiếp theo là gì?",
        options: [
          "Gửi luôn, vì câu chạy không báo lỗi nghĩa là đúng",
          "Đối chiếu với một con số đếm độc lập trên bảng gốc, và xem số dòng sau JOIN có lớn hơn dự kiến không",
          "Thêm DISTINCT vào đầu câu để chắc chắn không bị trùng",
          "Đổi INNER JOIN thành LEFT JOIN cho an toàn",
        ],
        answer: 1,
        explain: "Câu chạy được chưa có nghĩa là đúng nghiệp vụ, vì nhân dòng và mất dòng không gây lỗi. Đối chiếu với một số đếm độc lập là cách bắt chúng. DISTINCT thêm bừa có thể giấu lỗi nhân dòng nhưng làm sai tổng tiền, và đổi loại JOIN làm thay đổi tập dòng chứ không làm câu đúng hơn.",
      },
    },
    {
      id: "warm-up",
      title: "Phần 2: Khởi động, một hai bảng",
      scene: "warm-up",
      intro: [
        "Sau bài khởi động ở Phần 1 là **mười bài** đánh số từ Bài 1 đến Bài 10, mỗi bài có một **tình huống** (người hỏi muốn gì), một **gợi ý** và một **đáp án mẫu** (bấm \"Xem đáp án\" khi bí). Hãy tự làm trước, đáp án chỉ để so. Mọi đáp án đã chạy thật trên bộ dữ liệu của khoá.",
        "**Bảng tự kiểm tra: mỗi bài dùng kỹ thuật của bài học nào** (tên bài học như trong danh sách của khoá):",
        "- **Bài 1** (top 5 khách theo số dư): \"Lọc và sắp xếp\", \"Hàm tổng hợp\".",
        "- **Bài 2** (tài khoản không phát sinh giao dịch): LEFT JOIN và kiểm tra NULL, \"JOIN\".",
        "- **Bài 3** (dòng tiền vào ra theo tháng, theo chi nhánh): JOIN, `CASE WHEN`, `to_char`, \"JOIN\" và \"Xử lý dữ liệu\".",
        "- **Bài 4** (dư nợ quá hạn theo chi nhánh): nhiều JOIN, `COALESCE`, gom nhóm, \"Hàm tổng hợp\", \"JOIN\", \"Xử lý dữ liệu\".",
        "- **Bài 5** (chuyển khoản giữa các chi nhánh): JOIN cùng một bảng hai lần, \"JOIN\".",
        "- **Bài 6** (khách vừa có tiết kiệm vừa có vay): `INTERSECT`, \"Tập hợp kết quả\".",
        "- **Bài 7** (khoản chuyển lớn nhất mỗi ngày): `RANK()` và CTE, \"Subquery và CTE\", \"Window Functions\".",
        "- **Bài 8** (số dư chạy): `SUM() OVER`, \"Window Functions\".",
        "- **Bài 9** (đối soát số dư): LEFT JOIN, `HAVING`, `COALESCE`, \"Hàm tổng hợp\", \"JOIN\", \"Xử lý dữ liệu\".",
        "- **Bài 10** (sửa số dư lệch): `UPDATE` với subquery tương quan, \"Subquery và CTE\", \"INSERT UPDATE DELETE\".",
        "Nếu bí ở bài nào, mở lại bài học tương ứng rồi quay lại. Ngày trong các bài luôn là ngày cố định như `DATE '2024-12-31'`, không dùng ngày hôm nay.",
      ],
      sql: [
        {
          prompt: "Bài 1. Phòng khách hàng cần danh sách 5 khách có tổng số dư tiền đồng lớn nhất. Chỉ tính tài khoản đang mở (`status = 'OPEN'`) và có loại tiền VND (`ccy = 'VND'`). Hiện `customer_id` và `tong_so_du`, xếp từ lớn đến nhỏ. Lưu ý tài khoản vay mang số dư âm nên tự trừ vào tổng. Kết quả đúng: 100036 đứng đầu với 3235868789.00, rồi 100035, 100039, 100033, 100034.",
          starter: "SELECT customer_id, ____(working_balance) AS tong_so_du\nFROM account\nWHERE status = 'OPEN' AND ccy = 'VND'\nGROUP BY ____\nORDER BY tong_so_du DESC\nLIMIT 5;",
          solution: "SELECT customer_id, sum(working_balance) AS tong_so_du FROM account WHERE status = 'OPEN' AND ccy = 'VND' GROUP BY customer_id ORDER BY tong_so_du DESC LIMIT 5",
          hint: "WHERE lọc dòng trước, GROUP BY gom theo khách, rồi sắp xếp và lấy 5 dòng đầu.",
          ordered: true,
        },
        {
          prompt: "Bài 2. Kiểm toán nội bộ muốn biết tài khoản nào đang mở mà **không có một bút toán nào trong quý 4 năm 2024** (từ 2024-10-01 đến 2024-12-31), để xem có phải tài khoản \"ngủ\". Hiện `account_id` và `customer_id`, xếp theo `account_id`. Kết quả đúng có 18 dòng, dòng đầu là 1000000002 của khách 100001. Gợi ý bẫy: điều kiện ngày phải nằm trong `ON`, không nằm trong `WHERE`.",
          starter: "SELECT a.account_id, a.customer_id\nFROM account a\nLEFT JOIN stmt_entry s\n       ON s.account_id = a.account_id\n      AND s.booking_date BETWEEN DATE '2024-10-01' AND DATE '2024-12-31'\nWHERE a.status = 'OPEN' AND ____ IS NULL\nORDER BY a.account_id;",
          solution: "SELECT a.account_id, a.customer_id FROM account a LEFT JOIN stmt_entry s ON s.account_id = a.account_id AND s.booking_date BETWEEN DATE '2024-10-01' AND DATE '2024-12-31' WHERE a.status = 'OPEN' AND s.stmt_entry_id IS NULL ORDER BY a.account_id",
          hint: "Sau LEFT JOIN, tài khoản không có bút toán trong quý thì mọi cột của s đều NULL. Kiểm tra khoá chính của s.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Ở bài 2, nếu chuyển điều kiện ngày sang `WHERE s.booking_date BETWEEN ...` và vẫn giữ LEFT JOIN, kết quả \"tài khoản không có bút toán trong quý\" sẽ ra sao?",
        options: [
          "Vẫn đúng, vì WHERE và ON luôn cho cùng kết quả",
          "Ra 0 dòng, vì WHERE giữ lại dòng có ngày trong quý, còn dòng không có bút toán có ngày NULL nên bị loại hết",
          "Ra mọi tài khoản của ngân hàng, vì điều kiện ngày bị bỏ qua",
          "PostgreSQL báo lỗi vì không được dùng BETWEEN sau LEFT JOIN",
        ],
        answer: 1,
        explain: "WHERE chạy sau JOIN và lọc từng dòng đã ghép. Tài khoản không có bút toán có `booking_date` bằng NULL, mà NULL BETWEEN ... không đúng, nên chúng bị loại và bạn mất đúng những dòng cần tìm. Đặt điều kiện ngày trong ON thì chỉ lọc phía bút toán trước khi ghép, còn tài khoản vẫn được giữ lại. Kết quả không giống nhau, không rỗng vì lý do \"bỏ qua điều kiện\", và PostgreSQL không báo lỗi.",
      },
    },
    {
      id: "combine-tables",
      trap: {
        title: "Lệnh PENDING và FAILED chưa làm tiền di chuyển",
        text: "Khi tính dòng tiền giữa các chi nhánh, chỉ lấy lệnh `DONE`. Trong 94 lệnh `DONE` bằng VND có 78 lệnh đi giữa hai chi nhánh khác nhau, tổng 697.000.000. Tính cả 6 lệnh `PENDING` và 3 lệnh `FAILED` toàn bảng sẽ làm tổng sai mà không có lỗi nào.",
      },
      title: "Phần 3: Nối bảng và gom nhóm theo chi nhánh",
      scene: "combine-tables",
      intro: [
        "Các bài ở phần này đều cần **nối nhiều bảng rồi gom nhóm**. Trước khi viết, hãy hỏi \"mỗi dòng kết quả là gì?\":",
        "- **Bài 3**: một dòng cho mỗi cặp (chi nhánh, tháng).",
        "- **Bài 4**: một dòng cho mỗi chi nhánh.",
        "- **Bài 5**: một dòng cho mỗi cặp (chi nhánh chuyển, chi nhánh nhận).",
        "Biết dòng kết quả là gì thì biết ngay cột nào vào `GROUP BY`.",
        "Tiền vào và tiền ra nằm chung một cột `amount` (dương là vào, âm là ra), nên muốn tách hai số bạn dùng `CASE WHEN` bên trong `SUM`. Chi nhánh của một bút toán không nằm trong `stmt_entry` mà nằm ở tài khoản, nên phải JOIN sang `account`. Với khoản vay, chi nhánh lấy từ tài khoản vay của khoản đó (`loan.account_id`). Khi một chi nhánh không có khoản quá hạn, `SUM` trả về NULL, hãy dùng `COALESCE` để hiện 0.",
        "Bài 5 cần JOIN bảng `account` **hai lần**, một lần cho tài khoản chuyển đi, một lần cho tài khoản nhận, với hai alias khác nhau (`d` và `c`). Chỉ tính lệnh `DONE`: lệnh `PENDING` và `FAILED` chưa làm tiền di chuyển (xem khung bẫy).",
      ],
      sql: [
        {
          prompt: "Bài 3. Kế toán trưởng cần báo cáo dòng tiền quý 4 năm 2024: với mỗi chi nhánh và mỗi tháng, tổng tiền vào và tổng tiền ra (số dương) của các tài khoản VND. Hiện `company_id` (chi nhánh của tài khoản), `thang` (dạng `2024-10`), `tien_vao`, `tien_ra`, xếp theo `company_id`, `thang`. Kết quả đúng có 15 dòng, dòng đầu: VN0010001, 2024-10, 158177463.00 vào, 64088000.00 ra.",
          starter: "SELECT a.company_id,\n       to_char(s.booking_date, 'YYYY-MM') AS thang,\n       sum(CASE WHEN s.amount > 0 THEN s.amount ELSE 0 END) AS tien_vao,\n       sum(CASE WHEN s.amount < 0 THEN ____ ELSE 0 END) AS tien_ra\nFROM stmt_entry s\nJOIN account a ON a.account_id = s.account_id\nWHERE a.ccy = 'VND' AND s.booking_date BETWEEN DATE '2024-10-01' AND DATE '2024-12-31'\nGROUP BY a.company_id, to_char(s.booking_date, 'YYYY-MM')\nORDER BY a.company_id, thang;",
          solution: "SELECT a.company_id, to_char(s.booking_date, 'YYYY-MM') AS thang, sum(CASE WHEN s.amount > 0 THEN s.amount ELSE 0 END) AS tien_vao, sum(CASE WHEN s.amount < 0 THEN -s.amount ELSE 0 END) AS tien_ra FROM stmt_entry s JOIN account a ON a.account_id = s.account_id WHERE a.ccy = 'VND' AND s.booking_date BETWEEN DATE '2024-10-01' AND DATE '2024-12-31' GROUP BY a.company_id, to_char(s.booking_date, 'YYYY-MM') ORDER BY a.company_id, thang",
          hint: "Tiền ra được lưu là số âm. Đổi dấu để báo cáo hiện số dương.",
          ordered: true,
        },
        {
          prompt: "Bài 4. Ban rủi ro cần dư nợ quá hạn theo chi nhánh. Với mỗi chi nhánh có khoản vay (chi nhánh của tài khoản vay), hiện `company_id`, `so_khoan` (số khoản vay), `tong_goc` (tổng `principal`), `goc_qua_han` (tổng gốc của khoản `OVERDUE`, bằng 0 nếu không có) và `ty_le_pct` (gốc quá hạn chia tổng gốc nhân 100, làm tròn 2 số lẻ). Xếp theo `company_id`. Kết quả đúng có 5 dòng: VN0010001 quá hạn 50000000.00, tỷ lệ 21.74; VN0010002 quá hạn 50000000.00, tỷ lệ 5.88; ba chi nhánh còn lại bằng 0.",
          starter: "SELECT a.company_id,\n       count(*) AS so_khoan,\n       sum(l.principal) AS tong_goc,\n       COALESCE(sum(CASE WHEN l.status = 'OVERDUE' THEN l.principal END), 0) AS goc_qua_han,\n       round(100.0 * COALESCE(sum(CASE WHEN l.status = 'OVERDUE' THEN l.principal END), 0) / sum(l.principal), 2) AS ty_le_pct\nFROM loan l\nJOIN ____ a ON a.account_id = l.account_id\nGROUP BY a.company_id\nORDER BY a.company_id;",
          solution: "SELECT a.company_id, count(*) AS so_khoan, sum(l.principal) AS tong_goc, COALESCE(sum(CASE WHEN l.status = 'OVERDUE' THEN l.principal END), 0) AS goc_qua_han, round(100.0 * COALESCE(sum(CASE WHEN l.status = 'OVERDUE' THEN l.principal END), 0) / sum(l.principal), 2) AS ty_le_pct FROM loan l JOIN account a ON a.account_id = l.account_id GROUP BY a.company_id ORDER BY a.company_id",
          hint: "Khoản vay không có cột chi nhánh. Đi qua tài khoản vay của nó để biết chi nhánh. CASE không có ELSE trả NULL, và SUM bỏ qua NULL.",
          ordered: true,
        },
        {
          prompt: "Bài 5. Ban điều hành muốn biết 5 tuyến chuyển tiền nội bộ lớn nhất giữa hai chi nhánh khác nhau. Chỉ tính lệnh `DONE` bằng VND, tài khoản chuyển đi và tài khoản nhận thuộc hai chi nhánh khác nhau. Hiện `chi_nhanh_chuyen`, `chi_nhanh_nhan`, `so_lenh`, `tong_tien`, xếp theo `tong_tien` giảm dần, lấy 5 dòng. Kết quả đúng: tuyến đầu VN0010002 sang VN0010005 có 9 lệnh, tổng 122000000.00.",
          starter: "SELECT d.company_id AS chi_nhanh_chuyen,\n       c.company_id AS chi_nhanh_nhan,\n       count(*) AS so_lenh,\n       sum(f.amount) AS tong_tien\nFROM funds_transfer f\nJOIN account d ON d.account_id = f.debit_account\nJOIN account c ON c.account_id = ____\nWHERE f.status = 'DONE' AND f.ccy = 'VND' AND d.company_id <> c.company_id\nGROUP BY d.company_id, c.company_id\nORDER BY tong_tien DESC\nLIMIT 5;",
          solution: "SELECT d.company_id AS chi_nhanh_chuyen, c.company_id AS chi_nhanh_nhan, count(*) AS so_lenh, sum(f.amount) AS tong_tien FROM funds_transfer f JOIN account d ON d.account_id = f.debit_account JOIN account c ON c.account_id = f.credit_account WHERE f.status = 'DONE' AND f.ccy = 'VND' AND d.company_id <> c.company_id GROUP BY d.company_id, c.company_id ORDER BY tong_tien DESC LIMIT 5",
          hint: "Alias d là tài khoản chuyển đi (nối `f.debit_account`), alias c là tài khoản nhận tiền: nối `f.credit_account`.",
          ordered: true,
        },
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Mỗi dòng kết quả là gì → cột nào vào `GROUP BY` → bảng nào phải JOIN để có cột đó (chi nhánh nằm ở `account`).",
        ],
      },
      quiz: {
        question: "Ở bài 4, vì sao `goc_qua_han` dùng `COALESCE(SUM(CASE ... END), 0)` thay vì để nguyên `SUM(CASE ...)`?",
        options: [
          "Vì chi nhánh không có khoản quá hạn thì mọi giá trị CASE là NULL, SUM trả NULL, và báo cáo cần hiện 0",
          "Vì SUM không chạy được nếu bên trong có CASE",
          "Vì COALESCE làm câu lệnh chạy nhanh hơn rất nhiều",
          "Vì khoản vay quá hạn luôn có gốc bằng 0",
        ],
        answer: 0,
        explain: "CASE không có ELSE trả NULL cho dòng không thoả điều kiện, và SUM của toàn NULL là NULL, nên ba chi nhánh không có khoản quá hạn sẽ hiện NULL thay vì 0 (và phép chia tỷ lệ cũng thành NULL). COALESCE đổi NULL thành 0. SUM chạy tốt với CASE, COALESCE không tăng tốc, và khoản quá hạn có gốc dương, không phải 0.",
      },
    },
    {
      id: "analysis",
      trap: {
        title: "INTERSECT thiếu điều kiện trạng thái cho kết quả thừa",
        text: "Đặt điều kiện trạng thái ở từng vế: tiết kiệm phải `OPEN`, khoản vay phải `LIVE` hoặc `OVERDUE`. Bỏ điều kiện thì ra 7 khách thay vì 6, vì khách 100025 có khoản vay đã tất toán (`REPAID`) lọt vào.",
      },
      title: "Phần 4: Phân tích với INTERSECT, xếp hạng và số dư chạy",
      scene: "analysis",
      intro: [
        "Ba bài khó hơn, mỗi bài dùng một kỹ thuật \"nâng cao\" của khoá. Bài 6 hỏi khách vừa có tiết kiệm vừa có vay: đây là phép **giao** của hai danh sách khách hàng nên dùng `INTERSECT`. Hai danh sách phải cùng một cột (`customer_id`), và điều kiện trạng thái nằm ở từng vế: tiết kiệm phải đang `OPEN`, khoản vay phải còn hiệu lực (`LIVE` hoặc `OVERDUE`).",
        "Bài 7 hỏi khoản chuyển lớn nhất **mỗi ngày**. Đây là bài toán top N mỗi nhóm: dùng `RANK() OVER (PARTITION BY ngày ORDER BY amount DESC)` trong một CTE, rồi giữ dòng hạng 1. Dùng `RANK` thay vì `ROW_NUMBER` để hai khoản bằng nhau cùng giữ hạng 1, khỏi mất một khoản một cách tuỳ tiện. Hàm cửa sổ không dùng được trong `WHERE`, nên phải bọc trong CTE rồi lọc ở truy vấn ngoài.",
        "Bài 8 là **số dư chạy** của một tài khoản: `SUM(amount) OVER (ORDER BY booking_date, stmt_entry_id)`. Thêm `stmt_entry_id` để phá hoà khi hai bút toán cùng ngày. Vì số dư tài khoản bằng tổng bút toán của nó, số dư chạy ở dòng cuối phải bằng `working_balance`. Đây là cách đối soát nhanh bằng mắt, và là cầu nối sang phần 5.",
      ],
      sql: [
        {
          prompt: "Bài 6. Phòng sản phẩm muốn mời khách \"vừa gửi tiết kiệm vừa đang vay\" tham gia chương trình ưu đãi. Liệt kê `customer_id` của khách có tài khoản tiết kiệm đang mở (loại sản phẩm `SAVINGS` trong bảng `category`) **và** có khoản vay `LIVE` hoặc `OVERDUE`. Xếp theo `customer_id`. Kết quả đúng có 6 khách: 100011, 100017, 100024, 100035, 100036, 100039.",
          starter: "SELECT a.customer_id\nFROM account a\nJOIN category c ON c.category_id = a.category_id\nWHERE c.product_group = 'SAVINGS' AND a.status = 'OPEN'\n____\nSELECT customer_id\nFROM loan\nWHERE status IN ('LIVE', 'OVERDUE')\nORDER BY customer_id;",
          solution: "SELECT a.customer_id FROM account a JOIN category c ON c.category_id = a.category_id WHERE c.product_group = 'SAVINGS' AND a.status = 'OPEN' INTERSECT SELECT customer_id FROM loan WHERE status IN ('LIVE', 'OVERDUE') ORDER BY customer_id",
          hint: "Cần các khách xuất hiện trong cả hai danh sách. ORDER BY chỉ đặt một lần ở cuối.",
          ordered: true,
        },
        {
          prompt: "Bài 7. Phòng thanh toán muốn xem khoản chuyển lớn nhất mỗi ngày trong tháng 10 năm 2024. Chỉ tính lệnh `DONE` bằng VND, `processing_date` từ 2024-10-01 đến 2024-10-31. Hiện `processing_date`, `ft_id`, `amount`, xếp theo `processing_date`, `ft_id`. Nếu hai lệnh cùng lớn nhất trong ngày thì hiện cả hai. Kết quả đúng có 7 dòng, trong đó ngày 2024-10-12 có hai lệnh cùng 5000000.00 (FT240000101 và FT240000102).",
          starter: "WITH xep_hang AS (\n  SELECT processing_date, ft_id, amount,\n         ____() OVER (PARTITION BY processing_date ORDER BY amount DESC) AS hang\n  FROM funds_transfer\n  WHERE status = 'DONE' AND ccy = 'VND'\n    AND processing_date BETWEEN DATE '2024-10-01' AND DATE '2024-10-31'\n)\nSELECT processing_date, ft_id, amount\nFROM xep_hang\nWHERE hang = 1\nORDER BY processing_date, ft_id;",
          solution: "WITH xep_hang AS (SELECT processing_date, ft_id, amount, rank() OVER (PARTITION BY processing_date ORDER BY amount DESC) AS hang FROM funds_transfer WHERE status = 'DONE' AND ccy = 'VND' AND processing_date BETWEEN DATE '2024-10-01' AND DATE '2024-10-31') SELECT processing_date, ft_id, amount FROM xep_hang WHERE hang = 1 ORDER BY processing_date, ft_id",
          hint: "Hàm xếp hạng cho các dòng bằng nhau cùng một hạng rồi nhảy hạng ở dòng sau (1, 1, 3) là RANK. DENSE_RANK thì không nhảy (1, 1, 2), ROW_NUMBER thì không cho đồng hạng (1, 2, 3).",
          ordered: true,
        },
        {
          prompt: "Bài 8. Khách của tài khoản `1000000044` thắc mắc về số dư. Lập sao kê có số dư chạy: hiện `stmt_entry_id`, `booking_date`, `amount` và `so_du_chay` (cộng dồn `amount` theo `booking_date` rồi `stmt_entry_id`), xếp cùng thứ tự đó. Kết quả có 23 dòng. Dòng cuối phải là 120923000.00, đúng bằng `working_balance` của tài khoản: nếu không bằng thì có lệch cần điều tra.",
          starter: "SELECT stmt_entry_id, booking_date, amount,\n       sum(amount) OVER (ORDER BY ____) AS so_du_chay\nFROM stmt_entry\nWHERE account_id = '1000000044'\nORDER BY booking_date, stmt_entry_id;",
          solution: "SELECT stmt_entry_id, booking_date, amount, sum(amount) OVER (ORDER BY booking_date, stmt_entry_id) AS so_du_chay FROM stmt_entry WHERE account_id = '1000000044' ORDER BY booking_date, stmt_entry_id",
          hint: "Trong OVER, sắp theo ngày bút toán rồi theo mã bút toán để mỗi dòng có vị trí duy nhất.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Ở bài 7, vì sao phải bọc `RANK() OVER (...)` trong CTE rồi mới lọc `hang = 1`, thay vì viết `WHERE RANK() OVER (...) = 1` thẳng?",
        options: [
          "Vì RANK chỉ chạy được trong CTE",
          "Vì WHERE chạy trước khi hàm cửa sổ được tính, nên chưa có hạng để so sánh; cần tính hạng ở một tầng rồi lọc ở tầng ngoài",
          "Vì hạng chỉ được tính khi có GROUP BY",
          "Vì CTE làm RANK cho kết quả khác đi",
        ],
        answer: 1,
        explain: "Thứ tự xử lý là FROM, WHERE, GROUP BY, rồi mới đến SELECT (nơi hàm cửa sổ được tính), nên WHERE chưa thấy được hạng và PostgreSQL báo lỗi. Bọc vào CTE (hoặc subquery) tạo một tầng mới đã có cột hạng để tầng ngoài lọc. RANK không bị giới hạn ở CTE, không cần GROUP BY, và CTE không đổi kết quả của RANK.",
      },
    },
    {
      id: "reconcile-fix",
      trap: {
        title: "Đối soát ra 0 dòng chưa chắc là tốt",
        text: "Truy vấn sai cũng có thể ra 0 dòng (ví dụ quên `HAVING` hay so nhầm cột). Phép thử +2.500.000 vào tài khoản `1000000044` kiểm tra đúng chỗ đó: nếu `HAVING` đúng thì phải thấy một dòng lệch. Còn `LEFT JOIN` và `COALESCE(SUM(...), 0)` là để phòng trước: hiện cả 85 tài khoản đều có bút toán, nhưng một tài khoản mới mở chưa có bút toán nào sẽ biến mất khỏi kết quả nếu dùng `JOIN` thường.",
      },
      title: "Phần 5: Đối soát và sửa dữ liệu",
      scene: "reconcile-fix",
      intro: [
        "**Đối soát** (reconciliation) là so hai nguồn số liệu cần phải khớp nhau. Ở T24, số dư `account.working_balance` phải bằng tổng `stmt_entry.amount` của chính tài khoản đó. Truy vấn đối soát: ghép mỗi tài khoản với tổng bút toán của nó rồi giữ những tài khoản lệch. Dùng `LEFT JOIN` để tài khoản chưa có bút toán nào không biến mất, và `COALESCE(SUM(...), 0)` để tổng NULL thành 0:\n`SELECT a.account_id, a.working_balance, COALESCE(SUM(s.amount), 0) AS tong_but_toan FROM account a LEFT JOIN stmt_entry s ON s.account_id = a.account_id GROUP BY a.account_id, a.working_balance HAVING a.working_balance <> COALESCE(SUM(s.amount), 0)`.",
        "Trên dữ liệu sạch, truy vấn này trả về **0 dòng**: cả 85 tài khoản đều khớp (và cả 85 đều có bút toán). Bài 9 thử xem truy vấn có bắt được lỗi hay không (xem khung bẫy): một `UPDATE` ở đầu script làm lệch số dư tài khoản `1000000044` thêm 2.500.000, bạn viết truy vấn đối soát và phải thấy đúng một dòng lệch.",
        "Bài 10 là bước sửa. Khi hai nguồn lệch, nguồn nào đúng? Với ngân hàng, **sổ bút toán là bản gốc** (mỗi lần tiền ra vào đều có dòng riêng), còn số dư là con số tổng hợp, nên ta sửa số dư theo tổng bút toán. Luôn có `WHERE` khi `UPDATE`, nếu không bạn sửa cả bảng.",
        "Giá trị mới trong `SET` không nhất thiết là hằng số: nó có thể là một **subquery trả về đúng một giá trị**. Ví dụ `UPDATE account a SET working_balance = (SELECT sum(s.amount) FROM stmt_entry s WHERE s.account_id = a.account_id) WHERE a.account_id = 'X'`. Đặt alias `a` cho bảng đang sửa, rồi trong subquery so `s.account_id = a.account_id`: đây là subquery tương quan (bài 8), chạy lại cho từng dòng được sửa, nên mỗi tài khoản nhận tổng bút toán của chính nó. Subquery phải ra một giá trị; nếu không có bút toán nào khớp, `sum` trả về NULL, và vì `working_balance` là `NOT NULL` nên PostgreSQL báo lỗi `null value in column \"working_balance\" ... violates not-null constraint`. Vì vậy `WHERE` chỉ chọn những tài khoản bạn chắc có bút toán. Bài này chấm bằng `verify`: sau khi chạy lệnh của bạn, hệ thống chạy một truy vấn kiểm tra và so với đáp án mẫu. Trong thực tế, hãy chạy trong một transaction và xem kết quả trước khi `COMMIT`.",
      ],
      sql: [
        {
          prompt: "Bài 9. Đoạn script dưới đã có sẵn một `UPDATE` cố tình làm lệch số dư tài khoản `1000000044` thêm 2500000 (đừng sửa nó). Viết truy vấn đối soát ngay phía dưới: hiện `account_id`, `working_balance`, `tong_but_toan` (tổng `amount` của tài khoản, 0 nếu không có bút toán) và `chenh_lech` (số dư trừ tổng bút toán), chỉ giữ tài khoản có số dư khác tổng bút toán. Kết quả đúng có 1 dòng: 1000000044, 123423000.00, 120923000.00, chênh lệch 2500000.00.",
          starter: "UPDATE account SET working_balance = working_balance + 2500000 WHERE account_id = '1000000044';\n\nSELECT a.account_id,\n       a.working_balance,\n       COALESCE(sum(s.amount), 0) AS tong_but_toan,\n       a.working_balance - COALESCE(sum(s.amount), 0) AS chenh_lech\nFROM account a\nLEFT JOIN stmt_entry s ON s.account_id = a.account_id\nGROUP BY a.account_id, a.working_balance\n____ a.working_balance <> COALESCE(sum(s.amount), 0)\nORDER BY a.account_id;",
          solution: "UPDATE account SET working_balance = working_balance + 2500000 WHERE account_id = '1000000044'; SELECT a.account_id, a.working_balance, COALESCE(sum(s.amount), 0) AS tong_but_toan, a.working_balance - COALESCE(sum(s.amount), 0) AS chenh_lech FROM account a LEFT JOIN stmt_entry s ON s.account_id = a.account_id GROUP BY a.account_id, a.working_balance HAVING a.working_balance <> COALESCE(sum(s.amount), 0) ORDER BY a.account_id",
          hint: "Điều kiện lọc trên kết quả của SUM phải đặt ở mệnh đề dành riêng cho điều kiện sau khi gom nhóm.",
          ordered: true,
        },
        {
          prompt: "Bài 10. Script dưới bắt đầu bằng cùng `UPDATE` gây lệch số dư của `1000000044`. Hãy viết thêm một `UPDATE` sửa số dư của **đúng tài khoản đó** về bằng tổng `amount` các bút toán của nó (dùng subquery trong `SET`, có `WHERE`). Thêm `RETURNING account_id, working_balance` để thấy dòng vừa sửa. Sau khi chạy, truy vấn kiểm tra phải cho 0 tài khoản còn lệch và số dư của 1000000044 là 120923000.00.",
          starter: "UPDATE account SET working_balance = working_balance + 2500000 WHERE account_id = '1000000044';\n\nUPDATE account a\nSET working_balance = (SELECT sum(s.amount) FROM stmt_entry s WHERE s.account_id = ____)\nWHERE ____\nRETURNING account_id, working_balance;",
          solution: "UPDATE account SET working_balance = working_balance + 2500000 WHERE account_id = '1000000044'; UPDATE account a SET working_balance = (SELECT sum(s.amount) FROM stmt_entry s WHERE s.account_id = a.account_id) WHERE a.account_id = '1000000044' RETURNING account_id, working_balance",
          verify: "SELECT (SELECT count(*) FROM account a WHERE a.working_balance <> (SELECT sum(s.amount) FROM stmt_entry s WHERE s.account_id = a.account_id)) AS so_tai_khoan_lech, (SELECT working_balance FROM account WHERE account_id = '1000000044') AS so_du_1000000044",
          hint: "Trong subquery, so khớp account_id của bút toán với account_id của dòng đang được sửa (alias a). WHERE chỉ chọn tài khoản 1000000044.",
        },
      ],
      takeaway: {
        lines: [
          "Sổ bút toán là bản gốc, số dư là con số tổng hợp: lệch thì sửa số dư theo tổng bút toán.",
          "`UPDATE` luôn có `WHERE`, và trong thực tế chạy trong một transaction, xem kết quả rồi mới `COMMIT`.",
        ],
      },
      quiz: {
        question: "Truy vấn đối soát chạy trên dữ liệu sạch và trả về 0 dòng. Điều đó nói gì?",
        options: [
          "Truy vấn chắc chắn đúng và bắt được mọi loại lỗi",
          "Không có tài khoản nào lệch ở thời điểm chạy, nhưng chỉ chứng minh truy vấn đúng khi đã thử nó trên dữ liệu cố tình gây lệch và thấy nó báo lỗi",
          "Bảng stmt_entry đang rỗng",
          "Truy vấn sai vì đối soát luôn phải ra ít nhất một dòng",
        ],
        answer: 1,
        explain: "0 dòng nghĩa là không có chênh lệch lúc này. Nhưng một truy vấn sai (ví dụ JOIN loại mất tài khoản không có bút toán) cũng có thể ra 0 dòng. Vì vậy ta kiểm tra nó bằng cách cố tình gây lệch như bài 9 rồi xem nó có bắt được không. Bảng stmt_entry có 932 dòng, không rỗng, và đối soát không bắt buộc phải ra dòng nào.",
      },
    },
  ],
  cards: [
    { q: "Sáu bước khi gặp một câu hỏi SQL mới?", a: "Đọc bảng, nói rõ mỗi dòng kết quả là gì, viết `FROM` và `JOIN` rồi thử với `LIMIT`, thêm `WHERE`, rồi mới gom nhóm, cuối cùng kiểm tra số dòng." },
    { q: "Vì sao phải nói rõ \"hạt\" của kết quả trước khi viết?", a: "Biết mỗi dòng đại diện cho cái gì thì biết ngay cột nào vào `GROUP BY`." },
    { q: "Làm sao tách tiền vào và tiền ra từ một cột `amount`?", a: "Dùng `SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)` cho tiền vào, và tương tự cho tiền ra." },
    { q: "Top 1 mỗi nhóm viết thế nào?", a: "`RANK() OVER (PARTITION BY nhóm ORDER BY ... DESC)` trong CTE rồi lọc hạng 1 ở lớp ngoài. Dùng `RANK` để các khoản bằng nhau cùng được giữ." },
    { q: "Đối soát số dư trong T24 so sánh hai thứ nào?", a: "`account.working_balance` với tổng `stmt_entry.amount` của chính tài khoản đó. Sổ bút toán là bản gốc." },
    { q: "Làm sao nhận ra JOIN nhân dòng?", a: "Số dòng sau JOIN lớn hơn dự kiến. Đối chiếu bằng `COUNT(DISTINCT ...)` trên bảng gốc." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Mười bài toán đều đi theo cùng một đường: đọc bảng, nói rõ mỗi dòng kết quả là gì, viết FROM và JOIN trước, thêm WHERE, rồi mới gom nhóm hay dùng hàm cửa sổ. Điều kiện của bảng phía LEFT JOIN đặt trong ON, tiền vào ra tách bằng CASE trong SUM, chi nhánh của khoản vay lấy qua tài khoản, và NULL của SUM xử lý bằng COALESCE. INTERSECT cho phép giao hai danh sách khách, RANK trong CTE cho top mỗi nhóm, SUM OVER cho số dư chạy. Số dư tài khoản phải bằng tổng bút toán: truy vấn đối soát nên được thử bằng cách cố tình gây lệch, và khi sửa thì UPDATE luôn có WHERE. Cuối cùng, luôn kiểm tra số dòng để bắt lỗi nhân dòng.",
};
