import { useState } from "react";

type P = "REQUIRED" | "REQUIRES_NEW" | "NESTED" | "SUPPORTS" | "NOT_SUPPORTED" | "MANDATORY" | "NEVER";

/** What each propagation does with and without a running transaction; log lines and exceptions measured on Spring Boot 3.5 (study note 05.03). */
const ROWS: Record<P, { inTx: string; noTx: string; bad?: "in" | "no"; use: string }> = {
  REQUIRED: { inTx: "Tham gia · Participating in existing transaction", noTx: "Tạo mới", use: "95% trường hợp, là mặc định." },
  REQUIRES_NEW: { inTx: "Tạm dừng cái cũ, tạo cái mới độc lập · Suspending current transaction, creating new transaction", noTx: "Tạo mới", use: "Audit log, lịch sử lỗi, cấp số thứ tự phải lưu kể cả khi nghiệp vụ chính rollback." },
  NESTED: { inTx: "Savepoint trong tx hiện tại · với JPA: NestedTransactionNotSupportedException", noTx: "Tạo mới", bad: "in", use: "Chỉ dùng được với transaction manager hỗ trợ savepoint (JDBC)." },
  SUPPORTS: { inTx: "Tham gia (active=true)", noTx: "Không transaction (active=false, nhưng vẫn có tên)", use: "Hiếm. Kiểm tra bằng isActualTransactionActive(), không dựa vào tên." },
  NOT_SUPPORTED: { inTx: "Tạm dừng, chạy không transaction (active=false)", noTx: "Không transaction", use: "Hiếm." },
  MANDATORY: { inTx: "Tham gia", noTx: "IllegalTransactionStateException: No existing transaction found for transaction marked with propagation 'mandatory'", bad: "no", use: "Method tầng thấp bắt buộc caller mở transaction trước, ví dụ trừ kho." },
  NEVER: { inTx: "IllegalTransactionStateException: Existing transaction found for transaction marked with propagation 'never'", noTx: "Không transaction", bad: "in", use: "Hiếm." },
};

export function PropagationTableWidget() {
  const [p, setP] = useState<P>("REQUIRES_NEW");
  const r = ROWS[p];
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(ROWS) as P[]).map((k) => <button key={k} className={p === k ? "on" : ""} onClick={() => setP(k)}>{k}</button>)}
      </div>
      <ul className="log">
        <li className={r.bad === "in" ? "err" : "ok"}>Đã có transaction: {r.inTx}</li>
        <li className={r.bad === "no" ? "err" : "ok"}>Chưa có transaction: {r.noTx}</li>
      </ul>
      <p className="muted">Khi dùng: {r.use} Propagation chỉ có tác dụng khi lời gọi đi qua proxy: method phải ở bean khác.</p>
    </div>
  );
}
