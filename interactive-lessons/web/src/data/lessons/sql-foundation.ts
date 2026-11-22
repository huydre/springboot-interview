import timeline from "../timelines/sql-foundation.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 1. Every query was run on PostgreSQL (PGlite) against the fictional T24-style dataset in data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlFoundation: Lesson = {
  slug: "sql-foundation",
  crumb: "Nền tảng Database",
  videoDir: "/videos/sql-foundation",
  videoVersion: "7d9e074a",
  scenes: timeline as Scene[],
  title: "Nền tảng Database và bộ dữ liệu T24",
  subtitle:
    "Database, bảng, dòng, cột, kiểu dữ liệu, khoá chính, khoá ngoại và NULL, học trực tiếp trên một ngân hàng giả lập theo mô hình T24. Bạn chạy SQL ngay trong trình duyệt.",
  openingQuiz: {
    question: "Trong database, \"một khách hàng cụ thể\" (ví dụ ông Nguyễn Văn An, mã 100002) được lưu ở đâu của bảng customer?",
    options: [
      "Trong một cột tên Nguyễn Văn An",
      "Trong một dòng (row), mỗi cột của dòng giữ một thông tin về khách hàng đó",
      "Trong một bảng riêng chỉ có ông An",
      "Trong tên của database",
    ],
    answer: 1,
    explain: "Bảng giống một tờ Excel: mỗi cột là một loại thông tin (mã, tên, ngày sinh...), mỗi dòng là một đối tượng cụ thể. Một khách hàng là một dòng.",
  },
  roadmap: [
    "Chặng 1: bảng, dòng, cột và kiểu dữ liệu.",
    "Chặng 2: khoá chính, khoá ngoại và NULL: những luật giữ cho dữ liệu đúng.",
    "Chặng 3: làm quen 11 bảng của ngân hàng T24 giả lập, dùng cho cả khoá học.",
  ],
  sections: [
    {
      id: "database-table",
      title: "Phần 1: Database, bảng, dòng và cột",
      scene: "database-table",
      intro: [
        "**Database** (cơ sở dữ liệu) là nơi lưu dữ liệu có tổ chức, để tìm và sửa nhanh. Một database gồm nhiều **bảng** (table). Hãy hình dung mỗi bảng là một tờ Excel: **cột** (column) là loại thông tin, **dòng** (row) là một đối tượng cụ thể. Ví dụ bảng `customer` có cột `customer_id`, `full_name`, `birth_date`, và mỗi khách hàng là một dòng.",
        "**SQL** là ngôn ngữ để hỏi database. Câu đơn giản nhất: `SELECT * FROM company` nghĩa là \"lấy mọi cột (`*`) từ bảng `company`\". Bạn không cần hiểu hết ngay, cứ chạy và nhìn kết quả. Khoá học này dùng PostgreSQL, và bộ dữ liệu là một ngân hàng giả lập (toàn số liệu bịa, đặt tên theo phần mềm lõi ngân hàng T24).",
      ],
      sql: [
        {
          prompt: "Điền tên bảng để xem toàn bộ chi nhánh của ngân hàng. Bảng cần xem tên là `company`. Bấm Chạy.",
          starter: "SELECT * FROM ____;",
          solution: "SELECT * FROM company",
          hint: "Thay dấu gạch dưới bằng đúng tên bảng, không có dấu nháy.",
        },
        {
          prompt: "Xem 5 khách hàng đầu tiên của bảng `customer`, sắp theo `customer_id`. Dòng `ORDER BY customer_id` đã có sẵn: nó sắp các dòng theo mã khách tăng dần, vì không có nó database không hứa thứ tự nào (bài 4 học kỹ). Việc của bạn là thêm số sau `LIMIT` để giới hạn số dòng. Đừng ngại cuộn ngang bảng kết quả để thấy hết các cột.",
          starter: "SELECT * FROM customer\nORDER BY customer_id\nLIMIT ;",
          solution: "SELECT * FROM customer ORDER BY customer_id LIMIT 5",
          hint: "LIMIT 5 nghĩa là chỉ lấy 5 dòng đầu.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Bảng `account` có 85 dòng và 9 cột. 85 và 9 lần lượt đếm cái gì?",
        options: [
          "85 là số cột, 9 là số dòng",
          "85 là số dòng (số tài khoản), 9 là số cột (loại thông tin của mỗi tài khoản)",
          "Cả hai đều là số bảng",
          "85 là số database, 9 là số bảng",
        ],
        answer: 1,
        explain: "Mỗi tài khoản là một dòng, nên 85 dòng nghĩa là 85 tài khoản. Mỗi dòng có 9 thông tin (cột): mã tài khoản, khách hàng, loại sản phẩm, loại tiền, số dư...",
      },
    },
    {
      id: "data-type",
      trap: {
        title: "Tiền lưu bằng float là tự rước sai số",
        text: "Với `float`, `0.1 + 0.2 = 0.3` cho kết quả `false`, còn với `numeric` thì `true`. Sai số nhỏ cộng dồn qua hàng nghìn bút toán sẽ làm lệch tiền. Cột tiền luôn dùng `numeric(18,2)`.",
      },
      title: "Phần 2: Kiểu dữ liệu của từng cột",
      scene: "data-type",
      intro: [
        "Bảng có cột và dòng. Nhưng cột `full_name` chứa chữ, còn `working_balance` chứa tiền: database cần biết mỗi cột chứa loại gì.",
        "Mỗi cột có một **kiểu dữ liệu** (data type), cho database biết cột đó chứa loại giá trị nào. Các kiểu hay gặp:",
        "- **`integer`**: số nguyên, ví dụ mã khách hàng.",
        "- **`varchar(n)`**: chuỗi chữ tối đa n ký tự, ví dụ họ tên.",
        "- **`numeric(18,2)`**: số thập phân chính xác, 18 chữ số trong đó 2 số lẻ, dùng cho tiền.",
        "- **`date`**: ngày.",
        "- **`char(3)`**: chuỗi đúng 3 ký tự, ví dụ mã tiền tệ VND.",
        "Chọn đúng kiểu rất quan trọng. Tiền nên dùng `numeric`, không dùng số thực dấu phẩy động (`float`) vì `float` có thể sai số nhỏ khi cộng nhiều lần. Ngày nên dùng `date`, không lưu thành chuỗi, để sau này so sánh và tính khoảng cách ngày được.",
      ],
      sql: [
        {
          prompt: "Xem kiểu dữ liệu của từng cột trong bảng `account`. Câu này hỏi \"bảng chứa thông tin về các cột\" của PostgreSQL. Bạn chưa cần hiểu `WHERE`, chỉ cần chạy và đọc cột `data_type`.",
          starter: "SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_schema = 'public' AND table_name = 'account'\nORDER BY ordinal_position;",
          solution: "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' ORDER BY ordinal_position",
          ordered: true,
        },
      ],
      quiz: {
        question: "Cột `working_balance` (số dư tài khoản) nên có kiểu nào?",
        options: [
          "varchar, để lưu cả chữ \"VND\" kèm số",
          "numeric(18,2), số thập phân chính xác",
          "date, vì số dư thay đổi theo ngày",
          "boolean, đúng hoặc sai",
        ],
        answer: 1,
        explain: "Tiền cần số chính xác nên dùng numeric. Loại tiền (VND, USD) tách ra cột `ccy` riêng, không nhét chung vào số dư.",
      },
    },
    {
      id: "primary-key",
      trap: {
        title: "Họ tên không làm khoá chính được",
        text: "Tên người dễ trùng, nên dùng nó làm khoá chính sẽ chặn nhầm người thứ hai cùng tên. Hãy cấp một mã riêng (`customer_id`) làm khoá chính và để tên trùng thoải mái.",
      },
      title: "Phần 3: Khoá chính (Primary Key)",
      scene: "primary-key",
      intro: [
        "Làm sao phân biệt hai khách hàng cùng tên \"Nguyễn Văn An\"? Mỗi dòng cần một cột **duy nhất và không bao giờ NULL** (luôn có giá trị) để nhận diện, gọi là **khoá chính** (Primary Key, viết tắt PK). Ở bảng `company`, khoá chính là `company_id`; ở `customer` là `customer_id`; ở `account` là `account_id`.",
        "Bên dưới là một lệnh `INSERT` (thêm dòng mới) cố thêm chi nhánh có mã `VN0010001`, mã này đã tồn tại. Hãy chạy để xem database xử lý thế nào, rồi sửa mã thành một mã chưa dùng. Bạn chưa cần học `INSERT` lúc này, bài về thay đổi dữ liệu nằm ở cuối khoá.",
      ],
      predict: {
        question: "Bảng `company` đã có chi nhánh mã `VN0010001`. Chạy `INSERT` thêm một chi nhánh khác cũng mã `VN0010001` thì sao?",
        options: [
          "Dòng mới ghi đè lên chi nhánh cũ",
          "Bảng có hai dòng cùng mã",
          "Database từ chối với lỗi \"duplicate key\"",
          "Database lặng lẽ bỏ qua, không báo gì",
        ],
        answer: 2,
        explain: "Database **tự chặn** việc thêm dòng trùng khoá chính, nên lệnh bị từ chối với lỗi \"duplicate key\". Đổi sang mã chưa dùng thì chèn được.",
      },
      sql: [
        {
          prompt: "Chạy lệnh để thấy lỗi trùng khoá chính. Sau đó đổi `VN0010001` thành mã chưa tồn tại (ví dụ `VN0010006`) để chèn thành công. Dữ liệu sẽ được đặt lại khi bạn bấm \"Đặt lại dữ liệu\".",
          starter: "INSERT INTO company (company_id, name, city, open_date)\nVALUES ('VN0010001', 'Chi nhánh Huế', 'Huế', '2024-01-10');",
          solution: "INSERT INTO company (company_id, name, city, open_date) VALUES ('VN0010006', 'Chi nhánh Huế', 'Huế', '2024-01-10')",
          verify: "SELECT count(*) AS so_chi_nhanh FROM company",
          hint: "Chỉ cần đổi giá trị đầu tiên trong VALUES. Mã mới không được trùng 5 mã đang có (VN0010001 đến VN0010005).",
        },
      ],
      quiz: {
        question: "Giả sử ngân hàng có hai khách hàng cùng tên \"Lê Khánh Linh\" nhưng mã `customer_id` khác nhau. Thiết kế này đúng hay sai?",
        options: [
          "Sai, vì tên trùng thì database phải từ chối",
          "Đúng, vì khoá chính là `customer_id` chứ không phải họ tên; tên có thể trùng",
          "Sai, vì mỗi tên chỉ được xuất hiện một lần",
          "Chỉ đúng nếu hai người cùng ngày sinh",
        ],
        answer: 1,
        explain: "Khoá chính phải duy nhất, và tên người thì dễ trùng. Vì vậy người ta cấp một mã (id) riêng làm khoá chính.",
      },
    },
    {
      id: "foreign-key",
      trap: {
        title: "Khoá ngoại chặn cả chiều xoá",
        text: "Xoá `customer_id = 100001` khi khách còn tài khoản sẽ báo lỗi `violates foreign key constraint`. Database không để dòng con mồ côi. Muốn xoá thì phải xử lý các dòng con trước.",
      },
      title: "Phần 4: Khoá ngoại (Foreign Key)",
      scene: "foreign-key",
      intro: [
        "Khoá chính nhận diện từng dòng trong bảng của nó. Còn nối dòng của bảng này với dòng của bảng khác thì sao?",
        "Bảng `account` có cột `customer_id` cho biết tài khoản này của khách hàng nào. Cột này **trỏ sang** khoá chính `customer_id` của bảng `customer`. Cột trỏ sang bảng khác như vậy gọi là **khoá ngoại** (Foreign Key, FK). Nhờ FK, thông tin khách hàng chỉ lưu một lần ở bảng `customer`, còn mọi tài khoản chỉ ghi mã.",
        "FK còn là một **luật**: không thể tạo tài khoản cho một khách hàng không tồn tại. Chạy lệnh bên dưới để thấy lỗi \"foreign key constraint\", rồi sửa `customer_id` thành một khách hàng có thật.",
      ],
      sql: [
        {
          prompt: "Lệnh này thêm tài khoản cho khách hàng `999999`, không tồn tại, nên bị lỗi khoá ngoại. Đổi `999999` thành khách hàng có thật (ví dụ `100001`) để chèn thành công.",
          starter: "INSERT INTO account (account_id, customer_id, category_id, ccy, company_id, open_date, working_balance, status)\nVALUES ('1999999999', 999999, 1001, 'VND', 'VN0010001', '2024-05-01', 0, 'OPEN');",
          solution: "INSERT INTO account (account_id, customer_id, category_id, ccy, company_id, open_date, working_balance, status) VALUES ('1999999999', 100001, 1001, 'VND', 'VN0010001', '2024-05-01', 0, 'OPEN')",
          verify: "SELECT count(*) AS so_tai_khoan FROM account",
          hint: "Khách hàng hợp lệ có mã từ 100001 đến 100040.",
        },
      ],
      takeaway: {
        lines: ["Khoá ngoại là luật hai chiều: không tạo dòng con cho cha không tồn tại, không xoá cha khi còn con."],
      },
      quiz: {
        question: "Vì sao không lưu luôn họ tên khách hàng vào từng dòng của bảng `account`, thay vì chỉ lưu `customer_id`?",
        options: [
          "Vì cột tên quá dài",
          "Để thông tin khách hàng chỉ lưu một chỗ: đổi tên một lần là mọi tài khoản đều đúng, không bị lệch",
          "Vì SQL không cho lưu chữ trong bảng account",
          "Vì khoá ngoại bắt buộc phải là số",
        ],
        answer: 1,
        explain: "Lưu trùng dữ liệu ở nhiều nơi dễ làm hai nơi nói khác nhau. Giữ một nơi duy nhất cho mỗi thông tin, các bảng khác trỏ tới bằng khoá ngoại.",
      },
    },
    {
      id: "null-value",
      trap: {
        title: "`= NULL` luôn không trả về dòng nào",
        text: "Trong `customer`, `WHERE mobile = NULL` trả 0 dòng, còn `WHERE mobile IS NULL` trả đúng 6 khách chưa có số điện thoại (`WHERE` dùng để lọc dòng, học ở bài 4 \"Lọc và sắp xếp\"). So sánh với NULL cho kết quả \"không biết\" nên không bao giờ thoả. Luôn dùng `IS NULL`.",
      },
      title: "Phần 5: NULL, giá trị chưa biết",
      scene: "null-value",
      intro: [
        "Không phải khách hàng nào cũng có số điện thoại hay email trong hệ thống. Khi không có thông tin, database lưu **NULL**: nghĩa là \"không có giá trị / chưa biết\". NULL **không phải** số 0, cũng không phải chuỗi rỗng `''`. Số dư bằng 0 là biết chắc tài khoản hết tiền; số điện thoại NULL là chưa biết số.",
        "NULL còn có tính chất đặc biệt: so sánh với NULL không cho đúng cũng không cho sai mà cho \"không biết\". Vì vậy sau này ta dùng `IS NULL` thay vì `= NULL`. Ở bài này bạn chỉ cần nhận ra NULL khi nhìn bảng kết quả (chữ NULL in nghiêng, mờ).",
      ],
      sql: [
        {
          prompt: "Xem 12 khách hàng đầu. Chú ý cột `mobile` và `email`: dòng nào có NULL? Khách hàng 100005 chưa có số điện thoại, khách hàng 100001 chưa có email.",
          starter: "SELECT customer_id, full_name, mobile, email\nFROM customer\nORDER BY customer_id\nLIMIT 12;",
          solution: "SELECT customer_id, full_name, mobile, email FROM customer ORDER BY customer_id LIMIT 12",
          ordered: true,
        },
      ],
      quiz: {
        question: "Cột `close_date` (ngày đóng tài khoản) của một tài khoản đang mở nên chứa gì?",
        options: [
          "0",
          "Chuỗi rỗng ''",
          "NULL, vì tài khoản chưa đóng nên chưa có ngày đóng",
          "Ngày hôm nay",
        ],
        answer: 2,
        explain: "NULL mô tả đúng \"chưa có giá trị\". Dùng 0, chuỗi rỗng hay ngày giả sẽ làm sai kết quả khi lọc và tính toán sau này.",
      },
    },
    {
      id: "t24-dataset",
      title: "Phần 6: Làm quen ngân hàng T24 giả lập",
      scene: "t24-dataset",
      intro: [
        "Bạn đã có đủ khái niệm: bảng, kiểu dữ liệu, khoá chính, khoá ngoại và NULL. Giờ xem chúng ghép thành một ngân hàng thế nào.",
        "T24 là phần mềm lõi ngân hàng (core banking) của hãng Temenos, được nhiều ngân hàng dùng để quản lý khách hàng, tài khoản và giao dịch. Bộ dữ liệu của khoá học là bản **giả lập** theo cách đặt tên của T24, toàn số liệu bịa, gồm 11 bảng.",
        "**Danh mục** (ít dòng):",
        "- **`company`**: 5 chi nhánh.",
        "- **`account_officer`**: 8 cán bộ quản lý khách.",
        "- **`sector`**: 4 nhóm khách hàng.",
        "- **`currency`**: 4 loại tiền.",
        "- **`category`**: 7 loại sản phẩm (thanh toán, tiết kiệm, vay).",
        "- **`txn_type`**: 8 loại giao dịch.",
        "**Dữ liệu chính**:",
        "- **`customer`**: 40 khách hàng.",
        "- **`account`**: 85 tài khoản.",
        "- **`funds_transfer`**: 132 lệnh chuyển khoản.",
        "- **`stmt_entry`**: 932 bút toán trên sao kê, mỗi lần tiền ra vào tài khoản là một dòng.",
        "- **`loan`**: 15 khoản vay.",
        "Các bảng nối với nhau bằng khoá ngoại: khách hàng có tài khoản, tài khoản có bút toán, bút toán có thể thuộc một lệnh chuyển khoản. Sơ đồ đầy đủ ở bài tiếp theo (ERD). Giờ hãy xem thử vài bảng chính.",
      ],
      sql: [
        {
          prompt: "Xem 5 bút toán đầu tiên của bảng `stmt_entry` (sao kê tài khoản). Số `amount` dương là tiền vào, âm là tiền ra.",
          starter: "SELECT * FROM ____\nORDER BY stmt_entry_id\nLIMIT 5;",
          solution: "SELECT * FROM stmt_entry ORDER BY stmt_entry_id LIMIT 5",
          ordered: true,
        },
        {
          prompt: "Xem 5 lệnh chuyển khoản đầu tiên của bảng `funds_transfer`, sắp theo `ft_id`. Chú ý hai cột `debit_account` (tài khoản bị trừ) và `credit_account` (tài khoản nhận).",
          starter: "SELECT * FROM ____\nORDER BY ft_id\nLIMIT 5;",
          solution: "SELECT * FROM funds_transfer ORDER BY ft_id LIMIT 5",
          ordered: true,
        },
      ],
      quiz: {
        question: "Bảng nào ghi lại từng lần tiền ra vào một tài khoản, giống dòng trên sao kê ngân hàng?",
        options: ["customer", "category", "stmt_entry", "company"],
        answer: 2,
        explain: "`stmt_entry` (statement entry) là bút toán: mỗi lần nộp, rút, chuyển, thu lãi hay thu phí là một dòng. Số dư tài khoản bằng tổng các bút toán của nó.",
      },
    },
  ],
  cards: [
    { q: "Một bảng gồm những gì?", a: "Cột là loại thông tin, dòng là một đối tượng cụ thể. Một khách hàng là một dòng của bảng `customer`." },
    { q: "Vì sao tiền dùng `numeric` mà không dùng `float`?", a: "`float` có sai số nhị phân, `0.1 + 0.2` không bằng `0.3`. `numeric` tính chính xác nên hợp với tiền." },
    { q: "Khoá chính là gì và phải thoả điều kiện nào?", a: "Là cột (hoặc nhóm cột) nhận diện duy nhất một dòng, không trùng và không NULL. Thường là một mã id riêng." },
    { q: "Khoá ngoại dùng để làm gì?", a: "Trỏ sang khoá chính của bảng khác để thông tin chỉ lưu một chỗ. Nó còn là luật: không tạo con cho cha không tồn tại, không xoá cha khi còn con." },
    { q: "NULL khác 0 và chuỗi rỗng ở điểm nào?", a: "NULL là chưa biết hoặc không có giá trị. 0 và `''` là giá trị thật. Muốn kiểm tra phải dùng `IS NULL`, không dùng `= NULL`." },
    { q: "Bảng nào ghi từng lần tiền ra vào tài khoản?", a: "`stmt_entry`, mỗi bút toán một dòng. `amount` dương là tiền vào, âm là tiền ra." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Database gồm các bảng; mỗi bảng có cột (loại thông tin) và dòng (một đối tượng). Mỗi cột có kiểu dữ liệu, tiền dùng numeric, ngày dùng date. Khoá chính nhận diện duy nhất từng dòng; khoá ngoại trỏ sang khoá chính của bảng khác và bắt dữ liệu phải nhất quán. NULL nghĩa là chưa biết, khác với 0 hay chuỗi rỗng. Bộ dữ liệu ngân hàng T24 giả lập có 11 bảng và sẽ dùng xuyên suốt khoá học.",
};
