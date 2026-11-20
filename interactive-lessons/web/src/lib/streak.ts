/** Days the learner studied (local dates, YYYY-MM-DD), for the streak tile. Synced to the account by cloud-progress. */
export const DAYS_KEY = "interviewlab.days";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function studyDays(): string[] {
  try { return JSON.parse(localStorage.getItem(DAYS_KEY) || "[]"); } catch { return []; }
}
export function saveStudyDays(days: string[]) {
  localStorage.setItem(DAYS_KEY, JSON.stringify([...new Set(days)].sort().slice(-400)));
}
/** Mark today as a study day; returns true when today is newly added. */
export function recordStudyDay(): boolean {
  const today = iso(new Date());
  const days = studyDays();
  if (days.includes(today)) return false;
  saveStudyDays([...days, today]);
  return true;
}

/** Current streak (ending today, or yesterday if today is not done yet), best streak and the last 7 days. */
export function streakInfo() {
  const set = new Set(studyDays());
  const today = new Date();
  let current = 0;
  let d = set.has(iso(today)) ? today : shift(today, -1);
  while (set.has(iso(d))) { current++; d = shift(d, -1); }
  let best = 0, run = 0, prev: string | null = null;
  for (const day of [...set].sort()) {
    run = prev && iso(shift(new Date(prev), 1)) === day ? run + 1 : 1;
    best = Math.max(best, run); prev = day;
  }
  const week = Array.from({ length: 7 }, (_, i) => { const x = shift(today, i - 6); return { day: x, done: set.has(iso(x)), today: i === 6 }; });
  return { current, best, doneToday: set.has(iso(today)), week, total: set.size };
}
