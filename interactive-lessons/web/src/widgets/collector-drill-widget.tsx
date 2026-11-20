import { useState } from "react";
import { Code } from "../components/code-block";

/** The study notes' 10 hand-writing drills; every answer was run on JDK 21 and prints the output shown. */
const DRILLS: { task: string; answer: string; output: string }[] = [
  { task: "Danh sách tên nhân viên phòng IT", answer: 'emps.stream().filter(e -> e.dept().equals("IT")).map(Employee::name).toList();', output: "[An, Bình]" },
  { task: "Tổng lương toàn công ty", answer: "emps.stream().mapToDouble(Employee::salary).sum();", output: "10800.0" },
  { task: "Số nhân viên mỗi phòng", answer: "emps.stream().collect(groupingBy(Employee::dept, counting()));", output: "{Sales=1, HR=2, IT=2}" },
  { task: "Lương trung bình mỗi phòng", answer: "emps.stream().collect(groupingBy(Employee::dept, averagingDouble(Employee::salary)));", output: "{Sales=2500.0, HR=1650.0, IT=2500.0}" },
  { task: "Tên 3 người lương cao nhất", answer: "emps.stream()\n    .sorted(Comparator.comparingDouble(Employee::salary).reversed())\n    .limit(3).map(Employee::name).toList();", output: "[Bình, Em, An]" },
  { task: "Mức lương cao thứ 2 (bằng nhau tính là một)", answer: "emps.stream().map(Employee::salary).distinct()\n    .sorted(Comparator.reverseOrder()).skip(1).findFirst().orElseThrow();", output: "2500.0" },
  { task: "Tên người lương cao nhất mỗi phòng", answer: "emps.stream().collect(groupingBy(Employee::dept,\n    collectingAndThen(maxBy(Comparator.comparingDouble(Employee::salary)),\n                      o -> o.get().name())));", output: "{Sales=Em, HR=Dũng, IT=Bình}" },
  { task: "Chia 2 nhóm: từ 5 năm kinh nghiệm và dưới 5 năm (chỉ lấy tên)", answer: "emps.stream().collect(partitioningBy(e -> e.years() >= 5,\n    mapping(Employee::name, toList())));", output: "{false=[Bình, Dũng, Em], true=[An, Chi]}" },
  { task: 'Đếm số lần xuất hiện mỗi từ trong "the cat and the hat"', answer: 'Arrays.stream("the cat and the hat".split(" "))\n    .collect(groupingBy(Function.identity(), TreeMap::new, counting()));', output: "{and=1, cat=1, hat=1, the=2}" },
  { task: "Map phòng ban → tổng lương, key sắp xếp A → Z", answer: "emps.stream().collect(toMap(Employee::dept, Employee::salary, Double::sum, TreeMap::new));", output: "{HR=3300.0, IT=5000.0, Sales=2500.0}" },
];

export function CollectorDrillWidget() {
  const [shown, setShown] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="widget">
      <p className="muted">Tự viết ra giấy trước, rồi mới mở đáp án. Dữ liệu: An IT 2000 5 năm · Bình IT 3000 2 năm · Chi HR 1500 7 năm · Dũng HR 1800 1 năm · Em Sales 2500 3 năm.</p>
      <ul className="classify">
        {DRILLS.map((d, i) => (
          <li key={d.task} className={shown.has(i) ? "ok" : ""}>
            <span>Bài {i + 1}. {d.task}</span>
            <button className="btn ghost" onClick={() => toggle(i)}>{shown.has(i) ? "Ẩn" : "Xem đáp án"}</button>
            {shown.has(i) && (
              <div className="why">
                <Code>{d.answer}</Code>
                <div className="result good">{d.output}</div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="actions"><span className="score">Đã mở {shown.size}/{DRILLS.length}</span></div>
    </div>
  );
}
