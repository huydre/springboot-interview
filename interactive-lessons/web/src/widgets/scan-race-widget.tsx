import { useEffect, useRef, useState } from "react";

/**
 * Full table scan vs index lookup, as a race on a simple model: 100 rows per page, a B+Tree 2 to 3 levels tall, plus one
 * page to fetch the row itself. The point is the shape (scan grows with the table, the index barely moves), not exact numbers.
 */
const SIZES = [
  { label: "10 nghìn", rows: 10_000, levels: 2 },
  { label: "1 triệu", rows: 1_000_000, levels: 3 },
  { label: "10 triệu", rows: 10_000_000, levels: 3 },
] as const;
const SPOTS = ["Ngay dòng thứ 5", "Giữa bảng", "Dòng cuối cùng", "Không tồn tại"] as const;
const ROWS_PER_PAGE = 100;
const CELLS = 40;
const DURATION = 2600;
const fmt = (n: number) => n.toLocaleString("vi-VN");

export function ScanRaceWidget() {
  const [size, setSize] = useState(1);
  const [spot, setSpot] = useState(0);
  const [t, setT] = useState(0); // 0..1 progress of the race
  const raf = useRef(0);

  const { rows, levels } = SIZES[size];
  const scanPages = rows / ROWS_PER_PAGE;
  const found = spot !== 3;
  const indexPages = levels + (found ? 1 : 0);
  const indexSteps: string[] = [...Array(levels).keys()].map((i) => (i === 0 ? "Root" : i === levels - 1 ? "Leaf" : "Branch"));
  if (found) indexSteps.push("Dòng gốc");

  // The index finishes in the first 15% of the race; the scan needs all of it.
  const indexDone = Math.min(1, t / 0.15);
  const scanRead = Math.round(scanPages * t);
  const indexRead = Math.round(indexPages * indexDone);
  const running = t > 0 && t < 1;

  const reset = () => { cancelAnimationFrame(raf.current); setT(0); };
  useEffect(() => {
    const id = raf;
    return () => cancelAnimationFrame(id.current);
  }, []);

  const run = () => {
    reset();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(1); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setT(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const pick = (fn: () => void) => () => { fn(); reset(); };

  return (
    <div className="widget race">
      <div className="race-controls">
        <div>
          <small>Bảng có bao nhiêu dòng</small>
          <div className="seg small">
            {SIZES.map((s, i) => <button key={s.label} className={size === i ? "on" : ""} onClick={pick(() => setSize(i))}>{s.label}</button>)}
          </div>
        </div>
        <div>
          <small>Dòng khớp nằm ở đâu</small>
          <div className="seg small">
            {SPOTS.map((s, i) => <button key={s} className={spot === i ? "on" : ""} onClick={pick(() => setSpot(i))}>{s}</button>)}
          </div>
        </div>
        <button className="btn primary" onClick={run} disabled={running}>{t === 1 ? "Chạy lại" : "Chạy đua"}</button>
      </div>

      <div className="race-lanes">
        <div className="race-lane bad">
          <header><b>Không có index</b><span className="race-tag">Full table scan</span></header>
          <p className="race-count"><b>{fmt(scanRead)}</b> page đã đọc</p>
          <div className="race-pages" aria-hidden>
            {[...Array(CELLS).keys()].map((i) => <i key={i} className={i < Math.ceil(t * CELLS) ? "read" : ""} />)}
          </div>
          <small>{t === 0 ? "Chờ chạy" : t < 1 ? "Còn dòng nào khớp nữa không? Chưa biết, đọc tiếp..." : `Xong sau ${fmt(scanPages)} page`}</small>
        </div>
        <div className="race-lane good">
          <header><b>Có index</b><span className="race-tag">Đi qua B+Tree</span></header>
          <p className="race-count"><b>{indexRead}</b> page đã đọc</p>
          <ol className="race-path">
            {indexSteps.map((s, i) => <li key={s} className={indexRead > i ? "lit" : ""}>{s}</li>)}
          </ol>
          <small>{t === 0 ? "Chờ chạy" : indexDone < 1 ? "Đi xuống cây..." : found ? `Xong sau ${indexPages} page` : `Leaf không có key: dừng sau ${indexPages} page`}</small>
        </div>
      </div>

      <div className="race-sum">
        <div><small>Full scan đọc</small><b className="bad">{fmt(scanPages)} page</b><span>{fmt(rows)} dòng ÷ {ROWS_PER_PAGE} dòng mỗi page</span></div>
        <div><small>Index đọc</small><b className="good">{indexPages} page</b><span>{levels} tầng cây{found ? " + 1 lần lấy dòng gốc" : ", không có dòng để lấy"}</span></div>
        <div><small>Chênh lệch</small><b>ít hơn {fmt(Math.round(scanPages / indexPages))} lần</b><span>bảng càng to, khoảng cách càng giãn</span></div>
      </div>
    </div>
  );
}
