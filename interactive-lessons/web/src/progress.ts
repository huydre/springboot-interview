import { lessons } from "./data/course";
import type { Section } from "./data/types";

/** localStorage key holding which section quizzes of a lesson were answered correctly. */
export const quizKey = (slug: string) => `interviewlab.${slug}.quiz`;
/** The lesson opened most recently, so the roadmap can offer "học tiếp". */
export const LAST_KEY = "interviewlab.last";

/** Every unit that carries its own quiz progress: each section and each of its follow-up parts. */
export const progressUnits = (sections: Section[]) => sections.flatMap((s) => [s, ...(s.parts ?? [])]);

export type LessonProgress = { slug: string; ready: boolean; solved: number; total: number; video: boolean };

/** Quiz progress of one lesson, counted the same way as the lesson page's progress card (sections answered right). */
export function lessonProgress(slug: string): LessonProgress {
  const l = lessons[slug];
  if (!l) return { slug, ready: false, solved: 0, total: 0, video: false };
  let saved: Record<string, boolean> = {};
  try { saved = JSON.parse(localStorage.getItem(quizKey(slug)) || "{}"); } catch { /* corrupt entry counts as no progress */ }
  return { slug, ready: true, solved: progressUnits(l.sections).filter((s) => saved[s.id]).length, total: progressUnits(l.sections).length, video: l.scenes.length > 0 };
}
