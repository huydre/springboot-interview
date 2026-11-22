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
        "Trước hết, **{{persistence-context|persistence context}}** là vùng nhớ Hibernate mở cho mỗi transaction: một map từ (loại entity, id) tới object, kèm bản chụp giá trị lúc load. Entity nằm trong map này thì được Hibernate \"theo dõi\". Phần 4 đi sâu hơn.",
        "**Transient** (vừa `new`, không ai theo dõi), **Managed** (nằm trong persistence context: có {{dirty-checking|dirty checking}}, tức Hibernate tự sinh UPDATE khi field đổi, và lazy load được, tức quan hệ được tải khi truy cập lần đầu, bài N+1), **Detached** (có id nhưng không còn được theo dõi), **Removed** (đánh dấu xoá, DELETE lúc {{flush|flush}}, tức lúc Hibernate đẩy SQL xuống DB).",
        "Entity thành detached khi persistence context đóng. **OSIV** ({{osiv|Open Session In View}}, `spring.jpa.open-in-view`) là cấu hình giữ persistence context mở suốt cả HTTP request, kể cả lúc controller và Jackson chạy. OSIV bật (mặc định của Boot) thì entity còn managed tới hết request; tắt OSIV thì entity thành detached ngay khi method `@Transactional` kết thúc.",
        "Đã đo: sửa entity detached bên trong một transaction khác ra **0 UPDATE**. Có id không có nghĩa là managed, và đứng trong `@Transactional` không làm mọi entity thành managed: chỉ entity được load hoặc persist trong chính context đó.",
      ],
      quiz: {
        question: "Entity load ở transaction trước (nay đã detached), sửa field bên trong một transaction mới. Có UPDATE không?",
        options: ["Có, vì đang trong @Transactional", "Không: entity không thuộc persistence context mới nên không được dirty checking", "Có, vì entity có id", "Lỗi exception"],
        answer: 1,
        explain: "Đã đo 0 UPDATE. Chỉ entity được load hoặc persist trong chính context đó mới managed.",
      },
    },
    {
      id: "persist-merge",
      title: "Phần 3: persist, merge và save",
      scene: "merge",
      intro: [
        "`persist(e)` biến chính object thành managed. `merge(e)` trả về **một bản managed khác**, object truyền vào vẫn detached: đã đo `managed == detached` là false, sửa object cũ sau merge thì DB vẫn tên cũ. `save()` gọi `persist` nếu `isNew()`: entity có field `@Version` kiểu wrapper thì xét version null, không có thì xét id null; ngược lại gọi `merge`.",
        "Bẫy id tự gán: `Tag(\"java\")` có id nên save gọi merge, merge SELECT trước: **2 câu SQL** cho một entity mới. Sửa bằng `Persistable<ID>` hoặc `@Version`. `persist(detached)` ném `EntityExistsException: detached entity passed to persist`; `remove(detached)` ném `IllegalArgumentException: Removing a detached instance`.",
        "Entity đã managed (vừa `findById` trong cùng transaction) thì không cần gọi `save()`: câu UPDATE do dirty checking sinh ra lúc flush (Phần 5). Gọi `save()` cũng vô hại, vì `merge` một entity đã managed trả về chính nó.",
      ],
      widget: "merge-persist",
      widgetTitle: "persist, merge, save",
      quiz: {
        question: "Entity load bằng findById trong @Transactional rồi sửa, có cần gọi save()?",
        options: ["Bắt buộc", "Không: dirty checking lo; gọi save cũng vô hại vì merge entity đã managed trả về chính nó", "Không, nhưng phải flush", "Cần saveAndFlush"],
        answer: 1,
        explain: "save không phải thứ tạo ra UPDATE.",
      },
      parts: [
        {
          id: "dto-update",
          title: "Lưu thay đổi từ DTO: findById rồi copy, đừng merge",
          intro: [
            "API sửa đơn hàng nhận một DTO chỉ có vài field. Cách dễ nghĩ: dựng một entity từ DTO rồi `merge`. Nhưng `merge` chép **mọi field** của object truyền vào lên bản managed, nên field DTO không gửi (đang là `null`) sẽ ghi đè dữ liệu thật trong DB.",
            "Cách rõ ràng: trong transaction, `findById` lấy bản managed, copy đúng những field cần sửa từ DTO vào, rồi để dirty checking sinh UPDATE. Bạn kiểm soát được field nào thay đổi, và có chỗ để kiểm tra quy tắc nghiệp vụ.",
          ],
          quiz: {
            question: "Cách rõ ràng nhất để lưu thay đổi từ DTO vào entity?",
            options: ["merge object detached từ DTO", "Trong transaction, findById lấy bản managed rồi copy field cần sửa từ DTO vào", "persist lại", "Gọi refresh"],
            answer: 1,
            explain: "Tránh ghi đè field không mong muốn.",
          },
        },
      ],
    },
    {
      id: "first-level",
      title: "Phần 4: Persistence context và first-level cache",
      scene: "cache",
      intro: [
        "Persistence context là một Map `(loại entity, id) → instance` kèm snapshot, sống theo transaction. Đã đo: 2 lần `findById` trong cùng transaction **1 query**, `a == b` true; không có transaction bao ngoài **2 query, false**; `findById` rồi JPQL cùng id **2 query** nhưng vẫn `a == b` true.",
        "JPQL luôn chạy SQL, nhưng id đã có trong context thì Hibernate trả lại instance cũ và **không ghi đè** giá trị: transaction khác đổi tên thành \"Binh\" rồi commit, JPQL vẫn thấy \"An\". Muốn mới thì `refresh()` hoặc `clear()`. First-level cache chỉ sống trong một transaction; cache dùng chung giữa các transaction là second-level cache, mặc định tắt.",
        "Gỡ entity khỏi context: `em.detach(e)` gỡ **một** entity, `em.clear()` gỡ **tất cả**. Entity bị gỡ thành detached, và thay đổi chưa flush của nó sẽ mất. Batch lớn thường `flush()` trước rồi mới `clear()` để giải phóng bộ nhớ.",
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
        "Rollback chỉ huỷ phía DB. Object Java trong bộ nhớ vẫn mang giá trị đã gọi setter, nên sau exception đừng dùng lại object đó.",
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
        "Flush đẩy thay đổi đang chờ xuống DB, nhưng **không phải commit**. FlushMode.AUTO flush trước commit, trước query có thể bị ảnh hưởng, và khi gọi `flush()`/`saveAndFlush()`.",
        "Khi nào INSERT chạy còn tuỳ cách sinh id. **SEQUENCE** (mặc định của `@GeneratedValue` với H2 và PostgreSQL): Hibernate lấy id từ một sequence của DB trước, nên có id mà chưa cần INSERT, INSERT được hoãn tới lúc flush. **IDENTITY** (cột tự tăng): id chỉ có sau khi dòng được INSERT, nên `persist` phải INSERT ngay.",
        "Thí nghiệm với `Customer` dùng SEQUENCE, trong một transaction: (1) `persist(new Customer(\"Flush\"))`; (2) JPQL đếm `Product`; (3) JPQL đếm `Customer`; (4) persist thêm một Customer rồi native query `select count(*) from customer`. Đếm số INSERT đã chạy sau mỗi bước.",
        "Đã đo: (1) 0 INSERT, còn chờ. (2) vẫn 0, vì Hibernate thấy query không đụng bảng `customer` nên không cần flush. (3) lên 1, flush để count thấy bản ghi mới. (4) lên 2, vì Hibernate không đọc hiểu SQL thuần nên flush tất cả cho chắc. Với IDENTITY thì khác: 1000 persist ra 1000 câu INSERT ngay lúc gọi.",
      ],
      trap: {
        title: "try/catch quanh save() và thứ tự flush",
        text: "Với SEQUENCE (hoặc bất cứ khi nào INSERT bị hoãn), `try { repo.save(x) } catch (DataIntegrityViolationException e)` thường không bắt được, vì INSERT trùng khoá chỉ chạy lúc flush khi commit, sau khi code đã ra khỏi `try`. Với IDENTITY thì INSERT chạy ngay trong `save()`, nên catch bắt được, nhưng đừng dựa vào điều đó. Cần bắt tại chỗ thì `saveAndFlush`, và đừng dùng nó trong vòng lặp. Thứ tự flush cũng cố định INSERT → UPDATE → collection → DELETE: remove rồi persist cùng email unique ném `duplicate key value violates unique constraint \"member_email_key\"`, vì INSERT chạy trước DELETE; gọi `flush()` sau delete.",
      },
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
