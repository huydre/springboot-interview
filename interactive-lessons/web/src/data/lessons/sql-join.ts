import timeline from "../timelines/sql-join.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 6. Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlJoin: Lesson = {
  slug: "sql-join",
  crumb: "JOIN",
  videoDir: "/videos/sql-join",
  videoVersion: "b51351f9",
  scenes: timeline as Scene[],
  title: "Kết hợp bảng với JOIN",
  subtitle:
    "Dữ liệu ngân hàng nằm rải rác ở nhiều bảng. JOIN ghép chúng lại bằng khoá ngoại: INNER, LEFT, RIGHT, FULL, tự nối, nối nhiều bảng, tìm phần không khớp, và cái bẫy nhân dòng làm tổng tiền phình to.",
  openingQuiz: {
    question: "Bảng `account` chỉ lưu `customer_id`, không lưu tên khách. Muốn in danh sách tài khoản kèm tên khách hàng thì cần làm gì?",
    options: [
      "Chép tên khách vào từng dòng của bảng account để khỏi phải tra",
      "Ghép bảng account với bảng customer qua cột customer_id bằng JOIN",
      "Chạy hai câu SELECT riêng rồi tự đối chiếu bằng mắt",
      "Đổi customer_id thành kiểu chữ để nó hiện ra tên",
    ],
    answer: 1,
    explain: "Tên khách chỉ lưu một lần ở bảng customer (đúng tinh thần thiết kế ở bài 2). JOIN ghép hai bảng theo khoá ngoại ngay trong một câu SQL. Chép tên vào mọi dòng làm dữ liệu lặp và dễ sai lệch, đối chiếu bằng mắt thì không thể làm với 85 dòng, còn đổi kiểu dữ liệu không tạo ra thông tin mới.",
  },
  roadmap: [
    "Chặng 1: INNER JOIN, alias bảng, và bốn kiểu nối INNER, LEFT, RIGHT, FULL qua số dòng thật.",
    "Chặng 2: tìm phần không khớp (anti-join), nối nhiều bảng, tự nối và CROSS JOIN.",
    "Chặng 3: bẫy nhân dòng làm SUM bị nhân lên, và cách kiểm tra bằng cách đếm dòng trước và sau JOIN.",
  ],
  sections: [
    {
      id: "inner-join",
      trap: {
        title: "ON sai cột thì JOIN vẫn chạy và ra kết quả sai",
        text: "`JOIN customer c ON a.customer_id = a.customer_id` (nhầm một vế) luôn đúng nên ghép mọi cặp, ra 3400 dòng thay vì 85. Không có lỗi nào báo. Viết xong hãy đọc lại `ON` và so số dòng với kỳ vọng.",
      },
      title: "Phần 1: Vì sao cần JOIN và INNER JOIN",
      scene: "inner-join",
      intro: [
        "Ở bài 2 ta đã chia dữ liệu thành nhiều bảng để mỗi thông tin chỉ lưu một lần. Cái giá phải trả: thông tin muốn xem nằm ở nhiều nơi. Bảng `account` có `customer_id` nhưng không có tên khách. Tên nằm ở bảng `customer`. Giống như sổ tiết kiệm chỉ ghi mã khách hàng, muốn biết tên phải tra sang danh sách khách. **JOIN** là phép tra đó, làm tự động cho mọi dòng.",
        "Cú pháp: `FROM account a INNER JOIN customer c ON c.customer_id = a.customer_id`. Phần sau `ON` là **điều kiện nối**: hai dòng được ghép với nhau khi điều kiện đúng. Thường nó là khoá ngoại bằng khoá chính. **Alias bảng** (`a`, `c`) là tên ngắn đặt ngay sau tên bảng, để khỏi gõ lại tên dài. Khi hai bảng cùng có một tên cột như `customer_id`, bạn bắt buộc phải ghi rõ `a.customer_id` hay `c.customer_id`, nếu không PostgreSQL báo lỗi `column reference \"customer_id\" is ambiguous` (không rõ là cột của bảng nào).",
        "`INNER JOIN` (viết tắt `JOIN`) chỉ giữ những cặp dòng **khớp** điều kiện. Ví dụ khách 100001 (LY HOANG LONG) có 2 tài khoản nên cho ra 2 dòng. Nối `account` với `customer` cho 85 dòng, đúng bằng số tài khoản, vì mỗi tài khoản thuộc đúng một khách. Cũng tương tự, nối `account` với `category` cho thêm cột mô tả loại sản phẩm, ví dụ tài khoản 1000000001 là \"Tài khoản lương\" thuộc nhóm CURRENT.",
      ],
      sql: [
        {
          prompt: "Liệt kê mọi tài khoản kèm tên khách hàng (`short_name`) và số dư, xếp theo `account_id`. Kết quả có 85 dòng. Điền vào chỗ trống điều kiện nối.",
          starter: "SELECT a.account_id, c.short_name, a.working_balance\nFROM account a\nINNER JOIN customer c ON c.customer_id = ____\nORDER BY a.account_id;",
          solution: "SELECT a.account_id, c.short_name, a.working_balance FROM account a INNER JOIN customer c ON c.customer_id = a.customer_id ORDER BY a.account_id",
          hint: "Bên account, cột trỏ sang khách hàng là customer_id.",
          ordered: true,
        },
        {
          prompt: "Liệt kê các tài khoản tiết kiệm (`product_group = 'SAVINGS'` ở bảng `category`) kèm mô tả loại sản phẩm (`description`) và số dư, xếp theo `account_id`. Kết quả có 20 dòng.",
          starter: "SELECT a.account_id, cat.description, a.working_balance\nFROM account a\nJOIN category cat ON ____\nWHERE ____\nORDER BY a.account_id;",
          solution: "SELECT a.account_id, cat.description, a.working_balance FROM account a JOIN category cat ON cat.category_id = a.category_id WHERE cat.product_group = 'SAVINGS' ORDER BY a.account_id",
          hint: "Hai bảng nối với nhau qua category_id; điều kiện lọc nằm ở WHERE.",
          ordered: true,
        },
        {
          prompt: "Tìm các khoản vay quá hạn (`status = 'OVERDUE'` ở bảng `loan`) kèm tên khách vay, hiện `ld_id`, `short_name`, `principal`, xếp theo `ld_id`. Kết quả đúng: LD2400013 (DUONG TRONG NGHIA) và LD2400015 (LE HUU PHUOC), cùng 50.000.000.",
          starter: "SELECT\nFROM loan l\nJOIN customer c ON\nWHERE\nORDER BY l.ld_id;",
          solution: "SELECT l.ld_id, c.short_name, l.principal FROM loan l JOIN customer c ON c.customer_id = l.customer_id WHERE l.status = 'OVERDUE' ORDER BY l.ld_id",
          hint: "Nối loan với customer qua customer_id, rồi lọc l.status.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao câu `SELECT customer_id FROM account a JOIN customer c ON c.customer_id = a.customer_id` báo lỗi?",
        options: [
          "Vì câu JOIN bắt buộc phải có thêm mệnh đề WHERE đi kèm",
          "Vì customer_id có ở cả hai bảng, cần ghi a.customer_id hoặc c.customer_id",
          "Vì alias a và c phải viết hoa mới dùng được trong điều kiện ON",
          "Vì cột customer_id chỉ được đứng trong ON, không được đứng ở SELECT",
        ],
        answer: 1,
        explain: "Tên cột trùng ở hai bảng gây lỗi \"ambiguous\", cách sửa là gắn alias bảng vào trước tên cột. WHERE là tuỳ chọn với JOIN. Alias không phân biệt hoa thường theo cách đó. Cột nối được phép xuất hiện ở SELECT bình thường.",
      },
    },
    {
      id: "join-types",
      trap: {
        title: "COUNT(*) sau LEFT JOIN đếm cả dòng không khớp",
        text: "`customer LEFT JOIN loan` ra 40 dòng: `COUNT(*)` cho 40 còn `COUNT(l.ld_id)` cho 15 khoản vay thật. Khách chưa vay vẫn là một dòng với `ld_id` NULL. Muốn đếm phía phải, đếm một cột khoá của bảng phải.",
      },
      title: "Phần 2: INNER, LEFT, RIGHT, FULL khác nhau ở đâu",
      scene: "join-types",
      widget: "sql-join-types",
      widgetTitle: "Chọn kiểu JOIN và xem dòng nào còn lại, dòng nào mất",
      intro: [
        "INNER JOIN vứt mọi dòng không khớp. Nhưng đôi khi bạn cần giữ chúng: \"liệt kê **mọi** khách, ai có khoản vay thì kèm khoản vay\". Đó là việc của **outer join** (nối ngoài), có ba kiểu:",
        "- **`LEFT JOIN`**: giữ mọi dòng của bảng bên **trái** (bảng viết trước JOIN).",
        "- **`RIGHT JOIN`**: giữ mọi dòng của bảng bên **phải**.",
        "- **`FULL JOIN`**: giữ mọi dòng của cả hai bảng.",
        "Dòng nào không có cặp thì các cột của bên kia được điền **NULL**.",
        "Số dòng thật cho thấy rõ sự khác nhau. Bảng `customer` có 40 khách, bảng `loan` có 15 khoản vay, mỗi khoản thuộc một khách và 15 khách khác nhau đang có vay. Nối `customer` với `loan` theo `customer_id`: `INNER JOIN` cho 15 dòng, `LEFT JOIN` cho 40 dòng (15 khách có vay cộng 25 khách chưa vay, những người này có `ld_id` là NULL). `RIGHT JOIN` cho 15 dòng và `FULL JOIN` cho 40 dòng. Hai con số cuối bằng INNER và LEFT vì **mọi khoản vay đều có khách**: cột `loan.customer_id` là khoá ngoại bắt buộc, không thể có khoản vay mồ côi.",
        "Dùng widget để tự đổi kiểu nối trên hai bảng mẫu nhỏ có cả dòng khớp, dòng chỉ có bên trái và dòng chỉ có bên phải. Chọn lần lượt từng kiểu nối và xem dòng nào còn, dòng nào mất.",
      ],
      predict: {
        question: "Mẫu trong widget có 2 cặp khách và khoản vay khớp nhau, 3 khách chưa vay, và 2 khoản vay của khách ngoài mẫu. `FULL JOIN` ra bao nhiêu dòng?",
        options: ["2 dòng", "5 dòng", "7 dòng", "9 dòng"],
        answer: 2,
        explain: "FULL JOIN giữ cả ba phần: 2 cặp khớp, 3 khách chỉ có bên trái, 2 khoản vay chỉ có bên phải. 2 + 3 + 2 = 7. INNER chỉ giữ 2 dòng khớp.",
      },
      after: [
        "Trên mẫu: INNER cho 2 dòng khớp; LEFT thêm 3 khách chưa vay; RIGHT thêm 2 khoản vay của khách ngoài mẫu; FULL cho 7 dòng.",
        "Quy ước thực tế: `RIGHT JOIN` chỉ là `LEFT JOIN` với hai bảng đổi chỗ, nên hầu hết người viết SQL chỉ dùng `LEFT` cho dễ đọc.",
      ],
      sql: [
        {
          prompt: "Liệt kê mọi khách hàng kèm mã khoản vay của họ (nếu có), hiện `customer_id`, `short_name`, `ld_id`, xếp theo `customer_id`. Khách chưa vay có `ld_id` NULL. Kết quả có 40 dòng. Điền kiểu JOIN đúng.",
          starter: "SELECT c.customer_id, c.short_name, l.ld_id\nFROM customer c\n____ loan l ON l.customer_id = c.customer_id\nORDER BY c.customer_id;",
          solution: "SELECT c.customer_id, c.short_name, l.ld_id FROM customer c LEFT JOIN loan l ON l.customer_id = c.customer_id ORDER BY c.customer_id",
          hint: "Giữ mọi dòng của bảng đứng trước JOIN là kiểu nào?",
          ordered: true,
        },
        {
          prompt: "Đếm số khoản vay của từng khách (kể cả khách chưa vay, tức 0), hiện `customer_id` và `so_khoan_vay`, xếp theo `customer_id`. Kết quả có 40 dòng. Chú ý chọn đúng giữa `COUNT(*)` và `COUNT(l.ld_id)`.",
          starter: "SELECT c.customer_id, COUNT(____) AS so_khoan_vay\nFROM customer c\nLEFT JOIN loan l ON l.customer_id = c.customer_id\nGROUP BY c.customer_id\nORDER BY c.customer_id;",
          solution: "SELECT c.customer_id, COUNT(l.ld_id) AS so_khoan_vay FROM customer c LEFT JOIN loan l ON l.customer_id = c.customer_id GROUP BY c.customer_id ORDER BY c.customer_id",
          hint: "Cần một hàm đếm bỏ qua NULL của bảng loan, nên đếm một cột của loan.",
          ordered: true,
        },
        {
          prompt: "Viết lại câu 1 theo cách đảo hai bảng: bắt đầu từ `loan l`, dùng `RIGHT JOIN customer c`, vẫn hiện `customer_id`, `short_name`, `ld_id` của khách, xếp theo `customer_id`. Kết quả phải giống hệt câu 1 (40 dòng).",
          starter: "SELECT c.customer_id, c.short_name, l.ld_id\nFROM loan l\n\nORDER BY c.customer_id;",
          solution: "SELECT c.customer_id, c.short_name, l.ld_id FROM loan l RIGHT JOIN customer c ON l.customer_id = c.customer_id ORDER BY c.customer_id",
          hint: "Thêm dòng RIGHT JOIN customer c ON ... vào chỗ trống; bảng giữ đủ dòng bây giờ là customer.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Nối `customer` (40 dòng) với `loan` (15 dòng, mỗi khoản có một khách). `RIGHT JOIN` cho bao nhiêu dòng và vì sao?",
        options: [
          "40 dòng, vì RIGHT JOIN luôn giữ mọi dòng của bảng customer bên trái",
          "15 dòng, vì mọi khoản vay đều tìm được khách của nó",
          "25 dòng, vì RIGHT JOIN chỉ giữ phần không khớp của hai bảng",
          "55 dòng, vì RIGHT JOIN cộng số dòng của hai bảng",
        ],
        answer: 1,
        explain: "RIGHT JOIN giữ mọi dòng của bảng bên phải là loan: 15 khoản, và vì khoá ngoại bắt buộc nên cả 15 đều có khách, không có dòng nào NULL phía khách. Bảng customer là bảng trái nên không được giữ trọn. 25 và 55 không phải kết quả của bất kỳ kiểu nối nào ở đây.",
      },
    },
    {
      id: "anti-join",
      trap: {
        title: "Điều kiện của bảng phải đặt ở WHERE sẽ biến LEFT JOIN thành INNER JOIN",
        text: "Với khoản vay `LIVE`, đặt `l.status = 'LIVE'` trong `ON` vẫn giữ 40 khách, đặt trong `WHERE` chỉ còn 12 dòng vì khách chưa vay có `status` NULL nên bị loại. Điều kiện làm bảng phải thu hẹp mà vẫn giữ bảng trái thì để ở `ON`.",
      },
      title: "Phần 3: Tìm phần không khớp và bẫy ON với WHERE",
      scene: "anti-join",
      intro: [
        "Câu hỏi nghiệp vụ quen thuộc: \"khách nào **chưa có** khoản vay?\" hay \"tài khoản nào **chưa** phát sinh giao dịch?\". Cách trả lời bằng JOIN gọi là **anti-join**: nối `LEFT JOIN`, rồi chỉ giữ các dòng mà cột khoá của bảng phải là NULL. Dòng như vậy chính là dòng không tìm được cặp. Trên dữ liệu thật: `customer LEFT JOIN loan ... WHERE l.ld_id IS NULL` cho đúng 25 khách, khớp với tính toán 40 trừ 15 ở phần trước. Nhớ chọn một cột luôn có giá trị ở bảng phải (khoá chính) để kiểm tra NULL, nếu không bạn không phân biệt được \"không có cặp\" với \"có cặp nhưng cột đó NULL\".",
        "Điều kiện lọc bảng phải đặt ở `ON` hay `WHERE` cho kết quả khác nhau. Thử với khoản vay `LIVE`: `customer c LEFT JOIN loan l ON l.customer_id = c.customer_id AND l.status = 'LIVE'` vẫn ra 40 dòng (đủ 40 khách, khách không có vay LIVE mang cột `l` toàn NULL). Chuyển `l.status = 'LIVE'` xuống `WHERE` thì chỉ còn 12 dòng. Lý do: `WHERE` chạy **sau** khi nối xong. Dòng của khách không có vay LIVE có `l.status` là NULL, `NULL = 'LIVE'` không đúng, nên `WHERE` loại dòng đó, và LEFT JOIN thành ra giống INNER JOIN.",
        "Từ đó có quy tắc: điều kiện làm bảng phải \"thu hẹp\" mà vẫn muốn giữ bảng trái thì để ở `ON`. Điều kiện lọc kết quả cuối (kể cả `IS NULL` của anti-join) thì để ở `WHERE`. Kết hợp cả hai: khách **không có** khoản vay đang LIVE là `LEFT JOIN ... ON ... AND l.status = 'LIVE' WHERE l.ld_id IS NULL`, cho 28 khách (40 trừ 12 khách có vay LIVE).",
      ],
      sql: [
        {
          prompt: "Tìm các khách hàng chưa có khoản vay nào. Hiện `customer_id`, `short_name`, xếp theo `customer_id`. Kết quả có 25 dòng.",
          starter: "SELECT c.customer_id, c.short_name\nFROM customer c\nLEFT JOIN loan l ON l.customer_id = c.customer_id\nWHERE ____ IS NULL\nORDER BY c.customer_id;",
          solution: "SELECT c.customer_id, c.short_name FROM customer c LEFT JOIN loan l ON l.customer_id = c.customer_id WHERE l.ld_id IS NULL ORDER BY c.customer_id",
          hint: "Kiểm tra NULL ở khoá chính của bảng loan, tức l.ld_id.",
          ordered: true,
        },
        {
          prompt: "Tìm các khách hàng không có khoản vay đang `LIVE`. Hiện `customer_id`, `short_name`, xếp theo `customer_id`. Kết quả có 28 dòng. Nhớ đặt điều kiện trạng thái ở `ON`.",
          starter: "SELECT c.customer_id, c.short_name\nFROM customer c\nLEFT JOIN loan l ON l.customer_id = c.customer_id AND ____\nWHERE l.ld_id IS NULL\nORDER BY c.customer_id;",
          solution: "SELECT c.customer_id, c.short_name FROM customer c LEFT JOIN loan l ON l.customer_id = c.customer_id AND l.status = 'LIVE' WHERE l.ld_id IS NULL ORDER BY c.customer_id",
          hint: "Điều kiện về trạng thái khoản vay là l.status = 'LIVE'.",
          ordered: true,
        },
        {
          prompt: "Tìm các khách hàng chưa mở tài khoản tiết kiệm loại 6001 (`category_id = 6001`). Hiện `customer_id`, `short_name`, xếp theo `customer_id`. Kết quả có 33 dòng.",
          starter: "SELECT c.customer_id, c.short_name\nFROM customer c\n\nORDER BY c.customer_id;",
          solution: "SELECT c.customer_id, c.short_name FROM customer c LEFT JOIN account a ON a.customer_id = c.customer_id AND a.category_id = 6001 WHERE a.account_id IS NULL ORDER BY c.customer_id",
          hint: "LEFT JOIN account, đưa category_id = 6001 vào ON, rồi WHERE a.account_id IS NULL.",
          ordered: true,
        },
      ],
      takeaway: {
        lines: [
          "Tìm \"chưa có\": `LEFT JOIN` bảng phải, rồi `WHERE <khoá chính bảng phải> IS NULL`.",
        ],
      },
      quiz: {
        question: "Muốn liệt kê MỌI khách hàng, kèm khoản vay LIVE nếu có. Đặt `l.status = 'LIVE'` ở WHERE thay vì ON thì chuyện gì xảy ra?",
        options: [
          "Không có gì khác, vì hai cách viết luôn cho cùng một kết quả",
          "Khách chưa vay bị loại vì status NULL, LEFT JOIN thành INNER JOIN",
          "PostgreSQL báo lỗi vì cột của bảng phải không được đứng ở WHERE",
          "Mọi khách đều bị loại nên kết quả rỗng hoàn toàn",
        ],
        answer: 1,
        explain: "WHERE chạy sau khi nối. Dòng của khách chưa vay có l.status = NULL, nên điều kiện không đúng và dòng bị bỏ, mất đúng cái mà LEFT JOIN định giữ. Cột bảng phải đứng ở WHERE vẫn hợp lệ, không có lỗi. Kết quả rỗng sai vì khách có vay LIVE vẫn còn.",
      },
    },
    {
      id: "multi-join",
      title: "Phần 4: Nối nhiều bảng một lúc",
      scene: "multi-join",
      intro: [
        "Đến giờ mỗi câu mới nối hai bảng. Nhưng báo cáo thật thường cần thông tin từ ba, bốn bảng cùng lúc. Có thể nối liên tiếp nhiều bảng: mỗi `JOIN` thêm một bảng, mỗi bảng thêm cần một điều kiện `ON` riêng. Hãy nghĩ như đi theo dây khoá ngoại. Bút toán nằm ở `stmt_entry`, nó trỏ tới tài khoản (`account_id`), tài khoản trỏ tới khách (`customer_id`) và tới loại sản phẩm (`category_id`). Câu `FROM stmt_entry s JOIN account a ON a.account_id = s.account_id JOIN customer c ON c.customer_id = a.customer_id JOIN category cat ON cat.category_id = a.category_id` nối đủ 4 bảng, cần đúng 3 điều kiện `ON`.",
        "Kết quả vẫn là 932 dòng, đúng bằng số bút toán, vì mỗi bút toán thuộc đúng một tài khoản, mỗi tài khoản đúng một khách và một loại. Ví dụ dòng đầu: bút toán số 1 là +30.000.000 vào tài khoản 1000000041 của DANG THI MAI, loại \"Tài khoản thanh toán\"; bút toán số 2 là -30.000.000 ở tài khoản vay 1000000080 của cùng người, loại \"Vay tiêu dùng\" (đó là giải ngân khoản vay). Khi kết quả có nhiều cột, hãy luôn gắn alias bảng cho từng cột để biết cột đến từ đâu.",
        "Nối nhiều bảng là nền của hầu hết báo cáo. Gom theo nhóm sản phẩm: CURRENT 765 bút toán, SAVINGS 104, LOAN 63 (765 + 104 + 63 = 932). Gom theo thành phố của khách, chỉ tính bút toán ghi có (`amount > 0`): Hà Nội 131, Đà Nẵng 115, Hải Phòng 105, Cần Thơ 102, TP. Hồ Chí Minh 86. Thứ tự thực thi vẫn như cũ: FROM và các JOIN chạy trước hết, rồi tới WHERE, GROUP BY, HAVING, SELECT.",
      ],
      sql: [
        {
          prompt: "Liệt kê 5 bút toán đầu tiên (xếp theo `stmt_entry_id`) kèm tên khách và mô tả loại sản phẩm. Hiện `stmt_entry_id`, `amount`, `short_name`, `description`. Điền các điều kiện nối còn thiếu.",
          starter: "SELECT s.stmt_entry_id, s.amount, c.short_name, cat.description\nFROM stmt_entry s\nJOIN account a ON a.account_id = s.account_id\nJOIN customer c ON ____\nJOIN category cat ON ____\nORDER BY s.stmt_entry_id\nLIMIT 5;",
          solution: "SELECT s.stmt_entry_id, s.amount, c.short_name, cat.description FROM stmt_entry s JOIN account a ON a.account_id = s.account_id JOIN customer c ON c.customer_id = a.customer_id JOIN category cat ON cat.category_id = a.category_id ORDER BY s.stmt_entry_id LIMIT 5",
          hint: "Customer và category đều nối qua account, không nối thẳng với stmt_entry.",
          ordered: true,
        },
        {
          prompt: "Đếm số bút toán theo nhóm sản phẩm (`product_group` của bảng `category`) và tổng `amount`. Đặt tên `so_but_toan`, `tong_amount`, xếp theo `product_group`. Kết quả đúng: CURRENT 765, LOAN 63, SAVINGS 104.",
          starter: "SELECT cat.product_group, COUNT(*) AS so_but_toan, SUM(s.amount) AS tong_amount\nFROM stmt_entry s\n\nGROUP BY cat.product_group\nORDER BY cat.product_group;",
          solution: "SELECT cat.product_group, COUNT(*) AS so_but_toan, SUM(s.amount) AS tong_amount FROM stmt_entry s JOIN account a ON a.account_id = s.account_id JOIN category cat ON cat.category_id = a.category_id GROUP BY cat.product_group ORDER BY cat.product_group",
          hint: "Cần hai JOIN: stmt_entry với account, rồi account với category.",
          ordered: true,
        },
        {
          prompt: "Đếm số bút toán ghi có (`amount > 0`) theo thành phố của khách (`city`), hiện `city` và `so_but_toan`, xếp giảm dần theo số bút toán. Hà Nội đứng đầu với 131.",
          starter: "SELECT c.city, COUNT(*) AS so_but_toan\nFROM stmt_entry s\n\nWHERE\nGROUP BY c.city\nORDER BY ;",
          solution: "SELECT c.city, COUNT(*) AS so_but_toan FROM stmt_entry s JOIN account a ON a.account_id = s.account_id JOIN customer c ON c.customer_id = a.customer_id WHERE s.amount > 0 GROUP BY c.city ORDER BY COUNT(*) DESC",
          hint: "Nối stmt_entry, account, customer; lọc s.amount > 0; ORDER BY COUNT(*) DESC.",
          ordered: true,
        },
        {
          prompt: "Tìm 3 khách có nhiều bút toán nhất. Hiện `customer_id`, `short_name`, `so_but_toan`, xếp giảm dần theo số bút toán, bằng nhau thì theo `customer_id`. Gom theo cả `c.customer_id` và `c.short_name`. Kết quả đúng: 100033 và 100035 cùng 46 bút toán, rồi 100008 với 38.",
          starter: "SELECT c.customer_id, c.short_name, COUNT(*) AS so_but_toan\nFROM stmt_entry s\n\nGROUP BY c.customer_id, c.short_name\n\nLIMIT 3;",
          solution: "SELECT c.customer_id, c.short_name, COUNT(*) AS so_but_toan FROM stmt_entry s JOIN account a ON a.account_id = s.account_id JOIN customer c ON c.customer_id = a.customer_id GROUP BY c.customer_id, c.short_name ORDER BY COUNT(*) DESC, c.customer_id LIMIT 3",
          hint: "ORDER BY COUNT(*) DESC, c.customer_id, rồi LIMIT 3.",
          ordered: true,
        },
      ],
      takeaway: {
        lines: [
          "Nối nhiều bảng là đi theo dây khoá ngoại: mỗi bảng thêm vào cần một `ON` riêng, nên 4 bảng cần 3 điều kiện `ON`.",
        ],
      },
      quiz: {
        question: "Muốn biết tên khách của từng bút toán trong `stmt_entry`, ta nối `stmt_entry` với `account` rồi với `customer`. Vì sao không nối thẳng `stmt_entry` với `customer`?",
        options: [
          "Vì SQL chỉ cho nối tối đa hai bảng trong một câu lệnh",
          "Vì stmt_entry chỉ có khoá ngoại tới account, nên phải đi qua account",
          "Vì bảng customer quá lớn nên không nối trực tiếp được",
          "Vì nối thẳng sẽ cho ra ít dòng hơn 932",
        ],
        answer: 1,
        explain: "JOIN đi theo khoá ngoại: bút toán biết tài khoản của nó, tài khoản mới biết khách. Không có cột chung để nối thẳng stmt_entry với customer. SQL cho nối nhiều bảng không giới hạn thực tế, kích thước bảng không phải lý do, và kết quả sau khi đi qua account vẫn đủ 932 dòng.",
      },
    },
    {
      id: "self-cross",
      trap: {
        title: "Self join dùng <> thì mỗi cặp lặp hai lần",
        text: "`a1.account_id <> a2.account_id` bỏ được cặp tự ghép nhưng vẫn ra 120 dòng, mỗi cặp hai lần. Dùng `<` thì ra đúng 60 cặp. Quên hẳn `ON` trong CROSS JOIN còn tệ hơn: `customer` với `account` ra 3400 dòng vô nghĩa.",
      },
      title: "Phần 5: Tự nối (SELF JOIN) và CROSS JOIN",
      scene: "self-cross",
      intro: [
        "**SELF JOIN** là nối một bảng với chính nó, dùng hai alias khác nhau để đóng vai hai bản sao. Dùng khi cần so sánh các dòng cùng bảng với nhau. Ví dụ: tìm các **cặp tài khoản của cùng một khách**: `FROM account a1 JOIN account a2 ON a2.customer_id = a1.customer_id`. Nhìn một khách trước: khách 100001 có hai tài khoản 1000000001 và 1000000002, và phép nối cho 4 dòng: (…01, …01), (…01, …02), (…02, …01), (…02, …02). Hai dòng là tài khoản tự ghép với chính nó, hai dòng còn lại là **cùng một cặp** theo hai thứ tự. Trên cả bảng `account` 85 dòng, mỗi dòng ghép với mọi tài khoản của cùng khách, kể cả chính nó, nên được 205 dòng (85 cặp tự ghép với mình, 120 cặp có hai tài khoản khác nhau, mỗi cặp xuất hiện hai lần theo hai thứ tự).",
        "Muốn mỗi cặp chỉ xuất hiện một lần, và bỏ cặp tự ghép, thêm điều kiện `a1.account_id < a2.account_id` vào `ON`. Số cặp còn đúng 60 (một nửa của 120). Dòng đầu là khách 100001 với hai tài khoản 1000000001 và 1000000002. Thêm `a1.ccy = a2.ccy` thì còn 42 cặp cùng loại tiền, còn `a1.ccy <> a2.ccy` cho 18 cặp khác loại tiền (42 + 18 = 60).",
        "**CROSS JOIN** ghép **mọi dòng bảng này với mọi dòng bảng kia**, không có điều kiện `ON`. Số dòng bằng tích hai bảng: `currency` (4 dòng) CROSS JOIN `txn_type` (8 dòng) cho 32 dòng, dùng được để tạo bảng tổ hợp. Nhưng nếu lỡ nối `customer` (40) với `account` (85) mà quên `ON`, bạn nhận 3400 dòng vô nghĩa. Dấu hiệu nhận ra lỗi quên điều kiện nối: số dòng ra bằng tích hai bảng.",
      ],
      sql: [
        {
          prompt: "Liệt kê các cặp tài khoản của cùng một khách, mỗi cặp một lần. Hiện `customer_id`, `tk_1`, `tk_2` (là `account_id` của hai bản sao), xếp theo `customer_id`, `tk_1`, `tk_2`. Kết quả có 60 dòng.",
          starter: "SELECT a1.customer_id, a1.account_id AS tk_1, a2.account_id AS tk_2\nFROM account a1\nJOIN account a2 ON a2.customer_id = a1.customer_id AND a1.account_id ____ a2.account_id\nORDER BY a1.customer_id, a1.account_id, a2.account_id;",
          solution: "SELECT a1.customer_id, a1.account_id AS tk_1, a2.account_id AS tk_2 FROM account a1 JOIN account a2 ON a2.customer_id = a1.customer_id AND a1.account_id < a2.account_id ORDER BY a1.customer_id, a1.account_id, a2.account_id",
          hint: "Chỉ giữ cặp mà mã tài khoản thứ nhất nhỏ hơn mã thứ hai.",
          ordered: true,
        },
        {
          prompt: "Trong các cặp tài khoản của cùng một khách, chỉ giữ cặp có hai loại tiền khác nhau (`ccy`). Hiện `customer_id`, `tk_1`, `tk_2`, xếp theo `customer_id`, `tk_1`, `tk_2`. Kết quả có 18 dòng, dòng đầu là khách 100008.",
          starter: "SELECT a1.customer_id, a1.account_id AS tk_1, a2.account_id AS tk_2\nFROM account a1\nJOIN account a2 ON a2.customer_id = a1.customer_id AND a1.account_id < a2.account_id\nWHERE ____\nORDER BY a1.customer_id, a1.account_id, a2.account_id;",
          solution: "SELECT a1.customer_id, a1.account_id AS tk_1, a2.account_id AS tk_2 FROM account a1 JOIN account a2 ON a2.customer_id = a1.customer_id AND a1.account_id < a2.account_id WHERE a1.ccy <> a2.ccy ORDER BY a1.customer_id, a1.account_id, a2.account_id",
          hint: "So sánh cột ccy của hai bản sao a1 và a2 bằng <>.",
          ordered: true,
        },
        {
          prompt: "Dùng `CROSS JOIN` tạo mọi tổ hợp loại tiền và loại giao dịch: hiện `ccy` (bảng `currency`) và `txn_code` (bảng `txn_type`), xếp theo `ccy` rồi `txn_code`. Kết quả có 32 dòng.",
          starter: "SELECT c.ccy, t.txn_code\nFROM currency c\n____ txn_type t\nORDER BY c.ccy, t.txn_code;",
          solution: "SELECT c.ccy, t.txn_code FROM currency c CROSS JOIN txn_type t ORDER BY c.ccy, t.txn_code",
          hint: "CROSS JOIN không có phần ON.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Tự nối `account a1 JOIN account a2 ON a2.customer_id = a1.customer_id` cho 205 dòng. Thêm điều kiện nào để mỗi cặp hai tài khoản khác nhau chỉ xuất hiện ĐÚNG MỘT lần?",
        options: [
          "a1.account_id = a2.account_id, vì hai tài khoản phải trùng mã",
          "a1.account_id <> a2.account_id, vì mã phải khác nhau",
          "a1.account_id < a2.account_id, vì chỉ giữ thứ tự nhỏ trước, lớn sau",
          "a1.ccy = a2.ccy, vì cùng loại tiền thì không bị lặp",
        ],
        answer: 2,
        explain: "Điều kiện nhỏ hơn loại cả cặp tự ghép lẫn bản đảo ngược của mỗi cặp, còn 60 dòng. Dấu = chỉ giữ cặp tự ghép (85 dòng). Dấu <> bỏ cặp tự ghép nhưng mỗi cặp vẫn hiện hai lần (120 dòng). Điều kiện cùng loại tiền không liên quan tới chuyện lặp cặp.",
      },
    },
    {
      id: "fan-out",
      trap: {
        title: "JOIN bảng con rồi SUM cột của bảng cha là cộng lặp",
        text: "Tổng số dư 75 tài khoản VND là 17.342.070.666. Nối với `stmt_entry` rồi `SUM(a.working_balance)` ra 779 dòng và 217.922.454.175, gấp hơn 12 lần, mà không có lỗi nào. Hãy đếm dòng trước và sau mỗi JOIN, và đừng nối bảng con khi câu hỏi chỉ cần số của bảng cha.",
      },
      title: "Phần 6: Bẫy nhân dòng, SUM bị nhân lên",
      scene: "fan-out",
      intro: [
        "Mỗi khi nối một bảng **bên \"nhiều\"** vào bảng bên \"một\", dòng của bảng \"một\" bị **lặp lại** cho từng dòng con. Với `account` (85 dòng) và `stmt_entry` (932 bút toán, mỗi tài khoản nhiều bút toán), nối ra 932 dòng, và mỗi tài khoản lặp đúng bằng số bút toán của nó. Không sao nếu bạn chỉ đọc danh sách. Nhưng nếu bạn **cộng** một cột của bảng \"một\" sau khi nối, mỗi giá trị bị cộng nhiều lần.",
        "Nhìn ở quy mô nhỏ: khách 100001 có hai tài khoản, số dư 107.956.000 và 5.088.114, tổng đúng 113.044.114. Sau khi nối với bút toán (19 và 6 bút toán), tài khoản thứ nhất bị cộng 19 lần, tài khoản thứ hai 6 lần, và tổng thành 2.081.692.684. Kết quả sai mà không có lỗi hay cảnh báo nào.",
        "Cách phòng:",
        "- **Đếm dòng**: đếm trước và sau mỗi JOIN; số dòng tăng mà bạn không mong đợi là có nhân dòng.",
        "- **Không nối khi không cần**: câu hỏi \"tổng số dư VND\" chỉ cần bảng `account`, nên `SELECT SUM(working_balance) FROM account WHERE ccy = 'VND'` ra đúng 17.342.070.666; nối thêm `stmt_entry` chỉ làm hỏng. Khi đếm cha sau khi nối, dùng `COUNT(DISTINCT a.account_id)`.",
        "- **Gom bảng con trước rồi mới nối**: tính mỗi tài khoản một dòng từ `stmt_entry` (ví dụ số bút toán), rồi mới nối với `account`, nên mỗi tài khoản vẫn chỉ một dòng. Cách này cần subquery hoặc CTE ở bài 8.",
        "Đừng sửa bằng cách đổi sang cộng một cột của bảng con, như `SUM(e.amount)`. Đó là một **câu hỏi khác**: \"tổng tiền các bút toán\". Ở bộ dữ liệu này nó tình cờ ra đúng 17.342.070.666, vì T24 giả lập giữ số dư mỗi tài khoản bằng tổng bút toán của nó; với cột khác của bảng cha (hạn mức, lãi suất) thì không có cột con nào để thay. Cùng bẫy xảy ra khi nối hai bảng con vào một bảng cha: các dòng con nhân chéo với nhau.",
      ],
      sql: [
        {
          prompt: "Đếm số dòng sau khi nối `account` với `stmt_entry`, rồi đếm số tài khoản khác nhau trong kết quả đó. Hiện `so_dong` và `so_tai_khoan`. Kết quả đúng: 932 và 85. Hai con số khác nhau chính là dấu hiệu nhân dòng.",
          starter: "SELECT COUNT(*) AS so_dong,\n       COUNT(DISTINCT ____) AS so_tai_khoan\nFROM account a\nJOIN stmt_entry e ON e.account_id = a.account_id;",
          solution: "SELECT COUNT(*) AS so_dong, COUNT(DISTINCT a.account_id) AS so_tai_khoan FROM account a JOIN stmt_entry e ON e.account_id = a.account_id",
          hint: "Đếm giá trị khác nhau của cột account_id.",
        },
        {
          prompt: "Câu này tính tổng số dư VND bằng cách cộng `a.working_balance` sau khi nối với bút toán nên ra 217.922.454.175, sai. Câu hỏi chỉ cần số dư trong bảng `account`. Sửa để ra đúng 17342070666 (đặt tên `tong_so_du`) bằng cách bỏ phép nối không cần thiết.",
          starter: "SELECT SUM(a.working_balance) AS tong_so_du\nFROM account a\nJOIN stmt_entry e ON e.account_id = a.account_id\nWHERE a.ccy = 'VND';",
          solution: "SELECT SUM(a.working_balance) AS tong_so_du FROM account a WHERE a.ccy = 'VND'",
          hint: "Xoá dòng JOIN: mỗi tài khoản khi đó chỉ còn một dòng, nên mỗi số dư được cộng đúng một lần.",
        },
        {
          prompt: "Với mỗi khách, đếm số tài khoản có bút toán và tổng số bút toán. Hiện `customer_id`, `so_tai_khoan`, `so_but_toan`, xếp giảm dần theo số bút toán, bằng nhau thì theo `customer_id`, lấy 3 dòng đầu. Kết quả đúng: 100033 (3 tài khoản, 46 bút toán), 100035 (4, 46), 100008 (3, 38).",
          starter: "SELECT a.customer_id,\n       COUNT(DISTINCT a.account_id) AS so_tai_khoan,\n       COUNT(e.stmt_entry_id) AS so_but_toan\nFROM account a\nJOIN stmt_entry e ON e.account_id = a.account_id\nGROUP BY a.customer_id\n\nLIMIT 3;",
          solution: "SELECT a.customer_id, COUNT(DISTINCT a.account_id) AS so_tai_khoan, COUNT(e.stmt_entry_id) AS so_but_toan FROM account a JOIN stmt_entry e ON e.account_id = a.account_id GROUP BY a.customer_id ORDER BY COUNT(e.stmt_entry_id) DESC, a.customer_id LIMIT 3",
          hint: "Điền ORDER BY COUNT(e.stmt_entry_id) DESC, a.customer_id vào dòng trống.",
          ordered: true,
        },
      ],
      takeaway: {
        lines: [
          "Số dòng tăng sau JOIN là lúc phải nghi ngờ mọi `SUM` trên cột của bảng cha.",
          "Câu hỏi chỉ cần bảng cha thì đừng nối bảng con. Cần số của bảng con thì gom bảng con trước, rồi mới nối.",
        ],
      },
      quiz: {
        question: "Sau khi nối `account` với `stmt_entry`, bạn thấy số dòng tăng từ 85 lên 932. Điều gì đúng khi bạn viết `SUM(a.working_balance)`?",
        options: [
          "Kết quả vẫn đúng vì SUM tự loại các giá trị lặp lại",
          "Kết quả phình to vì số dư mỗi tài khoản bị cộng theo từng bút toán của nó",
          "PostgreSQL báo lỗi vì cột bảng cha không dùng được sau khi nối bảng con",
          "Kết quả bị giảm đi vì dòng không khớp bị bỏ",
        ],
        answer: 1,
        explain: "SUM cộng mọi dòng nó nhận, không biết các dòng lặp là cùng một tài khoản. Không có lỗi hay cảnh báo, chỉ có con số sai. Cột bảng cha vẫn dùng được bình thường. Với INNER JOIN này mọi tài khoản đều có bút toán nên không có dòng nào bị bỏ, vấn đề là dòng bị lặp chứ không phải thiếu.",
      },
    },
  ],
  cards: [
    { q: "`INNER JOIN` và `LEFT JOIN` khác nhau ở đâu?", a: "`INNER` chỉ giữ cặp khớp. `LEFT` giữ mọi dòng bên trái, dòng không có cặp thì cột bên phải là NULL." },
    { q: "Làm sao tìm khách chưa có khoản vay?", a: "`LEFT JOIN loan l ...` rồi `WHERE l.ld_id IS NULL` với cột khoá của bảng phải. Trên dữ liệu thật ra 25 khách." },
    { q: "Điều kiện bảng phải đặt ở `ON` hay `WHERE` khi dùng LEFT JOIN?", a: "Muốn giữ dòng bên trái thì đặt ở `ON`. Đặt ở `WHERE` sẽ loại các dòng NULL và biến nó thành INNER JOIN." },
    { q: "Fan-out là gì và nhận ra bằng cách nào?", a: "Nối bảng con vào bảng cha làm dòng cha lặp theo số con, nên SUM cột cha bị cộng lặp. Đếm dòng trước và sau JOIN để phát hiện." },
    { q: "Self join cần alias và điều kiện nào để mỗi cặp chỉ xuất hiện một lần?", a: "Hai alias khác nhau cho cùng một bảng và điều kiện `a1.id < a2.id`. Dùng `<>` thì mỗi cặp vẫn lặp hai lần." },
    { q: "Dấu hiệu của CROSS JOIN ngoài ý muốn?", a: "Số dòng bằng tích hai bảng, ví dụ 40 nhân 85 ra 3400. Thường do quên điều kiện nối." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "JOIN ghép các bảng theo điều kiện ON, thường là khoá ngoại bằng khoá chính, và dùng alias bảng để gọi tên cột cho rõ. INNER JOIN chỉ giữ cặp khớp; LEFT, RIGHT, FULL giữ thêm dòng không khớp của bên trái, bên phải hoặc cả hai và điền NULL (customer với loan cho 15, 40, 15 và 40 dòng). Anti-join là LEFT JOIN rồi WHERE khoá bảng phải IS NULL, và điều kiện thu hẹp bảng phải phải đặt ở ON để không biến LEFT thành INNER. Nối nhiều bảng là đi theo chuỗi khoá ngoại với một ON cho mỗi bảng thêm; SELF JOIN dùng hai alias của cùng bảng, còn CROSS JOIN ghép tất cả với tất cả. Cuối cùng, nối bảng con vào bảng cha làm dòng bảng cha lặp lại nên SUM cột của bảng cha bị nhân lên: luôn đếm dòng trước và sau JOIN.",
};
