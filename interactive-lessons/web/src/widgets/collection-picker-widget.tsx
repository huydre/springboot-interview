import { useState } from "react";

/** The quick-choice table from the lesson notes: a need → the collection to reach for, and why. */
const NEEDS = [
  { need: "Danh sách thông thường", pick: "ArrayList", why: "get(i) O(1), thêm cuối O(1) amortized, tận dụng CPU cache" },
  { need: "Loại trùng, không cần thứ tự", pick: "HashSet", why: "add/contains O(1); bên trong là HashMap" },
  { need: "Loại trùng, giữ thứ tự chèn", pick: "LinkedHashSet", why: "HashSet + linked list nối các phần tử" },
  { need: "Loại trùng, luôn sắp xếp / tìm theo khoảng", pick: "TreeSet", why: "red-black tree, O(log n); so trùng bằng compareTo" },
  { need: "Tra cứu key → value", pick: "HashMap", why: "get/put O(1) trung bình" },
  { need: "Key → value giữ thứ tự, hoặc LRU cache", pick: "LinkedHashMap", why: "accessOrder = true + removeEldestEntry" },
  { need: "Key → value sắp xếp, tìm \"gần nhất\"", pick: "TreeMap", why: "floorKey, ceilingKey, headMap: bảng giá theo bậc" },
  { need: "Stack hoặc queue", pick: "ArrayDeque", why: "nhanh hơn Stack (synchronized) và LinkedList; không nhận null" },
  { need: "Luôn lấy phần tử nhỏ/lớn nhất, top-K", pick: "PriorityQueue", why: "binary heap: offer/poll O(log n), peek O(1)" },
  { need: "Nhiều thread cùng truy cập", pick: "ConcurrentHashMap / CopyOnWriteArrayList", why: "thread-safe, iterator không ném CME" },
];

export function CollectionPickerWidget() {
  const [i, setI] = useState(0);
  const n = NEEDS[i];
  return (
    <div className="widget">
      <div className="seg small">
        {NEEDS.map((x, k) => <button key={x.need} className={i === k ? "on" : ""} onClick={() => setI(k)}>{x.need}</button>)}
      </div>
      <div className="result good">
        {n.pick}
        <small>{n.why}</small>
      </div>
    </div>
  );
}
