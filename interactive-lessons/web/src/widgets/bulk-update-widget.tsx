import { useState } from "react";
import { Code } from "../components/code-block";

/** Load product (stock 10), bulk update stock = 0, then read again in the same transaction (study note 05.08). */
const CASES: { label: string; code: string; result: string; bad: boolean; why: string }[] = [
  {
    label: "@Modifying mặc định",
    code: "Product p = repo.findById(id).get();   // stock 10\nrepo.resetAll();                        // update Product p set p.stock = 0\nrepo.findById(id).get().getStock();",
    result: "Thấy 10 (DB đã là 0), cùng instance = true",
    bad: true,
    why: "Bulk update chạy thẳng xuống DB, không đi qua persistence context; findById lấy từ first-level cache.",
  },
  {
    label: "clearAutomatically = true",
    code: "@Modifying(clearAutomatically = true)\n@Query(\"update Product p set p.stock = 0\")\nint resetAllAndClear();",
    result: "Thấy 0, cùng instance = false",
    bad: false,
    why: "Context đã clear nên load lại. Nhưng clear cũng xoá thay đổi chưa flush của entity khác: thêm flushAutomatically = true.",
  },
  {
    label: "setStock trên entity cũ",
    code: "Product p = repo.findById(id).get();   // stock 10, version 0\nrepo.resetAll();                        // DB: stock 0\np.setStock(p.getStock() - 1);          // 9",
    result: "DB cuối: stock 9, version 1: bulk update bị ghi đè",
    bad: true,
    why: "Bulk update không tăng @Version, nên dirty checking ghi 9 dựa trên giá trị cũ mà không phát hiện xung đột nào.",
  },
  {
    label: "Gọi ngoài transaction",
    code: "repo.resetAll();   // không có @Transactional",
    result: "InvalidDataAccessApiUsageException: Executing an update/delete query",
    bad: true,
    why: "Query method tự khai báo không tự có transaction: đặt @Transactional ở service.",
  },
];

export function BulkUpdateWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{c.code}</Code>
      <div className={`result ${c.bad ? "bad" : "good"}`}>
        {c.result}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
