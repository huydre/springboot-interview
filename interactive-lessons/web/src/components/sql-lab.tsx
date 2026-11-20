import { useState } from "react";
import type { SqlExercise } from "../data/types";
import { formatCell, resetDb, runSql, sameResult, type SqlResult } from "../lib/sql-engine";
import { RichText } from "./rich-text";
import { Code } from "./code-block";

const MAX_ROWS = 100;

type Verdict = { kind: "right" } | { kind: "wrong"; why: string } | null;

function ResultTable({ res }: { res: SqlResult }) {
  if (res.fields.length === 0) {
    return <p className="muted">Câu lệnh đã chạy xong{res.affected ? `, ảnh hưởng ${res.affected} dòng` : ""} ({res.ms.toFixed(0)} ms).</p>;
  }
  const shown = res.rows.slice(0, MAX_ROWS);
  return (
    <>
      <div className="sql-scroll">
        <table className="sql-table">
          <thead><tr>{res.fields.map((f, i) => <th key={i}>{f.name}</th>)}</tr></thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => {
                  const t = formatCell(c, res.fields[j].type);
                  return <td key={j} className={c === null ? "null" : typeof c === "number" || res.fields[j].type === 1700 ? "num" : ""}>{t}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted sql-meta">
        {res.rows.length} dòng{res.rows.length > MAX_ROWS ? `, hiển thị ${MAX_ROWS} dòng đầu` : ""} · {res.ms.toFixed(0)} ms
      </p>
    </>
  );
}

/** Replays the learner's statements and the solution on a fresh dataset and compares what `verify` selects afterwards. */
async function checkWithVerify(ex: SqlExercise, sql: string): Promise<SqlResult[]> {
  await resetDb();
  await runSql(sql);
  const mine = await runSql(ex.verify as string);
  await resetDb();
  await runSql(ex.solution);
  const expected = await runSql(ex.verify as string);
  await resetDb();
  await runSql(sql); // leave the data as the learner's statements made it
  return [mine, expected];
}

const WRITES = /\b(insert|update|delete|create|drop|alter|truncate)\b/i;

/** For exercises without `verify` whose statements change data: each side runs on a fresh dataset, so the solution never sees the learner's changes (or the other way round). */
async function checkOnFreshData(ex: SqlExercise, sql: string): Promise<SqlResult[]> {
  await resetDb();
  const mine = await runSql(sql);
  await resetDb();
  const expected = await runSql(ex.solution);
  await resetDb();
  await runSql(sql); // leave the data as the learner's statements made it
  return [mine, expected];
}

/** A SQL editor on the T24 bank dataset: tasks with a starter query, run with Ctrl/Cmd+Enter, auto-checked against the model solution. */
export function SqlLab({ exercises }: { exercises: SqlExercise[] }) {
  const [idx, setIdx] = useState(0);
  const [texts, setTexts] = useState<string[]>(() => exercises.map((e) => e.starter));
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const ex = exercises[idx];
  const sql = texts[idx];

  const pick = (i: number) => {
    setIdx(i);
    setResult(null);
    setError(null);
    setVerdict(null);
    setShowHint(false);
    setShowSolution(false);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    setVerdict(null);
    try {
      let mine: SqlResult;
      let expected: SqlResult | null = null;
      if (ex.verify) {
        const [a, b] = await checkWithVerify(ex, sql);
        mine = a;
        expected = b;
      } else if (WRITES.test(sql) || WRITES.test(ex.solution)) {
        const [a, b] = await checkOnFreshData(ex, sql);
        mine = a;
        expected = b;
      } else {
        mine = await runSql(sql);
        expected = await runSql(ex.solution);
      }
      setResult(mine);
      if (sameResult(mine, expected, !!ex.ordered)) setVerdict({ kind: "right" });
      else {
        const why = mine.fields.length !== expected.fields.length
          ? `Kết quả của bạn có ${mine.fields.length} cột, đáp án có ${expected.fields.length} cột.`
          : mine.rows.length !== expected.rows.length
            ? `Kết quả của bạn có ${mine.rows.length} dòng, đáp án có ${expected.rows.length} dòng.`
            : "Số dòng và số cột đúng, nhưng giá trị hoặc thứ tự dòng chưa khớp đáp án.";
        setVerdict({ kind: "wrong", why });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    await resetDb();
    setResult(null);
    setVerdict(null);
    setError(null);
    setBusy(false);
  };

  return (
    <div className="widget sql-lab">
      {exercises.length > 1 && (
        <div className="seg small">
          {exercises.map((_, i) => <button key={i} className={idx === i ? "on" : ""} onClick={() => pick(i)}>Bài {i + 1}</button>)}
        </div>
      )}
      <p className="sql-prompt"><RichText text={ex.prompt} /></p>
      <textarea
        className="sql-editor"
        spellCheck={false}
        value={sql}
        rows={Math.min(14, Math.max(4, sql.split("\n").length + 1))}
        onChange={(e) => setTexts((t) => t.map((x, i) => (i === idx ? e.target.value : x)))}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); void run(); }
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const v = sql.slice(0, el.selectionStart) + "  " + sql.slice(el.selectionEnd);
            const pos = el.selectionStart + 2;
            setTexts((t) => t.map((x, i) => (i === idx ? v : x)));
            requestAnimationFrame(() => el.setSelectionRange(pos, pos));
          }
        }}
      />
      <div className="actions">
        <button className="btn primary" disabled={busy} onClick={() => void run()}>{busy ? "Đang chạy…" : "Chạy (Ctrl+Enter)"}</button>
        {ex.hint && <button className="btn" onClick={() => setShowHint((v) => !v)}>Gợi ý</button>}
        <button className="btn" onClick={() => setShowSolution((v) => !v)}>Xem đáp án</button>
        <button className="btn" onClick={() => setTexts((t) => t.map((x, i) => (i === idx ? ex.starter : x)))}>Về câu gốc</button>
        <button className="btn ghost" disabled={busy} onClick={() => void reset()}>Đặt lại dữ liệu</button>
      </div>
      {showHint && ex.hint && <p className="note"><RichText text={ex.hint} /></p>}
      {showSolution && <Code>{ex.solution}</Code>}
      {error && <div className="result bad"><span>Lỗi SQL</span><small>{error}</small></div>}
      {verdict?.kind === "right" && <div className="result good">Đúng rồi<small>Kết quả khớp với đáp án mẫu.</small></div>}
      {verdict?.kind === "wrong" && <div className="result warn">Chưa khớp<small>{verdict.why} Xem gợi ý hoặc đáp án nếu cần.</small></div>}
      {result && <ResultTable res={result} />}
    </div>
  );
}
