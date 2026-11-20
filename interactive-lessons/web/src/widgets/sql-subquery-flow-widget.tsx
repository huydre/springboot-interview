import { useEffect, useState } from "react";
import { formatCell, runSql } from "../lib/sql-engine";
import { Code } from "../components/code-block";

type Row = unknown[];
type Kind = "scalar" | "in" | "correlated";

const TABS: { key: Kind; label: string }[] = [
  { key: "scalar", label: "Vô hướng: trên mức trung bình" },
  { key: "in", label: "IN: khách có vay LIVE" },
  { key: "correlated", label: "Tương quan: trên trung bình chi nhánh" },
];

/** Six real accounts from four branches: three above and three at or below their own branch average. */
const SAMPLE = ["1000000002", "1000000008", "1000000029", "1000000040", "1000000062", "1000000069"];

type Data = {
  scalar: { avgFull: string; avgShown: string; rows: Row[] };
  inList: { ids: string[]; rows: Row[] };
  corr: { outer: Row[]; inner: { avg: string; keep: boolean }[] };
};

const money = (v: unknown) => Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const text = (v: unknown) => formatCell(v, 0);

const SQL_SCALAR_INNER = "SELECT avg(working_balance) FROM account";
const SQL_IN_INNER = "SELECT customer_id FROM loan WHERE status = 'LIVE'";

const fullSql = (k: Kind) =>
  k === "scalar"
    ? `SELECT account_id, working_balance\nFROM account\nWHERE working_balance > (\n  ${SQL_SCALAR_INNER}\n)\nORDER BY working_balance DESC;`
    : k === "in"
      ? `SELECT customer_id, short_name\nFROM customer\nWHERE customer_id IN (\n  ${SQL_IN_INNER}\n)\nORDER BY customer_id;`
      : `SELECT a.account_id, a.company_id, a.working_balance\nFROM account a\nWHERE a.working_balance > (\n  SELECT avg(b.working_balance)\n  FROM account b\n  WHERE b.company_id = a.company_id\n);`;

const maxStep = (k: Kind, d: Data) => (k === "correlated" ? d.corr.outer.length : 2);

/** Shows how PostgreSQL evaluates a subquery: the inner query first (once) and then the outer one, or the inner query once per outer row when it is correlated. All rows come from real runs on the T24 dataset. */
export function SqlSubqueryFlowWidget() {
  const [kind, setKind] = useState<Kind>("scalar");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const avgFull = String((await runSql(`${SQL_SCALAR_INNER}`)).rows[0][0]);
      const avgShown = String((await runSql("SELECT round(avg(working_balance), 2) FROM account")).rows[0][0]);
      const scalarRows = (await runSql(`SELECT account_id, working_balance FROM account WHERE working_balance > ${avgFull} ORDER BY working_balance DESC, account_id`)).rows;

      const ids = (await runSql(`${SQL_IN_INNER} ORDER BY customer_id`)).rows.map((r) => String(r[0]));
      const inRows = (await runSql(`SELECT customer_id, short_name FROM customer WHERE customer_id IN (${ids.join(", ")}) ORDER BY customer_id`)).rows;

      const outer = (await runSql(`SELECT account_id, company_id, working_balance FROM account WHERE account_id IN (${SAMPLE.map((s) => `'${s}'`).join(", ")}) ORDER BY account_id`)).rows;
      const inner: { avg: string; keep: boolean }[] = [];
      for (const r of outer) {
        const res = (await runSql(`SELECT round(avg(working_balance), 2), ${String(r[2])} > avg(working_balance) FROM account WHERE company_id = '${String(r[1])}'`)).rows[0];
        inner.push({ avg: String(res[0]), keep: res[1] === true });
      }
      if (live) setData({ scalar: { avgFull, avgShown, rows: scalarRows }, inList: { ids, rows: inRows }, corr: { outer, inner } });
    })();
    return () => { live = false; };
  }, []);

  const pick = (k: Kind) => { setKind(k); setStep(0); };

  return (
    <div className="widget">
      <p className="muted">
        Chọn một loại subquery rồi bấm Tiếp để xem PostgreSQL chạy từng bước. Mọi số liệu lấy từ lần chạy thật trên dữ liệu T24.
      </p>
      <div className="seg small">
        {TABS.map((t) => <button key={t.key} className={kind === t.key ? "on" : ""} onClick={() => pick(t.key)}>{t.label}</button>)}
      </div>
      <Code>{fullSql(kind)}</Code>

      {!data && <div className="result">Đang chạy trên PostgreSQL...</div>}
      {data && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Lùi</button>
            <button className="btn primary" disabled={step >= maxStep(kind, data)} onClick={() => setStep(step + 1)}>Tiếp</button>
            <button className="btn ghost" disabled={step === 0} onClick={() => setStep(0)}>Về đầu</button>
            <span className="muted">Bước {step} / {maxStep(kind, data)}</span>
          </div>
          {kind === "scalar" && <Scalar d={data.scalar} step={step} />}
          {kind === "in" && <InList d={data.inList} step={step} />}
          {kind === "correlated" && <Correlated d={data.corr} step={step} />}
        </>
      )}
    </div>
  );
}

const stage = { padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--panel-2)", display: "grid", gap: 6 } as const;
const tag = { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted)" } as const;

