import { useState } from "react";

/** Variants of Collectors.toMap over the lesson's 5 employees; every result was run on JDK 21. */
const CASES: { label: string; code: string; result: string; tone: "good" | "warn" | "bad"; why: string }[] = [
  {
    label: "key trùng",
    code: "toMap(Employee::dept, Employee::name)",
    result: "IllegalStateException: Duplicate key IT (attempted merging values An and Bình)",
    tone: "bad",
    why: "An và Bình cùng phòng IT. Không có merge function thì toMap không biết giữ giá trị nào.",
  },
  {
    label: "merge: giữ cái đầu",
    code: "toMap(Employee::dept, Employee::name, (a, b) -> a, TreeMap::new)",
    result: "{HR=Chi, IT=An, Sales=Em}",
    tone: "good",
    why: "Tham số 3 quyết định khi trùng key: ở đây giữ giá trị gặp trước.",
  },
  {
    label: "merge: nối tên",
    code: 'toMap(Employee::dept, Employee::name, (a, b) -> a + ", " + b, TreeMap::new)',
    result: "{HR=Chi, Dũng, IT=An, Bình, Sales=Em}",
    tone: "good",
    why: "Gộp hai value thành một chuỗi. Muốn ra List thì groupingBy + mapping gọn hơn.",
  },
  {
    label: "merge: cộng lương",
    code: "toMap(Employee::dept, Employee::salary, Double::sum)",
    result: "{Sales=2500.0, HR=3300.0, IT=5000.0}",
    tone: "warn",
    why: "Đúng số liệu nhưng là HashMap nên thứ tự key không đảm bảo.",
  },
  {
    label: "+ TreeMap::new",
    code: "toMap(Employee::dept, Employee::salary, Double::sum, TreeMap::new)",
    result: "{HR=3300.0, IT=5000.0, Sales=2500.0}",
    tone: "good",
    why: "Tham số 4 chọn loại Map: TreeMap sắp xếp key.",
  },
  {
    label: "value null",
    code: "toMap(Employee::name, e -> e.years() > 3 ? e.dept() : null)",
    result: "NullPointerException",
    tone: "bad",
    why: "Bình có 2 năm nên value là null. toMap không nhận value null: bản 2 tham số gọi Objects.requireNonNull(value), bản có merge function dùng Map.merge, cũng không nhận null.",
  },
  {
    label: "vòng for + put",
    code: "for (Employee e : emps) map.put(e.name(), e.years() > 3 ? e.dept() : null);",
    result: "{An=IT, Bình=null, Chi=HR, Dũng=null, Em=null}",
    tone: "good",
    why: "HashMap.put nhận value null, nên khi value có thể null thì dùng vòng for (in ra qua TreeMap cho dễ đọc).",
  },
];

export function ToMapTrapWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.code.startsWith("for") ? c.code : `emps.stream().collect(${c.code});`}</pre>
      <div className={`result ${c.tone}`}>
        {c.result}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
