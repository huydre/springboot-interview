import { useState } from "react";

type Id = "IDENTITY" | "SEQUENCE";

/** Round trips counted with a proxy around the DataSource, batch_size = 50 (study note 05.08). Times are ranges on a loaded machine. */
const DATA: Record<Id, Record<1000 | 20000, { single: string; batch: number; time: string }>> = {
  IDENTITY: {
    1000: { single: "1 000 INSERT", batch: 0, time: "4,0–18,3 s" },
    20000: { single: "20 000 INSERT", batch: 0, time: "61–108 s" },
  },
  SEQUENCE: {
    1000: { single: "20 nextval", batch: 20, time: "0,13–1,1 s" },
    20000: { single: "400 nextval", batch: 400, time: "1,1–2,0 s" },
  },
};

export function BatchInsertWidget() {
  const [id, setId] = useState<Id>("IDENTITY");
  const [n, setN] = useState<1000 | 20000>(1000);
  const d = DATA[id][n];
  return (
    <div className="widget">
      <div className="seg small">
        {(["IDENTITY", "SEQUENCE"] as Id[]).map((k) => <button key={k} className={id === k ? "on" : ""} onClick={() => setId(k)}>{k === "SEQUENCE" ? "SEQUENCE (allocationSize 50)" : k}</button>)}
      </div>
      <div className="seg small">
        {([1000, 20000] as const).map((k) => <button key={k} className={n === k ? "on" : ""} onClick={() => setN(k)}>persist {k.toLocaleString("vi-VN")} entity</button>)}
      </div>
      <ul className="log">
        <li className={id === "IDENTITY" ? "err" : "ok"}>Câu lẻ: {d.single}</li>
        <li className={d.batch ? "ok" : "err"}>executeBatch: {d.batch}</li>
        <li>Thời gian: {d.time}</li>
      </ul>
      <p className="muted">
        {id === "IDENTITY"
          ? "DB sinh id lúc INSERT mà Hibernate cần id ngay khi persist, nên phải INSERT từng dòng: batching bị tắt."
          : "nextval một lần cấp 50 id trong memory, INSERT dồn tới flush rồi gom batch. Thêm reWriteBatchedInserts=true cho PostgreSQL. Batch lớn: flush() + clear() mỗi 50 dòng, đo được 50 000 entity còn lại 0 trong context thay vì 50 000."}
        {" "}Số round trip là con số chắc chắn; thời gian đo trên máy đang tải cao nên chỉ tỉ lệ là đáng nhớ.
      </p>
    </div>
  );
}
