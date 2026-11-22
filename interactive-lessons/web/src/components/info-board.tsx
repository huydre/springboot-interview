import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Code } from "./code-block";
import { RichText } from "./rich-text";

/** A method or box in a diagram. `mark` adds a small round badge in front of the label. */
export type BoardNode = { label: string; mark?: "plus" | "minus" | "ok" | "calc" };

/** The three diagram shapes the board knows. Each card picks one. */
export type BoardDiagram =
  /** Several methods feed one class; a side panel lists the rules that class guards. */
  | { kind: "hub"; inputs: BoardNode[]; center: string; rulesTitle: string; rules: string[] }
  /** Steps run top to bottom, then split into a success and a failure outcome. */
  | { kind: "flow"; steps: string[]; ok: [string, string]; bad: [string, string]; /** Both outcomes are valid (hit or miss, new or update): draw them in blue with arrows instead of green tick and red cross. */ neutral?: boolean }
  /** Input → one processor → output, with the extra classes you do not need crossed out below. */
  | { kind: "pipe"; from: string; via: string; to: string; skipped: string[]; skippedLabel: string };

export type BoardCard = { title: string; diagram: BoardDiagram; notes?: string[]; code?: string; takeaway: string };

export type Board = {
  /** Headline; the part in `highlight` is coloured. */
  title: string;
  highlight?: string;
  chips?: string[];
  cards: BoardCard[];
  conclusion: string;
};

/** `--i` drives the stagger delay of each animated piece inside a card. */
const at = (i: number) => ({ "--i": i }) as CSSProperties;

function Check() {
  return (
    <svg className="ib-check" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" />
      <path d="M7 12.5l3.2 3.2L17 9" />
    </svg>
  );
}

const MARK: Record<NonNullable<BoardNode["mark"]>, string> = { plus: "+", minus: "−", ok: "✓", calc: "=" };

function Hub({ d }: { d: Extract<BoardDiagram, { kind: "hub" }> }) {
  return (
    <div className="ib-hub">
      <ul className="ib-inputs">
        {d.inputs.map((n, i) => (
          <li key={n.label} className={`ib-node ib-a ib-in-${n.mark ?? "none"}`} style={at(i)}>
            {n.mark && <b className="ib-mark">{MARK[n.mark]}</b>}
            <code>{n.label}</code>
          </li>
        ))}
      </ul>
      <div className="ib-bracket ib-draw-y" style={at(d.inputs.length)} aria-hidden />
      <div className="ib-center ib-a ib-pop" style={at(d.inputs.length + 1)}>{d.center}</div>
      <div className="ib-rules ib-a" style={at(d.inputs.length + 2)}>
        <b>{d.rulesTitle}</b>
        <ul>{d.rules.map((r) => <li key={r}><RichText text={r} /></li>)}</ul>
      </div>
    </div>
  );
}

function Flow({ d }: { d: Extract<BoardDiagram, { kind: "flow" }> }) {
  const n = d.steps.length;
  return (
    <div className="ib-flow">
      {d.steps.map((s, i) => (
        <div key={s} className="ib-flow-step">
          {i > 0 && <span className="ib-down ib-draw-y" style={at(i * 2 - 1)} aria-hidden />}
          <code className={`ib-node ib-a ${i === 0 ? "ib-primary" : ""}`} style={at(i * 2)}>{s}</code>
        </div>
      ))}
      <div className="ib-split ib-draw-x" style={at(n * 2)} aria-hidden />
      <div className="ib-outcomes">
        {([["ok", d.ok], ["bad", d.bad]] as const).map(([k, [label, end]], j) => (
          <div key={k} className={`ib-out ib-${d.neutral ? "info" : k}`}>
            <span className="ib-tag ib-a" style={at(n * 2 + 1 + j)}>{d.neutral ? "→" : k === "ok" ? "✓" : "✕"} {label}</span>
            <span className="ib-down ib-draw-y" style={at(n * 2 + 2 + j)} aria-hidden />
            <b className="ib-end ib-a ib-pop" style={at(n * 2 + 3 + j)}>{end}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pipe({ d }: { d: Extract<BoardDiagram, { kind: "pipe" }> }) {
  return (
    <div className="ib-pipe">
      <div className="ib-row">
        <span className="ib-node ib-a" style={at(0)}>{d.from}</span>
        <span className="ib-right ib-draw-x" style={at(1)} aria-hidden />
        <code className="ib-node ib-primary ib-a ib-pop" style={at(2)}>{d.via}</code>
        <span className="ib-right ib-draw-x" style={at(3)} aria-hidden />
        <span className="ib-node ib-a" style={at(4)}>{d.to}</span>
      </div>
      <div className="ib-skipped">
        {d.skipped.map((s, i) => <code key={s} className="ib-node ib-x ib-a" style={at(5 + i)}>✕ {s}</code>)}
      </div>
      <div className="ib-brace ib-a" style={at(5 + d.skipped.length)}><i aria-hidden />{d.skippedLabel}</div>
    </div>
  );
}

const DIAGRAM: { [K in BoardDiagram["kind"]]: (d: Extract<BoardDiagram, { kind: K }>) => ReactNode } = {
  hub: (d) => <Hub d={d} />,
  flow: (d) => <Flow d={d} />,
  pipe: (d) => <Pipe d={d} />,
};

function renderDiagram(d: BoardDiagram) {
  return (DIAGRAM[d.kind] as (x: BoardDiagram) => ReactNode)(d);
}

/** One numbered card. It plays its entrance once, when it first scrolls into view; "Chạy lại" replays it. */
function Card({ card, n }: { card: BoardCard; n: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ib-card ${shown ? "in" : ""}`} style={at(n)}>
      <header className="ib-head">
        <span className="ib-num">{n}</span>
        <h5>{card.title}</h5>
        <button type="button" className="ib-replay" onClick={() => setRun((r) => r + 1)} aria-label={`Chạy lại hiệu ứng thẻ ${n}`}>↻ Chạy lại</button>
      </header>
      {/* Remounting on `run` restarts every CSS animation inside the card. */}
      <div key={run} className="ib-body">
        <div className="ib-diagram">{renderDiagram(card.diagram)}</div>
        <div className="ib-side">
          {card.notes && <div className="ib-notes">{card.notes.map((t, i) => <p key={t} className="ib-note ib-a" style={at(10 + i)}><RichText text={t} /></p>)}</div>}
          {card.code && <div className="ib-code ib-a" style={at(12)}><Code>{card.code}</Code></div>}
        </div>
        <p className="ib-take ib-a" style={at(14)}><Check /><span><RichText text={card.takeaway} /></span></p>
      </div>
    </div>
  );
}

/** Infographic-style board: headline, chips, numbered cards with a small animated diagram and code, and a conclusion bar. */
export function InfoBoard({ board }: { board: Board }) {
  const [before, after] = board.highlight ? board.title.split(board.highlight) : [board.title, ""];
  return (
    <div className="ib">
      <h4 className="ib-title">
        {before}
        {board.highlight && <em>{board.highlight}</em>}
        {after}
      </h4>
      {board.chips && <div className="ib-chips">{board.chips.map((c) => <span key={c} className="ib-chip"><RichText text={c} /></span>)}</div>}
      {board.cards.map((c, i) => <Card key={c.title} card={c} n={i + 1} />)}
      <p className="ib-final"><Check /><span><RichText text={board.conclusion} /></span></p>
    </div>
  );
}
