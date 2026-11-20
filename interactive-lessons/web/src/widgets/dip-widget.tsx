import { ChangeImpact } from "../components/change-impact";

/** DIP: OrderService creating its own MySQL repository vs receiving an OrderRepository. Output from a JDK 21 run. */
export function DipWidget() {
  return (
    <ChangeImpact
      variants={[
        {
          label: "new bên trong service",
          code: `class OrderService {
  private final MySqlOrderRepository repo = new MySqlOrderRepository();   // phụ thuộc cụ thể
  void place(String order) { repo.save(order); }
}`,
          scenarios: [
            { ask: "Đổi sang PostgreSQL", outcome: [{ text: "Phải sửa **chính `OrderService`** (logic nghiệp vụ) chỉ vì đổi database.", kind: "err" }] },
            { ask: "Viết unit test", outcome: [{ text: "Không thay được repository bằng bản giả: test phải có MySQL thật chạy.", kind: "err" }] },
          ],
          verdict: "Tầng nghiệp vụ (cấp cao) bị buộc vào chi tiết hạ tầng (cấp thấp). Chiều phụ thuộc đi từ trên xuống dưới.",
        },
        {
          label: "Nhận interface qua constructor",
          code: `interface OrderRepository { void save(String order); }
class OrderService {
  private final OrderRepository repo;
  OrderService(OrderRepository repo) { this.repo = repo; }   // được tiêm vào
  void place(String order) { repo.save(order); }
}`,
          scenarios: [
            { ask: "Đổi sang PostgreSQL", outcome: [{ text: "Viết `PostgresOrderRepository implements OrderRepository` và đổi chỗ nối (trong Spring: một `@Bean`).", kind: "ok" }, { text: "`OrderService` không đổi dòng nào.", kind: "ok" }] },
            { ask: "Viết unit test", outcome: [{ text: "Truyền `FakeOrderRepository`: chạy thật ra `fake saved: [order-2]`, không cần database.", kind: "ok" }] },
          ],
          verdict: "Cả service lẫn repository cùng phụ thuộc vào interface: chiều phụ thuộc bị \"đảo\" so với kiểu viết đầu.",
        },
      ]}
    />
  );
}
