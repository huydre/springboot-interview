import { useReducer, useState } from "react";
import "../styles/sim-widgets.css";
import { tickRng, usePlaying, useTicker } from "./sim-kit";

/**
 * One topic, one consumer group, ticked simulation. Keys go to partitions with Kafka's own rule for keyed records
 * (murmur2(keyBytes) & 0x7fffffff) % numPartitions, and partitions are split with RangeAssignor's arithmetic.
 * Each consumer handles NORMAL_CAP records per tick; the slow one handles one record every three ticks.
 */
const KEYS = ["user-1", "user-2", "user-3", "order-7", "order-9", "acc-42"];
const SEED = 7;
const SHOW = 10;
const NORMAL_CAP = 3;
const REBALANCE_TICKS = 2;
const MAX_CONSUMERS = 7;

/** Kafka's Utils.murmur2 on the UTF-8 bytes of the key. */
function murmur2(key: string) {
  const data = new TextEncoder().encode(key);
  const len = data.length;
  const m = 0x5bd1e995;
  let h = 0x9747b28c ^ len;
  const len4 = len >> 2;
  for (let i = 0; i < len4; i++) {
    const i4 = i * 4;
    let k = data[i4] | (data[i4 + 1] << 8) | (data[i4 + 2] << 16) | (data[i4 + 3] << 24);
    k = Math.imul(k, m);
    k ^= k >>> 24;
    k = Math.imul(k, m);
    h = Math.imul(h, m) ^ k;
  }
  const tail = len & ~3;
  const rest = len % 4;
  if (rest >= 3) h ^= data[tail + 2] << 16;
  if (rest >= 2) h ^= data[tail + 1] << 8;
  if (rest >= 1) h = Math.imul(h ^ data[tail], m);
  h ^= h >>> 13;
  h = Math.imul(h, m);
  h ^= h >>> 15;
  return h;
}

const partitionFor = (key: string, parts: number) => (murmur2(key) & 0x7fffffff) % parts;

/** RangeAssignor for one topic: the first (parts % consumers) members get one extra partition. */
function rangeAssign(parts: number, consumers: number) {
  const per = Math.floor(parts / consumers);
  const extra = parts % consumers;
  return Array.from({ length: consumers }, (_, c) => {
    const start = c * per + Math.min(c, extra);
    return Array.from({ length: per + (c < extra ? 1 : 0) }, (_, i) => start + i);
  });
}

type Msg = { off: number; key: string; t: number };
type State = {
  parts: number; consumers: number; rate: number; slow: boolean; tick: number; gen: number; pause: number;
  logs: Msg[][]; end: number[]; committed: number[]; last: { key: string; p: number; off: number } | null; sent: number;
};
type Action =
  | { type: "tick" } | { type: "send"; key: string } | { type: "parts"; n: number } | { type: "consumers"; n: number }
  | { type: "rate"; n: number } | { type: "slow" } | { type: "reset" };

const fresh = (parts: number, consumers = 2, rate = 2, slow = false): State => ({
  parts, consumers, rate, slow, tick: 0, gen: 1, pause: 0, sent: 0, last: null,
  logs: Array.from({ length: parts }, () => []), end: Array(parts).fill(0), committed: Array(parts).fill(0),
});

function append(s: State, key: string) {
  const p = partitionFor(key, s.parts);
  const off = s.end[p];
  s.logs[p] = [...s.logs[p], { off, key, t: s.tick }].slice(-SHOW);
  s.end[p] = off + 1;
  return { key, p, off };
}

