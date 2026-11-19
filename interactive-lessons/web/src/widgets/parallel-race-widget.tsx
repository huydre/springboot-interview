import { useState } from "react";

/** Measured on JDK 21, 8 CPUs (commonPool parallelism 7). Each case lists what 10 consecutive runs printed. */
const CASES: { label: string; code: string; runs: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  {
    label: "ArrayList + forEach(add)",
    code: "List<Integer> list = new ArrayList<>();\nIntStream.range(0, 10_000).parallel().forEach(list::add);\nlist.size();",
    runs: "5633, 2670, 3163, 3404, 5185, 6274, 4484, 3624, 3252, 2417",
    tone: "bad",
    why: "Một lượt đo khác, 10 lần liên tiếp, sai cả 10, mỗi lần một số khác: nhiều thread cùng ghi vào ArrayList là race condition (có lúc còn ném exception).",
  },
  {
    label: "synchronizedList",
    code: "List<Integer> list = Collections.synchronizedList(new ArrayList<>());\nIntStream.range(0, 10_000).parallel().forEach(list::add);",
    runs: "10000 (cả 10 lần)",
    tone: "warn",
    why: "Đúng số lượng, nhưng mọi thread xếp hàng chờ một cái khóa, mất lợi ích song song, và thứ tự phần tử vẫn lộn xộn.",
  },
  {
    label: "boxed().toList()",
    code: "IntStream.range(0, 10_000).parallel().boxed().toList().size();",
    runs: "10000 (cả 10 lần)",
    tone: "good",
    why: "Mỗi thread gom phần của mình rồi stream gộp lại: không có shared mutable state. Luôn gom kết quả bằng collect/toList.",
  },
  {
    label: "forEach",
    code: "IntStream.range(0, 8).parallel().forEach(sb::append);",
    runs: "54762310, 54762301, 54761203",
    tone: "warn",
    why: "Thứ tự không được đảm bảo, đổi theo từng lần chạy.",
  },
  {
    label: "forEachOrdered",
    code: "IntStream.range(0, 8).parallel().forEachOrdered(sb::append);",
    runs: "01234567",
    tone: "good",
    why: "Giữ thứ tự gặp, nhưng phải chờ nhau nên mất bớt lợi ích song song.",
  },
  {
    label: "reduce(10, sum)",
    code: "Stream.of(1, 2, 3, 4).reduce(10, Integer::sum);             // tuần tự\nStream.of(1, 2, 3, 4).parallel().reduce(10, Integer::sum);  // song song",
    runs: "tuần tự 20 · song song 50",
    tone: "bad",
    why: "Mỗi phần dữ liệu đều bắt đầu từ 10. Giá trị khởi tạo phải là phần tử đơn vị: reduce(0, Integer::sum) ra 10 ở cả hai cách.",
  },
];

export function ParallelRaceWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.code}</pre>
      <div className={`result ${c.tone}`}>
        {c.runs}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
