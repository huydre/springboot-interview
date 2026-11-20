import { useState } from "react";
import { Code } from "../components/code-block";

type Step = { line: string; delta: number; note: string };

const CODE_EXTENDS = `class InstrumentedHashSet<E> extends HashSet<E> {
  private int addCount = 0;           // đếm số phần tử đã thêm

  @Override public boolean add(E e) {
    addCount++;                       // +1 cho mỗi lần add
    return super.add(e);
  }
  @Override public boolean addAll(Collection<? extends E> c) {
    addCount += c.size();             // +số phần tử của c
    return super.addAll(c);           // nhờ lớp cha thêm hết
  }
}`;
const CODE_COMPOSE = `class InstrumentedSet<E> {
  private final Set<E> inner = new HashSet<>();   // GIỮ một set, không kế thừa
  private int addCount = 0;

  public boolean add(E e) {
    addCount++;
    return inner.add(e);
  }
  public boolean addAll(Collection<? extends E> c) {
    addCount += c.size();
    return inner.addAll(c);           // chỉ nhờ set bên trong, nó không gọi ngược lại add() của ta
  }
}`;

const EXTENDS: Step[] = [
  { line: "addAll([a, b, c])", delta: 3, note: "addCount += c.size()" },
  { line: "  super.addAll(c)", delta: 0, note: "HashSet.addAll lặp từng phần tử và gọi add()" },
  { line: "    add(\"a\")  ← method đã override", delta: 1, note: "addCount++" },
  { line: "    add(\"b\")  ← method đã override", delta: 1, note: "addCount++" },
  { line: "    add(\"c\")  ← method đã override", delta: 1, note: "addCount++" },
];
const COMPOSE: Step[] = [
  { line: "addAll([a, b, c])", delta: 3, note: "addCount += c.size()" },
  { line: "  inner.addAll(c)", delta: 0, note: "gọi API công khai của set bên trong" },
  { line: "    HashSet.add(\"a\")", delta: 0, note: "add() của HashSet, không phải của ta" },
  { line: "    HashSet.add(\"b\")", delta: 0, note: "không đếm thêm" },
  { line: "    HashSet.add(\"c\")", delta: 0, note: "không đếm thêm" },
];

/** Steps through InstrumentedHashSet.addAll to show the double count of inheritance vs composition. */
export function InheritWidget() {
  const [mode, setMode] = useState<"extends" | "compose">("extends");
  const [pos, setPos] = useState(0);
  const steps = mode === "extends" ? EXTENDS : COMPOSE;
  const count = steps.slice(0, pos).reduce((s, x) => s + x.delta, 0);
  const done = pos === steps.length;

  return (
    <div className="widget">
      <div className="seg">
        <button className={mode === "extends" ? "on" : ""} onClick={() => { setMode("extends"); setPos(0); }}>extends HashSet</button>
        <button className={mode === "compose" ? "on" : ""} onClick={() => { setMode("compose"); setPos(0); }}>composition</button>
      </div>
      <Code>{mode === "extends" ? CODE_EXTENDS : CODE_COMPOSE}</Code>
      <p className="muted">Ta chạy <code>set.addAll(List.of("a", "b", "c"))</code> và mong <code>addCount</code> bằng 3. Bấm "Bước tiếp" để xem từng dòng chạy.</p>
      <div className="stepper">
        <ol className="calls">
          {steps.map((s, i) => (
            <li key={i} className={i < pos ? (s.delta ? "hit" : "past") : i === pos ? "next" : ""}>
              <code>{s.line}</code>
              <small>{i < pos ? `${s.note}${s.delta ? ` (+${s.delta})` : ""}` : ""}</small>
            </li>
          ))}
        </ol>
        <div className={`counter ${done ? (count === 3 ? "good" : "bad") : ""}`}>
          <small>addCount</small>
          <strong>{count}</strong>
          <span>{done ? (count === 3 ? "✓ đúng 3" : "✕ mong đợi 3") : "đang chạy…"}</span>
        </div>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={done} onClick={() => setPos((p) => p + 1)}>Bước tiếp</button>
        <button className="btn" disabled={done} onClick={() => setPos(steps.length)}>Chạy hết</button>
        <button className="btn ghost" onClick={() => setPos(0)}>Đặt lại</button>
      </div>
    </div>
  );
}
