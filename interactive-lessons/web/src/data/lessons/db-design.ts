import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs below were run on SQLite 3.43 (normalization, constraints with PRAGMA foreign_keys=ON, transaction rollback; the atomicity cases were re-run on PGlite 18) and a Java simulation of a connection pool in front of a database that runs 4 queries at once (400 requests, 10 ms each).
export const dbDesign: Lesson = {
  slug: "db-design",
  crumb: "Schema, Constraint, Pool",
  videoDir: "/videos/db-design",
  videoVersion: "0",
  scenes: [],
  title: "Thiết kế schema, ràng buộc, ACID và connection pool",
  subtitle:
    "Chuẩn hoá để tránh dữ liệu mâu thuẫn, ràng buộc để database tự chặn dữ liệu sai, transaction để làm trọn hoặc không làm gì, và vì sao connection pool to chưa chắc nhanh hơn.",
  openingQuiz: {
    question: "Vì sao nên đặt ràng buộc (UNIQUE, FOREIGN KEY, CHECK) ở database thay vì chỉ kiểm tra trong code ứng dụng?",
    options: [
      "Database là nơi cuối cùng chặn mọi đường ghi (nhiều dịch vụ, script, thao tác tay), còn code ứng dụng chỉ chặn đường đi qua nó",
      "Vì code ứng dụng không kiểm tra được",
      "Vì database nhanh hơn",
      "Vì ORM yêu cầu",
    ],
    answer: 0,
    explain: "Dữ liệu sống lâu hơn code và có nhiều nguồn ghi. Ràng buộc ở database là lớp bảo vệ không thể bị bỏ qua.",
  },
  roadmap: [
    "Chặng 1: chuẩn hoá. Vì sao lưu một thông tin ở nhiều nơi gây mâu thuẫn.",
    "Chặng 2: ràng buộc và transaction (atomicity). Database tự chặn dữ liệu sai và không để làm dở.",
    "Chặng 3: connection pool, migration schema không dừng hệ thống, và bảng nhớ replication.",
  ],
  sections: [
    {
      id: "normalize",
      title: "Chuẩn hoá: mỗi thông tin chỉ lưu một chỗ",
      intro: [
        "Nếu **địa chỉ khách hàng** lặp lại ở mỗi dòng đơn hàng, sửa một dòng mà quên các dòng khác làm dữ liệu mâu thuẫn ({{update-anomaly}}).",
        "**Chuẩn hoá** tách thông tin ra bảng riêng (bảng `customers`) và nối bằng khoá ngoại, để mỗi thông tin chỉ có đúng một nơi. Các dạng chuẩn 1NF, 2NF, 3NF được học kỹ ở bài SQL \"ERD và lược đồ quan hệ\" (bài 2); ở đây chỉ lấy ý chính.",
      ],
      widgetTitle: "Khách An đổi địa chỉ",
      compare: [
        way(
          "Một bảng phẳng",
          `orders_flat(id, customer, address, item)
UPDATE orders_flat SET address = '99 Tran Phu' WHERE id = 1;   -- chỉ sửa một dòng`,
          [
            ask("Sửa địa chỉ ở một dòng của An", bad("Đã chạy: bảng giờ có **hai địa chỉ** cho cùng khách An (`12 Le Loi` và `99 Tran Phu`). Dữ liệu mâu thuẫn.")),
            ask("Lưu trữ", bad("Địa chỉ lặp lại ở mọi dòng đơn hàng, tốn chỗ và dễ lệch.")),
          ],
          "Cùng một sự thật được lưu ở nhiều nơi.",
        ),
        way(
          "Chuẩn hoá thành hai bảng",
          `customers(id, name, address)
orders(id, customer_id REFERENCES customers(id), item)
UPDATE customers SET address = '99 Tran Phu' WHERE id = 1;     -- một chỗ duy nhất`,
          [
            ask("Sửa địa chỉ của An", ok("Đã chạy: sửa **một** dòng trong `customers`, cả 3 đơn hàng khi nối (`JOIN`) đều ra `99 Tran Phu`.")),
            ask("Lưu trữ", ok("Địa chỉ chỉ lưu một lần.")),
          ],
          "Mỗi thông tin có một nguồn sự thật duy nhất.",
        ),
      ],
      after: [
        "Ba dạng chuẩn hay được hỏi đều dùng từ **phụ thuộc**: cột A phụ thuộc cột B nếu biết B là suy ra được A (biết mã khách là biết địa chỉ khách). Ba dạng đó là:",
        "- **1NF**: mỗi ô một giá trị. `orders(id, items)` với ô `items = 'bút, vở'` vi phạm; tách thành mỗi món một dòng.",
        "- **2NF**: khi khoá chính gồm nhiều cột, mọi cột khác phải phụ thuộc **cả** khoá, không chỉ một phần. `order_items(order_id, product_id, product_name, qty)` với khoá `(order_id, product_id)`: `qty` cần cả hai cột, nhưng `product_name` chỉ cần `product_id`, nên tên sản phẩm lặp lại ở mọi đơn có nó. Chuyển `product_name` sang bảng `products(product_id, product_name)`.",
        "- **3NF**: cột thường không phụ thuộc vào một cột thường khác. `orders(id, customer_id, customer_address)`: `customer_address` phụ thuộc `customer_id` (không phải khoá của bảng này), chính là ví dụ địa chỉ ở trên; chuyển nó sang `customers`.",
        "Bảng đọc nhiều đôi khi **phi chuẩn hoá có chủ đích** để tránh JOIN.",
      ],
      trap: {
        title: "Phi chuẩn hoá từ đầu",
        text: "Gộp mọi thứ vào một bảng cho tiện là phi chuẩn hoá không có chủ đích, dẫn tới dữ liệu mâu thuẫn. Chuẩn hoá trước, chỉ phi chuẩn hoá khi **đo được** JOIN là điểm nghẽn.",
      },
      quiz: {
        question: "Địa chỉ khách lưu lặp lại trong từng dòng đơn hàng. Rủi ro chính là gì?",
        options: [
          "Sửa ở một dòng mà quên dòng khác làm dữ liệu mâu thuẫn",
          "Truy vấn luôn chậm",
          "Không dùng được khoá chính",
          "Không thể thêm đơn hàng",
        ],
        answer: 0,
        explain: "Đã chạy: sau khi sửa một dòng, cùng một khách có hai địa chỉ.",
      },
    },
    {
      id: "constraints",
      title: "Ràng buộc: để database tự chặn dữ liệu sai",
      intro: [
        "Chuẩn hoá giúp dữ liệu không mâu thuẫn. Nhưng ai chặn dữ liệu sai ngay lúc ghi? Database có bốn loại ràng buộc:",
        "- **UNIQUE**: chặn trùng.",
        "- **FOREIGN KEY**: chặn tham chiếu tới dòng không tồn tại.",
        "- **CHECK**: chặn giá trị phi lý.",
        "- **NOT NULL**: chặn thiếu.",
        "Khi vi phạm, database từ chối câu lệnh.",
      ],
      widgetTitle: "Thêm dữ liệu sai vào database",
      compare: [
        way(
          "Chỉ kiểm tra trong code",
          `// service: if (exists(email)) throw ...; if (qty <= 0) throw ...;
// bảng không có UNIQUE, FOREIGN KEY, CHECK`,
          [
            ask("Hai request cùng lúc đăng ký một email", bad("Cả hai cùng kiểm tra \"chưa có\" rồi cùng thêm: trùng email. Kiểm tra trong code không chặn được race.")),
            ask("Script nhập liệu hay thao tác tay vào database", bad("Đường ghi không đi qua service nên bỏ qua mọi kiểm tra.")),
          ],
          "Lớp bảo vệ chỉ có ở một đường đi.",
        ),
        way(
          "Ràng buộc trong schema",
          `CREATE TABLE users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL);
CREATE TABLE items(id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  qty INTEGER CHECK (qty > 0));`,
          [
            ask("Email trùng", ok("Đã chạy: `UNIQUE constraint failed: users.email`.")),
            ask("Khoá ngoại trỏ tới user không tồn tại", ok("Đã chạy: `FOREIGN KEY constraint failed`.")),
            ask("Số lượng âm", ok("Đã chạy: `CHECK constraint failed: qty > 0`. Cuối cùng bảng chỉ còn **1** dòng hợp lệ.")),
          ],
          "Mọi đường ghi đều bị chặn, kể cả khi hai request chạy cùng lúc.",
        ),
      ],
      after: [
        "Trong SQLite phải bật `PRAGMA foreign_keys = ON` mới kiểm tra khoá ngoại. PostgreSQL và MySQL InnoDB kiểm tra mặc định. Vẫn nên kiểm tra ở ứng dụng để báo lỗi thân thiện, nhưng database là chốt chặn cuối.",
        "Với tình huống \"chưa có thì thêm\", đừng `SELECT` kiểm tra rồi mới `INSERT`. Cứ `INSERT` và để UNIQUE quyết định: bắt lỗi trùng rồi trả 409, hoặc dùng `INSERT ... ON CONFLICT DO NOTHING` của PostgreSQL (bài INSERT, UPDATE, DELETE và Transaction, phần UPSERT).",
      ],
      trap: {
        title: "Bắt `DataIntegrityViolationException` và nuốt lỗi",
        text: "Khi database từ chối, hãy chuyển thành lỗi nghiệp vụ rõ ràng (ví dụ 409 Conflict cho email trùng), đừng bỏ qua hay trả 500.",
      },
      quiz: {
        question: "Hai request cùng lúc đăng ký một email, code kiểm tra \"chưa tồn tại\" rồi mới thêm. Cách chặn trùng chắc chắn là gì?",
        options: [
          "Ràng buộc UNIQUE trên cột email ở database",
          "Kiểm tra hai lần trong code",
          "Thêm `synchronized`",
          "Dùng cache",
        ],
        answer: 0,
        explain: "`synchronized` chỉ có tác dụng trong một JVM. UNIQUE ở database chặn mọi tiến trình.",
      },
      parts: [
        {
          id: "surrogate-key",
          title: "Khoá chính là email hay một mã vô nghĩa",
          intro: [
            "Bài SQL cơ bản chọn `customer_id` làm khoá chính chứ không phải họ tên, vì tên dễ trùng. Còn email thì sao? Email duy nhất, có sẵn, ai cũng hiểu. Vậy dùng luôn email làm khoá chính và khoá ngoại có được không?",
            "Có thể được, nhưng nhìn vào lúc **giá trị đổi**. Khoá tự nhiên (dữ liệu có nghĩa ngoài đời, như email hay số điện thoại) có thể đổi, và khoá ngoại ở mọi bảng con đang trỏ vào đúng giá trị đó. **Khoá thay thế** (surrogate key) là một mã vô nghĩa do database cấp (`IDENTITY`), không bao giờ cần đổi. Đặt thêm `UNIQUE` cho email để vẫn chặn trùng.",
          ],
          predict: {
            question: "Bảng cha có khoá chính là `email`, bảng con có khoá ngoại trỏ vào `email` (hai dòng con). Chạy `UPDATE` đổi email của dòng cha sang địa chỉ mới. Kết quả?",
            options: [
              "Đổi thành công, hai dòng con tự đổi theo",
              "Bị từ chối vì hai dòng con đang trỏ vào email cũ",
              "Đổi thành công, hai dòng con trỏ vào email không còn tồn tại",
              "Bảng con bị xoá",
            ],
            answer: 1,
            explain: "Đã chạy trên PGlite: `update or delete on table \"u_p\" violates foreign key constraint \"u_c_email_fkey\" on table \"u_c\"`. Khoá ngoại mặc định không cho đổi giá trị mà bảng con đang tham chiếu.",
          },
          widgetTitle: "Đổi email của một khách có hai dòng con",
          compare: [
            way(
              "Khoá tự nhiên: PRIMARY KEY (email)",
              `CREATE TABLE u_p (email text PRIMARY KEY, name text);
CREATE TABLE u_c (
  id    integer PRIMARY KEY,
  email text REFERENCES u_p(email)    -- thêm ON UPDATE CASCADE nếu muốn lan theo
);
UPDATE u_p SET email = 'an@new.vn';`,
              [
                ask("Đổi email, khoá ngoại mặc định", bad("Bị từ chối: `violates foreign key constraint \"u_c_email_fkey\" on table \"u_c\"`.")),
                ask("Đổi email, thêm `ON UPDATE CASCADE`", ok("Đổi được, cả hai dòng con đổi theo thành `an@new.vn`. Nhưng mỗi lần đổi email là sửa hàng loạt ở mọi bảng con.")),
              ],
              "Chạy được, nhưng giá trị đổi thì kéo theo mọi bảng con.",
            ),
            way(
              "Khoá thay thế: id + UNIQUE (email)",
              `CREATE TABLE u_p (
  id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name  text
);
CREATE TABLE u_c (id integer PRIMARY KEY, p_id integer REFERENCES u_p(id));
UPDATE u_p SET email = 'an@new.vn';`,
              [
                ask("Đổi email", ok("Đổi được, chỉ sửa một dòng cha. Hai dòng con vẫn trỏ `p_id = 1`, không phải đụng tới.")),
                ask("Thêm một khách khác cũng email `an@new.vn`", ok("Bị chặn bởi `duplicate key value violates unique constraint \"u_p_email_key\"`: `UNIQUE` vẫn giữ luật không trùng email.")),
              ],
              "Khoá chính không đổi bao giờ, luật \"email duy nhất\" giao cho UNIQUE.",
            ),
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Khoá chính là giá trị mà mọi khoá ngoại trỏ vào → giá trị có nghĩa ngoài đời có thể đổi → dùng mã vô nghĩa làm khoá chính, và đặt `UNIQUE` cho cột tự nhiên."],
          },
          quiz: {
            question: "Đã dùng `id` tự tăng làm khoá chính. Vì sao vẫn nên đặt `UNIQUE` cho `email`?",
            options: [
              "Vì khoá chính phải là chuỗi",
              "Vì `id` khác nhau vẫn cho phép hai dòng cùng email; chỉ UNIQUE mới chặn trùng email",
              "Vì UNIQUE làm truy vấn chạy nhanh hơn khoá chính",
              "Không cần, id đã đủ",
            ],
            answer: 1,
            explain: "Khoá thay thế chỉ nhận diện dòng, không biết gì về luật nghiệp vụ. Đã chạy: dòng thứ hai cùng email bị chặn bởi `u_p_email_key`.",
          },
        },
      ],
    },
    {
      id: "atomicity",
      title: "Atomicity: làm trọn hoặc không làm gì",
      intro: [
        "Ràng buộc chặn từng câu lệnh sai. Nhưng khi một việc gồm nhiều câu lệnh và một câu lỗi giữa chừng thì sao?",
        "**Transaction** gom nhiều câu lệnh thành một đơn vị: hoặc **COMMIT** tất cả, hoặc **ROLLBACK** về như chưa làm gì. Đó là chữ **A (Atomicity)** của ACID. Cú pháp `BEGIN`, `COMMIT`, `ROLLBACK` đã học ở bài SQL \"INSERT UPDATE DELETE\" (bài 11); ở đây ta xem vì sao cần chúng.",
        "Chuyển tiền gồm hai bước (trừ rồi cộng). Nếu bước hai lỗi mà bước một đã chạy thì tiền biến mất.",
        "Bảng dùng trong ví dụ: `CREATE TABLE acct(id INTEGER PRIMARY KEY, bal INTEGER CHECK (bal <= 500))`, với hai dòng: tài khoản 1 có `bal = 100`, tài khoản 2 có `bal = 0`. Ràng buộc `CHECK (bal <= 500)` nghĩa là không tài khoản nào được quá 500.",
        "Ta muốn chuyển 60 từ tài khoản 1 sang 2. Để thấy rollback hoạt động, bước hai bên dưới **cố tình viết sai** thành `bal + 600` (chứ không phải `+ 60`): tài khoản 2 sẽ thành 600, vượt `CHECK`, nên câu lệnh đó lỗi. Đây là cách giả lập một bước hỏng giữa chừng; bản đúng `+ 60` nằm ở tình huống cuối.",
      ],
      predict: {
        question: "Không dùng transaction: bước một trừ 60 ở tài khoản 1 thành công, bước hai lỗi vì vi phạm `CHECK`. Hai tài khoản còn bao nhiêu?",
        options: [
          "`100` và `0`, database tự huỷ bước một",
          "`40` và `0`, 60 đồng biến mất",
          "`40` và `60`, bước hai vẫn cộng được 60",
          "`100` và `600`, chỉ bước hai có hiệu lực",
        ],
        answer: 1,
        explain: "Mỗi câu lệnh tự commit, nên bước một đã có hiệu lực trước khi bước hai lỗi. Đã chạy: tài khoản 1 còn `40`, tài khoản 2 vẫn `0`.",
      },
      widgetTitle: "Chuyển 60 từ tài khoản 1 sang 2",
      compare: [
        way(
          "Không dùng transaction",
          `UPDATE acct SET bal = bal - 60 WHERE id = 1;     -- thành công
UPDATE acct SET bal = bal + 600 WHERE id = 2;    -- vi phạm CHECK (bal <= 500), lỗi`,
          [
            ask("Bước hai lỗi", bad("Đã chạy: tài khoản 1 còn `40`, tài khoản 2 vẫn `0`. **60 đồng biến mất.**")),
          ],
          "Mỗi câu lệnh tự commit, làm dở là dữ liệu hỏng.",
        ),
        way(
          "BEGIN ... COMMIT / ROLLBACK",
          `BEGIN;
UPDATE acct SET bal = bal - 60 WHERE id = 1;
UPDATE acct SET bal = bal + 600 WHERE id = 2;    -- lỗi
ROLLBACK;                                        -- hoặc COMMIT nếu mọi bước thành công`,
          [
            ask("Bước hai lỗi", ok("Đã chạy: sau `ROLLBACK`, tài khoản 1 về `100`, tài khoản 2 là `0`, như chưa có gì xảy ra.")),
            ask("Sửa bước hai thành bal + 60 rồi COMMIT", ok("Đã chạy `BEGIN; UPDATE acct SET bal = bal - 60 WHERE id = 1; UPDATE acct SET bal = bal + 60 WHERE id = 2; COMMIT;`: tài khoản 1 là `40`, tài khoản 2 là `60`, tổng vẫn 100.")),
            ask("Bước hai lỗi mà vẫn gõ COMMIT", ok("Đã chạy trên PostgreSQL: sau một câu lỗi, transaction bị đánh dấu hỏng; `COMMIT` lúc đó thực chất là rollback, hai tài khoản vẫn `100` và `0`.")),
          ],
          "Cả hai bước thành công hoặc không bước nào có hiệu lực.",
        ),
      ],
      after: [
        "Trong Spring, `@Transactional` bao quanh method bằng transaction và tự rollback khi có `RuntimeException`. Xem các bài về transaction để biết các bẫy (proxy, self-invocation, propagation).",
      ],
      trap: {
        title: "Tưởng mỗi câu lệnh là một transaction đủ rồi",
        text: "Mỗi câu lệnh riêng lẻ có thể tự commit. Chỉ khi bạn gom chúng vào một transaction thì mới được \"làm trọn hoặc không làm gì\".",
      },
      takeaway: {
        lines: [
          "Việc gồm nhiều bước (trừ rồi cộng) phải nằm trong **một** transaction.",
          "Trên PostgreSQL, sau một câu lỗi thì transaction đã hỏng: gõ `COMMIT` lúc đó cũng chỉ là rollback.",
        ],
      },
      quiz: {
        question: "Chữ A trong ACID (Atomicity) bảo đảm điều gì?",
        options: [
          "Tất cả thay đổi trong transaction cùng có hiệu lực hoặc cùng bị huỷ",
          "Các transaction chạy tuần tự",
          "Dữ liệu được lưu xuống đĩa",
          "Dữ liệu luôn hợp lệ theo ràng buộc",
        ],
        answer: 0,
        explain: "Đó là Atomicity. Đã chạy: sau `ROLLBACK`, cả hai tài khoản về nguyên trạng.",
      },
    },
    {
      id: "pool",
      senior: true,
      title: "Connection pool: to chưa chắc nhanh hơn",
      intro: [
        "Mở một kết nối database rất tốn, nên ứng dụng giữ sẵn một **pool** kết nối (HikariCP trong Spring Boot, mặc định 10). Request mượn một kết nối, dùng xong trả lại.",
        "Nhưng database chỉ thật sự chạy song song được **khoảng bằng số lõi** CPU của nó; nhiều hơn một chút khi truy vấn phải chờ đọc đĩa (I/O), vì lúc một truy vấn chờ đĩa thì lõi rảnh cho truy vấn khác. Pool quá lớn không làm nhanh hơn mà chỉ dồn thêm cạnh tranh lên database.",
        "Hãy hình dung database là một ngân hàng có vài quầy giao dịch, còn pool là số khách được vào sảnh cùng lúc. Cho vào quá ít thì quầy bỏ trống. Cho vào quá nhiều cũng không mở thêm quầy: khách chỉ đứng chen nhau đông hơn.",
      ],
      predict: {
        question: "Mô phỏng database chạy được 4 truy vấn cùng lúc, 400 request. Tăng pool từ 1 lên 4 kết nối thì tổng thời gian thay đổi thế nào?",
        options: [
          "Gần như không đổi",
          "Nhanh khoảng 4 lần",
          "Nhanh khoảng 2 lần",
          "Chậm đi vì tranh chấp",
        ],
        answer: 1,
        explain: "Pool 1 bắt mọi request xếp hàng sau một kết nối, trong khi database còn 3 chỗ trống. Đã chạy: pool 1 mất khoảng 4900 ms, pool 4 khoảng 1230 ms.",
      },
      widgetTitle: "400 request, mỗi request một truy vấn 10 ms",
      compare: [
        way(
          "Pool quá nhỏ (1 kết nối)",
          `spring.datasource.hikari.maximum-pool-size=1`,
          [
            ask("400 request cùng đến (mô phỏng database chạy được 4 truy vấn cùng lúc)", bad("Đã chạy: mất khoảng **4900 ms**, chỉ khoảng 81 request/giây, request giữa hàng đợi chờ khoảng 2,5 giây.")),
          ],
          "Mọi request xếp hàng chờ một kết nối.",
        ),
        way(
          "Pool vừa đủ rồi pool lớn",
          `maximum-pool-size=4         # gần bằng khả năng song song của database
maximum-pool-size=64        # gấp 16 lần`,
          [
            ask("Pool 4", ok("Đã chạy: khoảng **1230 ms**, 325 request/giây. Nhanh gấp 4 lần pool 1.")),
            ask("Pool 16 và 64", bad("Đã chạy: vẫn khoảng 1200 ms và 330 request/giây. **Không nhanh hơn**, vì database chỉ xử lý 4 truy vấn cùng lúc. Trên database thật, quá nhiều kết nối còn gây tranh chấp và chậm đi.")),
          ],
          "Có một điểm vừa đủ. Vượt qua nó chỉ tốn thêm tài nguyên.",
        ),
      ],
      after: [
        "Đây là mô phỏng nhưng quy luật là thật: HikariCP gợi ý bắt đầu với khoảng `số lõi × 2 + số ổ đĩa` rồi đo. Hệ số `× 2` và phần cộng số ổ đĩa chính là phần \"nhiều hơn số lõi một chút\" để bù thời gian truy vấn chờ I/O. Tổng pool của mọi instance còn phải nhỏ hơn `max_connections` của database.",
      ],
      trap: {
        title: "Chậm thì tăng pool",
        text: "Khi request chậm vì chờ kết nối, tăng pool thường **che** vấn đề thật: truy vấn chậm, transaction giữ kết nối quá lâu (gọi API ngoài bên trong `@Transactional`), hay rò kết nối. Hãy tìm nguyên nhân trước.",
      },
      takeaway: {
        lines: [
          "Bắt đầu pool ở khoảng `số lõi × 2 + số ổ đĩa` rồi đo, và giữ tổng pool mọi instance dưới `max_connections`.",
        ],
      },
      quiz: {
        question: "Database chỉ xử lý song song được khoảng 4 truy vấn. Tăng pool từ 4 lên 64 thì sao?",
        options: [
          "Không nhanh hơn, có thể còn chậm đi vì tranh chấp",
          "Nhanh gấp 16 lần",
          "Nhanh gấp đôi",
          "Database tự mở rộng",
        ],
        answer: 0,
        explain: "Đã chạy (mô phỏng): pool 4 ra khoảng 325 req/s, pool 64 vẫn khoảng 333 req/s.",
      },
    },
    {
      id: "migration",
      title: "Migration schema: đổi bảng khi app đang chạy",
      intro: [
        "Ràng buộc đã đúng, nhưng schema còn phải đổi theo code: thêm cột, đổi tên cột, thêm `NOT NULL`. Đổi thế nào khi app đang chạy và bảng có vài chục triệu dòng?",
        "Cách hay gặp lúc mới đi làm: ai đó gõ `ALTER TABLE` tay trên production, hoặc để Hibernate `ddl-auto=update` tự sửa bảng. Kết quả là staging và production lệch nhau, và không ai biết schema hiện tại đã qua những bước nào.",
        "**Flyway** giải quyết bằng các file SQL có phiên bản trong `src/main/resources/db/migration`:",
        "- **Đặt tên `V{số}__{mô tả}.sql`**: ví dụ `V1__create_orders.sql`, `V2__add_phone.sql`, hai dấu gạch dưới giữa số và mô tả. Flyway chạy theo thứ tự số, mỗi file đúng một lần.",
        "- **Bảng `flyway_schema_history`**: ghi file nào đã chạy, lúc nào, kèm **checksum** (mã băm nội dung file).",
        "- **Không sửa file đã chạy**: sửa một chữ trong `V2` thì checksum đổi, lần khởi động sau Flyway báo checksum mismatch và app không lên. Muốn đổi thì thêm `V3`.",
        "- **Với Spring Boot**: có `flyway-core` trên classpath là migration tự chạy lúc khởi động, trước khi JPA dùng tới bảng. Đặt `spring.jpa.hibernate.ddl-auto=validate` để Hibernate chỉ kiểm tra entity khớp schema, không tự sửa.",
        "Khó hơn là đổi schema khi app đang chạy: xem phần tiếp theo.",
      ],
      trap: {
        title: "Sửa file migration đã chạy",
        text: "File `V2__add_phone.sql` đã chạy trên production thì coi như bất biến. Sửa nó làm checksum lệch và app không khởi động được. Muốn đổi gì thì tạo `V3`.",
      },
      quiz: {
        question: "Đồng nghiệp sửa nội dung file `V2__add_phone.sql` đã chạy trên production để thêm một index. Lần deploy sau chuyện gì xảy ra?",
        options: [
          "Flyway tự chạy lại V2 với nội dung mới",
          "Flyway thấy checksum của V2 khác với `flyway_schema_history`, báo lỗi validate và app không khởi động",
          "Không có gì, Flyway chỉ đọc tên file",
          "Flyway xoá bảng và chạy lại từ V1",
        ],
        answer: 1,
        explain: "Flyway lưu checksum của từng file đã chạy. Thêm index thì tạo `V3__add_phone_index.sql`.",
      },
      parts: [
        {
          id: "migration-expand-contract",
          senior: true,
          title: "Đổi schema không dừng hệ thống: expand và contract",
          intro: [
            "Khó hơn là đổi schema **không dừng hệ thống**. Khi rolling deploy (thay dần từng bản chạy của app, mỗi bản gọi là một pod), pod cũ và pod mới chạy cùng lúc trên cùng một database, nên migration phải chạy **trước** khi bản mới lên, và schema mới vẫn phải chạy được với **code cũ**. Cách làm là **expand và contract**, ví dụ đổi tên cột `phone` thành `mobile`:",
            "- **Expand**: thêm cột `mobile`, code mới ghi cả hai cột.",
            "- **Backfill**: chép dữ liệu cũ sang theo từng lô, khoảng 1000 dòng mỗi transaction, không dùng một câu `UPDATE` khổng lồ giữ khoá rất lâu.",
            "- **Chuyển đọc**: code đọc từ `mobile`.",
            "- **Contract**: khi không còn pod nào dùng `phone`, migration sau mới xoá cột cũ.",
            "Ví dụ cụ thể: thêm `NOT NULL` cho cột `status` của bảng lớn. Trên PostgreSQL, `ALTER COLUMN status SET NOT NULL` phải quét cả bảng để kiểm tra, trong lúc giữ khoá `ACCESS EXCLUSIVE` chặn cả đọc lẫn ghi. So hai cách:",
          ],
          predict: {
            question: "Bảng đã có dòng `status` NULL. Chạy `ADD CONSTRAINT status_nn CHECK (status IS NOT NULL) NOT VALID`, rồi `INSERT` một dòng mới không có `status`. Chuyện gì xảy ra?",
            options: [
              "INSERT thành công, vì `NOT VALID` nghĩa là ràng buộc chưa có hiệu lực",
              "INSERT bị từ chối: `NOT VALID` chỉ bỏ qua dòng **cũ**, dòng mới vẫn bị kiểm tra",
              "Câu `ADD CONSTRAINT` lỗi vì bảng đang có dòng NULL",
              "PostgreSQL tự điền `status` cho dòng mới",
            ],
            answer: 1,
            explain: "Đã chạy trên PGlite (PostgreSQL 18): `ADD CONSTRAINT ... NOT VALID` thành công dù bảng có dòng NULL, còn `INSERT` dòng mới báo `new row for relation \"big\" violates check constraint \"status_nn\"`.",
          },
          widgetTitle: "Thêm NOT NULL cho cột status của bảng lớn",
          compare: [
            way(
              "Một bước",
              `ALTER TABLE orders ADD COLUMN status text NOT NULL;      -- lỗi nếu bảng đã có dòng
    -- hoặc
    ALTER TABLE orders ALTER COLUMN status SET NOT NULL;    -- quét cả bảng`,
              [
                ask("Pod bản cũ vẫn INSERT không có status", bad("Bị từ chối vì vi phạm NOT NULL: rolling deploy làm lỗi mọi đơn hàng đi qua pod cũ.")),
                ask("Bảng 50 triệu dòng", bad("`SET NOT NULL` quét cả bảng dưới khoá `ACCESS EXCLUSIVE`: mọi câu đọc, ghi vào `orders` phải chờ tới khi quét xong.")),
              ],
              "Đúng cú pháp, nhưng khoá bảng lâu và làm vỡ code cũ.",
            ),
            way(
              "Từng bước, mỗi bước một migration",
              `ALTER TABLE orders ADD COLUMN status text;               -- 1. cho phép NULL, code mới ghi
    UPDATE orders SET status = 'OLD'
     WHERE id BETWEEN 1 AND 1000 AND status IS NULL;          -- 2. backfill từng lô
    ALTER TABLE orders ADD CONSTRAINT status_nn
      CHECK (status IS NOT NULL) NOT VALID;                    -- 3. chỉ kiểm tra dòng mới
    ALTER TABLE orders VALIDATE CONSTRAINT status_nn;          -- 4. quét, nhưng không chặn đọc ghi
    ALTER TABLE orders ALTER COLUMN status SET NOT NULL;       -- 5. dùng CHECK đã validate, bỏ qua quét
    ALTER TABLE orders DROP CONSTRAINT status_nn;`,
              [
                ask("Pod bản cũ vẫn INSERT không có status", ok("Bước 1 cho phép NULL nên pod cũ không lỗi. Bước 3 chỉ làm sau khi mọi pod đã ghi `status`.")),
                ask("Bảng 50 triệu dòng", ok("`VALIDATE CONSTRAINT` quét bảng với khoá nhẹ hơn, đọc ghi vẫn chạy. Từ PostgreSQL 12, `SET NOT NULL` thấy CHECK đã validate nên không quét lại.")),
                ask("Chạy thử cả chuỗi", ok("Đã chạy trên PGlite (PostgreSQL 18) với bảng 1000 dòng: cả 6 câu đều thành công theo đúng thứ tự trên.")),
              ],
              "Mỗi bước ngắn, khoá nhẹ, và code cũ lẫn code mới đều chạy được.",
            ),
          ],
          after: [
            "Một bẫy nữa: `ALTER TABLE` phải chờ có khoá `ACCESS EXCLUSIVE`. Nếu đang có một transaction dài đọc bảng đó, `ALTER` đứng chờ, và mọi câu lệnh mới vào bảng lại xếp hàng **sau** `ALTER`. Một câu DDL tưởng mất 1 ms thành sự cố cả hệ thống.",
            "Cách phòng: chạy `SET lock_timeout = '3s'` trước câu DDL. Không lấy được khoá trong 3 giây thì `ALTER` tự bỏ cuộc, hệ thống chạy tiếp, ta thử lại sau.",
            "Thêm cột có `DEFAULT` là hằng số thì từ PostgreSQL 11 rất nhanh, vì giá trị mặc định chỉ ghi vào metadata, không viết lại từng dòng.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Rolling deploy → code cũ và mới chạy cùng lúc trên một schema → mỗi migration phải tương thích với code cũ → expand, backfill theo lô, rồi mới contract.",
              "Câu DDL trên bảng lớn: đặt `lock_timeout` để không làm cả bảng xếp hàng sau nó.",
            ],
          },
          quiz: {
            question: "Cần thêm `NOT NULL` cho cột của bảng 50 triệu dòng đang chạy. Vì sao nên thêm `CHECK (...) NOT VALID` rồi `VALIDATE CONSTRAINT` thay vì `SET NOT NULL` ngay?",
            options: [
              "Vì `SET NOT NULL` không tồn tại trong PostgreSQL",
              "Vì `SET NOT NULL` quét cả bảng dưới khoá chặn đọc ghi, còn `VALIDATE CONSTRAINT` quét với khoá nhẹ hơn",
              "Vì `NOT VALID` xoá các dòng NULL",
              "Vì CHECK nhanh hơn NOT NULL khi ghi",
            ],
            answer: 1,
            explain: "`NOT VALID` chỉ kiểm tra dòng mới, `VALIDATE` quét dòng cũ mà vẫn cho đọc ghi. Sau đó `SET NOT NULL` (PostgreSQL 12 trở lên) dùng CHECK đã validate nên không quét lại.",
          },
        },
      ],
    },
    {
            id: "bang-nho",
      title: "Bảng nhớ: ACID, replication, migration",
      intro: ["Phần khái niệm hay bị hỏi. Bấm từng dòng để xem câu nên nói."],
      widgetTitle: "Database trong thực tế",
      cheat: [
        { name: "ACID", one: "Bốn bảo đảm của transaction.", say: "Atomicity làm trọn hoặc không làm gì. Consistency giữ dữ liệu hợp lệ theo ràng buộc. Isolation các transaction đồng thời không thấy dở dang của nhau theo mức cô lập. Durability commit rồi thì không mất dù sập nguồn." },
        { name: "Replication và độ trễ", one: "Bản sao đọc, có thể chậm.", say: "Read replica chia tải đọc nhưng sao chép có độ trễ. Vừa ghi xong rồi đọc từ replica có thể thấy dữ liệu cũ, nên việc đọc ngay sau ghi cần đọc từ master (read-your-writes)." },
        { name: "Partition và shard", one: "Chia nhỏ dữ liệu.", say: "Partition chia một bảng lớn thành nhiều phần trong cùng database, ví dụ theo ngày. Sharding chia dữ liệu ra nhiều database theo khoá. Em chỉ shard khi một node không còn chịu nổi vì nó làm phức tạp truy vấn chéo và transaction." },
        { name: "Migration schema", one: "Đổi schema có phiên bản.", say: "Em dùng Flyway hay Liquibase: mỗi thay đổi là một script có phiên bản, chạy theo thứ tự trong CI. Không sửa script đã chạy, tạo script mới. Đổi nguy hiểm thì làm nhiều bước: thêm cột, ghi hai nơi, chuyển dữ liệu, rồi mới xoá cột cũ." },
        { name: "Index", one: "Tăng tốc đọc, tốn ghi.", say: "Index tăng tốc truy vấn nhưng làm chậm ghi và tốn chỗ. Em dùng EXPLAIN để kiểm tra, và đặt index theo các truy vấn thật chứ không đặt mọi cột." },
      ],
      quiz: {
        question: "Bạn ghi một đơn hàng rồi ngay lập tức đọc lại từ read replica nhưng không thấy. Nguyên nhân thường gặp?",
        options: [
          "Độ trễ sao chép: replica chưa nhận được bản ghi mới",
          "Đơn hàng bị mất",
          "Transaction bị rollback",
          "Index bị hỏng",
        ],
        answer: 0,
        explain: "Replication thường bất đồng bộ. Đọc ngay sau khi ghi nên đọc từ master hoặc chờ replica bắt kịp.",
      },
    },
  ],
  cards: [
    { q: "Chuẩn hoá giải quyết vấn đề gì?", a: "Tránh lưu cùng một thông tin ở nhiều nơi gây mâu thuẫn (update anomaly). Tách bảng, nối bằng khoá ngoại. Chỉ phi chuẩn hoá có chủ đích khi đo được JOIN là điểm nghẽn." },
    { q: "1NF, 2NF, 3NF nhớ thế nào?", a: "A phụ thuộc B nghĩa là biết B suy ra A. 1NF mỗi ô một giá trị. 2NF mỗi cột phụ thuộc cả khoá chính, không chỉ một phần của khoá nhiều cột. 3NF cột thường không phụ thuộc vào cột thường khác." },
    { q: "Vì sao đặt ràng buộc ở database?", a: "Là chốt chặn cuối cho mọi đường ghi (nhiều dịch vụ, script, race giữa hai request). UNIQUE, FOREIGN KEY, CHECK, NOT NULL. synchronized chỉ chặn trong một JVM." },
    { q: "Atomicity trong ACID là gì?", a: "Mọi bước trong transaction cùng có hiệu lực (COMMIT) hoặc cùng bị huỷ (ROLLBACK). Không có transaction thì chuyển tiền làm dở sẽ làm biến mất tiền." },
    { q: "Pool kết nối to hơn có nhanh hơn không?", a: "Không nếu database chỉ chạy song song được ít truy vấn. Khoảng số lõi x 2 + số ổ đĩa rồi đo. Chậm thì tìm truy vấn chậm hay transaction giữ kết nối lâu, đừng chỉ tăng pool." },
    { q: "Đổi schema khi rolling deploy thế nào?", a: "Migration (Flyway V{n}__mô_tả.sql, không sửa file đã chạy) chạy trước bản mới và phải tương thích với code cũ: expand (thêm cột cho phép NULL), backfill theo lô, rồi contract. NOT NULL trên bảng lớn: CHECK NOT VALID, VALIDATE, rồi SET NOT NULL. Đặt lock_timeout cho DDL." },
    { q: "Vì sao đọc từ replica có thể thấy dữ liệu cũ?", a: "Sao chép bất đồng bộ có độ trễ. Đọc ngay sau ghi thì đọc từ master (read-your-writes)." },
  ],
  modelAnswer:
    "Em chuẩn hoá schema để mỗi thông tin chỉ có một nơi, tránh mâu thuẫn khi cập nhật, và chỉ phi chuẩn hoá khi đo được JOIN là điểm nghẽn. Em đặt UNIQUE, FOREIGN KEY, CHECK ở database vì đó là chốt chặn cuối cho mọi đường ghi, kể cả khi hai request chạy cùng lúc. Em gom các bước liên quan vào một transaction để làm trọn hoặc không làm gì. Với connection pool em chọn cỡ gần khả năng song song của database rồi đo, vì pool quá lớn không nhanh hơn mà chỉ gây tranh chấp. Đọc ngay sau ghi thì em đọc từ master vì replica có độ trễ.",
};
