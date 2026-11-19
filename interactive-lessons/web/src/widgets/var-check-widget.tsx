import { useState } from "react";

type Choice = "compile" | "lỗi";

/** Does this use of var compile? Every verdict and message comes from javac on JDK 21. */
const STMTS: { code: string; answer: Choice; why: string }[] = [
  { code: "var list = new ArrayList<String>();", answer: "compile", why: "kiểu hiển nhiên từ vế phải: ArrayList<String>" },
  { code: "var x = null;", answer: "lỗi", why: "cannot infer type for local variable x: null không cho biết kiểu" },
  { code: "var y;", answer: "lỗi", why: "cannot infer type for local variable y: không có khởi tạo để suy kiểu" },
  { code: "for (var e : list) { ... }", answer: "compile", why: "biến local trong vòng for-each" },
  { code: 'private var name = "a";   // field', answer: "lỗi", why: "'var' is not allowed here: không dùng cho field" },
  { code: "void f(var x) { }", answer: "lỗi", why: "'var' is not allowed here: không dùng cho tham số method" },
  { code: "var g = () -> 1;", answer: "lỗi", why: "cannot infer type for local variable g: lambda cần kiểu đích rõ ràng" },
  { code: "var a = 1, b = 2;", answer: "lỗi", why: "'var' is not allowed in a compound declaration" },
  { code: 'var n = 10;  n = "ten";', answer: "lỗi", why: "incompatible types: String cannot be converted to int. var vẫn là kiểu tĩnh: n là int" },
];

export function VarCheckWidget() {
  const [picked, setPicked] = useState<Record<number, Choice>>({});
  const score = STMTS.filter((s, i) => picked[i] === s.answer).length;
  return (
    <div className="widget">
      <ul className="classify">
        {STMTS.map((s, i) => {
          const p = picked[i];
          return (
            <li key={s.code} className={p ? (p === s.answer ? "ok" : "no") : ""}>
              <code className="stmt">{s.code}</code>
              <div className="seg small">
                {(["compile", "lỗi"] as Choice[]).map((c) => <button key={c} className={p === c ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: c }))}>{c}</button>)}
              </div>
              {p && <span className="why">{p === s.answer ? `✓ ${s.why}` : `✕ ${s.answer === "compile" ? "compile được" : "lỗi biên dịch"}: ${s.why}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{STMTS.length}</span></div>
    </div>
  );
}
