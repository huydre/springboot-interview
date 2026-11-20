import { useRef } from "react";
import { flushSync } from "react-dom";

/**
 * Theme button shared by every page. The new theme spreads as a circle from the button (View Transition API),
 * after Magic UI's AnimatedThemeToggler (MIT). Coordinates are percentages of the snapshot box, which Magic UI
 * found renders correctly on fractional display scales where pixel values do not.
 */
const DURATION = 550;

export function ThemeToggle({ theme, setTheme }: { theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const anim = useRef<Animation | null>(null);
  const next = theme === "dark" ? "light" : "dark";

  const apply = () => {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  const toggle = () => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
    const b = btn.current;
    if (busy.current) return;
    if (!b || !doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(); return; }

    const W = innerWidth, H = innerHeight;
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const maxR = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
    const at = `${(x / W) * 100}% ${(y / H) * 100}%`;
    const radius = `${(maxR / (Math.hypot(W, H) / Math.SQRT2)) * 100}%`; // circle() % resolves against hypot(w,h)/√2
    const from = `circle(0% at ${at})`, to = `circle(${radius} at ${at})`;

    const root = document.documentElement;
    busy.current = true;
    root.dataset.themeVt = "active";
    root.style.setProperty("--theme-vt-ms", `${DURATION}ms`);
    root.style.setProperty("--theme-vt-from", from); // pinned in CSS so nothing paints unclipped before the animation starts
    const cleanup = () => { anim.current?.cancel(); anim.current = null; busy.current = false; delete root.dataset.themeVt; root.style.removeProperty("--theme-vt-ms"); root.style.removeProperty("--theme-vt-from"); };

    const vt = doc.startViewTransition(() => flushSync(apply));
    vt.finished.finally(cleanup).catch(() => {});
    vt.ready.then(() => {
      anim.current = root.animate({ clipPath: [from, to] }, { duration: DURATION, easing: "ease-in-out", fill: "forwards", pseudoElement: "::view-transition-new(root)" });
    }).catch(() => {});
  };

  return (
    <button ref={btn} type="button" className="icon-btn theme-btn" aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} onClick={toggle}>
      {theme === "dark" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>
      )}
    </button>
  );
}
