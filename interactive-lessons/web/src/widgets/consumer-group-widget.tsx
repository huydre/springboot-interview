import { useState } from "react";

const PARTITIONS = 4;
/** The 6-consumer assignment is the real assignment() printed after 20 s (study note 03.11); smaller groups follow the one-consumer-per-partition rule. */
const MEASURED_SIX = [[1], [0], [2], [3], [], []];

function assign(n: number): number[][] {
  if (n === 6) return MEASURED_SIX;
  const out: number[][] = Array.from({ length: n }, () => []);
  for (let p = 0; p < PARTITIONS; p++) out[p % n].push(p);
  return out;
}

export function ConsumerGroupWidget() {
  const [n, setN] = useState(6);
  const groups = assign(n);
  const idle = groups.filter((g) => g.length === 0).length;
  return (
    <div className="widget">
      <div className="seg small">
        {[1, 2, 3, 4, 6].map((k) => <button key={k} className={n === k ? "on" : ""} onClick={() => setN(k)}>{k} consumer</button>)}
      </div>
      <ul className="log">
        {groups.map((g, i) => (
          <li key={i} className={g.length ? "ok" : "err"}>consumer-{i}: [{g.join(", ")}]{g.length === 0 && " ngồi chơi"}</li>
        ))}
      </ul>
      <div className={`result ${idle ? "bad" : "good"}`}>
        {idle ? `${idle} consumer không nhận partition nào` : "Mọi consumer đều có việc"}
        <small>
          Topic 4 partition, cùng group.id. Mỗi partition chỉ giao cho đúng 1 consumer trong group nên số consumer có ích tối đa bằng số partition.
          {n === 6 ? " Đây là kết quả chạy thật." : " Một consumer chết thì rebalance, partition của nó chia cho consumer còn lại, đọc tiếp từ committed offset."}
        </small>
      </div>
    </div>
  );
}
