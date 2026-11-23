import timeline from "../timelines/sql-filter.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 4. Every query and every count quoted below was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlFilter: Lesson = {
  slug: "sql-filter",
  crumb: "Lọc và sắp xếp",
  videoDir: "/videos/sql-filter",
  videoVersion: "20680e4f",
  scenes: timeline as Scene[],
  title: "Lọc và sắp xếp dữ liệu",
  subtitle:
    "WHERE để giữ đúng những dòng cần, AND/OR/NOT, IN, BETWEEN, LIKE, IS NULL, rồi ORDER BY và LIMIT/OFFSET để sắp xếp và chia trang. Mỗi phần có một cái bẫy mà người mới nào cũng dính, và bạn sẽ thấy nó bằng số liệu thật.",
  openingQuiz: {
    question: "Bảng customer có 40 khách, trong đó 6 khách chưa có số điện thoại (mobile là NULL). Câu `WHERE mobile = NULL` trả về bao nhiêu dòng?",
    options: [
      "6 dòng, đúng những khách chưa có số điện thoại",
      "34 dòng, những khách có số điện thoại",
      "0 dòng, vì so sánh với NULL không bao giờ cho kết quả đúng",
      "Báo lỗi cú pháp vì NULL không được đứng sau dấu bằng",
    ],
    answer: 2,
    explain: "NULL nghĩa là \"chưa biết\", nên `mobile = NULL` cho ra \"không biết\" chứ không phải \"đúng\". WHERE chỉ giữ dòng nào cho kết quả đúng, nên không dòng nào được giữ, và PostgreSQL cũng không báo lỗi. Muốn tìm 6 khách đó phải viết `mobile IS NULL`.",
  },
  roadmap: [
    "Chặng 1: WHERE và các phép so sánh, AND/OR/NOT với thứ tự ưu tiên.",
    "Chặng 2: IN, BETWEEN, LIKE/ILIKE và IS NULL, cùng các bẫy hay làm sai kết quả mà không báo lỗi.",
    "Chặng 3: ORDER BY, NULLS FIRST/LAST, LIMIT/OFFSET và cách chia trang không bị lặp dòng.",
  ],
  sections: [
    {
      id: "where-basic",
      trap: {
        title: "Nháy kép là tên cột, và chuỗi phân biệt hoa thường",
        text: "`WHERE city = \"Hà Nội\"` báo `column \"Hà Nội\" does not exist`, vì nháy kép là tên cột. Giá trị chuỗi phải dùng nháy đơn. So sánh chuỗi cũng phân biệt hoa thường: `city = 'hà nội'` trả 0 dòng, `city = 'Hà Nội'` trả 9 dòng.",
      },
      title: "Phần 1: WHERE, giữ lại đúng những dòng cần",
      scene: "where-basic",
      intro: [
        "Ở bài trước bạn lấy mọi dòng của một bảng. Thực tế ta thường chỉ cần một phần: khách ở Hà Nội, tài khoản đang âm tiền, lệnh chuyển khoản chưa hoàn tất. **WHERE** là bộ lọc: SQL đi qua từng dòng của bảng, dòng nào thoả điều kiện thì giữ, không thoả thì bỏ. Giống như bạn đứng ở quầy và chỉ lấy những hồ sơ có dán nhãn đỏ.",
        "Điều kiện là một phép so sánh: `=` (bằng), `<>` (khác), `<`, `<=`, `>`, `>=`. Giá trị đem so viết theo kiểu của nó:",
        "- **Chuỗi chữ**: đặt trong **nháy đơn**, `'Hà Nội'`.",
        "- **Số**: để nguyên, `100`.",
        "- **Ngày**: viết dạng `'2024-03-31'`.",
        "Thứ tự câu lệnh là `SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT`.",
        "Thứ tự **chạy** thì khác thứ tự viết: `FROM`, rồi `WHERE`, rồi `SELECT`, rồi `ORDER BY`, `LIMIT`. Vì `WHERE` chạy trước `SELECT`, nó **không thấy alias** đặt ở `SELECT`: `SELECT working_balance AS so_du FROM account WHERE so_du > 0` báo `column \"so_du\" does not exist`. Trong `WHERE` hãy viết lại tên cột hoặc biểu thức gốc: `WHERE working_balance > 0`. `ORDER BY` chạy sau `SELECT` nên vẫn dùng được alias như bài trước.",
      ],
      sql: [
        {
          prompt: "Điền điều kiện để lấy các khách hàng ở Hà Nội. Nhớ nháy đơn và viết đúng hoa thường. Kết quả có 9 dòng.",
          starter: "SELECT customer_id, short_name, city\nFROM customer\nWHERE city = ____;",
          solution: "SELECT customer_id, short_name, city FROM customer WHERE city = 'Hà Nội'",
          hint: "Chuỗi chữ đặt trong nháy đơn, giống hệt giá trị trong bảng.",
        },
        {
          prompt: "Tìm các tài khoản có số dư âm (chủ yếu là tài khoản vay). Lấy `account_id`, `customer_id`, `working_balance`. Kết quả có 14 dòng.",
          starter: "SELECT account_id, customer_id, working_balance\nFROM account\nWHERE ____;",
          solution: "SELECT account_id, customer_id, working_balance FROM account WHERE working_balance < 0",
          hint: "Số không cần nháy. So sánh nhỏ hơn 0.",
        },
        {
          prompt: "Tìm các lệnh chuyển khoản chưa hoàn tất, tức `status` khác `'DONE'`. Lấy `ft_id`, `amount`, `status`. Kết quả có 9 dòng (6 PENDING, 3 FAILED).",
          starter: "SELECT ft_id, amount, status\nFROM funds_transfer\nWHERE ;",
          solution: "SELECT ft_id, amount, status FROM funds_transfer WHERE status <> 'DONE'",
          hint: "Phép khác trong SQL là <> (cũng có thể viết !=).",
        },
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["`FROM` → `WHERE` → `SELECT` → `ORDER BY` → `LIMIT`. `WHERE` chạy trước `SELECT` nên không thấy alias; `ORDER BY` chạy sau nên thấy."],
      },
      quiz: {
        question: "Câu nào lấy đúng các khách hàng ở Đà Nẵng?",
        options: [
          "WHERE city = 'Đà Nẵng'",
          "WHERE city = \"Đà Nẵng\"",
          "WHERE city == 'Đà Nẵng'",
          "WHERE city = Đà Nẵng",
        ],
        answer: 0,
        explain: "Chuỗi phải đặt trong nháy đơn. Nháy kép là tên cột nên báo lỗi cột không tồn tại. SQL dùng một dấu `=` để so sánh, không dùng `==`. Viết trần `Đà Nẵng` thì SQL coi là hai tên cột và báo lỗi cú pháp.",
      },
    },
    {
      id: "and-or-not",
      trap: {
        title: "AND được tính trước OR, thiếu ngoặc là sai im lặng",
        text: "`city = 'Hà Nội' OR city = 'Đà Nẵng' AND customer_status = 'ACTIVE'` ra 16 dòng, gồm cả khách Hà Nội đã `DORMANT` (ngủ đông: lâu không giao dịch). Có ngoặc `(... OR ...) AND customer_status = 'ACTIVE'` chỉ ra 15 dòng. SQL không báo lỗi khi quên ngoặc, nên hễ trộn AND với OR thì luôn đặt ngoặc.",
      },
      title: "Phần 2: AND, OR, NOT và thứ tự ưu tiên",
      scene: "and-or-not",
      intro: [
        "Phần 1 lọc bằng một điều kiện. Thực tế thường cần nhiều điều kiện cùng lúc, ví dụ khách Hà Nội **và** đang hoạt động.",
        "Nối nhiều điều kiện bằng **AND** (cả hai cùng đúng), **OR** (một trong hai đúng) và **NOT** (đảo ngược). Ví dụ `city = 'Hà Nội' AND sector_id = 1000` lấy khách Hà Nội thuộc nhóm cá nhân (6 dòng).",
        "**AND được tính trước OR**, giống phép nhân được tính trước phép cộng, nên khi trộn hai loại phải đặt ngoặc (xem khung bẫy). Hãy thử ba cách viết trong widget bên dưới và nhìn dòng nào bị thừa.",
      ],
      widget: "sql-filter-logic",
      widgetTitle: "Thực hành AND, OR và dấu ngoặc",
      sql: [
        {
          prompt: "Lấy khách ở Hà Nội và thuộc nhóm `sector_id = 1000`. Cột: `customer_id`, `short_name`, `city`, `sector_id`. Kết quả có 6 dòng.",
          starter: "SELECT customer_id, short_name, city, sector_id\nFROM customer\nWHERE city = 'Hà Nội' ____ sector_id = 1000;",
          solution: "SELECT customer_id, short_name, city, sector_id FROM customer WHERE city = 'Hà Nội' AND sector_id = 1000",
          hint: "Cần cả hai điều kiện cùng đúng.",
        },
        {
          prompt: "Lấy khách đang hoạt động (`customer_status = 'ACTIVE'`) ở Hà Nội hoặc Đà Nẵng. Đặt ngoặc đúng chỗ để ra 15 dòng, không dính khách DORMANT. Cột: `customer_id`, `city`, `customer_status`.",
          starter: "SELECT customer_id, city, customer_status\nFROM customer\nWHERE city = 'Hà Nội' OR city = 'Đà Nẵng' AND customer_status = 'ACTIVE';",
          solution: "SELECT customer_id, city, customer_status FROM customer WHERE (city = 'Hà Nội' OR city = 'Đà Nẵng') AND customer_status = 'ACTIVE'",
          hint: "Bọc hai điều kiện thành phố bằng một cặp ngoặc.",
        },
        {
          prompt: "Dùng NOT để lấy các khách hàng không ở trạng thái ACTIVE. Cột: `customer_id`, `customer_status`. Kết quả có 5 dòng (3 DORMANT, 2 CLOSED).",
          starter: "SELECT customer_id, customer_status\nFROM customer\nWHERE NOT ____;",
          solution: "SELECT customer_id, customer_status FROM customer WHERE NOT customer_status = 'ACTIVE'",
          hint: "NOT đứng trước điều kiện cần đảo. Cũng có thể viết <> 'ACTIVE'.",
        },
      ],
      quiz: {
        question: "`WHERE city = 'Hà Nội' OR city = 'Đà Nẵng' AND customer_status = 'ACTIVE'` trả 16 dòng, còn bản có ngoặc quanh hai thành phố trả 15. Dòng thừa là gì?",
        options: [
          "Một khách Đà Nẵng đang ACTIVE bị đếm hai lần",
          "Một khách Hà Nội ở trạng thái DORMANT, vì điều kiện ACTIVE chỉ gắn với Đà Nẵng",
          "Một khách ở thành phố khác lọt vào do OR quá rộng",
          "Một khách Hà Nội có customer_status là NULL",
        ],
        answer: 1,
        explain: "AND tính trước, nên điều kiện ACTIVE chỉ ràng buộc nhánh Đà Nẵng. Nhánh Hà Nội đứng riêng nên khách DORMANT 100014 cũng vào. WHERE không bao giờ đếm một dòng hai lần, và OR ở đây chỉ nhận hai thành phố đó. Dữ liệu cũng không có customer_status NULL.",
      },
    },
    {
      id: "in-between-like",
      trap: {
        title: "BETWEEN gồm cả hai đầu mút và viết ngược thì ra 0 dòng",
        text: "Trên `stmt_entry`, `amount BETWEEN 1000000 AND 5000000` ra 151 dòng, còn `amount > 1000000 AND amount < 5000000` chỉ 74 dòng. Viết ngược `BETWEEN 5000000 AND 1000000` ra 0 dòng mà không báo lỗi.",
      },
      title: "Phần 3: IN, BETWEEN và LIKE",
      scene: "in-between-like",
      intro: [
        "Hai phép viết tắt giúp WHERE ngắn gọn. **IN** kiểm tra giá trị có nằm trong một danh sách: `category_id IN (6001, 6006, 6012)` thay cho ba điều kiện `category_id = 6001 OR category_id = 6006 OR category_id = 6012` (ra 20 tài khoản tiết kiệm). Ngắn hơn và không phải lo ngoặc khi trộn với AND.",
        "**BETWEEN a AND b** kiểm tra giá trị nằm trong khoảng, **tính cả hai đầu**: nó đúng bằng `>= a AND <= b`. Số nhỏ phải viết trước: viết ngược `BETWEEN 5000000 AND 1000000` nghĩa là `>= 5000000 AND <= 1000000`, không số nào thoả, nên ra 0 dòng mà không báo lỗi (xem khung bẫy).",
        "Với ngày, `booking_date BETWEEN '2024-03-01' AND '2024-03-31'` lấy đủ tháng 3, vì mọi cột ngày trong bộ dữ liệu này là kiểu `date` (chỉ có ngày, không có giờ). Nếu cột là kiểu có giờ phút (`timestamp`), `'2024-03-31'` được hiểu là 00:00 ngày 31, nên mọi giao dịch trong ngày 31 sau nửa đêm bị bỏ sót. Khi đó viết `>= '2024-03-01' AND < '2024-04-01'`.",
      ],
      sql: [
        {
          prompt: "Lấy các tài khoản có `category_id` là 6001, 6006 hoặc 6012 (các loại tiết kiệm). Cột: `account_id`, `customer_id`, `category_id`. Kết quả có 20 dòng.",
          starter: "SELECT account_id, customer_id, category_id\nFROM account\nWHERE category_id IN (____);",
          solution: "SELECT account_id, customer_id, category_id FROM account WHERE category_id IN (6001, 6006, 6012)",
          hint: "Liệt kê ba mã, cách nhau bằng dấu phẩy.",
        },
        {
          prompt: "Lấy các bút toán có `amount` từ 1.000.000 đến 5.000.000, tính cả hai đầu. Cột: `stmt_entry_id`, `account_id`, `amount`. Kết quả có 151 dòng, bảng chỉ hiển thị 100 dòng đầu.",
          starter: "SELECT stmt_entry_id, account_id, amount\nFROM stmt_entry\nWHERE amount BETWEEN ____ AND ____;",
          solution: "SELECT stmt_entry_id, account_id, amount FROM stmt_entry WHERE amount BETWEEN 1000000 AND 5000000",
          hint: "Số nhỏ viết trước, số lớn viết sau, không có dấu chấm ngăn nghìn.",
        },
      ],
      quiz: {
        question: "Trên `stmt_entry`, `amount BETWEEN 1000000 AND 5000000` cho 151 dòng. Điều nào giải thích vì sao nhiều hơn 74 dòng của `amount > 1000000 AND amount < 5000000`?",
        options: [
          "BETWEEN bỏ qua hai đầu mút nên nới rộng khoảng ra hai phía",
          "BETWEEN lấy cả hai đầu mút, nên các bút toán đúng 1.000.000 hoặc 5.000.000 cũng được tính",
          "BETWEEN so sánh theo chuỗi chữ chứ không theo số",
          "BETWEEN tự thêm các dòng có amount là NULL",
        ],
        answer: 1,
        explain: "BETWEEN a AND b tương đương `>= a AND <= b`. 77 dòng chênh là các bút toán nằm đúng trên hai đầu mút. BETWEEN vẫn so sánh theo số với cột số, và dòng NULL không bao giờ qua được phép so sánh.",
      },
      parts: [
        {
          id: "like-ilike",
          title: "LIKE và ILIKE, so khớp mẫu chữ",
          intro: [
            "**LIKE** so khớp chuỗi với một mẫu. Trong mẫu có hai ký tự đặc biệt: `%` thay cho một đoạn ký tự bất kỳ, dài bao nhiêu cũng được, kể cả không có ký tự nào; `_` thay cho **đúng một** ký tự. Ví dụ `short_name LIKE 'NGO%'` là \"bắt đầu bằng NGO\", cho 4 khách: NGO ANH TUAN, NGO NGOC ANH, NGO KHANH LINH, NGO DIEU HA. `'%thanh toan%'` là \"chứa thanh toan ở bất kỳ đâu\".",
            "Ví dụ `_`: mẫu `'NGO _N%'` đọc từng ký tự là N, G, O, **dấu cách**, `_` (một chữ bất kỳ), N, rồi `%` (gì cũng được). Chỉ NGO ANH TUAN khớp: sau \"NGO \" là chữ A (khớp `_`), rồi chữ N. NGO NGOC ANH thì sau \"NGO \" là N, G: ký tự thứ sáu là G chứ không phải N, nên không khớp.",
          ],
          predict: {
            question: "Cột `short_name` lưu tên viết hoa (NGO ANH TUAN...). `short_name LIKE 'ngo%'` trả bao nhiêu dòng?",
            options: [
              "4 dòng, như `LIKE 'NGO%'`",
              "0 dòng, vì LIKE phân biệt hoa thường",
              "Báo lỗi vì mẫu viết chữ thường",
              "Mọi khách, vì `%` khớp tất cả",
            ],
            answer: 1,
            explain: "Trong PostgreSQL, LIKE phân biệt hoa thường nên `'ngo%'` không khớp tên viết hoa nào. `ILIKE 'ngo%'` thì cho lại 4 khách.",
          },
          after: [
            "Trong PostgreSQL, **LIKE phân biệt hoa thường**. Cột `short_name` lưu tên viết hoa, nên `short_name LIKE 'ngo%'` cho 0 dòng. **ILIKE** là bản không phân biệt hoa thường: `short_name ILIKE 'ngo%'` cho lại 4 khách. ILIKE chỉ có ở PostgreSQL, không phải mọi hệ quản trị đều có.",
          ],
          sql: [
        {
          prompt: "Tìm khách có `short_name` bắt đầu bằng NGO, không phân biệt hoa thường (gõ chữ thường cũng ra). Dùng toán tử chỉ PostgreSQL có. Cột: `customer_id`, `short_name`. Kết quả có 4 dòng.",
          starter: "SELECT customer_id, short_name\nFROM customer\nWHERE short_name ____ 'ngo%';",
          solution: "SELECT customer_id, short_name FROM customer WHERE short_name ILIKE 'ngo%'",
          hint: "Biến thể của LIKE có thêm một chữ I ở đầu.",
        },
        {
          prompt: "Tìm các lệnh chuyển khoản có `narrative` chứa cụm \"thanh toan\" ở bất kỳ vị trí nào (nội dung lưu không dấu, như `Thanh toan hoc phi`), không phân biệt hoa thường. Cột: `ft_id`, `narrative`. Kết quả có 24 dòng.",
          starter: "SELECT ft_id, narrative\nFROM funds_transfer\nWHERE narrative ILIKE ;",
          solution: "SELECT ft_id, narrative FROM funds_transfer WHERE narrative ILIKE '%thanh toan%'",
          hint: "Đặt % ở cả đầu lẫn cuối mẫu. Thử đổi ILIKE thành LIKE để thấy kết quả về 0 dòng.",
        },
          ],
        },
      ],
    },
    {
      id: "is-null",
      trap: {
        title: "`<> 'M'` làm rơi mất các dòng NULL",
        text: "Bảng có 16 nam, 16 nữ và 8 khách doanh nghiệp có `gender` NULL. `WHERE gender <> 'M'` chỉ ra 16 dòng vì với NULL phép so sánh cho UNKNOWN. Muốn \"mọi khách không phải nam\" phải thêm `OR gender IS NULL`, ra 24 dòng.",
      },
      title: "Phần 4: IS NULL và bẫy so sánh với NULL",
      scene: "is-null",
      board: {
        title: "NULL làm rơi dòng một cách im lặng",
        highlight: "rơi dòng một cách im lặng",
        chips: ["NULL là chưa biết", "So sánh với NULL cho UNKNOWN"],
        cards: [
          {
            title: "Không phải nam",
            diagram: {
              kind: "flow",
              steps: ["40 khách: 16 nam, 16 nữ", "8 khách `gender` NULL", "WHERE gender <> 'M'"],
              ok: ["Thêm OR gender IS NULL", "24 dòng"],
              bad: ["Chỉ <> 'M'", "16 dòng"],
            },
            notes: ["Với NULL phép so sánh cho UNKNOWN, mà `WHERE` chỉ giữ dòng TRUE, nên 8 khách doanh nghiệp bị loại."],
            code: `SELECT * FROM customer
      WHERE gender <> 'M' OR gender IS NULL;`,
            takeaway: "Muốn lấy cả NULL phải nói rõ bằng IS NULL",
          },
          {
            title: "= NULL và IS NULL",
            diagram: {
              kind: "flow",
              steps: ["Cột `mobile` có NULL", "Lọc các dòng NULL"],
              ok: ["mobile IS NULL", "6 khách"],
              bad: ["mobile = NULL", "0 dòng"],
            },
            notes: ["Trên `stmt_entry`, `ft_id IS NULL` cho 686 bút toán còn `ft_id = NULL` cho 0 dòng."],
            takeaway: "Dùng IS NULL, không bao giờ dùng = NULL",
          },
        ],
        conclusion: "**Kết luận:** lỗi với NULL không báo gì cả, nên hãy tự hỏi cột đó có NULL không.",
      },
      intro: [
        "Nhắc lại: **NULL** là \"chưa biết\". Mọi phép so sánh với một giá trị chưa biết cho kết quả thứ ba là **UNKNOWN** (không biết), không đúng cũng không sai. Mà WHERE chỉ giữ dòng có kết quả **TRUE**. Vì vậy `mobile = NULL` không bao giờ giữ dòng nào: trên bảng `customer` nó trả 0 dòng, và trên `stmt_entry`, `ft_id = NULL` cũng 0 dòng dù thực tế có 686 bút toán không thuộc lệnh chuyển khoản nào.",
        "Cách đúng là **IS NULL** (đang là NULL) và **IS NOT NULL** (đã có giá trị). `mobile IS NULL` cho 6 khách, `ft_id IS NULL` cho 686 bút toán. Đây là một trong các lỗi phổ biến nhất khi mới học SQL, và nó nguy hiểm vì không có thông báo lỗi nào.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["So sánh với NULL → UNKNOWN → WHERE bỏ dòng, không báo lỗi. Tìm NULL bằng `IS NULL` / `IS NOT NULL`."],
      },
      sql: [
        {
          prompt: "Tìm các khách chưa có số điện thoại. Cột: `customer_id`, `short_name`, `mobile`. Kết quả có 6 dòng. Thử thay `IS NULL` bằng `= NULL` để thấy kết quả ra 0 dòng.",
          starter: "SELECT customer_id, short_name, mobile\nFROM customer\nWHERE mobile ____;",
          solution: "SELECT customer_id, short_name, mobile FROM customer WHERE mobile IS NULL",
          hint: "Hai từ khoá, viết liền nhau, không có dấu bằng.",
        },
        {
          prompt: "Tìm khách có số điện thoại nhưng chưa có email. Cột: `customer_id`, `mobile`, `email`. Kết quả có 7 dòng.",
          starter: "SELECT customer_id, mobile, email\nFROM customer\nWHERE ;",
          solution: "SELECT customer_id, mobile, email FROM customer WHERE mobile IS NOT NULL AND email IS NULL",
          hint: "Một điều kiện IS NOT NULL nối bằng AND với một điều kiện IS NULL.",
        },
        {
          prompt: "Lấy mọi khách có giới tính không phải nam, kể cả khách chưa có giới tính (NULL). Cột: `customer_id`, `short_name`, `gender`. Kết quả có 24 dòng.",
          starter: "SELECT customer_id, short_name, gender\nFROM customer\nWHERE gender <> 'M' ____ gender IS NULL;",
          solution: "SELECT customer_id, short_name, gender FROM customer WHERE gender <> 'M' OR gender IS NULL",
          hint: "Cần dòng thoả một trong hai điều kiện.",
        },
      ],
      quiz: {
        question: "Bảng `customer` có 40 khách: 16 nam, 16 nữ, 8 chưa có giới tính (NULL). `WHERE gender <> 'M'` trả về bao nhiêu dòng?",
        options: ["24 dòng", "16 dòng", "32 dòng", "40 dòng"],
        answer: 1,
        explain: "Chỉ 16 khách nữ có kết quả TRUE cho `gender <> 'M'`. 8 dòng NULL cho UNKNOWN và bị loại, nên không phải 24 hay 40. 32 sẽ là tổng nam và nữ, không liên quan đến phép lọc này. Muốn ra 24 phải thêm `OR gender IS NULL`.",
      },
    },
    {
      id: "order-by",
      trap: {
        title: "DESC đẩy NULL lên đầu",
        text: "PostgreSQL coi NULL là lớn nhất, nên `ORDER BY birth_date DESC LIMIT 5` để tìm 5 khách trẻ nhất lại trả về 5 công ty có `birth_date` NULL. Thêm `NULLS LAST` để NULL xuống cuối.",
      },
      title: "Phần 5: ORDER BY, thứ tự và NULL",
      scene: "order-by",
      intro: [
        "WHERE quyết định **dòng nào** được giữ. Còn chúng hiện ra theo **thứ tự nào** thì do ORDER BY.",
        "Mặc định SQL **không hứa** thứ tự các dòng trả về. Muốn có thứ tự phải viết **ORDER BY** ở cuối câu (trước LIMIT). `ASC` là tăng dần (mặc định), `DESC` là giảm dần. Có thể xếp theo nhiều cột: `ORDER BY city, birth_date DESC` xếp theo thành phố, trong cùng thành phố thì ngày sinh mới nhất lên trước. Mỗi cột có chiều `ASC`/`DESC` riêng.",
        "NULL nằm ở đâu? PostgreSQL coi NULL là **lớn nhất**: khi `ASC` thì NULL đứng cuối, khi `DESC` thì NULL đứng đầu. Dùng `NULLS FIRST` hoặc `NULLS LAST` để chọn chỗ đặt.",
      ],
      sql: [
        {
          prompt: "Xếp mọi khách hàng theo `city` tăng dần, trong mỗi thành phố khách sinh sau (`birth_date` mới hơn) lên trước. Cột: `customer_id`, `city`, `birth_date`. Hãy để ý các dòng NULL của `birth_date` nằm ở đầu nhóm của thành phố có khách doanh nghiệp, như Cần Thơ.",
          starter: "SELECT customer_id, city, birth_date\nFROM customer\nORDER BY city, birth_date ____;",
          solution: "SELECT customer_id, city, birth_date FROM customer ORDER BY city, birth_date DESC",
          ordered: true,
          hint: "Chiều giảm dần của cột thứ hai.",
        },
        {
          prompt: "Tìm 5 khách trẻ nhất (ngày sinh mới nhất), bỏ qua khách không có ngày sinh bằng cách đẩy NULL xuống cuối. Cột: `customer_id`, `short_name`, `birth_date`.",
          starter: "SELECT customer_id, short_name, birth_date\nFROM customer\nORDER BY birth_date DESC ____\nLIMIT 5;",
          solution: "SELECT customer_id, short_name, birth_date FROM customer ORDER BY birth_date DESC NULLS LAST LIMIT 5",
          ordered: true,
          hint: "NULLS đi kèm FIRST hoặc LAST.",
        },
        {
          prompt: "Tìm 3 tài khoản âm nhiều nhất (số dư nhỏ nhất, chỉ xét `working_balance < 0`). Cột: `account_id`, `working_balance`.",
          starter: "SELECT account_id, working_balance\nFROM account\nWHERE working_balance < 0\nORDER BY ;",
          solution: "SELECT account_id, working_balance FROM account WHERE working_balance < 0 ORDER BY working_balance ASC LIMIT 3",
          ordered: true,
          hint: "Số âm càng lớn về độ lớn thì càng nhỏ, nên xếp tăng dần rồi lấy 3 dòng đầu.",
        },
      ],
      quiz: {
        question: "`SELECT ... FROM customer ORDER BY birth_date DESC LIMIT 5` trả về gì?",
        options: [
          "5 khách có ngày sinh gần hiện tại nhất",
          "5 khách có ngày sinh xa nhất",
          "5 dòng có birth_date NULL, vì khi DESC thì NULL đứng đầu",
          "5 dòng ngẫu nhiên, vì LIMIT bỏ qua ORDER BY",
        ],
        answer: 2,
        explain: "Có 8 khách doanh nghiệp NULL ngày sinh, và PostgreSQL xếp NULL lên đầu khi giảm dần, nên cả 5 dòng đều là công ty. Muốn 5 khách trẻ nhất phải thêm NULLS LAST. LIMIT chạy sau ORDER BY chứ không bỏ qua nó.",
      },
    },
    {
      id: "limit-offset",
      trap: {
        title: "Phân trang với ORDER BY không duy nhất sẽ lặp và mất dòng",
        text: "Mười khách Cần Thơ hoà nhau về `city`, nên `ORDER BY city LIMIT 5` ra 100016, 100017, 100007, 100009, 100022, còn `OFFSET 5` ra 100007, 100017, 100009, 100016, 100037: bốn khách xuất hiện ở cả hai trang. Hãy thêm khoá chính làm cột sắp xếp cuối, ví dụ `ORDER BY city, customer_id`.",
      },
      title: "Phần 6: LIMIT, OFFSET và chia trang",
      scene: "limit-offset",
      intro: [
        "Đã có thứ tự, giờ cắt kết quả thành từng trang như màn hình danh sách khách hàng.",
        "**LIMIT n** chỉ lấy n dòng đầu, **OFFSET m** bỏ qua m dòng đầu rồi mới lấy. Ghép lại thành **phân trang**: trang p với kích thước n dòng dùng `LIMIT n OFFSET (p - 1) * n`. Trang 2, mỗi trang 5 khách, là `ORDER BY customer_id LIMIT 5 OFFSET 5` và cho mã 100006 đến 100010.",
        "Cùng lý do với phân trang (xem khung bẫy), \"top N\" cũng nên thêm cột phá hoà. Ba khoản vay lớn nhất là hai khoản 800 triệu (`LD2400003`, `LD2400011`, cả hai chắc chắn lọt top 3) rồi tới hai khoản 400 triệu `LD2400012` và `LD2400014` **giành nhau vị trí thứ ba**. Vì hai khoản này hoà nhau, `ORDER BY principal DESC LIMIT 3` có thể trả khoản này lần này, khoản kia lần sau. Thêm `ld_id` làm cột phá hoà thì vị trí thứ ba luôn là `LD2400012`.",
        "Ghi chú thêm: `OFFSET` lớn càng chậm vì database vẫn phải đi qua và bỏ các dòng đầu; với bảng rất lớn người ta dùng kỹ thuật khác (lọc theo mã của dòng cuối trang trước), nằm ngoài bài này.",
      ],
      sql: [
        {
          prompt: "Lấy trang 2 của danh sách khách, mỗi trang 5 dòng, sắp theo `customer_id`. Cột: `customer_id`, `short_name`. Kết quả là 100006 đến 100010.",
          starter: "SELECT customer_id, short_name\nFROM customer\nORDER BY customer_id\nLIMIT 5 OFFSET ____;",
          solution: "SELECT customer_id, short_name FROM customer ORDER BY customer_id LIMIT 5 OFFSET 5",
          ordered: true,
          hint: "Trang 2 phải bỏ qua đúng số dòng của trang 1.",
        },
        {
          prompt: "Lấy trang 3 (mỗi trang 10 khách) khi xếp theo `city`, có cột phá hoà để trang không bị lặp. Cột: `customer_id`, `city`. Bạn sẽ thấy mã 100011, 100018, 100020...",
          starter: "SELECT customer_id, city\nFROM customer\nORDER BY city\nLIMIT 10 OFFSET 20;",
          solution: "SELECT customer_id, city FROM customer ORDER BY city, customer_id LIMIT 10 OFFSET 20",
          ordered: true,
          hint: "Thêm khoá chính làm cột sắp xếp thứ hai.",
        },
        {
          prompt: "Lấy 3 khoản vay có `principal` lớn nhất, và khi hoà thì xếp theo `ld_id` tăng dần để kết quả luôn như nhau. Cột: `ld_id`, `principal`.",
          starter: "SELECT ld_id, principal\nFROM loan\nORDER BY ;",
          solution: "SELECT ld_id, principal FROM loan ORDER BY principal DESC, ld_id LIMIT 3",
          ordered: true,
          hint: "Hai cột sắp xếp: số tiền giảm dần, rồi mã khoản vay. Đừng quên LIMIT 3.",
        },
      ],
      quiz: {
        question: "Vì sao khi phân trang theo `city` nên viết `ORDER BY city, customer_id` thay vì chỉ `ORDER BY city`?",
        options: [
          "Để câu lệnh chạy nhanh hơn nhờ dùng thêm một cột",
          "Vì OFFSET bắt buộc ORDER BY phải có hai cột",
          "Để thứ tự của các khách cùng thành phố luôn xác định, nên các trang không lặp hay mất dòng",
          "Để NULL luôn nằm ở cuối kết quả",
        ],
        answer: 2,
        explain: "Nhiều khách cùng thành phố hoà nhau, và SQL không đảm bảo thứ tự giữa các dòng hoà. Thêm khoá chính biến thứ tự thành duy nhất. Nó không nhằm tăng tốc, OFFSET không đòi hai cột, và vị trí của NULL do NULLS FIRST/LAST quyết định chứ không phải cột phụ.",
      },
    },
  ],
  cards: [
    { q: "`WHERE` làm gì với từng dòng?", a: "Giữ dòng có điều kiện TRUE, bỏ dòng FALSE hoặc UNKNOWN." },
    { q: "`AND` và `OR` cái nào tính trước, và cách tránh sai?", a: "`AND` tính trước `OR`. Luôn đặt ngoặc khi trộn hai loại trong cùng một WHERE." },
    { q: "`BETWEEN 1 AND 5` có gồm 1 và 5 không?", a: "Có, gồm cả hai đầu mút, và phải viết nhỏ trước lớn sau. Viết ngược cho 0 dòng mà không báo lỗi." },
    { q: "Vì sao `col = NULL` không bao giờ trả dòng nào?", a: "So sánh với NULL cho UNKNOWN và WHERE chỉ giữ TRUE. Phải dùng `IS NULL` hoặc `IS NOT NULL`." },
    { q: "NULL đứng đầu hay cuối khi `ORDER BY ... DESC`?", a: "Đứng đầu, vì PostgreSQL coi NULL là lớn nhất. Dùng `NULLS LAST` để đổi." },
    { q: "Vì sao phân trang cần cột phá hoà trong ORDER BY?", a: "Khi nhiều dòng hoà nhau, thứ tự không cố định nên hai trang có thể lặp hoặc mất dòng. Thêm khoá chính làm cột cuối." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "WHERE giữ lại những dòng có điều kiện cho kết quả đúng. AND tính trước OR, nên trộn hai phép này phải đặt ngoặc. IN kiểm tra thuộc danh sách, BETWEEN lấy cả hai đầu mút, LIKE phân biệt hoa thường trong PostgreSQL còn ILIKE thì không. So sánh với NULL luôn cho UNKNOWN, nên dùng IS NULL và IS NOT NULL, và nhớ rằng `<>` cũng làm rơi các dòng NULL. ORDER BY xếp theo nhiều cột, NULL được coi là lớn nhất nên nằm cuối khi ASC và đầu khi DESC, chỉnh bằng NULLS FIRST/LAST. LIMIT/OFFSET dùng để chia trang, và luôn cần ORDER BY có cột phá hoà như khoá chính để các trang không lặp dòng.",
};
