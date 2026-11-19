import { useState } from "react";

const JOURNAL = "Đã ghi vào nhật ký học tập và thêm ví dụ vào hồ sơ dự án & STAR";

/** "Checklist hoàn thành" of each lab in study notes 11.01–11.07, keyed by lesson slug. */
const CHECKLISTS: Record<string, string[]> = {
  "lab-collections": [
    "LruCacheLab.java: 5/5 PASS, giải thích được vì sao containsKey không đổi thứ tự",
    "EqualsHashCodeLab.java: tái hiện được size=2 và sửa bằng cả hashCode lẫn record",
    "ConcurrentModificationLab.java: tái hiện CME và case áp chót không lỗi, sửa bằng 3 cách",
    "Bonus MutableKeyLab.java: giải thích được vì sao cả 2 lệnh get đều trả null",
    "Trả lời to 4 câu phỏng vấn, mỗi câu dưới 90 giây",
    JOURNAL,
  ],
  "lab-streams": [
    "Bộ chấm điểm chạy được, in Result: 20/20 passed",
    "Ít nhất 5 câu viết không có IDE gợi ý (ghi số câu vào nhật ký)",
    "Tự tái hiện được lỗi Duplicate key của toMap và sửa bằng hàm merge",
    "Giải thích được vì sao Q08 cần distinct() và Q16 cần tiêu chí phụ theo id",
    "Viết lại Q16 và Q20 lần thứ hai trong 5 phút, không nhìn lời giải",
    "Trả lời to 4 câu phỏng vấn",
    JOURNAL,
  ],
  "lab-concurrency": [
    "RaceConditionLab.java: count++ sai, 3 cách sửa đều ra 1.000.000, có bảng thời gian của máy mình",
    "Giải thích được vì sao volatile không sửa được count++",
    "DeadlockLab.java: tạo deadlock chắc chắn, đọc được đoạn \"Found one Java-level deadlock\" trong jstack",
    "Phát hiện deadlock bằng ThreadMXBean và sửa bằng lock ordering",
    "CompletableFutureLab.java: song song nhanh hơn tuần tự, timeout và exception đều trả fallback",
    "Nói được khác nhau giữa orTimeout và completeOnTimeout, và vì sao cần executor riêng",
    "Trả lời to 4 câu phỏng vấn",
    JOURNAL,
  ],
  "lab-order-setup": [
    "Project chạy được: docker compose up -d và ./mvnw spring-boot:run với profile dev",
    "4 entity với quan hệ LAZY, mappedBy; không controller nào trả entity",
    "POST /orders trả 201 + Location, kho giảm đúng; đơn lỗi thì kho không đổi",
    "Advice trả đúng 400 (có errors), 404, 422 (có code); @WebMvcTest assert được body",
    "/actuator/health UP, /actuator/env 404",
    "Log TIMED ... xuất hiện cả khi method ném exception",
    "Đọc và giải thích được 3 dòng trong Condition Evaluation Report",
    "./mvnw test xanh",
    "Trả lời to 4 câu phỏng vấn",
    JOURNAL,
  ],
  "lab-tx-bugs": [
    "Lab5TestBase chạy trên PostgreSQL Testcontainers, không có @Transactional, mỗi test tự seed lại",
    "Bài 1: đo được txActive=false qua this, kho bị trừ dở; bản sửa giữ kho 10",
    "Bài 2: checked exception để lại 1 đơn + email; rollbackFor đưa về 0",
    "Bài 3: audit REQUIRED mất, REQUIRES_NEW còn 1 dòng; đọc được dòng Suspending current transaction",
    "Bài 4: assert đúng message Transaction silently rolled back because it has been marked as rollback-only",
    "Bài 5: rollback thì AFTER_COMMIT không gửi, @EventListener có gửi; ghi DB trong AFTER_COMMIT cần REQUIRES_NEW",
    "./mvnw test xanh toàn bộ",
    "Trả lời to 4 câu phỏng vấn, có số liệu của mình",
    JOURNAL,
  ],
  "lab-jpa-perf": [
    "Bật được log SQL và Hibernate statistics; đếm statement bằng getPrepareStatementCount() trong test",
    "Bài 1: NAIVE 16 câu, giải thích được vì sao là 1 + 10 + 5; JOIN_FETCH và ENTITY_GRAPH 1 câu; batch size 50 còn 3 câu",
    "Bài 2: assert đúng ObjectOptimisticLockingFailureException với cause StaleObjectStateException, stock 9",
    "Bài 2: UPDATE nguyên tử cho stock 8 với 2 thread và 0 với 20 thread; hiểu vì sao barrier phải ở ngoài transaction",
    "Bài 3: seed 100k đơn, đọc được 3 plan, chỉ ra Index Cond vs Filter và node Sort biến mất",
    "./mvnw test xanh toàn bộ",
    "Trả lời to 5 câu phỏng vấn, có số liệu của mình",
    JOURNAL,
  ],
  "lab-jwt-cache-tests": [
    "POST /auth/login trả token HS256; tự giải mã được header và payload",
    "Thấy đủ 4 trường hợp: không token 401, token sửa chữ ký 401 invalid_token, USER tạo product 403, USER đặt hàng 201",
    "Login sai trả 401 ProblemDetail, không phải 500",
    "Cache: đo được 1 SELECT cho 3 lần GET, TTL 600, PUT xoá key; đặt hàng làm mới stock trong cache",
    "Viết đủ @WebMvcTest + @MockitoBean, @DataJpaTest trên PostgreSQL, integration test Testcontainers @ServiceConnection",
    "Giải thích được vì sao @WebMvcTest không import SecurityConfig thì ra 401",
    "./mvnw test xanh toàn bộ, test cũ của Lab 4 và 5 vẫn chạy",
    "Trả lời to 5 câu phỏng vấn, có số liệu của mình",
    JOURNAL,
  ],
};
const KEY = "lab-checklists";

/** Ticks persist in this browser so a lab can span several sittings. The lab is the lesson in the URL. */
export function LabChecklistWidget() {
  const slug = new URLSearchParams(location.search).get("bai") ?? "";
  const items = CHECKLISTS[slug] ?? [];
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
  });
  const toggle = (k: string) => {
    const next = { ...done, [k]: !done[k] };
    setDone(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const n = items.filter((_, i) => done[`${slug}:${i}`]).length;
  return (
    <div className="widget">
      <ul className="log">
        {items.map((it, i) => {
          const k = `${slug}:${i}`;
          return <li key={k} className={done[k] ? "ok" : ""}><label><input type="checkbox" checked={!!done[k]} onChange={() => toggle(k)} /> {it}</label></li>;
        })}
      </ul>
      <div className={`result ${n === items.length ? "good" : ""}`}>
        {n}/{items.length} mục đã xong
        <small>Lưu trong trình duyệt này. Tự làm trước, bí quá 15 phút mới mở gợi ý, vẫn bí mới xem lời giải trong labs/.</small>
      </div>
    </div>
  );
}
