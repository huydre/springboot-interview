import { useEffect, useRef, useState } from "react";

export type Option = { value: string; label: string; hint?: string };

/** Compact custom dropdown (button + listbox popover): consistent look in both themes, keyboard friendly. */
export function Select({ value, options, onChange, label }: { value: string; options: Option[]; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const pick = (v: string) => { onChange(v); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); if (!open) { setActive(options.findIndex((o) => o.value === value)); setOpen(true); } else setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); pick(options[active].value); }
  };

  return (
    <div className="sel" ref={root} onKeyDown={onKey}>
      <button type="button" className="sel-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => { setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen((v) => !v); }}>
        <span>{current.label}</span><i aria-hidden>▾</i>
      </button>
      {open && (
        <ul className="sel-menu" role="listbox" aria-label={label}>
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value} className={`${o.value === value ? "on" : ""} ${i === active ? "act" : ""}`} onMouseEnter={() => setActive(i)} onClick={() => pick(o.value)}>
              <span>{o.label}</span>{o.hint && <small>{o.hint}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
