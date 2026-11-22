import { useMemo, useState } from "react";

/**
 * Index (A, B, C) with 36 entries in index order. Each column gets a condition: none, equals or range.
 * Equality columns from the left narrow the scanned interval; the first range column narrows it once more and ends the narrowing;
 * every condition after that (or after a column with no condition) is only checked entry by entry inside the interval.
 */
type Mode = "off" | "eq" | "range";
const MODES: { id: Mode; label: string }[] = [
  { id: "off", label: "Không dùng" },
  { id: "eq", label: "= bằng" },
  { id: "range", label: "Khoảng" },
];
const COLS = ["A", "B", "C"] as const;
// Constants: equals uses EQ, range means ">= LOW".
const EQ = [2, 2, 3];
const LOW = [2, 2, 3];
const rows: number[][] = [];
for (let a = 1; a <= 3; a++) for (let b = 1; b <= 3; b++) for (let c = 1; c <= 4; c++) rows.push([a, b, c]);

const hold = (v: number, i: number, m: Mode) => (m === "off" ? true : m === "eq" ? v === EQ[i] : v >= LOW[i]);
const cond = (i: number, m: Mode) => (m === "eq" ? `${COLS[i]} = ${EQ[i]}` : m === "range" ? `${COLS[i]} >= ${LOW[i]}` : "");

const PRESETS: { label: string; modes: Mode[] }[] = [
  { label: "A =, B =, C =", modes: ["eq", "eq", "eq"] },
  { label: "A =, B khoảng, C =", modes: ["eq", "range", "eq"] },
  { label: "A = và C = (bỏ B)", modes: ["eq", "off", "eq"] },
  { label: "Chỉ B =", modes: ["off", "eq", "off"] },
];

export function CompositeLadderWidget() {
  const [modes, setModes] = useState<Mode[]>(["eq", "range", "eq"]);

  const r = useMemo(() => {
    // Role of each column: access (narrows the interval), filter (checked inside it), none (no condition).
    const roles: ("access" | "filter" | "none")[] = [];
    let narrowing = true;
    modes.forEach((m) => {
      if (m === "off") { roles.push("none"); narrowing = false; return; }
      if (narrowing) { roles.push("access"); if (m === "range") narrowing = false; } else roles.push("filter");
    });
    const inInterval = rows.map((row) => row.every((v, i) => roles[i] !== "access" || hold(v, i, modes[i])));
    const matches = rows.map((row) => row.every((v, i) => hold(v, i, modes[i])));
    const anyAccess = roles.includes("access");
    const scanned = anyAccess ? inInterval.filter(Boolean).length : rows.length;
    const matched = matches.filter(Boolean).length;
    return { roles, inInterval: anyAccess ? inInterval : rows.map(() => true), matches, scanned, matched, anyAccess };
  }, [modes]);

  const set = (i: number, m: Mode) => setModes((cur) => cur.map((x, j) => (j === i ? m : x)));
  const roleText = { access: "access: thu hẹp đoạn đọc", filter: "filter: đọc cả đoạn rồi lọc", none: "không có điều kiện" } as const;
  const where = modes.map((m, i) => cond(i, m)).filter(Boolean).join(" AND ") || "(không có điều kiện)";

  return (
    <div className="widget">
      <div className="wx-presets" role="group" aria-label="Kịch bản mẫu">
        {PRESETS.map((p) => (
          <button key={p.label} className="btn" onClick={() => setModes(p.modes)}>{p.label}</button>
        ))}
      </div>
      <div className="wx-cols">
        {COLS.map((c, i) => (
          <div key={c} className="wx-col">
            <b>Cột {c}</b>
            <div className="seg small" role="group" aria-label={`Điều kiện trên cột ${c}`}>
              {MODES.map((m) => (
                <button key={m.id} className={modes[i] === m.id ? "on" : ""} aria-pressed={modes[i] === m.id} onClick={() => set(i, m.id)}>{m.label}</button>
              ))}
            </div>
            <span className={`wx-role ${r.roles[i]}`}>{roleText[r.roles[i]]}</span>
          </div>
        ))}
      </div>
      <p className="wx-sql"><code>WHERE {where}</code></p>

      <ol className="wx-entries" aria-label="36 entry của index (A, B, C) theo thứ tự index">
        {rows.map((row, k) => {
          const state = r.matches[k] ? "match" : r.inInterval[k] ? "extra" : "skip";
          return (
            <li key={k} className={state}>
              {row.join(" · ")}
              <span className="sr-only">{state === "match" ? " khớp" : state === "extra" ? " đọc thừa" : " không đọc"}</span>
            </li>
          );
        })}
      </ol>
      <div className="wx-legend">
        <span><i className="match" /> khớp điều kiện</span>
        <span><i className="extra" /> nằm trong đoạn phải đọc nhưng không khớp</span>
        <span><i className="skip" /> không phải đọc</span>
      </div>

      <div className="race-sum">
        <div><small>Entry phải đọc</small><b className={r.scanned === rows.length ? "bad" : ""}>{r.scanned} / {rows.length}</b><span>{r.anyAccess ? "một đoạn liền trong index" : "không có access predicate: đọc cả index"}</span></div>
        <div><small>Entry khớp</small><b className="good">{r.matched}</b><span>kết quả thật của câu lệnh</span></div>
        <div><small>Đọc thừa</small><b className={r.scanned - r.matched ? "bad" : "good"}>{r.scanned - r.matched}</b><span>entry đọc rồi bị loại</span></div>
      </div>
      <p className="wx-note">Mô hình đơn giản: 36 entry, đếm số entry phải đọc, không đo thời gian. PostgreSQL ghi cả access và filter dưới <code>Index Cond</code>, nên EXPLAIN không tách hai loại này.</p>
    </div>
  );
}
