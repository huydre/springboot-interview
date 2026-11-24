import { useMemo, useState } from "react";
import "../styles/sim-widgets.css";
import { reducedMotion, tickRng, usePlaying, useTicker } from "./sim-kit";

/**
 * Cache stampede on a tick model. Every key is cached at tick 0 with TTL ticks to live; a miss costs one DB query that
 * takes LOAD ticks before the value is back in cache. The whole run is computed up front from a seed, the timer only
 * moves the cursor, so the same settings always draw the same chart.
 */
type Strategy = "none" | "mutex" | "jitter" | "refresh";
type Point = { req: number; hits: number; db: number; wait: number };

const TICKS = 120;
const TTL = 30;
const LOAD = 4;
const JITTER = 15;
const EARLY = 6;
const DB_CAP = 25;
const SEED = 42;

const NAMES: Record<Strategy, string> = {
  none: "Không làm gì",
  mutex: "Mutex / single-flight",
  jitter: "TTL jitter",
  refresh: "Refresh sớm",
};

function simulate(strategy: Strategy, rate: number, keys: number): Point[] {
  const ttl = (k: number, t: number) => TTL + (strategy === "jitter" ? Math.floor(tickRng(SEED + k, t)() * JITTER) : 0);
  const exp = Array.from({ length: keys }, (_, k) => ttl(k, 0));
  const loading = Array<boolean>(keys).fill(false);
  const done: number[][] = Array.from({ length: TICKS + LOAD + 1 }, () => []);
  const locked = strategy === "mutex" || strategy === "refresh";
  const out: Point[] = [];
  for (let t = 0; t < TICKS; t++) {
    for (const k of done[t]) { exp[k] = Math.max(exp[k], t + ttl(k, t)); loading[k] = false; }
    const r = tickRng(SEED, t);
    const req = Math.round(rate * (0.8 + 0.4 * r()));
    const p: Point = { req, hits: 0, db: 0, wait: 0 };
    const load = (k: number) => { p.db++; loading[k] = true; done[t + LOAD].push(k); };
    for (let i = 0; i < req; i++) {
      const k = Math.floor(r() * keys);
      if (t < exp[k]) {
        p.hits++;
        if (strategy === "refresh" && exp[k] - t <= EARLY && !loading[k]) load(k);
      } else if (locked && loading[k]) p.wait++;
      else load(k);
    }
    out.push(p);
  }
  return out;
}

function summary(pts: Point[]) {
  const req = pts.reduce((s, p) => s + p.req, 0);
  const hits = pts.reduce((s, p) => s + p.hits, 0);
  return {
    db: pts.reduce((s, p) => s + p.db, 0),
    peak: pts.reduce((m, p) => Math.max(m, p.db), 0),
    peakAt: pts.findIndex((p) => p.db === pts.reduce((m, q) => Math.max(m, q.db), 0)),
    wait: pts.reduce((m, p) => Math.max(m, p.wait), 0),
    hitRate: req ? Math.round((hits / req) * 1000) / 10 : 100,
  };
}

const W = 6;
const H = 150;

