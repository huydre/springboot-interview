import { useState } from "react";
import { Code } from "../components/code-block";

/** Number of UPDATE statements counted with Hibernate statistics; Hibernate 6.6 + PostgreSQL 16 (study note 05.06). */
const CASES: { label: string; updates: number; db: string; why: string }[] = [
  { label: "setter trong @Transactional, không save()", updates: 1, db: "đã đổi thành Binh", why: "Lúc flush, Hibernate so field với snapshot lúc load và sinh update customer set name=? where id=?." },
  { label: "setter gán đúng giá trị cũ", updates: 0, db: "không đổi", why: "Không khác snapshot thì không có gì để update." },
  { label: "setter trong readOnly = true", updates: 0, db: "không đổi", why: "Session read-only, FlushMode.MANUAL: không giữ snapshot, không tự flush." },
  { label: "setter trên entity detached", updates: 0, db: "không đổi", why: "Không thuộc persistence context nào thì không ai theo dõi." },
];

export function DirtyCheckWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{"Customer c = customers.findById(id).orElseThrow();   // name = \"An\"\nc.setName(" + (i === 1 ? "\"An\"" : "\"Binh\"") + ");"}</Code>
      <div className={`result ${c.updates ? "good" : ""}`}>
        {c.updates} câu UPDATE · trong DB: {c.db}
        <small>{c.why} Mặc định UPDATE tất cả cột; @DynamicUpdate chỉ update cột thay đổi.</small>
      </div>
    </div>
  );
}
