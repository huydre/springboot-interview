import { CheatSheet, type CheatRow } from "../components/cheat-sheet";

const ROWS: CheatRow[] = [
  { name: "Encapsulation", one: "Giấu dữ liệu, chỉ mở hành động có kiểm tra quy tắc.", say: "Em không sinh getter/setter cho mọi field, em mở các hành động nghiệp vụ như withdraw() để quy tắc nằm ở một chỗ." },
  { name: "Abstraction", one: "Chỉ lộ ra làm được gì, giấu làm thế nào.", say: "Service phụ thuộc interface, đổi implementation không phải sửa service." },
  { name: "Inheritance", one: "Tái sử dụng theo quan hệ là một (is-a).", say: "Em ưu tiên composition, chỉ kế thừa khi đúng is-a và class cha được thiết kế để kế thừa." },
  { name: "Polymorphism", one: "Cùng lời gọi, hành vi tuỳ object thật.", say: "Override chọn lúc chạy theo object thật, overload chọn lúc biên dịch theo kiểu khai báo." },
  { name: "Tell, Don't Ask", one: "Bảo object làm, đừng hỏi dữ liệu rồi tự quyết.", say: "Quy tắc nằm cùng dữ liệu nên người viết sau không thể quên kiểm tra." },
  { name: "Liskov (LSP)", one: "Class con thay được class cha mà code dùng cha không sai.", say: "Square extends Rectangle vi phạm LSP vì setWidth làm đổi cả chiều cao." },
  { name: "Strategy", one: "Đa hình bằng cách giữ một interface trong field.", say: "Thêm kiểu tính phí chỉ là thêm một class, không phải thêm nhánh if hay lớp con của Order." },
];

/** Cheat sheet: click a row to reveal the sentence to say in an interview. */
export function OopCheatsheetWidget() {
  return <CheatSheet rows={ROWS} />;
}
