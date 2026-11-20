import { useState } from "react";
import { Code } from "../components/code-block";

/**
 * BCryptPasswordEncoder timings on JDK 21, re-measured with spring-security-crypto 6.5 (the first run in study note 03.09 logged
 * 113.6 / 590.4 / 4410 ms, a single noisy run that did not follow the doubling per step). Sample hashes from the note; SHA-256 for comparison.
 */
const COSTS = [
  { s: 10, ms: 88, hash: "$2a$10$C38mwtoaKAO72ovSTPijP.x8TNjXNu6OcsezPoEcqbtDes4LeECWO" },
  { s: 12, ms: 386, hash: "$2a$12$D8unsobwi32srG4Ah6LVnO287tECJnV…" },
  { s: 14, ms: 1521, hash: "$2a$14$dCwjzEeLXqSdAyKz3W/BuOwv7l7tol/…" },
];
const SHA_MS = 165.7 / 100000;

export function BcryptCostWidget() {
  const [i, setI] = useState(0);
  const c = COSTS[i];
  const perSecond = Math.round(1000 / c.ms);
  return (
    <div className="widget">
      <div className="seg small">
        {COSTS.map((x, n) => <button key={x.s} className={i === n ? "on" : ""} onClick={() => setI(n)}>strength {x.s}</button>)}
      </div>
      <div className="bars">
        <div>BCrypt strength {c.s}: {c.ms.toLocaleString("vi-VN")} ms / hash<i className="good" style={{ width: `${(c.ms / COSTS[COSTS.length - 1].ms) * 100}%` }} /></div>
        <div>SHA-256: {SHA_MS.toFixed(4)} ms / hash<i className="bad" style={{ width: "1%" }} /></div>
      </div>
      <Code>{`encode("P@ssw0rd")\n${c.hash}\n$2a$ = phiên bản · ${c.s}$ = 2^${c.s} vòng · 22 ký tự kế = salt · còn lại = hash`}</Code>
      <p className="muted">
        Một lõi CPU chỉ thử được khoảng {perSecond.toLocaleString("vi-VN")} mật khẩu mỗi giây ở strength {c.s}; SHA-256 thì hơn 600 nghìn. Mỗi lần tăng strength 1 thì chậm gấp đôi (88, 386, 1521 ms: mỗi 2 bậc khoảng gấp 4).
        Hash cùng mật khẩu 2 lần: <code>equals</code> là false (salt khác), <code>matches</code> đều true.
        {c.s >= 14 && " Quá chậm cho login: gửi nhiều request login là đốt CPU (DoS)."}
      </p>
    </div>
  );
}
