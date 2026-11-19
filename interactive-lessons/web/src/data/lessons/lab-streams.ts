import timeline from "../timelines/lab-streams.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.02; expected outputs re-run from labs/java-labs/lab2-stream-queries on JDK 21 (Result: 20/20 passed).
export const labStreams: Lesson = {
  slug: "lab-streams",
  crumb: "Lab 2: Stream Queries",
  videoDir: "/videos/lab-streams",
  videoVersion: "de487f27",
  scenes: timeline as Scene[],
  title: "Lab 2: Stream Queries",
  subtitle:
    "20 truy vấn Stream trên 50 nhân viên, có bộ chấm điểm so chuỗi output, từ groupingBy cơ bản tới top N mỗi nhóm, teeing và so với trung bình của nhóm. Ít nhất 5 câu viết không có IDE gợi ý.",
  openingQuiz: {
    question: "Vì sao kết quả dạng Map trong lab phải dùng TreeMap::new?",
    options: ["Vì nhanh hơn", "Bộ chấm so chuỗi; HashMap in theo thứ tự hash nên FAIL dù số đúng", "Vì TreeMap thread-safe", "Không cần"],
    answer: 1,
    explain: "Đã đo: Q07 thiếu TreeMap::new ra [FINANCE, MARKETING, HR, IT, SALES].",
  },
  roadmap: [
    "Chặng 1: dữ liệu, bộ chấm điểm, Q01–Q06.",
    "Chặng 2: Q07–Q15.",
    "Chặng 3: Q16–Q20 và checklist.",
  ],
  sections: [
    {
      id: "setup",
      title: "Phần 1: Dữ liệu, bộ chấm điểm và mức dễ",
      scene: "setup",
      intro: [
        "Một file `StreamQueriesLab.java`: `record Employee(id, name, dept, salary, age, city, email, projects)` với 50 dòng (IT 16, SALES 11, FINANCE 8, MARKETING 8, HR 7; email có thể null, projects có thể rỗng), 20 method `q01()`–`q20()`, và bộ chấm so `String.valueOf(kết quả)` với chuỗi mong đợi, query ném exception vẫn chấm tiếp. Cách nhanh: copy file lời giải, xoá thân các method, tự viết lại.",
        "Q01–Q06: đếm theo phòng, lọc và sắp tên, tổng lương `1539`, người lương cao nhất `Nguyen Chi`, `anyMatch`/`allMatch` ra `true,false`, top 3 lương có tiêu chí phụ theo id. Luật: viết ít nhất 5 câu trong trình soạn thảo không autocomplete, để nhớ được `groupingBy`, `counting`, `collectingAndThen`, `Map.Entry.comparingByValue` như khi live coding.",
      ],
      widget: "stream-queries",
      widgetTitle: "20 câu: viết, dán output, chấm",
      quiz: {
        question: "Comparator.comparingInt(Employee::salary).reversed().thenComparingInt(Employee::id) sắp thế nào?",
        options: ["Lương giảm dần, id giảm dần", "Lương giảm dần, hoà thì id tăng dần", "Lương tăng dần", "Chỉ theo id"],
        answer: 1,
        explain: "reversed() đặt trước thenComparing chỉ đảo phần lương.",
      },
    },
    {
      id: "medium",
      title: "Phần 2: Mức trung bình, Q07–Q15",
      scene: "medium",
      intro: [
        "Trung bình mỗi phòng làm tròn (MARKETING 25,625 thành 25.63), lương cao thứ 2 cần `distinct()` (ra `47`), `partitioningBy` ra `{false=22, true=28}`, `toMap` có hàm merge, `joining` với prefix và suffix, `flatMap` cho project, đếm từ trong đoạn văn (`[spring=4, java=3, learn=3]`), Optional với email null ra `khanh4@corp.vn,N/A,N/A`.",
        "Hai lỗi đã chạy thử: `toMap(Employee::dept, Employee::salary)` ném `IllegalStateException: Duplicate key IT (attempted merging values 44 and 35)`; `groupingBy` thiếu `TreeMap::new` FAIL dù số đúng.",
      ],
      widget: "tomap-trap",
      widgetTitle: "Bẫy toMap",
      quiz: {
        question: "toMap với 2 tham số gặp key trùng thì sao?",
        options: ["Ghi đè giá trị cũ", "Ném IllegalStateException: Duplicate key", "Bỏ qua", "Gộp thành List"],
        answer: 1,
        explain: "Cần tham số thứ 3 là hàm merge, thứ 4 là map factory.",
      },
    },
    {
      id: "hard",
      title: "Phần 3: Mức khó, Q16–Q20",
      scene: "hard",
      intro: [
        "Top 3 mỗi phòng bằng `collectingAndThen(toList(), list -> ...)` (ở SALES, Tran An id 17 và Do Ngoc id 50 cùng 32 triệu nên tiêu chí phụ quyết định); `maxBy` bọc `collectingAndThen` để không còn `Optional`; `teeing` lấy min và max trong một lần duyệt (`min=12,max=49`); phòng trung bình cao nhất `IT`; người cao hơn trung bình phòng mình cần hai lần duyệt.",
        "Đoán trước những lỗi hay gặp ở widget bên dưới. Bốn câu phỏng vấn: lương cao thứ 2 và bẫy, bẫy của `toMap`, top N mỗi nhóm, `groupingBy` với `maxBy` trả về gì.",
      ],
      widget: "lab2-trap",
      widgetTitle: "Viết sai thì ra gì",
      quiz: {
        question: "groupingBy(dept, maxBy(...)) trả về Map với value kiểu gì?",
        options: ["Employee", "Optional<Employee>", "List<Employee>", "Integer"],
        answer: 1,
        explain: "Bỏ Optional bằng collectingAndThen.",
      },
    },
    {
      id: "checklist",
      title: "Phần 4: Checklist hoàn thành",
      scene: "checklist",
      intro: ["Lời giải ở `labs/java-labs/lab2-stream-queries/`. Viết lại Q16 và Q20 lần thứ hai trong 5 phút, không nhìn lời giải."],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 2",
    },
  ],
  modelAnswer:
    "Em làm 20 truy vấn Stream trên dữ liệu 50 nhân viên, có bộ chấm so chuỗi output, và viết ít nhất 5 câu không có IDE gợi ý. Những bẫy em gặp thật: toMap hai tham số ném Duplicate key khi trùng phòng, phải thêm hàm merge; groupingBy không có TreeMap thì thứ tự key theo hash; lương cao thứ 2 phải distinct trước skip; maxBy trả Optional nên bọc collectingAndThen. Top N mỗi nhóm em viết bằng groupingBy với collectingAndThen sắp rồi limit, và luôn có tiêu chí phụ khi hoà để kết quả không phụ thuộc thứ tự dữ liệu.",
};
