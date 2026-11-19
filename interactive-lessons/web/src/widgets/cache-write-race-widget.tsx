import { useState } from "react";

type Mode = "set" | "delete" | "delete-first";

/** Interleavings from study note 03.10; each line is one step in time order. */
const MODES: Record<Mode, { label: string; steps: string[]; db: number; cache: string; ok: boolean; why: string }> = {
  set: {
    label: "ghi DB rồi SET cache",
    steps: ["A: UPDATE price = 100", "B: UPDATE price = 200", "B: SET cache = 200", "A: SET cache = 100"],
    db: 200,
    cache: "100",
    ok: false,
    why: "Hai request ghi đồng thời SET lệch thứ tự: cache sai tới hết TTL.",
  },
  delete: {
    label: "ghi DB rồi DEL cache",
    steps: ["A: UPDATE price = 100", "B: UPDATE price = 200", "B: DEL cache", "A: DEL cache", "lần đọc sau: miss, load 200 từ DB"],
    db: 200,
    cache: "200",
    ok: true,
    why: "Xoá là idempotent, thứ tự không quan trọng. Đây là cái @CacheEvict làm sau khi method chạy xong.",
  },
  "delete-first": {
    label: "DEL cache rồi mới ghi DB",
    steps: ["A: DEL cache", "C (đọc): miss, load 100 từ DB", "A: UPDATE price = 200", "C: SET cache = 100"],
    db: 200,
    cache: "100",
    ok: false,
    why: "Request đọc chen giữa hai bước nạp lại giá cũ. Delayed double delete (xoá lần nữa sau vài trăm ms) giảm được, nhưng TTL vẫn là lưới an toàn.",
  },
};

export function CacheWriteRaceWidget() {
  const [m, setM] = useState<Mode>("set");
  const c = MODES[m];
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(MODES) as Mode[]).map((k) => <button key={k} className={m === k ? "on" : ""} onClick={() => setM(k)}>{MODES[k].label}</button>)}
      </div>
      <ol className="log">
        {c.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <div className={`result ${c.ok ? "good" : "bad"}`}>
        DB = {c.db}, cache = {c.cache}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
