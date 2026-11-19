import { useState } from "react";

type Mode = "field" | "local";

/** Two requests interleaved inside one singleton ReportService (the scenario from study note 04.02). */
export function SingletonStateWidget() {
  const [mode, setMode] = useState<Mode>("field");
  const field = mode === "field";
  const steps = field
    ? ["A: currentUser = alice", "B: currentUser = bob", "A: render() đọc currentUser → bob", "B: render() đọc currentUser → bob"]
    : ["A: User user = alice (biến cục bộ)", "B: User user = bob (biến cục bộ)", "A: render(user) → alice", "B: render(user) → bob"];
  return (
    <div className="widget">
      <div className="seg small">
        <button className={field ? "on" : ""} onClick={() => setMode("field")}>lưu user vào field</button>
        <button className={!field ? "on" : ""} onClick={() => setMode("local")}>truyền qua tham số</button>
      </div>
      <pre className="code">{field
        ? "@Service class ReportService {\n    private User currentUser;          // dùng chung cho mọi thread\n    Report build(Long id) {\n        currentUser = userRepo.findById(id).orElseThrow();\n        return render();\n    }\n}"
        : "@Service class ReportService {\n    Report build(Long id) {\n        User user = userRepo.findById(id).orElseThrow();\n        return render(user);           // stateless\n    }\n}"}</pre>
      <ol className="log">
        {steps.map((s) => <li key={s} className={s.includes("A: render") ? (field ? "err" : "ok") : ""}>{s}</li>)}
      </ol>
      <div className={`result ${field ? "bad" : "good"}`}>
        {field ? "User A thấy báo cáo của user B" : "Mỗi request dùng dữ liệu của mình"}
        <small>
          Singleton có 1 instance cho mọi request trên 200 worker thread của Tomcat. Bug này không lộ khi test bằng tay, chỉ lộ khi tải cao.
          Đã đo cùng hiện tượng: 8 thread gọi count++ tổng 100.000 lần trên field của singleton ra 99.791.
        </small>
      </div>
    </div>
  );
}
