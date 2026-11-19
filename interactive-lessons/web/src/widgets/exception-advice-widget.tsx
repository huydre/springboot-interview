import { useState } from "react";

/** What our own @RestControllerAdvice (shown in the widget) maps each exception to. */
const THROWN = [
  { name: "ResourceNotFoundException", status: 404, code: "NOT_FOUND", message: "Order 42 không tồn tại", level: "WARN" },
  { name: "InsufficientBalanceException", status: 422, code: "INSUFFICIENT_BALANCE", message: "Số dư 100 không đủ để trừ 500", level: "WARN" },
  { name: "PaymentFailedException (bọc IOException)", status: 502, code: "PAYMENT_FAILED", message: "Gọi cổng thanh toán thất bại", level: "ERROR" },
  { name: "NullPointerException", status: 500, code: "INTERNAL_ERROR", message: "Lỗi hệ thống", level: "ERROR" },
];

/** Service throws, one @RestControllerAdvice maps to HTTP and logs once; toggle whether the cause was kept. */
export function ExceptionAdviceWidget() {
  const [i, setI] = useState(0);
  const [keepCause, setKeepCause] = useState(true);
  const t = THROWN[i];
  const wrapped = t.name.startsWith("PaymentFailed");
  return (
    <div className="widget">
      <div className="seg small">
        {THROWN.map((k, n) => <button key={k.name} className={i === n ? "on" : ""} onClick={() => setI(n)}>{k.name}</button>)}
      </div>
      {wrapped && (
        <label className="check">
          <input type="checkbox" checked={keepCause} onChange={(e) => setKeepCause(e.target.checked)} /> truyền <code>e</code> làm cause khi bọc
        </label>
      )}
      <div className="two">
        <pre className="code">{`@RestControllerAdvice
class ApiErrors {
  @ExceptionHandler(ResourceNotFoundException.class)  → 404
  @ExceptionHandler(BusinessException.class)          → 422
  @ExceptionHandler(PaymentFailedException.class)     → 502
  @ExceptionHandler(Exception.class)                  → 500
}`}</pre>
        <div className="panel">
          <div className={`result ${t.status < 500 ? "warn" : "bad"}`}>
            HTTP {t.status}
            <small>{`{"code": "${t.code}", "message": "${t.message}"}`}</small>
          </div>
          <ul className="log">
            <li className={t.level === "ERROR" ? "err" : ""}>{t.level} [traceId=7f3a] {t.name.split(" ")[0]}: {t.message}</li>
            {wrapped && (keepCause
              ? <li className="ok">Caused by: java.io.IOException: timeout</li>
              : <li className="err">(không có Caused by: không biết lỗi thật là gì)</li>)}
            <li className="muted">log đúng một lần, ở advice; service không tự catch rồi log</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
