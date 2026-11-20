import { useState } from "react";
import { Code } from "../components/code-block";

/** First 8 rows of customer (real data, ordered by customer_id); the real table has 40. */
const ROWS = [
  { customer_id: 100001, full_name: "Lý Hoàng Long", city: "Hà Nội" },
  { customer_id: 100002, full_name: "Dương Văn An", city: "Hà Nội" },
  { customer_id: 100003, full_name: "Ngô Anh Tuấn", city: "Hà Nội" },
  { customer_id: 100004, full_name: "Hoàng Quốc Bảo", city: "Hà Nội" },
  { customer_id: 100005, full_name: "Ngô Ngọc Anh", city: "TP. Hồ Chí Minh" },
  { customer_id: 100006, full_name: "Ngô Khánh Linh", city: "TP. Hồ Chí Minh" },
  { customer_id: 100007, full_name: "Đỗ Thanh Vân", city: "Cần Thơ" },
  { customer_id: 100008, full_name: "Lê Khánh Linh", city: "Hải Phòng" },
];
type Col = keyof (typeof ROWS)[number];
type Row = Record<string, string | number>;

type Query = { sql: string; cols: Col[]; distinct: boolean; limit?: number };
const QUERIES: Query[] = [
  { sql: "SELECT city\nFROM customer;", cols: ["city"], distinct: false },
  { sql: "SELECT DISTINCT city\nFROM customer;", cols: ["city"], distinct: true },
  { sql: "SELECT DISTINCT city\nFROM customer\nLIMIT 3;", cols: ["city"], distinct: true, limit: 3 },
  { sql: "SELECT full_name, city\nFROM customer\nLIMIT 3;", cols: ["full_name", "city"], distinct: false, limit: 3 },
];

type Stage = { name: string; clause: string; rows: Row[]; cols: Col[]; text: string };

function buildStages(q: Query): Stage[] {
  const all: Col[] = ["customer_id", "full_name", "city"];
  const stages: Stage[] = [
    { name: "FROM", clause: "FROM customer", rows: ROWS, cols: all, text: "Bước 1: FROM. Database lấy bảng customer ra trước, đủ mọi cột (ở đây minh hoạ 8 dòng đầu)." },
  ];
  let rows: Row[] = ROWS.map((r) => Object.fromEntries(q.cols.map((c) => [c, r[c]])));
  stages.push({ name: "SELECT", clause: `SELECT ${q.cols.join(", ")}`, rows, cols: q.cols, text: `Bước 2: SELECT. Chỉ giữ lại cột ${q.cols.join(", ")}. Số dòng vẫn là ${rows.length}.` });
  if (q.distinct) {
    const seen = new Set<string>();
    const kept = rows.filter((r) => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; });
    stages.push({ name: "DISTINCT", clause: "DISTINCT", rows: kept, cols: q.cols, text: `Bước 3: DISTINCT. Bỏ các dòng giống hệt dòng đã có: còn ${kept.length} dòng (bỏ ${rows.length - kept.length}).` });
    rows = kept;
  }
  if (q.limit !== undefined) {
    const cut = rows.slice(0, q.limit);
    stages.push({ name: "LIMIT", clause: `LIMIT ${q.limit}`, rows: cut, cols: q.cols, text: `Bước cuối: LIMIT ${q.limit}. Cắt lấy ${q.limit} dòng đầu của kết quả đã xử lý. Không có ORDER BY thì 3 dòng nào cũng được, bảng này chỉ minh hoạ.` });
  }
  return stages;
}

export function SqlSelectOrderWidget() {
  const [qi, setQi] = useState(1);
  const [si, setSi] = useState(0);
  const q = QUERIES[qi];
  const stages = buildStages(q);
  const st = stages[Math.min(si, stages.length - 1)];
  const pick = (n: number) => { setQi(n); setSi(0); };
  const last = Math.min(si, stages.length - 1) === stages.length - 1;
  return (
    <div className="widget">
      <div className="seg small">
        {QUERIES.map((x, n) => <button key={x.sql} className={n === qi ? "on" : ""} onClick={() => pick(n)}>câu {n + 1}</button>)}
      </div>
      <div className="two">
        <Code>{q.sql}</Code>
        <ol className="log">
          {stages.map((s, n) => <li key={s.name} className={n === si ? "ok" : n > si ? "muted" : ""}>{n + 1}. {s.clause}</li>)}
        </ol>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="sql-table">
          <thead><tr>{st.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {st.rows.map((r, i) => <tr key={i}>{st.cols.map((c) => <td key={c} className={typeof r[c] === "number" ? "num" : ""}>{r[c]}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className={`result ${last ? "good" : ""}`}>
        {st.rows.length} dòng, {st.cols.length} cột
        <small>{st.text}</small>
      </div>
      <div className="seg small">
        <button onClick={() => setSi((n) => Math.max(0, n - 1))} disabled={si === 0}>◀ trước</button>
        <button onClick={() => setSi((n) => Math.min(stages.length - 1, n + 1))} disabled={last}>bước tiếp ▶</button>
      </div>
      <p className="muted">Bạn viết SELECT ở đầu câu, nhưng database chạy FROM trước. LIMIT luôn là bước cuối.</p>
    </div>
  );
}
