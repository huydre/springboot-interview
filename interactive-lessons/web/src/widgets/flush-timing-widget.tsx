import { StepThrough, type Step } from "../components/step-through";

/** INSERT count after each statement in one transaction, FlushMode.AUTO; Hibernate 6.6 + PostgreSQL 16 (study note 05.06). */
const STEPS: Step[] = [
  { step: "em.persist(new Customer(\"Flush\"))", detail: "INSERT đã chạy: 0", note: "Id lấy từ sequence, INSERT còn chờ trong persistence context." },
  { step: "JPQL select count(p) from Product p", detail: "INSERT đã chạy: 0", note: "Query không đụng bảng customer nên Hibernate không flush." },
  { step: "JPQL select count(c) from Customer c", detail: "INSERT đã chạy: 1", note: "Kết quả có thể bị ảnh hưởng nên flush trước để count thấy bản ghi mới.", highlight: true },
  { step: "em.persist(new Customer(\"Flush2\"))", detail: "INSERT đã chạy: 1", note: "Lại chờ." },
  { step: "native select count(*) from customer", detail: "INSERT đã chạy: 2", note: "Hibernate không phân tích được SQL thuần nên flush tất cả.", highlight: true },
  { step: "commit", detail: "Flush trước commit (nếu còn gì chờ)", note: "Flush không phải commit: rollback vẫn huỷ cả phần đã flush. IDENTITY thì persist phải INSERT ngay: 1000 persist ra 1000 câu INSERT." },
];

export function FlushTimingWidget() {
  return <StepThrough steps={STEPS} />;
}
