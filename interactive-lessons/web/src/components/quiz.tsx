import { useMemo, useState } from "react";
import type { QuizQuestion } from "../data/types";
import { RichText } from "./rich-text";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Display order of the options. Authors tend to put the right answer in the same slot, so the order is shuffled,
 * seeded by the question text: stable across reloads, different from question to question.
 */
function displayOrder(quiz: QuizQuestion): number[] {
  let seed = 2166136261;
  for (const ch of quiz.question) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  const order = quiz.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822507) ^ i;
    const j = (seed >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function Quiz({ quiz, onAnswered }: { quiz: QuizQuestion; onAnswered?: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const order = useMemo(() => displayOrder(quiz), [quiz]);
  const correct = picked === quiz.answer;

  const submit = () => {
    if (picked === null) return;
    setSubmitted(true);
    onAnswered?.(picked === quiz.answer);
  };

  return (
    <div className="quiz">
      <h3>Quick Quiz</h3>
      <p className="quiz-q">
        <RichText text={quiz.question} />
      </p>
      <div className="quiz-options">
        {order.map((i, pos) => {
          const state = !submitted ? (picked === i ? "picked" : "") : i === quiz.answer ? "right" : picked === i ? "wrong" : "dim";
          return (
            <button key={i} className={`quiz-opt ${state}`} disabled={submitted} onClick={() => setPicked(i)}>
              <b>{LETTERS[pos]}.</b> <RichText text={quiz.options[i]} />
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button className="btn primary" disabled={picked === null} onClick={submit}>
          Gửi câu trả lời
        </button>
      ) : (
        <div className={`quiz-result ${correct ? "ok" : "no"}`}>
          <strong>{correct ? "Chính xác!" : `Chưa đúng. Đáp án: ${LETTERS[order.indexOf(quiz.answer)]}`}</strong>
          <p>
            <RichText text={quiz.explain} />
          </p>
          <button className="btn ghost" onClick={() => { setPicked(null); setSubmitted(false); }}>
            Làm lại
          </button>
        </div>
      )}
    </div>
  );
}
