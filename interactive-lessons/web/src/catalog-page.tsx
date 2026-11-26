import { lessons } from "./data/course";
import { programCourses, programOfCourse, programs, type Program } from "./data/programs";
import { LAST_KEY, lessonProgress } from "./progress";
import { courseOf } from "./data/course";
import { useTheme } from "./use-theme";
import { ThemeToggle } from "./components/theme-toggle";
import { SearchButton } from "./components/command-search";
import { OnlineCount } from "./components/online-count";
import { StreakTile } from "./components/streak-tile";
import { ProgressRing } from "./components/ui/progress-ring";
import { NumberTicker } from "./components/ui/number-ticker";
import { AccountButton } from "./components/account-button";
import { dueCount, todayDeck } from "./lib/review-deck";

/** Lesson progress summed over every lesson of a program. */
function stats(p: Program) {
  const ps = programCourses(p).flatMap((c) => c.lessons.map((l) => lessonProgress(l.slug)));
  const ready = ps.filter((x) => x.ready);
  const solved = ps.reduce((n, x) => n + x.solved, 0);
  const total = ps.reduce((n, x) => n + x.total, 0);
  return { lessons: ready.length, videos: ready.filter((x) => x.video).length, solved, total };
}

/** Mini roadmap for the featured card: each stage with its own quiz progress. */
function StagePath({ p }: { p: Program }) {
  const stages = programCourses(p).filter((c) => p.roadmap?.stages.some((st) => st.id === c.id));
  return (
    <ol className="cat-stages" style={{ "--rows": Math.ceil(stages.length / 2) } as React.CSSProperties}>
      {stages.map((c, i) => {
        const ps = c.lessons.map((l) => lessonProgress(l.slug));
        const solved = ps.reduce((n, x) => n + x.solved, 0), total = ps.reduce((n, x) => n + x.total, 0);
        const pct = total ? solved / total : 0;
        return (
          <li key={c.id} className={pct === 1 ? "done" : pct > 0 ? "doing" : ""}>
            <span className="cs-node">{pct === 1 ? "✓" : i + 1}</span>
            <span className="cs-title" title={c.title}><span className="cat-stage-name">{c.title}</span><small>{c.lessons.length} bài</small></span>
            <span className="cs-pct">{Math.round(pct * 100)}%</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Each course gets its own colour and short badge so the cards are told apart at a glance. */
const LOOK: Record<string, { color: string; badge: string }> = {
  "java-interview": { color: "#1cb0f6", badge: "Java" },
  "sql-basics": { color: "#58cc02", badge: "SQL" },
  "kafka-course": { color: "#a560e8", badge: "Kafka" },
};

function ProgramCard({ p, className = "" }: { p: Program; className?: string }) {
  const look = LOOK[p.id] ?? { color: "var(--accent)", badge: p.title.slice(0, 4) };
  const open = p.status === "ready";
  const featured = className.includes("b-main") && open;
  const s = open && !p.href ? stats(p) : null;
  const pct = s && s.total ? Math.round((s.solved / s.total) * 100) : 0;
  const body = (
    <div className="cat-body">
      <div className="cat-head">
        <span className="cat-badge">{look.badge}</span>
        <div>
          <p className="rm-kicker">{p.level}{open ? "" : " · sắp có"}</p>
          <h2>{p.title}</h2>
        </div>
      </div>
      <p className="rm-blurb">{p.blurb}</p>
      <ul className="cat-topics">{p.topics.slice(0, 4).map((t) => <li key={t}>{t}</li>)}{p.topics.length > 4 && <li className="more">+{p.topics.length - 4}</li>}</ul>
      {p.meta && <p className="rm-meta">{p.meta}</p>}
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
        {open ? <a className="rm-go" href={p.href ?? `?khoa=${p.id}`}>{s && s.solved > 0 ? "Học tiếp" : "Vào khoá"} →</a> : <span className="cat-soon">Đang chuẩn bị nội dung</span>}
      </div>
    </div>
  );
  return (
    <article className={`rm-card cat-card ${className} ${open ? "" : "soon"} ${featured ? "cat-feature" : ""}`} style={{ "--course": look.color } as React.CSSProperties}>
      {body}
      {featured && <StagePath p={p} />}
    </article>
  );
}

/** Today's practice: how many review items are left, with a shortcut to each practice mode. */
function PracticeTile() {
  const deck = todayDeck();
  const left = deck.ids.length - Object.keys(deck.results).length;
  const due = dueCount();
  return (
    <article className="rm-card tile b-practice">
      <p className="rm-kicker">Luyện tập hôm nay</p>
      <p className="pt-big">{left > 0 ? <><strong>{left}</strong> câu cần ôn</> : <>Đã ôn xong <span aria-hidden="true">🎉</span></>}</p>
      <p className="tile-note">{due > 0 ? `${due} câu đến hạn ôn lại (câu từng sai quay lại trước).` : "Mỗi ngày 10 câu theo lịch giãn cách, tính vào chuỗi ngày học."}</p>
      <a className="rm-go" href="?luyen=on-tap">{left > 0 ? "Ôn tập ngay" : "Xem lại hôm nay"} →</a>
      <div className="pt-links">
        <a href="?luyen=mock">Mock interview</a>
        <a href="?luyen=sd">System design</a>
        <a href="?luyen=cau-hoi">Câu hỏi hay gặp</a>
      </div>
    </article>
  );
}

/** Quiz progress across every ready program, as a ring, with lesson and video counts. */
function OverallTile() {
  const all = programs.filter((p) => p.status === "ready").map(stats);
  const solved = all.reduce((n, s) => n + s.solved, 0);
  const total = all.reduce((n, s) => n + s.total, 0);
  const lessonsN = all.reduce((n, s) => n + s.lessons, 0);
  const videos = all.reduce((n, s) => n + s.videos, 0);
  return (
    <article className="rm-card tile b-ring">
      <p className="rm-kicker">Tổng tiến độ</p>
      <div className="ring-row">
        <ProgressRing value={total ? solved / total : 0} size={92} stroke={10} label={`Đã đúng ${solved} trên ${total} quiz`}>
          <b><NumberTicker value={total ? Math.round((solved / total) * 100) : 0} />%</b>
        </ProgressRing>
        <ul className="tile-stats">
          <li><strong><NumberTicker value={solved} /></strong><span>quiz đúng</span></li>
          <li><strong><NumberTicker value={lessonsN} /></strong><span>bài học</span></li>
          <li><strong><NumberTicker value={videos} /></strong><span>video</span></li>
        </ul>
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
        <OnlineCount />
        <SearchButton />
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <AccountButton />
      </header>

      <section className="rm-hero home-hero">
        <p className="rm-kicker">InterviewLab</p>
        <h1>Học để nói được trong buổi phỏng vấn</h1>
        <p className="lead">Bài học tương tác, video và quiz cho Java Backend. Tiến độ lưu trên trình duyệt; đăng nhập để giữ tiến độ trên mọi thiết bị.</p>
        {lastLesson && lastProgram?.status === "ready" && (
          <a className="rm-cta" href={`?bai=${lastLesson.slug}`}>Học tiếp: {lastLesson.crumb} <span aria-hidden="true">→</span></a>
        )}
      </section>

      <section className="home-stats" aria-label="Tiến độ của bạn">
        <StreakTile className="b-streak" />
        <OverallTile />
        <PracticeTile />
      </section>

      <div className="bento">
        {programs[0] && <ProgramCard p={programs[0]} className="b-main" />}
        {programs.slice(1).map((p) => <ProgramCard key={p.id} p={p} className="b-wide" />)}
      </div>
    </div>
  );
}