function reducer(s: State, a: Action): State {
  const n: State = { ...s, logs: s.logs.slice(), end: s.end.slice(), committed: s.committed.slice() };
  switch (a.type) {
    case "send": n.last = append(n, a.key); n.sent++; return n;
    case "parts": return fresh(a.n, s.consumers, s.rate, s.slow);
    case "consumers": return { ...s, consumers: a.n, gen: s.gen + 1, pause: REBALANCE_TICKS };
    case "rate": return { ...s, rate: a.n };
    case "slow": return { ...s, slow: !s.slow };
    case "reset": return fresh(s.parts, s.consumers, s.rate, s.slow);
    case "tick": {
      const r = tickRng(SEED, s.tick);
      n.tick++;
      for (let i = 0; i < s.rate; i++) append(n, KEYS[Math.floor(r() * KEYS.length)]);
      if (n.pause > 0) { n.pause--; return n; }
      rangeAssign(s.parts, s.consumers).forEach((ps, c) => {
        let cap = s.slow && c === 0 ? (s.tick % 3 === 0 ? 1 : 0) : NORMAL_CAP;
        let moved = true;
        while (cap > 0 && moved) {
          moved = false;
          for (const p of ps) if (cap > 0 && n.committed[p] < n.end[p]) { n.committed[p]++; cap--; moved = true; }
        }
      });
      return n;
    }
  }
}

const short = (k: string) => k.replace(/^([a-z])[a-z]*-/i, "$1").slice(0, 4);

