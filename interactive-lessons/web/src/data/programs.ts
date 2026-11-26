import { courses, lessons, type Course } from "./course";

/** One knowledge stage of a program's roadmap; `id` is a course id from course.ts, `labs` are lesson slugs shown as shortcuts. */
export type Stage = { id: string; blurb: string; labs: string[] };
/** A recurring track that runs alongside the stages (labs, review); `id` is a course id. */
export type Track = { id: string; when: string; blurb: string };

export type Roadmap = {
  kicker: string;
  title: string;
  lead: string;
  stages: Stage[];
  tracks: Track[];
  finish: { title: string; blurb: string };
};

/** A course the learner can pick on the home page. A "soon" program has no roadmap yet and only lists what it will cover. */
export type Program = {
  id: string;
  title: string;
  level: string;
  blurb: string;
  topics: string[];
  status: "ready" | "soon";
  roadmap?: Roadmap;
  /** A self-contained course app served under its own path (for example `/kafka/`); its card links there instead of opening a roadmap. */
  href?: string;
  /** Shown on the card in place of the lesson and video counts, since an app course has no lesson list in this site. */
  meta?: string;
};

export const programs: Program[] = [
  {
    id: "java-interview",
    title: "Java Interview",
    level: "Junior đến Middle",
    blurb: "Chuẩn bị phỏng vấn Java Backend: Java core, concurrency, Spring, JPA, system design. Hầu hết bài có video, widget tương tác và quiz.",
    topics: ["Java core", "Concurrency", "Spring Boot", "JPA và transaction", "System design"],
    status: "ready",
    roadmap: {
      kicker: "Lộ trình 8 tuần",
      title: "Phỏng vấn Java Backend",
      lead: "Mười ba chặng kiến thức đi theo thứ tự, mỗi tuần có một buổi lab tự tay đo và một buổi ôn tập. Hầu hết bài có video, widget tương tác và quiz.",
      stages: [
        { id: "java-core", blurb: "Nền tảng ngôn ngữ: OOP, SOLID, equals và hashCode, String, exception, Java 17 và 21, Date-Time API, I/O và serialization.", labs: [] },
        { id: "java-collections", blurb: "HashMap bên trong, các Collection hay hỏi, lambda và Stream, Collectors, Optional và parallel stream.", labs: ["lab-collections", "lab-streams"] },
        { id: "jvm", blurb: "Vùng nhớ JVM, các bộ GC, ClassLoader, JIT, AQS và StampedLock.", labs: [] },
        { id: "concurrency", blurb: "Thread, ThreadPoolExecutor, CompletableFuture, synchronized, volatile, Atomic, deadlock, ThreadLocal và virtual thread.", labs: ["lab-concurrency"] },
        { id: "design-patterns", blurb: "23 design pattern (Creational, Structural, Behavioral) kèm ví dụ trong JDK và Spring, rồi áp dụng vào các bài LLD kinh điển: bãi đỗ xe, rate limiter, đặt vé, thang máy, Connect Four.", labs: [] },
        { id: "spring", blurb: "Maven (pom.xml, dependency, scope, lifecycle, wrapper), IoC, vòng đời bean, auto-configuration, luồng request MVC, validation, AOP, testing Spring Boot, và WebFlux so với virtual thread.", labs: ["lab-order-setup"] },
        { id: "database", blurb: "Thiết kế schema, ràng buộc, ACID, connection pool, index và EXPLAIN, truy vấn và phân trang.", labs: [] },
        { id: "jpa", blurb: "Transaction proxy, propagation, isolation, entity lifecycle, N+1, locking và batch.", labs: ["lab-tx-bugs", "lab-jpa-perf"] },
        { id: "api-security", blurb: "Thiết kế REST, ETag, webhook, OpenAPI; Spring Security, JWT, OAuth2 và OIDC; phân quyền RBAC và ABAC; các lỗ hổng web hay gặp.", labs: ["lab-jwt-cache-tests"] },
        { id: "cache-messaging", blurb: "Redis làm cache, cấu trúc dữ liệu, khoá phân tán, rate limit; Kafka cơ bản; Elasticsearch cho tìm kiếm full-text và cách đồng bộ với DB.", labs: [] },
        { id: "production", blurb: "Đưa Spring Boot lên production: Dockerfile, health probe, graceful shutdown trên Kubernetes; log, metric, tracing với Micrometer và OpenTelemetry.", labs: [] },
        { id: "system-design", blurb: "Nền tảng hệ thống và cloud (request path, proxy, subnet, Kubernetes), scale, cache, queue, resilience, microservices, giao dịch phân tán (Saga, Outbox, 2PC), workflow phê duyệt và khung trả lời 7 bước.", labs: [] },
        { id: "behavioral", blurb: "Git và quy trình làm việc (merge, rebase, conflict, chọn tính năng go-live, Agile); kể chuyện dự án theo STAR có số liệu thật; xử lý xung đột, kể về thất bại, ownership, các câu hỏi nhạy cảm như vì sao nghỉ việc, và mẫu câu tiếng Anh; ba buổi phỏng vấn thật đã ẩn danh kèm dàn ý trả lời.", labs: [] },
      ],
      tracks: [
        { id: "labs", when: "Mỗi thứ Bảy", blurb: "Tự tái hiện lỗi rồi sửa, từ Collections tới order-service. Đoán trước, chạy, đối chiếu số đo thật." },
        { id: "review", when: "Mỗi Chủ nhật", blurb: "Vẽ lại 12 sơ đồ cơ chế, 93 thẻ nhớ lại theo tuần, và bài tổng hợp 20 câu bấm giờ." },
      ],
      finish: { title: "Sẵn sàng phỏng vấn", blurb: "Bài tổng hợp 20 câu đạt từ 17 trở lên, 8 câu chuyện STAR có số liệu thật, và luyện trọn một đề system design theo khung 7 bước." },
    },
  },
  {
    id: "sql-basics",
    title: "SQL cơ bản",
    level: "Người mới",
    blurb: "Học SQL từ đầu trên bộ dữ liệu ngân hàng mô phỏng T24: thiết kế ERD, truy vấn, JOIN, window function, transaction và index. Có ô chạy SQL ngay trong trình duyệt.",
    topics: ["ERD và lược đồ quan hệ", "SELECT, WHERE, GROUP BY", "JOIN", "Subquery và CTE", "Window Functions", "Transaction và Index"],
    status: "ready",
    roadmap: {
      kicker: "12 bài thực hành",
      title: "SQL cơ bản trên dữ liệu ngân hàng T24",
      lead: "Đi từ khái niệm database và thiết kế ERD tới truy vấn nâng cao. Mọi bài đều chạy SQL thật trên một bộ dữ liệu ngân hàng giả lập theo mô hình T24 (khách hàng, tài khoản, chuyển khoản, bút toán, khoản vay), có đề bài và tự chấm đúng sai.",
      stages: [
        { id: "sql-start", blurb: "Database, bảng, khoá chính, khoá ngoại, NULL; rồi vẽ ERD và chuyển thành lược đồ quan hệ.", labs: [] },
        { id: "sql-query", blurb: "SELECT, DISTINCT, alias; WHERE, AND, OR, IN, BETWEEN, LIKE, ORDER BY; COUNT, SUM, AVG, GROUP BY, HAVING.", labs: [] },
        { id: "sql-combine", blurb: "INNER, LEFT, RIGHT, FULL, SELF JOIN; CASE WHEN, COALESCE, CAST, hàm chuỗi và ngày; subquery, EXISTS, CTE; UNION, INTERSECT, EXCEPT.", labs: [] },
        { id: "sql-pro", blurb: "ROW_NUMBER, RANK, LAG, LEAD, PARTITION BY; INSERT, UPDATE, DELETE, transaction; index và đọc execution plan.", labs: [] },
      ],
      tracks: [
        { id: "sql-review", when: "Cuối khoá", blurb: "Mười bài toán nghiệp vụ ngân hàng, mỗi bài kết hợp nhiều kỹ thuật đã học." },
      ],
      finish: { title: "Viết được truy vấn thực tế", blurb: "Tự đọc một yêu cầu nghiệp vụ, chọn đúng bảng và kỹ thuật, viết truy vấn đúng và giải thích được kế hoạch thực thi." },
    },
  },
  // Kafka Từ Gốc: the standalone course app copied into public/kafka (25 lessons with narrated animated videos).
  {
    id: "kafka-course",
    title: "Kafka Từ Gốc",
    level: "Từ cơ bản tới thực chiến",
    blurb: "Khoá Kafka riêng với 25 bài có video minh hoạ có giọng đọc: log và partition, producer, replication, consumer group, delivery semantics, transaction, tới Connect, Streams, vận hành và outbox. Mỗi bài có widget tương tác và quiz. Tiến độ của khoá này lưu riêng.",
    topics: ["Log, segment, partition", "Producer, acks, idempotence", "Replication và leader election", "Consumer group, rebalance, offset", "Exactly-once và transaction", "Connect, Streams, vận hành"],
    status: "ready",
    href: "/kafka/",
    meta: "25 bài · có video",
  },
];

export const programById = (id: string | null): Program | undefined => programs.find((p) => p.id === id);

/** Course ids (stages and tracks) that make up a program's roadmap. */
export function programCourses(p: Program): Course[] {
  const ids = [...(p.roadmap?.stages.map((s) => s.id) ?? []), ...(p.roadmap?.tracks.map((t) => t.id) ?? [])];
  return ids.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c);
}

/** The program a course (stage or track) belongs to; falls back to the first program. */
export function programOfCourse(courseId: string): Program {
  return programs.find((p) => programCourses(p).some((c) => c.id === courseId)) ?? programs[0];
}

/** The next lesson with content after `slug`, following the program's course order (stages, then tracks); undefined after the last one. */
export function nextLesson(slug: string): { slug: string; title: string } | undefined {
  const flat = programCourses(programOfCourse(courses.find((c) => c.lessons.some((l) => l.slug === slug))?.id ?? "")).flatMap((c) => c.lessons);
  const i = flat.findIndex((l) => l.slug === slug);
  return i < 0 ? undefined : flat.slice(i + 1).find((l) => lessons[l.slug]);
}
