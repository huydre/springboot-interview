import { useState } from "react";

type Mode = "public" | "private";

/** Encapsulation demo: the same account with a public field vs private field + guarded methods. */
export function BankWidget() {
  const [mode, setMode] = useState<Mode>("private");
  const [balance, setBalance] = useState(100);
  const [log, setLog] = useState<{ text: string; kind: "ok" | "err" }[]>([]);

  const push = (text: string, kind: "ok" | "err" = "ok") => setLog((l) => [{ text, kind }, ...l].slice(0, 5));
  const reset = (m: Mode = mode) => { setMode(m); setBalance(100); setLog([]); };

  const deposit = () => { setBalance((b) => b + 100); push("deposit(100) → OK"); };
  const withdraw = () => {
    if (mode === "private" && 500 > balance) { push("withdraw(500) → IllegalStateException: insufficient balance", "err"); return; }
    setBalance((b) => b - 500);
    push("withdraw(500) → OK (không ai kiểm tra!)", mode === "public" ? "err" : "ok");
  };
  const assign = () => {
    if (mode === "private") { push("account.balance = -1000 → lỗi biên dịch: balance has private access", "err"); return; }
    setBalance(-1000);
    push("account.balance = -1000 → OK (quy tắc bị phá)", "err");
  };

  const valid = balance >= 0;
  return (
    <div className="widget">
      <div className="seg">
        <button className={mode === "public" ? "on" : ""} onClick={() => reset("public")}>public long balance</button>
        <button className={mode === "private" ? "on" : ""} onClick={() => reset("private")}>private + deposit/withdraw</button>
      </div>
      <div className="bank">
        <div className={`balance ${valid ? "good" : "bad"}`}>
          <small>balance</small>
          <strong>{balance.toLocaleString("vi-VN")}</strong>
          <span>{valid ? "✓ số dư hợp lệ" : "✕ số dư âm: quy tắc bị phá"}</span>
        </div>
        <div className="actions">
          <button className="btn" onClick={deposit}>deposit(100)</button>
          <button className="btn" onClick={withdraw}>withdraw(500)</button>
          <button className="btn danger" onClick={assign}>account.balance = -1000</button>
          <button className="btn ghost" onClick={() => reset()}>Đặt lại</button>
        </div>
      </div>
      <ul className="log">
        {log.length === 0 && <li className="muted">Bấm một hành động để xem kết quả…</li>}
        {log.map((l, i) => <li key={i} className={l.kind}>{l.text}</li>)}
      </ul>
    </div>
  );
}
