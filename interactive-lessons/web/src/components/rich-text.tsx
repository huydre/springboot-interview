type Part = { text: string; code: boolean; bold: boolean };

/** Splits prose into `code` spans (taken literally, so `/api/**` stays as is) and text, where each ** outside code toggles bold. */
function parse(text: string): Part[] {
  const parts: Part[] = [];
  let bold = false;
  for (const chunk of text.split(/(`[^`]+`)/g)) {
    if (chunk.startsWith("`") && chunk.endsWith("`") && chunk.length > 1) {
      parts.push({ text: chunk.slice(1, -1), code: true, bold });
      continue;
    }
    chunk.split("**").forEach((t, i) => {
      if (i > 0) bold = !bold;
      if (t) parts.push({ text: t, code: false, bold });
    });
  }
  return parts;
}

/** Renders `inline code` and **bold** spans inside plain lesson prose; bold may wrap code. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parse(text).map((p, i) => {
        const inner = p.code ? <code>{p.text}</code> : p.text;
        return p.bold ? <strong key={i}>{inner}</strong> : <span key={i}>{inner}</span>;
      })}
    </>
  );
}
