import { useMemo, useReducer, useState } from "react";
import "../styles/sim-widgets.css";
import { fnv1a, percentile, tickRng, usePlaying, useTicker } from "./sim-kit";

/**
 * Load balancer on a tick model (1 tick = 50 ms). A healthy server answers in 20 to 60 ms, a slow one in 300 to 600 ms,
 * and every open connection adds 1/8 more time (contention). A dead server refuses requests; the health check runs
 * every 2 ticks and takes a server out of the pool after N failures in a row. All draws come from a seeded PRNG.
 */
type Algo = "rr" | "least" | "hash";
type Mode = "ok" | "slow" | "down";
type Srv = { mode: Mode; fails: number; inPool: boolean; conns: number[]; served: number };
type State = { tick: number; servers: Srv[]; lat: number[]; errors: number; rr: number };

const TICK_MS = 50;
const SEED = 11;
const USERS = 500;
const VNODES = 40;
const WINDOW = 400;
const RING_KEYS = 1000;
const ALGOS: Record<Algo, string> = { rr: "Round robin", least: "Least connections", hash: "Consistent hashing" };
const MODES: Record<Mode, string> = { ok: "Khỏe", slow: "Chậm", down: "Chết" };

/** Hash ring with VNODES virtual nodes per server; returns a lookup from key to server index. */
function ring(ids: number[]) {
  const pts = ids.flatMap((s) => Array.from({ length: VNODES }, (_, v) => ({ h: fnv1a(`S${s + 1}#${v}`), s }))).sort((a, b) => a.h - b.h);
  return (key: string) => {
    if (!pts.length) return -1;
    const h = fnv1a(key);
    let lo = 0;
    let hi = pts.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid].h < h) lo = mid + 1; else hi = mid; }
    return pts[lo % pts.length].s;
  };
}

const srv = (): Srv => ({ mode: "ok", fails: 0, inPool: true, conns: [], served: 0 });
const fresh = (n: number): State => ({ tick: 0, servers: Array.from({ length: n }, srv), lat: [], errors: 0, rr: 0 });

type Action = { type: "tick"; algo: Algo; rate: number; failN: number } | { type: "mode"; i: number; mode: Mode } | { type: "reset"; n: number } | { type: "clear" };

function reducer(s: State, a: Action): State {
  if (a.type === "reset") return fresh(a.n);
  if (a.type === "clear") return { ...s, lat: [], errors: 0, servers: s.servers.map((x) => ({ ...x, served: 0 })) };
  if (a.type === "mode") return { ...s, servers: s.servers.map((x, i) => (i === a.i ? { ...x, mode: a.mode } : x)) };
  const r = tickRng(SEED, s.tick);
  const t = s.tick + 1;
  const servers = s.servers.map((x) => {
    const n = { ...x, conns: x.conns.filter((e) => e > t) };
    if (t % 2 === 0) {
      n.fails = x.mode === "down" ? x.fails + 1 : 0;
      n.inPool = x.mode === "down" ? n.fails < a.failN : true;
    }
    return n;
  });
  const pool = servers.flatMap((x, i) => (x.inPool ? [i] : []));
  const lookup = a.algo === "hash" ? ring(pool) : null;
  const lat = s.lat.slice();
  let { errors, rr } = s;
  for (let k = 0; k < a.rate; k++) {
    const key = `user-${Math.floor(r() * USERS)}`;
    const jitter = r();
    if (!pool.length) { errors++; continue; }
    let i: number;
    if (lookup) i = lookup(key);
    else if (a.algo === "rr") i = pool[rr++ % pool.length];
    else {
      const start = rr++ % pool.length;
      i = pool[start];
      for (let j = 0; j < pool.length; j++) { const c = pool[(start + j) % pool.length]; if (servers[c].conns.length < servers[i].conns.length) i = c; }
    }
    const x = servers[i];
    x.served++;
    if (x.mode === "down") { errors++; continue; }
    const ms = Math.round((x.mode === "slow" ? 300 + jitter * 300 : 20 + jitter * 40) * (1 + x.conns.length / 8));
    x.conns = [...x.conns, t + Math.ceil(ms / TICK_MS)];
    lat.push(ms);
  }
  return { tick: t, servers, lat: lat.slice(-WINDOW), errors, rr };
}

