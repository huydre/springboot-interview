import { useEffect, useRef, useState } from "react";

/**
 * A small B+Tree (3 levels, 8 leaves joined left to right). Each branch key is the largest key of the child below it, so a
 * search follows the first key >= target. "Tìm" walks root -> branch -> leaf; "Khoảng" descends once to the start, then
 * follows the leaf links to the right until a key passes the upper bound.
 */
const LEAVES = [[11, 13, 18], [21, 27, 30], [35, 39, 46], [48, 51, 53], [55, 57, 57], [62, 75, 80], [83, 90, 95], [98, 105, 120]];
const BRANCHES = [[0, 1, 2], [3, 4, 5], [6, 7]].map((kids) => ({ kids, keys: kids.map((k) => LEAVES[k][LEAVES[k].length - 1]) }));
const ROOT = BRANCHES.map((b) => b.keys[b.keys.length - 1]);

type Node = { level: "root" | "branch" | "leaf"; i: number };
type Step = { node: Node; text: string };
const STEP_MS = 900;

/** First child whose max key is >= target; past the last key the target cannot exist. */
const pickChild = (keys: number[], target: number) => keys.findIndex((k) => k >= target);

function searchSteps(target: number): { steps: Step[]; found: boolean } {
  const steps: Step[] = [];
  const b = pickChild(ROOT, target);
  steps.push({ node: { level: "root", i: 0 }, text: `Root [${ROOT.join(", ")}]: ${b < 0 ? `mọi key < ${target}, không có` : `${ROOT[b]} ≥ ${target} → xuống nhánh ${b + 1}`}` });
  if (b < 0) return { steps, found: false };
  const branch = BRANCHES[b];
  const c = pickChild(branch.keys, target);
  const leaf = branch.kids[c];
  steps.push({ node: { level: "branch", i: b }, text: `Branch [${branch.keys.join(", ")}]: ${branch.keys[c]} ≥ ${target} → xuống leaf ${leaf + 1}` });
  const hits = LEAVES[leaf].filter((k) => k === target).length;
  steps.push({ node: { level: "leaf", i: leaf }, text: `Leaf [${LEAVES[leaf].join(", ")}]: ${hits ? `thấy ${hits} entry = ${target}` : `không có ${target}, dừng`}` });
  return { steps, found: hits > 0 };
}

function rangeSteps(lo: number, hi: number): { steps: Step[]; found: boolean } {
  const { steps } = searchSteps(lo);
  steps[steps.length - 1].text = `Leaf [${LEAVES[steps[steps.length - 1].node.i].join(", ")}]: bắt đầu từ key đầu tiên ≥ ${lo}`;
  for (let leaf = steps[steps.length - 1].node.i + 1; leaf < LEAVES.length; leaf++) {
    if (LEAVES[leaf - 1][LEAVES[leaf - 1].length - 1] > hi) break;
    steps.push({ node: { level: "leaf", i: leaf }, text: `→ theo con trỏ next sang leaf [${LEAVES[leaf].join(", ")}]${LEAVES[leaf][0] > hi ? `: ${LEAVES[leaf][0]} > ${hi}, dừng` : ""}` });
  }
  return { steps, found: true };
}

const QUERIES = [
  { label: "= 57", run: () => searchSteps(57) },
  { label: "= 13", run: () => searchSteps(13) },
  { label: "= 95", run: () => searchSteps(95) },
  { label: "= 50 (không có)", run: () => searchSteps(50) },
  { label: "BETWEEN 30 AND 57", run: () => rangeSteps(30, 57) },
];

export function BtreeSearchWidget() {
  const [q, setQ] = useState(0);
  const [shown, setShown] = useState(0); // how many steps are revealed
  const timer = useRef<number | undefined>(undefined);
  const { steps } = QUERIES[q].run();

  const stop = () => window.clearInterval(timer.current);
  useEffect(() => stop, []);

  const play = () => {
    stop();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(steps.length); return; }
    setShown(1);
    let n = 1;
    timer.current = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= steps.length) stop();
    }, STEP_MS);
  };

  const visited = steps.slice(0, shown).map((s) => s.node);
  const isOn = (level: Node["level"], i: number) => visited.some((v) => v.level === level && v.i === i);
  const cls = (level: Node["level"], i: number) => (shown === 0 ? "" : isOn(level, i) ? "on" : "dim");

  return (
    <div className="widget bt">
      <div className="bt-controls">
        <small>Câu truy vấn</small>
        <div className="seg small">
          {QUERIES.map((x, i) => <button key={x.label} className={q === i ? "on" : ""} onClick={() => { stop(); setQ(i); setShown(0); }}>{x.label}</button>)}
        </div>
        <button className="btn primary" onClick={play}>{shown ? "Chạy lại" : "Tìm"}</button>
      </div>

      <div className="bt-tree">
        <div className="bt-row">
          <span className={`bt-node root ${cls("root", 0)}`}>{ROOT.join(" · ")}</span>
        </div>
        <div className="bt-row">
          {BRANCHES.map((b, i) => <span key={i} className={`bt-node ${cls("branch", i)}`}>{b.keys.join(" · ")}</span>)}
        </div>
        <div className="bt-row leaves">
          {LEAVES.map((l, i) => (
            <span key={i} className={`bt-node leaf ${cls("leaf", i)}`}>
              {l.join(" · ")}
              {i < LEAVES.length - 1 && <i className="bt-link" aria-hidden>⇄</i>}
            </span>
          ))}
        </div>
        <small className="bt-legend">Tầng lá nối hai chiều (⇄): đi sang trái hoặc phải mà không cần quay lại root.</small>
      </div>

      <ol className="bt-log">
        {steps.slice(0, shown).map((s, i) => <li key={i}>{s.text}</li>)}
      </ol>
      {shown >= steps.length && shown > 0 && (
        <div className="result good">
          Đọc {steps.length} page
          <small>
            {QUERIES[q].label.startsWith("BETWEEN")
              ? "Xuống cây đúng một lần để tìm điểm bắt đầu, phần còn lại chỉ đi ngang theo tầng lá."
              : "Mỗi tầng một page: root, branch, leaf. Cây 3 tầng chứa được hàng trăm triệu key, vẫn chỉ 3 lần đọc."}
          </small>
        </div>
      )}
    </div>
  );
}
