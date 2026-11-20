import { useState } from "react";
import { Code } from "../components/code-block";

type Fn = "row_number" | "rank" | "dense_rank";

/** Dept IT salaries ordered desc; ranks as returned by PostgreSQL 16 for `over (order by salary desc)`. */
const ROWS: { name: string; salary: number; rank: Record<Fn, number> }[] = [
  { name: "An", salary: 3000, rank: { row_number: 1, rank: 1, dense_rank: 1 } },
  { name: "Binh", salary: 3000, rank: { row_number: 2, rank: 1, dense_rank: 1 } },
  { name: "Chi", salary: 2500, rank: { row_number: 3, rank: 3, dense_rank: 2 } },
  { name: "Dung", salary: 2000, rank: { row_number: 4, rank: 4, dense_rank: 3 } },
];

const NOTE: Record<Fn, string> = {
  row_number: "Luôn tăng 1. An và Binh bằng lương nhưng khác số, thứ tự giữa hai người không xác định nếu không thêm cột sort phụ. Dùng khi đề hỏi \"N người\".",
  rank: "Bằng nhau cùng hạng, hạng sau nhảy: 1, 1, 3.",
  dense_rank: "Bằng nhau cùng hạng, không nhảy: 1, 1, 2. Dùng khi đề hỏi \"N mức lương\".",
};

export function RankFunctionsWidget() {
  const [fn, setFn] = useState<Fn>("row_number");
  const [n, setN] = useState(2);
  const picked = ROWS.filter((r) => r.rank[fn] <= n);
  return (
    <div className="widget">
      <div className="seg small">
        {(["row_number", "rank", "dense_rank"] as Fn[]).map((f) => <button key={f} className={fn === f ? "on" : ""} onClick={() => setFn(f)}>{f}()</button>)}
      </div>
      <div className="seg small">
        {[1, 2, 3].map((k) => <button key={k} className={n === k ? "on" : ""} onClick={() => setN(k)}>lọc r &lt;= {k}</button>)}
      </div>
      <Code>{`select * from (\n  select name, salary,\n         ${fn}() over (order by salary desc) as r\n  from employee where dept_id = 1\n) t where r <= ${n};`}</Code>
      <ul className="log">
        {ROWS.map((r) => (
          <li key={r.name} className={r.rank[fn] <= n ? "ok" : ""}>{r.name} · {r.salary} · r = {r.rank[fn]}</li>
        ))}
      </ul>
      <div className="result good">
        Lấy được {picked.length} người: {picked.map((r) => r.name).join(", ")}
        <small>{NOTE[fn]} Phải bọc subquery vì window function chạy ở bước SELECT, sau WHERE.</small>
      </div>
    </div>
  );
}
