import { useState } from "react";

type Call = { key: string; amount: number; label: string };
type Row = { call: Call; status: number; body: string };

const CALLS: Call[] = [
  { key: "k-123", amount: 500, label: "Bấm thanh toán (key k-123)" },
  { key: "k-123", amount: 500, label: "Timeout, retry cùng key" },
  { key: "k-123", amount: 1, label: "Cùng key, body khác" },
  { key: "k-456", amount: 500, label: "Lần thanh toán mới (key k-456)" },
];

/**
 * Same rules as the MockMvc run in study note 03.08: a stored key with the same body replays the old result,
 * a different body is 422, a new key charges. That run ended with charges = 2 after these four calls.
 */
export function IdempotencyKeyWidget() {
  const [useKey, setUseKey] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const send = (call: Call) =>
    setRows((prev) => {
      const charges = prev.filter((r) => r.status === 201).length;
      const stored = useKey ? prev.find((r) => r.status === 201 && r.call.key === call.key) : undefined;
      let row: Row;
      if (!stored) row = { call, status: 201, body: `paymentId ${1001 + charges}, replayed false` };
      else if (stored.call.amount !== call.amount) row = { call, status: 422, body: "Idempotency-Key reused with different body" };
      else row = { call, status: 200, body: `${stored.body.split(",")[0]}, replayed true` };
      return [...prev, row];
    });
  const charges = rows.filter((r) => r.status === 201).length;
  const doubled = !useKey && rows.filter((r) => r.call.key === "k-123" && r.call.amount === 500).length > 1;
  return (
    <div className="widget">
      <div className="seg small">
        <button className={useKey ? "on" : ""} onClick={() => { setUseKey(true); setRows([]); }}>server kiểm tra Idempotency-Key</button>
        <button className={!useKey ? "on" : ""} onClick={() => { setUseKey(false); setRows([]); }}>không kiểm tra</button>
      </div>
      <div className="seg small">
        {CALLS.map((c) => <button key={c.label} onClick={() => send(c)}>{c.label}</button>)}
      </div>
      <ul className="log">
        {rows.length === 0 && <li>Bấm các nút theo thứ tự để gửi POST /api/payments.</li>}
        {rows.map((r, n) => (
          <li key={n} className={r.status === 422 ? "err" : r.status === 200 ? "ok" : ""}>
            {r.call.key} · amount {r.call.amount} → <b>{r.status}</b> {r.body}
          </li>
        ))}
      </ul>
      <div className={`result ${doubled ? "bad" : "good"}`}>
        Cổng thanh toán bị gọi {charges} lần
        <small>{doubled
          ? "Không kiểm tra key: retry sau timeout trừ tiền lần nữa."
          : "Key do client sinh cho mỗi ý định thanh toán và dùng lại khi retry. Key là PRIMARY KEY nên hai request trùng key đồng thời không thể cùng insert: request sau nhận 409."}</small>
      </div>
    </div>
  );
}
