import { useState } from "react";
import { resetDb, runSql } from "../lib/sql-engine";

type Fail = "none" | "before" | "between" | "after";
type Step = { sql: string; kind: "stmt" | "incident" };
type LogLine = { cls: "ok" | "err" | ""; text: string };
type Outcome = {
  log: LogLine[];
  rows: { id: string; before: number; after: number }[];
  verdict: { cls: "good" | "warn" | "bad"; title: string; note: string };
};

const FROM = "1000000003";
const TO = "1000000011";
const AMOUNT = 5_000_000;
const DEBIT = `UPDATE account SET working_balance = working_balance - ${AMOUNT} WHERE account_id = '${FROM}'`;
const CREDIT = `UPDATE account SET working_balance = working_balance + ${AMOUNT} WHERE account_id = '${TO}'`;
/** A real statement that fails ("division by zero"), standing in for a crash, a lost connection or a bug. */
const INCIDENT = "SELECT 1 / 0";

const FAILS: { key: Fail; label: string }[] = [
  { key: "none", label: "Không có sự cố" },
  { key: "before", label: "Trước khi trừ tiền" },
  { key: "between", label: "Giữa trừ và cộng" },
  { key: "after", label: "Sau khi cộng, trước COMMIT" },
];

const money = (n: number) => n.toLocaleString("vi-VN");
const signed = (n: number) => (n === 0 ? "0" : `${n > 0 ? "+" : "-"}${money(Math.abs(n))}`);

function buildSteps(useTx: boolean, fail: Fail): Step[] {
  const inc: Step = { sql: INCIDENT, kind: "incident" };
  const core: Step[] = [{ sql: DEBIT, kind: "stmt" }, { sql: CREDIT, kind: "stmt" }];
  if (fail === "before") core.unshift(inc);
  if (fail === "between") core.splice(1, 0, inc);
  if (fail === "after") core.push(inc);
  return useTx ? [{ sql: "BEGIN", kind: "stmt" }, ...core, { sql: "COMMIT", kind: "stmt" }] : core;
}

async function balances(): Promise<Record<string, number>> {
  const res = await runSql(`SELECT account_id, working_balance FROM account WHERE account_id IN ('${FROM}', '${TO}')`);
  return Object.fromEntries(res.rows.map((r) => [String(r[0]), Number(r[1])]));
}

async function simulate(useTx: boolean, fail: Fail): Promise<Outcome> {
  await resetDb();
  try {
    const before = await balances();
    const log: LogLine[] = [];
    let failed = false;
    for (const step of buildSteps(useTx, fail)) {
      try {
        await runSql(step.sql);
        log.push({ cls: "ok", text: `${step.sql};  -- chạy xong` });
      } catch (e) {
        failed = true;
        const msg = e instanceof Error ? e.message : String(e);
        log.push({ cls: "err", text: `${step.sql};  -- LỖI: ${msg}` });
        break;
      }
    }
    if (failed && useTx) {
      await runSql("ROLLBACK");
      log.push({ cls: "ok", text: "ROLLBACK;  -- máy chủ huỷ giao dịch dở, mọi thay đổi chưa COMMIT biến mất" });
    }
    const after = await balances();
    const rows = [FROM, TO].map((id) => ({ id, before: before[id], after: after[id] }));
    const dFrom = rows[0].after - rows[0].before;
    const dTo = rows[1].after - rows[1].before;
    const verdict = judge(dFrom, dTo, failed, useTx);
    return { log, rows, verdict };
  } finally {
    await resetDb();
  }
}

