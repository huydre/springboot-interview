import { useState, type ReactNode } from "react";
import { Code } from "./code-block";
import { RichText } from "./rich-text";
import { StatusIcon } from "./ui/status-icon";

export type Outcome = { text: string; kind: "ok" | "err" };
export type Scenario = { ask: string; outcome: Outcome[] };
export type Variant = {
  label: string;
  code: string;
  scenarios: Scenario[];
  verdict: string;
  /** Optional picture shown above the code (for example who depends on whom). */
  extra?: ReactNode;
};

/** Two ways to write the same thing. Pick a way, and every change request is answered side by side: one click, nothing hidden. */
export function ChangeImpact({ variants }: { variants: [Variant, Variant] }) {
  const [v, setV] = useState(0);
  const cur = variants[v];
  return (
    <div className="widget">
      <p className="co-step">Bước 1 · Chọn cách viết</p>
      <div className="seg">
        {variants.map((x, i) => <button key={x.label} className={v === i ? "on" : ""} onClick={() => setV(i)}>{x.label}</button>)}
      </div>
      {cur.extra}
      <Code>{cur.code}</Code>
      <p className="co-step">Bước 2 · Cùng yêu cầu thay đổi, cách này phải sửa gì?</p>
      <div className="co-grid" key={v}>
        {cur.scenarios.map((s) => (
          <div key={s.ask} className="co-card">
            <b><RichText text={s.ask} /></b>
            {s.outcome.map((o, i) => (
              <p key={i} className={`co ${o.kind}`}><StatusIcon kind={o.kind} /><span className="co-text"><RichText text={o.text} /></span></p>
            ))}
          </div>
        ))}
      </div>
      <div className="result">{cur.verdict}</div>
    </div>
  );
}
