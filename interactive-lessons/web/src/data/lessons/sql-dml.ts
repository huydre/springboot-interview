import timeline from "../timelines/sql-dml.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 11. Every statement and number below was run on PostgreSQL (PGlite) against the fictional T24-style dataset in data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlDml: Lesson = {
  slug: "sql-dml",
  crumb: "INSERT UPDATE DELETE",
  videoDir: "/videos/sql-dml",
  videoVersion: "8baa57d1",
  scenes: timeline as Scene[],
  title: "INSERT, UPDATE, DELETE và Transaction",
  subtitle:
    "Thêm, sửa, xoá dữ liệu và vì sao một lệnh WHERE quên viết có thể làm hỏng cả bảng. Rồi học transaction: chuyển tiền giữa hai tài khoản sao cho tiền không bao giờ biến mất giữa chừng.",
  openingQuiz: {
    question:
      "Chuyển 5.000.000 đồng từ tài khoản A sang tài khoản B gồm hai lệnh UPDATE: trừ ở A, cộng ở B. Máy chủ sập ngay sau lệnh thứ nhất, và hai lệnh không nằm trong một transaction. Chuyện gì xảy ra với số tiền?",
    options: [
      "A đã bị trừ 5.000.000 nhưng B chưa được cộng, tiền biến mất khỏi hệ thống",
      "Cả hai tài khoản tự trở về số dư cũ vì database luôn hoàn tác lệnh dở",
      "B vẫn được cộng 5.000.000 vì database tự chạy nốt lệnh còn lại",
      "A và B cùng bị khoá cho đến khi quản trị viên mở lại",
    ],
    answer: 0,
    explain:
      "Khi không dùng transaction, mỗi lệnh tự ghi vĩnh viễn ngay khi chạy xong. Lệnh trừ tiền đã xong thì không có gì lấy lại được, còn lệnh cộng tiền chưa bao giờ chạy. Bài này dạy cách gom hai lệnh thành một khối \"hoặc cả hai, hoặc không gì\".",
  },
  roadmap: [
    "Chặng 1: INSERT, UPDATE, DELETE và RETURNING, kèm cái bẫy quên WHERE với số dòng thật.",
    "Chặng 2: database từ chối lệnh vi phạm luật (khoá chính, khoá ngoại, CHECK, NOT NULL): đọc đúng thông báo lỗi.",
    "Chặng 3: transaction (BEGIN, COMMIT, ROLLBACK), chuyển khoản hai chiều và ACID bằng lời thường.",
  ],
  sections: [
    {
      id: "insert",
      trap: {
        title: "Cột tự tăng thì đừng điền giá trị",
        text: "`stmt_entry_id` khai báo `GENERATED ALWAYS AS IDENTITY`. Điền tay vào sẽ báo `cannot insert a non-DEFAULT value into column \"stmt_entry_id\"`. Hãy bỏ cột đó ra khỏi danh sách, PostgreSQL tự cấp số tiếp theo (bút toán mới là 933).",
      },
      title: "Phần 1: INSERT, thêm dòng mới",
      scene: "insert",
      intro: [
        "Các bài trước chỉ **đọc** dữ liệu bằng `SELECT`. Bài này bắt đầu **thay đổi** dữ liệu, với ba lệnh chính:",
        "- **INSERT**: thêm dòng.",
        "- **UPDATE**: sửa dòng.",
        "- **DELETE**: xoá dòng.",
        "Nhóm lệnh này gọi chung là DML (Data Manipulation Language). Dữ liệu bạn sửa trong bài chỉ nằm trong trình duyệt của bạn, bấm \"Đặt lại dữ liệu\" là về như cũ.",
        "`INSERT` thêm một dòng mới vào bảng, giống ghi thêm một dòng vào sổ (bảng không có thứ tự, nên không có \"cuối bảng\": muốn thấy dòng mới ở đâu thì dùng `ORDER BY`). Dạng chuẩn: `INSERT INTO bảng (cột1, cột2) VALUES (giá trị1, giá trị2)`. Luôn liệt kê tên cột, để không phụ thuộc thứ tự cột trong bảng. Chuỗi và ngày nằm trong dấu nháy đơn. Thêm nhiều dòng một lệnh: viết nhiều bộ ngoặc cách nhau dấu phẩy, ví dụ `VALUES (...), (...)`. Bảng `currency` đang có 4 tiền tệ, thêm hai dòng thì còn 6.",
        "Dạng thứ ba là `INSERT ... SELECT`: thay `VALUES` bằng một câu `SELECT`, mọi dòng kết quả được chèn vào bảng đích. Đây là cách sao chép hoặc kết xuất dữ liệu từ bảng này sang bảng khác. Số cột và kiểu của `SELECT` phải khớp danh sách cột đích.",
        "Hai lưu ý: giá trị phải đúng thứ tự với danh sách cột, và chuỗi dùng nháy đơn `'...'`, nháy kép là tên cột. Cột `NOT NULL` không có giá trị mặc định mà bạn không điền thì lệnh bị từ chối.",
        "Cột bạn bỏ ra khỏi danh sách sẽ nhận **giá trị mặc định** (`DEFAULT`) khai báo lúc tạo bảng, không khai báo thì là NULL. Một kiểu mặc định đặc biệt là **cột tự tăng**: `stmt_entry_id` khai báo `GENERATED ALWAYS AS IDENTITY`, nghĩa là PostgreSQL tự cấp số tiếp theo cho mỗi dòng mới, và chữ `ALWAYS` cấm bạn tự điền (xem khung bẫy). Vì vậy khi thêm bút toán, bạn bỏ hẳn cột này khỏi danh sách.",
      ],
      sql: [
        {
          prompt: "Thêm chi nhánh Huế vào bảng `company` với mã `VN0010006`. Điền giá trị còn thiếu cho cột `name`, đúng chữ `Chi nhánh Huế`.",
          starter: "INSERT INTO company (company_id, name, city, open_date)\nVALUES ('VN0010006', ____, 'Huế', '2024-01-10');",
          solution: "INSERT INTO company (company_id, name, city, open_date) VALUES ('VN0010006', 'Chi nhánh Huế', 'Huế', '2024-01-10')",
          verify: "SELECT company_id, name, city, open_date FROM company ORDER BY company_id",
          hint: "Chuỗi nằm trong dấu nháy đơn, và giá trị thứ hai trong VALUES ứng với cột name.",
        },
        {
          prompt: "Thêm cùng lúc hai loại tiền vào bảng `currency` bằng **một** lệnh `INSERT`: `GBP` (Bảng Anh, 2 chữ số thập phân) và `CHF` (Franc Thụy Sĩ, 2 chữ số thập phân). Lệnh mẫu mới có dòng GBP, hãy thêm dòng CHF.",
          starter: "INSERT INTO currency (ccy, name, decimals)\nVALUES ('GBP', 'Bảng Anh', 2)\n;",
          solution: "INSERT INTO currency (ccy, name, decimals) VALUES ('GBP', 'Bảng Anh', 2), ('CHF', 'Franc Thụy Sĩ', 2)",
          verify: "SELECT ccy, name, decimals FROM currency ORDER BY ccy",
          hint: "Thêm dấu phẩy sau bộ ngoặc đầu, rồi viết bộ ngoặc thứ hai. Tên đúng: Franc Thụy Sĩ.",
        },
        {
          prompt: "Bảng `dormant_customer` (khách ngủ đông) đã được tạo sẵn ở dòng đầu. Viết lệnh `INSERT ... SELECT` để chép vào đó mã, họ tên và thành phố của các khách hàng có `customer_status` là `DORMANT` trong bảng `customer`.",
          starter: "CREATE TABLE dormant_customer (\n  customer_id integer PRIMARY KEY,\n  full_name   varchar(80) NOT NULL,\n  city        varchar(30)\n);\n-- viết INSERT ... SELECT ở đây\n",
          solution: "CREATE TABLE dormant_customer (customer_id integer PRIMARY KEY, full_name varchar(80) NOT NULL, city varchar(30)); INSERT INTO dormant_customer (customer_id, full_name, city) SELECT customer_id, full_name, city FROM customer WHERE customer_status = 'DORMANT'",
          verify: "SELECT customer_id, full_name, city FROM dormant_customer ORDER BY customer_id",
          hint: "INSERT INTO dormant_customer (3 cột) rồi ngay sau đó là một câu SELECT 3 cột có WHERE.",
        },
      ],
      quiz: {
        question: "Bảng `company` có cột `open_date` là NOT NULL và không có giá trị mặc định. Điều gì xảy ra với `INSERT INTO company (company_id, name, city) VALUES ('VN0010006', 'Huế', 'Huế')`?",
        options: [
          "Dòng được thêm vào và `open_date` để NULL",
          "PostgreSQL từ chối lệnh với lỗi vi phạm ràng buộc not-null, không dòng nào được thêm",
          "Dòng được thêm vào và `open_date` lấy ngày hôm nay",
          "Dòng được thêm vào và `open_date` lấy ngày 1970-01-01",
        ],
        answer: 1,
        explain: "Cột NOT NULL bắt buộc phải có giá trị. Không điền và không có DEFAULT thì lệnh bị từ chối, bảng giữ nguyên. PostgreSQL không tự bịa ngày nào cả, và NULL bị chặn đúng bởi NOT NULL.",
      },
    },
    {
      id: "update",
      trap: {
        title: "UPDATE quên WHERE là sửa cả bảng",
        text: "`UPDATE account SET status = 'CLOSED'` không có WHERE báo ảnh hưởng 85 dòng: từ 83 tài khoản `OPEN` thành cả 85 đều `CLOSED`. PostgreSQL không hỏi lại. Viết `SELECT` cùng điều kiện trước, và nhìn số \"ảnh hưởng N dòng\" sau khi chạy.",
      },
      title: "Phần 2: UPDATE và cái bẫy quên WHERE",
      scene: "update",
      intro: [
        "Phần 1 thêm dòng mới. Còn sửa một dòng đã có thì dùng `UPDATE`: nó sửa giá trị của các dòng đã có. Dạng chuẩn: `UPDATE bảng SET cột = giá trị WHERE điều kiện`. Sửa nhiều cột thì phân cách bằng dấu phẩy sau `SET`. Vế phải có thể dùng giá trị cũ của chính dòng đó: `UPDATE loan SET interest_rate = interest_rate + 0.5 WHERE status = 'LIVE'` tăng lãi suất thêm 0,5 cho đúng 12 khoản vay đang `LIVE`.",
        "`WHERE` quyết định dòng nào bị sửa, và **thiếu `WHERE` là sửa cả bảng**. Đã chạy: bảng `account` có 83 tài khoản `OPEN`; `UPDATE account SET status = 'CLOSED'` không có WHERE báo ảnh hưởng 85 dòng, cả 85 tài khoản thành `CLOSED`. PostgreSQL không hỏi lại. Tương tự `UPDATE customer SET customer_status = 'DORMANT'` không có WHERE biến cả 40 khách thành ngủ đông.",
        "Thói quen an toàn: viết câu `SELECT` với đúng điều kiện `WHERE` trước, đếm số dòng thấy hợp lý rồi mới đổi `SELECT` thành `UPDATE`. Con số \"ảnh hưởng N dòng\" sau khi chạy cũng là tín hiệu cuối cùng: bạn định sửa 1 dòng mà thấy 40 thì đã sai. Cách đảo ngược một lệnh đã chạy sẽ học ở Phần 5, bằng `ROLLBACK`.",
      ],
      sql: [
        {
          prompt: "Tài khoản `1000000080` (khoản vay đã trả hết, số dư 0) cần đóng. Đặt `status` thành `CLOSED` và `close_date` thành ngày `2024-12-31` chỉ cho tài khoản này. Điền phần còn thiếu.",
          starter: "UPDATE account\nSET status = 'CLOSED', close_date = ____\nWHERE account_id = '1000000080';",
          solution: "UPDATE account SET status = 'CLOSED', close_date = DATE '2024-12-31' WHERE account_id = '1000000080'",
          verify: "SELECT account_id, status, close_date FROM account WHERE account_id = '1000000080'",
          hint: "Ngày viết dạng DATE '2024-12-31' hoặc chỉ '2024-12-31' trong nháy đơn.",
        },
        {
          prompt: "Đây chính là cái bẫy: lệnh dưới đặt **cả 40 khách** thành `DORMANT`. Sửa lại để chỉ khách hàng `100005` bị đổi. Sau đó kiểm tra: phải còn 34 khách `ACTIVE`, 4 `DORMANT`, 2 `CLOSED`.",
          starter: "UPDATE customer\nSET customer_status = 'DORMANT';",
          solution: "UPDATE customer SET customer_status = 'DORMANT' WHERE customer_id = 100005",
          verify: "SELECT customer_status, count(*) AS so_khach FROM customer GROUP BY customer_status ORDER BY customer_status",
          hint: "Thêm một dòng WHERE vào cuối, theo khoá chính customer_id.",
        },
        {
          prompt: "Ngân hàng tăng lãi suất thêm 0,5 điểm phần trăm cho mọi khoản vay đang `LIVE`. Viết lệnh `UPDATE` cho bảng `loan` (không đụng khoản `REPAID` hay `OVERDUE`).",
          starter: "UPDATE loan\nSET interest_rate = interest_rate ____ 0.5\nWHERE ____;",
          solution: "UPDATE loan SET interest_rate = interest_rate + 0.5 WHERE status = 'LIVE'",
          verify: "SELECT ld_id, status, interest_rate FROM loan ORDER BY ld_id",
          hint: "Vế phải của SET dùng chính giá trị cũ của cột. Điều kiện lọc theo cột status.",
        },
      ],
      quiz: {
        question: "Bảng `account` có 85 dòng. Bạn chạy `UPDATE account SET working_balance = 0` mà quên `WHERE`. PostgreSQL báo bao nhiêu dòng bị ảnh hưởng?",
        options: [
          "1 dòng, vì lệnh chỉ sửa dòng đầu tiên",
          "0 dòng, vì thiếu WHERE nên lệnh bị từ chối",
          "83 dòng, vì chỉ các tài khoản đang OPEN bị sửa",
          "85 dòng, vì không có WHERE thì mọi dòng đều bị sửa",
        ],
        answer: 3,
        explain: "Không có `WHERE` nghĩa là \"mọi dòng\". PostgreSQL chạy luôn và báo 85 dòng bị ảnh hưởng. Nó không biết ý bạn muốn sửa một dòng. Lệnh vẫn hợp lệ, vì vậy tự bạn phải kiểm soát WHERE.",
      },
    },
    {
      id: "delete-returning",
      trap: {
        title: "DELETE quên WHERE là xoá sạch bảng",
        text: "`DELETE FROM stmt_entry` không có WHERE xoá cả 932 bút toán, bảng vẫn còn nhưng rỗng. Hãy chạy `SELECT` cùng điều kiện để đếm trước, hoặc bọc trong `BEGIN` và kiểm tra rồi mới `COMMIT`.",
      },
      title: "Phần 3: DELETE và RETURNING",
      scene: "delete-returning",
      intro: [
        "`DELETE FROM bảng WHERE điều kiện` xoá các dòng thoả điều kiện. Giống `UPDATE`, chính `WHERE` quyết định dòng nào bị đụng tới.",
        "Trong ngân hàng, dữ liệu giao dịch hầu như không bao giờ bị xoá thật. Người ta đổi trạng thái (`CLOSED`, `FAILED`) để giữ lịch sử. Xoá thật chỉ hợp với dữ liệu tạm hoặc dữ liệu nhập sai chưa đi vào sổ. Ví dụ, bảng `funds_transfer` có 3 lệnh chuyển khoản `FAILED` và 6 lệnh `PENDING`, đều không có bút toán nào trong `stmt_entry`, nên xoá chúng không làm lệch số dư.",
        "**RETURNING** là phần mở rộng của PostgreSQL: thêm `RETURNING cột1, cột2` vào cuối `INSERT`, `UPDATE` hoặc `DELETE` để nhận lại ngay các dòng vừa bị tác động, khỏi phải `SELECT` lần nữa. Ví dụ `DELETE FROM stmt_entry WHERE stmt_entry_id = 929 RETURNING stmt_entry_id, account_id, amount` trả về dòng `929 | 1000000003 | 2000000.00`, đúng thứ vừa bị xoá. Với `INSERT`, `RETURNING stmt_entry_id` cho biết số tự tăng vừa được cấp (933).",
        "Khi xoá, dòng đang được bảng khác tham chiếu bằng khoá ngoại thì không xoá được (Phần 4 nói rõ). Trên môi trường thật không có nút \"Đặt lại dữ liệu\", nên `TRUNCATE bảng` (lệnh xoá sạch mọi dòng của bảng trong một lần, không có `WHERE`) cũng rất nguy hiểm.",
      ],
      sql: [
        {
          prompt: "Xoá mọi lệnh chuyển khoản có `status` là `FAILED` khỏi `funds_transfer`. Điền điều kiện còn thiếu. Sau lệnh, bảng còn 129 dòng.",
          starter: "DELETE FROM funds_transfer\nWHERE ____;",
          solution: "DELETE FROM funds_transfer WHERE status = 'FAILED'",
          verify: "SELECT status, count(*) AS so_lenh FROM funds_transfer GROUP BY status ORDER BY status",
          hint: "So sánh cột status với chuỗi 'FAILED'.",
        },
        {
          prompt: "Xoá các lệnh `PENDING` có `amount` nhỏ hơn 10.000.000 (chỉ các lệnh nhỏ, giữ lại lệnh `PENDING` lớn). Lệnh đã có sẵn `RETURNING ft_id, amount`: trên database thật nó trả về các dòng vừa xoá. Ở đây bảng kết quả hiện truy vấn kiểm tra thay vào đó: các lệnh `PENDING` **còn lại** sau khi xoá, chỉ còn các lệnh từ 10.000.000 trở lên.",
          starter: "DELETE FROM funds_transfer\nWHERE status = 'PENDING' AND ____\nRETURNING ft_id, amount;",
          solution: "DELETE FROM funds_transfer WHERE status = 'PENDING' AND amount < 10000000 RETURNING ft_id, amount",
          verify: "SELECT ft_id, status, amount FROM funds_transfer WHERE status = 'PENDING' ORDER BY ft_id",
          hint: "Nối hai điều kiện bằng AND. Số 10 triệu viết liền, không dấu chấm: 10000000.",
        },
        {
          prompt: "Sửa rồi xem kết quả ngay bằng `UPDATE ... RETURNING`: đổi `interest_rate` của khoản vay `LD2400013` (đang `OVERDUE`) thành 11.50 và thêm `RETURNING ld_id, interest_rate` (trên database thật nó trả về dòng vừa sửa). Ở đây bảng kết quả hiện truy vấn kiểm tra: các khoản vay `OVERDUE`, trong đó `LD2400013` mang lãi suất mới. Viết gần như từ đầu.",
          starter: "UPDATE loan\nSET ____\nWHERE ____\nRETURNING ____;",
          solution: "UPDATE loan SET interest_rate = 11.50 WHERE ld_id = 'LD2400013' RETURNING ld_id, interest_rate",
          verify: "SELECT ld_id, status, interest_rate FROM loan WHERE status = 'OVERDUE' ORDER BY ld_id",
          hint: "RETURNING đứng sau WHERE, liệt kê cột như trong SELECT.",
        },
      ],
      quiz: {
        question: "Trước khi chạy `DELETE FROM funds_transfer WHERE status = 'FAILED'` trên hệ thống thật, thói quen an toàn nhất là gì?",
        options: [
          "Chạy ngay, nếu sai thì database sẽ tự cảnh báo",
          "Bỏ WHERE đi cho nhanh rồi tự lọc kết quả sau",
          "Chạy SELECT với đúng điều kiện WHERE đó trước, đếm số dòng, rồi mới đổi sang DELETE",
          "Chạy DELETE hai lần để chắc chắn dòng đã biến mất",
        ],
        answer: 2,
        explain: "SELECT với cùng WHERE cho bạn thấy chính xác dòng nào sẽ bị xoá và có bao nhiêu dòng. Database không tự cảnh báo, bỏ WHERE là xoá cả bảng, và chạy hai lần không giúp được gì (lần hai không còn dòng nào).",
      },
    },
    {
      id: "constraint-errors",
      title: "Phần 4: Khi database từ chối, đọc lỗi ràng buộc",
      scene: "constraint-errors",
      intro: [
        "Ba phần trên đã vài lần thấy database từ chối lệnh: thiếu cột `NOT NULL`, điền tay cột tự tăng. Phần này học cách đọc các lời từ chối đó.",
        "Các **ràng buộc** (constraint) là luật gắn vào bảng: khoá chính, khoá ngoại, `CHECK`, `NOT NULL`. Mỗi lần `INSERT`, `UPDATE`, `DELETE`, PostgreSQL kiểm tra luật. Vi phạm thì **cả lệnh bị huỷ**, không dòng nào bị thay đổi, kể cả khi lệnh định sửa nhiều dòng và chỉ một dòng sai. Thông báo lỗi nói rõ luật nào bị vi phạm. Đây là thông báo thật của PostgreSQL trên dữ liệu T24.",
        "- **Khoá chính trùng**: `duplicate key value violates unique constraint \"company_pkey\"`, kèm chi tiết `Key (company_id)=(VN0010001) already exists.`",
        "- **Khoá ngoại khi thêm**: `insert or update on table \"account\" violates foreign key constraint \"account_customer_id_fkey\"`, chi tiết `Key (customer_id)=(999999) is not present in table \"customer\".`",
        "- **Khoá ngoại khi xoá**: `update or delete on table \"customer\" violates foreign key constraint \"account_customer_id_fkey\" on table \"account\"`, nghĩa là khách hàng 100002 vẫn còn tài khoản trỏ tới, nên không xoá được.",
        "- **CHECK**, khi giá trị không nằm trong danh sách cho phép: `new row for relation \"customer\" violates check constraint \"customer_customer_status_check\"` (ví dụ gán `customer_status = 'SUSPENDED'`, trong khi chỉ cho phép `ACTIVE`, `DORMANT`, `CLOSED`).",
        "- **NOT NULL**: `null value in column \"open_date\" of relation \"company\" violates not-null constraint`.",
        "Cách đọc: tên bảng và tên ràng buộc cho biết **chỗ nào**, phần `Key (...)` hoặc `Failing row contains (...)` cho biết **dòng nào**.",
        "Cách sửa phụ thuộc loại lỗi:",
        "- **Thiếu giá trị**: bổ sung.",
        "- **Giá trị ngoài danh sách**: dùng giá trị hợp lệ.",
        "- **Xoá dòng cha còn con**: hoặc xoá con trước, hoặc (thường tốt hơn trong ngân hàng) đổi trạng thái thành `CLOSED` thay vì xoá.",
        "Mỗi bài dưới đây bắt đầu bằng một lệnh lỗi: chạy để đọc lỗi, rồi sửa. Khi lệnh còn lỗi, ô kết quả chỉ hiện \"Lỗi SQL\" và không chấm.",
      ],
      sql: [
        {
          prompt: "Lệnh dưới đặt trạng thái khách hàng 100005 là `SUSPENDED` nên vi phạm ràng buộc `CHECK`. Chạy để thấy lỗi, rồi đổi thành giá trị hợp lệ `DORMANT`.",
          starter: "UPDATE customer\nSET customer_status = 'SUSPENDED'\nWHERE customer_id = 100005;",
          solution: "UPDATE customer SET customer_status = 'DORMANT' WHERE customer_id = 100005",
          verify: "SELECT customer_id, customer_status FROM customer WHERE customer_id = 100005",
          hint: "Ba giá trị hợp lệ của customer_status: ACTIVE, DORMANT, CLOSED.",
        },
        {
          prompt: "Lệnh dưới thiếu cột `open_date` nên vi phạm `NOT NULL`. Chạy để thấy lỗi, rồi thêm cột và giá trị `'2024-01-10'`.",
          starter: "INSERT INTO company (company_id, name, city)\nVALUES ('VN0010006', 'Chi nhánh Huế', 'Huế');",
          solution: "INSERT INTO company (company_id, name, city, open_date) VALUES ('VN0010006', 'Chi nhánh Huế', 'Huế', '2024-01-10')",
          verify: "SELECT company_id, name, city, open_date FROM company ORDER BY company_id",
          hint: "Thêm open_date vào danh sách cột và một giá trị tương ứng ở cuối VALUES.",
        },
        {
          prompt: "Lệnh dưới xoá khách hàng 100002 nhưng khách này còn 2 tài khoản, nên vi phạm khoá ngoại. Chạy để thấy lỗi. Thay vì xoá, hãy giữ lịch sử: đổi `customer_status` của khách này thành `CLOSED`.",
          starter: "DELETE FROM customer\nWHERE customer_id = 100002;",
          solution: "UPDATE customer SET customer_status = 'CLOSED' WHERE customer_id = 100002",
          verify: "SELECT customer_status, count(*) AS so_khach FROM customer GROUP BY customer_status ORDER BY customer_status",
          hint: "Đổi DELETE thành UPDATE ... SET ... WHERE, vẫn theo customer_id.",
        },
      ],
      takeaway: {
        lines: [
          "Đọc lỗi theo hai câu hỏi: tên bảng và tên ràng buộc cho biết **chỗ nào**, phần `Key (...)` hoặc `Failing row contains (...)` cho biết **dòng nào**.",
        ],
      },
      quiz: {
        question: "Một lệnh `UPDATE account SET status = CASE WHEN account_id < '1000000010' THEN 'CLOSED' ELSE 'FROZEN' END` sửa 85 dòng, nhưng `FROZEN` vi phạm `CHECK`. Sau khi PostgreSQL báo lỗi, bảng `account` ra sao?",
        options: [
          "Các dòng sửa trước dòng sai vẫn được giữ, chỉ dòng sai bị bỏ qua",
          "Các dòng hợp lệ được sửa, các dòng sai bị bỏ qua và ghi lỗi vào nhật ký",
          "Không dòng nào thay đổi, vì lệnh bị huỷ nguyên cả",
          "Bảng bị khoá để chờ quản trị viên xử lý",
        ],
        answer: 2,
        explain: "Một lệnh SQL là một khối không chia nhỏ: hoặc mọi dòng được sửa, hoặc không dòng nào. Trên dữ liệu T24, sau lệnh lỗi này vẫn còn nguyên 2 tài khoản `CLOSED` và 83 tài khoản `OPEN`, như trước khi chạy.",
      },
    },
    {
      id: "transaction",
      trap: {
        title: "Transaction không tự kiểm tra ý nghĩa, và quên COMMIT là mất",
        text: "Nếu lệnh cộng tiền gõ nhầm mã thành `1000000099`, `UPDATE` khớp 0 dòng, không báo lỗi, và `COMMIT` ghi luôn việc trừ tiền: tổng hai tài khoản tụt từ 126.666.000 xuống 121.666.000. Hãy kiểm tra số dòng bị ảnh hưởng trước khi `COMMIT`. Quên `COMMIT` thì thay đổi mất khi đóng kết nối.",
      },
      title: "Phần 5: Transaction, hoặc tất cả hoặc không gì",
      scene: "transaction",
      widget: "sql-dml-transaction",
      widgetTitle: "Chuyển khoản có sự cố: có và không có transaction",
      intro: [
        "Một nghiệp vụ thường cần nhiều lệnh. Chuyển 5.000.000 đồng từ tài khoản `1000000003` (số dư 75.666.000) sang `1000000011` (số dư 51.000.000) cần hai lệnh `UPDATE`: trừ ở tài khoản gửi, cộng ở tài khoản nhận. Tổng hai tài khoản trước và sau phải đúng bằng 126.666.000. Nếu chỉ chạy lệnh đầu rồi có sự cố thì tiền biến mất. Mặc định PostgreSQL ghi **mỗi lệnh riêng lẻ** ngay khi xong (gọi là autocommit), nên nó không biết hai lệnh thuộc cùng một việc.",
        "**Transaction** (giao dịch) gom nhiều lệnh thành một khối. Hình dung bạn viết nháp bằng bút chì: chưa ai tính những dòng đó, cho tới khi bạn tô mực hoặc tẩy sạch.",
        "- **BEGIN**: mở khối. Mọi lệnh sau đó chỉ tồn tại trong khối, người khác chưa thấy.",
        "- **COMMIT**: chốt cả khối, mọi thay đổi được ghi vĩnh viễn cùng lúc.",
        "- **ROLLBACK**: huỷ cả khối, mọi thay đổi từ `BEGIN` biến mất như chưa từng xảy ra.",
        "Chuyển khoản trong transaction: `BEGIN`, trừ, cộng, `COMMIT`. Sau đó số dư là 70.666.000 và 56.000.000, tổng vẫn 126.666.000.",
        "Hãy thử trong widget dưới đây. Chọn nơi xảy ra sự cố, chọn có hay không có transaction, và nhìn tổng hai tài khoản sau lần chạy thật. Không có transaction mà sự cố rơi vào giữa hai lệnh thì mất đúng 5.000.000. Có transaction thì kết quả luôn là một trong hai: chuyển xong cả hai bước, hoặc không có gì thay đổi.",
      ],
      predict: {
        question: "Không dùng transaction, sự cố xảy ra ngay sau lệnh trừ 5.000.000 ở `1000000003`. Tổng số dư hai tài khoản (ban đầu 126.666.000) còn bao nhiêu?",
        options: ["126.666.000", "121.666.000", "131.666.000", "Về lại số cũ vì database tự hoàn tác"],
        answer: 1,
        explain: "Không có transaction, lệnh trừ đã ghi ngay khi chạy xong, còn lệnh cộng chưa bao giờ chạy. Tổng tụt đúng 5.000.000, còn 121.666.000. Có transaction thì tổng luôn là 126.666.000.",
      },
      sql: [
        {
          prompt: "Bạn trừ nhầm tiền của tài khoản `1000000003` và muốn **huỷ**, không để thay đổi nào được ghi. Thay chỗ trống bằng lệnh phù hợp, để số dư của hai tài khoản vẫn là 75.666.000 và 51.000.000.",
          starter: "BEGIN;\nUPDATE account SET working_balance = working_balance - 5000000\nWHERE account_id = '1000000003';\n____;",
          solution: "BEGIN; UPDATE account SET working_balance = working_balance - 5000000 WHERE account_id = '1000000003'; ROLLBACK",
          verify: "SELECT account_id, working_balance FROM account WHERE account_id IN ('1000000003', '1000000011') ORDER BY account_id",
          hint: "Một trong hai lệnh kết thúc transaction: một lệnh chốt, một lệnh huỷ.",
        },
        {
          prompt: "Hoàn thiện chuyển khoản 5.000.000 từ `1000000003` sang `1000000011`: thêm lệnh `UPDATE` cộng tiền cho tài khoản nhận, rồi kết thúc transaction bằng lệnh chốt thay đổi.",
          starter: "BEGIN;\nUPDATE account SET working_balance = working_balance - 5000000\nWHERE account_id = '1000000003';\n-- cộng tiền cho tài khoản nhận\n____;\n____;",
          solution: "BEGIN; UPDATE account SET working_balance = working_balance - 5000000 WHERE account_id = '1000000003'; UPDATE account SET working_balance = working_balance + 5000000 WHERE account_id = '1000000011'; COMMIT",
          verify: "SELECT account_id, working_balance FROM account WHERE account_id IN ('1000000003', '1000000011') ORDER BY account_id",
          hint: "Lệnh cộng giống lệnh trừ nhưng dấu +, và trỏ tới tài khoản 1000000011. Kết thúc bằng COMMIT.",
        },
        {
          prompt: "Viết từ đầu một transaction chuyển 10.000.000 từ tài khoản `1000000013` (số dư 45.563.000) sang tài khoản `1000000011`. Sau khi chạy, số dư phải là 35.563.000 và 61.000.000.",
          starter: "-- BEGIN, hai lệnh UPDATE, rồi COMMIT\n",
          solution: "BEGIN; UPDATE account SET working_balance = working_balance - 10000000 WHERE account_id = '1000000013'; UPDATE account SET working_balance = working_balance + 10000000 WHERE account_id = '1000000011'; COMMIT",
          verify: "SELECT account_id, working_balance FROM account WHERE account_id IN ('1000000011', '1000000013') ORDER BY account_id",
          hint: "Cấu trúc y hệt bài trước, đổi số tiền và hai mã tài khoản.",
        },
      ],
      after: [
        "**Khi một lệnh lỗi giữa chừng.** Trong SqlLab, cả đoạn script được gửi đi một lượt. Nếu một lệnh ở giữa lỗi (ví dụ chèn dòng vi phạm khoá ngoại), bạn thấy \"Lỗi SQL\" và phần còn lại không chạy, nên không có kết quả để chấm. Dữ liệu không bị ghi: khối `BEGIN` chưa `COMMIT` bị huỷ. Ngay cả script không có `BEGIN` cũng vậy, vì PostgreSQL coi một chuỗi nhiều lệnh gửi cùng lúc là một transaction ngầm. Lần bấm Chạy sau luôn bắt đầu từ dữ liệu gốc. Để thấy trường hợp \"lệnh trừ đã ghi mà lệnh cộng chưa chạy\" thì dùng widget, vì widget gửi từng lệnh một như một ứng dụng thật.",
        "Trên một kết nối thật (ví dụ `psql`, hoặc ứng dụng Java), sau lỗi trong khối `BEGIN`, transaction ở trạng thái hỏng: mọi lệnh tiếp theo bị từ chối với `current transaction is aborted, commands ignored until end of transaction block`. Lúc đó `COMMIT` cũng chỉ hoạt động như `ROLLBACK`, và số dư vẫn giữ như cũ (75.666.000 ở tài khoản gửi). Việc duy nhất cần làm là `ROLLBACK`.",
      ],
      takeaway: {
        lines: [
          "Lỗi giữa khối `BEGIN` thì cả khối hỏng: việc duy nhất còn lại là `ROLLBACK`.",
        ],
      },
      quiz: {
        question: "Trong một transaction bạn chạy `BEGIN`, trừ 5.000.000 ở A, cộng 5.000.000 ở B. Ứng dụng mất kết nối với database trước khi kịp gửi `COMMIT`. Kết quả cuối cùng là gì?",
        options: [
          "A đã bị trừ nhưng B chưa được cộng, vì lệnh đầu đã chạy xong",
          "B được cộng nhưng A không bị trừ, vì lệnh sau chạy sau cùng",
          "PostgreSQL tự động COMMIT khi kết nối đứt để tránh mất dữ liệu",
          "Cả A và B giữ số dư cũ, vì giao dịch chưa COMMIT bị huỷ",
        ],
        answer: 3,
        explain: "Thay đổi trong transaction chưa `COMMIT` chỉ là tạm. Khi kết nối đứt, PostgreSQL huỷ cả khối nên không tài khoản nào đổi. Nó không bao giờ tự COMMIT, vì như thế sẽ ghi một khoản chuyển dở dang.",
      },
    },
    {
      id: "acid-transfer",
      trap: {
        title: "Thêm bút toán trước khi có lệnh chuyển khoản sẽ lỗi khoá ngoại",
        text: "`stmt_entry.ft_id` là khoá ngoại tới `funds_transfer`, nên phải thêm dòng `funds_transfer` trước. Làm ngược lại báo `violates foreign key constraint \"stmt_entry_ft_id_fkey\"`. Thứ tự các lệnh trong transaction cũng là một phần của đúng đắn.",
      },
      title: "Phần 6: ACID bằng lời thường và chuyển khoản đầy đủ",
      scene: "acid-transfer",
      intro: [
        "Phần 5 đã thấy transaction giữ tiền không mất giữa hai bước. **ACID** là bốn lời hứa của một transaction:",
        "- **Atomicity** (nguyên tử): tất cả hoặc không gì, như chuyển khoản trên đây.",
        "- **Consistency** (nhất quán): sau transaction, dữ liệu vẫn thoả mọi luật, tức khoá chính, khoá ngoại, `CHECK`, `NOT NULL`. Còn quy tắc nghiệp vụ như \"tổng tiền không đổi\" do bạn viết đúng lệnh, database chỉ giữ luật bạn đã khai báo.",
        "- **Isolation** (cô lập): nhiều transaction chạy cùng lúc không nhìn thấy phần dở dang của nhau. Mặc định PostgreSQL chỉ cho transaction khác thấy dữ liệu **đã COMMIT**.",
        "- **Durability** (bền vững): đã `COMMIT` thì dù mất điện ngay sau đó, dữ liệu vẫn còn, vì PostgreSQL ghi nhật ký xuống đĩa trước khi báo thành công.",
        "(Bản PostgreSQL trong trình duyệt của khoá học nằm trong bộ nhớ, nên chỉ minh hoạ ba tính chất đầu.)",
        "Một chuyển khoản thật không chỉ sửa số dư. Trong dữ liệu T24, số dư của tài khoản bằng tổng các bút toán `stmt_entry` của nó (tài khoản `1000000003` có 15 bút toán cộng lại đúng 75.666.000). Vì vậy chuyển khoản đầy đủ gồm:",
        "- **Một dòng `funds_transfer`**: trạng thái `DONE`.",
        "- **Hai lệnh `UPDATE`**: trừ và cộng số dư.",
        "- **Hai bút toán chung `ft_id`**: mã `201` ghi nợ (số âm) ở tài khoản gửi, mã `202` ghi có (số dương) ở tài khoản nhận.",
        "Tất cả trong một transaction, để không bao giờ có số dư mà thiếu bút toán. **Thứ tự** cũng quan trọng: `stmt_entry.ft_id` là khoá ngoại trỏ tới `funds_transfer`, nên dòng `funds_transfer` phải được thêm **trước** hai bút toán. Làm ngược lại thì bút toán trỏ tới một lệnh chưa tồn tại và bị từ chối với lỗi khoá ngoại (xem khung bẫy).",
      ],
      sql: [
        {
          prompt: "Hoàn thiện chuyển khoản 5.000.000 VND từ `1000000003` sang `1000000011` với mã `FT240000140`: thêm **hai bút toán** vào `stmt_entry` (mã `201` số âm ở tài khoản gửi, mã `202` số dương ở tài khoản nhận, ngày `2024-12-31`, cùng `ft_id`). Kiểm tra: số dư mỗi tài khoản phải bằng tổng bút toán của nó.",
          starter: "BEGIN;\nINSERT INTO funds_transfer (ft_id, debit_account, credit_account, amount, ccy, processing_date, status, narrative)\nVALUES ('FT240000140', '1000000003', '1000000011', 5000000, 'VND', '2024-12-31', 'DONE', 'Chuyen khoan tien nha');\nUPDATE account SET working_balance = working_balance - 5000000 WHERE account_id = '1000000003';\nUPDATE account SET working_balance = working_balance + 5000000 WHERE account_id = '1000000011';\n-- hai bút toán vào stmt_entry\n____;\nCOMMIT;",
          solution: "BEGIN; INSERT INTO funds_transfer (ft_id, debit_account, credit_account, amount, ccy, processing_date, status, narrative) VALUES ('FT240000140', '1000000003', '1000000011', 5000000, 'VND', '2024-12-31', 'DONE', 'Chuyen khoan tien nha'); UPDATE account SET working_balance = working_balance - 5000000 WHERE account_id = '1000000003'; UPDATE account SET working_balance = working_balance + 5000000 WHERE account_id = '1000000011'; INSERT INTO stmt_entry (account_id, txn_code, amount, booking_date, value_date, ft_id) VALUES ('1000000003', 201, -5000000, '2024-12-31', '2024-12-31', 'FT240000140'), ('1000000011', 202, 5000000, '2024-12-31', '2024-12-31', 'FT240000140'); COMMIT",
          verify: "SELECT a.account_id, a.working_balance, (SELECT sum(s.amount) FROM stmt_entry s WHERE s.account_id = a.account_id) AS tong_but_toan, (SELECT count(*) FROM stmt_entry s WHERE s.ft_id = 'FT240000140') AS so_but_toan_cua_ft FROM account a WHERE a.account_id IN ('1000000003', '1000000011') ORDER BY a.account_id",
          hint: "Một lệnh INSERT INTO stmt_entry (account_id, txn_code, amount, booking_date, value_date, ft_id) với hai bộ VALUES. Không điền stmt_entry_id.",
        },
        {
          prompt: "Viết từ đầu một chuyển khoản đầy đủ 3.000.000 VND từ `1000000013` sang `1000000003` với mã `FT240000141`, ngày `2024-12-31`, `narrative` là `Hoan tien`. Gồm: `BEGIN`, một dòng `funds_transfer` (`DONE`), hai `UPDATE` số dư, hai bút toán `201` và `202`, `COMMIT`.",
          starter: "-- BEGIN; funds_transfer; 2 UPDATE; 2 bút toán; COMMIT;\n",
          solution: "BEGIN; INSERT INTO funds_transfer (ft_id, debit_account, credit_account, amount, ccy, processing_date, status, narrative) VALUES ('FT240000141', '1000000013', '1000000003', 3000000, 'VND', '2024-12-31', 'DONE', 'Hoan tien'); UPDATE account SET working_balance = working_balance - 3000000 WHERE account_id = '1000000013'; UPDATE account SET working_balance = working_balance + 3000000 WHERE account_id = '1000000003'; INSERT INTO stmt_entry (account_id, txn_code, amount, booking_date, value_date, ft_id) VALUES ('1000000013', 201, -3000000, '2024-12-31', '2024-12-31', 'FT240000141'), ('1000000003', 202, 3000000, '2024-12-31', '2024-12-31', 'FT240000141'); COMMIT",
          verify: "SELECT a.account_id, a.working_balance, (SELECT sum(s.amount) FROM stmt_entry s WHERE s.account_id = a.account_id) AS tong_but_toan, (SELECT count(*) FROM stmt_entry s WHERE s.ft_id = 'FT240000141') AS so_but_toan_cua_ft FROM account a WHERE a.account_id IN ('1000000003', '1000000013') ORDER BY a.account_id",
          hint: "Thứ tự: funds_transfer trước, rồi hai UPDATE, rồi hai bút toán (khoá ngoại ft_id cần dòng funds_transfer đã có). Số dư của 1000000013 phải còn 42.563.000.",
        },
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "`stmt_entry.ft_id` trỏ tới `funds_transfer` → thêm `funds_transfer` trước, bút toán sau → gói tất cả trong một transaction để số dư không bao giờ thiếu bút toán.",
        ],
      },
      quiz: {
        question: "Ngay sau khi COMMIT chuyển khoản thành công, máy chủ database mất điện. Khi bật lại, khoản chuyển vẫn còn nguyên. Tính chất nào của ACID bảo đảm điều đó?",
        options: [
          "Atomicity, vì các lệnh trong giao dịch cùng thành công hoặc cùng thất bại",
          "Consistency, vì dữ liệu sau giao dịch vẫn thoả các ràng buộc khai báo",
          "Isolation, vì giao dịch khác không thấy dữ liệu dở dang của giao dịch này",
          "Durability, vì dữ liệu đã COMMIT được ghi bền xuống đĩa trước khi báo xong",
        ],
        answer: 3,
        explain: "Ba lựa chọn còn lại là tính chất thật của ACID nhưng nói về chuyện khác: atomicity là tất cả hoặc không gì, consistency là giữ luật dữ liệu, isolation là các giao dịch đồng thời không nhìn thấy dở dang của nhau. Chuyện dữ liệu sống sót qua mất điện là durability.",
      },
    },
  ],
  cards: [
    { q: "Ba lệnh DML chính là gì?", a: "`INSERT` thêm dòng, `UPDATE` sửa dòng, `DELETE` xoá dòng." },
    { q: "Vì sao nên liệt kê tên cột trong `INSERT`?", a: "Để không phụ thuộc thứ tự cột của bảng. Giá trị phải đúng thứ tự với danh sách cột." },
    { q: "Quên `WHERE` trong `UPDATE` hoặc `DELETE` thì sao?", a: "Tác động mọi dòng của bảng, không có cảnh báo. Viết `SELECT` cùng điều kiện trước để đếm." },
    { q: "`RETURNING` dùng để làm gì?", a: "Nhận lại ngay các dòng vừa bị thêm, sửa, xoá, khỏi phải `SELECT` lại. Chỉ có ở PostgreSQL." },
    { q: "Transaction gồm những lệnh nào và làm gì?", a: "`BEGIN` mở khối, `COMMIT` chốt, `ROLLBACK` huỷ. Tất cả hoặc không gì." },
    { q: "ACID gồm gì? Nói gọn từng chữ.", a: "Atomicity: tất cả hoặc không gì. Consistency: vẫn thoả mọi luật. Isolation: không thấy phần dở của nhau. Durability: đã COMMIT thì còn." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "`INSERT` thêm dòng (một dòng, nhiều dòng, hoặc từ `SELECT`), `UPDATE` sửa dòng, `DELETE` xoá dòng. Hai lệnh sau luôn phải có `WHERE`: quên nó thì sửa hoặc xoá mọi dòng, như 85 tài khoản hay 932 bút toán. `RETURNING` trả lại ngay các dòng vừa bị tác động. Vi phạm khoá chính, khoá ngoại, `CHECK` hay `NOT NULL` thì cả lệnh bị huỷ, thông báo lỗi nêu tên ràng buộc và dòng sai. Transaction (`BEGIN`, `COMMIT`, `ROLLBACK`) gom nhiều lệnh thành một khối để chuyển khoản không làm mất tiền giữa hai bước. ACID là nguyên tử, nhất quán, cô lập và bền vững.",
};
