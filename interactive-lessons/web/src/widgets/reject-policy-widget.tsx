import { useState } from "react";

/** Pool with 1 thread and ArrayBlockingQueue(2); 5 tasks of 100 ms each. Every result below was run on JDK 21. */
const POLICIES: { name: string; ran: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  { name: "AbortPolicy", ran: "chạy [1, 2, 3] · task 4, 5 ném RejectedExecutionException", tone: "warn", why: "Mặc định. Bên gọi biết ngay là quá tải: với API thì trả 503 để client retry." },
  { name: "CallerRunsPolicy", ran: "chạy đủ 5 task: task 4 chạy trên main; task 5 tuỳ thời điểm, chạy trên main hoặc vào queue nếu worker vừa rảnh", tone: "good", why: "Thread gọi execute tự chạy task: bên gửi bị kéo chậm (lần đo khác với 1 thread, queue 1, 3 task mỗi task 1 giây: vòng gửi task mất 1005 ms). Back-pressure, không mất task." },
  { name: "DiscardPolicy", ran: "chạy [1, 2, 3] · task 4, 5 biến mất", tone: "bad", why: "Không lỗi, không log: mất dữ liệu mà không ai biết. Nếu dùng, tự viết handler có log và metric." },
  { name: "DiscardOldestPolicy", ran: "chạy [1, 4, 5] · task 2, 3 bị đẩy ra khỏi queue", tone: "warn", why: "Bỏ task cũ nhất để nhận task mới: chỉ hợp khi chỉ cần dữ liệu mới nhất." },
];

export function RejectPolicyWidget() {
  const [i, setI] = useState(0);
  const p = POLICIES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {POLICIES.map((x, n) => <button key={x.name} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.name}</button>)}
      </div>
      <pre className="code">{`new ThreadPoolExecutor(1, 1, 0, SECONDS, new ArrayBlockingQueue<>(2),
        new ThreadPoolExecutor.${p.name}());
for (int i = 1; i <= 5; i++) pool.execute(task(i));   // mỗi task 100 ms`}</pre>
      <div className={`result ${p.tone}`}>
        {p.ran}
        <small>{p.why}</small>
      </div>
    </div>
  );
}
