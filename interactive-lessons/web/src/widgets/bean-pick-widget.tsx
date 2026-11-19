import { useState } from "react";

/**
 * Beans momo (@Order 2), vnpay (@Order 1), zalopay (@Primary), all implementing PaymentGateway.
 * Results measured on Spring Boot 3.5 (study note 04.01); the "no @Primary" row is the real NoUniqueBeanDefinitionException.
 */
const POINTS: { label: string; code: string; result: string; ok: boolean; why: string }[] = [
  { label: "không @Primary", code: "Checkout(PaymentGateway gw)  // chỉ có momo, vnpay", result: "NoUniqueBeanDefinitionException: expected single matching bean but found 2: momo,vnpay", ok: false, why: "Spring không biết chọn bean nào nên app fail khi start." },
  { label: "PaymentGateway def", code: "Checkout(PaymentGateway def)", result: "zalopay", ok: true, why: "Không ai chỉ định thì chọn bean @Primary." },
  { label: "@Qualifier(\"vnpay\")", code: "Checkout(@Qualifier(\"vnpay\") PaymentGateway chosen)", result: "vnpay", ok: true, why: "@Qualifier ở điểm inject thắng @Primary." },
  { label: "List<PaymentGateway>", code: "Checkout(List<PaymentGateway> all)", result: "[vnpay, momo, zalopay]", ok: true, why: "Theo @Order; bean không có @Order xếp cuối." },
  { label: "Map<String, PaymentGateway>", code: "Checkout(Map<String, PaymentGateway> byName)", result: "keySet = [momo, vnpay, zalopay]", ok: true, why: "Key là tên bean: strategy pattern thay if/else theo kênh, thêm kênh chỉ cần thêm một @Component." },
];

export function BeanPickWidget() {
  const [i, setI] = useState(1);
  const p = POINTS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {POINTS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{`@Component("momo")    @Order(2) class Momo  implements PaymentGateway {}\n@Component("vnpay")   @Order(1) class VnPay implements PaymentGateway {}\n${i === 0 ? "" : "@Component(\"zalopay\") @Primary  class Zalo  implements PaymentGateway {}\n"}\n${p.code}`}</pre>
      <div className={`result ${p.ok ? "good" : "bad"}`}>
        {p.result}
        <small>{p.why}</small>
      </div>
    </div>
  );
}
