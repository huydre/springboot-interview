import { useState } from "react";

/** Each method saves one row then throws; whether the row survived, measured on Spring Boot 3.5 (study note 05.02). */
const CASES: { label: string; config: string; kept: boolean; why: string }[] = [
  { label: "IllegalStateException", config: "mặc định", kept: false, why: "RuntimeException: rollback." },
  { label: "AssertionError", config: "mặc định", kept: false, why: "Error: rollback." },
  { label: "IOException (checked)", config: "mặc định", kept: true, why: "Checked exception: COMMIT. Log in \"Initiating transaction commit\" trong khi caller nhận exception và tưởng đã thất bại." },
  { label: "IOException (checked)", config: "rollbackFor = Exception.class", kept: false, why: "rollbackFor thêm loại cần rollback, khớp cả subclass." },
  { label: "IllegalArgumentException", config: "noRollbackFor = IllegalArgumentException.class", kept: true, why: "Cố ý commit dù có exception." },
  { label: "catch và nuốt RuntimeException", config: "mặc định", kept: true, why: "Exception không ra khỏi method nên interceptor commit." },
  { label: "catch + setRollbackOnly()", config: "mặc định", kept: false, why: "Log: Transactional code has requested rollback. Gắn code với Spring API, chỉ dùng khi cần." },
];

export function RollbackRulesWidget() {
  const [i, setI] = useState(2);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label + x.config} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}{x.config !== "mặc định" ? ` + ${x.config.split(" ")[0]}` : ""}</button>)}
      </div>
      <pre className="code">{`@Transactional${c.config === "mặc định" ? "" : `(${c.config})`}\npublic void save(String n) {\n    repo.save(new Item(n));\n    // ném hoặc xử lý: ${c.label}\n}`}</pre>
      <div className={`result ${c.kept ? "bad" : "good"}`}>
        {c.kept ? "Dòng vẫn còn trong DB (commit)" : "Dòng không còn (rollback)"}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
