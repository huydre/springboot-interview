import { useState } from "react";

type Terminal = "none" | "findFirst" | "toList" | "anyMatch" | "limit" | "count";

const TERMINALS: { id: Terminal; code: string }[] = [
  { id: "none", code: "// chưa có terminal" },
  { id: "findFirst", code: ".findFirst()" },
  { id: "anyMatch", code: ".anyMatch(x -> x > 30)" },
  { id: "limit", code: ".limit(2).toList()" },
  { id: "toList", code: ".toList()" },
  { id: "count", code: ".count()" },
];

/**
 * Replays Stream.of(1..6).filter(even).map(x10) element by element (vertical), stopping as soon as the terminal
 * operation has its answer. Every log and result matches JDK 21 (WidgetTruth run): e.g. findFirst → filter 1,
 * filter 2, map 2, result 20; count still runs everything because filter makes the size unknown.
 */
function run(terminal: Terminal) {
  const log: string[] = [];
  if (terminal === "none") return { log, result: "không chạy gì: chưa bật máy" };
  const out: number[] = [];
  for (let x = 1; x <= 6; x++) {
    log.push(`filter ${x}`);
    if (x % 2 !== 0) continue;
    log.push(`map ${x}`);
    const v = x * 10;
    out.push(v);
    if (terminal === "findFirst") return { log, result: `Optional[${v}]` };
    if (terminal === "anyMatch" && v > 30) return { log, result: "true" };
    if (terminal === "limit" && out.length === 2) return { log, result: `[${out.join(", ")}]` };
  }
  if (terminal === "anyMatch") return { log, result: "false" };
  if (terminal === "count") return { log, result: String(out.length) };
  return { log, result: `[${out.join(", ")}]` };
}

export function LazyPipelineWidget() {
  const [terminal, setTerminal] = useState<Terminal>("findFirst");
  const r = run(terminal);
  const t = TERMINALS.find((x) => x.id === terminal)!;
  const touched = new Set(r.log.filter((l) => l.startsWith("filter")).map((l) => Number(l.split(" ")[1])));

  return (
    <div className="widget">
      <div className="seg small">
        {TERMINALS.map((x) => <button key={x.id} className={terminal === x.id ? "on" : ""} onClick={() => setTerminal(x.id)}>{x.code.replace("// ", "")}</button>)}
      </div>
      <div className="two">
        <pre className="code">{`Stream.of(1, 2, 3, 4, 5, 6)
    .filter(x -> x % 2 == 0)   // log "filter x"
    .map(x -> x * 10)          // log "map x"
    ${t.code}`}</pre>
        <ul className="log">
          {r.log.length === 0 && <li className="muted">(không in dòng nào)</li>}
          {r.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
      <div className="chain">
        {[1, 2, 3, 4, 5, 6].map((x) => <span key={x} className={touched.has(x) ? "" : "untouched"}>{x}</span>)}
      </div>
      <div className={`result ${terminal === "none" ? "warn" : "good"}`}>
        kết quả: {r.result}
        <small>{touched.size < 6 ? `${6 - touched.size} phần tử chưa từng đi vào dây chuyền` : "mọi phần tử đều phải đi qua"}</small>
      </div>
    </div>
  );
}
