import timeline from "../timelines/isolation.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Measured with @SpringBootTest on Spring Boot 3.5, JDK 21; isolation runs on PostgreSQL 16.14 (Testcontainers), some on H2 2.3 and
// MySQL 8.4 as marked. See study note 05.04. Video not rendered yet: scenes stay empty until publish.
export const isolation: Lesson = {
  slug: "isolation",
  crumb: "Isolation & readOnly",
  videoDir: "/videos/isolation",
  videoVersion: "27c5d554",
  scenes: timeline as Scene[],
  title: "Isolation & readOnly",
  subtitle:
    "Các anomaly, bốn isolation level và default của từng DB, MVCC, tái hiện non-repeatable read và phantom, lost update và ba cách sửa, write skew, readOnly thật sự làm gì, và không gọi API ngoài trong transaction.",
  openingQuiz: {
    question: "Stock = 10, hai người cùng mua bằng findById rồi setStock(stock - 1), PostgreSQL READ COMMITTED. Stock cuối?",
    options: ["8", "9: mất một lần trừ (lost update)", "Lỗi deadlock", "10"],
    answer: 1,
    explain: "Đã đo final stock = 9. READ COMMITTED không chặn read-modify-write; sửa bằng atomic UPDATE, @Version hoặc FOR UPDATE.",
  },
  roadmap: [
    "Chặng 1: anomaly, isolation level, MVCC.",
    "Chặng 2: non-repeatable read, phantom, lost update, write skew.",
    "Chặng 3: readOnly và long transaction.",
  ],
  sections: [
    {
      id: "anomalies",
      title: "Phần 1: Anomaly và isolation level",
      scene: "levels",
      intro: [
        "Nhiều transaction chạy cùng lúc trên cùng dữ liệu thì có thể thấy dữ liệu dở dang của nhau. Những hiện tượng sai đó gọi là **anomaly**. **Isolation level** (mức cô lập) là thiết lập của từng transaction, quyết định nó được che chắn khỏi những anomaly nào: che càng nhiều thì càng an toàn nhưng càng tốn khoá hoặc càng hay phải retry.",
        "Ba anomaly của chuẩn SQL:",
        "- **Dirty read**: đọc dữ liệu transaction khác **chưa commit**.",
        "- **Non-repeatable read**: một dòng đọc 2 lần ra 2 giá trị.",
        "- **Phantom**: cùng một query chạy 2 lần, số dòng thay đổi.",
        "Thêm hai thứ hay gây bug thật:",
        "- **Lost update**: hai bên cùng đọc rồi ghi đè nhau (Phần 3).",
        "- **Write skew**: mỗi bên ghi một dòng khác, gộp lại vi phạm quy tắc (Phần 4).",
        "Default đo được: PostgreSQL `read committed`, MySQL InnoDB `REPEATABLE-READ`, H2 READ_COMMITTED. Spring `Isolation.DEFAULT` dùng default của DB, nên cùng code chạy hai DB có thể khác kết quả.",
        "Dirty read đo được thật trên H2: stock đang là 10, transaction A đặt stock thành 999 nhưng **chưa commit**; transaction B chạy ở `READ_UNCOMMITTED` đọc ra **999**, một giá trị có thể bị rollback ngay sau đó. Cùng kịch bản trên PostgreSQL, B đọc ra 10, vì PostgreSQL không có dirty read ở level nào.",
      ],
      takeaway: {
        lines: ["`Isolation.DEFAULT` dùng default của DB: PostgreSQL READ COMMITTED, MySQL InnoDB REPEATABLE READ. Cùng code chạy trên hai DB có thể ra kết quả khác."],
      },
      quiz: {
        question: "Write skew khác lost update ở đâu?",
        options: ["Giống nhau", "Lost update ghi đè cùng một dòng; write skew mỗi bên ghi một dòng khác nhưng tổng thể vi phạm quy tắc", "Write skew chỉ có ở MySQL", "Lost update chỉ có ở SERIALIZABLE"],
        answer: 1,
        explain: "Phần 3 và Phần 4 tái hiện từng cái.",
      },
      parts: [
        {
          id: "levels-table",
          title: "Bốn isolation level chặn anomaly nào",
          intro: [
            "Câu hỏi phỏng vấn kinh điển: mỗi level chặn được anomaly nào. Theo chuẩn SQL, level sau chặn thêm một anomaly so với level trước. Mở từng dòng để xem câu nên nói.",
          ],
          widgetTitle: "Level, và dirty read / non-repeatable read / phantom",
          cheat: [
            { name: "READ_UNCOMMITTED", one: "Dirty read: có thể · Non-repeatable: có thể · Phantom: có thể", say: "Gần như không dùng. PostgreSQL không hỗ trợ, tự coi như READ_COMMITTED." },
            { name: "READ_COMMITTED", one: "Dirty read: chặn · Non-repeatable: có thể · Phantom: có thể", say: "Default của PostgreSQL, Oracle, SQL Server. Mỗi câu lệnh chỉ thấy dữ liệu đã commit tại lúc câu đó chạy." },
            { name: "REPEATABLE_READ", one: "Dirty read: chặn · Non-repeatable: chặn · Phantom: chuẩn SQL cho phép", say: "Default của MySQL InnoDB. PostgreSQL ở level này chặn cả phantom (Phần 2), nhưng vẫn không chặn write skew." },
            { name: "SERIALIZABLE", one: "Dirty read: chặn · Non-repeatable: chặn · Phantom: chặn", say: "Chặn cả write skew. Đổi lại DB có thể huỷ transaction bằng lỗi serialization, ứng dụng phải retry." },
          ],
          quiz: {
            question: "READ COMMITTED chặn được anomaly nào trong ba anomaly của chuẩn SQL?",
            options: ["Không chặn gì", "Chỉ dirty read", "Dirty read và non-repeatable read", "Cả ba"],
            answer: 1,
            explain: "Đọc lại một dòng vẫn có thể ra giá trị mới, và số dòng của cùng query vẫn có thể đổi.",
          },
        },
      ],
    },
    {
      id: "mvcc",
      title: "Phần 2: MVCC và đọc lặp lại",
      scene: "mvcc",
      intro: [
        "Phần 1 nói mỗi level chặn anomaly nào. PostgreSQL và MySQL thực hiện việc đó chủ yếu bằng MVCC (Multi-Version Concurrency Control).",
        "MVCC: update tạo phiên bản mới thay vì ghi đè, mỗi transaction đọc theo một snapshot (bản chụp dữ liệu tại một thời điểm) nên đọc không chặn ghi. READ COMMITTED chụp snapshot **mỗi câu lệnh**; REPEATABLE READ của PostgreSQL chụp ở **câu lệnh đầu tiên** rồi dùng tới cuối. Ghi thì vẫn cần khoá.",
        "Chọn level và kiểu đọc, rồi xem lần đọc thứ hai ra gì khi giữa chừng có transaction khác commit.",
      ],
      predict: {
        question: "PostgreSQL, REPEATABLE READ. Transaction đọc `select stock` (ra 10), giữa chừng transaction khác đổi thành 50 và commit, rồi đọc lại. Lần hai ra bao nhiêu?",
        options: ["50, vì dữ liệu đã commit", "10: snapshot chụp ở câu lệnh đầu tiên và dùng tới cuối", "Lỗi serialization ngay khi đọc", "Câu đọc thứ hai bị chặn tới khi có khoá"],
        answer: 1,
        explain: "REPEATABLE READ của PostgreSQL đọc theo một snapshot cố định suốt transaction. Đổi sang READ COMMITTED thì lần hai ra 50, vì mỗi câu chụp snapshot mới.",
      },
      after: [
        "Đã đo trên PostgreSQL: đọc stock 2 lần, giữa chừng tx khác đổi 10 thành 50: READ COMMITTED `first=10 second=50`, REPEATABLE READ `first=10 second=10`; `count(*)` 1 rồi 2, so với 1 rồi 1.",
        "Bẫy: `findById` hai lần ở READ COMMITTED ra 10 và 10, `sameInstance=true`, vì {{persistence-context|persistence context}} không chạy SQL lần hai. Persistence context là cái map Hibernate giữ trong mỗi transaction, chứa các entity đã load theo id: lần `findById` thứ hai trả luôn object trong map.",
      ],
      takeaway: {
        lines: ["READ COMMITTED chụp snapshot **mỗi câu lệnh**, REPEATABLE READ của PostgreSQL chụp **một lần** rồi dùng tới cuối. Đọc qua JPA còn có thêm persistence context che đi."],
      },
      widget: "isolation-read",
      widgetTitle: "Đọc hai lần, giữa chừng có người sửa",
      quiz: {
        question: "Vì sao findById hai lần lại \"repeatable\" ở READ COMMITTED?",
        options: ["Vì DB khoá dòng", "Vì Hibernate trả entity trong persistence context mà không chạy SQL", "Vì READ COMMITTED chặn non-repeatable read", "Vì cache Redis"],
        answer: 1,
        explain: "Muốn giá trị mới: refresh() hoặc JPQL, native query.",
      },
    },
    {
      id: "lost-update",
      title: "Phần 3: Lost update và ba cách sửa",
      scene: "lostupdate",
      intro: [
        "Mẫu read-modify-write: stock 10, hai người cùng mua. Cả hai `findById` đọc 10, cùng tính 9 trong Java, cùng ghi 9. Đúng ra phải còn 8.",
        "Đã đo: ở READ COMMITTED ra **9**, mất một lần trừ. Đổi lên REPEATABLE READ thì không ra 8 mà transaction thứ hai bị huỷ: `CannotAcquireLockException: could not serialize access due to concurrent update`, nên phải tự bắt và retry. Isolation level không phải cách sửa; ba cách sửa thật nằm ngay bên dưới, trong phần con \"Ba cách sửa\" của Phần 3 này.",
      ],
      widget: "lost-update",
      widgetTitle: "Hai người mua, đúng phải còn 8",
      quiz: {
        question: "Đổi lên REPEATABLE READ trên PostgreSQL có giải quyết lost update không?",
        options: ["Có, hoàn toàn", "Không làm bài toán đúng, chỉ biến lost update thành exception phải bắt và retry", "Làm chậm gấp đôi", "Gây dirty read"],
        answer: 1,
        explain: "Đừng dựa vào isolation level để chống lost update.",
      },
      parts: [
        {
          id: "lost-update-fixes",
          title: "Ba cách sửa: atomic UPDATE, optimistic, pessimistic",
          intro: [
            "Phần 3 cho thấy isolation level không cứu được lost update. Ba cách sửa thật:",
            "- **Atomic UPDATE**: để DB tự trừ trong một câu, `UPDATE product SET stock = stock - 1 WHERE id = ? AND stock >= 1`. Câu UPDATE khoá dòng, đọc giá trị mới nhất rồi mới trừ, nên không mất lượt nào. Đã đo: ra 8. Số dòng bị ảnh hưởng là 0 thì báo hết hàng.",
            "- **Optimistic lock** ({{optimistic-lock|khoá lạc quan}}): thêm field `@Version` vào entity. Không khoá lúc đọc; lúc ghi Hibernate thêm `WHERE version = ?`, ai đã sửa trước thì bên sau ghi 0 dòng và nhận `ObjectOptimisticLockingFailureException`, phải retry. Đã đo đúng exception này.",
            "- **Pessimistic lock** ({{pessimistic-lock|khoá bi quan}}): khoá ngay lúc đọc bằng `SELECT ... FOR UPDATE` (trong Spring Data là `@Lock(PESSIMISTIC_WRITE)`). Bên thứ hai phải chờ bên đầu commit rồi mới đọc được giá trị mới. Đã đo: ra 8, thread B chờ 306 ms.",
          ],
          widgetTitle: "Chọn cách nào",
          cheat: [
            { name: "Atomic UPDATE", one: "Phép tính đơn giản như trừ kho. Nhanh nhất, một câu SQL.", say: "Flash sale trừ kho em dùng UPDATE ... SET stock = stock - 1 WHERE stock >= 1 rồi kiểm tra số dòng bị ảnh hưởng." },
            { name: "@Version (optimistic)", one: "Xung đột hiếm, như sửa hồ sơ. Không khoá, bên thua nhận exception và retry.", say: "Xung đột ít thì em dùng @Version, bắt ObjectOptimisticLockingFailureException và retry hoặc báo người dùng tải lại." },
            { name: "FOR UPDATE (pessimistic)", one: "Xung đột thường xuyên, cần đọc rồi tính phức tạp. Transaction phải thật ngắn.", say: "Nhiều người tranh cùng một dòng thì em khoá bằng FOR UPDATE, giữ transaction ngắn để không chặn người khác lâu." },
          ],
          trap: {
            title: "@Version không áp cho query tự viết",
            text: "`@Version` chỉ được Hibernate kiểm tra khi ghi qua entity (dirty checking hoặc `save`). Câu `@Modifying @Query(\"update ...\")` tự viết bỏ qua nó hoàn toàn.",
          },
          quiz: {
            question: "Flash sale, hàng nghìn người cùng trừ kho một sản phẩm. Cách nào hợp nhất?",
            options: [
              "@Version, vì không khoá",
              "Atomic UPDATE ... SET stock = stock - 1 WHERE stock >= 1",
              "Đổi sang SERIALIZABLE",
              "findById rồi setStock",
            ],
            answer: 1,
            explain: "Xung đột liên tục thì @Version làm phần lớn request thất bại và retry. Atomic UPDATE xử lý xong trong một câu.",
          },
        },
      ],
    },
    {
      id: "write-skew",
      title: "Phần 4: Write skew",
      scene: "writeskew",
      intro: [
        "Lost update là hai bên ghi đè **cùng một dòng**. Write skew khó thấy hơn, vì mỗi bên ghi một dòng khác.",
        "Quy tắc: luôn có ít nhất 1 bác sĩ trực, hiện có 2. A và B cùng đếm thấy 2, cùng xin nghỉ, mỗi bên update **dòng của mình**: không đụng khoá của nhau, cùng commit, còn 0 người trực. Không ai ghi đè ai nhưng gộp lại vi phạm quy tắc.",
        "Đã đo trên PostgreSQL: REPEATABLE READ cả hai commit, `on call now=0`; SERIALIZABLE thì tx còn lại lỗi `could not serialize access due to read/write dependencies among transactions`. Cách sửa:",
        "- **SERIALIZABLE kèm retry**: cho riêng nghiệp vụ này.",
        "- **`FOR UPDATE`**: khoá các dòng dùng để kiểm tra điều kiện, ví dụ `SELECT id FROM doctors WHERE shift_id = 7 AND on_call FOR UPDATE`. Không viết được `SELECT count(*) ... FOR UPDATE`: PostgreSQL báo `FOR UPDATE is not allowed with aggregate functions`, nên lấy các dòng rồi đếm ở ứng dụng.",
        "- **Đưa quy tắc xuống DB**.",
        "Vì sao không đặt SERIALIZABLE cho mọi thứ: DB không chờ mà **huỷ** một trong hai transaction khi phát hiện xung đột, ứng dụng phải bắt lỗi và chạy lại. Tải cao thì xung đột nhiều, retry nhiều, throughput giảm.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Hai bên cùng đọc điều kiện → mỗi bên ghi một dòng khác nên không chạm khoá của nhau → cả hai commit, quy tắc bị vi phạm. REPEATABLE READ không chặn, SERIALIZABLE hoặc `FOR UPDATE` mới chặn."],
      },
      quiz: {
        question: "Vì sao không đặt SERIALIZABLE cho mọi thứ?",
        options: ["Vì không chạy", "PostgreSQL phát hiện xung đột và huỷ transaction (could not serialize access), ứng dụng phải retry, tải cao thì throughput giảm", "Vì bị cấm", "Vì chậm gấp 100 lần"],
        answer: 1,
        explain: "Thường chỉ dùng cho vài nghiệp vụ nhạy cảm, còn lại READ COMMITTED kèm lock có chủ đích.",
      },
      parts: [
        {
          id: "write-skew-missing-row",
          title: "Khi dòng cần khoá chưa tồn tại",
          intro: [
            "Ví dụ bác sĩ trực còn có dòng để khoá. Nhưng có loại write skew mà dòng cần khoá **chưa có**.",
            "Quy tắc: phòng họp 1 không được đặt trùng khung 9 giờ. Hai người cùng đặt. Mỗi transaction chạy `SELECT ... FROM bookings WHERE room_id = 1 AND slot = '09:00'`, cùng thấy 0 dòng, rồi cùng `INSERT` một dòng mới. Thêm `FOR UPDATE` vào câu `SELECT` cũng vô ích: không có dòng nào để khoá, nên không ai phải chờ ai.",
            "Cách sửa là tạo ra một thứ để hai bên **bắt buộc đụng nhau** (gọi là materialize the conflict):",
            "- **Khoá dòng cha**: đầu transaction chạy `SELECT id FROM rooms WHERE id = 1 FOR UPDATE`. Dòng phòng luôn tồn tại, nên mọi lượt đặt phòng 1 xếp hàng sau một khoá duy nhất, người sau đọc lại thì thấy lượt đặt của người trước. Bác sĩ trực cũng làm được vậy: khoá dòng `shifts` của ca đó thay vì từng bác sĩ.",
            "- **Đưa quy tắc thành ràng buộc**: `UNIQUE (room_id, slot)` thì `INSERT` thứ hai bị database từ chối, không cần khoá gì. Khung giờ chồng lấn tuỳ ý thì PostgreSQL có exclusion constraint (`EXCLUDE USING gist`).",
            "- **SERIALIZABLE kèm retry**: database tự phát hiện, như phần trên.",
          ],
          widgetTitle: "Hai người cùng đặt phòng 1 lúc 9 giờ",
          compare: [
            way(
              "FOR UPDATE trên bảng con",
              `BEGIN;
SELECT id FROM bookings
 WHERE room_id = 1 AND slot = '09:00' FOR UPDATE;   -- 0 dòng, không khoá gì
-- không thấy ai đặt → INSERT
INSERT INTO bookings(room_id, slot, who) VALUES (1, '09:00', 'An');
COMMIT;`,
              [
                ask("Hai người chạy cùng lúc", bad("Cả hai cùng thấy 0 dòng, không ai chờ ai, cả hai cùng INSERT: phòng bị đặt hai lần.")),
              ],
              "Khoá dòng chỉ bảo vệ dòng đã có.",
            ),
            way(
              "Khoá dòng cha, hoặc UNIQUE",
              `BEGIN;
SELECT id FROM rooms WHERE id = 1 FOR UPDATE;       -- dòng này luôn có
SELECT id FROM bookings WHERE room_id = 1 AND slot = '09:00';
INSERT INTO bookings(room_id, slot, who) VALUES (1, '09:00', 'An');
COMMIT;

-- hoặc để database chặn:
ALTER TABLE bookings ADD CONSTRAINT one_per_slot UNIQUE (room_id, slot);`,
              [
                ask("Hai người chạy cùng lúc (khoá dòng cha)", ok("Người thứ hai chờ ở `rooms` cho tới khi người đầu commit, rồi đọc lại thấy đã có lượt đặt.")),
                ask("Hai người chạy cùng lúc (UNIQUE)", ok("INSERT thứ hai bị từ chối vì trùng `(room_id, slot)`, ứng dụng trả 409.")),
              ],
              "Tạo một điểm mà hai transaction buộc phải đụng nhau.",
            ),
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Dòng cần kiểm tra chưa tồn tại → `FOR UPDATE` không có gì để khoá → khoá một dòng cha luôn có, hoặc đưa quy tắc vào UNIQUE / exclusion constraint.",
            ],
          },
          quiz: {
            question: "Quy tắc \"mỗi phòng một lượt đặt mỗi khung giờ\". Cách nào chặn chắc chắn hai lượt đặt cùng lúc ở READ COMMITTED?",
            options: [
              "`SELECT ... FROM bookings ... FOR UPDATE` rồi INSERT",
              "Ràng buộc `UNIQUE (room_id, slot)`, hoặc khoá dòng `rooms` tương ứng bằng `FOR UPDATE` trước khi kiểm tra",
              "Chuyển sang REPEATABLE READ",
              "Kiểm tra hai lần trong code",
            ],
            answer: 1,
            explain: "Dòng booking chưa có nên không khoá được. UNIQUE để database chặn, hoặc khoá dòng cha để mọi lượt đặt cùng phòng xếp hàng. REPEATABLE READ không chặn write skew.",
          },
        },
        {
          id: "mysql-next-key",
          title: "MySQL REPEATABLE READ: next-key lock và deadlock khi chèn",
          intro: [
            "Phần 1 ghi REPEATABLE_READ là default của MySQL InnoDB. Nhưng InnoDB cài level này khác PostgreSQL, và khác biệt lộ ra ở một bẫy hay gặp: hai transaction \"kiểm tra rồi thêm\" cùng một dòng chưa có. Ở đây `SELECT ... FOR UPDATE` là câu đọc kèm khoá dòng, như đã dùng ở các phần trước. Toàn bộ phần này theo tài liệu MySQL, **chưa chạy**.",
            "- **Đọc thường (`SELECT`)**: đọc từ bản chụp (snapshot) lấy ở lần đọc đầu, nên đọc lại thấy y nguyên.",
            "- **Đọc có khoá (`SELECT ... FOR UPDATE`), `UPDATE`, `DELETE`**: đọc bản mới nhất đã commit, và khoá bằng **next-key lock** = khoá dòng (record lock) cộng khoá **khoảng trống** (gap lock) ngay trước dòng đó trong index.",
            "Gap lock là khoá lên một khoảng giữa hai giá trị index, không phải lên dòng nào. Với `SELECT ... WHERE id = 10 FOR UPDATE` mà `id = 10` **chưa tồn tại**, InnoDB khoá khoảng trống chứa 10. Hai transaction cùng khoá một khoảng thì **không chờ nhau** (gap lock không xung đột với gap lock). Nhưng gap lock chặn `INSERT` vào khoảng đó.",
            "Hệ quả: A và B cùng `FOR UPDATE` dòng 10 chưa có, cùng được cấp gap lock. A `INSERT` id 10: phải chờ vì B đang giữ gap. B `INSERT` id 10: chờ A. Hai bên chờ nhau, InnoDB phát hiện và huỷ một transaction bằng lỗi deadlock (`Deadlock found when trying to get lock; try restarting transaction`).",
            "Cách tránh: đừng \"kiểm tra rồi thêm\". Đặt `UNIQUE` rồi `INSERT` thẳng, hoặc `INSERT ... ON DUPLICATE KEY UPDATE`, và bắt lỗi trùng hoặc deadlock để thử lại. Lưu ý: `ON DUPLICATE KEY` cũng tự lấy khoá, nên khi nhiều transaction tranh nhau cùng khoá vẫn có thể gặp deadlock; luôn chuẩn bị retry.",
          ],
          predict: {
            question: "MySQL InnoDB, REPEATABLE READ, bảng chưa có `id = 10`. Hai transaction cùng chạy `SELECT ... WHERE id = 10 FOR UPDATE` (cả hai cùng 0 dòng), rồi cùng `INSERT` id 10. Theo tài liệu InnoDB, điều gì xảy ra?",
            options: [
              "Cả hai INSERT thành công, có hai dòng id 10",
              "Transaction thứ hai chờ ngay ở câu SELECT FOR UPDATE",
              "Cả hai SELECT qua được vì gap lock không chặn nhau, rồi hai INSERT chờ lẫn nhau và InnoDB huỷ một bên vì deadlock",
              "Không có gì xảy ra vì dòng 10 chưa tồn tại",
            ],
            answer: 2,
            explain: "Theo tài liệu InnoDB (chưa chạy): gap lock không xung đột với gap lock nên cả hai SELECT qua, nhưng gap lock chặn INSERT, hai INSERT chờ nhau và bị phát hiện deadlock. Đây là khác biệt với PostgreSQL, nơi `FOR UPDATE` trên dòng chưa có không có gì để khoá (phần write skew ở trên).",
          },
          widgetTitle: "Hai transaction cùng thêm id 10 trên MySQL",
          compare: [
            way(
              "SELECT ... FOR UPDATE rồi INSERT",
              `START TRANSACTION;
SELECT id FROM accounts WHERE id = 10 FOR UPDATE;  -- 0 dòng, nhưng khoá khoảng trống
INSERT INTO accounts (id, balance) VALUES (10, 0);
COMMIT;`,
              [
                ask("Hai transaction chạy xen kẽ", bad("Theo tài liệu InnoDB (chưa chạy): cả hai giữ gap lock, hai INSERT chờ nhau, một bên nhận lỗi deadlock.")),
              ],
              "Khoá khoảng trống chặn người khác chèn, kể cả chính cặp đang giữ nó.",
            ),
            way(
              "UNIQUE rồi INSERT thẳng",
              `-- accounts.id là PRIMARY KEY hoặc UNIQUE
INSERT INTO accounts (id, balance) VALUES (10, 0)
ON DUPLICATE KEY UPDATE balance = balance;`,
              [
                ask("Hai transaction chạy xen kẽ", ok("Theo tài liệu (chưa chạy): chỉ một dòng id 10 được tạo, bên kia rơi vào nhánh `ON DUPLICATE KEY`. Không có bước kiểm tra riêng nên không có khoảng hở (vẫn nên bắt deadlock và retry nếu tranh chấp nặng).")),
              ],
              "Để database kiểm tra trùng ngay lúc ghi, bằng một câu duy nhất.",
            ),
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["InnoDB RR: lệnh có khoá khoá cả khoảng trống → hai bên cùng giữ gap lock không chờ nhau → INSERT vào gap thì chờ nhau → deadlock. Tránh bằng UNIQUE kèm INSERT thẳng (theo tài liệu, chưa chạy)."],
          },
          quiz: {
            question: "Theo tài liệu InnoDB, gap lock chặn thao tác nào?",
            options: [
              "Mọi lệnh SELECT",
              "INSERT vào khoảng giữa hai giá trị index đang bị khoá",
              "Chỉ UPDATE dòng đang tồn tại",
              "Không chặn gì, chỉ ghi log",
            ],
            answer: 1,
            explain: "Gap lock bảo vệ khoảng trống khỏi bị chèn thêm (để tránh phantom). Hai gap lock thì không chặn nhau.",
          },
        },
      ],
    },
    {
      id: "readonly",
      title: "Phần 5: readOnly = true thực sự làm gì",
      scene: "readonly",
      intro: [
        "Hai từ cần biết: {{dirty-checking|dirty checking}} là việc Hibernate giữ một bản chụp của mỗi entity đã load, cuối transaction so lại, field nào đổi thì tự sinh `UPDATE` mà bạn không cần gọi `save`. {{flush|Flush}} là lúc Hibernate đẩy các thay đổi đang chờ thành SQL gửi xuống DB; flush mode quyết định khi nào việc đó tự xảy ra.",
        "Đã đo, `readOnly = true` làm 3 việc:",
        "- **Flush mode `MANUAL`**: Hibernate không tự flush.",
        "- **Session và entity read-only**: sửa field entity rồi kết thúc method thì **không có UPDATE**.",
        "- **`Connection.isReadOnly() = true`**: báo cho driver và DB.",
        "Lợi ích chính là bỏ dirty checking (không giữ bản chụp, không so sánh), nhẹ hơn khi load nhiều entity.",
        "`readOnly = true` **tự nó không chuyển** query sang DB khác (replica): việc đó cần cấu hình thêm, xem phần con ngay bên dưới.",
        "Vậy nếu cố ghi trong method readOnly thì sao? Chọn từng cách ghi để so H2 với PostgreSQL.",
      ],
      predict: {
        question: "Trên H2, method `@Transactional(readOnly = true)` gọi `jdbcTemplate.update(\"insert ...\")`. Dòng có được lưu không?",
        options: [
          "Không, readOnly chặn mọi câu ghi",
          "Có, H2 vẫn lưu: readOnly không phải cơ chế bảo mật",
          "Ném exception ở mọi DB",
          "Chỉ lưu khi gọi thêm `flush()`",
        ],
        answer: 1,
        explain: "H2 không chặn ghi trên connection read-only. PostgreSQL thì chặn với `cannot execute INSERT in a read-only transaction`.",
      },
      widget: "readonly",
      widgetTitle: "Ghi trong method readOnly",
      after: [
        "Ghi trong method readOnly: H2 `save()` im lặng không lưu, `saveAndFlush()` và `jdbcTemplate.update()` **lưu được**; PostgreSQL chặn: `cannot execute INSERT in a read-only transaction` (SQL state 25006). readOnly không phải cơ chế bảo mật. Pattern: class `readOnly = true`, method ghi gắn `@Transactional` thường.",
      ],
      quiz: {
        question: "Method chỉ đọc có nên đặt @Transactional(readOnly = true)?",
        options: [
          "Không cần",
          "Nên: Hibernate bỏ dirty checking và connection được đặt read-only",
          "Chỉ khi dùng MySQL",
          "Chỉ để bảo mật",
        ],
        answer: 1,
        explain: "Để trống thì mỗi lần gọi repository là một transaction riêng. Riêng việc sang replica thì readOnly một mình không làm được, xem phần con bên dưới.",
      },
      parts: [
        {
          id: "readonly-replica",
          title: "readOnly và read replica",
          intro: [
            "**Read replica** là bản sao của DB chính chỉ để đọc, dùng để chia tải. Để query của method `readOnly = true` đi vào replica, app phải có một **routing DataSource**: một DataSource bọc ngoài chọn DB nào theo từng transaction, thường là `AbstractRoutingDataSource` chọn replica khi `TransactionSynchronizationManager.isCurrentTransactionReadOnly()` là true.",
            "Phải bọc nó trong `LazyConnectionDataSourceProxy`, để connection chỉ được lấy **sau khi** transaction đã biết mình là readOnly. Thiếu lớp proxy đó, connection bị lấy sớm và vẫn đi vào DB chính. Phần này theo tài liệu Spring, chưa đo trong bài.",
          ],
          quiz: {
            question: "Chỉ thêm `@Transactional(readOnly = true)`, không cấu hình gì khác. Query có tự đi sang read replica không?",
            options: ["Có, luôn luôn", "Không: cần routing DataSource (kèm LazyConnectionDataSourceProxy) mới chọn được replica", "Chỉ với MySQL", "Chỉ khi pool size lớn"],
            answer: 1,
            explain: "readOnly chỉ là thông tin cho Hibernate và driver; việc chọn DB nào do cấu hình DataSource.",
          },
        },
      ],
    },
    {
      id: "long-tx",
      title: "Phần 6: Không gọi API ngoài trong transaction",
      scene: "longtx",
      intro: [
        "`@Transactional checkout()` lưu order rồi gọi cổng thanh toán 2–5 giây và dịch vụ email: giữ connection suốt thời gian chờ mạng, và rollback DB không thu hồi được tiền đã trừ ở cổng thanh toán.",
        "Cách đúng:",
        "- **Transaction ngắn**: lưu order PENDING.",
        "- **Gọi thanh toán ngoài transaction**: có **idempotency key**, một mã duy nhất gửi kèm request, cổng thanh toán thấy mã đã xử lý thì không trừ tiền lần hai, nên retry an toàn.",
        "- **Transaction ngắn**: cập nhật PAID hoặc FAILED.",
        "- **Gửi email sau commit**: bằng `AFTER_COMMIT` hoặc **outbox** (ghi một dòng \"việc cần gửi\" vào bảng outbox trong cùng transaction, một tiến trình khác đọc bảng đó rồi gửi; bài TransactionTemplate & Transaction Events).",
        "Long transaction giữ connection, giữ lock, làm MVCC giữ phiên bản cũ lâu: đặt `@Transactional(timeout = 5)`, theo dõi `hikaricp.connections.active` và `pending`.",
      ],
      quiz: {
        question: "Đã trừ tiền ở cổng thanh toán, sau đó gửi email lỗi làm transaction rollback. Hậu quả?",
        options: ["Không sao", "Đơn hàng biến mất nhưng tiền đã bị trừ", "Tiền được hoàn tự động", "Email được gửi lại"],
        answer: 1,
        explain: "Rollback DB không thu hồi được việc đã làm bên ngoài.",
      },
    },
  ],
  modelAnswer:
    "Isolation level quyết định chặn những anomaly nào: dirty read, non-repeatable read, phantom; PostgreSQL mặc định READ COMMITTED, MySQL InnoDB REPEATABLE READ. Các DB này dùng MVCC: READ COMMITTED chụp snapshot mỗi câu lệnh, REPEATABLE READ của PostgreSQL chụp một lần nên chặn cả phantom; em đã tái hiện cả hai. Bug hay gặp thật là lost update: em đo hai người mua thì stock còn 9 thay vì 8 ở READ COMMITTED; em sửa bằng atomic UPDATE cho phép trừ đơn giản, @Version khi xung đột hiếm, FOR UPDATE khi xung đột nhiều. Write skew như ví dụ bác sĩ trực thì REPEATABLE READ không chặn được, cần SERIALIZABLE hoặc khoá có chủ đích. readOnly = true làm Hibernate bỏ dirty checking và đặt connection read-only; PostgreSQL chặn ghi còn H2 thì không, nên nó không phải cơ chế bảo mật. Và em không gọi API ngoài trong transaction.",
};
