import { useState } from "react";
import { Code } from "../components/code-block";

/**
 * EXPLAIN (ANALYZE, BUFFERS) of the "my PAID orders, newest first" query over 100,000 orders, five runs per state
 * (study note 11.06): customer 42 has 101 orders, 60 PAID.
 */
const STATES = [
  { label: "Không index", node: "Seq Scan on orders", removed: "Rows Removed by Filter: 99940", sort: "Có (top-N heapsort)", buffers: 846, time: "5,2–6,0 ms", note: "Đọc cả 100 000 dòng để giữ 60 rồi sort. 846 page cho một request." },
  { label: "(customer_id)", node: "Bitmap Index Scan + Bitmap Heap Scan", removed: "Rows Removed by Filter: 41", sort: "Có", buffers: 98, time: "0,10–0,25 ms", note: "status chỉ là Filter kiểm tra sau khi lấy dòng, không phải Index Cond; vẫn phải sort." },
  { label: "(customer_id, status, created_at)", node: "Index Scan Backward using idx_orders_customer_status_created", removed: "0", sort: "Không", buffers: 23, time: "0,027–0,082 ms", note: "Cả hai điều kiện là Index Cond, đọc ngược index lấy đúng 20 dòng rồi dừng nhờ LIMIT. Ít hơn khoảng 37 lần số page." },
];

export function ExplainStatesWidget() {
  const [i, setI] = useState(0);
  const s = STATES[i];
  return (
    <div className="widget">
      <Code>{"select id, total, created_at from orders\nwhere customer_id = 42 and status = 'PAID'\norder by created_at desc limit 20"}</Code>
      <div className="seg small">
        {STATES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <ul className="log">
        <li>Node: {s.node}</li>
        <li className={s.removed === "0" ? "ok" : "err"}>Đọc thừa: {s.removed}</li>
        <li className={s.sort === "Không" ? "ok" : "err"}>Sort: {s.sort}</li>
        <li>Execution Time (5 lần): {s.time}</li>
      </ul>
      <div className="bars"><div>Buffers: {s.buffers} page<i className={s.buffers > 100 ? "bad" : "good"} style={{ width: `${(s.buffers / 846) * 100}%` }} /></div></div>
      <p className="muted">{s.note}</p>
    </div>
  );
}
