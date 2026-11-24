import { useMemo, useState } from "react";
import { markStudyDay } from "../lib/cloud-progress";
import { keyPoints, suggestCovered } from "../lib/answer-match";
import "../styles/practice.css";

type Lang = "vi" | "en";
type Saved = { text: string; ticks: number[]; lang: Lang };
const keyOf = (slug: string) => `interviewlab.${slug}.answer`;
const load = (slug: string): Saved | null => {
  try { return JSON.parse(localStorage.getItem(keyOf(slug)) || "null"); } catch { return null; }
};

/**
 * "Trả lời thử": the learner writes an answer first, then sees the model answer split into key points and ticks the ones
 * they covered. Ticks that share enough key words with the written answer are pre-selected as a suggestion.
 * The model answer comes in Vietnamese and, when available, English.
 */
export function AnswerPractice({ slug, vi, en }: { slug: string; vi: string; en?: string }) {
  const saved = useMemo(() => load(slug), [slug]);
  const [lang, setLang] = useState<Lang>(saved?.lang ?? "vi");
  const [text, setText] = useState(saved?.text ?? "");
  const [ticks, setTicks] = useState<number[] | null>(saved?.ticks ?? null);
  const [peek, setPeek] = useState(false);
  const model = lang === "en" && en ? en : vi;
  const points = useMemo(() => keyPoints(model), [model]);
  const checking = ticks !== null;

  const persist = (next: Saved) => localStorage.setItem(keyOf(slug), JSON.stringify(next));
  const check = () => {
    const t = suggestCovered(points, text);
    setTicks(t);
    persist({ text, ticks: t, lang });
    void markStudyDay();
  };
  const toggle = (i: number) => {
    const t = ticks!.includes(i) ? ticks!.filter((x) => x !== i) : [...ticks!, i];
    setTicks(t);
    persist({ text, ticks: t, lang });
  };
  const switchLang = (l: Lang) => { setLang(l); setTicks(null); };
  const score = checking ? Math.round((ticks!.length / points.length) * 100) : 0;

  return (
    <div className="answer-practice">
      <div className="ap-head">
        <p className="ap-lead">Tự trả lời trước như đang ngồi phỏng vấn, rồi đối chiếu với các ý chính của bài mẫu.</p>
        {en && (
          <div className="ap-lang" role="group" aria-label="Ngôn ngữ trả lời">
            <button className={lang === "vi" ? "on" : ""} onClick={() => switchLang("vi")}>Tiếng Việt</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => switchLang("en")}>English</button>
          </div>
        )}
      </div>
      <textarea
        className="ap-input"
        rows={6}
        value={text}
        placeholder={lang === "en" ? "Type your answer in English, as you would say it out loud..." : "Gõ câu trả lời của bạn, như đang nói với người phỏng vấn..."}
        onChange={(e) => { setText(e.target.value); if (checking) setTicks(null); }}
      />
      <div className="ap-actions">
        <button className="btn primary" disabled={text.trim().length < 20} onClick={check}>Đối chiếu với bài mẫu</button>
        {!checking && <button className="btn ghost" onClick={() => setPeek(!peek)}>{peek ? "Ẩn bài mẫu" : "Xem bài mẫu luôn"}</button>}
        <small className="muted">{text.trim().split(/\s+/).filter(Boolean).length} từ</small>
      </div>
      {checking && (
        <div className="ap-check">
          <p className="ap-score"><strong>{ticks!.length}/{points.length}</strong> ý chính ({score}%). Máy đã tick sẵn các ý có nhiều từ khoá trùng với câu của bạn; hãy tự chỉnh lại cho đúng.</p>
          <ol className="ap-points">
            {points.map((p, i) => (
              <li key={i}>
                <label className={ticks!.includes(i) ? "hit" : ""}>
                  <input type="checkbox" checked={ticks!.includes(i)} onChange={() => toggle(i)} />
                  <span>{p}</span>
                </label>
              </li>
            ))}
          </ol>
          <p className="muted">{score >= 80 ? "Rất tốt. Thử nói lại thành tiếng trong 60 giây." : score >= 50 ? "Ổn. Các ý chưa tick là chỗ cần ôn lại trong bài." : "Còn thiếu nhiều ý. Đọc lại các phần ở trên rồi thử lần nữa."}</p>
        </div>
      )}
      {(peek || checking) && <blockquote lang={lang}>"{model}"</blockquote>}
    </div>
  );
}
