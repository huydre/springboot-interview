import { useState } from "react";
import { Code } from "./code-block";
import { RichText } from "./rich-text";

export type Outcome = { text: string; kind: "ok" | "err" };
export type Scenario = { ask: string; outcome: Outcome[] };
export type Variant = { label: string; code: string; scenarios: Scenario[]; verdict: string };

/** Two ways to write the same thing: pick one, then fire change requests at it and see what has to be edited. */
export function ChangeImpact({ variants }: { variants: [Variant, Variant] }) {
  const [v, setV] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const cur = variants[v];
  const sc = picked === null ? null : cur.scenarios[picked];
  return (
    <div className="widget">
      <div className="seg">
        {variants.map((x, i) => <button key={x.label} className={v === i ? "on" : ""} onClick={() => { setV(i); setPicked(null); }}>{x.label}</button>)}
      </div>
      <Code>{cur.code}</Code>
      <p className="muted">Yêu cầu thay đổi, bấm để xem phải sửa gì:</p>
      <div className="seg small">
        {cur.scenarios.map((s, i) => <button key={s.ask} className={picked === i ? "on" : ""} onClick={() => setPicked(i)}>{s.ask}</button>)}
      </div>
      {sc && (
        <div className="co-list">
          {sc.outcome.map((o, i) => (
            <p key={i} className={`co ${o.kind}`}><span aria-hidden>{o.kind === "ok" ? "✓" : "✕"}</span><RichText text={o.text} /></p>
          ))}
        </div>
      )}
      <div className="result">{cur.verdict}</div>
    </div>
  );
}
