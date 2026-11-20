import { useState } from "react";
import { Code } from "../components/code-block";

/**
 * Seven queries over dept (IT, Sales, HR with nobody) and employee (Khoa has dept_id NULL).
 * Results run on PostgreSQL 16; LEFT JOIN + count(*) for HR follows from its single all-NULL row.
 */
const CASES: { label: string; sql: string; rows: string[]; good: boolean; why: string }[] = [
  {
    label: "INNER JOIN + count(*)",
    sql: "select d.name, count(*)\nfrom dept d join employee e on e.dept_id = d.id\ngroup by d.name;",
    rows: ["IT | 4", "Sales | 3"],
    good: false,
    why: "HR không có ai nên biến mất khỏi báo cáo \"theo từng phòng\".",
  },
  {
    label: "LEFT JOIN + count(*)",
    sql: "select d.name, count(*)\nfrom dept d left join employee e on e.dept_id = d.id\ngroup by d.name;",
    rows: ["HR | 1", "IT | 4", "Sales | 3"],
    good: false,
    why: "HR có một dòng với e toàn NULL, count(*) đếm cả dòng đó thành 1.",
  },
  {
    label: "LEFT JOIN + count(e.id)",
    sql: "select d.name, count(e.id)\nfrom dept d left join employee e on e.dept_id = d.id\ngroup by d.name;",
    rows: ["HR | 0", "IT | 4", "Sales | 3"],
    good: true,
    why: "count(cột) bỏ qua NULL: HR đúng là 0.",
  },
  {
    label: "LEFT JOIN, lọc lương ở WHERE",
    sql: "select d.name, count(e.id)\nfrom dept d left join employee e on e.dept_id = d.id\nwhere e.salary > 2000\ngroup by d.name;",
    rows: ["IT | 3", "Sales | 3"],
    good: false,
    why: "WHERE chạy sau JOIN: dòng HR có e.salary NULL bị loại, LEFT JOIN thành INNER JOIN.",
  },
  {
    label: "LEFT JOIN, lọc lương ở ON",
    sql: "select d.name, count(e.id)\nfrom dept d left join employee e\n  on e.dept_id = d.id and e.salary > 2000\ngroup by d.name;",
    rows: ["HR | 0", "IT | 3", "Sales | 3"],
    good: true,
    why: "Điều kiện của bảng bên phải đặt trong ON thì vẫn giữ mọi phòng.",
  },
  {
    label: "Phòng chưa có ai: NOT IN",
    sql: "select d.name from dept d\nwhere d.id not in (select dept_id from employee);",
    rows: ["(0 dòng)"],
    good: false,
    why: "Subquery có NULL (Khoa). x <> NULL là UNKNOWN nên NOT IN không bao giờ TRUE.",
  },
  {
    label: "Phòng chưa có ai: NOT EXISTS",
    sql: "select d.name from dept d\nwhere not exists (\n  select 1 from employee e where e.dept_id = d.id);",
    rows: ["HR"],
    good: true,
    why: "An toàn với NULL. Trên 1 triệu order PostgreSQL chạy thành Hash Anti Join (648 ms, LEFT JOIN ... IS NULL mất 1086 ms).",
  },
];

export function JoinNullWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="two">
        <Code>{c.sql}</Code>
        <ul className="log">
          {c.rows.map((r) => <li key={r} className={c.good ? "ok" : "err"}>{r}</li>)}
        </ul>
      </div>
      <div className={`result ${c.good ? "good" : "bad"}`}>
        {c.good ? "Đúng" : "Sai âm thầm"}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
