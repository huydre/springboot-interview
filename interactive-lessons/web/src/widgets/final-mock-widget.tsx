import { useEffect, useState } from "react";
import { RichText } from "../components/rich-text";
import { finalMock } from "../data/weekly-quiz-cards";

const LIMIT = 20 * 60;

/** Week-8 mixed check from study note 07: 20 questions, 20 minutes, self-scored with the note's thresholds. */
export function FinalMockWidget() {
  const [left, setLeft] = useState<number | null>(null);
  const [ok, setOk] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const score = Object.values(ok).filter(Boolean).length;
  const verdict = score >= 17 ? "Sẵn sàng." : score >= 14 ? "Ôn lại các tuần có câu sai." : "Làm lại quiz của những tuần đó và luyện Feynman thêm.";
  const mm = left === null ? "20:00" : `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  return (
    <div className="widget">
      <div className="seg small">
        <button className={left !== null && left > 0 ? "on" : ""} onClick={() => setLeft(LIMIT)}>{left === null ? "Bắt đầu bấm giờ" : "Bấm giờ lại"}</button>
        <button disabled>{mm}{left === 0 ? " · hết giờ" : ""}</button>
      </div>
      <p className="muted">Trả lời mỗi câu trong 1–2 câu nói, rồi tự đánh dấu câu trả lời đúng. Đáp án nằm ở tuần ghi trong ngoặc.</p>
      <ol className="log">
        {finalMock.map((q, n) => (
          <li key={q} className={ok[n] ? "ok" : ""}>
            <label><input type="checkbox" checked={!!ok[n]} onChange={(e) => setOk((s) => ({ ...s, [n]: e.target.checked }))} /> <RichText text={q} /></label>
          </li>
        ))}
      </ol>
      <div className={`result ${score >= 17 ? "good" : score >= 14 ? "warn" : "bad"}`}>
        {score}/20 câu đúng
        <small>{verdict} Ngưỡng: từ 17 là sẵn sàng, 14–16 ôn lại tuần có câu sai, dưới 14 làm lại quiz tuần đó.</small>
      </div>
    </div>
  );
}
