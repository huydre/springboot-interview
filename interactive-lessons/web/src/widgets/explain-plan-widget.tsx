import { useState } from "react";
import { Code } from "../components/code-block";

/**
 * Plans measured on PostgreSQL 16 (orders 1M rows, customer 100k rows, parallel query off).
 * Plan shapes were re-checked on a fresh postgres:16-alpine; times are from the study notes run, except the created_at-only
 * Seq Scan: the notes logged 1296 ms on a heavily loaded machine, a re-run on a warm cache took 95 ms.
 */
const CASES: { where: string; table?: string; plan: string[]; ms: string; good: boolean; why: string; fix?: string }[] = [
  {
    where: "customer_id = 4242  (chưa có index)",
    plan: ["Seq Scan on orders (actual rows=13)", "  Filter: (customer_id = 4242)", "  Rows Removed by Filter: 999987"],
    ms: "99 ms",
    good: false,
    why: "Đọc cả 1 triệu dòng để lấy 13 dòng.",
    fix: "create index on orders(customer_id, created_at)",
  },
  {
    where: "customer_id = 4242",
    plan: ["Bitmap Heap Scan on orders (actual rows=13)", "  ->  Bitmap Index Scan on idx_orders_customer_created", "        Index Cond: (customer_id = 4242)"],
    ms: "0,26 ms",
    good: true,
    why: "Có index: đọc đúng 13 dòng, nhanh khoảng 400 lần.",
  },
  {
    where: "customer_id = 4242 order by created_at desc limit 5",
    plan: ["Limit", "  ->  Index Scan Backward using idx_orders_customer_created", "        Index Cond: (customer_id = 4242)"],
    ms: "2 ms",
    good: true,
    why: "Index đã sắp created_at trong mỗi customer_id: đọc ngược 5 phần tử, không có node Sort.",
  },
  {
    where: "created_at >= '2026-11-01' and created_at < '2026-11-02'",
    plan: ["Seq Scan on orders", "  Filter: ((created_at >= ...) AND (created_at < ...))", "  Rows Removed by Filter: 998616"],
    ms: "95 ms",
    good: false,
    why: "Vi phạm leftmost prefix: index (customer_id, created_at) không dùng được khi thiếu customer_id, nên chậm ngang như chưa có index.",
    fix: "Cần index riêng bắt đầu bằng created_at nếu query này hay chạy",
  },
  {
    where: "created_at::date = '2026-11-01'",
    plan: ["Seq Scan on orders", "  Filter: ((created_at)::date = '2026-11-01'::date)"],
    ms: "181 ms",
    good: false,
    why: "Ép kiểu phía cột tạo ra giá trị khác, index không tra được.",
    fix: "created_at >= '2026-11-01' and created_at < '2026-11-02'  (có index trên created_at: 13 ms)",
  },
  {
    where: "customer_id = 4242.0",
    plan: ["Seq Scan on orders", "  Filter: ((customer_id)::numeric = 4242.0)"],
    ms: "",
    good: false,
    why: "Hằng số kiểu numeric nên PostgreSQL ép cột int sang numeric từng dòng.",
    fix: "Truyền đúng kiểu int: customer_id = 4242",
  },
  {
    where: "email like 'user4242%'  (index btree thường)",
    table: "customer",
    plan: ["Seq Scan on customer", "  Filter: (email ~~ 'user4242%'::text)", "  Rows Removed by Filter: 99989"],
    ms: "",
    good: false,
    why: "Collation en_US.utf8: index sắp theo luật ngôn ngữ, không theo byte, nên không tra prefix được.",
    fix: "create index on customer(email text_pattern_ops)  → Index Scan, 0,33 ms",
  },
  {
    where: "status = 'PAID'  (70% bảng, có index)",
    plan: ["Seq Scan on orders", "  Filter: (status = 'PAID'::text)"],
    ms: "339 ms",
    good: true,
    why: "Không phải lỗi: lấy 700 nghìn dòng qua index chậm hơn đọc tuần tự. Optimizer chọn đúng.",
  },
  {
    where: "status = 'REFUNDED'  (0,5% bảng)",
    plan: ["Bitmap Heap Scan on orders", "  ->  Bitmap Index Scan on idx_orders_status", "        Index Cond: (status = 'REFUNDED'::text)"],
    ms: "34 ms",
    good: true,
    why: "Giá trị hiếm nên index đáng dùng.",
  },
];

export function ExplainPlanWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <p className="muted">Chọn điều kiện WHERE, xem plan thật (orders 1 triệu dòng, customer 100 nghìn dòng):</p>
      <div className="seg small">
        {CASES.map((x, n) => (
          <button key={x.where} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.where}</button>
        ))}
      </div>
      <Code>{`explain analyze select * from ${c.table ?? "orders"}\nwhere ${c.where.replace(/ {2}\(.*\)$/, "")};\n\n${c.plan.join("\n")}`}</Code>
      <div className={`result ${c.good ? "good" : "bad"}`}>
        {c.plan[0].split(" (")[0].split(" on ")[0]}{c.ms && ` · ${c.ms}`}
        <small>{c.why}{c.fix && <><br />Sửa: <code>{c.fix}</code></>}</small>
      </div>
    </div>
  );
}
