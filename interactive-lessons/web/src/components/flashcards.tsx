import { RichText } from "./rich-text";
import { FlipDeck } from "./ui/flip-deck";

/** Question/answer flashcards on the shared flip deck. */
export function Flashcards({ cards }: { cards: { q: string; a: string }[] }) {
  return (
    <FlipDeck
      count={cards.length}
      front={(i) => <RichText text={cards[i].q} />}
      back={(i) => <RichText text={cards[i].a} />}
      footer={(seen) => <p className="muted">Đã lật {seen}/{cards.length} thẻ. Thử trả lời thành tiếng trước khi lật.</p>}
    />
  );
}
