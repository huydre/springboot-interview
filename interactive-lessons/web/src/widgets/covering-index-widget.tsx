import { useState } from "react";
import { Code } from "../components/code-block";

/** Covering index on PostgreSQL 16, 1M orders. Plans re-checked on a fresh database, including the VACUUM effect. */
export function CoveringIndexWidget() {
  const [total, setTotal] = useState(false);
  const [include, setInclude] = useState(false);
  const [vacuumed, setVacuumed] = useState(true);
  const covered = !total || include;
  const indexOnly = covered && vacuumed;
  const cols = total ? "customer_id, created_at, total" : "customer_id, created_at";
  const idx = include ? "(customer_id, created_at) include (total)" : "(customer_id, created_at)";
  const plan = indexOnly
    ? `Index Only Scan using idx on orders (actual rows=13)\n  Index Cond: (customer_id = 4242)\n  Heap Fetches: 0`
    : `Bitmap Heap Scan on orders (actual rows=13)\n  Recheck Cond: (customer_id = 4242)\n  ->  Bitmap Index Scan on idx\n        Index Cond: (customer_id = 4242)`;
  return (
    <div className="widget">
      <div className="seg small">
        <button className={total ? "on" : ""} onClick={() => setTotal((v) => !v)}>select thêm cột total</button>
        <button className={include ? "on" : ""} onClick={() => setInclude((v) => !v)}>index có INCLUDE (total)</button>
        <button className={vacuumed ? "on" : ""} onClick={() => setVacuumed((v) => !v)}>đã VACUUM</button>
      </div>
      <Code>{`create index idx on orders${idx};\n\nselect ${cols}\nfrom orders where customer_id = 4242;\n\n${plan}`}</Code>
      <div className={`result ${indexOnly ? "good" : "bad"}`}>
        {indexOnly ? "Index Only Scan: không đụng bảng" : "Phải đọc thêm bảng"}
        <small>
          {!covered
            ? "Cột total không có trong index nên mỗi dòng phải sang bảng lấy. Thêm INCLUDE (total) để index chứa đủ cột."
            : !vacuumed
              ? "Index đủ cột nhưng bảng vừa ghi xong: PostgreSQL chưa biết page nào \"mọi dòng đều nhìn thấy được\" (visibility map), nên vẫn phải sang bảng kiểm tra. Đã thử: ngay sau insert ra Bitmap Heap Scan, sau VACUUM ra Index Only Scan."
              : "Index chứa mọi cột query cần, Heap Fetches: 0. select * làm mất lợi ích này."}
        </small>
      </div>
    </div>
  );
}
