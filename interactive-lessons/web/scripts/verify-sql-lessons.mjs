// Runs every SQL exercise's solution (and its `verify` query) of src/data/lessons/sql-*.ts on the T24 dataset in PGlite.
// Usage: node scripts/verify-sql-lessons.mjs [slug ...]      (no slug = every sql and sql-* lesson)
// Prints each exercise with its row count; exits 1 on a SQL error, an empty result, or a missing field.
import { PGlite } from "@electric-sql/pglite";
import { stripTypeScriptTypes } from "node:module";
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname;
const dataset = readFileSync(join(root, "src/data/sql/t24-bank.sql"), "utf8");
const want = process.argv.slice(2);
const files = readdirSync(join(root, "src/data/lessons")).filter((f) => /^sql(-.*)?\.ts$/.test(f)).filter((f) => !want.length || want.includes(f.replace(/\.ts$/, "")));
const tmp = mkdtempSync(join(tmpdir(), "sqlv-"));

async function load(file) {
  let src = readFileSync(join(root, "src/data/lessons", file), "utf8");
  src = src.replace(/^import .*\.json";?\s*$/gm, "const timeline = [];").replace(/^import type .*$/gm, "");
  // Lessons may build compare blocks with the small pattern-kit helpers: compile that module next to them.
  if (src.includes('"./pattern-kit"')) {
    const kit = readFileSync(join(root, "src/data/lessons/pattern-kit.ts"), "utf8").replace(/^import type .*$/gm, "");
    writeFileSync(join(tmp, "pattern-kit.mjs"), stripTypeScriptTypes(kit));
    src = src.replace('"./pattern-kit"', '"./pattern-kit.mjs"');
  }
  const js = stripTypeScriptTypes(src);
  const out = join(tmp, file.replace(/\.ts$/, ".mjs"));
  writeFileSync(out, js);
  const mod = await import(pathToFileURL(out).href);
  return Object.values(mod)[0];
}

const fresh = async () => { const db = new PGlite(); await db.exec(dataset); return db; };
const lastRows = (res) => [...res].reverse().find((r) => r.fields.length > 0)?.rows ?? [];
let problems = 0;
const bad = (m) => { problems++; console.log("  PROBLEM:", m); };

for (const f of files) {
  const lesson = await load(f);
  console.log(`\n${lesson.slug}: ${lesson.sections.length} sections, ${lesson.sections.filter((s) => s.sql).length} with SQL labs`);
  if (lesson.sections.length === 0) bad("no sections (still a placeholder)");
  // Follow-up parts carry their own SQL labs, so check them too.
  for (const s of lesson.sections.flatMap((x) => [x, ...(x.parts ?? [])])) {
    for (const [i, ex] of (s.sql ?? []).entries()) {
      const tag = `${s.id} #${i + 1}`;
      for (const k of ["prompt", "starter", "solution"]) if (!ex[k]?.trim()) bad(`${tag}: missing ${k}`);
      if (!ex.solution) continue;
      try {
        const db = await fresh();
        let rows;
        if (ex.verify) {
          await db.exec(ex.solution);
          rows = lastRows(await db.exec(ex.verify));
        } else rows = lastRows(await db.exec(ex.solution));
        console.log(`  ok  ${tag}: ${rows.length} rows${ex.ordered ? " (ordered)" : ""}${ex.verify ? " (verify)" : ""}`);
        if (rows.length === 0) bad(`${tag}: solution returns no rows`);
        if (/ORDER BY/i.test(ex.solution) && !ex.ordered && !ex.verify) console.log(`  note ${tag}: solution has ORDER BY but ordered is not set`);
        await db.close();
      } catch (e) {
        bad(`${tag}: ${e.message}`);
      }
    }
    if (s.quiz) {
      const { options, answer } = s.quiz;
      if (!(answer >= 0 && answer < options.length)) bad(`${s.id}: quiz answer index out of range`);
    }
  }
}
console.log(problems ? `\n${problems} problem(s)` : "\nall good");
process.exit(problems ? 1 : 0);
