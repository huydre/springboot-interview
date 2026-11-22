import timeline from "../timelines/sql-set.json";
import type { Lesson, Scene } from "../types";

// SQL course, lesson 9. Every query and number below was run on PostgreSQL (PGlite) against the fictional T24-style dataset in data/sql/t24-bank.sql.
// Video not rendered yet: scenes stay empty until publish; scene ids below equal the section ids.
export const sqlSet: Lesson = {
  slug: "sql-set",
  crumb: "Tập hợp kết quả",
  videoDir: "/videos/sql-set",
  videoVersion: "7b173ace",
  scenes: timeline as Scene[],
  title: "UNION, INTERSECT và EXCEPT",
  subtitle:
    "JOIN ghép các bảng theo chiều ngang (thêm cột). Bài này làm việc theo chiều dọc: nối hai danh sách thành một, lấy phần chung, hoặc lấy phần chỉ có ở một bên. Dùng cho các câu hỏi như khách vừa có tiết kiệm vừa có vay.",
  openingQuiz: {
    question: "Bạn có danh sách A các khách có tài khoản tiết kiệm và danh sách B các khách có khoản vay. Muốn biết ai có cả hai thì làm gì?",
    options: [
      "Nối A và B thành một danh sách dài rồi đếm",
      "Lấy phần giao: những khách xuất hiện ở cả A lẫn B",
      "Lấy A trừ B",
      "Chỉ cần lấy B, vì ai có vay thì chắc chắn có tiết kiệm",
    ],
    answer: 1,
    explain: "\"Cả hai\" nghĩa là phần giao của hai danh sách, trong SQL là INTERSECT. Nối lại chỉ cho tất cả mọi người của A và B, A trừ B cho người chỉ có tiết kiệm, và không có lý do gì để ai có vay thì cũng có tiết kiệm.",
  },
  roadmap: [
    "Chặng 1: UNION ALL và UNION, khác nhau ở chuyện giữ hay bỏ dòng trùng.",
    "Chặng 2: luật để hai câu SELECT gộp được, ORDER BY trên kết quả gộp, thêm cột nhãn.",
    "Chặng 3: INTERSECT và EXCEPT cho tình huống ngân hàng, rồi so với JOIN tương đương.",
  ],
  sections: [
    {
      id: "union-basics",
      title: "Phần 1: Nối hai danh sách với UNION ALL và UNION",
      scene: "union-basics",
      widget: "sql-set-venn",
      widgetTitle: "Chọn phép toán và xem hai danh sách tài khoản gộp lại thế nào",
      intro: [
        "**JOIN** (bài 6) ghép các bảng theo chiều ngang: thêm cột từ bảng khác vào mỗi dòng. Còn **phép toán tập hợp** (set operation) làm theo chiều dọc: lấy kết quả của hai câu `SELECT` rồi **xếp chồng** thành một kết quả duy nhất. Hình dung hai tờ danh sách: bạn dán tờ này nối vào dưới tờ kia.",
        "Có hai cách nối. `UNION ALL` giữ **mọi** dòng, kể cả dòng trùng. `UNION` nối xong thì **bỏ dòng trùng**, mỗi giá trị chỉ còn một lần (giống `DISTINCT` áp lên kết quả nối). Ví dụ thật: bảng `funds_transfer` có 132 lệnh chuyển khoản, mỗi lệnh có một tài khoản ghi nợ (`debit_account`, bị trừ tiền) và một tài khoản ghi có (`credit_account`, được cộng tiền). Nối hai cột này bằng `UNION ALL` ra đúng 264 dòng (132 cộng 132). Nối bằng `UNION` chỉ còn 49 dòng, vì cùng một tài khoản xuất hiện nhiều lần ở nhiều lệnh. 49 chính là số tài khoản khác nhau từng tham gia chuyển khoản, còn cột ghi nợ có 44 tài khoản khác nhau, cột ghi có 48.",
        "Dùng widget để thử bốn phép toán trên hai danh sách mẫu nhỏ (10 lệnh chuyển khoản đầu tiên). Với `UNION ALL` bạn thấy 20 dòng và những tài khoản lặp được đánh dấu; với `UNION` còn 17 dòng. `INTERSECT` và `EXCEPT` sẽ học ở các phần sau, cứ xem trước kết quả (1 dòng và 9 dòng).",
      ],
      sql: [
        {
          prompt: "Lập danh sách mọi tài khoản xuất hiện ở hai phía của chuyển khoản, giữ cả dòng trùng: nối cột `debit_account` với cột `credit_account` của `funds_transfer`. Kết quả phải có 264 dòng. Điền từ khoá nối.",
          starter: "SELECT debit_account FROM funds_transfer\n____\nSELECT credit_account FROM funds_transfer;",
          solution: "SELECT debit_account FROM funds_transfer UNION ALL SELECT credit_account FROM funds_transfer",
          hint: "Muốn giữ cả dòng trùng thì thêm từ ALL sau UNION.",
        },
        {
          prompt: "Làm lại nhưng mỗi tài khoản chỉ xuất hiện một lần, xếp theo tài khoản tăng dần. Kết quả phải có 49 dòng.",
          starter: "SELECT debit_account FROM funds_transfer\nUNION\nSELECT credit_account FROM funds_transfer\nORDER BY ____;",
          solution: "SELECT debit_account FROM funds_transfer UNION SELECT credit_account FROM funds_transfer ORDER BY 1",
          hint: "Có thể ORDER BY theo số thứ tự cột (1) hoặc theo tên cột của câu SELECT đầu.",
          ordered: true,
        },
      ],
      quiz: {
        question: "`SELECT a FROM t1 UNION SELECT a FROM t2` khác `UNION ALL` ở điểm nào?",
        options: [
          "UNION bỏ các dòng trùng nhau trong kết quả gộp, UNION ALL giữ tất cả",
          "UNION chỉ lấy dòng ở t1, UNION ALL lấy cả hai bảng",
          "UNION nối theo chiều ngang như JOIN, UNION ALL nối theo chiều dọc",
          "UNION nhanh hơn vì không cần sắp xếp, UNION ALL luôn chậm hơn",
        ],
        answer: 0,
        explain: "Cả hai đều xếp chồng hai kết quả. Khác biệt là UNION loại dòng trùng, UNION ALL giữ nguyên. Lựa chọn về chiều ngang là của JOIN. Về tốc độ thì ngược lại: UNION phải tìm và bỏ dòng trùng nên thường tốn thêm công, UNION ALL không phải làm việc đó.",
      },
    },
    {
      id: "union-practice",
      trap: {
        title: "UNION trong báo cáo tiền âm thầm nuốt dòng",
        text: "123 lệnh `DONE`, lấy hai phía (tài khoản, số tiền) nối lại rồi `sum(amount)`: `UNION ALL` ra 246 dòng và 1.638.023.242, còn `UNION` chỉ còn 176 dòng và 1.297.015.371. Hai lệnh khác nhau mà cùng tài khoản, cùng số tiền bị coi là một dòng trùng và mất, không có lỗi nào. Khi đếm hay cộng tiền, dùng `UNION ALL`; nếu thật sự phải bỏ trùng, thêm cột định danh như `ft_id` để hai lệnh khác nhau không bị gộp (thêm `ft_id` thì `UNION` cũng ra đúng 1.638.023.242).",
      },
      title: "Phần 2: Khi nào cần bỏ trùng, khi nào phải giữ",
      scene: "union-practice",
      intro: [
        "Chọn `UNION` hay `UNION ALL` là chọn xem câu hỏi của bạn cần **danh sách các giá trị khác nhau** hay **mọi dòng**. Hỏi \"những thành phố nào có khách hoặc có chi nhánh\" thì cần bỏ trùng: lấy `city` của `customer` (40 dòng) nối với `city` của `company` (5 dòng). `UNION ALL` cho 45 dòng, `UNION` chỉ còn 5 thành phố: Cần Thơ, Hà Nội, Hải Phòng, TP. Hồ Chí Minh, Đà Nẵng.",
        "Ngược lại, khi hai danh sách là hai nguồn khác nhau và bạn định **đếm hay cộng tiền**, bỏ trùng sẽ làm sai số. Nếu muốn đếm số lần tài khoản tham gia chuyển khoản thì phải giữ cả dòng trùng. Ví dụ: hai lệnh chuyển khoản khác nhau từ cùng một tài khoản với cùng số tiền cho ra hai dòng (tài khoản, số tiền) giống hệt nhau; `UNION` giữ một, tổng tiền thiếu mất một lệnh (xem khung bẫy, có số thật). Quy tắc nhanh: không chắc thì dùng `UNION ALL` rồi tự quyết định có cần `DISTINCT` hay không, vì nó không âm thầm bỏ dữ liệu của bạn.",
      ],
      sql: [
        {
          prompt: "Liệt kê các thành phố có khách hàng hoặc có chi nhánh, mỗi thành phố một lần, xếp theo tên thành phố. Điền từ khoá. Kết quả có 5 dòng.",
          starter: "SELECT city FROM customer\n____\nSELECT city FROM company\nORDER BY city;",
          solution: "SELECT city FROM customer UNION SELECT city FROM company ORDER BY city",
          hint: "Cần bỏ trùng, nên dùng UNION không có ALL.",
          ordered: true,
        },
        {
          prompt: "Liệt kê các tài khoản đã tham gia ít nhất một lệnh chuyển khoản có `status = 'DONE'`, ở phía ghi nợ hoặc ghi có, mỗi tài khoản một lần, xếp tăng dần. Mỗi câu SELECT cần một `WHERE` riêng. Kết quả có 49 dòng.",
          starter: "SELECT debit_account FROM funds_transfer WHERE status = 'DONE'\nUNION\nSELECT credit_account FROM funds_transfer WHERE ____\nORDER BY 1;",
          solution: "SELECT debit_account FROM funds_transfer WHERE status = 'DONE' UNION SELECT credit_account FROM funds_transfer WHERE status = 'DONE' ORDER BY 1",
          hint: "WHERE chỉ áp cho câu SELECT chứa nó, nên phải lặp điều kiện ở cả hai.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Bạn nối số tiền ghi nợ và số tiền ghi có của hai bảng để tính tổng. Nên dùng gì?",
        options: [
          "UNION, để bỏ các dòng thừa cho gọn",
          "UNION ALL, để hai khoản giống hệt nhau không bị gộp mất",
          "DISTINCT trên từng bảng rồi UNION",
          "INTERSECT, vì cần các giá trị chung",
        ],
        answer: 1,
        explain: "Khi cộng tiền, mỗi dòng là một giao dịch thật. UNION coi hai dòng giống nhau là một và làm tổng bị thiếu. DISTINCT cũng bỏ dòng thật, còn INTERSECT chỉ giữ phần chung nên mất hết phần còn lại.",
      },
    },
    {
      id: "set-rules",
      trap: {
        title: "Cột ghép theo vị trí, không theo tên",
        text: "`SELECT debit_account, credit_account ... UNION ALL SELECT credit_account, debit_account ...` vẫn chạy vì hai cột cùng kiểu, nhưng dữ liệu đã đảo vai ghi nợ và ghi có. Tên cột của kết quả lấy từ câu đầu, nên `ORDER BY` dùng tên của câu sau sẽ báo `column does not exist`.",
      },
      title: "Phần 3: Luật gộp, ORDER BY và cột nhãn",
      scene: "set-rules",
      intro: [
        "Để hai câu `SELECT` gộp được, chúng phải khớp nhau về **hình dạng**: (1) **cùng số cột**; (2) cột ở cùng vị trí phải có **kiểu tương thích** (số với số, chữ với chữ; số nguyên và số thập phân vẫn gộp được). Sai thì PostgreSQL báo lỗi. Ví dụ `SELECT customer_id FROM customer UNION SELECT officer_id, name FROM account_officer` báo \"each UNION query must have the same number of columns\", còn `SELECT customer_id FROM customer UNION SELECT short_name FROM customer` báo \"UNION types integer and character varying cannot be matched\".",
        "Ba luật về **tên và thứ tự**: (3) **Tên cột của kết quả lấy từ câu SELECT đầu tiên**; tên ở các câu sau bị bỏ qua. (4) Các cột ghép **theo vị trí**, không theo tên. Đừng đảo thứ tự cột giữa hai câu (xem khung bẫy). (5) `ORDER BY` chỉ viết **một lần ở cuối cùng** và áp cho toàn bộ kết quả gộp; nó chỉ nhìn thấy tên cột của câu đầu (hoặc số thứ tự cột).",
        "Nếu cần `ORDER BY` hay `LIMIT` riêng cho từng nhánh thì bọc nhánh trong dấu ngoặc. Ví dụ 3 lệnh lớn nhất và 3 lệnh nhỏ nhất trong một kết quả: `(SELECT ft_id, amount FROM funds_transfer ORDER BY amount DESC, ft_id LIMIT 3) UNION ALL (SELECT ft_id, amount FROM funds_transfer ORDER BY amount, ft_id LIMIT 3)`. Không có ngoặc, `ORDER BY` và `LIMIT` của nhánh đầu là lỗi cú pháp, còn của nhánh cuối thì bị hiểu là áp cho cả kết quả gộp.",
        "Thủ thuật rất hay dùng: thêm một **cột nhãn** là hằng số chữ để biết dòng đến từ nhánh nào. Ví dụ báo cáo gộp theo sản phẩm: `SELECT 'CURRENT' AS nhom, COUNT(*) ...` nối `UNION ALL` với nhánh `'SAVINGS'` và nhánh `'LOAN'`. Kết quả thật là 50 tài khoản thanh toán, 20 tiết kiệm và 15 tài khoản vay. Nhãn cũng giúp tách hai phía của chuyển khoản: nhánh ghi nợ gắn `'DEBIT'`, nhánh ghi có gắn `'CREDIT'`, và mỗi lệnh chuyển khoản ra hai dòng (tổng 264 dòng).",
      ],
      sql: [
        {
          prompt: "Báo cáo số tài khoản theo nhóm sản phẩm (`category.product_group`) bằng ba câu SELECT nối `UNION ALL`, mỗi câu một nhóm với cột nhãn `nhom` và cột đếm `so_tai_khoan`. Nhánh đầu đã viết sẵn, hãy viết nốt hai nhánh còn lại (`SAVINGS` và `LOAN`). Kết quả có 3 dòng: 50, 20, 15.",
          starter: "SELECT 'CURRENT' AS nhom, COUNT(*) AS so_tai_khoan\nFROM account a JOIN category c ON c.category_id = a.category_id\nWHERE c.product_group = 'CURRENT'\nUNION ALL\n-- nhánh SAVINGS\n\nUNION ALL\n-- nhánh LOAN\n;",
          solution: "SELECT 'CURRENT' AS nhom, COUNT(*) AS so_tai_khoan FROM account a JOIN category c ON c.category_id = a.category_id WHERE c.product_group = 'CURRENT' UNION ALL SELECT 'SAVINGS', COUNT(*) FROM account a JOIN category c ON c.category_id = a.category_id WHERE c.product_group = 'SAVINGS' UNION ALL SELECT 'LOAN', COUNT(*) FROM account a JOIN category c ON c.category_id = a.category_id WHERE c.product_group = 'LOAN'",
          hint: "Nhánh sau lặp lại cấu trúc nhánh đầu, đổi chữ nhãn và điều kiện product_group. Tên cột lấy từ nhánh đầu nên nhánh sau không cần alias.",
        },
        {
          prompt: "Tách hai phía của mọi lệnh chuyển khoản thành các dòng `ft_id`, `account_id`, `phia` (nhãn `'DEBIT'` hay `'CREDIT'`), xếp theo `ft_id` rồi `phia` (`CREDIT` đứng trước `DEBIT`). Kết quả có 264 dòng.",
          starter: "SELECT ft_id, debit_account AS account_id, 'DEBIT' AS phia FROM funds_transfer\nUNION ALL\nSELECT ft_id, ____, 'CREDIT' FROM funds_transfer\nORDER BY ft_id, phia;",
          solution: "SELECT ft_id, debit_account AS account_id, 'DEBIT' AS phia FROM funds_transfer UNION ALL SELECT ft_id, credit_account, 'CREDIT' FROM funds_transfer ORDER BY ft_id, phia",
          hint: "Nhánh thứ hai lấy phía ghi có, cột còn lại cùng vị trí với nhánh đầu.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Bạn nối hai câu SELECT, câu đầu đặt alias `AS ma_kh` cho cột đầu, câu sau đặt `AS ma_nv`. Kết quả gọi cột đó là gì và ORDER BY dùng tên nào?",
        options: [
          "Cột tên ma_nv vì câu sau chạy sau cùng, ORDER BY dùng ma_nv",
          "Cột tên ma_kh lấy từ câu đầu, ORDER BY dùng ma_kh (hoặc số 1)",
          "Cột có hai tên, ORDER BY dùng tên nào cũng được",
          "Lỗi, vì hai alias khác nhau thì không gộp được",
        ],
        answer: 1,
        explain: "Tên cột của kết quả luôn lấy từ câu SELECT đầu tiên, và ORDER BY chỉ nhìn thấy tên đó (hoặc số thứ tự). Alias của câu sau bị bỏ qua nhưng không gây lỗi, chỉ cần số cột và kiểu khớp nhau.",
      },
    },
    {
      id: "intersect",
      title: "Phần 4: INTERSECT, phần chung của hai danh sách",
      scene: "intersect",
      intro: [
        "`INTERSECT` giữ lại những dòng có mặt ở **cả hai** kết quả, và tự bỏ dòng trùng. Đây là câu trả lời trực tiếp cho \"vừa là A vừa là B\". Ví dụ ngân hàng muốn tìm khách **vừa có tài khoản tiết kiệm vừa có khoản vay** (để xem họ có gửi tiền mà vẫn đi vay không). Câu thứ nhất lấy `customer_id` của các tài khoản thuộc nhóm `SAVINGS`, câu thứ hai lấy `customer_id` của bảng `loan`, và `INTERSECT` cho đúng 7 khách: 100011, 100017, 100024, 100025, 100035, 100036, 100039.",
        "Nhớ luật cũ: hai câu phải cùng số cột và kiểu tương thích. Một bẫy là thêm cột thừa vào một bên, ví dụ `SELECT customer_id, account_id ... INTERSECT SELECT customer_id ...` báo lỗi \"each INTERSECT query must have the same number of columns\". Ngoài ra `INTERSECT` so sánh **cả dòng**: nếu mỗi bên có hai cột thì hai dòng chỉ coi là chung khi cả hai cột đều bằng nhau.",
        "Một ví dụ khác trong cùng bảng: tài khoản vừa từng bị ghi nợ vừa từng được ghi có trong chuyển khoản. Lấy `debit_account` rồi `INTERSECT` với `credit_account` của `funds_transfer` cho 43 tài khoản, tức gần hết (44 tài khoản ghi nợ, chỉ 1 tài khoản chưa từng nhận tiền).",
      ],
      sql: [
        {
          prompt: "Tìm khách hàng vừa có tài khoản tiết kiệm (`product_group = 'SAVINGS'`) vừa có khoản vay. Điền từ khoá giữa hai câu SELECT, xếp theo `customer_id`. Kết quả có 7 dòng.",
          starter: "SELECT a.customer_id\nFROM account a JOIN category c ON c.category_id = a.category_id\nWHERE c.product_group = 'SAVINGS'\n____\nSELECT customer_id FROM loan\nORDER BY 1;",
          solution: "SELECT a.customer_id FROM account a JOIN category c ON c.category_id = a.category_id WHERE c.product_group = 'SAVINGS' INTERSECT SELECT customer_id FROM loan ORDER BY 1",
          hint: "Cần phần chung của hai danh sách khách.",
          ordered: true,
        },
        {
          prompt: "Tìm các tài khoản từng ghi nợ và cũng từng được ghi có trong `funds_transfer`, xếp tăng dần. Kết quả có 43 dòng.",
          starter: "SELECT debit_account FROM funds_transfer\n-- ghép với phía ghi có bằng phép lấy phần chung\n;",
          solution: "SELECT debit_account FROM funds_transfer INTERSECT SELECT credit_account FROM funds_transfer ORDER BY 1",
          hint: "Hai câu SELECT mỗi câu một cột, nối bằng INTERSECT, ORDER BY 1 ở cuối.",
          ordered: true,
        },
      ],
      quiz: {
        question: "`SELECT customer_id FROM A INTERSECT SELECT customer_id FROM B` cho kết quả nào?",
        options: [
          "Khách có ở A hoặc ở B, mỗi khách một lần",
          "Khách có ở cả A và B, mỗi khách một lần",
          "Khách có ở A nhưng không có ở B",
          "Khách có ở B nhưng không có ở A",
        ],
        answer: 1,
        explain: "INTERSECT là phần giao. Lựa chọn \"A hoặc B\" là UNION, còn hai lựa chọn cuối là hai chiều của EXCEPT (A trừ B và B trừ A).",
      },
    },
    {
      id: "except",
      trap: {
        title: "A EXCEPT B khác B EXCEPT A",
        text: "`credit_account EXCEPT debit_account` ra 5 tài khoản từng nhận tiền mà chưa ghi nợ, còn `debit_account EXCEPT credit_account` chỉ ra 1. SQL không báo lỗi khi bạn nhầm chiều. Phần đứng trước là cái muốn giữ, phần đứng sau là cái muốn loại.",
      },
      title: "Phần 5: EXCEPT, có ở bên này mà không có ở bên kia",
      scene: "except",
      intro: [
        "`A EXCEPT B` lấy những dòng có ở kết quả A mà **không** có ở kết quả B, và cũng bỏ dòng trùng. Khác với `UNION` và `INTERSECT`, **thứ tự rất quan trọng**: `A EXCEPT B` khác `B EXCEPT A`. Trong PostgreSQL từ khoá là `EXCEPT` (Oracle gọi là `MINUS`).",
        "Tình huống ngân hàng: khách **có tài khoản thanh toán nhưng chưa có khoản vay nào**, để chào bán gói vay. Lấy `customer_id` của tài khoản nhóm `CURRENT` rồi `EXCEPT` với `customer_id` của `loan` cho 25 khách.",
        "`EXCEPT` cũng bỏ trùng, nên nếu cần giữ số lần xuất hiện thì phải dùng dạng `EXCEPT ALL` (PostgreSQL có hỗ trợ).",
        "Một khác biệt đáng nhớ với `NOT IN` ở bài 8: phép toán tập hợp coi **hai NULL là bằng nhau** khi so dòng. `SELECT mobile FROM customer EXCEPT SELECT mobile FROM customer WHERE customer_status = 'DORMANT'` ra 32 số: NULL bị loại vì bên phải cũng có NULL, còn các số khác vẫn được so bình thường. Cùng câu hỏi viết bằng `NOT IN` thì ra 0 dòng.",
      ],
      sql: [
        {
          prompt: "Tìm khách có tài khoản thanh toán (`product_group = 'CURRENT'`) nhưng chưa có khoản vay nào, xếp theo `customer_id`. Kết quả có 25 dòng. Điền từ khoá.",
          starter: "SELECT a.customer_id\nFROM account a JOIN category c ON c.category_id = a.category_id\nWHERE c.product_group = 'CURRENT'\n____\nSELECT customer_id FROM loan\nORDER BY 1;",
          solution: "SELECT a.customer_id FROM account a JOIN category c ON c.category_id = a.category_id WHERE c.product_group = 'CURRENT' EXCEPT SELECT customer_id FROM loan ORDER BY 1",
          hint: "Giữ phần của danh sách đầu, loại những khách có trong danh sách khoản vay.",
          ordered: true,
        },
        {
          prompt: "Tìm các tài khoản từng nhận tiền trong `funds_transfer` (cột `credit_account`) nhưng chưa bao giờ là bên ghi nợ. Xếp tăng dần. Kết quả có 5 dòng.",
          starter: "SELECT credit_account FROM funds_transfer\n____\nSELECT debit_account FROM funds_transfer\nORDER BY 1;",
          solution: "SELECT credit_account FROM funds_transfer EXCEPT SELECT debit_account FROM funds_transfer ORDER BY 1",
          hint: "Chiều quan trọng: phần giữ lại đứng trước EXCEPT.",
          ordered: true,
        },
        {
          prompt: "Viết từ đầu: các tài khoản (cột `account_id` của bảng `account`) chưa từng đứng ở phía ghi nợ của lệnh chuyển khoản nào, xếp tăng dần. Kết quả có 41 dòng.",
          starter: "-- viết câu lệnh của bạn ở đây\n",
          solution: "SELECT account_id FROM account EXCEPT SELECT debit_account FROM funds_transfer ORDER BY 1",
          hint: "Danh sách tất cả tài khoản trừ danh sách tài khoản ghi nợ.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Muốn tìm khách đã mở tài khoản nhưng chưa có khoản vay, viết `danh_sach_vay EXCEPT danh_sach_tai_khoan` có đúng không?",
        options: [
          "Đúng, vì EXCEPT không phụ thuộc thứ tự",
          "Sai, vì kết quả đó là khách có vay mà chưa có tài khoản; phải đảo chiều",
          "Đúng, nhưng chỉ khi hai danh sách có cùng số dòng",
          "Sai, vì EXCEPT chỉ dùng được với cột chữ",
        ],
        answer: 1,
        explain: "A EXCEPT B giữ phần của A mà B không có. Nên danh sách vay trừ danh sách tài khoản là khách có vay nhưng không có tài khoản, ngược với ý muốn. Số dòng hai danh sách và kiểu cột không quyết định chiều.",
      },
    },
    {
      id: "set-vs-join",
      trap: {
        title: "JOIN thay phép tập hợp thì phải tự bỏ trùng",
        text: "Khách có tài khoản thanh toán và khoản vay: `INTERSECT` ra 15 khách, còn JOIN ra 18 dòng vì một khách có hai tài khoản thanh toán, phải thêm `DISTINCT` mới ra 15. Tương tự anti-join theo tài khoản ra 32 dòng, còn `EXCEPT` theo khách ra 25. Luôn kiểm tra đơn vị đếm: dòng hay khách.",
      },
      title: "Phần 6: So với JOIN và anti-join tương đương",
      scene: "set-vs-join",
      intro: [
        "Nhiều câu hỏi làm được cả bằng phép tập hợp lẫn bằng JOIN. `INTERSECT` tương đương một **INNER JOIN** rồi `DISTINCT`, còn `EXCEPT` tương đương một **anti-join**: `LEFT JOIN ... WHERE bảng_phải.cột IS NULL` (bài JOIN đã dạy), cũng cần `DISTINCT` nếu muốn mỗi khách một lần.",
        "Khi nào chọn gì? `INTERSECT`/`EXCEPT` ngắn, đọc như ngôn ngữ thường, nhưng chỉ so sánh **cả dòng** và chỉ trả các cột bạn chọn. JOIN linh hoạt hơn: lấy thêm cột của bảng kia (tên khách, số tiền vay...) trong cùng câu lệnh. Cần thêm thông tin thì dùng JOIN, chỉ cần danh sách khoá thì phép tập hợp gọn hơn.",
      ],
      sql: [
        {
          prompt: "Viết lại \"khách vừa có tài khoản tiết kiệm vừa có khoản vay\" bằng JOIN: nối `account`, `category` và `loan`, lọc nhóm `SAVINGS`, lấy `customer_id` khác nhau, xếp tăng dần. Kết quả có 7 dòng, đúng như INTERSECT.",
          starter: "SELECT DISTINCT a.customer_id\nFROM account a\nJOIN category c ON c.category_id = a.category_id\nJOIN loan l ON l.customer_id = ____\nWHERE c.product_group = 'SAVINGS'\nORDER BY a.customer_id;",
          solution: "SELECT DISTINCT a.customer_id FROM account a JOIN category c ON c.category_id = a.category_id JOIN loan l ON l.customer_id = a.customer_id WHERE c.product_group = 'SAVINGS' ORDER BY a.customer_id",
          hint: "Điều kiện nối loan với account là cùng customer_id.",
          ordered: true,
        },
        {
          prompt: "Viết lại \"khách có tài khoản thanh toán nhưng chưa có khoản vay\" bằng anti-join: `LEFT JOIN loan` rồi giữ dòng không khớp, lấy `customer_id` khác nhau, xếp tăng dần. Kết quả có 25 dòng, đúng như EXCEPT.",
          starter: "SELECT DISTINCT a.customer_id\nFROM account a\nJOIN category c ON c.category_id = a.category_id\nLEFT JOIN loan l ON l.customer_id = a.customer_id\nWHERE c.product_group = 'CURRENT' AND ____\nORDER BY a.customer_id;",
          solution: "SELECT DISTINCT a.customer_id FROM account a JOIN category c ON c.category_id = a.category_id LEFT JOIN loan l ON l.customer_id = a.customer_id WHERE c.product_group = 'CURRENT' AND l.ld_id IS NULL ORDER BY a.customer_id",
          hint: "Khách không có khoản vay thì các cột của l là NULL. Dùng IS NULL, không dùng = NULL.",
          ordered: true,
        },
      ],
      quiz: {
        question: "Vì sao `INTERSECT` cho 15 khách còn INNER JOIN `account` với `loan` (nhóm CURRENT) cho 18 dòng?",
        options: [
          "Vì INTERSECT bỏ bớt khách có khoản vay quá hạn",
          "Vì JOIN không bỏ trùng: khách có hai tài khoản thanh toán xuất hiện hai lần, INTERSECT tự bỏ trùng",
          "Vì INTERSECT chỉ đọc 15 dòng đầu của loan",
          "Vì JOIN luôn cho nhiều dòng hơn INTERSECT, không có lý do gì khác",
        ],
        answer: 1,
        explain: "Mỗi cặp (tài khoản, khoản vay) khớp là một dòng của JOIN, nên khách nhiều tài khoản bị lặp. INTERSECT so sánh danh sách khách và tự loại dòng trùng. Nó không lọc theo trạng thái khoản vay và không giới hạn số dòng đọc.",
      },
    },
  ],
  cards: [
    { q: "`UNION` và `UNION ALL` khác nhau thế nào?", a: "`UNION ALL` giữ mọi dòng. `UNION` bỏ dòng trùng, giống `DISTINCT` áp lên kết quả nối." },
    { q: "Khi nào bắt buộc dùng `UNION ALL`?", a: "Khi đếm hoặc cộng tiền. Bỏ trùng sẽ làm sai tổng mà không báo lỗi." },
    { q: "Hai câu `SELECT` cần khớp nhau những gì để gộp được?", a: "Cùng số cột và kiểu tương thích ở cùng vị trí. Tên cột lấy từ câu đầu, `ORDER BY` viết một lần ở cuối." },
    { q: "`INTERSECT` cho kết quả gì?", a: "Các dòng có mặt ở cả hai kết quả, đã bỏ trùng. Ví dụ khách vừa có tài khoản tiết kiệm vừa có khoản vay ra 7 khách." },
    { q: "Vì sao thứ tự của `EXCEPT` quan trọng?", a: "`A EXCEPT B` giữ phần A không có ở B. Đổi chiều ra tập khác hẳn, ví dụ 5 tài khoản so với 1." },
    { q: "`EXCEPT` tương đương gì trong JOIN?", a: "Anti-join: `LEFT JOIN ... WHERE bảng_phải.khoá IS NULL`. Nhưng JOIN không tự bỏ trùng nên cần `DISTINCT`." },
  ],
  summaryTitle: "Ghi nhớ",
  modelAnswer:
    "Phép toán tập hợp xếp chồng hai kết quả theo chiều dọc, khác JOIN ghép theo chiều ngang. UNION ALL giữ mọi dòng, UNION bỏ dòng trùng, nên khi cộng hay đếm thì dùng UNION ALL. Hai câu SELECT phải cùng số cột, cột cùng vị trí có kiểu tương thích, tên cột lấy từ câu đầu, và ORDER BY chỉ viết một lần ở cuối. Cột nhãn hằng số giúp biết dòng đến từ nhánh nào. INTERSECT giữ phần chung (khách vừa có tiết kiệm vừa có vay), EXCEPT giữ phần có ở vế trước mà không có ở vế sau và phụ thuộc chiều. So với JOIN và anti-join, phép tập hợp tự bỏ trùng nên ngắn gọn hơn, còn JOIN cho phép lấy thêm cột.",
};
