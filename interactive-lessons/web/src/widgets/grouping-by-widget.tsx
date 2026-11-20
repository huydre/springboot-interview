import { useState } from "react";
import { Code } from "../components/code-block";

type Downstream = "list" | "counting" | "averaging" | "summing" | "names" | "maxName";
type MapKind = "hash" | "tree" | "linked";

const DOWNSTREAMS: { id: Downstream; code: string; note: string }[] = [
  { id: "list", code: "", note: "không có downstream: mỗi nhóm là List<Employee> (ở đây chỉ in tên)" },
  { id: "counting", code: "counting()", note: "Long: số phần tử mỗi nhóm" },
  { id: "averaging", code: "averagingDouble(Employee::salary)", note: "Double: lương trung bình" },
  { id: "summing", code: "summingDouble(Employee::salary)", note: "Double: tổng lương" },
  { id: "names", code: "mapping(Employee::name, toList())", note: "biến đổi từng phần tử rồi gom tiếp" },
  { id: "maxName", code: "collectingAndThen(maxBy(comparingDouble(Employee::salary)), o -> o.get().name())", note: "maxBy cho Optional, collectingAndThen mở ra lấy tên" },
];

const MAPS: { id: MapKind; code: string; label: string; note: string }[] = [
  { id: "hash", code: "", label: "mặc định (HashMap)", note: "HashMap: thứ tự key không đảm bảo" },
  { id: "tree", code: "TreeMap::new", label: "TreeMap::new", note: "TreeMap: key sắp xếp A → Z" },
  { id: "linked", code: "LinkedHashMap::new", label: "LinkedHashMap::new", note: "LinkedHashMap: giữ thứ tự xuất hiện (IT, HR, Sales)" },
];

/** groupingBy(Employee::dept, [mapFactory], [downstream]) over the lesson's 5 employees: every output below was run on JDK 21. */
const OUTPUT: Record<Downstream, Record<MapKind, string>> = {
  list: { hash: "{Sales=[Em], HR=[Chi, Dũng], IT=[An, Bình]}", tree: "{HR=[Chi, Dũng], IT=[An, Bình], Sales=[Em]}", linked: "{IT=[An, Bình], HR=[Chi, Dũng], Sales=[Em]}" },
  counting: { hash: "{Sales=1, HR=2, IT=2}", tree: "{HR=2, IT=2, Sales=1}", linked: "{IT=2, HR=2, Sales=1}" },
  averaging: { hash: "{Sales=2500.0, HR=1650.0, IT=2500.0}", tree: "{HR=1650.0, IT=2500.0, Sales=2500.0}", linked: "{IT=2500.0, HR=1650.0, Sales=2500.0}" },
  summing: { hash: "{Sales=2500.0, HR=3300.0, IT=5000.0}", tree: "{HR=3300.0, IT=5000.0, Sales=2500.0}", linked: "{IT=5000.0, HR=3300.0, Sales=2500.0}" },
  names: { hash: "{Sales=[Em], HR=[Chi, Dũng], IT=[An, Bình]}", tree: "{HR=[Chi, Dũng], IT=[An, Bình], Sales=[Em]}", linked: "{IT=[An, Bình], HR=[Chi, Dũng], Sales=[Em]}" },
  maxName: { hash: "{Sales=Em, HR=Dũng, IT=Bình}", tree: "{HR=Dũng, IT=Bình, Sales=Em}", linked: "{IT=Bình, HR=Dũng, Sales=Em}" },
};

export function GroupingByWidget() {
  const [down, setDown] = useState<Downstream>("counting");
  const [map, setMap] = useState<MapKind>("hash");
  const d = DOWNSTREAMS.find((x) => x.id === down)!;
  const m = MAPS.find((x) => x.id === map)!;
  // The 2-argument form takes a downstream only; the map factory needs the 3-argument form, which also needs a downstream.
  const needsToList = m.code && !d.code;
  const args = ["Employee::dept", m.code, d.code || (needsToList ? "toList()" : "")].filter(Boolean).join(",\n           ");
  return (
    <div className="widget">
      <div className="seg small">
        {DOWNSTREAMS.map((x) => <button key={x.id} className={down === x.id ? "on" : ""} onClick={() => setDown(x.id)}>{x.code ? x.code.split("(")[0] : "(không)"}</button>)}
      </div>
      <div className="seg small">
        {MAPS.map((x) => <button key={x.id} className={map === x.id ? "on" : ""} onClick={() => setMap(x.id)}>{x.label}</button>)}
      </div>
      <Code>{`emps.stream().collect(groupingBy(${args}));`}</Code>
      <div className={`result ${map === "hash" ? "warn" : "good"}`}>
        {OUTPUT[down][map]}
        <small>{d.note} · {m.note}</small>
      </div>
    </div>
  );
}
