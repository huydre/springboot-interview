import timeline from "../timelines/locking.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Measured on Spring Boot 3.5 + Hibernate ORM 6.6 + PostgreSQL 16.14 (Docker), JDK 21; JDBC round trips counted with a proxy around
// the DataSource. See study note 05.08.
export const locking: Lesson = {
  slug: "locking",
  crumb: "Locking, Batch & Mapping",
  videoDir: "/videos/locking",
  videoVersion: "65d34677",
  scenes: timeline as Scene[],
  title: "Locking, Batch & Mapping",
  subtitle:
    "Lost update và ba cách giải: @Version, SELECT FOR UPDATE, UPDATE nguyên tử; batch insert và bẫy IDENTITY; bulk update với @Modifying; mapping quan hệ; equals, hashCode và Lombok @Data.",
  openingQuiz: {
    question: "Stock 10, 20 thread cùng chạy update ... set stock = stock - 1 where id = ? and stock >= 1. Kết quả?",
    options: ["Stock âm", "10 thành công, 10 trả về 0 dòng, stock cuối 0", "Deadlock", "Chỉ 1 thành công"],
    answer: 1,
    explain: "Đã đo. DB khoá dòng trong lúc update và đánh giá lại điều kiện trên giá trị mới.",
  },
  roadmap: [
    "Chặng 1: lost update, optimistic, pessimistic, UPDATE nguyên tử.",
    "Chặng 2: batch insert và bulk update.",
    "Chặng 3: mapping quan hệ, equals và hashCode.",
  ],
  sections: [
    {
      id: "locks",
      title: "Phần 1: Lost update và ba cách giải",
      scene: "locks",
      board: {
        title: "Lost update: hai người cùng ghi đè",
        highlight: "Lost update",
        chips: ["Balance 100, Tx 1 rút 50, Tx 2 rút 30", "Đúng phải là 20"],
        cards: [
          {
            title: "Timeline lost update",
            diagram: {
              kind: "flow",
              steps: ["Tx 1 và Tx 2 cùng đọc 100", "Tx 2 ghi 70, commit", "Tx 1 ghi 50 (100 - 50)"],
              ok: ["Có @Version", "Tx 1 bị từ chối"],
              bad: ["Không có @Version", "còn 50, đúng là 20"],
            },
            notes: ["Mỗi câu SELECT và UPDATE đều hợp lệ ở READ COMMITTED. Lỗi nằm ở giá trị Java đã cũ lúc ghi."],
            takeaway: "Không lỗi nào được báo, khoản rút 30 biến mất",
          },
          {
            title: "10 thread trừ 1",
            diagram: {
              kind: "pipe",
              from: "10 thread cùng đọc 100",
              via: "trừ 1 rồi ghi",
              to: "99 (đúng là 90)",
              skipped: ["@Version", "FOR UPDATE", "UPDATE nguyên tử"],
              skippedLabel: "Chưa dùng cách nào",
            },
            notes: ["Đã đo trên entity không có `@Version`: cả 10 thread cùng đọc 100 và cùng ghi 99."],
            takeaway: "Ba cách giải nằm ở các phần nhỏ bên dưới",
          },
        ],
        conclusion: "**Kết luận:** đọc vào Java rồi ghi lại trên giá trị cũ thì đè mất cập nhật của bên kia.",
      },
      intro: [
        "Kiểu code hay gặp nhất là **đọc, sửa trong Java, ghi lại**: `Account a = accountRepo.findById(id).orElseThrow(); a.setBalance(a.getBalance() - amount);` trong một method `@Transactional`. Lúc commit, dirty checking của Hibernate sinh `UPDATE account SET balance = ? WHERE id = ?` với giá trị Java đã tính.",
        "Khi hai transaction chạy cùng lúc trên một tài khoản có balance 100, Tx 1 rút 50 và Tx 2 rút 30. Theo thời gian:",
        "- **(1)** Tx 1 đọc balance = 100.",
        "- **(2)** Tx 2 đọc balance = 100.",
        "- **(3)** Tx 2 tính 100 - 30, ghi 70, commit.",
        "- **(4)** Tx 1 tính 100 - 50 trên giá trị nó đã đọc ở bước 1, ghi 50, commit.",
        "Kết quả là 50, đúng phải là 20: khoản rút 30 **mất** vì bị ghi đè. Đây là **lost update**.",
        "Đã đo trên entity không có `@Version`: xen kẽ đúng như trên cho balance cuối **50**; 10 thread cùng đọc 100 rồi trừ 1 cho **99** (đúng là 90), vì cả 10 cùng đọc 100 và cùng ghi 99. Isolation mặc định READ COMMITTED của PostgreSQL không chặn được chuyện này: mỗi câu SELECT và UPDATE đều hợp lệ, lỗi nằm ở chỗ giá trị Java đã cũ lúc ghi. Ba cách giải ở ba phần nhỏ bên dưới: optimistic lock, pessimistic lock và câu UPDATE nguyên tử.",
      ],
      widget: "lock-race",
      widgetTitle: "Cùng tranh một dòng",
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Đọc vào Java → tính trên giá trị đã đọc → lúc ghi giá trị đó đã cũ → ghi đè bên kia → mất cập nhật mà không có lỗi nào.",
        ],
      },
      quiz: {
        question: "Balance 100. Tx 1 và Tx 2 cùng đọc 100, Tx 2 trừ 30 rồi commit, sau đó Tx 1 trừ 50 trên giá trị đã đọc rồi commit. Balance cuối là bao nhiêu?",
        options: ["20", "50", "70", "Lỗi vì hai transaction đụng nhau"],
        answer: 1,
        explain: "Tx 1 tính 100 - 50 = 50 trên giá trị đọc từ trước và ghi đè số 70 của Tx 2. Không có lỗi nào: mỗi câu lệnh đều hợp lệ ở READ COMMITTED. Đó là lost update, và đã đo đúng con số 50.",
      },
      parts: [
        {
          id: "locks-optimistic",
          title: "Optimistic lock với @Version",
          scene: "locks-optimistic",
          board: {
            title: "@Version bắt lost update thế nào",
            highlight: "@Version",
            chips: ["Không khoá lúc đọc", "Kiểm tra version lúc ghi"],
            cards: [
              {
                title: "Câu UPDATE có version",
                diagram: {
                  kind: "flow",
                  steps: ["Đọc stock 10, version 0", "Bên kia commit: version 1", "UPDATE ... AND version = 0"],
                  ok: ["Không ai ghi trước", "ghi thành công"],
                  bad: ["Có người ghi trước", "0 dòng, bị từ chối"],
                },
                notes: ["Hibernate thêm `AND version = ?` vào câu UPDATE. Khớp 0 dòng thì ném `StaleObjectStateException`, Spring bọc thành `ObjectOptimisticLockingFailureException`."],
                code: `@Entity
          class Product {
              @Id Long id;
              int stock;
              @Version Long version;
          }`,
                takeaway: "Xung đột lộ ra thành exception, không mất dữ liệu",
              },
              {
                title: "Retry ở đâu",
                diagram: {
                  kind: "flow",
                  steps: ["Bị từ chối lúc commit", "Transaction đã rollback"],
                  ok: ["Retry ngoài @Transactional", "giao dịch mới"],
                  bad: ["Retry bên trong method", "không bắt được"],
                },
                notes: ["Exception bật ra lúc flush hoặc commit, khi method đã chạy xong. Mỗi lần thử phải đọc lại version mới nhất.", "Hoặc trả 409 Conflict cho người dùng."],
                takeaway: "Mỗi lần thử là một transaction mới",
              },
            ],
            conclusion: "**Kết luận:** optimistic lock hợp khi xung đột hiếm, bên ghi sau bị từ chối thay vì ghi đè.",
          },
          intro: [
            "\"Lạc quan\": giả định ít khi xung đột, nên **không khoá** gì lúc đọc. Đến lúc ghi mới kiểm tra \"từ lúc mình đọc, có ai sửa dòng này chưa?\" bằng một cột version. Thêm `@Version Long version;` vào entity. Mỗi lần ghi, Hibernate tăng version lên 1 và thêm `AND version = ?` (version lúc đọc) vào câu UPDATE.",
            "Vì sao nó bắt được lost update: nếu bên khác đã ghi trước, version trong DB đã tăng, nên `WHERE id = ? AND version = ?` khớp **0 dòng**. Hibernate thấy 0 dòng thì ném `StaleObjectStateException`, Spring bọc lại thành `ObjectOptimisticLockingFailureException`. Trong code chỉ cần bắt lớp cha `OptimisticLockingFailureException` của Spring.",
            "Bị từ chối thì làm gì? **Thử lại** cả transaction (đọc lại giá trị mới), ví dụ `@Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3)`. Retry phải đặt **ngoài** method `@Transactional`: exception thường bật ra lúc flush hay commit, tức khi method đã chạy xong, và transaction đó đã rollback. Mỗi lần thử phải là một transaction mới, đọc lại version mới nhất. Hoặc trả **409 Conflict** cho người dùng (\"dữ liệu đã bị người khác sửa, tải lại\"), hợp với form chỉnh sửa: gửi `version` về client cùng form, lúc lưu so với version trong DB. Hợp khi xung đột hiếm; tranh mua liên tục thì phần lớn request bị từ chối rồi retry, tốn tài nguyên.",
          ],
          widgetTitle: "Cùng một entity, có và không có @Version",
          compare: [
            way(
              "Không có @Version",
              `@Entity
class Account {
    @Id Long id;
    long balance;
}

@Transactional
void withdraw(Long id, long amount) {
    Account a = repo.findById(id).orElseThrow();
    a.setBalance(a.getBalance() - amount);
}`,
              [
                ask("Câu UPDATE lúc commit", bad("`update account set balance=? where id=?`: không kiểm tra gì về giá trị đã đọc.")),
                ask("Hai transaction xen kẽ", bad("Đã đo: balance 100, rút 50 và 30 xen kẽ như timeline ở trên, cuối còn **50** (đúng là 20). Không có exception nào.")),
              ],
              "Bên ghi sau âm thầm đè bên ghi trước.",
            ),
            way(
              "Có @Version",
              `@Entity
class Product {
    @Id Long id;
    int stock;
    @Version Long version;
}

@Transactional
void take(Long id, int q) {
    Product p = repo.findById(id).orElseThrow();
    p.setStock(p.getStock() - q);
}`,
              [
                ask("Câu UPDATE lúc commit", ok("Đã đo: `update product set name=?,stock=?,version=? where id=? and version=?`.")),
                ask("Hai transaction xen kẽ", ok("Đã đo: stock 10, version 0. Bên kia trừ 1 và commit trước (stock 9, version 1). Bên mình ghi với `version=0`, khớp 0 dòng, nhận `ObjectOptimisticLockingFailureException`. DB giữ stock 9, version 1: bên sau bị từ chối thay vì ghi đè.")),
              ],
              "Xung đột lộ ra thành exception, không mất dữ liệu.",
            ),
          ],
          quiz: {
            question: "Vì sao retry khi gặp `OptimisticLockingFailureException` phải đặt bên ngoài method `@Transactional`?",
            options: [
              "Vì Spring cấm bắt exception trong transaction",
              "Vì exception bật ra lúc commit, khi transaction đã rollback; mỗi lần thử phải là một transaction mới đọc lại dữ liệu",
              "Vì retry bên trong sẽ chạy nhanh quá",
              "Vì @Version chỉ hoạt động ngoài transaction",
            ],
            answer: 1,
            explain: "Exception thường xuất hiện lúc flush hoặc commit, sau khi code trong method đã chạy xong, nên retry bên trong method không bắt được nó, và transaction đó đã rollback. Mỗi lần thử phải đọc lại version mới nhất trong một transaction mới. Spring không cấm bắt exception, và @Version cần transaction để ghi.",
          },
        },
        {
          id: "locks-pessimistic",
          title: "Pessimistic lock: SELECT ... FOR UPDATE",
          scene: "locks-pessimistic",
          intro: [
            "\"Bi quan\": giả định sẽ xung đột, nên **khoá dòng ngay lúc đọc**. Transaction khác muốn khoá cùng dòng phải **chờ** tới khi bên giữ khoá commit hoặc rollback, rồi mới đọc được giá trị mới. Trong Spring Data: `@Lock(LockModeType.PESSIMISTIC_WRITE)` trên query method.",
            "Trên PostgreSQL, Hibernate 6 sinh `for no key update` thay vì `for update`. Đây là khoá nhẹ hơn một bậc: vẫn chặn mọi transaction khác sửa hay khoá ghi cùng dòng, nhưng **không chặn** việc thêm dòng con có khoá ngoại trỏ tới dòng này (kiểm tra khoá ngoại chỉ cần khoá chia sẻ `for key share`, và `for no key update` không xung đột với nó). MySQL sinh `for update`.",
            "Khoá chỉ sống trong transaction, nên `@Lock` bắt buộc có `@Transactional`; gọi ngoài transaction thì đo được `InvalidDataAccessApiUsageException: Query requires transaction be in progress`. Rủi ro lớn nhất là **deadlock**: Tx 1 khoá A rồi chờ B, Tx 2 khoá B rồi chờ A, hai bên chờ nhau mãi tới khi DB huỷ một bên. Cách tránh: luôn khoá theo **cùng một thứ tự**, ví dụ id nhỏ trước. Khi mọi transaction cùng xin khoá A trước B, bên tới sau chỉ đứng chờ ở A, không bao giờ giữ B trong lúc chờ A, nên không thể có vòng chờ.",
            "Không muốn chờ: đặt lock timeout bằng 0 để có `nowait` (như bên dưới). Với hàng đợi job, PostgreSQL còn có `FOR UPDATE SKIP LOCKED`: bỏ qua các dòng đang bị khoá và lấy dòng kế tiếp, nên nhiều worker lấy việc song song mà không chờ nhau. Đừng gọi API ngoài khi đang giữ khoá: mọi request khác cho cùng dòng phải xếp hàng, và connection bị giữ lâu.",
          ],
          widgetTitle: "Thread A giữ khoá 1000 ms, thread B tới sau",
          compare: [
            way(
              "Chờ (PESSIMISTIC_WRITE)",
              `@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select a from Account a where a.id = :id")
Optional<Account> findForUpdate(@Param("id") Long id);`,
              [
                ask("SQL sinh ra trên PostgreSQL", ok("Đã đo: `select a1_0.id,a1_0.balance from account a1_0 where a1_0.id=? for no key update`.")),
                ask("A khoá, ngủ 1000 ms rồi trừ 50; B trừ 30", ok("Đã đo: B chờ **1125 ms** cho tới khi A commit, rồi đọc 50 và trừ tiếp. Balance cuối **20**, đúng.")),
              ],
              "Bên sau chờ, không mất cập nhật.",
            ),
            way(
              "Không chờ (NOWAIT)",
              `@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(
    name = "jakarta.persistence.lock.timeout", value = "0"))
@Query("select a from Account a where a.id = :id")
Optional<Account> findForUpdateNoWait(@Param("id") Long id);`,
              [
                ask("SQL sinh ra trên PostgreSQL", ok("Đã đo: `... for no key update nowait`.")),
                ask("A khoá, ngủ 1000 ms rồi trừ 50; B trừ 30", bad("Đã đo: B không chờ mà nhận ngay `PessimisticLockingFailureException`, gốc là `PSQLException: could not obtain lock on row in relation \"account\"`. Code phải tự báo lỗi hoặc thử lại.")),
              ],
              "Bên sau thất bại ngay thay vì chờ.",
            ),
          ],
          quiz: {
            question: "Chuyển tiền A sang B và B sang A cùng lúc với FOR UPDATE. Tránh deadlock thế nào?",
            options: ["Dùng SERIALIZABLE", "Luôn khoá theo thứ tự id tăng dần bất kể chiều chuyển", "Thêm @Version", "Tăng timeout"],
            answer: 1,
            explain: "Cùng thứ tự thì bên sau chỉ chờ, không vòng chờ nhau.",
          },
        },
        {
          id: "locks-atomic",
          title: "Câu UPDATE nguyên tử có điều kiện",
          scene: "locks-atomic",
          intro: [
            "Với trừ kho hay trừ tiền, cách đơn giản và nhanh nhất là **để DB tự tính trong một câu**, kèm điều kiện: `update Product p set p.stock = p.stock - :q where p.id = :id and p.stock >= :q`. Không đọc trước vào Java, nên không có giá trị cũ nào để ghi đè. Method trả về **số dòng bị ảnh hưởng**: 1 là mua được, 0 là hết hàng.",
            "Vì sao không bị lost update: khi UPDATE một dòng, PostgreSQL khoá dòng đó tới hết transaction. Transaction thứ hai UPDATE cùng dòng phải chờ; khi bên đầu commit, nó **đọc lại giá trị mới rồi kiểm tra lại** điều kiện `stock >= :q` trên giá trị đó. Còn hàng thì trừ tiếp, hết thì khớp 0 dòng. Đó là lý do câu hỏi mở đầu ra 10 thành công và stock không âm.",
            "Đổi lại: logic nằm trong SQL nên khó dùng khi quy tắc phức tạp (khuyến mãi, nhiều bảng). Đây là bulk update qua `@Modifying`, nên nó **bỏ qua persistence context** (entity đã load vẫn giữ stock cũ) và **không tăng `@Version`** trừ khi bạn tự `set p.version = p.version + 1` (Phần 3).",
          ],
          widgetTitle: "Trừ kho khi nhiều người cùng mua",
          compare: [
            way(
              "Đọc rồi trừ trong Java",
              `@Transactional
void buy(Long id, int q) {
    Product p = repo.findById(id).orElseThrow();
    if (p.getStock() < q) throw new OutOfStockException(id);
    p.setStock(p.getStock() - q);
}`,
              [
                ask("Nhiều thread cùng trừ 1", bad("Đã đo với kiểu đọc rồi trừ này, không có @Version: 10 thread trừ 1 từ 100 còn **99**, đúng là 90.")),
                ask("Kiểm tra hết hàng", bad("`if` chạy trên giá trị đã đọc, có thể đã cũ lúc ghi, nên hai người cùng thấy \"còn 1\" và cùng mua.")),
              ],
              "Đúng khi chạy một mình, sai khi chạy song song.",
            ),
            way(
              "UPDATE có điều kiện",
              `@Modifying
@Query("update Product p set p.stock = p.stock - :q " +
       "where p.id = :id and p.stock >= :q")
int decrease(@Param("id") Long id, @Param("q") int q);

@Transactional
void buy(Long id, int q) {
    if (repo.decrease(id, q) == 0) throw new OutOfStockException(id);
}`,
              [
                ask("Nhiều thread cùng trừ 1", ok("Đã đo: stock 10, **20 thread** cùng mua 1: đúng 10 thành công, 10 nhận 0 dòng, stock cuối **0**, không âm.")),
                ask("Kiểm tra hết hàng", ok("Điều kiện `stock >= :q` được DB kiểm tra lại trên giá trị mới nhất, trong cùng câu ghi.")),
              ],
              "Một câu, không cần version hay khoá tay.",
            ),
          ],
          takeaway: {
            title: "Chọn cách nào",
            lines: [
              "**@Version**: xung đột hiếm, form chỉnh sửa. Bị từ chối thì thử lại hoặc trả 409.",
              "**FOR UPDATE**: cần đọc rồi quyết định trên giá trị mới nhất, chấp nhận bên sau chờ. Khoá theo cùng thứ tự.",
              "**UPDATE có điều kiện**: trừ kho, trừ tiền với quy tắc đơn giản. Một câu, nhanh nhất.",
            ],
          },
          quiz: {
            question: "Stock 1. Hai transaction cùng chạy `update ... set stock = stock - 1 where id = ? and stock >= 1`. Transaction thứ hai thấy gì?",
            options: [
              "Nó cũng trừ được, stock thành -1",
              "Nó chờ bên đầu commit, đọc lại stock = 0, điều kiện sai nên khớp 0 dòng",
              "PostgreSQL báo deadlock",
              "Nó trừ trên giá trị 1 đã đọc từ trước, stock thành 0 cho cả hai",
            ],
            answer: 1,
            explain: "UPDATE khoá dòng; bên sau chờ, rồi kiểm tra lại WHERE trên giá trị mới (0). Không âm, không deadlock vì chỉ có một dòng, và không có giá trị cũ nào trong Java để ghi đè.",
          },
        },
      ],
    },
    {
      id: "batch",
      title: "Phần 2: Batch insert và bẫy IDENTITY",
      scene: "batch",
      intro: [
        "Phần 1 lo nhiều transaction cùng ghi một dòng. Phần này là chiều ngược lại: một transaction ghi rất nhiều dòng.",
        "JDBC batching gom nhiều câu INSERT cùng dạng vào **một lần gửi** xuống DB (một round trip). Hibernate làm việc này khi bật `hibernate.jdbc.batch_size=50`, cùng `order_inserts` và `order_updates` để các câu cùng bảng đứng liền nhau.",
        "Bẫy: với `GenerationType.IDENTITY`, id do DB sinh **lúc INSERT**. Nhưng Hibernate cần id ngay khi `persist`, vì **persistence context** (bộ nhớ đệm các entity mà transaction đang quản lý) tra entity theo id.",
      ],
      predict: {
        question: "Bật `batch_size=50`, lưu 1 000 entity có id `GenerationType.IDENTITY`. Hibernate gửi bao nhiêu batch?",
        options: [
          "20 batch, mỗi batch 50 câu INSERT",
          "1 batch chứa cả 1 000 câu",
          "0 batch: 1 000 câu INSERT lẻ, vì phải INSERT ngay để lấy id",
          "50 batch, mỗi batch 20 câu",
        ],
        answer: 2,
        explain: "IDENTITY chỉ có id sau INSERT, mà Hibernate cần id ngay khi `persist`, nên nó INSERT từng dòng và batching bị tắt. Đã đo: 1 000 câu INSERT lẻ, 0 batch. Đổi sang SEQUENCE với `allocationSize = 50` mới ra 20 batch.",
      },
      widget: "batch-insert",
      widgetTitle: "IDENTITY và SEQUENCE",
      after: [
        "Vì cần id ngay, Hibernate phải INSERT từng dòng ngay lập tức, và **batching bị tắt**. Với `SEQUENCE` và `allocationSize = 50`, Hibernate gọi `nextval` một lần rồi tự cấp 50 id trong bộ nhớ, INSERT được dồn tới lúc flush và gom thành batch.",
        "Đã đo 1 000 entity: IDENTITY ra 1 000 câu INSERT lẻ, 0 batch; SEQUENCE ra 1 000 / 50 = **20** lần `nextval` và **20** lần `executeBatch`.",
        "Batch lớn: gọi `flush()` (gửi các INSERT đang chờ) rồi `clear()` (bỏ mọi entity khỏi persistence context, giải phóng object và bản chụp dùng cho dirty checking) mỗi 50 dòng. Đã đo 50 000 entity: cuối transaction context còn 0 entity thay vì 50 000. Hàng triệu dòng thì bỏ qua JPA: `JdbcTemplate.batchUpdate` hoặc lệnh `COPY` của PostgreSQL (nạp dữ liệu hàng loạt từ file hay luồng). `allocationSize` phải khớp `INCREMENT BY` của sequence trong DB, lệch thì có thể sinh trùng id.",
      ],
      takeaway: {
        lines: [
          "Batch insert với JPA: `SEQUENCE` có `allocationSize` khớp `INCREMENT BY`, cộng `flush()` và `clear()` mỗi lô.",
          "Hàng triệu dòng thì bỏ qua JPA: `JdbcTemplate.batchUpdate` hoặc `COPY`.",
        ],
      },
      quiz: {
        question: "Vì sao IDENTITY làm hỏng JDBC batching?",
        options: ["Vì chậm", "Hibernate cần id ngay khi persist mà IDENTITY chỉ có id sau INSERT, nên phải INSERT ngay từng dòng", "Vì PostgreSQL không hỗ trợ", "Vì thiếu order_inserts"],
        answer: 1,
        explain: "Đổi sang SEQUENCE với allocationSize.",
      },
    },
    {
      id: "bulk",
      title: "Phần 3: Bulk update với @Modifying",
      scene: "bulk",
      intro: [
        "UPDATE nguyên tử ở Phần 1 là một bulk update qua `@Modifying`. Phần này xem nó đụng gì tới các entity đã load.",
        "`@Modifying @Query(\"update ...\")` chạy thẳng xuống DB, không qua persistence context. Đã đo: load stock 10, bulk về 0, `findById` lại vẫn thấy **10** và cùng instance; `clearAutomatically = true` thì thấy 0.",
        "`clearAutomatically = true` xoá cả những thay đổi **chưa flush** của các entity khác trong context. Thêm `flushAutomatically = true` để Hibernate flush trước rồi mới chạy bulk. `@Modifying` cũng cần transaction: gọi ngoài transaction đo được `InvalidDataAccessApiUsageException: Executing an update/delete query`.",
      ],
      predict: {
        question: "Trong một transaction: load product (stock 10, có `@Version`), bulk update đặt stock = 0, rồi `setStock(getStock() - 1)` trên entity đã load và flush. DB cuối thế nào?",
        options: [
          "Stock 0, vì bulk update chạy sau cùng trong DB",
          "Stock 9: kết quả bulk update bị ghi đè, không có xung đột nào",
          "Ném `OptimisticLockingFailureException` vì `@Version` phát hiện xung đột",
          "Stock -1, vì trừ tiếp từ 0",
        ],
        answer: 1,
        explain: "Bulk update không tăng `@Version` và không sửa entity trong bộ nhớ, nên entity vẫn là 10, trừ 1 ra 9, và `where version=0` vẫn khớp. Đã đo: DB cuối stock 9, version 1.",
      },
      widget: "bulk-update",
      widgetTitle: "Bulk update và entity đã load",
      after: [
        "Bẫy nguy hiểm nhất, đã đo theo bốn bước trong một transaction:",
        "- **(1)** load product: stock 10, version 0.",
        "- **(2)** bulk update đặt stock = 0 trong DB; version vẫn là 0 vì bulk update không đụng tới `@Version`, còn entity trong bộ nhớ vẫn là 10.",
        "- **(3)** `setStock(getStock() - 1)` trên entity cũ: 10 - 1 = 9.",
        "- **(4)** lúc flush, Hibernate ghi `... where id=? and version=0`; version trong DB vẫn là 0 nên **khớp**, không có xung đột nào được phát hiện.",
        "DB cuối **stock 9, version 1**: kết quả bulk update bị ghi đè.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Bulk update không qua persistence context và không tăng `@Version` → entity đã load giữ giá trị cũ → flush ghi đè kết quả bulk mà không báo xung đột.",
        ],
      },
      quiz: {
        question: "clearAutomatically = true có rủi ro gì?",
        options: ["Không có", "Xoá luôn thay đổi chưa flush của entity khác; thêm flushAutomatically = true", "Làm chậm DB", "Tắt @Version"],
        answer: 1,
        explain: "Flush trước rồi mới chạy bulk.",
      },
    },
    {
      id: "mapping",
      title: "Phần 4: Mapping quan hệ",
      scene: "mapping",
      intro: [
        "Từ đây ta chuyển sang cách map quan hệ giữa các entity, nơi lỗi thường nằm ở chỗ quên đồng bộ hai phía.",
        "Phía có `@JoinColumn` (thường `@ManyToOne`) là **owner** quyết định khoá ngoại; phía `mappedBy` bị bỏ qua khi ghi. Chỉ `items.add(item)` mà không `item.setOrder(order)` thì `order_id` là null: luôn có helper `addItem`/`removeItem` đồng bộ hai phía.",
        "Các quy tắc, mỗi quy tắc kèm lý do:",
        "- **Mọi association `LAZY`**: EAGER kéo theo dữ liệu không cần và gây N+1.",
        "- **Ưu tiên `@ManyToOne` một chiều**: ít code đồng bộ, không lỡ tay load cả collection lớn.",
        "- **`cascade = ALL` + `orphanRemoval` chỉ cho composition**: tức quan hệ sở hữu mà con không tồn tại nếu thiếu cha (Order sở hữu OrderItem); đo được `removeItem` sinh 1 DELETE dù không gọi `delete`.",
        "- **Không cascade trên `@ManyToOne` hay `@ManyToMany`**: phía bên kia là dữ liệu dùng chung, xoá một order có thể xoá luôn customer hay tag.",
        "- **Bảng trung gian có thêm cột** (số lượng, ngày): map thành entity riêng, vì `@ManyToMany` không có chỗ cho cột thêm.",
        "- **`@ManyToMany` dùng `Set`**: với `List`, khi sửa Hibernate xoá hết dòng trung gian rồi insert lại.",
        "- **Không trả entity ra JSON**: quan hệ hai chiều làm serializer đi vòng mãi.",
      ],
      quiz: {
        question: "orphanRemoval = true khác CascadeType.REMOVE ở đâu?",
        options: ["Giống nhau", "Ngoài xoá cha thì xoá con, gỡ con khỏi collection cũng xoá con", "orphanRemoval chỉ cho ManyToOne", "REMOVE xoá cả cha"],
        answer: 1,
        explain: "Đo được 1 DELETE khi removeItem mà không gọi delete.",
      },
    },
    {
      id: "equals",
      title: "Phần 5: equals, hashCode và Lombok @Data",
      scene: "equals",
      intro: [
        "Entity hai chiều ở Phần 4 còn một bẫy nữa, nằm ở `equals`, `hashCode` và Lombok.",
        "`@Data` dùng mọi field kể cả association. Đã đo: `parent.hashCode()` và `toString()` khi parent và child trỏ vào nhau ném **`StackOverflowError`**; thêm child id null vào `HashSet`, persist, rồi `contains(child)` ra **false** dù size là 1. Thêm nữa, `toString()` trong log có thể kích hoạt lazy load.",
        "Vì sao `contains` ra false: `HashSet` cất object vào ngăn (bucket) theo `hashCode()` **lúc thêm vào**. Khi đó id là null. Sau persist, id có giá trị nên `hashCode()` của `@Data` đổi; `contains` tính lại hash, tìm ở ngăn mới, nhưng object vẫn nằm ở ngăn cũ nên không thấy.",
        "Cách an toàn: equals dùng `instanceof` (an toàn với proxy, xem quiz) và `id != null && id.equals(other.getId())`. hashCode trả một **hằng số cho cả lớp**: điều nó cần là **không đổi** trước và sau persist, để object không bị lạc ngăn. Mọi object cùng lớp chung một ngăn thì chậm hơn một chút khi set rất lớn, nhưng luôn đúng. Hay gặp cách viết `getClass().hashCode()`; nếu object có thể là proxy (lớp con do Hibernate sinh) thì `getClass()` của proxy khác lớp thật, nên an toàn hơn là viết hẳn tên lớp, như `Product.class.hashCode()`. Đây cũng là lý do equals không so `getClass()` (xem quiz). Có business key bất biến (SKU, email chuẩn hoá) thì dùng nó cho cả hai.",
      ],
      takeaway: {
        lines: [
          "`hashCode` của entity phải **không đổi** trước và sau persist, nên không dùng `@Data` cho entity.",
        ],
      },
      quiz: {
        question: "Vì sao equals của entity không nên so getClass()?",
        options: ["Vì chậm", "Entity có thể là proxy Hibernate (subclass), so với entity thật ra false", "Vì getClass là final", "Không sao"],
        answer: 1,
        explain: "Dùng instanceof hoặc Hibernate.getClass(), đọc id qua getter.",
      },
    },
  ],
  modelAnswer:
    "Hai người cùng mua sản phẩm cuối cùng là bài toán lost update: đọc, tính trong Java, ghi lại thì bên sau đè bên trước, em đo 10 thread trừ 1 từ 100 chỉ còn 99. Có ba cách: optimistic lock bằng @Version, update kèm where version, xung đột thì ObjectOptimisticLockingFailureException, hợp khi xung đột hiếm; pessimistic lock bằng PESSIMISTIC_WRITE, trên PostgreSQL ra for no key update, bên sau chờ, cần khoá theo thứ tự để tránh deadlock; và câu UPDATE nguyên tử có điều kiện stock >= q, em đo 20 thread tranh 10 sản phẩm thì đúng 10 thành công. Với batch insert em dùng SEQUENCE thay IDENTITY vì IDENTITY tắt JDBC batching, 1000 INSERT so với 20 batch, và flush, clear theo lô. Bulk update bỏ qua persistence context và @Version nên dễ bị ghi đè. Entity em không dùng @Data: StackOverflowError, lazy load ngoài ý muốn và hashCode đổi sau persist.",
};
