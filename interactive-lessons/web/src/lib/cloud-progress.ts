import { lessons } from "../data/course";
import { LAST_KEY, quizKey } from "../progress";
import { supabase } from "./supabase";

type Saved = Record<string, boolean>;
const readLocal = (slug: string): Saved => {
  try { return JSON.parse(localStorage.getItem(quizKey(slug)) || "{}"); } catch { return {}; }
};

/** Mirror one answered section to the account (no-op when signed out). */
export async function pushSection(slug: string, sectionId: string, solved: boolean) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase.from("lesson_progress").upsert({ user_id: data.session.user.id, lesson_slug: slug, section_id: sectionId, solved, updated_at: new Date().toISOString() });
}

/** Remember the lesson opened last, so "Học tiếp" follows the learner to other devices. */
export async function pushLastLesson(slug: string) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase.from("user_state").upsert({ user_id: data.session.user.id, last_lesson: slug, updated_at: new Date().toISOString() });
}

/** After sign-in: merge account progress into localStorage (a solved section is never un-solved) and upload anything only this device knows. Returns true when local data changed. */
export async function syncProgress(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const [{ data: rows, error }, { data: state }] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_slug, section_id, solved").eq("user_id", userId),
    supabase.from("user_state").select("last_lesson").eq("user_id", userId).maybeSingle(),
  ]);
  if (error) return false;
  const remote: Record<string, Saved> = {};
  for (const r of rows ?? []) (remote[r.lesson_slug] ??= {})[r.section_id] = r.solved;

  let changed = false;
  const upload: { user_id: string; lesson_slug: string; section_id: string; solved: boolean }[] = [];
  for (const slug of Object.keys(lessons)) {
    const local = readLocal(slug);
    const merged: Saved = { ...local };
    for (const [sid, ok] of Object.entries(remote[slug] ?? {})) if (ok && !merged[sid]) { merged[sid] = true; changed = true; }
    for (const [sid, ok] of Object.entries(local)) if (ok && !remote[slug]?.[sid]) upload.push({ user_id: userId, lesson_slug: slug, section_id: sid, solved: true });
    if (Object.keys(merged).length) localStorage.setItem(quizKey(slug), JSON.stringify(merged));
  }
  if (upload.length) await supabase.from("lesson_progress").upsert(upload);

  const remoteLast = state?.last_lesson as string | undefined;
  const localLast = localStorage.getItem(LAST_KEY);
  if (remoteLast && !localLast && lessons[remoteLast]) { localStorage.setItem(LAST_KEY, remoteLast); changed = true; }
  else if (localLast) await supabase.from("user_state").upsert({ user_id: userId, last_lesson: localLast, updated_at: new Date().toISOString() });
  return changed;
}
