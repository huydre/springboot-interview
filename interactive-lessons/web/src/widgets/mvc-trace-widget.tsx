import { useState } from "react";

type Req = "ok" | "ex" | "invalid";

/** Lines printed by a filter, interceptor, @Around aspect, controller and advice on real requests, Boot 3.5 (study note 04.04). */
const ROWS: { step: string; ok: string; ex: string; invalid: string }[] = [
  { step: "Filter before", ok: "✓", ex: "✓", invalid: "✓" },
  { step: "Interceptor preHandle", ok: "✓", ex: "✓", invalid: "✓" },
  { step: "Aspect before", ok: "✓", ex: "✓", invalid: "không chạy" },
  { step: "Controller", ok: "✓", ex: "ném OrderNotFoundException", invalid: "không chạy" },
  { step: "Aspect after", ok: "after returning", ex: "thấy OrderNotFoundException", invalid: "không chạy" },
  { step: "Interceptor postHandle", ok: "✓", ex: "bỏ qua", invalid: "bỏ qua" },
  { step: "@RestControllerAdvice", ok: "", ex: "trả 404 ProblemDetail", invalid: "MethodArgumentNotValidException → 400" },
  { step: "Interceptor afterCompletion", ok: "ex=null", ex: "ex=null", invalid: "ex=null" },
  { step: "Filter after", ok: "status=200", ex: "status=404", invalid: "status=400" },
];

const LABEL: Record<Req, string> = { ok: "GET /orders/7", ex: "GET /orders/0 (ném exception)", invalid: "POST /orders body sai" };
const NOTE: Record<Req, string> = {
  ok: "Luồng đầy đủ: Filter, DispatcherServlet, HandlerMapping, Interceptor, HandlerAdapter (đọc body, convert, validate), Controller, HttpMessageConverter ghi JSON.",
  ex: "postHandle không chạy khi có exception: code luôn phải chạy (dọn ThreadLocal, đo thời gian) đặt ở afterCompletion. ex=null vì exception đã được @ExceptionHandler xử lý: đếm lỗi bằng status của response.",
  invalid: "@Valid @RequestBody được kiểm tra lúc HandlerAdapter chuẩn bị tham số, trước khi gọi method và trước proxy AOP: controller và aspect không hề chạy.",
};

export function MvcTraceWidget() {
  const [r, setR] = useState<Req>("invalid");
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(LABEL) as Req[]).map((k) => <button key={k} className={r === k ? "on" : ""} onClick={() => setR(k)}>{LABEL[k]}</button>)}
      </div>
      <ul className="log">
        {ROWS.filter((row) => row[r] !== "").map((row) => {
          const v = row[r];
          const skipped = v === "không chạy" || v === "bỏ qua";
          return <li key={row.step} className={skipped ? "err" : v === "✓" ? "ok" : ""}>{row.step}: {v}</li>;
        })}
      </ul>
      <p className="muted">{NOTE[r]}</p>
    </div>
  );
}
