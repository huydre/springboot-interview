import { useState } from "react";
import { bucketIndex, listHash } from "./java-hash";

const CAPACITY = 16;
const STORED_AT = bucketIndex(listHash(["a"]), CAPACITY); // 0, where the entry was placed
const MUTATED_AT = bucketIndex(listHash(["a", "b"]), CAPACITY); // 2, where lookups for the mutated key go

/** The "missing entry" trap, one line at a time. Every result here was run on JDK 21. */
const STEPS = [
  { code: 'List<String> key = new ArrayList<>(List.of("a"));', result: "", lookAt: -1, keyLabel: "[a]" },
  { code: 'map.put(key, "value");', result: `entry nằm ở bucket ${STORED_AT}`, lookAt: STORED_AT, keyLabel: "[a]" },
  { code: 'key.add("b");', result: "hashCode của key đổi, nhưng entry không tự dời bucket", lookAt: -1, keyLabel: "[a, b]" },
  { code: "map.get(key);", result: `null: hash mới dẫn tới bucket ${MUTATED_AT}, ở đó trống`, lookAt: MUTATED_AT, keyLabel: "[a, b]" },
  { code: "map.size();", result: "1: entry vẫn chiếm chỗ", lookAt: -1, keyLabel: "[a, b]" },
  { code: 'map.get(List.of("a"));', result: `null: đúng bucket ${STORED_AT}, nhưng [a].equals([a, b]) là false`, lookAt: STORED_AT, keyLabel: "[a, b]" },
];

export function MutableKeyWidget() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const stored = step >= 1;

  return (
    <div className="widget">
      <div className="actions">
        <button className="btn" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}>← Lùi</button>
        <button className="btn primary" onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))} disabled={step === STEPS.length - 1}>Chạy dòng tiếp →</button>
        <span className="score">dòng {step + 1}/{STEPS.length}</span>
      </div>
      <pre className="code lines">
        {STEPS.map((x, i) => <div key={x.code} className={i === step ? "cur" : i < step ? "done" : ""}>{x.code}</div>)}
      </pre>
      <div className="buckets">
        {Array.from({ length: CAPACITY }, (_, i) => (
          <div key={i} className={`bucket ${stored && i === STORED_AT ? "filled" : ""} ${s.lookAt === i ? "look" : ""}`}>
            <small>{i}</small>
            {stored && i === STORED_AT && <span>{s.keyLabel}</span>}
          </div>
        ))}
      </div>
      {s.result && <div className={`result ${step >= 3 ? "bad" : "good"}`}>{s.code.replace(";", "")} → {s.result}</div>}
    </div>
  );
}
