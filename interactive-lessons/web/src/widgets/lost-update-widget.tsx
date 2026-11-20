import { useState } from "react";
import { Code } from "../components/code-block";

/** Stock 10, two buyers each take one; the correct result is 8. PostgreSQL 16 (study note 05.04). */
const WAYS: { label: string; result: string; ok: boolean; why: string }[] = [
  { label: "READ_COMMITTED, đọc rồi ghi", result: "final stock = 9", ok: false, why: "Mất một lần trừ: READ COMMITTED không chặn read-modify-write." },
  { label: "REPEATABLE_READ, đọc rồi ghi", result: "CannotAcquireLockException: could not serialize access due to concurrent update", ok: false, why: "Không sai dữ liệu nhưng biến thành exception: vẫn phải bắt và retry." },
  { label: "Atomic UPDATE", result: "final stock = 8", ok: true, why: "update product set stock = stock - 1 where id = 1 and stock > 0: nhanh và đơn giản nhất. 0 dòng bị ảnh hưởng là hết hàng." },
  { label: "@Version", result: "ObjectOptimisticLockingFailureException · stock 9, version 1", ok: true, why: "Bên thua bị rollback toàn bộ, không có dữ liệu sai. Hợp xung đột hiếm; bắt exception rồi báo hoặc retry." },
  { label: "SELECT ... FOR UPDATE", result: "final stock = 8 · thread B chờ 306 ms", ok: true, why: "Khoá dòng lúc đọc (SELECT thường chỉ chờ 6 ms và ra 9). Hợp xung đột thường xuyên, giữ transaction thật ngắn." },
];

export function LostUpdateWidget() {
  const [i, setI] = useState(0);
  const w = WAYS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {WAYS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{"Product p = repo.findById(id).get();   // cả hai cùng đọc 10\np.setStock(p.getStock() - 1);         // cả hai cùng tính 9\n// commit"}</Code>
      <div className={`result ${w.ok ? "good" : "bad"}`}>
        {w.result}
        <small>{w.why}</small>
      </div>
    </div>
  );
}
