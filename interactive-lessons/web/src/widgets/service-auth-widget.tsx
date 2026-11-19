import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Pick the identity or config mechanism for each situation between services. */
const ITEMS: ChoiceItem[] = [
  { q: "Người dùng xem đơn của mình; order-service gọi payment-service để lấy trạng thái thanh toán", choices: ["Chuyển tiếp token của user", "Client credentials"], a: "Chuyển tiếp token của user", why: "payment-service cần biết ai đang hỏi để chỉ trả dữ liệu của chính người đó." },
  { q: "Consumer Kafka gọi loyalty-service để cộng điểm, không có request nào của user", choices: ["Chuyển tiếp token của user", "Client credentials"], a: "Client credentials", why: "Không có user đang đăng nhập. Token của service, scope chỉ đủ để cộng điểm." },
  { q: "Mã hoá và xác thực mọi kết nối trong cụm mà không sửa code", choices: ["mTLS qua service mesh", "API key trong header"], a: "mTLS qua service mesh", why: "Sidecar tự cấp và xoay vòng chứng chỉ. API key chung lộ một chỗ là lộ tất cả." },
  { q: "Mật khẩu database của 12 service", choices: ["Repo config Git", "Vault hoặc Kubernetes Secret"], a: "Vault hoặc Kubernetes Secret", why: "Repo config ai cũng đọc được lịch sử. Secret cần phân quyền, xoay vòng và audit." },
  { q: "Đổi ngưỡng timeout cho 20 instance mà không restart", choices: ["@RefreshScope + Spring Cloud Bus", "Sửa application.yml rồi build lại"], a: "@RefreshScope + Spring Cloud Bus", why: "Bus phát sự kiện refresh tới mọi instance. Lưu ý chỉ bean @RefreshScope mới đọc lại giá trị mới." },
  { q: "Client ngoài gửi request vào hệ thống", choices: ["Qua API Gateway", "Gọi thẳng từng service"], a: "Qua API Gateway", why: "Một cửa vào cho xác thực, rate limit và CORS. Service vẫn tự kiểm tra JWT phía sau." },
];

export function ServiceAuthWidget() {
  return <ChoiceDrill items={ITEMS} summary="Có user đang gọi thì chuyển tiếp token của user; service tự gọi thì dùng danh tính của chính service. Secret không nằm trong repo config." />;
}