function judge(dFrom: number, dTo: number, failed: boolean, useTx: boolean): Outcome["verdict"] {
  if (dFrom === 0 && dTo === 0) {
    return failed
      ? {
          cls: "good",
          title: "Cả hai số dư giữ nguyên",
          note: useTx
            ? "Giao dịch chưa COMMIT bị huỷ trọn vẹn. Không mất tiền, chỉ là khoản chuyển chưa xảy ra và ứng dụng có thể thử lại."
            : "Sự cố đến trước khi có lệnh nào ghi, nên chưa có gì thay đổi. Hãy thử đặt sự cố ở giữa hai lệnh.",
        }
      : { cls: "warn", title: "Không có gì thay đổi", note: "Không có lệnh nào chạy." };
  }
  if (dFrom === -AMOUNT && dTo === AMOUNT) {
    return failed
      ? { cls: "warn", title: "Chuyển xong dù có sự cố", note: "Sự cố đến sau khi cả hai bước đã ghi xong nên không mất tiền, nhưng đó chỉ là may mắn về thời điểm." }
      : { cls: "good", title: `Chuyển ${money(AMOUNT)} thành công`, note: useTx ? "Hai bước được COMMIT cùng lúc." : "Hai lệnh đều chạy, tổng hai tài khoản không đổi." };
  }
  return {
    cls: "bad",
    title: `Mất ${money(AMOUNT)}: tiền đã rời tài khoản gửi nhưng chưa đến tài khoản nhận`,
    note: "Không có transaction nên lệnh trừ tiền đã được ghi vĩnh viễn (mỗi lệnh tự COMMIT). Không có bước nào để hoàn tác khoản đã trừ.",
  };
}

/** Moves 5,000,000 between two real T24 accounts with a failure injected at a chosen point, with and without a transaction; the balances are read from a real PostgreSQL run, then the data is reset. */
export function SqlDmlTransactionWidget() {
  const [useTx, setUseTx] = useState(false);
  const [fail, setFail] = useState<Fail>("between");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = buildSteps(useTx, fail);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setOut(await simulate(useTx, fail));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const change = (fn: () => void) => { fn(); setOut(null); };
  const cell = { padding: "6px 10px" } as const;

  return (
    <div className="widget">
      <p className="muted">
        Chuyển {money(AMOUNT)} VND từ tài khoản {FROM} sang {TO}. Chọn có dùng transaction hay không, chọn nơi xảy ra sự cố (một lệnh lỗi thật, ví dụ mất kết nối), rồi bấm Chạy. Số dư được đọc từ một lần chạy thật trên PostgreSQL, sau đó dữ liệu được đặt lại.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        <div className="seg small">
          <button className={!useTx ? "on" : ""} onClick={() => change(() => setUseTx(false))}>Không transaction</button>
          <button className={useTx ? "on" : ""} onClick={() => change(() => setUseTx(true))}>Trong BEGIN ... COMMIT</button>
        </div>
        <div className="seg small">
          {FAILS.map((f) => <button key={f.key} className={fail === f.key ? "on" : ""} onClick={() => change(() => setFail(f.key))}>{f.label}</button>)}
        </div>
      </div>
      <ol className="log">
        {steps.map((s, i) => (
          <li key={i} className={s.kind === "incident" ? "err" : ""}>
            {s.kind === "incident" ? `${s.sql};  -- sự cố mô phỏng` : `${s.sql};`}
          </li>
        ))}
      </ol>
      <div className="actions">
        <button className="btn primary" disabled={busy} onClick={() => void run()}>{busy ? "Đang chạy..." : "Chạy kịch bản"}</button>
      </div>
      {error && <div className="result bad"><span>Lỗi</span><small>{error}</small></div>}
      {out && (
        <div style={{ display: "grid", gap: 10 }}>
          <ol className="log">
            {out.log.map((l, i) => <li key={i} className={l.cls}>{l.text}</li>)}
          </ol>
          <div className="sql-scroll">
            <table className="sql-table">
              <thead><tr><th>account_id</th><th>trước</th><th>sau</th><th>thay đổi</th></tr></thead>
              <tbody>
                {out.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={cell}>{r.id}</td>
                    <td className="num">{money(r.before)}</td>
                    <td className="num">{money(r.after)}</td>
                    <td className="num">{signed(r.after - r.before)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={cell}><strong>Tổng hai tài khoản</strong></td>
                  <td className="num">{money(out.rows[0].before + out.rows[1].before)}</td>
                  <td className="num">{money(out.rows[0].after + out.rows[1].after)}</td>
                  <td className="num">{signed(out.rows[0].after + out.rows[1].after - out.rows[0].before - out.rows[1].before)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={`result ${out.verdict.cls}`}>
            {out.verdict.title}
            <small>{out.verdict.note}</small>
          </div>
        </div>
      )}
    </div>
  );
}
