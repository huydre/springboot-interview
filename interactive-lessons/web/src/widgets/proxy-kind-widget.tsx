import { useState } from "react";

/** Proxy classes printed with and without spring.aop.proxy-target-class, Spring Boot 3.5 (study note 05.01). The PaymentServiceImpl CGLIB name under the default is inferred, not printed. */
export function ProxyKindWidget() {
  const [cglib, setCglib] = useState(true);
  const rows = cglib
    ? [
        { bean: "PaymentService (có interface)", cls: "PaymentServiceImpl$$SpringCGLIB$$...", ok: true },
        { bean: "ProbeService (không interface)", cls: "ProbeService$$SpringCGLIB$$1", ok: true },
        { bean: "ctx.getBean(PaymentServiceImpl.class)", cls: "lấy được", ok: true },
      ]
    : [
        { bean: "PaymentService (có interface)", cls: "demo.$Proxy149 (JDK proxy)", ok: true },
        { bean: "ProbeService (không interface)", cls: "vẫn ProbeService$$SpringCGLIB$$1", ok: true },
        { bean: "ctx.getBean(PaymentServiceImpl.class)", cls: "NoSuchBeanDefinitionException", ok: false },
      ];
  return (
    <div className="widget">
      <div className="seg small">
        <button className={cglib ? "on" : ""} onClick={() => setCglib(true)}>Boot mặc định (proxy-target-class=true)</button>
        <button className={!cglib ? "on" : ""} onClick={() => setCglib(false)}>proxy-target-class=false</button>
      </div>
      <ul className="log">
        {rows.map((r) => <li key={r.bean} className={r.ok ? "ok" : "err"}>{r.bean} → {r.cls}</li>)}
      </ul>
      <p className="muted">
        {cglib
          ? "CGLIB tạo subclass nên inject theo interface hay class đều được. Class không được final; method final hay private không bị chặn."
          : "JDK proxy chỉ implement interface: bean không còn là kiểu PaymentServiceImpl. Class không có interface thì Spring vẫn phải dùng CGLIB. "}
        {" "}Repository của Spring Data luôn là JDK proxy: ItemRepo → demo.$Proxy116.
      </p>
    </div>
  );
}
