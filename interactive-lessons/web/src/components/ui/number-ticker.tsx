import { useEffect, useRef, useState } from "react";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts up (or down) to `value` with an ease-out curve; tabular digits so the width never jumps. */
export function NumberTicker({ value, duration = 900, format = (n: number) => n.toLocaleString("vi-VN") }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(reduced() ? value : 0);
  const from = useRef(shown);
  useEffect(() => {
    if (reduced()) { setShown(value); return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3)));
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration]);
  return <span className="ticker">{format(shown)}</span>;
}
