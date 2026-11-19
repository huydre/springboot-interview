import { useState } from "react";

type Kind = "error" | "checked" | "unchecked";

/** Classification checked with Class.isAssignableFrom on JDK 21. */
const CLASSES: { name: string; parent: string; kind: Kind }[] = [
  { name: "IOException", parent: "Exception", kind: "checked" },
  { name: "SQLException", parent: "Exception", kind: "checked" },
  { name: "InterruptedException", parent: "Exception", kind: "checked" },
  { name: "NullPointerException", parent: "RuntimeException", kind: "unchecked" },
  { name: "IllegalArgumentException", parent: "RuntimeException", kind: "unchecked" },
  { name: "IllegalStateException", parent: "RuntimeException", kind: "unchecked" },
  { name: "UncheckedIOException", parent: "RuntimeException", kind: "unchecked" },
  { name: "OutOfMemoryError", parent: "Error (VirtualMachineError)", kind: "error" },
  { name: "StackOverflowError", parent: "Error (VirtualMachineError)", kind: "error" },
];

const MEANING: Record<Kind, { label: string; tone: string; rule: string }> = {
  checked: { label: "checked", tone: "warn", rule: "Compiler bắt buộc: phải catch hoặc khai báo throws. Dành cho lỗi bên ngoài có thể phục hồi." },
  unchecked: { label: "unchecked", tone: "good", rule: "Compiler không ép. Dành cho lỗi lập trình và vi phạm nghiệp vụ; exception nghiệp vụ nên ở nhánh này." },
  error: { label: "Error", tone: "bad", rule: "Lỗi nghiêm trọng của JVM. Đừng catch: để process dừng, lấy heap dump rồi điều tra." },
};

/** Pick an exception class and see which branch of the Throwable tree it belongs to. */
export function ExceptionTreeWidget() {
  const [picked, setPicked] = useState(0);
  const c = CLASSES[picked];
  const m = MEANING[c.kind];
  return (
    <div className="widget">
      <div className="seg small">
        {CLASSES.map((k, i) => (
          <button key={k.name} className={picked === i ? "on" : ""} onClick={() => setPicked(i)}>{k.name}</button>
        ))}
      </div>
      <div className="two">
        <pre className="code">{`Throwable
├── Error${c.kind === "error" ? `\n│   └── ${c.name}   ◀` : ""}
└── Exception${c.kind === "checked" ? `\n    ├── ${c.name}   ◀` : ""}
    └── RuntimeException${c.kind === "unchecked" ? `\n        └── ${c.name}   ◀` : ""}`}</pre>
        <div className={`result ${m.tone}`}>
          {c.name} → {m.label}
          <small>con của {c.parent}. {m.rule}</small>
        </div>
      </div>
    </div>
  );
}
