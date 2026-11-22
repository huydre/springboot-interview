import { useState } from "react";
import { RichText } from "./rich-text";

export type CheatRow = { name: string; one: string; say: string };

/** Rows of "idea + one line"; click a row to reveal the sentence to say in an interview. Only one row is open at a time. */
export function CheatSheet({ rows }: { rows: CheatRow[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="widget">
      <div className="cs-list">
        {rows.map((r, i) => (
          <div key={r.name} className={`cs ${open === i ? "open" : ""}`}>
            <button className="cs-head" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span className="cs-name">{r.name}</span>
              <span className="cs-one"><RichText text={r.one} /></span>
              <span className="cs-chev" aria-hidden>›</span>
            </button>
            {open === i && (
              <div className="cs-say">
                <small>Khi phỏng vấn nói</small>
                <p>“<RichText text={r.say} />”</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
