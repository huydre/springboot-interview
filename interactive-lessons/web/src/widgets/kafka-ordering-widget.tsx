import { useState } from "react";

/** Topic orders with 4 partitions, Kafka 3.9.1 via Testcontainers (study note 03.11): key → partition and the order one consumer received. */
const PARTITION: Record<string, number> = { A: 1, B: 3, C: 3, D: 0, E: 2 };
const SENT = [1, 2, 3, 4].flatMap((n) => ["A", "B", "C", "D", "E"].map((k) => `${k}#${n}`));
const RECEIVED = "D#1 D#2 D#3 D#4 A#1 A#2 A#3 A#4 E#1 E#2 E#3 E#4 B#1 C#1 B#2 C#2 B#3 C#3 B#4 C#4".split(" ");

export function KafkaOrderingWidget() {
  const [key, setKey] = useState("A");
  const mark = (m: string) => (m.startsWith(key) ? "" : "untouched");
  return (
    <div className="widget">
      <div className="seg small">
        {Object.keys(PARTITION).map((k) => <button key={k} className={key === k ? "on" : ""} onClick={() => setKey(k)}>order-{k} → partition {PARTITION[k]}</button>)}
      </div>
      <p className="muted">Producer gửi xen kẽ:</p>
      <div className="chain">{SENT.map((m) => <span key={m} className={mark(m)}>{m}</span>)}</div>
      <p className="muted">Một consumer đọc cả 4 partition nhận được:</p>
      <div className="chain">{RECEIVED.map((m) => <span key={m} className={mark(m)}>{m}</span>)}</div>
      <div className="result good">
        order-{key}: {RECEIVED.filter((m) => m.startsWith(key)).join(" → ")}
        <small>
          Thứ tự toàn cục mất (gửi A#1 đầu tiên nhưng nhận D#1 đầu tiên), thứ tự theo từng key được giữ vì cùng key luôn vào cùng partition.
          {(key === "B" || key === "C") && " B và C dùng chung partition 3 nên xen kẽ nhau, mỗi key vẫn đúng thứ tự."}
        </small>
      </div>
    </div>
  );
}
