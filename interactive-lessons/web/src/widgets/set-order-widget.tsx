import { useState } from "react";
import { bucketIndex, stringHash } from "./java-hash";

/**
 * Iteration order of the three Sets for the same insertions.
 * HashSet: buckets in index order, and within a bucket the insertion order (nodes are appended, resize keeps order).
 * Capacity starts at 16 and doubles whenever size > capacity × 0.75. Matches JDK 21 on the sample word lists.
 */
function hashSetOrder(words: string[]) {
  const unique = [...new Set(words)];
  let capacity = 16;
  while (unique.length > capacity * 0.75) capacity *= 2;
  return unique
    .map((w, i) => ({ w, i, b: bucketIndex(stringHash(w), capacity) }))
    .sort((x, y) => x.b - y.b || x.i - y.i)
    .map((x) => x.w);
}

const SAMPLES = ["banana apple cherry date", "java kotlin go rust scala", "an binh chi dung giang hoa khanh lan minh oanh phuc quang son tam"];

export function SetOrderWidget() {
  const [text, setText] = useState(SAMPLES[0]);
  const words = text.split(/[\s,]+/).filter(Boolean);
  const unique = [...new Set(words)];
  const rows = [
    { name: "HashSet", order: hashSetOrder(words), note: "theo bucket: không đảm bảo, có thể đổi sau resize", tone: "" },
    { name: "LinkedHashSet", order: unique, note: "thứ tự chèn", tone: "good" },
    { name: "TreeSet", order: [...unique].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), note: "sắp xếp theo compareTo", tone: "good" },
  ];
  return (
    <div className="widget">
      <label className="pick">
        <span>thêm lần lượt</span>
        <input className="text-input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Các phần tử thêm vào set" />
      </label>
      <div className="seg small">
        {SAMPLES.map((s, i) => <button key={s} className={text === s ? "on" : ""} onClick={() => setText(s)}>mẫu {i + 1}</button>)}
      </div>
      {rows.map((r) => (
        <div key={r.name} className={`result ${r.tone}`}>
          {r.name} [{r.order.join(", ")}]
          <small>{r.note}</small>
        </div>
      ))}
    </div>
  );
}
