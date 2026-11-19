import { useState } from "react";

type Mode = "twr" | "manual";
type Outcome = { lines: string[]; result: string[]; leak?: string };

/** Exact console output of each combination, captured by running both snippets on JDK 21. */
const OUTCOMES: Record<string, Outcome> = {
  "twr-true-true": { lines: ["open A", "open B", "close B", "close A"], result: ["main: body failed", "suppressed: close failed B", "suppressed: close failed A"] },
  "twr-true-false": { lines: ["open A", "open B", "close B", "close A"], result: ["main: body failed"] },
  "twr-false-true": { lines: ["open A", "open B", "body ok", "close B", "close A"], result: ["main: close failed B", "suppressed: close failed A"] },
  "twr-false-false": { lines: ["open A", "open B", "body ok", "close B", "close A"], result: ["không có exception"] },
  "manual-true-true": { lines: ["open A", "open B", "close B"], result: ["main: close failed B"], leak: "lỗi gốc \"body failed\" bị mất, và A không bao giờ được close" },
  "manual-true-false": { lines: ["open A", "open B", "close B", "close A"], result: ["main: body failed"] },
  "manual-false-true": { lines: ["open A", "open B", "body ok", "close B"], result: ["main: close failed B"], leak: "A không bao giờ được close" },
  "manual-false-false": { lines: ["open A", "open B", "body ok", "close B", "close A"], result: ["không có exception"] },
};

const CODE: Record<Mode, string> = {
  twr: `try (Res a = new Res("A");
     Res b = new Res("B")) {
    body();
}`,
  manual: `Res a = new Res("A");
Res b = new Res("B");
try { body(); }
finally { b.close(); a.close(); }`,
};

/** try-with-resources vs closing by hand in finally, for every failure combination. */
export function ResourcesWidget() {
  const [mode, setMode] = useState<Mode>("twr");
  const [bodyFails, setBodyFails] = useState(true);
  const [closeFails, setCloseFails] = useState(true);
  const o = OUTCOMES[`${mode}-${bodyFails}-${closeFails}`];
  const bodyLost = bodyFails && !o.result.some((r) => r.includes("body failed"));

  return (
    <div className="widget">
      <div className="seg">
        <button className={mode === "twr" ? "on" : ""} onClick={() => setMode("twr")}>try-with-resources</button>
        <button className={mode === "manual" ? "on" : ""} onClick={() => setMode("manual")}>tự close trong finally</button>
      </div>
      <div className="actions">
        <label className="check"><input type="checkbox" checked={bodyFails} onChange={(e) => setBodyFails(e.target.checked)} /> body() ném "body failed"</label>
        <label className="check"><input type="checkbox" checked={closeFails} onChange={(e) => setCloseFails(e.target.checked)} /> close() ném "close failed X"</label>
      </div>
      <div className="two">
        <pre className="code">{CODE[mode]}</pre>
        <div className="panel">
          <ul className="log">
            {o.lines.map((l) => <li key={l}>{l}</li>)}
            {o.result.map((r) => <li key={r} className={r.startsWith("main: body") || r.startsWith("không") ? "ok" : "err"}>{r}</li>)}
          </ul>
          {(o.leak || bodyLost) && <div className="result bad">✕ {o.leak}<small>exception lúc close đè lên exception gốc, và lệnh close sau nó bị bỏ qua</small></div>}
          {!o.leak && mode === "twr" && closeFails && <div className="result good">✓ không mất lỗi nào<small>lỗi lúc close được gắn vào getSuppressed()</small></div>}
        </div>
      </div>
    </div>
  );
}
