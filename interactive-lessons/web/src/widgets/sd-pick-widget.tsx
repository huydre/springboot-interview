import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Pick the building block for each situation (study note 10.01). */
const ITEMS: ChoiceItem[] = [
  { q: "Gửi email xác nhận đơn, mất vài email cũng chấp nhận được", choices: ["@Async", "Message queue"], a: "@Async", why: "Việc phụ trong cùng JVM. App crash thì mất, không retry sẵn." },
  { q: "Trừ kho ở service khác, không được mất", choices: ["@Async", "Message queue"], a: "Message queue", why: "Message bền vững ngoài app, có retry. Consumer phải idempotent vì at-least-once." },
  { q: "Số dư tài khoản khi mạng giữa các node bị đứt", choices: ["CP", "AP"], a: "CP", why: "Thà báo lỗi còn hơn trả số dư sai." },
  { q: "Số lượt xem bài viết", choices: ["CP", "AP"], a: "AP", why: "Cũ vài giây không sao, quan trọng là luôn trả lời." },
  { q: "Bảo vệ API khỏi client gửi quá nhiều", choices: ["Rate limiting", "Circuit breaker"], a: "Rate limiting", why: "Đặt ở phía nhận, trả 429 kèm Retry-After, đếm trên Redis khi nhiều instance." },
  { q: "Payment-service chậm đang kéo cạn thread Tomcat của order-service", choices: ["Rate limiting", "Circuit breaker"], a: "Circuit breaker", why: "Đặt ở phía gọi, ngắt mạch để trả lỗi ngay." },
  { q: "Shard key cho bảng orders", choices: ["order_id", "customer_id", "created_at"], a: "customer_id", why: "\"Đơn của tôi\" chỉ chạm 1 shard. created_at tạo hot shard, order_id buộc hỏi mọi shard." },
  { q: "Danh mục cấu hình rất nóng, gần như không đổi", choices: ["Caffeine", "Redis"], a: "Caffeine", why: "Trong JVM, không tốn network; chấp nhận mỗi instance một bản." },
  { q: "User vừa đặt hàng, trang \"đơn của tôi\" không thấy đơn", choices: ["Thiếu index", "Replication lag"], a: "Replication lag", why: "Read-your-own-writes: đọc ngay sau khi ghi thì đọc primary." },
  { q: "Ghi DB và publish Kafka không được lệch nhau", choices: ["AFTER_COMMIT", "Outbox", "2PC"], a: "Outbox", why: "Ghi event vào bảng outbox cùng transaction, relay gửi đi. AFTER_COMMIT mất event khi app chết ngay sau commit; 2PC chậm và dễ treo." },
  { q: "Đặt hàng qua 3 service: order, inventory, payment", choices: ["Một @Transactional", "Saga", "2PC"], a: "Saga", why: "Chuỗi local transaction, mỗi bước có hành động bù. Bước không bù được đặt cuối." },
];

export function SdPickWidget() {
  return <ChoiceDrill items={ITEMS} summary="Không có lựa chọn đúng cho mọi thứ: mỗi chức năng tự chọn, và câu trả lời tốt luôn kèm cái giá phải trả." />;
}
