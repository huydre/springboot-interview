import { useState } from "react";

/** Each snippet and its result, run on JDK 21. */
const CASES = [
  {
    name: "thứ tự chạy",
    code: `try { log("try"); throw new RuntimeException(); }
catch (RuntimeException e) { log("catch"); }
finally { log("finally"); }`,
    result: "try catch finally",
    good: true,
    why: "finally chạy sau cùng, dù try có lỗi hay không.",
  },
  {
    name: "return trong finally",
    code: `static int f() {
    try { return 1; }
    finally { return 2; }
}`,
    result: "f() = 2",
    good: false,
    why: "return trong finally ghi đè giá trị return của try.",
  },
  {
    name: "nuốt exception",
    code: `static int swallowed() {
    try { throw new IllegalStateException("lỗi quan trọng"); }
    finally { return 0; }
}`,
    result: "swallowed() = 0, không có exception nào",
    good: false,
    why: "exception của try biến mất: bên gọi tưởng mọi thứ ổn.",
  },
  {
    name: "sửa biến trong finally",
    code: `static int counter() {
    int x = 1;
    try { return x; }
    finally { x = 99; }
}`,
    result: "counter() = 1",
    good: true,
    why: "giá trị return đã được chốt trước khi finally chạy.",
  },
];

/** finally traps: pick a snippet, see what the JVM actually returns. */
export function FinallyWidget() {
  const [i, setI] = useState(1);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((k, n) => <button key={k.name} className={i === n ? "on" : ""} onClick={() => setI(n)}>{k.name}</button>)}
      </div>
      <div className="two">
        <pre className="code">{c.code}</pre>
        <div className={`result ${c.good ? "good" : "bad"}`}>
          {c.result}
          <small>{c.why}</small>
        </div>
      </div>
    </div>
  );
}
