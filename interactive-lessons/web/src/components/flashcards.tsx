import { useState } from "react";
import { RichText } from "./rich-text";

/** Tap a card to flip between the question and the answer; cards you flipped stay marked so you can see what you reviewed. */
export function Flashcards({ cards }: { cards: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [seen, setSeen] = useState<Record<number, boolean>>({});
  const flip = (i: number) => { setOpen((o) => ({ ...o, [i]: !o[i] })); setSeen((s) => ({ ...s, [i]: true })); };
  return (
    <>
      <div className="cards">
        {cards.map((c, i) => (
          <button key={c.q} className={`card ${open[i] ? "flipped" : ""} ${seen[i] ? "seen" : ""}`} onClick={() => flip(i)} aria-pressed={!!open[i]}>
            <small>{open[i] ? "Trả lời" : "Câu hỏi"}</small>
            <span><RichText text={open[i] ? c.a : c.q} /></span>
          </button>
        ))}
      </div>
      <p className="muted">Đã lật {Object.keys(seen).length}/{cards.length} thẻ. Thử trả lời thành tiếng trước khi bấm.</p>
    </>
  );
}
