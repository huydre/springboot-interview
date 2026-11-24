import timeline from "../timelines/behavioral.json";
import type { Lesson, Scene } from "../types";

// Soft-skills lesson that continues "Project Story & STAR" (star-story.ts): that lesson teaches the STAR shape and the eight
// common topics; this one covers how the round is scored, conflict, failure, ownership, sensitive questions and English
// phrases. No company names, figures or outcomes are claimed as real; the sample answers are templates to fill with your own
// facts. Labour-law notes refer to Vietnam's Labour Code 2019 (notice periods in article 35).
export const behavioral: Lesson = {
  slug: "behavioral",
  crumb: "Behavioral nâng cao",
  videoDir: "/videos/behavioral",
  videoVersion: "dd2fdf15",
  scenes: timeline as Scene[],
  title: "Behavioral nâng cao: xung đột, thất bại, ownership và câu hỏi khó",
  subtitle:
    "Interviewer thật sự chấm gì, câu trả lời 2 phút, ngân hàng 6 đến 8 câu chuyện, xử lý xung đột và disagree and commit, kể thất bại thật, ownership đo bằng số, câu hỏi nhạy cảm (nghỉ việc, gap, điểm yếu, lương, offer khác), câu hỏi ngược theo vòng và mẫu câu tiếng Anh.",
  openingQuiz: {
    question: "Interviewer hỏi \"Kể về một lần em bất đồng với leader\". Họ đang chấm điều gì là chính?",
    options: [
      "Ai đúng ai sai trong chuyện đó",
      "Cách em đưa ra quan điểm bằng dữ liệu, lắng nghe, và hành xử sau khi quyết định đã chốt",
      "Em có dám cãi sếp không",
      "Em có nhớ chi tiết kỹ thuật không",
    ],
    answer: 1,
    explain:
      "Câu hỏi về xung đột đo cách em hợp tác khi không đồng ý: nói bằng dữ liệu, tôn trọng người kia, và khi team đã chốt thì làm hết sức (disagree and commit). Ai thắng không quan trọng (Phần 2).",
  },
  roadmap: [
    "Chặng 1: interviewer chấm gì, câu trả lời 2 phút, ngân hàng câu chuyện tái dùng.",
    "Chặng 2: ba loại câu khó nhất: xung đột, thất bại, ownership và impact đo bằng số.",
    "Chặng 3: câu hỏi nhạy cảm (nghỉ việc, gap, điểm yếu, lương, offer), câu hỏi ngược theo vòng và mẫu câu tiếng Anh.",
  ],
  sections: [
    {
      id: "what-graded",
      scene: "what-graded",
      title: "Phần 1: Interviewer thật sự chấm gì",
      intro: [
        "Bài Project Story & STAR đã cho ta khung kể chuyện. Nhưng kể đúng khung vẫn có thể trượt, vì interviewer không chấm \"kể có hay không\" mà chấm **những tín hiệu** lộ ra trong câu chuyện.",
        "Ở công ty nước ngoài và các công ty product lớn, interviewer thường có một phiếu chấm với vài tiêu chí cố định, mỗi câu hỏi nhắm vào một hai tiêu chí. Công ty outsource hay công ty Việt nhỏ ít khi có phiếu chính thức, nhưng người phỏng vấn vẫn để ý đúng những điều đó. Năm tiêu chí gặp nhiều nhất:",
        "- **Ownership**: em có coi vấn đề là việc của mình không, hay dừng ở \"không phải task của em\".",
        "- **Collaboration**: làm việc với người khác thế nào, nhất là khi bất đồng.",
        "- **Learning**: sau sai lầm hay việc mới, em học và thay đổi được gì.",
        "- **Impact**: việc em làm tạo ra khác biệt gì, đo được không.",
        "- **Communication**: kể có mạch lạc, ý chính trước, biết dừng đúng lúc không.",
        "Một tín hiệu chạy qua cả năm tiêu chí: **\"em\" hay \"team em\"**. Interviewer cần biết phần của em. Nói \"team em làm\" từ đầu tới cuối thì họ không chấm được gì cho em.",
        "Bấm từng dòng để xem câu có thể nói, cho thấy tín hiệu đó.",
      ],
      widgetTitle: "Năm tiêu chí và tín hiệu họ tìm",
      cheat: [
        { name: "Ownership", one: "Tín hiệu tốt: tự nhận việc, theo tới cùng. Tín hiệu xấu: \"chuyện đó không phải phần em\".", say: "Không ai được giao việc này, nhưng nó chặn release, nên em nhận, báo leader là em đang xử lý, và theo tới khi đóng ticket." },
        { name: "Collaboration", one: "Tín hiệu tốt: hiểu lý do của người kia, dùng dữ liệu. Tín hiệu xấu: kể đồng nghiệp như phản diện.", say: "Em hỏi anh ấy lo ngại điều gì trước, rồi hai bên thống nhất một tiêu chí đo để chọn." },
        { name: "Learning", one: "Tín hiệu tốt: bài học thành hành động cụ thể. Tín hiệu xấu: \"em rút kinh nghiệm\" mà không nói rút gì.", say: "Sau lần đó em thêm bước kiểm tra vào checklist release, và từ đó lỗi kiểu này không lặp lại." },
        { name: "Impact", one: "Tín hiệu tốt: số trước và sau, có nguồn đo. Tín hiệu xấu: \"nhanh hơn nhiều\", \"khách rất hài lòng\".", say: "Theo dashboard, thời gian xử lý batch giảm từ khoảng X xuống Y, nên team ops không còn phải chạy tay buổi sáng." },
        { name: "Communication", one: "Tín hiệu tốt: câu kết luận đầu tiên, chi tiết sau. Tín hiệu xấu: kể từ đầu dự án, năm phút chưa vào ý.", say: "Tóm lại là em đã giảm lỗi thanh toán trùng. Em kể ngắn bối cảnh rồi đi vào cách em làm nhé." },
      ],
      takeaway: {
        lines: [
          "Mỗi câu behavioral nhắm vào một hai tiêu chí. Trước khi trả lời, tự hỏi: câu này đang đo **ownership, collaboration, learning, impact hay communication**?",
          "Nói \"em\" cho phần của em, \"team\" cho phần của team. Interviewer chỉ chấm được phần của em.",
        ],
      },
      quiz: {
        question: "Câu trả lời \"Team em đã tối ưu API, giảm thời gian phản hồi rất nhiều\" yếu nhất ở hai tiêu chí nào?",
        options: [
          "Collaboration và Learning",
          "Ownership (không rõ phần của em) và Impact (không có số)",
          "Communication và Collaboration",
          "Không yếu, vì kết quả tốt",
        ],
        answer: 1,
        explain:
          "\"Team em\" che mất phần em làm, nên interviewer không chấm được ownership. \"Rất nhiều\" không phải số đo, nên impact không kiểm chứng được. Sửa: \"Em tìm ra truy vấn chậm và thêm index, p95 giảm từ khoảng X xuống Y theo Grafana\".",
      },
      parts: [
        {
          id: "two-minute",
          title: "Câu trả lời 2 phút",
          intro: [
            "Câu trả lời behavioral tốt thường dài khoảng **1,5 đến 2 phút**. Ngắn hơn thì thiếu Action, dài hơn thì interviewer mất mạch và hết giờ cho câu sau. Họ muốn hỏi xoáy thì sẽ tự hỏi.",
            "Khác với STAR thuần, ta mở bằng **một câu kết luận** (headline) để người nghe biết câu chuyện đi về đâu, rồi mới kể. Năm nhịp:",
            "- **Headline** (khoảng 10 giây): một câu tóm chuyện và kết quả.",
            "- **Bối cảnh và nhiệm vụ** (khoảng 20 giây): đủ để hiểu, không kể lịch sử dự án.",
            "- **Action** (khoảng 60 giây): hai ba bước em làm, mỗi bước kèm lý do; nói rõ phương án đã cân nhắc.",
            "- **Result** (khoảng 15 giây): số đo được, hoặc kết quả thật nếu không có số.",
            "- **Learning** (khoảng 15 giây): em làm khác gì từ sau đó.",
            "Kết bằng một câu ngắn như \"Đó là cách em xử lý\" rồi **dừng**. Im lặng sau câu kết là bình thường, đừng nói thêm để lấp khoảng trống.",
          ],
          board: {
            title: "Câu trả lời 2 phút theo năm nhịp",
            highlight: "2 phút",
            chips: ["Headline", "Bối cảnh", "Action", "Result", "Learning"],
            cards: [
              {
                title: "Thứ tự nói",
                diagram: {
                  kind: "flow",
                  steps: [
                    "Headline: một câu kết luận",
                    "Bối cảnh và nhiệm vụ: 20 giây",
                    "Action: 2 đến 3 bước, mỗi bước một lý do",
                    "Result: số đo được",
                    "Learning: em làm khác gì từ đó",
                  ],
                  ok: ["Dừng đúng lúc", "Interviewer hỏi xoáy vào chỗ họ quan tâm"],
                  bad: ["Kể lan man", "Hết 5 phút vẫn chưa tới Action"],
                },
                notes: [
                  "Headline mẫu: \"Đây là lần em phát hiện và sửa lỗi trừ tiền hai lần trên production, sau đó lỗi đó không lặp lại.\"",
                  "Luyện bằng cách nói to và bấm giờ. Ghi âm một lần, nghe lại, cắt mọi câu không phục vụ Action.",
                ],
                takeaway: "Kết luận trước, chi tiết sau, dừng ở 2 phút",
              },
            ],
            conclusion: "**Kết luận:** headline giúp người nghe theo kịp, Action chiếm phần lớn thời gian, và câu kết ngắn trả quyền hỏi lại cho interviewer.",
          },
          quiz: {
            question: "Vì sao nên mở câu trả lời bằng một câu headline thay vì kể bối cảnh ngay?",
            options: [
              "Để câu trả lời dài hơn",
              "Người nghe biết ngay câu chuyện đi về đâu và kết quả là gì, nên theo được phần chi tiết",
              "Vì STAR bắt buộc như vậy",
              "Để tránh nói về Action",
            ],
            answer: 1,
            explain:
              "Interviewer vừa nghe vừa ghi chép. Biết trước kết luận thì họ hiểu từng bước Action phục vụ điều gì. Nếu bị cắt ngang giữa chừng, ý chính cũng đã được nói.",
          },
        },
        {
          id: "story-bank",
          title: "Ngân hàng câu chuyện: 6 đến 8 chuyện cho mọi câu hỏi",
          intro: [
            "Có hàng trăm câu behavioral nhưng chỉ khoảng mười chủ đề. Đừng chuẩn bị từng câu. Hãy chuẩn bị **6 đến 8 câu chuyện thật**, mỗi chuyện có nhiều khía cạnh, rồi chọn khía cạnh hợp với câu hỏi.",
            "Một ngân hàng cân đối nên có ít nhất:",
            "- **Một chuyện kỹ thuật khó** (bug khó, tối ưu hiệu năng).",
            "- **Một chuyện xung đột hoặc bất đồng**.",
            "- **Một chuyện sai lầm** của chính em.",
            "- **Một chuyện ownership** (sự cố, việc không ai nhận).",
            "- **Một chuyện học nhanh** công nghệ hay domain mới.",
            "- **Một chuyện giúp người khác** hoặc dẫn dắt.",
            "- **Một chuyện deadline gấp** hoặc phải cắt phạm vi.",
            "Với mỗi chuyện ghi một dòng: tên ngắn, số liệu chính, các tiêu chí nó chứng minh. Ví dụ: \"Lỗi trừ tiền hai lần: thêm idempotency key, 0 lần trùng sau release; ownership, impact, learning\". Đừng viết kịch bản đầy đủ để học thuộc, nghe sẽ như đọc bài.",
            "Quy tắc khi dùng: trong cùng một buổi, **không kể một chuyện hai lần**. Nếu đã dùng chuyện sự cố cho câu ownership thì câu \"vấn đề khó nhất\" nên lấy chuyện khác.",
          ],
          board: {
            title: "Một câu chuyện trả lời nhiều câu hỏi",
            highlight: "nhiều câu hỏi",
            cards: [
              {
                title: "Chuyện: sửa lỗi trừ tiền hai lần",
                diagram: {
                  kind: "hub",
                  inputs: [
                    { label: "Kể về một lần em chủ động", mark: "plus" },
                    { label: "Vấn đề kỹ thuật khó nhất", mark: "plus" },
                    { label: "Một lần em mắc lỗi", mark: "plus" },
                    { label: "Kể về impact của em", mark: "plus" },
                  ],
                  center: "Một câu chuyện thật",
                  rulesTitle: "Đổi khía cạnh theo câu hỏi",
                  rules: [
                    "Chủ động: em tự điều tra dù không được giao",
                    "Kỹ thuật: cách tìm ra race condition",
                    "Mắc lỗi: thiếu test retry ở code của em",
                    "Impact: số giao dịch trùng trước và sau",
                  ],
                },
                takeaway: "Cùng sự thật, đổi điểm nhấn",
              },
            ],
            conclusion: "**Kết luận:** chuyện thật nhiều khía cạnh có giá trị hơn mười chuyện mỏng. Mọi chi tiết đều thật nên câu hỏi xoáy nào cũng trả lời được.",
          },
          drill: {
            choices: ["Ownership", "Collaboration", "Learning", "Impact"],
            items: [
              { q: "\"Tell me about a time you disagreed with a teammate.\"", a: "Collaboration", why: "Câu xung đột đo cách em làm việc với người khác khi không đồng ý." },
              { q: "\"Kể về một lần em làm việc ngoài phạm vi được giao.\"", a: "Ownership", why: "Đo việc em có coi vấn đề là của mình và theo tới cùng không." },
              { q: "\"Kể về một sai lầm của em và em đã làm gì sau đó.\"", a: "Learning", why: "Họ muốn thấy em nhận trách nhiệm và đổi cách làm, không phải bản thân lỗi." },
              { q: "\"What is the project you are most proud of, and why?\"", a: "Impact", why: "\"Tự hào nhất\" thường đo kết quả em tạo ra. Nhớ nói số và phần của em." },
              { q: "\"Kể về lần em phải học một công nghệ mới trong thời gian ngắn.\"", a: "Learning", why: "Đo cách em học: tài liệu, PoC, hỏi người biết, và áp dụng ra sao." },
            ],
            summary: "Nhận ra tiêu chí đang được đo thì chọn được câu chuyện và khía cạnh phù hợp trong ngân hàng.",
          },
          widgetTitle: "Câu hỏi này đang đo tiêu chí nào?",
          quiz: {
            question: "Em đã kể chuyện sửa lỗi trừ tiền cho câu \"chủ động\". Mười phút sau họ hỏi \"vấn đề kỹ thuật khó nhất\". Nên làm gì?",
            options: [
              "Kể lại đúng chuyện đó cho chắc",
              "Lấy một chuyện khác trong ngân hàng; nếu thật sự chỉ có chuyện đó thì nói rõ là cùng sự việc và đi sâu phần kỹ thuật chưa kể",
              "Bịa một chuyện mới",
              "Nói em chưa gặp vấn đề khó",
            ],
            answer: 1,
            explain:
              "Kể lặp làm ngân hàng chuyện của em trông mỏng. Ngân hàng 6 đến 8 chuyện sinh ra để tránh việc này. Nếu buộc phải dùng lại, nói thẳng và đào sâu khía cạnh mới thì vẫn trung thực và có thêm thông tin.",
          },
        },
      ],
    },
    {
      id: "conflict",
      scene: "conflict",
      title: "Phần 2: Xử lý xung đột",
      intro: [
        "Trong năm tiêu chí ở Phần 1, collaboration là thứ khó chứng minh nhất, và câu hỏi về xung đột là nơi nó lộ ra rõ nhất. Ba dạng hay gặp:",
        "- **Với đồng nghiệp**: \"Kể về lần em bất đồng với một teammate\".",
        "- **Với PM hoặc lead**: deadline vô lý, yêu cầu đổi phút chót, quyết định em không đồng ý.",
        "- **Bất đồng kỹ thuật**: chọn thư viện, kiến trúc, cách thiết kế.",
        "Khung trả lời năm bước, dùng cho cả ba dạng:",
        "- **Nêu bất đồng trung lập**: hai phương án, không ai là phản diện.",
        "- **Hiểu lý do bên kia**: em hỏi gì để hiểu họ lo ngại điều gì.",
        "- **Đưa về dữ liệu hoặc tiêu chí chung**: PoC, benchmark, rủi ro, chi phí, ảnh hưởng tới người dùng.",
        "- **Kết quả**: ai quyết, quyết thế nào. Có thể là phương án của em, của họ, hoặc phương án lai.",
        "- **Quan hệ sau đó và bài học**: hai bên vẫn làm việc tốt, em học được gì.",
        "Chuyện tốt nhất không nhất thiết là chuyện em thắng. Chuyện em **thua mà vẫn làm hết sức** thường thuyết phục hơn, vì nó cho thấy em đặt mục tiêu chung lên trên cái tôi.",
        "Chọn một cách trả lời bên dưới, rồi xem interviewer sẽ hỏi xoáy gì và câu trả lời đó trụ được không.",
      ],
      predict: {
        question: "Câu chuyện xung đột nào gây ấn tượng tốt hơn với interviewer?",
        options: [
          "Em đúng, đồng nghiệp sai, cuối cùng mọi người nghe em",
          "Em đưa dữ liệu, team vẫn chọn phương án khác, em làm hết sức theo phương án đó và theo dõi rủi ro em đã nêu",
          "Em tránh tranh luận để giữ hoà khí",
          "Em báo lên sếp để sếp phân xử ngay",
        ],
        answer: 1,
        explain:
          "Đây là disagree and commit: nói rõ quan điểm bằng dữ liệu, rồi khi đã chốt thì cam kết hết mình. Kể chuyện mình luôn đúng nghe như khó làm việc cùng; né tranh luận thì không có tiếng nói; leo thang ngay lên sếp cho thấy không tự xử lý được.",
      },
      widgetTitle: "Cùng một chuyện bất đồng, hai cách kể",
      compare: [
        {
          label: "Cách kể tệ",
          code: `Dự án cũ, anh lead muốn dùng MongoDB cho dữ liệu đơn hàng.
Em biết ngay là sai vì đơn hàng cần transaction.
Em nói mấy lần nhưng anh ấy không nghe, vẫn làm theo ý anh ấy.
Sau này đúng là có lỗi dữ liệu, em đã nói từ trước rồi.
Nói chung anh ấy hơi bảo thủ.`,
          scenarios: [
            { ask: "\"Em đã làm gì để hiểu vì sao lead muốn MongoDB?\"", outcome: [{ kind: "err", text: "Không có câu trả lời: chuyện không có bước hiểu bên kia." }] },
            { ask: "\"Em thuyết phục bằng gì?\"", outcome: [{ kind: "err", text: "Chỉ có \"em nói mấy lần\": không dữ liệu, không PoC." }] },
            { ask: "\"Sau khi chốt, em làm việc thế nào?\"", outcome: [{ kind: "err", text: "Giọng \"em đã nói rồi\" cho thấy em không cam kết, chờ người kia sai." }] },
          ],
          verdict: "Đổ lỗi, gắn nhãn người khác, không dữ liệu. Interviewer nghe thấy một người khó làm việc cùng.",
        },
        {
          label: "Cách kể tốt",
          code: `Headline: em và lead bất đồng về database cho module đơn hàng;
em đưa dữ liệu, team chọn phương án lai, và em làm phần rủi ro nhất.
- Lead muốn MongoDB vì schema sản phẩm thay đổi liên tục.
- Em lo phần trừ tiền và tồn kho cần transaction nhiều bảng.
- Em hỏi rõ lo ngại của anh ấy, rồi đề xuất cùng làm PoC 2 ngày
  với đúng 3 luồng nghiệp vụ, đo theo tiêu chí hai bên thống nhất.
- Kết quả: đơn hàng và thanh toán ở PostgreSQL, catalog ở MongoDB.
- Em nhận viết phần đồng bộ giữa hai bên và test cho nó.
Bài học: thống nhất tiêu chí đo trước khi tranh luận phương án.`,
          scenarios: [
            { ask: "\"Em đã làm gì để hiểu vì sao lead muốn MongoDB?\"", outcome: [{ kind: "ok", text: "Có: em hỏi lo ngại của anh ấy (schema đổi liên tục) và coi đó là lý do hợp lý." }] },
            { ask: "\"Em thuyết phục bằng gì?\"", outcome: [{ kind: "ok", text: "PoC ngắn với tiêu chí hai bên đã thống nhất, không phải tranh luận cảm tính." }] },
            { ask: "\"Nếu team chọn hẳn MongoDB thì sao?\"", outcome: [{ kind: "ok", text: "Câu trả lời sẵn: em vẫn làm theo, ghi rõ rủi ro transaction và đề xuất cách giảm rủi ro trong phạm vi đã chốt." }] },
          ],
          verdict: "Trung lập, hiểu bên kia, dùng dữ liệu, có hành động sau quyết định. Chi tiết trong ví dụ là mẫu: thay bằng chuyện thật của em.",
        },
      ],
      after: [
        "Cách kể tệ không sai về kỹ thuật, có khi em đúng thật. Nó trượt vì cho thấy cách em hành xử: gắn nhãn \"bảo thủ\", không tìm hiểu, và vui khi người kia sai.",
        "Đừng bao giờ dùng từ đánh giá tính cách người khác (bảo thủ, kém, lười). Mô tả hành vi và lý do của họ một cách trung lập.",
      ],
      trap: {
        title: "\"Em chưa bao giờ xung đột với ai\"",
        text: "Câu này nghe như né, hoặc như em chưa từng có ý kiến riêng. Ai làm việc nhóm cũng có lúc bất đồng. Chọn một bất đồng thật, quy mô vừa phải (chọn thư viện, cách đặt API, ước lượng thời gian) là đủ, không cần chuyện căng thẳng.",
      },
      quiz: {
        question: "Bước nào trong khung trả lời xung đột hay bị bỏ qua nhất, và làm câu chuyện yếu đi rõ nhất?",
        options: [
          "Nêu tên công nghệ",
          "Hiểu lý do của bên kia trước khi đưa phương án của mình",
          "Nói kết quả",
          "Nói thời gian dự án",
        ],
        answer: 1,
        explain:
          "Thiếu bước này, chuyện thành \"em đúng, họ sai\". Có bước này, interviewer thấy em biết lắng nghe và coi lý do của người khác là hợp lý, đó chính là collaboration.",
      },
      parts: [
        {
          id: "disagree-commit",
          title: "Disagree and commit, và bất đồng với PM hoặc lead",
          intro: [
            "**Disagree and commit** (bất đồng nhưng cam kết) là nguyên tắc nổi tiếng trong bộ Leadership Principles của Amazon và được nhiều công ty dùng: trước khi quyết, em có trách nhiệm nói rõ khi không đồng ý, kể cả với cấp trên; sau khi đã quyết, em làm hết sức như thể đó là phương án của mình.",
            "Ba điều phân biệt \"commit thật\" với \"commit cho có\":",
            "- **Không âm thầm làm chậm** hay làm qua loa phần mình không thích.",
            "- **Không nói \"em đã bảo rồi\"** khi có vấn đề, mà cùng sửa.",
            "- **Ghi lại rủi ro** đã nêu và đặt cách theo dõi, để nếu rủi ro xảy ra thì cả team phát hiện sớm.",
            "Với PM hoặc lead, bất đồng hay xoay quanh **phạm vi và thời hạn**. Thay vì \"không kịp đâu\", đưa ra lựa chọn: \"Nếu giữ deadline thì cắt tính năng A và B sang sprint sau; nếu cần đủ tính năng thì cần thêm một tuần. Anh chị muốn ưu tiên cái nào?\" Người quyết là họ, em giúp họ quyết với đủ thông tin.",
            "Có một ngoại lệ: chuyện liên quan tới **bảo mật, dữ liệu khách hàng, tiền hoặc pháp lý**. Khi đó em không chỉ commit, mà phải leo thang đúng kênh (lead của lead, security, compliance) và nói rõ vì sao.",
          ],
          drill: {
            choices: ["Tốt", "Tệ"],
            items: [
              { q: "PM muốn thêm tính năng 2 ngày trước release. Em trả lời: \"Không kịp đâu chị, team em đang quá tải.\"", a: "Tệ", why: "Chỉ từ chối, không đưa lựa chọn. Nên nói rõ đánh đổi: thêm tính năng thì lùi release hay cắt phần nào, để PM quyết." },
              { q: "Team chọn thư viện em không thích. Em làm theo, viết wrapper để sau này dễ thay, và ghi rủi ro em lo vào tài liệu thiết kế.", a: "Tốt", why: "Commit thật, đồng thời giảm rủi ro một cách xây dựng thay vì chờ người khác sai." },
              { q: "Lead quyết bỏ qua code review cho bản hotfix. Em vẫn làm, nhưng sau đó nói với mọi người \"quyết định đó sai từ đầu\".", a: "Tệ", why: "Đó là commit cho có. Nếu không đồng ý, nói với lead trước hoặc trong buổi retro, theo hướng đề xuất quy trình hotfix an toàn hơn." },
              { q: "Lead muốn log toàn bộ request body, gồm cả số thẻ của khách, để dễ debug. Em giải thích rủi ro, lead vẫn muốn, em báo cho bộ phận security.", a: "Tốt", why: "Dữ liệu thẻ là ngoại lệ của disagree and commit: rủi ro pháp lý và bảo mật cần leo thang đúng kênh." },
              { q: "Bất đồng với teammate về cách đặt tên API, em đề xuất theo convention của team đã ghi trong tài liệu.", a: "Tốt", why: "Đưa về một tiêu chí chung có sẵn thay vì tranh luận sở thích cá nhân." },
            ],
            summary: "Nói rõ khi bất đồng, đưa lựa chọn thay vì chỉ từ chối, commit thật sau khi chốt. Chỉ leo thang khi đụng tới bảo mật, dữ liệu, tiền hay pháp lý.",
          },
          widgetTitle: "Tốt hay tệ?",
          takeaway: {
            lines: [
              "Trước khi quyết: nói rõ, bằng dữ liệu. Sau khi quyết: làm hết sức, ghi rủi ro, không \"em đã bảo rồi\".",
              "Với PM và lead: đưa lựa chọn có đánh đổi, để họ quyết.",
            ],
          },
          quiz: {
            question: "Interviewer hỏi tiếp: \"Nếu sau đó đúng là phương án của team gây lỗi thì em làm gì?\" Câu nào tốt nhất?",
            options: [
              "Nhắc mọi người là em đã cảnh báo",
              "Cùng team sửa lỗi trước, rồi đưa vào retro: rủi ro đã ghi lại, lần sau ta theo dõi nó thế nào",
              "Tự sửa lại theo phương án của em mà không hỏi ai",
              "Không làm gì vì đó là quyết định của lead",
            ],
            answer: 1,
            explain:
              "Ưu tiên là sửa sự cố. Bài học đưa vào retro theo hướng cải thiện quy trình, không phải để chứng minh mình đúng. Tự ý đổi phương án là phá vỡ cam kết chung.",
          },
        },
      ],
    },
    {
      id: "failure",
      scene: "failure",
      title: "Phần 3: Kể về thất bại và sai lầm",
      intro: [
        "Ở Phần 2 ta học cách nói về lúc người khác không đồng ý với mình. Câu khó hơn là nói về lúc **chính mình sai**: \"Kể về một thất bại\", \"Một sai lầm em từng mắc\", \"Một dự án không như kỳ vọng\".",
        "Câu này đo **learning** và sự trung thực. Chọn chuyện theo ba tiêu chí:",
        "- **Thật và là lỗi của em**: không phải lỗi của team, khách hàng hay đồng nghiệp.",
        "- **Hậu quả vừa phải**: có ảnh hưởng thật (bug lên production, trễ deadline, ước lượng sai), nhưng không phải thảm hoạ do cẩu thả nghiêm trọng hay vi phạm đạo đức.",
        "- **Có thay đổi cụ thể sau đó**: một thói quen, một bước trong quy trình, một test, một checklist.",
        "Cấu trúc gợi ý: **lỗi là gì** (một câu, dùng chữ \"em\"), **hậu quả**, **em xử lý ngay thế nào**, **nguyên nhân gốc**, **em thay đổi gì**, và **bằng chứng thay đổi có tác dụng**. Phần thay đổi và bằng chứng nên dài nhất.",
        "Bẫy lớn nhất là **thất bại giả**: chuyện nghe như thất bại nhưng thực ra là khoe. Interviewer gặp chúng hằng ngày và nhận ra ngay. Thử phân loại bên dưới.",
      ],
      widgetTitle: "Chuyện thật hay thất bại giả?",
      drill: {
        choices: ["Chuyện tốt", "Thất bại giả", "Đổ lỗi", "Quá nặng"],
        items: [
          { q: "\"Thất bại của em là quá cầu toàn, em hay làm thêm giờ để code thật hoàn hảo.\"", a: "Thất bại giả", why: "Đây là khoe được ngụy trang. Không có hậu quả thật, không có bài học. Interviewer nghe câu này rất nhiều lần." },
          { q: "\"Em viết migration đổi kiểu một cột mà không thử trên bản sao dữ liệu production. Lên production nó khoá bảng khoảng 10 phút. Em rollback, rồi từ đó mọi migration đều chạy thử trên bản sao và đo thời gian trước.\"", a: "Chuyện tốt", why: "Lỗi thật của em, hậu quả vừa phải, xử lý nhanh, và có thay đổi quy trình cụ thể." },
          { q: "\"Dự án trễ vì bên QA test chậm và PM thay đổi yêu cầu liên tục.\"", a: "Đổ lỗi", why: "Không có phần nào là của em. Kể cả khi đúng, chuyện này không cho thấy em học được gì." },
          { q: "\"Em cố ý bỏ qua review để kịp deadline, làm lộ dữ liệu khách hàng ra log công khai trong vài tuần.\"", a: "Quá nặng", why: "Hậu quả nghiêm trọng kèm quyết định cố ý vượt quy trình làm interviewer lo ngại về phán đoán của em. Chọn chuyện nhẹ hơn." },
          { q: "\"Em ước lượng task tích hợp cổng thanh toán là 3 ngày, mất gần 2 tuần vì không đọc kỹ tài liệu sandbox. Từ đó em dành nửa ngày spike đầu tiên cho mọi tích hợp bên thứ ba rồi mới báo ước lượng.\"", a: "Chuyện tốt", why: "Sai lầm phổ biến, có hậu quả thật, nguyên nhân gốc rõ và thay đổi cụ thể." },
          { q: "\"Em chưa có thất bại nào đáng kể.\"", a: "Thất bại giả", why: "Nghe như né tránh hoặc thiếu tự nhận thức. Ai làm đủ lâu cũng có ít nhất một chuyện." },
        ],
        summary: "Chuyện tốt: lỗi thật của em, hậu quả vừa phải, có thay đổi cụ thể. Tránh khoe ngụy trang, đổ lỗi, và chuyện cho thấy phán đoán kém nghiêm trọng.",
      },
      after: [
        "Chi tiết trong các chuyện tốt ở trên chỉ là ví dụ minh hoạ. Dùng chuyện của chính em, với con số em nhớ được thật.",
        "Câu nhận lỗi nên ngắn và thẳng: \"Lỗi là do em\". Không cần xin lỗi nhiều lần hay tự trách. Mục tiêu là cho thấy em bình tĩnh nhìn lại, rồi chuyển sang phần học được.",
      ],
      trap: {
        title: "Nhận lỗi rồi lại rút lại",
        text: "\"Lỗi là do em, nhưng thật ra do tài liệu không rõ và không ai review kỹ.\" Nửa sau xoá nửa đầu. Nếu có yếu tố ngoài thật, nói ở phần nguyên nhân gốc theo hướng \"em đã thêm bước kiểm tra để không phụ thuộc vào điều đó nữa\".",
      },
      takeaway: {
        lines: [
          "Thất bại tốt = lỗi thật của em + hậu quả vừa phải + thay đổi cụ thể có bằng chứng.",
          "Phần thay đổi sau lỗi mới là điều interviewer chấm, nên nó phải dài nhất.",
        ],
      },
      quiz: {
        question: "Phần nào trong câu chuyện thất bại nên chiếm nhiều thời gian nhất?",
        options: [
          "Mô tả chi tiết hậu quả để thấy mức nghiêm trọng",
          "Giải thích vì sao lỗi không hoàn toàn do em",
          "Nguyên nhân gốc và thay đổi cụ thể em làm sau đó, kèm bằng chứng thay đổi có tác dụng",
          "Lời xin lỗi",
        ],
        answer: 2,
        explain:
          "Câu này đo learning. Hậu quả chỉ cần đủ để thấy chuyện có thật; phần đáng chấm là em hiểu vì sao sai và đổi cách làm thế nào.",
      },
      parts: [
        {
          id: "failure-followups",
          title: "Câu hỏi xoáy sau chuyện thất bại",
          intro: [
            "Kể xong, interviewer giỏi sẽ hỏi tiếp để kiểm tra chuyện có thật và em có hiểu sâu không. Chuẩn bị sẵn cho các câu này:",
            "- **\"Nếu làm lại, em làm khác ở điểm nào?\"**: nêu một quyết định cụ thể, không chung chung \"em sẽ cẩn thận hơn\".",
            "- **\"Ai phát hiện lỗi đầu tiên?\"**: nếu người khác phát hiện, nói thật, rồi kể em đã thêm gì để lần sau tự phát hiện sớm hơn (alert, test).",
            "- **\"Team và quản lý phản ứng thế nào?\"**: kể trung lập, tập trung vào việc em đã báo cáo minh bạch.",
            "- **\"Từ đó tới giờ lỗi tương tự có lặp lại không?\"**: đây là lúc bằng chứng thay đổi có tác dụng phát huy.",
          ],
          quiz: {
            question: "\"Nếu làm lại, em làm khác ở điểm nào?\" Câu trả lời nào tốt nhất?",
            options: [
              "\"Em sẽ cẩn thận hơn.\"",
              "\"Em sẽ chạy migration trên bản sao dữ liệu production và đo thời gian khoá trước khi lên lịch release.\"",
              "\"Em sẽ không làm task đó nữa.\"",
              "\"Em sẽ nhờ người khác làm.\"",
            ],
            answer: 1,
            explain:
              "Câu trả lời cụ thể cho thấy em hiểu đúng nguyên nhân gốc. \"Cẩn thận hơn\" không phải một hành động có thể kiểm chứng.",
          },
        },
      ],
    },
    {
      id: "ownership",
      scene: "ownership",
      title: "Phần 4: Ownership và vượt phạm vi",
      senior: true,
      intro: [
        "Thất bại cho thấy em học thế nào. Ownership cho thấy em **làm gì khi không ai bắt em làm**. Đây là tiêu chí phân biệt rõ nhất giữa mid và senior.",
        "Hai dạng chuyện ownership mạnh nhất:",
        "- **Sự cố production**: lúc nửa đêm hay cuối tuần, em xử lý thế nào, và sau đó làm gì để nó không lặp lại.",
        "- **Việc không ai nhận**: test chạy chập chờn (flaky) mà ai cũng bỏ qua, tài liệu onboarding lỗi thời, alert kêu mãi không ai xem, một module không ai dám đụng.",
        "Với sự cố production, kể theo thứ tự ưu tiên mà team vận hành tốt vẫn làm:",
        "- **Giảm ảnh hưởng trước** (mitigate): rollback, tắt feature flag, chuyển traffic. Tìm nguyên nhân gốc để sau.",
        "- **Báo sớm và cập nhật đều**: báo vào kênh sự cố, nói đang ảnh hưởng gì, cập nhật theo mốc thời gian.",
        "- **Tìm nguyên nhân gốc** khi hệ thống đã ổn.",
        "- **Postmortem không đổ lỗi** (blameless): ghi lại diễn biến, nguyên nhân, và các việc cần làm có người nhận và hạn chót.",
        "Ownership không có nghĩa là làm một mình hay tự ý. Trong chuyện, nói rõ em đã **báo ai** và **xin phép ai** trước khi làm việc ngoài phạm vi. Interviewer nghi ngờ người \"tự sửa trên production lúc 2 giờ sáng mà không báo ai\".",
      ],
      widgetTitle: "Sự cố lúc nửa đêm: bước nào làm trước?",
      drill: {
        choices: ["Làm ngay", "Làm sau khi ổn định", "Không nên làm"],
        items: [
          { q: "Alert báo tỉ lệ lỗi thanh toán tăng ngay sau bản deploy chiều nay. Rollback về bản trước.", a: "Làm ngay", why: "Giảm ảnh hưởng trước. Lỗi xuất hiện ngay sau deploy thì rollback là cách nhanh và an toàn nhất." },
          { q: "Nhắn vào kênh sự cố: đang ảnh hưởng gì, em đang làm gì, 15 phút nữa cập nhật.", a: "Làm ngay", why: "Báo sớm giúp người khác không xử lý trùng, và quản lý biết để báo khách nếu cần." },
          { q: "Đọc kỹ toàn bộ code thay đổi để hiểu chính xác vì sao lỗi.", a: "Làm sau khi ổn định", why: "Tìm nguyên nhân gốc quan trọng nhưng không được làm chậm việc giảm ảnh hưởng." },
          { q: "Sửa trực tiếp dữ liệu trong database production bằng tay, không báo ai, để khách khỏi phàn nàn.", a: "Không nên làm", why: "Sửa dữ liệu tay không ghi nhận và không có người duyệt dễ làm hỏng thêm và không truy vết được. Cần quy trình và người duyệt." },
          { q: "Viết postmortem: diễn biến, nguyên nhân, việc cần làm có người nhận.", a: "Làm sau khi ổn định", why: "Postmortem viết khi hệ thống đã ổn, trong vài ngày, theo tinh thần không đổ lỗi." },
          { q: "Trong postmortem ghi tên bạn đã deploy bản lỗi làm nguyên nhân gốc.", a: "Không nên làm", why: "Postmortem không đổ lỗi tìm lỗ hổng của quy trình (vì sao test và review không bắt được), không tìm người để trách." },
        ],
        summary: "Giảm ảnh hưởng và báo cáo trước, nguyên nhân gốc và postmortem sau. Không làm âm thầm, không đổ lỗi cá nhân.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: ["Giảm ảnh hưởng → báo cáo → tìm nguyên nhân gốc → postmortem không đổ lỗi → việc cần làm để không lặp lại."],
      },
      quiz: {
        question: "Kể chuyện ownership, chi tiết nào làm interviewer lo ngại thay vì ấn tượng?",
        options: [
          "Em rollback trước rồi mới tìm nguyên nhân",
          "Em tự sửa thẳng trên production lúc 2 giờ sáng mà không báo ai, sáng hôm sau mới kể",
          "Em viết postmortem và nhận một việc cần làm",
          "Em báo vào kênh sự cố mỗi 15 phút",
        ],
        answer: 1,
        explain:
          "Ownership tốt đi kèm minh bạch và quy trình. Làm âm thầm trên production cho thấy rủi ro: không ai kiểm tra, không ai biết để phối hợp, khó truy vết nếu hỏng thêm.",
      },
      parts: [
        {
          id: "impact-numbers",
          title: "Đo impact bằng số",
          senior: true,
          intro: [
            "Chuyện ownership chỉ trọn vẹn khi có kết quả. \"Hệ thống ổn định hơn\" là cảm nhận, \"số sự cố mỗi tháng giảm từ 4 xuống 1\" là impact.",
            "Bốn nhóm số mà dev backend hay có, kể cả khi không làm việc với số doanh thu:",
            "- **Hiệu năng**: latency p95 hoặc p99, thời gian chạy batch, thời gian build hoặc CI.",
            "- **Độ tin cậy**: số sự cố, tỉ lệ lỗi, thời gian phát hiện và khôi phục.",
            "- **Năng suất team**: số giờ làm tay được tự động hoá, thời gian onboarding người mới, số lần deploy.",
            "- **Chi phí và người dùng**: chi phí hạ tầng, số ticket hỗ trợ, tỉ lệ khách bỏ giữa chừng.",
            "Quy tắc: **số phải thật và nói được nguồn** (\"theo Grafana\", \"theo báo cáo sprint\"). Không nhớ chính xác thì nói khoảng và nói là khoảng. Không có số thì nói kết quả định tính thật (\"team ops không còn phải chạy tay mỗi sáng\") còn hơn bịa số.",
            "Phân loại các câu bên dưới.",
          ],
          widgetTitle: "Câu nào có impact đo được?",
          drill: {
            choices: ["Đo được", "Mơ hồ"],
            items: [
              { q: "\"Sau khi em thêm index và sửa N+1, API danh sách đơn hàng nhanh hơn rất nhiều.\"", a: "Mơ hồ", why: "\"Rất nhiều\" không kiểm chứng được. Thêm p95 trước và sau, đo ở đâu." },
              { q: "\"Em tự động hoá bước đối soát, team không còn mất khoảng 2 giờ mỗi sáng làm tay, theo bảng theo dõi công việc của team.\"", a: "Đo được", why: "Có số, có nguồn, và có ý nghĩa với người nghe (giờ công tiết kiệm)." },
              { q: "\"Em giúp hệ thống ổn định và scalable hơn.\"", a: "Mơ hồ", why: "Từ chung chung. Nên là số sự cố, tỉ lệ lỗi, hoặc mức tải chịu được trước và sau." },
              { q: "\"Em sửa test flaky, tỉ lệ pipeline phải chạy lại giảm từ khoảng một phần ba xuống dưới 5% trong hai sprint sau.\"", a: "Đo được", why: "Có số trước và sau, có khoảng thời gian, nói rõ là ước lượng." },
              { q: "\"Khách hàng rất hài lòng với tính năng em làm.\"", a: "Mơ hồ", why: "Nếu có số ticket hỗ trợ giảm, tỉ lệ dùng tính năng, hay lời khen cụ thể từ khách thì nói cái đó." },
            ],
            summary: "Impact tốt: số trước và sau, khoảng thời gian, nguồn đo. Không có số thì nói kết quả định tính thật, không bịa.",
          },
          trap: {
            title: "Bịa hoặc thổi phồng số",
            text: "Interviewer hay hỏi \"đo bằng cách nào?\", \"p95 hay trung bình?\", \"trước đó là bao nhiêu?\". Một con số bịa vỡ sau hai câu hỏi và kéo theo mất niềm tin vào cả buổi phỏng vấn. Trước buổi phỏng vấn, xem lại dashboard, ticket, báo cáo cũ để lấy số thật.",
          },
          quiz: {
            question: "Em không nhớ chính xác thời gian batch trước khi tối ưu. Nên nói thế nào?",
            options: [
              "Đưa ra một con số đẹp cho thuyết phục",
              "\"Khoảng 40 phút xuống còn khoảng 5 phút, em nhớ theo log job lúc đó, không chắc từng phút\"",
              "Bỏ qua phần kết quả",
              "\"Nhanh hơn khoảng 10 lần\" mà không nói từ đâu ra",
            ],
            answer: 1,
            explain:
              "Nói khoảng, nói nguồn và nói rõ mức chắc chắn là trung thực và vẫn có số. Con số đẹp nhưng bịa sẽ vỡ khi bị hỏi xoáy.",
          },
        },
      ],
    },
    {
      id: "sensitive",
      scene: "sensitive",
      title: "Phần 5: Câu hỏi nhạy cảm",
      intro: [
        "Các phần trước là chuyện em chủ động chọn để kể. Phần này là những câu **ai cũng bị hỏi** và dễ trả lời sai vì cảm xúc: vì sao nghỉ việc, vì sao có khoảng trống trong CV, điểm yếu, kỳ vọng lương, có offer khác không.",
        "Nguyên tắc chung cho cả năm câu:",
        "- **Trung thực nhưng chọn lọc**: không nói dối, nhưng không phải chi tiết nào cũng cần kể.",
        "- **Ngắn, rồi chuyển về phía trước**: hai ba câu về quá khứ, một câu về điều em muốn ở công việc mới.",
        "- **Không nói xấu ai**: công ty cũ, sếp cũ, đồng nghiệp cũ.",
        "Bấm từng câu để xem mẫu câu nói. Mẫu là khung: thay bằng hoàn cảnh thật của em.",
      ],
      widgetTitle: "Năm câu nhạy cảm: nói gì, tránh gì",
      cheat: [
        { name: "Vì sao nghỉ việc?", one: "Nói: điều em muốn có (quy mô, domain, chiều sâu). Tránh: kể khổ, nói xấu sếp, lương là lý do chính.", say: "Ở công ty hiện tại em học được nhiều về hệ thống thanh toán, nhưng dự án đã ổn định và chủ yếu là bảo trì. Em muốn làm ở môi trường có bài toán tải lớn hơn, và vị trí này đúng hướng đó." },
        { name: "Vì sao có gap trong CV?", one: "Nói: lý do thật, ngắn, và em đã giữ kỹ năng thế nào. Tránh: xin lỗi dài dòng, bịa.", say: "Em nghỉ khoảng sáu tháng vì việc gia đình. Thời gian đó em vẫn làm một project cá nhân với Spring Boot và Kafka để giữ tay nghề, giờ em sẵn sàng đi làm toàn thời gian." },
        { name: "Điểm yếu của em?", one: "Nói: điểm yếu thật, không chí mạng cho vị trí, kèm việc đang làm để cải thiện. Tránh: \"em quá cầu toàn\", hoặc điểm yếu đúng cốt lõi của job.", say: "Trước đây em hay ngại nói khi thấy task có rủi ro trễ, cứ cố tự xử lý. Giờ em đặt quy tắc: thấy trễ quá nửa ngày so với ước lượng là báo lead ngay kèm phương án." },
        { name: "Kỳ vọng lương?", one: "Nói: một khoảng dựa trên tìm hiểu thị trường, nói rõ gross hay net. Tránh: nói số đầu tiên khi chưa hiểu phạm vi công việc, hoặc một số duy nhất quá thấp.", say: "Dựa trên phạm vi công việc và mức thị trường cho vị trí này, em mong muốn trong khoảng X đến Y gross mỗi tháng. Em cũng muốn hiểu thêm về thưởng và phúc lợi để nhìn tổng thể." },
        { name: "Có offer khác không?", one: "Nói: sự thật ở mức chung, cho thấy em quan tâm nơi này. Tránh: bịa offer để ép giá, hay kể chi tiết công ty và con số của offer khác.", say: "Em đang ở vòng cuối với một công ty khác và có thể có kết quả trong khoảng hai tuần. Nhưng vị trí này là lựa chọn em ưu tiên, nên em muốn biết lịch các vòng tiếp theo bên mình." },
      ],
      after: [
        "Với câu nghỉ việc vì môi trường thật sự tệ (bị nợ lương, sếp chèn ép), vẫn có thể nói thật nhưng trung lập và ngắn: \"Công ty gặp khó khăn tài chính và chậm lương mấy tháng, nên em quyết định chuyển\". Đó là sự kiện, không phải lời chê.",
        "Với gap vì bị layoff: nói thẳng là layoff, đó không phải lỗi của em và rất phổ biến. \"Công ty cắt giảm cả team em vì tái cơ cấu\" là đủ.",
      ],
      trap: {
        title: "Điểm yếu đúng vào cốt lõi của vị trí",
        text: "Ứng tuyển backend mà nói \"em yếu SQL\", hay ứng tuyển tech lead mà nói \"em không thích giao tiếp\", là tự loại mình. Chọn điểm yếu thật nhưng liên quan kỹ năng phụ (nói trước đám đông, ước lượng thời gian, ngại hỏi), và luôn kèm việc em đang làm để cải thiện.",
      },
      quiz: {
        question: "\"Vì sao em muốn nghỉ công ty hiện tại?\" Câu nào an toàn và thuyết phục nhất?",
        options: [
          "\"Sếp em rất bảo thủ, không chịu nghe ý kiến.\"",
          "\"Em muốn lương cao hơn.\"",
          "\"Em đã học được nhiều ở đó, giờ em muốn làm với bài toán tải lớn hơn, và vị trí này đúng hướng đó.\"",
          "\"Công ty em làm việc chán lắm.\"",
        ],
        answer: 2,
        explain:
          "Câu trả lời hướng tới điều muốn có và nối với vị trí đang ứng tuyển. Nói xấu sếp cũ khiến người nghe lo em sẽ nói xấu họ; lương là lý do chính khiến họ lo em sẽ đi tiếp khi có chỗ trả cao hơn.",
      },
      parts: [
        {
          id: "salary-offer",
          title: "Kỳ vọng lương và offer khác",
          intro: [
            "Lương là chỗ dev Việt Nam hay thiệt nhất, vì ngại nói. Vài điều cần biết trước khi trả lời:",
            "- **Gross và net**: gross là lương trước thuế thu nhập cá nhân và bảo hiểm bắt buộc, net là số thực nhận. Công ty nước ngoài và nhiều công ty lớn thường nói chuyện bằng gross. Luôn nói rõ em đang nói con số nào.",
            "- **Tổng thu nhập**: thưởng (tháng 13, thưởng theo hiệu suất), bảo hiểm sức khoẻ, cổ phần, ngày phép, chế độ làm từ xa. Hai offer cùng lương cơ bản có thể chênh nhau đáng kể.",
            "- **Tìm hiểu thị trường trước**: các báo cáo lương IT công bố hằng năm, hỏi bạn bè cùng cấp, đọc khoảng lương trong tin tuyển dụng. Đưa ra một **khoảng** mà mức thấp nhất vẫn là mức em chấp nhận được.",
            "- **Thời điểm**: nếu HR hỏi ngay vòng đầu, có thể trả lời bằng khoảng kèm câu \"em muốn hiểu thêm phạm vi công việc\", hoặc hỏi ngược \"ngân sách cho vị trí này khoảng bao nhiêu ạ?\". Đừng từ chối trả lời hoàn toàn: HR cần biết em có nằm trong ngân sách không.",
            "- **Thời gian báo trước**: khi được hỏi \"khi nào em đi làm được\", nhớ thời gian báo trước theo hợp đồng hiện tại (Bộ luật Lao động 2019 quy định ít nhất 45 ngày với hợp đồng không xác định thời hạn, 30 ngày với hợp đồng từ 12 đến 36 tháng). Hứa đi làm sớm hơn mức đó là tự đặt mình vào thế khó.",
            "Với câu \"có offer khác không\": nói thật ở mức chung. Có offer thật thì nói có và nói mốc thời gian, điều đó giúp công ty sắp xếp các vòng nhanh hơn. Không có thì nói đang trao đổi với vài nơi hoặc chỉ tập trung vào vị trí này. **Không bịa offer** để ép giá: HR có thể hỏi chi tiết, và ngành IT ở Việt Nam đủ nhỏ để chuyện đó lộ ra.",
          ],
          widgetTitle: "Nói thế nào về lương và offer?",
          drill: {
            choices: ["Nên nói", "Không nên"],
            items: [
              { q: "\"Em mong muốn khoảng X đến Y gross, tuỳ vào phạm vi công việc và chế độ thưởng.\"", a: "Nên nói", why: "Có khoảng, nói rõ gross, và để ngỏ cho tổng thu nhập." },
              { q: "\"Lương bao nhiêu cũng được ạ, em chủ yếu muốn học hỏi.\"", a: "Không nên", why: "Nghe khiêm tốn nhưng cho HR quyền đưa mức thấp nhất. Em có quyền có kỳ vọng rõ ràng." },
              { q: "\"Bên kia đã offer em gấp rưỡi, bên mình trả bằng thì em nhận.\"", a: "Không nên", why: "Nghe như ép giá và đặt tiền làm động lực duy nhất. Nếu có offer thật, nói mốc thời gian và mức độ quan tâm, đàm phán khi đã có offer chính thức." },
              { q: "\"Em đang có một offer, hạn trả lời là thứ Sáu tuần sau. Em thật sự quan tâm vị trí này, bên mình có thể cho em biết kết quả trước đó không ạ?\"", a: "Nên nói", why: "Sự thật, có mốc, cho thấy ưu tiên, và giúp công ty sắp xếp lịch." },
              { q: "\"Khoảng ngân sách cho vị trí này khoảng bao nhiêu ạ, để em xem có phù hợp không?\"", a: "Nên nói", why: "Hỏi ngược lịch sự ở vòng HR là bình thường, giúp hai bên không mất thời gian nếu lệch quá xa." },
            ],
            summary: "Nói khoảng, nói gross hay net, nhìn tổng thu nhập. Nói thật về offer khác, không bịa để ép giá.",
          },
          takeaway: {
            lines: [
              "Tìm hiểu thị trường trước, đưa ra khoảng có mức thấp nhất em chấp nhận được, nói rõ gross hay net.",
              "Offer khác: nói thật, có mốc thời gian, không bịa.",
            ],
          },
          quiz: {
            question: "HR hỏi kỳ vọng lương ngay vòng đầu khi em chưa rõ phạm vi công việc. Cách nào hợp lý nhất?",
            options: [
              "Từ chối trả lời tới vòng cuối",
              "Đưa một khoảng dựa trên thị trường, nói rõ gross hay net, và nói em muốn hiểu thêm phạm vi công việc để chốt",
              "Nói mức lương hiện tại cộng thêm một chút",
              "Nói \"bao nhiêu cũng được\"",
            ],
            answer: 1,
            explain:
              "HR cần biết em có trong ngân sách không, nên từ chối hoàn toàn gây khó. Một khoảng có căn cứ vừa trả lời được, vừa để chỗ điều chỉnh khi hiểu rõ việc hơn.",
          },
        },
      ],
    },
    {
      id: "reverse-english",
      scene: "reverse-english",
      title: "Phần 6: Câu hỏi ngược và phỏng vấn bằng tiếng Anh",
      intro: [
        "Cuối mỗi vòng gần như luôn có \"Em có câu hỏi gì cho anh chị không?\". Bài Project Story & STAR đã nêu nhóm câu hỏi chung. Ở đây ta chọn câu theo **người đang ngồi đối diện**, vì mỗi người trả lời tốt một loại câu khác nhau:",
        "- **HR / recruiter**: quy trình, lịch các vòng, chế độ, chính sách làm từ xa, thời gian thử việc.",
        "- **Tech lead / senior engineer**: kỹ thuật, cách team làm việc hằng ngày.",
        "- **Engineering manager**: kỳ vọng với vị trí, cách đánh giá, lộ trình phát triển, tình hình team.",
        "Câu hỏi ngược tốt cho thấy em đang **đánh giá công ty** chứ không chỉ chờ được chọn. Chuẩn bị 2 đến 3 câu cho mỗi vòng, và gạch bớt nếu câu trả lời đã có trong buổi nói chuyện.",
        "Bấm từng vòng để xem câu mẫu (tiếng Việt và tiếng Anh).",
      ],
      widgetTitle: "Câu hỏi ngược theo vòng",
      cheat: [
        { name: "HR / recruiter", one: "Quy trình, lịch, chế độ, thử việc, làm từ xa.", say: "Các vòng tiếp theo gồm những gì và khi nào em có kết quả? / What are the next steps, and when can I expect to hear back?" },
        { name: "Tech lead", one: "Thách thức kỹ thuật, review, test, deploy, xử lý sự cố, nợ kỹ thuật.", say: "Thách thức kỹ thuật lớn nhất của team trong sáu tháng tới là gì? / What is the biggest technical challenge the team will face in the next six months?" },
        { name: "Tech lead (cách làm việc)", one: "Code đi từ máy tới production thế nào, on-call ra sao.", say: "Một thay đổi đi từ pull request tới production qua những bước nào, và team xử lý sự cố ra sao? / How does a change go from pull request to production, and how does the team handle incidents?" },
        { name: "Engineering manager", one: "Kỳ vọng, cách đánh giá, lộ trình phát triển.", say: "Sau ba tháng, thế nào là em đang làm tốt ở vị trí này? / What would success look like for this role after the first three months?" },
        { name: "Engineering manager (team)", one: "Vì sao tuyển, team đang ở giai đoạn nào.", say: "Vị trí này mở ra vì team mở rộng hay thay người? / Is this a new position, or a backfill?" },
        { name: "Nên tránh", one: "Hỏi điều có trên website, hỏi lương với tech lead, \"em không có câu hỏi\".", say: "Nếu đã được trả lời hết: \"Anh chị đã giải đáp hầu hết câu em định hỏi. Em chỉ muốn hỏi thêm: điều anh chị thích nhất khi làm ở đây là gì?\"" },
      ],
      takeaway: {
        lines: [
          "Hỏi đúng người: HR về quy trình và chế độ, tech lead về kỹ thuật và cách làm, manager về kỳ vọng và phát triển.",
        ],
      },
      quiz: {
        question: "Ở vòng với tech lead, câu hỏi ngược nào phù hợp nhất?",
        options: [
          "\"Công ty có bao nhiêu ngày phép?\"",
          "\"Lương tháng 13 tính thế nào?\"",
          "\"Một thay đổi đi từ pull request tới production qua những bước nào?\"",
          "\"Công ty thành lập năm nào?\"",
        ],
        answer: 2,
        explain:
          "Tech lead trả lời tốt nhất về kỹ thuật và quy trình làm việc. Phép và lương để cho HR; năm thành lập thì có trên website.",
      },
      parts: [
        {
          id: "english-phrases",
          title: "Mẫu câu tiếng Anh cho các tình huống trên",
          intro: [
            "Khi phỏng vấn với công ty nước ngoài, interviewer không chờ tiếng Anh hoàn hảo. Họ chấm em có **diễn đạt rõ ý** và **xử lý được lúc không hiểu** hay không. Câu ngắn, đúng ngữ pháp cơ bản tốt hơn câu dài và rối.",
            "Vài nguyên tắc:",
            "- **Không hiểu thì hỏi lại** thay vì đoán và trả lời lạc đề.",
            "- **Cần thời gian nghĩ thì nói ra**, đừng im lặng quá lâu.",
            "- **Dùng \"I\" cho phần của em**, \"we\" cho phần của team, giống \"em\" và \"team\" ở Phần 1.",
            "- **Luyện trước bằng cách nói to** các câu mở đầu cho từng câu chuyện trong ngân hàng. Câu mở đầu trôi chảy giúp em bình tĩnh cho phần sau.",
            "Bấm từng tình huống để xem câu mẫu.",
          ],
          widgetTitle: "Mẫu câu tiếng Anh theo tình huống",
          cheat: [
            { name: "Không nghe rõ câu hỏi", one: "Xin nhắc lại hoặc diễn đạt lại để kiểm tra.", say: "Sorry, could you repeat the question? / Just to make sure I understand, are you asking about how I handled the conflict, or how it was resolved?" },
            { name: "Cần thời gian nghĩ", one: "Nói ra để không im lặng.", say: "That's a good question. Let me think for a moment. / Let me pick the best example for this." },
            { name: "Mở đầu câu chuyện", one: "Headline trước, như Phần 1.", say: "Sure. In short, I found and fixed a duplicate payment bug in production. Let me give you some context first." },
            { name: "Bất đồng và commit", one: "Mô tả trung lập, nói rõ đã commit.", say: "My lead and I disagreed on the database choice. I proposed a two-day proof of concept so we could compare with data. The team chose a hybrid approach, and I committed to it fully." },
            { name: "Nhận lỗi", one: "Ngắn, thẳng, rồi chuyển sang thay đổi.", say: "It was my mistake. I didn't test the migration on a copy of production data. Since then, I always run migrations on a staging copy and measure the lock time first." },
            { name: "Vì sao nghỉ việc", one: "Hướng về điều muốn có.", say: "I've learned a lot in my current role, but the system is now mostly in maintenance mode. I'm looking for bigger technical challenges, and this role matches that." },
            { name: "Kỳ vọng lương", one: "Khoảng, gross, để ngỏ tổng thu nhập.", say: "Based on my research and the scope of this role, I'm looking for a range of X to Y gross per month. I'm also open to discussing the full package." },
            { name: "Không biết câu trả lời", one: "Thừa nhận, rồi nói cách em suy luận.", say: "I haven't worked with that directly, but here is how I would approach it. / I'm not sure, but my guess would be..." },
          ],
          quiz: {
            question: "Interviewer hỏi một câu dài bằng tiếng Anh và em không chắc họ hỏi về điều gì. Nên làm gì?",
            options: [
              "Trả lời một chuyện bất kỳ trong ngân hàng cho đỡ im lặng",
              "Diễn đạt lại câu hỏi để kiểm tra: \"Just to make sure I understand, are you asking about...?\"",
              "Xin chuyển sang tiếng Việt",
              "Im lặng chờ họ hỏi lại",
            ],
            answer: 1,
            explain:
              "Hỏi lại để kiểm tra là hành vi giao tiếp tốt, interviewer đánh giá cao. Trả lời lạc đề tốn thời gian và cho thấy em không lắng nghe.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Em chuẩn bị vòng behavioral bằng một ngân hàng khoảng bảy câu chuyện thật: một chuyện kỹ thuật khó, một chuyện bất đồng, một sai lầm của em, một sự cố production, một lần học nhanh, một lần giúp đồng đội và một lần deadline gấp. Với mỗi chuyện em ghi số liệu thật và các tiêu chí nó chứng minh, như ownership, collaboration hay learning. Khi trả lời, em mở bằng một câu kết luận, kể ngắn bối cảnh, dành phần lớn thời gian cho việc em đã làm và vì sao, rồi nói kết quả bằng số và điều em thay đổi sau đó, gói trong khoảng hai phút. Với chuyện bất đồng, em kể cách em hiểu lý do của bên kia, đưa dữ liệu, và khi team đã chốt thì em làm hết sức. Với chuyện sai lầm, em chọn lỗi thật của em, nhận trách nhiệm và kể thay đổi cụ thể. Cuối buổi em luôn có hai, ba câu hỏi ngược hợp với người đang phỏng vấn.",
  cards: [
    { q: "Năm tiêu chí interviewer hay chấm ở vòng behavioral?", a: "Ownership, collaboration, learning, impact, communication. Mỗi câu hỏi thường nhắm vào một hai tiêu chí." },
    { q: "Năm nhịp của câu trả lời 2 phút?", a: "Headline (một câu kết luận), bối cảnh và nhiệm vụ, Action (phần dài nhất), Result bằng số, Learning. Rồi dừng." },
    { q: "Ngân hàng câu chuyện nên có những loại chuyện nào?", a: "Kỹ thuật khó, xung đột, sai lầm của em, ownership hoặc sự cố, học nhanh, giúp người khác, deadline gấp. Khoảng 6 đến 8 chuyện thật, mỗi chuyện nhiều khía cạnh." },
    { q: "Khung trả lời câu xung đột?", a: "Nêu bất đồng trung lập, hiểu lý do bên kia, đưa về dữ liệu hoặc tiêu chí chung, kết quả, quan hệ sau đó và bài học." },
    { q: "Disagree and commit là gì?", a: "Trước khi quyết thì nói rõ khi không đồng ý, bằng dữ liệu; sau khi quyết thì làm hết sức như phương án của mình. Ngoại lệ: bảo mật, dữ liệu khách, tiền, pháp lý thì leo thang đúng kênh." },
    { q: "Chuyện thất bại tốt gồm những gì?", a: "Lỗi thật của em, hậu quả vừa phải, xử lý ngay, nguyên nhân gốc, thay đổi cụ thể và bằng chứng thay đổi có tác dụng." },
    { q: "Thứ tự xử lý sự cố production khi kể chuyện ownership?", a: "Giảm ảnh hưởng (rollback, tắt flag), báo cáo sớm và đều, tìm nguyên nhân gốc, postmortem không đổ lỗi với việc cần làm có người nhận." },
    { q: "Impact tốt trông thế nào?", a: "Số trước và sau, khoảng thời gian, nguồn đo. Không nhớ chính xác thì nói khoảng; không có số thì nói kết quả định tính thật, không bịa." },
    { q: "Trả lời \"Vì sao nghỉ việc?\" thế nào?", a: "Hướng về điều muốn có (quy mô, domain, chiều sâu) và nối với vị trí đang ứng tuyển. Không nói xấu công ty cũ, không lấy lương làm lý do chính." },
    { q: "Trả lời \"Điểm yếu?\" thế nào?", a: "Điểm yếu thật, không thuộc cốt lõi của vị trí, kèm việc đang làm để cải thiện. Tránh \"em quá cầu toàn\"." },
    { q: "Trả lời kỳ vọng lương thế nào?", a: "Đưa một khoảng dựa trên thị trường, mức thấp nhất vẫn chấp nhận được, nói rõ gross hay net, để ngỏ tổng thu nhập (thưởng, bảo hiểm, phép)." },
    { q: "Câu hỏi ngược nên hỏi ai về gì?", a: "HR: quy trình, chế độ. Tech lead: thách thức kỹ thuật, review, deploy, sự cố. Manager: kỳ vọng sau ba tháng, cách đánh giá, lộ trình phát triển." },
  ],
};
