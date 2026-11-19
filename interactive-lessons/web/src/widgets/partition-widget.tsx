import { useState } from "react";

type Kind = "partitioningBy" | "groupingBy";
type Data = "ge5" | "ge10" | "empty";

const DATA: { id: Data; label: string; stream: string; pred: string }[] = [
  { id: "ge5", label: "years >= 5", stream: "emps.stream()", pred: "e -> e.years() >= 5" },
  { id: "ge10", label: "years >= 10 (không ai)", stream: "emps.stream()", pred: "e -> e.years() >= 10" },
  { id: "empty", label: "stream rỗng", stream: "emps.stream().filter(e -> e.years() > 100)", pred: "e -> e.years() >= 5" },
];

/** partitioningBy vs groupingBy on the same boolean classifier (names only); every output was run on JDK 21. */
const OUTPUT: Record<Kind, Record<Data, string>> = {
  partitioningBy: { ge5: "{false=[Bình, Dũng, Em], true=[An, Chi]}", ge10: "{false=[An, Bình, Chi, Dũng, Em], true=[]}", empty: "{false=[], true=[]}" },
  groupingBy: { ge5: "{false=[Bình, Dũng, Em], true=[An, Chi]}", ge10: "{false=[An, Bình, Chi, Dũng, Em]}", empty: "{}" },
};

export function PartitionWidget() {
  const [kind, setKind] = useState<Kind>("partitioningBy");
  const [data, setData] = useState<Data>("ge10");
  const d = DATA.find((x) => x.id === data)!;
  const out = OUTPUT[kind][data];
  const missing = kind === "groupingBy" && data !== "ge5";
  return (
    <div className="widget">
      <div className="seg">
        {(["partitioningBy", "groupingBy"] as Kind[]).map((k) => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{k}</button>)}
      </div>
      <div className="seg small">
        {DATA.map((x) => <button key={x.id} className={data === x.id ? "on" : ""} onClick={() => setData(x.id)}>{x.label}</button>)}
      </div>
      <pre className="code">{`${d.stream}
    .collect(${kind}(${d.pred},
             mapping(Employee::name, toList())));`}</pre>
      <div className={`result ${missing ? "warn" : "good"}`}>
        {out}
        <small>
          {missing
            ? "groupingBy chỉ tạo key cho nhóm có phần tử: map.get(true) trả về null"
            : kind === "partitioningBy"
              ? "partitioningBy luôn có đủ hai key true và false, kể cả khi nhóm rỗng"
              : "Có đủ phần tử cho cả hai nhóm nên hai cách ra cùng kết quả"}
        </small>
      </div>
    </div>
  );
}
