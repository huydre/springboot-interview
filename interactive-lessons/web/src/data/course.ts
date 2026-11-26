import { oop } from "./lessons/oop";
import { equalsHashcode } from "./lessons/equals-hashcode";
import { exception } from "./lessons/exception";
import { hashmap } from "./lessons/hashmap";
import { collections } from "./lessons/collections";
import { stream } from "./lessons/stream";
import { collectors } from "./lessons/collectors";
import { optional } from "./lessons/optional";
import { java21 } from "./lessons/java21";
import { jvm } from "./lessons/jvm";
import { thread } from "./lessons/thread";
import { threadpool } from "./lessons/threadpool";
import { completablefuture } from "./lessons/completablefuture";
import { sync } from "./lessons/sync";
import { deadlock } from "./lessons/deadlock";
import { indexExplain } from "./lessons/index";
import { sql } from "./lessons/sql";
import { rest } from "./lessons/rest";
import { security } from "./lessons/security";
import { redis } from "./lessons/redis";
import { kafka } from "./lessons/kafka";
import { sdFoundations } from "./lessons/sd-foundations";
import { testing } from "./lessons/testing";
import { ioc } from "./lessons/ioc";
import { beanLifecycle } from "./lessons/bean-lifecycle";
import { autoConfig } from "./lessons/auto-config";
import { mvcFlow } from "./lessons/mvc-flow";
import { adviceAop } from "./lessons/advice-aop";
import { txProxy } from "./lessons/tx-proxy";
import { txPitfalls } from "./lessons/tx-pitfalls";
import { propagation } from "./lessons/propagation";
import { isolation } from "./lessons/isolation";
import { txTemplate } from "./lessons/tx-template";
import { entityLifecycle } from "./lessons/entity-lifecycle";
import { nPlusOne } from "./lessons/n-plus-one";
import { locking } from "./lessons/locking";
import { coreDiagrams } from "./lessons/core-diagrams";
import { weeklyQuiz } from "./lessons/weekly-quiz";
import { sdConcepts } from "./lessons/sd-concepts";
import { sdPractice } from "./lessons/sd-practice";
import { microservices } from "./lessons/microservices";
import { starStory } from "./lessons/star-story";
import { labCollections } from "./lessons/lab-collections";
import { labStreams } from "./lessons/lab-streams";
import { labConcurrency } from "./lessons/lab-concurrency";
import { labOrderSetup } from "./lessons/lab-order-setup";
import { labTxBugs } from "./lessons/lab-tx-bugs";
import { labJpaPerf } from "./lessons/lab-jpa-perf";
import { labJwtCacheTests } from "./lessons/lab-jwt-cache-tests";
import { sqlFoundation } from "./lessons/sql-foundation";
import { sqlErd } from "./lessons/sql-erd";
import { sqlSelect } from "./lessons/sql-select";
import { sqlFilter } from "./lessons/sql-filter";
import { sqlAggregate } from "./lessons/sql-aggregate";
import { sqlJoin } from "./lessons/sql-join";
import { sqlTransform } from "./lessons/sql-transform";
import { sqlSubquery } from "./lessons/sql-subquery";
import { sqlSet } from "./lessons/sql-set";
import { sqlWindow } from "./lessons/sql-window";
import { sqlDml } from "./lessons/sql-dml";
import { sqlOptimize } from "./lessons/sql-optimize";
import { sqlCapstone } from "./lessons/sql-capstone";
import { solid } from "./lessons/solid";
import { patternsCreational } from "./lessons/patterns-creational";
import { patternsStructural } from "./lessons/patterns-structural";
import { patternsBehavioral1 } from "./lessons/patterns-behavioral-1";
import { patternsBehavioral2 } from "./lessons/patterns-behavioral-2";
import { lld1 } from "./lessons/lld-1";
import { lld2 } from "./lessons/lld-2";
import { javaTime } from "./lessons/java-time";
import { javaRuntime } from "./lessons/java-runtime";
import { javaIo } from "./lessons/java-io";
import { redisStructures } from "./lessons/redis-structures";
import { redisPatterns } from "./lessons/redis-patterns";
import { oauth2Oidc } from "./lessons/oauth2-oidc";
import { webVulns } from "./lessons/web-vulns";
import { apiReliability } from "./lessons/api-reliability";
import { dbDesign } from "./lessons/db-design";
import { behavioral } from "./lessons/behavioral";
import { realInterviews } from "./lessons/real-interviews";
import { gitAgile } from "./lessons/git-agile";
import { mavenBasics } from "./lessons/maven-basics";
import { approvalWorkflow } from "./lessons/approval-workflow";
import { authorization } from "./lessons/authorization";
import { rabbitmq } from "./lessons/rabbitmq";
import { aiAssistedDev } from "./lessons/ai-assisted-dev";
import { raftConsensus } from "./lessons/raft-consensus";
import { httpBasics } from "./lessons/http-basics";
import { moduleDesign } from "./lessons/module-design";
import { elasticsearch } from "./lessons/elasticsearch";
import { observability } from "./lessons/observability";
import { webflux } from "./lessons/webflux";
import { dockerK8s } from "./lessons/docker-k8s";
import { distributedTx } from "./lessons/distributed-tx";
import type { Lesson } from "./types";

