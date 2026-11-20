import { glossary } from "../data/glossary";
import { TermTip } from "./ui/term-tip";

type Part = { text: string; code: boolean; bold: boolean; term?: string };

/**
 * Splits prose into `code` spans (taken literally, so `/api/**` stays as is), glossary terms written {{key}} or
 * {{key|shown text}}, and plain text, where each ** outside code toggles bold.
 */
function parse(text: string): Part[] {
  const parts: Part[] = [];
  let bold = false;
  for (const piece of text.split(/(\{\{[^}]+\}\})/g)) {
    if (piece.startsWith("{{") && piece.endsWith("}}")) {
      const [key, shown] = piece.slice(2, -2).split("|");
      parts.push({ text: shown ?? glossary[key]?.label ?? key, code: false, bold, term: key });
      continue;
    }
    for (const chunk of piece.split(/(`[^`]+`)/g)) {
      if (chunk.startsWith("`") && chunk.endsWith("`") && chunk.length > 1) {
        parts.push({ text: chunk.slice(1, -1), code: true, bold });
        continue;
      }
      chunk.split("**").forEach((t, i) => {
        if (i > 0) bold = !bold;
        if (t) parts.push({ text: t, code: false, bold });
      });
    }
  }
  return parts;
}

/** Renders `inline code`, **bold** spans and {{glossary terms}} (hover card) inside plain lesson prose; bold may wrap code. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parse(text).map((p, i) => {
        if (p.term && glossary[p.term]) {
          const tip = <TermTip term={glossary[p.term]}>{p.text}</TermTip>;
          return p.bold ? <strong key={i}>{tip}</strong> : <span key={i}>{tip}</span>;
        }
        const inner = p.code ? <code>{p.text}</code> : p.text;
        return p.bold ? <strong key={i}>{inner}</strong> : <span key={i}>{inner}</span>;
      })}
    </>
  );
}
