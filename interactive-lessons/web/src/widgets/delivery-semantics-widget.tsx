import { useState } from "react";

type Order = "commit-first" | "process-first";

/**
 * 20 messages, the consumer crashes after processing and before committing (or after committing and before processing).
 * The process-first + idempotent row is the real run in study note 03.11: round 2 received all 20 again and skipped 20.
 */
export function DeliverySemanticsWidget() {
  const [order, setOrder] = useState<Order>("process-first");
  const [idem, setIdem] = useState(true);
  const atMostOnce = order === "commit-first";
  const processed = atMostOnce ? 0 : idem ? 20 : 40;
  const verdict = atMostOnce ? "Mất 20 message" : idem ? "Không mất, không trùng" : "Xử lý trùng 20 message";
  return (
    <div className="widget">
      <div className="seg small">
        <button className={order === "commit-first" ? "on" : ""} onClick={() => setOrder("commit-first")}>commit trước, xử lý sau</button>
        <button className={order === "process-first" ? "on" : ""} onClick={() => setOrder("process-first")}>xử lý trước, commit sau</button>
      </div>
      <div className="seg small">
        <button className={idem ? "on" : ""} onClick={() => setIdem(true)}>consumer idempotent (bảng processed_event)</button>
        <button className={!idem ? "on" : ""} onClick={() => setIdem(false)}>không idempotent</button>
      </div>
      <ul className="log">
        {atMostOnce ? (
          <>
            <li>Vòng 1: nhận 20, commit offset, crash trước khi xử lý</li>
            <li className="err">Vòng 2 (cùng group): đọc từ offset đã commit, không nhận lại gì</li>
          </>
        ) : (
          <>
            <li>Vòng 1: nhận 20, xử lý 20, crash trước khi commit</li>
            <li className={idem ? "ok" : "err"}>Vòng 2 (cùng group): nhận lại 20 từ đầu, {idem ? "20 bị bỏ qua vì trùng eventId" : "xử lý lại cả 20"}</li>
          </>
        )}
      </ul>
      <div className={`result ${processed === 20 ? "good" : "bad"}`}>
        {verdict}
        <small>
          {atMostOnce
            ? "At-most-once. Lưu ý về enable.auto.commit=true trên client thuần: nó commit offset của lô poll() trước, ngay trong lần poll() kế tiếp, nên xử lý đồng bộ vẫn là at-least-once; mất message khi đẩy việc sang thread khác rồi poll tiếp."
            : idem
              ? "At-least-once + idempotent consumer: insert eventId (PRIMARY KEY) cùng transaction với nghiệp vụ, trùng thì bỏ qua. Đây là cách phổ biến nhất."
              : "At-least-once chắc chắn có lúc giao trùng (crash, rebalance, xử lý quá max.poll.interval.ms). Tiền bị trừ 2 lần, email gửi 2 lần."}
        </small>
      </div>
    </div>
  );
}
