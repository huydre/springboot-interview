import { useEffect, useState } from "react";
import { runSql } from "../lib/sql-engine";
import { Code } from "../components/code-block";

/** Three ways to write A, B, C with OR and AND; each one is run for real on the customer table (PGlite). */
const FORMS = [
  { label: "A OR B AND C", where: "city = 'Hà Nội' OR city = 'Đà Nẵng' AND customer_status = 'ACTIVE'", read: "AND dính trước: A OR (B AND C)" },
  { label: "(A OR B) AND C", where: "(city = 'Hà Nội' OR city = 'Đà Nẵng') AND customer_status = 'ACTIVE'", read: "Ngoặc ép OR chạy trước: đúng ý \"khách đang hoạt động ở Hà Nội hoặc Đà Nẵng\"" },
  { label: "A OR (B AND C)", where: "city = 'Hà Nội' OR (city = 'Đà Nẵng' AND customer_status = 'ACTIVE')", read: "Ngoặc viết rõ điều máy vẫn hiểu ở dạng không ngoặc" },
];

type Row = { id: number; city: string; status: string };

export function SqlFilterLogicWidget() {
  const [i, setI] = useState(0);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [wanted, setWanted] = useState<Set<number>>(new Set());
  const form = FORMS[i];

  useEffect(() => {
    let live = true;
    const pick = (where: string) =>
      runSql(`SELECT customer_id, city, customer_status FROM customer WHERE ${where} ORDER BY customer_id`);
    void Promise.all([pick(form.where), pick(FORMS[1].where)]).then(([mine, good]) => {
      if (!live) return;
      setRows(mine.rows.map((r) => ({ id: Number(r[0]), city: String(r[1]), status: String(r[2]) })));
      setWanted(new Set(good.rows.map((r) => Number(r[0]))));
    });
    return () => { live = false; };
  }, [form.where]);

  const extra = rows ? rows.filter((r) => !wanted.has(r.id)) : [];
  return (
    <div className="widget">
      <p className="muted">
        A = <code>city = 'Hà Nội'</code>, B = <code>city = 'Đà Nẵng'</code>, C = <code>customer_status = 'ACTIVE'</code>. Chọn cách viết, câu lệnh chạy thật trên bảng <code>customer</code>.
      </p>
      <div className="seg small">
        {FORMS.map((f, n) => <button key={f.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{f.label}</button>)}
      </div>
      <Code>{`SELECT customer_id, city, customer_status\nFROM customer\nWHERE ${form.where}`}</Code>
      {rows && (
        <>
          <div className={`result ${extra.length === 0 ? "good" : "bad"}`}>
            {rows.length} khách hàng
            <small>
              {form.read}.{extra.length > 0 ? ` Có ${extra.length} dòng thừa so với ý định (đánh dấu đỏ).` : ""}
            </small>
          </div>
          <div className="sql-scroll">
            <table className="sql-table">
              <thead><tr><th>customer_id</th><th>city</th><th>customer_status</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={wanted.has(r.id) ? undefined : { color: "var(--red)", fontWeight: 700 }}>
                    <td className="num">{r.id}</td><td>{r.city}</td><td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
