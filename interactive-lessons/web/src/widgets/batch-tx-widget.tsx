import { useState } from "react";

const NAMES = ["b-1", "b-2", "b-1", "b-3"];

/**
 * Four rows with a unique name, the second "b-1" violates it. The per-item TransactionTemplate run is measured (ok=3 failed=1,
 * study note 05.05); the single-transaction outcome follows from rollback of the whole batch.
 */
export function BatchTxWidget() {
  const [perItem, setPerItem] = useState(true);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={perItem ? "on" : ""} onClick={() => setPerItem(true)}>TransactionTemplate mỗi dòng</button>
        <button className={!perItem ? "on" : ""} onClick={() => setPerItem(false)}>@Transactional cả vòng lặp</button>
      </div>
      <pre className="code">{perItem
        ? "for (String name : names) {\n    try { tt.executeWithoutResult(s -> repo.saveAndFlush(new Item(name))); ok++; }\n    catch (RuntimeException e) { failed++; }\n}"
        : "@Transactional\npublic void importAll(List<String> names) {\n    names.forEach(n -> repo.saveAndFlush(new Item(n)));\n}"}</pre>
      <ul className="log">
        {NAMES.map((n, i) => {
          const dup = i === 2;
          const saved = perItem ? !dup : false;
          return <li key={i} className={saved ? "ok" : "err"}>{n}: {perItem ? (dup ? "DataIntegrityViolationException, bỏ qua" : "đã lưu") : dup ? "lỗi → rollback cả lô" : "mất theo rollback"}</li>;
        })}
      </ul>
      <div className={`result ${perItem ? "good" : "bad"}`}>
        {perItem ? "ok=3 failed=1: b-3 sau dòng lỗi vẫn được lưu" : "Một dòng lỗi làm mất cả lô"}
        <small>TransactionTemplate không dựa vào proxy nên cũng là cách sửa self-invocation gọn nhất. Gọi bên trong @Transactional khác thì mặc định REQUIRED sẽ tham gia: cần PROPAGATION_REQUIRES_NEW nếu muốn riêng.</small>
      </div>
    </div>
  );
}
