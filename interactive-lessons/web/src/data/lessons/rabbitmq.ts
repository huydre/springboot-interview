import type { Lesson } from "../types";

// Interview lesson: RabbitMQ and an online-judge style grading system under load.
// The ack, prefetch, retry via DLX and idempotency outputs quoted below were produced by running RabbitMQ 3.13.7 (docker image
// rabbitmq:3-management) with the Java amqp-client 5.21.0 on JDK 21. Contest-scale design (priority, rate limit, autoscaling,
// SSE) is described from general practice and was not load tested.
export const rabbitmq: Lesson = {
  slug: "rabbitmq",
  crumb: "RabbitMQ",
  videoDir: "/videos/rabbitmq",
  videoVersion: "0",
  scenes: [],
  title: "RabbitMQ và thiết kế hệ thống chấm bài khi nhiều người thi cùng lúc",
  subtitle:
    "Vì sao chấm bài cần queue, mô hình producer, exchange, queue, consumer, ack và prefetch, retry có delay với dead-letter, worker idempotent, thiết kế cả hệ thống contest và so với Kafka",
  openingQuiz: {
    question:
      "Cuối giờ thi có 5.000 người bấm Nộp bài trong vài phút, mỗi bài chấm mất vài giây. Cách nào hợp lý nhất để API nộp bài không sập?",
    options: [
      "Chấm ngay trong request nộp bài, tăng timeout lên thật lớn",
      "Lưu bài với trạng thái PENDING, đẩy một message vào queue, trả 202 ngay; worker lấy dần để chấm",
      "Tạo một thread mới cho mỗi bài nộp",
      "Bắt người dùng nộp lại sau vài phút",
    ],
    answer: 1,
    explain:
      "Việc chấm nặng và lệch pha với tốc độ nộp. Queue làm đệm: API chỉ ghi và trả 202, số worker quyết định tốc độ chấm. Chấm trong request thì giữ thread cả vài giây; thread không giới hạn thì sập CPU và RAM (Phần 1).",
  },
  roadmap: [
    "Chặng 1: vì sao chấm bài cần queue; mô hình RabbitMQ: producer, exchange, queue, binding, consumer.",
    "Chặng 2: ack, nack, requeue, prefetch cho công bằng, message bền vững và publisher confirms; lỗi, retry có delay bằng TTL và dead-letter, DLQ, worker idempotent.",
    "Chặng 3: thiết kế cả hệ thống contest (priority, sandbox, rate limit, SSE hay polling, scale theo độ dài queue) và so sánh với Kafka.",
  ],
  sections: [
    {
      id: "why-queue",
      title: "Phần 1: Vì sao chấm bài cần queue",
      intro: [
        "Câu hỏi hay gặp: 'Em sẽ làm một online judge như LeetCode thế nào? Hàng nghìn người nộp bài cùng lúc thì hệ thống xử lý ra sao?' Hãy bắt đầu từ nỗi đau, rồi mới tới công cụ.",
        "Cách ngây thơ là **chấm đồng bộ**: người dùng gọi `POST /submissions`, server biên dịch, chạy test rồi mới trả kết quả. Mỗi bài chiếm một thread của web server vài giây. Với 5.000 bài nộp cùng lúc thì thread hết, request xếp hàng ở load balancer, người dùng thấy timeout, và các API khác (xem đề, xem bảng điểm) cũng chết theo vì dùng chung server.",
        "Hai việc ở đây có **nhịp độ khác nhau**: nộp bài rất nhanh và dồn cục vào cuối giờ, còn chấm bài chậm và tốn CPU. Muốn hai thứ không kéo nhau sập thì chèn một **hàng đợi** ở giữa:",
        "- **Nộp bài**: API kiểm tra hợp lệ, ghi bản ghi `submission` với trạng thái `PENDING`, đẩy message chứa `submission_id` vào queue, trả ngay `202 Accepted` kèm id.",
        "- **Chấm bài**: một nhóm worker lấy message từ queue, chấm, ghi kết quả, đổi trạng thái sang `DONE`.",
        "- **Xem kết quả**: client hỏi trạng thái theo id (Phần 5 nói chi tiết cách client biết kết quả).",
        "Lợi ích: API trả lời trong vài chục mili giây dù hàng đợi dài; số worker (không phải số người nộp) quyết định tốc độ chấm; worker chết thì bài vẫn nằm trong queue; thêm worker là tăng tốc. Cái giá: kết quả không có ngay, hệ thống có thêm một thành phần phải vận hành, và phải xử lý các lỗi mới (message mất, chấm hai lần). Phần còn lại của bài là xử lý đúng các lỗi đó.",
        "Message chỉ nên chứa `submission_id`, không nhét cả source code. Code lấy từ database hoặc object storage khi chấm, vì queue không phải nơi lưu dữ liệu lâu dài và message nhỏ thì broker nhanh.",
      ],
      predict: {
        question: "Hàng đợi có 3.000 bài chưa chấm. Người dùng bấm Nộp thêm một bài. API nên phản ứng thế nào?",
        options: [
          "Từ chối vì hàng đợi đang dài",
          "Vẫn nhận, ghi PENDING, đẩy vào queue và trả 202; bài sẽ được chấm khi tới lượt",
          "Chấm ngay bài đó trong request cho nhanh",
          "Chờ tới khi hàng đợi hết mới nhận",
        ],
        answer: 1,
        explain:
          "Queue sinh ra để nhận tải dồn cục. API vẫn rẻ và nhanh. Từ chối chỉ đặt ra khi có chính sách giới hạn (ví dụ rate limit theo người dùng, Phần 5), không phải vì queue dài.",
      },
      board: {
        title: "Chấm đồng bộ và chấm qua queue",
        highlight: "queue",
        chips: ["202 Accepted", "PENDING", "worker", "đệm tải"],
        cards: [
          {
            title: "Nộp bài qua queue",
            diagram: {
              kind: "flow",
              steps: ["Client: POST /submissions", "API: ghi submission PENDING", "Publish submission_id vào queue", "Trả 202 + id ngay"],
              ok: ["Worker lấy từ queue", "Chấm, ghi kết quả, trạng thái DONE"],
              bad: ["Worker chết giữa chừng", "Message chưa ack nên trả về queue, worker khác chấm lại"],
            },
            notes: [
              "API không phụ thuộc thời gian chấm. Hàng đợi dài chỉ làm kết quả chậm hơn, không làm API chậm.",
              "Muốn nhanh hơn thì thêm worker, không phải thêm máy web.",
            ],
            takeaway: "Queue tách tốc độ nhận bài khỏi tốc độ chấm bài",
          },
        ],
        conclusion: "**Kết luận:** đừng làm việc nặng trong request. Ghi lại, xếp hàng, trả 202, để worker làm sau.",
      },
      takeaway: {
        lines: [
          "Chấm đồng bộ giữ thread cả vài giây nên sập khi tải dồn; queue làm đệm giữa nộp nhanh và chấm chậm.",
          "Luồng: ghi PENDING, publish submission_id, trả 202; worker chấm rồi ghi DONE. Cái giá là kết quả đến sau và phải xử lý lỗi message.",
        ],
      },
      quiz: {
        question: "Vì sao message trong queue chỉ nên chứa submission_id mà không chứa cả source code?",
        options: [
          "Vì RabbitMQ không gửi được chuỗi dài",
          "Vì queue không phải nơi lưu dữ liệu lâu dài; message nhỏ thì broker nhanh, code lấy từ database khi chấm",
          "Vì source code phải được mã hoá",
          "Vì worker không đọc được database",
        ],
        answer: 1,
        explain:
          "Dữ liệu thật nằm ở database hoặc object storage. Message nhỏ giúp broker nhanh, và khi chấm lại ta luôn lấy bản code đúng theo id thay vì bản sao trong message.",
      },
    },
    {
      id: "rabbitmq-model",
      title: "Phần 2: Mô hình RabbitMQ: producer, exchange, queue, consumer",
      intro: [
        "Ta đã biết cần một queue giữa API và worker. Nhưng producer của RabbitMQ không ghi thẳng vào queue, mà qua một lớp trung gian. Các thành phần:",
        "- **Producer**: bên gửi message (API nộp bài).",
        "- **Exchange**: nhận message từ producer và **quyết định đưa tới queue nào** theo quy tắc. Exchange không lưu message.",
        "- **Binding**: liên kết giữa một exchange và một queue, kèm routing key hoặc pattern.",
        "- **Queue**: nơi message chờ. Đây là chỗ duy nhất giữ message.",
        "- **Consumer**: bên nhận message từ queue (worker chấm bài).",
        "Ba loại exchange hay hỏi nhất:",
        "- **direct**: gửi tới queue có binding key **bằng đúng** routing key. Ví dụ routing key `judge` vào queue chấm bài.",
        "- **topic**: binding key là pattern với `*` (đúng một từ) và `#` (nhiều từ). Ví dụ `submission.java.contest42` khớp `submission.java.*` và `submission.#`.",
        "- **fanout**: bỏ qua routing key, gửi tới **mọi** queue đã bind. Hợp thông báo cho nhiều bên, ví dụ khi chấm xong thì một queue cập nhật bảng điểm, một queue gửi email.",
        "Còn có **default exchange**: publish vào exchange rỗng với routing key bằng tên queue là message vào thẳng queue đó. Đây là cách đơn giản nhất (ta dùng nó trong các thí nghiệm ở phần sau).",
        "Điểm quan trọng nhất với bài toán chấm bài: nhiều consumer cùng nghe **một queue** thì mỗi message chỉ tới **một** consumer. Đó là mô hình **competing consumers**: các worker tranh nhau lấy việc, thêm worker là thêm sức chấm. Khác với fanout, nơi mỗi queue nhận một bản sao.",
      ],
      board: {
        title: "Đường đi của một message trong RabbitMQ",
        highlight: "exchange",
        chips: ["producer", "exchange", "binding", "queue", "competing consumers"],
        cards: [
          {
            title: "Producer tới consumer",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "API nộp bài (producer)" },
                { label: "Routing key: judge" },
                { label: "Binding: judge.ex tới judge.q", mark: "calc" },
              ],
              center: "Exchange",
              rulesTitle: "Quy tắc cần nhớ",
              rules: [
                "Producer chỉ biết exchange, không biết queue",
                "Exchange không lưu message, queue mới lưu",
                "Nhiều worker trên một queue: mỗi message chỉ tới một worker",
                "Muốn nhiều bên cùng nhận bản sao: mỗi bên một queue, bind vào fanout hoặc topic",
              ],
            },
            notes: ["Tách producer khỏi queue giúp đổi cách định tuyến (thêm queue cho contest mới) mà không sửa code gửi."],
            takeaway: "Exchange định tuyến, queue lưu, consumer cạnh tranh trên cùng một queue",
          },
        ],
        conclusion: "**Kết luận:** exchange định tuyến, queue lưu giữ, và competing consumers là cách scale việc chấm.",
      },
      cheat: [
        { name: "direct", one: "Routing key khớp đúng binding key", say: "Direct exchange chuyển message tới queue có binding key trùng đúng routing key, hợp việc định tuyến cố định như gửi bài vào queue chấm." },
        { name: "topic", one: "Binding là pattern, * một từ, # nhiều từ", say: "Topic exchange cho phép bind theo pattern như submission.java.* nên em có thể tách queue theo ngôn ngữ hoặc theo contest mà không đổi code gửi." },
        { name: "fanout", one: "Gửi cho mọi queue đã bind, bỏ qua routing key", say: "Fanout phát một bản sao tới mọi queue đã bind, hợp thông báo sự kiện chấm xong cho nhiều bên cùng nghe." },
        { name: "Competing consumers", one: "Nhiều worker một queue, mỗi message một worker", say: "Nhiều consumer cùng nghe một queue thì mỗi message chỉ tới một consumer, nên thêm worker là tăng tốc chấm." },
      ],
      takeaway: {
        lines: [
          "Producer gửi vào exchange, exchange theo binding đẩy vào queue, consumer lấy từ queue.",
          "Một queue nhiều consumer là chia việc; nhiều queue bind vào fanout là chia bản sao.",
        ],
      },
      quiz: {
        question: "Ba worker cùng nghe queue judge.q. Có 9 bài được publish vào. Mỗi bài được xử lý thế nào (không có lỗi)?",
        options: [
          "Mỗi bài được cả ba worker nhận, chấm ba lần",
          "Mỗi bài chỉ tới một worker; ba worker chia nhau chín bài",
          "Chỉ worker đầu tiên nhận hết",
          "Bài nào cũng bị từ chối vì quá nhiều consumer",
        ],
        answer: 1,
        explain:
          "Đó là competing consumers. Muốn mỗi bên nhận một bản sao thì phải tách thành các queue riêng bind vào fanout hoặc topic.",
      },
    },
    {
      id: "delivery-reliability",
      title: "Phần 3: Ack, prefetch và message không được mất",
      intro: [
        "Ta đã biết worker lấy message từ queue. Nhưng nếu worker chết khi đang chấm dở thì sao? Bài có mất không? Câu trả lời nằm ở **acknowledgement (ack)**.",
        "Có hai chế độ:",
        "- **Auto ack**: broker coi message là xong ngay khi giao cho consumer. Consumer chết sau đó thì message **mất**.",
        "- **Manual ack**: consumer chủ động gọi `basicAck` **sau khi chấm xong và ghi kết quả**. Chưa ack mà kết nối đứt thì broker trả message về queue và giao lại cho consumer khác, kèm cờ `redelivered=true`.",
        "Còn `basicNack` (hoặc `basicReject`) báo là xử lý lỗi: với `requeue=true` message quay lại đầu queue ngay, với `requeue=false` message bị bỏ hoặc đi vào dead-letter exchange nếu queue có cấu hình (Phần 4). Lưu ý: `requeue=true` ngay lập tức dễ tạo vòng lặp vô tận với message lỗi.",
        "Cái giá của manual ack là **at-least-once**: một message có thể được giao **nhiều hơn một lần** (worker chấm xong nhưng chết trước khi ack). Vì thế worker phải idempotent, ta quay lại ở Phần 4.",
        "**Prefetch (QoS)** là số message tối đa chưa ack mà broker được phép đẩy cho một consumer. Mặc định, nếu không đặt, broker đẩy hết cho các consumer theo vòng tròn mà không quan tâm consumer đó có đang rảnh không. Bài chấm có độ nặng rất khác nhau (bài nhẹ 100 ms, bài nặng vài giây), nên vòng tròn có thể dồn hết bài nặng vào một worker trong khi worker kia ngồi chơi. Đặt `prefetch=1` thì worker chỉ nhận bài mới **sau khi** ack bài cũ, nên ai rảnh thì được giao tiếp.",
        "Cuối cùng, để message sống sót khi broker khởi động lại cần cả ba điều kiện: queue **durable**, message **persistent** (`deliveryMode=2`), và producer dùng **publisher confirms** để biết broker đã nhận thật. Thiếu một trong ba thì vẫn có thể mất. Đặc biệt, publish xong mà chưa có confirm thì bạn chưa biết message đã vào broker hay chưa.",
        "Trong Spring AMQP: prefetch mặc định của listener là 250, chế độ ack mặc định là AUTO (ack khi method listener trả về bình thường, còn ném exception thì reject kèm requeue). Hai điều này theo tài liệu, bài không chạy Spring; nhưng chúng là lý do hay gặp message lỗi bị giao lại liên tục và bài nặng bị dồn vào một worker.",
      ],
      predict: {
        question:
          "Hai worker, 10 bài nộp xen kẽ: bài lẻ nặng (1000 ms), bài chẵn nhẹ (100 ms). Nếu không đặt prefetch (broker đẩy hết ngay, chia vòng tròn), điều gì xảy ra?",
        options: [
          "Hai worker chia đều tải, xong sau khoảng 2,75 giây",
          "Một worker nhận toàn bài nặng, một worker nhận toàn bài nhẹ rồi ngồi chờ; tổng thời gian khoảng 5 giây",
          "Broker tự đoán độ nặng và chia lại",
          "Worker nhẹ lấy bớt việc của worker nặng",
        ],
        answer: 1,
        explain:
          "Chia vòng tròn theo thứ tự đến, không theo độ nặng: worker A trúng toàn bài lẻ. Đã chạy: 5039 ms. Với prefetch=1 xong sau 3322 ms (số liệu dưới).",
      },
      board: {
        title: "Ack, prefetch và độ bền của message",
        highlight: "ack",
        chips: ["manual ack", "redelivered", "prefetch=1", "durable", "persistent", "confirms"],
        cards: [
          {
            title: "Worker chết giữa chừng: auto ack và manual ack",
            diagram: {
              kind: "flow",
              steps: ["Publish 3 bài vào queue", "Worker 1 nhận cả ba", "Worker 1 chết (đứt kết nối)", "Worker 2 vào nhận bài"],
              ok: ["Manual ack, chưa ack", "Cả 3 bài trở lại queue, redelivered=true"],
              bad: ["Auto ack", "Không còn bài nào: 3 bài mất"],
            },
            notes: [
              "Đã chạy với RabbitMQ 3.13.7 và amqp-client 5.21.0 (queue không durable, chỉ để quan sát redelivery).",
              "Dòng 'worker1 chet' là ngắt kết nối bằng abort() mà không ack, mô phỏng worker bị kill.",
            ],
            code: `autoAck=true:
worker1 nhan sub-1, sub-2, sub-3
autoAck=true: worker1 chet (dong ket noi)
autoAck=true: worker2 nhan lai 0 message

autoAck=false:
worker1 nhan sub-1, sub-2, sub-3 (chua ack)
autoAck=false: worker1 chet (dong ket noi)
worker2 nhan sub-1 redelivered=true
worker2 nhan sub-2 redelivered=true
worker2 nhan sub-3 redelivered=true
autoAck=false: worker2 nhan lai 3 message`,
            takeaway: "Chỉ ack sau khi đã ghi kết quả; chưa ack thì message không mất",
          },
          {
            title: "Prefetch và công bằng giữa bài nặng, bài nhẹ",
            diagram: {
              kind: "pipe",
              from: "10 bài: lẻ nặng 1000 ms, chẵn nhẹ 100 ms",
              via: "prefetch=1: worker rảnh mới được giao bài tiếp",
              to: "Cả hai worker luôn bận, xong sớm hơn",
              skipped: ["Worker A giữ hết bài nặng", "Worker B ngồi rảnh sau 0,5 giây"],
              skippedLabel: "Tránh được khi đặt prefetch nhỏ",
            },
            notes: [
              "Đã chạy: 2 worker, 10 bài, lẻ ngủ 1000 ms, chẵn ngủ 100 ms; thời gian đo từ lúc publish tới khi bài cuối được ack.",
              "Lý thuyết tốt nhất khoảng 2,75 giây (5.500 ms việc chia hai). Đo được 3,3 giây vì bài nặng nằm lệch nhau.",
            ],
            code: `prefetch=khong gioi han tong 5039 ms
  worker A (5 job): [j1(cham), j3(cham), j5(cham), j7(cham), j9(cham)]
  worker B (5 job): [j2(nhanh), j4(nhanh), j6(nhanh), j8(nhanh), j10(nhanh)]

prefetch=1 tong 3322 ms
  worker A (5 job): [j1(cham), j4(nhanh), j6(nhanh), j7(cham), j9(cham)]
  worker B (5 job): [j2(nhanh), j3(cham), j5(cham), j8(nhanh), j10(nhanh)]`,
            takeaway: "Việc nặng nhẹ khác nhau thì đặt prefetch nhỏ để chia theo ai rảnh",
          },
          {
            title: "Durable, persistent và publisher confirms",
            diagram: {
              kind: "flow",
              steps: ["Declare queue durable=true", "Publish deliveryMode=2 (persistent)", "confirmSelect rồi waitForConfirms", "Broker ghi đĩa rồi confirm"],
              ok: ["Có confirm", "Producer biết message đã vào broker"],
              bad: ["Không có confirm hoặc nack", "Producer phải publish lại, nên message có thể trùng"],
            },
            notes: [
              "Đã chạy: publish 5 message persistent vào queue durable, broker confirm sau 11 ms; sau docker restart broker, queue durable.q vẫn còn 5 message.",
              "Queue không durable thì biến mất sau khi broker khởi động lại (quan sát được với các queue thí nghiệm ở trên). Persistent không có tác dụng nếu queue không durable.",
              "Với hệ thống cần an toàn khi mất node, queue loại quorum (bản 3.8 trở lên) nhân bản qua nhiều node. Phần này nói theo tài liệu, bài không dựng cụm.",
            ],
            code: `5 message persistent, broker da confirm sau 11 ms
(sau docker restart)
durable.q  durable=true  messages=5`,
            takeaway: "Mất message cần đủ ba thứ: durable, persistent, confirm",
          },
        ],
        conclusion:
          "**Kết luận:** manual ack sau khi ghi kết quả để không mất bài; prefetch nhỏ để chia việc công bằng; durable, persistent và confirms để sống sót khi broker khởi động lại.",
      },
      trap: {
        title: "Ack sớm, ack muộn",
        text:
          "Ack **trước** khi chấm xong thì worker chết sẽ làm mất bài (như auto ack). Ack **sau** khi ghi kết quả là đúng, nhưng worker có thể chết ngay sau khi ghi mà trước khi ack, nên bài bị giao lại và chấm lần hai. Vì vậy ack muộn luôn đi kèm worker idempotent.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Chưa ack mà worker chết, broker trả message về queue; đó là at-least-once, nên có thể trùng.",
          "Không đặt prefetch thì broker đẩy theo vòng tròn, bài nặng có thể dồn một chỗ; prefetch=1 chia theo ai rảnh.",
        ],
      },
      quiz: {
        question: "Muốn một bài đã nộp không mất ngay cả khi broker khởi động lại, cần tối thiểu gì?",
        options: [
          "Chỉ cần đặt message persistent",
          "Queue durable, message persistent, và producer dùng publisher confirms để biết broker đã nhận",
          "Chỉ cần auto ack",
          "Chỉ cần prefetch=1",
        ],
        answer: 1,
        explain:
          "Persistent mà queue không durable thì queue biến mất khi restart. Không có confirm thì producer không biết message đã tới broker hay chưa. Prefetch và ack lo chuyện khác (phân phối và worker chết).",
      },
    },
    {
      id: "retry-idempotent",
      title: "Phần 4: Lỗi, retry có delay và worker idempotent",
      intro: [
        "Giờ xét lỗi. Có hai nhóm khác hẳn nhau:",
        "- **Kết quả chấm hợp lệ nhưng là 'sai'**: biên dịch lỗi, sai đáp án, quá thời gian. Đó là kết quả bình thường, ghi `DONE` với verdict tương ứng rồi ack. Đừng retry.",
        "- **Lỗi hạ tầng**: sandbox hết bộ nhớ, mất kết nối database, worker bị kill. Lỗi tạm thời thì retry có ích.",
        "**Poison message** là message mà lần nào xử lý cũng lỗi (dữ liệu hỏng, bug). Nếu worker `nack` với `requeue=true`, message quay về queue ngay, bị lấy lại ngay, lỗi lại ngay, và vòng lặp này ngốn CPU không bao giờ dừng, còn chặn các bài khác. Cần ba thứ: **delay** giữa các lần thử, **giới hạn số lần**, và **chỗ cất** message hết lượt.",
        "Cách làm quen thuộc dùng **dead-letter exchange (DLX)** và **TTL**:",
        "- Queue chính `judge.q` được cấu hình `x-dead-letter-exchange` trỏ tới exchange retry. Khi worker `nack` với `requeue=false`, message bị 'chết' và đi vào exchange đó.",
        "- Retry queue `judge.retry.q` không có consumer, có `x-message-ttl` (ví dụ 1000 ms) và cũng có dead-letter exchange trỏ ngược lại exchange chính. Hết TTL thì message tự quay về `judge.q`: đó chính là **delay**.",
        "- Mỗi lần chết, RabbitMQ cộng dồn header `x-death` (số lần, hàng đợi, lý do). Worker đọc số lần này để biết đang thử lần mấy. Hết giới hạn thì publish message vào **DLQ** (dead-letter queue) và ack bản gốc để người vận hành xem xét.",
        "Một số lưu ý khi làm thật: với mỗi mức delay (5 giây, 30 giây) dùng một retry queue riêng, vì TTL theo từng message có thể bị message đứng trước chặn (chỉ message ở đầu queue mới được kiểm tra hết hạn). Và trong header `x-death`, trường tên queue có kiểu `LongString` chứ không phải `String` của Java: lần đầu em so sánh bằng `equals` với một `String` nên không bao giờ khớp, số lần thử luôn là 1 và poison message lặp mãi; phải chuyển sang chuỗi trước khi so sánh.",
        "Vì at-least-once, cùng một `submission_id` có thể tới worker **hai lần** (publisher confirm bị mất nên producer gửi lại; worker ack chậm rồi chết). Giải pháp là **worker idempotent** theo `submission_id` với máy trạng thái `PENDING` đến `JUDGING` đến `DONE`: trước khi chấm, worker **giành quyền** bằng một câu cập nhật có điều kiện, kiểu `UPDATE submission SET status='JUDGING' WHERE id=? AND status='PENDING'`. Chỉ khi số dòng bị đổi là 1 mới chấm. Bản trùng thấy trạng thái không phải PENDING thì chỉ ack rồi bỏ qua.",
        "Một ca tinh tế: worker chết khi đang `JUDGING`. Bản giao lại sẽ thấy `JUDGING` và bỏ qua, bài kẹt mãi. Cách xử lý: ghi thêm thời điểm bắt đầu chấm và cho phép giành lại trạng thái `JUDGING` đã quá hạn (ví dụ quá 2 phút), hoặc có job quét định kỳ. Phần này là thiết kế, chưa chạy trong bài.",
      ],
      predict: {
        question: "Một message có dữ liệu hỏng, worker nào nhận cũng ném exception. Worker nack với requeue=true. Điều gì xảy ra?",
        options: [
          "Message tự vào DLQ sau vài lần",
          "Message quay về queue ngay, bị lấy lại ngay, lặp vô tận ngốn CPU và chặn bài khác",
          "RabbitMQ xoá message",
          "Producer nhận thông báo lỗi",
        ],
        answer: 1,
        explain:
          "RabbitMQ không tự đếm số lần retry của requeue. Muốn có delay và giới hạn phải dùng nack requeue=false cùng DLX, TTL và tự đếm bằng x-death, rồi chuyển vào DLQ.",
      },
      board: {
        title: "Retry có delay, DLQ và idempotent",
        highlight: "DLQ",
        chips: ["nack requeue=false", "DLX", "TTL", "x-death", "DLQ", "idempotent"],
        cards: [
          {
            title: "Vòng retry bằng TTL và dead-letter",
            diagram: {
              kind: "flow",
              steps: [
                "judge.q (DLX trỏ tới judge.retry.ex)",
                "Worker lỗi: nack requeue=false",
                "judge.retry.q (TTL 1000 ms, không consumer)",
                "Hết TTL: dead-letter ngược về judge.ex",
              ],
              ok: ["Thử lại thành công", "Ack, ghi DONE"],
              bad: ["Đủ 3 lần vẫn lỗi", "Publish vào judge.dlq rồi ack bản gốc"],
            },
            notes: [
              "Đã chạy: ba message ok-1, bad-1, ok-2; bad-1 luôn lỗi. Giới hạn 3 lần, TTL 1000 ms.",
              "Các message ok không bị chặn bởi bad-1. Cuối cùng DLQ có đúng 1 message, judge.q và judge.retry.q đều rỗng.",
            ],
            code: `[  110 ms] cham ok-1 lan 1
[  116 ms] ok-1 OK
[  118 ms] cham bad-1 lan 1
[  118 ms] bad-1 loi, nack requeue=false -> retry queue (TTL 1000 ms)
[  119 ms] cham ok-2 lan 1
[  119 ms] ok-2 OK
[ 1137 ms] cham bad-1 lan 2
[ 1137 ms] bad-1 loi, nack requeue=false -> retry queue (TTL 1000 ms)
[ 2145 ms] cham bad-1 lan 3
[ 2145 ms] bad-1 het 3 lan, day vao DLQ
[ 4623 ms] DLQ co 1 message, judge.q 0, retry.q 0`,
            takeaway: "Delay bằng TTL, đếm bằng x-death, hết lượt thì DLQ",
          },
          {
            title: "Khai báo hạ tầng cho vòng retry (Java amqp-client)",
            diagram: {
              kind: "pipe",
              from: "judge.q (chính)",
              via: "judge.retry.q: TTL 1000 ms, DLX trỏ ngược judge.ex",
              to: "judge.q lần sau; judge.dlq khi hết lượt",
              skipped: ["requeue=true tại chỗ", "Vòng lặp nóng không delay"],
              skippedLabel: "Không dùng cho retry",
            },
            notes: ["Đây đúng là đoạn khai báo đã dùng trong thí nghiệm. Hai exchange direct có tên judge.ex và judge.retry.ex (judge.dlx cho DLQ)."],
            code: `ch.queueDeclare("judge.q", true, false, false,
  Map.of("x-dead-letter-exchange", "judge.retry.ex",
         "x-dead-letter-routing-key", "retry"));
ch.queueDeclare("judge.retry.q", true, false, false,
  Map.of("x-message-ttl", 1000,
         "x-dead-letter-exchange", "judge.ex",
         "x-dead-letter-routing-key", "judge"));
ch.queueDeclare("judge.dlq", true, false, false, null);
ch.queueBind("judge.q", "judge.ex", "judge");
ch.queueBind("judge.retry.q", "judge.retry.ex", "retry");
ch.queueBind("judge.dlq", "judge.dlx", "dead");`,
            takeaway: "Retry queue không có consumer, chỉ có TTL và đường dead-letter quay lại",
          },
          {
            title: "Worker idempotent theo submission_id",
            diagram: {
              kind: "flow",
              steps: ["Nhận message submission_id", "Giành quyền: PENDING sang JUDGING (điều kiện)", "Chấm", "Ghi kết quả, JUDGING sang DONE, ack"],
              ok: ["Giành được quyền", "Chấm thật, đúng một lần"],
              bad: ["Trạng thái đã là JUDGING hoặc DONE", "Chỉ ack và bỏ qua, không chấm lại"],
            },
            notes: [
              "Đã chạy: publish hai lần cùng submission s-42. Chỗ giành quyền mô phỏng bằng ConcurrentHashMap.replace(id, PENDING, JUDGING); trong hệ thống thật đó là UPDATE có điều kiện trên database.",
            ],
            code: `[   96 ms] claim s-42 PENDING -> JUDGING, cham that
[  106 ms] s-42 DONE
[  111 ms] bo qua s-42: trang thai la DONE, chi ack
[  112 ms] so lan cham that: 1`,
            takeaway: "Idempotent bằng cập nhật trạng thái có điều kiện, không bằng hy vọng",
          },
        ],
        conclusion:
          "**Kết luận:** nack requeue=false để vào đường retry có delay, đếm số lần, hết lượt thì DLQ; và worker luôn giành quyền bằng cập nhật có điều kiện để bản trùng không chấm lại.",
      },
      drill: {
        choices: ["Ack", "Nack requeue=false (vào retry)", "Đẩy vào DLQ rồi ack"],
        items: [
          { q: "Chấm xong, đã ghi kết quả 'Accepted' vào database", a: "Ack", why: "Việc đã hoàn tất và kết quả đã lưu, ack để broker xoá message." },
          { q: "Source code người dùng không biên dịch được", a: "Ack", why: "Compile Error là kết quả chấm hợp lệ, ghi DONE với verdict rồi ack. Retry chỉ làm lỗi lại y như cũ." },
          { q: "Sandbox hết bộ nhớ vì máy đang quá tải, đây mới là lần thử đầu", a: "Nack requeue=false (vào retry)", why: "Lỗi tạm thời: để TTL tạo delay rồi thử lại, có thể máy đã rảnh." },
          { q: "Message không parse được thành submission_id", a: "Đẩy vào DLQ rồi ack", why: "Thử lại bao nhiêu lần cũng hỏng; đưa thẳng vào DLQ cho người vận hành xem, không tốn lượt retry." },
          { q: "Đã thử 3 lần, lần nào cũng lỗi kết nối sandbox", a: "Đẩy vào DLQ rồi ack", why: "Hết giới hạn thì cất vào DLQ và cảnh báo, đừng lặp vô hạn." },
        ],
        summary: "Kết quả hợp lệ thì ack; lỗi tạm thời thì retry có delay; lỗi vĩnh viễn hoặc hết lượt thì DLQ.",
      },
      trap: {
        title: "Retry bằng requeue=true",
        text:
          "Requeue=true đưa message về đầu queue, không có delay và không có bộ đếm. Với poison message đây là vòng lặp nóng vô tận. Muốn retry hãy dùng nack requeue=false, DLX, TTL và giới hạn số lần.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "At-least-once nên có thể giao trùng; nên worker phải giành quyền bằng cập nhật có điều kiện PENDING sang JUDGING.",
          "Lỗi tạm thời: retry có delay bằng TTL và DLX; lỗi vĩnh viễn hoặc hết lượt: DLQ.",
        ],
      },
      quiz: {
        question: "Trong retry queue dùng TTL, vì sao retry queue không được có consumer?",
        options: [
          "Vì RabbitMQ không cho consumer đọc queue có TTL",
          "Vì nó chỉ để giữ message đủ thời gian TTL rồi dead-letter quay lại queue chính; có consumer thì message bị lấy ra ngay, không còn delay",
          "Vì consumer làm TTL chạy chậm",
          "Vì retry queue phải là fanout",
        ],
        answer: 1,
        explain:
          "Đoạn delay chính là thời gian message nằm chờ ở retry queue tới khi hết TTL. Có consumer ở đó thì message bị lấy ngay và delay biến mất.",
      },
    },
    {
      id: "contest-design",
      senior: true,
      title: "Phần 5: Thiết kế cả hệ thống contest (Senior)",
      intro: [
        "Ở level senior người phỏng vấn muốn nghe cả hệ thống, không chỉ queue. Hãy đi theo luồng của một bài nộp và nêu từng quyết định cùng đánh đổi.",
        "**Chia queue**: một queue chung đơn giản nhưng một contest lớn có thể nuốt hết worker và làm bài luyện tập của người khác chờ rất lâu. Có thể tách queue theo contest hoặc theo ngôn ngữ (dùng topic exchange với routing key như `submission.java.contest42`), và dùng **priority queue** (`x-max-priority`, giữ số mức nhỏ như 3) để contest đang diễn ra được chấm trước bài luyện tập. Đổi lại phải tính ngân sách worker cho từng queue, kẻo queue ưu tiên cao đói hết các queue còn lại.",
        "**Sandbox chấm bài**: code người dùng là code không tin cậy. Worker nên chạy nó trong container hoặc VM bị cô lập, giới hạn CPU, bộ nhớ, thời gian, số process, và **không có mạng**, filesystem chỉ đọc ngoài thư mục tạm. Lỗi ở đây (OOM, timeout của sandbox) là lỗi hạ tầng và đi đường retry; còn code vượt thời gian cho phép là verdict Time Limit Exceeded, ghi DONE.",
        "**Giới hạn tốc độ nộp**: không để một người nộp liên tục làm đầy queue. Giới hạn theo người dùng và theo bài, ví dụ một bài mỗi 10 giây, bằng token bucket đặt ở API gateway hoặc Redis; quá hạn mức thì trả 429. Đây là biện pháp bảo vệ trước khi tới queue, không thay cho việc queue tự chịu tải.",
        "**Client biết kết quả bằng cách nào**: có hai lựa chọn.",
        "- **Polling**: client gọi `GET /submissions/{id}` mỗi vài giây (có thể tăng dần khoảng cách). Đơn giản, chạy qua mọi proxy, dễ cache.",
        "- **SSE** (server đẩy một chiều qua HTTP): server giữ một kết nối và đẩy sự kiện khi worker ghi xong. Ít request hơn, nhưng phải gánh nhiều kết nối mở, và khi có nhiều instance phải có kênh chung (ví dụ worker publish sự kiện 'chấm xong' vào một fanout hoặc Redis pub/sub để instance giữ kết nối nhận được).",
        "Cuối contest thường là polling đủ dùng và an toàn: số người cùng chờ lớn, mỗi người chỉ cần kết quả trong vài giây.",
        "**Hàng đợi dài cuối giờ**: hiện tượng quen thuộc, tải dồn cục. Thay vì đoán số worker, **scale worker theo độ dài queue** (số message `ready` và thời gian chờ ước tính = số message chia tốc độ chấm). Autoscaler đọc số này từ management API hoặc metrics rồi thêm worker; khi queue vơi thì giảm. Giới hạn thực là CPU của máy chạy sandbox, nên cần trần tối đa. Prefetch nhỏ giúp worker mới nhận việc ngay.",
        "**Thứ tự**: RabbitMQ giữ thứ tự trong một queue, nhưng với nhiều worker cạnh tranh và có redelivery thì bài nộp trước chưa chắc chấm xong trước. Với online judge điều này chấp nhận được vì mỗi bài độc lập. Nếu cần xử lý theo thứ tự cho từng người dùng (ví dụ chỉ chấm bài mới nhất của một người), đừng trông vào queue: dùng số thứ tự trên submission và để worker bỏ qua bài đã lỗi thời.",
        "**Theo dõi**: đo độ dài queue, thời gian từ PENDING tới DONE, số message trong DLQ, số retry, tỉ lệ redelivered. Cảnh báo khi DLQ khác 0 hoặc thời gian chờ vượt ngưỡng.",
      ],
      board: {
        title: "Kiến trúc hệ thống chấm bài khi thi",
        highlight: "contest",
        chips: ["rate limit", "priority", "sandbox", "scale theo queue", "SSE hoặc polling"],
        cards: [
          {
            title: "Một bài nộp đi qua những gì",
            diagram: {
              kind: "flow",
              steps: [
                "Rate limit: 429 nếu nộp quá nhanh",
                "API ghi PENDING, publish (có confirm), trả 202",
                "Topic exchange: queue theo contest, priority",
                "Worker (prefetch nhỏ) giành quyền, chạy trong sandbox",
              ],
              ok: ["Ghi DONE, phát sự kiện", "Client nhận qua polling hoặc SSE"],
              bad: ["Lỗi hạ tầng", "Retry có delay, hết lượt thì DLQ và cảnh báo"],
            },
            notes: [
              "Autoscaler đọc số message ready của queue để tăng giảm số worker, có trần theo tài nguyên sandbox.",
              "Phần này là thiết kế theo thực hành chung, chưa đo tải trong bài.",
            ],
            takeaway: "Bảo vệ ở cửa vào, đệm bằng queue, cô lập khi chấm, scale theo độ dài queue",
          },
        ],
        conclusion: "**Kết luận:** hệ thống chịu tải nhờ nhiều lớp: giới hạn nộp, queue đệm, worker scale được, sandbox cô lập và đường lỗi rõ ràng.",
      },
      drill: {
        choices: ["Polling", "SSE", "Tăng worker", "Rate limit"],
        items: [
          { q: "10.000 người cùng chờ kết quả, mỗi người cần biết trong khoảng vài giây, hạ tầng có proxy cũ", a: "Polling", why: "Đơn giản, chạy qua mọi proxy, không phải giữ hàng nghìn kết nối mở." },
          { q: "Trang theo dõi live cần hiện trạng thái từng test case ngay khi vừa chạy xong", a: "SSE", why: "Cần server đẩy nhiều sự kiện nhỏ theo thời gian, một chiều." },
          { q: "Cuối giờ thi hàng đợi dài, thời gian chờ ước tính tăng đều", a: "Tăng worker", why: "Tốc độ chấm không theo kịp tốc độ nộp, scale worker theo độ dài queue." },
          { q: "Một người viết script nộp 50 bài mỗi giây", a: "Rate limit", why: "Chặn từ cửa vào theo người dùng, đừng để một người lấp đầy queue." },
        ],
        summary: "Nhiều người cùng chờ ít thông tin thì polling; sự kiện dồn dập thì SSE; queue dài thì thêm worker; lạm dụng thì rate limit.",
      },
      takeaway: {
        lines: [
          "Đi theo luồng bài nộp: rate limit, ghi PENDING, queue (theo contest, có priority), worker trong sandbox, client biết kết quả.",
          "Scale worker theo độ dài queue; không dựa vào thứ tự của queue; theo dõi độ dài queue, DLQ và thời gian chờ.",
        ],
      },
      quiz: {
        question: "Vì sao không nên dựa vào RabbitMQ để đảm bảo bài nộp trước được chấm xong trước?",
        options: [
          "Vì RabbitMQ luôn đảo thứ tự message",
          "Vì khi có nhiều worker cạnh tranh và có redelivery, bài đến trước chưa chắc xong trước; cần số thứ tự trên submission nếu thứ tự quan trọng",
          "Vì queue không giữ thứ tự gửi vào",
          "Vì prefetch làm sai thứ tự",
        ],
        answer: 1,
        explain:
          "Trong một queue, thứ tự giao ban đầu được giữ, nhưng nhiều worker chấm với độ nặng khác nhau và message lỗi được giao lại sau, nên thứ tự hoàn thành không đảm bảo.",
      },
    },
    {
      id: "vs-kafka",
      title: "Phần 6: RabbitMQ hay Kafka cho bài toán này",
      intro: [
        "Ta đã bàn nhiều về RabbitMQ, vậy khi được hỏi 'sao không dùng Kafka?' thì sao? Bài Kafka đã có phần **Kafka hay RabbitMQ: chọn theo bài toán** nói đầy đủ sự khác nhau giữa hai bên (log và offset so với broker đẩy và xoá sau ack), nên ở đây không lặp lại mà chỉ áp vào bài chấm.",
        "Chấm bài là **task queue**: mỗi bài chỉ một worker xử lý, xong thì bỏ, cần công bằng khi việc nặng nhẹ khác nhau, cần ưu tiên contest, cần retry có delay. Tất cả điều đó RabbitMQ làm gần như sẵn: ack từng message, prefetch, priority, DLX và TTL.",
        "Với Kafka, một partition chỉ một consumer trong group đọc, nên **độ song song bị chặn bởi số partition**; ack là commit offset nên khó retry riêng từng message và không có delay hay priority sẵn. Kafka vẫn có chỗ trong hệ thống này: **phát luồng sự kiện** 'bài nộp', 'chấm xong' cho các bên khác cần đọc lại hoặc replay (thống kê, chống gian lận, bảng điểm).",
        "Câu trả lời cân bằng: queue chấm bài dùng RabbitMQ; nếu hệ thống đã có Kafka và chấp nhận tự làm retry thì có thể dùng Kafka, nhưng phải nói rõ phần phải tự xây thêm.",
      ],
      quiz: {
        question: "Vì sao RabbitMQ hợp hơn cho chính hàng đợi chấm bài so với Kafka?",
        options: [
          "Vì RabbitMQ luôn nhanh hơn Kafka",
          "Vì đây là task queue: ack từng message, prefetch công bằng, priority, retry có delay bằng DLX và TTL đều có sẵn",
          "Vì Kafka không lưu được message",
          "Vì RabbitMQ không cần worker",
        ],
        answer: 1,
        explain:
          "Kafka mạnh ở log để nhiều bên đọc lại và replay, throughput cực lớn. Task queue với retry, priority và công bằng là sở trường của RabbitMQ.",
      },
    },
  ],
  modelAnswer:
    "Em không chấm trong request. API nộp bài ghi submission trạng thái PENDING, publish submission_id vào RabbitMQ rồi trả 202, còn các worker chấm sau, nên cuối giờ nộp dồn thì queue làm đệm và em chỉ cần thêm worker. Producer gửi vào exchange, nhiều worker cùng nghe một queue nên mỗi bài chỉ tới một worker. Worker ack thủ công sau khi ghi kết quả, nên worker chết thì bài trả về queue và giao lại; em đã chạy thử, auto ack thì mất cả ba bài, manual ack thì giao lại đủ. Em đặt prefetch bằng 1 để chia theo ai rảnh: lúc thử với bài nặng nhẹ xen kẽ, không đặt thì mất 5 giây, đặt 1 thì 3,3 giây. Queue durable, message persistent và publisher confirms để không mất bài khi broker khởi động lại. Lỗi tạm thời thì nack requeue=false vào retry queue có TTL rồi dead-letter quay lại, giới hạn ba lần, hết lượt thì vào DLQ để người vận hành xem. Vì at-least-once nên worker idempotent: giành quyền bằng UPDATE có điều kiện PENDING sang JUDGING theo submission_id, bản trùng chỉ ack. Cả hệ thống có rate limit ở cửa vào, queue theo contest có priority, sandbox cô lập, scale worker theo độ dài queue, và client dùng polling hoặc SSE để biết kết quả. Em chọn RabbitMQ vì đây là task queue; Kafka em dùng khi cần phát sự kiện để nhiều bên đọc lại.",
  cards: [
    { q: "Vì sao chấm bài không nên làm đồng bộ trong request?", a: "Chấm tốn vài giây và dồn cục cuối giờ; giữ thread nên sập server. Dùng queue: ghi PENDING, publish id, trả 202, worker chấm sau." },
    { q: "Producer, exchange, queue, binding, consumer là gì?", a: "Producer gửi vào exchange; exchange theo binding đẩy vào queue; consumer lấy từ queue. Exchange không lưu, queue mới lưu." },
    { q: "Direct, topic, fanout khác nhau thế nào?", a: "Direct: routing key khớp đúng. Topic: pattern với * và #. Fanout: gửi mọi queue đã bind, bỏ qua routing key." },
    { q: "Competing consumers là gì?", a: "Nhiều consumer cùng nghe một queue, mỗi message chỉ tới một consumer, nên thêm worker là tăng sức chấm." },
    { q: "Auto ack khác manual ack thế nào?", a: "Auto ack: coi là xong ngay khi giao, consumer chết thì mất. Manual ack: ack sau khi xử lý xong; chưa ack mà đứt kết nối thì message được giao lại (redelivered=true)." },
    { q: "Prefetch để làm gì?", a: "Giới hạn số message chưa ack cho một consumer. Prefetch nhỏ (1) chia việc theo ai rảnh, tránh dồn bài nặng vào một worker." },
    { q: "Muốn message sống sót khi broker khởi động lại cần gì?", a: "Queue durable, message persistent và publisher confirms để biết broker đã nhận." },
    { q: "Vì sao requeue=true không phải cách retry tốt?", a: "Message về đầu queue ngay, không delay, không đếm; poison message tạo vòng lặp nóng vô tận." },
    { q: "Retry có delay làm thế nào?", a: "Nack requeue=false, DLX đưa vào retry queue có TTL và không consumer, hết TTL dead-letter quay lại queue chính; đếm bằng x-death, hết lượt vào DLQ." },
    { q: "Worker idempotent theo submission_id là gì?", a: "Giành quyền bằng UPDATE có điều kiện PENDING sang JUDGING; chỉ khi đổi được mới chấm, bản trùng thấy trạng thái khác thì chỉ ack." },
    { q: "Hàng đợi dài cuối contest xử lý thế nào?", a: "Scale worker theo số message ready và thời gian chờ ước tính, có trần theo tài nguyên sandbox; rate limit ở cửa vào; cảnh báo khi DLQ khác 0." },
    { q: "RabbitMQ hay Kafka cho hàng đợi chấm bài?", a: "RabbitMQ: task queue với ack từng message, prefetch, priority, retry có delay. Kafka: log cho nhiều bên đọc lại và replay." },
  ],
};
