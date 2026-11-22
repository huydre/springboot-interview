import timeline from "../timelines/sql-aggregate.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 5. Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlAggregate: Lesson = {
  slug: "sql-aggregate",
  crumb: "Hàm tổng hợp",
  videoDir: "/videos/sql-aggregate",
  videoVersion: "12ffcf56",
  scenes: timeline as Scene[],
  title: "Hàm tổng hợp, GROUP BY và HAVING",
  subtitle:
    "Đếm, cộng, tính trung bình, tìm nhỏ nhất và lớn nhất; rồi gom dòng thành nhóm để trả lời các câu hỏi báo cáo như số dư theo chi nhánh hay số lệnh chuyển khoản mỗi ngày.",
  openingQuiz: {
    question: "Giám đốc hỏi \"mỗi chi nhánh đang có bao nhiêu tài khoản?\". Câu trả lời nên có hình dạng nào?",
    options: [
      "85 dòng, mỗi tài khoản một dòng, để giám đốc tự đếm",
      "5 dòng, mỗi chi nhánh một dòng kèm số tài khoản của chi nhánh đó",
      "1 dòng duy nhất ghi tổng số tài khoản của cả ngân hàng",
      "5 cột, mỗi chi nhánh một cột chứa mã tài khoản",
    ],
    answer: 1,
    explain: "Câu hỏi \"mỗi chi nhánh\" cần một dòng cho mỗi chi nhánh, trong đó có một con số tổng hợp. Danh sách 85 tài khoản chưa trả lời gì, còn một con số duy nhất thì mất thông tin theo chi nhánh. Bài này dạy cách tạo đúng kiểu kết quả đó.",
  },
  roadmap: [
    "Chặng 1: các hàm tổng hợp COUNT, SUM, AVG, MIN, MAX và cách chúng đối xử với NULL.",
    "Chặng 2: GROUP BY, gom dòng thành nhóm, và lỗi \"cột phải nằm trong GROUP BY\".",
    "Chặng 3: HAVING lọc nhóm, phân biệt với WHERE lọc dòng, rồi ghép thành báo cáo ngân hàng.",
  ],
  sections: [
    {
      id: "count-basics",
      trap: {
        title: "COUNT(*) và COUNT(cột) không đếm giống nhau",
        text: "Trên `customer`, `COUNT(*)` ra 40, `COUNT(mobile)` ra 34, `COUNT(email)` ra 31, vì `COUNT(cột)` bỏ qua NULL. Muốn đếm số dòng thì dùng `COUNT(*)`. Chỉ dùng `COUNT(cột)` khi cố ý đếm các dòng đã có giá trị.",
      },
      title: "Phần 1: Đếm dòng với COUNT",
      scene: "count-basics",
      intro: [
        "Cho tới giờ mỗi câu SQL trả về nhiều dòng, mỗi dòng ứng với một dòng của bảng. **Hàm tổng hợp** (aggregate function) làm khác đi: nó đọc nhiều dòng rồi **nén thành một giá trị**. Giống như bạn nhìn cả sổ tiết kiệm và chỉ ghi lại \"có 85 tài khoản\". Hàm tổng hợp đầu tiên là `COUNT`, dùng để đếm.",
        "`COUNT` có ba cách viết, và chúng đếm khác nhau:",
        "- **`COUNT(*)`**: đếm **số dòng**, bất kể dòng đó chứa gì.",
        "- **`COUNT(cột)`**: chỉ đếm những dòng mà cột đó **không phải NULL**.",
        "- **`COUNT(DISTINCT cột)`**: đếm số **giá trị khác nhau** của cột, mỗi giá trị chỉ tính một lần.",
        "Ví dụ trên bảng `customer`: có 40 khách (`COUNT(*)`), trong đó 34 người có số điện thoại (`COUNT(mobile)`), 31 người có email (`COUNT(email)`).",
        "`COUNT(DISTINCT ...)` rất hữu ích khi một đối tượng xuất hiện nhiều dòng. Bảng `account` có 36 tài khoản thanh toán loại 1001, nhưng chúng chỉ thuộc về 27 khách hàng khác nhau, vì có khách mở nhiều tài khoản. `COUNT(*)` cho 36, còn `COUNT(DISTINCT customer_id)` cho 27. Cách nhớ: đếm \"tài khoản\" thì dùng `COUNT(*)`, đếm \"bao nhiêu khách\" thì dùng `COUNT(DISTINCT customer_id)`.",
      ],
      sql: [
        {
          prompt: "Đếm xem ngân hàng có bao nhiêu khách hàng. Điền vào chỗ trống để đếm số dòng của bảng `customer`.",
          starter: "SELECT COUNT(____) AS so_khach\nFROM customer;",
          solution: "SELECT COUNT(*) AS so_khach FROM customer",
          hint: "Muốn đếm số dòng mà không quan tâm cột nào, dùng dấu sao.",
        },
        {
          prompt: "Trong một câu, đếm tổng số khách, số khách có số điện thoại (`mobile`) và số khách có email. Kết quả đúng là 40, 34 và 31.",
          starter: "SELECT COUNT(*) AS so_khach,\n       COUNT(____) AS co_mobile,\n       COUNT(____) AS co_email\nFROM customer;",
          solution: "SELECT COUNT(*) AS so_khach, COUNT(mobile) AS co_mobile, COUNT(email) AS co_email FROM customer",
          hint: "COUNT(tên cột) tự bỏ qua các dòng NULL.",
        },
        {
          prompt: "Với các tài khoản thanh toán loại `category_id = 1001`, đếm số tài khoản và số khách hàng khác nhau sở hữu chúng. Kết quả đúng là 36 và 27.",
          starter: "SELECT COUNT(*) AS so_tai_khoan,\n       COUNT(DISTINCT ____) AS so_khach\nFROM account\nWHERE category_id = 1001;",
          solution: "SELECT COUNT(*) AS so_tai_khoan, COUNT(DISTINCT customer_id) AS so_khach FROM account WHERE category_id = 1001",
          hint: "Khách hàng được nhận diện bằng cột customer_id.",
        },
      ],
      quiz: {
        question: "Bảng `customer` có 40 dòng, trong đó 34 người có số điện thoại. Biểu thức nào cho ra số khách CHƯA có số điện thoại?",
        options: [
          "COUNT(mobile), vì nó đếm các dòng thiếu dữ liệu",
          "COUNT(*) - COUNT(mobile), tức 40 trừ 34",
          "COUNT(DISTINCT mobile), vì nó đếm giá trị lạ",
          "COUNT(*) + COUNT(mobile), tức 40 cộng 34",
        ],
        answer: 1,
        explain: "COUNT(mobile) bỏ qua NULL nên chỉ cho 34 (số người CÓ số). Lấy tổng số dòng trừ đi số dòng có giá trị thì ra 6 người thiếu số. COUNT(DISTINCT mobile) đếm số điện thoại khác nhau, không liên quan tới NULL. Phép cộng cho 74, vô nghĩa.",
      },
    },
    {
      id: "sum-avg",
      trap: {
        title: "SUM trên tập rỗng là NULL, không phải 0",
        text: "Nếu `WHERE` lọc hết dòng, `SUM(working_balance)` trả NULL còn `COUNT(*)` trả 0. Báo cáo hiện ô trống thay vì số 0. Bọc bằng `COALESCE(SUM(...), 0)` khi cần số (`COALESCE` trả về giá trị đầu tiên khác NULL, học ở bài 7 \"Xử lý dữ liệu\").",
      },
      title: "Phần 2: SUM, AVG, MIN, MAX và NULL",
      scene: "sum-avg",
      intro: [
        "`COUNT` chỉ trả lời \"bao nhiêu dòng\". Muốn biết tổng tiền, trung bình hay giá trị lớn nhất thì cần bốn hàm tổng hợp còn lại, làm việc trên một **cột số** (hoặc ngày):",
        "- **`SUM(cột)`**: cộng tất cả giá trị.",
        "- **`AVG(cột)`**: tính trung bình.",
        "- **`MIN(cột)` và `MAX(cột)`**: tìm giá trị nhỏ nhất và lớn nhất.",
        "`MIN`/`MAX` dùng được cả với ngày và chữ, ví dụ `MIN(processing_date)` là ngày chuyển khoản sớm nhất (2024-01-04), `MAX(processing_date)` là ngày muộn nhất (2024-12-28).",
        "Ví dụ ngân hàng: trong `funds_transfer`, các lệnh `DONE` (đã hoàn tất) có 123 lệnh, tổng 819.011.621, nhỏ nhất 42 và lớn nhất 30.000.000. Cảnh báo về tiền tệ: bảng `account` có VND, USD và EUR. Cộng số dư của các loại tiền khác nhau là vô nghĩa, nên khi tính tổng số dư hãy lọc `WHERE ccy = 'VND'` (75 tài khoản). Với VND: tổng số dư 17.342.070.666, thấp nhất -733.334.000, cao nhất 3.052.868.789. Số âm là các tài khoản vay, vì khách đang nợ ngân hàng.",
        "**Quy tắc vàng về NULL: mọi hàm tổng hợp đều bỏ qua NULL** (trừ `COUNT(*)`). Ví dụ `AVG` của ba giá trị 10, 20, NULL là 15, không phải 10. NULL không bị coi là 0, nó đơn giản không được tính, cả ở tử số lẫn mẫu số. Bài sau (bài 7) sẽ học `COALESCE` để đổi NULL thành 0.",
      ],
      sql: [
        {
          prompt: "Thống kê các lệnh chuyển khoản đã hoàn tất (`status = 'DONE'`): số lệnh, tổng tiền, lệnh nhỏ nhất và lớn nhất. Kết quả đúng: 123, 819011621, 42, 30000000.",
          starter: "SELECT COUNT(*) AS so_lenh,\n       SUM(____) AS tong_tien,\n       MIN(amount) AS nho_nhat,\n       MAX(amount) AS lon_nhat\nFROM funds_transfer\nWHERE status = 'DONE';",
          solution: "SELECT COUNT(*) AS so_lenh, SUM(amount) AS tong_tien, MIN(amount) AS nho_nhat, MAX(amount) AS lon_nhat FROM funds_transfer WHERE status = 'DONE'",
          hint: "Tổng tiền là tổng của cột amount.",
        },
        {
          prompt: "Với các tài khoản VND, tính tổng số dư, số dư trung bình, thấp nhất và cao nhất của cột `working_balance`.",
          starter: "SELECT SUM(working_balance) AS tong,\n       AVG(working_balance) AS trung_binh,\n       MIN(____) AS thap_nhat,\n       MAX(____) AS cao_nhat\nFROM account\nWHERE ccy = 'VND';",
          solution: "SELECT SUM(working_balance) AS tong, AVG(working_balance) AS trung_binh, MIN(working_balance) AS thap_nhat, MAX(working_balance) AS cao_nhat FROM account WHERE ccy = 'VND'",
          hint: "Cả MIN và MAX đều nhận cột working_balance.",
        },
        {
          prompt: "Tìm ngày chuyển khoản sớm nhất và muộn nhất trong bảng `funds_transfer` (cột `processing_date`). Đặt tên cột là `som_nhat` và `muon_nhat`.",
          starter: "SELECT\nFROM funds_transfer;",
          solution: "SELECT MIN(processing_date) AS som_nhat, MAX(processing_date) AS muon_nhat FROM funds_transfer",
          hint: "MIN và MAX dùng được với cột kiểu date.",
        },
      ],
      quiz: {
        question: "Cột `x` của một bảng có ba dòng giá trị 10, 20 và NULL. `AVG(x)` trả về bao nhiêu?",
        options: [
          "10, vì NULL được tính là 0 nên (10 + 20 + 0) / 3",
          "15, vì NULL bị bỏ qua nên (10 + 20) / 2",
          "NULL, vì có một giá trị NULL trong cột",
          "Báo lỗi, vì cột có NULL không tính trung bình được",
        ],
        answer: 1,
        explain: "Hàm tổng hợp bỏ qua NULL: chỉ 2 giá trị được tính, trung bình là 15. NULL không bị đổi thành 0 (đó là lý do kết quả không phải 10), và cũng không làm cả phép tính thành NULL hay báo lỗi.",
      },
    },
    {
      id: "group-by",
      title: "Phần 3: GROUP BY, gom dòng thành nhóm",
      scene: "group-by",
      widget: "sql-aggregate-groups",
      widgetTitle: "Xem các dòng được gom thành nhóm trước khi COUNT và SUM chạy",
      intro: [
        "Đến giờ hàm tổng hợp nén cả bảng thành một dòng. Nhưng báo cáo thường hỏi \"**mỗi** chi nhánh\", \"**mỗi** ngày\", \"**mỗi** loại sản phẩm\". Khi đó ta thêm `GROUP BY cột`: SQL xếp các dòng có cùng giá trị của cột đó vào **một nhóm**, rồi chạy hàm tổng hợp **riêng trong từng nhóm**. Mỗi nhóm cho ra đúng một dòng kết quả.",
        "Ví dụ `SELECT company_id, COUNT(*) FROM account GROUP BY company_id` cho 5 dòng (5 chi nhánh): VN0010001 có 19 tài khoản, VN0010002 có 14, VN0010003 có 17, VN0010004 có 18 và VN0010005 có 17. Tổng 85 đúng bằng số dòng của bảng. Tương tự, nếu thêm `WHERE ccy = 'VND'` rồi dùng `SUM(working_balance)`, ta có tổng số dư VND của từng chi nhánh: từ 1.735.009.101 (VN0010001) đến 4.877.395.569 (VN0010002).",
        "Để thấy tận mắt, hãy thao tác widget bên dưới: nó lấy 9 tài khoản tiết kiệm có thật (loại 6006), xếp thành nhóm theo chi nhánh rồi mới chạy `COUNT` và `SUM`. Bấm lần lượt từ bước 1 tới bước 4.",
        "Bảng `account` có cột `category_id` (loại sản phẩm: 1001, 1002 thanh toán; 6001, 6006, 6012 tiết kiệm; 3001, 3002 vay). Nhóm sản phẩm `product_group` nằm ở bảng `category`, cần JOIN ở bài sau, nên bài này tạm dùng `category_id`.",
      ],
      predict: {
        question: "9 tài khoản tiết kiệm loại 6006 nằm rải ở 5 chi nhánh. Chạy `GROUP BY company_id` kèm `SUM(working_balance)` thì kết quả trông thế nào?",
        options: [
          "9 dòng, mỗi tài khoản một dòng kèm số dư của nó",
          "5 dòng, mỗi chi nhánh một dòng kèm tổng số dư của nhóm đó",
          "1 dòng, tổng số dư của cả 9 tài khoản",
          "5 dòng, mỗi chi nhánh kèm số dư của tài khoản đầu tiên",
        ],
        answer: 1,
        explain: "GROUP BY xếp các dòng cùng chi nhánh vào một nhóm, rồi SUM chạy riêng trong từng nhóm. 5 chi nhánh thành 5 nhóm, mỗi nhóm cho đúng một dòng. Bước 2 và bước 4 của widget cho thấy điều đó.",
      },
      sql: [
        {
          prompt: "Đếm số tài khoản của từng chi nhánh (cột `company_id`), xếp theo mã chi nhánh. Kết quả đúng: 19, 14, 17, 18, 17.",
          starter: "SELECT company_id, COUNT(*) AS so_tai_khoan\nFROM account\nGROUP BY ____\nORDER BY company_id;",
          solution: "SELECT company_id, COUNT(*) AS so_tai_khoan FROM account GROUP BY company_id ORDER BY company_id",
          hint: "Cột đứng sau GROUP BY là cột bạn muốn mỗi giá trị thành một nhóm.",
          ordered: true,
        },
        {
          prompt: "Tính tổng số dư của các tài khoản VND theo từng chi nhánh (đặt tên `tong_so_du`), xếp theo mã chi nhánh. Nhớ lọc tiền VND bằng `WHERE` trước khi gom nhóm.",
          starter: "SELECT company_id, SUM(working_balance) AS tong_so_du\nFROM account\nWHERE ____\nGROUP BY company_id\nORDER BY company_id;",
          solution: "SELECT company_id, SUM(working_balance) AS tong_so_du FROM account WHERE ccy = 'VND' GROUP BY company_id ORDER BY company_id",
          hint: "WHERE đứng trước GROUP BY và lọc theo cột ccy.",
          ordered: true,
        },
        {
          prompt: "Với bảng `funds_transfer`, thống kê theo trạng thái (`status`): số lệnh và tổng tiền. Đặt tên `so_lenh` và `tong_tien`, xếp theo `status`. Kết quả đúng: DONE 123 lệnh, FAILED 3 lệnh, PENDING 6 lệnh.",
          starter: "SELECT status, COUNT(*) AS so_lenh, SUM(amount) AS tong_tien\nFROM funds_transfer\n;",
          solution: "SELECT status, COUNT(*) AS so_lenh, SUM(amount) AS tong_tien FROM funds_transfer GROUP BY status ORDER BY status",
          hint: "Thêm GROUP BY status rồi ORDER BY status.",
          ordered: true,
        },
      ],
      takeaway: {
        lines: [
          "Thứ tự chạy: **FROM**, rồi **WHERE** (lọc dòng), rồi **GROUP BY** (gom nhóm), rồi **hàm tổng hợp** trong SELECT. Mỗi nhóm cho đúng một dòng kết quả.",
        ],
      },
      quiz: {
        question: "Bảng `account` có 85 dòng và 5 chi nhánh khác nhau. `SELECT company_id, COUNT(*) FROM account GROUP BY company_id` trả về bao nhiêu dòng?",
        options: [
          "85 dòng, mỗi tài khoản một dòng như trước",
          "5 dòng, mỗi chi nhánh là một nhóm và mỗi nhóm một dòng",
          "1 dòng, vì COUNT luôn nén cả bảng thành một dòng",
          "17 dòng, là trung bình số tài khoản mỗi chi nhánh",
        ],
        answer: 1,
        explain: "GROUP BY cho đúng một dòng mỗi nhóm, mà có 5 giá trị company_id khác nhau nên có 5 nhóm. Không có GROUP BY thì COUNT mới nén cả bảng thành 1 dòng. 85 dòng chỉ xảy ra khi không dùng hàm tổng hợp. 17 là phép chia, SQL không tự làm.",
      },
    },
    {
      id: "group-rules",
      trap: {
        title: "Cột nào không gom thì phải nằm trong hàm tổng hợp",
        text: "`SELECT company_id, category_id, COUNT(*) ... GROUP BY company_id` báo lỗi `column \"account.category_id\" must appear in the GROUP BY clause or be used in an aggregate function`. Mỗi chi nhánh có nhiều loại sản phẩm nên database không đoán được hiển thị loại nào. Thêm cột vào `GROUP BY` hoặc bọc nó bằng `MIN`/`MAX`.",
      },
      title: "Phần 4: Quy tắc của GROUP BY và lỗi hay gặp",
      scene: "group-rules",
      intro: [
        "**Quy tắc cốt lõi.** Sau `GROUP BY`, mỗi nhóm chỉ còn **một dòng** kết quả. Vì vậy mọi cột trong `SELECT` phải hoặc nằm trong `GROUP BY` (cả nhóm chung một giá trị), hoặc nằm trong hàm tổng hợp (gộp nhiều giá trị thành một). Ví dụ `SELECT company_id, category_id, COUNT(*) FROM account GROUP BY company_id` báo lỗi `column \"account.category_id\" must appear in the GROUP BY clause or be used in an aggregate function`. Lý do: nhóm VN0010001 có tài khoản loại 1001, 1002, 3001..., mà nhóm chỉ có một dòng, database không biết hiện `category_id` nào. Hai cách sửa: thêm `category_id` vào `GROUP BY` (mỗi cặp chi nhánh, loại một dòng), hoặc bọc nó trong hàm tổng hợp như `MIN(category_id)` nếu bạn chỉ cần một đại diện.",
        "**Gom theo nhiều cột.** `GROUP BY company_id, category_id` tạo một nhóm cho mỗi cặp (chi nhánh, loại sản phẩm) có xuất hiện. Dữ liệu có 29 cặp như vậy, ví dụ VN0010001 có 8 tài khoản loại 1001, 3 tài khoản loại 1002, 4 tài khoản loại 3001. Hai dòng chỉ cùng nhóm khi **tất cả** các cột trong GROUP BY đều bằng nhau.",
        "**NULL cũng thành một nhóm.** Khi gom theo cột có NULL, mọi dòng NULL được xếp chung vào một nhóm riêng (dù NULL không \"bằng\" nhau ở phép so sánh). Gom khách hàng theo `gender` cho 3 dòng: F có 16 người, M có 16 người, và nhóm NULL có 8 người (khách doanh nghiệp không có giới tính). Có thể sắp xếp kết quả theo hàm tổng hợp, ví dụ `ORDER BY COUNT(*) DESC` để chi nhánh hay thành phố đông nhất lên đầu.",
      ],
      sql: [
        {
          prompt: "Đếm số khách theo giới tính (`gender`), xếp theo `gender`. Chú ý nhóm NULL: 8 khách không có giới tính.",
          starter: "SELECT gender, COUNT(*) AS so_khach\nFROM customer\nGROUP BY ____\nORDER BY gender;",
          solution: "SELECT gender, COUNT(*) AS so_khach FROM customer GROUP BY gender ORDER BY gender",
          hint: "Đưa cột gender vào GROUP BY.",
          ordered: true,
        },
        {
          prompt: "Câu này đang lỗi vì `category_id` có trong SELECT nhưng không có trong GROUP BY. Chạy để đọc lỗi, rồi sửa để đếm số tài khoản theo từng cặp chi nhánh và loại sản phẩm (29 dòng), xếp theo `company_id` rồi `category_id`.",
          starter: "SELECT company_id, category_id, COUNT(*) AS so_tai_khoan\nFROM account\nGROUP BY company_id\nORDER BY company_id, category_id;",
          solution: "SELECT company_id, category_id, COUNT(*) AS so_tai_khoan FROM account GROUP BY company_id, category_id ORDER BY company_id, category_id",
          hint: "Hai cột đứng cạnh nhau trong SELECT thì cũng cần đứng cạnh nhau trong GROUP BY.",
          ordered: true,
        },
        {
          prompt: "Đếm số khách hàng theo thành phố (`city`) và xếp thành phố đông khách nhất lên đầu, nếu bằng nhau thì theo tên thành phố. Đặt tên cột đếm là `so_khach`. Cần Thơ đứng đầu với 10 khách.",
          starter: "SELECT city, COUNT(*) AS so_khach\nFROM customer\nGROUP BY city\nORDER BY ;",
          solution: "SELECT city, COUNT(*) AS so_khach FROM customer GROUP BY city ORDER BY COUNT(*) DESC, city",
          hint: "ORDER BY nhận được cả hàm tổng hợp, ví dụ COUNT(*) DESC, rồi thêm city để phá hòa.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Câu `SELECT company_id, status, COUNT(*) FROM account GROUP BY company_id` báo lỗi. Nguyên nhân đúng nhất là gì?",
        options: [
          "COUNT(*) không dùng chung được với GROUP BY",
          "Cột status không nằm trong GROUP BY và cũng không nằm trong hàm tổng hợp, nên mỗi nhóm không biết lấy status nào",
          "Phải có WHERE thì GROUP BY mới chạy được",
          "Cột status là chữ nên không được hiện trong kết quả gom nhóm",
        ],
        answer: 1,
        explain: "Một chi nhánh có tài khoản OPEN lẫn CLOSED, nên nhóm của chi nhánh đó không có một status duy nhất để hiện. COUNT(*) đi cùng GROUP BY là cách dùng bình thường. WHERE là tuỳ chọn. Kiểu dữ liệu chữ hiện được; vấn đề chỉ là cột chưa được gom hay tổng hợp.",
      },
    },
    {
      id: "having",
      trap: {
        title: "Điều kiện lên dòng thì đặt ở WHERE, đừng nhét vào HAVING",
        text: "`HAVING ccy = 'VND'` báo lỗi vì `ccy` không có trong `GROUP BY`. Điều kiện nói về dòng thì lọc sớm ở `WHERE`, còn `HAVING` chỉ dành cho kết quả tổng hợp như `SUM(...) > 4000000000`. Ngược lại, `WHERE SUM(...) > ...` báo `aggregate functions are not allowed in WHERE`.",
      },
      title: "Phần 5: HAVING và sự khác nhau với WHERE",
      scene: "having",
      intro: [
        "GROUP BY đã cho ta một dòng mỗi nhóm. Bước tiếp theo là chỉ giữ lại những nhóm thoả điều kiện. Giả sử bạn chỉ muốn thấy **những chi nhánh có tổng số dư VND lớn hơn 4 tỷ**. Điều kiện này nói về **cả nhóm**, vì tổng số dư chỉ tồn tại sau khi đã gom. Bạn không thể viết nó trong `WHERE`: `WHERE SUM(...) > ...` báo lỗi `aggregate functions are not allowed in WHERE`. Lý do: `WHERE` chạy **trước** khi gom nhóm, lúc đó chưa có tổng nào cả.",
        "Công cụ đúng là **`HAVING`**, đứng ngay sau `GROUP BY`: nó lọc các **nhóm** sau khi hàm tổng hợp đã tính xong. Tóm lại, **`WHERE` lọc dòng trước khi gom, `HAVING` lọc nhóm sau khi gom**. Với dữ liệu thật, `HAVING SUM(working_balance) > 4000000000` giữ lại 2 chi nhánh: VN0010002 (4.877.395.569) và VN0010003 (4.671.229.987). Một ví dụ khác: lệnh chuyển khoản `DONE` theo ngày, giữ những ngày có từ 3 lệnh trở lên (`HAVING COUNT(*) >= 3`), chỉ còn đúng ngày 2024-11-25 với 4 lệnh, tổng 45.000.667.",
        "Lưu ý: trong PostgreSQL **không dùng được alias của SELECT trong HAVING** (`HAVING tong > 4000000000` báo `column \"tong\" does not exist`), phải viết lại hàm tổng hợp. Alias thì dùng được trong `ORDER BY`.",
      ],
      sql: [
        {
          prompt: "Tìm các chi nhánh có tổng số dư VND lớn hơn 4 tỷ (4000000000). Hiện `company_id` và `tong_so_du`, xếp theo mã chi nhánh. Kết quả đúng 2 dòng.",
          starter: "SELECT company_id, SUM(working_balance) AS tong_so_du\nFROM account\nWHERE ccy = 'VND'\nGROUP BY company_id\nHAVING SUM(working_balance) > ____\nORDER BY company_id;",
          solution: "SELECT company_id, SUM(working_balance) AS tong_so_du FROM account WHERE ccy = 'VND' GROUP BY company_id HAVING SUM(working_balance) > 4000000000 ORDER BY company_id",
          hint: "Điền con số 4 tỷ viết liền, không có dấu chấm hay phẩy.",
          ordered: true,
        },
        {
          prompt: "Tìm các khách hàng có từ 4 tài khoản trở lên. Hiện `customer_id` và `so_tai_khoan`, xếp theo `customer_id`. Kết quả đúng: 100035 và 100039, mỗi người 4 tài khoản.",
          starter: "SELECT customer_id, COUNT(*) AS so_tai_khoan\nFROM account\nGROUP BY customer_id\n\nORDER BY customer_id;",
          solution: "SELECT customer_id, COUNT(*) AS so_tai_khoan FROM account GROUP BY customer_id HAVING COUNT(*) >= 4 ORDER BY customer_id",
          hint: "Dòng trống nằm giữa GROUP BY và ORDER BY chính là chỗ của HAVING.",
          ordered: true,
        },
        {
          prompt: "Tìm các ngày có từ 3 lệnh chuyển khoản đã hoàn tất (`status = 'DONE'`) trở lên. Hiện `processing_date`, `so_lenh`, `tong_tien`. Kết quả đúng là ngày 2024-11-25 với 4 lệnh.",
          starter: "SELECT processing_date, COUNT(*) AS so_lenh, SUM(amount) AS tong_tien\nFROM funds_transfer\n\nGROUP BY processing_date\n;",
          solution: "SELECT processing_date, COUNT(*) AS so_lenh, SUM(amount) AS tong_tien FROM funds_transfer WHERE status = 'DONE' GROUP BY processing_date HAVING COUNT(*) >= 3",
          hint: "status = 'DONE' lọc dòng nên thuộc WHERE; COUNT(*) >= 3 lọc nhóm nên thuộc HAVING.",
        },
      ],
      takeaway: {
        lines: [
          "Điều kiện nói về **từng dòng** (`ccy`, `status`) đặt ở `WHERE`. Điều kiện nói về **kết quả của nhóm** (`SUM`, `COUNT`) đặt ở `HAVING`.",
        ],
      },
      quiz: {
        question: "Yêu cầu: \"liệt kê các chi nhánh có tổng số dư VND lớn hơn 4 tỷ\". Điều kiện về tổng số dư phải đặt ở đâu?",
        options: [
          "Trong WHERE, vì WHERE là nơi duy nhất đặt điều kiện",
          "Trong HAVING, vì tổng số dư chỉ có sau khi đã gom nhóm",
          "Trong SELECT, vì đó là nơi tính tổng số dư",
          "Trong ORDER BY, vì nó sắp xếp các nhóm",
        ],
        answer: 1,
        explain: "WHERE chạy trước GROUP BY nên chưa có tổng nào để so sánh (PostgreSQL báo lỗi hàm tổng hợp trong WHERE). SELECT chỉ chọn cột để hiện, không lọc. ORDER BY chỉ sắp xếp, không loại bỏ nhóm. Chỉ HAVING lọc nhóm theo giá trị tổng hợp.",
      },
    },
    {
      id: "bank-reports",
      title: "Phần 6: Ghép tất cả thành báo cáo ngân hàng",
      scene: "bank-reports",
      intro: [
        "Giờ đã có đủ mảnh ghép: hàm tổng hợp, `GROUP BY` và `HAVING`. Một câu truy vấn đầy đủ có thể có đủ các mệnh đề, và **thứ tự viết cố định**: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`. Database lại chạy theo **thứ tự logic** khác: `FROM` (lấy bảng), `WHERE` (lọc dòng), `GROUP BY` (gom nhóm), `HAVING` (lọc nhóm), `SELECT` (tính cột và alias), `ORDER BY` (sắp xếp), `LIMIT` (cắt bớt). Biết thứ tự này bạn sẽ hiểu vì sao `WHERE` không có hàm tổng hợp, và vì sao alias dùng được ở `ORDER BY` nhưng không ở `HAVING`.",
        "Công thức giải một bài toán báo cáo:",
        "- **Mỗi cái gì?**: đó là cột `GROUP BY`.",
        "- **Cần tính gì?**: đó là hàm tổng hợp.",
        "- **Điều kiện về dòng**: cho vào `WHERE`.",
        "- **Điều kiện về kết quả tổng hợp**: cho vào `HAVING`.",
        "- **Cuối cùng**: sắp xếp (`ORDER BY`) và cắt bớt (`LIMIT`).",
        "Các bài tập dưới đây đều theo công thức đó.",
      ],
      sql: [
        {
          prompt: "Tìm các khách hàng có tổng số dư VND (chỉ tính tài khoản `OPEN`) hơn 3 tỷ. Hiện `customer_id`, `so_tai_khoan`, `tong_so_du`, xếp tổng số dư giảm dần. Kết quả đúng: 100036 (3 tài khoản, 3.235.868.789) rồi 100035 (3 tài khoản, 3.225.133.015).",
          starter: "SELECT customer_id,\n       COUNT(*) AS so_tai_khoan,\n       SUM(working_balance) AS tong_so_du\nFROM account\nWHERE ____\nGROUP BY customer_id\nHAVING SUM(working_balance) > 3000000000\nORDER BY SUM(working_balance) DESC;",
          solution: "SELECT customer_id, COUNT(*) AS so_tai_khoan, SUM(working_balance) AS tong_so_du FROM account WHERE status = 'OPEN' AND ccy = 'VND' GROUP BY customer_id HAVING SUM(working_balance) > 3000000000 ORDER BY SUM(working_balance) DESC",
          hint: "Hai điều kiện về dòng (trạng thái và loại tiền) nối với nhau bằng AND.",
          ordered: true,
        },
        {
          prompt: "Tìm 3 tài khoản có nhiều bút toán nhất trong bảng `stmt_entry`. Hiện `account_id` và `so_but_toan`, xếp giảm dần theo số bút toán, nếu bằng nhau thì theo `account_id`. Kết quả đúng: 1000000044 với 23 bút toán, rồi 1000000004 và 1000000024 cùng 22.",
          starter: "SELECT account_id, COUNT(*) AS so_but_toan\nFROM stmt_entry\n;",
          solution: "SELECT account_id, COUNT(*) AS so_but_toan FROM stmt_entry GROUP BY account_id ORDER BY COUNT(*) DESC, account_id LIMIT 3",
          hint: "GROUP BY account_id, rồi ORDER BY COUNT(*) DESC, account_id, rồi LIMIT 3.",
          ordered: true,
        },
        {
          prompt: "Báo cáo theo loại sản phẩm (`category_id`) cho tài khoản VND: số tài khoản, số dư thấp nhất và cao nhất. Đặt tên `so_tai_khoan`, `thap_nhat`, `cao_nhat`, xếp theo `category_id`. Loại vay 3001 và 3002 sẽ có số dư âm.",
          starter: "SELECT category_id,\n       COUNT(*) AS so_tai_khoan,\n       MIN(working_balance) AS thap_nhat,\n       MAX(working_balance) AS cao_nhat\nFROM account\n;",
          solution: "SELECT category_id, COUNT(*) AS so_tai_khoan, MIN(working_balance) AS thap_nhat, MAX(working_balance) AS cao_nhat FROM account WHERE ccy = 'VND' GROUP BY category_id ORDER BY category_id",
          hint: "Cần WHERE ccy = 'VND', rồi GROUP BY category_id, rồi ORDER BY category_id.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Câu nào mô tả đúng thứ tự database xử lý các mệnh đề trong một truy vấn có GROUP BY?",
        options: [
          "SELECT, FROM, GROUP BY, WHERE, HAVING",
          "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY",
          "FROM, GROUP BY, WHERE, SELECT, HAVING, ORDER BY",
          "WHERE, FROM, SELECT, GROUP BY, HAVING, ORDER BY",
        ],
        answer: 1,
        explain: "Lấy bảng (FROM), lọc dòng (WHERE), gom nhóm (GROUP BY), lọc nhóm (HAVING), rồi mới tính cột SELECT, cuối cùng sắp xếp. Các phương án khác đảo WHERE sau GROUP BY (sai: WHERE lọc dòng trước khi gom), hoặc cho SELECT chạy trước FROM (sai: chưa có bảng thì chưa có cột).",
      },
    },
  ],
  cards: [
    { q: "Ba cách viết của COUNT khác nhau thế nào?", a: "`COUNT(*)` đếm dòng, `COUNT(cột)` đếm dòng có cột không NULL, `COUNT(DISTINCT cột)` đếm giá trị khác nhau." },
    { q: "Hàm tổng hợp xử lý NULL ra sao?", a: "Bỏ qua NULL, trừ `COUNT(*)`. `AVG` của 10, 20, NULL là 15, không phải 10." },
    { q: "`SUM` của tập rỗng ra gì?", a: "NULL, không phải 0. `COUNT` thì ra 0. Dùng `COALESCE` để đổi NULL thành 0." },
    { q: "Quy tắc của `SELECT` khi có `GROUP BY`?", a: "Mỗi cột trong SELECT phải có trong GROUP BY hoặc nằm trong một hàm tổng hợp." },
    { q: "`WHERE` và `HAVING` khác nhau thế nào?", a: "`WHERE` lọc dòng trước khi gom, `HAVING` lọc nhóm sau khi hàm tổng hợp đã tính." },
    { q: "Vì sao không cộng số dư của mọi tài khoản bất kể loại tiền?", a: "Bảng có VND, USD và EUR, cộng lẫn là vô nghĩa. Lọc `WHERE ccy = 'VND'` hoặc gom theo `ccy`." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Hàm tổng hợp nén nhiều dòng thành một giá trị: COUNT(*) đếm dòng, COUNT(cột) đếm dòng không NULL, COUNT(DISTINCT cột) đếm giá trị khác nhau, còn SUM, AVG, MIN, MAX làm việc trên cột số hoặc ngày. Tất cả đều bỏ qua NULL (trừ COUNT(*)), và SUM của tập rỗng là NULL. GROUP BY gom các dòng cùng giá trị thành nhóm, mỗi nhóm cho một dòng kết quả, và mọi cột trong SELECT phải nằm trong GROUP BY hoặc bên trong hàm tổng hợp. WHERE lọc dòng trước khi gom, HAVING lọc nhóm sau khi đã tính hàm tổng hợp. Thứ tự xử lý là FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.",
};
