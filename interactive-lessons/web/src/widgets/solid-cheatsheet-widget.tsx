import { CheatSheet, type CheatRow } from "../components/cheat-sheet";

const ROWS: CheatRow[] = [
  { name: "SRP", one: "Một class chỉ có một lý do để thay đổi (một người yêu cầu).", say: "Em đếm xem có bao nhiêu bên khác nhau cùng yêu cầu sửa class đó. Tính giá, gửi email và lưu DB trong một class là dấu hiệu đỏ." },
  { name: "OCP", one: "Thêm hành vi mới bằng class mới, không sửa code đang chạy.", say: "If/else hay switch theo loại mà cứ dài ra thì em tách thành Strategy. Nhưng em chờ tới lần thứ ba mới tách (Rule of Three)." },
  { name: "LSP", one: "Class con thay được class cha mà code dùng cha không sai.", say: "Override mà ném UnsupportedOperationException hay phải instanceof trước khi dùng là vi phạm LSP." },
  { name: "ISP", one: "Client không bị ép phụ thuộc method nó không dùng.", say: "Em tách interface theo vai trò, không theo từng method, để tránh bùng nổ interface." },
  { name: "DIP", one: "Module cấp cao và thấp cùng phụ thuộc abstraction.", say: "Service nhận interface qua constructor, không new class cụ thể bên trong, nên đổi database hay viết test đều không sửa service." },
  { name: "DIP vs DI vs IoC", one: "Nguyên tắc, kỹ thuật, và framework.", say: "DIP là nguyên tắc thiết kế. DI là kỹ thuật tiêm dependency để đạt DIP. IoC là việc container như Spring giữ quyền tạo và nối các object." },
  { name: "DRY, KISS, YAGNI", one: "Đừng lặp tri thức, đừng phức tạp, đừng làm trước khi cần.", say: "Mỗi nguyên tắc cũng có mặt trái: gộp code chỉ trùng ngẫu nhiên là sai DRY, và mở rộng cho tương lai chưa chắc có là vi phạm YAGNI." },
  { name: "Cẩn thận over-engineering", one: "Nguyên tắc là kinh nghiệm, không phải luật.", say: "Em áp dụng khi thấy dấu hiệu thật, ví dụ đã đổi hai lần, chứ không tạo interface cho mọi class ngay từ đầu." },
];

/** SOLID cheat sheet with the sentence to say in an interview for each row. */
export function SolidCheatsheetWidget() {
  return <CheatSheet rows={ROWS} />;
}
