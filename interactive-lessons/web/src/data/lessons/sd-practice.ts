import timeline from "../timelines/sd-practice.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// From study note 10.02. Load and size figures are assumptions for mental arithmetic; Base62 outputs ran on JDK 21.
// Part 5 (feed, chat, notification, seat hold, upload, search) is described, not run.
export const sdPractice: Lesson = {
  slug: "sd-practice",
  crumb: "System Design Practice",
  videoDir: "/videos/sd-practice",
  videoVersion: "d4a4a4b8",
  scenes: timeline as Scene[],
  title: "System Design Practice",
  subtitle:
    "Khung trả lời 7 bước, ước lượng nhanh, hai thiết kế mẫu (URL shortener, đặt hàng và thanh toán), và sáu đề ngắn: bảng tin, chat, thông báo, giữ chỗ có hạn, upload file, tìm kiếm.",
  openingQuiz: {
    question: "Bước đầu tiên khi nhận đề \"thiết kế URL shortener\"?",
    options: ["Vẽ sơ đồ ngay", "Hỏi lại yêu cầu chức năng và phi chức năng", "Chọn Kafka", "Viết code"],
    answer: 1,
    explain: "Lao vào vẽ dễ thiết kế thừa hoặc thiếu chức năng quan trọng.",
  },
  roadmap: [
    "Chặng 1: khung 7 bước và ước lượng.",
    "Chặng 2: URL shortener.",
    "Chặng 3: order và checkout service.",
    "Chặng 4: sáu đề ngắn, đi thẳng vào deep dive.",
  ],
  sections: [
    {
      id: "framework",
      title: "Phần 1: Khung trả lời 7 bước",
      scene: "framework",
      intro: [
        "Bảy bước, đi theo thứ tự:",
        "- **Yêu cầu**: chức năng và phi chức năng.",
        "- **Ước lượng**: request/giây, dung lượng, tỉ lệ đọc ghi.",
        "- **API**",
        "- **Data model**",
        "- **High-level design**",
        "- **Deep dive**: 1–2 chỗ khó nhất.",
        "- **Trade-off**: và hướng mở rộng.",
        "Câu mẫu: \"Em xin hỏi lại phạm vi: có cần custom alias không, link có hết hạn không?\"",
        "Bẫy hay gặp:",
        "- **Vẽ ngay không hỏi**",
        "- **Im lặng suy nghĩ quá lâu**: hãy nghĩ thành tiếng.",
        "- **Nhồi buzzword không giải thích**",
        "- **Không tự nói điểm yếu**",
        "Interviewer bảo tự giả định thì nói rõ giả định và lý do, ghi lên bảng.",
      ],
      quiz: {
        question: "Ở level 2 năm, thiết kế nào ăn điểm hơn?",
        options: ["Nhiều công nghệ nhất", "Đơn giản, đúng, có lý do, tự nêu trade-off", "Có Kubernetes và service mesh", "Có sharding ngay từ đầu"],
        answer: 1,
        explain: "Interviewer chấm cách em lập luận, không chấm số công nghệ. Một thiết kế đơn giản mà mỗi lựa chọn có lý do và em tự nói điểm yếu của nó cho thấy em hiểu; thêm sharding hay service mesh khi tải không cần là thiết kế thừa.",
      },
    },
    {
      id: "estimate",
      title: "Phần 2: Ước lượng nhanh",
      scene: "estimate",
      intro: [
        "Bước 2 của khung là ước lượng. Mục đích không phải con số chính xác, mà là con số đủ để ra quyết định.",
        "Một ngày 86.400 giây, nhẩm là 10^5: 1 triệu việc mỗi ngày là khoảng 10 việc mỗi giây (chính xác 11,6). Quy trình: số người dùng → thao tác mỗi ngày → mỗi giây → peak → dung lượng = số bản ghi × kích thước × số ngày lưu.",
        "URL shortener với giả định 1 triệu link/ngày, đọc gấp 100:",
        "- **Tải**: khoảng 12 ghi và 1.200 đọc mỗi giây, peak ×5 là 60 và 6.000.",
        "- **Dung lượng**: 5 năm 1,825 tỉ link × 500 byte khoảng 1 TB.",
        "- **Cache**: 10 triệu link nóng khoảng 5 GB, vừa một Redis.",
        "- **Số mã**: 62^6 khoảng 56,8 tỉ, đã dư 30 lần.",
        "Kết luận: ghi nhỏ, một PostgreSQL đủ, đọc mới là chỗ cần cache.",
      ],
      predict: {
        question: "Tăng giả định từ 1 triệu lên **10 triệu** link mỗi ngày. Ghi trung bình khoảng bao nhiêu mỗi giây?",
        options: ["Khoảng 12", "Khoảng 120", "Khoảng 1.200", "Khoảng 12.000"],
        answer: 1,
        explain: "10 triệu ÷ 86.400 giây là khoảng 116, nhẩm nhanh là 10^7 ÷ 10^5 = 100. Kéo thanh trượt bên dưới để xem kết luận có đổi không.",
      },
      widget: "estimate-calc",
      widgetTitle: "Kéo giả định, xem kết luận đổi",
      quiz: {
        question: "Ước lượng ra vài request mỗi giây. Nên làm gì?",
        options: ["Vẫn thiết kế sharding cho chắc", "Nói thẳng một DB đủ, rồi nêu hướng mở rộng khi tải tăng", "Thêm Kafka", "Bỏ qua ước lượng"],
        answer: 1,
        explain: "Ước lượng là để dẫn tới quyết định. Vài request mỗi giây (kể cả khi đã nhân peak) thì một DB thừa sức; nói thẳng như vậy, rồi nói khi tải tăng thì thêm cache, replica, cuối cùng mới tới sharding.",
      },
    },
    {
      id: "shortener",
      title: "Phần 3: URL shortener",
      scene: "shortener",
      intro: [
        "Áp dụng khung vào bài đầu tiên, dùng đúng các con số vừa ước lượng.",
        "API: `POST /api/urls` nhận link dài, trả `201` kèm `code`; `GET /{code}` trả `302` kèm header `Location` là link dài. Bảng `short_url` có unique index trên `code`, không cần join.",
        "Redirect là đường nóng (đọc gấp 100 lần ghi), nên đi qua cache: tra Redis, hit thì 302 ngay; miss thì tra DB rồi nạp vào Redis kèm TTL. Redis chết thì DB vẫn là nguồn chính, chỉ chậm hơn; vì vậy đặt timeout ngắn khi gọi Redis để nó không kéo cả redirect chậm theo.",
        "301 hay 302? 301 nghĩa là \"chuyển hẳn\": browser cache lại, lần sau tự đi thẳng tới link dài mà không hỏi server. Đỡ tải, nhưng server không đếm được click và không chặn được link về sau. **302** thì mỗi click đều qua server, nên có thống kê và vô hiệu hoá được link độc hại.",
        "Đếm click bằng event Kafka hoặc `INCR` Redis rồi ghi xuống DB theo lô. Không `UPDATE count = count + 1` trực tiếp: link nổi tiếng là một dòng nóng, mọi click xếp hàng chờ lock của cùng một dòng.",
      ],
      board: {
        title: "URL shortener: đọc qua cache, đếm theo lô",
        highlight: "đọc qua cache",
        chips: ["302 để đếm được click", "Redis chết thì DB vẫn là nguồn chính"],
        cards: [
          {
            title: "Luồng redirect",
            diagram: {
              kind: "flow",
              steps: ["GET /{code}", "Tra Redis"],
              ok: ["Hit", "302 ngay"],
              bad: ["Miss", "Tra DB, nạp Redis + TTL"],
            },
            notes: ["Redirect là đường nóng, đọc gấp 100 lần ghi. Đặt timeout ngắn khi gọi Redis để nó không kéo redirect chậm theo."],
            takeaway: "Đường nóng thì đi qua cache",
          },
          {
            title: "Đếm click",
            diagram: {
              kind: "pipe",
              from: "Mỗi click",
              via: "INCR trong Redis",
              to: "Ghi DB theo lô",
              skipped: ["UPDATE count = count + 1"],
              skippedLabel: "Không dùng",
            },
            notes: ["Link nổi tiếng là một dòng nóng: mọi click xếp hàng chờ lock của cùng một dòng."],
            takeaway: "Ghi dồn vào một dòng thì gom lại rồi ghi theo lô",
          },
        ],
        conclusion: "**Kết luận:** đọc nóng đi qua cache, còn ghi dồn vào một dòng nóng thì gom lại.",
      },
      takeaway: {
        lines: [
          "Đọc nóng thì đi qua cache. Ghi dồn vào một dòng nóng (đếm click) thì gom lại rồi ghi theo lô.",
        ],
      },
      quiz: {
        question: "Cần thống kê click và vô hiệu hoá link độc hại. Chọn mã redirect nào?",
        options: ["301", "302", "200", "404"],
        answer: 1,
        explain: "301 bị browser cache nên server không thấy các lần click sau, và cũng không chặn được link đó nữa. 302 bắt mỗi click đi qua server.",
      },
      parts: [
        {
          id: "shortener-code",
          title: "Sinh mã ngắn: sequence + Base62",
          intro: [
            "**Base62** là viết một số theo cơ số 62, dùng 62 ký tự theo thứ tự `0-9`, rồi `a-z`, rồi `A-Z`. Ví dụ 125 = 2 × 62 + 1, nên viết là `21`. Sáu ký tự cho 62^6, khoảng 56,8 tỉ mã.",
            "Ba cách sinh mã:",
            "- **Sequence + Base62**: lấy số tăng dần do DB cấp cho mỗi dòng mới (sequence, như `id` tự tăng) rồi đổi sang Base62. Không bao giờ trùng, nhưng **đoán được**: id 1000 ra `g8` thì id kế tiếp ra `g9`, người ngoài dò lần lượt là xem được link của người khác.",
            "- **Hash rồi cắt**: lấy vài ký tự đầu của hash link dài. Có thể trùng, phải kiểm tra.",
            "- **Random**: khó đoán, gặp trùng thì sinh lại (nhờ unique index trên `code`).",
            "Đã chạy trên JDK 21 với bảng ký tự trên: `encode(125) = 21`, `encode(1000) = g8`, `encode(1001) = g9`, `encode(1_000_000_000) = 15FTGg`, `encode(62^6 - 1) = ZZZZZZ`. Thử encode và decode trong widget.",
          ],
          widget: "base62",
          widgetTitle: "Base62 encode và decode",
          quiz: {
            question: "Mã sinh bằng sequence + Base62 có nhược điểm gì?",
            options: [
              "Có thể trùng mã",
              "Mã tăng dần nên đoán được: biết một mã là dò được các mã kế bên",
              "Quá dài",
              "Không decode được",
            ],
            answer: 1,
            explain: "Sequence không bao giờ cấp trùng số, nên mã không trùng. Nhưng số kế tiếp chỉ hơn 1, nên mã kế tiếp đoán được (`g8` rồi `g9`). Link riêng tư thì dùng random, hoặc trộn số trước khi encode.",
          },
        },
      ],
    },
    {
      id: "checkout",
      title: "Phần 4: Order và checkout service",
      scene: "checkout",
      intro: [
        "URL shortener khó ở phần đọc. Checkout thì khó ở chỗ khác.",
        "Yêu cầu phi chức năng:",
        "- **Không oversell**: không bán quá số hàng có.",
        "- **Không trừ tiền hai lần**",
        "- **Không tạo đơn trùng**",
        "- **Chịu được flash sale**",
        "Ước lượng: 50.000 đơn/ngày chỉ khoảng 0,6 đơn/giây, nhưng flash sale 20.000 người tranh 500 sản phẩm trong 60 giây là khoảng 333 request/giây **vào cùng một dòng product**. Vấn đề là dòng nóng và tính đúng đắn, không phải thông lượng.",
        "Oversell xảy ra thế nào: tồn kho còn 1. Hai request cùng đọc `stock = 1`, cùng thấy đủ hàng, cùng trừ và cùng lưu. Kết quả: bán hai cái trong khi chỉ có một ({{check-then-act|check-then-act}}: kiểm tra và hành động tách rời, nên request kia chen vào giữa).",
        "Cách mặc định là gộp kiểm tra và trừ vào **một câu lệnh**: `UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty`. DB khoá dòng trong lúc chạy câu này, nên request thứ hai chờ, rồi thấy `stock = 0` không thoả điều kiện: câu lệnh cập nhật 0 dòng, tức hết hàng, báo lỗi cho user.",
        "Trừ kho lúc nào? Đa số chọn **giữ chỗ có hạn lúc đặt đơn**: đặt đơn là trừ kho ngay, đơn ở trạng thái `PENDING_PAYMENT` kèm `expires_at` (ví dụ 15 phút). Quá hạn mà chưa trả tiền thì một job định kỳ huỷ đơn và cộng lại kho, cũng bằng `UPDATE` có điều kiện trạng thái để không đụng đơn vừa kịp trả tiền.",
      ],
      board: {
        title: "Checkout: trừ kho đúng, giữ chỗ có hạn",
        highlight: "giữ chỗ có hạn",
        chips: ["Không oversell", "Đơn PENDING_PAYMENT có hạn"],
        cards: [
          {
            title: "Một câu UPDATE",
            diagram: {
              kind: "hub",
              inputs: [{ label: "Request A", mark: "calc" }, { label: "Request B", mark: "calc" }],
              center: "UPDATE product",
              rulesTitle: "Kiểm tra và trừ",
              rules: ["Gộp trong một câu lệnh", "DB khoá dòng khi chạy", "Request sau cập nhật 0 dòng: hết hàng"],
            },
            code: `UPDATE product SET stock = stock - :qty
      WHERE id = :id AND stock >= :qty`,
            takeaway: "Không còn khe hở để request khác chen vào",
          },
          {
            title: "Giữ chỗ có hạn",
            diagram: {
              kind: "flow",
              steps: ["Đặt đơn, trừ kho ngay", "PENDING_PAYMENT, hạn 15 phút"],
              ok: ["Trả tiền kịp", "PAID"],
              bad: ["Quá hạn", "Huỷ đơn, cộng lại kho"],
            },
            notes: ["Job định kỳ huỷ đơn bằng `UPDATE` có điều kiện trạng thái, để không đụng đơn vừa kịp trả tiền."],
            takeaway: "Hàng không bị giữ mãi bởi người không trả tiền",
          },
        ],
        conclusion: "**Kết luận:** gộp kiểm tra và trừ vào một câu `UPDATE` có điều kiện, và cho đơn một hạn thanh toán.",
      },
      predict: {
        question: "Tồn kho còn 1. Hai request cùng chạy `UPDATE product SET stock = stock - 1 WHERE id = :id AND stock >= 1`. Kết quả?",
        options: [
          "Cả hai bán được, tồn kho thành -1",
          "Một request cập nhật 1 dòng, request kia cập nhật 0 dòng, tức hết hàng",
          "Cả hai bị deadlock",
          "Tuỳ may rủi, có lúc bán được 2",
        ],
        answer: 1,
        explain: "DB khoá dòng trong lúc chạy câu lệnh, nên request thứ hai chờ, rồi thấy `stock = 0` không thoả `stock >= 1`. Kiểm tra và trừ nằm trong một câu, không còn khe hở để chen vào.",
      },
      widget: "checkout-guard",
      widgetTitle: "Chặn ở đâu",
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Đọc tồn kho rồi mới trừ → hai request cùng thấy còn hàng → oversell → gộp kiểm tra và trừ vào **một câu `UPDATE` có điều kiện**.",
        ],
      },
      quiz: {
        question: "Trừ kho lúc đặt đơn hay lúc thanh toán xong?",
        options: [
          "Lúc thanh toán, luôn luôn",
          "Đa số chọn giữ chỗ có hạn lúc đặt đơn, kèm job trả kho khi quá hạn",
          "Không cần trừ",
          "Trừ trên cache",
        ],
        answer: 1,
        explain: "Trừ lúc thanh toán thì nhiều người có thể cùng trả tiền cho món cuối, phải hoàn tiền cho người đến sau. Giữ chỗ lúc đặt đơn tránh được điều đó; cái giá là hàng bị giữ bởi người không trả tiền, nên cần hạn giữ và job trả kho.",
      },
      parts: [
        {
          id: "checkout-multi",
          title: "Đơn nhiều sản phẩm: trừ theo thứ tự cố định",
          intro: [
            "Câu `UPDATE` trên chỉ lo một sản phẩm. Đơn thật thường có nhiều sản phẩm, mỗi sản phẩm một dòng cần khoá.",
            "Đơn có nhiều sản phẩm thì luôn trừ theo `productId` tăng dần. Lý do: đơn A trừ sản phẩm 1 rồi 2, đơn B trừ 2 rồi 1; A giữ khoá dòng 1 chờ dòng 2, B giữ khoá dòng 2 chờ dòng 1, hai bên chờ nhau mãi (deadlock). Cùng một thứ tự thì không thể chờ vòng. Thêm `CHECK (stock >= 0)` làm lưới an toàn cuối cùng nếu code lỡ sai.",
          ],
          quiz: {
            question: "Đơn A trừ sản phẩm 1 rồi 2, đơn B trừ sản phẩm 2 rồi 1, chạy cùng lúc. Cách sửa đơn giản nhất là gì?",
            options: [
              "Cho mỗi đơn chờ ngẫu nhiên vài giây",
              "Mọi đơn đều trừ theo `productId` tăng dần, nên không thể chờ vòng",
              "Bỏ điều kiện `stock >= :qty`",
              "Chỉ cho một đơn chạy mỗi lần trên toàn hệ thống",
            ],
            answer: 1,
            explain: "Deadlock cần một vòng chờ: A giữ 1 chờ 2, B giữ 2 chờ 1. Cùng một thứ tự khoá thì B cũng phải khoá 1 trước, chờ A, không còn vòng.",
          },
        },
        {
          id: "checkout-idempotency",
          title: "Không tạo đơn trùng: Idempotency-Key",
          intro: [
            "Kho đã không bán quá. Còn đơn trùng do gửi lại thì sao?",
            "User bấm \"Đặt hàng\", mạng chậm, app tự gửi lại. Không chặn thì có hai đơn. Cách chặn: client sinh một UUID cho mỗi lần checkout và gửi trong header `Idempotency-Key`; retry thì gửi lại **đúng key đó**. Cột `idempotency_key` có unique constraint, nên DB từ chối bản ghi thứ hai.",
            "Hai request cùng key chạy song song: một bên insert thành công, bên thua nhận `DataIntegrityViolationException`. Bên thua phải đọc lại đơn đã có và trả về đơn đó, như thể chính nó tạo ra.",
            "Chỗ dễ sai: bắt lỗi này **ở ngoài** method `@Transactional` (annotation của Spring: cả method chạy trong một transaction DB), rồi đọc lại đơn trong một transaction mới. Lý do: lỗi xảy ra bên trong thì transaction đó đã hỏng. Spring đánh dấu nó rollback-only (chỉ còn đường rollback), và PostgreSQL từ chối mọi câu lệnh tiếp theo trong transaction đã gặp lỗi, nên không đọc lại được ở đó.",
          ],
          quiz: {
            question: "Bên thua bắt `DataIntegrityViolationException` khi insert đơn trùng key. Vì sao phải bắt ở ngoài `@Transactional` rồi đọc lại trong transaction mới?",
            options: [
              "Vì exception này không bắt được bên trong",
              "Vì transaction gặp lỗi đã hỏng (rollback-only), không chạy tiếp câu SELECT trong đó được",
              "Vì đọc ngoài transaction nhanh hơn",
              "Không cần, đọc lại trong cùng transaction cũng được",
            ],
            answer: 1,
            explain: "Lỗi ràng buộc làm transaction hiện tại chỉ còn đường rollback. Để nó rollback xong, rồi mở transaction mới đọc đơn mà bên thắng đã tạo.",
          },
        },
        {
          id: "checkout-payment",
          title: "Thanh toán và webhook",
          intro: [
            "**Không gọi payment provider bên trong transaction DB.** Gọi qua mạng mất vài giây; trong lúc đó transaction giữ một connection của pool và giữ khoá dòng kho. Flash sale vài trăm request như vậy là pool cạn. Thứ tự đúng: commit đơn và giữ kho trước, gọi provider sau.",
            "Kết quả thanh toán về qua {{webhook|webhook}}, và webhook có thể tới nhiều lần. Ba lớp chặn:",
            "- **Xác minh chữ ký**: đúng là provider gửi.",
            "- **`provider_txn_id` unique**: cùng một giao dịch chỉ ghi một lần.",
            "- **Chuyển trạng thái có điều kiện**: `UPDATE orders SET status = 'PAID' WHERE id = :orderId AND status = 'PENDING_PAYMENT'`. Webhook thứ hai cập nhật 0 dòng nên không làm gì.",
            "Đơn sang PAID thì ghi event vào outbox trong cùng transaction, relay đẩy lên Kafka để gửi email. Như vậy không có cảnh đơn đã PAID mà mất event.",
          ],
          takeaway: {
            lines: [
              "Commit đơn và giữ kho **trước**, gọi payment provider **sau**, không bao giờ gọi bên trong transaction DB.",
            ],
          },
          quiz: {
            question: "Webhook \"thanh toán thành công\" của cùng một đơn tới hai lần. Cái gì làm lần thứ hai vô hại?",
            options: [
              "Không có cách, phải xử lý tay",
              "`UPDATE ... WHERE status = 'PENDING_PAYMENT'`: lần hai đơn đã PAID nên cập nhật 0 dòng; thêm `provider_txn_id` unique",
              "Gọi lại provider để hỏi",
              "Xoá đơn rồi tạo lại",
            ],
            answer: 1,
            explain: "Điều kiện trạng thái biến việc chuyển PENDING_PAYMENT → PAID thành chỉ xảy ra được một lần; unique trên mã giao dịch chặn ghi trùng.",
          },
        },
      ],
    },
    {
      id: "designs",
      title: "Phần 5: Sáu đề hay gặp, đi thẳng vào chỗ khó",
      intro: [
        "Hai bài trên đi đủ 7 bước. Phần này là sáu đề hay gặp, mỗi đề chỉ đi vào **bước deep dive**, vì đó là chỗ interviewer hỏi sâu nhất.",
        "Một deep dive tốt có ba nhịp:",
        "- **Nói điểm nghẽn bằng con số**: \"tài khoản 50 triệu follower đăng bài là 50 triệu lần ghi\", không phải \"chỗ này có thể chậm\".",
        "- **Đưa 2 đến 3 phương án**, từ đơn giản tới mạnh.",
        "- **Chọn một và nói cái giá** của nó.",
      ],
      quiz: {
        question: "Interviewer hỏi \"phần nào khó nhất trong thiết kế này?\". Câu trả lời nào ăn điểm hơn?",
        options: [
          "\"Chỗ này có thể chậm, em sẽ thêm cache\"",
          "Nêu điểm nghẽn kèm con số, đưa 2 đến 3 phương án từ đơn giản tới mạnh, chọn một và nói cái giá của nó",
          "Liệt kê càng nhiều công nghệ càng tốt",
          "Nói rằng thiết kế không có điểm yếu",
        ],
        answer: 1,
        explain: "Con số cho thấy em hiểu vấn đề thật; nhiều phương án và cái giá cho thấy em biết cân nhắc, không học thuộc một đáp án.",
      },
      parts: [
        {
          id: "news-feed",
          title: "Bảng tin: fan-out khi ghi hay khi đọc",
          intro: [
            "URL shortener đọc gấp 100 lần ghi. Bảng tin còn lệch hơn: mỗi người mở app hàng chục lần một ngày, và mỗi bảng tin gom bài mới của hàng trăm người họ đang theo dõi.",
            "Cách thẳng nhất: mỗi lần mở app chạy `SELECT ... WHERE author_id IN (300 id) ORDER BY created_at DESC LIMIT 20`. Đúng, nhưng đắt, và chạy hàng nghìn lần mỗi giây.",
            "Hai hướng:",
            "- **Fan-out khi ghi (push)**: đăng bài thì ghi `postId` vào timeline của từng follower, ví dụ Redis Sorted Set `timeline:{userId}` với score là thời gian, giữ vài trăm bài mới nhất. Sorted Set là tập hợp có điểm (score), tự sắp xếp theo điểm: `ZADD` thêm một phần tử, `ZREVRANGE` lấy từ điểm cao nhất xuống, `ZREMRANGEBYRANK` xoá theo thứ hạng để cắt bớt bài cũ. Đọc bảng tin chỉ là một lệnh lấy 20 phần tử đầu. Ghi tốn: một bài nhân số follower.",
            "- **Fan-out khi đọc (pull)**: đăng bài chỉ ghi một dòng. Mở bảng tin thì lấy bài mới của từng người mình theo dõi rồi trộn theo thời gian. Ghi rẻ, đọc đắt.",
            "**Celebrity**: tài khoản 50 triệu follower mà push thì một bài là 50 triệu lần ghi, follower cuối cùng thấy bài sau nhiều phút. Cách thường dùng là **kết hợp**: người thường thì push; tài khoản rất nhiều follower thì không push, lúc đọc mới lấy bài của các tài khoản đó rồi trộn vào timeline đã có.",
            "Thêm vài chi tiết: push chạy bất đồng bộ qua queue (đăng bài trả về ngay, worker làm fan-out); không push cho người lâu không đăng nhập, họ quay lại thì dựng bảng tin theo kiểu pull; timeline chỉ chứa `postId`, nội dung bài lấy theo lô từ cache bài viết.",
          ],
          predict: {
            question: "Hệ thống push cho mọi tài khoản. Một người có 50 triệu follower đăng bài. Vấn đề là gì?",
            options: [
              "Không vấn đề gì, push luôn nhanh",
              "Một bài thành 50 triệu lần ghi timeline: worker quá tải, follower nhận bài trễ nhiều phút",
              "Follower không đọc được bảng tin",
              "Bài bị mất",
            ],
            answer: 1,
            explain: "Chi phí ghi của push tỉ lệ với số follower. Với tài khoản lớn, pull lúc đọc rẻ hơn nhiều.",
          },
          widgetTitle: "Hai cách dựng bảng tin",
          compare: [
            way(
              "Fan-out khi ghi (push)",
              `POST /posts   (tác giả có 300 follower)
  -> lưu bài
  -> queue: với từng follower f
       ZADD timeline:{f} <time> <postId>
       ZREMRANGEBYRANK timeline:{f} 0 -801     # giữ 800 bài mới nhất
GET /feed      -> ZREVRANGE timeline:{me} 0 19  -> lấy nội dung 20 bài theo lô`,
              [
                ask("Mở bảng tin", ok("Một lệnh `ZREVRANGE` rồi một lần lấy nội dung theo lô: rất rẻ.")),
                ask("Celebrity 50 triệu follower đăng bài", bad("50 triệu lần `ZADD` cho một bài; bài tới follower trễ, tốn bộ nhớ Redis.")),
              ],
              "Đọc rẻ, ghi tỉ lệ với số follower.",
            ),
            way(
              "Fan-out khi đọc (pull)",
              `POST /posts   -> lưu một dòng
GET /feed      -> lấy 300 người mình đang theo dõi
               -> lấy vài bài mới nhất của từng người
               -> trộn theo thời gian, lấy 20`,
              [
                ask("Mở bảng tin", bad("300 lần tra (hoặc một query `IN` 300 id) cho mỗi lần mở app.")),
                ask("Celebrity 50 triệu follower đăng bài", ok("Chỉ một dòng; ai mở bảng tin thì tự lấy.")),
              ],
              "Ghi rẻ, đọc đắt. Kết hợp cả hai là đáp án thường gặp.",
            ),
          ],
          takeaway: {
            lines: [
              "Push cho người thường, pull cho tài khoản rất lớn rồi trộn khi đọc. Timeline chỉ chứa id bài.",
            ],
          },
          quiz: {
            question: "Cách kết hợp push và pull xử lý tài khoản 50 triệu follower thế nào?",
            options: [
              "Push cho họ như mọi người, chỉ cần thêm worker",
              "Không push bài của họ; khi một follower mở bảng tin thì lấy bài mới của các tài khoản lớn đang theo dõi và trộn vào timeline",
              "Không cho tài khoản lớn đăng bài",
              "Chỉ dùng pull cho mọi người",
            ],
            answer: 1,
            explain: "Mỗi người chỉ theo dõi vài tài khoản lớn, nên lấy thêm bài của họ lúc đọc là rẻ, còn push bài của họ thì cực đắt.",
          },
        },
        {
          id: "chat",
          title: "Chat: kết nối và luồng một tin nhắn",
          intro: [
            "Bảng tin chấp nhận trễ vài giây. Chat thì người nhận phải thấy tin gần như ngay, và thấy **đúng thứ tự**.",
            "Kết nối: mỗi client giữ một WebSocket tới một chat server (xem bài System Design Concepts, phần realtime). Lưu `userId → server đang giữ kết nối` trong Redis, có TTL và được gia hạn bằng heartbeat.",
            "Luồng một tin nhắn:",
            "- **Lưu trước**: server nhận tin, ghi vào DB rồi mới báo \"đã gửi\" cho người gửi.",
            "- **Chuyển tiếp**: tra server đang giữ kết nối của người nhận, chuyển tin qua pub/sub hoặc queue để server đó đẩy xuống.",
            "- **Người nhận offline**: tin vẫn nằm trong DB; gửi push notification. Mở app thì client kéo các tin sau `seq` cuối cùng nó đã có.",
          ],
          takeaway: {
            lines: [
              "Lưu DB trước rồi mới báo đã gửi và đẩy. Người offline thì tin nằm trong DB, mở app kéo bù theo `seq`.",
            ],
          },
          quiz: {
            question: "Server nhận tin, nên báo \"đã gửi\" cho người gửi lúc nào?",
            options: [
              "Ngay khi nhận, rồi mới lưu sau",
              "Sau khi đã ghi vào DB",
              "Sau khi người nhận đã đọc",
              "Không cần báo",
            ],
            answer: 1,
            explain: "Báo trước khi lưu mà server chết thì người gửi tin rằng tin đã đi nhưng nó mất luôn. Lưu trước thì tin còn trong DB, đẩy lại được.",
          },
        },
        {
          id: "chat-ordering",
          title: "Chat: thứ tự tin nhắn và gửi lại an toàn",
          intro: [
            "Tin nhắn đã đi được tới người nhận. Còn hai việc: hiện **đúng thứ tự**, và không nhân đôi tin khi client gửi lại.",
            "Thứ tự: không sắp theo giờ trên điện thoại (đồng hồ mỗi máy lệch nhau), cũng không theo giờ của nhiều server khác nhau. Server cấp **số thứ tự tăng dần cho từng cuộc trò chuyện** (`seq`), ví dụ `INCR` Redis theo `conversationId`, hoặc tăng `last_seq` trong dòng conversation. Client hiển thị theo `seq`; thấy lỗ (có 41 rồi tới 43) thì tự kéo bù.",
            "Gửi lại an toàn: mạng chập chờn làm client gửi lại. Client gắn `clientMsgId` (UUID) cho mỗi tin, server có unique `(conversation_id, client_msg_id)`, gửi lại thì trả tin cũ.",
            "Lưu trữ: bảng `message` khoá chính `(conversation_id, seq)`, nên đọc lịch sử là quét một khoảng liên tiếp trong một cuộc trò chuyện.",
          ],
          takeaway: {
            lines: [
              "Thứ tự theo `seq` server cấp cho từng cuộc trò chuyện, không theo đồng hồ. Gửi lại an toàn nhờ `clientMsgId` unique. Lưu DB trước rồi mới đẩy.",
            ],
          },
          quiz: {
            question: "Vì sao không sắp xếp tin nhắn theo `created_at` lấy từ điện thoại người gửi?",
            options: [
              "Vì `created_at` tốn chỗ",
              "Vì đồng hồ mỗi máy lệch nhau, hai tin gửi gần nhau có thể bị đảo; dùng `seq` do server cấp cho từng cuộc trò chuyện",
              "Vì DB không sort được theo thời gian",
              "Vì WebSocket không gửi được thời gian",
            ],
            answer: 1,
            explain: "Một nguồn duy nhất cấp số tăng dần cho mỗi cuộc trò chuyện thì mọi client thấy cùng một thứ tự.",
          },
        },
        {
          id: "notification",
          title: "Hệ thống gửi thông báo: queue, retry, chống gửi trùng",
          intro: [
            "Chat đẩy tin cho người đang online. Notification service lo phần còn lại: email, SMS, push, qua các nhà cung cấp bên ngoài có thể chậm hoặc sập.",
            "Vấn đề nếu gọi thẳng: order-service gọi API gửi SMS ngay trong request đặt hàng. Nhà cung cấp chậm 5 giây là đặt hàng chậm 5 giây; nhà cung cấp sập là đặt hàng lỗi.",
            "Luồng gợi ý:",
            "- **Phát event**: service nghiệp vụ ghi event (`OrderPaid`) qua outbox (ghi event vào bảng cùng transaction với nghiệp vụ, rồi mới đẩy lên Kafka; xem bài System Design Concepts) lên Kafka, không gọi thẳng nhà cung cấp.",
            "- **Quyết định gửi gì**: notification service đọc event, tra cài đặt của user (kênh nào, giờ không làm phiền, đã tắt loại này chưa), dựng nội dung từ template.",
            "- **Queue riêng cho từng kênh**: email, SMS, push mỗi kênh một queue và một nhóm worker. SMS chậm không làm kẹt push.",
            "- **Queue riêng theo mức ưu tiên**: OTP và cảnh báo giao dịch không xếp hàng sau chiến dịch marketing 1 triệu email.",
            "- **Retry rồi DLT**: lỗi tạm thời thì retry có {{backoff|backoff}}, quá số lần thì vào DLT (dead-letter topic, giống DLQ ở bài System Design Concepts: nơi để các message xử lý mãi không được, chờ người xem); có thể chuyển sang nhà cung cấp dự phòng.",
            "- **Chống gửi trùng**: event có thể tới hai lần (at-least-once: queue chỉ đảm bảo giao ít nhất một lần). Bảng `notification` có unique `(event_id, user_id, channel)`; insert trùng thì bỏ qua.",
            "- **Không làm phiền**: giới hạn số thông báo mỗi user, gộp nhiều sự kiện nhỏ (50 lượt thích thành một thông báo).",
            "Nếu cho client gọi API gửi trực tiếp: `POST /notifications` nhận `Idempotency-Key` và trả `202 Accepted` (xem bài REST).",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Event qua queue → tách queue theo kênh và mức ưu tiên → retry có backoff rồi DLT → unique `(event_id, user_id, channel)` để giao lại không thành gửi trùng.",
            ],
          },
          quiz: {
            question: "Chiến dịch marketing đẩy 1 triệu email vào queue, OTP đăng nhập tới trễ 20 phút. Sửa thế nào?",
            options: [
              "Tăng retry",
              "Tách queue theo mức ưu tiên: OTP có queue và worker riêng, không xếp sau marketing",
              "Gửi OTP qua email marketing",
              "Giảm số email marketing",
            ],
            answer: 1,
            explain: "Một queue chung thì thứ tự là đến trước làm trước. Việc gấp phải có đường riêng.",
          },
        },
        {
          id: "seat-hold",
          title: "Giữ chỗ có hạn: vé xem phim, ghế máy bay",
          intro: [
            "Checkout (Phần 4) trừ kho bằng một câu `UPDATE` có điều kiện trên **số lượng**; bài LLD 2 (đặt vé xem phim) dùng cùng ý tưởng giữ chỗ có hạn ở mức code. Ghế ngồi thì mỗi ghế là một món riêng, và người dùng cần vài phút để thanh toán.",
            "Vấn đề: hai người cùng chọn ghế A5. Không giữ chỗ thì cả hai điền thông tin, trả tiền, và người thứ hai bị từ chối sau khi đã trả.",
            "Bảng `seat(show_id, seat_no, status, held_by, hold_until)`. Ba bước:",
            "- **Giữ chỗ**: một câu `UPDATE` có điều kiện \"đang trống, hoặc đang giữ nhưng đã quá hạn\". Cập nhật 1 dòng là giữ được, 0 dòng là người khác đang giữ.",
            "- **Bán**: sau khi thanh toán, `UPDATE` sang `SOLD` với điều kiện \"vẫn đúng người giữ và chưa quá hạn\". 0 dòng nghĩa là hold đã mất: hoàn tiền hoặc báo lỗi. Vì vậy hạn giữ nên dài hơn thời gian thanh toán tối đa, hoặc gia hạn khi bắt đầu thanh toán.",
            "- **Hết hạn**: điều kiện `hold_until < now()` đã coi ghế là trống, không cần chờ job dọn. Job định kỳ chỉ để dọn dữ liệu cho gọn.",
            "Nhiều ghế một lần: giữ tất cả trong một transaction, số dòng cập nhật ít hơn số ghế thì rollback; luôn cập nhật theo thứ tự ghế cố định để tránh deadlock.",
          ],
          predict: {
            question: "A giữ ghế A5 lúc 10:00, hạn 10 phút, rồi bỏ đi không trả tiền. 10:12 B bấm giữ A5. Job dọn hold hết hạn chạy 30 phút một lần và chưa chạy. B có giữ được không?",
            options: [
              "Không, phải chờ job dọn chạy",
              "Được: điều kiện `hold_until < now()` trong câu UPDATE đã coi ghế là trống",
              "Được, nhưng A cũng vẫn giữ",
              "Tuỳ may rủi",
            ],
            answer: 1,
            explain: "Hạn giữ nằm ngay trong điều kiện của câu giữ chỗ, nên hết hạn là tự trống, không phụ thuộc job.",
          },
          widgetTitle: "Hai người cùng giữ ghế A5",
          compare: [
            way(
              "Đọc rồi mới giữ",
              `SELECT status FROM seat WHERE show_id = :s AND seat_no = 'A5';
-- thấy AVAILABLE thì:
UPDATE seat SET status = 'HELD', held_by = :u WHERE show_id = :s AND seat_no = 'A5';`,
              [
                ask("A và B bấm cùng lúc", bad("Cả hai cùng đọc `AVAILABLE`, cùng UPDATE; người ghi sau đè người ghi trước, cả hai tưởng mình giữ được.")),
                ask("A bỏ đi không trả tiền", bad("Không có hạn: ghế bị khoá cho tới khi có người dọn tay.")),
              ],
              "Check-then-act, và không có hạn giữ.",
            ),
            way(
              "UPDATE có điều kiện kèm hạn",
              `UPDATE seat
SET status = 'HELD', held_by = :u, hold_until = now() + interval '10 minutes'
WHERE show_id = :s AND seat_no = 'A5'
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_until < now()));
-- bán: SET status = 'SOLD' WHERE ... AND held_by = :u AND hold_until > now()`,
              [
                ask("A và B bấm cùng lúc", ok("DB khoá dòng khi chạy câu lệnh: một người cập nhật 1 dòng, người kia 0 dòng và được báo ghế đã có người giữ.")),
                ask("A bỏ đi không trả tiền", ok("Sau 10 phút điều kiện `hold_until < now()` thoả, người khác giữ được ngay, không cần job.")),
              ],
              "Kiểm tra và giữ trong một câu, hạn giữ tự hết.",
            ),
          ],
          after: [
            "Dùng Redis `SET seat:{show}:A5 {user} NX EX 600` để giữ chỗ cũng được và rất nhanh. Nhưng Redis và DB không chung transaction: hold trong Redis hết hạn khi thanh toán còn đang chạy là có thể bán trùng. Nếu đặt Redis phía trước để chặn bớt tải, bước bán cuối cùng vẫn phải là câu `UPDATE` có điều kiện trên DB.",
          ],
          takeaway: {
            lines: [
              "Giữ chỗ bằng một câu `UPDATE` có điều kiện kèm `hold_until`; bán chỉ khi vẫn đúng người giữ và chưa quá hạn. DB là nơi quyết định cuối cùng.",
            ],
          },
          quiz: {
            question: "Vì sao câu bán vé kiểm tra cả `held_by = :u AND hold_until > now()`?",
            options: [
              "Cho chắc, không cần thiết",
              "Vì hold của người này có thể đã hết hạn và người khác đã giữ ghế; không kiểm tra thì bán một ghế cho hai người",
              "Để câu lệnh nhanh hơn",
              "Vì DB yêu cầu",
            ],
            answer: 1,
            explain: "Thanh toán có thể chậm hơn hạn giữ. Điều kiện này biến \"bán\" thành chỉ thành công khi hold vẫn còn là của mình.",
          },
        },
        {
          id: "file-upload",
          title: "Upload ảnh và file: presigned URL tới object storage",
          intro: [
            "Các đề trước chỉ có dữ liệu nhỏ. Ảnh đại diện, hoá đơn PDF, video thì để ở đâu và upload thế nào?",
            "Hai cách hay sai:",
            "- **Lưu file trong DB** (cột BLOB): mỗi dòng rất to, bộ nhớ đệm của DB bị lấp bởi file thay vì dữ liệu nóng, backup và replica phình theo.",
            "- **Upload đi qua app server**: mỗi file 500 MB chiếm một thread và băng thông của app suốt thời gian upload.",
            "Cách chuẩn: file nằm ở **object storage** (S3, MinIO, GCS); DB chỉ lưu metadata và key (`owner_id`, `object_key`, `size`, `content_type`, `status`). Luồng:",
            "- **Xin vé**: client gọi `POST /api/uploads` kèm tên, loại, kích thước. API kiểm tra quyền và giới hạn, tự đặt key (`users/7/avatar/<uuid>.jpg`), trả về một **presigned URL**: URL có chữ ký, chỉ cho `PUT` đúng key đó, hết hạn sau vài phút.",
            "- **Upload thẳng**: client `PUT` file lên object storage bằng URL đó. Byte không đi qua app.",
            "- **Xác nhận**: client gọi `POST /api/uploads/{id}/complete` (hoặc storage bắn event); API kiểm tra object có thật, kích thước đúng, rồi đánh dấu `READY`.",
            "- **Đọc**: file công khai đi qua CDN; file riêng tư thì cấp presigned GET URL ngắn hạn.",
          ],
          widgetTitle: "200 người cùng upload video 500 MB",
          compare: [
            way(
              "Upload qua app",
              `@PostMapping("/api/videos")
void upload(@RequestParam MultipartFile file) {
  s3.putObject(req, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
}`,
              [
                ask("200 người cùng upload 500 MB", bad("200 thread của app bị giữ suốt thời gian upload; 100 GB đi qua app rồi mới tới storage.")),
                ask("Đổi sang storage khác", ok("Chỉ sửa ở app, client không đổi.")),
              ],
              "Đơn giản, nhưng app thành ống dẫn byte.",
            ),
            way(
              "Presigned URL",
              `PresignedPutObjectRequest p = presigner.presignPutObject(r -> r
    .signatureDuration(Duration.ofMinutes(10))
    .putObjectRequest(o -> o.bucket("uploads").key(key).contentType("video/mp4")));
return new UploadTicket(uploadId, p.url().toString());   // client PUT thẳng lên S3`,
              [
                ask("200 người cùng upload 500 MB", ok("App chỉ trả 200 URL, mỗi request vài mili giây. Byte đi thẳng từ client lên storage.")),
                ask("Client gửi file khác loại hoặc đổi key", ok("Chữ ký gắn với đúng key và content type do server chọn, hết hạn sau 10 phút.")),
              ],
              "App chỉ cấp quyền, storage chở byte.",
            ),
          ],
          after: [
            "Key do server đặt, không lấy tên file của client, để không ghi đè file người khác. File lớn dùng **multipart upload**: chia phần, phần nào lỗi thì gửi lại phần đó; đặt lifecycle rule xoá các upload bỏ dở.",
            "Xử lý sau upload (tạo thumbnail, quét virus) chạy qua queue, worker idempotent, trạng thái đi từ `PENDING` tới `READY`. Dòng `PENDING` quá lâu không có `complete` thì job dọn cả dòng lẫn object.",
          ],
          takeaway: {
            lines: [
              "File ở object storage, metadata ở DB. App cấp presigned URL ngắn hạn cho đúng key, client upload thẳng, rồi báo hoàn tất để app kiểm tra và đánh dấu `READY`.",
            ],
          },
          quiz: {
            question: "Vì sao client nên upload thẳng lên object storage bằng presigned URL thay vì gửi qua API?",
            options: [
              "Vì API không nhận được file",
              "Để byte không đi qua app: app không bị giữ thread và băng thông; quyền vẫn do app kiểm soát qua chữ ký ngắn hạn cho đúng key",
              "Vì presigned URL không cần xác thực nên tiện hơn",
              "Vì object storage rẻ hơn DB",
            ],
            answer: 1,
            explain: "App vẫn quyết định ai được upload gì (cấp URL sau khi kiểm tra quyền), chỉ không phải tự chở byte.",
          },
        },
        {
          id: "search",
          title: "Tìm kiếm: full-text search thay cho LIKE '%x%'",
          intro: [
            "Bài index cho thấy B+Tree tìm theo giá trị hoặc **tiền tố**. Ô tìm kiếm sản phẩm thì người dùng gõ một từ nằm giữa tên.",
            "`WHERE name LIKE '%loa bluetooth%'` có hai vấn đề:",
            "- **Chậm**: `%` ở đầu nên B+Tree không dùng được, DB phải đọc mọi dòng.",
            "- **Kết quả kém**: gõ \"bluetooth loa\" (đảo thứ tự) không ra, gõ sai chính tả không ra, và không có xếp hạng: sản phẩm khớp tốt nhất không chắc nằm trên cùng.",
            "**Full-text search** dùng **inverted index**: tách văn bản thành các từ (token), chuẩn hoá (chữ thường, có thể bỏ dấu), rồi lưu `từ → danh sách id tài liệu chứa từ đó`. Tìm \"loa bluetooth\" là lấy danh sách của hai từ rồi giao lại, sau đó xếp hạng theo độ liên quan.",
            "Dùng gì:",
            "- **PostgreSQL** đủ cho quy mô vừa: cột `tsvector` (văn bản đã tách thành từ) với index GIN (kiểu index cho tìm theo từ); extension `pg_trgm` với index GIN còn giúp chính `LIKE '%x%'` dùng được index.",
            "- **Elasticsearch / OpenSearch** khi cần nhiều hơn: gõ sai vẫn ra (fuzzy), lọc theo nhiều thuộc tính kèm đếm số kết quả từng nhóm, và tách tải tìm kiếm khỏi DB chính.",
          ],
          widgetTitle: "Tìm sản phẩm theo tên",
          compare: [
            way(
              "LIKE '%x%'",
              `SELECT id, name FROM product
WHERE name LIKE '%loa bluetooth%'
LIMIT 20;`,
              [
                ask("Bảng 1 triệu sản phẩm", bad("`%` ở đầu nên không dùng được B+Tree: đọc mọi dòng.")),
                ask("Gõ \"bluetooth loa\"", bad("Không khớp chuỗi `loa bluetooth`, nên không ra kết quả.")),
              ],
              "Chỉ là so khớp chuỗi con, không phải tìm kiếm.",
            ),
            way(
              "Full-text trên PostgreSQL",
              `ALTER TABLE product ADD COLUMN search tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', name || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX product_search_idx ON product USING GIN (search);

SELECT id, name, ts_rank(search, q) AS rank
FROM product, plainto_tsquery('simple', 'bluetooth loa') q
WHERE search @@ q
ORDER BY rank DESC LIMIT 20;`,
              [
                ask("Bảng 1 triệu sản phẩm", ok("Tra index GIN theo từng từ, không đọc mọi dòng.")),
                ask("Gõ \"bluetooth loa\"", ok("Mỗi từ là một token; tài liệu có đủ các từ là khớp, thứ tự không quan trọng, có xếp hạng.")),
                ask("Gõ sai \"blutooth\"", bad("`tsvector` không sửa lỗi gõ. Cần `pg_trgm` (so độ giống) hoặc fuzzy của Elasticsearch.")),
              ],
              "Tìm theo từ, có index và xếp hạng.",
            ),
          ],
          after: [
            "Dùng Elasticsearch thì DB vẫn là nguồn chính, search index là bản sao **trễ vài giây**. Đừng ghi cả hai trong cùng request (một bên lỗi là hai bên lệch nhau); đi qua outbox hoặc CDC (đọc log thay đổi của DB và phát thành event) lên Kafka, một indexer đọc và cập nhật index. Giữ sẵn job reindex toàn bộ cho lúc đổi cấu trúc index.",
          ],
          takeaway: {
            lines: [
              "`LIKE '%x%'` đọc mọi dòng và không xếp hạng. Full-text dùng inverted index: Postgres `tsvector` + GIN cho quy mô vừa, Elasticsearch khi cần fuzzy, lọc nhiều thuộc tính và tải lớn.",
            ],
          },
          quiz: {
            question: "Vì sao `WHERE name LIKE '%bluetooth%'` không dùng được index B+Tree thông thường trên `name`?",
            options: [
              "Vì LIKE không bao giờ dùng index",
              "Vì `%` ở đầu: B+Tree sắp theo tiền tố, không biết chuỗi bắt đầu bằng gì nên không biết đi nhánh nào",
              "Vì cột `name` quá dài",
              "Vì cần thêm `ORDER BY`",
            ],
            answer: 1,
            explain: "`LIKE 'blue%'` thì dùng được B+Tree vì biết tiền tố (PostgreSQL cần collation `C` hoặc index `text_pattern_ops`). Có `%` ở đầu thì cần inverted index hoặc `pg_trgm`.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Em đi theo bảy bước: hỏi lại yêu cầu, ước lượng, API, data model, sơ đồ tổng thể, deep dive và trade-off. Với URL shortener, giả định 1 triệu link mỗi ngày đọc gấp 100 thì ghi chỉ khoảng 12 mỗi giây, đọc khoảng 1.200, 5 năm khoảng 1 TB, nên một PostgreSQL là đủ và trọng tâm là cache Redis cho redirect; mã sinh bằng sequence cộng Base62, 6 ký tự đã dư; dùng 302 nếu cần thống kê click. Với checkout, thông lượng không lớn, khó là tính đúng đắn: em chống oversell bằng câu UPDATE có điều kiện stock lớn hơn hoặc bằng số lượng, chống đơn trùng bằng Idempotency-Key có unique constraint, không gọi payment trong transaction, và xử lý webhook trùng bằng provider_txn_id unique cùng chuyển trạng thái có điều kiện. Sự kiện sau thanh toán đi qua outbox.",
};
