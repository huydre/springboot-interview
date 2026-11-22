import { useState } from "react";

/**
 * Keyset paging over 8 rows where five of them share one created_at; page size 3.
 * Rows with equal created_at have no guaranteed order, so a query that sorts by created_at alone may return them in any order.
 * The model shuffles the tied rows on every fetch to show that. With the bookmark (created_at, id) the order is total.
 */
type Row = { id: number; at: string };
const ROWS: Row[] = [
  { id: 1, at: "09:00" }, { id: 2, at: "09:05" }, { id: 3, at: "09:05" }, { id: 4, at: "09:05" },
  { id: 5, at: "09:05" }, { id: 6, at: "09:05" }, { id: 7, at: "09:10" }, { id: 8, at: "09:15" },
];
const PAGE = 3;
type Mode = "gt" | "gte" | "pair";
const MODES: { id: Mode; label: string; sql: string }[] = [
  { id: "gt", label: "created_at >", sql: "WHERE created_at > :last_at\nORDER BY created_at\nLIMIT 3" },
  { id: "gte", label: "created_at >=", sql: "WHERE created_at >= :last_at\nORDER BY created_at\nLIMIT 3" },
  { id: "pair", label: "(created_at, id)", sql: "WHERE (created_at, id) > (:last_at, :last_id)\nORDER BY created_at, id\nLIMIT 3" },
];
const PORTABLE = "WHERE created_at >= :last_at\n  AND NOT (created_at = :last_at AND id <= :last_id)\nORDER BY created_at, id\nLIMIT 3";

/** Deterministic pseudo-random number from a seed, so the same click always gives the same shuffle. */
const rnd = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

/** Rows after the bookmark, sorted by created_at; ties are shuffled unless the mode orders by id too. */
function fetchPage(mode: Mode, last: Row | null, seed: number): Row[] {
  let pool = ROWS.filter((r) => {
    if (!last) return true;
    if (mode === "gt") return r.at > last.at;
    if (mode === "gte") return r.at >= last.at;
    return r.at > last.at || (r.at === last.at && r.id > last.id);
  });
  pool = pool.map((r, i) => ({ r, k: rnd(seed * 31 + r.id + i) })).sort((a, b) => a.r.at < b.r.at ? -1 : a.r.at > b.r.at ? 1 : mode === "pair" ? a.r.id - b.r.id : a.k - b.k).map((x) => x.r);
  return pool.slice(0, PAGE);
}

