import { useState } from "react";

/**
 * A prepared statement `WHERE status = $1` on a table that is 99% POSTED and 1% REVERSED.
 * Plan costs are the EXPLAIN numbers from a real run on the 30,000-row scratch table (PGlite, PostgreSQL 18):
 * custom plan for 'POSTED' = Seq Scan 769.25, custom plan for 'REVERSED' = Index Scan 49.01,
 * generic plan = Index Scan 562.87 (it assumes 15,000 rows because the value is unknown).
 * The switching rule is a simplified reading of the PostgreSQL docs: five custom plans first, then generic if its cost is
 * not higher than the average custom cost. Planning time itself is not modelled.
 */
type Value = "POSTED" | "REVERSED";
type Mode = "auto" | "force_custom_plan";
type Run = { value: Value; kind: "custom" | "generic"; plan: string; cost: number; est: number; actual: number };

const CUSTOM: Record<Value, { plan: string; cost: number; rows: number }> = {
  POSTED: { plan: "Seq Scan", cost: 769.25, rows: 29_700 },
  REVERSED: { plan: "Index Scan", cost: 49.01, rows: 300 },
};
const GENERIC = { plan: "Index Scan (status = $1)", cost: 562.87, rows: 15_000 };
const MAX = 8;
const fmt = (n: number) => n.toLocaleString("vi-VN");

export function PlanCacheWidget() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [mode, setMode] = useState<Mode>("auto");

  const switched = runs.some((r) => r.kind === "generic");
  const customCosts = runs.filter((r) => r.kind === "custom").map((r) => r.cost);
  const avg = customCosts.length ? customCosts.reduce((a, b) => a + b, 0) / customCosts.length : 0;

  const execute = (value: Value) => {
    if (runs.length >= MAX) return;
    const n = runs.length + 1;
    let useGeneric = false;
    if (mode === "auto") {
      if (switched) useGeneric = true;
      else if (n > 5) useGeneric = GENERIC.cost <= avg;
    }
    const c = CUSTOM[value];
    setRuns([...runs, useGeneric
      ? { value, kind: "generic", plan: GENERIC.plan, cost: GENERIC.cost, est: GENERIC.rows, actual: c.rows }
      : { value, kind: "custom", plan: c.plan, cost: c.cost, est: c.rows, actual: c.rows }]);
  };

  const planned = runs.filter((r) => r.kind === "custom").length + (switched ? 1 : 0);
  const mismatch = runs.filter((r) => r.kind === "generic" && r.value === "POSTED").length;
  const next = runs.length + 1;
  const status = runs.length === 0
    ? "Chưa chạy lần nào."
    : switched
      ? "Đã chuyển sang generic plan: từ giờ mọi giá trị dùng chung một plan."
      : mode === "force_custom_plan"
        ? "force_custom_plan: lần nào cũng lập plan mới theo giá trị thật."
        : next <= 5
          ? "Năm lần đầu luôn là custom plan. Lần thứ 6 mới so sánh generic plan với trung bình cost của các custom plan."
          : GENERIC.cost <= avg
            ? `Generic (${GENERIC.cost}) không đắt hơn trung bình custom (${avg.toFixed(2)}): lần EXECUTE tới sẽ chuyển sang generic.`
            : `Generic (${GENERIC.cost}) đắt hơn trung bình custom (${avg.toFixed(2)}): vẫn dùng custom plan.`;

  return (
    <div className="widget">
      <p className="wx-sql"><code>PREPARE q(text) AS SELECT sum(amount) FROM scratch_entry WHERE status = $1;</code></p>
      <div className="race-controls">
        <div>
          <small>Chạy lần thứ {Math.min(next, MAX)} trên {MAX}</small>
          <div className="wx-presets">
            <button className="btn primary" onClick={() => execute("POSTED")} disabled={runs.length >= MAX}>EXECUTE q('POSTED')</button>
            <button className="btn primary" onClick={() => execute("REVERSED")} disabled={runs.length >= MAX}>EXECUTE q('REVERSED')</button>
            <button className="btn" onClick={() => setRuns([])} disabled={runs.length === 0}>Làm lại (DEALLOCATE)</button>
          </div>
        </div>
        <div>
          <small>plan_cache_mode</small>
          <div className="seg small" role="group" aria-label="plan_cache_mode">
            {(["auto", "force_custom_plan"] as const).map((m) => (
              <button key={m} className={mode === m ? "on" : ""} aria-pressed={mode === m} onClick={() => { setMode(m); setRuns([]); }}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      <ol className="wx-runs" aria-label="Các lần EXECUTE">
        {Array.from({ length: MAX }, (_, i) => {
          const r = runs[i];
          return (
            <li key={i} className={r ? r.kind : "empty"}>
              <small>Lần {i + 1}</small>
              {r ? (
                <>
                  <b>{r.value}</b>
                  <span className="wx-tag">{r.kind} plan</span>
                  <span>{r.plan}</span>
                  <span>cost {r.cost.toFixed(2)}</span>
                  {r.kind === "generic" && <span className={r.value === "POSTED" ? "wx-warn" : ""}>ước {fmt(r.est)}, thực {fmt(r.actual)} dòng</span>}
                </>
              ) : <span>chưa chạy</span>}
            </li>
          );
        })}
      </ol>
      <p className="wx-note" aria-live="polite">{status}</p>

      <div className="race-sum">
        <div><small>Plan đang dùng</small><b className={switched ? "bad" : "good"}>{switched ? "generic" : runs.length ? "custom" : "-"}</b><span>{switched ? "lập một lần với $1 chưa biết giá trị" : "lập lại theo giá trị thật mỗi lần"}</span></div>
        <div><small>Số lần lập plan</small><b>{planned}</b><span>{mode === "force_custom_plan" ? "bằng số lần EXECUTE: tốn CPU lập plan" : "generic chỉ lập một lần rồi dùng lại"}</span></div>
        <div><small>Lần chạy sai plan</small><b className={mismatch ? "bad" : "good"}>{mismatch}</b><span>{mismatch ? "POSTED (99%) bị ép dùng plan ước 15.000 dòng" : "chưa có lần nào"}</span></div>
      </div>
      <p className="wx-note">Cost lấy từ EXPLAIN thật trên bảng thử 30.000 dòng; luật chuyển plan là mô hình đơn giản hoá từ tài liệu PostgreSQL và không tính thời gian lập plan. Cost là đơn vị của planner, không phải mili giây.</p>
    </div>
  );
}
