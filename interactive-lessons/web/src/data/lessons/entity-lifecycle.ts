import timeline from "../timelines/entity-lifecycle.json";
import type { Lesson, Scene } from "../types";

// Measured on Spring Boot 3.5 + Hibernate ORM 6.6 + PostgreSQL 16.14 (Docker), JDK 21; query counts from Hibernate statistics
// (getPrepareStatementCount). See study note 05.06. Video not rendered yet: scenes stay empty until publish.
export const entityLifecycle: Lesson = {
  slug: "entity-lifecycle",
  crumb: "Entity Lifecycle & Persistence Context",
  videoDir: "/videos/entity-lifecycle",
  videoVersion: "95bba880",
  scenes: timeline as Scene[],
  title: "Entity Lifecycle & Persistence Context",
  subtitle:
    "JPA, Hibernate và Spring Data JPA là ba tầng; bốn trạng thái entity; persist, merge và save; first-level cache; dirty checking; flush chạy SQL lúc nào.",
  openingQuiz: {
    question: "Trong @Transactional, findById rồi setName(\"Binh\"), không gọi save(). DB có đổi không?",
    options: ["Không, phải gọi save()", "Có: dirty checking sinh 1 câu UPDATE lúc flush", "Chỉ khi readOnly", "Chỉ khi có @DynamicUpdate"],
    answer: 1,
    explain: "Đã đo 1 UPDATE. Entity managed được so với snapshot lúc flush.",
  },
  roadmap: [
    "Chặng 1: ba tầng và bốn trạng thái entity.",
    "Chặng 2: persist, merge, save và first-level cache.",
    "Chặng 3: dirty checking và flush.",
  ],
  sections: [
    {
      id: "layers",
      title: "Phần 1: JPA, Hibernate, Spring Data JPA",
      scene: "layers",
      intro: [
        "**JPA** là specification (interface, annotation, `EntityManager`, JPQL), không tự chạy. **Hibernate** là implementation: ORM thật sự sinh SQL, quản lý cache và proxy. **Spring Data JPA** là lớp tiện ích bên trên: `JpaRepository`, derived query, `Pageable`. `orderRepo.save(o)` là `SimpleJpaRepository.save()` gọi `persist()` hoặc `merge()`, và Hibernate sinh câu INSERT.",
        "\"Spring Data JPA là ORM\" là sai: nó không sinh SQL. `SimpleJpaRepository` đánh `@Transactional(readOnly = true)` ở class, method ghi đánh lại `@Transactional`, nên `repo.findById()` ngoài service có một transaction ngắn riêng.",
      ],
      quiz: {
        question: "JpaRepository thuộc tầng nào?",
        options: ["JPA spec", "Spring Data JPA", "Hibernate", "JDBC"],
        answer: 1,
        explain: "Package org.springframework.data.jpa.repository. JPA chỉ có EntityManager, Query, annotation mapping.",
      },
    },
    {
      id: "states",
      title: "Phần 2: Bốn trạng thái của entity",
      scene: "states",
      intro: [
        "**Transient** (vừa `new`, không ai theo dõi), **Managed** (persistence context theo dõi, có dirty checking, lazy load được), **Detached** (có id nhưng không còn được theo dõi), **Removed** (đánh dấu xoá, DELETE lúc flush). Khi tắt OSIV, entity thành detached ngay khi method `@Transactional` kết thúc; OSIV bật (mặc định của Boot) thì persistence context còn mở tới hết request.",
        "Đã đo: sửa entity detached bên trong một transaction khác ra **0 UPDATE**. Có id không có nghĩa là managed, và đứng trong `@Transactional` không làm mọi entity thành managed: chỉ entity được load hoặc persist trong chính context đó.",
      ],
      quiz: {
        question: "Cách rõ ràng nhất để lưu thay đổi từ DTO vào entity?",
        options: ["merge object detached từ DTO", "Trong transaction, findById lấy bản managed rồi copy field cần sửa từ DTO vào", "persist lại", "Gọi refresh"],
        answer: 1,
        explain: "Tránh ghi đè field không mong muốn.",
      },
    },
    {
      id: "persist-merge",
      title: "Phần 3: persist, merge và save",
      scene: "merge",
      intro: [
        "`persist(e)` biến chính object thành managed. `merge(e)` trả về **một bản managed khác**, object truyền vào vẫn detached: đã đo `managed == detached` là false, sửa object cũ sau merge thì DB vẫn tên cũ. `save()` gọi `persist` nếu `isNew()`: entity có field `@Version` kiểu wrapper thì xét version null, không có thì xét id null; ngược lại gọi `merge`.",
        "Bẫy id tự gán: `Tag(\"java\")` có id nên save gọi merge, merge SELECT trước: **2 câu SQL** cho một entity mới. Sửa bằng `Persistable<ID>` hoặc `@Version`. `persist(detached)` ném `EntityExistsException: detached entity passed to persist`; `remove(detached)` ném `IllegalArgumentException: Removing a detached instance`.",
      ],
      widget: "merge-persist",
      widgetTitle: "persist, merge, save",
      quiz: {
        question: "Entity load bằng findById trong @Transactional rồi sửa, có cần gọi save()?",
        options: ["Bắt buộc", "Không: dirty checking lo; gọi save cũng vô hại vì merge entity đã managed trả về chính nó", "Không, nhưng phải flush", "Cần saveAndFlush"],
        answer: 1,
        explain: "save không phải thứ tạo ra UPDATE.",
      },
    },
    {
      id: "first-level",
      title: "Phần 4: Persistence context và first-level cache",
      scene: "cache",
      intro: [
        "Persistence context là một Map `(loại entity, id) → instance` kèm snapshot, sống theo transaction. Đã đo: 2 lần `findById` trong cùng transaction **1 query**, `a == b` true; không có transaction bao ngoài **2 query, false**; `findById` rồi JPQL cùng id **2 query** nhưng vẫn `a == b` true.",
        "JPQL luôn chạy SQL, nhưng id đã có trong context thì Hibernate trả lại instance cũ và **không ghi đè** giá trị: transaction khác đổi tên thành \"Binh\" rồi commit, JPQL vẫn thấy \"An\". Muốn mới thì `refresh()` hoặc `clear()`. First-level cache chỉ sống trong một transaction; cache dùng chung là second-level cache, mặc định tắt (`HHH000026`).",
      ],
      quiz: {
        question: "em.clear() và em.detach(e) khác nhau thế nào?",
        options: ["Giống nhau", "detach gỡ một entity, clear gỡ tất cả; thay đổi chưa flush của entity bị gỡ sẽ mất", "clear xoá dữ liệu trong DB", "detach commit trước"],
        answer: 1,
        explain: "Batch lớn: flush() trước rồi clear().",
      },
    },
    {
      id: "dirty",
      title: "Phần 5: Dirty checking",
      scene: "dirty",
      intro: [
        "Load entity thì Hibernate chụp snapshot; lúc flush so từng field, khác thì sinh UPDATE. Đã đo: setter không gọi save **1 UPDATE**; gán đúng giá trị cũ, trong `readOnly = true`, hoặc trên entity detached đều **0**. Mặc định UPDATE tất cả cột (`update product set name=?,stock=?,version=? where id=? and version=?` dù chỉ đổi stock); `@DynamicUpdate` chỉ update cột thay đổi.",
        "Bẫy: sửa entity để tính toán hiển thị (`order.setTotal(total * 0.9)`) trong transaction thì commit xong DB bị ghi đè; tính trên DTO. Flush duyệt mọi entity managed: hàng chục nghìn entity thì tốn RAM và CPU, dùng readOnly, DTO projection hoặc flush + clear theo lô.",
      ],
      widget: "dirty-check",
      widgetTitle: "Có câu UPDATE không",
      quiz: {
        question: "Exception xảy ra sau khi đã gọi setter. Object trong memory thế nào?",
        options: ["Quay về giá trị cũ", "Vẫn mang giá trị đã sửa dù DB rollback: đừng dùng lại object đó", "Bị xoá", "Thành transient"],
        answer: 1,
        explain: "Rollback chỉ huỷ phía DB.",
      },
    },
    {
      id: "flush",
      title: "Phần 6: Flush: khi nào SQL thật sự chạy",
      scene: "flush",
      intro: [
        "Flush đẩy thay đổi đang chờ xuống DB, nhưng **không phải commit**. FlushMode.AUTO flush trước commit, trước query có thể bị ảnh hưởng, và khi gọi `flush()`/`saveAndFlush()`. Đã đo: persist 0 INSERT; JPQL bảng khác vẫn 0; JPQL trên Customer lên 1; native query flush tất cả lên 2. `IDENTITY` thì persist INSERT ngay: 1000 persist ra 1000 câu.",
        "`try { repo.save(x) } catch (DataIntegrityViolationException e)` thường không bắt được vì INSERT chạy lúc commit; cần bắt tại chỗ thì `saveAndFlush`, nhưng đừng dùng trong vòng lặp. Thứ tự flush cố định INSERT → UPDATE → collection → DELETE: remove rồi persist cùng email unique ném `duplicate key value violates unique constraint \"member_email_key\"`; gọi `flush()` sau delete.",
      ],
      widget: "flush-timing",
      widgetTitle: "Đếm INSERT sau từng câu lệnh",
      quiz: {
        question: "Đã flush rồi exception làm rollback. Dữ liệu đã flush có vào DB không?",
        options: ["Có", "Không: flush chỉ gửi SQL trong transaction đang mở, rollback huỷ hết", "Một nửa", "Tuỳ FlushMode"],
        answer: 1,
        explain: "Transaction khác ở READ COMMITTED cũng không thấy dữ liệu flush mà chưa commit.",
      },
    },
  ],
  modelAnswer:
    "JPA là specification, Hibernate là implementation sinh SQL, Spring Data JPA là lớp repository bên trên. Entity có bốn trạng thái: transient, managed, detached, removed; chỉ managed mới được dirty checking, và khi tắt OSIV thì entity thành detached ngay lúc transaction kết thúc. Persistence context là first-level cache sống theo transaction: em đo hai lần findById trong cùng transaction chỉ một query và cùng một instance. Khi load, Hibernate chụp snapshot; lúc flush so field và sinh UPDATE, nên sửa entity managed không cần gọi save. save gọi persist nếu entity mới, ngược lại gọi merge, mà merge trả về một bản managed khác nên phải dùng giá trị trả về; với id tự gán thì save còn SELECT trước. Flush chạy trước commit, trước query liên quan và khi gọi flush, nên bắt lỗi constraint quanh save thường không được, phải saveAndFlush.",
};
