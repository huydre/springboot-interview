import timeline from "../timelines/weekly-quiz.json";
import type { Lesson, Scene } from "../types";

// Weekly review from study note 07; the cards are generated into ../weekly-quiz-cards.ts.
export const weeklyQuiz: Lesson = {
  slug: "weekly-quiz",
  crumb: "Bộ câu hỏi ôn tập hằng tuần",
  videoDir: "/videos/weekly-quiz",
  videoVersion: "ff312267",
  scenes: timeline as Scene[],
  title: "Bộ câu hỏi ôn tập hằng tuần",
  subtitle:
    "93 câu theo 7 tuần, tập trung vào con số, bẫy và các trường hợp \"sẽ xảy ra gì nếu\"; cuối cùng là bài tổng hợp 20 câu bấm giờ 20 phút.",
  openingQuiz: {
    question: "Vì sao phải tự trả lời trước rồi mới lật đáp án?",
    options: ["Để nhanh hơn", "Đọc đáp án trước chỉ luyện khả năng nhận ra, không luyện khả năng nhớ lại", "Vì đáp án dài", "Không quan trọng"],
    answer: 1,
    explain: "Phỏng vấn đòi nhớ lại, không có lựa chọn để nhận ra.",
  },
  roadmap: [
    "Chặng 1: cách ôn và spaced repetition.",
    "Chặng 2: thẻ ôn tuần 1–7.",
    "Chặng 3: bài tổng hợp tuần 8.",
  ],
  sections: [
    {
      id: "method",
      title: "Phần 1: Cách ôn",
      scene: "method",
      intro: [
        "Làm vào Chủ nhật, khoảng 15 phút:",
        "- **Tự trả lời trước**: bằng lời hoặc viết ra giấy, rồi mới lật đáp án để đối chiếu.",
        "- **Sai hoặc ấp úng**: đánh dấu và làm lại ở tuần sau.",
        "- **Đã đúng lại**: giãn ra, hai tuần sau mới ôn tiếp.",
        "Đó là spaced repetition (ôn giãn cách): khoảng cách ôn tăng dần khi bạn nhớ chắc hơn, nên thời gian dồn vào đúng chỗ hổng thay vì ôn lại thứ đã nhớ.",
        "Quiz tập trung vào con số, bẫy và các tình huống \"sẽ xảy ra gì nếu\". Phần giải thích cơ chế thì luyện bằng Feynman với bài Sơ đồ cơ chế cốt lõi. Dấu đánh sai của bạn được lưu trong trình duyệt nên tuần sau mở lại vẫn thấy.",
      ],
      quiz: {
        question: "Integer a = 127, b = 127; Integer c = 128, d = 128. a == b và c == d cho kết quả gì?",
        options: ["true, true", "true, false", "false, false", "false, true"],
        answer: 1,
        explain: "Integer cache giữ -128 tới 127. So sánh wrapper bằng equals().",
      },
    },
    {
      id: "cards",
      title: "Phần 2: Thẻ ôn tuần 1–7",
      scene: "cards",
      intro: [
        "Biết cách ôn rồi, giờ là bộ thẻ. Mỗi tuần một nhóm chủ đề:",
        "- **Tuần 1**: OOP và Collections.",
        "- **Tuần 2**: Stream, Optional, Java 21, JVM.",
        "- **Tuần 3**: Concurrency.",
        "- **Tuần 4**: Spring Core, Boot, MVC.",
        "- **Tuần 5**: @Transactional.",
        "- **Tuần 6**: JPA và SQL.",
        "- **Tuần 7**: REST, Security, Redis, Kafka, Testing.",
        "Mỗi thẻ: đọc câu hỏi, nói to câu trả lời, lật đáp án, tự chấm thật lòng. Nút tuần hiện số câu bạn đã đánh dấu sai.",
        "Ba thẻ được nhắc trong video là ví dụ lấy từ các tuần khác nhau, không phải ba thẻ đầu của bộ: thẻ HashSet thiếu `hashCode` ở tuần 1, thẻ `newFixedThreadPool` ở tuần 3, thẻ cache stampede ở tuần 7.",
      ],
      widget: "recall-cards",
      widgetTitle: "Nhớ lại rồi mới lật",
      quiz: {
        question: "HashMap mặc định resize khi thêm phần tử thứ mấy?",
        options: ["12", "13", "16", "17"],
        answer: 1,
        explain: "16 × 0.75 = 12, resize khi size vượt 12, tức lúc thêm phần tử thứ 13.",
      },
    },
    {
      id: "final",
      title: "Phần 3: Bài tổng hợp tuần 8",
      scene: "final",
      intro: [
        "20 câu trộn từ 7 tuần, bấm giờ 20 phút, mỗi câu trả lời trong 1–2 câu nói. Số tuần trong ngoặc cho biết đáp án nằm ở đâu.",
        "Chấm điểm:",
        "- **Từ 17/20**: sẵn sàng.",
        "- **14–16**: ôn lại các tuần có câu sai.",
        "- **Dưới 14**: làm lại quiz những tuần đó và luyện Feynman thêm cho các chủ đề tương ứng.",
      ],
      widget: "final-mock",
      widgetTitle: "20 câu, 20 phút",
      quiz: {
        question: "Pool core 2, max 4, queue 10, submit 20 task cùng lúc (task chạy lâu). Bao nhiêu task bị reject?",
        options: ["0", "4", "6", "10"],
        answer: 2,
        explain: "Task 1–2 tạo thread core, 3–12 vào queue, 13–14 tạo thread non-core, 15–20 bị reject bằng AbortPolicy: 6 task.",
      },
    },
  ],
  modelAnswer:
    "Em ôn theo vòng tuần: mỗi Chủ nhật tự trả lời bộ câu hỏi của tuần đó trước khi xem đáp án, đánh dấu câu sai và làm lại ở tuần sau. Câu hỏi tập trung vào con số và bẫy, ví dụ HashMap resize ở phần tử thứ 13, checked exception trong @Transactional vẫn commit, IDENTITY làm mất batch insert. Phần cơ chế em luyện bằng cách tự vẽ lại sơ đồ và giải thích to. Cuối lộ trình em làm bài tổng hợp 20 câu bấm giờ, đạt từ 17 câu trở lên mới coi là sẵn sàng.",
};
