import { useEffect, useRef, useState } from "react";

/**
 * Nested loop join on a simple model. Outer rows are read once; for each one the inner table is either scanned in full
 * (no index on the join column) or looked up through a B+Tree (about 3 page reads). The 5 × 5 board animates one pair of
 * rows at a time; the counters below scale the same rule to the chosen table sizes.
 */
const SIZES = [
  { label: "5 × 5", outer: 5, inner: 5 },
  { label: "10 × 100", outer: 10, inner: 100 },
  { label: "50 × 1.000", outer: 50, inner: 1_000 },
  { label: "100 × 10.000", outer: 100, inner: 10_000 },
] as const;
const BOARD = 5;
const LOOKUP = 3; // root, branch, leaf
const STEP_MS = 160;
const fmt = (n: number) => n.toLocaleString("vi-VN");

export function NestedLoopWidget() {
  const [size, setSize] = useState(1);
  const [indexed, setIndexed] = useState(false);
  const [step, setStep] = useState(-1); // which (outer, inner) comparison of the 5 × 5 board is lit
  const timer = useRef<number | undefined>(undefined);

  const perOuter = indexed ? 1 : BOARD; // board cells visited for one outer row
  const total = BOARD * perOuter;
  const outerRow = step < 0 ? -1 : Math.floor(step / perOuter);
  const innerCell = step < 0 ? -1 : indexed ? outerRow : step % perOuter; // with an index we jump straight to the match

  const stop = () => window.clearInterval(timer.current);
  useEffect(() => stop, []);
  const run = () => {
    stop();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(total - 1); return; }
    setStep(0);
    let n = 0;
    timer.current = window.setInterval(() => {
      n += 1;
      setStep(n);
      if (n >= total - 1) stop();
    }, indexed ? STEP_MS * 3 : STEP_MS);
  };

  const { outer, inner } = SIZES[size];
  const work = indexed ? outer * LOOKUP : outer * inner;
  const done = step >= total - 1;

  return (
    <div className="widget nl">
      <div className="race-controls">
        <div>
          <small>Bảng ngoài × bảng trong</small>
          <div className="seg small">
            {SIZES.map((s, i) => <button key={s.label} className={size === i ? "on" : ""} onClick={() => setSize(i)}>{s.label}</button>)}
          </div>
        </div>
        <div>
          <small>Cột join ở bảng trong</small>
          <div className="seg small">
            <button className={!indexed ? "on" : ""} onClick={() => { stop(); setIndexed(false); setStep(-1); }}>Không có index</button>
            <button className={indexed ? "on" : ""} onClick={() => { stop(); setIndexed(true); setStep(-1); }}>Có index</button>
          </div>
        </div>
        <button className="btn primary" onClick={run}>{step >= 0 ? "Chạy lại" : "Chạy mô phỏng"}</button>
      </div>

      <div className="nl-board">
        <div className="nl-col">
          <small>orders (ngoài)</small>
          {[...Array(BOARD).keys()].map((r) => <span key={r} className={`nl-row ${r === outerRow ? "on" : r < outerRow ? "done" : ""}`}>order {r + 1}</span>)}
        </div>
        <div className="nl-col">
          <small>customers (trong){indexed ? " · qua index" : " · quét hết"}</small>
          {[...Array(BOARD).keys()].map((c) => <span key={c} className={`nl-row ${c === innerCell ? (indexed || c === outerRow ? "hit" : "on") : ""}`}>customer {c + 1}</span>)}
        </div>
      </div>
      <p className="nl-caption">
        {step < 0
          ? "Bảng minh hoạ luôn là 5 × 5; ba ô số liệu bên dưới tính theo kích thước bạn chọn. Bấm chạy: với mỗi order, database đi tìm customer khớp."
          : indexed
            ? `Order ${outerRow + 1}: tra index, nhảy thẳng tới customer ${outerRow + 1}.`
            : `Order ${outerRow + 1}: so với customer ${innerCell + 1}${innerCell === outerRow ? " (khớp, nhưng vẫn phải xem hết)" : ""}.`}
      </p>

      <div className="race-sum">
        <div><small>Bảng ngoài</small><b>{fmt(outer)} dòng</b><span>đọc mỗi dòng một lần</span></div>
        <div><small>Mỗi dòng ngoài tốn</small><b className={indexed ? "good" : "bad"}>{indexed ? `${LOOKUP} page` : `${fmt(inner)} dòng`}</b><span>{indexed ? "root, branch, leaf của index" : "quét toàn bộ bảng trong"}</span></div>
        <div><small>Tổng công việc</small><b className={indexed ? "good" : "bad"}>{fmt(work)}</b><span>{indexed ? `${fmt(outer)} × ${LOOKUP}` : `${fmt(outer)} × ${fmt(inner)}`}{done ? " · xong" : ""}</span></div>
      </div>
    </div>
  );
}
