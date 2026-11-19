import { useState } from "react";

type State = "CLOSED" | "OPEN" | "HALF_OPEN";

// Example values chosen for the illustration, not Resilience4j defaults (study note 10.01 says the same of its YAML).
const WINDOW = 10;
const THRESHOLD = 50;
const HALF_OPEN_CALLS = 3;

/** Circuit breaker states driven by the learner's calls: a count-based window, an open state, and trial calls in half-open. */
export function CircuitBreakerWidget() {
  const [state, setState] = useState<State>("CLOSED");
  const [calls, setCalls] = useState<boolean[]>([]);
  const [trial, setTrial] = useState<boolean[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [s, ...l].slice(0, 6));

  const call = (ok: boolean) => {
    if (state === "OPEN") { say("OPEN: không gọi payment, ném CallNotPermittedException hoặc chạy fallback ngay"); return; }
    if (state === "HALF_OPEN") {
      // Like Resilience4j: wait for every permitted trial call, then compare their failure rate with the threshold.
      const t = [...trial, ok];
      if (t.length < HALF_OPEN_CALLS) { setTrial(t); say(`HALF_OPEN: request thử ${t.length}/${HALF_OPEN_CALLS} ${ok ? "thành công" : "lỗi"}`); return; }
      const rate = Math.round((t.filter((x) => !x).length / t.length) * 100);
      setTrial([]);
      if (rate >= THRESHOLD) { setState("OPEN"); say(`HALF_OPEN: ${HALF_OPEN_CALLS} request thử xong, tỉ lệ lỗi ${rate}% ≥ ${THRESHOLD}% → OPEN lại`); return; }
      setState("CLOSED"); setCalls([]); say(`HALF_OPEN: ${HALF_OPEN_CALLS} request thử xong, tỉ lệ lỗi ${rate}% < ${THRESHOLD}% → CLOSED`); return;
    }
    const w = [...calls, ok].slice(-WINDOW);
    setCalls(w);
    const rate = Math.round((w.filter((x) => !x).length / w.length) * 100);
    if (w.length >= WINDOW && rate >= THRESHOLD) { setState("OPEN"); say(`CLOSED: tỉ lệ lỗi ${rate}% ≥ ${THRESHOLD}% trong ${WINDOW} lời gọi → OPEN`); }
    else say(`CLOSED: gọi ${ok ? "thành công" : "lỗi"}, tỉ lệ lỗi ${rate}% (${w.length}/${WINDOW} lời gọi)`);
  };

  const fails = calls.filter((x) => !x).length;
  return (
    <div className="widget">
      <div className="seg small">
        <button onClick={() => call(true)}>payment trả 200</button>
        <button onClick={() => call(false)}>payment timeout</button>
        <button disabled={state !== "OPEN"} onClick={() => { setState("HALF_OPEN"); say("Hết thời gian chờ → HALF_OPEN"); }}>hết thời gian chờ</button>
        <button onClick={() => { setState("CLOSED"); setCalls([]); setTrial([]); setLog([]); }}>làm lại</button>
      </div>
      <div className={`result ${state === "CLOSED" ? "good" : state === "OPEN" ? "bad" : "warn"}`}>
        {state}
        <small>Cửa sổ {calls.length}/{WINDOW} lời gọi, {fails} lỗi. Ngưỡng ví dụ: {THRESHOLD}% lỗi trong {WINDOW} lời gọi, {HALF_OPEN_CALLS} request thử ở HALF_OPEN{state === "HALF_OPEN" ? ` (đã thử ${trial.length})` : ""}.</small>
      </div>
      <ul className="log">{log.map((l, n) => <li key={n} className={l.includes("→ OPEN") ? "err" : l.includes("→ CLOSED") ? "ok" : ""}>{l}</li>)}</ul>
      <p className="muted">Phòng thủ theo thứ tự: timeout (bắt buộc), retry có backoff chỉ cho thao tác idempotent, rồi circuit breaker ở bên gọi. Retry POST /charge không có idempotency key có thể trừ tiền hai lần.</p>
    </div>
  );
}
