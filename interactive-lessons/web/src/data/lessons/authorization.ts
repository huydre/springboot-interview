import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Verified in a scratch Spring Boot 3.5.16 app (Spring Security 6.5, H2, JdbcTemplate) on JDK 21 with 9 MockMvc tests:
// the RBAC schema below was run as schema.sql; allowed, 403 for a missing authority, 403 for ABAC (other branch, wrong status),
// hasRole vs hasAuthority prefixes, RoleHierarchy, the data scope in a query, and a token that keeps a revoked role.
// Caching and JWT-vs-DB trade-offs are explained, not measured.
export const authorization: Lesson = {
  slug: "authorization",
  crumb: "Phân quyền RBAC & ABAC",
  videoDir: "/videos/authorization",
  videoVersion: "0",
  scenes: [],
  title: "Phân quyền: RBAC, ABAC và thiết kế bảng dữ liệu",
  subtitle:
    "Authentication khác authorization, các mô hình ACL, RBAC, ABAC, ReBAC, schema users, roles, permissions, role hierarchy và multi-tenant, policy theo thuộc tính, @PreAuthorize với hasAuthority và PermissionEvaluator, quyền trong JWT hay trong DB, lọc theo data scope để chặn IDOR, token giữ quyền cũ, và cách trả lời phỏng vấn.",
  openingQuiz: {
    question: "Nhân viên chi nhánh A có quyền `order:update`. Hệ thống chỉ kiểm tra quyền này rồi cho sửa đơn có id do client gửi. Điều gì có thể xảy ra?",
    options: [
      "Không sao, vì đã đủ quyền `order:update`",
      "Họ sửa được cả đơn của chi nhánh B: quyền đúng nhưng thiếu kiểm tra đơn nào thuộc phạm vi của họ",
      "Họ không sửa được đơn nào",
      "Hệ thống tự lọc theo chi nhánh",
    ],
    answer: 1,
    explain: "RBAC trả lời \"được làm hành động gì\", không trả lời \"trên bản ghi nào\". Muốn giới hạn theo chi nhánh hay trạng thái phải thêm điều kiện theo thuộc tính (ABAC) hoặc lọc theo data scope. Bài này đi qua cả hai (Phần 3 và 5).",
  },
  roadmap: [
    "Chặng 1: authentication khác authorization; ACL, RBAC, ABAC, ReBAC; thiết kế bảng users, roles, permissions và role hierarchy.",
    "Chặng 2: ABAC theo thuộc tính, khi nào chọn RBAC, ABAC hay kết hợp; cài trong Spring Security bằng hasAuthority, SpEL và PermissionEvaluator.",
    "Chặng 3: quyền trong JWT hay đọc DB, data scope và IDOR, token giữ quyền cũ, audit; cách trả lời phỏng vấn.",
  ],
  sections: [
    {
      id: "authz-models",
      title: "Phần 1: Authentication, authorization và các mô hình phân quyền",
      intro: [
        "Câu hỏi quen thuộc nhưng hay bị trả lời lẫn: hai khái niệm này khác nhau ở đâu, và có những cách nào để quyết định \"ai được làm gì\"?",
        "- **Authentication (xác thực)**: bạn là ai. Kết quả là một danh tính (user, service). Sai thì trả `401`.",
        "- **Authorization (phân quyền)**: danh tính đó được làm gì, trên cái gì. Đã biết là ai nhưng không đủ quyền thì trả `403`.",
        "Bài Spring Security đã đi qua filter chain và 401 với 403. Bài này tập trung vào câu hỏi thứ hai: **mô hình** nào để biểu diễn quyền, và lưu nó trong bảng dữ liệu ra sao.",
        "Bốn mô hình hay được nhắc, xếp từ đơn giản tới linh hoạt:",
        "- **ACL (Access Control List)**: mỗi đối tượng giữ danh sách ai được làm gì với nó, ví dụ file X: alice đọc, bob ghi. Rất mịn nhưng nhân lên theo số đối tượng nên khó quản lý, hợp với file hay tài liệu.",
        "- **RBAC (Role-Based)**: gán quyền cho **role**, gán role cho user. User đổi việc thì đổi role, không sửa từng quyền. Phổ biến nhất, dễ audit.",
        "- **ABAC (Attribute-Based)**: quyết định bằng một **policy** nhìn vào thuộc tính của user, của bản ghi, của hành động và của ngữ cảnh (giờ, IP). Linh hoạt nhất nhưng khó đọc và khó kiểm toán hơn.",
        "- **ReBAC (Relationship-Based)**: quyền suy ra từ **quan hệ** trong một đồ thị, ví dụ \"bạn là owner của thư mục chứa file này\". Kiểu chia sẻ của Google Drive; Zanzibar của Google là hệ thống nổi tiếng theo hướng này.",
        "Đừng xem chúng là bốn lựa chọn loại trừ nhau. Hệ thống thật thường là RBAC cho phần lớn và thêm vài điều kiện theo thuộc tính, ở Phần 3 ta sẽ thấy cách kết hợp.",
      ],
      cheat: [
        { name: "Authentication", one: "Bạn là ai; sai thì 401", say: "Authentication xác định danh tính, thất bại trả 401." },
        { name: "Authorization", one: "Bạn được làm gì, trên cái gì; thiếu quyền thì 403", say: "Authorization quyết định danh tính đã biết có được làm hành động đó không, thiếu quyền trả 403." },
        { name: "RBAC", one: "User có role, role có permission", say: "RBAC gán quyền cho role và role cho user, nên đổi quyền một nhóm người chỉ cần sửa ở role." },
        { name: "ABAC", one: "Policy trên thuộc tính user, resource, action, context", say: "ABAC quyết định bằng policy dựa trên thuộc tính, ví dụ cùng chi nhánh và trạng thái DRAFT, linh hoạt hơn RBAC nhưng khó audit hơn." },
        { name: "ReBAC", one: "Quyền suy ra từ quan hệ giữa các đối tượng", say: "ReBAC dùng đồ thị quan hệ như owner, member, viewer, hợp với chia sẻ kiểu Google Drive." },
      ],
      takeaway: {
        lines: [
          "Authentication là \"ai\", authorization là \"được làm gì trên cái gì\". Hai bước, hai mã lỗi 401 và 403.",
          "RBAC đơn giản và dễ kiểm toán, ABAC mịn hơn nhưng phức tạp hơn. Hệ thống thật thường kết hợp.",
        ],
      },
      quiz: {
        question: "Quyền \"chỉ chủ file và người được chủ file chia sẻ mới mở được\", chia sẻ theo thư mục cha, thuộc mô hình nào rõ nhất?",
        options: ["RBAC", "ReBAC (quan hệ owner, thư mục cha, viewer)", "Chỉ cần authentication", "Không mô hình nào"],
        answer: 1,
        explain: "Quyền suy ra từ quan hệ giữa user và đối tượng (chủ, thư mục cha, người được chia sẻ) là ReBAC. RBAC chỉ nói user có role gì, không biết file nào của ai.",
      },
    },
    {
      id: "rbac-schema",
      title: "Phần 2: RBAC và thiết kế bảng dữ liệu",
      intro: [
        "\"Thiết kế bảng để quản lý phân quyền\" là câu hỏi thiết kế phổ biến nhất của chủ đề này. Câu trả lời chuẩn là năm bảng.",
        "- **`users`**: người dùng.",
        "- **`roles`**: tập quyền có tên, như `TELLER`, `AUDITOR`, `ADMIN`.",
        "- **`permissions`**: quyền mịn dạng `tài nguyên:hành động`, như `order:read`, `order:update`.",
        "- **`user_roles`**: bảng nối nhiều-nhiều giữa user và role.",
        "- **`role_permissions`**: bảng nối nhiều-nhiều giữa role và permission.",
        "Quyền thực sự của một user là hợp của các permission của mọi role người đó có. Một câu JOIN qua ba bảng cho ra danh sách đó, và danh sách này chính là các `GrantedAuthority` của Spring Security.",
        "**Vì sao tách permission khỏi role?** Nếu code viết `hasRole('TELLER') or hasRole('ADMIN')` ở khắp nơi thì thêm một role `SUPERVISOR` cũng được xem đơn là phải sửa và deploy lại mọi chỗ. Khi code chỉ hỏi `hasAuthority('order:read')`, thêm role mới chỉ là thêm dòng vào `role_permissions` mà không đụng code. Role là nhóm để quản trị, permission mới là thứ code kiểm tra.",
        "Câu DDL bên dưới đã chạy thật trên H2 (Spring Boot 3.5.16, `schema.sql`), kèm dữ liệu mẫu: user `an` có role `TELLER`, user `chi` có role `AUDITOR`. Đọc quyền của hai người bằng câu JOIN ra:",
        "- **an**: `[ROLE_TELLER, order:read, order:update]`",
        "- **chi**: `[ROLE_AUDITOR, audit:view, order:read]`",
      ],
      board: {
        title: "Năm bảng RBAC và câu JOIN ra authority",
        highlight: "Năm bảng",
        chips: ["users", "roles", "permissions", "user_roles", "role_permissions"],
        cards: [
          {
            title: "Từ user tới danh sách quyền",
            diagram: {
              kind: "hub",
              inputs: [{ label: "users" }, { label: "user_roles" }, { label: "roles" }, { label: "role_permissions" }],
              center: "permissions",
              rulesTitle: "Quy tắc thiết kế",
              rules: [
                "Hai bảng nối đều có khoá chính kép, không thể gán trùng",
                "Code kiểm tra permission, không kiểm tra tên role",
                "Thêm role mới chỉ là thêm dòng dữ liệu",
              ],
            },
            notes: ["Đây là schema đã chạy trên H2. `permissions.code` là chuỗi `tài nguyên:hành động`, chính là chuỗi truyền vào `hasAuthority(...)`."],
            code: `CREATE TABLE users (
  id        BIGINT PRIMARY KEY,
  username  VARCHAR(50) NOT NULL UNIQUE,
  branch_id BIGINT NOT NULL
);
CREATE TABLE roles (
  id   BIGINT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE permissions (
  id   BIGINT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE   -- order:read, order:update
);
CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id),
  role_id BIGINT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
CREATE TABLE role_permissions (
  role_id       BIGINT NOT NULL REFERENCES roles(id),
  permission_id BIGINT NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- quyền của một user
SELECT DISTINCT p.code
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p       ON p.id = rp.permission_id
 WHERE ur.user_id = ?;`,
            takeaway: "Năm bảng, quyền thật là hợp các permission của mọi role",
          },
        ],
        conclusion: "**Kết luận:** user có role, role có permission, code kiểm tra permission. Tách ba tầng này để đổi chính sách bằng dữ liệu thay vì deploy lại.",
      },
      predict: {
        question: "Công ty thêm role `SUPERVISOR` cũng được xem đơn. Code chỉ kiểm tra `hasAuthority('order:read')`. Cần làm gì?",
        options: [
          "Sửa mọi `@PreAuthorize` rồi deploy",
          "Tạo role `SUPERVISOR`, thêm dòng vào `role_permissions` cho `order:read`, gán role cho người dùng",
          "Cho `SUPERVISOR` tên giống `ADMIN`",
          "Không làm được",
        ],
        answer: 1,
        explain: "Code hỏi permission chứ không hỏi tên role, nên chỉ cần thay đổi dữ liệu ở `roles`, `role_permissions` và `user_roles`.",
      },
      cheat: [
        { name: "Bảng nối", one: "user_roles và role_permissions, khoá chính kép", say: "Quan hệ nhiều-nhiều giữa user và role, role và permission nằm ở hai bảng nối với khoá chính kép để không gán trùng." },
        { name: "Permission mịn", one: "tài nguyên:hành động, như order:update", say: "Permission đặt theo dạng tài nguyên và hành động, code kiểm tra đúng chuỗi đó." },
        { name: "Tách role khỏi permission", one: "Đổi chính sách bằng dữ liệu, không deploy", say: "Tách permission khỏi role để thêm hay đổi role chỉ là sửa dữ liệu mà không đụng code." },
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Code kiểm tra permission, không kiểm tra role → thêm hay sửa role chỉ là đổi dữ liệu trong `role_permissions` → không phải deploy lại."],
      },
      trap: {
        title: "Hard-code tên role khắp code",
        text: "Viết `hasRole('TELLER') or hasRole('ADMIN')` ở mỗi method. Mỗi lần doanh nghiệp đổi ai được làm gì là phải sửa code ở nhiều chỗ và deploy. Gom về permission, để role chỉ là nhóm trong dữ liệu.",
      },
      quiz: {
        question: "Vì sao cần bảng `role_permissions` thay vì ghi cứng \"role nào gọi được method nào\" trong code?",
        options: [
          "Để SQL chạy nhanh hơn",
          "Để đổi ai được làm gì bằng dữ liệu, không phải sửa code và deploy lại",
          "Vì Spring Security bắt buộc",
          "Để giảm số bảng",
        ],
        answer: 1,
        explain: "Quyền gắn vào role qua dữ liệu thì admin thay đổi được lúc chạy. Ghi cứng trong code thì mỗi thay đổi chính sách là một lần deploy.",
      },
      parts: [
        {
          id: "role-hierarchy-tenant",
          title: "Role hierarchy và phân quyền theo tổ chức (tenant)",
          intro: [
            "Hai nhu cầu hay đến sau khi có năm bảng.",
            "**Role hierarchy (phân cấp role)**: `ADMIN` nên làm được mọi thứ `TELLER` làm, và `TELLER` làm được mọi thứ nhân viên thường làm. Cách ngây thơ là gán đủ quyền cho từng role. Spring Security có `RoleHierarchy`: khai báo `ROLE_ADMIN > ROLE_TELLER > ROLE_STAFF`, và ai có role trên thì tự có role dưới khi kiểm tra bằng `hasRole`.",
            "Đã chạy trong test: user chỉ có `ROLE_ADMIN` gọi method `hasRole('STAFF')` thì qua (200), còn user chỉ có `ROLE_AUDITOR` bị 403. Hierarchy được gắn vào `MethodSecurityExpressionHandler` (đã chạy với `hasRole`). Trong bảng ta vẫn nên lưu quan hệ rõ ràng (ví dụ cột `parent_role_id`) nếu muốn admin chỉnh được lúc chạy.",
            "**Phân quyền theo tổ chức (multi-tenant)**: cùng một role nhưng chỉ trong phạm vi một chi nhánh hay công ty. Hai cách thiết kế:",
            "- **Role gắn với user trong một phạm vi**: thêm cột `org_id` (hay `branch_id`) vào `user_roles`, khoá chính thành `(user_id, role_id, org_id)`. An là `TELLER` ở chi nhánh 10, nhưng chỉ là `AUDITOR` ở chi nhánh 20.",
            "- **Mọi bản ghi nghiệp vụ mang `tenant_id`**: và mọi truy vấn đều kèm điều kiện đó (Phần 5). Đây là chốt chặn cuối, vì bảng quyền sai thì dữ liệu vẫn không lộ sang tenant khác.",
            "Hai cách này bổ sung cho nhau: cách đầu quyết định \"được làm gì ở đâu\", cách sau bảo đảm dữ liệu không lẫn.",
          ],
          widgetTitle: "Gán role phẳng và gán role theo phạm vi",
          compare: [
            way(
              "Role toàn cục",
              `-- user_roles(user_id, role_id)
INSERT INTO user_roles VALUES (1, 1);   -- an là TELLER`,
              [
                ask("An là teller ở chi nhánh 10 nhưng chỉ xem được ở chi nhánh 20", bad("Không biểu diễn được: role áp dụng cho mọi chi nhánh.")),
                ask("Thêm chi nhánh mới", ok("Không cần sửa quyền, nhưng mọi teller đều thấy chi nhánh mới.")),
              ],
              "Đơn giản, đủ cho hệ thống một tổ chức.",
            ),
            way(
              "Role theo phạm vi",
              `-- user_roles(user_id, role_id, branch_id)
INSERT INTO user_roles VALUES (1, 1, 10);  -- TELLER ở chi nhánh 10
INSERT INTO user_roles VALUES (1, 2, 20);  -- AUDITOR ở chi nhánh 20`,
              [
                ask("An là teller ở chi nhánh 10 nhưng chỉ xem được ở chi nhánh 20", ok("Hai dòng với hai `branch_id`, đúng ý.")),
                ask("Kiểm tra quyền", bad("Câu kiểm tra phải mang theo chi nhánh của bản ghi, nên phức tạp hơn.")),
              ],
              "Cần khi một người có vai trò khác nhau ở các tổ chức khác nhau.",
            ),
          ],
          takeaway: {
            lines: ["Hierarchy tránh gán lặp quyền cho role cấp cao. Với multi-tenant, thêm phạm vi vào bảng nối và luôn kèm `tenant_id` trong truy vấn."],
          },
          quiz: {
            question: "User cần là `TELLER` ở chi nhánh 10 và `AUDITOR` ở chi nhánh 20. Thiết kế nào phù hợp?",
            options: [
              "Hai tài khoản riêng",
              "Thêm cột phạm vi (`branch_id`) vào `user_roles` để mỗi dòng nói role áp dụng ở đâu",
              "Gán `ADMIN` cho chắc",
              "Không thể làm bằng RBAC",
            ],
            answer: 1,
            explain: "Role theo phạm vi: bảng nối mang thêm chi nhánh nên cùng một người có role khác nhau ở các nơi khác nhau.",
          },
        },
      ],
    },
    {
      id: "abac",
      title: "Phần 3: ABAC và chọn mô hình",
      intro: [
        "RBAC trả lời \"hành động nào\", nhưng nhiều luật thật còn phụ thuộc vào **bản ghi cụ thể**. Ví dụ: \"nhân viên chỉ sửa được đơn của chi nhánh mình, và chỉ khi đơn còn ở trạng thái DRAFT\". Đừng cố nhồi nó vào role (sẽ cần một role cho mỗi chi nhánh nhân với mỗi trạng thái, số role bùng nổ).",
        "ABAC giải quyết bằng một **policy**: hàm trả về cho phép hay từ chối, dựa trên bốn nhóm thuộc tính:",
        "- **Subject (user)**: chi nhánh, phòng ban, cấp bậc.",
        "- **Resource (bản ghi)**: chi nhánh sở hữu, trạng thái, số tiền, chủ sở hữu.",
        "- **Action**: đọc, sửa, duyệt, xoá.",
        "- **Context**: giờ, địa chỉ IP, thiết bị.",
        "Luật ví dụ viết lại là: `user.branch == order.branch AND order.status == DRAFT`. Có thể thêm điều kiện số tiền, ví dụ đơn trên 100 triệu cần cấp trên.",
        "Đã chạy: user `an` (chi nhánh 10, có `order:update`) sửa đơn 100 (chi nhánh 10, DRAFT) thì qua. Sửa đơn 200 (chi nhánh 20, DRAFT) bị `403`. Sửa đơn 101 (chi nhánh 10, **APPROVED**) cũng bị `403`. Permission đúng mà thuộc tính không khớp vẫn bị từ chối.",
        "ABAC mạnh nhưng có giá: policy phân tán trong code, khó trả lời \"ai đang có quyền gì\" khi audit, và mỗi quyết định có thể cần truy vấn thêm dữ liệu (như đọc đơn để lấy trạng thái).",
      ],
      predict: {
        question: "An có `order:update` và thuộc chi nhánh 10. Đơn 200 thuộc chi nhánh 20, trạng thái DRAFT. An gọi sửa đơn 200. Kết quả với luật `cùng chi nhánh AND DRAFT`?",
        options: ["Qua, vì có `order:update`", "403, vì chi nhánh không khớp", "401", "404"],
        answer: 1,
        explain: "Đã chạy: bị 403. Có permission là điều kiện cần (RBAC), thuộc tính khớp là điều kiện đủ (ABAC). Hai lớp kiểm tra nối nhau bằng `and`.",
      },
      drill: {
        choices: ["RBAC", "ABAC", "ReBAC", "Kết hợp RBAC và ABAC"],
        items: [
          { q: "Ứng dụng nội bộ: nhân viên, quản lý, admin, mỗi nhóm có danh sách chức năng cố định", a: "RBAC", why: "Quyền gắn vào vai trò, không phụ thuộc bản ghi. Đơn giản và dễ audit." },
          { q: "Teller chỉ sửa đơn của chi nhánh mình khi còn DRAFT", a: "Kết hợp RBAC và ABAC", why: "RBAC cho `order:update`, ABAC cho điều kiện chi nhánh và trạng thái. Không cần role mỗi chi nhánh." },
          { q: "Tài liệu chia sẻ: chủ thư mục cho người khác xem, quyền kế thừa xuống file con", a: "ReBAC", why: "Quyền suy ra từ quan hệ owner, thư mục cha, viewer." },
          { q: "Chỉ cho phép chuyển khoản lớn trong giờ hành chính, từ mạng công ty", a: "ABAC", why: "Quyết định dựa trên ngữ cảnh (giờ, IP) và số tiền, không phải role." },
        ],
        summary: "Bắt đầu bằng RBAC. Thêm điều kiện theo thuộc tính ở đúng chỗ cần. Quan hệ phức tạp thì nghĩ tới ReBAC.",
      },
      takeaway: {
        lines: [
          "RBAC: được làm hành động gì. ABAC: hành động đó trên bản ghi này, lúc này có được không.",
          "Cách thực dụng: RBAC cho phần lớn, ABAC cho một số ít luật phụ thuộc dữ liệu.",
        ],
      },
      quiz: {
        question: "Vì sao không tạo một role cho mỗi chi nhánh để giải bài toán \"sửa đơn của chi nhánh mình\"?",
        options: [
          "Spring không cho phép",
          "Số role bùng nổ theo số chi nhánh (và nhân với trạng thái, hành động), khó quản lý. Thuộc tính chi nhánh nên được so trực tiếp",
          "Role không lưu được vào database",
          "Vì role chỉ có tối đa 10",
        ],
        answer: 1,
        explain: "Thuộc tính như chi nhánh có hàng chục giá trị. Biến mỗi giá trị thành một role gây bùng nổ. So `user.branch == order.branch` là một dòng luật.",
      },
      parts: [
        {
          id: "choose-model",
          title: "Khi nào chọn RBAC, ABAC, hay kết hợp",
          intro: [
            "Cách chọn thực dụng dựa trên việc luật của bạn có phụ thuộc vào **dữ liệu cụ thể** hay không.",
            "- **RBAC thuần**: quyền chỉ phụ thuộc \"bạn là ai trong tổ chức\". Ít luật, ít thay đổi, cần audit dễ (ai có quyền gì chỉ là một câu truy vấn).",
            "- **ABAC thuần**: quyền phụ thuộc mạnh vào thuộc tính và ngữ cảnh, thay đổi theo chính sách. Hợp hệ thống lớn có đội governance riêng, thường dùng bộ máy chính sách riêng (OPA, Cedar, XACML) thay vì code rải rác.",
            "- **Kết hợp** (phổ biến nhất): RBAC làm cổng ngoài (`hasAuthority('order:update')`), ABAC kiểm tra thêm thuộc tính trên bản ghi. Quyền tối thiểu rõ ràng, luật theo dữ liệu gói gọn ở một chỗ.",
            "Quy tắc nghề: nếu thấy mình sắp tạo role có tên chứa giá trị của dữ liệu (như `TELLER_BRANCH_10`), đó là dấu hiệu cần chuyển sang thuộc tính.",
          ],
          widgetTitle: "Cùng yêu cầu, hai cách xử lý",
          compare: [
            way(
              "Mọi thứ là role",
              `-- TELLER_BRANCH_10, TELLER_BRANCH_20, ...
@PreAuthorize("hasRole('TELLER_BRANCH_10')")
public int updateAmount(long id, long amount) { ... }`,
              [
                ask("Mở chi nhánh thứ 21", bad("Thêm role mới, gán permission, sửa code hoặc cấu hình.")),
                ask("Thêm luật \"chỉ khi DRAFT\"", bad("Không biểu diễn được bằng role, vì trạng thái đổi theo từng bản ghi.")),
              ],
              "Role bùng nổ, và vẫn không xử lý được trạng thái.",
            ),
            way(
              "RBAC cộng ABAC",
              `@PreAuthorize("hasAuthority('order:update') and @orderAbac.canEdit(authentication, #id)")
public int updateAmount(long id, long amount) { ... }`,
              [
                ask("Mở chi nhánh thứ 21", ok("Không đổi gì: luật so `branch_id` của user với đơn.")),
                ask("Thêm luật \"chỉ khi DRAFT\"", ok("Sửa một chỗ: method `canEdit`.")),
              ],
              "Số role không đổi, luật theo dữ liệu nằm ở một nơi test được.",
            ),
          ],
          takeaway: {
            lines: ["RBAC làm cổng \"được làm hành động gì\", ABAC kiểm tra \"trên bản ghi này\". Role có tên chứa giá trị dữ liệu là dấu hiệu nên chuyển sang thuộc tính."],
          },
          quiz: {
            question: "Hệ thống chỉ có ba nhóm người dùng với danh sách chức năng cố định, ít thay đổi. Nên chọn gì?",
            options: ["ABAC với policy engine riêng", "RBAC, vì đơn giản và dễ audit", "ReBAC", "Không cần phân quyền"],
            answer: 1,
            explain: "Nhu cầu đơn giản thì RBAC là đủ và rẻ nhất để duy trì. Đừng dùng ABAC hay policy engine khi chưa có luật phụ thuộc dữ liệu.",
          },
        },
      ],
    },
    {
      id: "spring-authz",
      title: "Phần 4: Cài đặt trong Spring Security",
      intro: [
        "Bốn mảnh ghép: lấy quyền của user thành authority, kiểm tra quyền ở method, thêm điều kiện theo thuộc tính, và quyết định quyền đến từ đâu mỗi request.",
        "Bật method security bằng `@EnableMethodSecurity` rồi đặt `@PreAuthorize` lên method của service. Kiểm tra permission mịn bằng `hasAuthority('order:read')` (so đúng chuỗi). Bài Spring Security đã giải thích chi tiết `hasRole` với `hasAuthority`; ở đây chỉ nhắc lại kết quả đã chạy trong app của bài này:",
        "- **Lưu `ROLE_ADMIN`**: `hasRole('ADMIN')` qua, `hasAuthority('ROLE_ADMIN')` qua, `hasAuthority('ADMIN')` bị 403.",
        "- **Lưu `ADMIN` (không có tiền tố)**: `hasRole('ADMIN')` bị 403, `hasAuthority('ADMIN')` qua.",
        "Với schema ở Phần 2, `authoritiesOf(userId)` trả `ROLE_<tên role>` cho mỗi role và một authority cho mỗi permission. Role dùng để quản trị và hierarchy, permission dùng để kiểm tra.",
        "Mọi `@PreAuthorize` ở bài này chạy trên một `Authentication` mà test dựng từ dữ liệu của DB, nên kết quả `403` trong các test bên dưới là kết quả của Spring Security thật, qua `MockMvc`.",
      ],
      cheat: [
        { name: "hasAuthority('order:read')", one: "So đúng chuỗi authority", say: "hasAuthority so đúng chuỗi, nên hợp để kiểm tra permission mịn." },
        { name: "hasRole('ADMIN')", one: "Tự thêm ROLE_ nên tìm ROLE_ADMIN", say: "hasRole tự thêm tiền tố ROLE_, nên lưu authority thiếu tiền tố này sẽ không khớp." },
        { name: "@EnableMethodSecurity", one: "Bật @PreAuthorize và @PostAuthorize", say: "Method security phải được bật bằng @EnableMethodSecurity thì @PreAuthorize mới có tác dụng." },
      ],
      takeaway: {
        lines: [
          "Permission mịn dùng `hasAuthority`, role thô dùng `hasRole` (nhớ tiền tố `ROLE_`).",
          "Đặt `@PreAuthorize` ở service để mọi nơi gọi đều qua kiểm tra, không chỉ controller.",
        ],
      },
      quiz: {
        question: "Authority lưu là `ADMIN`. `@PreAuthorize(\"hasRole('ADMIN')\")` cho kết quả gì?",
        options: ["Qua", "403, vì `hasRole` tìm `ROLE_ADMIN`", "401", "Lỗi lúc khởi động"],
        answer: 1,
        explain: "Đã chạy: authority `ADMIN` với `hasRole('ADMIN')` bị 403, còn `hasAuthority('ADMIN')` thì qua.",
      },
      parts: [
        {
          id: "abac-in-spring",
          title: "ABAC trong Spring: bean SpEL và PermissionEvaluator",
          intro: [
            "Hai cách gói luật theo thuộc tính, cả hai đã chạy trong test của bài này.",
            "**Bean SpEL**: viết một bean có method trả `boolean`, gọi từ biểu thức bằng `@tên`. SpEL nhìn thấy `authentication` và tham số method (`#id`, cần biên dịch với `-parameters`, mặc định của Spring Boot Maven parent đã có):",
            "**PermissionEvaluator**: cơ chế chuẩn của Spring cho `hasPermission(#id, 'Order', 'update')`. Bạn viết một class implement `PermissionEvaluator`, đăng ký vào `MethodSecurityExpressionHandler`, và biểu thức đọc như tiếng Anh. Hợp khi có nhiều loại đối tượng dùng chung một chỗ ra quyết định.",
            "Đã chạy: bean `orderAbac` đọc `branch_id` và `status` của đơn từ DB và so với `AppUser` (principal). Cả đường bean (`/orders/{id}/amount`) lẫn đường evaluator (`/v2/orders/{id}/amount`) cho kết quả giống nhau: đơn 200 của chi nhánh khác bị `403`, đơn 100 cùng chi nhánh qua.",
            "Lưu ý: mỗi lần kiểm tra ABAC có thể đọc DB một lần để lấy thuộc tính bản ghi. Nếu method cũng đọc bản ghi thì là hai lần truy vấn; chấp nhận được với thao tác ghi, nhưng đáng cân nhắc ở endpoint đọc nhiều (Phần 5 có cách gộp vào chính câu truy vấn).",
          ],
          widgetTitle: "Hai cách đặt luật ABAC",
          compare: [
            way(
              "Bean SpEL",
              `@Component("orderAbac")
public class OrderAbac {
  public boolean canEdit(Authentication auth, long orderId) {
    var u = (AppUser) auth.getPrincipal();
    var o = jdbc.queryForMap("SELECT branch_id, status FROM orders WHERE id = ?", orderId);
    return ((Number) o.get("BRANCH_ID")).longValue() == u.branchId()
        && "DRAFT".equals(o.get("STATUS"));
  }
}

@PreAuthorize("hasAuthority('order:update') and @orderAbac.canEdit(authentication, #id)")
public int updateAmount(long id, long amount) { ... }`,
              [
                ask("Đơn 200 của chi nhánh khác", ok("403, thân method không chạy.")),
                ask("Đơn 101 đã APPROVED", ok("403: luật trạng thái chặn.")),
                ask("Thêm luật thứ hai", ok("Thêm một method vào bean, gọi từ biểu thức.")),
              ],
              "Đơn giản, đủ cho đa số dự án. Biểu thức tự gọi bean theo tên.",
            ),
            way(
              "PermissionEvaluator",
              `@Bean static MethodSecurityExpressionHandler handler(PermissionEvaluator ev) {
  var h = new DefaultMethodSecurityExpressionHandler();
  h.setPermissionEvaluator(ev);
  return h;
}

@PreAuthorize("hasPermission(#id, 'Order', 'update')")
public int updateAmountViaEvaluator(long id, long amount) { ... }`,
              [
                ask("Đơn 200 của chi nhánh khác", ok("403, cùng kết quả với cách bean.")),
                ask("Thêm loại đối tượng thứ hai (hồ sơ khách)", ok("Thêm một nhánh `type` trong `hasPermission(...)`, không đổi biểu thức ở nơi dùng.")),
                ask("Người đọc code mới", bad("Phải biết có evaluator đăng ký ở đâu; chuỗi `'Order'` và `'update'` là chuỗi tự do, gõ sai thì luôn bị từ chối.")),
              ],
              "Chuẩn, gọn khi có nhiều loại đối tượng; đổi lại có một lớp gián tiếp.",
            ),
          ],
          takeaway: {
            lines: ["Luật ABAC gói vào một bean hoặc `PermissionEvaluator` để test và sửa một chỗ. Kết quả đã chạy giống nhau ở cả hai cách."],
          },
          quiz: {
            question: "Biểu thức `hasPermission(#id, 'Order', 'update')` cần thêm gì để hoạt động?",
            options: [
              "Chỉ `@EnableMethodSecurity`",
              "Một `PermissionEvaluator` được đăng ký vào `MethodSecurityExpressionHandler`",
              "Một bảng `acl` bắt buộc",
              "Không cần gì, Spring tự đoán",
            ],
            answer: 1,
            explain: "`hasPermission` chuyển cho `PermissionEvaluator`. Mặc định evaluator từ chối tất cả, nên phải đăng ký evaluator của bạn.",
          },
        },
        {
          id: "jwt-vs-db",
          title: "Quyền nằm trong JWT hay đọc DB mỗi request",
          senior: true,
          intro: [
            "Câu hỏi senior kinh điển: authority của user lấy ở đâu mỗi request?",
            "- **Nhét vào JWT lúc phát hành**: resource server chỉ cần verify chữ ký, không chạm DB. Nhanh, stateless, scale ngang dễ. Nhược điểm: quyền bị **đóng băng** tới khi token hết hạn. Thu hồi role không có hiệu lực ngay (Phần 5), và token to nếu có nhiều quyền.",
            "- **JWT chỉ chứa danh tính (user id), quyền đọc từ DB mỗi request**: luôn đúng nhất, thu hồi có hiệu lực ngay, nhưng mỗi request tốn một lần truy vấn (có thể 2 JOIN).",
            "- **Lai: đọc từ cache có TTL ngắn hoặc có vô hiệu theo sự kiện**: giữ ưu điểm của cả hai. Khoá cache theo `userId`, giá trị là tập authority. Khi admin đổi role thì xoá khoá đó (hoặc tăng một số phiên bản `authz_version` trong token để biết token đã cũ). Phần này mô tả hướng đi, không phải thứ đã chạy trong bài.",
            "Cách quyết định: token sống ngắn (vài phút) với quyền trong token thường chấp nhận được khi việc thu hồi không cần tức thì. Khi cần thu hồi ngay (nhân viên nghỉ việc, lộ tài khoản) thì phải có cơ chế kiểm tra ở phía server (cache có vô hiệu, hoặc danh sách thu hồi).",
          ],
          widgetTitle: "Chọn nơi lấy quyền",
          compare: [
            way(
              "Quyền trong JWT",
              `// lúc phát hành token
claims.put("authorities", perms.authoritiesOf(userId));
// mỗi request: chỉ verify chữ ký, đọc claim`,
              [
                ask("Số truy vấn DB cho quyền mỗi request", ok("Không có.")),
                ask("Admin thu hồi role của một user", bad("Token cũ vẫn mang quyền cũ tới khi hết hạn (đã chạy ở Phần 5).")),
                ask("User có 200 quyền", bad("Token phình to, header lớn.")),
              ],
              "Nhanh và stateless, đổi lại quyền bị đóng băng theo thời hạn token.",
            ),
            way(
              "Đọc DB (hoặc cache) mỗi request",
              `// JWT chỉ có sub (user id)
var authorities = permissionService.authoritiesOf(userId); // DB hoặc cache theo userId`,
              [
                ask("Số truy vấn DB cho quyền mỗi request", bad("Một lần, trừ khi có cache.")),
                ask("Admin thu hồi role của một user", ok("Có hiệu lực ở request kế tiếp (đã chạy ở Phần 5), nếu cache được xoá khi đổi role.")),
                ask("User có 200 quyền", ok("Token vẫn nhỏ.")),
              ],
              "Đúng và thu hồi tức thì, đổi lại tải DB hoặc độ phức tạp của cache.",
            ),
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Quyền trong token → không cần DB nhưng bị đóng băng → thu hồi chậm. Quyền đọc từ DB hoặc cache → đúng ngay → phải trả bằng tải hoặc vô hiệu cache khi đổi role."],
          },
          quiz: {
            question: "Vì sao cache quyền theo `userId` cần xoá khoá khi admin đổi role của người đó?",
            options: [
              "Để tiết kiệm bộ nhớ",
              "Nếu không, cache giữ quyền cũ tới khi hết TTL, giống như token đóng băng",
              "Vì Redis bắt buộc",
              "Không cần xoá",
            ],
            answer: 1,
            explain: "Cache chỉ là một bản sao của DB. Đổi role mà không vô hiệu cache thì phần tin cậy rơi về đúng chỗ đã bỏ token: quyền cũ tồn tại đến khi hết TTL.",
          },
        },
      ],
    },
    {
      id: "data-scope-idor",
      title: "Phần 5: Data scope, IDOR và quyền cũ sau khi thu hồi",
      senior: true,
      intro: [
        "Bài web-vulns đã nói IDOR là lỗi thiếu kiểm tra quyền theo từng object. Ở đây đi sâu hơn: **chốt chặn nên nằm ở đâu**, và có những kiểu quyền cũ nào còn sót.",
        "**Data scope** là phạm vi dữ liệu user được thấy (chi nhánh, tenant, chính mình). Cách chắc nhất là đặt phạm vi vào **chính câu truy vấn**: `WHERE id = ? AND branch_id = ?`. Khi đó đơn của chi nhánh khác đơn giản là không tồn tại với người gọi, thay vì tồn tại nhưng bị chặn ở một chỗ nào đó trên đường đi.",
        "Đã chạy: user `an` (chi nhánh 10) có `order:read`.",
        "- **Chỉ kiểm tra RBAC** (`GET /orders/200`): trả `200`, đọc được đơn của chi nhánh 20. Đây chính là IDOR.",
        "- **Truy vấn có phạm vi** (`GET /my/orders/200`): trả `404`, đơn 200 không tồn tại với an. `GET /my/orders/100` trả `200`.",
        "Kiểm tra ở controller dễ bị bỏ sót: một endpoint mới, một job nội bộ, một service khác gọi thẳng repository là vòng qua. Đặt phạm vi trong truy vấn (hoặc ở tầng repository, hoặc dùng tính năng như row-level security của PostgreSQL) thì mọi đường đi đều bị ràng buộc.",
        "Trả `404` thay vì `403` còn có lợi nhỏ: không lộ việc id đó có tồn tại, nên kẻ dò không đếm được số đơn.",
      ],
      predict: {
        question: "Endpoint `GET /orders/{id}` chỉ có `@PreAuthorize(\"hasAuthority('order:read')\")`. An (chi nhánh 10) đọc đơn 200 của chi nhánh 20. Kết quả?",
        options: ["403", "404", "200, đọc được đơn của chi nhánh khác", "401"],
        answer: 2,
        explain: "Đã chạy: trả 200. Có `order:read` là đủ với RBAC, và không có điều kiện nào về chi nhánh, nên đây là IDOR. Chỉ khi thêm phạm vi vào truy vấn mới ra 404.",
      },
      widgetTitle: "Chặn ở controller hay ở truy vấn",
      compare: [
        way(
          "Chỉ chặn ở một tầng ngoài",
          `@GetMapping("/orders/{id}")
Map<String,Object> get(@PathVariable long id) {
  return orders.find(id);   // SELECT ... WHERE id = ?
}`,
          [
            ask("Id của chi nhánh khác", bad("Đọc được (200): thiếu điều kiện chi nhánh.")),
            ask("Thêm endpoint thứ hai gọi cùng `find`", bad("Phải nhớ kiểm tra lại, quên một chỗ là lỗ hổng.")),
          ],
          "Mọi đường đi phải tự nhớ kiểm tra: mong manh.",
        ),
        way(
          "Phạm vi nằm trong truy vấn",
          `Map<String,Object> findInMyBranch(long id, long branchId) {
  // SELECT ... WHERE id = ? AND branch_id = ?
  // không có dòng nào -> NoSuchElementException -> 404
}`,
          [
            ask("Id của chi nhánh khác", ok("404: với người gọi, đơn không tồn tại.")),
            ask("Thêm endpoint thứ hai gọi cùng method", ok("Tự được lọc, vì phạm vi nằm trong truy vấn.")),
          ],
          "Phạm vi đi theo dữ liệu, không phụ thuộc người viết endpoint nhớ hay quên.",
        ),
      ],
      takeaway: {
        lines: [
          "RBAC nói \"được đọc đơn\", data scope nói \"đơn nào\". Hai thứ phải có cả hai.",
          "Đặt phạm vi vào truy vấn để mọi đường vào đều bị ràng buộc, không chỉ controller.",
        ],
      },
      trap: {
        title: "Tin vào id khó đoán hoặc chỉ ẩn nút trên giao diện",
        text: "UUID khó đoán chỉ làm việc dò chậm hơn, không thay cho kiểm tra quyền. Ẩn nút ở frontend không ngăn ai gọi thẳng API. Quyền luôn phải được kiểm tra ở server, trên từng bản ghi.",
      },
      quiz: {
        question: "Vì sao đặt điều kiện chi nhánh vào chính câu truy vấn an toàn hơn kiểm tra ở controller?",
        options: [
          "Vì SQL luôn nhanh hơn Java",
          "Vì mọi đường gọi tới truy vấn đó (endpoint mới, job, service khác) đều tự bị ràng buộc",
          "Vì controller không kiểm tra quyền được",
          "Vì database tự biết chi nhánh",
        ],
        answer: 1,
        explain: "Kiểm tra rải ở nhiều nơi dễ bị quên ở một nơi. Phạm vi trong truy vấn đi theo dữ liệu nên không có đường vòng.",
      },
      parts: [
        {
          id: "stale-token",
          title: "Token vẫn mang quyền cũ sau khi thu hồi",
          senior: true,
          intro: [
            "Tình huống: lúc 9:00 binh được cấp role `TELLER` và đăng nhập, nhận token mang quyền `order:update`. Lúc 9:05 admin gỡ role của binh. Binh còn gọi sửa đơn được không?",
            "Đã chạy với schema ở Phần 2. Test dựng một `Authentication` lúc \"đăng nhập\" từ DB, đóng băng nó (giống token JWT chứa quyền), rồi `DELETE FROM user_roles` của binh:",
            "- **Authentication đã đóng băng**: vẫn có `[ROLE_TELLER, order:read, order:update]`, và gọi `PUT /orders/200/amount` vẫn trả **200**.",
            "- **Quyền đọc lại từ DB**: `perms.authoritiesOf(2)` trả `[]`, và cùng request đó trả **403**.",
            "Đây là rủi ro thật, không phải lý thuyết: nhân viên bị cho nghỉ việc nhưng token vẫn dùng được tới khi hết hạn. Giảm thiểu:",
            "- **Access token sống ngắn** (vài phút) cùng refresh token. Lần làm mới tiếp theo đọc lại quyền từ DB.",
            "- **Kiểm tra phía server cho thao tác nhạy cảm**: tra lại quyền hoặc trạng thái tài khoản với chuyển tiền, đổi mật khẩu, xuất dữ liệu.",
            "- **Danh sách thu hồi hoặc phiên bản quyền** (`authz_version` trong token so với giá trị hiện tại trong cache): thu hồi có hiệu lực ngay, đổi lại phải có thêm một lần tra cứu nhỏ.",
            "Bài OAuth2 nói về việc xoay và thu hồi refresh token cho phiên đăng nhập; đây là chuyện tương tự nhưng cho **quyền**.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Quyền nằm trong token → thu hồi ở DB không ảnh hưởng token đã phát → còn dùng được tới khi hết hạn → dùng token ngắn hạn, hoặc kiểm tra phía server cho thao tác nhạy cảm."],
          },
          quiz: {
            question: "Admin vừa gỡ role của một nhân viên. Hệ thống đặt quyền trong JWT sống 1 giờ. Điều gì đúng?",
            options: [
              "Nhân viên mất quyền ngay",
              "Token đã phát vẫn mang quyền cũ nên còn tác dụng tới khi hết hạn, trừ khi có cơ chế kiểm tra phía server",
              "Spring Security tự đọc lại DB",
              "Token tự bị thu hồi",
            ],
            answer: 1,
            explain: "Đã chạy: authentication đóng băng vẫn qua (200), còn quyền đọc lại từ DB là rỗng nên cùng request bị 403. Token tự mang quyền thì không biết DB đã đổi.",
          },
        },
        {
          id: "audit",
          title: "Audit: ghi lại ai đã làm gì và vì sao được cho phép",
          senior: true,
          intro: [
            "Phân quyền không chỉ là chặn hay cho qua. Với hệ thống tài chính, bạn còn phải trả lời sau này: **ai** đã làm **gì**, trên **bản ghi nào**, **khi nào**, và **quyết định** là cho phép hay từ chối.",
            "Hai loại bản ghi hay gộp lẫn nhưng khác mục đích:",
            "- **Audit thay đổi quyền**: ai cấp hay gỡ role nào cho ai, khi nào. Ghi vào bảng `role_audit` (chỉ thêm, không sửa, không xoá) cùng lúc với thay đổi trong `user_roles`, trong một transaction.",
            "- **Audit truy cập**: ai đọc hay sửa gì, và các lần bị từ chối (403). Lần bị từ chối là tín hiệu để phát hiện dò quyền hay IDOR.",
            "Nội dung nên có: user id, hành động, id đối tượng, kết quả, thời điểm, và nếu được thì lý do (permission nào cho phép, hoặc luật ABAC nào từ chối). Không ghi dữ liệu nhạy cảm như mật khẩu hay toàn bộ thân request.",
            "Một lợi thế của RBAC với bảng rõ ràng: câu hỏi \"những ai có `order:update`\" là một câu SELECT. Với ABAC rải rác trong code, trả lời câu này phải đọc code, vì vậy cần thêm log cho các quyết định.",
          ],
          takeaway: {
            lines: ["Ghi lại cả thay đổi quyền lẫn truy cập, đặc biệt những lần bị từ chối. Bảng audit chỉ thêm, không sửa."],
          },
          quiz: {
            question: "Vì sao nên ghi cả những lần truy cập bị từ chối (403) vào audit?",
            options: [
              "Để tăng dung lượng log",
              "Chuỗi lần bị từ chối là dấu hiệu dò quyền hay khai thác IDOR, giúp phát hiện sớm",
              "Vì luật bắt buộc ghi mọi request",
              "Không cần ghi lần bị từ chối",
            ],
            answer: 1,
            explain: "Một user bị từ chối liên tiếp trên nhiều id khác nhau là mẫu hình của dò quyền. Chỉ ghi lần thành công thì sẽ bỏ sót tín hiệu này.",
          },
        },
      ],
    },
    {
      id: "interview-drill",
      title: "Phần 6: Trả lời phỏng vấn và chọn mô hình",
      intro: [
        "Khi bị hỏi \"RBAC khác ABAC thế nào, thiết kế bảng ra sao\", khung trả lời gọn gồm bốn ý theo thứ tự:",
        "- **Định nghĩa ngắn**: RBAC gán quyền qua role, ABAC quyết định theo thuộc tính của user, bản ghi, hành động, ngữ cảnh.",
        "- **Schema**: năm bảng `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, code kiểm tra permission chứ không kiểm tra role.",
        "- **Giới hạn của RBAC và cách bổ sung**: luật phụ thuộc bản ghi (chi nhánh, trạng thái) thì thêm ABAC ở một chỗ, đặt phạm vi dữ liệu vào truy vấn.",
        "- **Điểm senior**: quyền nằm trong JWT thì bị đóng băng, thu hồi cần token ngắn hạn hoặc kiểm tra phía server; audit cả lần bị từ chối.",
        "Tránh hai lỗi hay gặp: đồng nhất \"phân quyền\" với \"đăng nhập\", và chỉ nói tên mô hình mà không nói được bảng nào, kiểm tra ở đâu.",
      ],
      drill: {
        choices: ["Thêm permission mới", "Thêm điều kiện ABAC", "Đặt phạm vi vào truy vấn", "Rút ngắn token hoặc kiểm tra phía server"],
        items: [
          { q: "Cho phép role SUPERVISOR được duyệt đơn", a: "Thêm permission mới", why: "Thêm `order:approve` vào `permissions`, gán cho role trong `role_permissions`. Không đổi luật theo dữ liệu." },
          { q: "Chỉ cho sửa đơn còn DRAFT của chi nhánh mình", a: "Thêm điều kiện ABAC", why: "Luật phụ thuộc thuộc tính của bản ghi, gói vào bean hoặc PermissionEvaluator." },
          { q: "Teller chi nhánh 10 không được thấy đơn chi nhánh 20 qua endpoint đọc", a: "Đặt phạm vi vào truy vấn", why: "Đưa `branch_id` vào WHERE, đơn của chi nhánh khác khi đó không tồn tại với người gọi." },
          { q: "Nhân viên nghỉ việc nhưng token cũ còn hạn một giờ", a: "Rút ngắn token hoặc kiểm tra phía server", why: "Quyền trong token bị đóng băng; token ngắn hạn hoặc tra lại phía server cho thao tác nhạy cảm." },
        ],
        summary: "Thêm quyền thì sửa dữ liệu, luật theo bản ghi thì ABAC, chặn lộ dữ liệu thì phạm vi trong truy vấn, thu hồi tức thì thì kiểm tra phía server.",
      },
      takeaway: {
        lines: ["Trả lời theo thứ tự: định nghĩa, schema năm bảng, giới hạn của RBAC, điểm senior về thu hồi và audit."],
      },
      quiz: {
        question: "Nói gì thể hiện hiểu biết hơn khi được hỏi \"thiết kế bảng phân quyền\"?",
        options: [
          "\"Một bảng users có cột role\"",
          "Năm bảng nối nhiều-nhiều, code kiểm tra permission, và luật theo bản ghi xử lý bằng ABAC cùng phạm vi trong truy vấn",
          "\"Dùng JWT là đủ\"",
          "\"Hard-code trong controller\"",
        ],
        answer: 1,
        explain: "Một cột role chỉ cho một role cố định, không nhiều-nhiều. Câu trả lời tốt nêu schema, nơi kiểm tra, và cách xử lý luật phụ thuộc dữ liệu.",
      },
    },
  ],
  modelAnswer:
    "Em phân biệt authentication là xác định bạn là ai, còn authorization là bạn được làm gì trên cái gì. RBAC gán quyền cho role rồi gán role cho user, em thiết kế năm bảng: users, roles, permissions, user_roles và role_permissions, trong đó code chỉ kiểm tra permission như order:update chứ không kiểm tra tên role, nên thêm role mới chỉ là đổi dữ liệu. RBAC không đủ khi luật phụ thuộc vào bản ghi, ví dụ chỉ sửa đơn của chi nhánh mình khi còn DRAFT. Em thêm ABAC: một bean SpEL hay PermissionEvaluator so thuộc tính của user với của bản ghi, nối bằng and sau hasAuthority. Em có chạy thử trong Spring Boot: đúng quyền nhưng đơn của chi nhánh khác thì ra 403. Với đọc dữ liệu, em đặt điều kiện chi nhánh vào chính câu truy vấn để chặn IDOR ở mọi đường vào. Về quyền trong JWT thì nó bị đóng băng: em đã thử xoá role mà token cũ vẫn qua, nên dùng access token ngắn hạn, hoặc đọc quyền từ cache có xoá khi đổi role, và ghi audit cả những lần bị từ chối.",
  cards: [
    { q: "Authentication khác authorization?", a: "Authentication là bạn là ai (sai thì 401). Authorization là bạn được làm gì trên cái gì (thiếu quyền thì 403)." },
    { q: "RBAC là gì?", a: "Gán quyền cho role, gán role cho user. Đổi quyền một nhóm chỉ cần sửa ở role." },
    { q: "ABAC là gì?", a: "Quyết định bằng policy trên thuộc tính của user, bản ghi, hành động và ngữ cảnh." },
    { q: "ReBAC là gì?", a: "Quyền suy ra từ quan hệ giữa các đối tượng (owner, thư mục cha, viewer), như chia sẻ kiểu Google Drive." },
    { q: "Schema RBAC chuẩn gồm những bảng nào?", a: "users, roles, permissions, user_roles, role_permissions. Hai bảng nối có khoá chính kép." },
    { q: "Vì sao code nên kiểm tra permission, không kiểm tra tên role?", a: "Thêm hay đổi role chỉ là sửa dữ liệu, không phải sửa code và deploy lại." },
    { q: "hasRole('ADMIN') khác hasAuthority('ADMIN')?", a: "hasRole tự thêm tiền tố ROLE_ nên tìm ROLE_ADMIN. hasAuthority so đúng chuỗi." },
    { q: "ABAC trong Spring cài bằng gì?", a: "Bean SpEL gọi bằng @tên trong @PreAuthorize, hoặc PermissionEvaluator cho hasPermission(...)." },
    { q: "Quyền trong JWT có nhược điểm gì?", a: "Bị đóng băng tới khi token hết hạn: thu hồi role không có hiệu lực ngay." },
    { q: "Chặn IDOR chắc nhất ở đâu?", a: "Đặt phạm vi dữ liệu (chi nhánh, owner) vào chính câu truy vấn để mọi đường vào đều bị ràng buộc." },
    { q: "Role có tên chứa giá trị dữ liệu như TELLER_BRANCH_10 cho thấy điều gì?", a: "Nên chuyển sang thuộc tính (ABAC), vì số role bùng nổ theo giá trị dữ liệu." },
  ],
};
