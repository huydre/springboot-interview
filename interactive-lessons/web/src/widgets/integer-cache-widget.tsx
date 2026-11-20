import { useState } from "react";
import { Code } from "../components/code-block";

const LOW = -128;
const HIGH = 127;

/** Integer/Long cache: valueOf() returns a shared object only for -128..127. */
export function IntegerCacheWidget() {
  const [n, setN] = useState(127);
  const [type, setType] = useState<"Integer" | "Long">("Integer");
  const cached = n >= LOW && n <= HIGH;
  const lit = type === "Long" ? `${n}L` : String(n);
  // Position of n on a -300..300 ruler, with the cached band highlighted.
  const pct = (v: number) => ((v + 300) / 600) * 100;

  return (
    <div className="widget">
      <div className="seg">
        {(["Integer", "Long"] as const).map((t) => (
          <button key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>
      <label className="pick">
        <span>giá trị</span>
        <input type="range" min={-300} max={300} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Giá trị so sánh" />
      </label>
      <div className="ruler" aria-hidden>
        <i className="band" style={{ left: `${pct(LOW)}%`, width: `${pct(HIGH) - pct(LOW)}%` }} />
        <b style={{ left: `${pct(n)}%` }} />
        <span style={{ left: `${pct(LOW)}%` }}>-128</span>
        <span style={{ left: `${pct(HIGH)}%` }}>127</span>
      </div>
      <div className="two">
        <Code>{`${type} a = ${lit};   // ${type}.valueOf(${lit})
${type} b = ${lit};
a == b
a.equals(b)`}</Code>
        <div className="panel">
          <div className={`result ${cached ? "good" : "bad"}`}>
            a == b → {String(cached)}
            <small>{cached ? "trong cache -128 … 127: a và b cùng một object" : "ngoài cache: mỗi lần valueOf tạo object mới"}</small>
          </div>
          <div className="result good">
            a.equals(b) → true
            <small>so giá trị, luôn đúng</small>
          </div>
        </div>
      </div>
    </div>
  );
}
