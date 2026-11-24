import { lessonProgress } from "../progress";
import { practicePool, seeded, shuffle, type PoolItem } from "./practice-pool";
import { localIso } from "./streak";

/**
 * Spaced repetition with Leitner boxes. A right answer moves an item up one box and pushes its next review further out;
 * a wrong answer sends it back to box 0, due tomorrow, and counts as a miss so it is picked first.
 */
const SRS_KEY = "interviewlab.srs";
const DECK_KEY = "interviewlab.review.deck";
export const DAILY_SIZE = 10;
/** Days until the next review, by box after a right answer. */
const INTERVALS = [1, 2, 4, 7, 15, 30];

type Card = { box: number; due: string; misses: number };
type Srs = Record<string, Card>;
export type Deck = { date: string; ids: string[]; results: Record<string, boolean> };

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
};
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return localIso(d); };

export const srsState = () => read<Srs>(SRS_KEY, {});

/** Record one review: right moves the item up a box, wrong resets it and makes it due tomorrow. */
export function recordReview(id: string, ok: boolean) {
  const srs = srsState();
  const today = localIso(new Date());
  const c = srs[id] ?? { box: 0, due: today, misses: 0 };
  srs[id] = ok
    ? { box: Math.min(c.box + 1, INTERVALS.length - 1), due: addDays(today, INTERVALS[Math.min(c.box, INTERVALS.length - 1)]), misses: c.misses }
    : { box: 0, due: addDays(today, 1), misses: c.misses + 1 };
  localStorage.setItem(SRS_KEY, JSON.stringify(srs));
}

/** A quiz answered wrong inside a lesson joins the review queue (due today) unless it is already scheduled. */
export function noteLessonMiss(id: string) {
  const srs = srsState();
  const today = localIso(new Date());
  srs[id] = { box: 0, due: today, misses: (srs[id]?.misses ?? 0) + 1 };
  localStorage.setItem(SRS_KEY, JSON.stringify(srs));
}

/**
 * Today's deck: due items first (most missed, lowest box), then new items from lessons the learner has started,
 * then new items from anywhere in roadmap order. Built once per day and kept, so a reload resumes the same deck.
 */
export function todayDeck(): Deck {
  const today = localIso(new Date());
  const saved = read<Deck | null>(DECK_KEY, null);
  if (saved?.date === today) return saved;
  const pool = practicePool();
  const srs = srsState();
  const rnd = seeded(today);
  const due = pool.filter((p) => srs[p.id] && srs[p.id].due <= today)
    .sort((a, b) => srs[b.id].misses - srs[a.id].misses || srs[a.id].box - srs[b.id].box);
  const fresh = pool.filter((p) => !srs[p.id]);
  const started = new Set(fresh.map((p) => p.slug).filter((s) => lessonProgress(s).solved > 0));
  const picks: PoolItem[] = [...due];
  // Nothing started yet: draw from the earliest stage that still has new items, mixed across its lessons.
  const firstStage = fresh.find((p) => !started.has(p.slug))?.courseId;
  const notStarted = fresh.filter((p) => !started.has(p.slug));
  const groups = [shuffle(fresh.filter((p) => started.has(p.slug)), rnd), shuffle(notStarted.filter((p) => p.courseId === firstStage), rnd), notStarted];
  for (const group of groups) {
    for (const p of group) if (picks.length < DAILY_SIZE && !picks.includes(p)) picks.push(p);
  }
  const deck: Deck = { date: today, ids: picks.slice(0, DAILY_SIZE).map((p) => p.id), results: {} };
  localStorage.setItem(DECK_KEY, JSON.stringify(deck));
  return deck;
}

export function saveDeck(deck: Deck) {
  localStorage.setItem(DECK_KEY, JSON.stringify(deck));
}

/** How many items are due today or earlier, for the badge on the roadmap. */
export function dueCount(): number {
  const today = localIso(new Date());
  return Object.values(srsState()).filter((c) => c.due <= today).length;
}
