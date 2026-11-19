import { useState } from "react";

type Method = "orElse" | "orElseGet";

/** load(tag) prints "load() called for <tag>" and returns "DEFAULT". All four combinations were run on JDK 21. */
export function OrElseWidget() {
  const [present, setPresent] = useState(true);
  const [method, setMethod] = useState<Method>("orElse");
  const called = method === "orElse" || !present;
  const src = present ? 'Optional.of("x")' : "Optional.empty()";
  const call = method === "orElse" ? '.orElse(load("orElse"))' : '.orElseGet(() -> load("orElseGet"))';
  return (
    <div className="widget">
      <div className="seg small">
        <button className={present ? "on" : ""} onClick={() => setPresent(true)}>Optional.of("x")</button>
        <button className={!present ? "on" : ""} onClick={() => setPresent(false)}>Optional.empty()</button>
      </div>
      <div className="seg small">
        {(["orElse", "orElseGet"] as Method[]).map((m) => <button key={m} className={method === m ? "on" : ""} onClick={() => setMethod(m)}>{m}</button>)}
      </div>
      <div className="two">
        <pre className="code">{`String v = ${src}\n    ${call};`}</pre>
        <ul className="log">
          {called ? <li className={present ? "err" : ""}>load() called for {method}</li> : <li className="muted">(không in dòng nào)</li>}
          <li className="ok">v = {present ? "x" : "DEFAULT"}</li>
        </ul>
      </div>
      <div className={`result ${present && called ? "warn" : "good"}`}>
        {called ? "load() đã chạy" : "load() không chạy"}
        <small>
          {present && called
            ? "Hộp đã có giá trị mà load() vẫn chạy: Java tính tham số trước khi gọi orElse. Nếu load() gọi DB hay tạo bản ghi, nó vẫn xảy ra."
            : present
              ? "orElseGet nhận Supplier, chỉ gọi khi hộp rỗng."
              : "Hộp rỗng: cả hai cách đều phải lấy giá trị mặc định."}
        </small>
      </div>
    </div>
  );
}
