import { useState } from "react";

type Step = { label: string; run: (s: State) => State };
type State = { loads: number; price: number; redis: Record<string, string>; log: string[] };

const START: State = { loads: 0, price: 100, redis: {}, log: [] };

/** Follows the run against real Redis in study note 03.10: hits skip the DB, @CacheEvict empties the key, this.getProduct() and exceptions skip the cache. */
const get = (via: "proxy" | "this") => (s: State): State => {
  if (via === "proxy" && s.redis["product::1"]) return { ...s, log: [...s.log, `getProduct(1): hit, DB vẫn ${s.loads} lần`] };
  const loads = s.loads + 1;
  const redis = via === "proxy" ? { ...s.redis, "product::1": `{"id":1,"price":${s.price}.00}` } : s.redis;
  const note = via === "this" ? "this.getProduct(1): không qua proxy, đọc DB dù key đang có" : "getProduct(1): miss, đọc DB, SET kèm TTL 600 s";
  return { ...s, loads, redis, log: [...s.log, `${note} → DB ${loads} lần`] };
};

const STEPS: Step[] = [
  { label: "getProduct(1)", run: get("proxy") },
  {
    label: "updatePrice(1, 90)",
    run: (s) => {
      const redis = { ...s.redis };
      delete redis["product::1"];
      return { ...s, price: 90, redis, log: [...s.log, "updatePrice: UPDATE DB rồi @CacheEvict xoá product::1"] };
    },
  },
  { label: "getViaThis(1)", run: get("this") },
  {
    label: "getProduct(999)",
    run: (s) => ({ ...s, loads: s.loads + 1, log: [...s.log, `getProduct(999): NotFoundException, không cache gì → DB ${s.loads + 1} lần`] }),
  },
];

export function CacheAsideWidget() {
  const [s, setS] = useState<State>(START);
  const keys = Object.entries(s.redis);
  return (
    <div className="widget">
      <div className="seg small">
        {STEPS.map((st) => <button key={st.label} onClick={() => setS(st.run)}>{st.label}</button>)}
        <button onClick={() => setS(START)}>làm lại</button>
      </div>
      <div className="two">
        <ul className="log">
          {s.log.length === 0 && <li>Gọi getProduct(1) vài lần, rồi updatePrice, rồi thử hai nút cuối.</li>}
          {s.log.map((l, n) => <li key={n} className={l.includes("hit") ? "ok" : l.includes("không") ? "err" : ""}>{l}</li>)}
        </ul>
        <pre className="code">{`Redis:\n${keys.length ? keys.map(([k, v]) => `${k} = ${v}`).join("\n") : "(rỗng)"}\n\nSố lần đọc DB: ${s.loads}`}</pre>
      </div>
      <p className="muted">
        getViaThis gọi this.getProduct() nên đi thẳng object thật như @Transactional. id 999 không tồn tại thì mỗi lần đều đâm vào DB: đó là cache penetration.
      </p>
    </div>
  );
}
