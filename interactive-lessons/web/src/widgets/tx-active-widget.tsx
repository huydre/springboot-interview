import { useState } from "react";

/** isActualTransactionActive() measured inside each method, Spring Boot 3.5 / Spring 6.2 (study note 05.02). */
const CASES: { label: string; code: string; active: boolean; note: string }[] = [
  { label: "probe.inTx() qua proxy", code: "probe.inTx();", active: true, note: "active=true name=demo.ProbeService.inTx" },
  { label: "this.inTx()", code: "public String callSelfTx() { return this.inTx(); }", active: false, note: "Self-invocation: this là object thật, interceptor không chạy. active=false name=null" },
  { label: "self.inTx() (@Lazy self)", code: "@Autowired @Lazy ProbeService self;\nreturn self.inTx();", active: true, note: "Đi qua proxy của chính mình: chạy được nhưng khó đọc. Tách bean thì sạch hơn." },
  { label: "protected / package-private", code: "@Transactional protected String protectedTx()", active: true, note: "Spring 6 hỗ trợ với CGLIB. Tài liệu cũ ghi \"chỉ public\" là hành vi Spring 5." },
  { label: "public final", code: "@Transactional public final String finalTx()", active: false, note: "CGLIB không override được: method chạy trên chính proxy, field không được inject → repoNull=true, dễ NullPointerException. Kotlin mặc định final." },
  { label: "private", code: "@Transactional private String privateTx()", active: false, note: "Chỉ gọi được nội bộ nên luôn là self-invocation. Không cảnh báo, im lặng không làm gì." },
  { label: "new ProbeService()", code: "new ProbeService().inTx();", active: false, note: "Không phải bean: không proxy, không field nào được inject." },
];

export function TxActiveWidget() {
  const [i, setI] = useState(1);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.code}</pre>
      <div className={`result ${c.active ? "good" : "bad"}`}>
        {c.active ? "Có transaction" : "Không có transaction"}
        <small>{c.note}</small>
      </div>
    </div>
  );
}
