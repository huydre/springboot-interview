import { useState } from "react";
import { Code } from "../components/code-block";

/** outer() saves a row, calls inner() which saves and throws, outer catches. Results measured on Spring Boot 3.5 (study note 05.03). */
const CASES: { label: string; outer: boolean; inner: boolean; ex: string; why: string }[] = [
  {
    label: "inner REQUIRED (bean khác)",
    outer: false, inner: false,
    ex: "UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only",
    why: "Exception đi qua proxy của inner: \"Participating transaction failed - marking existing transaction as rollback-only\". Outer nuốt rồi commit thì bị rollback thật.",
  },
  {
    label: "inner REQUIRES_NEW (bean khác)",
    outer: true, inner: false,
    ex: "không có",
    why: "Inner rollback trên transaction của riêng nó, không đánh dấu gì lên transaction của outer.",
  },
  {
    label: "inner ném checked exception",
    outer: true, inner: true,
    ex: "không có",
    why: "Rollback rules của inner không rollback checked exception nên không đánh dấu rollback-only: cả hai dòng được lưu.",
  },
  {
    label: "inner cùng class (this.inner())",
    outer: true, inner: true,
    ex: "không có (suy ra)",
    why: "Không qua proxy của inner nên không ai đánh dấu rollback-only: trường hợp exception bị nuốt thông thường. Ô này suy ra từ cơ chế, không đo riêng.",
  },
];

export function InnerOuterWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{"@Transactional public void outer(String n) {\n    repo.save(new Item(n));\n    try { inner.saveAndThrow(n + \"-inner\"); }\n    catch (Exception e) { }   // nuốt\n}"}</Code>
      <ul className="log">
        <li className={c.outer ? "ok" : "err"}>Dòng của outer: {c.outer ? "có" : "không"}</li>
        <li className={c.inner ? "ok" : "err"}>Dòng của inner: {c.inner ? "có" : "không"}</li>
        <li className={c.ex.startsWith("không") ? "" : "err"}>Exception ra ngoài: {c.ex}</li>
      </ul>
      <p className="muted">{c.why}</p>
    </div>
  );
}
