import { lessons } from "./data/course";
import { programCourses, programOfCourse, programs, type Program } from "./data/programs";
import { LAST_KEY, lessonProgress } from "./progress";
import { courseOf } from "./data/course";
import { useTheme } from "./use-theme";

/** Lesson progress summed over every lesson of a program. */
function stats(p: Program) {
  const ps = programCourses(p).flatMap((c) => c.lessons.map((l) => lessonProgress(l.slug)));
  const ready = ps.filter((x) => x.ready);
  const solved = ps.reduce((n, x) => n + x.solved, 0);
  const total = ps.reduce((n, x) => n + x.total, 0);
  return { lessons: ready.length, videos: ready.filter((x) => x.video).length, solved, total };
}

function ProgramCard({ p }: { p: Program }) {
  const open = p.status === "ready";
  const s = open ? stats(p) : null;
  const pct = s && s.total ? Math.round((s.solved / s.total) * 100) : 0;
  return (
    <article className={`rm-card cat-card ${open ? "" : "soon"}`}>
      <p className="rm-kicker">{p.level}{open ? "" : " · sắp có"}</p>
      <h2>{p.title}</h2>
      <p className="rm-blurb">{p.blurb}</p>
      <ul className="cat-topics">{p.topics.map((t) => <li key={t}>{t}</li>)}</ul>
      {s && (
        <>
          <p className="rm-meta">{s.lessons} bài · {s.videos} có video</p>
          <div className="rm-meter" aria-label={`Đã đúng ${s.solved} trên ${s.total} quiz`}>
            <i style={{ width: `${pct}%` }} />
            <span>{pct}%</span>
          </div>
        </>
      )}
      <div className="rm-actions">
        {open ? <a className="rm-go" href={`?khoa=${p.id}`}>{s && s.solved > 0 ? "Học tiếp" : "Vào khoá"} →</a> : <span className="cat-soon">Đang chuẩn bị nội dung</span>}
      </div>
    </article>
  );
}

document.title = "Chọn khoá học · InterviewLab";

export default function CatalogPage() {
  const [theme, setTheme] = useTheme();
  const last = localStorage.getItem(LAST_KEY);
  const lastLesson = last ? lessons[last] : undefined;
  const lastProgram = lastLesson ? programOfCourse(courseOf(lastLesson.slug).id) : undefined;
  return (
    <div className="rm-page">
      <header className="rm-top">
        <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
        <button className="icon-btn" aria-label="Đổi giao diện sáng tối" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </header>

      <section className="rm-hero">
        <p className="rm-kicker">Khoá học</p>
        <h1>Chọn khoá học để bắt đầu</h1>
        <p className="lead">Mỗi khoá có lộ trình riêng, bài học tương tác và quiz. Tiến độ của từng khoá được lưu ngay trên trình duyệt của bạn.</p>
        {lastLesson && lastProgram?.status === "ready" && (
          <a className="rm-cta" href={`?bai=${lastLesson.slug}`}>Học tiếp: {lastLesson.crumb} <span aria-hidden="true">→</span></a>
        )}
      </section>

      <div className="cat-grid">{programs.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
    </div>
  );
}
