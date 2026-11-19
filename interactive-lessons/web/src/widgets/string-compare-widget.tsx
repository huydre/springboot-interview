import { useState } from "react";

/**
 * Ways to obtain the string "java". `pooled` = the expression yields the single instance in the String pool:
 * literals and compile-time constant concatenation are interned; `new` and runtime concatenation are not.
 */
const SOURCES = [
  { code: '"java"', pooled: true, why: "literal: lấy từ pool" },
  { code: '"ja" + "va"', pooled: true, why: "hằng số: compiler gộp thành \"java\" lúc compile" },
  { code: 'new String("java")', pooled: false, why: "new luôn tạo object mới" },
  { code: 'ja + "va"', pooled: false, why: "ja là biến: nối lúc runtime ra object mới" },
  { code: 'new String("java").intern()', pooled: true, why: "intern() trả về bản trong pool" },
];

export function StringCompareWidget() {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(2);
  const l = SOURCES[left];
  const r = SOURCES[right];
  // Two separately evaluated expressions are the same object only if both resolve to the pooled instance.
  const same = l.pooled && r.pooled;

  const picker = (value: number, set: (i: number) => void, label: string) => (
    <label className="pick">
      <span>{label}</span>
      <select value={value} onChange={(e) => set(Number(e.target.value))}>
        {SOURCES.map((s, i) => <option key={s.code} value={i}>{s.code}</option>)}
      </select>
    </label>
  );

  return (
    <div className="widget">
      <div className="two">
        <div className="panel">
          {picker(left, setLeft, "String s1 =")}
          {picker(right, setRight, "String s2 =")}
          <pre className="code">{`String ja = "ja";
String s1 = ${l.code};
String s2 = ${r.code};`}</pre>
        </div>
        <div className="panel">
          <div className={`result ${same ? "good" : "bad"}`}>
            s1 == s2 → {String(same)}
            <small>{same ? "cả hai là bản duy nhất trong String pool" : `${!l.pooled ? `s1: ${l.why}` : `s2: ${r.why}`}`}</small>
          </div>
          <div className="result good">
            s1.equals(s2) → true
            <small>cùng nội dung "java", luôn đúng</small>
          </div>
        </div>
      </div>
    </div>
  );
}
