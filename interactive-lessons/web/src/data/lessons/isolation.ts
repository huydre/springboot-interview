import timeline from "../timelines/isolation.json";
import type { Lesson, Scene } from "../types";

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
        "Ba anomaly của chuẩn SQL: **dirty read** (đọc dữ liệu transaction khác **chưa commit**), **non-repeatable read** (một dòng đọc 2 lần ra 2 giá trị), **phantom** (cùng một query chạy 2 lần, số dòng thay đổi). Thêm hai thứ hay gây bug thật: **lost update** (hai bên cùng đọc rồi ghi đè nhau, Phần 3) và **write skew** (mỗi bên ghi một dòng khác, gộp lại vi phạm quy tắc, Phần 4).",
        "Default đo được: PostgreSQL `read committed`, MySQL InnoDB `REPEATABLE-READ`, H2 READ_COMMITTED. Spring `Isolation.DEFAULT` dùng default của DB, nên cùng code chạy hai DB có thể khác kết quả.",
        "Dirty read đo được thật trên H2: stock đang là 10, transaction A đặt stock thành 999 nhưng **chưa commit**; transaction B chạy ở `READ_UNCOMMITTED` đọc ra **999**, một giá trị có thể bị rollback ngay sau đó. Cùng kịch bản trên PostgreSQL, B đọc ra 10, vì PostgreSQL không có dirty read ở level nào.",
      ],
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
        "MVCC: update tạo phiên bản mới thay vì ghi đè, mỗi transaction đọc theo một snapshot nên đọc không chặn ghi. READ COMMITTED chụp snapshot **mỗi câu lệnh**; REPEATABLE READ của PostgreSQL chụp ở **câu lệnh đầu tiên** rồi dùng tới cuối. Ghi thì vẫn cần khoá.",
        "Đã đo trên PostgreSQL: đọc stock 2 lần, giữa chừng tx khác đổi 10 thành 50: READ COMMITTED `first=10 second=50`, REPEATABLE READ `first=10 second=10`; `count(*)` 1 rồi 2, so với 1 rồi 1. Bẫy: `findById` hai lần ở READ COMMITTED ra 10 và 10, `sameInstance=true`, vì {{persistence-context|persistence context}} không chạy SQL lần hai. Persistence context là cái map Hibernate giữ trong mỗi transaction, chứa các entity đã load theo id: lần `findById` thứ hai trả luôn object trong map.",
      ],
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
        "Đã đo: ở READ COMMITTED ra **9**, mất một lần trừ. Đổi lên REPEATABLE READ thì không ra 8 mà transaction thứ hai bị huỷ: `CannotAcquireLockException: could not serialize access due to concurrent update`, nên phải tự bắt và retry. Isolation level không phải cách sửa; ba cách sửa thật nằm ở phần tiếp theo.",
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
            "**Atomic UPDATE**: để DB tự trừ trong một câu, `UPDATE product SET stock = stock - 1 WHERE id = ? AND stock >= 1`. Câu UPDATE khoá dòng, đọc giá trị mới nhất rồi mới trừ, nên không mất lượt nào. Đã đo: ra 8. Số dòng bị ảnh hưởng là 0 thì báo hết hàng.",
            "**Optimistic lock** ({{optimistic-lock|khoá lạc quan}}): thêm field `@Version` vào entity. Không khoá lúc đọc; lúc ghi Hibernate thêm `WHERE version = ?`, ai đã sửa trước thì bên sau ghi 0 dòng và nhận `ObjectOptimisticLockingFailureException`, phải retry. Đã đo đúng exception này.",
            "**Pessimistic lock** ({{pessimistic-lock|khoá bi quan}}): khoá ngay lúc đọc bằng `SELECT ... FOR UPDATE` (trong Spring Data là `@Lock(PESSIMISTIC_WRITE)`). Bên thứ hai phải chờ bên đầu commit rồi mới đọc được giá trị mới. Đã đo: ra 8, thread B chờ 306 ms.",
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
        "Quy tắc: luôn có ít nhất 1 bác sĩ trực, hiện có 2. A và B cùng đếm thấy 2, cùng xin nghỉ, mỗi bên update **dòng của mình**: không đụng khoá của nhau, cùng commit, còn 0 người trực. Không ai ghi đè ai nhưng gộp lại vi phạm quy tắc.",
        "Đã đo trên PostgreSQL: REPEATABLE READ cả hai commit, `on call now=0`; SERIALIZABLE thì tx còn lại lỗi `could not serialize access due to read/write dependencies among transactions`. Sửa: SERIALIZABLE kèm retry cho riêng nghiệp vụ này, `FOR UPDATE` các dòng dùng để kiểm tra điều kiện, hoặc đưa quy tắc xuống DB.",
        "Vì sao không đặt SERIALIZABLE cho mọi thứ: DB không chờ mà **huỷ** một trong hai transaction khi phát hiện xung đột, ứng dụng phải bắt lỗi và chạy lại. Tải cao thì xung đột nhiều, retry nhiều, throughput giảm.",
      ],
      quiz: {
        question: "Vì sao không đặt SERIALIZABLE cho mọi thứ?",
        options: ["Vì không chạy", "PostgreSQL phát hiện xung đột và huỷ transaction (could not serialize access), ứng dụng phải retry, tải cao thì throughput giảm", "Vì bị cấm", "Vì chậm gấp 100 lần"],
        answer: 1,
        explain: "Thường chỉ dùng cho vài nghiệp vụ nhạy cảm, còn lại READ COMMITTED kèm lock có chủ đích.",
      },
    },
    {
      id: "readonly",
      title: "Phần 5: readOnly = true thực sự làm gì",
      scene: "readonly",
      intro: [
        "Hai từ cần biết: {{dirty-checking|dirty checking}} là việc Hibernate giữ một bản chụp của mỗi entity đã load, cuối transaction so lại, field nào đổi thì tự sinh `UPDATE` mà bạn không cần gọi `save`. {{flush|Flush}} là lúc Hibernate đẩy các thay đổi đang chờ thành SQL gửi xuống DB; flush mode quyết định khi nào việc đó tự xảy ra.",
        "Đã đo: Hibernate flush mode `MANUAL` (không tự flush), session và entity read-only, `Connection.isReadOnly() = true`; sửa field entity rồi kết thúc method thì **không có UPDATE**. Lợi ích chính là bỏ dirty checking (không giữ bản chụp, không so sánh), nhẹ hơn khi load nhiều entity; có thể route sang read replica.",
        "Ghi trong method readOnly: H2 `save()` im lặng không lưu, `saveAndFlush()` và `jdbcTemplate.update()` **lưu được**; PostgreSQL chặn: `cannot execute INSERT in a read-only transaction` (SQL state 25006). readOnly không phải cơ chế bảo mật. Pattern: class `readOnly = true`, method ghi gắn `@Transactional` thường.",
      ],
      widget: "readonly",
      widgetTitle: "Ghi trong method readOnly",
      quiz: {
        question: "Method chỉ đọc có nên đặt @Transactional(readOnly = true)?",
        options: [
          "Không cần",
          "Nên: dùng chung một connection và persistence context, Hibernate bỏ dirty checking, có thể route sang replica",
          "Chỉ khi dùng MySQL",
          "Chỉ để bảo mật",
        ],
        answer: 1,
        explain: "Để trống thì mỗi lần gọi repository là một transaction riêng.",
      },
    },
    {
      id: "long-tx",
      title: "Phần 6: Không gọi API ngoài trong transaction",
      scene: "longtx",
      intro: [
        "`@Transactional checkout()` lưu order rồi gọi cổng thanh toán 2–5 giây và dịch vụ email: giữ connection suốt thời gian chờ mạng, và rollback DB không thu hồi được tiền đã trừ ở cổng thanh toán.",
        "Cách đúng: transaction ngắn lưu order PENDING, gọi thanh toán ngoài transaction (có **idempotency key**: một mã duy nhất gửi kèm request, cổng thanh toán thấy mã đã xử lý thì không trừ tiền lần hai, nên retry an toàn), transaction ngắn cập nhật PAID hoặc FAILED, gửi email sau commit bằng `AFTER_COMMIT` hoặc **outbox** (ghi một dòng \"việc cần gửi\" vào bảng outbox trong cùng transaction, một tiến trình khác đọc bảng đó rồi gửi; bài TransactionTemplate & Transaction Events). Long transaction giữ connection, giữ lock, làm MVCC giữ phiên bản cũ lâu: đặt `@Transactional(timeout = 5)`, theo dõi `hikaricp.connections.active` và `pending`.",
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
