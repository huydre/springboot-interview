import { useState } from "react";

type Way = "count++" | "synchronized" | "AtomicInteger" | "LongAdder";

/** Three runs of RaceConditionLab (100 threads × 10,000 increments, median of 5 rounds), JDK 21 (study note 11.03). */
const RUNS: Record<Way, { last: string; ms: [number, number, number] }> = {
  "count++": { last: "457,695 · 967,501 · 216,561 (sai 5/5 vòng mỗi lần)", ms: [19, 21, 17] },
  synchronized: { last: "1,000,000", ms: [28, 35, 16] },
  AtomicInteger: { last: "1,000,000", ms: [50, 48, 42] },
  LongAdder: { last: "1,000,000", ms: [6, 13, 15] },
};
const WAYS = Object.keys(RUNS) as Way[];

export function RaceRunsWidget() {
  const [run, setRun] = useState(0);
  const [guess, setGuess] = useState<Way | null>(null);
  const max = 50;
  const fastest = WAYS.slice(1).reduce((a, b) => (RUNS[a].ms[run] <= RUNS[b].ms[run] ? a : b));
  return (
    <div className="widget">
      <p className="muted">Đoán trước: trong 3 cách sửa, cách nào chậm nhất?</p>
      <div className="seg small">
        {WAYS.slice(1).map((w) => <button key={w} className={guess === w ? "on" : ""} onClick={() => setGuess(w)}>{w}</button>)}
      </div>
      {guess && (
        <>
          <div className="seg small">
            {[0, 1, 2].map((r) => <button key={r} className={run === r ? "on" : ""} onClick={() => setRun(r)}>Lần chạy {r + 1}</button>)}
          </div>
          <div className="bars">
            {WAYS.map((w) => (
              <div key={w}>{w}: {RUNS[w].ms[run]} ms<i className={w === "count++" ? "bad" : "good"} style={{ width: `${(RUNS[w].ms[run] / max) * 100}%` }} /></div>
            ))}
          </div>
          <div className={`result ${guess === "AtomicInteger" ? "good" : "bad"}`}>
            {guess === "AtomicInteger" ? "Đoán đúng: AtomicInteger chậm nhất ở cả 3 lần" : `Chưa đúng: chậm nhất là AtomicInteger ở cả 3 lần, không phải ${guess}`}
            <small>Nhanh nhất lần này: {fastest}. 100 thread cùng CAS một ô nhớ thì thất bại và thử lại liên tục; LongAdder cộng vào cell riêng. count++ ra: {RUNS["count++"].last}. Số chỉ để so tương đối, đo nghiêm túc thì dùng JMH.</small>
          </div>
        </>
      )}
    </div>
  );
}
