import { useState } from "react";

/** ArrayList grows from 10 by old + (old >> 1); JDK 21 measured 0 → 10 → 15 → 22 → 33. */
function growth(n: number) {
  const caps = n ? [10] : [0];
  let copied = 0;
  for (let size = 1; size <= n; size++) {
    const cap = caps[caps.length - 1];
    if (size > cap) { copied += cap; caps.push(cap + (cap >> 1)); }
  }
  return { caps, copied };
}

/** ArrayList.get(i) is one array read; LinkedList.get(i) walks from the nearer end (node(i) checks i < size / 2). */
export function ListGrowthWidget() {
  const [n, setN] = useState(16);
  const [i, setI] = useState(5);
  const g = growth(n);
  const index = Math.min(i, Math.max(0, n - 1));
  const hops = n ? Math.min(index, n - 1 - index) : 0;

  return (
    <div className="widget">
      <label className="pick">
        <span>add {n} phần tử</span>
        <input type="range" min={0} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Số phần tử" />
      </label>
      <div className="result warn">
        capacity: {g.caps.join(" → ")}
        <small>{g.caps.length - 1} lần nới mảng, tổng cộng copy {g.copied} phần tử · new ArrayList&lt;&gt;({n || "n"}) thì không phải copy lần nào</small>
      </div>
      <label className="pick">
        <span>get({index})</span>
        <input type="range" min={0} max={Math.max(0, n - 1)} value={index} onChange={(e) => setI(Number(e.target.value))} aria-label="Vị trí cần lấy" />
      </label>
      <div className="two">
        <div className="result good">ArrayList: 1 bước<small>elementData[{index}]: tính thẳng vị trí trong mảng</small></div>
        <div className={`result ${hops > 5 ? "bad" : "warn"}`}>LinkedList: {hops} bước nhảy<small>đi từ đầu {index < n / 2 ? "trước" : "sau"} (gần hơn), qua từng node</small></div>
      </div>
    </div>
  );
}
