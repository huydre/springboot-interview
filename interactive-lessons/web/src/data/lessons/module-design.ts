import type { Lesson } from "../types";

// The product module below was built and run as a scratch Spring Boot 3.5.16 app on Java 21 with H2 (MODE=PostgreSQL) and
// Flyway: one V1 migration (categories, products, unique SKU, CHECK, two composite indexes, soft delete, audit columns),
// entity + repository + mapper + service (@Transactional) + controller + @RestControllerAdvice with ProblemDetail.
// Five MockMvc tests passed (201 + Location, 400 field errors, 409 duplicate SKU, 404 category, soft delete hides row),
// and curl was run against the running app; the outputs quoted here are trimmed from those runs.
// The Mermaid sequence text is shown as a sketch to draw, it was not rendered here.
export const moduleDesign: Lesson = {
  slug: "module-design",
  crumb: "Thiết kế một module",
  videoDir: "/videos/module-design",
  videoVersion: "0",
  scenes: [],
  title: "Thiết kế một module từ DB tới framework: Quản lý sản phẩm",
  subtitle:
    "Làm rõ yêu cầu, thiết kế bảng và index, API và DTO, các lớp Spring, vẽ sequence diagram cho luồng tạo sản phẩm, rồi test và trả lời trong 2 phút.",
  openingQuiz: {
    question: "Được giao làm module Quản lý sản phẩm. Việc đầu tiên nên làm là gì?",
    options: [
      "Tạo ngay entity `Product` và bật `ddl-auto: update`",
      "Hỏi lại yêu cầu: ai dùng, những trường nào, lọc và sắp xếp theo gì, xoá là xoá hẳn hay ẩn, số lượng bản ghi khoảng bao nhiêu",
      "Viết controller trước để frontend có API gọi",
      "Chọn microservice hay monolith",
    ],
    answer: 1,
    explain:
      "Thiết kế DB và API phụ thuộc vào câu trả lời: cột nào cần index, xoá mềm hay cứng, SKU có duy nhất không. Hỏi trước 5 phút tiết kiệm cả tuần sửa schema.",
  },
  roadmap: [
    "Chặng 1: làm rõ yêu cầu, rồi thiết kế bảng products và categories (khoá, ràng buộc, index, soft delete, audit, Flyway).",
    "Chặng 2: API REST với DTO, validation, mã lỗi, phân trang; các lớp Spring và transaction đặt ở service.",
    "Chặng 3: vẽ sequence diagram cho luồng tạo sản phẩm, viết test, và cách kể lại cả module trong 2 phút.",
  ],
  sections: [
    {
      id: "requirements",
      title: "Phần 1: Làm rõ yêu cầu trước khi vẽ bảng",
      intro: [
        "Câu hỏi phỏng vấn: 'Làm module Quản lý sản phẩm từ thiết kế DB đến framework thế nào? Có vẽ sequence diagram không, thể hiện gì?'. Người hỏi không chờ một đoạn code. Họ muốn nghe **thứ tự suy nghĩ**: yêu cầu, dữ liệu, API, các lớp, luồng xử lý, test.",
        "Ứng viên yếu nhảy ngay vào `@Entity`. Ứng viên tốt nói 'trước tiên em hỏi lại vài điểm', vì mỗi câu trả lời đổi thẳng thiết kế:",
        "- **Ai dùng**: chỉ admin nội bộ, hay cả khách xem danh mục? Khách xem thì đọc nhiều hơn ghi rất nhiều, nghĩ tới cache và index.",
        "- **Trường bắt buộc**: SKU, tên, giá, tồn kho, danh mục. **SKU có duy nhất không?** Có thì cần `UNIQUE` ở DB.",
        "- **Lọc và sắp xếp theo gì**: theo danh mục, trạng thái, khoảng giá, mới nhất. Đây là đầu vào để chọn index.",
        "- **Xoá**: xoá hẳn hay ẩn đi? Sản phẩm đã nằm trong đơn hàng cũ thì không xoá hẳn được, nên thường là **soft delete**.",
        "- **Quy mô**: vài nghìn hay vài triệu sản phẩm? Quyết định offset hay cursor pagination, có cần tìm kiếm full text không.",
        "- **Ai sửa gì, cần lịch sử không**: cần audit thì thêm `created_by`, `updated_at`, có khi cả bảng lịch sử.",
        "Phạm vi bài này: CRUD sản phẩm thuộc một danh mục, SKU duy nhất, lọc theo danh mục, sắp xếp theo giá hoặc ngày tạo, xoá mềm.",
      ],
      cheat: [
        { name: "SKU duy nhất?", one: "Có thì thêm UNIQUE ở DB, không chỉ kiểm tra ở code", say: "Em hỏi SKU có duy nhất không, vì nếu có em đặt ràng buộc UNIQUE ở database, kiểm tra ở code chỉ để trả lỗi đẹp." },
        { name: "Lọc, sắp xếp theo gì?", one: "Quyết định index", say: "Em hỏi người dùng lọc và sắp xếp theo cột nào, vì index được chọn theo đúng các truy vấn đó." },
        { name: "Xoá hẳn hay ẩn?", one: "Đơn cũ còn tham chiếu thì soft delete", say: "Sản phẩm đã có trong đơn hàng thì không xoá hẳn, em dùng cờ deleted và lọc nó ra ở truy vấn." },
        { name: "Bao nhiêu bản ghi?", one: "Quyết định offset hay cursor, có cần search engine", say: "Vài nghìn bản ghi thì offset là đủ, vài triệu và cuộn vô tận thì em nghĩ tới cursor và có thể là Elasticsearch." },
      ],
      takeaway: {
        lines: ["Mỗi câu hỏi lại gắn với một quyết định thiết kế cụ thể: UNIQUE, index, soft delete, kiểu phân trang.", "Nói ra phạm vi đã chốt trước khi thiết kế, để người phỏng vấn biết em đang giải bài nào."],
      },
      trap: {
        title: "Hỏi cho có",
        text: "Đừng hỏi những câu không đổi được gì ('dùng màu gì cho nút'). Mỗi câu hỏi nên dẫn tới một lựa chọn trong schema hoặc API, và nói luôn câu trả lời đó sẽ đổi gì.",
      },
      quiz: {
        question: "Vì sao câu 'người dùng lọc và sắp xếp sản phẩm theo gì?' quan trọng khi thiết kế DB?",
        options: ["Vì nó quyết định tên bảng", "Vì index được chọn theo các truy vấn lọc và sắp xếp thực tế", "Vì nó quyết định dùng Java hay Kotlin", "Không quan trọng, index thêm sau là được"],
        answer: 1,
        explain: "Index phục vụ truy vấn. Biết trước WHERE và ORDER BY nào hay chạy thì chọn được index ghép đúng thứ tự cột ngay từ migration đầu tiên.",
      },
    },
    {
      id: "db-schema",
      title: "Phần 2: Thiết kế DB cho products và categories",
      intro: [
        "Ta đã có yêu cầu. Giờ biến nó thành bảng. Lý thuyết chuẩn hoá, khoá thay thế và expand/contract đã có ở bài **Schema, Constraint, Pool** (`db-design`), ở đây chỉ áp vào một module cụ thể.",
        "Quan hệ: một danh mục có nhiều sản phẩm, mỗi sản phẩm thuộc đúng một danh mục. Vậy `products.category_id` là khoá ngoại `NOT NULL` trỏ tới `categories.id`.",
        "- **Khoá chính**: `id BIGINT` tự tăng (khoá thay thế). SKU là khoá tự nhiên nhưng có thể đổi, nên để nó là `UNIQUE` chứ không làm khoá chính.",
        "- **Ràng buộc ở DB**: `NOT NULL`, `UNIQUE (sku)`, `CHECK (price >= 0)`, `CHECK (stock >= 0)`, khoá ngoại. Code có bug thì DB vẫn chặn dữ liệu sai.",
        "- **Tiền**: `NUMERIC(15,2)` ở DB và `BigDecimal` ở Java, không dùng `double`.",
        "- **Index cho cột lọc và sắp xếp**: truy vấn 'sản phẩm của danh mục X, mới nhất trước' dùng index ghép `(category_id, created_at)`; lọc theo trạng thái rồi sắp theo giá dùng `(status, price)`. Cột bằng (`=`) đứng trước, cột sắp xếp đứng sau.",
        "- **Soft delete**: cột `deleted BOOLEAN`, xoá là `UPDATE ... SET deleted = true`, mọi truy vấn đọc lọc `deleted = false`.",
        "- **Audit columns**: `created_at`, `updated_at` (thêm `created_by`, `updated_by` nếu có đăng nhập), cộng `version` cho optimistic locking.",
        "- **Flyway**: schema nằm trong file `V1__create_product_tables.sql`, chạy tự động khi app khởi động. JPA để `ddl-auto: validate`, chỉ kiểm tra entity khớp bảng chứ không tự sửa bảng.",
      ],
      board: {
        title: "ERD và migration của module sản phẩm",
        highlight: "products",
        chips: ["categories 1-n products", "UNIQUE sku", "index ghép", "deleted", "Flyway V1"],
        cards: [
          {
            title: "Một danh mục, nhiều sản phẩm",
            diagram: {
              kind: "hub",
              inputs: [{ label: "categories (id, name UNIQUE)" }, { label: "FK category_id NOT NULL" }, { label: "V1__create_product_tables.sql" }],
              center: "products",
              rulesTitle: "Mỗi bảng sản phẩm giữ",
              rules: ["`sku` UNIQUE, `price` và `stock` có CHECK", "`deleted` cho soft delete", "`version`, `created_at`, `updated_at`"],
            },
            code: `-- src/main/resources/db/migration/V1__create_product_tables.sql
CREATE TABLE categories (
  id    BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE products (
  id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  sku         VARCHAR(40)   NOT NULL,
  name        VARCHAR(200)  NOT NULL,
  price       NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  stock       INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  category_id BIGINT        NOT NULL REFERENCES categories(id),
  deleted     BOOLEAN       NOT NULL DEFAULT FALSE,
  version     BIGINT        NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL,
  updated_at  TIMESTAMP     NOT NULL,
  CONSTRAINT uk_products_sku UNIQUE (sku)
);
CREATE INDEX idx_products_category_created ON products (category_id, created_at);
CREATE INDEX idx_products_status_price     ON products (status, price);`,
            notes: [
              "Log khi app khởi động (H2, chạy thật): `Migrating schema \"PUBLIC\" to version \"1 - create product tables\"` rồi `Successfully applied 1 migration to schema \"PUBLIC\", now at version v1`.",
            ],
            takeaway: "Ràng buộc và index nằm trong migration, không phó mặc cho code",
          },
        ],
        conclusion: "**Kết luận:** mỗi quyết định ở Phần 1 thành một dòng SQL: SKU duy nhất thành UNIQUE, lọc theo danh mục thành index ghép, xoá mềm thành cột deleted.",
      },
      after: [
        "Ở entity, soft delete được ẩn bằng `@SQLRestriction(\"deleted = false\")` (Hibernate 6.3 trở lên) để mọi truy vấn qua entity đều tự thêm điều kiện. Audit dùng `@EnableJpaAuditing` cùng `@CreatedDate` và `@LastModifiedDate`.",
        "Một hệ quả của soft delete: `UNIQUE (sku)` vẫn tính cả dòng đã xoá, nên SKU của sản phẩm đã xoá không dùng lại được. Nếu nghiệp vụ cần dùng lại, PostgreSQL có partial unique index `CREATE UNIQUE INDEX ... ON products (sku) WHERE deleted = false`. Đây là câu nên hỏi lại nghiệp vụ.",
      ],
      takeaway: {
        lines: ["Khoá thay thế làm PK, khoá tự nhiên (SKU) làm UNIQUE.", "Index ghép theo truy vấn thật: cột so bằng trước, cột sắp xếp sau.", "Schema do Flyway quản lý, JPA chỉ `validate`."],
      },
      trap: {
        title: "ddl-auto: update trên production",
        text: "Để Hibernate tự sửa bảng thì không có lịch sử thay đổi, không review được, và nó không bao giờ xoá hay đổi kiểu cột cho đúng. Schema đi qua migration có version, entity chỉ được kiểm tra khớp.",
      },
      quiz: {
        question: "Truy vấn hay chạy nhất là `WHERE category_id = ? ORDER BY created_at DESC`. Index nào hợp nhất?",
        options: ["Index riêng trên `created_at`", "Index ghép `(category_id, created_at)`", "Index ghép `(created_at, category_id)`", "Không cần index vì đã có khoá ngoại"],
        answer: 1,
        explain:
          "Cột so bằng đứng trước để thu hẹp về một danh mục, trong đó các dòng đã xếp sẵn theo `created_at` nên không phải sort lại. Khoá ngoại không tự tạo index trong PostgreSQL.",
      },
    },
    {
      id: "api-design",
      title: "Phần 3: API, DTO, validation và mã lỗi",
      intro: [
        "Có bảng rồi, giờ là hợp đồng với client. Nguyên tắc REST, status code, ProblemDetail và DTO đã có ở bài **REST API Design** (`rest`). Phần này chỉ chốt API cho module sản phẩm.",
        "- `POST /api/v1/products`: tạo, trả `201 Created` kèm header `Location`.",
        "- `GET /api/v1/products?categoryId=1&page=0&size=20&sort=price,asc`: danh sách có lọc, phân trang, sắp xếp.",
        "- `GET /api/v1/products/{id}`, `PUT /api/v1/products/{id}`: xem và sửa một sản phẩm.",
        "- `DELETE /api/v1/products/{id}`: xoá mềm, trả `204 No Content`.",
        "**DTO tách khỏi entity**: request là `CreateProductRequest(sku, name, price, stock, categoryId)` có annotation validation; response là `ProductResponse` chỉ gồm trường client cần (tên danh mục thay vì cả object, không có `deleted` hay `version`).",
        "**Mã lỗi** thống nhất qua `ProblemDetail` cộng thêm trường `code` để client xử lý theo máy chứ không đọc chữ:",
        "- `400 VALIDATION_FAILED`: body sai, kèm `errors` theo từng trường.",
        "- `404 NOT_FOUND`: sản phẩm hoặc danh mục không tồn tại.",
        "- `409 DUPLICATE_SKU`: trùng SKU.",
        "**Phân trang**: nhận `Pageable` với mặc định `size=20, sort=createdAt DESC` và giới hạn `max-page-size: 100`, để client không xin một lần một triệu dòng.",
      ],
      board: {
        title: "Kết quả gọi API thật (curl, đã rút gọn)",
        highlight: "API",
        chips: ["201", "400", "409", "page"],
        cards: [
          {
            title: "Tạo thành công và lỗi validation",
            diagram: {
              kind: "flow",
              steps: ["POST /api/v1/products", "@Valid kiểm tra body", "Service kiểm tra SKU và danh mục"],
              ok: ["Hợp lệ", "201 + Location"],
              bad: ["Sai dữ liệu", "400 / 404 / 409 với code"],
            },
            code: `POST /api/v1/products  {"sku":"IP15-128","name":"iPhone 15 128GB","price":21990000,"stock":5,"categoryId":1}
HTTP/1.1 201
Location: /api/v1/products/1
{"id":1,"sku":"IP15-128","name":"iPhone 15 128GB","price":21990000,"stock":5,
 "status":"ACTIVE","category":"Điện thoại","createdAt":"2026-11-26T10:30:40.505014Z"}

POST /api/v1/products  {"sku":"","name":"x","price":-1,"categoryId":1}
HTTP/1.1 400
{"type":"about:blank","title":"Bad Request","status":400,"detail":"Validation failed",
 "instance":"/api/v1/products","code":"VALIDATION_FAILED",
 "errors":{"price":"must be greater than or equal to 0","sku":"must not be blank"}}

POST lại SKU IP15-128
HTTP/1.1 409
{"title":"Conflict","status":409,"detail":"SKU IP15-128 already exists","code":"DUPLICATE_SKU", ...}`,
            takeaway: "Client đọc `code` và `errors`, không phải đoán từ câu chữ",
          },
          {
            title: "Danh sách có lọc, phân trang, sắp xếp",
            diagram: { kind: "pipe", from: "?categoryId=1&page=0&size=1&sort=price,asc", via: "Pageable + Page<ProductResponse>", to: "content + page", skipped: ["entity", "deleted", "version"], skippedLabel: "Không lộ ra ngoài" },
            code: `GET /api/v1/products?categoryId=1&page=0&size=1&sort=price,asc
{"content":[{"id":3,"sku":"S24","name":"Galaxy S24","price":18990000.00,"stock":0,
  "status":"ACTIVE","category":"Điện thoại", ...}],
 "page":{"size":1,"number":0,"totalElements":2,"totalPages":2}}`,
            notes: [
              "Khối `page` có dạng này vì app bật `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`. Trả thẳng `PageImpl` thì Spring Data 3.3 trở lên ghi cảnh báo vì cấu trúc JSON đó không ổn định.",
              "Để ý: `price` lúc tạo là `21990000`, đọc từ DB là `18990000.00`. Response lúc tạo lấy từ object vừa save, chưa đọc lại từ DB. Muốn thống nhất thì `setScale(2)` trong mapper.",
            ],
            takeaway: "Trả DTO phân trang có cấu trúc cố định, giới hạn size tối đa",
          },
        ],
        conclusion: "**Kết luận:** API là hợp đồng: đường dẫn, DTO, mã lỗi và cách phân trang được chốt trước khi viết service.",
      },
      takeaway: {
        lines: ["Request DTO có validation, response DTO chỉ có trường client cần.", "Mọi lỗi cùng một dạng ProblemDetail với `code` riêng; 400 kèm lỗi theo trường."],
      },
      quiz: {
        question: "Vì sao không trả thẳng entity `Product` ra API?",
        options: [
          "Vì Jackson không serialize được entity",
          "Vì sẽ lộ trường nội bộ (deleted, version), dễ dính lazy loading, và đổi bảng là đổi luôn hợp đồng API",
          "Vì entity chậm hơn DTO",
          "Vì REST cấm dùng entity",
        ],
        answer: 1,
        explain: "DTO cắt hai thứ khỏi nhau: schema DB thay đổi theo nhu cầu lưu trữ, API thay đổi theo nhu cầu client. Trả entity thì hai thứ dính chặt và quan hệ lazy có thể ném lỗi khi serialize.",
      },
    },
    {
      id: "spring-layers",
      title: "Phần 4: Các lớp Spring và transaction ở service",
      intro: [
        "API đã chốt, giờ chia code thành lớp. Mỗi lớp có một việc, và câu hỏi hay gặp là 'transaction đặt ở đâu'.",
        "- **Controller** (`ProductController`): nhận HTTP, `@Valid` body, gọi service, trả status và header. Không có logic nghiệp vụ, không gọi repository.",
        "- **Service** (`ProductService`): luật nghiệp vụ (SKU không trùng, danh mục phải tồn tại), mở **transaction** bằng `@Transactional`. Đọc thì `@Transactional(readOnly = true)`.",
        "- **Repository** (`ProductRepository extends JpaRepository`): truy cập dữ liệu, `existsBySku`, `findByCategoryId(id, Pageable)` với `@EntityGraph` để nạp luôn danh mục, tránh N+1.",
        "- **Mapper** (`ProductMapper`): đổi request DTO thành entity và entity thành response DTO. Viết tay hoặc dùng MapStruct.",
        "- **Exception handler** (`@RestControllerAdvice`): đổi exception thành ProblemDetail với đúng status và `code`. Service chỉ ném `NotFound`, `DuplicateSku`, không biết gì về HTTP.",
        "Vì sao transaction ở **service** chứ không ở controller hay repository: một nghiệp vụ gồm nhiều bước (kiểm tra SKU, tìm danh mục, lưu) phải cùng thành công hoặc cùng huỷ. Repository chỉ thấy từng câu lệnh, controller thì không nên biết DB.",
      ],
      board: {
        title: "Code của service tạo sản phẩm (chạy thật)",
        highlight: "service",
        chips: ["controller", "service", "repository", "mapper", "advice"],
        cards: [
          {
            title: "Mỗi lớp một việc",
            diagram: { kind: "pipe", from: "ProductController", via: "ProductService @Transactional", to: "ProductRepository", skipped: ["HTTP trong service", "SQL trong controller"], skippedLabel: "Không trộn" },
            code: `@Service
public class ProductService {
  @Transactional
  public ProductResponse create(CreateProductRequest req) {
    if (products.existsBySku(req.sku()))
      throw new DuplicateSku("SKU " + req.sku() + " already exists");
    Category c = categories.findById(req.categoryId())
        .orElseThrow(() -> new NotFound("Category " + req.categoryId() + " not found"));
    Product saved = products.save(mapper.toEntity(req, c));
    return mapper.toResponse(saved);
  }

  @Transactional
  public void delete(Long id) {
    Product p = products.findById(id).orElseThrow(() -> new NotFound("Product " + id + " not found"));
    p.softDelete();            // deleted = true, dirty checking ghi UPDATE lúc commit
  }
}`,
            notes: ["`@RestControllerAdvice` bắt `DuplicateSku` thành `409 DUPLICATE_SKU`, `NotFound` thành `404 NOT_FOUND`, `MethodArgumentNotValidException` thành `400 VALIDATION_FAILED`."],
            takeaway: "Service giữ luật và transaction, advice giữ mapping lỗi sang HTTP",
          },
        ],
        conclusion: "**Kết luận:** controller mỏng, service có transaction, repository chỉ truy cập dữ liệu, lỗi được dịch ở một chỗ.",
      },
      drill: {
        choices: ["Controller", "Service", "Repository", "Mapper", "Exception handler"],
        items: [
          { q: "Kiểm tra SKU chưa tồn tại trước khi lưu", a: "Service", why: "Đây là luật nghiệp vụ, chạy trong transaction của nghiệp vụ tạo." },
          { q: "Đổi `DuplicateSku` thành HTTP 409 với `code: DUPLICATE_SKU`", a: "Exception handler", why: "Dịch lỗi sang HTTP ở một chỗ, service không phụ thuộc HTTP." },
          { q: "Trả `201 Created` và header `Location`", a: "Controller", why: "Status và header là chuyện của tầng web." },
          { q: "Truy vấn sản phẩm theo danh mục có phân trang, nạp luôn category", a: "Repository", why: "Truy cập dữ liệu, `findByCategoryId(id, Pageable)` với `@EntityGraph`." },
          { q: "Đổi `Product` thành `ProductResponse` với tên danh mục", a: "Mapper", why: "Chuyển đổi DTO và entity tách riêng để controller và service gọn." },
        ],
        summary: "Luật ở service, HTTP ở controller và advice, dữ liệu ở repository, chuyển đổi ở mapper.",
      },
      trap: {
        title: "Kiểm tra trùng SKU chỉ bằng code",
        text: "`existsBySku` rồi `save` không an toàn khi hai request cùng SKU tới cùng lúc: cả hai đều thấy 'chưa có'. Ràng buộc `UNIQUE (sku)` ở DB mới là chốt chặn cuối. Nên bắt thêm `DataIntegrityViolationException` và cũng trả 409.",
      },
      quiz: {
        question: "Vì sao `@Transactional` đặt ở service?",
        options: [
          "Vì Spring chỉ cho phép đặt ở service",
          "Vì một nghiệp vụ gồm nhiều bước truy cập dữ liệu cần cùng thành công hoặc cùng huỷ, và service là nơi biết ranh giới nghiệp vụ đó",
          "Vì đặt ở controller sẽ không compile",
          "Vì repository không có transaction",
        ],
        answer: 1,
        explain: "Repository của Spring Data có transaction riêng cho từng hàm, nhưng nghiệp vụ tạo sản phẩm gồm kiểm tra, tìm danh mục và lưu. Service gom chúng vào một transaction; controller thì không nên giữ kết nối DB.",
      },
    },
    {
      id: "sequence-diagram",
      title: "Phần 5: Sequence diagram cho luồng tạo sản phẩm",
      intro: [
        "Câu hỏi 'có vẽ sequence diagram không, thể hiện gì?' muốn biết em có mô tả được **ai gọi ai, theo thứ tự nào, và nhánh lỗi đi đâu**. ERD cho thấy dữ liệu đứng yên; sequence diagram cho thấy một request chạy qua hệ thống.",
        "Các thành phần của một sequence diagram:",
        "- **Participant**: mỗi cột dọc là một bên tham gia: Client, ProductController, ProductService, ProductRepository, Database.",
        "- **Message**: mũi tên ngang từ bên gọi sang bên nhận, theo thứ tự từ trên xuống. Mũi tên nét đứt là kết quả trả về.",
        "- **alt**: khung chia nhánh theo điều kiện, ví dụ `alt SKU đã tồn tại` trả 409, `else` đi tiếp. Mỗi nhánh lỗi quan trọng nên có một khung.",
        "- **Ghi chú** (note): đánh dấu chỗ bắt đầu và kết thúc transaction, chỗ gọi hệ thống ngoài.",
        "Không cần vẽ mọi endpoint. Vẽ cho luồng **phức tạp hoặc có rủi ro**: tạo sản phẩm (nhiều nhánh lỗi), cập nhật tồn kho đồng thời, luồng gọi service khác. CRUD đọc đơn giản thì không cần.",
      ],
      board: {
        title: "Luồng POST /api/v1/products từng bước",
        highlight: "sequence",
        chips: ["participant", "message", "alt", "transaction"],
        cards: [
          {
            title: "Nhánh chính và các nhánh lỗi",
            diagram: {
              kind: "flow",
              steps: [
                "1. Client gửi POST /api/v1/products",
                "2. Controller chạy @Valid trên body",
                "3. Service mở transaction, existsBySku(sku)",
                "4. Service tìm category theo id",
                "5. Repository INSERT, commit",
              ],
              ok: ["Mọi bước qua", "201 Created + Location + ProductResponse"],
              bad: ["alt: body sai / SKU trùng / không có danh mục", "400 / 409 / 404, rollback, không ghi gì"],
            },
            code: `sequenceDiagram
  participant C as Client
  participant Ctl as ProductController
  participant S as ProductService
  participant R as ProductRepository
  participant DB as Database
  C->>Ctl: POST /api/v1/products (JSON)
  alt body không hợp lệ
    Ctl-->>C: 400 VALIDATION_FAILED + errors
  else hợp lệ
    Ctl->>S: create(request)
    Note over S: bắt đầu @Transactional
    S->>R: existsBySku(sku)
    R->>DB: SELECT ... WHERE sku = ?
    alt SKU đã tồn tại
      S-->>Ctl: throw DuplicateSku
      Ctl-->>C: 409 DUPLICATE_SKU
    else chưa có
      S->>R: findById(categoryId)
      alt không có danh mục
        S-->>Ctl: throw NotFound
        Ctl-->>C: 404 NOT_FOUND
      else có
        S->>R: save(product)
        R->>DB: INSERT INTO products
        Note over S: commit
        S-->>Ctl: ProductResponse
        Ctl-->>C: 201 Created + Location
      end
    end
  end`,
            notes: ["Viết bằng cú pháp Mermaid `sequenceDiagram`, dán vào README hoặc wiki là ra hình. PlantUML cũng có `alt` / `else` / `end` tương tự."],
            takeaway: "Mỗi khung alt là một nhánh lỗi kèm mã lỗi trả về",
          },
        ],
        conclusion: "**Kết luận:** sequence diagram trả lời 'ai gọi ai, theo thứ tự nào, lỗi thì trả gì và transaction bao quanh đoạn nào'.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Client → Controller (@Valid) → Service (transaction: kiểm tra SKU, tìm danh mục) → Repository → DB → commit → 201.", "Mỗi nhánh lỗi thoát sớm, transaction rollback, trả 400 / 409 / 404."],
      },
      trap: {
        title: "Vẽ mà không có nhánh lỗi",
        text: "Một sequence diagram chỉ có đường thành công là sơ đồ vô dụng nhất: ai cũng đoán được nó. Giá trị nằm ở các khung `alt`: trùng SKU, sai dữ liệu, hệ thống ngoài chậm, và chỗ transaction bắt đầu, kết thúc.",
      },
      quiz: {
        question: "Trong sequence diagram, khung `alt` dùng để thể hiện gì?",
        options: ["Một vòng lặp", "Các nhánh theo điều kiện, ví dụ SKU trùng thì trả 409, ngược lại đi tiếp", "Một participant mới", "Thời gian chờ của database"],
        answer: 1,
        explain: "`alt` / `else` chia luồng theo điều kiện, giống if/else. Vòng lặp là `loop`, chạy song song là `par`.",
      },
    },
    {
      id: "test-and-answer",
      title: "Phần 6: Test module và cách trả lời trong 2 phút",
      intro: [
        "Module chưa xong nếu chưa có test cho đúng những gì đã thiết kế. Không cần test mọi getter; test **hợp đồng API và luật nghiệp vụ**:",
        "- **Tạo thành công**: `201`, header `Location` bắt đầu bằng `/api/v1/products/`, trả tên danh mục.",
        "- **Validation**: body sai trả `400`, `code` là `VALIDATION_FAILED`, `errors` có `sku` và `price`.",
        "- **Trùng SKU**: lần hai trả `409 DUPLICATE_SKU`.",
        "- **Danh mục không tồn tại**: `404 NOT_FOUND`.",
        "- **Soft delete**: tạo một sản phẩm, `totalElements` là 1; `DELETE` trả `204`; liệt kê lại thì `totalElements` là 0.",
        "Năm test này chạy bằng `@SpringBootTest` + `@AutoConfigureMockMvc` trên H2 với Flyway thật, kết quả: `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS`. Lớp test riêng (WebMvcTest, DataJpaTest, Testcontainers) đã có ở bài lab test.",
        "Khi trả lời phỏng vấn, kể theo đúng thứ tự của bài: **yêu cầu, DB, API, lớp, sequence diagram, test**. Mỗi bước một hai câu, nêu một quyết định cụ thể và lý do.",
      ],
      board: {
        title: "Test hợp đồng API",
        highlight: "test",
        chips: ["201", "400", "409", "404", "soft delete"],
        cards: [
          {
            title: "Một test cho soft delete",
            diagram: {
              kind: "flow",
              steps: ["POST tạo DEL-1", "GET: totalElements = 1", "DELETE theo Location: 204", "GET lại"],
              ok: ["totalElements = 0", "sản phẩm bị ẩn nhưng dòng vẫn còn"],
              bad: ["totalElements = 1", "quên lọc deleted"],
            },
            code: `@SpringBootTest @AutoConfigureMockMvc @Transactional
class ProductApiTest {
  @Test void softDeletedProductDisappearsFromList() throws Exception {
    String loc = mvc.perform(post("/api/v1/products").contentType(APPLICATION_JSON).content(body("DEL-1")))
        .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
    mvc.perform(get("/api/v1/products")).andExpect(jsonPath("$.page.totalElements").value(1));
    mvc.perform(delete(loc)).andExpect(status().isNoContent());
    mvc.perform(get("/api/v1/products")).andExpect(jsonPath("$.page.totalElements").value(0));
  }
}
// [INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`,
            notes: [
              "Lần chạy đầu một test hỏng vì kỳ vọng `Location: /api/v1/products/1` nhưng nhận `/api/v1/products/3`: rollback của test không trả lại số identity đã cấp. Không nên hard-code id trong test; lấy id từ `Location`.",
            ],
            takeaway: "Test đúng những luật đã thiết kế, không phụ thuộc id cụ thể",
          },
        ],
        conclusion: "**Kết luận:** mỗi mã lỗi trong bảng API có ít nhất một test, và soft delete được test bằng hành vi chứ không bằng cột.",
      },
      takeaway: {
        lines: ["Test theo hợp đồng: status, `code`, `errors`, `Location`, phân trang.", "Trả lời theo thứ tự yêu cầu, DB, API, lớp, sequence, test; mỗi bước một quyết định kèm lý do."],
      },
      quiz: {
        question: "Test soft delete nên kiểm tra điều gì?",
        options: [
          "Bảng products không còn dòng đó",
          "Sau DELETE, API danh sách không còn trả sản phẩm đó, dù dòng vẫn còn trong DB",
          "Cột version tăng lên",
          "Không cần test soft delete",
        ],
        answer: 1,
        explain: "Soft delete nghĩa là dòng còn trong DB nhưng mọi truy vấn đọc đều ẩn nó. Test qua API danh sách bắt được lỗi quên lọc `deleted`.",
      },
    },
  ],
  modelAnswer:
    "Em làm theo thứ tự. Đầu tiên em hỏi lại yêu cầu: SKU có duy nhất không, người dùng lọc và sắp xếp theo gì, xoá là xoá hẳn hay ẩn, khoảng bao nhiêu sản phẩm. Sau đó em thiết kế bảng categories và products, quan hệ một nhiều, khoá chính tự tăng, SKU là UNIQUE, giá NUMERIC có CHECK không âm, index ghép category_id với created_at cho truy vấn hay chạy nhất, cột deleted cho soft delete và các cột created_at, updated_at, version. Schema em viết bằng Flyway, JPA chỉ để validate. Tiếp theo em chốt API: POST trả 201 kèm Location, GET có phân trang lọc sắp xếp và giới hạn size, DELETE xoá mềm trả 204, request và response là DTO riêng, lỗi trả ProblemDetail có code như VALIDATION_FAILED, DUPLICATE_SKU. Về code em chia controller, service, repository, mapper và một RestControllerAdvice, transaction đặt ở service vì một nghiệp vụ gồm nhiều bước. Với luồng tạo sản phẩm em vẽ sequence diagram từ client qua controller, service, repository tới database, có các khung alt cho nhánh dữ liệu sai, trùng SKU, không có danh mục, và đánh dấu chỗ transaction bắt đầu và commit. Cuối cùng em viết test MockMvc cho từng mã lỗi và cho soft delete.",
  cards: [
    { q: "Câu hỏi lại nào ảnh hưởng trực tiếp tới schema?", a: "SKU có duy nhất không (UNIQUE), lọc và sắp xếp theo gì (index), xoá hẳn hay ẩn (soft delete), quy mô (kiểu phân trang)." },
    { q: "Vì sao SKU là UNIQUE chứ không làm khoá chính?", a: "SKU là khoá tự nhiên, có thể đổi. Khoá chính dùng id tự tăng ổn định, SKU giữ ràng buộc UNIQUE." },
    { q: "Index cho `WHERE category_id = ? ORDER BY created_at DESC`?", a: "Index ghép `(category_id, created_at)`: cột so bằng trước, cột sắp xếp sau, khỏi sort lại." },
    { q: "Soft delete làm thế nào trong JPA?", a: "Cột `deleted`, xoá là đặt `deleted = true`, entity có `@SQLRestriction(\"deleted = false\")` để mọi truy vấn qua entity tự lọc." },
    { q: "Vì sao dùng Flyway thay `ddl-auto: update`?", a: "Migration có version, review được, chạy giống nhau ở mọi môi trường. JPA chỉ `validate` khớp bảng." },
    { q: "Các mã lỗi của API tạo sản phẩm?", a: "400 VALIDATION_FAILED kèm errors theo trường, 404 NOT_FOUND cho danh mục, 409 DUPLICATE_SKU." },
    { q: "Transaction đặt ở đâu, vì sao?", a: "Ở service, vì một nghiệp vụ gồm nhiều bước truy cập dữ liệu phải cùng thành công hoặc cùng huỷ." },
    { q: "Kiểm tra trùng SKU bằng `existsBySku` có đủ không?", a: "Không, hai request đồng thời đều qua được. UNIQUE ở DB là chốt cuối, bắt `DataIntegrityViolationException` để trả 409." },
    { q: "Sequence diagram gồm những gì?", a: "Participant (cột), message (mũi tên theo thứ tự), alt/else cho nhánh điều kiện, note cho transaction hoặc gọi ngoài." },
    { q: "Vẽ sequence diagram cho luồng nào?", a: "Luồng phức tạp hoặc rủi ro: tạo có nhiều nhánh lỗi, cập nhật đồng thời, gọi service khác. CRUD đọc đơn giản thì không cần." },
  ],
};
