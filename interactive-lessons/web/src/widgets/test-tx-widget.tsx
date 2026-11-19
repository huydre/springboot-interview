import { useState } from "react";

/** Tests in a @SpringBootTest @Transactional class, measured on Spring Boot 3.5 (study note 05.05). */
const CASES: { label: string; inTest: string; after: string; ok: boolean; why: string }[] = [
  { label: "save rồi kết thúc test", inTest: "isActive=true, flaggedForRollback=true, exists=true", after: "0 dòng", ok: true, why: "Rollback sau mỗi test: DB tự sạch." },
  { label: "save 2 lần trùng unique", inTest: "PASS, không exception", after: "0 dòng", ok: false, why: "Id kiểu sequence: save() chưa chạy INSERT, flush chỉ xảy ra lúc commit mà test rollback. Test xanh, production đỏ." },
  { label: "trùng unique + em.flush()", inTest: "ConstraintViolationException", after: "0 dòng", ok: true, why: "Gọi flush() hoặc saveAndFlush() trước khi assert." },
  { label: "orders.place() trong test", inTest: "chỉ @EventListener chạy", after: "", ok: false, why: "Service REQUIRED tham gia transaction của test: AFTER_COMMIT, UnexpectedRollbackException, LazyInitializationException đều không xảy ra." },
  { label: "flagForCommit() + end()", inTest: "thêm BEFORE_COMMIT, AFTER_COMMIT, AFTER_COMPLETION", after: "", ok: true, why: "TestTransaction cho phép kết thúc transaction của test giữa chừng để kiểm tra hành vi lúc commit." },
  { label: "@Commit", inTest: "", after: "1 dòng (commit thật)", ok: false, why: "Dữ liệu ở lại cho test sau: tự dọn bằng @Sql, deleteAll hoặc tên dữ liệu riêng." },
];

export function TestTxWidget() {
  const [i, setI] = useState(1);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <ul className="log">
        {c.inTest && <li>Trong test: {c.inTest}</li>}
        {c.after && <li>Sau test: {c.after}</li>}
      </ul>
      <div className={`result ${c.ok ? "good" : "bad"}`}>
        {c.ok ? "Đúng ý" : "Bẫy"}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
