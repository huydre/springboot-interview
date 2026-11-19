import { courses, lessons, type Course } from "./data/course";
import { LAST_KEY, lessonProgress, type LessonProgress } from "./progress";
import { useTheme } from "./use-theme";

/** The five knowledge stages, in the order of the 8-week plan; labs and review run alongside them every week. */
const STAGES: { id: string; blurb: string; labs: string[] }[] = [
  { id: "java-core", blurb: "Nền tảng ngôn ngữ: OOP, equals và hashCode, exception, Collections, Stream, Java 21, JVM và GC.", labs: ["lab-collections", "lab-streams"] },
  { id: "concurrency", blurb: "Thread, thread pool, CompletableFuture, lock; rồi index, SQL, REST, Security, Redis, Kafka và testing.", labs: ["lab-concurrency", "lab-jwt-cache-tests"] },
  { id: "spring", blurb: "IoC, vòng đời bean, auto-configuration, luồng request MVC, validation và AOP.", labs: ["lab-order-setup"] },
  { id: "jpa", blurb: "Transaction proxy, propagation, isolation, entity lifecycle, N+1, locking và batch.", labs: ["lab-tx-bugs", "lab-jpa-perf"] },
  { id: "system-design", blurb: "Scale, cache, queue, resilience, microservices, khung trả lời 7 bước, và kể chuyện dự án theo STAR.", labs: [] },
];
const TRACKS: { id: string; when: string; blurb: string }[] = [
  { id: "labs", when: "Mỗi thứ Bảy", blurb: "Tự tái hiện lỗi rồi sửa, từ Collections tới order-service. Đoán trước, chạy, đối chiếu số đo thật." },
  { id: "review", when: "Mỗi Chủ nhật", blurb: "Vẽ lại 12 sơ đồ cơ chế, 93 thẻ nhớ lại theo tuần, và bài tổng hợp 20 câu bấm giờ." },
];

const courseById = (id: string) => courses.find((c) => c.id === id) as Course;
const sum = (ps: LessonProgress[], k: "solved" | "total") => ps.reduce((n, p) => n + p[k], 0);
const titleOf = (slug: string) => courses.flatMap((c) => c.lessons).find((l) => l.slug === slug)?.title ?? slug;

type Status = "done" | "doing" | "todo";
function statusOf(ps: LessonProgress[]): Status {
  const s = sum(ps, "solved"), t = sum(ps, "total");
  return t > 0 && s === t ? "done" : s > 0 ? "doing" : "todo";
}
const lessonStatus = (p: LessonProgress): Status => (p.total > 0 && p.solved === p.total ? "done" : p.solved > 0 ? "doing" : "todo");
/** First lesson of the list that is not finished yet, else the first one. */
const nextOf = (ps: LessonProgress[]) => (ps.find((p) => p.ready && lessonStatus(p) !== "done") ?? ps[0]).slug;

