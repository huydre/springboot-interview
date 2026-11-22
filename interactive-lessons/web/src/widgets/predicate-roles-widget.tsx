import { useState } from "react";

/**
 * One query on the 30,000-row scratch table: WHERE booking_date = '2024-03-01' AND narrative LIKE '%7%'.
 * The index returns 83 entries for that date; 21 of them also match the LIKE. Whether the LIKE is judged inside the index
 * (index filter) or after opening the table row (table filter) depends on two things: is narrative stored in the index
 * (INCLUDE), and does the SELECT list need only columns that are in the index.
 * The counters are the figures of an EXPLAIN (ANALYZE, BUFFERS) run on PGlite 18 after VACUUM; the strip is a drawing of them.
 */
const CANDIDATES = 83;
const MATCHED = 21;
type Design = "plain" | "include";
type Select = "narrative" | "all";

const cells = Array.from({ length: CANDIDATES }, (_, i) => Math.floor(((i + 1) * MATCHED) / CANDIDATES) > Math.floor((i * MATCHED) / CANDIDATES));

export function PredicateRolesWidget() {
  const [design, setDesign] = useState<Design>("plain");
  const [select, setSelect] = useState<Select>("narrative");

  const covered = design === "include" && select === "narrative";
  const filterInIndex = covered;
  const node = covered ? "Index Only Scan" : "Bitmap Heap Scan";
  const heapFetches = covered ? 0 : CANDIDATES;
  const buffers = covered ? 3 : 85;
  const why = covered
    ? "narrative nằm trong index và SELECT chỉ cần narrative: LIKE được kiểm tra ngay trên entry của index, 62 entry bị loại không bao giờ chạm tới bảng (Heap Fetches: 0)."
    : design === "plain"
      ? "narrative không có trong index: phải mở bảng để đọc nó, nên cả 83 dòng đều bị đọc từ bảng rồi LIKE mới loại 62 dòng. Đây là table filter."
      : "narrative đã nằm trong index, nhưng SELECT * còn cần các cột khác: phải mở bảng cho từng dòng, nên LIKE vẫn chạy ở bảng. INCLUDE chưa đủ nếu danh sách SELECT không nằm hết trong index.";

  return (
    <div className="widget">
      <div className="race-controls">
        <div>
          <small>Thiết kế index</small>
          <div className="seg small" role="group" aria-label="Thiết kế index">
            <button className={design === "plain" ? "on" : ""} aria-pressed={design === "plain"} onClick={() => setDesign("plain")}>(booking_date)</button>
            <button className={design === "include" ? "on" : ""} aria-pressed={design === "include"} onClick={() => setDesign("include")}>(booking_date) INCLUDE (narrative)</button>
          </div>
        </div>
        <div>
          <small>Danh sách SELECT</small>
          <div className="seg small" role="group" aria-label="Danh sách SELECT">
            <button className={select === "narrative" ? "on" : ""} aria-pressed={select === "narrative"} onClick={() => setSelect("narrative")}>narrative</button>
            <button className={select === "all" ? "on" : ""} aria-pressed={select === "all"} onClick={() => setSelect("all")}>*</button>
          </div>
        </div>
      </div>
      <p className="wx-sql"><code>SELECT {select === "all" ? "*" : "narrative"} FROM scratch_entry WHERE booking_date = '2024-03-01' AND narrative LIKE '%7%'</code></p>

      <ol className="wx-cells" aria-label={`${CANDIDATES} entry của index có booking_date = 2024-03-01`}>
        {cells.map((hit, i) => {
          const state = hit ? "match" : filterInIndex ? "crossed" : "fetched";
          return (
            <li key={i} className={state}>
              <span className="sr-only">{hit ? "khớp LIKE" : filterInIndex ? "bị loại ở index, không mở bảng" : "mở bảng rồi bị loại"}</span>
            </li>
          );
        })}
      </ol>
      <div className="wx-legend">
        <span><i className="range" /> access: booking_date = ... chọn ra 83 entry</span>
        <span><i className="match" /> khớp cả LIKE ({MATCHED})</span>
        <span><i className="crossed" /> LIKE loại ngay trong index (index filter)</span>
        <span><i className="fetched" /> mở bảng rồi mới bị loại (table filter)</span>
      </div>

      <div className="race-sum">
        <div><small>Node trong kế hoạch</small><b className={covered ? "good" : ""}>{node}</b><span>{covered ? "không cần đọc bảng" : "phải đọc bảng"}</span></div>
        <div><small>Lần mở bảng (heap)</small><b className={heapFetches ? "bad" : "good"}>{heapFetches}</b><span>{heapFetches ? `${CANDIDATES} entry, ${CANDIDATES - MATCHED} dòng đọc xong bị bỏ` : "Heap Fetches: 0"}</span></div>
        <div><small>Buffers chạm</small><b className={buffers > 10 ? "bad" : "good"}>{buffers}</b><span>{MATCHED} dòng trả về</span></div>
      </div>
      <p className="wx-note">{why}</p>
      <p className="wx-note">Số liệu là lần chạy thật trên bảng thử 30.000 dòng (PGlite 18, sau VACUUM); hình vẽ chỉ minh hoạ chúng. EXPLAIN của PostgreSQL gọi cả hai loại là <code>Filter</code>: phân biệt bằng node đứng trên nó và dòng <code>Heap Fetches</code>.</p>
    </div>
  );
}
