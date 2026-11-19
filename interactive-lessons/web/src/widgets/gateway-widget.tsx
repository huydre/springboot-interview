import { useState } from "react";

const GATEWAYS = [
  { id: "momo", cls: "MomoGateway", label: "MoMo", body: "// gọi API MoMo, ký HMAC, xử lý callback" },
  { id: "vnpay", cls: "VnPayGateway", label: "VNPay", body: "// tạo URL thanh toán VNPay, kiểm tra checksum" },
  { id: "zalopay", cls: "ZaloPayGateway", label: "ZaloPay", body: "// class MỚI: chỉ thêm, không sửa code cũ" },
];

const ORDER_SERVICE = `class OrderService {
    private final PaymentGateway gateway;   // chỉ biết interface

    void checkout(Order order) {
        gateway.charge(order.total());
    }
}`;

/** Abstraction demo: swapping the PaymentGateway implementation never touches OrderService. */
export function GatewayWidget() {
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState("momo");
  const [log, setLog] = useState<string[]>([]);
  const gw = GATEWAYS.find((g) => g.id === active)!;

  const checkout = () => setLog((l) => [`checkout(250.000đ) → ${gw.cls}.charge() → thành công`, ...l].slice(0, 4));

  return (
    <div className="widget">
      <div className="seg">
        {GATEWAYS.map((g) =>
          g.id === "zalopay" && !added ? (
            <button key={g.id} className="add" onClick={() => { setAdded(true); setActive("zalopay"); }}>+ Thêm ZaloPayGateway</button>
          ) : (
            <button key={g.id} className={active === g.id ? "on" : ""} onClick={() => setActive(g.id)}>{g.label}</button>
          ),
        )}
      </div>
      <div className="two">
        <div>
          <div className="file">OrderService.java <span className="tag same">không đổi</span></div>
          <pre className="code">{ORDER_SERVICE}</pre>
        </div>
        <div>
          <div className="file">{gw.cls}.java <span className={`tag ${gw.id === "zalopay" ? "new" : "runtime"}`}>{gw.id === "zalopay" ? "class mới" : "implementation"}</span></div>
          <pre className="code">{`class ${gw.cls} implements PaymentGateway {\n    public PaymentResult charge(long amount) {\n        ${gw.body}\n    }\n}`}</pre>
        </div>
      </div>
      <div className="actions">
        <button className="btn primary" onClick={checkout}>checkout()</button>
      </div>
      <ul className="log">
        {log.length === 0 && <li className="muted">Chọn một cổng rồi bấm checkout()…</li>}
        {log.map((l, i) => <li key={i} className="ok">{l}</li>)}
      </ul>
    </div>
  );
}
