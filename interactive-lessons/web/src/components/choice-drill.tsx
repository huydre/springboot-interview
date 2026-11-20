import { useState } from "react";
import { RichText } from "./rich-text";
import { ProgressBar } from "./ui/progress-bar";

/** `choices` overrides the shared choices for one row, for drills that mix topics. */
export type ChoiceItem = { q: string; a: string; why: string; choices?: readonly string[] };

/** Each row is a situation; the learner picks one of the shared choices and sees why, with a score once all are answered. */
export function ChoiceDrill({ items, choices = [], summary }: { items: ChoiceItem[]; choices?: readonly string[]; summary: string }) {
  const [picked, setPicked] = useState<Record<number, string>>({});
  const right = items.filter((c, n) => picked[n] === c.a).length;
  const answered = Object.keys(picked).length;
  return (
    <div className="widget">
      <ProgressBar done={answered} total={items.length} />
      <div className="dq-list">
        {items.map((c, n) => {
          const p = picked[n];
          const done = p !== undefined;
          return (
            <article key={c.q} className={`dq ${done ? (p === c.a ? "ok" : "err") : ""}`}>
              <span className="dq-n">{n + 1}</span>
              <div className="dq-body">
                <p className="dq-q"><RichText text={c.q} /></p>
                <div className="dq-opts">
                  {(c.choices ?? choices).map((ch) => (
                    <button key={ch} disabled={done} className={`dq-opt ${p === ch ? "picked" : ""} ${done && ch === c.a ? "truth" : ""}`} onClick={() => setPicked((s) => ({ ...s, [n]: ch }))}>{ch}</button>
                  ))}
                </div>
                {done && (
                  <p className="dq-why">
                    <strong>{p === c.a ? "Đúng." : `Nên là ${c.a}.`}</strong> <RichText text={c.why} />
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {answered === items.length && (
        <div className={`result ${right === items.length ? "good" : "bad"}`}>
          {right}/{items.length} câu đúng
          <small>{summary}</small>
        </div>
      )}
    </div>
  );
}
