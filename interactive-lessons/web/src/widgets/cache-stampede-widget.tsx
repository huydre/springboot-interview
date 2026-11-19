import { useState } from "react";

/** 50 threads hit one missing key with a 200 ms loader, real Redis 7 via Testcontainers (study note 03.10). */
const CASES: { label: string; loads: number; total?: number; why: string }[] = [
  { label: "@Cacheable thường", loads: 50, why: "Cả 50 request cùng miss và cùng đọc DB." },
  {
    label: "@Cacheable(sync = true), RedisCacheManager mặc định",
    loads: 50,
    why: "Bất ngờ khi đo: sync = true không chặn được với cache writer mặc định (non-locking) của Boot.",
  },
  { label: "cache.get(key, loader), writer non-locking", loads: 50, total: 1040, why: "Như trên: mỗi request tự load." },
  {
    label: "cache.get(key, loader), lockingRedisCacheWriter",
    loads: 1,
    total: 3090,
    why: "Chỉ 1 lần load nhưng tổng thời gian lâu hơn vì các request khác chờ lock rồi thử lại.",
  },
];

export function CacheStampedeWidget() {
  const [i, setI] = useState(1);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="bars">
        <div>Số lần load DB cho 50 request đồng thời: {c.loads}{c.total && ` · tổng ${c.total} ms`}<i className={c.loads > 1 ? "bad" : "good"} style={{ width: `${(c.loads / 50) * 100}%` }} /></div>
      </div>
      <div className={`result ${c.loads > 1 ? "bad" : "good"}`}>
        {c.loads > 1 ? "Stampede" : "Single-flight"}
        <small>
          {c.why} Với Caffeine (local), sync = true chặn được theo từng key trong một JVM. Với Redis nhiều instance, tự làm lock theo key (SET lock:product:42 token NX PX 3000 hoặc Redisson) hoặc refresh key nóng trước khi hết hạn.
        </small>
      </div>
    </div>
  );
}
