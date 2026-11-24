import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Outbox outputs below were run on JDK 21, Spring Boot 3.5.16, spring-kafka 3.3, PostgreSQL 16 and Apache Kafka 3.9.1 in Docker.
// Each step was a separate JVM killed with kill -9 at a marked point: dual write lost the event, the outbox row survived the crash,
// a relay killed after send but before marking re-sent the row (two records, same message_id), and the inbox consumer ignored the copy.
// 2PC, saga isolation and TCC are described, not run.
export const distributedTx: Lesson = {
  slug: "distributed-tx",
  crumb: "Distributed Transaction",
  videoDir: "/videos/distributed-tx",
  videoVersion: "0",
  scenes: [],
  title: "Giao dịch phân tán: Saga, Outbox, 2PC",
  subtitle:
    "Khi một nghiệp vụ chạm nhiều database và message broker: vì sao `@Transactional` không đủ, dual write hỏng ở đâu, 2PC chạy thế nào và vì sao ít dùng, saga với bước bù và bước pivot, transactional outbox cùng consumer idempotent, isolation trong saga, TCC, và cách trả lời phỏng vấn.",
  openingQuiz: {
    question:
      "Service lưu đơn bằng `@Transactional`, commit xong rồi mới gọi `kafkaTemplate.send(\"order-events\", ...)`. Pod bị kill đúng lúc vừa commit, chưa kịp send. Kết quả?",
    options: [
      "Spring tự rollback đơn vì message chưa gửi",
      "Đơn nằm trong DB nhưng event không bao giờ tới Kafka, service khác không biết có đơn",
      "Kafka tự gửi lại khi pod khởi động",
      "Không sao vì producer idempotent đã bật",
    ],
    answer: 1,
    explain:
      "Đã chạy: kill -9 ngay sau commit, DB có đơn `1 alice PENDING` nhưng topic `order-events holds 0 record(s)`. Hai lần ghi vào hai hệ thống khác nhau không có transaction chung (dual write). Phần 4 sửa bằng outbox.",
  },
  roadmap: [
    "Chặng 1: vì sao `@Transactional` không bao được nhiều service; dual write; 2PC/XA chạy thế nào và vì sao microservices né nó.",
    "Chặng 2: saga (choreography và orchestration), bước bù, bước pivot, bù cũng có thể lỗi; transactional outbox, relay bằng polling hoặc CDC, consumer idempotent bằng inbox.",
    "Chặng 3: isolation trong saga (semantic lock, commutative update, reread value), timeout và saga treo, TCC; chọn giải pháp và cách trả lời phỏng vấn.",
  ],
  sections: [
    {
      id: "problem",
      title: "Phần 1: Vấn đề: một đơn hàng, ba database",
      intro: [
        "Ta đã biết `@Transactional`: mọi câu lệnh trong method commit cùng nhau hoặc rollback cùng nhau. Nhưng lời hứa đó chỉ đúng trong **một connection tới một database**.",
        "Đặt hàng trong hệ microservices chạm ba service, mỗi service một database riêng:",
        "- **Order**: tạo đơn trong `order_db`.",
        "- **Inventory**: giữ hàng trong `inventory_db`.",
        "- **Payment**: thu tiền trong `payment_db`, thường còn gọi sang cổng thanh toán bên ngoài.",
        "Không có transaction nào bao được cả ba. Order commit xong, Payment lỗi, thì đơn đã nằm trong `order_db` và không có `ROLLBACK` nào kéo nó về được nữa.",
        "Kể cả trong **một service**, vấn đề vẫn xuất hiện khi ta ghi DB rồi gửi message lên Kafka. Đó là **dual write**: hai lần ghi vào hai hệ thống, không có transaction chung. Có hai cách hỏng:",
        "- **Send trong transaction, rồi DB rollback**: message đã đi, consumer xử lý một đơn không tồn tại (event ma).",
        "- **Commit rồi mới send, crash ở giữa**: đơn có thật, nhưng event mất vĩnh viễn. Inventory không giữ hàng, email không gửi.",
        "Cách thứ hai nghe an toàn hơn nhưng vẫn hỏng. Ta đã chạy thử: commit đơn, kill -9 tiến trình trước khi send, rồi đọc toàn bộ topic.",
      ],
      predict: {
        question: "Commit đơn xong, kill -9 tiến trình trước dòng `kafkaTemplate.send(...)`. Topic `order-events` có bao nhiêu message?",
        options: ["1, vì Kafka producer có buffer", "0", "2, vì retry", "Không biết, tuỳ `acks`"],
        answer: 1,
        explain: "Lệnh send chưa từng chạy nên producer chưa có gì trong buffer để gửi. Không có cơ chế nào nhớ rằng còn một event phải gửi.",
      },
      board: {
        title: "Dual write: hai lần ghi, không có transaction chung",
        highlight: "Dual write",
        chips: ["Một DB thì `@Transactional` đủ", "DB cộng Kafka thì không"],
        cards: [
          {
            title: "Commit rồi mới send",
            diagram: {
              kind: "flow",
              steps: ["INSERT đơn", "COMMIT", "kafka.send(OrderCreated)"],
              ok: ["Không crash", "Đơn và event đều có"],
              bad: ["Crash sau COMMIT", "Đơn có, event mất"],
            },
            notes: [
              "Đã chạy (mỗi bước là một JVM riêng, kill -9 tại điểm đánh dấu). Log và trạng thái thật:",
            ],
            code: `OrderPlacement : COMMITTED order 1 (naive, event not sent yet)
Crash          : PAUSED at after-commit (waiting for kill -9)
  [kill -9]
  orders in DB: 1 alice PENDING
TopicDump      : TOPIC order-events holds 0 record(s)`,
            takeaway: "Đơn tồn tại, event không bao giờ tới",
          },
          {
            title: "Vì sao `@Transactional` không cứu được",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "order_db", mark: "ok" },
                { label: "inventory_db", mark: "minus" },
                { label: "payment_db", mark: "minus" },
                { label: "Kafka", mark: "minus" },
              ],
              center: "@Transactional",
              rulesTitle: "Chỉ bao được",
              rules: ["Một connection tới một database", "Kafka có transaction riêng, không chung với DB", "Service khác có transaction của riêng nó"],
            },
            takeaway: "Ranh giới transaction là ranh giới database",
          },
        ],
        conclusion:
          "**Kết luận:** khi nghiệp vụ chạm hơn một hệ thống lưu trữ, phải chọn: transaction phân tán thật (2PC, Phần 2) hoặc chấp nhận nhất quán sau cùng bằng saga và outbox (Phần 3, 4).",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Mỗi service một database → không có transaction chung → mỗi bước commit riêng → lỗi giữa chừng để lại trạng thái nửa vời, phải có cơ chế khác để sửa."],
      },
      trap: {
        title: "\"Kafka có transaction rồi mà\"",
        text: "Kafka transaction chỉ bao các lần ghi vào Kafka (và offset). Nó không cùng transaction với PostgreSQL. `ChainedKafkaTransactionManager` (đã deprecated) chỉ commit hai cái lần lượt, crash giữa hai lần commit vẫn lệch. Đừng trả lời rằng bật Kafka transaction là hết dual write.",
      },
      quiz: {
        question: "Vì sao \"commit DB trước, send Kafka sau\" vẫn chưa an toàn?",
        options: [
          "Vì Kafka chậm hơn DB",
          "Vì tiến trình có thể chết giữa commit và send, event mất mà không ai biết để gửi lại",
          "Vì send sẽ bị rollback cùng DB",
          "Vì Kafka không nhận message khi DB đang commit",
        ],
        answer: 1,
        explain: "Hai lần ghi tách rời. Không có bản ghi nào nhớ rằng \"còn event chưa gửi\", nên crash ở giữa là mất hẳn. Outbox biến \"việc phải gửi\" thành một dòng DB commit cùng đơn.",
      },
    },
    {
      id: "two-phase-commit",
      title: "Phần 2: 2PC và XA: transaction phân tán thật",
      intro: [
        "Cách \"đúng sách\" để nhiều database commit cùng nhau là **two-phase commit (2PC)**. Chuẩn hoá cho database và message broker gọi là **XA**; trong Java là **JTA**, cần một transaction manager như Atomikos hoặc Narayana (Spring Boot 3 không còn tự cấu hình sẵn).",
        "Có một **coordinator** và nhiều **participant** (các database). Hai pha:",
        "- **Pha 1, prepare (bỏ phiếu)**: coordinator hỏi từng participant \"commit được không?\". Participant ghi đủ dữ liệu xuống đĩa để chắc chắn commit được sau này, **giữ nguyên lock**, rồi trả lời YES hoặc NO.",
        "- **Pha 2, commit hoặc abort**: tất cả YES thì coordinator ghi quyết định vào log của nó rồi bảo mọi bên commit. Chỉ một NO hoặc timeout là bảo mọi bên rollback.",
        "Điểm then chốt: sau khi trả lời YES, participant **mất quyền tự quyết**. Nó không được tự commit, cũng không được tự rollback, phải chờ coordinator. Trạng thái đó gọi là **in-doubt**.",
        "Vì sao microservices gần như không dùng:",
        "- **Blocking**: coordinator chết sau pha 1 thì participant ở trạng thái in-doubt, giữ lock cho tới khi coordinator sống lại. Mọi giao dịch khác chạm các dòng đó đứng chờ.",
        "- **Coordinator là điểm chết và nút cổ chai**: mọi giao dịch đi qua nó, thêm ít nhất hai vòng mạng, lock giữ suốt thời gian đó nên throughput giảm.",
        "- **Không phải ai cũng hỗ trợ**: Kafka không tham gia XA, phần lớn NoSQL và REST API của bên thứ ba (cổng thanh toán) cũng không.",
        "- **Gắn chặt các service**: tất cả phải dùng chung một transaction manager và cùng online, trái với ý tưởng mỗi service tự chủ.",
        "2PC vẫn có chỗ dùng: hệ thống nguyên khối chạm hai database cùng một nơi, hoặc bên trong một database phân tán (nhiều database phân tán dùng biến thể 2PC nội bộ). PostgreSQL có `PREPARE TRANSACTION`, nhưng `max_prepared_transactions` mặc định là `0`, tức tắt sẵn.",
      ],
      board: {
        title: "2PC: hai pha và điểm treo",
        highlight: "điểm treo",
        chips: ["Coordinator", "Participant", "In-doubt"],
        cards: [
          {
            title: "Đường đi bình thường",
            diagram: {
              kind: "flow",
              steps: ["Coordinator: PREPARE?", "Order DB: YES (giữ lock)", "Payment DB: YES (giữ lock)", "Coordinator ghi COMMIT vào log"],
              ok: ["Mọi bên YES", "COMMIT ở mọi bên, nhả lock"],
              bad: ["Một bên NO hoặc timeout", "ROLLBACK ở mọi bên"],
            },
            takeaway: "Quyết định nằm ở coordinator",
          },
          {
            title: "Coordinator chết sau pha 1",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "Order DB: in-doubt", mark: "minus" },
                { label: "Payment DB: in-doubt", mark: "minus" },
                { label: "Giao dịch khác chờ lock", mark: "minus" },
              ],
              center: "Coordinator chết",
              rulesTitle: "Hệ quả",
              rules: ["Participant không được tự commit hay rollback", "Lock giữ tới khi coordinator hồi phục", "Đây là lý do 2PC gọi là blocking protocol"],
            },
            takeaway: "Một điểm chết làm đứng nhiều database",
          },
        ],
        conclusion: "**Kết luận:** 2PC cho nhất quán mạnh nhưng trả bằng lock giữ lâu, coordinator là điểm chết, và đòi mọi bên hỗ trợ XA. Microservices thường đổi sang saga.",
      },
      takeaway: {
        lines: [
          "2PC: prepare (bỏ phiếu, giữ lock) rồi commit/abort theo quyết định của coordinator.",
          "Sau khi bỏ phiếu YES, participant phải chờ: coordinator chết là treo, giữ lock.",
        ],
      },
      trap: {
        title: "Nói \"2PC chậm\" là chưa đủ",
        text: "Phỏng vấn viên muốn nghe lý do cụ thể: participant in-doubt không tự quyết được nên giữ lock khi coordinator chết (blocking), Kafka và API bên ngoài không tham gia XA, và mọi service bị buộc chung một transaction manager. Chậm chỉ là hệ quả.",
      },
      quiz: {
        question: "Participant đã trả lời YES ở pha prepare thì coordinator chết. Participant làm gì?",
        options: [
          "Tự commit vì đã YES",
          "Tự rollback sau timeout",
          "Ở trạng thái in-doubt, giữ lock và chờ coordinator quyết định",
          "Hỏi participant khác rồi tự quyết theo số đông",
        ],
        answer: 2,
        explain: "Tự commit có thể sai nếu bên khác đã NO; tự rollback có thể sai nếu coordinator đã quyết COMMIT. Nên nó phải chờ, và đó là điểm blocking của 2PC.",
      },
    },
    {
      id: "saga",
      title: "Phần 3: Saga: chuỗi local transaction có bước bù",
      intro: [
        "Bài Microservices đã giới thiệu saga. Ở đây ta đi sâu vào một ví dụ đầy đủ và những chỗ dễ sai.",
        "**Saga** chia nghiệp vụ thành chuỗi **local transaction**, mỗi service commit phần của mình ngay. Nếu một bước sau thất bại, saga chạy **compensating transaction** (bước bù) cho các bước đã xong, theo thứ tự ngược lại.",
        "Bước bù **không phải rollback**. Dữ liệu đã commit và có thể đã được người khác nhìn thấy. Bước bù là một nghiệp vụ mới làm **mất tác dụng** của bước cũ: hoàn tiền chứ không xoá giao dịch thu, chuyển đơn sang `CANCELLED` chứ không xoá đơn.",
        "Ví dụ đặt hàng đầy đủ:",
        "- **B1. Order**: tạo đơn `PENDING`. Bù: chuyển đơn sang `CANCELLED` kèm lý do.",
        "- **B2. Inventory**: giữ hàng (reservation). Bù: nhả reservation, trả hàng về kho.",
        "- **B3. Payment**: thu tiền. Đây là **pivot**: thành công thì saga chắc chắn đi tới cùng.",
        "- **B4. Order**: chuyển đơn sang `APPROVED`. Chỉ retry, không bù.",
        "- **B5. Shipping và Notification**: tạo vận đơn, gửi email. Chỉ retry, không bù.",
        "Hai kịch bản lỗi:",
        "- **Hết hàng ở B2**: chỉ cần bù B1 (đơn `CANCELLED`, lý do `OUT_OF_STOCK`). B3 chưa chạy nên không có gì để hoàn tiền.",
        "- **Thẻ bị từ chối ở B3**: bù B2 (nhả hàng), rồi bù B1 (đơn `CANCELLED`, lý do `PAYMENT_DECLINED`).",
        "Ai điều phối các bước? Có hai kiểu, so sánh bên dưới.",
      ],
      predict: {
        question: "Saga có 5 bước như trên. Bước nào nên đặt TRƯỚC bước thu tiền?",
        options: [
          "Gửi email xác nhận, để khách biết sớm",
          "Các bước bù được dễ dàng như tạo đơn PENDING và giữ hàng",
          "Tạo vận đơn với hãng vận chuyển",
          "Không quan trọng thứ tự",
        ],
        answer: 1,
        explain: "Trước pivot chỉ đặt bước bù được. Email đã gửi thì không thu hồi, vận đơn đã tạo có thể tốn phí huỷ. Những bước như vậy đặt sau pivot, nơi saga chỉ còn đi tiếp.",
      },
      widgetTitle: "Choreography hay orchestration: ai biết toàn bộ luồng?",
      compare: [
        way(
          "Choreography (nghe event)",
          `// order-service
createOrder()      -> publish OrderCreated
on PaymentFailed   -> order.cancel("PAYMENT_DECLINED")

// inventory-service
on OrderCreated    -> reserve() -> publish StockReserved
on PaymentFailed   -> release()

// payment-service
on StockReserved   -> charge()  -> publish PaymentCompleted | PaymentFailed`,
          [
            ask("Có 3 bước, 2 service phản ứng lại khi lỗi", ok("Ít code, không có service trung tâm, mỗi service tự quyết khi nghe event.")),
            ask("Thêm bước kiểm tra gian lận giữa giữ hàng và thu tiền", bad("Phải sửa payment để nghe event mới, và nhớ ai nghe ai. Luồng không nằm ở một chỗ.")),
            ask("Khách hỏi đơn 123 đang kẹt ở đâu", bad("Phải ghép log của nhiều service theo traceId mới biết; dễ có vòng event khó thấy.")),
          ],
          "Hợp saga ngắn, ít bước. Nhiều bước thì luồng rải rác, khó đọc và khó debug.",
        ),
        way(
          "Orchestration (state machine)",
          `// order-service giữ OrderSaga, lưu state vào bảng saga_instance
start:            send ReserveStock         state = RESERVING
on StockReserved: send ChargePayment        state = CHARGING
on PaymentOk:     approve(); send Ship      state = APPROVED
on PaymentFailed: send ReleaseStock         state = COMPENSATING
on StockReleased: order.cancel(reason)      state = CANCELLED`,
          [
            ask("Thêm bước kiểm tra gian lận", ok("Thêm một state và một lệnh trong orchestrator, các service khác không đổi.")),
            ask("Khách hỏi đơn 123 đang kẹt ở đâu", ok("Đọc `saga_instance`: state hiện tại, bước đang chờ, thời điểm bắt đầu.")),
            ask("Orchestrator restart giữa chừng", ok("State nằm trong DB, nên đọc lại và đi tiếp. Lệnh gửi đi cũng nên qua outbox (Phần 4).")),
          ],
          "Luồng nằm ở một chỗ, dễ đọc, dễ theo dõi. Đổi lại orchestrator dễ phình thành nơi chứa logic của người khác.",
        ),
      ],
      after: [
        "Orchestrator chỉ nên ra lệnh và giữ trạng thái, logic nghiệp vụ vẫn ở service sở hữu dữ liệu. Có thể tự viết state machine với bảng `saga_instance`, hoặc dùng công cụ như Temporal, Camunda, Axon.",
        "Dù kiểu nào, mỗi bước \"commit local rồi gửi event/lệnh\" lại chính là dual write ở Phần 1. Vì vậy saga thực tế luôn đi cùng **transactional outbox** (Phần 4).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Mỗi bước commit local → bước sau lỗi → chạy bước bù theo thứ tự ngược → hệ thống nhất quán sau cùng, không bao giờ rollback được thật.",
          "Ít bước, ít service: choreography. Nhiều bước, cần theo dõi: orchestration.",
        ],
      },
      quiz: {
        question: "Thẻ bị từ chối ở bước thu tiền (B3). Saga làm gì?",
        options: [
          "Xoá đơn và xoá reservation khỏi database",
          "Nhả hàng đã giữ (bù B2), rồi chuyển đơn sang CANCELLED với lý do PAYMENT_DECLINED (bù B1)",
          "Gửi email xin lỗi rồi để nguyên đơn PENDING",
          "Gọi ROLLBACK trên cả ba database",
        ],
        answer: 1,
        explain: "Bù theo thứ tự ngược và bằng nghiệp vụ mới. Không xoá, để còn dấu vết và để service khác (đã có thể nhìn thấy đơn) thấy trạng thái cuối rõ ràng.",
      },
      parts: [
        {
          id: "compensation-pivot",
          senior: true,
          title: "Bước bù cũng có thể lỗi, và bước pivot",
          intro: [
            "Câu hỏi bẫy hay gặp: \"bước bù thất bại thì sao?\". Không có ai bù cho bước bù, nên bước bù **không được phép thất bại vĩnh viễn**. Thiết kế cho nó:",
            "- **Retry tới khi xong**: có backoff, lệnh bù nằm trong outbox hoặc state của orchestrator nên crash rồi vẫn chạy tiếp.",
            "- **Idempotent**: retry nghĩa là có thể chạy hai lần. \"Hoàn tiền giao dịch X\" chạy lần hai phải nhận ra đã hoàn và trả OK, không hoàn hai lần. Mang theo id của bước gốc (paymentId, reservationId) làm khoá chống trùng.",
            "- **Chịu được bước gốc chưa từng xảy ra**: lệnh thu tiền bị timeout, ta không biết tiền đã bị trừ hay chưa, nên vẫn gửi lệnh hoàn. Payment không tìm thấy giao dịch thì coi như đã bù xong, trả OK.",
            "- **Không có lỗi nghiệp vụ**: \"nhả hàng\" không bao giờ được trả \"không đủ hàng\". Nếu vẫn lỗi mãi (bug, dữ liệu hỏng), đưa saga sang trạng thái `COMPENSATION_FAILED`, bắn alert cho người xử lý tay.",
            "Richardson chia bước trong saga thành ba loại:",
            "- **Compensatable**: bù được, nằm trước pivot (tạo đơn PENDING, giữ hàng).",
            "- **Pivot**: điểm không quay lại. Thành công thì saga đi tới cùng; thất bại thì bù các bước trước. Thường là bước khó bù nhất hoặc dễ bị từ chối nhất, như thu tiền.",
            "- **Retriable**: sau pivot, không bao giờ thất bại về nghiệp vụ, chỉ retry (duyệt đơn, tạo vận đơn, gửi email).",
            "Một câu tách ứng viên: bước bù không phải lúc nào cũng xoá sạch được tác dụng. Email \"đặt hàng thành công\" đã gửi thì bù bằng email \"đơn đã huỷ\". Vì vậy những bước như thế đặt sau pivot.",
          ],
          board: {
            title: "Ba loại bước trong saga",
            highlight: "pivot",
            chips: ["Compensatable", "Pivot", "Retriable"],
            cards: [
              {
                title: "Thứ tự đặt bước",
                diagram: {
                  kind: "flow",
                  steps: ["Tạo đơn PENDING (bù được)", "Giữ hàng (bù được)", "Thu tiền (pivot)"],
                  ok: ["Pivot thành công", "Duyệt đơn, vận đơn, email: chỉ retry"],
                  bad: ["Pivot thất bại", "Nhả hàng, huỷ đơn: retry tới khi xong"],
                },
                notes: ["Bước bù và bước retriable đều phải idempotent, vì chúng được retry."],
                takeaway: "Sau pivot chỉ có đi tiếp",
              },
              {
                title: "Bước bù idempotent",
                diagram: {
                  kind: "pipe",
                  from: "Lệnh RefundPayment(paymentId)",
                  via: "Tra theo paymentId",
                  to: "Đã hoàn hoặc không có: trả OK",
                  skipped: ["Hoàn tiền lần hai", "Trả lỗi \"không tìm thấy\""],
                  skippedLabel: "Không làm",
                },
                notes: ["Lệnh gốc timeout thì không biết đã trừ tiền hay chưa, nên bước bù phải chịu được cả hai trường hợp."],
                takeaway: "Bù chạy hai lần vẫn như một lần",
              },
            ],
            conclusion: "**Kết luận:** đặt bước khó bù sau pivot, và thiết kế bước bù retry được, idempotent, chịu được bước gốc chưa xảy ra.",
          },
          trap: {
            title: "\"Bù lỗi thì bù cái bù\"",
            text: "Không có tầng bù thứ hai. Trả lời đúng: bước bù được retry tới khi xong (lệnh lưu bền trong outbox hoặc state của saga), idempotent, và nếu lỗi mãi thì saga sang trạng thái chờ người xử lý kèm alert.",
          },
          quiz: {
            question: "Lệnh thu tiền bị timeout, không rõ tiền đã trừ chưa. Saga quyết định bù. Payment nhận RefundPayment nhưng không tìm thấy giao dịch. Nên làm gì?",
            options: [
              "Trả lỗi để orchestrator retry mãi",
              "Coi như đã bù xong và trả OK; nếu giao dịch đến muộn thì cũng phải bị từ chối hoặc hoàn",
              "Tạo một giao dịch âm bằng số tiền đơn hàng",
              "Bỏ qua lệnh, không trả lời",
            ],
            answer: 1,
            explain: "Bước bù phải chịu được việc bước gốc chưa từng xảy ra. Nếu lệnh thu đến muộn sau lệnh bù, Payment cần ghi nhớ \"đã bù paymentId này\" để từ chối nó (Phần 5 nói thêm về chuyện này ở TCC).",
          },
        },
      ],
    },
    {
      id: "outbox",
      title: "Phần 4: Transactional outbox: không bao giờ mất event",
      intro: [
        "Bài Kafka đã giới thiệu outbox. Ở đây ta chạy nó thật, kill -9 ở những điểm khó nhất, và xem những chi tiết hay bị hỏi tiếp.",
        "Ý tưởng: thay vì gửi event lên Kafka, ta **ghi event vào bảng `outbox` trong cùng transaction với đơn**. Đơn và event commit cùng nhau hoặc cùng không. Một tiến trình khác (relay) đọc bảng `outbox` và publish lên Kafka.",
        "Bảng `outbox` tối thiểu có: `id` (UUID, đồng thời là message id), `aggregate_type`, `aggregate_id` (dùng làm Kafka key), `event_type`, `payload`, `created_at`, `published_at`.",
        "Ta chạy bốn bước, mỗi bước là một JVM riêng trên cùng PostgreSQL và Kafka:",
        "- **Bước 2**: tạo đơn qua outbox, kill -9 ngay sau commit, relay chưa từng chạy.",
        "- **Bước 3**: bật relay, nó send lên Kafka rồi bị kill -9 **trước khi** đánh dấu `published_at`.",
        "- **Bước 4**: bật lại relay, chạy bình thường.",
        "- **Bước 5**: consumer đọc topic (phần sau).",
      ],
      predict: {
        question: "Relay send thành công rồi chết trước khi `UPDATE outbox SET published_at = now()`. Khởi động lại relay, topic có bao nhiêu bản của event này?",
        options: ["1, vì Kafka tự chống trùng", "2, vì dòng outbox vẫn chưa đánh dấu nên relay gửi lại", "0, vì transaction của relay rollback cả message", "Không đoán được"],
        answer: 1,
        explain: "Đã chạy: offset 0 và offset 1 cùng `message_id`. Rollback DB của relay không kéo được message đã nằm trên Kafka. Outbox đảm bảo at-least-once, không phải exactly-once.",
      },
      widgetTitle: "Dual write và outbox khi tiến trình chết",
      compare: [
        way(
          "Dual write",
          `long id = tx.execute(s -> insertOrder(customer, total));
// <- kill -9 ở đây
kafka.send("order-events", String.valueOf(id), payload).get();`,
          [
            ask(
              "Crash sau commit, trước send",
              bad("Đã chạy: `COMMITTED order 1 (naive, event not sent yet)`, kill -9. DB có `1 alice PENDING`, topic `holds 0 record(s)`. Event mất, không ai biết để gửi lại."),
            ),
          ],
          "Không có bản ghi nào nhớ việc còn phải gửi.",
        ),
        way(
          "Outbox",
          `tx.execute(s -> {
  long orderId = insertOrder(customer, total);
  jdbc.update("""
    INSERT INTO outbox(id, aggregate_type, aggregate_id, event_type, payload)
    VALUES (?, 'Order', ?, 'OrderCreated', ?::jsonb)""",
    UUID.randomUUID(), String.valueOf(orderId), payload(orderId, total));
  return orderId;
});`,
          [
            ask(
              "Crash ngay sau commit, relay chưa chạy",
              ok("Đã chạy: `COMMITTED order 2 with its outbox row`, kill -9. Bảng outbox còn dòng `2 published_at=NULL`, việc phải gửi được nhớ trong DB."),
            ),
            ask(
              "Relay send xong, chết trước khi đánh dấu",
              ok("Đã chạy: `RELAY sent outbox 94d744c7... key=2 -> partition 2 offset 0`, kill -9, dòng vẫn `published_at=NULL`. Relay mới gửi lại: `offset 1`, rồi `marked ... published`."),
              bad("Topic có **hai** record cùng `message_id`. Consumer bắt buộc phải idempotent."),
            ),
          ],
          "Event không bao giờ mất khi đơn đã commit, đổi lại có thể bị gửi trùng.",
        ),
      ],
      after: [
        "Toàn bộ log từ bước 2 tới bước 4 (trích nguyên văn, đã bỏ phần đầu dòng):",
        "- `OrderPlacement : COMMITTED order 2 with its outbox row`, rồi kill -9.",
        "- `OutboxRelay : RELAY sent outbox 94d744c7-4455-49c9-8567-81c3f2ff3411 key=2 -> partition 2 offset 0`, rồi kill -9.",
        "- Relay mới: `RELAY sent outbox 94d744c7-... key=2 -> partition 2 offset 1` và `RELAY marked outbox 94d744c7-... published`.",
        "- Đọc topic: `partition 2 offset 0 key=2 message_id=94d744c7-...` và `partition 2 offset 1 key=2 message_id=94d744c7-...`.",
        "Cả hai bản nằm cùng partition 2 vì key là `aggregate_id` (`2`). Đó là cách giữ thứ tự event của cùng một đơn.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Event ghi vào bảng outbox cùng transaction với đơn → crash ở đâu cũng không mất → relay gửi lại tới khi đánh dấu được → at-least-once, consumer phải idempotent.",
        ],
      },
      quiz: {
        question: "Outbox đảm bảo điều gì về việc gửi event?",
        options: [
          "Exactly-once tới consumer",
          "Event được gửi ít nhất một lần khi và chỉ khi transaction nghiệp vụ đã commit",
          "Event được gửi trước khi DB commit",
          "Không bao giờ có bản trùng trên Kafka",
        ],
        answer: 1,
        explain: "Rollback thì dòng outbox cũng biến mất (không có event ma). Commit thì dòng còn đó tới khi relay đánh dấu, nên crash chỉ có thể sinh bản trùng, không làm mất.",
      },
      parts: [
        {
          id: "outbox-relay",
          senior: true,
          title: "Relay: polling hay CDC, thứ tự và dọn bảng",
          intro: [
            "Có hai cách đưa dòng outbox lên Kafka:",
            "- **Polling publisher**: một job `@Scheduled` query `WHERE published_at IS NULL ORDER BY created_at`, send, rồi đánh dấu. Dễ làm, chỉ cần DB và Kafka. Đổi lại: độ trễ bằng chu kỳ poll, và query liên tục đè lên DB (cần index cho dòng chưa gửi).",
            "- **CDC (change data capture)**: đọc log thay đổi của database (WAL của PostgreSQL qua logical replication, binlog của MySQL), mỗi INSERT vào `outbox` thành một message. Công cụ phổ biến là **Debezium** chạy trên Kafka Connect, có sẵn Outbox Event Router để định tuyến theo `aggregate_type` và dùng `aggregate_id` làm key. Độ trễ thấp, không query DB, nhưng thêm hạ tầng phải vận hành (Kafka Connect, replication slot).",
            "Ba chi tiết hay bị hỏi tiếp:",
            "- **Thứ tự**: dùng `aggregate_id` làm Kafka key để mọi event của một đơn vào cùng partition. Relay phải gửi tuần tự và chờ ack (ở bản chạy thử là `.get()`), vì gửi song song có thể làm event sau tới trước.",
            "- **Nhiều instance relay**: `SELECT ... FOR UPDATE SKIP LOCKED` để hai instance không lấy cùng dòng. Nhưng hai instance cùng xử lý hai event của **cùng một đơn** thì thứ tự lại vỡ. Cách an toàn: chỉ một relay chạy (leader election, hoặc chia việc theo hash của `aggregate_id`).",
            "- **Dọn bảng**: xoá dòng đã gửi cũ hơn vài ngày bằng job riêng, nếu không bảng phình và query poll chậm dần. Với CDC có thể xoá ngay sau khi insert, vì Debezium đọc từ log chứ không đọc bảng.",
            "Spring Modulith có Event Publication Registry làm việc tương tự: lưu event cùng transaction và gửi lại các event chưa hoàn tất. Nếu dùng nó, vẫn phải hiểu nó chỉ đảm bảo at-least-once.",
          ],
          board: {
            title: "Relay polling đã chạy thử",
            highlight: "polling",
            chips: ["FOR UPDATE SKIP LOCKED", "key = aggregate_id", "Gửi tuần tự"],
            cards: [
              {
                title: "Một vòng poll",
                diagram: {
                  kind: "flow",
                  steps: ["SELECT dòng chưa gửi, khoá lại", "send(key = aggregate_id).get()", "UPDATE published_at = now()"],
                  ok: ["Không crash", "COMMIT, dòng không gửi lại"],
                  bad: ["Crash trước UPDATE", "Dòng vẫn chưa gửi, vòng sau gửi lại"],
                },
                code: `@Scheduled(fixedDelay = 500)
@Transactional
public void publishBatch() throws Exception {
  var rows = jdbc.queryForList("""
    SELECT id, aggregate_id, payload::text AS payload FROM outbox
    WHERE published_at IS NULL ORDER BY created_at LIMIT 100
    FOR UPDATE SKIP LOCKED""");
  for (var row : rows) {
    var rec = new ProducerRecord<String, String>("order-events",
        (String) row.get("aggregate_id"), (String) row.get("payload"));
    rec.headers().add("message_id", row.get("id").toString().getBytes(UTF_8));
    kafka.send(rec).get(10, TimeUnit.SECONDS);
    jdbc.update("UPDATE outbox SET published_at = now() WHERE id = ?::uuid", row.get("id"));
  }
}`,
                takeaway: "Đánh dấu sau khi Kafka ack, nên chỉ có thể trùng, không thể mất",
              },
              {
                title: "Polling hay CDC",
                diagram: {
                  kind: "hub",
                  inputs: [
                    { label: "Polling: dễ, chỉ cần DB", mark: "plus" },
                    { label: "Polling: trễ theo chu kỳ, tải DB", mark: "minus" },
                    { label: "CDC: trễ thấp, không query", mark: "plus" },
                    { label: "CDC: thêm Kafka Connect", mark: "minus" },
                  ],
                  center: "Relay",
                  rulesTitle: "Chọn khi",
                  rules: ["Ít event, đội nhỏ: polling", "Nhiều event, đã có Kafka Connect: Debezium", "Cả hai đều at-least-once"],
                },
                takeaway: "Cách relay không đổi đảm bảo: vẫn at-least-once",
              },
            ],
            conclusion: "**Kết luận:** relay gửi theo key là `aggregate_id`, tuần tự, đánh dấu sau ack. Polling cho đơn giản, CDC cho độ trễ và tải DB.",
          },
          trap: {
            title: "Đánh dấu trước rồi mới gửi",
            text: "Nếu relay `UPDATE published_at` rồi mới send, crash giữa hai bước là event mất, quay về đúng lỗi dual write. Thứ tự đúng: send, chờ ack, rồi mới đánh dấu. Cái giá là có thể trùng.",
          },
          quiz: {
            question: "Chạy 3 instance relay polling với `FOR UPDATE SKIP LOCKED`. Rủi ro còn lại là gì?",
            options: [
              "Hai instance gửi cùng một dòng",
              "Event của cùng một đơn có thể được hai instance gửi song song, làm sai thứ tự",
              "Event bị mất",
              "Kafka từ chối vì trùng key",
            ],
            answer: 1,
            explain: "SKIP LOCKED chống lấy trùng dòng, nhưng không giữ thứ tự giữa các dòng của cùng aggregate. Dùng một relay duy nhất hoặc chia việc theo hash của `aggregate_id`.",
          },
        },
        {
          id: "inbox-consumer",
          title: "Consumer idempotent bằng inbox",
          intro: [
            "Outbox gửi at-least-once, và ta vừa thấy hai record cùng `message_id`. Bài Kafka đã nêu cách chặn: lưu id đã xử lý với khoá chính. Ở đây là bản chạy thật cùng outbox, gọi là **inbox** (hoặc bảng `processed_message`).",
            "Ba điểm thiết kế:",
            "- **Id lấy từ outbox**: `outbox.id` đi theo message trong header `message_id`. Relay gửi lại thì id vẫn vậy, còn offset thì đổi (0 rồi 1), nên không dùng offset để chống trùng.",
            "- **Khoá chính `(message_id, consumer)`**: cùng một event có thể được nhiều service nghe (inventory, notification), mỗi service đánh dấu riêng.",
            "- **Cùng transaction với nghiệp vụ**: `INSERT ... ON CONFLICT DO NOTHING` vào inbox, rồi ghi reservation. Insert được 0 dòng nghĩa là đã xử lý, bỏ qua.",
          ],
          board: {
            title: "Inbox chặn bản trùng",
            highlight: "Inbox",
            chips: ["Cùng message_id, khác offset"],
            cards: [
              {
                title: "Consumer đã chạy thử",
                diagram: {
                  kind: "flow",
                  steps: ["Đọc header message_id", "INSERT processed_message ON CONFLICT DO NOTHING", "Ghi stock_reservation"],
                  ok: ["Insert 1 dòng", "Giữ hàng, COMMIT cả hai"],
                  bad: ["Insert 0 dòng", "Đã xử lý, bỏ qua"],
                },
                code: `@KafkaListener(topics = "order-events", groupId = "inventory")
@Transactional
public void on(ConsumerRecord<String, String> rec) {
  UUID messageId = UUID.fromString(new String(
      rec.headers().lastHeader("message_id").value(), UTF_8));
  int inserted = jdbc.update("""
      INSERT INTO processed_message(message_id, consumer) VALUES (?, 'inventory')
      ON CONFLICT DO NOTHING""", messageId);
  if (inserted == 0) return;                      // đã xử lý
  jdbc.update("INSERT INTO stock_reservation(order_id) VALUES (?)",
      Long.parseLong(rec.key()));
}`,
                takeaway: "Database chặn bản trùng, không cần SELECT trước",
              },
              {
                title: "Kết quả thật",
                diagram: {
                  kind: "pipe",
                  from: "2 record, cùng message_id",
                  via: "processed_message (PK)",
                  to: "1 reservation",
                  skipped: ["So offset", "Giữ hàng hai lần"],
                  skippedLabel: "Không xảy ra",
                },
                code: `CONSUMER offset 0 message 94d744c7-... -> reserved stock for order 2
CONSUMER offset 1 message 94d744c7-... already processed, ignored
  stock_reservation: 1 row(s); processed_message: 1 row(s)`,
                takeaway: "At-least-once cộng inbox cho kết quả như đúng một lần",
              },
            ],
            conclusion: "**Kết luận:** outbox ở phía gửi và inbox ở phía nhận là một cặp. Thiếu một trong hai thì hoặc mất event, hoặc xử lý trùng.",
          },
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: ["Relay gửi lại → hai record cùng `message_id` → inbox insert lần hai được 0 dòng → bỏ qua → chỉ một reservation."],
          },
          quiz: {
            question: "Vì sao khoá chính của inbox nên là `(message_id, consumer)` chứ không chỉ `message_id`?",
            options: [
              "Để bảng nhỏ hơn",
              "Vì cùng một event được nhiều consumer xử lý độc lập, mỗi consumer cần đánh dấu riêng nếu dùng chung bảng",
              "Vì Kafka yêu cầu",
              "Để sắp xếp theo thứ tự",
            ],
            answer: 1,
            explain: "Nếu inventory và notification dùng chung bảng mà khoá chỉ là `message_id`, consumer xử lý sau sẽ tưởng event đã xong và bỏ qua. Mỗi service có database riêng thì không đụng nhau, nhưng ghi rõ `consumer` vẫn an toàn hơn.",
          },
        },
      ],
    },
    {
      id: "saga-isolation",
      senior: true,
      title: "Phần 5: Isolation trong saga, saga treo, và TCC",
      intro: [
        "Saga có A (bù), C (nhất quán sau cùng), D (mỗi bước commit), nhưng **không có I**. Mỗi bước commit ngay nên service khác nhìn thấy trạng thái dở dang của saga đang chạy. Ba bất thường điển hình:",
        "- **Dirty read**: saga A giữ 5 sản phẩm cuối, saga B đọc thấy \"hết hàng\" và từ chối khách. Sau đó A bị bù, hàng trả lại kho. B đã từ chối dựa trên dữ liệu không bao giờ thành sự thật.",
        "- **Lost update**: saga A đang huỷ đơn (bù), saga B cùng lúc cập nhật địa chỉ giao của đơn đó rồi ghi đè trạng thái.",
        "- **Fuzzy read**: một bước đọc số dư hai lần trong saga, giữa hai lần saga khác đã đổi nó.",
        "Không có lock xuyên service, nên ta chặn bằng thiết kế nghiệp vụ (countermeasure):",
        "- **Semantic lock**: bước bù được đặt cờ trạng thái như `PENDING`, `CANCELLING`. Ai đọc thấy cờ thì biết dữ liệu chưa chắc chắn: từ chối, chờ, hoặc xử lý khác. Đơn đang `PENDING` thì không cho sửa địa chỉ.",
        "- **Commutative updates**: thiết kế thao tác có thể đổi thứ tự mà kết quả như nhau. Ví dụ `stock = stock - 2` và `stock = stock + 2` thay vì `stock = 8`. Bù bằng cộng lại thì không ghi đè thay đổi của saga khác.",
        "- **Pessimistic view**: sắp lại bước để giảm hậu quả của dirty read. Ví dụ tăng số dư khả dụng ở bước retriable cuối cùng, còn giảm thì làm sớm.",
        "- **Reread value**: đọc lại bản ghi trước khi ghi, thấy đã đổi (so `version`) thì huỷ hoặc làm lại bước. Đây là optimistic lock áp lên saga.",
        "**Saga treo**: một service không bao giờ trả lời (message mất, service chết lâu). Saga kẹt ở `CHARGING` mãi, hàng bị giữ, khách chờ. Cách xử lý:",
        "- Mỗi saga có **deadline** lưu trong `saga_instance`. Một job quét saga quá hạn.",
        "- Quá hạn thì **hỏi lại trạng thái** bên kia (Payment có giao dịch này chưa?) rồi quyết định đi tiếp hay bù. Không hỏi được thì bù, vì bước bù đã chịu được bước gốc chưa xảy ra (Phần 3).",
        "- Reservation trong Inventory nên có **TTL** riêng: hết hạn mà chưa xác nhận thì tự nhả, để không phụ thuộc hoàn toàn vào orchestrator.",
      ],
      drill: {
        choices: ["Semantic lock", "Commutative updates", "Reread value", "Deadline và hỏi lại trạng thái"],
        items: [
          { q: "Khách sửa địa chỉ giao trong lúc đơn đang chờ thu tiền, rồi đơn bị huỷ và ghi đè thay đổi", a: "Semantic lock", why: "Đơn mang cờ `PENDING`, thao tác sửa địa chỉ bị từ chối hoặc xếp hàng tới khi đơn có trạng thái cuối." },
          { q: "Bước bù trả hàng ghi `stock = 10` (giá trị đọc lúc giữ hàng), xoá mất 3 sản phẩm saga khác vừa giữ", a: "Commutative updates", why: "Giữ hàng là `stock - n`, bù là `stock + n`. Thứ tự không còn quan trọng nên không ghi đè lẫn nhau." },
          { q: "Bước duyệt đơn cần chắc giá sản phẩm không đổi kể từ khi tạo đơn", a: "Reread value", why: "Đọc lại kèm `version`, khác thì huỷ hoặc làm lại bước. Giống optimistic lock." },
          { q: "Saga kẹt ở CHARGING 30 phút, Payment không gửi kết quả", a: "Deadline và hỏi lại trạng thái", why: "Job quét saga quá hạn, hỏi Payment, rồi đi tiếp hoặc bù." },
        ],
        summary: "Saga không có isolation, nên ta chặn bất thường bằng cờ trạng thái, phép cộng trừ đổi chỗ được, đọc lại kèm version, và deadline.",
      },
      takeaway: {
        lines: [
          "Saga thiếu I trong ACID: service khác thấy trạng thái dở dang.",
          "Chặn bằng semantic lock (`PENDING`), commutative updates (`+n`/`-n`), reread value (`version`); saga treo xử lý bằng deadline, hỏi lại trạng thái, TTL cho reservation.",
        ],
      },
      trap: {
        title: "Đặt isolation SERIALIZABLE cho saga",
        text: "Isolation level chỉ có tác dụng trong một transaction của một database. Saga gồm nhiều transaction ở nhiều database, nên SERIALIZABLE ở từng bước không chặn được dirty read giữa các bước. Phải dùng countermeasure ở mức nghiệp vụ.",
      },
      quiz: {
        question: "Saga A đang giữ hàng, saga B đọc thấy hết hàng và từ chối khách, rồi A bị bù. Đây là bất thường gì và chặn bằng gì phù hợp nhất?",
        options: [
          "Lost update, chặn bằng SERIALIZABLE",
          "Dirty read; chặn bằng semantic lock (reservation mang trạng thái chờ, B biết đó là hàng chưa chắc bán) hoặc pessimistic view",
          "Phantom read, chặn bằng index",
          "Không phải bất thường",
        ],
        answer: 1,
        explain: "B đọc dữ liệu chưa chắc chắn của saga khác: dirty read ở mức saga. Đánh dấu reservation là tạm thời giúp B biết có thể còn hàng sau một lúc, ví dụ báo \"đang có người giữ, thử lại sau\".",
      },
      parts: [
        {
          id: "tcc",
          senior: true,
          title: "TCC: Try, Confirm, Cancel",
          intro: [
            "**TCC** là một biến thể gần saga orchestration, hay gặp trong hệ thống thanh toán và trong framework như Seata. Mỗi service cung cấp ba thao tác:",
            "- **Try**: kiểm tra và **giữ chỗ** tài nguyên, chưa dùng thật. Ví dụ đóng băng 500.000đ trong tài khoản (số dư khả dụng giảm, số dư thật chưa đổi).",
            "- **Confirm**: dùng phần đã giữ. Chuyển 500.000đ đã đóng băng đi thật.",
            "- **Cancel**: nhả phần đã giữ.",
            "Khác saga ở đâu: saga commit thay đổi **thật** ngay rồi bù sau, nên người khác thấy trạng thái dở. TCC chỉ giữ chỗ ở pha Try, thay đổi thật chỉ xảy ra ở Confirm, nên isolation tốt hơn (giống một semantic lock có sẵn). Cái giá: mỗi service phải viết ba API và mô hình dữ liệu có cột \"đang giữ\".",
            "Hai bẫy riêng của TCC:",
            "- **Empty cancel (huỷ rỗng)**: Try bị timeout nên coordinator gửi Cancel, nhưng Try chưa từng tới. Cancel phải trả OK khi không thấy gì để nhả.",
            "- **Suspension (treo)**: Try tới **sau** Cancel do mạng chậm. Nếu Try vẫn giữ chỗ thì tài nguyên bị khoá mãi. Service phải nhớ \"giao dịch này đã cancel\" và từ chối Try đến muộn.",
            "Confirm và Cancel đều được retry nên phải idempotent.",
          ],
          cheat: [
            { name: "2PC / XA", one: "Prepare rồi commit, coordinator quyết", say: "Nhất quán mạnh nhưng blocking khi coordinator chết, và Kafka hay API ngoài không tham gia XA, nên em không dùng giữa các microservice." },
            { name: "Saga", one: "Local transaction, sai thì bù", say: "Mỗi bước commit thật rồi bù nếu bước sau lỗi. Nhất quán sau cùng, không có isolation nên em dùng trạng thái PENDING." },
            { name: "TCC", one: "Try giữ chỗ, Confirm dùng, Cancel nhả", say: "Giữ chỗ trước nên isolation tốt hơn saga, nhưng mỗi service phải có ba API và xử lý empty cancel, suspension." },
          ],
          quiz: {
            question: "Trong TCC, Cancel tới service trước khi Try (bị trễ mạng) tới. Service nên làm gì?",
            options: [
              "Cancel trả lỗi vì chưa có gì để huỷ, rồi xử lý Try bình thường",
              "Cancel trả OK và ghi nhớ giao dịch đã huỷ; Try đến sau thì bị từ chối",
              "Chờ Try tới rồi mới chạy Cancel",
              "Bỏ qua cả hai",
            ],
            answer: 1,
            explain: "Đó là empty cancel cộng suspension. Không ghi nhớ thì Try đến muộn sẽ giữ tài nguyên mà không bao giờ có Confirm hay Cancel nào nhả nó.",
          },
        },
      ],
    },
    {
      id: "choose-answer",
      title: "Phần 6: Chọn giải pháp và cách trả lời phỏng vấn",
      intro: [
        "Phỏng vấn viên thường hỏi mở: \"đặt hàng chạm ba service, làm sao đảm bảo nhất quán?\". Câu trả lời tốt đi theo thứ tự:",
        "- **Hỏi lại có thật cần phân tán không**: nếu Order và Inventory luôn đi cùng nhau, có khi nên chung một service, một database, dùng `@Transactional` là xong. Ranh giới service sai là nguồn gốc của nhiều saga không cần thiết.",
        "- **Chấp nhận nhất quán sau cùng**: khách thấy \"đơn đang xử lý\" vài giây là bình thường. Nếu nghiệp vụ không chấp nhận được, đó là dấu hiệu nên gộp service.",
        "- **Saga cho luồng nghiệp vụ**: orchestration khi nhiều bước, choreography khi hai ba bước. Nêu bước pivot và bước bù.",
        "- **Outbox cho mỗi lần \"ghi DB rồi gửi message\"**, kể cả trong orchestrator.",
        "- **Consumer idempotent** ở mọi nơi nhận message, kể cả bước bù.",
        "- **Isolation và treo**: trạng thái `PENDING`, deadline, job quét, alert khi bù thất bại.",
        "Kết bằng một con số hoặc một trải nghiệm cụ thể nếu có. Không có thì nói rõ đã thử ở lab.",
      ],
      drill: {
        choices: ["@Transactional một DB", "Saga + outbox", "2PC / XA", "Outbox (không cần saga)", "TCC"],
        items: [
          { q: "Lưu đơn và phát `OrderCreated` cho service email và báo cáo nghe, không ai cần bù", a: "Outbox (không cần saga)", why: "Chỉ một bước ghi DB rồi thông báo. Không có bước nào sau có thể làm đơn thất bại." },
          { q: "Đặt hàng qua Order, Inventory, Payment, mỗi service một database", a: "Saga + outbox", why: "Nhiều service, cần bù khi một bước thất bại, mỗi bước gửi message qua outbox." },
          { q: "Một ứng dụng nguyên khối cũ ghi vào hai database Oracle trong cùng một server ứng dụng, đã có JTA", a: "2PC / XA", why: "Cả hai bên hỗ trợ XA, cùng một nơi, đã có transaction manager. Ít thành phần mạng, chấp nhận được." },
          { q: "Tạo đơn và trừ kho, cả hai bảng nằm chung một database của một service", a: "@Transactional một DB", why: "Không có gì phân tán. Dùng transaction thường." },
          { q: "Chuyển tiền giữa hai ví ở hai service, không được để người khác thấy số dư tạm âm", a: "TCC", why: "Try đóng băng số tiền trước, Confirm mới chuyển thật, nên không ai thấy trạng thái dở như saga." },
        ],
        summary: "Không phân tán thì đừng phân tán. Một bước kèm thông báo: outbox. Nhiều service cần bù: saga + outbox. Cần giữ chỗ chặt: TCC. 2PC chỉ khi mọi bên hỗ trợ XA và nằm gần nhau.",
      },
      takeaway: {
        lines: [
          "Thứ tự trả lời: ranh giới service, nhất quán sau cùng, saga có pivot và bù, outbox, consumer idempotent, isolation và treo.",
        ],
      },
      trap: {
        title: "Nhảy thẳng vào framework",
        text: "Trả lời \"em dùng Seata\" hoặc \"em dùng Temporal\" mà không nói vì sao cần saga, bước nào là pivot, event có thể trùng thì xử lý thế nào, là dấu hiệu chỉ biết tên công cụ. Framework là chi tiết sau cùng.",
      },
      quiz: {
        question: "Service chỉ cần lưu đơn và báo cho service email gửi thư xác nhận. Giải pháp vừa đủ là gì?",
        options: [
          "Saga orchestration với bước bù gửi email huỷ",
          "2PC giữa DB và Kafka",
          "Outbox cho event OrderCreated, consumer email idempotent",
          "Gửi Kafka trong @Transactional",
        ],
        answer: 2,
        explain: "Không có bước nào sau có thể làm đơn thất bại nên không cần bù. Vấn đề duy nhất là dual write, outbox giải quyết; email phải idempotent để không gửi hai thư.",
      },
    },
  ],
  modelAnswer:
    "Dạ, `@Transactional` chỉ bao được một database, nên khi đặt hàng chạm Order, Inventory và Payment ở ba service thì em không có transaction chung. 2PC làm được về lý thuyết nhưng blocking khi coordinator chết, giữ lock lâu, và Kafka hay cổng thanh toán không tham gia XA, nên em dùng saga. Mỗi bước commit local: tạo đơn PENDING, giữ hàng, rồi thu tiền là bước pivot; thu tiền lỗi thì bù ngược lại, nhả hàng và huỷ đơn có lý do. Bước không bù được như gửi email em đặt sau pivot. Bước bù phải idempotent và retry tới khi xong, lỗi mãi thì alert để xử lý tay. Mỗi bước \"ghi DB rồi gửi message\" em dùng transactional outbox: ghi event vào bảng outbox cùng transaction, relay gửi lên Kafka với key là orderId để giữ thứ tự. Em đã thử kill -9 relay sau khi gửi mà chưa kịp đánh dấu, khởi động lại thì nó gửi lần hai cùng message_id, nên consumer dùng bảng inbox có khoá chính message_id, bản thứ hai bị bỏ qua. Vì saga không có isolation, em dùng trạng thái PENDING làm semantic lock, cập nhật kho kiểu cộng trừ, và có deadline cùng job quét saga treo.",
  cards: [
    { q: "Vì sao `@Transactional` không đủ khi đặt hàng chạm ba service?", a: "Nó chỉ bao một connection tới một database. Ba service có ba database, mỗi cái commit riêng." },
    { q: "Dual write là gì, hỏng thế nào?", a: "Ghi DB rồi gửi Kafka không chung transaction. Send trong transaction rồi rollback: event ma. Commit rồi crash trước send: mất event." },
    { q: "2PC chạy thế nào?", a: "Pha prepare: participant ghi đủ để commit, giữ lock, bỏ phiếu. Pha 2: coordinator quyết commit nếu mọi bên YES, ngược lại rollback." },
    { q: "Vì sao 2PC ít dùng trong microservices?", a: "Blocking khi coordinator chết (participant in-doubt giữ lock), coordinator là nút cổ chai, Kafka và API ngoài không hỗ trợ XA, buộc chặt các service." },
    { q: "Choreography khác orchestration?", a: "Choreography: service nghe event và phản ứng, luồng rải rác. Orchestration: một state machine ra lệnh, luồng ở một chỗ, dễ theo dõi." },
    { q: "Pivot transaction là gì?", a: "Bước không quay lại: thành công thì saga đi tới cùng, chỉ retry các bước sau; thất bại thì bù các bước trước. Thường là thu tiền." },
    { q: "Bước bù thất bại thì sao?", a: "Không có bù cho bù. Bước bù retry tới khi xong, idempotent, chịu được bước gốc chưa xảy ra; lỗi mãi thì trạng thái chờ người xử lý kèm alert." },
    { q: "Outbox đảm bảo gì?", a: "Event gửi ít nhất một lần khi và chỉ khi transaction nghiệp vụ commit. Có thể trùng (relay chết sau send trước khi đánh dấu), nên consumer phải idempotent." },
    { q: "Polling relay hay CDC?", a: "Polling: dễ, chỉ cần DB, nhưng trễ theo chu kỳ và tải DB. CDC (Debezium đọc WAL/binlog): trễ thấp, không query, thêm Kafka Connect phải vận hành." },
    { q: "Giữ thứ tự event của một đơn qua outbox thế nào?", a: "Key là aggregate_id để cùng partition, relay gửi tuần tự và chờ ack, không để nhiều relay xử lý cùng aggregate song song." },
    { q: "Saga thiếu tính chất nào của ACID, chặn ra sao?", a: "Thiếu isolation. Dùng semantic lock (PENDING), commutative updates (+n/-n), pessimistic view, reread value (version)." },
    { q: "TCC khác saga?", a: "Try chỉ giữ chỗ, Confirm mới dùng thật, Cancel nhả. Isolation tốt hơn nhưng ba API mỗi service, phải xử lý empty cancel và Try đến sau Cancel." },
  ],
};
