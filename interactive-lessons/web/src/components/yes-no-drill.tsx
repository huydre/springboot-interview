import { useState } from "react";
import { ProgressBar } from "./ui/progress-bar";
import { usePerfectCelebration } from "../lib/use-perfect-celebration";
export type DrillItem = { q: string; ok: boolean; why: string };

/** A list of statements the learner marks yes or no; each answer reveals why, with a score once all are answered. */
export function YesNoDrill({ prompt, items, yes, no, summary }: { prompt: React.ReactNode; items: DrillItem[]; yes: string; no: string; summary: string }) {
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const right = items.filter((it, n) => picked[n] === it.ok).length;
  const answered = Object.keys(picked).length;
  const root = usePerfectCelebration(answered, right, items.length);
  return (
    <div className="widget" ref={root}>
      <p className="muted">{prompt}</p>
      <ProgressBar done={answered} total={items.length} />
      <div className="dq-list">
        {items.map((it, n) => {
          const p = picked[n];
          const done = p !== undefined;
          return (
            <article key={it.q} className={`dq ${done ? (p === it.ok ? "ok" : "err") : ""}`}>
              <span className="dq-n">{n + 1}</span>
              <div className="dq-body">
                <p className="dq-q"><code>{it.q}</code></p>
                <div className="dq-opts">
                  {[true, false].map((v) => (
                    <button key={String(v)} disabled={done} className={`dq-opt ${p === v ? "picked" : ""} ${done && v === it.ok ? "truth" : ""}`} onClick={() => setPicked((s) => ({ ...s, [n]: v }))}>{v ? yes : no}</button>
                  ))}
                </div>
                {done && <p className="dq-why"><strong>{p === it.ok ? "Đúng." : "Chưa đúng."}</strong> {it.why}</p>}
              </div>
            </article>
          );
        })}
      </div>
      {Object.keys(picked).length === items.length && (
        <div className={`result ${right === items.length ? "good" : "bad"}`}>
          {right}/{items.length} câu đúng
          <small>{summary}</small>
        </div>
      )}
    </div>
  );
}
