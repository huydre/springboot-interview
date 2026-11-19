import { useState } from "react";
import { RichText } from "./rich-text";

/** `choices` overrides the shared choices for one row, for drills that mix topics. */
export type ChoiceItem = { q: string; a: string; why: string; choices?: readonly string[] };

/** Each row is a situation; the learner picks one of the shared choices and sees why, with a score once all are answered. */
export function ChoiceDrill({ items, choices = [], summary }: { items: ChoiceItem[]; choices?: readonly string[]; summary: string }) {
  const [picked, setPicked] = useState<Record<number, string>>({});
  const right = items.filter((c, n) => picked[n] === c.a).length;
  return (
    <div className="widget">
      <ul className="log">
        {items.map((c, n) => {
          const p = picked[n];
          return (
            <li key={c.q} className={p === undefined ? "" : p === c.a ? "ok" : "err"}>
              <RichText text={c.q} />{" "}
              <span className="seg small">
                {(c.choices ?? choices).map((ch) => (
                  <button key={ch} className={p === ch ? "on" : ""} onClick={() => setPicked((s) => ({ ...s, [n]: ch }))}>{ch}</button>
                ))}
              </span>
              {p !== undefined && <small> {p === c.a ? "Đúng." : `Nên là ${c.a}.`} <RichText text={c.why} /></small>}
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
