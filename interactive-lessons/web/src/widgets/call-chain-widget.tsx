import { useState } from "react";

type Mode = "seq" | "par" | "event";
type Dep = { name: string; job: string; ms: number; needed: boolean };

// Illustrative latencies for one "place order" request; the arithmetic (sum, max, product) is the point, not the numbers.
const OWN_MS = 30;
const DEPS: Dep[] = [
  { name: "user-service", job: "lấy địa chỉ giao hàng", ms: 40, needed: true },
  { name: "inventory-service", job: "kiểm tra và giữ kho", ms: 60, needed: true },
  { name: "pricing-service", job: "tính giá và khuyến mãi", ms: 50, needed: true },
  { name: "email-service", job: "gửi email xác nhận", ms: 250, needed: false },
  { name: "loyalty-service", job: "cộng điểm thưởng", ms: 40, needed: false },
];
const LABEL: Record<Mode, string> = { seq: "nối tiếp", par: "song song", event: "event" };
const MINUTES_PER_MONTH = 30 * 24 * 60;

/** Order-service's dependencies: sequential calls add latency, parallel calls cost the slowest one, and every synchronous call multiplies availability. */
export function CallChainWidget() {
  const [modes, setModes] = useState<Mode[]>(DEPS.map(() => "seq"));
  const [avail, setAvail] = useState(99.9);
  const sync = DEPS.filter((_, i) => modes[i] !== "event");
  const seqMs = DEPS.filter((_, i) => modes[i] === "seq").reduce((n, d) => n + d.ms, 0);
  const parMs = Math.max(0, ...DEPS.filter((_, i) => modes[i] === "par").map((d) => d.ms));
  const latency = OWN_MS + seqMs + parMs;
  const a = (avail / 100) ** (sync.length + 1);
  const down = (1 - a) * MINUTES_PER_MONTH;
  const neededAsEvent = DEPS.filter((d, i) => d.needed && modes[i] === "event");
  const optionalSync = DEPS.filter((d, i) => !d.needed && modes[i] !== "event");
  const set = (i: number, m: Mode) => setModes((s) => s.map((x, n) => (n === i ? m : x)));
  return (
    <div className="widget">
      <div className="pick">
        <span>Mỗi service sẵn sàng: {avail.toFixed(2)}%</span>
        <input type="range" min={99} max={99.99} step={0.01} value={avail} onChange={(e) => setAvail(+e.target.value)} />
      </div>
      <ul className="log">
        {DEPS.map((d, i) => (
          <li key={d.name}>
            {d.name} <small>({d.job}, {d.ms} ms)</small>{" "}
            <span className="seg small">
              {(["seq", "par", "event"] as Mode[]).map((m) => (
                <button key={m} className={modes[i] === m ? "on" : ""} onClick={() => set(i, m)}>{LABEL[m]}</button>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <div className={`result ${neededAsEvent.length ? "bad" : optionalSync.length ? "warn" : "good"}`}>
        Độ trễ ≈ {latency} ms · sẵn sàng ≈ {(a * 100).toFixed(2)}% · khoảng {Math.round(down)} phút lỗi mỗi tháng
        <small>
          {OWN_MS} ms của order-service + tổng các lời gọi nối tiếp ({seqMs} ms) + lời gọi song song chậm nhất ({parMs} ms).
          Độ sẵn sàng là tích của {sync.length + 1} service đồng bộ (kể cả order-service).{" "}
          {neededAsEvent.length
            ? `${neededAsEvent.map((d) => d.name).join(", ")} phải có kết quả trước khi trả lời người dùng, không đẩy sang event được.`
            : optionalSync.length
              ? `${optionalSync.map((d) => d.name).join(", ")} không ảnh hưởng câu trả lời: đẩy sang event (qua outbox) để bớt độ trễ và bớt điểm hỏng.`
              : "Hợp lý: chỉ gọi đồng bộ thứ cần cho câu trả lời, phần còn lại đi qua event và chấp nhận trễ vài giây."}
        </small>
      </div>
    </div>
  );
}
