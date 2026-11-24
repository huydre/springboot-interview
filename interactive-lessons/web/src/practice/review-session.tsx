import { useMemo, useState } from "react";
import { StreakTile } from "../components/streak-tile";
import { markStudyDay } from "../lib/cloud-progress";
import { practicePool } from "../lib/practice-pool";
import { recordReview, saveDeck, todayDeck, type Deck } from "../lib/review-deck";
import { ItemView } from "./item-view";

/** Daily spaced-repetition session: up to 10 items, due and missed ones first; progress survives a reload. */
export function ReviewSession() {
  const [deck, setDeck] = useState<Deck>(() => todayDeck());
  const byId = useMemo(() => new Map(practicePool().map((p) => [p.id, p])), []);
  const items = deck.ids.map((id) => byId.get(id)).filter((x) => !!x);
  const answered = items.filter((it) => it.id in deck.results).length;
  const firstOpen = (from: number) => {
    const i = items.findIndex((it, k) => k >= from && !(it.id in deck.results));
    return i === -1 ? items.length : i;
  };
  const [pos, setPos] = useState(() => firstOpen(0));
  const current = items[pos];

  const onDone = (ok: boolean) => {
    recordReview(current.id, ok);
    const next = { ...deck, results: { ...deck.results, [current.id]: ok } };
    setDeck(next);
    saveDeck(next);
    void markStudyDay();
  };

  if (items.length === 0) return <p className="lead">Chưa có câu nào để ôn. Hãy học một bài trước.</p>;
  if (!current) {
    const right = items.filter((it) => deck.results[it.id]).length;
    return (
      <div className="pr-done">
        <h2>Xong phần ôn hôm nay: {right}/{items.length} câu đúng</h2>
        <p className="lead">Câu sai sẽ quay lại vào ngày mai. Câu đúng được giãn ra 1, 2, 4, 7, 15 rồi 30 ngày mới hỏi lại.</p>
        <ul className="pr-report">
          {items.map((it) => (
            <li key={it.id} className={deck.results[it.id] ? "ok" : "no"}>
              <span>{deck.results[it.id] ? "✓" : "✕"}</span> <a href={it.href}>{it.where}</a>
            </li>
          ))}
        </ul>
        <StreakTile />
      </div>
    );
  }

  return (
    <div className="pr-session">
      <div className="pr-progress" aria-label={`Câu ${pos + 1} trên ${items.length}`}>
        <i style={{ width: `${(answered / items.length) * 100}%` }} />
        <span>{pos + 1}/{items.length}</span>
      </div>
      <ItemView key={current.id} item={current} onDone={onDone} />
      {current.id in deck.results && (
        <button className="btn primary pr-next" onClick={() => setPos(firstOpen(pos + 1))}>
          {answered === items.length ? "Xem kết quả" : "Câu tiếp theo →"}
        </button>
      )}
    </div>
  );
}
