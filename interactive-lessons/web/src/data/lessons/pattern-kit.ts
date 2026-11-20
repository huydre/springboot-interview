import type { Outcome, Scenario, Variant } from "../../components/change-impact";

/** Short builders so a pattern section reads as data: ways to write it, and what each way costs per change request. */
export const ok = (text: string): Outcome => ({ text, kind: "ok" });
export const bad = (text: string): Outcome => ({ text, kind: "err" });
export const ask = (question: string, ...outcome: Outcome[]): Scenario => ({ ask: question, outcome });
export const way = (label: string, code: string, scenarios: Scenario[], verdict: string): Variant => ({ label, code, scenarios, verdict });
