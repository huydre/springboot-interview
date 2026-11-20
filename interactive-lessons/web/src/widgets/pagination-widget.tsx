import { useState } from "react";
import { Code } from "../components/code-block";

/** orders 1,000,000 rows on PostgreSQL 16, best of 6 runs (study note 03.07). Bars use a log scale so 0.1 ms stays visible. */
const STEPS: { offset: number; read: number; ms: number }[] = [
  { offset: 0, read: 20, ms: 0.1 },
  { offset: 100000, read: 100020, ms: 14 },
  { offset: 500000, read: 500020, ms: 100 },
  { offset: 900000, read: 900020, ms: 168 },
];
const KEYSET_MS = 0.09;
const width = (ms: number) => `${Math.max(2, (Math.log10(ms * 100) / Math.log10(168 * 100)) * 100)}%`;
const fmt = (n: number) => n.toLocaleString("vi-VN");

export function PaginationWidget() {
  const [i, setI] = useState(3);
  const s = STEPS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {STEPS.map((x, n) => <button key={x.offset} className={i === n ? "on" : ""} onClick={() => setI(n)}>trang ở dòng {fmt(x.offset)}</button>)}
      </div>
      <div className="two">
        <Code>{`-- OFFSET\nselect * from orders\norder by id limit 20 offset ${s.offset};\n\n-- keyset\nselect * from orders\nwhere id > ${s.offset}\norder by id limit 20;`}</Code>
        <div className="bars">
          <div>OFFSET: đọc {fmt(s.read)} dòng, {fmt(s.ms)} ms<i className="bad" style={{ width: width(s.ms) }} /></div>
          <div>keyset: đọc 20 dòng, {fmt(KEYSET_MS)} ms<i className="good" style={{ width: width(KEYSET_MS) }} /></div>
        </div>
      </div>
      <p className="muted">
        {s.offset === 0
          ? "Trang đầu thì hai cách như nhau."
          : `OFFSET không nhảy được: plan là Index Scan với actual rows=${fmt(s.read)}, đọc rồi bỏ ${fmt(s.offset)} dòng. Keyset đi thẳng tới id qua index nên luôn đọc 20 dòng. Thanh dùng thang log.`}
      </p>
    </div>
  );
}
