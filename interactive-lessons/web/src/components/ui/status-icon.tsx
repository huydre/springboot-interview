/** Round ✓ / ✕ badge for a correct or wrong line; colour comes from the parent's `.ok` / `.err` class. */
export function StatusIcon({ kind }: { kind: "ok" | "err" }) {
  return <span className="co-ico" aria-hidden>{kind === "ok" ? "✓" : "✕"}</span>;
}
