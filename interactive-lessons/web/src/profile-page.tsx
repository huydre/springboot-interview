import { useEffect } from "react";
import "./styles/profile.css";
import { useTheme } from "./use-theme";
import { ThemeToggle } from "./components/theme-toggle";
import { SearchButton } from "./components/command-search";
import { AccountButton } from "./components/account-button";
import { StreakTile } from "./components/streak-tile";
import { OverallTile, PracticeTile } from "./catalog-page";
import { programById, programCourses } from "./data/programs";
import { lessonProgress } from "./progress";
import { localIso, studyDays } from "./lib/streak";
import { srsState } from "./lib/review-deck";

const WEEKS = 16;
const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const BOX_LABEL = ["Mới / vừa sai", "Đúng 1 lần", "Đúng 2 lần", "Đúng 3 lần", "Đúng 4 lần", "Đúng 5+ lần"];
type MockResult = { date: string; stage: string; score: number };

/** Study days of the last 16 weeks as a calendar grid (columns are weeks, rows are weekdays). */
function StudyCalendar() {
  const done = new Set(studyDays());
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const iso = localIso(d);
    return { iso, future: d > today, on: done.has(iso) };
  });
  const count = cells.filter((c) => c.on).length;
  return (
    <article className="rm-card pf-card">
      <p className="rm-kicker">Lịch học {WEEKS} tuần</p>
      <p className="pf-big"><strong>{count}</strong> ngày có học</p>
      <div className="pf-cal" role="img" aria-label={`${count} ngày có học trong ${WEEKS} tuần gần nhất`}>
        <div className="pf-cal-dow">{DOW.map((d, i) => <span key={d}>{i % 2 ? d : ""}</span>)}</div>
        <div className="pf-cal-grid">
          {cells.map((c) => <i key={c.iso} title={c.iso} className={c.future ? "future" : c.on ? "on" : ""} />)}
        </div>
      </div>
    </article>
  );
}

/** Quiz progress of every stage of the Java Interview roadmap as horizontal bars. */
function StageBars() {
  const program = programById("java-interview");
  const stageIds = new Set(program?.roadmap?.stages.map((s) => s.id) ?? []);
  const rows = (program ? programCourses(program) : []).filter((c) => stageIds.has(c.id)).map((c) => {
    const ps = c.lessons.map((l) => lessonProgress(l.slug));
    const solved = ps.reduce((n, x) => n + x.solved, 0), total = ps.reduce((n, x) => n + x.total, 0);
    return { id: c.id, title: c.title, solved, total, pct: total ? Math.round((solved / total) * 100) : 0 };
  });
  return (
    <article className="rm-card pf-card pf-wide">
      <p className="rm-kicker">Tiến độ theo chặng (quiz đã đúng)</p>
      <ol className="pf-bars">
        {rows.map((r, i) => (
          <li key={r.id}>
            <span className="pf-bar-label"><b>{i + 1}</b> {r.title}</span>
            <span className="pf-bar"><i style={{ width: `${r.pct}%` }} /></span>
            <span className="pf-bar-num">{r.solved}/{r.total}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

/** How many review items sit in each spaced-repetition box, and how many are due today. */
function ReviewBoxes() {
  const cards = Object.values(srsState());
  const today = localIso(new Date());
  const counts = BOX_LABEL.map((_, b) => cards.filter((c) => c.box === b).length);
  const max = Math.max(1, ...counts);
  const due = cards.filter((c) => c.due <= today).length;
  return (
    <article className="rm-card pf-card">
      <p className="rm-kicker">Ôn tập ngắt quãng (số câu theo mức thuộc)</p>
      <p className="pf-big"><strong>{cards.length}</strong> câu đang theo dõi · {due} câu đến hạn</p>
      <div className="pf-cols" role="img" aria-label="Số câu theo khoảng cách ôn lại">
        {counts.map((n, b) => (
          <div key={b} className="pf-col">
            <span className="pf-col-num">{n}</span>
            <span className="pf-col-bar"><i style={{ height: `${(n / max) * 100}%` }} /></span>
            <span className="pf-col-label">{BOX_LABEL[b]}</span>
          </div>
        ))}
      </div>
      <a className="rm-go" href="?luyen=on-tap">Ôn tập hôm nay →</a>
    </article>
  );
}

/** The last mock interviews with their score out of 5. */
function MockHistory() {
  let list: MockResult[] = [];
  try { list = JSON.parse(localStorage.getItem("interviewlab.mock.history") || "[]"); } catch { list = []; }
  const nameOf = (id: string) => (id === "all" ? "Tất cả các chặng" : programCourses(programById("java-interview")!).find((c) => c.id === id)?.title ?? id);
  return (
    <article className="rm-card pf-card pf-wide">
      <p className="rm-kicker">Mock interview gần đây (điểm trên 5)</p>
      {list.length === 0 ? (
        <p className="tile-note">Chưa làm lần nào. Thử 5 câu bấm giờ để xem mình đang ở đâu.</p>
      ) : (
        <ol className="pf-mock">
          {list.slice(0, 8).map((m, i) => (
            <li key={i}>
              <span className="pf-mock-name">{nameOf(m.stage)}<small>{m.date}</small></span>
              <span className="pf-dots" aria-label={`${m.score} trên 5`}>{Array.from({ length: 5 }, (_, k) => <i key={k} className={k < m.score ? "on" : ""} />)}</span>
            </li>
          ))}
        </ol>
      )}
      <a className="rm-go" href="?luyen=mock">Làm mock interview →</a>
    </article>
  );
}

/** "Hồ sơ học tập": every progress chart in one place. All numbers come from this browser (synced when signed in). */
export default function ProfilePage() {
  const [theme, setTheme] = useTheme();
  useEffect(() => { document.title = "Hồ sơ học tập · InterviewLab"; }, []);
  return (
    <div className="rm-page pf-page">
      <header className="rm-top">
        <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
        <SearchButton />
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <AccountButton />
      </header>
      <section className="rm-hero">
        <a className="rm-back" href={location.pathname}><span aria-hidden="true">←</span> Trang chủ</a>
        <h1>Hồ sơ học tập</h1>
        <p className="lead">Chuỗi ngày học, tiến độ từng chặng, ôn tập và mock interview của bạn. Số liệu lưu trên trình duyệt này; đăng nhập để giữ tiến độ trên mọi thiết bị.</p>
      </section>
      <section className="home-stats" aria-label="Tổng quan">
        <StreakTile className="b-streak" />
        <OverallTile />
        <PracticeTile />
      </section>
      <div className="pf-grid">
        <StudyCalendar />
        <ReviewBoxes />
        <StageBars />
        <MockHistory />
      </div>
    </div>
  );
}
