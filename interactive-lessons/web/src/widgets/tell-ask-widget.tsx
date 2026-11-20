import { useState } from "react";
import { Code } from "../components/code-block";

type Mode = "anemic" | "rich";
type Entry = { text: string; kind: "ok" | "err" };

const CODE_ANEMIC = `class Account {                       // chỉ chứa dữ liệu
  private long balance;
  long getBalance() { return balance; }
  void setBalance(long b) { balance = b; }
}
class PaymentService {                // quy tắc nằm ở service
  void pay(Account a, long amount) {
    if (a.getBalance() >= amount)     // HỎI rồi tự quyết
      a.setBalance(a.getBalance() - amount);
  }
}
class RefundJob {                     // người viết sau, quên kiểm tra
  void chargeFee(Account a, long fee) {
    a.setBalance(a.getBalance() - fee);
  }
}`;
const CODE_RICH = `class Account {
  private long balance;
  void withdraw(long amount) {        // quy tắc nằm cùng dữ liệu
    if (amount > balance)
      throw new IllegalStateException("insufficient balance");
    balance -= amount;
  }
}
// PaymentService và RefundJob chỉ BẢO account làm:
account.withdraw(500);
account.withdraw(150);`;

/** Anemic model (rule in the service, anyone can forget it) vs rich model (rule inside Account). Outputs were run on JDK 21. */
export function TellAskWidget() {
  const [mode, setMode] = useState<Mode>("anemic");
  const [balance, setBalance] = useState(100);
  const [log, setLog] = useState<Entry[]>([]);
  const push = (e: Entry) => setLog((l) => [e, ...l].slice(0, 5));
  const reset = (m: Mode) => { setMode(m); setBalance(100); setLog([]); };

  const pay = () => {
    if (mode === "anemic") {
      if (balance >= 500) setBalance(balance - 500);
      push({ text: "PaymentService.pay(500): service tự kiểm tra, số dư không đổi", kind: "ok" });
    } else if (500 > balance) push({ text: "account.withdraw(500) → IllegalStateException: insufficient balance", kind: "err" });
    else { setBalance(balance - 500); push({ text: "account.withdraw(500) → OK", kind: "ok" }); }
  };
  const fee = () => {
    if (mode === "anemic") {
      setBalance(balance - 150);
      push({ text: `RefundJob.chargeFee(150): không ai kiểm tra → số dư ${balance - 150}`, kind: balance - 150 < 0 ? "err" : "ok" });
    } else if (150 > balance) push({ text: "account.withdraw(150) → IllegalStateException: insufficient balance", kind: "err" });
    else { setBalance(balance - 150); push({ text: "account.withdraw(150) → OK", kind: "ok" }); }
  };

  return (
    <div className="widget">
      <div className="seg">
        <button className={mode === "anemic" ? "on" : ""} onClick={() => reset("anemic")}>Hỏi rồi tự quyết (anemic)</button>
        <button className={mode === "rich" ? "on" : ""} onClick={() => reset("rich")}>Bảo object làm (rich)</button>
      </div>
      <Code>{mode === "anemic" ? CODE_ANEMIC : CODE_RICH}</Code>
      <div className="bank">
        <div className={`balance ${balance >= 0 ? "good" : "bad"}`}>
          <small>balance (ban đầu 100)</small>
          <strong>{balance}</strong>
          <span>{balance >= 0 ? "✓ hợp lệ" : "✕ số dư âm: quy tắc bị phá"}</span>
        </div>
        <div className="actions">
          <button className="btn" onClick={pay}>Trả tiền 500</button>
          <button className="btn" onClick={fee}>Thu phí 150</button>
          <button className="btn ghost" onClick={() => reset(mode)}>Đặt lại</button>
        </div>
      </div>
      {log.length > 0 && <ul className="log">{log.map((e, i) => <li key={i} className={e.kind}>{e.text}</li>)}</ul>}
    </div>
  );
}
