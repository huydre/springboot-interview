import { useMemo, useState } from "react";

/**
 * The same join done three ways, on a counting model: N outer rows (orders) and M inner rows (customers).
 * Nested Loop: N x M row comparisons, or N x 3 page reads when the inner side has an index on the join column.
 * Hash Join: build a hash table from the inner side (M), probe it once per outer row (N); equality only.
 * If the table does not fit in work_mem it is split into batches and the later batches are written to disk and read back.
 * Merge Join: walk two sorted inputs once (N + M); equality only; unsorted input must be sorted first (n log2 n each).
 * The numbers are steps of a model with small tables, not milliseconds.
 */
const N = 40;
const M = 200;
const BATCHES = 4;
const nlogn = (n: number) => Math.round(n * Math.log2(n));

type Op = "eq" | "range";
type Lane = { id: string; name: string; cost: number | null; detail: string; off?: string };

export function JoinAlgorithmRaceWidget() {
  const [op, setOp] = useState<Op>("eq");
  const [innerIndex, setInnerIndex] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [spill, setSpill] = useState(false);

  const lanes: Lane[] = useMemo(() => {
    const nl = op === "eq"
      ? (innerIndex ? N * 3 : N * M)
      : (innerIndex ? N * (3 + M / 2) : N * M);
    const nlDetail = innerIndex
      ? (op === "eq" ? `${N} dòng ngoài × 3 page (root, branch, leaf)` : `${N} × (3 page + khoảng nửa bảng trong cho mỗi dòng ngoài)`)
      : `${N} × ${M} lần so: mỗi dòng ngoài quét hết bảng trong`;
    const hashBase = N + M;
    const hashSpill = spill ? Math.round(((BATCHES - 1) / BATCHES) * (N + M) * 2) : 0;
    const merge = sorted ? N + M : N + M + nlogn(N) + nlogn(M);
    return [
      { id: "nl", name: "Nested Loop", cost: nl, detail: nlDetail },
      {
        id: "hash", name: "Hash Join", cost: op === "eq" ? hashBase + hashSpill : null,
        detail: spill
          ? `dựng ${M} dòng + dò ${N} dòng, thêm ${hashSpill} bước ghi và đọc lại đĩa: Batches: ${BATCHES}`
          : `dựng bảng băm ${M} dòng, rồi dò ${N} dòng một lần: Batches: 1`,
        off: "Bảng băm chỉ tra được bằng phép = , không dò được khoảng",
      },
      {
        id: "merge", name: "Merge Join", cost: op === "eq" ? merge : null,
        detail: sorted ? `hai đầu đã sắp (index hoặc kết quả trước): đi một lượt ${N} + ${M}` : `phải Sort trước: ${nlogn(N)} + ${nlogn(M)} rồi đi một lượt ${N + M}`,
        off: "Merge Join chỉ ghép được khi so bằng =, không ghép khoảng",
      },
    ];
  }, [op, innerIndex, sorted, spill]);

  const usable = lanes.filter((l) => l.cost !== null) as (Lane & { cost: number })[];
  const best = Math.min(...usable.map((l) => l.cost));
  const worst = Math.max(...usable.map((l) => l.cost));

  return (
    <div className="widget">
      <div className="race-controls">
        <div>
          <small>Điều kiện nối</small>
          <div className="seg small" role="group" aria-label="Điều kiện nối">
            <button className={op === "eq" ? "on" : ""} aria-pressed={op === "eq"} onClick={() => setOp("eq")}>a.id = b.id</button>
            <button className={op === "range" ? "on" : ""} aria-pressed={op === "range"} onClick={() => setOp("range")}>a.id &gt;= b.id</button>
          </div>
        </div>
        <label className="wx-toggle"><input type="checkbox" checked={innerIndex} onChange={(e) => setInnerIndex(e.target.checked)} /> Có index trên cột nối của bảng trong</label>
        <label className="wx-toggle"><input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} /> Hai đầu vào đã sắp theo cột nối</label>
        <label className="wx-toggle"><input type="checkbox" checked={spill} onChange={(e) => setSpill(e.target.checked)} /> work_mem nhỏ: bảng băm không vừa bộ nhớ</label>
      </div>

      <div className="wx-lanes">
        {lanes.map((l) => {
          const off = l.cost === null;
          const win = !off && l.cost === best;
          return (
            <div key={l.id} className={`race-lane ${off ? "wx-off" : win ? "good" : ""}`}>
              <header><strong>{l.name}</strong><span className="race-tag">{off ? "không dùng được" : win ? "rẻ nhất" : " "}</span></header>
              <p className="race-count"><b>{off ? "-" : l.cost!.toLocaleString("vi-VN")}</b>bước</p>
              <div className="wx-bar" aria-hidden><i style={{ width: off ? "0%" : `${Math.max(3, (l.cost! / worst) * 100)}%` }} /></div>
              <small>{off ? l.off : l.detail}</small>
            </div>
          );
        })}
      </div>
      <p className="wx-note">
        {op === "range"
          ? "Điều kiện khoảng chỉ còn Nested Loop: Hash và Merge cần so bằng. Index bên trong giúp, nhưng mỗi dòng ngoài vẫn đọc cả một đoạn của bảng trong."
          : innerIndex && !sorted
            ? "Có index trên bảng trong: Nested Loop chỉ tốn vài page cho mỗi dòng ngoài, thường thắng khi bảng ngoài nhỏ."
            : !innerIndex && !sorted
              ? "Không index, đầu vào chưa sắp: Hash Join đọc mỗi bảng đúng một lần, thắng rõ."
              : "Đầu vào đã sắp thì Merge Join không tốn thêm bước Sort. Hash Join cho ra kết quả không có thứ tự, Merge Join cho ra kết quả đã sắp theo cột nối."}
      </p>
      <p className="wx-note">Mô hình đếm bước với {N} dòng ngoài và {M} dòng trong, không đo thời gian. Spill giả định {BATCHES} batch và ghi rồi đọc lại phần ngoài batch đầu.</p>
    </div>
  );
}
