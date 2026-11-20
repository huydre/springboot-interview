import { useEffect, useRef, useSyncExternalStore } from "react";
import { dismissToast, flushPendingToast, getToasts, subscribeToasts, type ToastItem } from "../../lib/toast";

const ICON = { success: "✓", error: "!", info: "i" } as const;

function Toast({ t }: { t: ToastItem }) {
  const timer = useRef<number>(0);
  const start = () => { timer.current = window.setTimeout(() => dismissToast(t.id), t.ms); };
  const stop = () => window.clearTimeout(timer.current);
  useEffect(() => { start(); return stop; }, []);
  return (
    <div className={`toast ${t.kind}`} role={t.kind === "error" ? "alert" : "status"} onMouseEnter={stop} onMouseLeave={start}>
      <span className="toast-ico" aria-hidden>{ICON[t.kind]}</span>
      <div className="toast-body">
        <strong>{t.title}</strong>
        {t.message && <p>{t.message}</p>}
      </div>
      <button className="toast-x" aria-label="Đóng thông báo" onClick={() => dismissToast(t.id)}>×</button>
      <i className="toast-bar" style={{ animationDuration: `${t.ms}ms` }} />
    </div>
  );
}

/** Renders the toast stack (bottom right). Mounted once per page. */
export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { flushPendingToast(); }, []);
  // A popover lives in the browser's top layer, so toasts stay above an open modal dialog and its backdrop.
  // Re-showing it on every change moves it above whatever entered the top layer after it.
  useEffect(() => {
    const el = root.current as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el?.showPopover) return;
    try { el.hidePopover?.(); } catch { /* not open yet */ }
    if (items.length) el.showPopover();
  }, [items]);
  return <div ref={root} className="toaster" popover="manual" aria-live="polite">{items.map((t) => <Toast key={t.id} t={t} />)}</div>;
}
