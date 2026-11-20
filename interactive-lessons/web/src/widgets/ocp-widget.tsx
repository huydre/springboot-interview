import { ChangeImpact } from "../components/change-impact";

/** OCP: an if/else chain on a type tag vs a Discount interface. Results (900000, 800000, 950000, "unknown STUDENT") come from a JDK 21 run. */
export function OcpWidget() {
  return (
    <ChangeImpact
      variants={[
        {
          label: "if / else theo loại",
          code: `static long discount(String type, long price) {
  if (type.equals("SEASONAL")) return price * 90 / 100;
  else if (type.equals("VIP")) return price * 80 / 100;
  else throw new IllegalArgumentException("unknown " + type);
}`,
          scenarios: [
            { ask: "discount(\"SEASONAL\", 1.000.000)", outcome: [{ text: "Kết quả: **900000**.", kind: "ok" }] },
            { ask: "Thêm loại STUDENT giảm 5%", outcome: [{ text: "Hiện tại: `IllegalArgumentException: unknown STUDENT`.", kind: "err" }, { text: "Phải **mở và sửa** hàm cũ để thêm một nhánh `else if`, rồi chạy lại mọi test của các loại khác.", kind: "err" }, { text: "Mỗi loại mới thêm một nhánh, hàm càng dài càng dễ sửa nhầm.", kind: "err" }] },
          ],
          verdict: "Mỗi loại giảm giá mới buộc sửa code đang chạy tốt: không còn \"đóng\" với sửa đổi.",
        },
        {
          label: "interface Discount",
          code: `interface Discount { long apply(long price); }
class Seasonal implements Discount { public long apply(long p) { return p * 90 / 100; } }
class Vip      implements Discount { public long apply(long p) { return p * 80 / 100; } }
static long checkout(long price, Discount d) { return d.apply(price); }`,
          scenarios: [
            { ask: "checkout(1.000.000, new Seasonal())", outcome: [{ text: "Kết quả: **900000** (new Vip() ra 800000).", kind: "ok" }] },
            { ask: "Thêm loại STUDENT giảm 5%", outcome: [{ text: "Viết thêm class `Student implements Discount`.", kind: "ok" }, { text: "`checkout()`, `Seasonal`, `Vip` **không bị sửa dòng nào**.", kind: "ok" }, { text: "Chạy thật: `checkout(1000000, new Student())` ra **950000**.", kind: "ok" }] },
          ],
          verdict: "Mở cho việc mở rộng (thêm class), đóng với việc sửa đổi (không đụng code cũ).",
        },
      ]}
    />
  );
}
