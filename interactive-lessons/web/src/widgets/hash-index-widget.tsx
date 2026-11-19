import { useState } from "react";
import { bucketIndex, spread, stringHash } from "./java-hash";

const bits = (n: number, count: number) => (n >>> 0).toString(2).padStart(32, "0").slice(-count).replace(/(\d{4})(?=\d)/g, "$1 ");

/** Type any String key and follow it to its bucket, exactly as HashMap computes it. */
export function HashIndexWidget() {
  const [key, setKey] = useState("hello");
  const [capacity, setCapacity] = useState(16);
  const h = stringHash(key);
  const s = spread(h);
  const index = bucketIndex(h, capacity);
  const maskBits = Math.log2(capacity);

  return (
    <div className="widget">
      <div className="actions">
        <label className="pick" style={{ flex: 1 }}>
          <span>key</span>
          <input className="text-input" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Key dạng String" />
        </label>
        <div className="seg small">
          {[16, 32, 64].map((n) => <button key={n} className={capacity === n ? "on" : ""} onClick={() => setCapacity(n)}>n = {n}</button>)}
        </div>
      </div>
      <pre className="code">{[
        [`"${key}".hashCode()`, `= ${h}`],
        ["h ^ (h >>> 16)", `= ${s}`],
        ["hash (8 bit cuối)", `… ${bits(s, 8)}`],
        [`n - 1 = ${capacity - 1}`, `… ${bits(capacity - 1, 8)}`],
        ["(n - 1) & hash", `… ${bits(index, 8)}  = ${index}`],
      ].map(([label, value]) => `${label.padEnd(Math.max(20, key.length + 15))} ${value}`).join("\n")}</pre>
      <div className="buckets" style={{ gridTemplateColumns: `repeat(${Math.min(capacity, 16)}, minmax(0, 1fr))` }}>
        {Array.from({ length: Math.min(capacity, 16) }, (_, i) => {
          const shown = capacity > 16 ? index % 16 === i : index === i;
          return (
            <div key={i} className={`bucket ${shown ? "filled" : ""}`}>
              <small>{capacity > 16 ? `${i}…` : i}</small>
              {shown && <span>{key.slice(0, 4) || '""'}</span>}
            </div>
          );
        })}
      </div>
      <p className="muted">
        Chỉ {maskBits} bit cuối của hash quyết định bucket. Vì n là luỹ thừa của 2, phép AND này cho kết quả như hash % n (với hash không âm) nhưng rẻ hơn phép chia.
        {capacity > 16 && " (Lưới chỉ vẽ 16 ô; ô sáng là index % 16.)"}
      </p>
    </div>
  );
}
