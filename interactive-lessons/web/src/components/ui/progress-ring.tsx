import { useEffect, useState, type ReactNode } from "react";

/** Circular progress (0..1) drawn with an SVG stroke; fills from empty on mount. Children sit in the centre. */
export function ProgressRing({ value, size = 64, stroke = 7, tone = "var(--accent)", children, label }: { value: number; size?: number; stroke?: number; tone?: string; children?: ReactNode; label?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setV(Math.max(0, Math.min(1, value)))); return () => cancelAnimationFrame(id); }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(value * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="ring-bar" />
      </svg>
      {children && <div className="ring-in">{children}</div>}
    </div>
  );
}
