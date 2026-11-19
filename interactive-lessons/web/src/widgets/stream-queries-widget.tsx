import { useState } from "react";
import { RichText } from "../components/rich-text";

type Q = { id: string; task: string; expected: string; hint: string };

/** Lab 2's 20 queries; expected strings are the grader output of labs/java-labs/lab2-stream-queries on JDK 21 (20/20 passed). */
const QS: Q[] = [
  { id: "q01", task: "Số nhân viên mỗi phòng, sắp theo tên phòng", expected: "{FINANCE=8, HR=7, IT=16, MARKETING=8, SALES=11}", hint: "`groupingBy(Employee::dept, TreeMap::new, counting())`" },
  { id: "q02", task: "Tên nhân viên phòng IT ở HN, sắp A-Z", expected: "[Hoang Nam, Nguyen Hoa, Nguyen Viet, Pham Ha, Pham Son, Pham Thao]", hint: "`filter` hai điều kiện, `map(Employee::name)`, `sorted()`, `toList()`" },
  { id: "q03", task: "Tổng quỹ lương cả công ty", expected: "1539", hint: "`mapToInt(Employee::salary).sum()`, tránh `reduce` vì boxing" },
  { id: "q04", task: "Tên người lương cao nhất", expected: "Nguyen Chi", hint: "`max(Comparator.comparingInt(...))` trả Optional, nhớ `map(Employee::name)` rồi `orElse`" },
  { id: "q05", task: "Có ai dưới 23 tuổi không? Mọi người đều lương >= 15 không? Trả \"a,b\"", expected: "true,false", hint: "`anyMatch`, `allMatch` là terminal short-circuit" },
  { id: "q06", task: "Top 3 lương cao nhất dạng \"tên=lương\", hoà thì id nhỏ trước", expected: "[Nguyen Chi=49, Pham Son=47, Nguyen Viet=47]", hint: "`comparingInt(...).reversed().thenComparingInt(Employee::id)`: `reversed()` đặt trước chỉ đảo phần lương" },
  { id: "q07", task: "Lương trung bình mỗi phòng, làm tròn 2 chữ số", expected: "{FINANCE=30.88, HR=22.57, IT=38.31, MARKETING=25.63, SALES=28.73}", hint: "`averagingInt`, rồi `replaceAll((k, v) -> Math.round(v * 100) / 100.0)`; thiếu `TreeMap::new` thì key ra theo thứ tự hash" },
  { id: "q08", task: "Mức lương cao thứ 2 (khác mức cao nhất)", expected: "47", hint: "`distinct()` trước `skip(1)`" },
  { id: "q09", task: "Chia nhóm lương >= 30 và < 30, đếm mỗi nhóm", expected: "{false=22, true=28}", hint: "`partitioningBy(x -> x.salary() >= 30, counting())`" },
  { id: "q10", task: "Phòng → lương cao nhất, bằng toMap", expected: "{FINANCE=42, HR=29, IT=49, MARKETING=39, SALES=42}", hint: "`toMap(dept, salary, Math::max, TreeMap::new)`; thiếu hàm merge thì `Duplicate key IT (attempted merging values 44 and 35)`" },
  { id: "q11", task: "Tên phòng HR nối bằng \", \", bọc [ ]", expected: "[Bui Khanh, Ngo Dung, Pham Long, Ngo Ha, Pham Dung, Do Giang, Tran Minh]", hint: "`joining(\", \", \"[\", \"]\")`" },
  { id: "q12", task: "Tất cả project khác nhau, sắp A-Z", expected: "[CRM, Mobile, Order, Payment, Report, Search]", hint: "`flatMap(x -> x.projects().stream())`, `distinct()`, `sorted()`" },
  { id: "q13", task: "Mỗi project có bao nhiêu người", expected: "{CRM=13, Mobile=15, Order=14, Payment=13, Report=14, Search=15}", hint: "`flatMap` rồi `groupingBy(p -> p, TreeMap::new, counting())`" },
  { id: "q14", task: "3 từ xuất hiện nhiều nhất trong TEXT (không phân biệt hoa thường; hoà thì A-Z)", expected: "[spring=4, java=3, learn=3]", hint: "`split(\"\\\\W+\")`, `groupingBy(w -> w, counting())`, stream lại `entrySet()` với `comparingByValue().reversed()` rồi theo key" },
  { id: "q15", task: "Email của id 4, id 5 (email null), id 999; thiếu thì N/A", expected: "khanh4@corp.vn,N/A,N/A", hint: "`findFirst().map(Employee::email)`: email null cho Optional rỗng, không NPE" },
  { id: "q16", task: "Top 3 lương cao nhất mỗi phòng (tên), hoà thì id nhỏ trước", expected: "{FINANCE=[Do Mai, Do Huy, Dang Lan], HR=[Bui Khanh, Do Giang, Ngo Dung], IT=[Nguyen Chi, Pham Son, Nguyen Viet], MARKETING=[Le Mai, Le Dung, Hoang Minh], SALES=[Tran Hoa, Do Khanh, Tran An]}", hint: "`groupingBy(dept, TreeMap::new, collectingAndThen(toList(), list -> ...sorted(...).limit(3)...))`; SALES: Tran An (17) và Do Ngoc (50) cùng 32" },
  { id: "q17", task: "Tên người lương cao nhất mỗi phòng, dùng maxBy, không chứa Optional", expected: "{FINANCE=Do Mai, HR=Bui Khanh, IT=Nguyen Chi, MARKETING=Le Mai, SALES=Tran Hoa}", hint: "`collectingAndThen(maxBy(...), opt -> opt.map(Employee::name).orElse(\"N/A\"))`" },
  { id: "q18", task: "Một lần duyệt lấy cả lương thấp nhất và cao nhất", expected: "min=12,max=49", hint: "`teeing(minBy(...), maxBy(...), (a, b) -> ...)` trên Employee với comparator rõ kiểu" },
  { id: "q19", task: "Phòng có lương trung bình cao nhất", expected: "IT", hint: "Map trung bình rồi `entrySet().stream().max(Map.Entry.comparingByValue())`" },
  { id: "q20", task: "Mỗi phòng có bao nhiêu người lương cao hơn trung bình của phòng mình", expected: "{FINANCE=6, HR=3, IT=8, MARKETING=4, SALES=6}", hint: "Hai lần duyệt: lần 1 Map trung bình, lần 2 lọc theo `avgByDept.get(x.dept())`" },
];

