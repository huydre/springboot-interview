import { useState } from "react";

/** ConcurrentHashMap pitfalls; every result was run on JDK 21 (8 threads unless stated). */
const CASES: { label: string; code: string; out: string; tone: "good" | "bad" | "warn"; why: string }[] = [
  { label: "get + put", code: 'Integer v = map.get("k");\nmap.put("k", v == null ? 1 : v + 1);   // 8 thread × 10.000', out: "sai 20/20 lần (ví dụ 24610 thay vì 80.000)", tone: "bad", why: "Từng method an toàn, nhưng chuỗi get rồi put là check-then-act: thread khác chen vào giữa." },
  { label: "merge", code: 'map.merge("k", 1, Integer::sum);', out: "đúng 20/20 lần: 80.000", tone: "good", why: "Đọc-sửa-ghi trong một thao tác nguyên tử." },
  { label: "containsKey + put", code: 'if (!cache.containsKey("cfg")) { load(); cache.put("cfg", v); }', out: "hàm nạp chạy 8 lần", tone: "bad", why: "8 thread cùng thấy chưa có key, cùng nạp." },
  { label: "computeIfAbsent", code: 'cache.computeIfAbsent("cfg", k -> load());', out: "hàm nạp chạy 1 lần", tone: "good", why: "Hàm chạy khi giữ lock bucket: phải ngắn, không gọi DB lâu, không sửa chính map." },
  { label: "null", code: 'chm.put("k", null);\nchm.put(null, "v");', out: "NullPointerException (cả hai)", tone: "warn", why: "Trong môi trường đồng thời, get() trả null không phân biệt được \"không có key\" với \"value null\"." },
  { label: "sửa lúc duyệt", code: "for (Integer k : map.keySet()) map.put(k + 10, 0);", out: "HashMap: ConcurrentModificationException · CHM: không lỗi, duyệt 6 phần tử", tone: "warn", why: "Iterator của CHM weakly consistent: có thể thấy hoặc không thấy phần tử mới (lần đo này thấy cả 3)." },
];

export function ChmTrapWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.code}</pre>
      <div className={`result ${c.tone}`}>
        {c.out}
        <small>{c.why}</small>
      </div>
    </div>
  );
}
