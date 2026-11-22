import { useState } from "react";

/**
 * What one write touches in PostgreSQL, on a counting model: the heap plus N B-tree indexes.
 * INSERT writes the heap and every index. A normal UPDATE writes a new row version, so every index gets a new entry too,
 * unless the update is HOT (no indexed column changed and the page has room), which writes only the heap.
 * DELETE only marks the row dead; its index entries stay until VACUUM removes them.
 */
type Op = "insert" | "update-indexed" | "update-plain" | "delete";
const OPS: { id: Op; label: string }[] = [
  { id: "insert", label: "INSERT" },
  { id: "update-indexed", label: "UPDATE cột có index" },
  { id: "update-plain", label: "UPDATE cột không có index" },
  { id: "delete", label: "DELETE" },
];
const MAX_INDEXES = 12;

export function IndexWriteCostWidget() {
  const [n, setN] = useState(4);
  const [op, setOp] = useState<Op>("insert");
  const [room, setRoom] = useState(true);
  const [pulse, setPulse] = useState(0); // bumped on every change so the animation replays

  const hot = op === "update-plain" && room;
  const heapWritten = true;
  const indexesWritten = op === "delete" || hot ? 0 : n;
  const written = (heapWritten ? 1 : 0) + indexesWritten;
  const vacuumDebt = op === "delete" ? n : op === "update-indexed" || (op === "update-plain" && !room) ? n : 0;
  const change = (fn: () => void) => { fn(); setPulse((p) => p + 1); };

  const why =
    op === "insert" ? "Dòng mới phải có mặt trong heap và trong mọi index."
    : op === "update-indexed" ? "Đổi cột có index thì không thể HOT: PostgreSQL ghi phiên bản dòng mới, rồi thêm entry mới vào mọi index."
    : op === "update-plain" ? (room ? "HOT: không cột index nào đổi và page còn chỗ, nên phiên bản mới nằm cùng page và index không phải sửa." : "Page đã đầy nên không HOT được: phiên bản mới sang page khác, mọi index phải thêm entry trỏ tới nó.")
    : "DELETE chỉ đánh dấu dòng là đã chết. Entry trong index còn nguyên cho tới khi VACUUM dọn.";

  return (
    <div className="widget">
      <div className="race-controls">
        <div className="wx-grow">
          <small>Số index của bảng: {n}</small>
          <input
            type="range" min={0} max={MAX_INDEXES} step={1} value={n}
            onChange={(e) => change(() => setN(Number(e.target.value)))}
            aria-label="Số index của bảng" className="wx-range"
          />
        </div>
        <div>
          <small>Thao tác</small>
          <div className="seg small" role="group" aria-label="Thao tác ghi">
            {OPS.map((o) => <button key={o.id} className={op === o.id ? "on" : ""} aria-pressed={op === o.id} onClick={() => change(() => setOp(o.id))}>{o.label}</button>)}
          </div>
        </div>
        {op === "update-plain" && (
          <div>
            <small>Page chứa dòng</small>
            <div className="seg small" role="group" aria-label="Page còn chỗ trống không">
              <button className={room ? "on" : ""} aria-pressed={room} onClick={() => change(() => setRoom(true))}>Còn chỗ</button>
              <button className={!room ? "on" : ""} aria-pressed={!room} onClick={() => change(() => setRoom(false))}>Đã đầy</button>
            </div>
          </div>
        )}
      </div>

      <div className="wx-write" key={pulse}>
        <div className={`wx-heap ${heapWritten ? "w" : ""}`}><b>Heap</b><span>{op === "delete" ? "đánh dấu chết" : hot ? "ghi HOT" : "ghi dòng"}</span></div>
        <div className="wx-idx-row" aria-hidden>
          {Array.from({ length: n }, (_, i) => (
            <i key={i} className={indexesWritten ? "w" : op === "delete" ? "debt" : ""} style={{ animationDelay: `${i * 40}ms` }} />
          ))}
          {n === 0 && <span className="wx-cap">Bảng chưa có index nào</span>}
        </div>
      </div>

      <div className="race-sum">
        <div><small>Cấu trúc bị ghi ngay</small><b className={written > 4 ? "bad" : "good"}>{written}</b><span>1 heap + {indexesWritten} index</span></div>
        <div><small>Thanh chi phí</small><b><meter className="wx-meter" min={0} max={MAX_INDEXES + 1} value={written} aria-label="Số cấu trúc bị ghi" /></b><span>{written} trên {MAX_INDEXES + 1} (tối đa trong mô hình)</span></div>
        <div><small>VACUUM phải dọn sau</small><b className={vacuumDebt ? "bad" : "good"}>{vacuumDebt ? `${vacuumDebt} entry` : "không"}</b><span>{vacuumDebt ? "entry cũ trong index chờ dọn" : "không để lại entry cũ trong index"}</span></div>
      </div>
      <p className="wx-note">{why}</p>
      <p className="wx-note">Mô hình đơn giản: chỉ đếm số cấu trúc bị ghi. Chưa tính WAL, page split hay thời gian thật.</p>
    </div>
  );
}
