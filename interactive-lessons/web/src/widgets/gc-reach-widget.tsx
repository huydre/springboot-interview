import { useState } from "react";

/** Toggle references and see which objects are reachable from the GC root: reachability is computed, not scripted. */
const EDGES: { id: string; from: string; to: string }[] = [
  { id: "root-A", from: "root", to: "A" },
  { id: "A-B", from: "A", to: "B" },
  { id: "B-C", from: "B", to: "C" },
  { id: "C-D", from: "C", to: "D" },
  { id: "D-C", from: "D", to: "C" },
];
const OBJECTS = ["A", "B", "C", "D"];

function reachable(on: Set<string>) {
  const seen = new Set<string>(["root"]);
  const queue = ["root"];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of EDGES) {
      if (on.has(e.id) && e.from === cur && !seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
    }
  }
  return seen;
}

export function GcReachWidget() {
  const [on, setOn] = useState<Set<string>>(new Set(["root-A", "A-B", "C-D", "D-C"]));
  const live = reachable(on);
  const toggle = (id: string) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const garbage = OBJECTS.filter((o) => !live.has(o));
  return (
    <div className="widget">
      <div className="actions">
        {EDGES.map((e) => (
          <button key={e.id} className={`btn ${on.has(e.id) ? "primary" : ""}`} onClick={() => toggle(e.id)}>
            {e.from === "root" ? "GC root" : e.from} → {e.to}
          </button>
        ))}
      </div>
      <div className="chain">
        <span className="tree">root</span>
        {OBJECTS.map((o) => <span key={o} className={live.has(o) ? "" : "untouched"}>{o}</span>)}
      </div>
      <div className={`result ${garbage.length ? "warn" : "good"}`}>
        {garbage.length ? `Rác: ${garbage.join(", ")} · còn sống: ${OBJECTS.filter((o) => live.has(o)).join(", ") || "không có"}` : "Mọi object đều còn sống"}
        <small>
          {on.has("C-D") && on.has("D-C") && !live.has("C")
            ? "C và D trỏ vòng vào nhau nhưng không đi tới được từ root: vẫn là rác. Java không dùng reference counting (đã thử: cặp vòng bị thu hồi)."
            : "GC lần từ root theo mọi tham chiếu; object nào không tới được thì bị thu hồi, bất kể nó còn trỏ tới ai."}
        </small>
      </div>
    </div>
  );
}
