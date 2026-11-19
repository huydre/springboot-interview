import { useState } from "react";

const STATES = ["NEW", "RUNNABLE", "BLOCKED", "WAITING", "TIMED_WAITING", "TERMINATED"] as const;
type State = (typeof STATES)[number];

/** What does t.getState() return? Each answer was observed on JDK 21 or follows the lesson's state table. */
const CASES: { what: string; answer: State; why: string }[] = [
  { what: "new Thread(...) nhưng chưa gọi start()", answer: "NEW", why: "đo được trước start(): NEW" },
  { what: "Đang chạy vòng lặp tính toán", answer: "RUNNABLE", why: "đo được: RUNNABLE (Java không có RUNNING)" },
  { what: "Đang chờ DB trả kết quả qua socket JDBC", answer: "RUNNABLE", why: "chờ I/O vẫn là RUNNABLE, không phải WAITING" },
  { what: "Muốn vào synchronized (lock) trong khi main đang giữ lock", answer: "BLOCKED", why: "đo được: BLOCKED, chỉ dành cho monitor lock của synchronized" },
  { what: "Đang chờ ReentrantLock.lock() do thread khác giữ", answer: "WAITING", why: "đo được: WAITING, vì bên trong dùng LockSupport.park()" },
  { what: "Đã gọi lock.wait() không timeout", answer: "WAITING", why: "đo được: WAITING, chờ notify()" },
  { what: "Đang Thread.sleep(300)", answer: "TIMED_WAITING", why: "đo được: TIMED_WAITING, chờ có hạn" },
  { what: "run() đã kết thúc (kể cả do exception)", answer: "TERMINATED", why: "đo được sau join(): TERMINATED; start() lại sẽ ném IllegalThreadStateException" },
];

export function ThreadStateWidget() {
  const [picked, setPicked] = useState<Record<number, State>>({});
  const score = CASES.filter((c, i) => picked[i] === c.answer).length;
  return (
    <div className="widget">
      <ul className="classify">
        {CASES.map((c, i) => {
          const p = picked[i];
          return (
            <li key={c.what} className={p ? (p === c.answer ? "ok" : "no") : ""}>
              <span>{c.what}</span>
              <div className="seg small">
                {STATES.map((s) => <button key={s} className={p === s ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: s }))}>{s}</button>)}
              </div>
              {p && <span className="why">{p === c.answer ? `✓ ${c.why}` : `✕ là ${c.answer}: ${c.why}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{CASES.length}</span></div>
    </div>
  );
}
