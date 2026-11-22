import { useMemo, useState } from "react";

/**
 * Does an index hand ORDER BY over for free? Two columns: booking_date (has NULLs) and entry_id (unique).
 * An ORDER BY is a list of keys (column, direction, NULL placement). An index is the same list.
 * Forward scan: the leading keys of the query equal the leading keys of the index.
 * Backward scan: every key is the exact opposite (direction and NULL placement flipped).
 * A matching prefix of length 1 lets PostgreSQL 13+ use Incremental Sort; no matching prefix means a full Sort.
 */
type Col = "d" | "e";
type Dir = "asc" | "desc";
type Nulls = "first" | "last";
type Spec = { order: Col[]; dir: Record<Col, Dir>; nulls: Nulls };
type Key = { col: Col; dir: Dir; nulls: Nulls | "-" };

const NAME: Record<Col, string> = { d: "booking_date", e: "entry_id" };
const ROWS = 30000;
const GROUP = 83; // entries sharing one booking_date (measured)
const LIMIT = 5;

const keysOf = (s: Spec): Key[] => s.order.map((col) => ({ col, dir: s.dir[col], nulls: col === "d" ? s.nulls : "-" }));
const flip = (k: Key): Key => ({ col: k.col, dir: k.dir === "asc" ? "desc" : "asc", nulls: k.nulls === "-" ? "-" : k.nulls === "first" ? "last" : "first" });
const same = (a: Key, b: Key) => a.col === b.col && a.dir === b.dir && a.nulls === b.nulls;
const prefix = (q: Key[], x: Key[]) => { let n = 0; while (n < q.length && same(q[n], x[n])) n++; return n; };
const text = (s: Spec, kind: "order" | "index") => {
  const parts = keysOf(s).map((k) => {
    const dflt = k.dir === "asc" ? "last" : "first";
    return `${NAME[k.col]}${k.dir === "desc" ? " DESC" : ""}${k.nulls !== "-" && k.nulls !== dflt ? ` NULLS ${k.nulls.toUpperCase()}` : ""}`;
  });
  return kind === "order" ? `ORDER BY ${parts.join(", ")}` : `CREATE INDEX ON scratch_entry (${parts.join(", ")})`;
};

const base: Spec = { order: ["d", "e"], dir: { d: "asc", e: "asc" }, nulls: "last" };
const PRESETS: { label: string; q: Spec; x: Spec }[] = [
  { label: "Khớp hẳn", q: base, x: base },
  { label: "Đọc ngược", q: { ...base, dir: { d: "desc", e: "desc" }, nulls: "first" }, x: base },
  { label: "ASC lẫn DESC", q: { ...base, dir: { d: "desc", e: "asc" }, nulls: "first" }, x: base },
  { label: "NULLS FIRST", q: { ...base, nulls: "first" }, x: base },
  { label: "Đảo thứ tự cột", q: { ...base, order: ["e", "d"] }, x: base },
];

function SpecEditor({ title, spec, onChange }: { title: string; spec: Spec; onChange: (s: Spec) => void }) {
  const setDir = (c: Col, d: Dir) => onChange({ ...spec, dir: { ...spec.dir, [c]: d } });
  return (
    <div className="wx-col">
      <b>{title}</b>
      <div className="seg small" role="group" aria-label={`${title}: thứ tự cột`}>
        <button className={spec.order[0] === "d" ? "on" : ""} aria-pressed={spec.order[0] === "d"} onClick={() => onChange({ ...spec, order: ["d", "e"] })}>date, id</button>
        <button className={spec.order[0] === "e" ? "on" : ""} aria-pressed={spec.order[0] === "e"} onClick={() => onChange({ ...spec, order: ["e", "d"] })}>id, date</button>
      </div>
      {(["d", "e"] as Col[]).map((c) => (
        <div key={c} className="seg small" role="group" aria-label={`${title}: hướng của ${NAME[c]}`}>
          <button className={spec.dir[c] === "asc" ? "on" : ""} aria-pressed={spec.dir[c] === "asc"} onClick={() => setDir(c, "asc")}>{c === "d" ? "date" : "id"} ASC</button>
          <button className={spec.dir[c] === "desc" ? "on" : ""} aria-pressed={spec.dir[c] === "desc"} onClick={() => setDir(c, "desc")}>{c === "d" ? "date" : "id"} DESC</button>
        </div>
      ))}
      <div className="seg small" role="group" aria-label={`${title}: vị trí NULL của booking_date`}>
        <button className={spec.nulls === "first" ? "on" : ""} aria-pressed={spec.nulls === "first"} onClick={() => onChange({ ...spec, nulls: "first" })}>NULLS FIRST</button>
        <button className={spec.nulls === "last" ? "on" : ""} aria-pressed={spec.nulls === "last"} onClick={() => onChange({ ...spec, nulls: "last" })}>NULLS LAST</button>
      </div>
    </div>
  );
}

