import { useState } from "react";
import { bucketIndex, stringHash } from "./java-hash";

const CAPACITY = 16;
const KEYS = ["hello", "grape", "apple", "kiwi", "lemon"];
type Entry = { key: string; value: number };

/** put() step by step on a 16-bucket table: empty bucket, collision (append to tail), or same key (overwrite). */
export function HashMapPutWidget() {
  const [table, setTable] = useState<Entry[][]>(() => Array.from({ length: CAPACITY }, () => []));
  const [next, setNext] = useState(1);
  const [log, setLog] = useState<{ text: string; kind: "ok" | "err" }[]>([]);

  const put = (key: string) => {
    const i = bucketIndex(stringHash(key), CAPACITY);
    const chain = table[i];
    const existing = chain.find((e) => e.key === key);
    const value = next;
    setNext((n) => n + 1);
    let text: string;
    if (existing) {
      text = `put("${key}", ${value}) → ${existing.value}: trùng key ở bucket ${i}, ghi đè value`;
      setTable((t) => t.map((c, j) => (j === i ? c.map((e) => (e.key === key ? { key, value } : e)) : c)));
    } else {
      text = chain.length
        ? `put("${key}", ${value}) → null: bucket ${i} đã có ${chain.length} node, so hash rồi equals, không trùng → nối vào cuối`
        : `put("${key}", ${value}) → null: bucket ${i} rỗng, đặt node mới`;
      setTable((t) => t.map((c, j) => (j === i ? [...c, { key, value }] : c)));
    }
    setLog((l) => [{ text, kind: "ok" as const }, ...l].slice(0, 5));
  };

  const reset = () => { setTable(Array.from({ length: CAPACITY }, () => [])); setNext(1); setLog([]); };
  const size = table.reduce((n, c) => n + c.length, 0);

  return (
    <div className="widget">
      <div className="actions">
        {KEYS.map((k) => <button key={k} className="btn" onClick={() => put(k)}>put("{k}")</button>)}
        <button className="btn ghost" onClick={reset}>Đặt lại</button>
        <span className="score">size() = <b>{size}</b></span>
      </div>
      <div className="buckets">
        {table.map((chain, i) => (
          <div key={i} className={`bucket ${chain.length ? "filled" : ""}`}>
            <small>{i}</small>
            {chain.map((e) => <span key={e.key}>{e.key.slice(0, 5)}={e.value}</span>)}
          </div>
        ))}
      </div>
      <ul className="log">
        {log.length === 0 && <li className="muted">Thử put("hello") rồi put("grape"): cả hai rơi vào bucket 11. Put "hello" lần nữa để thấy giá trị trả về.</li>}
        {log.map((l, i) => <li key={i} className={l.kind}>{l.text}</li>)}
      </ul>
    </div>
  );
}
