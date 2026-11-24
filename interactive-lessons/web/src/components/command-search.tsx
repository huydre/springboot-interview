import { useEffect, useRef, useState } from "react";
import type { Hit } from "../lib/search-index";
import "../styles/command-search.css";

const OPEN_EVENT = "interviewlab:open-search";
/** Opens the site search from anywhere (header buttons). */
const openSearch = () => dispatchEvent(new Event(OPEN_EVENT));

/** Header button that opens the search; shows the shortcut on desktop. */
export function SearchButton() {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <button className="cs-trigger" onClick={openSearch} aria-label="Tìm kiếm (Ctrl+K)">
      <span aria-hidden="true">⌕</span> <span className="cs-trigger-text">Tìm kiếm</span> <kbd>{mac ? "⌘" : "Ctrl"} K</kbd>
    </button>
  );
}

/** Site-wide search dialog, opened with ⌘K / Ctrl+K or "/". The index (all lessons) is loaded on first open. */
export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [sel, setSel] = useState(0);
  const engine = useRef<typeof import("../lib/search-index") | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    addEventListener("keydown", onKey);
    addEventListener(OPEN_EVENT, onOpen);
    return () => { removeEventListener("keydown", onKey); removeEventListener(OPEN_EVENT, onOpen); };
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    if (!engine.current) void import("../lib/search-index").then((m) => { engine.current = m; setHits(m.search(q)); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const run = (text: string) => { setQ(text); setSel(0); setHits(engine.current ? engine.current.search(text) : []); };
  const go = (h?: Hit) => { if (!h) return; setOpen(false); location.href = h.href.startsWith("?") ? location.pathname + h.href : h.href; };

  if (!open) return null;
  return (
    <div className="cs-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="cs-dialog" role="dialog" aria-label="Tìm kiếm" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className="cs-input"
          value={q}
          placeholder="Tìm bài, phần, câu hỏi... ví dụ: propagation, N+1, outbox"
          onChange={(e) => run(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === "Enter") go(hits[sel]);
          }}
        />
        <ul className="cs-list" role="listbox">
          {hits.map((h, i) => (
            <li key={h.href + i} role="option" aria-selected={i === sel} className={i === sel ? "on" : ""} onMouseEnter={() => setSel(i)} onClick={() => go(h)}>
              <span className="cs-kind">{h.kind}</span>
              <span className="cs-title">{h.title}</span>
              <small className="cs-sub">{h.sub}</small>
            </li>
          ))}
          {q.trim() && hits.length === 0 && <li className="cs-empty">Không thấy kết quả cho "{q}".</li>}
          {!q.trim() && <li className="cs-empty">Gõ từ khoá. ↑ ↓ để chọn, Enter để mở, Esc để đóng.</li>}
        </ul>
      </div>
    </div>
  );
}
