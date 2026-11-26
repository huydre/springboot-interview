import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// The state machine, sequential / parallel / mixed steps, the optimistic-lock race and the same-transaction outbox row were run
// on JDK 21 with plain JDBC on H2 2.3 (one UPDATE ... WHERE version = ? per action, the same statement JPA @Version issues).
// The race used a CyclicBarrier so both threads read version 0 before either wrote. The AFTER_COMMIT listener, the outbox worker
// and Spring wiring are described, not run; the Kafka outbox itself is run in distributed-tx.ts.
export const approvalWorkflow: Lesson = {
  slug: "approval-workflow",
  crumb: "Workflow phê duyệt",
  videoDir: "/videos/approval-workflow",
  videoVersion: "0",
  scenes: [],
  title: "Workflow phê duyệt: trình ký tuần tự, song song và gửi mail",
  subtitle:
    "Mô hình dữ liệu của hồ sơ, workflow, bước và người duyệt; state machine ở backend; bước tuần tự, song song, N trong M; backend validate lại và chống ký đồng thời; gửi mail bất đồng bộ không mất.",
  openingQuiz: {
    question: "Nút Ký trên giao diện chỉ hiện khi tới lượt người dùng. Backend có cần kiểm tra lại không?",
    options: [
      "Không, giao diện đã kiểm tra rồi",
      "Có, vì mọi request đều có thể được gửi trực tiếp bằng curl hoặc từ trang đã cũ, và hai người có thể bấm cùng lúc",
      "Chỉ cần kiểm tra token đăng nhập",
      "Chỉ kiểm tra khi hồ sơ lớn",
    ],
    answer: 1,
    explain:
      "Giao diện chỉ để tiện cho người dùng. Ai có token đều gọi thẳng API được, trang mở từ sáng có thể đã cũ, và hai người bấm cùng một giây là chuyện thường. Quyền và trạng thái phải được kiểm tra lại ở backend, trong transaction.",
  },
  roadmap: [
    "Chặng 1: mô hình dữ liệu của hồ sơ, workflow, bước và người duyệt; bảng transition của state machine và vì sao đặt ở backend.",
    "Chặng 2: bước tuần tự, song song, N trong M, đi nhanh, trả lại, uỷ quyền; backend validate lại, chống ký đồng thời bằng optimistic locking.",
    "Chặng 3: gửi mail sau mỗi lần ký không chậm và không mất (outbox, AFTER_COMMIT); cách trả lời phỏng vấn và drill.",
  ],
  sections: [
    {
      id: "data-model",
      title: "Phần 1: Mô hình dữ liệu của hồ sơ trình ký",
      intro: [
        "Câu hỏi phỏng vấn: hệ thống trình ký có hai loại, tuần tự từ cấp dưới lên cấp cao và song song (ai ký trước cũng được). Thiết kế thế nào? Bước đầu tiên không phải là code, mà là chọn đúng các bảng.",
        "Sai lầm hay gặp là nhét hết vào một bảng `document` với cột `approver1`, `approver2`, `approver3`. Cách đó chết ngay khi một hồ sơ có 5 cấp, hoặc một cấp có 3 người cùng ký. Ta tách thành các khái niệm riêng:",
        "- **Document**: hồ sơ cần ký, giữ **trạng thái chung** (`status`), bước hiện tại (`cur_seq`) và `version` để chống ghi đè.",
        "- **Workflow definition**: mẫu quy trình ('Hợp đồng dưới 100 triệu đi 3 bước'). Khi trình ký, **sao chép** mẫu thành các bước của hồ sơ (snapshot), để sửa mẫu về sau không làm đổi hồ sơ đang chạy.",
        "- **Step**: một bước, có thứ tự `seq`, kiểu `mode` (`SEQUENTIAL` hoặc `PARALLEL`) và `needed` (cần bao nhiêu chữ ký thì bước xong).",
        "- **Approver**: ai ngồi ở bước nào (`doc_id`, `seq`, `ord`, `user_id`, `signed`).",
        "- **History (audit)**: mỗi lần chuyển trạng thái ghi một dòng (ai, hành động, từ đâu, tới đâu, lúc nào). Chỉ thêm, không sửa, không xoá.",
        "Trạng thái chung của hồ sơ chỉ cần vài giá trị: `DRAFT` (soạn), `REVIEWING` (soát xét), `WAITING_APPROVAL` (chờ duyệt), `APPROVED`, `REJECTED`. Chi tiết 'ai đã ký, ai chưa' **không** đưa vào status, nó nằm ở bảng approver. Nếu đưa vào, số trạng thái sẽ nổ ra theo số người.",
      ],
      board: {
        title: "Các bảng của workflow phê duyệt",
        highlight: "workflow",
        chips: ["document", "step", "approver", "history"],
        cards: [
          {
            title: "Một hồ sơ, nhiều bước, mỗi bước nhiều người",
            diagram: {
              kind: "hub",
              inputs: [{ label: "step 1: SEQUENTIAL" }, { label: "step 2: PARALLEL (2/3)" }, { label: "step 3: SEQUENTIAL" }],
              center: "document (status, cur_seq, version)",
              rulesTitle: "Mỗi bước giữ",
              rules: ["`mode`: tuần tự hay song song", "`needed`: cần bao nhiêu chữ ký", "danh sách approver có thứ tự `ord`"],
            },
            code: `doc(id, status, cur_seq, version)
step(doc_id, seq, mode, needed)
approver(doc_id, seq, ord, user_id, signed)
doc_role(doc_id, user_id, role)      -- AUTHOR, REVIEWER
history(id, doc_id, actor, action, from_status, to_status, at)`,
            notes: ["Các bảng này là bản chạy trong bài (H2). Thực tế thêm `created_at`, `comment`, `delegated_from` và khoá ngoại."],
            takeaway: "Trạng thái chung ở document, chi tiết từng người ở approver",
          },
        ],
        conclusion: "**Kết luận:** quy trình là dữ liệu (step, approver), không phải code cứng. Thêm một cấp duyệt là thêm một dòng, không phải sửa chương trình.",
      },
      takeaway: {
        lines: [
          "Tách document, step, approver, history. Mẫu workflow được sao chép thành step của hồ sơ khi trình ký.",
          "Status chung chỉ vài giá trị; 'ai ký rồi' nằm ở bảng approver.",
        ],
      },
      trap: {
        title: "Đọc trạng thái từ đâu",
        text: "Đừng suy ra 'đã duyệt xong chưa' bằng cách đếm lại approver mỗi lần hiển thị. Hồ sơ giữ `status` và `cur_seq` như một nguồn sự thật, được cập nhật cùng transaction với lần ký.",
      },
      quiz: {
        question: "Vì sao sao chép mẫu workflow thành step của từng hồ sơ khi trình ký?",
        options: [
          "Để tốn thêm dung lượng",
          "Để sửa mẫu về sau không làm đổi quy trình của hồ sơ đang chạy",
          "Vì database không cho tham chiếu",
          "Để bỏ được bảng history",
        ],
        answer: 1,
        explain: "Hồ sơ đang chờ ký phải đi theo quy trình lúc nó được trình. Nếu hồ sơ tham chiếu thẳng mẫu thì đổi mẫu là đổi người đang duyệt giữa chừng.",
      },
    },
    {
      id: "state-machine",
      title: "Phần 2: State machine và bảng transition",
      intro: [
        "Bridge: ta đã có status. Câu hỏi tiếp theo là **ai được làm gì ở trạng thái nào**. Viết rải rác `if (status == ...)` trong nhiều service thì sớm muộn có một chỗ quên kiểm tra. Cách gọn là một **bảng transition** duy nhất: (trạng thái hiện tại, hành động) cho ra trạng thái mới và vai trò cần có.",
        "Bảng trong bài chạy thật có 6 dòng. Mọi cặp không có trong bảng đều bị từ chối.",
        "- `DRAFT` + `SUBMIT` (AUTHOR) thành `REVIEWING`",
        "- `REVIEWING` + `REVIEW_PASS` (REVIEWER) thành `WAITING_APPROVAL`; `REVIEW_RETURN` thành `DRAFT`",
        "- `WAITING_APPROVAL` + `APPROVE` (APPROVER) ở lại `WAITING_APPROVAL`, và thành `APPROVED` khi bước cuối đủ chữ ký",
        "- `WAITING_APPROVAL` + `REJECT` (APPROVER) thành `REJECTED`; `RECALL` (AUTHOR) thành `DRAFT`",
        "Vì sao đặt ở **backend**: giao diện có thể ẩn nút, nhưng chỉ backend mới chặn được request không đi qua giao diện. Một bảng duy nhất ở backend còn cho ta một chỗ để test, một chỗ để audit, và nhiều client (web, mobile, hệ thống khác) dùng chung cùng luật.",
        "Frontend vẫn nên được biết luật để vẽ nút đúng. Cách làm tốt: backend trả kèm danh sách `allowedActions` cho người đang xem, frontend chỉ hiển thị theo đó. Luật vẫn nằm một nơi.",
      ],
      board: {
        title: "Bảng transition",
        highlight: "transition",
        chips: ["from", "action", "to", "role"],
        cards: [
          {
            title: "Một request đi qua bảng",
            diagram: {
              kind: "flow",
              steps: ["Request: ai, hồ sơ nào, làm gì", "Đọc status hiện tại", "Tìm (status, action) trong bảng", "Kiểm tra role của người gọi"],
              ok: ["Hợp lệ", "Ghi trạng thái mới và history"],
              bad: ["Không có trong bảng hoặc sai role", "Từ chối, không đổi gì"],
            },
            code: `enum Status { DRAFT, REVIEWING, WAITING_APPROVAL, APPROVED, REJECTED }
enum Action { SUBMIT, REVIEW_PASS, REVIEW_RETURN, APPROVE, REJECT, RECALL }
record Transition(Status from, Action action, Status to, String role) {}

Transition t = TABLE.stream()
    .filter(x -> x.from() == status && x.action() == action).findFirst()
    .orElseThrow(() -> new Denied("ILLEGAL_TRANSITION: " + action + " not allowed from " + status));`,
            takeaway: "Một bảng duy nhất, mọi đường ra khỏi trạng thái đều qua nó",
          },
        ],
        conclusion: "**Kết luận:** thêm trạng thái hay hành động là thêm một dòng vào bảng, và những gì không có trong bảng mặc định là bị cấm.",
      },
      after: [
        "Kết quả chạy thật trên hồ sơ 1 đang ở `DRAFT`: `hoa APPROVE DENIED ILLEGAL_TRANSITION: APPROVE not allowed from DRAFT`, rồi `rev SUBMIT DENIED FORBIDDEN: rev is not AUTHOR of doc 1`, rồi `hoa SUBMIT OK DRAFT --SUBMIT--> REVIEWING`. Sau đó `rev REVIEW_PASS` đưa hồ sơ sang `WAITING_APPROVAL`.",
      ],
      takeaway: {
        lines: ["State machine là bảng (from, action, to, role). Không có trong bảng là bị từ chối.", "Đặt ở backend, frontend chỉ vẽ nút theo `allowedActions` do backend trả."],
      },
      quiz: {
        question: "Vì sao bảng transition nên nằm ở backend dù frontend đã ẩn nút?",
        options: [
          "Vì frontend không biết đọc enum",
          "Vì chỉ backend chặn được request không đi qua giao diện, và nhiều client dùng chung một luật",
          "Vì backend nhanh hơn",
          "Vì frontend không được phép gọi API",
        ],
        answer: 1,
        explain: "Ẩn nút chỉ là tiện lợi. Bảo vệ thật là kiểm tra ở nơi nhận request. Đặt bảng một chỗ ở backend còn giúp test và audit dễ.",
      },
    },
    {
      id: "sequential-parallel",
      title: "Phần 3: Tuần tự, song song và hỗn hợp",
      intro: [
        "Bridge: bảng transition cho `APPROVE` ở lại `WAITING_APPROVAL`. Vậy khi nào bước xong, và ai được ký lúc này? Đó là việc của `mode` và `needed` của từng bước.",
        "- **SEQUENTIAL**: các approver ký theo thứ tự `ord`. Chỉ người **đầu tiên chưa ký** mới được ký. Bước xong khi tất cả đã ký (`needed` = số người).",
        "- **PARALLEL**: ai thuộc bước cũng ký được, thứ tự tuỳ ý. Bước xong khi đủ `needed` chữ ký. `needed = 1` nghĩa là 'ai ký trước cũng được, một người là đủ'; `needed = 2` trên 3 người là kiểu 'N trong M'.",
        "- **Hỗn hợp**: một hồ sơ gồm nhiều bước, mỗi bước một mode. Ví dụ bước 1 tuần tự (nhân viên, trưởng nhóm, trưởng phòng), bước 2 song song 2 trong 3 giám đốc, bước 3 tuần tự (tổng giám đốc ký cuối, bắt buộc).",
        "Khi một bước đủ chữ ký, hồ sơ chuyển `cur_seq` sang bước kế. Khi bước **cuối** đủ chữ ký thì status thành `APPROVED`. Chữ ký thừa sau khi bước đã xong (người thứ ba trong 2 trên 3) bị từ chối vì họ không còn ghế ở bước hiện tại.",
        "Ba tình huống thực tế thường bị hỏi thêm:",
        "- **Luồng nhanh (bỏ bước)**: khi trình ký, chọn mẫu workflow ngắn hơn (ví dụ hồ sơ khẩn bỏ bước giám đốc). Vì step là dữ liệu snapshot nên chỉ là sao chép mẫu khác. Cần có quyền riêng để chọn luồng nhanh và ghi lại vào history.",
        "- **Trả lại**: người duyệt trả về bước trước hoặc về người soạn. Backend cần chọn: trả về `DRAFT` (xoá chữ ký, ký lại từ đầu) hay trả về bước k (xoá chữ ký từ bước k trở đi). Ghi rõ lý do và luật đã chọn, cả hai đều chấp nhận được nếu nhất quán.",
        "- **Uỷ quyền**: A đi vắng, B ký thay. Không sửa lịch sử: thêm một dòng uỷ quyền (`from`, `to`, hiệu lực từ ngày nào tới ngày nào), khi kiểm tra quyền xét cả người được uỷ, và history ghi cả hai tên ('B ký thay A').",
      ],
      predict: {
        question: "Bước 2 song song 2 trong 3 (d1, d2, d3). d3 ký, rồi d1 ký. Sau đó d2 bấm ký. Chuyện gì xảy ra?",
        options: [
          "d2 ký được, thành 3 chữ ký",
          "Backend từ chối vì bước 2 đã đủ 2 chữ ký và hồ sơ đã sang bước 3, d2 không còn ghế ở bước hiện tại",
          "Hồ sơ quay lại bước 2",
          "Backend lỗi 500",
        ],
        answer: 1,
        explain: "Đã chạy: `d2 APPROVE DENIED NOT_APPROVER: d2 has no seat at step 3`. Bước 2 xong ngay khi d1 ký (2 trên 3), `cur_seq` sang 3, và d2 không có tên ở bước 3.",
      },
      compare: [
        way(
          "Tuần tự (SEQUENTIAL)",
          `// step 1: an, binh, chi  (mode SEQUENTIAL, needed 3)
String turn = firstUnsigned(approvers);       // người đầu tiên chưa ký
if (!turn.equals(actor))
    throw new Denied("NOT_YOUR_TURN: waiting for " + turn);
sign(actor);
if (signedCount >= needed) nextStepOrApproved();`,
          [
            ask("binh bấm ký trước an", bad("Đã chạy: `binh APPROVE DENIED NOT_YOUR_TURN: waiting for an, not binh`.")),
            ask("an ký, rồi binh, rồi chi", ok("Đã chạy: `1/3 signed`, `2/3 signed`, rồi `step done, moving to step 2`.")),
            ask("an bấm ký lần hai", ok("Đã chạy: `ALREADY_SIGNED (no-op): an`, không thêm dòng history.")),
          ],
          "Hợp chuỗi chức vụ: cấp dưới đã xem thì cấp trên mới xem. Backend phải ép thứ tự, không dựa vào việc giao diện chỉ hiện nút đúng người.",
        ),
        way(
          "Song song (PARALLEL, N trong M)",
          `// step 2: d1, d2, d3  (mode PARALLEL, needed 2)
if (!hasSeat(actor)) throw new Denied("NOT_APPROVER");
if (alreadySigned(actor)) return "ALREADY_SIGNED";
sign(actor);                                   // không kiểm tra thứ tự
if (signedCount >= needed) nextStepOrApproved();`,
          [
            ask("d3 ký trước, rồi d1", ok("Đã chạy: `d3 ... 1/2 signed`, `d1 ... step done, moving to step 3`. Không cần đúng thứ tự.")),
            ask("d2 ký sau khi đủ 2 trên 3", bad("Đã chạy: `NOT_APPROVER: d2 has no seat at step 3`. Chữ ký thừa bị chặn tự nhiên.")),
            ask("Hai giám đốc bấm cùng một giây", bad("Không có khoá thì cả hai cùng thấy 'chưa đủ' rồi cùng ghi. Xem Phần 4.")),
          ],
          "Hợp khi nhiều người đồng cấp, ai rảnh ký trước. Chỗ khó nằm ở đồng thời: hai chữ ký đến cùng lúc phải cho đúng một kết quả cuối.",
        ),
      ],
      after: [
        "Đã chạy cả chuỗi hỗn hợp trên hồ sơ 1, kết quả cuối: `final: APPROVED step=3 version=8, history rows=8, outbox rows=6`. Có 8 dòng history cho 8 hành động thực sự (submit, review, 3 chữ ký bước 1, 2 chữ ký bước 2, 1 chữ ký bước cuối). Hai lần bấm thừa (an ký lại, ceo ký lại sau khi xong) không để lại dòng nào.",
      ],
      takeaway: {
        lines: ["Mỗi bước có `mode` và `needed`. Tuần tự ép thứ tự `ord`, song song chỉ đếm chữ ký.", "Bỏ bước, trả lại, uỷ quyền đều là dữ liệu và luật bổ sung, không sửa mô hình."],
      },
      quiz: {
        question: "Muốn 'ai ký trước cũng được, chỉ cần một người' ở một bước có 2 người. Cấu hình nào đúng?",
        options: ["SEQUENTIAL, needed 2", "PARALLEL, needed 1", "PARALLEL, needed 2", "SEQUENTIAL, needed 1"],
        answer: 1,
        explain: "Song song nghĩa là bất kỳ ai trong bước ký được, và `needed = 1` nghĩa là một chữ ký là bước xong.",
      },
    },
    {
      id: "backend-validate",
      title: "Phần 4: Backend validate lại và chống ký đồng thời",
      senior: true,
      intro: [
        "Đây là chỗ câu hỏi phân loại ứng viên: 'frontend đã kiểm tra rồi, backend có cần kiểm tra lại không?'. Câu trả lời đầy đủ có bốn lớp, kiểm tra theo đúng thứ tự trong cùng một transaction:",
        "- **Trạng thái hiện tại**: hồ sơ phải ở `WAITING_APPROVAL` (bảng transition ở Phần 2).",
        "- **Actor có ghế ở bước hiện tại không**: người ở bước khác hay không thuộc quy trình bị từ chối (`NOT_APPROVER`).",
        "- **Đúng lượt không** (với bước tuần tự): người đầu tiên chưa ký mới được ký (`NOT_YOUR_TURN`).",
        "- **Chưa ký rồi**: ký lần hai là no-op (`ALREADY_SIGNED`), để bấm đúp hay client retry không tạo thêm chữ ký. Đây chính là tính **idempotent** của hành động ký.",
        "Bốn lớp trên vẫn chưa đủ khi **hai request đến cùng lúc**. Cả hai cùng đọc 'bước chưa xong', cả hai cùng qua kiểm tra, cả hai cùng ghi. Hai cách chuẩn để chặn:",
        "- **Optimistic locking**: hồ sơ có cột `version`. Mỗi lần đổi chạy `UPDATE doc SET ..., version = version + 1 WHERE id = ? AND version = ?`. Nếu 0 dòng bị đổi nghĩa là ai đó đã đổi trước, ta rollback và báo conflict. Với JPA chỉ cần đặt `@Version` trên entity, Hibernate sinh đúng câu UPDATE đó và ném `OptimisticLockException`.",
        "- **UPDATE có điều kiện / khoá bi quan**: `UPDATE ... WHERE status = 'WAITING_APPROVAL' AND cur_seq = ?`, hoặc `SELECT ... FOR UPDATE` hồ sơ trước khi xử lý. Chắc chắn nhưng giữ khoá lâu hơn. Optimistic hợp khi xung đột hiếm, như ở đây.",
        "Khi bị conflict, backend trả `409 Conflict`, hoặc tự retry vài lần: lần retry đọc lại trạng thái mới, và thường kết quả đúng sẽ là 'đã xong rồi' hoặc 'đã ký rồi'. Giao diện gửi kèm `If-Match` (version đã thấy) để từ chối ngay khi trang đã cũ.",
      ],
      predict: {
        question: "Hai giám đốc x và y cùng ở một bước song song `needed = 1`, bấm ký cùng một giây, và không có khoá nào. Kết quả?",
        options: [
          "Đúng một người ký thành công, người kia bị chặn",
          "Cả hai cùng thành công: hồ sơ được duyệt hai lần, hai dòng history, hai mail",
          "Database tự từ chối",
          "Hồ sơ rơi vào trạng thái lỗi",
        ],
        answer: 1,
        explain: "Đã chạy bản đối chứng bỏ điều kiện version: `final: APPROVED step=1 version=2, history rows=2, outbox rows=2`. Cả hai thread cùng đọc `version 0`, cùng thấy bước chưa xong, cùng ghi. Hai lần duyệt, hai mail.",
      },
      compare: [
        way(
          "Không có khoá",
          `UPDATE doc SET status = ?, cur_seq = ?, version = version + 1
WHERE id = ?;
-- hai thread cùng đọc version 0 rồi cùng ghi`,
          [
            ask("x và y ký cùng lúc (bước song song, needed 1)", bad("Đã chạy: cả hai `OK ... APPROVED`, `history rows=2, outbox rows=2`. Duyệt hai lần, gửi hai mail.")),
            ask("Một người bấm đúp", bad("Hai request cùng qua kiểm tra 'chưa ký' vì kiểm tra xảy ra trước khi bên kia ghi.")),
          ],
          "Mọi kiểm tra ở Phần 4 đều đúng cả, nhưng chạy trên dữ liệu đã cũ. Kiểm tra mà không có khoá chỉ chặn được người bấm tuần tự.",
        ),
        way(
          "Optimistic locking (version)",
          `UPDATE doc SET status = ?, cur_seq = ?, version = version + 1
WHERE id = ? AND version = ?;
-- 0 dòng bị đổi: ném Conflict, rollback cả chữ ký và dòng outbox`,
          [
            ask("x và y ký cùng lúc (bước song song, needed 1)", ok("Đã chạy: thread x `OK ... APPROVED`; thread y `CONFLICT: version 0 already changed by someone else | retry: ILLEGAL_TRANSITION: APPROVE not allowed from APPROVED`. `history rows=1, outbox rows=1`.")),
            ask("Một người bấm đúp (cùng user x, hai request)", ok("Đã chạy: một request `OK`, request kia `CONFLICT` rồi retry thấy `APPROVED`. `history rows=1, outbox rows=1`.")),
            ask("Trang đã cũ (version 0 trong khi hồ sơ đã version 1)", ok("Đã chạy: `STALE: client saw version 0, now 1`, từ chối ngay không cần chạm vào dữ liệu.")),
          ],
          "Đúng một bên thắng. Bên thua bị rollback hoàn toàn, nên không có chữ ký lẻ, không có dòng history hay outbox thừa. Chi phí chỉ là một cột và một điều kiện trong UPDATE.",
        ),
      ],
      after: [
        "Điểm tinh tế: dòng `approver.signed` và dòng `outbox` được ghi trong cùng transaction với `UPDATE doc`. Khi UPDATE có điều kiện thất bại và ta rollback, chữ ký và mail thừa biến mất cùng lúc. Nếu bước ký nằm ngoài transaction thì thua cuộc rồi mà chữ ký vẫn còn.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Kiểm tra (trạng thái, ghế, lượt, đã ký) rồi ghi: giữa hai bước đó có khoảng hở.",
          "Hai request chui qua khoảng hở: version trong UPDATE đóng khoảng hở, một bên thua và rollback.",
          "Ký lần hai là no-op: idempotent, nên retry và bấm đúp an toàn.",
        ],
      },
      trap: {
        title: "Kiểm tra trước rồi ghi sau, không có khoá",
        text: "`if (!approver.signed) { approver.sign(); }` đọc và ghi hai bước không nguyên tử. Đúng khi test một luồng, sai khi hai người bấm cùng lúc. Cần `@Version` hoặc UPDATE có điều kiện, và nhớ bắt `OptimisticLockException` để trả 409 thay vì 500.",
      },
      quiz: {
        question: "Với JPA, bạn đặt `@Version` trên entity hồ sơ. Hai transaction cùng sửa một hồ sơ, điều gì xảy ra với transaction commit sau?",
        options: [
          "Commit thành công và ghi đè",
          "Câu UPDATE có `WHERE version = ?` ảnh hưởng 0 dòng, Hibernate ném `OptimisticLockException` và transaction đó rollback",
          "Database chờ vô hạn",
          "Hibernate tự gộp hai thay đổi",
        ],
        answer: 1,
        explain: "Transaction thắng tăng version. Transaction sau còn giữ version cũ nên điều kiện không khớp, 0 dòng bị đổi, bị coi là xung đột. Bên gọi retry hoặc trả 409.",
      },
    },
    {
      id: "async-mail",
      title: "Phần 5: Gửi mail và thông báo bất đồng bộ",
      senior: true,
      intro: [
        "Sau mỗi lần ký cần báo cho người kế tiếp (và người soạn). Hai yêu cầu: **không làm chậm** thao tác ký (SMTP có thể mất vài giây hoặc treo) và **không mất mail** khi tiến trình chết hay SMTP lỗi.",
        "Cách làm hay bị coi là bất đồng bộ nhưng không phải: gọi `mailSender.send(...)` trong `try/catch` ngay trong service ký. `try/catch` chỉ nuốt lỗi, **không** làm việc chạy nền. Request vẫn chờ SMTP. Còn nếu lỗi bị nuốt thì mail mất mà không ai biết. Hai lỗi khác nhau cùng một chỗ:",
        "- Gửi **trước** commit rồi transaction rollback: người nhận nhận mail về chữ ký không hề tồn tại.",
        "- Gửi **sau** commit nhưng tiến trình chết đúng lúc đó: chữ ký có, mail không bao giờ đi. Đây là dual write đã mô tả ở bài Giao dịch phân tán.",
        "Hai cách chuẩn:",
        "- **`@TransactionalEventListener(phase = AFTER_COMMIT)`**: service ký publish một event (`DocumentSigned`), listener chỉ chạy **sau khi commit thành công**, thêm `@Async` để không chặn request. Giải quyết 'gửi trước commit', và rất ít code. Nhưng event nằm trong bộ nhớ: tiến trình chết giữa commit và listener thì mail mất.",
        "- **Outbox**: trong **cùng transaction** với chữ ký, ghi một dòng vào bảng `outbox` (loại sự kiện, hồ sơ, người nhận). Một worker định kỳ đọc dòng chưa gửi, gửi mail, đánh dấu đã gửi, và retry khi SMTP lỗi. Dòng outbox commit cùng chữ ký nên **không mất**; chữ ký rollback thì dòng outbox cũng không còn.",
        "Với outbox, một mail có thể bị gửi hai lần (worker gửi xong rồi chết trước khi đánh dấu), nên coi mail là **at-least-once**. Với thông báo thì trùng là chấp nhận được; nếu cần thì gắn id sự kiện để người nhận hoặc hệ thống kế tiếp khử trùng.",
        "Bài Giao dịch phân tán (`distributed-tx`) đã chạy outbox thật với Kafka, kill -9 ở từng điểm. Ở đây không lặp lại: chỉ cần nhớ ý tưởng. Việc mới của bài này là chứng minh dòng outbox cùng số phận với chữ ký.",
      ],
      compare: [
        way(
          "try/catch trong service ký",
          `@Transactional
public void approve(long docId, String actor) {
    // ... kiểm tra, ghi chữ ký, UPDATE doc ...
    try {
        mailSender.send(nextApprover, "Hồ sơ chờ bạn ký");   // chờ SMTP ngay trong request
    } catch (Exception e) {
        log.warn("mail failed", e);                           // nuốt lỗi
    }
}`,
          [
            ask("SMTP chậm 5 giây", bad("Request ký chờ đủ 5 giây, và transaction (cùng khoá hồ sơ) bị giữ mở suốt thời gian đó.")),
            ask("SMTP lỗi", bad("Lỗi bị nuốt, không có chỗ nào nhớ 'còn mail chưa gửi', người duyệt kế tiếp không biết.")),
            ask("Commit sau đó thất bại (conflict)", bad("Mail đã đi nhưng chữ ký bị rollback: thông báo về một chữ ký không tồn tại.")),
          ],
          "Đây không phải bất đồng bộ. try/catch chỉ quyết định lỗi có nổ ra ngoài hay không.",
        ),
        way(
          "Outbox + worker",
          `@Transactional
public void approve(long docId, String actor) {
    // ... kiểm tra, ghi chữ ký, UPDATE doc WHERE version = ? ...
    jdbc.update("INSERT INTO outbox(doc_id, type) VALUES (?, ?)", docId, "SIGNED");  // cùng transaction
}

@Scheduled(fixedDelay = 2000)
public void relay() {
    for (OutboxRow r : repo.findUnsent(50)) {       // đọc dòng chưa gửi
        mailSender.send(r.to(), r.body());          // lỗi thì lần sau thử lại
        repo.markSent(r.id());
    }
}`,
          [
            ask("SMTP chậm hoặc lỗi", ok("Request ký không bị ảnh hưởng. Dòng chưa gửi còn đó, worker thử lại lần sau.")),
            ask("Tiến trình chết ngay sau commit", ok("Dòng outbox đã commit cùng chữ ký, khởi động lại worker sẽ gửi tiếp. Không mất mail.")),
            ask("Hai request ký đồng thời, một bên thua", ok("Đã chạy: bản thua rollback cả dòng outbox, kết quả `outbox rows=1` cho đúng một chữ ký thắng.")),
            ask("Worker gửi xong rồi chết trước markSent", bad("Mail gửi lại lần hai (at-least-once). Chấp nhận được với thông báo, hoặc khử trùng bằng id.")),
          ],
          "Chậm một chút (độ trễ bằng chu kỳ worker) đổi lấy việc không mất và không chặn request. Muốn nhanh hơn thì thêm AFTER_COMMIT để đẩy sớm, outbox vẫn là chỗ bảo đảm.",
        ),
      ],
      after: [
        "Đã chạy trên H2: hồ sơ 1 đi hết quy trình tạo ra `outbox rows=6`, đúng 6 lần ký thành công: ba dòng `SIGNED` (an, binh, d3), hai dòng `STEP_DONE` (chi, d1) và một dòng `DOC_APPROVED` (ceo). Hai lần bấm thừa không tạo dòng nào. Worker gửi mail và `@TransactionalEventListener` không được chạy trong bài này, chỉ mô tả.",
        "Gợi ý chọn: hệ thống nhỏ, mất mail thỉnh thoảng chấp nhận được thì AFTER_COMMIT + `@Async` là đủ. Hồ sơ pháp lý, mail không được mất thì outbox. Hai cách có thể đi cùng nhau.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "try/catch không phải bất đồng bộ: request vẫn chờ SMTP, lỗi bị nuốt.",
          "Ghi 'việc phải gửi' vào outbox trong cùng transaction: chữ ký còn thì việc gửi còn, chữ ký mất thì việc gửi mất.",
          "Worker gửi sau, retry khi lỗi, chấp nhận gửi trùng và khử trùng bằng id.",
        ],
      },
      quiz: {
        question: "Vì sao ghi dòng outbox trong cùng transaction với chữ ký lại tránh được mail về một chữ ký không tồn tại?",
        options: [
          "Vì outbox gửi mail nhanh hơn",
          "Vì chữ ký rollback thì dòng outbox rollback cùng, worker không thấy dòng nào để gửi",
          "Vì SMTP hỗ trợ transaction",
          "Vì outbox khoá bảng hồ sơ",
        ],
        answer: 1,
        explain: "Cả hai ghi cùng một transaction nên cùng commit hoặc cùng rollback. Worker chỉ đọc dòng đã commit, nên không bao giờ thấy mail của chữ ký đã bị huỷ.",
      },
    },
    {
      id: "interview-drill",
      title: "Phần 6: Cách trả lời phỏng vấn và drill",
      intro: [
        "Câu này dài và gồm nhiều ý. Đừng trả lời lan man: đi theo một khung 5 bước và dừng sau mỗi bước để người phỏng vấn đào sâu.",
        "- **Mô hình**: document, step (mode, needed), approver, history; trạng thái chung vài giá trị.",
        "- **State machine** ở backend: bảng (from, action, to, role).",
        "- **Tuần tự và song song** là `mode` của step, hỗn hợp là nhiều step.",
        "- **Backend validate lại**: trạng thái, ghế, lượt, idempotent, chống đồng thời bằng `version`.",
        "- **Mail**: outbox cùng transaction hoặc AFTER_COMMIT; không phải try/catch.",
        "Chọn câu có sẵn từ bảng dưới khi bị hỏi tình huống. Sau đó thử drill: mỗi dòng là một tình huống, chọn cơ chế đúng.",
      ],
      cheat: [
        { name: "Hai loại trình ký", one: "Không phải hai hệ thống, mà là hai giá trị `mode` của step", say: "Em mô hình hoá mỗi bước có mode tuần tự hoặc song song và needed là số chữ ký cần có. Hỗn hợp chỉ là nhiều bước nối nhau." },
        { name: "Frontend kiểm tra", one: "Chỉ để tiện cho người dùng", say: "Frontend ẩn nút theo allowedActions, nhưng backend luôn kiểm tra lại trạng thái, quyền và lượt trong transaction vì có thể gọi API trực tiếp." },
        { name: "Ký đồng thời", one: "Version trong UPDATE, một bên thắng", say: "Em dùng optimistic locking: UPDATE kèm điều kiện version, bên thua rollback và nhận 409. Ký lần hai là no-op nên retry an toàn." },
        { name: "Gửi mail", one: "Outbox cùng transaction, worker gửi sau", say: "Em ghi dòng outbox cùng transaction với chữ ký, worker gửi và retry. Không dùng try/catch vì đó không phải bất đồng bộ." },
        { name: "Audit", one: "History chỉ thêm, không sửa", say: "Mỗi chuyển trạng thái ghi một dòng history gồm ai, làm gì, từ đâu tới đâu, nên truy vết được đầy đủ." },
      ],
      drill: {
        choices: ["Bảng transition", "Kiểm tra ghế và lượt", "Optimistic locking", "Idempotent no-op", "Outbox"],
        items: [
          { q: "Ai đó gọi APPROVE trên hồ sơ đang ở DRAFT", a: "Bảng transition", why: "Cặp (DRAFT, APPROVE) không có trong bảng nên bị từ chối ILLEGAL_TRANSITION." },
          { q: "binh bấm ký khi an chưa ký ở bước tuần tự", a: "Kiểm tra ghế và lượt", why: "Backend so người đầu tiên chưa ký với actor và trả NOT_YOUR_TURN." },
          { q: "Hai giám đốc ký cùng một giây ở bước song song", a: "Optimistic locking", why: "UPDATE kèm version cho đúng một bên thắng, bên thua rollback." },
          { q: "Người dùng bấm đúp nút Ký", a: "Idempotent no-op", why: "Đã ký rồi thì lần hai là no-op ALREADY_SIGNED, không thêm chữ ký." },
          { q: "Phải báo mail cho người kế tiếp mà không được mất, và không làm chậm", a: "Outbox", why: "Ghi dòng outbox cùng transaction với chữ ký, worker gửi sau và retry." },
        ],
        summary: "Luật ở bảng transition, lượt ở kiểm tra ghế, đồng thời ở version, bấm đúp ở idempotent, mail ở outbox.",
      },
      takeaway: {
        lines: [
          "Trả lời theo 5 bước: mô hình, state machine, mode, validate ở backend, mail.",
          "Nói rõ phần đã kiểm chứng và phần chỉ là thiết kế.",
        ],
      },
      quiz: {
        question: "Người phỏng vấn hỏi 'frontend đã kiểm tra rồi, backend có cần không?'. Câu trả lời tốt nhất?",
        options: [
          "Không cần, trùng việc",
          "Cần, vì backend là nơi duy nhất ép được luật: kiểm tra trạng thái, quyền, lượt và chống đồng thời bằng version trong transaction",
          "Cần nếu hồ sơ lớn",
          "Chỉ cần kiểm tra token",
        ],
        answer: 1,
        explain: "Frontend không phải ranh giới tin cậy. Mọi luật phải kiểm tra lại ở backend, và với đồng thời thì cần cả khoá (version) chứ không chỉ kiểm tra.",
      },
    },
  ],
  modelAnswer:
    "Em tách thành document, step, approver và history. Mỗi step có mode tuần tự hoặc song song và needed là số chữ ký cần có, nên hai loại trình ký và cả hỗn hợp chỉ là dữ liệu. Trạng thái chung của hồ sơ chỉ vài giá trị như DRAFT, WAITING_APPROVAL, APPROVED, và chuyển trạng thái đi qua một bảng transition ở backend. Frontend chỉ ẩn hiện nút theo allowedActions, còn backend luôn validate lại trong transaction: trạng thái, người ký có ghế ở bước hiện tại không, có đúng lượt không, đã ký chưa. Để hai người ký cùng lúc không tạo kết quả sai, em dùng optimistic locking với cột version, bên thua rollback và trả 409, còn ký lần hai là no-op nên bấm đúp an toàn. Về mail, em không gửi trong try/catch vì đó không phải bất đồng bộ. Em ghi dòng outbox trong cùng transaction với chữ ký, rồi một worker gửi và retry, nên không mất mail và cũng không có mail của chữ ký đã bị rollback.",
  cards: [
    { q: "Mô hình dữ liệu của trình ký gồm gì?", a: "Document (status, cur_seq, version), step (seq, mode, needed), approver (ai ở bước nào, đã ký chưa), history (audit chỉ thêm)." },
    { q: "Vì sao sao chép mẫu workflow thành step của hồ sơ?", a: "Để đổi mẫu về sau không làm đổi quy trình của hồ sơ đang chạy." },
    { q: "Bảng transition là gì?", a: "Bảng (from, action, to, role). Cặp không có trong bảng thì bị từ chối." },
    { q: "Vì sao state machine đặt ở backend?", a: "Chỉ backend chặn được request không đi qua giao diện, và nhiều client dùng chung một luật." },
    { q: "SEQUENTIAL và PARALLEL khác gì?", a: "Tuần tự ép thứ tự (người đầu tiên chưa ký mới được ký). Song song ai ký cũng được, bước xong khi đủ needed chữ ký." },
    { q: "N trong M cấu hình thế nào?", a: "Bước PARALLEL có M approver và needed = N." },
    { q: "Backend phải kiểm tra những gì khi ký?", a: "Trạng thái hồ sơ, actor có ghế ở bước hiện tại, đúng lượt (tuần tự), chưa ký, rồi ghi với điều kiện version." },
    { q: "Optimistic locking chống ký đồng thời thế nào?", a: "UPDATE ... WHERE version = ?. 0 dòng bị đổi nghĩa là bên kia thắng; bên thua rollback, trả 409 hoặc retry." },
    { q: "Vì sao ký lần hai nên là no-op?", a: "Idempotent: bấm đúp hay client retry không tạo thêm chữ ký hay thêm mail." },
    { q: "try/catch quanh gửi mail có phải bất đồng bộ không?", a: "Không. Request vẫn chờ SMTP, lỗi bị nuốt, và mail có thể đi trước một commit rồi bị rollback." },
    { q: "Outbox giải quyết gì cho mail?", a: "Ghi việc phải gửi cùng transaction với chữ ký, worker gửi sau và retry. Không mất mail, không có mail của chữ ký đã rollback. Gửi at-least-once." },
    { q: "AFTER_COMMIT khác outbox thế nào?", a: "AFTER_COMMIT chạy listener sau commit, ít code nhưng event nằm trong bộ nhớ nên chết giữa chừng là mất. Outbox lưu bền trong DB." },
  ],
};
