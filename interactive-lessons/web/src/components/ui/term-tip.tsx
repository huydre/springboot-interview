import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Term } from "../../data/glossary";

type PopoverEl = HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void };
type Place = { left: number; top: number; arrow: number; side: "top" | "bottom" };
type Phase = "closed" | "open" | "closing";

const GAP = 12;
const EDGE = 12;
const EXIT_MS = 120;

/**
 * A term with a dotted underline that opens a small definition card on hover, keyboard focus or tap.
 * The card is a popover (browser top layer): it is never clipped by a scrolling container and stays above dialogs.
 * It scales in from the term, points at it with an arrow, and fades out before it is removed.
 */
export function TermTip({ term, children }: { term: Term; children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [place, setPlace] = useState<Place | null>(null);
  const trigger = useRef<HTMLSpanElement>(null);
  const card = useRef<PopoverEl>(null);
  const timer = useRef(0);
  const id = useId();
  const mounted = phase !== "closed";

  const open = (delay = 90) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase("open"), delay);
  };
  const close = (delay = 80) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPhase((p) => (p === "open" ? "closing" : p));
      timer.current = window.setTimeout(() => { setPhase("closed"); setPlace(null); }, EXIT_MS);
    }, delay);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Place the card above the term (below when there is no room), centred, kept inside the viewport, arrow on the term.
  useLayoutEffect(() => {
    const t = trigger.current;
    const c = card.current;
    if (!mounted || !t || !c) return;
    try { c.showPopover?.(); } catch { /* already open */ }
    if (phase !== "open") return;
    const r = t.getBoundingClientRect();
    const w = c.offsetWidth;
    const h = c.offsetHeight;
    const centre = r.left + r.width / 2;
    const left = Math.max(EDGE, Math.min(centre - w / 2, window.innerWidth - w - EDGE));
    const above = r.top - h - GAP >= EDGE;
    setPlace({ left, top: above ? r.top - h - GAP : r.bottom + GAP, arrow: Math.max(18, Math.min(centre - left, w - 18)), side: above ? "top" : "bottom" });
  }, [mounted, phase]);

  useEffect(() => {
    const c = card.current;
    if (mounted || !c) return;
    try { c.hidePopover?.(); } catch { /* already closed */ }
  }, [mounted]);

  // The card is fixed to the viewport, so close it at once when the page moves under it.
  useEffect(() => {
    if (!mounted) return;
    const stop = () => { window.clearTimeout(timer.current); setPhase("closed"); setPlace(null); };
    window.addEventListener("scroll", stop, true);
    window.addEventListener("resize", stop);
    return () => { window.removeEventListener("scroll", stop, true); window.removeEventListener("resize", stop); };
  }, [mounted]);

  const style: CSSProperties & Record<string, string | number> = place
    ? { left: place.left, top: place.top, "--arrow": `${place.arrow}px` }
    : { visibility: "hidden", left: 0, top: 0 };

  return (
    <>
      <span
        ref={trigger}
        className={`tt${phase === "open" ? " on" : ""}`}
        tabIndex={0}
        aria-describedby={mounted ? id : undefined}
        onMouseEnter={() => open()}
        onMouseLeave={() => close()}
        onFocus={() => open(0)}
        onBlur={() => close(0)}
        onClick={() => (phase === "open" ? close(0) : open(0))}
        onKeyDown={(e) => { if (e.key === "Escape") close(0); }}
      >
        {children}
      </span>
      {mounted && (
        <div
          ref={card}
          id={id}
          role="tooltip"
          popover="manual"
          className="tt-card"
          data-side={place?.side ?? "top"}
          data-phase={phase}
          style={style}
          onMouseEnter={() => open(0)}
          onMouseLeave={() => close()}
        >
          <span className="tt-arrow" aria-hidden />
          <div className="tt-head">
            <span className="tt-dot" aria-hidden>i</span>
            <strong>{term.label}</strong>
          </div>
          <p>{term.def}</p>
          {term.eg && <p className="tt-eg"><b>Ví dụ</b>{term.eg}</p>}
        </div>
      )}
    </>
  );
}