export function KeysetBookmarkWidget() {
  const [mode, setMode] = useState<Mode>("gt");
  const [pages, setPages] = useState<Row[][]>([]);
  const [seed, setSeed] = useState(1);

  const change = (m: Mode) => { setMode(m); setPages([]); setSeed(1); };
  const next = () => {
    const last = pages.length ? pages[pages.length - 1][pages[pages.length - 1].length - 1] : null;
    setPages([...pages, fetchPage(mode, last, seed + 1)]);
    setSeed(seed + 1);
  };
  const reload = () => {
    if (!pages.length) return;
    const last = pages.length > 1 ? pages[pages.length - 2][PAGE - 1] : null;
    setPages([...pages.slice(0, -1), fetchPage(mode, last, seed + 1)]);
    setSeed(seed + 1);
  };
  const reset = () => { setPages([]); setSeed(1); };

  const seen = pages.flat().map((r) => r.id);
  const unique = new Set(seen);
  const repeated = seen.filter((id, i) => seen.indexOf(id) !== i);
  const lastPage = pages[pages.length - 1];
  // Rows that can no longer be reached from the last bookmark: skipped in the model's terms.
  const lastRow = lastPage?.[lastPage.length - 1];
  const finished = !!lastPage && lastPage.length < PAGE;
  const missing = finished ? ROWS.filter((r) => !unique.has(r.id)).map((r) => r.id) : [];
  const cur = MODES.find((m) => m.id === mode)!;

  return (
    <div className="widget">
      <div className="race-controls">
        <div>
          <small>Bookmark và điều kiện trang kế</small>
          <div className="seg small" role="group" aria-label="Kiểu bookmark">
            {MODES.map((m) => <button key={m.id} className={mode === m.id ? "on" : ""} aria-pressed={mode === m.id} onClick={() => change(m.id)}>{m.label}</button>)}
          </div>
        </div>
        <div className="wx-presets">
          <button className="btn" onClick={next} disabled={finished || pages.length >= 6}>Trang kế</button>
          <button className="btn" onClick={reload} disabled={!pages.length}>Tải lại trang này</button>
          <button className="btn" onClick={reset}>Về đầu</button>
        </div>
      </div>
      <pre className="wx-code">{cur.sql}</pre>
      {mode === "pair" && <pre className="wx-code">{`-- Cách viết không dùng row-value:\n${PORTABLE}`}</pre>}

      <ol className="wx-table" aria-label="8 dòng của bảng, sắp theo created_at">
        {ROWS.map((r) => (
          <li key={r.id} className={unique.has(r.id) ? (repeated.includes(r.id) ? "dup" : "seen") : finished ? "lost" : ""}>
            <b>id {r.id}</b><span>{r.at}</span>
          </li>
        ))}
      </ol>
      <div className="wx-legend">
        <span><i className="match" /> đã thấy một lần</span>
        <span><i className="extra" /> thấy nhiều lần</span>
        <span><i className="crossed" /> không bao giờ thấy (sau trang cuối)</span>
      </div>

      <div className="wx-pages" aria-live="polite">
        {pages.length === 0 && <p className="wx-cap">Bấm &quot;Trang kế&quot; để lấy trang đầu, rồi bấm tiếp và thử &quot;Tải lại trang này&quot;.</p>}
        {pages.map((p, i) => (
          <div key={i} className="wx-page"><small>Trang {i + 1}</small>{p.map((r) => <span key={r.id}>id {r.id}</span>)}</div>
        ))}
      </div>

      <div className="race-sum">
        <div><small>Đã thấy</small><b className={unique.size === ROWS.length ? "good" : ""}>{unique.size} / {ROWS.length}</b><span>dòng khác nhau</span></div>
        <div><small>Lặp lại</small><b className={repeated.length ? "bad" : "good"}>{repeated.length}</b><span>{repeated.length ? `id ${[...new Set(repeated)].join(", ")}` : "chưa có dòng nào lặp"}</span></div>
        <div><small>Bỏ sót</small><b className={missing.length ? "bad" : "good"}>{finished ? missing.length : "?"}</b><span>{finished ? (missing.length ? `id ${missing.join(", ")}` : "không sót dòng nào") : "biết sau trang cuối"}</span></div>
      </div>
      <p className="wx-note">
        {mode === "gt" && "Dùng > với cột trùng giá trị: mọi dòng cùng created_at với dòng cuối của trang bị bỏ qua, kể cả những dòng chưa kịp hiện."}
        {mode === "gte" && "Dùng >= thì không sót, nhưng trang sau lấy lại các dòng cùng created_at. Nếu còn từ ba dòng trùng trở lên, bookmark không nhích: kẹt ở một trang."}
        {mode === "pair" && "Thêm id làm khóa phụ: mọi dòng có vị trí duy nhất, trang kế bắt đầu đúng sau dòng cuối. Tải lại cho cùng kết quả."}
        {" "}{lastRow ? `Bookmark hiện tại: created_at = ${lastRow.at}${mode === "pair" ? `, id = ${lastRow.id}` : ""}.` : ""}
      </p>
      <p className="wx-note">Mô hình: 8 dòng, trang 3 dòng. Thứ tự các dòng cùng created_at không được đảm bảo nên mô hình xáo trộn chúng mỗi lần lấy; database thật thường trả ổn định nhưng không hứa.</p>
    </div>
  );
}
