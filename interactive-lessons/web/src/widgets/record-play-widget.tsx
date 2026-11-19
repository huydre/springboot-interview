import { useState } from "react";

/** record Money(BigDecimal amount, String currency) with a compact constructor rejecting negative amounts. JDK 21 output. */
const ACTIONS: { label: string; code: string; out: string; tone: "good" | "bad"; why: string }[] = [
  { label: "toString()", code: 'var m = new Money(new BigDecimal("100"), "VND");\nSystem.out.println(m);', out: "Money[amount=100, currency=VND]", tone: "good", why: "toString sinh sẵn, liệt kê mọi field" },
  { label: "accessor", code: "m.amount();", out: "100", tone: "good", why: "accessor trùng tên field, không có tiền tố get" },
  { label: "getAmount()", code: "m.getAmount();", out: "error: cannot find symbol", tone: "bad", why: "record không sinh getter kiểu JavaBean" },
  { label: "equals / hashCode", code: 'm.equals(new Money(new BigDecimal("100"), "VND"));\nm.hashCode() == other.hashCode();', out: "true · true", tone: "good", why: "so sánh theo giá trị của tất cả field" },
  { label: "số tiền âm", code: 'new Money(new BigDecimal("-1"), "VND");', out: "IllegalArgumentException: amount < 0", tone: "bad", why: "compact constructor validate ngay lúc tạo" },
  { label: "final / Record", code: "Modifier.isFinal(Money.class.getModifiers());\nMoney.class.getSuperclass();", out: "true · java.lang.Record", tone: "good", why: "record là final và ngầm extends Record, nên không kế thừa class khác và không làm JPA entity được" },
];

export function RecordPlayWidget() {
  const [i, setI] = useState(0);
  const a = ACTIONS[i];
  return (
    <div className="widget">
      <pre className="code">{`public record Money(BigDecimal amount, String currency) {
    public Money {
        Objects.requireNonNull(currency);
        if (amount.signum() < 0) throw new IllegalArgumentException("amount < 0");
    }
}`}</pre>
      <div className="seg small">
        {ACTIONS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="two">
        <pre className="code">{a.code}</pre>
        <div className={`result ${a.tone}`}>
          {a.out}
          <small>{a.why}</small>
        </div>
      </div>
    </div>
  );
}