export function OrderMatchWidget() {
  const [q, setQ] = useState<Spec>(PRESETS[2].q);
  const [x, setX] = useState<Spec>(PRESETS[2].x);
  const [limit, setLimit] = useState(true);

  const r = useMemo(() => {
    const qk = keysOf(q), xk = keysOf(x);
    const fwd = prefix(qk, xk);
    const bwd = prefix(qk, xk.map(flip));
    const dir = bwd > fwd ? "backward" : "forward";
    const n = Math.max(fwd, bwd);
    const xs = dir === "backward" ? xk.map(flip) : xk;
    let mismatch = "";
    if (n < qk.length) {
      const a = qk[n], b = xs[n];
      mismatch = a.col !== b.col ? `thứ tự cột: câu cần ${NAME[a.col]} ở vị trí ${n + 1}, index có ${NAME[b.col]}`
        : a.dir !== b.dir ? `hướng ASC/DESC của ${NAME[a.col]}`
        : `vị trí NULL của ${NAME[a.col]}`;
    }
    const full = n === qk.length;
    const group = qk[0].col === "d" ? GROUP : 1;
    const read = full ? (limit ? LIMIT : ROWS) : n === 1 ? (limit ? Math.max(LIMIT, group) : ROWS) : ROWS;
    const node = full ? (dir === "forward" ? "Index Scan" : "Index Scan Backward") : n === 1 ? "Incremental Sort" : "Sort";
    return { full, n, node, read, mismatch, dir };
  }, [q, x, limit]);

  const preset = (p: (typeof PRESETS)[number]) => { setQ(p.q); setX(p.x); };
  const verdict = r.full
    ? "Không có Sort: index đã giao dòng theo đúng thứ tự, nên đọc đủ số dòng cần rồi dừng."
    : r.n === 1
      ? `Chỉ khớp 1 khóa đầu. PostgreSQL 13+ vẫn đọc theo index rồi sắp tiếp từng nhóm (Incremental Sort), nhưng phải đọc hết nhóm đầu tiên. Lệch ở: ${r.mismatch}.`
      : `Index không giúp: ${r.mismatch}. Phải đọc cả bảng rồi Sort (blocking: không trả dòng nào trước khi đọc xong).`;

  return (
    <div className="widget">
      <div className="wx-presets" role="group" aria-label="Kịch bản mẫu">
        {PRESETS.map((p) => <button key={p.label} className="btn" onClick={() => preset(p)}>{p.label}</button>)}
      </div>
      <div className="wx-cols wx-cols2">
        <SpecEditor title="ORDER BY" spec={q} onChange={setQ} />
        <SpecEditor title="Index" spec={x} onChange={setX} />
      </div>
      <p className="wx-sql"><code>{text(q, "order")}{limit ? ` LIMIT ${LIMIT}` : ""}</code><br /><code>{text(x, "index")}</code></p>
      <div className="seg small" role="group" aria-label="LIMIT">
        <button className={limit ? "on" : ""} aria-pressed={limit} onClick={() => setLimit(true)}>LIMIT {LIMIT}</button>
        <button className={!limit ? "on" : ""} aria-pressed={!limit} onClick={() => setLimit(false)}>Không LIMIT</button>
      </div>

      <div className="race-sum" aria-live="polite">
        <div><small>Node sắp xếp</small><b className={r.full ? "good" : r.n === 1 ? "" : "bad"}>{r.node}</b><span>{r.full ? "không có Sort" : r.n === 1 ? "sắp từng nhóm" : "Sort cả tập kết quả"}</span></div>
        <div><small>Dòng phải đọc</small><b className={r.read <= 100 ? "good" : "bad"}>{r.read.toLocaleString("vi-VN")}</b><span>{r.read === ROWS ? "cả bảng" : "trong 30.000 dòng"}</span></div>
        <div><small>Dòng đầu tiên</small><b className={r.full ? "good" : "bad"}>{r.full ? "ngay" : r.n === 1 ? "sau nhóm đầu" : "sau khi sắp xong"}</b><span>{r.full ? "pipelined" : r.n === 1 ? "bán pipelined" : "blocking"}</span></div>
      </div>
      <p className="wx-note">{verdict}</p>
      <p className="wx-note">Mô hình: booking_date có NULL, entry_id duy nhất, mặc định ASC thì NULL đứng cuối, DESC thì NULL đứng đầu (PostgreSQL). 83 là số dòng cùng một ngày đo trên bảng thử; số dòng phải đọc là ước tính từ đó, không phải số đo của từng tổ hợp.</p>
    </div>
  );
}
