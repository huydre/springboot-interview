export type ToastKind = "success" | "error" | "info";
export type ToastItem = { id: number; kind: ToastKind; title: string; message?: string; ms: number };

const PENDING_KEY = "interviewlab.pending-toast";
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeToasts = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getToasts = () => items;
export const dismissToast = (id: number) => { items = items.filter((t) => t.id !== id); emit(); };

/** Show a toast. Errors stay a little longer than confirmations. */
export function toast(kind: ToastKind, title: string, message?: string, ms = kind === "error" ? 6500 : 4200) {
  const t: ToastItem = { id: nextId++, kind, title, message, ms };
  items = [...items.slice(-3), t];
  emit();
}
toast.success = (title: string, message?: string) => toast("success", title, message);
toast.error = (title: string, message?: string) => toast("error", title, message);
toast.info = (title: string, message?: string) => toast("info", title, message, 6500);

/** For actions that reload the page: the toast appears once the next page has loaded. */
export function toastAfterReload(kind: ToastKind, title: string, message?: string) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind, title, message }));
}
export function flushPendingToast() {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return;
  sessionStorage.removeItem(PENDING_KEY);
  try { const p = JSON.parse(raw); toast(p.kind, p.title, p.message); } catch { /* ignore a corrupt entry */ }
}
