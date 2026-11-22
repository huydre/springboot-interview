import { useMemo, useState } from "react";

/**
 * Index order vs table order, on a simple model: 30,000 rows in 384 heap pages (78 rows per page), seq_page_cost 1,
 * random_page_cost 4. Index Scan touches one heap buffer per matching row when the table is in insertion order,
 * Bitmap Heap Scan reads each distinct page once, Seq Scan reads all pages. The shape matters, not the exact numbers.
 */
const ROWS = 30_000;
const PAGES = 384;
const PER_PAGE = ROWS / PAGES;
const STEPS = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100];
const RANDOM_COST = 4;
const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

// Fixed shuffle of the page numbers, so "which pages hold the matching rows" is stable between renders.
const SHUFFLE = Array.from({ length: PAGES }, (_, i) => (i * 131 + 7) % PAGES);

export function HeapOrderWidget() {
  const [step, setStep] = useState(4); // 5 percent
  const [sorted, setSorted] = useState(false);

  const m = useMemo(() => {
    const pct = STEPS[step];
    const n = Math.max(1, Math.round((ROWS * pct) / 100));
    const seqPages = PAGES;
    // Distinct pages holding the matching rows.
    const distinct = sorted ? Math.min(PAGES, Math.ceil(n / PER_PAGE)) : Math.min(PAGES, PAGES * (1 - Math.pow(1 - 1 / PAGES, n)));
    const indexTouches = sorted ? distinct : n; // random table: one heap visit per row
    const indexCost = sorted ? distinct : n * RANDOM_COST;
    // PostgreSQL interpolates the per-page cost of a bitmap scan between random and sequential as more pages are fetched.
    const bitmapCost = distinct * (RANDOM_COST - (RANDOM_COST - 1) * Math.sqrt(distinct / PAGES));
    const seqCost = seqPages;
    const best = Math.min(indexCost, bitmapCost, seqCost);
    const winner = best === seqCost ? "Seq Scan" : best === bitmapCost ? "Bitmap Heap Scan" : "Index Scan";
    return { pct, n, distinct: Math.round(distinct), indexTouches, indexCost, bitmapCost, seqCost, winner };
  }, [step, sorted]);

  const touched = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < m.distinct; i++) set.add(sorted ? i : SHUFFLE[i]);
    return set;
  }, [m.distinct, sorted]);

  return (
    <div className="widget">
      <div className="race-controls">
        <div className="wx-grow">
          <small>Lấy bao nhiêu phần trăm số dòng: {m.pct}% ({fmt(m.n)} dòng)</small>
          <input
            type="range" min={0} max={STEPS.length - 1} step={1} value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            aria-label="Phần trăm số dòng được lấy" aria-valuetext={`${m.pct} phần trăm`}
            className="wx-range"
          />
        </div>
        <div>
          <small>Bảng được ghi theo thứ tự</small>
          <div className="seg small">
            <button className={!sorted ? "on" : ""} aria-pressed={!sorted} onClick={() => setSorted(false)}>Ngẫu nhiên so với khoá</button>
            <button className={sorted ? "on" : ""} aria-pressed={sorted} onClick={() => setSorted(true)}>Cùng thứ tự khoá</button>
          </div>
        </div>
      </div>

      <div className="wx-blocks" role="img" aria-label={`${PAGES} block của bảng, ${m.distinct} block chứa dòng khớp`}>
        {Array.from({ length: PAGES }, (_, i) => <i key={i} className={touched.has(i) ? "hit" : ""} />)}
      </div>
      <small className="wx-cap">384 block của bảng. Ô được tô màu là block chứa ít nhất một dòng khớp: {m.distinct} block.</small>

      <div className="race-sum">
        <div className={m.winner === "Index Scan" ? "wx-win" : ""}>
          <small>Index Scan</small>
          <b className="bad">{fmt(m.indexTouches)} lần chạm</b>
          <span>{sorted ? "dòng khớp nằm liền nhau, đọc gần như tuần tự" : "mỗi dòng một lần nhảy tới block bất kỳ"} (cost mô hình {fmt(m.indexCost)})</span>
        </div>
        <div className={m.winner === "Bitmap Heap Scan" ? "wx-win" : ""}>
          <small>Bitmap Heap Scan</small>
          <b>{fmt(m.distinct)} block</b>
          <span>gom địa chỉ, đọc mỗi block một lần theo thứ tự (cost mô hình {fmt(m.bitmapCost)})</span>
        </div>
        <div className={m.winner === "Seq Scan" ? "wx-win" : ""}>
          <small>Seq Scan</small>
          <b className="good">{PAGES} block</b>
          <span>đọc hết bảng, tuần tự (cost mô hình {PAGES})</span>
        </div>
      </div>
      <p className="wx-note">
        Planner trong mô hình chọn: <b>{m.winner}</b>. Đây là mô hình đơn giản (30.000 dòng, 384 block, <code>random_page_cost</code> = 4, bỏ qua cache), đếm số lần chạm block chứ không đo thời gian.
      </p>
    </div>
  );
}