/** Pick a query, write it in Java, paste what your program printed, and compare with the real expected output. */
export function StreamQueriesWidget() {
  const [i, setI] = useState(0);
  const [hint, setHint] = useState(false);
  const [mine, setMine] = useState<Record<string, string>>({});
  const q = QS[i];
  const pasted = (mine[q.id] ?? "").trim();
  const passed = QS.filter((x) => (mine[x.id] ?? "").trim() === x.expected).length;
  return (
    <div className="widget">
      <div className="seg small">
        {QS.map((x, n) => {
          const ok = (mine[x.id] ?? "").trim() === x.expected;
          return <button key={x.id} className={i === n ? "on" : ok ? "truth" : ""} onClick={() => { setI(n); setHint(false); }}>{x.id.toUpperCase()}</button>;
        })}
      </div>
      <div className="result">
        {q.id.toUpperCase()} · {q.task}
        <small>{n(i)}</small>
      </div>
      <div className="seg small">
        <button onClick={() => setHint((h) => !h)}>{hint ? "ẩn gợi ý" : "gợi ý"}</button>
      </div>
      {hint && <p className="muted"><RichText text={q.hint} /></p>}
      <div className="pick">
        <span>Dán dòng output của bạn (phần sau "-&gt;")</span>
        <input value={mine[q.id] ?? ""} onChange={(e) => setMine((s) => ({ ...s, [q.id]: e.target.value }))} placeholder="ví dụ {FINANCE=8, ...}" />
      </div>
      {pasted && (
        <div className={`result ${pasted === q.expected ? "good" : "bad"}`}>
          {pasted === q.expected ? "PASS" : "FAIL"}
          {pasted !== q.expected && <small>expected: {q.expected}</small>}
        </div>
      )}
      <p className="muted">Đã PASS {passed}/20 trong phiên này. Nên viết ít nhất 5 câu (gợi ý Q07, Q08, Q10, Q14, Q16) không có IDE gợi ý.</p>
    </div>
  );
}

function n(i: number): string {
  return i < 6 ? "Mức dễ" : i < 15 ? "Mức trung bình" : "Mức khó";
}
