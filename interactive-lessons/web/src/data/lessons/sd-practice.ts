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
        explain: "Ước lượng phải dẫn tới quyết định.",
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
        explain: "Đừng quên tính peak.",
      },
    },
    {
      id: "shortener",
      title: "Phần 3: URL shortener",
      scene: "shortener",
      intro: [
        "API: `POST /api/urls` trả `201` với `code`; `GET /{code}` trả `302` kèm `Location`. Bảng `short_url` có unique index trên `code`, không join. Redirect: tra Redis, hit thì 302 ngay, miss thì tra DB, nạp Redis kèm TTL. Sinh mã: **sequence + Base62** (không trùng nhưng đoán được), hash rồi cắt (có thể trùng), random (khó đoán, retry khi trùng). Đã chạy: `encode(125) = 21`, `encode(1_000_000_000) = 15FTGg`, `encode(62^6 - 1) = ZZZZZZ`.",
        "301 cho browser cache redirect, đỡ tải nhưng không đếm click; **302** mỗi click qua server, có thống kê và vô hiệu hoá được link. Đếm click bằng event Kafka hoặc `INCR` Redis rồi ghi theo lô, không `UPDATE count + 1` trên dòng nóng. Redis chết thì DB vẫn là nguồn chính, chỉ chậm hơn: timeout ngắn khi gọi Redis.",
      ],
      widget: "base62",
      widgetTitle: "Base62 encode và decode",
      quiz: {
        question: "Cần thống kê click và vô hiệu hoá link độc hại. Chọn mã redirect nào?",
        options: ["301", "302", "200", "404"],
        answer: 1,
        explain: "301 bị browser cache nên server không thấy các lần click sau.",
      },
    },
    {
      id: "checkout",
      title: "Phần 4: Order và checkout service",
      scene: "checkout",
      intro: [
        "Yêu cầu phi chức năng: không oversell, không trừ tiền hai lần, không tạo đơn trùng, chịu flash sale. Ước lượng: 50.000 đơn/ngày chỉ khoảng 0,6 đơn/giây, nhưng flash sale 20.000 người tranh 500 sản phẩm trong 60 giây là khoảng 333 request/giây **vào cùng một dòng product**. Vấn đề là hot row và tính đúng đắn, không phải thông lượng.",
        "Chống oversell: `UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty` (0 dòng là hết hàng), trừ theo `productId` tăng dần, `CHECK (stock >= 0)`. Idempotency: header `Idempotency-Key`, unique constraint, bên thua bắt `DataIntegrityViolationException` ngoài `@Transactional` rồi đọc lại. Không gọi payment trong transaction; webhook: xác minh chữ ký, `provider_txn_id` unique, chuyển trạng thái có điều kiện. Đơn PAID ghi outbox, relay lên Kafka.",
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
        explain: "Trừ lúc thanh toán thì nhiều người có thể cùng trả tiền cho món cuối, phải hoàn tiền.",
      },
    },
  ],
  modelAnswer:
    "Em đi theo bảy bước: hỏi lại yêu cầu, ước lượng, API, data model, sơ đồ tổng thể, deep dive và trade-off. Với URL shortener, giả định 1 triệu link mỗi ngày đọc gấp 100 thì ghi chỉ khoảng 12 mỗi giây, đọc khoảng 1.200, 5 năm khoảng 1 TB, nên một PostgreSQL là đủ và trọng tâm là cache Redis cho redirect; mã sinh bằng sequence cộng Base62, 6 ký tự đã dư; dùng 302 nếu cần thống kê click. Với checkout, thông lượng không lớn, khó là tính đúng đắn: em chống oversell bằng câu UPDATE có điều kiện stock lớn hơn hoặc bằng số lượng, chống đơn trùng bằng Idempotency-Key có unique constraint, không gọi payment trong transaction, và xử lý webhook trùng bằng provider_txn_id unique cùng chuyển trạng thái có điều kiện. Sự kiện sau thanh toán đi qua outbox.",
};
