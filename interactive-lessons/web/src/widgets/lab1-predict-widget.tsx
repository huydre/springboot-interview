import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Predict before running: outputs of the lab 1 solution on JDK 21 (study note 11.01). */
const ITEMS: ChoiceItem[] = [
  { q: "LRU capacity 2: put A, B, containsKey(A), put C. keySet()?", choices: ["[A, C]", "[B, C]"], a: "[B, C]", why: "containsKey không tính là truy cập. Đổi thứ tự: get, getOrDefault, put, putIfAbsent, compute..., merge, replace." },
  { q: "Quên accessOrder = true: put A, B, C, get A, put D. keySet()?", choices: ["[C, A, D]", "[B, C, D]"], a: "[B, C, D]", why: "Cache thành FIFO: get(A) không cứu được A." },
  { q: "BrokenUser chỉ override equals: add 2 user cùng email vào HashSet. size()?", choices: ["1", "2"], a: "2", why: "Hash mặc định khác nhau nên khác bucket, equals không bao giờ được gọi. contains(bản mới) cũng false." },
  { q: "for-each trên [1..6], list.remove(n) với n chẵn", choices: ["[1, 3, 5]", "ConcurrentModificationException"], a: "ConcurrentModificationException", why: "List lúc đó là [1, 3, 4, 5, 6]: fail-fast không rollback, số 2 đã mất." },
  { q: "for-each trên [1, 2, 3, 4], xoá phần tử 3 (áp chót)", choices: ["CME", "Không lỗi, list [1, 2, 4]"], a: "Không lỗi, list [1, 2, 4]", why: "size giảm, hasNext() thành false: số 4 không bao giờ được duyệt. Bug âm thầm." },
  { q: "Point key bị đổi x = 99 sau khi put. get(new Point(1, 2))?", choices: ["\"shop A\"", "null"], a: "null", why: "Đúng bucket cũ nhưng equals so với (99, 2) nên sai. size vẫn 1, containsValue vẫn true." },
];

export function Lab1PredictWidget() {
  return <ChoiceDrill items={ITEMS} summary="Đoán trước rồi mới chạy file: câu nào đoán sai là chỗ cần đọc lại bài lý thuyết tương ứng." />;
}
