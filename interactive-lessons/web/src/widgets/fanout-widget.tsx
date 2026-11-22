import { useState } from "react";

/**
 * Fanout model: an entry is the key plus 16 bytes (pointer and per-entry overhead), a page is filled to 90%. Real engines
 * differ in the details; what holds is the chain key size -> entries per page -> tree height -> page reads per lookup.
 */
const PAGES = [{ label: "8 KB", sub: "PostgreSQL", kb: 8 }, { label: "16 KB", sub: "MySQL InnoDB", kb: 16 }] as const;
const KEYS = [{ label: "INT", bytes: 4 }, { label: "BIGINT", bytes: 8 }, { label: "UUID", bytes: 16 }, { label: "VARCHAR email", bytes: 30 }] as const;
const ROWS = [{ label: "1 triệu", n: 1e6 }, { label: "10 triệu", n: 1e7 }, { label: "100 triệu", n: 1e8 }] as const;
const OVERHEAD = 16;
const FILL = 0.9;
const fmt = (n: number) => n.toLocaleString("vi-VN");

export function FanoutWidget() {
  const [page, setPage] = useState(1);
  const [key, setKey] = useState(0);
  const [rows, setRows] = useState(2);

  const entry = KEYS[key].bytes + OVERHEAD;
  const fanout = Math.floor((PAGES[page].kb * 1024 * FILL) / entry);
  const n = ROWS[rows].n;
  // Smallest height h with fanout^h >= n; computed by multiplying to avoid floating-point log edge cases.
  let height = 1;
  for (let cap = fanout; cap < n; cap *= fanout) height += 1;
  const bst = Math.ceil(Math.log2(n));

  return (
    <div className="widget fan">
      <div className="fan-controls">
        <div><small>Page size</small><div className="seg small">{PAGES.map((p, i) => <button key={p.label} className={page === i ? "on" : ""} onClick={() => setPage(i)}>{p.label} <em>{p.sub}</em></button>)}</div></div>
        <div><small>Kiểu key</small><div className="seg small">{KEYS.map((k, i) => <button key={k.label} className={key === i ? "on" : ""} onClick={() => setKey(i)}>{k.label} <em>{k.bytes}B</em></button>)}</div></div>
        <div><small>Số dòng của bảng</small><div className="seg small">{ROWS.map((r, i) => <button key={r.label} className={rows === i ? "on" : ""} onClick={() => setRows(i)}>{r.label}</button>)}</div></div>
      </div>

      <div className="fan-body">
        <div className="fan-page">
          <header><b>Một page của B+Tree</b><span>{fmt(fanout)} entry</span></header>
          <div className="fan-cells" aria-hidden>
            {[...Array(Math.min(120, Math.ceil(fanout / 8))).keys()].map((i) => <i key={i} />)}
          </div>
          <small>mỗi ô ≈ 8 entry · mỗi entry {entry} B = key {KEYS[key].bytes} B + {OVERHEAD} B con trỏ</small>
        </div>
        <div className="fan-page bad">
          <header><b>Nếu dùng cây nhị phân</b><span>1 key mỗi node</span></header>
          <div className="fan-cells" aria-hidden><i /></div>
          <small>cả page chỉ dùng {entry} B, bỏ phí gần hết</small>
        </div>
      </div>

      <div className="race-sum">
        <div><small>Fanout (entry mỗi page)</small><b>{fmt(fanout)}</b><span>cũng là số nhánh của mỗi node</span></div>
        <div><small>Chiều cao B+Tree</small><b className="good">{height} tầng</b><span>{ROWS[rows].label} dòng · mỗi tầng = 1 lần đọc page</span></div>
        <div><small>Cây nhị phân cần</small><b className="bad">{bst} lần đọc</b><span>log₂ của {ROWS[rows].label}</span></div>
      </div>
      <small className="fan-note">Mô hình đơn giản (key + 16 B, page đầy 90%). Con số tuyệt đối lệch so với engine thật; điều cần đúng là quan hệ giữa chúng.</small>
    </div>
  );
}
