import { useState } from "react";

type Choice = "nên" | "không nên";

/** Should this job use a parallel stream? Each answer follows the five conditions in the lesson. */
const JOBS: { job: string; answer: Choice; why: string }[] = [
  { job: "Tính tổng bình phương của 10 triệu số trong một mảng long[]", answer: "nên", why: "dữ liệu lớn, tính toán thuần, mảng dễ chia, không có state dùng chung" },
  { job: "Gọi 50 API HTTP để lấy giá sản phẩm, trong một request web", answer: "không nên", why: "I/O: chiếm thread của commonPool để chờ mạng; dùng CompletableFuture với executor riêng" },
  { job: "Lọc 20 phần tử của một List", answer: "không nên", why: "dữ liệu quá nhỏ: chi phí chia và gộp lớn hơn lợi ích" },
  { job: "Duyệt một LinkedList 1 triệu phần tử", answer: "không nên", why: "LinkedList chia rất kém, các thread gần như chờ nhau" },
  { job: "parallel().forEach(x -> result.add(x)) với result là ArrayList", answer: "không nên", why: "shared mutable state: race condition, dùng collect/toList" },
  { job: "Băm SHA-256 cho 500 nghìn chuỗi trong ArrayList, rồi toList()", answer: "nên", why: "CPU-bound, nguồn dễ chia, gom bằng toList" },
];

export function ParallelFitWidget() {
  const [picked, setPicked] = useState<Record<number, Choice>>({});
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
                {(["nên", "không nên"] as Choice[]).map((c) => <button key={c} className={p === c ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: c }))}>{c}</button>)}
              </div>
              {p && <span className="why">{p === j.answer ? `✓ ${j.why}` : `✕ ${j.answer} dùng parallel: ${j.why}`}</span>}
            </li>
          );
        })}
      </ul>
      <div className="actions"><span className="score">Đúng {score}/{JOBS.length}</span></div>
    </div>
  );
}
