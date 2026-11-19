import { YesNoDrill, type DrillItem } from "../components/yes-no-drill";

/** Leftmost-prefix drill on index (a, b, c). Answers follow B+Tree ordering: a first, then b within a, then c. */
const ITEMS: DrillItem[] = [
  { q: "where a = ?", ok: true, why: "Cột đầu tiên: đi thẳng vào index." },
  { q: "where a = ? and b = ?", ok: true, why: "Hai cột đầu liên tiếp." },
  { q: "where b = ? and a = ?", ok: true, why: "Thứ tự viết trong WHERE không quan trọng, chỉ cần có a." },
  { q: "where b = ?", ok: false, why: "Thiếu a: b chỉ có thứ tự bên trong từng giá trị a, phải lật cả index." },
  { q: "where a = ? order by b", ok: true, why: "Trong cùng a, b đã sắp sẵn: không cần Sort." },
  { q: "where c = ?", ok: false, why: "Thiếu a và b." },
  { q: "where a = ? and c = ?", ok: true, why: "Đi vào index theo a; c chỉ được lọc trong phạm vi đó vì thiếu b ở giữa." },
  { q: "where a = ? and b > ? and c = ?", ok: true, why: "a và b dùng để đi trong index; sau một điều kiện range, c chỉ còn là lọc." },
];

export function LeftmostPrefixWidget() {
  return (
    <YesNoDrill
      prompt={<>Có index <code>(a, b, c)</code>. Query nào dùng được index?</>}
      items={ITEMS}
      yes="dùng được"
      no="không"
      summary="Quy tắc: cột so sánh bằng đặt trước, cột range hoặc ORDER BY đặt sau. Index (a, b) đã thay được index (a) riêng."
    />
  );
}
