import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outputs below were run on SQLite 3.43 (normalization, constraints with PRAGMA foreign_keys=ON, transaction rollback) and a Java simulation of a connection pool in front of a database that runs 4 queries at once (400 requests, 10 ms each).
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
    "Chặng 3: connection pool. Vì sao tăng pool chưa chắc nhanh hơn, và bảng nhớ replication, migration.",
  ],
  sections: [
    {
      id: "normalize",
      title: "Chuẩn hoá: mỗi thông tin chỉ lưu một chỗ",
      intro: [
        "Nếu **địa chỉ khách hàng** lặp lại ở mỗi dòng đơn hàng, sửa một dòng mà quên các dòng khác làm dữ liệu mâu thuẫn ({{update-anomaly}}).",
        "**Chuẩn hoá** tách thông tin ra bảng riêng (bảng `customers`) và nối bằng khoá ngoại, để mỗi thông tin chỉ có đúng một nơi.",
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
        "Nhớ nhanh: **1NF** mỗi ô một giá trị; **2NF** mỗi cột phụ thuộc cả khoá chính; **3NF** cột không phụ thuộc cột không phải khoá. Bảng đọc nhiều đôi khi **phi chuẩn hoá có chủ đích** để tránh JOIN.",
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
        "**UNIQUE** chặn trùng, **FOREIGN KEY** chặn tham chiếu tới dòng không tồn tại, **CHECK** chặn giá trị phi lý, **NOT NULL** chặn thiếu. Khi vi phạm, database từ chối câu lệnh.",
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
    },
    {
      id: "atomicity",
      title: "Atomicity: làm trọn hoặc không làm gì",
      intro: [
        "**Transaction** gom nhiều câu lệnh thành một đơn vị: hoặc **COMMIT** tất cả, hoặc **ROLLBACK** về như chưa làm gì. Đó là chữ **A (Atomicity)** của ACID.",
        "Chuyển tiền gồm hai bước (trừ rồi cộng). Nếu bước hai lỗi mà bước một đã chạy thì tiền biến mất.",
      ],
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
            ask("Cả hai bước đúng", ok("Đã chạy: sau `COMMIT`, tài khoản 1 là `40` và tài khoản 2 là `60`, tổng không đổi.")),
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
      title: "Connection pool: to chưa chắc nhanh hơn",
      intro: [
        "Mở một kết nối database rất tốn, nên ứng dụng giữ sẵn một **pool** kết nối (HikariCP trong Spring Boot, mặc định 10). Request mượn một kết nối, dùng xong trả lại.",
        "Nhưng database chỉ chạy song song được **bằng số lõi** của nó. Pool quá lớn không làm nhanh hơn mà chỉ dồn thêm cạnh tranh lên database.",
      ],
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
        "Đây là mô phỏng nhưng quy luật là thật: HikariCP gợi ý bắt đầu với khoảng `số lõi × 2 + số ổ đĩa` rồi đo. Tổng pool của mọi instance còn phải nhỏ hơn `max_connections` của database.",
      ],
      trap: {
        title: "Chậm thì tăng pool",
        text: "Khi request chậm vì chờ kết nối, tăng pool thường **che** vấn đề thật: truy vấn chậm, transaction giữ kết nối quá lâu (gọi API ngoài bên trong `@Transactional`), hay rò kết nối. Hãy tìm nguyên nhân trước.",
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
    { q: "1NF, 2NF, 3NF nhớ thế nào?", a: "1NF mỗi ô một giá trị. 2NF mỗi cột phụ thuộc cả khoá chính. 3NF cột không phụ thuộc vào cột không phải khoá." },
    { q: "Vì sao đặt ràng buộc ở database?", a: "Là chốt chặn cuối cho mọi đường ghi (nhiều dịch vụ, script, race giữa hai request). UNIQUE, FOREIGN KEY, CHECK, NOT NULL. synchronized chỉ chặn trong một JVM." },
    { q: "Atomicity trong ACID là gì?", a: "Mọi bước trong transaction cùng có hiệu lực (COMMIT) hoặc cùng bị huỷ (ROLLBACK). Không có transaction thì chuyển tiền làm dở sẽ làm biến mất tiền." },
    { q: "Pool kết nối to hơn có nhanh hơn không?", a: "Không nếu database chỉ chạy song song được ít truy vấn. Khoảng số lõi x 2 + số ổ đĩa rồi đo. Chậm thì tìm truy vấn chậm hay transaction giữ kết nối lâu, đừng chỉ tăng pool." },
    { q: "Vì sao đọc từ replica có thể thấy dữ liệu cũ?", a: "Sao chép bất đồng bộ có độ trễ. Đọc ngay sau ghi thì đọc từ master (read-your-writes)." },
  ],
  modelAnswer:
    "Em chuẩn hoá schema để mỗi thông tin chỉ có một nơi, tránh mâu thuẫn khi cập nhật, và chỉ phi chuẩn hoá khi đo được JOIN là điểm nghẽn. Em đặt UNIQUE, FOREIGN KEY, CHECK ở database vì đó là chốt chặn cuối cho mọi đường ghi, kể cả khi hai request chạy cùng lúc. Em gom các bước liên quan vào một transaction để làm trọn hoặc không làm gì. Với connection pool em chọn cỡ gần khả năng song song của database rồi đo, vì pool quá lớn không nhanh hơn mà chỉ gây tranh chấp. Đọc ngay sau ghi thì em đọc từ master vì replica có độ trễ.",
};
