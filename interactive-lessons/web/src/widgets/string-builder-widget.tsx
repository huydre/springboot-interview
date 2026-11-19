import { useState } from "react";

const PIECE = 2; // each item appends "x," (2 chars)

/**
 * Characters copied when joining n items. `+=` copies the whole result every iteration: 2 + 4 + ... + 2n = n(n+1).
 * StringBuilder appends in place; doubling its buffer copies at most about as much again, so ≈ 2 × 2n.
 */
export function StringBuilderWidget() {
  const [n, setN] = useState(1000);
  const plus = n * (n + 1);
  const builder = 2 * PIECE * n;
  const fmt = (v: number) => v.toLocaleString("vi-VN");
  const width = (v: number) => `${Math.max(1, (v / plus) * 100)}%`;

  return (
    <div className="widget">
      <label className="pick">
        <span>số phần tử: {fmt(n)}</span>
        <input type="range" min={10} max={20000} step={10} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Số phần tử" />
      </label>
      <div className="bars">
        <div>
          <span><code>r += s + ","</code> · {fmt(plus)} ký tự bị copy, {fmt(n)} String tạm</span>
          <i className="bad" style={{ width: width(plus) }} />
        </div>
        <div>
          <span><code>sb.append(s).append(',')</code> · khoảng {fmt(builder)} ký tự</span>
          <i className="good" style={{ width: width(builder) }} />
        </div>
      </div>
      <p className="muted">
        += trong vòng lặp tăng theo n², StringBuilder tăng tuyến tính. Gấp đôi số phần tử thì lượng ký tự += phải copy tăng khoảng 4 lần.
        Nối trong một biểu thức đơn như <code>"Hello " + name</code> thì cứ dùng +, compiler đã tối ưu.
      </p>
    </div>
  );
}
