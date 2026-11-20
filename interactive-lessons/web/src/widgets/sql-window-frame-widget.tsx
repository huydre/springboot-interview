import { useEffect, useState } from "react";
import { formatCell, runSql } from "../lib/sql-engine";
import { Code } from "../components/code-block";

type Fn = "row_number" | "rank" | "dense_rank" | "lag" | "sum";
type DatasetKey = "balance" | "entries";

const FUNCTIONS: { key: Fn; label: string }[] = [
  { key: "row_number", label: "ROW_NUMBER" },
  { key: "rank", label: "RANK" },
  { key: "dense_rank", label: "DENSE_RANK" },
  { key: "lag", label: "LAG" },
  { key: "sum", label: "SUM chạy" },
];

type Dataset = {
  label: string;
  /** First column of `columns` is the PARTITION BY column. */
  columns: [string, string, string];
  from: string;
  where: string;
  /** Shorter WHERE shown in the code box. */
  whereShown: string;
  windowOrder: string;
  /** Column fed into LAG and SUM. */
  value: string;
  orderBy: string;
  note: string;
};

const DATASETS: Record<DatasetKey, Dataset> = {
  balance: {
    label: "Số dư theo chi nhánh",
    columns: ["company_id", "account_id", "working_balance"],
    from: "account",
    where: "account_id IN ('1000000002','1000000006','1000000070','1000000007','1000000008','1000000010','1000000024','1000000085')",
    whereShown: "account_id IN (...)  -- 8 tài khoản mẫu của 2 chi nhánh",
    windowOrder: "working_balance DESC",
    value: "working_balance",
    orderBy: "company_id, working_balance DESC, account_id",
    note: "Hai tài khoản 1000000008 và 1000000010 cùng số dư: RANK và DENSE_RANK cho cùng hạng, ROW_NUMBER vẫn cho hai số khác nhau.",
  },
  entries: {
    label: "Bút toán theo tài khoản",
    columns: ["account_id", "booking_date", "amount"],
    from: "stmt_entry",
    where: "account_id IN ('1000000028','1000000046')",
    whereShown: "account_id IN ('1000000028','1000000046')",
    windowOrder: "booking_date, stmt_entry_id",
    value: "amount",
    orderBy: "account_id, booking_date, stmt_entry_id",
    note: "SUM chạy ở dòng cuối mỗi tài khoản bằng working_balance: 50.350.612 và 101.407.367.",
  },
};

const BANDS = ["var(--blue)", "var(--amber)", "var(--green)"];

const fnSql = (fn: Fn, d: Dataset) => {
  const partition = `PARTITION BY ${d.columns[0]}`;
  const over = `OVER (${partition} ORDER BY ${d.windowOrder})`;
  switch (fn) {
    case "row_number": return `ROW_NUMBER() ${over}`;
    case "rank": return `RANK() ${over}`;
    case "dense_rank": return `DENSE_RANK() ${over}`;
    case "lag": return `LAG(${d.value}) ${over}`;
    case "sum": return `sum(${d.value}) ${over}`;
  }
};

const fullSql = (fn: Fn, d: Dataset) =>
  `SELECT ${d.columns.join(", ")},\n       ${fnSql(fn, d)} AS ket_qua\nFROM ${d.from}\nWHERE ${d.whereShown}\nORDER BY ${d.orderBy};`;

const REVEAL_MS = 130;

/** A small real result set whose PARTITION BY groups are colour bands; switch the window function and watch the new column fill in. Every cell is computed by PostgreSQL (runSql). */
export function SqlWindowFrameWidget() {
  const [dsKey, setDsKey] = useState<DatasetKey>("balance");
  const [fn, setFn] = useState<Fn>("rank");
  const [rows, setRows] = useState<unknown[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const ds = DATASETS[dsKey];

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await runSql(`SELECT ${ds.columns.join(", ")}, ${fnSql(fn, ds)} AS ket_qua FROM ${ds.from} WHERE ${ds.where} ORDER BY ${ds.orderBy}`);
        if (!live) return;
        setRows(res.rows);
        setError(null);
        setShown(0);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { live = false; };
  }, [fn, ds]);

  useEffect(() => {
    if (!rows || shown >= rows.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), REVEAL_MS);
    return () => clearTimeout(t);
  }, [rows, shown]);

  const groups: string[] = [];
  rows?.forEach((r) => { const g = String(r[0]); if (!groups.includes(g)) groups.push(g); });

  const cell = (v: unknown) => (v === null ? "NULL" : typeof v === "number" ? v.toLocaleString("vi-VN") : formatCell(v, 1082));
  const money = (v: unknown) => (v === null ? "NULL" : Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 2 }));

  return (
    <div className="widget">
      <p className="muted">
        Mỗi màu là một partition (một nhóm của <code>PARTITION BY {ds.columns[0]}</code>). Chọn hàm để thấy cột <code>ket_qua</code> điền dần, tính bởi PostgreSQL.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="seg small">
          {(Object.keys(DATASETS) as DatasetKey[]).map((k) => (
            <button key={k} className={dsKey === k ? "on" : ""} onClick={() => setDsKey(k)}>{DATASETS[k].label}</button>
          ))}
        </div>
        <div className="seg small">
          {FUNCTIONS.map((f) => (
            <button key={f.key} className={fn === f.key ? "on" : ""} onClick={() => setFn(f.key)}>{f.label}</button>
          ))}
        </div>
      </div>
      <Code>{fullSql(fn, ds)}</Code>

      {error && <div className="result bad">{error}</div>}
      {!rows && !error && <div className="result">Đang chạy trên PostgreSQL...</div>}
      {rows && (
        <div className="sql-scroll">
          <table className="sql-table">
            <thead>
              <tr>
                {ds.columns.map((c) => <th key={c}>{c}</th>)}
                <th style={{ color: "var(--cyan)" }}>ket_qua</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const band = BANDS[groups.indexOf(String(r[0])) % BANDS.length];
                const visible = i < shown;
                return (
                  <tr key={i} style={{ borderLeft: `4px solid ${band}`, background: `color-mix(in srgb, ${band} 9%, transparent)` }}>
                    <td>{cell(r[0])}</td>
                    <td>{cell(r[1])}</td>
                    <td className="num">{money(r[2])}</td>
                    <td className={`num ${visible && r[3] === null ? "null" : ""}`} style={{ fontWeight: 600, opacity: visible ? 1 : 0.15, transition: "opacity 0.2s" }}>
                      {visible ? (fn === "lag" || fn === "sum" ? money(r[3]) : cell(r[3])) : "..."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ margin: 0 }}>{ds.note}</p>
    </div>
  );
}
