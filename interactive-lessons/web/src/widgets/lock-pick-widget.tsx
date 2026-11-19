import { useState } from "react";

const TOOLS = ["volatile", "AtomicInteger", "LongAdder", "ReentrantLock", "ReadWriteLock", "CHM.merge", "CopyOnWriteArrayList"] as const;
type Tool = (typeof TOOLS)[number];

/** Pick the right tool for each job, following the lesson's measurements and rules. */
const JOBS: { job: string; answer: Tool; why: string }[] = [
  { job: "Cờ dừng: một thread ghi false, worker đọc trong vòng lặp", answer: "volatile", why: "chỉ cần visibility; đã đo: không volatile thì worker không dừng" },
  { job: "Counter số request cho metric, 8 thread tăng liên tục", answer: "LongAdder", why: "nhanh nhất khi tranh chấp cao (114 ms so với 1098, 1453 ms)" },
  { job: "Sinh số thứ tự đơn hàng, cần giá trị chính xác ngay", answer: "AtomicInteger", why: "incrementAndGet trả giá trị nguyên tử; LongAdder.sum() không phải snapshot" },
  { job: "Chờ lock tối đa 500 ms rồi báo bận thay vì treo", answer: "ReentrantLock", why: "tryLock(timeout): đo được trả false sau 507 ms" },
  { job: "Cấu hình đọc rất nhiều, thỉnh thoảng mới ghi", answer: "ReadWriteLock", why: "nhiều reader cùng lúc: 4 reader 325 ms thay vì 1235 ms" },
  { job: "Đếm số lần xuất hiện theo từng key từ nhiều thread", answer: "CHM.merge", why: "get rồi put sai 20/20 lần; merge đúng 20/20" },
  { job: "Danh sách listener: duyệt liên tục, hiếm khi thêm", answer: "CopyOnWriteArrayList", why: "duyệt trên snapshot, không CME; mỗi lần ghi copy cả mảng nên chỉ hợp khi ghi rất ít" },
];

export function LockPickWidget() {
  const [picked, setPicked] = useState<Record<number, Tool>>({});
  const score = JOBS.filter((j, i) => picked[i] === j.answer).length;
  return (
    <div className="widget">
      <ul className="classify">
        {JOBS.map((j, i) => {
          const p = picked[i];
          return (
            <li key={j.job} className={p ? (p === j.answer ? "ok" : "no") : ""}>
              <span>{j.job}</span>
              <div className="seg small">
                {TOOLS.map((t) => <button key={t} className={p === t ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: t }))}>{t}</button>)}
              </div>
              {p && <span className="why">{p === j.answer ? `✓ ${j.why}` : `✕ nên dùng ${j.answer}: ${j.why}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{JOBS.length}</span></div>
    </div>
  );
}
