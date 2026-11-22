import timeline from "../timelines/sql-erd.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 2 (design lesson, no JOIN). Counts and constraint names quoted below were read from the T24 dataset with scripts/run-sql.mjs.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.

/** Compares the columns and the PK/FK definitions of one new table; the same query grades the learner and the model answer. */
const verifyTable = (table: string) =>
  `SELECT column_name AS item, data_type || ' ' || is_nullable AS detail FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' UNION ALL SELECT contype::text, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = to_regclass('public.${table}') AND contype IN ('p', 'f')`;

export const sqlErd: Lesson = {
  slug: "sql-erd",
  crumb: "ERD và lược đồ quan hệ",
  videoDir: "/videos/sql-erd",
  videoVersion: "930c5638",
  scenes: timeline as Scene[],
  title: "Thiết kế ERD và lược đồ quan hệ",
  subtitle:
    "Từ một yêu cầu nghiệp vụ của ngân hàng đến sơ đồ ERD, rồi đến các bảng có khoá chính và khoá ngoại. Bạn xem lại sơ đồ 11 bảng T24 và tự viết lệnh CREATE TABLE.",
  openingQuiz: {
    question: "Ngân hàng muốn lưu \"mỗi tài khoản thuộc về một khách hàng, một khách hàng có thể có nhiều tài khoản\". Cột khoá ngoại nên đặt ở đâu?",
    options: [
      "Ở bảng customer, một cột chứa danh sách mã các tài khoản của khách",
      "Ở bảng account, một cột customer_id trỏ về bảng customer",
      "Ở cả hai bảng, mỗi bảng một cột trỏ sang bảng kia",
      "Ở một bảng thứ ba chứa toàn bộ thông tin của cả hai",
    ],
    answer: 1,
    explain:
      "Phía \"nhiều\" (tài khoản) giữ mã của phía \"một\" (khách hàng). Nhét danh sách vào một ô của customer làm một ô chứa nhiều giá trị, rất khó tìm và sửa. Hai chiều cùng trỏ nhau thừa và dễ lệch, còn bảng thứ ba chỉ cần khi hai phía đều \"nhiều\".",
  },
  roadmap: [
    "Chặng 1: thực thể, thuộc tính, quan hệ và bản số 1-1, 1-N, N-N.",
    "Chặng 2: biến sơ đồ ERD thành lược đồ quan hệ, rồi đọc ERD của 11 bảng T24.",
    "Chặng 3: tự viết CREATE TABLE với khoá chính, khoá ngoại, bảng trung gian, và chuẩn hoá bằng lời thường.",
  ],
  sections: [
    {
      id: "business-to-erd",
      title: "Phần 1: Từ yêu cầu nghiệp vụ đến thực thể",
      scene: "business-to-erd",
      intro: [
        "Thiết kế database bắt đầu từ lời mô tả nghiệp vụ, chưa phải từ SQL. Ví dụ: \"Ngân hàng có nhiều chi nhánh. Mỗi khách hàng do một cán bộ quản lý. Khách hàng mở nhiều tài khoản. Tài khoản có thể chuyển tiền cho tài khoản khác.\" Từ đoạn văn này ta rút ra ba thứ.",
        "**Thực thể** (entity) là thứ cần lưu và phân biệt được với thứ khác, thường là danh từ: chi nhánh, khách hàng, tài khoản. Mỗi thực thể sau này thành một bảng. **Thuộc tính** (attribute) là thông tin mô tả thực thể: khách hàng có họ tên, ngày sinh, thành phố. Mỗi thuộc tính thành một cột. **Quan hệ** (relationship) là cách các thực thể liên quan nhau, thường là động từ: khách hàng \"mở\" tài khoản.",
        "Sơ đồ vẽ ba thứ đó gọi là **ERD** (Entity Relationship Diagram, sơ đồ thực thể và quan hệ). Quy trình đầy đủ gồm bốn bước: yêu cầu nghiệp vụ, ERD, **lược đồ quan hệ** (danh sách bảng và cột, ghi gọn như `account(account_id, customer_id, ...)`), rồi cuối cùng mới là lệnh `CREATE TABLE`. Ở bài này ta đi hết cả bốn bước. Bạn có thể xem lại sự thật về bảng và cột bằng bảng `information_schema` đã gặp ở bài trước.",
      ],
      sql: [
        {
          prompt: "Có bao nhiêu thực thể (bảng) trong ngân hàng T24 giả lập? Liệt kê tên bảng của lược đồ `public`, sắp theo tên. Đếm số dòng trong kết quả.",
          starter: "SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY ____;",
          solution: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
          hint: "Sắp theo chính cột table_name.",
          ordered: true,
        },
        {
          prompt: "Thực thể **khoản vay** (`loan`) có những thuộc tính nào? Liệt kê tên cột và kiểu dữ liệu của bảng `loan`, theo thứ tự cột trong bảng.",
          starter: "SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_schema = 'public' AND table_name = '____'\nORDER BY ordinal_position;",
          solution: "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan' ORDER BY ordinal_position",
          ordered: true,
        },
      ],
      quiz: {
        question: "Trong yêu cầu \"lưu khách hàng gồm họ tên, ngày sinh và thành phố\", đâu là thực thể và đâu là thuộc tính?",
        options: [
          "Khách hàng là thực thể; họ tên, ngày sinh, thành phố là thuộc tính",
          "Họ tên là thực thể; khách hàng, ngày sinh, thành phố là thuộc tính",
          "Thành phố là thực thể; khách hàng và ngày sinh là thuộc tính",
          "Cả bốn đều là thực thể, mỗi thứ một bảng riêng",
        ],
        answer: 0,
        explain:
          "Khách hàng là thứ cần nhận diện từng cá thể nên là thực thể. Họ tên, ngày sinh chỉ mô tả khách hàng nên là thuộc tính (cột). Thành phố cũng là thuộc tính ở đây; nó chỉ thành thực thể riêng nếu ngân hàng cần lưu thêm nhiều thông tin về thành phố.",
      },
    },
    {
      id: "cardinality",
      trap: {
        title: "N-N không vẽ thẳng được, phải có bảng ở giữa",
        text: "Một cột khoá ngoại chỉ chứa một giá trị, nên chỉ diễn tả được phía \"một\". Với quan hệ nhiều-nhiều, hãy tạo bảng trung gian mỗi dòng là một cặp. Nhét danh sách mã vào một ô (một ô chứa nhiều giá trị) thì rất khó tìm và không đặt được khoá ngoại; phần 6 gọi lỗi này là vi phạm 1NF.",
      },
      title: "Phần 2: Bản số 1-1, 1-N, N-N",
      scene: "cardinality",
      intro: [
        "**Bản số** (cardinality) trả lời: một dòng bên này nối được với tối đa mấy dòng bên kia. Có ba loại. **1-1**: một công dân có một số căn cước, mỗi số căn cước thuộc một người. **1-N** (một-nhiều): một khách hàng có nhiều tài khoản, nhưng mỗi tài khoản chỉ thuộc một khách. **N-N** (nhiều-nhiều): một khách có nhiều loại sản phẩm (thanh toán, tiết kiệm, vay) và mỗi loại sản phẩm có nhiều khách.",
        "Cách xác định: hỏi hai câu, \"mỗi A có tối đa mấy B?\" rồi \"mỗi B có tối đa mấy A?\". Trong ERD, quan hệ N-N không thể vẽ thẳng thành hai bảng nối nhau bằng một khoá ngoại. Ta chen vào giữa một **bảng trung gian** (junction table), mỗi dòng của nó nối một dòng bên A với một dòng bên B. Khi đó N-N tách thành hai quan hệ 1-N.",
        "Bảng trung gian \"sạch\" nhất chỉ có hai khoá ngoại, mỗi dòng là một cặp, và khoá chính là **cả hai cột**, vì cùng một cặp không được lặp. Ví dụ `account_holder(account_id, customer_id)` cho đồng sở hữu tài khoản, bạn sẽ tự tạo ở phần 5. T24 giả lập có hai bảng cũng đóng vai trò nối N-N nhưng là **thực thể đầy đủ** có dữ liệu riêng: `account` nối khách hàng với loại sản phẩm (`category`), và `funds_transfer` nối tài khoản gửi với tài khoản nhận. Chúng có khoá chính riêng (`account_id`, `ft_id`) chứ không dùng cặp, vì cùng một cặp có thể lặp: một khách mở hai tài khoản cùng loại, hay một tài khoản chuyển cho cùng người nhận nhiều lần. Hãy làm bài chọn bản số dưới đây, rồi xem dữ liệu thật ở phần thực hành.",
      ],
      widget: "sql-erd-cardinality",
      widgetTitle: "Chọn bản số cho từng quan hệ",
      sql: [
        {
          prompt: "Bản số 1-N bằng dữ liệu thật: khách hàng `100035` có nhiều tài khoản. Xem các tài khoản của khách này (`WHERE` giữ lại dòng thoả điều kiện, bài sau học kỹ), sắp theo `account_id`.",
          starter: "SELECT account_id, category_id, ccy\nFROM account\nWHERE customer_id = ____\nORDER BY account_id;",
          solution: "SELECT account_id, category_id, ccy FROM account WHERE customer_id = 100035 ORDER BY account_id",
          hint: "Mã khách hàng là số, không cần dấu nháy.",
          ordered: true,
        },
        {
          prompt: "Bản số N-N qua bảng trung gian: tài khoản `1000000001` đã ghi nợ (chuyển đi) trong các lệnh chuyển khoản nào, và gửi cho tài khoản nào? Mỗi dòng là một cặp (gửi, nhận). Cột `credit_account` có nhiều giá trị khác nhau (8 lệnh tới 7 tài khoản nhận), nghĩa là một tài khoản gửi nối với nhiều tài khoản nhận. Đó mới là một chiều của N-N; chiều ngược lại ở bài tiếp theo. Sắp theo `ft_id`.",
          starter: "SELECT ft_id, debit_account, credit_account, amount, status\nFROM funds_transfer\nWHERE debit_account = '____'\nORDER BY ft_id;",
          solution: "SELECT ft_id, debit_account, credit_account, amount, status FROM funds_transfer WHERE debit_account = '1000000001' ORDER BY ft_id",
          hint: "Mã tài khoản là chuỗi nên đặt trong dấu nháy đơn.",
          ordered: true,
        },
        {
          prompt: "Chiều ngược lại của N-N: tài khoản `1000000055` đã **nhận** tiền từ những tài khoản nào? Lọc theo cột tài khoản nhận, sắp theo `ft_id`. Kết quả có 6 dòng với 6 tài khoản gửi khác nhau, trong đó có cả `1000000001` của bài trước. Hai chiều cùng \"nhiều\" nên đây là N-N.",
          starter: "SELECT ft_id, debit_account, credit_account, amount, status\nFROM funds_transfer\nWHERE ____ = '1000000055'\nORDER BY ft_id;",
          solution: "SELECT ft_id, debit_account, credit_account, amount, status FROM funds_transfer WHERE credit_account = '1000000055' ORDER BY ft_id",
          hint: "Tài khoản nhận tiền nằm ở cột credit_account.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Bệnh nhân và bác sĩ: một bệnh nhân khám nhiều bác sĩ, một bác sĩ khám nhiều bệnh nhân. Cần làm gì khi chuyển thành bảng?",
        options: [
          "Đặt cột doctor_id vào bảng bệnh nhân là đủ",
          "Đặt cột patient_id vào bảng bác sĩ là đủ",
          "Tạo bảng trung gian lưu từng cặp (bệnh nhân, bác sĩ), mỗi cột trong cặp là một khoá ngoại",
          "Gộp bệnh nhân và bác sĩ vào một bảng duy nhất",
        ],
        answer: 2,
        explain:
          "Một cột khoá ngoại chỉ lưu được một giá trị nên chỉ diễn tả được phía \"một\". Với N-N phải có bảng trung gian, mỗi dòng là một cặp. Đặt vào một phía thì mất ý nghĩa nhiều-nhiều, còn gộp hai thực thể thành một bảng làm dữ liệu lặp lại khắp nơi.",
      },
    },
    {
      id: "keys-schema",
      trap: {
        title: "Khoá ngoại luôn nằm ở phía nhiều",
        text: "Hỏi \"mỗi A có tối đa mấy B\" để biết phía nào là nhiều, rồi đặt khoá ngoại ở đó. Đặt ngược lại (chi nhánh giữ `officer_id`) thì một ô phải chứa nhiều cán bộ. Trong T24, `account_officer` giữ `company_id`, không phải ngược lại.",
      },
      title: "Phần 3: Khoá chính, khoá ngoại và lược đồ quan hệ",
      scene: "keys-schema",
      intro: [
        "Bài trước bạn đã biết khoá chính (PK) nhận diện từng dòng và khoá ngoại (FK) trỏ sang khoá chính của bảng khác. Giờ ta dùng chúng để biến ERD thành bảng. Ba quy tắc chuyển đổi: **1-N**: đặt khoá ngoại ở bảng phía \"nhiều\", trỏ về khoá chính phía \"một\". **N-N**: tạo bảng trung gian có hai khoá ngoại, khoá chính của nó thường gộp cả hai cột lại. **1-1**: giống 1-N nhưng thêm ràng buộc cột khoá ngoại không được trùng, cách gọn nhất là cho chính khoá ngoại làm khoá chính của bảng phụ. **Bảng phụ** là bảng tách riêng một phần thông tin của bảng chính, ví dụ hồ sơ định danh của khách: `customer_kyc(customer_id PK FK, id_number, issue_date)`, với `customer_id` vừa là khoá chính vừa trỏ về `customer`. Vì là khoá chính nên không trùng được, mỗi khách có tối đa một hồ sơ.",
        "**Lược đồ quan hệ** là cách ghi gọn kết quả này: `Bảng(cột khoá chính, cột khoá ngoại, cột thường)`. Ví dụ thật của T24: `account(account_id PK, customer_id FK, category_id FK, ccy FK, company_id FK, open_date, ...)`. Chỉ nhìn dòng này đã biết account trỏ tới bốn bảng khác. Khoá chính gộp nhiều cột gọi là **khoá chính phức hợp**, ví dụ `(account_id, customer_id)` của bảng đồng sở hữu ở phần 5.",
        "Database lưu các luật này dưới dạng **ràng buộc** (constraint), nên ta hỏi được bằng `information_schema`. Trong T24, mỗi khoá chính tên dạng `<bảng>_pkey` và mỗi khoá ngoại tên dạng `<bảng>_<cột>_fkey`.",
      ],
      sql: [
        {
          prompt: "Liệt kê các khoá ngoại của bảng `account` (loại ràng buộc là `FOREIGN KEY`), sắp theo tên. Bạn sẽ thấy 4 dòng, khớp 4 cột trỏ sang `customer`, `category`, `currency`, `company`.",
          starter: "SELECT constraint_name, constraint_type\nFROM information_schema.table_constraints\nWHERE table_schema = 'public' AND table_name = 'account' AND constraint_type = '____'\nORDER BY constraint_name;",
          solution: "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'account' AND constraint_type = 'FOREIGN KEY' ORDER BY constraint_name",
          hint: "Chuỗi cần điền là FOREIGN KEY, viết hoa, có dấu cách giữa hai từ.",
          ordered: true,
        },
        {
          prompt: "Xem khoá chính và các khoá ngoại của `stmt_entry` cùng cột tương ứng, qua bảng `information_schema.key_column_usage`. Sắp theo tên ràng buộc. Bạn thấy mấy khoá ngoại, và cột nào là khoá chính?",
          starter: "SELECT constraint_name, column_name\nFROM information_schema.key_column_usage\nWHERE table_schema = 'public' AND table_name = '____'\nORDER BY constraint_name;",
          solution: "SELECT constraint_name, column_name FROM information_schema.key_column_usage WHERE table_schema = 'public' AND table_name = 'stmt_entry' ORDER BY constraint_name",
          ordered: true,
        },
      ],
      quiz: {
        question: "Quan hệ 1-N: một chi nhánh có nhiều cán bộ. Khoá ngoại phải nằm ở đâu để đúng quy tắc?",
        options: [
          "Ở bảng chi nhánh (phía một), cột officer_id trỏ về cán bộ",
          "Ở bảng chi nhánh, một cột chứa danh sách mã cán bộ",
          "Ở bảng cán bộ (phía nhiều), cột company_id trỏ về company",
          "Ở cả hai bảng, mỗi bảng một khoá ngoại",
        ],
        answer: 2,
        explain:
          "Mỗi cán bộ chỉ có một chi nhánh nên ô `company_id` của cán bộ chứa được đúng một giá trị. Ngược lại một chi nhánh có nhiều cán bộ, một ô không chứa nổi nhiều mã mà vẫn gọn. Khoá ngoại luôn đi theo phía nhiều. Đúng như bảng `account_officer` có cột `company_id` trong T24.",
      },
    },
    {
      id: "erd-t24",
      trap: {
        title: "Hai khoá ngoại cùng trỏ một bảng là bình thường",
        text: "`funds_transfer` có `debit_account` và `credit_account` đều trỏ về `account` vì một lệnh chuyển có hai đầu. Cũng đừng bắt mọi khoá ngoại phải NOT NULL: `stmt_entry.ft_id` là NULL ở 686 trong 932 bút toán vì nộp, rút, lãi, phí không thuộc lệnh chuyển nào.",
      },
      title: "Phần 4: Vẽ lại ERD của 11 bảng T24",
      scene: "erd-t24",
      intro: [
        "Giờ ta nhìn toàn cảnh. 11 bảng T24 nối nhau bằng **17 khoá ngoại**, nhưng chỉ 6 bảng giữ khoá ngoại (`account_officer`, `customer`, `account`, `funds_transfer`, `stmt_entry`, `loan`). 5 bảng còn lại (`company`, `sector`, `currency`, `category`, `txn_type`) chỉ được trỏ tới: đó là các bảng danh mục.",
        "Bảng được trỏ tới nhiều nhất là `account`: 4 khoá ngoại về nó (hai của `funds_transfer`, một của `stmt_entry`, một của `loan`). Tiếp theo là `company` và `currency`, mỗi bảng 3, rồi `customer` 2. Điều này hợp lý: tài khoản là trung tâm của ngân hàng. Bấm vào từng bảng trong sơ đồ dưới đây để xem cột và các quan hệ.",
        "Hai điểm đáng chú ý. Một: `funds_transfer` có hai khoá ngoại cùng trỏ về `account`, vì một lệnh chuyển khoản có hai đầu (tài khoản gửi và tài khoản nhận). Hai: `stmt_entry.ft_id` được phép NULL, vì các bút toán nộp, rút, lãi, phí, giải ngân, thu nợ không thuộc lệnh chuyển khoản nào (686 trong 932 bút toán có `ft_id` rỗng, 246 bút toán thuộc 123 lệnh chuyển khoản đã hoàn tất, mỗi lệnh 2 bút toán).",
      ],
      widget: "sql-erd-viewer",
      widgetTitle: "ERD 11 bảng T24 (bấm vào một bảng)",
      sql: [
        {
          prompt: "Liệt kê tất cả khoá ngoại của cả database (loại `FOREIGN KEY`), sắp theo tên bảng rồi tên ràng buộc. Đếm số dòng, phải ra 17.",
          starter: "SELECT table_name, constraint_name\nFROM information_schema.table_constraints\nWHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'\nORDER BY ____, constraint_name;",
          solution: "SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY' ORDER BY table_name, constraint_name",
          hint: "Sắp theo table_name trước, constraint_name sau.",
          ordered: true,
        },
        {
          prompt: "Xem riêng các khoá ngoại của `funds_transfer`. Bạn thấy 3 dòng: tài khoản nhận, tài khoản gửi, và loại tiền. Sắp theo tên ràng buộc.",
          starter: "SELECT constraint_name\nFROM information_schema.table_constraints\nWHERE table_schema = 'public' AND table_name = '____' AND constraint_type = 'FOREIGN KEY'\nORDER BY constraint_name;",
          solution: "SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'funds_transfer' AND constraint_type = 'FOREIGN KEY' ORDER BY constraint_name",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao `funds_transfer` có hai khoá ngoại cùng trỏ về bảng `account`?",
        options: [
          "Vì bảng account bị lưu trùng hai lần trong database",
          "Vì khoá ngoại luôn phải khai báo hai lần mới có hiệu lực",
          "Vì mỗi lệnh chuyển khoản được chia thành hai khoản tiền",
          "Vì một lệnh chuyển khoản liên quan đến hai tài khoản: bên gửi và bên nhận",
        ],
        answer: 3,
        explain:
          "Hai cột `debit_account` và `credit_account` mô tả hai vai trò khác nhau của cùng loại thực thể (tài khoản). Mỗi cột cần một khoá ngoại riêng. Không có bản sao nào của `account`, khoá ngoại không cần khai báo kép, và `amount` là một số tiền duy nhất.",
      },
    },
    {
      id: "create-table",
      trap: {
        title: "Khoá ngoại sai kiểu hoặc trỏ bảng chưa tạo thì CREATE TABLE lỗi",
        text: "`account_id` là `varchar(10)`, ghi `integer REFERENCES account(account_id)` báo `foreign key constraint cannot be implemented`. Trỏ tới bảng chưa có báo `relation does not exist`. Hãy dùng đúng kiểu của khoá chính, và tạo bảng danh mục trước bảng giữ khoá ngoại.",
      },
      title: "Phần 5: Viết CREATE TABLE",
      scene: "create-table",
      intro: [
        "`CREATE TABLE` tạo một bảng mới: tên bảng, rồi danh sách cột, mỗi cột có tên, kiểu dữ liệu và (tuỳ chọn) ràng buộc. Ba ràng buộc cần nhớ: `PRIMARY KEY` (khoá chính, vừa duy nhất vừa không được NULL), `NOT NULL` (bắt buộc có giá trị), và `REFERENCES bảng(cột)` (khoá ngoại, giá trị phải có ở bảng kia). Khoá chính gộp nhiều cột viết ở cuối: `PRIMARY KEY (cột1, cột2)`.",
        "Ví dụ ngắn: `CREATE TABLE sample_note (note_id integer PRIMARY KEY, account_id varchar(10) NOT NULL REFERENCES account(account_id), content varchar(100));`. Mỗi bảng chỉ có một khoá chính. Các cột cách nhau bằng dấu phẩy, lệnh kết thúc bằng dấu chấm phẩy.",
        "Lưu ý: cột nằm trong khoá chính tự động `NOT NULL`, bạn không cần ghi thêm. Dữ liệu giả lập được đặt lại mỗi lần chấm, nên bảng bạn tạo ở bài này không ở lại.",
      ],
      sql: [
        {
          prompt: "**Thẻ ghi nợ** (`debit_card`): mỗi tài khoản có thể phát hành nhiều thẻ, mỗi thẻ thuộc một tài khoản (1-N). Tạo bảng gồm `card_no varchar(16)` là khoá chính, `account_id varchar(10)` bắt buộc và là khoá ngoại trỏ về `account(account_id)`, `issue_date date` bắt buộc, `status varchar(10)` bắt buộc.",
          starter: "CREATE TABLE debit_card (\n  card_no    varchar(16) PRIMARY KEY,\n  account_id varchar(10) NOT NULL ____ account(account_id),\n  issue_date date NOT NULL,\n  status     varchar(10) NOT NULL\n);",
          solution: "CREATE TABLE debit_card (card_no varchar(16) PRIMARY KEY, account_id varchar(10) NOT NULL REFERENCES account(account_id), issue_date date NOT NULL, status varchar(10) NOT NULL)",
          verify: verifyTable("debit_card"),
          hint: "Từ khoá cần điền để tạo khoá ngoại là REFERENCES.",
        },
        {
          prompt: "**Đồng sở hữu tài khoản** (N-N): một tài khoản có nhiều chủ, một khách đứng tên nhiều tài khoản. Tạo bảng trung gian `account_holder` gồm `account_id varchar(10)` và `customer_id integer` (cả hai bắt buộc, lần lượt là khoá ngoại về `account` và `customer`), `holder_type varchar(10)` bắt buộc, và khoá chính phức hợp `(account_id, customer_id)`.",
          starter: "CREATE TABLE account_holder (\n  account_id  varchar(10) NOT NULL REFERENCES account(account_id),\n  customer_id integer     NOT NULL REFERENCES customer(customer_id),\n  holder_type varchar(10) NOT NULL,\n  PRIMARY KEY (____)\n);",
          solution: "CREATE TABLE account_holder (account_id varchar(10) NOT NULL REFERENCES account(account_id), customer_id integer NOT NULL REFERENCES customer(customer_id), holder_type varchar(10) NOT NULL, PRIMARY KEY (account_id, customer_id))",
          verify: verifyTable("account_holder"),
          hint: "Khoá chính gộp hai cột khoá ngoại, cách nhau bằng dấu phẩy. Cặp (tài khoản, khách) không được xuất hiện hai lần.",
        },
        {
          prompt: "**Hồ sơ định danh** (`customer_kyc`, quan hệ 1-1 với khách): mỗi khách có tối đa một hồ sơ. Tạo bảng với `customer_id integer` vừa là khoá chính vừa là khoá ngoại trỏ về `customer(customer_id)`, `verified_date date` bắt buộc, `risk_level varchar(10)` bắt buộc. Viết từ đầu.",
          starter: "CREATE TABLE customer_kyc (\n  \n);",
          solution: "CREATE TABLE customer_kyc (customer_id integer PRIMARY KEY REFERENCES customer(customer_id), verified_date date NOT NULL, risk_level varchar(10) NOT NULL)",
          verify: verifyTable("customer_kyc"),
          hint: "Một cột có thể mang đồng thời PRIMARY KEY và REFERENCES. Khoá chính nên mỗi khách chỉ có một dòng hồ sơ.",
        },
      ],
      quiz: {
        question: "Bạn tạo bảng `loan_note` có cột `account_id integer REFERENCES account(account_id)`. Bảng `account.account_id` là varchar(10). Điều gì xảy ra?",
        options: [
          "Lệnh chạy bình thường, database tự đổi kiểu cho cả hai bảng",
          "Lệnh bị lỗi, vì khoá ngoại và khoá chính được trỏ tới không cùng kiểu dữ liệu",
          "Lệnh chạy nhưng khoá ngoại bị bỏ qua, không kiểm tra gì",
          "Lệnh chỉ lỗi khi bạn thêm dòng đầu tiên vào bảng",
        ],
        answer: 1,
        explain:
          "PostgreSQL kiểm tra tương thích kiểu ngay lúc tạo bảng và từ chối khoá ngoại sai kiểu (lỗi \"foreign key constraint cannot be implemented\"). Nó không tự sửa kiểu của bảng khác, không bỏ qua ràng buộc, và không đợi đến lúc thêm dòng.",
      },
    },
    {
      id: "normalization",
      trap: {
        title: "Lưu thành phố ở bảng account là lưu cùng một sự thật nhiều lần",
        text: "Khách có 4 tài khoản thì `customer_city` bị lặp 4 lần, đổi thành phố mà sửa sót một dòng là dữ liệu tự mâu thuẫn. Cột nào suy ra được từ khoá của bảng khác thì để ở bảng đó.",
      },
      title: "Phần 6: Chuẩn hoá bằng lời thường",
      scene: "normalization",
      intro: [
        "**Chuẩn hoá** (normalization) là cách chia dữ liệu vào đúng bảng để không lưu cùng một sự thật ở hai nơi. Lưu trùng thì sửa một nơi, nơi kia lệch: khách đổi thành phố mà chỉ một nửa số tài khoản được cập nhật.",
        "Mọi quy tắc chuẩn hoá dựa trên một ý: **phụ thuộc** (functional dependency). Cột A **phụ thuộc** cột B nếu biết giá trị của B là suy ra được đúng một giá trị của A. Ví dụ trong T24: biết `customer_id = 100035` là biết ngay thành phố của khách đó, nên thành phố phụ thuộc `customer_id`. Ngược lại, biết thành phố \"Hà Nội\" không suy ra được một khách cụ thể, nên `customer_id` không phụ thuộc thành phố.",
        "Từ đó có ba mức cần nhớ, mỗi mức kế thừa mức trước, ở ba phần nhỏ bên dưới. Mỗi phần đi theo cùng một đường: bảng sai, vì sao sai, bảng đã sửa.",
      ],
      quiz: {
        question: "Bảng `account(account_id, customer_id, customer_city)` có gì không ổn về chuẩn hoá?",
        options: [
          "Thiếu khoá chính",
          "customer_city suy ra được từ customer_id, nên lưu ở account là lặp thông tin của bảng customer",
          "Khoá ngoại không được phép nằm trong bảng account",
          "Có quá ít cột để gọi là một bảng",
        ],
        answer: 1,
        explain:
          "Thành phố là thông tin của khách, không phải của tài khoản; khách có 4 tài khoản thì thành phố bị lưu 4 lần và dễ lệch nhau. Bảng có khoá chính `account_id`, và khoá ngoại nằm ở account là chuyện bình thường (T24 cũng vậy). Số cột ít hay nhiều không phải tiêu chí chuẩn hoá.",
      },
      parts: [
        {
          id: "normal-1nf",
          title: "1NF: mỗi ô một giá trị",
          intro: [
            "**Bảng sai**: `company(company_id, name, phones)` với ô `phones` ghi \"0901111111, 0902222222\". **Vì sao sai**: muốn tìm chi nhánh có số 0902222222 phải cắt chuỗi trong từng ô; muốn xoá một số phải sửa chuỗi; và không đặt được ràng buộc nào lên từng số. Một ô chứa nhiều giá trị là vi phạm **1NF** (dạng chuẩn 1).",
            "**Bảng đã sửa**: tách ra bảng riêng, mỗi số một dòng: `branch_phone(company_id FK, phone)`. Khoá chính là cặp `(company_id, phone)`, vì một chi nhánh có nhiều số nhưng cùng một số không lặp lại trong cùng chi nhánh.",
          ],
          sql: [
            {
              prompt: "Chuẩn hoá 1NF: ngân hàng muốn lưu **nhiều số điện thoại cho mỗi chi nhánh**. Đừng nhét danh sách vào một cột. Tạo bảng `branch_phone` có `company_id varchar(9)` (bắt buộc, khoá ngoại về `company(company_id)`), `phone varchar(15)` (bắt buộc), và khoá chính phức hợp `(company_id, phone)`.",
              starter: "CREATE TABLE branch_phone (\n  company_id varchar(9)  NOT NULL REFERENCES company(company_id),\n  phone      varchar(15) NOT NULL,\n  PRIMARY KEY (____)\n);",
              solution: "CREATE TABLE branch_phone (company_id varchar(9) NOT NULL REFERENCES company(company_id), phone varchar(15) NOT NULL, PRIMARY KEY (company_id, phone))",
              verify: verifyTable("branch_phone"),
              hint: "Cùng dạng với bảng đồng sở hữu: khoá chính gộp hai cột.",
            },
          ],
        },
        {
          id: "normal-2nf",
          title: "2NF: phụ thuộc cả khoá, không chỉ một phần",
          intro: [
            "2NF chỉ đáng lo khi khoá chính gồm **nhiều cột**. **Bảng sai**: bảng đồng sở hữu `account_holder(account_id, customer_id, customer_name)` với khoá chính `(account_id, customer_id)`. **Vì sao sai**: `customer_name` chỉ phụ thuộc `customer_id`, tức **một phần** của khoá; biết `customer_id` đã đủ suy ra tên, không cần `account_id`. Hệ quả: khách đứng tên 3 tài khoản thì tên bị lưu 3 lần, đổi tên mà sót một dòng là lệch.",
            "**Bảng đã sửa**: bỏ `customer_name` khỏi `account_holder`, chỉ giữ `(account_id, customer_id)` và những cột cần cả cặp (như vai trò đứng tên). Tên khách để ở bảng `customer`, nơi khoá chính chính là `customer_id`. Phép thử: với mỗi cột thường, hỏi \"chỉ cần một phần của khoá có suy ra được cột này không?\". Có là vi phạm 2NF.",
          ],
        },
        {
          id: "normal-3nf",
          title: "3NF: không phụ thuộc qua một cột thường khác",
          intro: [
            "**Bảng sai**: `customer(customer_id, sector_id, sector_description)`. **Vì sao sai**: `sector_description` không trực tiếp nói về khách. Nó phụ thuộc `sector_id` (biết mã nhóm là biết mô tả), và `sector_id` mới phụ thuộc `customer_id`. Đó là **phụ thuộc bắc cầu**: `customer_id` suy ra `sector_id`, `sector_id` suy ra mô tả. Hệ quả: T24 có 27 khách cùng nhóm `1000`, nên mô tả của nhóm đó sẽ lặp 27 lần.",
            "**Bảng đã sửa**: `customer` chỉ giữ `sector_id` làm khoá ngoại, còn mô tả nằm ở bảng `sector(sector_id, description)`. T24 giả lập làm đúng như vậy. Câu thần chú cho cả ba mức: mọi cột phải nói về \"khoá, cả khoá, và chỉ khoá\" (1NF, 2NF, 3NF).",
            "Chuẩn hoá cũng có giá: dữ liệu rải nhiều bảng thì khi đọc phải ghép lại (bài JOIN sẽ dạy). Với dữ liệu giao dịch, người ta chuẩn hoá trước, và chỉ lặp dữ liệu có chủ đích khi thật sự cần nhanh. Giờ thử nhận dạng các vi phạm trong widget.",
          ],
          widget: "sql-erd-normal",
          widgetTitle: "Bảng này vi phạm dạng chuẩn nào?",
          sql: [
            {
              prompt: "Chuẩn hoá 3NF: thẻ tín dụng có tên sản phẩm (\"Visa Gold\"...). Đừng lặp tên ở mỗi thẻ. Trong **một** lần chạy, tạo bảng danh mục `card_product` (`product_code varchar(6)` khoá chính, `product_name varchar(30)` bắt buộc) **trước**, rồi bảng `credit_card` (`card_no varchar(16)` khoá chính, `product_code varchar(6)` bắt buộc khoá ngoại về `card_product`, `account_id varchar(10)` bắt buộc khoá ngoại về `account`). Chấm so sánh bảng `credit_card`.",
              starter: "CREATE TABLE card_product (\n  \n);\n\nCREATE TABLE credit_card (\n  \n);",
              solution: "CREATE TABLE card_product (product_code varchar(6) PRIMARY KEY, product_name varchar(30) NOT NULL); CREATE TABLE credit_card (card_no varchar(16) PRIMARY KEY, product_code varchar(6) NOT NULL REFERENCES card_product(product_code), account_id varchar(10) NOT NULL REFERENCES account(account_id))",
              verify: verifyTable("credit_card"),
              hint: "Bảng được trỏ tới (card_product) phải tạo trước bảng credit_card.",
            },
          ],
        },
      ],
    },
  ],
  cards: [
    { q: "Thực thể, thuộc tính và quan hệ khác nhau thế nào?", a: "Thực thể là thứ cần lưu (thành bảng), thuộc tính mô tả nó (thành cột), quan hệ là cách các thực thể liên quan nhau." },
    { q: "Làm sao xác định bản số giữa hai thực thể?", a: "Hỏi hai chiều: mỗi A có tối đa mấy B, và mỗi B có tối đa mấy A. Ra 1-1, 1-N hoặc N-N." },
    { q: "Quan hệ 1-N thì đặt khoá ngoại ở đâu?", a: "Ở bảng phía nhiều, trỏ về khoá chính phía một. Ví dụ `account.customer_id` trỏ về `customer`." },
    { q: "Quan hệ N-N được biểu diễn thế nào trong bảng?", a: "Bằng một bảng trung gian có hai khoá ngoại, khoá chính thường gộp cả hai cột. Như vậy N-N tách thành hai quan hệ 1-N." },
    { q: "Vì sao `stmt_entry.ft_id` được phép NULL?", a: "Vì nộp, rút, lãi, phí không thuộc lệnh chuyển khoản nào. 686 trong 932 bút toán có `ft_id` là NULL." },
    { q: "Chuẩn hoá nói gọn là gì?", a: "Mọi cột chỉ nói về khoá, cả khoá, và chỉ khoá. Mỗi sự thật lưu đúng một nơi, nơi khác trỏ tới bằng khoá ngoại." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Thiết kế đi từ yêu cầu nghiệp vụ đến ERD, lược đồ quan hệ, rồi CREATE TABLE. Danh từ thành thực thể (bảng), thông tin mô tả thành thuộc tính (cột), động từ thành quan hệ. Bản số 1-N đặt khoá ngoại ở phía nhiều; N-N cần bảng trung gian với khoá chính phức hợp; 1-1 cho khoá ngoại làm luôn khoá chính của bảng phụ. T24 giả lập có 11 bảng nối bằng 17 khoá ngoại, account là bảng được trỏ tới nhiều nhất. Chuẩn hoá nghĩa là mọi cột chỉ nói về khoá, cả khoá, và chỉ khoá, để mỗi sự thật chỉ lưu một nơi.",
};
