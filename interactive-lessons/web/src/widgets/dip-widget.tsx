import { ChangeImpact } from "../components/change-impact";

function Node({ children, tone }: { children: React.ReactNode; tone?: "warn" | "iface" | "ok" }) {
  return <span className={`dep-node ${tone ?? ""}`}>{children}</span>;
}
function Arrow({ label, dashed, back }: { label?: string; dashed?: boolean; back?: boolean }) {
  return <span className={`dep-arrow${dashed ? " dashed" : ""}${back ? " back" : ""}`}>{label && <small>{label}</small>}</span>;
}

/** DIP: OrderService creating its own MySQL repository vs receiving an OrderRepository. Output from a JDK 21 run. */
export function DipWidget() {
  return (
    <ChangeImpact
      variants={[
        {
          label: "Cách 1: service tự new MySQL",
          extra: (
            <div className="dep-diagram">
              <Node>OrderService</Node>
              <Arrow label="dùng trực tiếp" />
              <Node tone="warn">MySqlOrderRepository</Node>
            </div>
          ),
          code: `class OrderService {
  private final MySqlOrderRepository repo = new MySqlOrderRepository();   // tự tạo, dính chặt MySQL
  void place(String order) { repo.save(order); }
}`,
          scenarios: [
            { ask: "Đổi sang PostgreSQL", outcome: [{ text: "Phải mở và sửa **chính `OrderService`**, dù logic đặt hàng không đổi.", kind: "err" }] },
            { ask: "Viết unit test", outcome: [{ text: "Không thay được bằng bản giả: test phải có **MySQL thật** đang chạy.", kind: "err" }] },
          ],
          verdict: "Service biết rõ MySQL, nên đổi database hay viết test đều phải đụng vào service.",
        },
        {
          label: "Cách 2: nhận interface qua constructor",
          extra: (
            <div className="dep-diagram">
              <Node>OrderService</Node>
              <Arrow label="chỉ biết" />
              <Node tone="iface"><small>«interface»</small>OrderRepository</Node>
              <div className="dep-col">
                <div className="dep-row"><Arrow back dashed label="implements" /><Node tone="ok">MySqlOrderRepository</Node></div>
                <div className="dep-row"><Arrow back dashed label="implements" /><Node tone="ok">FakeOrderRepository</Node></div>
              </div>
            </div>
          ),
          code: `interface OrderRepository { void save(String order); }
class OrderService {
  private final OrderRepository repo;
  OrderService(OrderRepository repo) { this.repo = repo; }   // bên ngoài đưa vào
  void place(String order) { repo.save(order); }
}`,
          scenarios: [
            { ask: "Đổi sang PostgreSQL", outcome: [{ text: "Viết thêm `PostgresOrderRepository` rồi đổi chỗ nối (trong Spring: một `@Bean`).", kind: "ok" }, { text: "`OrderService` **không đổi dòng nào**.", kind: "ok" }] },
            { ask: "Viết unit test", outcome: [{ text: "Truyền `FakeOrderRepository`: chạy thật ra `fake saved: [order-2]`, **không cần database**.", kind: "ok" }] },
          ],
          verdict: "Service chỉ biết interface. Database thật hay giả đều cắm vào sau, service không phải sửa.",
        },
      ]}
    />
  );
}
