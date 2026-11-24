import { useState } from "react";
import { RichText } from "../components/rich-text";
import { markStudyDay } from "../lib/cloud-progress";
import { sdProblems, type SdProblem } from "../data/sd-problems";

type StepState = { text: string; hints: number; ticks: number[]; graded: boolean };
const keyOf = (id: string) => `interviewlab.sd.${id}`;
const load = (id: string): Record<string, StepState> => { try { return JSON.parse(localStorage.getItem(keyOf(id)) || "{}"); } catch { return {}; } };
const blank: StepState = { text: "", hints: 0, ticks: [], graded: false };

/** Lines of reference text: consecutive "- " lines become one list, other lines are paragraphs. */
function Lines({ lines }: { lines: string[] }) {
  const blocks: (string | string[])[] = [];
  for (const l of lines) {
    const last = blocks[blocks.length - 1];
    if (l.startsWith("- ") && Array.isArray(last)) last.push(l.slice(2));
    else if (l.startsWith("- ")) blocks.push([l.slice(2)]);
    else blocks.push(l);
  }
  return <>{blocks.map((b, i) => (Array.isArray(b) ? <ul key={i} className="prose-list">{b.map((t) => <li key={t}><RichText text={t} /></li>)}</ul> : <p key={i}><RichText text={b} /></p>))}</>;
}

const scoreOf = (p: SdProblem, st: Record<string, StepState>) => {
  const total = p.steps.reduce((n, s) => n + s.rubric.length, 0);
  const got = p.steps.reduce((n, s) => n + (st[s.key]?.ticks.length ?? 0), 0);
  return { total, got, graded: p.steps.filter((s) => st[s.key]?.graded).length };
};

/** Guided system design: work through five steps, write your own answer, open hints if stuck, then self-grade against a rubric. */
function Problem({ p }: { p: SdProblem }) {
  const [st, setSt] = useState<Record<string, StepState>>(() => load(p.id));
  const [at, setAt] = useState(() => Math.max(0, p.steps.findIndex((s) => !load(p.id)[s.key]?.graded)));
  const step = p.steps[Math.min(at, p.steps.length - 1)];
  const cur = st[step.key] ?? blank;
  const save = (next: StepState) => {
    const all = { ...st, [step.key]: next };
    setSt(all);
    localStorage.setItem(keyOf(p.id), JSON.stringify(all));
  };
  const s = scoreOf(p, st);
  const allDone = s.graded === p.steps.length;

  return (
    <div className="sd-problem">
      <p className="rm-kicker">{p.level} · khoảng {p.minutes} phút</p>
      <h2>{p.title}</h2>
      <p className="lead"><RichText text={p.brief} /></p>
      <ol className="sd-steps">
        {p.steps.map((x, i) => (
          <li key={x.key}><button className={`${i === at ? "on" : ""} ${st[x.key]?.graded ? "done" : ""}`} onClick={() => setAt(i)}>{st[x.key]?.graded ? "✓ " : ""}{i + 1}. {x.title.replace(/^Bước \d+:\s*/, "")}</button></li>
        ))}
      </ol>
      <section className="sd-step">
        <h3>{step.title}</h3>
        <p><RichText text={step.prompt} /></p>
        <textarea className="ap-input" rows={7} value={cur.text} placeholder="Viết câu trả lời của bạn cho bước này: gạch đầu dòng là đủ" onChange={(e) => save({ ...cur, text: e.target.value })} />
        <div className="ap-actions">
          {cur.hints < step.hints.length && <button className="btn ghost" onClick={() => save({ ...cur, hints: cur.hints + 1 })}>Gợi ý {cur.hints + 1}/{step.hints.length}</button>}
          {!cur.graded && <button className="btn primary" disabled={cur.text.trim().length < 10} onClick={() => { save({ ...cur, graded: true }); void markStudyDay(); }}>Chấm theo rubric</button>}
        </div>
        {cur.hints > 0 && <ul className="sd-hints">{step.hints.slice(0, cur.hints).map((h) => <li key={h}><RichText text={h} /></li>)}</ul>}
        {cur.graded && (
          <>
            <p className="ap-score"><strong>{cur.ticks.length}/{step.rubric.length}</strong> tiêu chí. Tick những ý bạn đã viết ra:</p>
            <ol className="ap-points">
              {step.rubric.map((r, i) => (
                <li key={i}>
                  <label className={cur.ticks.includes(i) ? "hit" : ""}>
                    <input type="checkbox" checked={cur.ticks.includes(i)} onChange={() => save({ ...cur, ticks: cur.ticks.includes(i) ? cur.ticks.filter((x) => x !== i) : [...cur.ticks, i] })} />
                    <span><RichText text={r} /></span>
                  </label>
                </li>
              ))}
            </ol>
            <details className="sd-ref" open>
              <summary>Đáp án tham khảo</summary>
              <Lines lines={step.reference} />
            </details>
            {at < p.steps.length - 1 && <button className="btn primary pr-next" onClick={() => setAt(at + 1)}>Sang bước tiếp →</button>}
          </>
        )}
      </section>
      {allDone && (
        <div className="pr-done">
          <h3>Tổng kết: {s.got}/{s.total} tiêu chí ({Math.round((s.got / s.total) * 100)}%)</h3>
          <ul className="pr-report">
            {p.steps.map((x) => {
              const t = st[x.key]?.ticks.length ?? 0;
              return <li key={x.key} className={t / x.rubric.length >= 0.6 ? "ok" : "no"}><span>{t / x.rubric.length >= 0.6 ? "✓" : "✕"}</span> {x.title}: {t}/{x.rubric.length}</li>;
            })}
          </ul>
          <p className="muted">Bước nào dưới 60% là chỗ cần luyện thêm. Làm lại sau vài ngày, không nhìn đáp án.</p>
          <button className="btn ghost" onClick={() => { localStorage.removeItem(keyOf(p.id)); setSt({}); setAt(0); }}>Làm lại từ đầu</button>
        </div>
      )}
    </div>
  );
}

/** List of guided problems, or one problem when `?luyen=sd&de=<id>`. */
export function SdGuided() {
  const id = new URLSearchParams(location.search).get("de");
  const p = sdProblems.find((x) => x.id === id);
  if (p) return <Problem p={p} />;
  return (
    <div className="pr-grid sd-list">
      {sdProblems.map((x) => {
        const s = scoreOf(x, load(x.id));
        return (
          <a key={x.id} className="rm-card pr-mode" href={`?luyen=sd&de=${x.id}`}>
            <p className="rm-kicker">{x.level} · {x.minutes} phút</p>
            <h3>{x.title}</h3>
            <p className="rm-blurb"><RichText text={x.brief} /></p>
            <small className="muted">{s.graded === 0 ? "Chưa làm" : `Đã chấm ${s.graded}/${x.steps.length} bước · ${s.got}/${s.total} tiêu chí`}</small>
          </a>
        );
      })}
    </div>
  );
}
