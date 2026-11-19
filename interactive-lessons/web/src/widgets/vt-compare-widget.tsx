import { useState } from "react";

/** Virtual thread measurements on JDK 21 (8 CPUs). Bars are scaled to the slower run of each pair. */
const CASES: { label: string; a: [string, number]; b: [string, number]; why: string }[] = [
  {
    label: "10.000 task chờ I/O",
    a: ["pool 200 platform thread", 5249],
    b: ["virtual thread per task", 168],
    why: "Mỗi task sleep(100). Pool 200 chạy 50 đợt; virtual thread chờ không giữ carrier nên gần như chạy cùng lúc.",
  },
  {
    label: "Pinning (Java 21)",
    a: ["sleep trong synchronized", 1345],
    b: ["sleep trong ReentrantLock", 101],
    why: "100 virtual thread, mỗi cái giữ lock riêng. synchronized ghim virtual thread vào carrier: chỉ 8 carrier, chạy 13 đợt. Java 24 (JEP 491) đã sửa.",
  },
  {
    label: "Giới hạn DB pool",
    a: ["1000 virtual thread, Semaphore(10)", 5424],
    b: ["lý thuyết 1000 / 10 × 50 ms", 5000],
    why: "Virtual thread không làm DB nhanh hơn: connection pool vẫn là giới hạn thật. Xem lại kích thước Hikari khi bật virtual threads.",
  },
];

export function VtCompareWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  const max = Math.max(c.a[1], c.b[1]);
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="bars">
        <div>{c.a[0]}: {c.a[1]} ms<i className="bad" style={{ width: `${(c.a[1] / max) * 100}%` }} /></div>
        <div>{c.b[0]}: {c.b[1]} ms<i className="good" style={{ width: `${(c.b[1] / max) * 100}%` }} /></div>
      </div>
      <p className="muted">{c.why}</p>
    </div>
  );
}
