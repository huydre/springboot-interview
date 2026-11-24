import { useEffect, useMemo, useState } from "react";
import { markStudyDay } from "../lib/cloud-progress";
import { practicePool, seeded, shuffle, stageCourses, type PoolItem } from "../lib/practice-pool";
import { noteLessonMiss } from "../lib/review-deck";
import { ItemView } from "./item-view";

const SIZE = 5;
/** Seconds allowed per question: a multiple-choice question is quicker than one answered in words. */
const LIMIT = { quiz: 60, card: 120 } as const;
const HISTORY_KEY = "interviewlab.mock.history";
type Result = { ok: boolean; seconds: number; timeout: boolean };
type History = { date: string; stage: string; score: number }[];

const readHistory = (): History => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };

/** Five questions from one stage (or all stages), mixing open questions and multiple choice when both exist. */
function pickSet(stage: string, seed: string): PoolItem[] {
  const pool = practicePool().filter((p) => stage === "all" || p.courseId === stage);
  const rnd = seeded(seed);
  const cards = shuffle(pool.filter((p) => p.kind === "card"), rnd);
  const quizzes = shuffle(pool.filter((p) => p.kind === "quiz"), rnd);
  const set = [...cards.slice(0, 2), ...quizzes.slice(0, SIZE - Math.min(2, cards.length))];
  return shuffle(set.length < SIZE ? [...set, ...cards.slice(2, 2 + SIZE - set.length)] : set, rnd).slice(0, SIZE);
}

/** Timed mock interview: pick a stage, answer 5 random questions against the clock, then get a report of weak spots. */
export function MockInterview() {
  const stages = useMemo(() => stageCourses(), []);
  const [stage, setStage] = useState<string | null>(null);
  const [set, setSet] = useState<PoolItem[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [history, setHistory] = useState<History>(readHistory);
  const current = set[idx];
  const answered = results.length > idx;

  const start = (id: string) => {
    const s = pickSet(id, `${id}-${Date.now()}`);
    setStage(id); setSet(s); setResults([]); setIdx(0);
    setLeft(s[0] ? LIMIT[s[0].kind] : 0);
  };

  function finish(ok: boolean, timeout = false) {
    if (!current || answered) return;
    const next = [...results, { ok, timeout, seconds: timeout ? LIMIT[current.kind] : LIMIT[current.kind] - left }];
    setResults(next);
    if (!ok) noteLessonMiss(current.id);
    void markStudyDay();
    if (next.length === set.length) {
      const h = [{ date: new Date().toLocaleDateString("vi-VN"), stage: stage!, score: next.filter((x) => x.ok).length }, ...readHistory()].slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
      setHistory(h);
    }
  }

  // One-second countdown while a question is open; at zero the question counts as missed.
  useEffect(() => {
    if (!current || answered) return;
    const t = setTimeout(() => (left <= 1 ? finish(false, true) : setLeft(left - 1)), 1000);
    return () => clearTimeout(t);
  });

  const next = () => { setIdx(idx + 1); if (set[idx + 1]) setLeft(LIMIT[set[idx + 1].kind]); };
  const nameOf = (id: string) => (id === "all" ? "Tất cả các chặng" : stages.find((c) => c.id === id)?.title ?? id);

  if (!stage) {
    return (
      <div className="pr-pick">
        <p className="lead">Chọn một chặng. Hệ thống hỏi ngẫu nhiên {SIZE} câu, trộn câu hỏi mở và trắc nghiệm. Mỗi câu có giới hạn thời gian: {LIMIT.quiz} giây cho trắc nghiệm, {LIMIT.card} giây cho câu hỏi mở.</p>
        <div className="pr-grid">
          {[{ id: "all", title: "Tất cả các chặng" }, ...stages].map((c) => (
            <button key={c.id} className="pr-stage-btn" onClick={() => start(c.id)}>{c.title}</button>
          ))}
        </div>
        {history.length > 0 && (
          <>
            <h3>Lần làm gần đây</h3>
            <ul className="pr-history">{history.slice(0, 6).map((h, i) => <li key={i}>{h.date} · {nameOf(h.stage)} · <b>{h.score}/{SIZE}</b></li>)}</ul>
          </>
        )}
      </div>
    );
  }

  if (idx >= set.length) {
    const right = results.filter((r) => r.ok).length;
    const weak = set.filter((_, i) => !results[i].ok);
    const total = results.reduce((n, r) => n + r.seconds, 0);
    return (
      <div className="pr-done">
        <h2>Kết quả: {right}/{set.length} · {nameOf(stage)}</h2>
        <p className="lead">Tổng thời gian {Math.floor(total / 60)} phút {total % 60} giây. {right === set.length ? "Trả lời trọn vẹn, thử một chặng khó hơn." : right >= 3 ? "Khá ổn. Ôn lại các chỗ yếu bên dưới." : "Nên quay lại học các phần bên dưới trước khi phỏng vấn."}</p>
        <ul className="pr-report">
          {set.map((it, i) => (
            <li key={it.id} className={results[i].ok ? "ok" : "no"}>
              <span>{results[i].ok ? "✓" : "✕"}</span> {it.kind === "card" ? "Câu mở" : "Trắc nghiệm"} · {results[i].timeout ? "hết giờ" : `${results[i].seconds}s`} · <a href={it.href}>{it.where}</a>
            </li>
          ))}
        </ul>
        {weak.length > 0 && <p className="muted">Các câu sai đã được thêm vào phần ôn tập mỗi ngày.</p>}
        <div className="pr-grade">
          <button className="btn primary" onClick={() => start(stage)}>Làm đề khác cùng chặng</button>
          <button className="btn ghost" onClick={() => setStage(null)}>Chọn chặng khác</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-session">
      <div className="pr-mock-bar">
        <span>{nameOf(stage)} · Câu {idx + 1}/{set.length}</span>
        <b className={`pr-timer ${!answered && left <= 10 ? "low" : ""}`} aria-live="off">{answered ? "Đã trả lời" : `${left}s`}</b>
      </div>
      <ItemView key={current.id + idx} item={current} onDone={(ok) => finish(ok)} locked={answered} />
      {answered && <button className="btn primary pr-next" onClick={next}>{idx + 1 === set.length ? "Xem báo cáo" : "Câu tiếp theo →"}</button>}
    </div>
  );
}
