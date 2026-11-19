import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Where the checkout design in study note 10.02 stops each failure. */
const ITEMS: ChoiceItem[] = [
  { q: "Hai người cùng mua món cuối cùng", choices: ["UPDATE ... WHERE stock >= :qty", "@Cacheable số tồn kho", "Kiểm tra stock trong Java"], a: "UPDATE ... WHERE stock >= :qty", why: "Một câu SQL vừa kiểm tra vừa trừ, DB khoá dòng; 0 dòng là hết hàng. CHECK (stock >= 0) là lưới an toàn cuối." },
  { q: "User bấm Đặt hàng hai lần", choices: ["Idempotency-Key + unique constraint", "Disable nút trên UI là đủ", "@Version"], a: "Idempotency-Key + unique constraint", why: "Key đã có thì trả lại đơn cũ. Hai request đồng thời: unique bắt một bên, bên thua đọc lại đơn trong transaction mới." },
  { q: "Webhook thanh toán tới hai lần", choices: ["provider_txn_id unique + UPDATE có điều kiện trạng thái", "Xử lý cả hai", "Rate limit webhook"], a: "provider_txn_id unique + UPDATE có điều kiện trạng thái", why: "UPDATE orders SET status = 'PAID' WHERE id = ? AND status = 'PENDING_PAYMENT': 0 dòng là đã xử lý." },
  { q: "Webhook PAID tới sau khi job đã huỷ đơn quá hạn", choices: ["Đơn thành PAID", "UPDATE trả 0 dòng, cần hoàn tiền hoặc đối soát", "Tạo đơn mới"], a: "UPDATE trả 0 dòng, cần hoàn tiền hoặc đối soát", why: "Chuyển trạng thái có điều kiện nên không ghi đè CANCELLED; tiền đã thu thì xử lý bằng hoàn tiền." },
  { q: "Hai đơn trừ cùng hai sản phẩm theo thứ tự ngược nhau", choices: ["Trừ theo productId tăng dần", "Tăng timeout", "SERIALIZABLE"], a: "Trừ theo productId tăng dần", why: "Cùng thứ tự khoá thì không vòng chờ nhau, tránh deadlock." },
  { q: "Gọi payment provider mất 3 giây", choices: ["Gọi sau khi commit giữ kho", "Gọi trong @Transactional"], a: "Gọi sau khi commit giữ kho", why: "Gọi mạng trong transaction giữ connection và lock. Gửi orderId làm idempotency key cho provider." },
  { q: "Webhook không bao giờ tới", choices: ["Job đối soát hỏi provider", "Chờ mãi"], a: "Job đối soát hỏi provider", why: "Kèm job huỷ đơn PENDING quá expires_at và cộng lại kho, cũng bằng UPDATE có điều kiện." },
  { q: "Giá sản phẩm đổi sau khi user cho vào giỏ", choices: ["Server đọc giá từ DB, lưu snapshot vào order_item", "Dùng giá client gửi"], a: "Server đọc giá từ DB, lưu snapshot vào order_item", why: "Không tin giá từ client; đơn cũ giữ giá lúc mua." },
  { q: "Đơn sang PAID, cần gửi email và báo giao hàng", choices: ["Outbox cùng transaction, relay lên Kafka", "Gọi REST từng service trong transaction"], a: "Outbox cùng transaction, relay lên Kafka", why: "Saga dạng choreography; consumer idempotent theo eventId." },
];

export function CheckoutGuardWidget() {
  return <ChoiceDrill items={ITEMS} summary="Thông lượng của checkout không lớn; vấn đề thật là hot row tồn kho và tính đúng đắn: oversell, đơn trùng, trừ tiền trùng." />;
}
