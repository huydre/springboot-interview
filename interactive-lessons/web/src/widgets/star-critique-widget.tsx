import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const FLAWS = ["Ổn", "Không rõ phần của em", "Kết quả không đo được", "Không có phương án cân nhắc", "Lan man bối cảnh"] as const;

/** Spot the weakness in each answer fragment (study note 10.03, section 2). */
const ITEMS: ChoiceItem[] = [
  { q: "\"Có lần API chậm, em phát hiện N+1 nên dùng JOIN FETCH, sau đó nhanh hơn nhiều.\"", a: "Kết quả không đo được", why: "\"Nhanh hơn nhiều\" không đo được; câu này còn thiếu cả cách phát hiện và phương án khác." },
  { q: "\"Chúng em họp, chúng em thống nhất, chúng em sửa và deploy.\"", a: "Không rõ phần của em", why: "Interviewer đánh giá bạn. Nói rõ phần em làm, ghi nhận phần người khác." },
  { q: "\"Em bật log SQL, đếm 1 + N câu, rồi dùng JOIN FETCH vì nó gom về 1 câu, số câu SQL từ 11 xuống 1.\"", a: "Không có phương án cân nhắc", why: "Không nói vì sao không chọn @EntityGraph hay batch size: câu \"vì sao không chọn cách khác\" sẽ tới ngay." },
  { q: "Một phút kể lịch sử công ty, kiến trúc, từng module, rồi 20 giây cho việc em làm.", a: "Lan man bối cảnh", why: "Situation ít, Action nhiều nhất." },
  { q: "\"Em thử JOIN FETCH, @EntityGraph và batch size; JOIN FETCH bị phân trang trong bộ nhớ nên em chọn batch size, số câu SQL từ 11 xuống 2, và thêm test đếm câu SQL.\"", a: "Ổn", why: "Có điều tra, có phương án, có số đo, có biện pháp chống tái diễn. Chỉ dùng số bạn thật sự đo." },
  { q: "\"Sau khi tối ưu, hệ thống chịu được 1 triệu user.\" (không đo, đoán)", a: "Kết quả không đo được", why: "Bịa hoặc phóng đại số liệu sẽ lộ khi bị hỏi \"đo bằng cách nào\". Không có số thì nói kết quả định tính trung thực." },
];

export function StarCritiqueWidget() {
  return <ChoiceDrill items={ITEMS} choices={FLAWS} summary="STAR: bối cảnh ngắn, việc của em, Action dài nhất có lý do và phương án, Result đo được, cộng bài học." />;
}
