import { useState } from "react";

type Run = "commit" | "rollback" | "notx";

/** Listeners that fired for OrderPlaced published inside place(), Spring Boot 3.5 (study note 05.05). The AFTER_* phases share one
 * afterCompletion callback, so their relative order follows @Order / registration, not the phase name. */
const RUNS: Record<Run, { label: string; fired: string[]; after?: boolean }> = {
  commit: { label: "commit thành công", fired: ["@EventListener (lúc publish, trong tx)", "BEFORE_COMMIT", "AFTER_COMMIT", "AFTER_COMPLETION"], after: true },
  rollback: { label: "method ném exception", fired: ["@EventListener (đã chạy dù sau đó rollback)", "AFTER_ROLLBACK", "AFTER_COMPLETION"], after: true },
  notx: { label: "publish ngoài transaction", fired: ["@EventListener"] },
};
const ALL = ["BEFORE_COMMIT", "AFTER_COMMIT", "AFTER_ROLLBACK", "AFTER_COMPLETION"];

export function EventPhaseWidget() {
  const [r, setR] = useState<Run>("commit");
  const fired = RUNS[r].fired;
  const skipped = ALL.filter((p) => !fired.includes(p));
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(RUNS) as Run[]).map((k) => <button key={k} className={r === k ? "on" : ""} onClick={() => setR(k)}>{RUNS[k].label}</button>)}
      </div>
      <ol className="log">
        {fired.map((f) => <li key={f} className="ok">{f}</li>)}
        {skipped.map((s) => <li key={s} className="muted">{s}: không chạy</li>)}
      </ol>
      {RUNS[r].after && <p className="muted">Các pha AFTER_* cùng chạy trong callback afterCompletion: thứ tự giữa chúng theo @Order (bằng nhau thì theo thứ tự đăng ký listener), không theo tên pha. Chỉ BEFORE_COMMIT chắc chắn chạy trước.</p>}
      <p className="muted">
        {r === "rollback"
          ? "Gửi email bằng @EventListener thường là sai: nó đã chạy dù đơn hàng bị rollback. AFTER_COMMIT không chạy là đúng ý."
          : r === "notx"
            ? "Không có transaction thì @TransactionalEventListener bị bỏ qua im lặng, trừ khi đặt fallbackExecution = true."
            : "AFTER_COMMIT chạy đồng bộ trên cùng thread, trước khi method trả về controller: thêm @Async nếu việc chậm. Ghi DB trong AFTER_COMMIT phải dùng REQUIRES_NEW: save() thường tham gia transaction đã commit và mất im lặng (đo được 0 dòng)."}
      </p>
    </div>
  );
}
