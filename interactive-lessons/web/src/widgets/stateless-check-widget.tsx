import { YesNoDrill, type DrillItem } from "../components/yes-no-drill";

/** What still works after scaling one instance out to three behind a load balancer (study note 10.01, section 1). */
const ITEMS: DrillItem[] = [
  { q: "Giỏ hàng lưu trong HttpSession", ok: false, why: "Request sau có thể vào instance khác. Đưa session ra Redis (Spring Session) hoặc lưu giỏ theo userId." },
  { q: "ConcurrentHashMap trong bean singleton làm cache sản phẩm", ok: false, why: "Mỗi instance một bản; evict ở instance này, instance kia vẫn giữ giá trị cũ." },
  { q: "@Scheduled gửi email nhắc thanh toán mỗi giờ", ok: false, why: "Chạy trên cả 3 instance: gửi 3 lần. Dùng distributed lock như ShedLock hoặc tách job." },
  { q: "File upload lưu ổ đĩa local của instance", ok: false, why: "Instance khác không đọc được. Lưu lên object storage (S3, MinIO)." },
  { q: "Xác thực bằng JWT, mỗi request tự mang token", ok: true, why: "Instance nào cũng verify được token: stateless." },
  { q: "Bộ đếm rate limit INCR trên Redis", ok: true, why: "Đếm ở chỗ dùng chung nên giới hạn không bị nhân lên theo số instance." },
  { q: "Danh sách tỉnh thành trong Caffeine, đổi vài lần một năm", ok: true, why: "Mỗi instance một bản là chấp nhận được vì dữ liệu gần như không đổi." },
];

export function StatelessCheckWidget() {
  return (
    <YesNoDrill
      prompt="Scale từ 1 lên 3 instance sau load balancer. Cái nào vẫn đúng?"
      items={ITEMS}
      yes="vẫn đúng"
      no="hỏng"
      summary="Stateless: server không giữ trạng thái client giữa các request, state dùng chung đẩy ra Redis hoặc DB. Sticky session chỉ là chữa cháy."
    />
  );
}
