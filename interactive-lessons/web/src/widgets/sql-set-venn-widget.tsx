import { useEffect, useState } from "react";
import { formatCell, runSql } from "../lib/sql-engine";
import { Code } from "../components/code-block";

/** Two small real samples: the debit side and the credit side of the first 10 transfers. */
const A_SQL = "SELECT debit_account AS account_id FROM funds_transfer WHERE ft_id <= 'FT240000010'";
const B_SQL = "SELECT credit_account AS account_id FROM funds_transfer WHERE ft_id <= 'FT240000010'";

type Op = { key: string; sql: string; note: (n: number) => string };

const OPS: Op[] = [
  { key: "UNION ALL", sql: "UNION ALL", note: (n) => `Nối hai danh sách, giữ nguyên mọi dòng kể cả trùng: ${n} dòng.` },
  { key: "UNION", sql: "UNION", note: (n) => `Nối rồi bỏ dòng trùng: mỗi tài khoản chỉ còn một lần, ${n} dòng.` },
  { key: "INTERSECT", sql: "INTERSECT", note: (n) => `Chỉ giữ giá trị có ở cả hai danh sách: ${n} dòng (tài khoản vừa ghi nợ vừa nhận tiền).` },
  { key: "EXCEPT", sql: "EXCEPT", note: (n) => `Giữ giá trị có ở danh sách A mà không có ở B: ${n} dòng.` },
];

type Row = unknown[];
type Data = { a: Row[]; b: Row[]; out: Record<string, Row[]> };

const text = (v: unknown) => formatCell(v, 0);
const countOf = (rows: Row[]) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(text(r[0]), (m.get(text(r[0])) ?? 0) + 1);
  return m;
};

/** Pick UNION ALL, UNION, INTERSECT or EXCEPT and watch two small real result sets combine; duplicates are flagged. Every result is computed by PostgreSQL (PGlite). */
export function SqlSetVennWidget() {
  const [i, setI] = useState(0);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const a = (await runSql(A_SQL)).rows;
      const b = (await runSql(B_SQL)).rows;
      const out: Record<string, Row[]> = {};
      for (const o of OPS) out[o.key] = (await runSql(`${A_SQL} ${o.sql} ${B_SQL} ORDER BY 1`)).rows;
      if (live) setData({ a, b, out });
    })();
    return () => { live = false; };
  }, []);

  const op = OPS[i];
  const rows = data?.out[op.key] ?? [];
  const inA = data ? countOf(data.a) : new Map<string, number>();
  const inB = data ? countOf(data.b) : new Map<string, number>();
  const outSet = new Set(rows.map((r) => text(r[0])));
  const total = (v: string) => (inA.get(v) ?? 0) + (inB.get(v) ?? 0);

  const listSide = (title: string, sample: Row[], mine: Map<string, number>) => (
    <div>
      <strong>{title}: {sample.length} dòng</strong>
      <div className="sql-scroll">
        <table className="sql-table">
          <thead><tr><th>account_id</th><th>trong kết quả?</th></tr></thead>
          <tbody>
            {sample.map((r, n) => {
              const v = text(r[0]);
              const dup = (mine.get(v) ?? 0) > 1;
              const kept = outSet.has(v);
              return (
                <tr key={n} style={kept ? undefined : { opacity: 0.4, textDecoration: "line-through" }}>
                  <td className="num">{v}{dup ? " (lặp trong cùng danh sách)" : ""}</td>
                  <td>{kept ? "có" : "không"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="widget">
      <p className="muted">
        Hai danh sách mẫu lấy từ dữ liệu thật: A là tài khoản bị ghi nợ, B là tài khoản được ghi có của 10 lệnh chuyển khoản đầu tiên (FT240000001 đến FT240000010). Chọn phép toán, câu lệnh chạy thật trên PostgreSQL.
      </p>
      <div className="seg small">
        {OPS.map((o, n) => <button key={o.key} className={i === n ? "on" : ""} onClick={() => setI(n)}>{o.key}</button>)}
      </div>
      <Code>{`${A_SQL}\n${op.sql}\n${B_SQL}\nORDER BY 1;`}</Code>

      {!data && <div className="result">Đang chạy trên PostgreSQL...</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {listSide("A: bên ghi nợ", data.a, inA)}
            {listSide("B: bên ghi có", data.b, inB)}
          </div>

          <strong>Kết quả: {rows.length} dòng</strong>
          <div className="sql-scroll">
            <table className="sql-table">
              <thead><tr><th>account_id</th><th>ghi chú</th></tr></thead>
              <tbody>
                {rows.map((r, n) => {
                  const v = text(r[0]);
                  const t = total(v);
                  const dupInOut = op.key === "UNION ALL" && t > 1;
                  const merged = op.key === "UNION" && t > 1;
                  const colour = dupInOut ? "var(--amber)" : merged ? "var(--cyan)" : "var(--green)";
                  const note = dupInOut
                    ? `xuất hiện ${t} lần`
                    : merged
                      ? `gộp từ ${t} dòng thành 1`
                      : "";
                  return (
                    <tr key={n} style={{ borderLeft: `3px solid ${colour}` }}>
                      <td className="num">{v}</td>
                      <td>{note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="result good">
            {data.a.length} dòng ở A, {data.b.length} dòng ở B, kết quả {rows.length} dòng
            <small>{op.note(rows.length)}</small>
          </div>
        </>
      )}
    </div>
  );
}
