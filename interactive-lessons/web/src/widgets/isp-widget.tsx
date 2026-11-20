import { ChangeImpact } from "../components/change-impact";

/** ISP: one fat interface vs small role interfaces. Output from a JDK 21 run. */
export function IspWidget() {
  return (
    <ChangeImpact
      variants={[
        {
          label: "Interface béo",
          code: `interface FatWorker { void work(); void eat(); }
class Robot implements FatWorker {
  public void work() { ... }
  public void eat() { throw new UnsupportedOperationException("robots do not eat"); }
}`,
          scenarios: [
            { ask: "Thêm class Robot", outcome: [{ text: "`Robot` bị ép phải có `eat()` dù không ăn.", kind: "err" }, { text: "Đành ném `UnsupportedOperationException`, nên gọi `Robot.eat()` thì nổ: `robots do not eat`.", kind: "err" }] },
            { ask: "Vòng lặp gọi eat() cho mọi worker", outcome: [{ text: "Compile vẫn qua, nhưng gặp Robot là nổ lúc chạy.", kind: "err" }] },
          ],
          verdict: "Dấu hiệu: có method chỉ để ném `UnsupportedOperationException`. Client bị ép phụ thuộc cái nó không dùng.",
        },
        {
          label: "Interface nhỏ theo vai trò",
          code: `interface Workable { void work(); }
interface Eatable  { void eat(); }
class Robot implements Workable { ... }
class Human implements Workable, Eatable { ... }`,
          scenarios: [
            { ask: "Thêm class Robot", outcome: [{ text: "`Robot implements Workable`, chỉ có đúng `work()`.", kind: "ok" }, { text: "Chạy thật: `robot works`, `human works`, `human eats`.", kind: "ok" }] },
            { ask: "Vòng lặp gọi eat()", outcome: [{ text: "Vòng lặp nhận `List<Eatable>`, nên `Robot` không thể lọt vào: compiler chặn.", kind: "ok" }] },
          ],
          verdict: "Mỗi client chỉ thấy phần nó cần. Nhưng đừng cắt mỗi method thành một interface: tách theo vai trò, không phải theo method.",
        },
      ]}
    />
  );
}