export function KafkaSimWidget() {
  const [s, dispatch] = useReducer(reducer, 4, (p) => fresh(p));
  const [playing, setPlaying] = usePlaying();
  const [custom, setCustom] = useState("user-1");
  useTicker(playing, 900, () => dispatch({ type: "tick" }));

  const asg = rangeAssign(s.parts, s.consumers);
  const owner = (p: number) => asg.findIndex((ps) => ps.includes(p));
  const lag = (p: number) => s.end[p] - s.committed[p];
  const totalLag = s.end.reduce((sum, e, p) => sum + e - s.committed[p], 0);
  const idle = asg.flatMap((ps, c) => (ps.length ? [] : [c + 1]));
  const slowParts = s.slow ? asg[0] : [];

  const say: { t: string; c?: "bad" | "good" }[] = [];
  if (s.pause) say.push({ t: `Đang rebalance (generation ${s.gen}): cả group dừng đọc, partition được chia lại. Ai nhận partition mới sẽ đọc tiếp từ committed offset nên không mất message.`, c: "bad" });
  for (const c of idle) say.push({ t: `Consumer ${c} đang rảnh vì chỉ có ${s.parts} partition: mỗi partition chỉ giao cho đúng 1 consumer trong group.` });
  if (s.last) say.push({ t: `Key "${s.last.key}" vào P${s.last.p} (murmur2(key) % ${s.parts} = ${s.last.p}). Gửi lại bao nhiêu lần cũng vào P${s.last.p}, nên thứ tự các message cùng key được giữ.` });
  if (s.slow && slowParts.some((p) => lag(p) > 3)) say.push({ t: `Consumer 1 chậm: lag ở ${slowParts.map((p) => `P${p}`).join(", ")} tăng dần. Consumer khác không đọc hộ được partition của nó, kể cả khi đang rảnh.`, c: "bad" });
  else if (!s.slow && totalLag > 4 * s.parts) {
    say.push({ t: s.consumers >= s.parts
      ? `Producer gửi nhanh hơn group xử lý và số consumer đã bằng số partition: muốn nhanh hơn phải tăng partition hoặc làm consumer xử lý nhanh hơn.`
      : `Producer gửi nhanh hơn group xử lý nên lag tăng. Thêm consumer (tối đa ${s.parts}) để chia partition.`, c: "bad" });
  }
  if (!say.length || (totalLag <= s.parts && !s.pause)) say.push({ t: "Group theo kịp producer: lag gần 0.", c: "good" });

  const setConsumers = (n: number) => dispatch({ type: "consumers", n: Math.min(MAX_CONSUMERS, Math.max(1, n)) });

  return (
    <div className="widget sim">
      <div className="sim-row">
        <div className="sim-ctl">
          <small>Số partition (đổi là tạo topic mới)</small>
          <div className="seg small">
            {[3, 4, 5, 6].map((p) => <button key={p} className={s.parts === p ? "on" : ""} aria-pressed={s.parts === p} onClick={() => dispatch({ type: "parts", n: p })}>{p}</button>)}
          </div>
        </div>
        <div className="sim-ctl">
          <small>Consumer trong group</small>
          <div className="sim-play">
            <button className="btn" aria-label="Bớt một consumer" disabled={s.consumers <= 1} onClick={() => setConsumers(s.consumers - 1)}>-</button>
            <b aria-live="polite">{s.consumers} consumer</b>
            <button className="btn" aria-label="Thêm một consumer" disabled={s.consumers >= MAX_CONSUMERS} onClick={() => setConsumers(s.consumers + 1)}>+</button>
          </div>
        </div>
        <div className="sim-ctl">
          <small>Producer gửi mỗi nhịp</small>
          <div className="seg small">
            {[1, 2, 3, 5].map((r) => <button key={r} className={s.rate === r ? "on" : ""} aria-pressed={s.rate === r} onClick={() => dispatch({ type: "rate", n: r })}>{r} msg</button>)}
          </div>
        </div>
      </div>

      <div className="sim-row">
        <div className="sim-play">
          <button className="btn primary" onClick={() => setPlaying(!playing)}>{playing ? "Tạm dừng" : "Chạy"}</button>
          <button className="btn" onClick={() => dispatch({ type: "tick" })} disabled={playing}>+1 nhịp</button>
          <button className="btn" onClick={() => dispatch({ type: "reset" })}>Làm lại</button>
          <button className={`btn${s.slow ? " danger" : ""}`} aria-pressed={s.slow} onClick={() => dispatch({ type: "slow" })}>{s.slow ? "Consumer 1 đang chậm" : "Cho consumer 1 chậm"}</button>
          <span className="sim-tick">nhịp {s.tick}</span>
        </div>
      </div>

      <div className="sim-key">
        <span className="muted">Gửi tay:</span>
        <div className="seg small">
          {KEYS.map((k) => <button key={k} onClick={() => dispatch({ type: "send", key: k })}>{k}</button>)}
        </div>
        <input className="text-input" aria-label="Key tự nhập" value={custom} maxLength={24} onChange={(e) => setCustom(e.target.value)} />
        <button className="btn" disabled={!custom.trim()} onClick={() => dispatch({ type: "send", key: custom.trim() })}>Gửi key này</button>
        <button className="btn" onClick={() => dispatch({ type: "send", key: KEYS[Math.floor(tickRng(SEED + 1, s.sent)() * KEYS.length)] })}>Key ngẫu nhiên</button>
      </div>

      <div className="sim-lanes" aria-label="Các partition của topic">
        {s.logs.map((log, p) => (
          <div key={p} className="sim-lane">
            <b>P{p}</b>
            <div className="sim-cells">
              {log.map((m) => (
                <span key={m.off} title={`offset ${m.off}, key ${m.key}`}
                  className={[m.off < s.committed[p] ? "done" : "", m.t === s.tick - 1 || m.t === s.tick ? "new" : "", s.last?.key === m.key ? "hl" : ""].join(" ")}>
                  {short(m.key)}
                </span>
              ))}
            </div>
            <small className={lag(p) > 6 ? "bad" : ""}>
              {owner(p) >= 0 && !s.pause ? `C${owner(p) + 1}` : "chờ"} · commit {s.committed[p]} · lag {lag(p)}
            </small>
          </div>
        ))}
      </div>

      <div className="sim-grid">
        {asg.map((ps, c) => {
          const slow = s.slow && c === 0;
          const myLag = ps.reduce((sum, p) => sum + lag(p), 0);
          return (
            <div key={`${c}-${s.gen}`} className={`sim-card ${s.pause ? "flash" : ""} ${ps.length === 0 ? "idle" : slow ? "warn" : "good"}`}>
              <b>Consumer {c + 1}</b>
              <small>{ps.length ? `Partition: ${ps.map((p) => `P${p}`).join(", ")}` : "Không có partition"}</small>
              <span>
                {ps.length === 0 ? <span className="sim-badge">rảnh</span> : slow ? <span className="sim-badge warn">chậm</span> : <span className="sim-badge good">đang đọc</span>}
                {ps.length > 0 && <small> lag {myLag}</small>}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="sim-say" aria-live="polite">
        {say.map((l) => <li key={l.t} className={l.c}>{l.t}</li>)}
      </ul>
      <p className="muted">Ô xanh: đã xử lý và commit. Viền xanh dương: cùng key với message vừa gửi tay. Chia partition theo RangeAssignor, generation tăng mỗi lần rebalance.</p>
    </div>
  );
}
