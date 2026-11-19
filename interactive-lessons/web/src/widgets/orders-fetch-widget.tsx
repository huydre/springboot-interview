import { useState } from "react";

/** GET /orders over 10 orders × 3 lines on 5 products; statements counted with Hibernate statistics on PostgreSQL (study note 11.06). */
const WAYS: { label: string; n: number; sql: string[]; note: string }[] = [
  { label: "NAIVE", n: 16, sql: ["select ... from orders o1_0", "10 × select ... from order_items i1_0 where i1_0.order_id=?", "5 × select ... from products p1_0 where p1_0.id=?"], note: "Thực chất là 1 + N + P: thêm cấp product là thêm một nhóm query. 1 000 đơn, 200 sản phẩm là 1 201 câu." },
  { label: "JOIN_FETCH", n: 1, sql: ["select ... from orders o1_0 left join order_items i1_0 ... left join products p1_0 ..."], note: "Viết bằng JPQL left join fetch. JSON vẫn 10 đơn, Hibernate 6 tự loại trùng parent." },
  { label: "ENTITY_GRAPH", n: 1, sql: ["Giống hệt câu của JOIN_FETCH"], note: "Khác chỗ viết (annotation), không khác ở DB." },
  { label: "NAIVE + batch 50", n: 3, sql: ["select ... from orders o1_0", "select ... from order_items i1_0 where i1_0.order_id = any (?)", "select ... from products p1_0 where p1_0.id = any (?)"], note: "Không sửa code gọi. Số query tỉ lệ với số cấp quan hệ, không tỉ lệ với số dòng." },
];

export function OrdersFetchWidget() {
  const [guess, setGuess] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const w = WAYS[i];
  return (
    <div className="widget">
      <p className="muted">Đoán trước: bản NAIVE (findAll rồi map sang DTO có items và product) chạy bao nhiêu câu SQL?</p>
      <div className="seg small">
        {[11, 16, 31].map((g) => <button key={g} className={guess === g ? "on" : ""} onClick={() => setGuess(g)}>{g}</button>)}
      </div>
      {guess !== null && (
        <>
          <p className="muted">{guess === 16 ? "Đúng: 1 + 10 + 5." : `Chưa đúng: là 16 = 1 câu orders + 10 câu items + 5 câu product (chỉ 5 sản phẩm khác nhau, phần còn lại lấy từ first-level cache).`}</p>
          <div className="seg small">
            {WAYS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
          </div>
          <div className="bars"><div>{w.n} statement<i className={w.n > 3 ? "bad" : "good"} style={{ width: `${(w.n / 16) * 100}%` }} /></div></div>
          <ul className="log">{w.sql.map((s) => <li key={s} className={i === 0 && s.includes("×") ? "err" : ""}>{s}</li>)}</ul>
          <p className="muted">{w.note}</p>
        </>
      )}
    </div>
  );
}