function LessonList({ ps }: { ps: LessonProgress[] }) {
  return (
    <ol className="rm-lessons">
      {ps.map((p) => (
        <li key={p.slug} className={`rm-lesson ${lessonStatus(p)}`}>
          {p.ready ? <a href={`?bai=${p.slug}`}>{titleOf(p.slug)}</a> : <span>{titleOf(p.slug)}</span>}
          <span className="rm-tags">
            {p.video && <em>video</em>}
            {p.total > 0 && <small>{p.solved}/{p.total}</small>}
            {!p.ready && <small>sắp có</small>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Meter({ solved, total }: { solved: number; total: number }) {
  const pct = total ? Math.round((solved / total) * 100) : 0;
  return (
    <div className="rm-meter" aria-label={`Đã đúng ${solved} trên ${total} quiz`}>
      <i style={{ width: `${pct}%` }} />
      <span>{pct}%</span>
    </div>
  );
}

document.title = "Lộ trình phỏng vấn Java Backend · InterviewLab";

export default function RoadmapPage() {
  const [theme, setTheme] = useTheme();
  const all = courses.flatMap((c) => c.lessons.map((l) => lessonProgress(l.slug)));
  const ready = all.filter((p) => p.ready);
  const last = localStorage.getItem(LAST_KEY);
  const resume = last && lessons[last] ? last : nextOf(courseById("java-core").lessons.map((l) => lessonProgress(l.slug)));

  return (
    <div className="rm-page">
      <header className="rm-top">
        <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
        <button className="icon-btn" aria-label="Đổi giao diện sáng tối" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </header>

      <section className="rm-hero">
        <p className="rm-kicker">Lộ trình 8 tuần</p>
        <h1>Phỏng vấn Java Backend</h1>
        <p className="lead">Năm chặng kiến thức đi theo thứ tự, mỗi tuần có một buổi lab tự tay đo và một buổi ôn tập. Mỗi bài có video, widget tương tác và quiz.</p>
        <div className="rm-stats">
          <div><strong>{ready.length}</strong><span>bài học</span></div>
          <div><strong>{ready.filter((p) => p.video).length}</strong><span>bài có video</span></div>
          <div><strong>{sum(all, "solved")}/{sum(all, "total")}</strong><span>quiz đã đúng</span></div>
        </div>
        <a className="rm-cta" href={`?bai=${resume}`}>
          {last && lessons[last] ? "Học tiếp" : "Bắt đầu"}: {titleOf(resume)} <span aria-hidden="true">→</span>
        </a>
      </section>

      <ol className="rm-road">
        {STAGES.map((st, i) => {
          const c = courseById(st.id);
          const ps = c.lessons.map((l) => lessonProgress(l.slug));
          const status = statusOf(ps);
          return (
            <li key={st.id} className={`rm-stage ${status}`}>
              <div className="rm-node" aria-hidden="true">{status === "done" ? "✓" : i + 1}</div>
              <article className="rm-card">
                <p className="rm-kicker">Chặng {i + 1}{status === "doing" ? " · đang học" : status === "done" ? " · đã xong" : ""}</p>
                <h2>{c.title}</h2>
                <p className="rm-blurb">{st.blurb}</p>
                <p className="rm-meta">{ps.filter((p) => p.ready).length} bài · {ps.filter((p) => p.video).length} có video</p>
                <Meter solved={sum(ps, "solved")} total={sum(ps, "total")} />
                <div className="rm-actions">
                  <a className="rm-go" href={`?bai=${nextOf(ps)}`}>{status === "todo" ? "Vào chặng" : status === "done" ? "Xem lại" : "Học tiếp"} →</a>
                  {st.labs.map((slug) => <a key={slug} className="rm-lab" href={`?bai=${slug}`}>{titleOf(slug).split(":")[0]}</a>)}
                </div>
                <details>
                  <summary>Danh sách {ps.length} bài</summary>
                  <LessonList ps={ps} />
                </details>
              </article>
            </li>
          );
        })}
        <li className="rm-stage rm-finish">
          <div className="rm-node" aria-hidden="true">★</div>
          <article className="rm-card">
            <p className="rm-kicker">Đích</p>
            <h2>Sẵn sàng phỏng vấn</h2>
            <p className="rm-blurb">Bài tổng hợp 20 câu đạt từ 17 trở lên, 8 câu chuyện STAR có số liệu thật, và luyện trọn một đề system design theo khung 7 bước.</p>
          </article>
        </li>
      </ol>

      <section className="rm-tracks">
        <h2>Đi kèm mỗi tuần</h2>
        <div className="rm-track-grid">
          {TRACKS.map((t) => {
            const c = courseById(t.id);
            const ps = c.lessons.map((l) => lessonProgress(l.slug));
            return (
              <article key={t.id} className="rm-card rm-track">
                <p className="rm-kicker">{t.when}</p>
                <h3>{c.title}</h3>
                <p className="rm-blurb">{t.blurb}</p>
                <Meter solved={sum(ps, "solved")} total={sum(ps, "total")} />
                <LessonList ps={ps} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
