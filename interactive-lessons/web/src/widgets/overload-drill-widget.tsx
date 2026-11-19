import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const CHOICES = ["Overriding", "Overloading"] as const;

/** Classify each description; the last two are the usual mix-ups (a "speak(String)" that is not an override). Outputs checked on JDK 21. */
const ITEMS: ChoiceItem[] = [
  { q: "Dog viết lại `speak()` của Animal, cùng tên, cùng danh sách tham số", a: "Overriding", why: "Class con thay thế method của cha. Java chọn bản nào lúc chạy, theo object thật." },
  { q: "Một class có `print(int x)` và `print(String s)`: cùng tên, tham số khác kiểu", a: "Overloading", why: "Nạp thêm nhiều bản cùng tên. Compiler chọn bản theo kiểu của đối số: print(1) vào print(int), print(\"hi\") vào print(String)." },
  { q: "Cần có quan hệ cha con (extends) giữa hai class", a: "Overriding", why: "Override là con ghi đè cha. Overloading xảy ra ngay trong một class, không cần kế thừa." },
  { q: "Được chọn lúc biên dịch, theo kiểu khai báo của đối số", a: "Overloading", why: "Compiler quyết định từ trước khi chương trình chạy." },
  { q: "Được chọn lúc chạy, theo object thật bên dưới", a: "Overriding", why: "Đây chính là đa hình: cùng một lời gọi, object khác nhau thì kết quả khác nhau." },
  { q: "Animal có `speak()`. Parrot viết thêm `speak(String word)`", a: "Overloading", why: "Tham số khác nên đây là method mới cùng tên, không phải override. Chạy thật: `Animal p = new Parrot(); p.speak();` vẫn in \"Animal: ...\". Thêm @Override vào là báo lỗi ngay." },
  { q: "Đặt `@Override` lên method để compiler kiểm tra giúp", a: "Overriding", why: "@Override chỉ dùng cho override. Nếu bạn gõ sai tên hoặc sai tham số, compiler báo lỗi thay vì âm thầm tạo method mới." },
];

export function OverloadDrillWidget() {
  return <ChoiceDrill items={ITEMS} choices={CHOICES} summary="Mẹo nhớ: Overriding là con ghi đè cha, cùng tên cùng tham số, chọn lúc chạy. Overloading là cùng tên nhưng khác tham số, chọn lúc biên dịch." />;
}
