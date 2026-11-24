import timeline from "../timelines/entity-lifecycle.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

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
    "JPA, Hibernate và Spring Data JPA là ba tầng; bốn trạng thái entity; persist, merge và save; first-level cache; dirty checking; flush chạy SQL lúc nào; repository: derived query, @Query, phân trang, projection, auditing.",
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
    "Chặng 4: tầng repository của Spring Data: query, phân trang, projection, auditing và soft delete.",
  ],
  sections: [
    {
      id: "layers",
      title: "Phần 1: JPA, Hibernate, Spring Data JPA",
      scene: "layers",
      intro: [
        "Ba cái tên hay bị dùng lẫn, thật ra là ba tầng:",
        "- **JPA**: specification (interface, annotation, `EntityManager`, JPQL), không tự chạy.",
        "- **Hibernate**: implementation, ORM thật sự sinh SQL, quản lý cache và proxy.",
        "- **Spring Data JPA**: lớp tiện ích bên trên: `JpaRepository`, derived query, `Pageable`.",
        "`orderRepo.save(o)` là `SimpleJpaRepository.save()` gọi `persist()` hoặc `merge()`, và Hibernate sinh câu INSERT.",
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
        "Bốn trạng thái:",
        "- **Transient**: vừa `new`, không ai theo dõi.",
        "- **Managed**: nằm trong persistence context: có {{dirty-checking|dirty checking}}, tức Hibernate tự sinh UPDATE khi field đổi, và lazy load được, tức quan hệ được tải khi truy cập lần đầu (bài N+1).",
        "- **Detached**: có id nhưng không còn được theo dõi.",
        "- **Removed**: đánh dấu xoá, DELETE lúc {{flush|flush}}, tức lúc Hibernate đẩy SQL xuống DB.",
        "Entity thành detached khi persistence context đóng, thường là khi method `@Transactional` kết thúc.",
        "Đã đo: sửa entity detached bên trong một transaction khác ra **0 UPDATE**. Có id không có nghĩa là managed, và đứng trong `@Transactional` không làm mọi entity thành managed: chỉ entity được load hoặc persist trong chính context đó.",
      ],
      after: [
        "Một ngoại lệ về thời điểm detached: **OSIV** ({{osiv|Open Session In View}}, `spring.jpa.open-in-view`) là cấu hình giữ persistence context mở suốt cả HTTP request, kể cả lúc controller và Jackson chạy. OSIV bật (mặc định của Boot) thì entity còn managed tới hết request; tắt OSIV thì entity thành detached ngay khi method `@Transactional` kết thúc (bài N+1 nói kỹ).",
      ],
      takeaway: {
        lines: ["Chỉ entity **managed** mới được Hibernate theo dõi. Có id hay đang đứng trong `@Transactional` đều không đủ: entity phải được load hoặc persist trong chính persistence context đó."],
      },
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
        "Biết bốn trạng thái rồi, giờ xem ba method đưa entity vào trạng thái managed:",
        "- **`persist(e)`**: biến chính object thành managed.",
        "- **`merge(e)`**: trả về **một bản managed khác**, object truyền vào vẫn detached.",
        "- **`save()`**: gọi `persist` nếu entity là mới (thường là id còn null), ngược lại gọi `merge`.",
        "Bẫy id tự gán: `Tag(\"java\")` có id nên save gọi merge, merge SELECT trước: **2 câu SQL** cho một entity mới. Sửa bằng cách cho Spring Data biết entity này mới: thêm field `@Version` kiểu wrapper (version null nghĩa là mới), hoặc implement `Persistable<ID>` để tự trả lời `isNew()`. `persist(detached)` ném `EntityExistsException: detached entity passed to persist`; `remove(detached)` ném `IllegalArgumentException: Removing a detached instance`.",
        "Entity đã managed (vừa `findById` trong cùng transaction) thì không cần gọi `save()`: câu UPDATE do dirty checking sinh ra lúc flush (Phần 5). Gọi `save()` cũng vô hại, vì `merge` một entity đã managed trả về chính nó.",
      ],
      predict: {
        question: "`Customer managed = em.merge(detached);` rồi `detached.setName(\"ignored\")`, sau đó commit. Tên trong DB là gì?",
        options: [
          "`ignored`, vì đã merge rồi",
          "Vẫn tên cũ: `merge` trả về bản managed khác, sửa object cũ bị bỏ qua",
          "Lỗi `EntityExistsException`",
          "`null`",
        ],
        answer: 1,
        explain: "Đã đo `managed == detached` là false. Chỉ bản `managed` được theo dõi, nên luôn dùng giá trị `merge` trả về.",
      },
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
        "Phần 2 mới giới thiệu persistence context. Giờ xem nó hoạt động như một cache ra sao.",
        "Persistence context là một Map `(loại entity, id) → instance` kèm snapshot, sống theo transaction. Đã đo:",
        "- **2 lần `findById` trong cùng transaction**: **1 query**, `a == b` true.",
        "- **Không có transaction bao ngoài**: **2 query, false**.",
        "- **`findById` rồi JPQL cùng id**: **2 query** nhưng vẫn `a == b` true.",
        "JPQL luôn chạy SQL, nhưng id đã có trong context thì Hibernate trả lại instance cũ và **không ghi đè** giá trị: transaction khác đổi tên thành \"Binh\" rồi commit, JPQL vẫn thấy \"An\". Muốn mới thì `refresh()` hoặc `clear()`. First-level cache chỉ sống trong một transaction; cache dùng chung giữa các transaction là second-level cache, mặc định tắt.",
        "Gỡ entity khỏi context: `em.detach(e)` gỡ **một** entity, `em.clear()` gỡ **tất cả**. Entity bị gỡ thành detached, và thay đổi chưa flush của nó sẽ mất. Batch lớn thường `flush()` trước rồi mới `clear()` để giải phóng bộ nhớ.",
      ],
      takeaway: {
        lines: ["First-level cache sống theo transaction: cùng id thì cùng một instance. JPQL vẫn chạy SQL nhưng **không ghi đè** instance đã có; muốn giá trị mới thì `refresh()` hoặc `clear()`."],
      },
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
      board: {
        title: "Dirty checking: không gọi save vẫn có UPDATE",
        highlight: "không gọi save",
        chips: ["Snapshot lúc load", "So sánh lúc flush"],
        cards: [
          {
            title: "Snapshot và flush",
            diagram: {
              kind: "flow", neutral: true,
              steps: ["Load entity: chụp snapshot", "product.setStock(5)", "Flush: so từng field"],
              ok: ["Có field khác snapshot", "1 UPDATE"],
              bad: ["Giống snapshot", "0 UPDATE"],
            },
            notes: ["Gán đúng giá trị cũ, `readOnly = true` hoặc entity detached đều ra 0 UPDATE."],
            code: `@Transactional
void restock(long id) {
  Product p = repo.findById(id).orElseThrow();
  p.setStock(5); // không cần save()
}`,
            takeaway: "Entity managed tự được ghi khi flush",
          },
          {
            title: "Bẫy sửa để hiển thị",
            diagram: {
              kind: "flow",
              steps: ["order.setTotal(total * 0.9)", "Chỉ để tính hiển thị", "Commit"],
              ok: ["Tính trên DTO", "DB giữ nguyên"],
              bad: ["Sửa entity managed", "DB bị ghi đè"],
            },
            notes: ["Rollback chỉ huỷ phía DB, object Java vẫn mang giá trị đã set."],
            takeaway: "Muốn tính toán hiển thị, đừng sửa entity",
          },
        ],
        conclusion: "**Kết luận:** setter trên entity managed trong transaction là một lệnh ghi DB, dù không gọi `save()`.",
      },
      scene: "dirty",
      intro: [
        "Load entity thì Hibernate chụp snapshot; lúc flush so từng field, khác thì sinh UPDATE. Đã đo:",
        "- **Setter, không gọi save**: **1 UPDATE**.",
        "- **Gán đúng giá trị cũ, trong `readOnly = true`, hoặc trên entity detached**: đều **0**.",
        "Mặc định UPDATE tất cả cột (`update product set name=?,stock=?,version=? where id=? and version=?` dù chỉ đổi stock); `@DynamicUpdate` chỉ update cột thay đổi.",
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
      senior: true,
      title: "Phần 6: Flush: khi nào SQL thật sự chạy",
      scene: "flush",
      intro: [
        "Flush đẩy thay đổi đang chờ xuống DB, nhưng **không phải commit**. FlushMode.AUTO flush vào 3 lúc:",
        "- **Trước commit**.",
        "- **Trước query có thể bị ảnh hưởng**.",
        "- **Khi gọi `flush()`/`saveAndFlush()`**.",
        "Khi nào INSERT chạy còn tuỳ cách sinh id. **SEQUENCE** (mặc định của `@GeneratedValue` với H2 và PostgreSQL): Hibernate lấy id từ một sequence của DB trước, nên có id mà chưa cần INSERT, INSERT được hoãn tới lúc flush. **IDENTITY** (cột tự tăng): id chỉ có sau khi dòng được INSERT, nên `persist` phải INSERT ngay.",
        "Thí nghiệm với `Customer` dùng SEQUENCE, trong một transaction: (1) `persist(new Customer(\"Flush\"))`; (2) JPQL đếm `Product`; (3) JPQL đếm `Customer`; (4) persist thêm một Customer rồi native query `select count(*) from customer`. Đếm số INSERT đã chạy sau mỗi bước.",
      ],
      predict: {
        question: "Sau bước (2), JPQL đếm `Product`, đã có bao nhiêu câu INSERT `customer` chạy?",
        options: [
          "1, vì mọi JPQL đều flush trước",
          "0: query không đụng bảng `customer` nên Hibernate chưa cần flush",
          "1, vì `persist` INSERT ngay",
          "0, vì JPQL không bao giờ flush",
        ],
        answer: 1,
        explain: "FlushMode.AUTO chỉ flush trước query có thể bị ảnh hưởng. Tới bước (3) đếm `Customer` thì mới flush.",
      },
      after: [
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
    {
      id: "repository",
      title: "Phần 7 (Chặng 4, sang tầng repository): Repository của Spring Data: derived query và @Query",
      intro: [
        "Phần 1 nói Spring Data JPA là lớp tiện ích bên trên Hibernate. Phần này xem lớp đó cho ta viết query bằng những cách nào.",
        "Tình huống: màn hình \"Đơn hàng của tôi\" cần đơn của một khách theo trạng thái, mới nhất trước. Có hai cách viết trong repository.",
        "**Derived query**: chỉ khai báo tên method, Spring Data đọc tên đó và tự sinh query. Ví dụ `List<Order> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, OrderStatus status)`.",
        "- **Từ khoá hay dùng**: `And`, `Or`, `Between`, `LessThan`, `In`, `IsNull`, `Containing`, `IgnoreCase`, `OrderBy...Desc`, `Top10`/`First`.",
        "- **Tiền tố khác `find`**: `countBy...` trả số, `existsBy...` trả `boolean`, `deleteBy...` xoá.",
        "- **Kiểm tra lúc khởi động**: tên field sai (`findByStatuss`) làm app không lên được, báo `PropertyReferenceException: No property 'statuss' found`. Lỗi lộ ra sớm, không đợi tới lúc người dùng bấm.",
        "- **Giới hạn**: tên method dài quá 2 hoặc 3 điều kiện, cần JOIN hay hàm gộp (`sum`, `group by`) thì chuyển sang `@Query`.",
        "**`@Query`** tự viết câu query. So hai loại:",
      ],
      widgetTitle: "Cùng một query, viết bằng JPQL hay SQL thuần",
      compare: [
        way(
          "@Query JPQL",
          `@Query("""
    select o from Order o
    where o.customerId = :customerId and o.status = :status
    order by o.createdAt desc""")
List<Order> findMine(Long customerId, OrderStatus status);`,
          [
            ask("Gõ sai tên field `o.statuss`", ok("Spring Data kiểm tra JPQL khi tạo repository: app không khởi động, báo `Query '...' validation failed for method ...`.")),
            ask("Đổi từ PostgreSQL sang MySQL", ok("JPQL dùng tên entity và field, Hibernate sinh SQL theo từng DB, không phải sửa.")),
            ask("Cần JSONB, window function, `ON CONFLICT`", bad("JPQL không có những thứ riêng của từng DB.")),
          ],
          "Viết theo entity, kiểm tra lúc khởi động, chạy được trên nhiều DB.",
        ),
        way(
          "@Query nativeQuery = true",
          `@Query(value = """
    select * from orders
    where customer_id = :customerId and status = :status
    order by created_at desc""", nativeQuery = true)
List<Order> findMine(Long customerId, String status);`,
          [
            ask("Gõ sai tên cột `statuss`", bad("Spring Data không kiểm tra SQL thuần lúc khởi động: app vẫn lên, lỗi chỉ xuất hiện khi method được gọi lần đầu.")),
            ask("Đổi từ PostgreSQL sang MySQL", bad("Câu SQL viết theo tên bảng, cột và cú pháp của một DB, có thể phải viết lại.")),
            ask("Cần JSONB, window function, `ON CONFLICT`", ok("Dùng được mọi tính năng của DB.")),
          ],
          "Toàn quyền với SQL, đổi lại mất kiểm tra sớm và tính di động.",
        ),
      ],
      after: [
        "Câu `UPDATE` hay `DELETE` trong `@Query` phải thêm `@Modifying` và chạy trong `@Transactional`. Câu này đi thẳng xuống DB, bỏ qua persistence context: entity đã load trước đó vẫn mang giá trị cũ, nên thêm `@Modifying(clearAutomatically = true)` nếu còn đọc lại trong cùng transaction.",
      ],
      takeaway: {
        lines: [
          "Query ngắn thì derived query, dài hay có JOIN thì `@Query` JPQL, chỉ dùng native khi cần tính năng riêng của DB. JPQL và derived query sai thì app không khởi động; native sai thì lỗi lúc chạy.",
        ],
      },
      quiz: {
        question: "Bạn gõ sai tên cột trong một `@Query(nativeQuery = true)`. Lỗi lộ ra khi nào?",
        options: [
          "Lúc biên dịch",
          "Lúc app khởi động, như JPQL",
          "Chỉ khi method được gọi lần đầu, vì Spring Data không kiểm tra SQL thuần lúc khởi động",
          "Không bao giờ, DB tự sửa",
        ],
        answer: 2,
        explain: "Spring Data chỉ kiểm tra JPQL (và derived query) lúc tạo repository. Native query cần test tích hợp chạy trên DB thật để bắt lỗi.",
      },
      parts: [
        {
          id: "repo-paging",
          title: "Page, Slice và countQuery",
          intro: [
            "Có query rồi, giờ phân trang. Truyền `Pageable` vào method, ví dụ `PageRequest.of(0, 20, Sort.by(\"createdAt\").descending())`. Kiểu trả về quyết định số câu SQL:",
            "- **`Page<Order>`**: có nội dung trang và `getTotalElements()`, nên ngoài câu lấy dữ liệu còn chạy thêm một câu `select count(*)`.",
            "- **`Slice<Order>`**: không đếm. Nó lấy `size + 1` dòng để biết còn trang sau không (`hasNext()`). Hợp với nút \"Xem thêm\" hoặc cuộn vô tận.",
            "- **`List<Order>`**: chỉ có `LIMIT`/`OFFSET`, không có thông tin trang.",
            "Bảng 50 triệu đơn hàng thì `count(*)` mỗi lần chuyển trang có thể chậm hơn chính câu lấy dữ liệu. Màn hình không cần hiện \"Trang 3 / 2.500\" thì dùng `Slice`.",
          ],
          predict: {
            question: "Bảng có 10.000 đơn. Method trả `Page<Order>`, gọi với trang 0, size 20. Spring Data chạy mấy câu SQL?",
            options: [
              "1 câu, có `LIMIT 20`",
              "2 câu: một câu lấy 20 dòng, một câu `count(*)` để biết tổng",
              "10.000 câu",
              "1 câu lấy 21 dòng",
            ],
            answer: 1,
            explain: "`Page` cần tổng số dòng nên chạy thêm câu đếm. Lấy 21 dòng là cách của `Slice`.",
          },
          after: [
            "Spring Data tự sinh câu đếm từ query của bạn. Với `@Query` có `join fetch` hay JOIN phức tạp, câu đếm tự sinh có thể sai hoặc chậm, nên khai báo riêng: `@Query(value = \"select o from Order o join fetch o.items where o.customerId = :id\", countQuery = \"select count(o) from Order o where o.customerId = :id\")`.",
            "Trang đầu có ít dòng hơn `size` thì Spring Data biết luôn tổng số và bỏ qua câu đếm.",
          ],
          takeaway: {
            lines: ["`Page` = dữ liệu + câu `count(*)`. `Slice` = lấy `size + 1` dòng, không đếm. Query có JOIN thì tự viết `countQuery`."],
          },
          quiz: {
            question: "App mobile có danh sách cuộn vô tận, không hiện tổng số trang. Kiểu trả về nào hợp nhất?",
            options: ["`Page<T>`", "`Slice<T>`, vì không cần câu `count(*)`", "`List<T>` không có Pageable", "`Stream<T>`"],
            answer: 1,
            explain: "`Slice` chỉ cần biết còn trang sau hay không, nên lấy thêm một dòng thay vì đếm cả bảng.",
          },
        },
        {
          id: "repo-projection",
          title: "Projection: chỉ lấy cột cần dùng",
          intro: [
            "Danh sách đơn hàng chỉ hiện mã, trạng thái và tổng tiền, nhưng `List<Order>` tải đủ mọi cột, đưa từng entity vào persistence context và chụp snapshot cho dirty checking. Nghìn dòng là nghìn snapshot không dùng tới.",
            "**Projection** là trả về một kiểu nhỏ hơn entity:",
            "- **Interface projection**: khai báo `interface OrderSummary { Long getId(); OrderStatus getStatus(); BigDecimal getTotal(); }` rồi `List<OrderSummary> findByCustomerId(Long id)`. Spring Data chỉ `select` ba cột đó.",
            "- **DTO projection**: `record OrderRow(Long id, OrderStatus status, BigDecimal total)`, dùng trong JPQL: `select new com.shop.OrderRow(o.id, o.status, o.total) from Order o where ...`.",
            "- **Kết quả không phải entity**: không vào persistence context, không dirty checking, sửa cũng không sinh UPDATE. Đúng cho màn hình chỉ đọc.",
          ],
          trap: {
            title: "Open projection tải lại cả entity",
            text: "Interface có method gắn `@Value(\"#{target.firstName + ' ' + target.lastName}\")` là open projection: Spring Data không biết cần cột nào nên tải đủ entity rồi mới tính. Muốn chỉ lấy vài cột thì dùng getter đúng tên field, hoặc DTO.",
          },
          takeaway: {
            lines: ["Màn hình chỉ đọc thì trả projection hoặc DTO: ít cột hơn, không snapshot, không dirty checking."],
          },
          quiz: {
            question: "Lợi ích chính của `List<OrderSummary>` (interface projection 3 getter) so với `List<Order>` cho màn hình danh sách?",
            options: [
              "Tự cache kết quả",
              "Chỉ select các cột cần, và kết quả không phải entity nên không vào persistence context, không tốn snapshot",
              "Tự động phân trang",
              "Cho phép sửa rồi tự lưu",
            ],
            answer: 1,
            explain: "Projection không được Hibernate theo dõi, nên nhẹ hơn và không có UPDATE ngoài ý muốn.",
          },
        },
        {
          id: "repo-auditing",
          title: "Auditing: tự điền created_at và updated_at",
          intro: [
            "Hầu như bảng nào cũng cần `created_at`, `updated_at`. Gán tay trong từng service thì sớm muộn sẽ có chỗ quên.",
            "**Auditing** của Spring Data tự điền các cột này:",
            "- **Annotation trên field**: `@CreatedDate`, `@LastModifiedDate`, và `@CreatedBy`, `@LastModifiedBy` cho người tạo, người sửa.",
            "- **Listener trên entity**: `@EntityListeners(AuditingEntityListener.class)`, thường đặt ở một lớp cha `@MappedSuperclass BaseEntity`.",
            "- **Bật ở cấu hình**: `@EnableJpaAuditing` trên một class `@Configuration`. Quên dòng này thì các field cứ là `null`, không có lỗi nào báo.",
            "- **Người dùng hiện tại**: khai báo bean `AuditorAware<String>` lấy tên từ `SecurityContextHolder`, cho `@CreatedBy`.",
            "JPA cũng có callback riêng, `@PrePersist` và `@PreUpdate`, chạy ngay trước INSERT hoặc UPDATE của entity. Cả auditing lẫn callback chỉ chạy khi đi qua entity: câu `@Modifying @Query(\"update Order o set ...\")` hay native query đi thẳng xuống DB nên **không** cập nhật `updated_at`.",
          ],
          takeaway: {
            lines: [
              "Auditing cần đủ ba thứ: annotation trên field, `AuditingEntityListener` trên entity, `@EnableJpaAuditing` ở cấu hình. Bulk update và native query bỏ qua nó.",
            ],
          },
          quiz: {
            question: "Entity có `@CreatedDate` và `@EntityListeners(AuditingEntityListener.class)`, nhưng sau khi save thì `createdAt` vẫn `null`, không có lỗi. Nguyên nhân hay gặp nhất?",
            options: [
              "Cột trong DB sai kiểu",
              "Quên `@EnableJpaAuditing` trên một class cấu hình",
              "Phải gọi `saveAndFlush`",
              "`@CreatedDate` chỉ chạy với MySQL",
            ],
            answer: 1,
            explain: "Không bật auditing thì listener không có gì để làm và field giữ nguyên `null`. Không có exception nên dễ bị bỏ sót tới khi có người hỏi dữ liệu.",
          },
        },
        {
          id: "repo-soft-delete",
          title: "Soft delete: đánh dấu xoá thay vì xoá thật",
          intro: [
            "Nhiều bảng (đơn hàng, tài khoản) không được xoá thật vì còn cần lịch sử.",
            "**Soft delete**: thay vì xoá, đặt `deleted_at`. Hibernate có sẵn hai annotation:",
            "- **`@SQLDelete(sql = \"UPDATE orders SET deleted_at = now() WHERE id = ?\")`**: `repo.delete(o)` chạy câu UPDATE này thay cho DELETE.",
            "- **`@SQLRestriction(\"deleted_at IS NULL\")`**: Hibernate tự thêm điều kiện này vào mọi query của entity. Nó thay cho `@Where` đã bị đánh dấu lỗi thời từ Hibernate 6.3.",
            "Cái giá của soft delete:",
            "- **UNIQUE bị vướng**: email của tài khoản đã xoá vẫn chiếm chỗ. Trên PostgreSQL dùng index unique có điều kiện: `CREATE UNIQUE INDEX ux_email_alive ON users(email) WHERE deleted_at IS NULL`. Đã chạy câu SQL này trên PGlite (PostgreSQL, không chạy qua Hibernate): một dòng đã xoá và một dòng còn sống trùng giá trị thì được, thêm dòng còn sống thứ hai thì báo `duplicate key`.",
            "- **Native query không được lọc**: `@SQLRestriction` chỉ áp cho query Hibernate sinh ra; SQL thuần phải tự viết `deleted_at IS NULL`.",
            "- **Bảng chỉ lớn lên**: cần job dọn hoặc chuyển dữ liệu cũ sang bảng lưu trữ.",
          ],
          takeaway: {
            lines: ["Soft delete = `@SQLDelete` + `@SQLRestriction`, kèm index unique có điều kiện `WHERE deleted_at IS NULL`."],
          },
          quiz: {
            question: "Tài khoản đã soft delete vẫn giữ email `a@x.com` trong bảng, và có cột `UNIQUE (email)`. Đăng ký lại bằng email đó thì sao?",
            options: [
              "Được, vì dòng cũ đã bị xoá",
              "Báo trùng, vì dòng soft delete vẫn nằm trong bảng; dùng unique index có điều kiện `WHERE deleted_at IS NULL`",
              "Hibernate tự bỏ qua dòng đã xoá",
              "Chỉ lỗi trên MySQL",
            ],
            answer: 1,
            explain: "Soft delete chỉ đặt `deleted_at`, dòng vẫn chiếm giá trị unique. Index có điều kiện chỉ ràng buộc các dòng còn sống.",
          },
        },
        {
          id: "repo-specification",
          title: "Lọc động với Specification: nhiều bộ lọc tuỳ chọn",
          intro: [
            "Derived query và `@Query` ở trên đều có điều kiện cố định. Màn hình tìm sản phẩm thì khác: người dùng có thể điền hoặc bỏ trống từng ô.",
            "Tình huống: tìm sản phẩm với 4 bộ lọc tuỳ chọn: tên chứa chữ gì, danh mục, giá tối thiểu, còn bán hay không. Mỗi ô có thể trống, nên có 2 x 2 x 2 x 2 = 16 tổ hợp. Các cách viết:",
            "- **Derived query**: mỗi tổ hợp một method, kiểu `findByNameContainingAndCategoryAndPriceGreaterThanEqualAndActive`. 16 method, thêm ô thứ năm thành 32.",
            "- **Nối chuỗi JPQL**: `if (name != null) jpql += \" and p.name like :name\"`, rồi thêm một loạt `if` nữa để set tham số. Dễ lệch giữa hai chỗ, dễ sai cú pháp, và nếu nối thẳng giá trị người dùng vào chuỗi thì thành SQL injection.",
            "- **`@Query` với `(:category is null or p.category = :category)`**: một method cho mọi tổ hợp, gọn nhưng có cái giá về index, xem phần bẫy.",
            "- **Specification**: mỗi bộ lọc là một mảnh nhỏ, ghép lại lúc chạy, ô nào trống thì bỏ mảnh đó.",
            "- **Querydsl**: cùng ý tưởng ghép điều kiện, nhưng dùng lớp `QProduct` sinh ra lúc build để viết `QProduct.product.price.goe(min)` có kiểm tra kiểu. Cần thêm thư viện và annotation processor; repository kế thừa `QuerydslPredicateExecutor`.",
            "**`Specification<T>`** của Spring Data là interface có một method `toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb)`, trả về một `Predicate`, tức một điều kiện trong WHERE của JPA Criteria API. Vì chỉ có một method nên viết bằng lambda:",
            "- **`root`**: entity trong FROM, `root.get(\"price\")` là thuộc tính `price`.",
            "- **`cb`** (`CriteriaBuilder`): tạo điều kiện, như `cb.equal`, `cb.like`, `cb.greaterThanOrEqualTo`.",
            "- **Bỏ qua ô trống**: lambda trả `null` khi tham số là `null`; khi ghép bằng `and` hay `Specification.allOf(...)`, Spring Data bỏ qua mảnh trả `null`.",
            "- **Bật cho repository**: kế thừa thêm `JpaSpecificationExecutor<Product>`, có sẵn `findAll(spec)`, `findAll(spec, pageable)`, `count(spec)`, `exists(spec)`.",
          ],
          predict: {
            question: "Người dùng chỉ điền tên \"phone\" và chọn \"còn bán\", hai ô kia trống. Câu SQL mà Specification ở dưới sinh ra có WHERE thế nào?",
            options: [
              "Đủ 4 điều kiện, hai điều kiện trống thành `? is null or ...`",
              "Chỉ 2 điều kiện: `lower(name) like ?` và `active = ?`",
              "Không có WHERE, Spring Data lọc trong Java",
              "Báo lỗi vì có tham số null",
            ],
            answer: 1,
            explain: "Mảnh nào trả `null` thì không vào câu SQL. Đã chạy: WHERE chỉ có `lower(p1_0.name) like ? escape '' and p1_0.active=?`.",
          },
          widgetTitle: "Cùng màn hình tìm sản phẩm: @Query một câu cho mọi tổ hợp hay Specification",
          compare: [
            way(
              "@Query với (:p is null or ...)",
              `@Query("""
    select p from Product p
    where (:category is null or p.category = :category)
      and (:active is null or p.active = :active)""")
List<Product> search(String category, Boolean active);

// SQL Hibernate gửi đi, mọi tổ hợp đều là câu này:
// where (? is null or p1_0.category=?)
//   and (? is null or p1_0.active=?)`,
              [
                ask("Thêm ô lọc thứ năm", ok("Thêm một dòng `and (:x is null or ...)` vào câu query.")),
                ask("Người dùng chỉ điền một ô", bad("DB vẫn nhận câu đủ mọi điều kiện, ô trống thành `null is null`. Mọi tổ hợp dùng chung một câu SQL nên có thể dùng chung một kế hoạch chạy.")),
                ask("Ô tên cần `like` không phân biệt hoa thường, ô giá cần khoảng", ok("Viết được trong JPQL, nhưng câu dài dần và khó đọc.")),
              ],
              "Ít code, nhưng một câu SQL phải phục vụ mọi tổ hợp.",
            ),
            way(
              "Specification",
              `interface ProductRepository extends JpaRepository<Product, Long>,
    JpaSpecificationExecutor<Product> {}

static Specification<Product> inCategory(String c) {
  return (root, query, cb) ->
      c == null ? null : cb.equal(root.get("category"), c);
}
static Specification<Product> priceAtLeast(BigDecimal min) {
  return (root, query, cb) ->
      min == null ? null : cb.greaterThanOrEqualTo(root.get("price"), min);
}
// nameContains, isActive viết tương tự

Specification<Product> spec = Specification.allOf(
    nameContains(f.name()), inCategory(f.category()),
    priceAtLeast(f.minPrice()), isActive(f.active()));
Page<Product> page = repo.findAll(spec,
    PageRequest.of(0, 2, Sort.by("price").descending()));`,
              [
                ask("Thêm ô lọc thứ năm", ok("Thêm một method trả `Specification` và đưa vào `allOf`.")),
                ask("Người dùng chỉ điền một ô", ok("Câu SQL chỉ có đúng điều kiện của ô đó, mỗi tổ hợp một câu riêng.")),
                ask("Gõ sai tên thuộc tính `root.get(\"pirce\")`", bad("Chuỗi tên thuộc tính không được kiểm tra lúc khởi động, lỗi chỉ lộ ra khi query chạy. JPA Metamodel (`Product_.price`) hay Querydsl khắc phục chỗ này.")),
              ],
              "Mỗi tổ hợp ra đúng câu SQL nó cần, ghép thêm `Pageable` và `Sort` như repository thường.",
            ),
          ],
          after: [
            "Đã chạy trên Spring Boot 3.5.16, Spring Data JPA 3.5.13, Hibernate 6.6.53, PostgreSQL 16.14 (Testcontainers), bật `spring.jpa.show-sql=true`, 6 sản phẩm mẫu. Hai tổ hợp khác nhau ra hai câu SQL khác nhau:",
            "- **Tên \"phone\", còn bán**: `select ... from product p1_0 where lower(p1_0.name) like ? escape '' and p1_0.active=?`, tham số `%phone%` và `true`, ra `iPhone 15` và `Galaxy Phone S24` (\"Old Phone\" bị loại vì đã ngừng bán).",
            "- **Danh mục laptop, giá từ 1000**: `select ... from product p1_0 where p1_0.category=? and p1_0.price>=?`, ra `MacBook Air` (1199) và `ThinkPad X1` (1499).",
            "- **Không điền ô nào**: `select ... from product p1_0`, không có WHERE, ra cả 6 dòng.",
            "- **Còn bán, kèm `PageRequest.of(0, 2, Sort.by(\"price\").descending())`**: hai câu, `... where p1_0.active=? order by p1_0.price desc offset ? rows fetch first ? rows only` và `select count(p1_0.id) from product p1_0 where p1_0.active=?`; trang đầu là ThinkPad X1, MacBook Air, tổng 5 dòng, 3 trang. Câu đếm cũng mang đúng điều kiện của Specification.",
            "`Specification.where(...)` vẫn hay gặp trong ví dụ cũ, nhưng trong Spring Data JPA 3.5.13 nó đã bị đánh dấu `@Deprecated`; dùng `Specification.allOf(...)` hoặc `Specification.unrestricted().and(...)`.",
          ],
          takeaway: {
            lines: [
              "Nhiều bộ lọc tuỳ chọn: mỗi bộ lọc một `Specification` trả `null` khi trống, ghép bằng `allOf`/`and`, gọi `findAll(spec, pageable)`. Mỗi tổ hợp ra đúng câu SQL nó cần.",
            ],
          },
          trap: {
            title: "Bẫy: (:p is null or col = :p) có thể làm mất index",
            text: "Câu `@Query` kiểu này gửi xuống DB cùng một chuỗi SQL cho mọi tổ hợp: đã thấy Hibernate sinh `where (? is null or p1_0.category=?) and (? is null or p1_0.active=?)`. Để xem DB xử lý ra sao, đã chạy EXPLAIN bằng `PREPARE` trực tiếp trên PostgreSQL 16.14 (không qua Hibernate), bảng 200.000 dòng có index trên `category`. Khi DB lập kế hoạch theo giá trị cụ thể (custom plan), `'laptop' is null` được rút gọn thành false nên vẫn dùng `Bitmap Index Scan on ix_product_category`. Khi DB dùng một kế hoạch chung cho mọi giá trị (generic plan, ép bằng `plan_cache_mode = force_generic_plan`), câu này ra `Seq Scan on product`, `Filter: (($1 IS NULL) OR ((category)::text = $1))`, tức quét cả bảng, trong khi câu `category = $1` vẫn dùng index ngay cả với generic plan. Ở chế độ mặc định `auto`, 7 lần chạy liên tiếp trong thử nghiệm đều chọn custom plan, nên đây là rủi ro chứ không phải lúc nào cũng xảy ra. Mỗi DB cache kế hoạch theo cách riêng; với bảng lớn hãy EXPLAIN trên DB thật, hoặc dùng Specification để mỗi tổ hợp có câu SQL riêng.",
          },
          quiz: {
            question: "Trên PostgreSQL, vì sao `where ($1 is null or category = $1)` có thể quét cả bảng dù có index trên `category`?",
            options: [
              "Vì index không dùng được với tham số",
              "Vì khi dùng kế hoạch chung cho mọi giá trị, DB không biết `$1` có null hay không, nên chọn cách chạy đúng cho cả hai trường hợp: quét cả bảng và lọc",
              "Vì `is null` luôn khoá bảng",
              "Vì Hibernate xoá index khi gặp `is null`",
            ],
            answer: 1,
            explain: "Đã chạy EXPLAIN: generic plan ra `Seq Scan` với `Filter: (($1 IS NULL) OR ...)`, còn custom plan với giá trị cụ thể vẫn dùng index. Câu `category = $1` dùng index ở cả hai.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "JPA là specification, Hibernate là implementation sinh SQL, Spring Data JPA là lớp repository bên trên. Entity có bốn trạng thái: transient, managed, detached, removed; chỉ managed mới được dirty checking, và khi tắt OSIV thì entity thành detached ngay lúc transaction kết thúc. Persistence context là first-level cache sống theo transaction: em đo hai lần findById trong cùng transaction chỉ một query và cùng một instance. Khi load, Hibernate chụp snapshot; lúc flush so field và sinh UPDATE, nên sửa entity managed không cần gọi save. save gọi persist nếu entity mới, ngược lại gọi merge, mà merge trả về một bản managed khác nên phải dùng giá trị trả về; với id tự gán thì save còn SELECT trước. Flush chạy trước commit, trước query liên quan và khi gọi flush, nên bắt lỗi constraint quanh save thường không được, phải saveAndFlush.",
};
