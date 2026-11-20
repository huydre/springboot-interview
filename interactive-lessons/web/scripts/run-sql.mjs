// Runs SQL on the T24 dataset in PGlite and prints the result as a table.
// Usage: node scripts/run-sql.mjs "SELECT * FROM company"      or      node scripts/run-sql.mjs -f query.sql
// Every call starts from a fresh copy of the dataset, so INSERT/UPDATE/DELETE never leak between runs.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const sql = args[0] === "-f" ? readFileSync(args[1], "utf8") : args.join(" ");
if (!sql.trim()) { console.error("usage: run-sql.mjs \"SQL\" | -f file.sql"); process.exit(2); }
const db = new PGlite();
await db.exec(readFileSync(new URL("../src/data/sql/t24-bank.sql", import.meta.url), "utf8"));
const fmt = (v, t) => (v === null ? "NULL" : v instanceof Date ? v.toISOString().slice(0, t === 1082 ? 10 : 19).replace("T", " ") : Array.isArray(v) ? `{${v}}` : String(v));
try {
  const t0 = performance.now();
  const res = await db.exec(sql, { rowMode: "array" });
  const r = [...res].reverse().find((x) => x.fields.length > 0) ?? res[res.length - 1];
  if (!r || r.fields.length === 0) console.log(`ok (affected ${r?.affectedRows ?? 0})`);
  else {
    const head = r.fields.map((f) => f.name);
    const body = r.rows.map((row) => row.map((v, i) => fmt(v, r.fields[i].dataTypeID)));
    const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
    const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join(" | ");
    console.log(line(head)); console.log(w.map((n) => "-".repeat(n)).join("-+-"));
    body.slice(0, 60).forEach((b) => console.log(line(b)));
    console.log(`(${r.rows.length} rows${r.rows.length > 60 ? ", first 60 shown" : ""}, ${(performance.now() - t0).toFixed(0)} ms)`);
  }
} catch (e) { console.error("SQL ERROR:", e.message); process.exit(1); }
