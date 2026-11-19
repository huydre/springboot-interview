import { useState } from "react";

const MAX = 3;

/**
 * LinkedHashMap with accessOrder = true + removeEldestEntry(size() > 3). get() and put() of an existing key move it
 * to the end (newest); a put that exceeds 3 drops the first (eldest). JDK 21: [a,b,c] → get(a) [b,c,a] → put(d) [c,a,d].
 */
export function LruCacheWidget() {
  const [keys, setKeys] = useState<string[]>([]);
  const [log, setLog] = useState<{ text: string; kind: "ok" | "err" }[]>([]);
  const push = (text: string, kind: "ok" | "err" = "ok") => setLog((l) => [{ text, kind }, ...l].slice(0, 5));

  const touch = (k: string) => [...keys.filter((x) => x !== k), k];
  const get = (k: string) => {
    if (!keys.includes(k)) { push(`get("${k}") → null: không có trong cache`, "err"); return; }
    setKeys(touch(k));
    push(`get("${k}") → "${k}" thành mới nhất`);
  };
  const put = (k: string) => {
    const next = touch(k);
    if (next.length > MAX) {
      push(`put("${k}") → vượt ${MAX}, loại "${next[0]}" (lâu không dùng nhất)`, "err");
      setKeys(next.slice(1));
    } else {
      setKeys(next);
      push(`put("${k}")`);
    }
  };

  return (
    <div className="widget">
      <div className="actions">
        {["a", "b", "c", "d", "e"].map((k) => <button key={`p${k}`} className="btn" onClick={() => put(k)}>put("{k}")</button>)}
      </div>
      <div className="actions">
        {["a", "b", "c", "d", "e"].map((k) => <button key={`g${k}`} className="btn ghost" onClick={() => get(k)}>get("{k}")</button>)}
        <button className="btn ghost" onClick={() => { setKeys([]); setLog([]); }}>Đặt lại</button>
      </div>
      <div className="chain">
        <small className="muted">cũ nhất →</small>
        {keys.map((k) => <span key={k}>{k}</span>)}
        <small className="muted">← mới nhất</small>
      </div>
      <ul className="log">
        {log.length === 0 && <li className="muted">Thử: put a, b, c → get a → put d. Phần tử nào bị loại?</li>}
        {log.map((l, i) => <li key={i} className={l.kind}>{l.text}</li>)}
      </ul>
    </div>
  );
}
