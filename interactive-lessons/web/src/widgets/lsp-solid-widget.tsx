import { ChangeImpact } from "../components/change-impact";

/** LSP on the JDK-style trap: a "read-only" subclass of ArrayList that throws from add(). Output from a JDK 21 run. */
export function LspSolidWidget() {
  return (
    <ChangeImpact
      variants={[
        {
          label: "ReadOnlyList extends ArrayList",
          code: `class ReadOnlyList<E> extends ArrayList<E> {
  @Override public boolean add(E e) { throw new UnsupportedOperationException("read-only"); }
}
static void addDefaults(List<String> list) { list.add("a"); list.add("b"); }`,
          scenarios: [
            { ask: "addDefaults(new ArrayList<>())", outcome: [{ text: "Chạy tốt: in `ArrayList ok`.", kind: "ok" }] },
            { ask: "addDefaults(new ReadOnlyList<>())", outcome: [{ text: "Nổ lúc chạy: `UnsupportedOperationException: read-only`.", kind: "err" }, { text: "`addDefaults` đúng với mọi `List`, nhưng class con làm nó sai: vi phạm LSP.", kind: "err" }] },
          ],
          verdict: "Dấu hiệu nhận ra: override ném `UnsupportedOperationException`, hoặc phải `instanceof` trước khi dùng.",
        },
        {
          label: "Tách kiểu chỉ đọc",
          code: `interface ReadableList<E> { E get(int i); int size(); }
class ReadOnlyList<E> implements ReadableList<E> { ... }   // không có add()
static void addDefaults(List<String> list) { ... }          // chỉ nhận List ghi được`,
          scenarios: [
            { ask: "addDefaults(new ArrayList<>())", outcome: [{ text: "Chạy tốt như trước.", kind: "ok" }] },
            { ask: "addDefaults(new ReadOnlyList<>())", outcome: [{ text: "Không biên dịch được: `ReadOnlyList` không phải `List`.", kind: "ok" }, { text: "Lỗi lộ ra ngay lúc compile thay vì nổ ở production.", kind: "ok" }] },
          ],
          verdict: "Kiểu chỉ đọc không còn \"giả làm\" kiểu ghi được. Trade-off thật: JDK (`Collections.unmodifiableList`) chọn cách đầu từ Java 1.2 vì tiện, đổi lại phải ném lỗi lúc chạy.",
        },
      ]}
    />
  );
}
