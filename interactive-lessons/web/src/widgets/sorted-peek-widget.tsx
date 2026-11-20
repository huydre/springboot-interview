import { useState } from "react";
import { Code } from "../components/code-block";

/** Stream.of(3, 1, 2).peek(log).[sorted()].forEach(log): exact JDK 21 output with and without the stateful sorted(). */
const OUTPUT = {
  on: ["peek 3", "peek 1", "peek 2", "out 1", "out 2", "out 3"],
  off: ["peek 3", "out 3", "peek 1", "out 1", "peek 2", "out 2"],
};

export function SortedPeekWidget() {
  const [sorted, setSorted] = useState(true);
  const lines = sorted ? OUTPUT.on : OUTPUT.off;
  return (
    <div className="widget">
      <label className="check"><input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} /> thêm <code>.sorted()</code></label>
      <div className="two">
        <Code>{`Stream.of(3, 1, 2)
    .peek(x -> log("peek " + x))${sorted ? "\n    .sorted()" : ""}
    .forEach(x -> log("out " + x));`}</Code>
        <ul className="log">{lines.map((l) => <li key={l} className={l.startsWith("out") ? "ok" : ""}>{l}</li>)}</ul>
      </div>
      <div className={`result ${sorted ? "warn" : "good"}`}>
        {sorted ? "stateful: gom đủ 3 phần tử rồi mới cho ra" : "stateless: từng phần tử đi thẳng tới forEach"}
        <small>{sorted ? "sorted, distinct phải giữ dữ liệu lại: tốn bộ nhớ, không dừng sớm được" : "peek và out xen kẽ: xử lý theo chiều dọc"}</small>
      </div>
    </div>
  );
}
