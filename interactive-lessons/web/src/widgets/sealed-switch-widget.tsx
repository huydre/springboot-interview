import { useState } from "react";
import { Code } from "../components/code-block";

/**
 * sealed Shape + pattern switch area(): toggle adding Triangle to `permits` and adding a `default` branch.
 * All four outcomes were compiled and run on JDK 21.
 */
export function SealedSwitchWidget() {
  const [triangle, setTriangle] = useState(false);
  const [withDefault, setWithDefault] = useState(false);
  const permits = triangle ? "Circle, Square, Rect, Triangle" : "Circle, Square, Rect";
  const outcome = !triangle
    ? { tone: "good", out: "compile được · area(new Rect(2, 3)) = 6.0", why: withDefault ? "Chạy được, nhưng default thừa: nó sẽ che mất lỗi khi sau này thêm loại mới." : "Đủ case nên không cần default: compiler đã kiểm tra giúp." }
    : withDefault
      ? { tone: "warn", out: "compile được · area(new Triangle(4, 3)) = 0.0", why: "Triangle âm thầm rơi vào default và ra diện tích 0. Lỗi logic lọt qua compiler." }
      : { tone: "bad", out: "error: the switch expression does not cover all possible input values", why: "Compiler biết Shape có thêm Triangle và bắt bạn xử lý. Đây chính là lợi ích của sealed." };
  return (
    <div className="widget">
      <div className="actions">
        <button className={`btn ${triangle ? "primary" : ""}`} onClick={() => setTriangle(!triangle)}>{triangle ? "✓ " : ""}thêm Triangle vào permits</button>
        <button className={`btn ${withDefault ? "primary" : ""}`} onClick={() => setWithDefault(!withDefault)}>{withDefault ? "✓ " : ""}thêm default -&gt; 0</button>
      </div>
      <Code>{`sealed interface Shape permits ${permits} {}

static double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Square sq -> sq.side() * sq.side();
        case Rect(double w, double h) -> w * h;${withDefault ? "\n        default -> 0;" : ""}
    };
}`}</Code>
      <div className={`result ${outcome.tone}`}>
        {outcome.out}
        <small>{outcome.why}</small>
      </div>
    </div>
  );
}
