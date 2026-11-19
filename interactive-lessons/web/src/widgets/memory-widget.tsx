import { useState } from "react";

type Frame = { name: string; ref: 1 | 2 };
type State = { line: number; stack: Frame[]; heap: { id: 1 | 2; name: string }[]; out?: string; note: string };

const CODE = [
  'Dog d = new Dog("Milu");',
  "reassign(d);",
  '    d = new Dog("Lu");      // trong reassign',
  "System.out.println(d.name);",
  "rename(d);",
  '    d.name = "Lu";          // trong rename',
  "System.out.println(d.name);",
];

const STEPS: State[] = [
  { line: 0, stack: [{ name: "main: d", ref: 1 }], heap: [{ id: 1, name: "Milu" }], note: "Biến d trong main giữ địa chỉ @1." },
  { line: 1, stack: [{ name: "main: d", ref: 1 }, { name: "reassign: d", ref: 1 }], heap: [{ id: 1, name: "Milu" }], note: "Gọi method: COPY giá trị của d (địa chỉ @1) vào tham số." },
  { line: 2, stack: [{ name: "main: d", ref: 1 }, { name: "reassign: d", ref: 2 }], heap: [{ id: 1, name: "Milu" }, { id: 2, name: "Lu" }], note: "Gán lại tham số: chỉ bản copy đổi sang @2. Biến của main vẫn @1." },
  { line: 3, stack: [{ name: "main: d", ref: 1 }], heap: [{ id: 1, name: "Milu" }, { id: 2, name: "Lu" }], out: "Milu", note: "reassign trả về, tham số biến mất. In ra Milu." },
  { line: 4, stack: [{ name: "main: d", ref: 1 }, { name: "rename: d", ref: 1 }], heap: [{ id: 1, name: "Milu" }, { id: 2, name: "Lu" }], out: "Milu", note: "Lại copy địa chỉ @1 vào tham số của rename." },
  { line: 5, stack: [{ name: "main: d", ref: 1 }, { name: "rename: d", ref: 1 }], heap: [{ id: 1, name: "Lu" }, { id: 2, name: "Lu" }], out: "Milu", note: "Sửa field qua tham số: hai biến cùng trỏ @1, nên object thật đổi tên." },
  { line: 6, stack: [{ name: "main: d", ref: 1 }], heap: [{ id: 1, name: "Lu" }, { id: 2, name: "Lu" }], out: "Milu\nLu", note: "In ra Lu. Thứ được copy là địa chỉ, không phải object." },
];

/** Step-through stack/heap view proving Java is always pass-by-value. */
export function MemoryWidget() {
  const [pos, setPos] = useState(0);
  const s = STEPS[pos];
  return (
    <div className="widget">
      <div className="memory">
        <pre className="code lines">
          {CODE.map((c, i) => <div key={i} className={i === s.line ? "cur" : i < s.line ? "done" : ""}>{c}</div>)}
        </pre>
        <div className="mem-view">
          <div className="col">
            <h5>Stack</h5>
            {s.stack.map((f, i) => <div key={i} className="var-box">{f.name}<span className={`ref r${f.ref}`}>@{f.ref}</span></div>)}
          </div>
          <div className="col">
            <h5>Heap</h5>
            {s.heap.map((o) => <div key={o.id} className={`obj-box r${o.id}`}><span className={`ref r${o.id}`}>@{o.id}</span>Dog name="{o.name}"</div>)}
          </div>
        </div>
      </div>
      <p className="note">{s.note}</p>
      {s.out && <pre className="console">{s.out}</pre>}
      <div className="actions">
        <button className="btn ghost" disabled={pos === 0} onClick={() => setPos(pos - 1)}>Lùi</button>
        <button className="btn primary" disabled={pos === STEPS.length - 1} onClick={() => setPos(pos + 1)}>Lệnh tiếp</button>
        <span className="score">{pos + 1}/{STEPS.length}</span>
      </div>
    </div>
  );
}
