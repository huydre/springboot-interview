import { useState } from "react";
import { RichText } from "../components/rich-text";
import { weeklyCards } from "../data/weekly-quiz-cards";
import { Code } from "../components/code-block";

type Mark = "ok" | "miss";
const KEY = "weekly-recall-marks";

/** Marks survive reloads so missed cards can be redone next week (spaced repetition, as study note 07 asks). */
function loadMarks(): Record<string, Mark> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

/** Recall first, then reveal: answer aloud before flipping, then mark yourself right or wrong. */
export function RecallCardsWidget() {
  const [week, setWeek] = useState(0);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>(loadMarks);
  const cards = weeklyCards[week].cards;
  const c = cards[i];
  const id = (w: number, n: number) => `${w}-${n}`;
  const mark = (m: Mark) => {
    const next = { ...marks, [id(week, i)]: m };
    setMarks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setShown(false);
    setI((n) => Math.min(cards.length - 1, n + 1));
  };
  const go = (w: number) => { setWeek(w); setI(0); setShown(false); };
  const missed = cards.map((_, n) => n).filter((n) => marks[id(week, n)] === "miss");
  const done = cards.filter((_, n) => marks[id(week, n)]).length;
  return (
    <div className="widget">
      <div className="seg small">
        {weeklyCards.map((w, n) => {
          const miss = w.cards.filter((_, k) => marks[id(n, k)] === "miss").length;
          return <button key={w.title} className={week === n ? "on" : ""} onClick={() => go(n)}>Tuần {n + 1}{miss ? ` · ${miss} sai` : ""}</button>;
        })}
      </div>
      <p className="muted">{weeklyCards[week].title} · câu {i + 1}/{cards.length} · đã chấm {done}</p>
      <div className="result">
        <span><RichText text={c.q} /></span>
        {c.code && <Code>{c.code}</Code>}
      </div>
      {!shown ? (
        <div className="seg small"><button onClick={() => setShown(true)}>Tự trả lời trước, rồi lật đáp án</button></div>
      ) : (
        <>
          <ul className="log">{c.a.split("\n").map((l, n) => <li key={n}><RichText text={l} /></li>)}</ul>
          <div className="seg small">
            <button onClick={() => mark("ok")}>Nhớ được</button>
            <button className="bad" onClick={() => mark("miss")}>Sai hoặc ấp úng</button>
          </div>
        </>
      )}
      <div className="seg small">
        <button onClick={() => { setI((n) => Math.max(0, n - 1)); setShown(false); }} disabled={i === 0}>◀ câu trước</button>
        <button onClick={() => { setI((n) => Math.min(cards.length - 1, n + 1)); setShown(false); }} disabled={i === cards.length - 1}>câu sau ▶</button>
      </div>
      {missed.length > 0 && (
        <p className="muted">
          Câu đánh dấu sai tuần này: {missed.map((n) => n + 1).join(", ")}. Làm lại ở tuần sau.{" "}
          <button className="btn ghost" onClick={() => { setI(missed[0]); setShown(false); }}>tới câu sai đầu tiên</button>
        </p>
      )}
    </div>
  );
}
