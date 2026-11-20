import { useState } from "react";
import { Code } from "../components/code-block";

/** r = new Thread(() -> print("run in " + currentThread().getName()), "my-thread"). Output observed on JDK 21. */
const STEPS: { code: string; out: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  { code: "r.run();", out: "run in main", tone: "warn", why: "chỉ là gọi method trên thread hiện tại: không có thread mới, mất song song mà không báo lỗi" },
  { code: "r.start();", out: "run in my-thread", tone: "good", why: "JVM tạo thread mới, thread đó gọi run()" },
  { code: "r.join();", out: "(main chờ my-thread xong)", tone: "good", why: "sau join(), mọi thay đổi của my-thread đều nhìn thấy được" },
  { code: "r.start();   // lần hai", out: "java.lang.IllegalThreadStateException", tone: "bad", why: "thread đã TERMINATED không chạy lại được; muốn chạy lại thì tạo thread mới hoặc dùng pool" },
];

export function RunStartWidget() {
  const [n, setN] = useState(1);
  return (
    <div className="widget">
      <Code>{`Thread r = new Thread(() -> print("run in " + currentThread().getName()), "my-thread");\n${STEPS.slice(0, n).map((s) => s.code).join("\n")}`}</Code>
      <ul className="log">
        {STEPS.slice(0, n).map((s) => <li key={s.code} className={s.tone === "bad" ? "err" : s.tone === "good" ? "ok" : ""}>{s.code} → {s.out}</li>)}
      </ul>
      <div className={`result ${STEPS[n - 1].tone}`}>
        {STEPS[n - 1].out}
        <small>{STEPS[n - 1].why}</small>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={n >= STEPS.length} onClick={() => setN(n + 1)}>Dòng tiếp theo</button>
        <button className="btn ghost" onClick={() => setN(1)}>Làm lại</button>
      </div>
    </div>
  );
}
