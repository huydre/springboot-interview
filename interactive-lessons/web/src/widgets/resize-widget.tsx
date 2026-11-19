import { useState } from "react";
import { tableSizeFor } from "./java-hash";

type Init = "default" | "capacity100" | "newHashMap";

const INIT: Record<Init, { label: string; capacity: number }> = {
  default: { label: "new HashMap<>()", capacity: 16 },
  capacity100: { label: "new HashMap<>(100)", capacity: tableSizeFor(100) },
  newHashMap: { label: "HashMap.newHashMap(100)", capacity: tableSizeFor(Math.ceil(100 / 0.75)) },
};

/** Replays HashMap's rule: after a put, size > capacity × 0.75 doubles the table. Matches JDK 21 measurements (100 puts: 4 / 1 / 0 resizes). */
function simulate(init: Init, n: number) {
  let capacity = INIT[init].capacity;
  const history = [capacity];
  for (let size = 1; size <= n; size++) {
    if (size > capacity * 0.75) { capacity *= 2; history.push(capacity); }
  }
  return { capacity, threshold: capacity * 0.75, resizes: history.length - 1, history };
}

export function ResizeWidget() {
  const [init, setInit] = useState<Init>("default");
  const [n, setN] = useState(13);
  const r = simulate(init, n);

  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(INIT) as Init[]).map((k) => <button key={k} className={init === k ? "on" : ""} onClick={() => setInit(k)}>{INIT[k].label}</button>)}
      </div>
      <label className="pick">
        <span>số phần tử: {n}</span>
        <input type="range" min={0} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Số phần tử" />
      </label>
      <div className="two">
        <div className={`result ${r.resizes ? "warn" : "good"}`}>
          capacity {n ? r.capacity : 0} · threshold {n ? r.threshold : "chưa có"}
          <small>{n ? `${r.resizes} lần resize: ${r.history.join(" → ")}` : "table chỉ được tạo ở lần put đầu tiên"}</small>
        </div>
        <div className="result">
          {init === "capacity100" ? "capacity 100 được làm tròn lên 128, nhưng threshold chỉ 96" : init === "newHashMap" ? "Java 19+: tự tính capacity đủ chứa 100 phần tử" : "16 × 0.75 = 12: phần tử thứ 13 gây resize"}
          <small>resize = cấp phát mảng mới gấp đôi và chuyển mọi node sang</small>
        </div>
      </div>
    </div>
  );
}
