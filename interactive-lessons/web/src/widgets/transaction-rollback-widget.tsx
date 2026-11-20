import { useState } from "react";
import { Code } from "../components/code-block";

type Thrown = "checked" | "unchecked";

/**
 * checkout(): save order, take stock (10 → 8), then charge() fails. Spring's default rollback rule covers
 * RuntimeException and Error only. The checked rows match the order-service lab test (CheckedExceptionRollbackTest).
 */
export function TransactionRollbackWidget() {
  const [thrown, setThrown] = useState<Thrown>("checked");
  const [rollbackFor, setRollbackFor] = useState(false);
  const rollback = thrown === "unchecked" || rollbackFor;

  return (
    <div className="widget">
      <div className="seg">
        <button className={thrown === "checked" ? "on" : ""} onClick={() => setThrown("checked")}>PaymentFailedException extends Exception</button>
        <button className={thrown === "unchecked" ? "on" : ""} onClick={() => setThrown("unchecked")}>extends RuntimeException</button>
      </div>
      <label className="check">
        <input type="checkbox" checked={rollbackFor} onChange={(e) => setRollbackFor(e.target.checked)} /> thêm <code>rollbackFor = PaymentFailedException.class</code>
      </label>
      <div className="two">
        <Code>{`@Transactional${rollbackFor ? "(rollbackFor = PaymentFailedException.class)" : ""}
public OrderResponse checkout(CreateOrderRequest req) {
    orders.save(order);          // 1 đơn
    stock.take(keyboard, 2);     // kho 10 → 8
    payment.charge(order);       // ✕ ném PaymentFailedException
}`}</Code>
        <div className="panel">
          <div className={`result ${rollback ? "good" : "bad"}`}>
            {rollback ? "ROLLBACK" : "COMMIT"}
            <small>{rollback ? "Không có đơn nào, kho vẫn 10, không gửi email." : "Đơn chưa thanh toán vẫn lưu, kho còn 8, khách vẫn nhận email xác nhận."}</small>
          </div>
          <div className="result">
            orders = {rollback ? 0 : 1} · kho = {rollback ? 10 : 8}
            <small>{thrown === "checked" && !rollbackFor ? "Mặc định chỉ rollback với RuntimeException và Error." : rollbackFor && thrown === "checked" ? "rollbackFor mở rộng quy tắc sang exception checked này." : "Unchecked: rollback theo mặc định."}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
