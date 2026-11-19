import { useState } from "react";

type Mode = "default" | "pct75" | "xmxLimit";

/**
 * Max heap the JVM picks inside a container. Measured on JDK 21 with -XX:MaxRAM=1g/2g/4g/8g: 256/512/1024/2048 MB by
 * default (25%), 768/1536/3072/6144 MB with -XX:MaxRAMPercentage=75 (and 4096 MB on a 16 GB machine with no flags).
 */
const LIMITS = [1, 2, 4, 8];
const MODES: { id: Mode; label: string }[] = [
  { id: "default", label: "không cấu hình" },
  { id: "pct75", label: "-XX:MaxRAMPercentage=75" },
  { id: "xmxLimit", label: "-Xmx = limit" },
];

export function HeapContainerWidget() {
  const [limit, setLimit] = useState(2);
  const [mode, setMode] = useState<Mode>("default");
  const limitMb = limit * 1024;
  const heapMb = mode === "default" ? limitMb / 4 : mode === "pct75" ? (limitMb * 3) / 4 : limitMb;
  const pct = Math.round((heapMb / limitMb) * 100);
  const verdict =
    mode === "default"
      ? { tone: "warn", text: "Heap chỉ 1/4: pod còn nhiều RAM trống mà ứng dụng đã OutOfMemoryError: Java heap space." }
      : mode === "pct75"
        ? { tone: "good", text: "Heap đủ lớn, vẫn chừa ~25% cho metaspace, stack các thread, direct buffer." }
        : { tone: "bad", text: "Heap cộng phần ngoài heap vượt limit: container bị kill (OOMKilled, exit code 137)." };
  return (
    <div className="widget">
      <div className="seg small">
        {LIMITS.map((l) => <button key={l} className={limit === l ? "on" : ""} onClick={() => setLimit(l)}>limit {l} GB</button>)}
      </div>
      <div className="seg small">
        {MODES.map((m) => <button key={m.id} className={mode === m.id ? "on" : ""} onClick={() => setMode(m.id)}>{m.label}</button>)}
      </div>
      <div className="bars">
        <div>heap {heapMb} MB<i className={mode === "pct75" ? "good" : "bad"} style={{ width: `${pct}%` }} /></div>
      </div>
      <div className={`result ${verdict.tone}`}>
        heap tối đa {heapMb} MB / limit {limitMb} MB ({pct}%)
        <small>{verdict.text}</small>
      </div>
    </div>
  );
}