function Scalar({ d, step }: { d: Data["scalar"]; step: number }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ ...stage, borderLeft: `3px solid ${step >= 1 ? "var(--cyan)" : "var(--line)"}` }}>
        <span style={tag}>Bước 1: truy vấn trong, chạy một lần</span>
        <code>{SQL_SCALAR_INNER}</code>
        {step >= 1 ? <strong>Kết quả: một giá trị duy nhất = {money(d.avgShown)}</strong> : <span className="muted">Chưa chạy. PostgreSQL luôn làm phần trong ngoặc trước.</span>}
      </div>
      <div style={{ ...stage, borderLeft: `3px solid ${step >= 2 ? "var(--green)" : "var(--line)"}` }}>
        <span style={tag}>Bước 2: truy vấn ngoài dùng kết quả đó</span>
        {step >= 1 ? <code>WHERE working_balance &gt; {money(d.avgShown)}</code> : <span className="muted">Đang chờ giá trị từ bước 1.</span>}
        {step >= 2 && (
          <>
            <strong>{d.rows.length} tài khoản có số dư lớn hơn mức trung bình</strong>
            <div className="sql-scroll" style={{ maxHeight: 220 }}>
              <table className="sql-table">
                <thead><tr><th>account_id</th><th>working_balance</th></tr></thead>
                <tbody>{d.rows.map((r) => <tr key={text(r[0])}><td>{text(r[0])}</td><td className="num">{money(r[1])}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InList({ d, step }: { d: Data["inList"]; step: number }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ ...stage, borderLeft: `3px solid ${step >= 1 ? "var(--cyan)" : "var(--line)"}` }}>
        <span style={tag}>Bước 1: truy vấn trong, chạy một lần</span>
        <code>{SQL_IN_INNER}</code>
        {step >= 1 ? (
          <>
            <strong>Kết quả: một danh sách {d.ids.length} mã khách hàng</strong>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{d.ids.join(", ")}</span>
          </>
        ) : <span className="muted">Chưa chạy.</span>}
      </div>
      <div style={{ ...stage, borderLeft: `3px solid ${step >= 2 ? "var(--green)" : "var(--line)"}` }}>
        <span style={tag}>Bước 2: truy vấn ngoài lọc theo danh sách</span>
        {step >= 1 ? <code>WHERE customer_id IN ({d.ids.length} mã ở trên)</code> : <span className="muted">Đang chờ danh sách từ bước 1.</span>}
        {step >= 2 && (
          <>
            <strong>{d.rows.length} khách hàng có mã nằm trong danh sách</strong>
            <div className="sql-scroll" style={{ maxHeight: 220 }}>
              <table className="sql-table">
                <thead><tr><th>customer_id</th><th>short_name</th></tr></thead>
                <tbody>{d.rows.map((r) => <tr key={text(r[0])}><td className="num">{text(r[0])}</td><td>{text(r[1])}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Correlated({ d, step }: { d: Data["corr"]; step: number }) {
  const kept = d.inner.slice(0, step).filter((x) => x.keep).length;
  const done = step >= d.outer.length;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p className="muted" style={{ margin: 0 }}>
        Truy vấn trong nhắc tới <code>a.company_id</code> của dòng ngoài, nên không chạy một lần được. Với mỗi dòng ngoài, PostgreSQL chạy lại truy vấn trong một lần. Mẫu: 6 tài khoản thật.
      </p>
      <div className="sql-scroll">
        <table className="sql-table">
          <thead>
            <tr><th>account_id</th><th>company_id</th><th>working_balance</th><th>truy vấn trong chạy với company_id này: avg</th><th>kết luận</th></tr>
          </thead>
          <tbody>
            {d.outer.map((r, n) => {
              const ran = n < step;
              const current = n === step - 1;
              const inner = d.inner[n];
              const edge = ran ? (inner.keep ? "var(--green)" : "var(--amber)") : "transparent";
              return (
                <tr key={text(r[0])} style={{ borderLeft: `3px solid ${edge}`, background: current ? "var(--panel-2)" : undefined, opacity: ran || n === step ? 1 : 0.55 }}>
                  <td>{text(r[0])}</td>
                  <td>{text(r[1])}</td>
                  <td className="num">{money(r[2])}</td>
                  <td className="num">{ran ? money(inner.avg) : n === step ? "sẽ chạy ở bước tiếp" : "chờ"}</td>
                  <td>{ran ? (inner.keep ? "giữ (lớn hơn avg)" : "loại (không lớn hơn)") : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={`result ${done ? "good" : ""}`}>
        {done
          ? `Truy vấn trong đã chạy ${d.outer.length} lần, một lần cho mỗi dòng ngoài. Giữ lại ${kept} trên ${d.outer.length} dòng.`
          : step === 0
            ? "Chưa chạy lần nào. Bấm Tiếp để xử lý dòng đầu tiên."
            : `Đã chạy truy vấn trong ${step} lần. Giữ lại ${kept} dòng cho tới giờ.`}
        <small>Dòng cùng chi nhánh có cùng avg, nhưng PostgreSQL vẫn coi mỗi dòng là một lần so sánh riêng.</small>
      </div>
    </div>
  );
}
