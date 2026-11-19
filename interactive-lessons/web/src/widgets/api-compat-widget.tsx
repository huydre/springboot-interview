import { YesNoDrill, type DrillItem } from "../components/yes-no-drill";

/** Which API changes keep old clients working (Spring Boot's Jackson ignores unknown properties by default). */
const ITEMS: DrillItem[] = [
  { q: "Thêm field mới vào response", ok: true, why: "Client bỏ qua field lạ. Spring Boot mặc định tắt FAIL_ON_UNKNOWN_PROPERTIES, đừng bật lại." },
  { q: "Thêm endpoint mới", ok: true, why: "Client cũ không gọi tới nó." },
  { q: "Thêm query param tuỳ chọn", ok: true, why: "Không gửi thì dùng giá trị mặc định." },
  { q: "Thêm field bắt buộc vào request", ok: false, why: "Client cũ không gửi nên bị 400." },
  { q: "Đổi tên field totalAmount thành total", ok: false, why: "Client cũ đọc totalAmount ra null." },
  { q: "Đổi id từ số sang chuỗi", ok: false, why: "Client parse kiểu số sẽ lỗi." },
  { q: "Thêm giá trị enum mới REFUNDED", ok: false, why: "Nguy hiểm: client cũ có thể không parse được giá trị lạ. Dặn client có nhánh mặc định." },
];

export function ApiCompatWidget() {
  return (
    <YesNoDrill
      prompt="Mobile app bản cũ vẫn còn người dùng. Thay đổi nào an toàn với client cũ?"
      items={ITEMS}
      yes="an toàn"
      no="phá client cũ"
      summary="Chỉ thêm, không xoá hay đổi nghĩa. Cần đổi thì thêm field mới song song, đánh dấu deprecated, chờ client chuyển rồi mới xoá; breaking thật thì ra v2."
    />
  );
}
