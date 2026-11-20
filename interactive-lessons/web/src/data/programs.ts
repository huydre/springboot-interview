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
      lead: "Sáu chặng kiến thức đi theo thứ tự, mỗi tuần có một buổi lab tự tay đo và một buổi ôn tập. Hầu hết bài có video, widget tương tác và quiz.",
      stages: [
        { id: "java-core", blurb: "Nền tảng ngôn ngữ: OOP, SOLID, equals và hashCode, exception, Collections, Stream, Java 21, JVM và GC, Date-Time API, ClassLoader và JIT, I/O.", labs: ["lab-collections", "lab-streams"] },
        { id: "design-patterns", blurb: "23 design pattern (Creational, Structural, Behavioral) kèm ví dụ trong JDK và Spring, rồi áp dụng vào các bài LLD kinh điển: bãi đỗ xe, rate limiter, đặt vé, thang máy, Connect Four.", labs: [] },
        { id: "concurrency", blurb: "Thread, thread pool, CompletableFuture, lock; rồi index, SQL, REST, Security, Redis, Kafka và testing.", labs: ["lab-concurrency", "lab-jwt-cache-tests"] },
        { id: "spring", blurb: "IoC, vòng đời bean, auto-configuration, luồng request MVC, validation và AOP.", labs: ["lab-order-setup"] },
        { id: "jpa", blurb: "Transaction proxy, propagation, isolation, entity lifecycle, N+1, locking và batch.", labs: ["lab-tx-bugs", "lab-jpa-perf"] },
        { id: "system-design", blurb: "Scale, cache, queue, resilience, microservices, khung trả lời 7 bước, và kể chuyện dự án theo STAR.", labs: [] },
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
