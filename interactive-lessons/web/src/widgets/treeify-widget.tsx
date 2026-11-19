import { useState } from "react";

/**
 * Keys that all return hashCode() == 42, added one by one. Measured on JDK 21 via reflection:
 * table 64 → node 9 becomes a TreeNode; table 16 → node 9 resizes to 32, node 10 to 64, node 11 treeifies.
 */
function stateAfter(start: 16 | 64, nodes: number) {
  if (start === 64) return { capacity: 64, tree: nodes >= 9, event: nodes === 9 ? "vượt 8 node, table ≥ 64 → treeify" : "" };
  if (nodes < 9) return { capacity: 16, tree: false, event: "" };
  if (nodes === 9) return { capacity: 32, tree: false, event: "vượt 8 node nhưng table < 64 → resize lên 32" };
  if (nodes === 10) return { capacity: 64, tree: false, event: "vẫn < 64 lúc kiểm tra → resize lên 64" };
  return { capacity: 64, tree: true, event: nodes === 11 ? "table đã 64 → treeify" : "" };
}

export function TreeifyWidget() {
  const [start, setStart] = useState<16 | 64>(64);
  const [nodes, setNodes] = useState(0);
  const s = stateAfter(start, nodes);

  return (
    <div className="widget">
      <div className="seg">
        <button className={start === 64 ? "on" : ""} onClick={() => { setStart(64); setNodes(0); }}>new HashMap&lt;&gt;(64)</button>
        <button className={start === 16 ? "on" : ""} onClick={() => { setStart(16); setNodes(0); }}>new HashMap&lt;&gt;() · 16 ô</button>
      </div>
      <div className="actions">
        <button className="btn primary" onClick={() => setNodes((n) => Math.min(n + 1, 12))} disabled={nodes >= 12}>put key có hashCode = 42</button>
        <button className="btn ghost" onClick={() => setNodes(0)}>Đặt lại</button>
        <span className="score">table = <b>{s.capacity}</b> ô · bucket có <b>{nodes}</b> node</span>
      </div>
      <div className="chain">
        {Array.from({ length: nodes }, (_, i) => <span key={i} className={s.tree ? "tree" : ""}>{i + 1}</span>)}
      </div>
      <div className={`result ${s.tree ? "good" : nodes > 8 ? "warn" : ""}`}>
        {s.tree ? "TreeNode (red-black tree): tìm kiếm O(log n)" : nodes ? "linked list: tìm kiếm O(n)" : "bucket rỗng"}
        <small>{s.event || (nodes ? "chưa vượt ngưỡng 8 node" : "bấm để thêm key cùng hashCode vào một bucket")}</small>
      </div>
    </div>
  );
}
