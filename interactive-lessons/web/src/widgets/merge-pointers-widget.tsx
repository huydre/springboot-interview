import { useEffect, useRef, useState } from "react";

/**
 * Merge join on two lists already sorted by the join key (unique keys on both sides). One pointer per list: the smaller
 * key advances, equal keys match and both advance. The nested-loop counter shows what comparing every pair would cost.
 */
const LEFT = [10, 20, 30, 40, 50, 60, 70, 80];
const RIGHT = [15, 20, 30, 35, 40, 55, 70, 75];
const TOTAL_PAIRS = LEFT.length * RIGHT.length;
const AUTO_MS = 650;

type State = { i: number; j: number; compares: number; matches: number[]; note: string };
const START: State = { i: 0, j: 0, compares: 0, matches: [], note: "Hai con trỏ cùng đứng ở đầu hai danh sách đã sắp." };

function step(s: State): State {
  if (s.i >= LEFT.length || s.j >= RIGHT.length) return { ...s, note: "Một danh sách đã hết: không còn gì để so, dừng." };
  const a = LEFT[s.i], b = RIGHT[s.j];
  const compares = s.compares + 1;
  if (a === b) return { i: s.i + 1, j: s.j + 1, compares, matches: [...s.matches, a], note: `${a} = ${b}: khớp. Ghi một dòng kết quả, cả hai con trỏ đi tiếp.` };
  if (a < b) return { ...s, i: s.i + 1, compares, note: `${a} < ${b}: bên trái nhỏ hơn, bên phải không thể có ${a} ở phía sau. Con trỏ trái đi tiếp.` };
  return { ...s, j: s.j + 1, compares, note: `${a} > ${b}: bên phải nhỏ hơn, bên trái không thể có ${b} ở phía sau. Con trỏ phải đi tiếp.` };
}

export function MergePointersWidget() {
  const [s, setS] = useState<State>(START);
  const [auto, setAuto] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const done = s.i >= LEFT.length || s.j >= RIGHT.length;

  useEffect(() => {
    if (!auto) return;
    timer.current = window.setInterval(() => setS((cur) => step(cur)), AUTO_MS);
    return () => window.clearInterval(timer.current);
  }, [auto]);
  useEffect(() => { if (done && auto) setAuto(false); }, [done, auto]);

  const reset = () => { setAuto(false); setS(START); };
  const run = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let cur = s;
      while (cur.i < LEFT.length && cur.j < RIGHT.length) cur = step(cur);
      setS({ ...cur, note: "Đã chạy tới hết." });
    } else setAuto((v) => !v);
  };

  const cell = (list: number[], ptr: number, side: "l" | "r") =>
    list.map((v, k) => {
      const cls = k === ptr && !done ? "mp-cell cur" : k < ptr ? (s.matches.includes(v) ? "mp-cell hit" : "mp-cell skip") : "mp-cell";
      return <li key={`${side}${k}`} className={cls}>{v}</li>;
    });

  return (
    <div className="widget mp">
      <div className="pho-top">
        <div className="seg small">
          <button className="on" onClick={() => setS((c) => step(c))} disabled={done}>Bước tiếp ›</button>
          <button onClick={run} disabled={done}>{auto ? "Dừng" : "Chạy tự động"}</button>
          <button onClick={reset}>↺ Làm lại</button>
        </div>
        <div className="mp-stats">
          <span>So sánh (merge): <b>{s.compares}</b></span>
          <span>Nested Loop sẽ cần: <b>{TOTAL_PAIRS}</b></span>
          <span>Khớp: <b>{s.matches.length}</b></span>
        </div>
      </div>
      <div className="mp-lists">
        <div><small>Bảng trái, đã sắp</small><ol>{cell(LEFT, s.i, "l")}</ol></div>
        <div><small>Bảng phải, đã sắp</small><ol>{cell(RIGHT, s.j, "r")}</ol></div>
      </div>
      <p className="pho-note" key={s.compares}>{s.note}</p>
      <p className="wx-note">Mô hình đơn giản: khoá duy nhất ở cả hai bên. Khi có khoá trùng, Merge Join phải nhớ lại một đoạn dòng, nên tốn thêm một chút.</p>
    </div>
  );
}
