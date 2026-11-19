import { useState } from "react";

/** count++ under contention, measured on JDK 21 (8 CPUs). Race results change every run; the counts below are one session. */
const WAYS: { label: string; code: string; small: string; big: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  { label: "int thường", code: "static int count;\ncount++;", small: "sai 10/20 lần (90889, 97305, 99000)", big: "13.505.781 / 40.000.000", tone: "bad", why: "Đọc, cộng, ghi là 3 bước: hai thread cùng đọc rồi cùng ghi, mất lần tăng. Phần lớn lần chạy nhỏ vẫn đúng nên test khó bắt." },
  { label: "volatile int", code: "static volatile int count;\ncount++;", small: "sai 20/20 lần", big: "(không đo, vẫn là race)", tone: "bad", why: "volatile chỉ đảm bảo visibility, không gộp 3 bước thành một. Còn sai thường xuyên hơn vì mỗi lần tăng phải đọc ghi bộ nhớ thật." },
  { label: "synchronized", code: "synchronized (LOCK) { count++; }", small: "đúng", big: "40.000.000 · 1453 ms", tone: "good", why: "Một thread một lúc, và thread vào sau thấy thay đổi của thread trước." },
  { label: "AtomicInteger", code: "counter.incrementAndGet();", small: "đúng", big: "40.000.000 · 1098 ms", tone: "good", why: "CAS không lock; khi tranh chấp cao nhiều lần CAS thất bại phải thử lại. Thứ hạng so với synchronized đổi theo lần đo." },
  { label: "LongAdder", code: "adder.increment();   // đọc bằng adder.sum()", small: "đúng", big: "40.000.000 · 114 ms", tone: "good", why: "Chia nhiều cell, mỗi thread cộng ô riêng: nhanh nhất cho counter, metric. sum() không phải snapshot nguyên tử." },
];

export function RaceCounterWidget() {
  const [i, setI] = useState(0);
  const w = WAYS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {WAYS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{w.code}</pre>
      <div className="two">
        <div className={`result ${w.tone}`}>{w.small}<small>100 thread × 1000 lần, 20 lần chạy</small></div>
        <div className={`result ${w.tone}`}>{w.big}<small>8 thread × 5 triệu lần</small></div>
      </div>
      <p className="muted">{w.why}</p>
    </div>
  );
}
