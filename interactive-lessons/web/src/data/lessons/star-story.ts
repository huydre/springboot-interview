import timeline from "../timelines/star-story.json";
import type { Lesson, Scene } from "../types";

// From study note 10.03, plus the fill-in profile of note 09 (the STAR builder below). The note deliberately invents no
// company examples or numbers; neither does this page. Video not rendered yet: scenes stay empty until publish.
export const starStory: Lesson = {
  slug: "star-story",
  crumb: "Project Story & STAR",
  videoDir: "/videos/star-story",
  videoVersion: "75f86afe",
  scenes: timeline as Scene[],
  title: "Project Story & STAR",
  subtitle:
    "Giới thiệu dự án trong 1–2 phút, phương pháp STAR, tám chủ đề behavioral, biến lab order-service thành câu chuyện, câu hỏi ngược cho interviewer, và checklist tuần cuối.",
  openingQuiz: {
    question: "Trong STAR, phần nào nên dài nhất?",
    options: ["Situation", "Task", "Action: em đã làm gì và vì sao", "Result"],
    answer: 2,
    explain: "Bối cảnh ngắn; interviewer đánh giá cách bạn hành động và lựa chọn.",
  },
  roadmap: [
    "Chặng 1: giới thiệu dự án và STAR.",
    "Chặng 2: tám chủ đề behavioral và câu chuyện từ lab.",
    "Chặng 3: câu hỏi ngược và checklist.",
  ],
  sections: [
    {
      id: "intro",
      title: "Phần 1: Giới thiệu dự án trong 1–2 phút",
      scene: "intro",
      intro: [
        "Interviewer muốn biết: dự án khó cỡ nào, em đóng vai trò gì, em hiểu sâu tới đâu. Năm phần theo thứ tự: **bối cảnh** (domain, người dùng), **quy mô** (chỉ số chắc chắn biết), **kiến trúc và stack**, **vai trò** (nói \"em\"), **điểm nhấn** (một vấn đề khó, chỉ nêu tên rồi chờ họ hỏi).",
        "Phần giới thiệu là mồi câu: đặt vào đó điểm mình nắm chắc. Bẫy: kể lan man mọi tính năng, \"team em làm\" từ đầu tới cuối, bịa số liệu (họ sẽ hỏi \"đo bằng cách nào\"), lộ thông tin mật, nhắc Kafka mà không trả lời được partition và consumer group.",
      ],
      quiz: {
        question: "Không nhớ chính xác quy mô hệ thống thì nói thế nào?",
        options: ["Bịa một con số đẹp", "Nói khoảng và nói nguồn; không biết thì nói không biết", "Bỏ qua phần quy mô", "Nói số của công ty lớn"],
        answer: 1,
        explain: "Ví dụ: \"theo dashboard Grafana lúc đó khoảng ...\".",
      },
    },
    {
      id: "star",
      title: "Phần 2: Phương pháp STAR",
      scene: "star",
      intro: [
        "**S**ituation ít, **T**ask ít, **A**ction nhiều nhất (em làm gì, theo thứ tự, vì sao chọn cách đó), **R**esult vừa (đo được), thêm **L**earning. Ví dụ yếu: \"API chậm, em phát hiện N+1 nên dùng JOIN FETCH, sau đó nhanh hơn nhiều\": không bối cảnh, không cách phát hiện, không phương án khác, kết quả không đo được, không bài học.",
        "Ví dụ mạnh: bật log SQL đếm 1 + N câu, thử JOIN FETCH, `@EntityGraph`, batch size, chọn một cách vì lý do cụ thể, viết test đếm câu SQL để lỗi không quay lại, kết quả bằng số bạn thật sự đo. Chỉ thuộc khung và ý chính. Không có chuyện hợp câu hỏi thì nói thật và chuyển sang chuyện gần nhất.",
      ],
      widget: "star-critique",
      widgetTitle: "Câu trả lời này yếu ở đâu",
      quiz: {
        question: "Interviewer hỏi \"vì sao em không chọn cách khác?\". Chuẩn bị bằng cách nào?",
        options: ["Học thuộc câu trả lời", "Phần Action luôn có các phương án đã cân nhắc và trade-off cụ thể", "Nói đó là quyết định của leader", "Đổi chủ đề"],
        answer: 1,
        explain: "Và thừa nhận nếu bây giờ nhìn lại có cách tốt hơn.",
      },
    },
    {
      id: "behavioral",
      title: "Phần 3: Tám chủ đề behavioral",
      scene: "behavioral",
      intro: [
        "Bất đồng kỹ thuật (tranh luận bằng dữ liệu, chấp nhận quyết định chung), deadline gấp (ưu tiên, báo sớm, không âm thầm cắt test), mắc lỗi (nhận trách nhiệm, nguyên nhân gốc, đổi quy trình), học nhanh (tài liệu chính thức, PoC nhỏ), chủ động cải thiện (đo được giá trị, vẫn xin ý kiến), giúp người khác (giải thích thay vì làm hộ), feedback tiêu cực (không phòng thủ, thay đổi thật), đánh đổi chất lượng và tốc độ (nợ kỹ thuật có ý thức, không đánh đổi ở tiền, bảo mật, dữ liệu).",
        "Mỗi chủ đề viết một câu chuyện STAR. Điền dần vào bộ dựng bên dưới, đúng như hồ sơ dự án và STAR trong note 09: chỉ dùng trải nghiệm và số liệu thật của bạn.",
      ],
      widget: "star-builder",
      widgetTitle: "Dựng câu chuyện STAR của bạn",
      quiz: {
        question: "\"Kể về một sai lầm của em\". Chọn chuyện nào?",
        options: ["\"Em quá cầu toàn\"", "Một lỗi thật, cách em xử lý, nguyên nhân gốc và thay đổi quy trình sau đó", "Lỗi của đồng nghiệp", "Nói chưa từng sai"],
        answer: 1,
        explain: "Tránh lỗi vô hại và tránh đổ lỗi.",
      },
    },
    {
      id: "labs",
      title: "Phần 4: Biến lab order-service thành câu chuyện",
      scene: "labs",
      intro: [
        "Lab là trải nghiệm thật: bạn đã tự tái hiện, đo và sửa. Câu mở: \"Ở công ty em chưa gặp đúng vấn đề này ở quy mô lớn, nên em dựng một project cá nhân để tái hiện và đo\". N+1 cho chủ đề hiệu năng; `@Version` cho concurrency; index + `EXPLAIN` cho tối ưu query; `@Cacheable` cho trade-off; JWT cho học nhanh; lỗi `@Transactional` cho mắc lỗi; Testcontainers cho chủ động cải thiện.",
        "Lấy dòng Dự án trong nhật ký học tập, viết lại theo STAR, chỉ dùng số đã đo, nói to bấm giờ khoảng 2 phút, chuẩn bị 2–3 câu hỏi xoáy cho mỗi chuyện. Đừng trình bày lab như production có hàng triệu user.",
      ],
      quiz: {
        question: "Kể chuyện N+1 từ lab mà chưa ghi lại số liệu. Nên làm gì?",
        options: ["Đoán số", "Chạy lại lab và ghi số trước buổi phỏng vấn", "Nói \"nhanh hơn nhiều\"", "Không kể"],
        answer: 1,
        explain: "Nhấn vào chỗ em tự quan sát, so sánh, kết luận.",
      },
    },
    {
      id: "reverse",
      title: "Phần 5: Câu hỏi ngược và checklist",
      scene: "reverse",
      intro: [
        "Chuẩn bị 5–6 câu, chọn 2–3: một ngày làm việc điển hình, kỳ vọng 3 tháng đầu, thách thức kỹ thuật lớn nhất, cách review, test, deploy, cách xử lý sự cố production, lộ trình phát triển, quy mô team. Tránh hỏi điều có sẵn trên website, hỏi lương và ngày nghỉ ở vòng kỹ thuật, hay nói \"em không có câu hỏi\".",
        "Tuần cuối: giới thiệu bản thân 1 phút và dự án 2 phút, ghi âm nghe lại; 8 câu chuyện có số thật; đọc JD; luyện một đề system design. Trong lúc trả lời: không hiểu thì hỏi lại, không biết thì suy luận thành tiếng, ý chính trước, chi tiết sau, ví dụ dự án cuối. Sau buổi: ghi ngay câu trả lời chưa tốt.",
      ],
      widget: "say-or-not",
      widgetTitle: "Nên nói hay không",
      quiz: {
        question: "\"Vì sao em muốn chuyển việc?\" Hướng trả lời tốt?",
        options: ["Kể điều chán ghét ở công ty cũ", "Hướng về điều muốn có: quy mô, domain, chiều sâu kỹ thuật", "Nói vì lương", "Không trả lời"],
        answer: 1,
        explain: "Không nói xấu công ty cũ.",
      },
    },
  ],
  modelAnswer:
    "Em chuẩn bị khoảng 8 câu chuyện theo STAR từ dự án thật và project cá nhân order-service. Mỗi câu chuyện em chỉ ghi ý chính: bối cảnh một câu, việc của em, các bước em làm cùng các phương án đã cân nhắc và lý do chọn, kết quả có số liệu đã đo và bài học. Phần giới thiệu dự án em giữ trong khoảng hai phút, nói rõ phần em phụ trách và đặt một điểm kỹ thuật em nắm chắc để interviewer hỏi tiếp. Một câu chuyện có thể dùng cho nhiều câu hỏi, ví dụ chuyện tối ưu N+1 dùng cho câu về hiệu năng, vấn đề khó nhất và chủ động cải thiện. Cuối buổi em luôn có hai, ba câu hỏi ngược về thách thức kỹ thuật và cách team làm việc.",
};
