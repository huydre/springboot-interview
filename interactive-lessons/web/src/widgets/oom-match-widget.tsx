import { useState } from "react";

const ERRORS = ["StackOverflowError", "Java heap space", "Metaspace", "unable to create native thread", "Direct buffer memory"] as const;
type Err = (typeof ERRORS)[number];

/** Match each production symptom to the error it ends in (the lesson's OOM table). */
const CASES: { what: string; answer: Err; why: string }[] = [
  { what: "toString() của Order gọi Customer, Customer lại gọi Order (Lombok @Data quan hệ hai chiều)", answer: "StackOverflowError", why: "gọi vòng vô hạn, stack đầy frame" },
  { what: "static Map CACHE chỉ put, không bao giờ xoá", answer: "Java heap space", why: "object vẫn còn tham chiếu nên GC không thu hồi được" },
  { what: "findAll() đọc cả bảng 5 triệu dòng vào một List", answer: "Java heap space", why: "load quá nhiều dữ liệu một lúc; phải phân trang" },
  { what: "Mỗi request gọi new Thread(...).start(), không giới hạn", answer: "unable to create native thread", why: "hệ điều hành hết tài nguyên tạo thread; dùng thread pool có giới hạn" },
  { what: "Sinh proxy class động liên tục, redeploy làm rò classloader", answer: "Metaspace", why: "metadata của class tích tụ ở Metaspace" },
  { what: "Buffer Netty/NIO không được release", answer: "Direct buffer memory", why: "hết vùng nhớ off-heap" },
];

export function OomMatchWidget() {
  const [picked, setPicked] = useState<Record<number, Err>>({});
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
                {ERRORS.map((e) => <button key={e} className={p === e ? "on" : ""} onClick={() => setPicked((prev) => ({ ...prev, [i]: e }))}>{e}</button>)}
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