export function LbSimWidget() {
  const [count, setCount] = useState(4);
  const [algo, setAlgo] = useState<Algo>("rr");
  const [rate, setRate] = useState(6);
  const [failN, setFailN] = useState(3);
  const [key, setKey] = useState("user-42");
  const [s, dispatch] = useReducer(reducer, 4, fresh);
  const [playing, setPlaying] = usePlaying();
  const tick = () => dispatch({ type: "tick", algo, rate, failN });
  useTicker(playing, 400, tick);

  const p50 = percentile(s.lat, 50);
  const p99 = percentile(s.lat, 99);
  const ids = s.servers.map((_, i) => i);
  const downIdx = s.servers.findIndex((x) => x.mode === "down");
  const slowIdx = s.servers.findIndex((x) => x.mode === "slow");
  const removed = downIdx >= 0 ? downIdx : count - 1;

  const moves = useMemo(() => {
    const all = Array.from({ length: count }, (_, i) => i);
    const rest = all.filter((i) => i !== removed);
    const before = ring(all);
    const after = ring(rest);
    let ch = 0;
    let mod = 0;
    for (let k = 0; k < RING_KEYS; k++) {
      const key = `user-${k}`;
      if (before(key) !== after(key)) ch++;
      const h = fnv1a(key);
      if (all[h % all.length] !== rest[h % rest.length]) mod++;
    }
    return { ch: Math.round((ch / RING_KEYS) * 100), mod: Math.round((mod / RING_KEYS) * 100) };
  }, [count, removed]);

  const poolNow = ids.filter((i) => s.servers[i].inPool);
  const sticky = ring(poolNow)(key.trim());

  const say: { t: string; c?: "bad" | "good" }[] = [];
  if (downIdx >= 0) {
    const d = s.servers[downIdx];
    say.push(d.inPool
      ? { t: `S${downIdx + 1} đã chết nhưng health check mới fail ${d.fails}/${failN} lần nên LB vẫn gửi request tới nó: ${s.errors} lỗi.`, c: "bad" }
      : { t: `Health check fail ${failN} lần liên tiếp: S${downIdx + 1} bị loại khỏi pool, request chia cho ${poolNow.length} server còn lại.`, c: "good" });
  }
  if (slowIdx >= 0) {
    const n = s.servers[slowIdx];
    if (algo === "rr") say.push({ t: `Round robin vẫn chia đều cho S${slowIdx + 1} dù nó chậm: cứ ${poolNow.length} request có 1 request chậm nên p99 lên ${p99} ms.`, c: "bad" });
    if (algo === "least") say.push({ t: `Least connections thấy S${slowIdx + 1} đang giữ ${n.conns.length} kết nối nên gửi ít request tới nó hơn: p99 thấp hơn round robin.`, c: "good" });
    if (algo === "hash") say.push({ t: `Consistent hashing gắn cố định user vào server: user rơi vào S${slowIdx + 1} lần nào cũng chậm.`, c: "bad" });
    say.push({ t: "Health check chỉ hỏi sống hay chết, nên server chậm vẫn nằm trong pool." });
  }
  if (algo === "hash") say.push({ t: `Bỏ S${removed + 1}: ring chỉ dời ${moves.ch}% key (gần 1/${count}), còn hash % N dời ${moves.mod}% key vì N đổi làm gần như mọi phép chia lệch đi.` });
  if (!say.length) say.push({ t: "Mọi server khỏe, tải chia khá đều. Thử cho một server chậm hoặc chết.", c: "good" });

  const maxConns = Math.max(8, ...s.servers.map((x) => x.conns.length));

  return (
    <div className="widget sim">
      <div className="seg small" role="group" aria-label="Thuật toán cân bằng tải">
        {(Object.keys(ALGOS) as Algo[]).map((x) => (
          <button key={x} className={algo === x ? "on" : ""} aria-pressed={algo === x} onClick={() => { setAlgo(x); dispatch({ type: "clear" }); }}>{ALGOS[x]}</button>
        ))}
      </div>
      <div className="sim-row">
        <div className="sim-ctl">
          <small>Số server</small>
          <div className="seg small">
            {[3, 4, 5].map((n) => <button key={n} className={count === n ? "on" : ""} aria-pressed={count === n} onClick={() => { setCount(n); dispatch({ type: "reset", n }); }}>{n}</button>)}
          </div>
        </div>
        <div className="sim-ctl">
          <small>Request mỗi nhịp</small>
          <div className="seg small">
            {[3, 6, 10].map((n) => <button key={n} className={rate === n ? "on" : ""} aria-pressed={rate === n} onClick={() => setRate(n)}>{n}</button>)}
          </div>
        </div>
        <div className="sim-ctl">
          <small>Loại server sau bao nhiêu lần fail</small>
          <div className="seg small">
            {[1, 3, 5].map((n) => <button key={n} className={failN === n ? "on" : ""} aria-pressed={failN === n} onClick={() => setFailN(n)}>{n}</button>)}
          </div>
        </div>
      </div>
      <div className="sim-play">
        <button className="btn primary" onClick={() => setPlaying(!playing)}>{playing ? "Tạm dừng" : "Chạy"}</button>
        <button className="btn" onClick={tick} disabled={playing}>+1 nhịp</button>
        <button className="btn" onClick={() => dispatch({ type: "reset", n: count })}>Làm lại</button>
        <span className="sim-tick">nhịp {s.tick} · {s.tick * TICK_MS} ms</span>
      </div>

      <div className="sim-grid">
        {s.servers.map((x, i) => {
          const cls = x.mode === "down" ? "bad" : x.mode === "slow" ? "warn" : "good";
          return (
            <div key={i} className={`sim-card ${cls}${x.inPool ? "" : " idle"}`}>
              <b>S{i + 1} {x.inPool ? <span className="sim-badge good">trong pool</span> : <span className="sim-badge bad">bị loại</span>}</b>
              <small>{x.conns.length} kết nối đang mở</small>
              <div className="sim-meter" aria-hidden><i className={cls === "good" ? "" : cls} style={{ width: `${(x.conns.length / maxConns) * 100}%` }} /></div>
              <small>đã nhận {x.served} · fail {x.fails}/{failN}</small>
              <div className="seg small" role="group" aria-label={`Trạng thái S${i + 1}`}>
                {(Object.keys(MODES) as Mode[]).map((m) => (
                  <button key={m} className={x.mode === m ? "on" : ""} aria-pressed={x.mode === m} onClick={() => dispatch({ type: "mode", i, mode: m })}>{MODES[m]}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sim-grid">
        <div className="sim-card"><small>p50</small><b>{p50} ms</b></div>
        <div className={`sim-card ${p99 > 250 ? "bad" : "good"}`}><small>p99</small><b>{p99} ms</b></div>
        <div className={`sim-card ${s.errors ? "bad" : "good"}`}><small>Lỗi</small><b>{s.errors}</b></div>
      </div>
      <p className="muted">p50, p99 đo trên {WINDOW} request gần nhất. Đổi thuật toán sẽ xóa số đo để so sánh công bằng.</p>

      {algo === "hash" && (
        <div className="sim-key">
          <span className="muted">Key sticky:</span>
          <input className="text-input" aria-label="Key để tra trên ring" value={key} maxLength={24} onChange={(e) => setKey(e.target.value)} />
          <b>{key.trim() && sticky >= 0 ? `luôn vào S${sticky + 1}` : "không có server"}</b>
        </div>
      )}

      <ul className="sim-say" aria-live="polite">
        {say.map((l) => <li key={l.t} className={l.c}>{l.t}</li>)}
      </ul>
    </div>
  );
}
