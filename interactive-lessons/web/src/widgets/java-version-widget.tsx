import { useState } from "react";

const VERSIONS = ["8", "10", "11", "14", "15", "16", "17", "21"] as const;
type Version = (typeof VERSIONS)[number];

/** Which Java release made each feature final (standard, not preview); from the lesson's version map. */
const FEATURES: { feature: string; answer: Version }[] = [
  { feature: "Lambda, Stream, Optional", answer: "8" },
  { feature: "var cho biến local", answer: "10" },
  { feature: "HttpClient, String.isBlank()", answer: "11" },
  { feature: "Switch expression (case ... ->)", answer: "14" },
  { feature: 'Text block """...""" ', answer: "15" },
  { feature: "record, pattern matching instanceof, Stream.toList()", answer: "16" },
  { feature: "sealed class/interface (mức tối thiểu của Spring Boot 3)", answer: "17" },
  { feature: "Virtual threads, pattern matching cho switch, Sequenced Collections", answer: "21" },
];

export function JavaVersionWidget() {
  const [picked, setPicked] = useState<Record<number, Version>>({});
  const score = FEATURES.filter((f, i) => picked[i] === f.answer).length;
  return (
    <div className="widget">
      <ul className="classify">
        {FEATURES.map((f, i) => {
          const p = picked[i];
          return (
            <li key={f.feature} className={p ? (p === f.answer ? "ok" : "no") : ""}>
              <span>{f.feature}</span>
              <div className="seg small">
                {VERSIONS.map((v) => <button key={v} className={p === v ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: v }))}>{v}</button>)}
              </div>
              {p && <span className="why">{p === f.answer ? `✓ Java ${f.answer}${["8", "11", "17", "21"].includes(f.answer) ? " (LTS)" : ""}` : `✕ là Java ${f.answer}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{FEATURES.length}</span></div>
    </div>
  );
}
