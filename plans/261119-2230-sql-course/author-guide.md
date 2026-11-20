# Hướng dẫn soạn bài cho khoá "SQL cơ bản" (T24 Bank)

Repo: `/Users/hnam/orca/projects/springboot-interview` (macOS). Web app: `interactive-lessons/web`. Chạy lệnh từ thư mục `interactive-lessons/web`.

## Mục tiêu và người học
Khoá dành cho **người mới hoàn toàn**. Mọi thuật ngữ phải được giải thích bằng lời thường ngay lần đầu xuất hiện, rồi mới dùng. Ví dụ lấy từ ngân hàng (khách hàng, tài khoản, chuyển khoản, bút toán, khoản vay). Giọng văn tiếng Việt tự nhiên, câu ngắn, **không dùng gạch ngang dài (—)**. Dùng `code` cho từ khoá/tên bảng/cột và **in đậm** cho thuật ngữ mới.

## Bài mẫu (đọc kỹ trước khi viết)
`src/data/lessons/sql-foundation.ts` là bài mẫu hoàn chỉnh: cấu trúc, giọng văn, cách đặt bài tập, quiz. Viết bài của bạn theo đúng cấu trúc đó. Các bài còn lại hiện là file giữ chỗ.

## File bạn được sửa
- Ghi đè **một** file bài: `src/data/lessons/<slug>.ts` (giữ nguyên tên biến export, `slug`, `videoDir`, `videoVersion: "pending"`, `scenes: []`).
- Tạo widget tuỳ chỉnh (nếu cần) ở `src/widgets/sql-<ten>-widget.tsx`, export **một** component. Tên file `sql-<ten>-widget.tsx` tự thành widget `"sql-<ten>"` (dùng trong `widget: "sql-<ten>"` của section). Tên `<ten>` phải bắt đầu bằng tên bài để khỏi trùng, ví dụ `sql-join-venn-widget.tsx`.
- **Không** sửa `App.tsx`, `types.ts`, `course.ts`, `programs.ts`, `index.css`, `components/`, `lib/`, dữ liệu T24, hay bài của agent khác. Cần CSS thì dùng class sẵn có (`widget`, `seg small`, `result good|warn|bad`, `log`, `btn`, `pick`, `muted`, `note`, `pre.code`) hoặc style inline.
- Component dùng chung có sẵn: `components/choice-drill.tsx` (ChoiceDrill), `components/yes-no-drill.tsx`, `components/step-through.tsx`, `components/order-drill.tsx` (xem file để biết props).
- Không commit git. Không động vào `~/Documents/remotion-video/VieNeu-TTS`.

## Cấu trúc một bài
```ts
export const sqlXxx: Lesson = {
  slug, crumb, videoDir: "/videos/<slug>", videoVersion: "pending", scenes: [],
  title, subtitle, openingQuiz, roadmap: [3 chặng],
  sections: [ 5 đến 7 section ],
  summaryTitle: "Ghi nhớ",
  modelAnswer: "<đoạn tóm tắt 4 đến 6 câu>",
};
```
Mỗi section: `id` (kebab-case ngắn, **đây cũng là scene id của video sau này**), `title: "Phần N: ..."`, `scene: "<id>"`, `intro` (2 đến 3 đoạn ngắn), tuỳ chọn `widget`/`widgetTitle`, **`sql: SqlExercise[]`** (2 đến 4 bài tập), `quiz` (1 câu, 4 đáp án dài tương đương nhau, không để đáp án đúng dài nổi bật).

Thứ tự trong section: giải thích khái niệm bằng ví dụ đời thường, rồi cú pháp, rồi bẫy hay gặp (3 bẫy là tối đa), rồi bài tập.

