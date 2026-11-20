import { useEffect } from "react";
import { courses, lessons, type Course } from "./data/course";
import { programById, programCourses, programs, type Program } from "./data/programs";
import { LAST_KEY, lessonProgress, type LessonProgress } from "./progress";
import { useTheme } from "./use-theme";
import { ThemeToggle } from "./components/theme-toggle";
import { NumberTicker } from "./components/ui/number-ticker";
import { AccountButton } from "./components/account-button";

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

/** Opens a program's roadmap; an unknown or not-yet-available program goes back to the home page. */
export default function RoadmapPage() {
  const program = programById(new URLSearchParams(location.search).get("khoa"));
  if (!program?.roadmap) {
    location.replace(location.pathname);
    return null;
  }
  return <Roadmap program={program} />;
}

function Roadmap({ program }: { program: Program }) {
  const rm = program.roadmap!;
  const [theme, setTheme] = useTheme();
  const mine = programCourses(program);
  const mySlugs = new Set(mine.flatMap((c) => c.lessons.map((l) => l.slug)));
  const all = mine.flatMap((c) => c.lessons.map((l) => lessonProgress(l.slug)));
  const ready = all.filter((p) => p.ready);
  const last = localStorage.getItem(LAST_KEY);
  const hasLast = !!last && !!lessons[last] && mySlugs.has(last);
  const resume = hasLast ? (last as string) : nextOf(courseById(rm.stages[0].id).lessons.map((l) => lessonProgress(l.slug)));
  useEffect(() => { document.title = `${rm.title} · InterviewLab`; }, [rm.title]);

  return (
    <div className="rm-page">
      <header className="rm-top">
        <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <AccountButton />
      </header>

      <section className="rm-hero">
        {programs.length > 1 && <a className="rm-back" href={location.pathname}><span aria-hidden="true">←</span> Tất cả khoá học</a>}
        <p className="rm-kicker">{program.title} · {rm.kicker}</p>
        <h1>{rm.title}</h1>
        <p className="lead">{rm.lead}</p>
        <div className="rm-stats">
          <div><strong><NumberTicker value={ready.length} /></strong><span>bài học</span></div>
          <div><strong><NumberTicker value={ready.filter((p) => p.video).length} /></strong><span>bài có video</span></div>
          <div><strong><NumberTicker value={sum(all, "solved")} />/{sum(all, "total")}</strong><span>quiz đã đúng</span></div>
        </div>
        <a className="rm-cta" href={`?bai=${resume}`}>
          {hasLast ? "Học tiếp" : "Bắt đầu"}: {titleOf(resume)} <span aria-hidden="true">→</span>
        </a>
      </section>

      <ol className="rm-road">
        {rm.stages.map((st, i) => {
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
            <h2>{rm.finish.title}</h2>
            <p className="rm-blurb">{rm.finish.blurb}</p>
          </article>
        </li>
      </ol>

      {rm.tracks.length > 0 && (
        <section className="rm-tracks">
          <h2>Đi kèm mỗi tuần</h2>
          <div className="rm-track-grid">
            {rm.tracks.map((t) => {
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
      )}
    </div>
  );
}
