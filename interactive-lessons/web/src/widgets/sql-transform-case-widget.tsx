import { useState } from "react";
import { Code } from "../components/code-block";

type Row = { id: string; note: string; balance: number };
type Branch = { test: (b: number) => boolean; cond: string; label: string };

/** Real VND accounts of the T24 dataset (SELECT account_id, category_id, working_balance FROM account WHERE ccy = 'VND'). */
const ROWS: Row[] = [
  { id: "1000000074", note: "vay", balance: -41666000 },
  { id: "1000000009", note: "thanh toán", balance: 0 },
  { id: "1000000002", note: "tiết kiệm", balance: 5088114 },
  { id: "1000000008", note: "tiết kiệm", balance: 10176229 },
  { id: "1000000001", note: "thanh toán", balance: 107956000 },
];

const DEBT: Branch = { test: (b) => b < 0, cond: "working_balance < 0", label: "Dư nợ" };
const LOW: Branch = { test: (b) => b < 10000000, cond: "working_balance < 10000000", label: "Thấp" };
const MID: Branch = { test: (b) => b < 100000000, cond: "working_balance < 100000000", label: "Trung bình" };

const GOOD_ORDER: Branch[] = [DEBT, LOW, MID];
const BAD_ORDER: Branch[] = [MID, LOW, DEBT];

const money = (n: number) => n.toLocaleString("vi-VN");

/** Shows CASE WHEN testing branches from top to bottom and stopping at the first match, with an order toggle that breaks the tiers. */
export function SqlTransformCaseWidget() {
  const [rowIdx, setRowIdx] = useState(0);
  const [bad, setBad] = useState(false);
  const [step, setStep] = useState(0);

  const row = ROWS[rowIdx];
  const branches = bad ? BAD_ORDER : GOOD_ORDER;
  const matchAt = branches.findIndex((b) => b.test(row.balance));
  const stop = matchAt === -1 ? branches.length : matchAt; // index where evaluation ends
  const finished = step > stop;
  const answer = matchAt === -1 ? "Cao" : branches[matchAt].label;
  const correct = row.balance < 0 ? "Dư nợ" : row.balance < 10000000 ? "Thấp" : row.balance < 100000000 ? "Trung bình" : "Cao";

  const reset = () => setStep(0);
  const state = (i: number): "pending" | "no" | "yes" | "skipped" => {
    if (i > stop) return finished ? "skipped" : "pending";
    if (i >= step) return "pending";
    return i === matchAt ? "yes" : "no";
  };
  const mark = { pending: "…", no: "xét nhánh kế", yes: "dừng tại đây", skipped: "không xét" } as const;

  return (
    <div className="widget">
      <div className="seg small">
        {ROWS.map((r, i) => (
          <button key={r.id} className={rowIdx === i ? "on" : ""} onClick={() => { setRowIdx(i); reset(); }}>
            {r.id} ({r.note})
          </button>
        ))}
      </div>
      <div className="pick">
        <label>
          <input type="checkbox" checked={bad} onChange={(e) => { setBad(e.target.checked); reset(); }} /> Đảo thứ tự nhánh (đặt <code>&lt; 100000000</code> lên đầu)
        </label>
      </div>

      <Code>{`CASE\n${branches.map((b) => `  WHEN ${b.cond} THEN '${b.label}'`).join("\n")}\n  ELSE 'Cao'\nEND`}</Code>
      <div className="result">
        Dòng đang xét: tài khoản {row.id}, working_balance = {money(row.balance)}
      </div>

      <table className="sql-table">
        <thead><tr><th>Thứ tự</th><th>Điều kiện</th><th>Với {money(row.balance)}</th></tr></thead>
        <tbody>
          {branches.map((b, i) => {
            const s = state(i);
            return (
              <tr key={b.cond} style={{ opacity: s === "skipped" ? 0.4 : 1 }}>
                <td>WHEN {i + 1}</td>
                <td><code>{b.cond}</code></td>
                <td>{s === "pending" ? "…" : s === "skipped" ? mark.skipped : `${b.test(row.balance) ? "Đúng" : "Sai"}: ${mark[s]}`}</td>
              </tr>
            );
          })}
          <tr style={{ opacity: finished && stop < branches.length ? 0.4 : 1 }}>
            <td>ELSE</td>
            <td>mọi nhánh trên đều sai</td>
            <td>{finished ? (stop === branches.length ? "dùng ELSE" : mark.skipped) : "…"}</td>
          </tr>
        </tbody>
      </table>

      <div className="pick">
        <button className="btn" disabled={finished} onClick={() => setStep((s) => s + 1)}>{finished ? "Đã xong" : "Xét nhánh tiếp theo"}</button>
        <button className="btn" onClick={reset}>Làm lại</button>
      </div>

      <div className={`result ${finished ? (answer === correct ? "good" : "bad") : ""}`}>
        {!finished && "Bấm \"Xét nhánh tiếp theo\": CASE thử từng nhánh từ trên xuống."}
        {finished && `Kết quả: '${answer}'. CASE dừng ở nhánh đầu tiên đúng, các nhánh sau không được xét.`}
        {finished && answer !== correct && <small>Sai hạng: số dư {money(row.balance)} phải là '{correct}', nhưng nhánh rộng hơn đứng trước đã "nuốt" nó. Nhánh hẹp phải đứng trước.</small>}
      </div>
    </div>
  );
}
