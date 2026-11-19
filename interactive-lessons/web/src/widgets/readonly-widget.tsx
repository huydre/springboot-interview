import { useState } from "react";

type Op = "dirty" | "save" | "saveAndFlush" | "jdbc";

/** Writes inside @Transactional(readOnly = true), measured on H2 2.3 and PostgreSQL 16 (study note 05.04). */
const OPS: Record<Op, { label: string; h2: string; pg: string; h2bad: boolean }> = {
  dirty: { label: "sửa field entity managed", h2: "không có UPDATE, stock giữ 10 (flush mode MANUAL)", pg: "không đo riêng (Hibernate không flush nên không có UPDATE)", h2bad: false },
  save: { label: "repo.save(new Product)", h2: "im lặng không lưu (không flush)", pg: "không đo", h2bad: true },
  saveAndFlush: { label: "repo.saveAndFlush(...)", h2: "LƯU ĐƯỢC", pg: "ERROR: cannot execute INSERT in a read-only transaction", h2bad: true },
  jdbc: { label: "jdbcTemplate.update(insert)", h2: "LƯU ĐƯỢC", pg: "ERROR: cannot execute INSERT in a read-only transaction (SQL state 25006)", h2bad: true },
};

export function ReadonlyWidget() {
  const [op, setOp] = useState<Op>("dirty");
  const o = OPS[op];
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(OPS) as Op[]).map((k) => <button key={k} className={op === k ? "on" : ""} onClick={() => setOp(k)}>{OPS[k].label}</button>)}
      </div>
      <ul className="log">
        <li className={o.h2bad ? "err" : "ok"}>H2: {o.h2}</li>
        <li className={o.pg.startsWith("ERROR") ? "ok" : ""}>PostgreSQL: {o.pg}</li>
      </ul>
      <p className="muted">
        readOnly = true: Hibernate flush mode MANUAL, session và entity read-only (bỏ dirty checking), Connection.setReadOnly(true), có thể route sang read replica.
        PostgreSQL chặn ghi, H2 thì không: readOnly không phải cơ chế bảo mật.
      </p>
    </div>
  );
}
