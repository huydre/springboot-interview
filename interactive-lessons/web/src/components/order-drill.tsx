import { useState } from "react";

/** Stable shuffle so the pool order does not change between renders: sort by a string hash of each step. */
function shuffled(steps: string[]): string[] {
  const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  return [...steps].sort((a, b) => h(a) - h(b));
}

/**
 * Feynman-style recall: the learner rebuilds a mechanism by clicking its steps in order.
 * A wrong pick is counted and flagged; the right pick moves to the rebuilt list.
 */
export function OrderDrill({ steps, done }: { steps: string[]; done: string }) {
  const [got, setGot] = useState(0);
  const [miss, setMiss] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const pool = shuffled(steps).filter((s) => steps.indexOf(s) >= got);
  const pick = (s: string) => {
    if (s === steps[got]) { setGot(got + 1); setWrong(null); }
    else { setMiss(miss + 1); setWrong(s); }
  };
  const finished = got === steps.length;
  return (
    <div className="widget">
      <ol className="log">
        {steps.slice(0, got).map((s) => <li key={s} className="ok">{s}</li>)}
        {!finished && <li className="muted">bước {got + 1} là gì?</li>}
      </ol>
      {!finished && (
        <div className="seg small">
          {pool.map((s) => <button key={s} className={wrong === s ? "bad" : ""} onClick={() => pick(s)}>{s}</button>)}
        </div>
      )}
      {wrong && <p className="muted">Chưa đúng: "{wrong}" chưa tới lượt.</p>}
      {finished && (
        <div className={`result ${miss === 0 ? "good" : "bad"}`}>
          Dựng lại xong, chọn sai {miss} lần
          <small>{done}</small>
        </div>
      )}
      <div className="seg small">
        <button onClick={() => { setGot(0); setMiss(0); setWrong(null); }}>làm lại</button>
      </div>
    </div>
  );
}
