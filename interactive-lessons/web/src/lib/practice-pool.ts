import { courses, lessons } from "../data/course";
import { programById } from "../data/programs";
import type { QuizQuestion } from "../data/types";
import { progressUnits } from "../progress";

/** One practice item drawn from the lessons: a section quiz (graded automatically) or a flashcard (answered in words, graded by the learner). */
export type PoolItem = {
  id: string;
  slug: string;
  courseId: string;
  /** Lesson title and, for quizzes, the section title: where to go back and re-read. */
  where: string;
  /** Link back to the source: the lesson, or the section anchor for quizzes. */
  href: string;
  kind: "quiz" | "card";
  quiz?: QuizQuestion;
  q?: string;
  a?: string;
};

/** The knowledge stages of the Java Interview program (labs, review and the SQL course are not drawn from). */
export const stageCourses = () => {
  const ids = programById("java-interview")?.roadmap?.stages.map((s) => s.id) ?? [];
  return ids.map((id) => courses.find((c) => c.id === id)!).filter(Boolean);
};

let cache: PoolItem[] | null = null;

/** Every quiz and flashcard of the Java Interview stages, in roadmap order. Ids are stable: `slug:sectionId` and `slug#c<index>`. */
export function practicePool(): PoolItem[] {
  if (cache) return cache;
  const out: PoolItem[] = [];
  for (const c of stageCourses()) {
    for (const { slug, title } of c.lessons) {
      const l = lessons[slug];
      if (!l) continue;
      for (const u of progressUnits(l.sections)) {
        if (u.quiz) out.push({ id: `${slug}:${u.id}`, slug, courseId: c.id, where: `${title} · ${u.title}`, href: `?bai=${slug}#${u.id}`, kind: "quiz", quiz: u.quiz });
      }
      (l.cards ?? []).forEach((card, i) => out.push({ id: `${slug}#c${i}`, slug, courseId: c.id, where: title, href: `?bai=${slug}`, kind: "card", q: card.q, a: card.a }));
    }
  }
  cache = out;
  return out;
}

/** Small seeded PRNG, so a day's deck or a mock set is stable across reloads. */
export function seeded(seedText: string) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
