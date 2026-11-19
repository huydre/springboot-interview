import { useState } from "react";

type Level = "READ_COMMITTED" | "REPEATABLE_READ";
type Case = "stock" | "count" | "jpa";

/** Outer transaction reads twice; a REQUIRES_NEW transaction commits a change in between. PostgreSQL 16 (study note 05.04). */
const RESULT: Record<Case, Record<Level, string> & { label: string; code: string }> = {
  stock: { label: "đọc stock 2 lần", code: "select stock from product where id = 1", READ_COMMITTED: "first=10 second=50", REPEATABLE_READ: "first=10 second=10" },
  count: { label: "count(*) 2 lần", code: "select count(*) from product", READ_COMMITTED: "first=1 second=2", REPEATABLE_READ: "first=1 second=1" },
  jpa: { label: "findById 2 lần (JPA)", code: "productRepo.findById(1L)", READ_COMMITTED: "first=10 second=10 · sameInstance=true · JDBC lúc đó: 50", REPEATABLE_READ: "first=10 second=10" },
};

export function IsolationReadWidget() {
  const [level, setLevel] = useState<Level>("READ_COMMITTED");
  const [c, setC] = useState<Case>("stock");
  const r = RESULT[c];
  const changed = r[level].includes("second=50") || r[level].includes("second=2");
  return (
    <div className="widget">
      <div className="seg small">
        {(["READ_COMMITTED", "REPEATABLE_READ"] as Level[]).map((l) => <button key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>{l}</button>)}
      </div>
      <div className="seg small">
        {(Object.keys(RESULT) as Case[]).map((k) => <button key={k} className={c === k ? "on" : ""} onClick={() => setC(k)}>{RESULT[k].label}</button>)}
      </div>
      <pre className="code">{`${r.code};   // lần 1\n// tx khác (REQUIRES_NEW) ${c === "count" ? "insert 1 dòng" : "update stock = 50"} rồi commit\n${r.code};   // lần 2`}</pre>
      <div className={`result ${changed ? "bad" : "good"}`}>
        {r[level]}
        <small>
          {c === "jpa" && level === "READ_COMMITTED"
            ? "Persistence context trả lại entity cũ mà không chạy SQL: ứng dụng thấy \"repeatable\" dù DB là READ COMMITTED. Muốn giá trị mới: entityManager.refresh() hoặc JPQL."
            : level === "READ_COMMITTED"
              ? "Mỗi câu lệnh chụp một snapshot mới nên thấy dữ liệu tx khác vừa commit: non-repeatable read, phantom."
              : "Snapshot chụp ở câu lệnh đầu tiên và dùng tới cuối. REPEATABLE READ của PostgreSQL chặn cả phantom."}
        </small>
      </div>
    </div>
  );
}
