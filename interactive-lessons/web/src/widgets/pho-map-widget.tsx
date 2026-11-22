import { useState } from "react";
import { Code } from "../components/code-block";

/**
 * A pho shop price list as a Map<String, Integer>, run one step at a time. Every output line was printed by the same
 * program on JDK 21 (HashMap print order included); the table shows the map after each step.
 */
type Step = { code: string; out: string; state: [string, number][]; changed?: string[]; note: string };

const STEPS: Step[] = [
  {
    code: 'Map<String, Integer> gia = new HashMap<>();\ngia.put("Tái", 20000);\ngia.put("Tái Nạm", 25000);\ngia.put("Gà", 15000);\nSystem.out.println(gia);',
    out: "{Gà=15000, Tái=20000, Tái Nạm=25000}",
    state: [["Gà", 15000], ["Tái", 20000], ["Tái Nạm", 25000]],
    changed: ["Gà", "Tái", "Tái Nạm"],
    note: "Thêm Tái, Tái Nạm, Gà, nhưng in ra Gà đứng đầu. HashMap không giữ thứ tự thêm vào: thứ tự phụ thuộc bucket mà hash của key rơi vào (Phần 2).",
  },
  {
    code: 'gia.get("Tái Nạm");\ngia.get("Bò Viên");\ngia.getOrDefault("Bò Viên", 0);',
    out: "25000\nnull\n0",
    state: [["Gà", 15000], ["Tái", 20000], ["Tái Nạm", 25000]],
    note: "Key không có thì get() trả về null, không ném lỗi. Gán thẳng null đó vào biến int là NullPointerException, nên dùng getOrDefault khi muốn có giá trị mặc định.",
  },
  {
    code: 'gia.containsKey("Gà");\ngia.containsValue(15000);',
    out: "true\ntrue",
    state: [["Gà", 15000], ["Tái", 20000], ["Tái Nạm", 25000]],
    note: "containsKey nhanh vì nhảy thẳng tới bucket. containsValue phải duyệt mọi entry, vì value không được băm.",
  },
  {
    code: 'gia.put("Gà", 13000);   // trả về giá trị cũ',
    out: "15000\n{Gà=13000, Tái=20000, Tái Nạm=25000}",
    state: [["Gà", 13000], ["Tái", 20000], ["Tái Nạm", 25000]],
    changed: ["Gà"],
    note: "Key đã có thì put ghi đè value và trả về value cũ. Một key chỉ có đúng một value.",
  },
  {
    code: 'gia.replace("Tái Chín", 21000);',
    out: "null\n{Gà=13000, Tái=20000, Tái Nạm=25000}",
    state: [["Gà", 13000], ["Tái", 20000], ["Tái Nạm", 25000]],
    note: "replace chỉ sửa khi key đã tồn tại. Quán chưa có Tái Chín nên không có gì thay đổi, khác với put.",
  },
  {
    code: 'gia.putIfAbsent("Tái", 19000);\ngia.putIfAbsent("Đặc Biệt", 50000);',
    out: "20000\nnull\n{Đặc Biệt=50000, Gà=13000, Tái=20000, Tái Nạm=25000}",
    state: [["Đặc Biệt", 50000], ["Gà", 13000], ["Tái", 20000], ["Tái Nạm", 25000]],
    changed: ["Đặc Biệt"],
    note: "putIfAbsent chỉ thêm khi chưa có key: Tái giữ nguyên 20000, Đặc Biệt được thêm mới.",
  },
  {
    code: 'gia.size();\ngia.remove("Gà");   // trả về value vừa xoá\ngia.size();',
    out: "4\n13000\n3",
    state: [["Đặc Biệt", 50000], ["Tái", 20000], ["Tái Nạm", 25000]],
    note: "remove trả về value của key vừa xoá (null nếu không có key đó).",
  },
  {
    code: 'for (Map.Entry<String, Integer> e : gia.entrySet())\n    System.out.println(e.getKey() + " - " + e.getValue());',
    out: "Đặc Biệt - 50000\nTái - 20000\nTái Nạm - 25000",
    state: [["Đặc Biệt", 50000], ["Tái", 20000], ["Tái Nạm", 25000]],
    note: "Cần cả key lẫn value thì duyệt entrySet(). Duyệt keySet() rồi get() từng key là tra map thêm một lần cho mỗi phần tử.",
  },
  {
    code: 'gia.merge("Tái", 2000, Integer::sum);   // tăng giá 2000',
    out: "22000",
    state: [["Đặc Biệt", 50000], ["Tái", 22000], ["Tái Nạm", 25000]],
    changed: ["Tái"],
    note: "merge gộp value mới với value cũ bằng hàm bạn đưa vào; chưa có key thì đặt luôn value mới. Đây là cách đếm tần suất gọn nhất: merge(x, 1, Integer::sum).",
  },
  {
    code: "Map<String, Integer> menu = new TreeMap<>(gia);\nSystem.out.println(menu);",
    out: "{Tái=22000, Tái Nạm=25000, Đặc Biệt=50000}",
    state: [["Tái", 22000], ["Tái Nạm", 25000], ["Đặc Biệt", 50000]],
    note: "Khai báo biến là Map nên đổi sang TreeMap không phải sửa code dùng nó. TreeMap sắp theo key: Đặc Biệt đứng cuối vì chữ Đ có mã Unicode lớn hơn chữ T. Cần giữ đúng thứ tự thêm vào thì dùng LinkedHashMap.",
  },
];

export function PhoMapWidget() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  return (
    <div className="widget pho">
      <div className="pho-top">
        <small>Bước {i + 1} / {STEPS.length}</small>
        <div className="seg small">
          <button onClick={() => setI(0)} disabled={i === 0}>↺ Từ đầu</button>
          <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>‹ Trước</button>
          <button className="on" onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))} disabled={i === STEPS.length - 1}>Chạy dòng tiếp ›</button>
        </div>
      </div>
      <div className="pho-body">
        <div className="pho-code">
          <Code>{s.code}</Code>
          <pre className="pho-out" key={i}>{s.out}</pre>
        </div>
        <table className="pho-table">
          <thead><tr><th>Món (key)</th><th>Giá (value)</th></tr></thead>
          <tbody>
            {s.state.map(([k, v]) => (
              <tr key={k} className={s.changed?.includes(k) ? "changed" : ""}><td>{k}</td><td>{v.toLocaleString("vi-VN")}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pho-note" key={`n${i}`}>{s.note}</p>
    </div>
  );
}