/** Each course is its own page: the sidebar lists only the current course's lessons and links to the others. */
export type Course = { id: string; title: string; tab: string; crumb: string; lessons: { slug: string; title: string }[] };

export const courses: Course[] = [
  {
    id: "java-core",
    title: "Java Core cho phỏng vấn",
    tab: "Java Core",
    crumb: "Java Core",
    lessons: [
      { slug: "oop", title: "OOP: 4 tính chất" },
      { slug: "solid", title: "SOLID: 5 nguyên tắc" },
      { slug: "equals-hashcode", title: "equals, hashCode & String" },
      { slug: "exception", title: "Exception Handling" },
      { slug: "java21", title: "Java 17 & 21" },
      { slug: "java-time", title: "Date-Time API và múi giờ" },
      { slug: "java-io", title: "I/O, Charset và Serialization" },
    ],
  },
  {
    id: "java-collections",
    title: "Collections & Stream",
    tab: "Collections",
    crumb: "Collections & Stream",
    lessons: [
      { slug: "hashmap", title: "HashMap Internals" },
      { slug: "collections", title: "Collections Framework" },
      { slug: "stream", title: "Lambda & Stream API" },
      { slug: "collectors", title: "Collectors" },
      { slug: "optional", title: "Optional & Parallel Stream" },
    ],
  },
  {
    id: "jvm",
    title: "JVM & Runtime",
    tab: "JVM",
    crumb: "JVM & Runtime",
    lessons: [
      { slug: "jvm", title: "JVM Memory & GC" },
      { slug: "java-runtime", title: "ClassLoader, JIT, AQS, StampedLock" },
    ],
  },
  {
    id: "concurrency",
    title: "Concurrency",
    tab: "Concurrency",
    crumb: "Concurrency",
    lessons: [
      { slug: "thread", title: "Thread Basics" },
      { slug: "threadpool", title: "ThreadPoolExecutor" },
      { slug: "completablefuture", title: "CompletableFuture" },
      { slug: "sync", title: "synchronized, volatile, Atomic" },
      { slug: "deadlock", title: "Deadlock, ThreadLocal & Virtual Threads" },
    ],
  },
  {
    id: "design-patterns",
    title: "Design Patterns và LLD",
    tab: "Patterns",
    crumb: "Design Patterns",
    lessons: [
      { slug: "patterns-creational", title: "Creational: Singleton, Factory, Builder..." },
      { slug: "patterns-structural", title: "Structural: Adapter, Decorator, Proxy..." },
      { slug: "patterns-behavioral-1", title: "Behavioral 1: Strategy, Observer, Command..." },
      { slug: "patterns-behavioral-2", title: "Behavioral 2: Chain, Iterator, Visitor..." },
      { slug: "lld-1", title: "LLD 1: Khung trả lời, Parking Lot, Rate Limiter" },
      { slug: "lld-2", title: "LLD 2: Movie Ticket, Elevator, Connect Four" },
    ],
  },
  {
    id: "spring",
    title: "Spring Core, Boot & MVC",
    tab: "Spring",
    crumb: "Spring",
    lessons: [
      { slug: "maven-basics", title: "Maven: pom.xml, dependency, lifecycle, build" },
      { slug: "ioc", title: "IoC & Dependency Injection" },
      { slug: "bean-lifecycle", title: "Bean Scope & Lifecycle" },
      { slug: "auto-config", title: "Spring Boot Auto-configuration" },
      { slug: "mvc-flow", title: "Spring MVC Request Flow" },
      { slug: "advice-aop", title: "Exception Handling, Validation & AOP" },
      { slug: "testing", title: "Testing Spring Boot" },
      { slug: "module-design", title: "Thiết kế một module từ DB đến API" },
      { slug: "webflux", title: "WebFlux, Reactor và virtual thread" },
    ],
  },
  {
    id: "database",
    title: "Database & SQL",
    tab: "Database",
    crumb: "Database & SQL",
    lessons: [
      { slug: "db-design", title: "Schema, ràng buộc, ACID và connection pool" },
      { slug: "index", title: "Index & EXPLAIN" },
      { slug: "sql", title: "SQL Queries & Pagination" },
    ],
  },
  {
    id: "jpa",
    title: "Transaction & JPA",
    tab: "JPA",
    crumb: "Transaction & JPA",
    lessons: [
      { slug: "tx-proxy", title: "Transaction Proxy Mechanism" },
      { slug: "tx-pitfalls", title: "Khi @Transactional không hoạt động" },
      { slug: "propagation", title: "Propagation" },
      { slug: "isolation", title: "Isolation & readOnly" },
      { slug: "tx-template", title: "TransactionTemplate & Events" },
      { slug: "entity-lifecycle", title: "Entity Lifecycle & Persistence Context" },
      { slug: "n-plus-one", title: "Lazy Loading & N+1" },
      { slug: "locking", title: "Locking, Batch & Mapping" },
    ],
  },
  {
    id: "api-security",
    title: "REST API & Security",
    tab: "API & Security",
    crumb: "API & Security",
    lessons: [
      { slug: "http-basics", title: "HTTP nhập môn: request, response, status, curl" },
      { slug: "rest", title: "REST API Design" },
      { slug: "api-reliability", title: "API: ETag, webhook và OpenAPI" },
      { slug: "security", title: "Spring Security & JWT" },
      { slug: "oauth2-oidc", title: "OAuth2, OIDC, PKCE và kiểm tra JWT" },
      { slug: "authorization", title: "Phân quyền: RBAC, ABAC và bảng dữ liệu" },
      { slug: "web-vulns", title: "Lỗ hổng web: SQLi, XSS, IDOR, SSRF" },
    ],
  },
  {
    id: "cache-messaging",
    title: "Redis, Kafka & Elasticsearch",
    tab: "Redis, Kafka & Search",
    crumb: "Redis, Kafka & Search",
    lessons: [
      { slug: "redis", title: "Redis Cache" },
      { slug: "redis-structures", title: "Redis: cấu trúc dữ liệu" },
      { slug: "redis-patterns", title: "Redis: khoá phân tán, rate limit, eviction" },
      { slug: "kafka", title: "Kafka Basics" },
      { slug: "rabbitmq", title: "RabbitMQ và hệ thống chấm bài" },
      { slug: "elasticsearch", title: "Elasticsearch: tìm kiếm full-text" },
    ],
  },
  {
    id: "production",
    title: "Production: Docker, K8s, Observability",
    tab: "Production",
    crumb: "Production",
    lessons: [
      { slug: "docker-k8s", title: "Docker và Kubernetes cho dev Spring" },
      { slug: "observability", title: "Observability: log, metric, tracing" },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    tab: "System Design",
    crumb: "System Design",
    lessons: [
      { slug: "sd-foundations", title: "Nền tảng hệ thống và Cloud" },
      { slug: "sd-concepts", title: "System Design Concepts" },
      { slug: "microservices", title: "Microservices" },
      { slug: "distributed-tx", title: "Giao dịch phân tán: Saga, Outbox, 2PC" },
      { slug: "approval-workflow", title: "Workflow phê duyệt: trình ký tuần tự và song song" },
      { slug: "raft-consensus", title: "Raft và đồng thuận" },
      { slug: "sd-practice", title: "System Design Practice" },
    ],
  },
  {
    id: "behavioral",
    title: "Behavioral",
    tab: "Behavioral",
    crumb: "Behavioral",
    lessons: [
      { slug: "star-story", title: "Project Story & STAR" },
      { slug: "behavioral", title: "Xung đột, thất bại, ownership và câu hỏi khó" },
      { slug: "git-agile", title: "Git và quy trình làm việc" },
      { slug: "ai-assisted-dev", title: "Dùng AI khi code: quy trình, SRS, MCP" },
      { slug: "real-interviews", title: "Đề phỏng vấn thật: ba buổi và chỗ hay bị hụt" },
    ],
  },
  {
    id: "review",
    title: "Ôn tập tổng hợp",
    tab: "Ôn tập",
    crumb: "Ôn tập tổng hợp",
    lessons: [
      { slug: "core-diagrams", title: "Sơ đồ cơ chế cốt lõi" },
      { slug: "weekly-quiz", title: "Bộ câu hỏi ôn tập hằng tuần" },
    ],
  },
  {
    id: "labs",
    title: "Labs thực hành",
    tab: "Labs",
    crumb: "Labs thực hành",
    lessons: [
      { slug: "lab-collections", title: "Lab 1: Collections" },
      { slug: "lab-streams", title: "Lab 2: Stream Queries" },
      { slug: "lab-concurrency", title: "Lab 3: Concurrency" },
      { slug: "lab-order-setup", title: "Lab 4: order-service Setup" },
      { slug: "lab-tx-bugs", title: "Lab 5: Transaction Bugs" },
      { slug: "lab-jpa-perf", title: "Lab 6: N+1, Locking & Index" },
      { slug: "lab-jwt-cache-tests", title: "Lab 7: JWT, Cache & Tests" },
    ],
  },
  {
    id: "sql-start",
    title: "Nền tảng và thiết kế dữ liệu",
    tab: "Nền tảng",
    crumb: "Nền tảng & thiết kế",
    lessons: [
      { slug: "sql-foundation", title: "Nền tảng Database và bộ dữ liệu T24" },
      { slug: "sql-erd", title: "Thiết kế ERD và lược đồ quan hệ" },
    ],
  },
  {
    id: "sql-query",
    title: "Truy vấn cơ bản",
    tab: "Truy vấn",
    crumb: "Truy vấn cơ bản",
    lessons: [
      { slug: "sql-select", title: "SELECT, FROM, DISTINCT và Alias" },
      { slug: "sql-filter", title: "Lọc và sắp xếp dữ liệu" },
      { slug: "sql-aggregate", title: "Hàm tổng hợp, GROUP BY và HAVING" },
    ],
  },
  {
    id: "sql-combine",
    title: "Kết hợp và xử lý dữ liệu",
    tab: "Kết hợp",
    crumb: "Kết hợp & xử lý",
    lessons: [
      { slug: "sql-join", title: "Kết hợp bảng với JOIN" },
      { slug: "sql-transform", title: "CASE WHEN, COALESCE, CAST, hàm chuỗi và ngày tháng" },
      { slug: "sql-subquery", title: "Subquery, EXISTS và CTE" },
      { slug: "sql-set", title: "UNION, INTERSECT và EXCEPT" },
    ],
  },
  {
    id: "sql-pro",
    title: "Nâng cao và tối ưu",
    tab: "Nâng cao",
    crumb: "Nâng cao & tối ưu",
    lessons: [
      { slug: "sql-window", title: "Window Functions" },
      { slug: "sql-dml", title: "INSERT, UPDATE, DELETE và Transaction" },
      { slug: "sql-optimize", title: "Index và Execution Plan" },
    ],
  },
  {
    id: "sql-review",
    title: "Ôn tập SQL",
    tab: "Ôn tập SQL",
    crumb: "Ôn tập SQL",
    lessons: [{ slug: "sql-capstone", title: "Bài tập tổng hợp trên dữ liệu T24" }],
  },
];

/** The course a lesson belongs to (the first course if the slug is unknown). */
export function courseOf(slug: string): Course {
  return courses.find((c) => c.lessons.some((l) => l.slug === slug)) ?? courses[0];
}

/** Where a course page starts: its first lesson that has content. */
export function courseHome(c: Course): string {
  return `?bai=${(c.lessons.find((l) => lessons[l.slug]) ?? c.lessons[0]).slug}`;
}

/** Lessons that have content; every other course entry shows as "sắp có". */
export const lessons: Record<string, Lesson> = { oop, solid, "patterns-creational": patternsCreational, "patterns-structural": patternsStructural, "patterns-behavioral-1": patternsBehavioral1, "patterns-behavioral-2": patternsBehavioral2, "lld-1": lld1, "lld-2": lld2, "java-time": javaTime, "java-runtime": javaRuntime, "java-io": javaIo, "redis-structures": redisStructures, "redis-patterns": redisPatterns, "oauth2-oidc": oauth2Oidc, "web-vulns": webVulns, "api-reliability": apiReliability, "db-design": dbDesign, "equals-hashcode": equalsHashcode, exception, hashmap, collections, stream, collectors, optional, java21, jvm, thread, threadpool, completablefuture, sync, deadlock, index: indexExplain, sql, rest, security, redis, kafka, testing, ioc, "bean-lifecycle": beanLifecycle, "auto-config": autoConfig, "mvc-flow": mvcFlow, "advice-aop": adviceAop, "tx-proxy": txProxy, "tx-pitfalls": txPitfalls, propagation, isolation, "tx-template": txTemplate, "entity-lifecycle": entityLifecycle, "n-plus-one": nPlusOne, locking, "core-diagrams": coreDiagrams, "weekly-quiz": weeklyQuiz, "sd-foundations": sdFoundations, "sd-concepts": sdConcepts, "sd-practice": sdPractice, microservices, "star-story": starStory, behavioral, "real-interviews": realInterviews, "git-agile": gitAgile, "maven-basics": mavenBasics, "approval-workflow": approvalWorkflow, authorization, rabbitmq, "ai-assisted-dev": aiAssistedDev, "raft-consensus": raftConsensus, "http-basics": httpBasics, "module-design": moduleDesign, elasticsearch, observability, webflux, "docker-k8s": dockerK8s, "distributed-tx": distributedTx, "lab-collections": labCollections, "lab-streams": labStreams, "lab-concurrency": labConcurrency, "lab-order-setup": labOrderSetup, "lab-tx-bugs": labTxBugs, "lab-jpa-perf": labJpaPerf, "lab-jwt-cache-tests": labJwtCacheTests, "sql-foundation": sqlFoundation, "sql-erd": sqlErd, "sql-select": sqlSelect, "sql-filter": sqlFilter, "sql-aggregate": sqlAggregate, "sql-join": sqlJoin, "sql-transform": sqlTransform, "sql-subquery": sqlSubquery, "sql-set": sqlSet, "sql-window": sqlWindow, "sql-dml": sqlDml, "sql-optimize": sqlOptimize, "sql-capstone": sqlCapstone };

/** The lesson picked by `?bai=<slug>`, defaulting to the first one. */
export function currentLesson(search = window.location.search): Lesson {
  const slug = new URLSearchParams(search).get("bai") ?? "";
  return lessons[slug] ?? oop;
}
