import { useState } from "react";

type Owner = "interface" | "abstract" | "both";
const ITEMS: { text: string; owner: Owner; why: string }[] = [
  { text: "Một class dùng được nhiều cái cùng lúc", owner: "interface", why: "implements nhiều interface, nhưng chỉ extends 1 class" },
  { text: "Có constructor", owner: "abstract", why: "để khởi tạo state chung, gọi qua super(...)" },
  { text: "Có field instance (state)", owner: "abstract", why: "interface chỉ có hằng số static final" },
  { text: "Có method dùng từ khoá default", owner: "interface", why: "default method (Java 8) chỉ có trong interface" },
  { text: "Có method protected", owner: "abstract", why: "method của interface luôn public (trừ private helper)" },
  { text: "Có method abstract", owner: "both", why: "cả hai đều khai báo được method chưa có thân" },
  { text: "Không new trực tiếp được", owner: "both", why: "cả hai đều không khởi tạo trực tiếp" },
  { text: "Có static method", owner: "both", why: "interface có static method từ Java 8" },
];
const LABEL: Record<Owner, string> = { interface: "Interface", abstract: "Abstract class", both: "Cả hai" };

/** Classification game: which feature belongs to interface, abstract class, or both. */
export function ClassifyWidget() {
  const [answers, setAnswers] = useState<Record<number, Owner>>({});
  const score = ITEMS.filter((it, i) => answers[i] === it.owner).length;
  const done = Object.keys(answers).length === ITEMS.length;

  return (
    <div className="widget">
      <ul className="classify">
        {ITEMS.map((it, i) => {
          const a = answers[i];
          return (
            <li key={i} className={a ? (a === it.owner ? "ok" : "no") : ""}>
              <span className="stmt">{it.text}</span>
              <div className="seg small">
                {(["interface", "abstract", "both"] as Owner[]).map((o) => (
                  <button key={o} disabled={!!a} className={a === o ? "on" : a && o === it.owner ? "truth" : ""} onClick={() => setAnswers((s) => ({ ...s, [i]: o }))}>
                    {LABEL[o]}
                  </button>
                ))}
              </div>
              {a && <small className="why">{a === it.owner ? "✓ " : `✕ Đáp án: ${LABEL[it.owner]}. `}{it.why}</small>}
            </li>
          );
        })}
      </ul>
      <div className="actions">
        <span className="score">{done ? `Kết quả: ${score}/${ITEMS.length}` : `Đã trả lời ${Object.keys(answers).length}/${ITEMS.length}`}</span>
        <button className="btn ghost" onClick={() => setAnswers({})}>Làm lại</button>
      </div>
    </div>
  );
}
