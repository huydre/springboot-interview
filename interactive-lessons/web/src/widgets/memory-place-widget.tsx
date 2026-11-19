import { useState } from "react";

const AREAS = ["Stack", "Heap", "Metaspace"] as const;
type Area = (typeof AREAS)[number];

/** Where does each piece of placeOrder() live? Follows the lesson's memory map (String pool is on the heap since Java 7). */
const ITEMS: { what: string; answer: Area; why: string }[] = [
  { what: "int quantity = 2 (biến local primitive)", answer: "Stack", why: "nằm ngay trong frame của placeOrder()" },
  { what: "biến order (tham chiếu)", answer: "Stack", why: "chỉ là tham chiếu, nằm trong frame" },
  { what: 'object new Order("O1")', answer: "Heap", why: "mọi object đều ở heap" },
  { what: 'object new Item("book")', answer: "Heap", why: "object Order giữ tham chiếu tới nó, cả hai ở heap" },
  { what: "thông tin class Order: tên, method, bytecode", answer: "Metaspace", why: "metadata của class, nằm ở native memory" },
  { what: 'chuỗi literal "O1" trong String pool', answer: "Heap", why: "String pool nằm trong heap từ Java 7" },
  { what: "tham số id của method findById(long id)", answer: "Stack", why: "tham số cũng là biến local của frame" },
];

export function MemoryPlaceWidget() {
  const [picked, setPicked] = useState<Record<number, Area>>({});
  const score = ITEMS.filter((it, i) => picked[i] === it.answer).length;
  return (
    <div className="widget">
      <ul className="classify">
        {ITEMS.map((it, i) => {
          const p = picked[i];
          return (
            <li key={it.what} className={p ? (p === it.answer ? "ok" : "no") : ""}>
              <span>{it.what}</span>
              <div className="seg small">
                {AREAS.map((a) => <button key={a} className={p === a ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: a }))}>{a}</button>)}
              </div>
              {p && <span className="why">{p === it.answer ? `✓ ${it.why}` : `✕ ở ${it.answer}: ${it.why}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{ITEMS.length}</span></div>
    </div>
  );
}
