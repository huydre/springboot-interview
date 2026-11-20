import { useState } from "react";
import { Code } from "../components/code-block";

type Tab = "lsp" | "strategy";
type Lsp = "extends" | "interface";

const CODE_LSP: Record<Lsp, string> = {
  extends: `class Rectangle {
  protected int w, h;
  void setWidth(int w)  { this.w = w; }
  void setHeight(int h) { this.h = h; }
  int area() { return w * h; }
}
class Square extends Rectangle {      // "hình vuông là hình chữ nhật" (toán học)
  @Override void setWidth(int s)  { w = s; h = s; }
  @Override void setHeight(int s) { w = s; h = s; }
}
// code dùng Rectangle:
r.setWidth(5); r.setHeight(4);        // mong area = 20`,
  interface: `interface Shape { int area(); }
record Rect(int w, int h)  implements Shape { public int area() { return w * h; } }
record Sq(int side)        implements Shape { public int area() { return side * side; } }
// Không còn setWidth/setHeight để Square phải làm sai ý nghĩa.
// Sq(4).area() = 16, Rect(5, 4).area() = 20`,
};
// Output of running both programs on JDK 21.
const OUT_LSP: Record<Lsp, string[]> = {
  extends: ["Rectangle area = 20 (expected 20)", "Square area = 16 (expected 20)   ✕ vi phạm LSP"],
  interface: ["Rect[w=5, h=4] area = 20", "Sq[side=4] area = 16   ✓ mỗi hình tự tính đúng"],
};

const POLICIES = {
  standard: { name: "Standard", base: 15_000, perKm: 2_000 },
  express: { name: "Express", base: 30_000, perKm: 3_500 },
} as const;
type PolicyKey = keyof typeof POLICIES;

/** Two tabs: the Liskov violation (Square extends Rectangle) and its fix, then Strategy as polymorphism without inheritance. Numbers match JDK 21 runs. */
export function LspStrategyWidget() {
  const [tab, setTab] = useState<Tab>("lsp");
  const [lsp, setLsp] = useState<Lsp>("extends");
  const [ran, setRan] = useState(false);
  const [policy, setPolicy] = useState<PolicyKey>("standard");
  const [km, setKm] = useState(10);
  const p = POLICIES[policy];

  return (
    <div className="widget">
      <div className="seg">
        <button className={tab === "lsp" ? "on" : ""} onClick={() => setTab("lsp")}>Liskov: Square extends Rectangle</button>
        <button className={tab === "strategy" ? "on" : ""} onClick={() => setTab("strategy")}>Strategy: đa hình không cần kế thừa</button>
      </div>
      {tab === "lsp" ? (
        <>
          <div className="seg small">
            <button className={lsp === "extends" ? "on" : ""} onClick={() => { setLsp("extends"); setRan(false); }}>Kế thừa</button>
            <button className={lsp === "interface" ? "on" : ""} onClick={() => { setLsp("interface"); setRan(false); }}>Interface Shape</button>
          </div>
          <Code>{CODE_LSP[lsp]}</Code>
          <div className="actions"><button className="btn primary" onClick={() => setRan(true)}>Chạy</button></div>
          {ran && <ul className="log">{OUT_LSP[lsp].map((l, i) => <li key={i} className={l.includes("✕") ? "err" : "ok"}>{l}</li>)}</ul>}
        </>
      ) : (
        <>
          <Code>{`interface FeePolicy { long fee(long km); }
class Standard implements FeePolicy { public long fee(long km) { return 15_000 + 2_000 * km; } }
class Express  implements FeePolicy { public long fee(long km) { return 30_000 + 3_500 * km; } }
class Order {
  private final FeePolicy policy;           // GIỮ policy, không extends
  Order(FeePolicy p) { policy = p; }
  long shipping(long km) { return policy.fee(km); }
}`}</Code>
          <div className="seg small">
            {(Object.keys(POLICIES) as PolicyKey[]).map((k) => <button key={k} className={policy === k ? "on" : ""} onClick={() => setPolicy(k)}>new Order(new {POLICIES[k].name}())</button>)}
          </div>
          <label className="muted">Quãng đường: <strong>{km} km</strong>{" "}
            <input type="range" min={1} max={30} value={km} onChange={(e) => setKm(Number(e.target.value))} />
          </label>
          <div className="result good">shipping({km}) = {(p.base + p.perKm * km).toLocaleString("vi-VN")} đ<small>{p.name}: {p.base.toLocaleString("vi-VN")} + {p.perKm.toLocaleString("vi-VN")} × {km} km. Thêm kiểu giao mới chỉ là thêm một class, Order không đổi.</small></div>
        </>
      )}
    </div>
  );
}
