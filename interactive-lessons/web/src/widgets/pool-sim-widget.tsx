import { useState } from "react";

type Outcome = "core" | "queue" | "extra" | "reject";

/**
 * ThreadPoolExecutor.execute() for tasks that run longer than the whole submit loop: below core -> new thread,
 * else queue if room, else new thread up to max, else reject. For core 2, max 4, queue 10, 20 tasks this matches the
 * JDK 21 run (4 running, 10 queued, 6 rejected; start order 1, 2, 13, 14, 3..12).
 */
function simulate(core: number, max: number, queue: number | null, tasks: number) {
  let threads = 0;
  let queued = 0;
  const out: Outcome[] = [];
  for (let i = 0; i < tasks; i++) {
    if (threads < core) { threads++; out.push("core"); }
    else if (queue === null || queued < queue) { queued++; out.push("queue"); }
    else if (threads < max) { threads++; out.push("extra"); }
    else out.push("reject");
  }
  return out;
}

const LABEL: Record<Outcome, string> = { core: "thread core", queue: "vào queue", extra: "thread vượt core", reject: "REJECTED" };
const CLASS: Record<Outcome, string> = { core: "", queue: "untouched", extra: "tree", reject: "bad" };

export function PoolSimWidget() {
  const [core, setCore] = useState(2);
  const [max, setMax] = useState(4);
  const [queue, setQueue] = useState<number | null>(10);
  const [tasks, setTasks] = useState(20);
  const out = simulate(core, Math.max(core, max), queue, tasks);
  const count = (o: Outcome) => out.filter((x) => x === o).length;
  const running = count("core") + count("extra");
  const order = [...out.map((o, i) => ({ o, i: i + 1 })).filter((x) => x.o === "core" || x.o === "extra"), ...out.map((o, i) => ({ o, i: i + 1 })).filter((x) => x.o === "queue")].map((x) => x.i);
  const num = (label: string, v: number, set: (n: number) => void, lo: number, hi: number) => (
    <label className="actions">
      <span className="muted">{label}</span>
      <input className="text-input" type="number" min={lo} max={hi} value={v} onChange={(e) => set(Math.min(hi, Math.max(lo, Number(e.target.value) || lo)))} />
    </label>
  );
  return (
    <div className="widget">
      <div className="actions">
        {num("core", core, setCore, 1, 8)}
        {num("max", max, setMax, 1, 12)}
        {num("tasks", tasks, setTasks, 1, 40)}
      </div>
      <div className="seg small">
        {[2, 5, 10].map((q) => <button key={q} className={queue === q ? "on" : ""} onClick={() => setQueue(q)}>ArrayBlockingQueue({q})</button>)}
        <button className={queue === null ? "on" : ""} onClick={() => setQueue(null)}>LinkedBlockingQueue() không giới hạn</button>
      </div>
      <div className="chain">
        {out.map((o, i) => <span key={i} className={CLASS[o]} title={LABEL[o]}>{i + 1}</span>)}
      </div>
      <div className={`result ${count("reject") ? "warn" : "good"}`}>
        {running} chạy · {count("queue")} chờ · {count("reject")} reject
        <small>
          {queue === null
            ? `Queue không giới hạn: không bao giờ vượt core (${core} thread), không bao giờ reject, task dồn trong RAM.`
            : `Thứ tự bắt đầu: ${order.join(", ")}. Task tạo thread mới chạy ngay nên chen lên trước task đang chờ trong queue.`}
        </small>
      </div>
      <p className="muted">Ô xanh: thread core · tím: thread vượt core · mờ: chờ trong queue · đỏ: bị reject. Giả định mỗi task chạy lâu hơn cả vòng submit.</p>
    </div>
  );
}
