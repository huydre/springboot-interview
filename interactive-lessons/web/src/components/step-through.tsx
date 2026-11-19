import { useState } from "react";

export type Step = { step: string; detail?: string; note?: string; highlight?: boolean };

/** An ordered list the learner walks with previous/next; the current step shows its detail and note below. */
export function StepThrough({ steps }: { steps: Step[] }) {
  const [i, setI] = useState(0);
  const s = steps[i];
  return (
    <div className="widget">
      <div className="seg small">
        <button onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>◀ trước</button>
        <button onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))} disabled={i === steps.length - 1}>tiếp ▶</button>
      </div>
      <ol className="log">
        {steps.map((x, n) => <li key={x.step} className={n === i ? "ok" : n > i ? "muted" : ""}>{x.step}</li>)}
      </ol>
      <div className={`result ${s.highlight ? "good" : ""}`}>
        {s.step}{s.detail && ` · ${s.detail}`}
        {s.note && <small>{s.note}</small>}
      </div>
    </div>
  );
}