### SqlExercise
```ts
{ prompt, starter, solution, hint?, ordered?, verify? }
```
- Bài đầu của mỗi section: `starter` điền chỗ trống (`____`) hoặc câu gần xong; bài sau: viết gần như từ đầu.
- `solution` chạy được và trả **ít nhất 1 dòng**. Bộ chấm so kết quả của người học với kết quả của `solution` (khác tên cột vẫn được, cần cùng số cột, cùng giá trị).
- `ordered: true` khi thứ tự dòng có ý nghĩa (có `ORDER BY`, xếp hạng, top N).
- Bài INSERT/UPDATE/DELETE/DDL: thêm `verify` (một SELECT chạy sau khi áp dụng câu lệnh, kết quả của người học và của `solution` được so sánh). Dữ liệu được đặt lại giữa các lần chấm.
- `hint` ngắn, chỉ hướng, không lộ đáp án.
- Đừng cho bài tập phụ thuộc `CURRENT_DATE`/`now()` (không cố định); dùng ngày cố định như `DATE '2024-12-31'`.

## Quy tắc nội dung (bắt buộc)
1. **Mọi câu SQL và mọi con số nêu trong chữ phải đã chạy thật.** Dùng `node scripts/run-sql.mjs "SELECT ..."` (mỗi lần chạy từ bản dữ liệu mới) để lấy số, rồi mới viết vào bài. Không đoán, không bịa. Trích output thật khi minh hoạ kết quả.
2. Chỉ dùng cú pháp đã dạy ở các bài **trước** (xem giáo trình bên dưới) cộng với những gì bài bạn đang dạy. Bài 1 đã cho dùng `SELECT ... FROM ... [ORDER BY] [LIMIT]` và `WHERE` trong một câu hỏi `information_schema`; ngoài ra chưa ai biết gì.
3. Dữ liệu chỉ có tên bảng/cột trong lược đồ dưới đây. Tên khách hàng, số dư... là bịa. Không dùng dữ liệu ngân hàng thật.
4. Dữ liệu có sự thật quan trọng bạn nên biết: số dư tài khoản bằng tổng `stmt_entry.amount` của nó; mỗi chuyển khoản `DONE` có đúng 2 bút toán chung `ft_id` (ghi nợ âm, ghi có dương); `PENDING`/`FAILED` không có bút toán; tài khoản vay có số dư âm; `mobile`, `email`, `birth_date`, `gender`, `close_date` có NULL; khách doanh nghiệp (sector 2000, 3000) không có `birth_date`/`gender`.
5. Quiz: 4 đáp án, đáp án đúng **không** được dài hơn rõ rệt các đáp án sai, giải thích (`explain`) nói vì sao các lựa chọn sai là sai.
6. Không tự bịa thuật ngữ T24. Chỉ nói T24 là phần mềm lõi ngân hàng của Temenos và dữ liệu là bản giả lập.
7. PostgreSQL 18 (PGlite). Nói đúng hành vi PostgreSQL (ví dụ `ILIKE`, `::`, `FILTER`, `DISTINCT ON` chỉ có ở PostgreSQL thì ghi chú).

