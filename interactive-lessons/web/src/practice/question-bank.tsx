import { useMemo, useState } from "react";
import { RichText } from "../components/rich-text";
import { contentWords } from "../lib/answer-match";
import { practicePool, stageCourses } from "../lib/practice-pool";

const fold = (s: string) => contentWords(s).join(" ");

/** "Câu hỏi hay gặp": every flashcard of the Java Interview stages in one place, grouped by stage, with a filter box. */
export function QuestionBank() {
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const cards = useMemo(() => practicePool().filter((p) => p.kind === "card").map((p) => ({ ...p, hay: fold(`${p.q} ${p.a} ${p.where}`) })), []);
  const needle = fold(q);
  const shown = needle ? cards.filter((c) => needle.split(" ").every((w) => c.hay.includes(w))) : cards;

  return (
    <div className="qb">
      <input className="qb-filter" type="search" value={q} autoFocus placeholder={`Lọc ${cards.length} câu hỏi, ví dụ: transaction proxy, N+1, Kafka offset...`} onChange={(e) => setQ(e.target.value)} />
      <p className="muted">{shown.length} câu{needle ? ` khớp "${q}"` : ""}. Thử tự trả lời thành tiếng trước khi mở đáp án.</p>
      {stageCourses().map((c) => {
        const group = shown.filter((x) => x.courseId === c.id);
        if (group.length === 0) return null;
        return (
          <section key={c.id} className="qb-group">
            <h2>{c.title} <small>{group.length}</small></h2>
            {group.map((x) => (
              <details key={x.id} className="practice-item qb-item">
                <summary><RichText text={x.q!} /></summary>
                <p><RichText text={x.a!} /></p>
                <a className="qb-src" href={x.href}>Học lại: {x.where} →</a>
              </details>
            ))}
          </section>
        );
      })}
    </div>
  );
}
