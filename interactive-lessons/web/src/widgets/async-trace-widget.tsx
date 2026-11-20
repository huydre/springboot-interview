import { useState } from "react";
import { Code } from "../components/code-block";

/** Real output after MDC.put("traceId", "abc-123") on the caller, Spring Boot 3.5 default executor (study note 04.05). */
const CALLS: { label: string; out: string; ok: boolean; why: string }[] = [
  { label: "sendMail() từ bean khác", out: "[task-1] sendMail to outside@x MDC=null", ok: false, why: "Chạy trên thread khác nhưng mất context: MDC, SecurityContext, transaction gắn với ThreadLocal của thread gốc." },
  { label: "placeOrder() gọi nội bộ sendMail()", out: "[main] sendMail to self@x MDC=abc-123", ok: false, why: "Self-invocation: @Async mất tác dụng, chạy đồng bộ trên thread gọi." },
  { label: "boom() (void, ném exception)", out: "[task-3] ... caught: mail server down in boom", ok: false, why: "Caller không biết gì; chỉ AsyncUncaughtExceptionHandler thấy. Trả CompletableFuture thì exception nằm trong future." },
  { label: "sendMail() với TaskDecorator copy MDC", out: "[task-1] sendMail to decorated@x MDC=abc-123", ok: true, why: "TaskDecorator chụp MDC trên thread gọi, đặt lại trên thread pool, dọn trong finally." },
  { label: "@Async String compute()", out: "IllegalArgumentException: Invalid return type for async method (only Future and void supported)", ok: false, why: "Tài liệu cũ nói caller nhận null; Spring 6.2 ném lỗi ngay." },
];

export function AsyncTraceWidget() {
  const [i, setI] = useState(0);
  const c = CALLS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CALLS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{c.out}</Code>
      <div className={`result ${c.ok ? "good" : "bad"}`}>
        {c.ok ? "Đúng ý" : "Bẫy"}
        <small>{c.why}</small>
      </div>
      <p className="muted">Executor mặc định của Boot 3.5: ThreadPoolTaskExecutor core 8, queueCapacity 2147483647, nên pool không bao giờ vượt 8 thread và task xếp hàng vô tận khi tải cao. Production tự cấu hình core, max, queue, tên thread và TaskDecorator.</p>
    </div>
  );
}
