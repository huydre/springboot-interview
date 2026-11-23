import timeline from "../timelines/sql-transform.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 7. Every query and every number quoted in the text was run on PostgreSQL (PGlite) against data/sql/t24-bank.sql.
// Dates are fixed (DATE '2024-12-31'), never CURRENT_DATE. Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlTransform: Lesson = {
  slug: "sql-transform",
  crumb: "Xử lý dữ liệu",
  videoDir: "/videos/sql-transform",
  videoVersion: "d2bda7aa",
  scenes: timeline as Scene[],
  title: "CASE WHEN, COALESCE, CAST, hàm chuỗi và ngày tháng",
  subtitle:
    "Biến dữ liệu thô thành thứ báo cáo đọc được: gắn nhãn hạng cho số dư, thay NULL bằng chữ dễ hiểu, che số điện thoại, tính tuổi khách hàng và đếm bút toán theo tháng. Mọi phép biến đổi đều chỉ đổi kết quả hiển thị, không đụng vào bảng.",
  openingQuiz: {
    question: "Cột `mobile` của một số khách hàng đang là NULL. Báo cáo muốn hiện chữ \"chưa có\" ở những ô đó. Cách làm đúng trong SQL là gì?",
    options: [
      "Dùng UPDATE sửa mọi ô NULL trong bảng thành chữ \"chưa có\" trước khi làm báo cáo",
      "Thay NULL bằng chữ \"chưa có\" ngay trong câu SELECT, bảng gốc vẫn giữ nguyên NULL",
      "Xoá những khách chưa có số điện thoại khỏi bảng để báo cáo gọn hơn",
      "Đổi kiểu cột `mobile` sang kiểu số để NULL tự biến mất",
    ],
    answer: 1,
    explain: "SQL có sẵn hàm biến đổi giá trị lúc đọc (bài này dạy COALESCE cho việc đó), nên bảng không bị sửa. UPDATE làm mất thông tin \"chưa biết\" thật sự và là việc của bài về thay đổi dữ liệu. Xoá khách là mất dữ liệu. Đổi kiểu cột sang số không làm NULL biến mất, NULL vẫn là NULL ở mọi kiểu.",
  },
  roadmap: [
    "Chặng 1: CASE WHEN rẽ nhánh, COALESCE và NULLIF xử lý NULL và phép chia cho 0.",
    "Chặng 2: CAST và `::` đổi kiểu dữ liệu, rồi các hàm chuỗi để cắt, ghép, che chữ.",
    "Chặng 3: hàm ngày tháng, tính tuổi bằng AGE, và ghép tất cả thành báo cáo ngân hàng.",
  ],
  sections: [
    {
      id: "case-when",
      trap: {
        title: "`CASE x WHEN NULL` không bao giờ khớp",
        text: "Simple CASE so sánh bằng `=`, mà `= NULL` không bao giờ đúng. `CASE gender WHEN NULL THEN ...` khớp 0 dòng, kể cả 8 khách có `gender` NULL. Muốn bắt NULL phải dùng searched CASE với `WHEN gender IS NULL`.",
      },
      title: "Phần 1: CASE WHEN, rẽ nhánh trong câu SQL",
      scene: "case-when",
      widget: "sql-transform-case",
      widgetTitle: "Xem CASE thử từng nhánh từ trên xuống trên số dư thật",
      board: {
        title: "CASE thử nhánh từ trên xuống",
        highlight: "từ trên xuống",
        chips: ["Nhánh đầu tiên đúng thì dừng", "Nhánh hẹp đứng trước nhánh rộng"],
        cards: [
          {
            title: "Thứ tự nhánh",
            diagram: {
              kind: "flow",
              steps: ["working_balance = -41666000", "CASE thử nhánh trên cùng"],
              ok: ["Nhánh `< 0` đứng trước", "Dư nợ"],
              bad: ["Nhánh `< 100000000` trước", "Trung bình (sai)"],
            },
            notes: ["Cả hai nhánh cùng đúng với số âm, nhưng nhánh trên thắng và CASE dừng ngay."],
            code: `CASE
  WHEN working_balance < 0 THEN 'Dư nợ'
  WHEN working_balance < 100000000 THEN 'Trung bình'
  ELSE 'Cao'
END`,
            takeaway: "Đặt nhánh hẹp lên trước nhánh rộng",
          },
          {
            title: "Không có ELSE",
            diagram: {
              kind: "flow",
              steps: ["Thử từng nhánh WHEN", "Không nhánh nào đúng"],
              ok: ["Có ELSE", "Trả giá trị ELSE"],
              bad: ["Thiếu ELSE", "Trả NULL"],
            },
            notes: ["Đếm có điều kiện nên viết `ELSE 0` để `SUM` ra 0 chứ không ra NULL."],
            code: `SUM(CASE WHEN ccy = 'VND'
         THEN 1 ELSE 0 END) AS vnd`,
            takeaway: "Luôn nghĩ tới trường hợp không nhánh nào khớp",
          },
        ],
        conclusion: "**Kết luận:** CASE là biểu thức chạy từ trên xuống, nhánh đúng đầu tiên thắng.",
      },
      intro: [
        "Nhiều khi bạn không muốn hiện nguyên số dư mà muốn một **nhãn**: \"Dư nợ\", \"Thấp\", \"Trung bình\", \"Cao\". Giống nhân viên quầy nhìn số dư rồi phân khách vào hạng. Trong SQL việc đó do **`CASE WHEN`** làm: nó là một biểu thức trả về một giá trị tuỳ điều kiện, giống `if / else if / else` ở ngôn ngữ lập trình. Biểu thức này đặt trong `SELECT` như một cột bình thường.",
        "Cú pháp **searched CASE** (điều kiện tự do): `CASE WHEN điều_kiện_1 THEN giá_trị_1 WHEN điều_kiện_2 THEN giá_trị_2 ELSE giá_trị_còn_lại END`. SQL thử các nhánh **từ trên xuống**, nhánh đầu tiên đúng thì dừng và trả về giá trị của nhánh đó, các nhánh sau không được xét nữa. Vì vậy **thứ tự nhánh rất quan trọng**: nhánh hẹp (`< 0`) phải đứng trước nhánh rộng (`< 100000000`). Bấm từng bước ở widget bên dưới rồi thử tick ô đảo thứ tự để thấy một khoản nợ bị gắn nhãn \"Trung bình\".",
        "Nếu không có `ELSE` mà mọi nhánh đều sai, kết quả là **NULL**. Có thêm **simple CASE** khi chỉ so sánh bằng một cột với nhiều giá trị: `CASE status WHEN 'DONE' THEN 'Hoàn tất' WHEN 'PENDING' THEN 'Đang chờ' ELSE 'Thất bại' END`. Với dữ liệu thật, các lệnh chuyển khoản có 123 lệnh `DONE`, 6 lệnh `PENDING` và 3 lệnh `FAILED`. Simple CASE chỉ so sánh `=`, nên không viết được điều kiện `<` hay `IS NULL`.",
        "Hai bẫy: các nhánh `THEN` phải **cùng kiểu** (`THEN 1 ... ELSE 'a'` báo lỗi `invalid input syntax for type integer`), và quên `END` là lỗi cú pháp.",
      ],
      takeaway: {
        lines: [
          "CASE là một **biểu thức** thử nhánh từ trên xuống: nhánh đúng đầu tiên thắng, không nhánh nào đúng và không có `ELSE` thì ra NULL.",
        ],
      },
      sql: [
        {
          prompt: "Gắn hạng cho mọi tài khoản VND (75 dòng): `Dư nợ` nếu số dư âm, `Thấp` nếu dưới 10 triệu, `Trung bình` nếu dưới 100 triệu, còn lại `Cao`. Hiện `account_id`, `working_balance`, và cột `hang`, xếp theo `account_id`. Điền chỗ trống.",
          starter: "SELECT account_id, working_balance,\n       CASE\n         WHEN working_balance < 0 THEN 'Dư nợ'\n         WHEN working_balance < ____ THEN 'Thấp'\n         WHEN working_balance < ____ THEN 'Trung bình'\n         ELSE 'Cao'\n       END AS hang\nFROM account\nWHERE ccy = 'VND'\nORDER BY account_id;",
          solution: "SELECT account_id, working_balance, CASE WHEN working_balance < 0 THEN 'Dư nợ' WHEN working_balance < 10000000 THEN 'Thấp' WHEN working_balance < 100000000 THEN 'Trung bình' ELSE 'Cao' END AS hang FROM account WHERE ccy = 'VND' ORDER BY account_id",
          hint: "10 triệu viết liền là 10000000, 100 triệu là 100000000. Nhánh nhỏ hơn đứng trước.",
          ordered: true,
        },
        {
          prompt: "Dùng simple CASE để đổi `status` của bảng `funds_transfer` sang tiếng Việt: `DONE` thành `Hoàn tất`, `PENDING` thành `Đang chờ`, còn lại `Thất bại`. Hiện `status`, cột `trang_thai` và `so_lenh` (số lệnh), xếp theo `status`. Kết quả đúng: 123, 6, 3.",
          starter: "SELECT status,\n       CASE status\n         WHEN 'DONE' THEN 'Hoàn tất'\n         WHEN ____ THEN 'Đang chờ'\n         ELSE 'Thất bại'\n       END AS trang_thai,\n       COUNT(*) AS so_lenh\nFROM funds_transfer\nGROUP BY status\nORDER BY status;",
          solution: "SELECT status, CASE status WHEN 'DONE' THEN 'Hoàn tất' WHEN 'PENDING' THEN 'Đang chờ' ELSE 'Thất bại' END AS trang_thai, COUNT(*) AS so_lenh FROM funds_transfer GROUP BY status ORDER BY status",
          hint: "Giá trị còn thiếu là trạng thái của lệnh đang chờ, viết trong dấu nháy đơn.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Một tài khoản có số dư -41666000 (khoản vay). Câu `CASE WHEN working_balance < 100000000 THEN 'Trung bình' WHEN working_balance < 0 THEN 'Dư nợ' ELSE 'Cao' END` gắn nhãn gì cho nó, và vì sao?",
        options: [
          "Trung bình, vì nhánh đầu đã đúng nên CASE dừng và không xét nhánh Dư nợ",
          "Dư nợ, vì CASE luôn chọn nhánh khớp cụ thể nhất trong tất cả các nhánh",
          "Cao, vì số âm không thoả nhánh nào nên rơi xuống ELSE",
          "NULL, vì có hai nhánh cùng đúng nên CASE không biết chọn nhánh nào",
        ],
        answer: 0,
        explain: "CASE thử nhánh từ trên xuống và dừng ở nhánh đầu tiên đúng; -41666000 nhỏ hơn 100000000 nên nhận 'Trung bình'. CASE không tự chọn nhánh \"cụ thể nhất\". Số âm thoả nhánh đầu nên không rơi xuống ELSE. Hai nhánh cùng đúng không gây NULL, nhánh trên thắng. Cách sửa là đặt nhánh `< 0` lên trước.",
      },
      parts: [
        {
          id: "case-report",
          title: "CASE trong báo cáo: khoá GROUP BY và đếm có điều kiện",
          intro: [
            "Phần trên dùng CASE để gắn nhãn từng dòng. Tiện lợi nhất là dùng CASE làm khoá `GROUP BY`, để biến số dư thành hạng rồi đếm mỗi hạng. Với 75 tài khoản VND, chia hạng:",
            "- **Dư nợ**: `< 0`, 14 tài khoản.",
            "- **Thấp**: `< 10000000`, 5 tài khoản.",
            "- **Trung bình**: `< 100000000`, 24 tài khoản.",
            "- **Cao**: còn lại, 32 tài khoản.",
            "Một mẹo rất hay gặp là **đếm có điều kiện**: `SUM(CASE WHEN ccy = 'VND' THEN 1 ELSE 0 END)` cho 75 tài khoản VND, còn `<> 'VND'` cho 10 tài khoản ngoại tệ, tất cả trong một dòng. Viết `ELSE 0` để khi không có dòng nào khớp, `SUM` vẫn ra 0 chứ không ra NULL.",
            "Về cú pháp: PostgreSQL cho phép gọi alias của `SELECT` ngay trong `GROUP BY` (`GROUP BY hang`), nhưng trong `HAVING` thì không. Điều này có vẻ ngược với thứ tự logic (GROUP BY chạy trước SELECT): đó là tiện ích riêng của PostgreSQL, không phải SQL chuẩn. Cách viết chạy được ở mọi hệ là lặp lại cả biểu thức CASE trong `GROUP BY`.",
          ],
          sql: [
          {
              prompt: "Đếm số tài khoản VND theo từng hạng (cùng cách chia hạng như bài đầu). Hiện `hang` và `so_tai_khoan`, xếp theo `so_tai_khoan` tăng dần. Kết quả đúng: Thấp 5, Dư nợ 14, Trung bình 24, Cao 32.",
              starter: "SELECT\n       CASE\n         WHEN working_balance < 0 THEN 'Dư nợ'\n         WHEN working_balance < 10000000 THEN 'Thấp'\n         WHEN working_balance < 100000000 THEN 'Trung bình'\n         ELSE 'Cao'\n       END AS hang,\n       COUNT(*) AS so_tai_khoan\nFROM account\nWHERE ccy = 'VND'\n;",
              solution: "SELECT CASE WHEN working_balance < 0 THEN 'Dư nợ' WHEN working_balance < 10000000 THEN 'Thấp' WHEN working_balance < 100000000 THEN 'Trung bình' ELSE 'Cao' END AS hang, COUNT(*) AS so_tai_khoan FROM account WHERE ccy = 'VND' GROUP BY hang ORDER BY so_tai_khoan",
              hint: "Thêm GROUP BY hang (dùng alias) rồi ORDER BY so_tai_khoan.",
              ordered: true,
            },
            {
              prompt: "Trong một dòng duy nhất, đếm số tài khoản VND và số tài khoản ngoại tệ của bảng `account` bằng `SUM(CASE ...)`. Đặt tên cột `vnd` và `ngoai_te`. Kết quả đúng: 75 và 10.",
              starter: "SELECT SUM(CASE WHEN ccy = 'VND' THEN 1 ELSE 0 END) AS vnd,\n       SUM(CASE WHEN ____ THEN 1 ELSE 0 END) AS ngoai_te\nFROM account;",
              solution: "SELECT SUM(CASE WHEN ccy = 'VND' THEN 1 ELSE 0 END) AS vnd, SUM(CASE WHEN ccy <> 'VND' THEN 1 ELSE 0 END) AS ngoai_te FROM account",
              hint: "Ngoại tệ là mọi loại tiền khác VND, dùng phép so sánh khác (<>).",
            },
          ],
          takeaway: {
            lines: [
              "CASE làm khoá `GROUP BY` để chia hạng; `SUM(CASE ... THEN 1 ELSE 0 END)` để đếm nhiều điều kiện trong một dòng.",
            ],
          },
          quiz: {
            question: "`SUM(CASE WHEN ccy = 'VND' THEN 1 ELSE 0 END)` trên một tập chỉ toàn tài khoản ngoại tệ trả về gì?",
            options: ["0", "NULL", "Lỗi vì không có dòng nào khớp", "Số tài khoản ngoại tệ"],
            answer: 0,
            explain: "Mỗi dòng không khớp cho `ELSE 0`, nên tổng là 0. Nếu bỏ `ELSE 0` thì mọi dòng ra NULL và `SUM` ra NULL.",
          },
        },
      ],
    },
    {
      id: "coalesce-nullif",
      trap: {
        title: "Đổi NULL thành 0 trước khi tính trung bình làm sai con số",
        text: "Trừ hai ngày cho ra số ngày giữa chúng (phần 5). `AVG(close_date - open_date)` ra 1749 ngày cho 2 tài khoản đã đóng. Bọc `COALESCE(..., 0)` thì 83 tài khoản đang mở bị tính là 0 ngày và trung bình tụt xuống 41,15. NULL là chưa biết, không phải 0. Chỉ vá NULL khi bạn thật sự muốn nó là 0.",
      },
      title: "Phần 2: COALESCE và NULLIF, làm việc với NULL",
      scene: "coalesce-nullif",
      board: {
        title: "COALESCE đi từ trái sang phải",
        highlight: "từ trái sang phải",
        chips: ["Lấy giá trị đầu tiên khác NULL", "NULLIF chống chia cho 0"],
        cards: [
          {
            title: "COALESCE",
            diagram: {
              kind: "flow",
              neutral: true,
              steps: ["COALESCE(mobile, email, ...)", "mobile là NULL"],
              ok: ["Khách 100005 có email", "Trả về email"],
              bad: ["Khách 100021 thiếu cả hai", "Trả `không có`"],
            },
            notes: ["Dừng ở giá trị đầu tiên khác NULL. Mọi giá trị phải cùng kiểu."],
            code: `SELECT customer_id,
       COALESCE(mobile, email, 'không có')
FROM customer;`,
            takeaway: "Thứ tự trong danh sách là thứ tự ưu tiên",
          },
          {
            title: "NULLIF chống chia 0",
            diagram: {
              kind: "pipe",
              from: "mẫu số 0",
              via: "NULLIF(x, 0)",
              to: "NULL",
              skipped: ["division by zero"],
              skippedLabel: "Không còn lỗi",
            },
            notes: ["`10 / NULLIF(0, 0)` cho NULL và câu truy vấn vẫn chạy."],
            code: `SELECT 10 / NULLIF(0, 0);`,
            takeaway: "Biến mẫu số 0 thành NULL trước khi chia",
          },
        ],
        conclusion: "**Kết luận:** COALESCE thay NULL khi hiển thị, NULLIF biến một giá trị thành NULL.",
      },
      intro: [
        "Phần 1 thấy CASE thiếu `ELSE` thì ra NULL. NULL còn có sẵn trong dữ liệu, như `mobile` của nhiều khách, và báo cáo cần xử lý nó cho dễ đọc.",
        "**`COALESCE(a, b, c, ...)`** trả về **giá trị đầu tiên không phải NULL** trong danh sách. Dùng nó để thay NULL bằng giá trị mặc định lúc hiển thị: `COALESCE(mobile, 'chưa có')` hiện số điện thoại nếu có, nếu không thì hiện chữ \"chưa có\". Khách 100005 chưa có số nên ra `chưa có`, khách 100001 có số nên ra `0994373346`. Có thể đưa nhiều lựa chọn dự phòng: `COALESCE(mobile, email, 'không có')` thử số điện thoại, rồi email, rồi mới tới chữ mặc định. Trong 40 khách có đúng 2 người không có cả hai (ví dụ 100021).",
        "Mọi giá trị trong `COALESCE` phải **cùng kiểu**. `COALESCE(close_date, 'đang mở')` báo lỗi `invalid input syntax for type date`, vì `close_date` là ngày còn \"đang mở\" là chữ. Muốn trộn thì đổi kiểu trước bằng `::text` (phần 3 bên dưới): `COALESCE(close_date::text, 'đang mở')`. Một cách dùng quen thuộc nữa là `COALESCE(SUM(...), 0)`, để tổng của tập rỗng ra 0 thay vì NULL, như đã hứa ở bài hàm tổng hợp.",
        "**`NULLIF(a, b)`** làm ngược lại: trả về NULL **nếu a bằng b**, ngược lại trả về a. Công dụng kinh điển là chống **chia cho 0**: `10 / 0` báo lỗi `division by zero` và cả câu truy vấn sập, còn `10 / NULLIF(0, 0)` cho NULL và câu truy vấn vẫn chạy. Ví dụ tính số dư tiết kiệm trung bình của từng khách bằng cách lấy tổng số dư tiết kiệm chia số tài khoản tiết kiệm: 20 trên 40 khách không có tài khoản tiết kiệm nào, mẫu số bằng 0, nếu không có `NULLIF` thì cả báo cáo lỗi. Có `NULLIF(mẫu_số, 0)` thì các khách đó hiện NULL.",
      ],
      predict: {
        question: "Khách 100005 không có số điện thoại nhưng có email. `COALESCE(mobile, email, 'không có')` cho khách đó ra gì?",
        options: ["NULL", "Chữ `không có`", "Email của khách", "Báo lỗi vì `mobile` là NULL"],
        answer: 2,
        explain: "COALESCE thử từ trái sang phải và dừng ở giá trị đầu tiên khác NULL. `mobile` là NULL nên nó lấy `email`. Chỉ khách như 100021, thiếu cả hai, mới ra `không có`. Bài tập 2 cho bạn tự kiểm tra.",
      },
      takeaway: {
        lines: [
          "`COALESCE` biến NULL thành giá trị mặc định lúc hiển thị. `NULLIF` làm ngược lại: biến một giá trị (thường là mẫu số 0) thành NULL để câu truy vấn không sập.",
        ],
      },
      sql: [
        {
          prompt: "Hiện `customer_id`, `full_name` và cột `so_dien_thoai` của mọi khách hàng, trong đó khách không có số thì hiện chữ `chưa có`. Xếp theo `customer_id` (40 dòng).",
          starter: "SELECT customer_id, full_name,\n       COALESCE(mobile, '____') AS so_dien_thoai\nFROM customer\nORDER BY customer_id;",
          solution: "SELECT customer_id, full_name, COALESCE(mobile, 'chưa có') AS so_dien_thoai FROM customer ORDER BY customer_id",
          hint: "Chữ thay thế là chưa có, viết trong dấu nháy đơn.",
          ordered: true,
        },
        {
          prompt: "Hiện `customer_id` và cột `lien_he`: ưu tiên số điện thoại, nếu không có thì email, nếu cả hai đều NULL thì `không có`. Xếp theo `customer_id`. Khách 100005 phải ra email, khách 100021 ra `không có`.",
          starter: "SELECT customer_id,\n       COALESCE(____, ____, 'không có') AS lien_he\nFROM customer\nORDER BY customer_id;",
          solution: "SELECT customer_id, COALESCE(mobile, email, 'không có') AS lien_he FROM customer ORDER BY customer_id",
          hint: "COALESCE thử các giá trị theo thứ tự từ trái sang phải, nên đặt mobile trước email.",
          ordered: true,
        },
        {
          prompt: "Chỉ với NULLIF: câu `SELECT 10 / 0` báo lỗi `division by zero`. Sửa mẫu số để câu chạy được và ra NULL, đặt tên cột `ket_qua`.",
          starter: "SELECT 10 / ____(0, 0) AS ket_qua;",
          solution: "SELECT 10 / NULLIF(0, 0) AS ket_qua",
          hint: "NULLIF(a, b) trả NULL khi a bằng b. Ở đây mẫu số 0 cần thành NULL.",
        },
        {
          prompt: "Với tài khoản VND, tính số dư tiết kiệm trung bình của mỗi khách (loại 6001, 6006, 6012): tổng số dư tiết kiệm chia số tài khoản tiết kiệm, làm tròn tới đơn vị bằng `ROUND(..., 0)`. Khách không có tài khoản tiết kiệm phải ra NULL chứ không báo lỗi. Hiện `customer_id` và `tb_tiet_kiem`, xếp theo `customer_id` (40 dòng).",
          starter: "SELECT customer_id,\n       ROUND(\n         SUM(CASE WHEN category_id IN (6001, 6006, 6012) THEN working_balance ELSE 0 END)\n         / ____(SUM(CASE WHEN category_id IN (6001, 6006, 6012) THEN 1 ELSE 0 END), 0),\n       0) AS tb_tiet_kiem\nFROM account\nWHERE ccy = 'VND'\nGROUP BY customer_id\nORDER BY customer_id;",
          solution: "SELECT customer_id, ROUND(SUM(CASE WHEN category_id IN (6001, 6006, 6012) THEN working_balance ELSE 0 END) / NULLIF(SUM(CASE WHEN category_id IN (6001, 6006, 6012) THEN 1 ELSE 0 END), 0), 0) AS tb_tiet_kiem FROM account WHERE ccy = 'VND' GROUP BY customer_id ORDER BY customer_id",
          hint: "Hàm cần điền biến mẫu số 0 thành NULL, và nhận hai tham số: giá trị và giá trị cần \"loại\".",
          ordered: true,
        },
        {
          prompt: "Tính tổng số dư tiết kiệm (loại 6001, 6006, 6012) của từng khách cho tài khoản VND, khách không có thì hiện `0` thay vì NULL. Hiện `customer_id` và `tiet_kiem`, xếp theo `customer_id`. Gợi ý: `SUM(CASE ... THEN working_balance END)` không có ELSE sẽ ra NULL khi không khớp dòng nào.",
          starter: "SELECT customer_id,\n       (SUM(CASE WHEN category_id IN (6001, 6006, 6012) THEN working_balance END), 0) AS tiet_kiem\nFROM account\nWHERE ccy = 'VND'\nGROUP BY customer_id\nORDER BY customer_id;",
          solution: "SELECT customer_id, COALESCE(SUM(CASE WHEN category_id IN (6001, 6006, 6012) THEN working_balance END), 0) AS tiet_kiem FROM account WHERE ccy = 'VND' GROUP BY customer_id ORDER BY customer_id",
          hint: "Bọc cả biểu thức SUM(...) trong COALESCE, đứng trước dấu ngoặc đang thiếu tên hàm.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Với `AVG(close_date - open_date)` trên bảng `account` (chỉ 2 tài khoản đã đóng có ngày đóng), vì sao không nên bọc `COALESCE(close_date - open_date, 0)` trước khi lấy trung bình?",
        options: [
          "Vì COALESCE không dùng được bên trong hàm tổng hợp",
          "Vì 83 tài khoản đang mở sẽ bị tính là 0 ngày, kéo trung bình tụt từ 1749 xuống khoảng 41",
          "Vì phép trừ hai ngày luôn trả về NULL trong PostgreSQL",
          "Vì AVG đã tự đổi mọi NULL thành 0 rồi nên COALESCE thừa",
        ],
        answer: 1,
        explain: "AVG bỏ qua NULL, nên trung bình đúng của hai tài khoản đã đóng là 1749. COALESCE đổi 83 dòng NULL thành 0 và làm lệch kết quả. COALESCE dùng được trong hàm tổng hợp (chỉ là không nên ở đây). Phép trừ hai ngày cho số nguyên ngày, không phải NULL. Và AVG không đổi NULL thành 0, nó bỏ qua NULL.",
      },
    },
    {
      id: "cast-type",
      title: "Phần 3: CAST và `::`, đổi kiểu dữ liệu",
      scene: "cast-type",
      intro: [
        "Phần 2 đã gặp `COALESCE(close_date::text, 'đang mở')`: các giá trị phải cùng kiểu, và `::text` đổi kiểu cho khớp. Phần này nói kỹ về việc đổi kiểu.",
        "Đôi khi giá trị mang sai kiểu cho việc bạn định làm:",
        "- **Số cần ghép vào chuỗi**: như `amount::text` để ghép với `||`.",
        "- **Chuỗi cần coi như ngày**: như `'2024-12-31'::date`.",
        "- **Số nguyên cần chia ra số lẻ**: như `7::numeric / 2`.",
        "**`CAST(giá_trị AS kiểu)`** đổi kiểu theo chuẩn SQL. PostgreSQL có cách viết ngắn **`giá_trị::kiểu`** (chỉ có ở PostgreSQL và vài hệ khác). Hai cách tương đương: `CAST('2024-12-31' AS date)` và `'2024-12-31'::date`. Hay dùng: `::int`, `::bigint`, `::numeric`, `::text`, `::date`.",
        "Bẫy phổ biến nhất là **chia số nguyên**. Khi cả hai vế là số nguyên, kết quả bị cắt phần lẻ: `7 / 2` ra `3`, không phải 3,5. Muốn ra 3,5 thì đổi một vế sang `numeric`: `7::numeric / 2` ra `3.5000000000000000`. Trong dữ liệu ngân hàng, tỷ lệ lệnh chuyển khoản thành công là 123 trên 132 lệnh: `123 / 132` ra 0, và cách viết `SUM(CASE ...) * 100 / COUNT(*)` ra 93 (bị cắt), nhưng chính xác là 93,2 phần trăm. Đổi tử số sang `numeric` rồi `ROUND(..., 1)` cho 93.2.",
        "Lưu ý ngay đây, kẻo lẫn với phép chia nguyên: đổi số lẻ (`numeric`) sang số nguyên thì PostgreSQL **làm tròn**, không cắt: `3.7::int` ra `4`, `2.5::int` ra `3`, `(-3.7)::int` ra `-4`.",
        "Đổi kiểu **có thể báo lỗi** nếu giá trị không hợp lệ:",
        "- **Chữ không phải số**: `'12abc'::int` báo `invalid input syntax for type integer`.",
        "- **Ngày không tồn tại**: `CAST('2024-02-30' AS date)` báo `date/time field value out of range` vì ngày 30 tháng 2 không tồn tại.",
        "- **Số quá lớn cho kiểu đích**: có tài khoản VND số dư hơn 3 tỷ, nên `working_balance::int` báo `integer out of range` (kiểu `int` chỉ tới khoảng 2,1 tỷ), phải dùng `::bigint`.",
        "Tài khoản 1000000001 có số dư `107956000.00`, nên `working_balance::bigint` ra `107956000` (phần lẻ là `.00` nên làm tròn không đổi gì). Còn `amount::text` ra `2000000.00` để ghép chuỗi với `||`.",
      ],
      sql: [
        {
          prompt: "Tính tỷ lệ phần trăm lệnh chuyển khoản `DONE` trên tổng số lệnh của bảng `funds_transfer`, làm tròn 1 chữ số lẻ. Đặt tên cột `ty_le_done`. Kết quả đúng 93.2 (nếu bạn ra 93 là do chia số nguyên).",
          starter: "SELECT ROUND(\n         100 * CAST(SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS ____) / COUNT(*),\n       1) AS ty_le_done\nFROM funds_transfer;",
          solution: "SELECT ROUND(100 * CAST(SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS numeric) / COUNT(*), 1) AS ty_le_done FROM funds_transfer",
          hint: "Kiểu số thập phân chính xác của PostgreSQL là numeric.",
        },
        {
          prompt: "Với 5 lệnh chuyển khoản đầu tiên (xếp theo `ft_id`), hiện `ft_id` và cột `so_tien` là số tiền ghép với loại tiền, ví dụ `2000000.00 VND`. Dùng `::text` để đổi `amount` thành chuỗi rồi ghép bằng `||`.",
          starter: "SELECT ft_id,\n       amount ____ ' ' || ccy AS so_tien\nFROM funds_transfer\nORDER BY ft_id\nLIMIT 5;",
          solution: "SELECT ft_id, amount::text || ' ' || ccy AS so_tien FROM funds_transfer ORDER BY ft_id LIMIT 5",
          hint: "Đặt ::text ngay sau amount, trước toán tử ||.",
          ordered: true,
        },
      ],
      takeaway: {
        lines: [
          "Chia hai số nguyên thì **cắt** phần lẻ (`7 / 2` ra 3). Đổi `numeric` sang `int` thì **làm tròn** (`3.7::int` ra 4). Hai quy tắc khác nhau, đừng lẫn.",
        ],
      },
      quiz: {
        question: "Biểu thức `SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) * 100 / COUNT(*)` cho 123 lệnh trên 132 lệnh trả về 93 thay vì 93,2. Nguyên nhân và cách sửa nào đúng?",
        options: [
          "Cả hai vế là số nguyên nên phép chia cắt phần lẻ; đổi một vế sang numeric rồi ROUND",
          "ROUND bị thiếu nên PostgreSQL tự bỏ phần lẻ; thêm ROUND(..., 1) là đủ",
          "COUNT(*) luôn trả về số nguyên nhỏ hơn thực tế; đổi sang COUNT(1)",
          "SUM bỏ qua phần lẻ của tử số; thay bằng AVG sẽ đúng",
        ],
        answer: 0,
        explain: "Tử số và mẫu số đều là số nguyên nên PostgreSQL chia nguyên và cắt phần lẻ ngay lúc chia; ROUND sau đó không cứu được. COUNT(*) đếm đúng, COUNT(1) cho kết quả y hệt. SUM không bỏ phần lẻ gì cả, các giá trị 1 và 0 vốn là số nguyên. Phải đổi kiểu trước khi chia.",
      },
    },
    {
      id: "string-functions",
      trap: {
        title: "`||` gặp NULL thì cả chuỗi thành NULL",
        text: "`'a' || NULL || 'b'` ra NULL, còn `CONCAT('a', NULL, 'b')` ra `ab`. Khách thiếu số điện thoại sẽ biến mất khỏi nhãn ghép bằng `||`. Bọc cột có thể NULL bằng `COALESCE`, hoặc dùng `CONCAT`.",
      },
      title: "Phần 4: Hàm chuỗi, cắt ghép và che chữ",
      scene: "string-functions",
      intro: [
        "Phần 3 đổi số thành chuỗi để ghép. Giờ ta làm việc với chính các chuỗi: tên, email, số điện thoại là **chuỗi** (chữ). Các hàm chuỗi hay dùng:",
        "- **UPPER(s)**, **LOWER(s)**: đổi thành chữ hoa, chữ thường.",
        "- **LENGTH(s)**: đếm số ký tự.",
        "- **TRIM(s)**: bỏ khoảng trắng hai đầu (`TRIM('  abc  ')` ra `abc`).",
        "- **REPLACE(s, 'cũ', 'mới')**: thay chữ.",
        "Ví dụ `UPPER('Lý Hoàng Long')` cho `LÝ HOÀNG LONG` (chữ có dấu vẫn đổi đúng ở PostgreSQL này), `LENGTH(mobile)` luôn bằng 10 với cả 34 số điện thoại.",
        "**Ghép chuỗi** bằng toán tử `||`: `'Số tài khoản: ' || account_id`. Hàm `CONCAT(a, b, c)` làm điều tương tự nhưng khác nhau ở NULL: `'a' || NULL || 'b'` ra **NULL** (một mảnh NULL làm hỏng cả chuỗi), còn `CONCAT('a', NULL, 'b')` ra `ab` (bỏ qua NULL). Đừng nhầm NULL với chuỗi rỗng `''`: chuỗi rỗng là một giá trị thật, dài 0 ký tự, nên `'a' || '' || 'b'` vẫn ra `ab`. Chỉ NULL (không có giá trị) mới làm cả chuỗi thành NULL.",
        "**Cắt chuỗi**: `SUBSTRING(s FROM bắt_đầu FOR độ_dài)` lấy một đoạn, vị trí đếm từ **1** (không phải 0); bỏ `FOR` thì lấy tới hết chuỗi. Số `0994373346`: `SUBSTRING(mobile FROM 1 FOR 3)` ra `099`, `SUBSTRING(mobile FROM 8)` ra `346`. **`POSITION('chữ' IN s)`** tìm vị trí xuất hiện đầu tiên, ra 0 nếu không thấy. `POSITION('@' IN email)` là vị trí dấu @, ghép với `SUBSTRING` để lấy phần tên đăng nhập trước @: email `duong.van.an@mail.vn` cho `duong.van.an`. PostgreSQL còn có `LEFT(s, n)` và `RIGHT(s, n)` lấy n ký tự đầu hoặc cuối.",
        "**Che số điện thoại** (masking) là việc thật của báo cáo ngân hàng: chỉ hiện 3 số đầu và 3 số cuối. `0994373346` thành `099****346`. Làm bằng ghép ba mảnh: 3 ký tự đầu, `'****'`, từ ký tự thứ 8 trở đi. Nếu `mobile` NULL thì cả chuỗi ghép là NULL, và ta có thể bọc `COALESCE` bên ngoài để hiện \"chưa có\".",
      ],
      sql: [
        {
          prompt: "Che số điện thoại của các khách có số (34 dòng): hiện `customer_id` và cột `sdt_che` gồm 3 số đầu, `****`, rồi từ số thứ 8 trở đi. Khách 100001 phải ra `099****346`. Xếp theo `customer_id`.",
          starter: "SELECT customer_id,\n       SUBSTRING(mobile FROM 1 FOR 3) || '****' || SUBSTRING(mobile FROM ____) AS sdt_che\nFROM customer\nWHERE mobile IS NOT NULL\nORDER BY customer_id;",
          solution: "SELECT customer_id, SUBSTRING(mobile FROM 1 FOR 3) || '****' || SUBSTRING(mobile FROM 8) AS sdt_che FROM customer WHERE mobile IS NOT NULL ORDER BY customer_id",
          hint: "3 số cuối của dãy 10 số bắt đầu từ vị trí thứ 8.",
          ordered: true,
        },
        {
          prompt: "Với các khách có email (31 dòng), hiện `customer_id` và cột `ten_dang_nhap` là phần email đứng trước dấu `@`. Khách 100002 phải ra `duong.van.an`. Xếp theo `customer_id`.",
          starter: "SELECT customer_id,\n       SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - ____) AS ten_dang_nhap\nFROM customer\nWHERE email IS NOT NULL\nORDER BY customer_id;",
          solution: "SELECT customer_id, SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) AS ten_dang_nhap FROM customer WHERE email IS NOT NULL ORDER BY customer_id",
          hint: "Dấu @ ở vị trí p thì phần tên đăng nhập dài p trừ đi một ký tự.",
          ordered: true,
        },
        {
          prompt: "Tìm 3 khách có `full_name` dài nhất. Hiện `customer_id`, `full_name` và `do_dai` (số ký tự), xếp độ dài giảm dần, nếu bằng nhau thì theo `customer_id`. Kết quả đúng: 100033 và 100037 cùng 31, rồi 100036 với 30.",
          starter: "SELECT customer_id, full_name, ____(full_name) AS do_dai\nFROM customer\nORDER BY do_dai DESC, customer_id\n;",
          solution: "SELECT customer_id, full_name, LENGTH(full_name) AS do_dai FROM customer ORDER BY do_dai DESC, customer_id LIMIT 3",
          hint: "Hàm đếm số ký tự là LENGTH; nhớ thêm LIMIT 3 ở dòng cuối.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Khách 100005 có `mobile` NULL. Biểu thức `short_name || ' (' || mobile || ')'` cho khách đó ra gì, và hàm nào ghép được mà không mất cả chuỗi?",
        options: [
          "NULL cả chuỗi; dùng CONCAT hoặc bọc COALESCE(mobile, ...) quanh mobile",
          "'NGO NGOC ANH ()' vì NULL được coi là chuỗi rỗng khi ghép bằng ||",
          "Báo lỗi, vì không thể ghép chuỗi với NULL trong PostgreSQL",
          "'NGO NGOC ANH (NULL)' vì NULL được in thành chữ",
        ],
        answer: 0,
        explain: "Ghép bằng || với một NULL thì kết quả là NULL, nên cả nhãn mất. CONCAT bỏ qua NULL, hoặc COALESCE đưa mobile về chữ thay thế. NULL không được coi là chuỗi rỗng, không báo lỗi, và cũng không in thành chữ NULL.",
      },
    },
    {
      id: "date-functions",
      trap: {
        title: "TO_CHAR ra chuỗi, sắp xếp theo chuỗi",
        text: "Với mẫu `'MM/YYYY'`, `ORDER BY` sắp theo chữ nên `05/2024` đứng trước `06/2023`. Sắp theo ngày thật (`DATE_TRUNC`) hoặc dùng mẫu `'YYYY-MM'` có năm đứng trước.",
      },
      title: "Phần 5: Hàm ngày tháng",
      scene: "date-functions",
      intro: [
        "Sau số và chuỗi, loại dữ liệu thứ ba của mọi báo cáo ngân hàng là thời gian. Khi cần một ngày cố định, ta viết **`DATE '2024-12-31'`** (không dùng `CURRENT_DATE` để kết quả không đổi theo hôm nay). Hàm đầu tiên là **`EXTRACT(phần FROM ngày)`** lấy một phần của ngày: `YEAR`, `MONTH`, `DAY`, `QUARTER` (quý), `DOW` (thứ trong tuần, 0 là Chủ nhật). Với `DATE '2024-12-31'`: năm 2024, tháng 12, ngày 31, quý 4, DOW bằng 2 (thứ Ba). `EXTRACT` trả về kiểu `numeric`, nên thường viết `EXTRACT(...)::int` cho gọn.",
        "**`DATE_TRUNC('month', ngày)`** \"cắt\" ngày về đầu tháng: `DATE_TRUNC('month', DATE '2024-03-17')` ra `2024-03-01`. Các đơn vị khác: `'year'`, `'quarter'`, `'week'`, `'day'`. Kết quả là kiểu timestamp, nên thêm `::date` để đẹp. Đây là cách chuẩn để **gom theo tháng**: `GROUP BY DATE_TRUNC('month', booking_date)`. Bảng `stmt_entry` có bút toán trải trên 15 tháng, từ tháng 6 năm 2023 (4 bút toán) tới tháng 12 năm 2024 (70 bút toán); tháng 1 năm 2024 nhiều nhất với 128 bút toán.",
        "**`TO_CHAR(ngày, 'mẫu')`** đổi ngày thành chuỗi theo mẫu: `'YYYY-MM'` ra `2024-03`, `'DD/MM/YYYY'` ra `17/03/2024`. Kết quả là **chuỗi** (xem khung bẫy).",
        "**Cộng trừ ngày.** Ngày trừ ngày ra **số nguyên là số ngày**: `DATE '2024-12-31' - DATE '2024-12-01'` ra 30. Ngày cộng một số nguyên ra ngày: `DATE '2024-12-31' + 30` ra 2025-01-30. Với đơn vị tháng, năm thì dùng **`INTERVAL`**: `DATE '2024-01-31' + INTERVAL '1 month'` ra cuối tháng 2 (`2024-02-29`, PostgreSQL tự lùi về ngày hợp lệ). Cộng `INTERVAL` ra kiểu timestamp, thêm `::date` nếu muốn ngày thuần. Điều kiện \"trong 30 ngày cuối của năm\" viết là `processing_date >= DATE '2024-12-31' - INTERVAL '30 days'`; trên bảng `funds_transfer` có 17 lệnh như vậy, trong đó 8 lệnh `DONE`.",
      ],
      sql: [
        {
          prompt: "Đếm số bút toán của bảng `stmt_entry` theo tháng bằng `DATE_TRUNC`. Hiện `thang` (đã `::date`) và `so_but_toan`, xếp theo `thang`. Kết quả có 15 dòng, dòng đầu là 2023-06-01 với 4 bút toán.",
          starter: "SELECT DATE_TRUNC('____', booking_date)::date AS thang,\n       COUNT(*) AS so_but_toan\nFROM stmt_entry\nGROUP BY thang\nORDER BY thang;",
          solution: "SELECT DATE_TRUNC('month', booking_date)::date AS thang, COUNT(*) AS so_but_toan FROM stmt_entry GROUP BY thang ORDER BY thang",
          hint: "Đơn vị cần điền là month, viết thường trong dấu nháy đơn.",
          ordered: true,
        },
        {
          prompt: "Đếm số lệnh chuyển khoản `DONE` theo quý của `processing_date` bằng `EXTRACT(QUARTER FROM ...)`. Hiện `quy` (số nguyên) và `so_lenh`, xếp theo `quy`. Kết quả đúng: 33, 30, 28, 32.",
          starter: "SELECT EXTRACT(____ FROM processing_date)::int AS quy,\n       COUNT(*) AS so_lenh\nFROM funds_transfer\nWHERE status = 'DONE'\nGROUP BY quy\nORDER BY quy;",
          solution: "SELECT EXTRACT(QUARTER FROM processing_date)::int AS quy, COUNT(*) AS so_lenh FROM funds_transfer WHERE status = 'DONE' GROUP BY quy ORDER BY quy",
          hint: "Phần cần lấy là QUARTER.",
          ordered: true,
        },
        {
          prompt: "Với 3 lệnh `DONE` gần nhất (xếp `processing_date` giảm dần, nếu bằng nhau thì theo `ft_id`), hiện `ft_id`, `processing_date` và `so_ngay` là số ngày từ ngày xử lý tới `DATE '2024-12-31'`. Kết quả đúng: 3, 6, 10 ngày.",
          starter: "SELECT ft_id, processing_date,\n       DATE '2024-12-31' ____ processing_date AS so_ngay\nFROM funds_transfer\nWHERE status = 'DONE'\nORDER BY processing_date DESC, ft_id\nLIMIT 3;",
          solution: "SELECT ft_id, processing_date, DATE '2024-12-31' - processing_date AS so_ngay FROM funds_transfer WHERE status = 'DONE' ORDER BY processing_date DESC, ft_id LIMIT 3",
          hint: "Ngày lớn trừ ngày nhỏ cho số ngày.",
          ordered: true,
        },
        {
          prompt: "Đếm số lệnh chuyển khoản `DONE` có `processing_date` trong 30 ngày cuối tính tới `DATE '2024-12-31'` (từ `DATE '2024-12-31' - INTERVAL '30 days'` trở đi). Đặt tên cột `so_lenh`. Kết quả đúng: 8.",
          starter: "SELECT COUNT(*) AS so_lenh\nFROM funds_transfer\nWHERE status = 'DONE'\n  AND processing_date >= DATE '2024-12-31' - INTERVAL '____';",
          solution: "SELECT COUNT(*) AS so_lenh FROM funds_transfer WHERE status = 'DONE' AND processing_date >= DATE '2024-12-31' - INTERVAL '30 days'",
          hint: "Khoảng thời gian viết là 30 days trong dấu nháy đơn.",
        },
      ],
      takeaway: {
        lines: [
          "Gom theo tháng: `DATE_TRUNC` (ra ngày thật, xếp đúng). Hiển thị: `TO_CHAR` (ra chuỗi).",
          "Ngày trừ ngày ra số ngày. Cộng tháng hay năm thì dùng `INTERVAL`.",
        ],
      },
      quiz: {
        question: "Muốn đếm bút toán theo tháng và cho kết quả xếp đúng từ cũ tới mới, mẫu `TO_CHAR` nào an toàn nhất để dùng trong `GROUP BY` và `ORDER BY`?",
        options: [
          "`'MM/YYYY'`, vì tháng đứng trước dễ đọc với người Việt",
          "`'YYYY-MM'`, vì năm đứng trước nên xếp chuỗi cũng đúng thứ tự thời gian",
          "`'Mon YYYY'`, vì tên tháng viết tắt xếp theo bảng chữ cái",
          "`'DD/MM/YYYY'`, vì ngày cụ thể xếp chính xác nhất",
        ],
        answer: 1,
        explain: "TO_CHAR cho chuỗi, và chuỗi xếp theo từng ký tự. Chỉ khi năm đứng trước (`YYYY-MM`) thì thứ tự chuỗi trùng thứ tự thời gian. `MM/YYYY` làm 06/2023 đứng sau 05/2024. Tên tháng viết tắt xếp Apr, Aug, Dec... theo chữ cái. `DD/MM/YYYY` xếp theo ngày trước nên cũng sai, và mỗi ngày thành một nhóm riêng chứ không còn gom theo tháng.",
      },
    },
    {
      id: "age-and-report",
      trap: {
        title: "`2024 - năm sinh` bỏ qua sinh nhật",
        text: "Tính tại `DATE '2024-06-30'`, khách 100002 sinh 1988-08-28 mới 35 tuổi nhưng cách tắt `2024 - EXTRACT(YEAR FROM birth_date)` ra 36. Dùng `EXTRACT(YEAR FROM AGE(ngày_tính, birth_date))`. Khách doanh nghiệp có `birth_date` NULL nên tuổi là NULL, nhánh `IS NULL` phải đứng đầu CASE.",
      },
      title: "Phần 6: AGE, tính tuổi và ghép thành báo cáo",
      scene: "age-and-report",
      intro: [
        "**`AGE(ngày_sau, ngày_trước)`** trả về một **interval**: khoảng thời gian giữa hai ngày, tính theo năm, tháng, ngày. Khách 100001 sinh 1971-04-06, tính tới `DATE '2024-12-31'` thì `AGE(DATE '2024-12-31', birth_date)` ra `53 years 8 mons 25 days`. Muốn tuổi theo năm, lấy phần năm: `EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date))::int` ra 53. Luôn truyền ngày thứ nhất là ngày tính tuổi cố định; nếu chỉ truyền một ngày, PostgreSQL ngầm lấy hôm nay và kết quả đổi mỗi ngày.",
        "Khách doanh nghiệp (8 khách) không có `birth_date`, nên tuổi là NULL. Ghép với `CASE` để chia nhóm tuổi: `CASE WHEN birth_date IS NULL THEN 'Doanh nghiệp' WHEN tuổi < 30 THEN 'Dưới 30' WHEN tuổi < 50 THEN '30 đến 49' ELSE '50 trở lên' END`. Nhớ nhánh `IS NULL` đứng đầu, vì so sánh với NULL không bao giờ đúng. Dữ liệu cho 15 khách ở nhóm 30 đến 49, 11 khách 50 trở lên, 6 khách dưới 30 và 8 khách doanh nghiệp.",
        "Phần cuối này ghép mọi kỹ thuật của bài: `UPPER`, che số điện thoại, `COALESCE`, `AGE`, `CASE`. Mỗi biểu thức biến đổi chỉ thay đổi cách hiển thị, không sửa dữ liệu trong bảng.",
      ],
      sql: [
        {
          prompt: "Tính tuổi của các khách có `birth_date` (32 dòng) tính tới `DATE '2024-12-31'`. Hiện `customer_id`, `full_name` và `tuoi` (số nguyên), xếp theo `customer_id`. Khách 100001 phải ra 53, khách 100003 ra 21.",
          starter: "SELECT customer_id, full_name,\n       EXTRACT(YEAR FROM ____(DATE '2024-12-31', birth_date))::int AS tuoi\nFROM customer\nWHERE birth_date IS NOT NULL\nORDER BY customer_id;",
          solution: "SELECT customer_id, full_name, EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date))::int AS tuoi FROM customer WHERE birth_date IS NOT NULL ORDER BY customer_id",
          hint: "Hàm cần điền là AGE, ngày tính tuổi đứng trước ngày sinh.",
          ordered: true,
        },
        {
          prompt: "Chia 40 khách thành nhóm tuổi tính tới `DATE '2024-12-31'`: `Doanh nghiệp` nếu không có `birth_date`, `Dưới 30`, `30 đến 49` (từ 30 tới dưới 50) hoặc `50 trở lên`. Hiện `nhom` và `so_khach`. Kết quả đúng: 15, 11, 8 và 6 khách.",
          starter: "SELECT\n       CASE\n         WHEN birth_date IS NULL THEN 'Doanh nghiệp'\n         WHEN EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date)) < 30 THEN 'Dưới 30'\n         WHEN EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date)) < ____ THEN '30 đến 49'\n         ELSE '50 trở lên'\n       END AS nhom,\n       COUNT(*) AS so_khach\nFROM customer\n;",
          solution: "SELECT CASE WHEN birth_date IS NULL THEN 'Doanh nghiệp' WHEN EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date)) < 30 THEN 'Dưới 30' WHEN EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date)) < 50 THEN '30 đến 49' ELSE '50 trở lên' END AS nhom, COUNT(*) AS so_khach FROM customer GROUP BY nhom",
          hint: "Cột cuối của nhóm 30 đến 49 là dưới 50 tuổi. Nhớ thêm GROUP BY nhom.",
        },
        {
          prompt: "Báo cáo cuối: với mọi khách (40 dòng) hiện `customer_id`, `ten` là `short_name` viết hoa (`UPPER`), `sdt` là số điện thoại che (3 số đầu, `****`, từ số thứ 8) hoặc `chưa có` nếu NULL, và `tuoi` tính tới `DATE '2024-12-31'` (NULL với khách doanh nghiệp). Xếp theo `customer_id`. Khách 100001: `LY HOANG LONG`, `099****346`, 53; khách 100005 có `chưa có`.",
          starter: "SELECT customer_id,\n       UPPER(short_name) AS ten,\n       COALESCE(____, 'chưa có') AS sdt,\n       EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date))::int AS tuoi\nFROM customer\nORDER BY customer_id;",
          solution: "SELECT customer_id, UPPER(short_name) AS ten, COALESCE(SUBSTRING(mobile FROM 1 FOR 3) || '****' || SUBSTRING(mobile FROM 8), 'chưa có') AS sdt, EXTRACT(YEAR FROM AGE(DATE '2024-12-31', birth_date))::int AS tuoi FROM customer ORDER BY customer_id",
          hint: "Chỗ trống là cả biểu thức ghép ba mảnh của số điện thoại; khi mobile NULL cả biểu thức NULL nên COALESCE ra chữ thay thế.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao cách tính tuổi `2024 - EXTRACT(YEAR FROM birth_date)` có thể sai khi tính tại `DATE '2024-06-30'`?",
        options: [
          "Vì nó bỏ qua việc sinh nhật năm đó đã tới hay chưa, nên người sinh tháng 8 bị tính dôi một tuổi",
          "Vì EXTRACT không lấy được năm từ cột kiểu date",
          "Vì phép trừ cho ra NULL khi ngày sinh trước năm 2000",
          "Vì AGE là cách duy nhất PostgreSQL cho phép tính với ngày sinh",
        ],
        answer: 0,
        explain: "Khách 100002 sinh 1988-08-28 mới 35 tuổi vào 2024-06-30, nhưng 2024 trừ 1988 ra 36. EXTRACT lấy được năm từ date bình thường. Phép trừ số không cho NULL (chỉ NULL khi birth_date NULL). Và AGE không phải cách duy nhất, nó chỉ là cách chính xác và gọn.",
      },
    },
  ],
  cards: [
    { q: "`CASE WHEN` xét các nhánh theo thứ tự nào, và không có `ELSE` thì sao?", a: "Từ trên xuống, nhánh đúng đầu tiên thắng. Không nhánh nào đúng và không có `ELSE` thì ra NULL." },
    { q: "`COALESCE(a, b, c)` trả về gì?", a: "Giá trị đầu tiên không NULL trong danh sách. Các giá trị phải cùng kiểu." },
    { q: "`NULLIF(a, b)` dùng để làm gì?", a: "Ra NULL nếu a bằng b. Dùng `x / NULLIF(mẫu, 0)` để tránh lỗi chia cho 0." },
    { q: "`||` và `CONCAT` khác nhau thế nào khi gặp NULL?", a: "`||` làm cả chuỗi thành NULL, `CONCAT` bỏ qua NULL." },
    { q: "Vì sao gom theo tháng nên dùng `DATE_TRUNC`?", a: "Nó trả về ngày đầu tháng, kiểu ngày thật nên sắp xếp đúng. `TO_CHAR` ra chuỗi và sắp theo chữ." },
    { q: "Cách tính tuổi chính xác trong PostgreSQL?", a: "`EXTRACT(YEAR FROM AGE(ngày_tính, birth_date))`. Cách `năm nay trừ năm sinh` sai khi chưa tới sinh nhật." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "CASE WHEN rẽ nhánh theo điều kiện, thử từ trên xuống và dừng ở nhánh đầu tiên đúng, nên nhánh hẹp phải đứng trước; thiếu ELSE thì ra NULL, và CASE trong SUM cho đếm có điều kiện. COALESCE trả về giá trị đầu tiên khác NULL, còn NULLIF(a, b) trả về NULL khi a bằng b, hay dùng để tránh chia cho 0. CAST và `::` đổi kiểu; chia hai số nguyên bị cắt phần lẻ nên cần đổi sang numeric trước. Hàm chuỗi như UPPER, LENGTH, SUBSTRING, POSITION, REPLACE, TRIM cắt ghép chữ, trong đó `||` gặp NULL thì ra NULL còn CONCAT bỏ qua NULL. Hàm ngày gồm EXTRACT, DATE_TRUNC (gom theo tháng), TO_CHAR (đổi thành chuỗi, nên dùng mẫu YYYY-MM để xếp đúng) và phép cộng trừ ngày với INTERVAL. Tuổi tính chính xác bằng EXTRACT(YEAR FROM AGE(ngày_cố_định, birth_date)).",
};
