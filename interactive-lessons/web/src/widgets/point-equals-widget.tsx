import { useState } from "react";

/** == vs equals(): the same three Points, with and without an equals() override. */
export function PointEqualsWidget() {
  const [override, setOverride] = useState(false);
  const rows = [
    { expr: "p1 == p2", value: false, why: "hai lần new: hai địa chỉ khác nhau" },
    { expr: "p1.equals(p2)", value: override, why: override ? "equals đã override: so x, y" : "không override: Object.equals chính là ==" },
    { expr: "p1 == p3", value: true, why: "p3 = p1: cùng một địa chỉ" },
    { expr: "p1.equals(p3)", value: true, why: "cùng object thì luôn equals" },
  ];
  return (
    <div className="widget">
      <div className="seg">
        <button className={!override ? "on" : ""} onClick={() => setOverride(false)}>không override equals</button>
        <button className={override ? "on" : ""} onClick={() => setOverride(true)}>override equals + hashCode</button>
      </div>
      <div className="two">
        <pre className="code">{`class Point {
  final int x, y;
  Point(int x, int y) { this.x = x; this.y = y; }${override ? `

  @Override public boolean equals(Object o) {
    return o instanceof Point p
        && x == p.x && y == p.y;
  }
  @Override public int hashCode() {
    return Objects.hash(x, y);
  }` : ""}
}

Point p1 = new Point(1, 2);
Point p2 = new Point(1, 2);
Point p3 = p1;`}</pre>
        <div className="panel">
          {rows.map((r) => (
            <div key={r.expr} className={`result ${r.value ? "good" : "bad"}`}>
              {r.expr} → {String(r.value)}
              <small>{r.why}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
