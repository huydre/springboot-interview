import { useState } from "react";

const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: n < 10 ? 1 : 0 });
const bytes = (b: number) => (b >= 1e12 ? `${fmt(b / 1e12)} TB` : b >= 1e9 ? `${fmt(b / 1e9)} GB` : `${fmt(b / 1e6)} MB`);

/**
 * Back-of-envelope estimate for the URL shortener in study note 10.02. Defaults are the note's assumptions
 * (1M links/day, reads 100× writes, peak 5×, 500 bytes, 5 years, 10M hot links); the arithmetic is live.
 */
export function EstimateCalcWidget() {
  const [perDay, setPerDay] = useState(1_000_000);
  const [ratio, setRatio] = useState(100);
  const [peak, setPeak] = useState(5);
  const [years, setYears] = useState(5);
  const record = 500;
  const hot = 10_000_000;
  const writes = perDay / 86_400;
  const reads = writes * ratio;
  const total = perDay * 365 * years;
  let len = 1;
  while (62 ** len < total) len++;
  const rows: [string, string, string][] = [
    ["Ghi trung bình", `${fmt(perDay)} ÷ 86.400`, `${fmt(writes)} /giây`],
    ["Đọc trung bình", `${fmt(writes)} × ${ratio}`, `${fmt(reads)} /giây`],
    ["Peak", `× ${peak}`, `${fmt(writes * peak)} ghi, ${fmt(reads * peak)} đọc /giây`],
    ["Số link", `${fmt(perDay)} × 365 × ${years}`, fmt(total)],
    ["Dung lượng", `× ${record} byte`, bytes(total * record)],
    ["Cache link nóng", `10 triệu × ${record} byte`, bytes(hot * record)],
    ["Mã Base62 cần", `62^${len} = ${fmt(62 ** len)} ≥ số link`, `${len} ký tự`],
  ];
  return (
    <div className="widget">
      <div className="pick">
        <span>Link mới mỗi ngày: {fmt(perDay)}</span>
        <input type="range" min={100_000} max={100_000_000} step={100_000} value={perDay} onChange={(e) => setPerDay(+e.target.value)} />
        <span>Đọc gấp ghi: {ratio} lần</span>
        <input type="range" min={1} max={1000} value={ratio} onChange={(e) => setRatio(+e.target.value)} />
        <span>Peak gấp trung bình: {peak} lần</span>
        <input type="range" min={1} max={20} value={peak} onChange={(e) => setPeak(+e.target.value)} />
        <span>Số năm lưu: {years}</span>
        <input type="range" min={1} max={10} value={years} onChange={(e) => setYears(+e.target.value)} />
      </div>
      <ul className="log">{rows.map(([k, how, v]) => <li key={k}>{k}: {how} → <b>{v}</b></li>)}</ul>
      <p className="muted">
        Mẹo nhẩm: một ngày khoảng 10^5 giây, nên 1 triệu việc mỗi ngày là khoảng 10 việc mỗi giây. Ước lượng phải dẫn tới quyết định:
        {writes * peak < 1000 ? " lượng ghi nhỏ, một PostgreSQL đủ; đọc mới là chỗ cần cache." : " lượng ghi lớn, bắt đầu cân nhắc chia tải ghi."}
      </p>
    </div>
  );
}
