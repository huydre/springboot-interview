import type { Lesson } from "../types";

// Three real interviews rewritten as question lists with short answer outlines. Everything is anonymised on purpose:
// no company, person or project names, no salary figures, and no judgement of any individual. The questions are
// paraphrased, not transcribed. Answer outlines are general interview guidance; the linked lessons hold the verified detail.
export const realInterviews: Lesson = {
  slug: "real-interviews",
  crumb: "Đề phỏng vấn thật",
  videoDir: "/videos/real-interviews",
  videoVersion: "0",
  scenes: [],
  title: "Đề phỏng vấn thật: ba buổi, câu hỏi, và chỗ hay bị hụt",
  subtitle:
    "Ba buổi phỏng vấn backend có thật, đã ẩn danh: một buổi junior ở công ty giáo dục công nghệ, một buổi kỹ thuật vòng 1 ở tập đoàn viễn thông, một buổi onsite ở ngân hàng. Mỗi câu kèm dàn ý trả lời ngắn và bài nên học, rồi bài học chung về việc ghi CV đúng mức.",
  openingQuiz: {
    question: "Người phỏng vấn hỏi sâu vào một kỹ năng bạn ghi trong CV nhưng thực ra chỉ chạm qua. Cách trả lời an toàn nhất là gì?",
    options: [
      "Trả lời chung chung cho qua câu hỏi",
      "Nói đúng phạm vi đã làm, rồi nêu cách bạn sẽ tìm hiểu phần còn lại",
      "Nói là phần đó người khác làm",
      "Đoán một đáp án nghe hợp lý",
    ],
    answer: 1,
    explain:
      "Người phỏng vấn đánh giá cả sự trung thực. Nói rõ \"em viết producer, phần consumer em chưa làm\" rồi trình bày hiểu biết lý thuyết thì được tin hơn là né tránh hay đoán (Phần 5).",
  },
  roadmap: [
    "Chặng 1: ba buổi phỏng vấn và cách dùng bài này.",
    "Chặng 2: câu hỏi của buổi junior và buổi vòng 1 kỹ thuật, kèm dàn ý trả lời.",
    "Chặng 3: câu hỏi onsite ở ngân hàng, rồi bài học chung về ghi CV đúng mức.",
  ],
  sections: [
    {
      id: "overview",
      title: "Phần 1: Ba buổi phỏng vấn và cách dùng bài này",
      intro: [
        "Đọc danh sách câu hỏi là cách nhanh nhất để biết người ta thật sự hỏi gì. Bài này gom câu hỏi từ ba buổi phỏng vấn backend có thật, viết lại ngắn gọn và đã ẩn danh: không tên công ty, không tên người, không con số lương.",
        "Mỗi câu có hai phần: **dàn ý trả lời** (bấm để mở) và **bài nên học** để hiểu sâu. Dàn ý là hướng trả lời chung cho phỏng vấn, không phải đáp án duy nhất. Hãy tự trả lời thành tiếng trước, rồi mới mở dàn ý để đối chiếu.",
        "Bấm từng dòng để xem điểm nổi bật của mỗi buổi.",
      ],
      widgetTitle: "Ba buổi, ba kiểu câu hỏi",
      cheat: [
        { name: "Buổi A: công ty giáo dục công nghệ, junior", one: "Kiến thức nền: message queue, database, Redis, đồng thuận. Có một bài thiết kế nhỏ.", say: "Người phỏng vấn đi từ dự án của ứng viên, hỏi sâu từng công nghệ được nhắc. Cần hiểu bản chất của queue, index và cache." },
        { name: "Buổi B: tập đoàn viễn thông, mảng AI, vòng 1 kỹ thuật", one: "Rộng: truy cập dữ liệu, phân quyền, đăng nhập, cookie, deploy, dùng AI trong sản phẩm.", say: "Hỏi như một bài kiểm tra đủ thứ cơ bản của backend, mỗi chủ đề vài câu. Hợp với ứng viên có nền tảng rộng." },
        { name: "Buổi C: ngân hàng, onsite, 2 đến 3 năm kinh nghiệm", one: "Sâu về thiết kế: luồng phê duyệt, bất đồng bộ, bảo mật token, microservices, quy trình làm việc.", say: "Mỗi câu trả lời lại bị hỏi tiếp \"cụ thể thế nào\". Chỗ nào mơ hồ sẽ bị đào xuống đến khi lộ phần thật sự làm." },
      ],
      takeaway: {
        lines: [
          "Dự án trong CV là điểm khởi đầu: mọi công nghệ ghi ở đó đều có thể bị hỏi đến tận bản chất.",
          "Cấp độ càng cao, câu hỏi càng thiên về thiết kế và đánh đổi hơn là định nghĩa.",
        ],
      },
      quiz: {
        question: "Vì sao nên tự trả lời thành tiếng trước khi mở dàn ý?",
        options: [
          "Để đỡ phải đọc dàn ý",
          "Vì chỉ khi phải nói ra mới lộ chỗ mình chưa chắc, đúng như phỏng vấn thật",
          "Vì dàn ý thường sai",
          "Vì phỏng vấn thật chỉ hỏi miệng",
        ],
        answer: 1,
        explain: "Đọc lướt dễ tạo cảm giác đã hiểu. Nói ra thành tiếng buộc bạn dựng câu trả lời, và chỗ vấp chính là chỗ cần học thêm.",
      },
    },
    {
      id: "session-a",
      title: "Phần 2: Buổi A, junior ở công ty giáo dục công nghệ",
      intro: [
        "Buổi này bắt đầu từ dự án của ứng viên (một hệ thống chấm bài trực tuyến), rồi đi sâu vào từng công nghệ được nhắc tới. Câu hỏi thiên về nền tảng nên junior chuẩn bị tốt hoàn toàn trả lời được.",
        "Bấm từng câu để xem dàn ý trả lời.",
      ],
      widgetTitle: "Các câu hỏi của buổi A",
      cheat: [
        { name: "Thiết kế hệ thống chấm bài", one: "Bài thiết kế nhỏ. Học: Kafka cơ bản, và bài RabbitMQ (sẽ có).", say: "Nộp bài chỉ lưu bản ghi submission trạng thái PENDING rồi trả 202 kèm id. Một queue giữ các job, nhiều worker lấy job ra chấm trong sandbox, ghi kết quả và đổi trạng thái. Client hỏi lại bằng polling hoặc nhận qua SSE." },
        { name: "RabbitMQ khi nhiều người thi cùng lúc, xử lý lỗi", one: "Đi sâu vào message queue.", say: "Nhiều consumer cùng lấy từ một queue, prefetch nhỏ để job nặng không dồn vào một worker. Chỉ ack sau khi chấm xong và lưu kết quả. Lỗi thì retry có giới hạn, quá số lần thì đẩy vào dead-letter queue. Việc chấm phải idempotent theo submission id vì message có thể bị giao lại." },
        { name: "Tối ưu truy vấn", one: "Học: bài Index và EXPLAIN.", say: "Đo trước bằng EXPLAIN ANALYZE rồi mới sửa: index đúng cột lọc và sắp xếp, tránh SELECT *, tránh bọc hàm quanh cột có index, phân trang theo keyset khi dữ liệu lớn. Đo lại sau khi sửa." },
        { name: "Có mấy loại index, cơ chế giải phóng bộ nhớ (PostgreSQL)", one: "Bối cảnh PostgreSQL. Học: bài Index và EXPLAIN.", say: "PostgreSQL có B-tree (mặc định), Hash, GiST, SP-GiST, GIN và BRIN. Giải phóng bộ nhớ thường là chuyện dead tuple: UPDATE và DELETE để lại bản ghi cũ do MVCC, VACUUM dọn để tái dùng chỗ, autovacuum tự chạy nền. Nếu người hỏi ý nói JVM thì hỏi lại, vì đó là chuyện GC." },
        { name: "Group index", one: "Cách gọi khác của composite index.", say: "Một index trên nhiều cột. Thứ tự cột quan trọng vì chỉ dùng được theo tiền tố bên trái: index (a, b) giúp lọc theo a, hoặc theo a và b, nhưng không giúp lọc riêng b." },
        { name: "Redis SET và HSET", one: "Học: bài Redis, cấu trúc dữ liệu.", say: "SET key value lưu một chuỗi. HSET key field value lưu nhiều field trong cùng một key, hợp để lưu object và sửa từng field mà không ghi lại cả object. Nếu họ hỏi kiểu Set thì lệnh là SADD." },
        { name: "Bài toán cache thực tế", one: "Học: bài Redis Cache.", say: "Cache-aside: đọc cache trước, trượt thì đọc DB rồi ghi cache có TTL; ghi thì cập nhật DB rồi xoá cache. Nêu ba sự cố: penetration (key không tồn tại), stampede (key nóng hết hạn cùng lúc), avalanche (nhiều key hết hạn cùng lúc) và cách chống." },
        { name: "Raft và ISR", one: "Hỏi lý thuyết hệ phân tán. Học: bài Kafka (phần ISR).", say: "Raft là thuật toán đồng thuận: bầu một leader, leader nhân bản log sang follower, ghi được coi là xong khi đa số node đã ghi (quorum). ISR của Kafka là tập replica đang theo kịp leader; với acks=all và min.insync.replicas, ghi chỉ thành công khi có đủ replica trong ISR." },
      ],
      takeaway: {
        lines: [
          "Công nghệ nào nhắc trong dự án thì chuẩn bị giải thích được tận bản chất, không chỉ cách dùng.",
          "Khi câu hỏi mơ hồ (bộ nhớ của DB hay của JVM?), hỏi lại ngay, đó là điểm cộng.",
        ],
      },
      quiz: {
        question: "Index (a, b) có giúp truy vấn `WHERE b = 5` không?",
        options: [
          "Có, luôn luôn",
          "Thường không, vì index dùng theo tiền tố bên trái là cột a",
          "Chỉ giúp khi bảng nhỏ",
          "Có, nếu thêm DISTINCT",
        ],
        answer: 1,
        explain: "Index nhiều cột chỉ dùng hiệu quả theo tiền tố bên trái. Lọc riêng cột b không tận dụng được thứ tự đã sắp theo a trước (bài Index và EXPLAIN).",
      },
    },
    {
      id: "session-b",
      title: "Phần 3: Buổi B, vòng 1 kỹ thuật ở tập đoàn viễn thông",
      intro: [
        "Buổi này rộng: người phỏng vấn lần lượt đi qua hầu hết các chủ đề cơ bản của backend, mỗi chủ đề vài câu, xuất phát từ một hệ thống CRM mà ứng viên từng làm.",
        "Bấm từng câu để xem dàn ý.",
      ],
      widgetTitle: "Các câu hỏi của buổi B",
      cheat: [
        { name: "Công nghệ nào cho hệ thống này, truy cập database thế nào", one: "Học: bài Entity Lifecycle, Schema và connection pool.", say: "Nêu stack thật. ORM (JPA) cho CRUD thông thường, SQL thuần hoặc JdbcTemplate hay native query cho báo cáo và truy vấn phức tạp. Nói được vì sao chọn." },
        { name: "Quy mô dữ liệu, lấy hàng chục nghìn bản ghi một lần hay phân trang", one: "Học: bài SQL Queries và Pagination.", say: "Nói con số thật. Không lấy hết một lần vì tốn bộ nhớ, chậm và giữ kết nối lâu. Phân trang (offset cho dữ liệu nhỏ, keyset khi lớn) và chỉ chọn cột cần." },
        { name: "Dùng AI để phân tích hội thoại và dữ liệu điều trị", one: "Câu về sản phẩm có tích hợp LLM.", say: "Gửi lượng dữ liệu tối thiểu, che thông tin nhận dạng trước khi gửi, lưu kết quả để kiểm tra lại, và coi đầu ra là gợi ý chứ không phải quyết định. Dữ liệu điều trị rất nhạy cảm nên phải xem điều khoản của nhà cung cấp." },
        { name: "Làm module Quản lý sản phẩm thì làm thế nào", one: "Một bài thiết kế từ DB đến framework.", say: "Hỏi lại yêu cầu, vẽ ERD (sản phẩm, danh mục), viết migration, thiết kế API REST với DTO và validation, chia lớp controller, service, repository, rồi test. Nói thêm có vẽ sequence diagram cho luồng chính." },
        { name: "Connection pool là gì, cấu hình thế nào", one: "Học: bài Schema, ràng buộc, ACID và connection pool.", say: "Tái dùng kết nối thay vì mở mới mỗi request. HikariCP là mặc định của Spring Boot. Cấu hình: maximumPoolSize, connectionTimeout, minimumIdle, maxLifetime. Không đặt quá lớn: tổng pool của mọi instance phải thấp hơn giới hạn kết nối của DB." },
        { name: "Đã dùng Docker hay Kubernetes chưa", one: "Học: bài Docker và Kubernetes cho dev Spring.", say: "Nói đúng mức đã dùng: Dockerfile nhiều giai đoạn, compose cho dev. Nếu chưa dùng Kubernetes thì nói thẳng và nêu khái niệm Pod, Deployment, Service." },
        { name: "RBAC và ABAC, thiết kế bảng phân quyền", one: "Học: bài Spring Security và JWT.", say: "RBAC gán quyền theo vai trò. ABAC quyết định theo thuộc tính của người dùng, tài nguyên và ngữ cảnh. Bảng tối thiểu: users, roles, permissions, user_roles, role_permissions." },
        { name: "Luồng login, lưu access token và refresh token ở đâu", one: "Học: bài Spring Security và OAuth2.", say: "Server kiểm tra thông tin rồi trả access token ngắn hạn kèm refresh token. Web: refresh token trong cookie HttpOnly, Secure, SameSite; access token giữ trong bộ nhớ. Mobile: kho lưu trữ an toàn của hệ điều hành. Tránh localStorage vì XSS đọc được." },
        { name: "Các loại cookie và thuộc tính bảo mật", one: "Học: bài Spring Security, OAuth2 và lỗ hổng web.", say: "Session cookie (mất khi đóng trình duyệt) và persistent cookie (có Max-Age hoặc Expires); first-party và third-party. Thuộc tính: HttpOnly (JS không đọc được), Secure (chỉ HTTPS), SameSite (Strict, Lax, None, chống CSRF), Domain, Path." },
        { name: "Tính năng khó nhất hoặc tâm đắc nhất", one: "Câu behavioral. Học: bài Project Story và STAR.", say: "Chọn một việc thật. Kể vấn đề, các lựa chọn đã cân nhắc, kết quả có số, và bài học. Nói phần của riêng mình." },
      ],
      takeaway: {
        lines: [
          "Một buổi rộng như thế này thưởng cho người có nền tảng đều, không cần chuyên sâu một mảng.",
          "Với công nghệ chưa dùng (như Kubernetes), nói thẳng rồi nêu khái niệm đã học, đừng giả vờ.",
        ],
      },
      quiz: {
        question: "Với app mobile, access token và refresh token nên lưu ở đâu?",
        options: [
          "Trong localStorage hoặc SharedPreferences dạng chữ thường",
          "Trong kho lưu trữ an toàn của hệ điều hành (Keychain hoặc Keystore)",
          "Trong tên file log để dễ debug",
          "Trong URL",
        ],
        answer: 1,
        explain: "Token là chìa khoá vào tài khoản, nên cần nơi có mã hoá và kiểm soát truy cập của hệ điều hành. Lưu dạng chữ thường hoặc trong URL đều dễ bị lộ.",
      },
    },
    {
      id: "session-c",
      title: "Phần 4: Buổi C, onsite ở ngân hàng, 2 đến 3 năm kinh nghiệm",
      intro: [
        "Ứng viên làm trong một sản phẩm số hoá luồng trình ký hồ sơ tín dụng. Buổi này đi sâu vào thiết kế: mỗi câu trả lời đều bị hỏi tiếp \"cụ thể thế nào\", đến khi lộ ra phần ứng viên thật sự làm.",
        "Bấm từng câu để xem dàn ý.",
      ],
      widgetTitle: "Các câu hỏi của buổi C",
      cheat: [
        { name: "Vai trò thật của em trong dự án", one: "Câu mở đầu quyết định cả buổi.", say: "Chia rõ ba mức: phần em thiết kế và sở hữu, phần em làm theo thiết kế có sẵn, phần em chỉ đọc. Nói đúng mức, đừng nhận rộng hơn." },
        { name: "Thiết kế upload file và gửi mail", one: "Bài thiết kế nhỏ.", say: "File lưu ở kho riêng, database chỉ giữ metadata và tham chiếu, kiểm tra loại và dung lượng. Mail gửi bất đồng bộ qua hàng đợi, không chặn luồng chính." },
        { name: "Trình ký tuần tự và trình ký song song", one: "Bài thiết kế workflow.", say: "Mô hình có nhiều bước, mỗi bước có chế độ tuần tự hoặc song song và điều kiện hoàn thành. Trạng thái hồ sơ là một máy trạng thái với bảng chuyển trạng thái hợp lệ và vai trò được phép." },
        { name: "Frontend hay backend chặn việc ký sai cấp", one: "Câu hỏi bắt lỗi tư duy.", say: "Backend phải kiểm tra lại: người ký có quyền ở bước hiện tại không, hồ sơ đang ở trạng thái nào. Frontend chỉ ẩn nút cho tiện, không phải lớp bảo vệ. Chống ký hai lần bằng optimistic lock hoặc UPDATE có điều kiện." },
        { name: "Gửi mail bất đồng bộ", one: "Học: bài Giao dịch phân tán (outbox).", say: "try-catch chỉ bắt lỗi, chưa phải bất đồng bộ. Cách đúng: ghi một bản ghi outbox trong cùng transaction rồi một worker gửi sau; hoặc đẩy sự kiện vào Kafka cho một notification service." },
        { name: "Làm sao biết JWT không bị sửa", one: "Học: bài OAuth2 và kiểm tra JWT.", say: "JWT gồm header, payload và chữ ký. Server tính lại chữ ký bằng khoá bí mật (HS256) hoặc kiểm bằng khoá công khai (RS256) rồi so với chữ ký trong token, kiểm thêm exp, iss, aud. Sửa payload thì chữ ký không khớp." },
        { name: "Microservices tách đến mức nào, chung database có đúng không", one: "Học: bài Microservices.", say: "Tách theo ranh giới nghiệp vụ, mỗi service sở hữu dữ liệu của nó. Nhiều service chung một schema thì phá tính độc lập, dễ làm hỏng nhau. Nếu hệ thống đang chung, nói rõ đó là đánh đổi hiện tại." },
        { name: "REST: khi nào dùng PUT, khi nào PATCH", one: "Học: bài REST API Design.", say: "GET đọc, POST tạo, PUT thay toàn bộ resource, PATCH sửa một phần, DELETE xoá." },
        { name: "Access token 5 phút mà người dùng không phải đăng nhập lại", one: "Học: bài OAuth2 và Spring Security.", say: "Dùng refresh token sống lâu hơn. App gọi API refresh khi access token hết hạn hoặc khi nhận 401 và nhận lại cặp token mới. Nên xoay vòng refresh token và có cách thu hồi." },
        { name: "Một ca tối ưu cụ thể, và nếu 10 triệu bản ghi", one: "Câu hỏi kiểm tra chiều sâu.", say: "Chỉ kể ca bạn thật sự đo được. Với 10 triệu bản ghi: index đúng, phân trang keyset, tránh đếm toàn bảng, cân nhắc partition và cache. Chưa gặp thì nói thẳng rồi nêu cách tiếp cận." },
        { name: "Sequence diagram thể hiện gì", one: "Câu về quy trình thiết kế.", say: "Thứ tự thông điệp giữa các thành phần (người dùng, frontend, backend, database): validate, xử lý, mã trả về, nhánh lỗi. Vẽ trước khi code và có người review." },
        { name: "Dùng AI khi code, SRS, MCP, vì sao phiên dài thì chậm", one: "Câu hỏi thời đại.", say: "Cho AI đọc code, viết rule convention, bắt tái dùng lớp base; biến SRS thành checklist và test. MCP là giao thức chuẩn nối ứng dụng AI với công cụ và dữ liệu. Phiên dài chậm vì ngữ cảnh phình to, nên chia phiên theo tác vụ và nén lại." },
        { name: "Git flow, và chỉ đưa một tính năng lên production", one: "Học: bài Project Story và nhánh làm việc (sẽ có bài Git).", say: "Tách nhánh từ develop, merge qua pull request. Muốn chỉ lên một tính năng thì lấy riêng commit của nó bằng cherry-pick sang nhánh release, hoặc dùng feature flag để code đã lên nhưng đang tắt." },
        { name: "Quy trình của em là Agile hay waterfall", one: "Câu hỏi bắt mâu thuẫn.", say: "Agile là phát hành từng phần nhỏ theo sprint, tính năng xong và test xong thì lên, không chờ nhau. Gom hết rồi mới lên cùng lúc là cách làm giống waterfall. Mô tả đúng quy trình thật." },
        { name: "Em có câu hỏi nào cho bên mình không", one: "Luôn có ở cuối buổi.", say: "Hỏi về quy trình phát triển, công nghệ đang dùng, CI/CD, cách đo chất lượng, lộ trình của người mới. Đừng hỏi thứ đã có trong tin tuyển dụng." },
      ],
      takeaway: {
        lines: [
          "Câu trả lời đầu tiên chỉ là điểm bắt đầu. Hãy chuẩn bị cho ba câu hỏi tiếp theo: cụ thể thế nào, vì sao, nếu lỗi thì sao.",
          "Frontend ẩn nút không phải bảo mật. Backend luôn phải kiểm tra lại quyền và trạng thái.",
        ],
      },
      quiz: {
        question: "Frontend đã ẩn nút Ký với người không có quyền ở bước hiện tại. Backend có cần kiểm tra lại không?",
        options: [
          "Không, vì frontend đã chặn",
          "Có, vì request có thể được gửi trực tiếp, bỏ qua giao diện",
          "Chỉ cần kiểm tra khi có lỗi",
          "Chỉ cần với tài khoản admin",
        ],
        answer: 1,
        explain: "Ai cũng gọi được API bằng công cụ khác, không qua giao diện. Quyền và trạng thái hợp lệ phải được backend kiểm tra mỗi lần.",
      },
    },
    {
      id: "cv-honesty",
      title: "Phần 5: Ghi CV đúng mức và bị hỏi sâu thì nói sao",
      intro: [
        "Ba buổi trên có một điểm chung: người phỏng vấn đi từ những gì CV ghi, rồi hỏi sâu dần cho đến khi gặp ranh giới thật sự của ứng viên. Công nghệ ghi trong CV nhưng chỉ chạm qua sẽ bị lộ sau vài câu.",
        "Quy tắc đơn giản: **mỗi dòng trong CV phải nói được khoảng 10 phút**. Nói được nó là gì, vì sao chọn, phần mình làm cụ thể, đánh đổi, và nó từng hỏng thế nào. Dòng nào không nói nổi thì hạ mức mô tả hoặc bỏ.",
        "Có ba mức để nói về một dự án: phần **mình thiết kế và sở hữu**, phần **mình làm theo thiết kế có sẵn**, và phần **mình chỉ đọc hoặc biết xung quanh**. Nói rõ từng mức thì không ai bắt bẻ, vì bạn tự vạch ranh giới trước.",
        "Chọn \"Nên nói\" hoặc \"Không nên\" cho từng câu dưới đây.",
      ],
      widgetTitle: "Câu trả lời nào an toàn?",
      drill: {
        choices: ["Nên nói", "Không nên"],
        items: [
          { q: "CV ghi Kafka nhưng bạn chỉ viết phần producer. Bạn nói: \"Em dùng Kafka cho event streaming trong hệ thống.\"", a: "Không nên", why: "Quá rộng so với thực tế. Nói: \"Em viết phần producer gửi event, phần consumer do người khác làm, em hiểu cơ chế consumer group ở mức lý thuyết.\"" },
          { q: "Hỏi về bảng 10 triệu bản ghi. Bạn nói: \"Em chưa gặp quy mô đó, bảng lớn nhất em làm khoảng 10 nghìn, nhưng em sẽ tiếp cận bằng index, phân trang keyset và partition.\"", a: "Nên nói", why: "Trung thực về phạm vi, rồi chứng tỏ biết cách tiếp cận. Người phỏng vấn đánh giá cao điều này." },
          { q: "Mọi câu hỏi sâu đều được đáp \"phần đó em không phụ trách, người khác làm rồi\".", a: "Không nên", why: "Lặp lại nhiều lần khiến người nghe không biết bạn thật sự làm gì. Hãy nêu rõ phần của mình và hiểu phần xung quanh nó." },
          { q: "CV ghi tối ưu truy vấn. Bạn nói: \"Em đề xuất đổi LIKE sang so khớp chính xác vì người dùng hay tìm theo mã. Em chưa đo trước và sau.\"", a: "Nên nói", why: "Mô tả đúng việc đã làm và nói rõ phần chưa làm. Không thổi phồng thành \"đã tối ưu giảm X lần\"." },
          { q: "Bạn nói \"nhóm em làm Agile\" rồi mô tả rằng mọi tính năng phải xong hết mới được phát hành cùng lúc.", a: "Không nên", why: "Mô tả và nhãn mâu thuẫn nhau. Mô tả quy trình thật, hoặc chuẩn bị giải thích vì sao thực tế khác lý thuyết." },
          { q: "Gặp câu chưa biết, bạn nói: \"Phần này em chưa tìm hiểu sâu. Em đoán là ... và em sẽ kiểm tra lại.\"", a: "Nên nói", why: "Nói rõ là đoán, kèm hướng kiểm tra. Cách này giữ được uy tín hơn là nói chắc chắn rồi sai." },
        ],
        summary: "Nói đúng phạm vi và cách bạn lấp phần còn thiếu luôn an toàn hơn thổi phồng.",
      },
      trap: {
        title: "Ghi trong CV mà không nói được 10 phút",
        text: "Mỗi công nghệ trong CV là một lời hứa rằng bạn trả lời được ít nhất ba câu hỏi tiếp theo. Nếu chỉ \"đụng qua\", hãy ghi rõ phạm vi (ví dụ \"viết producer\") thay vì chỉ ghi tên công nghệ.",
      },
      takeaway: {
        lines: [
          "Tự vạch ranh giới trước: thiết kế và sở hữu, làm theo thiết kế, chỉ đọc.",
          "Chưa biết thì nói thẳng, nêu cách tiếp cận, hẹn kiểm tra lại.",
        ],
      },
      quiz: {
        question: "Cách ghi dòng nào trong CV an toàn nhất khi bạn chỉ viết phần gửi message của Kafka?",
        options: [
          "Kafka",
          "Thiết kế hệ thống event streaming bằng Kafka",
          "Viết producer gửi event lên Kafka (không làm consumer)",
          "Chuyên gia Kafka",
        ],
        answer: 2,
        explain: "Ghi đúng phạm vi cho phép người phỏng vấn hỏi đúng phần bạn nắm. Hai cách ghi còn lại hứa nhiều hơn mức làm được và dễ bị hỏi đến chỗ không trả lời nổi.",
      },
    },
  ],
  modelAnswer:
    "Khi nói về một dự án, em chia công việc thành ba mức để người nghe biết chính xác phần của em. Phần em thiết kế và sở hữu, ví dụ em chọn cách chia trạng thái hồ sơ và viết phần kiểm tra quyền ở backend. Phần em làm theo thiết kế có sẵn, ví dụ em viết API theo mẫu của team. Và phần em chỉ đọc hoặc biết ở mức khái niệm, ví dụ Kafka em mới viết producer, còn consumer em hiểu về lý thuyết. Với một công nghệ em chưa dùng, em nói thẳng là chưa dùng, rồi nêu cách em hiểu và sẽ tìm hiểu tiếp. Em nghĩ nói rõ ranh giới như vậy đáng tin hơn là nhận rộng ra.",
  cards: [
    { q: "Câu trả lời an toàn khi bị hỏi sâu vào kỹ năng chỉ chạm qua?", a: "Nói đúng phạm vi đã làm, rồi nêu hiểu biết lý thuyết và cách sẽ tìm hiểu tiếp. Không đoán như thể chắc chắn." },
    { q: "Ba mức để nói về phần mình trong một dự án?", a: "Phần mình thiết kế và sở hữu, phần mình làm theo thiết kế có sẵn, phần mình chỉ đọc hoặc biết xung quanh." },
    { q: "Hệ thống chấm bài khi nhiều người thi cùng lúc, kiến trúc cơ bản?", a: "Nộp bài lưu PENDING và trả 202, queue chứa job, nhiều worker chấm trong sandbox, ghi kết quả. Client polling hoặc nhận qua SSE." },
    { q: "Vì sao ack message RabbitMQ sau khi chấm xong?", a: "Nếu worker chết giữa chừng, message chưa ack sẽ được giao lại cho worker khác. Vì có thể giao lại nên việc chấm phải idempotent theo submission id." },
    { q: "Index (a, b) có giúp WHERE b = ? không?", a: "Thường không. Index dùng theo tiền tố bên trái, nên giúp lọc theo a, hoặc a và b." },
    { q: "VACUUM trong PostgreSQL làm gì?", a: "Dọn dead tuple do MVCC để lại sau UPDATE và DELETE, để tái dùng chỗ. Autovacuum chạy nền; VACUUM FULL ghi lại bảng và trả đĩa nhưng khoá bảng." },
    { q: "SET và HSET của Redis khác nhau thế nào?", a: "SET lưu một chuỗi cho một key. HSET lưu nhiều field trong cùng một key, hợp để lưu object và sửa từng field." },
    { q: "Frontend đã ẩn nút Ký, backend còn cần kiểm tra không?", a: "Có. Request có thể gửi thẳng bỏ qua giao diện, nên backend luôn kiểm tra quyền và trạng thái hợp lệ." },
    { q: "Vì sao try-catch quanh việc gửi mail chưa phải bất đồng bộ?", a: "Nó chỉ bắt lỗi, việc gửi vẫn chạy cùng luồng và làm chậm phản hồi. Bất đồng bộ là tách việc gửi ra khỏi luồng chính, ví dụ outbox hoặc queue." },
    { q: "Cách giữ phiên người dùng khi access token chỉ sống 5 phút?", a: "Dùng refresh token sống lâu hơn để xin cặp token mới khi access token hết hạn, nên xoay vòng và có cách thu hồi." },
  ],
};
