/** Splits a model answer into key points: one sentence each (a sentence ends at . ! or ? followed by a capital letter). */
export function keyPoints(answer: string): string[] {
  return answer.split(/(?<=[.!?])\s+(?=[\p{Lu}"`@])/u).map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Lowercase, drop Vietnamese diacritics (đ becomes d), keep letters, digits, @ and _ as word characters. */
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

/** Common Vietnamese and English function words that say nothing about the content (already folded). */
const STOP = new Set(
  ("em toi minh ban va la cua thi khi cho voi cac mot nhung duoc khong nay do de nen vi roi ma co nhu trong theo se da cung hay hoac bang lai ra vao tu toi den " +
   "neu con chi rat nhieu it hon nhat moi cung luc sau truoc tren duoi gi nao ai dau day kia ay vay nhe a o the " +
   "i the and or of to in on for with is are be it that this as at by an my we you not but so if then when").split(" "),
);

/** Content words of a text: folded, at least 2 characters, not a stop word. */
export function contentWords(s: string): string[] {
  return fold(s).split(/[^a-z0-9@_]+/).filter((w) => w.length >= 2 && !STOP.has(w));
}

/**
 * Indexes of the key points the written answer likely covers: at least 2 shared content words and at least 35% of the
 * point's content words present. A heuristic only; the learner corrects the ticks.
 */
export function suggestCovered(points: string[], written: string): number[] {
  const have = new Set(contentWords(written));
  return points.flatMap((p, i) => {
    const words = [...new Set(contentWords(p))];
    const hit = words.filter((w) => have.has(w)).length;
    return words.length > 0 && hit >= 2 && hit / words.length >= 0.35 ? [i] : [];
  });
}
