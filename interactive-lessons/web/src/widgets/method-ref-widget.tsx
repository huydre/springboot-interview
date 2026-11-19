import { useState } from "react";

/** The four kinds of method reference and the lambda each one stands for. */
const KINDS = [
  { kind: "static method", ref: "Integer::parseInt", lambda: "s -> Integer.parseInt(s)" },
  { kind: "method của một object cụ thể", ref: "System.out::println", lambda: "x -> System.out.println(x)" },
  { kind: "method của tham số đầu tiên", ref: "String::toUpperCase", lambda: "s -> s.toUpperCase()" },
  { kind: "constructor", ref: "ArrayList::new", lambda: "() -> new ArrayList<>()" },
];

export function MethodRefWidget() {
  const [i, setI] = useState(0);
  const k = KINDS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {KINDS.map((x, n) => <button key={x.ref} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.kind}</button>)}
      </div>
      <div className="two">
        <div className="result good">{k.ref}<small>method reference</small></div>
        <div className="result">{k.lambda}<small>lambda tương đương</small></div>
      </div>
      <p className="muted">Dùng method reference khi lambda chỉ gọi đúng một method và truyền nguyên tham số. Có thêm logic thì giữ lambda.</p>
    </div>
  );
}
