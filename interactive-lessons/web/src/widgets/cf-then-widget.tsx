import { useState } from "react";
import { Code } from "../components/code-block";

/** thenApply vs thenCompose vs thenCombine; results and the 517 ms timing were run on JDK 21. */
const OPS: { label: string; code: string; type: string; out: string; tone: "good" | "warn"; why: string }[] = [
  {
    label: "thenApply (hàm trả CF)",
    code: "supplyAsync(() -> 1L, io)\n    .thenApply(id -> supplyAsync(() -> orders(id), io));",
    type: "CompletableFuture<CompletableFuture<List<String>>>",
    out: "join() trả về một CompletableFuture, chưa phải list",
    tone: "warn",
    why: "Hàm đã trả CF nên bị lồng: phải join() thêm lần nữa. Giống map trả Stream.",
  },
  {
    label: "thenCompose",
    code: "supplyAsync(() -> 1L, io)\n    .thenCompose(id -> supplyAsync(() -> orders(id), io));",
    type: "CompletableFuture<List<String>>",
    out: "[o1, o2]",
    tone: "good",
    why: "Bước sau cần kết quả bước trước và cũng async: làm phẳng, giống flatMap.",
  },
  {
    label: "thenCombine",
    code: 'supplyAsync(() -> user(1), io)                 // 300 ms\n    .thenCombine(supplyAsync(() -> orders(1), io), // 500 ms\n        (u, o) -> u + " has " + o.size() + " orders");',
    type: "CompletableFuture<String>",
    out: "user-1 has 2 orders · 517 ms",
    tone: "good",
    why: "Hai việc độc lập chạy song song: thời gian ≈ việc chậm hơn. Dùng thenCompose ở đây sẽ biến chúng thành tuần tự.",
  },
];

export function CfThenWidget() {
  const [i, setI] = useState(0);
  const o = OPS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {OPS.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <Code>{o.code}</Code>
      <div className={`result ${o.tone}`}>
        {o.out}
        <small>Kiểu: {o.type}. {o.why}</small>
      </div>
    </div>
  );
}
