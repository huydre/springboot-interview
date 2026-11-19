import { useState } from "react";

/** 10 orders with 3 items each; query count from Hibernate statistics on PostgreSQL 16 (study note 05.07). */
const FIXES: { label: string; queries: number; sql: string[]; note: string }[] = [
  {
    label: "Không sửa",
    queries: 11,
    sql: ["select ... from orders o1_0", ...Array(10).fill("select ... from order_item i1_0 where i1_0.order_id=?")],
    note: "Dấu hiệu: cùng một câu lặp lại N lần, chỉ khác tham số. 500 order × 1 ms round trip = 500 ms chỉ để chờ mạng.",
  },
  {
    label: "JOIN FETCH",
    queries: 1,
    sql: ["select ... from orders o1_0 join order_item i1_0 on o1_0.id=i1_0.order_id"],
    note: "Hibernate 6 trả 10 order, không nhân bản thành 30. Inner join bỏ mất order không có item: cần left join fetch.",
  },
  {
    label: "@EntityGraph",
    queries: 1,
    sql: ["select ... from orders o1_0 left join order_item i1_0 on o1_0.id=i1_0.order_id"],
    note: "Gắn lên derived query, không viết JPQL. Cùng các bẫy phân trang và nhiều bag như JOIN FETCH.",
  },
  {
    label: "batch_fetch_size=4",
    queries: 4,
    sql: ["select ... from orders o1_0", ...Array(3).fill("select ... from order_item i1_0 where i1_0.order_id = any (?)")],
    note: "ceil(10/4) = 3 câu batch. PostgreSQL nhận cả mảng id trong một tham số = any (?).",
  },
  {
    label: "batch_fetch_size=50",
    queries: 2,
    sql: ["select ... from orders o1_0", "select ... from order_item i1_0 where i1_0.order_id = any (?)"],
    note: "Bật một lần, sửa N+1 ở mọi nơi và không vỡ phân trang: lưới an toàn toàn cục.",
  },
  {
    label: "DTO projection",
    queries: 1,
    sql: ["select o1_0.id,c1_0.name,o1_0.total,(select count(*) ...) from orders o1_0 join customer c1_0 ..."],
    note: "Nhẹ nhất: chỉ cột cần, không dirty checking, không proxy. Hợp API danh sách chỉ đọc.",
  },
];

export function NPlusOneWidget() {
  const [i, setI] = useState(0);
  const f = FIXES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {FIXES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="bars">
        <div>{f.queries} query<i className={f.queries > 4 ? "bad" : "good"} style={{ width: `${(f.queries / 11) * 100}%` }} /></div>
      </div>
      <ul className="log">
        {f.sql.map((s, n) => <li key={n} className={i === 0 && n > 0 ? "err" : ""}>{s}</li>)}
      </ul>
      <p className="muted">{f.note}</p>
    </div>
  );
}
