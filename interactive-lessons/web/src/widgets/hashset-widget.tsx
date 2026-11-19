import { useState } from "react";
import { bucketIndex, stringHash } from "./java-hash";

const CAPACITY = 16; // default HashSet capacity; enough for this demo without resizing

/** Objects.hash(email) = 31 * 1 + email.hashCode(). */
const userHash = (email: string) => (31 + stringHash(email)) | 0;
const bucketOf = (h: number) => bucketIndex(h, CAPACITY);

/** Default Object.hashCode() differs per object; a fixed sequence keeps the demo repeatable. */
const IDENTITY_BUCKETS = [1, 3, 9, 6, 12, 4, 14, 7];

type Entry = { id: number; email: string };
type Mode = "equals-only" | "both";

/** HashSet with a User keyed by email: forget hashCode() and equal users land in different buckets. */
export function HashSetWidget() {
  const [mode, setMode] = useState<Mode>("equals-only");
  const [buckets, setBuckets] = useState<Entry[][]>(() => Array.from({ length: CAPACITY }, () => []));
  const [nextId, setNextId] = useState(0);
  const [log, setLog] = useState<{ text: string; kind: "ok" | "err" }[]>([]);

  const push = (text: string, kind: "ok" | "err") => setLog((l) => [{ text, kind }, ...l].slice(0, 5));
  const reset = (m: Mode = mode) => {
    setMode(m);
    setBuckets(Array.from({ length: CAPACITY }, () => []));
    setNextId(0);
    setLog([]);
  };
  const bucketFor = (email: string, id: number) =>
    mode === "both" ? bucketOf(userHash(email)) : IDENTITY_BUCKETS[id % IDENTITY_BUCKETS.length];

  const add = (email: string) => {
    const b = bucketFor(email, nextId);
    setNextId((n) => n + 1);
    if (buckets[b].some((e) => e.email === email)) {
      push(`add(new User("${email}")) → false: bucket ${b} đã có user bằng equals`, "ok");
      return;
    }
    setBuckets((all) => all.map((list, i) => (i === b ? [...list, { id: nextId, email }] : list)));
    const dup = buckets.some((list) => list.some((e) => e.email === email));
    push(`add(new User("${email}")) → true, vào bucket ${b}${dup ? ": trùng lặp!" : ""}`, dup ? "err" : "ok");
  };

  const contains = (email: string) => {
    const b = bucketFor(email, nextId);
    setNextId((n) => n + 1);
    const found = buckets[b].some((e) => e.email === email);
    const exists = buckets.some((list) => list.some((e) => e.email === email));
    push(`contains(new User("${email}")) → ${found}: tìm ở bucket ${b}${!found && exists ? ", nhưng user nằm ở bucket khác" : ""}`,
      found === exists ? "ok" : "err");
  };

  const size = buckets.reduce((n, list) => n + list.length, 0);
  return (
    <div className="widget">
      <div className="seg">
        <button className={mode === "equals-only" ? "on" : ""} onClick={() => reset("equals-only")}>chỉ override equals</button>
        <button className={mode === "both" ? "on" : ""} onClick={() => reset("both")}>equals + hashCode</button>
      </div>
      <div className="actions">
        <button className="btn" onClick={() => add("an@x.com")}>add(an@x.com)</button>
        <button className="btn" onClick={() => add("bo@x.com")}>add(bo@x.com)</button>
        <button className="btn" onClick={() => contains("an@x.com")}>contains(an@x.com)</button>
        <button className="btn ghost" onClick={() => reset()}>Đặt lại</button>
        <span className="score">size() = <b>{size}</b></span>
      </div>
      <div className="buckets">
        {buckets.map((list, i) => (
          <div key={i} className={`bucket ${list.length ? "filled" : ""}`}>
            <small>{i}</small>
            {list.map((e) => <span key={e.id}>{e.email.slice(0, 2)}</span>)}
          </div>
        ))}
      </div>
      <ul className="log">
        {log.length === 0 && <li className="muted">Thêm an@x.com hai lần ở mỗi chế độ và so sánh size()…</li>}
        {log.map((l, i) => <li key={i} className={l.kind}>{l.text}</li>)}
      </ul>
    </div>
  );
}
