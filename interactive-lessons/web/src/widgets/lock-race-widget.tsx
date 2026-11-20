import { useState } from "react";
import { Code } from "../components/code-block";

/** Concurrent buyers and withdrawals measured on Hibernate 6.6 + PostgreSQL 16 (study note 05.08). */
const WAYS: { label: string; sql: string; result: string; ok: boolean; why: string }[] = [
  {
    label: "Không khoá",
    sql: "select ... from account where id=?   -- rồi tính trong Java",
    result: "100 - 50 - 30 → 50 (đúng là 20) · 10 thread trừ 1 từ 100 → 99 (đúng là 90)",
    ok: false,
    why: "Lost update: ai ghi sau đè kết quả người ghi trước. READ COMMITTED không chặn.",
  },
  {
    label: "@Version",
    sql: "update product set name=?,stock=?,version=? where id=? and version=?",
    result: "ObjectOptimisticLockingFailureException · DB: stock 9, version 1",
    ok: true,
    why: "Bên commit trước thắng, bên sau bị từ chối. Retry ngoài @Transactional hoặc trả 409. Form web phải gửi version về client. Không hợp flash sale.",
  },
  {
    label: "PESSIMISTIC_WRITE",
    sql: "select a1_0.id,a1_0.balance from account a1_0 where a1_0.id=? for no key update",
    result: "B chờ 1125 ms · balance cuối 20",
    ok: true,
    why: "Hibernate 6 trên PostgreSQL sinh FOR NO KEY UPDATE. lock.timeout = 0 thì thêm nowait: could not obtain lock on row. Cần transaction; khoá theo thứ tự id để tránh deadlock.",
  },
  {
    label: "UPDATE nguyên tử",
    sql: "update product p1_0 set stock=(p1_0.stock-?) where p1_0.id=? and p1_0.stock>=?",
    result: "Stock 10, 20 thread: 10 thành công, 10 trả về 0 dòng, stock cuối 0",
    ok: true,
    why: "Không cần đọc trước, không cần version. Bulk JPQL nên bỏ qua persistence context và không tăng @Version.",
  },
];

export function LockRaceWidget() {
  const [i, setI] = useState(0);
  const w = WAYS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {WAYS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{w.sql}</Code>
      <div className={`result ${w.ok ? "good" : "bad"}`}>
        {w.result}
        <small>{w.why}</small>
      </div>
    </div>
  );
}
