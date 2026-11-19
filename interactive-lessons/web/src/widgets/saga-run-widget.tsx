import { useState } from "react";

type Style = "orch" | "chor";
type Step = { service: string; act: string; undo?: string; cmd: string; done: string; failed?: string; undone?: string };

// Payment is the pivot: steps before it can be compensated, steps after it must only be retried until they succeed.
const STEPS: Step[] = [
  { service: "order-service", act: "tạo đơn PENDING", undo: "chuyển đơn sang CANCELLED", cmd: "CreateOrder", done: "OrderCreated", undone: "OrderCancelled" },
  { service: "inventory-service", act: "giữ 2 sản phẩm", undo: "trả 2 sản phẩm về kho", cmd: "ReserveStock", done: "StockReserved", failed: "StockReservationFailed", undone: "StockReleased" },
  { service: "payment-service", act: "thu 500.000đ", cmd: "ChargePayment", done: "PaymentCharged", failed: "PaymentFailed" },
  { service: "order-service", act: "chuyển đơn sang CONFIRMED, gửi email", cmd: "ConfirmOrder", done: "OrderConfirmed" },
];
const FAILS = [
  { at: -1, label: "không lỗi" },
  { at: 1, label: "kho hết hàng" },
  { at: 2, label: "thẻ bị từ chối" },
  { at: 3, label: "email-service lỗi" },
];
const PIVOT = 2;

type Line = { text: string; kind: "" | "ok" | "err" };

function run(style: Style, failAt: number): { lines: Line[]; end: string; good: boolean } {
  const lines: Line[] = [];
  const who = (i: number) => (style === "orch" ? `orchestrator → ${STEPS[i].service}: ${STEPS[i].cmd}` : i === 0 ? `client → ${STEPS[0].service}` : `${STEPS[i].service} nghe ${STEPS[i - 1].done}`);
  for (let i = 0; i < STEPS.length; i++) {
    const s = STEPS[i];
    if (i === failAt && i > PIVOT) {
      lines.push({ text: `${who(i)} · ${s.act}: lỗi, retry có backoff`, kind: "err" });
      lines.push({ text: `${who(i)} · retry lần 3: thành công`, kind: "ok" });
      return { lines, end: "Đơn CONFIRMED. Sau bước thu tiền không bù nữa, chỉ retry tới khi xong.", good: true };
    }
    if (i === failAt) {
      lines.push({ text: `${who(i)} · ${s.act}: thất bại${style === "chor" ? ` → phát ${s.failed}` : ""}`, kind: "err" });
      let heard = s.failed;
      for (let j = i - 1; j >= 0; j--) {
        const u = STEPS[j];
        const by = style === "orch" ? `orchestrator → ${u.service}` : `${u.service} nghe ${heard}`;
        lines.push({ text: `${by} · bù: ${u.undo}${style === "chor" && j > 0 ? ` → phát ${u.undone}` : ""}`, kind: "" });
        heard = u.undone;
      }
      return {
        lines,
        end: i === 1
          ? "Đơn CANCELLED. Kho chưa bị giữ nên chỉ còn bù bước tạo đơn."
          : "Đơn CANCELLED, kho trả lại. Mỗi bước bù là một local transaction mới, chạy ngược thứ tự.",
        good: false,
      };
    }
    lines.push({ text: `${who(i)} · ${s.act}${style === "chor" ? ` → phát ${s.done}` : ""}`, kind: "ok" });
  }
  return { lines, end: "Đơn CONFIRMED.", good: true };
}

/** An order saga across three services: pick who drives it and which step fails, then read the steps and compensations. */
export function SagaRunWidget() {
  const [style, setStyle] = useState<Style>("orch");
  const [failAt, setFailAt] = useState(2);
  const { lines, end, good } = run(style, failAt);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={style === "orch" ? "on" : ""} onClick={() => setStyle("orch")}>orchestration</button>
        <button className={style === "chor" ? "on" : ""} onClick={() => setStyle("chor")}>choreography</button>
      </div>
      <div className="seg small">
        {FAILS.map((f) => <button key={f.at} className={failAt === f.at ? "on" : ""} onClick={() => setFailAt(f.at)}>{f.label}</button>)}
      </div>
      <ol className="log">{lines.map((l, n) => <li key={n} className={l.kind}>{l.text}</li>)}</ol>
      <div className={`result ${good ? "good" : "warn"}`}>
        {end}
        <small>
          {style === "orch"
            ? "Orchestration: luồng nằm ở một chỗ, dễ đọc và dễ thêm bước; orchestrator lưu trạng thái saga trong DB để chạy tiếp sau khi restart."
            : "Choreography: không có ai điều phối, mỗi service nghe event của bước trước. Ít phụ thuộc, nhưng muốn biết luồng phải đọc nhiều service."}{" "}
          Trong lúc saga chạy, đơn ở PENDING để service khác không coi nó là đơn thành công.
        </small>
      </div>
    </div>
  );
}
