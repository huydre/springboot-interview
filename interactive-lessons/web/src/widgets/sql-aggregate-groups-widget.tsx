import { useState } from "react";
import { Code } from "../components/code-block";

type Row = { id: string; branch: string; balance: number };

/** The 9 accounts of category 6006 from the T24 dataset (SELECT account_id, company_id, working_balance FROM account WHERE category_id = 6006). */
const ROWS: Row[] = [
  { id: "1000000006", branch: "VN0010001", balance: 20281474 },
  { id: "1000000042", branch: "VN0010001", balance: 50881146 },
  { id: "1000000046", branch: "VN0010001", balance: 101407367 },
  { id: "1000000062", branch: "VN0010002", balance: 3052868789 },
  { id: "1000000065", branch: "VN0010002", balance: 203524587 },
  { id: "1000000053", branch: "VN0010003", balance: 1010536793 },
  { id: "1000000033", branch: "VN0010004", balance: 101407367 },
  { id: "1000000012", branch: "VN0010005", balance: 50703683 },
  { id: "1000000028", branch: "VN0010005", balance: 50350612 },
];

const STEPS = ["1. Bảng gốc", "2. Gom theo chi nhánh", "3. Chạy COUNT(*) mỗi nhóm", "4. Chạy SUM mỗi nhóm"] as const;
const money = (n: number) => n.toLocaleString("vi-VN");

/** Shows rows being collected into groups by GROUP BY, then one aggregate per group, with an optional HAVING filter. */
export function SqlAggregateGroupsWidget() {
  const [step, setStep] = useState(0);
  const [having, setHaving] = useState(false);

  const groups = [...new Set(ROWS.map((r) => r.branch))].map((b) => {
    const rows = ROWS.filter((r) => r.branch === b);
    return { branch: b, rows, count: rows.length, sum: rows.reduce((s, r) => s + r.balance, 0) };
  });
  const shown = having && step >= 2 ? groups.filter((g) => g.count >= 2) : groups;
  const hidden = groups.length - shown.length;

  const sql =
    step === 2
      ? `SELECT company_id, COUNT(*)\nFROM account WHERE category_id = 6006\nGROUP BY company_id${having ? "\nHAVING COUNT(*) >= 2" : ""};`
      : step === 3
        ? `SELECT company_id, SUM(working_balance)\nFROM account WHERE category_id = 6006\nGROUP BY company_id${having ? "\nHAVING COUNT(*) >= 2" : ""};`
        : `SELECT account_id, company_id, working_balance\nFROM account WHERE category_id = 6006;`;

  return (
    <div className="widget">
      <div className="seg small">
        {STEPS.map((s, i) => <button key={s} className={step === i ? "on" : ""} onClick={() => setStep(i)}>{s}</button>)}
      </div>
      <Code>{step === 1 ? "GROUP BY company_id  (chỉ xếp các dòng cùng chi nhánh vào cùng một nhóm, chưa tính gì)" : sql}</Code>

      {step === 0 && (
        <table className="sql-table">
          <thead><tr><th>account_id</th><th>company_id</th><th>working_balance</th></tr></thead>
          <tbody>
            {ROWS.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.branch}</td><td className="num">{money(r.balance)}</td></tr>)}
          </tbody>
        </table>
      )}

      {step >= 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
          {shown.map((g) => (
            <div key={g.branch} style={{ border: "1px solid var(--line, #cbd5e1)", borderRadius: 8, padding: 10 }}>
              <strong>{g.branch}</strong>
              <table className="sql-table" style={{ marginTop: 6 }}>
                <tbody>
                  {g.rows.map((r) => <tr key={r.id}><td>{r.id}</td><td className="num">{money(r.balance)}</td></tr>)}
                </tbody>
              </table>
              {step === 2 && <div className="result good">COUNT(*) = {g.count}</div>}
              {step === 3 && <div className="result good">SUM = {money(g.sum)}</div>}
            </div>
          ))}
        </div>
      )}

      {step >= 2 && (
        <div className="pick">
          <label>
            <input type="checkbox" checked={having} onChange={(e) => setHaving(e.target.checked)} /> Thêm <code>HAVING COUNT(*) &gt;= 2</code>
          </label>
        </div>
      )}
      <div className={`result ${step >= 2 ? "good" : ""}`}>
        {step === 0 && "9 dòng, mỗi dòng là một tài khoản tiết kiệm. Chưa có nhóm nào."}
        {step === 1 && `9 dòng được xếp vào ${groups.length} nhóm, mỗi chi nhánh một nhóm. Hàm tổng hợp sẽ chạy riêng trong từng nhóm.`}
        {step >= 2 && `Kết quả: ${shown.length} dòng, mỗi nhóm thu thành đúng một dòng.`}
        {step >= 2 && hidden > 0 && <small>HAVING lọc nhóm sau khi gom: {hidden} nhóm chỉ có 1 tài khoản bị bỏ.</small>}
      </div>
    </div>
  );
}