export function StampedeSimWidget() {
  const [strategy, setStrategy] = useState<Strategy>("none");
  const [rate, setRate] = useState(30);
  const [keys, setKeys] = useState(1);
  const [cur, setCur] = useState(() => (reducedMotion() ? TICKS : 0));
  const [playing, setPlaying] = usePlaying();

  const runs = useMemo(() => {
    const all = {} as Record<Strategy, Point[]>;
    for (const s of Object.keys(NAMES) as Strategy[]) all[s] = simulate(s, rate, keys);
    return all;
  }, [rate, keys]);
  const pts = runs[strategy];
  const shown = pts.slice(0, cur);
  const sum = summary(pts);
  const live = summary(shown.length ? shown : pts.slice(0, 1));
  const maxY = Math.max(DB_CAP * 1.4, ...(Object.values(runs).map((r) => summary(r).peak)));
  const y = (v: number) => H - (v / maxY) * (H - 8);

  useTicker(playing && cur < TICKS, 90, () => {
    const next = Math.min(TICKS, cur + 2);
    setCur(next);
    if (next >= TICKS) setPlaying(false);
  });

  const restart = () => { const rm = reducedMotion(); setCur(rm ? TICKS : 0); setPlaying(!rm); };
  const change = (fn: () => void) => () => { fn(); restart(); };

  const say: { t: string; c?: "bad" | "good" }[] = [];
  const over = sum.peak > DB_CAP;
  if (strategy === "none") {
    say.push({ t: `Nhịp ${sum.peakAt}: key hết hạn, trong ${LOAD} nhịp chờ load mọi request đều miss và đều query DB, đỉnh ${sum.peak} query/nhịp.`, c: over ? "bad" : undefined });
    if (over) say.push({ t: `DB chỉ chịu khoảng ${DB_CAP} query/nhịp nên bị quá tải. Đây là cache stampede (thundering herd).`, c: "bad" });
  }
  if (strategy === "mutex") {
    say.push({ t: `Mỗi key chỉ có 1 request giữ lock (SET lock NX PX) và query DB. Tối đa ${sum.wait} request trong một nhịp phải chờ lock rồi đọc lại cache.`, c: "good" });
    say.push({ t: "Đổi lại: request chờ bị chậm thêm đúng thời gian load, và lock phải có hạn để không kẹt khi instance giữ lock chết." });
  }
  if (strategy === "jitter") {
    say.push(keys === 1
      ? { t: "Chỉ có 1 key nên jitter gần như không giúp: key vẫn hết hạn và vẫn stampede. Jitter dành cho nhiều key được set cùng lúc.", c: "bad" }
      : { t: `TTL mỗi key cộng thêm 0 đến ${JITTER} nhịp ngẫu nhiên nên ${keys} key hết hạn rải rác thay vì cùng lúc: đỉnh DB thấp hơn hẳn.`, c: "good" });
    say.push({ t: "Mỗi key vẫn có thể stampede nhỏ khi hết hạn, nên thực tế hay dùng jitter cùng với lock." });
  }
  if (strategy === "refresh") {
    say.push({ t: `Khi TTL còn từ ${EARLY} nhịp trở xuống, request đầu tiên kích hoạt load lại (có lock). Key không kịp hết hạn nên hit rate ${sum.hitRate}%.`, c: "good" });
    say.push({ t: "Chỉ hợp với key nóng có traffic đều. Key ít người đọc vẫn có thể hết hạn và quay về cần lock." });
  }

  return (
    <div className="widget sim">
      <div className="seg small" role="group" aria-label="Chiến lược chống stampede">
        {(Object.keys(NAMES) as Strategy[]).map((s) => (
          <button key={s} className={strategy === s ? "on" : ""} aria-pressed={strategy === s} onClick={change(() => setStrategy(s))}>{NAMES[s]}</button>
        ))}
      </div>
      <div className="sim-row">
        <label className="sim-ctl">
          <small>Request mỗi nhịp: {rate}</small>
          <input type="range" min={5} max={80} step={5} value={rate} onChange={(e) => { setRate(Number(e.target.value)); restart(); }} />
        </label>
        <div className="sim-ctl">
          <small>Số key</small>
          <div className="seg small">
            <button className={keys === 1 ? "on" : ""} aria-pressed={keys === 1} onClick={change(() => setKeys(1))}>1 key nóng</button>
            <button className={keys === 20 ? "on" : ""} aria-pressed={keys === 20} onClick={change(() => setKeys(20))}>20 key set cùng lúc</button>
          </div>
        </div>
        <div className="sim-play">
          <button className="btn primary" onClick={() => (cur >= TICKS ? restart() : setPlaying(!playing))}>{cur >= TICKS ? "Chạy lại" : playing ? "Tạm dừng" : "Chạy"}</button>
          <button className="btn" onClick={() => setCur(TICKS)} disabled={cur >= TICKS}>Xem hết</button>
          <span className="sim-tick">nhịp {cur}/{TICKS}</span>
        </div>
      </div>

      <svg className="sim-chart" viewBox={`0 0 ${TICKS * W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={`Query DB mỗi nhịp, đỉnh ${sum.peak}, hit rate ${sum.hitRate}%`}>
        {shown.map((p, t) => p.db > 0 && (
          <rect key={t} className={`bar${p.db > DB_CAP ? " over" : ""}`} x={t * W + 1} y={y(p.db)} width={W - 2} height={H - y(p.db)} />
        ))}
        <line className="cap" x1={0} x2={TICKS * W} y1={y(DB_CAP)} y2={y(DB_CAP)} vectorEffect="non-scaling-stroke" />
        {shown.length > 1 && (
          <polyline className="hit" vectorEffect="non-scaling-stroke"
            points={shown.map((p, t) => `${t * W + W / 2},${4 + (1 - (p.req ? p.hits / p.req : 1)) * (H - 8)}`).join(" ")} />
        )}
        {cur < TICKS && <line className="cursor" x1={cur * W} x2={cur * W} y1={0} y2={H} vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="sim-legend">
        <span><i style={{ background: "var(--blue)" }} />query DB mỗi nhịp</span>
        <span><i style={{ background: "var(--red)" }} />vượt sức DB ({DB_CAP})</span>
        <span><i style={{ background: "var(--green)" }} />hit rate (trên cùng = 100%)</span>
        <span>TTL {TTL} nhịp, load DB mất {LOAD} nhịp</span>
      </div>

      <div className="sim-grid">
        <div className="sim-card"><small>Query DB tới giờ</small><b>{shown.reduce((s, p) => s + p.db, 0)}</b></div>
        <div className={`sim-card ${live.peak > DB_CAP ? "bad" : "good"}`}><small>Đỉnh mỗi nhịp</small><b>{live.peak}</b></div>
        <div className={`sim-card ${live.hitRate < 90 ? "warn" : "good"}`}><small>Hit rate</small><b>{live.hitRate}%</b></div>
      </div>

      <div className="sim-table-wrap">
        <table className="sim-table">
          <thead><tr><th>Chiến lược</th><th>Query DB</th><th>Đỉnh/nhịp</th><th>Hit rate</th></tr></thead>
          <tbody>
            {(Object.keys(NAMES) as Strategy[]).map((s) => {
              const x = summary(runs[s]);
              return <tr key={s} className={s === strategy ? "on" : ""}><td>{NAMES[s]}</td><td>{x.db}</td><td>{x.peak}</td><td>{x.hitRate}%</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <ul className="sim-say" aria-live="polite">
        {say.map((l) => <li key={l.t} className={l.c}>{l.t}</li>)}
      </ul>
    </div>
  );
}
