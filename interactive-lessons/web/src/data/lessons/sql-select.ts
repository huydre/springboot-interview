import timeline from "../timelines/sql-select.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 3. Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlSelect: Lesson = {
  slug: "sql-select",
  crumb: "SELECT cơ bản",
  videoDir: "/videos/sql-select",
  videoVersion: "3a1d87ad",
  scenes: timeline as Scene[],
  title: "SELECT, FROM, DISTINCT và Alias",
  subtitle:
    "Chọn đúng cột cần xem, đặt tên gọn cho cột kết quả, tính toán ngay trong câu lệnh, loại dòng trùng và hiểu vì sao database chạy FROM trước SELECT.",
  openingQuiz: {
    question: "Với câu `SELECT full_name FROM customer`, database thật sự làm việc gì trước?",
    options: [
      "Tìm cột full_name trước, sau đó mới tìm xem nó nằm ở bảng nào",
      "Mở bảng customer trước, sau đó mới lấy cột full_name từ bảng đó",
      "Làm hai việc cùng lúc, thứ tự không có ý nghĩa gì",
      "Sắp xếp tên khách hàng theo bảng chữ cái rồi mới chọn bảng",
    ],
    answer: 1,
    explain: "Dù SELECT được viết trước, database phải biết lấy dữ liệu từ bảng nào (FROM) rồi mới chọn được cột. Bài này sẽ cho bạn thấy thứ tự thật sự và vì sao nó quan trọng.",
  },
  roadmap: [
    "Chặng 1: SELECT và FROM, chọn cột, thứ tự chạy thật của câu lệnh, và đặt alias cho cột.",
    "Chặng 2: biểu thức số học trong SELECT để tính toán trên từng dòng.",
    "Chặng 3: DISTINCT để loại dòng trùng, LIMIT để giới hạn số dòng, chú thích trong SQL.",
  ],
  sections: [
    {
      id: "select-from",
      trap: {
        title: "Dấu phẩy thừa trước FROM là lỗi cú pháp",
        text: "`SELECT customer_id, FROM customer` báo `syntax error at or near \"FROM\"`. Quy tắc: giữa các cột có dấu phẩy, sau cột cuối thì không. Đọc kỹ thông báo lỗi, nó chỉ đúng chỗ sai.",
      },
      title: "Phần 1: SELECT và FROM, chọn cột cần xem",
      scene: "select-from",
      intro: [
        "Một câu truy vấn đơn giản có hai phần. `FROM` nói **lấy từ bảng nào**. `SELECT` nói **muốn xem những cột nào**. Giống như bạn mở một sổ khách hàng (FROM), rồi chỉ chép ra cột họ tên và thành phố (SELECT). Các cột cách nhau bằng dấu phẩy, và kết quả hiện ra **đúng thứ tự bạn viết**, không phải thứ tự trong bảng.",
        "Dấu `*` nghĩa là \"mọi cột\", tiện khi mới làm quen. Nhưng trong công việc thật nên liệt kê cột cần dùng: kết quả gọn hơn, nhanh hơn, và không vỡ khi ai đó thêm cột mới vào bảng. Từ khoá SQL không phân biệt hoa thường (`select` hay `SELECT` đều được), cuối câu có thể có dấu `;`.",
        "Gõ sai tên cột thì database báo \"column does not exist\".",
      ],
      sql: [
        {
          prompt: "Điền tên cột còn thiếu để xem mã khách, họ tên đầy đủ và thành phố của 5 khách đầu tiên. Cột họ tên đầy đủ là `full_name`.",
          starter: "SELECT customer_id, ____, city\nFROM customer\nORDER BY customer_id\nLIMIT 5;",
          solution: "SELECT customer_id, full_name, city FROM customer ORDER BY customer_id LIMIT 5",
          hint: "Thay dấu gạch dưới bằng đúng tên cột, không có dấu nháy.",
          ordered: true,
        },
        {
          prompt: "Xem mã tài khoản, mã khách hàng và số dư (`working_balance`) của 3 tài khoản đầu tiên, sắp theo `account_id`.",
          starter: "SELECT\nFROM account\nORDER BY account_id\nLIMIT 3;",
          solution: "SELECT account_id, customer_id, working_balance FROM account ORDER BY account_id LIMIT 3",
          hint: "Liệt kê ba cột sau SELECT, cách nhau bằng dấu phẩy.",
          ordered: true,
        },
        {
          prompt: "Kết quả hiện cột theo thứ tự bạn viết. Xem 3 khoản vay đầu (sắp theo `ld_id`) nhưng đặt cột `status` đầu tiên, rồi `ld_id`, rồi `principal` (số tiền vay).",
          starter: "SELECT\nFROM loan\nORDER BY ld_id\nLIMIT 3;",
          solution: "SELECT status, ld_id, principal FROM loan ORDER BY ld_id LIMIT 3",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao trong công việc thật nên liệt kê cột cần dùng thay vì viết `SELECT *`?",
        options: [
          "Vì SQL bắt buộc phải liệt kê cột, `*` luôn báo lỗi",
          "Vì kết quả chỉ gồm cột cần thiết, gọn hơn, và không đổi hình dạng khi bảng được thêm cột mới",
          "Vì liệt kê cột giúp database tự sắp xếp các dòng theo thứ tự",
          "Vì `*` chỉ lấy được cột đầu tiên của bảng",
        ],
        answer: 1,
        explain: "`*` vẫn chạy và lấy mọi cột. Nhưng nó kéo cả những cột bạn không cần, và nếu bảng được thêm cột thì kết quả cũng đổi theo. Liệt kê cột thì không liên quan gì tới thứ tự dòng.",
      },
    },
    {
      id: "execution-order",
      trap: {
        title: "Có DISTINCT thì ORDER BY chỉ sắp được theo cột đã chọn",
        text: "`SELECT DISTINCT city FROM customer ORDER BY customer_id` báo `for SELECT DISTINCT, ORDER BY expressions must appear in select list`. Sau DISTINCT, một dòng \"Hà Nội\" đại diện cho 9 khách với 9 `customer_id` khác nhau, nên database không biết lấy mã nào để sắp. Hãy sắp theo cột có trong SELECT, ví dụ `ORDER BY city`.",
      },
      title: "Phần 2: Thứ tự chạy thật của câu lệnh",
      scene: "execution-order",
      intro: [
        "Bạn **viết** `SELECT` trước `FROM`, nhưng database **chạy** theo thứ tự khác. Hình dung bạn nhờ thủ kho: \"lấy cho tôi họ tên và thành phố\". Thủ kho phải biết kho nào (`FROM`) rồi mới chọn được thứ cần lấy (`SELECT`). Thứ tự logic là: `FROM` (lấy bảng), rồi `SELECT` (chọn cột), rồi `DISTINCT` (bỏ dòng trùng), rồi `ORDER BY` (sắp xếp), cuối cùng `LIMIT` (cắt lấy số dòng đầu). Các bước `WHERE`, `GROUP BY`, `HAVING` ở các bài sau sẽ chen vào trước `SELECT`.",
        "Xem widget bên dưới: bấm \"bước tiếp\" để thấy bảng thay đổi sau mỗi bước, và đổi sang các câu khác để so sánh.",
      ],
      predict: {
        question: "Câu `SELECT DISTINCT city FROM customer LIMIT 3` trả về gì?",
        options: [
          "3 dòng đầu của bảng, có thể trùng thành phố",
          "3 thành phố khác nhau",
          "Báo lỗi vì DISTINCT không đi cùng LIMIT",
          "Cả 5 thành phố, LIMIT bị bỏ qua",
        ],
        answer: 1,
        explain: "`LIMIT` chạy **sau cùng**, sau khi `DISTINCT` đã bỏ trùng, nên nó cắt 3 dòng trên danh sách thành phố khác nhau.",
      },
      widget: "sql-select-order",
      widgetTitle: "Từng bước xử lý: FROM, SELECT, DISTINCT, LIMIT",
      after: [
        "Chú ý `DISTINCT` chạy **sau** `SELECT`, nên nó chỉ nhìn vào những cột bạn đã chọn. Và `LIMIT` chạy **sau cùng**, nên nó cắt trên kết quả đã bỏ trùng.",
        "Hệ quả thực tế: `ORDER BY` chạy sau `SELECT`, nên nó dùng được **alias**, tức tên tạm bạn đặt cho cột kết quả bằng `AS` (ví dụ `working_balance AS so_du`; phần 3 học kỹ). Ngoài ra `ORDER BY` vẫn sắp theo được cột không có trong `SELECT`, vì với câu không có `DISTINCT`, mỗi dòng kết quả vẫn ứng với đúng một dòng của bảng gốc nên database còn biết giá trị của cột đó. **Trừ khi có `DISTINCT`**: lúc đó một dòng kết quả có thể đại diện cho nhiều dòng gốc (xem khung bẫy). Trong bài tập dưới có `DESC`: nghĩa là sắp giảm dần (lớn trước), sẽ học kỹ ở bài sau.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["`FROM` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`. Bước nào chạy sau `SELECT` thì mới thấy alias."],
      },
      sql: [
        {
          prompt: "Alias đặt ở `SELECT` dùng được trong `ORDER BY` vì `ORDER BY` chạy sau. Điền alias `so_du` vào `ORDER BY` để xem 4 tài khoản có số dư lớn nhất.",
          starter: "SELECT account_id, working_balance AS so_du\nFROM account\nORDER BY ____ DESC\nLIMIT 4;",
          solution: "SELECT account_id, working_balance AS so_du FROM account ORDER BY so_du DESC LIMIT 4",
          hint: "Viết đúng tên alias đã đặt sau chữ AS.",
          ordered: true,
        },
        {
          prompt: "Chỉ hiển thị cột `full_name` của 4 khách đầu tiên, nhưng sắp theo `customer_id` (cột này không nằm trong SELECT).",
          starter: "SELECT\nFROM customer\nORDER BY customer_id\nLIMIT 4;",
          solution: "SELECT full_name FROM customer ORDER BY customer_id LIMIT 4",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao alias đặt ở `SELECT` dùng được trong `ORDER BY`?",
        options: [
          "Vì `ORDER BY` chạy sau `SELECT`, lúc đó alias đã tồn tại",
          "Vì SQL tự sao chép alias sang mọi mệnh đề khác của câu lệnh",
          "Vì `ORDER BY` luôn chạy trước `FROM` để chuẩn bị sẵn tên cột",
          "Vì alias là tên thật của cột trong bảng gốc nên ở đâu cũng dùng được",
        ],
        answer: 0,
        explain: "Alias chỉ sinh ra ở bước SELECT. Những bước chạy sau (DISTINCT, ORDER BY, LIMIT) thấy nó, những bước chạy trước (FROM, WHERE) thì chưa. Alias không phải tên cột thật và không đổi bảng gốc.",
      },
    },
    {
      id: "alias",
      trap: {
        title: "Quên dấu phẩy mà vẫn chạy, ra sai cột",
        text: "`SELECT customer_id full_name FROM customer` không báo lỗi. Nó ra một cột tên `full_name` chứa các số 100001, 100002, 100003, vì `AS` có thể bỏ. Luôn viết `AS` để lỗi này lộ ra ngay.",
      },
      title: "Phần 3: Alias, đặt tên cho cột kết quả",
      scene: "alias",
      intro: [
        "Phần 2 đã dùng thử alias `so_du` trong `ORDER BY`. Giờ học kỹ cách đặt alias và các bẫy của nó.",
        "**Alias** là tên tạm bạn đặt cho một cột của **kết quả**, bằng `AS`. Ví dụ `full_name AS ho_ten`: cột trong kết quả tên là `ho_ten`, còn bảng `customer` vẫn giữ nguyên cột `full_name`. Alias làm kết quả dễ đọc, và rất cần khi cột là một phép tính (phần sau) vì phép tính không có tên sẵn.",
        "Alias có khoảng trắng, chữ hoa hoặc tiếng Việt có dấu thì phải bọc trong **dấu nháy kép**: `ld_id AS \"Mã khoản vay\"`. Ghi nhớ: nháy **đơn** `'...'` là một giá trị chuỗi, nháy **kép** `\"...\"` là một cái tên. Bảng cũng có alias: `FROM customer AS c` rồi dùng `c.full_name`. Cách này dùng nhiều ở bài JOIN, tạm thời bạn chỉ cần biết nó tồn tại.",
        "PostgreSQL cho phép bỏ chữ `AS` (xem khung bẫy bên dưới).",
      ],
      sql: [
        {
          prompt: "Đặt alias `ho_ten` cho `full_name` và `thanh_pho` cho `city`, xem 4 khách đầu. Điền chữ `AS` vào chỗ trống.",
          starter: "SELECT full_name ____ ho_ten, city ____ thanh_pho\nFROM customer\nORDER BY customer_id\nLIMIT 4;",
          solution: "SELECT full_name AS ho_ten, city AS thanh_pho FROM customer ORDER BY customer_id LIMIT 4",
          ordered: true,
        },
        {
          prompt: "Đặt alias có dấu cách: `ld_id` thành \"Mã khoản vay\" và `principal` thành \"Số tiền vay\" (nhớ nháy kép), xem 4 khoản vay đầu sắp theo `ld_id`.",
          starter: "SELECT ld_id AS ____, principal AS ____\nFROM loan\nORDER BY ld_id\nLIMIT 4;",
          solution: "SELECT ld_id AS \"Mã khoản vay\", principal AS \"Số tiền vay\" FROM loan ORDER BY ld_id LIMIT 4",
          hint: "Viết alias dạng \"Mã khoản vay\", có nháy kép ở hai đầu.",
          ordered: true,
        },
        {
          prompt: "Câu này chạy được nhưng chỉ ra **một** cột tên `full_name` chứa các mã số, vì quên dấu phẩy. Sửa lại để ra hai cột `customer_id` và `full_name`.",
          starter: "SELECT customer_id full_name\nFROM customer\nORDER BY customer_id\nLIMIT 3;",
          solution: "SELECT customer_id, full_name FROM customer ORDER BY customer_id LIMIT 3",
          hint: "Thiếu đúng một ký tự giữa hai tên cột.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Câu `SELECT customer_id full_name FROM customer` (quên dấu phẩy) trả về gì trong PostgreSQL?",
        options: [
          "Báo lỗi cú pháp vì thiếu dấu phẩy giữa hai cột",
          "Một cột tên `full_name` nhưng chứa giá trị của `customer_id`",
          "Hai cột `customer_id` và `full_name` như thường",
          "Một cột `customer_id` có kèm họ tên viết liền phía sau",
        ],
        answer: 1,
        explain: "Vì `AS` có thể bỏ, `customer_id full_name` được hiểu là cột customer_id với alias full_name. Ba dòng đầu của kết quả là 100001, 100002, 100003 chứ không phải họ tên.",
      },
    },
    {
      id: "arithmetic",
      trap: {
        title: "Chia hai số nguyên là chia nguyên",
        text: "`7 / 2` ra `3`, không phải `3.5`, và database không báo lỗi gì. Muốn kết quả thập phân thì một trong hai số phải thập phân: `7 / 2.0`. Với cột số nguyên, đổi kiểu bằng `::numeric` (xem phần giới thiệu).",
      },
      title: "Phần 4: Biểu thức số học trong SELECT",
      scene: "arithmetic",
      intro: [
        "`SELECT` không chỉ lấy cột có sẵn mà còn **tính toán** trên từng dòng. Các phép tính: `+`, `-`, `*`, `/` và `%` (chia lấy dư), có dấu ngoặc `( )` như toán thường: nhân chia trước, cộng trừ sau. Mỗi dòng của bảng cho ra một kết quả riêng. Ví dụ lãi một năm của khoản vay là `principal * interest_rate / 100` (`interest_rate` tính theo phần trăm). Với khoản `LD2400001` (vay 30000000, lãi 12) ra 3600000, với `LD2400002` (vay 200000000, lãi 9) ra 18000000.",
        "Cột tính ra không có tên sẵn, nên hãy đặt alias: `principal * interest_rate / 100 AS lai_nam`. Bạn còn có thể viết `SELECT 2 + 3 AS ket_qua` không cần `FROM`, hợp để thử nhanh một phép tính.",
        "Khi cả hai số là số nguyên, `/` là **chia nguyên** và bỏ phần lẻ: `7 / 2` ra `3` (xem khung bẫy). Muốn ra số thập phân, một trong hai số phải là số thập phân: viết `7 / 2.0`, hoặc đổi kiểu bằng `::numeric`. Ký hiệu `giá_trị::kiểu` là cách PostgreSQL đổi kiểu dữ liệu (bài 7 học kỹ): `7::numeric / 2` ra `3.5000000000000000`.",
        "Bẫy khác: **NULL trong phép tính thì cả kết quả là NULL** (`NULL + 1` ra NULL), vì NULL là \"chưa biết\" nên không thể cộng ra số cụ thể. Số tiền kiểu `numeric` tính chính xác (`0.1 + 0.2` ra đúng `0.3`) nên dùng được cho tiền.",
      ],
      sql: [
        {
          prompt: "Xem tận mắt bẫy chia số nguyên. Thay chỗ trống để phép thứ hai ra 3.5 (gợi ý: một trong hai số phải có phần thập phân).",
          starter: "SELECT 7 / 2 AS chia_nguyen, 7 / ____ AS chia_thuc;",
          solution: "SELECT 7 / 2 AS chia_nguyen, 7 / 2.0 AS chia_thuc",
          hint: "Viết 2.0 thay vì 2.",
        },
        {
          prompt: "NULL trong phép tính: chạy `SELECT NULL + 1 AS ket_qua` và xem kết quả là NULL chứ không phải 1. Điền phép cộng vào chỗ trống.",
          starter: "SELECT ____ AS ket_qua;",
          solution: "SELECT NULL + 1 AS ket_qua",
          hint: "Viết NULL + 1.",
        },
        {
          prompt: "Tính lãi một năm cho 4 khoản vay đầu (sắp theo `ld_id`): `principal * interest_rate / 100`. Điền số còn thiếu.",
          starter: "SELECT ld_id, principal, interest_rate,\n       principal * interest_rate / ____ AS lai_nam\nFROM loan\nORDER BY ld_id\nLIMIT 4;",
          solution: "SELECT ld_id, principal, interest_rate, principal * interest_rate / 100 AS lai_nam FROM loan ORDER BY ld_id LIMIT 4",
          ordered: true,
        },
        {
          prompt: "Đổi số dư sang đơn vị nghìn đồng: hiện `account_id`, số dư gốc đặt alias `so_du`, và số dư chia 1000 đặt alias `nghin_dong`, cho 3 tài khoản đầu (sắp theo `account_id`).",
          starter: "SELECT\nFROM account\nORDER BY account_id\nLIMIT 3;",
          solution: "SELECT account_id, working_balance AS so_du, working_balance / 1000 AS nghin_dong FROM account ORDER BY account_id LIMIT 3",
          ordered: true,
        },
      ],
      takeaway: {
        lines: [
          "Hai số nguyên chia nhau thì bỏ phần lẻ: cần số thập phân thì viết `2.0` hoặc đổi kiểu `::numeric`.",
          "Có NULL trong phép tính thì cả kết quả là NULL.",
        ],
      },
      quiz: {
        question: "Kết quả của `SELECT 7 / 2` trong PostgreSQL là gì?",
        options: ["3.5", "3", "4", "Báo lỗi vì 7 không chia hết cho 2"],
        answer: 1,
        explain: "Cả hai toán hạng là số nguyên nên phép chia cũng là chia nguyên, bỏ phần dư, ra 3. Muốn 3.5 thì một trong hai số phải là số thập phân, ví dụ `7 / 2.0`. PostgreSQL không báo lỗi khi chia không hết.",
      },
    },
    {
      id: "distinct",
      trap: {
        title: "DISTINCT không chữa được lỗi nhân dòng",
        text: "Dùng `DISTINCT` cho kết quả bị lặp mà chưa biết vì sao lặp chỉ che lỗi, thường là lỗi JOIN. Ngoài ra `DISTINCT` coi NULL bằng NULL: cột `gender` có 8 NULL nhưng `DISTINCT gender` chỉ ra một dòng NULL.",
      },
      title: "Phần 5: DISTINCT, loại dòng trùng",
      scene: "distinct",
      intro: [
        "Bảng `customer` có 40 khách nhưng chỉ ở vài thành phố. Chạy `SELECT city FROM customer` sẽ ra 40 dòng với thành phố lặp lại nhiều lần. Muốn biết **có những thành phố nào**, thêm `DISTINCT` ngay sau `SELECT`: `SELECT DISTINCT city FROM customer` ra 5 dòng là Cần Thơ, Hà Nội, Hải Phòng, TP. Hồ Chí Minh, Đà Nẵng. Tương tự `SELECT DISTINCT customer_status` ra 3 trạng thái: ACTIVE, CLOSED, DORMANT.",
        "`DISTINCT` xét **cả dòng**, tức mọi cột bạn chọn, không chỉ cột đầu. `SELECT DISTINCT city, customer_status FROM customer` ra 9 dòng, vì mỗi **cặp** (thành phố, trạng thái) khác nhau được tính một lần (ví dụ Hà Nội có cả ACTIVE lẫn DORMANT nên có hai dòng). Thêm cột vào `SELECT` thì số dòng thường tăng, không giảm.",
        "Điều cần nhớ: `DISTINCT` coi **NULL bằng NULL**: `SELECT DISTINCT gender FROM customer` ra 3 dòng là F, M và một dòng NULL (khách doanh nghiệp không có giới tính).",
      ],
      sql: [
        {
          prompt: "Xem danh sách các loại tiền đang có trong bảng `account` (mỗi loại một dòng). Điền `DISTINCT`, sắp theo `ccy`.",
          starter: "SELECT ____ ccy\nFROM account\nORDER BY ccy;",
          solution: "SELECT DISTINCT ccy FROM account ORDER BY ccy",
          hint: "DISTINCT đứng ngay sau SELECT.",
          ordered: true,
        },
        {
          prompt: "Liệt kê các tổ hợp (`ccy`, `category_id`) thật sự xuất hiện trong `account`, mỗi tổ hợp một dòng, sắp theo `ccy` rồi `category_id`.",
          starter: "SELECT\nFROM account\nORDER BY ccy, category_id;",
          solution: "SELECT DISTINCT ccy, category_id FROM account ORDER BY ccy, category_id",
          hint: "DISTINCT áp cho cả hai cột sau nó.",
          ordered: true,
        },
        {
          prompt: "Liệt kê các giá trị khác nhau của `gender` trong bảng `customer`, sắp theo `gender`. Bạn sẽ thấy cả một dòng NULL.",
          starter: "SELECT\nFROM customer\nORDER BY gender;",
          solution: "SELECT DISTINCT gender FROM customer ORDER BY gender",
          ordered: true,
        },
      ],
      quiz: {
        question: "`SELECT DISTINCT city, customer_status FROM customer` trả về 9 dòng, trong khi `SELECT DISTINCT city` chỉ có 5. Vì sao?",
        options: [
          "`DISTINCT` chỉ xét cột đầu tiên nên hai câu phải ra số dòng bằng nhau",
          "Câu thứ hai bị lỗi và trả về dữ liệu thừa",
          "`DISTINCT` xét cả cặp (city, customer_status), một thành phố có nhiều trạng thái thì ra nhiều dòng",
          "`DISTINCT` tự cộng thêm các thành phố bị thiếu vào kết quả",
        ],
        answer: 2,
        explain: "DISTINCT bỏ các dòng giống nhau hoàn toàn trên mọi cột được chọn. Hà Nội có cả ACTIVE và DORMANT nên cho hai dòng khác nhau. Thêm cột vào SELECT thì số dòng khác nhau thường tăng lên.",
      },
    },
    {
      id: "limit-comment",
      trap: {
        title: "LIMIT không có ORDER BY là lời hứa suông",
        text: "Không có `ORDER BY`, \"N dòng đầu\" là N dòng nào cũng được và hai lần chạy có thể khác nhau. Muốn top N ổn định, luôn sắp theo cột có giá trị khác nhau ở mỗi dòng.",
      },
      title: "Phần 6: LIMIT và chú thích trong SQL",
      scene: "limit-comment",
      intro: [
        "`LIMIT n` chỉ lấy `n` dòng đầu của kết quả, hữu ích khi bảng lớn và bạn chỉ muốn xem mẫu. Nó luôn là bước **cuối cùng** (nhớ thứ tự ở Phần 2), nên khi đi cùng `ORDER BY` bạn có \"top N\": sắp giảm dần rồi lấy N dòng đầu. Ví dụ ba tài khoản có số dư lớn nhất là `1000000062` (3052868789.00), `1000000059` (3042221015.00) và `1000000066` (1777312000.00).",
        "Hãy luôn kèm `ORDER BY` khi dùng `LIMIT` (xem khung bẫy).",
        "**Chú thích** (comment) là chữ để người đọc hiểu, database bỏ qua. `-- ...` chú thích từ đó tới hết dòng; `/* ... */` chú thích nhiều dòng. Chú thích hay dùng để ghi lý do của câu lệnh, hoặc **tắt tạm** một phần khi thử nghiệm: đặt `--` trước một dòng thì dòng đó không chạy.",
      ],
      sql: [
        {
          prompt: "Top 3 tài khoản có số dư lớn nhất: hiện `account_id` và `working_balance`, sắp giảm dần theo số dư (`DESC`), lấy 3 dòng đầu.",
          starter: "SELECT account_id, working_balance\nFROM account\nORDER BY working_balance ____\nLIMIT ____;",
          solution: "SELECT account_id, working_balance FROM account ORDER BY working_balance DESC LIMIT 3",
          hint: "DESC là giảm dần, LIMIT 3 là ba dòng.",
          ordered: true,
        },
        {
          prompt: "Dòng bắt đầu bằng `--` bị bỏ qua. Câu dưới thiếu cột `city` vì nó đang nằm trong chú thích. Bỏ dấu `--` để cột `city` hiện ra.",
          starter: "SELECT customer_id, full_name\n       -- , city\nFROM customer\nORDER BY customer_id\nLIMIT 3;",
          solution: "SELECT customer_id, full_name, city FROM customer ORDER BY customer_id LIMIT 3",
          hint: "Xoá `--` và giữ dấu phẩy để ngăn cách với cột trước.",
          ordered: true,
        },
        {
          prompt: "Viết gần như từ đầu: xem `account_id`, `customer_id` và số dư của 5 tài khoản có số dư lớn nhất, kèm một dòng chú thích `--` mô tả câu lệnh ở đầu.",
          starter: "-- top 5 tài khoản theo số dư\n",
          solution: "SELECT account_id, customer_id, working_balance FROM account ORDER BY working_balance DESC LIMIT 5",
          ordered: true,
        },
      ],
      takeaway: {
        lines: ["Top N: sắp theo cột cần xếp hạng (`DESC` nếu lấy lớn nhất) rồi `LIMIT N`. `LIMIT` luôn cắt sau cùng."],
      },
      quiz: {
        question: "Vì sao `SELECT customer_id, city FROM customer LIMIT 3` (không có ORDER BY) không đảm bảo luôn ra cùng 3 khách?",
        options: [
          "Vì `LIMIT` chọn ngẫu nhiên mỗi lần chạy theo thiết kế của SQL",
          "Vì không có ORDER BY thì SQL không cam kết thứ tự dòng, nên 3 dòng đầu có thể khác nhau",
          "Vì `LIMIT 3` luôn lấy 3 dòng cuối của bảng chứ không phải đầu",
          "Vì `customer_id` không phải khoá chính nên không có thứ tự",
        ],
        answer: 1,
        explain: "Bảng trong database là tập hợp dòng, không có thứ tự cố định. LIMIT không chọn ngẫu nhiên nhưng cũng không hứa thứ tự. Muốn ổn định phải có ORDER BY. `customer_id` đúng là khoá chính, nhưng điều đó không tự tạo thứ tự khi hiển thị.",
      },
    },
  ],
  cards: [
    { q: "Thứ tự chạy logic của một câu SELECT cơ bản?", a: "`FROM`, rồi `SELECT`, rồi `DISTINCT`, rồi `ORDER BY`, cuối cùng `LIMIT`. `WHERE` sẽ chen vào trước `SELECT`." },
    { q: "Vì sao `ORDER BY` dùng được alias còn `WHERE` thì không?", a: "Alias sinh ra ở bước `SELECT`. `ORDER BY` chạy sau nên thấy nó, `WHERE` chạy trước nên chưa biết." },
    { q: "Vì sao nên liệt kê cột thay vì `SELECT *`?", a: "Kết quả gọn và nhanh hơn, và không đổi khi ai đó thêm cột vào bảng." },
    { q: "Quên dấu phẩy giữa hai cột thì chuyện gì xảy ra?", a: "PostgreSQL cho bỏ `AS`, nên cột đầu thành cột có alias là tên cột sau. Câu vẫn chạy nhưng chỉ ra một cột và sai nghĩa." },
    { q: "`SELECT 7 / 2` ra bao nhiêu, và sửa thế nào để ra 3.5?", a: "Ra 3 vì chia hai số nguyên. Viết `7 / 2.0` hoặc ép kiểu sang `numeric`." },
    { q: "`DISTINCT city, customer_status` xét trùng theo cái gì?", a: "Theo cả dòng, tức mỗi cặp (city, customer_status) tính một lần. Thêm cột thì số dòng thường tăng." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "FROM nói lấy từ bảng nào, SELECT nói lấy những cột nào, và kết quả hiện đúng thứ tự cột bạn viết. Database chạy FROM trước, rồi SELECT, DISTINCT, ORDER BY và LIMIT sau cùng, nên alias đặt ở SELECT dùng được trong ORDER BY. Alias đặt bằng AS, có dấu cách hoặc tiếng Việt thì bọc nháy kép, và đừng quên dấu phẩy giữa các cột. SELECT tính được biểu thức trên từng dòng, nhớ chia hai số nguyên ra số nguyên và NULL trong phép tính cho ra NULL. DISTINCT bỏ dòng trùng xét trên mọi cột đã chọn, coi NULL bằng NULL. LIMIT cần ORDER BY để kết quả ổn định.",
};
