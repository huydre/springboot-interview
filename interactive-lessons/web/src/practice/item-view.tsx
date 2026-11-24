import { useRef, useState } from "react";
import { Quiz } from "../components/quiz";
import { RichText } from "../components/rich-text";
import type { PoolItem } from "../lib/practice-pool";

/**
 * One practice item. A quiz grades itself on the first submit; a flashcard asks the learner to answer first
 * (typing is optional), then shows the answer and asks "Nhớ" or "Chưa nhớ". `onDone` fires once per item.
 */
export function ItemView({ item, onDone, locked = false }: { item: PoolItem; onDone: (ok: boolean) => void; locked?: boolean }) {
  const fired = useRef(false);
  const [shown, setShown] = useState(false);
  const [note, setNote] = useState("");
  const [graded, setGraded] = useState(false);
  const done = (ok: boolean) => { if (fired.current) return; fired.current = true; setGraded(true); onDone(ok); };

  return (
    <div className="pr-item">
      <p className="pr-where"><a href={item.href} target="_blank" rel="noopener noreferrer">{item.where} ↗</a></p>
      {item.kind === "quiz" ? (
        <Quiz quiz={item.quiz!} onAnswered={done} title="Trắc nghiệm" />
      ) : (
        <div className="quiz pr-card">
          <h3>Câu hỏi mở</h3>
          <p className="quiz-q"><RichText text={item.q!} /></p>
          {!shown ? (
            <>
              <textarea className="ap-input" rows={3} value={note} disabled={locked} placeholder="Gõ vài ý chính, hoặc nói thành tiếng rồi bấm xem đáp án" onChange={(e) => setNote(e.target.value)} />
              <button className="btn primary" disabled={locked} onClick={() => setShown(true)}>Xem đáp án</button>
            </>
          ) : (
            <>
              {note.trim() && <p className="pr-mine"><b>Bạn trả lời:</b> {note}</p>}
              <div className="quiz-result ok pr-answer"><p><RichText text={item.a!} /></p></div>
              {!graded ? (
                <div className="pr-grade">
                  <button className="btn primary" onClick={() => done(true)}>Nhớ, trả lời được</button>
                  <button className="btn ghost" onClick={() => done(false)}>Chưa nhớ</button>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
