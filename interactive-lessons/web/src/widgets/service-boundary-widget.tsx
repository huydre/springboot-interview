import { YesNoDrill, type DrillItem } from "../components/yes-no-drill";

/** Situations from a team splitting an order system; each one is either a sound boundary or a distributed-monolith smell. */
const ITEMS: DrillItem[] = [
  { q: "order-service và inventory-service cùng đọc ghi một schema PostgreSQL", ok: false, why: "Đổi một cột của bảng products là có thể làm hỏng order-service. Hai service không deploy độc lập được." },
  { q: "Thêm field giảm giá phải deploy cùng lúc order, payment, invoice", ok: false, why: "Deploy chung là dấu hiệu rõ nhất của distributed monolith. Thường do ranh giới vẽ sai hoặc dùng chung DTO." },
  { q: "notification-service nghe event OrderPaid và tự lưu email của khách", ok: true, why: "Lưu bản sao dữ liệu mình cần, cập nhật qua event: service khác chết cũng không ảnh hưởng việc gửi mail." },
  { q: "Tách service \"validation\" để mọi service gọi sang kiểm tra dữ liệu", ok: false, why: "Chia theo tầng kỹ thuật: mỗi request thêm một lời gọi mạng, và mọi tính năng đều đụng tới service này." },
  { q: "Thư viện common chứa entity JPA dùng chung cho 6 service", ok: false, why: "Đổi entity là phải build lại cả 6. Thư viện chung chỉ nên chứa thứ ổn định như tiện ích log, không chứa model nghiệp vụ." },
  { q: "payment-service có team riêng, release 10 lần một ngày, scale riêng dịp sale", ok: true, why: "Đúng lý do để tách: team độc lập, nhịp release khác, nhu cầu scale khác." },
  { q: "Team 3 người, sản phẩm mới, domain còn đổi hằng tuần, tách sẵn 8 service", ok: false, why: "Ranh giới sẽ đổi liên tục và mỗi lần đổi là sửa API giữa các service. Nên bắt đầu bằng modular monolith." },
  { q: "report-service đọc từ read model dựng từ event của order và payment", ok: true, why: "CQRS: chấp nhận trễ vài giây để không join xuyên database của service khác." },
];

export function ServiceBoundaryWidget() {
  return (
    <YesNoDrill
      prompt="Mỗi tình huống là ranh giới service hợp lý hay dấu hiệu distributed monolith?"
      items={ITEMS}
      yes="hợp lý"
      no="distributed monolith"
      summary="Câu hỏi kiểm tra: service này có đổi, deploy và scale một mình được không? Không được thì ranh giới chưa đúng."
    />
  );
}
