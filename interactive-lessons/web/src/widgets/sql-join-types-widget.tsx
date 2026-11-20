import { useEffect, useState } from "react";
import { formatCell, runSql } from "../lib/sql-engine";
import { Code } from "../components/code-block";

/** Two small samples of real rows: 5 customers (100002 to 100006) and 4 loans (of customers 100002, 100003, 100011, 100013). */
const LEFT_SQL = "SELECT customer_id, short_name FROM customer WHERE customer_id BETWEEN 100002 AND 100006";
const RIGHT_SQL = "SELECT ld_id, customer_id, status FROM loan WHERE customer_id IN (100002, 100003, 100011, 100013)";

const CTES = `WITH c AS (${LEFT_SQL}), l AS (${RIGHT_SQL})`;
const SELECT_LIST = "SELECT c.customer_id AS c_id, c.short_name, l.ld_id, l.customer_id AS l_cust, l.status";

type Kind = { key: string; label: string; join: string; where?: string; note: string };

const KINDS: Kind[] = [
  { key: "inner", label: "INNER JOIN", join: "INNER JOIN", note: "Chỉ giữ các cặp khớp. Dòng nào không tìm được bạn đồng hành ở bảng kia thì biến mất." },
  { key: "left", label: "LEFT JOIN", join: "LEFT JOIN", note: "Giữ mọi dòng bảng trái. Khách chưa có khoản vay vẫn hiện, các cột của bảng phải là NULL." },
  { key: "right", label: "RIGHT JOIN", join: "RIGHT JOIN", note: "Giữ mọi dòng bảng phải. Khoản vay của khách ngoài mẫu vẫn hiện, các cột của bảng trái là NULL." },
  { key: "full", label: "FULL JOIN", join: "FULL JOIN", note: "Giữ mọi dòng của cả hai bảng: các cặp khớp, phần chỉ có bên trái và phần chỉ có bên phải." },
  { key: "anti", label: "LEFT + IS NULL", join: "LEFT JOIN", where: "l.ld_id IS NULL", note: "Anti-join: nối kiểu LEFT rồi chỉ giữ các dòng bên trái không có cặp, tức khách chưa có khoản vay nào." },
];

type Cell = unknown;
type Row = Cell[];
type Data = { left: Row[]; right: Row[]; out: Record<string, Row[]> };

const joinSql = (k: Kind) =>
  `SELECT c.customer_id, c.short_name, l.ld_id, l.customer_id, l.status\nFROM customer c\n${k.join} loan l ON l.customer_id = c.customer_id${k.where ? `\nWHERE ${k.where}` : ""};`;

const text = (v: Cell) => formatCell(v, 0);
const isNull = (v: Cell) => v === null || v === undefined;

/** Pick a join type and see which rows of two small real tables survive, which side is NULL-filled. Every result is computed by PostgreSQL (PGlite). */
export function SqlJoinTypesWidget() {
  const [i, setI] = useState(1);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const left = (await runSql(`${LEFT_SQL} ORDER BY customer_id`)).rows;
      const right = (await runSql(`${RIGHT_SQL} ORDER BY ld_id`)).rows;
      const out: Record<string, Row[]> = {};
      for (const k of KINDS) {
        const where = k.where ? ` WHERE ${k.where}` : "";
        out[k.key] = (await runSql(`${CTES} ${SELECT_LIST} FROM c ${k.join} l ON l.customer_id = c.customer_id${where} ORDER BY COALESCE(c.customer_id, l.customer_id), l.ld_id`)).rows;
      }
      if (live) setData({ left, right, out });
    })();
    return () => { live = false; };
  }, []);

  const kind = KINDS[i];
  const rows = data?.out[kind.key] ?? [];
  const keptLeft = new Set(rows.filter((r) => !isNull(r[0])).map((r) => r[0]));
  const keptRight = new Set(rows.filter((r) => !isNull(r[2])).map((r) => r[2]));
  const matched = rows.filter((r) => !isNull(r[0]) && !isNull(r[2])).length;
  const leftOnly = rows.filter((r) => !isNull(r[0]) && isNull(r[2])).length;
  const rightOnly = rows.filter((r) => isNull(r[0]) && !isNull(r[2])).length;

  const tag = (r: Row) => (isNull(r[2]) ? "chỉ bên trái" : isNull(r[0]) ? "chỉ bên phải" : "khớp");
  const dim = (kept: boolean) => (kept ? undefined : { opacity: 0.4, textDecoration: "line-through" });
  const edge = (r: Row) => ({ borderLeft: `3px solid ${isNull(r[2]) ? "var(--amber)" : isNull(r[0]) ? "var(--cyan)" : "var(--green)"}` });

  return (
    <div className="widget">
      <p className="muted">
        Hai bảng mẫu lấy từ dữ liệu thật: 5 khách (100002 đến 100006) và 4 khoản vay (của khách 100002, 100003, 100011, 100013). Chọn kiểu JOIN, câu lệnh chạy thật trên PostgreSQL.
      </p>
      <div className="seg small">
        {KINDS.map((k, n) => <button key={k.key} className={i === n ? "on" : ""} onClick={() => setI(n)}>{k.label}</button>)}
      </div>
      <Code>{joinSql(kind)}</Code>

      {!data && <div className="result">Đang chạy trên PostgreSQL...</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            <div>
              <strong><code>customer c</code> (bảng trái)</strong>
              <div className="sql-scroll">
                <table className="sql-table">
                  <thead><tr><th>customer_id</th><th>short_name</th><th>kết quả</th></tr></thead>
                  <tbody>
                    {data.left.map((r) => {
                      const kept = keptLeft.has(r[0]);
                      return <tr key={String(r[0])} style={dim(kept)}><td className="num">{text(r[0])}</td><td>{text(r[1])}</td><td>{kept ? "giữ" : "bị loại"}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <strong><code>loan l</code> (bảng phải)</strong>
              <div className="sql-scroll">
                <table className="sql-table">
                  <thead><tr><th>ld_id</th><th>customer_id</th><th>status</th><th>kết quả</th></tr></thead>
                  <tbody>
                    {data.right.map((r) => {
                      const kept = keptRight.has(r[0]);
                      return <tr key={String(r[0])} style={dim(kept)}><td>{text(r[0])}</td><td className="num">{text(r[1])}</td><td>{text(r[2])}</td><td>{kept ? "giữ" : "bị loại"}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <strong>Kết quả: {rows.length} dòng</strong>
          <div className="sql-scroll">
            <table className="sql-table">
              <thead><tr><th>customer_id</th><th>short_name</th><th>ld_id</th><th>customer_id</th><th>status</th><th>loại dòng</th></tr></thead>
              <tbody>
                {rows.map((r, n) => (
                  <tr key={n} style={edge(r)}>
                    {r.map((v, c) => <td key={c} className={isNull(v) ? "null" : c === 0 || c === 3 ? "num" : undefined}>{text(v)}</td>)}
                    <td>{tag(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="result good">
            {matched} dòng khớp, {leftOnly} dòng chỉ bên trái, {rightOnly} dòng chỉ bên phải
            <small>{kind.note}</small>
          </div>
        </>
      )}
    </div>
  );
}
