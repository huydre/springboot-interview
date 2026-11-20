// Loads the generated T24 dataset into PGlite (the same engine the lessons use) and checks the invariants the lessons rely on.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
await db.exec(readFileSync(new URL("../src/data/sql/t24-bank.sql", import.meta.url), "utf8"));
const one = async (sql) => (await db.query(sql)).rows;
const checks = [
  ["balance = sum(entries) for every account", `SELECT count(*)::int AS bad FROM account a LEFT JOIN (SELECT account_id, SUM(amount) s FROM stmt_entry GROUP BY account_id) e ON e.account_id = a.account_id WHERE a.working_balance <> COALESCE(e.s, 0)`],
  ["every DONE transfer has exactly 2 entries", `SELECT count(*)::int AS bad FROM funds_transfer f WHERE f.status = 'DONE' AND (SELECT count(*) FROM stmt_entry s WHERE s.ft_id = f.ft_id) <> 2`],
  ["no non-loan account below zero", `SELECT count(*)::int AS bad FROM account a JOIN category c USING (category_id) WHERE c.product_group <> 'LOAN' AND a.working_balance < 0`],
  ["PENDING/FAILED transfers have no entries", `SELECT count(*)::int AS bad FROM funds_transfer f WHERE f.status <> 'DONE' AND EXISTS (SELECT 1 FROM stmt_entry s WHERE s.ft_id = f.ft_id)`],
  ["entries of one DONE transfer sum to zero", `SELECT count(*)::int AS bad FROM (SELECT ft_id, SUM(amount) s FROM stmt_entry WHERE ft_id IS NOT NULL GROUP BY ft_id HAVING SUM(amount) <> 0) x`],
];
let failed = 0;
for (const [name, sql] of checks) {
  const [{ bad }] = await one(sql);
  console.log(bad === 0 ? "ok  " : "FAIL", name, bad ? `(${bad})` : "");
  if (bad) failed++;
}
for (const t of ["company", "account_officer", "sector", "currency", "category", "txn_type", "customer", "account", "funds_transfer", "stmt_entry", "loan"]) {
  const [{ n }] = await one(`SELECT count(*)::int AS n FROM ${t}`);
  console.log(t.padEnd(16), n);
}
const [r] = await one(`SELECT count(*) FILTER (WHERE mobile IS NULL)::int AS no_mobile, count(*) FILTER (WHERE email IS NULL)::int AS no_email, count(*) FILTER (WHERE birth_date IS NULL)::int AS no_birth FROM customer`);
console.log("NULLs in customer:", JSON.stringify(r));
process.exit(failed ? 1 : 0);
