import { useState, type ReactNode } from "react";

const FAN = 6;

/** Generic deck: a big card on a fanned stack. Click flips it in 3D, arrows / dots / keys move through the deck.
 *  `front` and `back` render the two faces of card `i`, so any content type can reuse the deck. */
export function FlipDeck({ count, front, back, frontLabel = "Câu hỏi", backLabel = "Trả lời", footer }: {
  count: number;
  front: (i: number) => ReactNode;
  back: (i: number) => ReactNode;
  frontLabel?: string;
  backLabel?: string;
  footer?: (seen: number) => ReactNode;
}) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Record<number, boolean>>({});
  const [dir, setDir] = useState<"next" | "prev">("next");
  /** The card that just left; it plays an exit animation on top of the new one, then unmounts. */
  const [leaving, setLeaving] = useState<{ i: number; dir: "next" | "prev"; flipped: boolean } | null>(null);
  const go = (n: number) => {
    const t = (n + count) % count;
    if (t === i) return;
    const d = n > i ? "next" : "prev";
    setLeaving({ i, dir: d, flipped });
    setDir(d);
    setFlipped(false);
    setI(t);
  };
  const flip = () => { setFlipped((f) => !f); setSeen((s) => ({ ...s, [i]: true })); };
  const behind = Math.min(FAN, count - 1);
  const seenCount = Object.keys(seen).length;
  return (
    <div className="deck" tabIndex={0} onKeyDown={(e) => {
      if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
    }}>
      <div className="deck-stage">
        {Array.from({ length: behind }, (_, k) => (
          <span key={`${i}-${k}`} className={`deck-layer ${dir}`} style={{ ["--k" as string]: behind - k, animationDelay: `${(behind - k) * 25}ms` }} aria-hidden />
        ))}
        {leaving && (
          <div key={`out-${leaving.i}-${leaving.dir}`} className={`deck-card leaving ${leaving.dir} ${leaving.flipped ? "flipped" : ""}`} aria-hidden onAnimationEnd={() => setLeaving(null)}>
            <span className="deck-face front"><small>{frontLabel} {leaving.i + 1}/{count}</small><b>{front(leaving.i)}</b></span>
            <span className="deck-face back"><small>{backLabel}</small><b>{back(leaving.i)}</b></span>
          </div>
        )}
        <button key={i} className={`deck-card ${flipped ? "flipped" : ""} ${dir}`} onClick={flip} aria-label={flipped ? "Lật về mặt trước" : "Lật xem mặt sau"}>
          <span className="deck-face front">
            <small>{frontLabel} {i + 1}/{count}</small>
            <b>{front(i)}</b>
            <em>Nhấp vào thẻ để lật</em>
          </span>
          <span className="deck-face back">
            <small>{backLabel}</small>
            <b>{back(i)}</b>
            <em>Nhấp để lật lại</em>
          </span>
        </button>
      </div>
      <div className="deck-nav">
        <button className="btn" onClick={() => go(i - 1)} aria-label="Thẻ trước">←</button>
        <div className="deck-dots">
          {Array.from({ length: count }, (_, k) => <button key={k} className={`${k === i ? "on" : ""} ${seen[k] ? "seen" : ""}`} onClick={() => go(k)} aria-label={`Thẻ ${k + 1}`} />)}
        </div>
        <button className="btn" onClick={() => go(i + 1)} aria-label="Thẻ sau">→</button>
      </div>
      {footer?.(seenCount)}
    </div>
  );
}
