import { useState } from "react";
import { Code } from "../components/code-block";

/** failing = supplyAsync(() -> { throw new IllegalStateException("svc down"); }, io). Every result was run on JDK 21. */
const HANDLERS: { label: string; code: string; out: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  {
    label: "exceptionally",
    code: "failing.thenApply(x -> x * 2)\n       .exceptionally(ex -> -1)\n       .join();",
    out: "-1",
    tone: "good",
    why: "thenApply bị bỏ qua; ex là CompletionException, getCause() là IllegalStateException: svc down. Chỉ chạy khi lỗi, trả fallback.",
  },
  {
    label: "handle",
    code: 'failing.handle((v, ex) -> ex == null ? "ok " + v : "fallback").join();',
    out: "fallback",
    tone: "good",
    why: "Luôn chạy, nhận cả kết quả lẫn exception, đổi được kết quả ở cả hai nhánh.",
  },
  {
    label: "whenComplete",
    code: 'failing.whenComplete((v, ex) -> log.warn("failed", ex)).join();',
    out: "CompletionException (vẫn ném)",
    tone: "warn",
    why: "Luôn chạy nhưng chỉ quan sát: không đổi được kết quả, lỗi trôi tiếp. Dùng để log, metric.",
  },
  {
    label: "không xử lý, không join",
    code: "failing.thenApply(x -> x * 2);   // không ai join()",
    out: "(không có gì xảy ra, không log)",
    tone: "bad",
    why: "Lỗi nằm im trong CF không ai đọc, giống submit() mà không get().",
  },
];

export function CfErrorWidget() {
  const [i, setI] = useState(0);
  const h = HANDLERS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {HANDLERS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{h.code}</Code>
      <div className={`result ${h.tone}`}>
        {h.out}
        <small>{h.why}</small>
      </div>
    </div>
  );
}
