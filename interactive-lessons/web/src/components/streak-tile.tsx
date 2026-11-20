import { streakInfo } from "../lib/streak";
import { NumberTicker } from "./ui/number-ticker";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Streak of consecutive study days plus a 7-day strip; reads the local study-day list. */
export function StreakTile({ className = "" }: { className?: string }) {
  const s = streakInfo();
  return (
    <article className={`rm-card tile streak-tile ${className} ${s.doneToday ? "lit" : ""}`}>
      <p className="rm-kicker">Chuỗi ngày học</p>
      <div className="streak-main">
        <span className="flame" aria-hidden>{s.current > 0 ? "🔥" : "✦"}</span>
        <strong><NumberTicker value={s.current} /></strong>
        <span className="streak-unit">ngày</span>
      </div>
      <ol className="streak-week" aria-label="7 ngày gần nhất">
        {s.week.map((d) => <li key={d.day.toISOString()} className={`${d.done ? "done" : ""} ${d.today ? "today" : ""}`}><i />{DOW[d.day.getDay()]}</li>)}
      </ol>
      <p className="tile-note">{s.doneToday ? "Hôm nay bạn đã học, giữ vững nhé." : s.current > 0 ? "Học một phần hôm nay để giữ chuỗi." : "Làm một quiz để bắt đầu chuỗi."}{s.best > 1 ? ` Kỷ lục: ${s.best} ngày.` : ""}</p>
    </article>
  );
}