## Lược đồ dữ liệu (11 bảng, khoá chính in đậm)
- `company`(**company_id** varchar, name, city, open_date): 5 chi nhánh `VN0010001` đến `VN0010005`.
- `account_officer`(**officer_id** int, name, company_id FK): 8 cán bộ.
- `sector`(**sector_id** int, description): 4 (1000 Cá nhân, 1100 Cá nhân cao cấp, 2000 DN nhỏ và vừa, 3000 DN lớn).
- `currency`(**ccy** char3, name, decimals): VND, USD, EUR, JPY.
- `category`(**category_id** int, description, product_group `CURRENT|SAVINGS|LOAN`): 7 loại (1001, 1002, 6001, 6006, 6012, 3001, 3002).
- `txn_type`(**txn_code** int, description, dr_cr `D|C`): 8 loại (101 nộp tiền, 102 rút tiền, 201 chuyển đi, 202 chuyển đến, 301 lãi, 401 phí, 501 giải ngân, 502 thu nợ).
- `customer`(**customer_id** int 100001 đến 100040, short_name, full_name, sector_id FK, gender M|F nullable, birth_date nullable, city, mobile nullable, email nullable, customer_status `ACTIVE|DORMANT|CLOSED`, account_officer_id FK, company_id FK, created_date): 40 khách.
- `account`(**account_id** varchar10, customer_id FK, category_id FK, ccy FK, company_id FK, open_date, close_date nullable, working_balance numeric(18,2), status `OPEN|CLOSED`): 85 tài khoản.
- `funds_transfer`(**ft_id** varchar `FT24xxxxxxx`, debit_account FK, credit_account FK, amount, ccy FK, processing_date, status `DONE|PENDING|FAILED`, narrative nullable): 132.
- `stmt_entry`(**stmt_entry_id** identity, account_id FK, txn_code FK, amount signed numeric (âm = ghi nợ), booking_date, value_date, ft_id FK nullable, narrative nullable): 932 bút toán, năm 2024 (một số khoản giải ngân vay sớm hơn).
- `loan`(**ld_id** varchar `LD24xxxxx`, customer_id FK, account_id FK, principal, ccy FK, interest_rate, start_date, maturity_date, status `LIVE|REPAID|OVERDUE`): 15 khoản vay.

