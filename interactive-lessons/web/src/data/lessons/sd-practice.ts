import timeline from "../timelines/sd-practice.json";
import type { Lesson, Scene } from "../types";

// From study note 10.02. Load and size figures are assumptions for mental arithmetic; Base62 outputs ran on JDK 21.
export const sdPractice: Lesson = {
  slug: "sd-practice",
  crumb: "System Design Practice",
  videoDir: "/videos/sd-practice",
  videoVersion: "d4a4a4b8",
  scenes: timeline as Scene[],
  title: "System Design Practice",
  subtitle:
    "Khung trả lời 7 bước, ước lượng nhanh, và hai thiết kế mẫu: URL shortener, dịch vụ đặt hàng và thanh toán, với deep dive về sinh mã, oversell, idempotency và webhook.",
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
  ],
  sections: [
    {
      id: "framework",
      title: "Phần 1: Khung trả lời 7 bước",
      scene: "framework",
      intro: [
        "**Yêu cầu** (chức năng và phi chức năng) → **ước lượng** (request/giây, dung lượng, tỉ lệ đọc ghi) → **API** → **data model** → **high-level design** → **deep dive** 1–2 chỗ khó nhất → **trade-off** và hướng mở rộng. Câu mẫu: \"Em xin hỏi lại phạm vi: có cần custom alias không, link có hết hạn không?\"",
        "Bẫy: vẽ ngay không hỏi, im lặng suy nghĩ quá lâu (hãy nghĩ thành tiếng), nhồi buzzword không giải thích, không tự nói điểm yếu. Interviewer bảo tự giả định thì nói rõ giả định và lý do, ghi lên bảng.",
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
        "Một ngày 86.400 giây, nhẩm là 10^5: 1 triệu việc mỗi ngày là khoảng 10 việc mỗi giây (chính xác 11,6). Quy trình: số người dùng → thao tác mỗi ngày → mỗi giây → peak → dung lượng = số bản ghi × kích thước × số ngày lưu.",
        "URL shortener với giả định 1 triệu link/ngày, đọc gấp 100: khoảng 12 ghi và 1.200 đọc mỗi giây, peak ×5 là 60 và 6.000; 5 năm 1,825 tỉ link × 500 byte khoảng 1 TB; 10 triệu link nóng khoảng 5 GB vừa một Redis. 62^6 khoảng 56,8 tỉ đã dư 30 lần. Kết luận: ghi nhỏ, một PostgreSQL đủ, đọc mới là chỗ cần cache.",
      ],
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
        "API: `POST /api/urls` nhận link dài, trả `201` kèm `code`; `GET /{code}` trả `302` kèm header `Location` là link dài. Bảng `short_url` có unique index trên `code`, không cần join.",
        "Redirect là đường nóng (đọc gấp 100 lần ghi), nên đi qua cache: tra Redis, hit thì 302 ngay; miss thì tra DB rồi nạp vào Redis kèm TTL. Redis chết thì DB vẫn là nguồn chính, chỉ chậm hơn; vì vậy đặt timeout ngắn khi gọi Redis để nó không kéo cả redirect chậm theo.",
        "301 hay 302? 301 nghĩa là \"chuyển hẳn\": browser cache lại, lần sau tự đi thẳng tới link dài mà không hỏi server. Đỡ tải, nhưng server không đếm được click và không chặn được link về sau. **302** thì mỗi click đều qua server, nên có thống kê và vô hiệu hoá được link độc hại.",
        "Đếm click bằng event Kafka hoặc `INCR` Redis rồi ghi xuống DB theo lô. Không `UPDATE count = count + 1` trực tiếp: link nổi tiếng là một dòng nóng, mọi click xếp hàng chờ lock của cùng một dòng.",
      ],
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
            "Ba cách sinh mã. **Sequence + Base62**: lấy số tăng dần do DB cấp cho mỗi dòng mới (sequence, như `id` tự tăng) rồi đổi sang Base62. Không bao giờ trùng, nhưng **đoán được**: id 1000 ra `g8` thì id kế tiếp ra `g9`, người ngoài dò lần lượt là xem được link của người khác. **Hash rồi cắt** lấy vài ký tự đầu của hash link dài: có thể trùng, phải kiểm tra. **Random**: khó đoán, gặp trùng thì sinh lại (nhờ unique index trên `code`).",
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
        "Yêu cầu phi chức năng: không oversell (bán quá số hàng có), không trừ tiền hai lần, không tạo đơn trùng, chịu được flash sale. Ước lượng: 50.000 đơn/ngày chỉ khoảng 0,6 đơn/giây, nhưng flash sale 20.000 người tranh 500 sản phẩm trong 60 giây là khoảng 333 request/giây **vào cùng một dòng product**. Vấn đề là dòng nóng và tính đúng đắn, không phải thông lượng.",
        "Oversell xảy ra thế nào: tồn kho còn 1. Hai request cùng đọc `stock = 1`, cùng thấy đủ hàng, cùng trừ và cùng lưu. Kết quả: bán hai cái trong khi chỉ có một ({{check-then-act|check-then-act}}: kiểm tra và hành động tách rời, nên request kia chen vào giữa).",
        "Cách mặc định là gộp kiểm tra và trừ vào **một câu lệnh**: `UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty`. DB khoá dòng trong lúc chạy câu này, nên request thứ hai chờ, rồi thấy `stock = 0` không thoả điều kiện: câu lệnh cập nhật 0 dòng, tức hết hàng, báo lỗi cho user.",
        "Đơn có nhiều sản phẩm thì luôn trừ theo `productId` tăng dần. Lý do: đơn A trừ sản phẩm 1 rồi 2, đơn B trừ 2 rồi 1; A giữ khoá dòng 1 chờ dòng 2, B giữ khoá dòng 2 chờ dòng 1, hai bên chờ nhau mãi (deadlock). Cùng một thứ tự thì không thể chờ vòng. Thêm `CHECK (stock >= 0)` làm lưới an toàn cuối cùng nếu code lỡ sai.",
        "Trừ kho lúc nào? Đa số chọn **giữ chỗ có hạn lúc đặt đơn**: đặt đơn là trừ kho ngay, đơn ở trạng thái `PENDING_PAYMENT` kèm `expires_at` (ví dụ 15 phút). Quá hạn mà chưa trả tiền thì một job định kỳ huỷ đơn và cộng lại kho, cũng bằng `UPDATE` có điều kiện trạng thái để không đụng đơn vừa kịp trả tiền.",
      ],
      widget: "checkout-guard",
      widgetTitle: "Chặn ở đâu",
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
          id: "checkout-idempotency",
          title: "Không tạo đơn trùng: Idempotency-Key",
          intro: [
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
            "Kết quả thanh toán về qua {{webhook|webhook}}, và webhook có thể tới nhiều lần. Ba lớp chặn: xác minh chữ ký (đúng là provider gửi), `provider_txn_id` unique (cùng một giao dịch chỉ ghi một lần), và chuyển trạng thái có điều kiện `UPDATE orders SET status = 'PAID' WHERE id = :orderId AND status = 'PENDING_PAYMENT'`. Webhook thứ hai cập nhật 0 dòng nên không làm gì.",
            "Đơn sang PAID thì ghi event vào outbox trong cùng transaction, relay đẩy lên Kafka để gửi email. Như vậy không có cảnh đơn đã PAID mà mất event.",
          ],
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
  ],
  modelAnswer:
    "Em đi theo bảy bước: hỏi lại yêu cầu, ước lượng, API, data model, sơ đồ tổng thể, deep dive và trade-off. Với URL shortener, giả định 1 triệu link mỗi ngày đọc gấp 100 thì ghi chỉ khoảng 12 mỗi giây, đọc khoảng 1.200, 5 năm khoảng 1 TB, nên một PostgreSQL là đủ và trọng tâm là cache Redis cho redirect; mã sinh bằng sequence cộng Base62, 6 ký tự đã dư; dùng 302 nếu cần thống kê click. Với checkout, thông lượng không lớn, khó là tính đúng đắn: em chống oversell bằng câu UPDATE có điều kiện stock lớn hơn hoặc bằng số lượng, chống đơn trùng bằng Idempotency-Key có unique constraint, không gọi payment trong transaction, và xử lý webhook trùng bằng provider_txn_id unique cùng chuyển trạng thái có điều kiện. Sự kiện sau thanh toán đi qua outbox.",
};
