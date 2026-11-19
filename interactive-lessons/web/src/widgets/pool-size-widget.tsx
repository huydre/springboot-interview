import { useState } from "react";

/** Brian Goetz's starting point: threads ≈ cores × (1 + wait / compute), capped in practice by what sits behind the pool. */
export function PoolSizeWidget() {
  const [cores, setCores] = useState(8);
  const [wait, setWait] = useState(200);
  const [cpu, setCpu] = useState(10);
  const [conns, setConns] = useState(10);
  const threads = Math.round(cores * (1 + wait / Math.max(cpu, 1)));
  const field = (label: string, v: number, set: (n: number) => void, lo: number, hi: number) => (
    <label className="actions">
      <span className="muted">{label}</span>
      <input className="text-input" type="number" min={lo} max={hi} value={v} onChange={(e) => set(Math.min(hi, Math.max(lo, Number(e.target.value) || lo)))} />
    </label>
  );
  const bound = threads > conns;
  return (
    <div className="widget">
      <div className="actions">
        {field("số core", cores, setCores, 1, 64)}
        {field("chờ I/O (ms)", wait, setWait, 0, 5000)}
        {field("xử lý CPU (ms)", cpu, setCpu, 1, 1000)}
        {field("connection DB", conns, setConns, 1, 500)}
      </div>
      <div className={`result ${bound ? "warn" : "good"}`}>
        threads ≈ {cores} × (1 + {wait} / {cpu}) = {threads}
        <small>
          {wait === 0
            ? "CPU-bound: khoảng bằng số core; thêm thread chỉ tốn context switch."
            : bound
              ? `Nếu mỗi task cần một connection DB thì chỉ ${conns} thread làm việc được cùng lúc, ${threads - conns} thread còn lại đứng chờ connection. Tài nguyên phía sau mới là giới hạn thật.`
              : "Đủ connection cho mọi thread. Đây chỉ là điểm xuất phát: load test rồi chỉnh."}
        </small>
      </div>
    </div>
  );
}
