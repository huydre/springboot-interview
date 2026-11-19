import { useState } from "react";

const CHOICES = ["Function", "Predicate", "Supplier", "Consumer", "BinaryOperator"] as const;
type Choice = (typeof CHOICES)[number];

/** Which built-in functional interface fits each lambda shape? Answers follow the java.util.function signatures. */
const LAMBDAS: { code: string; answer: Choice; why: string }[] = [
  { code: "x -> x * 2", answer: "Function", why: "nhận T, trả R: biến đổi (apply)" },
  { code: "s -> s.isEmpty()", answer: "Predicate", why: "nhận T, trả boolean: kiểm tra (test)" },
  { code: '() -> "hello"', answer: "Supplier", why: "không nhận gì, trả T: cung cấp (get)" },
  { code: "s -> System.out.println(s)", answer: "Consumer", why: "nhận T, trả void: tiêu thụ (accept)" },
  { code: "(a, b) -> a + b", answer: "BinaryOperator", why: "nhận hai T, trả T: dùng cho reduce" },
];

export function FunctionalInterfaceWidget() {
  const [picked, setPicked] = useState<Record<number, Choice>>({});
  const score = LAMBDAS.filter((l, i) => picked[i] === l.answer).length;
  return (
    <div className="widget">
      <ul className="classify">
        {LAMBDAS.map((l, i) => {
          const p = picked[i];
          return (
            <li key={l.code} className={p ? (p === l.answer ? "ok" : "no") : ""}>
              <code className="stmt">{l.code}</code>
              <div className="seg small">
                {CHOICES.map((c) => <button key={c} className={p === c ? "on" : ""} onClick={() => setPicked({ ...picked, [i]: c })}>{c}</button>)}
              </div>
              {p && <span className="why">{p === l.answer ? `✓ ${l.why}` : `✕ là ${l.answer}: ${l.why}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{LAMBDAS.length}</span></div>
    </div>
  );
}
