import timeline from "../timelines/lab-jpa-perf.json";
import type { Lesson, Scene } from "../types";

// Lab from study note 11.06 on order-service with PostgreSQL Testcontainers; statement counts from Hibernate statistics,
// plans from EXPLAIN (ANALYZE, BUFFERS). Solution: labs/order-service/. Video not rendered yet: scenes stay empty until publish.
export const labJpaPerf: Lesson = {
  slug: "lab-jpa-perf",
  crumb: "Lab 6: N+1, Locking & Index",
  videoDir: "/videos/lab-jpa-perf",
  videoVersion: "58fc4057",
  scenes: timeline as Scene[],
  title: "Lab 6: N+1, Locking & Index",
  subtitle:
    "Đếm N+1 ở GET /orders và ba cách sửa, hai thread cùng trừ kho với @Version và UPDATE nguyên tử, 100 000 đơn hàng với EXPLAIN ANALYZE trước và sau composite index.",
  openingQuiz: {
    question: "Đếm số câu SQL trong test bằng gì để assert được?",
    options: ["Đọc log bằng mắt", "Hibernate statistics: getPrepareStatementCount()", "Đếm dòng log", "APM"],
    answer: 1,
    explain: "Bật hibernate.generate_statistics, stats.clear() trước request rồi đọc số statement.",
  },
  roadmap: [
    "Chặng 1: N+1 và ba cách sửa.",
    "Chặng 2: hai thread cùng trừ kho.",
    "Chặng 3: EXPLAIN ANALYZE và composite index.",
  ],
  sections: [
    {
      id: "n-plus-one",
      title: "Phần 1: N+1 ở GET /orders",
      scene: "nplusone",
      intro: [
        "Seed 10 đơn × 3 dòng trên 5 sản phẩm, thêm `?fetch=NAIVE|JOIN_FETCH|ENTITY_GRAPH`, một test riêng bật `default_batch_fetch_size=50`. Log SQL bằng `logging.level.org.hibernate.SQL=debug`, đếm bằng `Statistics.getPrepareStatementCount()`. Chạy `./mvnw test -Dtest='com.shop.orderservice.lab6.*Test'`.",
        "Đã đo: NAIVE **16** = 1 + 10 + 5 (1 câu lấy order, 10 câu lấy items của từng order, 5 câu lấy 5 product); JOIN_FETCH và ENTITY_GRAPH **1** (cùng một câu SQL); batch 50 **3** với `= any (?)`. N+1 thực chất là 1 + N + P khi có thêm cấp product.",
        "Vì sao batch 50 ra 3 chứ không phải 2 như bài N+1: ở bài đó chỉ có hai cấp (order, items). Ở đây có ba cấp, và batch fetching gom được mỗi cấp thành một câu: 1 câu orders, 1 câu items của cả 10 order, 1 câu product của cả 5 sản phẩm.",
      ],
      widget: "orders-fetch",
      widgetTitle: "Đếm statement của GET /orders",
      quiz: {
        question: "JOIN FETCH và @EntityGraph khác nhau ở đâu trong lab này?",
        options: ["Số query", "Chỉ khác cách viết; sinh cùng một câu SQL", "EntityGraph dùng inner join", "JOIN FETCH chậm hơn"],
        answer: 1,
        explain: "Đã đo cùng 1 statement, cùng câu SQL.",
      },
    },
    {
      id: "locking",
      title: "Phần 2: Hai thread cùng trừ kho",
      scene: "locking",
      intro: [
        "Thêm `@Version` vào `Product`. Test không `@Transactional`: 2 thread, mỗi thread một `TransactionTemplate`, cùng đọc stock 10, chờ nhau bằng `CyclicBarrier` (điểm hẹn: thread nào tới trước phải đứng chờ đủ số thread mới cùng đi tiếp), rồi trừ 1. Bên thua: `ObjectOptimisticLockingFailureException`, cause `StaleObjectStateException`, stock **9**.",
        "**Stock 9 ở đây là kết quả đúng**, khác với bài Isolation nơi 9 là bug lost update. Ở bài Isolation cả hai bên đều tưởng mình mua được và một lượt bị mất im lặng. Ở đây bên thắng trừ thật, còn bên thua **bị từ chối rõ ràng** bằng exception, không có lượt nào mất trong im lặng; ứng dụng phải retry hoặc báo người dùng.",
        "`decreaseStockAtomically` chạy `UPDATE ... SET stock = stock - ? WHERE id = ? AND stock >= ?`. DB khoá dòng khi UPDATE, thread thứ hai phải chờ, rồi kiểm tra lại điều kiện trên giá trị mới nhất trước khi trừ. Đã đo: 2 thread ra **8**, cả hai thành công; 20 thread mua khi còn 10 thì đúng 10 thành công, stock **0**, không âm.",
      ],
      trap: {
        title: "Đặt barrier trong transaction thì test treo",
        text: "Test 20 thread dùng pool 10 connection. Nếu mỗi thread mở transaction (lấy connection) rồi mới chờ ở barrier, 10 thread đầu giữ hết 10 connection và đứng chờ đủ 20 bên, còn 10 thread kia chờ connection không bao giờ được trả: barrier không bao giờ mở, test treo. Phải chờ ở barrier **trước** khi mở transaction.",
      },
      widget: "stock-race-lab",
      widgetTitle: "Nhiều thread cùng mua",
      quiz: {
        question: "Vì sao barrier phải đặt ngoài transaction?",
        options: ["Cho đẹp code", "Trong transaction thì mỗi thread giữ connection rồi chờ nhau, dễ treo vì cạn pool", "Vì CyclicBarrier không thread-safe", "Không quan trọng"],
        answer: 1,
        explain: "Đúng với cảnh báo về giữ connection lâu.",
      },
    },
    {
      id: "explain",
      title: "Phần 3: 100 000 đơn và composite index",
      scene: "explain",
      intro: [
        "Seed 1 000 khách và 100 000 đơn bằng `generate_series` (60% PAID, 30% CREATED, 10% CANCELLED, rải 365 ngày), nhớ `ANALYZE orders`. Query \"đơn PAID của tôi, mới nhất trước, 20 dòng\". `EXPLAIN (ANALYZE, BUFFERS)` 5 lần cho mỗi trạng thái.",
        "Đã đo: không index `Seq Scan`, 846 page, 5,2–6,0 ms; `(customer_id)` Bitmap scan, `status` vẫn là Filter, 98 page; `(customer_id, status, created_at)` `Index Scan Backward`, không Sort, **23 page**, 0,027–0,082 ms. Khai báo index ngay trên entity để `ddl-auto` tạo.",
        "Đọc plan: **Index Cond** là điều kiện được dùng để tìm trong index, còn **Filter** là điều kiện chỉ được kiểm tra sau khi đã lấy dòng ra, dòng không khớp bị bỏ (`Rows Removed by Filter`). Index chỉ có `customer_id` thì `status` rơi vào Filter; composite index đưa cả `status` vào Index Cond.",
        "Quy tắc xếp cột cho composite index: **cột so sánh bằng đặt trước** (`customer_id = ?`, `status = ?`), **cột sắp xếp đặt sau** (`created_at`). Khi đó các dòng khớp nằm liền nhau trong index và đã đúng thứ tự, nên DB chỉ cần đọc ngược 20 dòng, không phải Sort.",
      ],
      widget: "explain-states",
      widgetTitle: "Ba trạng thái index",
      quiz: {
        question: "Có index rồi mà vẫn thấy Rows Removed by Filter. Vì sao?",
        options: ["Index hỏng", "Điều kiện đó không nằm trong index nên được kiểm tra sau khi lấy dòng (Filter), không phải Index Cond", "Do ANALYZE", "Do LIMIT"],
        answer: 1,
        explain: "Composite index đưa cả status vào Index Cond.",
      },
    },
    {
      id: "checklist",
      title: "Phần 4: Checklist hoàn thành",
      scene: "checklist",
      intro: ["Ghi vào nhật ký ba bảng số liệu (16, 1, 1, 3; stock 9, 8, 0; page 846, 98, 23) và chạy EXPLAIN ANALYZE cho query chậm nhất trong slow log của dự án thật."],
      widget: "lab-checklist",
      widgetTitle: "Checklist lab 6",
    },
  ],
  modelAnswer:
    "Ở order-service em đo N+1 bằng Hibernate statistics trong test: GET /orders với 10 đơn ra 16 câu, tức 1 + 10 + 5 vì còn cấp product; JOIN FETCH và EntityGraph còn 1 câu, batch fetch size 50 còn 3 câu mà không sửa code gọi. Với trừ kho, em cho 2 thread cùng đọc rồi ghi: có @Version thì một bên nhận ObjectOptimisticLockingFailureException và stock còn 9, còn câu UPDATE có điều kiện thì 20 thread tranh 10 sản phẩm đúng 10 thành công, stock về 0. Với query lịch sử đơn trên 100 nghìn dòng, composite index customer_id, status, created_at biến Seq Scan 846 page thành Index Scan Backward 23 page, không còn Sort.",
};
