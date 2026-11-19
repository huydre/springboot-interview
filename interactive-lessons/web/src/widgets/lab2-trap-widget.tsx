import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Mistakes the lab 2 grader catches, with outputs measured on JDK 21 (study note 11.02). */
const ITEMS: ChoiceItem[] = [
  { q: "Q10 viết toMap(Employee::dept, Employee::salary)", choices: ["Chạy đúng", "IllegalStateException: Duplicate key"], a: "IllegalStateException: Duplicate key", why: "Output thật: Duplicate key IT (attempted merging values 44 and 35). Cần hàm merge Math::max." },
  { q: "Q07 groupingBy không có TreeMap::new", choices: ["PASS", "FAIL dù số đúng"], a: "FAIL dù số đúng", why: "Key ra theo thứ tự hash [FINANCE, MARKETING, HR, IT, SALES]; bộ chấm so chuỗi." },
  { q: "Q08 bỏ distinct() trước skip(1)", choices: ["Vẫn đúng mọi lúc", "Sai khi 2 người cùng lương cao nhất"], a: "Sai khi 2 người cùng lương cao nhất", why: "Khi đó \"cao thứ 2\" bằng cao nhất." },
  { q: "Q17 quên collectingAndThen", choices: ["{FINANCE=Do Mai, ...}", "{FINANCE=Optional[Employee[...]], ...}"], a: "{FINANCE=Optional[Employee[...]], ...}", why: "maxBy trả Optional<Employee>; bọc bằng collectingAndThen để lấy tên." },
  { q: "Q06 không có thenComparingInt(Employee::id)", choices: ["Vẫn ra đúng ở dữ liệu này", "Luôn sai"], a: "Vẫn ra đúng ở dữ liệu này", why: "sorted là stable nên giữ thứ tự gặp; đừng dựa vào điều đó khi nguồn dữ liệu đổi." },
  { q: "Q18 teeing(minBy(naturalOrder()), maxBy(naturalOrder()), ...) trên Stream<Integer>", choices: ["Compile được", "Lỗi suy luận kiểu khi compile"], a: "Lỗi suy luận kiểu khi compile", why: "Đã thử trên JDK 21. Làm trên Employee với comparator rõ kiểu." },
  { q: "Q15 dùng Optional.of(email) với email null", choices: ["Ra N/A", "NullPointerException"], a: "NullPointerException", why: "Dùng .map(Employee::email): null thành Optional rỗng." },
];

export function Lab2TrapWidget() {
  return <ChoiceDrill items={ITEMS} summary="Kết quả Map phải có thứ tự cố định mới so chuỗi được; tiêu chí phụ khi hoà phải viết rõ." />;
}
