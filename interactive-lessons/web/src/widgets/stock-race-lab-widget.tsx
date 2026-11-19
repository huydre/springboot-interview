import { useState } from "react";

/** Threads buying from stock 10 in lab 6 (study note 11.06), PostgreSQL Testcontainers, CyclicBarrier outside the transactions. */
const CASES: { label: string; sql: string; result: string; stock: string; ok: boolean; note: string }[] = [
  {
    label: "@Version, 2 thread",
    sql: "update products set name=?,price=?,stock=?,version=? where id=? and version=?",
    result: "1 committed, 1 ObjectOptimisticLockingFailureException (cause StaleObjectStateException)",
    stock: "stock 9, version 1",
    ok: true,
    note: "Không ghi đè sai, nhưng bên thua phải retry hoặc báo người dùng.",
  },
  {
    label: "UPDATE nguyên tử, 2 thread",
    sql: "update products p1_0 set stock=(p1_0.stock-?),version=(p1_0.version+1)\nwhere p1_0.id=? and p1_0.stock>=?",
    result: "rows=1, rows=1",
    stock: "stock 8, version 2",
    ok: true,
    note: "Câu này tự tăng version, nên entity đang giữ version cũ sẽ bị @Version chặn nếu ghi sau đó.",
  },
  {
    label: "UPDATE nguyên tử, 20 thread",
    sql: "decreaseStockAtomically(id, 1) × 20",
    result: "10 thread rows=1, 10 thread rows=0",
    stock: "stock 0 (không âm)",
    ok: true,
    note: "rows=0 nghĩa là hết hàng. Barrier phải đặt ngoài transaction: đặt bên trong thì mỗi thread giữ một connection rồi chờ nhau, dễ treo vì cạn pool.",
  },
];

export function StockRaceLabWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.sql}</pre>
      <div className={`result ${c.ok ? "good" : "bad"}`}>
        {c.result} · {c.stock}
        <small>{c.note}</small>
      </div>
    </div>
  );
}