## Giáo trình (kiến thức giả định theo thứ tự bài)
1. `sql-foundation` (xong, bài mẫu): database, bảng, kiểu dữ liệu, PK, FK, NULL, dataset. Chỉ dạy `SELECT * FROM`, `LIMIT`.
2. `sql-erd`: **Thiết kế ERD và lược đồ quan hệ.** Entity, attribute, relationship, cardinality (1-1, 1-N, N-N và bảng trung gian), PK/FK, từ yêu cầu nghiệp vụ tới ERD tới lược đồ quan hệ (dạng `Bảng(cột PK, cột FK)`), chuẩn hoá bằng lời thường (1NF, 2NF, 3NF), vẽ lại ERD của 11 bảng T24. Bắt buộc có widget `sql-erd-viewer` (sơ đồ SVG/HTML tương tác 11 bảng với đường nối khoá ngoại và ký hiệu 1-N, bấm vào bảng để làm nổi bật quan hệ), bài tập chọn bản số cho từng quan hệ (ChoiceDrill), và bài tập `CREATE TABLE` có PK/FK dùng SqlLab (dùng `verify` đọc `information_schema`). Đây là bài **thiết kế**, không cần JOIN.
3. `sql-select`: `SELECT cột1, cột2`, `*`, `DISTINCT`, alias `AS`, biểu thức số học, `LIMIT`, thứ tự thực thi logic (FROM rồi SELECT), chú thích `--`.
4. `sql-filter`: `WHERE`, so sánh, `AND/OR/NOT` và thứ tự ưu tiên (dấu ngoặc), `IN`, `BETWEEN`, `LIKE`/`ILIKE` với `%` `_`, `IS NULL`/`IS NOT NULL` (và vì sao `= NULL` sai), `ORDER BY` nhiều cột, `ASC/DESC`, `NULLS FIRST/LAST`, `LIMIT/OFFSET` phân trang.
5. `sql-aggregate`: `COUNT(*)`, `COUNT(cột)`, `COUNT(DISTINCT)`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY`, `HAVING`, `WHERE` khác `HAVING`, NULL trong hàm tổng hợp, lỗi hay gặp (cột không nằm trong GROUP BY).
6. `sql-join`: `INNER`, `LEFT`, `RIGHT`, `FULL`, `CROSS` (nhắc), `SELF JOIN` (ví dụ các cặp tài khoản của cùng một khách), nối nhiều bảng (stmt_entry, account, customer, category), alias bảng, anti-join (`LEFT JOIN ... IS NULL`), bẫy nhân dòng.
7. `sql-transform`: `CASE WHEN`, `COALESCE`, `NULLIF`, `CAST` và `::`, hàm chuỗi (`UPPER`, `LOWER`, `LENGTH`, `SUBSTRING`, `||`, `CONCAT`, `TRIM`, `REPLACE`, `POSITION`), hàm ngày (`EXTRACT`, `DATE_TRUNC`, `TO_CHAR`, cộng trừ `INTERVAL`, `AGE`), tuổi từ `birth_date` với ngày cố định.
8. `sql-subquery`: subquery vô hướng, `IN (subquery)`, `EXISTS`/`NOT EXISTS`, subquery tương quan, bảng dẫn xuất trong `FROM`, CTE `WITH` (nhiều CTE nối nhau), khi nào dùng CTE thay subquery.
9. `sql-set`: `UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`, điều kiện (cùng số cột, kiểu tương thích), `ORDER BY` trên kết quả gộp, tình huống ngân hàng (gộp hai phía ghi nợ/ghi có, khách vừa có tiết kiệm vừa có vay, khách có tài khoản nhưng không có khoản vay).
10. `sql-window`: `OVER`, `PARTITION BY`, `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD`, `SUM() OVER` cộng dồn (số dư chạy), khác biệt với `GROUP BY`, top N mỗi nhóm.
11. `sql-dml`: `INSERT` (một dòng, nhiều dòng, `INSERT ... SELECT`), `UPDATE`, `DELETE` (luôn có `WHERE`), `RETURNING`, transaction (`BEGIN`, `COMMIT`, `ROLLBACK`), ACID bằng lời thường, lỗi ràng buộc khi sửa dữ liệu. Mọi bài tập dùng `verify`.
12. `sql-optimize`: index là gì (B-tree, như mục lục sách), `CREATE INDEX`, `EXPLAIN`, đọc kế hoạch (`Seq Scan` và `Index Scan`, cost, rows), khi index không được dùng, chi phí của index. Bảng thật chỉ có 932 dòng nên planner hay chọn Seq Scan: nếu cần bảng lớn để minh hoạ, tạo bảng tạm bằng `generate_series` trong bài tập và `ANALYZE`. Chỉ dùng `EXPLAIN` thường (không `ANALYZE`) trong phần được chấm vì thời gian chạy không cố định. Kiểm chứng kế hoạch trên PGlite bằng script trước khi viết.
13. `sql-capstone`: 10 bài toán nghiệp vụ ngân hàng, mỗi bài kết hợp nhiều kỹ thuật (xếp theo độ khó), ví dụ top khách theo tổng số dư, tài khoản không phát sinh giao dịch, dòng tiền vào ra theo tháng, dư nợ quá hạn theo chi nhánh, số dư chạy theo ngày, phát hiện chuyển khoản bất thường. Chia thành 3 đến 4 section nhóm bài toán, mỗi bài có đề, gợi ý, đáp án.

## Kiểm tra trước khi báo xong
```bash
cd interactive-lessons/web
node scripts/verify-sql-lessons.mjs <slug>   # phải in "all good": mọi đáp án chạy được và có dòng kết quả
npx tsc -b                                    # 0 lỗi
npm run lint                                  # 0 cảnh báo
```
Nếu có widget tuỳ chỉnh: mở thử bằng trình duyệt (`npx vite build` rồi `npx vite preview --port 4399 --strictPort` ở nền, vào `http://localhost:4399/?bai=<slug>`, nhớ tắt khi xong). Với bài có widget, xem ảnh chụp để chắc không vỡ bố cục. Vì Playwright hay chờ "ổn định" quá lâu trên trang này, thao tác bằng `page.evaluate` và `dispatchEvent` (xem cách làm với textarea trong bài mẫu: gán giá trị bằng setter gốc rồi bắn sự kiện `input`).

## Báo cáo cuối (ngắn)
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Bài: <slug>, <n> section, <n> bài tập SQL, widget: <tên hoặc không>
verify-sql-lessons: all good
tsc / lint: sạch
Số liệu trích trong chữ đã kiểm: ...
Concerns: ...
```
