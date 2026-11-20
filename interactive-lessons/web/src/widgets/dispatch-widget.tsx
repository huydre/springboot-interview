import { useState } from "react";
import { Code } from "../components/code-block";

const SPEAK: Record<string, string> = { Animal: "...", Dog: "Gâu gâu", Cat: "Meo meo" };

/** Shows that overriding is chosen by the runtime object while overloading is chosen by the declared type. */
export function DispatchWidget() {
  const [declared, setDeclared] = useState<"Animal" | "Dog">("Animal");
  const [actual, setActual] = useState<"Dog" | "Cat">("Dog");
  const [argType, setArgType] = useState<"Object" | "String">("Object");
  const compileError = declared === "Dog" && actual === "Cat";

  return (
    <div className="widget dispatch">
      <div className="panel">
        <h4>Overriding <span className="tag runtime">runtime</span></h4>
        <div className="pick">
          <label>Kiểu khai báo</label>
          <div className="seg small">
            {(["Animal", "Dog"] as const).map((t) => <button key={t} className={declared === t ? "on" : ""} onClick={() => setDeclared(t)}>{t}</button>)}
          </div>
          <label>Object thật</label>
          <div className="seg small">
            {(["Dog", "Cat"] as const).map((t) => <button key={t} className={actual === t ? "on" : ""} onClick={() => setActual(t)}>{t}</button>)}
          </div>
        </div>
        <Code>{`${declared} a = new ${actual}();\na.speak();`}</Code>
        {compileError ? (
          <div className="result bad">Lỗi biên dịch: Cat không phải là Dog (incompatible types)</div>
        ) : (
          <div className="result good">→ {actual}.speak() in ra "{SPEAK[actual]}"<small>JVM nhìn object thật ({actual}), không nhìn kiểu biến ({declared})</small></div>
        )}
      </div>
      <div className="panel">
        <h4>Overloading <span className="tag compile">compile time</span></h4>
        <Code>{`static String print(Object o)\nstatic String print(String s)`}</Code>
        <div className="pick">
          <label>Kiểu khai báo của biến</label>
          <div className="seg small">
            {(["Object", "String"] as const).map((t) => <button key={t} className={argType === t ? "on" : ""} onClick={() => setArgType(t)}>{t}</button>)}
          </div>
        </div>
        <Code>{`${argType} o = "hello";\nprint(o);`}</Code>
        <div className={`result ${argType === "Object" ? "warn" : "good"}`}>
          → print({argType})
          <small>Object thật luôn là String "hello", nhưng compiler chỉ nhìn kiểu khai báo ({argType})</small>
        </div>
      </div>
    </div>
  );
}
