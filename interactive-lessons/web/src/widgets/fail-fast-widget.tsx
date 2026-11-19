import { useState } from "react";

/**
 * Replays ArrayList's iterator exactly: hasNext() is cursor != size, next() first checks modCount,
 * and list.remove(o) bumps modCount and shrinks size. Outcomes match JDK 21 for every target in [a,b,c] and [a,b,c,d].
 */
function run(base: string[], target: string) {
  const list = [...base];
  let modCount = 0;
  const expected = 0;
  let cursor = 0;
  const visited: string[] = [];
  const steps: string[] = [];
  while (cursor !== list.length) {
    if (modCount !== expected) {
      steps.push(`next(): modCount ${modCount} ≠ ${expected} → ConcurrentModificationException`);
      return { list, visited, steps, error: true };
    }
    const s = list[cursor++];
    visited.push(s);
    steps.push(`next() → "${s}" (cursor = ${cursor}, size = ${list.length})`);
    if (s === target) {
      list.splice(list.indexOf(s), 1);
      modCount++;
      steps.push(`list.remove("${s}") → size = ${list.length}, modCount = ${modCount}`);
    }
  }
  steps.push(`hasNext(): cursor ${cursor} == size ${list.length} → vòng lặp dừng`);
  return { list, visited, steps, error: false };
}

export function FailFastWidget() {
  const [size, setSize] = useState<3 | 4>(3);
  const base = ["a", "b", "c", "d"].slice(0, size);
  const [target, setTarget] = useState("b");
  const t = base.includes(target) ? target : base[0];
  const r = run(base, t);
  const skipped = base.filter((x) => x !== t && !r.visited.includes(x));

  return (
    <div className="widget">
      <div className="actions">
        <div className="seg small">
          {([3, 4] as const).map((n) => <button key={n} className={size === n ? "on" : ""} onClick={() => setSize(n)}>{n} phần tử</button>)}
        </div>
        <div className="seg small">
          {base.map((x) => <button key={x} className={t === x ? "on" : ""} onClick={() => setTarget(x)}>xoá "{x}"</button>)}
        </div>
      </div>
      <div className="two">
        <pre className="code">{`List<String> list = new ArrayList<>(List.of(${base.map((x) => `"${x}"`).join(", ")}));
for (String s : list) {
    if (s.equals("${t}")) list.remove(s);
}`}</pre>
        <ul className="log">
          {r.steps.map((s, i) => <li key={i} className={s.includes("Exception") ? "err" : ""}>{s}</li>)}
        </ul>
      </div>
      <div className={`result ${r.error ? "bad" : skipped.length ? "warn" : "good"}`}>
        {r.error ? "ConcurrentModificationException" : `không có exception · list = [${r.list.join(", ")}]`}
        <small>
          {r.error
            ? "fail-fast bắt được việc sửa list giữa chừng"
            : `vòng lặp dừng sớm: chưa từng duyệt ${skipped.map((x) => `"${x}"`).join(", ")}. Fail-fast chỉ là cố gắng, không phải đảm bảo.`}
        </small>
      </div>
    </div>
  );
}
