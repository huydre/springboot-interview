import { useState } from "react";

/** profile 300 ms + orders 500 ms; times measured on JDK 21 (they vary by a few ms between runs). */
const CASES: { label: string; code: string; time: string; orders: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  {
    label: "tuần tự",
    code: "Profile p = profileService(id);     // 300 ms\nOrders o = orderService(id);         // 500 ms",
    time: "822 ms",
    orders: "[o1, o2]",
    tone: "bad",
    why: "Chờ tổng hai việc.",
  },
  {
    label: "song song",
    code: "var pF = supplyAsync(() -> profileService(id), IO);\nvar oF = supplyAsync(() -> orderService(id), IO)\n        .completeOnTimeout(Orders.empty(), 1, SECONDS)\n        .exceptionally(ex -> Orders.empty());\npF.thenCombine(oF, View::new).join();",
    time: "503 ms",
    orders: "[o1, o2]",
    tone: "good",
    why: "Chờ việc chậm nhất chứ không phải tổng.",
  },
  {
    label: "order-service lỗi",
    code: "// orderService ném IllegalStateException sau 500 ms\n.exceptionally(ex -> Orders.empty())",
    time: "511 ms",
    orders: "[] (fallback)",
    tone: "warn",
    why: "Vẫn hiện profile, danh sách đơn rỗng: một nguồn lỗi không xoá cả màn hình.",
  },
  {
    label: "order-service treo 3 s",
    code: "// orderService mất 3000 ms\n.completeOnTimeout(Orders.empty(), 1, SECONDS)",
    time: "1012 ms",
    orders: "[] (fallback)",
    tone: "warn",
    why: "Màn hình trả về sau 1 giây, nhưng thread io-* vẫn bị giữ thêm 2 giây: cần read timeout ở HTTP client và circuit breaker.",
  },
];

export function CfDashboardWidget() {
  const [i, setI] = useState(1);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.code}</pre>
      <div className={`result ${c.tone}`}>
        {c.time} · orders = {c.orders}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
