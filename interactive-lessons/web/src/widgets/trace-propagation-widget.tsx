import { useState } from "react";

const TRACE = "4bf92f3577b34da6";
const NEW_IDS = ["9c1e07d24a6b33f0", "e27a4d81c05f9b16"];

type Hop = { svc: string; how: string; id: string | null };

/**
 * Micrometer Tracing in Spring Boot 3: only clients built from Boot's builders carry `traceparent`, Kafka needs observation
 * enabled on both template and listener, and @Async needs ContextPropagatingTaskDecorator. A hop that receives no context
 * starts a new trace; a thread with no context logs with an empty traceId.
 */
export function TracePropagationWidget() {
  const [builder, setBuilder] = useState(true);
  const [kafka, setKafka] = useState(true);
  const [decorator, setDecorator] = useState(true);
  // Each hop that loses the context starts its own trace, so it gets its own new id.
  const inv = builder ? TRACE : NEW_IDS[0];
  const notif = kafka ? TRACE : NEW_IDS[1];
  const email = decorator ? notif : null;
  const hops: Hop[] = [
    { svc: "gateway", how: "tạo trace mới, gửi traceparent", id: TRACE },
    { svc: "order-service", how: "nhận traceparent qua HTTP", id: TRACE },
    { svc: "inventory-service", how: builder ? "RestClient từ RestClient.Builder của Boot" : "RestClient.create(): không gửi traceparent", id: inv },
    { svc: "notification-service", how: kafka ? "traceparent đi trong header của record Kafka" : "observation Kafka tắt: record không mang trace", id: notif },
    { svc: "notification @Async", how: decorator ? "ContextPropagatingTaskDecorator chép context sang thread" : "thread mới không có context, MDC rỗng", id: email },
  ];
  const broken = hops.filter((h) => h.id !== TRACE).length;
  return (
    <div className="widget">
      <div className="seg small">
        <button className={builder ? "on" : ""} onClick={() => setBuilder(!builder)}>RestClient từ Builder</button>
        <button className={kafka ? "on" : ""} onClick={() => setKafka(!kafka)}>observation Kafka</button>
        <button className={decorator ? "on" : ""} onClick={() => setDecorator(!decorator)}>task decorator cho @Async</button>
      </div>
      <ul className="log">
        {hops.map((h) => (
          <li key={h.svc} className={h.id === TRACE ? "ok" : "err"}>
            [{h.id ?? "không có traceId"}] {h.svc}: {h.how}
          </li>
        ))}
      </ul>
      <div className={`result ${broken ? "bad" : "good"}`}>
        {broken ? `${broken} chặng bị đứt khỏi trace ${TRACE}` : `Cả 5 chặng chung trace ${TRACE}`}
        <small>
          {broken
            ? "Chặng không nhận được context sẽ mở trace mới hoặc log không có traceId: tìm theo traceId của request lỗi sẽ không thấy chặng đó."
            : "Tìm một traceId trong Zipkin/Tempo là thấy cả đường đi, và lọc log theo đúng mã đó ở cả 5 chặng. Thật ra id W3C dài 32 ký tự hex; ở đây cắt ngắn cho dễ đọc."}
        </small>
      </div>
    </div>
  );
}
