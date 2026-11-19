import { YesNoDrill, type DrillItem } from "../components/yes-no-drill";

/** Lines for behavioral and reverse questions, judged by the advice in study note 10.03. */
const ITEMS: DrillItem[] = [
  { q: "Điểm yếu: \"Em quá cầu toàn.\"", ok: false, why: "Né câu hỏi. Chọn điểm yếu thật, không chí mạng, đang cải thiện có bằng chứng." },
  { q: "Điểm yếu: \"Em từng ước lượng quá lạc quan, giờ em chia việc nhỏ và cộng thời gian cho test, review.\"", ok: true, why: "Thật, có hành động cải thiện." },
  { q: "Deadline gấp: \"Em thức trắng 3 đêm để kịp.\"", ok: false, why: "Nghe như quản lý thời gian kém. Nói chuyện ưu tiên, báo rủi ro sớm, cắt phạm vi có cân nhắc." },
  { q: "Vì sao chuyển việc: \"Em muốn làm hệ thống quy mô lớn hơn và sâu hơn về vận hành.\"", ok: true, why: "Hướng về điều muốn có, không nói xấu công ty cũ." },
  { q: "Vì sao chuyển việc: \"Sếp cũ không biết gì về kỹ thuật.\"", ok: false, why: "Không nói xấu người cũ." },
  { q: "Hỏi ngược ở vòng kỹ thuật: \"Hệ thống đang gặp thách thức kỹ thuật lớn nhất là gì?\"", ok: true, why: "Mở ra thảo luận và cho thấy quan tâm thật." },
  { q: "Hỏi ngược ở vòng kỹ thuật: \"Công ty có bao nhiêu ngày nghỉ phép?\"", ok: false, why: "Để dành cho HR." },
  { q: "\"Em không có câu hỏi gì ạ.\"", ok: false, why: "Luôn chuẩn bị 5–6 câu, chọn 2–3 tuỳ người phỏng vấn." },
  { q: "Kể lab order-service: \"Đây là project cá nhân em dựng để tái hiện và đo N+1.\"", ok: true, why: "Lab là trải nghiệm thật, miễn là nói rõ đó là project cá nhân." },
  { q: "Kể lab order-service như hệ thống production có hàng triệu user", ok: false, why: "Một câu hỏi về vận hành là lộ." },
];

export function SayOrNotWidget() {
  return <YesNoDrill prompt="Câu nào nên nói trong buổi phỏng vấn?" items={ITEMS} yes="nên" no="không nên" summary="Trung thực, nói phần của em, có số liệu thật hoặc kết quả định tính trung thực, và luôn có câu hỏi ngược." />;
}
