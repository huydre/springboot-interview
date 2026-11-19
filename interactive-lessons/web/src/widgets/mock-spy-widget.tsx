import { useState } from "react";

type Kind = "mock" | "spy";

/** Mockito on ArrayList, run on JDK 21 (study note 03.12). The run only covered the first mock row; the other mock cells are Mockito's documented defaults. */
const ROWS: { op: string; mock: string; spy: string; bad?: Kind }[] = [
  { op: 'add("a"); size()', mock: "0 (add bị nuốt)", spy: "1 (chạy code thật)" },
  { op: "doReturn(99).when(x).size(); size()", mock: "99", spy: "99" },
  { op: "get(0) sau khi stub size", mock: "null", spy: '"a" (vẫn là code thật)' },
  { op: 'when(x.get(5)).thenReturn("x")', mock: "stub được", spy: "IndexOutOfBoundsException", bad: "spy" },
];

export function MockSpyWidget() {
  const [k, setK] = useState<Kind>("spy");
  return (
    <div className="widget">
      <div className="seg small">
        <button className={k === "mock" ? "on" : ""} onClick={() => setK("mock")}>mock(ArrayList.class)</button>
        <button className={k === "spy" ? "on" : ""} onClick={() => setK("spy")}>spy(new ArrayList&lt;&gt;())</button>
      </div>
      <ul className="log">
        {ROWS.map((r) => <li key={r.op} className={r.bad === k ? "err" : ""}><code>{r.op}</code> → {r[k]}</li>)}
      </ul>
      <p className="muted">
        {k === "spy"
          ? "when(spy.get(5)) gọi method thật trước khi kịp stub. Với spy luôn dùng doReturn(...).when(spy).method(...)."
          : "Mock chưa stub trả giá trị rỗng: Optional.empty, 0, []. MockitoExtension mặc định strict: stub mà không dùng thì UnnecessaryStubbingException."}
      </p>
    </div>
  );
}
