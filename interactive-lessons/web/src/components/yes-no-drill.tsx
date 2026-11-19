import { useState } from "react";

export type DrillItem = { q: string; ok: boolean; why: string };

/** A list of statements the learner marks yes or no; each answer reveals why, with a score once all are answered. */
export function YesNoDrill({ prompt, items, yes, no, summary }: { prompt: React.ReactNode; items: DrillItem[]; yes: string; no: string; summary: string }) {
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const right = items.filter((it, n) => picked[n] === it.ok).length;
  return (
    <div className="widget">
      <p className="muted">{prompt}</p>
      <ul className="log">
        {items.map((it, n) => {
          const p = picked[n];
          return (
            <li key={it.q} className={p === undefined ? "" : p === it.ok ? "ok" : "err"}>
              <code>{it.q}</code>{" "}
              <span className="seg small">
                <button className={p === true ? "on" : ""} onClick={() => setPicked((s) => ({ ...s, [n]: true }))}>{yes}</button>
                <button className={p === false ? "on" : ""} onClick={() => setPicked((s) => ({ ...s, [n]: false }))}>{no}</button>
              </span>
              {p !== undefined && <small> {p === it.ok ? "Đúng." : "Chưa đúng."} {it.why}</small>}
            </li>
          );
        })}
      </ul>
      {Object.keys(picked).length === items.length && (
        <div className={`result ${right === items.length ? "good" : "bad"}`}>
          {right}/{items.length} câu đúng
          <small>{summary}</small>
        </div>
      )}
    </div>
  );
}
