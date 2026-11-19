import { useState } from "react";

/** A prototype Cart (id from a counter) reached from singletons in five ways; ids measured on Spring Boot 3.5 (study note 04.02). */
const WAYS: { label: string; code: string; ids: [number, number]; ok: boolean; why: string }[] = [
  { label: "inject trực tiếp", code: "Direct(Cart cart)\ncart.id()  // lần 1\ncart.id()  // lần 2", ids: [1, 1], ok: false, why: "Injection chỉ xảy ra một lần lúc tạo singleton, prototype mất tác dụng." },
  { label: "ObjectProvider<Cart>", code: "carts.getObject().id()\ncarts.getObject().id()", ids: [2, 3], ok: true, why: "Mới mỗi lần, rõ ràng, dễ test. Em chọn cách này." },
  { label: "@Lookup", code: "@Lookup abstract Cart cart();\ncart().id()\ncart().id()", ids: [4, 5], ok: true, why: "Spring tạo CGLIB subclass ViaLookup$$SpringCGLIB$$0 override method. Gọn nhưng khó hiểu với người mới." },
  { label: "scoped proxy", code: "@Scope(value = \"prototype\", proxyMode = TARGET_CLASS)\nx.cart.id()\nx.cart.id()   // cùng một field", ids: [6, 7], ok: false, why: "Mỗi lần gọi method qua proxy là một instance mới: cart.add() rồi cart.total() chạy trên 2 object khác nhau. Hợp với request, session scope." },
];

export function PrototypeScopeWidget() {
  const [i, setI] = useState(0);
  const w = WAYS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {WAYS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="two">
        <pre className="code">{w.code}</pre>
        <ul className="log">
          <li>lần 1: Cart id = {w.ids[0]}</li>
          <li className={w.ids[0] === w.ids[1] ? "err" : ""}>lần 2: Cart id = {w.ids[1]}</li>
        </ul>
      </div>
      <div className={`result ${w.ok ? "good" : "bad"}`}>
        {w.ids[0] === w.ids[1] ? "Luôn cùng một instance" : "Instance mới mỗi lần"}
        <small>{w.why}</small>
      </div>
    </div>
  );
}
