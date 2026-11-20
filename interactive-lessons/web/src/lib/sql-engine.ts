import type { PGlite } from "@electric-sql/pglite";
import dataset from "../data/sql/t24-bank.sql?raw";

/** Column name plus its PostgreSQL type OID (1082 date, 1114 timestamp, 1700 numeric...), used to format cells. */
export type SqlField = { name: string; type: number };
export type SqlResult = { fields: SqlField[]; rows: unknown[][]; ms: number; command: string; affected: number };

let dbPromise: Promise<PGlite> | null = null;

/** One in-memory PostgreSQL (PGlite, WebAssembly) shared by every SQL lab on the page, loaded with the T24 bank dataset. */
async function create(): Promise<PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.exec(dataset);
  return db;
}

export function getDb(): Promise<PGlite> {
  dbPromise ??= create();
  return dbPromise;
}

/** Throws away every change and reloads the original dataset. */
export async function resetDb(): Promise<void> {
  const old = dbPromise;
  dbPromise = create();
  await dbPromise;
  if (old) void old.then((d) => d.close()).catch(() => undefined);
}

/** Runs one or more statements; the result of the last statement that returns columns is shown, else the last statement's row count. */
export async function runSql(sql: string): Promise<SqlResult> {
  const db = await getDb();
  const t0 = performance.now();
  const results = await db.exec(sql, { rowMode: "array" });
  const ms = performance.now() - t0;
  const withCols = [...results].reverse().find((r) => r.fields.length > 0);
  const last = results[results.length - 1];
  const r = withCols ?? last;
  return {
    fields: r ? r.fields.map((f) => ({ name: f.name, type: f.dataTypeID })) : [],
    rows: (r?.rows as unknown[][]) ?? [],
    ms,
    command: "",
    affected: last?.affectedRows ?? 0,
  };
}

/** One cell as text: NULL, dates without the time part, everything else as PostgreSQL would print it. */
export function formatCell(v: unknown, type: number): string {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Date) {
    const iso = v.toISOString();
    return type === 1082 ? iso.slice(0, 10) : iso.slice(0, 19).replace("T", " ");
  }
  if (Array.isArray(v)) return `{${v.join(",")}}`;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Two results match when they have the same columns count and the same rows (any order unless `ordered`). */
export function sameResult(a: SqlResult, b: SqlResult, ordered: boolean): boolean {
  if (a.fields.length !== b.fields.length || a.rows.length !== b.rows.length) return false;
  const key = (res: SqlResult) => res.rows.map((r) => JSON.stringify(r.map((c, i) => formatCell(c, res.fields[i].type))));
  const ka = key(a);
  const kb = key(b);
  if (!ordered) {
    ka.sort();
    kb.sort();
  }
  return ka.every((k, i) => k === kb[i]);
}
