import { useState } from "react";
import { Code } from "../components/code-block";

type Inject = "field" | "constructor" | "lazy";

/** OrderService ↔ PaymentService on Spring Boot 3.5 (study note 04.01). Five of the six cells were run; @Lazy with circular references allowed follows from the @Lazy run. */
function outcome(inject: Inject, allow: boolean): { ok: boolean; msg: string; measured: boolean } {
  if (inject === "lazy")
    return { ok: true, measured: !allow, msg: "Start OK. Phía @Lazy nhận CGLIB proxy (LazyPay$$SpringCGLIB$$0), lấy bean thật ở lần gọi method đầu tiên." };
  if (inject === "field")
    return allow
      ? { ok: true, measured: true, msg: "Start OK: Spring tạo A bằng constructor rỗng, đưa early reference vào cache rồi mới inject field." }
      : { ok: false, measured: true, msg: "The dependencies of some of the beans in the application context form a cycle" };
  return allow
    ? { ok: false, measured: true, msg: "Despite circular references being allowed, the dependency cycle between beans could not be broken." }
    : { ok: false, measured: true, msg: "BeanCurrentlyInCreationException: Requested bean is currently in creation" };
}

export function CircularDepWidget() {
  const [inject, setInject] = useState<Inject>("constructor");
  const [allow, setAllow] = useState(false);
  const r = outcome(inject, allow);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={inject === "field" ? "on" : ""} onClick={() => setInject("field")}>field @Autowired</button>
        <button className={inject === "constructor" ? "on" : ""} onClick={() => setInject("constructor")}>constructor</button>
        <button className={inject === "lazy" ? "on" : ""} onClick={() => setInject("lazy")}>constructor + @Lazy một phía</button>
      </div>
      <div className="seg small">
        <button className={!allow ? "on" : ""} onClick={() => setAllow(false)}>allow-circular-references=false (mặc định từ Boot 2.6)</button>
        <button className={allow ? "on" : ""} onClick={() => setAllow(true)}>=true</button>
      </div>
      <Code>{inject === "field"
        ? "@Component class OrderService   { @Autowired PaymentService p; }\n@Component class PaymentService { @Autowired OrderService o; }"
        : `@Component class OrderService   { OrderService(${inject === "lazy" ? "@Lazy " : ""}PaymentService p) {} }\n@Component class PaymentService { PaymentService(OrderService o) {} }`}</Code>
      <div className={`result ${r.ok ? "good" : "bad"}`}>
        {r.ok ? "App khởi động được" : "App fail khi start"}
        <small>{r.msg}{!r.measured && " (Suy ra: @Lazy đã chạy được ngay cả khi không cho phép vòng.)"}</small>
      </div>
      <p className="muted">Cách đúng là thiết kế lại: tách phần dùng chung ra bean thứ ba, hoặc dùng event. @Lazy và allow-circular-references chỉ che vấn đề.</p>
    </div>
  );
}
