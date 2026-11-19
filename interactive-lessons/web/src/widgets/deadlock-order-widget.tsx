import { useState } from "react";

type Mode = "opposite" | "ordered";

/** Two transfers running at the same time; both outcomes were run on JDK 21. */
export function DeadlockOrderWidget() {
  const [mode, setMode] = useState<Mode>("opposite");
  const ordered = mode === "ordered";
  return (
    <div className="widget">
      <div className="seg small">
        <button className={!ordered ? "on" : ""} onClick={() => setMode("opposite")}>khoá theo chiều chuyển tiền</button>
        <button className={ordered ? "on" : ""} onClick={() => setMode("ordered")}>khoá id nhỏ trước</button>
      </div>
      <div className="two">
        <pre className="code">{ordered
          ? `// cả hai giao dịch đều khoá account 1 trước
synchronized (acc1) {
    synchronized (acc2) { transfer(); }
}`
          : `// transfer-1-to-2
synchronized (A) { synchronized (B) { ... } }
// transfer-2-to-1
synchronized (B) { synchronized (A) { ... } }`}</pre>
        <ul className="log">
          {ordered ? (
            <>
              <li className="ok">transfer-1-to-2 xong</li>
              <li className="ok">transfer-2-to-1 xong</li>
              <li>cả hai xong sau 415 ms</li>
            </>
          ) : (
            <>
              <li className="err">sau 500 ms: t1 = BLOCKED, t2 = BLOCKED</li>
              <li className="err">findDeadlockedThreads(): 2 thread</li>
              <li>transfer-1-to-2 waits Object@… held by transfer-2-to-1</li>
            </>
          )}
        </ul>
      </div>
      <div className={`result ${ordered ? "good" : "bad"}`}>
        {ordered ? "Không thể hình thành vòng chờ" : "Deadlock: treo tới khi restart"}
        <small>{ordered
          ? "Phá điều kiện circular wait: mọi thread lấy lock theo cùng một thứ tự. Không áp được thứ tự thì tryLock có timeout, nhả hết rồi thử lại."
          : "Không timeout, không exception, CPU thấp vì thread BLOCKED. Lấy thread dump 2–3 lần để thấy đoạn \"Found one Java-level deadlock\"."}</small>
      </div>
    </div>
  );
}
